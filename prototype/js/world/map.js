'use strict';
/* ---------- map ---------- */
function hash(x,y,s){let h=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,2147483647);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296}
function noise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
const fbm=(x,y,s)=>noise(x,y,s)*.6+noise(x*2,y*2,s+1)*.3+noise(x*4,y*4,s+2)*.1;
// two layers per tile: terrain (what is on the ground) and climate (how cold, hot or wet it is)
const T_OPEN=0,T_FOREST=1,T_HILL=2,T_WATER=3,T_ROAD=4,T_MOUNT=5;
// (tiles, climate: the layers of the map that is in, by these names for the hot loops: world/worldmap.js useWorld)
const CLIMS=['grass','frost','desert','swamp'],CLIM=Object.fromEntries(CLIMS.map((c,i)=>[c,i]));
const SPEEDMUL=[1,.6,.75,0,1.3,0];
const CLIMMUL={grass:1,frost:.7,desert:.85,swamp:.5};
const tAt=(tx,ty)=>(tx<0||ty<0||tx>=MW||ty>=MH)?T_WATER:tiles[ty*MW+tx];
const terrAt=(x,y)=>tAt(Math.floor(x/TILE),Math.floor(y/TILE));
const climAt=(x,y)=>{const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return(tx<0||ty<0||tx>=MW||ty>=MH)?'grass':CLIMS[climate[ty*MW+tx]]};
const passable=t=>t!==T_WATER&&t!==T_MOUNT;
/* the classic world: its land, climate, roads and bandit camps, made on map from its holdings (places) and camp spots (camps,
   moved onto clear ground). The body reads the map's layers and size by the usual names. */
