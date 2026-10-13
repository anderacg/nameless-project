'use strict';
/* ---------- panels ---------- */
function showPanel(html){panel.innerHTML=html;ov.hidden=false;G.modal=true;const b=panel.querySelector('button:not([disabled]),.card');if(b)b.focus({preventScroll:true})}
function hidePanel(){ov.hidden=true;G.modal=false}
/* windows anyone can open over the map or the streets: Help (H) and the message log (L); closing goes back where you were */
function openOver(mode,html){if(G.modal&&G.mode!==mode||!['world','scene'].includes(G.mode))return false;G.overBack=G.mode;G.mode=mode;hideTip();showPanel(html);return true}
function closeOver(){G.mode=G.overBack||'world';G.overBack=null;hidePanel()}
const KEYS=[['Map',[['Click','travel there, or meet what is there'],['Hover','what it is, its strength'],['Space','pause / play'],['1 2 3','game speed'],['C','your hero'],['K','skills'],['I','inventory'],['L','message log'],['G','tile grid'],['F6','save'],['Esc','close a window / menu']]],
  ['Battle',[['Click / drag','select a group, or box several (your hero is a group too; everyone fights on their own)'],['Right-click ground','move the selection there, in formation'],['Right-click enemy','attack that enemy'],['1-4 / 5','hero, infantry, archers, cavalry / all'],['G','next group'],['Z X C V','hold, follow, charge, advance'],['Right-drag','lay out the line: where, how wide (and so how deep), facing which way'],['B / L / T','formation: shield wall (melee infantry) · loose (foot) · wedge (cavalry); again: line'],['Wheel / + −','zoom the battle (toward the cursor); 0: the whole field again'],['Middle-drag / arrows','pan; the same group number twice: look at it; the small map (top right): click to look there'],['Banners','over each group: its morale (flag: green steady, yellow shaken, orange wavering, white routing, torn shattered) and what weakens it (flanked, outnumbered, charged, leader fallen, losing)'],['A','AI command of your army on or off (off: they do only what you order; any order takes it back)'],['Space (deploying)','begin the battle once your band is placed'],['H / W','halt / withdraw: flee the battle by way of the withdrawal point (where you formed up); all withdrawn, the battle ends as your retreat'],['R F Q E','walk or run · hold ground · fire at will · skirmish'],['Shift + right-click','add a waypoint; double right-click: at a run'],['Shift + click / drag','add to the selection'],['Ctrl + 6-9 / 6-9','keep a selection / pick it again'],['Space','pause: you can still select and give orders'],['[ / ]','slower / faster (0.5×, 1×, 2×, 5×)'],['HP bars','health bars on or off (button)']]],
  ['Streets',[['WASD / click','walk'],['E','talk to whoever is near'],['Gate','walk out to leave']]],
  ['Screen',[['F11','full screen'],['H','this help']]]];
function openHelp(){return openOver('help','<div class="top"><h2>Controls</h2></div>'+KEYS.map(([g,ks])=>'<div class="lab">'+g+'</div><div class="keys">'+ks.map(([k,d])=>'<div><kbd>'+k+'</kbd><span>'+d+'</span></div>').join('')+'</div>').join('')+
  '<p class="muted">Hover anything on the map to see what it is and how strong it is against you. Messages fade from the screen after a few seconds; L shows them all.</p><div class="btns"><button class="btn primary" type="button" data-act="help-close">Back</button></div>')}
function openJournal(){return openOver('journal','<div class="top"><h2>Message log</h2><span class="muted">'+G.msgs.length+' messages</span></div><div class="journal">'+
  G.msgs.slice().reverse().map(x=>'<div'+(x.cls?' class="'+x.cls+'"':'')+'>'+(x.day!=null?'<span class="muted">Day '+x.day+' · </span>':'')+x.m+'</div>').join('')+'</div><div class="btns"><button class="btn primary" type="button" data-act="journal-close">Back</button></div>')}
