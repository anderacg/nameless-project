'use strict';
/* ---------- the way round: route-finding over the battlefield's ground (terrain phase 4; doc/TERRAIN_DESIGN.md) ----------
   A library on a grid of its own, not on B: g={C,R,cs,cost,wall,v}. cost: Uint8Array(C*R), 0 impassable, else what crossing the
   cell costs, ROUTE.unit on open ground (unit/speed: marsh dearer, a road could be cheaper). wall: Uint8Array(C*R) of edge bits,
   1<<(d>>1) for d=0 E, 2 S, 4 W, 6 N (TDX's order): no step from this cell over that edge (a cliff); set on one side only it is
   one-way. v: the grid's version, bumped by whoever edits it (routeCell and routeWall do): the step masks and the path cache
   follow it. 8 directions; a diagonal only where both cells beside it are passable and all four edges round its corner open
   (no corner cutting), and lineClear walks a corner the same way. Never Math.random; ties broken by the open list's order (f,
   then h, then cell index): the same grid and query give the same way. One query's work is bounded (ROUTE.budget cells) and
   reuses the same typed arrays (ROUTE_WS): run it per group order and re-path, not per soldier per frame */
// unit: open ground's cost; budget: cells a query expands at most; cache: paths kept per grid; deep: deep water impassable
// (routeGridOf; terrain.js passes its own: TERRAIN.wade); near: rings searched for the passable cell nearest a blocked one; dist:
// distance fields kept per grid (routeDist)
const ROUTE={unit:16,budget:4096,cache:64,deep:false,near:16,dist:8};
/* ways round obstacles for bodies (the owner, 2026-11-01: "make the pathfinder better for obstacles? right now the units seem to
   bump into boundaries, houses, etc. which sometimes make them stuck"), each part its own switch, all off as before:
   clear: each grid's clearance (routeRoom: px from each cell's middle to the nearest shut cell or two-way cliff, made once a
   version), so a search, a straight line (lineClear's r) and a step keep a body's half off walls: one grid for every body. A body
   of r keeps routeNeed's room: r, or less where no cell near has r (the middle of a lane narrower than him: never shut out);
   flow: a field toward where an army or a group goes (routeFlow: one search out from it, made only when some man's straight way is
   blocked, again when its goal moves move cells or the grid changes): who cannot walk straight goes down it (routeFlowAim), no one
   waiting for a search of his own; smooth: a way string-pulled with the body's room (routePath need); slide: a step that meets a
   wall slides along it (routeSlide), one pushed into a wall's room pushed out, one still stuck stuck s re-routes, then steps back
   back px, and one near (px) his place walks straight at it, sliding, no way laid (the map's march); footing: the map's buildings
   solid by their ground plan (march.js marchFootings), not their picture's foot. smooth also mends a way whose goal moved, where
   one of its points still reaches it straight, rather than search it afresh.
   reach: cells out the clearance is measured; past: cells of cost the field is made past the last cell it was wanted for; move:
   cells its goal moves before a field is made again; look: cells down the field a body looks for the farthest it walks to straight.
   corridor (the owner, 2026-11-02: "why some of unit decided to move away from army not follow their comrades when there's an
   obstacle blocked, should the pathfinder calculated as a whole group first then make the unit move together?"): the group first,
   then its men. An army's way through its ground (march.js MarchArmy corridor: from its rear by its guide along the guide's own way,
   each leg searched with its widest body's room) is the way its blocked men follow, their fields seeded along it (routeFlowWay: off
   it each step off times dearer), not from one point, so their slope leads into it and on down it, never round the far side of what
   it goes round; a man's own way taken only while it keeps within stray px of it, else its field; a place on a building's footing pulled in
   toward it (its side of the wall: pull). All on the march; halted, its men fan out to their places as before. In battle a group's field seeded along its way (terrain.js groupFlow). Off: as before.
   holding: a holding's centre solid on its walls' ground, its gate open (march.js holdFooting), its tiles shut to the world's ways
   (router.js holdShut), reached at its gate (holding.js reachRadius); off: its picture's foot, as before */
const PATHS={clear:true,flow:true,smooth:true,slide:true,footing:true,corridor:true,pull:true,holding:true,reach:4,past:6,move:6,look:8,stuck:.8,back:3,near:12,stray:24,off:3};
// (the 8 steps in TDX's order: E SE S SW W NW N NE)
const ROUTE_DC=[1,1,0,-1,-1,-1,0,1],ROUTE_DR=[0,1,1,1,0,-1,-1,-1];
// an open grid of C×R cells of cs px
// (a query's budget on grid g: ROUTE.budget, or a quarter of its cells on a field larger than that (a huge one: setup.js FIELD_SIZES))
const routeBudget=g=>Math.max(ROUTE.budget,(g.C*g.R)>>2);
function routeGrid(C,R,cs){const N=C*R;return{C,R,cs,cost:new Uint8Array(N).fill(ROUTE.unit),wall:new Uint8Array(N),v:1,pv:0,mv:null,off:null,lo:ROUTE.unit,memo:new Map()}}
/* the grid of a battle's ground (B.terrain): each kind's cost by TGROUND's speed for who ('foot', 'mounted' or 'big'), a bridge
   or open ground ROUTE.unit; deep water impassable when o.deep (default ROUTE.deep), else waded at its cost (as crossWay weighs
   it). For the generator to fill: a TERRAIN_GROUND entry with solid (mountains, rock spires) or a kind past TGROUND is
   impassable; T.wall, if any, is the cliffs (this file's edge bits). A steep bank (T.steep bit 2, terrain.js STEEP: World Phase 2)
   costs STEEP.route[who]×ROUTE.unit, and g.wcap is then the dearest cell a straight way crosses and is still clear (one less than
   the cheapest steep bank: terrain.js TerrainRoutes), so a way goes by a shoulder or a ramp when one is near */
