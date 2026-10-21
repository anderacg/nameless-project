'use strict';
/* ---------- the router: every way over the land, behind three calls (doc/WORLD_DESIGN.md §3.6), so how ways are found can
   change behind them (the way graph, later) and no walker notices:
     Router.travel(o, goal, step): one step of o toward goal, a point {x, y}; with tw (a holding) the way leads to that holding
       by its roads and the last stretch goes straight to the point. True while on its way, false when goal cannot be reached
       from where o stands (the walker should pick another)
     Router.reach(a, b): can one walk from a to b (a holding from its own tile, anything else from its point)
     Router.days(a, b, pace): how many days' march from a to b at pace (px a world second, unscaled: MAP_BASE if left out);
       Infinity when there is no way
     Router.close(xi, shut): shuts crossing xi (WM.crossings) or opens it again (the generated world's; Phase 5's seasons)
     Router.stats(): {queries, hits, graphMs, localMs}: the graph's ways asked for, those the pair cache answered, ms spent
   On today's map, the ways underneath as they always were: a holding's travel-cost field (flowTo), a search in a box (findPath)
   behind a straight look (clearLine); reach reads a label per tile, the piece of land it lies on (one flood fill a world).
   On the generated world (WM.graph, below), two levels: the way graph for long trips, those searches for each leg of them. ---------- */
/* a holding's travel-cost field: the cost of the cheapest way from every tile to it, built on first use */
const FLOW={};
function flowTo(tw){
  if(FLOW[tw.name])return FLOW[tw.name];
  const dist=new Float64Array(MW*MH).fill(Infinity),heap=[];
  const push=(i,d)=>{heap.push([d,i]);let k=heap.length-1;while(k>0){const p=(k-1)>>1;if(heap[p][0]<=heap[k][0])break;[heap[p],heap[k]]=[heap[k],heap[p]];k=p}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===k)break;[heap[m],heap[k]]=[heap[k],heap[m]];k=m}}return top};
  const start=tw.ty*MW+tw.tx;dist[start]=0;push(start,0);
  while(heap.length){
    const [d,i]=pop();if(d>dist[i])continue;const x=i%MW,y=(i-x)/MW;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;
      const t=tiles[ny*MW+nx];if(!passable(t))continue;
      if(dx&&dy&&(!passable(tiles[y*MW+nx])||!passable(tiles[ny*MW+x])))continue;
      const sp=t===T_ROAD?1.3:Math.max(.35,SPEEDMUL[t]*CLIMMUL[CLIMS[climate[ny*MW+nx]]]),nd=d+(dx&&dy?1.414:1)/sp,j=ny*MW+nx;
      if(nd<dist[j]){dist[j]=nd;push(j,nd)}
    }
  }
  return FLOW[tw.name]=dist;
}
/* walking to a point (a patrol's beat, a worker's field, a band's camp): straight if nothing is in the way, else by the cheapest
   way over land and bridges, found once for each target and kept aside (never saved). True while on its way; false when the
   point cannot be reached from where it stands (the walker should pick another). */
