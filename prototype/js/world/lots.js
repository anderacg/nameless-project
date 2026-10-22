'use strict';
/* ---------- placed structures: every holding is a set of buildings, each standing on its own tiles of the grid ---------- */
// t.lots: [{id, k, type, x, y, n, lv, seed, st, plots}]
//   k: what it is for: 'centre' (keep, citadel or hall: its walls are its fortification, wallOf), 'house', an estate key (farm...)
//   (x, y): its top-left tile; it covers n x n tiles (1, 2 or 4); st: 'built' | 'building' | 'ruined'; plots: the field tiles it keeps (farms...)
// OCC holds for every tile the id of the lot standing on it, or keeping it as a field; 0 when free. Two lots never share a tile.
// A holding is laid out from its centre: houses round it (enough for its people), the buildings of its estates, then its
// fields, herds, mines and docks outside (clear of the town). Its walls are the centre's own: Fortify upgrades it. Every layout is the
// holding's own: the seed varies house kinds, places and orientation.
let OCC=null,lotN=1;const LOT={};
// a world goes in (useWorld): its grid as the world first stood (worldKeep: the holdings' lots are back by then), or empty
onWorld(m=>{const F=m.first;OCC=F?F.occ.slice():new Int32Array(MW*MH);for(const k in LOT)delete LOT[k];lotN=F?F.lotN:1;if(F)for(const t of TOWNS)for(const l of t.lots||[])LOT[l.id]=l});
const occAt=(x,y)=>x<0||y<0||x>=MW||y>=MH?-1:OCC[y*MW+x];
const lotTiles=(l,f)=>{for(let j=0;j<l.n;j++)for(let i=0;i<l.n;i++)f(l.x+i,l.y+j)};
function occMark(l,v){lotTiles(l,(x,y)=>{OCC[y*MW+x]=v});(l.plots||[]).forEach(([x,y])=>{OCC[y*MW+x]=v})}
const lotAdd=(t,l)=>Layout.of(t).add(l);// (the old names: Layout add, drop, below)
const lotDrop=(t,l)=>Layout.of(t).drop(l);
// rebuild the grid from every holding's lots (after a load)
// the tiles no building may take: the bandits' camps
// a bandit camp's 2 x 2 tiles (its own, the one right of it and the two behind) and a tile round them
function occReserve(){for(const c of CAMP_SPOTS)for(let j=-2;j<=1;j++)for(let i=-1;i<=2;i++)if(!OCC[(c.ty+j)*MW+c.tx+i])OCC[(c.ty+j)*MW+c.tx+i]=-2}
// bandits keep their distance from the estates: no estate's building or field within BANDIT_GAP tiles of a bandit camp or hideout
// (estates avoid the camps and hideouts there are; hideouts are placed after the estates and avoid them, sites.js)
const BANDIT_GAP=8;
const banditSpots=()=>[...CAMP_SPOTS,...W.sites.filter(s=>s instanceof Hideout)];
const nearBandits=(x,y,r)=>banditSpots().some(s=>Math.hypot(s.tx-x,s.ty-y)<r);
// is any estate's building or field within r tiles of (tx, ty)
function estateNear(tx,ty,r){for(let y=ty-r;y<=ty+r;y++)for(let x=tx-r;x<=tx+r;x++){const id=occAt(x,y),l=id>0&&LOT[id];if(l&&ESTATES[l.k]&&Math.hypot(x-tx,y-ty)<r)return true}return false}
// a new world: nothing stands anywhere yet
function lotsReset(){roadsToGates();OCC.fill(0);for(const k in LOT)delete LOT[k];TOWNS.forEach(t=>{t.lots=null});occReserve()}
// nothing stands on a road: the roads were carved to each holding's own tile, where its centre now stands, so once a map (it is
// the same every game) the road under each centre is taken up, and every road that ran into it is led round its walls to its
// gate, the tile in front of it, by the shortest way that keeps off every centre, water, mountain and ore vein. Other buildings, fields,
// camps and sites are placed off the roads.
const centreBox=t=>{const n=lotSize(typeFor(t,'centre',Math.random));return{x:t.tx-(n>>1),y:t.ty-n+1,n}};
function roadsToGates(){
  if(WM.gated)return;WM.gated=true;const boxes=TOWNS.map(centreBox),inBox=(x,y)=>boxes.some(b=>x>=b.x&&x<b.x+b.n&&y>=b.y&&y<b.y+b.n);
  TOWNS.forEach((t,ti)=>{const b=boxes[ti],gx=t.tx,gy=b.y+b.n,ends=[];
    for(let y=b.y;y<b.y+b.n;y++)for(let x=b.x;x<b.x+b.n;x++)if(tiles[y*MW+x]===T_ROAD)tiles[y*MW+x]=T_OPEN;
    for(let y=b.y-1;y<=b.y+b.n;y++)for(let x=b.x-1;x<=b.x+b.n;x++){const edge=(x===b.x-1||x===b.x+b.n)!==(y===b.y-1||y===b.y+b.n);if(edge&&tiles[y*MW+x]===T_ROAD&&!(x===gx&&y===gy))ends.push([x,y])}
    if(passable(tiles[gy*MW+gx]))tiles[gy*MW+gx]=T_ROAD;
    for(const [ex,ey] of ends){const prev=new Int32Array(MW*MH).fill(-1),s=ey*MW+ex,e=gy*MW+gx,q=[s];prev[s]=s;let h=0;
      while(h<q.length){const j=q[h++];if(j===e)break;const x=j%MW,y=(j/MW)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=ny*MW+nx;if(nx<1||ny<1||nx>=MW-1||ny>=MH-1||prev[k]>=0||inBox(nx,ny)||!passable(tiles[k])||DEP_AT[k]>=0)continue;prev[k]=j;q.push(k)}}
      if(prev[e]>=0)for(let j=e;j!==s;j=prev[j])tiles[j]=T_ROAD}
  });
}
function occRebuild(){roadsToGates();OCC.fill(0);for(const k in LOT)delete LOT[k];for(const t of TOWNS)if(t.lots){t.lots=t.lots.filter(l=>l.k!=='wall');const c=t.lots.find(l=>l.k==='centre');if(!c||t.tx<c.x||t.tx>=c.x+c.n||t.ty<c.y||t.ty>=c.y+c.n||c.type!==typeFor(t,'centre',Math.random))t.lots=null}// (older layouts are laid out again)
  for(const t of TOWNS)for(const l of t.lots||[]){if(l.st==='ruin')l.st='ruined';// (older saves)
    LOT[l.id]=l;l.town=t.name;occMark(l,l.id);lotN=Math.max(lotN,l.id+1)}occReserve()}
