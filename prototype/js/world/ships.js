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
  // rocking on the water, a wake behind it while it sails; a fishing boat at its ground casts its net; a trade ship's label near
  // you. Under a bridge (decksOver): before whoever is on it, its deck put back over it (shipUnder), the label over all still
  draw(ents,cam,V){if(!this.inView(V))return;const s=this,now=performance.now(),D=decksOver(s,shipSprite(s));
    ents.push({y:D?Math.min(s.y+4,D.top-.5):s.y+4,f:()=>{subT(s);const b=shipSprite(s),sx=Math.round(s.x-cam.x),sy=Math.round(s.y+4-cam.y)+(Math.floor(now/450+s.seed)%2);
      const sailing=s.state!=='fish';
      const u=1/sceneRes(),q=v=>Math.round(v/u)*u;// (its wake and net a fine px fine: render.js sceneRes)
      if(sailing)for(let i=1;i<=5;i++){const ph=(now/300+i/5)%1;ctx.fillStyle=i<3?'#e8f4fa':'#bcd8e8';ctx.fillRect(q(sx-s.dir*(b.stern+i*1.4+ph*2)),sy-1+(i%3)*u,q(2.4-i*.3),u)}
      ctx.save();ctx.translate(sx,sy);if(s.dir<0)ctx.scale(-1,1);if(b.hi)ctx.drawImage(b.hi,-b.ax,-b.ay,b.width,b.height);else ctx.drawImage(b,-b.ax,-b.ay);ctx.restore();// (hi: its picture at the lab's scale, shipSprite)
      if(!sailing){const ph=(now/700+s.seed)%2,nx=sx+s.dir*b.net;ctx.fillStyle='#d8c890';ctx.fillRect(nx,sy-3,u,3);ctx.fillStyle='#c84a32';ctx.fillRect(nx-u,sy,3*u,u);if(ph<1){ctx.fillStyle='#e8f4fa';ctx.fillRect(nx-1-u,sy+1,u,u);ctx.fillRect(nx+1+u,sy+1,u,u);ctx.fillStyle='#bcd8e8';ctx.fillRect(nx-1,sy+1+u,2+u,u)}}
      if(D)shipUnder(D.list,shipBox(b,sx,sy),cam);
      if(DEV.on&&s.k==='trade'&&s.fromYou()<110)txt('Trade ship',sx,sy-b.ay+opaqueBox(b)[1]-2,hostileTo(s.fac)?'#ff9a90':'#e8d8a0','center')}})}
}
const asShip=asClass(Ship);
/* under a bridge (the owner's play-test, 2026-10-23: boats sailed over the decks). A ship whose waterline lies above a bridge's
   last row, its box meeting the bridge's picture (gfx/worldart.js WorldArt.deck), sorts before whoever is on the bridge and, once
   drawn, has the deck put back over it: the kept scene's own pixels (render.js memCv: the deck as the map shows it, with whatever
   lies on it) through the bridge's picture, within its box, on the scene's pixels (as gfx/depth.js puts back what stands in front
   of a figure). Its wake and net go under with it; a trade ship's label stays over it, as every label. Bridges, stone and wood,
   only: fords and ferries as ever. Only the bridges near a ship in sight are looked at */
let BRIDGES=null;onWorld(()=>{BRIDGES=null});
// (the bridges, each with the box of its tiles and one round them, map px: the ones that may meet a ship)
const bridgeBoxes=()=>BRIDGES||(BRIDGES=WM.crossings.filter(c=>c.kind==='bridge').map(c=>{const T=[c.i,c.j,...c.tiles],X=T.map(t=>t%MW),Y=T.map(t=>(t/MW)|0);
  return{c,x0:(Math.min(...X)-1)*TILE,y0:(Math.min(...Y)-1)*TILE,x1:(Math.max(...X)+2)*TILE,y1:(Math.max(...Y)+2)*TILE}}));
