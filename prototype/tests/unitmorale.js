'use strict';
// unit-level AI morale (commander.js UNIT_AI): a wavering infantry group steps back while a steady one plugs the gap, shaken
// riders start no new charge, and the captains go after wavering foes; the same for the enemy, allies and your army on auto
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);try{
 const U=t.UNIT_AI;
 // left/right: group specs; at: [x,y] for each group (left first, then right), every man of a group on its spot
 const army=(left,right,at,extra={})=>{if(L.active)L.exit();L.start({leftGroups:left,rightGroups:right,morale:true,deploy:false,paused:true,ai:false,seed:42,...extra});const b=t.B;b.obs=[];
  const mine=t.playerGroups().map(id=>b.groups[id]),foe=Object.values(b.groups).filter(g=>g.foe);[...mine,...foe].forEach((g,i)=>g.units.forEach(u=>{u.x=at[i][0];u.y=at[i][1];u.cd=999}));return {b,mine,foe}};
 const foot=n=>({type:'hum_foot',count:n}),C=g=>g.centre(),aim=g=>g.targetGroupId;
 // ----- infantry: pull back and plug the gap
 let w=army([foot(20)],[foot(15),foot(15)],[[400,300],[455,280],[455,320]]);let [a,s]=w.foe;
 ok(w.foe.length===2&&w.foe.every(g=>g.role==='inf'&&g.resolve),'fixture: two enemy infantry groups with their own resolve');
 a.resolve.mor=10;s.resolve.mor=80;const c0=C(a);t.command(1);
 ok(a.recover&&a.order==='hold'&&a.ax-c0.x>=60,'a wavering enemy group with a steady sibling pulls back, away from your side ('+Math.round(a.ax-c0.x)+' px)');
 ok(s.hasTarget&&s.order==='charge'&&w.mine[0].units.some(u=>u.grp===aim(s)),'its steady sibling is sent onto the foe in front of the gap');
 const ax=a.ax;t.command(1);t.command(1);ok(a.recover&&a.order==='hold'&&a.ax===ax&&s.hasTarget&&aim(s)===w.mine[0].id,'the pull-back and the plug are kept on later ticks, not re-picked');
 a.resolve.mor=U.backAt+1;t.command(1);ok(!a.recover&&a.order==='charge','recovered to backAt, it resumes its normal orders');
 a.resolve.mor=U.backAt-5;t.command(1);ok(!a.recover&&a.order==='charge','above pullAt again it does not flip back to recovering (hysteresis)');
 w=army([foot(20)],[foot(15),foot(15)],[[400,300],[455,280],[455,320]]);[a,s]=w.foe;a.resolve.mor=10;s.resolve.mor=80;t.command(1);ok(a.recover,'(time cap fixture pulled back)');
 w.b.t+=U.maxRecover+.1;t.command(1);ok(a.order==='charge'&&a.recover&&a.recover.done!=null,'the maxRecover time cap ends recovery even while still wavering');
 t.command(1);w.b.t+=1;t.command(1);ok(a.order==='charge'&&a.recover.done!=null,'after the time cap it does not at once pull back again');
 w=army([foot(20)],[foot(15),foot(15)],[[400,300],[455,280],[455,320]]);[a,s]=w.foe;a.resolve.mor=10;s.resolve.mor=10;t.command(1);
 ok(!a.recover&&!s.recover&&a.order==='charge'&&s.order==='charge','with no steady sibling a wavering group fights on');
 w=army([foot(20)],[foot(15)],[[400,300],[460,300]]);w.foe[0].resolve.mor=10;t.command(1);ok(!w.foe[0].recover&&w.foe[0].order==='charge','a lone wavering group fights on');
 w=army([foot(20)],[foot(15),foot(15)],[[400,300],[455,280],[455,320]]);[a,s]=w.foe;a.resolve.mor=10;s.resolve.mor=80;w.mine[0].units.forEach(u=>{u.x=457;u.y=322});t.command(1);
 ok(a.recover&&!s.plug,'a sibling already in the fight (busy) is not pulled off it to plug the gap');
 // ----- cavalry: shaken riders start no new charge
 const knights=[{type:'hum_knight',count:10}];
 w=army([foot(20)],knights,[[400,300],[600,300]]);let k=w.foe[0];ok(k.role==='cav'&&k.resolve,'fixture: enemy cavalry with a resolve');
 k.resolve.mor=U.chargeAt-10;k.phase='flank';k.t=99;t.command(1);ok(k.phase==='regroup'&&k.order==='hold'&&!k.hasTarget,'shaken cavalry do not start a charge from the flank: they stand off');
 k.t=U.cavRecover-1;t.command(1);ok(k.phase==='regroup'&&k.order==='hold','nor from the regroup while still shaken');
 k.resolve.mor=U.chargeAt+10;k.t=5;t.command(1);ok(k.phase==='charge'&&k.order==='charge'&&k.hasTarget,'recovered, they charge again');
 w=army([foot(20)],knights,[[400,300],[600,300]]);k=w.foe[0];k.resolve.mor=5;k.phase='flank';k.t=99;t.command(1);k.t=U.cavRecover;t.command(1);ok(k.phase==='charge'&&k.order==='charge','still shaken after cavRecover s standing off, they charge anyway (worn riders never stand off for ever)');
 w=army([foot(20)],knights,[[400,300],[600,300]]);k=w.foe[0];k.resolve.mor=U.chargeAt+10;k.phase='charge';k.t=0;k.attack(w.mine[0].units[0]);
 k.resolve.mor=U.chargeAt-10;t.command(1);ok(k.phase==='charge'&&k.order==='charge','a charge already under way is not called off');
 // ----- going after weakness: the cavalry's pick and the shooters' focus
 const prey=(right,at,set,noMorale)=>{const v=army([foot(12),foot(12)],right,at);v.b.noMorale=!!noMorale;v.mine[set].resolve.mor=10;const g=v.foe[0];g.phase='flank';g.t=99;t.command(1);return v.mine.findIndex(m=>m.id===aim(g))};
 const kAt=[[400,240],[400,360],[560,300]];ok(prey(knights,kAt,0)===0&&prey(knights,kAt,1)===1,'cavalry pick the wavering one of two otherwise equal groups');
 const bows=[{type:'hum_bow',count:10}],bAt=[[380,240],[380,360],[600,300]];ok(prey(bows,bAt,0)===0&&prey(bows,bAt,1)===1,'archers focus on the wavering one of two otherwise equal groups');
 ok(prey(knights,kAt,0,true)===prey(knights,kAt,1,true)&&prey(bows,bAt,0,true)===prey(bows,bAt,1,true),'with morale off, a wavering foe is no preferred target');
 // ----- morale off: nothing of it
 w=army([foot(20)],[foot(15),foot(15)],[[400,300],[455,280],[455,320]]);[a,s]=w.foe;w.b.noMorale=true;a.resolve.mor=10;s.resolve.mor=80;t.command(1);ok(!a.recover&&a.order==='charge'&&!s.plug,'morale-free battles never pull a group back');
 w=army([foot(20)],knights,[[400,300],[600,300]]);k=w.foe[0];w.b.noMorale=true;k.resolve.mor=5;k.phase='flank';k.t=99;t.command(1);ok(k.phase==='charge'&&k.order==='charge','morale-free battles let shaken cavalry charge');
 // ----- your army under AI command: the same rules
 w=army([foot(15),foot(15)],[foot(20)],[[400,280],[400,320],[455,300]]);w.b.auto=true;[a,s]=w.mine;a.resolve.mor=10;s.resolve.mor=80;const c1=C(a);t.command(1);
 ok(a.recover&&a.order==='hold'&&c1.x-a.ax>=60&&s.hasTarget&&aim(s)===w.foe[0].id,'your army on AI command pulls a wavering group back too, a steady one plugging the gap');
 w=army([foot(15),foot(15)],[foot(20)],[[400,280],[400,320],[455,300]]);[a,s]=w.mine;a.resolve.mor=10;s.resolve.mor=80;t.command(1);ok(!a.recover&&!s.plug,'your army under your own command is never moved by the captain');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