function routeGridOf(T,o={}){
  const g=routeGrid(T.C,T.R,T.cs),deep=o.deep??ROUTE.deep,w=o.who||'foot',K=T.kind,U=ROUTE.unit;
  for(let i=0;i<K.length;i++){const k=K[i],Gd=TGROUND[k];g.cost[i]=k>=TGROUND.length||Gd&&Gd.solid||k===TKIND.deep&&deep?0:Gd?Math.min(255,Math.max(1,Math.round(U/(Gd.spd[w]||Gd.spd.foot)))):U}
  // (World Phase 2b: what stands by the fight: a building closed, crop rows and a fence by their speed (TERRAIN_BUILT))
  if(T.built){const Bt=T.built;for(let i=0;i<Bt.length;i++){const b=TBUILT[Bt[i]];if(!b||!g.cost[i])continue;g.cost[i]=b.solid?0:Math.min(255,Math.max(g.cost[i],Math.round(U/(b.spd[w]||b.spd.foot))))}}
  if(T.steep){const S=T.steep,c=Math.min(255,Math.round(U*STEEP.route[w]));for(let i=0;i<S.length;i++)if(S[i]&2&&g.cost[i])g.cost[i]=Math.max(g.cost[i],c);g.wcap=Math.round(U*Math.min(...Object.values(STEEP.route)))-1}
  if(T.wall)g.wall.set(T.wall);return g}
// (cell c,r's cost: 0 impassable)
function routeCell(g,c,r,k){g.cost[r*g.C+c]=k;g.v++}
// a cliff: no step from cell c,r over its edge d (0 E, 2 S, 4 W, 6 N), nor back unless one (one-way: down it, never up)
function routeWall(g,c,r,d,one){const c2=c+ROUTE_DC[d],r2=r+ROUTE_DR[d];g.wall[r*g.C+c]|=1<<(d>>1);if(!one&&c2>=0&&r2>=0&&c2<g.C&&r2<g.R)g.wall[r2*g.C+c2]|=1<<(((d+4)&7)>>1);g.v++}
// (the cell of a field point, clamped to the grid)
const routeIx=(g,x,y)=>{const c=Math.floor(x/g.cs),r=Math.floor(y/g.cs);return(r<0?0:r>=g.R?g.R-1:r)*g.C+(c<0?0:c>=g.C?g.C-1:c)};
/* (the steps each cell may take, mv: bit d to its neighbour in d; a blocked cell's too, so one standing in it can step out;
   lo: the least cost, for the heuristic; done again, and the path cache emptied, when the version moves) */
function routePrep(g){
  if(g.pv===g.v)return g;const {C,R,cost,wall}=g,N=C*R,mv=g.mv||(g.mv=new Uint8Array(N)),open=(i,d)=>!(wall[i]&1<<(d>>1));let lo=256;
  g.off=ROUTE_DC.map((dc,d)=>dc+ROUTE_DR[d]*C);
  for(let r=0,i=0;r<R;r++)for(let c=0;c<C;c++,i++){const k=cost[i];if(k&&k<lo)lo=k;let m=0;
    for(let d=0;d<8;d++){const c2=c+ROUTE_DC[d],r2=r+ROUTE_DR[d];if(c2<0||r2<0||c2>=C||r2>=R||!cost[r2*C+c2])continue;
      if(!(d&1)){if(open(i,d))m|=1<<d;continue}
      // (a diagonal: by the cell beside on x (over x, then y) and by the one on y (over y, then x), both clear)
      const dx=ROUTE_DC[d]>0?0:4,dy=ROUTE_DR[d]>0?2:6,x=i+ROUTE_DC[d],y=i+ROUTE_DR[d]*C;
      if(cost[x]&&cost[y]&&open(i,dx)&&open(x,dy)&&open(i,dy)&&open(y,dx))m|=1<<d}
    mv[i]=m}
  g.lo=lo>255?ROUTE.unit:lo;g.pv=g.v;g.memo.clear();if(g.dm)g.dm.clear();return g}
// (the work arrays, one set for every query, grown to the largest grid seen; st: this query's stamp in seen/done)
const ROUTE_WS={n:0,st:0};
function routeWs(N){const W=ROUTE_WS;
  if(W.n<N){W.n=N;W.g=new Float64Array(N);W.f=new Float64Array(N);W.h=new Float64Array(N);W.par=new Int32Array(N);W.pos=new Int32Array(N);W.hp=new Int32Array(N);W.seen=new Uint32Array(N);W.done=new Uint32Array(N);W.path=new Int32Array(N);W.px=new Float64Array(N+2);W.py=new Float64Array(N+2);W.pc=new Uint8Array(N+2);W.mk=new Uint32Array(N);W.st=0}
  if(++W.st>=0xFFFFFFFF){W.seen.fill(0);W.done.fill(0);W.mk.fill(0);W.st=1}return W}
