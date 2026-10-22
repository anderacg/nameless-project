'use strict';
/* ---------- the world map: its size and its layers, one map in at a time (doc/WORLD_DESIGN.md §9.1) ---------- */
// A WorldMap owns the per-tile layers, w x h: kind (T_OPEN ... T_FORD, map.js) and clim (an index into CLIMS), and the generated
// world's (elevation, rivers, regions..., below). The generator fills a map before it goes in (worldgen.js genWorld, resources.js
// genDeposits, which keeps the deposits on it). useWorld puts it in (WM): MW x MH become its size, tiles and climate its layers
// (read-only aliases for the hot loops, with tAt, terrAt, climAt and passable as before), and every system's world reset runs
// (onWorld, core.js), making its per-tile arrays at that size and dropping what it kept of the last map.
// salt: the world's, added to its battle fields' seeds (D15: 0 for the classic seed; any other world's seedNum).
/* The rest (doc/WORLD_DESIGN.md §9.1, §15.2.1), every layer made at any size. gen: 'ashmark-1' (the generator, worldgen.js: the
   only world; a save of another, the old hand-made map's 'classic-0', is refused); classic: the classic seed; seedNum (its
   settings' seed hashed, worldsettings.js seedNum) and settings (clamped, normSettings). The byte layers, MAP_LAYERS: kind; clim;
   temp, moist (0-255); elev (0-255, sea 64; terrace = clamp((elev-64)>>5, 0, 3)); rough (local relief: the largest elevation step to the 8 neighbours x4, smoothed once, D41);
   high (D41's high ground: bits 0-1 its kind, 0 none, 1 rise, 2 steep hill, 3 cliffed hill; 2-4 the way it rises, 0 E, 1 SE,
   2 S ... 7 NE, terrain.js TDX's order; 5 scree; 6 mixed, a steep hill with a gentler shoulder); feat (1 floodplain, 2 lake,
   4 coast, 8 deep wood, 16 sparse edge, 32 bridge, 64 great road, 128 track); edge (cliff edges E1 S2 W4 N8: Phase 7); region
   (Phase 4); flow (bits 0-4 log2 of the flow, 5-7 the way down, as high's); river (bits 0-1 width 0-3, 0 not a river tile;
   2 navigable; 3 seasonal; 4 freeze; 5 flood; 6 dry, with flood in the desert a flash flood; 7 a delta's channel); basin (16
   bits: 1 + its index in basins; 0 on sea and lake). The lists: rivers [{id, name, path, order, width, basin, mouth, nav,
   rapids, seasonal}], basins [{id, outlet, area, river}], crossings [{i, j, kind: bridge, ford or ferry, river, tiles, stone,
   toll, when}], roads [{a, b (the places' names), kind: road or track, path}], regions (Phase 4), cliffs (escarpment
   candidates, {a, b, side}); graph (the way graph, router.js buildWayGraph), lords (lords per realm when
   FACS has too few: D10; null) and sum (checksum, below) */
