'use strict';
/* ---------- placed structures: every holding is a set of buildings, each standing on its own tiles of the grid ---------- */
// t.lots: [{id, k, type, x, y, n, lv, seed, st, plots}]
//   k: what it is for: 'centre' (keep, citadel or hall: its walls are its fortification, wallOf), 'house', an estate key (farm...)
//   (x, y): its top-left tile; it covers n x n tiles (1, 2 or 4); st: 'built' | 'building' | 'ruined'; plots: the field tiles it keeps (farms...)
// OCC holds for every tile the id of the lot standing on it, or keeping it as a field; 0 when free. Two lots never share a tile.
// A holding is laid out from its centre: houses round it (enough for its people), the buildings of its estates, then its
// fields, herds, mines and docks outside (clear of the town). Its walls are the centre's own: Fortify upgrades it. Every layout is the
// holding's own: the seed varies house kinds, places and orientation.
let OCC=null,lotN=1;const LOT={},EST_TRACKS=new WeakMap();// (EST_TRACKS: each map's estates' tracks, below)
// a world goes in (useWorld): its grid as the world first stood (worldKeep: the holdings' lots are back by then), or empty; the
// estates' tracks the last layout laid on it taken up (tracksUp)
onWorld(m=>{tracksUp(m);const F=m.first;OCC=F?F.occ.slice():new Int32Array(MW*MH);for(const k in LOT)delete LOT[k];lotN=F?F.lotN:1;if(F)for(const t of TOWNS)for(const l of t.lots||[])LOT[l.id]=l});
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
const centreBox=t=>{const n=centreN(t);return{x:t.tx-(n>>1),y:t.ty-n+1,n}};
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
function occRebuild(){roadsToGates();tracksUp(WM);ROAD_PAINT=null;OCC.fill(0);for(const k in LOT)delete LOT[k];for(const t of TOWNS)if(t.lots){t.lots=t.lots.filter(l=>l.k!=='wall');const c=t.lots.find(l=>l.k==='centre');if(!c||t.tx<c.x||t.tx>=c.x+c.n||t.ty<c.y||t.ty>=c.y+c.n||c.type!==typeFor(t,'centre',Math.random))t.lots=null}// (older layouts are laid out again)
  for(const t of TOWNS)for(const l of t.lots||[]){if(l.st==='ruin')l.st='ruined';// (older saves)
    LOT[l.id]=l;l.town=t.name;occMark(l,l.id);lotN=Math.max(lotN,l.id+1)}occReserve();for(const t of TOWNS)if(t.lots)Layout.of(t).tracks(true);tracksDone()}
const lotOf=(x,y)=>{const id=occAt(x,y);return id>0?LOT[id]:null};
/* the roads as painted (the owner's play-test 2: "some buildings still on the road"): the tiles within LOT_ROAD px of a road's
   middle as the art draws it, a byte a tile. A road follows its smoothed line, not its tiles (worldart.js artGenPlan: the points
   its bands are kept clear round).
   No lot or field stands on one. Made when first asked (the roads led to the gates by then), again for a new world */
const LOT_ROAD=2;
let ROAD_PAINT=null;onWorld(()=>{ROAD_PAINT=null});
function roadPaint(){
  if(ROAD_PAINT)return ROAD_PAINT;const B=ROAD_PAINT=new Uint8Array(MW*MH),r=LOT_ROAD;
  // (a point of the road's middle: the middle of a square the art keeps clear round it)
  const at=(x,y,w,h)=>{const cx=x+(w>>1),cy=y+(h>>1);for(let ty=Math.max(0,Math.floor((cy-r)/TILE));ty<=Math.min(MH-1,Math.floor((cy+r)/TILE));ty++)for(let tx=Math.max(0,Math.floor((cx-r)/TILE));tx<=Math.min(MW-1,Math.floor((cx+r)/TILE));tx++)B[ty*MW+tx]=1};
  if(typeof artRoadMarks==='function')artRoadMarks(at);
  for(let i=0;i<MW*MH;i++)if(tiles[i]===T_ROAD)B[i]=1;
  return B}

/* what stands for each part of a holding (the world-map building redesign, stage 3: engine/buildmodels.js's models at the owner's
   scale, PX.MODEL_SIZES: 32 px the smallest building, 64 the big ones, the clusters and the centres, 128 a city's citadel). The
   culture chooses the architecture: the realm the holding was founded under (HOME, which a capture leaves as it was: FAC_CULTURE),
   else its first people's (PX.CULTURE_OF); its owner flies the banners. Its centre by its tier (PX.MODEL_CENTRES: PX.centreModel),
   its houses by its culture and size (HOUSES: a village's and a castle's, a town's and a city's), its estates' buildings
   (ESTATE_LOT: a type or a cluster kind; the culture's own in place of a type, look.swap: the Clans' forge) */
const FAC_CULTURE={vale:'vale',karn:'karn',sylvan:'sylvan',horde:'ashgor',salt:'league'};
const holdingCulture=t=>FAC_CULTURE[HOME[t.name]]||PX.CULTURE_OF[t.races[0]]||'vale';
const LOT_TIER={village:'village',town:'town',city:'city',castle:'castle'};
const HOUSES={vale:{village:['cottage','cottage','townhouse'],town:['townhouse','townhouse','cottage']},
  league:{village:['cottage','townhouse','cottage'],town:['townhouse','townhouse','townhouse']},
  karn:{village:['stonehall','cottage','cottage'],town:['stonehall','townhouse','stonehall']},
  sylvan:{village:['treehouse','cottage','elfhall'],town:['elfhall','treehouse','elfhall']},
  ashgor:{village:['yurt','yurt','hidehall'],town:['hidehall','yurt','hidehall']}};