function genClassic(map,places,camps){
  const MW=map.w,MH=map.h,tiles=map.kind,climate=map.clim,NS=MW/56*.85;// (NS: noise scale: keeps regions broad as the map grows)
  const POIS=[...places.map(t=>({x:t.tx,y:t.ty})),...camps.map(c=>({x:c.tx,y:c.ty}))];
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
    const h=fbm(x/(9*NS),y/(9*NS),7),m=fbm(x/(6*NS),y/(6*NS),19),temp=y/(MH-1)+(fbm(x/(8*NS),y/(8*NS),31)-.5)*.4,dry=m-.22*(x/MW)+.08;
    let t=T_OPEN;if(h<.36)t=T_WATER;else if(h>.74)t=T_MOUNT;else if(h>.64)t=T_HILL;else if(m>.6)t=T_FOREST;
    let c=CLIM.grass;if(temp<.3)c=CLIM.frost;else if(temp>.62&&dry<.44)c=CLIM.desert;else if(temp>.55&&m>.52&&h<.46)c=CLIM.swamp;
    if(x<1||y<1||x>=MW-1||y>=MH-1)t=T_WATER;
    tiles[y*MW+x]=t;climate[y*MW+x]=c;
  }
  // each holding sets the climate around it, so its region always matches its people
  {const r=Math.round(6*MW/112);places.forEach(tw=>{for(let y=tw.ty-r;y<=tw.ty+r;y++)for(let x=tw.tx-r;x<=tw.tx+r;x++)if(x>=0&&y>=0&&x<MW&&y<MH&&Math.hypot(x-tw.tx,y-tw.ty)<=r)climate[y*MW+x]=CLIM[tw.clim]})}
  for(let i=0;i<MW*MH;i++)if(climate[i]===CLIM.desert&&tiles[i]===T_FOREST)tiles[i]=T_OPEN;
  // a port needs water: carve a small bay beside any port holding the land left dry
  places.filter(tw=>tw.style==='port').forEach(tw=>{let wet=false;for(let y=tw.ty-9;y<=tw.ty+9&&!wet;y++)for(let x=tw.tx-9;x<=tw.tx+9;x++)if(x>=0&&y>=0&&x<MW&&y<MH&&tiles[y*MW+x]===T_WATER&&Math.hypot(x-tw.tx,y-tw.ty)<=9){wet=true;break}
    if(wet)return;const cx=tw.tx+7,cy=tw.ty+5;for(let y=cy-5;y<=cy+5;y++)for(let x=cx-6;x<=cx+6;x++)if(x>0&&y>0&&x<MW-1&&y<MH-1&&Math.hypot((x-cx)/1.3,y-cy)<=4.2-hash(x,y,tw.seed)*.8)tiles[y*MW+x]=T_WATER});
  // each holding and camp stands on open ground: a round patch cleared under it, and round that a ragged shore of new land where
  // it stood in water (and hills where it stood in the peaks), so none sits on a square of land in the sea
  POIS.forEach(p=>{for(let y=p.y-6;y<=p.y+6;y++)for(let x=p.x-6;x<=p.x+6;x++){if(x<1||y<1||x>=MW-1||y>=MH-1)continue;const d=Math.hypot(x-p.x,y-p.y),i=y*MW+x;
    if(d<=2.5)tiles[i]=T_OPEN;else if(d<=3.6+hash(x,y,7)*1.8){if(tiles[i]===T_WATER)tiles[i]=T_OPEN;else if(tiles[i]===T_MOUNT)tiles[i]=T_HILL}}});
  // no holding stands on an island: one cut off from the main land gets a neck of land to it, the shortest way
  // (over water it is new ground, through peaks a pass of hills)
  {const N4=[[1,0],[-1,0],[0,1],[0,-1]];
    for(let pass=0;pass<places.length;pass++){
      const comp=new Int32Array(MW*MH).fill(-1),size=[];let cid=0;
      for(let i=0;i<MW*MH;i++){if(comp[i]>=0||!passable(tiles[i]))continue;let k=0;const q=[i];comp[i]=cid;
        while(q.length){const j=q.pop();k++;const x=j%MW,y=(j/MW)|0;for(const [a,b] of N4){const nx=x+a,ny=y+b,m=ny*MW+nx;if(nx<0||ny<0||nx>=MW||ny>=MH||comp[m]>=0||!passable(tiles[m]))continue;comp[m]=cid;q.push(m)}}size.push(k);cid++}
      const big=size.indexOf(Math.max(...size)),cut=places.find(t=>comp[t.ty*MW+t.tx]!==big);if(!cut)break;
      const own=comp[cut.ty*MW+cut.tx],prev=new Int32Array(MW*MH).fill(-2),q=[];for(let i=0;i<MW*MH;i++)if(comp[i]===own){prev[i]=-1;q.push(i)}
      let end=-1;for(let h=0;h<q.length&&end<0;h++){const j=q[h],x=j%MW,y=(j/MW)|0;for(const [a,b] of N4){const nx=x+a,ny=y+b,m=ny*MW+nx;if(nx<1||ny<1||nx>=MW-1||ny>=MH-1||prev[m]!==-2)continue;prev[m]=j;if(comp[m]===big){end=m;break}q.push(m)}}
      if(end<0)break;
      for(let j=prev[end];j>=0&&prev[j]!==-1;j=prev[j]){const x=j%MW,y=(j/MW)|0;for(const [a,b] of [[0,0],[1,0],[0,1],[1,1],[-1,0],[0,-1]]){if(a<0||b<0?hash(x+a,y+b,9)<.45:false)continue;const m=(y+b)*MW+x+a;if(tiles[m]===T_WATER)tiles[m]=T_OPEN;else if(tiles[m]===T_MOUNT)tiles[m]=T_HILL}}// (2 wide at least, ragged to 3)
    }}
  // roads: the cheapest way over the land, keeping to roads already made (so roads share their way and their bridges). They
  // cross water only by a short straight bridge over a strait (MAX_BRIDGE tiles at most); only if there is no such way at all
  // does a road take a longer one.
  const MAX_BRIDGE=3,RUN=[new Uint8Array(MW*MH),new Uint8Array(MW*MH)];// the stretch of water each water tile lies in, across and down
  for(let y=0;y<MH;y++)for(let x=0;x<MW;){if(tiles[y*MW+x]!==T_WATER){x++;continue}let e=x;while(e<MW&&tiles[y*MW+e]===T_WATER)e++;for(let k=x;k<e;k++)RUN[0][y*MW+k]=Math.min(255,e-x);x=e}
  for(let x=0;x<MW;x++)for(let y=0;y<MH;){if(tiles[y*MW+x]!==T_WATER){y++;continue}let e=y;while(e<MH&&tiles[e*MW+x]===T_WATER)e++;for(let k=y;k<e;k++)RUN[1][k*MW+x]=Math.min(255,e-y);y=e}
  const roadCost=[1,1.8,2.2,0,.5,0];
  const roadPath=(a,b,strict)=>{// A* over (tile, how it is crossing water: 0 on land, 1 across, 2 down)
    const S=MW*MH*3,g=new Float64Array(S).fill(Infinity),from=new Int32Array(S).fill(-1),heap=[],h=(x,y)=>Math.abs(x-b.x)+Math.abs(y-b.y);
    const push=(i,f)=>{heap.push([f,i]);let k=heap.length-1;while(k>0){const q=(k-1)>>1;if(heap[q][0]<=heap[k][0])break;[heap[q],heap[k]]=[heap[k],heap[q]];k=q}};
    const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===k)break;[heap[m],heap[k]]=[heap[k],heap[m]];k=m}}return top};
    const s0=(a.y*MW+a.x)*3;g[s0]=0;push(s0,h(a.x,a.y));let goal=-1;
    while(heap.length){const [,st]=pop(),i=(st/3)|0,mode=st%3,x=i%MW,y=(i/MW)|0;if(x===b.x&&y===b.y){goal=st;break}
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<1||ny<1||nx>=MW-1||ny>=MH-1)continue;const j=ny*MW+nx,t=tiles[j];let nm=0,c;
        if(t===T_WATER){const ax=dx?1:2;if(strict&&((mode&&mode!==ax)||RUN[ax-1][j]>MAX_BRIDGE))continue;nm=ax;c=strict?6:30}
        else if(t===T_MOUNT)continue;else{if(mode&&strict&&(dx?1:2)!==mode)continue;c=roadCost[t]}
        const ns=j*3+nm,nd=g[st]+c+hash(nx,ny,11)*.5;if(nd<g[ns]){g[ns]=nd;from[ns]=st;push(ns,nd+h(nx,ny))}}}
    if(goal<0)return null;const out=[];for(let st=goal;st>=0;st=from[st])out.push((st/3)|0);return out};
  const BRIDGED=new Uint8Array(MW*MH);// road tiles laid over water: the bridges
  const carve=(a,b)=>{const path=roadPath(a,b,true)||roadPath(a,b,false);if(path)for(const i of path){if(tiles[i]===T_WATER)BRIDGED[i]=1;tiles[i]=T_ROAD}};
  // roads: a spanning tree keeps every holding connected, then each holding also links to its two nearest neighbors
  const pts=places.map(t=>({x:t.tx,y:t.ty})),dist=(a,b)=>Math.hypot(pts[a].x-pts[b].x,pts[a].y-pts[b].y),edges=new Set(),key=(a,b)=>a<b?a+'-'+b:b+'-'+a;
  const inTree=[0];while(inTree.length<pts.length){let best=null;for(const a of inTree)for(let b=0;b<pts.length;b++)if(!inTree.includes(b)&&(!best||dist(a,b)<best[2]))best=[a,b,dist(a,b)];edges.add(key(best[0],best[1]));inTree.push(best[1])}
  pts.forEach((p,a)=>pts.map((q,b)=>b).filter(b=>b!==a).sort((u,v)=>dist(a,u)-dist(a,v)).slice(0,2).forEach(b=>edges.add(key(a,b))));
  [...edges].sort().forEach(k=>{const [a,b]=k.split('-').map(Number);carve(pts[a],pts[b])});
  // a road on a strip of land one tile wide, water both sides, would look like a bridge: the strip is widened by a tile (on
  // whichever side is not beside a real bridge)
  for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){const i=y*MW+x;if(tiles[i]!==T_ROAD||BRIDGED[i])continue;
    for(const [a,b] of [[1,0],[0,1]])if(tiles[i-a-b*MW]===T_WATER&&tiles[i+a+b*MW]===T_WATER){
      const side=[i+a+b*MW,i-a-b*MW].find(j=>![[1,0],[-1,0],[0,1],[0,-1]].some(([c,d])=>BRIDGED[j+c+d*MW]));if(side!=null)tiles[side]=T_OPEN}}
  // bandit camps: each on the clear ground nearest its spot, off every road (its 2 x 2 tiles and a tile round them), out of the
  // water and the peaks, clear of holdings and reachable from them; no road leads to a camp. Its tiles are cleared to open ground.
  {const reach=new Uint8Array(MW*MH),q=[places[0].ty*MW+places[0].tx];reach[q[0]]=1;
    while(q.length){const i=q.pop(),x=i%MW,y=(i/MW)|0;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+a,ny=y+b,j=ny*MW+nx;if(nx<0||ny<0||nx>=MW||ny>=MH||reach[j]||!passable(tiles[j]))continue;reach[j]=1;q.push(j)}}
    const ok=(cx,cy)=>{if(!reach[cy*MW+cx]||places.some(t=>Math.hypot(t.tx-cx,t.ty-cy)<5))return false;
      for(let y=cy-2;y<=cy+1;y++)for(let x=cx-1;x<=cx+2;x++){if(x<1||y<1||x>=MW-1||y>=MH-1)return false;const t=tiles[y*MW+x];if(t===T_ROAD||t===T_WATER||t===T_MOUNT)return false}return true};
    for(const c of camps){let p=null;for(let r=0;r<20&&!p;r++)for(let y=c.ty-r;y<=c.ty+r&&!p;y++)for(let x=c.tx-r;x<=c.tx+r&&!p;x++)if(Math.max(Math.abs(x-c.tx),Math.abs(y-c.ty))===r&&ok(x,y))p=[x,y];
      if(p){c.tx=p[0];c.ty=p[1]}for(let y=c.ty-1;y<=c.ty;y++)for(let x=c.tx;x<=c.tx+1;x++)tiles[y*MW+x]=T_OPEN;c.x=(c.tx+.5)*TILE;c.y=(c.ty+.5)*TILE}}
  return map;
}

