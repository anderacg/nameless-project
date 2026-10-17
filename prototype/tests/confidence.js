'use strict';
// Confidence: a formation that sees itself clearly stronger nearby earns a bonus, shown on its card, details and banner. Fixed
// positions separate morale rules from damage, pathfinding and army AI. Morale is owned by each formation (BattleResolve);
// soldier fields are mirrors, so the checks read the resolve. (The cap, equal armies, the enemy side, leader loss and route
// cascades in the same update are checked in groupmorale.js.)
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,L=t.BattleLab;
 try{
  const fixture=(left=100,right=25)=>{if(L.active)L.exit();L.start({left:'hum_levy',leftCount:left,right:'hum_levy',rightCount:right,ai:false,paused:true,morale:true,seed:42});const b=t.B,a=b.units.filter(u=>u.team===0),e=b.units.filter(u=>u.team===1);a.forEach(u=>{u.x=400;u.y=300});e.forEach(u=>{u.x=440;u.y=300});return {b,a,e,r:t.resolveOf(a[0])}};
  const tick=(f,dt)=>{f.b.t+=dt;t.moraleTick(dt)},inf=()=>testGroup('inf'),card=()=>document.querySelector('[data-grp="'+inf()+'"]');
  let f=fixture();tick(f,1);/* (100 against 25 nearby: confident) */
  t.setOrderUI();f.b.sel=inf();t.bhudInfo();ok(f.r.confidence>0&&card().textContent.includes('confident')&&document.getElementById('bInfo').textContent.includes('Confident'),'unit cards and selected-group details show the confidence benefit');
  const badge=card().querySelector('[data-status=confident]');ok(badge&&badge.querySelector('title').textContent.includes('visible')&&badge.querySelector('title').textContent.includes('strength advantage')&&badge.getAttribute('role')==='img','confidence card icon explains visible strength and has an accessible label');
  ok(!!document.querySelector('#bInfo [data-status=confident]')&&t.statusOf(t.grpMorale(f.a)).includes('confident'),'confidence appears in selected details and shared battlefield badge metadata');
  let painted=0;const fill=t.ctx.fillRect;t.ctx.fillRect=function(...args){if(this.fillStyle===t.BADGE_RIM.confident)painted++;return fill.apply(this,args)};try{t.drawUnitIcons()}finally{t.ctx.fillRect=fill}ok(painted>0,'green confidence badge pixels are drawn beside battlefield group banners');
  let before=f.r.mor;t.shake(f.a[0],10);const confidentLoss=before-f.r.mor;
  f=fixture(25,25);tick(f,1);before=f.r.mor;t.shake(f.a[0],10);ok(!(f.r.confidence>0)&&confidentLoss>0&&confidentLoss<before-f.r.mor,'confidence reduces morale shock without making units immune');
  t.setOrderUI();ok(!card().querySelector('[data-status=confident]'),'confidence badge disappears when the local advantage is absent');
  const conf=u=>t.resolveOf(u).confidence>0;
  f=fixture();f.a.slice(1).forEach(q=>q.x=100);tick(f,.2);ok(!conf(f.a[0]),'an isolated soldier gets no confidence from distant reserves');
  f=fixture();f.a.forEach(q=>q.hp=q.max*.05);tick(f,.2);ok(!conf(f.a[0]),'severely wounded troops contribute less supporting strength');
  f=fixture();f.e.forEach(q=>{q.s={...q.s,dmg:q.s.dmg*100};q.max*=4;q.hp=q.max});tick(f,.2);ok(!conf(f.a[0])&&conf(f.e[0]),'stronger enemy quality can outweigh superior friendly headcount');
  f=fixture();f.a.slice(1).forEach(q=>q.rout=true);tick(f,.1);ok(!conf(f.a[0]),'routing allies are not counted as reassuring support');
  f=fixture();f.b.groups[inf()].withdraw();tick(f,.1);ok(!conf(f.a[0]),'a withdrawing army does not gain an eager-to-fight bonus');
  f=fixture();let r=f.r;r.mor=-1;tick(f,.01);ok(!r.routed&&r.confidence===0,'numerical superiority does not erase the breaking period');tick(f,t.RESOLVE.breakDelay);ok(r.routed&&f.a.every(q=>q.rout),'sustained broken morale still routes despite numerical superiority');
  // A single break may push neighbouring formations below zero, but they cannot spread new shocks in this same update.
  const multi=(n=5,size=2,right=8)=>{if(L.active)L.exit();L.start({leftGroups:Array.from({length:n},()=>({type:'hum_levy',count:size})),rightGroups:[{type:'hum_levy',count:right}],ai:false,paused:true,morale:true,deploy:false,seed:42});const b=t.B,gs=t.playerGroups().map(id=>b.groups[id]),e=b.units.filter(u=>u.team===1);b.obs=[];b.units.forEach(u=>{u.x=u.team?440:400;u.y=300});return {b,gs,R:gs.map(g=>g.resolve),e,a:gs.flatMap(g=>g.units)}};
  let w=multi();w.R[1].mor=w.R[2].mor=5;t.rout(w.gs[0].units[0]);tick(w,0);tick(w,.01);
  const neighbour=w.R[3].mor;t.rout(w.gs[1].units[0]);t.rout(w.gs[2].units[0]);tick(w,0);ok(Math.abs(w.R[3].mor-neighbour)<.00001,'multiple nearby breaks cannot stack repeated routing shocks inside the cooldown');
  w.b.t+=1.1;t.rout(w.gs[4].units[0]);t.moraleTick(0);ok(w.R[3].mor<neighbour,'routing shock can apply again after the cooldown');
  w=multi();w.R[1].mor=w.R[2].mor=5;t.rout(w.gs[0].units[0]);w.b.units.reverse();tick(w,0);ok(w.R.filter(q=>q.routed).length===1,'same-update routing count is independent of unit-array order');
  w=multi(2,50,25);tick(w,.1);t.rout(w.gs[0].units[0]);tick(w,.1);ok(w.R[1].confidence===0&&w.R[1].confidenceBlockedUntil>w.b.t,'a nearby break temporarily suppresses numerical confidence');
  tick(w,.1);ok(w.R[1].confidence===0,'confidence cannot immediately erase a fresh panic shock');tick(w,2.1);ok(w.R[1].confidence>0,'confidence can return after local panic subsides');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
