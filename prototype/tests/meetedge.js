'use strict';
// Meeting and following another army at its edge (world/march.js marchMeetAt, MARCH_MOVE.meetEdge; world.js approach, followStep;
// the owner, 2026-11-02: "I interact with other army, like meet, follow, it'll focus on the center"): your goal is his nearest man,
// not his middle; following, you keep FOLLOW.trail tiles behind his ring, never among his men; off, his middle, as before.
Kit.suite(({ok,info})=>{const t=T,P=t.P,G=t.G,W=t.W,M=t.MARCH_MOVE;
 const set=()=>{Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});t.WORLD_BATTLE.on=true;t.GUIDE.on=false;G.mode='world';G.paused=false;
  const h=t.townBy('Ashford');Kit.goTo(h.x+260,h.y+220);P.troops={hum_foot:12};P.comps={};P.bsta=100;t.MARCH_ARMIES.delete(P);
  const L=W.lords.find(l=>!l.dead&&!t.hostileTo(l.fac))||W.lords.find(l=>!l.dead);Object.assign(L,{inside:null,x:P.x+170,y:P.y,state:'rest',tgt:'Ashford',fight:null});L.troops=Array(30).fill('hum_foot');t.MARCH_ARMIES.delete(L);
  for(let i=0;i<60;i++)t.updateWorld(1/30);return L};
 const men=o=>{const a=t.MARCH_ARMIES.get(o),dx=o.x-a.x,dy=o.y-a.y;return a.units.filter(u=>!u.dead).map(u=>({x:u.x+dx,y:u.y+dy}))};
 {const L=set(),inter=window.interact;window.interact=()=>true;try{t.approach(L);const near=men(L).reduce((b,u)=>Math.hypot(u.x-P.x,u.y-P.y)<Math.hypot(b.x-P.x,b.y-P.y)?u:b);
   ok(G.chase===L&&Math.hypot(P.tx-near.x,P.ty-near.y)<.5&&Math.hypot(P.tx-L.x,P.ty-L.y)>8,'meeting a lord: your goal his nearest man ('+Math.round(Math.hypot(P.tx-L.x,P.ty-L.y))+' px off his middle), not his middle');
   M.meetEdge=false;try{t.approach(L);ok(P.tx===L.x&&P.ty===L.y,'meetEdge off: his middle, as before')}finally{M.meetEdge=true}}finally{window.interact=inter;G.chase=null;P.tx=null}}
 {const L=set();Object.assign(L,{state:'march'});const goal={x:L.x+400,y:L.y};L.tx=goal.x;L.ty=goal.y;
  ok(t.followStart(L),'(following him)');let into=0,close=1e9;
  for(let i=0;i<30*15;i++){L.x+=.6;t.updateWorld(1/30);if(i>60){const a=men(P),b=men(L);for(const u of a)for(const v of b){const d=Math.hypot(u.x-v.x,u.y-v.y);if(d<close)close=d;if(d<3)into++}}}
  t.followStop();ok(close>4,'following him: your men keep behind his ring, never among his ('+close.toFixed(1)+' px between the nearest two)')}
});
