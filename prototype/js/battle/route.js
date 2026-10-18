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
// (the 8 steps in TDX's order: E SE S SW W NW N NE)
const ROUTE_DC=[1,1,0,-1,-1,-1,0,1],ROUTE_DR=[0,1,1,1,0,-1,-1,-1];
// an open grid of C×R cells of cs px
// (a query's budget on grid g: ROUTE.budget, or a quarter of its cells on a field larger than that (a huge one: setup.js FIELD_SIZES))
const routeBudget=g=>Math.max(ROUTE.budget,(g.C*g.R)>>2);
function routeGrid(C,R,cs){const N=C*R;return{C,R,cs,cost:new Uint8Array(N).fill(ROUTE.unit),wall:new Uint8Array(N),v:1,pv:0,mv:null,off:null,lo:ROUTE.unit,memo:new Map()}}
/* the grid of a battle's ground (B.terrain): each kind's cost by TGROUND's speed for who ('foot', 'mounted' or 'big'), a bridge
   or open ground ROUTE.unit; deep water impassable when o.deep (default ROUTE.deep), else waded at its cost (as crossWay weighs
   it). For the generator to fill: a TERRAIN_GROUND entry with solid (mountains, rock spires) or a kind past TGROUND is
   impassable; T.wall, if any, is the cliffs (this file's edge bits) */
function routeGridOf(T,o={}){
  const g=routeGrid(T.C,T.R,T.cs),deep=o.deep??ROUTE.deep,w=o.who||'foot',K=T.kind,U=ROUTE.unit;
  for(let i=0;i<K.length;i++){const k=K[i],Gd=TGROUND[k];g.cost[i]=k>=TGROUND.length||Gd&&Gd.solid||k===TKIND.deep&&deep?0:Gd?Math.min(255,Math.max(1,Math.round(U/(Gd.spd[w]||Gd.spd.foot)))):U}
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
  if(W.n<N){W.n=N;W.g=new Float64Array(N);W.f=new Float64Array(N);W.h=new Float64Array(N);W.par=new Int32Array(N);W.pos=new Int32Array(N);W.hp=new Int32Array(N);W.seen=new Uint32Array(N);W.done=new Uint32Array(N);W.path=new Int32Array(N);W.px=new Float64Array(N+2);W.py=new Float64Array(N+2);W.pc=new Uint8Array(N+2);W.st=0}
  if(++W.st>=0xFFFFFFFF){W.seen.fill(0);W.done.fill(0);W.st=1}return W}
// (the open list: a binary heap of cells by f, then h (nearer the goal first), then index; pos: each cell's place in it)
function routeUp(W,k){const hp=W.hp,pos=W.pos,f=W.f,h=W.h,i=hp[k];while(k>0){const p=(k-1)>>1,j=hp[p];if(f[j]<f[i]||f[j]===f[i]&&(h[j]<h[i]||h[j]===h[i]&&j<i))break;hp[k]=j;pos[j]=k;k=p}hp[k]=i;pos[i]=k}
function routeDown(W,k,n){const hp=W.hp,pos=W.pos,f=W.f,h=W.h,i=hp[k];
  for(;;){let c=2*k+1;if(c>=n)break;if(c+1<n){const a=hp[c],b=hp[c+1];if(f[b]<f[a]||f[b]===f[a]&&(h[b]<h[a]||h[b]===h[a]&&b<a))c++}
    const j=hp[c];if(f[i]<f[j]||f[i]===f[j]&&(h[i]<h[j]||h[i]===h[j]&&i<j))break;hp[k]=j;pos[j]=k;k=c}
  hp[k]=i;pos[i]=k}
/* A* from cell s to cell t, octile heuristic; a step costs its length (1 or √2) by the sum of both cells' costs. The cells of the
   way into W.path (s first); returns its length. W.end: t, or (t out of reach, or the budget spent first: W.cut) the cell
   reached nearest t by h; W.n: cells expanded */