// (the open list: a binary heap of cells by f, then h (nearer the goal first), then index; pos: each cell's place in it)
function routeUp(W,k){const hp=W.hp,pos=W.pos,f=W.f,h=W.h,i=hp[k];while(k>0){const p=(k-1)>>1,j=hp[p];if(f[j]<f[i]||f[j]===f[i]&&(h[j]<h[i]||h[j]===h[i]&&j<i))break;hp[k]=j;pos[j]=k;k=p}hp[k]=i;pos[i]=k}
function routeDown(W,k,n){const hp=W.hp,pos=W.pos,f=W.f,h=W.h,i=hp[k];
  for(;;){let c=2*k+1;if(c>=n)break;if(c+1<n){const a=hp[c],b=hp[c+1];if(f[b]<f[a]||f[b]===f[a]&&(h[b]<h[a]||h[b]===h[a]&&b<a))c++}
    const j=hp[c];if(f[i]<f[j]||f[i]===f[j]&&(h[i]<h[j]||h[i]===h[j]&&i<j))break;hp[k]=j;pos[j]=k;k=c}
  hp[k]=i;pos[i]=k}
/* A* from cell s to cell t, octile heuristic; a step costs its length (1 or √2) by the sum of both cells' costs. The cells of the
   way into W.path (s first); returns its length. W.end: t, or (t out of reach, or the budget spent first: W.cut) the cell
   reached nearest t by h; W.n: cells expanded. need: a body's room (PATHS.clear): no cell short of it (routeNeed) entered but t */
function routeSearch(g,s,t,budget,need=0){
  const W=routeWs(g.C*g.R),C=g.C,cost=g.cost,mv=g.mv,off=g.off,G=W.g,F=W.f,H=W.h,par=W.par,hp=W.hp,pos=W.pos,seen=W.seen,done=W.done,st=W.st,SQ=Math.SQRT2,k2=2*g.lo,tc=t%C,tr=(t-tc)/C,cl=need&&routeRoom(g),cm=g.cm;
  const hOf=i=>{const c=i%C,dx=c>tc?c-tc:tc-c,r=(i-c)/C,dy=r>tr?r-tr:tr-r;return(dx+dy+(SQ-2)*(dx<dy?dx:dy))*k2};
  let n=0,best=s,size=1,cut=false;seen[s]=st;G[s]=0;H[s]=hOf(s);F[s]=H[s];par[s]=-1;hp[0]=s;pos[s]=0;
  while(size){const i=hp[0];if(--size){hp[0]=hp[size];routeDown(W,0,size)}done[i]=st;
    if(H[i]<H[best]||H[i]===H[best]&&G[i]<G[best])best=i;if(i===t)break;if(n>=budget){cut=true;break}n++;
    const m=mv[i],gi=G[i],ci=cost[i]||g.lo;
    for(let d=0;d<8;d++){if(!(m&1<<d))continue;const j=i+off[d];if(done[j]===st||cl&&j!==t&&cl[j]<(cm[j]<need?cm[j]:need))continue;const ng=gi+(d&1?SQ:1)*(ci+cost[j]);
      if(seen[j]!==st){seen[j]=st;G[j]=ng;H[j]=hOf(j);F[j]=ng+H[j];par[j]=i;hp[size]=j;routeUp(W,size);size++}
      else if(ng<G[j]){G[j]=ng;F[j]=ng+H[j];par[j]=i;routeUp(W,pos[j])}}}
  const end=done[t]===st?t:best;let L=0;for(let i=end;i>=0;i=par[i])L++;for(let i=end,k=L-1;i>=0;i=par[i],k--)W.path[k]=i;
  W.end=end;W.cut=cut;W.n=n;ROUTE_N.search++;return L}
// (the searches run so far, for the tests' and the measures' counts: search (routeSearch), flow (routeFlow))
const ROUTE_N={search:0,flow:0};
// (the passable cell nearest cell i, by centres (ties: the first in ring order), within ROUTE.near rings; -1 none)
function routeNear(g,i){
  if(g.cost[i])return i;const C=g.C,R=g.R,c0=i%C,r0=(i-c0)/C;let b=-1,bd=1e9;
  for(let k=1;k<=ROUTE.near&&!(b>=0&&k*k>bd);k++)for(let r=r0-k;r<=r0+k;r++){if(r<0||r>=R)continue;const e=r===r0-k||r===r0+k;
    for(let c=c0-k;c<=c0+k;c+=e?1:2*k){if(c<0||c>=C||!g.cost[r*C+c])continue;const d=(c-c0)*(c-c0)+(r-r0)*(r-r0);if(d<bd){bd=d;b=r*C+c}}}
  return b}
/* (the walk from a to b over cells: each cell it enters passable, each edge it crosses open, a corner it passes exactly through
   crossed as a diagonal step is; cap: the dearest cell it may enter before the last. Its start cell is not tested: one stands
   there. Cells are powers of two, so a line between cell centres meets a corner exactly) */
function routeWalk(g,ax,ay,bx,by,cap){
  const cs=g.cs,C=g.C,cost=g.cost,wall=g.wall,X=C*cs-1e-6,Y=g.R*cs-1e-6;ax=ax<0?0:ax>X?X:ax;ay=ay<0?0:ay>Y?Y:ay;bx=bx<0?0:bx>X?X:bx;by=by<0?0:by>Y?Y:by;
  let c=Math.floor(ax/cs),r=Math.floor(ay/cs);const c1=Math.floor(bx/cs),r1=Math.floor(by/cs);let n=Math.abs(c1-c)+Math.abs(r1-r);if(!n)return true;
  const dx=bx-ax,dy=by-ay,sx=dx>0?1:-1,sy=dy>0?1:-1,wx=sx>0?1:4,wy=sy>0?2:8,tdx=dx?Math.abs(cs/dx):Infinity,tdy=dy?Math.abs(cs/dy):Infinity;
  let tx=dx?((sx>0?(c+1)*cs:c*cs)-ax)/dx:Infinity,ty=dy?((sy>0?(r+1)*cs:r*cs)-ay)/dy:Infinity,i=r*C+c,j;
  while(n>0){
    if(tx<ty||tx===ty&&n<2&&c!==c1){if(wall[i]&wx)return false;j=i+sx;c+=sx;tx+=tdx;n--}
    else if(ty<tx||n<2){if(wall[i]&wy)return false;j=i+sy*C;r+=sy;ty+=tdy;n--}
    else{const x=i+sx,y=i+sy*C;j=x+sy*C;if(!cost[x]||!cost[y]||wall[i]&wx||wall[x]&wy||wall[i]&wy||wall[y]&wx)return false;c+=sx;r+=sy;tx+=tdx;ty+=tdy;n-=2}
    if(c<0||r<0||c>=C||r>=g.R||!cost[j]||n>0&&cost[j]>cap)return false;i=j}
  return true}
