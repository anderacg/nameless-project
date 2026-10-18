'use strict';
// World chunks (doc/WORLD_DESIGN.md R6, §3.3): the world map is painted in 512-px chunks (gfx/worldart.js WorldArt, from the plan
// worldArtPlan and engine/worldnature.js PX.worldNaturePlan/Steps), never needing one canvas. The map painted as one window (no
// seam anywhere: today's one canvas) is the baseline picture (worldprint's W5); the chunks stitched are that picture byte for byte,
// and so is every chunk alone and any window at all, cut across ranges, woods and roads (no seam: what stands across a border is
// painted into each chunk it touches); a chunk painted a slice at a time equals one painted at once, its slices short; the LRU
// keeps no more than its cap, never lets a chunk in view go, and paints ahead of the view; invalidate forgets the plan and the
// chunks near a change (or all), and the chunks it keeps are still right; the minimap comes from the tile data; what it costs.
// On the map the scripts leave at load (no begin), as W5's picture.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,WA=t.WorldArt,cap0=WA.cap,slice0=WA.slice;
try{
 const TILE=t.TILE,MW=t.MW,MH=t.MH,W=MW*TILE,H=MH*TILE,CS=t.CHUNK,cols=WA.cols,rows=WA.rows,MB=b=>(b/1048576).toFixed(1)+' MB';
 const fnv=d=>{let h=2166136261;const u=new Uint32Array(d.buffer,d.byteOffset,d.byteLength>>2);for(let i=0;i<u.length;i++)h=Math.imul(h^u[i],16777619)>>>0;return h.toString(16).padStart(8,'0')};
 const img=(cv,x,y,w,h)=>cv.getContext('2d').getImageData(x,y,w,h).data;
 const diff=(a,b)=>{let n=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]||a[i+3]!==b[i+3])n++;return n};
 const paint=(X,Y,w,h,rec={})=>{const cv=t.mkcv(w,h),q=performance.now();t.runGen(t.paintSteps(WA.ensure(),X,Y,w,h,cv.getContext('2d'),0,0,rec));rec.wall=performance.now()-q;return cv};
 const pct=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(s.length*p))]};
 // ---- the plan alone: what isClear reads, before anything is painted
 WA.invalidate();let q=performance.now();const P=WA.ensure(),planMs=performance.now()-q,T0=t.TOWNS[0];
 ok(!WA.full&&!WA.chunks.size&&t.CLEAR===P.clear&&t.isClear(T0.x,T0.y)&&t.isClear((T0.tx+.5)*TILE,(T0.ty+.5)*TILE)&&!t.isClear(-5,10)&&!t.isClear(W+3,10),
   'the plan comes first, painting nothing: isClear reads its clear ground (a holding and its gate clear, off the map not) ('+planMs.toFixed(0)+' ms)');
 // ---- one window: the whole map, no seam anywhere (today's one canvas)
 const r1={},one=paint(0,0,W,H,r1),ref=img(one,0,0,W,H),h1=fnv(ref);
 ok(h1==='aceeae00','the map painted as one window (no seam anywhere: today\'s one canvas) is the baseline picture ('+h1+', W5 at b94cbe2: tests/worldprint.js; '+r1.wall.toFixed(0)+' ms)');
 // ---- stitched: every chunk into the whole picture, and no seam round any border
 q=performance.now();const whole=WA.whole(),wMs=performance.now()-q,nd=diff(img(whole,0,0,W,H),ref);
 ok(nd===0&&whole.width===W&&whole.height===H,cols*rows+' chunks of '+CS+' px ('+cols+' x '+rows+') stitched (worldCv) are that picture pixel for pixel ('+nd+' differ; '+wMs.toFixed(0)+' ms)');
 {let bands=0;for(let k=1;k<cols;k++)bands+=diff(img(whole,k*CS-24,0,48,H),img(one,k*CS-24,0,48,H));for(let k=1;k<rows;k++)bands+=diff(img(whole,0,k*CS-24,W,48),img(one,0,k*CS-24,W,48));
  const X={things:0,rises:0,masses:0};for(const c of WA.cnt.values())for(const k in X)X[k]+=c.n.cross[k];
  ok(!bands&&X.things>500&&X.rises>20&&X.masses>=2,'no seam: the bands 24 px each side of all '+(cols-1+rows-1)+' borders are the one picture\'s ('+bands+' differ), with '+X.things+' trees and small things, '+X.rises+' rises and '+X.masses+' ranges standing across a border painted into the chunks they reach');
  const N=t.NATURE,same=['trees','hills','peaks','decor','flat','rock'].filter(k=>N[k]!==r1.n[k]);
  ok(!same.length,'summed over the chunks, what nature painted is what one window paints: '+['trees','hills','peaks','decor','flat','rock'].map(k=>k+' '+N[k]).join(', ')+(same.length?' — not: '+same.map(k=>k+' '+r1.n[k]).join(', '):''))}
 // ---- each chunk alone, as the LRU holds it
 WA.cap=cols*rows;const cms=[],bad=[];
 for(let cy=0;cy<rows;cy++)for(let cx=0;cx<cols;cx++){const q=performance.now(),cv=WA.chunk(cx,cy);cms.push(performance.now()-q);const [X,Y,w,h]=WA.rect(cx,cy);if(cv.width!==w||diff(img(cv,0,0,w,h),img(one,X,Y,w,h)))bad.push(cx+','+cy)}
 ok(!bad.length&&WA.chunks.size===cols*rows,'each chunk painted alone on its own canvas is the picture there ('+(bad.length?'not: '+bad.join(' '):'all '+cols*rows)+')');
 {WA.full=null;const q=performance.now(),c=WA.whole(),ms=performance.now()-q;ok(!diff(img(c,0,0,W,H),ref),'the whole picture made from the chunks the LRU holds (copied, not painted: '+ms.toFixed(0)+' ms) is the same')}
 // ---- any window: odd sizes and places, many cut through a range (the apron), a wood or a road
 {const R=t.seeded(77),mt=[];for(let i=0;i<MW*MH;i++)if(t.tiles[i]===t.T_MOUNT)mt.push(i);const wins=[];
  for(let k=0;k<16;k++){const w=13+Math.floor(R()*230),h=11+Math.floor(R()*190);let X,Y;if(k<8){const i=mt[Math.floor(R()*mt.length)];X=(i%MW)*TILE+Math.floor(R()*TILE)-(w>>1);Y=Math.floor(i/MW)*TILE+Math.floor(R()*TILE)-(h>>1)}else{X=Math.floor(R()*(W-w));Y=Math.floor(R()*(H-h))}
   X=Math.max(0,Math.min(W-w,X));Y=Math.max(0,Math.min(H-h,Y));wins.push([X,Y,w,h])}
  const off=wins.filter(([X,Y,w,h])=>diff(img(paint(X,Y,w,h),0,0,w,h),img(one,X,Y,w,h)));
  ok(!off.length,wins.length+' windows of odd sizes at odd places (8 cut through ranges) are each the picture there'+(off.length?' — not: '+off.map(a=>a.join(',')).join(' '):''))}
 // ---- sliced: a chunk painted a few ms a frame is the one painted at once
 {WA.invalidate();WA.ensure();WA.cap=cap0;const L=[[3,2],[4,2],[5,1]];WA.queue=L.map(a=>[...a]);const sl=[];let calls=0;
  while(WA.queue.length&&calls<5000){const q=performance.now();WA.step(4);sl.push(performance.now()-q);calls++}
  const bad=L.filter(([cx,cy])=>{const c=WA.chunks.get(cy*cols+cx),[X,Y,w,h]=WA.rect(cx,cy);return !c||diff(img(c.cv,0,0,w,h),img(one,X,Y,w,h))});
  ok(!bad.length&&calls>=L.length*5,'3 chunks painted 4 ms a frame ('+calls+' frames) are each the chunk painted at once ('+(bad.length?'not: '+bad.join(' '):'all')+')');
  ok(pct(sl,.9)<=6,'its slices stay short: median '+pct(sl,.5).toFixed(1)+' ms, 90% within '+pct(sl,.9).toFixed(1)+' ms, longest '+Math.max(...sl).toFixed(1)+' ms (a 4 ms budget, a step past it at most)');
  info('a chunk paints in '+pct(cms,.5).toFixed(0)+' ms (median of '+cms.length+'; slowest '+Math.max(...cms).toFixed(0)+'; '+(calls/L.length).toFixed(0)+' frames of 4 ms sliced); the plan '+planMs.toFixed(0)+' ms; the whole map as one window '+r1.wall.toFixed(0)+' ms, as chunks '+wMs.toFixed(0)+' ms')}
 // ---- the LRU, walking across the map: a cap of 10, the view never let go, the ring ahead painted before it is reached
 {WA.invalidate();WA.ensure();WA.cap=10;WA.slice=60;WA.last=null;const g=t.ctx,cam={x:0,y:0};let over=0,lost=0,met=0,ready=0,maxB=0,pool=0;
  for(let s=0;s<160;s++){cam.x=Math.round(s*(W-t.VW)/159);cam.y=Math.round(Math.max(0,Math.min(H-t.VH,H/2-t.VH/2+Math.sin(s/25)*700)));
   const v=[];for(let cy=Math.floor(cam.y/CS);cy<=Math.floor((cam.y+t.VH-1)/CS);cy++)for(let cx=Math.floor(cam.x/CS);cx<=Math.floor((cam.x+t.VW-1)/CS);cx++)v.push(cy*cols+cx);
   if(s)for(const k of v)if(!WA.view.has(k)){met++;if(WA.chunks.has(k))ready++}
   WA.draw(g,cam);if(WA.chunks.size>WA.cap)over++;for(const k of WA.view)if(!WA.chunks.has(k))lost++;maxB=Math.max(maxB,WA.bytes().chunks);pool=Math.max(pool,WA.pool.length)}
  ok(!over&&!lost&&maxB<=WA.cap*CS*CS*4,'walking across the map with a cap of '+WA.cap+': never more chunks than that (at most '+MB(maxB)+'), never a chunk in view let go ('+over+', '+lost+'; spare canvases kept: '+pool+')');
  ok(met&&ready>=met*.8,'the ring ahead is painted before the view reaches it: '+ready+' of '+met+' chunks coming into view were ready')}
 // ---- drawn by chunks, the view is the one canvas's blit (what drawWorld blits today)
 {WA.cap=cap0;WA.slice=slice0;const g=t.ctx,VW=t.VW,VH=t.VH,spots=[[0,0],[W-VW,H-VH],[CS-100,CS-50],[2400,588],[1504,1100]],bad=[];
  for(const [x,y] of spots){const cam={x,y};g.clearRect(0,0,VW,VH);WA.draw(g,cam);const a=g.getImageData(0,0,VW,VH).data;g.clearRect(0,0,VW,VH);g.drawImage(one,x,y,VW,VH,0,0,VW,VH);if(diff(a,g.getImageData(0,0,VW,VH).data))bad.push(x+','+y)}
  const tm=(f,n)=>{f();const q=performance.now();for(let i=0;i<n;i++)f();return(performance.now()-q)/n},cam={x:1504,y:1100};WA.last=cam;WA.slice=0;
  const tc=tm(()=>WA.draw(g,cam),300),to=tm(()=>g.drawImage(one,cam.x,cam.y,VW,VH,0,0,VW,VH),300);
  WA.slice=slice0;ok(!bad.length,'WorldArt.draw blits the view as the one canvas does, across chunk borders and at the map\'s edges ('+(bad.length?'not: '+bad.join(' '):spots.length+' spots')+'; '+tc.toFixed(3)+' ms a frame against '+to.toFixed(3)+')')}
 // ---- invalidate: a rect of tiles (a clearing in a wood by a holding) forgets the chunks within reach, keeps the rest, and both are right
 {WA.invalidate();WA.cap=cols*rows;for(let cy=0;cy<rows;cy++)for(let cx=0;cx<cols;cx++)WA.chunk(cx,cy);const full=WA.whole();
  let spot=null;for(let ty=8;ty<MH-8&&!spot;ty++)for(let tx=8;tx<MW-8&&!spot;tx++)if([0,1,2].every(b=>[0,1,2].every(a=>t.tiles[(ty+b)*MW+tx+a]===t.T_FOREST))&&(tx*TILE)%CS>CS/2&&(ty*TILE)%CS>CS/2)spot=[tx,ty];
  const lot={k:'clearing',x:spot[0],y:spot[1],n:3,plots:[]};T0.lots=T0.lots||[];T0.lots.push(lot);
  const before=new Set(WA.chunks.keys());WA.invalidate({x:spot[0],y:spot[1],w:3,h:3});const kept=new Set(WA.chunks.keys()),gone=[...before].filter(k=>!kept.has(k));
  ok(!WA.plan&&!t.CLEAR&&gone.length>=1&&gone.length<=4&&kept.size===before.size-gone.length&&WA.dirty.size===gone.length,'a change in a rect of tiles forgets the plan and only the chunks within '+WA.REACH+' tiles of it ('+gone.length+' of '+before.size+'; the whole picture marks the same to repaint)');
  const fresh=paint(0,0,W,H),fr=img(fresh,0,0,W,H),changed=diff(fr,ref);
  const keptBad=[...kept].filter(k=>{const [X,Y,w,h]=WA.rect(k%cols,(k/cols)|0);return diff(img(WA.chunks.get(k).cv,0,0,w,h),img(fresh,X,Y,w,h))});
  const goneBad=gone.filter(k=>{const cx=k%cols,cy=(k/cols)|0,[X,Y,w,h]=WA.rect(cx,cy);return diff(img(WA.chunk(cx,cy),0,0,w,h),img(fresh,X,Y,w,h))});
  ok(changed>50&&t.isClear(spot[0]*TILE+20,spot[1]*TILE+20)&&!keptBad.length&&!goneBad.length,'the clearing shows ('+changed+' pixels changed, its ground now clear); the chunks repainted are the new picture, the chunks kept still are ('+keptBad.length+', '+goneBad.length+' differ)');
  const q=performance.now(),w2=WA.whole(),ms=performance.now()-q;ok(w2===full&&!diff(img(w2,0,0,W,H),fr),'the whole picture repaints just those chunks and is the new picture ('+ms.toFixed(0)+' ms)');
  T0.lots.splice(T0.lots.indexOf(lot),1);WA.invalidate({x:spot[0],y:spot[1],w:3,h:3});
  const c0=WA.chunk((spot[0]*TILE/CS)|0,(spot[1]*TILE/CS)|0),[X,Y,w,h]=WA.rect((spot[0]*TILE/CS)|0,(spot[1]*TILE/CS)|0);ok(!diff(img(c0,0,0,w,h),img(one,X,Y,w,h)),'the clearing taken away again, its chunk is the old picture');
  WA.invalidate();ok(!WA.plan&&!WA.chunks.size&&!WA.full&&!WA.jobs.size&&!WA.queue.length&&!t.CLEAR,'invalidate() forgets everything: the plan, every chunk, the whole picture, the queue')}
 // ---- the minimap: from the tile data, 1 px a tile (or one per k), kept until invalidate
 {const m=WA.mini(),d=img(m,0,0,MW,MH),c=t.PAL;let bad=0;for(let i=0;i<MW*MH;i++){const col=c[t.CLIMS[t.climate[i]]].mini[t.tiles[i]],o=i*4;if(d[o]!==parseInt(col.slice(1,3),16)||d[o+1]!==parseInt(col.slice(3,5),16)||d[o+2]!==parseInt(col.slice(5,7),16))bad++}
  const m2=WA.mini(2);WA.invalidate();ok(!bad&&WA.mini()===WA.mini()&&WA.mini()!==m&&m2.width===MW/2&&m2.height===MH/2,'the minimap is the tile data, a pixel a tile ('+bad+' off), kept, made afresh after invalidate; at 1 px per 2 tiles '+m2.width+'x'+m2.height)}
 // ---- memory
 {WA.cap=cap0;WA.ensure();WA.chunk(1,1);const b=WA.bytes(),Pn=WA.plan.nature,per=b.plan/(MW*MH);
  ok(b.plan<4*1048576&&b.chunks===CS*CS*4,'memory: the plan '+MB(b.plan)+' ('+per.toFixed(1)+' B a tile: clear ground '+MB(WA.plan.clear.bytes)+', kept-clear '+MB(Pn.keep.bytes)+', ranges\' height fields '+MB(Pn.mdBytes)+'), a chunk '+MB(CS*CS*4)+', the LRU at most '+WA.cap+' ('+MB(WA.cap*CS*CS*4)+'); at Huge (1024 x 768) the plan about '+MB(per*1024*768)+', the chunks the same');
  info('memory: one canvas for the whole map would be '+MB(W*H*4)+' here, '+MB(16384*12288*4)+' at Huge; worldCv\'s canvas is only made when asked (the blit until render.js draws by chunks, the wiki, the tests)')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{WA.cap=cap0;WA.slice=slice0;WA.invalidate()}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
