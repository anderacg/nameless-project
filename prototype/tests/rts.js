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
  ok(B.groups.inf.walk&&t.walking(B.groups.inf),'your groups walk unless told to run');t.rtsOrder(t.BW/2,B.groups.inf.ay);const x0=inf.map(u=>u.x);
  for(let i=0;i<30;i++)t.updateBattle(.03);const walked=Math.max(...inf.map((u,i)=>Math.abs(u.x-x0[i])));
  {const cvs=document.querySelector('canvas'),r=cvs.getBoundingClientRect(),at=(x,y)=>({clientX:r.left+x*r.width/cvs.width,clientY:r.top+y*r.height/cvs.height,button:2,pointerType:'mouse',bubbles:true});t.frame();
   const rc=()=>{cvs.dispatchEvent(new PointerEvent('pointerdown',at(t.BW/2+1,B.groups.inf.ay)));window.dispatchEvent(new PointerEvent('pointerup',{button:2,pointerType:'mouse'}))};rc();rc()}ok(B.groups.inf.run&&!t.walking(B.groups.inf),'a double right-click sends them at a run (this order)');const x1=inf.map(u=>u.x);
  for(let i=0;i<30;i++)t.updateBattle(.03);const ran=Math.max(...inf.map((u,i)=>Math.abs(u.x-x1[i])));
  ok(ran>walked*1.5,'walking is slower, at the slowest one\u2019s pace; running each goes as fast as it can ('+walked.toFixed(1)+' → '+ran.toFixed(1)+' px)');
  // hold: where they stand
  t.setOrder('charge');t.setOrder('hold');const c=inf.reduce((a,u)=>a+u.x,0)/inf.length;ok(B.groups.inf.order==='hold'&&Math.abs(B.groups.inf.ax-c)<1,'H: hold, where they stand');
  // waypoints
  t.rtsOrder(300,200);t.rtsOrder(400,300,{queue:true});ok(B.groups.inf.queue.length===1,'Shift + right-click adds a waypoint after the move');
  inf.forEach(u=>{u.x=B.groups.inf.ax+u.sx;u.y=B.groups.inf.ay+u.sy});t.updateBattle(.01);ok(B.groups.inf.queue.length===0&&Math.abs(B.groups.inf.ax-400)<1,'once there, on to the next');
  // withdraw
  t.setOrder('withdraw');ok(B.groups.inf.order==='withdraw'&&B.groups.inf.ax===B.exit.x,'W: withdraw to your edge of the field');
  const u0=inf[1];e.x=u0.x+20;e.y=u0.y;const ex=u0.x;for(let i=0;i<10;i++)t.updateBattle(.03);ok(u0.x<ex,'withdrawing, they do not turn on an enemy who is not on them');e.x=t.BW-10;e.y=10;
  // hold ground
  t.setOrder('hold');t.toggleFlag('firm');ok(B.groups.inf.firm,'F: hold their ground');const u1=inf[1];u1.x=B.groups.inf.ax+u1.sx;u1.y=B.groups.inf.ay+u1.sy;e.x=u1.x+22;e.y=u1.y;const hx=u1.x;
  for(let i=0;i<10;i++)t.updateBattle(.03);ok(Math.abs(u1.x-hx)<3,'holding their ground, they do not step out at an enemy close by');t.toggleFlag('firm');e.x=t.BW-10;e.y=10;B.over=true;B.endT=0;t.B=null}
 {const B=fight(['militia']);const e=B.units.find(u=>u.team===1),ar=t.grpUnits('arc');e.cd=99;e.hp=e.max=9999;e.s={...e.s,spd:0};e.x=ar[0].x+70;e.y=ar[0].y;
  t.grpUnits('inf').forEach(u=>u.hp=0);B.hero.x=10;B.hero.y=10;t.selectGroup('arc');t.setOrder('hold');ar.forEach(u=>u.cd=0);
  t.toggleFlag('cease');ok(B.groups.arc.cease===true,'Q: cease fire');B.arrows=[];for(let i=0;i<20;i++)t.updateBattle(.03);ok(!B.arrows.length,'holding fire, archers do not shoot at an enemy in range');
  t.rtsOrder(e.x,e.y-6);let fired=0;for(let i=0;i<120;i++){t.updateBattle(.03);fired+=B.arrows.length}ok(fired>0||e.hp<9999,'but shoot at the enemy you set them on');
  t.setOrder('hold');t.toggleFlag('cease');t.toggleFlag('skirmish');ok(B.groups.arc.skirmish,'E: skirmish');const a=ar[0];a.x=B.groups.arc.ax+a.sx;a.y=B.groups.arc.ay+a.sy;e.x=a.x+20;e.y=a.y;const ax=a.x;
  for(let i=0;i<25;i++)t.updateBattle(.03);ok(a.x<ax-3&&B.groups.arc.backing,'skirmishers back off, as a group, from an enemy coming at them');B.over=true;B.endT=0;t.B=null}
 // selecting more, and control groups
 {const B=fight(['militia']);B.units.filter(u=>u.team===1).forEach(u=>{u.x=t.BW-10;u.cd=99;u.s={...u.s,spd:0}});
  const sp=t.grpUnits('inf')[0],ar=t.grpUnits('arc')[0];t.rtsSelect(sp.x,sp.y-6,sp.x,sp.y-6);t.rtsSelect(ar.x,ar.y-6,ar.x,ar.y-6,true);
  ok(Array.isArray(B.sel)&&B.sel.includes('inf')&&B.sel.includes('arc'),'Shift + click adds the archers to the infantry');
  t.ctrlGroup('1',true);t.selectGroup('all');t.ctrlGroup('1');ok(Array.isArray(B.sel)&&B.sel.length===2,'Ctrl+1 keeps the selection, 1 picks it again');
  const key=(k,code,o2)=>window.dispatchEvent(new KeyboardEvent('keydown',Object.assign({key:k,code},o2||{})));t.selectGroup('inf');
  B.groups.inf.order='charge';key('h','KeyH');ok(B.groups.inf.order==='hold','H on the keyboard holds');{const w0=B.groups.inf.walk;key('r','KeyR');ok(B.groups.inf.walk===!w0,'R switches walking and running')}key('w','KeyW');ok(B.groups.inf.order==='withdraw','W withdraws');
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
  t.setOrderUI();const card=document.querySelector('[data-grp="inf"]');ok(card.querySelectorAll('.cmi svg.mico').length===5&&/flanked/.test(card.title),'the card shows a badge for each weakness (steady: no morale badge) ('+card.title+')');
  B.t+=10;B.losing=[false,false];ok(!t.grpMorale(inf).weak.length,'weaknesses pass once it is left alone');
  let drawn=0;const fr=t.ctx.fillRect.bind(t.ctx);t.ctx.fillRect=(...a)=>{drawn++;return fr(...a)};t.drawUnitIcons();t.ctx.fillRect=fr;ok(drawn>60,'icons over the groups, yours and theirs: plate, type and health ('+drawn+' rects)');
  ok(t.unitIcon('hero',[B.hero])==='hero'&&t.unitIcon('inf',t.grpUnits('inf'))==='spear'&&t.unitIcon('arc',t.grpUnits('arc'))==='bow','each icon shows what the unit is (your hero: a crown; spearmen: a spear; archers: a bow)');
  ok(t.unitIcon('x',[{type:'hum_knight',s:t.ST.hum_knight}])==='horse'&&t.unitIcon('x',[{type:'troll',s:t.ST.troll}])==='beast'&&t.unitIcon('x',[{type:'militia',s:t.ST.militia}])==='sword','knights a horse, a troll a paw, militia a sword');
  ok(!document.querySelector('[data-grp="hero"] .cmi'),'your hero never breaks: no banner');t.frame();B.over=true;B.endT=0;t.B=null}
 // charges
 {const B=fight(['militia']),e=B.units.find(u=>u.team===1),cav={s:{...t.ST.horse},x:e.x-14,y:e.y,team:0,run:0};
  ok(t.chargeMul(cav,e)===1,'a rider who has not run at them: no charge');cav.run=t.CHARGE.run;const full=t.chargeMul(cav,e);ok(Math.abs(full-(1+t.CHARGE.cav))<.01&&cav.run===0,'a full run: the charge hits '+Math.round((full-1)*100)+'% harder, and the run is spent');
  cav.run=t.CHARGE.run/2;const half=t.chargeMul(cav,e);ok(half>1&&half<full,'half a run, half a charge');
  const sp=B.units.find(u=>u.team===0&&u.type==='hum_spear');cav.run=t.CHARGE.run;cav.team=1;ok(t.chargeMul(cav,sp)===1,'spearmen brace against it');
  e.mor=80;cav.team=0;cav.run=t.CHARGE.run;t.chargeMul(cav,e);ok(e.mor<=80-t.CHARGE.shock+.01,'and a charge shakes the ones it hits');
  const foot={s:{...t.ST.militia},x:e.x-12,y:e.y,team:0,run:t.CHARGE.run};ok(Math.abs(t.chargeMul(foot,e)-(1+t.CHARGE.foot))<.01,'infantry running in hit '+Math.round(t.CHARGE.foot*100)+'% harder');
  // a rider's run builds as it rides at the enemy
  B.obs=[];B.units.filter(u=>u.team===0&&!u.hero).forEach(u=>u.hp=0);e.x=t.BW/2;e.y=t.BH/2;e.cd=99;e.s={...e.s,spd:0};e.hp=e.max=9999;B.hero.x=10;B.hero.y=10;B.hero.s={...B.hero.s,spd:0};
  const rider={...B.units[1],id:999,type:'horse',s:{...t.ST.horse},hp:44,max:44,x:t.BW/2-150,y:t.BH/2,grp:'cav',run:0,cd:0,dead:false,mor:80,mor0:80,tgt:null,rt:0};B.units.push(rider);B.groups.cav.order='charge';B.groups.cav.run=true;
  let hit=0;for(let i=0;i<120&&!hit;i++){const r0=rider.run;t.updateBattle(.03);if(e.hitAt)hit=r0}
  ok(hit>=t.CHARGE.run*.9,'riding at them builds the charge ('+Math.round(hit)+' px run when it struck)');B.over=true;B.endT=0;t.B=null}
 // a battle ends in a rout
 {const B=fight(['militia','militia','militia']);const foes=B.units.filter(u=>u.team===1);B.units.filter(u=>u.team===0).forEach(u=>{u.s={...u.s,spd:0};u.cd=99});
  foes.forEach(f=>{f.mor=-1});t.updateBattle(.01);ok(B.over&&B.win&&B.routed===1&&B.kills===0,'when all of them break, the battle is won: they rout');
  ok(/breaks and flees/.test(document.getElementById('log').textContent),'the log says so');B.endT=0;t.updateBattle(.01);ok(!t.B,'and it ends, the routed ones gone with their lives')}
 {const B=fight(['militia']);ok(!B.noMorale,'a field battle has morale');B.over=true;B.endT=0;t.B=null;G.mode='world';t.startBattle({enemies:['militia'],tournament:true});ok(t.B.noMorale&&t.flankMul(t.B.units[1],{x:0,y:0})===1,'a tournament has none');t.B.over=true;t.B.endT=0;t.B=null}
 // withdrawing: fleeing the battle, straight back off your edge of the field
 {const B=fight(['militia','militia','militia']),foes=B.units.filter(u=>u.team===1);foes.forEach(u=>{u.cd=99;u.hp=u.max=9999;u.s={...u.s,spd:0};u.x=t.BW-30});
  const X=B.exit;ok(X&&X.x<=t.MORALE.edge&&X.w>0,'the withdrawal edge: your side of the field (x '+X.x+')');
  t.frame();ok(true,'it is marked on the field');
  // one group: it runs back there, striking no one, and leaves the field alive
  const inf=t.grpUnits('inf');inf.forEach(u=>{u.x=500;u.y=300});const e=foes[0];e.x=508;e.y=300;e.cd=99;const eh=e.hp;t.selectGroup('inf');t.setOrder('withdraw');
  let i=0;for(;i<2000&&inf.some(u=>u.hp>0);i++)t.updateBattle(.03);
  ok(inf.every(u=>u.left&&u.hpLeft>0&&u.atkAt==null)&&!B.lost.hum_spear,'the infantry runs straight back to your edge, striking no one, and leaves the field alive ('+i+' ticks)');
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
  B.endT=0;t.updateBattle(.01);const pan=document.querySelector('#panel').textContent;ok(/cut down before reaching the edge of the field/.test(pan)&&/1 hum|1 [a-z]/i.test(pan.split('Your losses')[1]||''),'the summary counts them among your losses');t.act('cont')}
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
  const ix=t.grpUnits('inf').reduce((a,u)=>a+u.x,0);for(let i=0;i<150;i++)t.updateBattle(.03);ok(t.grpUnits('inf').reduce((a,u)=>a+u.x,0)>ix+20,'and leads it at the enemy (infantry: '+B.groups.inf.order+(B.groups.inf.order==='hold'?', screening its archers as they go up to shoot':'')+')');
  t.selectGroup('inf');t.setOrder('hold');ok(!B.auto&&!t.BAUTO.on,'an order of yours takes command back');document.getElementById('bAuto').click();ok(B.auto,'the AI button switches it too');t.setAuto(false,true);B.over=true;B.endT=0;t.B=null}
 // deployment: the battle opens frozen; place your band in its zone, then begin
 {t.BDEPLOY.on=true;P.troops={hum_spear:6,hum_bow:4};G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia','militia']};
  t.startBattle({enemies:['militia','militia'],tournament:false,deploy:true});const B=t.B,Z=t.deployZone(),e=B.units.find(u=>u.team===1),ex=e.x;
  ok(B.deploy,'a battle you fight opens in deployment');for(let i=0;i<30;i++)t.updateBattle(.03);ok(e.x===ex,'nothing moves while you deploy');t.frame();ok(true,'the zone is drawn');
  t.selectGroup('inf');t.rtsOrder(700,300);const inf=t.grpUnits('inf');ok(B.groups.inf.ax<=Z.x1&&inf.every(u=>u.x>=Z.x0&&u.x<=Z.x1&&Math.abs(u.x-(B.groups.inf.ax+u.sx))<1.01||u.x===Z.x1),'right-click past the zone: placed at its edge, at once ('+Math.round(B.groups.inf.ax)+')');
  t.selectGroup('arc');t.formDragTo(120,150,120,450);const arc=t.grpUnits('arc');ok(arc.every(u=>Math.abs(u.x-(B.groups.arc.ax+u.sx))<1&&Math.abs(u.y-(B.groups.arc.ay+u.sy))<1),'right-drag a line: they stand on it at once');
  t.selectGroup('all');t.rtsOrder(e.x,e.y-6);ok(!B.groups.inf.tgt,'no enemy to set them on while deploying');
  window.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space'}));const mine=B.units.filter(u=>u.team===0&&!u.lord),cx=mine.reduce((a,u)=>a+u.x,0)/mine.length;
  ok(!B.deploy&&B.exit.x<=t.MORALE.edge,'Space: the battle begins (the withdrawal edge, your side)');B.over=true;B.endT=0;t.B=null;
  G.mode='world';t.startBattle({enemies:['militia'],tournament:true,deploy:true});ok(!t.B.deploy,'a tournament has no deployment');t.B.over=true;t.B.endT=0;t.B=null;
  t.setDeploy(false);G.mode='world';G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia']};t.startBattle({enemies:['militia'],tournament:false,deploy:true});ok(!t.B.deploy,'and Settings can switch it off');t.B.over=true;t.B.endT=0;t.B=null;t.BDEPLOY.on=false}
 // the battle HUD (battlehud.js), as in Total War: the balance of power, unit cards with portraits, the selected unit's details,
 // icon orders; on the field, rings under your selection and lines to where each selected group is going
 {const B=fight(['militia','militia']);B.units.filter(u=>u.team===1).forEach(u=>{u.cd=99;u.s={...u.s,spd:0};u.hp=u.max=9999});t.setOrderUI();
  const ap=B.units.filter(u=>u.team===0&&u.hp>0).length;ok(document.getElementById('bMine').textContent===String(ap)&&document.getElementById('bFoe').textContent==='2'&&/%/.test(document.getElementById('bPowMe').style.width),'the top bar: each side\u2019s numbers and the balance of power');
  ok(['hero','inf','arc'].every(g=>document.querySelector('[data-grp="'+g+'"] img.upic')),'each unit card has its soldiers\u2019 portrait');
  ok(document.querySelectorAll('.obtn[data-order] svg.oico').length===4&&document.querySelectorAll('.obtn[data-flag] svg.oico').length===4&&document.querySelector('.obtn[data-order="charge"] .k').textContent==='C','the orders are icon buttons with their keys');
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
  t.selectGroup('inf');const tx=t.VW/2,ty=t.fieldTop()+40;t.rtsOrder(tx,ty);const g=B.groups.inf;ok(g.order==='hold'&&Math.abs(g.ax-tx)<1&&Math.abs(g.ay-ty)<1&&B.mark&&!B.mark.foe,'right-click the ground: they are sent there, holding');
  const d0=t.grpUnits('inf').reduce((a,u)=>a+Math.hypot(u.x-u.sx-tx,u.y-u.sy-ty),0);for(let i=0;i<800&&t.B;i++)t.updateBattle(.03);
  const d1=t.grpUnits('inf').reduce((a,u)=>a+Math.hypot(u.x-u.sx-tx,u.y-u.sy-ty),0);ok(d1<d0*.25,'and march there in formation ('+Math.round(d0)+' → '+Math.round(d1)+')');
  // attacking
  const e=B.units.find(u=>u.team===1&&u.hp>0);t.selectGroup('inf');t.rtsOrder(e.x,e.y-6);ok(g.tgt===e&&B.mark.foe,'right-click an enemy: they are set on it');
  for(let i=0;i<10&&t.B;i++)t.updateBattle(.03);ok(t.grpUnits('inf').every(u=>u.tgt===e),'every one of them goes for it');
  t.setOrder('hold');ok(!g.tgt,'a new order calls them off it');t.frame();ok(true,'the selection, box and marker draw')}
 // combos and skills, on their own
 const ring=(B,n,r,spd)=>{const h=B.hero;B.units.filter(u=>u.team===1).forEach((u,i)=>{const a=i/n*6.283;u.x=h.x+Math.cos(a)*r;u.y=h.y+Math.sin(a)*r;u.cd=99;u.hp=u.max=9999;u.s={...u.s,spd:spd||0}})};
 const run=(n,f)=>{for(let i=0;i<n&&t.B;i++){t.updateBattle(.03);if(f)f()}};
 P.tree=['start','might0','might1','might2','mighta0'];P.level=6;P.gear.weapon=t.gearId('sword',1);P.gear.offhand=null;P.sk[t.meleeSk()].lv=t.COMBO_UP.third;// (practised: all three blows of the combo)
 {P.slots=Array(10).fill(null);const B=fight(['militia']);ring(B,1,14);const X=t.heroState();X.sp=999;const steps=new Set();run(200,()=>steps.add(X.step));
  ok([0,1,2].every(k=>steps.has(k)),'your hero swings the whole combo on their own: Slash, Sweep, Finisher ('+[...steps].filter(k=>k>=0).join(',')+')');if(t.B){t.B.over=true;t.B.endT=0;t.B=null}}
 {P.slots=Array(10).fill(null);const B=fight(['militia']);ring(B,1,14);const X=t.heroState();X.sp=0;const a0=B.hero.atkAt;let tired=0;run(60,()=>{X.sp=0;tired+=B.floats.filter(f=>/tired/i.test(f.t)).length;B.floats=[]});
  ok(!tired&&B.hero.atkAt!==a0&&t.tiredMul(B.hero).dmg<1,'out of breath, your hero fights on as a soldier does, softer: no flurry of failed swings, no “Too tired”');if(t.B){t.B.over=true;t.B.endT=0;t.B=null}}
 {P.slots=Array(10).fill(null);const B=fight(['militia']);ring(B,1,14);B.units.filter(u=>u.team===1).forEach(u=>u.hp=u.max=9999);const X=t.heroState();
  X.sp=999;let swings=0,last=B.hero.atkAt;const T0=B.t;run(300,()=>{X.sp=999;if(B.hero.atkAt!==last){swings++;last=B.hero.atkAt}});const per=swings/Math.max(.01,B.t-T0);
  ok(swings>=3&&per<1.8,'and fights in bursts, a breath after each finisher ('+swings+' blows, '+per.toFixed(1)+' a second)');if(t.B){t.B.over=true;t.B.endT=0;t.B=null}}
 {P.slots=['whirl',...Array(9).fill(null)];const B=fight(['militia','militia','militia']);ring(B,3,16);const X=t.heroState();X.sp=X.mp=999;B.hero.hp=B.hero.max;run(40);
  ok(X.cds.whirl>0,'hemmed in, they spin a Whirlwind from their slots (Auto skills)');if(t.B){t.B.over=true;t.B.endT=0;t.B=null}}
 {P.slots=['leap',...Array(9).fill(null)];const B=fight(['militia','militia','militia']);const h=B.hero;B.units.filter(u=>u.team===1).forEach((u,i)=>{u.x=h.x+80;u.y=h.y+(i-1)*8;u.cd=99;u.hp=u.max=9999;u.s={...u.s,spd:0}});
  G.mouse.in=true;G.mouse.type='mouse';G.mouse.x=10;G.mouse.y=10;const X=t.heroState();X.sp=X.mp=999;h.hp=h.max;/* (at full health: badly hurt among them, they would roll away) */let leapt=false;run(60,()=>{if(X.leap)leapt=true});
  ok(leapt&&Math.hypot(h.x-(h.x>0?B.units.find(u=>u.team===1).x:0),0)<60,'they leap onto a knot of enemies, not where your cursor happens to be'+(leapt?'':' [hp '+Math.round(h.hp)+'/'+h.max+' sp '+Math.round(X.sp)+' cd '+JSON.stringify(X.cds.leap)+' grip '+t.grip()+' kind '+t.shoveKind()+' roll '+X.rollCd+' busy '+t.heroBusy(X)+']'));G.mouse.in=false;if(t.B){t.B.over=true;t.B.endT=0;t.B=null}}
 {P.slots=Array(10).fill(null);P.gear.weapon=t.gearId('bow',1);t.invAdd('good','arrows',40);const B=fight(['militia']);const h=B.hero,e=B.units.find(u=>u.team===1);e.x=h.x+120;e.y=h.y;e.cd=99;e.hp=e.max=9999;e.s={...e.s,spd:0};
  const X=t.heroState();X.sp=999;let shot=0;run(150,()=>{shot=Math.max(shot,B.arrows.length)});ok(shot>0&&e.hp<9999,'with a bow they draw, loose and hit');P.gear.weapon=t.gearId('sword',1);if(t.B){t.B.over=true;t.B.endT=0;t.B=null}}
 // champions: lords, chieftains and companions fight as your hero does
 {P.slots=Array(10).fill(null);P.comps={brann:{ap:0,role:''}};t.compInit('brann');const B=fight(['militia','militia']);const c=B.units.find(u=>u.comp),fs=B.units.filter(u=>u.team===1);
  fs.forEach((u,i)=>{u.x=c.x+10;u.y=c.y+(i?6:-6);u.cd=99;u.hp=u.max=9999;u.s={...u.s,spd:0};u.grp=null});B.hero.x=10;B.hero.y=10;const C=t.champ(c);C.sp=999;C.cds={whirl:99};
  const steps=[];for(let i=0;i<3;i++){c.cd=0;t.champStrike(c,fs[0]);steps.push(C.step)}ok(steps.join()==='0,1,2'&&fs[0].hp<9999,'a companion swings the whole combo of their weapon ('+t.champCombo(c).map(x=>x.n).join(' → ')+')');
  ok(c.cd>1,'and takes a breath after the finisher');C.sp=0;c.cd=0;C.win=0;const a0=fs[0].hp;t.champStrike(c,fs[0]);ok(fs[0].hp<a0&&t.tiredMul(c).dmg<1,'winded, they still fight (as a soldier does), but softer');ok(c.sta===0&&C.sp===0,'their breath is their soldier’s stamina');
  C.cds={};C.sp=C.mp=999;const h0=fs.map(u=>u.hp);t.champSkill(c,C);ok(fs.every((u,i)=>u.hp<h0[i])&&C.cds.whirl>0,'hemmed in, they spin a Whirlwind');if(t.B){t.B.over=true;t.B.endT=0;t.B=null}}
 {const L=t.W.lords.find(l=>!l.dead);Object.assign(L,{inside:null,x:P.x,y:P.y,troops:Array(6).fill('hum_spear')});L.lv=6;P.troops={hum_spear:4};G.mode='world';G.modal=false;t.hidePanel();
  t.startEncounter({kind:'lord',ref:L,list:L.troops.slice(),allies:[],foes:[]});t.startBattle({enemies:G.enc.list,tournament:false});const B=t.B,u=B.units.find(x=>x.leader&&x.leader.ref===L),C=t.champ(u);
  ok(C.lv===6&&C.spMax>60&&C.mpMax>30,'an enemy lord fights with breath and mana by his level ('+C.lv+')');
  ok(u.unit.actives().length>0&&u.unit.actives().every(k=>t.knowsOf(L,k)),'and the skills his skill tree gives him ('+u.unit.actives().join(', ')+')');
  u.x=B.hero.x+60;u.y=B.hero.y;t.commandCharacters(.01);ok(u.tgt===B.hero,'seeing your hero near, his commander sets him on them (a duel)');B.over=true;B.endT=0;t.B=null}
 // the enemy's captain: it reads the whole battle
 {P.troops={hum_spear:8,hum_bow:6};const B=fight(['militia','militia','militia','militia','archer','archer','archer','horse','horse','horse']);
  ok(['e_inf','e_arc','e_cav'].every(g=>B.groups[g]&&t.grpUnits(g).length),'the enemy army is in groups: infantry, archers, cavalry');
  for(let i=0;i<40&&t.B;i++)t.updateBattle(.03);const gi=B.groups.e_inf,ga=B.groups.e_arc,gc=B.groups.e_cav,S=t.assess(1);
  ok(S.ratio<1&&B.post[1]==='defend'&&gi.order==='hold'&&(gi.ax<ga.ax||!!ga.hunt),'weaker, and shooting as well as you: it holds a line in front of its archers (unless they are out hunting, safely) and lets you come (strength '+S.ratio.toFixed(2)+')');
  ok(ga.order==='hold'&&!ga.skirmish,'their archers stand behind it, and with nobody coming at them they do not skirmish');
  const mine=B.units.filter(u=>u.team===0&&u.hp>0),my=mine.reduce((a,u)=>a+u.y,0)/mine.length;ok(gc.phase==='flank'&&gc.order==='hold'&&Math.abs(gc.ay-my)>60,'their cavalry swings round a flank ('+Math.round(gc.ay)+' against your middle '+Math.round(my)+')');
  gc.t=99;B.cmdT=0;t.command(.01);ok(gc.phase==='charge'&&gc.order==='charge'&&gc.tgt&&gc.tgt.s.range,'then falls on your archers');
  B.units.filter(u=>u.team===1&&u.grp==='e_inf').forEach(u=>{u.x=B.hero.x+40});B.cmdT=0;t.command(.01);ok(gi.order==='charge','and their line charges once the lines are close');B.over=true;B.endT=0;t.B=null}
 {const war=(mine,list)=>{P.troops=mine;G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list};t.startBattle({enemies:list,tournament:false});return t.B};
  const B=war({hum_levy:4},Array(10).fill('militia').concat(['archer','archer']));for(let i=0;i<20&&t.B;i++)t.updateBattle(.03);
  const sc=B.groups.e_inf.order==='hold'&&B.plan&&B.plan[1]&&B.groups.e_inf.ax===B.plan[1].inf;
  ok(t.assess(1).ratio>1&&B.post[1]==='attack'&&(B.groups.e_inf.order==='advance'||sc),'stronger: it attacks, its infantry advancing in line (or first walking up as one army to its line, screening its archers while they shoot) (strength '+t.assess(1).ratio.toFixed(2)+')');B.over=true;B.endT=0;t.B=null;
  const B2=war({hum_bow:10},['militia','militia','militia','militia','archer']);for(let i=0;i<20&&t.B;i++)t.updateBattle(.03);
  ok(t.assess(1).shootFoe>t.assess(1).shootMe&&B2.post[1]==='attack','outshot by your archers, it closes in rather than stand under them');B2.over=true;B2.endT=0;t.B=null}
 // its archers shoot what matters, not just your hero; and fight back at what is on them
 {P.troops={hum_spear:4,hum_bow:2};const B=fight(['militia','militia','militia','archer','archer','archer']);B.units.forEach(u=>{u.cd=99;u.s={...u.s,spd:0}});
  const arc=t.grpUnits('e_arc'),inf=t.grpUnits('e_inf'),sp=t.grpUnits('inf')[0],ga=B.groups.e_arc,R=arc[0].s.range;
  arc.forEach((a,i)=>{a.x=600;a.y=280+i*12});inf.forEach((u,i)=>{u.x=600-R*.6;u.y=280+i*12});sp.x=inf[0].x-12;sp.y=inf[0].y;B.hero.x=600-R*.7;B.hero.y=330;
  B.cmdT=0;t.command(.01);arc.forEach(a=>{a.rt=0;a.aimA=Math.PI;t.aiUnit(a,.01,null)});ok(ga.order==='charge'&&ga.tgt===sp&&arc.every(a=>a.tgt===sp),'their commander sets their archers on the soldier fighting their infantry, not your hero standing by');
  sp.x=200;const sp2=t.grpUnits('inf')[1];sp2.x=arc[0].x-10;sp2.y=arc[0].y;B.cmdT=0;t.command(.01);
  ok(B.groups.e_inf.order==='charge'&&B.groups.e_inf.tgt===sp2,'one of yours among their archers: their infantry goes to the rescue');
  ga.tgt=B.hero;arc[0].rt=0;t.aiUnit(arc[0],.01);ok(arc[0].tgt===sp2,'and an archer set on someone else turns on the soldier right on top of him');
  arc.forEach(a=>t.outOfAmmo(a));B.cmdT=0;t.command(.01);ok(ga.order==='charge'&&!ga.skirmish,'out of arrows, they join the melee');B.over=true;B.endT=0;t.B=null}
 // its cavalry charges, then pulls back to charge again
 {P.troops={hum_spear:6};const B=fight(['horse','horse','horse','militia']);const gc=B.groups.e_cav,cav=t.grpUnits('e_cav');gc.phase='charge';
  const tg=t.grpUnits('inf')[0];cav.forEach(u=>{u.x=tg.x+8;u.y=tg.y});gc.tgt=tg;for(let k=0;k<10;k++){B.cmdT=0;t.command(.01)}
  ok(gc.phase==='regroup'&&gc.order==='hold','after a while in the melee their cavalry pulls back');gc.t=99;B.cmdT=0;t.command(.01);ok(gc.phase==='charge'&&gc.tgt,'and charges again');
  ok(t.unitClass(gc.tgt.s)!=='spear'||t.grpUnits('inf').every(u=>t.unitClass(u.s)==='spear'),'(not into braced spears, if it can help it)');B.over=true;B.endT=0;t.B=null}
 // stamina: a charge spends it, running wears it down, standing out of the fight restores it; tired, slower and weaker
 {const B=fight(['militia','militia']),F=t.FATIGUE,inf=t.grpUnits('inf'),u=inf[0];u.vig=1;// (a vigor of 100: the plain numbers)
 
  ok(B.units.filter(x=>!x.hero).every(x=>x.sta===F.max)&&B.hero.sta==null,'every soldier starts rested ('+F.max+'); your hero has their own stamina');
  const e=B.units.find(x=>x.team===1);u.sta=F.max;u.run=t.CHARGE.run;t.chargeMul(u,e);ok(Math.abs(u.sta-(F.max-F.charge))<.01,'a full charge costs '+F.charge+' stamina at the impact');
  u.sta=F.max;u.run=t.CHARGE.run/2;t.chargeMul(u,e);ok(u.sta<F.max&&u.sta>F.max-F.charge,'half a run, half the cost');
  u.sta=50;t.fatigueStep(u,1,true,false,false,false);const ran=50-u.sta;u.sta=50;t.fatigueStep(u,1,true,false,true,false);ok(ran>0&&Math.abs(50-u.sta-2*ran)<.01,'running wears it down, charging twice as fast');
  u.sta=50;t.fatigueStep(u,1,true,true,false,false);ok(u.sta===50,'walking neither spends nor restores');
  t.fatigueStep(u,1,false,false,false,true);ok(u.sta===50,'nor does fighting where it stands');t.fatigueStep(u,1,false,false,false,false);ok(u.sta===50+F.rest,'standing out of the fight restores it');
  u.sta=F.max;t.fatigueBlow(u);ok(u.sta===F.max-F.blow,'each blow costs a little');
  u.sta=F.tired-1;const T1=t.tiredMul(u);u.sta=F.spent-1;const T2=t.tiredMul(u);u.sta=F.max;const T0=t.tiredMul(u);
  ok(T0.spd===1&&T1.spd<1&&T2.spd<T1.spd&&T1.dmg<1&&T2.dmg<T1.dmg&&T1.run<1&&T2.run===0,'tired: slower and weaker, a charge builds half as fast; spent: no charge at all');
  inf.forEach(x=>x.sta=F.tired-5);ok(t.grpMorale(inf).weak.includes('tired'),'a tired unit\u2019s banner says so');
  t.selectGroup('inf');t.setOrderUI();ok(document.querySelector('[data-grp="inf"] .cst.low'),'its card shows its stamina, low');ok(/Stamina \d+ · tired/.test(document.getElementById('bInfo').textContent),'and its details');
  B.over=true;B.endT=0;t.B=null}
 // in the fight: a rider who charges is winded, a spent one is slow
 {const B=fight(['militia']),e=B.units.find(u=>u.team===1),F=t.FATIGUE;
  B.obs=[];B.units.filter(u=>u.team===0&&!u.hero).forEach(u=>u.hp=0);e.x=t.BW/2;e.y=t.BH/2;e.cd=99;e.s={...e.s,spd:0};e.hp=e.max=9999;B.hero.x=10;B.hero.y=10;B.hero.s={...B.hero.s,spd:0};
  const base=B.units.find(u=>u.team===0&&!u.hero&&!u.comp&&!u.champ),mk=(id,y)=>({...base,id,type:'horse',s:{...t.ST.horse},hp:44,max:44,x:t.BW/2-150,y,grp:'cav',run:0,cd:0,dead:false,mor:80,mor0:80,tgt:null,rt:0,sta:F.max});
  const r=mk(999,t.BH/2);B.units.push(r);B.groups.cav.order='charge';B.groups.cav.run=true;let hit=false;for(let i=0;i<120&&!hit;i++){t.updateBattle(.03);if(e.hitAt)hit=true}
  ok(hit&&r.sta<F.max-F.charge*.8,'a rider who charged home is winded ('+Math.round(r.sta)+' stamina left)');
  r.hp=0;e.hitAt=null;const a=mk(1001,t.BH/2-40),b=mk(1002,t.BH/2+40);b.sta=F.spent-5;B.units.push(a,b);const ax=a.x,bx=b.x;for(let i=0;i<10;i++)t.updateBattle(.03);
  ok(b.x-bx<(a.x-ax)*.8&&b.run===0&&a.run>0,'a spent rider is slow and builds no charge ('+(b.x-bx).toFixed(1)+' against '+(a.x-ax).toFixed(1)+' px)');B.over=true;B.endT=0;t.B=null}
 // your side too: your hero's SP pays for a run and a charge, and your troops tire charging across the field
 {const B=fight(['militia','militia']),F=t.FATIGUE,h=B.hero,X=t.heroState(),mx=t.maxSP();
  X.sp=mx;h.run=t.CHARGE.run;const e=B.units.find(u=>u.team===1);e.x=h.x+h.s.reach;e.y=h.y;h.cd=0;t.charStrike(h,e);
  ok(mx-X.sp>=F.charge*mx/F.max-.6&&h.run===0,'your hero\u2019s charge costs their stamina ('+Math.round(mx-X.sp)+' SP with the blow)');
  X.sp=mx/2;X.spT=9;t.fatigueStep(h,1,true,false,true,false);ok(X.sp<mx/2&&X.spT===0,'running at the enemy wears your hero down, and holds off their breath coming back');
  X.sp=mx*.3;t.setOrderUI();ok(Math.abs(t.grpStamina([h])-.3)<.01&&document.querySelector('[data-grp="hero"] .cst.low'),'your hero’s card shows their stamina, low');
  B.units.filter(u=>u.team===1).forEach(u=>{u.x=t.BW-40;u.cd=99});X.sp=mx;const inf=t.grpUnits('inf');inf.forEach(u=>u.sta=F.max);
  t.selectGroup('inf');{const e2=B.units.find(u=>u.team===1&&u.hp>0);t.rtsOrder(e2.x,e2.y-6,{run:true})}let sp0=X.sp;for(let i=0;i<60;i++)t.updateBattle(.03);
  ok(inf.every(u=>u.sta<F.max),'your infantry ordered to charge tire as they run ('+Math.round(inf[0].sta)+')');
  t.selectGroup('hero');{const e2=B.units.find(u=>u.team===1&&u.hp>0);t.rtsOrder(e2.x,e2.y-6,{run:true})}X.sp=mx;for(let i=0;i<60;i++)t.updateBattle(.03);ok(X.sp<mx,'and your hero, sent charging, spends SP ('+Math.round(X.sp)+' / '+mx+')');
  B.over=true;B.endT=0;t.B=null}
 // the icons are clicked as their groups: select, attack, move to
 {const B=fight(['militia','militia','archer']);t.beginFight&&B.deploy&&t.beginFight();t.frame();
  const mid=g=>{const r=B.icons.find(r=>r.g===g);return r&&t.toField({x:r.x+r.w/2,y:r.y+6})};
  const qa=mid('arc');B.sel='all';t.rtsSelect(qa.x,qa.y,qa.x,qa.y);ok(B.sel==='arc','a click on the archers\u2019 icon selects the archers');
  ok(B.units.every(u=>u.hp<=0||Math.hypot(u.x-qa.x,u.y-6-qa.y)>t.RTS_PICK),'(clicked on the icon, away from any soldier)');
  const eg=B.icons.find(r=>r.team===1).g,qe=mid(eg);t.rtsOrder(qe.x,qe.y);ok(B.groups.arc.order==='charge'&&B.groups.arc.tgt&&B.groups.arc.tgt.grp===eg,'a right-click on an enemy icon sets them on that unit');
  t.frame();const qi=mid('inf'),inf=t.grpUnits('inf'),cx=inf.reduce((a,u)=>a+u.x,0)/inf.length;t.rtsOrder(qi.x,qi.y);ok(B.groups.arc.order==='hold'&&Math.abs(B.groups.arc.ax-cx)<12,'and on one of your own, they go to where that unit stands');
  const hv=t.toField({x:B.icons[0].x+3,y:B.icons[0].y+3});B.hov=hv;B.iconHov=t.iconAt(hv.x,hv.y).g;ok(B.iconHov===B.icons[0].g,'pointing at an icon lights it');
  B.over=true;B.endT=0;t.B=null}
 // the field's edges: nobody fights under the battle HUD; the press: a soldier kept out of reach turns on another
 {const B=fight(['militia']),top=t.fieldTop(),bot=t.fieldBot();ok(top>=18&&bot<=t.BH-6&&bot-top>=t.BH*.3,'the field in sight: from '+top+' to '+bot+' (of '+t.BH+')');
  ok(B.units.every(u=>u.y>=top&&u.y<=bot),'every soldier starts inside it');B.units.forEach(u=>u.y=t.BH);t.updateBattle(.03);ok(B.units.every(u=>u.hp<=0||u.y<=bot),'and none can go under the bottom bar');
  t.selectGroup('inf');t.rtsOrder(t.BW/2,t.BH-2);ok(B.groups.inf.ay<=bot,'an order to the bottom edge stops where you can see them');B.over=true;B.endT=0;t.B=null}
 {const trial=(ex,ey)=>{P.troops={hum_levy:10};P.comps={};G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['chief','chief','chief']};t.startBattle({enemies:['chief','chief','chief'],tournament:false});const B=t.B;
   B.hero.x=10;B.hero.y=t.BH/2;B.hero.s={...B.hero.s,spd:0};const es=B.units.filter(u=>u.team===1);es.forEach((e,i)=>{e.x=ex;e.y=ey+(i-1)*14;e.hp=e.max=99999;e.cd=999;e.s={...e.s,spd:0};e.grp=null});
   const mine=B.units.filter(u=>u.team===0&&!u.hero);mine.forEach((u,i)=>{u.x=ex-40;u.y=ey+(i-5)*8;u.grp=null;u.mor=999});const hit=new Set(),at={};
   for(let k=0;k<200;k++){mine.forEach(u=>at[u.id]=u.atkAt);t.updateBattle(.03);mine.forEach(u=>{if(u.atkAt!==at[u.id])hit.add(u.id)})}B.over=true;B.endT=0;t.B=null;return hit.size};
  const open=trial(t.BW/2,t.BH/2),edge=trial(t.BW-8,t.fieldBot()-14);ok(open>=9&&edge>=9,'pressed round a few foes, the men behind find one with room: '+open+' of 10 strike in the open, '+edge+' of 10 in a corner')}
 // effects: sparks and a flash where a blow lands, blood that falls and stains, the dead fall before they lie, a charge's shockwave
 {const B=fight(['militia','militia']),e=B.units.find(u=>u.team===1),me=B.units.find(u=>u.team===0&&!u.hero);B.vfx=[];
  t.vfxHit(me,e,8);const k=n=>B.vfx.filter(p=>p.k===n).length;ok(k('spark')>=3&&k('glow')===1&&k('blood')>=1,'a blow: sparks off the steel, a flash, blood ('+k('spark')+' sparks)');
  const sp=B.vfx.find(p=>p.k==='spark'),x0=sp.x;t.vfxStep(.05);ok(sp.x!==x0,'they fly');for(let j=0;j<40;j++)t.vfxStep(.05);ok(k('spark')===0&&k('glow')===0&&k('blood')===0&&!!B.gore,'and fade, the blood landing as a splash on the field');
  e.hp=1;t.hit(me,e,99);const cp=B.corpses[B.corpses.length-1];ok(e.hp<=0&&cp&&cp.wait&&B.vfx.some(p=>p.k==='fall'),'one struck down falls first');for(let j=0;j<12;j++)t.vfxStep(.05);ok(!cp.wait,'then lies where he fell');
  B.slow=0;const cav={x:e.x-30,y:e.y,s:{...t.ST.horse},team:0,run:t.CHARGE.run},f2=B.units.find(u=>u.team===1&&u.hp>0);t.chargeMul(cav,f2);ok(B.vfx.some(p=>p.k==='shock')&&B.slow>0,'a charge strikes home: a shockwave of dust, and a moment of slow motion');
  const t0=B.t;t.updateBattle(.03);const slowStep=B.t-t0;B.slow=0;const t1=B.t;t.updateBattle(.03);ok(slowStep<(B.t-t1)*.6,'(the fight runs slower for that moment)');
  B.over=true;B.endT=0;t.B=null}
 // movement: dust from running feet, arrows that stay where they strike; each skill its own effect
 {const B=fight(['militia']),me=B.units.find(u=>u.team===0&&!u.hero),e=B.units.find(u=>u.team===1);B.vfx=[];
  me.dustT=0;t.footDust(me,.01);const d=B.vfx.find(p=>p.k==='dust');ok(d&&d.col===t.dustCol(),'running feet kick up dust the colour of the ground ('+d.col+')');
  t.stickArrow(e,{vx:100,vy:0});t.stickArrow(e,{vx:100,vy:0});t.stickArrow(e,{vx:100,vy:0});t.stickArrow(e,{vx:100,vy:0});ok(e.stuckA.length===3,'arrows stay stuck in a man (three at most)');
  const sh=B.units.find(u=>u.team===0&&t.tagsOf(u.s).includes('shield'))||me;sh.s={...sh.s,tags:['shield']};sh.dir=Math.PI;sh.inSlot=false;sh.grp=null;B.vfx=[];t.vfxHit({x:sh.x-40,y:sh.y},sh,5,{arrow:true});
  ok(B.vfx.some(p=>p.k==='spark'&&p.col==='#c8945a')&&!B.vfx.some(p=>p.k==='blood'),'an arrow into a shield: splinters, no blood');
  const h=B.hero,X=t.heroState(),kinds=id=>{B.vfx=[];X.sp=X.mp=999;X.cds={};X.leap=X.dash=null;t.castAbility(h,id,{x:h.x+30,y:h.y});return new Set(B.vfx.map(p=>p.k))};
  ok(kinds('whirl').has('swirl'),'Whirlwind: a swirl of blades');ok(kinds('quake').has('crack'),'Earthquake: the ground cracks');ok(kinds('nova').has('frost'),'Frost Nova: frost on the ground');
  ok([...kinds('heal')].includes('ember'),'Healing Light: rising sparkles');ok(kinds('cry').has('shock'),'War Cry: rings of sound');
  X.sp=X.mp=999;X.cds={};t.castAbility(h,'leap',{x:h.x+60,y:h.y});B.vfx=[];let gh=0;for(let j=0;j<15&&X.leap;j++){t.leapStep(h,X,.03);gh+=B.vfx.filter(p=>p.k==='ghost').length}ok(gh>0,'Leap Slam: an afterimage trail ('+gh+')');ok(B.vfx.some(p=>p.k==='crack'),'and the ground cracks where they land');
  B.vfx=[];t.vfxExplode(300,300,32);ok(['glow','shock','ember','dust'].every(k=>B.vfx.some(p=>p.k===k)),'a fireball bursts: a flash, a ring of fire, embers, smoke');
  B.over=true;B.endT=0;t.B=null}
 // falling back: a move order breaks a group off the fight it is in; Hold where they stand does not
 {const B=fight(['militia','militia','militia','militia']);B.obs=[];const inf=t.grpUnits('inf'),es=B.units.filter(u=>u.team===1);
  const cx=t.BW/2,cy=(t.fieldTop()+t.fieldBot())/2;es.forEach((e,i)=>{e.x=cx+10;e.y=cy+(i-2)*10;e.grp=null;e.hp=e.max=999;e.s={...e.s,spd:0};e.cd=99});
  B.groups.inf.ax=cx-4;B.groups.inf.ay=cy;inf.forEach(u=>{u.x=cx-4+u.sx;u.y=cy+u.sy});B.hero.x=20;B.hero.y=cy;
  for(let j=0;j<40;j++)t.updateBattle(.03);const struck=es.some(e=>e.hp<999);ok(struck,'engaged: they fight');
  t.selectGroup('inf');t.rtsOrder(cx-160,cy);const at0={},hp0=es.map(e=>e.hp);inf.forEach(u=>at0[u.id]=u.atkAt);const x0=inf.reduce((a,u)=>a+u.x,0)/inf.length;
  for(let j=0;j<25;j++)t.updateBattle(.03);const x1=inf.reduce((a,u)=>a+u.x,0)/inf.length;
  ok(x1<x0-5&&inf.every(u=>u.atkAt===at0[u.id]),'ordered back, they break off and go, striking no one ('+Math.round(x0-x1)+' px back)');
  for(let j=0;j<400&&inf.some(u=>t.relocating(u,B.groups.inf));j++)t.updateBattle(.03);ok(inf.every(u=>!t.relocating(u,B.groups.inf)),'and once in their new places, they fight again whatever comes');
  inf.forEach(u=>{u.x=cx-4+u.sx;u.y=cy+u.sy});B.groups.inf.ax=cx-4;B.groups.inf.ay=cy;t.setOrder('hold');inf.forEach(u=>at0[u.id]=u.atkAt);for(let j=0;j<40;j++)t.updateBattle(.03);
  ok(inf.some(u=>u.atkAt!==at0[u.id]),'Hold where they stand is no move: in the fight, they keep fighting');B.over=true;B.endT=0;t.B=null}
 // the pace of an attack: a right-click on an enemy walks in (no charge); a double right-click charges (at a run, building it)
 {const B=fight(['militia']);B.obs=[];const e=B.units.find(u=>u.team===1),inf=t.grpUnits('inf');e.x=t.BW/2+120;e.y=(t.fieldTop()+t.fieldBot())/2;e.s={...e.s,spd:0};e.hp=e.max=9999;e.cd=99;e.grp=null;
  t.selectGroup('inf');t.rtsOrder(e.x,e.y-6);ok(B.groups.inf.tgt===e&&!B.groups.inf.run&&t.walking(B.groups.inf),'right-click an enemy: they walk in to fight him');
  for(let j=0;j<40;j++)t.updateBattle(.03);ok(inf.every(u=>!(u.run>0)),'walking in, they build no charge');
  t.rtsOrder(e.x,e.y-6,{run:true});ok(B.groups.inf.run&&B.groups.inf.tgt===e,'a double right-click on him: a charge');let built=0;for(let j=0;j<40;j++){t.updateBattle(.03);built=Math.max(built,...inf.map(u=>u.run||0))}
  ok(built>t.CHARGE.run*.2,'running at him, the charge builds ('+Math.round(built)+' px)');
  t.rtsOrder(t.BW/4,e.y);ok(!B.groups.inf.run,'and the next order goes back to their pace');t.setOrder('charge');ok(!t.walking(B.groups.inf)&&B.groups.inf.order==='hold','Charge sets them running, and sends them nowhere');
  B.over=true;B.endT=0;t.B=null}
 // the icons: walking (advance), running (charge), a white flag (withdraw), the same flag over a unit that runs
 ok(t.ORDER_ICON.withdraw[0].includes('b')&&t.ORDER_ICON.charge.some(r=>r.includes('b'))&&t.GLYPH.routing,'advance walks, charge runs, withdraw is a white flag (and so is a routed unit\u2019s badge)');
 // no flicker: closing on their foes and pointing their weapons, men do not flip their facing or their weapon's angle back and
 // forth from one frame to the next; and the icons of groups that come close are set side by side, never on top of each other
 {P.troops={hum_spear:8};G.mode='world';G.modal=false;t.hidePanel();const L=['orc_grunt','orc_grunt','orc_shield','orc_shield','hum_levy','hum_levy','militia','militia'];G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:L};
  t.startBattle({enemies:L,tournament:false});const B=t.B;B.obs=[];B.noMorale=true;const es=B.units.filter(u=>u.team===1),my=B.units.filter(u=>u.team===0&&!u.hero),mx=my.reduce((a,u)=>a+u.x,0)/my.length;
  B.units.forEach(u=>u.hp=u.max=u.max*20);es.forEach(u=>{u.x=mx+140+Math.random()*20;u.grp=null});const fl={},ix={};es.forEach(u=>{fl[u.id]=[];ix[u.id]=[]});let ov=0;
  for(let f=0;f<700;f++){t.updateBattle(.016);t.frame();es.forEach(u=>{if(u.nearW)u.wasNear=true;fl[u.id].push(u.face);if(u.wIdx!=null)ix[u.id].push(u.wIdx)});
   const I=B.icons||[];for(let a=0;a<I.length;a++)for(let b=a+1;b<I.length;b++){const p=I[a],q=I[b];if(p.x<q.x+q.w&&q.x<p.x+p.w&&p.y<q.y+q.h&&q.y<p.y+p.h)ov++}}
  const flips=a=>{let n=0;for(let k=2;k<a.length;k++)if(a[k]!==a[k-1]&&a[k]===a[k-2])n++;return n},F=es.reduce((a,u)=>a+flips(fl[u.id]),0),X=es.reduce((a,u)=>a+flips(ix[u.id]),0);
  ok(es.filter(u=>u.wasNear).length>=6&&F===0&&X===0,'closing in and pointing their weapons, none flickers ('+es.filter(u=>u.wasNear).length+' came to grips; '+F+' facing and '+X+' weapon flips)');
  ok(ov===0,'and the icons of groups close together never sit on top of each other ('+ov+' overlaps)');B.over=true;B.endT=0;t.B=null}
 // steady: a man in his place stays there till pushed clearly out; a shooter stands while his foe is in his range
 {const B=fight(['militia']);B.obs=[];const e=B.units.find(u=>u.team===1);e.x=t.BW-30;e.s={...e.s,spd:0};e.cd=99;const inf=t.grpUnits('inf'),u=inf[0];
  const g=B.groups.inf;inf.forEach(m=>{m.x=g.ax+m.sx;m.y=g.ay+m.sy});for(let j=0;j<10;j++)t.updateBattle(.03);ok(u.slotted,'in his place');const sx=g.ax+u.sx;u.y=g.ay+u.sy;u.x=sx+4;t.updateBattle(.03);ok(u.spdNow===0,'nudged a little, he stays (no step, stop, step as his neighbours jostle)');
  u.x=sx+12;t.updateBattle(.03);ok(u.spdNow>0,'pushed well out, he goes back');B.over=true;B.endT=0;t.B=null}
 {const B=fight(['militia']);B.obs=[];const e=B.units.find(u=>u.team===1),a=B.units.find(u=>u.team===0&&u.s.range);a.grp=null;e.s={...e.s,spd:0};e.cd=99;e.hp=e.max=9999;
  const R=a.s.range;e.x=a.x+R*.8;e.y=a.y;a.tgt=e;a.inRng=true;t.aiUnit(a,.03,()=>{});ok(a.spdNow===0,'a shooter with his foe at 80% of his range stands and shoots');
  e.x=a.x+R*.99;t.aiUnit(a,.03,()=>{});ok(a.spdNow===0,'at 99% of his range he still stands and shoots (his whole range)');e.x=a.x+R*1.05;t.aiUnit(a,.03,()=>{});ok(a.spdNow>0,'past it, he closes in');e.x=a.x+R*.99;t.aiUnit(a,.03,()=>{});ok(a.spdNow>0,'and keeps closing till 97% (no step and stop at one line)');B.over=true;B.endT=0;t.B=null}
 // idle: standing men breathe, each on his own rhythm
 {const L=t.lookOf('hum_spear',0,false,0,'',null);ok(t.peopleSprite(L,1,true).toDataURL()!==t.peopleSprite(L,0,true).toDataURL(),'a standing man breathes (his idle frames differ)');
  const B=fight(['militia']);const us=t.grpUnits('inf');let ph=new Set();for(let j=0;j<40;j++){t.updateBattle(.03);us.forEach(u=>{u.spdNow=0;u.atkAt=null});ph.add(us.map(u=>t.procPose(u,false)).join(''))}ok(ph.size>2,'and not all at once');B.over=true;B.endT=0;t.B=null}
 // the other side commands as you do: its groups laid out in ranks, walking unless they charge, breaking off when moved, and
 // in the formation the moment wants
 {P.troops={hum_bow:1,hum_spear:2};G.mode='world';G.modal=false;t.hidePanel();const L=['hum_foot','hum_foot','hum_foot','hum_foot','hum_foot','hum_foot','hum_bow','hum_bow','hum_knight','hum_knight','hum_knight'];
  G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:L};t.startBattle({enemies:L,tournament:false});const B=t.B,ei=B.groups.e_inf,ea=B.groups.e_arc,ec=B.groups.e_cav;
  ok(ei&&ei.walk&&ea&&ec,'their groups have the same pace as yours (walking unless running)');
  const sl=t.grpUnits('e_inf').map(u=>Math.round(u.sx)+','+Math.round(u.sy));ok(new Set(sl).size===sl.length&&t.grpUnits('e_inf').every(u=>Math.abs(u.sx)<80),'and stand in ranks, laid out as yours are');
  ei.order='advance';ei.run=false;ok(t.walking(ei),'advancing, they walk');B.cmdT=0;t.command(.01);t.grpUnits('e_inf').forEach(u=>{u.x=ei.ax+u.sx;u.y=ei.ay+u.sy});B.cmdT=0;t.command(.01);ok(ei.form!=='wall','your army has archers, but none are shooting at them: no shield wall yet');
  [...t.grpUnits('e_inf'),...t.grpUnits('e_arc')].forEach(u=>u.shotAt=B.t);t.grpUnits('e_inf').forEach(u=>{u.x=ei.ax+u.sx;u.y=ei.ay+u.sy});B.cmdT=0;t.command(.01);// (now under your arrows, standing on their line: on the march they keep a line)
  const shot=t.assess(1).shootFoe;ok(ei.form==='wall','under your arrows, their shielded infantry holds a shield wall ('+ei.form+')');ok(ea.form==='loose','their archers, shot at, spread out ('+ea.form+')');
  ec.phase='charge';ec.order='charge';ec.tgt=t.grpUnits('arc')[0];B.cmdT=0;t.command(.01);ok(ec.form==='wedge'&&ec.run,'their cavalry charges at a run, in a wedge');
  ea.standAt(ea.ax,ea.ay);const m0=ea.mvId||0;ea.standAt(ea.ax-120,ea.ay);ok((ea.mvId||0)>m0,'sent to a new place well away, a group breaks off and goes (as your moves do)');
  B.over=true;B.endT=0;t.B=null}
 // stamina comes back only standing out of the fight, for everyone: your hero, a champion, a soldier; mana and health not at all
 // (but for the talents, gear and skills for it)
 {const B=fight(['militia']);B.obs=[];const e=B.units.find(u=>u.team===1);e.x=t.BW-20;e.s={...e.s,spd:0};e.cd=99;const h=B.hero,X=t.heroState();h.grp=null;h.tgt=null;
  X.sp=10;X.mp=1;const sp0=X.sp;for(let j=0;j<100;j++){h.x=40;h.y=200;t.fatigueStep(h,.03,false,false,false,false);t.heroActions(.03)}const per=(X.sp-sp0)/3/t.maxSP()*100;
  ok(per>0&&per<=t.FATIGUE.rest*(1+t.tm('spRegen'))+.01,'your hero gets breath back as slowly as a soldier, standing ('+per.toFixed(2)+'% a second)');
  ok(X.mp===1||t.tm('mpRegen')>0,'and no mana back without the talent for it');
  const s1=X.sp;for(let j=0;j<30;j++)t.fatigueStep(h,.03,false,false,false,true);ok(X.sp===s1,'and none at all while fighting');
  for(let j=0;j<30;j++)t.fatigueStep(h,.03,true,true,false,false);ok(X.sp===s1,'or walking');
  const hp0=h.hp=h.max-50;for(let j=0;j<60;j++)t.updateBattle(.03);ok(h.hp<=hp0||t.gm('regen')>0||t.tm('regen')>0,'nor health');B.over=true;B.endT=0;t.B=null}
 // the fallen lie as bodies where they fell, their weapons dropped; they bleed (or not, with Blood off); the longest chain told in the log
 {const B=fight(['militia','militia']);const me=B.units.find(u=>u.team===0&&!u.hero),e=B.units.find(u=>u.team===1);t.setBlood(true);
  e.hp=1;t.hit(me,e,99);const cp=B.corpses[B.corpses.length-1];ok(cp.sp&&cp.sp.body&&cp.sp.stand,'one struck down has a body to lie as');
  ok(cp.sp.body.width===cp.sp.stand.height&&cp.sp.body.height===cp.sp.stand.width,'him, turned flat (pixel for pixel)');
  t.drawBattle();B.t+=t.GORE.fall+t.GORE.pool+.1;t.drawBattle();ok(cp.baked&&B.gore,'once he has bled, he is painted into the field (no cost to show)');
  const px=B.gore.getContext('2d').getImageData(Math.round(cp.x)-12,Math.round(cp.y)-8,30,14).data;let red=0;for(let i=0;i<px.length;i+=4)if(px[i+3]&&px[i]>2*px[i+1]&&px[i]>2*px[i+2])red++;ok(red>6,'lying in his blood ('+red+' px)');
  t.setBlood(false);t.drawBattle();const px2=B.gore.getContext('2d').getImageData(Math.round(cp.x)-12,Math.round(cp.y)-8,30,14).data;let red2=0,any=0;for(let i=0;i<px2.length;i+=4){if(px2[i+3])any++;if(px2[i+3]&&px2[i]>2*px2[i+1]&&px2[i]>2*px2[i+2])red2++}
  ok(red2<red&&any>0,'Blood off: the field is painted again, the body still there, the pool gone');
  B.vfx=[];const e2=B.units.find(u=>u.team===1&&u.hp>0);if(e2){t.vfxHit(me,e2,20,{crit:true});t.applyDmg(e2,5,1);ok(!B.vfx.some(p=>p.k==='blood'),'and blows draw no blood (nor does the wound itself)')}t.setBlood(true);
  B.bestCombo=4;const n0=G.msgs.length;B.win=true;B.over=true;t.finishBattle();ok(G.msgs.slice(n0).some(m=>/longest chain of blows: 4/.test(m.m)),'the longest chain of blows is told in the log');t.hidePanel&&t.hidePanel();G.modal=false;t.B=null}
 // Hold lights only while they hold: standing in their places, not on the way to new ones
 {const B=fight(['militia']);B.obs=[];B.units.filter(u=>u.team===1).forEach(u=>{u.x=t.BW-20;u.cd=99;u.s={...u.s,spd:0}});t.selectGroup('inf');const hb=document.querySelector('[data-order="hold"]');
  for(let j=0;j<150;j++)t.updateBattle(.03);t.setOrderUI();ok(hb.classList.contains('on'),'standing in their places, Hold is lit');
  const g=B.groups.inf;t.rtsOrder(g.ax+150,g.ay);for(let j=0;j<10;j++)t.updateBattle(.03);t.setOrderUI();ok(!hb.classList.contains('on'),'sent somewhere, it is not (they are on the move)');
  for(let j=0;j<400;j++)t.updateBattle(.03);t.setOrderUI();ok(hb.classList.contains('on'),'and lit again once they stand in their new places');B.over=true;B.endT=0;t.B=null}
 // one mind for every character: your hero, a lord, a chieftain, a companion (commander.js); the hero's own AI file is gone
 {ok(typeof t.charAuto==='function'&&(0,eval)('typeof heroAuto')==='undefined'&&!document.querySelector('script[src="js/battle/heroai.js"]'),'one AI for every character: your hero\u2019s is the champions\u2019 (commander.js)');
  P.slots=Array(10).fill(null);P.comps={brann:{ap:0,role:''}};t.compInit('brann');const B=fight(['militia','militia','militia']);B.obs=[];const c=B.units.find(u=>u.comp),fs=B.units.filter(u=>u.team===1);
  c.s={...c.s,tags:[...(c.s.tags||[]),'shield']};c.grp=null;const C=t.champ(c);C.sp=999;C.cds={};
  fs.forEach((u,i)=>{u.x=c.x+10;u.y=c.y+(i-1)*5;u.cd=99;u.hp=u.max=9999;u.s={...u.s,spd:0,dmg:14}});B.hero.x=10;B.hero.y=10;
  ok(t.charBasics(c)&&C.shoveCd>=t.CHAR_AI.bash-.01,'a companion with a shield bashes a heavy hitter in front of them');ok(fs.some(u=>u.stun>0),'and staggers them');
  C.sp=999;ok(!t.charBasics(c),'but not again for '+t.CHAR_AI.bash+' s (no spamming it away)');
  C.shoveCd=0;c.sta=t.FATIGUE.tired-5;ok(!t.charBasics(c),'nor while tired');c.sta=t.FATIGUE.max;
  C.shoveCd=99;c.hp=c.max*.2;ok(t.charBasics(c)&&C.roll>0,'badly hurt and hemmed in, they roll away (as your hero does)');const hp=c.hp;t.applyDmg(c,50,1);ok(c.hp===hp,'unhurt while rolling');
  c.hp=c.max;C.roll=0;C.cds={};C.sp=t.ABILITIES.whirl.sp+t.CHAR_AI.keepSp-1;C.mp=999;ok(!t.chooseAbility(c)||!c.unit.actives().includes('whirl'),'they keep back a little stamina for their blows, as your hero does');
  B.over=true;B.endT=0;t.B=null}
 {P.comps={brann:{ap:0,role:''}};t.compInit('brann');const L=t.W.lords.find(l=>!l.dead);Object.assign(L,{inside:null,x:P.x,y:P.y,troops:Array(4).fill('hum_spear')});P.troops={hum_spear:4};G.mode='world';G.modal=false;t.hidePanel();
  t.startEncounter({kind:'lord',ref:L,list:L.troops.slice(),allies:[],foes:[]});t.startBattle({enemies:G.enc.list,tournament:false});const B=t.B,lord=B.units.find(x=>x.leader&&x.leader.ref===L),c=B.units.find(u=>u.comp);
  if(c&&lord){c.grp=null;c.x=lord.x-60;c.y=lord.y;B.hero.x=10;B.hero.y=10;c.tgt=null;t.commandCharacters(.01);ok(c.tgt!==lord,'your companion does not pick his own duel: that is your call');B.auto=true;t.commandCharacters(.01);ok(c.tgt===lord,'with the AI in command, it sets him on their lord (as theirs set him on your hero)');B.auto=false}else ok(false,'a lord and a companion on the field');
  B.over=true;B.endT=0;t.B=null}
 // your hero with a shield: a bash now and then in a long melee, never a stream of them
 {P.gear.weapon=t.gearId('sword',0);P.gear.offhand=t.gearId('shield',0);P.slots=Array(10).fill(null);
  const B=fight(['militia','militia','militia']);B.obs=[];B.units.filter(u=>u.team===1).forEach((u,i)=>{u.hp=u.max=9999;u.s={...u.s,dmg:14};u.x=B.hero.x+12;u.y=B.hero.y+(i-1)*6});
  let bashes=0;const T0=B.t;for(let j=0;j<400;j++){t.updateBattle(.03);bashes+=B.floats.filter(f=>f.t==='Shield Bash'&&!f.seen&&(f.seen=true)).length}const secs=B.t-T0;
  ok(t.grip()==='shield'&&bashes>=1&&bashes<=Math.ceil(secs/t.CHAR_AI.bash)+1,'your hero with a shield bashes now and then, not all the time ('+bashes+' in '+secs.toFixed(0)+' s)');P.gear.offhand=null;B.over=true;B.endT=0;t.B=null}
 // one accuracy for every shooter: by weapon, race, a soldier's tier or a character's skill and bow, tiredness and the draw
 {const B=fight(['militia']);const mk=(o)=>({s:{range:120,tier:1,race:'human',...o.s},sta:o.sta==null?100:o.sta,team:0,unit:o.unit,leader:o.leader,comp:o.comp});
  const lv=mk({}),vet=mk({s:{tier:4}}),elf=mk({s:{race:'elf'}}),xb=mk({s:{flat:true}});
  ok(t.aimErr(vet).a<t.aimErr(lv).a&&t.aimErr(elf).a===t.aimErr(lv).a*t.AIM.elf,'veterans shoot truer than levies, elves truer still ('+t.aimErr(lv).a.toFixed(3)+' / '+t.aimErr(vet).a.toFixed(3)+' / '+t.aimErr(elf).a.toFixed(3)+')');
  ok(t.aimErr(xb).d===0&&t.aimErr(xb).a>t.aimErr(lv).a,'a crossbow or sling shoots flat: no arc to fall short, a wider spread');
  const tired=mk({sta:t.FATIGUE.tired-1}),spent=mk({sta:0});ok(t.aimErr(lv).a<t.aimErr(tired).a&&t.aimErr(tired).a<t.aimErr(spent).a,'tired, wider; spent, wider still');
  ok(t.aimErr(lv,.3).a>t.aimErr(lv,1).a,'a bow loosed before full draw flies less true');
  const sk={unit:{isChar:true,skill:()=>0,o:{gear:{weapon:t.gearId('bow',0)}}},comp:true},sk2={unit:{isChar:true,skill:()=>6,o:{gear:{weapon:t.gearId('bow',4)}}},comp:true};
  ok(t.aimErr(mk(sk2)).a<t.aimErr(mk(sk)).a*.6,'a character shoots truer with Archery and a better bow ('+t.aimErr(mk(sk)).a.toFixed(3)+' → '+t.aimErr(mk(sk2)).a.toFixed(3)+')');
  B.over=true;B.endT=0;t.B=null}
 // every shooter's shot (battle.js shotStep): in a forward arc, turning first; drawn, loosed, reloaded by its own times
 {const B=fight(['militia']);B.obs=[];const ar=t.grpUnits('arc'),a=ar[0],e=B.units.find(u=>u.team===1);B.units.filter(u=>u!==a&&u!==e).forEach(u=>{u.x=10;u.y=10;u.s={...u.s,spd:0};u.cd=99});
  a.grp=null;a.aimA=0;a.cd=0;a.shot=null;e.s={...e.s,spd:0};e.cd=99;e.hp=e.max=9999;e.x=a.x+a.s.range*.6;e.y=a.y;const T=t.shotTimes(a);
  ok(T.aim>0&&T.reload>0&&Math.abs(T.aim+T.reload-a.s.cd)<1e-6,'a shot is a draw and a reload, together its attack time ('+T.aim.toFixed(2)+' + '+T.reload.toFixed(2)+' s)');
  t.aiUnit(a,.03,null);ok(!!a.shot,'a foe in range and in front: they draw at once');ok(t.procPose(a,false)>=9&&t.procPose(a,false)<=11,'and the draw shows (its frames)');
  B.arrows=[];let n=0;while(a.shot&&n<200){t.aiUnit(a,.03,null);n++}ok(B.arrows.length===1&&Math.abs(n*.03-T.aim)<.1,'they loose when the draw is done ('+(n*.03).toFixed(2)+' s)');
  ok(a.cd>T.reload*.85&&a.cd<T.reload*1.15,'then reload');for(let j=0;j<12;j++)t.aiUnit(a,.03,null);B.t+=.36;ok(!a.shot&&t.procPose(a,false)>=12&&t.procPose(a,false)<=14,'the reload shows (its frames), no draw till it is done');
  a.cd=0;a.shot=null;a.aimA=0;e.x=a.x-a.s.range*.6;t.aiUnit(a,.03,null);
  ok(!a.shot,'a foe behind them: no shot, they never turn their arc themselves');a.aimA=Math.PI;a.cd=0;t.aiUnit(a,.03,null);ok(!!a.shot,'turned to face him (by you or their commander), they draw');
  a.cd=0;a.shot=null;a.aimA=0;a.face=1;a.grp='arc';B.groups.arc.skirmish=true;B.groups.arc.tgt=null;t.aiUnit(a,.03,null);ok(!t.roundFire(a)&&!a.shot,'skirmishers too shoot only in their cone: a foe behind, they turn first');B.groups.arc.skirmish=false;a.shot=null;
  a.cd=0;a.aimA=0;B.groups.arc.cease=true;e.x=a.x+60;t.aiUnit(a,.03,null);ok(!a.shot,'ceasing fire, no draw');B.groups.arc.cease=false;
  a.grp=null;a.aimA=0;a.cd=0;a.shot=null;t.aiUnit(a,.03,null);a.stun=.5;t.aiUnit(a,.03,null);ok(!a.shot,'staggered, the draw is let down');a.stun=0;
  B.sel='arc';B.hov=null;a.grp='arc';a.aimA=0;a.face=1;t.drawBattle();const px=(x,y)=>B.rangeCv.getContext('2d').getImageData(Math.round(x),Math.round(y),1,1).data[3];
  ok(px(a.x+a.s.range*.5,a.y)>0&&!px(a.x-a.s.range*.5,a.y),'their reach drawn as the fan in front of them, not behind');B.over=true;B.endT=0;t.B=null}
 // a lord or a companion with a bow: the same cycle, their own arrow
 {P.comps={brann:{ap:0,role:''}};t.compInit('brann');const B=fight(['militia']);B.obs=[];const c=B.units.find(u=>u.comp),e=B.units.find(u=>u.team===1);
  c.s={...c.s,range:150,reach:0,bow:true,flat:false,magic:false};c.grp=null;c.aimA=0;e.x=c.x+100;e.y=c.y;e.s={...e.s,spd:0};e.cd=99;e.hp=e.max=9999;c.cd=0;B.arrows=[];
  t.aiUnit(c,.03,t.charStrike);ok(!!c.shot&&!B.arrows.length,'a companion with a bow draws it first');let n=0;while(c.shot&&n<200){t.aiUnit(c,.03,t.charStrike);n++}
  ok(B.arrows.length===1&&B.arrows[0].arc,'and looses an arcing arrow at full draw');B.over=true;B.endT=0;t.B=null}
 // shooters shoot on their own unless told to cease fire (a toggle: Q); their reach and line of fire drawn as in Total War
 {const B=fight(['militia']);B.obs=[];const ar=t.grpUnits('arc'),e=B.units.find(u=>u.team===1);e.s={...e.s,spd:0};e.cd=99;e.hp=e.max=9999;
  ok(B.groups.arc&&!B.groups.arc.cease&&document.querySelector('[data-flag="cease"]')&&!document.querySelector('[data-flag="cease"]').classList.contains('on'),'shooters start firing at will: the Cease fire button is off');
  const a=ar[0];e.x=a.x+a.s.range*.7;e.y=a.y;B.arrows=[];let flew=0;for(let j=0;j<90;j++){t.updateBattle(.03);flew+=B.arrows.filter(x=>x.team===0).length}ok(flew>0,'an enemy in range: they shoot without being told');
  t.selectGroup('arc');t.toggleFlag('cease');t.setOrderUI();ok(B.groups.arc.cease&&document.querySelector('[data-flag="cease"]').classList.contains('on'),'Q: Cease fire, lit');
  B.arrows=[];ar.forEach(u=>u.cd=0);for(let j=0;j<60;j++)t.updateBattle(.03);ok(!B.arrows.filter(x=>x.team===0).length,'ceasing fire, they hold their shots');
  t.rtsOrder(e.x,e.y-6);ar.forEach(u=>u.cd=0);let shot=0;for(let j=0;j<60;j++){t.updateBattle(.03);shot+=B.arrows.filter(x=>x.team===0).length}ok(shot>0||e.hp<9999,'but shoot the enemy you set them on');
  t.toggleFlag('cease');ok(!B.groups.arc.cease,'Q again: fire at will');
  B.hov={x:e.x,y:e.y-4};t.drawBattle();ok(B.rangeCv&&B.rangeCv.getContext('2d').getImageData(Math.round(a.x+a.s.range-1),Math.round(a.y),1,1).data[3]>0,'their reach is drawn round them, out to their range');
  B.over=true;B.endT=0;t.B=null}
 // their archers, attacking, go up to shoot from their range; defending, they wait behind their line
 {P.troops={hum_spear:4};const L=['hum_bow','hum_bow','hum_bow','hum_bow','hum_foot','hum_foot','hum_foot','hum_foot','hum_foot','hum_foot','hum_foot','hum_foot'];G.mode='world';G.modal=false;t.hidePanel();
  G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:L};t.startBattle({enemies:L,tournament:false});const B=t.B;B.obs=[];
  t.grpUnits('inf').forEach(u=>{u.x=120;u.s={...u.s,spd:0}});B.hero.x=100;B.hero.y=B.groups.inf.ay;B.hero.s={...B.hero.s,spd:0};
  B.post={};(0,eval)('window.__pz=posture;posture=()=>"attack"');B.cmdT=0;const ei=()=>t.grpUnits('e_inf'),mine=B.units.filter(u=>u.team===0);let gap=null,j=0;
  for(;j<2500&&gap==null;j++){t.updateBattle(.03);if(B.arrows.some(a=>a.team===1))gap=Math.min(...ei().map(e=>Math.min(...mine.map(m=>Math.hypot(m.x-e.x,m.y-e.y)))))}
  (0,eval)('posture=__pz');ok(gap!=null&&gap>t.FOE_CMD.clash,'attacking, their archers go up to their range and shoot before the lines meet ('+(gap==null?'no shot':Math.round(gap)+' px apart, '+(j*.03).toFixed(0)+' s')+')');B.over=true;B.endT=0;t.B=null}
 // a group of mixed shooters: each kind's reach on its own, in its own colour
 {G.mode='world';G.modal=false;t.hidePanel();P.troops={hum_bow:3,hum_xbow:3,hum_spear:2};G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia']};t.startBattle({enemies:['militia'],tournament:false});const B=t.B;t.selectGroup('arc');B.hov=null;const ks=[...new Set(t.grpUnits('arc').map(u=>u.type))];
  const calls=[];const dr=t.drawReach;(0,eval)('window.__dr=drawReach;drawReach=(us,col)=>{__calls.push([us.length,col]);return __dr(us,col)}');window.__calls=calls;t.drawBattle();(0,eval)('drawReach=__dr');
  ok(ks.length===2&&calls.length===2&&calls[0][1]!==calls[1][1],'bowmen and crossbowmen in one group: two reaches, two colours ('+ks.join(', ')+')');B.over=true;B.endT=0;t.B=null}
 // a shooter's target by his own range, not his group's: a long bow reaches what a short one cannot; one in his arc before one he must turn to
 {const B=fight(['militia','militia']);B.obs=[];const ar=t.grpUnits('arc'),[a1,a2]=ar,es=B.units.filter(u=>u.team===1);B.groups.arc.tgt=null;
  es.forEach(e=>{e.s={...e.s,spd:0};e.cd=99;e.hp=e.max=9999});a1.s={...a1.s,range:220};a2.s={...a2.s,range:90};a1.aimA=a2.aimA=0;
  es[0].x=a1.x+180;es[0].y=a1.y;es[1].x=t.BW-10;es[1].y=10;a2.x=a1.x;a2.y=a1.y+8;
  a1.rt=0;a2.rt=0;a1.cd=a2.cd=0;a1.shot=a2.shot=null;t.aiUnit(a1,.03,null);t.aiUnit(a2,.03,null);ok(a1.tgt===es[0]&&!!a1.shot,'the long bow draws on a foe in his own reach');ok(!a2.shot,'the short bow, out of his own reach, does not');
  es[1].x=a1.x-100;es[1].y=a1.y;a1.shot=null;a1.cd=0;a1.rt=0;t.aiUnit(a1,.03,null);ok(a1.tgt===es[0],'of two in reach, the one in his arc first (no turning to the one behind)');
  B.over=true;B.endT=0;t.B=null}
 // their captain points out a foe; it does not set the whole group on him
 {P.troops={hum_spear:4,hum_bow:2};const L=['hum_bow','hum_bow','hum_bow','hum_foot','hum_foot'];G.mode='world';G.modal=false;t.hidePanel();
  G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:L};t.startBattle({enemies:L,tournament:false});const B=t.B;for(let j=0;j<200;j++)t.updateBattle(.03);
  ok(!B.groups.e_arc||!B.groups.e_arc.tgt,'their archers have no group target from their captain (each picks his own)');
  const ea=t.grpUnits('e_arc').filter(u=>u.tgt&&u.tgt.hp>0);ok(ea.every(u=>Math.hypot(u.tgt.x-u.x,u.tgt.y-u.y)<=u.s.range||!B.units.some(e=>e.team===0&&e.hp>0&&Math.hypot(e.x-u.x,e.y-u.y)<=u.s.range)),'each aims at one in his own reach, when there is one');
  B.over=true;B.endT=0;t.B=null}
 // skirmishers shoot as anyone does till a melee foe comes close; blades: they fight whoever reaches them, then shoot again
 {const B=fight(['militia']);B.obs=[];const ar=t.grpUnits('arc'),a=ar[0],e=B.units.find(u=>u.team===1),g=B.groups.arc;B.units.filter(u=>u!==a&&u!==e).forEach(u=>{u.x=10;u.y=10;u.hp=0});
  e.s={...e.s,spd:0};e.cd=99;e.hp=e.max=9999;g.skirmish=true;g.order='hold';g.tgt=null;a.aimA=0;a.cd=0;a.shot=null;e.x=a.x+a.s.range*.6;e.y=a.y;const x0=a.x;
  t.aiUnit(a,.03,null);ok(!a.skirm&&!t.roundFire(a)&&!!a.shot,'skirmishing allowed, a foe far off: they shoot from their place, in their arc, as anyone does');
  // (the group backs off, together; its soldiers keep their places in it)
  g.placeAt(450,g.ay);a.x=g.ax+a.sx;a.y=g.ay+a.sy;// (mid-field: room to back off)
  const kp=Math.min(t.SKIRM.max,a.s.range*t.SKIRM.keep),ax0=g.ax;a.shot=null;e.x=a.x+kp*.8;a.cd=0;g.step(.03);t.aiUnit(a,.03,null);ok(g.backing&&a.skirm&&g.ax<ax0&&!a.shot,'a melee foe inside their keeping distance ('+Math.round(kp)+'): the group backs away from him, together, not shooting on the way');
  let tb=0;while(g.backing&&tb<5){B.t+=.03;tb+=.03;g.step(.03)}ok(!g.backing&&Math.abs(tb-t.SKIRM.burst)<.1,'for a burst at most ('+tb.toFixed(1)+' s), though he is still near');
  a.skirm=false;a.cd=0;a.aimA=0;e.x=a.x+kp*.8;g.step(.03);t.aiUnit(a,.03,null);ok(!g.backing&&!!a.shot,'then it stands and looses a volley');
  B.t+=t.SKIRM.stand+.1;g.step(.03);ok(g.backing,'and backs off again if he is still that near');g.skirmish=false;g.step(.03);a.skirm=false;
  g.backing=false;g.standTill=0;a.skirm=false;g.setFlag('melee',true);e.x=a.x+8;a.cd=0;const h0=e.hp;t.aiUnit(a,.03,null);ok(e.hp<h0&&!a.shot&&a.inMelee,'Melee Mode on (off by default), reached: bow away, they fight him hand to hand');
  g.melee=false;e.x=a.x+8;a.cd=0;a.shot=null;a.aimA=0;g.skirmish=false;g.backing=false;a.skirm=false;g.setForm(g.form,{face:0});a.x=g.ax+a.sx;a.y=g.ay+a.sy;e.x=a.x+8;e.y=a.y;const h1=e.hp;t.aiUnit(a,.03,null);ok(e.hp===h1&&!!a.shot,'melee mode off: they keep shooting, point blank');
  t.selectGroup('arc');g.melee=true;t.toggleFlag('melee');ok(g.melee===false,'X: blades off');t.toggleFlag('melee');ok(g.melee===true,'X again: on');
  B.over=true;B.endT=0;t.B=null}
 // a mage's bolt goes all round: no turning first (spells keep their own shapes)
 {const B=fight(['militia']);B.obs=[];const a=t.grpUnits('arc')[0],e=B.units.find(u=>u.team===1);a.s={...a.s,magic:true,range:100};a.grp=null;a.aimA=0;a.cd=0;a.shot=null;
  e.s={...e.s,spd:0};e.cd=99;e.hp=e.max=9999;e.x=a.x-60;e.y=a.y;t.aiUnit(a,.03,null);ok(t.roundFire(a)&&!!a.shot,'a mage casts at a foe behind them at once, all round');B.over=true;B.endT=0;t.B=null}
 // mages: a group of their own (M), a step behind the infantry; theirs too, under their captain, who brings them in reach
 {G.mode='world';G.modal=false;t.hidePanel();P.troops={hum_spear:4,hum_bow:3,hum_mage:3};const L=['hum_foot','hum_foot','hum_foot','hum_bow','hum_bow','hum_mage','hum_mage'];
  G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:L};t.startBattle({enemies:L,tournament:false});const B=t.B;
  const mg=t.grpUnits('mag'),ar=t.grpUnits('arc'),inf=t.grpUnits('inf'),mx=g=>g.reduce((a,u)=>a+u.x,0)/g.length;
  ok(mg.length===3&&mg.every(u=>u.s.magic)&&ar.every(u=>!u.s.magic),'your mages are a group of their own, apart from the archers');
  ok(mx(ar)<mx(mg)&&mx(mg)<mx(inf),'they stand a step behind the infantry, the archers behind them');
  ok(!!document.querySelector('.ucard[data-grp="mag"]'),'with their own card');
  const s0=B.sel;window.dispatchEvent(new KeyboardEvent('keydown',{key:'m',code:'KeyM'}));ok(B.sel===s0,'no key picks them (no key stands for a group)');document.querySelector('.ucard[data-grp="mag"]').click();ok(B.sel==='mag','their card does');
  ok(t.grpUnits('e_mag').length===2&&t.grpUnits('e_arc').every(u=>!u.s.magic),'the enemy\u2019s mages are a group of their own too');
  B.post={};(0,eval)('window.__pz=posture;posture=(t,S)=>t===1?"attack":__pz(t,S)');let bolts=0;const seen=new Set();
  for(let j=0;j<2500&&!B.over;j++){t.updateBattle(.03);for(const a of B.arrows)if(a.magic&&a.team===1&&!seen.has(a)){seen.add(a);bolts++}if(bolts)break}
  (0,eval)('posture=__pz');ok(bolts>0,'attacking, their captain brings their mages in reach, and they cast');B.over=true;B.endT=0;t.B=null}
 // a shield wall when the moment calls for it: riders charging at them, they brace; the danger past, they drop it
 {P.troops={hum_squire:4};const L=['hum_foot','hum_foot','hum_foot','hum_foot','hum_foot','hum_foot'];G.mode='world';G.modal=false;t.hidePanel();
  G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:L};t.startBattle({enemies:L,tournament:false});const B=t.B,ei=B.groups.e_inf,m=t.grpUnits('e_inf');
  m.forEach(u=>{u.x=ei.ax+u.sx;u.y=ei.ay+u.sy});B.cmdT=0;t.command(.01);ok(ei.form!=='wall','nothing coming at them: no shield wall');
  const cv=t.grpUnits('cav');cv.forEach(u=>{u.x=ei.ax-100;u.y=ei.ay;u.run=t.CHARGE.run*.8});m.forEach(u=>{u.x=ei.ax+u.sx;u.y=ei.ay+u.sy});B.cmdT=0;t.command(.01);ok(ei.form==='wall','riders charging at them: they brace in a shield wall');
  cv.forEach(u=>{u.x=40;u.y=40;u.run=0});B.t+=t.CAPT.keep+.5;m.forEach(u=>{u.x=ei.ax+u.sx;u.y=ei.ay+u.sy});B.cmdT=0;t.command(.01);ok(ei.form!=='wall','the danger past, they drop it ('+ei.form+')');
  B.over=true;B.endT=0;t.B=null}
 // the ranged duel: their fighters shot at by archers who outshoot theirs, they stop standing there and go for those archers
 {P.troops={hum_bow:10,hum_spear:2};const L=['hum_foot','hum_foot','hum_foot','hum_foot','hum_foot','hum_foot'];G.mode='world';G.modal=false;t.hidePanel();
  G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:L};t.startBattle({enemies:L,tournament:false});const B=t.B,ei=B.groups.e_inf;B.post={};(0,eval)('window.__pz=posture;posture=(t,S)=>t===1?"defend":__pz(t,S)');
  B.cmdT=0;t.command(.01);ok(ei.order==='hold','defending, nobody shooting at them: they hold');
  t.grpUnits('e_inf').forEach(u=>u.shotAt=B.t);B.cmdT=0;t.command(.01);ok(ei.order==='charge'&&ei.tgt&&ei.tgt.s.range,'shot at by archers they cannot answer: they go for the archers, defending or not');
  (0,eval)('posture=__pz');B.over=true;B.endT=0;t.B=null}
 // a charge at a walk till near, then at a run (breath left for the impact)
 {const B=fight(['militia','militia']);B.post={};const ei=B.groups.e_inf,me=t.grpUnits('inf');ei.order='charge';ei.tgt=me[0];t.captainFinish(1,t.CAPTAIN[1]);
  const far=Math.hypot(me[0].x-t.grpUnits('e_inf')[0].x,me[0].y-t.grpUnits('e_inf')[0].y);ok(far>t.CAPT.runAt&&!ei.run,'far off, they charge at a walk ('+Math.round(far)+' px)');
  t.grpUnits('e_inf').forEach(u=>{u.x=me[0].x+100;u.y=me[0].y});t.captainFinish(1,t.CAPTAIN[1]);ok(ei.run,'near, at a run');B.over=true;B.endT=0;t.B=null}
 // one AI for every army: the enemy's captain, your allies', and yours on auto: each with its own plan, never another's
 {const B=fight(['militia']);B.plan={};B.post={};(0,eval)('window.__pz=posture;posture=()=>"attack"');B.auto=true;B.cmdT=0;t.command(.01);
  const k=Object.keys(B.plan);ok(t.CAPTAIN.ally&&t.CAPTAIN[0]&&t.CAPTAIN[1]&&k.every(x=>['0','1','ally'].includes(x)),'your army on auto, your allies and the enemy each plan under their own captain ('+k.join(', ')+')');
  (0,eval)('posture=__pz');B.auto=false;B.over=true;B.endT=0;t.B=null}
 // attacking before moving: archers on a move with a foe within half their range stop and shoot; told to cease fire, they walk on
 {const B=fight(['militia']);B.obs=[];const ar=t.grpUnits('arc'),a=ar[0],e=B.units.find(u=>u.team===1),g=B.groups.arc;B.units.filter(u=>u!==e&&u.team===1).forEach(u=>u.hp=0);
  e.s={...e.s,spd:0};e.cd=99;e.hp=e.max=9999;t.selectGroup('arc');t.rtsOrder(g.ax+300,g.ay);e.x=a.x+a.s.range*.4;e.y=a.y;a.aimA=0;a.cd=0;
  const ax1=g.ax;g.step(.03);ok(Math.abs(g.ax-ax1)<1,'your group does what you ordered: a foe near on the way, it walks on (stopping is your call)');
  e.x=a.x+a.s.range*.9;a.shot=null;t.rtsOrder(g.ax+300,g.ay);g.step(.03);ok(t.grpUnits('arc').some(u=>t.relocating(u,g)),'one further off: they walk on (the move first)');
  g.cease=true;e.x=a.x+a.s.range*.4;t.rtsOrder(g.ax+300,g.ay);g.step(.03);ok(t.grpUnits('arc').some(u=>t.relocating(u,g)),'told to cease fire, they walk on even then');g.cease=false;
  B.over=true;B.endT=0;t.B=null}
 // the captain: its shooters threatened, the march is off and they stand where they are
 {P.troops={hum_spear:4};const L=['hum_bow','hum_bow','hum_bow','hum_foot','hum_foot'];G.mode='world';G.modal=false;t.hidePanel();
  G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:L};t.startBattle({enemies:L,tournament:false});const B=t.B;B.post={};(0,eval)('window.__pz=posture;posture=(t,S)=>t===1?"attack":__pz(t,S)');
  B.cmdT=0;t.command(.01);const ea=B.groups.e_arc,ax0=ea.ax,ar=t.grpUnits('e_arc'),cx=ar.reduce((a,u)=>a+u.x,0)/ar.length;const ei=t.grpUnits('e_inf'),ix=ei.reduce((a,u)=>a+u.x,0)/ei.length;ok(B.plan&&B.plan[1]&&Math.abs(B.groups.e_inf.ax-ix)>40,'attacking: their army is sent up to its line (the archers behind their infantry)');
  const m=t.grpUnits('inf')[0];m.x=cx-40;m.y=ar[0].y;B.cmdT=0;t.command(.01);ok(!B.plan[1]&&Math.abs(ea.ax-cx)<2,'your soldier comes at them: the march is off, they stand where they are');
  (0,eval)('posture=__pz');B.over=true;B.endT=0;t.B=null}
 // shooting on the move: a skill some have (elves, rangers, horse archers); the rest stand to shoot
 {const B=fight(['militia']);B.obs=[];const a=t.grpUnits('arc')[0],e=B.units.find(u=>u.team===1);a.grp=null;a.aimA=0;e.s={...e.s,spd:0};e.cd=99;e.hp=e.max=9999;
  ok(!t.onTheMove(ST.hum_bow)&&t.onTheMove(ST.elf_archer)&&t.onTheMove(ST.hum_hbow)&&t.onTheMove(ST.ranger)&&!t.onTheMove(ST.hum_mage),'elves, rangers and mounted archers shoot on the move; bowmen and mages do not');
  ok(t.traitsOf(ST.elf_archer).includes('mobile')&&!t.traitsOf(ST.hum_bow).includes('mobile'),'it shows on their card as a trait');
  e.x=a.x+a.s.range*1.05;e.y=a.y;a.cd=0;a.inRng=false;a.shot={t:0,aim:1};t.aiUnit(a,.03,null);ok(a.spdNow>0&&!a.shot,'a bowman closing in lets his draw down: he must stand to shoot');
  a.s={...a.s,race:'elf'};a.shot={t:0,aim:1};a.inRng=false;e.x=a.x+a.s.range*1.05;t.aiUnit(a,.03,null);ok(a.spdNow>0&&!!a.shot,'an elf keeps drawing on the move');
  B.over=true;B.endT=0;t.B=null}
 // battle control: one place every group is commanded, by you and by the AI alike; its soldiers only carry it out
 {const B=fight(['militia']);ok(['inf','arc','e_inf'].every(g=>!B.groups[g]||B.groups[g] instanceof t.BattleControl),'your groups and theirs are each a BattleControl');
  const g=B.groups.inf;t.selectGroup('inf');t.rtsOrder(g.ax+80,g.ay);const p={x:g.ax,y:g.ay,mv:g.mvId};const h=new t.BattleControl('x',0);
  ok(typeof g.moveTo==='function'&&typeof g.attack==='function'&&typeof g.standAt==='function'&&typeof g.step==='function','its orders: move, attack, stand, charge, hold, withdraw, pace, form, flags; and its own moment (step)');
  const e=B.units.find(u=>u.team===1);g.attack(e);ok(g.order==='charge'&&g.tgt===e,'an attack: the same call your right-click makes and the AI makes');e.hp=0;g.step(.01);ok(!g.tgt,'its foe fallen, it lets him go (not its soldiers)');
  B.over=true;B.endT=0;t.B=null}
 // skirmishers back off facing the way they go (no moonwalk), and turn to their foe again when they stop to shoot
 {const B=fight(['militia']);B.obs=[];const ar=t.grpUnits('arc'),a=ar[0],e=B.units.find(u=>u.team===1),g=B.groups.arc;B.units.filter(u=>u.team===0&&!ar.includes(u)).forEach(u=>u.hp=0);
  e.s={...e.s,spd:0};e.cd=99;e.hp=e.max=9999;g.setFlag('skirmish',true);g.hold();ar.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy;u.aimA=0});e.x=a.x+60;e.y=a.y;
  let back=0,faced=0,aimed=0;for(let j=0;j<30;j++){t.updateBattle(.03);if(g.backing&&a.spdNow>0){back++;if(a.face===1)faced++;if(Math.abs(Math.atan2(Math.sin(t.arcAim(a)),Math.cos(t.arcAim(a))))>2)aimed++}}
  ok(back>3&&faced===0,'backing off, they turn and go, facing the way they go (no walking backwards) ('+(back-faced)+'/'+back+' frames)');ok(aimed>back/2,'their arc too points the way they go ('+aimed+'/'+back+')');
  B.over=true;B.endT=0;t.B=null}
 // a soldier by himself takes the nearest foe in his reach (in his arc first); whom to finish is his commander's call
 {const B=fight(['militia','militia','militia']);B.obs=[];const me=t.grpUnits('inf')[0],es=B.units.filter(u=>u.team===1);me.grp=null;es.forEach(e=>{e.s={...e.s,spd:0};e.cd=99});
  es[0].x=me.x+20;es[0].y=me.y;es[0].hp=es[0].max;es[1].x=me.x+30;es[1].y=me.y+6;es[1].hp=2;es[2].x=me.x+200;es[2].y=me.y;es[2].hp=1;
  ok(t.meleeTarget(me)===es[0],'by himself, the nearest (the clever choice is not his)');
  const a=t.grpUnits('arc')[0];a.grp=null;a.aimA=0;es.forEach((e,k)=>{e.x=a.x+120+k*40;e.y=a.y;e.hp=e.max});es[1].x=a.x-90;ok(t.shooterTarget(a)===es[0],'a shooter: the nearest in his reach, in his arc first');
  B.over=true;B.endT=0;t.B=null}
 // the commander sees whom its shooters can finish, and sets them on him
 {P.troops={hum_spear:4,hum_bow:3};const L=['hum_bow','hum_bow','hum_bow','hum_foot','hum_foot'];G.mode='world';G.modal=false;t.hidePanel();
  G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:L};t.startBattle({enemies:L,tournament:false});const B=t.B,ea=B.groups.e_arc,ar=t.grpUnits('e_arc');
  const mine=B.units.filter(u=>u.team===0);mine.forEach((u,k)=>{u.x=ar[0].x-ar[0].s.range*.6;u.y=ar[0].y+(k-3)*10;u.hp=u.max});const w=t.grpUnits('inf')[0];w.hp=1;B.hero.x=20;B.hero.y=20;
  B.cmdT=0;t.command(.01);ok(ea.order==='charge'&&ea.tgt===w,'one of yours a shot from falling: their commander sets their archers on him');
  const pl={...ST.hum_knight},nu={...ST.hum_foot};ok(t.blowsToFell({s:ST.hum_sword},{hp:20,s:pl})>t.blowsToFell({s:ST.hum_sword},{hp:20,s:nu}),'it reckons with armour: a man in plate takes more blows than one unarmoured');
  B.over=true;B.endT=0;t.B=null}
 // the AI sets its shooters on a foe worth it (focus fire), as your right-click does; drops it when danger comes
 {P.troops={hum_spear:4,hum_bow:3};const L=['hum_bow','hum_bow','hum_bow','hum_foot','hum_foot'];G.mode='world';G.modal=false;t.hidePanel();
  G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:L};t.startBattle({enemies:L,tournament:false});const B=t.B,ea=B.groups.e_arc,ar=t.grpUnits('e_arc');
  const mine=t.grpUnits('arc');mine.forEach((u,k)=>{u.x=ar[0].x-ar[0].s.range*.7;u.y=ar[0].y+k*8});t.grpUnits('inf').forEach(u=>{u.x=40;u.y=40});B.hero.x=20;B.hero.y=20;
  B.cmdT=0;t.command(.01);ok(ea.order==='charge'&&ea.tgt&&ea.tgt.s.range&&ea.tgt.team===0,'their archers are set on your archers in their reach: focus fire ['+[ea.order,ea.tgt&&ea.tgt.type,ea.melee,ea.skirmish,!!ea.hunt].join(',')+']');
  const m=t.grpUnits('inf')[0];m.x=ar[0].x-30;m.y=ar[0].y;B.cmdT=0;t.command(.01);ok(ea.order!=='charge','your soldier at them: the focus is dropped, they look to themselves');
  B.over=true;B.endT=0;t.B=null}
 // skirmishers know when to stop: cornered at the field's edge, or chased by a foe they cannot outrun, they stand and shoot
 {const B=fight(['militia']);B.obs=[];const ar=t.grpUnits('arc'),a=ar[0],e=B.units.find(u=>u.team===1),g=B.groups.arc;B.units.filter(u=>u.team===0&&!ar.includes(u)).forEach(u=>u.hp=0);
  e.s={...e.s,spd:0};e.cd=99;e.hp=e.max=9999;g.setFlag('skirmish',true);g.placeAt(30,g.ay);ar.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy});e.x=a.x+60;e.y=a.y;
  for(let j=0;j<10;j++)g.step(.03);ok(!g.backing&&g.cornered,'at the field\u2019s edge, with no room behind them, they stop backing off');
  a.cd=0;a.aimA=0;a.shot=null;t.aiUnit(a,.03,null);ok(!!a.shot,'and stand and shoot');
  e.x=t.BW-20;g.step(.03);ok(!g.cornered,'the danger gone, they may skirmish again');
  g.placeAt(400,g.ay);ar.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy});e.x=a.x+60;e.y=a.y;e.s={...e.s,spd:a.s.spd*2};g.backing=false;g.standTill=0;g.step(.03);ok(!g.backing,'a foe far faster than they are: no use running, they stand and shoot');
  B.over=true;B.endT=0;t.B=null}
 // a unit's Morale: its nerve; where a soldier's morale starts and how hard shocks hit him; your band's morale drifts toward it
 {const M=t.unitMoraleOf;ok(M(ST.hum_levy)===50&&M(ST.hum_spear)===60&&M(ST.hum_knight)>M(ST.hum_squire)&&M(ST.dw_clan)>M(ST.hum_levy),'levies 50, men-at-arms 60, knights steadier than squires, dwarves stubborn');
  ok(/Morale/.test(t.unitCard('hum_knight')),'the unit card shows it');
  P.morale=100;const B=fight(['militia']);const lv=B.units.find(u=>u.type==='hum_spear'),ar=B.units.find(u=>u.type==='hum_bow');ok(lv.mor0===Math.round(M(ST.hum_spear))&&ar.mor0===Math.round(M(ST.hum_bow)),'in battle, each starts from his own Morale (your band in full heart: ×1)');
  const a={s:ST.hum_levy,mor:50},k={s:ST.hum_knight,mor:50};t.shake(a,10);t.shake(k,10);ok(50-a.mor>50-k.mor,'the same shock shakes a levy more than a knight ('+(50-a.mor).toFixed(1)+' vs '+(50-k.mor).toFixed(1)+')');
  B.over=true;B.endT=0;t.B=null;
  P.troops={hum_knight:6};P.morale=40;const n=t.bandNerve(),m0=P.morale;t.dayTick();ok(n>60&&P.morale>m0,'a band of veterans lifts its own spirits day by day (nerve '+Math.round(n)+', '+m0+' → '+Math.round(P.morale)+')');
  P.troops={hum_levy:6};P.morale=90;const m1=P.morale;t.dayTick();ok(P.morale<m1,'a band of levies sags ('+m1+' → '+Math.round(P.morale)+')');}
 // an army with shooters never sits out of reach: defending, but nobody in reach a few seconds, it goes up
 {P.troops={hum_spear:6};const L=['hum_bow','hum_bow','hum_bow','hum_foot','hum_foot'];G.mode='world';G.modal=false;t.hidePanel();
  G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:L};t.startBattle({enemies:L,tournament:false});const B=t.B;B.post={};B.commit={};(0,eval)('window.__pz=posture;posture=(t,S)=>t===1?"defend":__pz(t,S)');
  B.cmdT=0;t.command(.01);ok(B.post[1]==='defend','at first they wait');
  for(let j=0;j<Math.ceil(t.FOE_CMD.patience/t.FOE_CMD.think)+2;j++){B.cmdT=0;t.command(.01)}ok(B.commit[1]&&B.post[1]==='attack'&&B.plan&&B.plan[1],'none of their shooters able to reach anyone for '+t.FOE_CMD.patience+' s: they go up to shoot');
  (0,eval)('posture=__pz');B.over=true;B.endT=0;t.B=null}
 // Auto skills (K): your characters use their skills on their own only while it is on; the AI's always do, on its commander's call
 {P.slots=['whirl',...Array(9).fill(null)];const B=fight(['militia','militia','militia']);ring(B,3,16);const X=t.heroState();X.sp=X.mp=999;B.hero.hp=B.hero.max;
  t.setAutoSkills(false);run(40);ok(!(X.cds.whirl>0),'Auto skills off: your hero uses none, hemmed in or not ['+[t.AUTOSK.on,B.auto,X.cds.whirl].join(',')+']');
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',code:'KeyK'}));ok(t.AUTOSK.on&&document.getElementById('bSkills').classList.contains('on'),'K: Auto skills on');run(40);ok(X.cds.whirl>0,'and he spins a Whirlwind');
  B.over=true;B.endT=0;t.B=null}
 // Kite, the commander's look: its archers skirmish only from a foe coming at them that none of its men cover
 {P.troops={hum_spear:4};const L=['hum_bow','hum_bow','hum_bow','hum_foot','hum_foot','hum_foot'];G.mode='world';G.modal=false;t.hidePanel();
  G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:L};t.startBattle({enemies:L,tournament:false});const B=t.B,ea=B.groups.e_arc,ar=t.grpUnits('e_arc'),ei=t.grpUnits('e_inf');
  const cx=ar.reduce((a,u)=>a+u.x,0)/ar.length,cy=ar.reduce((a,u)=>a+u.y,0)/ar.length,m=t.grpUnits('inf')[0];t.grpUnits('inf').slice(1).forEach(u=>{u.x=20;u.y=20});B.hero.x=20;B.hero.y=40;
  m.x=cx-90;m.y=cy;ei.forEach((u,k)=>{u.x=cx-55;u.y=cy+(k-1)*10});B.cmdT=0;t.command(.01);ok(!ea.skirmish,'your soldier near, but their infantry between: covered, they stand and shoot');
  ei.forEach(u=>{u.x=cx+200;u.y=cy-150});B.cmdT=0;t.command(.01);ok(ea.skirmish,'nobody between: uncovered, they skirmish');
  B.over=true;B.endT=0;t.B=null}
 // Hunt: out of anyone's reach and safe, the commander sends its shooters out to shoot; not with free riders about; home at a run when it is not safe
 {const war=(mine,list)=>{P.troops=mine;G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list};t.startBattle({enemies:list,tournament:false});return t.B};
  let B=war({hum_spear:8},['hum_bow','hum_bow','hum_bow','hum_foot','hum_foot','hum_foot']);B.cmdT=0;t.command(.01);const g=B.groups.e_arc;
  ok(g.hunt&&g.hunt.t.team===0,'nobody in their reach, your men far off: their archers are sent hunting ('+(g.hunt?g.hunt.t.type:'-')+')');
  ok(g.hunt&&t.huntSafe({x:g.hunt.x,y:g.hunt.y},B.units.filter(u=>u.team===0&&u.hp>0),()=>false,400),'to a spot where none of yours can reach them in time');
  ok(!g.run,'they go out at a walk');
  const hx=g.hunt.x,hy=g.hunt.y;t.grpUnits('e_arc').forEach(u=>{u.x=hx+150;u.y=hy});const e1=t.grpUnits('inf')[0];e1.x=hx-150;e1.y=hy;B.cmdT=0;t.command(.01);ok(!g.hunt&&!g.huntBack&&g.order==='hold'&&Math.abs(g.ax-(hx+150))<20,'one of yours comes into their reach on the way: the hunt ends where they stand, and they shoot');
  B.cmdT=0;t.command(.01);g.hunt={t:e1,x:hx,y:hy,tx:e1.x,ty:e1.y};t.grpUnits('inf').forEach(u=>{u.x=t.BW-30;u.y=40});B.hero.x=t.BW-30;B.hero.y=80;t.grpUnits('cav').forEach(u=>{u.x=hx+150;u.y=hy+60});B.cmdT=0;t.command(.01);ok(!g.hunt,'and it ends at once when it is no longer safe');
  B.over=true;B.endT=0;t.B=null;
  B=war({hum_spear:6,hum_squire:3},['hum_bow','hum_bow','hum_bow','hum_foot','hum_foot','hum_foot']);B.cmdT=0;t.command(.01);ok(!B.groups.e_arc.hunt,'your riders free on the field: no hunting (too dangerous)');B.over=true;B.endT=0;t.B=null}
 // a shooter's arc is where his group faces: he never turns it himself; turned by you or the commander, he shoots behind
 {const B=fight(['militia']);B.obs=[];const ar=t.grpUnits('arc'),a=ar[0],g=B.groups.arc,e=B.units.find(u=>u.team===1);e.s={...e.s,spd:0};e.cd=99;e.hp=e.max=9999;
  ar.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy;u.cd=0;u.shot=null});e.x=a.x-150;e.y=a.y;for(let j=0;j<40;j++)t.aiUnit(a,.03,null);ok(!a.shot&&Math.abs(t.arcAim(a)-g.face)<.01,'a foe behind them: they keep their group\u2019s front, no shot');
  g.setForm(g.form,{face:Math.PI});ar.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy});a.cd=0;t.aiUnit(a,.03,null);ok(!!a.shot&&a.face===-1,'their group turned to face him: they draw, their bodies the same way');
  B.over=true;B.endT=0;t.B=null}
 // no breath left, no running: a soldier at 0 stamina walks, whatever he is told
 {const B=fight(['militia']);B.obs=[];const g=B.groups.inf,u=t.grpUnits('inf')[0],e=B.units.find(x=>x.team===1);e.x=t.BW-20;e.s={...e.s,spd:0};e.cd=99;
  g.setWalk(false);g.moveTo(g.ax+300,g.ay,{run:true});u.sta=t.FATIGUE.max;t.aiUnit(u,.03,null);const run=u.spdNow;u.sta=0;t.aiUnit(u,.03,null);ok(run>0&&u.spdNow>0&&u.spdNow<run*.7,'ordered to run with no stamina left, he only walks ('+Math.round(u.spdNow)+' vs '+Math.round(run)+')');
  B.over=true;B.endT=0;t.B=null}
 // the commander weighs a threat to its shooters: a lone man is the shooters' own business; their bare shooters are its infantry's prey
 {P.troops={hum_spear:4,hum_bow:3};const L=['hum_bow','hum_bow','hum_bow','hum_foot','hum_foot','hum_foot','hum_foot'];G.mode='world';G.modal=false;t.hidePanel();
  G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:L};t.startBattle({enemies:L,tournament:false});const B=t.B,ei=B.groups.e_inf,ar=t.grpUnits('e_arc');B.post={};(0,eval)('window.__pz=posture;posture=(t,S)=>t===1?"attack":__pz(t,S)');
  const cx=ar.reduce((a,u)=>a+u.x,0)/ar.length,cy=ar.reduce((a,u)=>a+u.y,0)/ar.length;t.grpUnits('inf').forEach(u=>{u.x=40;u.y=40});const myA=t.grpUnits('arc');myA.forEach((u,k)=>{u.x=cx-330;u.y=cy+k*10});
  B.hero.x=cx+30;B.hero.y=cy;B.cmdT=0;t.command(.01);ok(!(ei.tgt===B.hero),'your hero alone near their archers: not worth their infantry (the archers see to him)');
  ok(ei.order==='charge'&&ei.tgt&&ei.tgt.s.range&&ei.tgt.team===0,'your archers bare, none of your fighters near them: their infantry goes for them');
  (0,eval)('posture=__pz');B.over=true;B.endT=0;t.B=null}
 // the band's morale after a battle: by how it went, not the outcome alone; a retreat costs, as in Total War
 {P.morale=60;(0,eval)('BATTLE_MOOD={share:.5,shaken:.5,broke:false}');const l1=t.battleMood(4,'victory');ok(P.morale<60&&/heavy losses/.test(l1)&&/shaken/.test(l1),'a costly win: half the band lost, the rest shaken: morale falls even so ('+l1.replace(/<[^>]+>/g,'')+')');
  P.morale=60;(0,eval)('BATTLE_MOOD={share:0,shaken:1,broke:true}');const l2=t.battleMood(4,'victory');ok(P.morale===67&&/broke/.test(l2),'a clean win, the enemy broken: up ('+l2.replace(/<[^>]+>/g,'')+')');
  P.morale=60;(0,eval)('BATTLE_MOOD=null');t.battleMood(-t.MOOD.retreat,'a retreat');ok(P.morale===60-t.MOOD.retreat,'a retreat: −'+t.MOOD.retreat+' morale (and −'+t.MOOD.renown+' renown, more if run down)');}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
