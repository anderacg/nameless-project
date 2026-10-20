'use strict';
/* ---------- the router: every way over the land, behind three calls (doc/WORLD_DESIGN.md §3.6), so how ways are found can
   change behind them (the way graph, later) and no walker notices:
     Router.travel(o, goal, step): one step of o toward goal, a point {x, y}; with tw (a holding) the way leads to that holding
       by its roads and the last stretch goes straight to the point. True while on its way, false when goal cannot be reached
       from where o stands (the walker should pick another)
     Router.reach(a, b): can one walk from a to b (a holding from its own tile, anything else from its point)
     Router.days(a, b, pace): how many days' march from a to b at pace (px a world second, unscaled: MAP_BASE if left out);
       Infinity when there is no way
   Today's ways underneath, as they always were: a holding's travel-cost field (flowTo), a search in a box (findPath) behind a
   straight look (clearLine); reach reads a label per tile, the piece of land it lies on (one flood fill a world). ---------- */
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
      const t=tiles[ny*MW+nx];if(!passable(t))continue;if(dx&&dy&&(!passable(tiles[y*MW+nx])||!passable(tiles[ny*MW+x])))continue;
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
   open, so a diagonal step joins nothing new), -1 for water and peaks. Made on first use, again for a new world */
let LAND_PIECE=null;
onWorld(()=>{LAND_PIECE=null});
function landPieces(){
  if(LAND_PIECE)return LAND_PIECE;const id=new Int32Array(MW*MH).fill(-1);let n=0;
  for(let i=0;i<MW*MH;i++){if(id[i]>=0||!passable(tiles[i]))continue;id[i]=n;const q=[i];
    while(q.length){const j=q.pop(),x=j%MW,y=(j/MW)|0;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+a,ny=y+b,k=ny*MW+nx;if(nx<0||ny<0||nx>=MW||ny>=MH||id[k]>=0||!passable(tiles[k]))continue;id[k]=n;q.push(k)}}n++}
  return LAND_PIECE=id;
}
// the tile a place is reached on: a holding's own tile (where its ways start), anything else's point; -1 off the map
const wayTile=p=>{const h=p instanceof Holding,tx=h?p.tx:Math.floor(p.x/TILE),ty=h?p.ty:Math.floor(p.y/TILE);return tx<0||ty<0||tx>=MW||ty>=MH?-1:ty*MW+tx};
// the way to a holding, a goal for Router.travel: the spot in front of its gate (dx along it), by the holding's roads
const gateGoal=(t,dx)=>({x:t.x+(dx||0),y:t.y+12,tw:t});
const Router={
  travel(o,goal,step){if(goal.tw){travelTo(o,goal.tw,goal.x,goal.y,step);return true}return routeTo(o,goal.x,goal.y,step)},
  reach(a,b){const L=landPieces(),i=wayTile(a),j=wayTile(b);return i>=0&&j>=0&&L[i]>=0&&L[i]===L[j]},
  // (a holding's field costs tiles at open-ground pace; between two other places, the straight line if they share their land.
  // A day's march: pace x a day's world seconds, by the movement lever)
  days(a,b,pace){const t=b instanceof Holding?b:a instanceof Holding?a:null,i=wayTile(t===b?a:b),
      n=i<0?Infinity:t?flowTo(t)[i]:this.reach(a,b)?Math.hypot(a.x-b.x,a.y-b.y)/TILE:Infinity;
    return n*TILE/moveStep(pace||MAP_BASE,DAY_SECONDS*WORLD_PACE)}
};
/* the way graph (doc/WORLD_DESIGN.md §3.6, §15.2.1: a WayGraph, {n, tile, nk, off, to, cost, ek, xing, chunk, closed}), built by
   the generator's last stage (worldgen.js, its stage context g) from the world's roads, crossings, landings and chunk portals.
   Phase 2 wave 2 (D) builds it, keeping the generator's rules (seeded, no Math.hypot...: §8.1); till then none, and Router finds
   its ways as above */
function buildWayGraph(g){return null}
