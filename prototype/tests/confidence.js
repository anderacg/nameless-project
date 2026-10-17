'use strict';
// Fixed positions separate morale rules from damage, pathfinding and army AI.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,L=t.BattleLab;
 try{
  const fixture=(left=100,right=25)=>{if(L.active)L.exit();L.start({left:'hum_levy',leftCount:left,right:'hum_levy',rightCount:right,ai:false,paused:true,morale:true});const b=t.B,a=b.units.filter(u=>u.team===0),e=b.units.filter(u=>u.team===1);a.forEach(u=>{u.x=400;u.y=300});e.forEach(u=>{u.x=440;u.y=300});return {b,a,e}};
  const tick=(f,dt)=>{f.b.t+=dt;t.moraleTick(dt)};
  let f=fixture(),u=f.a[0];tick(f,1);ok(u.confidence>0&&u.mor>u.mor0,'100 vs 25 local superiority builds positive morale confidence');
  t.setOrderUI();f.b.sel=testGroup('inf');t.bhudInfo();ok(document.querySelector('[data-grp="'+testGroup('inf')+'"]').textContent.includes('confident')&&document.getElementById('bInfo').textContent.includes('Confident'),'unit cards and selected-group details show the confidence benefit');
  const badge=document.querySelector('[data-grp="'+testGroup('inf')+'"] [data-status=confident]');ok(badge&&badge.querySelector('title').textContent.includes('visible')&&badge.querySelector('title').textContent.includes('strength advantage')&&badge.getAttribute('role')==='img','confidence card icon explains visible strength and has an accessible label');
  ok(!!document.querySelector('#bInfo [data-status=confident]')&&t.statusOf(t.grpMorale(f.a)).includes('confident'),'confidence appears in selected details and shared battlefield badge metadata');
  let painted=0;const fill=t.ctx.fillRect;t.ctx.fillRect=function(...args){if(this.fillStyle===t.BADGE_RIM.confident)painted++;return fill.apply(this,args)};try{t.drawUnitIcons()}finally{t.ctx.fillRect=fill}ok(painted>0,'green confidence badge pixels are drawn beside battlefield group banners');
  // Keep opponents from routing while measuring the bonus cap itself, rather than ending the local advantage.
  f.e.forEach(q=>q.mor=1000);
  for(let i=0;i<100;i++)tick(f,.2);ok(u.mor<=Math.min(100,u.mor0+12)&&u.mor>u.mor0,'confidence is capped rather than scaling morale with army size');
  const before=u.mor;t.shake(u,10);const confidentLoss=before-u.mor;
  f=fixture(25,25);u=f.a[0];tick(f,1);ok(!(u.confidence>0)&&u.mor===u.mor0,'equal nearby forces do not create a superiority bonus');const m=u.mor;t.shake(u,10);ok(confidentLoss<m-u.mor,'confidence reduces morale shock without making units immune');
  t.setOrderUI();ok(!document.querySelector('[data-grp="'+testGroup('inf')+'"] [data-status=confident]'),'confidence badge disappears when the local advantage is absent');
  f=fixture();f.a.slice(1).forEach(q=>q.x=100);tick(f,.2);ok(!(f.a[0].confidence>0),'an isolated soldier gets no confidence from distant reserves');
  f=fixture();f.a.forEach(q=>q.hp=q.max*.05);tick(f,.2);ok(!(f.a[0].confidence>0),'severely wounded troops contribute less supporting strength');
  f=fixture();f.e.forEach(q=>{q.s={...q.s,dmg:q.s.dmg*100};q.max*=4;q.hp=q.max});tick(f,.2);ok(!(f.a[0].confidence>0)&&f.e[0].confidence>0,'stronger enemy quality can outweigh superior friendly headcount');
  f=fixture();f.a.slice(1).forEach(q=>q.rout=true);tick(f,.1);ok(!(f.a[0].confidence>0),'routing allies are not counted as reassuring support');
  f=fixture();f.b.groups[testGroup('inf')].withdraw();tick(f,.1);ok(!(f.a[0].confidence>0),'a withdrawing army does not gain an eager-to-fight bonus');
  f=fixture(25,100);tick(f,.2);ok(f.e[0].confidence>0&&f.e[0].mor>f.e[0].mor0,'the same confidence rule benefits the enemy side');
  // Morale is owned by each formation (BattleResolve); soldier fields are mirrors, so these checks drive the group state.
  const multi=(n=5,size=2,right=8)=>{if(L.active)L.exit();L.start({leftGroups:Array.from({length:n},()=>({type:'hum_levy',count:size})),rightGroups:[{type:'hum_levy',count:right}],ai:false,paused:true,morale:true,deploy:false,seed:42});const b=t.B,gs=t.playerGroups().map(id=>b.groups[id]),e=b.units.filter(u=>u.team===1);b.obs=[];b.units.forEach(u=>{u.x=u.team?440:400;u.y=300});return {b,gs,R:gs.map(g=>g.resolve),e,a:gs.flatMap(g=>g.units)}};
  f=fixture();let r=t.resolveOf(f.a[0]);r.mor=-1;tick(f,.01);ok(!r.routed&&r.confidence===0,'numerical superiority does not erase the breaking period');tick(f,t.RESOLVE.breakDelay);ok(r.routed&&f.a.every(q=>q.rout),'sustained broken morale still routes despite numerical superiority');
  f=fixture();f.b.noMorale=true;f.a[0].mor=25;tick(f,1);ok(f.a[0].mor===25,'morale-disabled test battles remain unaffected');
  // A single break may push neighbouring formations below zero, but they cannot spread new shocks in this same update.
  let w=multi();w.R[1].mor=w.R[2].mor=5;t.rout(w.gs[0].units[0]);tick(w,0);ok(w.R.filter(q=>q.routed).length===1,'routing does not cascade into more routes during the same morale update');
  tick(w,.01);ok(!w.R[1].routed&&!w.R[2].routed&&w.R[1].breakT>0,'shaken neighbours enter breaking before routing');
  const neighbour=w.R[3].mor;t.rout(w.gs[1].units[0]);t.rout(w.gs[2].units[0]);tick(w,0);ok(Math.abs(w.R[3].mor-neighbour)<.00001,'multiple nearby breaks cannot stack repeated routing shocks inside the cooldown');
  w.b.t+=1.1;t.rout(w.gs[4].units[0]);t.moraleTick(0);ok(w.R[3].mor<neighbour,'routing shock can apply again after the cooldown');
  const after=w.R[3].mor;t.rout(w.gs[0].units[0]);t.moraleTick(0);ok(w.R[3].mor===after,'repeated rout calls on an already routing formation do not generate fresh shocks');
  w=multi();w.R[1].mor=w.R[2].mor=5;t.rout(w.gs[0].units[0]);w.b.units.reverse();tick(w,0);ok(w.R.filter(q=>q.routed).length===1,'same-update routing count is independent of unit-array order');
  w=multi(2,50,25);tick(w,.1);t.rout(w.gs[0].units[0]);tick(w,.1);ok(w.R[1].confidence===0&&w.R[1].confidenceBlockedUntil>w.b.t,'a nearby break temporarily suppresses numerical confidence');
  tick(w,.1);ok(w.R[1].confidence===0,'confidence cannot immediately erase a fresh panic shock');tick(w,2.1);ok(w.R[1].confidence>0,'confidence can return after local panic subsides');
  f=fixture();tick(f,.1);r=t.resolveOf(f.a[1]);const was=r.mor;f.a[0].leader={};t.applyDmg(f.a[0],f.a[0].hp+10,1,'slash');ok(r.confidence===0&&was-r.mor>=t.MORALE.lead,'leader death overrides confidence and still deals a serious morale shock');
  if(L.active)L.exit();L.start({left:'hum_levy',leftCount:100,right:'hum_levy',rightCount:25,ai:true,paused:true,morale:true,seed:42});for(let i=0;i<12&&!L.session.result;i++)L.step(600);
  ok(L.session.result==='Left side wins'&&t.B.units.some(q=>q.team===0&&q.hp>0),'a seeded 100-vs-25 equal-unit battle completes with the larger force winning');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
