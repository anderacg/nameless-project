'use strict';
// Not a test (run by name: -Suites visual/powerbalance -TimeoutSeconds 900; -Seed N runs only the Nth set): commander powers
// (commandpowers.js) in AI-on-AI lab battles between mirror armies (a commander, 20 foot, 10 spears, 12 bows, 6 riders in a wedge a
// side; Leadership 3; morale on; 450 px apart; flat ground; seeds 1-10): neither side with powers, both, only the left, only the
// right, and both in the fog (Scout too). Per set: left wins, right wins, unfinished (300 s), battle length (mean, median), the
// powers used (left / right, all battles), and the losers' survivors. Never fails.
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ev=s=>(0,eval)(s);
 const SEEDS=[1,2,3,4,5,6,7,8,9,10],CAP=300,arm=[{type:'brann',count:1},{type:'hum_foot',count:20},{type:'hum_spear',count:10},{type:'hum_bow',count:12},{type:'hum_knight',count:6,form:'wedge'}];
 const SETS=[['neither',false,false],['both',true,true],['left only',true,false],['right only',false,true],['both, fog',true,true,true],['neither, fog',false,false,true]];
 try{window.requestAnimationFrame=()=>0;t.act('begin','soldier');t.G.quietEvents=true;t.GUIDE.on=false;const pick=new URLSearchParams(location.search).get('seed');
  for(const [name,lp,rp,fog] of SETS.filter((e,i)=>pick===null||String(i)===pick)){const len=[],used={0:{},1:{}};let lw=0,rw=0,un=0,surv=[];
   for(const seed of SEEDS){t.G.mode='world';t.G.modal=false;
    L.start({leftGroups:arm,rightGroups:arm,morale:true,deploy:false,paused:true,ai:true,seed,distance:450,ground:'none',powers:lp||rp,fog:!!fog,commander:{left:lp?{group:0,lead:3}:null,right:rp?{group:0,lead:3}:null}});
    let s=0;while(!L.session.result&&t.B.t<CAP&&s++<2000)L.step(60);const res=L.session.result,B=t.B;
    for(const e of L.session.telemetry.events)if(e.type==='command_power'){const k=e.side==='left'?0:1;used[k][e.power]=(used[k][e.power]||0)+1}
    if(!res)un++;else{len.push(B.t);const left=/Left/.test(res);if(left)lw++;else rw++;surv.push(B.units.filter(u=>u.team===(left?0:1)&&u.hp>0&&!u.rout).length)}L.exit()}
   len.sort((a,b)=>a-b);const mean=len.length?len.reduce((a,b)=>a+b,0)/len.length:0,med=len.length?len[len.length>>1]:0,pw=k=>Object.entries(used[k]).map(([id,n])=>id+' '+n).join(', ')||'none';
   o.push('INFO '+name.padEnd(14)+'left '+lw+' / right '+rw+' / unfinished '+un+'; length mean '+mean.toFixed(0)+' s, median '+med.toFixed(0)+' s ('+len.map(v=>Math.round(v)).join(' ')+'); winners standing '+(surv.length?(surv.reduce((a,b)=>a+b,0)/surv.length).toFixed(1):'-')+'; powers used (left: '+pw(0)+'; right: '+pw(1)+')')}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
