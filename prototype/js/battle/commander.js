'use strict';
/* ---------- the other side's command: one Commander per side (class wave E2), the characters' own mind: charmind.js
   (CharacterMind), the beasts': beastmind.js (PackMind) ---------- */

/* the other side's command: as you command yours, the enemy's captain orders their army's groups (beasts just fight). Infantry advances in line and charges once the lines are close; archers hold behind their infantry
   and shoot, at your hero once the lines meet; cavalry swings round a flank and falls on your archers (or your hero). */
// think: how often a captain decides (s); clash: the lines have met when this close (px); behind: archers stand this far behind
// their infantry; flankY, flankAt, flankMax: cavalry rides this far round a flank, is there within flankAt, or gives up after
// flankMax s; advance: an advancing line's pace; threat: an enemy this close to its archers threatens them; reach: archers aim
// at what is within this share of their range; regroup: cavalry pulls back this far after a charge, recharge: after this long
// in the melee; attackAt / defendAt: the strength ratios to attack or hold at (hold: an attack goes on down to attackAt-hold); stall: a standoff turns into an attack after this;
// lull: no blow struck anywhere for this long (two sides that cannot reach each other), and every group goes in
const FOE_CMD={think:.5,clash:70,behind:50,outgun:.8,volley:12,screen:20,replan:3,moved:30,flankY:110,flankAt:40,flankMax:8,advance:22,threat:70,reach:.97,regroup:90,recharge:3,attackAt:1.15,hold:.1,defendAt:.85,stall:30,lull:10,patience:6,beaten:.4,broken:30};
// unit-level morale (each captain's, a group's own resolve): an infantry group under pullAt with a steady one (backAt) beside it
// steps pullDist back to recover, till backAt or maxRecover s, the nearest steady one free going into the gap; riders under
// chargeAt start no new charge, standing off cavRecover s at most (short: riders out of the fight get their breath back and come
// again, so a long stand-off only drags a cavalry fight out); prey, preyShot: the cavalry's and the shooters' liking for a
// wavering foe (under MORALE.waver)
const UNIT_AI={pullAt:25,backAt:45,pullDist:90,maxRecover:15,chargeAt:40,cavRecover:4,prey:2,preyShot:1.5};
/* AI tactics (every captain: the enemy, your allies, your army under the AI). Its shooters' posture (rangedMode, captainMem(ck).rmode):
   aggressive, they lead the army and open fire first, or safe, behind the infantry screen; charges begun from further off as
   the group's stamina allows (runFor); and the groups' own abilities (unitabilities.js: Brace, Rally, Spur, Fire arrows) */
// fast: a foe who fights hand to hand this fast (or a rider) can run down shooters; fastIn, fastOut: their strength, as a share of
// our shooters', under which ours may lead (in) or keep leading (out); outRange, outShoot: our shooters' reach and strength over
// theirs to lead (either; to keep leading, at least theirs); ammo: under this share of their quivers they are worn; dwell: s safe
// before leading again; dangerT, near: a foe who fights hand to hand this many s off (by his speed, at most CAPT.danger px) or
// this near (px), and leading shooters fall back behind their infantry; screenGap: the infantry this far further off than the
// leading shooters' full reach; pushRun: leading shooters run to their place from this far
// fresh: a group's stamina (FATIGUE's scale) for a long run; runFar: fresh infantry charge at a run from this near (CAPT.runAt
// when not fresh, runNear tired, at a walk spent; riders fresh gallop all the way); footFar: fresh infantry attacking charge from
// this gap (else FOE_CMD.clash); cavStart: fresh riders on their way round a flank charge from this gap, not on top of the foe;
// regroupFar: fresh riders pull back this far to charge again; rested, restMax: tired riders stand off till this stamina, or this long
// braceAt, braceMom: riders or a big beast with this momentum this near a spear group's front (px), it braces; braceKeep: and is
// left braced while one is this near; spur, spurWin, spurSta: riders spur on a fresh charge (spurWin s old) at a mark this far off
// (px), with this stamina; fireGain: fire arrows at an armoured mark (or one weak to fire) when fire does this much more than theirs
const AI_TACTICS={fast:60,fastIn:.15,fastOut:.3,outRange:1.1,outShoot:1.25,ammo:.35,dwell:2,dangerT:3.5,near:110,screenGap:60,pushRun:80,
  fresh:60,runFar:240,runNear:130,footFar:140,cavStart:160,regroupFar:150,rested:55,restMax:5,
  braceAt:80,braceMom:.3,braceKeep:120,spur:[60,140],spurWin:2.5,spurSta:45,fireGain:1.15};
/* race fighting styles (the captain's temperament): multipliers on the tunables of FOE_CMD, UNIT_AI, AI_TACTICS, CAPT and HUNT (keyed
   by name; prey is UNIT_AI's, every other key used here in one table only), read through tun at the captain's decision points. Chosen once per
   captain from its army's troops (temperFor) and kept in captainMem(ck).temper. human: the base itself (balanced); dwarf: holds the
   line (attacks only well ahead, waits longer with shooters, falls back later, breaks into a run nearer the foe, a shield wall
   against a charge from further off, a wavering group rotated out sooner); elf: skirmishers (shooters lead on smaller margins and
   with more riders about, the infantry further behind them and in after longer volleys, hunting from closer spots, riders round a
   wider flank); orc: frenzy (attacks sooner, charges and runs from further off, pulls back later, riders back in quicker, shooters
   careless of riders); mixed (no race 60% of the army): balanced, but quicker to fall on a wavering foe */
const TEMPERAMENT={human:{},
  dwarf:{attackAt:1.15,defendAt:1.2,stall:1.5,beaten:.85,runFar:.9,brace:1.25,braceAt:1.25,pullAt:1.2},
  elf:{outRange:.9,outShoot:.8,fastIn:1.5,fastOut:1.2,screenGap:1.5,volley:1.5,safe:.8,ride:.8,flankY:1.4,preyShot:1.3},
  orc:{attackAt:.85,defendAt:.8,stall:.5,beaten:.75,footFar:1.2,runFar:1.05,pullAt:.6,chargeAt:.6,cavRecover:.5,rested:.7,restMax:.6,regroupFar:.8,fastIn:1.5,fastOut:1.5},
  mixed:{prey:1.5,preyShot:1.5}};
// the enemy's style, told once as the battle opens (not human's: the base)
const TEMPER_SAY={dwarf:'The dwarves hold the line.',elf:'The elves keep their distance.',orc:'The orcs come on in a frenzy.',mixed:'Their mixed host looks for a wavering line.'};
// a tunable as this temperament has it (T: TEMPERAMENT entry, or null: the base)
const tun=(T,tab,k)=>T&&T[k]!=null?tab[k]*T[k]:tab[k];
/* the captains read the ground (terrain phase 2, doc/TERRAIN_DESIGN.md §5): B.terrain's static reading (ai: tops, crossings,
   woods) through captainCtx's ground; with none (no terrain, or TERRAIN_AI.on false) every rule below is skipped and the
   captain is today's. holdR, hillGain: a defending army's line takes the best top this near it (px) on its half (or a middle
   one nearer it than the foe; none a foe stands within held px of), this many levels above it at least, its front on the
   crest, if it can walk there holdSafe s before a foe who fights hand to hand could run there (given up on the way once not);
   woodHold: a wood's worth as such a place, in levels (under hillGain: none but the elves'); uphill, uphillOdds: no
   running charge at a foe holding ground this many levels higher unless the strength ratio is attackAt×uphillOdds (infantry advance at a
   walk, running only the last upRun px; riders wait on the flank for another mark, flankMax×upWait s at most, unless he is
   fighting ours); upVolley: the volleys before infantry goes up at a foe on higher ground (×); shooterHill, shooterFwd:
   shooters look this far (px) for higher ground, at most shooterFwd toward the foe (on the army's line, ±shooterFwd along
   their reach); woodShoot: a wood cell's worth to a shooter's spot, in levels (their own low shots are stopped; an elf's
   is cover: theirs pass); woodsCav, upCav, downCav: the riders' dislike of a mark in woods, marsh or water, of one a level
   higher, liking for one a level lower; flankProbe, woodPad: flank spots tried (×1, ×1.4, the other side) for one in the
   open, and a wood on the way ridden round this wide; riverDefend: a river between the armies, defendAt this much higher,
   the defenders holding their bank at the crossings; bank: crossing points stand this far off the water (px); gladeHold (field
   variety, a dense field's): a glade or clearing on our half as a place to hold, in levels (the infantry at its edge toward the
   foe, who must come through the woods, their formations broken); riders there keep to the roads and paths (terrain.js wayRide),
   their charges too while their mark is over wayCharge px off. steepHold (World Phase 2, D41): a steep top's worth as a place to
   hold, in levels on top of its own (they hold steep crests); a foe holding a steep hill's ground above them is never charged
   running, whatever the odds (onSteep: they walk up, by a shoulder or a ramp where the way round is near: terrain.js routes) */
const TERRAIN_AI={on:true,holdR:220,hillGain:1,held:80,holdSafe:2,woodHold:.5,uphill:1,uphillOdds:1.3,upRun:40,upWait:2,upVolley:1.5,shooterHill:60,shooterFwd:16,woodShoot:-1,
  woodsCav:3,upCav:1.5,downCav:1,flankProbe:3,woodPad:24,riverDefend:1.15,bank:24,gladeHold:1,wayCharge:160,steepHold:1};
/* the ground by race (multipliers on TERRAIN_AI, read through gtun as TEMPERAMENT's are through tun): dwarves seek and keep
   high ground and hold crossings; elves hold woods and shoot from under them (woodShoot turned to a liking) and seek height
   for range; orcs charge up anything but a cliff (uphill 2 levels), on worse odds, after shorter volleys, and look less far
   for a hill to hold (they still route round deep water); human and mixed: the base */
const TERRAIN_TEMPER={dwarf:{holdR:1.5,riverDefend:1.2,shooterHill:1.5},elf:{woodHold:2,woodShoot:-1,shooterHill:1.5},orc:{uphill:2,uphillOdds:.8,upVolley:.5,upCav:.5,holdR:.6}};
// (a man standing his ground: his group holding where it is, not on its way anywhere (a crest held, not one passed over))
const holdsGround=e=>{const g=e.grp&&B.groups[e.grp];return !g||g.order==='hold'&&!g.going};
// (a point on a steep hill's ground: World Phase 2, terrain.js B.terrain.steep)
const onSteep=p=>{const T=B&&B.terrain;return !!T&&!!T.steep&&(T.steep[T.ix(p.x,p.y)]&1)>0};
// (the level under a point, or a list of men's mean)
const lvlOf=l=>Array.isArray(l)?l.reduce((a,u)=>a+levelAt(u.x,u.y),0)/Math.max(1,l.length):levelAt(l.x,l.y);
const wetK=k=>k===TKIND.deep||k===TKIND.ford||k===TKIND.bridge;
// does the straight way a→b wade deep water (its cells every 8 px; points, as the captains have them)
function wadesDeep(a,b){const T=B&&B.terrain;if(!T||!T.has.water)return false;const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/8);
  for(let i=0;i<=n;i++){const k=i/Math.max(1,n);if(groundAt(a.x+(b.x-a.x)*k,a.y+(b.y-a.y)*k)===TKIND.deep)return true}return false}
// the crossing (B.terrain.ai.crossings) that makes the shortest way a→b, or null (points)
function crossingOf(a,b){const T=B&&B.terrain,L=T&&T.ai&&T.ai.crossings;if(!L||!L.length)return null;let best=null,bd=Infinity;
  for(const c of L){const d=Math.hypot(c.x-a.x,c.y-a.y)+Math.hypot(b.x-c.x,b.y-c.y);if(d<bd){bd=d;best=c}}return best}
/* the next point on the way from a to b: the crossing's near end, then (there: in the middle of its width, or on it) its far
   end (on), while the straight way wades deep water; null: straight on. box: the crossing (terrain.js's record: x0..x1 the
   water it spans, y0..y1 its width along the river); s: the way over (+1 east, -1 west) */
function wayVia(a,b){if(!wadesDeep(a,b))return null;const c=crossingOf(a,b);if(!c)return null;const X=c,s=Math.sign(b.x-a.x)||1,pad=TERRAIN_AI.bank;
  const near={x:s>0?X.x0-pad:X.x1+pad,y:c.y},far={x:s>0?X.x1+pad:X.x0-pad,y:c.y},on=(a.x-near.x)*s>-MARCH.reached*2&&Math.abs(a.y-c.y)<(X.y1-X.y0)/4;
  return{...(on?far:near),box:X,s,on}}
// a point moved out of deep water, toward from's side (none: as it is)
function dryOf(p,from){const T=B.terrain;if(!T.has.water||groundAt(p.x,p.y)!==TKIND.deep)return p;const s=Math.sign(from.x-p.x)||1;let x=p.x;
  for(let i=0;i<12&&groundAt(x,p.y)===TKIND.deep;i++)x+=s*T.cs;return{x,y:p.y}}
// riders' way round a wood: the first wood patch the straight way a→b runs through, its men pad px either side of it (not one
// a is in), and a point beside it TERRAIN_AI.woodPad beyond them (toward the side the way passes, else the field's middle);
// null: straight on. (A patch's ragged edge reaches a third past its radius)
function woodAround(a,b,pad=0){const T=B.terrain;if(!T.has.wood||!T.ai)return null;let best=null,bt=2;
  for(const w of T.ai.woods){const r=(w.box[2]-w.box[0])/2*1.35+pad;if(Math.hypot(a.x-w.x,a.y-w.y)<r-pad||segDist(w,a,b)>=r)continue;
    const dx=b.x-a.x,dy=b.y-a.y,L=dx*dx+dy*dy||1,k=clamp(((w.x-a.x)*dx+(w.y-a.y)*dy)/L,0,1);if(k<bt){bt=k;best={w,r,k,fx:a.x+dx*k,fy:a.y+dy*k,dx,dy}}}
  if(!best)return null;const {w,r}=best;let nx=best.fx-w.x,ny=best.fy-w.y,n=Math.hypot(nx,ny);
  if(n<1){const L=Math.hypot(best.dx,best.dy)||1;nx=-best.dy/L;ny=best.dx/L;if(ny*(BH/2-w.y)<0){nx=-nx;ny=-ny}n=1}
  const R=r+TERRAIN_AI.woodPad;return{x:clamp(w.x+nx/n*R,8,BW-8),y:clamp(w.y+ny/n*R,fieldTop(),fieldBot())}}
// a group's stamina on FATIGUE's scale (full for one that has none)
const grpSta=m=>(grpStamina(m)??1)*FATIGUE.max;
// the middle of a list of men (or points); a man's reach (by his stats)
const centroid=l=>({x:l.reduce((a,u)=>a+u.x,0)/l.length,y:l.reduce((a,u)=>a+u.y,0)/l.length});
const reachOf=s=>s.reach||12;
// how near its mark a group on a charge order starts running: infantry and riders by their stamina, others CAPT.runAt
function runFor(k,st,T){const X=AI_TACTICS;if(k!=='inf'&&k!=='cav')return CAPT.runAt;
  return st>=X.fresh?(k==='cav'?Infinity:tun(T,X,'runFar')):st>=FATIGUE.tired?CAPT.runAt:st>=FATIGUE.spent?X.runNear:0}