// (the box a ship draws in, with its wake and net, its waterline at (x, y): [x0, y0, x1, y1), as Ship draw lays them; b its sprite)
const shipBox=(b,x,y)=>[x-(b.cw>>1)-7,y-b.ay-1,x+(b.cw>>1)+7,y+3];
// the bridges a ship lies under: {list (their pictures), top (the highest one's first row)}, or null
function decksOver(s,b){const wl=s.y+4,[x0,y0,x1,y1]=shipBox(b,s.x,wl);let list=null,top=1e9;
  for(const q of bridgeBoxes()){if(q.x1<=x0||q.x0>=x1||q.y1<=y0||q.y0>=y1+1)continue;const d=WorldArt.deck(q.c);
    if(d.foot<=wl||d.x>=x1||d.x+d.cv.width<=x0||d.y>=y1+1||d.y+d.cv.height<=y0)continue;(list||(list=[])).push(d);top=Math.min(top,d.y)}
  return list&&{list,top}}
// (the decks put back over a ship just drawn, within its box B (the scene's pixels), its own shift to 1/VS px undone: render.js subT)
let UNDER_CV=null;
function shipUnder(L,B,cam){const mem=memCv(),r=mem.r||1;ctx.save();if(SUBD)ctx.translate(-SUBD[0],-SUBD[1]);
  for(const d of L){const X=d.x-cam.x,Y=d.y-cam.y,x0=Math.max(B[0],X,0),y0=Math.max(B[1],Y,0),x1=Math.min(B[2],X+d.cv.width,mem.width/r),y1=Math.min(B[3],Y+d.cv.height,mem.height/r),w=x1-x0,h=y1-y0;if(w<=0||h<=0)continue;
    if(!UNDER_CV||UNDER_CV.width<w||UNDER_CV.height<h)UNDER_CV=mkc(Math.max(w,64,UNDER_CV?UNDER_CV.width:0),Math.max(h,64,UNDER_CV?UNDER_CV.height:0),()=>{});const g=UNDER_CV.getContext('2d', { willReadFrequently: true });
    g.clearRect(0,0,w,h);g.drawImage(d.cv,x0-X,y0-Y,w,h,0,0,w,h);g.globalCompositeOperation='source-in';g.drawImage(mem,x0*r,y0*r,w*r,h*r,0,0,w,h);g.globalCompositeOperation='source-over';
    ctx.drawImage(UNDER_CV,0,0,w,h,x0,y0,w,h)}
  ctx.restore()}
const SHIP_SPD=26,BOAT_SPD=13,SHIP_CAP=density().ships;// (SHIP_CAP: trade ships at sea at once, today's; a world's own: density(WM), data/world.js)
// open water a boat can sail: not the frozen lakes of the frost (their ports fish through the ice). The sea round the edge
// of the world is the coastal route that joins the ports of different shores. Of the generated world's rivers (WM.river) only
// the navigable reaches, under their bridges and over their fords too (doc/WORLD_DESIGN.md §6.6.3): a river joins the sea or a
// lake for boats only where it is navigable
const isWater=(x,y)=>{if(x<0||y<0||x>=MW||y>=MH)return false;const i=y*MW+x,t=tiles[i],r=WM.river[i];return(t===T_WATER?!(r&3)||r&4:r&4&&(t===T_ROAD||t===T_FORD))&&climate[i]!==CLIM.frost};

// the bodies of water: every water tile labelled by the sea or lake it belongs to
let WATER_ID=null;
onWorld(()=>{WATER_ID=null});// (a new world: labelled afresh)
function waterIds(){
  if(WATER_ID)return WATER_ID;const id=new Int32Array(MW*MH).fill(-1);let n=0;
  for(let i=0;i<MW*MH;i++){if(tiles[i]!==T_WATER||id[i]>=0)continue;id[i]=n;const q=[i];
    while(q.length){const j=q.pop(),x=j%MW,y=(j/MW)|0;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(y+b)*MW+x+a;if(isWater(x+a,y+b)&&id[k]<0){id[k]=n;q.push(k)}}}n++}
  return WATER_ID=id;
}
// the sea: the bodies of water that reach the world's edge (waterIds'), a set of their labels, made with them
let SEA_IDS=null;
onWorld(()=>{SEA_IDS=null});
function seaIds(){const id=waterIds();if(SEA_IDS&&SEA_IDS.of===id)return SEA_IDS;const S=new Set();
  for(let x=0;x<MW;x++)for(const y of [0,MH-1])if(id[y*MW+x]>=0)S.add(id[y*MW+x]);for(let y=0;y<MH;y++)for(const x of [0,MW-1])if(id[y*MW+x]>=0)S.add(id[y*MW+x]);
  S.of=id;return SEA_IDS=S}
