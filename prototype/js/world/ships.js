'use strict';
/* ---------- ships: fishing boats work the fishing grounds by day; trade ships carry a port's surplus to another port ---------- */
// W.ships: {k:'fish'|'trade', home, to, fac, x, y, path:[tile], i, goods, seed, dir, state, until, big, col}. Not saved: after a
// load the boats put out again. Ships only move on water, along a path over water tiles from one dock (the water off the end
// of a port's pier) to another. Each morning a port sends out a fishing boat per level of its port, to a fishing ground of its
// land (resources.js) or open water near it; it fishes there and is home before night (its catch is the port's own yield).
// A port with surplus sends a trade ship to the friendly port on the same water that needs it most; the goods arrive in that
// port's stock with the toll, as a caravan's do (caravanArrive).
// a ship (made one in place: asShip): a world object (parties.js), only to be seen: never clicked or met
class Ship extends WorldObject{
  get mapKind(){return 'ship'}
  here(){return W.ships.includes(this)}
  inView(V){return this.fromYou()<=V*1.2}
  // rocking on the water, a wake behind it while it sails; a fishing boat at its ground casts its net; a trade ship's label near you
  draw(ents,cam,V){if(!this.inView(V))return;const s=this,now=performance.now();
    ents.push({y:s.y+4,f:()=>{const b=shipSprite(s),sx=Math.round(s.x-cam.x),sy=Math.round(s.y+4-cam.y)+(Math.floor(now/450+s.seed)%2);
      const sailing=s.state!=='fish';
      if(sailing)for(let i=1;i<=3;i++){const ph=(now/300+i/3)%1;ctx.fillStyle=i===1?'#e8f4fa':'#bcd8e8';ctx.fillRect(sx-s.dir*(b.stern+i*2+Math.floor(ph*2)),sy-1+(i%2),2,1)}
      ctx.save();ctx.translate(sx,sy);if(s.dir<0)ctx.scale(-1,1);ctx.drawImage(b,-b.ax,-b.ay);ctx.restore();
      if(!sailing){const ph=(now/700+s.seed)%2;ctx.fillStyle='#d8c890';ctx.fillRect(sx+s.dir*b.net,sy-3,1,3);if(ph<1){ctx.fillStyle='#e8f4fa';ctx.fillRect(sx+s.dir*b.net-1,sy+1,3,1)}}
      if(s.k==='trade'&&s.fromYou()<110)txt('Trade ship',sx,sy-b.ay+opaqueBox(b)[1]-2,hostileTo(s.fac)?'#ff9a90':'#e8d8a0','center')}})}
}
const asShip=asClass(Ship);
const SHIP_SPD=26,BOAT_SPD=13,SHIP_CAP=density().ships;// (SHIP_CAP: trade ships at sea at once)
// open water a boat can sail: not the frozen lakes of the frost (their ports fish through the ice). The sea round the edge
// of the world is the coastal route that joins the ports of different shores
const isWater=(x,y)=>x>=0&&y>=0&&x<MW&&y<MH&&tiles[y*MW+x]===T_WATER&&climate[y*MW+x]!==CLIM.frost;

// the bodies of water: every water tile labelled by the sea or lake it belongs to
let WATER_ID=null;
onWorld(()=>{WATER_ID=null});// (a new world: labelled afresh)
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
const shipsOf=(t,k)=>W.ships.filter(s=>s.home===t.name&&s.k===k);
function launch(t,k,to,target,o){
  const d=dockOf(t),p=d&&shipPath(d,target);if(!p)return null;
  const s=asShip(Object.assign({k,home:t.name,to,x:(d.tx+.5)*TILE,y:(d.ty+.5)*TILE,path:p,i:0,seed:rint(1,99999),dir:1,state:'out'},o));W.ships.push(s);return s;
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
  for(const t of TOWNS){if(W.ships.filter(s=>s.k==='trade').length>=SHIP_CAP)break;if(!bldLv(t,'port')||!t.bld||t.owner==='player'||besieged(t)||ruined(t))continue;
    if(!shipsOf(t,'trade').length&&Math.random()<.3+.1*bldLv(t,'market'))sendShip(t)}
}

