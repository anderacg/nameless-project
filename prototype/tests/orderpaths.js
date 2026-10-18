'use strict';
// Order paths (ui/orderpaths.js): a routed move drawn through its group's way round a mountain; cut as the group walks; queued
// legs, routed; an attack routed round the rock, and under fog to where the foe was last seen; the enemy's never drawn; the
// setting's three modes, stored; the path of the group whose icon or card you point at; a group just given an order, for a
// moment; nothing written to the groups, the soldiers, the sight or the route caches, no Math.random; still with reducedMotion.
// INFO: the cost of drawing 10 selected groups' paths on a field that blocks.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,L=t.BattleLab,ev=s=>(0,eval)(s),OP=t.OPATH,OS=t.OPS;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;ev('TERRAIN.on=true');
 const lab=(left,right,ground,extra={})=>{if(L.active)L.exit();G.mode='world';G.modal=false;L.start({leftGroups:left,rightGroups:right,deploy:false,ai:false,paused:true,morale:false,seed:5,ground,...extra});t.B.obs=[];t.B.cmdT=1e9;return t.B};
 const Gp=(type,count)=>({type,count}),W=()=>t.BW;
 const place=(g,x,y)=>{g.placeAt(x,y);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0)})};
 const step=n=>{const B=t.B;B.paused=false;for(let i=0;i<n;i++)t.updateBattle(1/60);B.paused=true};
 const mid=g=>{const m=g.units.filter(u=>!u.rout);return[m.reduce((a,u)=>a+u.x,0)/m.length,m.reduce((a,u)=>a+u.y,0)/m.length]};
 const near=(a,b,d=1)=>Math.hypot(a[0]-b[0],a[1]-b[1])<=d,clear=(gr,p)=>p.every((q,i)=>!i||t.lineClear(gr,p[i-1][0],p[i-1][1],q[0],q[1]));
 let clk=1e6;OP.now=()=>clk;
 // ======== a mountain in the middle of the field
 {const B=lab([Gp('hum_foot',12),Gp('hum_knight',6)],[Gp('hum_foot',6)],{rocks:[{x:.5,y:.45,r:60}]}),T=B.terrain,mt=T.recipe.rocks[0],gr=T.route.foot;
  const [gf,gk]=t.playerGroups().map(id=>B.groups[id]),foe=Object.values(B.groups).find(g=>g.foe);place(foe,W()-40,t.fieldBot()-30);foe.units.forEach(u=>{u.s={...u.s,spd:0}});
  place(gf,mt.x-mt.r-70,mt.y);place(gk,mt.x-mt.r-70,mt.y+mt.r+90);const goal=[mt.x+mt.r+70,mt.y];gf.moveTo(goal[0],goal[1]);step(2);
  const Wy=gf.way,P=t.orderPath(gf.id),c=mid(gf);
  ok(T.blocky&&Wy&&Wy.p.length>1&&!t.lineClear(gr,c[0],c[1],goal[0],goal[1]),'a move through the mountain: its group lays a way round it ('+(Wy?Wy.p.length:0)+' waypoints)');
  ok(P&&P.kind==='move'&&near(P.pts[0],c)&&P.pts.length===Wy.p.length+1&&Wy.p.every((q,i)=>i===Wy.p.length-1?near(P.pts[i+1],[gf.ax,gf.ay]):near(P.pts[i+1],q))&&near(P.end,[gf.ax,gf.ay]),'its path runs from the group\'s middle through every point of its way (g.way.p) to its place');
  ok(P&&clear(gr,P.pts)&&P.pts.some(q=>Math.abs(q[1]-mt.y)>mt.r*.8),'every leg of it clears the rock ('+(P?P.pts.map(q=>q.map(Math.round).join(',')).join(' → '):'')+')');
  // ---- trimmed as it walks: the men moved past the way's first point, toward its second
  {const p0=Wy.p[0],p1=Wy.p[1],to=[p0[0]+(p1[0]-p0[0])*.3,p0[1]+(p1[1]-p0[1])*.3],c0=mid(gf),keep=gf.units.map(u=>[u.x,u.y]);gf.units.forEach(u=>{u.x+=to[0]-c0[0];u.y+=to[1]-c0[1]});
   const Q=t.orderPath(gf.id);gf.units.forEach((u,i)=>{u.x=keep[i][0];u.y=keep[i][1]});
   ok(Q&&near(Q.pts[0],to)&&!Q.pts.some(q=>near(q,p0))&&Q.pts.length===P.pts.length-1&&near(Q.end,P.end),'cut as the group walks: from its middle on, the waypoint passed is gone ('+(Q?Q.pts.length:0)+' points, were '+P.pts.length+')')}
  // ---- queued legs: back west through the mountain, then north; each leg on its own way
  {const w1=[mt.x-mt.r-60,mt.y+10],w2=[mt.x-mt.r-60,mt.y-mt.r-40];gf.queueTo(w1[0],w1[1]);gf.queueTo(w2[0],w2[1]);const Q=t.orderPath(gf.id),q=Q&&Q.queue;
   ok(q&&q.length>2&&near(q[q.length-1],w2)&&q.some(p=>near(p,w1))&&clear(gr,[Q.end,...q]),'queued waypoints: each leg drawn after the move, the one through the rock routed round it ('+(q?q.length:0)+' points)');
   const Q2=t.orderPath(gf.id);ok(Q2&&JSON.stringify(Q2.queue)===JSON.stringify(q),'and kept, not laid again each frame (the same points)');gf.queue=[]}
  // ---- an attack round the rock: to the foe's middle, routed
  {place(foe,mt.x+mt.r+60,mt.y+5);t.sightStep(true);const sn=foe.units.filter(u=>t.seenBy(0,u)),fc=[sn.reduce((a,u)=>a+u.x,0)/sn.length,sn.reduce((a,u)=>a+u.y,0)/sn.length];gf.attack(foe);const A=t.orderPath(gf.id);
   ok(A&&A.kind==='attack'&&!A.lost&&near(A.end,fc)&&A.pts.length>2&&clear(gr,A.pts),'an attack on a foe behind the mountain: to the middle of those of him your side sees ('+sn.length+' of '+foe.units.length+': the rock hides the rest), routed round the rock ('+(A?A.pts.length:0)+' points)');
   gf.moveTo(goal[0],goal[1]);place(foe,W()-40,t.fieldBot()-30)}
  // ---- the enemy's paths: never
  {foe.moveTo(mt.x,t.fieldTop()+20);step(2);t.prefSet('opaths','all');B.iconHov=foe.id;OP.card=foe.id;t.drawOrderPaths();const drawn=OS.drawn.slice();B.iconHov=null;OP.card=null;
   ok(t.orderPath(foe.id)===null&&!drawn.includes(foe.id)&&drawn.includes(gf.id)&&t.orderPathAlpha(foe.id,[foe.id],clk)===0,'the enemy\'s path is never drawn: not shown always, nor pointed at, nor selected (drawn: '+drawn.join(', ')+')')}
  // ---- the setting: always, selected only (the default), off; stored
  {const key=()=>localStorage.getItem('ashmark.opaths');localStorage.removeItem('ashmark.opaths');const d=t.prefLoad('opaths');
   const got=['all','sel','off'].map(v=>{t.prefSet('opaths',v);return key()===v&&t.prefGet('opaths')===v&&t.prefLoad('opaths')===v});localStorage.setItem('ashmark.opaths','junk');
   ok(d==='sel'&&got.every(Boolean)&&t.prefLoad('opaths')==='sel','the setting: always, selected or off, each stored (ashmark.opaths) and read back; nothing or junk stored reads as selected');
   t.prefSet('opaths','off');ok(t.drawOrderPaths()===false,'off: no paths (render.js draws the straight lines instead)');
   t.prefSet('opaths','all');B.sel=[];t.drawOrderPaths();const d1=OS.drawn.slice();gk.moveTo(goal[0],goal[1]+mt.r+90);t.drawOrderPaths();
   ok(d1.join()===gf.id&&OS.drawn.includes(gf.id)&&OS.drawn.includes(gk.id),'always: every group of yours with somewhere to go, none selected (one standing in its place has none)')}
  // ---- selected only: the selected; the hovered (an icon, a card); a group just given an order, for a moment
  {t.prefSet('opaths','sel');step(2);clk+=1e4;const shown=()=>{t.drawOrderPaths();return OS.drawn.slice()};
   B.sel=[];const none=shown();B.sel=[gf.id];const one=shown();B.sel=[];
   ok(!none.length&&one.join()===gf.id,'selected only: none with nothing selected; the selected group\'s alone');
   B.iconHov=gk.id;const ic=shown();B.iconHov=null;
   const card=document.createElement('button');card.className='ucard';card.dataset.grp=gk.id;document.body.appendChild(card);card.dispatchEvent(new PointerEvent('pointerover',{bubbles:true}));const cd=shown(),cardOn=OP.card;
   card.dispatchEvent(new PointerEvent('pointerout',{bubbles:true,relatedTarget:null}));const off=shown();card.remove();
   ok(ic.join()===gk.id&&cardOn===gk.id&&cd.join()===gk.id&&!off.length,'pointing at a group\'s icon or its card shows its path, unselected; pointing away hides it');
   t.playerOrder([gk.id],()=>gk.moveTo(goal[0]-20,goal[1]+mt.r+90));const f0=shown();clk+=1250;const a1=t.orderPathAlpha(gk.id,[],clk),f1=shown();clk+=400;const f2=shown();
   ok(f0.join()===gk.id&&f1.join()===gk.id&&a1>0&&a1<1&&!f2.length,'a group just given an order shows its path for a moment, fading (alpha '+a1.toFixed(2)+' at 1.25 s), then not (1.65 s)')}
  // ---- nothing written: the groups, the soldiers, the sight, the route caches; no Math.random
  {const snap=()=>{const out=[];for(const id in B.groups){const g=B.groups[id];for(const k of Object.keys(g)){const v=g[k];out.push(id+'.'+k+'='+(v&&typeof v==='object'?k==='way'?v.id+':'+v.p.length:k==='queue'?JSON.stringify(v):'o':String(v)))}out.push(id+'.orderSeq='+g.orderSeq)}
     for(const u of B.units)for(const k of Object.keys(u)){const v=u[k];if(v===null||typeof v!=='object'&&typeof v!=='function')out.push(u.id+'.'+k+'='+v);else if(Array.isArray(v)&&v.every(x=>x==null||typeof x!=='object'))out.push(u.id+'.'+k+'=['+v.join()+']')}
     out.push('memo '+['foot','mounted','big'].map(k=>T.route[k].memo.size+'/'+T.route[k].v).join());out.push('n '+t.ROUTE_UNIT.n+' t '+B.t+' sel '+JSON.stringify(B.sel));return out.join('|')};
   gf.queueTo(mt.x-mt.r-60,mt.y-20);gk.attack(foe);B.sel='all';t.prefSet('opaths','all');B.iconHov=gf.id;
   const s0=snap(),rnd=Math.random;let draws=0;Math.random=function(){draws++;return rnd.apply(this,arguments)};
   try{for(let i=0;i<30;i++){clk+=16;t.drawOrderPaths();t.orderPath(gf.id);t.orderPath(gk.id)}}finally{Math.random=rnd}
   ok(snap()===s0&&!draws,'drawing writes nothing: the groups, their ways and queues, the soldiers, the route caches and the clock are as they were; no Math.random ('+draws+' draws)');B.iconHov=null;gf.queue=[];gf.moveTo(goal[0],goal[1])}
  // ---- reducedMotion: the dashes and chevrons stand still
  {const mm=window.matchMedia;const ph=()=>{t.drawOrderPaths();return OS.ph};const a=ph();clk+=250;const b=ph();
   window.matchMedia=q=>({matches:/reduce/.test(q),addEventListener(){},removeEventListener(){}});let r1,r2;try{r1=ph();clk+=250;r2=ph()}finally{window.matchMedia=mm}
   ok(a!==b&&r1===0&&r2===0&&t.orderPathPhase(5000,true)===0,'the dashes march ('+a.toFixed(1)+' → '+b.toFixed(1)+' px); with reducedMotion they stand still (0)')}
  L.exit()}
 // ======== under fog: an attack on a foe gone from sight goes to where he was last seen
 {const B=lab([Gp('hum_foot',8)],[Gp('hum_foot',6)],'none',{fog:true}),[g]=t.playerGroups().map(id=>B.groups[id]),foe=Object.values(B.groups).find(q=>q.foe),Y=(t.fieldTop()+t.fieldBot())/2;
  place(g,W()*.3,Y);place(foe,W()*.3+150,Y);t.sightStep(true);const seen=mid(foe);g.attack(foe);const A=t.orderPath(g.id);
  ok(B.fog&&foe.units.every(u=>t.seenBy(0,u))&&A&&A.kind==='attack'&&!A.lost&&near(A.end,seen),'in sight: the attack path goes to the foe');
  place(foe,W()*.3+700,Y-60);t.sightStep(true);const now=mid(foe),S=B.sight,n0=S.goal.size,B2=t.orderPath(g.id);t.prefSet('opaths','sel');B.sel=[g.id];t.drawOrderPaths();
  ok(foe.units.every(u=>!t.seenBy(0,u))&&B2&&B2.kind==='attack'&&B2.lost&&near(B2.end,seen,2)&&!near(B2.end,now,100)&&S.goal.size===n0,'gone from sight: to where he was last seen ('+B2.end.map(Math.round).join(',')+'), not where he is; the sight\'s cache untouched');
  ok(t.sightGoal(g,0)&&near([t.sightGoal(g,0).x,t.sightGoal(g,0).y],B2.end,.01),'the same point sightGoal gives');
  L.exit()}
 // ======== the cost: 10 selected groups' paths on a field that blocks (half with a queued waypoint)
 {const B=lab(Array.from({length:10},()=>Gp('hum_foot',10)),[Gp('hum_foot',6)],{rocks:[{x:.5,y:.45,r:60}]}),T=B.terrain,mt=T.recipe.rocks[0],mine=t.playerGroups().map(id=>B.groups[id]);
  const foe=Object.values(B.groups).find(g=>g.foe);place(foe,W()-40,t.fieldBot()-30);const ft=t.fieldTop()+30,fb=t.fieldBot()-30;
  mine.forEach((g,i)=>{const y=ft+(fb-ft)*i/9;place(g,mt.x-mt.r-90,y);g.moveTo(mt.x+mt.r+90,mt.y+(i-4.5)*12);if(i%2)g.queueTo(mt.x-mt.r-90,y)});step(3);B.sel='all';t.prefSet('opaths','sel');
  const routed=mine.filter(g=>g.way&&g.way.p.length>1).length;for(let i=0;i<5;i++){clk+=16;t.drawOrderPaths()}
  // (each frame on a cleared canvas, its drawing flushed every 10 (a pixel read back) as the game's frames are; less the same
  // without the paths. JS alone: the canvas's calls made no-ops)
  const c=t.ctx,cv=t.cv,N=300,frames=draw=>{const t0=performance.now();for(let i=0;i<N;i++){clk+=16;c.fillStyle='#07090e';c.fillRect(0,0,cv.width,cv.height);if(draw)t.drawOrderPaths();if(i%10===9)c.getImageData(0,0,1,1)}return(performance.now()-t0)/N};
  frames(true);const base=(frames(false)+frames(false))/2,ms=(frames(true)+frames(true))/2-base,keep={};for(const k of ['stroke','fillRect','ellipse','lineTo','moveTo','beginPath','setLineDash']){keep[k]=c[k];c[k]=()=>{}}
  const t1=performance.now();for(let i=0;i<N;i++){clk+=16;t.drawOrderPaths()}const js=(performance.now()-t1)/N;Object.assign(c,keep);
  ok(OS.drawn.length===10&&routed>=6,'10 selected groups drawn ('+routed+' moves routed round the mountain)');
  info('drawing 10 selected groups\' order paths (a blocky field, '+routed+' routed, 5 with a queued leg; canvas '+cv.width+'×'+cv.height+'): '+ms.toFixed(3)+' ms a frame with the canvas\'s work (headless: software), '+js.toFixed(3)+' ms of it JS (means of '+N+')');
  ok(js<.15&&ms<.6,'cheap: '+js.toFixed(3)+' ms of JS, '+ms.toFixed(3)+' ms in all');
  L.exit()}
 t.prefSet('opaths','sel');
 // ======== the Settings window: three buttons, each sets and shows its mode
 {t.showTitle('settings');const bad=[];for(const v of ['all','off','sel']){t.act('opaths',v);const b=document.querySelector('#panel [data-act="opaths"][data-arg="'+v+'"]');if(!(t.prefGet('opaths')===v&&b&&b.classList.contains('on')&&G.menu==='settings'))bad.push(v)}
  ok(!bad.length&&/Order paths/.test(document.getElementById('panel').innerHTML)&&document.querySelector('#panel .nav, #panel [data-act="menu"]'),'Settings: Order paths, Always / Selected / Off, each sets, stores and shows its mode; the window keeps its Back'+(bad.length?': wrong for '+bad.join(', '):''))}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
