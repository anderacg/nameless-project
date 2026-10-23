'use strict';
window.RUN=()=>{try{
 T.begin('soldier');T.G.quietEvents=true;T.P.gold=2000;T.P.renown=600;T.P.comps.brann={ap:3,role:''};
 const r=T.partyRoster(T.P);r.add('hum_foot',12);const foot=r.groups[0],road=r.split(foot.id,4);r.add('hum_bow',6);const bow=r.groups.find(g=>g.type==='hum_bow');
 r.rename(foot.id,'Royal Guard');r.rename(road.id,'Road Guard');r.rename(bow.id,'Royal Archers');r.rename('hero','Commander');r.rename('comp_brann','Captain Brann');
 T.P.wounded={hum_foot:5};T.P.woundedGroups=[{id:foot.id,type:foot.type,count:3},{id:road.id,type:road.type,count:2}];r.remove(road.type,road.count,road.id);
 while(r.order[0]!==bow.id)r.move(bow.id,-1);
 T.G.mode='world';T.G.modal=false;T.hidePanel();T.updateHUD(true);
 if(new URLSearchParams(location.search).get('battle')){T.BDEPLOY.on=true;T.startBattle({enemies:Array(8).fill('hum_foot'),deploy:true});T.selectGroup('p_'+foot.id);T.frame()}
 else{T.G.char='roster';T.openChar();if(new URLSearchParams(location.search).get('edit'))T.act('army-edit',foot.id)}
 const d=document.createElement('pre');d.id='OUT';d.hidden=true;d.textContent='PASS army management visual fixture';document.body.appendChild(d);
}catch(e){const d=document.createElement('pre');d.id='OUT';d.textContent='EXC '+e.stack;document.body.appendChild(d)}};