let ROUTES=new WeakMap();
// a new world: every way found on the last one is forgotten
onWorld(()=>{for(const k in FLOW)delete FLOW[k];ROUTES=new WeakMap()});
// is the straight line from (x0,y0) to (x1,y1) open ground all the way
function clearLine(x0,y0,x1,y1){const d=Math.hypot(x1-x0,y1-y0),n=Math.ceil(d/4);for(let i=1;i<=n;i++){const k=i/n;if(!passable(terrAt(x0+(x1-x0)*k,y0+(y1-y0)*k)))return false}return true}
// the tiles to pass from one point to another by the cheapest way, searched within a box round both (pad tiles); null if none
function findPath(x0,y0,x1,y1,pad){
  pad=pad||16;const sx=Math.floor(x0/TILE),sy=Math.floor(y0/TILE),gx=Math.floor(x1/TILE),gy=Math.floor(y1/TILE);if(sx===gx&&sy===gy)return[];
  if(!passable(tAt(gx,gy)))return null;
  const bx=Math.max(0,Math.min(sx,gx)-pad),by=Math.max(0,Math.min(sy,gy)-pad),bw=Math.min(MW,Math.max(sx,gx)+pad+1)-bx,bh=Math.min(MH,Math.max(sy,gy)+pad+1)-by;
  const N=bw*bh,g=new Float64Array(N).fill(Infinity),from=new Int32Array(N).fill(-1),heap=[],L=(x,y)=>(y-by)*bw+(x-bx);
  const push=(i,f)=>{heap.push([f,i]);let k=heap.length-1;while(k>0){const q=(k-1)>>1;if(heap[q][0]<=heap[k][0])break;[heap[q],heap[k]]=[heap[k],heap[q]];k=q}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===k)break;[heap[m],heap[k]]=[heap[k],heap[m]];k=m}}return top};
  const h=(x,y)=>Math.hypot(x-gx,y-gy)/1.3,s0=L(sx,sy),goal=L(gx,gy);g[s0]=0;push(s0,h(sx,sy));
  while(heap.length){const [,i]=pop();if(i===goal)break;const x=bx+i%bw,y=by+((i/bw)|0);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<bx||ny<by||nx>=bx+bw||ny>=by+bh)continue;
      const t=tiles[ny*MW+nx];if(!passable(t)||SHUT&&SHUT[ny*MW+nx])continue;if(dx&&dy&&(!passable(tiles[y*MW+nx])||!passable(tiles[ny*MW+x])))continue;
      const sp=t===T_ROAD?1.3:Math.max(.35,SPEEDMUL[t]*CLIMMUL[CLIMS[climate[ny*MW+nx]]]),j=L(nx,ny),nd=g[i]+(dx&&dy?1.414:1)/sp;
      if(nd<g[j]){g[j]=nd;from[j]=i;push(j,nd+h(nx,ny))}}}
  if(!isFinite(g[goal]))return null;
  const out=[];for(let i=goal;i!==s0;i=from[i])out.push((by+((i/bw)|0))*MW+bx+i%bw);return out.reverse();
}
function routeTo(o,x,y,step){
  const dd=Math.hypot(x-o.x,y-o.y);if(dd<=1)return true;
  const goal=Math.floor(y/TILE)*MW+Math.floor(x/TILE);let r=ROUTES.get(o);
  // (the search keeps to a box round both ends; a way that leaves the box is searched for over the whole map, where the point
  // lies on the walker's own piece of land: false only when it cannot be reached at all)
  if(!r||r.goal!==goal){r={goal,path:clearLine(o.x,o.y,x,y)?[]:findPath(o.x,o.y,x,y)||(Router.reach(o,{x,y})?findPath(o.x,o.y,x,y,Math.max(MW,MH)):null),i:0};ROUTES.set(o,r)}
  if(!r.path)return false;
  while(r.i<r.path.length){const k=r.path[r.i],cx=(k%MW+.5)*TILE,cy=(Math.floor(k/MW)+.5)*TILE,d=Math.hypot(cx-o.x,cy-o.y);
    if(d<3){r.i++;continue}walk(o,cx-o.x,cy-o.y,Math.min(d,step));return true}
  walk(o,x-o.x,y-o.y,Math.min(dd,step));return true;
}
// step toward a holding along the cheapest route; the last stretch goes straight to (tx,ty)
function travelTo(o,tw,tx,ty,step){
  const dd=Math.hypot(tx-o.x,ty-o.y);if(dd<=1)return;
  const ox=Math.floor(o.x/TILE),oy=Math.floor(o.y/TILE);
  if(dd<TILE*1.6||(ox===tw.tx&&oy===tw.ty)){walk(o,tx-o.x,ty-o.y,Math.min(dd,step));return}
  const f=flowTo(tw);let best=-1,bv=f[oy*MW+ox];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=ox+dx,ny=oy+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const v=f[ny*MW+nx];if(v<bv){bv=v;best=ny*MW+nx}}
  if(best<0){walk(o,tx-o.x,ty-o.y,Math.min(dd,step));return}
  const cx=(best%MW+.5)*TILE,cy=(Math.floor(best/MW)+.5)*TILE;walk(o,cx-o.x,cy-o.y,step);
}

/* the pieces of land: each passable tile labelled by the piece it lies on (4 ways: a corner is cut only where both sides are
   open, so a diagonal step joins nothing new), -1 for water and peaks; a ferry's two landings one piece. Made on first use,
   again for a new world */
