'use strict';
/* ---------- the battlefield's ground (terrain phases 1-4: hills as three terraces, woods, marsh; rivers, fords, bridges; sight: hidden in woods and behind rises; cliffs, mountains and the way round them; doc/TERRAIN_DESIGN.md) ----------
   A static grid of 16-px cells (B.terrain; absent when off) laid out once a battle from the world tile it is fought on and its
   8 neighbours, with its own seeded stream (never Math.random: the spawn sequence is untouched). Same place, same field (D4);
   both halves alike (D5); none in sieges, raids or tournaments (D6). With no terrain every helper returns exactly 1 (or "open"),
   and x*1===x, so a battle without it is bit-identical. Cells are 16 px and SPATIAL.cell 32: each grid bucket is 2×2 cells.
   PHASE 4, THE CONTRACT WITH THE ART (engine/ground.js, render.js), kept exactly:
   - Kind: TKIND.rock (6) is a mountain's or a rock spire's cell: impassable (TERRAIN_GROUND.rock solid) and blocking all sight
     (blocks: true).
   - Walls: B.terrain.wall, a Uint8Array(C*R), or absent (no cliff on the field): each cell's cliff edges in route.js's bits, E 1,
     S 2, W 4, N 8. A set bit forbids stepping from that cell over that edge; set on one side only it is one-way (a one-way hill:
     the bit on the low cell, pointing up: down is allowed, up is refused). Cliffs lie between a terrace cell and a lower
     neighbour on the four sides; a ramp is the stretch of rim with no bits (B.terrain.recipe.hills[i]: cliff, oneway, ramps (the
     angles of its ramps, radians, screen y down: 0 east, PI/2 south)).
   - Heights: B.terrain.lvl still gives the terrace levels (a rock cell keeps the level under it, 0 as generated). B.terrain.rockH,
     a Uint8Array(C*R), or absent (no rock): a rock cell's height in LEVELS above the ground, each PX.ROCK_PX (14) px of screen
     height as the art draws it (1 at least on rock, peaks up to TERRAIN_ROCK.mh[1]; 0 for every other cell). The art reads
     wall and rockH off B.terrain (PX.battleGround({...B.terrain, climate, base})); wall is absent on a field with no cliffed hill,
     whose terrace edges the art then paints as before.
   B.terrain.route: {foot, mounted, big}, route.js grids of the field (deep water impassable unless TERRAIN.wade; rows wholly off
   the field closed), built with it; blocky: anything on the field blocks a step (rock, a cliff, impassable deep water), else
   none of the routing below runs and a battle is as in phase 3. */
// on: the game's switch (tests/harness.js turns it off for the older suites); cs: cell size (px); floor: the least a speed
// multiplier of the ground can be; tries: sub-seeds tried for a fair field; lane: an open lane edge to edge (px high); zone: the
// deployment zones (share of BW at each edge); zoneWood: woods' largest share of a zone; score: how far the halves' advantage
// scores may differ (share); mirror: a hill pair's x jitter (px); centre: a lone hill's |x-BW/2| limit (share of BW); jit: a
// feature in the middle's x jitter (share of BW: the halves must score alike); top2: a
// level-2 hill's crest (share of its radius); slope: a terrace's slope band (cells in from its rim a level of the drop: the edge
// the art paints, not a skirt; the owner, 2026-10-18: it was 2 cells, too wide). With terrain a field has no
// scattered trees, rocks or cacti (B.obs empty: setup.js; the owner reversed D10): its woods, hills and marsh are its features
// wade: deep water wadeable as in phase 2 (D1; crossWay steers round it), else impassable (phase 4: the owner's call), read when a
// field is built
const TERRAIN={on:true,cs:16,floor:.3,tries:8,lane:96,zone:.3,zoneWood:.25,score:.15,mirror:32,centre:.08,jit:.02,top2:.55,slope:1,wade:false};
// cell kinds (B.terrain.kind): deep water, fords and bridges are a river's (phase 2); rock, a mountain's or a spire's (phase 4)
const TKIND={open:0,wood:1,marsh:2,ford:3,deep:4,bridge:5,rock:6};
/* RIVERS (phase 2) — the contract with the AI (commander.js) and the art:
   B.terrain.ai.crossings: the ways over a river's DEEP water, sorted top to bottom (empty with no river, or with one that has no
   deep water: a frozen river or a swamp stream is all ford, crossed anywhere):
     [{kind:'ford'|'bridge', x, y, w, y0, y1, x0, x1}]   all field px. (x,y): its middle. w: its width along the river (y1-y0;
     a ford 64, a bridge 32). x0, x1: the water it spans at y (the west and east banks: go to (x0-16,y), then over to (x1+16,y)).
   B.terrain.ai.river: null, or {x, x0, x1, w, deep, frozen, stream}: its mean middle and the band its water keeps within (px,
   least x0 and most x1 over the field), its water's width (px), whether it has deep water, frozen (frost: all ford, ice),
   stream (a swamp's: all ford).
   B.terrain.recipe.river: null, or {x, path:[middle x of each cell row], half (px, half the water's width), crossings (as above,
   all of them, a frozen river's bridge too), deep, frozen, stream, bridge (a road bridge near on the world map), sp0, sp1 (each
   cell row's water: x0 and x1 px, -1 none), x0, x1, gap (the least ground between its crossings, px)}; recipe.rivers: all of them (a lab field can have two).
   has.water: any ford, deep or bridge cell. Rivers run top to bottom across the middle (both deployment zones are dry).
   Helpers (terrain.js): riverSpan(y) → [x0,x1] of the water at y, or null; crossesDeep(ax,ay,bx,by) → does the straight way
   between cross deep water (crossingFor, phase 2's, is retired: routing replaced it, and no game code called it).
   Phase 4: deep water is impassable (TERRAIN.wade false), crossed only at the fords and bridges (the way round, below). Wadeable
   (TERRAIN.wade, D1 as phase 2 had it): ×0.35 speed (big ×0.5), no momentum, stamina ×2, no shooting, blows dealt ×0.75 and
   taken ×1.25, no cohesion; crossWay steers over a crossing when that beats wading. */
/* spd: speed on it, by foot, mounted or big (its home race or beast goes at ×1); run: how fast charge momentum builds; chargeIn:
   the charge bonus against one standing in it; stop: a low missile's chance to be stopped per wood cell entered (elves and magic
   pass); canopy: an arrow's chance to be caught coming down into a wood cell (lab: arcs fall too steeply to cross cells low);
   view: wood cells that block a morale view (unless the viewer stands higher); sta: stamina drain running in it; hit:
   melee damage dealt standing in it; hurt: melee damage taken standing in it; wade: stamina spent a second walking in it (on
   FATIGUE.run's scale: walking elsewhere spends none); thin: no shield wall, nor riders in a wedge (formations break); loose: no
   cohesion; noShoot: no shooter draws standing in it; home: the RACES home (or a beast's) that ignores its slow, momentum,
   stamina and blows (D7). Deep water is wadeable but punishing (D1, phase 2: impassable in phase 4); a ford is marsh in a
   current; a bridge is open ground (its narrowness is the rule: crossWay). blocks: hides whatever lies behind it from sight at any
   height (SIGHT, riseBlocked); solid: no one steps into it (route.js grids, terrainHold) */
const TERRAIN_GROUND={
  wood:{n:'Woods',spd:{foot:.8,mounted:.55,big:.55},run:.35,chargeIn:.5,stop:.08,canopy:.35,view:3,thin:true,loose:true,home:'forest'},
  marsh:{n:'Marsh',spd:{foot:.7,mounted:.5,big:.7},run:.3,sta:1.5,hit:.9,home:'swamp'},
  ford:{n:'Ford',spd:{foot:.7,mounted:.5,big:.7},run:.3,sta:1.5,hit:.9,thin:true,home:'swamp'},
  deep:{n:'Deep water',spd:{foot:.35,mounted:.35,big:.5},run:0,sta:2,wade:1,hit:.75,hurt:1.25,thin:true,loose:true,noShoot:true},
  rock:{n:'Rock',spd:{foot:1,mounted:1,big:1},solid:true,blocks:true}
};
const TGROUND=[null,TERRAIN_GROUND.wood,TERRAIN_GROUND.marsh,TERRAIN_GROUND.ford,TERRAIN_GROUND.deep,null,TERRAIN_GROUND.rock];
/* rivers (phase 2). half: half the water's width (px: 3 cells); stream: a swamp stream's; meander: its sway each way (px); jit:
   its middle's x jitter (share of BW); ford, bridge: a crossing's width along the river (px); gap: the least ground between two
   crossings (px; on a field too short for that, as much as there is, down to minGap); edge: a crossing's least distance from the field's top and bottom (px); fords: [least, most] with no road
   bridge near (with one: a bridge and a ford); near: a road bridge this many world tiles off gives a bridge; mid: the most a
   crossing's middle lies off BW/2 (px: both sides reach it alike); clear: ground a hill or wood keeps off the river (px);
   streamP: a swamp with no water near: the chance of a ford-only stream; frostP: a frost field's with no water near: the chance of
   a frozen river (all ice, crossed anywhere); pad: a crossing's mouth off the water (px); inset: how
   far inside a crossing's edges those going over keep (px); keep: a crossing taken stays taken unless wading gets this much
   quicker (crossWay) */
const TERRAIN_RIVER={half:24,stream:16,meander:32,jit:.02,ford:64,bridge:32,gap:120,minGap:40,edge:40,fords:[1,2],near:2,mid:64,clear:24,streamP:.6,frostP:.35,pad:10,inset:8,keep:1.15};
/* range: a shooter's range per level he stands on; melee: a blow at a foe at least one level lower; charge: the charge bonus
   scaled by 1+charge·Δlevel (Δ clamped ±1); climb: speed going up a slope cell (dot > dot), by foot/mounted/big (the owner: a
   step up is hard going; the band 1 cell since 2026-10-18, so slower in it: a climb takes about as long); descend: going down
   one; runUp, runDown: momentum building up or down a slope; climbSta: stamina running uphill;
   climbing also breaks cohesion while it lasts (morale.js cohesionReady); home: who climbs freely (dwarves) */
/* sight (phase 3: hidden in woods, doc/TERRAIN_DESIGN.md §8). A soldier in a wood is unseen by a side with no living soldier
   within near px of him (high px from higher ground) and none of whom he struck or shot in the last memory s; so is one anywhere
   whom raised ground hides from every soldier of that side (a cell between them a level higher than both: riseBlocked; a kind
   with blocks: true hides all, phase 4's mountains). every: how often it is reckoned (s of battle time); wall: a blocking cell's
   height. AMBUSH: a group wholly unseen by its foes within window s before its charge lands springs an ambush: its charges'
   shock ×shock for burst s, once a battle (morale.js chargeMul) */
const SIGHT={every:.25,near:64,high:96,memory:3,wall:255};
const AMBUSH={shock:1.5,window:3,burst:1.5};
const HILL={range:.075,melee:.1,charge:.35,climb:{foot:.5,mounted:.4,big:.4},descend:1.15,runUp:.6,runDown:1.25,climbSta:2,dot:.5,home:'hills'};
/* what the world round the battle lays out (§3; its river: terrainAt, riverPlan). layouts: [name, weight], one picked (terrainPlan): plain
   (nothing), hill (one centred), woodedHill (one centred, trees on its top), copse (one small wood in the middle), copses (small
   woods in mirrored pairs), woods (forest patches, half the time round a low hill), pair (a hill per half, mirrored), pairFlank
   (the same with a wood on each one's flank), ridge (one down the middle, half the time a copse), woodedRidge (trees along its
   crest), dune (a low ridge), marsh (dead trees and marsh). top: the level hills rise to; hr: hill radius; wr: wood radius;
   cr: a copse's; woods, marsh: [least, most] patches; mr: marsh radius. A desert never has woods, nor water or marsh but an
   oasis (oasis: its radius) where the world tile or a neighbour is water (the owner). river: the layouts with a river down the
   middle (nothing on it: its features in pairs, one each side). Phase 4: cliff, [the chance its hills are sheer (cliffs all round
   and one or two ramps), the chance they are one-way (cliffs one can drop down but never climb, and one ramp)]; rock, [the chance
   of mountains, of rock spires] (TERRAIN_ROCK; laid by featurePlan from a stream of its own).
   Field variety (2026-10-18, "Field variety as built"): more layouts a kind, picked by the tile's seed: rise (one broad low hill),
   snowwood (frost: snowy copses in mirrored pairs), rolling (a level-2 hill in the middle and a low pair), ridges (two long
   ridges, mirrored), dunes (two long low dunes), erg (a dune down the middle and a pair), spires (rock spires always), mere (marsh
   pools and dead stands), pass (mountains along both edges, a valley between), saddle (a hill between four mountains), gorge (one
   great mountain off the middle, spires). Dense (TERRAIN_DENSE): deepwood, stands, hillwood, glade, elvenwood, mirewood, fen.
   frost: a frost field's layouts; elven: a forest near an elven town's; forest: a forest tile in the swamp's; extra: what a field
   larger than today's gets more of (fieldScale: copses, hillocks, marshes, dunes, in mirrored pairs). Recipes keep their order:
   a new one goes last (the tile's seed is made from its index) */
const TERRAIN_RECIPE={
  open:{layouts:[['plain',3],['hill',3],['copse',2],['woodedHill',2],['copses',2],['rise',2]],river:[['plain',3],['copses',2],['pair',2]],frost:[['snowwood',3],['copses',3],['woodedHill',2],['plain',2],['hill',1]],extra:['copses','hillock'],top:1,hr:[90,125],wr:[40,64],cr:[26,40],cliff:[.12,.08],rock:[.06,.1]},
  forest:{layouts:[['deepwood',4],['stands',3],['hillwood',2],['glade',2]],river:[['deepwood',3],['stands',3]],elven:[['elvenwood',1]],top:1,hr:[80,110],wr:[80,110],cr:[30,48],woods:[3,4],cliff:[.08,.05],rock:[.04,.04]},
  hills:{layouts:[['pair',3],['ridge',2],['woodedRidge',2],['pairFlank',2],['rolling',3],['ridges',2]],river:[['pair',3],['pairFlank',2],['ridges',2]],extra:['hillock'],top:2,hr:[105,135],wr:[40,64],cr:[30,48],cliff:[.36,.24],rock:[.5,.15]},
  swamp:{layouts:[['marsh',2],['fen',2],['mere',2]],forest:[['mirewood',1]],extra:['marshes'],top:1,hr:[40,60],wr:[40,60],cr:[26,40],woods:[1,2],marsh:[3,5],mr:[60,90]},
  desert:{layouts:[['plain',2],['dune',2],['dunes',2],['erg',1],['spires',1]],extra:['dunes'],top:1,hr:[70,90],oasis:[45,65],rock:[0,.55]},
  peaks:{layouts:[['pass',3],['saddle',2],['gorge',2]],river:[['pass',2],['gorge',1]],extra:['hillock'],top:2,hr:[95,125],wr:[40,60],cr:[26,40],cliff:[.4,.25],rock:[.2,.35]}
};
/* the field's size (fieldScale): ref, the playable area (px²: BW × the rows between fieldTop and fieldBot) today's fields are made
   for, slack its margin (a field up to ref×slack is today's); a larger field gets extra mirrored pairs of its recipe's extra
   features (one a ref beyond it ×extra) and somewhat larger features (sz: its area's 4th root, at most big). The dense layouts
   lay their woods by share, so they scale by themselves */
const TERRAIN_SIZE={ref:572000,slack:1.3,big:1.5,extra:1};
/* dense fields (densePlan, denseLay): woods (and marsh) laid over the cells by seeded noise, the most wooded cells taken in each
   half's two bands (its deployment zone, its middle) to the shares asked, so both sides get alike. wood, marsh: the field's
   shares of them ([least, most]); scale: a stand's size (px); clear: clearings in mirrored pairs (a ref's worth of field); hill: a
   low hill in the woods, its top a clearing; mid: a wide glade in the middle; paths: deer paths; isles: low dry hummocks; path: a
   causeway always (no chain of clearings) */
const TERRAIN_DENSE_LAYOUT={
  deepwood:{wood:[.58,.64],scale:[90,120],clear:[1,2]},
  stands:{wood:[.5,.56],scale:[130,170],clear:[2,3]},
  hillwood:{wood:[.53,.6],scale:[100,140],clear:[1,1],hill:true},
  glade:{wood:[.52,.57],scale:[100,140],clear:[0,1],mid:true},
  elvenwood:{wood:[.55,.62],scale:[150,200],clear:[2,3],paths:2},
  mirewood:{wood:[.4,.46],marsh:[.14,.18],scale:[90,130],clear:[1,2]},
  fen:{wood:[.06,.1],marsh:[.3,.38],scale:[80,120],clear:[0,1],isles:true,path:true}
};
/* the dense fields' rules. glade: each army's deployment glade (x: its middle, rx: its half-width, shares of the zone's width
   from the edge; ry: its half-height, share of the field's); zoneLess: a zone's cover under the field's (its glade); fair: how far
   the zones' shares of cover, and of open ground, may differ; keep: a glade's least open share; road: a world road's width
   (cells) and verge (cells cleared each side), path: a deer path's (cells); pathP: the chance of a deer path with no road, else a
   chain of clearings (link: their radius, px; step: their spacing, px; a way's shape: TERRAIN_WAY); frost: a frost
   forest's woods × (snow fields; a forest tile's half of the field at least); edge: how much an open neighbour thins the woods toward it (band: its depth, share of the
   field's height); block: a stand counted for the AI (ai.woods)
   no wider than this (px); ride, gain: riders keep to the ways when their straight way is this much woods and the way is this
   much quicker (wayRide) */
const TERRAIN_DENSE={glade:{x:.45,rx:.42,ry:.3},zoneLess:.2,fair:.08,keep:.7,road:[2,1],path:2,pathP:.65,link:[36,56],step:[64,88],frost:.92,edge:.4,band:.22,block:256,ride:.35,gain:.1};
// a road on the field (a world road tile's: T.road 1; a deer path or causeway: 2, open ground only): spd, its speed ×
const TERRAIN_ROAD={spd:1.1};
/* how a way is laid (wayPlan), by road or path (a deer path, a causeway, a chain of clearings): the cost of a cell (wayGrid) on
   open ground u, ×1..1+soft by seeded noise of scale n px (the way wanders as ground does), and more for wood, marsh, a ford (in
   place: deep water and rock are closed, a bridge is open ground), a level of plateau (lvl), a slope band (slope: dear, so a way
   goes round a hill where it can and climbs one only where it must), the foot of a terrace (foot: it keeps off a face); a dense
   field's stands-to-be by the same (wood). Cliffs are closed both ways: a way crosses a terrace's edge only at a slope or a ramp.
   eps: the least-cost line simplified to within this (px); amp: the meander's sway (px), lam its wavelength (px, [least, most];
   its own noise stretches and squeezes it), env: the scale (px) of its envelope (dying away: straight stretches); wob, wl: a
   path's finer wobble (px) and its wavelength (px); hold: no sway this near an end or a crossing (px); band: how far (cells) the
   swayed line may stray off the least-cost cells, onto ground like theirs */
const TERRAIN_WAY={
  road:{u:12,soft:2.4,n:260,wood:14,marsh:26,ford:44,lvl:10,slope:80,foot:12,eps:20,amp:34,lam:[190,330],env:560,wob:0,wl:[60,90],hold:44,band:3},
  path:{u:12,soft:2.4,n:140,wood:4,marsh:16,ford:14,lvl:8,slope:45,foot:6,eps:12,amp:12,lam:[90,150],env:300,wob:3.5,wl:[30,52],hold:30,band:2}};
/* cliffs and rock (phase 4). frost, frostCliff: a frost field's rock and cliff chances ×; ramp: a ramp's width (px); ramps2: a
   sheer hill's chance of two ramps (else one); mr, mh: a mountain's radius (px) and peak (levels of PX.ROCK_PX px: rockH); sr, sh: a spire's; spires: [least,
   most] pairs of them; mid: the chance of one more in the middle (no river); pad: rock keeps this far inside the middle band (off
   the deployment zones, px); hill: and this far off a hill's rim (px); tries: places tried for each; crags: the lab's recipe of
   them (lab.js: cliff and rock chances in place of its recipe's); pass: a pass's crags on a sized field grow with its height up to ×this */
