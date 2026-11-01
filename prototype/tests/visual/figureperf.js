'use strict';
// Not a test (run by name: -Suites visual/figureperf): what the figures cost (the owner, 2026-10-31: every figure its body and its
// gear apart, at most +0.5 ms a frame on the map and in battle). The world map with armies on the march (WORLD_BATTLE: every man
// a figure, march.js drawMarcher) at a phone's 844 x 390 @3, still and walking; a battle of 200 (BattleLab, seed 42), its sprites
// made ahead first (WARM), drawn whole (drawBattle, the simulation's own step untimed) at the field's fit and zoomed in x3; and the
// figures' pictures kept: how many and their pixels (MB at 4 bytes a pixel), with the JS heap. Each frame timed to a pixel read
// back (the canvas's drawing done). Headless Chrome draws in software (--disable-gpu): read the ratios
window.RUN=()=>{const o=[],t=T,G=t.G,P=t.P,W=t.W,L=t.BattleLab;
 const stats=ms=>{const s=[...ms].sort((a,b)=>a-b);return (ms.reduce((a,b)=>a+b,0)/ms.length).toFixed(2)+' ms  median '+s[s.length>>1].toFixed(2)+'  p90 '+s[Math.floor(s.length*.9)].toFixed(2)};
 const time=(name,warm,n,f,between)=>{const fl=()=>t.ctx.getImageData(0,0,1,1);for(let i=0;i<warm;i++){if(between)between(i);f(i);fl()}const ms=[];
   for(let i=0;i<n;i++){if(between)between(i);const a=performance.now();f(i);fl();ms.push(performance.now()-a)}o.push('INFO '+name.padEnd(34)+stats(ms))};
 // (the pictures kept: the sprite table, the held weapons, and the finished figures' LRU when there is one)
 const kept=()=>{let n=0,px=0;const add=c=>{if(c&&c.width&&c.getContext){n++;px+=c.width*c.height}};for(const k in t.spr)add(t.spr[k]);
   const w=(0,eval)('typeof WEAPONS!=="undefined"?WEAPONS:{}');for(const k in w)add(w[k]);
   const F=(0,eval)('typeof FIGURES!=="undefined"?FIGURES:null');let f='';if(F){let m=0,q=0;for(const c of F.map.values()){m++;q+=c.width*c.height}n+=m;px+=q;f=', of them '+m+' finished figures (cap '+F.cap+')'}
   const heap=performance.memory?', JS heap '+(performance.memory.usedJSHeapSize/1048576).toFixed(1)+' MB':'';return n+' pictures, '+(px*4/1048576).toFixed(2)+' MB of pixels'+f+heap};
 try{
  window.requestAnimationFrame=()=>0;t.act('begin','soldier');G.mode='world';G.modal=false;t.hidePanel();G.encCool=1e9;G.quietEvents=true;G.clock=t.DAY*.25;
  const hasVS=(0,eval)('typeof VS')!=='undefined';(0,eval)('VW=844;VH=390'+(hasVS?';VS=3':''));t.WORLD_BATTLE.on=true;
  // ---- the map: your army and four lords' about you, on open ground
  P.troops={hum_foot:12,hum_spear:12,hum_bow:10,hum_knight:6,hum_pike:6};P.comps={brann:{ap:5}};t.compInit('brann');
  let spot=null;for(let ty=12;ty<t.MH-12&&!spot;ty++)for(let tx=12;tx<t.MW-12&&!spot;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;if(t.tAt(tx,ty)===t.T_OPEN&&t.tAt(tx+3,ty)===t.T_OPEN&&t.TOWNS.every(z=>Math.hypot(z.x-x,z.y-y)>200))spot=[x,y]}
  P.x=spot[0];P.y=spot[1];P.tx=null;t.reveal();
  const lords=W.lords.filter(l=>!l.dead).slice(0,4);lords.forEach((l,i)=>{Object.assign(l,{inside:null,fight:null,x:P.x-90+i*60,y:P.y+(i%2?50:-50)});l.troops=['hum_spear','hum_spear','hum_bow','hum_knight','orc_grunt','elf_spear','dw_xbow','hum_pike','hum_foot','hum_foot']});
  t.frame();o.push('INFO map: '+t.MarchArmy.of(P).units.length+' of yours and '+lords.reduce((a,l)=>a+t.MarchArmy.of(l).units.length,0)+' of four lords marching');
  time('map, still',20,80,()=>t.frame());
  time('map, walking',20,120,i=>{const d=i%240<120?1:-1;t.walk(P,d,0,.15);for(const l of lords)t.walk(l,-d,0,.15);t.frame()});
  o.push('INFO map: kept '+kept());
  // ---- a battle of 200
  const cfg={leftGroups:[{type:'hum_foot',count:50},{type:'hum_bow',count:30},{type:'hum_knight',count:20}],rightGroups:[{type:'dw_clan',count:50},{type:'dw_sling',count:30},{type:'orc_wolf',count:20}],morale:true,deploy:false,paused:true,ai:true,seed:42};
  try{L.start(cfg);const B=t.B;B.paused=false;let k=0;while((t.WARM.q.length||t.WARM.b.length)&&k++<4000)t.warmStep();
   const step=()=>{if(!L.session.result)t.updateBattle(1/60)};for(let i=0;i<60;i++)step();
   t.camReset();time('battle 200, fit x'+B.cam.z.toFixed(2),15,90,()=>t.drawBattle(),step);
   const live=B.units.filter(u=>u.hp>0),cx=live.reduce((a,u)=>a+u.x,0)/live.length,cy=live.reduce((a,u)=>a+u.y,0)/live.length;
   B.cam.z=3;B.cam.fit=false;t.camCentre(cx,cy);time('battle 200, zoomed in x3',15,90,()=>t.drawBattle(),step);
   o.push('INFO battle: '+B.units.filter(u=>u.hp>0).length+' standing; kept '+kept())}
  finally{if(L.active)L.exit()}
  o.push('PASS figure performance report completed');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