let LAND_PIECE=null;
onWorld(()=>{LAND_PIECE=null});
function landPieces(){
  if(LAND_PIECE)return LAND_PIECE;const id=new Int32Array(MW*MH).fill(-1);let n=0;
  for(let i=0;i<MW*MH;i++){if(id[i]>=0||!passable(tiles[i]))continue;id[i]=n;const q=[i];
    while(q.length){const j=q.pop(),x=j%MW,y=(j/MW)|0;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+a,ny=y+b,k=ny*MW+nx;if(nx<0||ny<0||nx>=MW||ny>=MH||id[k]>=0||!passable(tiles[k]))continue;id[k]=n;q.push(k)}}n++}
  const F=WM.crossings.filter(c=>c.kind==='ferry'&&id[c.i]>=0&&id[c.j]>=0);
  if(F.length){const up=Int32Array.from({length:n},(_,k)=>k),root=k=>{while(up[k]!==k)k=up[k]=up[up[k]];return k};for(const c of F)up[root(id[c.i])]=root(id[c.j]);for(let i=0;i<MW*MH;i++)if(id[i]>=0)id[i]=root(id[i])}
  return LAND_PIECE=id;
}
// the tile a place is reached on: a holding's own tile (where its ways start), anything else's point; -1 off the map
const wayTile=p=>{const h=p instanceof Holding,tx=h?p.tx:Math.floor(p.x/TILE),ty=h?p.ty:Math.floor(p.y/TILE);return tx<0||ty<0||tx>=MW||ty>=MH?-1:ty*MW+tx};
// the way to a holding, a goal for Router.travel: the spot in front of its gate (dx along it), by the holding's roads
const gateGoal=(t,dx)=>({x:t.x+(dx||0),y:t.y+12,tw:t});
const Router={
  travel(o,goal,step){if(WM.graph)return wayTravel(o,goal,step);if(goal.tw){travelTo(o,goal.tw,goal.x,goal.y,step);return true}return routeTo(o,goal.x,goal.y,step)},
  reach(a,b){const L=landPieces(),i=wayTile(a),j=wayTile(b);return i>=0&&j>=0&&L[i]>=0&&L[i]===L[j]},
  // (a holding's field costs tiles at open-ground pace; between two other places, the straight line if they share their land.
  // A day's march: pace x a day's world seconds, by the movement lever. The generated world: the graph's days at WAY.pace)
  days(a,b,pace){if(WM.graph)return wayDays(a,b)*WAY.pace/(pace||MAP_BASE);
    const t=b instanceof Holding?b:a instanceof Holding?a:null,i=wayTile(t===b?a:b),
      n=i<0?Infinity:t?flowTo(t)[i]:this.reach(a,b)?Math.hypot(a.x-b.x,a.y-b.y)/TILE:Infinity;
    return n*TILE/moveStep(pace||MAP_BASE,DAY_SECONDS*WORLD_PACE)},
  // (its edges in closed, its tiles shut to the searches, the chunks they lie in and the pair cache made afresh, every walker's way
  // found again)
  close(xi,shut){const G=WM.graph,c=WM.crossings[xi];if(!G||!c)return;G.closed[xi]=shut?1:0;SHUT=SHUT||new Uint8Array(MW*MH);
    for(const i of c.tiles){SHUT[i]=shut?1:0;G.chunk.delete(wayChunkOf(G,i))}PAIRS.clear();WAYV++},
  stats(){return{...WAYS}}
};

/* ---------- the way graph (doc/WORLD_DESIGN.md §3.6, §15.2.1), the generated world's (WM.graph; null on today's map), built by the
   generator's last stage (worldgen.js genGraph, with its stage context g) from the world's roads, crossings, ports, camps and
   chunk borders, by the generator's rules (§8.1: seeded; no Math.random, hypot, sin, cos, exp, pow, log or atan2: tests/router.js
   reads buildWayGraph's text). A WayGraph: {n nodes: tile, nk (0 a holding's gate: its own tile, where its roads start;
   1 a road junction; 2 a crossing's end; 3 a port's landing; 4 a camp; 5 a chunk portal: the middle of each open run, WAY.run
   tiles at most, along every chunk border, a node each side); edges by node (off: from off[v] to off[v+1]): to, cost (days at
   WAY.pace), ek (0 road, 1 track, 2 crossing, 3 river down, 4 river up: barges' legs between landings, Phase 5's (land ways never
   take them), 5 a portal's step over its border), xing (the crossing an edge takes, or -1); chunk: the costs between the nodes of
   each chunk inside it (a search over its 32 x 32 tiles from each), made when first needed and kept (an LRU of WAY.chunks);
   closed: a byte a crossing (Router.close)}; and the router's own: w, h, cs (a chunk's tiles a side, as WorldArt's), cols,
   coff and cnode (the nodes by chunk: those of chunk c from cnode[coff[c]] to cnode[coff[c+1]]), leg (a road edge's road in
   WM.roads and its path's places it runs from and to; 3 a road edge, -1 for the others).
   The router over it (Router.travel, days): a trip within WAY.near tiles is searched on the tiles (findPath), as on today's map;
   a longer one from its start to the nodes of its chunk (a search in the chunk: wayEnds), over the graph (A*, the cheapest
   from any of those to any of the goal's: wayGraph; between two single nodes, a holding's gate to a gate, cached by the pair: an
   LRU of WAY.pairs), then walked leg by leg: each leg's tiles found when it is reached (a road's own tiles, a crossing's, a
   search between two nodes of a chunk) and the last stretch to the goal. Reach is the land's pieces, as on today's map */
