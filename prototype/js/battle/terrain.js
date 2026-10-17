'use strict';
/* ---------- the battlefield's ground (terrain phase 1: hills as three terraces, woods, marsh; doc/TERRAIN_DESIGN.md) ----------
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
// cell kinds (B.terrain.kind): rivers, fords and bridges come in phase 2
const TKIND={open:0,wood:1,marsh:2,ford:3,deep:4,bridge:5};
/* spd: speed on it, by foot, mounted or big (its home race or beast goes at ×1); run: how fast charge momentum builds; chargeIn:
   the charge bonus against one standing in it; stop: a low missile's chance to be stopped per wood cell entered (elves and magic
   pass); canopy: an arrow's chance to be caught coming down into a wood cell (lab: arcs fall too steeply to cross cells low);
   view: wood cells that block a morale view (unless the viewer stands higher); sta: stamina drain running in it; hit:
   melee damage dealt standing in it; home: the RACES home (or a beast's) that ignores it (D7) */
const TERRAIN_GROUND={
  wood:{n:'Woods',spd:{foot:.8,mounted:.55,big:.55},run:.35,chargeIn:.5,stop:.08,canopy:.35,view:3,home:'forest'},
  marsh:{n:'Marsh',spd:{foot:.7,mounted:.5,big:.7},run:.3,sta:1.5,hit:.9,home:'swamp'}
};
const TGROUND=[null,TERRAIN_GROUND.wood,TERRAIN_GROUND.marsh];
/* range: a shooter's range per level he stands on; melee: a blow at a foe at least one level lower; charge: the charge bonus
   scaled by 1+charge·Δlevel (Δ clamped ±1); climb: speed going up a slope cell (dot > dot), by foot/mounted/big (the owner: a
   step up is hard going); descend: going down one; runUp, runDown: momentum building up or down a slope; climbSta: stamina
   running uphill; climbing also breaks cohesion while it lasts (morale.js cohesionReady); home: who climbs freely (dwarves) */
const HILL={range:.075,melee:.1,charge:.35,climb:{foot:.6,mounted:.5,big:.5},descend:1.15,runUp:.6,runDown:1.25,climbSta:2,dot:.5,home:'hills'};
/* what the world round the battle lays out (§3; no rivers in phase 1). layouts: [name, weight], one picked (terrainPlan): plain
   (nothing), hill (one centred), woodedHill (one centred, trees on its top), copse (one small wood in the middle), copses (small
   woods in mirrored pairs), woods (forest patches, half the time round a low hill), pair (a hill per half, mirrored), pairFlank
   (the same with a wood on each one's flank), ridge (one down the middle, half the time a copse), woodedRidge (trees along its
   crest), dune (a low ridge), marsh (dead trees and marsh). top: the level hills rise to; hr: hill radius; wr: wood radius;
   cr: a copse's; woods, marsh: [least, most] patches; mr: marsh radius. A desert never has woods, nor water or marsh but an
   oasis (oasis: its radius) where the world tile or a neighbour is water (the owner) */
const TERRAIN_RECIPE={
  open:{layouts:[['plain',3],['hill',3],['copse',2],['woodedHill',2],['copses',2]],top:1,hr:[90,125],wr:[40,64],cr:[26,40]},
  forest:{layouts:[['woods',4],['woodedHill',3],['copses',3]],top:1,hr:[80,110],wr:[80,110],cr:[30,48],woods:[3,4]},
  hills:{layouts:[['pair',3],['ridge',2],['woodedRidge',2],['pairFlank',2]],top:2,hr:[105,135],wr:[40,64],cr:[30,48]},
  swamp:{layouts:[['marsh',1]],wr:[40,60],woods:[1,2],marsh:[3,5],mr:[60,90]},
  desert:{layouts:[['plain',1],['dune',1]],top:1,hr:[70,90],oasis:[45,65]}
};
// (the 8 uphill directions of B.terrain.up: k·45°, screen y down)
const TDX=[1,Math.SQRT1_2,0,-Math.SQRT1_2,-1,-Math.SQRT1_2,0,Math.SQRT1_2],TDY=[0,Math.SQRT1_2,1,Math.SQRT1_2,0,-Math.SQRT1_2,-1,-Math.SQRT1_2];
// which recipe a battle at this world tile gets (t: battleEnv's terrain, water and peaks already as hills; c: the climate)
function terrainRecipeOf(t,c,forestN){return t===T_HILL?'hills':c==='swamp'?'swamp':c==='desert'?'desert':t===T_FOREST||forestN>=3?'forest':'open'}
// the battle at world point (x,y): its recipe and seed (the tile and its kind: same place, same field); oasis: a desert by water
function terrainAt(x,y,env){
  const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);let n=0,w=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const k=tAt(tx+dx,ty+dy);if(k===T_FOREST)n++;else if(k===T_WATER)w++}
  const recipe=terrainRecipeOf(env.t,env.c,n),code=1+Object.keys(TERRAIN_RECIPE).indexOf(recipe)*4+Math.max(0,CLIMS.indexOf(env.c));
  return{recipe,seed:Math.floor(hash(tx,ty,code)*4294967296)>>>0,tx,ty,oasis:recipe==='desert'&&(w>0||tAt(tx,ty)===T_WATER)}}
