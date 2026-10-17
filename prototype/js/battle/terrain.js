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
// level-2 hill's crest (share of its radius); slope: a terrace's slope band (cells in from its rim). With terrain a field has no
// scattered trees, rocks or cacti (B.obs empty: setup.js; the owner reversed D10): its woods, hills and marsh are its features
// wade: deep water wadeable as in phase 2 (D1; crossWay steers round it), else impassable (phase 4: the owner's call), read when a
// field is built
const TERRAIN={on:true,cs:16,floor:.3,tries:8,lane:96,zone:.3,zoneWood:.25,score:.15,mirror:32,centre:.08,jit:.02,top2:.55,slope:2,wade:false};
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
   streamP: a swamp with no water near: the chance of a ford-only stream; pad: a crossing's mouth off the water (px); inset: how
   far inside a crossing's edges those going over keep (px); keep: a crossing taken stays taken unless wading gets this much
   quicker (crossWay) */
const TERRAIN_RIVER={half:24,stream:16,meander:32,jit:.02,ford:64,bridge:32,gap:120,minGap:40,edge:40,fords:[1,2],near:2,mid:64,clear:24,streamP:.5,pad:10,inset:8,keep:1.15};
/* range: a shooter's range per level he stands on; melee: a blow at a foe at least one level lower; charge: the charge bonus
   scaled by 1+charge·Δlevel (Δ clamped ±1); climb: speed going up a slope cell (dot > dot), by foot/mounted/big (the owner: a
   step up is hard going); descend: going down one; runUp, runDown: momentum building up or down a slope; climbSta: stamina
   running uphill; climbing also breaks cohesion while it lasts (morale.js cohesionReady); home: who climbs freely (dwarves) */
/* sight (phase 3: hidden in woods, doc/TERRAIN_DESIGN.md §8). A soldier in a wood is unseen by a side with no living soldier
   within near px of him (high px from higher ground) and none of whom he struck or shot in the last memory s; so is one anywhere
   whom raised ground hides from every soldier of that side (a cell between them a level higher than both: riseBlocked; a kind
   with blocks: true hides all, phase 4's mountains). every: how often it is reckoned (s of battle time); wall: a blocking cell's
   height. AMBUSH: a group wholly unseen by its foes within window s before its charge lands springs an ambush: its charges'
   shock ×shock for burst s, once a battle (morale.js chargeMul) */
const SIGHT={every:.25,near:64,high:96,memory:3,wall:255};
const AMBUSH={shock:1.5,window:3,burst:1.5};
const HILL={range:.075,melee:.1,charge:.35,climb:{foot:.6,mounted:.5,big:.5},descend:1.15,runUp:.6,runDown:1.25,climbSta:2,dot:.5,home:'hills'};
/* what the world round the battle lays out (§3; its river: terrainAt, riverPlan). layouts: [name, weight], one picked (terrainPlan): plain
   (nothing), hill (one centred), woodedHill (one centred, trees on its top), copse (one small wood in the middle), copses (small
   woods in mirrored pairs), woods (forest patches, half the time round a low hill), pair (a hill per half, mirrored), pairFlank
   (the same with a wood on each one's flank), ridge (one down the middle, half the time a copse), woodedRidge (trees along its
   crest), dune (a low ridge), marsh (dead trees and marsh). top: the level hills rise to; hr: hill radius; wr: wood radius;
   cr: a copse's; woods, marsh: [least, most] patches; mr: marsh radius. A desert never has woods, nor water or marsh but an
   oasis (oasis: its radius) where the world tile or a neighbour is water (the owner). river: the layouts with a river down the
   middle (nothing on it: its features in pairs, one each side). Phase 4: cliff, [the chance its hills are sheer (cliffs all round
   and one or two ramps), the chance they are one-way (cliffs one can drop down but never climb, and one ramp)]; rock, [the chance
   of mountains, of rock spires] (TERRAIN_ROCK; laid by featurePlan from a stream of its own) */
const TERRAIN_RECIPE={
  open:{layouts:[['plain',3],['hill',3],['copse',2],['woodedHill',2],['copses',2]],river:[['plain',3],['copses',2],['pair',2]],top:1,hr:[90,125],wr:[40,64],cr:[26,40],cliff:[.12,.08],rock:[.06,.1]},
  forest:{layouts:[['woods',4],['woodedHill',3],['copses',3]],river:[['woods',4],['copses',3]],top:1,hr:[80,110],wr:[80,110],cr:[30,48],woods:[3,4],cliff:[.08,.05],rock:[.04,.04]},
  hills:{layouts:[['pair',3],['ridge',2],['woodedRidge',2],['pairFlank',2]],river:[['pair',3],['pairFlank',2]],top:2,hr:[105,135],wr:[40,64],cr:[30,48],cliff:[.3,.2],rock:[.5,.15]},
  swamp:{layouts:[['marsh',1]],wr:[40,60],woods:[1,2],marsh:[3,5],mr:[60,90]},
  desert:{layouts:[['plain',1],['dune',1]],top:1,hr:[70,90],oasis:[45,65],rock:[0,.55]}
};
/* cliffs and rock (phase 4). frost, frostCliff: a frost field's rock and cliff chances ×; ramp: a ramp's width (px); ramps2: a
   sheer hill's chance of two ramps (else one); mr, mh: a mountain's radius (px) and peak (levels of PX.ROCK_PX px: rockH); sr, sh: a spire's; spires: [least,
   most] pairs of them; mid: the chance of one more in the middle (no river); pad: rock keeps this far inside the middle band (off
   the deployment zones, px); hill: and this far off a hill's rim (px); tries: places tried for each; crags: the lab's recipe of
   them (lab.js: cliff and rock chances in place of its recipe's) */