// its numbers: a border's open run cut into portals of this many tiles at most; trips this short (tiles, the larger of dx, dy)
// searched on the tiles alone; the pair cache and the chunk tables kept; a ferry's crossing (days: §6.6.2); barges' tiles a day
// down and up a river (§6.6.3); a chunk's tiles a side (WorldArt's CHUNK / TILE); pace, MAP_BASE (world.js, which loads after the
// generator first runs at load: tests/router.js checks they agree)
const WAY={run:10,near:40,pairs:1024,chunks:512,ferry:.05,barge:[260,90],cs:32,pace:34};
// (the cost of stepping onto a tile of kind t, climate c: findPath's, in tiles at open-ground pace; the days one of those takes)
const wayStep=(t,c)=>t===T_ROAD?1/1.3:1/Math.max(.35,SPEEDMUL[t]*CLIMMUL[CLIMS[c]]);
const wayDay=()=>TILE/moveStep(WAY.pace,DAY_SECONDS*WORLD_PACE);
function buildWayGraph(g){
  const m=g.map,W=m.w,H=m.h,N=W*H,K=m.kind,Cl=m.clim,CS=WAY.cs,cols=Math.ceil(W/CS),rows=Math.ceil(H/CS),DPT=wayDay(),cost=i=>wayStep(K[i],Cl[i]);
  const X=new Int32Array(N).fill(-1);m.crossings.forEach((c,k)=>{for(const i of c.tiles)X[i]=k});
  const tile=[],nk=[],at=new Map(),node=(i,k)=>{let v=at.get(i);if(v===undefined){v=tile.length;at.set(i,v);tile.push(i);nk.push(k)}return v};
  // (an edge a to b: [a, b, days, ek, xing, road, from, to]; the cheapest kept between two nodes)
  const E=[],pair=new Map(),edge=(a,b,c,k,x,r,ka,kb)=>{if(a===b)return;const q=a*1048576+b,o=pair.get(q);if(o!==undefined){if(E[o][2]>c)E[o]=[a,b,c,k,x,r,ka,kb];return}pair.set(q,E.length);E.push([a,b,c,k,x,r,ka,kb])};
  // the nodes: the holdings' gates, the crossings' ends, the ports' landings (the nearest shore tile within 3), the camps, then
  // each road's junctions (where a stretch it shares with another begins or ends)
  for(const h of g.holdings)node(h.ty*W+h.tx,0);
  for(const c of m.crossings){node(c.i,2);node(c.j,2)}
  const shore=i=>passable(K[i])&&X[i]<0&&(K[i-1]===T_WATER||K[i+1]===T_WATER||K[i-W]===T_WATER||K[i+W]===T_WATER);
  for(const h of g.holdings)if(h.style==='port'||h.style==='riverport'){let s=-1;
    for(let d=0;d<=3&&s<0;d++)for(let b=-d;b<=d&&s<0;b++)for(let a=-d;a<=d&&s<0;a++){const x=h.tx+a,y=h.ty+b;if((a===d||a===-d||b===d||b===-d)&&x>0&&y>0&&x<W-1&&y<H-1&&shore(y*W+x))s=y*W+x}
    if(s>=0)node(s,3)}
  for(const c of g.camps)node(c.ty*W+c.tx,4);
  const cnt=new Uint8Array(N);for(const r of m.roads){const seen=new Set();for(const i of r.path)if(!seen.has(i)){seen.add(i);if(cnt[i]<255)cnt[i]++}}
  for(const r of m.roads){const p=r.path,L=p.length;for(let k=0;k<L;k++){const i=p[k];if(cnt[i]>1&&K[i]!==T_WATER&&X[i]<0&&(k>0&&cnt[p[k-1]]<cnt[i]||k<L-1&&cnt[p[k+1]]<cnt[i]))node(i,1)}}
  // road and track edges: each road's run between two nodes on it, its own tiles' costs each way (a run over a crossing's tiles is
  // the crossing's edge)
  m.roads.forEach((r,ri)=>{const p=r.path,ek=r.kind==='road'?0:1;let ka=-1;
    for(let k=0;k<p.length;k++){const v=at.get(p[k]);if(v===undefined)continue;
      if(ka>=0){let ok=true,cf=0,cb=0;for(let q=ka+1;q<=k;q++){const a=p[q-1],b=p[q];if(K[b]===T_WATER||X[b]>=0&&q<k){ok=false;break}const d=a%W!==b%W&&(a/W|0)!==(b/W|0)?1.4142:1;cf+=cost(b)*d;cb+=cost(a)*d}
        if(ok){const u=at.get(p[ka]);edge(u,v,cf*DPT,ek,-1,ri,ka,k);edge(v,u,cb*DPT,ek,-1,ri,k,ka)}}
      ka=k}});
  // the crossings: a bridge or a ford its tiles' costs, a ferry WAY.ferry days
  m.crossings.forEach((c,xi)=>{let f=WAY.ferry,b=WAY.ferry;if(c.kind!=='ferry'){f=cost(c.j);b=cost(c.i);for(const i of c.tiles){f+=cost(i);b+=cost(i)}f*=DPT;b*=DPT}
    edge(at.get(c.i),at.get(c.j),f,2,xi,-1,0,0);edge(at.get(c.j),at.get(c.i),b,2,xi,-1,0,0)});
  // the chunk portals: along each border between two chunks, each open run (walkable on both sides, no crossing's tile) cut into
  // pieces of WAY.run tiles at most, a node each side of each piece's middle, a step between them
  const open=i=>passable(K[i])&&X[i]<0,port=(i,j)=>{const a=node(i,5),b=node(j,5);edge(a,b,cost(j)*DPT,5,-1,-1,0,0);edge(b,a,cost(i)*DPT,5,-1,-1,0,0)};
  const runs=(len,ok,put)=>{for(let s=0;s<len;){if(!ok(s)){s++;continue}let e=s;while(e<len&&ok(e))e++;const q=Math.ceil((e-s)/WAY.run);
    for(let k=0;k<q;k++)put((s+Math.floor((e-s)*k/q)+s+Math.floor((e-s)*(k+1)/q)-1)>>1);s=e}};
  for(let cx=1;cx<cols;cx++)for(let cy=0;cy<rows;cy++){const x=cx*CS,y0=cy*CS;runs(Math.min(CS,H-y0),k=>open((y0+k)*W+x-1)&&open((y0+k)*W+x),k=>port((y0+k)*W+x-1,(y0+k)*W+x))}
  for(let cy=1;cy<rows;cy++)for(let cx=0;cx<cols;cx++){const y=cy*CS,x0=cx*CS;runs(Math.min(CS,W-x0),k=>open((y-1)*W+x0+k)&&open(y*W+x0+k),k=>port((y-1)*W+x0+k,y*W+x0+k))}
  // river legs: along each navigable river, between the landings (ports' and ferries') within 3 tiles of it in its order, but over
  // its rapids; downstream (its path runs from its source) at barge[0] tiles a day, up at barge[1]
  const lands=[];for(let v=0;v<tile.length;v++)if(nk[v]===3)lands.push(v);for(const c of m.crossings)if(c.kind==='ferry')lands.push(at.get(c.i),at.get(c.j));
  for(const r of m.rivers){if(!r.nav)continue;const p=r.path,on=new Map(p.map((i,k)=>[i,k])),L=[];
    for(const v of lands){const t=tile[v],x=t%W,y=(t-x)/W;let best=-1;
      for(let d=0;d<=3&&best<0;d++)for(let b=-d;b<=d;b++)for(let a=-d;a<=d;a++){const k=on.get(t+a+b*W);if(x+a>=0&&x+a<W&&y+b>=0&&y+b<H&&k!==undefined&&m.river[p[k]]&4&&(best<0||k<best))best=k}
      if(best>=0)L.push([best,v])}
    L.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    for(let k=1;k<L.length;k++){const [a,u]=L[k-1],[b,v]=L[k];if(u===v||r.rapids.some(([s,e])=>s<=b&&e>=a))continue;edge(u,v,(b-a)/WAY.barge[0],3,-1,-1,0,0);edge(v,u,(b-a)/WAY.barge[1],4,-1,-1,0,0)}}
  // by node: the edges (off), the nodes by chunk (coff, cnode)
  const n=tile.length,M=E.length,off=new Int32Array(n+1),to=new Int32Array(M),co=new Float32Array(M),ek=new Uint8Array(M),xg=new Int16Array(M),leg=new Int32Array(M*3).fill(-1);
  for(const e of E)off[e[0]+1]++;for(let v=0;v<n;v++)off[v+1]+=off[v];const fill=off.slice(0,n);
  for(const e of E){const q=fill[e[0]]++;to[q]=e[1];co[q]=e[2];ek[q]=e[3];xg[q]=e[4];if(e[5]>=0){leg[q*3]=e[5];leg[q*3+1]=e[6];leg[q*3+2]=e[7]}}
  const chOf=i=>((i/W|0)/CS|0)*cols+((i%W)/CS|0),coff=new Int32Array(cols*rows+1),cnode=new Int32Array(n);
  for(let v=0;v<n;v++)coff[chOf(tile[v])+1]++;for(let c=0;c<cols*rows;c++)coff[c+1]+=coff[c];const cf=coff.slice(0,cols*rows);for(let v=0;v<n;v++)cnode[cf[chOf(tile[v])]++]=v;
  return{n,tile:Int32Array.from(tile),nk:Uint8Array.from(nk),off,to,cost:co,ek,xing:xg,chunk:new Map(),closed:new Uint8Array(m.crossings.length),w:W,h:H,cs:CS,cols,coff,cnode,leg};
}

