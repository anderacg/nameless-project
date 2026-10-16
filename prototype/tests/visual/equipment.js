'use strict';
// Prepared inventory and companion screens: ?test=visual/equipment&v=review&scene=inv|comp.
window.RUN=()=>{
  const t=T,P=t.P,G=t.G;window.requestAnimationFrame=()=>0;t.begin('soldier');
  const g=t.gearId;P.inv=Array(t.INV_SIZE).fill(null);P.gear.weapon=g('sword',1);P.gear.offhand=g('shield',1);
  t.invAdd('gear',g('greatsword',2),1);t.invAdd('gear',g('shield',2),1);t.invAdd('good','grain',15);
  G.mode='world';G.modal=false;t.hidePanel();
  if(new URLSearchParams(location.search).get('scene')==='comp'){
    P.comps={brann:{ap:3,role:''}};const c=t.compInit('brann');c.gear.weapon=g('greatsword',2);t.openComp('brann');
    const off=[...t.panel.querySelectorAll('.row')].find(e=>e.textContent.startsWith('Off hand:'));if(off)off.scrollIntoView({block:'center'});
  }else{t.openInv();t.invAct('inv-sel','0')}
  t.updateHUD(true);t.frame();
  const d=document.createElement('pre');d.id='OUT';d.textContent='PASS equipment screen';d.style.display='none';document.body.appendChild(d);
};
