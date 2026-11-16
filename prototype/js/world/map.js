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
// (the land by its slope (worldgen.js landClasses, the map's slope: flat, a slope, steep; a cliff is rock no one walks), how fast it
// is walked, times its kind's; from snow levels up (the map's lv) the cold heights slower still; how much farther one sees a level up)
const SLOPE={mul:[1,.8,.55,.4],snow:14,cold:.6,sight:.03,sightMax:.5};
const slopeMulAt=i=>{const S=WM&&WM.slope;if(!S)return 1;const v=SLOPE.mul[S[i]];return WM.lv&&WM.lv[i]>=SLOPE.snow?v*SLOPE.cold:v};
/* the way's price of a climb (the owner, 2026-11-15: "feel free to change the path finding"): a step from tile a to tile b costs, over
   its ground's, up tiles of open ground for each level climbed and down for each level gone down (the map's lv); a road's grade,
   road of it. So a way goes round a hill, along a valley and over a range by its lowest pass rather than straight over the top
   (router.js findPath, buildWayGraph) */
const CLIMB={up:1.1,down:.3,road:.35};
const climbCost=(L,a,b,road)=>{if(!L)return 0;const d=L[b]-L[a];return (d>0?d*CLIMB.up:-d*CLIMB.down)*(road?CLIMB.road:1)};
/* water as the world lab has it (engine/worldlab.js LAB.depth; the owner, 2026-11-15: "Use the same concept in the lab. Use that as
   a baseline, we can swim as well right?"): every water tile is walked by its depth (levels, a level some 0.85 m): ankle, knee,
   waist deep past bands' each, deeper swum; how fast by each (speed: dry, ankle, knee, waist, swimming) and what a tile of it
   costs a way (cost: tiles of open ground; swimming the lab's swimCost); how much of a man is under it (cut: figure px); how a man
   in it is drawn (draw: his body under the water at under of its alpha, the water's darker band about him, a ripple's rate a second still and moving, spreading out to spread of his width; drawn sunk by his tile's depth (open water as deep as open), eased in from the drawn bank over ramp px: worldterrain.js drawnDepth). A river is as deep as it is wide (river: by its width, 1-3
   tiles); the sea and a lake by how far out a tile lies (shore: 1, 2, 3 tiles from the land); farther out than reach tiles it is
   open water no one swims (to cross it, a ship or a ferry). Wading and swimming tire a band (supply.js staminaRate: wade, swim
   times the march's drain). waterDepths: the depths of a map (0 land, -1 open water), kept for it */
const WATER={bands:[.12,.35,.8],speed:[1,.85,.6,.35,.3],cost:[1,1.2,1.8,3.5,9],cut:[0,1,4,8,12],river:[0,.5,1,1.5],shore:[.3,.7,1.2],reach:3,wade:1.4,swim:3,draw:{under:.3,shade:'rgba(34,64,76,.28)',ripple:.6,rippleMove:1.5,spread:.5,ramp:8},open:2};
const WDEPTHS=new WeakMap();
function waterDepths(m){let D=WDEPTHS.get(m);if(D)return D;const W=m.w,H=m.h,N=W*H,K=m.kind,Rv=m.river,R=WATER;D=new Float32Array(N);
  const far=new Uint8Array(N).fill(255),q=[];for(let i=0;i<N;i++)if(K[i]!==T_WATER){far[i]=0;q.push(i)}
  for(let h=0;h<q.length;h++){const i=q[h],x=i%W,y=(i-x)/W,d=far[i]+1;if(d>R.reach+1)continue;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const u=x+a,v=y+b;if(u<0||v<0||u>=W||v>=H)continue;const j=v*W+u;if(far[j]>d){far[j]=d;q.push(j)}}}
  for(let i=0;i<N;i++){if(K[i]!==T_WATER)continue;const x=i%W,y=(i-x)/W;if(x<1||y<1||x>=W-1||y>=H-1){D[i]=-1;continue}
    D[i]=Rv[i]&3?R.river[Rv[i]&3]:far[i]>R.reach?-1:R.shore[far[i]-1]}
  WDEPTHS.set(m,D);return D}
// (a tile's water: 0 dry land, 1 ankle, 2 knee, 3 waist deep, 4 swum, 5 open water; walkTile: one may be there, on foot or swimming)
const waterBand=(i,m=WM)=>{if(m.kind[i]!==T_WATER)return 0;const d=waterDepths(m)[i],B=WATER.bands;return d<0?5:d<B[0]?1:d<B[1]?2:d<B[2]?3:4};
// (a depth's band, levels: 0 dry, 1 ankle, 2 knee, 3 waist, 4 swum)
const depthBand=d=>{const B=WATER.bands;return !(d>0)?0:d<B[0]?1:d<B[1]?2:d<B[2]?3:4};
const walkTile=(i,m=WM)=>{const t=m.kind[i];return t!==T_MOUNT&&(t!==T_WATER||waterBand(i,m)<5)};
/* the lab's swimmers: heavy armour cannot swim, nor can one with no stamina left (engine/worldlab.js speedAt heavy, sta). Your band
   swims while fewer than half its men are in heavy armour and it has stamina (heroSwims); while your way is found (world.js heroWay)
   deep water is shut to it if not (WAY_NOSWIM: router.js findPath, wayLocal) and your step never goes into it (world.js walk) */
