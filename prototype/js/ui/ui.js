'use strict';
/* ---------- panels ---------- */
function showPanel(html){panel.classList.remove('wide','railed','paged','fmap');panel.innerHTML=html;ov.hidden=false;G.modal=true;const b=panel.querySelector('button:not([disabled]),.card');if(b)b.focus({preventScroll:true})}
function hidePanel(){ov.hidden=true;G.modal=false}
/* every window's bottom bar: its navigation only; the game's choices stay in the window above it. back: [act, arg, label] on
   the left, when it was opened from another window; close: [act, arg, label, why disabled, noEsc] on the right, the way out,
   named for where it takes you. Esc presses Back, else the way out (escDismiss), unless going costs you something (noEsc) */
function nav(back,close){const b=(a,cls,k)=>'<button class="btn'+cls+'" type="button" data-nav="'+k+'" data-act="'+a[0]+'"'+(a[1]!=null?' data-arg="'+a[1]+'"':'')+(a[3]?' disabled title="'+a[3]+'"':'')+(a[4]?' data-noesc':'')+'>'+a[2]+'</button>';
  return '<div class="btns nav">'+(back?b(back,'','back'):'')+'<span class="grow"></span>'+(close?b(close,' primary','close'):'')+'</div>'}
/* windows anyone can open over the map or the streets: Help (H) and the message log (L); closing goes back where you were */
function openOver(mode,html){if(G.modal&&G.mode!==mode||!['world','scene'].includes(G.mode))return false;G.overBack=G.mode;G.mode=mode;hideTip();showPanel(html);return true}
function closeOver(){G.mode=G.overBack||'world';G.overBack=null;hidePanel()}
const KEYS=[['Map',[['Click','travel there, or meet what is there'],['Hover','what it is, its strength'],['Space','pause / play'],['1 2 3','game speed: 1×, 2×, 4×'],['4','hurry: your band marches twice as fast, its stamina draining 2.5× as fast, till you stop or it is Exhausted (the top bar’s Hurry too)'],['C','your hero'],['K','skills'],['I','inventory'],['P','people: your companions, lords, those you know, the realms'],['L','message log'],['M','the full map: realms, rivers, crossings, holdings (a click on the minimap opens it too)'],['Wheel / + −','zoom the map in or out (the buttons by Save too)'],['G','tile grid'],['F6','save'],['Esc','close a window / menu']]],
  ['Battle',[['Click / drag','select a group (a soldier or the icon over it), or box several (your hero is a group too; everyone fights on their own)'],['Right-click ground','move the selection there, in formation (walking)'],['Right-click enemy','walk in and attack that enemy'],['Double right-click','the same at a run: on an enemy, a charge'],['H C V','hold (where they stand) · charge · advance'],['Right-drag','lay out the line: where, how wide (and so how deep), facing which way; a left-click or Esc mid-drag calls it off'],['B / L / T','B: supported shield infantry ability · L: loose spacing · T: cavalry wedge (bonus starts at 6 formed riders); L/T again: line'],['Wheel / + −','zoom the battle (toward the cursor); Home: the whole field again'],['Middle-drag / arrows','pan; the same group number twice: look at it; the small map (top right): click to look there'],['Banners','over each group: its side’s pennant (yours blue, your allies’ green, the enemy’s red) with its kind’s mark and a health bar; round badges beside it when something is wrong (wavering, routing, shattered, flanked, outnumbered, charged, leader fallen, losing)'],['A','the AI commands the selected groups (an AI badge on their cards and banners; its paths violet); with none selected, your whole army; A again takes them back, and any order you give a group takes that group back'],['G I U Y O','unit abilities of the selection: brace · fire arrows · spur · rally · scout ahead (scout units)'],['Z S','commander powers (your hero, within the command radius): Rally the Line · Stand Fast!'],['Space (deploying)','begin the battle once your band is placed'],['W','withdraw: flee the battle off your edge of the field; all withdrawn, the battle ends as your retreat'],['R F Q E X','walk or run · hold ground · cease fire · skirmish · melee mode (shooters)'],['Shift + right-click','add a waypoint; double right-click: at a run'],['Ctrl + right-click / D','attack-move: march there, turning on any enemy met on the way (melee attack, riders charge, shooters halt and shoot), then on to the place; D (the button) makes your next order on the ground one, Esc calls it off; with Shift, a waypoint; Ctrl + right-drag, a line'],['Shift + click / drag','add to the selection'],['1–9 / 0','select army group cards 1–10; Ctrl + number stores a custom selection'],['Space','pause: you can still select and give orders'],['[ / ]','slower / faster (0.5×, 1×, 2×, 5×)'],['HP bars','health bars on or off (button)']]],
  ['Touch',[['Tap','map: travel there, or meet what is there · battle: select a group; tap again: send it there (or on that enemy)'],['Hold','map: what it is and how strong (tap again to put the card away) · battle: move the selection there, or attack the enemy held (a ring fills)'],['Hold, then drag','battle: lay out the line, as a right-drag; a second finger calls it off'],['Drag','battle: box several groups'],['Pinch / two fingers','map: zoom in or out · battle: zoom about them / pan'],['Tap the minimap','the full map']]],
  ['Town',[['1–9 / 0','go to a place on the left (Market, Tavern, Barracks …; in your fief, a building)'],['Esc','from a place back to the town, then out'],['P','people']]],
  ['Streets',[['WASD / click','walk'],['E','talk to whoever is near'],['Gate','walk out to leave']]],
  ['Screen',[['F11','full screen'],['H','this help'],['Shift + M','sound off / on']]]];
function openHelp(){return openOver('help','<div class="top"><h2>Controls</h2></div>'+KEYS.map(([g,ks])=>'<div class="lab">'+g+'</div><div class="keys">'+ks.map(([k,d])=>'<div><kbd>'+k+'</kbd><span>'+d+'</span></div>').join('')+'</div>').join('')+
  '<p class="muted">Hover anything on the map to see what it is and how strong it is against you. People you meet on the road call out: a pulsing ! marks them (an arrow at the screen’s edge when they are off it); click one to ride over and meet them, or ride on. Messages fade from the screen after a few seconds; L shows them all.</p>'+nav(null,['help-close',null,'Close']))}