const TERRAIN_ROCK={frost:1.6,frostCliff:1.3,ramp:56,ramps2:.5,mr:[36,60],mh:[4,7],sr:[10,16],sh:[2,3],spires:[1,2],mid:.3,pad:24,hill:16,tries:12,pass:2.2,crags:{cliff:[.5,.5],rock:[1,.6]}};
// (the 8 uphill directions of B.terrain.up: k·45°, screen y down)
const TDX=[1,Math.SQRT1_2,0,-Math.SQRT1_2,-1,-Math.SQRT1_2,0,Math.SQRT1_2],TDY=[0,Math.SQRT1_2,1,Math.SQRT1_2,0,-Math.SQRT1_2,-1,-Math.SQRT1_2];
// which recipe a battle at this world tile gets (t: battleEnv's terrain, water and peaks already as hills; c: the climate;
// forestN, mountN: forest and peak tiles round it; peak: the tile itself is a peak). A hill among peaks is a pass (peaks)
function terrainRecipeOf(t,c,forestN,mountN=0,peak=false){return t===T_HILL?(peak||mountN>=3?'peaks':'hills'):c==='swamp'?'swamp':c==='desert'?'desert':t===T_FOREST||forestN>=3?'forest':'open'}
// the battle at world point (x,y) on ground env (battleEnv's; a test's own): its BattleSite's (terrainOf)
function terrainAt(x,y,env){return terrainOf(battleSiteAt(x,y),env)}
/* the battle at BattleSite S (worldmap.js: all it reads of the world) on ground env: its recipe and seed (the tile and its kind:
   same place, same field; the world's salt in it, D15); oasis: a desert by water; river (phase 2): water on a neighbouring tile
   runs a river down the field ({bridge: a road bridge within TERRAIN_RIVER.near tiles, frozen: in the frost}); a swamp with none
   near has a ford-only stream at streamP ({stream}), a frost field a frozen river at frostP; a desert never (its oasis). Field
   variety: edges, the neighbours that shape each side of the field (terrainEdges); road, the tile is a road ({ew, ns}: its way
   across the field, and on along it north or south); elven, a forest near an elven town; forest, a forest tile (a swamp's is the
   mire wood) */
function terrainOf(S,env){
  const {tx,ty}=S,K=S.kinds;let n=0,w=0,m=0;for(let i=0;i<9;i++){if(i===4)continue;const k=K[i];if(k===T_FOREST)n++;else if(k===T_WATER)w++;else if(k===T_MOUNT)m++}
  const recipe=terrainRecipeOf(env.t,env.c,n,m,K[4]===T_MOUNT),code=1+Object.keys(TERRAIN_RECIPE).indexOf(recipe)*4+Math.max(0,CLIMS.indexOf(env.c));
  let river=null;if(recipe!=='desert'){if(w>0){river={bridge:S.bridge!==null&&S.bridge<=TERRAIN_RIVER.near,frozen:env.c==='frost'}}
   else if(recipe==='swamp'&&hash(tx,ty,code+101)<TERRAIN_RIVER.streamP)river={stream:true};
   else if(env.c==='frost'&&hash(tx,ty,code+103)<TERRAIN_RIVER.frostP)river={frozen:true}}
  return{recipe,seed:Math.floor(hash(tx,ty,code+S.salt)*4294967296)>>>0,tx,ty,oasis:recipe==='desert'&&(w>0||K[4]===T_WATER),river,frost:env.c==='frost',
    edges:terrainEdges(S,recipe,env.c),road:S.road?{ew:true,ns:S.road.ns}:null,elven:recipe==='forest'&&S.elven,forest:env.t===T_FOREST||n>=3}}
/* the neighbours that shape each side of the field (BattleSite S's kinds and clims): {n, s, w, e} (north is the field's top, west
   its left), each 'forest', 'hills', 'peaks', 'water', 'marsh' (a swamp beside a field that is not), 'open' (open land beside a
   forest's field), or absent: the three tiles on that side, the middle one counting twice, 2 of 4 at least; a kind like the
   field's own counts for nothing */
function terrainEdges(S,recipe,c){
  const out={},E={n:[0,1,2],s:[6,7,8],w:[0,3,6],e:[2,5,8]};
  for(const s in E){const v={};E[s].forEach((i,j)=>{const t=S.kinds[i],k=t===T_FOREST?'forest':t===T_HILL?'hills':t===T_MOUNT?'peaks':t===T_WATER?'water':S.clims[i]==='swamp'&&c!=='swamp'?'marsh':'open';v[k]=(v[k]||0)+(j===1?2:1)});
    const own=recipe==='forest'?'forest':recipe==='hills'?'hills':recipe==='peaks'?'peaks':recipe==='swamp'?'marsh':null;
    for(const k of ['peaks','water','forest','hills','marsh','open'])if(v[k]>=2&&k!==own&&(k!=='open'||recipe==='forest')){out[s]=k;break}}
  return out}
// a battle's ground, or null: none when off, in tournaments, sieges and raids (D6), and no river against a monster or in a cave
// (§3); the lab asks for its own (lab.js). S: the battle's BattleSite (yours by default)
function groundSpecFor(opts,env,S){const e=G.enc;if(!TERRAIN.on||opts.tournament||opts.sandbox||e&&['siege','raid','tourney'].includes(e.kind))return null;const g=terrainOf(S||battleSiteAt(P.x,P.y),env);if(e&&['monster','cave'].includes(e.kind))g.river=null;return g}
// (marks the battle's env, unseen by snapshots: envStats then drops the old whole-field hill range, D2)
function groundEnv(env,spec){if(spec&&env&&!env.terrain)Object.defineProperty(env,'terrain',{value:true,configurable:true});return env}

/* ---- generation ---- */
// the field's size against today's (TERRAIN_SIZE): A, its playable area over ref×slack (1 at least); sz, its features' scale; ex,
// the extra mirrored pairs it gets
function fieldScale(W,top,bot){const S=TERRAIN_SIZE,A=Math.max(1,W*(bot-top)/(S.ref*S.slack));return{A,sz:Math.min(S.big,Math.pow(A,.25)),ex:Math.round((A-1)*S.extra)}}
/* the deployment zones the ground keeps to (the join with the field sizes): a sized field's (setup.js BFIELD, fieldZone: [back,
   back+depth] px off each side's edge, open ground behind), when the field built is that one; else null: today's, the outer
   TERRAIN.zone of the field from each edge (zOut, zIn, zHi read either: the zone's far side and near side off its edge, and the
   room between the zone and the middle, px) */
function terrainZone(W,H){const F=typeof BFIELD!=='undefined'&&BFIELD;return F&&W===F.w&&H===F.h?[F.back,F.back+F.depth]:null}
const zOut=(Z,W)=>Z?Z[1]:TERRAIN.zone*W,zIn=Z=>Z?Z[0]:0,zHi=(Z,W)=>Z?W/2-Z[1]:W*(.5-TERRAIN.zone),zMid=(Z,W)=>Z?(Z[0]+Z[1])/2:TERRAIN.zone*W/2;
// features in field px: hills {x,y,rx,ry,top,low (no cliffs: a pair's shoulders, an edge's ridge, a hummock)}, woods and marsh
// {x,y,r}; rocks {x,y,r,h} (peaks, edges); lane: the band free patches keep out of; oasis: water near; riv: a river will run down
// the middle (its layouts: the recipe's river list; features in pairs, clear of it by clr px). X (field variety): {H (the field's
// height), edges, road, elven, forest, frost, layout (the lab's: one of the recipe's)}: the layouts a field like it picks from
// (TERRAIN_RECIPE), a dense layout's plan (densePlan), a larger field's extra pairs (fieldScale) and its edges (edgePlan)
function terrainPlan(name,rnd,W,top,bot,oasis,riv,X={}){
  const Rc=TERRAIN_RECIPE[name]||TERRAIN_RECIPE.open,mid=(top+bot)/2,fh=bot-top,f=(a,b)=>a+(b-a)*rnd(),n=(a,b)=>a+Math.floor(rnd()*(b-a+1)),e=()=>.85+.3*rnd(),Z=fieldScale(W,top,bot),sz=Z.sz;
  const RV=TERRAIN_RIVER,clr=riv?RV.half+RV.meander+RV.jit*W/2+RV.clear:0,Ls=X.elven&&Rc.elven||X.forest&&Rc.forest||riv&&Rc.river||X.frost&&Rc.frost||Rc.layouts;
  const P={recipe:name,hills:[],woods:[],marsh:[],layout:null,W,H:X.H||BH,top,bot,zone:X.zone||null};
  let ly=f(top+fh*.2,bot-fh*.2);P.lane={y0:ly-TERRAIN.lane/2-8,y1:ly+TERRAIN.lane/2+8};
  {let tot=0;const k=rnd()*Ls.reduce((a,l)=>a+l[1],0);for(const [l,w] of Ls){tot+=w;if(k<tot){P.layout=l;break}}P.layout=P.layout||Ls[0][0]}
  if(X.layout&&terrainLayouts(name).includes(X.layout))P.layout=X.layout;
  // (a pass: its lane the valley's floor, in the middle)
  if(P.layout==='pass'){ly=mid+(rnd()-.5)*fh*.1;P.lane={y0:ly-TERRAIN.lane/2-8,y1:ly+TERRAIN.lane/2+8}}
  const L=P.layout,hill=(x,y,rx,ry,t)=>{const h={x,y,rx,ry,top:t};P.hills.push(h);return h};
  const one=t=>{const r=f(Rc.hr[0],Rc.hr[1])*sz;return hill(W/2+(rnd()-.5)*TERRAIN.jit*W,mid+(rnd()-.5)*fh*.25,r*e(),r*e(),t)};
  const ridge=t=>{const r=f(Rc.hr[0],Rc.hr[1])*sz;return hill(W/2+(rnd()-.5)*TERRAIN.jit*W,mid+(rnd()-.5)*fh*.1,r*.6*e(),r*1.7*e(),t)};
  const pair=(t=Rc.top)=>{const r=f(Rc.hr[0],Rc.hr[1])*sz,d0=W*f(.2,.27),rx=r*e(),ry=r*e(),dx=Math.max(d0,clr&&clr+rx*1.2);return[hill(W/2-dx,mid+(rnd()-.5)*fh*.3,rx,ry,t),hill(W/2+dx+(rnd()-.5)*2*TERRAIN.mirror,mid+(rnd()-.5)*fh*.3,rx*(.95+.1*rnd()),ry*(.95+.1*rnd()),t)]};
  // (free patches keep out of the lane: an odd one in the middle, the rest in mirrored pairs; trees on a hill stay with it)
  const away=(y,r)=>{const m=r*1.35+TERRAIN.lane/2+8;return Math.abs(y-ly)>=m?y:y<ly?ly-m:ly+m};
  const patches=(list,cnt,rr,dxr)=>{let k=cnt;if(k%2){if(!riv){const r=f(rr[0],rr[1])*sz;list.push({x:W/2+(rnd()-.5)*TERRAIN.jit*W,y:away(f(top,bot),r),r})}k--}
    while(k>0){const r=f(rr[0],rr[1])*sz,dx=Math.max(W*f(dxr[0],dxr[1]),clr&&clr+r*1.35),y1=away(f(top,bot),r),y2=away(f(top,bot),r);list.push({x:W/2-dx,y:y1,r},{x:W/2+dx+(rnd()-.5)*2*TERRAIN.mirror,y:y2,r:r*(.95+.1*rnd())});k-=2}};
  // (rock (peaks): a mirrored pair at height y, or one in the middle (no river), off the lane, the hills and other rock, between
  // the river's clearing and the deployment zones)
  const RK=TERRAIN_ROCK;P.rocks=[];
  const rockFree=(x,y,r)=>(y+r*1.3<P.lane.y0||y-r*1.3>P.lane.y1)&&P.hills.every(h=>Math.hypot(x-h.x,y-h.y)>Math.max(h.rx,h.ry)*1.2+r+RK.hill)&&P.rocks.every(o=>Math.hypot(x-o.x,y-o.y)>o.r+r+24);
  const rockPair=(r,h,y)=>{const hi=zHi(P.zone,W)-r-RK.pad,lo=Math.max(r+8,clr+r);for(let t=0;t<RK.tries&&hi>=lo;t++){const dx=f(lo,hi),y2=clamp(y+(rnd()-.5)*2*TERRAIN.mirror,top-r,bot+r);
    if(rockFree(W/2-dx,y,r)&&rockFree(W/2+dx,y2,r)){P.rocks.push({x:W/2-dx,y,r,h},{x:W/2+dx,y:y2,r,h:h*(.9+.2*rnd())});return true}}return false};
  const rockMid=(r,h,y)=>{const x=W/2+(rnd()-.5)*TERRAIN.jit*W;if(!riv&&rockFree(x,y,r)){P.rocks.push({x,y,r,h});return true}return false};
  const mr=()=>f(RK.mr[0],RK.mr[1])*sz,mh=()=>f(RK.mh[0],RK.mh[1]);
  if(L==='hill')one(Rc.top);
  else if(L==='woodedHill'){const h=one(Rc.top);P.woods.push({x:h.x,y:h.y,r:Math.min(h.rx,h.ry)*f(.45,.6)})}
  else if(L==='copse')patches(P.woods,1,Rc.cr,[0,0]);
  else if(L==='copses')patches(P.woods,2*n(1,2),Rc.cr,[.08,.24]);
  else if(L==='woods'){if(rnd()<.5&&!riv)one(1);patches(P.woods,n(Rc.woods[0],Rc.woods[1]),Rc.wr,[.1,.22])}
  else if(L==='pair')pair();
  else if(L==='pairFlank'){const [a,b]=pair(),s=rnd()<.5?-1:1,r=f(Rc.wr[0],Rc.wr[1])*sz;for(const h of [a,b])P.woods.push({x:h.x+(h===a?1:-1)*h.rx*.2,y:h.y+s*h.ry*.7,r})}
  else if(L==='ridge'){ridge(Rc.top);if(rnd()<.5)patches(P.woods,1,Rc.cr,[0,0])}
  else if(L==='woodedRidge'){const h=ridge(Rc.top),r=Math.min(h.rx*.7,f(Rc.wr[0],Rc.wr[1])*sz),s=rnd()<.5?-1:1;P.woods.push({x:h.x,y:h.y+s*h.ry*.25,r},{x:h.x,y:h.y-s*h.ry*.45,r:r*.8})}
  else if(L==='dune')ridge(Rc.top);
  else if(L==='marsh'){patches(P.woods,n(Rc.woods[0],Rc.woods[1]),Rc.wr,[.1,.22]);patches(P.marsh,n(Rc.marsh[0],Rc.marsh[1]),Rc.mr,[.08,.25])}
  // (field variety: the new layouts)
  else if(L==='rise'){const r=f(Rc.hr[0],Rc.hr[1])*sz;hill(W/2+(rnd()-.5)*TERRAIN.jit*W,mid+(rnd()-.5)*fh*.2,r*1.6*e(),r*1.2*e(),1)}
  else if(L==='snowwood')patches(P.woods,2*n(2,3),[40,60],[.1,.26]);
  else if(L==='rolling'){one(Rc.top);for(const h of pair(1)){h.rx*=.7;h.ry*=.7;h.low=true}}
  else if(L==='ridges'){for(const h of pair()){h.rx*=.6;h.ry*=1.5}}
  else if(L==='dunes'){for(const h of pair(1)){h.rx*=.5;h.ry*=1.6;h.low=true}}
  else if(L==='erg'){ridge(1);for(const h of pair(1)){h.rx*=.45;h.ry*=1.3;h.low=true}}
  else if(L==='spires')P.spires=true;
  else if(L==='mere'){patches(P.marsh,n(3,4),[70,100],[.1,.24]);patches(P.woods,2*n(1,2),Rc.wr,[.12,.3])}
  else if(L==='pass'){if(!riv&&rnd()<.5){const h=one(1);h.rx*=.7;h.ry*=.7;h.low=true}const rr=()=>f(RK.mr[0],RK.mr[1])*Math.max(sz,Math.min(RK.pass,fh/520));for(const s of [-1,1]){const r=Math.min(P.zone?rr():mr(),(fh/2-TERRAIN.lane/2-8)/1.2),y=s<0?top-r*.1:bot+r*.1;rockPair(r,mh(),y);if(rnd()<.6)rockMid(r*1.1,mh(),y)}
    // (a sized field (P.zone): its crags as big as its height asks (fh/520, at most RK.pass), and on along both edges: more pairs in
    // the middle and in the open ground behind each zone, so the valley still reads as one)
    if(P.zone){const za=P.zone[0];
      for(const s of [-1,1])for(let t=0;t<3;t++){const r=Math.min(rr(),(fh/2-TERRAIN.lane/2-8)/1.2),y=s<0?top+r*.15:bot-r*.15;if(t<2)rockPair(r,mh(),y);
        else for(let u=0;u<RK.tries;u++){const x=f(r+8,za-r-RK.pad),y2=clamp(y+(rnd()-.5)*2*TERRAIN.mirror,top-r,bot+r);if(za-r-RK.pad<r+8)break;if(rockFree(x,y,r)&&rockFree(W-x,y2,r)){P.rocks.push({x,y,r,h:mh()},{x:W-x,y:y2,r,h:mh()});break}}}}}
  else if(L==='saddle'){one(Rc.top);for(const s of [-1,1]){const r=mr()*.85;rockPair(r,mh(),s<0?top+r*.5:bot-r*.5)}}
  else if(L==='gorge'){const r=mr()*1.25,up=ly-top>bot-ly,y=up?Math.max(top+r*.5,P.lane.y0-r*1.35-4):Math.min(bot-r*.5,P.lane.y1+r*1.35+4);if(!rockMid(r,mh()+1,y))rockPair(r*.8,mh(),y);
    for(let i=0;i<2;i++)rockPair(f(RK.sr[0],RK.sr[1])*sz,f(RK.sh[0],RK.sh[1]),f(top+20,bot-20))}
  else if(TERRAIN_DENSE_LAYOUT[L])densePlan(P,L,rnd,W,top,bot,ly,X,Z,one,Rc);
  if(oasis&&Rc.oasis){const r=f(Rc.oasis[0],Rc.oasis[1]);P.marsh.push({x:W/2+(rnd()-.5)*W*.04,y:away(f(top,bot),r),r})}
  // (a larger field: its recipe's extra features, in mirrored pairs; a hillock keeps off the other hills)
  for(let i=0;i<Z.ex&&Rc.extra&&!P.dense;i++){const k=Rc.extra[i%Rc.extra.length];
    if(k==='copses')patches(P.woods,2,Rc.cr,[.08,.4]);else if(k==='marshes')patches(P.marsh,2,Rc.mr,[.08,.4]);
    else for(let t=0;t<8;t++){const r=(k==='dunes'?f(Rc.hr[0],Rc.hr[1]):f(50,80))*sz,rx=k==='dunes'?r*.5:r,ry=k==='dunes'?r*1.6:r,dx=Math.max(W*f(.1,.42),clr&&clr+rx*1.2),y=f(top+ry*.6,bot-ry*.6),y2=clamp(y+(rnd()-.5)*2*TERRAIN.mirror,top,bot);
      const ok=(x,yy)=>P.hills.every(h=>Math.hypot((x-h.x)/(h.rx+rx),(yy-h.y)/(h.ry+ry))>1.05)&&P.rocks.every(o=>Math.hypot(x-o.x,yy-o.y)>o.r+Math.max(rx,ry)+RK.hill);
      if(ok(W/2-dx,y)&&ok(W/2+dx,y2)){hill(W/2-dx,y,rx,ry,1).low=true;hill(W/2+dx,y2,rx,ry,1).low=true;break}}}
  // (a road on a field that is not dense: along its open lane, and on north to south too where the world's road goes on so)
  if(X.road&&!P.dense){P.ways=[{kind:'road',y:ly}];if(X.road.ns)P.ways.push({kind:'road',ns:true,x:W/2+(rnd()-.5)*TERRAIN.jit*W});P.wns=Math.floor(rnd()*65536)}
  if(X.edges)edgePlan(P,rnd,W,top,bot,X.edges,sz,clr,riv);
  return P}