/* regions: what a place is called and how it treats travelers */
const REGION_NAMES={grass:['Grassland','Forest','Hills','Lake','Road','Mountains'],frost:['Tundra','Frost forest','Frozen hills','Ice lake','Frozen road','Frost peaks'],
  desert:['Desert','Desert','Rocky badlands','Oasis','Desert road','Red peaks'],swamp:['Swamp','Mangrove','Mire hills','Bog water','Causeway','Peaks']};
function regionAt(x,y){const t=terrAt(x,y),c=climAt(x,y);return{t,c,name:REGION_NAMES[c][t]}}
// base travel speed for anyone; race only matters for the player's own party
function speedAt(x,y,race,extra){
  const t=terrAt(x,y),c=climAt(x,y);if(!passable(t))return 0;
  if(t===T_ROAD)return 1.3*(race==='human'?1.1:1);
  const home=(race?RACES[race].home:[]).concat(extra||[]);
  const tm=(t===T_FOREST&&home.includes('forest'))||(t===T_HILL&&home.includes('hills'))?1:SPEEDMUL[t];
  const cm=home.includes(c)?1:CLIMMUL[c];
  return Math.max(.35,tm*cm)*(race==='human'&&c==='grass'&&t===T_OPEN?1.1:1);
}
function visMulAt(x,y){const t=terrAt(x,y),c=climAt(x,y);return t===T_HILL?1.3:t===T_FOREST?.7:c==='swamp'?.8:c==='desert'?1.2:1}
const hiddenAt=(x,y)=>terrAt(x,y)===T_FOREST;
function nearWater(x,y,r){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(tAt(tx+i,ty+j)===T_WATER&&tx+i>0&&ty+j>0&&tx+i<MW-1&&ty+j<MH-1)return true;return false}
// move something stuck on water or a mountain (old saves, map changes) to the nearest open tile
function unstick(o){
  if(passable(terrAt(o.x,o.y)))return;const tx=Math.floor(o.x/TILE),ty=Math.floor(o.y/TILE);
  for(let r=1;r<20;r++)for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(passable(tAt(tx+i,ty+j))){o.x=(tx+i+.5)*TILE;o.y=(ty+j+.5)*TILE;return}
}

/* pathfinding: one travel-cost map per destination, built on first use */
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
  if(!r||r.goal!==goal){r={goal,path:clearLine(o.x,o.y,x,y)?[]:findPath(o.x,o.y,x,y),i:0};ROUTES.set(o,r)}
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
