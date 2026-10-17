'use strict';
/* ---------- the battlefield's ground (terrain phases 1-2: hills as three terraces, woods, marsh; rivers, fords, bridges; doc/TERRAIN_DESIGN.md) ----------
   A static grid of 16-px cells (B.terrain; absent when off) laid out once a battle from the world tile it is fought on and its
   8 neighbours, with its own seeded stream (never Math.random: the spawn sequence is untouched). Same place, same field (D4);
   both halves alike (D5); none in sieges, raids or tournaments (D6). With no terrain every helper returns exactly 1 (or "open"),
   and x*1===x, so a battle without it is bit-identical. Cells are 16 px and SPATIAL.cell 32: each grid bucket is 2×2 cells. */
// on: the game's switch (tests/harness.js turns it off for the older suites); cs: cell size (px); floor: the least a speed
// multiplier of the ground can be; tries: sub-seeds tried for a fair field; lane: an open lane edge to edge (px high); zone: the
// deployment zones (share of BW at each edge); zoneWood: woods' largest share of a zone; score: how far the halves' advantage
// scores may differ (share); mirror: a hill pair's x jitter (px); centre: a lone hill's |x-BW/2| limit (share of BW); jit: a
// feature in the middle's x jitter (share of BW: the halves must score alike); top2: a
// level-2 hill's crest (share of its radius); slope: a terrace's slope band (cells in from its rim). With terrain a field has no
// scattered trees, rocks or cacti (B.obs empty: setup.js; the owner reversed D10): its woods, hills and marsh are its features
const TERRAIN={on:true,cs:16,floor:.3,tries:8,lane:96,zone:.3,zoneWood:.25,score:.15,mirror:32,centre:.08,jit:.02,top2:.55,slope:2};
// cell kinds (B.terrain.kind): deep water, fords and bridges are a river's (phase 2)
const TKIND={open:0,wood:1,marsh:2,ford:3,deep:4,bridge:5};
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
   between cross deep water; crossingFor(ax,ay,bx,by) → the crossing with the least detour for that way, or null.
   Deep water is wadeable (D1, phase 2): ×0.35 speed (big ×0.5), no momentum, stamina ×2, no shooting, blows dealt ×0.75 and
   taken ×1.25, no cohesion. Impassable deep water and routing come in phase 4. */
/* spd: speed on it, by foot, mounted or big (its home race or beast goes at ×1); run: how fast charge momentum builds; chargeIn:
   the charge bonus against one standing in it; stop: a low missile's chance to be stopped per wood cell entered (elves and magic
   pass); canopy: an arrow's chance to be caught coming down into a wood cell (lab: arcs fall too steeply to cross cells low);
   view: wood cells that block a morale view (unless the viewer stands higher); sta: stamina drain running in it; hit:
   melee damage dealt standing in it; hurt: melee damage taken standing in it; wade: stamina spent a second walking in it (on
   FATIGUE.run's scale: walking elsewhere spends none); thin: no shield wall, nor riders in a wedge (formations break); loose: no
   cohesion; noShoot: no shooter draws standing in it; home: the RACES home (or a beast's) that ignores its slow, momentum,
   stamina and blows (D7). Deep water is wadeable but punishing (D1, phase 2: impassable in phase 4); a ford is marsh in a
   current; a bridge is open ground (its narrowness is the rule: crossWay) */
const TERRAIN_GROUND={
  wood:{n:'Woods',spd:{foot:.8,mounted:.55,big:.55},run:.35,chargeIn:.5,stop:.08,canopy:.35,view:3,thin:true,loose:true,home:'forest'},
  marsh:{n:'Marsh',spd:{foot:.7,mounted:.5,big:.7},run:.3,sta:1.5,hit:.9,home:'swamp'},
  ford:{n:'Ford',spd:{foot:.7,mounted:.5,big:.7},run:.3,sta:1.5,hit:.9,thin:true,home:'swamp'},
  deep:{n:'Deep water',spd:{foot:.35,mounted:.35,big:.5},run:0,sta:2,wade:1,hit:.75,hurt:1.25,thin:true,loose:true,noShoot:true}
};
const TGROUND=[null,TERRAIN_GROUND.wood,TERRAIN_GROUND.marsh,TERRAIN_GROUND.ford,TERRAIN_GROUND.deep,null];
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
const HILL={range:.075,melee:.1,charge:.35,climb:{foot:.6,mounted:.5,big:.5},descend:1.15,runUp:.6,runDown:1.25,climbSta:2,dot:.5,home:'hills'};
/* what the world round the battle lays out (§3; its river: terrainAt, riverPlan). layouts: [name, weight], one picked (terrainPlan): plain
   (nothing), hill (one centred), woodedHill (one centred, trees on its top), copse (one small wood in the middle), copses (small
   woods in mirrored pairs), woods (forest patches, half the time round a low hill), pair (a hill per half, mirrored), pairFlank
   (the same with a wood on each one's flank), ridge (one down the middle, half the time a copse), woodedRidge (trees along its
   crest), dune (a low ridge), marsh (dead trees and marsh). top: the level hills rise to; hr: hill radius; wr: wood radius;
   cr: a copse's; woods, marsh: [least, most] patches; mr: marsh radius. A desert never has woods, nor water or marsh but an
   oasis (oasis: its radius) where the world tile or a neighbour is water (the owner). river: the layouts with a river down the
   middle (nothing on it: its features in pairs, one each side) */