const TERRAIN_ROCK={frost:1.6,frostCliff:1.3,ramp:56,ramps2:.5,mr:[36,60],mh:[4,7],sr:[10,16],sh:[2,3],spires:[1,2],mid:.3,pad:24,hill:16,tries:12,crags:{cliff:[.5,.5],rock:[1,.6]}};
// (the 8 uphill directions of B.terrain.up: k·45°, screen y down)
const TDX=[1,Math.SQRT1_2,0,-Math.SQRT1_2,-1,-Math.SQRT1_2,0,Math.SQRT1_2],TDY=[0,Math.SQRT1_2,1,Math.SQRT1_2,0,-Math.SQRT1_2,-1,-Math.SQRT1_2];
// which recipe a battle at this world tile gets (t: battleEnv's terrain, water and peaks already as hills; c: the climate)
function terrainRecipeOf(t,c,forestN){return t===T_HILL?'hills':c==='swamp'?'swamp':c==='desert'?'desert':t===T_FOREST||forestN>=3?'forest':'open'}
/* the battle at world point (x,y): its recipe and seed (the tile and its kind: same place, same field); oasis: a desert by water;
   river (phase 2): water on a neighbouring tile runs a river down the field ({bridge: a road bridge within TERRAIN_RIVER.near
   tiles, frozen: in the frost}); a swamp with none near has a ford-only stream half the time ({stream}); a desert never (its
   oasis) */
function terrainAt(x,y,env){
  const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);let n=0,w=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const k=tAt(tx+dx,ty+dy);if(k===T_FOREST)n++;else if(k===T_WATER)w++}
  const recipe=terrainRecipeOf(env.t,env.c,n),code=1+Object.keys(TERRAIN_RECIPE).indexOf(recipe)*4+Math.max(0,CLIMS.indexOf(env.c));
  let river=null;if(recipe!=='desert'){if(w>0){const N=TERRAIN_RIVER.near,rb=(a,b)=>tAt(a,b)===T_ROAD&&(tAt(a-1,b)===T_WATER&&tAt(a+1,b)===T_WATER||tAt(a,b-1)===T_WATER&&tAt(a,b+1)===T_WATER);let br=false;
    for(let dy=-N;dy<=N&&!br;dy++)for(let dx=-N;dx<=N;dx++)if(rb(tx+dx,ty+dy)){br=true;break}river={bridge:br,frozen:env.c==='frost'}}
   else if(recipe==='swamp'&&hash(tx,ty,code+101)<TERRAIN_RIVER.streamP)river={stream:true}}
  return{recipe,seed:Math.floor(hash(tx,ty,code)*4294967296)>>>0,tx,ty,oasis:recipe==='desert'&&(w>0||tAt(tx,ty)===T_WATER),river,frost:env.c==='frost'}}
// a battle's ground, or null: none when off, in tournaments, sieges and raids (D6), and no river against a monster or in a cave
// (§3); the lab asks for its own (lab.js)
function groundSpecFor(opts,env){const e=G.enc;if(!TERRAIN.on||opts.tournament||opts.sandbox||e&&['siege','raid','tourney'].includes(e.kind))return null;const g=terrainAt(P.x,P.y,env);if(e&&['monster','cave'].includes(e.kind))g.river=null;return g}
// (marks the battle's env, unseen by snapshots: envStats then drops the old whole-field hill range, D2)
function groundEnv(env,spec){if(spec&&env&&!env.terrain)Object.defineProperty(env,'terrain',{value:true,configurable:true});return env}