// beaten / broken: the enemy army falls back (withdraws off its edge) once its strength is under beaten of yours and its
// formations' shared morale (morale.js BattleResolve), weighted by the men in them, is under broken. Your own army never does on its own.
function beatenArmy(N,S,T){
  const rs=[...new Set(Object.values(N).flat().flatMap(grpUnits).map(resolveOf).filter(r=>r&&!r.routed&&r.live().length))],n=rs.reduce((a,r)=>a+r.live().length,0);
  return !!n&&S.ratio<tun(T,FOE_CMD,'beaten')&&rs.reduce((a,r)=>a+r.mor*r.live().length,0)/n<FOE_CMD.broken;
}
// shotFor, shotShare: a group is under fire when this share of its men were hit by a shot in the last shotFor seconds; brace: riders
// building a charge at it this near (a big beast half that), and it braces; keep: a shield wall or loose order is kept this long at least
// contact, cover: Kite (kiteFrom): a foe there within contact s is coming; one of ours within cover px of his path covers
const CAPT={move:40,shoot:.25,turn:.45,shotFor:3,shotShare:.15,brace:140,keep:3,runAt:180,contact:2.5,cover:20,danger:250,haltAt:.97,toBlades:22,threatShare:.5,bare:60,prey:400};// (threatShare: a threat to our shooters worth the infantry, by strength; bare: their shooters with none of their fighters this near)// (toBlades: a melee foe this near its shooters, and no kiting away: melee mode)// (haltAt: on the way, a foe this far into its shooters' reach and they stop to shoot)// (danger: a melee foe this near its shooters counts first in their focus)
/* Hunt: a group of the commander's shooters sent out, while it is safe, to shoot from a spot of its own (HUNT.spot of their reach
   from their mark, on the near side). Safe: every foe who fights hand to hand at least HUNT.safe s (by his own speed) from the
   spot, a rider not already fighting HUNT.ride s; none of their shooters who outrange ours able to reach it. Marks, best first:
   their shooters ours outrange, a man alone, a slow one, the nearer the better */
const HUNT={safe:6,ride:9,spot:.95,ammo:.3,clash:150,tries:6,home:3};
function huntSafe(p,foes,busy,R,T){
  for(const e of foes){if(e.rout||e.hp<=0)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);
    if(e.s.range){if(e.s.range>R&&d<=e.s.range)return false;continue}
    if(!busy(e)&&d/Math.max(1,e.s.spd)<(e.s.charge?tun(T,HUNT,'ride'):tun(T,HUNT,'safe')))return false}
  return true}
function huntSpot(sh,foes,busy,T){
  const C=centroid(sh),R=Math.min(...sh.map(u=>u.s.range)),r=R*HUNT.spot;
  const alone=e=>!foes.some(o=>o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<40),score=e=>(e.s.range&&e.s.range<R?3:0)+(alone(e)?2:0)+(e.s.spd<35?1:0)-Math.hypot(e.x-C.x,e.y-C.y)/400;
  for(const t of foes.filter(e=>!e.rout&&e.hp>0).sort((a,b)=>score(b)-score(a)).slice(0,HUNT.tries)){const a0=Math.atan2(C.y-t.y,C.x-t.x);
    for(const da of [0,.5,-.5,1,-1]){const p={x:clamp(t.x+Math.cos(a0+da)*r,8,BW-8),y:clamp(t.y+Math.sin(a0+da)*r,fieldTop(),fieldBot())};
      if(Math.hypot(p.x-t.x,p.y-t.y)<=R&&huntSafe(p,foes,busy,R,T)&&canReach(C,p))return{t,x:p.x,y:p.y,tx:t.x,ty:t.y}}}// (a spot they can get to: terrain.js)
  return null}
// fire arrows worth it on e: armoured (mail, plate) or weak to fire, and fire does AI_TACTICS.fireGain more to him than a's own shots
function fireWorth(a,e){const s=e.s,ar=armorOf(s);return (ar==='mail'||ar==='plate'||((s.resist&&s.resist.fire)||1)>1)&&typeMul(a.s,s,'fire')*UNIT_ABILITIES.fire.mul>=typeMul(a.s,s)*AI_TACTICS.fireGain}
const segDist=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,L=dx*dx+dy*dy||1,k=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/L,0,1);return Math.hypot(a.x+dx*k-p.x,a.y+dy*k-p.y)};
/* Kite: the commander's look at a group of its shooters. The foe they must keep away from: one who fights hand to hand coming
   at them (inside their keeping distance, or charging in, there within CAPT.contact s) with none of our fighters on him or
   between him and them. The nearest such foe, or null: then they need not move */
function kiteFrom(sh,foes,mates){let best=null,bd=1e9;
  for(const e of foes){if(e.s.range||e.rout)continue;const n=sh.reduce((a,u)=>Math.hypot(e.x-u.x,e.y-u.y)<Math.hypot(e.x-a.x,e.y-a.y)?u:a),d=Math.hypot(e.x-n.x,e.y-n.y),keep=Math.min(SKIRM.max,n.s.range*SKIRM.keep);
    const v=(e.spdNow||0)*Math.cos(Math.atan2(n.y-e.y,n.x-e.x)-(e.dir||0));if(!(d<=keep||v>5&&d/v<CAPT.contact))continue;
    if(!mates.some(f=>f.hp>0&&!f.rout&&(Math.hypot(f.x-e.x,f.y-e.y)<reachOf(f.s)+8||segDist(f,e,n)<CAPT.cover&&Math.hypot(f.x-e.x,f.y-e.y)<d))&&d<bd){bd=d;best=e}}
  return best}
const wOf=u=>u.hp/Math.max(1,u.max)*(u.hero||u.leader||u.comp?4:(ST[u.type]&&ST[u.type].tier||1));
/* a captain's own memory, one each (ck: the enemy's 1, your army's 0, your allies' 'ally'): post, its posture (posture); plan,
   its army's line (captainCtx); idle, s its shooters have had nobody in reach; vol, s of their volleys; commit, gone in for
   good (a lull, or idle too long); rmode, its shooters' posture (rangedMode); temper, its race's fighting style (TEMPERAMENT key, null: none), chosen at its first
   think (temperFor). Yours is forgotten each time Auto changes (setAuto) */
function captainMem(ck){const C=B.captains=B.captains||{};return C[ck]||(C[ck]={post:null,plan:null,idle:0,vol:0,commit:false,rmode:null})}
const foesKnown=team=>B.units.some(u=>battleEnemy(team,u)&&u.hp>0&&lastSeen(team,u));
// (are a and b on either bank of a held bridge's river (its middle, B.terrain.ai.river)? the straight way between may run over the
// bridge itself, so wadesDeep cannot tell)
const acrossRiver=(a,b)=>{const r=B.btype&&B.btype.kind==='bridge'&&B.terrain&&B.terrain.ai.river;return !!r&&r.deep&&(a.x-r.x)*(b.x-r.x)<0};
/* ---------- the captains: one Commander for each side that the AI commands, by its key ck (the enemy's 1, your army's 0: the
   groups the AI has (deploy.js aiHas), your allies' 'ally'). It reads the battle (assess, read), keeps its memory (captainMem:
   B.captains[ck], the plain record tests and the HUD read: post, plan, idle, vol, commit, rmode, temper, seen, take, hold,
   files, lineT, beast), and gives its orders each think (FOE_CMD.think s: Commander.command) through each group's BattleControl
   (battlecontrol.js), the same tools you use: its posture, its shooters' lead (rangedMode), each arm's moves and charges
   (infantry, shooters, cavalry, hero), the groups' abilities (Brace, Rally, Fire arrows, Spur, Scout ahead), the search for a
   foe unseen, the battle types' ways (typePost, typeHolds, take) and the withdrawal (fallsBack: the enemy's, EnemyCommander).
   Its beasts are its PackMind's (beastmind.js), its characters their own (charmind.js). A Commander holds no state of its own
   beyond its key and multi-army coordinator: its shared memory is made only when it first needs one ---------- */
// A mounted melee wing lines up, strikes briefly, peels out and loops back for a new run-up. Chased (a foe within clear px), it
// gallops clear first (break: up to legs legs of out px away from its chasers while it outruns them; clear, it has them again),
// and rides at a foe again only from a run-up of runMin px at least: one who comes at it (moved px off where he stood) it turns
// on within meet px; one closer, coming at it (moving px/s at least), it leaves behind, or meets if he is as fast (outpaced: the
// share of its pace he must be under; such a charge is forced). Spear walls (wall; any spear: his reach more avoid px to keep
// off) it rides at from a flank, never head on: one facing it and fighting no one else (balks) it turns away from 1.5 × clear px
// off (on its last leg in, or any leg once the wall comes at it), and stands off balk s before trying again. No way round a
// mark: straight at him from a run-up (straight px dearer); no way out at all: it rides at the nearest (forced), but holds
// before a spear wall. Rested (rested stamina), or restMax s at rest and fit to charge (minSta), it goes again. lead: see
// travel; rough: see leg
const CAVALRY_RIDE={runup:115,flank:85,loop:155,near:26,contact:24,impact:.7,unsafe:.3,chargeMax:8,travelMax:12,recover:1.2,rested:55,minSta:35,formed:90,avoid:28,spear:120,margin:18,
  out:150,clear:110,runMin:60,meet:170,legs:3,outpaced:.9,moved:40,turn:25,lead:40,balk:6,straight:200,rough:60,pike:20,moving:8,restMax:12};
