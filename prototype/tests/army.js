'use strict';
// The Army window (the owner's design, 2026-10-23; ui/partypage.js): C and the Menu's Army, its header the company muster (the band's
// name once, its bars, on every tab; to read, not a link); its four tabs its top level, each its bar's Back to the Game Menu. Roster: one list of cards (your hero, companions, troop groups), each
// its kind's icon (crown, star, shield) and experience bar, opening its detail and its Skills. Army skills: the band's values, who
// gives them, the roles assigned. Condition. Passengers: escorts, prisoners and captives with their actions. K opens
// your hero's Skills inside it. Esc follows the bar; the phone layouts (844 × 390, 390 × 844); one bottom bar and one scrolling
// area per page, its last control in reach. Written on the test kit (tests/kit.js).
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,p=t.panel,scr=document.getElementById('screen'),q=s=>p.querySelector(s),qa=s=>[...p.querySelectorAll(s)],esc=()=>Kit.key('Escape','Escape');
 const shown=e=>!!e&&e.getClientRects().length>0,navBack=()=>q('.nav [data-nav="back"]'),navClose=()=>q('.nav [data-nav="close"]');
 // (a tab's Back goes to the Game Menu; a sub-page's to its parent)
 const menuBack=()=>{const b=navBack();return !!b&&b.dataset.act==='fb-menu'&&b.textContent==='Back'},sub=()=>{const b=navBack();return !!b&&b.dataset.act!=='fb-menu'};
 Kit.begin('soldier',31);Kit.clear();Kit.world();
 P.band='Iron <Band>';P.xp=30;P.gold=2000;
 P.comps={brann:{ap:5,role:'scout'},elske:{ap:5,role:'surgeon'},tavi:{ap:5,role:''}};const brann=t.compInit('brann');brann.lv=4;brann.xp=50;t.compInit('elske');const tavi=t.compInit('tavi');tavi.lv=3;
 const r=t.partyRoster(P);r.add('hum_foot',8);r.add('hum_knight',2);r.add('hum_levy',5);const foot=r.groups.find(g=>g.type==='hum_foot'),knight=r.groups.find(g=>g.type==='hum_knight');
 t.cpGive('tavi','hum_levy',3);ok(!!tavi.party,'Tavi leads a party of his own (away from the band)');
 P.txp={hum_foot:t.txpNeed('hum_foot')*3};t.vitals();P.morale=55;P.bsta=60;
 const world=()=>Kit.world(),open=()=>{world();G.char='roster';t.openChar()};
 const fills=svg=>[...svg.querySelectorAll('rect')].map(x=>x.getAttribute('fill')).join(),iconFills=k=>{const d=document.createElement('div');d.innerHTML=t.icon(k,14);return fills(d.firstChild)};
 try{
  // ---- the window: the band's name, its tabs
  open();ok(G.mode==='char'&&q('.fb-head h2').textContent==='Iron <Band>'&&!q('Band')&&q('.fb-head small').textContent==='Army','the Army window, titled with the band’s name (literal text)');
  ok(qa('[data-act="char-tab"]').map(b=>b.textContent).join('|')==='Roster|Army skills|Condition|Passengers'&&G.char==='roster','its tabs: Roster (first), Army skills, Condition, Passengers');
  // ---- the company muster: the window's header, on every tab
  const F=t.bandFitness(),h=q('.fb-head');
  ok(h.textContent.includes('Iron <Band>')&&h.textContent.includes(r.slots+' / '+t.ARMY_LIMIT+' groups · '+(F.fit+1)+' fit (including hero) · '+F.wounded+' wounded')&&!q('.fb-head>.muted'),'the header is the muster: the band’s name, its groups, fit and wounded');
  ok(['Fitness','Morale','Stamina'].every(n=>h.querySelector('.fb-meter[aria-label="'+n+'"]'))&&+h.querySelector('[aria-label="Morale"]').getAttribute('aria-valuenow')===55&&Math.abs(+h.querySelector('[aria-label="Stamina"]').getAttribute('aria-valuenow')-60)<1e-6&&/On the road|·/.test(h.textContent)&&!/Details/.test(h.textContent),'its bars: Fitness, Morale and Stamina, with the road’s word');
  ok(p.textContent.split('Iron <Band>').length===2&&qa('.fb-meter[aria-label="Fitness"]').length===1&&!q('.fb-body .fb-muster-meters'),'the band’s name once and its bars once: no banner row in the Roster');
  ok(!h.querySelector('button,a,[data-act],[role="button"]')&&!h.closest('[data-act]'),'the muster is to read: no link, button or action in the header');
  {h.querySelector('h2').click();ok(G.char==='roster','a click on it does nothing (the Roster stays)')}
  for(const [tab] of t.ARMY_TABS){t.act('char-tab',tab);ok(q('.fb-head .fb-meter[aria-label="Fitness"]')&&q('.fb-head h2').textContent==='Iron <Band>'&&G.char===tab,'the muster heads the '+tab+' tab too')}
  t.act('char-tab','condition');ok(G.char==='condition'&&q('.fb-condition')&&q('[data-act="char-tab"][data-arg="condition"]').classList.contains('on'),'its tab opens Condition');
  // ---- Condition
  {const c=q('.fb-condition').textContent;ok(/Stamina [+-]?[\d.]+ \/ hour/.test(c)&&c.includes('Headcount')&&c.includes(t.partySize()+' / '+t.partyCap())&&c.includes('Food')&&c.includes('Drink')&&/Party power · \d+/.test(c)&&c.includes('Brann the Wolf')&&c.includes('Recruitment target'),'Condition: recovery and its reasons, supplies, capacity and the power breakdown');
   ok(q('.fb-condition .fb-scroll [data-act="party-supplies"]')&&menuBack()&&navClose().textContent==='Back to map'&&qa('.nav').length===1&&[...q('.fb-condition').querySelectorAll('button')].every(b=>b.closest('.fb-scroll')),'its Supplies in its content; its bar, the only bottom bar: Back (to the Game Menu), Back to map');
   esc();ok(G.mode==='esc'&&G.esc.page==='menu'&&G.esc.html==null,'Esc follows the bar: from Condition, the Game Menu, the window closed under it');esc();ok(G.mode==='world','one more Esc resumes');open();ok(G.char==='roster','Roster again')}
  // ---- every tab, the same bar: Back to the Game Menu (ui/hub.js), Back to map; however the window was opened
  for(const [tab] of t.ARMY_TABS){t.act('char-tab',tab);ok(menuBack()&&navClose().textContent==='Back to map','the '+tab+' tab: Back (to the Game Menu) on the left, Back to map on the right')}
  navBack().click();ok(G.mode==='esc'&&G.esc.mode==='world'&&G.esc.html==null&&q('.gm-tile[data-arg="army"]'),'Back: the Game Menu, as Esc on the map opens it');t.act('esc-resume');ok(G.mode==='world'&&t.ov.hidden,'Resume: the map');
  for(const [tab] of t.ARMY_TABS){Kit.key('KeyC','c');t.act('char-tab',tab);esc();ok(G.mode==='esc'&&G.esc.page==='menu','opened by C, the '+tab+' tab: Esc, the Game Menu');esc();ok(G.mode==='world','then Esc resumes')}
  open();
  // ---- the roster: one list of cards
  const cards=qa('.fb-unit-grid .fb-unit'),ids=cards.map(c=>c.dataset.armyGroup),kinds=cards.map(c=>c.dataset.kind);
  ok(ids.slice(0,r.order.length).join()===r.order.join()&&ids.includes('hero')&&ids.includes('comp_brann')&&ids.includes('comp_elske')&&ids.includes(foot.id)&&ids.includes(knight.id),'one list: your hero, your companions and your troop groups, in battle order ('+ids.join(', ')+')');
  ok(!qa('[data-act="party-tab"]').length&&!/Companions<\/button>/.test(p.innerHTML)&&!qa('[data-act="char-tab"][data-arg="prisoners"]').length,'no Companions or Prisoners tab');
  ok(ids[ids.length-1]==='comp_tavi'&&q('.fb-unit-grid').textContent.includes('Away · leading their own party'),'a companion leading his own party is still on the roster, under Away');
  ok(kinds[ids.indexOf('hero')]==='hero'&&kinds[ids.indexOf('comp_brann')]==='comp'&&kinds[ids.indexOf(foot.id)]==='troop','each card says what it is');
  {const kindIcon=id=>fills(q('.fb-unit[data-army-group="'+id+'"] .fb-unit-kind svg'));
   ok(kindIcon('hero')===iconFills('rosterhero')&&kindIcon('comp_brann')===iconFills('rostercomp')&&kindIcon(foot.id)===iconFills('rostertroop')&&new Set(['rosterhero','rostercomp','rostertroop'].map(iconFills)).size===3,'its icon: a crown for the hero, a star for a companion, a shield for troops');
   ok(['rosterhero','rostercomp','rostertroop'].every(k=>t.ICONS[k].px.length===9&&t.ICONS[k].px.every(row=>row.length===9&&[...row].every(c=>c==='.'||t.ICONS[k].p[c]))),'the three are pixel icons of the game’s set (9 × 9, each colour its palette’s)')}
  {const xp=id=>q('.fb-unit[data-army-group="'+id+'"] .fb-unit-xp'),val=e=>[+e.getAttribute('aria-valuenow'),+e.getAttribute('aria-valuemax')].join('/'),txt=id=>q('.fb-unit[data-army-group="'+id+'"] .fb-unit-xptxt').textContent,need=(P.troops.hum_foot||0)*t.txpNeed('hum_foot');
   ok(cards.every(c=>c.querySelector('.fb-unit-xp[role="meter"]')),'every card has an experience bar');
   ok(val(xp('hero'))===P.xp+'/'+t.LV_XP(P.level)&&txt('hero')==='Lv. '+P.level+' · '+P.xp+' / '+t.LV_XP(P.level)+' XP','the hero’s: experience to the next level ('+txt('hero')+')');
   ok(val(xp('comp_brann'))===brann.xp+'/'+t.LV_XP(brann.lv)&&txt('comp_brann')==='Lv. 4 · 50 / '+t.LV_XP(4)+' XP','a companion’s: its own, to its next level ('+txt('comp_brann')+')');
   ok(val(xp(foot.id))===t.txpOf('hum_foot')+'/'+need&&txt(foot.id)===Math.floor(t.txpOf('hum_foot'))+' / '+need+' to train','a troop group’s: its training ('+txt(foot.id)+')');
   ok(txt(knight.id)==='Top tier'&&val(xp(knight.id))==='1/1','a top-tier troop: full, Top tier')}
  // ---- opening each kind
  t.act('party-select','hero');{const d=q('.fb-hero-detail');ok(d&&/raised on the skill tree/.test(d.innerHTML)&&d.querySelector('.fb-meter[aria-label="Health"]')&&d.querySelector('.fb-meter[aria-label^="Experience to level"]')&&d.querySelector('[data-act="army-edit"][data-arg="hero"]'),'the hero’s card: the Hero page (vitals, attributes, perks), its experience, Manage')}
  t.act('party-select','comp_brann');{const d=q('.fb-comp-detail');ok(d&&t.compShown()&&G.compSel==='brann'&&!qa('.fb-comp-detail [data-act="party-comp-tab"]').length&&d.querySelector('[data-unit-section="gear"]')&&d.querySelector('[data-unit-section="company"]')&&d.querySelector('.fb-meter[aria-label^="Experience to level 5"]'),'a companion’s card: the shared inspector, Equipment and company sections, its experience to the next level');
   t.act('party-comp-tab','gear');ok(q('.fb-gear-rows')&&G.compTab==='gear','its Equipment');t.act('party-comp-tab','orders');ok(q('.fb-order-buttons')&&q('[data-cp-transfer="give"]'),'its Orders');t.act('party-comp-tab','overview');
   t.act('party-role');t.act('fb-choice','guide');t.act('fb-cancel');ok(brann.role==='scout'&&q('.fb-comp-detail'),'its role page cancels back to its card')}
  t.act('party-select',foot.id);{const d=q('.fb-inspector');ok(d&&!d.classList.contains('fb-person-detail')&&/Training · all/.test(d.textContent)&&d.querySelector('[data-act="army-edit"]'),'a troop group’s card: its group detail, training and Manage Group');
   t.act('army-edit',foot.id);ok(q('[data-army-editor="'+foot.id+'"]')&&q('[data-act="army-split-exact"]')&&q('[data-act="party-merge"]'),'and Manage group (rename, order, split, merge)');t.act('army-edit-close')}
  // ---- each card's Skills
  t.act('party-select','hero');t.act('open-skills');ok(G.mode==='skills'&&!G.skWho&&q('svg.tree')&&navBack().textContent==='Back to Army'&&navClose().textContent==='Back to map','the hero’s Skills: your tree, Back to Army');
  t.act('sk-close');ok(G.mode==='char'&&G.char==='roster'&&t.partyView().sel==='hero'&&q('.fb-hero-detail'),'and Back returns to the hero’s card');
  t.act('party-select','comp_brann');t.act('cm-tree');ok(G.mode==='skills'&&G.skWho==='brann'&&navBack().textContent==='Back to Brann','a companion’s Skills: its own tree');
  t.act('sk-close');ok(G.mode==='char'&&t.compShown()&&G.compSel==='brann','and Back returns to its card');
  t.act('party-select',foot.id);t.act('party-path',foot.id);{const d=q('.fb-inspector').textContent;ok(t.partyView().path&&/Training path and abilities/.test(d)&&d.includes(t.ST.hum_sword.n)&&d.includes('Rally (Y)')&&/Traits/.test(d)&&sub(),'a troop group’s Skills: its training path, its battle orders and traits')}
  t.act('party-path',foot.id);t.act('party-select',knight.id);t.act('party-path',knight.id);{const d=q('.fb-inspector').textContent;ok(d.includes('Spur (U)')&&/trains no further/.test(d),'a rider’s: Spur, and the top of its path')}
  t.act('party-back');ok(!t.partyView().path&&q('.fb-inspector .fb-stat-grid'),'Back leaves the path');
  // ---- Army skills
  P.sk.trade.lv=3;t.act('char-tab','skills');
  {const v=k=>q('.fb-bskill-v[aria-label^="'+t.SKILLS[k].n+' "]'),row=k=>v(k).closest('.fb-bskill').textContent;
   ok(['lead','tact','med','scout','surv','trade'].every(k=>v(k)&&+v(k).textContent===t.skill(k)),'Army skills: Scouting, Leadership, Medicine, Trade, Survival, Tactics, each its band value');
   ok(row('trade').includes('You 3')&&row('scout').includes('Brann (Scout) +'+P.roleBonus('scout'))&&row('med').includes('Elske (Surgeon) +'+P.roleBonus('med')),'who gives each: you, and the companion in its role ('+row('scout').split('.')[0]+')');
   ok(row('scout').includes(t.SKILLS.scout.d.slice(0,20)),'and what it does')}
  {const role=k=>q('[data-act="party-holder"][data-arg="'+k+'"]').closest('.fb-bskill').textContent;
   ok(role('scout').includes('Brann the Wolf')&&role('surgeon').includes('Sister Elske')&&role('quarter').includes('Vacant')&&role('guide').includes('Vacant'),'the roles: who holds each, or vacant');
   t.act('party-holder','quarter');ok(qa('[data-act="fb-choice"]').length===4&&p.textContent.includes('No one'),'Choose: the role choice page, no one or each companion');
   t.act('fb-choice','elske');ok(p.textContent.includes('Elske is your Surgeon now'),'it says what a reassignment ends');t.act('fb-cancel');ok(P.comps.elske.role==='surgeon'&&!t.roleOf('quarter')&&G.char==='skills','Cancel changes nothing');
   t.act('party-holder','quarter');t.act('fb-choice','elske');t.act('fb-apply');ok(t.roleOf('quarter')==='elske'&&!t.roleOf('surgeon')&&role('quarter').includes('Sister Elske')&&role('surgeon').includes('Vacant'),'Apply assigns the role (one each): Elske the Quartermaster, the Surgeon vacant');
   t.act('party-holder','scout');t.act('fb-choice','');t.act('fb-apply');ok(!t.roleOf('scout')&&brann.role===''&&!P.roleBonus('scout'),'No one leaves a role vacant');
   t.act('party-holder','scout');t.act('fb-choice','brann');t.act('fb-apply');ok(t.roleOf('scout')==='brann','and back')}
  // ---- Passengers: an escort, prisoners, a captive lord
  {const ash=Kit.goHome('Ashford'),far=t.TOWNS.find(z=>z!==ash&&!t.hostileTo(z.owner));world();t.Outcome.apply({passenger:{who:'refugees',to:{town:far.name},prize:{gold:30}}},{});world();
   P.prisoners={hum_levy:2};const lord=W.lords[0];t.captureLord(lord);open();t.act('char-tab','passengers');const x=p.textContent;
   ok(/Escorted \(1 \/ 3\)/.test(x)&&x.includes('The refugee family')&&x.includes('To '+far.name)&&x.includes('does not fight'),'Passengers: the escort, where to, how long, and that it does not fight');
   ok(/Prisoners \(2 \/ \d+\)/.test(x)&&q('[data-act="p-recruit"][data-arg="hum_levy"]')&&q('[data-act="p-release"][data-arg="hum_levy"]'),'the prisoners, with Recruit and Release');
   ok(/Captives \(1\)/.test(x)&&x.includes(lord.name)&&q('[data-act="ct-ransom"][data-arg="0"]')&&q('[data-act="ct-recruit"][data-arg="0"]')&&q('[data-act="ct-free"][data-arg="0"]'),'the captive lord, with Ransom, Recruit and Let go');
   const ren=P.renown;t.act('p-release','hum_levy');ok(P.prisoners.hum_levy===1&&P.renown===ren+1&&G.char==='passengers'&&/Prisoners \(1 \//.test(p.textContent),'Release frees one, as before, and the tab stays');
   t.act('ct-free','0');ok(!t.captives().length&&!lord.held&&G.mode==='char'&&G.char==='passengers'&&/Captives \(0\)/.test(p.textContent),'Let go frees the lord, as before');
   t.act('char-tab','roster')}
  // ---- K, C and the Menu
  world();Kit.key('KeyK','k');ok(G.mode==='skills'&&!G.skWho&&q('svg.tree')&&navBack().textContent==='Back to Army','K: the Army window, on your hero’s Skills');
  esc();ok(G.mode==='char'&&t.partyView().sel==='hero','Esc follows its Back: the Army window, on your hero');
  if(sub()){esc();ok(G.mode==='char'&&!t.partyView().open,'on a small screen (the tests’ own), Esc next goes back to the cards')}
  esc();ok(G.mode==='esc'&&G.esc.page==='menu','then its Back: the Game Menu');esc();ok(G.mode==='world','and one more Esc resumes');
  Kit.key('KeyK','k');Kit.key('KeyK','k');ok(G.mode==='world','K again closes it');
  Kit.key('KeyC','c');ok(G.mode==='char'&&G.char==='roster','C opens the Army window');Kit.key('KeyC','c');ok(G.mode==='world','C again closes it');
  document.getElementById('charBtn').click();ok(G.mode==='char','the bar’s button opens it');world();
  t.showEsc();const tile=q('.gm-tile[data-arg="army"]');ok(tile&&tile.querySelector('strong').textContent==='Army'&&tile.querySelector('kbd').textContent==='C','the Game Menu’s Army tile (C)');tile.click();ok(G.mode==='char'&&G.char==='roster','opens the Army window');
  ok(t.KEYS[0][1].some(([k,d])=>k==='C'&&/Army/.test(d))&&t.KEYS[0][1].some(([k,d])=>k==='K'&&/Army window/.test(d))&&/C the Army/.test(t.CONTROLS),'the keys’ help names the Army window');
  // ---- Esc and the bar, on a desktop screen and the phones'
  const original=scr.style.cssText,inside=e=>{const b=e.getBoundingClientRect(),s=scr.getBoundingClientRect();return b.width>0&&b.height>0&&b.left>=s.left-1&&b.right<=s.right+1&&b.top>=s.top-1&&b.bottom<=s.bottom+1};
  const fits=label=>{p.style.animation='none';const bs=qa('button').filter(shown);ok(inside(p)&&p.scrollWidth<=p.clientWidth+1&&qa('.nav .btn').every(inside)&&!q('select'),label+': the frame and its bar fit, no dropdown');ok(bs.every(b=>b.getBoundingClientRect().height>=44-.5&&b.getBoundingClientRect().width>=44-.5),label+': every control at least 44 px ('+bs.filter(b=>b.getBoundingClientRect().height<43.5).map(b=>b.textContent.trim()).join(', ')+')')};
  try{
   scr.style.cssText=original+';width:1280px;height:800px';
   open();fits('Roster 1280 × 800');t.act('party-select','hero');ok(!t.partyFull()&&shown(q('.fb-collection'))&&shown(q('.fb-hero-detail'))&&menuBack()&&navClose().textContent==='Back to map','desktop: a card’s detail beside the cards; the bar: Menu, the way out on the right');
   t.act('party-select',foot.id);t.act('army-edit',foot.id);ok(navBack()&&navBack().textContent==='Back','Manage gives the bar a Back');esc();ok(G.mode==='char'&&!G.armyEdit,'Esc closes Manage first');esc();ok(G.mode==='esc','then the Game Menu');esc();ok(G.mode==='world','then resumes');
   for(const [w,h] of [[844,390],[390,844]]){
    scr.style.cssText=original+';width:'+w+'px;height:'+h+'px';const at=w+' × '+h;
    open();fits('Roster '+at);ok(shown(q('.fb-head .fb-muster-meters'))&&shown(q('.fb-unit'))&&menuBack(),'Roster '+at+': the muster (the header) and the cards first, Back to the Game Menu on the bar');
    {const hh=q('.fb-head').getBoundingClientRect().height;ok(hh<=(w>650?52:120)&&shown(q('.fb-head h2'))&&['Fitness','Morale','Stamina'].every(n=>shown(q('.fb-head .fb-meter[aria-label="'+n+'"]'))),'Roster '+at+': the muster’s header, its name and its three bars, '+Math.round(hh)+' px high')}
    t.act('party-select','hero');ok(w>650?!t.partyFull()&&shown(q('.fb-hero-detail'))&&shown(q('.fb-collection'))&&menuBack():t.partyFull()&&shown(q('.fb-hero-detail'))&&!shown(q('.fb-collection'))&&sub(),'Roster '+at+': the hero uses the troop layout (beside the cards in landscape, a page on a narrow phone)');fits('Hero '+at);
    esc();ok(w>650?G.mode==='esc':G.mode==='char'&&!t.partyView().open&&shown(q('.fb-unit')),'Roster '+at+': Esc follows the hero layout’s bottom bar');if(w>650){esc();open()}
    t.act('party-select','comp_brann');fits('Companion '+at);ok(shown(q('.fb-comp-detail [data-act="cm-tree"]')),'Companion '+at+': its Skills in reach');
    t.act('party-select',foot.id);ok(w>650?shown(q('.fb-collection'))&&shown(q('.fb-inspector'))&&menuBack():!shown(q('.fb-collection'))&&shown(q('.fb-inspector'))&&sub(),'Troops '+at+': '+(w>650?'the cards and the group side by side':'the group as a page'));fits('Troops '+at);
    for(const tab of ['skills','condition','passengers']){t.act('char-tab',tab);fits(tab+' '+at)}
    world();Kit.key('KeyK','k');ok(qa('.nav .btn').every(inside)&&shown(q('svg.tree')),'Skills '+at+': its tree and bar fit');world();
   }
   // ---- one bottom bar and one scrolling area a page, its last control in reach: Condition, the Roster, a troop group and its Training
   const reach=(sc,el,label)=>{sc.scrollTop=sc.scrollHeight;const s=sc.getBoundingClientRect(),b=el.getBoundingClientRect();ok(b.height>0&&b.top>=s.top-1&&b.bottom<=s.bottom+1&&inside(el),label+': its last control scrolls fully into view')};
   const area=(sc,label)=>{const k=sc.clientHeight/p.clientHeight;ok(k>=.6,label+': its content '+Math.round(k*100)+'% of the window’s height (at least 60%)')};
   const oneBar=(pane,label)=>ok(qa('.nav').length===1&&!q('.fb-actions')&&[...pane.querySelectorAll('button')].every(b=>b.closest('.fb-scroll')),label+': one bottom bar (the window’s), no footer of its own');
   for(const [w,h] of [[844,390],[390,844],[1280,800]]){
    scr.style.cssText=original+';width:'+w+'px;height:'+h+'px';const at=w+' × '+h;
    // (each tab's main panel the same box: the Roster's cards and detail, Army skills, Condition, Passengers, edge to edge alike)
    open();{const box=()=>{const e=q('.fb-army-layout>.fb-split')||q('.fb-army-layout>.fb-pane');return e?[...['left','top','right','bottom'].map(k=>e.getBoundingClientRect()[k])]:[]},boxes=t.ARMY_TABS.map(([k])=>{t.act('char-tab',k);return [k,box()]}),b0=boxes[0][1];
     ok(b0.length===4&&b0[2]-b0[0]>100&&boxes.every(([,b])=>b.length===4&&b.every((v,i)=>Math.abs(v-b0[i])<=1)),'Tabs '+at+': each tab’s main panel the same box ('+boxes.map(([k,b])=>k+' '+b.map(Math.round).join(',')).join(' · ')+')');world()}
    open();t.act('char-tab','condition');{const c=q('.fb-condition'),sc=c.querySelector('.fb-scroll'),last=[...sc.querySelectorAll('.btns')].pop();
     ok(last&&last.querySelector('[data-act="army-recruit"][data-arg="new"]'),'Condition '+at+': its last control is the recruitment target’s');reach(sc,last,'Condition '+at);area(sc,'Condition '+at);oneBar(c,'Condition '+at);
     ok(menuBack()&&navClose().textContent==='Back to map','Condition '+at+': Back (to the Game Menu) on the left, Back to map on the right');
     esc();ok(G.mode==='esc','Condition '+at+': Esc, the Game Menu');esc();ok(G.mode==='world','Condition '+at+': and resumed')}
    open();{const c=q('.fb-collection'),sc=c.querySelector('.fb-scroll');reach(sc,q('.fb-recruit-options'),'Roster '+at);area(sc,'Roster '+at);oneBar(c,'Roster '+at)}
    t.act('party-select','hero');const hw=q('.fb-inspector').getBoundingClientRect().width;
    {const c=q('.fb-hero-detail'),sc=c.querySelector('.fb-scroll');ok(qa('.fb-hero-detail [data-act="open-skills"]').length===1&&sc.querySelector('.fb-inspector-acts [data-act="open-skills"]')&&sc.querySelector('.fb-inspector-acts [data-act="army-edit"]')&&!c.querySelector('.fb-head-acts'),'Hero '+at+': one Development button and Manage group in its content');reach(sc,sc.lastElementChild,'Hero '+at);oneBar(c,'Hero '+at);ok(sc.scrollWidth<=sc.clientWidth+1,'Hero '+at+': no horizontal overflow')}
    t.act('party-select',foot.id);ok(Math.abs(q('.fb-inspector').getBoundingClientRect().width-hw)<=1,'Hero '+at+': same inspector width as a troop group ('+Math.round(hw)+'px)');{const c=q('.fb-inspector'),sc=c.querySelector('.fb-scroll');ok(sc.querySelector('.fb-inspector-acts [data-act="army-edit"]')&&!sc.querySelector('.fb-inspector-acts [data-act="army-recruit"]')&&sc.querySelector('.fb-inspector-acts [data-act="party-path"]'),'Troops '+at+': Manage Group and Development, with no direct Reinforce action');reach(sc,sc.lastElementChild,'Troops '+at);area(sc,'Troops '+at);oneBar(c,'Troops '+at)}
    t.act('party-path',foot.id);{const c=q('.fb-inspector'),sc=c.querySelector('.fb-scroll');ok(sub()&&!/Back to group/.test(c.textContent),'Training '+at+': its Back is the bar’s');reach(sc,sc.lastElementChild,'Training '+at);area(sc,'Training '+at);oneBar(c,'Training '+at);esc();ok(!t.partyView().path&&q('.fb-inspector .fb-stat-grid'),'Training '+at+': Esc back to the group')}
    world();
   }
  }finally{scr.style.cssText=original}
 }finally{world()}
});