// ---- the router on the graph (the world in use: WM.graph)
// what it keeps: the tiles shut (a byte a tile: Router.close; null while none is), the graph's nodes by tile (WAYN), the pair
// cache (PAIRS), its counts (WAYS, Router.stats) and the ways' version (WAYV: a walker's way found under another is found again)
let SHUT=null,WAYN=null,WAYV=0;const PAIRS=new Map(),WAYS={queries:0,hits:0,graphMs:0,localMs:0};
onWorld(m=>{SHUT=null;WAYN=null;PAIRS.clear();WAYV++;if(m.graph){m.graph.chunk.clear();m.graph.closed.fill(0)}});
const wayNodes=()=>WAYN||(WAYN=new Map(Array.from(WM.graph.tile,(t,v)=>[t,v])));
const wayChunkOf=(G,i)=>((i/MW|0)/G.cs|0)*G.cols+((i%MW)/G.cs|0);
const wayOpen=i=>passable(tiles[i])&&!(SHUT&&SHUT[i]);
// a binary heap of (key, value) pairs on typed arrays, the least key first (the router's searches)
class WayHeap{
  constructor(){this.k=new Float64Array(1024);this.v=new Int32Array(1024);this.n=0}
  get top(){return this.k[0]}
  push(f,i){if(this.n===this.k.length){const k=new Float64Array(this.n*2),v=new Int32Array(this.n*2);k.set(this.k);v.set(this.v);this.k=k;this.v=v}
    const K=this.k,V=this.v;let c=this.n++;while(c>0){const p=(c-1)>>1;if(K[p]<=f)break;K[c]=K[p];V[c]=V[p];c=p}K[c]=f;V[c]=i}
  pop(){const K=this.k,V=this.v,top=V[0],f=K[--this.n],i=V[this.n];let c=0;for(;;){let a=2*c+1;if(a>=this.n)break;if(a+1<this.n&&K[a+1]<K[a])a++;if(K[a]>=f)break;K[c]=K[a];V[c]=V[a];c=a}if(this.n){K[c]=f;V[c]=i}return top}
}
const WAYH=new WayHeap(),WAYG=new WayHeap();
// (the cheapest ways from tile s, by findPath's steps and costs, within the box x0..x1-1, y0..y1-1: the costs (tiles at open-ground
// pace) by the box's own index, Infinity where none; rev: the costs to s instead. A graph node's tile not walkable (a holding's
// own) is reached, never passed through)
function wayLocal(s,x0,y0,x1,y1,rev){const bw=x1-x0,D=new Float64Array(bw*(y1-y0)).fill(Infinity),H=WAYH,sx=s%MW,sy=(s-sx)/MW,NO=wayNodes();H.n=0;
  if(sx<x0||sy<y0||sx>=x1||sy>=y1)return D;const q0=(sy-y0)*bw+sx-x0;D[q0]=0;H.push(0,q0);
  while(H.n){const d=H.top,q=H.pop();if(d>D[q])continue;const x=x0+q%bw,y=y0+((q/bw)|0),i=y*MW+x;if(q!==q0&&!wayOpen(i))continue;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<x0||ny<y0||nx>=x1||ny>=y1)continue;const j=ny*MW+nx;
      if(!wayOpen(j)&&!NO.has(j)||dx&&dy&&(!passable(tiles[y*MW+nx])||!passable(tiles[ny*MW+x])))continue;
      const k=rev?i:j,c=d+(dx&&dy?1.414:1)*wayStep(tiles[k],climate[k]),r=(ny-y0)*bw+nx-x0;if(c<D[r]){D[r]=c;H.push(c,r)}}}
  return D}