// a battle's ground, or null: none when off, in tournaments, sieges and raids (D6); the lab asks for its own (lab.js)
function groundSpecFor(opts,env){const e=G.enc;if(!TERRAIN.on||opts.tournament||opts.sandbox||e&&['siege','raid','tourney'].includes(e.kind))return null;return terrainAt(P.x,P.y,env)}
// (marks the battle's env, unseen by snapshots: envStats then drops the old whole-field hill range, D2)
function groundEnv(env,spec){if(spec&&env&&!env.terrain)Object.defineProperty(env,'terrain',{value:true,configurable:true});return env}

/* ---- generation ---- */
// features in field px: hills {x,y,rx,ry,top}, woods and marsh {x,y,r}; lane: the band free patches keep out of; oasis: water near
function terrainPlan(name,rnd,W,top,bot,oasis){
  const Rc=TERRAIN_RECIPE[name]||TERRAIN_RECIPE.open,mid=(top+bot)/2,fh=bot-top,f=(a,b)=>a+(b-a)*rnd(),n=(a,b)=>a+Math.floor(rnd()*(b-a+1)),e=()=>.85+.3*rnd();
  const P={recipe:name,hills:[],woods:[],marsh:[],layout:null};
  const ly=f(top+fh*.2,bot-fh*.2);P.lane={y0:ly-TERRAIN.lane/2-8,y1:ly+TERRAIN.lane/2+8};
  {let tot=0;const k=rnd()*Rc.layouts.reduce((a,l)=>a+l[1],0);for(const [l,w] of Rc.layouts){tot+=w;if(k<tot){P.layout=l;break}}P.layout=P.layout||Rc.layouts[0][0]}
  const L=P.layout,hill=(x,y,rx,ry,t)=>{const h={x,y,rx,ry,top:t};P.hills.push(h);return h};
  const one=t=>{const r=f(Rc.hr[0],Rc.hr[1]);return hill(W/2+(rnd()-.5)*TERRAIN.jit*W,mid+(rnd()-.5)*fh*.25,r*e(),r*e(),t)};
  const ridge=t=>{const r=f(Rc.hr[0],Rc.hr[1]);return hill(W/2+(rnd()-.5)*TERRAIN.jit*W,mid+(rnd()-.5)*fh*.1,r*.6*e(),r*1.7*e(),t)};
  const pair=()=>{const r=f(Rc.hr[0],Rc.hr[1]),dx=W*f(.2,.27),rx=r*e(),ry=r*e();return[hill(W/2-dx,mid+(rnd()-.5)*fh*.3,rx,ry,Rc.top),hill(W/2+dx+(rnd()-.5)*2*TERRAIN.mirror,mid+(rnd()-.5)*fh*.3,rx*(.95+.1*rnd()),ry*(.95+.1*rnd()),Rc.top)]};
  // (free patches keep out of the lane: an odd one in the middle, the rest in mirrored pairs; trees on a hill stay with it)
  const away=(y,r)=>{const m=r*1.35+TERRAIN.lane/2+8;return Math.abs(y-ly)>=m?y:y<ly?ly-m:ly+m};
  const patches=(list,cnt,rr,dxr)=>{let k=cnt;if(k%2){const r=f(rr[0],rr[1]);list.push({x:W/2+(rnd()-.5)*TERRAIN.jit*W,y:away(f(top,bot),r),r});k--}
    while(k>0){const r=f(rr[0],rr[1]),dx=W*f(dxr[0],dxr[1]),y1=away(f(top,bot),r),y2=away(f(top,bot),r);list.push({x:W/2-dx,y:y1,r},{x:W/2+dx+(rnd()-.5)*2*TERRAIN.mirror,y:y2,r:r*(.95+.1*rnd())});k-=2}};
  if(L==='hill')one(Rc.top);
  else if(L==='woodedHill'){const h=one(Rc.top);P.woods.push({x:h.x,y:h.y,r:Math.min(h.rx,h.ry)*f(.45,.6)})}
  else if(L==='copse')patches(P.woods,1,Rc.cr,[0,0]);
  else if(L==='copses')patches(P.woods,2*n(1,2),Rc.cr,[.08,.24]);
  else if(L==='woods'){if(rnd()<.5)one(1);patches(P.woods,n(Rc.woods[0],Rc.woods[1]),Rc.wr,[.1,.22])}
  else if(L==='pair')pair();
  else if(L==='pairFlank'){const [a,b]=pair(),s=rnd()<.5?-1:1,r=f(Rc.wr[0],Rc.wr[1]);for(const h of [a,b])P.woods.push({x:h.x+(h===a?1:-1)*h.rx*.2,y:h.y+s*h.ry*.7,r})}
  else if(L==='ridge'){ridge(Rc.top);if(rnd()<.5)patches(P.woods,1,Rc.cr,[0,0])}
  else if(L==='woodedRidge'){const h=ridge(Rc.top),r=Math.min(h.rx*.7,f(Rc.wr[0],Rc.wr[1])),s=rnd()<.5?-1:1;P.woods.push({x:h.x,y:h.y+s*h.ry*.25,r},{x:h.x,y:h.y-s*h.ry*.45,r:r*.8})}
  else if(L==='dune')ridge(Rc.top);
  else if(L==='marsh'){patches(P.woods,n(Rc.woods[0],Rc.woods[1]),Rc.wr,[.1,.22]);patches(P.marsh,n(Rc.marsh[0],Rc.marsh[1]),Rc.mr,[.08,.25])}
  if(oasis&&Rc.oasis){const r=f(Rc.oasis[0],Rc.oasis[1]);P.marsh.push({x:W/2+(rnd()-.5)*W*.04,y:away(f(top,bot),r),r})}
  return P}