// (an estate's: the first that finds room, the farm's farmhouse where its farmstead does not)
const ESTATE_LOT={farm:['farmstead','cottage'],pasture:['barn'],lumber:['lumbershed'],mine:['minehead'],quarry:['crane'],port:['fisherhut'],workshop:['warehouse'],smithy:['smithy'],brewery:['brewery'],granary:['granary'],market:['market']};
// how many people a household is (a house holds 2-4: its model's homes, lotHouseholds; what one house of one tile held before the
// owner's scale), and each centre's own room
const HOUSING={household:10,centre:{village:30,keep:40,citadel:60}};
// the estates whose buildings stand inside a holding (and its walls); the rest work the land outside
const INNER=['workshop','smithy','brewery','granary','market'];
// a lot's tiles a side: its type's cell or its cluster's (PX.MODEL_SIZES); a city's citadel is a capital's, 128 (buildmodels.js cellOf)
const lotSize=type=>{const S=PX.MODEL_SIZES,c=S.types[type]?S.types[type].cell:S.clusters[type];if(!c)throw new Error('no building '+type);return c/TILE};
const centreOf=t=>PX.MODEL_CENTRES[LOT_TIER[t.kind]];
const centreN=t=>{const c=centreOf(t);return c.capital?128/TILE:lotSize(c.type||c.kind)};
// who built it: mostly the holding's first people, now and then its second
const lotPeople=(t,l)=>t.races.length>1&&l.seed%4===0?t.races[1]:t.races[0];
const typeFor=(t,k,R)=>{const cu=holdingCulture(t);if(k==='centre'){const c=centreOf(t);return c.type||c.kind}
  if(k==='house'){const H=HOUSES[cu]||HOUSES.vale,h=H[t.kind==='town'||t.kind==='city'?'town':'village'];return h[Math.floor(R()*h.length)]}
  return estateTypes(t,k)[0]};
const estateTypes=(t,k)=>{const L=PX.MODEL_LOOK[holdingCulture(t)];return ESTATE_LOT[k].map(e=>L&&L.swap[e]||e)};
/* the model a lot is drawn from (engine/buildmodels.js): its centre's by its holding's tier (with its walls, wallOf), a type's
   (PX.buildingModel) or a cluster's (PX.clusterModel); its culture, people, seed, facing (l.yaw), land (lotEnv) and level (an
   estate's). Without snow: the drawing adds it (structures.js lotModel) */
function lotSpec(t,l){const o={culture:holdingCulture(t),people:lotPeople(t,l),seed:l.seed,yaw:l.k==='centre'?0:l.yaw!=null?l.yaw:(l.yaw=lotYaw(t,l)),env:lotEnv(t,l)};
  if(l.k==='centre')return Object.assign(o,{tier:LOT_TIER[t.kind],fort:wallOf(t)});
  if(ESTATES[l.k])o.lv=l.lv;return Object.assign(o,PX.MODEL_SIZES.types[l.type]?{type:l.type}:{kind:l.type})}
// the households a house holds: its model's homes (PX.MODEL_SIZES dwellings: a cottage 2, a townhouse 3, a stone hall 4), kept on it
function lotHouseholds(t,l){if(l._hh!=null)return l._hh;const s=lotSpec(t,l),q=s.kind?PX.clusterModelSpec(s):PX.buildingModelSpec(s);
  return l._hh=q.dwellings.filter(d=>d.role==='home').reduce((a,d)=>a+d.dwellings,0)}
/* the land a lot stands in, for its model's make (env): its climate's (the desert's adobe, the swamp's mud and stilts, the frost's),
   else its holding's landscape (LAND_ENV; the Vale builds for each: the forest march, the highland, the coast): on the shore (open
   water, not a river, within shore tiles) or a port, coast; hills and mountains a hill share of the tiles within r, or its height
   past high (WM.elev), highland; woods a wood share, forest; else the grass. The land as it lay before the estates' tracks (their
   tiles as they were: EST_TRACKS), so a loaded game, its tracks laid again, reads the same. Kept on the holding (t._env) */
const LAND_ENV={r:6,shore:2,hill:.22,high:170,wood:.3};
// (the tiles the estates' tracks were laid over, and what each was (EST_TRACKS): i -> its kind before; and a tile's kind as it was:
// what a lot's land, its facing and a pasture's herd are reckoned by, the same whatever was laid after)
const trackWas=()=>{const was=new Map();for(const q of EST_TRACKS.get(WM)||[])q.laid.forEach((i,j)=>{if(!was.has(i))was.set(i,q.was[j])});return was};
const kindWas=(was,x,y)=>x>=0&&x<MW&&was.has(y*MW+x)?was.get(y*MW+x):tAt(x,y);
function holdingEnv(t){if(t._env)return t._env;const E=LAND_ENV,r=E.r,was=trackWas();let n=0,hill=0,wood=0,sea=false;
  for(let y=t.ty-r;y<=t.ty+r;y++)for(let x=t.tx-r;x<=t.tx+r;x++){if(x<0||y<0||x>=MW||y>=MH)continue;const k=was.has(y*MW+x)?was.get(y*MW+x):tiles[y*MW+x];n++;if(k===T_HILL||k===T_MOUNT)hill++;else if(k===T_FOREST)wood++;
    else if(k===T_WATER&&!(WM.river[y*MW+x]&3)&&Math.abs(x-t.tx)<=E.shore+1&&Math.abs(y-t.ty)<=E.shore+1)sea=true}
  return t._env=sea||t.style==='port'?'coast':hill>=n*E.hill||WM.elev[t.ty*MW+t.tx]>=E.high?'highland':wood>=n*E.wood?'forest':'grass'}
const lotEnv=(t,l)=>{const c=climAt((l.x+l.n/2)*TILE,(l.y+l.n/2)*TILE);return c==='grass'?holdingEnv(t):c};
/* which way a lot faces (the owner's: each to its street; PX.MODEL_YAWS: S 0, W 2, N 4, E 6): its nearest road or track (a road
   tile) within LOT_FACE tiles of it, else its holding's gate; a port its pier's water; the centre straight on. An outer estate
   turns to the track laid to it (estTrack). A mine or a quarry turns its back to the rock instead (rockYaw). Kept on the lot
   (l.yaw: saved) */
