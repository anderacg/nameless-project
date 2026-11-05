'use strict';
// Beasts far from the holdings and off their land (the owner, 2026-11-05: "monsters should spawn far away from holdings. And they
// tend to avoid holding territories"): every beast a new game lairs lies WORLD_SCALE.spawn.monsterHold px from every holding (half
// that at the last tries), and so do those that come in the days after; a beast never steps from the wilds onto a holding's land,
// wandering or hunting you there (it turns for its lair at the border); one on such land walks off it.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,H=t.WORLD_SCALE.spawn.monsterHold,mon=()=>W.monsters.filter(m=>!t.MONSTERS[m.id].mythic);
 Kit.begin('soldier',1);Kit.world();
 const near=m=>Math.min(...t.TOWNS.map(h=>Math.hypot(h.x-m.x,h.y-m.y)));
 {const L=mon(),d=L.map(near),close=d.filter(v=>v<H*.5).length;ok(L.length>10&&!close,L.length+' beasts at the start, each '+Math.round(H*.5)+' px at least from every holding (nearest '+Math.round(Math.min(...d))+', median '+Math.round(d.sort((a,b)=>a-b)[d.length>>1])+'; '+H+' px wanted, half that at the last tries)')}
 {const n0=W.monsters.length;for(let i=0;i<20;i++)t.spawnMonster(false);const L=W.monsters.slice(n0);ok(L.length>10&&L.every(m=>near(m)>=H*.5),'and those that come later ('+L.length+')')}
 // (one at the border of a holding's land, drawn in: it stays out, wandering and hunting)
 {const h=t.TOWNS.find(z=>z.owner),m=W.monsters.find(x=>!t.MONSTERS[x.id].mythic);let edge=null;
  for(let r=2;r<60&&!edge;r++)for(let a=0;a<16&&!edge;a++){const x=h.x+Math.cos(a*Math.PI/8)*r*t.TILE,y=h.y+Math.sin(a*Math.PI/8)*r*t.TILE,x2=h.x+Math.cos(a*Math.PI/8)*(r+1)*t.TILE,y2=h.y+Math.sin(a*Math.PI/8)*(r+1)*t.TILE;
   if(t.landHold(x,y)&&!t.landHold(x2,y2)&&t.passable(t.terrAt(x2,y2)))edge=[x2,y2,x,y]}
  Object.assign(m,{x:edge[0],y:edge[1],hx:edge[0],hy:edge[1],cool:0,t:0,a:Math.atan2(edge[3]-edge[1],edge[2]-edge[0])});let inLand=0;
  P.x=-9999;P.y=-9999;for(let i=0;i<400;i++){t.BEAST_MIND.think(m,.05,1);if(t.landHold(m.x,m.y))inLand++}
  ok(!inLand,'wandering at the border of '+h.name+'’s land: it never steps on it');
  Object.assign(m,{x:edge[0],y:edge[1]});P.x=edge[2];P.y=edge[3];P.troops={};for(let i=0;i<200;i++){t.BEAST_MIND.think(m,.05,0);if(t.landHold(m.x,m.y))inLand++}
  ok(!inLand,'nor hunting you there: it stops at its edge');
  Object.assign(m,{x:edge[2],y:edge[3],hx:edge[0],hy:edge[1]});P.x=-9999;P.y=-9999;const x0=m.x,y0=m.y;for(let i=0;i<400;i++)t.BEAST_MIND.think(m,.05,1);
  ok(Math.hypot(m.x-x0,m.y-y0)>4,'one on the land already walks off it as it will')}
});
