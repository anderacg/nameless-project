'use strict';
window.RUN=()=>{const t=T,P=t.P,G=t.G,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 t.begin('soldier');G.quietEvents=true;P.gold=10000;P.renown=1000;P.comps.brann={ap:2,role:''};
 const r=t.partyRoster(P);r.add('hum_foot',12);const a=r.groups[0];r.add('hum_bow',6);const bow=r.groups.find(g=>g.type==='hum_bow');
 P.wounded={hum_foot:3};P.woundedGroups=[{id:a.id,type:a.type,count:3}];
 const snap=()=>JSON.stringify({army:P.army,troops:P.troops,w:P.wounded,wg:P.woundedGroups}),before=snap();
 for(const n of [0,-1,1.5,12,13,NaN,Infinity])ok(!r.split(a.id,n)&&snap()===before,'split rejects invalid count '+n+' without mutation');
 const child=r.split(a.id,5);ok(a.count===7&&child.count===5&&P.troops.hum_foot===12,'exact split moves precisely five fit soldiers');
 ok(r.wounded(a.id)===3&&!r.wounded(child.id),'all pending wounded stay with the originating group');
 ok(r.order.indexOf(child.id)===r.order.indexOf(a.id)+1,'new split is ordered immediately after its parent');
 ok(r.rename(a.id,'  Royal   Guard  ')&&r.nameOf(a.id)==='Royal Guard','rename trims and normalizes whitespace');
 const named=snap();ok(!r.rename(a.id,'x'.repeat(33))&&!r.rename(a.id,'bad\nname')&&!r.rename('missing','Guard')&&snap()===named,'invalid names and IDs cannot change state');
 r.rename(child.id,'Rear Guard');ok(r.rename('hero','Commander')&&r.rename('comp_brann','Captain Brann'),'character groups can also be named');
 const order=r.order.slice(),size=P.troops.hum_foot;ok(r.move(bow.id,-1)&&r.order.indexOf(bow.id)===order.indexOf(bow.id)-1&&P.troops.hum_foot===size,'reorder changes slots, not identity or headcount');
 while(r.order[0]!==bow.id)r.move(bow.id,-1);ok(r.order[0]===bow.id&&r.order.indexOf('hero')>0,'a troop group can move ahead of the hero and companion');
 const moved=snap();ok(!r.move(bow.id,-1)&&!r.move('missing',1)&&!r.move(a.id,0)&&snap()===moved,'boundary/invalid reorder is non-mutating');
 G.mode='world';G.modal=false;t.hidePanel();G.char='party';t.openChar();
 const rows=()=>[...panel.querySelectorAll('[data-army-group]')].map(e=>e.dataset.armyGroup);
 ok(rows().join()===r.order.join(),'Party rows follow the entire persisted army order');
 ok(panel.querySelector('[data-army-group="'+a.id+'"]').textContent.includes('3 wounded'),'each live group shows its own wounded count');
 t.act('army-edit',a.id);const name=panel.querySelector('[data-army-name]');name.value='<b>Royal & "Guard"</b>';t.act('army-name-save',a.id);
 ok(r.nameOf(a.id)==='<b>Royal & "Guard"</b>'&&panel.querySelector('[data-army-group="'+a.id+'"] strong').textContent.includes('<b>')&&!panel.querySelector('[data-army-group="'+a.id+'"] strong b'),'group names are literal text, not executable HTML');
 const input=panel.querySelector('[data-army-split]');input.value='2';t.act('army-split-exact',a.id);const exact=r.groups[r.groups.length-1];
 ok(exact.count===2&&a.count===5&&!exact.name&&r.wounded(a.id)===3,'real editor splits the requested number without cloning the name or wounded');
 t.act('army-move',a.id+':-1');ok(rows().join()===r.order.join(),'actual Up/Down action refreshes the visible order');
 // Wounded-only formations stay visible and retain names on recovery.
 r.rename(child.id,'Recovering Guard');P.wounded.hum_foot+=2;P.woundedGroups.push({id:child.id,type:child.type,count:2});r.remove(child.type,child.count,child.id);t.renderChar();
 ok(panel.textContent.includes('Recovering groups')&&panel.querySelector('[data-army-group="'+child.id+'"]').textContent.includes('2 wounded'),'a completely depleted group remains visible in the recovery section');
 ok(r.nameOf(child.id)==='Recovering Guard','depleted group retains its custom name on wounded ownership');
 r.rename(child.id,'Returning Guard');r.restore(P.woundedGroups.find(w=>w.id===child.id),1);
 ok(r.groups.find(g=>g.id===child.id).name==='Returning Guard','recovered soldiers recreate their original named group');
 // Wounded companions reserve a slot but do not consume a number key until they can fight.
 t.compInit('brann').hurt=G.day+2;t.renderChar();
 const campaignOrder=r.order,available=campaignOrder.filter(id=>id!=='comp_brann').map(id=>id==='hero'?id:'p_'+id);
 t.startBattle({enemies:Array(5).fill('hum_levy'),deploy:false});const B=t.B;
 ok(t.playerGroups().join()===available.join(),'battle cards use the campaign order and omit the wounded companion');
 ok([...document.querySelectorAll('.bcards [data-grp]')].slice(1).map(e=>e.dataset.grp).join()===available.join(),'rendered card DOM follows the same order');
 B.ctrl={};t.ctrlGroup('1');ok(B.sel===available[0]&&B.sel==='p_'+bow.id,'key 1 selects the first reordered troop, not a fixed hero bucket');
 const aid='p_'+a.id;t.selectGroup(aid);t.setOrder('hold');
 const card=document.querySelector('[data-grp="'+aid+'"]');ok(card.querySelector('.cn').textContent===r.nameOf(a.id)&&!card.querySelector('.cn b'),'custom group names remain safe literal text on battle cards');
 ok(document.getElementById('bInfo').textContent.includes(r.nameOf(a.id))&&!document.getElementById('bInfo').querySelector('.bi-title b'),'selected battle details show the custom name safely');
 const last=document.getElementById('log').lastElementChild;ok(last.textContent.includes(r.nameOf(a.id))&&!last.querySelector('b'),'order messages do not interpret group names as markup');
 ok(B.groups.hero.name==='Commander','the hero group alias also reaches battle');
 // Save/load the campaign from a normal safe mode, preserving names and order.
 const saved=JSON.stringify({army:P.army,wg:P.woundedGroups});(0,eval)('B=null');G.mode='world';t.hidePanel();t.saveGame(true,'quick');t.begin('hedge');t.loadGame('quick');
 ok(JSON.stringify({army:P.army,wg:P.woundedGroups})===saved,'names, custom order and wounded metadata survive current-schema save/load');
 ok(r.rename(a.id,'')&&!r.nameOf(a.id),'empty name restores the default label');
 // Arena fights must not reconcile or materialize unrelated campaign formations.
 t.begin('soldier');P.troops={hum_foot:9};const arenaArmy=JSON.stringify(P.army);
 t.startBattle({enemies:['chief'],tournament:true,deploy:false});
 ok(JSON.stringify(P.army)===arenaArmy&&t.playerGroups().join()==='hero','tournament setup leaves the unrelated campaign roster untouched');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
