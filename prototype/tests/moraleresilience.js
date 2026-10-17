'use strict';
// Casualty resilience: bursts of losses, support, distance, leader shocks and positional panic, on the formation's shared resolve.
// (Breaking timers are in moralebalance.js; shared-state rules such as size-normalised casualties in groupmorale.js.)
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
 try{
  const fixture=(n=100,enemy=25)=>{if(L.active)L.exit();L.start({left:'hum_levy',leftCount:n,right:'hum_levy',rightCount:enemy,ai:false,paused:true,morale:true,seed:42});const b=t.B,a=b.units.filter(u=>u.team===0),e=b.units.filter(u=>u.team===1);a.forEach(u=>{u.x=400;u.y=300});e.forEach(u=>{u.x=440;u.y=300});return{b,a,e}};
  const tick=(f,dt)=>{f.b.t+=dt;t.moraleTick(dt)},kill=u=>{u.hp=0;t.moraleDeath(u)};
  let f=fixture(),u=f.a[99];tick(f,1);const before=u.mor;f.a.slice(0,11).forEach(kill);tick(f,.01);
  ok(u.mor>0&&!u.rout&&f.a.filter(q=>q.hp>0&&q.rout).length===0,'11 nearby deaths do not rout healthy survivors of a confident 100-vs-25 army');
  ok(before-u.mor<20,'one burst of casualties has bounded morale impact');
  f=fixture();f.b.units.forEach(q=>q.team=1-q.team);u=f.a[99];tick(f,1);f.a.slice(0,11).forEach(kill);tick(f,.01);ok(u.mor>0&&!u.rout,'the same casualty resilience protects enemy soldiers');
  f=fixture(8,8);u=f.a[7];let m=u.mor;kill(f.a[0]);const small=m-u.mor;
  f=fixture();u=f.a[99];m=u.mor;kill(f.a[0]);ok(m-u.mor<small,'nearby supporting strength softens each ordinary casualty shock');
  f=fixture();let r=t.resolveOf(f.a[99]);f.a.slice(0,40).forEach(kill);m=r.mor;tick(f,1.1);kill(f.a[51]);ok(r.mor<m,'new casualties keep shaking the formation');
  f=fixture();u=f.a[99];f.a.slice(0,50).forEach(q=>{q.x=20;kill(q)});ok(u.mor>0,'a burst of distant allied deaths cannot instantly collapse a healthy soldier');
  f=fixture(8,8);u=f.a[7];r=t.resolveOf(u);r.mor=-1;tick(f,.01);/* (breaking) */
  f.b.sel=testGroup('inf');t.setOrderUI();ok(document.getElementById('bInfo').textContent.includes('Breaking:')&&document.querySelector('[data-grp="'+testGroup('inf')+'"]').textContent.includes('breaking'),'HUD distinguishes pending morale breaking from withdrawal');
  f=fixture(8,8);u=f.a[7];r=t.resolveOf(u);r.mor=1;f.a[0].leader={};kill(f.a[0]);ok(r.mor<0,'leader death keeps its serious uncapped shock');tick(f,.21);ok(r.routed,'leader loss can cause a rapid collapse');
  f=fixture();u=f.a[99];r=t.resolveOf(u);f.a.slice(0,40).forEach(kill);m=r.mor;f.a[40].leader={};kill(f.a[40]);ok(m-r.mor>=t.MORALE.lead,'leader shock is not reduced by heavy earlier casualties');
  f=fixture(8,8);u=f.a[7];u.dir=0;u.inSlot=false;const src={x:u.x-20,y:u.y};m=u.mor;const dmg=t.flankMul(u,src);let same=true;for(let i=0;i<20;i++)same=same&&t.flankMul(u,src)===dmg;ok(same,'repeated rear hits retain their damage multiplier');ok(m-u.mor<10,'many same-moment rear hits cannot pile up repeated positional panic');
  f.b.t+=.6;m=u.mor;t.flankMul(u,src);ok(u.mor<m,'positional panic can recur after its cooldown');
  f=fixture(8,8);u=f.a[7];r=t.resolveOf(u);r.mor=-1;f.e.forEach(q=>q.x=900);tick(f,1);ok(r.mor>0&&!r.routed,'safe soldiers can regain morale before a pending break');
  f=fixture();u=f.a[99];f.a.slice(0,40).forEach(kill);m=u.mor;t.moraleHurt(u,u.max*.5);ok(u.mor<m,'casualty cap does not block morale damage from real wounds');
  f=fixture(8,8);u=f.a[7];r=t.resolveOf(u);r.mor=-5;for(let i=0;i<4;i++)tick(f,t.RESOLVE.breakDelay/5);const early=r.routed;tick(f,t.RESOLVE.breakDelay/5);ok(!early&&r.routed&&!r.breakT,'ordinary breaking time adds up over small steps: it routes at the threshold, not before, and clears its progress');
  f=fixture(8,8);u=f.a[7];f.b.sel=testGroup('inf');t.setOrder('withdraw');ok(f.b.groups[testGroup('inf')].order==='withdraw','manual withdrawal remains available immediately');
  for(const seed of [1,42]){if(L.active)L.exit();L.start({left:'hum_levy',leftCount:100,right:'hum_levy',rightCount:25,ai:true,paused:true,morale:true,seed});let peak=0;for(let i=0;i<18&&!L.session.result;i++){L.step(600);peak=Math.max(peak,t.B.units.filter(q=>q.team===0&&q.hp>0&&q.rout).length)}ok(L.session.result==='Left side wins','100-vs-25 larger force still wins a complete battle, seed '+seed);o.push('INFO seed '+seed+' maximum sampled friendly routers: '+peak)}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
