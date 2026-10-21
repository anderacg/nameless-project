'use strict';
/* ---------- the world map: its size and its layers, one map in at a time (doc/WORLD_DESIGN.md §9.1) ---------- */
// A WorldMap owns the per-tile layers, w x h: kind (T_OPEN ... T_FORD, map.js) and clim (an index into CLIMS), and the generated
// world's (elevation, rivers, regions..., below). Generators fill a map before it goes in (map.js genClassic or worldgen.js genWorld, resources.js
// genDeposits, which keeps the deposits on it). useWorld puts it in (WM): MW x MH become its size, tiles and climate its layers
// (read-only aliases for the hot loops, with tAt, terrAt, climAt and passable as before), and every system's world reset runs
// (onWorld, core.js), making its per-tile arrays at that size and dropping what it kept of the last map.
// salt: the world's, added to its battle fields' seeds (D15: 0 for classic; a generated world's seedNum).
/* The rest (doc/WORLD_DESIGN.md §9.1, §15.2.1), every layer made at any size, today's map too (all 0 there: nothing on it reads
   them). gen: 'classic-0' (today's map, genClassic) or 'ashmark-1' (the generator, worldgen.js); classic: today's map or the
   generated classic seed; seedNum (its settings' seed hashed, worldsettings.js seedNum; 0 for classic-0) and settings (clamped,
   normSettings; null for classic-0). The byte layers, MAP_LAYERS: kind; clim; temp, moist (0-255); elev (0-255, sea 64; terrace
   = clamp((elev-64)>>5, 0, 3)); rough (local relief: the largest elevation step to the 8 neighbours x4, smoothed once, D41);
   high (D41's high ground: bits 0-1 its kind, 0 none, 1 rise, 2 steep hill, 3 cliffed hill; 2-4 the way it rises, 0 E, 1 SE,
   2 S ... 7 NE, terrain.js TDX's order; 5 scree; 6 mixed, a steep hill with a gentler shoulder); feat (1 floodplain, 2 lake,
   4 coast, 8 deep wood, 16 sparse edge, 32 bridge, 64 great road, 128 track); edge (cliff edges E1 S2 W4 N8: Phase 7); region
   (Phase 4); flow (bits 0-4 log2 of the flow, 5-7 the way down, as high's); river (bits 0-1 width 0-3, 0 not a river tile;
   2 navigable; 3 seasonal; 4 freeze; 5 flood; 6 dry, with flood in the desert a flash flood; 7 a delta's channel); basin (16
   bits: 1 + its index in basins; 0 on sea and lake). The lists: rivers [{id, name, path, order, width, basin, mouth, nav,
   rapids, seasonal}], basins [{id, outlet, area, river}], crossings [{i, j, kind: bridge, ford or ferry, river, tiles, stone,
   toll, when}], roads [{a, b (the places' names), kind: road or track, path}], regions (Phase 4), cliffs (escarpment
   candidates, {a, b, side}); graph (the way graph, router.js buildWayGraph; null for classic-0), lords (lords per realm when
   FACS has too few: D10; null) and sum (checksum, below) */
