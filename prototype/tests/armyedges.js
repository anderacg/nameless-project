'use strict';
window.ARENA=true;// (the battle screen's own rules, on its own field: tests/harness.js)
window.RUN=()=>{const t=T,P=t.P,G=t.G,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 t.begin('soldier');G.quietEvents=true;P.gold=10000;P.renown=10000;P.sk.lead.lv=10;// (all ten group slots: a new band starts at three)
 const r=t.partyRoster(P),town=t.townBy('Ashford');P.rep[town.name]=100;town.vol=40;
 const type=t.RACES.human.melee;r.add(type,4);const a=r.groups[0],b=r.split(a.id,2);
 G.recruitTarget=b.id;const gold=P.gold;t.recruitment.hire(town,type);
 ok(a.count===2&&b.count===3&&P.gold<gold,'actual recruitment reinforces the selected duplicate');
 G.recruitTarget='new';const slots=r.slots;t.recruitment.hire(town,type);const c=r.groups[r.groups.length-1];
 ok(r.slots===slots+1&&c.id!==a.id&&c.id!==b.id&&c.count===1,'new-group recruitment creates another group of the same type');
 t.recruitment.hire(town,type);ok(c.count===2&&r.slots===slots+1,'subsequent recruits reinforce the newly created group');
 G.mode='world';G.modal=false;G.char='roster';t.openChar();t.act('party-select',a.id);
 ok(document.querySelector('.fb-unit[data-army-group="'+a.id+'"]')&&document.querySelector('.fb-inspector [data-act=army-edit]'),'party screen exposes group cards and management');
 t.act('army-split',c.id);ok(r.groups.filter(g=>g.type===type).length===4,'actual split button creates an independent group');
 const d=r.groups[r.groups.length-1];t.act('army-merge',d.id+':'+c.id);ok(!r.groups.some(g=>g.id===d.id)&&c.count===2,'actual merge button removes only the source group');
 while(r.slots<10)r.add(type,1,'new');G.recruitTarget='new';
 const snapshot=JSON.stringify({gold:P.gold,vol:town.vol,troops:P.troops,groups:r.groups});const q=t.recruitment.hire(town,type);
 ok(!q.ok&&q.code==='groups'&&JSON.stringify({gold:P.gold,vol:town.vol,troops:P.troops,groups:r.groups})===snapshot,'full-slot recruitment rejection is atomic');
 const source=t.asParty({troops:['hum_bow','hum_bow']});const moved=t.partyRoster(source).transferTo(t.partyRoster(P),'hum_bow',2);
 ok(moved===0&&source.size===2&&!P.troops.hum_bow,'failed transfer never removes soldiers from its source');
 // Wounded return to the same duplicate, including a completely destroyed formation.
 t.begin('soldier');G.quietEvents=true;P.add('hum_foot',6);const original=r.groups[0],other=r.split(original.id,3);P.wounded={hum_foot:2};P.woundedGroups=[{id:other.id,type:'hum_foot',count:2}];r.remove('hum_foot',3,other.id);
 const random=Math.random;Math.random=()=>.99;try{t.woundedDay()}finally{Math.random=random}
 ok(r.groups.some(g=>g.id===other.id&&g.count>0)&&original.count===3,'wounded recreate their original group, not the surviving duplicate');
 const restored=r.groups.find(g=>g.id===other.id);P.woundedGroups=[{id:other.id,type:'hum_foot',count:1}];r.merge(other.id,original.id);
 ok(P.woundedGroups[0].id===original.id&&!r.groups.some(g=>g.id===other.id),'merging transfers wounded ownership to the surviving identity');
 // Every generated lord army observes its own budget; no soldiers are discarded to enforce it.
 for(const f of t.FIDS){const list=t.armyOf(f,100);ok(list.length===100&&new Set(list).size<=9,f+': generated army retains all soldiers and reserves a leader slot')}
 const lord=t.W.lords[0];lord.troops=Array(10).fill('hum_foot');const lr=t.partyRoster(lord),left=lr.groups[0],right=lr.split(left.id,4);
 G.enc={kind:'lord',ref:lord,allies:[],foes:[],list:lord.troops.slice()};t.startBattle({enemies:lord.troops.slice(),deploy:false});const B=t.B;
 const ea=B.units.find(u=>u.team===1&&u.sourceGroupId===left.id),eb=B.units.find(u=>u.team===1&&u.sourceGroupId===right.id);
 ok(ea.grp!==eb.grp&&B.groups[ea.grp].name!==B.groups[eb.grp].name,'enemy duplicate formations preserve their campaign identities');
 ea.hp=1;t.applyDmg(ea,999);ok(lr.groups.find(g=>g.id===left.id).count===5&&lr.groups.find(g=>g.id===right.id).count===4,'enemy casualties affect only their originating group');
 const eg=B.groups[eb.grp];eg.withdraw();eb.x=t.BW-200;eb.y=300;B.units.filter(u=>u.team===0).forEach(u=>u.x=20);const x=eb.x;t.withdrawStep(eb,.1);
 ok(eb.x>x&&!(B.withdrawn>0),'enemy withdrawal uses its own edge and never increments player withdrawal');
 // Source wrappers used by joined field battles retain duplicate boundaries through writeback.
 const patrol=t.asParty({pt:true,home:'Ashford',fac:'vale',troops:Array(8).fill('hum_foot')});t.W.patrols.push(patrol);
 const pr=t.partyRoster(patrol),p1=pr.groups[0],p2=pr.split(p1.id,3),force=t.forceOf(patrol);
 t.asParty(force);t.partyRoster(force).remove('hum_foot',1,p2.id);t.syncForces([force]);
 ok(pr.groups.find(g=>g.id===p1.id).count===5&&pr.groups.find(g=>g.id===p2.id).count===2,'reinforcement wrapper writeback preserves both group identities');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