/* ---- generation ---- */
// features in field px: hills {x,y,rx,ry,top}, woods and marsh {x,y,r}; lane: the band free patches keep out of; oasis: water near;
// riv: a river will run down the middle (its layouts: the recipe's river list; features in pairs, clear of it by clr px)
function terrainPlan(name,rnd,W,top,bot,oasis,riv){
  const Rc=TERRAIN_RECIPE[name]||TERRAIN_RECIPE.open,mid=(top+bot)/2,fh=bot-top,f=(a,b)=>a+(b-a)*rnd(),n=(a,b)=>a+Math.floor(rnd()*(b-a+1)),e=()=>.85+.3*rnd();
  const RV=TERRAIN_RIVER,clr=riv?RV.half+RV.meander+RV.jit*W/2+RV.clear:0,Ls=riv&&Rc.river||Rc.layouts;
  const P={recipe:name,hills:[],woods:[],marsh:[],layout:null};
  const ly=f(top+fh*.2,bot-fh*.2);P.lane={y0:ly-TERRAIN.lane/2-8,y1:ly+TERRAIN.lane/2+8};
  {let tot=0;const k=rnd()*Ls.reduce((a,l)=>a+l[1],0);for(const [l,w] of Ls){tot+=w;if(k<tot){P.layout=l;break}}P.layout=P.layout||Ls[0][0]}
  const L=P.layout,hill=(x,y,rx,ry,t)=>{const h={x,y,rx,ry,top:t};P.hills.push(h);return h};
  const one=t=>{const r=f(Rc.hr[0],Rc.hr[1]);return hill(W/2+(rnd()-.5)*TERRAIN.jit*W,mid+(rnd()-.5)*fh*.25,r*e(),r*e(),t)};
  const ridge=t=>{const r=f(Rc.hr[0],Rc.hr[1]);return hill(W/2+(rnd()-.5)*TERRAIN.jit*W,mid+(rnd()-.5)*fh*.1,r*.6*e(),r*1.7*e(),t)};
  const pair=()=>{const r=f(Rc.hr[0],Rc.hr[1]),d0=W*f(.2,.27),rx=r*e(),ry=r*e(),dx=Math.max(d0,clr&&clr+rx*1.2);return[hill(W/2-dx,mid+(rnd()-.5)*fh*.3,rx,ry,Rc.top),hill(W/2+dx+(rnd()-.5)*2*TERRAIN.mirror,mid+(rnd()-.5)*fh*.3,rx*(.95+.1*rnd()),ry*(.95+.1*rnd()),Rc.top)]};
  // (free patches keep out of the lane: an odd one in the middle, the rest in mirrored pairs; trees on a hill stay with it)
  const away=(y,r)=>{const m=r*1.35+TERRAIN.lane/2+8;return Math.abs(y-ly)>=m?y:y<ly?ly-m:ly+m};
  const patches=(list,cnt,rr,dxr)=>{let k=cnt;if(k%2){if(!riv){const r=f(rr[0],rr[1]);list.push({x:W/2+(rnd()-.5)*TERRAIN.jit*W,y:away(f(top,bot),r),r})}k--}
    while(k>0){const r=f(rr[0],rr[1]),dx=Math.max(W*f(dxr[0],dxr[1]),clr&&clr+r*1.35),y1=away(f(top,bot),r),y2=away(f(top,bot),r);list.push({x:W/2-dx,y:y1,r},{x:W/2+dx+(rnd()-.5)*2*TERRAIN.mirror,y:y2,r:r*(.95+.1*rnd())});k-=2}};
  if(L==='hill')one(Rc.top);
  else if(L==='woodedHill'){const h=one(Rc.top);P.woods.push({x:h.x,y:h.y,r:Math.min(h.rx,h.ry)*f(.45,.6)})}
  else if(L==='copse')patches(P.woods,1,Rc.cr,[0,0]);
  else if(L==='copses')patches(P.woods,2*n(1,2),Rc.cr,[.08,.24]);
  else if(L==='woods'){if(rnd()<.5&&!riv)one(1);patches(P.woods,n(Rc.woods[0],Rc.woods[1]),Rc.wr,[.1,.22])}
  else if(L==='pair')pair();
  else if(L==='pairFlank'){const [a,b]=pair(),s=rnd()<.5?-1:1,r=f(Rc.wr[0],Rc.wr[1]);for(const h of [a,b])P.woods.push({x:h.x+(h===a?1:-1)*h.rx*.2,y:h.y+s*h.ry*.7,r})}
  else if(L==='ridge'){ridge(Rc.top);if(rnd()<.5)patches(P.woods,1,Rc.cr,[0,0])}
  else if(L==='woodedRidge'){const h=ridge(Rc.top),r=Math.min(h.rx*.7,f(Rc.wr[0],Rc.wr[1])),s=rnd()<.5?-1:1;P.woods.push({x:h.x,y:h.y+s*h.ry*.25,r},{x:h.x,y:h.y-s*h.ry*.45,r:r*.8})}
  else if(L==='dune')ridge(Rc.top);
  else if(L==='marsh'){patches(P.woods,n(Rc.woods[0],Rc.woods[1]),Rc.wr,[.1,.22]);patches(P.marsh,n(Rc.marsh[0],Rc.marsh[1]),Rc.mr,[.08,.25])}
  if(oasis&&Rc.oasis){const r=f(Rc.oasis[0],Rc.oasis[1]);P.marsh.push({x:W/2+(rnd()-.5)*W*.04,y:away(f(top,bot),r),r})}
  return P}
/* phase 4's features on a plan, from a stream of their own (rnd: the rest of the field is as it was): its hills' cliffs (a lone
   hill's ramps face up or down the field, or one to each side: both armies reach them alike; a pair's are mirrored about the
   middle) and its rock (a mountain in the middle, or a mirrored pair; spires in mirrored pairs), off the deployment zones, the
   open lane, the hills and the river. frost: a frost field (more of both); crags: the lab's (TERRAIN_ROCK.crags' chances). P.rocks:
   [{x,y,r,h}] */
