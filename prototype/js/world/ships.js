'use strict';
/* ---------- ships: fishing boats work the fishing grounds by day; trade ships carry a port's surplus to another port ---------- */
// W.ships: {k:'fish'|'trade', home, to, fac, x, y, path:[tile], i, goods, seed, dir, state, until, big, col}. Not saved: after a
// load the boats put out again. Ships only move on water, along a path over water tiles from one dock (the water off the end
// of a port's pier) to another. Each morning a port sends out a fishing boat per level of its port, to a fishing ground of its
// land (resources.js) or open water near it; it fishes there and is home before night (its catch is the port's own yield).
// A port with surplus sends a trade ship to the friendly port on the same water that needs it most; the goods arrive in that
// port's stock with the toll, as a caravan's do (caravanArrive).
const SHIP_SPD=26,BOAT_SPD=13,SHIP_CAP=Math.round(10*MAP_DENS);
// open water a boat can sail: not the frozen lakes of the frost (their ports fish through the ice). The sea round the edge
// of the world is the coastal route that joins the ports of different shores
const isWater=(x,y)=>x>=0&&y>=0&&x<MW&&y<MH&&tiles[y*MW+x]===T_WATER&&climate[y*MW+x]!==CLIM.frost;

// the bodies of water: every water tile labelled by the sea or lake it belongs to
let WATER_ID=null;
function waterIds(){
  if(WATER_ID)return WATER_ID;const id=new Int32Array(MW*MH).fill(-1);let n=0;
  for(let i=0;i<MW*MH;i++){if(tiles[i]!==T_WATER||id[i]>=0)continue;id[i]=n;const q=[i];
    while(q.length){const j=q.pop(),x=j%MW,y=(j/MW)|0;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(y+b)*MW+x+a;if(isWater(x+a,y+b)&&id[k]<0){id[k]=n;q.push(k)}}}n++}
  return WATER_ID=id;
}
// a port's dock: the water tile just off the end of its pier (or the nearest water to it)
function dockOf(t){
  if(!bldLv(t,'port'))return null;const pr=pierOf(t);if(!pr)return null;const len=10+bldLv(t,'port')*6+8,v={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]}[pr.dir];
  const cx=Math.floor((pr.x+v[0]*len)/TILE),cy=Math.floor((pr.y+v[1]*len)/TILE);
  for(let r=0;r<=3;r++)for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(Math.max(Math.abs(i),Math.abs(j))===r&&isWater(cx+i,cy+j))return{tx:cx+i,ty:cy+j};
  return null;
}
// the way over water from one tile to another (8 ways, never cutting a corner of land): the tiles in order, or null
function shipPath(a,b){
  const s=a.ty*MW+a.tx,e=b.ty*MW+b.tx;if(s===e)return[e];const prev=new Int32Array(MW*MH).fill(-1);prev[s]=s;const q=[s];let h=0;
  while(h<q.length){const j=q[h++];if(j===e)break;const x=j%MW,y=(j/MW)|0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,ny=y+dy,k=ny*MW+nx;
      if(!isWater(nx,ny)||prev[k]>=0||(dx&&dy&&!(isWater(x+dx,y)&&isWater(x,y+dy))))continue;prev[k]=j;q.push(k)}}
  if(prev[e]<0)return null;const p=[];for(let j=e;j!==s;j=prev[j])p.push(j);return p.reverse();
}
const shipsOf=(t,k)=>(W.ships||[]).filter(s=>s.home===t.name&&s.k===k);
function launch(t,k,to,target,o){
  const d=dockOf(t),p=d&&shipPath(d,target);if(!p)return null;
  const s=Object.assign({k,home:t.name,to,x:(d.tx+.5)*TILE,y:(d.ty+.5)*TILE,path:p,i:0,seed:rint(1,99999),dir:1,state:'out'},o);W.ships.push(s);return s;
}

/* fishing boats */
// where a boat of this port fishes: a fishing ground of its own land on the same water, else open water 4 to 10 tiles out
function fishingSpot(t,d){
  const W_=waterIds(),body=W_[d.ty*MW+d.tx],own=DEPOSITS.filter(x=>x.kind==='fish'&&W_[x.ty*MW+x.tx]===body&&Math.hypot(x.tx-d.tx,x.ty-d.ty)<=RES_RANGE*1.6);
  if(own.length){const g=own[rint(0,own.length-1)];return{tx:g.tx,ty:g.ty}}
  for(let k=0;k<40;k++){const a=Math.random()*6.283,r=rint(4,10),x=Math.round(d.tx+Math.cos(a)*r),y=Math.round(d.ty+Math.sin(a)*r);if(isWater(x,y)&&W_[y*MW+x]===body)return{tx:x,ty:y}}
  return null;
}
function sendBoats(){
  const tod=G.clock/DAY;if(tod<.22||tod>.4)return;
  for(const t of TOWNS){const lv=bldLv(t,'port');if(!lv||ruined(t)||besieged(t)||shipsOf(t,'fish').length>=lv||Math.random()>.02)continue;
    const d=dockOf(t),at=d&&fishingSpot(t,d);if(at)launch(t,'fish',null,at,{big:false,until:(.56+Math.random()*.12)*DAY})}
}