class CavalryRide{
 static safe(a,p){const X=CAVALRY_RIDE;if(p.x<X.margin||p.x>BW-X.margin||p.y<fieldTop()+X.margin||p.y>fieldBot()-X.margin||B.world&&!B.world.inside(p,X.margin))return false;const T=B.terrain;return !T?.blocky||lineClear(T.route.mounted,a.x,a.y,p.x,p.y,255,ROUTE_UNIT.r)}
 static point(E,v,f,l,side){return {x:E.x+v.x*f-v.y*l*side,y:E.y+v.y*f+v.x*l*side}}
 static choose(c,C){const pool=new Map();for(const e of c.foes){if(e.rout||withdrawing(e))continue;const key=e.grp||e.id,old=pool.get(key);if(!old||c.d2(C,e)<c.d2(C,old))pool.set(key,e)}const score=e=>c.d2(C,e)-(e.s.range?65:0)-(c.engaged(e)?35:0)+(unitClass(e.s)==='spear'&&shieldWallActive(e)?CAVALRY_RIDE.spear:0);return [...pool.values()].filter(e=>!B.terrain?.blocky||canReach(C,e,'mounted')).reduce((a,e)=>!a||score(e)<score(a)?e:a,null)}
 // (no flank to be had: straight at him from a run-up's length on this side of him, at straight px more cost; a way in by the
 // front of a spear, 1.5 × spear px of him, as dear)
 static route(c,C,E,v,exit=false){const X=CAVALRY_RIDE,candidates=[];for(const side of exit?[1,-1]:[1,-1,0]){
   const points=exit?[this.point(C,v,65,75,side),this.point(E,v,X.runup*.65,X.loop,side),this.point(E,v,-X.runup,X.loop,side)]:side?[this.point(E,v,-X.runup,X.flank,side),this.point(E,v,-X.runup*.7,20,side)]:[this.point(E,v,-X.runup*.7,0,1)];
   let a=C,valid=true,cost=0,danger=0;for(const p of points){if(!this.safe(a,p)){valid=false;break}cost+=c.d2(a,p);for(const e of c.foes)if(!e.rout){const r=this.avoid(e);for(const t of [.25,.5,.75,1])if(c.d2(e,{x:a.x+(p.x-a.x)*t,y:a.y+(p.y-a.y)*t})<r){cost+=150;danger++}if(!exit&&c.d2(e,p)<X.spear*1.5&&this.spearFront(e,p))cost+=X.straight}a=p}if(valid)candidates.push({points,side:side||1,cost:cost+(side?0:X.straight),danger})
  }return candidates.sort((a,b)=>a.cost-b.cost)[0]||null}
 // how far off a foe its way keeps (a spear: his reach further); a spear wall (pikes, pike px of reach or more, or spears braced
 // or in a shield wall) facing them (within 60° of head on); a foe coming at them (moving, within 60° of straight at them)
 static avoid(e){return CAVALRY_RIDE.avoid+(unitClass(e.s)==='spear'?e.s.reach||0:0)}
 static wall(e){const g=e.grp&&B.groups[e.grp];return unitClass(e.s)==='spear'&&((e.s.reach||0)>=CAVALRY_RIDE.pike||shieldWallActive(e)||!!g&&abilityActive(g,'brace'))}
 static spearFront(e,C){const g=e.grp&&B.groups[e.grp],f=g?.currentFacing??g?.face;return this.wall(e)&&f!=null&&Math.cos(Math.atan2(C.y-e.y,C.x-e.x)-f)>.5}
 static coming(e,C){return (e.vel??e.spdNow??0)>CAVALRY_RIDE.moving&&Math.cos(Math.atan2(C.y-e.y,C.x-e.x)-(e.hd??e.dir??0))>.5}
 // a spear wall facing them, fighting no one else, that they can leave behind: no charge, they stand off
 static balks(c,m,e,C){return this.spearFront(e,C)&&!c.engaged(e)&&this.outruns(m,e)}
 // the way they ride in at him (a unit vector): straight at him, or at a spear wall facing them, at its nearer flank
 static line(C,e){const g=e.grp&&B.groups[e.grp],f=g?.currentFacing??g?.face,dx=e.x-C.x,dy=e.y-C.y,len=Math.hypot(dx,dy)||1;if(!this.spearFront(e,C))return {x:dx/len,y:dy/len};const n={x:-Math.sin(f),y:Math.cos(f)},k=n.x*dx+n.y*dy>0?1:-1;return {x:n.x*k,y:n.y*k}}
 // (chased: they make for a place lead px past it, so they are still at a gallop when they get there)
 static travel(g,p,C,lead=0){const l=lead/(Math.hypot(p.x-C.x,p.y-C.y)||1);p={x:p.x+(p.x-C.x)*l,y:p.y+(p.y-C.y)*l};const sx=g.units.reduce((n,u)=>n+(u.sx||0),0)/g.units.length,sy=g.units.reduce((n,u)=>n+(u.sy||0),0)/g.units.length;g.standAt(p.x-sx,p.y-sy);g.face=Math.atan2(p.y-C.y,p.x-C.x)}
 // the foes who could ride it down (none routing or going), the nearest; whether it outruns him (its slowest rider, tired or not)
 static live(e){return e.hp>0&&!e.rout&&!withdrawing(e)}
 static nearest(c,C){let n=null;for(const e of c.foes)if(this.live(e)&&(!n||c.d2(e,C)<c.d2(n,C)))n=e;return n}
 // where its mark's men stand (their middle): he has come at them once that is moved px off where it was
 static mark(c,p){const l=c.foes.filter(e=>this.live(e)&&(p.group?e.grp===p.group:e.id===p.unit));return l.length?centroid(l):null}
 static outruns(m,e){return e.s.spd*tiredMul(e).spd<Math.min(...m.map(u=>u.s.spd*tiredMul(u).spd))*CAVALRY_RIDE.outpaced}
 // a leg out of reach: off the middle of those within 1.5 × clear px, turned up to 115° either way (along the field's edge), the
 // one ending furthest from them less turn px a radian its riders must wheel and rough px each for woods, marsh or deep water at
 // its middle and end (slow going for horses: foot would catch them there); safe ground only (null: nowhere to go)
 static rough(p){const k=groundAt(p.x,p.y);return k===TKIND.wood||k===TKIND.marsh||k===TKIND.deep}
 static leg(c,C,m){const X=CAVALRY_RIDE,near=c.foes.filter(e=>this.live(e)&&c.d2(e,C)<X.clear*1.5);if(!near.length)return null;const T=centroid(near),a0=Math.atan2(C.y-T.y,C.x-T.x),hd=Math.atan2(m.reduce((n,u)=>n+Math.sin(u.hd??u.dir??0),0),m.reduce((n,u)=>n+Math.cos(u.hd??u.dir??0),0));let best=null;
  for(const k of [0,.4,-.4,.8,-.8,1.2,-1.2,1.6,-1.6,2,-2]){const a=a0+k,p={x:C.x+Math.cos(a)*X.out,y:C.y+Math.sin(a)*X.out};if(!this.safe(C,p))continue;const mid={x:(C.x+p.x)/2,y:(C.y+p.y)/2},score=Math.min(...near.map(e=>c.d2(e,p)))-angGap(a,hd)*X.turn-((this.rough(p)?1:0)+(this.rough(mid)?1:0))*X.rough;if(!best||score>best.score)best={p,score}}return best&&best.p}
 // gallop clear (a new leg; its time its own); no way out: they ride at him from where they are, or (standing off a spear
 // wall: stand, or a wall coming at them) hold there
 static breakAway(c,g,m,C,p,foe,stand=false){const to=(p.legs||0)<CAVALRY_RIDE.legs&&this.leg(c,C,m);if(!to&&(stand||foe&&this.wall(foe))){p.phase='recover';p.points=[{x:C.x,y:C.y}];p.at=B.t;g.rest=true;return true}if(!to)return this.charge(c,g,p,C,foe,true);p.phase='exit';p.points=[to];p.index=0;p.legs=(p.legs||0)+1;p.at=B.t;p.chased=true;g.phase='regroup';g.rest=false;this.travel(g,to,C);return true}
 static charge(c,g,p,C,e,forced=false){p.phase='charge';p.forced=forced;p.at=B.t;p.hit=null;p.group=e.grp;p.unit=e.id;p.enemy={x:e.x,y:e.y};p.mark=this.mark(c,p);const len=c.d2(C,e)||1;p.v={x:(e.x-C.x)/len,y:(e.y-C.y)/len};p.runup=len;g.phase='charge';g.chargeAt=B.t;g.rest=false;g.attack(e);sfxAt('gallop',C.x,C.y);return true}
 static step(c,g,m){
  const X=CAVALRY_RIDE,C=centroid(m),st=grpSta(m),d=c.d2;let p=g.ridePlan,target=p&&c.foes.reduce((a,e)=>this.live(e)&&(p.group?e.grp===p.group:e.id===p.unit)&&(!a||d(e,C)<d(a,C))?e:a,null);
  if(!p){target=this.choose(c,C);if(!target)return false;const v=this.line(C,target),route=this.route(c,C,target,v),near=this.nearest(c,C);
   // (no way round him, a foe close (at the field's edge, say): out of reach first, if they can be, and round from there)
   if(!route&&!(near&&d(near,C)<X.clear&&this.outruns(m,near)&&this.leg(c,C,m)))return false;p=g.ridePlan={phase:'approach',points:route?.points||[],side:route?.side||1,index:0,v,enemy:{x:target.x,y:target.y},group:target.grp,unit:target.id,at:B.t};p.mark=this.mark(c,p);g.phase='flank';if(!route)return this.breakAway(c,g,m,C,p,near)}
  const foe=this.nearest(c,C),gap=foe?d(foe,C):Infinity,able=st>=X.minSta&&(!c.rOf?.(g.id)||c.rOf(g.id).mor>=tun(c.T,UNIT_AI,'chargeAt'));
  if(p.phase==='charge'){
   const contact=c.foes.some(e=>!e.rout&&m.some(u=>d(u,e)<X.contact));if(contact&&p.hit==null)p.hit=B.t;
   const unsafe=m.filter(u=>c.foes.some(e=>!e.rout&&d(u,e)<X.contact)).length>m.length*.7||target&&unitClass(target.s)==='spear'&&shieldWallActive(target),spent=st<X.minSta;
   if(p.hit!=null&&B.t-p.hit>=(unsafe||spent?X.unsafe:X.impact)||B.t-p.at>X.chargeMax||!target){
    // (no loop round him: straight out of reach, else they stand off where they are)
    const route=this.route(c,C,p.enemy,p.v,true);if((!route||route.danger)&&gap<X.clear&&this.leg(c,C,m)){p.legs=0;return this.breakAway(c,g,m,C,p,foe)}if(!route){g.standAt(C.x,C.y);delete g.ridePlan;g.phase='regroup';g.t=0;return true}p.phase='exit';p.points=route.points;p.index=0;p.legs=0;p.at=B.t;p.chased=gap<X.clear;g.phase='regroup';g.rest=false;
   }else{g.attack(target);return true}
  }
  if(p.phase==='approach'){
   if(!target){delete g.ridePlan;return false}
   // (a foe too close for a run-up: they gallop clear of him, or meet him if he is as fast; their mark come at them: from a
   // run-up's length they ride at him at once, further off the way round is planned again from where he is now)
   if(gap<X.runMin&&this.coming(foe,C))return this.outruns(m,foe)?this.breakAway(c,g,m,C,p,foe):this.charge(c,g,p,C,foe,true);
   const at=this.mark(c,p),moved=at&&p.mark&&d(at,p.mark)>X.moved;
   if((p.index>=p.points.length-1||moved)&&d(target,C)<X.clear*1.5&&this.balks(c,m,target,C)){p.balk=B.t;return this.breakAway(c,g,m,C,p,target,true)}
   if(moved){const td=d(target,C);if(td<=X.meet)return able&&!this.balks(c,m,target,C)?this.charge(c,g,p,C,target):this.breakAway(c,g,m,C,p,foe);
    // (further off: the way round goes with him)
    const dx=at.x-p.mark.x,dy=at.y-p.mark.y;p.points=p.points.map(q=>({x:q.x+dx,y:q.y+dy}));p.enemy={x:p.enemy.x+dx,y:p.enemy.y+dy};p.mark=at}
  }
  if(p.phase==='approach'||p.phase==='exit'){
   if(B.t-p.at>X.travelMax){delete g.ridePlan;g.phase='regroup';g.t=0;g.standAt(C.x,C.y);return true}
   // (chased, at a gallop: a foe within runMin px, or coming at them within clear px)
   if(p.phase==='exit')p.chased=gap<X.runMin||gap<X.clear&&this.coming(foe,C);
   const to=p.points[p.index];if(!this.safe(C,to)){delete g.ridePlan;return false}this.travel(g,to,C,p.chased?X.lead:0);
   if(d(C,to)<X.near){p.index++;
    // (out of a charge with a foe on their heels they keep galloping, while they outrun him)
    if(p.phase==='exit'&&gap<X.clear&&this.outruns(m,foe)&&(p.legs||0)<X.legs)return this.breakAway(c,g,m,C,p,foe);
    if(p.index>=p.points.length){if(p.phase==='exit'){p.phase='recover';p.at=B.t;p.chased=false;g.rest=true;if(gap>=X.clear)p.legs=0}else if(able&&!this.balks(c,m,target,C))this.charge(c,g,p,C,target);else if(able){p.balk=B.t;return this.breakAway(c,g,m,C,p,target,true)}else{p.phase='recover';p.at=B.t;g.rest=true}}}return true;
  }
  if(p.phase==='recover'){
   g.phase='regroup';g.rest=true;const at=p.points[p.points.length-1];this.travel(g,at,C);if(foe)g.face=Math.atan2(foe.y-C.y,foe.x-C.x);const sx=m.reduce((n,u)=>n+(u.sx||0),0)/m.length,sy=m.reduce((n,u)=>n+(u.sy||0),0)/m.length,formed=m.every(u=>Math.hypot(u.x-C.x-(u.sx||0)+sx,u.y-C.y-(u.sy||0)+sy)<X.formed);
   if(gap<X.contact)return this.charge(c,g,p,C,foe,true);
   // (a foe coming on: from a run-up they ride at him; too close, they gallop clear again while they outrun him, else meet him)
   if(gap<X.clear){if(gap>=X.runMin&&able&&!this.balks(c,m,foe,C))return this.charge(c,g,p,C,foe);if(this.outruns(m,foe)&&(p.legs||0)<X.legs)return this.breakAway(c,g,m,C,p,foe);if(gap<X.runMin)return this.charge(c,g,p,C,foe,true)}
   if(B.t-p.at>=X.recover&&B.t-(p.balk??-1e9)>=X.balk&&(st>=X.rested||B.t-p.at>=X.restMax&&st>=X.minSta)&&formed&&(!c.rOf?.(g.id)||c.rOf(g.id).mor>=tun(c.T,UNIT_AI,'chargeAt')||B.t-p.at>=tun(c.T,UNIT_AI,'cavRecover'))){delete g.ridePlan;g.rest=false;g.phase='flank'}return true;
  }
  return false;
 }
}

