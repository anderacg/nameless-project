'use strict';
// The roster's inspector is the unit card (ui/unitcard.js UnitCard, the owner 2026-10-28: as Total War: Warhammer III's): the same
// actions in the same place for a hero, a companion and a troop group; only the numbers a unit has (none "not applicable"); real
// zeros; a hero's and companion's Character, Equipment and Role as tabs under it; every service command real.
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P,screen=document.getElementById('screen'),q=s=>t.panel.querySelector(s),qa=s=>[...t.panel.querySelectorAll(s)];
 window.requestAnimationFrame=()=>0;Kit.begin('soldier',31);Kit.clear();Kit.world();P.comps={brann:{ap:5,role:'scout'},elske:{ap:5,role:'surgeon'}};t.compInit('brann');t.compInit('elske');
 P.sk.lead.lv=4;const r=t.partyRoster(P);r.add('hum_foot',8);r.add('hum_bow',4);const foot=r.groups.find(g=>g.type==='hum_foot'),bow=r.groups.find(g=>g.type==='hum_bow'),ids=['hero','comp_brann',foot.id];
 const open=id=>{if(G.mode!=='char'){Kit.world();G.char='roster';t.openChar()}t.act('party-select',id);q('.fb-unit-inspector>.fb-scroll').scrollTop=0;return q('.fb-unit-inspector')};
 const stats=pane=>[...pane.querySelectorAll('.uc-stats .uc-stat')].map(e=>e.querySelector('.uc-l').textContent),stat=(pane,label)=>[...pane.querySelectorAll('.uc-stat,.uc-rank')].find(e=>e.querySelector('.uc-l').textContent===label);
 const tab=k=>q('[data-unit-tab="'+k+'"]'),scroll=()=>q('.fb-unit-inspector>.fb-scroll'),original=screen.style.cssText;
 try{for(const [w,h] of [[1280,800],[844,390],[390,844],[320,568]]){
  screen.style.cssText=original+';width:'+w+'px;height:'+h+'px';const at=w+'x'+h,rows=[];
  for(const id of ids){const pane=open(id),sc=scroll(),b=pane.getBoundingClientRect(),top=q('.fb-unit-actions').getBoundingClientRect().top;rows.push({w:b.width,y:top-b.top});
   ok(qa('.fb-unit-actions>.btn').map(e=>e.textContent).join()==='Manage Group,Development',id+' '+at+': the same management and development actions');
   ok((w<=650)===t.partyFull()&&!q('.fb-army-layout.wide'),id+' '+at+': the same responsive inspector layout');
   ok(sc.scrollWidth<=sc.clientWidth+1,id+' '+at+': no horizontal scrolling');
   ok([...pane.querySelectorAll('.uc-stat .uc-l')].every(e=>e.getBoundingClientRect().height<=20),id+' '+at+': stat labels stay on readable lines');
   ok(!/—/.test(pane.querySelector('.uc-stats').textContent),id+' '+at+': no stat shown that it does not have');
   sc.scrollTop=sc.scrollHeight;ok(sc.scrollTop+sc.clientHeight>=sc.scrollHeight-1,id+' '+at+': its end can be reached');
  }
  ok(rows.every(b=>Math.abs(b.w-rows[0].w)<1),at+': all three inspectors have matching widths');
 }}finally{screen.style.cssText=original}
 // (only what it has: a footman no missile numbers; a bowman missile, range and ammunition, and no reach or charge)
 {const f=stats(open(foot.id)),b=stats(open(bow.id));ok(['Health','Armour','Morale','Speed','Melee attack','Reach','Charge bonus','Vigor'].every(n=>f.includes(n))&&!f.includes('Missile attack')&&!f.includes('Range'),'a footman: health, armour, morale, speed, melee attack, reach, charge, vigor; no missile numbers ('+f.join(', ')+')');
  ok(['Missile attack','Range','Ammunition'].every(n=>b.includes(n))&&!b.includes('Reach')&&!b.includes('Charge bonus'),'a bowman: missile attack, range and ammunition ('+b.join(', ')+')')}
 {const pane=open(foot.id),s=t.ST.hum_foot;ok(stat(pane,'Melee attack').querySelector('.uc-v').textContent.startsWith(String(Math.round(t.meleeDmgOf(s))))&&stat(pane,'Armour').querySelector('.uc-v').textContent===String(t.armorValue(s))&&pane.querySelector('.uc-strength').textContent.includes('8 / '+t.ARMY_GROUP.units)&&!q('[data-act="party-unit-tab"]'),'a troop group: its actual attack and armour value, its strength of the group’s ten, and no tabs')}
 // the hero: real zeros, his tree, his equipment (only what he wears) and back
 let pane=open('hero');P.mp=0;P.tp=0;P.attr.int=0;t.renderChar();pane=q('.fb-unit-inspector');
 t.act('army-edit','hero');ok(q('[data-act="army-auto-reinforce"]').disabled,'hero Auto Reinforce is disabled inside Manage Group');t.act('army-edit-close');pane=q('.fb-unit-inspector');
 ok(/^0 \//.test(stat(pane,'Mana').querySelector('.uc-v').textContent),'zero hero mana is a real value');
 ok([...tab('character').querySelectorAll('.fb-stat')].find(e=>/Skill points/.test(e.textContent))?.querySelector('strong').textContent==='0','zero skill points stay readable, on the Character tab');
 q('.fb-unit-actions [data-act="open-skills"]').click();ok(G.mode==='skills'&&!G.skWho,'hero Development opens the actual hero tree');t.act('sk-close');
 t.act('party-unit-tab','gear');ok(tab('gear')&&!/Empty/.test(tab('gear').textContent),'the Equipment tab lists only what he wears');t.act('party-equipment');ok(G.mode==='inv'&&G.invView==='equipment'&&q('[data-act="party-equipment-back"]'),'hero equipment opens the equipment view with Back to Army');
 t.act('party-equipment-back');ok(G.mode==='char'&&t.partyView().sel==='hero'&&tab('gear'),'Back to Army returns to the same hero, on his Equipment tab');
 // a companion: their tree, their gear and role, cancelled choices change nothing and keep the tab
 pane=open('comp_brann');ok(qa('.fb-unit-actions [data-act="cm-tree"]').length===1&&!q('.fb-unit-actions [data-act="army-recruit"]'),'companion has one Development entry and no direct Reinforce action');
 ok(!stat(pane,'Mana')&&!stat(pane,'Stamina'),'a companion shows no campaign stamina or mana (none is kept for them)');
 q('.fb-unit-actions [data-act="cm-tree"]').click();ok(G.mode==='skills'&&G.skWho==='brann','companion Development opens their own tree');t.act('sk-close');
 t.act('party-unit-tab','gear');const before=JSON.stringify({inv:P.inv,gear:P.comps.brann.gear});t.act('party-gear','weapon');t.act('fb-cancel');
 ok(G.mode==='char'&&tab('gear')&&JSON.stringify({inv:P.inv,gear:P.comps.brann.gear})===before,'companion equipment choice cancels without changing gear or leaving the Equipment tab');
 t.act('party-unit-tab','role');const role=P.comps.brann.role;t.act('party-role');t.act('fb-choice','guide');t.act('fb-cancel');ok(tab('role')&&P.comps.brann.role===role,'role Cancel returns to the Role tab without assigning');
 t.act('party-unit-tab','character');t.act('party-comp-tab','orders');ok(tab('role')&&q('[data-cp-transfer="give"]'),'the existing orders route opens the Role tab and its real transfer controls');
 t.act('army-edit','comp_brann');ok(q('[data-army-editor="comp_brann"]')&&q('.fb-unit-actions [data-act="army-edit-close"]'),'companion Manage keeps the shared actions and real group editor');t.act('army-edit-close');
 pane=open(foot.id);t.act('army-edit',foot.id);ok(!q('[data-act="army-auto-reinforce"]').disabled,'fit troop groups can enable Auto Reinforce inside Manage Group');t.act('army-edit-close');
 q('.fb-unit-actions [data-act="party-path"]').click();ok(t.partyView().path&&q('.fb-path'),'troop Development opens its real training path');t.act('party-back');
 pane=open(bow.id);ok(stat(pane,'Range').querySelector('.uc-v').textContent===String(t.ST.hum_bow.range),'ranged troops show their real range');
 t.compInit('brann').hurt=G.day+2;pane=open('comp_brann');{const hp=stat(pane,'Health').querySelector('.uc-v').textContent;ok(/^0 \//.test(hp)&&pane.querySelector('.uc-foot span').title.includes('Est. recovery'),'a wounded companion’s health stays truthful ('+hp+'), its recovery in the upkeep’s tip')}
 t.act('party-select','hero');t.act('army-edit','hero');q('[data-army-name]').value='A very long <hero> group name';t.act('army-name-save','hero');t.act('army-edit-close');
 ok(q('.uc-name strong').textContent==='A very long <hero> group name'&&!q('.uc-name hero'),'renamed group names remain literal text on the card');
});