const MAP_LAYERS=['kind','clim','temp','moist','elev','rough','high','feat','edge','region','flow','river','basin'];
class WorldMap{
  constructor(w,h,seed){this.w=w;this.h=h;this.seed=seed;this.salt=0;this.classic=false;this.gen='classic-0';this.seedNum=0;this.settings=null;
    for(const k of MAP_LAYERS)this[k]=k==='basin'?new Uint16Array(w*h):new Uint8Array(w*h);
    this.rivers=[];this.basins=[];this.crossings=[];this.roads=[];this.regions=[];this.cliffs=[];this.graph=null;this.lords=null;this.sum=0}
  // the world's checksum (WM.sum): FNV-1a 32 over gen, settingsKey(settings), every byte layer in MAP_LAYERS' order, then the
  // holdings' names and tiles (the data it was made with); for classic-0, gen, kind and clim
  checksum(holdings){let h=2166136261;const s=x=>{x=String(x);for(let i=0;i<x.length;i++)h=Math.imul(h^x.charCodeAt(i),16777619)>>>0},b=a=>{a=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);for(let i=0;i<a.length;i++)h=Math.imul(h^a[i],16777619)>>>0};
    s(this.gen);if(this.gen==='classic-0'){b(this.kind);b(this.clim);return h}
    s(settingsKey(this.settings));for(const k of MAP_LAYERS)b(this[k]);for(const t of holdings||[]){s(t.name);h=Math.imul(h^t.tx,16777619)>>>0;h=Math.imul(h^t.ty,16777619)>>>0}return h}
  has(tx,ty){return tx>=0&&ty>=0&&tx<this.w&&ty<this.h}
  // (off the map: water and grass, as tAt and climAt)
  kindAt(tx,ty){return this.has(tx,ty)?this.kind[ty*this.w+tx]:T_WATER}
  climAt(tx,ty){return this.has(tx,ty)?this.clim[ty*this.w+tx]:CLIM.grass}
  // (a road bridge: a road tile with water on both sides, east and west or north and south)
  roadBridge(tx,ty){const k=(a,b)=>this.kindAt(a,b);return k(tx,ty)===T_ROAD&&(k(tx-1,ty)===T_WATER&&k(tx+1,ty)===T_WATER||k(tx,ty-1)===T_WATER&&k(tx,ty+1)===T_WATER)}
  /* the battle at tile (tx,ty): all it reads of the world there (battleSiteOf, below). A generated world (gen not classic-0) fills
     the new fields (doc/WORLD_DESIGN.md §15.2.1): river (the tile's river, or the widest within 1 tile), crossing (the nearest
     within WORLD_SCALE.battle.bridge tiles, by its tiles and its two ends), bridge from its bridges (today's map: its road bridges),
     elev, terrace, rough and high (shoulder: a mixed hill's neighbour of least relief, worldgen.js DIR8's way). Its river and crossing tiles are indexed
     once (WM._site, kept off every list and hash); a river tile off every river's path is its basin's river */
  battleSite(tx,ty){
    const R=WORLD_SCALE.battle,kinds=[],clims=[],gen=this.gen!=='classic-0';for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){kinds.push(this.kindAt(tx+dx,ty+dy));clims.push(CLIMS[this.climAt(tx+dx,ty+dy)])}
    let bridge=null,o={};
    if(gen){const W=this.w,i=ty*W+tx,on=this.has(tx,ty);let I=this._site;
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
          o.high={kind:['','rise','steep','cliffed'][h&3],up:(h>>2)&7,scree:!!(h&32),mixed:!!(h&64),shoulder:sh}}}}
    else for(let dy=-R.bridge;dy<=R.bridge;dy++)for(let dx=-R.bridge;dx<=R.bridge;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy));if((bridge===null||d<bridge)&&this.roadBridge(tx+dx,ty+dy))bridge=d}
    const t=kinds[4],c=clims[4],elven=TOWNS.some(o=>o.races&&o.races.length===1&&o.races[0]==='elf'&&Math.hypot(o.tx-tx,o.ty-ty)<=R.elfR);
    return battleSiteOf({tx,ty,t,c,name:REGION_NAMES[c][t],kinds,clims,road:t===T_ROAD?{ns:kinds[1]===T_ROAD||kinds[7]===T_ROAD}:null,bridge,elven,salt:this.salt,...o})}
}
/* a BattleSite (doc/WORLD_DESIGN.md R17, §13): one plain object, the hand-off from the world to a battle. The battle reads nothing
   else of the world (setup.js battleEnv, fieldSize; terrain.js terrainOf, terrainEdges; engage.js bridgeNear, coverAt).
   tx, ty: the tile; t, c, name: its kind, climate and name (as map.js regionAt); kinds, clims: the 3 x 3 tiles round it, row by
   row from the north-west (4: the tile; off the map water and grass); road: the tile is a road ({ns}: it runs on north or south);
   bridge: how far the nearest road bridge is (tiles, the larger of dx, dy), up to WORLD_SCALE.battle.bridge, else null; elven: an
   elven town within WORLD_SCALE.battle.elfR tiles; salt: the world's (WorldMap.salt), in the field's seed.
   Empty (null) till their phases fill them (doc/WORLD_DESIGN.md §15.2.1; null with WORLD.gen off, and in the lab unless its spec
   asks): river ({w, dir, nav, delta, flood, name, seasonal}: phase 2) and crossing ({kind, d, stone, toll}: phase 2), season (its
   river's state: phase 5), region (the recipe's bias) and deep (deep forest: phase 4), elev, terrace and rough (0-255, 0-3,
   0-255) and high ({kind: rise, steep or cliffed, up, scree, mixed, shoulder}: the kind of high ground, D41, phase 2), cliff
   (escarpment and mesa edges: D14, D40; phase 7). Phase 2's (river, crossing, elev, terrace, rough, high) are filled in a
   generated world (WorldMap#battleSite), and read by terrain.js (riverOf, worldOf). The lab makes its own (lab.js labSite):
   kinds and clims all its own, and its config.site's river, crossing and high */
