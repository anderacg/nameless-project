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
// (how fast each kind of ground is walked, the world lab's (LAB.speed, the owner, 2026-11-16: "Do all that"): open 1, woods 0.85, a
// hill's ground 1 (its slope slows it: SLOPE), a road 1.1 (RoadBand: ROAD_BAND.speed), a ford knee-deep (WATER.speed[2]); by the
// climate (CLIMMUL) the lab's climates' grounds: frost's tundra and snow, the desert's sand, the swamp's marsh)
const SPEEDMUL=[1,.85,1,0,1.1,0,.6];
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
/* ledges (the owner, 2026-11-18: "If too high or too low then we cannot go down or go up"): a step from one tile to the next over a
   face of the land (march.js marchFace's: a run of steep px begun at rate px a px, on while steep by soft (MARCH_ACT's), on the line
   between their middles by the land's height, landHeight in game px) higher than up px is never climbed, deeper than down px never
   leapt; one way where only one is (a 12 px ledge leapt down, not climbed). A road's or a ford's tile to another's, and a crossing's
   tiles, always pass (the way cut down the bank). A piece of land with tiles its holdings do not reach, or that do not reach them
   back, has the ledges round those tiles opened, so no one is boxed in and every holding and place stays reached both ways. The
   line looked at every coarse px first, a face sought px by px only where two looks differ by big px or more. ledgeBits(m, holdings):
   a byte a tile, bit 1 E, 2 S, 4 W, 8 N: no step from it over that edge (battle/route.js's wall bits); kept for each map. Everyone
   walking keeps to it (world.js walk, router.js findPath, wayLocal, the way graph's portals and roads, the straight lines, the flight,
   march.js the march's ground); a climber of cliffs (heroClimbs) climbs ledges too */
const LEDGE={up:9,down:16,rate:1.5,soft:.5,coarse:4,big:3,rounds:8};
const LEDGES=new WeakMap(),LEDGE_ON={m:null,B:null};
function ledgeBits(m=WM,holds){if(LEDGE_ON.m===m&&(LEDGE_ON.B.pk||!holds))return LEDGE_ON.B;let B=LEDGES.get(m);
  if(!B){const W=m.w,H=m.h,N=W*H,K=m.kind,ht=ledgeHt(m),L=LEDGE,XT=new Uint8Array(N);
    B=new Uint8Array(N);for(const c of m.crossings)for(const i of c.tiles)XT[i]=1;const gr=i=>K[i]===T_ROAD||K[i]===T_FORD;
    const edge=(i,j,cx,cy,dx,dy,bij,bji)=>{if(!walkTile(i,m)||!walkTile(j,m)||XT[i]||XT[j]||gr(i)&&gr(j))return;let p=ht(cx,cy),big=false;
      for(let a=L.coarse;a<=TILE;a+=L.coarse){const q=ht(cx+dx*a,cy+dy*a);if(Math.abs(q-p)>=L.big){big=true;break}p=q}if(!big)return;
      const [up,dn]=ledgeFaces(ht,cx,cy,dx,dy);if(up>L.up||dn>L.down)B[i]|=bij;if(dn>L.up||up>L.down)B[j]|=bji};
    for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++){const i=ty*W+tx,cx=tx*TILE+8,cy=ty*TILE+8;if(tx+1<W)edge(i,i+1,cx,cy,1,0,1,4);if(ty+1<H)edge(i,i+W,cx,cy,0,1,2,8)}
    LEDGES.set(m,B)}
  if(holds&&!B.pk){ledgeOpen(m,B,holds);B.pk=1}LEDGE_ON.m=m;LEDGE_ON.B=B;return B}
// (the land's height at game px (x, y), as the ledges read it: landHeight in game px, never under 0)
const ledgeHt=m=>{const hf=landHeight(m),lh=WORLD_TERRAIN.lh;return(x,y)=>Math.max(0,hf(x*2+1,y*2+1))*lh};
/* a steep edge by what is built (data/world.js EDGE_PLACE): edgeStep(x0, y0, x1, y1, m) the most the land rises or falls from one
   point of a grid every step px to the next within the box (game px) and margin px round it, its heights kept for each map as they
   are asked for (a new world's afresh); edgeNear whether that is over steep px */