function openJournal(){return openOver('journal','<div class="top"><h2>Message log</h2><span class="muted">'+G.msgs.length+' messages</span></div><div class="journal">'+
  G.msgs.slice().reverse().map(x=>'<div'+(x.cls?' class="'+x.cls+'"':'')+'>'+(x.day!=null?'<span class="muted">Day '+x.day+' · </span>':'')+x.m+'</div>').join('')+'</div>'+nav(null,['journal-close',null,'Close']))}
onAct('help-',()=>closeOver());onAct('journal-',()=>closeOver());
// the tooltip: what is under the pointer on the map, how strong it is against you, and what a click does
// against your pace: faster or slower than your band on this ground
const paceVs=sp=>{const me=MAP_BASE*travelMul();return sp>me*1.1?' · <span class="bad">faster than you</span>':sp<me*.9?' · <span class="good">slower than you</span>':' · as fast as you'};
const odds=pw=>{const r=pw/Math.max(1,partyPower());return r<.6?['Easy','good']:r<1?['Even','gold']:r<1.5?['Risky','bad']:['Deadly','bad']};
// who leads a bandit band, camp or hideout, and the price on its head
const chiefTip=o=>o&&o.ld?'<small>Led by '+chiefLabel(o.ld)+' · bounty '+bountyOf(o.ld)+' gold</small>':'';
// a realm's name in its colour, and how a fight against this power would go (for each thing's tip)
const tipFac=f=>f&&FACS[f]?'<span style="color:'+FACS[f].col+'">'+FACS[f].n+'</span>':'';
const tipOdds=pw=>{const [n,c]=odds(pw);return ' · <span class="'+c+'">'+n+'</span>'};
// what the pointer is over: whatever is on the map says (WorldObject tip); nothing for what is not (or no longer) there
function tipFor(o){return objKind(o)?o.tip():''}
function hideTip(){const t=document.getElementById('tip');if(t){t.hidden=true;t.classList.remove('hold')}}
// full screen (F11 does the same)
function toggleFull(){try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen()}catch(e){}}
/* ---------- settings, remembered between games, each in its own browser-storage key 'ashmark.<key>' ----------
   PREFS: key → def (the default: nothing stored, or storage blocked), read (the stored text → the value), write (the value →
   the text), apply (what a change does at once, once stored). prefSet keeps the value as a reload would read it back. The
   globals other files read (GRID.on, BSPEED.v …; deploy.js: BDEPLOY, AUTOSK, BAUTO) are views over PREFS: setting one
   directly changes it for this session only, stored nowhere (the tests do) */
const BATTLE_SPEEDS=[.5,1,2,5];
// on/off, stored '1' or '0'; anything else reads as the default
const prefOnOff=(def,apply)=>({def,read:s=>def?s!=='0':s==='1',write:v=>v?'1':'0',apply});
// a volume 0–1, stored as text ('0.75'), anything else its default
function prefVol(def){return{def,read:s=>{if(s==null||s==='')return def;const v=+s;return v>=0&&v<=1?Math.round(v*100)/100:def},write:v=>String(Math.round(clamp(+v||0,0,1)*100)/100),apply:()=>{if(typeof audioPrefs==='function')audioPrefs()}}}
const PREFS={
  grid:prefOnOff(false),// the tile grid: a faint line along every 16-pixel tile edge on the map and in scenes (G)
  mapzoom:{def:0,read:s=>{const v=parseInt(s,10);return v>=1&&v<=16?v:0},write:String,apply:v=>{MAPZOOM.z=v;fitScreen()}},// the world map's zoom: 0 auto, else its scale (core.js MAPZOOM)
  bspeed:{def:1,read:s=>BATTLE_SPEEDS.includes(+s)?+s:1,write:String},// the speed each battle starts at
  guide:prefOnOff(true,()=>{if(typeof updateHint==='function')updateHint()}),// guide texts: the hints at the top of the screen and the helper lines in towns and battle
  bdeploy:prefOnOff(true),// deployment: a battle you fight opens frozen, to place your band first (deploy.js)
  hpbars:prefOnOff(true,v=>{const b=typeof document!=='undefined'&&document.getElementById('hpBtn');if(b){b.classList.toggle('on',v);b.setAttribute('aria-pressed',String(v))}}),// health bars over every fighter in battle (off: only you and your companions); the HP bars button shows it
  blood:prefOnOff(true),// blood in battle: the spray of a blow, the stains it leaves, the pool under the fallen (off: none of it; the fallen still lie)
  autoskills:prefOnOff(true,()=>autoUI()),// your characters use their skills on their own (Auto skills, K: deploy.js)
  bauto:prefOnOff(false),// the AI in command of your army (A), kept for the next battle (setAuto, deploy.js)
  ambient:prefOnOff(true),// ambient life: birds, crows, gulls, butterflies, fireflies, fish and small critters on the map, a few birds in battle (drawn only: AMBIENT.on, gfx/ambient.js)
  bfog:prefOnOff(true),// fog of war in battle: each side sees only what its soldiers can (FOG.on, battlefog.js)
  opaths:{def:'sel',read:s=>['all','sel','off'].includes(s)?s:'sel',write:String},// order paths in battle: every group's, the selected (and pointed at, and just ordered) only, or none (ui/orderpaths.js)
  // the sound (audio.js): all of it off (Shift+M), and the volumes 0–1 (everything, the music, the effects); each change goes straight
  // to the speakers (audioPrefs)
  mute:prefOnOff(false,()=>{if(typeof audioPrefs==='function')audioPrefs()}),volmaster:prefVol(.8),volmusic:prefVol(.5),volsfx:prefVol(.8)};