/* can one walk straight from (ax,ay) to (bx,by) (field px): no impassable cell entered, no cliff edge crossed going its blocked
   way, no corner cut (charges; line of walk). cap: the dearest cell it may cross (default any); r: a half-width (px), the two
   lines r to each side tested too */
function lineClear(g,ax,ay,bx,by,cap=255,r=0){
  if(!routeWalk(g,ax,ay,bx,by,cap))return false;if(!(r>0))return true;
  const l=Math.hypot(bx-ax,by-ay);if(!l)return true;const nx=-(by-ay)/l*r,ny=(bx-ax)/l*r;
  return routeWalk(g,ax+nx,ay+ny,bx+nx,by+ny,cap)&&routeWalk(g,ax-nx,ay-ny,bx-nx,by-ny,cap)}
// (a body's straight way: lineClear's, and with PATHS.clear a body of r's room kept along it instead of its side lines (lineRoom,
// its end as near a wall as the end is))
function lineBody(g,ax,ay,bx,by,cap=255,r=0){return PATHS.clear&&r>0?routeWalk(g,ax,ay,bx,by,cap)&&lineRoom(g,ax,ay,bx,by,r,true):lineClear(g,ax,ay,bx,by,cap,r)}
/* the way from (ax,ay) to (bx,by), field px: waypoints [[x,y],…] after the start, the last the goal, or (the goal out of reach,
   or in an impassable cell) the point nearest it in the reachable cell nearest it. Straightened by string-pulling: a leg skips
   the cells of the way while lineClear allows it and crosses no cell dearer than those it skips. o: {budget (cells expanded at
   most: ROUTE.budget), r (the half-width a leg keeps clear, px), cache (false: no cache)}. The array carries ok (the goal
   reached), cut (the budget ran out first: part of the way, toward the goal; re-path from its end), n (cells expanded: 0 from
   a straight line or the cache). o.need: a body's room (px, PATHS.clear): no cell short of it gone through (routeSearch), and
   (PATHS.smooth) its legs keep it */
function routePath(g,ax,ay,bx,by,o={}){
  routePrep(g);const need=PATHS.clear&&o.need>0?o.need:0,C=g.C,cs=g.cs,N=C*g.R,cost=g.cost,r=PATHS.smooth&&need>(o.r||0)?need:o.r||0,t0=routeIx(g,bx,by),t=routeNear(g,t0),res=(p,ok,cut,n)=>{p.ok=ok;p.cut=cut;p.n=n;return p};
  let s=routeIx(g,ax,ay);
  if(t<0)return res([],false,false,0);
  // (an open straight line over the cheapest ground: no search)
  if(t===t0&&(need?lineBody:lineClear)(g,ax,ay,bx,by,g.lo,r))return res([[bx,by]],true,false,0);
  const s0=s;if(!cost[s]&&!g.mv[s]){s=routeNear(g,s);if(s<0)return res([],false,false,0)}
  const key=(s*N+t)*(need?128:1)+(need?Math.min(127,Math.round(need*4)):0),hit=o.cache!==false&&g.memo.get(key);let P,L,end,cut=false,n=0;
  if(hit){P=hit.p;L=P.length;end=P[L-1]}
  else{L=routeSearch(g,s,t,o.budget??routeBudget(g),need);const S=ROUTE_WS;P=S.path;end=S.end;cut=S.cut;n=S.n;
    if(o.cache!==false&&!cut){if(g.memo.size>=ROUTE.cache)g.memo.delete(g.memo.keys().next().value);g.memo.set(key,{p:P.slice(0,L)})}}
  // (the points: the start, the cells' centres between (the first too if he starts off it), the goal, or the point of the end
  // cell nearest it; pc: each point's cell's cost)
  const W=routeWs(N),px=W.px,py=W.py,pc=W.pc,q=cs/4;let m=1;px[0]=ax;py[0]=ay;pc[0]=0;
  for(let k=s===s0?1:0;k<L-1;k++){const i=P[k],c=i%C;px[m]=(c+.5)*cs;py[m]=((i-c)/C+.5)*cs;pc[m++]=cost[i]}
  {const c=end%C,x0=c*cs,y0=(end-c)/C*cs,at=end===t0;px[m]=at?bx:Math.min(x0+cs-q,Math.max(x0+q,bx));py[m]=at?by:Math.min(y0+cs-q,Math.max(y0+q,by));pc[m++]=cost[end]}
  // (string-pulling: from each anchor the farthest point a clear leg reaches; the next point always counts as reached)
  const out=[];for(let a=0;a<m-1;){let k=a+1,cap=pc[k];while(k<m-1){const c2=pc[k+1]>cap?pc[k+1]:cap;if(!(need?lineBody:lineClear)(g,px[a],py[a],px[k+1],py[k+1],c2,r))break;k++;cap=c2}out.push([px[k],py[k]]);a=k}
  return res(out,end===t0&&!cut,cut,n)}