// a lab's own features (fractions of the field; r in px): no fairness checks
function terrainExplicit(g,W){const sc=(l,k)=>(l||[]).map(p=>k?{x:p.x*W,y:p.y*BH,rx:p.rx||p.r,ry:p.ry||p.r,top:p.top||1}:{x:p.x*W,y:p.y*BH,r:p.r});
  return{recipe:'lab',hills:sc(g.hills,1),woods:sc(g.woods),marsh:sc(g.marsh),layout:'lab',lane:null}}
// the plan laid on the grid: levels and kinds by cell centre (ragged edges from seeded noise), then the slope bands and their uphill
function rasterTerrain(W,plan,seed){
  const cs=TERRAIN.cs,C=Math.ceil(W/cs),R=Math.ceil(BH/cs),N=C*R,kind=new Uint8Array(N),lvl=new Uint8Array(N),up=new Int8Array(N).fill(-1),own=new Int8Array(N).fill(-1),ns=seed%997;
  plan.hills.forEach((h,k)=>{const c0=Math.max(0,Math.floor((h.x-h.rx*1.2)/cs)),c1=Math.min(C-1,Math.floor((h.x+h.rx*1.2)/cs)),r0=Math.max(0,Math.floor((h.y-h.ry*1.2)/cs)),r1=Math.min(R-1,Math.floor((h.y+h.ry*1.2)/cs));
    for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const i=r*C+c,x=(c+.5)*cs,y=(r+.5)*cs,ex=(x-h.x)/h.rx,ey=(y-h.y)/h.ry,d=Math.sqrt(ex*ex+ey*ey)*(1+.3*(noise(x/48,y/48,ns+k*7)-.5));
      const L=h.top>1&&d<TERRAIN.top2?2:d<1?1:0;if(L>lvl[i]){lvl[i]=L;own[i]=k}}});
  for(const [list,K] of [[plan.woods,TKIND.wood],[plan.marsh,TKIND.marsh]])list.forEach((p,k)=>{const e=p.r*1.3,c0=Math.max(0,Math.floor((p.x-e)/cs)),c1=Math.min(C-1,Math.floor((p.x+e)/cs)),r0=Math.max(0,Math.floor((p.y-e)/cs)),r1=Math.min(R-1,Math.floor((p.y+e)/cs));
    for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const x=(c+.5)*cs,y=(r+.5)*cs;if(Math.hypot(x-p.x,y-p.y)/p.r*(1+.5*(noise(x/40,y/40,ns+50+K*20+k*3)-.5))<1)kind[r*C+c]=K}});
  const S=TERRAIN.slope;
  for(let r=0;r<R;r++)for(let c=0;c<C;c++){const i=r*C+c,L=lvl[i];if(!L)continue;let low=false;
    for(let rr=Math.max(0,r-S);rr<=Math.min(R-1,r+S)&&!low;rr++)for(let cc=Math.max(0,c-S);cc<=Math.min(C-1,c+S);cc++)if(lvl[rr*C+cc]<L){low=true;break}
    if(low){const h=plan.hills[own[i]],x=(c+.5)*cs,y=(r+.5)*cs,gx=(x-h.x)/(h.rx*h.rx),gy=(y-h.y)/(h.ry*h.ry);up[i]=((Math.round(Math.atan2(-gy,-gx)/(Math.PI/4))%8)+8)%8}}
  return{cs,C,R,kind,lvl,up}}