const lotOf=(x,y)=>{const id=occAt(x,y);return id>0?LOT[id]:null};
/* the roads as painted (the owner's play-test 2: "some buildings still on the road"): the tiles within LOT_ROAD px of a road's
   middle as the art draws it, a byte a tile. On the generated world a road follows its smoothed line, not its tiles (worldart.js
   artGenPlan: the points its bands are kept clear round); on today's map its tiles, led half a tile aside at a gate (roadStamps).
   No lot or field stands on one. Made when first asked (the roads led to the gates by then), again for a new world */
const LOT_ROAD=2;
let ROAD_PAINT=null;onWorld(()=>{ROAD_PAINT=null});
function roadPaint(){
  if(ROAD_PAINT)return ROAD_PAINT;const B=ROAD_PAINT=new Uint8Array(MW*MH),r=LOT_ROAD;
  // (a point of the road's middle: the middle of a square the art keeps clear round it)
  const at=(x,y,w,h)=>{const cx=x+(w>>1),cy=y+(h>>1);for(let ty=Math.max(0,Math.floor((cy-r)/TILE));ty<=Math.min(MH-1,Math.floor((cy+r)/TILE));ty++)for(let tx=Math.max(0,Math.floor((cx-r)/TILE));tx<=Math.min(MW-1,Math.floor((cx+r)/TILE));tx++)B[ty*MW+tx]=1};
  if(WM.gen!=='classic-0'&&typeof artRoadMarks==='function')artRoadMarks(at);
  else if(typeof roadStamps==='function'){const P={towns:new Set(TOWNS.map(t=>t.ty*MW+t.tx)),shift:new Set(TOWNS.flatMap(t=>[t.ty*MW+t.tx,(t.ty+1)*MW+t.tx]))};
    for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++)roadStamps(P,tx,ty,0,(x,y,w)=>at(x,y,w,w))}
  for(let i=0;i<MW*MH;i++)if(tiles[i]===T_ROAD)B[i]=1;
  return B}