onAct('help-',()=>closeOver());onAct('journal-',()=>closeOver());
// the tooltip: what is under the pointer on the map, how strong it is against you, and what a click does
// against your pace: faster or slower than your band on this ground
const paceVs=sp=>{const me=MAP_BASE*travelMul();return sp>me*1.1?' · <span class="bad">faster than you</span>':sp<me*.9?' · <span class="good">slower than you</span>':' · as fast as you'};
const odds=pw=>{const r=pw/Math.max(1,partyPower());return r<.6?['Easy','good']:r<1?['Even','gold']:r<1.5?['Risky','bad']:['Deadly','bad']};
// who leads a bandit band, camp or hideout, and the price on its head
const chiefTip=o=>o&&o.ld?'<small>Led by '+chiefLabel(o.ld)+' · bounty '+bountyOf(o.ld)+' gold</small>':'';
function tipFor(o){
  const k=objKind(o),fc=f=>f&&FACS[f]?'<span style="color:'+FACS[f].col+'">'+FACS[f].n+'</span>':'',vs=pw=>{const [n,c]=odds(pw);return ' · <span class="'+c+'">'+n+'</span>'};
  if(k==='town')return '<b>'+o.name+'</b><small>'+cap1(o.label)+(o.owner?' of the '+fc(o.owner):'')+' · '+WALL_N[wallOf(o)]+'</small>'+(closedNow(o)?'<small class="bad">Under siege</small>':'')+'<span class="act">'+(hostileTo(o.owner)?'Click: attack it':'Click: enter')+'</span>';
  if(k==='estate')return '<b>'+ESTATES[o.k].n+'</b><small>Estate of '+o.town+'</small><span class="act">Click: look</span>';
  if(k==='lord')return '<b>'+o.name+' <span class="muted">Lv '+lordStats(o).lv+'</span></b><small>'+fc(o.fac)+' · '+o.troops.length+' soldiers'+vs(rating(o.troops))+paceVs(lordSpeed(o))+'</small><span class="act">Click: '+(hostileTo(o.fac)?'fight':'talk')+'</span>';
  if(k==='band')return '<b>'+(BANDS[o.kind||'bandits']?BANDS[o.kind||'bandits'][0].replace(' ahead',''):'Bandits')+'</b>'+chiefTip(o)+'<small>'+o.n+' fighters'+vs(bandPower(o))+paceVs(partySpeed(o,o.list||[]))+'</small><span class="act">Click: attack</span>';
  if(k==='monster'){const M=MONSTERS[o.id];return '<b>'+(M.n||o.id)+(o.n>1?' ×'+o.n:'')+'</b><small>Level '+o.lv+vs(monPower(o))+'</small><span class="act">Click: fight</span>'}
  if(k==='site')return o.tip();// (each kind of site: sites.js)
  if(k==='critter'){const D=CRITTERS[o.id];return '<b>'+D.n+(o.n>1?' ×'+o.n:'')+'</b><small>'+(D.live?'Livestock of '+o.home:'Wild game')+'</small><span class="act">Click: '+(D.live?'look':'hunt')+'</span>'}
  if(k==='caravan')return '<b>Caravan</b><small>'+(o.from||'')+' → '+(o.to||'')+(o.fac?' · '+fc(o.fac):'')+'</small><span class="act">Click: meet</span>';
  if(k==='refugee')return '<b>Refugees</b><small>From '+o.from+' to '+o.to+'</small><span class="act">Click: meet</span>';
  if(k==='patrol')return '<b>'+(o.watch==='night'?'Night watch':'Guards')+' of '+o.home+'</b><small>'+fc(o.fac)+' · '+o.troops.length+' soldiers'+(hostileTo(o.fac)?vs(rating(o.troops)):'')+'</small><span class="act">Click: meet</span>';
  if(k==='cparty')return '<b>'+COMPS[o.cid].short+'’s party</b><small>Your companion · '+o.troops.length+' soldiers · '+({follow:'riding with you',patrol:'patrolling '+o.base,return:'coming back'})[o.order]+'</small><span class="act">Click: orders</span>';
  if(k==='worker')return '<b>'+cap1(o.job)+'</b><small>Of '+o.home+'</small><span class="act">Click: talk</span>';
  return '';
}
function hideTip(){const t=document.getElementById('tip');if(t)t.hidden=true}
// full screen (F11 does the same)
function toggleFull(){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen()}catch(e){}}
/* the main menu: Continue, New game, Load game, Settings, Wiki, Exit; opened from the HUD it can Resume the game in progress */
// the tile grid: a faint line along every 16-pixel tile edge on the map and in scenes; remembered between games
const GRID={on:(()=>{try{return localStorage.getItem('ashmark.grid')==='1'}catch(e){return false}})()};
function setGrid(on){GRID.on=!!on;try{localStorage.setItem('ashmark.grid',GRID.on?'1':'0')}catch(e){}}
// health bars over every fighter in battle (off: only you and your companions); remembered between games
// the battle's speed: the clock runs at this rate (and stands still while paused, though you can still give orders: a
// tactical pause); each battle starts at the speed set in Settings
const BATTLE_SPEEDS=[.5,1,2,5],BSPEED={v:(()=>{try{const n=+localStorage.getItem('ashmark.bspeed');return BATTLE_SPEEDS.includes(n)?n:1}catch(e){return 1}})()};
function setBattleSpeed(v,save){if(!BATTLE_SPEEDS.includes(v))return;if(B)B.speed=v;if(save){BSPEED.v=v;try{localStorage.setItem('ashmark.bspeed',String(v))}catch(e){}}battleSpeedUI()}
function battleSpeedStep(d){const i=BATTLE_SPEEDS.indexOf(B?B.speed:BSPEED.v);setBattleSpeed(BATTLE_SPEEDS[clamp(i+d,0,BATTLE_SPEEDS.length-1)])}
function battlePause(on){if(!B)return;if(B.deploy){if(on!==true)beginFight();return}B.paused=on==null?!B.paused:!!on;battleSpeedUI()}
function battleSpeedUI(){if(typeof document==='undefined')return;const sp=B?B.speed:BSPEED.v;
  document.querySelectorAll('[data-bspeed]').forEach(b=>{const on=+b.dataset.bspeed===sp;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
  const p=document.getElementById('bPause');if(p){const on=!!(B&&B.paused);p.classList.toggle('on',on);p.setAttribute('aria-pressed',String(on));p.textContent=B&&B.deploy?'⚔ Begin':on?'▶ Play':'⏸ Pause'}if(B&&typeof bhudTop==='function')bhudTop()}
const HPBARS={on:(()=>{try{return localStorage.getItem('ashmark.hpbars')!=='0'}catch(e){return true}})()};
function setHpBars(on){HPBARS.on=!!on;try{localStorage.setItem('ashmark.hpbars',HPBARS.on?'1':'0')}catch(e){}const b=typeof document!=='undefined'&&document.getElementById('hpBtn');if(b){b.classList.toggle('on',HPBARS.on);b.setAttribute('aria-pressed',String(HPBARS.on))}}
const CONTROLS='World map: click to move, Space to pause, C for your character, K for skills, I for your inventory, G to show the tile grid, F6 to save. Battle: WASD to move, Space or click to attack (a 3-hit combo with melee weapons; bows and staves shoot where you aim), F to dodge, right-click to shove, 1 to 0 for your skill slots, Shift to sprint, B to block, G to pick a troop group, Z X C V T to give it orders.';
const saveLine=sv=>'Day '+sv.day+' · '+RACES[sv.P.race||'human'].n+' '+((BGS[sv.P.bg]||{}).n||'hero').toLowerCase()+' · level '+sv.P.level+' · '+sv.P.gold+' gold';
// Small, code-drawn origin illustrations keep the new-game cards vivid without loading extra sprite sheets.
const ORIGIN_ART={soldier:['#273747','#c1844d','#d7b974','M0 82h320v30H0z M28 55h38v27H28z M36 40h22v15H36z M234 48h54v34h-54z M246 30h28v18h-28z','sword'],guard:['#314641','#b68449','#d6c48b','M0 82h320v30H0z M20 55h42v27H20z M28 40h26v15H28z M250 50h40v32h-40z','spear'],woodcutter:['#233b32','#8f6844','#b9a168','M0 76h320v36H0z M15 0h24v75H15z M54 0h17v74H54z M258 12h14v60h-14z M284 0h23v77h-23z','axe'],exile:['#29384a','#bb7658','#b8c0a0','M0 82h320v30H0z M20 38h30v44H20z M36 18h30v30H36z M256 28h18v54h-18z M270 12h34v35h-34z','bow'],merchant:['#4a3b38','#be8650','#dfc377','M0 82h320v30H0z M16 52h50v30H16z M25 36h34v16H25z M254 53h40v29h-40z','crossbow'],hedge:['#34354e','#9077a8','#c2acd0','M0 82h320v30H0z M18 56h42v26H18z M29 39h23v17H29z M245 52h48v30h-48z M263 32h15v20h-15z','staff'],apprentice:['#37414b','#7393a0','#d1b678','M0 82h320v30H0z M20 59h40v23H20z M30 43h21v16H30z M250 58h45v24h-45z M266 40h14v18h-14z','wand']};
function originArt(key){const [sky,coat,glow,land,weapon]=ORIGIN_ART[key]||ORIGIN_ART.soldier;const stars=key==='hedge'||key==='apprentice'?'<path d="M36 18v8m-4-4h8M260 18v7m-3-3h6M111 34v5m-2-2h4" stroke="#e8d58c" stroke-width="2"/>':'';const arms=weapon==='bow'?'<path d="M210 38q-22 26 0 52M210 39q18 25 0 51M210 40v50" fill="none" stroke="#c79655" stroke-width="3"/><path d="M209 64h-21" stroke="#e5d6b5" stroke-width="2"/>':weapon==='spear'?'<path d="M211 27v72" stroke="#9f7048" stroke-width="4"/><path d="M211 24l-5 12h10z" fill="#c7c8bb"/>':weapon==='axe'?'<path d="M210 49v48" stroke="#9a6942" stroke-width="5"/><path d="M207 49q19-12 22 3l-13 8-9-3z" fill="#bfc2b6"/>':weapon==='crossbow'?'<path d="M195 61h33m-16-13v27m-15-23q15 19 30 0" fill="none" stroke="#bd9259" stroke-width="4"/>':weapon==='staff'?'<path d="M211 34v64" stroke="#94744e" stroke-width="4"/><path d="M211 27l5 6-5 6-5-6z" fill="#c2a9da"/>':weapon==='wand'?'<path d="M209 49l7 46" stroke="#ab8150" stroke-width="4"/><path d="M207 44l3-7 5 6-4 7z" fill="#b9dcdf"/>':'<path d="M210 40v57" stroke="#927047" stroke-width="4"/><path d="M205 33h10v30h-10z" fill="#b8c6cc"/><path d="M205 34h10" stroke="#ead9ac" stroke-width="2"/>';return '<svg class="origin-art" viewBox="0 0 320 112" aria-hidden="true" focusable="false" shape-rendering="crispEdges"><rect width="320" height="112" fill="'+sky+'"/><circle cx="268" cy="24" r="12" fill="'+glow+'" opacity=".9"/><path d="M0 69l42-28 41 28 48-38 55 40 48-31 86 39v22H0z" fill="#17242b" opacity=".8"/>'+stars+'<path d="'+land+'" fill="#3a493f"/><ellipse cx="164" cy="96" rx="34" ry="6" fill="#172127" opacity=".7"/><path d="M151 48h27v12h8v25h-7v12h-28V85h-7V60h7z" fill="'+coat+'"/><rect x="155" y="34" width="20" height="19" fill="#c89a70"/><path d="M152 38h25v5h-25z" fill="#382b2a"/><path d="M151 60l-12 20 5 3 16-14m18-9 13 16-4 4-17-13" fill="none" stroke="'+coat+'" stroke-width="7"/><path d="M152 94v13m20-13v13" stroke="#222a31" stroke-width="7"/>'+arms+'<path d="M0 108h320" stroke="'+glow+'" stroke-width="4" opacity=".7"/></svg>'}
function showTitle(screen){
  if(G.mode!=='title'){G.resume=['world','town','char','inv','skills'].includes(G.mode)&&P.bg?G.mode:null}
  G.mode='title';G.menu=screen||'main';G.race=G.race||'human';const sv=readSave(),back='<div class="btns"><button class="btn" type="button" data-act="menu" data-arg="main">Back</button></div>';
  const card=(act,arg,title,sub,dis)=>'<button class="card menu" type="button" data-act="'+act+'"'+(arg?' data-arg="'+arg+'"':'')+(dis?' disabled':'')+'><strong>'+title+'</strong><span>'+sub+'</span></button>';
  if(G.menu==='new')return showPanel('<div class="top"><h2>New game</h2></div><div class="lab">Choose your race</div><div class="tabs" role="group" aria-label="Race">'+Object.keys(RACES).map(r=>'<button class="btn sm'+(G.race===r?' on':'')+'" type="button" data-act="race" data-arg="'+r+'" aria-pressed="'+(G.race===r)+'">'+RACES[r].n+'</button>').join('')+'</div><p class="muted">'+RACES[G.race].d+' Troops of your own race cost 15% less to hire.</p>'+
    '<div class="lab">Choose your past · it decides your weapon</div><div class="cards origin-cards">'+Object.keys(BGS).map(k=>{const B0=BGS[k],w=BASES[B0.weapon];return '<button class="card origin-card" type="button" data-act="begin" data-arg="'+k+'">'+originArt(k)+'<strong>'+B0.n+'</strong><span class="gold">'+w.n+' · '+(w.kind==='ranged'?'Ranged':w.kind==='magic'?'Magic':'Melee')+'</span><span>'+B0.d+'</span></button>'}).join('')+'</div>'+ 
    (sv?'<p class="bad" style="font-size:13px">Starting a new game will replace your saved game when it next saves.</p>':'')+back);
  if(G.menu==='load')return showPanel('<div class="top"><h2>Load game</h2></div>'+(sv?'<div class="cards">'+card('load',null,'Saved game',saveLine(sv))+'</div>'+
      '<div class="btns"><button class="btn sm" type="button" data-act="'+(G.wipeArmed?'wipe':'wipe-ask')+'">'+(G.wipeArmed?'Click again to delete the save':'Delete save')+'</button></div>':'<p class="muted">No saved game yet. The game saves itself each day and when you leave a town; F6 saves at any time.</p>')+back);
  if(G.menu==='settings')return showPanel('<div class="top"><h2>Settings</h2></div>'+
    '<div class="lab">Realm economy</div><div class="tabs" role="group" aria-label="Realm economy">'+Object.keys(ECON_MODES).map(m=>'<button class="btn sm'+(ECON.mode===m?' on':'')+'" type="button" data-act="econmode" data-arg="'+m+'" aria-pressed="'+(ECON.mode===m)+'">'+ECON_MODES[m][0]+'</button>').join('')+'</div><p class="muted">'+ECON_MODES[ECON.mode][1]+'</p>'+
    '<div class="lab">Map grid</div><div class="tabs" role="group" aria-label="Map grid">'+[['off','Off'],['on','On']].map(([v,n])=>'<button class="btn sm'+(GRID.on===(v==='on')?' on':'')+'" type="button" data-act="grid" data-arg="'+v+'" aria-pressed="'+(GRID.on===(v==='on'))+'">'+n+'</button>').join('')+'</div><p class="muted">Lines along every tile (16 by 16 pixels) on the world map and in towns. G on the map turns it on and off.</p>'+
    '<div class="lab">Battle speed (each battle starts at it; change it in battle too)</div><div class="tabs" role="group" aria-label="Battle speed">'+BATTLE_SPEEDS.map(v=>'<button class="btn sm'+(BSPEED.v===v?' on':'')+'" type="button" data-act="bspeed" data-arg="'+v+'" aria-pressed="'+(BSPEED.v===v)+'">'+v+'×</button>').join('')+'</div>'+
    '<div class="lab">Deployment</div><div class="tabs" role="group" aria-label="Deployment">'+[['off','Off'],['on','On']].map(([v,n])=>'<button class="btn sm'+(BDEPLOY.on===(v==='on')?' on':'')+'" type="button" data-act="bdeploy" data-arg="'+v+'" aria-pressed="'+(BDEPLOY.on===(v==='on'))+'">'+n+'</button>').join('')+'</div><p class="muted">On, a battle opens frozen so you can place your band in its zone first (Space to begin).</p>'+
    '<div class="lab">Health bars in battle</div><div class="tabs" role="group" aria-label="Health bars in battle">'+[['off','Off'],['on','On']].map(([v,n])=>'<button class="btn sm'+(HPBARS.on===(v==='on')?' on':'')+'" type="button" data-act="hpbars" data-arg="'+v+'" aria-pressed="'+(HPBARS.on===(v==='on'))+'">'+n+'</button>').join('')+'</div><p class="muted">A bar over every ally and enemy. Off, only you and your companions show one. The HP bars button in battle switches it too.</p>'+
    '<div class="lab">Controls</div><p class="muted">'+CONTROLS+'</p>'+back);
  if(G.menu==='exit')return showPanel('<h2 class="big">Ashmark</h2><p>Thanks for playing. You can close this tab now.</p><div class="btns"><button class="btn" type="button" data-act="menu" data-arg="main">Back to the menu</button></div>');
  showPanel('<h2 class="big">Ashmark</h2><p>Rise from a nobody to a ruler. Recruit a warband, trade between towns, and fight in real time.</p><div class="menulist">'+
    (G.resume?card('resume',null,'Resume','Back to your game'):'')+
    (sv?card('load',null,'Continue',saveLine(sv)):'')+
    card('menu','new','New game','Choose your race and your past')+
    card('menu','load','Load game',sv?'Your saved game':'No saved game yet')+
    card('menu','settings','Settings','Art and controls')+
    card('menu','wiki','Wiki','How everything works: the world, realms, economy, battle, gear, your hero and more (opens a new tab)')+
    card('menu','exit','Exit','Leave Ashmark')+'</div>');
}
/* Esc: close what can be closed; otherwise open the Esc menu, which pauses everything and remembers the screen under it */
// screens Esc closes, and the action that closes each
// where you may save (the Esc menu and saveGame agree): anywhere calm, never mid-fight or mid-choice
const ESC_SAVE=['world','town','char','inv','skills','site','herd','besiege','scene'];
const ESC_CLOSE={comp:'cm-back',help:'help-close',journal:'journal-close',town:'leave',char:'char-close',inv:'inv-close',skills:'sk-close',site:'site-leave',herd:'herd-leave',besiege:'sg-leave'};
// Esc closes the window in front, one press at a time: whichever of these the open panel offers (an inner window before the
// one behind it). A panel that only offers real choices (a fight, a perk, the fate of a holding) is never chosen for you:
// Esc then pauses with the Esc menu, as it does once no window is left.
const ESC_DISMISS=['scene-back','back-town','dlg-ok','dlg-close','cv-leave','lord-leave','ev-done','cont','sg-leave','site-leave','herd-leave','leave'];
function escDismiss(){if(ov.hidden)return null;for(const a of ESC_DISMISS){const b=panel.querySelector('[data-act="'+a+'"]:not([disabled])');if(b)return b}return null}
function onEscape(){
  if(G.mode==='esc')return escAct('esc-resume');
  if(G.mode==='title'){if(G.menu&&G.menu!=='main')return menuAct('menu','main');if(G.resume)return menuAct('resume');return}
  if(G.place&&G.mode==='world'){G.place=null;log('You stop placing.');return}
  const b=escDismiss();if(b)return act(b.dataset.act,b.dataset.arg);
  if(ESC_CLOSE[G.mode])return act(ESC_CLOSE[G.mode]);
  showEsc();
}
function showEsc(msg){
  if(G.mode!=='esc'){if(B&&B.draw)B.draw=null;G.esc={mode:G.mode,html:ov.hidden?null:panel.innerHTML,modal:G.modal}}
  G.mode='esc';const from=G.esc.mode,sv=readSave(),canSave=ESC_SAVE.includes(from);
  const b=(act,label,why)=>'<button class="card menu" type="button" data-act="'+act+'"'+(why?' disabled':'')+'><strong>'+label+'</strong>'+(why?'<span>'+why+'</span>':'')+'</button>';
  showPanel('<div class="top"><h2>Paused</h2><span class="muted">Day '+G.day+' · '+(from==='battle'?'in battle':'on the road')+'</span></div><div class="menulist">'+
    b('esc-resume','Resume')+b('esc-save','Save game',canSave?'':from==='battle'?'Not during a battle':'Finish what is in front of you first')+
    b('esc-load','Load game',sv?'':'No saved game')+b('esc-main','Main menu')+b('esc-exit','Exit game')+'</div>'+
    (msg?'<p class="gold">'+msg+'</p>':'')+'<p class="muted" style="font-size:13px">Esc resumes.</p>');
}
function escAct(a){
  if(!a.startsWith('esc-'))return false;if(G.mode!=='esc'||!G.esc)return true;const E=G.esc;
  const back=()=>{G.mode=E.mode;G.esc=null;if(E.html!=null){panel.innerHTML=E.html;ov.hidden=false;G.modal=E.modal}else hidePanel()};
  if(a==='esc-resume'){back();return true}
  if(a==='esc-save'){if(!ESC_SAVE.includes(E.mode))return true;G.mode=E.mode;saveGame(true);G.mode='esc';showEsc('Game saved.');return true}
  if(a==='esc-load'){if(!readSave())return true;G.esc=null;if(B){B=null;bbar.hidden=true}loadGame();return true}
  if(a==='esc-main'){G.mode=E.mode;G.esc=null;if(E.html==null)hidePanel();showTitle();return true}
  if(a==='esc-exit'){G.esc=null;if(B){B=null;bbar.hidden=true}G.mode='title';G.resume=null;try{window.close()}catch(e){}showTitle('exit');return true}
  return true;
}
function menuAct(a,arg){
  if(a==='resume'){if(G.resume){const m=G.resume;G.resume=null;if(m==='town'&&G.town){G.mode='town';renderTown()}else{G.mode='world';hidePanel()}}return true}
  if(a==='wipe-ask'){G.wipeArmed=true;showTitle('load');return true}
  if(a!=='menu')return false;
  G.wipeArmed=false;
  if(arg==='wiki'){try{window.open('wiki.html','_blank')}catch(e){}return true}
  if(arg==='exit'){try{window.close()}catch(e){}showTitle('exit');return true}
  showTitle(arg);const b=panel.querySelector('.card,button');if(b)b.focus({preventScroll:true});return true;
}
function begin(k){G.scene=null;
  const b=BGS[k];P.bg=k;P.gold=b.gold;P.troops={...b.troops};P.bonus=b.bonus;P.morale=80;P.renown=0;P.level=1;P.xp=0;
  const rc=RACES[P.race=G.race||'human'];
  P.attr={str:2,agi:2,int:2,cha:2};for(const a in b.attr)P.attr[a]+=b.attr[a];for(const a in rc.attr)P.attr[a]=Math.max(1,P.attr[a]+rc.attr[a]);
  // every discipline starts at 0; your race and past give a knack: 25% faster learning per point (P.apt)
  P.sk=mkSkills();P.apt={};for(const src of [b.sk,rc.sk])for(const s in src||{})P.apt[s]=(P.apt[s]||0)+.25*src[s];
  P.pts=0;P.perks=[];P.perkPend=0;P.origin=originOf(k);P.tree=[P.origin];applyNode(P.origin,1);P.tp=0;P.slots=Array(10).fill(null);G.skSel=P.origin;G.tv=null;P.stay=null;P.txp={};P.prisoners={};P.captives=[];P.wounded={};P.comps={};P.fac=null;P.hostile={};P.rep={};P.honor={};P.hp=P.sp=P.mp=null;P.siege=null;P.raid=null;P.fiefWeek=0;P.quests=[];P.jobs={};P.qid=0;G.lordJob=null;G.capture=null;G.bes=null;P.gear={...emptyGear(),weapon:gearId(b.weapon||'sword',0)};P.inv=Array(INV_SIZE).fill(null);for(const g in b.cargo)invAdd('good',g,b.cargo[g]);if(b.ammo)invAdd('good',b.ammo[0],b.ammo[1]);G.perkOffer=null;G.chase=null;W.sites=[];initWorld();W.sites=genSites();G.lastSite=null;G.site=null;W.critters=[];W.ships=[];fogReset();G.herd=null;initCritters();
  const home=townBy(START_TOWN[P.race])||TOWNS[0];if(b.rep)P.rep[home.name]=b.rep;
  P.x=(home.tx+.5)*TILE;P.y=(home.ty+2.5)*TILE;P.tx=null;G.day=1;G.clock=0;G.mode='world';G.lastTown=home;
  bandits=[];for(let i=0;i<BANDITS;i++)spawnBandit(true);
  for(let i=0;i<MONSTER_START;i++)spawnMonster(true);
  hidePanel();G.msgs=[];log('You ride out of '+home.name+' alone, as '+(rc.n==='Elf'||rc.n==='Orc'?'an ':'a ')+rc.n.toLowerCase()+' '+b.n.toLowerCase()+'. Win fame around here and the locals will follow you.');updateHint();updateHUD(true);
}
onAct('esc-',escAct);
