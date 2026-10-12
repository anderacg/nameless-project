'use strict';
/* ---------- map ---------- */
function hash(x,y,s){let h=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,2147483647);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296}
function noise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
const fbm=(x,y,s)=>noise(x,y,s)*.6+noise(x*2,y*2,s+1)*.3+noise(x*4,y*4,s+2)*.1;
// two layers per tile: terrain (what is on the ground) and climate (how cold, hot or wet it is)
const T_OPEN=0,T_FOREST=1,T_HILL=2,T_WATER=3,T_ROAD=4,T_MOUNT=5;
const tiles=new Uint8Array(MW*MH),climate=new Uint8Array(MW*MH);
const CLIMS=['grass','frost','desert','swamp'],CLIM=Object.fromEntries(CLIMS.map((c,i)=>[c,i]));
const SPEEDMUL=[1,.6,.75,0,1.3,0];
const CLIMMUL={grass:1,frost:.7,desert:.85,swamp:.5};
const tAt=(tx,ty)=>(tx<0||ty<0||tx>=MW||ty>=MH)?T_WATER:tiles[ty*MW+tx];
const terrAt=(x,y)=>tAt(Math.floor(x/TILE),Math.floor(y/TILE));
const climAt=(x,y)=>{const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return(tx<0||ty<0||tx>=MW||ty>=MH)?'grass':CLIMS[climate[ty*MW+tx]]};
const passable=t=>t!==T_WATER&&t!==T_MOUNT;
const NS=MW/56*.85; // noise scale: keeps regions broad as the map grows
(function genMap(){
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
    const h=fbm(x/(9*NS),y/(9*NS),7),m=fbm(x/(6*NS),y/(6*NS),19),temp=y/(MH-1)+(fbm(x/(8*NS),y/(8*NS),31)-.5)*.4,dry=m-.22*(x/MW)+.08;
    let t=T_OPEN;if(h<.36)t=T_WATER;else if(h>.74)t=T_MOUNT;else if(h>.64)t=T_HILL;else if(m>.6)t=T_FOREST;
    let c=CLIM.grass;if(temp<.3)c=CLIM.frost;else if(temp>.62&&dry<.44)c=CLIM.desert;else if(temp>.55&&m>.52&&h<.46)c=CLIM.swamp;
    if(x<1||y<1||x>=MW-1||y>=MH-1)t=T_WATER;
    tiles[y*MW+x]=t;climate[y*MW+x]=c;
  }
  // each holding sets the climate around it, so its region always matches its people
  {const r=Math.round(6*MW/112);TOWNS.forEach(tw=>{for(let y=tw.ty-r;y<=tw.ty+r;y++)for(let x=tw.tx-r;x<=tw.tx+r;x++)if(x>=0&&y>=0&&x<MW&&y<MH&&Math.hypot(x-tw.tx,y-tw.ty)<=r)climate[y*MW+x]=CLIM[tw.clim]})}
  for(let i=0;i<MW*MH;i++)if(climate[i]===CLIM.desert&&tiles[i]===T_FOREST)tiles[i]=T_OPEN;
  // a port needs water: carve a small bay beside any port holding the land left dry
  TOWNS.filter(tw=>tw.style==='port').forEach(tw=>{let wet=false;for(let y=tw.ty-9;y<=tw.ty+9&&!wet;y++)for(let x=tw.tx-9;x<=tw.tx+9;x++)if(x>=0&&y>=0&&x<MW&&y<MH&&tiles[y*MW+x]===T_WATER&&Math.hypot(x-tw.tx,y-tw.ty)<=9){wet=true;break}
    if(wet)return;const cx=tw.tx+7,cy=tw.ty+5;for(let y=cy-5;y<=cy+5;y++)for(let x=cx-6;x<=cx+6;x++)if(x>0&&y>0&&x<MW-1&&y<MH-1&&Math.hypot((x-cx)/1.3,y-cy)<=4.2-hash(x,y,tw.seed)*.8)tiles[y*MW+x]=T_WATER});
  POIS.forEach(p=>{for(let y=p.y-2;y<=p.y+2;y++)for(let x=p.x-2;x<=p.x+2;x++){if(x>0&&y>0&&x<MW-1&&y<MH-1)tiles[y*MW+x]=T_OPEN}});
  let seed=1234;const R=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const carve=(a,b)=>{let x=a.x,y=a.y;while(x!==b.x||y!==b.y){tiles[y*MW+x]=T_ROAD;const dx=Math.sign(b.x-x),dy=Math.sign(b.y-y);if(dx&&(!dy||R()<.55))x+=dx;else if(dy)y+=dy;else x+=dx}tiles[b.y*MW+b.x]=T_ROAD};
  // roads: a spanning tree keeps every holding connected, then each holding also links to its two nearest neighbors
  const pts=TOWNS.map(t=>({x:t.tx,y:t.ty})),dist=(a,b)=>Math.hypot(pts[a].x-pts[b].x,pts[a].y-pts[b].y),edges=new Set(),key=(a,b)=>a<b?a+'-'+b:b+'-'+a;
  const inTree=[0];while(inTree.length<pts.length){let best=null;for(const a of inTree)for(let b=0;b<pts.length;b++)if(!inTree.includes(b)&&(!best||dist(a,b)<best[2]))best=[a,b,dist(a,b)];edges.add(key(best[0],best[1]));inTree.push(best[1])}
  pts.forEach((p,a)=>pts.map((q,b)=>b).filter(b=>b!==a).sort((u,v)=>dist(a,u)-dist(a,v)).slice(0,2).forEach(b=>edges.add(key(a,b))));
  [...edges].sort().forEach(k=>{const [a,b]=k.split('-').map(Number);carve(pts[a],pts[b])});
  CAMPS.forEach(c=>{const p={x:c.tx,y:c.ty},n=pts.reduce((m,q)=>Math.hypot(q.x-p.x,q.y-p.y)<Math.hypot(m.x-p.x,m.y-p.y)?q:m);carve(p,n)});
})();

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