let EDGE_GRID=new WeakMap();onWorld(()=>{EDGE_GRID=new WeakMap()});
function edgeStep(x0,y0,x1,y1,m=WM){const E=EDGE_PLACE,s=E.step,mg=E.margin;let G=EDGE_GRID.get(m);
  if(!G){G={w:Math.ceil(m.w*TILE/s)+2,h:Math.ceil(m.h*TILE/s)+2,ht:ledgeHt(m)};G.v=new Float32Array(G.w*G.h).fill(-1);EDGE_GRID.set(m,G)}
  const V=G.v,GW=G.w,at=(i,j)=>{const k=j*GW+i;let v=V[k];if(v<0)v=V[k]=G.ht(i*s,j*s);return v};
  const i0=Math.max(0,Math.floor((x0-mg)/s)),i1=Math.min(GW-1,Math.ceil((x1+mg)/s)),j0=Math.max(0,Math.floor((y0-mg)/s)),j1=Math.min(G.h-1,Math.ceil((y1+mg)/s));let e=0;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const h=at(i,j);if(i<i1)e=Math.max(e,Math.abs(at(i+1,j)-h));if(j<j1)e=Math.max(e,Math.abs(at(i,j+1)-h))}
  return e}
const edgeNear=(x0,y0,x1,y1,m=WM)=>edgeStep(x0,y0,x1,y1,m)>EDGE_PLACE.steep;
// (the faces on the line from (cx, cy) a tile along (dx, dy), px by px: [the highest rise, the deepest fall], each a run of steep px)
const LEDGE_V=new Float32Array(TILE+1);
function ledgeFaces(ht,cx,cy,dx,dy){const v=LEDGE_V,J=LEDGE;for(let a=0;a<=TILE;a++)v[a]=ht(cx+dx*a,cy+dy*a);let up=0,dn=0;
  for(let a=1;a<=TILE;a++){const d=v[a]-v[a-1];if(Math.abs(d)<J.rate)continue;const sg=Math.sign(d);let b=a;while(b<TILE&&Math.sign(v[b+1]-v[b])===sg&&Math.abs(v[b+1]-v[b])>=J.soft)b++;const h=v[b]-v[a-1];if(h>up)up=h;if(-h>dn)dn=-h;a=b}
  return[up,dn]}
// (the faces met stepping from tile i to its neighbour j (4 ways), [up, down] px: what the ledges are made of, the tests' look)
function ledgeHeights(i,j,m=WM){const W=m.w,x=i%W,y=(i-x)/W,d=j-i;return ledgeFaces(ledgeHt(m),x*TILE+8,y*TILE+8,d===1?1:d===-1?-1:0,d===W?1:d===-W?-1:0)}
// (the pockets opened: from the first holding of each piece of land, the tiles it reaches and that reach it back over the ledges (4
// ways, a ferry's ends joined); round every other tile of its piece, the ledges opened both ways; again till none is left)
function ledgeOpen(m,B,holds){const W=m.w,H=m.h,N=W*H,FE=new Map(),D=[[1,0,1,4],[0,1,2,8],[-1,0,4,1],[0,-1,8,2]];
  for(const c of m.crossings)if(c.kind==='ferry'){FE.set(c.i,(FE.get(c.i)||[]).concat(c.j));FE.set(c.j,(FE.get(c.j)||[]).concat(c.i))}
  const flood=(s,back,blocks,seen)=>{const q=[s];seen[s]=1;for(let h=0;h<q.length;h++){const i=q[h],x=i%W,y=(i-x)/W;
    for(const [dx,dy,bo,bi] of D){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(seen[j]||!walkTile(j,m)||blocks&&(back?B[j]&bi:B[i]&bo))continue;seen[j]=1;q.push(j)}
    for(const j of FE.get(i)||[])if(!seen[j]){seen[j]=1;q.push(j)}}return q};
  const done=new Uint8Array(N);
  for(const h of holds){let s=h.ty*W+h.tx;if(!walkTile(s,m))for(const [dx,dy] of D){const j=s+dy*W+dx;if(walkTile(j,m)){s=j;break}}if(!walkTile(s,m)||done[s])continue;
    const piece=flood(s,false,false,done);
    for(let r=0;r<LEDGE.rounds;r++){const f=new Uint8Array(N),b=new Uint8Array(N);flood(s,false,true,f);flood(s,true,true,b);let n=0;
      for(const i of piece){if(f[i]&&b[i])continue;n++;const x=i%W,y=(i-x)/W;B[i]=0;for(const [dx,dy,,bi] of D){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H)B[ny*W+nx]&=~bi}}
      if(!n)break}}}
