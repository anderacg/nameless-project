'use strict';
// Another army seen by its nearest man (worldobject.js spotted, manSpotted; march.js marchDraw; the owner, 2026-11-01: "a huge army
// roaming around but suddenly disappear even with in just few feet away. and even weird when in the forest"): in sight while any
// of its men is, each by his own ground (a wood's nearer sight at his own feet); drawn only those men; SIGHT_EYES.armies off: by
// its middle alone, as before.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});t.WORLD_BATTLE.on=true;t.GUIDE.on=false;G.mode='world';
 const h=t.townBy('Ashford');Kit.goTo(h.x+240,h.y+200);P.troops={};P.comps={};
 const L=W.lords.find(l=>!l.dead);Object.assign(L,{inside:null,state:'patrol',troops:Array(30).fill('hum_foot')});t.MARCH_ARMIES.delete(L);
 const V=t.vis(),far=V+60;L.x=P.x+far;L.y=P.y;const A=t.MarchArmy.of(L);for(let i=0;i<30;i++)A.step(1/30);L.x=P.x+far;L.y=P.y;A.x=L.x;A.y=L.y;
 const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE),keep=new Map(),paint=(x,y,k)=>{const i=Math.floor(y/t.TILE)*t.MW+Math.floor(x/t.TILE);if(!keep.has(i))keep.set(i,t.tiles[i]);t.tiles[i]=k};
 try{
  for(let y=ty-30;y<=ty+30;y++)for(let x=tx-30;x<=tx+40;x++)if(t.WM.has(x,y))paint((x+.5)*t.TILE,(y+.5)*t.TILE,t.T_OPEN);
  A.units.forEach(u=>{u.x=L.x+20;u.y=L.y});const van=A.units[0];van.x=P.x+V*.5;van.y=P.y;
  ok(!t.yourSight(V).sees(L.x,L.y),'(fixture: his middle '+Math.round(far)+' px off, past your sight '+Math.round(V)+')');
  ok(t.spotted(L,V)&&L.inView(V),'his van a few steps off: the army is seen, though its middle is not');
  const ents=[];t.marchDraw(ents,L,G.cam);const men=ents.filter(e=>e.own===false).length;ok(men===1,'only the man in your sight drawn ('+men+' of '+A.units.length+')');
  const E=t.SIGHT_EYES;E.armies=false;try{ok(!t.spotted(L,V),'armies off: by its middle alone, as before (unseen)')}finally{E.armies=true}
  // (in a wood: seen nearer, at his own feet)
  van.x=P.x+V*.7;paint(van.x,van.y,t.T_FOREST);ok(!t.spotted(L,V),'his van in a wood at 70% of your sight: hidden (a wood\u2019s nearer sight, at his feet)');
  van.x=P.x+V*.3;paint(van.x,van.y,t.T_FOREST);ok(t.spotted(L,V),'nearer, at 30%: seen');
 }finally{for(const [i,k] of keep)t.tiles[i]=k}
});