// what a setting reads as from storage (as the game loads)
function prefLoad(k){const p=PREFS[k];try{return p.read(localStorage.getItem('ashmark.'+k))}catch(e){return p.def}}
for(const k in PREFS)PREFS[k].v=prefLoad(k);
MAPZOOM.z=PREFS.mapzoom.v;
const prefGet=k=>PREFS[k].v;
function prefSet(k,v){const p=PREFS[k],s=p.write(v);p.v=p.read(s);try{localStorage.setItem('ashmark.'+k,s)}catch(e){}if(p.apply)p.apply(p.v)}
const prefView=(k,f='on')=>Object.defineProperty({},f,{get:()=>prefGet(k),set:v=>{PREFS[k].v=v},enumerable:true});
const GRID=prefView('grid'),BSPEED=prefView('bspeed','v'),GUIDE=prefView('guide'),HPBARS=prefView('hpbars'),BLOOD=prefView('blood');
function setGrid(on){prefSet('grid',on)}
function setGuide(on){prefSet('guide',on)}
function setHpBars(on){prefSet('hpbars',on)}
function setBlood(on){prefSet('blood',on)}
// all sound off or back on (Shift+M, anywhere; Settings → Sound)
function toggleMute(){prefSet('mute',!prefGet('mute'));if(G.mode==='title'){if(G.menu==='settings')showTitle('settings')}else log(prefGet('mute')?'Sound off (Shift+M to turn it back on).':'Sound on.')}
// a Settings button: data-act names the setting, data-arg its new value (on/off, or a speed; econmode: the realm economy,
// economy.js; sound: on/off; volmaster, volmusic, volsfx: a volume 0–1), and the page redraws; false if the action is no setting
function settingAct(a,arg){
  if(a==='dev-open'){DevConsole.show();return true}// (Settings → Developer tools: what the old DEV tab opened, developer.js)
  if(a==='econmode')setEconMode(arg);else if(a==='bspeed')setBattleSpeed(+arg,true);else if(['grid','blood','hpbars','bdeploy','guide','bfog','ambient'].includes(a))prefSet(a,arg==='on');
  else if(a==='opaths')prefSet('opaths',arg);else if(a==='mapzoom')prefSet('mapzoom',+arg||0);
  else if(a==='sound')prefSet('mute',arg==='off');else if(VOLUMES.some(([k])=>k===a))prefSet(a,+arg);else return false;
  showTitle('settings');return true}