/* sailing */
// a ship's moment (parties.js lodThink; tod: the time of day): on along its way over the water, or fishing until it heads home
const SHIP_MIND={think(s,d,tod){
    if(s.state==='fish'){if(G.clock>=s.until||tod<.2){const home=townBy(s.home),dk=home&&dockOf(home),p=dk&&shipPath({tx:Math.floor(s.x/TILE),ty:Math.floor(s.y/TILE)},dk);if(!p){s.gone=true;return false}s.path=p;s.i=0;s.state='home'}return false}
    const j=s.path[s.i];if(j==null){s.gone=true;return false}const tx=(j%MW+.5)*TILE,ty=(((j/MW)|0)+.5)*TILE,dx=tx-s.x,dy=ty-s.y,l=Math.hypot(dx,dy),step=moveStep(s.k==='trade'?SHIP_SPD:BOAT_SPD,d);
    if(Math.abs(dx)>.5)s.dir=dx>0?1:-1;
    if(l<=step){s.x=tx;s.y=ty;s.i++;if(s.i<s.path.length)return false;
      // the end of the way: a fishing boat starts fishing, or is home; a trade ship unloads
      if(s.k==='fish'&&s.state==='out')s.state='fish';
      else{if(s.k==='trade'){const to=townBy(s.to);if(to)caravanArrive(s,to)}s.gone=true}}
    else{s.x+=dx/l*step;s.y+=dy/l*step}
    return false}};
function updateShips(d){sendBoats();lodEach(W.ships,SHIP_MIND,d,G.clock/DAY);W.ships=W.ships.filter(s=>!s.gone)}

/* on the map, on the map's scale (a man 10 high, as the caravan's ox cart: caravans.js; doc/WORLD_DESIGN.md §10.1): a fishing boat
   is a rowing boat some 12 long, its fisherman in it, in a 16×16 cell; a trade ship is a cog some 26 long and 20 high, high
   sided, a castle at its stern and a smaller one at its bow, one mast with a square sail striped in its owner's colour (col), two
   of its crew at the rail, in a 32×32 cell. Facing right; its waterline is the cell's bottom row, its middle the ship's place.
   stern: how far behind the middle its stern is (the wake starts there); net: how far ahead the fisherman's line goes down.
   moored (a boat tied up at its port's pier: structures.js estateBoats): the rowing boat lies empty, its oar shipped and its
   net heaped in the stern; the cog's sail is furled on its yard. posts: where its mooring lines are made fast, [stern, bow];
   hull: its hull's height over the waterline, top: its castles' (or posts') */
