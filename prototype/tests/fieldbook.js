'use strict';
// The live management UI: responsive frames, meaningful army values, safe choices and explicit talent spending.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,p=t.panel,scr=document.getElementById('screen'),q=s=>p.querySelector(s),qa=s=>[...p.querySelectorAll(s)];
 Kit.begin('soldier',23);Kit.clear();Kit.world();
 P.band='Grey <Company>';P.comps={brann:{ap:5,role:'scout'},elske:{ap:5,role:'surgeon'}};t.compInit('brann').lv=8;t.compInit('elske');
 P.sk.lead.lv=7;// (room for the groups: an army starts at 3 slots, your hero and companions among them, and leadership adds more: core/army.js armyGroupLimit)
 const r=t.partyRoster(P);r.add('hum_foot',12);const a=r.groups[0],b=r.split(a.id,4);r.rename(a.id,'First <Guard>');P.wounded={hum_foot:3};P.woundedGroups=[{id:a.id,type:a.type,count:3}];
 t.vitals();P.morale=63;P.bsta=24;P.gold=1000;P.tp=3;
 const world=()=>{G.mode='world';t.hidePanel()},army=()=>{world();G.char='roster';t.openChar()};
 army();ok(+q('[aria-label="Morale"]').getAttribute('aria-valuenow')===63&&Math.abs(+q('[aria-label="Stamina"]').getAttribute('aria-valuenow')-24)<1e-9,'Army bars read actual morale and band stamina');
 ok(+q('[aria-label="Fitness"]').getAttribute('aria-valuenow')===t.bandFitness().pct,'Fitness is the game fitness calculation');
 P.morale=17;P.bsta=4;t.renderChar();ok(q('[aria-label="Morale"]').getAttribute('aria-valuenow')==='17'&&q('[aria-label="Stamina"]').getAttribute('aria-valuenow')==='4','condition changes reach both bars after a refresh');
 ok(q('[data-army-group="'+a.id+'"]').textContent.includes('3 wounded')&&q('[data-army-group="'+b.id+'"]').textContent.includes('0'),'duplicate troop cards keep wounded with their originating group');
 P.hp=Math.floor(t.heroStats().hp/2);t.act('party-select','hero');const health=[...document.querySelectorAll('.fb-person-detail .uc-stat')].find(e=>e.querySelector('.uc-l').textContent==='Health');ok(health&&health.textContent.includes(P.hp+' / '+t.heroStats().hp),'the hero’s card opens its sheet: current health against maximum');P.hp=t.heroStats().hp;t.renderChar();
 ok(p.textContent.includes('Grey <Company>')&&!q('Company')&&p.textContent.includes('First <Guard>')&&!q('Guard'),'player and group names stay literal text');
 t.act('char-tab','condition');ok(G.char==='condition'&&q('.fb-condition').textContent.includes('Stamina')&&/Recruitment.*Start with 3 slots/.test(q('.fb-condition').textContent)&&!q('.fb-condition').textContent.includes('Recruitment target'),'condition page exposes recovery, supply and recruitment (its group slots; no auto-reinforce target since 696de87)');t.act('char-tab','roster');
 t.act('char-tab','passengers');P.prisoners.hum_foot=1;P.gold=0;t.renderChar();ok(q('[data-act="p-recruit"]').disabled,'prisoner recruitment uses its current eligibility quote');P.gold=1000;
 world();t.openComp('brann');t.act('party-unit-tab','role');const roles=JSON.stringify(P.comps);t.act('party-role');t.act('fb-choice','surgeon');ok(JSON.stringify(P.comps)===roles,'choosing an occupied role is only a draft');t.act('fb-cancel');ok(JSON.stringify(P.comps)===roles&&q('[data-act="party-role"]'),'Cancel returns to the character without assigning a role');
 t.act('party-role');t.act('fb-choice','surgeon');t.act('fb-apply');ok(P.comps.brann.role==='surgeon'&&!P.comps.elske.role,'Apply transfers the occupied company role once');
 const gear=JSON.stringify({inv:P.inv,gear:P.comps.brann.gear});t.act('party-comp-tab','gear');t.act('party-gear','weapon');t.act('fb-cancel');ok(JSON.stringify({inv:P.inv,gear:P.comps.brann.gear})===gear,'cancelling equipment choices preserves every item');
 world();t.openSkills('talents');t.act('tree-sel','might0');const tree=P.tree.slice(),tp=P.tp,node=q('.tnode[data-arg="might0"]');node.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));ok(P.tp===tp&&P.tree.join()===tree.join(),'double tapping a skill never spends a point');
 t.act('tree-take','might0');ok(P.tp===tp-1&&P.tree.includes('might0'),'the explicit Learn command spends exactly one point');
 t.act('tree-take','might1');t.act('sk-tab','abilities');const slots=P.slots.slice();t.act('sk-slot','1');t.act('fb-choice','whirl');t.act('fb-cancel');ok(P.slots.join()===slots.join(),'cancelling a skill-slot choice leaves the bar intact');
 t.act('sk-slot','1');t.act('fb-choice','whirl');t.act('fb-apply');ok(P.slots[1]==='whirl'&&P.slots.filter(x=>x==='whirl').length===1,'slot Apply moves an existing skill instead of duplicating it');
 t.act('sk-tab','talents');t.act('tree-list');ok(qa('[data-act="tree-list-sel"]').length===Object.keys(t.TREE).length,'List provides every skill as a keyboard and touch control');t.act('tree-list-sel','might2');{
  const svg=q('svg.tree'),points=P.tp;svg.dispatchEvent(new PointerEvent('pointerdown',{pointerId:9,clientX:120,clientY:140,button:0,bubbles:true}));window.dispatchEvent(new PointerEvent('pointermove',{pointerId:9,clientX:180,clientY:140,bubbles:true}));window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:9,bubbles:true}));q('.tnode[data-arg="might0"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));
  ok(!t.treeDrag&&!t.treePointers.size&&P.tp===points&&G.skSel==='might2','cancelled tree gestures clear pointer state and suppress accidental selection without spending');
 }t.act('tree-zin');const camera=q('svg.tree').getAttribute('viewBox');t.act('sk-close');t.openSkills('talents');ok(G.skSel==='might2'&&q('svg.tree').getAttribute('viewBox')===camera,'reopening the hero tree retains selection and camera');
 t.act('sk-close');t.openComp('brann');t.act('cm-tree');ok(G.skSel==='start','a companion opens on their own starting point');t.act('tree-list-sel','command0');t.act('sk-close');t.act('cm-tree');ok(G.skSel==='command0','companion tree selection is preserved independently');t.act('sk-map');t.openSkills('talents');ok(G.skSel==='might2','the hero tree does not inherit the companion selection');t.act('sk-close');
 world();P.inv=Array(t.INV_SIZE).fill(null);t.invAdd('mat','pelt',3);t.invAdd('gear',t.gearId('greatsword',2),1);t.invAdd('good','grain',8);t.openInv();t.act('inv-tab','equip');ok(qa('.invgrid .slot').length===1&&q('.invgrid .slot').dataset.arg==='1','bag filtering preserves the original inventory index');t.act('inv-sel','1');ok(q('.fb-item-detail').textContent.includes('Greatsword'),'a filtered item selects its real record');t.act('inv-tab','all');
 // ---- Back to the Game Menu (the owner, 2026-10-23): each Game Menu window's top level has Back on its bar's left, to the Game Menu;
 // Esc follows it, one more Esc resumes; a sub-page keeps its Back to its parent
 {const nb=()=>q('.nav [data-nav="back"]'),esc=()=>Kit.key('Escape','Escape'),menu=()=>!!nb()&&nb().dataset.act==='fb-menu'&&nb().textContent==='Back';
  for(const [n,open] of [['Army',()=>t.openChar()],['Inventory',()=>t.openInv()],['Quests',()=>t.openQuests()],['Journal',()=>t.openJournal()],['Map',()=>t.fullMapOpen()]]){
   world();open();ok(menu()&&q('.nav [data-nav="close"]'),n+': its top level’s bar, Back (to the Game Menu) on the left, the way out on the right');nb().click();ok(G.mode==='esc'&&G.esc.page==='menu'&&G.esc.mode==='world'&&G.esc.html==null,n+': Back opens the Game Menu, the window closed');
   esc();ok(G.mode==='world',n+': Esc then resumes');open();esc();ok(G.mode==='esc',n+': Esc follows it to the Game Menu');esc();ok(G.mode==='world'&&t.ov.hidden,n+': one more Esc resumes')}
  world();t.openInv();t.act('inv-more');ok(nb()&&nb().dataset.act==='inv-back'&&!menu(),'Inventory’s Details: a sub-page, Back to the bag');esc();ok(G.mode==='inv'&&!G.invMore&&menu(),'Esc: back to the bag, its Back to the Game Menu again');world()}
 const original=scr.style.cssText,inside=e=>{const b=e.getBoundingClientRect(),s=scr.getBoundingClientRect();return b.width>0&&b.height>0&&b.left>=s.left-1&&b.right<=s.right+1&&b.top>=s.top-1&&b.bottom<=s.bottom+1};
 for(const [w,h] of [[1600,900],[844,390],[390,844],[320,568]]){
  scr.style.cssText=original+';width:'+w+'px;height:'+h+'px';
  const fit=label=>{p.style.animation='none';ok(inside(p)&&p.scrollWidth<=p.clientWidth+1&&qa('.nav .btn').every(inside),label+' frame and navigation fit '+w+' × '+h);ok(!q('select'),label+' has no dropdown at '+w+' × '+h)};
  world();t.openChar();t.act('party-select','hero');fit('Hero');
  army();fit('Army');const card=q('.fb-unit'),viewport=q('.fb-unit-grid'),cr=card.getBoundingClientRect(),vr=viewport.getBoundingClientRect();ok(vr.height>=80&&cr.width>=44,'Army cards have usable space at '+w+' × '+h);
  t.act('party-select',a.id);ok(qa('.fb-inspector-acts .btn').map(b=>b.textContent).join()==='Manage Group,Development'&&qa('.fb-inspector-acts .btn').every(inside)&&!q('.fb-actions'),'Army actions (Manage Group, Development: Reinforce gone in e429a13) are in the group’s page, on screen, at '+w+' × '+h);
  world();t.openComp('brann');fit('Companion');
  world();t.openInv();fit('Inventory');ok(qa('.fb-item-actions .btn').every(inside),'item actions stay pinned at '+w+' × '+h);t.act('inv-view','equipment');const rings=qa('.fb-equipment .ring');
  const targets=rings.map(e=>e.getBoundingClientRect()),overlap=targets.some((a,i)=>targets.slice(i+1).some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top));
  ok(rings.length===10&&(w>760&&h>520||w<651||G.invView==='equipment')&&!overlap&&targets.every(r=>r.width>=44&&r.height>=44),'ten ring targets are separate and at least 44px at '+w+' × '+h);
  world();t.openSkills('talents');fit('Skills');ok(qa('.fb-node-actions .btn').every(inside),'Learn or Unlearn stays on screen at '+w+' × '+h);
  world();const town=t.townBy('Ashford'),job=t.makeQuest('supply',town);t.acceptQuest(job);t.openQuests();t.act('qw-tab','job');t.act('qw-sel','q'+job.id);fit('Journal');ok(q('.fb-qscroll .qw-acts')&&qa('.qw-acts .btn').every(inside)&&[...q('.qw-detail').querySelectorAll('button')].every(b=>b.closest('.fb-qscroll')),'journal commands sit in the quest’s page (the window’s bar its only bottom bar), on screen at '+w+' × '+h);
  {const sc=q('.fb-qscroll'),k=sc.clientHeight/p.clientHeight;ok(w>760&&h>520||k>=.5,'the quest’s page has '+Math.round(k*100)+'% of the window’s height at '+w+' × '+h)}
  t.act('qw-abandon','q'+job.id);ok(inside(q('.qw-ask'))&&qa('.qw-ask .btn').every(inside),'abandonment shows its actual cost and both choices at '+w+' × '+h);t.act('qw-keep','q'+job.id);
 }
 scr.style.cssText=original;world();
});