// (every layout a recipe can have: the lab's choice)
const terrainLayouts=name=>{const R=TERRAIN_RECIPE[name];return R?[...new Set(['layouts','river','frost','elven','forest'].flatMap(k=>(R[k]||[]).map(l=>l[0])))]:[]};
/* a dense layout's plan (TERRAIN_DENSE_LAYOUT; laid on the cells by denseLay once the rivers and rock are known): P.dense {wood,
   marsh (the field's shares), scale (a stand's size, px), ns (its noise's seed), glades (each army's: {x,y,rx,ry,half}), clear
   (clearings: {x,y,r}), ways ([{kind: 'road'|'path'|'chain', y (where it crosses the middle: the lane's), ns (a road on north to
   south, at x), via (elven woods' second path: round by this share of the field's height)}]), edges (open neighbours thin the
   woods toward them: edgePlan)}. one: a centred hill (terrainPlan's) */
function densePlan(P,L,rnd,W,top,bot,ly,X,Z,one,Rc){
  const D=TERRAIN_DENSE,Lp=TERRAIN_DENSE_LAYOUT[L],G=D.glade,f=(a,b)=>a+(b-a)*rnd(),n=(a,b)=>a+Math.floor(rnd()*(b-a+1)),fh=bot-top,mid=(top+bot)/2,zw=zOut(P.zone,W),za=zIn(P.zone),sz=Z.sz;
  const d=P.dense={wood:(w=>X.frost?Math.max(Math.min(w,.5),w*D.frost):w)(f(Lp.wood[0],Lp.wood[1])),marsh:Lp.marsh?f(Lp.marsh[0],Lp.marsh[1]):0,scale:f(Lp.scale[0],Lp.scale[1])*sz,ns:Math.floor(rnd()*65536),glades:[],clear:[],ways:[],edges:{}};
  const gy=clamp(mid+(rnd()-.5)*fh*.2,top+fh*G.ry*.7,bot-fh*G.ry*.7),gx=za+(zw-za)*G.x,rx=(zw-za)*G.rx,ry=fh*G.ry;
  d.glades.push({x:gx,y:gy,rx,ry,half:0},{x:W-gx,y:clamp(gy+(rnd()-.5)*2*TERRAIN.mirror,top+fh*G.ry*.7,bot-fh*G.ry*.7),rx,ry,half:1});
  // (the way through: the world's road; else a deer path (a fen's causeway always) or a chain of clearings; elven woods have a
  // second path round the other way; a road that goes on north or south crosses the field too)
  d.ways.push({kind:X.road?'road':Lp.path||rnd()<D.pathP?'path':'chain',y:ly});
  if(X.road&&X.road.ns)d.ways.push({kind:'road',ns:true,x:W/2+(rnd()-.5)*TERRAIN.jit*W});
  if(Lp.paths>1)d.ways.push({kind:'path',y:ly,via:(ly<mid?1:-1)*f(.25,.32)});
  // (clearings in mirrored pairs between the glades and the middle, more on a larger field; a wide glade in the middle; a hill in
  // the woods with a clearing on its top; low dry hummocks in a fen)
  // (a short field (a phone's, the lab's) gets smaller clearings: k. A sized field's anywhere in the half but its deployment zone,
  // its open ground behind too, not crowded into the middle: outZ)
  const outZ=(x,r)=>x+r>za&&x-r<zw?(x<(za+zw)/2?Math.max(r+16,za-r):Math.min(W/2-r*.6,zw+r)):x;
  const ks=clamp(fh/520,.55,1),k=Math.round(n(Lp.clear[0],Lp.clear[1])*Z.A);d.ks=ks;for(let i=0;i<k;i++){const r=f(36,72)*sz*ks,lo=Math.min(zw*.95+r,W/2-r),hi=W/2-r*.6,dx=W/2-(P.zone?outZ(f(r+16,hi),r):f(lo,Math.max(lo,hi))),y=f(top+r*.5,bot-r*.5);
    d.clear.push({x:W/2-dx,y,r},{x:W/2+dx,y:clamp(y+(rnd()-.5)*2*TERRAIN.mirror,top,bot),r:r*(.95+.1*rnd())})}
  if(Lp.mid)d.clear.push({x:W/2,y:ly,r:fh*f(.16,.22)});
  if(Lp.hill){const h=one(1);h.rx*=.9;h.ry*=.9;d.clear.push({x:h.x,y:h.y,r:Math.min(h.rx,h.ry)*f(.3,.42)})}
  if(Lp.isles)for(let t=0;t<6;t++){const r=f(Rc.hr[0],Rc.hr[1])*sz,dx=W*f(.12,.24),y=f(top+r,bot-r),y2=clamp(y+(rnd()-.5)*2*TERRAIN.mirror,top+r,bot-r);
    if(Math.abs(y-ly)<r+TERRAIN.lane/2&&Math.abs(y2-ly)<r+TERRAIN.lane/2)continue;for(const [x,yy] of [[W/2-dx,y],[W/2+dx,y2]]){const h={x,y:yy,rx:r,ry:r*.8,top:1,low:true};P.hills.push(h);d.clear.push({x,y:yy,r:r*.8})}break}
  return d}
/* what the neighbours make of each side of the field (terrainEdges: E {n, s, w, e}; north the top, west the left). North and south
   shape their own edge: woods ('forest': copses along it, smaller in the deployment zones), a low ridge along it ('hills'),
   mountains in its middle stretch ('peaks', never in a zone), reed marsh on its shore ('water', 'marsh'). West and east would
   favour one army: they shape both ends alike (D5), at the zones' outer corners (woods, marsh; a low hill a corner; spires just
   off the zones). A dense field's open neighbour thins its woods toward it (P.dense.edges). A desert takes no woods, water or
   marsh from them (the owner). P.edges: what was laid, by side */
function edgePlan(P,rnd,W,top,bot,E,sz,clr,riv){
  const f=(a,b)=>a+(b-a)*rnd(),Zn=P.zone,zw=zOut(Zn,W),fh=bot-top,RK=TERRAIN_ROCK,dry=P.recipe==='desert';P.edges={};
  // (along a side's own zone, by its distance from the middle; at the zone's outer corners, a share in from its near side)
  const inZ=x=>Zn?x>W/2-Zn[1]&&x<W/2-Zn[0]:x>W/2-zw,inz=k=>Zn?Zn[0]+(Zn[1]-Zn[0])*k:zw*k;
  const rockOk=(x,y,r)=>(y+r*1.3<P.lane.y0||y-r*1.3>P.lane.y1)&&P.hills.every(h=>Math.hypot(x-h.x,y-h.y)>Math.max(h.rx,h.ry)*1.2+r+RK.hill)&&P.rocks.every(o=>Math.hypot(x-o.x,y-o.y)>o.r+r+24);
  for(const s of ['n','s','w','e']){const k=E[s];if(!k||dry&&(k==='forest'||k==='water'||k==='marsh'))continue;
    if(P.dense){if(k==='open'){P.dense.edges[s]='open';P.edges[s]=k}else if(k==='forest')continue}
    else if(k==='open')continue;
    if(s==='n'||s==='s'){const d=s==='n'?1:-1,y0=s==='n'?top:bot;
      if(k==='forest'||k==='water'||k==='marsh'){const L=k==='forest'?P.woods:P.marsh,r0=(k==='forest'?f(48,70):f(44,64))*sz,step=r0*(k==='marsh'?3:2.1);
        for(let x=step/2;x<W/2+r0;x+=step){const zr=inZ(x)?.75:1,r=r0*zr*(.9+.2*rnd()),y=y0+d*r*(k==='forest'?f(.15,.45):f(-.1,.2));L.push({x:W/2-x,y,r},{x:W/2+x+(rnd()-.5)*2*TERRAIN.mirror,y:y0+d*r*(k==='forest'?f(.15,.45):f(-.1,.2)),r})}}
      else if(k==='hills'){const ry=f(64,90)*sz*clamp(fh/520,.6,1);P.hills.push({x:W/2,y:y0,rx:W*f(.32,.4),ry,top:1,low:true,edge:s})}
      else if(k==='peaks'){const r=f(36,56)*sz,y=y0+d*r*.25,hi=zHi(Zn,W)-r-RK.pad,lo=Math.max(r+8,clr+r);
        for(let t=0;t<RK.tries&&hi>=lo;t++){const dx=f(lo,hi);if(rockOk(W/2-dx,y,r)&&rockOk(W/2+dx,y,r)){P.rocks.push({x:W/2-dx,y,r,h:f(4,6),edge:s},{x:W/2+dx,y,r,h:f(4,6),edge:s});break}}
        if(!riv&&rnd()<.5&&rockOk(W/2,y,r))P.rocks.push({x:W/2,y,r,h:f(4,6),edge:s})}}
    else{// (west, east: both ends alike)
      if(k==='forest'||k==='water'||k==='marsh'){const L=k==='forest'?P.woods:P.marsh;for(const yy of [top,bot]){const r=f(44,60)*sz,x=inz(f(.25,.6)),y=yy+(yy===top?1:-1)*r*f(.1,.35);L.push({x,y,r},{x:W-x+(rnd()-.5)*2*TERRAIN.mirror,y,r})}}
      else if(k==='hills'){const r=f(50,70)*sz,x=inz(f(.3,.6)),y=rnd()<.5?top+r*.8:bot-r*.8;P.hills.push({x,y,rx:r,ry:r*.85,top:1,low:true,edge:s},{x:W-x,y:clamp(y+(rnd()-.5)*2*TERRAIN.mirror,top,bot),rx:r,ry:r*.85,top:1,low:true,edge:s})}
      else if(k==='peaks'){for(let t=0;t<RK.tries;t++){const r=f(RK.sr[0],RK.sr[1])*sz,x=zw+r+RK.pad+f(0,40),y=f(top+r,bot-r);if(rockOk(x,y,r)&&rockOk(W-x,y,r)){P.rocks.push({x,y,r,h:f(RK.sh[0],RK.sh[1]),edge:s},{x:W-x,y,r,h:f(RK.sh[0],RK.sh[1]),edge:s});break}}}}
    P.edges[s]=k}
  return P}
/* phase 4's features on a plan, from a stream of their own (rnd: the rest of the field is as it was): its hills' cliffs (a lone
   hill's ramps face up or down the field, or one to each side: both armies reach them alike; a pair's are mirrored about the
   middle) and its rock (a mountain in the middle, or a mirrored pair; spires in mirrored pairs), off the deployment zones, the
   open lane, the hills and the river. frost: a frost field (more of both); crags: the lab's (TERRAIN_ROCK.crags' chances). P.rocks:
   [{x,y,r,h}] */
function featurePlan(P,rnd,W,top,bot,frost,crags){
  const Rc=TERRAIN_RECIPE[P.recipe]||TERRAIN_RECIPE.open,X=TERRAIN_ROCK,cl=crags?X.crags.cliff:Rc.cliff||[0,0],rk=crags?X.crags.rock:Rc.rock||[0,0],fm=frost?X.frost:1,fc=frost?X.frostCliff:1,f=(a,b)=>a+(b-a)*rnd(),PI=Math.PI;
  // (cliffs only on the hills that are no one's shoulders or edges: a lone one in the middle, or a mirrored pair)
  P.rocks=P.rocks||[];const H=P.hills.filter(h=>!h.low),HA=P.hills;
  if(H.length&&H.length<=2&&P.layout!=='dune'){const k=rnd(),c=k<cl[1]*fc?'oneway':k<(cl[0]+cl[1])*fc?'sheer':null,two=c==='sheer'&&rnd()<X.ramps2,j=()=>(rnd()-.5)*.3;
    if(c){const set=(h,ramps)=>{h.cliff=true;h.oneway=c==='oneway';h.ramps=ramps};
      if(H.length===1){const ns=rnd()<.5?PI/2:-PI/2;set(H[0],two?(rnd()<.5?[j(),PI+j()]:[PI/2+j(),-PI/2+j()]):[ns+j()])}
      else{const a=rnd()*2*PI,b=two?a+PI*(.6+.8*rnd()):null,L=H[0].x<H[1].x?H[0]:H[1],Rt=L===H[0]?H[1]:H[0],m=v=>PI-v;set(L,b==null?[a]:[a,b]);set(Rt,b==null?[m(a)]:[m(a),m(b)])}}}
  const RV=TERRAIN_RIVER,riv=(P.rivers||[]).length>0,clr=riv?RV.half+RV.meander+RV.jit*W/2+RV.clear:0,lane=P.lane,cen=!riv&&!HA.some(h=>Math.abs(h.x-W/2)<W*TERRAIN.centre);
  // (a spot for rock of radius r: in the field, off the open lane, the hills and other rock)
  const free=(x,y,r)=>y>=top&&y<=bot&&(!lane||y+r*1.3<lane.y0||y-r*1.3>lane.y1)&&HA.every(h=>Math.hypot(x-h.x,y-h.y)>Math.max(h.rx,h.ry)*1.2+r+X.hill)&&P.rocks.every(o=>Math.hypot(x-o.x,y-o.y)>o.r+r+24);
  // (in the middle, or a mirrored pair: between the river's clearing and the deployment zones)
  const place=(r,h,mid)=>{const hi=zHi(P.zone,W)-r-X.pad,lo=Math.max(r+8,clr+r);
    for(let t=0;t<X.tries;t++){const y=f(top+r*.4,bot-r*.4);
      if(mid){const x=W/2+(rnd()-.5)*TERRAIN.jit*W;if(free(x,y,r)){P.rocks.push({x,y,r,h});return true}continue}
      if(hi<lo)return false;const dx=f(lo,hi),y2=clamp(y+(rnd()-.5)*2*TERRAIN.mirror,top,bot);if(free(W/2-dx,y,r)&&free(W/2+dx,y2,r)){P.rocks.push({x:W/2-dx,y,r,h},{x:W/2+dx,y:y2,r,h:h*(.9+.2*rnd())});return true}}return false};
  if(rnd()<rk[0]*fm){const r=f(X.mr[0],X.mr[1]),h=f(X.mh[0],X.mh[1]);if(!(cen&&rnd()<.5&&place(r*1.2,h,true)))place(r,h,false)}
  if(rnd()<(P.spires?1:rk[1]*fm)){const n=X.spires[0]+Math.floor(rnd()*(X.spires[1]-X.spires[0]+1));for(let i=0;i<n;i++)place(f(X.sr[0],X.sr[1]),f(X.sh[0],X.sh[1]),false);if(cen&&rnd()<X.mid)place(f(X.sr[0],X.sr[1]),f(X.sh[0],X.sh[1]),true)}
  return P}
/* a river's plan (rv: terrainAt's river spec): its middle by cell row (a gentle meander about BW/2), its crossings (the first in
   the open lane: the cavalry's road over; a road bridge's is the bridge), fair by construction (terrainFair checks it):
   {x,path,half,crossings,deep,frozen,stream,bridge}; rasterTerrain adds each row's water (sp0, sp1) and its band (x0, x1) */
function riverPlan(rv,rnd,W,top,bot,lane,H=BH){
  const V=TERRAIN_RIVER,cs=TERRAIN.cs,R=Math.ceil(H/cs),f=(a,b)=>a+(b-a)*rnd(),x=W/2+(rnd()-.5)*V.jit*W,a1=V.meander*f(.45,.7),a2=V.meander*.3*rnd(),k1=f(.5,1.2)*2*Math.PI/R,k2=f(1.6,2.6)*2*Math.PI/R,p1=rnd()*2*Math.PI,p2=rnd()*2*Math.PI;
  const path=Array.from({length:R},(_,r)=>x+a1*Math.sin(k1*r+p1)+a2*Math.sin(k2*r+p2)),deep=!rv.frozen&&!rv.stream;
  // (hold the bridge (rv.hold, setup.js BTYPE): one bridge, in the open lane near the middle (whole cells inside the edges); with
  // rv.ford a ford far off it too, at the field's far end from it, BTYPE.fordGap px of ground between at least, else none (a short
  // field has no room for one))
  if(rv.hold){const lo=Math.ceil((top+V.edge)/cs)*cs,hi=Math.floor((bot-V.edge)/cs)*cs,w=V.bridge,f=V.ford,m=lane?(lane.y0+lane.y1)/2:(top+bot)/2,y0=clamp(Math.round((m+(rnd()-.5)*(bot-top)*BTYPE.bridgeY-w/2)/cs)*cs,lo,hi-w);
    const cr=[{kind:'bridge',y0,y1:y0+w,w,y:y0+w/2}];let gap=V.gap;
    if(rv.ford&&deep){const up=y0-lo>hi-y0-w,fy=up?Math.ceil(lo/cs)*cs:Math.floor((hi-f)/cs)*cs,g=up?y0-fy-f:fy-y0-w;if(g>=BTYPE.fordGap){cr.push({kind:'ford',y0:fy,y1:fy+f,w:f,y:fy+f/2});gap=g}}
    return riverStraight({x,path,half:V.half,crossings:cr,deep,frozen:!!rv.frozen,stream:false,bridge:true,hold:true,gap})}
  const kinds=rv.bridge?['bridge',...(deep?['ford']:[])]:deep?Array(V.fords[0]+Math.floor(rnd()*(V.fords[1]-V.fords[0]+1))).fill('ford'):[],lo=top+V.edge,hi=bot-V.edge,cr=[];
  // (the ground between crossings: gap, or on a short field what there is room for (minGap at least))
  const gap=kinds.length>1?clamp(Math.floor((hi-lo-kinds.reduce((a,k)=>a+V[k],0))/(kinds.length-1)/cs)*cs-cs,V.minGap,V.gap):V.gap;
  kinds.forEach((k,j)=>{const w=V[k];let y=null;
    for(let t=0;t<24&&y==null;t++){const m=j===0&&lane&&t<8?(lane.y0+lane.y1)/2+(rnd()-.5)*Math.max(0,TERRAIN.lane-w):f(lo+w/2,hi-w/2),y0=Math.round((m-w/2)/cs)*cs;
      if(y0>=lo&&y0+w<=hi&&cr.every(o=>y0>=o.y1+gap||y0+w<=o.y0-gap))y=y0}
    if(y!=null)cr.push({kind:k,y0:y,y1:y+w,w,y:y+w/2})});
  // (not all fitted round the lane's (a short field): all packed from one end instead, gap apart)
  if(cr.length<kinds.length){cr.length=0;let y=Math.ceil(lo/cs)*cs;for(const k of rnd()<.5?kinds:kinds.slice().reverse()){const w=V[k];if(y+w>hi)break;cr.push({kind:k,y0:y,y1:y+w,w,y:y+w/2});y=Math.ceil((y+w+gap)/cs)*cs}}
  return riverStraight({x,path,half:rv.stream?V.stream:V.half,crossings:cr,deep,frozen:!!rv.frozen,stream:!!rv.stream,bridge:!!rv.bridge,gap})}
// (straight across each crossing: its rows share the middle of its own; sorted top to bottom)
function riverStraight(v){const cs=TERRAIN.cs,R=v.path.length;v.crossings.sort((a,b)=>a.y-b.y);
  for(const c of v.crossings){const m=v.path[clamp(Math.floor(c.y/cs),0,R-1)];for(let r=Math.max(0,Math.floor(c.y0/cs));r<Math.min(R,Math.ceil(c.y1/cs));r++)v.path[r]=m;c.x=m}return v}
// a lab's river ({x: share of the field, meander: px, crossings: [{kind, y: share, w: px}], frozen, stream})
function riverExplicit(g,W,H=BH){const V=TERRAIN_RIVER,cs=TERRAIN.cs,R=Math.ceil(H/cs),x=g.x*W,a=g.meander||0;
  const cr=(g.crossings||[]).map(c=>{const w=c.w||V[c.kind],y0=Math.round((c.y*H-w/2)/cs)*cs;return{kind:c.kind,y0,y1:y0+w,w,y:y0+w/2}});
  return riverStraight({x,path:Array.from({length:R},(_,r)=>x+a*Math.sin(r*1.6*Math.PI/R)),half:g.stream?V.stream:V.half,crossings:cr,deep:!g.frozen&&!g.stream,frozen:!!g.frozen,stream:!!g.stream,bridge:cr.some(c=>c.kind==='bridge')})}