function battleSiteOf(o){const S={tx:0,ty:0,t:T_OPEN,c:'grass',name:'',kinds:null,clims:null,road:null,bridge:null,elven:false,salt:0,
  river:null,crossing:null,season:null,region:null,deep:null,elev:null,terrace:null,rough:null,high:null,cliff:null,...o};S.kinds=S.kinds||Array(9).fill(S.t);S.clims=S.clims||Array(9).fill(S.c);return S}
// (the battle at world point (x,y), px)
const battleSiteAt=(x,y)=>WM.battleSite(Math.floor(x/TILE),Math.floor(y/TILE));
// (a road bridge on the map in use: tests/battletypes.js)
const roadBridge=(tx,ty)=>WM.roadBridge(tx,ty);
let WM=null,tiles=null,climate=null;
function useWorld(map){WM=map;MW=map.w;MH=map.h;tiles=map.kind;climate=map.clim;for(const fn of WORLD_HOOKS)fn(map);return map}
// a generated world put in (worldgen.js genWorld's result r): its holdings and camps (holdings.js setHoldings, setCamps), its
// lords, its deposits, then the map (useWorld), as installClassic puts in today's
function installWorld(r){setHoldings(r.holdings);setCamps(r.camps);r.map.lords=r.lords||null;genDeposits(r.map,TOWNS);return useWorld(r.map)}
// the classic world, made at load as it always was: the same every game (its noise has fixed seeds); its holdings and camps
// from places.js (holdings.js setHoldings, setCamps) first. With WORLD.gen (data/world.js) the generated classic seed instead
// (Normal, seed CLASSIC: doc/WORLD_DESIGN.md §8.15)
function installClassic(){if(WORLD.gen)return installWorld(genWorld(classicSettings()));
  setHoldings(CLASSIC_PLACES);setCamps(CLASSIC_CAMPS);const m=new WorldMap(224,160,0);m.classic=true;genClassic(m,TOWNS,CAMP_SPOTS);m.sum=m.checksum();genDeposits(m,TOWNS);return useWorld(m)}
// the world as it first stands (main.js keeps it at load, once initWorld has laid it out): every new game on the map starts from
// it, as a fresh page's does: the holdings as they stood (the estates a holding starts with are chosen knowing where its buildings
// stood: estates.js canHave), their lots' grid and lot count (lots.js) and the land they claimed (territory.js), each put back by
// its own system's world reset
function worldKeep(){WM.first={towns:TOWNS.map(t=>JSON.stringify(t,(k,v)=>k[0]==='_'?undefined:v)),occ:OCC.slice(),lotN,land:LAND.slice(),landSig,landTiles:landTiles.slice()}}
// (each holding as it first stood: what play added to it gone, what it changed put back, its kind's class too)
onWorld(m=>{const F=m.first;if(F)TOWNS.forEach((t,i)=>{for(const k of Object.keys(t))delete t[k];holdingOf(Object.assign(t,JSON.parse(F.towns[i])))})});
// (with WORLD.gen the game's own page forges it behind the overlay instead, once every script is in: main.js; the tests and the
// wiki make it here, at once)
if(!(WORLD.gen&&!/[?&]test=/.test(location.search)&&!/wiki\.html$/i.test(location.pathname)))installClassic();