// (a chunk's table: its nodes (ids) and the days between each two inside it (d, k x k), made when first needed, kept in the LRU)
function wayChunk(G,c){let T=G.chunk.get(c);if(T){G.chunk.delete(c);G.chunk.set(c,T);return T}
  const ids=G.cnode.subarray(G.coff[c],G.coff[c+1]),k=ids.length,d=new Float32Array(k*k),cx=c%G.cols,cy=(c-cx)/G.cols,x0=cx*G.cs,y0=cy*G.cs,x1=Math.min(MW,x0+G.cs),y1=Math.min(MH,y0+G.cs),DPT=wayDay();
  for(let a=0;a<k;a++){const D=wayLocal(G.tile[ids[a]],x0,y0,x1,y1,false);for(let b=0;b<k;b++){const t=G.tile[ids[b]];d[a*k+b]=D[((t/MW|0)-y0)*(x1-x0)+t%MW-x0]*DPT}}
  T={ids,d};G.chunk.set(c,T);if(G.chunk.size>WAY.chunks)G.chunk.delete(G.chunk.keys().next().value);return T}
// (the nodes a trip starts from at tile t (rev: those it ends at), with the days to (from) each: t's own node; else a gate beside
// it (a party leaving or making for a holding, so the pair cache serves it); else every node of t's chunk it can reach in it)
function wayEnds(G,t,rev){const NO=wayNodes(),x=t%MW,y=(t-x)/MW;if(NO.has(t))return[[NO.get(t),0]];
  for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const v=NO.get(t+a+b*MW);if(v!==undefined&&G.nk[v]===0&&x+a>=0&&x+a<MW)return[[v,(a&&b?1.414:1)*wayStep(tiles[rev?t:t+a+b*MW],climate[rev?t:t+a+b*MW])*wayDay()]]}
  const c=wayChunkOf(G,t),cx=c%G.cols,cy=(c-cx)/G.cols,x0=cx*G.cs,y0=cy*G.cs,x1=Math.min(MW,x0+G.cs),D=wayLocal(t,x0,y0,x1,Math.min(MH,y0+G.cs),rev),out=[];
  for(let k=G.coff[c];k<G.coff[c+1];k++){const v=G.cnode[k],u=G.tile[v],e=D[((u/MW|0)-y0)*(x1-x0)+u%MW-x0];if(e<Infinity)out.push([v,e*wayDay()])}
  return out}
