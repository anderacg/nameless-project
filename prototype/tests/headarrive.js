'use strict';
// Arrived with your army's head on your goal, its formation complete (world/march.js marchAim, marchArrived, MARCH_MOVE.headArrive;
// the owner, 2026-11-01: "in order the guide to consider to be counted as arrived, only the head should be enough but only when the
// formation is completed"): a march formation sent 200 px stops with its foremost man on the spot and every man in his place, the
// order then over; off, as before: its middle on the spot.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,M=t.MARCH_MOVE;Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});t.WORLD_BATTLE.on=true;t.GUIDE.on=false;G.mode='world';
 const h=t.townBy('Ashford');
 const go=()=>{Kit.goTo(h.x+240,h.y+200);P.troops={hum_foot:20,hum_bow:10};P.comps={};P.bsta=100;P.byRoad=false;G.byRoad=null;delete P.army.march;t.MARCH_ARMIES.delete(P);
  const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-20;y<=ty+20;y++)for(let x=tx-10;x<=tx+30;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;t.WM.kind[i]=t.T_OPEN;t.WM.edge[i]=0;t.tiles[i]=t.T_OPEN}
  for(let i=0;i<90;i++)t.updateWorld(1/30);const gx=P.x+200,gy=P.y;P.tx=gx;P.ty=gy;let i=0;for(;i<30*40&&P.tx!=null;i++)t.updateWorld(1/30);
  const a=t.MARCH_ARMIES.get(P),men=a.units.filter(u=>!u.dead),head=Math.max(...men.map(u=>u.x)),placed=men.every(u=>!u.goal||Math.hypot(u.x-u.goal.x,u.y-u.goal.y)<=t.TRAVEL_STYLES.column.place);
  return{done:P.tx==null,t:i/30,head:head-gx,mid:P.x-gx,placed,col:!!a.col}};
 const r=go();info('head '+r.head.toFixed(1)+' px from the goal, middle '+r.mid.toFixed(1)+', '+r.t.toFixed(1)+' s'+(r.col?' (a column)':''));
 ok(r.done&&Math.abs(r.head)<=6&&r.mid<-4&&r.placed,'arrived with its head on the goal ('+r.head.toFixed(1)+' px), its middle behind it ('+r.mid.toFixed(1)+'), every man in his place');
 M.headArrive=false;let o;try{o=go()}finally{M.headArrive=true}
 ok(o.done&&Math.abs(o.mid)<=3&&o.head>4,'headArrive off, as before: its middle on the goal ('+o.mid.toFixed(1)+' px), its head past it ('+o.head.toFixed(1)+')');
});
