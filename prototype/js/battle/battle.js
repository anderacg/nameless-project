'use strict';
/* ---------- battle ---------- */
// Group identity is independent of tactical role. Lists belong to the active battle, never fixed category buckets.
const playerGroups=()=>B?[...new Set([...(B.playerOrder||[]),...Object.keys(B.groups)])].filter(id=>B.groups[id]?.player):[];
const groupName=id=>id==='all'?'All troops':B&&B.groups[id]?B.groups[id].name:id;
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
// Actor execution lives in actors.js; shared group defaults and frame orchestration remain here.
// rt is real time; fighting runs on dt, slowed by BATTLE_PACE, while effects keep real time
function updateBattle(rt){
  // the battle's speed: everything runs on its clock; paused, nothing moves but you can still give orders
  if(B.paused||B.deploy)return;rt*=B.speed||1;if(B.slow>0){B.slow-=rt;rt*=VFX.slow}// (a charge's impact: a moment of slow motion, vfx.js)
  const dt=rt*BATTLE_PACE;B.t+=dt;
  // hit-stop: heavy blows freeze the fight for a moment while effects keep moving
  const frozen=B.hx&&B.hx.stop>0;if(frozen)B.hx.stop-=rt;
  // (the battle over: the field runs on, routers running, the dead falling, till the summary comes up: END_WAIT)
  if(!frozen){
    // (RTS command: your hero fights on their own, as every unit does; the manual control is set aside for now)
    const was=new Map(B.units.map(u=>[u,[u.x,u.y]]));// (where each stood as the frame began: its motion, for the way round a rock or tree)
    if(MANUAL_HERO)updateHero(rt*HERO_PACE);else charAuto(B.hero,rt*HERO_PACE);for(const id in B.groups)B.groups[id].step(dt);command(dt);commandCharacters(dt);// (every group minds itself, then the captains give their orders: battlecontrol.js, commander.js)// (your hero fights on their own, as every character does; the enemy's captain: commander.js)
    for(const u of B.units){if(u.hp<=0)continue;if(u.kx||u.ky){u.x+=u.kx*dt;u.y+=u.ky*dt;if(Math.abs(u.kx)+Math.abs(u.ky)>60&&Math.random()<.4)vfx({k:'dust',x:u.x,y:u.y-1,vx:-u.kx*.1,vy:-u.ky*.05,r:2,grow:8,life:.4,col:'196,180,140'});const k=Math.pow(.004,dt);u.kx*=k;u.ky*=k;if(Math.abs(u.kx)+Math.abs(u.ky)<2)u.kx=u.ky=0}if(u.buffT>0)u.buffT-=dt;if(u.wardT>0)u.wardT-=dt}
    for(const u of B.units){if(u.hp<=0)continue;if(u.slow>0)u.slow-=dt;if(u.hero&&gm('regen'))u.hp=Math.min(u.max,u.hp+gm('regen')*dt)}
    updateNonHeroActors(dt);
    // (soldiers jostle apart; those running off the field, withdrawn or routed, slip through their own side)
    for(let i=0;i<B.units.length;i++){const a=B.units[i];if(a.hp<=0)continue;for(let j=i+1;j<B.units.length;j++){const b=B.units[j];if(b.hp<=0||a.team===b.team&&(a.rout||b.rout||withdrawing(a)||withdrawing(b)))continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);const R=a.s.big||b.s.big?18:8;if(d<R&&d>.01){const p=(R-d)*.5/d;if(!a.hero){a.x-=dx*p;a.y-=dy*p}if(!b.hero){b.x+=dx*p;b.y+=dy*p}}}}
    for(const u of B.units){if(u.hp<=0||u.s.big)continue;for(const o of B.obs)obstaclePush(u,o,was.get(u))}
    for(const u of B.units){u.x=clamp(u.x,8,BW-8);u.y=clamp(u.y,fieldTop(),fieldBot())}
    updateProjectiles(dt);
    moraleTick(dt);if(B.opts.sandbox&&BattleLab.active)BattleLab.sampleMorale();// (morale.js)
    if(!B.over){const ap=B.units.filter(u=>u.team===0&&fighting(u)).length,ae=B.units.filter(u=>u.team===1&&fighting(u)).length;
    if(ae>0&&retreating())retreatNow();// (you withdrew: morale.js)
    else if(ae===0||ap===0){B.over=true;B.endT=END_WAIT;B.win=ae===0;const run=B.units.some(u=>u.hp>0&&u.rout&&u.team===(B.win?1:0))||(B.win?B.fledFoes:B.fledMine);
      if(run){B.routed=B.win?1:0;log(B.win?'The enemy breaks and flees the field.':'Your men break and run.',B.win?'good':'bad')}}}
  }
  if(B.over){B.endT-=rt;if(B.endT<=0){finishBattle();return}}
  for(const p of B.parts){p.life-=rt;if(p.stuck)continue;p.x+=p.vx*rt;p.y+=p.vy*rt;p.vy+=90*rt}B.parts=B.parts.filter(p=>p.life>0);
  for(const f of B.floats){f.y-=14*rt;f.life-=rt;f.age=(f.age||0)+rt}B.floats=B.floats.filter(f=>f.life>0);vfxStep(rt);// (effects: gfx/vfx.js)
  for(const s of B.slashes)s.life-=rt;B.slashes=B.slashes.filter(s=>s.life>0);
  for(const r of B.rings)r.life-=rt;B.rings=B.rings.filter(r=>r.life>0);
  G.shake=Math.max(0,G.shake-rt*14);
}