const TERRAIN_RECIPE={
  open:{layouts:[['plain',3],['hill',3],['copse',2],['woodedHill',2],['copses',2]],river:[['plain',3],['copses',2],['pair',2]],top:1,hr:[90,125],wr:[40,64],cr:[26,40]},
  forest:{layouts:[['woods',4],['woodedHill',3],['copses',3]],river:[['woods',4],['copses',3]],top:1,hr:[80,110],wr:[80,110],cr:[30,48],woods:[3,4]},
  hills:{layouts:[['pair',3],['ridge',2],['woodedRidge',2],['pairFlank',2]],river:[['pair',3],['pairFlank',2]],top:2,hr:[105,135],wr:[40,64],cr:[30,48]},
  swamp:{layouts:[['marsh',1]],wr:[40,60],woods:[1,2],marsh:[3,5],mr:[60,90]},
  desert:{layouts:[['plain',1],['dune',1]],top:1,hr:[70,90],oasis:[45,65]}
};
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
  return{recipe,seed:Math.floor(hash(tx,ty,code)*4294967296)>>>0,tx,ty,oasis:recipe==='desert'&&(w>0||tAt(tx,ty)===T_WATER),river}}
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
/* a river's plan (rv: terrainAt's river spec): its middle by cell row (a gentle meander about BW/2), its crossings (the first in
   the open lane: the cavalry's road over; a road bridge's is the bridge), fair by construction (terrainFair checks it):
   {x,path,half,crossings,deep,frozen,stream,bridge}; rasterTerrain adds each row's water (sp0, sp1) and its band (x0, x1) */
function riverPlan(rv,rnd,W,top,bot,lane){
  const V=TERRAIN_RIVER,cs=TERRAIN.cs,R=Math.ceil(BH/cs),f=(a,b)=>a+(b-a)*rnd(),x=W/2+(rnd()-.5)*V.jit*W,a1=V.meander*f(.45,.7),a2=V.meander*.3*rnd(),k1=f(.5,1.2)*2*Math.PI/R,k2=f(1.6,2.6)*2*Math.PI/R,p1=rnd()*2*Math.PI,p2=rnd()*2*Math.PI;
  const path=Array.from({length:R},(_,r)=>x+a1*Math.sin(k1*r+p1)+a2*Math.sin(k2*r+p2)),deep=!rv.frozen&&!rv.stream;
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
function terrainExplicit(g,W){const sc=(l,k)=>(l||[]).map(p=>k?{x:p.x*W,y:p.y*BH,rx:p.rx||p.r,ry:p.ry||p.r,top:p.top||1}:{x:p.x*W,y:p.y*BH,r:p.r});
  return{recipe:'lab',hills:sc(g.hills,1),woods:sc(g.woods),marsh:sc(g.marsh),rivers:(g.rivers||[]).map(v=>riverExplicit(v,W)),layout:'lab',lane:null}}
// the plan laid on the grid: levels and kinds by cell centre (ragged edges from seeded noise), then the slope bands and their uphill
function rasterTerrain(W,plan,seed){
  const cs=TERRAIN.cs,C=Math.ceil(W/cs),R=Math.ceil(BH/cs),N=C*R,kind=new Uint8Array(N),lvl=new Uint8Array(N),up=new Int8Array(N).fill(-1),own=new Int8Array(N).fill(-1),ns=seed%997;
  plan.hills.forEach((h,k)=>{const c0=Math.max(0,Math.floor((h.x-h.rx*1.2)/cs)),c1=Math.min(C-1,Math.floor((h.x+h.rx*1.2)/cs)),r0=Math.max(0,Math.floor((h.y-h.ry*1.2)/cs)),r1=Math.min(R-1,Math.floor((h.y+h.ry*1.2)/cs));
    for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const i=r*C+c,x=(c+.5)*cs,y=(r+.5)*cs,ex=(x-h.x)/h.rx,ey=(y-h.y)/h.ry,d=Math.sqrt(ex*ex+ey*ey)*(1+.3*(noise(x/48,y/48,ns+k*7)-.5));
      const L=h.top>1&&d<TERRAIN.top2?2:d<1?1:0;if(L>lvl[i]){lvl[i]=L;own[i]=k}}});
  for(const [list,K] of [[plan.woods,TKIND.wood],[plan.marsh,TKIND.marsh]])list.forEach((p,k)=>{const e=p.r*1.3,c0=Math.max(0,Math.floor((p.x-e)/cs)),c1=Math.min(C-1,Math.floor((p.x+e)/cs)),r0=Math.max(0,Math.floor((p.y-e)/cs)),r1=Math.min(R-1,Math.floor((p.y+e)/cs));
    for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const x=(c+.5)*cs,y=(r+.5)*cs;if(Math.hypot(x-p.x,y-p.y)/p.r*(1+.5*(noise(x/40,y/40,ns+50+K*20+k*3)-.5))<1)kind[r*C+c]=K}});
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
  return{cs,C,R,kind,lvl,up}}
