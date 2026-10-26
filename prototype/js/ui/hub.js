'use strict';
/* ---------- the Game Menu (the owner, 2026-10-23): one menu, the game paused while it is open, in battle too (G.mode 'esc'; G.esc:
   the screen under it, and the page shown). Esc with no window open, Tab and the bar's Menu open it; Esc again, or Resume, goes
   back. Its header: the day, the world, its seed (Copy seed) and the World page; a tile per window; then Save game, Load game,
   Settings (the title's own page: ui.js settingsPage), Main menu and Exit game. Its pages (the save slots, the World page,
   Settings, the question before leaving) step Back to it; Esc follows each page's bar ---------- */
/* a tile is one definition (a window adds itself): defineMenuEntry(id, {label, icon, key, open, why}) - open(): opens its window
   (the menu closed first); why(from): why it cannot open over that screen ('' or none: it can; greyed with the reason). The tiles
   keep the order they are defined in. None opens in battle, or over another window (menuWhy) */
const MENU_ENTRIES={};
function defineMenuEntry(id,spec){
  MENU_ENTRIES[id]={id,...spec};
  return MENU_ENTRIES[id];
}
// (a window of the map's: not from the streets)
const menuMapOnly=from=>from==='world'?'':'On the map only';
// why a tile cannot open now: in battle never; else only over the map or the streets, nothing in front of them
function menuWhy(e,E){
  if(E.mode==='battle')return 'Not during a battle';
  if(E.html!=null||!['world','scene'].includes(E.mode))return E.mode==='town'?'Leave the town first':'Close the window in front first';
  return e.why&&e.why(E.mode)||'';
}
// why you cannot save now (saveGame agrees: ESC_SAVE)
const escSaveWhy=from=>ESC_SAVE.includes(from)?'':from==='battle'?'Not during a battle':'Finish what is in front of you first';
// the world you play in, for the header: the day, its name, its kind and its seed, with Copy seed (the generated world's settings:
// the owner, 2026-10-22), and World: its page (worldsetup.js worldPage: every setting, the world code)
function escWorld(){const s=WM.settings;
  return '<span class="gm-world">Day '+G.day+' · '+htmlText(worldName(WM))+' · '+htmlText(worldKind(s))+(s.seed?' · seed <b>'+htmlText(s.seed)+'</b>':'')+'</span><span class="gm-head-acts">'+
    (s.seed?'<button class="btn sm" type="button" data-act="esc-seed">Copy seed</button>':'')+'<button class="btn sm" type="button" data-act="esc-wpage">World</button></span>'}
