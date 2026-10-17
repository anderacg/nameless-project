'use strict';
// Morale context: what a soldier's formation sees (outmatched, overwhelmed, confident), cohesion of the line, and recent-loss
// strain. (Casualty bursts are in moraleresilience.js; strain as shared group state in groupmorale.js.)
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),near=(a,b)=>Math.abs(a-b)<1e-6;
 try{
  const fixture=(n=5,e=5,x=550)=>{if(L.active)L.exit();L.start({left:'hum_levy',leftCount:n,right:'hum_levy',rightCount:e,ai:false,paused:true,morale:true,seed:42});const b=t.B,a=b.units.filter(u=>u.team===0),en=b.units.filter(u=>u.team===1);b.obs=[];for(const [id,cx] of [[testGroup('inf'),400],[testGroup('e_inf'),x]]){const g=b.groups[id];g.placeAt(cx,300);t.layForm(id);t.grpUnits(id).forEach(u=>{u.x=cx+u.sx;u.y=300+u.sy;u.inSlot=true})}return{b,a,e:en,u:a.slice().sort((a,b)=>a.y-b.y)[Math.floor(n/2)]}};
  const view=f=>{const live=f.b.units.filter(t.fighting);return t.moraleView(f.u,live,new Map(live.map(u=>[u,t.moraleStrength(u)])))},tick=(f,dt)=>{f.b.t+=dt;t.moraleTick(dt)},kill=u=>{u.hp=0;t.moraleDeath(u)};
  let f=fixture(1,20,550),v=view(f);ok(v.outmatched>0&&!v.overwhelmed,'visible enemies 150 pixels away cause wider concern, not immediate close pressure');
  ok(!v.confidence,'outmatched and confident cannot come from the same awareness comparison');
  f=fixture();v=view(f);const enemyView=t.moraleView(f.e[2],f.b.units.filter(t.fighting),new Map(f.b.units.filter(t.fighting).map(u=>[u,t.moraleStrength(u)])));ok(!v.confidence&&!enemyView.confidence,'distance alone does not make equal visible armies both confident');
  f=fixture(30,5,440);v=view(f);ok(v.confidence>0&&!v.outmatched,'superior visible strength gives confidence instead of outmatched concern');
  f=fixture(1,20,700);v=view(f);ok(!v.outmatched&&!v.overwhelmed&&!v.confidence,'enemies beyond perception radius cause no direct local pressure');
  f=fixture(1,5,550);const full=view(f).outmatched;f.e.forEach(u=>u.x+=50);ok(view(f).outmatched<full,'more distant opposition has less influence');
  f=fixture(1,5,550);f.b.obs=[{kind:'rock',x:475,y:300,r:55}];v=view(f);ok(!v.outmatched&&!v.overwhelmed,'obstructed enemies do not contribute visible threat');
  f.b.obs[0].kind='tree';ok(!view(f).outmatched,'existing trees also obstruct morale perception');
  f=fixture(1,5,550);f.e.forEach(u=>u.rout=true);ok(!view(f).outmatched,'routing enemies do not count as threatening fighting strength');
  f=fixture(1,1,430);f.e[0].s={...f.e[0].s,dmg:1000};v=view(f);ok(v.overwhelmed>0,'one much stronger close enemy can overwhelm without a headcount majority');
  f=fixture(1,4,430);f.e.forEach((u,i)=>{u.x=i<2?430:370;u.y=300});v=view(f);ok(v.overwhelmed>0,'substantial threats on opposite sides create close pressure');
  f=fixture(15,4,550);f.a.slice(0,14).forEach(u=>{u.x=310;u.y=300});f.u=f.a[14];f.u.x=400;f.u.y=300;f.e.forEach((u,i)=>{u.x=i<2?425:375;u.y=300});v=view(f);ok(v.confidence>0&&v.overwhelmed>0,'wider confidence can coexist with a genuinely overwhelmed isolated frontline');
  f=fixture();v=view(f);ok(v.cohesion>.9,'aligned neighbours occupying coherent slots and covering both flanks give strong cohesion');
  f.a.filter(u=>u!==f.u).forEach(u=>u.x+=100);ok(view(f).cohesion===0,'distant friendly reserves do not count as immediate cohesion');
  f=fixture();f.a.filter(u=>u!==f.u).forEach(u=>u.rout=true);ok(view(f).cohesion===0,'routing neighbours provide no cohesion');
  f=fixture();f.b.groups[testGroup('inf')].order='withdraw';ok(view(f).cohesion===0,'withdrawal is not a coherent holding line');
  f=fixture();f.b.groups[testGroup('inf')].order='charge';f.b.groups[testGroup('inf')].run=true;ok(view(f).cohesion>.9,'a coherent line standing in melee retains cohesion despite its attack order');f.a.forEach(u=>u.spdNow=20);ok(view(f).cohesion===0,'running soldiers do not count as a settled supporting line');
  f=fixture();f.a.filter(u=>u!==f.u).forEach(u=>{u.inSlot=false;u.dir=Math.PI});ok(view(f).cohesion===0,'neighbours facing away do not provide aligned support');
  f=fixture();f.a.filter(u=>u!==f.u).forEach(u=>u.sx+=100);ok(view(f).cohesion===0,'nearby but scattered relative slots do not create a coherent formation');
  f=fixture();f.a.filter(u=>u!==f.u&&u.y<f.u.y).forEach(u=>u.x+=100);ok(view(f).cohesion<v.cohesion,'loss of flank coverage weakens cohesion');
  f=fixture();tick(f,.01);const target=f.u,other=f.a.find(u=>u!==target),m=target.mor;kill(other);const supported=m-target.mor;
  f=fixture();f.a.filter(u=>u!==f.u).forEach(u=>u.sx+=100);tick(f,.01);const m2=f.u.mor;kill(f.a.find(u=>u!==f.u));ok(m2-f.u.mor>supported,'cohesion softens casualty shock without changing health or damage');
  f=fixture(20,20,440);const u=f.u;kill(f.a.find(q=>q!==u));tick(f,0);const low=u.mor,strain=u.lossStrain;
  tick(f,0);f.b.sel=testGroup('inf');t.setOrderUI();ok(document.getElementById('bInfo').textContent.includes('Recent-loss pressure')&&t.grpMorale(f.a).weak.includes('recentloss'),'recent-loss pressure is explained in selected details and badge metadata');
  const panel=document.getElementById('bInfo'),line=[...panel.querySelectorAll('.bi-flags')].find(e=>e.textContent.includes('Cohesion'));ok(line&&line.getBoundingClientRect().bottom<=panel.getBoundingClientRect().bottom&&getComputedStyle(panel).overflowY==='auto','expanded details keep morale context visible and allow overflow scrolling');
  f.b.t+=2;t.moraleTick(0);ok(u.lossStrain<strain&&u.mor>low&&u.mor<u.mor0,'recent pressure fades but part of the casualty loss remains');
  const paused=u.mor;t.moraleTick(0);ok(near(u.mor,paused),'releasing loss memory with no combat time cannot heal morale twice');
  f=fixture(20,20,440);const burst=f.u;f.a.filter(q=>q!==burst).slice(0,4).forEach(kill);tick(f,0);const burstMorale=burst.mor;
  f=fixture(20,20,440);const spaced=f.u;for(const q of f.a.filter(q=>q!==spaced).slice(0,4)){f.b.t+=5;t.moraleTick(0);kill(q)}t.moraleTick(0);ok(burstMorale<spaced.mor,'rapid losses cause more immediate panic than equal losses spread over time');
  f=fixture(1,20,550);tick(f,.1);ok(f.u.outmatched>0&&!f.u.overwhelmed,'simulation publishes separate awareness and local-pressure values');
  f.b.sel=testGroup('inf');t.setOrderUI();ok(document.getElementById('bInfo').textContent.includes('Outmatched'),'selected details explain wider outmatched pressure');
  f=fixture();f.b.noMorale=true;const unchanged=f.u.mor;tick(f,3);ok(f.u.mor===unchanged&&f.u.cohesion==null,'morale-disabled battles do not update context or strain');
  f=fixture(1,20,550);const before=view(f).outmatched;f.b.units.reverse();ok(near(view(f).outmatched,before),'perception strength is independent of unit iteration order');
  f=fixture(1,5,550);tick(f,.01);const old=f.u.outmatched;kill(f.e[0]);tick(f,.01);ok(f.u.outmatched<old,'a death invalidates cached awareness before the regular perception interval');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
