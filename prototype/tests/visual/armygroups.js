'use strict';
window.RUN=()=>{try{
  T.begin('soldier');T.G.quietEvents=true;T.P.gold=10000;T.P.renown=10000;T.P.comps.brann={ap:3,role:''};
  const r=T.partyRoster(T.P);for(const k of ['hum_foot','hum_foot','hum_foot','hum_bow','hum_bow','hum_spear','hum_knight','hum_mage'])r.add(k,6,'new');
  T.G.mode='world';T.G.modal=false;T.hidePanel();T.updateHUD(true);
  if(new URLSearchParams(location.search).get('party')){T.G.char='party';T.openChar()}
  else{T.BDEPLOY.on=true;T.startBattle({enemies:Array(12).fill('hum_foot').concat(Array(8).fill('hum_bow')),deploy:true});T.selectGroup(T.playerGroups()[2]);T.frame()}
  const d=document.createElement('pre');d.id='OUT';d.hidden=true;d.textContent='PASS ten-group visual fixture';document.body.appendChild(d);
}catch(e){const d=document.createElement('pre');d.id='OUT';d.textContent='EXC '+e.stack;document.body.appendChild(d)}};
