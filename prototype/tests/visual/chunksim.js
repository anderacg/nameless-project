'use strict';
// Not a test: what the world costs a frame on a big map (doc/WORLD_DESIGN.md §3.5; Ashmark.html?test=visual/chunksim), on a Large
// and a Huge world (seed 1): updateWorld (220 frames of .05 s, the first 20 left out) with the tiers on and off (worldobject.js
// WORLD_LOD.on), mean and 90th percentile, and its most costly systems; then the minimap's dark brought up to date after a step
// of exploring (fog.js fogMiniCv: by chunks, and the whole map as the old way did it) and the minimap's dots (render.js mapDots,
// and the old scan of worldObjects)
window.RUN=()=>{const o=[],t=T,G=t.G,P=t.P,W=t.W,pn=()=>performance.now(),L=t.WORLD_LOD;
 const stat=a=>{a=a.slice().sort((x,y)=>x-y);return (a.reduce((x,y)=>x+y,0)/a.length).toFixed(2)+' ms, p90 '+a[Math.floor(a.length*.9)].toFixed(2)};
 try{window.requestAnimationFrame=()=>0;try{localStorage.clear()}catch(e){}
  for(const preset of ['large','huge']){
   t.forgeInstall(t.genWorld({preset,seed:'1'}));t.startGame('soldier',t.BGS.soldier);G.quietEvents=true;
   o.push('== '+preset+' ('+t.MW+' x '+t.MH+' tiles): '+W.parties.length+' parties, '+W.monsters.length+' beasts, '+W.critters.length+' herds');
   for(const on of [false,true]){L.on=on;L.t=0;G.mode='world';G.modal=false;t.hidePanel();
    const S=t.Systems.of('frame'),acc=new Map();for(const s of S){const f=s.frame;acc.set(s.name,0);s.__f=f;s.frame=function(){const a=pn();try{return f.apply(this,arguments)}finally{acc.set(s.name,acc.get(s.name)+pn()-a)}}}
    const fr=[];try{for(let k=0;k<220;k++){G.encCool=1e9;if(k===20)for(const n of acc.keys())acc.set(n,0);const a=pn();t.updateWorld(.05);if(k>=20)fr.push(pn()-a);if(G.mode!=='world'){t.hidePanel();G.mode='world';G.modal=false;G.enc=null}}}
    finally{for(const s of S){s.frame=s.__f;delete s.__f}}
    o.push('updateWorld, tiers '+(on?'on ':'off')+'   '+stat(fr)+'  ('+[...acc].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n,ms])=>n+' '+(ms/200).toFixed(2)).join(', ')+')')}
   L.on=true;L.t=0;t.lodTick(.01);
   // (the minimap's dark: a step of exploring, then brought up to date; by chunks, then the whole made afresh)
   {const fogT=(whole)=>{const ms=[];for(let k=0;k<6;k++){P.x+=48;t.reveal();if(whole)(0,eval)('fogMini=null');(0,eval)('fogDirty=true;fogMiniT=-1e9');const a=pn();t.fogMiniCv();ms.push(pn()-a)}return stat(ms)};
    t.fogMiniCv();o.push('minimap dark, by chunks       '+fogT(false));o.push('minimap dark, whole (old)     '+fogT(true))}
   {const V=t.vis(),A=t.MAP_LAYER,n=200;let a=pn();for(let k=0;k<n;k++)t.mapDots(V,()=>{});const m1=(pn()-a)/n;
    a=pn();for(let k=0;k<n;k++)for(const q of t.worldObjects().filter(q=>q.mapKind in A).sort((p,r)=>A[p.mapKind]-A[r.mapKind]))q.mapDot(V);const m0=(pn()-a)/n;
    o.push('minimap dots: by the grid '+m1.toFixed(3)+' ms, the old scan '+m0.toFixed(3)+' ms')}}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 L.on=true;const d=document.createElement('pre');d.id='OUT';d.textContent=o.join('\n');document.body.appendChild(d)};
