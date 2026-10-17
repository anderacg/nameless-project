'use strict';
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,P=t.P,G=t.G;t.begin('soldier');G.quietEvents=true;
 const r=t.partyRoster(P);P.add('hum_foot',12);const first=r.groups[0],second=r.split(first.id,5);
 ok(first.count===7&&second.count===5&&first.id!==second.id,'split creates independently identified duplicate formations');
 ok(P.troops.hum_foot===12&&r.slots===3,'count view unchanged; hero consumes one of ten slots');
 r.add('hum_foot',2,second.id);ok(first.count===7&&second.count===7,'targeted reinforcement changes only the chosen group');
 r.remove('hum_foot',2,second.id);ok(first.count===7&&second.count===5,'targeted casualties change only their originating group');
 const secondId=second.id;
 for(let i=0;i<7;i++)r.add('hum_foot',1,'new');
 ok(r.slots===10,'ten groups including hero');
 const count=P.troops.hum_foot;
 ok(!r.split(first.id,1)&&!r.add('hum_bow',1)&&!r.add('hum_foot',1,'new')&&P.troops.hum_foot===count,'full army rejects split, new type and duplicate new group without losing troops');
 ok(r.add('hum_foot',1,secondId)===1,'full army can reinforce an existing formation');
 ok(!t.recruitment.quoteCompanion(t.townBy(t.COMPS.brann.town),'brann').ok,'companion recruitment cannot exceed the slot cap');
 const before=P.troops.hum_foot;ok(r.merge(r.groups[2].id,first.id)&&P.troops.hum_foot===before&&r.slots===9,'merge preserves headcount and frees a slot');
 P.gold=100000;P.renown=10000;G.mode='world';t.saveGame(true,'quick');const saved=JSON.parse(localStorage.getItem(t.slotKey('quick')));
 ok(saved.v===2&&saved.P.army.groups.some(g=>g.id===secondId),'current save serializes persistent duplicate IDs');
 const ids=r.groups.map(g=>g.id).join();r.merge(secondId,first.id);t.loadGame('quick');
 ok(r.groups.map(g=>g.id).join()===ids,'save/load restores group boundaries and identities');
 localStorage.setItem(t.slotKey('1'),JSON.stringify({v:1,P:{troops:{hum_foot:2}}}));ok(t.readSlot('1')===null,'legacy saves are rejected, not migrated');
 // A compact battle with duplicate infantry and duplicate archers, plus a separate companion.
 t.begin('soldier');G.quietEvents=true;P.add('hum_foot',12);const a=r.groups[0],b=r.split(a.id,6);P.add('hum_bow',8);const c=r.groups.find(g=>g.type==='hum_bow'),d=r.split(c.id,4);P.comps.brann={ap:0,role:''};
 t.startBattle({enemies:Array(12).fill('hum_foot'),deploy:false});const B=t.B,gs=t.playerGroups(),aid='p_'+a.id,bid='p_'+b.id;
 ok(gs.length===6&&gs.includes('comp_brann'),'hero, companion and each troop formation get independent battle cards');
 ok(Object.values(B.groups).every(g=>new Set(t.grpUnits(g.id).map(u=>u.type)).size===1),'every battle group is homogeneous');
 ok(t.grpUnits(aid).length===6&&t.grpUnits(bid).length===6&&B.groups[aid]!==B.groups[bid],'duplicate Footmen do not collapse into infantry');
 ok(document.querySelectorAll('.bcards [data-grp]').length===7,'HUD cards generated from actual army, plus All');
 ok(B.groups[aid].name!==B.groups[bid].name,'duplicate groups have distinguishable names');
 t.selectGroup(aid);t.setOrder('withdraw');ok(B.groups[aid].order==='withdraw'&&B.groups[bid].order==='hold','withdraw affects only the selected duplicate');
 t.setOrder('hold');t.toggleFlag('shieldWall');ok(B.groups[aid].shieldWall&&!B.groups[bid].shieldWall,'shield ability requests stay with their group');
 t.selectGroup(aid);t.setForm('loose');ok(B.groups[aid].form==='loose'&&B.groups[bid].form==='line','formations remain independent');
 t.selectGroup(aid);t.selectGroup(bid,true);ok(t.selGroups().length===2,'Shift-select supports multiple cards');
 B.ctrl={};t.ctrlGroup('3',false);ok(B.sel===gs[2],'number keys select actual army cards by default');
 t.ctrlGroup('0',true);t.selectGroup('all');t.ctrlGroup('0',false);ok(B.sel===gs[2],'control selections support the tenth key (0)');
 t.selectGroup(aid);const bx=B.groups[bid].ax;B.groups[aid].moveTo(350,220,{face:Math.PI});
 ok(B.groups[bid].ax===bx&&B.groups[aid].face===Math.PI,'movement and facing do not leak between duplicate types');
 B.auto=true;for(let i=0;i<120;i++)t.updateBattle(1/60);t.frame();
 ok(Object.values(B.groups).every(g=>Number.isFinite(g.ax)&&Number.isFinite(g.ay)),'AI and battle stepping handle arbitrary group IDs');
 ok(t.captainGroups(0).inf.length===2&&t.captainGroups(0).arc.length===2,'captain discovers all duplicate tactical roles');
 // Full end-to-end settlement: only group B falls; medicine disabled deterministically.
 G.enc={kind:'party',ref:t.bandits[0],allies:[],foes:[]};B.win=true;B.lost={hum_foot:6};B.kills=0;B.slain=[];
 for(const u of t.grpUnits(bid))u.hp=0;
 const random=Math.random;Math.random=()=>.99;try{new t.BattleResolution(B).finish()}finally{Math.random=random}
 ok(r.groups.some(g=>g.id===a.id&&g.count===6)&&!r.groups.some(g=>g.id===b.id),'battle settlement removes casualties from exact originating duplicate group');
 ok(P.troops.hum_foot===6,'campaign headcount matches surviving formation');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
