'use strict';
/* ---------- map ---------- */
function hash(x,y,s){let h=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,2147483647);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296}
function noise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
const fbm=(x,y,s)=>noise(x,y,s)*.6+noise(x*2,y*2,s+1)*.3+noise(x*4,y*4,s+2)*.1;
// two layers per tile: terrain (what is on the ground) and climate (how cold, hot or wet it is). T_FORD: a river's ford, walked
// through (only the generated world has them: world/worldplace.js; every table indexed by kind has its entry)
const T_OPEN=0,T_FOREST=1,T_HILL=2,T_WATER=3,T_ROAD=4,T_MOUNT=5,T_FORD=6;
// (tiles, climate: the layers of the map that is in, by these names for the hot loops: world/worldmap.js useWorld)
const CLIMS=['grass','frost','desert','swamp'],CLIM=Object.fromEntries(CLIMS.map((c,i)=>[c,i]));
const SPEEDMUL=[1,.6,.75,0,1.3,0,.5];
const CLIMMUL={grass:1,frost:.7,desert:.85,swamp:.5};
const tAt=(tx,ty)=>(tx<0||ty<0||tx>=MW||ty>=MH)?T_WATER:tiles[ty*MW+tx];
const terrAt=(x,y)=>tAt(Math.floor(x/TILE),Math.floor(y/TILE));
const climAt=(x,y)=>{const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return(tx<0||ty<0||tx>=MW||ty>=MH)?'grass':CLIMS[climate[ty*MW+tx]]};
const passable=t=>t!==T_WATER&&t!==T_MOUNT;
/* regions: what a place is called and how it treats travelers */
const REGION_NAMES={grass:['Grassland','Forest','Hills','Lake','Road','Mountains','Ford'],frost:['Tundra','Frost forest','Frozen hills','Ice lake','Frozen road','Frost peaks','Frozen ford'],
  desert:['Desert','Desert','Rocky badlands','Oasis','Desert road','Red peaks','Wadi ford'],swamp:['Swamp','Mangrove','Mire hills','Bog water','Causeway','Peaks','Bog ford']};
// (an estate's track: lots.js estTrack)
const TRACK_NAMES={grass:'Track',frost:'Frozen track',desert:'Desert track',swamp:'Swamp track'};
// t and c the tile's; its name the road's where you stand on the road as drawn (world/roadband.js RoadBand on: road 1, an estate's
// track 2, else 0), as the HUD shows it; tile: the tile's own (the battle's site reads its tile: worldmap.js battleSite)
function regionAt(x,y,tile){const t=terrAt(x,y),c=climAt(x,y),road=tile?0:RoadBand.on(x,y);return{t,c,name:road===2?TRACK_NAMES[c]:road?REGION_NAMES[c][T_ROAD]:REGION_NAMES[c][t],road}}
// base travel speed for anyone; race only matters for the player's own party. On a road's band (world/roadband.js) its road's
// speed, blended to the land's over its shoulder; a road's own tile its road's; a ford, water and the peaks by their tiles
function speedAt(x,y,race,extra){
  const t=terrAt(x,y),c=climAt(x,y);if(!passable(t))return 0;
  const b=t===T_FORD?0:RoadBand.at(x,y);if(t===T_ROAD)return RoadBand.speed(b,race);
  const home=(race?RACES[race].home:[]).concat(extra||[]);
  const tm=(t===T_FOREST&&home.includes('forest'))||(t===T_HILL&&home.includes('hills'))?1:SPEEDMUL[t];
  const cm=home.includes(c)?1:CLIMMUL[c];
  const land=Math.max(.35,tm*cm)*(race==='human'&&c==='grass'&&t===T_OPEN?1.1:1);
  return b?Math.max(land,land+(RoadBand.speed(b,race)-land)*RoadBand.share(b)):land;
}
function visMulAt(x,y){const t=terrAt(x,y),c=climAt(x,y);return t===T_HILL?1.3:t===T_FOREST?.7:c==='swamp'?.8:c==='desert'?1.2:1}
const hiddenAt=(x,y)=>terrAt(x,y)===T_FOREST;
function nearWater(x,y,r){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(tAt(tx+i,ty+j)===T_WATER&&tx+i>0&&ty+j>0&&tx+i<MW-1&&ty+j<MH-1)return true;return false}
// move something stuck on water or a mountain (old saves, map changes) to the nearest open tile
function unstick(o){
  if(passable(terrAt(o.x,o.y)))return;const tx=Math.floor(o.x/TILE),ty=Math.floor(o.y/TILE);
  for(let r=1;r<20;r++)for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(passable(tAt(tx+i,ty+j))){o.x=(tx+i+.5)*TILE;o.y=(ty+j+.5)*TILE;return}
}