/* the fairness checks (§3): woods at most zoneWood of either deployment zone; the halves' advantage (levels + wood cells) within
   score of each other; an open lane (no wood or marsh) of TERRAIN.lane edge to edge, which with deep water must take in a
   crossing (the cavalry's road over). Rivers (rivers: the plan's, else the built field's): no water in a deployment zone; each
   with deep water has a crossing or more, TERRAIN_RIVER.ford px of them at least, gap px apart (its plan's gap on a short field), edge px from the field's top and
   bottom, each within mid px of BW/2 (both sides reach it alike). Hills are centred or mirrored by their plan */
function terrainFair(T,W,top,bot,rivers){
  const {cs,C,R,kind,lvl}=T,V=TERRAIN_RIVER,r0=clamp(Math.floor(top/cs),0,R-1),r1=clamp(Math.floor((bot-1)/cs),0,R-1),zw=[0,0],zn=[0,0],sc=[0,0],deep=kind.includes(TKIND.deep);let run=0,lane=0,cross=false,wz=0;
  for(let r=r0;r<=r1;r++){let open=true,dr=false;for(let c=0;c<C;c++){const i=r*C+c,x=(c+.5)*cs,k=kind[i];if(k===TKIND.wood||k===TKIND.marsh)open=false;else if(k===TKIND.deep)dr=true;const z=x<TERRAIN.zone*W?0:x>(1-TERRAIN.zone)*W?1:-1;
    if(z>=0){zn[z]++;if(k===TKIND.wood)zw[z]++;else if(k>=TKIND.ford)wz++}sc[x<W/2?0:1]+=lvl[i]+(k===TKIND.wood?1:0)}
    if(open){run++;if(!dr)cross=true}else{run=0;cross=false}if((cross||!deep)&&run>lane)lane=run}
  const zone=zw[0]<=TERRAIN.zoneWood*zn[0]&&zw[1]<=TERRAIN.zoneWood*zn[1],score=Math.abs(sc[0]-sc[1])<=TERRAIN.score*Math.max(sc[0],sc[1]),open=lane*cs>=TERRAIN.lane;
  const rv=rivers||T.recipe&&T.recipe.rivers||[],river=!wz&&rv.filter(v=>v.deep).every(v=>{const L=v.crossings;return L.length>0&&L.reduce((n,c)=>n+c.w,0)>=V.ford&&L.every((c,j)=>c.y0>=top+V.edge&&c.y1<=bot-V.edge&&Math.abs(c.x-W/2)<=V.mid&&(!j||c.y0-L[j-1].y1>=(v.gap??V.gap)))});
  return{ok:zone&&score&&open&&river,zone,score,lane:open,river,scores:sc,laneRows:lane}}
/* B.terrain (the contract with the art: doc/TERRAIN_DESIGN.md §4): {cs,C,R,kind,lvl,up,has:{hills,wood,marsh,water},seed,
   recipe:{kind,layout,hills,woods,marsh,river:null,dropped,tries,text},ai:{tops,crossings,woods}}. spec: {recipe,seed} from the world
   (terrainAt) or the lab, or {explicit,seed}; W, top, bot: the field (BW, fieldTop/fieldBot by default). Up to TERRAIN.tries
   sub-seeds for a fair field; then the offending features are dropped (woods, then marsh, then hills, then the river). spec.river
   (terrainAt's): a river down the middle, from a stream of its own (the rest of the field is as it would be without one, but
   for its layouts: TERRAIN_RECIPE river) */
