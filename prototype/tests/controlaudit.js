'use strict';
// the order/control layer's audit (commander.js, battlecontrol.js, commands.js, deploy.js): AI notes cleared when Auto is
// toggled, your formation and flag buttons taking command back, your orders ending a character's fall-back, a braced group
// never pulled off as a plug, riders keeping their flank, rescuing riders recharging, a withdrawal you ordered kept under Auto,
// posture hysteresis and memory per captain, the hunt's way home, engaged wavering groups fighting on, and a fall-back's target
// kept from a duel a moment
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),auto0=t.AUTOSK.on;try{
 // left/right: group specs; at: [x,y] for each group (left first, then right): laid out in its formation there (lay), or every
 // man of a group on its spot
 const army=(left,right,at,extra={},lay=true)=>{if(L.active)L.exit();L.start({leftGroups:left,rightGroups:right,morale:true,deploy:false,paused:true,ai:false,seed:42,...extra});const b=t.B;b.obs=[];
  const mine=t.playerGroups().map(id=>b.groups[id]),foe=Object.values(b.groups).filter(g=>g.foe);
  [...mine,...foe].forEach((g,i)=>{g.placeAt(at[i][0],at[i][1]);if(lay)t.layForm(g.id);g.units.forEach(u=>{u.x=lay?g.ax+(u.sx||0):at[i][0];u.y=lay?g.ay+(u.sy||0):at[i][1]})});return {b,mine,foe}};
 const G=(type,count)=>({type,count}),C=g=>g.centre(),still=g=>g.units.forEach(u=>{u.s={...u.s,spd:0};u.cd=999}),step=s=>{const end=t.B.t+s;while(t.B.t<end-1e-9&&!L.session.result)L.step(6)};
 const press=(u,list)=>{list.forEach((e,i)=>{const a=Math.PI*(.7+.3*i);e.x=u.x+Math.cos(a)*16;e.y=u.y+Math.sin(a)*16})},look=(u,S,n=1)=>{for(let i=0;i<n;i++){S.fbT=0;t.commandCharacters(.01)}};
 const think=(n=1,dt=.5)=>{for(let i=0;i<n;i++){t.B.t+=dt;t.B.lastHit=t.B.t;t.command(1)}};
 // ----- 1. Auto toggled: the AI's notes and its captain's memory cleared
 let w=army([G('hum_foot',12),G('hum_bow',12)],[G('hum_foot',12)],[[300,300],[250,300],[600,300]],{ai:true});w.foe.forEach(still);let [mi,ma]=w.mine;
 t.command(1);ok(ma.stand&&Math.abs(ma.ay-300)<20,'(fixture: under Auto your archers stand where they are and shoot)');
 t.setAuto(false,true);ma.moveTo(250,150);ma.units.forEach(u=>{u.x=ma.ax+(u.sx||0);u.y=ma.ay+(u.sy||0)});
 const notes=['stand','hunt','huntBack','screenBack','recover','plug','pushed','pushRun','rest','inMelee','chargeAt','lax','lay','flankSide','formAt'];const fake={stand:{x:250,y:300},hunt:{t:w.foe[0].units[0],x:250,y:300,tx:600,ty:300},huntBack:1,screenBack:{x:250,y:300},recover:{done:0},plug:ma.id,pushed:true,pushRun:true,rest:true,inMelee:1,chargeAt:1,lax:1,lay:1,flankSide:1,formAt:1};notes.forEach(k=>mi[k]=fake[k]);
 t.setAuto(true,true);ok(notes.every(k=>mi[k]==null)&&!mi.phase,'Auto on again: every AI note on your groups is cleared ('+notes.filter(k=>mi[k]!=null).join(',')+')');
 ok(!w.b.captains||w.b.captains[0]==null,'and your captain’s plan, posture, volleys and commitment start afresh');
 t.command(1);ok(Math.abs(ma.ay-150)<20,'your archers moved while you had command are not sent back to their old spot (ay '+Math.round(ma.ay)+')');
 // ----- 2. formation and flag buttons take command back; a form taken at the start is not "held"
 w=army([G('hum_foot',12),G('hum_bow',12)],[G('hum_foot',12)],[[300,300],[250,300],[600,300]],{ai:true});
 t.selectGroup(w.mine[1].id);t.toggleFlag('skirmish');ok(!t.B.auto&&w.mine[1].skirmish,'a flag button (skirmish) under Auto takes command back, and the flag stays');
 t.setAuto(true,true);t.setForm('loose');ok(!t.B.auto&&w.mine[1].form==='loose','a formation button (loose) under Auto takes command back');
 w=army([G('hum_foot',12)],[G('hum_bow',12)],[[300,300],[700,300]]);let fa=w.foe[0];fa.setForm('loose');t.command(1);
 ok(fa.form==='line','a loose order set with no timestamp is not "held" in the battle’s first seconds (form '+fa.form+')');
 // ----- 3. your orders end your hero's fall-back; Auto skills off, no fall-back
 t.AUTOSK.on=true;const hfx=(attack)=>{w=army([G('hero',1),G('hum_foot',10)],[G('hum_foot',3),G('hum_foot',12)],[[480,300],[300,300],[500,300],[700,120]]);const h=t.B.hero,H=t.heroState(),hg=t.B.groups[h.grp],tg=w.foe[0];w.foe.forEach(still);
  if(attack)hg.attack(tg);press(h,tg.units);h.hp=h.max*.2;H.shoveCd=99;H.rollCd=0;H.sp=t.maxSP();H.think=0;t.commandCharacters(.01);step(1.5);H.sp=t.maxSP();look(h,H,2);return {h,H,hg}};
 let F=hfx(true);ok(F.H.fallBack,'(fixture: your hero falls back from a press of three, still out)');t.selectGroup(F.hg.id);t.setOrder('charge');look(F.h,F.H);
 ok(!F.H.fallBack,'Charge (at a run) on its group, its order otherwise the same: the fall-back ends');
 F=hfx(false);ok(F.H.fallBack&&F.hg.order==='hold','(fixture: holding, falls back)');t.selectGroup(F.hg.id);t.setOrder('hold');look(F.h,F.H);ok(!F.H.fallBack,'Hold on a group already holding ends it too');
 F=hfx(false);t.selectGroup(F.hg.id);t.rtsOrder(200,520,{queue:true});look(F.h,F.H);ok(!F.H.fallBack&&F.hg.queue.length===1,'a Shift-queued waypoint ends it too');
 ok(!Object.keys(F.hg).includes('orderSeq')&&F.hg.orderSeq>0,'(the order count is kept out of snapshots: not enumerable)');
 F=hfx(true);t.AUTOSK.on=false;look(F.h,F.H);ok(!F.H.fallBack,'Auto skills off: your hero has no fall-back of the AI’s');t.AUTOSK.on=true;
 // ----- 4. a group braced this think is no plug
 w=army([G('hum_knight',10),G('hum_foot',12)],[G('hum_spear',16),G('hum_foot',12)],[[310,300],[330,480],[380,300],[440,480]],{},false);let [sp,wv]=w.foe;
 w.mine[0].units.forEach(u=>{u.run=t.CHARGE.run;u.cd=999});wv.resolve.mor=10;sp.resolve.mor=80;t.command(1);
 ok(wv.recover,'(fixture: the wavering group pulls back)');ok(t.abilityActive(sp,'brace')&&!sp.plug&&!sp.hasTarget,'the spear group braced against riders is not sent off to plug the gap (brace '+t.abilityActive(sp,'brace')+', plug '+sp.plug+')');
 // ----- 5. riders keep the flank they chose
 w=army([G('hum_foot',12)],[G('hum_knight',8)],[[300,t.BH/2-5],[800,120]],{},false);let k=w.foe[0];k.phase='flank';k.t=0;
 const side=()=>Math.sign(k.ay-C(w.mine[0]).y);think();const s1=side();w.mine[0].units.forEach(u=>u.y=t.BH/2+5);think();
 ok(k.phase==='flank'&&s1===side()&&s1===-1,'the foe’s middle crossing the field’s half, the riders keep their flank (their own side, above) ('+s1+' then '+side()+')');
 // ----- 6. riders rescuing their archers pull back to charge again
 w=army([G('hum_foot',10)],[G('hum_bow',10),G('hum_knight',8)],[[650,300],[700,300],[652,300]],{},false);k=w.foe[1];k.phase='charge';k.t=0;
 let reg=false;for(let i=0;i<10&&!reg;i++){think();reg=k.phase==='regroup'}ok(reg,'in the melee at the threat to their archers past recharge s, they pull back to charge again');
 w=army([G('hum_foot',10)],[G('hum_bow',10),G('hum_knight',8)],[[400,300],[700,300],[600,300]],{},false);k=w.foe[1];k.phase='charge';k.t=0;k.inMelee=99;think();ok(k.phase==='charge','a stale melee count does not pull them back at once');
 // ----- 8. a withdrawal you ordered is kept under Auto
 w=army([G('hum_foot',12)],[G('hum_foot',12)],[[300,300],[600,300]]);let g=w.mine[0];g.withdraw();t.setAuto(true,true);t.command(1);ok(g.order==='withdraw','Auto on: a group you sent off withdrawing keeps withdrawing ('+g.order+')');
 w.b.t=t.FOE_CMD.lull+1;w.b.lastHit=0;for(const c of Object.values(w.b.captains||{}))c.post=null;t.command(1);ok(g.order==='withdraw','and the lull does not send it back in');
 // ----- 9. posture hysteresis
 w=army([G('hum_foot',12)],[G('hum_foot',12)],[[300,300],[600,300]]);w.b.t=5;const S={ratio:t.FOE_CMD.attackAt-.05,shootMe:.5,shootFoe:.2};
 t.captainMem(1).post='attack';ok(t.posture(1,S)==='attack','attacking, a strength ratio a little under attackAt keeps it attacking');
 t.captainMem(1).post='defend';ok(t.posture(1,S)==='defend','defending, the same ratio keeps it defending');
 t.captainMem(1).post='attack';ok(t.posture(1,{...S,ratio:t.FOE_CMD.attackAt-.2})==='defend','well under it, it turns to defend');
 // ----- 10. your allies and your army on Auto: a posture each
 w=army([G('hum_foot',12),G('hum_foot',12)],[G('hum_foot',12),G('hum_bow',12)],[[300,250],[300,350],[600,300],[650,300]]);w.mine[1].player=false;w.mine[1].ally=true;w.b.auto=true;t.command(1);
 ok(w.b.captains&&w.b.captains.ally&&w.b.captains.ally.post!=null&&w.b.captains[0]&&w.b.captains[0].post!=null,'your allies’ captain and your army’s keep a posture each ('+JSON.stringify(Object.fromEntries(Object.entries(w.b.captains||{}).map(([k,c])=>[k,c.post])))+')');
 // ----- 11. the hunt's way home
 w=army([G('hum_bow',6)],[G('hum_bow',10)],[[100,300],[700,300]]);fa=w.foe[0];w.b.t=8;w.b.lastHit=8;const prey=w.mine[0].units[0];
 fa.hunt={t:prey,x:700,y:300,tx:prey.x,ty:prey.y};fa.backing=true;t.command(1);ok(fa.huntBack===8,'a hunt called off (backing) heads home stamped with the time ('+fa.huntBack+')');
 w.mine[0].units.forEach(u=>u.x+=350);fa.backing=false;w.b.t+=.5;w.b.lastHit=w.b.t;t.command(1);ok(fa.huntBack&&!fa.hasTarget,'on the way home they shoot where they are, never set on a foe at a run');
 // ----- 12. a wavering group in the fight fights on
 w=army([G('hum_foot',20)],[G('hum_foot',15),G('hum_foot',15)],[[455,280],[455,280],[455,320]],{},false);let [a,s]=w.foe;a.resolve.mor=10;s.resolve.mor=80;t.command(1);
 ok(!a.recover&&!s.plug,'a wavering group engaged hand to hand is not pulled back (it fights on)');
 w=army([G('hum_foot',20)],[G('hum_foot',15),G('hum_foot',15)],[[400,300],[455,280],[455,320]],{},false);[a,s]=w.foe;a.resolve.mor=10;s.resolve.mor=80;t.command(1);ok(a.recover,'one not yet engaged still steps back');
 // ----- 13. a fall-back's target kept from a duel a moment
 w=army([G('hero',1),G('hum_foot',4),G('hum_foot',1)],[G('brann',1),G('hum_foot',10)],[[100,550],[300,300],[300,140],[480,300],[640,300]]);w.mine.forEach(still);
 const u=w.foe[0].units[0],Ch=t.champ(u),lone=w.mine[2].units[0],h=t.B.hero;u.sta=t.FATIGUE.max;Ch.fallBack={at:w.b.t-2,x:u.x,y:u.y,ord:''};Ch.think=99;look(u,Ch);
 ok(!Ch.fallBack&&u.tgt===lone,'(fixture: back in, at the lone foe)');h.x=u.x-100;h.y=u.y;t.commandCharacters(.01);ok(u.tgt===lone,'a character of yours near does not draw it off that foe the next moment');
 w.b.t+=3;t.commandCharacters(.01);ok(u.tgt===h,'a moment later, the duel as ever');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{t.AUTOSK.on=auto0;if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
