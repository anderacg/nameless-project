'use strict';
// Real management screens, prepared for visual review: &scene=army|hero|companion|compskills|orders|troop|path|armyskills|condition|
// passengers|inventory|overflow|equipment|skills|journal (headless Chrome --screenshot at a window size; &w=&h= the screen's size).
window.RUN=()=>{
 const t=T,P=t.P,G=t.G,W=t.W,u=new URLSearchParams(location.search),scene=u.get('scene')||'army';
 window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world();
 // (&w=844&h=390: the screen that size, as a phone's)
 const size=()=>{if(u.get('w')){const e=document.getElementById('screen').style;e.width=u.get('w')+'px';e.height=u.get('h')+'px'}};size();addEventListener('resize',size);
 P.name='Bran Redhand';P.band='The Grey Company';P.gold=420;P.renown=150;P.level=4;P.xp=130;P.tp=3;P.morale=68;P.bsta=42;
 P.comps={brann:{ap:5,role:'scout'},elske:{ap:3,role:'surgeon'}};t.compInit('brann').lv=6;t.compInit('brann').xp=200;t.compInit('elske');
 const r=t.partyRoster(P);r.add('hum_foot',12);const g=r.groups[0];r.rename(g.id,'Royal Guard');r.add('hum_bow',6);r.rename(r.groups[1].id,'Royal Archers');
 P.wounded={hum_foot:3};P.woundedGroups=[{id:g.id,type:g.type,count:3}];P.txp={hum_foot:t.txpNeed('hum_foot')*5};
 const gid=t.gearId;P.inv=Array(t.INV_SIZE).fill(null);P.gear.weapon=gid('sword',1);P.gear.offhand=gid('shield',1);t.invAdd('gear',gid('greatsword',2),1);t.invAdd('gear',gid('helm',2),1);t.invAdd('good','grain',15);t.invAdd('good','water',10);t.invAdd('mat','pelt',4);
 if(scene==='companion'||scene==='compskills'||scene==='orders'){t.openComp('brann');if(scene==='orders')t.act('cm-army');if(scene==='compskills'){t.compInit('brann').tp=2;t.act('party-comp-tab','skills')}}
 else if(scene==='hero'||scene==='troop'||scene==='path'){t.openChar();t.act('char-tab','roster');t.act('party-select',scene==='hero'?'hero':g.id);if(scene==='path')t.act('party-path',g.id)}
 else if(scene==='passengers'){
  const ash=Kit.goHome('Ashford'),far=t.TOWNS.find(z=>z!==ash&&!t.hostileTo(z.owner));t.Outcome.apply({passenger:{who:'refugees',to:{town:far.name},prize:{gold:30}}},{});
  P.prisoners={hum_levy:3,orc_grunt:2};t.captureLord(W.lords[0]);t.openChar();t.act('char-tab','passengers');
 }
 else if(scene==='overflow'){t.invAdd('mat','pelt',t.STACK*t.invCap());G.invTab='all';t.openInv()}
 else if(scene==='inventory'||scene==='equipment'){t.openInv();t.act('inv-sel','0');if(scene==='equipment')t.act('inv-view','equipment')}
 else if(scene==='skills'){t.openSkills('talents');t.act('tree-sel','might0');t.act('tree-focus')}
 else if(scene==='journal'){
  const town=t.townBy('Ashford'),q=t.makeQuest('supply',town);t.acceptQuest(q);t.invAdd('good',q.good,Math.floor(q.n/2));
  t.openQuests();t.act('qw-tab','job');t.act('qw-sel','q'+q.id);
 }else{t.openChar();t.act('char-tab',scene==='armyskills'?'skills':scene==='condition'?'condition':'roster')}
 t.panel.style.animation='none';t.updateHUD(true);t.frame();
 const d=document.createElement('pre');d.id='OUT';d.hidden=true;d.textContent='PASS real field-book '+scene;document.body.appendChild(d);
};