// can one get from (ax,ay) to (bx,by) at all (cliffs one-way, so not always back)? A flood over the step masks, no budget
function reachable(g,ax,ay,bx,by){
  routePrep(g);let s=routeIx(g,ax,ay);const t=routeIx(g,bx,by);if(!g.cost[t])return false;if(s===t)return true;if(!g.cost[s]&&!g.mv[s]){s=routeNear(g,s);if(s<0)return false;if(s===t)return true}
  const W=routeWs(g.C*g.R),q=W.hp,seen=W.seen,st=W.st,mv=g.mv,off=g.off;let a=0,b=1;q[0]=s;seen[s]=st;
  while(a<b){const i=q[a++],m=mv[i];for(let d=0;d<8;d++){if(!(m&1<<d))continue;const j=i+off[d];if(seen[j]===st)continue;if(j===t)return true;seen[j]=st;q[b++]=j}}
  return false}
// every cell reachable from cell s (a flood over the step masks, as reachable's): a Uint8Array, 1 reached (s's own too)
function routeFlood(g,s){
  routePrep(g);const N=g.C*g.R,out=new Uint8Array(N);if(s<0)return out;const q=new Int32Array(N),mv=g.mv,off=g.off;let a=0,b=1;q[0]=s;out[s]=1;
  while(a<b){const i=q[a++],m=mv[i];for(let d=0;d<8;d++){if(!(m&1<<d))continue;const j=i+off[d];if(out[j])continue;out[j]=1;q[b++]=j}}
  return out}
/* the cost of the way from (x,y) to every cell (Dijkstra over the step masks, a step's cost as routeSearch's: a cell a side on open
   ground 2·ROUTE.unit; Infinity out of reach; a start in a blocked cell from the passable one nearest it): a Float64Array, kept per
   start cell (ROUTE.dist of them) till the version moves. The captains' measure of the ground (terrain.js wayLen) */
function routeDist(g,x,y){
  routePrep(g);const N=g.C*g.R;let s=routeIx(g,x,y);if(!g.cost[s]&&!g.mv[s])s=routeNear(g,s);const dm=g.dm||(g.dm=new Map());
  let D=dm.get(s);if(D)return D;D=new Float64Array(N).fill(Infinity);if(s<0)return D;
  const W=routeWs(N),F=W.f,H=W.h,hp=W.hp,pos=W.pos,seen=W.seen,done=W.done,st=W.st,mv=g.mv,off=g.off,cost=g.cost,SQ=Math.SQRT2;let size=1;
  seen[s]=st;F[s]=0;H[s]=0;hp[0]=s;pos[s]=0;
  while(size){const i=hp[0];if(--size){hp[0]=hp[size];routeDown(W,0,size)}done[i]=st;D[i]=F[i];const m=mv[i],ci=cost[i]||g.lo;
    for(let d=0;d<8;d++){if(!(m&1<<d))continue;const j=i+off[d];if(done[j]===st)continue;const ng=F[i]+(d&1?SQ:1)*(ci+cost[j]);
      if(seen[j]!==st){seen[j]=st;F[j]=ng;H[j]=0;hp[size]=j;routeUp(W,size);size++}else if(ng<F[j]){F[j]=ng;routeUp(W,pos[j])}}}
  if(dm.size>=ROUTE.dist)dm.delete(dm.keys().next().value);dm.set(s,D);return D}
/* ---- bodies' room (PATHS: the top of this file) ---- */
/* (PATHS.clear) grid g's clearance, kept till its version moves: g.cl, px from each cell's middle to the nearest shut cell's box or
   two-way cliff within PATHS.reach cells (past that, reach + 1 cells' px); g.cm, the most of it in the 3×3 round each cell (the room
   a body finds there). Each shut cell with an open neighbour, and each cliff, stamped on the cells round it; one-way cliffs are no
   wall to keep off (one goes down them) */
function routeRoom(g){
  if(g.clv===g.v&&g.cl)return g.cl;const C=g.C,R=g.R,cs=g.cs,N=C*R,cost=g.cost,wall=g.wall,K=PATHS.reach,far=(K+1)*cs;
  const cl=g.cl&&g.cl.length===N?g.cl:(g.cl=new Float32Array(N)),cm=g.cm&&g.cm.length===N?g.cm:(g.cm=new Float32Array(N));cl.fill(far);
  const stamp=(x0,y0,x1,y1)=>{const ca=Math.max(0,Math.floor(x0/cs)-K),cb=Math.min(C-1,Math.floor(x1/cs)+K),ra=Math.max(0,Math.floor(y0/cs)-K),rb=Math.min(R-1,Math.floor(y1/cs)+K);
    for(let r=ra;r<=rb;r++){const py=(r+.5)*cs,dy=py<y0?y0-py:py>y1?py-y1:0;for(let c=ca;c<=cb;c++){const px=(c+.5)*cs,dx=px<x0?x0-px:px>x1?px-x1:0,d=Math.sqrt(dx*dx+dy*dy),i=r*C+c;if(d<cl[i])cl[i]=d}}};
  for(let r=0,i=0;r<R;r++)for(let c=0;c<C;c++,i++){
    if(!cost[i]){let edge=false;for(let d=0;d<8&&!edge;d++){const c2=c+ROUTE_DC[d],r2=r+ROUTE_DR[d];if(c2>=0&&r2>=0&&c2<C&&r2<R&&cost[r2*C+c2])edge=true}if(edge)stamp(c*cs,r*cs,(c+1)*cs,(r+1)*cs);continue}
    const w=wall[i];if(w&1&&c+1<C&&wall[i+1]&4)stamp((c+1)*cs,r*cs,(c+1)*cs,(r+1)*cs);if(w&2&&r+1<R&&wall[i+C]&8)stamp(c*cs,(r+1)*cs,(c+1)*cs,(r+1)*cs)}
  for(let i=0;i<N;i++)if(!cost[i])cl[i]=0;
  for(let r=0,i=0;r<R;r++)for(let c=0;c<C;c++,i++){let m=0;for(let y=r>0?r-1:0;y<=(r<R-1?r+1:r);y++)for(let x=c>0?c-1:0;x<=(c<C-1?c+1:c);x++){const v=cl[y*C+x];if(v>m)m=v}cm[i]=m}
  g.clv=g.v;return cl}
