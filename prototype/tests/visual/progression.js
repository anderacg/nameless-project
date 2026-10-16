'use strict';
// Prepared recruitment and talent screens: ?test=visual/progression&v=review&scene=recruit|talents|companion.
window.RUN=()=>{
  const t=T,P=t.P,G=t.G;window.requestAnimationFrame=()=>0;t.begin('soldier');G.quietEvents=true;
  const scene=new URLSearchParams(location.search).get('scene'),ash=t.townBy('Ashford');P.gold=1000;P.troops={hum_levy:3};P.txp={hum_levy:t.txpNeed('hum_levy')};P.rep[ash.name]=90;ash.vol=5;
  G.mode='world';G.modal=false;t.hidePanel();
  if(scene==='recruit'){t.enterTown(ash);G.town.pick='hum_levy>hum_spear';t.renderTown()}
  else if(scene==='companion'){
    P.comps={brann:{ap:3,role:''}};const c=t.compInit('brann');t.charKit(t.charOf(c,'brann'));c.tp=3;t.openComp('brann');t.openSkills('talents','brann');t.skillsAct('tree-sel','might1');
  }else{P.tp=5;t.takeNodeOf(P,'might0',true);t.takeNodeOf(P,'might1',true);t.openSkills('talents');t.skillsAct('tree-sel','might1')}
  t.updateHUD(true);t.frame();const d=document.createElement('pre');d.id='OUT';d.textContent='PASS progression screen';d.style.display='none';document.body.appendChild(d);
};