// the volume settings, and the steps Settings offers
const VOLUMES=[['volmaster','Volume'],['volmusic','Music'],['volsfx','Effects']],VOL_STEPS=[0,.25,.5,.75,1];
// the battle's speed: the clock runs at this rate (and stands still while paused, though you can still give orders: a
// tactical pause); B.speed is this battle's, BSPEED.v the one each battle starts at (save: set that too, as Settings does)
function setBattleSpeed(v,save){if(!BATTLE_SPEEDS.includes(v))return;if(B)B.speed=v;if(save)prefSet('bspeed',v);battleSpeedUI()}
function battleSpeedStep(d){const i=BATTLE_SPEEDS.indexOf(B?B.speed:BSPEED.v);setBattleSpeed(BATTLE_SPEEDS[clamp(i+d,0,BATTLE_SPEEDS.length-1)])}
function battlePause(on){if(!B)return;if(B.deploy){if(on!==true)beginFight();return}B.paused=on==null?!B.paused:!!on;battleSpeedUI()}
function battleSpeedUI(){if(typeof document==='undefined')return;const sp=B?B.speed:BSPEED.v;
  document.querySelectorAll('[data-bspeed]').forEach(b=>{const on=+b.dataset.bspeed===sp;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
  const p=document.getElementById('bPause');if(p){const on=!!(B&&B.paused);p.classList.toggle('on',on);p.setAttribute('aria-pressed',String(on));p.textContent=B&&B.deploy?'⚔ Begin':on?'▶ Play':'⏸ Pause'}if(B&&typeof bhudTop==='function')bhudTop()}
// the controls in brief (Settings); every key is in Help (H)
const CONTROLS='World map: click to travel, hover for details, Space to pause, 1 2 3 for the speed (1×, 2×, 4×), 4 to hurry (your band marches faster), C your hero and party, K skills, I your bag, P people, L the message log, M the full map (or click the minimap), H help, + − or the wheel to zoom, G the tile grid, F6 to save, Esc the menu. Battle: click or drag to select, right-click to move or attack, right-drag to lay out a line, 1–9/0 to select the ten army cards, Ctrl+number to store a custom selection, Home to reset the camera, H hold, C run, V walk (the pace; a double right-click on an enemy charges), W withdraw, R walk or run, F hold ground, Q cease fire, E skirmish, X melee mode (shooters), B L T formations, A the AI in command, K auto skills, Space to pause, [ ] the speed, the wheel to zoom. Anywhere: Shift+M turns the sound off and on. Every key: Help (H).';
// (the world a save was made in, for its line: "Large · redwater"; the classic world, today's map: nothing)
const WORLD_N={classic:'Classic',normal:'Normal',large:'Large',huge:'Huge',frontier:'Frontier',crowded:'Crowded'};
const worldLine=s=>!s?'':s.preset==='classic'?'Classic · ':(WORLD_N[s.preset]||s.w+' × '+s.h)+' · '+s.seed+' · ';
const saveLine=sv=>worldLine(sv.world&&sv.world.map&&sv.world.map.settings)+'Day '+sv.day+' · '+RACES[sv.P.race||'human'].n+' '+((BGS[sv.P.bg]||{}).n||'hero').toLowerCase()+' · level '+sv.P.level+' · '+sv.P.gold+' gold'+(sv.at?' · '+new Date(sv.at).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'');
// the slots, each a row: load it (or save into it), and delete it (two clicks)
// (a slot an older version saved is refused (doc/WORLD_DESIGN.md D7): it says so, and can be deleted)
function slotRows(mode){return SAVE_SLOTS.filter(s=>mode==='save'?s!=='auto':true).map(s=>{const d=readSlot(s),old=!d&&oldSlot(s),armed=G.wipeArmed===s,over=G.overArmed===s;
  const main=mode==='save'?'<button class="card menu slot" type="button" data-act="esc-save" data-arg="'+s+'"><span class="mi">'+icon('save',24)+'</span><span class="mt"><strong>'+slotName(s)+(d?(over?' · click again to overwrite':''):' · empty')+'</strong><span>'+(d?saveLine(d):'Save here')+'</span></span></button>'
    :'<button class="card menu slot" type="button" data-act="'+(mode==='esc'?'esc-load':'load')+'" data-arg="'+s+'"'+(d?'':' disabled')+'><span class="mi">'+icon(d?'load':'save',24)+'</span><span class="mt"><strong>'+slotName(s)+'</strong><span>'+(d?saveLine(d):old?'Made by an older version: start a new game':'Empty')+'</span></span></button>';
  return '<div class="slotrow">'+main+(mode==='title'&&(d||old)?'<button class="btn sm" type="button" data-act="'+(armed?'wipe':'wipe-ask')+'" data-arg="'+s+'" style="min-width:64px">'+(armed?'Delete?':'Delete')+'</button>':mode==='title'?'<span class="btn sm" aria-hidden="true" style="visibility:hidden">Delete?</span>':'')+'</div>'}).join('')}
// Small, code-drawn origin illustrations keep the new-game cards vivid without loading extra sprite sheets.
const ORIGIN_ART={soldier:['#273747','#c1844d','#d7b974','M0 82h320v30H0z M28 55h38v27H28z M36 40h22v15H36z M234 48h54v34h-54z M246 30h28v18h-28z','sword'],guard:['#314641','#b68449','#d6c48b','M0 82h320v30H0z M20 55h42v27H20z M28 40h26v15H28z M250 50h40v32h-40z','spear'],woodcutter:['#233b32','#8f6844','#b9a168','M0 76h320v36H0z M15 0h24v75H15z M54 0h17v74H54z M258 12h14v60h-14z M284 0h23v77h-23z','axe'],exile:['#29384a','#bb7658','#b8c0a0','M0 82h320v30H0z M20 38h30v44H20z M36 18h30v30H36z M256 28h18v54h-18z M270 12h34v35h-34z','bow'],merchant:['#4a3b38','#be8650','#dfc377','M0 82h320v30H0z M16 52h50v30H16z M25 36h34v16H25z M254 53h40v29h-40z','crossbow'],hedge:['#34354e','#9077a8','#c2acd0','M0 82h320v30H0z M18 56h42v26H18z M29 39h23v17H29z M245 52h48v30h-48z M263 32h15v20h-15z','staff'],apprentice:['#37414b','#7393a0','#d1b678','M0 82h320v30H0z M20 59h40v23H20z M30 43h21v16H30z M250 58h45v24h-45z M266 40h14v18h-14z','wand']};
function originArt(key){const [sky,coat,glow,land,weapon]=ORIGIN_ART[key]||ORIGIN_ART.soldier;const stars=key==='hedge'||key==='apprentice'?'<path d="M36 18v8m-4-4h8M260 18v7m-3-3h6M111 34v5m-2-2h4" stroke="#e8d58c" stroke-width="2"/>':'';const arms=weapon==='bow'?'<path d="M210 38q-22 26 0 52M210 39q18 25 0 51M210 40v50" fill="none" stroke="#c79655" stroke-width="3"/><path d="M209 64h-21" stroke="#e5d6b5" stroke-width="2"/>':weapon==='spear'?'<path d="M211 27v72" stroke="#9f7048" stroke-width="4"/><path d="M211 24l-5 12h10z" fill="#c7c8bb"/>':weapon==='axe'?'<path d="M210 49v48" stroke="#9a6942" stroke-width="5"/><path d="M207 49q19-12 22 3l-13 8-9-3z" fill="#bfc2b6"/>':weapon==='crossbow'?'<path d="M195 61h33m-16-13v27m-15-23q15 19 30 0" fill="none" stroke="#bd9259" stroke-width="4"/>':weapon==='staff'?'<path d="M211 34v64" stroke="#94744e" stroke-width="4"/><path d="M211 27l5 6-5 6-5-6z" fill="#c2a9da"/>':weapon==='wand'?'<path d="M209 49l7 46" stroke="#ab8150" stroke-width="4"/><path d="M207 44l3-7 5 6-4 7z" fill="#b9dcdf"/>':'<path d="M210 40v57" stroke="#927047" stroke-width="4"/><path d="M205 33h10v30h-10z" fill="#b8c6cc"/><path d="M205 34h10" stroke="#ead9ac" stroke-width="2"/>';return '<svg class="origin-art" viewBox="0 0 320 112" aria-hidden="true" focusable="false" shape-rendering="crispEdges"><rect width="320" height="112" fill="'+sky+'"/><circle cx="268" cy="24" r="12" fill="'+glow+'" opacity=".9"/><path d="M0 69l42-28 41 28 48-38 55 40 48-31 86 39v22H0z" fill="#17242b" opacity=".8"/>'+stars+'<path d="'+land+'" fill="#3a493f"/><ellipse cx="164" cy="96" rx="34" ry="6" fill="#172127" opacity=".7"/><path d="M151 48h27v12h8v25h-7v12h-28V85h-7V60h7z" fill="'+coat+'"/><rect x="155" y="34" width="20" height="19" fill="#c89a70"/><path d="M152 38h25v5h-25z" fill="#382b2a"/><path d="M151 60l-12 20 5 3 16-14m18-9 13 16-4 4-17-13" fill="none" stroke="'+coat+'" stroke-width="7"/><path d="M152 94v13m20-13v13" stroke="#222a31" stroke-width="7"/>'+arms+'<path d="M0 108h320" stroke="'+glow+'" stroke-width="4" opacity=".7"/></svg>'}
/* New game's World row (with WORLD.gen; doc/WORLD_DESIGN.md §15.2.2 C, until Phase 2b's screen): Classic · Normal · Large · Huge,
   the others with a fresh seed shown (crypto.getRandomValues: never Math.random) and New seed. Huge on every device (D44): on a
   phone (a coarse pointer, the short side of the screen under 900 px) with a slow-to-forge note; hidden only where saves cannot
   be gzipped (D8). Sparse until later: densities stay today's until Phase 6. begin reads the choice (newWorldSettings) */
const NEW_WORLD={size:'classic',seed:''};
const SEED_A=['red','ash','iron','oak','frost','stone','wolf','raven','amber','thorn','elder','storm','salt','moon','gold','black','silver','high','deep','wild','briar','cold','dusk','fern','grey','hawk','mist','pine','rook','sun','west','yew'],
  SEED_B=['water','fell','ford','mere','wood','vale','crest','hollow','brook','gate','moor','reach','field','marsh','barrow','haven','spire','fen','dale','watch','holm','stead','wick','burn','combe','tor','ness','ley','mouth','shaw','well','by'];
const freshSeed=()=>{const r=crypto.getRandomValues(new Uint32Array(1))[0];return SEED_A[r&31]+SEED_B[r>>>5&31]};
const phoneSlow=()=>matchMedia('(pointer: coarse)').matches&&Math.min(screen.width,screen.height)<900;
function newWorldSettings(){const N=NEW_WORLD;if(N.size==='huge'&&!SAVE_ZIP)N.size='classic';
  return N.size==='classic'?classicSettings():normSettings({preset:N.size,seed:N.seed||(N.seed=freshSeed())})}
function worldRow(){if(!WORLD.gen)return '';const N=NEW_WORLD,s=newWorldSettings(),on=z=>N.size===z;
  return '<div class="lab">World</div><div class="tabs" role="group" aria-label="World">'+['classic','normal','large','huge'].filter(z=>z!=='huge'||SAVE_ZIP).map(z=>'<button class="btn sm'+(on(z)?' on':'')+'" type="button" data-act="world-size" data-arg="'+z+'" aria-pressed="'+on(z)+'">'+WORLD_N[z]+'</button>').join('')+
    (on('classic')?'':'<button class="btn sm" type="button" data-act="world-seed">New seed</button>')+'</div><p class="muted">'+
    (on('classic')?'The world of Ashmark, the same for everyone.':'Seed '+s.seed+' · '+s.w+' × '+s.h+' tiles · '+s.holdings+' holdings'+(on('huge')?' · sparse until later'+(phoneSlow()?' · slow to forge on this device, about 30 s':''):''))+'</p>'}
onAct('world-',(a,arg)=>{if(a==='world-size'&&['classic','normal','large','huge'].includes(arg))NEW_WORLD.size=arg;if(a==='world-seed')NEW_WORLD.seed=freshSeed();
  showTitle('new');const b=panel.querySelector('[data-act="'+a+'"]'+(a==='world-size'?'.on':''));if(b)b.focus({preventScroll:true})});
/* the main menu: Continue, New game, Load game, Settings (settingAct), Wiki, Exit */
function showTitle(screen){
  // (the main menu leaves the game behind: no Resume here; the pause menu (Esc) is where you resume)
  G.resume=null;G.mode='title';G.menu=screen||'main';G.race=G.race||'human';const sv=readSave(),back=nav(['menu','main','Back']);
  const card=(act,arg,title,sub,dis,ic)=>'<button class="card menu" type="button" data-act="'+act+'"'+(arg?' data-arg="'+arg+'"':'')+(dis?' disabled':'')+'>'+(ic?'<span class="mi">'+icon(ic,28)+'</span>':'')+'<span class="mt"><strong>'+title+'</strong><span>'+sub+'</span></span></button>';
  if(G.menu==='new')return showPanel('<div class="top"><h2>New game</h2></div><div class="lab">Choose your race</div><div class="tabs" role="group" aria-label="Race">'+Object.keys(RACES).map(r=>'<button class="btn sm'+(G.race===r?' on':'')+'" type="button" data-act="race" data-arg="'+r+'" aria-pressed="'+(G.race===r)+'">'+RACES[r].n+'</button>').join('')+'</div><p class="muted">'+RACES[G.race].d+' Troops of your own race cost 15% less to hire.</p>'+worldRow()+
    '<div class="lab">Choose your past · it decides your weapon</div><div class="cards origin-cards">'+Object.keys(BGS).map(k=>{const B0=BGS[k],w=BASES[B0.weapon];return '<button class="card origin-card" type="button" data-act="begin" data-arg="'+k+'">'+originArt(k)+'<strong>'+B0.n+'</strong><span class="gold">'+w.n+' · '+(w.kind==='ranged'?'Ranged':w.kind==='magic'?'Magic':'Melee')+'</span><span>'+B0.d+'</span></button>'}).join('')+'</div>'+ 
    (sv?'<p class="bad" style="font-size:13px">Starting a new game will replace your saved game when it next saves.</p>':'')+back);
  if(G.menu==='load')return showPanel('<div class="top"><h2>Load game</h2></div><div class="slots">'+slotRows('title')+'</div>'+(SAVE_SLOTS.some(oldSlot)?'<p class="muted">Saves made by an older version cannot be loaded (the world is made differently now): start a new game.</p>':'')+(sv?'':'<p class="muted">No saved game yet. The game saves itself each day and when you leave a town (Autosave); F6 saves at any time (Quick save); the menu (Esc) saves to a slot of your own.</p>')+back);
  if(G.menu==='settings')return showPanel('<div class="top"><h2>Settings</h2></div>'+
    '<div class="lab">Realm economy</div><div class="tabs" role="group" aria-label="Realm economy">'+Object.keys(ECON_MODES).map(m=>'<button class="btn sm'+(ECON.mode===m?' on':'')+'" type="button" data-act="econmode" data-arg="'+m+'" aria-pressed="'+(ECON.mode===m)+'">'+ECON_MODES[m][0]+'</button>').join('')+'</div><p class="muted">'+ECON_MODES[ECON.mode][1]+'</p>'+
    '<div class="lab">Map grid</div><div class="tabs" role="group" aria-label="Map grid">'+[['off','Off'],['on','On']].map(([v,n])=>'<button class="btn sm'+(GRID.on===(v==='on')?' on':'')+'" type="button" data-act="grid" data-arg="'+v+'" aria-pressed="'+(GRID.on===(v==='on'))+'">'+n+'</button>').join('')+'</div><p class="muted">Lines along every tile (16 by 16 pixels) on the world map and in towns. G on the map turns it on and off.</p>'+
    '<div class="lab">Map zoom</div><div class="tabs" role="group" aria-label="Map zoom">'+[0,...Array.from({length:MAPZOOM.hi-MAPZOOM.lo+1},(_,i)=>MAPZOOM.lo+i)].map(v=>'<button class="btn sm'+(MAPZOOM.z===v?' on':'')+'" type="button" data-act="mapzoom" data-arg="'+v+'" aria-pressed="'+(MAPZOOM.z===v)+'">'+(v?v:'Auto')+'</button>').join('')+'</div><p class="muted">How close the world map is drawn: Auto fits the window (here '+MAPZOOM.s0+'); higher is closer. On the map the wheel, + and −, the buttons by Save and a two-finger pinch zoom too.</p>'+
    '<div class="lab">Ambient life</div><div class="tabs" role="group" aria-label="Ambient life">'+[['off','Off'],['on','On']].map(([v,n])=>{const on=prefGet('ambient')===(v==='on');return '<button class="btn sm'+(on?' on':'')+'" type="button" data-act="ambient" data-arg="'+v+'" aria-pressed="'+on+'">'+n+'</button>'}).join('')+'</div><p class="muted">Birds crossing the sky and pecking in the fields, crows over a fight, gulls on the shore, butterflies, fireflies at night, fish jumping, a hare or a squirrel; birds out of the trees as a battle begins. Only for the look: fewer and calmer when your system asks for less motion.</p>'+
    '<div class="lab">Battle speed (each battle starts at it; change it in battle too)</div><div class="tabs" role="group" aria-label="Battle speed">'+BATTLE_SPEEDS.map(v=>'<button class="btn sm'+(BSPEED.v===v?' on':'')+'" type="button" data-act="bspeed" data-arg="'+v+'" aria-pressed="'+(BSPEED.v===v)+'">'+v+'×</button>').join('')+'</div>'+
    '<div class="lab">Guide texts</div><div class="tabs" role="group" aria-label="Guide texts">'+[['off','Off'],['on','On']].map(([v,n])=>'<button class="btn sm'+(GUIDE.on===(v==='on')?' on':'')+'" type="button" data-act="guide" data-arg="'+v+'" aria-pressed="'+(GUIDE.on===(v==='on'))+'">'+n+'</button>').join('')+'</div><p class="muted">The hints at the top of the screen and the helper lines in towns and battle. Off, only what you can do right now shows (E to talk).</p>'+
    '<div class="lab">Deployment</div><div class="tabs" role="group" aria-label="Deployment">'+[['off','Off'],['on','On']].map(([v,n])=>'<button class="btn sm'+(BDEPLOY.on===(v==='on')?' on':'')+'" type="button" data-act="bdeploy" data-arg="'+v+'" aria-pressed="'+(BDEPLOY.on===(v==='on'))+'">'+n+'</button>').join('')+'</div><p class="muted">On, a battle opens frozen so you can place your band in its zone first (Space to begin).</p>'+
    '<div class="lab">Health bars in battle</div><div class="tabs" role="group" aria-label="Health bars in battle">'+[['off','Off'],['on','On']].map(([v,n])=>'<button class="btn sm'+(HPBARS.on===(v==='on')?' on':'')+'" type="button" data-act="hpbars" data-arg="'+v+'" aria-pressed="'+(HPBARS.on===(v==='on'))+'">'+n+'</button>').join('')+'</div><p class="muted">A bar over every ally and enemy. Off, only you and your companions show one. The HP bars button in battle switches it too.</p>'+
    '<div class="lab">Blood in battle</div><div class="tabs" role="group" aria-label="Blood in battle">'+[['off','Off'],['on','On']].map(([v,n])=>'<button class="btn sm'+(BLOOD.on===(v==='on')?' on':'')+'" type="button" data-act="blood" data-arg="'+v+'" aria-pressed="'+(BLOOD.on===(v==='on'))+'">'+n+'</button>').join('')+'</div><p class="muted">Blood from blows, the stains it leaves and pools under the fallen. Off, the fallen still lie where they fell.</p>'+
    '<div class="lab">Fog of war (battle)</div><div class="tabs" role="group" aria-label="Fog of war (battle)">'+[['off','Off'],['on','On']].map(([v,n])=>{const on=prefGet('bfog')===(v==='on');return '<button class="btn sm'+(on?' on':'')+'" type="button" data-act="bfog" data-arg="'+v+'" aria-pressed="'+on+'">'+n+'</button>'}).join('')+'</div><p class="muted">On, each side sees only what its soldiers can: the enemy shows when your men come within sight of him, and ground out of their sight is shaded. Sieges, raids and tournaments have none.</p>'+
    '<div class="lab">Order paths (battle)</div><div class="tabs" role="group" aria-label="Order paths (battle)">'+[['all','Always'],['sel','Selected'],['off','Off']].map(([v,n])=>{const on=prefGet('opaths')===v;return '<button class="btn sm'+(on?' on':'')+'" type="button" data-act="opaths" data-arg="'+v+'" aria-pressed="'+on+'">'+n+'</button>'}).join('')+'</div><p class="muted">Where your groups are going: the way round cliffs, rock and deep water, the waypoints after it, an attack to where the enemy was last seen. Selected: the groups you have selected or point at, and for a moment any you give an order. Off: a straight line for each selected group.</p>'+
    '<div class="lab">Sound</div><div class="tabs" role="group" aria-label="Sound">'+[['off','Off'],['on','On']].map(([v,n])=>{const on=prefGet('mute')===(v==='off');return '<button class="btn sm'+(on?' on':'')+'" type="button" data-act="sound" data-arg="'+v+'" aria-pressed="'+on+'">'+n+'</button>'}).join('')+'</div>'+
    VOLUMES.map(([k,n])=>{const cur=prefGet(k),near=VOL_STEPS.reduce((a,x)=>Math.abs(x-cur)<Math.abs(a-cur)?x:a);return '<div class="lab">'+n+'</div><div class="tabs" role="group" aria-label="'+n+'">'+VOL_STEPS.map(x=>'<button class="btn sm'+(x===near?' on':'')+'" type="button" data-act="'+k+'" data-arg="'+x+'" aria-pressed="'+(x===near)+'">'+Math.round(x*100)+'%</button>').join('')+'</div>'}).join('')+
    '<p class="muted">Music and sound effects, all made as you play (nothing to download). Shift+M turns the sound off and on anywhere.</p>'+
    '<div class="lab">Controls</div><p class="muted">'+CONTROLS+'</p>'+
    '<div class="lab">Developer tools</div><div class="btns"><button class="btn" type="button" data-act="dev-open">Open developer tools</button></div><p class="muted">The console and the battle test bench (also ` or F2).</p>'+back);
  if(G.menu==='exit')return showPanel('<h2 class="big">Ashmark</h2><p>Thanks for playing. You can close this tab now.</p>'+nav(['menu','main','Back to the menu']));
  showPanel('<div class="title"><h2 class="big">Ashmark</h2><p>Rise from a nobody to a ruler. Recruit a warband, trade between towns, and fight in real time.</p></div><div class="menulist">'+
    (sv?card('load',null,'Continue',saveLine(sv),false,'resume'):'')+
    card('menu','new','New game','Choose your race and your past',false,'sword')+
    card('menu','load','Load game',sv?'Your saved game':'No saved game yet',false,'load')+
    card('menu','settings','Settings','Art, battle and controls',false,'settings')+
    card('menu','wiki','Wiki','How everything works: the world, realms, economy, battle, gear, your hero and more (opens a new tab)',false,'book')+
    card('menu','exit','Exit','Leave Ashmark',false,'exit')+'</div>');
}
/* Esc: close what can be closed; otherwise open the Esc menu, which pauses everything and remembers the screen under it */
// screens Esc closes, and the action that closes each
// where you may save (the Esc menu and saveGame agree): anywhere calm, never mid-fight or mid-choice
const ESC_SAVE=['world','town','char','inv','skills','site','besiege','scene'];
const ESC_CLOSE={comp:'cm-back',help:'help-close',fullmap:'map-close',journal:'journal-close',town:'leave',char:'char-close',inv:'inv-close',skills:'sk-close',site:'site-leave',besiege:'sg-leave'};
// Esc closes the window in front, one press at a time: its bottom bar's Back (an inner window back to the one behind it), else
// its way out (ui.js nav). A panel that only offers real choices (a fight, a perk, the fate of a holding) has no bar and is
// never chosen for you: Esc then pauses with the Esc menu, as it does once no window is left.
function escDismiss(){if(ov.hidden)return null;return panel.querySelector('.nav [data-nav="back"]:not([disabled])')||panel.querySelector('.nav [data-nav="close"]:not([disabled]):not([data-noesc])')}
function onEscape(){
  uiSfx('back');
  if(peopleEsc())return;// (the people drawer first: peopledrawer.js)
  if(G.mode==='esc')return escAct('esc-resume');
  if(G.mode==='title'){if(G.menu&&G.menu!=='main')return menuAct('menu','main');return}
  if(G.place&&G.mode==='world'){G.place=null;log('You stop placing.');return}
  const b=escDismiss();if(b)return act(b.dataset.act,b.dataset.arg);
  if(ESC_CLOSE[G.mode])return act(ESC_CLOSE[G.mode]);
  showEsc();
}
function showEsc(msg){
  if(G.mode!=='esc'){if(B&&B.draw)B.draw=null;G.esc={mode:G.mode,html:ov.hidden?null:panel.innerHTML,cls:panel.className,modal:G.modal}}
  G.mode='esc';const from=G.esc.mode,sv=readSave(),canSave=ESC_SAVE.includes(from);
  const b=(act,label,why)=>'<button class="card menu" type="button" data-act="'+act+'"'+(why?' disabled':'')+'><strong>'+label+'</strong>'+(why?'<span>'+why+'</span>':'')+'</button>';
  showPanel('<div class="top"><h2>Paused</h2><span class="muted">Day '+G.day+' · '+(from==='battle'?'in battle':'on the road')+'</span></div>'+escWorld()+'<div class="menulist">'+
    b('esc-saves','Save game',canSave?'':from==='battle'?'Not during a battle':'Finish what is in front of you first')+
    b('esc-loads','Load game',sv?'':'No saved game')+b('esc-main','Main menu')+b('esc-exit','Exit game')+'</div>'+
    (msg?'<p class="gold">'+msg+'</p>':'')+'<p class="muted" style="font-size:13px">Esc resumes.</p>'+nav(null,['esc-resume',null,'Resume']));
}
// the world you play in (the Esc menu): its name, its kind and its seed, with a Copy button (the generated world's settings: the
// owner, 2026-10-22); today's map: Ashmark, Classic, no seed
function escWorld(){const s=WM&&WM.settings;
  return '<div class="esc-world"><span>'+(s?htmlText(worldName(WM))+' · '+(WORLD_N[s.preset]||s.w+' × '+s.h)+(s.seed?' · seed <b>'+htmlText(s.seed)+'</b>':''):'Ashmark · Classic')+'</span>'+
    (s&&s.seed?'<button class="btn sm" type="button" data-act="esc-seed">Copy seed</button>':'')+'</div>'}
// text onto the clipboard: true once it is there (the browser's clipboard, else the old copy command); false if neither would
function copyText(t){const old=()=>{const a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}a.remove();return ok};
  try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t).then(()=>true,old)}catch(e){}return Promise.resolve(old())}
