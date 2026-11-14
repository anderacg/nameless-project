'use strict';
// The bridges in detail (gfx/worldart.js BRIDGE_ART; the owner, 2026-11-14: "enhance the bridge to get more detail"): each a
// picture of many more shades than the plain one, a wooden deck's rails and piles past its old edge, a stone one's piers and foam
// on the water; off, as it was.
Kit.suite(({ok,info})=>{
 const t=T,WM=t.WM,WA=t.WorldArt,A=t.BRIDGE_ART;Kit.begin('soldier',1);Kit.clear();Kit.world();
 const pic=c=>{WA.decks.delete(c);const d=WA.deck(c),g=d.cv.getContext('2d').getImageData(0,0,d.cv.width,d.cv.height).data,cols=new Set();for(let i=0;i<g.length;i+=4)if(g[i+3])cols.add(g[i]<<16|g[i+1]<<8|g[i+2]);WA.decks.delete(c);return{cols:cols.size,w:d.cv.width,h:d.cv.height}};
 for(const stone of [false,true]){const c=WM.crossings.find(x=>x.kind==='bridge'&&!!x.stone===stone);if(!c){info('no '+(stone?'stone':'wooden')+' bridge on this world');continue}
  const was=A.on;A.on=false;const old=pic(c);A.on=true;const now=pic(c);A.on=was;
  ok(now.cols>=old.cols+(stone?6:6),(stone?'a stone':'a wooden')+' bridge in many more shades ('+old.cols+' → '+now.cols+')');
  ok(Math.max(now.w,now.h)>=Math.max(old.w,old.h)&&Math.min(now.w,now.h)>=Math.min(old.w,old.h),'its picture reaches as far as before, '+(stone?'its piers and foam':'its rails and piles')+' past the deck ('+old.w+'×'+old.h+' → '+now.w+'×'+now.h+')')}
 ok(A.on,'on in the game');
});
