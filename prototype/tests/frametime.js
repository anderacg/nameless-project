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
});
