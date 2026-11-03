'use strict';
// The frame timings (ui/frameprof.js; the owner, 2026-11-03: measure before optimising, on the phone): off, nothing timed and no
// readout; on (Settings → Developer tools, or perf), the readout at the top: update and draw, average and worst, the frames a second
// and the slow ones, the systems costing most; off again, gone, and every system runs as before.
Kit.suite(({ok})=>{
 const t=T,G=t.G,F=t.FRAMEPROF,FP=t.FrameProf;Kit.begin('soldier',1);Kit.world();
 ok(!F.on&&!t.Systems.timer&&!document.querySelector('.frameprof'),'off by default: no timer on the systems, no readout');
 t.showTitle('settings');ok(document.querySelector('#panel [data-act="dev-perf"]'),'Settings, Developer tools: a Frame timings button');
 t.act('dev-perf');ok(F.on&&typeof t.Systems.timer==='function','pressed: on');
 const pn=performance.now;let now=pn.call(performance);performance.now=()=>now;
 try{for(let i=0;i<40;i++){now+=16;const a=now;t.updateWorld(1/30);now+=3;const b=now;now+=5;FP.frame(b-a,now-b)}}finally{performance.now=pn}
 FP.show();const txt=document.querySelector('.frameprof')?.textContent||'';
 ok(/update \\d|update [\d.]+ \/ [\d.]+ ms · draw [\d.]+ \/ [\d.]+ ms/.test(txt)&&/frames a second/.test(txt)&&/slow/.test(txt),'its readout: update and draw, the frames a second and the slow ones');
 ok(FP.sys.size>0&&/ms a frame, worst/.test(txt),'and the systems costing most, each as it runs ('+[...FP.sys.keys()].slice(0,3).join(', ')+'…)');
 ok(t.DevConsole.execute('perf off')==='Frame timings off.'&&!F.on&&!t.Systems.timer&&!document.querySelector('.frameprof'),'perf off in the console: off, the readout gone');
 G.mode='world';G.modal=false;t.hidePanel();
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
