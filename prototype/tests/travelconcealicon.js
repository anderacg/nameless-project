'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();P.stay=null;P.camp=null;t.GUIDE.on=false;
 const i=Math.floor(P.y/t.TILE)*t.MW+Math.floor(P.x/t.TILE),old=t.tiles[i],ctx=t.ctx,draw=ctx.drawImage,scale=t.VS;
 try{t.tiles[i]=t.T_OPEN;ok(t.drawTravelConcealment(G.cam)===null,'open ground shows no concealment badge');
  t.tiles[i]=t.T_FOREST;const calls=[];ctx.drawImage=function(...a){calls.push(a);return draw.apply(this,a)};const r=t.drawTravelConcealment(G.cam);
  ok(t.hiddenAt(P.x,P.y)&&r&&calls.some(a=>a[0]===t.TRAVEL_HIDE.s),'forest cover draws the shared concealed-eye badge over your army');
  ok(Math.abs(r.w*t.VS/(devicePixelRatio||1)-14)<.001,'travel badge has a readable fixed screen size');
  const spr=t.TRAVEL_HIDE.s;t.drawTravelConcealment(G.cam);ok(spr===t.TRAVEL_HIDE.s,'badge artwork is cached between frames');
  P.stay={town:'Ashford'};ok(t.drawTravelConcealment(G.cam)===null,'sheltering inside a holding does not show a travel cover badge');P.stay=null;
  window.eval('B={world:{}}');ok(t.drawTravelConcealment(G.cam)===null,'battle mode uses its own concealment indicators');window.eval('B=null');
  t.tiles[i]=t.T_OPEN;ok(t.drawTravelConcealment(G.cam)===null,'leaving forest removes the badge immediately');
  P.tx=null;G.chase=null;G.follow=null;ok(t.drawTravelPace(G.cam)===null,'idle armies show no travel pace badge');
  P.tx=P.x+80;P.ty=P.y;calls.length=0;const walk=t.drawTravelPace(G.cam);
  ok(walk.kind==='walk'&&calls.some(a=>a[0]===t.TRAVEL_PACE.cache.get('walk')),'walking draws the shared battle-card walk badge over your army');
  ok(Math.abs(walk.w*t.VS/(devicePixelRatio||1)-14)<.001,'pace badge matches the fixed screen size of concealment');
  const cached=t.TRAVEL_PACE.cache.get('walk');t.drawTravelPace(G.cam);ok(cached===t.TRAVEL_PACE.cache.get('walk'),'pace artwork is cached between frames');
  t.tiles[i]=t.T_FOREST;const cover=t.drawTravelConcealment(G.cam),pace=t.drawTravelPace(G.cam);ok(pace.x>=cover.x+cover.w&&pace.y===cover.y,'pace and concealment badges in a row without overlapping');
  P.stay={town:'Ashford'};ok(t.drawTravelPace(G.cam)===null,'sheltered armies show no travel pace badge');P.stay=null;
  window.eval('B={world:{}}');ok(t.drawTravelPace(G.cam)===null,'combat keeps its existing pace badges');window.eval('B=null');
  P.tx=null;G.hurry=false;ok(t.drawTravelPace(G.cam)===null,'arriving removes the pace badge');
  // (the owner, 2026-11-08: "the moving icon seems to not smooth attach to the army": the badge put to the screen's own pixel, as the
  // figure under it (snapV), so as your army walks on by fractions of a game px it keeps its place over him, never a game px behind)
  {P.tx=P.x+80;P.ty=P.y;const VS=t.VS,base=P.x,offs=new Set();let fine=true;
   for(let i=0;i<24;i++){P.x=base+i*.13;const e=t.heroTagAt(G.cam);calls.length=0;t.drawTravelPace(G.cam);const c=calls.find(a=>a[0]===t.TRAVEL_PACE.cache.get('walk'));if(!c)continue;
     if(Math.abs(c[1]*VS-Math.round(c[1]*VS))>1e-6)fine=false;offs.add(Math.round((c[1]-e.right)*VS))}
   P.x=base;ok(fine&&offs.size===1,'walking on by fractions of a pixel, the pace badge keeps the same place beside the figure under it, to the screen\'s own pixel (VS '+VS+', offsets '+[...offs].join(',')+')')}
 }finally{ctx.drawImage=draw;t.tiles[i]=old;P.stay=null;window.eval('B=null')}
});
