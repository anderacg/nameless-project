'use strict';
/* ---------- the world map: its size and its layers, one map in at a time (doc/WORLD_DESIGN.md §9.1) ---------- */
// A WorldMap owns the per-tile layers, w x h: kind (T_OPEN ... T_MOUNT, map.js) and clim (an index into CLIMS); later layers
// (elevation, rivers, regions...) join them here. Generators fill a map before it goes in (map.js genClassic, resources.js
// genDeposits, which keeps the deposits on it). useWorld puts it in (WM): MW x MH become its size, tiles and climate its layers
// (read-only aliases for the hot loops, with tAt, terrAt, climAt and passable as before), and every system's world reset runs
// (onWorld, core.js), making its per-tile arrays at that size and dropping what it kept of the last map.
class WorldMap{
  constructor(w,h,seed){this.w=w;this.h=h;this.seed=seed;this.kind=new Uint8Array(w*h);this.clim=new Uint8Array(w*h)}
  has(tx,ty){return tx>=0&&ty>=0&&tx<this.w&&ty<this.h}
  // (off the map: water and grass, as tAt and climAt)
  kindAt(tx,ty){return this.has(tx,ty)?this.kind[ty*this.w+tx]:T_WATER}
  climAt(tx,ty){return this.has(tx,ty)?this.clim[ty*this.w+tx]:CLIM.grass}
}
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