function escAct(a,arg){
  if(!a.startsWith('esc-'))return false;if(G.mode!=='esc'||!G.esc)return true;const E=G.esc;
  const back=()=>{G.mode=E.mode;G.esc=null;if(E.html!=null){panel.innerHTML=E.html;panel.className=E.cls;ov.hidden=false;G.modal=E.modal}else hidePanel()};
  if(a==='esc-resume'){back();return true}
  if(a==='esc-seed'){const s=WM&&WM.settings&&WM.settings.seed;if(s)copyText(s).then(ok=>{if(G.mode==='esc'&&G.esc===E)showEsc(ok?'Seed '+s+' copied.':'Could not copy it: the seed is '+s+'.')});return true}
  // saving: the slots to save to (a slot already used asks a second click to overwrite)
  const slots=(mode,msg)=>showPanel('<div class="top"><h2>'+(mode==='save'?'Save game':'Load game')+'</h2><span class="muted">Day '+G.day+'</span></div><div class="slots">'+slotRows(mode==='save'?'save':'esc')+'</div>'+(msg?'<p class="gold">'+msg+'</p>':'')+''+nav(['esc-back',null,'Back']));
  if(a==='esc-back'){G.overArmed=null;showEsc();return true}
  if(a==='esc-saves'){if(!ESC_SAVE.includes(E.mode))return true;G.overArmed=null;slots('save');return true}
  if(a==='esc-loads'){if(!readSave())return true;slots('load');return true}
  if(a==='esc-save'){if(!ESC_SAVE.includes(E.mode))return true;const s=arg||'quick';if(arg&&readSlot(s)&&G.overArmed!==s){G.overArmed=s;slots('save');return true}
    // (a gzipped save is written a moment later: the list shows it once it is)
    G.overArmed=null;G.mode=E.mode;const p=saveGame(true,s);G.mode='esc';const done=ok=>{if(G.mode!=='esc'||G.esc!==E)return;const m=ok?'Game saved'+(arg?' ('+slotName(s)+')':'')+'.':'Could not save: your browser would not store it (private window, or storage full or blocked).';if(arg)slots('save',m);else showEsc(m)};
    if(p&&p.then)p.then(done);else done(p);return true}
  if(a==='esc-load'){if(!readSave(arg))return true;G.esc=null;if(B){B=null;fieldDone();bbar.hidden=true}loadGame(arg);return true}
  if(a==='esc-main'){G.mode=E.mode;G.esc=null;if(E.html==null)hidePanel();showTitle();return true}
  if(a==='esc-exit'){G.esc=null;if(B){B=null;fieldDone();bbar.hidden=true}G.mode='title';G.resume=null;try{window.close()}catch(e){}showTitle('exit');return true}
  return true;
}
function menuAct(a,arg){
  if(a==='resume'){if(G.resume){const m=G.resume;G.resume=null;if(m==='town'&&G.town){G.mode='town';renderTown()}else{G.mode='world';hidePanel()}}return true}
  if(a==='wipe-ask'){G.wipeArmed=arg||latestSlot();showTitle('load');return true}
  if(a!=='menu')return false;
  G.wipeArmed=false;
  if(arg==='wiki'){try{window.open('wiki.html','_blank')}catch(e){}return true}
  if(arg==='exit'){try{window.close()}catch(e){}showTitle('exit');return true}
  if(arg==='new')NEW_WORLD.seed='';// (each visit a fresh seed)
  showTitle(arg);const b=panel.querySelector('.card,button');if(b)b.focus({preventScroll:true});return true;
}
onAct('esc-',escAct);
/* the game is over (the owner, 2026-10-22: your hero died on the road, of thirst, hunger, fever or frostbite: world/supply.js
   heroDies; the full design of death comes later): what killed her and the day; the bar: Load last save on the left (greyed with
   none), Back to the title on the right. Esc follows the bar. Nothing runs on behind it (world.js updateWorld) */
