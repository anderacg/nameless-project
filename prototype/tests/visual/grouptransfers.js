'use strict';
window.RUN=()=>{try{
 const t=T,P=t.P,G=t.G;t.begin('soldier');G.quietEvents=true;P.renown=1000;P.comps.brann={ap:5,role:''};const c=t.compInit('brann');c.lv=8;
 const r=t.partyRoster(P);r.add('hum_foot',12);const a=r.groups[0],b=r.split(a.id,6);r.rename(a.id,'Royal Guard');r.rename(b.id,'Forest Watch');b.form='loose';b.files=3;
 P.wounded={hum_foot:2};P.woundedGroups=[{id:b.id,type:b.type,count:2}];
 c.party=t.asParty({cid:'brann',x:P.x+10,y:P.y,troops:Array(6).fill('hum_foot'),order:'follow',cool:0});const peer=t.partyRoster(c.party),first=peer.groups[0],second=peer.split(first.id,3);peer.rename(first.id,'Oak Guard');peer.rename(second.id,'Pine Guard');
 G.mode='world';G.modal=false;t.hidePanel();t.updateHUD(true);t.openComp('brann');
 Object.assign(G.compTransfer.give,{source:b.id,target:'new',count:6});t.renderComp();t.act('cm-transfer-review','give');t.act('cm-army');
 const d=document.createElement('pre');d.id='OUT';d.hidden=true;d.textContent='PASS group transfer visual fixture';document.body.appendChild(d);
}catch(e){const d=document.createElement('pre');d.id='OUT';d.textContent='EXC '+e.stack;document.body.appendChild(d)}};