// (the room a body of r keeps in cell i: r, or the most a cell round it has, where none has r: a lane narrower than he is)
const routeNeed=(g,i,r)=>{const m=g.cm[i];return m<r?m:r};
// (a box's distance from (x, y), its nearest point into ROUTE_GAP's px, py)
const ROUTE_GAP={nx:0,ny:0,px:0,py:0};
function gapBox(x,y,x0,y0,x1,y1){const px=x<x0?x0:x>x1?x1:x,py=y<y0?y0:y>y1?y1:y;ROUTE_GAP.px=px;ROUTE_GAP.py=py;return Math.hypot(x-px,y-py)}
/* (PATHS.clear) px from (x,y) to the nearest shut cell or two-way cliff: exact when under need, else a bound no less than need;
   ROUTE_GAP nx, ny: the way out from it (0, 0 when none is nearer than need) */
function routeGap(g,x,y,need){
  const cl=g.clv===g.v&&g.cl?g.cl:routeRoom(g),C=g.C,R=g.R,cs=g.cs,cost=g.cost,wall=g.wall,c0=Math.floor(x/cs),r0=Math.floor(y/cs),O=ROUTE_GAP;O.nx=O.ny=0;
  if(c0>=0&&r0>=0&&c0<C&&r0<R){const v=cl[r0*C+c0]-cs*.7072;if(v>=need)return v}
  // (the cells a box within need of the point lies in)
  let best=need,bx=0,by=0,bi=-1;const ca=Math.max(0,Math.floor((x-need)/cs)-1),cb=Math.min(C-1,Math.floor((x+need)/cs)),ra=Math.max(0,Math.floor((y-need)/cs)-1),rb=Math.min(R-1,Math.floor((y+need)/cs));
  for(let r=ra;r<=rb;r++)for(let c=ca;c<=cb;c++){const i=r*C+c;let d;
    if(!cost[i]){d=gapBox(x,y,c*cs,r*cs,(c+1)*cs,(r+1)*cs);if(d<best){best=d;bx=O.px;by=O.py;bi=i}continue}
    const w=wall[i];if(!w)continue;
    if(w&1&&c+1<C&&wall[i+1]&4){d=gapBox(x,y,(c+1)*cs,r*cs,(c+1)*cs,(r+1)*cs);if(d<best){best=d;bx=O.px;by=O.py;bi=-1}}
    if(w&2&&r+1<R&&wall[i+C]&8){d=gapBox(x,y,c*cs,(r+1)*cs,(c+1)*cs,(r+1)*cs);if(d<best){best=d;bx=O.px;by=O.py;bi=-1}}}
  if(best<need){let dx=x-bx,dy=y-by,l=Math.hypot(dx,dy);if(l<1e-6&&bi>=0){dx=x-(bi%C+.5)*cs;dy=y-(Math.floor(bi/C)+.5)*cs;l=Math.hypot(dx,dy)}if(l>1e-6){O.nx=dx/l;O.ny=dy/l}else O.nx=1}
  return best}
/* (PATHS.clear) does a body of r keep his room (routeNeed) all along the straight line from (ax,ay) to (bx,by), its end too: one
   starting nearer a wall than that never comes nearer it than he starts (one pushed against a wall walks along it, or off it); end:
   one may end as near a wall as its end is, his room coming back as he leaves it (a place beside a wall: lineClear's) */
function lineRoom(g,ax,ay,bx,by,r,end){
  const cl=g.clv===g.v&&g.cl?g.cl:routeRoom(g),cm=g.cm,C=g.C,R=g.R,cs=g.cs,L=Math.hypot(bx-ax,by-ay),q=cs*.7072;let g0=-1,g1=-1;
  // (at once where its ends have room to spare: each of its points within half its length of one of them)
  {const ca=Math.floor(ax/cs),ra=Math.floor(ay/cs),cb=Math.floor(bx/cs),rb=Math.floor(by/cs);if(ca>=0&&ra>=0&&ca<C&&ra<R&&cb>=0&&rb>=0&&cb<C&&rb<R&&Math.min(cl[ra*C+ca],cl[rb*C+cb])-q-L/2>=r)return true}
  // (points a quarter cell apart at most, each read first off its cell's clearance, the next looked at as far on as the room to
  // spare there allows: none of the way between can be short)
  const n=Math.max(1,Math.ceil(L*4/cs)),h=L/n,ux=L?(bx-ax)/L:0,uy=L?(by-ay)/L:0;
  for(let s=0;;){const x=ax+ux*s,y=ay+uy*s,c=Math.floor(x/cs),rr=Math.floor(y/cs);let spare=h;
    if(c>=0&&rr>=0&&c<C&&rr<R){const i=rr*C+c;let w=cm[i]<r?cm[i]:r;const b=cl[i]-q;
      if(b>=w)spare=b-r;else if(!s){g0=routeGap(g,ax,ay,r);spare=g0-r}
      else{if(g0<0)g0=routeGap(g,ax,ay,r);if(g0<w)w=g0;if(end&&L-s<w){if(g1<0)g1=routeGap(g,bx,by,r);if(g1+L-s<w)w=g1+L-s}
        const v=routeGap(g,x,y,w);if(v<w-1e-6)return false;spare=v-r}}
    if(s>=L)return true;s=Math.min(L,s+(spare>h?spare:h))}}