/* trade ships */
// the friendly port on the same water that needs a good most
function neediestPort(t,g,body){
  let best=null,bv=0;for(const o of TOWNS){if(o===t||!o.owner||o.owner!==t.owner&&atWar(o.owner,t.owner)||besieged(o))continue;const d=dockOf(o);if(!d||waterIds()[d.ty*MW+d.tx]!==body)continue;
    ensureEcon(o);const v=targetStock(o,g)/((o.stock[g]||0)+1)-Math.hypot(o.tx-t.tx,o.ty-t.ty)/300;if(v>bv){bv=v;best=o}}
  return bv>1.2?best:null;
}
function sendShip(t){
  const d=dockOf(t);if(!d)return null;const body=waterIds()[d.ty*MW+d.tx];
  for(const [g,n] of surplusOf(t)){const to=neediestPort(t,g,body);if(!to)continue;const load={[g]:Math.min(n,40)};
    const second=surplusOf(t).find(([h,m])=>h!==g&&targetStock(to,h)>(to.stock[h]||0));if(second)load[second[0]]=Math.min(second[1],25);
    const s=launch(t,'trade',to.name,dockOf(to),{fac:t.owner,goods:load,big:true,col:FACS[t.owner]?FACS[t.owner].col:null});if(!s)continue;
    for(const k in load)t.stock[k]-=load[k];return s}
  return null;
}
function shipDay(){
  W.ships=W.ships||[];
  for(const t of TOWNS){if(W.ships.filter(s=>s.k==='trade').length>=SHIP_CAP)break;if(!bldLv(t,'port')||!t.bld||t.owner==='player'||besieged(t)||ruined(t))continue;
    if(!shipsOf(t,'trade').length&&Math.random()<.3+.1*bldLv(t,'market'))sendShip(t)}
}

/* sailing */
function updateShips(d){
  W.ships=W.ships||[];sendBoats();const tod=G.clock/DAY;
  for(const s of W.ships){
    if(s.state==='fish'){if(G.clock>=s.until||tod<.2){const home=townBy(s.home),dk=home&&dockOf(home),p=dk&&shipPath({tx:Math.floor(s.x/TILE),ty:Math.floor(s.y/TILE)},dk);if(!p){s.gone=true;continue}s.path=p;s.i=0;s.state='home'}continue}
    const j=s.path[s.i];if(j==null){s.gone=true;continue}const tx=(j%MW+.5)*TILE,ty=(((j/MW)|0)+.5)*TILE,dx=tx-s.x,dy=ty-s.y,l=Math.hypot(dx,dy),step=(s.k==='trade'?SHIP_SPD:BOAT_SPD)*d;
    if(Math.abs(dx)>.5)s.dir=dx>0?1:-1;
    if(l<=step){s.x=tx;s.y=ty;s.i++;if(s.i<s.path.length)continue;
      // the end of the way: a fishing boat starts fishing, or is home; a trade ship unloads
      if(s.k==='fish'&&s.state==='out')s.state='fish';
      else{if(s.k==='trade'){const to=townBy(s.to);if(to)caravanArrive(s,to)}s.gone=true}}
    else{s.x+=dx/l*step;s.y+=dy/l*step}
  }
  W.ships=W.ships.filter(s=>!s.gone);
}

/* on the map: each boat rocks on the water, a wake behind it while it sails; a fishing boat at its ground casts its net */
function drawShips(ents,cam,V){
  const now=performance.now();
  for(const s of W.ships||[]){if(Math.hypot(s.x-P.x,s.y-P.y)>V*1.2)continue;
    ents.push({y:s.y+4,f:()=>{const k='ship'+s.seed+(s.big?1:0)+(s.col||''),b=spr[k]||(spr[k]=PX.boat({seed:s.seed,big:s.big,col:s.col||undefined})),sx=Math.round(s.x-cam.x),sy=Math.round(s.y+4-cam.y)+(Math.floor(now/450+s.seed)%2);
      const sailing=s.state!=='fish';
      if(sailing)for(let i=1;i<=3;i++){const ph=(now/300+i/3)%1;ctx.fillStyle=i===1?'#e8f4fa':'#bcd8e8';ctx.fillRect(sx-s.dir*(b.ax+i*3+Math.floor(ph*2)),sy-2+(i%2),2,1)}
      ctx.save();ctx.translate(sx,sy);if(s.dir<0)ctx.scale(-1,1);ctx.drawImage(b.img,-b.ax,-b.ay);ctx.restore();
      if(!sailing){const ph=(now/700+s.seed)%2;ctx.fillStyle='#d8c890';ctx.fillRect(sx+s.dir*4,sy-3,1,3);if(ph<1){ctx.fillStyle='#e8f4fa';ctx.fillRect(sx+s.dir*4-1,sy+1,3,1)}}
      if(s.k==='trade'&&Math.hypot(s.x-P.x,s.y-P.y)<110)txt('Trade ship',sx,sy-b.ay-3,hostileTo(s.fac)?'#ff9a90':'#e8d8a0','center')}})}
}
