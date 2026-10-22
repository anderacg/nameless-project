'use strict';
// World chunks (doc/WORLD_DESIGN.md R6, §3.3): the world map is painted in 512-px chunks (gfx/worldart.js WorldArt, from the plan
// worldArtPlan and engine/worldnature.js PX.worldNaturePlan/Steps), never needing one canvas. The map painted as one window (no
// seam anywhere) is the baseline picture (worldprint's W5); the chunks stitched are that picture byte for byte,
// and so is every chunk alone and any window at all, cut across ranges, woods and roads (no seam: what stands across a border is
// painted into each chunk it touches); a chunk painted a slice at a time equals one painted at once, its slices short; the LRU
// keeps no more than its cap, never lets a chunk in view go, and paints ahead of the view; invalidate forgets the plan and the
// chunks near a change (or all), and the chunks it keeps are still right; the minimap comes from the tile data; what it costs.
// The world's roads, crossings and fords as the owner's play-test asked (2026-10-22): every road's end at
// a holding led into its gate, a bridge's deck met on its axis by a ramp, a fork's end on the way it joins, a ford's shallows soft;
// and as the second play-test asked, the shores curves within a few px of their tiles, the water's tones shading across a climate's edge;
// and as the third asked, the roads' art meeting the new roads (forks and bridges), each ford a real one (its bed showing through
// the shallows, a track up each bank).
// On the map the scripts leave at load (the classic seed, no begin): the same checks, its picture's hash an INFO line; then the prefetch at Large and Huge:
// walking across each at Travel fast's pace (8x: a chunk in some 420 frames), 4 ms of painting a frame, the ring ahead is ready.
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
 // ---- one window: the whole map, no seam anywhere
 const r1={},one=paint(0,0,W,H,r1),ref=img(one,0,0,W,H),h1=fnv(ref);
 info('the classic seed painted as one window: '+h1+' ('+r1.wall.toFixed(0)+' ms)');
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

 // ---- the generated world's roads (gfx/worldart.js artGenPlan: gateLead, straightOn, joinEnds) and fords (fordAt)
 {const P=WA.ensure(),S=P.segs,G=t.GENART,X=[],ends=new Map(),key=(x,y)=>Math.round(x*10)+','+Math.round(y*10);
  for(let k=0;k<S.length;k+=5)if(S[k+4]<2)for(const e of [0,2]){const q=key(S[k+e],S[k+e+1]);ends.set(q,(ends.get(q)||0)+1)}
  // (every holding: a road's end at the gate (into it by GENART.gate), its last leg coming up from below; no road under its centre)
  const gates=t.TOWNS.map(h=>{const b=t.centreBox(h);return[h.tx*TILE,(b.y+b.n-G.gate)*TILE,b]});let led=0,under=0;
  for(const [gx,gy,b] of gates){let hit=false;for(let k=0;k<S.length;k+=5)for(const e of [0,2]){const x=S[k+e],y=S[k+e+1],ox=S[k+2-e],oy=S[k+3-e];if(Math.hypot(x-gx,y-gy)<.6&&oy>y&&Math.abs(ox-x)<Math.abs(oy-y))hit=true}if(hit)led++;
    for(let k=0;k<S.length;k+=5)for(let f=0;f<=1;f+=.125){const x=S[k]+(S[k+2]-S[k])*f,y=S[k+1]+(S[k+3]-S[k+1])*f;if(x>b.x*TILE+1&&x<(b.x+b.n)*TILE-1&&y>b.y*TILE+1&&y<gy-1)under++}}
  ok(led===gates.length&&!under,'every holding\'s roads are led round its centre into its gate: '+led+' of '+gates.length+' gates met by a road coming up from below, '+under+' road points under a centre');
  // (every bridge a road comes to: a ramp at that end on its deck's axis, from under the deck outward; the roads there on that axis
  //  as far as the ramp runs)
  let br=0,ramps=0,stray=0,off=0;for(let k=0;k<S.length;k+=5)if(S[k+4]>=2)ramps++;
  for(const c of t.WM.crossings){if(c.kind!=='bridge')continue;const ax=c.i%MW,ay=(c.i-ax)/MW,bx=c.j%MW,by=(c.j-bx)/MW,hor=ay===by,mid=(hor?ay:ax)*TILE+8,lo=hor?Math.min(ax,bx):Math.min(ay,by),hi=hor?Math.max(ax,bx):Math.max(ay,by);
    const E=[lo*TILE+TILE-4,hi*TILE+4],u=(x,y)=>hor?x:y,v=(x,y)=>hor?y:x,run=[0,0];
    for(let k=0;k<S.length;k+=5)if(S[k+4]>=2&&Math.abs(v(S[k],S[k+1])-mid)<.01&&Math.abs(v(S[k+2],S[k+3])-mid)<.01)E.forEach((e,n)=>{const s=n?1:-1,a=(u(S[k],S[k+1])-e)*s,b=(u(S[k+2],S[k+3])-e)*s;if(a<0&&a>=-3&&b>a){run[n]=Math.max(run[n],b);stray++}});
    if(!run[0]&&!run[1])continue;br++;
    for(let k=0;k<S.length;k+=5){if(S[k+4]>=2)continue;const a=S[k],b=S[k+1],c2=S[k+2],d=S[k+3];
      for(let f=0;f<=1;f+=.1){const x=a+(c2-a)*f,y=b+(d-b)*f;E.forEach((e,n)=>{const du=(u(x,y)-e)*(n?1:-1);if(du>=0&&du<=run[n]&&Math.abs(v(x,y)-mid)<10&&Math.abs(v(x,y)-mid)>1.5)off++})}}}
  ok(br&&stray===ramps&&!off,br+' bridges with roads: each deck met by a ramp on its axis where a road comes to it ('+ramps+' ramps, '+(ramps-stray)+' off a deck’s end), the roads onto them on that axis as far as the ramps run ('+off+' points of a road off it)');
  // (every line's loose end (an end of one segment only, not at a gate, on land) lies on another road's way)
  let loose=0,all=0;for(const [q,n] of ends){if(n!==1)continue;const [x,y]=q.split(',').map(v=>v/10);if(gates.some(([gx,gy])=>Math.hypot(x-gx,y-gy)<1)||P.wk[(y>>4)*MW+(x>>4)])continue;all++;let best=1e9;
    for(let k=0;k<S.length;k+=5){const a=S[k],b=S[k+1],vx=S[k+2]-a,vy=S[k+3]-b,L=vx*vx+vy*vy;if(Math.hypot(a-x,b-y)<.01||Math.hypot(S[k+2]-x,S[k+3]-y)<.01)continue;const tt=L?Math.max(0,Math.min(1,((x-a)*vx+(y-b)*vy)/L)):0;best=Math.min(best,Math.hypot(a+vx*tt-x,b+vy*tt-y))}
    if(best>1.5)loose++}
  ok(all&&!loose,'forks and junctions join: '+all+' road ends that meet another road, each on its way ('+loose+' short of it)');
  // (every ford: shallow on its line (its bar wandering a few px off it, GENART.ford.bend), fading out across it either side (soft,
  //  no square edge), the river beyond)
  let fd=0,soft=0;for(const [ax,ay,bx,by] of P.fords){fd++;const f=fd,mx=(ax+bx)/2,my=(ay+by)/2,hor=Math.abs(ay-by)<1,s=[];for(let d=-26;d<=26;d+=2)s.push(t.fordAt(P,f,Math.floor(hor?mx:mx+d),Math.floor(hor?my+d:my)));
    const n=s.length,c=n>>1,top=Math.max(...s.slice(c-2,c+3));if(top>.4&&top>s[c-6]&&top>s[c+6]&&!s[0]&&!s[n-1]&&s.filter(v=>v>0&&v<1).length>=4)soft++}
  ok(fd===t.WM.crossings.filter(c=>c.kind==='ford').length&&soft===fd,fd+' fords: shallow on their line, fading out over some '+G.ford.soft+' px either side of it ('+soft+' soft)');
  // (every ford as a real one (the owner's third play-test): its shallows told from the river beside them (the bed showing through:
  //  their mean colour some way off the river's), a worn track on its line up each bank, past the end tile's middle, kept clear)
  {let bed=0,trk=0,n=0;const px=(x,y)=>{const o=(y*W+x)*4;return[ref[o],ref[o+1],ref[o+2]]};
   for(const [ax,ay,bx,by] of P.fords){const f=++n,L=Math.hypot(bx-ax,by-ay),ux=(bx-ax)/L,uy=(by-ay)/L,a=[0,0,0],b=[0,0,0];let na=0,nb=0;
    for(let s2=8;s2<=L-8;s2+=2)for(let d=-40;d<=40;d++){const x=Math.floor(ax+ux*s2-uy*d),y=Math.floor(ay+uy*s2+ux*d);if(!t.wpx(P.wk,x,y))continue;const v=t.fordAt(P,f,x,y),c=px(x,y);
     if(v>.8){for(let k=0;k<3;k++)a[k]+=c[k];na++}else if(!v&&Math.abs(d)>20){for(let k=0;k<3;k++)b[k]+=c[k];nb++}}
    if(na&&(!nb||[0,1,2].reduce((q,k)=>q+Math.abs(a[k]/na-b[k]/nb),0)>30))bed++;
    for(const e of [-1,1]){const x=Math.floor((e<0?ax:bx)+e*ux*6),y=Math.floor((e<0?ay:by)+e*uy*6);if(Math.max(...[-1,0,1].map(d=>t.fordTrack(P,f,x-uy*d,y+ux*d)))>.5&&P.clear.at(x,y))trk++}}
   ok(n&&bed===n&&trk===2*n,n+' fords: the shallows told from the river beside them (the bed showing through) on '+bed+', a worn track up each bank, kept clear, at '+trk+' of '+2*n+' ends')}
  // (the shores are curves (wpx, the second play-test): water and land drawn by the water's field, not the tiles' squares, yet
  //  never deep in a tile of the other kind (passing stays by tile): a staircase of tiles reads as a slope, a lake's corner an arc)
  {const K=P.wk,MW=t.MW,MH=t.MH,lim=Math.ceil(5+G.wob);let edgeT=0,off=0,deep=0;
   for(let ty=1;ty<MH-1;ty++)for(let tx=1;tx<MW-1;tx++){if((tx*7+ty*13)%5)continue;const w=K[ty*MW+tx]>0;let mix=false;for(let b=-1;b<=1&&!mix;b++)for(let a=-1;a<=1;a++)if((K[(ty+b)*MW+tx+a]>0)!==w){mix=true;break}if(!mix)continue;edgeT++;
    for(let y=0;y<16;y++)for(let x=0;x<16;x++){if((t.wpx(K,tx*16+x,ty*16+y)===1)===w)continue;off++;if(Math.min(x,15-x,y,15-y)>=lim)deep++}}
   ok(edgeT>100&&off>edgeT*4&&!deep,'the shores are curves: of '+edgeT+' tiles at a shore (a fifth of them), '+off+' pixels are drawn as the other kind (corners rounded, steps a slope), none '+lim+' px or more into its tile ('+deep+')')}
  // (the water's tones by the climates' share round each tile corner (ClimMix): across a climate's edge, from one pixel to the
  //  next, a step of a few levels at most: no blocks of one climate's water in another's, the noise by Thornbrook)
  {const MW=t.MW,MH=t.MH,WL=t.CLIMS.map(c=>t.WATER_RGB[c]);let edges=0,jump=0;
   for(let ty=2;ty<MH-2&&edges<2000;ty++)for(let tx=2;tx<MW-3;tx++){const i=ty*MW+tx;if(t.tiles[i]!==t.T_WATER||t.tiles[i+1]!==t.T_WATER||t.climate[i]===t.climate[i+1])continue;edges++;
    const CM=new t.ClimMix(tx-1,ty,tx+2,ty,5);let prev=null;for(let x=(tx-1)*16;x<(tx+3)*16;x++){const c=t.palAt(CM,WL,(x>>4)-tx+1,(x&15)/16,.5)[1];if(prev)jump=Math.max(jump,...[0,1,2].map(n=>Math.abs(c[n]-prev[n])));prev=c}}
   ok(edges>20&&jump<=6,'the water shades across a climate’s edge: '+edges+' edges, the most a tone steps from a pixel to the next '+jump.toFixed(1)+' (6 at most)')}
  // (the fourth play-test: a road's colour across a climate's edge (roadPal): the grass's where no other climate's cover lies, that
  //  climate's where it lies whole, between the two where it is a half)
  {const o4=[[0,0,0],[0,0,0],[0,0,0],[0,0,0]],RG=t.ROAD_RGB,bad=[],tone=[];
   t.COVERS.forEach((L,k)=>{const at=v=>{const cv=[0,0,0];cv[k]=v;return t.roadPal(cv,o4)[1].slice()},a=at(0),m=at(.5),b=at(1);tone.push(L.c+' '+m.map(Math.round).join(','));
    if([0,1,2].some(n=>Math.abs(a[n]-RG.grass[1][n])>.01||Math.abs(b[n]-RG[L.c][1][n])>.01||(m[n]-a[n])*(m[n]-b[n])>.001||Math.abs(m[n]-(a[n]+b[n])/2)>Math.abs(a[n]-b[n])*.25+.01))bad.push(L.c)});
   ok(!bad.length,'a road’s colour blends across a climate’s edge: the grass’s with no cover, the climate’s under a whole one, between the two at a half ('+tone.join('; ')+(bad.length?' — not: '+bad.join(', '):'')+')')}
  // (a brook crossing a road (worldnature.js PX.WN_XING): onto a road tile from off it, or off one: the stream's water shown on the
  //  road's band there (kept clear: before, the stream stopped short of it either side))
  {const F=t.WM.flow,Rv=t.WM.river,lvl=i=>t.tiles[i]===t.T_WATER||t.tiles[i]===t.T_MOUNT||Rv[i]&3?0:F[i]&31,DX=[1,1,0,-1,-1,-1,0,1],DY=[0,1,1,1,0,-1,-1,-1],rd=(x,y)=>x>=0&&y>=0&&x<MW&&y<MH&&t.tiles[y*MW+x]===t.T_ROAD;
   let n=0,shown=0;for(let ty=1;ty<MH-1;ty++)for(let tx=1;tx<MW-1;tx++){const i=ty*MW+tx;if(!rd(tx,ty)||lvl(i)<6)continue;const d=F[i]>>5,nx=tx+DX[d],ny=ty+DY[d];let ux=-1,uy=-1,ub=0;
     for(let k=0;k<8;k++){const x=tx-DX[k],y=ty-DY[k],j=y*MW+x;if(lvl(j)>=6&&F[j]>>5===k&&lvl(j)>ub){ub=lvl(j);ux=x;uy=y}}
     if(rd(nx,ny)&&ux>=0&&rd(ux,uy))continue;n++;let wp=0;
     for(let y=0;y<16;y++)for(let x=0;x<16;x++){const X=tx*16+x,Y=ty*16+y;if(!P.clear.at(X,Y)||t.wpx(P.wk,X,Y))continue;const o=(Y*W+X)*4;if(ref[o+2]>ref[o]+40&&ref[o+2]>ref[o+1])wp++}if(wp>=4)shown++}
   ok(n>5&&shown>=n*.8,n+' brooks crossing a road: the stream’s water shown across the road’s band at '+shown)}
  // (every bridge's foot (the owner's fourth play-test): what it draws off its deck (its abutments) as wide as the deck and on
  //  land only; and the water beside its deck painted as water: no bank, worn ground or stone on it (but another bridge's deck, or
  //  a ford's shallows and rocks: a ford beside a bridge's end, worldplace.js)
  {const K=P.wk,BR=t.WM.crossings.filter(c=>c.kind==='bridge').map(c=>{const ax=c.i%MW,ay=(c.i-ax)/MW,bx=c.j%MW,by=(c.j-bx)/MW,hor=ay===by,lo=hor?Math.min(ax,bx):Math.min(ay,by),hi=hor?Math.max(ax,bx):Math.max(ay,by);
     return{c,hor,mid:(hor?ay:ax)*TILE+8,u0:lo*TILE+TILE-4,u1:hi*TILE+4,hw:G.deck[c.stone?1:0]}}),deck=(x,y)=>BR.some(b=>{const u=b.hor?x:y,v=b.hor?y:x;return u>=b.u0-2&&u<b.u1+2&&v>=b.mid-b.hw-2&&v<b.mid+b.hw+3}),ford=(x,y)=>{const f=P.fd[(y>>4)*MW+(x>>4)];return f>0&&t.fordAt(P,f,x,y)>0};let n=0,wide=0,wet=0;
   for(const {c,hor,mid,u0,u1,hw} of BR){n++;const R=[];t.artGenXing(P,(col,x,y,w,h)=>R.push([x,y,w||1,h||1]),c);
    for(const [x,y,w,h] of R)for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){const u=hor?xx:yy,v=hor?yy:xx;if(u>=u0&&u<u1)continue;if(v<mid-hw||v>=mid+hw||t.wpx(K,xx,yy))wide++}
    for(let u=u0;u<u1;u++)for(let v=mid-hw-14;v<mid+hw+14;v++){if(v>=mid-hw-2&&v<mid+hw+3)continue;const x=hor?u:v,y=hor?v:u;if(x<0||y<0||x>=W||y>=H||!t.wpx(K,x,y)||deck(x,y)||ford(x,y))continue;const o=(y*W+x)*4;if(ref[o]>ref[o+1]&&ref[o]>ref[o+2])wet++}}
   ok(n&&!wide&&!wet,n+' bridges: each one’s abutments as wide as its deck and on land ('+wide+' px off it), the water beside each deck painted as water ('+wet+' px of bank, worn ground or stone on it)')}}
 // ---- the owner's fifth play-test (agent T): hills under roads at every angle, a road through a wood, brooks never cut
 //      short, the mountains' kinds, an oasis's and ponds' rings (put into the world here: the generator's lists, WM.oases/ponds)
 {const P=WA.ensure(),N=P.nature,S=P.segs,V=t.GENART.verge,lum=(d,o)=>d[o]*.3+d[o+1]*.59+d[o+2]*.11;
  const paintN=(X,Y,w,h)=>img(paint(X,Y,w,h),0,0,w,h);
  // (a hill crossed by a road: along road segments through hills (a point each 8 px), across the road, where the hill's shading (the
  //  picture less the same window painted with no hills) lies on both sides of the band, it lies under it too: no straight cut along
  //  the road; by the road's angle; on the generated classic seed (the owner's) and Normal s1)
  {const B=[0,0,0,0,0,0],cut=[0,0,0,0,0,0],W0=t.WM;let n=0;const where=[];
   const run=name=>{const P=WA.ensure(),N=P.nature,S=P.segs,seen=new Set();let m=0;
    for(let k=0;k<S.length&&m<70;k+=5){const a=S[k],b=S[k+1],vx=S[k+2]-a,vy=S[k+3]-b,L=Math.hypot(vx,vy);if(S[k+4]>1||L<4)continue;const bk=Math.floor(((Math.atan2(vy,vx)+Math.PI)%Math.PI)/Math.PI*6)%6;
     for(let u=L/2%8;u<L&&m<70;u+=8){const mx=a+vx*u/L,my=b+vy*u/L,tx=mx>>4,ty=my>>4,key=(tx>>1)+','+(ty>>1);if(B[bk]>=24||seen.has(key))continue;let hl=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(t.tAt(tx+i,ty+j)===t.T_HILL)hl++;if(hl<2)continue;
      seen.add(key);const X=Math.round(mx)-20,Y=Math.round(my)-20,A=paintN(X,Y,40,40);N.hill=false;let Bn;try{Bn=paintN(X,Y,40,40)}finally{N.hill=true}
      const E=(x,y)=>{const o=((y-Y)*40+x-X)*4;return Math.abs(A[o]-Bn[o])+Math.abs(A[o+1]-Bn[o+1])+Math.abs(A[o+2]-Bn[o+2])},nx=-vy/L,ny=vx/L,hw=t.GENART.road[S[k+4]]*1.1+V;
      const side=s=>{let e=0;for(let d=hw+1;d<=hw+4;d++)e+=E(Math.round(mx+nx*d*s),Math.round(my+ny*d*s));return e/4},mid=(()=>{let e=0,c=0;for(let d=-hw;d<=hw;d++){e+=E(Math.round(mx+nx*d),Math.round(my+ny*d));c++}return e/c})();
      if(side(-1)<8||side(1)<8)continue;B[bk]++;n++;m++;if(mid<2){cut[bk]++;where.push(name+' '+tx+','+ty)}}}};
   try{run('classic');t.useWorld(t.genWorld({preset:'normal',seed:'1'}).map);WA.invalidate();run('Normal s1')}finally{if(t.WM!==W0){t.useWorld(W0);WA.invalidate()}}
   const nc=cut.reduce((s,v)=>s+v,0),nb=B.filter(v=>v).length;
   ok(n>=20&&nb>=4&&nc<=Math.max(1,n*.05),'a hill crossed by a road runs on under it at every angle (the fifth play-test; the generated classic seed and Normal s1): '+n+' crossings by 30� of the road�s way ('+B.join('/')+'), the hill�s shading under the band at all but '+nc+(where.length?' ('+where.slice(0,5).join('; ')+')':''))}
  // (a rise's shadow soft: across its edge in steps, no straight hard line along the light)
  {const hs=[1,2,4,8].map(d=>{let s=0;for(let k=1;k<=7;k++){const a=d*0.1*(1/(PX.WN_HILL.soft[0]+PX.WN_HILL.soft[1]*k));s=Math.max(s,Math.min(1,a))}return s});
   ok(hs[0]<hs[1]&&hs[1]<hs[2]&&hs[0]>0&&hs[0]<.5,'a rise’s shadow is soft: as a rise stands over the light’s line by .1 to .8 px, its shadow '+hs.map(v=>v.toFixed(2)).join(' → '))}
  // (a road through a wood (a lane, P.lane): its tile a wood's: the floor right up to the path, trees and undergrowth within a few px
  //  of its band, some crowns over its edge; off the path no bright ground left (the floor's tone where the art drew none before:
  //  against the window painted with no lanes, nor a wood's crowns over a way's verge, PX.WN_WOOD.verge))
  {let lanes=0,near=0,over=0,fl=0,fn=0;const LT=P.lane,idx=[];for(let i=0;i<MW*MH;i++)if(LT[i])idx.push(i);
   for(const i of idx.filter((v,k)=>k%Math.max(1,Math.floor(idx.length/80))===0)){const tx=i%MW,ty=(i-tx)/MW,X=tx*TILE,Y=ty*TILE;lanes++;let hit=false;
    WA.standing(X-8,Y-8,X+TILE+8,Y+TILE+8).forEach(e=>{if(!e.s||!e.s.a)return;const sp=e.s,M=sp.width;for(let j=0;j<M&&!hit;j++)for(let q=0;q<M;q++){if(sp.a[j*M+q]!==1)continue;const x=e.dx+q,y=e.dy+j;if(x<X||y<Y||x>=X+TILE||y>=Y+TILE)continue;const v=t.roadAt(P,x,y);if(v>-4){hit=true;if(v>0)over++;break}}});
    if(hit)near++}
   const pick=idx.filter((v,k)=>k%Math.max(1,Math.floor(idx.length/12))===0);
   for(const i of pick){const tx=i%MW,ty=(i-tx)/MW,X=tx*TILE-8,Y=ty*TILE-8,A=paintN(X,Y,32,32);const N2=WA.ensure().nature,L0=N2.LT;N2.LT=null;const V0=PX.WN_WOOD.verge;PX.WN_WOOD.verge=0;let Bn;try{Bn=paintN(X,Y,32,32)}finally{N2.LT=L0;PX.WN_WOOD.verge=V0}
    for(let y=8;y<24;y++)for(let x=8;x<24;x++){const v=t.roadAt(P,X+x,Y+y);if(v>-1.5||v<-6||!t.CLEAR.at(X+x,Y+y))continue;fn++;const o=(y*32+x)*4;if(lum(A,o)<lum(Bn,o)-4)fl++}}
   ok(lanes>10&&near>=lanes*.8&&over>0&&fl>=fn*.8,'a road through a wood (the fifth play-test): of '+lanes+' lanes, '+near+' with trees or undergrowth within 4 px of the path ('+over+' crowns over its edge); the forest floor up to the path on '+fl+' of '+fn+' px of its kept band')}
  // (a ford's track through a wood: the floor up to it too, its kept band darker than the track)
  {let n=0,dk=0;for(const [ax,ay,bx,by] of P.fords){for(const [ex,ey,sx,sy] of [[ax,ay,ax-bx,ay-by],[bx,by,bx-ax,by-ay]]){const L=Math.hypot(sx,sy),x=Math.round(ex+sx/L*12),y=Math.round(ey+sy/L*12);if(t.tAt(x>>4,y>>4)!==t.T_FOREST)continue;n++;
     const o=(y*W+x)*4,ux=-sy/L,uy=sx/L;let s=0,m=0;for(const d of [4,5,-4,-5]){const q=(Math.round(y+uy*d)*W+Math.round(x+ux*d))*4;s+=lum(ref,q);m++}if(s/m<lum(ref,o)-6)dk++}}
   ok(!n||dk>=n*.75,'a ford’s track through a wood: the floor dark beside the track at '+dk+' of '+n+' ends in a wood')}
  // (brooks never cut short by the art: into water their line meets the water as drawn; out of a pond or a lake it starts in it)
  {const F=t.WM.flow,Rv=t.WM.river,lvl=i=>t.tiles[i]===t.T_WATER||t.tiles[i]===t.T_MOUNT||Rv[i]&3?0:F[i]&31,DX=[1,1,0,-1,-1,-1,0,1],DY=[0,1,1,1,0,-1,-1,-1],blue=(x,y)=>{const o=(y*W+x)*4;return ref[o+2]>ref[o]+30&&ref[o+2]>=ref[o+1]};
   let n=0,met=0;const miss=[];for(let ty=1;ty<MH-1;ty++)for(let tx=1;tx<MW-1;tx++){const i=ty*MW+tx;if(lvl(i)<6)continue;const d=F[i]>>5,nx=tx+DX[d],ny=ty+DY[d];if(t.tiles[ny*MW+nx]!==t.T_WATER)continue;n++;let ok2=false;
     for(let y=Math.min(ty,ny)*16;y<(Math.max(ty,ny)+1)*16&&!ok2;y++)for(let x=Math.min(tx,nx)*16;x<(Math.max(tx,nx)+1)*16;x++){if(t.wpx(P.wk,x,y)||!blue(x,y))continue;if(t.wpx(P.wk,x+1,y)||t.wpx(P.wk,x-1,y)||t.wpx(P.wk,x,y+1)||t.wpx(P.wk,x,y-1)){ok2=true;break}}
     if(ok2)met++;else if(miss.length<6)miss.push(tx+','+ty)}
   ok(n>10&&met>=n*.95,n+' brooks running into water: the line meets the water as drawn at '+met+(miss.length?' (not: '+miss.join(' ')+')':''))}
  // (the mountains' kinds: a pool a climate (PX.WN_MOUNT.pool, the owner's notes on the fifth play-test), the original look (classic)
  //  in every one, every kind of PX.WORLD_MOUNTS in its climates' (sandstone the desert's, alpine the frost's and the cold grass's,
  //  forested the wet grass's, the low frost's and the high swamp's, knolls the swamp's, granite and basalt), drawn by their weights
  //  (basalt rare) where the world's fields allow; each range one kind (its shape) and a kind for every climate (its look where that
  //  climate's cover reaches it); the kinds told apart by colour; a forested range wooded with the world's trees, lifted up its slopes,
  //  its rock showing between)
  {const CL=['grass','frost','desert','swamp'],f=(e,tm,mo)=>({elev:e,temp:tm,moist:mo,rough:80}),PL=PX.WN_MOUNT.pool,names=c=>PL[c].map(e=>e[0]),has=(c,F,k)=>PX.worldMountPool(c,F).some(e=>e[0]===k);
   const where={sandstone:['desert'],alpine:['frost','grass'],forested:['grass','frost','swamp'],knoll:['swamp'],granite:['grass','frost'],basalt:['grass','desert']};
   const classic=CL.every(c=>names(c)[0]==='classic'),inPool=Object.keys(PX.WORLD_MOUNTS).every(k=>where[k]&&where[k].every(c=>names(c).includes(k)));
   const gates=[has('grass',f(200,40,60),'forested'),has('grass',f(200,40,60),'alpine'),!has('grass',f(230,120,10),'forested'),!has('grass',f(200,120,60),'alpine'),has('frost',f(200,0,30),'forested'),!has('frost',f(240,0,30),'forested'),
     has('swamp',f(240,120,90),'forested'),!has('swamp',f(200,120,90),'forested'),CL.every(c=>has(c,f(240,120,0),'classic')&&has(c,f(100,200,200),'classic'))];
   // (the draws: 4000 evenly over 0-1, each climate's fields letting its every gate pass: the share of each kind its weight's)
   const FF={grass:f(200,40,60),frost:f(200,0,30),desert:f(200,200,10),swamp:f(240,120,90)};let off=0,bas=0;const sh=[];
   for(const c of CL){const L=PX.worldMountPool(c,FF[c]),tot=L.reduce((s,e)=>s+e[1],0),n={};for(let i=0;i<4000;i++){const k=PX.worldMountKind(c,FF[c],(i+.5)/4000);n[k]=(n[k]||0)+1}
     for(const [k,w] of L){const s=(n[k]||0)/4000;off=Math.max(off,Math.abs(s-w/tot));if(k==='basalt')bas=Math.max(bas,s)}sh.push(c+' '+L.map(([k])=>k+' '+Math.round((n[k]||0)/40)+'%').join(', '))}
   const big=N.M.filter(m=>m.n>=3),kinds=new Set(big.map(m=>m.kind)),bad=big.filter(m=>!m.kind||!m.kinds||!CL.every(c=>m.kinds[c]&&names(c).includes(m.kinds[c]))||m.kinds[CL[t.climate[m.q0]]]==null).length;
   const mean=k=>{const s=PX.worldPeak('grass',2,64,k),d=s.getContext('2d').getImageData(0,0,64,64).data,c=[0,0,0];let n=0;for(let i=0;i<d.length;i+=4)if(d[i+3]&&!(d[i]===26&&d[i+1]===28)){c[0]+=d[i];c[1]+=d[i+1];c[2]+=d[i+2];n++}return c.map(v=>v/n)};
   const KS=Object.keys(PX.WORLD_MOUNTS),M=KS.map(mean);let close=0;for(let a=0;a<M.length;a++)for(let b=a+1;b<M.length;b++)if(M[a].reduce((s,v,i)=>s+Math.abs(v-M[b][i]),0)<24)close++;
   ok(classic&&inPool&&gates.every(Boolean)&&off<.01&&bas<.06&&!bad&&kinds.size>=2&&!close,'the mountains’ kinds a pool a climate, the original look first in each ('+classic+'), every kind in its climates’ ('+inPool+'), gated by the world’s fields ('+gates.filter(Boolean).length+' of '+gates.length+' rules), drawn by their weights (at most '+(off*100).toFixed(1)+'% off; basalt '+Math.round(bas*100)+'% at most: '+sh.join('; ')+'), '+big.length+' ranges each of one kind ('+[...kinds].join(', ')+'), '+KS.length+' kinds told apart by colour ('+close+' pairs alike)');
   // (a forested range on the map: the world's trees standing on its tiles, most lifted up its slopes, its rock's runs between)
   const fm=big.find(m=>m.kind==='forested');if(fm){const TS=new Set();for(const c of CL)for(const sp of PX.WORLD_SPECIES[c])for(let v=0;v<4;v++)for(const d of [0,1])TS.add(PX.worldTree(c,sp,v,d));
     let tr=0,up=0,rock=0;for(const e of WA.standing(fm.c0*TILE-16,fm.r0*TILE-64,(fm.c1+1)*TILE+16,(fm.r1+1)*TILE+16)){if(!e.s){rock++;continue}const tx=e.x>>4,ty=e.y>>4;if(!TS.has(e.s)||N.lab[ty*MW+tx]!==fm.id)continue;tr++;if(e.dy+e.s.ay<e.y-2)up++}
     ok(tr>=fm.n*2&&up>=tr*.7&&rock>20,'a forested range ('+fm.n+' tiles at '+fm.c0+', '+fm.r0+') stands with '+tr+' of the world’s trees on its tiles, '+up+' of them lifted up its slopes, '+rock+' runs of its rock between')}
   else info('no forested range on this world')}
  // (every pond's and oasis's bank (land within 1-3 px of its water as drawn, its nearest water tile a pond's or an oasis's: wk 5)
  //  along each tile's edge line round it: a run of one colour 6 px long at most (the ground's grain and the ring's mottling on it,
  //  GENART.pgrain, PX.WN_RING.soft); a sprite's outline (26,28,38, as the mountains' check reads it) is no bank colour. The world's
  //  own (WM.ponds, WM.oases), then each kind put into each climate at an open spot)
  {const T0=t.tiles.slice(),P0=t.WM.ponds,O0=t.WM.oases,cl=(x,y)=>t.CLIMS[t.climate[y*MW+x]],KS=['hollow','pool','tarn','oxbow','spring','oasis'];
   const runs=q=>{const P=WA.ensure(),L=(q.tiles||[]).concat([q.i]),xs=L.map(i=>i%MW),ys=L.map(i=>(i/MW)|0),x0=Math.max(0,Math.min(...xs)-2),y0=Math.max(0,Math.min(...ys)-2),x1=Math.min(MW-1,Math.max(...xs)+2),y1=Math.min(MH-1,Math.max(...ys)+2);
     const X=x0*TILE,Y=y0*TILE,w=(x1-x0+1)*TILE,h=(y1-y0+1)*TILE,A=paintN(X,Y,w,h),wet=(x,y)=>t.wpx(P.wk,x,y)===1;
     const bank=(x,y)=>{if(wet(x,y))return false;const j=t.wnear(P.wk,x>>4,y>>4,4);if(j<0||P.wk[j]!==5)return false;for(let b=-3;b<=3;b++)for(let a=-3;a<=3;a++)if(wet(x+a,y+b))return true;return false};let best=0;
     for(const hz of [0,1])for(let e=hz?Y:X;e<(hz?Y+h:X+w);e+=TILE){let r=0,prev=null;for(let s=0;s<(hz?w:h);s++){const x=hz?X+s:e,y=hz?e:Y+s,o=((y-Y)*w+x-X)*4;if(!bank(x,y)||A[o]===26&&A[o+1]===28&&A[o+2]===38){r=0;prev=null;continue}
       const c=A[o]+','+A[o+1]+','+A[o+2];r=c===prev?r+1:1;prev=c;best=Math.max(best,r)}}
     return best};
   const own=(P0||[]).map(q=>[q,q.kind]).concat((O0||[]).map(q=>[q,'oasis'])),by={};let ow=0;for(const [q,k] of own){const r=runs(q),c=k+' in the '+cl(q.i%MW,(q.i/MW)|0);by[c]=Math.max(by[c]||0,r);ow=Math.max(ow,r)}
   const P=WA.ensure(),open=(x,y)=>{for(let b=-4;b<=4;b++)for(let a=-4;a<=4;a++)if(t.tAt(x+a,y+b)!==t.T_OPEN||P.clear.at((x+a)*TILE+8,(y+b)*TILE+8))return false;return true},spot={};
   for(let y=8;y<MH-8&&Object.keys(spot).length<4;y+=3)for(let x=8;x<MW-8;x+=3){const c=cl(x,y);if(!spot[c]&&open(x,y))spot[c]=[x,y]}
   const iw={};try{for(const c in spot)for(const k of KS){const [x,y]=spot[c];t.tiles.set(T0);const tl=[[0,0],[1,0]].concat(k==='oxbow'?[[2,0],[2,1]]:k==='pool'?[[0,1]]:[]).map(([a,b])=>{t.tiles[(y+b)*MW+x+a]=t.T_WATER;return(y+b)*MW+x+a});
      const q={i:y*MW+x,r:3,kind:k,big:true,tiles:tl};t.WM.ponds=k==='oasis'?[]:[q];t.WM.oases=k==='oasis'?[q]:[];WA.invalidate();iw[k+' in the '+c]=runs(q)}}
   finally{t.tiles.set(T0);t.WM.ponds=P0;t.WM.oases=O0;WA.invalidate()}
   const iv=Object.values(iw),im=Math.max(0,...iv),fmt=o=>Object.entries(o).map(([k,v])=>k+' '+v).join(', ');
   ok(own.length>=20&&ow<=6&&iv.length>=16&&im<=6,'every pond’s and oasis’s bank: no straight run of one colour along a tile’s edge longer than 6 px; the world’s '+own.length+' (longest '+ow+' px; '+fmt(by)+'), and each kind put into each climate (longest '+im+' px; '+fmt(iw)+')')}
  // (an oasis and ponds put into the world (the generator's lists): an oasis's palms and green; a pond's water a curve, no straight
  //  run of one bank colour along a tile's edge, its bank between the water's edge and the land's own ground)
  {const W0=t.WM,T0=t.tiles.slice(),best=f=>{let b=null,bs=-1e9;for(let y=8;y<MH-8;y++)for(let x=8;x<MW-8;x++){const v=f(x,y);if(v>bs){bs=v;b=[x,y]}}return bs>-1e8?b:null},cl=(x,y)=>t.CLIMS[t.climate[y*MW+x]];
   const open=(x,y,r)=>{for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++)if(t.tAt(x+a,y+b)!==t.T_OPEN||P.clear.at((x+a)*TILE+8,(y+b)*TILE+8))return false;return true};
   const oa=best((x,y)=>cl(x,y)!=='desert'||!open(x,y,4)?-1e9:-Math.abs(x-MW/2)),pd=best((x,y)=>cl(x,y)!=='grass'||!open(x,y,4)?-1e9:-Math.abs(y-MH/2));
   try{if(!oa||!pd)throw new Error('no spot for an oasis or a pond');const put=([x,y])=>{t.tiles[y*MW+x]=t.T_WATER;t.tiles[y*MW+x+1]=t.T_WATER;return[y*MW+x,y*MW+x+1]};
    t.WM.oases=[{i:oa[1]*MW+oa[0],r:3,big:true,tiles:put(oa)}];t.WM.ponds=[{i:pd[1]*MW+pd[0],r:3,kind:'hollow',tiles:put(pd)}];WA.invalidate();const P2=WA.ensure();
    const palm=new Set([0,1,2,3].map(v=>PX.worldTree('desert','palm',v,0)));let palms=0;for(const e of WA.standing((oa[0]-3)*TILE,(oa[1]-3)*TILE,(oa[0]+5)*TILE,(oa[1]+4)*TILE))if(palm.has(e.s))palms++;
    const X=(oa[0]-3)*TILE,Y=(oa[1]-3)*TILE,A=paintN(X,Y,6*TILE,6*TILE),g=(x,y)=>{const o=((y-Y)*6*TILE+x-X)*4;return A[o+1]-A[o]};let gn=0,gf=0,nn=0,nf=0;
    for(let y=Y;y<Y+6*TILE;y+=2)for(let x=X;x<X+6*TILE;x+=2){if(t.wpx(P2.wk,x,y))continue;const d=Math.hypot(x-(oa[0]+1)*TILE,y-(oa[1]+.5)*TILE)/TILE;if(d<2.2){gn+=g(x,y);nn++}else if(d>2.9){gf+=g(x,y);nf++}}
    // (the pond: its bank (land within 1-3 px of its water as drawn) along each tile's edge line, a run of one colour 6 px long at most;
    //  its mean colour within the box of the water's edge colour and the land's (some way off), 30 a channel round it)
    const PX0=(pd[0]-2)*TILE,PY0=(pd[1]-2)*TILE,Bw=5*TILE,Bp=paintN(PX0,PY0,Bw,Bw),at=(x,y)=>((y-PY0)*Bw+x-PX0)*4,wet=(x,y)=>t.wpx(P2.wk,x,y)===1;
    const bank=(x,y)=>{if(wet(x,y))return false;for(let b=-3;b<=3;b++)for(let a=-3;a<=3;a++)if(wet(x+a,y+b))return true;return false};let run=0,longest=0,curved=0,edges=0;
    for(let k=0;k<=5;k++){const e=PX0+k*TILE;for(const hz of [0,1]){let r=0,prev=null;for(let s=PY0;s<PY0+Bw;s++){const x=hz?s-PY0+PX0:e,y=hz?PY0+k*TILE:s;if(!bank(x,y)){r=0;prev=null;continue}const o=at(x,y),c=Bp[o]+','+Bp[o+1]+','+Bp[o+2];r=c===prev?r+1:1;prev=c;longest=Math.max(longest,r)}}}
    for(const [tx,ty] of [pd,[pd[0]+1,pd[1]]]){let w=0;for(let y=0;y<16;y++)for(let x=0;x<16;x++)if(wet(tx*16+x,ty*16+y))w++;edges++;if(w>40&&w<240)curved++}
    const mc=f=>{const c=[0,0,0];let n=0;for(let y=PY0;y<PY0+Bw;y++)for(let x=PX0;x<PX0+Bw;x++)if(f(x,y)){const o=at(x,y);c[0]+=Bp[o];c[1]+=Bp[o+1];c[2]+=Bp[o+2];n++}return c.map(v=>v/Math.max(1,n))};
    const cw=mc((x,y)=>wet(x,y)&&!(wet(x+2,y)&&wet(x-2,y)&&wet(x,y+2)&&wet(x,y-2))),cb=mc((x,y)=>bank(x,y)),cg=mc((x,y)=>Math.hypot(x-(pd[0]+1)*TILE,y-(pd[1]+.5)*TILE)>2*TILE&&!wet(x,y));
    const between=cb.every((v,i)=>v>=Math.min(cw[i],cg[i])-30&&v<=Math.max(cw[i],cg[i])+30);
    ok(palms>=4&&nn&&nf&&gn/nn>gf/nf+4,'an oasis put in the desert: '+palms+' date palms round it, its ground greener near the water ('+(gn/nn).toFixed(0)+' green over red, '+(gf/nf).toFixed(0)+' farther out)');
    ok(longest<=6&&curved===edges&&between,'a pond put on the grass: its water a curve ('+curved+' of its '+edges+' tiles drawn part water, part land: no square), no straight run of one bank colour along a tile’s edge (longest '+longest+' px), its bank '+cb.map(Math.round).join(',')+' between the water’s edge '+cw.map(Math.round).join(',')+' and the land '+cg.map(Math.round).join(','))}
   finally{t.tiles.set(T0);delete t.WM.oases;delete t.WM.ponds;if(t.WM!==W0)t.useWorld(W0);WA.invalidate()}}}
 // ---- the prefetch at Large and Huge: the camera walks across the middle of each world at 8x's pace, the painter
 //      given 4 ms a frame; the chunks that come into view were painted before they did, the LRU held at its cap
 {const W0=t.WM;
  try{for(const [name,s] of [['Large',{preset:'large',seed:'1'}],['Huge',{preset:'huge',seed:'1'}]]){const q=performance.now(),m=t.genWorld(s).map,gm=performance.now()-q;t.useWorld(m);
    const W=t.MW*TILE,H=t.MH*TILE,VW=t.VW,VH=t.VH,g=t.ctx,cam={x:0,y:Math.round(H/2-VH/2)},v=CS/420,cols=WA.cols;WA.cap=cap0;WA.slice=4;WA.last=null;let met=0,ready=0,over=0,frames=0,late=[];
    const view=()=>{const r=new Set();for(let cy=Math.floor(cam.y/CS);cy<=Math.floor((cam.y+VH-1)/CS);cy++)for(let cx=Math.floor(cam.x/CS);cx<=Math.floor((cam.x+VW-1)/CS);cx++)r.add(cy*cols+cx);return r};
    const end=Math.min(W-VW,6*CS),p0=performance.now();WA.draw(g,cam);
    for(;cam.x<end;frames++){cam.x=Math.min(end,Math.round((frames+1)*v));cam.y=Math.round(H/2-VH/2+Math.sin(frames/700)*CS*.6);for(const k of view())if(!WA.view.has(k)){met++;if(WA.chunks.has(k))ready++;else late.push(k)}WA.draw(g,cam);if(WA.chunks.size>WA.cap)over++}
    ok(met>=4&&ready>=met*.95&&!over,name+' ('+t.MW+' x '+t.MH+'): crossing '+(end/CS).toFixed(0)+' chunks at 8x pace with 4 ms of painting a frame, '+ready+' of the '+met+' chunks coming into view were painted before they did; never more than '+WA.cap+' kept ('+frames+' frames in '+((performance.now()-p0)/1000).toFixed(1)+' s; the world made in '+(gm/1000).toFixed(1)+' s)')}}
  finally{if(t.WM!==W0)t.useWorld(W0)}}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{WA.cap=cap0;WA.slice=slice0;WA.invalidate()}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
