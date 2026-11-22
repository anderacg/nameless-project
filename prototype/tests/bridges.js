'use strict';
// Bridge artwork uses worldways.js bridgePic. WorldArt.deck is a monochrome clearance mask, not its visible art.
Kit.suite(({ok,info})=>{
 const t=T,WA=t.WorldArt,WM=t.WM,B=t.waysOf(WA.ensure()).bridges;
 const pic=b=>{const d=t.bridgePic(b,t.sceneRes()),g=d.cv.getContext('2d').getImageData(0,0,d.cv.width,d.cv.height).data,cols=new Set();let clear=0,ink=0,hash=2166136261;
  for(let i=0;i<g.length;i+=4){if(g[i+3]){ink++;cols.add(g[i]<<16|g[i+1]<<8|g[i+2])}else clear++;for(let j=0;j<4;j++)hash=Math.imul(hash^g[i+j],16777619)>>>0}
  return{cols:cols.size,clear,ink,hash,w:d.cv.width,h:d.cv.height}};
 for(const stone of [false,true]){const b=B.find(x=>!x.small&&!!x.stone===stone);if(!b){info('no '+(stone?'stone':'wooden')+' bridge on this world');continue}
  const now=pic(b),again=pic(b);
  ok(now.cols>=12,(stone?'a stone':'a wooden')+' bridge has shaded visible artwork ('+now.cols+' colours)');
  ok(now.ink>0&&now.clear>0&&now.w>1&&now.h>1&&now.hash===again.hash,'its picture has transparent space around the bridge and redraws identically ('+now.w+'×'+now.h+')')}
 // Ferry artwork is always enabled: landings, tie posts, rope and its shadow, and a log raft.
 {const F=t.FERRY_ART,fs=WM.crossings.filter(x=>x.kind==='ferry');
  const paint=c=>{const cols=new Set(),px=new Map();t.artGenXing({},(col,x,y,w,h)=>{cols.add(col);for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)px.set(i+','+j,col)},c);return{cols,px}};
  if(!fs.length)info('no ferry on this world');
  for(const c of fs.slice(0,3)){const now=paint(c);const ax=c.i%t.MW,ay=c.i/t.MW|0,bx=c.j%t.MW,by=c.j/t.MW|0,hor=ay===by;
   ok(now.cols.size>=16,'a ferry ('+(hor?'east-west':'north-south')+') has detailed coloured artwork ('+now.cols.size+' shades)');
   const rope=[...now.px].filter(([,col])=>F.rope.includes(col)).length,span=(hor?Math.abs(ax-bx):Math.abs(ay-by))*t.TILE;
   ok(rope>=span-t.TILE-F.len*2-F.raft[0]&&[...now.px.values()].includes(F.ropeShade),'its rope from post to post, its shadow below ('+rope+' px over a '+span+' px crossing)');
   const posts=[...now.px].filter(([,col])=>col===F.post[0]).length;ok(posts>=8,'piles and tie posts, lit on top ('+posts+')')}}
});
