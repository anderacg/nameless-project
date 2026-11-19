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
 // ---- the ferries in detail (FERRY_ART; the owner, 2026-11-15: "what is that wooden with the line things ... Give it more detail"):
 // landings on piles with a tie post, the rope from post to post with its shadow, a log raft clear of its landing; off, as it was
 {const F=t.FERRY_ART,fs=WM.crossings.filter(x=>x.kind==='ferry');
  const paint=c=>{const cols=new Set(),px=new Map();t.artGenXing({},(col,x,y,w,h)=>{cols.add(col);for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)px.set(i+','+j,col)},c);return{cols,px}};
  if(!fs.length)info('no ferry on this world');
  for(const c of fs.slice(0,3)){const was=F.on;F.on=false;const old=paint(c);F.on=true;const now=paint(c);F.on=was;const ax=c.i%t.MW,ay=c.i/t.MW|0,bx=c.j%t.MW,by=c.j/t.MW|0,hor=ay===by;
   ok(now.cols.size>=old.cols.size+8,'a ferry ('+(hor?'east-west':'north-south')+') in many more shades ('+old.cols.size+' → '+now.cols.size+')');
   const rope=[...now.px].filter(([,col])=>F.rope.includes(col)).length,span=(hor?Math.abs(ax-bx):Math.abs(ay-by))*t.TILE;
   ok(rope>=span-t.TILE-F.len*2-F.raft[0]&&[...now.px.values()].includes(F.ropeShade),'its rope from post to post, its shadow below ('+rope+' px over a '+span+' px crossing)');
   const posts=[...now.px].filter(([,col])=>col===F.post[0]).length;ok(posts>=8,'piles and tie posts, lit on top ('+posts+')')}}
});