function showDeath(){const d=G.dead||{},sv=readSave(),why=WHY_SICK[d.why]||d.why||'your wounds';G.mode='dead';hideTip();
  showPanel('<div class="top"><h2>You have died</h2><span class="muted">Day '+d.day+'</span></div><div class="death"><p class="bad">You died of '+why+' on day '+d.day+'.</p>'+
    '<p class="muted">'+(sv?'Your last save: '+saveLine(sv)+'.':'There is no saved game to go back to.')+'</p></div>'+
    nav(['dead-load',null,'Load last save',sv?'':'No saved game'],['dead-title',null,'Back to the title']))}
onAct('dead-',a=>{if(a==='dead-load'){if(readSave())loadGame()}else if(a==='dead-title')showTitle()});
/* ---------- the buttons' sounds (audio.js): one listener hears every button, nav() bars and windows alike; what the press did
   picks the sound: gold changed hands, the coin; a refusal (a new message in red), the refusal; else a bottom bar's Back or way
   out, back; a primary button, confirm; any other, a click. (Before the first press there is no sound: nothing to work out) ---------- */
const uiSfx=n=>typeof sfx==='function'&&sfx(n);
document.addEventListener('click',e=>{if(typeof AUDIO==='undefined'||!AUDIO.ctx||AUDIO.muted)return;const b=e.target.closest&&e.target.closest('button,[data-act]');if(!b||b.disabled)return;
  const kind=b.dataset.nav?'back':b.classList.contains('primary')?'confirm':'click',gold=P.gold,last=G.msgs[G.msgs.length-1];
  setTimeout(()=>{const fresh=G.msgs.slice(G.msgs.lastIndexOf(last)+1);uiSfx(P.gold!==gold?'coin':fresh.some(m=>m.cls==='bad')?'refused':kind)},0)},true);
