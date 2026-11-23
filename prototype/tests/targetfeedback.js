'use strict';
window.ARENA=true;
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=false;t.GUIDE.on=false;P.troops={hum_foot:4,hum_bow:3};G.enc={kind:'party',ref:{x:P.x+30,y:P.y,cool:0},list:['militia','archer']};t.startBattle({enemies:G.enc.list,deploy:false});t.beginFight();t.battlePause(true);
 const b=t.B,F=t.battleTargetFeedback,foe=b.units.find(u=>u.team===1&&u.hp>0),ids=t.playerGroups(),id=ids.find(g=>t.grpUnits(g).some(u=>!u.hero&&!u.s.range)),bow=ids.find(g=>t.grpUnits(g).some(u=>u.s.range)),u=t.grpUnits(id)[0],archer=t.grpUnits(bow)[0];
 const terrain=b.terrain,archerStats=archer.s;
 try{
  foe.hid=0;
  t.selectGroup(id);ok(!F.sample(),'no feedback before an explicit enemy order');
  b.terrain=null;foe.x=u.x+100;foe.y=u.y;t.rtsOrder(foe.x,foe.y-6);let v=F.sample();
  ok(v?.target===foe&&v.text==='Closing distance','ordinary orders retain the exact clicked target and explain closing distance');
  const reach=u.s.reach||11;foe.x=u.x+reach;u.cd=0;u.stun=0;u.wind=null;u.shot=null;
  v=F.measure(u,foe);ok(v.kind==='ready'&&v.text==='In reach'&&v.range===reach+3,'melee contact range uses the live attack reach and slack');
  u.cd=.5;ok(F.measure(u,foe).text==='Recovering','melee recovery is distinguished from being out of range');u.cd=0;
  u.stun=.5;ok(F.measure(u,foe).text==='Stunned','stun explains an unavailable attack');u.stun=0;
  const physics=t.PHYSICS.on;t.PHYSICS.on=true;u.down=.5;ok(F.measure(u,foe).text==='Getting up','knockdown explains why an adjacent fighter cannot attack');u.down=0;t.PHYSICS.on=physics;
  b.terrain={lift:true,apart:()=>true};ok(F.measure(u,foe).text==='Different ground level','incompatible ground levels explain blocked melee');b.terrain=null;
  foe.s.big=true;foe.x=u.x+reach+12;ok(F.measure(u,foe).kind==='ready','large-target contact uses the same body allowance as combat');delete foe.s.big;
  foe.x=archer.x+30;foe.y=archer.y;archer.cd=0;archer.spdNow=0;archer.skirm=false;archer.shot=null;
  ok(F.measure(archer,foe).ranged&&F.measure(archer,foe).range===archer.s.range,'ranged feedback uses the live weapon range');
  b.terrain={flag:(u,f)=>f==='noShoot'};ok(F.measure(archer,foe).text==='Cannot shoot from water','deep water reports its actual shooting restriction');b.terrain=null;
  b.groups[bow].currentFacing=Math.PI;ok(F.measure(archer,foe).text==='Turning to aim','a target outside the firing arc asks for turning, not a failed hit');b.groups[bow].currentFacing=0;
  archer.spdNow=10;ok(F.measure(archer,foe).text==='Stopping to shoot','stationary shooters explain moving aim interruption');archer.s={...archer.s,race:'elf'};ok(F.measure(archer,foe).text!=='Stopping to shoot','shooting on the move respects unit eligibility');archer.spdNow=0;archer.s=archerStats;
  archer.cd=1;ok(F.measure(archer,foe).text==='Reloading','ranged cooldown shows reloading');archer.cd=0;archer.shot={t:.1,aim:.5};ok(F.measure(archer,foe).text==='Aiming','active aiming shows its own state');archer.shot=null;
  b.groups[bow].melee=true;ok(!F.measure(archer,foe).ranged&&F.measure(archer,foe).range===t.BLADE.reach*t.meleeK()+3,'melee-mode archers show their blade reach');b.groups[bow].melee=false;
  t.selectGroup(id);b.groups[id].attack(foe,{individual:true});b.mark={target:foe};F.at=0;F.hud();
  ok(!document.getElementById('bTargetFeedback').hidden&&document.getElementById('bTargetFeedback').textContent.includes(foe.s.n),'desktop and phone share one named-target status row');
  t.bhudTop();const details=document.getElementById('bPowerDetails');ok(details&&!details.open&&getComputedStyle(details.querySelector('.battle-power-body')).display==='none','army power hides routine detail rows by default');
  ok(details.contains(document.getElementById('bField'))&&details.contains(document.getElementById('bSelectionSummary'))&&details.contains(document.getElementById('bTargetFeedback')),'terrain, selection and attack text stay available inside battle details');
  details.open=true;t.bhudTop();ok(details.open&&getComputedStyle(details.querySelector('.battle-power-body')).display!=='none','opening details survives status refreshes');details.open=false;
  ok(document.getElementById('bStatus').parentElement.hidden,'routine pause text does not repeat the pause control');const ready=b.ready;b.ready=true;t.armAttackMove(true);t.bhudTop();ok(!document.getElementById('bStatus').parentElement.hidden&&document.getElementById('bStatus').textContent.includes('destination'),'essential targeting prompt stays visible');t.armAttackMove(false);b.ready=ready;
  const combat=()=>JSON.stringify({orders:Object.values(b.groups).map(g=>[g.id,g.order,g.targetGroupId,g.targetUnitId,g.mvId]),units:b.units.map(q=>[q.id,q.hp,q.cd,q.stun,q.x,q.y,q.rt,q.ammo]),time:b.t});
  const canvas=t.ctx,ellipse=canvas.ellipse;let center=null;canvas.ellipse=function(...args){center=args;return ellipse.apply(this,args)};
  try{t.drawOrderLines();ok(!center,'legacy attack-order rings are suppressed for the focused individual');F.drawTarget();const at=t.fromField({x:foe.x,y:foe.y-t.fieldLift(foe.x,foe.y)});ok(center&&Math.abs(center[0]-at.x)<1e-8&&Math.abs(center[1]-at.y)<1e-8,'GUI target marker uses the same field-to-screen conversion as health squares')}finally{canvas.ellipse=ellipse}
  const before=combat();F.at=0;F.view();F.drawGround();F.drawTarget();F.hud();ok(combat()===before,'sampling and drawing cannot mutate orders, timers, damage, ammo or positions');
  foe.hid=1;ok(!F.view(),'an unseen target vanishes immediately, even within the sample interval');F.hud();ok(document.getElementById('bTargetFeedback').hidden,'hidden enemies reveal no name or status');foe.hid=0;
  foe.hp=0;F.at=0;ok(!F.sample(),'dead targets do not retain a live marker');foe.hp=foe.max;
  b.groups[id].hold();ok(!F.view(),'Hold clears targeting feedback instead of retaining the old enemy');
  b.groups[id].attack(foe,{individual:true});b.over=true;ok(!F.view(),'finished battles suppress target hints');b.over=false;b.deploy=true;ok(!F.sample(),'deployment has no attack feedback');b.deploy=false;
  t.selectGroup(id);b.groups[id].attack(foe,{individual:true});F.at=0;t.frame();const tracker=document.getElementById('qtrack');ok(!tracker||getComputedStyle(tracker).display==='none','world adventure tracker stays hidden during combat');ok(!ERR.length,'target overlays render without runtime errors');
 }finally{b.terrain=terrain;archer.s=archerStats}
});
