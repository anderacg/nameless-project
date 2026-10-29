'use strict';
// Bodies (battle/battle.js JOSTLE, the owner 2026-10-29: "each unit not to collide or collapse to each other"): with it on, each
// man keeps his body's room, two of a side the mean of theirs apart (a rider wider), foes face to face a little closer and still
// within reach; settled in passes; on the world map each as much more as he is drawn bigger; off, 8 px as before.
Kit.suite(({ok})=>{const t=T,G=t.G,L=t.BattleLab,J=t.JOSTLE,ev=s=>(0,eval)(s),Gp=(type,count)=>({type,count});
 const lab=(left,right)=>{if(L.active)L.exit();G.mode='world';G.modal=false;L.start({leftGroups:left,rightGroups:right,deploy:false,ai:false,paused:false,morale:false,seed:7});const B=t.B;B.cmdT=1e9;return B};
 const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 t.act('begin','soldier');G.quietEvents=true;
 try{
  ev('JOSTLE.on=true');
  {const B=lab([Gp('hum_foot',2),Gp('hum_knight',1)],[Gp('hum_foot',1)]),[a,b]=B.units.filter(u=>u.type==='hum_foot'&&u.team===0),k=B.units.find(u=>u.type==='hum_knight'),f=B.units.find(u=>u.team===1);
   a.x=400;a.y=300;b.x=401;b.y=300;k.x=400;k.y=330;f.x=900;f.y=300;t.jostle(1/30);ok(Math.abs(gap(a,b)-J.foot)<.6,'two of a side: a body apart ('+gap(a,b).toFixed(1)+' px, was 8)');
   a.x=400;a.y=330.5;t.jostle(1/30);ok(gap(a,k)>=(J.foot+J.mount)/2-.6,'a rider keeps more room ('+gap(a,k).toFixed(1)+' px)');
   a.x=400;a.y=300;f.x=401;f.y=300;b.x=600;k.x=600;t.jostle(1/30);const fd=gap(a,f);ok(fd<J.foot&&fd<=(f.s.reach||11),'foes face to face closer, within reach ('+fd.toFixed(1)+' px)')}
  {const B=lab([Gp('hum_foot',12)],[Gp('orc_grunt',1)]),us=B.units.filter(u=>u.team===0);us.forEach((u,i)=>{u.x=400+(i%4)*.5;u.y=300+Math.floor(i/4)*.5});B.units.find(u=>u.team===1).x=900;
   for(let i=0;i<20;i++)t.jostle(1/30);let close=0;for(const u of us)for(const v of us)if(u!==v&&gap(u,v)<J.foot*.75)close++;ok(close===0,'twelve men piled on one spot: spread apart within 20 frames, none nearer than 3/4 of a body')}
  // ======== on the world map: each drawn WORLD_BATTLE.sprite times as big, so that much room; foes still within reach
  {const B=lab([Gp('hum_foot',2)],[Gp('hum_foot',1)]),[a,b]=B.units.filter(u=>u.team===0),f=B.units.find(u=>u.team===1),k=t.WORLD_BATTLE.sprite;
   ev('B.world={}');try{ok(Math.abs(t.roomOf(a,b)-J.foot*k)<1e-9&&t.roomOf(a,f)<=(f.s.reach||11)&&t.roomOf(a,f)>=8,'on the world map: two of a side '+t.roomOf(a,b)+' px apart (their sprites '+k+'× as big), foes '+t.roomOf(a,f).toFixed(1)+' px (within reach)');ok(t.meleeK()===k,'and every melee distance scaled as much (meleeK '+t.meleeK()+')')}finally{ev('B.world=null')}}
  ev('JOSTLE.on=false');{const B=lab([Gp('hum_foot',2)],[Gp('orc_grunt',1)]),[a,b]=B.units.filter(u=>u.team===0);a.x=400;a.y=300;b.x=401;b.y=300;B.units.find(u=>u.team===1).x=900;t.jostle(1/30);ok(Math.abs(gap(a,b)-8)<.6,'off: 8 px, as before')}
 }finally{if(L.active)L.exit();ev('JOSTLE.on=false')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
