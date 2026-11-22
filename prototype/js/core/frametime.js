'use strict';
// Real elapsed time is consumed in bounded steps. Returning false ends catch-up at a mode transition.
const FRAME_TIME={step:.05,catchup:.25,reserve:2,task:4};
const FrameTime={
  pending:0,
  reset(){this.pending=0},
  advance(elapsed,run){
    this.pending=Math.min(FRAME_TIME.catchup,this.pending+Math.max(0,elapsed));
    while(this.pending>1e-9){
      const dt=Math.min(FRAME_TIME.step,this.pending);this.pending-=dt;
      if(run(dt)===false){this.reset();break}
    }
  }
};
// Every speculative task shares the same deadline, including time spent by earlier tasks.
const FrameBudget={
  deadline:Infinity,
  begin(start,fps){this.deadline=start+1000/fps-FRAME_TIME.reserve},
  end(){this.deadline=Infinity},
  left(){return Math.max(0,this.deadline-performance.now())},
  run(start,fps,tasks){
    const deadline=Math.min(this.deadline,start+1000/fps-FRAME_TIME.reserve);
    for(const [name,run] of tasks){
      const left=Math.min(FRAME_TIME.task,deadline-performance.now());
      if(left<=0)break;
      if(typeof FRAMEPROF!=='undefined'&&FRAMEPROF.on)FrameProf.time(name+' (background)',()=>run(left));
      else run(left);
    }
  }
};
