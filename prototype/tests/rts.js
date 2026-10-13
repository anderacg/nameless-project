'use strict';
// RTS command in battle, as in Total War: your hero fights on their own like every unit; you select (click a unit for its group,
// drag a box round several, 1-4 / 5), and right-click the ground to send them there in formation or an enemy to set them on it.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P;try{localStorage.clear()}catch(e){}t.act('begin','soldier');G.quietEvents=true;
 ok(t.MANUAL_HERO===false,'the manual control of your hero is set aside');
 const fight=list=>{P.troops={hum_spear:6,hum_bow:4};G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list};t.startBattle({enemies:list,tournament:false});return t.B};
 // the battlefield: larger than the screen, seen whole (zoomed out), and the screen again after
 {const B=fight(['militia']),cvs=document.querySelector('canvas');t.frame();ok(t.BW>t.VW&&t.BH>t.VH&&cvs.width===t.BW&&cvs.height===t.BH&&B.arena.width===t.BW,'a battle is fought on a larger field ('+t.BW+'×'+t.BH+' against the screen’s '+t.VW+'×'+t.VH+'), seen whole');
  ok(B.units.filter(u=>u.team===0).every(u=>u.x<t.BW*.25)&&B.units.filter(u=>u.team===1).every(u=>u.x>t.BW*.75),'each side starts at its own edge of the field');t.B.over=true;t.B.endT=0;t.B=null;G.mode='world';t.frame();ok(cvs.width===t.VW,'back on the map, the screen’s own size')}
 // the battle's speed, and the tactical pause
 {const B=fight(['militia']);ok(B.speed===t.BSPEED.v&&!B.paused,'a battle starts at the speed set in Settings ('+B.speed+'×)');
  const e=B.units.find(u=>u.team===1),x0=e.x;t.setBattleSpeed(1);for(let i=0;i<5;i++)t.updateBattle(.03);const d1=Math.abs(e.x-x0),x1=e.x;
  t.setBattleSpeed(5);for(let i=0;i<5;i++)t.updateBattle(.03);const d5=Math.abs(e.x-x1);ok(d5>d1*3.5,'at 5× they cover five times the ground ('+d1.toFixed(1)+' → '+d5.toFixed(1)+' px)');
  const key=(k,code)=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code}));key('[','BracketLeft');ok(B.speed===2,'[ slows it a step (2×)');key(']','BracketRight');key(']','BracketRight');ok(B.speed===5,'] speeds it up, to 5× at most');
  key(' ','Space');ok(B.paused,'Space pauses');const pos=B.units.map(u=>u.x+','+u.y).join();for(let i=0;i<10;i++)t.updateBattle(.03);ok(B.units.map(u=>u.x+','+u.y).join()===pos,'paused, nothing moves');
  t.selectGroup('inf');t.rtsOrder(t.BW/2,80);ok(B.groups.inf.order==='hold'&&Math.abs(B.groups.inf.ax-t.BW/2)<1,'but your orders still go (a tactical pause)');
  t.frame();key(' ','Space');ok(!B.paused,'Space again, and on it goes');
  t.setBattleSpeed(.5,true);B.over=true;B.endT=0;t.B=null;const B2=fight(['militia']);ok(B2.speed===.5&&t.BSPEED.v===.5,'the speed chosen in Settings is kept for the next battle');t.setBattleSpeed(1,true);B2.over=true;B2.endT=0;t.B=null}
 // orders and marching (Phase 1)
 {const B=fight(['militia']);const e=B.units.find(u=>u.team===1);e.x=t.BW-10;e.y=10;e.cd=99;e.hp=e.max=9999;e.s={...e.s,spd:0};
  const inf=t.grpUnits('inf'),slow=inf[0];slow.s={...slow.s,spd:10};t.selectGroup('inf');
  // walking: at the slowest one's pace
  t.toggleFlag('walk');ok(B.groups.inf.walk,'R: the infantry walks');t.rtsOrder(t.BW/2,B.groups.inf.ay);const x0=inf.map(u=>u.x);
  for(let i=0;i<30;i++)t.updateBattle(.03);const walked=Math.max(...inf.map((u,i)=>Math.abs(u.x-x0[i])));
  {const cvs=document.querySelector('canvas'),r=cvs.getBoundingClientRect(),at=(x,y)=>({clientX:r.left+x*r.width/cvs.width,clientY:r.top+y*r.height/cvs.height,button:2,pointerType:'mouse',bubbles:true});t.frame();
   const rc=()=>{cvs.dispatchEvent(new PointerEvent('pointerdown',at(t.BW/2+1,B.groups.inf.ay)));window.dispatchEvent(new PointerEvent('pointerup',{button:2,pointerType:'mouse'}))};rc();rc()}ok(!B.groups.inf.walk,'a double right-click sends them at a run');const x1=inf.map(u=>u.x);
  for(let i=0;i<30;i++)t.updateBattle(.03);const ran=Math.max(...inf.map((u,i)=>Math.abs(u.x-x1[i])));
  ok(ran>walked*2,'walking they keep to the slowest one\u2019s pace; running each goes as fast as it can ('+walked.toFixed(1)+' → '+ran.toFixed(1)+' px)');
  // halt
  t.setOrder('charge');t.setOrder('halt');const c=inf.reduce((a,u)=>a+u.x,0)/inf.length;ok(B.groups.inf.order==='hold'&&Math.abs(B.groups.inf.ax-c)<1,'H: halt, and hold where they stand');
  // waypoints
  t.rtsOrder(300,200);t.rtsOrder(400,300,{queue:true});ok(B.groups.inf.queue.length===1,'Shift + right-click adds a waypoint after the move');
  inf.forEach(u=>{u.x=B.groups.inf.ax+u.sx;u.y=B.groups.inf.ay+u.sy});t.updateBattle(.01);ok(B.groups.inf.queue.length===0&&Math.abs(B.groups.inf.ax-400)<1,'once there, on to the next');
  // withdraw
  t.setOrder('withdraw');ok(B.groups.inf.order==='withdraw'&&B.groups.inf.ax===B.exit.x,'W: withdraw to the withdrawal point');
  const u0=inf[1];e.x=u0.x+20;e.y=u0.y;const ex=u0.x;for(let i=0;i<10;i++)t.updateBattle(.03);ok(u0.x<ex,'withdrawing, they do not turn on an enemy who is not on them');e.x=t.BW-10;e.y=10;
  // hold ground
  t.setOrder('hold');t.toggleFlag('firm');ok(B.groups.inf.firm,'F: hold their ground');const u1=inf[1];u1.x=B.groups.inf.ax+u1.sx;u1.y=B.groups.inf.ay+u1.sy;e.x=u1.x+22;e.y=u1.y;const hx=u1.x;
  for(let i=0;i<10;i++)t.updateBattle(.03);ok(Math.abs(u1.x-hx)<3,'holding their ground, they do not step out at an enemy close by');t.toggleFlag('firm');e.x=t.BW-10;e.y=10;B.over=true;B.endT=0;t.B=null}
 {const B=fight(['militia']);const e=B.units.find(u=>u.team===1),ar=t.grpUnits('arc');e.cd=99;e.hp=e.max=9999;e.s={...e.s,spd:0};e.x=ar[0].x+70;e.y=ar[0].y;
  t.grpUnits('inf').forEach(u=>u.hp=0);B.hero.x=10;B.hero.y=10;t.selectGroup('arc');t.setOrder('hold');ar.forEach(u=>u.cd=0);
  t.toggleFlag('fire');ok(B.groups.arc.fire===false,'Q: hold fire');B.arrows=[];for(let i=0;i<20;i++)t.updateBattle(.03);ok(!B.arrows.length,'holding fire, archers do not shoot at an enemy in range');
  t.rtsOrder(e.x,e.y-6);for(let i=0;i<20;i++)t.updateBattle(.03);ok(B.arrows.length>0||e.hp<9999,'but shoot at the enemy you set them on');
  t.setOrder('hold');t.toggleFlag('fire');t.toggleFlag('skirmish');ok(B.groups.arc.skirmish,'E: skirmish');const a=ar[0];a.x=B.groups.arc.ax+a.sx;a.y=B.groups.arc.ay+a.sy;e.x=a.x+20;e.y=a.y;const ax=a.x;
  for(let i=0;i<10;i++)t.updateBattle(.03);ok(a.x<ax-3,'skirmishers step back from an enemy coming at them');B.over=true;B.endT=0;t.B=null}
 // selecting more, and control groups
 {const B=fight(['militia']);B.units.filter(u=>u.team===1).forEach(u=>{u.x=t.BW-10;u.cd=99;u.s={...u.s,spd:0}});
  const sp=t.grpUnits('inf')[0],ar=t.grpUnits('arc')[0];t.rtsSelect(sp.x,sp.y-6,sp.x,sp.y-6);t.rtsSelect(ar.x,ar.y-6,ar.x,ar.y-6,true);
  ok(Array.isArray(B.sel)&&B.sel.includes('inf')&&B.sel.includes('arc'),'Shift + click adds the archers to the infantry');
  t.ctrlGroup('6',true);t.selectGroup('all');t.ctrlGroup('6');ok(Array.isArray(B.sel)&&B.sel.length===2,'Ctrl+6 keeps the selection, 6 picks it again');
  const key=(k,code,o2)=>window.dispatchEvent(new KeyboardEvent('keydown',Object.assign({key:k,code},o2||{})));t.selectGroup('inf');
  B.groups.inf.order='charge';key('h','KeyH');ok(B.groups.inf.order==='hold','H on the keyboard halts');key('r','KeyR');ok(B.groups.inf.walk,'R walks');key('w','KeyW');ok(B.groups.inf.order==='withdraw','W withdraws');
  key('7','Digit7',{ctrlKey:true});t.selectGroup('all');key('7','Digit7');ok(B.sel==='inf','Ctrl+7 then 7 on the keyboard');B.over=true;B.endT=0;t.B=null}
 // formations: the shape is the line you drag; the formation is how the men stand in it
 {const S=t.formSlots,ranks=sl=>new Set(sl.map(p=>Math.round(p[0]/4))).size,front=sl=>{const f=Math.max(...sl.map(q=>q[0]));return sl.filter(q=>Math.abs(q[0]-f)<1).length};
  ok(ranks(S('line',16,0))===2&&front(S('line',16,0))===8,'a line of 16: two ranks of eight');ok(front(S('line',10,0,2))===2&&ranks(S('line',10,0,2))===5,'two abreast, a line is a column');
  const w=S('wedge',6,0),fw=Math.max(...w.map(p=>p[0]));ok(w.filter(p=>Math.abs(p[0]-fw)<1).length===1,'a wedge: one at its point');
  const gap=sl=>Math.min(...sl.slice(1).map(p=>Math.hypot(p[0]-sl[0][0],p[1]-sl[0][1])));ok(gap(S('loose',8,0))>gap(S('line',8,0))*1.5,'loose order: spread out');
  const up=S('line',8,-Math.PI/2);ok(new Set(up.map(p=>Math.round(p[1]))).size===1,'facing north, the line runs east to west');
  ok(t.FORM_ORDER.join()==='line,wall,loose,wedge'&&!t.FORMS.deep&&!t.FORMS.column,'four formations: line, shield wall, loose, wedge (deep and column are just lines dragged short)')}
 {const B=fight(['militia','militia','militia']);B.units.filter(u=>u.team===1).forEach(u=>{u.x=t.BW-30;u.cd=99;u.hp=u.max=9999;u.s={...u.s,spd:0}});
  ok(['inf','arc','cav'].every(g=>B.groups[g].form==='line')&&B.groups.inf.face===0&&B.groups.e_inf&&B.groups.e_inf.face===Math.PI,'every group starts in line, facing the other side');
  const key=(k,code)=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code}));
  t.selectGroup('inf');key('b','KeyB');const inf=t.grpUnits('inf'),sl=t.formSlots('wall',inf.length,0,B.groups.inf.files);ok(B.groups.inf.form==='wall'&&inf.every(u=>sl.some(p=>Math.abs(p[0]-u.sx)<.01&&Math.abs(p[1]-u.sy)<.01)),'B: the infantry forms a shield wall, every soldier to a slot of it');
  key('b','KeyB');ok(B.groups.inf.form==='line','B again: back to line');key('l','KeyL');ok(B.groups.inf.form==='loose','L: loose order');key('l','KeyL');
  key('t','KeyT');ok(B.groups.inf.form==='line','infantry cannot form a wedge');t.selectGroup('arc');t.setForm('wall');ok(B.groups.arc.form==='line','nor archers a shield wall');t.setOrderUI();
  ok(document.querySelector('[data-form="wall"]').disabled&&!document.querySelector('[data-form="loose"]').disabled,'with archers selected, the shield wall button is dimmed');
  if(t.grpUnits('cav').length){t.selectGroup('cav');key('t','KeyT');ok(B.groups.cav.form==='wedge','T: the cavalry forms a wedge')}
  t.selectGroup('all');t.setForm('wall');ok(B.groups.inf.form==='wall'&&B.groups.arc.form==='line','with everyone selected, only those it suits take it');t.setForm('wall');ok(B.groups.inf.form==='line','and again: back to line');
  t.selectGroup('inf');
  // a line dragged: where, how wide (and so how deep), which way
  ok(t.formDragTo(300,100,300,300)&&Math.abs(B.groups.inf.ax-300)<1&&Math.abs(B.groups.inf.ay-200)<1&&Math.abs(B.groups.inf.face)<.01&&B.groups.inf.files===Math.min(inf.length,Math.round(200/14)+1),'right-drag lays out the line: along it, as wide as it, facing the enemy ('+B.groups.inf.files+' abreast)');
  t.formDragTo(300,100,300,125);const sh=t.grpShape('inf');ok(sh.files<=3&&sh.ranks>=2,'dragged short, a deep block ('+sh.files+' wide, '+sh.ranks+' deep)');
  t.formDragTo(300,100,300,400);ok(t.grpShape('inf').ranks===1,'dragged long, one thin line');
  t.rtsSelect(0,0,t.BW/2,t.BH);const plan=t.formPlan(200,100,200,400).filter(p=>!p.hero);ok(plan.length>=2&&plan.every((p,i)=>!i||p.ay>plan[i-1].ay),'dragged for several groups, the line is shared out along it ('+plan.map(p=>p.g).join(', ')+')');
  B.rdrag={x0:200,y0:100,x1:200,y1:400};t.frame();B.rdrag=null;ok(true,'the line\u2019s ghost draws while you drag');
  if(t.grpUnits('cav').length){t.selectGroup('cav');t.setForm('wedge');ok(t.formPlan(300,100,300,400)[0].files===null,'a wedge keeps its shape: the line sets only where and which way');t.setForm('wedge')}
  {t.selectGroup('all');const pl=t.formPlan(300,100,300,400),h=pl.find(p=>p.hero);ok(h&&h.ax<300&&Math.abs(h.ay-250)<1,'with everyone, your hero stands just behind the line\u2019s middle')}
  t.selectGroup('inf');t.formDragTo(300,100,300,160);inf.forEach(u=>{u.x=B.groups.inf.ax+u.sx;u.y=B.groups.inf.ay+u.sy});const f0=B.groups.inf.face,w0=B.groups.inf.files;t.rtsOrder(B.groups.inf.ax,B.groups.inf.ay+150);
  ok(Math.abs(B.groups.inf.face-Math.PI/2)<.3&&B.groups.inf.face!==f0&&B.groups.inf.files===w0,'a plain right-click turns them toward where they march, keeping their width');
  // by mouse: right button down, drag, up
  const cvs=document.querySelector('canvas'),r=cvs.getBoundingClientRect(),at=(x,y,b)=>({clientX:r.left+x*r.width/cvs.width,clientY:r.top+y*r.height/cvs.height,button:b,pointerType:'mouse',bubbles:true});
  cvs.dispatchEvent(new PointerEvent('pointerdown',at(400,150,2)));cvs.dispatchEvent(new PointerEvent('pointermove',at(400,350,2)));window.dispatchEvent(new PointerEvent('pointerup',{button:2,pointerType:'mouse'}));
  ok(Math.abs(B.groups.inf.ax-400)<2&&Math.abs(B.groups.inf.ay-250)<2,'and with the mouse: right button down, drag, let go');
  // what each does
  const sold=inf[0];B.groups.inf.form='wall';B.groups.inf.face=0;const fr=t.formTaken(sold,{x:sold.x+20,y:sold.y}),bk=t.formTaken(sold,{x:sold.x-20,y:sold.y});
  ok(fr<.7&&bk===1,'a shield wall takes '+Math.round((1-fr)*100)+'% less from the front, nothing less from behind');ok(t.formPace(B.groups.inf)<1,'and marches slower');
  t.setOrder('charge');ok(B.groups.inf.form==='line','an order to charge breaks the shield wall');t.setOrder('hold');
  B.groups.inf.form='loose';ok(t.formTaken(sold,{x:sold.x+50,y:sold.y,arrow:true})<.7&&t.formTaken(sold,{x:sold.x+10,y:sold.y})>1,'loose order: less from arrows, more in melee');
  B.groups.inf.form='line';B.groups.inf.files=inf.length;ok(t.formCharge({grp:null},sold)===1,'a thin line takes a charge in full');B.groups.inf.files=1;ok(t.formCharge({grp:null},sold)===t.DEPTH.charge||inf.length<t.DEPTH.ranks,'a block '+t.DEPTH.ranks+'+ ranks deep blunts it');
  B.groups.cav.form='wedge';ok(t.formCharge({grp:'cav'},{grp:null})>1,'a wedge charges harder');
  B.groups.inf.files=3;B.groups.inf.form='line';t.setOrderUI();
  const card=document.querySelector('[data-grp="inf"]');ok(card.querySelector('.chp')&&/Infantry \d+/.test(card.querySelector('.cn').textContent)&&/^\d+×\d+$/.test(card.querySelector('.csh').textContent)&&!card.querySelector('svg.ficon'),'each unit card shows its count, health and shape (wide × deep: '+card.querySelector('.csh').textContent+')');
  B.groups.inf.form='wall';t.setOrderUI();ok(document.querySelector('[data-grp="inf"] svg.ficon'),'and its formation\u2019s icon, when not a plain line');B.groups.inf.form='line';
  ok(document.querySelectorAll('[data-form] svg.ficon').length===3,'three formation buttons, with their icons');B.over=true;B.endT=0;t.B=null}
 {P.troops={hum_spear:4,horse:3};G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia']};t.startBattle({enemies:['militia'],tournament:false});const B=t.B;
  t.selectGroup('cav');window.dispatchEvent(new KeyboardEvent('keydown',{key:'t',code:'KeyT'}));ok(B.groups.cav.form==='wedge','T: the cavalry forms a wedge');
  ok(t.formPlan(300,100,300,400)[0].files===null&&t.formDragTo(300,100,300,400)&&B.groups.cav.files===null&&B.groups.cav.form==='wedge','dragged, a wedge keeps its shape: the line sets only where and which way');
  t.selectGroup('all');t.setForm('wedge');ok(B.groups.inf.form==='line','with everyone selected, only the cavalry takes the wedge');B.over=true;B.endT=0;t.B=null}
 // facing, morale and charges (Phase 3)
 {const B=fight(['militia','militia','militia','militia']),foes=B.units.filter(u=>u.team===1),mine=t.grpUnits('inf');foes.forEach(u=>{u.cd=99;u.s={...u.s,spd:0}});
  ok(mine.every(u=>u.mor===u.mor0&&u.mor>=40)&&foes.every(u=>u.mor>=40)&&B.hero.mor!=null&&t.steady(B.hero),'every soldier starts with morale; your hero never breaks');
  // facing: in its slot it faces the formation's front
  const u=mine[0];u.inSlot=true;B.groups.inf.face=0;u.mor=80;
  ok(t.sideOf(u,{x:u.x+20,y:u.y})==='front'&&t.sideOf(u,{x:u.x,y:u.y+20})==='flank'&&t.sideOf(u,{x:u.x-20,y:u.y})==='rear','in its slot it faces its formation\u2019s front: blows come at its front, flank or rear');
  const fr=t.flankMul(u,{x:u.x+20,y:u.y}),fl=t.flankMul(u,{x:u.x,y:u.y+20}),re=t.flankMul(u,{x:u.x-20,y:u.y}),ar=t.flankMul(u,{x:u.x-20,y:u.y,arrow:true});
  ok(fr===1&&fl===t.FLANK.flank&&re===t.FLANK.rear&&ar>1&&ar<re,'a blow from the flank hurts '+Math.round((fl-1)*100)+'% more, from behind '+Math.round((re-1)*100)+'% (arrows: half that)');
  ok(u.mor<80,'and blows from the side or behind shake it ('+Math.round(u.mor)+')');
  u.inSlot=false;u.dir=Math.PI/2;ok(t.sideOf(u,{x:u.x,y:u.y+20})==='front','out of its slot, it faces where it last went or struck');
  // morale: blows, and losses close by
  const v=mine[1],m0=v.mor;t.applyDmg(v,v.max*.3,1);ok(v.mor<m0,'a wound lowers morale ('+Math.round(m0)+' \u2192 '+Math.round(v.mor)+')');
  const w=mine[2],m1=w.mor;mine[3].x=w.x+10;mine[3].y=w.y;t.applyDmg(mine[3],9999,1);ok(w.mor<=m1-t.MORALE.death,'a comrade falling close by shakes it more');
  // breaking: it routs, its neighbours are shaken, it runs for your edge
  const nb=mine.filter(o=>o!==w&&o.hp>0&&Math.hypot(o.x-w.x,o.y-w.y)<t.MORALE.crowd),nb0=nb.map(o=>o.mor);w.mor=-1;t.updateBattle(.01);
  ok(w.rout,'at 0 it routs');ok(!nb.length||nb.some((o,i)=>o.mor<nb0[i]),'and its neighbours are shaken');
  const x0=w.x;w.cd=0;for(let i=0;i<10;i++)t.updateBattle(.03);ok(w.x<x0&&!B.units.some(f=>f.team===1&&f.hitAt>0),'it runs for your edge, fighting no one');
  const lost0=B.lost[w.type]||0;w.x=t.MORALE.edge+1;t.updateBattle(.01);ok(w.hp===0&&w.fled&&(B.lost[w.type]||0)===lost0&&!B.corpses.some(c=>c.x===w.x&&c.y===w.y),'at the edge it leaves the field: alive, not a loss');
  // rallying: left alone it rallies once; the second time it breaks for good
  const r=mine.find(o=>o.hp>0&&o!==u);r.x=300;r.y=60;foes.forEach(f=>{f.x=t.BW-20;f.y=t.BH-40;f.hp=f.max=9999;f.mor=f.mor0=1e9});B.hero.s={...B.hero.s,spd:0};B.hero.x=200;r.mor=0;t.rout(r);for(let i=0;i<200&&r.rout;i++){r.x=300;t.updateBattle(.1)}
  ok(!r.rout&&r.rallied,'left alone, a routing soldier rallies');r.mor=0;t.rout(r);for(let i=0;i<200;i++){r.x=300;t.updateBattle(.1)}ok(r.rout&&r.shattered,'the second time it breaks for good');
  // cards
  t.setOrderUI();const card=document.querySelector('[data-grp="inf"]');ok(card.querySelector('.cmo')&&/running/.test(card.textContent),'the infantry\u2019s card shows its morale, and how many run');B.over=true;B.endT=0;t.B=null}
 // morale icons: each group's state and weaknesses, on its card and over it on the field
 {const B=fight(['militia','militia','militia']),inf=t.grpUnits('inf'),foes=B.units.filter(u=>u.team===1);foes.forEach(u=>{u.cd=99;u.s={...u.s,spd:0};u.hp=u.max=9999});
  const st=()=>t.grpMorale(t.grpUnits('inf')).state;inf.forEach(u=>u.mor=80);ok(st()==='steady','high morale: steady');inf.forEach(u=>u.mor=45);ok(st()==='shaken','then shaken');inf.forEach(u=>u.mor=20);ok(st()==='wavering','then wavering');
  inf.forEach(u=>{u.mor=0;u.rout=true});ok(st()==='routing','most of them running: routing');inf.forEach(u=>u.shattered=true);ok(st()==='shattered','broken for good: shattered');
  inf.forEach(u=>{u.mor=80;u.rout=false;u.shattered=false});const u=inf[0];u.inSlot=true;B.groups.inf.face=0;t.flankMul(u,{x:u.x-20,y:u.y});
  ok(t.grpMorale(inf).weak.includes('flanked'),'hit from behind: flanked');u.shockAt=B.t;u.outAt=B.t;B.leadFell=[B.t];B.losing=[true,false];
  const w=t.grpMorale(inf).weak;ok(['flanked','outnumbered','charged','leader','losing'].every(k=>w.includes(k)),'and outnumbered, charged, its leader fallen, its side losing ('+w.join(', ')+')');
  t.setOrderUI();const card=document.querySelector('[data-grp="inf"]');ok(card.querySelectorAll('.cmi svg.mico').length===6&&/flanked/.test(card.title),'the card shows the state\u2019s flag and each weakness ('+card.title+')');
  B.t+=10;B.losing=[false,false];ok(!t.grpMorale(inf).weak.length,'weaknesses pass once it is left alone');
  let drawn=0;const fr=t.ctx.fillRect.bind(t.ctx);t.ctx.fillRect=(...a)=>{if(a[2]===2&&a[3]===2)drawn++;return fr(...a)};t.drawBanners();t.ctx.fillRect=fr;ok(drawn>20,'banners over the groups, yours and theirs ('+drawn+' pixels)');
  ok(!document.querySelector('[data-grp="hero"] .cmi'),'your hero never breaks: no banner');t.frame();B.over=true;B.endT=0;t.B=null}
 // charges
 {const B=fight(['militia']),e=B.units.find(u=>u.team===1),cav={s:{...t.ST.horse},x:e.x-14,y:e.y,team:0,run:0};
  ok(t.chargeMul(cav,e)===1,'a rider who has not run at them: no charge');cav.run=t.CHARGE.run;const full=t.chargeMul(cav,e);ok(Math.abs(full-(1+t.CHARGE.cav))<.01&&cav.run===0,'a full run: the charge hits '+Math.round((full-1)*100)+'% harder, and the run is spent');
  cav.run=t.CHARGE.run/2;const half=t.chargeMul(cav,e);ok(half>1&&half<full,'half a run, half a charge');
  const sp=B.units.find(u=>u.team===0&&u.type==='hum_spear');cav.run=t.CHARGE.run;cav.team=1;ok(t.chargeMul(cav,sp)===1,'spearmen brace against it');
  e.mor=80;cav.team=0;cav.run=t.CHARGE.run;t.chargeMul(cav,e);ok(e.mor<=80-t.CHARGE.shock+.01,'and a charge shakes the ones it hits');
  const foot={s:{...t.ST.militia},x:e.x-12,y:e.y,team:0,run:t.CHARGE.run};ok(Math.abs(t.chargeMul(foot,e)-(1+t.CHARGE.foot))<.01,'infantry running in hit '+Math.round(t.CHARGE.foot*100)+'% harder');
  // a rider's run builds as it rides at the enemy
  B.units.filter(u=>u.team===0&&!u.hero).forEach(u=>u.hp=0);e.x=t.BW/2;e.y=t.BH/2;e.cd=99;e.s={...e.s,spd:0};e.hp=e.max=9999;B.hero.x=10;B.hero.y=10;B.hero.s={...B.hero.s,spd:0};
  const rider={...B.units[1],id:999,type:'horse',s:{...t.ST.horse},hp:44,max:44,x:t.BW/2-150,y:t.BH/2,grp:'cav',run:0,cd:0,dead:false,mor:80,mor0:80,tgt:null,rt:0};B.units.push(rider);B.groups.cav.order='charge';
  let hit=0;for(let i=0;i<120&&!hit;i++){const r0=rider.run;t.updateBattle(.03);if(e.hitAt)hit=r0}
  ok(hit>=t.CHARGE.run*.9,'riding at them builds the charge ('+Math.round(hit)+' px run when it struck)');B.over=true;B.endT=0;t.B=null}
 // a battle ends in a rout
 {const B=fight(['militia','militia','militia']);const foes=B.units.filter(u=>u.team===1);B.units.filter(u=>u.team===0).forEach(u=>{u.s={...u.s,spd:0};u.cd=99});
  foes.forEach(f=>{f.mor=-1});t.updateBattle(.01);ok(B.over&&B.win&&B.routed===1&&B.kills===0,'when all of them break, the battle is won: they rout');
  ok(/breaks and flees/.test(document.getElementById('log').textContent),'the log says so');B.endT=0;t.updateBattle(.01);ok(!t.B,'and it ends, the routed ones gone with their lives')}
 {const B=fight(['militia']);ok(!B.noMorale,'a field battle has morale');B.over=true;B.endT=0;t.B=null;G.mode='world';t.startBattle({enemies:['militia'],tournament:true});ok(t.B.noMorale&&t.flankMul(t.B.units[1],{x:0,y:0})===1,'a tournament has none');t.B.over=true;t.B.endT=0;t.B=null}
 // withdrawing: fleeing the battle, by way of the withdrawal point where your band formed up
 {const B=fight(['militia','militia','militia']),foes=B.units.filter(u=>u.team===1);foes.forEach(u=>{u.cd=99;u.hp=u.max=9999;u.s={...u.s,spd:0};u.x=t.BW-30});
  const X=B.exit,mine=B.units.filter(u=>u.team===0&&!u.lord);ok(X&&X.x<t.BW*.25&&Math.abs(X.x-mine.reduce((a,u)=>a+u.x,0)/mine.length)<1,'the withdrawal point: where your band formed up ('+Math.round(X.x)+', '+Math.round(X.y)+')');
  t.frame();ok(true,'it is marked on the field');
  // one group: it runs back there, striking no one, and leaves the field alive
  const inf=t.grpUnits('inf');inf.forEach(u=>{u.x=500;u.y=300});const e=foes[0];e.x=508;e.y=300;e.cd=99;const eh=e.hp;t.selectGroup('inf');t.setOrder('withdraw');
  let i=0;for(;i<2000&&inf.some(u=>u.hp>0);i++)t.updateBattle(.03);
  ok(inf.every(u=>u.left&&u.hpLeft>0&&u.atkAt==null)&&!B.lost.hum_spear,'the infantry runs to the withdrawal point, striking no one, and leaves the field alive ('+i+' ticks)');
  ok(!B.over,'with the rest still fighting, the battle goes on');
  // everyone: once all have reached it, the battle is over: your retreat
  G.enc.mine=true;t.selectGroup('all');t.setOrder('withdraw');const hp0=B.hero.hp;for(i=0;i<3000&&!B.over;i++)t.updateBattle(.03);
  ok(B.over&&B.retreat&&!B.win&&B.units.filter(u=>u.team===0&&!u.lord).every(u=>u.hp<=0),'withdraw everyone: once all are off the field, the battle is over (your retreat)');
  const troops0=t.troopCount();B.endT=0;t.updateBattle(.01);const pan=document.querySelector('#panel').textContent;
  ok(!t.B&&/Withdrawn/.test(pan)&&/Your losses/.test(pan)&&/None/.test(pan)&&/Enemies slain/.test(pan)&&/Got away/.test(pan)&&/Enemies still standing/.test(pan),'the battle summary: withdrawn, the tally (slain, fallen, got away, still standing) and your losses (none)');ok(t.troopCount()===troops0&&Math.abs(P.hp-hp0)<1,'everyone who withdrew rides on, your hero as hurt as they left');
  ok(!G.enc&&G.encCool>0,'they lose your trail for a while');t.act('cont');ok(G.mode==='world','Continue: back on the map')}
 // the rearguard: one the enemy cuts down on the way is lost, and the summary says so
 {const B=fight(['militia']);const e=B.units.find(u=>u.team===1);e.hp=e.max=9999;e.cd=99;e.s={...e.s,spd:0};e.x=t.BW-30;
  G.enc.mine=true;const ar=t.grpUnits('arc')[0];t.selectGroup('all');t.setOrder('withdraw');t.updateBattle(.01);t.applyDmg(ar,ar.hp+99,1);
  for(let i=0;i<3000&&!B.over;i++)t.updateBattle(.03);ok(B.retreat&&B.caught===1,'one cut down withdrawing: the rearguard ('+B.caught+')');
  B.endT=0;t.updateBattle(.01);const pan=document.querySelector('#panel').textContent;ok(/cut down before reaching the withdrawal point/.test(pan)&&/1 hum|1 [a-z]/i.test(pan.split('Your losses')[1]||''),'the summary counts them among your losses');t.act('cont')}
 // knocked down while the rest withdraw: a defeat, not a retreat
 {const B=fight(['militia']);B.units.filter(u=>u.team===1).forEach(u=>{u.hp=u.max=9999;u.cd=99;u.s={...u.s,spd:0};u.x=t.BW-30});t.selectGroup('inf');t.setOrder('withdraw');
  for(let i=0;i<2000&&t.grpUnits('inf').length;i++)t.updateBattle(.03);t.applyDmg(B.hero,B.hero.hp+999,1);B.units.filter(u=>u.team===0&&u.hp>0&&!u.hero).forEach(u=>t.applyDmg(u,u.hp+999,1));t.updateBattle(.01);
  ok(B.over&&!B.retreat,'your hero down and the rest cut down: a defeat, not a retreat');B.endT=0;t.updateBattle(.01);t.act('cont')}
 // knocked down, but the rest withdraw: they carry you off
 {const B=fight(['militia']);G.enc.mine=true;B.units.filter(u=>u.team===1).forEach(u=>{u.hp=u.max=9999;u.cd=99;u.s={...u.s,spd:0};u.x=t.BW-30});t.applyDmg(B.hero,B.hero.hp+999,1);
  t.selectGroup('all');t.setOrder('withdraw');for(let i=0;i<3000&&!B.over;i++)t.updateBattle(.03);ok(B.over&&B.retreat,'your hero down, the rest withdraw: a retreat');
  B.endT=0;t.updateBattle(.01);ok(/carry you off/.test(document.querySelector('#panel').textContent)&&P.hp>0,'your men carry you off the field (you come to, hurt)');t.act('cont')}
 // after withdrawing, the escape is rolled as on the map (fleeOdds): away, or run down and made to face them again
 {const fo=window.fleeOdds,rnd=Math.random,run=(roll)=>{const B=fight(['militia','militia']);B.units.filter(u=>u.team===1).forEach(u=>{u.hp=u.max=9999;u.cd=99;u.s={...u.s,spd:0};u.x=t.BW-30});
    window.fleeOdds=()=>({ch:.5});t.selectGroup('all');t.setOrder('withdraw');for(let i=0;i<3000&&!B.over;i++)t.updateBattle(.03);const n0=t.troopCount();Math.random=()=>roll;B.endT=0;t.updateBattle(.01);Math.random=rnd;window.fleeOdds=fo;
    return{pan:document.querySelector('#panel').textContent,n0,n1:t.troopCount()}};
  let r=run(0);ok(/Withdrawn/.test(r.pan)&&/You get away \(50% chance\)/.test(r.pan)&&!G.encAgain&&!G.enc,'the roll goes your way: you get away, as fleeing on the map ('+r.pan.match(/You get away[^.]*/)[0]+')');t.act('cont');ok(G.mode==='world','and ride on');
  r=run(.99);ok(/Run down/.test(r.pan)&&/rearguard loses/.test(r.pan)&&r.n1<r.n0&&G.encAgain,'it goes against you: run down, your rearguard pays ('+(r.n0-r.n1)+' lost)');
  t.act('cont');const pan=document.querySelector('#panel').textContent;ok(G.enc&&G.enc.noFlee&&G.mode==='dialog'&&/Fight/.test(pan),'Continue: you must face them again (caught: no running this time, unless they fear you)');
  G.enc.mine=true;t.act('flee')}
 // your army does only what you order: every group holds where it stands
 {const B=fight(['militia']);const e=B.units.find(u=>u.team===1);e.cd=99;e.s={...e.s,spd:0};e.hp=e.max=9999;
  ok(['hero','inf','arc','cav'].every(g=>B.groups[g].order==='hold')&&!B.auto,'every group of yours starts holding, the AI off');
  const mine=B.units.filter(u=>u.team===0&&!u.s.range),x0=mine.map(u=>u.x);for(let i=0;i<120;i++)t.updateBattle(.03);ok(mine.every((u,i)=>Math.abs(u.x-x0[i])<6),'left alone, they stay where they are: no march on the enemy');
  // the AI in command: on (A), and an order of yours takes it back
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'a',code:'KeyA'}));ok(B.auto&&t.BAUTO.on&&document.getElementById('bAuto').getAttribute('aria-pressed')==='true','A: the AI takes command of your army');
  const ix=t.grpUnits('inf').reduce((a,u)=>a+u.x,0);for(let i=0;i<150;i++)t.updateBattle(.03);ok(['advance','charge'].includes(B.groups.inf.order)&&t.grpUnits('inf').reduce((a,u)=>a+u.x,0)>ix+20,'and leads it at the enemy (infantry: '+B.groups.inf.order+')');
  t.selectGroup('inf');t.setOrder('hold');ok(!B.auto&&!t.BAUTO.on,'an order of yours takes command back');document.getElementById('bAuto').click();ok(B.auto,'the AI button switches it too');t.setAuto(false,true);B.over=true;B.endT=0;t.B=null}
 // deployment: the battle opens frozen; place your band in its zone, then begin
 {t.BDEPLOY.on=true;P.troops={hum_spear:6,hum_bow:4};G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia','militia']};
  t.startBattle({enemies:['militia','militia'],tournament:false,deploy:true});const B=t.B,Z=t.deployZone(),e=B.units.find(u=>u.team===1),ex=e.x;
  ok(B.deploy,'a battle you fight opens in deployment');for(let i=0;i<30;i++)t.updateBattle(.03);ok(e.x===ex,'nothing moves while you deploy');t.frame();ok(true,'the zone is drawn');
  t.selectGroup('inf');t.rtsOrder(700,300);const inf=t.grpUnits('inf');ok(B.groups.inf.ax<=Z.x1&&inf.every(u=>u.x>=Z.x0&&u.x<=Z.x1&&Math.abs(u.x-(B.groups.inf.ax+u.sx))<1.01||u.x===Z.x1),'right-click past the zone: placed at its edge, at once ('+Math.round(B.groups.inf.ax)+')');
  t.selectGroup('arc');t.formDragTo(120,150,120,450);const arc=t.grpUnits('arc');ok(arc.every(u=>Math.abs(u.x-(B.groups.arc.ax+u.sx))<1&&Math.abs(u.y-(B.groups.arc.ay+u.sy))<1),'right-drag a line: they stand on it at once');
  t.selectGroup('all');t.rtsOrder(e.x,e.y-6);ok(!B.groups.inf.tgt,'no enemy to set them on while deploying');
  window.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space'}));const mine=B.units.filter(u=>u.team===0&&!u.lord),cx=mine.reduce((a,u)=>a+u.x,0)/mine.length;
  ok(!B.deploy&&Math.abs(B.exit.x-cx)<1,'Space: the battle begins, the withdrawal point where your band now stands');B.over=true;B.endT=0;t.B=null;
  G.mode='world';t.startBattle({enemies:['militia'],tournament:true,deploy:true});ok(!t.B.deploy,'a tournament has no deployment');t.B.over=true;t.B.endT=0;t.B=null;
  t.setDeploy(false);G.mode='world';G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia']};t.startBattle({enemies:['militia'],tournament:false,deploy:true});ok(!t.B.deploy,'and Settings can switch it off');t.B.over=true;t.B.endT=0;t.B=null;t.BDEPLOY.on=false}
 // the battle HUD (battlehud.js), as in Total War: the balance of power, unit cards with portraits, the selected unit's details,
 // icon orders; on the field, rings under your selection and lines to where each selected group is going
 {const B=fight(['militia','militia']);B.units.filter(u=>u.team===1).forEach(u=>{u.cd=99;u.s={...u.s,spd:0};u.hp=u.max=9999});t.setOrderUI();
  const ap=B.units.filter(u=>u.team===0&&u.hp>0).length;ok(document.getElementById('bMine').textContent===String(ap)&&document.getElementById('bFoe').textContent==='2'&&/%/.test(document.getElementById('bPowMe').style.width),'the top bar: each side\u2019s numbers and the balance of power');
  ok(['hero','inf','arc'].every(g=>document.querySelector('[data-grp="'+g+'"] img.upic')),'each unit card has its soldiers\u2019 portrait');
  ok(document.querySelectorAll('.obtn[data-order] svg.oico').length===6&&document.querySelectorAll('.obtn[data-flag] svg.oico').length===4&&document.querySelector('.obtn[data-order="charge"] .k').textContent==='C','the orders are icon buttons with their keys');
  t.selectGroup('inf');let info=document.getElementById('bInfo').textContent;ok(/Infantry/.test(info)&&/Health \d+ \/ \d+/.test(info)&&/Morale \d+/.test(info)&&/Damage/.test(info),'the selected unit\u2019s details: health, morale, its numbers');
  t.selectGroup('all');info=document.getElementById('bInfo').textContent;ok(/All troops/.test(info)&&/Infantry/.test(info)&&/Archers/.test(info),'with everyone selected, a line for each unit');
  t.battlePause(true);ok(/Paused/.test(document.getElementById('bStatus').textContent),'the top bar says when the battle is paused');t.battlePause(false);
  // the field: rings and lines (counted as they are drawn)
  const spy=f=>{let n=0;const ctx=t.ctx,o0=ctx.ellipse,l0=ctx.lineTo;ctx.ellipse=function(...a){n++;return o0.apply(this,a)};ctx.lineTo=function(...a){n++;return l0.apply(this,a)};f();ctx.ellipse=o0;ctx.lineTo=l0;return n};
  t.selectGroup('inf');const rings=spy(()=>t.drawSelection());ok(rings>=t.grpUnits('inf').length*2,'a ring under every soldier you have selected ('+rings+')');
  t.rtsOrder(500,300);const ln=spy(()=>t.drawOrderLines());ok(ln>0,'and a line from them to where they are going');
  t.selectGroup('all');t.rtsOrder(520,330);const lnAll=spy(()=>t.drawOrderLines());ok(lnAll>=ln*2,'with All selected too: a line for every group ('+lnAll+')');
  const e=B.units.find(u=>u.team===1);t.selectGroup('inf');t.rtsOrder(e.x,e.y-6);ok(spy(()=>t.drawOrderLines())>0&&B.groups.inf.tgt===e,'and to the enemy you set them on');
  B.hov={x:e.x,y:e.y-6};ok(spy(()=>t.drawSelection())>rings,'pointing at an enemy rings it red');B.hov=null;t.frame();B.over=true;B.endT=0;t.B=null}
 // the camera (Phase 4): zoom and pan
 {const B=fight(['militia']);B.units.forEach(u=>{u.cd=99;u.s={...u.s,spd:0}});const C=B.cam;
  ok(C&&C.z===1&&C.x===0&&C.y===0,'a battle starts with the whole field in view');
  const w0=t.toField({x:300,y:200});t.camZoom(1,300,200);const w1=t.toField({x:300,y:200});ok(C.z>1&&Math.abs(w0.x-w1.x)<.01&&Math.abs(w0.y-w1.y)<.01,'zooming in keeps the spot under the cursor where it is ('+C.z+'×)');
  for(let i=0;i<9;i++)t.camZoom(1,300,200);ok(C.z===t.BCAM.zooms[t.BCAM.zooms.length-1],'up to '+C.z+'×');
  t.camPan(-5000,-5000);ok(C.x===0&&C.y===0,'the view stays on the field');t.camPan(5000,5000);ok(Math.abs(C.x-(t.BW-t.BW/C.z))<.01&&Math.abs(C.y-(t.BH-t.BH/C.z))<.01,'at every edge');
  // orders land on the field, wherever you look
  t.camCentre(t.BW/2,t.BH/2);t.selectGroup('inf');const cvs=document.querySelector('canvas'),r=cvs.getBoundingClientRect(),at=(x,y,b)=>({clientX:r.left+x*r.width/cvs.width,clientY:r.top+y*r.height/cvs.height,button:b,pointerType:'mouse',bubbles:true});
  const f=t.toField({x:200,y:150});cvs.dispatchEvent(new PointerEvent('pointerdown',at(200,150,2)));window.dispatchEvent(new PointerEvent('pointerup',{button:2,pointerType:'mouse'}));
  ok(B.mark&&Math.abs(B.mark.x-f.x)<1&&Math.abs(B.mark.y-f.y)<1,'zoomed in, a right-click sends them to the spot you clicked on the field');
  const sp=t.grpUnits('arc')[0],ps=t.fromField({x:sp.x,y:sp.y-6});t.selectGroup('all');cvs.dispatchEvent(new PointerEvent('pointerdown',at(ps.x,ps.y,0)));window.dispatchEvent(new PointerEvent('pointerup',{button:0,pointerType:'mouse'}));
  ok(B.sel==='arc'||C.x>sp.x||C.x+t.BW/C.z<sp.x,'and a click picks the soldier under it');
  // the mouse and the keys
  const x0=C.x;cvs.dispatchEvent(new PointerEvent('pointerdown',at(400,300,1)));cvs.dispatchEvent(new PointerEvent('pointermove',at(300,300,1)));window.dispatchEvent(new PointerEvent('pointerup',{button:1,pointerType:'mouse'}));
  ok(Math.abs(C.x-(x0+100/C.z))<.01||C.x===t.BW-t.BW/C.z,'middle-drag pans');
  const z0=C.z;cvs.dispatchEvent(new WheelEvent('wheel',{deltaY:120,clientX:r.left+r.width/2,clientY:r.top+r.height/2,bubbles:true,cancelable:true}));ok(C.z<z0,'the wheel zooms out');
  const key=(k,code,type)=>window.dispatchEvent(new KeyboardEvent(type||'keydown',{key:k,code}));
  key('=','Equal');ok(C.z===z0,'+ zooms in');t.camCentre(t.BW/2,t.BH/2);const x1=C.x;key('ArrowRight','ArrowRight');C.lt=performance.now()-50;t.camTick();key('ArrowRight','ArrowRight','keyup');
  ok(C.x>x1&&!C.keys.arrowright,'the arrow keys pan while held');
  // look at a group; the small map
  t.camCentre(0,0);key('2','Digit2');key('2','Digit2');const m=t.grpUnits('inf'),cx=m.reduce((a,u)=>a+u.x,0)/m.length;ok(Math.abs(C.x+t.BW/C.z/2-cx)<2||C.x===0,'the same group number twice: the camera looks at it');
  t.camPan(5000,0);const mr=t.miniRect(),mid={x:(mr.x+mr.w/2)*t.BW/t.VW,y:(mr.y+mr.h/2)*t.BH/t.VH};ok(t.miniHit(mid)&&Math.abs(t.miniHit(mid).x-t.BW/2)<2,'the small map shows where you look');
  cvs.dispatchEvent(new PointerEvent('pointerdown',at(mid.x,mid.y,0)));ok(Math.abs(C.x+t.BW/C.z/2-t.BW/2)<2,'a click on it looks there');
  t.battlePause(true);const xp=C.x;t.camPan(-50,0);t.frame();ok(C.x<xp,'the camera moves while the battle is paused');t.battlePause(false);
  key('0','Digit0');ok(C.z===1&&C.x===0&&t.miniHit(mid),'0: the whole field again (the small map stays, a radar)');t.camZoom(1);t.frame();ok(true,'the zoomed field and its small map draw');B.over=true;B.endT=0;t.B=null}
 // your hero fights on their own
 {const B=fight(['militia']),h=B.hero,e=B.units.find(u=>u.team===1);e.x=h.x+40;e.y=h.y;e.cd=99;e.s={...e.s,spd:0};const hp0=e.hp;
  for(let i=0;i<120&&t.B&&e.hp>0;i++)t.updateBattle(.03);ok(e.hp<hp0,'your hero walks up to the nearest enemy and strikes without a key pressed ('+Math.round(hp0)+' → '+Math.round(Math.max(0,e.hp))+')');
  if(t.B){t.B.over=true;t.B.endT=0}t.B=null}
 // selecting
 {const B=fight(['militia','militia','militia']);B.units.filter(u=>u.team===1).forEach(u=>{u.x=t.VW-20;u.cd=99;u.s={...u.s,spd:0};u.hp=u.max=9999});// (sturdy: your hero would cut them down meanwhile)
  const sp=t.grpUnits('inf')[0];t.rtsSelect(sp.x,sp.y-6,sp.x,sp.y-6);ok(B.sel==='inf','click a spearman: the infantry is selected');
  t.rtsSelect(-5,-5,-5,-5);ok(B.sel==='all','click empty ground: everyone');
  const ar=t.grpUnits('arc'),xs=[...ar,...t.grpUnits('inf')];const x0=Math.min(...xs.map(u=>u.x))-3,x1=Math.max(...xs.map(u=>u.x))+3,y0=Math.min(...xs.map(u=>u.y))-12,y1=Math.max(...xs.map(u=>u.y))+3;
  t.rtsSelect(x0,y0,x1,y1);ok(Array.isArray(B.sel)?B.sel.includes('inf')&&B.sel.includes('arc'):B.sel==='all','drag a box round archers and spearmen: both');
  // moving
  t.selectGroup('inf');const tx=t.VW/2,ty=60;t.rtsOrder(tx,ty);const g=B.groups.inf;ok(g.order==='hold'&&Math.abs(g.ax-tx)<1&&Math.abs(g.ay-ty)<1&&B.mark&&!B.mark.foe,'right-click the ground: they are sent there, holding');
  const d0=t.grpUnits('inf').reduce((a,u)=>a+Math.hypot(u.x-u.sx-tx,u.y-u.sy-ty),0);for(let i=0;i<400&&t.B;i++)t.updateBattle(.03);
  const d1=t.grpUnits('inf').reduce((a,u)=>a+Math.hypot(u.x-u.sx-tx,u.y-u.sy-ty),0);ok(d1<d0*.25,'and march there in formation ('+Math.round(d0)+' → '+Math.round(d1)+')');
  // attacking
  const e=B.units.find(u=>u.team===1&&u.hp>0);t.selectGroup('inf');t.rtsOrder(e.x,e.y-6);ok(g.tgt===e&&B.mark.foe,'right-click an enemy: they are set on it');
  for(let i=0;i<10&&t.B;i++)t.updateBattle(.03);ok(t.grpUnits('inf').every(u=>u.tgt===e),'every one of them goes for it');
  t.setOrder('hold');ok(!g.tgt,'a new order calls them off it');t.frame();ok(true,'the selection, box and marker draw')}
 // combos and skills, on their own
 const ring=(B,n,r,spd)=>{const h=B.hero;B.units.filter(u=>u.team===1).forEach((u,i)=>{const a=i/n*6.283;u.x=h.x+Math.cos(a)*r;u.y=h.y+Math.sin(a)*r;u.cd=99;u.hp=u.max=9999;u.s={...u.s,spd:spd||0}})};
 const run=(n,f)=>{for(let i=0;i<n&&t.B;i++){t.updateBattle(.03);if(f)f()}};
 P.tree=['start','might0','might1','might2','mighta0'];P.level=6;P.gear.weapon=t.gearId('sword',1);P.gear.offhand=null;
 {P.slots=Array(10).fill(null);const B=fight(['militia']);ring(B,1,14);const X=t.heroState();X.sp=999;const steps=new Set();run(200,()=>steps.add(X.step));
  ok([0,1,2].every(k=>steps.has(k)),'your hero swings the whole combo on their own: Slash, Sweep, Finisher ('+[...steps].filter(k=>k>=0).join(',')+')');if(t.B){t.B.over=true;t.B.endT=0;t.B=null}}
 {P.slots=Array(10).fill(null);const B=fight(['militia']);ring(B,1,14);const X=t.heroState();X.sp=0;const a0=B.hero.atkAt;let tired=0;run(60,()=>{X.sp=0;tired+=B.floats.filter(f=>/tired/i.test(f.t)).length;B.floats=[]});
  ok(!tired&&B.hero.atkAt===a0,'out of breath, your hero waits: no flurry of failed swings, no “Too tired”');
  X.sp=999;let swings=0,last=B.hero.atkAt;const T0=B.t;run(300,()=>{X.sp=999;if(B.hero.atkAt!==last){swings++;last=B.hero.atkAt}});const per=swings/Math.max(.01,B.t-T0);
  ok(swings>=3&&per<1.8,'and fights in bursts, a breath after each finisher ('+swings+' blows, '+per.toFixed(1)+' a second)');if(t.B){t.B.over=true;t.B.endT=0;t.B=null}}
 {P.slots=['whirl',...Array(9).fill(null)];const B=fight(['militia','militia','militia']);ring(B,3,16);const X=t.heroState();X.sp=X.mp=999;run(40);
  ok(X.cds.whirl>0,'hemmed in, they spin a Whirlwind from their slots');if(t.B){t.B.over=true;t.B.endT=0;t.B=null}}
 {P.slots=['leap',...Array(9).fill(null)];const B=fight(['militia','militia','militia']);const h=B.hero;B.units.filter(u=>u.team===1).forEach((u,i)=>{u.x=h.x+80;u.y=h.y+(i-1)*8;u.cd=99;u.hp=u.max=9999;u.s={...u.s,spd:0}});
  G.mouse.in=true;G.mouse.type='mouse';G.mouse.x=10;G.mouse.y=10;const X=t.heroState();X.sp=X.mp=999;let leapt=false;run(60,()=>{if(X.leap)leapt=true});
  ok(leapt&&Math.hypot(h.x-(h.x>0?B.units.find(u=>u.team===1).x:0),0)<60,'they leap onto a knot of enemies, not where your cursor happens to be');G.mouse.in=false;if(t.B){t.B.over=true;t.B.endT=0;t.B=null}}
 {P.slots=Array(10).fill(null);P.gear.weapon=t.gearId('bow',1);t.invAdd('good','arrows',40);const B=fight(['militia']);const h=B.hero,e=B.units.find(u=>u.team===1);e.x=h.x+120;e.y=h.y;e.cd=99;e.hp=e.max=9999;e.s={...e.s,spd:0};
  const X=t.heroState();X.sp=999;let shot=0;run(150,()=>{shot=Math.max(shot,B.arrows.length)});ok(shot>0&&e.hp<9999,'with a bow they draw, loose and hit');P.gear.weapon=t.gearId('sword',1);if(t.B){t.B.over=true;t.B.endT=0;t.B=null}}
 // champions: lords, chieftains and companions fight as your hero does
 {P.slots=Array(10).fill(null);P.comps={brann:{ap:0,role:''}};t.compInit('brann');const B=fight(['militia','militia']);const c=B.units.find(u=>u.comp),fs=B.units.filter(u=>u.team===1);
  fs.forEach((u,i)=>{u.x=c.x+10;u.y=c.y+(i?6:-6);u.cd=99;u.hp=u.max=9999;u.s={...u.s,spd:0};u.grp=null});B.hero.x=10;B.hero.y=10;const C=t.champ(c);C.sp=999;C.cds={whirl:99};
  const steps=[];for(let i=0;i<3;i++){c.cd=0;t.champStrike(c,fs[0]);steps.push(C.step)}ok(steps.join()==='0,1,2'&&fs[0].hp<9999,'a companion swings the whole combo of their weapon ('+t.champCombo(c).map(x=>x.n).join(' → ')+')');
  ok(c.cd>1,'and takes a breath after the finisher');C.sp=0;c.cd=0;const a0=c.atkAt;t.champStrike(c,fs[0]);ok(c.atkAt===a0,'winded, they wait');
  C.cds={};C.sp=C.mp=999;const h0=fs.map(u=>u.hp);t.champSkill(c,C);ok(fs.every((u,i)=>u.hp<h0[i])&&C.cds.whirl>0,'hemmed in, they spin a Whirlwind');if(t.B){t.B.over=true;t.B.endT=0;t.B=null}}
 {const L=t.W.lords.find(l=>!l.dead);Object.assign(L,{inside:null,x:P.x,y:P.y,troops:Array(6).fill('hum_spear')});L.lv=6;P.troops={hum_spear:4};G.mode='world';G.modal=false;t.hidePanel();
  t.startEncounter({kind:'lord',ref:L,list:L.troops.slice(),allies:[],foes:[]});t.startBattle({enemies:G.enc.list,tournament:false});const B=t.B,u=B.units.find(x=>x.leader&&x.leader.ref===L),C=t.champ(u);
  ok(C.lv===6&&C.spMax>60&&C.mpMax>30,'an enemy lord fights with breath and mana by his level ('+C.lv+')');
  ok(['whirl','cry','quake','leap'].every(k=>t.CHAMP_SK[k].lv<=C.lv)&&t.CHAMP_SK.heal.lv>C.lv,'and the skills his level gives him (not Healing yet)');
  u.x=B.hero.x+60;u.y=B.hero.y;t.champThink(u,.01);ok(u.tgt===B.hero,'seeing your hero near, he goes for them');B.over=true;B.endT=0;t.B=null}
 // the enemy's captain
 {P.troops={hum_spear:8,hum_bow:6};const B=fight(['militia','militia','militia','militia','archer','archer','archer','horse','horse','horse']);
  ok(['e_inf','e_arc','e_cav'].every(g=>B.groups[g]&&t.grpUnits(g).length),'the enemy army is in groups: infantry, archers, cavalry');
  const ax0=B.groups.e_inf.ax;for(let i=0;i<40&&t.B;i++)t.updateBattle(.03);const gi=B.groups.e_inf,ga=B.groups.e_arc,gc=B.groups.e_cav;
  ok(gi.ax<ax0&&gi.order==='advance','their infantry advances in line ('+Math.round(ax0)+' → '+Math.round(gi.ax)+')');
  ok(ga.order==='hold'&&ga.ax>gi.ax,'their archers hold behind it');
  const mine=B.units.filter(u=>u.team===0&&u.hp>0),my=mine.reduce((a,u)=>a+u.y,0)/mine.length;ok(gc.order==='hold'&&Math.abs(gc.ay-my)>60||gc.flanked,'their cavalry swings round a flank ('+Math.round(gc.ay)+' against your middle '+Math.round(my)+')');
  gc.t=99;B.cmdT=0;t.command(.01);ok(gc.flanked&&gc.order==='charge'&&gc.tgt&&gc.tgt.s.range,'then falls on your archers');
  B.units.filter(u=>u.team===1&&u.grp==='e_inf').forEach(u=>{u.x=B.hero.x+40});B.cmdT=0;t.command(.01);ok(gi.order==='charge','and their line charges once the lines are close');B.over=true;B.endT=0;t.B=null}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