function buildTerrain(spec){
  const W=spec.W||BW,top=spec.top??FIELD_EDGE.top,bot=spec.bot??BH-FIELD_EDGE.bot,seed=spec.seed>>>0,rs=k=>seeded(((seed^0x51ED270B)+Math.imul(k,0x9E3779B1))>>>0);let plan=null,T=null,tries=0;const dropped=[];
  const riv=(p,k)=>{p.rivers=spec.river?[riverPlan(spec.river,rs(k),W,top,bot,p.lane)]:[];return p};
  if(spec.explicit){plan=terrainExplicit(spec.explicit,W);T=rasterTerrain(W,plan,seed)}
  else{for(let k=0;k<TERRAIN.tries&&!T;k++){tries=k+1;const p=riv(terrainPlan(spec.recipe,seeded((seed+Math.imul(k,0x9E3779B1))>>>0),W,top,bot,spec.oasis,!!spec.river),k),t=rasterTerrain(W,p,seed);if(terrainFair(t,W,top,bot,p.rivers).ok){plan=p;T=t}}
    if(!T){plan=riv(terrainPlan(spec.recipe,seeded(seed),W,top,bot,spec.oasis,!!spec.river),0);for(const f of ['woods','marsh','hills','rivers']){if(!plan[f].length)continue;plan[f]=[];dropped.push(f);T=rasterTerrain(W,plan,seed);if(terrainFair(T,W,top,bot,plan.rivers).ok)break}
      if(!T)T=rasterTerrain(W,plan,seed)}}
  const {kind,lvl}=T,has={hills:lvl.some(v=>v>0),wood:kind.includes(TKIND.wood),marsh:kind.includes(TKIND.marsh),water:kind.some(k=>k>=TKIND.ford)},rivers=plan.rivers||[],r0=rivers[0];
  terrainIndex(T);
  const box=p=>[p.x-p.r,p.y-p.r,p.x+p.r,p.y+p.r];
  T.has=has;T.seed=seed;
  T.recipe={kind:plan.recipe,layout:plan.layout,oasis:!!spec.oasis,hills:plan.hills.map(h=>({x:h.x,y:h.y,r:(h.rx+h.ry)/2,rx:h.rx,ry:h.ry,top:h.top})),woods:plan.woods.map(p=>({...p})),marsh:plan.marsh.map(p=>({...p})),river:r0||null,rivers,lane:plan.lane,dropped,tries};
  T.recipe.text=terrainText(T.recipe,has);
  // (the AI's reading of the rivers: the contract at the top of this file)
  const crossings=rivers.filter(v=>v.deep).flatMap(v=>v.crossings.map(c=>({kind:c.kind,x:c.x,y:c.y,w:c.w,y0:c.y0,y1:c.y1,x0:c.x0,x1:c.x1}))).sort((a,b)=>a.y-b.y);
  T.ai={tops:plan.hills.map(h=>({x:h.x,y:h.y,lvl:h.top,half:h.x<W/2?0:1})),crossings,woods:plan.woods.map(p=>({x:p.x,y:p.y,box:box(p)})),
    river:r0?{x:r0.path.reduce((a,b)=>a+b,0)/r0.path.length,x0:r0.x0,x1:r0.x1,w:2*r0.half,deep:r0.deep,frozen:r0.frozen,stream:r0.stream}:null};
  // (wband: the band all the field's water keeps within, px; wwide: its widest water; crossesDeep, crossWay)
  T.wband=rivers.length?[Math.min(...rivers.map(v=>v.x0)),Math.max(...rivers.map(v=>v.x1))]:null;T.wwide=rivers.length?Math.max(...rivers.map(v=>2*v.half)):0;
  return T}