const MAP_LAYERS=['kind','clim','temp','moist','elev','rough','high','feat','edge','region','flow','river','basin'];
class WorldMap{
  constructor(w,h,seed){this.w=w;this.h=h;this.seed=seed;this.salt=0;this.classic=false;this.gen='ashmark-1';this.seedNum=0;this.settings=null;
    for(const k of MAP_LAYERS)this[k]=k==='basin'?new Uint16Array(w*h):new Uint8Array(w*h);
    this.rivers=[];this.basins=[];this.crossings=[];this.roads=[];this.regions=[];this.cliffs=[];this.graph=null;this.lords=null;this.sum=0}
  // the world's checksum (WM.sum): FNV-1a 32 over gen, settingsKey(settings), every byte layer in MAP_LAYERS' order, then the
  // holdings' names and tiles (the data it was made with)
  checksum(holdings){let h=2166136261;const s=x=>{x=String(x);for(let i=0;i<x.length;i++)h=Math.imul(h^x.charCodeAt(i),16777619)>>>0},b=a=>{a=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);for(let i=0;i<a.length;i++)h=Math.imul(h^a[i],16777619)>>>0};
    s(this.gen);s(settingsKey(this.settings));for(const k of MAP_LAYERS)b(this[k]);for(const t of holdings||[]){s(t.name);h=Math.imul(h^t.tx,16777619)>>>0;h=Math.imul(h^t.ty,16777619)>>>0}return h}
  has(tx,ty){return tx>=0&&ty>=0&&tx<this.w&&ty<this.h}
  // (off the map: water and grass, as tAt and climAt)
  kindAt(tx,ty){return this.has(tx,ty)?this.kind[ty*this.w+tx]:T_WATER}
  climAt(tx,ty){return this.has(tx,ty)?this.clim[ty*this.w+tx]:CLIM.grass}
  /* the battle at tile (tx,ty): all it reads of the world there (battleSiteOf, below), the new fields filled (doc/WORLD_DESIGN.md
     §15.2.1): river (the tile's river, or the widest within 1 tile), crossing (the nearest within WORLD_SCALE.battle.bridge
     tiles, by its tiles and its two ends), bridge from its bridges, elev, terrace, rough and high (shoulder: a mixed hill's neighbour of least
     relief, worldgen.js DIR8's way). Its river and crossing tiles are indexed once (WM._site, kept off every list and hash); a river tile off every river's path is its basin's river */
  battleSite(tx,ty){
    const R=WORLD_SCALE.battle,kinds=[],clims=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){kinds.push(this.kindAt(tx+dx,ty+dy));clims.push(CLIMS[this.climAt(tx+dx,ty+dy)])}
    const W=this.w,i=ty*W+tx,on=this.has(tx,ty),o={};let bridge=null,I=this._site;
    if(!I||I.n!==this.crossings.length||I.m!==this.rivers.length){const N=W*this.h,xi=new Int16Array(N).fill(-1),ri=new Int16Array(N).fill(-1);
      this.crossings.forEach((c,k)=>{for(const j of [c.i,c.j,...c.tiles])if(j>=0&&j<N)xi[j]=k});this.rivers.forEach((r,k)=>{for(const j of r.path)if(ri[j]<0)ri[j]=k});
      Object.defineProperty(this,'_site',{value:I={n:this.crossings.length,m:this.rivers.length,xi,ri},configurable:true,writable:true})}
    let rw=0,rt=-1,xd=null,xk=-1;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!this.has(tx+dx,ty+dy))continue;const j=(ty+dy)*W+tx+dx,w=this.river[j]&3;if(w>rw||w&&w===rw&&j===i){rw=w;rt=j}}
    for(let dy=-R.bridge;dy<=R.bridge;dy++)for(let dx=-R.bridge;dx<=R.bridge;dx++){if(!this.has(tx+dx,ty+dy))continue;const k=I.xi[(ty+dy)*W+tx+dx];if(k<0)continue;const d=Math.max(Math.abs(dx),Math.abs(dy));
      if(xd===null||d<xd){xd=d;xk=k}if(this.crossings[k].kind==='bridge'&&(bridge===null||d<bridge))bridge=d}
    if(rt>=0){const v=this.river[rt],k=I.ri[rt],b=this.basin[rt],bs=b?this.basins[b-1]:null,rv=k>=0?this.rivers[k]:bs&&bs.river!=null?this.rivers.find(r=>r.id===bs.river)||null:null;
      o.river={w:rw,dir:(this.flow[rt]>>5)&7,nav:!!(v&4),delta:!!(v&128),flood:!!((this.feat[rt]|(on?this.feat[i]:0))&1),name:rv?rv.name:'',seasonal:rv&&rv.seasonal?{...rv.seasonal}:null}}
    if(xk>=0){const c=this.crossings[xk];o.crossing={kind:c.kind,d:xd,stone:!!c.stone,toll:c.toll||null}}
    if(on){const e=this.elev[i],h=this.high[i];o.elev=e;o.terrace=Math.max(0,Math.min(3,(e-64)>>5));o.rough=this.rough[i];
      if(h&3){let sh=null;if(h&64){let lo=256;for(let k=0;k<8;k++){const x=tx+DIR8[k][0],y=ty+DIR8[k][1];if(!this.has(x,y))continue;const r=this.rough[y*W+x];if(r<lo){lo=r;sh=k}}}
        o.high={kind:['','rise','steep','cliffed'][h&3],up:(h>>2)&7,scree:!!(h&32),mixed:!!(h&64),shoulder:sh}}
      Object.assign(o,this.siteNear(tx,ty))}
    const t=kinds[4],c=clims[4],elven=TOWNS.some(o=>o.races&&o.races.length===1&&o.races[0]==='elf'&&Math.hypot(o.tx-tx,o.ty-ty)<=R.elfR);
    return battleSiteOf({tx,ty,t,c,name:REGION_NAMES[c][t],kinds,clims,road:t===T_ROAD?{ns:kinds[1]===T_ROAD||kinds[7]===T_ROAD}:null,bridge,elven,salt:this.salt,...o})}
  /* (the world round a generated world's fight, beside its tile (doc/TERRAIN_DESIGN.md §8, "Battle follows the world as built"),
     each only where there is any: temp, moist (the tile's); mix, its climates mixed (the map's own covers, worldart.js coverOf, read
     at the 9 tiles as weights: each other climate's cover, the grass the rest): {c, the other climate most there; share, its mean
     weight; dir, [x, y] toward it (east, south); w, its weight at each tile, row by row; shares, every climate's}, none where every
     tile is the fight's own climate past SITE_NEAR.pure; pond, the water of a pond or an oasis among the 9 tiles (WM.ponds, WM.oases:
     {kind (an oasis 'oasis'), dx, dy (its middle off the tile), size (its tiles), n (how many of the 8 neighbours it holds), at (which
     of the 9, kinds' order)}); brook, a brook on the tile or beside it (WM.flow at GEN_RIVER.brook, no river's tile: worldgen.js
     genBrook; {on: the tile's own}); lane, the tile a road through a wood or a track ({track: a track (feat 128), wood: its wood
     neighbours}); lots, the holdings' buildings and fields within SITE_NEAR.lots tiles (lots.js lotOf; {k, type, people, seed, dx,
     dy, n, plots: [[dx, dy]...]}, off the tile)) */
  siteNear(tx,ty){
    const W=this.w,i=ty*W+tx,o={temp:this.temp[i],moist:this.moist[i]},N=SITE_NEAR,c0=this.clim[i];
    const cv=this.covers();if(cv){const w9=[],sum=CLIMS.map(()=>0);let hi=0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=Math.max(0,Math.min(W-1,tx+dx)),y=Math.max(0,Math.min(this.h-1,ty+dy)),j=y*W+x,d=cv.desert[j],s=cv.swamp[j],f=cv.frost[j],g=Math.max(0,1-d-s-f),n=g+d+s+f||1,q=[g/n,f/n,d/n,s/n];
        w9.push(q);q.forEach((v,k)=>{sum[k]+=v;if(k!==c0&&v>hi)hi=v})}
      let k1=-1;for(let k=0;k<CLIMS.length;k++)if(k!==c0&&(k1<0||sum[k]>sum[k1]))k1=k;
      if(hi>=N.pure){const w=w9.map(q=>q[k1]),gx=w[2]+w[5]+w[8]-w[0]-w[3]-w[6],gy=w[6]+w[7]+w[8]-w[0]-w[1]-w[2],l=Math.hypot(gx,gy);
        o.mix={c:CLIMS[k1],share:sum[k1]/9,dir:l>1e-6?[gx/l,gy/l]:[0,0],w,shares:Object.fromEntries(CLIMS.map((n,k)=>[n,sum[k]/9]))}}}
    const P=this.pondsAt();for(let dy=-1;dy<=1&&!o.pond;dy++)for(let dx=-1;dx<=1;dx++){if(!this.has(tx+dx,ty+dy))continue;const p=P.get((ty+dy)*W+tx+dx);if(!p)continue;
      const cx=p.i%W,cy=(p.i-cx)/W,at=[];for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if(this.has(tx+a,ty+b)&&P.get((ty+b)*W+tx+a)===p)at.push((b+1)*3+a+1);
      o.pond={kind:p.kind||'oasis',dx:cx-tx,dy:cy-ty,size:p.tiles.length,n:at.filter(k=>k!==4).length,at};break}
    const BK=typeof GEN_RIVER==='object'?GEN_RIVER.brook:99;
    for(let dy=-1;dy<=1&&!o.brook;dy++)for(let dx=-1;dx<=1;dx++){if(!this.has(tx+dx,ty+dy))continue;const j=(ty+dy)*W+tx+dx,k=this.kind[j];
      if(k!==T_WATER&&k!==T_MOUNT&&!(this.river[j]&3)&&(this.flow[j]&31)>=BK){o.brook={on:!dx&&!dy||(this.flow[i]&31)>=BK&&!(this.river[i]&3)};break}}
    if(this.kind[i]===T_ROAD){let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&this.kindAt(tx+dx,ty+dy)===T_FOREST)n++;const tr=!!(this.feat[i]&128);if(tr||n>=N.wood)o.lane={track:tr,wood:n}}
    if(typeof lotOf==='function'&&this===WM){const seen=new Set(),L=[],r=N.lots;
      for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const l=lotOf(tx+dx,ty+dy);if(!l||seen.has(l)||l.st==='ruined')continue;seen.add(l);const t=TOWNS.find(q=>q.lots&&q.lots.includes(l));
        L.push({k:l.k,type:l.type,people:t?lotPeople(t,l):'human',seed:l.seed|0,dx:l.x-tx,dy:l.y-ty,n:l.n,plots:(l.plots||[]).map(([x,y])=>[x-tx,y-ty]).filter(([a,b])=>Math.abs(a)<=r+1&&Math.abs(b)<=r+1)})}
      if(L.length)o.lots=L}
    return o}
  // (the climates' covers as the art paints them (worldart.js coverOf: the desert's, the swamp's, the frost's snow), made once a map,
  //  kept off every list and hash; none but on the map in use, or with no art)
  covers(){if(this!==WM||typeof coverOf!=='function')return null;let c=this._cover;
    if(!c)Object.defineProperty(this,'_cover',{value:c={desert:coverOf('desert',true),swamp:coverOf('swamp',true),frost:coverOf('frost',true)},configurable:true,writable:true});return c}
  // (each pond's and oasis's water tiles: its record, by tile; made once a list, kept as _site is)
  pondsAt(){const L=[...(this.ponds||[]),...(this.oases||[])];let m=this._ponds;
    if(!m||m.n!==L.length){m=new Map();for(const p of L)for(const j of p.tiles)m.set(j,p);m.n=L.length;Object.defineProperty(this,'_ponds',{value:m,configurable:true,writable:true})}return m}
}
/* what a generated world's battle reads beside its tile (WorldMap#siteNear): pure, the least weight another climate must have at one of
   the 9 tiles for the field to mix (the covers fade to 0 some 4 tiles off a border); wood, a road's wood neighbours for a lane (as the
   art's, worldart.js GENART.wood); lots, the tiles each way it looks for buildings and fields */