const LOT_FACE=6,LOT_ROCK={r:3,pull:3};
const faceTo=(l,px,py)=>{const dx=px-(l.x+l.n/2),dy=py-(l.y+l.n/2);return Math.abs(dx)>Math.abs(dy)?(dx>0?6:2):dy<0?4:0};
// (a mine's or a quarry's back to the rock (ESTATE_LAND face): its way away from the hills and peaks within LOT_ROCK.r tiles of it,
// their pull summed (tiles), as the land lay before the estates' tracks; null: not such a work, or no side pulls LOT_ROCK.pull (rock
// all round, or none): it faces its way as the others do)
function rockYaw(l){
  if(!(ESTATE_LAND[l.k]&&ESTATE_LAND[l.k].face))return null;const n=l.n,cx=l.x+n/2,cy=l.y+n/2,r=LOT_ROCK.r,was=trackWas();let ax=0,ay=0;
  for(let y=l.y-r;y<l.y+n+r;y++)for(let x=l.x-r;x<l.x+n+r;x++){const g=kindWas(was,x,y);if(g===T_HILL||g===T_MOUNT){ax+=x+.5-cx;ay+=y+.5-cy}}
  return Math.hypot(ax,ay)>=LOT_ROCK.pull?faceTo(l,cx-ax,cy-ay):null}
function lotYaw(t,l){if(l.k==='centre')return 0;const n=l.n,cx=l.x+n/2,cy=l.y+n/2;
  if(l.k==='port'){const w=pierWater(l.x,l.y,n);if(w>=0)return faceTo(l,w%MW+.5,(w-w%MW)/MW+.5)}
  const ry=rockYaw(l);if(ry!=null)return ry;
  let best=null,bd=1e9;for(let y=l.y-LOT_FACE;y<l.y+n+LOT_FACE;y++)for(let x=l.x-LOT_FACE;x<l.x+n+LOT_FACE;x++){if(tAt(x,y)!==T_ROAD)continue;const d=Math.hypot(x+.5-cx,y+.5-cy);if(d<bd){bd=d;best=[x+.5,y+.5]}}
  return best?faceTo(l,best[0],best[1]):faceTo(l,t.tx+.5,t.ty+1.5)}

/* where a lot may stand */
// the ground each kind needs under it: open ground (or hills) for most; forest for the woodcutter; rock for mines and quarries (most
// of its tiles on a hill or beside a mountain, data/economy.js ESTATE_LAND: landFits; the rest open or wooded); the shore for a
// port. Never water, mountains or roads, never on another lot, never beyond its holding's land. What its land must hold round it:
// landFits
const lotGround={
  open:(x,y)=>{const g=tAt(x,y);return g===T_OPEN||g===T_HILL},
  forest:(x,y)=>{const g=tAt(x,y);return g===T_FOREST||g===T_OPEN},
  rock:(x,y)=>{const g=tAt(x,y);return g===T_HILL||g===T_OPEN||g===T_FOREST},
  shore:(x,y)=>tAt(x,y)===T_OPEN||tAt(x,y)===T_FOREST
};
/* the water a port estate's pier runs out over (the owner's play-test, 2026-10-22: "port should spawn only at a huge river; cannot
   spawn by a small pond, small lake or oasis"): from its building's front tile, the first water beside it as structures.js pierOf
   looks (south, east, west, north), the tile, or -1; it must be a fishing pier's water (worldplace.js portWater: a lake, a river 2
   wide or more; never a pond, an oasis or a stream), and a port town's harbour water (the sea, an inland sea or a big lake, a
   navigable or great river). A building of n x n tiles at (x, y) (n given): from each of its tiles round its edge, its front
   middle first (pierSpot: {tx, ty, w, dir}, the tile, its water and which way it lies) */
function pierSpot(x,y,n){const T=[[x+(n>>1),y+n-1]];for(let j=n-1;j>=0;j--)for(let i=0;i<n;i++)if(i!==n>>1||j!==n-1)T.push([x+i,y+j]);
  for(const [tx,ty] of T)for(const [a,b,dir] of [[0,1,'s'],[1,0,'e'],[-1,0,'w'],[0,-1,'n']]){const X=tx+a,Y=ty+b;if(X>=x&&X<x+n&&Y>=y&&Y<y+n)continue;if(tAt(X,Y)===T_WATER)return{tx,ty,w:Y*MW+X,dir}}
  return null}
const pierWater=(x,y,n)=>{const s=pierSpot(x,y,n||1);return s?s.w:-1};
function pierOk(t,x,y,n){const w=pierWater(x,y,n);return w>=0&&portWater(WM)[w]>=(t.style==='port'?2:1)}
/* no lot stands on a brook (worldgen.js genBrook) nor LOT_BROOK tiles from one, no field on one (the owner's play-test, 2026-10-22:
   "small streams should not cross a holding or an estate"; the generator cut those through a holding's ring: genHoldBrooks) */
const LOT_BROOK=1;
function brookAt(x,y){return x>=0&&y>=0&&x<MW&&y<MH&&genBrook(WM,y*MW+x)}
const nearT=(x,y,type,r)=>{for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(tAt(x+i,y+j)===type)return true;return false};
const groundOf=k=>ESTATES[k].ground||'open';
// (the wooded tiles in and round an n x n lot at (x, y); is a tile at the rock: a hill, or beside a mountain)
const woods=(x,y,n)=>{let f=0;for(let j=-1;j<=n;j++)for(let i=-1;i<=n;i++)if(tAt(x+i,y+j)===T_FOREST)f++;return f};
const atRock=(x,y)=>tAt(x,y)===T_HILL||nearT(x,y,T_MOUNT,1);
// (fertile ground, FERTILE: anywhere but the desert's dry sand; there, moist enough, or by water: an oasis, a river)
const fertileAt=(x,y)=>{const i=y*MW+x;return CLIMS[climate[i]]!=='desert'||WM.moist[i]>=FERTILE.moist||nearT(x,y,T_WATER,FERTILE.water)};
// (an ore vein of holding t's land (resources.js resOf: its own, or within RES_RANGE of it) within r tiles of an n x n lot at (x, y))
function oreNear(t,x,y,n,r){
  for(let j=y-r;j<y+n+r;j++)for(let i=x-r;i<x+n+r;i++){const d=i>=0&&j>=0&&i<MW&&j<MH&&DEP_AT[j*MW+i]>=0&&DEPOSITS[DEP_AT[j*MW+i]];
    if(d&&d.kind==='ore'&&(d.home===t.name||Math.hypot(d.tx-t.tx,d.ty-t.ty)<=RES_RANGE))return true}
  return false}
/* what a place of work needs of its land, its building of n x n tiles at (x, y) (data/economy.js ESTATE_LAND): fertile tiles, woods
   in and round it, its tiles at the rock, its holding's ore near, water for a pier */
