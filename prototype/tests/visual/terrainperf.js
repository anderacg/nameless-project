'use strict';
// Not a test (run by name: -Suites visual/terrainperf -TimeoutSeconds 400): battle simulation timings with terrain at 400 and 800
// soldiers, as visual/battleperf.js takes them (BattleLab, seed 42, AI on, morale on, half infantry, a third shooters, the rest
// riders per side; ms per frame of updateBattle(1/60), the best of RUNS runs after WARM frames). Grounds: none (terrain off);
// a field with nothing that blocks (hills, woods); and a cliff-mountain-river field (a sheer hill pair with ramps, a mountain
// pair, a river with a bridge and a ford). Phase 4's keys (cliff, ramps, rocks) are ignored by older code, which then times the
// same field with plain hills and wadeable water: run it on both to compare. Never fails.
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ev=s=>(0,eval)(s),keep={validate:L.validate};
 const SIZES=[400,800],WARM=40,FRAMES=240,RUNS=2;
 L.validate=function(raw){const c=keep.validate.call(this,{...raw,leftGroups:raw.leftGroups.map(g=>({...g,count:Math.min(g.count,20)})),rightGroups:raw.rightGroups.map(g=>({...g,count:Math.min(g.count,20)}))});
  c.leftGroups.forEach((g,i)=>g.count=raw.leftGroups[i].count);c.rightGroups.forEach((g,i)=>g.count=raw.rightGroups[i].count);return c};
 const split=(type,n)=>{const r=[];while(n>0){r.push({type,count:Math.min(100,n)});n-=100}return r};
 const army=(n,[inf,bow,cav])=>[...split(inf,Math.round(n*.5)),...split(bow,Math.round(n*.3)),...split(cav,n-Math.round(n*.5)-Math.round(n*.3))];
 const GROUNDS={none:'none',open:{hills:[{x:.3,y:.45,r:100,top:2},{x:.7,y:.45,r:100,top:2}],woods:[{x:.5,y:.25,r:50}]},
  cliffs:{hills:[{x:.3,y:.45,r:100,top:2,cliff:true,ramps:[0,90]},{x:.7,y:.45,r:100,top:2,cliff:true,ramps:[180,90]}],rocks:[{x:.38,y:.18,r:40},{x:.62,y:.18,r:40}],rivers:[{x:.5,crossings:[{kind:'bridge',y:.35},{kind:'ford',y:.62}]}]}};
 const cfg=(N,g)=>({leftGroups:army(N/2,['hum_foot','hum_bow','hum_knight']),rightGroups:army(N/2,['dw_clan','dw_sling','hum_knight']),morale:true,deploy:false,paused:true,ai:true,seed:42,distance:560,ground:g});
 const fp=()=>{let h=2166136261;const mix=v=>{h=Math.imul(h^(v|0),16777619)>>>0};for(const u of t.B.units){mix(u.x*1e6);mix(u.y*1e6);mix(u.hp*1e3);mix(u.rout?1:0)}return h.toString(16)};
 const live=()=>t.B.units.filter(u=>u.hp>0).length;
 try{
  window.requestAnimationFrame=()=>0;o.push('INFO '+FRAMES+' frames timed after '+WARM+' warm-up; seed 42; ms per frame = updateBattle(1/60); phase 4 '+(typeof steerDir==='function'?'present':'absent'));
  // (the page's first lab battle plays a little differently: one thrown away)
  ev('TERRAIN.on=true');try{L.start(cfg(200,'none'));}finally{if(L.active)L.exit()}
  for(const N of SIZES)for(const [name,g] of Object.entries(GROUNDS)){let best=null;const fps=[];
   for(let r=0;r<RUNS;r++){try{L.start(cfg(N,g));t.B.paused=false;for(let f=0;f<WARM&&!L.session.result;f++)t.updateBattle(1/60);const n0=live(),a=performance.now();let n=0;for(;n<FRAMES&&!L.session.result;n++)t.updateBattle(1/60);
     const row={ms:(performance.now()-a)/Math.max(1,n),n,n0,n1:live(),blocky:!!(t.B.terrain&&t.B.terrain.blocky)};fps.push(fp());if(!best||row.ms<best.ms)best=row}catch(e){o.push('INFO N='+N+' '+name+' EXC '+e.message)}finally{if(L.active)L.exit()}}
   if(best)o.push('INFO N='+String(N).padEnd(4)+' '+name.padEnd(7)+best.ms.toFixed(2).padStart(7)+' ms/frame (best of '+RUNS+', '+best.n+' frames, live '+best.n0+'->'+best.n1+(best.blocky?', blocky':'')+')  fp '+fps.join(' '))}
  o.push('PASS terrain performance report completed');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{L.validate=keep.validate;if(L.active)L.exit();try{ev('TERRAIN.on=false')}catch(e){}}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
