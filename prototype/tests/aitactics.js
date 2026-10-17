'use strict';
// AI tactics (commander.js AI_TACTICS): the shooters' posture (aggressive: they lead and open fire, then fall back behind their
// infantry; safe: behind it), charges begun from further off as stamina allows, and the captains' use of the unit abilities
// (Brace, Rally, Spur, Fire arrows); the same for the enemy, allies and your army on auto, and morale-off battles still fine
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);try{
 const X=t.AI_TACTICS;
 // left/right: group specs; at: [x,y] for each group (left first, then right), laid out in its formation there
 const army=(left,right,at,extra={})=>{if(L.active)L.exit();L.start({leftGroups:left,rightGroups:right,morale:true,deploy:false,paused:true,ai:false,seed:42,...extra});const b=t.B;b.obs=[];
  const mine=t.playerGroups().map(id=>b.groups[id]),foe=Object.values(b.groups).filter(g=>g.foe);
  [...mine,...foe].forEach((g,i)=>{g.placeAt(at[i][0],at[i][1]);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0)})});return {b,mine,foe}};
 const G=(type,count,form)=>({type,count,...(form?{form}:{})}),C=g=>g.centre(),still=g=>g.units.forEach(u=>{u.s={...u.s,spd:0};u.cd=999});
 const step=s=>{const end=t.B.t+s;while(t.B.t<end-1e-9&&!L.session.result)L.step(30)},mode=(k=1)=>t.B.rmode&&t.B.rmode[k]||{},sta=(g,v)=>g.units.forEach(u=>u.sta=v);
 // ----- the shooters' posture
 let w=army([G('hum_foot',12)],[G('hum_foot',20),G('hum_bow',20)],[[200,300],[780,300],[830,300]]);let [fi,fa]=w.foe;still(w.mine[0]);
 t.command(1);ok(mode().mode==='aggressive'&&mode().why==='','out-ranging and out-shooting, no riders against them, attacking: the shooters lead (aggressive)');
 step(10);const reach=fa.units.some(a=>w.mine[0].units.some(e=>Math.hypot(e.x-a.x,e.y-a.y)<=a.s.range));
 ok(C(fa).x<C(fi).x-20&&reach,'they stand ahead of their infantry, in reach of the foe ('+Math.round(C(fi).x-C(fa).x)+' px ahead)');
 ok(w.b.plan[1]&&w.b.plan[1].leads&&fi.ax>=fa.ax,'the army’s line puts the infantry behind them while they lead');
 const shot=w.b.arrows.some(a=>a.by&&a.by.team===1)||fa.units.some(u=>u.ammo!=null&&u.ammo<t.quiverOf(u.s));ok(shot,'and they open fire');
 // melee closes on them: safe, back behind the infantry at a run
 const A=C(fa);w.mine[0].units.forEach((u,i)=>{u.x=A.x-90+(i%4)*6;u.y=A.y-10+Math.floor(i/4)*8});t.command(1);
 ok(mode().mode==='safe'&&mode().why==='closing','a foe who fights hand to hand closing on them: safe again (why: closing)');
 ok(fa.screenBack&&fa.ax>C(fi).x&&fa.run,'and the leading shooters go back behind their infantry, at a run');
 w.mine[0].units.forEach(u=>{u.x=150;u.y=300});w.b.t+=X.dwell+.1;t.command(1);ok(mode().mode==='aggressive'&&!fa.screenBack,'the danger past (and a breath later), they lead again');
 // riders against them: safe, behind the infantry
 w=army([G('hum_foot',12),G('hum_knight',12)],[G('hum_foot',24),G('hum_bow',20)],[[200,250],[200,380],[780,300],[830,300]]);[fi,fa]=w.foe;w.mine.forEach(still);w.b.commit={1:true};
 t.command(1);ok(mode().mode==='safe'&&mode().why==='cavalry','riders that can run them down: the shooters play safe (why: cavalry)');
 let ahead=0;for(let i=0;i<14;i++){step(.5);if(C(fa).x<C(fi).x-15)ahead++}ok(ahead===0,'and never stand ahead of their infantry');
 w=army([G('hum_foot',40)],[G('hum_foot',10),G('hum_bow',10)],[[200,300],[780,300],[830,300]]);still(w.mine[0]);w.b.commit={1:true};t.command(1);ok(mode().mode==='safe'&&mode().why==='outnumbered','outnumbered: safe (why: outnumbered)');
 w=army([G('hum_foot',12)],[G('hum_foot',20),G('hum_bow',20)],[[200,300],[780,300],[830,300]]);w.foe[1].units.forEach(u=>u.ammo=2);t.command(1);ok(mode().mode==='safe'&&mode().why==='worn','quivers nearly empty: safe (why: worn)');
 w=army([G('hum_foot',12)],[G('hum_foot',20),G('hum_bow',20)],[[200,300],[780,300],[830,300]]);w.foe[1].resolve.mor=20;t.command(1);ok(mode().mode==='safe'&&mode().why==='worn','their nerve wavering: safe (why: worn)');
 // ----- charges: further off when fresh, gated by stamina
 const fin=(g,k)=>{const N={inf:[],arc:[],mag:[],cav:[],hero:[]};N[k]=[g.id];t.captainFinish(1,N)};
 w=army([G('hum_foot',20)],[G('hum_knight',10)],[[200,300],[700,300]]);let k=w.foe[0];k.phase='charge';k.attack(w.mine[0].units[0]);fin(k,'cav');
 ok(k.run,'fresh riders on a charge gallop from far off ('+Math.round(C(k).x-C(w.mine[0]).x)+' px)');
 sta(k,50);fin(k,'cav');ok(!k.run,'less fresh, they walk till CAPT.runAt of their mark');
 w.foe[0].units.forEach(u=>u.x-=330);sta(k,50);fin(k,'cav');ok(k.run,'and run from there');
 sta(k,30);fin(k,'cav');ok(!k.run,'tired, a run under way drops to a walk till runNear of the mark');
 sta(k,FATIGUE_SPENT());fin(k,'cav');ok(!k.run,'spent, they walk all the way');
 w=army([G('hum_foot',20)],[G('hum_knight',10)],[[200,300],[600,300]]);k=w.foe[0];k.phase='flank';sta(k,30);t.command(1);ok(k.phase==='flank'&&!k.run,'tired riders ride round a flank at a walk');
 w=army([G('hum_foot',20)],[G('hum_foot',20)],[[200,300],[420,300]]);let f=w.foe[0];f.attack(w.mine[0]);fin(f,'inf');
 ok(f.run&&X.runFar>t.CAPT.runAt,'fresh infantry charging runs from further off (runFar '+X.runFar+' px, not CAPT.runAt '+t.CAPT.runAt+')');sta(f,50);fin(f,'inf');ok(!f.run,'not fresh, it walks till CAPT.runAt');
 w=army([G('hum_foot',20)],[G('hum_foot',20)],[[200,300],[330,300]]);w.b.commit={1:true};t.command(1);ok(w.foe[0].order==='charge','fresh and attacking, infantry charges from footFar ('+X.footFar+' px), not only once the lines meet');
 w=army([G('hum_foot',20)],[G('hum_foot',20)],[[200,300],[330,300]]);w.b.commit={1:true};sta(w.foe[0],30);t.command(1);ok(w.foe[0].order!=='charge','tired, it waits for the lines to meet');
 w=army([G('hum_foot',20)],[G('hum_knight',10)],[[200,300],[350,300]]);k=w.foe[0];k.phase='flank';k.t=0;t.command(1);ok(k.phase==='charge'&&k.order==='charge','fresh riders on their way round a flank charge from cavStart, not on top of the foe');
 w=army([G('hum_foot',20)],[G('hum_knight',10)],[[200,300],[350,300]]);k=w.foe[0];k.phase='flank';k.t=0;sta(k,50);t.command(1);ok(k.phase==='flank','less fresh, they ride on round the flank');
 w=army([G('hum_foot',20)],[G('hum_knight',10)],[[200,300],[600,300]]);k=w.foe[0];k.phase='regroup';k.t=0;sta(k,30);k.standAt(C(k).x,C(k).y);t.command(1);t.command(1);
 ok(k.phase==='regroup'&&k.rest,'tired after a charge, they stand off to get their breath back');k.t=X.restMax;t.command(1);ok(k.phase==='charge','but no longer than restMax s');
 // ----- abilities
 // Brace: riders running in at a spear group's front
 w=army([G('hum_knight',10)],[G('hum_spear',16)],[[300,300],[380,300]]);const sp=w.foe[0];ok(sp.abilities().some(a=>a.id==='brace'),'fixture: an enemy spear group can brace');
 w.mine[0].units.forEach(u=>{u.run=t.CHARGE.run;u.cd=999});t.command(1);ok(t.abilityActive(sp,'brace'),'riders charging in at its front: the spear group braces');
 for(let i=0;i<4;i++){w.b.t+=.5;t.command(1)}ok(t.abilityActive(sp,'brace')&&sp.order==='hold'&&!sp.hasTarget,'and its captain leaves it braced while they are near');
 w.mine[0].units.forEach(u=>{u.x=40;u.y=40;u.run=0});w.b.commit={1:true};w.b.t+=.5;t.command(1);w.b.t+=.5;t.command(1);ok(!t.abilityActive(sp,'brace'),'the danger past, it is given orders again (attacking: ending the brace)');
 w=army([G('hum_knight',10)],[G('hum_spear',16)],[[300,300],[380,300]]);w.mine[0].units.forEach(u=>{u.run=0});t.command(1);ok(!t.abilityActive(w.foe[0],'brace'),'riders standing (no momentum): no brace');
 // Rally
 w=army([G('hum_foot',20)],[G('hum_foot',15),G('hum_foot',15)],[[200,300],[600,250],[600,350]]);let [r1]=w.foe;r1.resolve.mor=20;t.command(1);
 ok(r1.abil&&r1.abil.rally&&r1.resolve.mor>=34,'a wavering group rallies (+15)');r1.resolve.mor=20;t.command(1);ok(r1.resolve.mor===20,'not again while Rally cools down');
 w=army([G('hum_foot',20)],[G('hum_foot',15)],[[200,300],[600,300]]);w.foe[0].resolve.mor=-5;t.command(1);ok(w.foe[0].abil&&w.foe[0].abil.rally&&w.foe[0].resolve.mor>0,'a breaking group rallies');
 w=army([G('hum_foot',20)],[G('hum_foot',15)],[[200,300],[600,300]],{morale:false});w.foe[0].resolve&&(w.foe[0].resolve.mor=10);t.command(1);ok(!(w.foe[0].abil&&w.foe[0].abil.rally),'with morale off, no rally');
 // Spur
 w=army([G('hum_foot',20)],[G('hum_knight',10)],[[200,300],[330,300]]);k=w.foe[0];k.phase='flank';t.command(1);
 ok(k.phase==='charge'&&k.abil&&k.abil.spur&&k.units.every(u=>u.run>=t.CHARGE.run-1e-9),'a fresh charge on a mark '+X.spur[0]+'-'+X.spur[1]+' px off: the riders spur (full momentum at once)');
 w=army([G('hum_foot',20)],[G('hum_knight',10)],[[200,300],[330,300]]);k=w.foe[0];k.phase='charge';k.attack(w.mine[0]);sta(k,X.spurSta-10);t.command(1);ok(!(k.abil&&k.abil.spur),'short of breath: no spur');
 w=army([G('hum_foot',20)],[G('hum_knight',10)],[[200,300],[700,300]]);k=w.foe[0];k.phase='charge';k.attack(w.mine[0]);t.command(1);ok(!(k.abil&&k.abil.spur),'a mark far off: not yet');
 // Fire arrows
 w=army([G('hum_knight',10)],[G('hum_bow',12)],[[400,300],[700,300]]);still(w.mine[0]);t.command(1);ok(w.foe[0].abil&&w.foe[0].abil.fire,'archers shooting at armoured knights loose fire arrows');
 w=army([G('hum_levy',10)],[G('hum_bow',12)],[[400,300],[700,300]]);still(w.mine[0]);t.command(1);ok(!(w.foe[0].abil&&w.foe[0].abil.fire),'at unarmoured levies, plain arrows');
 ok(t.fireWorth({s:t.ST.hum_bow},{s:t.ST.wolf})&&!t.fireWorth({s:t.ST.hum_bow},{s:t.ST.dragon}),'fire for a beast weak to it (wolves), not one that shrugs it off (a dragon)');
 // ----- morale off, and your army on auto
 w=army([G('hum_foot',20),G('hum_bow',12),G('hum_knight',6,'wedge')],[G('hum_foot',20),G('hum_bow',12),G('hum_knight',6,'wedge')],[[300,300],[250,300],[300,150],[660,300],[710,300],[660,450]],{morale:false,ai:true});
 step(20);ok(!L.session.result||/wins/.test(L.session.result),'a morale-off battle of both armies under the AI runs on ('+(L.session.result||'still fighting')+')');
 w=army([G('hum_foot',20),G('hum_bow',20)],[G('hum_foot',12)],[[170,300],[120,300],[780,300]],{ai:true});still(w.foe[0]);t.command(1);ok(mode(0).mode==='aggressive','your army under the AI leads with its shooters by the same rules');
 step(12);ok(C(w.mine[1]).x>C(w.mine[0]).x+20,'and they go up ahead of your infantry');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
 function FATIGUE_SPENT(){return T.FATIGUE.spent-5}
};