function featurePlan(P,rnd,W,top,bot,frost,crags){
  const Rc=TERRAIN_RECIPE[P.recipe]||TERRAIN_RECIPE.open,X=TERRAIN_ROCK,cl=crags?X.crags.cliff:Rc.cliff||[0,0],rk=crags?X.crags.rock:Rc.rock||[0,0],fm=frost?X.frost:1,fc=frost?X.frostCliff:1,f=(a,b)=>a+(b-a)*rnd(),PI=Math.PI;
  P.rocks=P.rocks||[];const H=P.hills;
  if(H.length&&P.layout!=='dune'){const k=rnd(),c=k<cl[1]*fc?'oneway':k<(cl[0]+cl[1])*fc?'sheer':null,two=c==='sheer'&&rnd()<X.ramps2,j=()=>(rnd()-.5)*.3;
    if(c){const set=(h,ramps)=>{h.cliff=true;h.oneway=c==='oneway';h.ramps=ramps};
      if(H.length===1){const ns=rnd()<.5?PI/2:-PI/2;set(H[0],two?(rnd()<.5?[j(),PI+j()]:[PI/2+j(),-PI/2+j()]):[ns+j()])}
      else{const a=rnd()*2*PI,b=two?a+PI*(.6+.8*rnd()):null,L=H[0].x<H[1].x?H[0]:H[1],Rt=L===H[0]?H[1]:H[0],m=v=>PI-v;set(L,b==null?[a]:[a,b]);set(Rt,b==null?[m(a)]:[m(a),m(b)])}}}
  const RV=TERRAIN_RIVER,riv=(P.rivers||[]).length>0,clr=riv?RV.half+RV.meander+RV.jit*W/2+RV.clear:0,lane=P.lane,cen=!riv&&!H.some(h=>Math.abs(h.x-W/2)<W*TERRAIN.centre);
  // (a spot for rock of radius r: in the field, off the open lane, the hills and other rock)
  const free=(x,y,r)=>y>=top&&y<=bot&&(!lane||y+r*1.3<lane.y0||y-r*1.3>lane.y1)&&H.every(h=>Math.hypot(x-h.x,y-h.y)>Math.max(h.rx,h.ry)*1.2+r+X.hill)&&P.rocks.every(o=>Math.hypot(x-o.x,y-o.y)>o.r+r+24);
  // (in the middle, or a mirrored pair: between the river's clearing and the deployment zones)
  const place=(r,h,mid)=>{const hi=W*(.5-TERRAIN.zone)-r-X.pad,lo=Math.max(r+8,clr+r);
    for(let t=0;t<X.tries;t++){const y=f(top+r*.4,bot-r*.4);
      if(mid){const x=W/2+(rnd()-.5)*TERRAIN.jit*W;if(free(x,y,r)){P.rocks.push({x,y,r,h});return true}continue}
      if(hi<lo)return false;const dx=f(lo,hi),y2=clamp(y+(rnd()-.5)*2*TERRAIN.mirror,top,bot);if(free(W/2-dx,y,r)&&free(W/2+dx,y2,r)){P.rocks.push({x:W/2-dx,y,r,h},{x:W/2+dx,y:y2,r,h:h*(.9+.2*rnd())});return true}}return false};
  if(rnd()<rk[0]*fm){const r=f(X.mr[0],X.mr[1]),h=f(X.mh[0],X.mh[1]);if(!(cen&&rnd()<.5&&place(r*1.2,h,true)))place(r,h,false)}
  if(rnd()<rk[1]*fm){const n=X.spires[0]+Math.floor(rnd()*(X.spires[1]-X.spires[0]+1));for(let i=0;i<n;i++)place(f(X.sr[0],X.sr[1]),f(X.sh[0],X.sh[1]),false);if(cen&&rnd()<X.mid)place(f(X.sr[0],X.sr[1]),f(X.sh[0],X.sh[1]),true)}
  return P}
/* a river's plan (rv: terrainAt's river spec): its middle by cell row (a gentle meander about BW/2), its crossings (the first in
   the open lane: the cavalry's road over; a road bridge's is the bridge), fair by construction (terrainFair checks it):
   {x,path,half,crossings,deep,frozen,stream,bridge}; rasterTerrain adds each row's water (sp0, sp1) and its band (x0, x1) */