// Multi-army coordination leaves each arm's existing tactics in charge of its posture and abilities.
const ARMY_AI={lock:4,switchGain:45,focus:15,spacing:1.6,threat:85,urgent:30,threatWeight:1.4,pursuit:180,cavPursuit:1.5,contact:30,chase:3,chaseLeash:90,scatter:75,scatterShare:.5,formed:25,regroup:4,retry:8};
class ArmyTactics{
 constructor(commander){this.commander=commander;this.states=new Map()}
 static managed(g){return !!g&&(g.team>0||aiHas(g))}
 static local(u,e){if(!B.sides?.active||!ArmyTactics.managed(B.groups[u.grp])||!e.rout&&!withdrawing(e))return true;const state=Commander.of(u.team).tactics?.states.get(u.grp);if(state?.skipFleeUntil>B.t)return false;return Math.hypot(e.x-u.x,e.y-u.y)<=(u.s.range&&!u.empty?u.s.range:ARMY_AI.contact)}
 core(groups){const points=groups.map(g=>g.centre()),mid=k=>points.map(p=>p[k]).sort((a,b)=>a-b)[Math.floor((points.length-1)/2)];return {x:mid('x'),y:mid('y')}}
 reachable(a,b,who){return !B.terrain?.blocky||canReach(a,b,who)}
 step(N){
  const X=ARMY_AI,groups=Object.values(N).flat().map(id=>B.groups[id]).filter(g=>ArmyTactics.managed(g)&&g.order!=='withdraw'&&g.units.some(u=>fighting(u)&&!u.left));if(!groups.length){this.states.clear();return}
  const ids=new Set(groups.map(g=>g.id));for(const id of this.states.keys())if(!ids.has(id))this.states.delete(id);
  const core=this.core(groups),mine=B.units.filter(u=>u.team===this.commander.team&&fighting(u)&&!u.left&&!withdrawing(u)),foes=B.units.filter(u=>u.hp>0&&!u.left&&battleEnemy(this.commander.team,u)&&seenBy(this.commander.team,u)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  if(!this.home){this.home=core;this.radius=Math.max(X.pursuit,...groups.map(g=>dist(g.centre(),core)*X.spacing))}
  for(const g of groups){const m=g.units.filter(u=>fighting(u)&&!u.left),C=centroid(m),start=m.reduce((a,u)=>dist(u,C)<dist(a,C)?u:a),gap=e=>Math.min(...m.map(u=>dist(u,e))),who=m.some(u=>u.s.big)?'big':m.filter(u=>u.s.mounted).length>m.length/2?'mounted':'foot';let state=this.states.get(g.id);if(!state){state={offset:{x:C.x-core.x,y:C.y-core.y},lock:0};this.states.set(g.id,state)}
   if(g.ridePlan)continue;
   if(state.chase&&(B.t-state.chase.at>=X.chase||dist(C,state.chase)>=X.chaseLeash)){state.skipFleeUntil=B.t+X.retry;state.chase=null;state.target=null;state.regroup={x:C.x,y:C.y,until:B.t+X.regroup}}
   if(g.resolve?.routed||g.recover||abilityActive(g,'brace')||g.phase==='regroup')continue;
   const sx=m.reduce((n,u)=>n+(u.sx||0),0)/m.length,sy=m.reduce((n,u)=>n+(u.sy||0),0)/m.length,near=foes.some(e=>!e.rout&&!withdrawing(e)&&m.some(u=>dist(u,e)<X.urgent)),leash=this.radius*(g.role==='cav'?X.cavPursuit:1),spread=m.filter(u=>Math.hypot(u.x-C.x-(u.sx||0)+sx,u.y-C.y-(u.sy||0)+sy)>X.scatter).length;
   const scattered=m.length>=3&&spread/m.length>=X.scatterShare,outlier=dist(C,core)>leash;
   if(!near&&(g.order==='charge'||g.order==='advance'||state.regroup)&&((scattered||outlier)&&B.t>=(state.retry||0)||state.regroup)){
    if(!state.regroup){const p=outlier?{x:core.x+state.offset.x,y:core.y+state.offset.y}:C;state.regroup={x:p.x,y:p.y,until:B.t+X.regroup};if(!this.reachable(start,p,who))state.regroup={x:C.x,y:C.y,until:B.t+X.regroup};state.target=null}
    const p=state.regroup,formed=m.every(u=>Math.hypot(u.x-p.x-(u.sx||0)+sx,u.y-p.y-(u.sy||0)+sy)<X.formed);
    if(B.t<p.until&&!formed){g.standAt(p.x-sx,p.y-sy);continue}state.regroup=null;state.retry=B.t+X.retry;
   }else if(near&&state.regroup){state.regroup=null;state.retry=B.t+X.retry}
   const pool=new Map();for(const e of foes){const fleeing=e.rout||withdrawing(e);if(fleeing&&(state.skipFleeUntil>B.t||gap(e)>X.contact||dist(core,e)>leash))continue;const key=e.grp||'u'+e.id,old=pool.get(key);if(!old||dist(C,e)<dist(C,old))pool.set(key,e)}
   const candidates=[...pool.values()].filter(e=>this.reachable(start,e,who)),score=e=>dist(C,e)-Math.max(0,X.threat-Math.min(...mine.map(u=>dist(u,e))))*X.threatWeight-(g.targetGroupId===e.grp?X.focus:0),current=candidates.find(e=>(e.grp||'u'+e.id)===state.target),best=candidates.reduce((a,e)=>!a||score(e)<score(a)?e:a,null);
   let target=best;if(current&&best&&best!==current){const urgent=gap(best)<X.urgent&&gap(current)>X.threat;target=urgent?best:B.t-state.lock<X.lock||score(best)>score(current)-X.switchGain?current:best}
   if(!target){state.target=null;if(g.order==='charge'||g.order==='advance'||g.hasTarget)g.standAt(C.x,C.y);continue}
   if(target.rout||withdrawing(target)){if(!state.chase)state.chase={x:C.x,y:C.y,at:B.t}}else state.chase=null;
   const key=target.grp||'u'+target.id;if(key!==state.target){state.target=key;state.lock=B.t}
   if(g.order==='charge'||g.order==='advance'||g.hasTarget){const advance=g.order==='advance',old=g.targetGroupId===target.grp&&g.hasTarget;if(!old)g.attack(target);if(advance)g.run=false}
  }
 }
}

const COMMANDERS=new WeakMap();
class Commander{
  constructor(ck){this.ck=ck;this.team=ck==='ally'?0:ck;this.key=ck==='ally'?'ally':undefined}
  // the commander of key ck in this battle (one each, kept with the battle; none made for its memory)
  static of(ck){let m=B&&COMMANDERS.get(B);if(!m){m={};if(B)COMMANDERS.set(B,m)}return m[ck]||(m[ck]=typeof ck==='number'&&ck>0?new EnemyCommander(ck):new Commander(ck))}
  // (by team and key, as the old names have them: key 'ally', your allies', else the team's own)
  static at(team,key){return Commander.of(key==null?team:key)}
  // its memory (captainMem: made the first time), and a look at it that never makes it
  get Q(){return captainMem(this.ck)}
  get mem(){return B.captains&&B.captains[this.ck]}
  // a captain's temperament entry (null: none chosen yet, or none: the base); never makes the captain's memory
  get T(){const q=this.mem;return q&&TEMPERAMENT[q.temper]||null}
  // (a ground tunable as a captain's temperament has it)
  gt(k){const q=this.mem;return tun(q&&TERRAIN_TEMPER[q.temper]||null,TERRAIN_AI,k)}
  // the ground a captain reads (B.terrain), or null: none, or TERRAIN_AI off (ck: the captain; the lab blinds one side here)
  ground(){return TERRAIN_AI.on&&B&&B.terrain||null}
  /* a captain's temperament from its troops (characters aside): the race of 60% of those of a race, else mixed; none (null, the base)
     when under half its troops have a race (beasts, monsters, the generic levies) */
  temperFor(){const ids=new Set(Object.values(this.groups()).flat()),n={};let all=0;
    for(const u of B.units)if(ids.has(u.grp)&&u.hp>0&&!u.hero&&!u.leader&&!u.comp){all++;const r=ST[u.type]&&ST[u.type].race;if(r)n[r]=(n[r]||0)+1}
    const raced=Object.values(n).reduce((a,v)=>a+v,0),top=Object.keys(n).sort((a,b)=>n[b]-n[a])[0];
    return !raced||raced*2<all?null:n[top]>=raced*.6?top:'mixed'}
  // (a captain's groups: the enemy's, your allies', or, yours, those the AI has (deploy.js aiHas): your others are friends it fights
  // beside, never its to order)
  groups(){const {team,key}=this;
    if(B.sides?.active&&team>0)return Object.fromEntries(['inf','arc','mag','cav','hero'].map(role=>[role,Object.keys(B.groups).filter(id=>B.groups[id].team===team&&B.groups[id].role===role)]));
    const ids=Object.keys(B.groups).filter(id=>{const g=B.groups[id];return g.team===team&&(team===1||key==='ally'?team===1||g.ally:aiHas(g))});
    return Object.fromEntries(['inf','arc','mag','cav','hero'].map(role=>[role,ids.filter(id=>B.groups[id].role===role)]));
  }
  /* one side's captain. It reads the whole battle (assess): each side's strength (health by tier), how much of it shoots, how
     close the lines are, and who threatens its archers. Its posture: attack if it is the stronger, or if the other side
     outshoots it (it must close in); hold its ground if it is the weaker but shoots as well (let them come to its arrows); a
     standoff turns into an attack. Then each arm:
     infantry: to its archers' rescue when they are threatened; else advance (attack) or hold a line in front of its archers
     (defend), and charge once the lines meet;
     archers: behind their infantry, stepping back from melee (skirmish), all shooting at the best target in reach: whoever is
     fighting its own men, else the other side's archers, else whoever is nearest (the other side's leader only if nothing
     better is in reach); out of arrows, into the melee;
     cavalry: round a flank, then charges the best target (archers, then those already fighting its men: their backs, then the
     isolated; never braced spearmen if it can help it); after a while in the melee it pulls back and charges again; it rides to
     its archers' rescue first;
     your hero (under the AI): behind the infantry until the lines meet, then into the fight. */
  assess(){const team=this.team;
    const mine=B.units.filter(u=>u.team===team&&fighting(u)),foes=B.units.filter(u=>battleEnemy(team,u)&&fighting(u)&&seenBy(team,u));// (only foes it can see: terrain.js sight)
    const pw=l=>l.reduce((a,u)=>a+wOf(u),0),shoot=l=>l.filter(u=>u.s.range).reduce((a,u)=>a+wOf(u),0),pm=pw(mine),pf=pw(foes);
    return{mine,foes,ratio:pm/Math.max(.01,pf),shootMe:shoot(mine)/Math.max(.01,pm),shootFoe:shoot(foes)/Math.max(.01,pf)};
  }
  // each moment: an advancing line's anchor moves toward the other army (the enemy's; yours under the AI)
  // twice a second, the captains' orders: the enemy's always; yours only for the groups the AI has (A: deploy.js)
  static command(dt){
    powersThink(dt);// (the commanders' powers: theirs, and yours under Auto; commandpowers.js)
    if(!B||(B.cmdT=(B.cmdT||0)-dt)>0)return;B.cmdT=FOE_CMD.think;
    // (orders hands its groups on to finish: the same as groups would find again, groups being made only at the start)
    if(B.sides?.active){for(const team of B.sides.teams())if(team>0)Commander.of(team).think()}else{if(!B.hunt)Commander.of(1).think();if(Object.values(B.groups).some(g=>g.ally))Commander.of('ally').think()}// (your allies' own captain)
    if(aiAny())Commander.of(0).think();// (yours: the groups the AI has, deploy.js aiHas)
  }
  // one think: its orders, then each group's pace, formation and front (finish)
  think(){if(B.hunt&&this.team===0){B.hunt.orders(Object.values(this.groups()).flat().map(id=>B.groups[id]));return}const groups=B.sides?.active?this.groups():null,N=this.orders();if(groups)(this.tactics||(this.tactics=new ArmyTactics(this))).step(groups);this.finish(N)}
  // a captain's think: its posture, then each arm in turn on one reading of the battle (captainCtx); it hands back its groups (captainFinish's)
  orders(){
    // (ck: this captain's own memory (captainMem): your army's and your allies' are on one side but each its own)
    // (in the fog (battlefog.js) a lull is reckoned from the later of the last blow and its first sight of the foe (Q.seen); one that
    // has never seen the foe goes looking after FOG.scout s: captainSearch)
    const {team,ck}=this,N0=this.groups(),Z=beastsOf(N0),S=this.assess(),foes=S.foes;
    if(Z.length)captainBeasts(team,ck,S,Z);// (its beasts their own ways, taken out of its arms: beastmind.js PackMind; none with BEAST_TACTICS off; by its old name, which tests/beastai.js wraps)
    this.scout(N0,S);// (its scouts range ahead while the foe is unseen)
    if(!foes.length){const seen=B.fog&&B.captains&&B.captains[ck]&&B.captains[ck].seen||0;if(!this.typeHolds(S)&&(B.t-Math.max(B.lastHit||0,seen)>FOE_CMD.lull||B.fog&&B.t>FOG.scout&&!foesKnown(team)))this.search(N0);return N0}
    // (its temperament, once, from its army's troops (temperFor); the enemy's style told as the battle opens)
    const Q=this.Q;if(B.fog&&Q.seen==null)Q.seen=B.t;if(Q.temper===undefined){Q.temper=this.temperFor();this.announce(Q.temper)}
    // (a beaten enemy army falls back as one, rather than fighting to the last man; once begun it does not turn round)
    if(this.fallsBack(N0,S)){this.fallBack(N0);return N0}
    const post=Q.post=Q.commit?'attack':this.typePost(S)||posture(ck,S);// (once it has gone in after a lull, it stays in; a battle type's first; its posture by that name: tests stand in for it)
    // (a group withdrawing (your order, before Auto) is left to it, as captainFinish does: the AI never takes a withdrawal back)
    const N=Object.fromEntries(Object.entries(N0).map(([k,l])=>[k,l.filter(id=>B.groups[id].order!=='withdraw')]));
    // (a lull: nobody has landed a blow in a while, everyone holding out of reach: every group of ours goes in; not an army already
    // on its way in, which walks up on its own plan)
    if(B.t-Math.max(B.lastHit||0,Q.seen||0)>FOE_CMD.lull&&post!=='attack'&&!this.typeHolds(S)){Q.commit=true;for(const k of ['inf','arc','mag','cav'])for(const id of N[k]){const g=B.groups[id];if(grpUnits(id).length&&!abilityActive(g,'brace')){g.charge();g.setFlag('skirmish',false)}}return N0}// (a braced group stands: any order would end it)
    const c=this.read(Q,S,N,post);c.take=this.take(c);
    for(const id of N.inf)this.infantry(c,id);
    // (Rally: a group of ours wavering or breaking, its officers steady it; after the infantry's orders, so a wavering group still pulls back)
    for(const k of ['inf','arc','mag'])for(const id of N[k])this.rally(c,id);
    // archers, and mages apart (a step behind the infantry, their reach being short)
    for(const k of ['arc','mag'])for(const id of N[k])this.shooters(c,k,id);
    for(const id of N.cav)this.cavalry(c,id);
    for(const id of N.hero)this.hero(c,id);
    return N0}
  // (the enemy's own, EnemyCommander: its style told as the battle opens; a beaten army falling back as one; your hero its mark)
  announce(temper){}
  fallsBack(N0,S){return false}
  leadOf(foes){return foes.find(u=>u.leader)||null}
  // the withdrawal: the whole army off the field by its edge, as one (once begun it does not turn round)
  fallBack(N0){if(B.sides?.active){(B.fallBackTeams||(B.fallBackTeams=new Set())).add(this.team);battleEvent('fallback',{team:this.team});for(const id of Object.values(N0).flat())B.groups[id].withdraw();return}if(!B.fallBack){B.fallBack=true;log('The enemy falls back.','good');battleEvent('fallback',{team:this.team})}for(const id of Object.values(N0).flat())B.groups[id].withdraw()}
  // (attacking, it keeps attacking down to FOE_CMD.hold under attackAt: no flip on noise)
  posture(S){const ck=this.ck;
    // (bt: the battle's time, or, in the fog (battlefog.js), the time since this captain first saw the foe: Q.seen)
    const Q=this.Q,P_=Q.post,T=this.T,F=FOE_CMD,stall=tun(T,F,'stall'),bt=B.t-(Q.seen||0);
    if(S.shootFoe>S.shootMe+.15||S.ratio>=tun(T,F,'attackAt')-(P_==='attack'?F.hold:0))return 'attack';
    // (a river between the armies: a defence is worth more, at the crossings (TERRAIN_AI.riverDefend))
    const rv=this.ground()&&S.mine&&S.mine.length&&S.foes.length&&wadesDeep(centroid(S.mine),centroid(S.foes));
    if(S.ratio<(rv?tun(T,F,'defendAt')*this.gt('riverDefend'):tun(T,F,'defendAt'))&&S.shootMe>=S.shootFoe&&S.shootMe>.1)return bt<stall*2?'defend':'attack';
    return P_==='defend'&&bt<stall?'defend':S.shootMe>S.shootFoe+.1&&bt<stall?'defend':'attack';
  }
  /* the shooters' posture, each think, kept a while (hysteresis): aggressive while attacking, not outnumbered, out-ranging or
     out-shooting the other side, with little of theirs fast enough to run them down, quivers and nerve whole and no foe who fights
     hand to hand closing on them; else safe. why: what keeps it safe ('' when aggressive) */
  rangedMode(S,post,shots,engaged){
    const X=AI_TACTICS,Q=this.Q,T=this.T,P=Q.rmode||{mode:'safe',at:-99},was=P.mode==='aggressive',foes=S.foes,d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    const armed=shots.filter(u=>u.s.range&&!u.empty),theirs=foes.filter(e=>e.s.range&&!e.empty&&!e.rout),w=l=>l.reduce((a,u)=>a+wOf(u),0),rng=l=>l.reduce((a,u)=>a+u.s.range,0)/l.length;
    let why='';
    if(!armed.length)why='none';else if(post!=='attack')why='defend';else if(S.ratio<tun(T,FOE_CMD,'defendAt'))why='outnumbered';
    else{const Wm=w(armed),melee=foes.filter(e=>!(e.s.range&&!e.empty)&&!e.rout);
      const ammo=armed.filter(u=>isFinite(quiverOf(u.s))),rs=[...new Set(armed.map(u=>!B.noMorale&&resolveOf(u)).filter(r=>r&&!r.routed))];
      if(w(melee.filter(e=>e.s.charge||e.s.spd>=X.fast))>Wm*(was?tun(T,X,'fastOut'):tun(T,X,'fastIn')))why='cavalry';
      else if(ammo.length&&ammo.reduce((a,u)=>a+(u.ammo??quiverOf(u.s))/quiverOf(u.s),0)/ammo.length<X.ammo||rs.some(r=>r.mor<MORALE.waver))why='worn';
      else if(melee.some(e=>!engaged(e)&&armed.some(a=>d2(a,e)<Math.max(X.near,Math.min(CAPT.danger,e.s.spd*X.dangerT)))))why='closing';
      else if(theirs.length&&rng(armed)<rng(theirs)*(was?1:tun(T,X,'outRange'))&&Wm<w(theirs)*(was?1:tun(T,X,'outShoot')))why='outshot';}
    if(!why&&!was&&B.t-P.at<X.dwell)why='wait';// (safe a moment ago: a breath before leading again)
    const mode=why?'safe':'aggressive';return Q.rmode={mode,at:mode!==P.mode?B.t:P.at,why}}
  /* none of theirs in sight (hidden by woods, a rise or rock: terrain.js sight) and no blow struck for FOE_CMD.lull s: every group of
     ours goes looking, to where the foe was last seen (their middle), or, there already or never having seen them, toward their
     side of the field (a sized field: their deployment zone, setup.js fieldZone); groups spread FOE_CMD.screen×2 apart. With no terrain and no fog every foe is seen: this never runs.
     In the fog (battlefog.js) a captain that has never seen the foe goes looking after FOG.scout s, not a lull: its army advances
     as a line, each group keeping its place across the field, FOG.probe px ahead of the army's middle (shooters FOE_CMD.behind
     back), at a walk, till it sees them */
  /* Scout ahead (unitabilities.js, scout units only): a captain's scouts range ahead to find the foe, while some of the foe still
     fighting is unseen, and either it sees none of them or the fight is in its first UNIT_ABILITIES.scout.aiEarly s; with every foe
     in sight (no fog, no terrain hiding them) never */
  scout(N,S){const team=this.team;
    const X=UNIT_ABILITIES.scout;if(!(S.foes.length===0||B.t<X.aiEarly)||!B.units.some(u=>battleEnemy(team,u)&&fighting(u)&&!seenBy(team,u)))return;
    for(const id of Object.values(N).flat()){const g=B.groups[id];if(g&&!abilityWhyNot(g,'scout'))g.useAbility('scout')}}
  search(N){const team=this.team;
    const hid=B.units.filter(u=>battleEnemy(team,u)&&fighting(u));if(!hid.length)return;let x=0,y=0,c=0;for(const u of hid){const p=lastSeen(team,u);if(p){x+=p.x;y+=p.y;c++}}
    const Z=BFIELD&&fieldZone(1-team),far={x:Z?(Z.x0+Z.x1)/2:team?BW*.15:BW*.85,y:(fieldTop()+fieldBot())/2},ids=Object.values(N).flat().filter(id=>B.groups[id]&&B.groups[id].order!=='withdraw'&&grpUnits(id).length);
    if(B.fog&&!c){const C=ids.map(id=>B.groups[id].centre()),dir=team?-1:1,mx=C.reduce((a,p)=>a+p.x,0)/Math.max(1,C.length);
      ids.forEach((id,i)=>{const g=B.groups[id],back=g.role==='arc'||g.role==='mag'?FOE_CMD.behind:0;g.standAt(clamp(mx+dir*(FOG.probe-back),BW*.1,BW*.9),C[i].y)});return}
    ids.forEach((id,i)=>{const g=B.groups[id],C=g.centre();let at=c?{x:x/c,y:y/c}:far;if(Math.hypot(C.x-at.x,C.y-at.y)<FOE_CMD.moved*2)at=far;g.standAt(at.x,at.y+(i-(ids.length-1)/2)*FOE_CMD.screen*2)})}
  /* battle types (setup.js BTYPE; with none, null and false: every captain as ever). A bridge's holders defend while the river lies
     between the armies (TERRAIN_AI's river hold: their bank at the crossings, the bridge first), and wait there, no lull, idle
     shooters or search sending them over, till BTYPE.wait s pass with no blow struck; its takers always attack. An ambush's men
     lying in wait attack, going straight in for BTYPE.rush s (typeRush: their foot charges, their riders ride at once) */
  typePost(S){const team=this.team,bt=B.btype;if(!bt||!S.mine.length||!S.foes.length)return null;
    if(bt.kind==='ambush')return team===bt.hid?'attack':null;return team!==bt.def?'attack':this.typeHolds(S)?'defend':null}
  // (a bridge's holders waiting at it: the river between them and their fighters' middle (their shooters may stay back on their
  // bank, shooting over), or nobody of theirs in sight; and a blow struck within BTYPE.wait s)
  typeHolds(S){const team=this.team,bt=B.btype;if(!bt||bt.kind!=='bridge'||team!==bt.def||B.t-(B.lastHit||0)>=BTYPE.wait||!S.mine.length)return false;if(!S.foes.length)return true;
    const f=S.foes.filter(e=>!e.s.range&&!e.rout);return acrossRiver(centroid(S.mine),centroid(f.length?f:S.foes))}
  typeRush(){const team=this.team,bt=B.btype;return !!bt&&bt.kind==='ambush'&&team===bt.hid&&B.t<BTYPE.rush}
  /* a bridge's takers (BTYPE.take): while the river lies between, the army goes over as one, by the crossing least held (their
     strength within held px of its far mouth, then the way to it; looked at again every pick s till it crosses): Q.take {c,
     phase, t, ts, tc, pick, home, spot}. wait: its foot and riders hold where they were (home), back from the water, while its
     shooters shoot from their bank as ever, till they have had their volleys (FOE_CMD.volley × volleys s; waitMax s at most);
     stage: the foot and riders go to stage px back from the crossing's near mouth, spread along it (spread px apart), till the
     foot is there (near px; stageMax s at most); cross: the foot goes over to a place form px beyond the far mouth (the men stream
     over as a column and re-form there: terrain.js slotWay), the riders waiting; go: every group of foot over (share of its men)
     and formed there, or formMax s: the captain's orders as ever (its riders too). null: no taking (none, or over) */
  take(c){
    const bt=B.btype,Q=c.Q,X=BTYPE.take;if(!bt||bt.kind!=='bridge'||c.team===bt.def||!c.ground||!c.ground.crossings.length)return null;let P=Q.take;if(P&&P.phase==='go')return null;
    const mine=c.S.mine.filter(u=>!u.s.range),Cm=centroid(mine.length?mine:c.S.mine);if(!acrossRiver(Cm,c.M)){if(P)P.phase='go';return null}
    const dir=Math.sign(c.M.x-Cm.x)||1,pad=TERRAIN_AI.bank,ends=k=>({near:{x:(dir>0?k.x0:k.x1)-dir*pad,y:k.y},far:{x:(dir>0?k.x1:k.x0)+dir*pad,y:k.y}});
    if(!P||P.phase!=='cross'&&B.t>=P.pick){let best=null,bv=Infinity;
      for(const k of c.ground.crossings){const e=ends(k),held=c.foes.filter(f=>!f.rout&&c.d2(f,e.far)<X.held).reduce((a,f)=>a+wOf(f),0),v=held*1e4+wayLen(Cm,e.near);if(v<bv){bv=v;best=k}}
      if(!P)P=Q.take={c:best,phase:'wait',t:B.t,home:{}};P.c=best;P.pick=B.t+X.pick}
    const e=ends(P.c),foot=c.N.inf.filter(id=>grpUnits(id).some(u=>!u.rout)),ids=[...foot,...c.N.cav.filter(id=>grpUnits(id).some(u=>!u.rout))];P.spot={};
    ids.forEach((id,i)=>{const o=(i-(ids.length-1)/2)*X.spread,sh=grpShape(id),d=sh?sh.ranks*(FORMS[B.groups[id].form]||FORMS.line).gy:0,y=clamp(e.near.y+o,fieldTop(),fieldBot());
      if(!P.home[id])P.home[id]=B.groups[id].centre();P.spot[id]={wait:P.home[id],stage:{x:e.near.x-dir*(X.stage+d/2),y},form:{x:e.far.x+dir*(X.form+d/2),y:clamp(e.far.y+o,fieldTop(),fieldBot())}}});
    const at=(id,p,r)=>{const m=grpUnits(id).filter(u=>!u.rout);return !m.length||c.d2(centroid(m),p)<r},over=id=>{const m=grpUnits(id).filter(u=>!u.rout),r=B.terrain.ai.river;return !m.length||m.filter(u=>(u.x-r.x)*dir>0).length>=m.length*X.share};
    if(P.phase==='wait'&&(Q.vol>=tun(c.T,FOE_CMD,'volley')*X.volleys||!c.shots.some(u=>u.s.range)||B.t-P.t>X.waitMax)){P.phase='stage';P.ts=B.t}
    if(P.phase==='stage'&&(foot.every(id=>at(id,P.spot[id].stage,X.near))||B.t-P.ts>X.stageMax)){P.phase='cross';P.tc=B.t}
    if(P.phase==='cross'&&(foot.every(id=>over(id)&&at(id,P.spot[id].form,X.near*1.5))||B.t-P.tc>X.formMax)){P.phase='go';return null}
    return P}
  /* the captain's reading of the battle, once a think, shared by its arms (captainInf, captainShooters, captainCav, captainHero):
     the foe's middle (M), our arms' men, whether the lines have met (clash), the ranged duel (goIn), who threatens our shooters
     (threats), the shooters' posture (rangedMode) and the army's line (line, the captain's plan); it keeps the captain's idle and
     volley counts on the way */
  read(Q,S,N,post){const {team,ck}=this;
    const foes=S.foes,M=centroid(foes),d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    const lead=this.leadOf(foes);
    const gap=l=>Math.min(...l.map(u=>Math.min(...foes.map(o=>d2(o,u)))));
    // (is one of these men within R px of a foe by a way he can walk: on ground that blocks, a foe over a cliff's edge or past rock,
    // near as the crow flies, is far round (terrain.js nearLen; a straight line clear first, then up to 8 bounded searches), so the
    // lines have not met below a cliff and they go round by its ramp; else the straight gap)
    const BT=B.terrain,blk=!!BT&&!!BT.blocky,within=(l,R)=>{if(!blk)return gap(l)<R;const P=[];
      for(const u of l)for(const o of foes)if(d2(o,u)<R){if(lineClear(BT.route[routeWho(u.s)],u.x,u.y,o.x,o.y))return true;if(P.length<8)P.push([u,o])}
      return P.some(([u,o])=>nearLen(u,o,R,routeWho(u.s))<R)};
    const members=k=>N[k].flatMap(grpUnits).filter(u=>!u.rout),inf=members('inf'),arc=members('arc'),mag=members('mag'),cav=members('cav');
    const offset=(id,role)=>{const ids=N[role],i=ids.indexOf(id);return (i-(ids.length-1)/2)*Math.min(100,(fieldBot()-fieldTop()-80)/Math.max(1,ids.length))};
    const shots=[...arc,...mag];// (all their shooters: archers and mages, each group placed on its own below)
    const mine=S.mine,engaged=(e)=>mine.some(u=>d2(u,e)<18);// (an enemy already fighting one of ours)
    const clash=inf.length?within(inf,FOE_CMD.clash):true;
    /* the ranged duel: what each side's shooters put out (damage a second, those with shots left). Our fighters shot at (a share of
       them hit lately) by shooters who outdo ours (or we have none): standing there is losing, so they go for those shooters,
       attacking or defending alike (FOE_CMD.outgun) */
    const fire=l=>l.filter(u=>u.s.range&&!u.empty&&!u.rout).reduce((a,u)=>a+u.s.dmg/(u.s.cd||1),0),ourFire=fire(S.mine),theirFire=fire(foes);
    const melee=S.mine.filter(u=>!u.s.range&&!u.hero),hitNow=melee.filter(u=>B.t-(u.shotAt??-99)<CAPT.shotFor).length;
    const theirShots=foes.filter(u=>u.s.range&&!u.empty),goIn=!clash&&theirShots.length>0&&hitNow>=Math.max(1,melee.length*CAPT.shotShare)&&theirFire>ourFire*FOE_CMD.outgun,
      lost=blk&&!clash&&theirShots.length>0&&theirFire>ourFire*FOE_CMD.outgun;// (ground that blocks: the duel lost, hit lately or not (captainInf keeps a group gone in))
    const shooterNear=from=>theirShots.reduce((a,u)=>d2(u,from)<d2(a,from)?u:a);
    // (an army with shooters never sits out of reach: none of them able to reach anyone for FOE_CMD.patience seconds, it commits to
    // going up (the army's march below), defending or not)
    if(shots.some(a=>a.s.range)&&post!=='attack'&&!this.typeHolds(S)&&!shots.some(a=>a.s.range&&foes.some(e=>d2(a,e)<=a.s.range))){Q.idle=Q.idle+FOE_CMD.think;if(Q.idle>=FOE_CMD.patience)Q.commit=true}else Q.idle=0;
    // (how long our archers have had a foe in reach: the volleys before the infantry goes in)
    if(shots.some(a=>a.s.range&&!(B.groups[a.grp]&&B.groups[a.grp].hunt)&&foes.some(e=>d2(a,e)<=a.s.range)))Q.vol=Q.vol+FOE_CMD.think;// (hunting volleys not counted)
    // who threatens our archers: an enemy that fights hand to hand, close to them (the nearest to them first); never further than
    // their reach (a short one, a spider's spit): held still by a threat they cannot shoot, they would never close to shoot at all
    const A=shots.length?centroid(shots):null,threats=A?foes.filter(e=>!e.s.range&&shots.some(a=>d2(a,e)<Math.min(FOE_CMD.threat,a.s.range||FOE_CMD.threat))).sort((a,b)=>d2(a,A)-d2(b,A)):[];
    /* the army's line, attacking with shooters: each group of shooters where its own reach covers the foe's front (the shortest
       reach among its men), the infantry a screen just in front of the nearest of them, all opposite the foe's middle; planned
       once and kept (Q.plan) till the foe's front moves FOE_CMD.moved or FOE_CMD.replan seconds pass, so the army walks up as
       one, to one place, not a step at a time */
    // (its shooters' posture: aggressive, they lead; safe, behind the infantry: rangedMode)
    const X=AI_TACTICS,T=this.T,rm=this.rangedMode(S,post,shots,engaged),leads=rm.mode==='aggressive';
    const ours=[...inf,...shots];let line=null;
    // (a melee foe at its shooters: the march is off (no plan), and it plans afresh once they are safe)
    if(threats.length)Q.plan=null;
    if(post==='attack'&&shots.length&&ours.length&&!threats.length){const P0=Q.plan,O=centroid(ours),F=foes.reduce((a,u)=>d2(u,O)<d2(a,O)?u:a);
      if(!P0||d2(P0.F,F)>FOE_CMD.moved||B.t-P0.t>FOE_CMD.replan||!!P0.leads!==leads){const dir=Math.sign(F.x-O.x)||1,R=l=>Math.min(...l.filter(u=>u.s.range).map(u=>u.s.range))*FOE_CMD.reach,y=clamp(M.y,fieldTop(),fieldBot());
        const at={};if(arc.some(u=>u.s.range))at.arc=R(arc);if(mag.some(u=>u.s.range))at.mag=R(mag);const front=Math.min(...Object.values(at));
        // (its shooters leading (rangedMode): the infantry a screen AI_TACTICS.screenGap behind them, not in front)
        // (only ever forward: a foe nearer than their reach is in reach already; they stand where they are, behind their frontline,
        // and pulling back from danger is Kite's (kiteFrom), when nobody covers them)
        const fwd=(want,from)=>from&&(want-from.x)*dir<0?from.x:want,grpOf_={arc,mag};
        Q.plan={F:{x:F.x,y:F.y},t:B.t,dir,y,leads,x:Object.fromEntries(Object.entries(at).map(([k,r])=>[k,clamp(fwd(F.x-dir*r,grpOf_[k].length?centroid(grpOf_[k]):null),8,BW-8)])),inf:clamp(fwd(F.x-dir*(leads?front/FOE_CMD.reach+tun(T,X,'screenGap'):front-FOE_CMD.screen),inf.length?centroid(inf):null),8,BW-8)}}
      line=Q.plan}
    const aggr=leads&&!!line;
    // (on ground that blocks: how long its shooters have stood on the line with nobody in their reach (below a cliff, the foe set
    // back on its top: Q.lineT); its infantry waits for their volleys twice the volleys' time at most (captainInf), then goes up)
    if(blk&&line&&shots.length&&!shots.some(u=>u.spdNow>0||u.s.range&&foes.some(e=>d2(u,e)<=u.s.range)))Q.lineT=(Q.lineT||0)+FOE_CMD.think;
    // (a charge coming: riders or a big beast running in (momentum mom), within far px of one of these men and not behind them)
    const chargeOn=(m,far,mom)=>foes.some(e=>(e.s.charge||e.s.big)&&!e.rout&&momentum(e)>=mom&&m.some(u=>d2(u,e)<far&&(mom<=0||sideOf(u,e)!=='rear')));
    const footCharge=m=>{const I=centroid(m),e=foes.reduce((a,o)=>d2(o,I)<d2(a,I)?o:a);return !(e.s.charge||e.s.big)&&!chargeOn(m,CAPT.brace,.25)};
    // (unit-level morale, UNIT_AI: a group's own resolve (none: steady); a foe wavering is worth more to riders and shooters;
    // recovering: a group stepped back to get its breath, g.recover {at, x, y}, or {done} once ended by the time cap)
    const rOf=id=>!B.noMorale&&B.groups[id]&&B.groups[id].resolve||null,weak=e=>{const r=!B.noMorale&&resolveOf(e);return !!r&&!r.routed&&r.mor<MORALE.waver};
    const recovering=id=>{const r=B.groups[id].recover;return !!r&&r.done==null},firm=id=>{const r=rOf(id);return grpUnits(id).some(u=>!u.rout)&&!recovering(id)&&(!r||!r.routed&&r.mor>=UNIT_AI.backAt)};
    /* the ground (TERRAIN_AI; ground null: none, and every rule of it skipped): gt, a ground tunable by this captain's
       temperament; uphill, the foe nearest a group holds ground too far above it to charge; hold, a defence's place (Q.hold,
       chosen once a defence: a top, a wood (elves), or the crossings when a river lies between) and holdAt, a group's spot there
       (a top's or wood's forward edge, its front on it; the bank at a crossing), shootHold, its shooters' place behind them;
       stand, a group's place by the ground (round deep water by a crossing, its files narrowed to it, and never in deep water);
       send, an order at a foe across deep water goes by a crossing first; ride, riders' way (a crossing, round a wood); flankAt,
       a flank spot in the open; perch, shooters' spot on higher ground (keep: a test each spot must pass) */
    const GT=this.ground(),ground=GT&&GT.ai||null,gt=k=>this.gt(k);let uphill=null,hold=null,holdAt=null,shootHold=null,stand=null,send=null,ride=null,flankAt=null,perch=null;
    if(ground){const Cm=centroid(mine);
      // (the foe nearest these men holds ground TERRAIN_AI.uphill levels above them, and we are not strong enough to go up anyway)
      uphill=m=>{const I=centroid(m),e=foes.reduce((a,o)=>d2(o,I)<d2(a,I)?o:a);return levelAt(e.x,e.y)-lvlOf(m)>=gt('uphill')&&holdsGround(e)&&(S.ratio<tun(T,FOE_CMD,'attackAt')*gt('uphillOdds')||onSteep(e))};
      const river=GT.has.water&&ground.crossings.length>0&&(wadesDeep(Cm,M)||acrossRiver(Cm,M));// (a held bridge's: either bank)
      // (time enough to get there: our infantry and shooters walking (the slowest of each) before any foe who fights hand to hand
      // running there, with TERRAIN_AI.holdSafe s to spare: shooters on the move shoot nobody)
      // (phase 4: our ways there are measured round rock, cliffs and impassable water (terrain.js wayLen: a top whose ramp is on its
      // far side is far, one out of reach never chosen); theirs straight, the worst case)
      const walkT=p=>Math.max(...[inf,shots].filter(l=>l.length).map(l=>wayLen(centroid(l),p)/Math.max(1,Math.min(...l.map(u=>u.s.spd))*MARCH.walk))),
        runT=p=>Math.min(...foes.filter(e=>!e.s.range&&!e.rout).map(e=>d2(e,p)/Math.max(1,e.s.spd))),safe=p=>held||runT(p)>walkT(p)+gt('holdSafe'),held=this.typeHolds(S);// (a bridge's holders stand at it from the start: always safe)
      if(post!=='defend')delete Q.hold;
      else if(Q.hold===undefined){const half=Cm.x<BW/2?0:1,dir=Math.sign(M.x-Cm.x)||1,P0=A?{x:A.x+dir*40,y:A.y}:inf.length?centroid(inf):Cm,l0=levelAt(P0.x,P0.y),R=gt('holdR'),gain=gt('hillGain');
        // (a steep top's reach allows for the price of its own banks on the way, terrain.js STEEP.route: the climb is no reason to look elsewhere)
        const ok=p=>(p.half===half||Math.abs(p.x-BW/2)<BW*.1&&d2(p,Cm)<d2(p,M))&&wayLen(P0,p)<=R+(p.steep?STEEP.band*GT.cs*(STEEP.route.foot-1)*p.lvl:0)&&!foes.some(e=>d2(e,p)<TERRAIN_AI.held)&&safe(p);let best=null,bv=-1;
        // (a river between: our bank at the crossings near enough our line and safe to reach (cr), top to bottom)
        if(river){const L=ground.crossings.map(c=>({c,x:(dir>0?c.x0:c.x1)-dir*TERRAIN_AI.bank,y:c.y})).filter(p=>wayLen(P0,p)<=R&&safe(p)).sort((a,b)=>B.btype&&B.btype.kind==='bridge'&&(b.c.kind==='bridge')-(a.c.kind==='bridge')||a.y-b.y);
          Q.hold=L.length?{river:true,...centroid(L),cr:L.map(p=>p.c)}:false}
        else{for(const t of ground.tops){const v=t.lvl-l0+(t.steep?gt('steepHold'):0);if(v>=gain&&ok(t)&&(v>bv||v===bv&&wayLen(P0,t)<wayLen(P0,best))){best={x:t.x,y:t.y,lvl:t.lvl};bv=v}}
          const wv=gt('woodHold');if(wv>=gain)for(const w of ground.woods){const p={x:w.x,y:w.y,half:w.x<BW/2?0:1};if((wv>bv||wv===bv&&best.wood&&d2(p,P0)<d2(best,P0))&&ok(p)){best={x:w.x,y:w.y,wood:true};bv=wv}}
          const gv=gt('gladeHold');if(ground.dense&&gv>=gain)for(const q of ground.glades){const p={x:q.x,y:q.y,half:q.half};if((gv>bv||gv===bv&&best.glade&&d2(p,P0)<d2(best,P0))&&ok(p)){best={x:q.x,y:q.y,glade:true};bv=gv}}
          Q.hold=best||false}}
      // (on the way there, it is given up once a foe could be there first; there (the infantry on its spots), it is kept; a bank
      // held only while the river lies between)
      else if(Q.hold&&!Q.hold.at&&!safe(Q.hold))Q.hold=false;
      hold=post==='defend'&&inf.length&&Q.hold&&(!Q.hold.river||river)?Q.hold:null;
      if(hold)holdAt=id=>{const g=B.groups[id],sh=grpShape(id),depth=sh?sh.ranks*(FORMS[g.form]||FORMS.line).gy:0,cs=GT.cs;
        if(hold.river){const L=hold.cr,i=Math.max(0,N.inf.indexOf(id)),cr=L[i%L.length],k=Math.floor(i/L.length),dir=Math.sign(M.x-cr.x)||1;
          return{x:(dir>0?cr.x0:cr.x1)-dir*(TERRAIN_AI.bank+depth/2+k*(depth+20)),y:cr.y}}
        const dir=Math.sign(M.x-hold.x)||1,on=(x,y)=>hold.wood?groundAt(x,y)===TKIND.wood:hold.glade?groundAt(x,y)===TKIND.open:levelAt(x,y)>=hold.lvl;let yy=clamp(hold.y+offset(id,'inf'),fieldTop(),fieldBot());
        for(let i=0;i<30&&!on(hold.x,yy)&&Math.abs(yy-hold.y)>cs;i++)yy+=Math.sign(hold.y-yy)*cs;if(!on(hold.x,yy))yy=hold.y;
        let x=hold.x;for(let i=0;i<40&&on(x+dir*cs,yy);i++)x+=dir*cs;return{x:x-dir*Math.max(0,depth/2-cs/2),y:yy}};
      if(hold&&!hold.at){const P=N.inf.filter(i=>grpUnits(i).some(u=>!u.rout)).map(holdAt);if(P.length&&d2(centroid(inf),centroid(P))<FOE_CMD.flankAt)hold.at=true}
      // (its shooters' place: behind the infantry's places (FOE_CMD.behind, mages half), on the highest ground near (perch))
      if(hold)shootHold=(id,k)=>{const P=N.inf.filter(i=>grpUnits(i).some(u=>!u.rout)).map(holdAt);if(!P.length)return null;const H=centroid(P),dir=Math.sign(M.x-H.x)||1,b=k==='arc'?FOE_CMD.behind:FOE_CMD.behind*.5;
        return perch(H.x-dir*b,H.y+offset(id,k),-dir,false)};
      // (on the way over a crossing a group's files are narrowed to its width and it faces its way (Q.files[id]: {f, the files it
      // had; a, its way: captainFinish turns it so); given back once across)
      // (the way on: wayVia's, kept to the far end (W.far) till none of them stands in the water)
      const route=(g,m,C,to)=>{const F=FORMS[g.form]||FORMS.line,E=Q.files&&Q.files[g.id];let w=to&&wayVia(C,to);if(!w&&E&&E.far&&m.some(u=>wetK(groundAt(u.x,u.y))))w=E.far;
        if(w&&!F.wedge){const want=Math.max(2,Math.floor((w.box.y1-w.box.y0)/F.gx)),a=Math.hypot(w.x-C.x,w.y-C.y)>30?Math.atan2(w.y-C.y,w.x-C.x):w.s>0?0:Math.PI;Q.files=Q.files||{};
          const W=Q.files[g.id]=Q.files[g.id]||{f:g.files};W.a=a;if(w.on)W.far=w;if((g.files||F.files)>want)g.setForm(g.form,{files:want,face:a})}
        else if(E){delete Q.files[g.id];g.setForm(g.form,{files:E.f})}
        return w};
      stand=(g,x,y,m)=>{const C=centroid(m),w=route(g,m,C,{x,y}),p=w||dryOf({x,y},C);g.standAt(p.x,p.y)};
      send=(g,m,to,fn)=>{const w=route(g,m,centroid(m),to);if(w)g.standAt(w.x,w.y);else fn()};
      ride=(g,m,p)=>{const C=centroid(m),w=route(g,m,C,p);const q=w||wayRide(C,p)||woodAround(C,p,Math.max(...m.map(u=>Math.hypot(u.x-C.x,u.y-C.y))))||dryOf(p,C);g.standAt(q.x,q.y)};
      // (a flank spot open, and one they can ride to: terrain.js canReach)
      flankAt=(g,fy)=>{const s=g.flankSide,open=p=>{const k=groundAt(p.x,p.y);return k!==TKIND.wood&&k!==TKIND.marsh&&k!==TKIND.deep&&canReach(g.centre(),p,'mounted')},at=(sd,f)=>({x:clamp(M.x,8,BW-8),y:clamp(M.y+sd*fy*f,fieldTop(),fieldBot())});
        for(const [sd,f] of [[s,1],[s,1.4],[-s,1],[-s,1.4]].slice(0,Math.max(1,TERRAIN_AI.flankProbe))){const p=at(sd,f);if(open(p)){if(sd!==s)g.flankSide=sd;return p}}return at(s,1)};
      perch=(x,y,fwd,onLine,keep)=>{const R=gt('shooterHill'),F=TERRAIN_AI.shooterFwd,ws=gt('woodShoot'),cs=GT.cs,val=(px,py)=>{const k=groundAt(px,py);return k===TKIND.deep||k===TKIND.rock?-9:levelAt(px,py)+(k===TKIND.wood?ws:0)};
        const v0=val(x,y);let best=null,bs=-Infinity;
        for(let j=onLine?0:-Math.floor(R/cs);j<=(onLine?0:Math.floor(F/cs));j++)for(let i=-Math.floor(R/cs);i<=Math.floor(R/cs);i++){const dx=j*cs,dy=i*cs,r=Math.hypot(dx,dy);if(r>R+1)continue;
          const px=x+fwd*dx,py=y+dy;if(px<8||px>BW-8||py<fieldTop()||py>fieldBot())continue;const v=val(px,py),s=v-r/(R*8);if(v>=v0+TERRAIN_AI.hillGain&&s>bs&&(!keep||keep(px,py))&&(!GT.blocky||nearLen({x,y},{x:px,y:py},2*R+cs)<Infinity)){bs=s;best={x:px,y:py}}}// (phase 4: a spot walked to round cliffs and rock no further than twice its reach: terrain.js)
        return best||{x,y}}}
    return{team,ck,T,Q,S,N,post,foes,M,d2,lead,gap,within,inf,offset,shots,engaged,clash,goIn,lost,shooterNear,threats,A,line,aggr,chargeOn,footCharge,rOf,weak,recovering,firm,ground,gt,uphill,hold,holdAt,shootHold,stand,send,ride,flankAt,perch,rush:this.typeRush(),holding:!!hold&&!!hold.river&&this.typeHolds(S),take:null}}
  // infantry
  infantry(c,id){
    const {T,Q,N,post,foes,M,d2,gap,within,offset,shots,clash,goIn,shooterNear,threats,A,line,chargeOn,footCharge,rOf,recovering,firm,gt,uphill,holdAt,stand,send}=c,X=AI_TACTICS,volley0=tun(T,FOE_CMD,'volley');
    const inf=grpUnits(id).filter(u=>!u.rout);if(!inf.length)return;
    if(c.rush){const g=B.groups[id];if(g.order!=='charge')g.charge();return}// (an ambush sprung: straight in)
    // (a foe above them on the ground: longer volleys before they go up, TERRAIN_AI.upVolley)
    // (standing for them: no longer than twice their time where its shooters reach nobody from the line, Q.lineT (ground that blocks))
    const volley=uphill&&uphill(inf)?volley0*gt('upVolley'):volley0,wait=!!line&&Q.vol<volley&&!(Q.lineT>=volley*2);const g=B.groups[id],busy=inf.some(u=>foes.some(e=>d2(e,u)<20)),r=rOf(id);
    // (Brace: a charge coming at its front, a spear group braces; braced, it is given no order (any would end it) while one is near)
    if(abilityActive(g,'brace')){if(chargeOn(inf,X.braceKeep,0))return}
    else if(chargeOn(inf,tun(T,X,'braceAt'),X.braceMom)&&!abilityWhyNot(g,'brace')){g.useAbility('brace');return}
    // (recovering: it stands where it stepped back to, till its resolve is back to backAt or maxRecover s pass; then its orders as ever)
    if(recovering(id)){if(!r||r.mor>=UNIT_AI.backAt)delete g.recover;else if(B.t-g.recover.at>=UNIT_AI.maxRecover)g.recover={done:B.t};else{g.standAt(g.recover.x,g.recover.y);return}}
    // (wavering, a steady group of ours beside it: it steps back from the foe; the nearest steady one not in a fight of its own goes
    // at the foe nearest the gap, once, and keeps at him while it recovers (plug); not again within maxRecover s of a time-capped one)
    // (only one not in a fight hand to hand: an engaged one stepping back loses men and breaks as soon; it fights on, Rally its help)
    else if(r&&!r.routed&&r.mor<tun(T,UNIT_AI,'pullAt')&&!busy&&(!g.recover||B.t-g.recover.done>=UNIT_AI.maxRecover)&&N.inf.some(o=>o!==id&&firm(o))){
      const I=centroid(inf),x=clamp(I.x-(Math.sign(M.x-I.x)||1)*UNIT_AI.pullDist,8,BW-8),y=clamp(I.y,fieldTop(),fieldBot());g.recover={at:B.t,x,y};g.plug=null;g.standAt(x,y);
      const free=N.inf.filter(o=>o!==id&&firm(o)&&!abilityActive(B.groups[o],'brace')&&!grpUnits(o).some(u=>!u.rout&&foes.some(e=>d2(e,u)<20))).sort((a,b)=>d2(B.groups[a].centre(),I)-d2(B.groups[b].centre(),I));
      if(free.length){const q=B.groups[free[0]];q.attack(foes.reduce((a,e)=>d2(e,I)<d2(a,I)?e:a));q.plug=id}
      return}
    // (holding a bridge (typeHolds): on its bank at the crossing, fighting whoever comes over; never after anyone over the water. While
    // none of theirs who fight hand to hand is within BTYPE.alert px of it, back from the water by BTYPE.back, out of their arrows)
    if(c.holding){const h=c.holdAt(id),dir=Math.sign(M.x-h.x)||1,near=foes.some(e=>!e.s.range&&!e.rout&&d2(e,h)<BTYPE.alert);c.stand(g,near?h.x:h.x-dir*BTYPE.back,h.y,inf);return}
    if(g.plug){if(recovering(g.plug)&&g.hasTarget&&g.targetMembers().some(u=>!u.rout))return;g.plug=null}
    // (a threat to our shooters worth the infantry: strong enough that they cannot see to it themselves, or with nowhere to back
    // to; a lone man is theirs to shoot, kite or fight. Their shooters bare (none of theirs who fight hand to hand near them, and
    // nearer us than their fighters): the infantry goes for them; else at the nearest of theirs)
    const pow=l=>l.reduce((a,u)=>a+u.hp*(u.s.dmg||1),0);
    const I0=centroid(inf),theirMelee=foes.filter(e=>!e.s.range&&!e.rout),bare=foes.filter(e=>e.s.range&&!e.rout&&!theirMelee.some(f=>d2(f,e)<CAPT.bare)),nearMelee=theirMelee.length?Math.min(...theirMelee.map(e=>d2(e,I0))):1e9;
    const prey=bare.length?bare.reduce((a,e)=>d2(e,I0)<d2(a,I0)?e:a):null,preyOk=!!prey&&d2(prey,I0)<CAPT.prey;
    // (with an opening, a threat to our shooters is theirs to see to (shoot, kite, fight) unless they are cornered; without one, worth
    // the infantry only if strong enough that they cannot)
    const realThreat=threats.length&&(shots.some(u=>B.groups[u.grp]&&B.groups[u.grp].cornered)||!preyOk&&pow(threats)>pow(shots)*CAPT.threatShare);
    // (on the ground: an order at a foe over deep water goes by a crossing first (send); a place, round it and never in it (stand))
    const go=(to,fn)=>send&&!busy?send(g,inf,to,fn):fn(),nearest=()=>foes.reduce((a,e)=>d2(e,I0)<d2(a,I0)?e:a);
    if(realThreat&&!busy)go(threats[0],()=>g.attack(threats[0]));
    // (taking a bridge: waiting at the crossing's near mouth, then over it to form up beyond (typeTake))
    else if(c.take&&c.take.spot[id]){const p=c.take.spot[id][c.take.phase==='cross'?'form':c.take.phase];g.standAt(p.x,p.y)}
    else if(goIn&&!busy){const e=shooterNear(I0);go(e,()=>g.attack(e))}// (losing the ranged duel: at their shooters)
    // (gone in at their shooters on ground that blocks: kept at them while the duel is lost, not called back to the line whenever
    // their volleys pause, round a cliff and back again)
    else if(c.lost&&!busy&&g.order==='charge'&&g.hasTarget&&g.targetMembers().some(e=>e.s.range&&!e.empty&&!e.rout)){}
    else if(preyOk&&!busy&&(post==='attack'||clash))go(prey,()=>g.attack(prey));// (their shooters bare: at them)
    // (attacking and fresh, it charges from further off (AI_TACTICS.footFar), to come in at a full run; not while it stands for the
    // volleys, nor at riders or a beast (the nearest foe), nor with a charge coming at it (a shield wall's moment: captainFinish),
    // nor up at a foe on higher ground (uphill: they advance at a walk instead, and go in once the lines meet))
    else if(clash||post==='attack'&&!threats.length&&inf.every(u=>u.s.range)||post==='attack'&&!wait&&grpSta(inf)>=X.fresh&&within(inf,tun(T,X,'footFar'))&&footCharge(inf)&&!(uphill&&uphill(inf)))go(send&&nearest(),()=>g.charge());
    // (attacking with archers: the infantry stands a little in front of them while they shoot (FOE_CMD.volley seconds of it), then
    // goes in; while they lead (rangedMode), a little behind them: the army's line)
    else if(wait){if(stand)stand(g,line.inf,line.y+offset(id,'inf'),inf);else g.standAt(line.inf,line.y+offset(id,'inf'))}
    else if(post==='attack')go(send&&nearest(),()=>g.advance());
    else{// defend: a line between the archers and the enemy; on the ground, its front on a top's crest (or an elf wood's edge), or
      // on its bank at the crossings with a river between (holdAt)
      const I=A||centroid(inf),dir=Math.sign(M.x-I.x)||1,h=holdAt&&holdAt(id);
      if(h)stand(g,h.x,h.y,inf);else if(stand)stand(g,I.x+dir*(A?40:0),(A?A.y:I.y)+offset(id,'inf'),inf);else g.standAt(I.x+dir*(A?40:0),(A?A.y:I.y)+offset(id,'inf'))}}
  rally(c,id){const r=c.rOf(id);if(r&&!r.routed&&r.mor<MORALE.waver&&!abilityWhyNot(B.groups[id],'rally'))B.groups[id].useAbility('rally')}
  // archers, and mages apart (a step behind the infantry, their reach being short)
  shooters(c,k,id){
    const {T,S,N,foes,M,d2,lead,inf,offset,engaged,threats,line,aggr,weak,stand,perch,shootHold}=c,X=AI_TACTICS;
    const grp=grpUnits(id).filter(u=>!u.rout);if(!grp.length)return;const behind=k==='arc'?FOE_CMD.behind:FOE_CMD.behind*.5,g=B.groups[id],armed=grp.filter(u=>u.s.range);
    if(!armed.length){g.charge();g.setFlag('skirmish',false);g.screenBack=null;g.pushRun=false}// (out of ammo: they go in)
    else{      // (Kite: a foe coming at them uncovered: they skirmish (and no focus: keeping away comes first); melee mode on, its call)
      const open=kiteFrom(armed,foes,S.mine.filter(u=>!u.s.range));g.setFlag('skirmish',!!open);const C=centroid(armed),near=a=>foes.reduce((p,e)=>d2(e,a)<d2(p,a)?e:p);g.setFlag('melee',armed.some(a=>foes.some(e=>!e.s.range&&!e.rout&&d2(a,e)<CAPT.toBlades))&&(!open||g.cornered||foes.some(e=>!e.s.range&&e.s.spd>g.pace*SKIRM.outpaced&&d2(e,C)<CAPT.toBlades*2)));/* (melee mode: a foe on them they cannot kite from) */
      // (attacking: on the army's line, where their own reach covers the foe; defending: behind their infantry, waiting for you)
      // (attacking: their place on the army's line; on the way, never ahead of their infantry: they keep behind it till it is there)
      // (threatened, or with no infantry left to stand behind: they stop where they are (held there till it passes) and shoot; the
      // skirmishers among them step back from whoever comes at them)
      // the foe worth shooting: fighting our men, then their shooters, then a character (their leader, your hero) (score)
      // (the foe worth it, in order: one who fights hand to hand coming at them (the nearer the more), one they can finish (a shot
      // from falling, or badly hurt), one fighting our men, their shooters, a character; and the nearer the better)
      // (fall back: a group that led the army (pushed: rangedMode), its captain safe again and it still ahead of its infantry: back
      // behind it at a run (screenBack), no focus or hunt on the way; Kite first)
      g.pushRun=false;const I0=inf.length?centroid(inf):null,fd=I0?Math.sign(M.x-I0.x)||1:1;
      if(!I0||aggr||(C.x-I0.x)*fd<=-behind*.6){g.screenBack=null;if(!aggr)g.pushed=false}
      else if(g.pushed&&((C.x-I0.x)*fd>0||g.screenBack))g.screenBack={x:I0.x-fd*behind,y:I0.y+offset(id,k)};
      const coming=e=>!e.s.range&&!e.rout&&d2(e,C)<CAPT.danger?5*(1-d2(e,C)/CAPT.danger):0;
      const inR=foes.filter(e=>armed.some(a=>d2(e,a)<=a.s.range)),score=e=>coming(e)+(blowsToFell(armed[0],e)<=1?4:0)+2*(1-e.hp/e.max)+(engaged(e)?3:0)+(e.s.range?1.5:0)+(e===lead||e.hero||e.leader||e.comp?1:0)+(weak(e)?tun(T,UNIT_AI,'preyShot'):0)-d2(e,C)/Math.max(...armed.map(a=>a.s.range));// (nearness: by their reach)
      const best=inR.length?inR.reduce((a,e)=>score(e)>score(a)?e:a):null,worth=best&&score(best)>=.5?best:null;
      // focus fire: one worth it that half of them can reach already, and nobody at them: the group is set on him, as your
      // right-click sets yours (those out of reach close to their own range of him); dropped when he falls, or danger comes
      // (Hunt: out of anyone's reach, the armies apart, ammunition left: off to a safe spot of their own to shoot from; home at a run
      // the moment it is not safe, their mark is gone or out of reach, the ammunition runs low, or the armies close; Kite first)
      const R0=Math.min(...armed.map(a=>a.s.range)),meleeF=foes.filter(e=>!e.s.range),meleeM=S.mine.filter(u=>!u.s.range),closing=meleeM.length&&meleeF.length&&Math.min(...meleeM.map(u=>Math.min(...meleeF.map(e=>d2(u,e)))))<HUNT.clash;
      const ammoOk=armed.every(u=>u.ammo==null||!isFinite(quiverOf(u.s))||u.ammo>quiverOf(u.s)*HUNT.ammo),reachNone=!armed.some(a=>foes.some(e=>d2(a,e)<=a.s.range));
      // (on the ground: a hunt's spot moved to higher ground near it (perch), still in reach of their mark (from its height) and safe)
      const hill=H=>{const p=perch(H.x,H.y,Math.sign(H.tx-H.x)||1,false,(x,y)=>Math.hypot(H.tx-x,H.ty-y)<=R0*(1+HILL.range*levelAt(x,y))*HUNT.spot&&huntSafe({x,y},foes,engaged,R0,T));H.x=p.x;H.y=p.y};
      // (a hunt that has someone in reach has done its work: they stand where they are and shoot, no walking on, no run home)
      if(g.hunt&&!reachNone){g.hunt=null;g.stand={x:C.x,y:C.y}}
      if(g.hunt){const H=g.hunt;if(open||closing||g.backing||g.screenBack||!ammoOk||H.t.hp<=0||H.t.rout||!huntSafe({x:H.x,y:H.y},foes,engaged,R0,T)||!huntSafe(C,foes,engaged,R0,T)){g.hunt=null;g.huntBack=B.t||.001}
        else if(d2(H.t,{x:H.tx,y:H.ty})>30){const h=huntSpot(armed,[H.t],()=>false,T);if(h&&huntSafe({x:h.x,y:h.y},foes,engaged,R0,T)){Object.assign(H,{x:h.x,y:h.y,tx:H.t.x,ty:H.t.y});if(perch)hill(H)}else{g.hunt=null;g.huntBack=B.t||.001}}}// (huntBack: when it turned home, never 0)
      // (holding ground (c.hold): their place behind the infantry's on it (shootHold); away from it, they go there first, before
      // any focus or hunt, and hunt none while the army holds)
      const home=shootHold&&shootHold(id,k),goHome=!!home&&!open&&!threats.length&&!g.backing&&d2(C,home)>FOE_CMD.moved;
      if(home&&g.hunt){g.hunt=null;g.huntBack=0}
      else if(!open&&!closing&&!threats.length&&!g.backing&&!g.screenBack&&reachNone&&ammoOk&&!home){g.hunt=huntSpot(armed,foes,engaged,T);if(g.hunt&&perch)hill(g.hunt)}
      if(g.huntBack&&B.t-g.huntBack>HUNT.home&&d2(C,{x:g.ax,y:g.ay})<30)g.huntBack=0;// (home: at a run, HUNT.home s at least, till back in its place)
      const focus=!g.hunt&&!g.huntBack&&!goHome&&worth&&!open&&!threats.length&&!g.backing&&!g.screenBack&&armed.filter(a=>d2(a,worth)<=a.s.range).length*2>=armed.length;
      if(g.hunt){if(g.order==='charge')g.toHold();g.stand=null;g.standAt(g.hunt.x,g.hunt.y);// (leading: out to it at a run, ahead of their infantry)
        if(aggr){if(I0&&(g.hunt.x-I0.x)*fd>0)g.pushed=true;g.pushRun=d2(C,g.hunt)>X.pushRun&&grpSta(armed)>=FATIGUE.tired}}
      else if(goHome){if(g.order==='charge')g.toHold();g.stand=null;stand(g,home.x,home.y,armed);if(!armed.some(u=>relocating(u,g)))moveOrder(id)}// (a move: shooters with a foe in reach would stand)
      else if(focus){if(!g.hasTarget||(worth.grp?g.targetGroupId!==worth.grp:g.targetUnitId!==worth.id))g.attack(worth)}
      else{if(g.order==='charge')g.toHold();
      // (stop to shoot: on its way, a foe in its shooters' reach: it stops where it is, they turn to him and shoot; no walking on
      // while they could be shooting)
      const halt=!g.hunt&&armed.some(u=>relocating(u,g)||g.going)&&armed.some(a=>foes.some(e=>d2(a,e)<=a.s.range*CAPT.haltAt));
      if(g.backing){g.stand={x:g.ax,y:g.ay}}// (backing off from a foe: the group's own (battlecontrol.js step); left to it)
      else if(g.screenBack){g.stand=null;g.standAt(g.screenBack.x,g.screenBack.y)}
      // (someone in their reach: they stay where they are, turn to him and shoot; only Kite moves them then)
      else if(threats.length||halt||!reachNone||!inf.length&&!line){if(!g.stand)g.stand={x:C.x,y:C.y};g.standAt(g.stand.x,g.stand.y)}
      else{g.stand=null;
      if(line&&line.x[k]!=null){let x=line.x[k];if((x-C.x)*line.dir<0)x=C.x;// (forward only, from where they are now)
        // (there, and still nobody in anyone's reach (the line's height or their ranks put them a little out: a short reach, a
        // spider's spit): the line steps on by what they lack, and stays that much nearer)
        if(reachNone&&Math.abs(C.x-x)<8){const short=Math.min(...armed.map(a=>Math.min(...foes.map(e=>d2(a,e)))-a.s.range));if(short>0){x+=line.dir*(short+4);line.x[k]=x}}
        // (leading (rangedMode aggressive): straight to it, ahead of their infantry, at a run from far (pushRun); else never ahead of it)
        if(aggr){if(I0&&(x-I0.x)*line.dir>0)g.pushed=true;g.pushRun=Math.abs(x-C.x)>X.pushRun&&grpSta(armed)>=FATIGUE.tired}
        else if(inf.length&&N.inf.some(id=>B.groups[id].order==='hold')){const I=centroid(inf);if(Math.abs(I.x-line.inf)>40){const cap=I.x-line.dir*behind;x=line.dir>0?Math.min(x,cap):Math.max(x,cap)}}
        // (on the ground: the highest spot along the line within TERRAIN_AI.shooterHill (perch); behind the infantry, the highest
        // within it not ahead of them; out of woods (an elf's: under the trees), never in deep water)
        if(perch){const p=perch(x,line.y+offset(id,k),line.dir,true);stand(g,p.x,p.y,armed)}else g.standAt(x,line.y+offset(id,k))}
      else if(inf.length){const I=centroid(inf),dir=Math.sign(I.x-M.x)||1;if(perch){const p=perch(I.x+dir*behind,I.y+offset(id,k),-dir,false);stand(g,p.x,p.y,armed)}else g.standAt(I.x+dir*behind,I.y+offset(id,k))}}
      // (without a focus order, actors.js shooterTarget selects the nearest eligible foe by range and arc)
      }
      // (Fire arrows: their mark (their focus, else the nearest in reach) armoured or weak to fire: fireWorth)
      const mk=focus?worth:g.tgt||(inR.length?inR.reduce((p,e)=>d2(e,C)<d2(p,C)?e:p):null);if(mk&&fireWorth(armed[0],mk)&&!abilityWhyNot(g,'fire'))g.useAbility('fire')}}
  // cavalry
  // (fresh riders (AI_TACTICS.fresh) charge from further off (cavStart: not only once on top of the foe) and pull back further to
  // charge again (regroupFar); tired ones stand off after a charge till rested (rested, restMax), and walk (runFor, captainFinish))
  cavalry(c,id){
    const {team,T,S,foes,M,d2,lead,within,engaged,goIn,shooterNear,threats,rOf,weak,ground,gt,stand,send,ride,flankAt}=c,X=AI_TACTICS;
    const cav=grpUnits(id).filter(u=>!u.rout);if(!cav.length)return;const g=B.groups[id],C=centroid(cav),was=g.phase;g.t=(g.t||0)+FOE_CMD.think;g.phase=g.phase||'flank';if(g.ridePlan&&(!PHYSICS.on||c.take||c.holding||c.rush))delete g.ridePlan;
    if(c.rush&&g.phase==='flank'){g.phase='charge';g.t=0;g.chargeAt=B.t}// (an ambush sprung: they ride at once)
    // (holding a bridge: they wait behind the line on its bank, and ride at whoever of theirs comes over, the nearest first)
    if(c.holding){const over=foes.filter(e=>!acrossRiver(e,C)&&!e.rout);if(!over.length){g.phase='flank';g.t=0;const H=c.holdAt(c.N.inf[0]||id),dir=Math.sign(c.M.x-H.x)||1;c.stand(g,H.x-dir*BTYPE.behind*2.4,H.y+(g.flankSide||1)*BTYPE.flank,cav);return}
      g.phase='charge';const e=over.reduce((a,o)=>c.d2(o,C)<c.d2(a,C)?o:a);if(g.tgt!==e&&!(g.tgt&&g.tgt.hp>0&&over.includes(g.tgt)))g.attack(e);return}
    if(PHYSICS.on&&!c.take&&!c.rush&&cav.every(u=>u.s.mounted&&!u.s.range)&&CavalryRide.step(c,g,cav))return;
    const st=grpSta(cav),fresh=st>=X.fresh,back=fresh?tun(T,X,'regroupFar'):FOE_CMD.regroup;
    // (on the ground: a mark in woods, marsh or water worth TERRAIN_AI.woodsCav less, one higher upCav less a level, one lower downCav more)
    const pick=()=>{const sc0=e=>(e.s.range?3:0)+(engaged(e)?2:0)+(foes.some(o=>o!==e&&d2(o,e)<30)?0:1)+(unitClass(e.s)==='spear'?-3:0)+(e===lead?.5:0)+(weak(e)?tun(T,UNIT_AI,'prey'):0)-d2(e,C)/300;
      const lv=ground?lvlOf(cav):0,sc=ground?e=>{const k=groundAt(e.x,e.y),dl=levelAt(e.x,e.y)-lv;return sc0(e)-(k===TKIND.wood||k===TKIND.marsh||k===TKIND.deep?gt('woodsCav'):0)-(dl>0?dl*gt('upCav'):0)+(dl<0?gt('downCav'):0)}:sc0;
      return foes.reduce((a,e)=>sc(e)>sc(a)?e:a)};
    // (on the ground: an attack over deep water goes by a crossing first, a place never in it (send, stand); riders on the flank wait
    // for a mark not above them (uphill, not fighting ours), flankMax×upWait s at most, unless strong enough to go up anyway)
    // (a dense field: a charge whose straight way runs through the woods rides first for the roads, paths or clearings' chains when
    // that is quicker (terrain.js wayRide) and goes in from there; one within TERRAIN_AI.wayCharge px of its mark goes straight)
    const att=e=>{const w=ground&&ground.dense&&d2(e,C)>TERRAIN_AI.wayCharge?wayRide(C,e):null;if(w){g.standAt(w.x,w.y);return}send?send(g,cav,e,()=>g.attack(e)):g.attack(e)},sa=(x,y)=>stand?stand(g,x,y,cav):g.standAt(x,y);
    const wait=()=>{if(!ground)return false;const e=pick();return levelAt(e.x,e.y)-lvlOf(cav)>=gt('uphill')&&holdsGround(e)&&!engaged(e)&&g.t<FOE_CMD.flankMax*gt('upWait')&&(S.ratio<tun(T,FOE_CMD,'attackAt')*gt('uphillOdds')||onSteep(e))};
    // (shaken (under UNIT_AI.chargeAt): no new charge; they stand off as after one (regroup) till their resolve is back, or cavRecover s
    // (losses lower the ceiling it recovers to: worn riders would stand off for ever); one under way goes on)
    const r=rOf(id),into=()=>{if(!r||r.mor>=tun(T,UNIT_AI,'chargeAt')||g.phase==='charge'||g.phase==='regroup'&&g.t>=tun(T,UNIT_AI,'cavRecover'))return true;if(g.phase!=='regroup'){const dir=Math.sign(C.x-M.x)||1;g.phase='regroup';g.t=0;sa(C.x+dir*back,C.y)}return false};
    // (on a charge, any (a rescue of its shooters too): half of them in the melee for recharge s, they pull back to charge again;
    // the count kept only while charging, so one left from before never pulls them back at once)
    if(g.phase==='charge'){g.inMelee=cav.filter(u=>foes.some(e=>d2(e,u)<16)).length*2>=cav.length?(g.inMelee||0)+FOE_CMD.think:0;
      if(g.inMelee>=FOE_CMD.recharge){const dir=Math.sign(C.x-M.x)||1;g.phase='regroup';g.t=0;sa(C.x+dir*back,C.y)}}
    if(g.phase!=='charge'&&g.inMelee)g.inMelee=0;
    // (taking a bridge: they wait at the crossing's near mouth till the foot is over and formed (typeTake))
    if(c.take&&c.take.spot[id]&&!threats.length){g.phase='flank';g.t=0;const p=c.take.spot[id][c.take.phase==='wait'?'wait':'stage'];g.standAt(p.x,p.y);return}
    if(threats.length&&g.phase!=='regroup'&&into()){g.phase='charge';att(threats[0])}
    else if(goIn&&g.phase!=='regroup'&&into()){g.phase='charge';g.t=0;att(!g.tgt||g.tgt.hp<=0||!g.tgt.s.range?shooterNear(C):g.tgt)}// (losing the ranged duel: ride down their shooters)
    // (its flank chosen once, on setting out (flankSide): the side the riders are on, level with the foe the open side; kept till the phase changes)
    // (on the ground: the first flank spot in the open (flankAt: the other side if need be), ridden to round woods and by a crossing)
    else if(g.phase==='flank'){if(g.flankSide==null)g.flankSide=Math.abs(C.y-M.y)>20?Math.sign(C.y-M.y):M.y<BH/2?1:-1;let aim=null;
      if(ride){aim=flankAt(g,tun(T,FOE_CMD,'flankY'));ride(g,cav,aim)}else g.standAt(M.x,M.y+g.flankSide*tun(T,FOE_CMD,'flankY'));
      if((d2(C,aim||{x:g.ax,y:g.ay})<FOE_CMD.flankAt||g.t>FOE_CMD.flankMax||within(cav,fresh?tun(T,X,'cavStart'):30))&&!wait()&&into()){g.phase='charge';g.t=0;att(pick())}}
    else if(g.phase==='charge')att(!g.tgt||g.tgt.hp<=0||g.tgt.rout?pick():g.tgt);
    else if(g.phase==='regroup'){g.rest=g.t<tun(T,X,'restMax')&&st<tun(T,X,'rested')&&(g.rest||st<FATIGUE.tired);if(!g.rest&&(d2(C,{x:g.ax,y:g.ay})<25||g.t>4)&&into()){g.phase='charge';g.t=0;att(pick())}}
    if(g.phase!=='flank'&&g.flankSide!=null)delete g.flankSide;// (off the flank: a fresh choice next time)
    // (Spur: a fresh charge (spurWin s since it was ordered) on a mark spur[0]-spur[1] px off, with breath for it: full momentum at once)
    if(g.phase==='charge'&&was!=='charge'){g.chargeAt=B.t;sfxAt('gallop',C.x,C.y)}// (the hooves heard: audio.js)
    if(g.phase==='charge'&&B.t-(g.chargeAt??-99)<=X.spurWin&&st>=X.spurSta){const p=sightGoal(g,team)||g.targetPoint(),d=p?d2(p,C):1e9;if(d>=X.spur[0]&&d<=X.spur[1]&&!abilityWhyNot(g,'spur'))g.useAbility('spur')}}
  // your hero, under the AI
  hero(c,id){const {M,inf,clash}=c,g=B.groups[id];if(!grpUnits(id).some(u=>!u.rout))return;
    if(c.holding&&inf.length){const I=centroid(inf),dir=Math.sign(I.x-M.x)||1;c.stand(g,I.x+dir*FOE_CMD.behind*.5,I.y,grpUnits(id));return}// (holding a bridge: behind its holders)
    if(clash||!inf.length){if(g.order!=='charge')g.charge()}else{const I=centroid(inf),dir=Math.sign(I.x-M.x)||1;g.standAt(I.x+dir*FOE_CMD.behind*.5,I.y)}}
  /* a captain gives its orders through the same tools you use. Its pace: a charge (and a cavalry's ride round a flank) at a run,
     else at a walk. A new place well away (CAPT.move): a move, its men break off and go (battlecontrol.js moveOrder). Its formation for
     the moment: a wedge for a cavalry charge, a shield wall for shielded infantry holding under the other side's arrows, loose
     order for archers under them, else a line; its front toward the other army. */
  // (ck: the captain's memory, for its temperament; the team's own by default)
  finish(N){const {team,ck}=this;
    const S=this.assess(),foes=S.foes;if(!foes.length)return;const M=centroid(foes),T=this.T;
    for(const k of ['inf','arc','mag','cav','hero'])for(const id of N[k]){const g=B.groups[id],m=grpUnits(id);if(!g||!m.length||g.order==='withdraw')continue;
      // (a charge at a walk till near its foe, then at a run: it comes in with breath left for the impact, from further off the
      // fresher it is (runFor), at a walk once spent; riders gallop round a flank unless tired; leading shooters run to their
      // place and back behind their infantry: rangedMode)
      const tg=sightGoal(g,team)||g.targetPoint(),Cm=centroid(m),st=grpSta(m);let near=tg?Math.hypot(tg.x-Cm.x,tg.y-Cm.y):Math.min(...foes.map(e=>Math.hypot(e.x-Cm.x,e.y-Cm.y)));
      const shot=m.filter(u=>B.t-(u.shotAt??-99)<CAPT.shotFor).length>=Math.max(1,m.length*CAPT.shotShare);
      // (on ground that blocks, infantry charging a foe its straight way to whom is not clear (over a cliff's edge: round by the
      // ramp) is not going up yet (no walk for the climb, up below): it runs by the way's length (nearLen), and from any way off
      // while shot at and not tired (a walk round to a ramp under the foe's arrows loses the attack before it gets there))
      const BT=B.terrain,P=k==='inf'&&g.order==='charge'&&BT&&BT.blocky?tg||foes.reduce((a,e)=>Math.hypot(e.x-Cm.x,e.y-Cm.y)<Math.hypot(a.x-Cm.x,a.y-Cm.y)?e:a):null;
      const round=!!P&&!lineClear(BT.route[groupWho(m)],Cm.x,Cm.y,P.x,P.y,255,ROUTE_UNIT.r);if(round)near=shot&&st>=FATIGUE.tired?0:nearLen(Cm,P,runFor(k,st,T),groupWho(m));
      // (on the ground: infantry charging a foe TERRAIN_AI.uphill levels above them walks up, running only the last upRun px, unless
      // strong enough to go up anyway)
      const up=!round&&k==='inf'&&g.order==='charge'&&!!this.ground()&&(()=>{const p=tg||foes.reduce((a,e)=>Math.hypot(e.x-Cm.x,e.y-Cm.y)<Math.hypot(a.x-Cm.x,a.y-Cm.y)?e:a);return levelAt(p.x,p.y)-lvlOf(m)>=this.gt('uphill')&&holdsGround(tg?{grp:g.targetGroupId}:p)&&(S.ratio<tun(T,FOE_CMD,'attackAt')*this.gt('uphillOdds')||onSteep(p))})();
      g.setRun(g.backing||!!g.huntBack||!!g.screenBack||!!g.pushRun||!g.hunt&&g.order==='charge'&&near<(up?Math.min(TERRAIN_AI.upRun,runFor(k,st,T)):runFor(k,st,T))||k==='cav'&&g.order==='hold'&&(g.phase==='flank'||g.ridePlan?.phase==='exit')&&!g.rest&&st>=(g.ridePlan?.chased?FATIGUE.spent:FATIGUE.tired));
      if(k==='hero')continue;
      // (whether a new place is a move, its men breaking off to go: battlecontrol.js standAt)
      // (what the moment calls for: shot at, a shield wall (infantry) or loose order (shooters); a charge coming, they brace in a
      // shield wall; on the march or charging, a line; a wall or loose order kept a while once taken, then dropped when it passes)
      const C0=centroid(m),marching=Math.hypot(C0.x-g.ax,C0.y-g.ay)>(g.shieldWall?40:25);
      const far=tun(T,CAPT,'brace'),brace=foes.some(e=>{const d=Math.hypot(e.x-C0.x,e.y-C0.y);return e.s.charge&&(e.run||0)>CHARGE.run*.25&&d<far||e.s.big&&d<far/2});
      const held=(g.shieldWall||g.form==='loose')&&g.formAt!=null&&B.t-g.formAt<CAPT.keep;// (taken by the captain: one with no time of its own is not held)
      const wall=k==='inf'&&g.order!=='charge'&&!marching&&(shot||brace||held&&g.shieldWall)&&m.some(shieldEligible);
      if(wall&&!g.shieldWall)g.formAt=B.t;g.setFlag('shieldWall',wall);
      const f=k==='cav'&&g.order==='charge'&&formFits(id,'wedge')?'wedge':(k==='arc'||k==='mag')&&(shot||held&&g.form==='loose')&&formFits(id,'loose')?'loose':'line';
      if(f!==g.form&&f==='loose')g.formAt=B.t;
      // (its front: toward the foe's army; its shooters toward whom they should shoot (their mark, else the nearest in their
      // reach), turned only once he is out of their arc: the soldiers never turn themselves; on its way over a crossing, its way)
      const C=centroid(m),sm=(k==='arc'||k==='mag')&&m.some(u=>u.s.range),R=sm?Math.max(...m.map(u=>u.s.range||0)):0,inR=sm?foes.filter(e=>Math.hypot(e.x-C.x,e.y-C.y)<=R):[],
        mark=sm&&(sightGoal(g,team)||g.targetPoint()||(inR.length?inR.reduce((a,e)=>Math.hypot(e.x-C.x,e.y-C.y)<Math.hypot(a.x-C.x,a.y-C.y)?e:a):null)),
        wade=g.order==='hold'&&B.captains&&B.captains[ck]&&B.captains[ck].files&&B.captains[ck].files[id],face=k==='cav'&&g.ridePlan&&g.order==='hold'?g.face:wade?wade.a:mark?Math.atan2(mark.y-C.y,mark.x-C.x):Math.atan2(M.y-C.y,M.x-C.x),turned=angGap(face,g.currentFacing??g.face)>(mark?SHOOT.arc*.4:CAPT.turn);
      if(g.form!==f||turned)g.setForm(f,{face})}
  }
}
// the enemy's captain (key 1): its style told as the battle opens (TEMPER_SAY); a beaten army falls back as one (beatenArmy, by
// that name: tests/battlejuice.js stands in for it), rather than fighting to the last man; your hero the leader it marks
class EnemyCommander extends Commander{
  announce(temper){if(TEMPER_SAY[temper])toast(TEMPER_SAY[temper])}
  fallsBack(N0,S){return !B.noMorale&&((B.sides?.active?B.fallBackTeams?.has(this.team):B.fallBack)||beatenArmy(N0,S,this.T))}
  leadOf(foes){return B.hero&&B.hero.hp>0&&battleEnemy(this.team,B.hero)&&seenBy(this.team,B.hero)?B.hero:B.sides?.active?foes.find(u=>u.leader||u.hero)||null:null}
}
// ---------- the old names: one-line aliases (each declared as it was: tests stand in for command and posture) ----------
const gtun=(ck,k)=>Commander.of(ck).gt(k);
function groundAI(ck){return Commander.of(ck).ground()}
function temperFor(team,key){return Commander.at(team,key).temperFor()}
const temperOf=ck=>Commander.of(ck).T;
function rangedMode(ck,S,post,shots,engaged){return Commander.of(ck).rangedMode(S,post,shots,engaged)}
function captainGroups(team,key){return Commander.at(team,key).groups()}
function command(dt){return Commander.command(dt)}
function captainFinish(team,N,ck=team){return Commander.of(ck).finish(N)}
function assess(team){return Commander.of(team).assess()}
function posture(ck,S){return Commander.of(ck).posture(S)}
function captainScout(team,N,S){return Commander.of(team).scout(N,S)}
function captainSearch(team,N){return Commander.of(team).search(N)}
function typePost(team,S){return Commander.of(team).typePost(S)}
function typeHolds(team,S){return Commander.of(team).typeHolds(S)}
const typeRush=team=>Commander.of(team).typeRush();
function typeTake(c){return Commander.of(c.ck).take(c)}
function captain(team,key){return Commander.at(team,key).orders()}
function captainCtx(team,ck,Q,S,N,post){return Commander.of(ck).read(Q,S,N,post)}
function captainInf(c,id){return Commander.of(c.ck).infantry(c,id)}
function captainRally(c,id){return Commander.of(c.ck).rally(c,id)}
function captainShooters(c,k,id){return Commander.of(c.ck).shooters(c,k,id)}
function captainCav(c,id){return Commander.of(c.ck).cavalry(c,id)}
function captainHero(c,id){return Commander.of(c.ck).hero(c,id)}
