'use strict';
// A whole army is clickable on the map (the owner, 2026-11-01: "can you make a whole army clickable in the world map? right now
// it's hard for me to press at center"; "i mean when I click at the lords, or other army, band"): marched man by man, an army
// answers anywhere on its men's figures as drawn and inside its outline (world.js pickAt army, march.js MarchArmy hit;
// no banner over it since 2026-11-01: tests/bannercard.js). Ranked: a figure over an outline, then the nearer army's man; a building or place under the pointer as ever;
// inside your own outline, your man nearer, it is ground (a click travels). Hover picks what a click does; a finger's tap gets
// MARCH_PICK.tap CSS px of slack; with the world's battles off, the old circle
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TILE=t.TILE;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+240,home.y+200);const tx=Math.floor(P.x/TILE),ty=Math.floor(P.y/TILE);
 for(let y=ty-25;y<=ty+25;y++)for(let x=tx-25;x<=tx+30;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;t.WM.kind[i]=t.T_OPEN;t.WM.edge[i]=0;t.WM.elev[i]=64}
 W.sites=W.sites.filter(s=>Math.hypot(s.x-P.x,s.y-P.y)>400);t.reveal();
 // (you see some 110 px about you: the armies within it)
 const x0=P.x,y0=P.y,cv=document.querySelector('canvas'),mouse=type=>Object.assign(G.mouse,{type,in:true});
 // (an army formed where it stands, its outline made afresh; moved: its men, middle and outline with it)
 const form=(o,n=300)=>{t.MARCH_ARMIES.delete(o);const a=t.MarchArmy.of(o);for(let i=0;i<n;i++)a.step(1/30);a.ring=new t.MarchOutline();a.ring.update(a);return a};
 const move=(o,dx,dy)=>{const a=t.MARCH_ARMIES.get(o);o.x+=dx;o.y+=dy;for(const k of ['x','wx','gx'])a[k]+=dx;for(const k of ['y','wy','gy'])a[k]+=dy;a.units.forEach(u=>{u.x+=dx;u.y+=dy});a.ring=new t.MarchOutline();a.ring.update(a)};
 const hit=(a,x,y,tol=0)=>{const h=a.hit(x,y,tol);return h?{kind:h.kind,d:h.d}:null};
 // (a man's figure as drawn, world px; its middle)
 const rect=(a,u)=>{const F=a.figure(u),fl=Math.cos(u.dir??a.face)<0;return[u.x+(fl?-F[2]:F[0]),u.y+F[1],u.x+(fl?-F[0]:F[2]),u.y+F[3]]},mid=r=>[(r[0]+r[2])/2,(r[1]+r[3])/2];
 // (its small ring round its middle, as before (10 px, 4 up): ranked as ever, over any building or man)
 const ring=(o,x,y)=>Math.hypot(o.x-x,o.y-4-y)<10;
 const scan=(b,pred,step=1)=>{const out=[];for(let y=Math.floor(b[1]);y<=b[3];y+=step)for(let x=Math.floor(b[0]);x<=b[2];x+=step)if(pred(x,y))out.push([x,y]);return out};
 const around=(a,m=30)=>{const b=a.figBox(),c=a.box();return[Math.min(b[0],c[0])-m,Math.min(b[1],c[1])-m,Math.max(b[2],c[2])+m,Math.max(b[3],c[3])+m]};
 // a real click on the canvas at a world point (pressed and let go: ring.js), or a finger's tap
 const press=(wx,wy,type='mouse')=>{t.drawWorld();const r=cv.getBoundingClientRect(),x=r.left+(wx-G.cam.x)*r.width/t.VW,y=r.top+(wy-G.cam.y)*r.height/t.VH,e={clientX:x,clientY:y,pointerType:type,pointerId:type==='touch'?7:1,isPrimary:true,bubbles:true};
  cv.dispatchEvent(new PointerEvent('pointerdown',e));window.dispatchEvent(new PointerEvent('pointerup',e));return{x,y}};
 const ringOn=()=>{const q=t.PARTY_CLICK.last,o=t.ActionRing.now&&q&&t.ActionRing.now===q.R?q.o:null;t.ActionRing.close();t.PARTY_CLICK.last=null;return o};
 P.troops={hum_foot:6};P.comps={};form(P);
 // ---- a big lord's army: a click on a man on its flank, far from its middle, picks him
 const lord=W.lords[0];lord.inside=null;lord.fight=null;lord.troops=Array(40).fill('hum_foot');lord.x=x0-70;lord.y=y0;mouse('mouse');
 let A=form(lord);t.drawWorld();
 {const far=A.units.filter(u=>!u.dead).map(u=>({u,d:Math.hypot(u.x-lord.x,u.y-lord.y)})).sort((p,q)=>q.d-p.d)[0],[fx,fy]=mid(rect(A,far.u));
  const old=Math.hypot(fx-lord.x,fy-4-lord.y)<10;
  ok(far.d>20&&!old&&t.pickAt(fx,fy)===lord,'a man on the flank of a lord\'s army of '+lord.troops.length+', '+far.d.toFixed(0)+' px off its middle (past the old circle\'s 10): picked ('+(t.pickAt(fx,fy)?.mapKind)+')');
  press(fx,fy);{const R=t.ActionRing.now,r=t.cv.getBoundingClientRect(),ex=r.left+(fx-G.cam.x)*r.width/t.VW,ey=r.top+(fy-G.cam.y)*r.height/t.VH;
   ok(!!R&&Math.hypot(R.cx-ex,R.cy-ey)<2,'(the owner, 2026-11-01) and it opens where you clicked his flank man, not at his army middle ('+(R?Math.round(Math.hypot(R.cx-ex,R.cy-ey)):'none')+' px off)')}
  ok(ringOn()===lord,'clicked: the lord\'s ring opens (Approach, Follow, Look)')}
 // ---- in the outline's gap between his men; just outside it
 {const gaps=scan(around(A),(x,y)=>{const h=hit(A,x,y);return h&&h.kind==='outline'},2);
  const bad=gaps.filter(([x,y])=>t.pickAt(x,y)!==lord);
  ok(gaps.length>20&&!bad.length,'inside his outline, between his men (on none of them): picked, at '+gaps.length+' points ('+bad.length+' not)');
  const out=scan(around(A,12),(x,y)=>!hit(A,x,y),2),wrong=out.filter(([x,y])=>t.pickAt(x,y)===lord);
  const edge=out.filter(([x,y])=>hit(A,x,y,6));
  ok(out.length&&edge.length&&!wrong.length,'just outside his outline and his men (at '+edge.length+' points within 6 px of them): not picked ('+wrong.length+' were)')}
 // ---- hover: the same army a click picks, its tooltip his; the brackets round all his men
 {const [fx,fy]=mid(rect(A,A.units[A.units.length-1]));Object.assign(G.mouse,{x:fx-G.cam.x,y:fy-G.cam.y,in:true,type:'mouse'});G.modal=false;
  t.WUI.hp.t=-1e9;t.wuiHover(performance.now(),1);const fb=A.figBox(),h=t.WUI.hov;
  ok(t.WUI.hp.o===lord&&h&&h.b[0]<=fb[0]+1&&h.b[2]>=fb[2]-1&&h.b[1]<=fb[1]+1&&h.b[3]>=fb[3]-1,'hover on his man: the lord, the brackets round all his men ('+(h?h.b.map(v=>v.toFixed(0)).join(','):'none')+'; his men '+Array.from(fb).map(v=>v.toFixed(0)).join(',')+')');
  t.drawWorld();const r=cv.getBoundingClientRect(),cx=r.left+(fx-G.cam.x)*r.width/t.VW,cy=r.top+(fy-G.cam.y)*r.height/t.VH;cv.dispatchEvent(new PointerEvent('pointermove',{clientX:cx,clientY:cy,pointerType:'mouse',bubbles:true}));
  const tip=document.getElementById('tip');ok(!tip.hidden&&tip.innerHTML===t.tipFor(lord),'and the tooltip is his');tip.hidden=true;
  const pts=scan(around(A,8),()=>true,3);let diff=0;for(const [x,y] of pts){Object.assign(G.mouse,{x:x-G.cam.x,y:y-G.cam.y});t.wuiHover(performance.now(),1);if((t.WUI.hp.o||null)!==(t.pickAt(x,y)||null))diff++}
  ok(!diff,'hover picks what a click picks, at '+pts.length+' points round his army ('+diff+' apart)')}
 // ---- two armies touching: a figure over an outline, then the nearer man
 const band=t.asParty({kind:'bandits',troops:Array(10).fill('militia'),x:lord.x+120,y:lord.y,t:0,a:0,idle:true,cool:9,n:10});t.bandits.push(band);let Bd=form(band);
 {const la=A.box(),bb=Bd.box();move(band,la[2]-bb[0]-6,0);A.ring=new t.MarchOutline();A.ring.update(A);
  const R=[Math.min(...[A,Bd].map(a=>around(a)[0])),Math.min(...[A,Bd].map(a=>around(a)[1])),Math.max(...[A,Bd].map(a=>around(a)[2])),Math.max(...[A,Bd].map(a=>around(a)[3]))];
  const pts=scan(R,(x,y)=>!ring(lord,x,y)&&!ring(band,x,y)).map(([x,y])=>({x,y,a:hit(A,x,y),b:hit(Bd,x,y),p:t.pickAt(x,y)}));
  const fo=pts.filter(q=>q.a&&q.b&&(q.a.kind==='figure')!==(q.b.kind==='figure')),fw=fo.filter(q=>q.p!==(q.a.kind==='figure'?lord:band));
  ok(fo.length&&!fw.length,'two armies touching: on one\'s man, inside the other\'s outline: the man\'s army, at '+fo.length+' points ('+fw.length+' not)');
  const oo=pts.filter(q=>q.a&&q.b&&q.a.kind==='outline'&&q.b.kind==='outline'&&Math.abs(q.a.d-q.b.d)>.01),ow=oo.filter(q=>q.p!==(q.a.d<q.b.d?lord:band));
  ok(oo.length&&!ow.length,'inside both outlines, on no man: the army whose man is nearer, at '+oo.length+' points ('+ow.length+' not)');
  const ff=pts.filter(q=>q.a&&q.b&&q.a.kind==='figure'&&q.b.kind==='figure'),fn=ff.filter(q=>q.p!==(q.a.d<=q.b.d?lord:band));
  ok(!fn.length,'on two men at once: the one nearer his figure\'s middle ('+ff.length+' points, '+fn.length+' not)');
  t.bandits.length=0}
 // ---- your own army: inside your outline, on ground, a click travels; held, the map's ring (Travel here); a lord's outline over
 // yours, your man nearer: ground
 {const Y=t.MARCH_ARMIES.get(P);Y.ring=new t.MarchOutline();Y.ring.update(Y);
  // (a building or place under the pointer is picked as ever: since the free folk's hamlets, an estate of Wardenhall's lies here)
  const place=o=>!!o&&['estate','house','holding','site'].includes(o.mapKind);
  const own=scan(around(Y),(x,y)=>{const h=hit(Y,x,y);return h&&h.kind==='outline'&&!place(t.pickAt(x,y))},2);const picked=own.filter(([x,y])=>t.pickAt(x,y));
  ok(own.length&&!picked.length,'inside your own outline: nothing picked (ground) at '+own.length+' points ('+picked.length+' were)');
  const [gx,gy]=own[own.length>>1];P.tx=null;G.chase=null;press(gx,gy);
  ok(!ringOn()&&P.tx!=null&&Math.abs(P.tx-gx)<1.5&&Math.abs(P.ty-gy)<1.5,'clicked there: you travel there ('+(P.tx??-1).toFixed(0)+','+(P.ty??-1).toFixed(0)+' for '+gx+','+gy+')');P.tx=null;
  t.drawWorld();const r=cv.getBoundingClientRect(),cx=r.left+(gx-G.cam.x)*r.width/t.VW,cy=r.top+(gy-G.cam.y)*r.height/t.VH,open=t.ringOpen(cx,cy,gx,gy),items=t.ActionRing.now?t.ActionRing.now.items.map(i=>i.label):[];t.ActionRing.close();
  ok(open&&items.includes('Travel here'),'held there: the map\'s ring, as today ('+items.join(', ')+')');
  const ya=Y.box(),la=A.box();move(lord,ya[2]-la[0]-16,(ya[1]+ya[3]-la[1]-la[3])/2);const pts=scan([ya[0]-10,ya[1]-30,ya[2]+30,ya[3]+10],(x,y)=>!ring(lord,x,y)).map(([x,y])=>({x,y,a:hit(A,x,y),m:hit(Y,x,y),p:t.pickAt(x,y)}));
  const mineN=pts.filter(q=>q.a&&q.a.kind==='outline'&&q.m&&(q.m.kind==='figure'||q.m.d<q.a.d)),mw=mineN.filter(q=>q.p===lord);
  const his=pts.filter(q=>q.a&&q.a.kind==='outline'&&q.m&&q.m.kind==='outline'&&q.a.d<q.m.d&&!place(q.p)),hw=his.filter(q=>q.p!==lord);
  ok(mineN.length&&!mw.length&&his.length&&!hw.length,'a lord\'s outline over yours (off his small ring): your man nearer, ground ('+mineN.length+' points, '+mw.length+' the lord); his nearer, the lord ('+his.length+', '+hw.length+' not)');
  move(lord,x0-70-lord.x,y0-lord.y)}
 // ---- a phone's tap: a little slack round his men and his outline
 {const tol=t.MARCH_PICK.tap*t.VW/(cv.clientWidth||t.VW),near=scan(around(A,12),(x,y)=>!hit(A,x,y)&&hit(A,x,y,tol),2);
  mouse('touch');const tap=near.filter(([x,y])=>t.pickAt(x,y)===lord);mouse('mouse');const click=near.filter(([x,y])=>t.pickAt(x,y)===lord);
  ok(near.length&&tap.length===near.length&&!click.length,'just off his men and outline ('+near.length+' points, within '+tol.toFixed(1)+' px): a tap picks him ('+tap.length+'), a click does not ('+click.length+')');
  const [qx,qy]=near[near.length>>1];press(qx,qy,'touch');ok(ringOn()===lord,'tapped with a finger there: his ring opens');mouse('mouse')}
 // ---- a caravan: its ox, its cart, a guard on its flank
 {const tw=t.TOWNS.find(x=>x.owner&&x.owner!=='player'),to=t.TOWNS.find(x=>x!==tw);const c=t.asParty({cv:true,fac:tw.owner,from:tw.name,to:to.name,x:x0-20,y:y0+80,goods:{grain:5},guards:8,cool:0,dir:1});W.caravans=[c];
  const C=form(c);const ox=[c.x+4*(c.dir<0?-1:1),c.y-2],g=C.units.map(u=>({u,d:Math.hypot(u.x-c.x,u.y-c.y)})).sort((p,q)=>q.d-p.d)[0],[gx,gy]=mid(rect(C,g.u));
  ok(t.pickAt(...ox)===c,'a caravan\'s ox: the caravan');ok(t.pickAt(c.x-9*(c.dir<0?-1:1),c.y-2)===c,'its cart: the caravan');
  ok(g.d>12&&t.pickAt(gx,gy)===c,'a guard on its flank, '+g.d.toFixed(0)+' px off its middle: the caravan');
  press(gx,gy);ok(ringOn()===c,'clicked: its ring opens');W.caravans=[]}
 // ---- a beast pack
 {const m={id:'wolf',x:x0+70,y:y0+60,hx:x0+70,hy:y0+60,lv:1,n:6,t:0,a:0,cool:5};W.monsters=[m];const mo=t.asMonster(m),M=form(mo);
  const w=M.units.map(u=>({u,d:Math.hypot(u.x-mo.x,u.y-mo.y)})).sort((p,q)=>q.d-p.d)[0],[wx,wy]=mid(rect(M,w.u)),gap=scan(around(M),(x,y)=>{const h=hit(M,x,y);return h&&h.kind==='outline'},2);
  ok(w.d>8&&t.pickAt(wx,wy)===mo,'a wolf of the pack, '+w.d.toFixed(0)+' px off its middle: the pack');
  ok(gap.length&&gap.every(([x,y])=>t.pickAt(x,y)===mo),'inside the pack\'s outline: the pack ('+gap.length+' points)');W.monsters=[]}
 // ---- with the world's battles off: the old circle round the middle, as before
 {const far=A.units.map(u=>({u,d:Math.hypot(u.x-lord.x,u.y-lord.y)})).sort((p,q)=>q.d-p.d)[0],[fx,fy]=mid(rect(A,far.u));t.WORLD_BATTLE.on=false;
  try{ok(t.pickAt(lord.x,lord.y-4)===lord&&t.pickAt(fx,fy)!==lord&&t.marchPicked(lord)===null,'the world\'s battles off: picked at his middle\'s circle, not at the far man\'s place')}finally{t.WORLD_BATTLE.on=true}
  t.MARCH_RING.on=false;try{ok(t.pickAt(lord.x,lord.y-4)===lord&&t.pickAt(fx,fy)===lord,'the outline off (its circles): his circle and his men')}finally{t.MARCH_RING.on=true}}
 // ---- an army on a holding's lot: the building's picture over his outline, as ever
 {const h=t.townBy('Ashford');Kit.goTo(h.x,h.y+24);const c=l=>[(l.x+l.n/2)*TILE,(l.y+l.n/2)*TILE];
  const l=(h.lots||[]).filter(l=>l.st!=='ruined'&&l.k!=='field'&&l.k!=='pasture'&&Math.hypot(c(l)[0]-P.x,c(l)[1]-P.y)<80).sort((p,q)=>q.n-p.n)[0];
  if(!l)info('no lot of Ashford in sight');else{move(lord,c(l)[0]-lord.x,c(l)[1]-lord.y);const lb=[l.x*TILE,l.y*TILE,(l.x+l.n)*TILE-1,(l.y+l.n)*TILE-1];
   const pts=scan(lb,(x,y)=>{const q=hit(A,x,y);return q&&q.kind==='outline'&&!ring(lord,x,y)},2),won=pts.filter(([x,y])=>{const o=t.pickAt(x,y);return o===lord||!o});
   ok(lord.inView(t.vis())&&pts.length&&!won.length,'a lord\'s army on Ashford\'s '+l.k+': inside his outline on the building\'s lot (off his small ring), the building ('+pts.length+' points, '+won.length+' the lord or nothing)')}}
 // ---- a few frames drawn and hovered: no errors
 {for(let i=0;i<20;i++){Object.assign(G.mouse,{x:t.VW/2+i*3,y:t.VH/2,in:true,type:'mouse'});t.wuiHover(performance.now(),.05);t.drawWorld()}ok(!ERR.length,'drawn and hovered: no errors ('+ERR.length+')')}
});
