'use strict';
// Real management screens, prepared for visual review: &scene=army|condition|companion|compskills|orders|inventory|overflow|equipment|skills|journal.
window.RUN=()=>{
 const t=T,P=t.P,G=t.G,u=new URLSearchParams(location.search),scene=u.get('scene')||'army';
 window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world();
 P.name='Bran Redhand';P.band='The Grey Company';P.gold=420;P.renown=150;P.level=4;P.tp=3;P.morale=68;P.bsta=42;
 P.comps={brann:{ap:5,role:'scout'},elske:{ap:3,role:'surgeon'}};t.compInit('brann').lv=6;t.compInit('elske');
 const r=t.partyRoster(P);r.add('hum_foot',12);const g=r.groups[0];r.rename(g.id,'Royal Guard');r.add('hum_bow',6);r.rename(r.groups[1].id,'Royal Archers');
 P.wounded={hum_foot:3};P.woundedGroups=[{id:g.id,type:g.type,count:3}];
 const gid=t.gearId;P.inv=Array(t.INV_SIZE).fill(null);P.gear.weapon=gid('sword',1);P.gear.offhand=gid('shield',1);t.invAdd('gear',gid('greatsword',2),1);t.invAdd('gear',gid('helm',2),1);t.invAdd('good','grain',15);t.invAdd('good','water',10);t.invAdd('mat','pelt',4);
 if(scene==='companion'||scene==='compskills'||scene==='orders'){t.openComp('brann');if(scene==='orders')t.act('cm-army');if(scene==='compskills'){t.compInit('brann').tp=2;t.act('party-comp-tab','skills')}}
 else if(scene==='overflow'){t.invAdd('mat','pelt',t.STACK*t.invCap());G.invTab='all';t.openInv()}
 else if(scene==='inventory'||scene==='equipment'){t.openInv();t.act('inv-sel','0');if(scene==='equipment')t.act('inv-view','equipment')}
 else if(scene==='skills'){t.openSkills('talents');t.act('tree-sel','might0');t.act('tree-focus')}
 else if(scene==='journal'){
  const town=t.townBy('Ashford'),q=t.makeQuest('supply',town);t.acceptQuest(q);t.invAdd('good',q.good,Math.floor(q.n/2));
  t.openQuests();t.act('qw-tab','job');t.act('qw-sel','q'+q.id);
 }else{G.char='party';t.openChar();if(scene==='condition')t.act('party-status')}
 t.panel.style.animation='none';t.updateHUD(true);t.frame();
 const d=document.createElement('pre');d.id='OUT';d.hidden=true;d.textContent='PASS real field-book '+scene;document.body.appendChild(d);
};
