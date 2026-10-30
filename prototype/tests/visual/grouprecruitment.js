'use strict';
window.RUN=()=>{try{
 T.begin('soldier');T.G.quietEvents=true;T.P.gold=2000;T.P.renown=500;T.P.comps.brann={ap:3,role:''};
 const r=T.partyRoster(T.P),k=T.RACES.human.melee;r.add(k,8);const g=r.split(r.groups[0].id,4);r.add('hum_bow',4);
 const town=T.townBy('Ashford');T.P.rep[town.name]=100;town.vol=40;T.G.mode='world';T.G.modal=false;T.hidePanel();T.updateHUD(true);T.enterTown(town);
 if(new URLSearchParams(location.search).get('train')){T.rankGain(g,1e6);T.act('rec-pick',k+'>'+T.UP[k][0]);T.G.town.trainingGroup=g.id}
 else{T.G.town.pick=k;T.G.town.draftType=k;T.G.town.hireTarget=g.id;T.G.town.hireCount=5}
 T.renderTown();T.act('rec-review');T.frame();
 const d=document.createElement('pre');d.id='OUT';d.hidden=true;d.textContent='PASS group recruitment visual fixture';document.body.appendChild(d);
}catch(e){const d=document.createElement('pre');d.id='OUT';d.textContent='EXC '+e.stack;document.body.appendChild(d)}};