function landFits(t,x,y,n,k){
  const L=ESTATE_LAND[k];if(!L)return true;let rock=0;
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){if(L.fertile&&!fertileAt(x+i,y+j))return false;if(atRock(x+i,y+j))rock++}
  return !(L.rock&&rock<L.rock*n*n||L.wood&&woods(x,y,n)<L.wood*(n+2)*(n+2)||L.ore&&!oreNear(t,x,y,n,L.ore)||L.pier&&!pierOk(t,x,y,n))}
/* where a holding's people walk (the owner's play-test 3: "estates spawn on the opposite side of the holdings, separated by a
   river; workers cannot cross"): the ground walked to from its gate within LOT_WALK tiles (worldplace.js placeWalk: 4 ways over
   walkable ground, fords and bridges, and ferries), and of it its own bank (no crossing taken). Every lot and field of it stands on
   ground walked to (lotWalks: lotSpot, placeOk; fieldsFor), a building's door not far round (its steps from the gate at most
   PLACE_HOLD.round[0] times the straight way's, 4 ways, and round[1], and twice the straight line's and 2: the owner's, the
   workers' walk never much longer for a river), never on a crossing's end nor beside it (the way onto it: xEnds), its own bank first (lotSpot: across a crossing a spot counts LOT_BANK tiles
   farther). Kept by holding (and the crossings' ends), made afresh for a new world */
const LOT_WALK=28,LOT_BANK=4,LOT_SEA=40;
// (a lot on the sea's shore: beside water of the sea round the world's edge, ships.js seaIds; a port town's pier keeps to it, LOT_SEA
// dearer elsewhere, so its ships sail the sea and not a pond's water that happens to lie as near)
const seaShore=(x,y,n)=>{const id=waterIds(),S=seaIds();for(let j=0;j<n;j++)for(let i=0;i<n;i++)for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+i+a,Y=y+j+b;if(X>=0&&Y>=0&&X<MW&&Y<MH&&S.has(id[Y*MW+X]))return true}return false};
let WALKS=new WeakMap(),XENDS=null;onWorld(()=>{WALKS=new WeakMap();XENDS=null});
const xEnds=()=>{if(XENDS)return XENDS;XENDS=new Set();for(const c of WM.crossings)for(const i of [c.i,c.j,...c.tiles]){const x=i%MW,y=(i-x)/MW;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)XENDS.add((y+b)*MW+x+a)}return XENDS};
function lotWalk(t){
  let w=WALKS.get(t);if(w)return w;const g=(t.ty+1)*MW+t.tx,s=passable(tiles[g])?g:t.ty*MW+t.tx;
  WALKS.set(t,w={all:placeWalk(WM,s,LOT_WALK),own:placeWalk(WM,s,LOT_WALK,true)});return w}
const walkTo=(t,x,y)=>placeWalkAt(lotWalk(t).all,x,y)&&!xEnds().has(y*MW+x);
const ownBank=(t,x,y)=>placeWalkAt(lotWalk(t).own,x,y);
function lotWalks(t,x,y,n){
  for(let j=0;j<n;j++)for(let i=0;i<n;i++)if(!walkTo(t,x+i,y+j))return false;
  const w=lotWalk(t).all,dx=x+(n>>1)-w.x0-LOT_WALK,dy=y+n-1-w.y0-LOT_WALK;
  const d=placeWalkSteps(w,x+(n>>1),y+n-1);return d<=PLACE_HOLD.round[0]*(Math.abs(dx)+Math.abs(dy))+PLACE_HOLD.round[1]&&d<=2*Math.hypot(dx,dy)+2}