function riverPlan(rv,rnd,W,top,bot,lane){
  const V=TERRAIN_RIVER,cs=TERRAIN.cs,R=Math.ceil(BH/cs),f=(a,b)=>a+(b-a)*rnd(),x=W/2+(rnd()-.5)*V.jit*W,a1=V.meander*f(.45,.7),a2=V.meander*.3*rnd(),k1=f(.5,1.2)*2*Math.PI/R,k2=f(1.6,2.6)*2*Math.PI/R,p1=rnd()*2*Math.PI,p2=rnd()*2*Math.PI;
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
function riverExplicit(g,W){const V=TERRAIN_RIVER,cs=TERRAIN.cs,R=Math.ceil(BH/cs),x=g.x*W,a=g.meander||0;
  const cr=(g.crossings||[]).map(c=>{const w=c.w||V[c.kind],y0=Math.round((c.y*BH-w/2)/cs)*cs;return{kind:c.kind,y0,y1:y0+w,w,y:y0+w/2}});
  return riverStraight({x,path:Array.from({length:R},(_,r)=>x+a*Math.sin(r*1.6*Math.PI/R)),half:g.stream?V.stream:V.half,crossings:cr,deep:!g.frozen&&!g.stream,frozen:!!g.frozen,stream:!!g.stream,bridge:cr.some(c=>c.kind==='bridge')})}
// a lab's own features (fractions of the field; r in px): no fairness checks
// (phase 4: a hill's cliff (true: sheer all round), oneway (cliffs dropped down, never climbed), ramps (degrees, screen y down: 0
// east, 90 south; one at 90 when none is given); rocks {x, y, r, h (its peak, levels: TERRAIN_ROCK.mh's middle when not given)})
function terrainExplicit(g,W){const sc=(l,k)=>(l||[]).map(p=>k?{x:p.x*W,y:p.y*BH,rx:p.rx||p.r,ry:p.ry||p.r,top:p.top||1,...(p.cliff||p.oneway?{cliff:true,oneway:!!p.oneway,ramps:(p.ramps||[90]).map(a=>a*Math.PI/180)}:{})}:{x:p.x*W,y:p.y*BH,r:p.r});
  return{recipe:'lab',hills:sc(g.hills,1),woods:sc(g.woods),marsh:sc(g.marsh),rocks:(g.rocks||[]).map(p=>({x:p.x*W,y:p.y*BH,r:p.r,h:p.h||Math.round((TERRAIN_ROCK.mh[0]+TERRAIN_ROCK.mh[1])/2)})),rivers:(g.rivers||[]).map(v=>riverExplicit(v,W)),layout:'lab',lane:null}}
/* an ambush's field (setup.js ambushLayout: spec.ambush {road: [y0, y1], woods: [{x, y, r}], ridges: [{x, y, rx, ry}]}, field px): a
   road down the middle kept clear (rasterTerrain clears its rows of wood), and the cover beside it, woods or low ridges, round
   where the men lying in wait stand; no fairness checks (the ambush is the point) */
function ambushPlan(spec,W){const A=spec.ambush;
  return{recipe:spec.recipe||'open',layout:'ambush',hills:A.ridges.map(h=>({...h,top:1})),woods:A.woods.map(p=>({...p})),marsh:[],rocks:[],rivers:[],lane:{y0:A.road[0],y1:A.road[1]},road:A.road.slice()}}
// the plan laid on the grid: levels and kinds by cell centre (ragged edges from seeded noise), then the slope bands and their uphill
function rasterTerrain(W,plan,seed){
  const cs=TERRAIN.cs,C=Math.ceil(W/cs),R=Math.ceil(BH/cs),N=C*R,kind=new Uint8Array(N),lvl=new Uint8Array(N),up=new Int8Array(N).fill(-1),own=new Int8Array(N).fill(-1),ns=seed%997;
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
  for(let r=0;r<R;r++)for(let c=0;c<C;c++){const i=r*C+c,L=lvl[i];if(!L)continue;let low=false;
    for(let rr=Math.max(0,r-S);rr<=Math.min(R-1,r+S)&&!low;rr++)for(let cc=Math.max(0,c-S);cc<=Math.min(C-1,c+S);cc++)if(lvl[rr*C+cc]<L){low=true;break}
    if(low){const h=plan.hills[own[i]],x=(c+.5)*cs,y=(r+.5)*cs,gx=(x-h.x)/(h.rx*h.rx),gy=(y-h.y)/(h.ry*h.ry);up[i]=((Math.round(Math.atan2(-gy,-gx)/(Math.PI/4))%8)+8)%8}}
  /* (cliffs, phase 4: each side of a cliffed hill's cell over which the ground falls to a lower level is a cliff, but where its
     middle lies in one of the hill's ramps (a band TERRAIN_ROCK.ramp wide from the hill's middle out at the ramp's angle): its bit
     on the low cell (no step up), and on the high one too unless the hill is one-way (route.js's bits: E 1, S 2, W 4, N 8)) */
  let wall=null;const DC=[1,0,-1,0],DR=[0,1,0,-1],hw=TERRAIN_ROCK.ramp/2,inRamp=(h,x,y)=>h.ramps.some(a=>{const dx=x-h.x,dy=y-h.y,ca=Math.cos(a),sa=Math.sin(a);return dx*ca+dy*sa>0&&Math.abs(dy*ca-dx*sa)<=hw});
  if(plan.hills.some(h=>h.cliff))for(let r=0;r<R;r++)for(let c=0;c<C;c++){const i=r*C+c,L=lvl[i],h=L?plan.hills[own[i]]:null;if(!h||!h.cliff)continue;
    for(let q=0;q<4;q++){const c2=c+DC[q],r2=r+DR[q];if(c2<0||r2<0||c2>=C||r2>=R)continue;const j=r2*C+c2;if(lvl[j]>=L||inRamp(h,(c+.5+DC[q]*.5)*cs,(r+.5+DR[q]*.5)*cs))continue;
      wall=wall||new Uint8Array(N);wall[j]|=1<<((q+2)&3);if(!h.oneway)wall[i]|=1<<q}}
  const T={cs,C,R,kind,lvl,up};if(wall)T.wall=wall;if(rockH)T.rockH=rockH;return T}
/* the fairness checks (§3): woods at most zoneWood of either deployment zone; the halves' advantage (levels + wood cells) within
   score of each other; an open lane (no wood or marsh) of TERRAIN.lane edge to edge, which with deep water must take in a
   crossing (the cavalry's road over). Rivers (rivers: the plan's, else the built field's): no water in a deployment zone; each
   with deep water has a crossing or more, TERRAIN_RIVER.ford px of them at least, gap px apart (its plan's gap on a short field), edge px from the field's top and
   bottom, each within mid px of BW/2 (both sides reach it alike); a held bridge's river (hold: battle types) needs only its bridge. Hills are centred or mirrored by their plan. Phase 4: no rock in
   a deployment zone, and none in the open lane; reach (the foot's grid, deep water impassable unless TERRAIN.wade, cliffs one-way
   as they are): each zone's middle reaches the other's, every passable cell of its own zone and every hilltop (hills: the plan's,
   else the built field's), both ways round */
function terrainFair(T,W,top,bot,rivers,hills){
  const {cs,C,R,kind,lvl}=T,V=TERRAIN_RIVER,r0=clamp(Math.floor(top/cs),0,R-1),r1=clamp(Math.floor((bot-1)/cs),0,R-1),zw=[0,0],zn=[0,0],sc=[0,0],deep=kind.includes(TKIND.deep);let run=0,lane=0,cross=false,wz=0;
  for(let r=r0;r<=r1;r++){let open=true,dr=false;for(let c=0;c<C;c++){const i=r*C+c,x=(c+.5)*cs,k=kind[i];if(k===TKIND.wood||k===TKIND.marsh||k===TKIND.rock)open=false;else if(k===TKIND.deep)dr=true;const z=x<TERRAIN.zone*W?0:x>(1-TERRAIN.zone)*W?1:-1;
    if(z>=0){zn[z]++;if(k===TKIND.wood)zw[z]++;else if(k>=TKIND.ford)wz++}sc[x<W/2?0:1]+=lvl[i]+(k===TKIND.wood?1:0)}
    if(open){run++;if(!dr)cross=true}else{run=0;cross=false}if((cross||!deep)&&run>lane)lane=run}
  const zone=zw[0]<=TERRAIN.zoneWood*zn[0]&&zw[1]<=TERRAIN.zoneWood*zn[1],score=Math.abs(sc[0]-sc[1])<=TERRAIN.score*Math.max(sc[0],sc[1]),open=lane*cs>=TERRAIN.lane;
  const rv=rivers||T.recipe&&T.recipe.rivers||[],river=!wz&&rv.filter(v=>v.deep).every(v=>{const L=v.crossings;return L.length>0&&L.reduce((n,c)=>n+c.w,0)>=(v.hold?V.bridge:V.ford)&&L.every((c,j)=>c.y0>=top+V.edge&&c.y1<=bot-V.edge&&Math.abs(c.x-W/2)<=V.mid&&(!j||c.y0-L[j-1].y1>=(v.gap??V.gap)))});
  const reach=terrainReachFair(T,W,top,bot,hills||T.recipe&&T.recipe.hills||[]);
  return{ok:zone&&score&&open&&river&&reach,zone,score,lane:open,river,reach,scores:sc,laneRows:lane}}
// (phase 4's reach: true where nothing blocks a step (no rock, cliff or impassable water: every cell reaches every other))
function terrainReachFair(T,W,top,bot,hills){
  if(!T.route)terrainRoutes(T,top,bot);if(!T.blocky)return true;const g=T.route.foot,C=T.C,cs=T.cs,mid=(top+bot)/2,z=TERRAIN.zone*W;
  const at=(x,y)=>{const i=routeNear(g,routeIx(g,x,y));return i},a=at(z/2,mid),b=at(W-z/2,mid);if(a<0||b<0)return false;
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
  const W=spec.W||BW,top=spec.top??FIELD_EDGE.top,bot=spec.bot??BH-FIELD_EDGE.bot,seed=spec.seed>>>0,rs=k=>seeded(((seed^0x51ED270B)+Math.imul(k,0x9E3779B1))>>>0);let plan=null,T=null,tries=0;const dropped=[];
  const riv=(p,k)=>{p.rivers=spec.river?[riverPlan(spec.river,rs(k),W,top,bot,p.lane)]:[];return featurePlan(p,seeded(((seed^0xC11FF00D)+Math.imul(k,0x9E3779B1))>>>0),W,top,bot,!!spec.frost,!!spec.crags)};
  if(spec.ambush){plan=ambushPlan(spec,W);T=rasterTerrain(W,plan,seed)}// (an ambush's own, over anything else: setup.js ambushLayout)
  else if(spec.explicit){plan=terrainExplicit(spec.explicit,W);T=rasterTerrain(W,plan,seed)}
  else{for(let k=0;k<TERRAIN.tries&&!T;k++){tries=k+1;const p=riv(terrainPlan(spec.recipe,seeded((seed+Math.imul(k,0x9E3779B1))>>>0),W,top,bot,spec.oasis,!!spec.river),k),t=rasterTerrain(W,p,seed);if(terrainFair(t,W,top,bot,p.rivers,p.hills).ok){plan=p;T=t}}
    // (a held bridge's river is never dropped: it is the battle)
    if(!T){plan=riv(terrainPlan(spec.recipe,seeded(seed),W,top,bot,spec.oasis,!!spec.river),0);
      for(const f of ['rocks','cliffs','woods','marsh','hills',...(spec.river&&spec.river.hold?[]:['rivers'])]){if(f==='cliffs'){if(!plan.hills.some(h=>h.cliff))continue;for(const h of plan.hills)h.cliff=h.oneway=false}else{if(!plan[f].length)continue;plan[f]=[]}
        dropped.push(f);T=rasterTerrain(W,plan,seed);if(terrainFair(T,W,top,bot,plan.rivers,plan.hills).ok)break}
      if(!T)T=rasterTerrain(W,plan,seed)}}
  if(!T.route)terrainRoutes(T,top,bot);
  const {kind,lvl}=T,has={hills:lvl.some(v=>v>0),wood:kind.includes(TKIND.wood),marsh:kind.includes(TKIND.marsh),water:kind.some(k=>k>=TKIND.ford&&k<=TKIND.bridge),rock:kind.includes(TKIND.rock),cliff:!!T.wall},rivers=plan.rivers||[],r0=rivers[0];
  terrainIndex(T);
  const box=p=>[p.x-p.r,p.y-p.r,p.x+p.r,p.y+p.r],cl=h=>h.cliff?{cliff:true,oneway:!!h.oneway,ramps:h.ramps.slice()}:{};
  T.has=has;T.seed=seed;
  T.recipe={kind:plan.recipe,layout:plan.layout,oasis:!!spec.oasis,hills:plan.hills.map(h=>({x:h.x,y:h.y,r:(h.rx+h.ry)/2,rx:h.rx,ry:h.ry,top:h.top,...cl(h)})),woods:plan.woods.map(p=>({...p})),marsh:plan.marsh.map(p=>({...p})),rocks:(plan.rocks||[]).map(p=>({...p})),river:r0||null,rivers,lane:plan.lane,dropped,tries};
  T.recipe.text=terrainText(T.recipe,has);
  // (the AI's reading of the rivers: the contract at the top of this file; a top's cliffs and ramps (radians); the rock)
  const crossings=rivers.filter(v=>v.deep).flatMap(v=>v.crossings.map(c=>({kind:c.kind,x:c.x,y:c.y,w:c.w,y0:c.y0,y1:c.y1,x0:c.x0,x1:c.x1}))).sort((a,b)=>a.y-b.y);
  T.ai={tops:plan.hills.map(h=>({x:h.x,y:h.y,lvl:h.top,half:h.x<W/2?0:1,...cl(h)})),crossings,woods:plan.woods.map(p=>({x:p.x,y:p.y,box:box(p)})),rocks:(plan.rocks||[]).map(p=>({x:p.x,y:p.y,r:p.r})),
    river:r0?{x:r0.path.reduce((a,b)=>a+b,0)/r0.path.length,x0:r0.x0,x1:r0.x1,w:2*r0.half,deep:r0.deep,frozen:r0.frozen,stream:r0.stream}:null};
  // (wband: the band all the field's water keeps within, px; wwide: its widest water; crossesDeep, crossWay)
  T.wband=rivers.length?[Math.min(...rivers.map(v=>v.x0)),Math.max(...rivers.map(v=>v.x1))]:null;T.wwide=rivers.length?Math.max(...rivers.map(v=>2*v.half)):0;
  return T}
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
  const parts=[],L=rc.layout,nh=rc.hills.length,top=nh&&rc.hills[0].top,low=top>1?'a hill':'a low hill',treed=L==='woodedHill'||L==='woodedRidge'||L==='pairFlank';
  if(nh)parts.push(L==='pair'||L==='pairFlank'||nh===2?'a hill on each side'+(L==='pairFlank'&&has.wood?', wooded on its flank':''):L==='ridge'||L==='woodedRidge'||L==='dune'?(rc.kind==='desert'?'a dune ridge':'a ridge')+' down the middle'+(L==='woodedRidge'&&has.wood?' under trees':''):
    nh>1?nh+' hills':low+' in the middle'+(L==='woodedHill'&&has.wood?' crowned with trees':''));
  if(has.wood&&!(treed&&nh))parts.push(rc.kind==='swamp'?'stands of dead trees':L==='copses'?'scattered copses':rc.woods.length>1?'woods':'a copse');if(has.marsh)parts.push(rc.kind==='desert'?'an oasis':'marsh');
  // (phase 4: mountains (a rock 30 px or more across its radius) and spires)
  if(has.rock){const R=rc.rocks||[],m=R.filter(p=>p.r>=30).length;if(m)parts.push(m>1?'mountains':'a mountain');if(R.length>m)parts.push('rock spires')}
  // (the river a sentence of its own, first: "A river with a bridge and a ford. A hill on each side.")
  const v=has.water&&rc.river,n=k=>v.crossings.filter(c=>c.kind===k).length,one=(k,w)=>n(k)?(n(k)>1?(n(k)===2?'two ':n(k)+' ')+w+'s':'a '+w):'',cap=s=>s[0].toUpperCase()+s.slice(1)+'.';
  const rs=v?cap(v.stream?'a shallow stream':v.frozen?'a frozen river'+(n('bridge')?' with a bridge':''):v.hold?'a river with a single bridge'+(n('ford')?' and a ford far off it':''):'a river'+(v.crossings.length?' with '+[one('bridge','bridge'),one('ford','ford')].filter(Boolean).join(' and '):'')):'';
  if(!parts.length&&!rs)return '';const s=rs+(parts.length?(rs?' ':'')+cap(parts.join(', ').replace(/, ([^,]*)$/,' and $1')):'');
  const sheer=rc.hills.some(h=>h.cliff&&!h.oneway),onew=rc.hills.some(h=>h.oneway);
  return s+(v&&v.deep?TERRAIN.wade?' Deep water: wading is slow and tiring, no one shoots from it and blows land soft; cross at the fords and bridges.':' Deep water cannot be crossed: only at the fords and bridges.':'')+(v&&(v.stream||v.frozen)?' '+(v.frozen?'The ice is slippery going, but it can be crossed anywhere.':'The stream slows all but orcs.'):v&&n('ford')?' Fords slow all but orcs and break formations.':'')+
    (has.hills?' High ground: archers reach farther and charges downhill hit harder; the climb is hard going.':'')+(sheer?' Sheer cliffs ring a hill: it is climbed only by its ramps.':'')+(onew?' A hill is climbed by one ramp only, though men can drop down its cliffs.':'')+
    (has.rock?' Rock bars the way and hides what lies behind it.':'')+(has.wood?' Woods slow riders and break formations.':'')+(has.marsh?' Marsh slows and tires all but orcs.':'')}
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
// speed on the ground, moving (mx,my): woods and marsh by foot/mounted/big, climbing and descending slopes; floored at TERRAIN.floor
function groundMul(u,mx,my){
  const T=B&&B.terrain;if(!T)return 1;const i=tIx(T,u.x,u.y),k=T.kind[i],Gd=TGROUND[k];let m=1;
  if(Gd&&!groundHome(u,Gd.home))m*=u.s.big?Gd.spd.big:u.s.mounted?Gd.spd.mounted:Gd.spd.foot;
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
   strikes or shoots at (sightStruck: attacks.js). With no B.terrain nothing is ever set: everyone is seen */
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
   hidden from; u.ls: where each side last saw him. A group wholly hidden from its foes is noted for an ambush (T.sight.hid) */
function sightStep(force){
  const T=B&&B.terrain;if(!T)return;let S=T.sight;if(!S)S=T.sight={next:-1,n:0,hid:new Map(),sprung:new Map(),goal:new Map(),los:new Map(),seer:new Map()};
  if(!force&&B.t<S.next)return;S.next=B.t+SIGHT.every;S.n++;S.goal.clear();S.los.clear();
  const live=[];for(const u of B.units)if(u.hp>0)live.push(u);const n=live.length,teams=[];for(const u of live)if(!teams.includes(u.team))teams.push(u.team);
  const foes=t=>teams.reduce((m,o)=>o===t?m:m|1<<o,0),now=B.t;
  if(!(T.has.wood||T.shTop)){for(const u of live){if(u.hid)u.hid=0;const p=u.ls||(u.ls=[]);for(const t of teams)if(t!==u.team){p[2*t]=u.x;p[2*t+1]=u.y}}return}
  const cs=T.cs,C=T.C,K=T.kind,LV=T.lvl,sh=T.sh,BC=Math.ceil(BW/32),BR=Math.ceil(BH/32),wood=TKIND.wood,blk=T.shTop>T.lvlTop,V={},nxt=new Int32Array(n),ul=new Uint8Array(n),uc=new Int32Array(n);
  for(const t of teams)V[t]={head:new Int32Array(BC*BR).fill(-1),cells:[],mark:new Uint8Array(C*T.R),top:false};
  for(let k=0;k<n;k++){const u=live[k],i=tIx(T,u.x,u.y),v=V[u.team],b=clamp(Math.floor(u.y/32),0,BR-1)*BC+clamp(Math.floor(u.x/32),0,BC-1);uc[k]=i;ul[k]=LV[i];nxt[k]=v.head[b];v.head[b]=k;
    if(!v.mark[i]){v.mark[i]=1;v.cells.push(i);if(sh[i]>=T.lvlTop)v.top=true}}
  const near2=SIGHT.near*SIGHT.near,high2=SIGHT.high*SIGHT.high,r=SIGHT.high;
  const near=(v,u,lu)=>{const x=u.x,y=u.y,b0=clamp(Math.floor((x-r)/32),0,BC-1),b1=clamp(Math.floor((x+r)/32),0,BC-1),a0=clamp(Math.floor((y-r)/32),0,BR-1),a1=clamp(Math.floor((y+r)/32),0,BR-1);
    for(let a=a0;a<=a1;a++)for(let b=b0;b<=b1;b++)for(let k=v.head[a*BC+b];k>=0;k=nxt[k]){const o=live[k],d=(o.x-x)*(o.x-x)+(o.y-y)*(o.y-y);if(d<=near2||d<=high2&&ul[k]>lu)return true}return false};
  const mx=i=>(i%C+.5)*cs,my=i=>(Math.floor(i/C)+.5)*cs;
  const los=(v,t,i)=>{const key=i*8+t;let q=S.los.get(key);if(q!==undefined)return q;const x=mx(i),y=my(i),j0=S.seer.get(key);q=false;
    if(j0!==undefined&&v.mark[j0])q=!riseBlocked(T,mx(j0),my(j0),x,y);
    if(!q)for(const j of v.cells){if(!riseBlocked(T,mx(j),my(j),x,y)){q=true;S.seer.set(key,j);break}}
    S.los.set(key,q);return q};
  const all=new Map();
  for(let k=0;k<n;k++){const u=live[k],i=uc[k],inW=K[i]===wood,open=!inW&&T.shTop>0&&(blk||sh[i]<T.lvlTop);let hid=0;
    if(inW||open)for(const t of teams){if(t===u.team)continue;
      if(u.rv&&now-(u.rv[t]??-1e9)<SIGHT.memory||near(V[t],u,ul[k])||open&&(!blk&&V[t].top||los(V[t],t,i)))continue;hid|=1<<t}
    if(hid!==(u.hid|0))u.hid=hid;const p=u.ls||(u.ls=[]);for(const t of teams)if(t!==u.team&&!(hid&1<<t)){p[2*t]=u.x;p[2*t+1]=u.y}
    const f=foes(u.team),gk=u.grp||'u'+u.id,w=f!==0&&(hid&f)===f;all.set(gk,(all.get(gk)??true)&&w)}
  for(const [gk,w] of all)if(w)S.hid.set(gk,now)}
// he struck or shot at t: t's side sees him now and for SIGHT.memory s (attacks.js: a blow, a shot loosed, a missile landing)
function sightStruck(att,t){const T=B&&B.terrain;if(!T||!att||!t||att.team===t.team)return;(att.rv||(att.rv=[]))[t.team]=B.t;
  if(att.hid&1<<t.team){att.hid&=~(1<<t.team);const p=att.ls||(att.ls=[]);p[2*t.team]=att.x;p[2*t.team+1]=att.y;if(T.sight)T.sight.goal.clear()}}
// (an order at a target that side sees none of: where it was last seen; reckoned once a sight step for each target)
function sightGoal(g,team){
  const T=B&&B.terrain,S=T&&T.sight;if(!S||!g||!g.hasTarget)return null;const key=team+'|'+g.targetGroupId+'|'+g.targetUnitId;if(S.goal.has(key))return S.goal.get(key);
  const m=g.targetMembers();let q=null;if(m.length&&m.every(u=>u.hid&1<<team)){let x=0,y=0,c=0;for(const u of m){const p=u.ls;if(p&&p[2*team]!=null){x+=p[2*team];y+=p[2*team+1];c++}}if(c)q={x:x/c,y:y/c}}
  S.goal.set(key,q);return q}
// a charge's shock from ambush (morale.js chargeMul): AMBUSH.shock if his group was wholly unseen by its foes within AMBUSH.window
// s and has not sprung one yet (springing it now: the callout), or sprang it within AMBUSH.burst s; else 1
function ambushMul(u){
  const T=B&&B.terrain,S=T&&T.sight;if(!S)return 1;const gk=u.grp||'u'+u.id,h=S.hid.get(gk);if(h===undefined)return 1;const sp=S.sprung.get(gk);
  if(sp===undefined){if(B.t-h>AMBUSH.window)return 1;S.sprung.set(gk,B.t);if(typeof calloutAmbush==='function')calloutAmbush(u);return AMBUSH.shock}
  return B.t-sp<=AMBUSH.burst?AMBUSH.shock:1}
