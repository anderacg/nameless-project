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
 }finally{ctx.drawImage=draw;t.tiles[i]=old;P.stay=null;window.eval('B=null')}
});