// a port's dock: the water tile just off the end of its pier (or the nearest water to it), on the water its pier runs out over
// (never a pond's that happens to lie as near: the owner's play-test, 2026-10-22)
function dockOf(t){
  if(!bldLv(t,'port'))return null;const pr=pierOf(t);if(!pr)return null;const len=10+bldLv(t,'port')*6+8,v={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]}[pr.dir];
  const cx=Math.floor((pr.x+v[0]*len)/TILE),cy=Math.floor((pr.y+v[1]*len)/TILE),px=Math.floor((pr.x+v[0]*8)/TILE),py=Math.floor((pr.y+v[1]*8)/TILE),id=waterIds(),own=isWater(px,py)?id[py*MW+px]:-1;
  for(let r=0;r<=3;r++)for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(Math.max(Math.abs(i),Math.abs(j))===r&&isWater(cx+i,cy+j)&&(own<0||id[(cy+j)*MW+cx+i]===own))return{tx:cx+i,ty:cy+j};
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
  const tod=Clock.frac;if(tod<.22||tod>.4)return;
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
  const cap=density(WM).ships;
  for(const t of TOWNS){if(W.ships.filter(s=>s.k==='trade').length>=cap)break;if(!bldLv(t,'port')||!t.bld||t.owner==='player'||besieged(t)||ruined(t))continue;
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
function updateShips(d){sendBoats();lodEach(W.ships,SHIP_MIND,d,Clock.frac);W.ships=W.ships.filter(s=>!s.gone)}

/* on the map, on the map's scale (a man 10 high, as the caravan's ox cart: caravans.js; doc/WORLD_DESIGN.md §10.1): a fishing boat
   is a rowing boat some 12 long, its fisherman in it, in a 16×16 cell; a trade ship is a cog some 26 long and 20 high, high
   sided, a castle at its stern and a smaller one at its bow, one mast with a square sail striped in its owner's colour (col), two
   of its crew at the rail, in a 32×32 cell. Facing right; its waterline is the cell's bottom row, its middle the ship's place.
   stern: how far behind the middle its stern is (the wake starts there); net: how far ahead the fisherman's line goes down.
   moored (a boat tied up at its port's pier: structures.js estateBoats): the rowing boat lies empty, its oar shipped and its
   net heaped in the stern; the cog's sail is furled on its yard. posts: where its mooring lines are made fast, [stern, bow];
   hull: its hull's height over the waterline, top: its castles' (or posts'). Painted at the lab's scale (hi: z fine px a game px, the
   battle's figures' density, drawn back to the cell's size: Ship draw, structures.js drawMoored); the cell's own picture taken down
   from it (for its box and the depth overdraw). Its look by its seed (v of 3): a cog's sail striped wide, plain with its owner's
   colour at its head and foot (its shields along its waist), or striped narrow with a fighting top on its mast; a rowing boat plain,
   a painted strake, or a stubby mast with its sail furled */
const SH_HULL=['#9a7e5e','#6e5642','#4c3c34','#30262a'],SH_BAND=['#a8483a','#4a6a9a','#c8a040'];
function shipSprite(o){
  const big=!!o.big,v=(o.seed|0)%3,key='sh'+(big?1:0)+(o.col||'')+v+(o.moored?'m':'')+(figsOn()?'f':'');if(spr[key])return spr[key];
  const n=big?32:16,WL=n-1,R=big?26:13,Wo=CV_WOOD,z=figsOn()?Math.max(1,Math.round(1/figK())):Math.round(1/WORLD_VIEW.build);
  // the crew: a sailor at the helm on the stern castle and one at the rail amidships, the fisherman in his boat: head and
  // shoulders over the side (people.js mapPerson, to the first row of the body); each [his head's middle, his last row, which]
  // (each sits or stands in it: his last row two under the gunwale (a castle's parapet), the side hiding his legs; the owner,
  // 2026-11-14: "the unit in boat is separated from the boat", he stood on its rim)
  const look=k=>({...folkLook('folk','human',(o.seed|0)+k*7),robe:false,helm:k%2?'cap':'bare',helmC:'leather',weapon:null}),crew=big?[[6,R-2,0],[21,R+1,1]]:o.moored?[]:[[7,R+2,0]];
  // (painted at z: the stays from the masthead to bow and stern, behind the sail, and the fisherman's oar, a fine px thin, no outline;
  // the rig (shipRig), each man put in by man(x, his middle, his last row, which), the hull over them (shipHullHi))
  const paint=man=>mkc(n*z,n*z,x=>{const line=(x0,y0,x1,y1,col)=>{const k=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));x.fillStyle=col;for(let i=0;i<=k;i++)x.fillRect(Math.round(x0+(x1-x0)*i/k),Math.round(y0+(y1-y0)*i/k),1,1)};
    if(big){line(16*z,13*z,27*z,(R-3)*z,'#3e2e26');line(15*z,13*z,4*z,(R-4)*z,'#3e2e26')}const rig=shipRig(o,z,R,line);if(rig)x.drawImage(rig,0,0);
    for(const [mx,row,k] of crew)man(x,mx,row,k);x.drawImage(shipHullHi(o,z,R,WL),0,0);if(!big&&!o.moored)line(5*z,R*z,2*z,WL*z,Wo[1])});
  // (MAP_FIGS: the crew the battle's figures (people.js figCrew) at their density; else the map's small figures, z times as large.
  // His last row on the one over the hull's outline, his shoulders showing over it, as the small figure's head and shoulders do)
  const hi=paint(figsOn()?(x,mx,row,k)=>{const m=figCrew(look(k));x.drawImage(m,mx*z-m.mx,row*z-m.height+1)}:(x,mx,row,k)=>{x.save();x.scale(z,z);x.drawImage(mapPerson(look(k),0,3),mx-8,row-14);x.restore()}),
    c=mkc(n,n,x=>x.drawImage(hi,0,0,n,n));c.hi=hi;
  c.cw=n;c.ch=n;c.ax=n>>1;c.ay=WL;c.stern=(n>>1)-(big?3:2);c.net=big?0:6;c.posts=big?[[4,R-3],[27,R-2]]:[[1,12],[14,11]];c.hull=WL-R;c.top=big?WL-(R-3):WL-11;return spr[key]=c;
}
/* (a ship's rig at z fine px a game px, or null: a cog's mast, lit on its left, its pennant in its owner's colour, its yard, and its
   square sail bellied by the wind, lit along its luff and shaded to its leech and foot, its cloths' seams, reef points, stripes of
   its owner's colour, its sheets down to the rail; moored, the sail furled along the yard in folds, its ties. A rowing boat's
   stubby mast with its sail furled (v 2). line: a fine px thin rope) */
