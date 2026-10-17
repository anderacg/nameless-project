'use strict';
window.RUN=()=>{
  T.BattleLab.start({left:'hum_levy',leftCount:8,right:'hum_levy',rightCount:8,ai:false,paused:true,morale:true,seed:42});
  for(const [id,x] of [[testGroup('inf'),400],[testGroup('e_inf'),440]]){const g=T.B.groups[id];g.placeAt(x,300);T.grpUnits(id).forEach(u=>{u.x=x+u.sx;u.y=300+u.sy})}
  T.grpUnits(testGroup('inf')).slice(0,2).forEach(u=>u.mor=-2);T.B.t=.2;T.moraleTick(.2);T.B.sel=testGroup('inf');T.setOrderUI();T.frame();
  const d=document.createElement('pre');d.id='OUT';d.textContent='PASS pending morale breaking visual fixture';document.body.appendChild(d);
};
