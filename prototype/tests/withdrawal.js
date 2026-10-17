'use strict';
// Real actor/group fixtures, isolated from campaign consequences by the battle laboratory.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,L=t.BattleLab;
 try{
  const fixture=(hero=false)=>{if(L.active)L.exit();L.start({left:hero?'hero':'hum_foot',right:'militia',distance:200,ai:false,paused:true,morale:false});const b=t.B,u=b.units.find(q=>q.team===0),e=b.units.find(q=>q.team===1),g=b.groups[u.grp];u.x=300;u.y=e.y=300;e.x=700;u.s={...u.s,spd:50};u.sta=100;e.s={...e.s,range:0,reach:12};g.withdraw();return {b,u,e,g}};
  let f=fixture();const start=f.u.x,sta=f.u.sta;t.aiUnit(f.u,.1,()=>{throw Error('withdrawing actors must not strike')});ok(Math.abs(start-f.u.x-5)<.00001&&f.u.sta<sta,'clear withdrawal uses normal running speed and spends stamina');
  const fresh=start-f.u.x;f=fixture();f.u.sta=30;t.withdrawStep(f.u,.1);const tired=300-f.u.x;ok(tired<fresh&&Math.abs(tired-fresh*.85)<.00001,'tired soldiers withdraw more slowly');
  f=fixture();f.u.sta=0;t.withdrawStep(f.u,.1);ok(Math.abs(300-f.u.x-50*.7*t.MARCH.walk*.1)<.00001&&f.u.sta===0,'exhausted soldiers can only walk and stamina stays nonnegative');
  f=fixture();f.u.slow=1;t.withdrawStep(f.u,.1);ok(Math.abs(300-f.u.x-fresh*.5)<.00001,'slowing effects still affect retreat speed');
  f=fixture();f.e.x=315;t.withdrawStep(f.u,.1);ok(300-f.u.x<fresh&&f.u.withdrawal&&f.u.withdrawal.remaining>0,'a melee threat starts a slower disengagement phase');
  const remaining=f.u.withdrawal&&f.u.withdrawal.remaining;f.g.withdraw();t.withdrawStep(f.u,.1);ok(f.u.withdrawal&&f.u.withdrawal.remaining<remaining,'repeating W does not reset or bypass an active disengagement');
  if(f.u.withdrawal){for(let i=0;i<30&&f.u.withdrawal.remaining>0;i++){f.e.x=f.u.x+10;t.withdrawStep(f.u,.05)}}
  const before=f.u.x;f.e.x=before+10;t.withdrawStep(f.u,.1);ok(f.u.withdrawal&&f.u.withdrawal.remaining===0&&before-f.u.x>fresh*.8,'disengagement completes once even if the pursuer stays close');
  f.g.hold();f.g.withdraw();f.e.x=f.u.x+10;t.withdrawStep(f.u,.1);ok(f.u.withdrawal&&f.u.withdrawal.remaining>0,'canceling and reissuing withdrawal must disengage again');
  f=fixture();f.e.x=315;f.e.s.range=200;t.withdrawStep(f.u,.1);ok(Math.abs(300-f.u.x-fresh)<.00001,'a ranged foe not fighting in melee does not impose a melee disengagement');
  f=fixture();f.e.x=315;f.e.s.range=200;f.e.inMelee=true;t.withdrawStep(f.u,.1);ok(300-f.u.x<fresh,'a shooter in melee mode can pin a withdrawal briefly');
  f=fixture();f.e.x=315;f.e.rout=true;t.withdrawStep(f.u,.1);ok(Math.abs(300-f.u.x-fresh)<.00001,'routing enemies do not pin a withdrawal');
  f=fixture();f.u.x=f.b.exit.x;t.aiUnit(f.u,.1,()=>{});ok(f.u.left&&f.u.hpLeft>0&&f.b.withdrawn===1&&!f.b.lost.hum_foot,'an uncontested unit at the exit still escapes alive without an arbitrary casualty');
  f=fixture();f.u.x=f.b.exit.x+5;f.e.x=f.u.x+8;t.withdrawStep(f.u,.1);ok(!f.u.left,'a unit in melee cannot disappear instantly just because it is at the exit');
  for(let i=0;i<30&&!f.u.left;i++)t.withdrawStep(f.u,.05);ok(f.u.left&&f.b.withdrawn===1&&f.u.hpLeft>0,'after the bounded disengagement, an exit remains usable without forced casualties');
  f=fixture();f.e.x=315;f.u.hp=f.u.max=1000;t.withdrawStep(f.u,.1);t.hit(f.e,f.u,5);ok(f.u.hp<1000,'disengaging soldiers remain vulnerable to actual enemy attacks');
  f=fixture(true);const sp=t.heroState().sp;t.withdrawStep(f.u,.1);ok(t.heroState().sp<sp,'hero withdrawal spends the hero stamina pool');
  f=fixture(true);t.heroState().sp=0;t.withdrawStep(f.u,.1);ok(Math.abs(300-f.u.x-50*.7*t.MARCH.walk*.1)<.00001,'an exhausted hero also walks instead of escaping at full speed');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