// may an n x n lot stand at (x, y) for holding t? rule: the ground under it (lotGround), or a place of work's key (its ground, and
// what its land holds: landFits); gap: keep a free tile between it and other buildings
function lotFits(t,x,y,n,rule,gap){
  const E=ESTATES[rule],ti=TOWNS.indexOf(t),okg=lotGround[E?groundOf(rule):rule]||lotGround.open,RB=roadPaint();
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const X=x+i,Y=y+j;if(X<1||Y<1||X>=MW-1||Y>=MH-1||OCC[Y*MW+X]||RB[Y*MW+X]||!okg(X,Y))return false;
    const L=LAND[Y*MW+X];if(L>=0&&L!==ti)return false}
  // a free tile between it and any other building or place of work (the town's own, gap 'row', its houses and the workshops,
  // smithies, breweries, granaries and markets among them, may stand side by side in its streets; never against the centre)
  if(gap)for(let j=-1;j<=n;j++)for(let i=-1;i<=n;i++){if(i>=0&&i<n&&j>=0&&j<n)continue;const id=occAt(x+i,y+j),o=id>0&&LOT[id];if(o&&!(gap==='row'&&(o.k==='house'||INNER.includes(o.k)))&&!(o.plots||[]).some(p=>p[0]===x+i&&p[1]===y+j))return false}
  // a house cleared in the woods: two wooded tiles in and round it; a place of work: what its land holds (landFits)
  if(rule==='forest'&&woods(x,y,n)<2||E&&!landFits(t,x,y,n,rule))return false;
  for(let j=-LOT_BROOK;j<n+LOT_BROOK;j++)for(let i=-LOT_BROOK;i<n+LOT_BROOK;i++)if(brookAt(x+i,y+j))return false;
  return true;
}
// the best free place for an n x n lot between rmin and rmax tiles of the middle of the holding's centre (a 64 or 128 px
// centre's: the town rings it, centreMid), or of its own tile (o.gate: an outer work, its workers' way from the gate): near, by a
// little chance, and
// (if box is given) outside it (outer works keep clear of the walls) or inside it. An outer work (an estate from 3 tiles
// out) with no place within rmax looks on out to LOT_FAR[0] tiles, its door at most LOT_FAR[1] steps from the gate
// (4 ways: its workers home on time; the owner's play-test 4: Redspire's lumber camp, its woods past 12 tiles along its own bank)
const LOT_FAR=[18,22];
// (the middle of a holding's centre, in tiles as a lot's middle is reckoned: x + n/2 - .5)
const centreMid=t=>{const b=centreBox(t);return[b.x+b.n/2-.5,b.y+b.n/2-.5]};
function lotSpot(t,n,rule,rmin,rmax,R,o){
  o=o||{};let best=null,bs=1e9;const [cx,cy]=o.gate?[t.tx,t.ty-1]:centreMid(t);
  for(let y=Math.floor(cy-rmax);y<=Math.ceil(cy+rmax);y++)for(let x=Math.floor(cx-rmax);x<=Math.ceil(cx+rmax);x++){const mx=x+n/2-.5,my=y+n/2-.5,d=Math.hypot(mx-cx,my-cy);if(d<rmin||d>rmax)continue;
    if(o.outside&&x+n>o.outside.x0&&x<=o.outside.x1&&y+n>o.outside.y0&&y<=o.outside.y1)continue;
    if(!lotFits(t,x,y,n,rule,o.gap===undefined?true:o.gap))continue;
    if(o.estate&&nearBandits(x+n/2-.5,y+n/2-.5,BANDIT_GAP+n/2+(o.fields?3:0)))continue;// (its fields reach 3 tiles out)
    // (its chance drawn before the walk is asked of it: a layout with every spot walked to stays as it was)
    let s=d+R()*(o.jit||1.6);if(!lotWalks(t,x,y,n)||o.steps&&placeWalkSteps(lotWalk(t).all,x+(n>>1),y+n-1)>o.steps)continue;if(!ownBank(t,x+(n>>1),y+(n>>1)))s+=LOT_BANK;if(o.sea&&!seaShore(x,y,n))s+=LOT_SEA;
    // o.fields: an estate that works fields: only where its first level's fields fit, and the more room the better
    if(o.fields){const m=fieldsFor(t,{x,y,n},o.fields).length;if(m<PLOTS_AT[o.fields](1))continue;s+=(PLOTS[o.fields]-m)*1.2}
    if(s<bs){bs=s;best=[x,y]}}
  if(!best&&o.estate&&rmin>=3&&rmax<LOT_FAR[0])return lotSpot(t,n,rule,rmin,LOT_FAR[0],R,{...o,steps:LOT_FAR[1]});
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
    t._can=null;t._spots=null;l.id=l.id||lotN++;lotN=Math.max(lotN,l.id+1);(t.lots=t.lots||[]).push(l);LOT[l.id]=l;l.town=t.name;occMark(l,l.id);if(l.yaw==null)l.yaw=lotYaw(t,l);relot(l);
    return l}
  drop(l){
    const t=this.t;
    t._can=null;t._spots=null;occMark(l,0);t.lots=t.lots.filter(o=>o!==l);delete LOT[l.id];relot(l)}
  // the lot of a part (an estate's key, 'centre')
  at(k){return this.list.find(l=>l.k===k)}
  centre(){return this.at('centre')}
  // the people its built houses and centre give room for (a house's households, HOUSING); full: its people fill them (it grows no
  // more and sends people away)
  housing(){return this.list.reduce((a,l)=>a+(l.st!=='built'?0:l.k==='house'?lotHouseholds(this.t,l)*HOUSING.household:l.k==='centre'?HOUSING.centre[l.type]||0:0),0)}
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
    if(t.lots)t.lots.slice().forEach(l=>this.drop(l));t.lots=[];landFresh();occReserve();this.laying=true;
    const R=seeded(t.seed*977+13),n0=centreN(t),cx=t.tx-(n0>>1),cy=t.ty-n0+1;
    // the centre stands on the holding's own tile, its gate on its front row where the roads end: parties arrive there and set out
    this.add({k:'centre',type:typeFor(t,'centre',R),x:cx,y:cy,n:n0,lv:1,seed:t.seed*31+7,st:'built'});
    // a port town's harbour before its houses (they would take the shore its people walk to: a League port's docks on its own sea)
    if(t.style==='port'&&bldLv(t,'port')&&!this.estateLot('port'))t.bld.port=0;
    // the buildings of its inner estates by the centre (a market or a brewery's yard a 64 px cell: before the houses take the room)
    for(const k of INNER)if(bldLv(t,k)&&!this.estateLot(k,R))t.bld[k]=0;// no room: the holding has no such estate
    // houses round them: enough for its people (the centre houses some), a few to spare; then, one still short of room for them clears
    // plots in the woods (a village deep in them, its clearing crossed by its roads)
    const pop=t.pop||t.T.pop0;let room=this.housing(),tries=0;
    for(const [g,want] of [['open',pop*1.1],['forest',pop]])for(tries=0;room<want&&tries++<t.T.tries;){const type=typeFor(t,'house',R),n=lotSize(type),p=lotSpot(t,n,g,1,t.T.ring,R,{gap:'row',jit:.8});if(!p)continue;this.add({k:'house',type,x:p[0],y:p[1],n,lv:1,seed:Math.floor(R()*1e6),st:'built'});room=this.housing()}
    // then the works outside
    for(const k of Object.keys(ESTATES))if(!INNER.includes(k)&&bldLv(t,k)&&!this.estateLot(k,R))t.bld[k]=0;
    // and the tracks to them
    this.laying=false;this.tracks();t._spots=null}
  // the tracks to its outer estates no way comes near, the nearest its gate first (estTrack); the last
  // holding's done (a new world's holdings are laid out in TOWNS' order), the graph and the land reckoned with them (tracksDone).
  // more: others are to come (a save's lots put back: occRebuild)
  tracks(more){
    const t=this.t,d=l=>Math.abs(l.x-t.tx)+Math.abs(l.y-t.ty);
    for(const l of this.list.filter(l=>ESTATES[l.k]&&!INNER.includes(l.k)).sort((a,b)=>d(a)-d(b)||a.id-b.id))estTrack(t,l);
    if(!more&&t===TOWNS[TOWNS.length-1])tracksDone()}
  // the box round its inner lots: the town, which fields and outer works keep clear of
  innerBox(){
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for(const l of this.list)if(l.k==='centre'||l.k==='house'||INNER.includes(l.k)){x0=Math.min(x0,l.x);y0=Math.min(y0,l.y);x1=Math.max(x1,l.x+l.n-1);y1=Math.max(y1,l.y+l.n-1)}
    return x1<x0?null:{x0,y0,x1,y1}}
  // the town and a lane round it: fields and outer works keep clear of it
  wallBox(){
    const b=this.innerBox();
    return b&&{x0:b.x0-2,y0:b.y0-2,x1:b.x1+2,y1:b.y1+2}}
  // the best free spot for an estate's building of n x n tiles (lotSpot): an inner one by the centre (near: within 6 tiles first),
  // an outer one beyond the walls on land that suits it (lotFits by its key: landFits), not far round, where its fields have room,
  // a port town's harbour on its own sea
  estateSpot(k,n,R,near){
    const t=this.t,wb=this.wallBox();
    if(INNER.includes(k))return near&&lotSpot(t,n,'open',1,6,R,{estate:true,gap:'row'})||lotSpot(t,n,'open',1,Math.max(9,t.T.ring),R,{estate:true,gap:'row'});
    return lotSpot(t,n,k,3,k==='port'&&t.style==='port'?20:12,R,{estate:true,gate:true,outside:wb&&{x0:wb.x0-1,y0:wb.y0-1,x1:wb.x1+1,y1:wb.y1+1},fields:PLOTS[k]?k:null,sea:k==='port'&&t.style==='port'})}
  // place an estate's building (and keep its fields): inner ones near the centre, outer ones on their ground beyond the walls;
  // at: the tile chosen for it (when you place it yourself); st: 'built' or 'building'
  estateLot(k,R,at,st){
    const t=this.t;
    R=R||seeded(t.seed*131+k.length);if(this.at(k))return this.at(k);const inner=INNER.includes(k);
    // (an estate with fields stands only where they have room, lotSpot o.fields)
    // (an outer one not far round; the world's water is bridged by its holdings)
    // (its building: the first of its kinds that finds room (estateTypes); placed by hand, the first)
    let type=null,n=0,p=null;for(const ty of at?[typeFor(t,k)]:estateTypes(t,k)){type=ty;n=lotSize(ty);p=at||this.estateSpot(k,n,R,true);if(p)break}
    if(!p)return null;const l=this.add({k,type,x:p[0],y:p[1],n,lv:bldLv(t,k)||1,seed:Math.floor(R()*1e6),st:st||'built'});
    if(PLOTS[k]){l.plots=fieldsFor(t,l,k);occMark(l,l.id)}
    // (one built while the world runs: its track now; the layout's own once it is laid out, tracks)
    if(!inner&&!this.laying&&estTrack(t,l))tracksDone();
    t._spots=null;return l}
  // keep the lots in step with what the holding has: build what it has gained, ruin what war has cost it (its centre's
  // fortification is its walls, wallOf, drawn as they stand: structures.js lotSprite)
  sync(){
    const t=this.t;
    if(!t.lots){this.init();return}
    for(const k of Object.keys(ESTATES)){const lv=bldLv(t,k),l=this.at(k),w=t.work&&t.work.k===k;if(lv&&!l&&!this.estateLot(k))t.bld[k]=0;else if(l){l.lv=Math.max(1,lv);const st=lv?'built':w?'building':'ruined';if(l.st!==st){l.st=st;l._s=null}}}
    t._spots=null}
}
// the field tiles a farm, pasture or quarry may grow over (all it will ever need, kept now): one connected patch beside it (a
// farm's fertile: ESTATE_LAND)
function fieldsFor(t,l,k){
  const fert=ESTATE_LAND[k].fertile,g=k==='quarry'?(x,y)=>tAt(x,y)===T_HILL||tAt(x,y)===T_OPEN:(x,y)=>tAt(x,y)===T_OPEN&&(!fert||fertileAt(x,y)),out=[],cand=[],ti=TOWNS.indexOf(t);
  const wb=wallBox(t),inRing=(x,y)=>wb&&x>=wb.x0-1&&x<=wb.x1+1&&y>=wb.y0-1&&y<=wb.y1+1,RB=roadPaint();// fields stay clear of the town, and off the roads
  // (and within its workers' reach of its door: every corner of a plot within folk.js FIELD.reach of the estate's spot, lotMid; a
  // farmstead of 64 px reaches less far past its back)
  const m=lotMid(l),far=FIELD.reach*TILE,reach=(x,y)=>[[x*TILE+1,y*TILE+4],[(x+1)*TILE-1,y*TILE+4],[x*TILE+1,(y+1)*TILE],[(x+1)*TILE-1,(y+1)*TILE]].every(([a,b])=>Math.hypot(a-m.x,b-m.y)<=far);
  for(let y=l.y-3;y<=l.y+l.n+2;y++)for(let x=l.x-3;x<=l.x+l.n+2;x++){if(x>=l.x&&x<l.x+l.n&&y>=l.y&&y<l.y+l.n||OCC[y*MW+x]||RB[y*MW+x]||!g(x,y)||brookAt(x,y)||x<1||y<1||x>=MW-1||y>=MH-1||inRing(x,y)||!reach(x,y)||!walkTo(t,x,y))continue;const L=LAND[y*MW+x];if(L>=0&&L!==ti)continue;
    const d=Math.hypot(x-(l.x+l.n/2-.5),y-(l.y+l.n/2-.5));cand.push([x,y,d+hash(x,y,t.seed)*.6])}
  cand.sort((a,c)=>a[2]-c[2]);const touch=[];lotTiles(l,(x,y)=>touch.push([x,y]));
  while(out.length<PLOTS[k]){const c=cand.find(c=>!out.includes(c)&&touch.some(q=>Math.abs(q[0]-c[0])+Math.abs(q[1]-c[1])===1));if(!c)break;out.push(c);touch.push(c)}
  return out.map(c=>[c[0],c[1]]);
}
/* the estates' tracks (the owner's play-test 4: "can we have a country road or non-main road to cross between forest as well when
   there is an estate near by"): to the door of each of a holding's outer estates no way comes near (no road
   or track its people walk to within LOT_TRACK.near tiles of the tile before its door), a track (a road of no width, as the
   bridges' tracks: worldplace.js genRoads) from a way: the least-cost way, 8 ways (no corner cut past a lot, water or a peak), over
   free ground its people walk to (lotWalk: never on a lot, a field, a crossing or by its end), open ground 1, hills LOT_TRACK.hill,
   woods LOT_TRACK.wood, from the tile before its door (or, that taken, one beside its building or its fields, LOT_TRACK.side a tile
   farther round), to the way from which the roads bring its people to the gate soonest (LOT_TRACK.road a tile on them); a track
   laid before is a way too, so an estate's track runs on into another's where that is shorter (the estates nearest the gate
   first). Straightened where free ground takes a straight line (up to LOT_TRACK.pull tiles a leg), laid
   on the tiles under it (T_ROAD, feat's track bit) and in WM.roads ({a, b: '', kind: 'track', est: its holding, path from the way to
   the door, line through them up to the building: its door, or the middle of the side it comes to, of it or of its fields (a
   pasture's pens round its barn)}); the painted roads (roadPaint) marked along it. Laid at the end of a holding's layout
   (Layout init) and for an estate built later (estateLot); taken up when the world goes in again (onWorld: every new game lays
   them out alike) and laid again from a save's lots (occRebuild). Kept by map: EST_TRACKS, the tiles each laid and what they were */