// the fairness checks (§3; rivers in phase 2): woods at most zoneWood of either deployment zone; the halves' advantage (levels +
// wood cells) within score of each other; an open lane (no wood or marsh) of TERRAIN.lane edge to edge. Hills are centred or
// mirrored by their plan
function terrainFair(T,W,top,bot){
  const {cs,C,R,kind,lvl}=T,r0=clamp(Math.floor(top/cs),0,R-1),r1=clamp(Math.floor((bot-1)/cs),0,R-1),zw=[0,0],zn=[0,0],sc=[0,0];let run=0,lane=0;
  for(let r=r0;r<=r1;r++){let open=true;for(let c=0;c<C;c++){const i=r*C+c,x=(c+.5)*cs,k=kind[i];if(k)open=false;const z=x<TERRAIN.zone*W?0:x>(1-TERRAIN.zone)*W?1:-1;
    if(z>=0){zn[z]++;if(k===TKIND.wood)zw[z]++}sc[x<W/2?0:1]+=lvl[i]+(k===TKIND.wood?1:0)}run=open?run+1:0;if(run>lane)lane=run}
  const zone=zw[0]<=TERRAIN.zoneWood*zn[0]&&zw[1]<=TERRAIN.zoneWood*zn[1],score=Math.abs(sc[0]-sc[1])<=TERRAIN.score*Math.max(sc[0],sc[1]),open=lane*cs>=TERRAIN.lane;
  return{ok:zone&&score&&open,zone,score,lane:open,scores:sc,laneRows:lane}}
/* B.terrain (the contract with the art: doc/TERRAIN_DESIGN.md §4): {cs,C,R,kind,lvl,up,has:{hills,wood,marsh,water},seed,
   recipe:{kind,layout,hills,woods,marsh,river:null,dropped,tries,text},ai:{tops,crossings,woods}}. spec: {recipe,seed} from the world
   (terrainAt) or the lab, or {explicit,seed}; W, top, bot: the field (BW, fieldTop/fieldBot by default). Up to TERRAIN.tries
   sub-seeds for a fair field; then the offending features are dropped (woods, then marsh, then hills) */
function buildTerrain(spec){
  const W=spec.W||BW,top=spec.top??FIELD_EDGE.top,bot=spec.bot??BH-FIELD_EDGE.bot,seed=spec.seed>>>0;let plan=null,T=null,tries=0;const dropped=[];
  if(spec.explicit){plan=terrainExplicit(spec.explicit,W);T=rasterTerrain(W,plan,seed)}
  else{for(let k=0;k<TERRAIN.tries&&!T;k++){tries=k+1;const p=terrainPlan(spec.recipe,seeded((seed+Math.imul(k,0x9E3779B1))>>>0),W,top,bot,spec.oasis),t=rasterTerrain(W,p,seed);if(terrainFair(t,W,top,bot).ok){plan=p;T=t}}
    if(!T){plan=terrainPlan(spec.recipe,seeded(seed),W,top,bot,spec.oasis);for(const f of ['woods','marsh','hills']){if(!plan[f].length)continue;plan[f]=[];dropped.push(f);T=rasterTerrain(W,plan,seed);if(terrainFair(T,W,top,bot).ok)break}
      if(!T)T=rasterTerrain(W,plan,seed)}}
  const {kind,lvl}=T,has={hills:lvl.some(v=>v>0),wood:kind.includes(TKIND.wood),marsh:kind.includes(TKIND.marsh),water:false};
  terrainIndex(T);
  const box=p=>[p.x-p.r,p.y-p.r,p.x+p.r,p.y+p.r];
  T.has=has;T.seed=seed;
  T.recipe={kind:plan.recipe,layout:plan.layout,oasis:!!spec.oasis,hills:plan.hills.map(h=>({x:h.x,y:h.y,r:(h.rx+h.ry)/2,rx:h.rx,ry:h.ry,top:h.top})),woods:plan.woods.map(p=>({...p})),marsh:plan.marsh.map(p=>({...p})),river:null,lane:plan.lane,dropped,tries};
  T.recipe.text=terrainText(T.recipe,has);
  T.ai={tops:plan.hills.map(h=>({x:h.x,y:h.y,lvl:h.top,half:h.x<W/2?0:1})),crossings:[],woods:plan.woods.map(p=>({x:p.x,y:p.y,box:box(p)}))};
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
  if(!parts.length)return '';const s=parts.join(', ').replace(/, ([^,]*)$/,' and $1');
  return s[0].toUpperCase()+s.slice(1)+'.'+(has.hills?' High ground: archers reach farther and charges downhill hit harder; the climb is hard going.':'')+(has.wood?' Woods slow riders and break formations.':'')+(has.marsh?' Marsh slows and tires all but orcs.':'')}
