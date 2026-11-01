'use strict';
// Footing (world/march.js MARCH_MOVE.footing): an army's point and guide stand on ground a man could stand on.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P;
 // (the owner, 2026-11-01: "my army get stuck when the unit try to form a formation near blocking or water") an army's point is its
 // men's middle, so with men on both banks of a river it fell on the water, its guide with it, and your way on the map, starting
 // there, found none: every order dropped. MARCH_MOVE.footing keeps both on the nearest standing ground. Millbrook's bridge (the
 // generated world's, as in the owner's picture): your army put on the river beside it, then sent to the far bank
 {const go=(sx,sy,tx,ty)=>{Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});t.WORLD_BATTLE.on=true;t.GUIDE.on=false;const wet=!t.passable(t.terrAt(sx,sy));Kit.goTo(sx,sy);P.troops={hum_foot:30,hum_bow:20};P.comps={};P.bsta=100;
   delete P.army.march;t.MARCH_ARMIES.delete(P);for(let i=0;i<60;i++)t.updateWorld(1/30);const a=t.MarchArmy.of(P);let dry=true;P.tx=tx;P.ty=ty;
   for(let i=0;i<30*60&&P.tx!=null;i++){t.updateWorld(1/30);dry&&=t.passable(t.terrAt(P.x,P.y))&&t.passable(t.terrAt(a.gx,a.gy))}return{wet,left:P.tx==null?Math.max(0,t.marchNear(tx,ty)):Math.hypot(P.x-tx,P.y-ty),dry}};// (arrived: its nearest man's way off the goal, its head there: marchAim)
  const m=t.TOWNS.find(z=>z.name==='Millbrook');
  if(!m)info('no Millbrook in this world: skipped');else for(const [sx,sy] of [[1870,1300],[1850,1310]]){const r=go(sx,sy,1769,1272);
   ok(r.wet&&r.left<10&&r.dry,'your army put on the river at '+sx+','+sy+' by the bridge at Millbrook: its point and guide on dry ground, it crosses ('+Math.round(r.left)+' px short)')}
   if(m){const M=t.MARCH_MOVE;M.footing=false;let r;try{r=go(1870,1300,1769,1272)}finally{M.footing=true}ok(r.left>50,'footing off (as before): that army stands on the river, its order dropped ('+Math.round(r.left)+' px short)')}}
});