function shipRig(o,z,R,line){const big=!!o.big,v=(o.seed|0)%3,n=big?32:16,Wo=CV_WOOD,Cl=o.col||'#a8483a';if(!big&&v!==2)return null;
  const Cv=[cvMix('#f4e8c8','#ffffff',.2),'#e4d8b8',cvMix('#c8bca0','#4a4a66',.2),cvMix(Cl,'#f4e8c8',.25),cvMix(Cl,'#2e2a40',.3),Cl];
  return mkc(n*z,n*z,x=>{const s=(px,py,c,w=1,h=1)=>{x.fillStyle=c;x.fillRect(px,py,w,h)};
    if(!big){const mx=10*z,top=(R-8)*z;s(mx,top,Wo[0],1,R*z-top);s(mx+1,top,Wo[2],1,R*z-top);s(mx-6,top+2,Wo[1],13,1);
      for(let i=-5;i<=5;i++){const h=2+((i+5)%3===0?0:1);s(mx+i,top+3,i<0?Cv[0]:Cv[1],1,h-1);s(mx+i,top+2+h,Cv[2])}return}
    // (the mast and its pennant; v 2: a fighting top on it)
    const mx=15*z,top=12*z;s(mx,top,Wo[0],1,R*z-top);s(mx+1,top,Wo[1],1,R*z-top);s(mx+2,top,Wo[2],1,R*z-top);
    for(let i=0;i<8;i++){const y=top-1+Math.round(Math.sin(i*.8)*.6)+(i>4?1:0),h=i<5?2:1;s(mx+3+i,y,PX.shade(Cl,1.1));if(h>1)s(mx+3+i,y+1,PX.shade(Cl,.75))}
    if(v===2){s(mx-3,top+3,Wo[1],9,3);s(mx-3,top+3,Wo[0],9,1);s(mx-3,top+6,Wo[3],9,1)}
    // (the yard, tapering to its arms)
    const ya=9*z,yb=22*z+1,yy=14*z;for(let px=ya;px<=yb;px++){const end=px<ya+3||px>yb-3;s(px,yy,end?Wo[1]:Wo[0]);if(!end)s(px,yy+1,Wo[2])}
    const sx0=10*z,sx1=22*z-1,sy0=15*z,sw=v===2?3:4,stripe=px=>v!==1&&Math.floor((px-sx0)/sw)%2===1;
    if(o.moored){// (furled: the sail bunched along the yard, its folds, a hint of its stripes, its ties)
      for(let px=sx0+1;px<sx1;px++){const hb=3+((px>>2)%2),fold=px%4===0,st=stripe(px)||v===1&&px%8<2;for(let k=0;k<hb;k++)s(px,sy0+k,k===0?(st?Cv[3]:Cv[0]):k===hb-1||fold?(st?Cv[4]:Cv[2]):st?Cl:Cv[1]);if(px%8===5)s(px,sy0,Wo[2],1,hb)}return}
    // (the sail: its foot bellied lower in its middle, its tones by where the light falls on it)
    const sy1=24*z-1,mid=(sx0+sx1)/2,hw=(sx1-sx0)/2;
    for(let px=sx0;px<=sx1;px++){const u=(px-sx0)/(sx1-sx0),foot=sy1-Math.round(2.5*((px-mid)/hw)**2),seam=(px-sx0)%4===3,st=stripe(px);
      for(let py=sy0;py<=foot;py++){const w=(py-sy0)/(foot-sy0),lee=u>.82||w>.82,lit=u<.16||(w>.2&&w<.5&&u<.6);let c;
        if(v===1&&(py<sy0+3||py>foot-3))c=py===sy0||py===foot?Cv[4]:lee?Cv[4]:Cv[3];
        else if(st)c=lee?Cv[4]:lit?Cv[3]:Cl;else c=lee?Cv[2]:lit?Cv[0]:Cv[1];
        if(seam&&!st&&py>sy0)c=PX.mix(c,Cv[2],.45);if(py===sy0+3&&px%4===1&&v!==1)c=Cv[2];if(py===foot)c=PX.mix(c,'#2e2a40',.25);s(px,py,c)}}
    // (its sheets, from its foot's corners down to the rail)
    line(sx0,sy1-2,6*z,(R-1)*z,'#3e2e26');line(sx1,sy1-2,25*z,(R-1)*z,'#3e2e26')})}