// the battleground's text (its env's, with the ground's when there will be terrain; the pre-battle panel, encounters.js)
function terrainEnvText(env,kind){
  if(!TERRAIN.on||['siege','raid','tourney'].includes(kind))return env.text;
  const T=buildTerrain({...terrainAt(P.x,P.y,env),W:clamp(BVW,FIELD_W.min,FIELD_W.max)});return groundEnvText(env,T)}
// (a hill's or forest's old words (+15% range; scattered trees) are replaced by the ground's; other climates' rules stay)
const groundEnvText=(env,T)=>{const g=T&&T.recipe.text;return env.t===T_HILL||env.t===T_FOREST?g||'Open ground.':!g?env.text:env.text+' '+g};

/* ---- the rules: O(1) lookups; with no B.terrain each returns exactly 1, false or 0 ---- */
const tIx=(T,x,y)=>{const c=Math.floor(x/T.cs),r=Math.floor(y/T.cs);return(r<0?0:r>=T.R?T.R-1:r)*T.C+(c<0?0:c>=T.C?T.C-1:c)};
function groundAt(x,y){const T=B&&B.terrain;return T?T.kind[tIx(T,x,y)]:0}
function levelAt(x,y){const T=B&&B.terrain;return T?T.lvl[tIx(T,x,y)]:0}
// (a race's or beast's home ground: RACES[r].home, as envStats reads it; D7)
const groundHome=(u,h)=>{const r=u.unit&&u.unit.race||u.s.race,H=r&&RACES[r]?RACES[r].home:u.s.home;return !!H&&H.includes(h)};
const inWood=u=>{const T=B&&B.terrain;return !!T&&T.has.wood&&T.kind[tIx(T,u.x,u.y)]===TKIND.wood};
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
  let m=1;if(Gd&&Gd.run&&!groundHome(u,Gd.home))m*=Gd.run;const w=slopeWay(T,i,mx,my);if(w>0)m*=HILL.runUp;else if(w<0)m*=HILL.runDown;return m}
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
// a melee blow's weight by the ground (attacks.js hit): from higher ground, standing in marsh
function groundHit(att,t){
  const T=B&&B.terrain;if(!T)return 1;const i=tIx(T,att.x,att.y);let m=1;if(T.lvl[i]>=T.lvl[tIx(T,t.x,t.y)]+1)m*=1+HILL.melee;
  const Gd=TGROUND[T.kind[i]];if(Gd&&Gd.hit&&!groundHome(att,Gd.home))m*=Gd.hit;return m}
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
   taken back to level 0 */
function terrainStep(){
  const T=B&&B.terrain;if(!T)return;
  for(const u of B.units){if(u.hp<=0)continue;const i=tIx(T,u.x,u.y),lv=T.lvl[i];u.gk=T.kind[i];u.glv=lv;let s=u.s;if(!s||!(s.range>0))continue;
    if(u.rS!==s){const r0=u.rS?s.range/(1+HILL.range*(u.rl||0)):s.range;s=u.s={...s};u.rS=s;u.r0=r0;u.rl=-1}
    if(lv!==u.rl){s.range=u.r0*(1+HILL.range*lv);u.rl=lv}}}
// the ground under a group, for its details (the HUD: "High ground (+15% range) · Woods (slowed)"); '' with none
function groundLabel(m){
  const T=B&&B.terrain;if(!T||!m||!m.length)return '';const l=m.filter(u=>u.hp>0);if(!l.length)return '';const out=[],lv=Math.round(l.reduce((n,u)=>n+levelAt(u.x,u.y),0)/l.length);
  if(lv>0)out.push('High ground'+(l.some(u=>u.s.range>0)?' (+'+Math.round(HILL.range*lv*100)+'% range)':''));
  for(const K of [TKIND.wood,TKIND.marsh]){const n=l.filter(u=>groundAt(u.x,u.y)===K).length;if(n*2>=l.length)out.push(TGROUND[K].n+' (slowed)')}
  return out.join(' · ')}