const SITE_NEAR={pure:.03,wood:4,lots:2};
/* a BattleSite (doc/WORLD_DESIGN.md R17, §13): one plain object, the hand-off from the world to a battle. The battle reads nothing
   else of the world (setup.js battleEnv, fieldSize; terrain.js terrainOf, terrainEdges; engage.js bridgeNear, coverAt).
   tx, ty: the tile; t, c, name: its kind, climate and name (as map.js regionAt); kinds, clims: the 3 x 3 tiles round it, row by
   row from the north-west (4: the tile; off the map water and grass); road: the tile is a road ({ns}: it runs on north or south);
   bridge: how far the nearest road bridge is (tiles, the larger of dx, dy), up to WORLD_SCALE.battle.bridge, else null; elven: an
   elven town within WORLD_SCALE.battle.elfR tiles; salt: the world's (WorldMap.salt), in the field's seed.
   Empty (null) till their phases fill them (doc/WORLD_DESIGN.md §15.2.1; null in the lab unless its spec asks): river ({w, dir, nav, delta, flood, name, seasonal}: phase 2) and crossing ({kind, d, stone, toll}: phase 2), season (its
   river's state: phase 5), region (the recipe's bias) and deep (deep forest: phase 4), elev, terrace and rough (0-255, 0-3,
   0-255) and high ({kind: rise, steep or cliffed, up, scree, mixed, shoulder}: the kind of high ground, D41, phase 2), cliff
   (escarpment and mesa edges: D14, D40; phase 7). Phase 2's (river, crossing, elev, terrace, rough, high) are filled in a
   world (WorldMap#battleSite), and read by terrain.js (riverOf, worldOf). The lab makes its own (lab.js labSite):
   kinds and clims all its own, and its config.site's river, crossing and high. Battle follows the world (WorldMap#siteNear; null
   in the lab): temp, moist, mix (the climates' edge), pond, brook, lane and lots, read by
   terrain.js ofSite, edgesOf, riverOf and worldOf (TERRAIN_WORLD) */