// a lab's own features (fractions of the field; r in px): no fairness checks; road: a road over them (true: west to east at the
// middle, a share: at that height, 'ns': on north to south too), laid as any (wayPlan)
// (phase 4: a hill's cliff (true: sheer all round), oneway (cliffs dropped down, never climbed), ramps (degrees, screen y down: 0
// east, 90 south; one at 90 when none is given); rocks {x, y, r, h (its peak, levels: TERRAIN_ROCK.mh's middle when not given)})
function terrainExplicit(g,W,H=BH){const sc=(l,k)=>(l||[]).map(p=>k?{x:p.x*W,y:p.y*H,rx:p.rx||p.r,ry:p.ry||p.r,top:p.top||1,...(p.cliff||p.oneway?{cliff:true,oneway:!!p.oneway,ramps:(p.ramps||[90]).map(a=>a*Math.PI/180)}:{})}:{x:p.x*W,y:p.y*H,r:p.r});
  return{recipe:'lab',H,hills:sc(g.hills,1),woods:sc(g.woods),marsh:sc(g.marsh),rocks:(g.rocks||[]).map(p=>({x:p.x*W,y:p.y*H,r:p.r,h:p.h||Math.round((TERRAIN_ROCK.mh[0]+TERRAIN_ROCK.mh[1])/2)})),rivers:(g.rivers||[]).map(v=>riverExplicit(v,W,H)),layout:'lab',lane:null,...(g.road?{ways:[{kind:'road',y:H*(typeof g.road==='number'?g.road:.5)},...(g.road==='ns'?[{kind:'road',ns:true,x:W/2}]:[])],wns:(g.seed|0)&65535}:{})}}
/* an ambush's field (setup.js ambushLayout: spec.ambush {road: [y0, y1], woods: [{x, y, r}], ridges: [{x, y, rx, ry}]}, field px): a
   road down the middle kept clear (rasterTerrain clears its rows of wood), and the cover beside it, woods or low ridges, round
   where the men lying in wait stand; no fairness checks (the ambush is the point) */
function ambushPlan(spec,W){const A=spec.ambush;
  return{recipe:spec.recipe||'open',layout:'ambush',hills:A.ridges.map(h=>({...h,top:1})),woods:A.woods.map(p=>({...p})),marsh:[],rocks:[],rivers:[],lane:{y0:A.road[0],y1:A.road[1]},road:A.road.slice()}}
// the plan laid on the grid: levels and kinds by cell centre (ragged edges from seeded noise), then the slope bands and their uphill
function rasterTerrain(W,plan,seed){
  const cs=TERRAIN.cs,C=Math.ceil(W/cs),R=Math.ceil((plan.H||BH)/cs),N=C*R,kind=new Uint8Array(N),lvl=new Uint8Array(N),up=new Int8Array(N).fill(-1),own=new Int8Array(N).fill(-1),ns=seed%997;
  plan.hills.forEach((h,k)=>{const c0=Math.max(0,Math.floor((h.x-h.rx*1.2)/cs)),c1=Math.min(C-1,Math.floor((h.x+h.rx*1.2)/cs)),r0=Math.max(0,Math.floor((h.y-h.ry*1.2)/cs)),r1=Math.min(R-1,Math.floor((h.y+h.ry*1.2)/cs));
    for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const i=r*C+c,x=(c+.5)*cs,y=(r+.5)*cs,ex=(x-h.x)/h.rx,ey=(y-h.y)/h.ry,d=Math.sqrt(ex*ex+ey*ey)*(1+.3*(noise(x/48,y/48,ns+k*7)-.5));
      const L=h.top>1&&d<TERRAIN.top2?2:d<1?1:0;if(L>lvl[i]){lvl[i]=L;own[i]=k}}});
  for(const [list,K] of [[plan.woods,TKIND.wood],[plan.marsh,TKIND.marsh]])list.forEach((p,k)=>{const e=p.r*1.3,c0=Math.max(0,Math.floor((p.x-e)/cs)),c1=Math.min(C-1,Math.floor((p.x+e)/cs)),r0=Math.max(0,Math.floor((p.y-e)/cs)),r1=Math.min(R-1,Math.floor((p.y+e)/cs));
    for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const x=(c+.5)*cs,y=(r+.5)*cs;if(Math.hypot(x-p.x,y-p.y)/p.r*(1+.5*(noise(x/40,y/40,ns+50+K*20+k*3)-.5))<1)kind[r*C+c]=K}});
  // (an ambush's road: its rows open ground, edge to edge)
  if(plan.road)for(let r=Math.max(0,Math.floor(plan.road[0]/cs));r<Math.min(R,Math.ceil(plan.road[1]/cs));r++)kind.fill(0,r*C,r*C+C);
  // (rock (phase 4): ragged as woods are, its middle cell always; its height falls from the peak toward its rim)
  let rockH=null;(plan.rocks||[]).forEach((p,k)=>{const e=p.r*1.3,c0=Math.max(0,Math.floor((p.x-e)/cs)),c1=Math.min(C-1,Math.floor((p.x+e)/cs)),r0=Math.max(0,Math.floor((p.y-e)/cs)),r1=Math.min(R-1,Math.floor((p.y+e)/cs));rockH=rockH||new Uint8Array(N);
    const put=(i,d)=>{kind[i]=TKIND.rock;rockH[i]=Math.max(rockH[i],1,Math.min(255,Math.round(p.h*(1-.45*Math.min(1,d)))))};
    for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const x=(c+.5)*cs,y=(r+.5)*cs,d=Math.hypot(x-p.x,y-p.y)/p.r*(1+.4*(noise(x/32,y/32,ns+90+k*5)-.5));if(d<1)put(r*C+c,d)}
    put(clamp(Math.floor(p.y/cs),0,R-1)*C+clamp(Math.floor(p.x/cs),0,C-1),0)});
  // (rivers over all: deep water (or ford, frozen or a stream), crossings' rows ford or bridge, level 0; a crossing's mouths cleared)
  for(const v of plan.rivers||[]){const sp0=new Int16Array(R).fill(-1),sp1=new Int16Array(R).fill(-1);let lo=1e9,hi=-1e9;
    for(let r=0;r<R;r++){const y=(r+.5)*cs,m=v.path[r],xc=v.crossings.find(c=>y>=c.y0&&y<c.y1),K=xc?(xc.kind==='bridge'?TKIND.bridge:TKIND.ford):v.deep?TKIND.deep:TKIND.ford;
      // (always 2·half/cs cells wide: 3 for a river, 2 for a stream)
      let a=Math.max(0,Math.round((m-v.half)/cs)),b=Math.min(C-1,a+Math.round(2*v.half/cs)-1);for(let c=a;c<=b;c++){const i=r*C+c;kind[i]=K;lvl[i]=0}
      if(a>b)continue;sp0[r]=a*cs;sp1[r]=(b+1)*cs;lo=Math.min(lo,a*cs);hi=Math.max(hi,(b+1)*cs);
      if(xc)for(const c of [a-1,b+1])if(c>=0&&c<C&&(kind[r*C+c]===TKIND.wood||kind[r*C+c]===TKIND.marsh))kind[r*C+c]=0}
    v.sp0=sp0;v.sp1=sp1;v.x0=lo;v.x1=hi;for(const c of v.crossings){const r=clamp(Math.floor(c.y/cs),0,R-1);c.x0=sp0[r];c.x1=sp1[r]}}
  const S=TERRAIN.slope;
  // (a slope cell: one with ground k cells off at least ceil(k/S) levels lower: S cells in from a rim a level down, 2S where it drops two)
  for(let r=0;r<R;r++)for(let c=0;c<C;c++){const i=r*C+c,L=lvl[i];if(!L)continue;let low=false;const E=S*L;
    for(let rr=Math.max(0,r-E);rr<=Math.min(R-1,r+E)&&!low;rr++)for(let cc=Math.max(0,c-E);cc<=Math.min(C-1,c+E);cc++)if(lvl[rr*C+cc]<=L-Math.max(1,Math.ceil(Math.max(Math.abs(rr-r),Math.abs(cc-c))/S))){low=true;break}
    if(low){const h=plan.hills[own[i]],x=(c+.5)*cs,y=(r+.5)*cs,gx=(x-h.x)/(h.rx*h.rx),gy=(y-h.y)/(h.ry*h.ry);up[i]=((Math.round(Math.atan2(-gy,-gx)/(Math.PI/4))%8)+8)%8}}
  /* (cliffs, phase 4: each side of a cliffed hill's cell over which the ground falls to a lower level is a cliff, but where its
     middle lies in one of the hill's ramps (a band TERRAIN_ROCK.ramp wide from the hill's middle out at the ramp's angle): its bit
     on the low cell (no step up), and on the high one too unless the hill is one-way (route.js's bits: E 1, S 2, W 4, N 8)) */
  let wall=null;const DC=[1,0,-1,0],DR=[0,1,0,-1],hw=TERRAIN_ROCK.ramp/2,inRamp=(h,x,y)=>h.ramps.some(a=>{const dx=x-h.x,dy=y-h.y,ca=Math.cos(a),sa=Math.sin(a);return dx*ca+dy*sa>0&&Math.abs(dy*ca-dx*sa)<=hw});
  if(plan.hills.some(h=>h.cliff))for(let r=0;r<R;r++)for(let c=0;c<C;c++){const i=r*C+c,L=lvl[i],h=L?plan.hills[own[i]]:null;if(!h||!h.cliff)continue;
    for(let q=0;q<4;q++){const c2=c+DC[q],r2=r+DR[q];if(c2<0||r2<0||c2>=C||r2>=R)continue;const j=r2*C+c2;if(lvl[j]>=L||inRamp(h,(c+.5+DC[q]*.5)*cs,(r+.5+DR[q]*.5)*cs))continue;
      wall=wall||new Uint8Array(N);wall[j]|=1<<((q+2)&3);if(!h.oneway)wall[i]|=1<<q}}
  const T={cs,C,R,kind,lvl,up};if(plan.zone)T.zone=plan.zone;if(wall)T.wall=wall;if(rockH)T.rockH=rockH;if(plan.dense||plan.ways)denseLay(T,plan);return T}
/* ---- the ways laid like real ones (TERRAIN_WAY; denseLay lays each road, path and chain of clearings with wayPlan) ---- */
// (a way's cost grid over T (route.js's: 0 closed): rows r0..r1 by TERRAIN_WAY[k], the rest closed; deep water and rock closed;
// cliffs closed both ways; ns: its noise's seed; a dense plan's stands-to-be (its woods' noise as denseLay lays them) dear as woods)
function wayGrid(T,P,k,ns,r0,r1){
  const X=TERRAIN_WAY[k],{cs,C,R,kind,lvl,up}=T,N=C*R,g=routeGrid(C,R,cs),D=P.dense,S=D&&D.scale;
  for(let r=0;r<R;r++)for(let c=0;c<C;c++){const i=r*C+c,K=kind[i];if(r<r0||r>r1||K===TKIND.deep||K===TKIND.rock){g.cost[i]=0;continue}
    const x=(c+.5)*cs,y=(r+.5)*cs,L=lvl[i];let v=X.u*(1+X.soft*clamp((noise(x/X.n,y/X.n,ns+3)*.65+noise(x/(X.n*.4),y/(X.n*.4),ns+4)*.35-.3)*2.5,0,1))+L*X.lvl;
    if(K===TKIND.wood)v+=X.wood;else if(K===TKIND.marsh)v+=X.marsh;else if(K===TKIND.ford)v+=X.ford;
    if(S)v+=X.wood*clamp((noise(x/S,y/S,D.ns+1)*.62+noise(x/(S*.42),y/(S*.42),D.ns+2)*.38-.42)*3,0,1);
    if(up[i]>=0)v+=X.slope;else if(!L&&(c>0&&lvl[i-1]||c<C-1&&lvl[i+1]||r>0&&lvl[i-C]||r<R-1&&lvl[i+C]))v+=X.foot;
    g.cost[i]=Math.min(254,Math.max(1,Math.round(v)))}
  if(T.wall){const w=T.wall;g.wall.set(w);for(let i=0;i<N;i++){const b=w[i];if(!b)continue;const c=i%C;if(b&1&&c<C-1)g.wall[i+1]|=4;if(b&4&&c>0)g.wall[i-1]|=1;if(b&2&&i+C<N)g.wall[i+C]|=8;if(b&8&&i>=C)g.wall[i-C]|=2}}
  return g}
// (the least-cost cells from a to b (field px) on grid g: [[x,y,i]...] their middles and indices; null when b is out of reach)
function wayCells(g,a,b){routePrep(g);const s=routeNear(g,routeIx(g,a[0],a[1])),t=routeNear(g,routeIx(g,b[0],b[1]));if(s<0||t<0)return null;
  const L=routeSearch(g,s,t,g.C*g.R*4),W=ROUTE_WS,C=g.C,cs=g.cs,out=[];if(W.end!==t)return null;
  for(let k=0;k<L;k++){const i=W.path[k],c=i%C;out.push([(c+.5)*cs,((i-c)/C+.5)*cs,i])}return out}
/* a way's line (k: 'road' or 'path', TERRAIN_WAY): the least-cost cells through pts (its ends, off the field where it comes in from
   an edge, and the points it passes: the glades), loops cut, pinned straight over a deep river's crossing on it (cr: from 56 px off
   one mouth to 56 px off the other); simplified to within eps (Douglas-Peucker, pins kept) and smoothed (Chaikin, thrice),
   resampled every 4 px; swayed across its line by seeded noise (TERRAIN_WAY amp, its wavelength stretched and squeezed by noise of
   its own, its strength by an envelope that dies away: straight stretches; a path's finer wobble on top; no sine), none near an
   end or a pin. Each sample is kept in the corridor (a cell within band cells of the least-cost ones and like them: kind, level,
   slope; no cliff crossed between samples): its sway eased where it strays, the line simplified less where the smoothing strays,
   the least-cost cells themselves at worst. An end off the field: the cheapest cell on that edge near it, the line carried straight
   on out unless rock or deep water lies there. [[x,y]...] (fall: true when cliffs had to be crossed to get through at all: none
   seen), or null (no way through) */
function wayPlan(T,P,k,pts,rnd,ns,r0,r1,cr){
  const X=TERRAIN_WAY[k],{cs,C,R,kind,lvl,up}=T,FW=P.W,FH=P.H,f=(a,b)=>a+(b-a)*rnd();let g=wayGrid(T,P,k,ns,r0,r1),fall=false;
  const off=q=>q[0]<0||q[0]>=FW||q[1]<0||q[1]>=FH;
  const snap=q=>{if(!off(q))return q;const ew=q[0]<0||q[0]>=FW;let b=null,bs=1e9;
    for(let d=-6;d<=6;d++){const c=ew?(q[0]<0?0:C-1):clamp(Math.floor(q[0]/cs),0,C-1)+d,r=ew?clamp(Math.floor(q[1]/cs),r0,r1)+d:q[1]<0?r0:r1;if(c<0||c>=C||r<r0||r>r1)continue;
      const v=g.cost[r*C+c],s=v+Math.abs(d)*X.u*.6;if(v&&s<bs){bs=s;b=[(c+.5)*cs,(r+.5)*cs]}}return b};
  const A=snap(pts[0]),Z=snap(pts[pts.length-1]);if(!A||!Z)return null;
  const via=[A,...pts.slice(1,-1),Z];let raw=[];
  for(let j=0;j<via.length-1;j++){let c=wayCells(g,via[j],via[j+1]);
    // (no way through without crossing a cliff (none seen): the cliffs as the foot's, then none)
    if(!c){for(const w of [T.wall,null]){const g2=wayGrid(T,P,k,ns,r0,r1);g2.wall.fill(0);if(w)g2.wall.set(w);c=wayCells(g2,via[j],via[j+1]);if(c){fall=true;break}}if(!c)return null}
    if(raw.length)c.shift();for(const q of c)raw.push(q)}
  // (loops cut: a cell met again takes the way back to where it was first)
  {const at=new Map(),o=[];for(const q of raw){const j=at.get(q[2]);if(j!=null){for(let m=j+1;m<o.length;m++)at.delete(o[m][2]);o.length=j+1;continue}at.set(q[2],o.length);o.push(q)}raw=o}
  // (the corridor: each cell within band of a least-cost one takes the kinds, levels and slope seen there)
  const M=new Uint16Array(C*R),Bd=X.band,mk=i=>{const c0=i%C,r0_=(i-c0)/C,m=1<<kind[i]|256<<lvl[i]|(up[i]>=0?2048:0);for(let r=Math.max(0,r0_-Bd);r<=Math.min(R-1,r0_+Bd);r++)for(let c=Math.max(0,c0-Bd);c<=Math.min(C-1,c0+Bd);c++)M[r*C+c]|=m};
  for(const q of raw)mk(q[2]);
  // (a deep river's crossing on it: pinned straight over, the way's cells near either mouth dropped)
  let Q=raw.map(q=>[q[0],q[1],0]);
  for(const c of cr||[]){let ia=-1,ib=-1;Q.forEach((q,j)=>{if(q[1]>=c.y0&&q[1]<c.y1&&q[0]>=c.x0&&q[0]<c.x1){if(ia<0)ia=j;ib=j}});if(ia<0)continue;
    const d=(ia>0?Q[ia-1][0]<c.x0:Q[ib][0]>Q[ia][0])?1:-1,m0=d>0?c.x0:c.x1,m1=d>0?c.x1:c.x0;let i0=ia,i1=ib;
    while(i0>0&&Math.hypot(Q[i0-1][0]-m0,Q[i0-1][1]-c.y)<64)i0--;while(i1<Q.length-1&&Math.hypot(Q[i1+1][0]-m1,Q[i1+1][1]-c.y)<64)i1++;
    Q.splice(i0,i1-i0+1,[m0-d*56,c.y,1],[m0-d*24,c.y,1],[m1+d*24,c.y,1],[m1+d*56,c.y,1]);for(let x=m0-d*56;d*(m1+d*56-x)>=0;x+=d*4)mk(tIx(T,x,c.y))}
  const okC=i=>{const m=M[i];return g.cost[i]>0&&(m&1<<kind[i])&&(m&256<<lvl[i])&&(up[i]<0||m&2048)};
  const valid=(L,bad)=>{let ok=true,pi=-1;for(let j=0;j<L.length;j++){const x=L[j][0],y=L[j][1],i=routeIx(g,x,y);
    if(!okC(i)||j&&i!==pi&&!routeWalk(g,L[j-1][0],L[j-1][1],x,y,255)){ok=false;if(!bad)return false;bad.push(j)}pi=i}return ok};
  // (simplified (the pins and ends kept), smoothed, resampled every 4 px: the base line)
  const base=eps=>{const keep=[0],rdp=(a,b)=>{let w=-1,wd=eps;const ax=Q[a][0],ay=Q[a][1],dx=Q[b][0]-ax,dy=Q[b][1]-ay,l2=dx*dx+dy*dy;
      for(let j=a+1;j<b;j++){const t=l2?clamp(((Q[j][0]-ax)*dx+(Q[j][1]-ay)*dy)/l2,0,1):0,e=Math.hypot(Q[j][0]-ax-dx*t,Q[j][1]-ay-dy*t);if(e>wd){wd=e;w=j}}
      if(w>=0){rdp(a,w);keep.push(w);rdp(w,b)}};
    for(let j=1;j<Q.length;j++)if(Q[j][2]||j===Q.length-1){rdp(keep[keep.length-1],j);keep.push(j)}
    let L=keep.map(j=>Q[j]);for(let it=0;it<3&&L.length>2;it++){const o=[L[0]];for(let j=0;j<L.length-1;j++){const a=L[j],b=L[j+1];o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}o.push(L[L.length-1]);L=o}
    const out=[[L[0][0],L[0][1]]];let need=4;for(let j=0;j<L.length-1;j++){const a=L[j],b=L[j+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);let t=need;while(t<=l){out.push([a[0]+(b[0]-a[0])*t/l,a[1]+(b[1]-a[1])*t/l]);t+=4}need=t-l}
    const e=L[L.length-1];if(Math.hypot(e[0]-out[out.length-1][0],e[1]-out[out.length-1][1])>.5)out.push([e[0],e[1]]);return out};
  let B=null;if(fall)B=base(X.eps);else for(const e of [X.eps,X.eps*.5,6,0]){const b=base(e);if(valid(b)){B=b;break}}
  let line=B;
  if(!B)line=raw.map(q=>[q[0],q[1]]);// (the least-cost cells' middles: always in the corridor)
  else if(!fall){// (the sway: across the line, its arc length s; eased (sc) where it strays from the corridor)
    const n=B.length,lam=f(X.lam[0],X.lam[1]),wl=f(X.wl[0],X.wl[1]),S=new Float32Array(n),pin=[];
    for(let j=1;j<n;j++)S[j]=S[j-1]+Math.hypot(B[j][0]-B[j-1][0],B[j][1]-B[j-1][1]);
    for(const q of Q)if(q[2]){let bj=0,bd=1e9;for(let j=0;j<n;j++){const d=Math.hypot(B[j][0]-q[0],B[j][1]-q[1]);if(d<bd){bd=d;bj=j}}pin.push(S[bj])}
    const sw=new Float32Array(n),nx=new Float32Array(n),ny=new Float32Array(n),sm=t=>t*t*(3-2*t);
    for(let j=0;j<n;j++){const s=S[j],a=B[Math.max(0,j-2)],b=B[Math.min(n-1,j+2)],tl=Math.hypot(b[0]-a[0],b[1]-a[1])||1;nx[j]=-(b[1]-a[1])/tl;ny[j]=(b[0]-a[0])/tl;
      let dm=Math.min(s,S[n-1]-s);for(const p of pin)dm=Math.min(dm,Math.abs(s-p));
      const u=s/lam+.9*noise(s/(lam*2.6),4.5,ns+17),env=.3+.7*sm(clamp((noise(s/X.env,6.5,ns+19)-.3)/.4,0,1));
      sw[j]=(X.amp*env*(2*noise(u,.5,ns+11)-1)+X.wob*(2*noise(s/wl,2.5,ns+13)-1))*clamp((dm-X.hold)/64,0,1)}
    const sc=new Float32Array(n).fill(1);line=null;
    for(let it=0;it<8&&!line;it++){const L=B.map((p,j)=>[p[0]+nx[j]*sw[j]*sc[j],p[1]+ny[j]*sw[j]*sc[j]]),bad=[];if(valid(L,bad)){line=L;break}
      for(const j of bad){const v=it<5?sc[j]*.5:0;for(let q=Math.max(0,j-14);q<=Math.min(n-1,j+14);q++){const w=Math.abs(q-j)/15;sc[q]=Math.min(sc[q],v+(1-v)*w*w)}}}
    if(!line)line=B}
  // (carried straight out to an end off the field, unless rock or deep water lies on the way)
  const ext=(e,q,at0)=>{if(!off(e))return;const o=[],l=Math.hypot(e[0]-q[0],e[1]-q[1]),ex=e[0]<0||e[0]>=FW?[e[0],q[1]]:[q[0],e[1]];
    for(let t=4;t<=l+.01;t+=4){const x=q[0]+(ex[0]-q[0])*t/l,y=q[1]+(ex[1]-q[1])*t/l,K=kind[tIx(T,x,y)];if(K===TKIND.rock||K===TKIND.deep)return;o.push([x,y])}
    if(at0)line.unshift(...o.reverse());else line.push(...o)};
  ext(pts[0],line[0],true);ext(pts[pts.length-1],line[line.length-1],false);
  // (the points kept for the AI and the art: every 4th (16 px), rounded, closer where a chord between them would cut a cliff's corner)
  const R0=q=>[Math.round(q[0]),Math.round(q[1])],kept=[R0(line[0])];for(let j=0;j<line.length-1;){let k=Math.min(line.length-1,j+4);if(!fall)while(k>j+1&&!routeWalk(g,kept[kept.length-1][0],kept[kept.length-1][1],...R0(line[k]),255))k--;kept.push(R0(line[k]));j=k}
  line.kept=kept;if(fall)line.fall=true;return line}
