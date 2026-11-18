'use strict';
// A man's move over the land's real edges, by their height and at them (the owner, 2026-11-18, a phone screenshot of his hero wading a
// road's ford: "The jumping and animations should be based on the height right? If the water is high then when crawling onto the shore
// may need animation. But if the water is at foot level then there no need to jump down or anything", "the distance to play animation
// should be close to edge or areas"; world/march.js marchAct, marchFace, MARCH_ACT): on the world as painted, a man walked across a road's
// fords, across rivers' banks into the water and out, and over the land's ledges; a ford walked with no hop, jump, pull up or crawl;
// every move begun at its face, by its height; the water up a man eased by its depth as he wades in.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,WA=t.WorldArt,TILE=t.TILE,CH=t.CHUNK,J=t.MARCH_ACT,K=t.WM.kind,WD=t.waterDepths(t.WM);
 Kit.begin('soldier',1);Kit.clear(['critters']);Kit.world();G.mode='world';G.modal=false;
 const warm=(x,y)=>{Kit.goTo(x,y);for(let i=0;i<80;i++){t.drawWorld();WA.step(60)}};
 // (a man walked from (x0, y0) to (x1, y1), half a px a frame: each move he made, its kind, its height, how far ahead of him its face
 // lay as he began it, how far he had walked (one set off at a face cannot see it coming), whether met in a move and on a graded way)
 const cross=(x0,y0,x1,y1)=>{const L=Math.hypot(x1-x0,y1-y0),hx=(x1-x0)/L,hy=(y1-y0)/L,u={type:'spearman',x:x0,y:y0,id:7,walking:true},got=[];
  for(let s=0;s<=L;s+=.5){u.x=x0+hx*s;u.y=y0+hy*s;const had=u._act;t.marchAct(u);if(u._act&&u._act!==had){const f=t.marchFace(u.x,u.y,hx,hy);got.push({k:u._act.k,h:f?f.h:u._act.h,a:f?f.a:null,s,on:!!had,gr:t.marchGraded(u.x,u.y)||!!f&&t.marchGraded(u.x+hx*f.end,u.y+hy*f.end)})}}
  return got};
 const kinds=a=>a.map(g=>g.k+' '+g.h.toFixed(1)).join(', ')||'none';
 // ---- a road's fords: walked through, no hop, jump, pull up or crawl (at most a step down off the bank and up again)
 {const F=(t.WM.crossings||[]).filter(c=>c.kind==='ford');let n=0,bad=[],seen=[];const out=[];
  for(const c of F){if(n>=4)break;const ax=(c.i%t.MW+.5)*TILE,ay=(Math.floor(c.i/t.MW)+.5)*TILE,bx=(c.j%t.MW+.5)*TILE,by=(Math.floor(c.j/t.MW)+.5)*TILE;
   if(seen.some(([x,y])=>Math.hypot(x-ax,y-ay)<CH*2))continue;seen.push([ax,ay]);warm((ax+bx)/2,(ay+by)/2);
   const g=cross(ax,ay,bx,by).concat(cross(bx,by,ax,ay));n++;out.push(kinds(g));for(const m of g)if(m.k!=='step'&&m.k!=='stepup')bad.push(m.k+' '+m.h.toFixed(1))}
  if(!n)info('no ford on this world');else ok(!bad.length,'across '+n+' fords and back: no hop, jump, pull up or crawl ('+out.join(' | ')+')')}
 // ---- rivers' banks: into the water and out, a man's moves begun at the bank's face, by its height
 {const Rv=t.WM.river,spots=[];for(let i=0;i<K.length&&spots.length<4;i+=89){if(K[i]!==t.T_WATER||!(Rv[i]&3))continue;const x=(i%t.MW+.5)*TILE,y=(Math.floor(i/t.MW)+.5)*TILE;if(spots.every(([a,b])=>Math.hypot(a-x,b-y)>CH*3))spots.push([x,y])}
  const all=[],far=[],wrong=[];
  for(const [sx,sy] of spots){warm(sx,sy);const cx=Math.floor(sx/CH)*CH,cy=Math.floor(sy/CH)*CH;
   for(let y=cy+8;y<cy+CH-8;y+=5)for(let x=cx+14;x<cx+CH-14;x++){if(t.drawnWet(x,y)===t.drawnWet(x+1,y))continue;const dir=t.drawnWet(x,y)?1:-1,e=x+.5;
    const g=cross(e+dir*12,y,e-dir*12,y).concat(cross(e-dir*12,y,e+dir*12,y));x+=10;
    for(const m of g){if(m.s<1)continue;all.push(m);if(m.a==null||m.a>J.reach)far.push(m.k+' '+m.a);if(m.on)continue;const d=Math.abs(m.h),want=m.h<0?(d<J.down[1]||m.gr?'step':d<J.down[2]?'hop':'jump'):m.gr?'stepup':m.k;if(m.k!==want)wrong.push(m.k+' '+m.h.toFixed(1))}}}
  const by={};for(const m of all)by[m.k]=(by[m.k]||0)+1;
  info('rivers\' banks crossed in and out: '+JSON.stringify(by)+' moves');
  ok(all.length>0&&!far.length,'every move at a bank begun with its face within '+J.reach+' px of his feet ('+all.length+' moves'+(far.length?'; not: '+far.slice(0,5).join(', '):'')+')');
  ok(!wrong.length,'down a bank, by its height: a step under '+J.down[1]+' px, a hop under '+J.down[2]+', a jump beyond; on a road or a ford a step'+(wrong.length?' (not: '+wrong.slice(0,5).join(', ')+')':''))}
 // ---- the land's ledges, dry both sides, as high as a jump: off one he jumps, up one he pulls himself up
 {let got=null,tries=0;const near=[];
  for(let i=0;i<K.length&&!got&&tries<6;i+=31){if(K[i]===t.T_WATER||!t.WM.slope||!(t.WM.slope[i]>=1))continue;const x=(i%t.MW+.5)*TILE,y=(Math.floor(i/t.MW)+.5)*TILE;if(near.some(([a,b])=>Math.hypot(a-x,b-y)<CH*3))continue;near.push([x,y]);tries++;warm(x,y);
   const cx=Math.floor(x/CH)*CH,cy=Math.floor(y/CH)*CH;
   for(let py=cy+12;py<cy+CH-12&&!got;py+=3)for(const hx of [1,-1])for(let px=cx+12;px<cx+CH-12&&!got;px++){const f=t.marchFace(px,py,hx,0);
    if(f&&f.a===1&&f.h<=-(J.down[2]+1)&&!t.drawnWet(px,py)&&!t.drawnWet(px+hx*(f.end+2),py)&&!t.marchGraded(px,py)&&!t.marchGraded(px+hx*(f.end+2),py))got={px,py,hx,hy:0,h:f.h}}}
  if(!got)info('no dry ledge as high as a jump found ('+tries+' hills looked over)');else{const d=cross(got.px-got.hx*8,got.py,got.px+got.hx*12,got.py),u=cross(got.px+got.hx*12,got.py,got.px-got.hx*8,got.py);
   ok(d.some(m=>m.k==='jump')&&u.some(m=>m.k==='climb'),'off a ledge '+(-got.h).toFixed(1)+' px high he jumps ('+kinds(d)+'); up it he pulls himself up ('+kinds(u)+')')}}
});
