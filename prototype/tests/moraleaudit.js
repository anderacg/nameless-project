'use strict';
// Read-only balance diagnostic on formation resolve: lab sessions are isolated and the patched method is restored.
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],P=t.BattleResolve.prototype,original={route:P.route,death:P.death};let audit=null;
 try{
  L.start({left:'hum_levy',leftCount:100,right:'hum_levy',rightCount:100,ai:false,paused:true,morale:true,seed:42});
  const a=t.B.units.filter(u=>u.team===0),e=t.B.units.filter(u=>u.team===1);a.forEach(u=>{u.x=400;u.y=300});e.forEach(u=>{u.x=440;u.y=300});
  for(let i=0;i<90;i++){for(const u of [a[i],e[i]]){u.hp=0;t.moraleDeath(u)}if([9,39,74,89].includes(i))o.push('INFO paired casualties '+(i+1)+'% each: formation morale '+t.resolveOf(a[99]).mor.toFixed(2)+' / '+t.resolveOf(e[99]).mor.toFixed(2))}L.exit();
  P.route=function(){if(audit&&!this.routed&&this.live().length){audit.routes[this.team]++;if(!audit.first)audit.first={time:+t.B.t.toFixed(2),team:this.team,group:this.groupId,alive:[0,1].map(team=>t.B.units.filter(q=>q.team===team&&q.hp>0).length),morale:+this.mor.toFixed(2)}}return original.route.call(this)};
  P.death=function(u){if(audit&&!this.routed&&this.breakT>0)audit.breakingDeaths[this.team]++;return original.death.call(this,u)};
  for(const [kind,right,seed] of [['hum_levy','hum_levy',42],['hum_levy','hum_levy',1],['hum_foot','hum_foot',42],['hum_knight','hum_knight',42],['hum_foot','dw_berserk',42],['hum_foot','dw_berserk',1]]){
   L.start({left:kind,leftCount:100,right,rightCount:100,ai:true,paused:true,morale:true,seed});
   audit={routes:[0,0],first:null,breakingDeaths:[0,0],low:[0,0]};
   for(let i=0;i<24&&!L.session.result;i++){for(let j=0;j<20&&!L.session.result;j++){L.step(30);for(const r of t.battleResolves())audit.low[r.team]=Math.min(audit.low[r.team],r.mor)}}
   const b=t.B,stats=[0,1].map(team=>{const m=b.units.filter(u=>u.team===team&&u.hp>0),rs=t.battleResolves().filter(r=>r.team===team&&r.live().length);return {alive:m.length,routing:m.filter(u=>u.rout).length,dead:b.units.filter(u=>u.team===team&&u.hp<=0&&!u.left).length,left:b.units.filter(u=>u.team===team&&u.left).length,meanMorale:rs.length?+(rs.reduce((n,r)=>n+r.mor,0)/rs.length).toFixed(2):null}});
   o.push('INFO '+JSON.stringify({kind,right,seed,result:L.session.result,time:+b.t.toFixed(2),routes:audit.routes,firstRoute:audit.first,breakingDeaths:audit.breakingDeaths,lowestMorale:audit.low.map(v=>+v.toFixed(2)),stats}));L.exit();
   if(kind==='hum_foot'&&right==='dw_berserk'){
    o.push((audit.routes[0]>0?'PASS ':'FAIL ')+'Footmen can rout against Berserkers, seed '+seed);
    o.push((audit.first&&audit.first.team===0&&audit.first.alive[0]>=20?'PASS ':'FAIL ')+'routing begins with at least twenty Footmen still alive, seed '+seed);
   }
  }
  o.push('PASS isolated equal-strength morale audit completed');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{P.route=original.route;P.death=original.death;if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