function battleSiteOf(o){const S={tx:0,ty:0,t:T_OPEN,c:'grass',name:'',kinds:null,clims:null,road:null,bridge:null,elven:false,salt:0,
  river:null,crossing:null,season:null,region:null,deep:null,elev:null,terrace:null,rough:null,high:null,cliff:null,
  temp:null,moist:null,mix:null,pond:null,brook:null,lane:null,lots:null,...o};S.kinds=S.kinds||Array(9).fill(S.t);S.clims=S.clims||Array(9).fill(S.c);return S}
// (the battle at world point (x,y), px)
const battleSiteAt=(x,y)=>WM.battleSite(Math.floor(x/TILE),Math.floor(y/TILE));
let WM=null,tiles=null,climate=null;
function useWorld(map){WM=map;MW=map.w;MH=map.h;tiles=map.kind;climate=map.clim;for(const fn of WORLD_HOOKS)fn(map);return map}
// a generated world put in (worldgen.js genWorld's result r): its holdings and camps (holdings.js setHoldings, setCamps), its
// lords, its deposits, then the map (useWorld)
function installWorld(r){setHoldings(r.holdings);setCamps(r.camps);r.map.lords=r.lords||null;genDeposits(r.map,TOWNS);return useWorld(r.map)}
// the classic world (the Classic preset: Normal, seed CLASSIC, doc/WORLD_DESIGN.md §8.15), made and put in at once
function installClassic(){return installWorld(genWorld(classicSettings()))}
// the world as it first stands (main.js keeps it at load, once initWorld has laid it out): every new game on the map starts from
// it, as a fresh page's does: the holdings as they stood (the estates a holding starts with are chosen knowing where its buildings
// stood: estates.js canHave), their lots' grid and lot count (lots.js) and the land they claimed (territory.js), each put back by
// its own system's world reset
function worldKeep(){WM.first={towns:TOWNS.map(t=>JSON.stringify(t,(k,v)=>k[0]==='_'?undefined:v)),occ:OCC.slice(),lotN,land:LAND.slice(),landSig,landTiles:landTiles.slice()}}
// (each holding as it first stood: what play added to it gone, what it changed put back, its kind's class too)
onWorld(m=>{const F=m.first;if(F)TOWNS.forEach((t,i)=>{for(const k of Object.keys(t))delete t[k];holdingOf(Object.assign(t,JSON.parse(F.towns[i])))})});
// (the tests and the wiki make it here, at once; the game's own page makes none at load: it opens on the main menu
// and a world is made when a campaign starts or a save is loaded: ui/mainmenu.js, session.js begin, save.js loadGame)
if(/[?&]test=/.test(location.search)||/wiki\.html$/i.test(location.pathname))installClassic();