// (the cheapest way over the graph from any start node of A ([node, days to it]...) to any goal node of B (a Map: node to the days
// from it to the goal tile gt): A*, the straight way to gt at road pace still to go; land ways only (no river legs, no closed
// crossing). {cost (days, A's and B's in), nodes, via (the edge taken into each node: its index; -1 a chunk's; -2 the start)}, or null)
let WAYA=null;
function wayGraph(G,A,B,gt){const n=G.n,S=WAYA&&WAYA.g.length>=n?WAYA:(WAYA={g:new Float64Array(n),from:new Int32Array(n),via:new Int32Array(n),mark:new Uint32Array(n),done:new Uint32Array(n),st:0}),st=++S.st,H=WAYG;
  const gx=gt%MW,gy=(gt-gx)/MW,hm=wayDay()/1.3,h=v=>{const t=G.tile[v],dx=Math.abs(t%MW-gx),dy=Math.abs((t/MW|0)-gy);return(dx>dy?dx+.414*dy:dy+.414*dx)*hm};
  const relax=(u,v,c,e)=>{if(S.mark[v]!==st||c<S.g[v]){S.mark[v]=st;S.g[v]=c;S.from[v]=u;S.via[v]=e;H.push(c+h(v),v)}};
  H.n=0;for(const [v,c] of A)relax(-1,v,c,-2);let best=Infinity,bv=-1;
  while(H.n){if(H.top>=best)break;const u=H.pop();if(S.done[u]===st)continue;S.done[u]=st;const gu=S.g[u];
    if(B.has(u)&&gu+B.get(u)<best){best=gu+B.get(u);bv=u}
    for(let e=G.off[u];e<G.off[u+1];e++){const k=G.ek[e];if(k===3||k===4||G.xing[e]>=0&&G.closed[G.xing[e]])continue;relax(u,G.to[e],gu+G.cost[e],e)}
    const T=wayChunk(G,wayChunkOf(G,G.tile[u])),ids=T.ids,k=ids.length,a=ids.indexOf(u);
    for(let b=0;b<k;b++){const c=T.d[a*k+b];if(b!==a&&c<Infinity)relax(u,ids[b],gu+c,-1)}}
  if(bv<0)return null;const nodes=[],via=[];for(let v=bv;v>=0;v=S.from[v]){nodes.push(v);via.push(S.via[v])}
  return{cost:best,nodes:nodes.reverse(),via:via.reverse()}}
// (the graph's way from tile s to tile g (gn: g's node, when it must end there: a holding's gate), the pair cache first between
// two single nodes; counted in Router.stats)
function wayRoute(G,s,g,gn){const t0=performance.now(),A=wayEnds(G,s,false),B=new Map(gn!=null?[[gn,0]]:wayEnds(G,g,true)),t1=performance.now();WAYS.localMs+=t1-t0;WAYS.queries++;
  if(!A.length||!B.size)return null;let r=null;
  if(A.length===1&&B.size===1){const [a,ca]=A[0],[b,cb]=[...B][0],k=a*G.n+b,c=PAIRS.get(k);if(c){WAYS.hits++;PAIRS.delete(k);PAIRS.set(k,c);r={cost:ca+c.g+cb,nodes:c.nodes,via:c.via}}}
  if(!r&&(r=wayGraph(G,A,B,g))){const a=r.nodes[0],b=r.nodes[r.nodes.length-1];PAIRS.set(a*G.n+b,{g:r.cost-A.find(q=>q[0]===a)[1]-B.get(b),nodes:r.nodes,via:r.via});if(PAIRS.size>WAY.pairs)PAIRS.delete(PAIRS.keys().next().value)}
  WAYS.graphMs+=performance.now()-t1;return r}
// (the tiles from one point to another, searched in a box round both (findPath), then in a wider one; timed into Router.stats)
const wayFind=(x0,y0,x1,y1)=>{const t0=performance.now(),p=findPath(x0,y0,x1,y1,8)||findPath(x0,y0,x1,y1,24);WAYS.localMs+=performance.now()-t0;return p};
const wayLine=(x0,y0,x1,y1)=>{if(!clearLine(x0,y0,x1,y1))return false;if(!SHUT)return true;const n=Math.ceil(Math.hypot(x1-x0,y1-y0)/4);for(let i=1;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;if(SHUT[Math.floor(y/TILE)*MW+Math.floor(x/TILE)])return false}return true};
const wayCentre=k=>[(k%MW+.5)*TILE,((k/MW|0)+.5)*TILE];
// a walker's way to goal (a point; with tw, a holding reached by its gate's node): its legs, each walked in turn ({k: 'tiles'
// (searched to tile b from wherever the walker stands), 'road' or 'xing' (edge e's own tiles: a road's, a bridge's or a ford's; a
// ferry's crossing, sailed straight over), 'step' (over a portal's border to tile b), 'end' (the last stretch to the goal),
// 'path' (all its tiles, p: a trip searched on the whole map)}), or legs null when there is none
function wayTrip(o,goal){const G=WM.graph,s=Math.floor(o.y/TILE)*MW+Math.floor(o.x/TILE),g=Math.floor(goal.y/TILE)*MW+Math.floor(goal.x/TILE),sx=s%MW,gx=g%MW;
  if(Math.max(Math.abs(sx-gx),Math.abs((s-sx)/MW-(g-gx)/MW))<=WAY.near){const t0=performance.now(),p=wayLine(o.x,o.y,goal.x,goal.y)?[]:findPath(o.x,o.y,goal.x,goal.y);WAYS.localMs+=performance.now()-t0;if(p)return{legs:[{k:'path',p}]}}
  const gn=goal.tw?wayNodes().get(goal.tw.ty*MW+goal.tw.tx):null,r=s>=0&&g>=0&&s<MW*MH&&g<MW*MH?wayRoute(G,s,g,gn):null;
  if(!r){if(!Router.reach(o,goal))return{legs:null};const t0=performance.now(),p=findPath(o.x,o.y,goal.x,goal.y,Math.max(MW,MH));WAYS.localMs+=performance.now()-t0;return{legs:p?[{k:'path',p}]:null}}
  const L=[{k:'tiles',b:G.tile[r.nodes[0]]}];
  for(let i=1;i<r.nodes.length;i++){const e=r.via[i],b=G.tile[r.nodes[i]];L.push(e<0?{k:'tiles',b}:G.ek[e]===2?{k:'xing',e,b}:G.ek[e]===5?{k:'step',b}:{k:'road',e})}
  L.push({k:'end'});return{legs:L}}
