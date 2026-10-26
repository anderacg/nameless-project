'use strict';
/* ---------- battle ---------- */
// Group identity is independent of tactical role. Lists belong to the active battle, never fixed category buckets.
const playerGroups=()=>B?[...new Set([...(B.playerOrder||[]),...Object.keys(B.groups)])].filter(id=>B.groups[id]?.player):[];
const groupName=id=>id==='all'?'All troops':B&&B.groups[id]?B.groups[id].name:id;
/* the sides' colours, the one table for everything the battle draws by side: yours blue, your allies' (another lord's men on your
   side: their groups' ally) green, the enemy's red. ui: marks, dots, bars, rings; rout: the paler shade of one running; rgb: the
   same as ui for rgba() (order paths); say: words over a man; plate: a group's icon (its colour, lighter top, darker foot);
   tabard: the side's cloth on the soldiers (people.js PPAL) */
const SIDE={
  own:{ui:'#6fa8e0',rout:'#c8d8f0',rgb:'111,168,224',say:'#9fc0ff',plate:['#3466c0','#5a8ae0','#24488a'],tabard:'blue'},
  ally:{ui:'#5cc06c',rout:'#c4ecc4',rgb:'92,192,108',say:'#a8e6a4',plate:['#2c8a44','#4cb468','#1c5e30'],tabard:'forest'},
  foe:{ui:'#e0605a',rout:'#f2c0b8',rgb:'224,96,90',say:'#ff9a90',plate:['#a8443e','#c8605a','#7a2e2a'],tabard:'red'}};
// whose a soldier or a group is: 'own', 'ally' or 'foe' (a soldier by his group's ally)
const sideKey=x=>x.team?'foe':(x.ally??(x.grp&&B&&B.groups[x.grp]&&B.groups[x.grp].ally))?'ally':'own';
const sideCol=(x,k='ui')=>SIDE[sideKey(x)][k];
// a soldier's side for his sprite (sprites.js unitSprite: 0 yours, 1 theirs, 2 your allies')
const spriteTeam=u=>u.team?1:sideKey(u)==='ally'?2:0;
// the manual control of your hero (WASD, Space, F, B, skill slots) is set aside for now: you command, your hero fights on their
// own (RTS command: commands.js). true brings it back here (its keys and buttons are commented out in input.js and Ashmark.html)
let MANUAL_HERO=false;
const grpOf=s=>s.range?(s.magic?'mag':'arc'):s.charge?'cav':'inf';
const grpUnits=g=>B.units.filter(u=>u.grp===g&&u.hp>0);
/* how a group of yours moves and fights, besides its order (hold, charge, advance; withdraw):
   walk (at its slowest member's pace, keeping formation; no running charge), firm (holds its ground: strikes only what
   comes into reach, never steps out of line), fire (archers shoot at will; off, only at the enemy you set them on),
   skirmish (archers step back from enemies coming at them), queue (waypoints, Shift + right-click, taken in turn) */
// (a battle over: this long before its summary, the field left to settle)
const END_WAIT=2;
const GRP_FLAGS={walk:true,firm:false,cease:false,skirmish:false,melee:false,shieldWall:false};// Capability-filtered requests; soldiers keep their own equipment and stats.
const MARCH={reached:10,skirmish:44,edge:40,walk:.55};
// walking: a group set to walk, unless this order is a run (g.run: a double right-click, a charge); a walk keeps the slowest's
// pace at MARCH.walk of it, and builds no charge
const walking=g=>!!(g&&g.walk&&!g.run);
/* a rock or tree: whoever walks into one is put back on its rim (r+3 out from its centre), and so slides round it as he
   keeps on. Walking dead at its centre (a stack withdrawing or routing straight back, a march exactly through it), the push
   is straight against his motion and he would stand there for good: then (the sine of the angle between his step and the push
   under OBSTACLE.slip: dead on, to within rounding; any wider and battles that never stalled would play out differently)
   he goes round along the rim by the step he lost, to the side he is already on (exactly on the line: by his id's parity) */
const OBSTACLE={pad:3,slip:1e-9};
function obstaclePush(u,o,w){
  const dx=u.x-o.x,dy=u.y-o.y,dd=Math.hypot(dx,dy),r=o.r+OBSTACLE.pad;if(!(dd<r&&dd>.01))return;
  const nx=dx/dd,ny=dy/dd;u.x=o.x+nx*r;u.y=o.y+ny*r;if(!w)return;
  const mx=dx-(w[0]-o.x),my=dy-(w[1]-o.y),m=Math.hypot(mx,my);if(m<1e-6)return;
  const into=-(mx*nx+my*ny)/m,c=(mx*ny-my*nx)/m;if(into<=0||Math.abs(c)>=OBSTACLE.slip)return;
  const side=c>0?-1:c<0?1:(u.id&1?1:-1),a=Math.atan2(ny,nx)+side*Math.min(m*into,r)/r;u.x=o.x+Math.cos(a)*r;u.y=o.y+Math.sin(a)*r}