// (may one step from tile i to its neighbour j: no ledge over their edge, or both a road's or a ford's tiles as they are now (an
// estate's track laid since); a diagonal step only with all four edges round its corner open, as route.js's; anything farther, or the
// same tile, passes. ledgePass: a move from (x0, y0) to (x1, y1), px)
function ledgeOk(i,j,m=WM){if(i===j)return true;const W=m.w,B=ledgeBits(m),ix=i%W,jx=j%W,dx=jx-ix,dy=(j-jx)/W-(i-ix)/W;if(dx>1||dx<-1||dy>1||dy<-1)return true;
  {const Li=deckLane(i,m),Lj=deckLane(j,m);if(Li&&Lj?Li[5]!==Lj[5]:Li?j!==Li[5]&&j!==Li[6]:Lj&&i!==Lj[5]&&i!==Lj[6])return false}// (onto a bridge's deck and off it only at its two ends, never over its rails: router.js deckLane)
 
  const K=m.kind,g=a=>K[a]===T_ROAD||K[a]===T_FORD,e=(a,b)=>{const d=b-a;return !(B[a]&(d===1?1:d===W?2:d===-1?4:8))||g(a)&&g(b)};if(!dx||!dy)return e(i,j);const a=i+dx,b=i+dy*W;return e(i,a)&&e(a,j)&&e(i,b)&&e(b,j)}
const ledgePass=(x0,y0,x1,y1)=>{const tx=Math.floor(x0/TILE),ty=Math.floor(y0/TILE),ux=Math.floor(x1/TILE),uy=Math.floor(y1/TILE);
  return tx===ux&&ty===uy||tx<0||ty<0||ux<0||uy<0||tx>=MW||ux>=MW||ty>=MH||uy>=MH||ledgeOk(ty*MW+tx,uy*MW+ux)};
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
   ground steep up and steepDown down, a cliff cliff up and cliffDown down (the owner, 2026-11-17: "descending and ascending to the
   highground character speed should be different"; in place of the map's even SLOPE there: your band's, world.js heroGround, by where
   it is heading); Shift
   held, run times faster, its stamina going staRun times as fast; slopes and steep ground tire a band staSlope, staSteep times the
   march (supply.js staminaRate) */
const LAB_WALK={up:.5,down:1.15,steep:.3,steepDown:.55,run:1.6,staRun:1.8,staSlope:1.25,staSteep:1.7,cliff:.16,cliffDown:.24,staCliff:3.5,climbBand:6,climbCost:7};
/* the lab's climbers: a cliff is rock no band walks, but a small one (climbBand men or fewer, its hero with the Climber node: data/tree.js athl_climb, perk 'climb') climbs it
   while it has stamina, at cliff of its pace (world.js heroGround), tiring climbing staCliff times the march (supply.js), a cliff's
   tile climbCost tiles of open ground to its way (router.js findPath, while WAY_CLIMB: world.js heroWay); its men climb with it (march.js
   MarchGround climb) */
let WAY_CLIMB=false;
function heroClimbs(){if(typeof P==='undefined'||!P||P.bsta!=null&&P.bsta<=0)return false;return partySize()<=LAB_WALK.climbBand&&P.hasPerk('climb')}
// (whether heading from (x, y) toward (tx, ty) goes uphill: true, false, or null (no heading, no land's height))
function headingUp(x,y,tx,ty){if(tx==null||ty==null)return null;const dx=tx-x,dy=ty-y,l=Math.hypot(dx,dy);if(l<1)return null;const hf=typeof landHeight==='function'?landHeight(WM):null;if(!hf)return null;
  return hf((x+dx/l*6)*2,(y+dy/l*6)*2)>hf(x*2,y*2)}
function headingMul(x,y,tx,ty){const S=WM&&WM.slope;if(!S||tx==null||ty==null)return 1;const i=Math.floor(y/TILE)*MW+Math.floor(x/TILE),c=S[i];if(c!==1&&c!==2)return 1;
  const up=headingUp(x,y,tx,ty);if(up==null)return 1;return (c===2?(up?LAB_WALK.steep:LAB_WALK.steepDown):up?LAB_WALK.up:LAB_WALK.down)/SLOPE.mul[c]}
function heroSwims(){if(typeof P==='undefined'||!P)return true;if(P.bsta!=null&&P.bsta<=0)return false;let h=0,n=0;
  for(const k in P.troops||{}){const c=P.troops[k];if(!(c>0))continue;n+=c;if(ST[k]&&tagsOf(ST[k]).includes('heavy'))h+=c}return !(n&&h/n>=.5)}
const walkAt=(x,y)=>{const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return tx>=0&&ty>=0&&tx<MW&&ty<MH&&walkTile(ty*MW+tx)};
const CLIMMUL={grass:1,frost:.85,desert:.88,swamp:.75};
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