/* a hull painted at the battle's figures' density z (the owner, 2026-11-14: "the boat and old sprites may need to be updated"): its
   sheer curving up to bow and stern, its stem and stern post standing over it, a gunwale cap, a rubbing strake, clinker strakes
   with their seams, darker below the waterline's shadow; a cog's castles crenellated, a band of its owner's colour; moored, the
   oar shipped and the net heaped (in map px, as before). By its look (shipSprite): a rowing boat's strake painted (SH_BAND), a
   cog's shields hung along its waist, its owner's colour and white by turns */
function shipHullHi(o,z,R,WL){
  const big=!!o.big,n=big?32:16,H=SH_HULL,Wo=CV_WOOD,N=n*z,g=pgrid(N,N),s=(x,y,c)=>pset(g,x,y,c),x0=(big?3:1)*z,x1=(big?29:15)*z-1,mid=(x0+x1)/2,half=(x1-x0)/2;
  const top=x=>{const u=(x-mid)/half;return R*z-z*(big?1.2:1.4)*u*u*(u>0?1.35:1)},bot=x=>{const u=Math.abs((x-mid)/half);return (WL+1)*z-1-z*(big?4.5:2.6)*Math.pow(u,big?3:4)};
  for(let x=x0;x<=x1;x++){const t0=Math.round(top(x)),b0=Math.round(bot(x));if(b0<t0)continue;const end=x<=x0+z-1||x>=x1-z+1;
    for(let y=t0;y<=b0;y++){const d=y-t0,fromB=b0-y;let c;
      if(d===0)c=Wo[0];else if(d<=Math.max(1,z>>1))c=H[0];else if(d<=z+1)c=d===z+1?H[2]:Wo[1];
      else if(fromB<z)c=H[3];else c=((y-t0-z-2)%(z+1)===z)?H[2]:H[1];
      if(end&&d>0)c=H[2];s(x,y,c)}}
  // (the stem at the bow and the stern post, rising over the sheer)
  const post=(x,h,lean)=>{const t0=Math.round(top(x));for(let k=0;k<h;k++){s(Math.round(x+lean*k),t0-k,k===h-1?Wo[0]:H[2]);s(Math.round(x+lean*k)-1,t0-k,H[1])}};
  post(x1-1,Math.round(z*(big?2:1.6)),.4);post(x0+1,Math.round(z*(big?1.4:1.1)),-.3);
  if(big){const castle=(a,b,h)=>{const ya=(R-h)*z,yb=R*z;for(let y=ya;y<yb;y++)for(let x=a*z;x<(b+1)*z;x++){const top0=y<ya+z,cren=top0&&Math.floor((x-a*z)/z)%2===1&&y<ya+(z>>1);if(cren)continue;
      s(x,y,top0?Wo[0]:y<ya+2*z?shade(o.col||'#a8483a',.8):(x-a*z)%(3*z)===0?H[2]:H[1])}};castle(3,8,3);castle(24,28,2)}
  // (a rowlock on the small boat's gunwale)
  else s(Math.round(mid+z),Math.round(top(mid+z))-1,H[2]);
  const v=(o.seed|0)%3;
  if(!big&&v===1){const B=SH_BAND[((o.seed|0)/3|0)%3];for(let x=x0+z;x<=x1-z;x++){const t0=Math.round(top(x));for(let d=z+2;d<=z+3;d++)s(x,t0+d,d===z+2?PX.shade(B,x<mid?1.1:1):PX.shade(B,x<mid?.85:.72))}}
  if(big&&v===1){const C=o.col||'#a8483a',P=['.xx.','xxxx','xxxx','.xx.'];for(let k=0,cx=11*z;cx<=22*z;cx+=3*z,k++){const fc=k%2?'#e8e0c8':C,t0=Math.round(top(cx))+z;
    P.forEach((r,j)=>[...r].forEach((q,i)=>{if(q==='.')return;s(cx-2+i,t0+j,i===1&&j===1?'#d8d8e0':i+j<=1?PX.shade(fc,1.15):i+j>=5?PX.shade(fc,.7):fc)}))}}
  if(!big&&o.moored){for(let x=5*z;x<=10*z;x++)s(x,Math.round((R-1)*z-((x-5*z)/(3*z))*z),Wo[1]);for(let x=11*z;x<13*z;x++)s(x,(R-3)*z,Wo[0]);
    const Nt=[cvMix('#a89a78','#4a4a66',.15),cvMix('#7a6e58','#4a4a66',.25)];for(let x=3*z;x<5*z;x++)for(let y=(R-1)*z;y<R*z;y++)s(x,y,Nt[(x+y)%2])}
  g.edge=true;poutline(g);return pcanvas(g)}
// every ship in sight (Ship draw)
function drawShips(ents,cam,V){for(const s of W.ships)asShip(s).draw(ents,cam,V)}
// its work in the world's day and frame (core/systems.js)
Systems.add({name:'ships',order:{day:140,frame:90},day:shipDay,frame:updateShips});