let WAY_NOSWIM=false;
/* the lab's walk (engine/worldlab.js speedAt, LAB.speed, LAB.run): on a slope a man goes up at up of his pace and down at down; steep
   ground steep either way (in place of the map's even SLOPE there: your band's, world.js heroGround, by where it is heading); Shift
   held, run times faster, its stamina going staRun times as fast; slopes and steep ground tire a band staSlope, staSteep times the
   march (supply.js staminaRate) */
const LAB_WALK={up:.5,down:1.15,steep:.3,run:1.6,staRun:1.8,staSlope:1.25,staSteep:1.7,cliff:.16,staCliff:3.5,climbBand:6,climbCost:7};
/* the lab's climbers: a cliff is rock no band walks, but a small one (climbBand men or fewer, its hero with the Climber node: data/tree.js athl_climb, perk 'climb') climbs it
   while it has stamina, at cliff of its pace (world.js heroGround), tiring climbing staCliff times the march (supply.js), a cliff's
   tile climbCost tiles of open ground to its way (router.js findPath, while WAY_CLIMB: world.js heroWay); its men climb with it (march.js
   MarchGround climb) */
let WAY_CLIMB=false;
function heroClimbs(){if(typeof P==='undefined'||!P||P.bsta!=null&&P.bsta<=0)return false;return partySize()<=LAB_WALK.climbBand&&P.hasPerk('climb')}
function headingMul(x,y,tx,ty){const S=WM&&WM.slope;if(!S||tx==null||ty==null)return 1;const i=Math.floor(y/TILE)*MW+Math.floor(x/TILE),c=S[i];if(c!==1&&c!==2)return 1;
  const dx=tx-x,dy=ty-y,l=Math.hypot(dx,dy);if(l<1)return 1;const hf=typeof landHeight==='function'?landHeight(WM):null;if(!hf)return 1;
  const up=hf((x+dx/l*6)*2,(y+dy/l*6)*2)>hf(x*2,y*2);return (c===2?LAB_WALK.steep:up?LAB_WALK.up:LAB_WALK.down)/SLOPE.mul[c]}
function heroSwims(){if(typeof P==='undefined'||!P)return true;if(P.bsta!=null&&P.bsta<=0)return false;let h=0,n=0;
  for(const k in P.troops||{}){const c=P.troops[k];if(!(c>0))continue;n+=c;if(ST[k]&&tagsOf(ST[k]).includes('heavy'))h+=c}return !(n&&h/n>=.5)}
const walkAt=(x,y)=>{const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return tx>=0&&ty>=0&&tx<MW&&ty<MH&&walkTile(ty*MW+tx)};
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
// speed, blended to the land's over its shoulder; a road's own tile its road's; a ford, water and the peaks by their tiles; all of it
// times the weather's there (world/weather.js Weather.speed: rain and snow slower, a blizzard or a sandstorm much slower)
function speedAt(x,y,race,extra){
  const t=terrAt(x,y),c=climAt(x,y);if(t===T_MOUNT||t===T_WATER&&!walkAt(x,y))return 0;
  const home=(race?RACES[race].home:[]).concat(extra||[]),w=Weather.speed(x,y,c,home);
  if(t===T_WATER)return WATER.speed[waterBand(Math.floor(y/TILE)*MW+Math.floor(x/TILE))]*w;// (wading, swimming: WATER)
  const b=t===T_FORD?0:RoadBand.at(x,y);if(t===T_ROAD)return RoadBand.speed(b,race)*w;
  const tm=(t===T_FOREST&&home.includes('forest'))||(t===T_HILL&&home.includes('hills'))?1:SPEEDMUL[t];
  const cm=home.includes(c)?1:CLIMMUL[c];
  const land=Math.max(.25,Math.max(.35,tm*cm)*slopeMulAt(Math.floor(y/TILE)*MW+Math.floor(x/TILE)))*(race==='human'&&c==='grass'&&t===T_OPEN?1.1:1);
  return (b?Math.max(land,land+(RoadBand.speed(b,race)-land)*RoadBand.share(b)):land)*w;
}
// (sight by the ground, times the weather's: fog, a blizzard or a sandstorm short)
function visMulAt(x,y){const t=terrAt(x,y),c=climAt(x,y),tx=Math.floor(x/TILE),ty=Math.floor(y/TILE),lv=WM&&WM.lv&&tx>=0&&ty>=0&&tx<MW&&ty<MH?WM.lv[ty*MW+tx]:0;
  return (t===T_HILL?1.3:t===T_FOREST?.7:c==='swamp'?.8:c==='desert'?1.2:1)*(1+Math.min(SLOPE.sightMax,lv*SLOPE.sight))*Weather.sight(x,y)}
const hiddenAt=(x,y)=>terrAt(x,y)===T_FOREST;
function nearWater(x,y,r){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(tAt(tx+i,ty+j)===T_WATER&&tx+i>0&&ty+j>0&&tx+i<MW-1&&ty+j<MH-1)return true;return false}
// move something stuck on water or a mountain (old saves, map changes) to the nearest open tile
function unstick(o){
  if(passable(terrAt(o.x,o.y)))return;const tx=Math.floor(o.x/TILE),ty=Math.floor(o.y/TILE);
  for(let r=1;r<20;r++)for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(passable(tAt(tx+i,ty+j))){o.x=(tx+i+.5)*TILE;o.y=(ty+j+.5)*TILE;return}
}
