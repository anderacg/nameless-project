'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
 const home=Kit.goHome('Ashford');Kit.goTo(Math.round(home.x+240),Math.round(home.y+200));P.troops={};P.comps={};P.stay=null;P.tx=P.ty=null;G.chase=null;G.hurry=false;t.SKINS.reset(false);
 P.inv=P.inv.map(()=>null);t.invAdd('good','skin_empty',10);
 const small=t.fillReach();ok(small===t.marchInteractRadius(P)&&t.fillReach(true)===small,'water and wells use exactly the army outer interaction radius');
 const arc=t.ctx.arc,radii=[],ents=[];t.marchCircle(ents,P,{x:0,y:0});try{t.ctx.arc=function(x,y,r,...args){radii.push(r);return arc.call(this,x,y,r,...args)};ents.forEach(e=>e.f())}finally{t.ctx.arc=arc}
 ok(radii[1]===small,'waterskin reach equals the dashed ring actually drawn around the army');
 const ensure=t.WorldArt.ensure,well=window.wellNear,wpx=window.wpx,K=new Uint8Array(t.MW*t.MH);let source;
 const setSource=(x,y)=>{source={x,y};K.fill(0);K[Math.floor(y/t.TILE)*t.MW+Math.floor(x/t.TILE)]=1};
 try{
  t.WorldArt.ensure=()=>({wk:K});window.wellNear=()=>false;window.wpx=(mask,x,y)=>x===source.x&&y===source.y;
  setSource(P.x+Math.floor(small),P.y);ok(t.supplyLand().water,'a drawn shoreline pixel just inside the interaction ring is reachable');
  ok(t.mapRingItems(P.x+20,P.y,null,0,0).some(i=>i.label==='Fill waterskins'),'action menu offers filling within army interaction range');
  t.SKINS.frame(1);ok(!!t.SKINS.on,'automatic timed filling uses the same reachable shoreline');t.SKINS.reset(false);
  setSource(P.x+Math.ceil(small)+1,P.y);ok(!t.supplyLand().water&&!t.mapRingItems(P.x+20,P.y,null,0,0).some(i=>i.label==='Fill waterskins'),'water outside the interaction ring is unavailable in the action menu');
  P.troops={hum_foot:40};const large=t.fillReach();ok(large>small&&large===t.marchInteractRadius(P),'larger armies get the matching larger refill reach');
  setSource(P.x+Math.floor(large),P.y);ok(t.supplyLand().water,'larger army can refill at a source reached by its own interaction ring');P.troops={};ok(!t.supplyLand().water,'shrinking the army also reduces waterskin reach');
  setSource(t.TILE+5,t.TILE+2);ok(t.waterEdge(t.TILE+2,t.TILE+2,large),'an interaction ring extending beyond the map still finds valid interior water');
  setSource(t.TILE-3,t.TILE+2);ok(!t.waterEdge(t.TILE+2,t.TILE+2,large),'off-map edge water cannot be used as a refill source');
 }finally{t.SKINS.reset(false);t.WorldArt.ensure=ensure;window.wellNear=well;window.wpx=wpx}
 const gate=t.wellGate(home),r=t.fillReach(true);ok(t.wellNear(home.x+r-1,home.y)&&t.wellNear(gate.x+r-1,gate.y),'both holding wells and gate access use the same army range');
 const outside=Array.from({length:64},(_,i)=>({x:home.x+Math.cos(i*Math.PI/32)*(r+2),y:home.y+Math.sin(i*Math.PI/32)*(r+2)})).find(p=>t.TOWNS.every(h=>{const g=t.wellGate(h);return Math.hypot(p.x-h.x,p.y-h.y)>r&&Math.hypot(p.x-g.x,p.y-g.y)>r}));
 ok(outside&&!t.wellNear(outside.x,outside.y),'a point outside every well interaction radius cannot refill');
});