const LOT_TRACK={near:2,hill:2.2,wood:1.8,side:1.5,pull:12,road:.77,cut:1000};
function tracksUp(m){const L=EST_TRACKS.get(m);if(!L)return;
  for(let k=L.length-1;k>=0;k--){const r=L[k];r.laid.forEach((i,j)=>{m.kind[i]=r.was[j];m.feat[i]=r.fe[j]})}m.roads=m.roads.filter(r=>!r.est);EST_TRACKS.delete(m);if(m===WM)wayRechart()}
// (the tracks laid: the way graph charted again with them (router.js wayRechart) and the land reckoned again over them (territory.js
// computeLand: a holding's claim reckoned again later, at a capture, would run along them while the rest did not))
function tracksDone(){wayRechart();computeLand()}
// (the tiles under a line through points pts (tiles), 8-connected and thin: as worldplace.js genRoads lays its roads)
function lineTiles(pts){const T=[];
  for(let k=1;k<pts.length;k++){const [ax,ay]=pts[k-1],[bx,by]=pts[k],st=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)*4));
    for(let s=k>1?1:0;s<=st;s++){const x=Math.floor(ax+(bx-ax)*s/st),y=Math.floor(ay+(by-ay)*s/st),i=y*MW+x;if(i===T[T.length-1])continue;
      if(T.length>=2){const p=T[T.length-2];if(Math.abs(p%MW-x)<=1&&Math.abs((p-p%MW)/MW-y)<=1)T.pop()}T.push(i)}}
  return T}