/* a dense plan laid on the grid (rasterTerrain, once the hills, rock and rivers are down): its glades, clearings and ways kept open
   (a crossing's mouths too), the ways' cells marked (T.road: 1 a road, 2 a deer path or causeway); then the woods (and then the
   marsh) by the highest cells of seeded noise, so many in each half's deployment zone (the field's share ×(1-zoneLess)) and middle
   (the rest; what a band cannot hold goes to the other), the same for both halves; an open neighbour thins them toward its side.
   Each way is laid like a real one (wayPlan: the least-cost line, over deep water only at a crossing). T.dense: {wood, marsh, glades, clear, ways: [{kind, p: [[x,y]...]}]}
   for the fairness checks, the AI, the text and the art. A field that is not dense but has a road (P.ways, P.wns) gets the road
   alone, edge to edge near its open lane's height (its verges cleared of woods and marsh); T.ways either way */
function denseLay(T,P){
  const D=P.dense||{glades:[],clear:[],ways:P.ways,edges:{},ns:P.wns},DT=TERRAIN_DENSE,{cs,C,R,kind}=T,N=C*R,W=P.W,top=P.top,bot=P.bot,fh=bot-top,Zn=P.zone,zw=zOut(Zn,W),r0=clamp(Math.floor(top/cs),0,R-1),r1=clamp(Math.floor((bot-1)/cs),0,R-1),ns=D.ns,rnd=seeded((Math.imul(ns,2654435761)+7)>>>0),f=(a,b)=>a+(b-a)*rnd();
  const keep=new Uint8Array(N),road=new Uint8Array(N);let anyRoad=false;
  const box=(x,y,e,fn)=>{const c0=Math.max(0,Math.floor((x-e)/cs)),c1=Math.min(C-1,Math.floor((x+e)/cs)),a0=Math.max(0,Math.floor((y-e)/cs)),a1=Math.min(R-1,Math.floor((y+e)/cs));for(let r=a0;r<=a1;r++)for(let c=c0;c<=c1;c++)fn(r*C+c,(c+.5)*cs,(r+.5)*cs)};
  const blob=(x,y,rx,ry,k)=>{const c0=Math.max(0,Math.floor((x-rx*1.3)/cs)),c1=Math.min(C-1,Math.floor((x+rx*1.3)/cs)),a0=Math.max(0,Math.floor((y-ry*1.3)/cs)),a1=Math.min(R-1,Math.floor((y+ry*1.3)/cs));
    for(let r=a0;r<=a1;r++)for(let c=c0;c<=c1;c++){const px=(c+.5)*cs,py=(r+.5)*cs;if(Math.hypot((px-x)/rx,(py-y)/ry)*(1+.4*(noise(px/40,py/40,ns+k)-.5))<1)keep[r*C+c]=1}};
  D.glades.forEach((g,k)=>blob(g.x,g.y,g.rx,g.ry,11+k));D.clear.forEach((g,k)=>blob(g.x,g.y,g.r,g.r,31+k));
  for(let i=0;i<N;i++)if(kind[i]===TKIND.ford||kind[i]===TKIND.bridge){const c=i%C;if(c>0)keep[i-1]=1;if(c<C-1)keep[i+1]=1}
  // (the ways: each laid like a real one (wayPlan: the least-cost line over the ground, smoothed, swaying in its corridor, straight
  // over a crossing), sampled every 4 px; in from the edges the world's road crosses (west and east; north and south for one that
  // goes on so), through both glades)
  const rv=(P.rivers||[]).find(v=>v.deep),cr=rv?rv.crossings:[],ways=[],wr0=clamp(Math.floor(top/cs)+1,0,R-1),wr1=clamp(Math.floor((bot-1)/cs)-1,0,R-1),lvl=T.lvl,up=T.up,wl=T.wall;
  // (a way's cells: a road's (v 1) only on its own level or a slope, never over a cliff's rim; its verges (keep: woods and marsh
  // cleared) all round)
  const mark=(p,w,v,verge)=>{const rr=w*cs/2,rc=rr+verge*cs+2;for(const [x,y] of p){const i0=tIx(T,x,y);box(x,y,rc,(i,cx,cy)=>{const d=Math.hypot(cx-x,cy-y);if(d>rc)return;const k=kind[i];if(k!==0&&k!==TKIND.wood&&k!==TKIND.marsh&&k!==TKIND.bridge)return;keep[i]=1;
    if(v&&d<=rr&&(lvl[i]===lvl[i0]||(up[i]>=0||up[i0]>=0)&&!(wl&&(wl[i]||wl[i0])))){road[i]=v;anyRoad=true}})}};
  for(const wy of D.ways){const g0=D.glades[0],g1=D.glades[1],k=wy.kind==='road'?'road':'path';let pts;
    if(wy.ns){if(rv)continue;pts=[[wy.x+f(-1,1)*24,-16],[wy.x+f(-1,1)*24,P.H+16]]}
    else if(wy.via){if(cr.length===1)continue;const vy=clamp(wy.y+wy.via*fh,top+40,bot-40);pts=[[g0.x,g0.y],[W*.32,vy],[W*.68,vy],[g1.x,g1.y]]}
    else pts=[[-16,g0?g0.y+f(-.4,.4)*g0.ry:wy.y+f(-1,1)*32],...(g0?[[g0.x,g0.y],[g1.x,g1.y]]:[]),[W+16,g1?g1.y+f(-.4,.4)*g1.ry:wy.y+f(-1,1)*32]];
    const p=wayPlan(T,P,k,pts,rnd,(ns+ways.length*131+7)&65535,wr0,wr1,cr);if(!p)continue;
    ways.push({kind:wy.kind,p:p.kept,...(p.fall?{fall:true}:{})});
    if(wy.kind==='road')mark(p,DT.road[0],1,DT.road[1]);else if(wy.kind==='path')mark(p,DT.path,2,0);
    else{let s=0,next=0;for(let j=0;j<p.length;j++){if(j)s+=Math.hypot(p[j][0]-p[j-1][0],p[j][1]-p[j-1][1]);if(s>=next){const r=f(DT.link[0],DT.link[1]);blob(p[j][0],p[j][1],r*(D.ks||1),r*.85*(D.ks||1),61+j%7);next=s+f(DT.step[0],DT.step[1])*(D.ks||1)}}}}
  // (the noise of a kind's cells, and how much an open neighbour thins it: within band of the field's height of that edge (west and
  // east: both ends))
  const E=D.edges,bd=fh*DT.band,thin=(x,y)=>{let b=0;if(E.n)b+=Math.max(0,1-(y-top)/bd);if(E.s)b+=Math.max(0,1-(bot-y)/bd);if(E.w||E.e)b+=Math.max(0,1-Math.min(x,W-x)/bd);return b*DT.edge};
  const taken=new Uint8Array(N);
  const lay=(K,share,salt)=>{if(!(share>0))return;const S=D.scale*(K===TKIND.marsh?.8:1),val=new Float32Array(N),n=[0,0,0,0],have=[0,0,0,0],fr=[[],[],[],[]],q=new Uint8Array(N);
    for(let i=0;i<N;i++){const c=i%C,r=(i-c)/C,x=(c+.5)*cs,y=(r+.5)*cs,b=(x<W/2?0:2)+((Zn?x>=Zn[0]&&x<Zn[1]||x>W-Zn[1]&&x<=W-Zn[0]:x<zw||x>W-zw)?0:1);q[i]=b;
      val[i]=noise(x/S,y/S,ns+salt)*.62+noise(x/(S*.42),y/(S*.42),ns+salt+1)*.38-thin(x,y);if(r<r0||r>r1)continue;n[b]++;if(kind[i]===K)have[b]++;else if(kind[i]===0&&!keep[i]&&!taken[i])fr[b].push(i)}
    const thr=[Infinity,Infinity,Infinity,Infinity];
    for(const z of [0,2]){const m=z+1,tz=share*(1-DT.zoneLess),tot=Math.round(share*(n[z]+n[m]))-have[z]-have[m];
      let wm=clamp(Math.round((share*(n[z]+n[m])-tz*n[z]))-have[m],0,fr[m].length),wz=clamp(tot-wm,0,fr[z].length);wm=clamp(tot-wz,0,fr[m].length);
      for(const [b,w] of [[z,wz],[m,wm]]){if(!w)continue;const L=fr[b].sort((a,c)=>val[c]-val[a]);thr[b]=val[L[w-1]];for(let j=0;j<w;j++)taken[L[j]]=K}}
    // (the rows off the field go as the band's threshold says)
    for(let i=0;i<N;i++){const r=(i/C)|0;if((r<r0||r>r1)&&kind[i]===0&&!keep[i]&&!taken[i]&&val[i]>=thr[q[i]])taken[i]=K}};
  for(let i=0;i<N;i++)if(keep[i]&&(kind[i]===TKIND.wood||kind[i]===TKIND.marsh))kind[i]=0;
  if(anyRoad)T.road=road;T.ways=ways;if(!P.dense)return T;
  lay(TKIND.wood,D.wood,1);lay(TKIND.marsh,D.marsh,5);
  for(let i=0;i<N;i++)if(taken[i])kind[i]=taken[i];
  T.dense={wood:D.wood,marsh:D.marsh,glades:D.glades.map(g=>({...g})),clear:D.clear.map(g=>({...g})),ways};return T}
/* an open way edge to edge (a dense field's lane): from one glade to the other over open ground two cells wide at least (each 2×2
   block of open cells, 8 ways round; a ford or a bridge counts as open); the glades' middles within half their size */
function openWay(T,top,bot){
  const {cs,C,R,kind}=T,G=T.dense.glades,r0=clamp(Math.floor(top/cs),0,R-1),r1=clamp(Math.floor((bot-1)/cs),0,R-1),op=i=>{const k=kind[i];return k===0||k===TKIND.ford||k===TKIND.bridge};
  const ok=new Uint8Array(C*R);for(let r=r0;r<r1;r++)for(let c=0;c<C-1;c++){const i=r*C+c;if(op(i)&&op(i+1)&&op(i+C)&&op(i+C+1))ok[i]=1}
  const inG=(g,i)=>{const x=(i%C+1)*cs,y=(Math.floor(i/C)+1)*cs;return Math.hypot((x-g.x)/g.rx,(y-g.y)/g.ry)<.5};
  const seen=new Uint8Array(C*R),q=[];for(let i=0;i<C*R;i++)if(ok[i]&&inG(G[0],i)){seen[i]=1;q.push(i)}
  for(let a=0;a<q.length;a++){const i=q[a];if(inG(G[1],i))return true;const c=i%C;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const cc=c+dc,j=i+dr*C+dc;if((dr||dc)&&cc>=0&&cc<C&&j>=0&&j<C*R&&ok[j]&&!seen[j]){seen[j]=1;q.push(j)}}}
  return false}
/* the fairness checks (§3): woods at most zoneWood of either deployment zone; the halves' advantage (levels + wood cells) within
   score of each other; an open lane (no wood or marsh) of TERRAIN.lane edge to edge, which with deep water must take in a
   crossing (the cavalry's road over). Rivers (rivers: the plan's, else the built field's): no water in a deployment zone; each
   with deep water has a crossing or more, TERRAIN_RIVER.ford px of them at least, gap px apart (its plan's gap on a short field), edge px from the field's top and
   bottom, each within mid px of BW/2 (both sides reach it alike); a held bridge's river (hold: battle types) needs only its bridge. Hills are centred or mirrored by their plan. Phase 4: no rock in
   a deployment zone, and none in the open lane; reach (the foot's grid, deep water impassable unless TERRAIN.wade, cliffs one-way
   as they are): each zone's middle reaches the other's, every passable cell of its own zone and every hilltop (hills: the plan's,
   else the built field's), both ways round.
   A dense field (T.dense: forest tiles, the fen, the mire wood, elven woods; field variety) takes woods in its zones: in place of
   zoneWood, both zones' shares of cover (woods and marsh) and of open ground within TERRAIN_DENSE.fair of each other, and each
   army's glade open (TERRAIN_DENSE.keep of its middle at least); in place of the open lane, an open way from glade to glade
   (openWay: a road, a deer path or a chain of clearings); and each zone's middle reaches the other's on the foot's grid (route.js
   reachable). cover, open: the zones' shares; glade: both glades open; way: the open way */
function terrainFair(T,W,top,bot,rivers,hills){
  const {cs,C,R,kind,lvl}=T,Zn=T.zone,V=TERRAIN_RIVER,r0=clamp(Math.floor(top/cs),0,R-1),r1=clamp(Math.floor((bot-1)/cs),0,R-1),zw=[0,0],zn=[0,0],zc=[0,0],zo=[0,0],sc=[0,0],deep=kind.includes(TKIND.deep);let run=0,lane=0,cross=false,wz=0;
  for(let r=r0;r<=r1;r++){let open=true,dr=false;for(let c=0;c<C;c++){const i=r*C+c,x=(c+.5)*cs,k=kind[i];if(k===TKIND.wood||k===TKIND.marsh||k===TKIND.rock)open=false;else if(k===TKIND.deep)dr=true;const z=Zn?(x>=Zn[0]&&x<Zn[1]?0:x>W-Zn[1]&&x<=W-Zn[0]?1:-1):x<TERRAIN.zone*W?0:x>(1-TERRAIN.zone)*W?1:-1;
    if(z>=0){zn[z]++;if(k===TKIND.wood||k===TKIND.marsh)zc[z]++;else if(k===0||k===TKIND.bridge)zo[z]++;if(k===TKIND.wood)zw[z]++;else if(k>=TKIND.ford)wz++}sc[x<W/2?0:1]+=lvl[i]+(k===TKIND.wood?1:0)}
    if(open){run++;if(!dr)cross=true}else{run=0;cross=false}if((cross||!deep)&&run>lane)lane=run}
  const D=T.dense,DT=TERRAIN_DENSE,cover=zc.map((v,j)=>v/Math.max(1,zn[j])),opn=zo.map((v,j)=>v/Math.max(1,zn[j]));
  let zone,open,glade=true,way=null;
  if(D){glade=D.glades.every(g=>{let a=0,o=0;for(let r=r0;r<=r1;r++)for(let c=0;c<C;c++){const x=(c+.5)*cs,y=(r+.5)*cs;if(Math.hypot((x-g.x)/g.rx,(y-g.y)/g.ry)<.6){a++;const k=kind[r*C+c];if(k===0||k===TKIND.bridge)o++}}return a>0&&o>=DT.keep*a});
    zone=Math.abs(cover[0]-cover[1])<=DT.fair&&Math.abs(opn[0]-opn[1])<=DT.fair&&glade;way=openWay(T,top,bot);open=way}
  else{zone=zw[0]<=TERRAIN.zoneWood*zn[0]&&zw[1]<=TERRAIN.zoneWood*zn[1];open=lane*cs>=TERRAIN.lane}
  const score=Math.abs(sc[0]-sc[1])<=TERRAIN.score*Math.max(sc[0],sc[1]);
  const rv=rivers||T.recipe&&T.recipe.rivers||[],river=!wz&&rv.filter(v=>v.deep).every(v=>{const L=v.crossings;return L.length>0&&L.reduce((n,c)=>n+c.w,0)>=(v.hold?V.bridge:V.ford)&&L.every((c,j)=>c.y0>=top+V.edge&&c.y1<=bot-V.edge&&Math.abs(c.x-W/2)<=V.mid&&(!j||c.y0-L[j-1].y1>=(v.gap??V.gap)))});
  let reach=terrainReachFair(T,W,top,bot,hills||T.recipe&&T.recipe.hills||[]);
  if(D&&reach){const g=T.route.foot,mid=(top+bot)/2,z=zMid(Zn,W);reach=reachable(g,z,mid,W-z,mid)&&reachable(g,W-z,mid,z,mid)}
  return{ok:zone&&score&&open&&river&&reach,zone,score,lane:open,river,reach,scores:sc,laneRows:lane,cover,open:opn,glade,way}}
// (phase 4's reach: true where nothing blocks a step (no rock, cliff or impassable water: every cell reaches every other))
function terrainReachFair(T,W,top,bot,hills){
  if(!T.route)terrainRoutes(T,top,bot);if(!T.blocky)return true;const g=T.route.foot,C=T.C,cs=T.cs,mid=(top+bot)/2,z=zOut(T.zone,W),zm=zMid(T.zone,W);
  const at=(x,y)=>{const i=routeNear(g,routeIx(g,x,y));return i},a=at(zm,mid),b=at(W-zm,mid);if(a<0||b<0)return false;
  const fa=routeFlood(g,a),fb=routeFlood(g,b);if(!fa[b]||!fb[a])return false;
  for(let i=0;i<g.cost.length;i++){if(!g.cost[i])continue;const x=(i%C+.5)*cs;if(x<z&&!fa[i]||x>W-z&&!fb[i])return false}
  return hills.every(h=>{const i=at(h.x,h.y);return i>=0&&fa[i]&&fb[i]})}
