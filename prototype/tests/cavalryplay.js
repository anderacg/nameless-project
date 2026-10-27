'use strict';
// (footmen: no wall, so the riders' cycle is ridden straight in; a spear line facing them is stood off: tests/cavalryhard)
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,L=t.BattleLab;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.PHYSICS.on=true;t.TERRAIN.on=true;t.FOG.on=false;t.COMMAND_POWERS.on=true;
 L.start({leftGroups:[{type:'hum_knight',count:6}],rightGroups:[{type:'hum_foot',count:12}],deploy:false,ai:true,paused:false,morale:false,ground:{recipe:'open',seed:7},seed:7});const b=t.B,g=Object.values(b.groups).find(g=>g.player),enemy=Object.values(b.groups).find(g=>g.foe);for(const u of enemy.units){u.s={...u.s,spd:0,dmg:0};u.cd=999}for(const u of g.units)u.s={...u.s,dmg:1};const phases=new Set(),origin=g.centre();let turns=0,last=null,charges=0;
 for(let i=0;i<3000&&!b.over;i++){t.updateBattle(1/30);const phase=g.ridePlan?.phase;if(phase){phases.add(phase);if(phase==='charge'&&last!=='charge')charges++;last=phase}if(g.units.some(u=>Math.abs(u.trn||0)>.2&&u.vel>10))turns++;if(i%120===0)t.frame();if(charges>=2&&phases.has('recover'))break}
 info('phases '+[...phases].join(',')+'; charges '+charges);ok(phases.has('charge')&&phases.has('exit')&&phases.has('recover'),'the real commander completes a charge, exit and recovery cycle (footmen: straight in, no way round)');ok(charges>=2,'rested cavalry lines up and charges again');ok(turns>0&&Math.hypot(g.centre().x-origin.x,g.centre().y-origin.y)>30,'turning changes actual mounted travel rather than just the visual pose');ok(b.units.every(u=>u.hp<=0||!b.terrain.solid[t.tIx(b.terrain,u.x,u.y)]),'terrain collision keeps mounted loops out of blocked ground');
 t.setAuto(false,true);g.moveTo(250,250);const order=g.order;for(let i=0;i<20&&!b.over;i++)t.updateBattle(1/30);ok(g.order===order&&!g.hasTarget,'manual movement is not replaced by an automatic cavalry charge');// (a lone hero, standing: they ride at him in one rush, never checking on the way: none below 70% of top speed once at it, till
 // the blow lands)
 L.exit();L.start({leftGroups:[{type:'hero',count:1}],rightGroups:[{type:'hum_knight',count:6}],deploy:false,ai:false,paused:false,morale:false,ground:{recipe:'open',seed:7},seed:7});
 {const b=t.B,cav=Object.values(b.groups).find(g=>g.foe),h=b.hero;h.hp=h.max=1e6;h.s={...h.s,spd:0};let top=0,low=Infinity,hit=false;
  for(let i=0;i<30*8&&!hit;i++){t.updateBattle(1/30);const m=cav.units.filter(u=>u.hp>0),v=m.reduce((a,u)=>a+(u.vel||0),0)/m.length,C=t.centroid(m);hit=Math.hypot(h.x-C.x,h.y-C.y)<40;top=Math.max(top,v);if(top>=m[0].s.spd*.9&&!hit)low=Math.min(low,v)}
  ok(hit&&low>=top*.7,'riders rush a lone hero in one run, no stop and start ('+Math.round(low)+' of '+Math.round(top)+' px/s at the slowest)')}
 ok(!ERR.length,'production cavalry combat has no runtime errors');
});
