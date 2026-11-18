'use strict';
// The map painted round you as you play, never a freeze (the owner, 2026-11-18: "after i walk my character to new areas it seems to
// have long load time"; gfx/worldart.js WorldArt live, standIn, ART_PACE): a chunk takes a second or more to paint, so in play (the
// game's loop running) a chunk in view not painted yet is never painted whole in the frame: the minimap's colours stand in for it
// where its land is known, it is painted a step at a time and the depth pass skips it; what the deadlines ask a frame grows as the
// view nears a chunk not painted, never past ART_PACE.most; with no loop (the tests, the wiki) a chunk is painted at once, as ever;
// a chunk painted a step at a time is the one painted at once, pixel for pixel; the start paints the ring round the view in play.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,WA=t.WorldArt,AP=t.ART_PACE;Kit.begin('soldier',1);Kit.world();G.mode='world';G.modal=false;t.drawWorld();
 const cam=()=>({x:Math.floor(G.cam.x),y:Math.floor(G.cam.y)}),inView=()=>[...WA.view],live0=WA.liveOk,idle0=WA.idleAt;
 const H=d=>{let h=2166136261;for(let i=0;i<d.length;i+=4)h=Math.imul(h^(d[i]|d[i+1]<<8|d[i+2]<<16),16777619)>>>0;return h.toString(16)};
 const pic=c=>{const v=c.fcv&&c.fr>1?c.fcv:c.cv;return H(v.getContext('2d').getImageData(0,0,v.width,v.height).data)};
 try{
  // ---- with no loop (a test's page): a chunk in view forgotten is painted at once by the next frame, as ever
  {const k=Math.floor(P.y/t.CHUNK)*WA.cols+Math.floor(P.x/t.CHUNK);WA.chunks.delete(k);WA.idleAt=-1e9;WA.draw(t.ctx,cam());ok(!WA.live()&&WA.chunks.has(k),'with no game loop a chunk in view is painted at once ('+(WA.liveOk?'loop allowed':'a test page')+', painted '+WA.chunks.has(k)+')')}
  // ---- in play: forgotten, it is not painted whole in the frame, a stand-in drawn and a job begun; the depth pass skips it
  WA.liveOk=true;const k=Math.floor(P.y/t.CHUNK)*WA.cols+Math.floor(P.x/t.CHUNK),cx=k%WA.cols,cy=(k/WA.cols)|0,c0=WA.chunks.get(k),want=pic(c0);WA.chunks.delete(k);WA.recycle(c0.cv);
  let stood=0;const si=WA.standIn;WA.standIn=function(...a){const r=si.apply(this,a);if(r)stood++;return r};
  try{WA.idleAt=performance.now();const a=performance.now();WA.draw(t.ctx,cam());const ms=performance.now()-a;
   ok(WA.live()&&!WA.chunks.has(k)&&WA.jobs.has(k)&&stood>0,'in play a chunk in view not painted yet is not painted whole in the frame: a stand-in drawn ('+stood+'), its job begun, the frame '+ms.toFixed(0)+' ms');
   const [X,Y]=WA.rect(cx,cy);let seen=0;WA.standing(X,Y,X+t.CHUNK-1,Y+t.CHUNK-1,()=>seen++,true);ok(!WA.chunks.has(k)&&seen===0,'the depth pass skips a chunk not painted yet in play (nothing of it stands in front: '+seen+' entries)');
   ok(WA.queue.length&&WA.queue[0][0]===cx&&WA.queue[0][1]===cy,'it is queued first ('+WA.queue.slice(0,3).map(q=>q.join(',')).join(' ')+')');
   ok(WA.need>0&&WA.need<=AP.most,'the deadlines ask a frame '+WA.need.toFixed(1)+' ms (at most '+AP.most+')');
   // (a frame's steps until it is painted: no step its whole painting; the chunk the same pixels as painted at once)
   let frames=0,long=0;while(!WA.chunks.has(k)&&frames<3000){WA.idleAt=performance.now();const a=performance.now();WA.draw(t.ctx,cam());WA.idle(0);long=Math.max(long,performance.now()-a);frames++}
   const c1=WA.chunks.get(k);ok(c1&&frames>1,'painted a step at a time over '+frames+' frames, the longest '+long.toFixed(0)+' ms (its work '+(WA.est|0)+' ms a chunk)');
   ok(c1&&pic(c1)===want,'the chunk painted a step at a time is the one painted at once ('+(c1?pic(c1):'none')+' and '+want+')');
   const n=stood;WA.draw(t.ctx,cam());ok(stood===n,'painted, no stand-in drawn for it again')}
  finally{WA.standIn=si}
  // ---- the deadlines: nearer a chunk not painted, more a frame
  {const c=cam(),far=k2=>{const [X,Y]=WA.rect(k2%WA.cols,(k2/WA.cols)|0);return Math.max(0,X-c.x-t.VW,c.x-X-t.CHUNK,Y-c.y-t.VH,c.y-Y-t.CHUNK)},most=AP.most;
   const ring=[];for(let y=0;y<WA.rows;y++)for(let x=0;x<WA.cols;x++){const q2=y*WA.cols+x;if(!WA.view.has(q2)&&far(q2)<t.CHUNK)ring.push(q2)}ring.sort((a,b)=>far(a)-far(b));
   if(!ring.length)info('no chunk round the view');else{const near=ring[0];WA.idleAt=-1e9;WA.chunk(near%WA.cols,(near/WA.cols)|0);const cN=WA.chunks.get(near);
    try{AP.most=1e9;WA.idleAt=performance.now();WA.vel=20;WA.chunks.delete(near);WA.draw(t.ctx,c);const nNear=WA.need;WA.chunks.set(near,cN);WA.vel=20;WA.draw(t.ctx,c);const nNone=WA.need;
     ok(nNear>nNone,'a chunk round the view not painted asks more of a frame ('+nNear.toFixed(1)+' ms, '+far(near)+' px off) than with it painted ('+nNone.toFixed(1)+')')}finally{AP.most=most}}}
  // ---- the start: the ring round the view painted in play
  {WA.invalidate();WA.liveOk=true;t.runGen(t.paintViewSteps());const x0=Math.round(t.clamp(P.x-t.VW/2,0,t.MW*t.TILE-t.VW)),y0=Math.round(t.clamp(P.y-t.VH/2,0,t.MH*t.TILE-t.VH)),C=t.CHUNK,
     c0=Math.floor(x0/C),r0=Math.floor(y0/C),c1=Math.floor((x0+t.VW-1)/C),r1=Math.floor((y0+t.VH-1)/C),nv=(c1-c0+1)*(r1-r0+1);let ring=0;
   for(let y=r0-1;y<=r1+1;y++)for(let x=c0-1;x<=c1+1;x++)if(x>=0&&y>=0&&x<WA.cols&&y<WA.rows&&!(x>=c0&&x<=c1&&y>=r0&&y<=r1)&&WA.chunks.has(y*WA.cols+x))ring++;
   ok(WA.chunks.size===nv+ring&&ring===Math.min(t.START_WARM.ring,Math.max(0,WA.capNow-nv)),'the start paints the view and the ring round it in play: '+nv+' in view, '+ring+' round it (ring '+t.START_WARM.ring+')')}
 }finally{WA.liveOk=live0;WA.idleAt=idle0}
});