/* what stands for each part of a holding, by its people */
const HOUSES={human:['cottage','cottage','townhouse'],dwarf:['cottage','townhouse','cottage'],elf:['cottage','treehouse','cottage'],orc:['yurt','yurt','cottage']};
const ESTATE_LOT={farm:'cottage',pasture:'barn',lumber:'lumbershed',mine:'minehead',quarry:'crane',port:'fisherhut',workshop:'warehouse',smithy:'smithy',brewery:'tavern',granary:'granary',market:'stall'};
// how many people each kind of dwelling houses
const HOUSING={cottage:10,townhouse:16,yurt:8,treehouse:22,longhouse:30,stonehall:30,elfhall:30,hidehall:30,village:30,keep:40,citadel:60};
// the estates whose buildings stand inside a holding (and its walls); the rest work the land outside
const INNER=['workshop','smithy','brewery','granary','market'];
const lotSizes={};
const lotSize=type=>lotSizes[type]||(lotSizes[type]=PX.building({type,style:'human',seed:1}).tiles[0]);
// who built it: mostly the holding's first people, now and then its second
const lotPeople=(t,l)=>t.races.length>1&&l.seed%4===0?t.races[1]:t.races[0];
const typeFor=(t,k,R)=>{const r=t.races[0];if(k==='centre'){const c=t.T.centre;return c[r]||c._}// (a village's: its people's hall on a green, with the well, 2 x 2)
  if(k==='house'){const h=HOUSES[r]||HOUSES.human;return h[Math.floor(R()*h.length)]}if(k==='smithy'&&r==='dwarf')return'forge';return ESTATE_LOT[k]};

/* where a lot may stand */
// the ground each kind needs under it: open ground (or hills) for most; forest for the woodcutter; rock for mines and quarries;
// the shore for a port. Never water, mountains or roads, never on another lot, never beyond its holding's land.
const lotGround={
  open:(x,y)=>{const g=tAt(x,y);return g===T_OPEN||g===T_HILL},
  forest:(x,y)=>{const g=tAt(x,y);return g===T_FOREST||g===T_OPEN},
  rock:(x,y)=>{const g=tAt(x,y);return g===T_HILL||g===T_OPEN},
  shore:(x,y)=>tAt(x,y)===T_OPEN||tAt(x,y)===T_FOREST
};
const nearT=(x,y,type,r)=>{for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(tAt(x+i,y+j)===type)return true;return false};
const groundOf=k=>k==='lumber'?'forest':k==='mine'||k==='quarry'?'rock':k==='port'?'shore':'open';
/* where a holding's people walk (the owner's play-test 3: "estates spawn on the opposite side of the holdings, separated by a
   river; workers cannot cross"): the ground walked to from its gate within LOT_WALK tiles (worldplace.js placeWalk: 4 ways over
   walkable ground, fords and bridges, and ferries), and of it its own bank (no crossing taken). Every lot and field of it stands on
   ground walked to (lotWalks: lotSpot, placeOk; fieldsFor), a building's door not far round (its steps from the gate at most
   PLACE_HOLD.round[0] times the straight way's, 4 ways, and round[1], and twice the straight line's and 2: the owner's, the
   workers' walk never much longer for a river), never on a crossing's end nor beside it (the way onto it: xEnds), its own bank first (lotSpot: across a crossing a spot counts LOT_BANK tiles
   farther). Kept by holding (and the crossings' ends), made afresh for a new world */
const LOT_WALK=28,LOT_BANK=4;
let WALKS=new WeakMap(),XENDS=null;onWorld(()=>{WALKS=new WeakMap();XENDS=null});
const xEnds=()=>{if(XENDS)return XENDS;XENDS=new Set();for(const c of WM.crossings)for(const i of [c.i,c.j,...c.tiles]){const x=i%MW,y=(i-x)/MW;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)XENDS.add((y+b)*MW+x+a)}return XENDS};
function lotWalk(t){
  let w=WALKS.get(t);if(w)return w;const g=(t.ty+1)*MW+t.tx,s=passable(tiles[g])?g:t.ty*MW+t.tx;
  WALKS.set(t,w={all:placeWalk(WM,s,LOT_WALK),own:placeWalk(WM,s,LOT_WALK,true)});return w}