// (the line from a to b (tiles) as painted off every lot and field: no point of it LOT_ROAD px or more inside a tile one keeps)
function lotClear([ax,ay],[bx,by]){const n=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)*TILE/2)),e=LOT_ROAD/TILE;
  for(let s=0;s<=n;s++){const x=ax+(bx-ax)*s/n,y=ay+(by-ay)*s/n,tx=Math.floor(x),ty=Math.floor(y),fx=x-tx,fy=y-ty;if(Math.min(fx,fy,1-fx,1-fy)>=e&&occAt(tx,ty)>0)return false}
  return true}
// (a line [x, y, x, y...] (tiles) with its corners cut twice, Chaikin's way, as gfx/worldart.js artGenPlan paints a road: every leg
// lotClear)
function softClear(l){for(let t=0;t<2;t++){const o=[l[0],l[1]];for(let j=2;j<l.length;j+=2){const a=l[j-2],b=l[j-1],c=l[j],d=l[j+1];o.push(a*.75+c*.25,b*.75+d*.25,a*.25+c*.75,b*.25+d*.75)}o.push(l[l.length-2],l[l.length-1]);l=o}
  for(let j=2;j<l.length;j+=2)if(!lotClear([l[j-2],l[j-1]],[l[j],l[j+1]]))return false;return true}
