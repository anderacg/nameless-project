'use strict';
// Obstacle deadlock: soldiers moving straight at a tree's centre (the push-out exactly against their motion) must get round it.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,L=t.BattleLab;
 try{
  // a lab battle: the left side stacked on one spot, a lone tree dead ahead on its line; the right side far off and harmless
  const fixture=(left,{x=300,tx=220,keep=0}={})=>{if(L.active)L.exit();
   L.start({leftGroups:[{type:'hum_foot',count:left}].concat(keep?[{type:'hum_foot',count:keep}]:[]),rightGroups:[{type:'hum_foot',count:2}],morale:true,deploy:false,paused:true,ai:false,seed:44});
   const b=t.B,y=Math.round((t.fieldTop()+t.fieldBot())/2),mine0=b.units.filter(u=>u.team===0),g=b.groups[mine0[0].grp],mine=mine0.filter(u=>u.grp===g.id),rest=mine0.filter(u=>u.grp!==g.id),foes=b.units.filter(u=>u.team===1);
   b.obs=[{kind:'tree',x:tx,y,r:6}];mine.forEach(u=>{u.x=x;u.y=y;u.sta=100});rest.forEach(u=>{u.x=t.BW/2;u.y=t.fieldTop()+20});
   foes.forEach((u,i)=>{u.x=t.BW-30;u.y=y+(i?60:-60);u.cd=99;u.hp=u.max=9999;u.s={...u.s,spd:0}});
   return {b,y,mine,g,tree:b.obs[0]}};
  const run=(f,frames,done)=>{for(let i=0;i<frames&&!done()&&t.B===f.b;i+=200)L.step(200)};
  const where=f=>f.mine.map(u=>Math.round(u.x)+','+Math.round(u.y)).join(' ');
  const inside=(f,u)=>Math.hypot(u.x-f.tree.x,u.y-f.tree.y)<f.tree.r+3-.01;

  // withdrawing: six stacked men straight back at a tree on their line
  let f=fixture(6);ok(f.mine.every(u=>u.y===f.tree.y),'withdraw fixture: the tree centre lies exactly on the line back');f.g.withdraw();
  run(f,2000,()=>f.mine.every(u=>u.left));
  ok(f.mine.every(u=>u.left&&u.hpLeft>0),'withdrawing men stacked on a tree centre get round it and leave the field (at '+where(f)+')');

  // routing: the same stack broken, running for its edge through the tree (another group of yours stands, so the battle runs on)
  f=fixture(6,{keep:2});t.rout(f.mine[0]);ok(f.mine.every(u=>u.rout),'rout fixture: the stack is routing');
  // (far from any foe they may rally once clear of it: what is under test is that they get past the tree while running)
  const past=new Set();for(let i=0;i<1200&&past.size<f.mine.length&&t.B===f.b;i+=20){L.step(20);f.mine.forEach(u=>{if(u.left||u.rout&&u.x<f.tree.x-f.tree.r-3)past.add(u)})}
  ok(past.size===f.mine.length,'routing men stacked on a tree centre get round it and run on for their edge ('+past.size+' of '+f.mine.length+' past it, at '+where(f)+')');

  // a move order: one man marching straight through a tree centre to a point beyond it
  f=fixture(1,{x:400,tx:300});const u=f.mine[0];f.g.moveTo(200,f.y);
  run(f,2400,()=>Math.hypot(u.x-200,u.y-f.y)<=t.RELOCATE.near);
  ok(Math.hypot(u.x-200,u.y-f.y)<=t.RELOCATE.near+1,'a man marching straight at a tree centre goes round it and reaches his place (at '+where(f)+')');
  ok(!inside(f,u),'and he is never left inside the tree');

  // a march of the stack: a column ordered through the tree
  f=fixture(6,{x:400,tx:300});f.g.moveTo(200,f.y);run(f,1200,()=>false);
  ok(f.mine.every(u=>u.x<300),'a stacked group marching at a tree centre ends up past it (at '+where(f)+')');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