const walkTo=(t,x,y)=>placeWalkAt(lotWalk(t).all,x,y)&&!xEnds().has(y*MW+x);
const ownBank=(t,x,y)=>placeWalkAt(lotWalk(t).own,x,y);
function lotWalks(t,x,y,n,far){
  for(let j=0;j<n;j++)for(let i=0;i<n;i++)if(!walkTo(t,x+i,y+j))return false;if(far)return true;
  const w=lotWalk(t).all,dx=x+(n>>1)-w.x0-LOT_WALK,dy=y+n-1-w.y0-LOT_WALK;
  const d=placeWalkSteps(w,x+(n>>1),y+n-1);return d<=PLACE_HOLD.round[0]*(Math.abs(dx)+Math.abs(dy))+PLACE_HOLD.round[1]&&d<=2*Math.hypot(dx,dy)+2}
// may an n x n lot stand at (x, y) for holding t? gap: keep a free tile between it and other buildings
function lotFits(t,x,y,n,rule,gap){
  const ti=TOWNS.indexOf(t),okg=lotGround[rule]||lotGround.open,RB=roadPaint();
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const X=x+i,Y=y+j;if(X<1||Y<1||X>=MW-1||Y>=MH-1||OCC[Y*MW+X]||RB[Y*MW+X]||!okg(X,Y))return false;
    const L=LAND[Y*MW+X];if(L>=0&&L!==ti)return false}
  // a free tile between it and any bigger building or place of work (houses may stand side by side in rows)
  if(gap)for(let j=-1;j<=n;j++)for(let i=-1;i<=n;i++){if(i>=0&&i<n&&j>=0&&j<n)continue;const id=occAt(x+i,y+j),o=id>0&&LOT[id];if(o&&!(gap==='row'&&o.k==='house'&&n===1&&o.n===1)&&!(o.plots||[]).some(p=>p[0]===x+i&&p[1]===y+j))return false}
  // what each place of work needs nearby: woods, rock, water
  if(rule==='forest'){let f=0;for(let j=-1;j<=n;j++)for(let i=-1;i<=n;i++)if(tAt(x+i,y+j)===T_FOREST)f++;if(f<2)return false}
  if(rule==='rock'){let ok=false;for(let j=0;j<n&&!ok;j++)for(let i=0;i<n&&!ok;i++)ok=tAt(x+i,y+j)===T_HILL||nearT(x+i,y+j,T_MOUNT,1);if(!ok)return false}
  if(rule==='shore'){let ok=false;for(let j=0;j<n&&!ok;j++)for(let i=0;i<n&&!ok;i++)ok=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>tAt(x+i+a,y+j+b)===T_WATER);if(!ok)return false}
  return true;
}
// the best free place for an n x n lot between rmin and rmax tiles of the holding's centre: near, by a little chance, and
// (if box is given) outside it (outer works keep clear of the walls) or inside it
function lotSpot(t,n,rule,rmin,rmax,R,o){
  o=o||{};let best=null,bs=1e9;const cx=t.tx,cy=t.ty-1;
  for(let y=cy-rmax;y<=cy+rmax;y++)for(let x=cx-rmax;x<=cx+rmax;x++){const mx=x+n/2-.5,my=y+n/2-.5,d=Math.hypot(mx-cx,my-cy);if(d<rmin||d>rmax)continue;
    if(o.outside&&x+n>o.outside.x0&&x<=o.outside.x1&&y+n>o.outside.y0&&y<=o.outside.y1)continue;
    if(!lotFits(t,x,y,n,rule,o.gap===undefined?true:o.gap))continue;
    if(o.estate&&nearBandits(x+n/2-.5,y+n/2-.5,BANDIT_GAP+n/2+(o.fields?3:0)))continue;// (its fields reach 3 tiles out)
    // (its chance drawn before the walk is asked of it: a layout with every spot walked to stays as it was)
    let s=d+R()*(o.jit||1.6);if(!lotWalks(t,x,y,n,o.far))continue;if(!ownBank(t,x+(n>>1),y+(n>>1)))s+=LOT_BANK;
    // o.fields: an estate that works fields: only where its first level's fields fit, and the more room the better
    if(o.fields){const m=fieldsFor(t,{x,y,n},o.fields).length;if(m<PLOTS_AT[o.fields](1))continue;s+=(PLOTS[o.fields]-m)*1.2}
    if(s<bs){bs=s;best=[x,y]}}
  return best;
}
const lotAt=(t,k)=>Layout.of(t).at(k);
const lotCentre=t=>Layout.of(t).centre();
// the tile middle of a lot, in pixels (where its workers go, where it is clicked)
const lotMid=l=>({tx:l.x+(l.n>>1),ty:l.y+l.n-1,x:(l.x+l.n/2)*TILE,y:(l.y+l.n)*TILE-6});
const housing=t=>Layout.of(t).housing();

