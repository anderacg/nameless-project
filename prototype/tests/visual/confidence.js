'use strict';
// Paused local-superiority fixture for inspecting the shared field/card/detail badge.
window.RUN=()=>{
  T.BattleLab.start({left:'hum_levy',leftCount:100,right:'hum_levy',rightCount:25,ai:false,paused:true,morale:true,seed:42});
  for(const team of [0,1])T.B.units.filter(u=>u.team===team).forEach((u,i)=>{const cols=team?5:10;u.x=365+team*90+i%cols*6;u.y=260+Math.floor(i/cols)*6});
  T.B.t=1;T.moraleTick(1);T.B.sel='inf';T.setOrderUI();T.bhudInfo();T.frame();
  const d=document.createElement('pre');d.id='OUT';d.textContent='PASS confidence badge visual fixture';document.body.appendChild(d);
};
