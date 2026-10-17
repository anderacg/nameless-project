'use strict';
window.RUN=()=>{
  T.BattleLab.start({left:'hum_foot',leftCount:8,right:'dw_berserk',rightCount:24,ai:false,paused:true,morale:true,seed:42});T.B.obs=[];
  for(const [id,x] of [[testGroup('inf'),350],[testGroup('e_inf'),510]]){const g=T.B.groups[id];g.placeAt(x,300);T.layForm(id);T.grpUnits(id).forEach(u=>{u.x=x+u.sx;u.y=300+u.sy;u.inSlot=true})}
  T.B.t=.1;T.moraleTick(.1);T.grpUnits(testGroup('inf')).slice(0,2).forEach(u=>{u.hp=0;T.moraleDeath(u)});T.B.t=.3;T.moraleTick(.2);T.B.sel=testGroup('inf');T.setOrderUI();T.frame();
  const d=document.createElement('pre');d.id='OUT';d.textContent='PASS morale awareness, cohesion and recent-loss HUD fixture';document.body.appendChild(d);
};
