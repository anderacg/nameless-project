'use strict';
// Elapsed time, mode changes and exhausted background deadlines are independent of machine speed.
Kit.suite(({ok})=>{
 const t=T,F=t.FrameTime,B=t.FrameBudget,now0=performance.now;
 try{
  for(const fps of [60,30,20,10,5]){F.reset();let elapsed=0,max=0;
   for(let i=0;i<fps;i++)F.advance(1/fps,dt=>{elapsed+=dt;max=Math.max(max,dt)});
   ok(Math.abs(elapsed-1)<1e-8&&max<=t.FRAME_TIME.step,'at '+fps+' FPS one real second advances one simulation second, in bounded steps');
  }
  let calls=0,total=0;F.advance(12,dt=>{calls++;total+=dt});
  ok(calls===5&&Math.abs(total-.25)<1e-8,'a long stall catches up at most 250 ms, without an unbounded update loop');
  calls=0;F.advance(.2,()=>{calls++;return false});
  ok(calls===1&&F.pending===0,'an opened page or battle discards the remainder of the old mode’s catch-up');
  F.pending=.1;F.reset();ok(F.pending===0,'resuming a hidden tab resets outstanding time');
  let now=40;performance.now=()=>now;const tasks=[];
  B.run(0,30,[['one',()=>tasks.push('one')]]);
  ok(!tasks.length,'no background task starts after the frame deadline');
  now=0;B.run(0,60,[['one',ms=>{tasks.push(ms);now=20}],['two',()=>tasks.push('late')]]);
  ok(tasks.length===1&&tasks[0]===4,'one task’s elapsed work is charged before deciding whether another may start');
  tasks.length=0;now=12;B.run(0,60,[['one',ms=>tasks.push(ms)]]);
  ok(tasks.length===1&&tasks[0]>0&&tasks[0]<4,'the last task gets only the remaining budget');
  now=0;B.begin(0,60);now=20;ok(B.left()===0,'visible terrain shares the frame deadline, including time spent drawing');B.end();
  ok(B.left()===Infinity,'direct test and wiki draws keep their explicit budgets outside the game loop');
  const WA=t.WorldArt,step=WA.step;let paints=0;
  try{WA.step=()=>{paints++;return 0};WA.idle(0);ok(!paints,'zero spare time never forces a terrain paint slice')}
  finally{WA.step=step}
 }finally{performance.now=now0;F.reset();B.end()}
 // Evened time (core/time.js Time.even; doc/TIME_SPEED_DESIGN.md §3.3; the owner, 2026-11-28: on): a frame's time as whole beats of the
 // screen, averaged over the last frames; the steady rate (Time.work, Time.fps): 30 held while 60 cannot be.
 {const X=t.Time,E=t.TIME.even,S=t.TIME.steady,beat0=X.beat,fps0=t.RENDER.fps;
  try{X.beat=1/60;X.reset();const b=1/60;let sum=0,real=0,lo=1,hi=0;
   // (a steady 60 read with a few ms of noise either way: every frame the same step)
   for(let i=0;i<120;i++){const el=b+(((i*37)%7)-3)*.0008,d=X.even(el);real+=el;sum+=d;lo=Math.min(lo,d);hi=Math.max(hi,d)}
   ok(hi-lo<1e-9&&Math.abs(lo-b)<1e-9,'a steady 60 with the clock\'s noise in it: every frame given the same step ('+(lo*1000).toFixed(2)+' ms)');
   ok(Math.abs(sum-real)<=b/2+1e-9,'no time lost or made: '+(sum*1000).toFixed(1)+' ms given for '+(real*1000).toFixed(1)+' passed');
   // (one late frame in a steady 30: a little further for a few frames, not far in one)
   X.reset();const seq=[2,2,2,2,3,2,2,2,2,2].map(n=>n*b),out=seq.map(v=>X.even(v)),top=Math.max(...out),tot=out.reduce((a,v)=>a+v,0);
   ok(top<3*b-1e-9&&top<=2*b+b/E.n+1e-9&&out.filter(v=>v>2*b+1e-9).length===E.n,'one late frame at 30: its extra beat spread over '+E.n+' frames ('+out.slice(3,9).map(v=>(v*1000).toFixed(1)).join(', ')+' ms)');
   ok(Math.abs(tot-seq.reduce((a,v)=>a+v,0))<1e-9,'and all of it given by the time they have passed');
   // (a stall: the picture stood still, nothing to even)
   X.reset();X.even(2*b);const st=X.even(12*b),after=X.even(2*b);ok(Math.abs(st-12*b)<1e-9&&Math.abs(after-2*b)<1e-9,'a stall of more than '+E.trust+' beats is passed whole, the frames after it as they are');
   E.on=false;ok(X.even(.0213)===.0213,'off: the clock\'s reading as it is');E.on=true;
   // (the screen's beat: the median of the gaps between the frames the browser gives)
   X.gap.length=0;X.last=0;for(let i=1;i<=20;i++)X.tick(i*1000/120+(i%3?0:.4));ok(Math.abs(X.beat-1/120)<.0005,'the screen\'s beat measured from the frames it gives: '+(X.beat*1000).toFixed(2)+' ms on a 120 Hz screen');
   // (the steady rate)
   X.beat=1/60;X.hold=0;X.over=X.under=0;t.RENDER.fps=60;for(let i=0;i<S.frames-1;i++)X.work(16);ok(X.fps()===60,'a few heavy frames: still 60');
   for(let i=0;i<2;i++)X.work(16);ok(X.fps()===30&&X.hold===30,'frames that keep taking over '+S.slow+' of a 60th of a second: held at 30');
   for(let i=0;i<S.back-1;i++)X.work(8);ok(X.fps()===30,'still held while it has not been light for long');
   X.work(8);ok(X.fps()===60,'light for '+S.back+' frames: back to 60');
   t.RENDER.fps=30;X.work(40);ok(X.fps()===30&&!X.hold,'a rate of 30 chosen in Settings is its own: nothing held')}
  finally{X.beat=beat0;X.reset();X.hold=0;X.over=X.under=0;X.gap.length=0;t.RENDER.fps=fps0}}
});
