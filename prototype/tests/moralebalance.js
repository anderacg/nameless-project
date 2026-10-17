'use strict';
// Kill reassurance and breaking timers, on the formation's shared resolve (soldier morale fields are only mirrors).
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),near=(a,b)=>Math.abs(a-b)<1e-7;
 try{
  const fixture=()=>{if(L.active)L.exit();L.start({left:'hum_levy',leftCount:100,right:'hum_levy',rightCount:100,ai:false,paused:true,morale:true,seed:42});const b=t.B,a=b.units.filter(u=>u.team===0),e=b.units.filter(u=>u.team===1);a.forEach(u=>{u.x=400;u.y=300});e.forEach(u=>{u.x=440;u.y=300});return {b,a,e,r:t.resolveOf(a[99]),q:t.resolveOf(e[99])}};
  const tick=(f,dt)=>{f.b.t+=dt;t.moraleTick(dt)},kill=u=>{u.hp=0;t.moraleDeath(u)};
  let f=fixture(),r=f.r;ok(r&&f.a.every(u=>t.resolveOf(u)===r),'the fixture side shares one formation resolve');
  r.mor=20;kill(f.e[0]);ok(near(r.mor,20.5),'ordinary nearby kill grants only half a morale point');
  f.e.slice(1,20).forEach(kill);ok(near(r.mor,22),'ordinary kill reassurance shares a two-point rolling budget');
  f.b.t=.99;kill(f.e[20]);ok(near(r.mor,22),'kill budget cannot reset at an arbitrary time boundary');
  f.b.t=1.01;kill(f.e[21]);ok(near(r.mor,22.5),'new enemy deaths reassure again after the rolling window');
  f=fixture();r=f.r;r.mor=r.base-.1;kill(f.e[0]);ok(near(r.mor,r.base),'kill reassurance cannot exceed baseline morale without confidence');
  r.confidence=1;r.mor=r.base+t.CONFIDENCE.max-.1;f.b.t+=1.01;kill(f.e[1]);ok(near(r.mor,Math.min(100,r.base+t.CONFIDENCE.max)),'earned confidence raises the kill-reassurance ceiling');
  r.confidence=0;r.mor=r.base+5;f.b.t+=1.01;kill(f.e[2]);ok(near(r.mor,r.base+5),'kill ceiling never removes existing morale');
  f=fixture();r=f.r;r.mor=20;f.e[0].x=800;kill(f.e[0]);ok(r.mor===20,'distant ordinary kills give no reassurance');
  f=fixture();f.q.mor=20;kill(f.a[0]);ok(near(f.q.mor,20.5),'enemy formations use the same bounded kill rule');
  f=fixture();r=f.r;r.mor=20;f.e.slice(0,10).forEach(kill);const m=r.mor;f.e[10].leader={};kill(f.e[10]);ok(near(r.mor-m,t.MORALE.lead/2),'leader kills remain a separate meaningful uncapped event');
  f=fixture();for(let i=0;i<40;i++){kill(f.a[i]);kill(f.e[i])}ok(f.r.mor<f.r.base&&f.q.mor<f.q.base,'paired casualty bursts no longer pump untouched survivors to perfect morale');
  f=fixture();for(let i=0;i<30;i++){f.b.t+=.25;kill(f.a[i]);kill(f.e[i]);t.moraleTick(.25)}ok(f.r.mor<40&&f.q.mor<40,'sustained mutual losses produce net morale pressure in an even fight');
  f=fixture();r=f.r;r.mor=-1;tick(f,.59);ok(!r.routed,'mild breaking still has a short reaction window');tick(f,.01);ok(r.routed&&f.a.every(u=>u.rout),'ordinary collapse routes the formation at 0.6 combat seconds');
  f=fixture();r=f.r;r.mor=-10;tick(f,.24);ok(!r.routed,'severe collapse is not an instantaneous rout');tick(f,.01);ok(r.routed,'severe collapse routes at 0.25 combat seconds');
  f=fixture();r=f.r;r.mor=-1;tick(f,.2);r.mor=-11;tick(f,.06);ok(r.routed,'worsening morale shortens the existing timer without restarting it');
  f=fixture();r=f.r;r.mor=-11;tick(f,.15);r.mor=-1;tick(f,.1);ok(r.routed,'partial recovery below zero does not prolong an already severe breaking episode');
  f=fixture();r=f.r;r.mor=-11;tick(f,.1);r.mor=5;tick(f,.01);r.mor=-1;tick(f,.3);ok(!r.routed,'positive morale resets severity as well as elapsed breaking time');
  f=fixture();r=f.r;f.a.forEach(u=>u.hp=1);r.mor=-1;tick(f,.3);ok(!r.routed,'low health alone does not accelerate breaking');
  f=fixture();r=f.r;r.mor=-20;r.breakUrgentUntil=4;tick(f,.19);ok(!r.routed,'leader-loss collapse still has a reaction window');tick(f,.01);ok(r.routed,'leader-loss panic retains the 0.2-second override');
  f=fixture();r=f.r;r.mor=-10;for(let i=0;i<4;i++)tick(f,.05);ok(!r.routed,'small simulation steps accumulate without premature routing');tick(f,.05);ok(r.routed,'severe breaking threshold is consistent across timestep partitions');
  f=fixture();r=f.r;r.mor=-10;tick(f,0);tick(f,0);ok(!r.routed&&!r.breakT,'zero combat time cannot cause routing');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