// (a leg's tiles, from where walker o stands: a list of tile indices; a ferry's {ferry: its far landing}; null if none is found)
function wayLeg(L,o,goal){const G=WM.graph;
  if(L.k==='path')return L.p;if(L.k==='step')return[L.b];
  if(L.k==='tiles'){const [x,y]=wayCentre(L.b);return Math.floor(o.x/TILE)+Math.floor(o.y/TILE)*MW===L.b?[]:wayFind(o.x,o.y,x,y)}
  if(L.k==='end')return wayLine(o.x,o.y,goal.x,goal.y)?[]:wayFind(o.x,o.y,goal.x,goal.y);
  if(L.k==='road'){const p=WM.roads[G.leg[L.e*3]].path,a=G.leg[L.e*3+1],b=G.leg[L.e*3+2];return a<b?p.slice(a+1,b+1):p.slice(b,a).reverse()}
  const c=WM.crossings[G.xing[L.e]];if(c.kind==='ferry')return{ferry:L.b};return L.b===c.j?[...c.tiles,c.j]:[...c.tiles].reverse().concat(c.i)}
// one step along the way to goal (Router.travel on the generated world): its legs found when the goal's tile changes (or the ways
// do: WAYV), each leg's tiles when it is reached; a holding with no way found is walked to straight, as today's field does
function wayTravel(o,goal,step){
  const dd=Math.hypot(goal.x-o.x,goal.y-o.y),straight=()=>{walk(o,goal.x-o.x,goal.y-o.y,Math.min(dd,step));return true};if(dd<=1)return true;
  if(goal.tw&&dd<TILE*1.6)return straight();
  const gt=Math.floor(goal.y/TILE)*MW+Math.floor(goal.x/TILE);let r=ROUTES.get(o);
  if(!r||r.goal!==gt||r.v!==WAYV){r=wayTrip(o,goal);r.goal=gt;r.v=WAYV;r.li=0;r.path=null;ROUTES.set(o,r)}
  if(!r.legs)return goal.tw?straight():false;
  for(let n=0;n<64;n++){
    if(!r.path){if(r.li>=r.legs.length)return straight();r.path=wayLeg(r.legs[r.li++],o,goal);r.pi=0;if(!r.path){r.legs=null;return goal.tw?straight():false}}
    if(r.path.ferry!=null){const [x,y]=wayCentre(r.path.ferry),d=Math.hypot(x-o.x,y-o.y);if(d<3){r.path=null;continue}const s=Math.min(d,step);o.x+=(x-o.x)/d*s;o.y+=(y-o.y)/d*s;return true}
    while(r.pi<r.path.length){const k=r.path[r.pi],[x,y]=wayCentre(k),d=Math.hypot(x-o.x,y-o.y);if(d<3||d<TILE*1.5&&!wayOpen(k)){r.pi++;continue}walk(o,x-o.x,y-o.y,Math.min(d,step));return true}
    r.path=null}
  return true}
// (the days from a to b at WAY.pace, Router.days on the generated world: within WAY.near tiles its tiles' costs, else the graph's;
// Infinity when there is no way)
function wayDays(a,b){const s=wayTile(a),g=wayTile(b);if(s<0||g<0)return Infinity;if(s===g)return 0;if(!Router.reach(a,b))return Infinity;
  const sx=s%MW,gx=g%MW,[x0,y0]=wayCentre(s),[x1,y1]=wayCentre(g);
  if(Math.max(Math.abs(sx-gx),Math.abs((s-sx)/MW-(g-gx)/MW))<=WAY.near){const p=findPath(x0,y0,x1,y1);if(p)return wayCost(s,p)}
  const r=wayRoute(WM.graph,s,g,b instanceof Holding?wayNodes().get(g):null);return r?r.cost:Infinity}
// (the days a list of tiles takes from tile s, at WAY.pace: tests/router.js weighs ways by it)
function wayCost(s,p){let c=0,a=s;for(const k of p){const d=a%MW!==k%MW&&(a/MW|0)!==(k/MW|0)?1.414:1;c+=d*wayStep(tiles[k],climate[k]);a=k}return c*wayDay()}
