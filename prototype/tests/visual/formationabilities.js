'use strict';
window.RUN=()=>{
  const wedge=new URLSearchParams(location.search).get('mode')==='wedge';
  T.BattleLab.start({left:wedge?'hum_knight':'hum_foot',leftCount:16,right:'hum_levy',rightCount:12,ai:false,paused:true,morale:true,seed:42});
  const g=T.B.groups[wedge?'cav':'inf'];g.placeAt(350,300);g.face=0;if(wedge)g.setForm('wedge');else g.setFlag('shieldWall',true);
  T.grpUnits(g.id).forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy;u.dir=0});T.B.sel=g.id;T.setOrderUI();T.frame();
  const d=document.createElement('pre');d.id='OUT';d.textContent='PASS formation ability visual fixture';document.body.appendChild(d);
};
