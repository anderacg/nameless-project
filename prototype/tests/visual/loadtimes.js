'use strict';
// Not a test (run by name: -Suites visual/loadtimes -TimeoutSeconds 300): how long each long wait takes (doc/WORLD_DESIGN.md §5.2),
// so the loading overlay's 300 ms rule (loading.js) is decided from data. Each case is the median of its runs, with "overlay" past
// 300 ms. A new game and a load by their steps (session.js begin, save.js loadGame: the game put in, then the view painted); the
// first paint of the world (the chunks in view; the whole map, the blit until render.js draws by chunks); a battle's start
// (startBattle) and its first frame (the ground painted there until R15 moves it to the setup), on today's field and the sized
// fields with terrain on (as the game plays); a walk into a town's streets (its scene made, then its first frame). Headless
// Chrome on this machine: a phone is slower. (render.js draws the map by chunks, WorldArt.draw: a first world frame paints
// only the chunks in view.) Never fails.
window.RUN=()=>{const t=T,o=[],G=t.G,P=t.P,ev=s=>(0,eval)(s),now=()=>performance.now();
 const med=a=>{a=a.slice().sort((x,y)=>x-y);return a[a.length>>1]};
 const row=(name,ms,more)=>o.push('INFO '+name.padEnd(46)+(ms.toFixed(0)+' ms').padStart(9)+(ms>t.LOADING.delay?'  overlay':'         ')+(more?'  '+more:''));
 const time=(n,f)=>{const a=[];for(let i=0;i<n;i++){const q=now();f(i);a.push(now()-q)}return med(a)};
 const flush=()=>t.ctx.getImageData(0,0,1,1);
 try{window.requestAnimationFrame=()=>0;try{localStorage.clear()}catch(e){}
  o.push('INFO '+'case'.padEnd(46)+'median'.padStart(9)+'  (view '+t.VW+'x'+t.VH+', map '+t.MW+'x'+t.MH+')');
  // ---- a new game: the game put in, the view painted (begin's two steps), then the first frame
  {const put=[],paint=[],first=[];
   for(let i=0;i<3;i++){const b=t.BGS.soldier;let q=now();t.startGame('soldier',b);put.push(now()-q);G.quietEvents=true;q=now();t.paintView();paint.push(now()-q);
    G.mode='world';G.modal=false;t.hidePanel();q=now();t.drawWorld();flush();first.push(now()-q)}
   row('new game: the game put in',med(put));row('new game: the view painted (chunks in view)',med(paint));row('new game: then its first frame',med(first));
   row('new game: all of it',med(put)+med(paint)+med(first))}
  // ---- the world's paint from cold
  {const cold=()=>t.WorldArt.invalidate();
   row('world paint: the chunks in view',time(3,()=>{cold();t.paintView()}),t.WorldArt.chunks.size+' chunks');
   row('world paint: the whole map (worldCv)',time(2,()=>{cold();t.worldCv()}));
   row('world paint: first frame, cold',time(3,()=>{cold();t.drawWorld();flush()}))}
  // ---- a load: read and checked, put in, the view painted, the first frame
  {G.mode='world';t.saveGame(true,'quick');const read=[],put=[],paint=[],first=[];
   for(let i=0;i<3;i++){let q=now();const d=t.readSave('quick');t.worldFits(d.world);read.push(now()-q);q=now();t.applySave(d);put.push(now()-q);G.quietEvents=true;
    q=now();t.paintView();paint.push(now()-q);q=now();t.drawWorld();flush();first.push(now()-q)}
   row('load: the save read and checked',med(read),(localStorage.getItem(t.SAVE+'.quick').length/1024).toFixed(0)+' KB');row('load: the game put in',med(put));
   row('load: the view painted',med(paint));row('load: then its first frame',med(first));row('load: all of it',med(read)+med(put)+med(paint)+med(first))}
  // ---- battles: the setup, then the first frame (the ground painted in it, for now)
  {const keep=ev('[TERRAIN.on,FIELD_SIZES.on]'),army=n=>Array.from({length:n},(_,i)=>['militia','spearman','archer'][i%3]);
   const fight=(name,n,sized)=>{ev('TERRAIN.on=true;FIELD_SIZES.on='+sized);const set=[],first=[];
    for(let i=0;i<3;i++){Math.random=t.seeded(500+i);G.mode='world';G.modal=false;t.hidePanel();P.x=t.startHolding().x+40;P.y=t.startHolding().y+60;
     let q=now();t.startBattle({enemies:army(n),tournament:false});set.push(now()-q);q=now();t.drawBattle();flush();first.push(now()-q);
     t.fieldDone&&t.fieldDone();ev('B=null');G.mode='world'}
    row('battle '+name+': setup',med(set));row('battle '+name+': first frame (the ground)',med(first));row('battle '+name+': all of it',med(set)+med(first))};
   const r0=Math.random;try{fight('of 6, today\'s field',6,false);fight('of 6, sized',6,true);fight('of 40, sized',40,true)}finally{Math.random=r0;ev('TERRAIN.on='+keep[0]+';FIELD_SIZES.on='+keep[1])}}
  // ---- a town's streets
  {const tw=t.TOWNS.find(z=>t.hasScene(z));if(tw){const a=[],f=[];for(let i=0;i<3;i++){G.mode='town';G.town=null;let q=now();t.enterScene(tw);a.push(now()-q);q=now();t.drawScene();flush();f.push(now()-q);G.scene=null;G.mode='world'}
   row('streets of '+tw.name+': made',med(a));row('streets of '+tw.name+': first frame',med(f));row('streets: all of it',med(a)+med(f))}}
  o.push('INFO a battle\'s ground moves into its setup with R15; past 300 ms there it shows "Marching to battle…"');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
