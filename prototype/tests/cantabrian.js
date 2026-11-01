'use strict';
window.PHONE=true;// (run in a phone's window, 844 x 390 with touch: tests/run-tests.ps1; the phone's order bar below)
// The Cantabrian circle (battle/formations.js FORMS.cantabrian, CANTABRIAN; battlecontrol.js loop; the owner, 2026-11-01): horse
// archers ride a loop round its middle in single file, shooting as they pass (their Shoots on the move), never standing still; its
// size by the drag, as a circle's; a move order moves its middle, Hold stops it, Charge and Withdraw break it; O and the ring's
// button; on a phone the ring's button fits the bar, for spears (a circle) and horse archers alike.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,L=t.BattleLab,F=t.FORMS.cantabrian,q=s=>document.querySelector(s);
 const lab=(left,right=[{type:'hum_foot',count:6}])=>{if(L.active)L.exit();G.mode='world';G.modal=false;L.start({mode:'army',leftGroups:left,rightGroups:right,morale:true,deploy:false,paused:true,ai:false,seed:42});const B=t.B;B.obs=[];G.mode='battle';
  t.playerGroups().map(id=>B.groups[id]).forEach((g,i)=>{g.placeAt(320,200+i*120);g.face=0;t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy})});
  Object.values(B.groups).filter(g=>g.foe).forEach(g=>{g.placeAt(560,200);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0);u.s={...u.s,spd:0};u.cd=999})});return B};
 const key=k=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code:'Key'+k.toUpperCase(),bubbles:true}));
 try{
  let B=lab([{type:'hum_hbow',count:8}]);const g=B.groups[t.playerGroups().find(id=>t.grpUnits(id).length)],m=()=>t.grpUnits(g.id);t.selectGroup(g.id);
  ok(t.onTheMove(m()[0].s)&&t.formFits(g.id,'cantabrian'),'horse archers: they shoot on the move, the Cantabrian circle theirs');
  // ---- its size: one ring, from the drag
  {g.setForm('cantabrian');const P=t.formPlan(320,160,320,240)[0],R=t.circleRings(8,P.files,F,true);g.setForm('line');
   ok(P.files===Math.round(Math.PI*80/F.gx)&&R.length===1&&R[0][1]===8&&Math.abs(2*R[0][0]-80)<F.gx,'a line dragged 80 px: one ring that wide ('+(2*R[0][0]).toFixed(0)+' px), single file');
   ok(t.circleRings(8,2,F,true).length===1&&t.circleRings(8,2,F,true)[0][1]===8,'too small for them: as wide as holds them all on one ring')}
  key('o');ok(g.form==='cantabrian','O: the Cantabrian circle');t.setOrderUI();{const b=q('#bRing');ok(b&&!b.disabled&&b.classList.contains('on')&&/Cantabrian/.test(b.title+b.textContent),'the ring\'s button: the Cantabrian circle\'s, lit')}
  t.formDragTo(320,140,320,260);g.units.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy});const R0=Math.hypot(m()[0].sx,m()[0].sy);
  // ---- it keeps riding and shooting
  {const foes=B.units.filter(u=>u.team===1),hp0=foes.reduce((a,u)=>a+u.hp,0),a0=Math.atan2(m()[0].sy,m()[0].sx),still=new Set();let shots=0,mv=0;
   for(let k=0;k<8;k++){const at=m().map(u=>[u.x,u.y]);L.step(30);m().forEach((u,i)=>{if(Math.hypot(u.x-at[i][0],u.y-at[i][1])<2)still.add(u.id)});mv+=m().filter(u=>u.spdNow>0).length}
   shots=m().filter(u=>u.atkAt>0).length;const hp1=foes.reduce((a,u)=>a+u.hp,0),turned=t.angGap(Math.atan2(m()[0].sy,m()[0].sx),a0),C=g.centre(),off=Math.max(...m().map(u=>Math.abs(Math.hypot(u.x-g.ax,u.y-g.ay)-R0)));
   ok(g.looping&&turned>.3&&!still.size,'in 4 s its places turn round its middle ('+turned.toFixed(2)+' rad) and every rider keeps moving');
   ok(off<14,'single file round the loop: each rider within '+off.toFixed(1)+' px of its ring ('+R0.toFixed(0)+' px round)');
   ok(shots>=4&&hp1<hp0,'and they shoot as they pass: '+shots+' of 8 loosed, the foe hurt ('+Math.round(hp0-hp1)+' hp)')}
  // ---- Hold stops it; a move order moves its middle and it rides on
  {g.hold();const s0=g.spin;L.step(60);ok(g.still&&!g.looping&&g.spin===s0&&g.form==='cantabrian','Hold: the loop stops, its riders stand in their places');
   const x0=g.ax;t.rtsOrder(g.ax-60,g.ay);ok(!g.still&&g.looping&&Math.abs(g.ax-(x0-60))<2,'a move order moves its middle 60 px, the loop riding again');
   L.step(240);const C=g.centre();ok(Math.abs(C.x-g.ax)<12&&g.spin!==s0,'there in 4 s, still riding round it (its men\'s middle '+Math.abs(C.x-g.ax).toFixed(1)+' px off it)')}
  // ---- Charge and Withdraw break it
  t.chargeOrder();ok(g.form==='line'&&g.order==='charge'&&g.spin==null,'Charge (G) breaks it into a line');
  g.setForm('cantabrian');g.withdraw();ok(g.form==='line'&&g.order==='withdraw','and Withdraw');
  // ---- with the game's physics (riders that speed up, brake and wheel: physics.js): still a loop, still moving
  {const ph=t.PHYSICS.on;t.PHYSICS.on=true;try{const B2=lab([{type:'hum_hbow',count:8}]),h=B2.groups[t.playerGroups().find(id=>t.grpUnits(id).length)],men=t.grpUnits(h.id);t.selectGroup(h.id);t.ringForm();
    men.forEach(u=>{u.x=h.ax+u.sx;u.y=h.ay+u.sy});L.step(120);const R=Math.hypot(men[0].sx,men[0].sy),at=men.map(u=>[u.x,u.y]);L.step(60);
    const off=Math.max(...men.map(u=>Math.abs(Math.hypot(u.x-h.ax,u.y-h.ay)-R))),moved=Math.min(...men.map((u,i)=>Math.hypot(u.x-at[i][0],u.y-at[i][1])));
    ok(h.looping&&off<R*.5&&moved>8,'physics on: the riders wheel round the loop, within '+off.toFixed(1)+' px of its ring ('+R.toFixed(0)+' px round), each at least '+moved.toFixed(0)+' px a second')}finally{t.PHYSICS.on=ph}}
  // ---- the phone's order bar: the ring's button fits, spears' (a circle) and horse archers' (theirs)
  if(window.mobileBattleHud?.enabled||window.mobileWorldHud?.media.matches){for(const [type,f] of [['hum_pike','circle'],['hum_hbow','cantabrian']]){B=lab([{type,count:8}]);t.selectGroup(t.playerGroups().find(id=>t.grpUnits(id).length));t.frame();t.setOrderUI();
    const tg=document.getElementById('battleOrdersToggle');if(tg)tg.click();const D=document.getElementById('battleOrderChoices'),shown=e=>!!e.getClientRects().length&&getComputedStyle(e).display!=='none',r=e=>e.getBoundingClientRect();
    const bs=D?[...D.querySelectorAll('.borders .obtn')].filter(shown):[],b=D&&D.querySelector('#bRing'),over=bs.some((a,i)=>bs.some((c,j)=>j>i&&!(r(a).right<=r(c).left+.5||r(c).right<=r(a).left+.5||r(a).bottom<=r(c).top+.5||r(c).bottom<=r(a).top+.5)));
    ok(b&&shown(b)&&!b.disabled&&r(b).width>=44&&r(b).height>=44&&r(b).left>=r(D).left-.5&&r(b).right<=r(D).right+.5&&!over,'on a phone ('+innerWidth+' × '+innerHeight+'), '+type+': the ring\'s button in the bar, '+Math.round(r(b).width)+' × '+Math.round(r(b).height)+' px, none over another ('+bs.length+' buttons)');
    b.click();const gr=B.groups[t.playerGroups().find(id=>t.grpUnits(id).length)];ok(gr.form===f,'a tap: '+t.FORMS[f].n.toLowerCase());window.mobileBattleHud?.close()}}
  else info('(not a phone window: the phone bar unchecked)');
  ok(!ERR.length,'no runtime errors');
 }finally{if(L.active)L.exit()}
});