/* B.terrain (the contract with the art: doc/TERRAIN_DESIGN.md §4): {cs,C,R,kind,lvl,up,has:{hills,wood,marsh,water},seed,
   recipe:{kind,layout,hills,woods,marsh,river:null,dropped,tries,text},ai:{tops,crossings,woods}}. spec: {recipe,seed} from the world
   (terrainAt) or the lab, or {explicit,seed}; W, top, bot: the field (BW, fieldTop/fieldBot by default). Up to TERRAIN.tries
   sub-seeds for a fair field; then the offending features are dropped (woods, then marsh, then hills, then the river). spec.river
   (terrainAt's): a river down the middle, from a stream of its own (the rest of the field is as it would be without one, but
   for its layouts: TERRAIN_RECIPE river). Phase 4: cliffs and rock (featurePlan) from a stream of their own, dropped first (rock,
   then cliffs) when no sub-seed is fair; spec.frost: a frost field's; then the route grids (terrainRoutes) */
function buildTerrain(spec){
  const W=spec.W||BW,H=spec.H||BH,top=spec.top??FIELD_EDGE.top,bot=spec.bot??H-FIELD_EDGE.bot,seed=spec.seed>>>0,rs=k=>seeded(((seed^0x51ED270B)+Math.imul(k,0x9E3779B1))>>>0);let plan=null,T=null,tries=0;const dropped=[];
  const riv=(p,k)=>{p.rivers=spec.river?[riverPlan(spec.river,rs(k),W,top,bot,p.lane,H)]:[];return featurePlan(p,seeded(((seed^0xC11FF00D)+Math.imul(k,0x9E3779B1))>>>0),W,top,bot,!!spec.frost,!!spec.crags)};
  // (field variety: the world's say on the plan: terrainPlan's X)
  const X={H,zone:spec.zone||terrainZone(W,H),edges:spec.edges,road:spec.road,elven:spec.elven,forest:spec.forest,frost:spec.frost,layout:spec.layout};
  if(spec.ambush){plan=ambushPlan(spec,W);plan.H=H;T=rasterTerrain(W,plan,seed)}// (an ambush's own, over anything else: setup.js ambushLayout)
  else if(spec.explicit){plan=terrainExplicit(spec.explicit,W,H);Object.assign(plan,{W,top,bot});T=rasterTerrain(W,plan,seed)}
  else{for(let k=0;k<TERRAIN.tries&&!T;k++){tries=k+1;const p=riv(terrainPlan(spec.recipe,seeded((seed+Math.imul(k,0x9E3779B1))>>>0),W,top,bot,spec.oasis,!!spec.river,X),k),t=rasterTerrain(W,p,seed);if(terrainFair(t,W,top,bot,p.rivers,p.hills).ok){plan=p;T=t}}
    // (a held bridge's river is never dropped: it is the battle; a dense field's woods go next to last)
    if(!T){plan=riv(terrainPlan(spec.recipe,seeded(seed),W,top,bot,spec.oasis,!!spec.river,X),0);
      for(const f of ['rocks','cliffs','woods','marsh','hills','dense',...(spec.river&&spec.river.hold?[]:['rivers'])]){if(f==='cliffs'){if(!plan.hills.some(h=>h.cliff))continue;for(const h of plan.hills)h.cliff=h.oneway=false}else if(f==='dense'){if(!plan.dense)continue;plan.dense=null}else{if(!plan[f].length)continue;plan[f]=[]}
        dropped.push(f);T=rasterTerrain(W,plan,seed);if(terrainFair(T,W,top,bot,plan.rivers,plan.hills).ok)break}
      if(!T)T=rasterTerrain(W,plan,seed)}}
  if(!T.route)terrainRoutes(T,top,bot);
  const {kind,lvl}=T,has={hills:lvl.some(v=>v>0),wood:kind.includes(TKIND.wood),marsh:kind.includes(TKIND.marsh),water:kind.some(k=>k>=TKIND.ford&&k<=TKIND.bridge),rock:kind.includes(TKIND.rock),cliff:!!T.wall},rivers=plan.rivers||[],r0=rivers[0];
  terrainIndex(T);if(T.dense)woodDeep(T);
  const box=p=>[p.x-p.r,p.y-p.r,p.x+p.r,p.y+p.r],cl=h=>h.cliff?{cliff:true,oneway:!!h.oneway,ramps:h.ramps.slice()}:{};
  T.has=has;T.seed=seed;
  // (an ambush's road, straight down its middle, is in recipe.ways for the art alone: no T.road, so no faster going on it)
  // (field variety: dense, the dense layout's reading (T.dense: its glades, clearings and ways, and the shares of the field its woods
  // and marsh cover); edges, what the neighbours laid by side; road, a road crosses it; elven, frost: the woods' make, for the art)
  const cover=K=>{const r0=clamp(Math.floor(top/T.cs),0,T.R-1),r1=clamp(Math.floor((bot-1)/T.cs),0,T.R-1);let n=0;for(let i=r0*T.C;i<(r1+1)*T.C;i++)if(kind[i]===K)n++;return n/((r1-r0+1)*T.C)};
  T.recipe={kind:plan.recipe,layout:plan.layout,oasis:!!spec.oasis,hills:plan.hills.map(h=>({x:h.x,y:h.y,r:(h.rx+h.ry)/2,rx:h.rx,ry:h.ry,top:h.top,...cl(h),...(h.low?{low:true}:{}),...(h.edge?{edge:h.edge}:{})})),woods:plan.woods.map(p=>({...p})),marsh:plan.marsh.map(p=>({...p})),rocks:(plan.rocks||[]).map(p=>({...p})),river:r0||null,rivers,lane:plan.lane,dropped,tries,
    dense:T.dense?{...T.dense,woodShare:cover(TKIND.wood),marshShare:cover(TKIND.marsh)}:null,ways:T.ways||(plan.road?[{kind:'road',p:[[-16,(plan.road[0]+plan.road[1])>>1],[W>>1,(plan.road[0]+plan.road[1])>>1],[W+16,(plan.road[0]+plan.road[1])>>1]]}]:[]),edges:{...(plan.edges||{})},road:!!T.road&&T.road.includes(1),path:!!T.road&&T.road.includes(2),elven:!!spec.elven&&!!T.dense,frost:!!spec.frost};
  T.recipe.text=terrainText(T.recipe,has);
  // (the AI's reading of the rivers: the contract at the top of this file; a top's cliffs and ramps (radians); the rock)
  const crossings=rivers.filter(v=>v.deep).flatMap(v=>v.crossings.map(c=>({kind:c.kind,x:c.x,y:c.y,w:c.w,y0:c.y0,y1:c.y1,x0:c.x0,x1:c.x1}))).sort((a,b)=>a.y-b.y);
  // (a dense field: its woods' stands no wider than TERRAIN_DENSE.block (the riders' way round, an elf's wood to hold; the great
  // wood itself is no patch to go round); its glades and clearings ({x,y,r,half}) and ways ([[x,y]...]))
  T.ai={tops:plan.hills.map(h=>({x:h.x,y:h.y,lvl:h.top,half:h.x<W/2?0:1,...cl(h)})),crossings,woods:T.dense?denseStands(T):plan.woods.map(p=>({x:p.x,y:p.y,box:box(p)})),rocks:(plan.rocks||[]).map(p=>({x:p.x,y:p.y,r:p.r})),
    ...(T.dense?{dense:true,glades:[...T.dense.glades.map(g=>({x:g.x,y:g.y,r:Math.min(g.rx,g.ry),half:g.half})),...T.dense.clear.map(g=>({x:g.x,y:g.y,r:g.r,half:g.x<W/2?0:1}))],ways:T.dense.ways.map(w=>w.p)}:{}),
    river:r0?{x:r0.path.reduce((a,b)=>a+b,0)/r0.path.length,x0:r0.x0,x1:r0.x1,w:2*r0.half,deep:r0.deep,frozen:r0.frozen,stream:r0.stream}:null};
  // (wband: the band all the field's water keeps within, px; wwide: its widest water; crossesDeep, crossWay)
  T.wband=rivers.length?[Math.min(...rivers.map(v=>v.x0)),Math.max(...rivers.map(v=>v.x1))]:null;T.wwide=rivers.length?Math.max(...rivers.map(v=>2*v.half)):0;
  return T}
// (a dense field's stands of wood for the AI: each 4-way joined patch of wood cells no wider nor taller than TERRAIN_DENSE.block,
// its cells' middle and the box round it)
function denseStands(T){const {C,R,cs,kind}=T,seen=new Uint8Array(C*R),out=[],B=TERRAIN_DENSE.block;
  for(let s=0;s<C*R;s++){if(seen[s]||kind[s]!==TKIND.wood)continue;const q=[s];seen[s]=1;let c0=C,c1=0,a0=R,a1=0,sx=0,sy=0;
    for(let a=0;a<q.length;a++){const i=q[a],c=i%C,r=(i-c)/C;if(c<c0)c0=c;if(c>c1)c1=c;if(r<a0)a0=r;if(r>a1)a1=r;sx+=c;sy+=r;
      for(const j of [c>0?i-1:-1,c<C-1?i+1:-1,i-C,i+C])if(j>=0&&j<C*R&&!seen[j]&&kind[j]===TKIND.wood){seen[j]=1;q.push(j)}}
    if((c1-c0+1)*cs<=B&&(a1-a0+1)*cs<=B&&q.length>=4){const x=(sx/q.length+.5)*cs,y=(sy/q.length+.5)*cs,h=Math.max(c1-c0+1,a1-a0+1)*cs/2;out.push({x,y,box:[x-h,y-h,x+h,y+h]})}}
  return out}
/* (field variety, a hint for the art: T.deep, a Uint8Array(C*R), 1 on a wood cell with wood two cells all round it (absent with no
   such cell): a dense forest's heart, where the art may paint its trees as canopy into the ground instead of standing sprites (a
   big forest hands back thousands of trees; drawn one by one they cost much at a whole-field zoom). Soldiers there are hidden
   from the foe anyway (SIGHT.near) */
function woodDeep(T){const {C,R,kind}=T,W=TKIND.wood;let D=null;
  for(let r=2;r<R-2;r++)for(let c=2;c<C-2;c++){if(kind[r*C+c]!==W)continue;let all=true;for(let dr=-2;dr<=2&&all;dr++)for(let dc=-2;dc<=2;dc++)if(kind[(r+dr)*C+c+dc]!==W){all=false;break}if(all)(D||(D=new Uint8Array(C*R)))[r*C+c]=1}
  if(D)T.deep=D;return T}
// (T.woodSum: wood cells summed over the rectangle above-left of each cell corner, (C+1)×(R+1), so terrainBlocksView knows at once
// how many lie in any box; kept in step with T.kind: whoever changes kind calls this again)
function terrainIndex(T){const C=T.C,R=T.R,K=T.kind,S=new Int32Array((C+1)*(R+1));for(let r=0;r<R;r++)for(let c=0;c<C;c++)S[(r+1)*(C+1)+c+1]=(K[r*C+c]===TKIND.wood?1:0)+S[r*(C+1)+c+1]+S[(r+1)*(C+1)+c]-S[r*(C+1)+c];T.woodSum=S;
  /* (sight, phase 3: each cell's height for lines of sight, T.sh: its level, or SIGHT.wall for a kind that blocks all sight (a
     TERRAIN_GROUND entry with blocks: true, phase 4's mountains); shTop the highest, lvlTop the highest level; hiSum[k] the cells of
     height k or more summed as woodSum (k 1..lvlTop+1, blockers in each): riseBlocked's shortcut. Kept in step with kind and lvl) */
  const N=C*R,sh=new Uint8Array(N);let top=0,lt=0;for(let i=0;i<N;i++){const Gd=TGROUND[K[i]],v=Gd&&Gd.blocks?SIGHT.wall:T.lvl[i];sh[i]=v;if(v>top)top=v;if(v<SIGHT.wall&&v>lt)lt=v}
  T.sh=sh;T.shTop=top;T.lvlTop=lt;T.hiSum=[null];
  if(top)for(let k=1;k<=lt+1;k++){const H=new Int32Array((C+1)*(R+1));for(let r=0;r<R;r++)for(let c=0;c<C;c++)H[(r+1)*(C+1)+c+1]=(sh[r*C+c]>=k?1:0)+H[r*(C+1)+c+1]+H[(r+1)*(C+1)+c]-H[r*(C+1)+c];T.hiSum[k]=H}
  return T}
// the ground in words (the battle's first log line; the pre-battle panel)
function terrainText(rc,has){
  // (an ambush's field: its road and its cover)
  if(rc.layout==='ambush')return 'The road runs between '+(has.wood?'woods':(rc.kind==='desert'?'dune ridges':'low ridges'))+'.'+(has.wood?' Woods hide whoever stands in them, slow riders and break formations.':' Whoever stands behind a ridge is hidden from the road.');
  // (field variety: a dense field's woods a sentence of their own; the new layouts' hills in a word; the edges; a road)
  const D=rc.dense,E=rc.edges||{},HS=(rc.hills||[]).filter(h=>!h.edge&&!(D&&h.low)),dense=D?{deepwood:'deep woods',stands:'stands of trees and clearings',hillwood:'woods over a low hill (a clearing on its top)',glade:'woods round a wide glade in the middle',elvenwood:'old elven woods',mirewood:'drowned woods and marsh',fen:'fen and reed marsh (with dry islands)'}[rc.layout]||'deep woods':'';
  const parts=[],L=rc.layout,nh=HS.length,top=nh&&HS[0].top,low=top>1?'a hill':'a low hill',treed=L==='woodedHill'||L==='woodedRidge'||L==='pairFlank';
  const HW={rise:'a broad low rise in the middle',rolling:'rolling hills, the highest in the middle',ridges:'a long ridge on each side',dunes:'long dunes on each side',erg:'dunes down the middle and on each side',saddle:'a hill in the middle'};
  if(nh&&!(D&&L==='hillwood'))parts.push(HW[L]||(L==='pair'||L==='pairFlank'||nh===2?'a hill on each side'+(L==='pairFlank'&&has.wood?', wooded on its flank':''):L==='ridge'||L==='woodedRidge'||L==='dune'?(rc.kind==='desert'?'a dune ridge':'a ridge')+' down the middle'+(L==='woodedRidge'&&has.wood?' under trees':''):
    nh>1?nh+' hills':low+' in the middle'+(L==='woodedHill'&&has.wood?' crowned with trees':'')));
  if(has.wood&&!D&&!(treed&&nh))parts.push(rc.kind==='swamp'?'stands of dead trees':L==='copses'||L==='snowwood'?'scattered copses':rc.woods.length>1?'woods':'a copse');if(has.marsh&&!D)parts.push(rc.kind==='desert'?'an oasis':L==='mere'?'marsh pools':'marsh');
  // (phase 4: mountains (a rock 30 px or more across its radius) and spires; a pass between them)
  if(has.rock){const R=(rc.rocks||[]).filter(p=>!p.edge),m=R.filter(p=>p.r>=30).length;if(L==='pass'&&m)parts.push('a pass between mountains');else if(m)parts.push(m>1?'mountains':'a mountain');if(R.length>m)parts.push('rock spires')}
  const side={n:'north',s:'south'},ew=E.w||E.e;
  for(const k of ['n','s'])if(E[k]&&E[k]!=='open')parts.push({forest:'woods',hills:'a ridge',peaks:'crags',water:'reed marsh',marsh:'reed marsh'}[E[k]]+' along the '+side[k]+' edge');
  if(ew&&ew!=='open')parts.push({forest:'woods',hills:'low hills',peaks:'spires',water:'reed marsh',marsh:'reed marsh'}[ew]+' at both ends');
  if(rc.road&&!D)parts.push('a road across the field');
  // (the river a sentence of its own, first: "A river with a bridge and a ford. A hill on each side.")
  const v=has.water&&rc.river,n=k=>v.crossings.filter(c=>c.kind===k).length,one=(k,w)=>n(k)?(n(k)>1?(n(k)===2?'two ':n(k)+' ')+w+'s':'a '+w):'',cap=s=>s[0].toUpperCase()+s.slice(1)+'.';
  const rs=v?cap(v.stream?'a shallow stream':v.frozen?'a frozen river'+(n('bridge')?' with a bridge':''):v.hold?'a river with a single bridge'+(n('ford')?' and a ford far off it':''):'a river'+(v.crossings.length?' with '+[one('bridge','bridge'),one('ford','ford')].filter(Boolean).join(' and '):'')):'';
  const ds=D?cap(dense+' cover '+(D.woodShare+D.marshShare>=.57?'most':'much')+' of the field, with a glade for each army'+(rc.road?'; a road runs through them':rc.path?(L==='fen'?'; a causeway runs through':'; a deer path winds through them'):'; clearings link the glades')+
    (['n','s','w','e'].some(k=>E[k]==='open')?', thinning toward the open land':'')):'';
  if(!parts.length&&!rs&&!ds)return '';const s=[rs,ds].filter(Boolean).join(' ')+(parts.length?(rs||ds?' ':'')+cap(parts.join(', ').replace(/, ([^,]*)$/,' and $1')):'');
  const sheer=rc.hills.some(h=>h.cliff&&!h.oneway),onew=rc.hills.some(h=>h.oneway);
  return s+(v&&v.deep?TERRAIN.wade?' Deep water: wading is slow and tiring, no one shoots from it and blows land soft; cross at the fords and bridges.':' Deep water cannot be crossed: only at the fords and bridges.':'')+(v&&(v.stream||v.frozen)?' '+(v.frozen?'The ice is slippery going, but it can be crossed anywhere.':'The stream slows all but orcs.'):v&&n('ford')?' Fords slow all but orcs and break formations.':'')+
    (has.hills?' High ground: archers reach farther and charges downhill hit harder; the climb is hard going.':'')+(sheer?' Sheer cliffs ring a hill: it is climbed only by its ramps.':'')+(onew?' A hill is climbed by one ramp only, though men can drop down its cliffs.':'')+
    (has.rock?' Rock bars the way and hides what lies behind it.':'')+(has.wood?' Woods slow riders and break formations'+(D?', and hide whoever stands in them.':'.'):'')+(has.marsh?' Marsh slows and tires all but orcs.':'')+(rc.road?' Men march a little faster on the road.':'')}
// the battleground's text (its env's, with the ground's when there will be terrain; the pre-battle panel, encounters.js): no river
// against a monster or in a cave (as groundSpecFor)
// bt: the battle's type (setup.js BTYPE): a held bridge's river; an ambush's road and cover
function terrainEnvText(env,kind,bt){
  if(!TERRAIN.on||['siege','raid','tourney'].includes(kind))return env.text;
  const g=terrainAt(P.x,P.y,env);if(['monster','cave'].includes(kind))g.river=null;
  if(bt&&bt.kind==='ambush')return groundEnvText(env,{recipe:{text:terrainText({layout:'ambush',kind:g.recipe},{wood:!ambushRidge(g.recipe,g.seed)})}});
  if(bt&&bt.kind==='bridge')g.river={bridge:true,hold:true,ford:!!bt.ford,frozen:false};const T=buildTerrain({...g,W:clamp(BVW,FIELD_W.min,FIELD_W.max)});return groundEnvText(env,T)}
// (a hill's or forest's old words (+15% range; scattered trees) are replaced by the ground's; other climates' rules stay)
const groundEnvText=(env,T)=>{const g=T&&T.recipe.text;return env.t===T_HILL||env.t===T_FOREST?g||'Open ground.':!g?env.text:env.text+' '+g};