function showEsc(msg){
  if(G.mode!=='esc'){if(B&&B.draw)B.draw=null;G.esc={mode:G.mode,html:ov.hidden?null:panel.innerHTML,cls:panel.className,modal:G.modal}}
  G.mode='esc';const E=G.esc,from=E.mode,was=E.page;E.page='menu';G.overArmed=null;
  const tile=e=>{const why=menuWhy(e,E);
    return '<button type="button" class="gm-tile" data-act="esc-go" data-arg="'+e.id+'"'+(why?' disabled':'')+'>'+fbIcon(e.icon,32)+'<strong>'+e.label+'</strong><kbd>'+e.key+'</kbd>'+(why?'<small>'+htmlText(why)+'</small>':'')+'</button>'};
  const sys=(a,ico,label,why)=>'<button type="button" class="btn gm-sys-btn" data-act="'+a+'"'+(why?' disabled':'')+'>'+fbIcon(ico,20)+'<span><strong>'+label+'</strong>'+(why?'<small>'+htmlText(why)+'</small>':'')+'</span></button>';
  fbShow('Paused',escWorld(),'','<div class="fb-scroll gm-body" data-fb-scroll="gm"><div class="gm-tiles" role="group" aria-label="Windows">'+Object.values(MENU_ENTRIES).map(tile).join('')+'</div>'+
    '<div class="gm-sys" role="group" aria-label="Game">'+sys('esc-saves','save','Save game',escSaveWhy(from))+sys('esc-loads','load','Load game',readSave()?'':'No saved game')+
    sys('esc-settings','settings','Settings')+sys('esc-main','menu','Main menu')+sys('esc-exit','exit','Exit game')+'</div>'+(msg?'<p class="gold gm-msg" role="status">'+msg+'</p>':'')+'</div>',
    null,['esc-resume',null,'Resume'],'fb-gm',htmlText(bandName())+' · '+(from==='battle'?'in battle':from==='scene'?'in the streets':'on the road'));
  // (under the keyboard: opened, the first window that can open, else Resume; back from a page, the button that opened it)
  const at=was==null?panel.querySelector('.gm-tile:not([disabled])')||panel.querySelector('.nav [data-nav="close"]'):panel.querySelector('[data-act="'+({save:'esc-saves',load:'esc-loads',settings:'esc-settings',world:'esc-wpage'}[was]||'esc-resume')+'"]:not([disabled])');
  if(at&&was!=='menu')at.focus({preventScroll:true})
}
// (the old name: the Menu of the windows, before it was one with the Esc menu)
const openHub=()=>{showEsc();return true};
// the bar's Menu and Tab: the Game Menu opened, or closed when open; in the battle test the sandbox's own tools (developer.js)
function menuKey(){if(BattleLab.active)return DevConsole.show('battle');if(G.mode==='title'||G.mode==='loading')return;if(G.mode==='esc')return escAct('esc-resume');showEsc()}
// (the World page: Back to the menu, Resume)
function escWorldPage(msg){G.esc.page='world';showPanel('<div class="top"><h2>World</h2><span class="muted">Day '+G.day+'</span></div>'+worldPage()+(msg?'<p class="gold">'+msg+'</p>':'')+nav(['esc-back',null,'Back'],['esc-resume',null,'Resume']))}
// (Settings, the title's page: Back to the menu, Resume; a change is stored as on the title, ui.js prefSet)
function escSettings(){G.esc.page='settings';showPanel(settingsPage()+nav(['esc-back',null,'Back'],['esc-resume',null,'Resume']))}
// (the save slots: to save to (a slot already used asks a second click to overwrite), or to load)
function escSlots(mode,msg){G.esc.page=mode;showPanel('<div class="top"><h2>'+(mode==='save'?'Save game':'Load game')+'</h2><span class="muted">Day '+G.day+'</span></div><div class="slots">'+slotRows(mode==='save'?'save':'esc')+'</div>'+(msg?'<p class="gold">'+msg+'</p>':'')+nav(['esc-back',null,'Back']))}
/* (before the main menu or the farewell, when play has moved on since the last save: what would be lost, then Save first (a quick
   save, then away), Leave anyway, or Cancel (Back to the menu)) */
function escLeave(to,msg){const E=G.esc,n=unsavedSince(),why=escSaveWhy(E.mode);E.page='leave';
  const b=(arg,label,sub,no)=>'<button class="card menu" type="button" data-act="esc-leave" data-arg="'+arg+'"'+(no?' disabled':'')+'><strong>'+label+'</strong><span>'+htmlText(no||sub)+'</span></button>';
  showPanel('<div class="top"><h2>'+(to==='exit'?'Exit game':'Main menu')+'</h2><span class="muted">Day '+G.day+'</span></div><p class="gm-lose">Unsaved progress since '+(n?'day '+n:'you began')+' will be lost.</p><div class="menulist">'+
    b(to+':save','Save first','A quick save, then '+(to==='exit'?'exit':'the main menu'),why)+b(to,'Leave anyway','Without saving')+'</div>'+(msg?'<p class="bad">'+msg+'</p>':'')+nav(['esc-back',null,'Cancel']))}