/* soldiers jostle apart: every pair closer than 8 (18 by a big one) pushed half the overlap each way (physics on: the lighter the
   more, by their masses: physics.js physShare; a hero stands his ground);
   those running off the field, withdrawn or routed, slip through their own side. Pairs are taken as the full scan took them
   (i ascending, each j after it ascending) on the positions of that moment, but only those a grid finds close (spatial.js):
   a pushed pair is filed again as it moves; a's candidates are those within reach + JOSTLE.pad (and a pixel for rounding) of
   where he stood when they were gathered, big ones always, gathered again from the next j on once he has been pushed more than
   the pad off; so every pair that could be in reach at its turn is tried, in the same order with the same arithmetic, and
   the pairs left out would have done nothing */
const JOSTLE={pad:4};
function jostle(dt){
  const U=B.units,S=spatialOpen(SPATIAL.jostle),big=[],list=[];for(let i=0;i<U.length;i++)if(U[i].hp>0&&U[i].s.big)big.push(i);
  let a=null,x0=0,y0=0;const gather=()=>{x0=a.x;y0=a.y;const r=(a.s.big?18:8)+JOSTLE.pad+1;list.length=0;for(const i of big)list.push(i);S.box(x0-r,y0-r,x0+r,y0+r,null,false,list)};
  try{for(let i=0;i<U.length;i++){a=U[i];if(a.hp<=0)continue;let last=i;gather();
    for(let k=0;k<list.length;k++){const j=list[k];if(j<=last)continue;
      if(Math.abs(a.x-x0)>JOSTLE.pad||Math.abs(a.y-y0)>JOSTLE.pad){gather();k=-1;continue}
      last=j;const b=U[j];if(b.hp<=0||a.team===b.team&&(a.rout||b.rout||withdrawing(a)||withdrawing(b)))continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);const R=a.s.big||b.s.big?18:8;if(d<R&&d>.01){if(PHYSICS.on){const q=(R-d)/d,f=physShare(a,b,dt,dx,dy);if(!a.hero){a.x-=dx*q*f;a.y-=dy*q*f;S.refile(i)}if(!b.hero){b.x+=dx*q*(1-f);b.y+=dy*q*(1-f);S.refile(j)}}else{const p=(R-d)*.5/d;if(!a.hero){a.x-=dx*p;a.y-=dy*p;S.refile(i)}if(!b.hero){b.x+=dx*p;b.y+=dy*p;S.refile(j)}}}}}}
  finally{spatialClose()}
}
// off the rocks and trees (obstaclePush; the big ones shoulder through), inside the field, and no step into rock or impassable
// water, nor over a cliff its blocked way: refused or slid along (terrain.js); was: where each stood as the frame began
function keepOffObstacles(was){
  for(const u of B.units){if(u.hp<=0||u.s.big)continue;for(const o of B.obs)obstaclePush(u,o,was.get(u))}
  for(const u of B.units){u.x=clamp(u.x,8,BW-8);u.y=clamp(u.y,fieldTop(),fieldBot())}
  if(B.terrain)terrainHold(was);if(B.world)B.world.clamp()}
// the fight over? one side with no one left fighting (or you withdrew: morale.js retreatNow); a side running off told in the log
function checkBattleOver(){
  if(B.over)return;const ap=B.units.filter(u=>u.team===0&&fighting(u)).length,ae=B.units.filter(u=>u.team===1&&fighting(u)).length;
  if(ae>0&&retreating())retreatNow();
  else if((ae===0||ap===0)&&(!B.world||B.world.ended(ap,ae))){B.over=true;B.endT=END_WAIT;B.win=ae===0;const run=B.units.some(u=>u.hp>0&&u.rout&&u.team===(B.win?1:0))||(B.win?B.fledFoes:B.fledMine);
    if(run){B.routed=B.win?1:0;log(B.win?'The enemy breaks and flees the field.':'Your men break and run.',B.win?'good':'bad')}}}
/* battle events: the fight tells what just happened (battleEvent(type, d)) and whoever shows or records it listens (battleOn):
   the banners and cards (battlehud.js), the commander bar's cue (commandpowers.js), the lab's telemetry (lab.js). Listeners run
   at once, in the order they were added, so they read the state of that moment; they never change the fight. The events (d):
   rout {r, m: its men}, rally {r} (r: a BattleResolve, morale.js); flank {u, src}, leader {u} (a leader falls), down {u} (a
   soldier falls: attacks.js), left {u} (off the field: morale.js leaveField); ambush {u} (terrain.js ambushMul); fallback
   {team} (an army falls back as one: commander.js); btype {text, team} (the battle's type, as it opens: setup.js); power
   {team, id, c, gs} (commandpowers.js); ability {g, id} (unitabilities.js); withdraw {g} (battlecontrol.js) */
