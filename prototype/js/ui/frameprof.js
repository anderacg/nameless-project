'use strict';
/* ---------- frame timings (the owner, 2026-11-03, after a code review: measure before optimising, and on the phone itself): off
   by default; on (Settings → Developer tools, or perf in the console), a small readout at the top of the screen, made again every
   FRAMEPROF.every s: a frame's update (the simulation: updateWorld, updateBattle) and draw (frame) ms, their median (one spike
   does not make the rest look slow) and worst over the last FRAMEPROF.win s, the frames a second and the slow ones (update and draw over FRAMEPROF.slow ms), and the FRAMEPROF.top
   systems costing most (core/systems.js, each one timed as it runs: frame, hour and day; ms a frame on average, its worst).
   Its hook (Systems.timer) is set only while it is on: off, nothing is timed and nothing changes. Not saved ---------- */
const FRAMEPROF={on:false,win:5,slow:33,top:5,every:.5};
const FrameProf={rows:[],sys:new Map(),el:null,shown:0,
  // (a system's run, timed: Systems.timer while on)
  time(name,f){const a=performance.now();try{return f()}finally{const s=this.sys.get(name)||[];s.push([a,performance.now()-a]);if(s.length===1)this.sys.set(name,s)}},
  // (each frame of the loop: main.js)
  frame(upd,draw){const t=performance.now(),cut=t-FRAMEPROF.win*1000;this.rows.push([t,upd,draw]);while(this.rows[0][0]<cut)this.rows.shift();
    for(const [k,s] of this.sys){while(s.length&&s[0][0]<cut)s.shift();if(!s.length)this.sys.delete(k)}
    if(t-this.shown>=FRAMEPROF.every*1000){this.shown=t;this.show()}},
  // (the readout: its lines)
  lines(){const R=this.rows,n=Math.max(1,R.length),avg=i=>{const v=R.map(r=>r[i]).sort((a,b)=>a-b);return v.length?v[v.length>>1]:0},max=i=>Math.max(0,...R.map(r=>r[i])),f=x=>x.toFixed(1);
    const span=R.length>1?(R[R.length-1][0]-R[0][0])/1000:1,slow=R.filter(r=>r[1]+r[2]>FRAMEPROF.slow).length;
    const top=[...this.sys].map(([k,s])=>[k,s.reduce((a,x)=>a+x[1],0)/n,Math.max(...s.map(x=>x[1]))]).sort((a,b)=>b[1]-a[1]).slice(0,FRAMEPROF.top);
    return ['update '+f(avg(1))+' / '+f(max(1))+' ms, draw '+f(avg(2))+' / '+f(max(2))+' ms (median / worst)',
      Math.round((R.length-1)/Math.max(.001,span))+' frames a second, '+slow+' slow (over '+FRAMEPROF.slow+' ms) in '+FRAMEPROF.win+' s',
      ...top.map(([k,a,m])=>k+': '+a.toFixed(2)+' ms a frame, worst '+f(m))]},
  show(){if(!this.el){this.el=document.createElement('div');this.el.className='frameprof';this.el.setAttribute('aria-hidden','true');document.body.appendChild(this.el)}this.el.textContent=this.lines().join('\n')},
  toggle(on=!FRAMEPROF.on){FRAMEPROF.on=!!on;Systems.timer=on?(name,f)=>this.time(name,f):null;this.rows=[];this.sys.clear();if(!on&&this.el){this.el.remove();this.el=null}return on?'Frame timings on.':'Frame timings off.'}};
