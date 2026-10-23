'use strict';
// The windows of the menus (the owner, 2026-10-23): the Menu (ui/hub.js: Tab and the bar's Menu, a tile per window, a registry),
// your Quests as a window of its own (ui/questwindow.js: Q, Main · Side · Jobs · Archive), the Journal (ui/journal.js: J on its
// last section, L on the Chronicle, the bar's Journal; Chronicle · Lords · Realms, a registry), and the Character window left
// with Hero and Party. Each follows the frame rule (Esc and the bar), from the map, and what can from the streets.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,q=Kit.q,qa=Kit.qa,scr=q('#screen');
 window.requestAnimationFrame=()=>0;
 Kit.begin('soldier',23);Kit.clear();Kit.world();Kit.goHome('Ashford');
 const esc=()=>Kit.key('Escape','Escape'),key=(c,k)=>Kit.key(c,k),tiles=()=>qa('.fb-hub-tile'),tile=id=>q('.fb-hub-tile[data-arg="'+id+'"]'),
  close=()=>q('#panel > .nav [data-nav="close"]'),back=()=>q('#panel > .nav [data-nav="back"]'),tabs=()=>qa('#panel .fb-shell > .fb-tabs .btn').map(b=>b.textContent.trim());
 // ---- the bar: Menu and Journal (was Log)
 ok(q('#hubBtn .dl').textContent==='Menu'&&q('#hubBtn kbd').textContent==='Tab'&&q('#journalBtn .dl').textContent==='Journal'&&q('#journalBtn kbd').textContent==='J','the bar: a Menu button (Tab), the Log button now Journal (J)');
 // ---- the Menu: Tab, a tile per window with its key
 key('Tab','Tab');
 ok(G.mode==='hub'&&tiles().map(b=>b.querySelector('strong').textContent+' '+b.querySelector('kbd').textContent).join(', ')==='Army C, Inventory I, Quests Q, Journal J, Map M, Camp Z'&&tiles().every(b=>!b.disabled),
  'Tab: the Menu, a tile each: '+tiles().map(b=>b.querySelector('strong').textContent).join(', '));
 ok(!back()&&close()&&close().textContent==='Back to map','the frame rule: its bar, the way out on the right');
 esc();ok(G.mode==='world','Esc closes it');
 q('#hubBtn').click();ok(G.mode==='hub','the bar’s Menu opens it');q('#hubBtn').click();ok(G.mode==='world','and closes it');
 // ---- each tile opens its window
 const opens={army:()=>G.mode==='char'&&G.char==='roster',inventory:()=>G.mode==='inv',quests:()=>G.mode==='quests',journal:()=>G.mode==='journal',map:()=>G.mode==='fullmap'};
 for(const [id,is] of Object.entries(opens)){Kit.world();t.openHub();tile(id).click();ok(is(),'the '+id+' tile opens its window ('+G.mode+')');Kit.world()}
 {Kit.world();const c0=!!P.camp;t.openHub();tile('camp').click();const m=G.msgs[G.msgs.length-1].m;ok(G.mode==='world'&&(!!P.camp!==c0||!!G.pitch||/camp here/.test(m)),'the camp tile makes camp, as Z does: '+m);if(P.camp)t.breakCamp();G.pitch=null;P.tx=P.ty=null}
 // ---- from the streets: what needs the map greyed, saying why; Quests and the Journal open, closing back to the streets
 {Kit.world();G.mode='scene';G.modal=false;t.openHub();
  ok(G.mode==='hub'&&['army','inventory','map','camp'].every(id=>tile(id).disabled&&/On the map only/.test(tile(id).textContent))&&!tile('quests').disabled&&!tile('journal').disabled&&close().textContent==='Back to the streets',
   'from the streets: Army, Inventory, Map and Camp greyed (On the map only); Quests and the Journal open');
  tile('quests').click();ok(G.mode==='quests'&&close().textContent==='Back to the streets','Quests over the streets');
  esc();ok(G.mode==='scene','Esc: back to the streets');
  key('KeyJ','j');ok(G.mode==='journal','J in the streets: the Journal');esc();key('KeyQ','q');ok(G.mode==='quests','Q in the streets: your Quests');esc();ok(G.mode==='scene','closed: the streets again');Kit.world()}
 // ---- the Menu's registry: a window adds its tile
 {let opened=0;t.defineMenuEntry('zz_test',{label:'Test window',icon:'book',key:'X',open:()=>{opened++}});
  try{t.openHub();ok(tile('zz_test')&&/Test window/.test(tile('zz_test').textContent)&&tiles().length===7,'a tile defined: it is in the Menu');tile('zz_test').click();ok(opened===1&&G.mode==='world','its tile opens it (the Menu closed first)')}
  finally{delete t.MENU_ENTRIES.zz_test;Kit.world()}}
 // ---- your Quests: a window of its own, Q; the Character window keeps Hero and Party
 key('KeyQ','q');
 ok(G.mode==='quests'&&q('.fb-head h2').textContent==='Quests'&&qa('.qw-tabs [data-act="qw-tab"]').map(b=>b.textContent.split(' · ')[0]).join('|')==='Main|Side|Jobs|Archive','Q: the Quests window, its tabs Main, Side, Jobs, Archive');
 ok(!back()&&close().textContent==='Back to map','its bar: the way out');
 key('KeyQ','q');ok(G.mode==='world','Q again: closed');t.openQuests();esc();ok(G.mode==='world','Esc closes it');
 t.openChar();ok(G.mode==='char'&&tabs().join('|')==='Roster|Army skills|Condition|Passengers'&&!q('[data-act="char-tab"][data-arg="quests"]'),'the Army window: Roster, Army skills, Condition, Passengers ('+tabs().join(', ')+')');
 t.act('char-tab','quests');ok(G.char==='roster','no Quests tab to turn to');Kit.world();
 // ---- the Journal: J on its last section; Chronicle, Lords, Realms; L on the Chronicle
 key('KeyJ','j');
 ok(G.mode==='journal'&&tabs().join('|')==='Chronicle|Lords|Realms','J: the Journal, its sections: '+tabs().join(', '));
 t.act('jn-sec','lords');ok(G.jsec==='lords'&&/How each lord feels about you/.test(Kit.text())&&W.lords.filter(l=>!l.gone).every(l=>Kit.text().includes(l.name)),'Lords, moved from the Character window: every lord');
 t.act('jn-sec','realms');ok(G.jsec==='realms'&&/Your standing/.test(Kit.text())&&/Relations/.test(Kit.text()),'Realms, moved too: your standing, the realms, their relations');
 key('KeyJ','j');ok(G.mode==='world','J again: closed');
 q('#journalBtn').click();ok(G.mode==='journal'&&G.jsec==='realms','the bar’s Journal: opened on the last section (Realms)');
 key('KeyL','l');ok(G.mode==='journal'&&G.jsec==='chronicle'&&q('.chron'),'L: turned to the Chronicle');key('KeyL','l');ok(G.mode==='world','L on the Chronicle: closed');
 t.openJournal('lords');Kit.world();key('KeyL','l');ok(G.jsec==='chronicle','L always opens the Chronicle');esc();ok(G.mode==='world','Esc closes the Journal');
 // ---- the Journal's registry: a section is one definition
 {const S=t.JOURNAL_SECTIONS;t.defineJournalSection('zz_test',{label:'Test pages',icon:'book',render:()=>'<div class="fb-scroll"><p id="zz">A test section.</p></div>',sub:()=>'for the test',back:()=>['jn-sec','chronicle','Back']});
  try{t.chronicleKey();const tb=q('[data-act="jn-sec"][data-arg="zz_test"]');ok(tb&&/Test pages/.test(tb.textContent)&&tabs().length===4,'a section defined: its tab in the Journal ('+tabs().join(', ')+')');
   tb.click();ok(G.jsec==='zz_test'&&q('#zz')&&/for the test/.test(q('.fb-head').textContent)&&back().textContent==='Back','turned to it: its content, its line, its Back');
   esc();ok(G.mode==='journal'&&G.jsec==='chronicle','Esc presses its Back');
   t.act('jn-sec','zz_test');t.act('journal-close');t.openJournal();ok(G.jsec==='zz_test','the last section opened is opened again');t.act('journal-close')}
  finally{delete S.zz_test;Kit.world()}}
 // ---- a phone on its side and upright: the Menu, Quests and the Journal on the screen, 44 px controls
 const css0=scr.style.cssText;
 try{for(const [w,h] of [[844,390],[390,844]]){scr.style.cssText=css0+';width:'+w+'px;height:'+h+'px';
   const s=scr.getBoundingClientRect(),inside=el=>{const r=el.getBoundingClientRect();return r.width>0&&r.left>=s.left-.5&&r.right<=s.right+.5&&r.top>=s.top-.5&&r.bottom<=s.bottom+.5};
   Kit.world();t.openHub();q('#panel').style.animation='none';
   ok(inside(q('#panel'))&&tiles().every(inside)&&tiles().every(b=>b.getBoundingClientRect().height>=44)&&inside(close()),'at '+w+' x '+h+': every Menu tile on the screen, at least 44 px ('+Math.round(Math.min(...tiles().map(b=>b.getBoundingClientRect().height)))+')');
   tile('journal').click();q('#panel').style.animation='none';const jt=qa('[data-act="jn-sec"]');
   ok(inside(q('#panel'))&&jt.every(inside)&&jt.every(b=>b.getBoundingClientRect().height>=43.5)&&inside(close()),'at '+w+' x '+h+': the Journal’s sections and its bar on the screen');
   Kit.world();t.openQuests();q('#panel').style.animation='none';ok(inside(q('#panel'))&&qa('.qw-tabs .btn').every(inside)&&inside(close()),'at '+w+' x '+h+': the Quests window, its tabs and its bar on the screen');
   Kit.world();t.updateHUD(true);const dock=qa('.dock .dbtn').filter(b=>b.getBoundingClientRect().width>0);ok(dock.every(inside),'at '+w+' x '+h+': every button of the bar on the screen ('+dock.length+')')}}
 finally{scr.style.cssText=css0;Kit.world()}
});
