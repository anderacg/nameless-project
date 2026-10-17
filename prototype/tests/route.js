'use strict';
// Route-finding (battle/route.js; terrain phase 4): A* over a grid of its own with weighted cells, impassable cells and one-way
// cliff edges; no corner cutting; string-pulled waypoints; the nearest reachable point when the goal is out of reach; the node
// budget; the path cache and its version; lineClear; determinism; timings on a field of the battle's size. Grids are built here
// by hand; only routeGridOf reads a real lab battle's ground (TERRAIN.on turned on for it, as tests/terrain.js does).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,ev=s=>(0,eval)(s),U=t.ROUTE.unit,cs=16,C=Math.ceil(t.FIELD_W.max/cs),R=Math.ceil(t.BH/cs);
 const grid=(c=C,r=R)=>t.routeGrid(c,r,cs),cen=(c,r)=>[(c+.5)*cs,(r+.5)*cs],block=(g,c0,r0,c1,r1,k=0)=>{for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)t.routeCell(g,c,r,k)};
 const way=(g,a,b,o)=>t.routePath(g,a[0],a[1],b[0],b[1],o),js=p=>JSON.stringify(p.map(w=>[+w[0].toFixed(3),+w[1].toFixed(3)]));
 // (every leg of a way walkable; its length; the y where it first crosses x=X)
 const legs=(g,a,p)=>{let x=a[0],y=a[1];for(const w of p){if(!t.lineClear(g,x,y,w[0],w[1]))return false;x=w[0];y=w[1]}return true};
 const len=(a,p)=>{let x=a[0],y=a[1],n=0;for(const w of p){n+=Math.hypot(w[0]-x,w[1]-y);x=w[0];y=w[1]}return n};
 const yAt=(a,p,X)=>{let x=a[0],y=a[1];for(const w of p){if((x-X)*(w[0]-X)<=0&&w[0]!==x)return y+(w[1]-y)*(X-x)/(w[0]-x);x=w[0];y=w[1]}return null};
 const cellOf=(g,w)=>g.cost[Math.floor(w[1]/cs)*g.C+Math.floor(w[0]/cs)];
 ok(C===82&&R===38,'the battle field at its widest is '+C+'×'+R+' cells of '+cs+' px (BW ≤ '+t.FIELD_W.max+', BH '+t.BH+')');
 // ---- open ground: one straight leg, no search
 {const g=grid(),a=[100,100],b=[900,500],p=way(g,a,b);ok(p.length===1&&p[0][0]===900&&p[0][1]===500&&p.ok&&!p.cut&&p.n===0,'open ground: one waypoint, the goal, without a search ('+js(p)+')');
  block(g,0,20,C-1,22,23);const a2=cen(10,10),b2=cen(70,30),p2=way(g,a2,b2);ok(p2.length===1&&p2.ok&&p2.n>0&&legs(g,a2,p2),'a band of marsh right across: searched, then straightened into one leg through it ('+js(p2)+', '+p2.n+' cells)');
  const g3=grid();for(let r=0;r<=20;r++)t.routeCell(g3,40,r,0);const a3=cen(30,10),b3=cen(50,10),p3=way(g3,a3,b3),best=Math.hypot(41*cs-a3[0],21*cs-a3[1])+Math.hypot(b3[0]-41*cs,b3[1]-21*cs);
  ok(p3.ok&&p3.length>=2&&p3.length<=3&&legs(g3,a3,p3)&&len(a3,p3)<=best*1.06,'round the end of a wall: '+p3.length+' waypoints, '+Math.round(len(a3,p3))+' px (the taut string '+Math.round(best)+')')}
 // ---- around an impassable block, and through a gap
 {const g=grid();block(g,36,14,45,23);const a=cen(30,18),b=cen(52,18),p=way(g,a,b);
  ok(p.ok&&p.length>=2&&legs(g,a,p)&&p.every(w=>cellOf(g,w)>0)&&len(a,p)<Math.hypot(b[0]-a[0],b[1]-a[1])*1.5,'round a 10×10 block: '+js(p)+' ('+Math.round(len(a,p))+' px)');
  const g2=grid();block(g2,40,0,40,R-1);t.routeCell(g2,40,30,U);t.routeCell(g2,40,31,U);const a2=cen(20,5),b2=cen(60,5),p2=way(g2,a2,b2),y=yAt(a2,p2,40.5*cs);
  ok(p2.ok&&legs(g2,a2,p2)&&y>=30*cs&&y<=32*cs,'through the one gap in a wall: crosses it at y '+(y==null?'-':y.toFixed(1))+' ('+js(p2)+')')}
 // ---- a river with one bridge; wading when it pays
 {const g=grid();block(g,39,0,41,R-1);block(g,39,20,41,21,U);const a=cen(10,4),b=cen(70,4),p=way(g,a,b),y=yAt(a,p,40.5*cs);
  ok(p.ok&&legs(g,a,p)&&y>=20*cs&&y<=22*cs,'a river with one bridge: over the bridge (y '+(y==null?'-':y.toFixed(1))+'), '+p.length+' waypoints');
  const w=Math.round(U/.35),gw=grid();block(gw,39,0,41,R-1,w);block(gw,39,33,41,34,U);const pw=way(gw,a,b),yw=yAt(a,pw,40.5*cs);
  const gn=grid();block(gn,39,0,41,R-1,w);block(gn,39,5,41,6,U);const pn=way(gn,a,b),yn=yAt(a,pn,40.5*cs);
  ok(pw.ok&&yw<8*cs&&pn.ok&&yn>=5*cs&&yn<=7*cs,'wadeable water (cost '+w+'): waded when the bridge is far (y '+(yw|0)+'), the bridge taken when near (y '+(yn|0)+')')}
 // ---- a plateau with one-way cliffs round it (down allowed, up refused) and a ramp on its east side
 {const g=grid(),c0=30,c1=45,r0=10,r1=25,ramp=r=>r>=16&&r<=18;
  for(let r=r0;r<=r1;r++){t.routeWall(g,c0-1,r,0,true);if(!ramp(r))t.routeWall(g,c1+1,r,4,true)}for(let c=c0;c<=c1;c++){t.routeWall(g,c,r0-1,2,true);t.routeWall(g,c,r1+1,6,true)}
  const top=cen(32,17),low=cen(20,17),dn=way(g,top,low),up=way(g,low,top);
  ok(dn.ok&&dn.length===1&&legs(g,top,dn),'down the cliff: straight over the edge ('+js(dn)+')');
  ok(up.ok&&legs(g,low,up)&&up.some(w=>w[0]>c1*cs&&ramp(Math.floor(w[1]/cs)))&&len(low,up)>3*(top[0]-low[0]),'up: refused at the cliff, round to the ramp on the far side ('+js(up)+', '+Math.round(len(low,up))+' px)');
  ok(!t.lineClear(g,low[0],low[1],top[0],top[1])&&t.lineClear(g,top[0],top[1],low[0],low[1]),'lineClear: down over a one-way cliff, not up it');
  ok(t.reachable(g,...low,...top)&&t.reachable(g,...top,...low),'reachable both ways with the ramp');
  for(let r=16;r<=18;r++)t.routeWall(g,c1+1,r,4,true);const shut=way(g,low,top),l=shut[shut.length-1];
  ok(!t.reachable(g,...low,...top)&&t.reachable(g,...top,...low)&&!shut.ok&&l&&l[0]<c0*cs&&Math.abs(l[1]-top[1])<cs,'the ramp walled too: unreachable up, the way ends at the foot of the cliff nearest the goal ('+js(shut.slice(-1))+')')}
 // ---- no corner cutting, past blocked cells or edges
 {const g=grid(20,20);t.routeCell(g,5,5,0);const a=cen(5,4),b=cen(6,5),p=way(g,a,b);
  ok(!t.lineClear(g,...a,...b)&&p.ok&&p.length===2&&p[0][0]===cen(6,4)[0]&&p[0][1]===cen(6,4)[1],'a diagonal past a blocked cell goes round its corner: '+js(p));
  const g2=grid(20,20);t.routeWall(g2,5,4,0);const p2=way(g2,a,b);ok(!t.lineClear(g2,...a,...b)&&p2.ok&&p2.length===2&&p2[0][0]===cen(5,5)[0]&&p2[0][1]===cen(5,5)[1],'and past a cliff edge at the corner: '+js(p2));
  const g3=grid(20,20);t.routeCell(g3,5,5,0);t.routeCell(g3,6,6,0);const p3=way(g3,cen(5,6),cen(6,5));
  ok(!t.lineClear(g3,...cen(5,6),...cen(6,5))&&p3.ok&&p3.length>=2&&legs(g3,cen(5,6),p3),'never between two diagonal blocked cells: '+js(p3));
  g3.mv=null;g3.v++;t.routePrep(g3);ok(!(g3.mv[6*20+5]&1<<7)&&!(g3.mv[5*20+6]&1<<3),'the step masks forbid that diagonal both ways')}
 // ---- out of reach: the nearest reachable point
 {const g=grid();block(g,60,10,66,10);block(g,60,16,66,16);block(g,60,10,60,16);block(g,66,10,66,16);const a=cen(10,13),b=cen(63,13),p=way(g,a,b),l=p[p.length-1];
  ok(!p.ok&&!p.cut&&l&&Math.floor(l[0]/cs)===59&&Math.floor(l[1]/cs)===13&&legs(g,a,p)&&!t.reachable(g,...a,...b),'a goal walled in: the way ends in the reachable cell nearest it, (59,13) at '+js([l]));
  const g2=grid();block(g2,30,30,34,34);const p2=way(g2,cen(10,32),cen(32,32)),l2=p2[p2.length-1];
  ok(!p2.ok&&l2&&l2[0]===520&&l2[1]===476&&!t.reachable(g2,...cen(10,32),...cen(32,32)),'a goal in an impassable cell: to the nearest passable cell, its point nearest the goal '+js([l2]));
  const g3=grid(10,10);block(g3,0,0,9,9);ok(way(g3,cen(1,1),cen(8,8)).length===0,'nowhere passable: no way, no throw')}
 // ---- the node budget
 {const g=grid();block(g,40,0,40,R-2);const a=cen(30,2),b=cen(50,2),p=way(g,a,b,{budget:30}),f=way(g,a,b,{cache:false});
  ok(p.cut&&!p.ok&&p.n<=30&&p.length>0&&legs(g,a,p),'a budget of 30 cells: cut short ('+p.n+' expanded), a part of the way toward the goal '+js(p));
  ok(f.ok&&!f.cut&&f.n>30&&legs(g,a,f),'the full search: '+f.n+' cells, '+f.length+' waypoints');
  const p2=way(g,a,b,{budget:30});ok(p2.cut&&p2.n>0,'a cut way is not cached')}
 // ---- the cache, and its version
 {const g=grid();block(g,36,14,45,23);const a=cen(30,18),b=cen(52,18),p1=way(g,a,b),p2=way(g,a,b),v=g.v;
  ok(p1.n>0&&p2.n===0&&js(p1)===js(p2)&&g.memo.size===1,'the same query twice: the second from the cache ('+p1.n+' then '+p2.n+' cells), the same way');
  const a2=[a[0]+3,a[1]-2],p3=way(g,a2,b);ok(p3.n===0&&legs(g,a2,p3)&&p3[p3.length-1][0]===b[0],'another start in the same cell: the cached cells, straightened from its own point');
  t.routeCell(g,2,2,U);const p4=way(g,a,b);ok(g.v===v+1&&p4.n>0&&js(p4)===js(p1),'an edit moves the version: searched afresh ('+p4.n+' cells)');
  const w=p1[0],wc=Math.floor(w[0]/cs),wr=Math.floor(w[1]/cs);block(g,wc-2,wr-2,wc+2,wr+2);const p5=way(g,a,b);ok(p5.n>0&&p5.ok&&legs(g,a,p5)&&js(p5)!==js(p1),'a block laid on the way: a new way round it');
  for(let k=0;k<100;k++)way(g,cen(2+k%20,2),cen(60+k%15,30));ok(g.memo.size<=t.ROUTE.cache,'the cache keeps at most '+t.ROUTE.cache+' ways ('+g.memo.size+')');
  ok(way(g,a,b,{cache:false}).n>0,'cache:false searches')}
 // ---- lineClear
 {const g=grid(30,30);t.routeCell(g,10,10,0);t.routeWall(g,20,5,0);t.routeWall(g,20,15,0,true);t.routeCell(g,5,20,23);
  ok(t.lineClear(g,...cen(2,27),...cen(27,2))&&!t.lineClear(g,...cen(8,10),...cen(14,10))&&!t.lineClear(g,...cen(10,2),...cen(10,20)),'open: clear; over an impassable cell: not');
  ok(!t.lineClear(g,...cen(18,5),...cen(23,5))&&!t.lineClear(g,...cen(23,5),...cen(18,5)),'a two-way cliff edge: not clear either way');
  ok(!t.lineClear(g,...cen(18,15),...cen(23,15))&&t.lineClear(g,...cen(23,15),...cen(18,15)),'a one-way edge: refused its blocked way, clear the other');
  ok(t.lineClear(g,...cen(5,18),...cen(5,22))&&!t.lineClear(g,...cen(5,18),...cen(5,22),U)&&t.lineClear(g,...cen(4,20),...cen(5,20),U),'cap: a dearer cell crossed refuses it, the last one does not');
  const y=10*cs-6;ok(t.lineClear(g,2*cs,y,20*cs,y)&&!t.lineClear(g,2*cs,y,20*cs,y,255,10),'r: a line 6 px off a blocked cell is clear, 10 px wide it is not');
  ok(t.lineClear(g,-50,-50,cen(3,3)[0],cen(3,3)[1])&&t.lineClear(g,...cen(4,4),...cen(4,4)),'points off the field are clamped; a point to itself is clear')}
 // ---- determinism: a cluttered field, the same ways from two grids built alike; never Math.random
 {const build=()=>{const g=grid(),rnd=t.seeded(77);for(let k=0;k<420;k++){const c=Math.floor(rnd()*C),r=Math.floor(rnd()*R);t.routeCell(g,c,r,rnd()<.7?0:20+Math.floor(rnd()*30))}
    for(let k=0;k<40;k++){const c=1+Math.floor(rnd()*(C-2)),r=1+Math.floor(rnd()*(R-2));t.routeWall(g,c,r,2*Math.floor(rnd()*4),rnd()<.5)}return g};
  let calls=0;const r0=Math.random;Math.random=()=>{calls++;return r0()};let A=[],B2=[],ok2=0;
  try{const g1=build(),g2=build(),rnd=t.seeded(5),q=[];for(let k=0;k<80;k++)q.push([[rnd()*C*cs,rnd()*R*cs],[rnd()*C*cs,rnd()*R*cs]]);
   for(const [a,b] of q){const p=way(g1,a,b,{cache:false});A.push(js(p)+p.ok);if(legs(g1,a,p))ok2++}for(const [a,b] of q){const p=way(g2,a,b);B2.push(js(p)+p.ok)}}finally{Math.random=r0}
  ok(A.join()===B2.join()&&calls===0,'determinism: 80 ways over a cluttered field alike from two grids (one cached), no Math.random ('+calls+' calls)');
  ok(ok2===80,'and every leg of every way walkable ('+ok2+'/80)')}
 // ---- routeGridOf: a real lab battle's ground (a river with a bridge)
 {ev('TERRAIN.on=true');t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;G.mode='world';G.modal=false;
  t.BattleLab.start({leftGroups:[{type:'hum_foot',count:4}],rightGroups:[{type:'hum_foot',count:4}],deploy:false,ai:false,paused:true,morale:false,seed:5,ground:{recipe:'river',river:{bridge:true}}});
  const TT=t.B.terrain,K=t.TKIND,deepN=TT.kind.filter(k=>k===K.deep).length,t0=performance.now(),gw=t.routeGridOf(TT),t1=performance.now(),gd=t.routeGridOf(TT,{deep:true}),gm=t.routeGridOf(TT,{who:'mounted'});t.routePrep(gd);let t2=performance.now();for(let k=0;k<20;k++){gd.v++;t.routePrep(gd)}t2=(performance.now()-t2)/20;
  ok(gw.C===TT.C&&gw.R===TT.R&&gw.cs===TT.cs&&deepN>0&&!gw.cost.includes(0)&&TT.kind.every((k,i)=>k!==K.deep||gw.cost[i]===Math.round(U/t.TERRAIN_GROUND.deep.spd.foot)),'routeGridOf: the grid of the field ('+TT.C+'×'+TT.R+'), deep water wadeable by default (cost '+Math.round(U/.35)+', '+deepN+' cells)');
  ok(TT.kind.every((k,i)=>(gd.cost[i]===0)===(k===K.deep)),'with deep: true, deep water and only deep water is impassable');
  ok(TT.kind.every((k,i)=>k!==K.bridge&&k!==K.open||gw.cost[i]===U)&&TT.kind.every((k,i)=>k!==K.ford||gm.cost[i]>gw.cost[i]),'a bridge is open ground; a ford costs riders more than men on foot');
  const cr=TT.ai.crossings,ys=cr.map(c=>c.y),y0=ys.length?(Math.min(...ys)<t.BH/2?t.BH-80:80):80,a=[t.BW*.15,y0],b=[t.BW*.85,y0],p=way(gd,a,b),on=cr.find(c=>{const y=yAt(a,p,c.x);return y!=null&&y>=c.y0-1&&y<=c.y1+1});
  ok(cr.length>0&&p.ok&&legs(gd,a,p)&&!!on,'over the river by a crossing ('+(on?on.kind+' at y '+Math.round(on.y):'none: '+js(p))+'; '+cr.map(c=>c.kind).join(', ')+'), '+p.length+' waypoints');
  info('routeGridOf on a '+TT.C+'×'+TT.R+' field: '+(t1-t0).toFixed(3)+' ms; routePrep (step masks, again after each edit) '+t2.toFixed(3)+' ms');
  t.BattleLab.exit();ev('TERRAIN.on=false')}
 // ---- timings on a field of the battle's size (82×38): a river with a bridge and a ford, a plateau with one-way cliffs and a
 // ramp, two mountains, marsh and woods
 {const g=grid();block(g,39,0,41,R-1);block(g,39,8,41,9,U);block(g,39,27,41,30,23);block(g,8,4,12,8,23);block(g,24,28,30,33,20);block(g,60,6,64,12);block(g,66,24,70,30);
  for(let r=12;r<=22;r++){t.routeWall(g,14,r,0,true);if(r<16||r>18)t.routeWall(g,26,r,4,true)}for(let c=15;c<=25;c++){t.routeWall(g,c,11,2,true);t.routeWall(g,c,23,6,true)}
  const rnd=t.seeded(3),q=[];for(let k=0;k<300;k++)q.push([[(2+rnd()*18)*cs,(1+rnd()*(R-2))*cs],[(60+rnd()*20)*cs,(1+rnd()*(R-2))*cs]]);
  for(const [a,b] of q.slice(0,60))way(g,a,b,{cache:false});// (warm)
  // (each timed 10 times over: the clock is coarse in a headless browser)
  let tot=0,mx=0,ns=0,nm=0;const ms=[];for(const [a,b] of q){const s=performance.now();let p;for(let k=0;k<10;k++)p=way(g,a,b,{cache:false});const d=(performance.now()-s)/10;ms.push(d);tot+=d;if(d>mx)mx=d;ns+=p.n;if(p.n>nm)nm=p.n}
  ms.sort((x,y)=>x-y);const med=ms[ms.length>>1],p95=ms[Math.floor(ms.length*.95)];
  let sh=0;const sq=[];for(let k=0;k<300;k++){const a=[(2+rnd()*30)*cs,(1+rnd()*(R-2))*cs];sq.push([a,[a[0]+(rnd()-.5)*200,a[1]+(rnd()-.5)*200]])}
  {const s=performance.now();for(const [a,b] of sq)way(g,a,b,{cache:false});sh=(performance.now()-s)/sq.length}
  // (the worst: a goal inside a mountain ring, out of reach: the whole field flooded)
  const gr=grid();block(gr,39,0,41,R-1);block(gr,39,8,41,9,U);block(gr,70,15,78,15);block(gr,70,23,78,23);block(gr,70,15,70,23);block(gr,78,15,78,23);let wst=0,wn=0;
  for(let k=0;k<20;k++){const s=performance.now();let p;for(let j=0;j<10;j++)p=way(gr,cen(3,3+k),cen(74,19),{cache:false});const d=(performance.now()-s)/10;if(d>wst)wst=d;wn=p.n}
  let ch=0;{for(const [a,b] of q.slice(0,40))way(g,a,b);const s=performance.now();for(let k=0;k<5;k++)for(const [a,b] of q.slice(0,40))way(g,a,b);ch=(performance.now()-s)/200}
  let fl=0;{const s=performance.now();for(const [a,b] of q.slice(0,100))t.reachable(g,...a,...b);fl=(performance.now()-s)/100}
  let lc=0;{const s=performance.now();for(let k=0;k<1000;k++){const [a,b]=q[k%300];t.lineClear(g,...a,...b)}lc=(performance.now()-s)/1000}
  info('timing on '+C+'×'+R+' (300 ways across the river, zone to zone, no cache): mean '+(tot/q.length).toFixed(3)+' ms, median '+med.toFixed(3)+', p95 '+p95.toFixed(3)+', max '+mx.toFixed(3)+'; cells expanded mean '+Math.round(ns/q.length)+', max '+nm);
  info('timing: short moves (≤ ~140 px) '+sh.toFixed(4)+' ms; from the cache '+ch.toFixed(4)+' ms; worst (goal walled in, '+wn+' cells flooded) '+wst.toFixed(3)+' ms; reachable '+fl.toFixed(4)+' ms; lineClear '+(lc*1000).toFixed(2)+' µs')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
try{(0,eval)('TERRAIN.on=false');if(T.BattleLab.active)T.BattleLab.exit()}catch(e){}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