/* a holding's layout (t.layout): its lots, where each stands on the grid, and what they house. A part of the holding, kept aside
   (never saved), over its plain t.lots, which its save record keeps as they are. (A lot stays a plain record: its tiles and its
   middle are small helpers, lotTiles and lotMid, used on any box; the grid's own searches, lotFits, lotSpot and fieldsFor, stay
   functions of the grid) */
const LAYOUTS=new WeakMap();
class Layout{
  constructor(t){this.t=t}
  // a holding's layout (made once and kept aside)
  static of(t){
    let y=LAYOUTS.get(t);
    if(!y)LAYOUTS.set(t,y=new Layout(t));
    return y}
  // its lots (none yet: an empty list)
  get list(){return this.t.lots||[]}
  // a lot placed, on the grid and in its list (a new one numbered); and taken away
  add(l){
    const t=this.t;
    t._can=null;t._spots=null;l.id=l.id||lotN++;lotN=Math.max(lotN,l.id+1);(t.lots=t.lots||[]).push(l);LOT[l.id]=l;l.town=t.name;occMark(l,l.id);
    return l}
  drop(l){
    const t=this.t;
    t._can=null;t._spots=null;occMark(l,0);t.lots=t.lots.filter(o=>o!==l);delete LOT[l.id]}
  // the lot of a part (an estate's key, 'centre')
  at(k){return this.list.find(l=>l.k===k)}
  centre(){return this.at('centre')}
  // the people its built houses and centre give room for; full: its people fill them (it grows no more and sends people away)
  housing(){return this.list.reduce((a,l)=>a+(l.st==='built'?HOUSING[l.type]&&(l.k==='house'||l.k==='centre')?HOUSING[l.type]:0:0),0)}
  full(){
    const t=this.t;
    return !!t.lots&&(t.pop||0)>=this.housing()}
  // k -> {tx, ty, x, y}: where each estate's building stands (its front middle tile); only estates that have a building (kept: t._spots)
  spots(){
    const t=this.t;
    if(t._spots)return t._spots;const sp={};
    for(const l of t.lots||[])if(ESTATES[l.k]){const m=lotMid(l);sp[l.k]={tx:m.tx,ty:m.ty,x:m.x,y:m.y}}
    return t._spots=sp}

