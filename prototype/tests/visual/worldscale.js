'use strict';
// Not a test (run by name: -Suites visual/worldscale -TimeoutSeconds 600; -Seed N runs only the Nth preset, 0 Normal, 1 Large,
// 2 Huge): what a world costs at each preset (doc/WORLD_DESIGN.md §3, §14.2), on seed s1, beside §3's targets. Generation: each
// stage's time and the typed arrays it makes (the working fields, the flood queues, the layers: their bytes counted as they are
// made, MB, each stage's and all; freed as it goes, so the peak is below the sum: performance.memory does not move in headless
// Chrome to show it); the world put
// in (installWorld and its borders), the start (the session, the sites, the bands) and the first lands painted (begin's steps);
// the tile layers' memory; the paint plan and a chunk painted from cold (median and slowest of 12 round the start); the router (200
// trips between random holdings: Router.days, the median and slowest, the graph's and the local searches' share); updateWorld per
// frame (median and 95th percentile of 200 at 0.05 s, after 20 to settle) with the entities on the map; the day's jobs (dayTick,
// all at once: the summed cost); the save, plain JSON and gzipped (CompressionStream, base64), and 7 slots of it. Never fails.
window.RUN=async()=>{const t=T,o=[],G=t.G,W=t.W,now=()=>performance.now(),info=m=>o.push('INFO '+m);
 const med=a=>{a=a.slice().sort((x,y)=>x-y);return a[a.length>>1]},pc=(a,q)=>{a=a.slice().sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor(a.length*q))]};
 const MB=b=>(b/1048576).toFixed(1)+' MB',KB=b=>(b/1024).toFixed(0)+' KB',ms=v=>v.toFixed(v<10?2:0)+' ms';
 // (the bytes of every typed array made while fn runs; fn(n): those made so far)
 const made=fn=>{const K=['Float64Array','Float32Array','Int32Array','Uint32Array','Int16Array','Uint16Array','Int8Array','Uint8Array','Uint8ClampedArray'],keep={};let n=0;
  for(const k of K){keep[k]=window[k];window[k]=new Proxy(keep[k],{construct(T,a,nt){const v=Reflect.construct(T,a,nt);n+=v.byteLength;return v}})}
  try{fn(()=>n)}finally{for(const k of K)window[k]=keep[k]}return n};
 // §3.5, §3.7, §3.8's targets (desktop; headless here)
 const AIM={normal:{gen:2000,peak:12,frame:2,day:25,save:320,gz:60},large:{gen:4500,peak:25,frame:2,day:35,save:480,gz:90},huge:{gen:12000,peak:65,frame:2.5,day:60,save:950,gz:180}};
 const pick=new URLSearchParams(location.search).get('seed'),presets=['normal','large','huge'].filter((p,i)=>pick===null||String(i)===pick);
 try{window.requestAnimationFrame=()=>0;try{localStorage.clear()}catch(e){}
  for(const preset of presets){const A=AIM[preset],S={preset,seed:'s1'};
   // ---- generation, stage by stage, the typed arrays it makes counted
   const stg=[];let r=null,gen=0;
   const bytes=made(n=>{const g0=now();for(const st of t.genWorldSteps(S)){const a=now(),b=n(),it=st.run();let v;while(!(v=it.next()).done);r=v.value;stg.push(st.id+' '+(now()-a).toFixed(0)+' ms '+((n()-b)/1048576).toFixed(1)+' MB')}gen=now()-g0});
   const m=r.map;
   info(preset+' ('+m.w+' x '+m.h+', '+(m.w*m.h).toLocaleString('en')+' tiles): generated in '+ms(gen)+' (aim '+A.gen+' ms on a desktop): '+stg.join(', ')+'; typed arrays made '+MB(bytes)+' in all (aim: a peak of '+A.peak+' MB)');
   // ---- put in, started, painted (begin's steps after the generator's)
   let q=now();t.forgeInstall(r);const put=now()-q;q=now();t.startGame('soldier',t.BGS.soldier);G.quietEvents=true;const start=now()-q;q=now();t.paintView();const paint=now()-q;
   const lay=t.MAP_LAYERS.reduce((a,k)=>a+m[k].byteLength,0);
   info(preset+': put in (its borders) '+ms(put)+', the start '+ms(start)+', the first lands painted '+ms(paint)+'; its tile layers '+MB(lay)+', the way graph '+(m.graph?m.graph.n+' nodes':'none'));
   // ---- painting: the plan, then chunks from cold round the start
   {t.WorldArt.invalidate();q=now();t.WorldArt.ensure();const plan=now()-q,ccx=Math.floor(t.P.x/t.CHUNK),ccy=Math.floor(t.P.y/t.CHUNK),c=[];
    for(let dy=-1;dy<=1;dy++)for(let dx=-2;dx<=1;dx++){const cx=ccx+dx,cy=ccy+dy;if(cx<0||cy<0||cx>=t.WorldArt.cols||cy>=t.WorldArt.rows)continue;q=now();t.WorldArt.chunk(cx,cy);c.push(now()-q)}
    const B=t.WorldArt.bytes();info(preset+': painting: the plan '+ms(plan)+' ('+MB(B.plan)+'); a chunk from cold '+ms(med(c))+' (median of '+c.length+'), slowest '+ms(Math.max(...c))+'; '+t.WorldArt.cols*t.WorldArt.rows+' chunks in the world, '+t.WorldArt.chunks.size+' held ('+MB(B.chunks)+')')}
   // ---- the router: trips between random holdings
   {const R=t.seeded(7),TW=t.TOWNS,s0=t.Router.stats(),T2=[];let far=0;
    for(let k=0;k<200;k++){const a=TW[Math.floor(R()*TW.length)],b=TW[Math.floor(R()*TW.length)];q=now();const d=t.Router.days(a,b);T2.push(now()-q);if(d>far&&d<Infinity)far=d}
    const s1=t.Router.stats(),gm=(s1.graphMs||0)-(s0.graphMs||0),lm=(s1.localMs||0)-(s0.localMs||0);
    info(preset+': the router: 200 trips between holdings, '+ms(med(T2))+' each (median), slowest '+ms(Math.max(...T2))+', the longest '+far.toFixed(1)+' days'+(m.graph?'; the graph '+ms(gm)+', the local searches '+ms(lm)+', '+((s1.hits||0)-(s0.hits||0))+' of '+((s1.queries||0)-(s0.queries||0))+' from the pair cache':''))}
   // ---- the world's frame, and its day
   {G.mode='world';G.modal=false;t.hidePanel();G.encCool=1e9;const f=[];for(let k=0;k<220;k++){q=now();t.updateWorld(.05);if(k>=20)f.push(now()-q);if(G.mode!=='world'){t.hidePanel();G.mode='world';G.modal=false;G.enc=null}}
    const ents=W.parties.length+W.monsters.length+W.critters.length+W.ships.length+W.folk.length;
    const d=[];for(let k=0;k<3;k++){q=now();t.dayTick();d.push(now()-q)}
    info(preset+': updateWorld '+ms(med(f))+' a frame (median), '+ms(pc(f,.95))+' at the 95th percentile (aim '+A.frame+' ms), '+ents+' on the map ('+W.parties.length+' parties, '+W.monsters.length+' beasts, '+W.critters.length+' herds, '+W.ships.length+' ships, '+W.folk.length+' folk); the day\'s jobs '+ms(med(d))+' (aim '+A.day+' ms, sliced)')}
   // ---- the save: plain, gzipped, 7 slots
   {t.hidePanel();G.mode='world';G.modal=false;G.enc=null;t.saveGame(true,'quick');const js=localStorage.getItem(t.slotKey('quick'))||'';let gz='';try{gz=await t.gzip64(js)}catch(e){}
    info(preset+': the save '+KB(js.length)+' plain (aim '+A.save+' KB), '+(gz?KB(gz.length)+' gzipped, base64 (aim '+A.gz+' KB)':'gzip unavailable')+'; 7 slots '+(js.length*7/1048576).toFixed(1)+' MB plain'+(gz?', '+(gz.length*7/1048576).toFixed(2)+' MB gzipped':'')+' (localStorage about 5 MB)');
    try{localStorage.clear()}catch(e){}}}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
