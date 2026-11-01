'use strict';
// The circle, a schiltron (battle/formations.js FORMS.circle, CIRCLE; the owner, 2026-11-01: "the circle size will determine whether
// to have unit stack by layers ... the maximum circle size is where your unit can fill a whole circle without gap otherwise you may
// have a gap in circle"): its rings for 20 men at a few sizes; every man facing out; no flank nor rear on a formed circle, Brace all
// round; slow, never running, a charge or a withdrawal breaking it; who may form it (O, the T cycle, the ring's button); a drag sets
// its size, its ghost a ring; the march tab sets it and a battle from the march keeps it; an AI captain rings its spears against
// riders on two sides, and breaks it once they are gone.
Kit.suite(({ok,info})=>{
 const t=T,L=t.BattleLab,C=t.CIRCLE,F=t.FORMS.circle,ai0=C.ai;
 const fixture=(kind='hum_pike',n=20)=>{if(L.active)L.exit();L.start({left:kind,leftCount:n,right:'hum_levy',rightCount:1,ai:false,paused:true,morale:true});const m=t.B.units.filter(u=>u.team===0),g=t.B.groups[m[0].grp];
  g.placeAt(400,300);g.face=0;t.layForm(g.id);m.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy;u.dir=0});t.B.sel=g.id;return{m,g,b:t.B}};
 const lay=(g,m)=>{t.layForm(g.id);m.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy})};
 const key=k=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code:'Key'+k.toUpperCase(),bubbles:true}));
 try{
  // ---- its rings: 20 men at a few sizes
  const rings=f=>t.circleRings(20,f,F).map(r=>r[1]);
  ok(rings(12).join()==='12,8','20 men, 12 files: an outer ring of 12 and an inner ring of 8');
  ok(rings(20).join()==='20','20 files: one full ring, no gap');
  {const S=t.formSlots('circle',20,0,30),R=S.map(([x,y])=>Math.hypot(x,y)),gap=2*Math.PI*R[0]/20;
   ok(rings(30).join()==='20'&&Math.max(...R)-Math.min(...R)<1e-6&&gap>F.gx*1.4,'30 files: one ring 30 places round, its 20 men spread evenly with gaps ('+gap.toFixed(1)+' px apart, a place '+F.gx+')')}
  {const r=rings(6);ok(r.reduce((a,b)=>a+b,0)===20&&r.length>=3&&r[0]>6,'6 files hold too few: as few more as hold them all, '+r.join(' + ')+', '+r.length+' rings deep')}
  {const S=t.formSlots('circle',20,0,12),R=S.map(([x,y])=>Math.hypot(x,y)),outer=Math.max(...R),inner=R.filter(r=>r<outer-1);
   ok(S.length===20&&Math.abs(outer-12*F.gx/(2*Math.PI))<1e-6&&inner.length===8&&inner.every(r=>Math.abs(outer-r-F.gy)<1e-6),'its outer ring files × spacing ÷ 2π round ('+outer.toFixed(1)+' px), the inner one a rank ('+F.gy+' px) further in');
   const d=Math.min(...S.flatMap((p,i)=>S.slice(i+1).map(q=>Math.hypot(p[0]-q[0],p[1]-q[1]))));ok(d>=F.gy*.99,'no two places on one another (the nearest '+d.toFixed(1)+' px apart)')}
  ok(t.circleRings(3,1,F)[0][0]>=C.minR&&t.circleRings(1,1,F).map(r=>r[1]).join()==='1','a few men: a ring no smaller than CIRCLE.minR ('+C.minR+' px)');
  // ---- every man facing out; no flank, no rear; Brace all round
  let {m,g,b}=fixture('hum_pike',20);g.setForm('circle',{files:12});lay(g,m);b.noMorale=true;
  ok(m.every(t.ringed),'formed: every man of the circle stands in it');
  ok(m.every(u=>t.angGap(t.facing(u),Math.atan2(u.sy,u.sx))<1e-6),'every man faces out from its middle');
  const around=u=>[0,1,2,3,4,5,6,7].map(i=>({x:u.x+Math.cos(i*Math.PI/4)*20,y:u.y+Math.sin(i*Math.PI/4)*20,s:{},grp:null}));
  ok(m.every(u=>around(u).every(s=>t.sideOf(u,s)==='front')),'a blow from any side lands on his front');
  ok(m.every(u=>around(u).every(s=>t.flankMul(u,s)===1)),'so no flank nor rear bonus on a circle');
  {const u=m[0],f=t.facing(u),rear={x:u.x-Math.cos(f)*20,y:u.y-Math.sin(f)*20,arrow:true};ok(t.sideOf(u,rear)==='rear','an arrow keeps its side (CIRCLE.arrows): one flying over the ring takes the far side in the back')}
  {const u=m.find(u=>Math.abs(t.angGap(Math.atan2(u.sy,u.sx),0))<.3)||m[0];u.x+=40;ok(!t.ringed(u)&&t.sideOf(u,{x:u.x-20,y:u.y,s:{},grp:null})!=='front','a man stepped well out of the ring is no longer covered');lay(g,m)}
  g.hold();ok(g.plant('brace',true),'Brace planted in the circle');g.posts.brace.at=b.t;
  ok(m.every(u=>around(u).every(s=>t.spearBraced(u,s))),'braced in a circle: braced all round, a charge from behind too');
  g.plant('brace',false);g.setForm('line');lay(g,m);
  {const u=m[0],rear={x:u.x-20,y:u.y,s:{},grp:null};ok(t.sideOf(u,rear)==='rear'&&t.flankMul(u,rear)>1,'the same men in a line: a blow from behind is a rear blow ('+t.flankMul(u,rear).toFixed(2)+'×)');
   g.hold();g.plant('brace',true);g.posts.brace.at=b.t;ok(!t.spearBraced(u,rear)&&t.spearBraced(u,{x:u.x+20,y:u.y}),'and braced only before and beside them');g.plant('brace',false)}
  // ---- slow; no running; a charge or a withdrawal breaks it
  g.setForm('circle',{files:12});lay(g,m);
  ok(m.every(u=>t.formPace(u)===C.spd),'its men walk at '+C.spd+' of a walk (CIRCLE.spd)');
  g.setWalk(false);g.setRun(true);ok(g.walk&&!g.run,'no running: Run and the pace stance leave it at a walk');
  g.moveTo(600,300,{run:true});ok(!g.run&&g.form==='circle','a move at a run (a double right-click) walks it there, still a circle');
  const went=form=>{const f=fixture('hum_pike',20);f.g.setForm(form,{files:12});lay(f.g,f.m);const x0=f.g.ax;f.g.moveTo(x0+300,300);L.step(120);return f.g.centre().x-x0};
  {const a=went('line'),c=went('circle');ok(c>2&&Math.abs(c/a-C.spd)<.15,'on the move, at a slow walk: '+c.toFixed(1)+' px in 2 s, a line '+a.toFixed(1));
   ({m,g,b}=fixture('hum_pike',20));g.setForm('circle',{files:12});lay(g,m);g.moveTo(g.ax+200,300);L.step(120);ok(m.filter(t.ringed).length>=m.length*.8,'and still a circle as it goes ('+m.filter(t.ringed).length+' of '+m.length+' in it)')}
  ({m,g,b}=fixture('hum_pike',20));g.setForm('circle');t.chargeOrder();ok(g.form==='line'&&g.order==='charge','Charge (G) breaks the circle into a line');
  ({m,g,b}=fixture('hum_pike',20));g.setForm('circle');g.attack(b.units.find(u=>u.team===1));ok(g.form==='line'&&g.order==='charge','an attack too');
  ({m,g,b}=fixture('hum_pike',20));g.setForm('circle');g.withdraw();ok(g.form==='line'&&g.order==='withdraw','and Withdraw');
  // ---- who: foot who fight hand to hand (spears best); not riders, not shooters on their own
  const fits=kind=>{const f=fixture(kind,8);return[t.formFits(f.g.id,'circle'),t.formFits(f.g.id,'cantabrian')].join()};
  ok(['hum_pike','hum_spear','hum_foot'].every(k=>fits(k)==='true,false'),'spears and swords and shields: a circle');
  ok(fits('hum_bow')==='false,false'&&fits('hum_knight')==='false,false','archers and charging riders: neither');
  ok(fits('hum_hbow')==='false,true','horse archers: the Cantabrian circle, not the foot\'s');
  ({m,g,b}=fixture('hum_bow',8));t.setForm('circle');ok(g.form==='line'&&/Only foot who fight hand to hand can form a circle/.test(document.getElementById('log').textContent),'archers told no: "Only foot who fight hand to hand can form a circle"');
  // ---- one key, one click: O, the T cycle, the ring's button
  ({m,g,b}=fixture('hum_pike',12));t.G.mode='battle';key('o');ok(g.form==='circle','O: the circle');key('o');ok(g.form==='line','O again: back to line');
  {const seen=[];for(let i=0;i<4;i++){key('t');seen.push(g.form)}ok(seen.join()==='loose,circle,column,line','T: the formation cycle, '+seen.join(' → '))}
  t.setOrderUI();{const bt=document.getElementById('bRing');ok(bt&&!bt.disabled&&!bt.classList.contains('on')&&bt.querySelector('svg.ficon')&&bt.textContent.includes(t.kitKey('ring')),'the ring\'s button: open to spearmen, its icon and key (O)');
   bt.click();ok(g.form==='circle'&&bt.classList.contains('on')&&bt.getAttribute('aria-pressed')==='true','a click forms the circle, the button lit');
   ok(document.querySelectorAll('[data-form]').length===2,'the formation buttons fingerprinted (data-form) as they were: two')}
  ({m,g,b}=fixture('hum_bow',8));t.setOrderUI();ok(document.getElementById('bRing').disabled,'archers selected: the ring\'s button dimmed');
  // ---- the drag sets its size; its ghost a ring
  ({m,g,b}=fixture('hum_pike',20));g.setForm('circle');
  {const p=t.formPlan(300,200,300,300)[0],R=Math.max(...t.formSlots('circle',20,p.face,p.files).map(([x,y])=>Math.hypot(x,y)));
   ok(p.files===Math.round(Math.PI*100/F.gx)&&Math.abs(2*R-100)<F.gx,'a line dragged 100 px: a circle that wide across ('+(2*R).toFixed(0)+' px), its outer ring '+p.files+' places');
   t.formDragTo(300,200,300,300);ok(g.form==='circle'&&g.files===p.files&&Math.abs(g.ax-300)<1&&Math.abs(g.ay-250)<1,'let go: there, its middle the line\'s');
   const small=t.formPlan(300,200,300,220)[0],wide=t.formPlan(300,0,300,400)[0];
   ok(t.circleRings(20,small.files,F).length>=2&&t.circleRings(20,wide.files,F).length===1&&wide.files===20*C.gaps,'short, its men stand in rings ('+t.circleRings(20,small.files,F).map(r=>r[1]).join(' + ')+'); long, one ring with gaps ('+wide.files+' places at most, CIRCLE.gaps)')}
  {const arc0=t.ctx.arc;let n=0;b.rdrag={x0:300,y0:200,x1:300,y1:300};t.ctx.arc=function(...a){n++;return arc0.apply(this,a)};try{t.drawFormGhost()}finally{t.ctx.arc=arc0;b.rdrag=null}ok(n>0,'its ghost as it is dragged: the ring drawn round its men')}
  // ---- an AI captain: a circle against riders about it from more than one side, a line once they are gone (CIRCLE.ai)
  {C.ai=true;if(L.active)L.exit();L.start({mode:'army',leftGroups:[{type:'hum_knight',count:4},{type:'hum_knight',count:4}],rightGroups:[{type:'hum_pike',count:16}],ai:false,paused:true,morale:true,deploy:false});
   const B=t.B,sp=Object.values(B.groups).find(g=>g.team===1),cav=Object.values(B.groups).filter(g=>g.team===0&&t.grpUnits(g.id).length),N=()=>t.captainGroups(1);
   const put=(gr,x,y)=>{gr.placeAt(x,y);t.layForm(gr.id);for(const u of B.units.filter(u=>u.grp===gr.id)){u.x=x+u.sx;u.y=y+u.sy;u.s={...u.s,spd:0};u.cd=99}};
   put(sp,500,300);sp.hold();put(cav[0],500,190);put(cav[1],500,410);t.captainFinish(1,N());
   ok(cav.length===2&&sp.form==='circle','riders north and south of its spears: the AI forms a circle');
   for(const u of t.grpUnits(cav[1].id))u.x+=40;t.captainFinish(1,N());ok(sp.form==='circle','the riders a little further off: it keeps it (CIRCLE.aiKeep)');
   for(const u of t.grpUnits(cav[1].id))u.x+=900;t.captainFinish(1,N());ok(sp.form==='line','riders on one side only: a line again, to face them');
   for(const u of t.grpUnits(cav[0].id))u.x+=900;t.captainFinish(1,N());ok(sp.form==='line','and none left about it: a line');
   C.ai=false;put(cav[0],500,190);put(cav[1],500,410);t.captainFinish(1,N());ok(sp.form==='line','CIRCLE.ai off: no circle');C.ai=ai0}
  // ---- the march tab sets it; a battle from the march keeps it
  {if(L.active)L.exit();const P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;P.troops={hum_pike:20,hum_hbow:6};G.mode='char';t.openMarch();
   const rs=t.partyRoster(P),sp=rs.groups.find(g=>g.type==='hum_pike'),hb=rs.groups.find(g=>g.type==='hum_hbow');t.act('march-select',sp.id);
   const btn=f=>document.querySelector('[data-act="march-form"][data-arg="'+f+'"]');ok(btn('circle')&&!btn('circle').disabled&&btn('cantabrian').disabled,'the march tab: Circle for the pikes (not the Cantabrian circle)');
   t.act('march-form','circle');ok(G.march.draft[sp.id].form==='circle','picked');
   const drag=(x0,x1)=>{const cv=document.getElementById('marchCanvas'),v=t.marchCanvasView(),r=cv.getBoundingClientRect(),cap=cv.setPointerCapture;cv.setPointerCapture=()=>{};
    const fire=(type,x)=>cv.dispatchEvent(new PointerEvent(type,{pointerId:7,pointerType:'mouse',button:2,buttons:2,clientX:r.left+(v.x+x*v.scale)*r.width/v.w,clientY:r.top+v.y*r.height/v.h,bubbles:true,cancelable:true}));
    try{fire('pointerdown',x0);fire('pointermove',x1);fire('pointerup',x1)}finally{cv.setPointerCapture=cap}};
   drag(-6,6);const files=G.march.draft[sp.id].files;ok(G.march.draft[sp.id].form==='circle'&&files===t.dragFiles('circle',20,12*t.WORLD_BATTLE.scale,t.WORLD_BATTLE.sprite),'a drawn formation sets its size: '+files+' places round');
   t.act('march-select',hb.id);ok(!btn('cantabrian').disabled&&btn('circle').disabled,'the horse archers: the Cantabrian circle');t.act('march-form','cantabrian');
   t.act('march-apply');const row=t.marchRows(P).find(r=>r.id===sp.id);ok(row.form==='circle'&&row.files===files&&rs.groups.find(g=>g.id===sp.id).form==='circle','Apply: the pikes march in a circle '+files+' places round');
   ok(t.marchFormOk(row,'circle')&&t.mapForm('cantabrian')==='loose'&&t.mapForm('circle')==='circle','the map takes it (marchstyles.js marchFormOk); a Cantabrian circle marches as a loose clump (mapForm)');
   const h=Kit.goHome('Ashford');Kit.goTo(h.x+160,h.y+120);const e=t.asParty({kind:'bandits',troops:['militia'],x:P.x+70,y:P.y,cool:0});G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});
   const B=t.B,g=Object.values(B.groups).find(g=>g.player&&g.sourceGroupId===sp.id),c=Object.values(B.groups).find(g=>g.player&&g.sourceGroupId===hb.id);
   const men=g?t.grpUnits(g.id):[],R=men.map(u=>Math.round(Math.hypot(u.sx,u.sy)/t.WORLD_BATTLE.sprite*10)/10),want=t.circleRings(men.length,files,F).map(r=>Math.round(r[0]*10)/10);
   ok(g&&g.form==='circle'&&g.files===files&&R.every(r=>want.includes(r)),'a battle from the march: its '+men.length+' pikes stand in their circle, '+files+' places round (rings '+[...new Set(R)].join(', ')+' px)');
   ok(c&&c.form==='cantabrian','and the horse archers in their Cantabrian circle')}
  ok(!ERR.length,'no runtime errors');
 }finally{C.ai=ai0;if(L.active)L.exit()}
});
