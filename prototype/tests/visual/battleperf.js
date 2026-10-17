'use strict';
// Not a test (run by name: -Suites visual/battleperf -TimeoutSeconds 300; at HEAD's speed it takes about four minutes): battle
// simulation timings at 200/400/800/1200 soldiers. Never fails.
// Per size (BattleLab, seed 42, AI on, morale on, half infantry, a third shooters, the rest riders per side):
// 1. ms per frame (updateBattle(1/60)), no timers attached: the best of RUNS identical runs (other work on the machine only
//    adds time); fp, a fingerprint of the field after the timed frames, must not change when the simulation is only made faster.
// 2. the frame by phase: timers round the few top-level phases only (cheap); the rest is the frame's own code (at HEAD the jostle
//    is inline there), obstacles, clamps and the battle-end checks.
// 3. inclusive timers round the hot functions (nested ones overlap; the wrapping itself inflates the many small calls).
// 4. each targeting query once over every live soldier: the full scan, and with the spatial grid open (spatial.js, when loaded).
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ev=s=>(0,eval)(s),keep={validate:L.validate},wrapped=[];
 const SIZES=[200,400,800,1200],WARM=40,FRAMES=180,RUNS=2;
 // the lab caps an army at 200 for the sandbox; this report validates a scaled-down copy and puts the real counts back
 L.validate=function(raw){const c=keep.validate.call(this,{...raw,leftGroups:raw.leftGroups.map(g=>({...g,count:Math.min(g.count,20)})),rightGroups:raw.rightGroups.map(g=>({...g,count:Math.min(g.count,20)}))});
  c.leftGroups.forEach((g,i)=>g.count=raw.leftGroups[i].count);c.rightGroups.forEach((g,i)=>g.count=raw.rightGroups[i].count);return c};
 const split=(type,n)=>{const r=[];while(n>0){r.push({type,count:Math.min(100,n)});n-=100}return r};
 const army=(n,[inf,bow,cav])=>[...split(inf,Math.round(n*.5)),...split(bow,Math.round(n*.3)),...split(cav,n-Math.round(n*.5)-Math.round(n*.3))];
 const cfg=N=>({leftGroups:army(N/2,['hum_foot','hum_bow','hum_knight']),rightGroups:army(N/2,['dw_clan','dw_sling','hum_knight']),morale:true,deploy:false,paused:true,ai:true,seed:42});
 const fp=()=>{let h=2166136261;const mix=v=>{h=Math.imul(h^(v|0),16777619)>>>0};for(const u of t.B.units){mix(u.x*1e6);mix(u.y*1e6);mix(u.hp*1e3);mix(u.rout?1:0)}return h.toString(16)};
 const live=()=>t.B.units.filter(u=>u.hp>0).length;
 const begin=N=>{L.start(cfg(N));t.B.paused=false;for(let f=0;f<WARM&&!L.session.result;f++)t.updateBattle(1/60)};
 const frames=()=>{const a=performance.now();let n=0;for(;n<FRAMES&&!L.session.result;n++)t.updateBattle(1/60);return {n,ms:(performance.now()-a)/Math.max(1,n)}};
 // timers round global functions and methods (restored in finally)
 const acc={},calls={};window.__bpAcc=acc;window.__bpCalls=calls;window.__bpOrig={};
 const wrap=(FN,METH)=>{for(const name of FN){let f;try{f=ev(name)}catch(e){continue}if(typeof f!=='function')continue;__bpOrig[name]=f;
   try{ev(name+'=function(){const a=performance.now();__bpCalls["'+name+'"]++;try{return __bpOrig["'+name+'"].apply(this,arguments)}finally{__bpAcc["'+name+'"]+=performance.now()-a}}')}catch(e){continue}acc[name]=0;calls[name]=0;wrapped.push(name)}
  for(const [cls,m] of METH){let C;try{C=ev(cls)}catch(e){continue}const P=C.prototype,f=P[m],k=cls+'.'+m;acc[k]=0;calls[k]=0;P[m]=function(){const a=performance.now();calls[k]++;try{return f.apply(this,arguments)}finally{acc[k]+=performance.now()-a}};wrapped.push([P,m,f])}};
 const unwrap=()=>{for(const w of wrapped){if(Array.isArray(w))w[0][w[1]]=w[2];else ev(w+'=__bpOrig["'+w+'"]')}wrapped.length=0;for(const k of Object.keys(acc)){delete acc[k];delete calls[k]}};
 const PHASES=['command','commandCharacters','updateNonHeroActors','jostle','updateProjectiles','moraleTick','vfxStep'],PHASE_METH=[['BattleControl','step']];
 const DEEP=['aiUnit','orderedTarget','shooterTarget','crowdTarget','roomyFoe','shotStep','withdrawStep','withdrawThreat','routStep','monsterAbility','moraleView','attack','hit','applyDmg','meleeFollow','fatigueStep','obstaclePush','chargePush','shieldWallActive','battleResolves','charAuto','setOrderUI','moraleDeath','moraleHurt','unitAbility','tiredMul'];
 const DEEP_METH=[['BattleControl','targetMembers'],['BattleControl','targetRepresentative'],['BattleResolve','view'],['BattleResolve','step'],['BattleResolve','sync'],['BattleResolve','refreshState'],['BattleResolve','live'],['SpatialGrid','nearest'],['SpatialGrid','near'],['SpatialGrid','box']];
 const table=(n,min)=>Object.entries(acc).sort((x,y)=>y[1]-x[1]).filter(([k,v])=>v/n>=min).map(([k,v])=>'INFO    '+k.padEnd(34)+(v/n).toFixed(3).padStart(8)+' ms  ('+(calls[k]/n).toFixed(0)+' calls)');
 // each query once for every live soldier (pure reads: nothing on the field moves)
 const queries=grid=>{const B=t.B,us=B.units.filter(u=>u.hp>0),q=[],F={nearest:t.nearest,meleeFoe:t.meleeFoe,shooterTarget:t.shooterTarget,roomyFoe:t.roomyFoe,inspired:t.inspired,withdrawThreat:t.withdrawThreat};
  const tm=(k,f)=>{const a=performance.now();for(const u of us)f(u);q.push(k+' '+(performance.now()-a).toFixed(2))};
  const open=grid&&typeof spatialOpen==='function';if(grid&&!open)return null;if(open)ev('spatialOpen()');
  try{tm('nearest',F.nearest);tm('meleeFoe(40)',u=>F.meleeFoe(u,40));tm('shooterTarget',u=>u.s.range&&F.shooterTarget(u));tm('roomyFoe',u=>!u.s.range&&F.roomyFoe(u,null));tm('inspired',F.inspired);tm('withdrawThreat',F.withdrawThreat)}
  finally{if(open)ev('spatialClose()')}
  return q.join(', ')};
 try{
  window.requestAnimationFrame=()=>0;
  o.push('INFO '+FRAMES+' frames timed per size after '+WARM+' warm-up frames; seed 42; frame = updateBattle(1/60); spatial grid '+(typeof spatialOpen==='function'?'loaded':'absent'));
  // (fp per run: the first lab battle after the page loads plays a little differently from the same one run again, at HEAD too)
  for(const N of SIZES){let best=null;const fps=[];
   for(let r=0;r<RUNS;r++){try{begin(N);const n0=live(),f=frames(),row={units:t.B.units.length,n0,n1:live(),...f};fps.push(fp());if(!best||row.ms<best.ms)best=row}
    catch(e){o.push('INFO N='+N+' EXC '+e.message)}finally{if(L.active)L.exit()}}
   if(best)o.push('INFO N='+String(N).padEnd(5)+' live '+best.n0+'->'+best.n1+'  '+best.ms.toFixed(2).padStart(7)+' ms/frame (best of '+RUNS+')  fp '+fps.join(' '))}
  for(const N of SIZES){
   try{begin(N);wrap(PHASES,PHASE_METH);const f=frames(),sum=Object.values(acc).reduce((a,v)=>a+v,0)/f.n;
    o.push('INFO N='+N+' by phase, ms per frame (total '+f.ms.toFixed(2)+'):');o.push(...table(f.n,0));o.push('INFO    '+'rest of updateBattle'.padEnd(34)+(f.ms-sum).toFixed(3).padStart(8)+' ms');
   }catch(e){o.push('INFO N='+N+' EXC '+e.message)}finally{unwrap();if(L.active)L.exit()}}
  for(const N of [400,800,1200]){
   try{begin(N);o.push('INFO N='+N+' queries over all '+live()+' live, ms: full scan: '+queries(false));const g=queries(true);if(g)o.push('INFO N='+N+' queries, grid open: '+g);
    wrap([...PHASES,...DEEP],[...PHASE_METH,...DEEP_METH]);const f=frames();
    o.push('INFO N='+N+' inclusive, ms per frame (wrapped total '+f.ms.toFixed(2)+'):');o.push(...table(f.n,.02));
   }catch(e){o.push('INFO N='+N+' EXC '+e.message)}finally{unwrap();if(L.active)L.exit()}}
  o.push('PASS battle performance report completed');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{unwrap();L.validate=keep.validate;if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