const BATTLE_EARS=[];
const battleOn=f=>{BATTLE_EARS.push(f)};
function battleEvent(type,d){for(const f of BATTLE_EARS)f(type,d)}
// Actor execution lives in actors.js; shared group defaults and frame orchestration remain here.
// rt is real time; fighting runs on dt, slowed by BATTLE_PACE, while effects keep real time
function updateBattle(rt){
  if(B?.muster?.active){B.muster.step(rt);return}
  if(B?.world){
    if(B.paused||B.deploy)return;const b=B,speed=G.speed,step=WORLD_BATTLE.step,total=rt*speed;B.speed=speed;
    // Bounded combat steps preserve collision, path corners and animation events at campaign fast speeds.
    let left=total;while(left>1e-9&&B===b){const n=Math.min(step,left);battleStep(n,true);left-=n}return;
  }
  battleStep(rt,false);
}
function battleStep(rt,world){
  // the battle's speed: everything runs on its clock; paused, nothing moves but you can still give orders
  if(B.paused||B.deploy)return;if(!world)rt*=B.speed||1;if(!world&&B.slow>0){B.slow-=rt;rt*=VFX.slow}// (a charge's impact: a moment of slow motion, vfx.js)
  const dt=world?moveStep(1,rt*WORLD_PACE,false)*B.world.scale:rt*BATTLE_PACE;B.t+=dt;
  // World combat keeps the campaign clock: a hero impact must not freeze every army.
  if(world){B.slow=0;if(B.hx)B.hx.stop=0}
  // hit-stop: heavy blows freeze the fight for a moment while effects keep moving
  const frozen=B.hx&&B.hx.stop>0;if(frozen)B.hx.stop-=rt;
  // (the battle over: the field runs on, routers running, the dead falling, till the summary comes up: END_WAIT)
  if(!frozen){
    if(B.world&&!B.over){checkBattleOver();if(!B.over)B.world.step(dt)}
    // (RTS command: your hero fights on their own, as every unit does; the manual control is set aside for now)
    const was=new Map(B.units.map(u=>[u,[u.x,u.y]]));// (where each stood as the frame began: its motion, for the way round a rock or tree)
    if(MANUAL_HERO)updateHero(world?dt:rt*HERO_PACE);else if(B.hero)CharacterMind.of(B.hero).auto(world?dt:rt*HERO_PACE);for(const id in B.groups)B.groups[id].step(dt);command(dt);CharacterMind.command(dt);// (every group minds itself, then the captains give their orders: battlecontrol.js, commander.js)// (your hero fights on their own, as every character does: charmind.js; the enemy's captain: commander.js)
    for(const u of B.units){if(u.hp<=0)continue;if(u.kx||u.ky){u.x+=u.kx*dt;u.y+=u.ky*dt;if(Math.abs(u.kx)+Math.abs(u.ky)>60&&Math.random()<.4)vfx({k:'dust',x:u.x,y:u.y-1,vx:-u.kx*.1,vy:-u.ky*.05,r:2,grow:8,life:.4,col:'196,180,140'});const k=Math.pow(.004,dt);u.kx*=k;u.ky*=k;if(Math.abs(u.kx)+Math.abs(u.ky)<2)u.kx=u.ky=0}if(u.buffT>0)u.buffT-=dt;if(u.wardT>0)u.wardT-=dt}
    for(const u of B.units){if(u.hp<=0)continue;if(u.slow>0)u.slow-=dt;if(u.hero&&gm('regen'))u.hp=Math.min(u.max,u.hp+gm('regen')*dt)}
    updateNonHeroActors(dt);
    // (soldiers jostle apart; those running off the field, withdrawn or routed, slip through their own side)
    jostle(dt);
    keepOffObstacles(was);if(PHYSICS.on)physPost(was,dt);// (one who ran into a wall stops: physics.js)
    updateProjectiles(dt);
    sightStep();// (who sees whom, every SIGHT.every s: hidden in woods or behind a rise, out of sight in the fog, terrain.js; nothing with neither)
    moraleTick(dt);if(B.opts.sandbox&&BattleLab.active)BattleLab.sampleMorale();// (morale.js)
    checkBattleOver();
  }
  if(B.over){B.endT-=rt;if(B.endT<=0){finishBattle();return}}
  for(const p of B.parts){p.life-=rt;if(p.stuck)continue;p.x+=p.vx*rt;p.y+=p.vy*rt;p.vy+=90*rt}B.parts=B.parts.filter(p=>p.life>0);
  for(const f of B.floats){f.y-=14*rt;f.life-=rt;f.age=(f.age||0)+rt}B.floats=B.floats.filter(f=>f.life>0);vfxStep(rt);// (effects: gfx/vfx.js)
  for(const s of B.slashes)s.life-=rt;B.slashes=B.slashes.filter(s=>s.life>0);
  for(const r of B.rings)r.life-=rt;B.rings=B.rings.filter(r=>r.life>0);
  G.shake=Math.max(0,G.shake-rt*14);
}