/* (PATHS.flow) a flow field toward (x,y) on grid g: the cost of the way from each cell to it (a step's cost as routeSearch's), out
   from it by Dijkstra over the steps taken backward (a one-way cliff the right way); a cell short of need's room (routeNeed), or
   shut, reached but not gone through. Made out till every cell of want (cell indices) is reached and PATHS.past cells' cost more,
   or the whole grid. F, if given, is made again in place (its array reused): {g, v (the grid's version), x, y, t (its cell), need,
   D (Float32Array: Infinity not reached), n (cells reached), lim (the cost it was made out to)} */
function routeFlow(g,x,y,need,want,F){
  routePrep(g);if(need)routeRoom(g);const C=g.C,R=g.R,N=C*R;if(!F||!F.D||F.D.length!==N)F={D:new Float32Array(N)};const D=F.D;D.fill(Infinity);
  const t=routeNear(g,routeIx(g,x,y));F.g=g;F.v=g.v;F.x=x;F.y=y;F.t=t;F.need=need;F.n=0;F.lim=Infinity;if(t<0)return F;
  const W=routeWs(N),Fv=W.f,hp=W.hp,pos=W.pos,seen=W.seen,done=W.done,mk=W.mk,st=W.st,mv=g.mv,cost=g.cost,cl=g.cl,cm=g.cm,SQ=Math.SQRT2;
  let left=0;if(want)for(const w of want)if(w>=0&&w<N&&mk[w]!==st){mk[w]=st;left++}
  let size=1,lim=Infinity;seen[t]=st;Fv[t]=0;W.h[t]=0;hp[0]=t;pos[t]=0;
  while(size){const i=hp[0];if(--size){hp[0]=hp[size];routeDown(W,0,size)}done[i]=st;const fi=Fv[i];if(fi>lim)break;D[i]=fi;F.n++;
    if(left&&mk[i]===st&&--left===0)lim=fi+PATHS.past*2*g.lo;
    if(i!==t&&(!cost[i]||need&&cl[i]<(cm[i]<need?cm[i]:need)))continue;
    const c=i%C,r=(i-c)/C,ci=cost[i]||g.lo;
    for(let d=0;d<8;d++){const c2=c+ROUTE_DC[d],r2=r+ROUTE_DR[d];if(c2<0||r2<0||c2>=C||r2>=R)continue;const j=r2*C+c2;if(done[j]===st||!(mv[j]&1<<((d+4)&7)))continue;
      const ng=fi+(d&1?SQ:1)*(ci+(cost[j]||g.lo));if(seen[j]!==st){seen[j]=st;Fv[j]=ng;W.h[j]=0;hp[size]=j;routeUp(W,size);size++}else if(ng<Fv[j]){Fv[j]=ng;routeUp(W,pos[j])}}}
  F.lim=size?lim:Infinity;ROUTE_N.flow++;return F}
/* (PATHS.corridor) a field along a way on grid g (pts: [x, y] field px, its start first: an army's corridor, a group's way): from each
   cell the cost of reaching the way, PATHS.off times a step's (routeSearch's), and on along it to its end (back: to its start), each
   cell it crosses seeded with the way left from there (px at a step's cost, 2·g.lo a cell); none from a shut cell. A cell short of
   need's room, or shut, reached but not gone through; made out till every cell of want is reached and PATHS.past cells' cost more.
   F as routeFlow's (x, y: the way's end, t its cell; F reused), and S: the way left at the cell each cell's cost leads in at (S[a]
   less than S[b]: a leads in further on) */