  /* laying it out */
  init(){
    const t=this.t;
    if(t.lots)t.lots.slice().forEach(l=>this.drop(l));t.lots=[];landFresh();occReserve();
    const R=seeded(t.seed*977+13),n0=lotSize(typeFor(t,'centre',R)),cx=t.tx-(n0>>1),cy=t.ty-n0+1;
    // the centre stands on the holding's own tile, its gate on its front row where the roads end: parties arrive there and set out
    this.add({k:'centre',type:typeFor(t,'centre',R),x:cx,y:cy,n:n0,lv:1,seed:t.seed*31+7,st:'built'});
    // a port town's harbour before its houses on the generated world (they would take the shore its people walk to: a League port's
    // docks on its own sea; today's map keeps its order, its harbours on the sea)
    if(WM.gen!=='classic-0'&&t.style==='port'&&bldLv(t,'port')&&!this.estateLot('port'))t.bld.port=0;
    // houses round it: enough for its people (the centre houses some), a few to spare; then, one still short of room for them clears
    // plots in the woods (a village deep in them, its clearing crossed by its roads)
    const pop=t.pop||t.T.pop0;let room=this.housing(),tries=0;
    for(const [g,want] of [['open',pop*1.1],['forest',pop]])for(tries=0;room<want&&tries++<t.T.tries;){const type=typeFor(t,'house',R),n=lotSize(type),p=lotSpot(t,n,g,1,t.T.ring,R,{gap:'row',jit:.8});if(!p)continue;this.add({k:'house',type,x:p[0],y:p[1],n,lv:1,seed:Math.floor(R()*1e6),st:'built'});room=this.housing()}
    // the buildings of its inner estates
    for(const k of INNER)if(bldLv(t,k)&&!this.estateLot(k,R))t.bld[k]=0;// no room: the holding has no such estate
    // then the works outside
    for(const k of Object.keys(ESTATES))if(!INNER.includes(k)&&bldLv(t,k)&&!this.estateLot(k,R))t.bld[k]=0;
    t._spots=null}
  // the box round its inner lots: the town, which fields and outer works keep clear of
  innerBox(){
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for(const l of this.list)if(l.k==='centre'||l.k==='house'||INNER.includes(l.k)){x0=Math.min(x0,l.x);y0=Math.min(y0,l.y);x1=Math.max(x1,l.x+l.n-1);y1=Math.max(y1,l.y+l.n-1)}
    return x1<x0?null:{x0,y0,x1,y1}}
  // the town and a lane round it: fields and outer works keep clear of it
  wallBox(){
    const b=this.innerBox();
    return b&&{x0:b.x0-2,y0:b.y0-2,x1:b.x1+2,y1:b.y1+2}}
  // place an estate's building (and keep its fields): inner ones near the centre, outer ones on their ground beyond the walls;
  // at: the tile chosen for it (when you place it yourself); st: 'built' or 'building'
  estateLot(k,R,at,st){
    const t=this.t;
    R=R||seeded(t.seed*131+k.length);if(this.at(k))return this.at(k);const type=typeFor(t,k,R),n=lotSize(type),inner=INNER.includes(k),wb=this.wallBox();
    // (an estate with fields stands only where they have room, lotSpot o.fields)
    // (an outer one not far round; on today's map, where none is, one its people still walk to (no estate lost there: its layout
    // and what a new game draws as they were); the generated world's water is bridged by its holdings instead)
    const ow=o=>lotSpot(t,n,groundOf(k),3,k==='port'&&t.style==='port'?20:12,R,{estate:true,outside:wb&&{x0:wb.x0-1,y0:wb.y0-1,x1:wb.x1+1,y1:wb.y1+1},fields:PLOTS[k]?k:null,far:o});
    const p=at?at:inner?(lotSpot(t,n,'open',1,6,R,{estate:true})||lotSpot(t,n,'open',1,9,R,{estate:true})):ow(false)||WM.gen==='classic-0'&&ow(true);
    if(!p)return null;const l=this.add({k,type,x:p[0],y:p[1],n,lv:bldLv(t,k)||1,seed:Math.floor(R()*1e6),st:st||'built'});
    if(PLOTS[k]){l.plots=fieldsFor(t,l,k);occMark(l,l.id)}
    t._spots=null;return l}
  // keep the lots in step with what the holding has: build what it has gained, ruin what war has cost it (its centre's
  // fortification is its walls, wallOf, drawn as they stand: structures.js lotSprite)
  sync(){
    const t=this.t;
    if(!t.lots){this.init();return}
    for(const k of Object.keys(ESTATES)){const lv=bldLv(t,k),l=this.at(k),w=t.work&&t.work.k===k;if(lv&&!l&&!this.estateLot(k))t.bld[k]=0;else if(l){l.lv=Math.max(1,lv);const st=lv?'built':w?'building':'ruined';if(l.st!==st){l.st=st;l._s=null}}}
    t._spots=null}
}
// the field tiles a farm, pasture or quarry may grow over (all it will ever need, kept now): one connected patch beside it
function fieldsFor(t,l,k){
  const g=k==='quarry'?(x,y)=>tAt(x,y)===T_HILL||tAt(x,y)===T_OPEN:(x,y)=>tAt(x,y)===T_OPEN,out=[],cand=[],ti=TOWNS.indexOf(t);
  const wb=wallBox(t),inRing=(x,y)=>wb&&x>=wb.x0-1&&x<=wb.x1+1&&y>=wb.y0-1&&y<=wb.y1+1,RB=roadPaint();// fields stay clear of the town, and off the roads
  for(let y=l.y-3;y<=l.y+l.n+2;y++)for(let x=l.x-3;x<=l.x+l.n+2;x++){if(x>=l.x&&x<l.x+l.n&&y>=l.y&&y<l.y+l.n||OCC[y*MW+x]||RB[y*MW+x]||!g(x,y)||x<1||y<1||x>=MW-1||y>=MH-1||inRing(x,y)||!walkTo(t,x,y))continue;const L=LAND[y*MW+x];if(L>=0&&L!==ti)continue;
    const d=Math.hypot(x-(l.x+l.n/2-.5),y-(l.y+l.n/2-.5));cand.push([x,y,d+hash(x,y,t.seed)*.6])}
  cand.sort((a,c)=>a[2]-c[2]);const touch=[];lotTiles(l,(x,y)=>touch.push([x,y]));
  while(out.length<PLOTS[k]){const c=cand.find(c=>!out.includes(c)&&touch.some(q=>Math.abs(q[0]-c[0])+Math.abs(q[1]-c[1])===1));if(!c)break;out.push(c);touch.push(c)}
  return out.map(c=>[c[0],c[1]]);
}
// (the older names: the layout's methods)
const initLots=t=>Layout.of(t).init();
const innerBox=t=>Layout.of(t).innerBox();
const wallBox=t=>Layout.of(t).wallBox();
const estateLot=(t,k,R,at,st)=>Layout.of(t).estateLot(k,R,at,st);
const syncLots=t=>Layout.of(t).sync();

