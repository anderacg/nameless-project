'use strict';
// The roster's three kinds share structure and geometry, with real zeros and explicit unavailable fields; service commands stay real.
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P,screen=document.getElementById('screen'),q=s=>t.panel.querySelector(s),qa=s=>[...t.panel.querySelectorAll(s)];
 window.requestAnimationFrame=()=>0;Kit.begin('soldier',31);Kit.clear();Kit.world();P.comps={brann:{ap:5,role:'scout'},elske:{ap:5,role:'surgeon'}};t.compInit('brann');t.compInit('elske');
 const r=t.partyRoster(P);r.add('hum_foot',8);r.add('hum_bow',4);const foot=r.groups.find(g=>g.type==='hum_foot'),bow=r.groups.find(g=>g.type==='hum_bow'),ids=['hero','comp_brann',foot.id];
 const open=id=>{if(G.mode!=='char'){Kit.world();G.char='roster';t.openChar()}t.act('party-select',id);q('.fb-unit-inspector>.fb-scroll').scrollTop=0;return q('.fb-unit-inspector')};
 const section=k=>q('[data-unit-section="'+k+'"]'),field=(box,label)=>[...box.querySelectorAll('.fb-stat')].find(e=>e.querySelector('span')?.textContent===label),scroll=()=>q('.fb-unit-inspector>.fb-scroll');
 const original=screen.style.cssText;
 try{for(const [w,h] of [[1280,800],[844,390],[390,844],[320,568]]){
  screen.style.cssText=original+';width:'+w+'px;height:'+h+'px';const at=w+'x'+h,rows=[];
  for(const id of ids){const pane=open(id),sc=scroll(),b=pane.getBoundingClientRect(),top=q('.fb-unit-actions').getBoundingClientRect().top;
   rows.push({w:b.width,y:top-b.top,fields:[...pane.querySelectorAll('[data-unit-fields="combat"] .fb-stat>span')].map(e=>e.textContent).join(),sections:[...pane.querySelectorAll('[data-unit-section]')].map(e=>e.dataset.unitSection).join()});
   ok(qa('.fb-unit-actions>.btn').map(e=>e.textContent).join()==='Manage group,Reinforce,Development',id+' '+at+': the same three action positions and labels');
   ok((w<=650)===t.partyFull()&&!q('.fb-army-layout.wide')&&!q('[data-act="party-comp-tab"]'),id+' '+at+': the same responsive inspector layout, no companion tabs');
   ok(sc.scrollWidth<=sc.clientWidth+1,id+' '+at+': no horizontal scrolling');
   ok([...pane.querySelectorAll('[data-unit-fields="combat"] .fb-stat>span')].every(e=>e.getBoundingClientRect().height<=20),id+' '+at+': combat labels stay on readable lines');
   for(const d of pane.querySelectorAll('[data-unit-section]'))d.open=true;
   ok(sc.scrollWidth<=sc.clientWidth+1,id+' '+at+': all expanded sections fit the narrow inspector');
   sc.scrollTop=sc.scrollHeight;const last=sc.lastElementChild.lastElementChild.getBoundingClientRect(),sb=sc.getBoundingClientRect();ok(last.bottom<=sb.bottom+1&&last.top>=sb.top-1,id+' '+at+': last section can be reached');
  }
  ok(rows.every(b=>Math.abs(b.w-rows[0].w)<1&&Math.abs(b.y-rows[0].y)<1),at+': all three inspectors have matching widths and action-row position');
  ok(rows.every(b=>b.fields===rows[0].fields&&b.sections===rows[0].sections),at+': the same combat fields and expandable sections, in the same order');
 }}finally{screen.style.cssText=original}
 let pane=open('hero');P.mp=0;P.tp=0;P.attr.int=0;t.renderChar();pane=q('.fb-unit-inspector');
 ok(q('.fb-unit-actions [data-act="army-recruit"]').disabled&&q('.fb-unit-actions [data-act="army-recruit"]').title.includes('Individual'),'hero Reinforce is visibly disabled with a reason');
 ok(pane.querySelector('[aria-label="Mana"]').getAttribute('aria-valuenow')==='0'&&!pane.querySelector('[aria-label="Mana"]').hasAttribute('aria-disabled'),'zero hero mana is a real value, not Not applicable');
 ok(field(section('character'),'Skill points').querySelector('strong').textContent==='0'&&!field(section('character'),'Skill points').hasAttribute('aria-disabled'),'zero skill points stay enabled and readable');
 q('.fb-unit-actions [data-act="open-skills"]').click();ok(G.mode==='skills'&&!G.skWho,'hero Development opens the actual hero tree');t.act('sk-close');
 section('gear').open=true;t.act('party-equipment');ok(G.mode==='inv'&&G.invView==='equipment'&&q('[data-act="party-equipment-back"]'),'hero equipment opens the equipment view with Back to Army ('+G.mode+', '+G.invArmy+', '+G.invView+', '+qa('.nav .btn').map(e=>e.dataset.act).join()+')');
 t.act('party-equipment-back');ok(G.mode==='char'&&t.partyView().sel==='hero'&&section('gear').open,'Back to Army returns to the same hero and expanded Equipment ('+G.mode+', '+G.invArmy+', '+t.partyView().sel+', '+section('gear')?.open+')');
 t.act('party-equipment');t.act('inv-more');t.act('inv-back');t.act('party-equipment-back');
 pane=open('comp_brann');ok(qa('.fb-unit-actions [data-act="cm-tree"]').length===1&&q('.fb-unit-actions [data-act="army-recruit"]').disabled,'companion has one Development entry and disabled Reinforce');
 ok(pane.querySelector('[aria-label="Mana: Not applicable"]').hasAttribute('aria-disabled')&&pane.querySelector('[aria-label="Stamina: Not applicable"]').textContent.includes('—'),'untracked companion resources are dimmed dashes');
 q('.fb-unit-actions [data-act="cm-tree"]').click();ok(G.mode==='skills'&&G.skWho==='brann','companion Development opens their own tree');t.act('sk-close');
 section('gear').open=true;const before=JSON.stringify({inv:P.inv,gear:P.comps.brann.gear});t.act('party-gear','weapon');t.act('fb-cancel');
 ok(G.mode==='char'&&section('gear').open&&JSON.stringify({inv:P.inv,gear:P.comps.brann.gear})===before,'companion equipment choice cancels without changing gear or collapsing Equipment');
 section('company').open=true;const role=P.comps.brann.role;t.act('party-role');t.act('fb-choice','guide');t.act('fb-cancel');
 ok(section('company').open&&P.comps.brann.role===role,'role Cancel returns to the expanded company section without assigning');
 t.act('party-comp-tab','orders');ok(section('company').open&&q('[data-cp-transfer="give"]'),'the existing orders route reveals the company section and real transfer controls');
 t.act('army-edit','comp_brann');ok(q('[data-army-editor="comp_brann"]')&&q('.fb-unit-actions [data-act="army-edit-close"]'),'companion Manage keeps the shared actions and real group editor');t.act('army-edit-close');
 pane=open(foot.id);ok(!q('.fb-unit-actions [data-act="army-recruit"]').disabled,'fit troop groups can still be reinforced');
 ok([...section('character').querySelectorAll('.fb-stat')].every(e=>e.hasAttribute('aria-disabled')&&e.querySelector('strong').textContent==='—'),'troops show disabled character fields and attributes, not fabricated values');
 ok(section('gear').textContent.includes('Fixed troop loadout')&&!section('gear').querySelector('button'),'troop equipment is a read-only fixed loadout');
 ok(section('company').textContent.includes('Not applicable')&&section('company').querySelector('[aria-disabled="true"]'),'companion role/orders remain visible as unavailable for troops');
 const stats=t.ST.hum_foot;ok(field(pane,'Attack').querySelector('strong').textContent===String(Math.round(t.meleeDmgOf(stats)))&&field(pane,'Armour').querySelector('strong').textContent===t.ARMOR[t.armorOf(stats)].n,'troop combat fields use the actual attack and armour');
 q('.fb-unit-actions [data-act="party-path"]').click();ok(t.partyView().path&&q('.fb-path'),'troop Development opens its real training path');t.act('party-back');
 pane=open(bow.id);ok(!field(pane,'Missile').hasAttribute('aria-disabled')&&field(pane,'Range').querySelector('strong').textContent===String(t.ST.hum_bow.range),'ranged troops retain real missile and range values');
 t.compInit('brann').hurt=G.day+2;pane=open('comp_brann');ok(field(pane,'Fit').querySelector('strong').textContent==='0'&&field(pane,'Wounded').querySelector('strong').textContent==='1'&&pane.querySelector('[aria-label="Health"]').getAttribute('aria-valuenow')==='0','wounded companion counts and health stay truthful in the common layout');
 t.act('party-select','hero');t.act('army-edit','hero');q('[data-army-name]').value='A very long <hero> group name';t.act('army-name-save','hero');t.act('army-edit-close');
 ok(q('.fb-title h3').textContent==='A very long <hero> group name'&&!q('.fb-title hero'),'renamed group names remain literal text in the shared identity');
});
