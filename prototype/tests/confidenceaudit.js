'use strict';
// Diagnostic only: isolated lab state, no morale tuning changes.
window.RUN=()=>{const t=T,L=t.BattleLab,o=[];
 try{
  const snapshot=label=>{const b=t.B,live=b.units.filter(t.fighting),strength=new Map(live.map(u=>[u,t.moraleStrength(u)]));
   o.push('INFO '+JSON.stringify({label,time:+b.t.toFixed(2),sides:[0,1].map(team=>{const m=b.units.filter(u=>u.team===team&&u.hp>0),f=m.filter(u=>!u.rout),pick=f.slice().sort((a,b)=>(b.confidence||0)-(a.confidence||0))[0];let sample=null;
    if(pick){let allied=0,enemy=0,weightedAllied=0,weightedEnemy=0,seenAllies=0,seenEnemies=0;for(const u of live){const d=Math.hypot(u.x-pick.x,u.y-pick.y);if(d>t.CONFIDENCE.radius||!t.moraleVisible(pick,u))continue;const s=strength.get(u)||0,w=1/(1+(d/t.AWARENESS.near)**2);if(u.team===team){allied+=s;weightedAllied+=s*w;seenAllies++}else{enemy+=s;weightedEnemy+=s*w;seenEnemies++}}
     sample={id:pick.id,confidence:+(pick.confidence||0).toFixed(3),outmatched:+(pick.outmatched||0).toFixed(3),seenAllies,seenEnemies,visibleStrengthRatio:enemy?+(allied/enemy).toFixed(3):null,weightedRatio:weightedEnemy?+(weightedAllied/weightedEnemy).toFixed(3):null}}
    return {team,live:m.length,routing:m.filter(u=>u.rout).length,confident:f.filter(u=>u.confidence>.1).length,outmatched:f.filter(u=>u.outmatched>.1).length,sameSoldierContradictions:f.filter(u=>u.confidence>.1&&u.outmatched>.1).length,totalFightingStrength:+f.reduce((n,u)=>n+(strength.get(u)||0),0).toFixed(2),sample}})}));
  };
  L.start({left:'hum_hbow',leftCount:50,right:'hum_foot',rightCount:100,ai:true,paused:true,morale:true,seed:42});snapshot('spawn');t.moraleTick(0);snapshot('initial assessment');for(let i=0;i<30&&!L.session.result;i++){L.step(60);if([0,4,9,19,29].includes(i))snapshot('battle sample '+(i+1))}o.push('INFO battle result '+(L.session.result||'still running'));L.exit();
  L.start({left:'hum_hbow',leftCount:50,right:'hum_foot',rightCount:100,ai:false,paused:true,morale:true,seed:42});t.B.obs=[];t.B.units.forEach(u=>{u.x=u.team?440:400;u.y=300});t.moraleTick(0);snapshot('all soldiers visible controlled comparison');
  o.push('PASS isolated confidence audit completed');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