function estTrack(t,l){
  const K=tiles,Fe=WM.feat,C=LOT_TRACK,n=l.n,fx=l.x+(n>>1),fy=l.y+n,xy=i=>[i%MW,(i-i%MW)/MW],cen=i=>[i%MW+.5,(i-i%MW)/MW+.5];
  const way=i=>{const [x,y]=xy(i);return K[i]===T_ROAD&&!(Fe[i]&32)&&walkTo(t,x,y)},free=i=>{const [x,y]=xy(i),k=K[i];return x>0&&y>0&&x<MW-1&&y<MH-1&&passable(k)&&k!==T_ROAD&&k!==T_FORD&&!OCC[i]&&DEP_AT[i]<0&&walkTo(t,x,y)};// (never over a vein or a fishing ground: resources.js)
  const side=i=>passable(K[i])&&OCC[i]<=0,step=(a,b)=>{const [ax,ay]=xy(a),[bx,by]=xy(b),dx=bx-ax,dy=by-ay;return Math.abs(dx)<=1&&Math.abs(dy)<=1&&(!dx||!dy||side(a+dx)&&side(a+dy*MW))};
  for(let y=fy-C.near;y<=fy+C.near;y++)for(let x=fx-C.near;x<=fx+C.near;x++)if(x>=0&&y>=0&&x<MW&&y<MH&&way(y*MW+x))return null;
  // the least-cost way from before the door (or beside the building or its fields, own) to a way, within the holding's walk
  const w=lotWalk(t).all,x0=w.x0,y0=w.y0,N=w.n,L=i=>{const [x,y]=xy(i);return x<x0||y<y0||x>=x0+N||y>=y0+N?-1:(y-y0)*N+x-x0},D=new Float64Array(N*N).fill(Infinity),fr=new Int32Array(N*N).fill(-1),H=new WayHeap();
  // (each way's cost on to the gate over the roads, LOT_TRACK.road a tile, 8 ways, within the walk: the track ends on the way that
  // brings its workers home soonest, not merely the nearest (one not joined to the gate there: LOT_TRACK.cut more))
  const G=new Float64Array(N*N).fill(Infinity),g0=(t.ty+1)*MW+t.tx;if(L(g0)>=0&&way(g0)){G[L(g0)]=0;H.push(0,g0)}
  while(H.n){const d=H.top,i=H.pop();if(d>G[L(i)])continue;for(const [dx,dy] of DIR8){const j=i+dx+dy*MW,r=L(j);if(r<0||!way(j))continue;const c=d+C.road*(dx&&dy?1.4142:1);if(c<G[r]){G[r]=c;H.push(c,j)}}}
  const own=[];lotTiles(l,(x,y)=>own.push(y*MW+x));for(const [x,y] of l.plots||[])own.push(y*MW+x);const mine=new Set(own);
  for(const o of own)for(const s of [MW,-1,1,-MW]){const i=o+s,q=L(i),[x,y]=xy(i);if(q<0||!free(i))continue;const c=C.side*(Math.abs(x-fx)+Math.abs(y-fy));if(c<D[q]){D[q]=c;H.push(c,i)}}
  let to=-1,best=Infinity;
  // (never from a way beside or behind the centre, in the yard the art leads a road's end round to the gate (worldart.js gateLead,
  // GENART.yard): it would be painted round the centre's corners, over the lots there)
  const cb=centreBox(t),yd=GENART.yard+.5,besideCentre=i=>{const x=i%MW+.5,y=(i-i%MW)/MW+.5;return x>=cb.x-yd&&x<=cb.x+cb.n+yd&&y>=cb.y-yd&&y<cb.y+cb.n};
  while(H.n&&H.top<best){const d=H.top,i=H.pop(),q=L(i);if(d>D[q])continue;if(way(i)){if(besideCentre(i))continue;const v=d+Math.min(G[q],C.cut);if(v<best){best=v;to=i}continue}
    for(const [dx,dy] of DIR8){const j=i+dx+dy*MW,r=L(j);if(r<0||!(free(j)||way(j))||!step(i,j))continue;const k=K[j],c=d+(k===T_FOREST?C.wood:k===T_HILL?C.hill:1)*(dx&&dy?1.4142:1);if(c<D[r]){D[r]=c;fr[r]=i;H.push(c,j)}}}
  if(to<0)return null;const P=[];for(let i=to;i>=0;i=fr[L(i)])P.push(i);
  // straightened: each leg as far on as a straight line keeps to free ground (the way's own tile at its start), and its painted
  // line off every lot and field (lotClear: a corner the thin line steps past; and the line as the art rounds its corners, softClear)
  const ok=(T,a)=>T.every((i,k)=>(k||!a?free(i):i===P[0])&&(!k||step(T[k-1],i))),V=[0];
  for(let a=0;a<P.length-1;){let b=a+1;for(let e=a+2;e<P.length&&e<=a+C.pull;e++)if(ok(lineTiles([cen(P[a]),cen(P[e])]),!a)&&lotClear(cen(P[a]),cen(P[e])))b=e;V.push(b);a=b}
  const S=lineTiles(V.map(k=>cen(P[k]))),e=P[P.length-1],[ex,ey]=xy(e),o=[MW,-1,1,-MW].map(s=>e+s).find(i=>mine.has(i)),door=[ex===fx&&ey===fy?[l.x+n/2,l.y+n]:[ex+.5+(o%MW-ex)/2,ey+.5+((o-o%MW)/MW-ey)/2]],
    T=S[0]===P[0]&&S[S.length-1]===e&&ok(S,true)&&softClear([...V.map(k=>cen(P[k])),...door].flat())?S:P,
    line=[...(T===S?V.map(k=>cen(P[k])):P.map(cen)),...door].flat();
  // laid, kept, marked on the painted roads
  const r={laid:T.slice(1),was:[],fe:[]};for(const i of r.laid){r.was.push(K[i]);r.fe.push(Fe[i]);K[i]=T_ROAD;Fe[i]=Fe[i]&~64|128}
  // (the building turned to its track, where the track comes to it and not to its fields; a mine or a quarry keeps its back to the rock)
  if(o!=null&&rockYaw(l)==null&&o%MW>=l.x&&o%MW<l.x+n&&(o-o%MW)/MW>=l.y&&(o-o%MW)/MW<l.y+n){const y=faceTo(l,ex+.5,ey+.5);if(y!==l.yaw){l.yaw=y;relot(l)}}
  const L2=EST_TRACKS.get(WM)||[];L2.push(r);EST_TRACKS.set(WM,L2);WM.roads.push({a:'',b:'',kind:'track',est:t.name,path:T,line:[line]});
  if(ROAD_PAINT){const B=ROAD_PAINT,mk=(px,py)=>{for(let ty=Math.floor((py-LOT_ROAD)/TILE);ty<=Math.floor((py+LOT_ROAD)/TILE);ty++)for(let tx=Math.floor((px-LOT_ROAD)/TILE);tx<=Math.floor((px+LOT_ROAD)/TILE);tx++)if(tx>=0&&ty>=0&&tx<MW&&ty<MH)B[ty*MW+tx]=1};
    for(let k=2;k<line.length;k+=2){const ax=line[k-2]*TILE,ay=line[k-1]*TILE,bx=line[k]*TILE,by=line[k+1]*TILE,s=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)/2));for(let q=0;q<=s;q++)mk(ax+(bx-ax)*q/s,ay+(by-ay)*q/s)}}
  return r}
// a lot placed, taken away or changed: the painted world under it again (worldart.js WorldArt relot: its yard)
const relot=l=>{if(typeof WorldArt!=='undefined')WorldArt.relot(l)};
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
function placeRule(k){return k==='house'||INNER.includes(k)?{g:'open',inner:true,gap:'row'}:{g:k,inner:false,gap:true}}
function placeOk(t,k,x,y,n){
  const r=placeRule(k),ti=TOWNS.indexOf(t);for(let j=0;j<n;j++)for(let i=0;i<n;i++)if(LAND[(y+j)*MW+x+i]!==ti)return false;
  if(!lotFits(t,x,y,n,r.g,r.gap)||!lotWalks(t,x,y,n))return false;if(PLOTS[k]&&fieldsFor(t,{x,y,n},k).length<PLOTS_AT[k](1))return false;// room for its fields
  if(ESTATES[k]&&nearBandits(x+n/2-.5,y+n/2-.5,BANDIT_GAP+n/2+(PLOTS[k]?3:0)))return false;// too near a bandit camp or hideout
  const [cx,cy]=r.inner?centreMid(t):[t.tx,t.ty-1],d=Math.hypot(x+n/2-.5-cx,y+n/2-.5-cy);if(d>(r.inner?10:k==='port'&&t.style==='port'?20:13))return false;
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