/* ---- the rules: O(1) lookups; with no B.terrain (or no water, for the river's) each returns exactly 1, false or 0 ---- */
const tIx=(T,x,y)=>{const c=Math.floor(x/T.cs),r=Math.floor(y/T.cs);return(r<0?0:r>=T.R?T.R-1:r)*T.C+(c<0?0:c>=T.C?T.C-1:c)};
function groundAt(x,y){const T=B&&B.terrain;return T?T.kind[tIx(T,x,y)]:0}
function levelAt(x,y){const T=B&&B.terrain;return T?T.lvl[tIx(T,x,y)]:0}
// (a race's or beast's home ground: RACES[r].home, as envStats reads it; D7)
const groundHome=(u,h)=>{const r=u.unit&&u.unit.race||u.s.race,H=r&&RACES[r]?RACES[r].home:u.s.home;return !!H&&H.includes(h)};
const inWood=u=>{const T=B&&B.terrain;return !!T&&T.has.wood&&T.kind[tIx(T,u.x,u.y)]===TKIND.wood};
// (a flag of the ground he stands on (TERRAIN_GROUND): thin, no shield wall nor wedge (formations.js); loose, no cohesion
// (morale.js); noShoot, no drawing (actors.js shotStep's can))
const groundFlag=(u,f)=>{const T=B&&B.terrain;if(!T||!(T.has.wood||T.has.water))return false;const Gd=TGROUND[T.kind[tIx(T,u.x,u.y)]];return !!(Gd&&Gd[f])};
const groundThin=u=>groundFlag(u,'thin'),groundLoose=u=>groundFlag(u,'loose'),groundNoShoot=u=>groundFlag(u,'noShoot');
const inDeep=u=>{const T=B&&B.terrain;return !!T&&T.has.water&&T.kind[tIx(T,u.x,u.y)]===TKIND.deep};
// (his speed on ground Gd, by foot/mounted/big; ×1 at home there)
const groundSpd=(u,Gd)=>groundHome(u,Gd.home)?1:u.s.big?Gd.spd.big:u.s.mounted?Gd.spd.mounted:Gd.spd.foot;
// (a soldier in formation on dry ground keeps the bank: he does not step down into a ford or deep water after a foe there, but
// strikes him as he comes up out of it; actors.js)
const holdsBank=(u,t)=>{const T=B&&B.terrain;if(!T||!T.has.water)return false;const k=T.kind[tIx(T,t.x,t.y)];return(k===TKIND.ford||k===TKIND.deep)&&T.kind[tIx(T,u.x,u.y)]!==TKIND.ford&&T.kind[tIx(T,u.x,u.y)]!==TKIND.deep};
// stamina spent a second walking here (fatigue.js: walking elsewhere spends none): wading deep water; 0 elsewhere
function groundWade(u){const T=B&&B.terrain;if(!T||!T.has.water)return 0;const Gd=TGROUND[T.kind[tIx(T,u.x,u.y)]];return Gd&&Gd.wade||0}
// (going up (1), down (-1) or across (0) the slope of cell i, moving (mx,my))
const slopeWay=(T,i,mx,my)=>{const d=T.up[i];if(d<0||!(mx||my))return 0;const dot=(mx*TDX[d]+my*TDY[d])/(Math.hypot(mx,my)||1);return dot>HILL.dot?1:dot<-HILL.dot?-1:0};
// speed on the ground, moving (mx,my): woods and marsh by foot/mounted/big, climbing and descending slopes; floored at TERRAIN.floor;
// a road (T.road 1: field variety) TERRAIN_ROAD.spd
function groundMul(u,mx,my){
  const T=B&&B.terrain;if(!T)return 1;const i=tIx(T,u.x,u.y),k=T.kind[i],Gd=TGROUND[k];let m=1;
  if(Gd&&!groundHome(u,Gd.home))m*=u.s.big?Gd.spd.big:u.s.mounted?Gd.spd.mounted:Gd.spd.foot;else if(T.road&&T.road[i]===1)m*=TERRAIN_ROAD.spd;
  const w=slopeWay(T,i,mx,my);if(w>0){if(!groundHome(u,HILL.home))m*=u.s.big?HILL.climb.big:u.s.mounted?HILL.climb.mounted:HILL.climb.foot}else if(w<0)m*=HILL.descend;
  return m<TERRAIN.floor?TERRAIN.floor:m}
/* how fast charge momentum builds here (sp: this step's distance); it also follows the height the run comes from (u.rlv, a level
   that lags CHARGE.run px behind the runner: a charge down off a hill keeps it, a long run on the flat loses it; morale.js chargeMul) */
function groundRun(u,mx,my,sp){
  const T=B&&B.terrain;if(!T)return 1;const i=tIx(T,u.x,u.y),k=T.kind[i],lv=T.lvl[i],Gd=TGROUND[k];
  u.rlv=u.run>0&&u.rlv!=null?u.rlv+(lv-u.rlv)*Math.min(1,sp/CHARGE.run):lv;
  let m=1;if(Gd&&Gd.run!=null&&!groundHome(u,Gd.home))m*=Gd.run;const w=slopeWay(T,i,mx,my);if(w>0)m*=HILL.runUp;else if(w<0)m*=HILL.runDown;return m}
// a soldier going up a slope ('up'), down one ('down') or neither (null), by his last move (u.dir, u.spdNow): the art's climbing
// animation; climbing breaks his cohesion (morale.js cohesionReady)
function climbState(u){const T=B&&B.terrain;if(!T||!T.has.hills||!(u.spdNow>0)||u.dir==null)return null;const w=slopeWay(T,tIx(T,u.x,u.y),Math.cos(u.dir),Math.sin(u.dir));return w>0?'up':w<0?'down':null}
// stamina drained running here (u.dir: where he goes): marsh, and running uphill (dwarves climb freely)
function groundSta(u){
  const T=B&&B.terrain;if(!T)return 1;const i=tIx(T,u.x,u.y),Gd=TGROUND[T.kind[i]];let m=1;
  if(Gd&&Gd.sta&&!groundHome(u,Gd.home))m*=Gd.sta;if(u.dir!=null&&slopeWay(T,i,Math.cos(u.dir),Math.sin(u.dir))>0&&!groundHome(u,HILL.home))m*=HILL.climbSta;return m}
// the charge bonus's scale (morale.js chargeMul): by the height the run came from over the foe's (±1 level: ×(1±HILL.charge)),
// halved against a foe standing in woods
function groundCharge(u,t){
  const T=B&&B.terrain;if(!T)return 1;const tl=T.lvl[tIx(T,t.x,t.y)],al=u.rlv!=null?u.rlv:T.lvl[tIx(T,u.x,u.y)];
  let m=1+HILL.charge*clamp(al-tl,-1,1);if(T.kind[tIx(T,t.x,t.y)]===TKIND.wood)m*=TERRAIN_GROUND.wood.chargeIn;return m}
// (the height of a blow: +1 the attacker higher, -1 lower)
function heightEdge(a,b){const T=B&&B.terrain;if(!T)return 0;return clamp(T.lvl[tIx(T,a.x,a.y)]-T.lvl[tIx(T,b.x,b.y)],-1,1)}
// a melee blow's weight by the ground (attacks.js hit): from higher ground; struck standing in marsh, a ford or deep water; at a
// foe standing in deep water (hurt)
function groundHit(att,t){
  const T=B&&B.terrain;if(!T)return 1;const i=tIx(T,att.x,att.y),j=tIx(T,t.x,t.y);let m=1;if(T.lvl[i]>=T.lvl[j]+1)m*=1+HILL.melee;
  const Gd=TGROUND[T.kind[i]];if(Gd&&Gd.hit&&!groundHome(att,Gd.home))m*=Gd.hit;const Gt=TGROUND[T.kind[j]];if(Gt&&Gt.hurt)m*=Gt.hurt;return m}
/* does the ground block a's view of b (morale.js moraleVisible)? Raised ground between them (riseBlocked: a plateau higher than
   both, phase 3), or a walk over the cells between them: TERRAIN_GROUND.wood.view wood cells (not counting their own) block it,
   but not woods lower than a stands (HILL.view: he sees over them) */
function terrainBlocksView(a,b){
  const T=B&&B.terrain;if(!T||!(T.has.wood||T.shTop))return false;if(T.shTop&&riseBlocked(T,a.x,a.y,b.x,b.y))return true;if(!T.has.wood)return false;
  const cs=T.cs,C=T.C,R=T.R,vl=T.lvl[tIx(T,a.x,a.y)],need=TERRAIN_GROUND.wood.view;
  let c=clamp(Math.floor(a.x/cs),0,C-1),r=clamp(Math.floor(a.y/cs),0,R-1);const c1=clamp(Math.floor(b.x/cs),0,C-1),r1=clamp(Math.floor(b.y/cs),0,R-1);
  // (the walk passes |dc|+|dr|-1 cells between them; and none at all where the box round them holds fewer wood cells than need)
  if(Math.abs(c1-c)+Math.abs(r1-r)<=need)return false;{const S=T.woodSum,W1=C+1,ca=c<c1?c:c1,cb=(c<c1?c1:c)+1,ra=r<r1?r:r1,rb=(r<r1?r1:r)+1;if(S[rb*W1+cb]-S[ra*W1+cb]-S[rb*W1+ca]+S[ra*W1+ca]<need)return false}
  const dx=b.x-a.x,dy=b.y-a.y,sx=dx>0?1:-1,sy=dy>0?1:-1,tdx=dx?Math.abs(cs/dx):Infinity,tdy=dy?Math.abs(cs/dy):Infinity;
  let tx=dx?((sx>0?(c+1)*cs:c*cs)-a.x)/dx:Infinity,ty=dy?((sy>0?(r+1)*cs:r*cs)-a.y)/dy:Infinity,n=0;
  for(let step=C+R;step>0;step--){if(tx<ty){c+=sx;tx+=tdx}else{r+=sy;ty+=tdy}if(c===c1&&r===r1||c<0||r<0||c>=C||r>=R)break;const i=r*C+c;if(T.kind[i]===TKIND.wood&&T.lvl[i]>=vl&&++n>=need)return true}
  return false}
/* a missile entering a wood cell low (arc z<10, or a flat bolt): stopped at TERRAIN_GROUND.wood.stop per cell (projectiles.js);
   an arc coming down (down: it is falling) through the canopy into a wood cell, once, at .canopy. a.cell: the cell it was last in
   (first seen: the one it came from). True if stopped (a Math.random draw only on wood) */
function woodStops(a,x,y,px,py,down){
  const T=B.terrain,i=tIx(T,x,y);if(down&&!a.dn){a.dn=1;a.cell=i;return T.kind[i]===TKIND.wood&&Math.random()<TERRAIN_GROUND.wood.canopy}
  if(a.cell===undefined)a.cell=tIx(T,px,py);if(i===a.cell)return false;a.cell=i;
  return T.kind[i]===TKIND.wood&&Math.random()<TERRAIN_GROUND.wood.stop}
/* once a frame after all movement (projectiles.js updateProjectiles): each soldier's ground (u.gk kind, u.glv level), and a
   shooter's range from the level he stands on, rewritten only when it changes (s.range is read in some 70 places: they all see
   it). His stats are copied first (a big one's can be the shared ST record); a stats record replaced since (a console edit) is
   taken back to level 0. In deep water his charge's momentum is gone (D1) */
function terrainStep(){
  const T=B&&B.terrain;if(!T)return;
  for(const u of B.units){if(u.hp<=0)continue;const i=tIx(T,u.x,u.y),lv=T.lvl[i];u.gk=T.kind[i];u.glv=lv;if(u.gk===TKIND.deep&&u.run)u.run=0;let s=u.s;if(!s||!(s.range>0))continue;
    if(u.rS!==s){const r0=u.rS?s.range/(1+HILL.range*(u.rl||0)):s.range;s=u.s={...s};u.rS=s;u.r0=r0;u.rl=-1}
    if(lv!==u.rl){s.range=u.r0*(1+HILL.range*lv);u.rl=lv}}}
// the ground under a group, for its details (the HUD: "High ground (+15% range) · Woods (slowed)"); '' with none
function groundLabel(m){
  const T=B&&B.terrain;if(!T||!m||!m.length)return '';const l=m.filter(u=>u.hp>0);if(!l.length)return '';const out=[],lv=Math.round(l.reduce((n,u)=>n+levelAt(u.x,u.y),0)/l.length);
  if(lv>0)out.push('High ground'+(l.some(u=>u.s.range>0)?' (+'+Math.round(HILL.range*lv*100)+'% range)':''));
  for(const K of [TKIND.wood,TKIND.marsh,TKIND.ford,TKIND.deep,TKIND.bridge]){const n=l.filter(u=>groundAt(u.x,u.y)===K).length;
    if(n*2>=l.length)out.push(K===TKIND.bridge?'On a bridge':TGROUND[K].n+(K===TKIND.deep&&l.some(u=>u.s.range>0)?' (slowed, cannot shoot)':' (slowed)'))}
  if(T.road&&l.filter(u=>T.road[tIx(T,u.x,u.y)]===1).length*2>=l.length)out.push('On the road (+'+Math.round((TERRAIN_ROAD.spd-1)*100)+'% speed)');
  return out.join(' · ')}

/* ---- rivers: where the water is, and the ways over it (the AI's helpers: the contract at the top; crossWay, the soldiers') ---- */
// the water of river i (0: the first) at height y: [x0, x1] in px, or null
function riverSpan(y,i=0){const T=B&&B.terrain,v=T&&T.recipe.rivers[i];if(!v)return null;const r=clamp(Math.floor(y/T.cs),0,T.R-1);return v.sp0[r]<0?null:[v.sp0[r],v.sp1[r]]}
// does the straight way from (ax,ay) to (bx,by) cross deep water (cells looked at every half cell)?
function crossesDeep(ax,ay,bx,by){
  const T=B&&B.terrain;if(!T||!T.has.water||!T.wband||Math.max(ax,bx)<T.wband[0]||Math.min(ax,bx)>T.wband[1])return false;
  const n=Math.ceil(Math.hypot(bx-ax,by-ay)/(T.cs/2));for(let k=0;k<=n;k++){const f=k/(n||1);if(T.kind[tIx(T,ax+(bx-ax)*f,ay+(by-ay)*f)]===TKIND.deep)return true}return false}
/* the way to (x,y) for a soldier going there (actors.js: his place in his group's formation, or the foe he charges) when his
   straight way crosses deep water: by a crossing — to its mouth on his side, then over to the far mouth, keeping his place
   across its width (TERRAIN_RIVER.inset in from its edges: a wide line squeezes onto a bridge or a ford, and those far off it
   wade) — if that is quicker than wading; else null. [x,y] to make for. u.xc, u.xd: the crossing he took and which way (kept
   till wading is TERRAIN_RIVER.keep quicker); none from deep water (he wades on) */
function crossWay(u,x,y){
  const T=B.terrain,L=T.ai.crossings;if(!L.length||!T.wband)return null;const V=TERRAIN_RIVER;
  if(u.x<T.wband[0]&&x<T.wband[0]||u.x>T.wband[1]&&x>T.wband[1]||T.kind[tIx(T,u.x,u.y)]===TKIND.deep){if(u.xc)u.xc=null;return null}
  const d=x>u.x?1:-1,c0=u.xc,mouth=c=>d>0?[c.x0-V.pad,c.x1+V.pad]:[c.x1+V.pad,c.x0-V.pad],lane=c=>clamp(u.y,c.y0+V.inset,c.y1-V.inset);
  // (on the crossing he took and not yet off it: on over)
  if(c0&&u.xd===d){const [en,ex]=mouth(c0);if(u.y>=c0.y0&&u.y<=c0.y1&&d*(u.x-en)>=-8&&d*(ex-u.x)>8&&d*(x-ex)>0)return[ex,lane(c0)]}
  let best=null,bc=Math.hypot(x-u.x,y-u.y)+T.wwide*(1/groundSpd(u,TERRAIN_GROUND.deep)-1);
  for(const c of L){const [en,ex]=mouth(c);if(d*(x-ex)<=0||d*((d>0?c.x1:c.x0)-u.x)<=0)continue;const yy=lane(c),k=Math.hypot(en-u.x,yy-u.y)+Math.abs(ex-en)/(c.kind==='bridge'?1:groundSpd(u,TERRAIN_GROUND.ford))+Math.hypot(x-ex,y-yy);
    if((c===c0?k/V.keep:k)<bc){bc=c===c0?k/V.keep:k;best=c}}
  if(!best){if(u.xc)u.xc=null;return null}
  u.xc=best;u.xd=d;const [en,ex]=mouth(best);return u.y>=best.y0&&u.y<=best.y1&&d*(u.x-en)>=-8?[ex,lane(best)]:[en,lane(best)]}

/* ---- the way round (phase 4: impassable deep water, cliffs and rock; route.js on the field's grids, doc/TERRAIN_DESIGN.md §10).
   With no B.terrain, or one where nothing blocks a step (T.blocky false: crossWay steers round wadeable water as in phase 2), none
   of this runs and every step is as it was ---- */
// every: a soldier's own way taken again this often (s, staggered by his id); min: no sooner than this when only its goal's cell
// moved; reach: a waypoint this near is passed; r: the half-width (px) a soldier's straight way keeps clear (a charge's too: no
// momentum builds while it is not clear); clear: a straight way reckoned again this often (s), or when he or its end changes
// cell; half: a group's way keeps the lesser of half its front and this clear (px); n: the ways laid so far (their ids)
const ROUTE_UNIT={every:.5,min:.25,reach:10,r:3,clear:.5,half:24,n:0};
/* the field's grids (T.route: foot, mounted, big; route.js routeGridOf), deep water impassable unless TERRAIN.wade (T.wade, read
   now), the cell rows wholly off the field (above top, below bot) closed; T.solid: the cells no one steps into (rock, impassable
   water); T.step: those and the cliffs as a grid of their own, for each soldier's step (terrainHold); T.blocky: any of them on the
   field. Again by whoever changes kind or wall (with terrainIndex) */
function terrainRoutes(T,top,bot){
  if(top==null){top=T.rows?T.rows[0]:FIELD_EDGE.top;bot=T.rows?T.rows[1]:BH-FIELD_EDGE.bot}const cs=T.cs,C=T.C,R=T.R,N=C*R,wade=T.wade??TERRAIN.wade,so=new Uint8Array(N),ps=new Uint8Array(N);
  for(let i=0;i<N;i++){const k=T.kind[i],Gd=TGROUND[k];if(Gd&&Gd.solid||k===TKIND.deep&&!wade)so[i]=1;else ps[i]=1}
  T.wade=wade;T.rows=[top,bot];T.solid=so;T.blocky=!!(T.wall&&T.wall.some(v=>v))||so.includes(1);T.step={cs,C,R,cost:ps,wall:T.wall||new Uint8Array(N)};
  const shut=g=>{for(let r=0;r<R;r++)if((r+1)*cs<=top||r*cs>=bot)g.cost.fill(0,r*C,r*C+C);return g};
  T.route={foot:shut(routeGridOf(T,{deep:!wade,who:'foot'})),mounted:shut(routeGridOf(T,{deep:!wade,who:'mounted'})),big:shut(routeGridOf(T,{deep:!wade,who:'big'}))};return T}
// (may one step straight from (ax,ay) to (bx,by): no cell entered that no one may enter, no cliff crossed its blocked way, no
// corner cut; one standing in such a cell steps out freely)
function stepOk(T,ax,ay,bx,by){const cs=T.cs,i=tIx(T,ax,ay);return i===tIx(T,bx,by)||T.solid[i]===1||routeWalk(T.step,ax,ay,bx,by,255)}
/* no step into a cell no one may enter, nor over a cliff its blocked way (battle.js updateBattle: once a frame after all movement,
   knocks, jostling and the field's clamp): each soldier's move since the frame began (was: where each stood) is refused, or slid
   along (his x move alone, else his y move alone), if it would */
function terrainHold(was){
  const T=B&&B.terrain;if(!T||!T.blocky)return;
  for(const u of B.units){if(u.hp<=0)continue;const p=was.get(u);if(!p)continue;const ax=p[0],ay=p[1],bx=u.x,by=u.y;if(ax===bx&&ay===by||stepOk(T,ax,ay,bx,by))continue;
    if(stepOk(T,ax,ay,bx,ay))u.y=ay;else if(stepOk(T,ax,ay,ax,by))u.x=ax;else{u.x=ax;u.y=ay}}}
// (a soldier's grid: big, mounted or foot; s: his stats)
const routeWho=s=>s.big?'big':s.mounted?'mounted':'foot';
// (is the straight way from u to (x,y) clear on grid g, ROUTE_UNIT.r either side: reckoned again when he or it changes cell, the
// grid's version moves, or every ROUTE_UNIT.clear s; k: which of his two such reckonings (0, 1) it is)
function clearTo(u,g,x,y,k){const key=routeIx(g,u.x,u.y)*g.cost.length+routeIx(g,x,y),c=u.lc||(u.lc=[-1,0,0,false,-1,0,0,false]),o=k*4;
  if(c[o]===key&&c[o+1]===g.v&&B.t<c[o+2])return c[o+3];c[o]=key;c[o+1]=g.v;c[o+2]=B.t+ROUTE_UNIT.clear;return c[o+3]=lineClear(g,u.x,u.y,x,y,255,ROUTE_UNIT.r)}
