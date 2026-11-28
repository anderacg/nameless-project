'use strict';
/* ---------- time: the one clock (doc/TIME_SPEED_DESIGN.md) ----------
   A game second is a real second at 1x, in every mode: the frame loop (main.js) hands it out in steps no longer than
   FRAME_TIME.step (core/frametime.js), to a battle as it is, to the map through map(dt).
   map(dt): the map's own seconds in dt game seconds. The map reckons in calendar time, a day DAY_SECONDS of its seconds (core.js),
   and how many of them a game second holds follows from the march's speed (core/speed.js Speed.mapRate), so a day's march covers
   the same ground at any speed on screen; day(): the game seconds of a day at 1x.
   t: the game seconds played on the map (its speed in them, none while it is paused): what the map's own animation runs on that
   is also where things are (a herd's animals, a pasture's, an army turning: world.js updateWorld, worldbattle.js openFightWorld
   pass(dt)); ms(): the same in ms.
   Evened time (TIME.even; the owner, 2026-11-28: on): the time a frame is given is the screen's own beats, not the clock's reading of
   them (tick(now): each frame the browser gives, the beat the median of the last gaps; even(s): the frame's time as whole beats,
   what the rounding leaves carried to the next), averaged over the last n frames so one late frame moves everyone a little further
   for a few frames, not far in one; a stall of more than trust beats is passed whole (the picture stood still: nothing to even).
   The steady rate (TIME.steady): at 60 frames a second, when a frame's work has been over slow of a 60th of a second for frames
   frames more often than not, the loop holds 30 (fps(): what main.js gates on), till it has been under fast of a 60th for back
   frames: a scene too heavy for 60 runs at an even 30, not wavering between them. */
const TIME={even:{on:true,n:3,trust:4,gaps:30},steady:{on:true,slow:.9,fast:.55,frames:45,back:150}};
const Time={
  t:0,beat:1/60,last:0,gap:[],err:0,win:[],hold:0,over:0,under:0,
  map(dt){return dt*Speed.mapRate()},
  day(){return DAY_SECONDS/Speed.mapRate()},
  pass(dt){this.t+=dt},
  ms(){return this.t*1000},
  tick(now){const g=(now-this.last)/1000;this.last=now;if(!(g>0)||g>.1)return;const G=this.gap;G.push(g);if(G.length>TIME.even.gaps)G.shift();
    if(G.length>=8)this.beat=clamp(G.slice().sort((a,b)=>a-b)[G.length>>1],1/240,1/30)},
  even(s){const E=TIME.even,b=this.beat;if(!E.on||!(s>0))return s;const q=Math.max(1,Math.round((s+this.err)/b))*b;this.err=clamp(s+this.err-q,-b/2,b/2);
    if(q>E.trust*b+1e-9){this.win.length=0;return q}const W=this.win;W.push(q);if(W.length>E.n)W.shift();return W.reduce((a,v)=>a+v,0)/W.length},
  reset(){this.err=0;this.win.length=0},
  // (a frame's work, ms: the steady rate's watch)
  work(ms){const S=TIME.steady,b=1000/60;if(!S.on||RENDER.fps<60){this.hold=0;this.over=this.under=0;return}
    if(!this.hold){this.over=ms>b*S.slow?this.over+1:Math.max(0,this.over-1);if(this.over>=S.frames){this.hold=30;this.over=this.under=0}}
    else{this.under=ms<b*S.fast?this.under+1:0;if(this.under>=S.back){this.hold=0;this.over=this.under=0}}},
  fps(){return this.hold||RENDER.fps}
};