function routeSearch(g,s,t,budget){
  const W=routeWs(g.C*g.R),C=g.C,cost=g.cost,mv=g.mv,off=g.off,G=W.g,F=W.f,H=W.h,par=W.par,hp=W.hp,pos=W.pos,seen=W.seen,done=W.done,st=W.st,SQ=Math.SQRT2,k2=2*g.lo,tc=t%C,tr=(t-tc)/C;
  const hOf=i=>{const c=i%C,dx=c>tc?c-tc:tc-c,r=(i-c)/C,dy=r>tr?r-tr:tr-r;return(dx+dy+(SQ-2)*(dx<dy?dx:dy))*k2};
  let n=0,best=s,size=1,cut=false;seen[s]=st;G[s]=0;H[s]=hOf(s);F[s]=H[s];par[s]=-1;hp[0]=s;pos[s]=0;
  while(size){const i=hp[0];if(--size){hp[0]=hp[size];routeDown(W,0,size)}done[i]=st;
    if(H[i]<H[best]||H[i]===H[best]&&G[i]<G[best])best=i;if(i===t)break;if(n>=budget){cut=true;break}n++;
    const m=mv[i],gi=G[i],ci=cost[i]||g.lo;
    for(let d=0;d<8;d++){if(!(m&1<<d))continue;const j=i+off[d];if(done[j]===st)continue;const ng=gi+(d&1?SQ:1)*(ci+cost[j]);
      if(seen[j]!==st){seen[j]=st;G[j]=ng;H[j]=hOf(j);F[j]=ng+H[j];par[j]=i;hp[size]=j;routeUp(W,size);size++}
      else if(ng<G[j]){G[j]=ng;F[j]=ng+H[j];par[j]=i;routeUp(W,pos[j])}}}
  const end=done[t]===st?t:best;let L=0;for(let i=end;i>=0;i=par[i])L++;for(let i=end,k=L-1;i>=0;i=par[i],k--)W.path[k]=i;
  W.end=end;W.cut=cut;W.n=n;return L}
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
/* the way from (ax,ay) to (bx,by), field px: waypoints [[x,y],…] after the start, the last the goal, or (the goal out of reach,
   or in an impassable cell) the point nearest it in the reachable cell nearest it. Straightened by string-pulling: a leg skips
   the cells of the way while lineClear allows it and crosses no cell dearer than those it skips. o: {budget (cells expanded at
   most: ROUTE.budget), r (the half-width a leg keeps clear, px), cache (false: no cache)}. The array carries ok (the goal
   reached), cut (the budget ran out first: part of the way, toward the goal; re-path from its end), n (cells expanded: 0 from
   a straight line or the cache) */
function routePath(g,ax,ay,bx,by,o={}){
  routePrep(g);const C=g.C,cs=g.cs,N=C*g.R,cost=g.cost,r=o.r||0,t0=routeIx(g,bx,by),t=routeNear(g,t0),res=(p,ok,cut,n)=>{p.ok=ok;p.cut=cut;p.n=n;return p};
  let s=routeIx(g,ax,ay);
  if(t<0)return res([],false,false,0);
  // (an open straight line over the cheapest ground: no search)
  if(t===t0&&lineClear(g,ax,ay,bx,by,g.lo,r))return res([[bx,by]],true,false,0);
  const s0=s;if(!cost[s]&&!g.mv[s]){s=routeNear(g,s);if(s<0)return res([],false,false,0)}
  const key=s*N+t,hit=o.cache!==false&&g.memo.get(key);let P,L,end,cut=false,n=0;
  if(hit){P=hit.p;L=P.length;end=P[L-1]}
  else{L=routeSearch(g,s,t,o.budget??routeBudget(g));const S=ROUTE_WS;P=S.path;end=S.end;cut=S.cut;n=S.n;
    if(o.cache!==false&&!cut){if(g.memo.size>=ROUTE.cache)g.memo.delete(g.memo.keys().next().value);g.memo.set(key,{p:P.slice(0,L)})}}
  // (the points: the start, the cells' centres between (the first too if he starts off it), the goal, or the point of the end
  // cell nearest it; pc: each point's cell's cost)
  const W=routeWs(N),px=W.px,py=W.py,pc=W.pc,q=cs/4;let m=1;px[0]=ax;py[0]=ay;pc[0]=0;
  for(let k=s===s0?1:0;k<L-1;k++){const i=P[k],c=i%C;px[m]=(c+.5)*cs;py[m]=((i-c)/C+.5)*cs;pc[m++]=cost[i]}
  {const c=end%C,x0=c*cs,y0=(end-c)/C*cs,at=end===t0;px[m]=at?bx:Math.min(x0+cs-q,Math.max(x0+q,bx));py[m]=at?by:Math.min(y0+cs-q,Math.max(y0+q,by));pc[m++]=cost[end]}
  // (string-pulling: from each anchor the farthest point a clear leg reaches; the next point always counts as reached)
  const out=[];for(let a=0;a<m-1;){let k=a+1,cap=pc[k];while(k<m-1){const c2=pc[k+1]>cap?pc[k+1]:cap;if(!lineClear(g,px[a],py[a],px[k+1],py[k+1],c2,r))break;k++;cap=c2}out.push([px[k],py[k]]);a=k}
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
