"use strict";
// Busy frames must still finish missing land, without a synchronous whole-chunk paint or a different final picture.
Kit.suite(({ok,info})=>{const t=T,A=t.WorldArt,F=t.FrameBudget;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.frame();
 const settings={live:A.liveOk,workers:t.ART_WORKERS.on,keep:t.ART_KEEP.on},cam={x:Math.floor(t.G.cam.x),y:Math.floor(t.G.cam.y)},key=Math.floor(t.P.y/t.CHUNK)*A.cols+Math.floor(t.P.x/t.CHUNK),cx=key%A.cols,cy=Math.floor(key/A.cols),cached=A.chunks.get(key);
 const hash=c=>{const pic=c.fcv||c.cv,d=pic.getContext('2d').getImageData(0,0,pic.width,pic.height).data;let h=2166136261;for(let i=0;i<d.length;i++)h=Math.imul(h^d[i],16777619);return h>>>0};
 try{
  t.ART_WORKERS.on=false;t.ART_KEEP.on=false;A.liveOk=true;
  let expected=hash(cached);if(cached.fine!==t.paintRes()){const j=A.paintJob(cx,cy,t.paintRes());t.runGen(j.gen);expected=hash(j.rec)}
  A.jobs.delete(key);A.chunks.delete(key);A.keepLive();F.begin(performance.now()-100,30);A.draw(t.ctx,cam);
  ok(!A.chunks.has(key)&&!A.jobs.has(key),'reproduction: an exhausted frame shows a placeholder and cannot start its terrain job');
  const start=performance.now();F.begin(start,30);t.paintPriority(start);const job=A.jobs.get(key);
  ok(job&&job.spent>0&&!A.chunks.has(key),'priority painting advances missing terrain before the expensive frame');
  const spent=job?.spent||0;F.begin(performance.now()-100,30);let idle=0;F.run(performance.now()-100,30,[['late paint',ms=>{idle++;A.idle(ms)}]]);
  ok(!idle&&job.spent===spent,'an exhausted frame still starts no speculative background work');
  let frames=1,max=0;while(!A.chunks.has(key)&&frames<3000){const now=performance.now();F.begin(now,30);t.paintPriority(now);max=Math.max(max,performance.now()-now);F.begin(performance.now()-100,30);F.run(performance.now()-100,30,[['late paint',ms=>A.idle(ms)]]);frames++;if(!(frames%400))Kit.progress('recovering visible terrain',{frames})}
  ok(A.chunks.has(key)&&frames>1,'missing land finishes across busy frames even when no after-render budget is available');
  ok(A.chunks.has(key)&&hash(A.chunks.get(key))===expected,'the recovered terrain matches the original painter pixel for pixel');
  info('Recovery: '+frames+' bounded slices; longest '+max.toFixed(1)+' ms');
  const queue=A.queue,step=A.step;let calls=0;A.step=()=>{calls++;return 0};A.queue=[[cx,cy]];
  try{A.prepare(0);A.prepare(4);ok(!calls,'completed terrain and zero budgets do not force additional priority painting')}finally{A.step=step;A.queue=queue}
  ok(t.worldPaintActive(),'travel keeps the world painter active');t.G.mode='esc';t.G.esc={mode:'world'};ok(t.worldPaintActive(),'the world pause menu keeps its painter alive');t.G.mode='world';t.G.esc=null;
  t.SEAMLESS.on=true;const band=t.asParty({kind:'bandits',troops:['militia'],x:t.P.x+25,y:t.P.y,cool:0});t.bandits.push(band);t.startEncounter({kind:'party',ref:band,list:band.troops.slice(),mine:true});
  ok(t.B?.world&&t.worldPaintActive(),'world combat keeps streaming terrain instead of reverting to synchronous painting');
  t.G.mode='esc';t.G.esc={mode:'battle'};ok(t.worldPaintActive(),'paused world combat also keeps the painter alive');t.G.mode='scene';ok(!t.worldPaintActive(),'separate scenes do not consume world terrain priority');t.G.mode='battle';t.G.esc=null;
  ok(!ERR.length,'busy-frame terrain streaming produces no runtime errors');
 }finally{F.end();A.liveOk=settings.live;t.ART_WORKERS.on=settings.workers;t.ART_KEEP.on=settings.keep}
});