function escAct(a,arg){
  if(!a.startsWith('esc-'))return false;if(G.mode!=='esc'||!G.esc)return true;const E=G.esc;
  const back=()=>{G.mode=E.mode;G.esc=null;if(E.html!=null){panel.innerHTML=E.html;panel.className=E.cls;ov.hidden=false;G.modal=E.modal}else hidePanel()};
  // (saved from the screen under the menu, as saveGame asks; done(ok) once it is stored, a gzipped save a moment later)
  const save=(slot,done)=>{G.mode=E.mode;const p=saveGame(true,slot);G.mode='esc';const fin=ok=>{if(G.mode==='esc'&&G.esc===E)done(ok)};if(p&&p.then)p.then(fin);else fin(p)};
  const unkept='Could not save: your browser would not store it (private window, or storage full or blocked).';
  // (away: the main menu lets the world go; Exit asks the browser to close the tab, and says farewell if it does not)
  const leave=to=>{if(to==='exit'){G.esc=null;if(B){B=null;fieldDone();bbar.hidden=true}G.mode='title';G.resume=null;try{window.close()}catch(e){}toTitle('exit')}else{G.mode=E.mode;G.esc=null;if(E.html==null)hidePanel();toTitle()}};
  if(a==='esc-resume'){back();return true}
  if(a==='esc-seed'){const s=WM&&WM.settings&&WM.settings.seed;if(s)copyText(s).then(ok=>{if(G.mode==='esc'&&G.esc===E)showEsc(ok?'Seed '+s+' copied.':'Could not copy it: the seed is '+s+'.')});return true}
  if(a==='esc-wpage'){escWorldPage();return true}
  if(a==='esc-code'){const s=WM&&WM.settings;if(s){const c=worldCode(s);copyText(c).then(ok=>{if(G.mode==='esc'&&G.esc===E)escWorldPage(ok?'World code '+c+' copied.':'Could not copy it: the code is '+c+'.')})}return true}
  if(a==='esc-back'){showEsc();return true}
  if(a==='esc-go'){const e=MENU_ENTRIES[arg];if(!e||menuWhy(e,E))return true;back();e.open();return true}
  if(a==='esc-settings'){escSettings();return true}
  if(a==='esc-saves'){if(escSaveWhy(E.mode))return true;G.overArmed=null;escSlots('save');return true}
  if(a==='esc-loads'){if(!readSave())return true;escSlots('load');return true}
  if(a==='esc-save'){if(escSaveWhy(E.mode))return true;const s=arg||'quick';if(arg&&readSlot(s)&&G.overArmed!==s){G.overArmed=s;escSlots('save');return true}
    G.overArmed=null;save(s,ok=>{const m=ok?'Game saved'+(arg?' ('+slotName(s)+')':'')+'.':unkept;if(arg)escSlots('save',m);else showEsc(m)});return true}
  if(a==='esc-load'){if(!readSave(arg))return true;G.esc=null;if(B){B=null;fieldDone();bbar.hidden=true}loadGame(arg);return true}
  // Main menu and Exit game: asked first when play has moved on since the last save
  if(a==='esc-main'||a==='esc-exit'){const to=a.slice(4);if(unsavedSince()!==false)escLeave(to);else leave(to);return true}
  if(a==='esc-leave'){const [to,how]=String(arg).split(':');if(to!=='main'&&to!=='exit')return true;
    if(how!=='save'){leave(to);return true}
    if(escSaveWhy(E.mode))return true;save('quick',ok=>ok?leave(to):escLeave(to,unkept));return true}
  return true;
}
onAct('esc-',escAct);
// the windows (Army: your band's roster, its skills, condition and passengers, ui/partypage.js)
defineMenuEntry('army',{label:'Army',icon:'troops',key:'C',open:()=>openChar(),why:menuMapOnly});
defineMenuEntry('inventory',{label:'Inventory',icon:'bag',key:'I',open:()=>openInv(),why:menuMapOnly});
defineMenuEntry('quests',{label:'Quests',icon:'scroll',key:'Q',open:()=>openQuests()});
defineMenuEntry('journal',{label:'Journal',icon:'book',key:'J',open:()=>openJournal()});
defineMenuEntry('map',{label:'Map',icon:'map',key:'M',open:()=>fullMapOpen(),why:menuMapOnly});
defineMenuEntry('skills',{label:'Skills',icon:'skills',key:'K',open:()=>openSkills(),why:menuMapOnly});
defineMenuEntry('help',{label:'Help',icon:'help',key:'H',open:()=>openHelp()});
defineMenuEntry('camp',{label:'Camp',icon:'fire',key:'Z',open:()=>toggleCamp(),why:menuMapOnly});