function routeFlowWay(g,pts,need,want,F,back){
  routePrep(g);if(need)routeRoom(g);const C=g.C,R=g.R,N=C*R,cs=g.cs;if(!F||!F.D||F.D.length!==N)F={D:new Float32Array(N)};if(!F.S||F.S.length!==N)F.S=new Float32Array(N);const D=F.D,S=F.S;D.fill(Infinity);
  const n=pts.length,e=back?pts[0]:pts[n-1];F.g=g;F.v=g.v;F.x=e[0];F.y=e[1];F.need=need;F.n=0;F.lim=Infinity;F.t=-1;
  const W=routeWs(N),Fv=W.f,Sv=W.g,hp=W.hp,pos=W.pos,seen=W.seen,done=W.done,mk=W.mk,st=W.st,mv=g.mv,cost=g.cost,cl=g.cl,cm=g.cm,SQ=Math.SQRT2,K=PATHS.off,u=2*g.lo/cs;
  // (its cells and the way left from each, from its end back)
  let L=0;for(let i=1;i<n;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);let size=0,s=0;
  const seed=(x,y,left)=>{const i=routeIx(g,x,y);if(!cost[i])return;const v=left*u;if(F.t<0)F.t=i;if(seen[i]!==st){seen[i]=st;Fv[i]=v;Sv[i]=v;W.h[i]=0;hp[size]=i;routeUp(W,size);size++}else if(v<Fv[i]){Fv[i]=v;Sv[i]=v;routeUp(W,pos[i])}};
  for(let k=0;k<n;k++){const a=back?pts[k]:pts[n-1-k];if(!k){seed(a[0],a[1],0);continue}const b=back?pts[k-1]:pts[n-k],l=Math.hypot(a[0]-b[0],a[1]-b[1]),m=Math.max(1,Math.ceil(l*2/cs));
    for(let j=1;j<=m;j++){const f=j/m;seed(b[0]+(a[0]-b[0])*f,b[1]+(a[1]-b[1])*f,s+l*f)}s+=l}
  if(F.t<0)return F;let left=0;if(want)for(const w of want)if(w>=0&&w<N&&mk[w]!==st){mk[w]=st;left++}let lim=Infinity;
  while(size){const i=hp[0];if(--size){hp[0]=hp[size];routeDown(W,0,size)}if(done[i]===st)continue;done[i]=st;const fi=Fv[i];if(fi>lim)break;D[i]=fi;S[i]=Sv[i];F.n++;
    if(left&&mk[i]===st&&--left===0)lim=fi+PATHS.past*2*g.lo*K;
    if(!cost[i]||need&&cl[i]<(cm[i]<need?cm[i]:need))continue;
    const c=i%C,r=(i-c)/C,ci=cost[i]||g.lo;
    for(let d=0;d<8;d++){const c2=c+ROUTE_DC[d],r2=r+ROUTE_DR[d];if(c2<0||r2<0||c2>=C||r2>=R)continue;const j=r2*C+c2;if(done[j]===st||!(mv[j]&1<<((d+4)&7)))continue;
      const ng=fi+K*(d&1?SQ:1)*(ci+(cost[j]||g.lo));if(seen[j]!==st){seen[j]=st;Fv[j]=ng;Sv[j]=Sv[i];W.h[j]=0;hp[size]=j;routeUp(W,size);size++}else if(ng<Fv[j]){Fv[j]=ng;Sv[j]=Sv[i];routeUp(W,pos[j])}}}
  F.lim=size?lim:Infinity;ROUTE_N.flow++;return F}
/* (PATHS.flow) where a body of r at (x,y) makes for down field F: the farthest of the next PATHS.look cells down it (each step to the
   neighbour nearest its goal, by none short of his room unless he stands in one) a straight line reaches with his room (lineBody;
   F.strict: his room kept to its end, lineRoom's), else the first; the field's own goal for its last cell. Into out ([x, y]); null
   where the field does not reach him */
const ROUTE_CHAIN={c:null};
function routeFlowAim(F,x,y,r,out){
  const g=F.g,D=F.D,C=g.C,cs=g.cs,mv=g.mv,off=g.off,cl=g.cl,cm=g.cm,need=F.need;let i=routeIx(g,x,y);if(!(D[i]<Infinity))return null;
  const L=PATHS.look,P=ROUTE_CHAIN.c&&ROUTE_CHAIN.c.length>=L?ROUTE_CHAIN.c:(ROUTE_CHAIN.c=new Int32Array(L));let n=0;
  for(;n<L&&i!==F.t;){const m=mv[i],tight=need&&cl[i]<(cm[i]<need?cm[i]:need);let b=-1,bd=D[i];
    for(let d=0;d<8;d++){if(!(m&1<<d))continue;const j=i+off[d];if(!(D[j]<bd)||need&&!tight&&j!==F.t&&cl[j]<(cm[j]<need?cm[j]:need))continue;bd=D[j];b=j}
    if(b<0)break;P[n++]=b;i=b}
  if(!n){out[0]=F.x;out[1]=F.y;return out}
  for(let k=n-1;k>=0;k--){const j=P[k],end=j===F.t,px=end?F.x:(j%C+.5)*cs,py=end?F.y:(Math.floor(j/C)+.5)*cs;if(!k||(F.strict?routeWalk(g,x,y,px,py,F.cap||255)&&(!(r>0)||lineRoom(g,x,y,px,py,r,false)):lineBody(g,x,y,px,py,F.cap||255,r))){out[0]=px;out[1]=py;return out}}
  return null}
/* (PATHS.slide) a body of r's step (dx, dy) from (x, y) that would bring him nearer a wall than his room (routeNeed): slid along it,
   its part into the wall (by the wall's way out at the step's end) taken off, and out of the wall's room by what it lacks, never
   longer than the step. Into out ([dx, dy]); false when nothing is left of it */
function routeSlide(g,x,y,dx,dy,r,out){
  const l=Math.hypot(dx,dy);if(!(l>1e-9))return false;routeRoom(g);const i=routeIx(g,x+dx,y+dy),w=routeNeed(g,i,r),gp=routeGap(g,x+dx,y+dy,w),nx=ROUTE_GAP.nx,ny=ROUTE_GAP.ny;
  if(gp>=w||!(nx||ny)){out[0]=dx;out[1]=dy;return true}
  const into=dx*nx+dy*ny;let sx=dx,sy=dy;if(into<0){sx-=into*nx;sy-=into*ny}sx+=nx*(w-gp);sy+=ny*(w-gp);
  const s=Math.hypot(sx,sy);if(!(s>1e-6))return false;if(s>l){sx*=l/s;sy*=l/s}out[0]=sx;out[1]=sy;return true}