// (the point to make for on way p, from his place on it (o[k], a waypoint index): one within reach is passed, and one skipped while
// the one after it lies in a clear line (looked at when he changes cell, or every ROUTE_UNIT.clear s: o[k+'C'], o[k+'T']))
function wayNext(u,g,p,o,k){if(!p.length)return null;let i=o[k]||0;const c=routeIx(g,u.x,u.y),look=c!==o[k+'C']||B.t>=(o[k+'T']||0);if(look){o[k+'C']=c;o[k+'T']=B.t+ROUTE_UNIT.clear}
  while(i<p.length-1&&(Math.hypot(p[i][0]-u.x,p[i][1]-u.y)<ROUTE_UNIT.reach||look&&lineClear(g,u.x,u.y,p[i+1][0],p[i+1][1],255,ROUTE_UNIT.r)))i++;o[k]=i;return p[i]}
/* the point a soldier going to (x,y) on grid g makes for: null (straight there) while the straight way is clear; else the next
   point of his own way there (route.js routePath, kept in u.wy: taken again when the grid's version moves, every ROUTE_UNIT.every
   s (staggered by his id), or when the goal changes cell (after ROUTE_UNIT.min s); neighbours going alike share the path cache).
   Chases, charges, routs, withdrawals (k: which clearTo reckoning) */
function steerTo(u,x,y,g,k=0){
  if(clearTo(u,g,x,y,k)){if(u.wy)u.wy=null;return null}
  const gc=routeIx(g,x,y);let W=u.wy;
  if(!W||W.g!==g||W.v!==g.v||B.t>=W.at||W.gc!==gc&&B.t>=W.t0+ROUTE_UNIT.min)W=u.wy={p:routePath(g,u.x,u.y,x,y),i:0,g,gc,v:g.v,t0:B.t,at:B.t+ROUTE_UNIT.every*(.75+.5*((u.id||0)*.618%1))};
  return wayNext(u,g,W.p,W,'i')}
// (the way u goes toward (x,y) on ground that blocks: a unit vector (STEER, reused), or null: straight on)
const STEER=[0,0];
function steerDir(u,x,y){const T=B.terrain;if(!T||!T.blocky)return null;const w=steerTo(u,x,y,T.route[routeWho(u.s)]);if(!w)return null;
  const qx=w[0]-u.x,qy=w[1]-u.y,l=Math.hypot(qx,qy);if(!(l>1e-9))return null;STEER[0]=qx/l;STEER[1]=qy/l;return STEER}
/* a group's way to its place (g.ax, g.ay) over ground that blocks (battlecontrol.js step, while it holds or advances): from its
   men's middle on the grid of its slowest kind (a big one's, else riders' when most ride), its legs keeping the lesser of half its
   front and ROUTE_UNIT.half clear; laid again for a new place (another cell), a new move order (mvId), a new grid version, or a
   cut way's end reached (dropped while it charges or withdraws).
   g.way: {p (waypoints, route.js), id, gc, v, who, ok (its place reached), cut, end (where it ends: its place, or the reachable
   point nearest)} */
function groupWay(g,m){
  const T=B.terrain,who=m.some(u=>u.s.big)?'big':m.filter(u=>u.s.mounted).length*2>m.length?'mounted':'foot',gr=T.route[who],gc=routeIx(gr,g.ax,g.ay),W=g.way;
  let cx=0,cy=0;for(const u of m){cx+=u.x;cy+=u.y}cx/=m.length;cy/=m.length;
  if(W&&W.gc===gc&&W.v===gr.v&&W.who===who&&W.mv===g.mvId&&!(W.cut&&Math.hypot(W.end[0]-cx,W.end[1]-cy)<ROUTE_UNIT.reach*3))return W;
  const sh=grpShape(g.id),half=sh?Math.min(ROUTE_UNIT.half,sh.files*(FORMS[g.form]||FORMS.line).gx/2):ROUTE_UNIT.r,p=routePath(gr,cx,cy,g.ax,g.ay,{r:half});
  return g.way={p,id:++ROUTE_UNIT.n,gc,v:gr.v,who,mv:g.mvId,ok:p.ok,cut:p.cut,end:p.length?p[p.length-1]:[g.ax,g.ay]}}
/* the point a soldier keeping his place in his group makes for (actors.js aiUnit; null: no way laid): his place (sx,sy), pulled in
   toward where the group's way ends while rock, water or a cliff lies between the two (u.sf: kept while his place and the way are
   the same); straight there while that way is clear (the array's at: true); else along his group's way (his own index on it, u.gw),
   or (pushed off it) his own way to its point he makes for */
function slotWay(u,g,sx,sy){
  const T=B.terrain,gr=T.route[routeWho(u.s)],W=g.way;if(!W)return null;let f=u.sf;
  if(!f||f[0]!==W.id||f[1]!==sx||f[2]!==sy){const A=W.ok?[g.ax,g.ay]:W.end,ox=sx-g.ax,oy=sy-g.ay;let q=A;
    for(const k of [1,.66,.33]){const x=A[0]+ox*k,y=A[1]+oy*k;if(gr.cost[routeIx(gr,x,y)]&&lineClear(gr,A[0],A[1],x,y)){q=[x,y];break}}f=u.sf=[W.id,sx,sy,q[0],q[1]]}
  if(clearTo(u,gr,f[3],f[4],0)){const o=[f[3],f[4]];o.at=true;return o}
  if(u.gwId!==W.id){u.gwId=W.id;u.gw=0;u.gwT=0}const q=wayNext(u,gr,W.p,u,'gw');if(!q){const o=[f[3],f[4]];o.at=true;return o}
  return clearTo(u,gr,q[0],q[1],1)?q:steerTo(u,q[0],q[1],gr,1)||q}
/* (the captains' measure of the ground, commander.js: the length of the way from a to b (px) on who's grid, Infinity out of reach;
   the straight distance where it is clear, or where nothing blocks; from a's cell once for every b (route.js routeDist, kept)) */
function wayLen(a,b,who='foot'){const T=B&&B.terrain;if(!T||!T.blocky)return Math.hypot(b.x-a.x,b.y-a.y);const g=T.route[who];if(lineClear(g,a.x,a.y,b.x,b.y))return Math.hypot(b.x-a.x,b.y-a.y);
  const D=routeDist(g,a.x,a.y),i=routeNear(g,routeIx(g,b.x,b.y));return i<0||D[i]===Infinity?Infinity:D[i]*g.cs/(2*ROUTE.unit)}
const canReach=(a,b,who)=>wayLen(a,b,who)<Infinity;
/* (field variety: riders on a dense field keep to its ways, commander.js ride): the point of the field's roads, deer paths and
   clearings' chains (B.terrain.ai.ways) to ride for on the way from a to b when the straight way runs through woods
   (TERRAIN_DENSE.ride of it at least) and going by that point is quicker (the woods' slow reckoned for riders, a gain of
   TERRAIN_DENSE.gain at least); one nearer b than a is (so they go on along the way); null: straight on */
function wayRide(a,b){
  const T=B&&B.terrain;if(!T||!T.ai||!T.ai.dense||!T.ai.ways||!T.ai.ways.length)return null;const DT=TERRAIN_DENSE,slow=1/TERRAIN_GROUND.wood.spd.mounted-1;
  const wf=(ax,ay,bx,by)=>{const L=Math.hypot(bx-ax,by-ay),n=Math.max(1,Math.ceil(L/T.cs));let w=0;for(let k=0;k<=n;k++)if(T.kind[tIx(T,ax+(bx-ax)*k/n,ay+(by-ay)*k/n)]===TKIND.wood)w++;return w/(n+1)};
  const cost=(ax,ay,bx,by)=>Math.hypot(bx-ax,by-ay)*(1+wf(ax,ay,bx,by)*slow),f0=wf(a.x,a.y,b.x,b.y);if(f0<DT.ride)return null;
  const direct=Math.hypot(b.x-a.x,b.y-a.y)*(1+f0*slow),da=Math.hypot(b.x-a.x,b.y-a.y);let best=null,bc=direct*(1-DT.gain);
  for(const w of T.ai.ways)for(const q of w){const dq=Math.hypot(b.x-q[0],b.y-q[1]);if(dq>da-T.cs||Math.hypot(q[0]-a.x,q[1]-a.y)<T.cs)continue;const c=cost(a.x,a.y,q[0],q[1])+cost(q[0],q[1],b.x,b.y);if(c<bc){bc=c;best=q}}
  return best?{x:best[0],y:best[1]}:null}
// (the same for a spot near a: its way's length if it is no longer than max px, else Infinity; a search bounded to about that
// ground, not the whole field's: the shooters' perch, commander.js)
function nearLen(a,b,max,who='foot'){const T=B&&B.terrain,d=Math.hypot(b.x-a.x,b.y-a.y);if(!T||!T.blocky||d>max)return d>max?Infinity:d;const g=T.route[who];if(lineClear(g,a.x,a.y,b.x,b.y))return d;
  const n=Math.ceil(max/g.cs),p=routePath(g,a.x,a.y,b.x,b.y,{budget:4*n*n});if(!p.ok)return Infinity;let x=a.x,y=a.y,L=0;for(const w of p){L+=Math.hypot(w[0]-x,w[1]-y);x=w[0];y=w[1]}return L>max?Infinity:L}

/* ---- sight (phase 3): who sees whom; the contract with the AI (commander.js) and the HUD ----
   seenBy(team,u): does that side see u (always true for his own side, with no terrain, or on a field with no wood or rise).
   visibleFoes(team): the living soldiers of other sides that side sees. lastSeen(team,u): {x,y} where that side last saw him (his
   place now while seen; null never seen). sightGoal(g,team): an order of g's aimed at a group (or one) that side sees none of
   now: {x,y} where it was last seen (their mean), else null. All read u.hid (a bit a side he is hidden from), set by sightStep
   every SIGHT.every s of battle (battle.js, after the arrows; at a battle's start, setup.js) and cleared at once for the side he
   strikes or shoots at (sightStruck: attacks.js). The state is B.sight (B.terrain.sight the same, with terrain). With no
   B.terrain and no fog (B.fog: battlefog.js) nothing is ever set: everyone is seen. With fog, a side also sees no one beyond
   its soldiers' sight ranges (battlefog.js FOG) */
const sightOn=()=>!!B&&!!(B.terrain||B.fog);
const seenBy=(team,u)=>!(u.hid&1<<team);
function visibleFoes(team){return B.units.filter(u=>u.hp>0&&u.team!==team&&!(u.hid&1<<team))}
function lastSeen(team,u){if(!(u.hid&1<<team))return{x:u.x,y:u.y};const p=u.ls;return p&&p[2*team]!=null?{x:p[2*team],y:p[2*team+1]}:null}
// (does raised ground between (ax,ay) and (bx,by) hide one from the other: a cell between them at least a level higher than both
// (or a blocking kind's); a DDA walk over the cells, after the box between holds such a cell (hiSum). Their own cells never count)
function riseBlocked(T,ax,ay,bx,by){
  if(!T.shTop)return false;const cs=T.cs,C=T.C,R=T.R,sh=T.sh;let c=clamp(Math.floor(ax/cs),0,C-1),r=clamp(Math.floor(ay/cs),0,R-1);const c1=clamp(Math.floor(bx/cs),0,C-1),r1=clamp(Math.floor(by/cs),0,R-1);
  const la=sh[r*C+c],lb=sh[r1*C+c1],need=(la>lb?la:lb)+1,H=T.hiSum[need];if(!H||Math.abs(c1-c)+Math.abs(r1-r)<=1)return false;
  {const W1=C+1,ca=c<c1?c:c1,cb=(c<c1?c1:c)+1,ra=r<r1?r:r1,rb=(r<r1?r1:r)+1;if(H[rb*W1+cb]-H[ra*W1+cb]-H[rb*W1+ca]+H[ra*W1+ca]<1)return false}
  const dx=bx-ax,dy=by-ay,sx=dx>0?1:-1,sy=dy>0?1:-1,tdx=dx?Math.abs(cs/dx):Infinity,tdy=dy?Math.abs(cs/dy):Infinity;
  let tx=dx?((sx>0?(c+1)*cs:c*cs)-ax)/dx:Infinity,ty=dy?((sy>0?(r+1)*cs:r*cs)-ay)/dy:Infinity;
  for(let step=C+R;step>0;step--){if(tx<ty){c+=sx;tx+=tdx}else{r+=sy;ty+=tdy}if(c===c1&&r===r1||c<0||r<0||c>=C||r>=R)break;if(sh[r*C+c]>=need)return true}
  return false}
/* who sees whom, every SIGHT.every s (force: now). For each side, its living soldiers filed in 32-px buckets (near) and the cells
   they stand in (each once: its lines of sight, from cell middle to cell middle). A soldier who could hide (in a wood; or where a
   rise could stand between: a field with one, and he below its top) is checked against each other side: struck or shot by him
   lately, a soldier of theirs near, then (not in a wood) a line of sight from any of their cells (one standing on the field's top
   level sees over every rise; the cell that saw him last is tried first, each line once a reckoning). u.hid: the sides he is
   hidden from; u.ls: where each side last saw him. A group wholly hidden from its foes is noted for an ambush (S.hid).
   Fog of war (B.fog, battlefog.js): only the living who do not run are filed; a soldier not in a wood is seen by a side whose
   sight grid has his cell (fogGrid, fogSees), or who was struck by him lately; one in a wood as above. A group counts as lying
   in wait only in a wood or within its foes' range, hidden by the ground (not merely out of sight: fogGrid's rng) */
function sightStep(force){
  const T=B&&B.terrain,F=!!(B&&B.fog);if(!T&&!F)return;let S=B.sight;if(!S)S=B.sight={next:-1,n:0,hid:new Map(),sprung:new Map(),goal:new Map(),los:new Map(),seer:new Map()};if(T)T.sight=S;
  if(!force&&B.t<S.next)return;S.next=B.t+SIGHT.every;S.n++;S.goal.clear();S.los.clear();
  const live=[];for(const u of B.units)if(u.hp>0)live.push(u);const n=live.length,teams=[];for(const u of live)if(!teams.includes(u.team))teams.push(u.team);
  const foes=t=>teams.reduce((m,o)=>o===t?m:m|1<<o,0),now=B.t;
  if(!F&&!(T.has.wood||T.shTop)){for(const u of live){if(u.hid)u.hid=0;const p=u.ls||(u.ls=[]);for(const t of teams)if(t!==u.team){p[2*t]=u.x;p[2*t+1]=u.y}}return}
  const cs=T?T.cs:FOG.cell,C=T?T.C:Math.ceil(BW/cs),CR=T?T.R:Math.ceil(BH/cs),K=T&&T.kind,LV=T&&T.lvl,sh=T&&T.sh,BC=Math.ceil(BW/32),BR=Math.ceil(BH/32),wood=TKIND.wood,blk=!!T&&T.shTop>T.lvlTop,V={},nxt=new Int32Array(n),ul=new Uint8Array(n),uc=new Int32Array(n);
  for(const t of teams)V[t]={head:new Int32Array(BC*BR).fill(-1),cells:[],mark:F?null:new Uint8Array(C*CR),top:false};
  for(let k=0;k<n;k++){const u=live[k],i=T?tIx(T,u.x,u.y):clamp(Math.floor(u.y/cs),0,CR-1)*C+clamp(Math.floor(u.x/cs),0,C-1),v=V[u.team],b=clamp(Math.floor(u.y/32),0,BR-1)*BC+clamp(Math.floor(u.x/32),0,BC-1);uc[k]=i;ul[k]=LV?LV[i]:0;
    if(F){if(!u.rout&&!u.left){nxt[k]=v.head[b];v.head[b]=k}continue}nxt[k]=v.head[b];v.head[b]=k;
    if(!v.mark[i]){v.mark[i]=1;v.cells.push(i);if(sh[i]>=T.lvlTop)v.top=true}}
  const FG=F?fogGrid(S,T,live,uc,ul,teams):null;
  const near2=SIGHT.near*SIGHT.near,high2=SIGHT.high*SIGHT.high,r=SIGHT.high;
  const near=(v,u,lu)=>{const x=u.x,y=u.y,b0=clamp(Math.floor((x-r)/32),0,BC-1),b1=clamp(Math.floor((x+r)/32),0,BC-1),a0=clamp(Math.floor((y-r)/32),0,BR-1),a1=clamp(Math.floor((y+r)/32),0,BR-1);
    for(let a=a0;a<=a1;a++)for(let b=b0;b<=b1;b++)for(let k=v.head[a*BC+b];k>=0;k=nxt[k]){const o=live[k],d=(o.x-x)*(o.x-x)+(o.y-y)*(o.y-y);if(d<=near2||d<=high2&&ul[k]>lu)return true}return false};
  const mx=i=>(i%C+.5)*cs,my=i=>(Math.floor(i/C)+.5)*cs;
  const los=(v,t,i)=>{const key=i*8+t;let q=S.los.get(key);if(q!==undefined)return q;const x=mx(i),y=my(i),j0=S.seer.get(key);q=false;
    if(j0!==undefined&&v.mark[j0])q=!riseBlocked(T,mx(j0),my(j0),x,y);
    if(!q)for(const j of v.cells){if(!riseBlocked(T,mx(j),my(j),x,y)){q=true;S.seer.set(key,j);break}}
    S.los.set(key,q);return q};
  const all=new Map();
  for(let k=0;k<n;k++){const u=live[k],i=uc[k],inW=!!K&&K[i]===wood,open=!inW&&!!T&&T.shTop>0&&(blk||sh[i]<T.lvlTop);let hid=0,lurk=!F;
    if(F){for(const t of teams){if(t===u.team)continue;
      if(u.rv&&now-(u.rv[t]??-1e9)<SIGHT.memory||(inW?near(V[t],u,ul[k]):fogSees(FG,T,t,u,i,ul[k])))continue;hid|=1<<t;if(inW||FG.rng[t][i])lurk=true}}
    else if(inW||open)for(const t of teams){if(t===u.team)continue;
      if(u.rv&&now-(u.rv[t]??-1e9)<SIGHT.memory||near(V[t],u,ul[k])||open&&(!blk&&V[t].top||los(V[t],t,i)))continue;hid|=1<<t}
    if(hid!==(u.hid|0))u.hid=hid;const p=u.ls||(u.ls=[]);for(const t of teams)if(t!==u.team&&!(hid&1<<t)){p[2*t]=u.x;p[2*t+1]=u.y}
    const f=foes(u.team),gk=u.grp||'u'+u.id,w=f!==0&&(hid&f)===f&&lurk;all.set(gk,(all.get(gk)??true)&&w)}
  for(const [gk,w] of all)if(w)S.hid.set(gk,now);
  if(F)fogGhosts(S,T)}
// he struck or shot at t: t's side sees him now and for SIGHT.memory s (attacks.js: a blow, a shot loosed, a missile landing)
function sightStruck(att,t){const S=B&&B.sight;if(!S||!att||!t||att.team===t.team)return;(att.rv||(att.rv=[]))[t.team]=B.t;
  if(att.hid&1<<t.team){att.hid&=~(1<<t.team);const p=att.ls||(att.ls=[]);p[2*t.team]=att.x;p[2*t.team+1]=att.y;S.goal.clear()}}
// (an order at a target that side sees none of: where it was last seen; reckoned once a sight step for each target)
function sightGoal(g,team){
  const S=B&&B.sight;if(!S||!g||!g.hasTarget)return null;const key=team+'|'+g.targetGroupId+'|'+g.targetUnitId;if(S.goal.has(key))return S.goal.get(key);
  const m=g.targetMembers();let q=null;if(m.length&&m.every(u=>u.hid&1<<team)){let x=0,y=0,c=0;for(const u of m){const p=u.ls;if(p&&p[2*team]!=null){x+=p[2*team];y+=p[2*team+1];c++}}if(c)q={x:x/c,y:y/c}}
  S.goal.set(key,q);return q}
// a charge's shock from ambush (morale.js chargeMul): AMBUSH.shock if his group was wholly unseen by its foes within AMBUSH.window
// s and has not sprung one yet (springing it now: its event, the banner), or sprang it within AMBUSH.burst s; else 1
function ambushMul(u){
  const S=B&&B.sight;if(!S)return 1;const gk=u.grp||'u'+u.id,h=S.hid.get(gk);if(h===undefined)return 1;const sp=S.sprung.get(gk);
  if(sp===undefined){if(B.t-h>AMBUSH.window)return 1;S.sprung.set(gk,B.t);battleEvent('ambush',{u});return AMBUSH.shock}
  return B.t-sp<=AMBUSH.burst?AMBUSH.shock:1}
