'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();P.stay=null;P.camp=null;t.GUIDE.on=false;
 const i=Math.floor(P.y/t.TILE)*t.MW+Math.floor(P.x/t.TILE),old=t.tiles[i],ctx=t.ctx,draw=ctx.drawImage,scale=t.VS;
 try{t.tiles[i]=t.T_OPEN;ok(t.drawTravelConcealment(G.cam)===null,'open ground shows no concealment badge');
  t.tiles[i]=t.T_FOREST;const calls=[];ctx.drawImage=function(...a){calls.push(a);return draw.apply(this,a)};const r=t.drawTravelConcealment(G.cam);
  ok(t.hiddenAt(P.x,P.y)&&r&&calls.some(a=>a[0]===t.TRAVEL_HIDE.s),'forest cover draws the shared concealed-eye badge beside the army banner');
  ok(Math.abs(r.w*t.VS/(devicePixelRatio||1)-14)<.001,'travel badge has a readable fixed screen size');
  const spr=t.TRAVEL_HIDE.s;t.drawTravelConcealment(G.cam);ok(spr===t.TRAVEL_HIDE.s,'badge artwork is cached between frames');
  P.stay={town:'Ashford'};ok(t.drawTravelConcealment(G.cam)===null,'sheltering inside a holding does not show a travel cover badge');P.stay=null;
  window.eval('B={world:{}}');ok(t.drawTravelConcealment(G.cam)===null,'battle mode uses its own concealment indicators');window.eval('B=null');
  t.tiles[i]=t.T_OPEN;ok(t.drawTravelConcealment(G.cam)===null,'leaving forest removes the badge immediately');
  P.tx=null;G.chase=null;G.follow=null;ok(t.drawTravelPace(G.cam)===null,'idle armies show no travel pace badge');
  P.tx=P.x+80;P.ty=P.y;G.hurry=false;calls.length=0;const walk=t.drawTravelPace(G.cam);
  ok(walk.kind==='walk'&&calls.some(a=>a[0]===t.TRAVEL_PACE.cache.get('walk')),'walking draws the shared battle-card walk badge beside the banner');
  ok(Math.abs(walk.w*t.VS/(devicePixelRatio||1)-14)<.001,'pace badge matches the fixed screen size of concealment');
  G.hurry=true;calls.length=0;const run=t.drawTravelPace(G.cam);ok(run.kind==='run'&&calls.some(a=>a[0]===t.TRAVEL_PACE.cache.get('run'))&&t.TRAVEL_PACE.cache.get('run')!==t.TRAVEL_PACE.cache.get('walk'),'Hurry switches to the shared battle-card run badge');
  const cached=t.TRAVEL_PACE.cache.get('run');t.drawTravelPace(G.cam);ok(cached===t.TRAVEL_PACE.cache.get('run'),'pace artwork is cached between frames');
  t.tiles[i]=t.T_FOREST;const cover=t.drawTravelConcealment(G.cam),pace=t.drawTravelPace(G.cam);ok(pace.y>=cover.y+cover.h,'pace and concealment badges stack without overlapping');
  P.stay={town:'Ashford'};ok(t.drawTravelPace(G.cam)===null,'sheltered armies show no travel pace badge');P.stay=null;
  window.eval('B={world:{}}');ok(t.drawTravelPace(G.cam)===null,'combat keeps its existing pace badges');window.eval('B=null');
  P.tx=null;G.hurry=false;ok(t.drawTravelPace(G.cam)===null,'arriving removes the pace badge');
 }finally{ctx.drawImage=draw;t.tiles[i]=old;P.stay=null;window.eval('B=null')}
});