const SH_HULL=['#9a7e5e','#6e5642','#4c3c34','#30262a'];
function shipSprite(o){
  const big=!!o.big,v=(o.seed|0)%3,key='sh'+(big?1:0)+(o.col||'')+v+(o.moored?'m':'');if(spr[key])return spr[key];
  const n=big?32:16,WL=n-1,R=big?26:13,H=SH_HULL,Wo=CV_WOOD,g=pgrid(n,n),s=(x,y,c)=>pset(g,x,y,c);
  // the hull, planked (clinker: a dark seam every other strake), its stern post raked, its stem curved; a cog's castles
  const xa=t=>big?3+Math.floor(t/2):2+(t>1?1:0),xb=t=>big?28-Math.floor(t*t/8):13-(t>1?1:0);
  for(let y=R;y<=WL;y++){const t=y-R;for(let x=xa(t);x<=xb(t);x++)s(x,y,x===xa(t)||x===xb(t)?H[2]:t===0?Wo[0]:t===1?H[0]:y===WL?H[2]:t%2===0?H[3]:H[1])}
  if(big){const castle=(a,b,h)=>{for(let y=R-h;y<R;y++)for(let x=a;x<=b;x++)s(x,y,y===R-h?Wo[0]:x===b||(x-a)%3===0?H[2]:y===R-h+1?shade(o.col||'#a8483a',.8):H[1])};castle(3,8,3);castle(24,28,2)}
  else{s(14,12,H[1]);s(14,11,H[0]);s(1,12,H[2])}
  if(!big&&o.moored){// an oar shipped, slanting up over the gunwale to its blade at the bow; the net heaped in the stern
    for(let x=5;x<=10;x++)s(x,R-1-Math.floor((x-5)/3),Wo[1]);s(11,R-3,Wo[0]);s(12,R-3,Wo[0]);
    const Nt=[cvMix('#a89a78','#4a4a66',.15),cvMix('#7a6e58','#4a4a66',.25)];s(3,R-1,Nt[0]);s(4,R-1,Nt[1])}
  poutline(g);const hull=pcanvas(g);
  // the mast, its yard and the sail on it, striped (v: its stripes' width), billowing (shaded toward its foot and lee), a pennant
  let rig=null;
  if(big){const r=pgrid(n,n),q=(x,y,c)=>pset(r,x,y,c),Cl=o.col||'#a8483a',sw=v+2,
      Cv=[cvMix('#f4e8c8','#ffffff',.2),'#e4d8b8',cvMix('#c8bca0','#4a4a66',.2),cvMix(Cl,'#f4e8c8',.25),cvMix(Cl,'#2e2a40',.3)];
    for(let y=12;y<R;y++){q(15,y,Wo[1]);q(16,y,Wo[2])}for(let x=17;x<=19;x++)q(x,12+(x>18?1:0),Cl);
    for(let x=9;x<=22;x++)q(x,14,Wo[2]);
    // moored: the sail furled, bunched along the yard, a hint of its stripes in the folds
    if(o.moored)for(let y=15;y<=16;y++){for(let x=10+(y-15);x<=21-(y-15);x++){const st=Math.floor((x-10)/sw)%2;q(x,y,y===16?(st?Cv[4]:Cv[2]):st?Cv[3]:Cv[0])}}
    else for(let y=15;y<=23;y++){const e=y===23?1:0;for(let x=10+e;x<=21-e;x++){const st=Math.floor((x-10)/sw)%2,lee=x>19||y>21;q(x,y,st?(lee?Cv[4]:Cv[3]):(lee?Cv[2]:y<17?Cv[0]:Cv[1]))}}
    poutline(r);rig=pcanvas(r)}
  // the crew: a sailor at the helm on the stern castle and one at the rail amidships, the fisherman in his boat: head and
  // shoulders over the side (people.js mapPerson, to the first row of the body)
  const man=k=>mapPerson({...folkLook('folk','human',(o.seed|0)+k*7),robe:false,helm:k%2?'cap':'bare',helmC:'leather',weapon:null},0,3);
  // (ropes, a pixel thin, no outline: the stays from the masthead to bow and stern, behind the sail; the fisherman's oar)
  const c=mkc(n,n,x=>{const line=(x0,y0,x1,y1,col)=>{const k=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));x.fillStyle=col;for(let i=0;i<=k;i++)x.fillRect(Math.round(x0+(x1-x0)*i/k),Math.round(y0+(y1-y0)*i/k),1,1)};
    if(big){line(17,13,27,R-3,'#3e2e26');line(14,13,4,R-4,'#3e2e26');x.drawImage(rig,0,0);x.drawImage(man(0),6-8,R-3-15);x.drawImage(man(1),21-8,R-15)}else if(!o.moored)x.drawImage(man(0),7-8,R-15);
    x.drawImage(hull,0,0);if(!big&&!o.moored)line(5,R,2,WL,Wo[1])});
  c.cw=n;c.ch=n;c.ax=n>>1;c.ay=WL;c.stern=(n>>1)-(big?3:2);c.net=big?0:6;c.posts=big?[[4,R-3],[27,R-2]]:[[1,12],[14,11]];c.hull=WL-R;c.top=big?WL-(R-3):WL-11;return spr[key]=c;
}
// every ship in sight (Ship draw)
function drawShips(ents,cam,V){for(const s of W.ships)asShip(s).draw(ents,cam,V)}
