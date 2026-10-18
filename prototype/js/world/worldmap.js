'use strict';
/* ---------- the world map: its size and its layers, one map in at a time (doc/WORLD_DESIGN.md §9.1) ---------- */
// A WorldMap owns the per-tile layers, w x h: kind (T_OPEN ... T_MOUNT, map.js) and clim (an index into CLIMS); later layers
// (elevation, rivers, regions...) join them here. Generators fill a map before it goes in (map.js genClassic, resources.js
// genDeposits, which keeps the deposits on it). useWorld puts it in (WM): MW x MH become its size, tiles and climate its layers
// (read-only aliases for the hot loops, with tAt, terrAt, climAt and passable as before), and every system's world reset runs
// (onWorld, core.js), making its per-tile arrays at that size and dropping what it kept of the last map.
// salt: the world's, added to its battle fields' seeds (D15: 0 for classic; the presets will draw theirs)
class WorldMap{
  constructor(w,h,seed){this.w=w;this.h=h;this.seed=seed;this.salt=0;this.kind=new Uint8Array(w*h);this.clim=new Uint8Array(w*h)}
  has(tx,ty){return tx>=0&&ty>=0&&tx<this.w&&ty<this.h}
  // (off the map: water and grass, as tAt and climAt)
  kindAt(tx,ty){return this.has(tx,ty)?this.kind[ty*this.w+tx]:T_WATER}
  climAt(tx,ty){return this.has(tx,ty)?this.clim[ty*this.w+tx]:CLIM.grass}
  // (a road bridge: a road tile with water on both sides, east and west or north and south)
  roadBridge(tx,ty){const k=(a,b)=>this.kindAt(a,b);return k(tx,ty)===T_ROAD&&(k(tx-1,ty)===T_WATER&&k(tx+1,ty)===T_WATER||k(tx,ty-1)===T_WATER&&k(tx,ty+1)===T_WATER)}
  // the battle at tile (tx,ty): all it reads of the world there (battleSiteOf, below)
  battleSite(tx,ty){
    const R=WORLD_SCALE.battle,kinds=[],clims=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){kinds.push(this.kindAt(tx+dx,ty+dy));clims.push(CLIMS[this.climAt(tx+dx,ty+dy)])}
    let bridge=null;for(let dy=-R.bridge;dy<=R.bridge;dy++)for(let dx=-R.bridge;dx<=R.bridge;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy));if((bridge===null||d<bridge)&&this.roadBridge(tx+dx,ty+dy))bridge=d}
    const t=kinds[4],c=clims[4],elven=TOWNS.some(o=>o.races&&o.races.length===1&&o.races[0]==='elf'&&Math.hypot(o.tx-tx,o.ty-ty)<=R.elfR);
    return battleSiteOf({tx,ty,t,c,name:REGION_NAMES[c][t],kinds,clims,road:t===T_ROAD?{ns:kinds[1]===T_ROAD||kinds[7]===T_ROAD}:null,bridge,elven,salt:this.salt})}
}
/* a BattleSite (doc/WORLD_DESIGN.md R17, §13): one plain object, the hand-off from the world to a battle. The battle reads nothing
   else of the world (setup.js battleEnv, fieldSize; terrain.js terrainOf, terrainEdges; encounters.js bridgeNear, coverAt).
   tx, ty: the tile; t, c, name: its kind, climate and name (as map.js regionAt); kinds, clims: the 3 x 3 tiles round it, row by
   row from the north-west (4: the tile; off the map water and grass); road: the tile is a road ({ns}: it runs on north or south);
   bridge: how far the nearest road bridge is (tiles, the larger of dx, dy), up to WORLD_SCALE.battle.bridge, else null; elven: an
   elven town within WORLD_SCALE.battle.elfR tiles; salt: the world's (WorldMap.salt), in the field's seed.
   Empty (null) till their phases fill them: river (its width, flow, crossings and bridge: D13, phase 2), season (its river's state:
   phase 5), region (the recipe's bias) and deep (deep forest: phase 4), elev and terrace (the kind of high ground: D41), cliff
   (escarpment and mesa edges: D14, D40; phase 7). The lab makes its own (lab.js labSite): kinds and clims all its own */
function battleSiteOf(o){const S={tx:0,ty:0,t:T_OPEN,c:'grass',name:'',kinds:null,clims:null,road:null,bridge:null,elven:false,salt:0,
  river:null,season:null,region:null,deep:null,elev:null,terrace:null,cliff:null,...o};S.kinds=S.kinds||Array(9).fill(S.t);S.clims=S.clims||Array(9).fill(S.c);return S}
// (the battle at world point (x,y), px)
const battleSiteAt=(x,y)=>WM.battleSite(Math.floor(x/TILE),Math.floor(y/TILE));
// (a road bridge on the map in use: tests/battletypes.js)
const roadBridge=(tx,ty)=>WM.roadBridge(tx,ty);
let WM=null,tiles=null,climate=null;
function useWorld(map){WM=map;MW=map.w;MH=map.h;tiles=map.kind;climate=map.clim;for(const fn of WORLD_HOOKS)fn(map);return map}
// the classic world, made at load as it always was: the same every game (its noise has fixed seeds); its holdings and camps
// from places.js (holdings.js setHoldings, setCamps) first
function installClassic(){setHoldings(CLASSIC_PLACES);setCamps(CLASSIC_CAMPS);const m=new WorldMap(224,160,0);m.classic=true;genClassic(m,TOWNS,CAMP_SPOTS);genDeposits(m,TOWNS);return useWorld(m)}
// the world as it first stands (main.js keeps it at load, once initWorld has laid it out): every new game on the map starts from
// it, as a fresh page's does: the holdings as they stood (the estates a holding starts with are chosen knowing where its buildings
// stood: estates.js canHave), their lots' grid and lot count (lots.js) and the land they claimed (territory.js), each put back by
// its own system's world reset
function worldKeep(){WM.first={towns:TOWNS.map(t=>JSON.stringify(t,(k,v)=>k[0]==='_'?undefined:v)),occ:OCC.slice(),lotN,land:LAND.slice(),landSig,landTiles:landTiles.slice()}}
// (each holding as it first stood: what play added to it gone, what it changed put back, its kind's class too)
onWorld(m=>{const F=m.first;if(F)TOWNS.forEach((t,i)=>{for(const k of Object.keys(t))delete t[k];holdingOf(Object.assign(t,JSON.parse(F.towns[i])))})});
installClassic();