/* building takes time (buildings.js Buildings: speed, days, progress, start, houseDone) */
const buildSpeed=t=>Buildings.of(t).speed();
const workDays=(t,lv)=>Buildings.of(t).days(lv);
const workProg=t=>Buildings.of(t).progress();
const startWork=(t,k,lv,at)=>Buildings.of(t).start(k,lv,at);
const houseDone=(t,w)=>Buildings.of(t).houseDone(w);

/* houses: what a new one costs */
const HOUSE_COST={gold:40,mats:{timber:6,tools:1}};
const HOUSE_DAYS=1;
// a holding's people may grow to the room its houses give (and its centre): a full holding grows no more and sends people away
const housingFull=t=>Layout.of(t).full();

/* placing a building by hand: a ghost follows the pointer, snapped to the grid, green where it may stand, red where not */
function placeRule(k){return k==='house'||INNER.includes(k)?{g:'open',inner:true,gap:k==='house'?'row':true}:{g:groundOf(k),inner:false,gap:true}}
function placeOk(t,k,x,y,n){
  const r=placeRule(k),ti=TOWNS.indexOf(t);for(let j=0;j<n;j++)for(let i=0;i<n;i++)if(LAND[(y+j)*MW+x+i]!==ti)return false;
  if(!lotFits(t,x,y,n,r.g,r.gap)||!lotWalks(t,x,y,n))return false;if(PLOTS[k]&&fieldsFor(t,{x,y,n},k).length<PLOTS_AT[k](1))return false;// room for its fields
  if(ESTATES[k]&&nearBandits(x+n/2-.5,y+n/2-.5,BANDIT_GAP+n/2+(PLOTS[k]?3:0)))return false;// too near a bandit camp or hideout
  const d=Math.hypot(x+n/2-(t.tx+.5),y+n/2-t.ty);if(d>(r.inner?10:k==='port'&&t.style==='port'?20:13))return false;
  if(!r.inner){const wb=wallBox(t);if(wb&&x+n>wb.x0-1&&x<=wb.x1+1&&y+n>wb.y0-1&&y<=wb.y1+1)return false}return true;
}
// the lot's top-left tile for a pointer at world pixel (wx, wy): the pointer at its middle
const placeAt=(wx,wy,n)=>({x:Math.floor(wx/TILE-n/2+.5),y:Math.floor(wy/TILE-n/2+.5)});
function startPlace(t,k){
  const R=seeded(G.day*7+t.seed+k.length),type=k==='house'?typeFor(t,'house',R):typeFor(t,k,R);
  G.place={town:t.name,k,type,n:lotSize(type),seed:Math.floor(R()*1e6)};G.town=null;G.scene=null;hidePanel();G.mode='world';G.modal=false;
  log('Choose where the '+(k==='house'?'new house':ESTATES[k].n.toLowerCase())+' of '+t.name+' will stand: click a green spot (Esc to stop).');
}
function placeClick(wx,wy){
  const pl=G.place,t=pl&&townBy(pl.town);if(!t){G.place=null;return}const {x,y}=placeAt(wx,wy,pl.n);
  if(!placeOk(t,pl.k,x,y,pl.n)){log('It cannot stand there.','bad');return}
  if(pl.k==='house')buildHouse(t,[x,y]);else buildAct(t,pl.k,[x,y]);
  if(t.work)G.place=null;
}
const buildHouse=(t,at)=>Buildings.of(t).house(at);
// pull a building down: half of what it last cost comes back; its estate is gone (buildings.js Buildings demolish)
const demolish=(t,l)=>Buildings.of(t).demolish(l);