// (T.woodSum: wood cells summed over the rectangle above-left of each cell corner, (C+1)×(R+1), so terrainBlocksView knows at once
// how many lie in any box; kept in step with T.kind: whoever changes kind calls this again)
function terrainIndex(T){const C=T.C,R=T.R,K=T.kind,S=new Int32Array((C+1)*(R+1));for(let r=0;r<R;r++)for(let c=0;c<C;c++)S[(r+1)*(C+1)+c+1]=(K[r*C+c]===TKIND.wood?1:0)+S[r*(C+1)+c+1]+S[(r+1)*(C+1)+c]-S[r*(C+1)+c];T.woodSum=S;return T}
// the ground in words (the battle's first log line; the pre-battle panel)
function terrainText(rc,has){
  const parts=[],L=rc.layout,nh=rc.hills.length,top=nh&&rc.hills[0].top,low=top>1?'a hill':'a low hill',treed=L==='woodedHill'||L==='woodedRidge'||L==='pairFlank';
  if(nh)parts.push(L==='pair'||L==='pairFlank'||nh===2?'a hill on each side'+(L==='pairFlank'&&has.wood?', wooded on its flank':''):L==='ridge'||L==='woodedRidge'||L==='dune'?(rc.kind==='desert'?'a dune ridge':'a ridge')+' down the middle'+(L==='woodedRidge'&&has.wood?' under trees':''):
    nh>1?nh+' hills':low+' in the middle'+(L==='woodedHill'&&has.wood?' crowned with trees':''));
  if(has.wood&&!(treed&&nh))parts.push(rc.kind==='swamp'?'stands of dead trees':L==='copses'?'scattered copses':rc.woods.length>1?'woods':'a copse');if(has.marsh)parts.push(rc.kind==='desert'?'an oasis':'marsh');
  // (the river a sentence of its own, first: "A river with a bridge and a ford. A hill on each side.")
  const v=has.water&&rc.river,n=k=>v.crossings.filter(c=>c.kind===k).length,one=(k,w)=>n(k)?(n(k)>1?(n(k)===2?'two ':n(k)+' ')+w+'s':'a '+w):'',cap=s=>s[0].toUpperCase()+s.slice(1)+'.';
  const rs=v?cap(v.stream?'a shallow stream':v.frozen?'a frozen river'+(n('bridge')?' with a bridge':''):'a river'+(v.crossings.length?' with '+[one('bridge','bridge'),one('ford','ford')].filter(Boolean).join(' and '):'')):'';
  if(!parts.length&&!rs)return '';const s=rs+(parts.length?(rs?' ':'')+cap(parts.join(', ').replace(/, ([^,]*)$/,' and $1')):'');
  return s+(v&&v.deep?' Deep water: wading is slow and tiring, no one shoots from it and blows land soft; cross at the fords and bridges.':'')+(v&&(v.stream||v.frozen)?' '+(v.frozen?'The ice is slippery going, but it can be crossed anywhere.':'The stream slows all but orcs.'):v&&n('ford')?' Fords slow all but orcs and break formations.':'')+
    (has.hills?' High ground: archers reach farther and charges downhill hit harder; the climb is hard going.':'')+(has.wood?' Woods slow riders and break formations.':'')+(has.marsh?' Marsh slows and tires all but orcs.':'')}
// the battleground's text (its env's, with the ground's when there will be terrain; the pre-battle panel, encounters.js): no river
// against a monster or in a cave (as groundSpecFor)
function terrainEnvText(env,kind){
  if(!TERRAIN.on||['siege','raid','tourney'].includes(kind))return env.text;
  const g=terrainAt(P.x,P.y,env);if(['monster','cave'].includes(kind))g.river=null;const T=buildTerrain({...g,W:clamp(BVW,FIELD_W.min,FIELD_W.max)});return groundEnvText(env,T)}
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
/* does the ground block a's view of b (morale.js moraleVisible)? A walk over the cells between them: TERRAIN_GROUND.wood.view wood
   cells (not counting their own) block it, but not woods lower than a stands (HILL.view: he sees over them) */
function terrainBlocksView(a,b){
  const T=B&&B.terrain;if(!T||!T.has.wood)return false;const cs=T.cs,C=T.C,R=T.R,vl=T.lvl[tIx(T,a.x,a.y)],need=TERRAIN_GROUND.wood.view;
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
// the crossing (B.terrain.ai.crossings) with the least way round from (ax,ay) to (bx,by): to its mouth, over, on; null with none
function crossingFor(ax,ay,bx,by){
  const T=B&&B.terrain;if(!T)return null;const d=bx>ax?1:-1,p=TERRAIN_RIVER.pad;let best=null,bc=Infinity;
  for(const c of T.ai.crossings){const en=d>0?c.x0-p:c.x1+p,ex=d>0?c.x1+p:c.x0-p,k=Math.hypot(en-ax,c.y-ay)+Math.abs(ex-en)+Math.hypot(bx-ex,by-c.y);if(k<bc){bc=k;best=c}}return best}
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
