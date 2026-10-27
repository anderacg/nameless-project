'use strict';
// Cavalry chased (commander.js CavalryRide): a slower pursuer is outrun (galloping, a real gap) and charged only from a run-up;
// one as fast is met, not stood for. The pursuers are yours, sent at the riders and kept on them; the riders are the enemy AI's.
Kit.suite(({ok,info})=>{
 const SEED=+(new URLSearchParams(location.search).get('cs')||7),t=T,L=t.BattleLab,X=t.CAVALRY_RIDE;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.PHYSICS.on=true;t.TERRAIN.on=true;t.FOG.on=false;t.COMMAND_POWERS.on=false;
 const chase=(type,count,secs)=>{
  L.start({leftGroups:[{type,count}],rightGroups:[{type:'hum_knight',count:6}],deploy:false,ai:false,paused:false,morale:false,ground:{recipe:'open',seed:7},seed:SEED});
  const b=t.B,cav=Object.values(b.groups).find(g=>g.foe),mine=Object.values(b.groups).filter(g=>g.player);for(const u of b.units)u.s={...u.s,dmg:u.team?1:.3};
  const out={charges:[],recovers:[],gallop:[],brawl:0,longest:0,exits:0};let last=null;
  const gap=()=>{const C=cav.centre();return Math.min(...b.units.filter(u=>!u.team&&u.hp>0&&!u.rout).map(u=>Math.hypot(u.x-C.x,u.y-C.y)))};
  for(let i=0;i<secs*30&&!b.over;i++){
   for(const g of mine)if(g.targetGroupId!==cav.id)g.attack(cav.units.find(u=>u.hp>0));
   t.updateBattle(1/30);const p=cav.ridePlan,ph=p?.phase;
   if(ph!==last){if(ph==='charge')out.charges.push(Math.round(p.runup));if(ph==='recover')out.recovers.push(Math.round(gap()));if(ph==='exit')out.exits++;last=ph}
   if(ph==='exit'&&p.chased){const m=cav.units.filter(u=>u.hp>0&&t.staOf(u)>=t.FATIGUE.tired);if(m.length)out.gallop.push(m.reduce((n,u)=>n+u.vel/(u.s.spd*t.tiredMul(u).spd),0)/m.length)}
   const close=gap()<X.contact;if(!p&&close){out.brawl+=1/30;out.longest=Math.max(out.longest,out.brawl)}else out.brawl=0;
   if(i%150===0)t.frame()}
  out.gallop=out.gallop.length?out.gallop.reduce((a,v)=>a+v,0)/out.gallop.length:0;L.exit();return out};
 const slow=chase('hum_levy',12,60);info('levy chase: charges '+slow.charges.join(',')+'; recovered at '+slow.recovers.join(',')+'; gallop '+slow.gallop.toFixed(2)+'; longest brawl '+slow.longest.toFixed(1)+' s');
 ok(slow.charges.length>=2,'cavalry chased by infantry keeps charging again');
 ok(slow.charges.length&&slow.charges.every(d=>d>=X.runMin),'every charge on a slower pursuer starts from a run-up of '+X.runMin+' px at least');
 ok(slow.recovers.length>=2&&slow.recovers.every(d=>d>=X.runMin)&&slow.recovers.some(d=>d>=X.clear),'riders recover only once a real gap opens on their pursuers');
 ok(slow.gallop>.7,'chased riders gallop out (at '+Math.round(slow.gallop*100)+'% of their speed)');
 ok(slow.longest<3,'chased riders never stand in a brawl with slower foot');
 const fast=chase('hum_squire',6,45);info('squire chase: charges '+fast.charges.join(',')+'; recovered at '+fast.recovers.join(',')+'; exits '+fast.exits+'; longest brawl '+fast.longest.toFixed(1)+' s');
 ok(fast.charges.length>=2&&fast.exits>=2,'cavalry chased by cavalry as fast turns and meets them, again and again');
 ok(fast.longest<3,'riders met by riders as fast do not stand still in a long brawl');
 ok(!ERR.length,'cavalry chases have no runtime errors');
});
