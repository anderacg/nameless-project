'use strict';
/* ---------- panels ---------- */
// (key: the window it is; the same one drawn again while shown changes in place (window.js morph), keeping what stays the same:
// the button under a finger, its focus, the scroll; none, or another window, drawn afresh, the first button in focus)
function showPanel(html,key){const same=key&&!ov.hidden&&panel.dataset.win===key;panel.classList.remove('wide','railed','paged','fmap','wsp','hunt-setup');panel.dataset.win=key||'';
  if(same){const t=document.createElement('div');t.innerHTML=html;morphKids(panel,t)}else panel.innerHTML=html;ov.hidden=false;G.modal=true;
  if(!same){const b=panel.querySelector('button:not([disabled]),.card');if(b)b.focus({preventScroll:true})}}
function hidePanel(){ov.hidden=true;G.modal=false}
/* every window's bottom bar: its navigation only; the game's choices stay in the window above it. back: [act, arg, label] on
   the left, when it was opened from another window; close: [act, arg, label, why disabled, noEsc] on the right, the way out,
   named for where it takes you. Esc presses Back, else the way out (escDismiss), unless going costs you something (noEsc) */
// (a part redrawn on a clock (the party card, the day, the battle's unit panel): written only when what it shows has changed, so the
// buttons under a finger are not replaced by the same ones a quarter of a second later and the tap lost)
function setHtml(el,h){if(el&&el._html!==h){el._html=h;el.innerHTML=h}}
function nav(back,close){const b=(a,cls,k)=>'<button class="btn'+cls+'" type="button" data-nav="'+k+'" data-act="'+a[0]+'"'+(a[1]!=null?' data-arg="'+a[1]+'"':'')+(a[3]?' disabled title="'+a[3]+'"':'')+(a[4]?' data-noesc':'')+'>'+a[2]+'</button>';
  return '<div class="btns nav">'+(back?b(back,'','back'):'')+'<span class="grow"></span>'+(close?b(close,' primary','close'):'')+'</div>'}
/* windows anyone can open over the map or the streets: Help (H), your Quests (Q: ui/questwindow.js) and the Journal (J, L: ui/journal.js); closing goes back where you were */
function openOver(mode,html){if(G.modal&&G.mode!==mode||!['world','scene'].includes(G.mode))return false;G.overBack=G.mode;G.mode=mode;hideTip();showPanel(html);return true}
function closeOver(){G.mode=G.overBack||'world';G.overBack=null;hidePanel()}
const KEYS=[['Map',[['Click','travel there at walking pace; double click or tap the same destination to Hurry; another travel click returns to walking. Or meet what is there; on a party: its actions (meet or attack, Follow, Look), a double click meets it at once; hold for the ring (Follow too)'],['Hover','what it is, its strength'],['Space','pause / play'],['1 2 3','game speed: 1×, 2×, 4×'],['4','travel fast (8×), till you change the speed (the top bar’s 8× too)'],['R','hurry: your band marches twice as fast, its stamina draining 2.5× as fast, till you stop or it is Exhausted (the action ring’s Hurry here too)'],['B','by road on or off: while it is on, every way you travel keeps to the roads when one is near (the top bar shows By road; the action ring’s By road too, lit while on)'],['Hold','the action ring: hold the button or a finger still on the map, then pick (camp, travel, hurry, water, look)'],['Tab','the Game Menu (the bar’s Menu too, and Esc with no window open): every window, a tile each; Save, Load, Settings, Main menu, Exit; the game paused while it is open'],['C','the Army: your band’s roster (your hero, companions and troops, each opening its detail), its skills and roles, its condition, its passengers'],['K','your hero’s skills (in the Army window)'],['I','inventory'],['Q','your quests: Main, Side, Jobs, Archive'],['J','the Journal: the Chronicle, the lords, the realms'],['L','the Journal’s Chronicle: every message, by day'],['M','the full map: realms, rivers, crossings, holdings (a click on the minimap or the dock’s Map opens it too)'],['Wheel / + −','zoom the map in or out (the buttons by Save too)'],['G','tile grid'],['F6','save'],['Esc','close the window in front, one step at a time (its Back first); with none open, the Game Menu; Esc again resumes']]],
  ['Battle',[['Click / drag','select a group (a soldier or the icon over it), or box several (your hero is a group too; everyone fights on their own)'],['Right-click ground','move the selection there, in formation (walking)'],['Right-click enemy','walk in and attack that enemy'],['Double right-click','the same at a run: on an enemy, a charge'],['H C V','hold (where they stand) · charge · advance'],['Right-drag','lay out the line: where, how wide (and so how deep), facing which way; a left-click or Esc mid-drag calls it off'],['B / L / T','B: supported shield infantry ability · L: loose spacing · T: cavalry wedge (bonus starts at 6 formed riders); L/T again: line'],['Wheel / + −','zoom the battle (toward the cursor); Home: the whole field again'],['Middle-drag / arrows','pan; the same group number twice: look at it; the small map (top right): click to look there'],['Banners','over each group: its side’s pennant (yours blue, your allies’ green, the enemy’s red) with its kind’s mark and a health bar; round badges beside it when something is wrong (wavering, routing, shattered, flanked, outnumbered, charged, leader fallen, losing)'],['A','the AI commands the selected groups (an AI badge on their cards and banners; its paths violet); with none selected, your whole army; A again takes them back, and any order you give a group takes that group back'],['G I U Y O','unit abilities of the selection: brace · fire arrows · spur · rally · scout ahead (scout units)'],['Z S','commander powers (your hero, within the command radius): Rally the Line · Stand Fast!'],['Space (deploying)','begin the battle once your band is placed'],['W','withdraw: flee the battle off your edge of the field; all withdrawn, the battle ends as your retreat'],['R F Q E X','walk or run · hold ground · cease fire · skirmish · melee mode (shooters)'],['Shift + right-click','add a waypoint; double right-click: at a run'],['Ctrl + right-click / D','attack-move: march there, turning on any enemy met on the way (melee attack, riders charge, shooters halt and shoot), then on to the place; D (the button) makes your next order on the ground one, Esc calls it off; with Shift, a waypoint; Ctrl + right-drag, a line'],['Shift + click / drag','add to the selection'],['1–9 / 0','select army group cards 1–10; Ctrl + number stores a custom selection'],['Space','pause: you can still select and give orders'],['Esc / Tab','the Game Menu, the battle paused (no saving mid-fight); Esc again resumes'],['[ / ]','slower / faster (0.5×, 1×, 2×, 5×)'],['HP bars','health bars on or off (button)']]],
  ['Touch',[['Tap','map: travel there, or meet what is there · battle: select a group; tap again: send it there (or on that enemy)'],['Hold','map: what it is and how strong (tap again to put the card away) · battle: move the selection there, or attack the enemy held (a ring fills)'],['Hold, then drag','battle: lay out the line, as a right-drag; a second finger calls it off'],['Drag','battle: box several groups'],['Pinch / two fingers','map: zoom in or out · battle: zoom about them / pan'],['Tap the minimap or Map','the full map']]],
  ['Town',[['1–9 / 0','go to a place on the left (Market, Tavern, Barracks …; in your fief, a building)'],['Esc','from a place back to the town, then out']]],
  ['Streets',[['WASD / click','walk'],['E','talk to whoever is near'],['Gate','walk out to leave']]],
  ['Screen',[['F11','full screen'],['H','this help'],['Shift + M','sound off / on']]]];
function openHelp(){return openOver('help','<div class="top"><h2>Controls</h2></div>'+KEYS.map(([g,ks])=>'<div class="lab">'+g+'</div><div class="keys">'+ks.map(([k,d])=>'<div><kbd>'+k+'</kbd><span>'+d+'</span></div>').join('')+'</div>').join('')+
  '<p class="muted">Hover anything on the map to see what it is and how strong it is against you. People you meet on the road call out: a pulsing ! marks them (an arrow at the screen’s edge when they are off it); click one to ride over and meet them, or ride on. Messages fade from the screen after a few seconds; your Journal’s Chronicle (L) keeps them all.</p>'+nav(null,['help-close',null,'Close']))}
onAct('help-',()=>closeOver());
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
function tipFor(o){if(!objKind(o))return '';const h=o.tip()+(o instanceof Party&&o!==P?rankTip(o):''),d=G.mode==='world'&&travelDetectionText(o);return h+(h&&d?'<small>'+htmlText(d)+'</small>':'')}
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
  fps:{def:60,read:s=>+s===30?30:60,write:String,apply:v=>{RENDER.fps=v}},// frames a second at most (main.js loop)
  res:{def:'bal',read:s=>['full','bal','fast'].includes(s)?s:'bal',write:String,apply:v=>{RENDER.cap=RES_CAP[v];fitScreen()}},// the density drawn at (core.js RENDER): Full, Balanced, Fast
  mapzoom:{def:0,read:s=>{const v=parseInt(s,10);return Number.isSafeInteger(v)&&v>=1?v:0},write:String,apply:v=>{MAPZOOM.z=v;fitScreen()}},// the world map's zoom: 0 auto, else its scale (core.js MAPZOOM)
  bspeed:{def:1,read:s=>BATTLE_SPEEDS.includes(+s)?+s:1,write:String},// the speed each battle starts at
  guide:prefOnOff(true,()=>{if(typeof updateHint==='function')updateHint()}),// guide texts: the hints at the top of the screen and the helper lines in towns and battle
  bpause:prefOnOff(true),
  bdeploy:prefOnOff(true),// deployment: a battle you fight opens frozen, to place your band first (deploy.js)
  hpbars:prefOnOff(true,v=>{const b=typeof document!=='undefined'&&document.getElementById('hpBtn');if(b){b.classList.toggle('on',v);b.setAttribute('aria-pressed',String(v))}}),// health bars over every fighter in battle (off: only you and your companions); the HP bars button shows it
  blood:prefOnOff(true),// blood in battle: the spray of a blow, the stains it leaves, the pool under the fallen (off: none of it; the fallen still lie)
  autoskills:prefOnOff(true,()=>autoUI()),// your characters use their skills on their own (Auto skills, K: deploy.js)
  bauto:prefOnOff(false),// the AI in command of your army (A), kept for the next battle (setAuto, deploy.js)
  ambient:prefOnOff(true),// ambient life: birds, crows, gulls, butterflies, fireflies, fish and small critters on the map, a few birds in battle (drawn only: AMBIENT.on, gfx/ambient.js)
  bfog:prefOnOff(true),// fog of war in battle: each side sees only what its soldiers can (FOG.on, battlefog.js)
  bshake:prefOnOff(true),// screen shake and flash in battle, up close only (SHAKE.on, gfx/vfx.js screenFx)
  bfx:{def:'full',read:s=>s==='light'?'light':'full',write:String},// battle effects: Full, or Light (the rings, colours and stars only, no particles: gfx/vfx.js STATE_FX)
  opaths:{def:'sel',read:s=>['all','sel','off'].includes(s)?s:'sel',write:String},// order paths in battle: every group's, the selected (and pointed at, and just ordered) only, or none (ui/orderpaths.js)
  // the sound (audio.js): all of it off (Shift+M), and the volumes 0–1 (everything, the music, the effects); each change goes straight
  // to the speakers (audioPrefs)
  mute:prefOnOff(false,()=>{if(typeof audioPrefs==='function')audioPrefs()}),volmaster:prefVol(.8),volmusic:prefVol(.5),volsfx:prefVol(.8)};
// what a setting reads as from storage (as the game loads)
function prefLoad(k){const p=PREFS[k];try{return p.read(localStorage.getItem('ashmark.'+k))}catch(e){return p.def}}
for(const k in PREFS)PREFS[k].v=prefLoad(k);
const RES_CAP={full:Infinity,bal:2,fast:1.5};RENDER.cap=RES_CAP[PREFS.res.v];RENDER.fps=PREFS.fps.v;MAPZOOM.z=PREFS.mapzoom.v;fitScreen();
const prefGet=k=>PREFS[k].v;
function prefSet(k,v){const p=PREFS[k],s=p.write(v);p.v=p.read(s);try{localStorage.setItem('ashmark.'+k,s)}catch(e){}if(p.apply)p.apply(p.v)}
const prefView=(k,f='on')=>Object.defineProperty({},f,{get:()=>prefGet(k),set:v=>{PREFS[k].v=v},enumerable:true});
const GRID=prefView('grid'),BSPEED=prefView('bspeed','v'),GUIDE=prefView('guide'),HPBARS=prefView('hpbars'),BLOOD=prefView('blood');
function setGrid(on){prefSet('grid',on)}
function setGuide(on){prefSet('guide',on)}
function setHpBars(on){prefSet('hpbars',on)}
function setBlood(on){prefSet('blood',on)}
// all sound off or back on (Shift+M, anywhere; Settings → Sound)
function toggleMute(){prefSet('mute',!prefGet('mute'));if(G.mode==='title'){if(G.menu==='settings')showTitle('settings')}else if(G.mode==='esc'&&G.esc&&G.esc.page==='settings')escSettings();else toast(prefGet('mute')?'Sound off (Shift+M to turn it back on).':'Sound on.')}
// a Settings button: data-act names the setting, data-arg its new value (on/off, or a speed; econmode: the realm economy,
// economy.js; sound: on/off; volmaster, volmusic, volsfx: a volume 0–1), and the page redraws; false if the action is no setting
function settingAct(a,arg){
  if(a==='dev-open'){DevConsole.show();return true}// (Settings → Developer tools: what the old DEV tab opened, developer.js)
  if(a==='res')prefSet('res',arg);else if(a==='fps')prefSet('fps',+arg);else if(a==='econmode')setEconMode(arg);else if(a==='bspeed')setBattleSpeed(+arg,true);else if(['grid','blood','hpbars','bdeploy','bpause','guide','bfog','ambient','bshake'].includes(a))prefSet(a,arg==='on');
  else if(a==='opaths'||a==='bfx')prefSet(a,arg);else if(a==='mapzoom')prefSet('mapzoom',+arg||0);
  else if(a==='sound')prefSet('mute',arg==='off');else if(VOLUMES.some(([k])=>k===a))prefSet(a,+arg);else return false;
  if(G.mode==='esc')escSettings();else showTitle('settings');return true}
// the volume settings, and the steps Settings offers
const VOLUMES=[['volmaster','Volume'],['volmusic','Music'],['volsfx','Effects']],VOL_STEPS=[0,.25,.5,.75,1];
// the battle's speed: the clock runs at this rate (and stands still while paused, though you can still give orders: a
// tactical pause); B.speed is this battle's, BSPEED.v the one each battle starts at (save: set that too, as Settings does)
const battleSpeeds=()=>B?.world?[...SPEEDS,TRAVEL_FAST]:BATTLE_SPEEDS;
function setBattleSpeed(v,save){if(!battleSpeeds().includes(v))return;if(B?.world)setSpeed(v);if(B)B.speed=v;if(save&&!B?.world)prefSet('bspeed',v);battleSpeedUI()}
function battleSpeedStep(d){const list=battleSpeeds(),i=list.indexOf(B?.world?G.speed:B?B.speed:BSPEED.v);setBattleSpeed(list[clamp(i+d,0,list.length-1)])}
function battlePause(on){if(!B)return;if(B.muster?.active){B.paused=on==null?!B.paused:!!on;battleSpeedUI();return}if(B.deploy||B.ready){if(on!==true)beginFight();return}B.paused=on==null?!B.paused:!!on;battleSpeedUI()}
function battleSpeedUI(){if(typeof document==='undefined')return;const sp=B?.world?G.speed:B?B.speed:BSPEED.v,list=battleSpeeds();
  document.querySelectorAll('[data-bspeed]').forEach((b,i)=>{b.dataset.bspeed=list[i];b.textContent=list[i]+'×'});
  document.querySelectorAll('[data-bspeed]').forEach(b=>{const on=+b.dataset.bspeed===sp;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
  let start=document.getElementById('bStart');if(!start){start=document.createElement('button');start.id='bStart';start.type='button';start.className='btn battle-start';start.textContent='Start Battle';start.title='Start battle (Space)';start.addEventListener('click',()=>battlePause(false));document.getElementById('bbar').appendChild(start)}
  const forming=!!B?.muster?.active,ready=!!(B&&!B.over&&(B.ready||B.deploy));start.disabled=forming;start.title=forming?'Armies are moving into formation. Space pauses preparation.':'Start battle (Space)';start.textContent=forming?'Forming up…':'Start Battle';start.hidden=!(forming||ready);document.getElementById('bbar').classList.toggle('battle-ready',forming||ready);
  const p=document.getElementById('bPause');if(p){const on=!!(B&&B.paused);p.classList.toggle('on',on);p.setAttribute('aria-pressed',String(on));p.textContent=ready?'▶ Start':on?'▶ Play':'⏸ Pause'}if(B&&typeof bhudTop==='function')bhudTop()}
// the controls in brief (Settings); every key is in Help (H)
const CONTROLS='World map: click to travel, hover for details, Space to pause, 1 2 3 for the speed (1×, 2×, 4×), 4 to travel fast (8×), R to hurry (your band marches faster), B to turn by-road travel on or off (every trip keeps to the roads when one is near), hold for the action ring, Tab the Game Menu (every window, save, load, settings), C the Army (your roster, its skills, condition and passengers), Q your quests, J the journal (L its chronicle of every message), K your hero’s skills, I your bag, M the full map (or click the minimap), H help, + − or the wheel to zoom, G the tile grid, F6 to save, Esc to close a window (with none open: the Game Menu). Battle: click or drag to select, right-click to move or attack, right-drag to lay out a line, 1–9/0 to select the ten army cards, Ctrl+number to store a custom selection, Home to reset the camera, H hold, C run, V walk (the pace; a double right-click on an enemy charges), W withdraw, R walk or run, F hold ground, Q cease fire, E skirmish, X melee mode (shooters), B L T formations, A the AI in command, K auto skills, Space to pause, [ ] the speed, the wheel to zoom, Esc or Tab the Game Menu (the battle paused). Anywhere: Shift+M turns the sound off and on. Every key: Help (H).';
// (the world a save was made in, for its line: its name, its preset and its seed, "Redwater · Large · seed redwater"; the classic
// world "Ashmark · Classic"; an old save with no settings: nothing)
const WORLD_N={classic:'Classic',normal:'Normal',large:'Large',huge:'Huge',frontier:'Frontier',crowded:'Crowded'};
const worldKind=s=>WORLD_N[s.preset]||'Custom '+s.w+' × '+s.h;
const worldLine=s=>!s?'':worldName({settings:s})+' · '+worldKind(s)+(s.preset==='classic'?'':' · seed '+s.seed)+' · ';
const saveLine=sv=>worldLine(sv.world&&sv.world.map&&sv.world.map.settings)+'Day '+sv.day+' · '+RACES[sv.P.race||'human'].n+' '+((BGS[sv.P.bg]||{}).n||'hero').toLowerCase()+' · level '+sv.P.level+' · '+sv.P.gold+' gold'+(sv.at?' · '+new Date(sv.at).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'');
// the slots, each a row: load it (or save into it), and delete it (two clicks)
// (a slot an older version saved is refused (doc/WORLD_DESIGN.md D7): it says so, and can be deleted)
function slotRows(mode){return SAVE_SLOTS.filter(s=>mode==='save'?s!=='auto':true).map(s=>{const d=readSlot(s),old=!d&&oldSlot(s),armed=G.wipeArmed===s,over=G.overArmed===s;
  const main=mode==='save'?'<button class="card menu save-slot" type="button" data-act="esc-save" data-arg="'+s+'"><span class="mi">'+icon('save',24)+'</span><span class="mt"><strong>'+slotName(s)+(d?(over?' · click again to overwrite':''):' · empty')+'</strong><span>'+(d?htmlText(saveLine(d)):'Save here')+'</span></span></button>'
    :'<button class="card menu save-slot" type="button" data-act="'+(mode==='esc'?'esc-load':'load')+'" data-arg="'+s+'"'+(d?'':' disabled')+'><span class="mi">'+icon(d?'load':'save',24)+'</span><span class="mt"><strong>'+slotName(s)+'</strong><span>'+(d?htmlText(saveLine(d)):old?'Made by an older version: start a new game':'Empty')+'</span></span></button>';
  return '<div class="slotrow">'+main+(mode==='title'&&(d||old)?'<button class="btn sm" type="button" data-act="'+(armed?'wipe':'wipe-ask')+'" data-arg="'+s+'" >'+(armed?'Delete?':'Delete')+'</button>':mode==='title'?'<span class="btn sm" aria-hidden="true" style="visibility:hidden">Delete?</span>':'')+'</div>'}).join('')}
// Small, code-drawn origin illustrations keep the new-game cards vivid without loading extra sprite sheets.
const ORIGIN_ART={soldier:['#273747','#c1844d','#d7b974','M0 82h320v30H0z M28 55h38v27H28z M36 40h22v15H36z M234 48h54v34h-54z M246 30h28v18h-28z','sword'],guard:['#314641','#b68449','#d6c48b','M0 82h320v30H0z M20 55h42v27H20z M28 40h26v15H28z M250 50h40v32h-40z','spear'],woodcutter:['#233b32','#8f6844','#b9a168','M0 76h320v36H0z M15 0h24v75H15z M54 0h17v74H54z M258 12h14v60h-14z M284 0h23v77h-23z','axe'],exile:['#29384a','#bb7658','#b8c0a0','M0 82h320v30H0z M20 38h30v44H20z M36 18h30v30H36z M256 28h18v54h-18z M270 12h34v35h-34z','bow'],merchant:['#4a3b38','#be8650','#dfc377','M0 82h320v30H0z M16 52h50v30H16z M25 36h34v16H25z M254 53h40v29h-40z','crossbow'],hedge:['#34354e','#9077a8','#c2acd0','M0 82h320v30H0z M18 56h42v26H18z M29 39h23v17H29z M245 52h48v30h-48z M263 32h15v20h-15z','staff'],apprentice:['#37414b','#7393a0','#d1b678','M0 82h320v30H0z M20 59h40v23H20z M30 43h21v16H30z M250 58h45v24h-45z M266 40h14v18h-14z','wand'],nobody:['#3a3632','#8a7a62','#c9b48a','M0 84h320v28H0z M24 70h30v14H24z M262 66h24v18h-24z','fist']};
function originArt(key){const [sky,coat,glow,land,weapon]=ORIGIN_ART[key]||ORIGIN_ART.soldier;const stars=key==='hedge'||key==='apprentice'?'<path d="M36 18v8m-4-4h8M260 18v7m-3-3h6M111 34v5m-2-2h4" stroke="#e8d58c" stroke-width="2"/>':'';const arms=weapon==='fist'?'<path d="M202 56h16v13h-16z" fill="#d9a07a"/><path d="M206 56v5M210 56v5M214 56v5" stroke="#9a6a4e" stroke-width="1.5"/><path d="M204 69h12v14h-12z" fill="#7a6a52"/>':weapon==='bow'?'<path d="M210 38q-22 26 0 52M210 39q18 25 0 51M210 40v50" fill="none" stroke="#c79655" stroke-width="3"/><path d="M209 64h-21" stroke="#e5d6b5" stroke-width="2"/>':weapon==='spear'?'<path d="M211 27v72" stroke="#9f7048" stroke-width="4"/><path d="M211 24l-5 12h10z" fill="#c7c8bb"/>':weapon==='axe'?'<path d="M210 49v48" stroke="#9a6942" stroke-width="5"/><path d="M207 49q19-12 22 3l-13 8-9-3z" fill="#bfc2b6"/>':weapon==='crossbow'?'<path d="M195 61h33m-16-13v27m-15-23q15 19 30 0" fill="none" stroke="#bd9259" stroke-width="4"/>':weapon==='staff'?'<path d="M211 34v64" stroke="#94744e" stroke-width="4"/><path d="M211 27l5 6-5 6-5-6z" fill="#c2a9da"/>':weapon==='wand'?'<path d="M209 49l7 46" stroke="#ab8150" stroke-width="4"/><path d="M207 44l3-7 5 6-4 7z" fill="#b9dcdf"/>':'<path d="M210 40v57" stroke="#927047" stroke-width="4"/><path d="M205 33h10v30h-10z" fill="#b8c6cc"/><path d="M205 34h10" stroke="#ead9ac" stroke-width="2"/>';return '<svg class="origin-art" viewBox="0 0 320 112" aria-hidden="true" focusable="false" shape-rendering="crispEdges"><rect width="320" height="112" fill="'+sky+'"/><circle cx="268" cy="24" r="12" fill="'+glow+'" opacity=".9"/><path d="M0 69l42-28 41 28 48-38 55 40 48-31 86 39v22H0z" fill="#17242b" opacity=".8"/>'+stars+'<path d="'+land+'" fill="#3a493f"/><ellipse cx="164" cy="96" rx="34" ry="6" fill="#172127" opacity=".7"/><path d="M151 48h27v12h8v25h-7v12h-28V85h-7V60h7z" fill="'+coat+'"/><rect x="155" y="34" width="20" height="19" fill="#c89a70"/><path d="M152 38h25v5h-25z" fill="#382b2a"/><path d="M151 60l-12 20 5 3 16-14m18-9 13 16-4 4-17-13" fill="none" stroke="'+coat+'" stroke-width="7"/><path d="M152 94v13m20-13v13" stroke="#222a31" stroke-width="7"/>'+arms+'<path d="M0 108h320" stroke="'+glow+'" stroke-width="4" opacity=".7"/></svg>'}
/* the Settings page (no bar: the title's has Back to the menu, the Game Menu's Back to it and Resume: hub.js escSettings); a
   change redraws the page it is on (settingAct) */
function settingsPage(){
  return '<div class="top"><h2>Settings</h2></div>'+
    '<div class="lab">Realm economy</div><div class="tabs" role="group" aria-label="Realm economy">'+Object.keys(ECON_MODES).map(m=>'<button class="btn sm'+(ECON.mode===m?' on':'')+'" type="button" data-act="econmode" data-arg="'+m+'" aria-pressed="'+(ECON.mode===m)+'">'+ECON_MODES[m][0]+'</button>').join('')+'</div><p class="muted">'+ECON_MODES[ECON.mode][1]+'</p>'+
    '<div class="lab">Map grid</div><div class="tabs" role="group" aria-label="Map grid">'+[['off','Off'],['on','On']].map(([v,n])=>'<button class="btn sm'+(GRID.on===(v==='on')?' on':'')+'" type="button" data-act="grid" data-arg="'+v+'" aria-pressed="'+(GRID.on===(v==='on'))+'">'+n+'</button>').join('')+'</div><p class="muted">Lines along every tile (16 by 16 pixels) on the world map and in towns. G on the map turns it on and off.</p>'+
    '<div class="lab">Map zoom</div><div class="tabs" role="group" aria-label="Map zoom">'+[0,...Array.from({length:MAPZOOM.hi-MAPZOOM.lo+1},(_,i)=>MAPZOOM.lo+i)].map(v=>'<button class="btn sm'+(MAPZOOM.z===v?' on':'')+'" type="button" data-act="mapzoom" data-arg="'+v+'" aria-pressed="'+(MAPZOOM.z===v)+'">'+(v?v:'Auto')+'</button>').join('')+'</div><p class="muted">How close the world map is drawn: Auto starts closer on phones; higher numbers zoom in further. Use the wheel, + and −, the Map controls or a two-finger pinch to zoom.</p>'+
    '<div class="lab">Resolution</div><div class="tabs" role="group" aria-label="Resolution">'+[['full','Full'],['bal','Balanced'],['fast','Fast']].map(([v,n])=>{const on=prefGet('res')===v;return '<button class="btn sm'+(on?' on':'')+'" type="button" data-act="res" data-arg="'+v+'" aria-pressed="'+on+'">'+n+'</button>'}).join('')+'</div><p class="muted">Fewer pixels drawn: smoother on a phone, text a little coarser.</p>'+
    '<div class="lab">Frame rate</div><div class="tabs" role="group" aria-label="Frame rate">'+[[60,'60'],[30,'30']].map(([v,n])=>{const on=prefGet('fps')===v;return '<button class="btn sm'+(on?' on':'')+'" type="button" data-act="fps" data-arg="'+v+'" aria-pressed="'+on+'">'+n+'</button>'}).join('')+'</div><p class="muted">30 saves the battery and keeps a slow phone steady.</p>'+
    '<div class="lab">Ambient life</div><div class="tabs" role="group" aria-label="Ambient life">'+[['off','Off'],['on','On']].map(([v,n])=>{const on=prefGet('ambient')===(v==='on');return '<button class="btn sm'+(on?' on':'')+'" type="button" data-act="ambient" data-arg="'+v+'" aria-pressed="'+on+'">'+n+'</button>'}).join('')+'</div><p class="muted">Birds crossing the sky and pecking in the fields, crows over a fight, gulls on the shore, butterflies, fireflies at night, fish jumping, a hare or a squirrel; birds out of the trees as a battle begins. Only for the look: fewer and calmer when your system asks for less motion.</p>'+
    '<div class="lab">'+(B?.world?'World battle speed (shared with travel)':'Battle speed (each battle starts at it; change it in battle too)')+'</div><div class="tabs" role="group" aria-label="Battle speed">'+battleSpeeds().map(v=>'<button class="btn sm'+((B?.world?G.speed:BSPEED.v)===v?' on':'')+'" type="button" data-act="bspeed" data-arg="'+v+'" aria-pressed="'+((B?.world?G.speed:BSPEED.v)===v)+'">'+v+'×</button>').join('')+'</div>'+
    '<div class="lab">Guide texts</div><div class="tabs" role="group" aria-label="Guide texts">'+[['off','Off'],['on','On']].map(([v,n])=>'<button class="btn sm'+(GUIDE.on===(v==='on')?' on':'')+'" type="button" data-act="guide" data-arg="'+v+'" aria-pressed="'+(GUIDE.on===(v==='on'))+'">'+n+'</button>').join('')+'</div><p class="muted">The hints at the top of the screen and the helper lines in towns and battle. Off, only what you can do right now shows (E to talk).</p>'+
    '<div class="lab">Battle preparation</div><p class="muted">Armies walk to their starting formations before combat, then pause. Use Start Battle in the center of the screen or Space when ready. Ambushes and surprise attacks begin immediately.</p>'+
    '<div class="lab">Deployment</div><div class="tabs" role="group" aria-label="Deployment">'+[['off','Off'],['on','On']].map(([v,n])=>'<button class="btn sm'+(BDEPLOY.on===(v==='on')?' on':'')+'" type="button" data-act="bdeploy" data-arg="'+v+'" aria-pressed="'+(BDEPLOY.on===(v==='on'))+'">'+n+'</button>').join('')+'</div><p class="muted">On, a battle opens frozen so you can place your band in its zone first (Space to begin).</p>'+
    '<div class="lab">Health bars in battle</div><div class="tabs" role="group" aria-label="Health bars in battle">'+[['off','Off'],['on','On']].map(([v,n])=>'<button class="btn sm'+(HPBARS.on===(v==='on')?' on':'')+'" type="button" data-act="hpbars" data-arg="'+v+'" aria-pressed="'+(HPBARS.on===(v==='on'))+'">'+n+'</button>').join('')+'</div><p class="muted">A bar over every ally and enemy. Off, only you and your companions show one. The HP bars button in battle switches it too.</p>'+
    '<div class="lab">Blood in battle</div><div class="tabs" role="group" aria-label="Blood in battle">'+[['off','Off'],['on','On']].map(([v,n])=>'<button class="btn sm'+(BLOOD.on===(v==='on')?' on':'')+'" type="button" data-act="blood" data-arg="'+v+'" aria-pressed="'+(BLOOD.on===(v==='on'))+'">'+n+'</button>').join('')+'</div><p class="muted">Blood from blows, the stains it leaves and pools under the fallen. Off, the fallen still lie where they fell.</p>'+
    '<div class="lab">Fog of war (battle)</div><div class="tabs" role="group" aria-label="Fog of war (battle)">'+[['off','Off'],['on','On']].map(([v,n])=>{const on=prefGet('bfog')===(v==='on');return '<button class="btn sm'+(on?' on':'')+'" type="button" data-act="bfog" data-arg="'+v+'" aria-pressed="'+on+'">'+n+'</button>'}).join('')+'</div><p class="muted">On, each side sees only what its soldiers can: the enemy shows when your men come within sight of him, and ground out of their sight is shaded. Sieges, raids and tournaments have none.</p>'+
    '<div class="lab">Order paths (battle)</div><div class="tabs" role="group" aria-label="Order paths (battle)">'+[['all','Always'],['sel','Selected'],['off','Off']].map(([v,n])=>{const on=prefGet('opaths')===v;return '<button class="btn sm'+(on?' on':'')+'" type="button" data-act="opaths" data-arg="'+v+'" aria-pressed="'+on+'">'+n+'</button>'}).join('')+'</div><p class="muted">Where your groups are going: the way round cliffs, rock and deep water, the waypoints after it, an attack to where the enemy was last seen. Selected: the groups you have selected or point at, and for a moment any you give an order. Off: a straight line for each selected group.</p>'+
    '<div class="lab">Battle effects</div><div class="tabs" role="group" aria-label="Battle effects">'+[['full','Full'],['light','Light']].map(([v,n])=>{const on=prefGet('bfx')===v;return '<button class="btn sm'+(on?' on':'')+'" type="button" data-act="bfx" data-arg="'+v+'" aria-pressed="'+on+'">'+n+'</button>'}).join('')+'</div><p class="muted">How each man shows what moves him: rings under his feet (inspired, the banner, Stand Fast, a rally), pale when he runs, stars when stunned. Full adds sparks, dust and sweat; Light keeps only the rings, colours and stars.</p>'+
    '<div class="lab">Screen shake (battle)</div><div class="tabs" role="group" aria-label="Screen shake (battle)">'+[['off','Off'],['on','On']].map(([v,n])=>{const on=prefGet('bshake')===(v==='on');return '<button class="btn sm'+(on?' on':'')+'" type="button" data-act="bshake" data-arg="'+v+'" aria-pressed="'+on+'">'+n+'</button>'}).join('')+'</div><p class="muted">The screen shakes and flashes only when you are zoomed in very near, for an epic skill (Quake, Leap Slam) or a fight against a horde of beasts. Off, never.</p>'+
    '<div class="lab">Sound</div><div class="tabs" role="group" aria-label="Sound">'+[['off','Off'],['on','On']].map(([v,n])=>{const on=prefGet('mute')===(v==='off');return '<button class="btn sm'+(on?' on':'')+'" type="button" data-act="sound" data-arg="'+v+'" aria-pressed="'+on+'">'+n+'</button>'}).join('')+'</div>'+
    VOLUMES.map(([k,n])=>{const cur=prefGet(k),near=VOL_STEPS.reduce((a,x)=>Math.abs(x-cur)<Math.abs(a-cur)?x:a);return '<div class="lab">'+n+'</div><div class="tabs" role="group" aria-label="'+n+'">'+VOL_STEPS.map(x=>'<button class="btn sm'+(x===near?' on':'')+'" type="button" data-act="'+k+'" data-arg="'+x+'" aria-pressed="'+(x===near)+'">'+Math.round(x*100)+'%</button>').join('')+'</div>'}).join('')+
    '<p class="muted">Music and sound effects, all made as you play (nothing to download). Shift+M turns the sound off and on anywhere.</p>'+
    '<div class="lab">Controls</div><p class="muted">'+CONTROLS+'</p>'+
    '<div class="lab">Developer tools</div><div class="btns"><button class="btn" type="button" data-act="dev-open">Open developer tools</button></div><p class="muted">The console and the battle test bench (also ` or F2).</p>';
}
/* the title: the main menu (ui/mainmenu.js: New Campaign, Continue, Settings, Quit, and Load game, Wiki), and its pages as windows
   over its scene: New game, Load game, Settings (settingAct), the farewell (exit) */
function showTitle(screen){
  // (the main menu leaves the game behind: no Resume here; the pause menu (Esc) is where you resume)
  G.resume=null;G.mode='title';G.menu=screen||'main';G.race=G.race||'human';const sv=readSave(),back=nav(['menu','main','Back']);MainMenu.show();
  if(G.menu==='new')return showPanel('<div class="top"><h2>New game</h2></div><div class="lab">Choose your race</div><div class="tabs" role="group" aria-label="Race">'+Object.keys(RACES).map(r=>'<button class="btn sm'+(G.race===r?' on':'')+'" type="button" data-act="race" data-arg="'+r+'" aria-pressed="'+(G.race===r)+'">'+RACES[r].n+'</button>').join('')+'</div><p class="muted">'+RACES[G.race].d+' Troops of your own race cost 15% less to hire.</p>'+
    '<div class="lab">Name your hero and your band · or leave them for later</div>'+nameFields(NEW_NAMES)+// (ui/names.js)
    '<div class="lab">Choose your past · it decides your weapon · then your world</div><div class="cards origin-cards">'+Object.keys(BGS).map(k=>{const B0=BGS[k],w=B0.weapon?BASES[B0.weapon]:null;return '<button class="card origin-card" type="button" data-act="begin" data-arg="world:'+k+'">'+originArt(k)+'<strong>'+B0.n+'</strong><span class="gold">'+(w?w.n+' · '+(w.kind==='ranged'?'Ranged':w.kind==='magic'?'Magic':'Melee'):'Bare hands · Unarmed')+'</span><span>'+B0.d+'</span></button>'}).join('')+'</div>'+ 
    (sv?'<p class="bad" style="font-size:13px">Starting a new game will replace your saved game when it next saves.</p>':'')+back);
  if(G.menu==='load')return showPanel('<div class="top"><h2>Load game</h2></div><div class="slots">'+slotRows('title')+'</div>'+(SAVE_SLOTS.some(oldSlot)?'<p class="muted">Saves made by an older version cannot be loaded (the world is made differently now): start a new game.</p>':'')+(sv?'':'<p class="muted">No saved game yet. The game saves itself each day and when you leave a town (Autosave); F6 saves at any time (Quick save); the menu (Esc) saves to a slot of your own.</p>')+back);
  if(G.menu==='settings')return showPanel(settingsPage()+back);
  if(G.menu==='exit')return showPanel('<h2 class="big">Ashmark</h2><p>Thanks for playing. You can close this tab now.</p>'+nav(['menu','main','Back to the menu']));
  hidePanel();G.modal=true;MainMenu.main(sv);// (the menu itself: no window, the game's input held)
}
// back to the main menu from a game (the Game Menu, the game over): the world let go (session.js dropWorld), the menu alone again
function toTitle(screen){dropWorld();showTitle(screen)}
/* Esc: close what can be closed; otherwise open the Game Menu (hub.js), which pauses everything and remembers the screen under it */
// screens Esc closes, and the action that closes each
// where you may save (the Game Menu and saveGame agree): anywhere calm, never mid-fight or mid-choice
const ESC_SAVE=['world','town','char','inv','skills','site','besiege','scene'];
const ESC_CLOSE={help:'help-close',fullmap:'map-close',journal:'journal-close',quests:'quests-close',town:'leave',char:'char-close',inv:'inv-close',skills:'sk-close',site:'site-leave',besiege:'sg-leave'};
// Esc closes the window in front, one press at a time: its bottom bar's Back (an inner window back to the one behind it), else
// its way out (ui.js nav). A panel that only offers real choices (a fight, a perk, the fate of a holding) has no bar and is
// never chosen for you: Esc then pauses with the Game Menu, as it does once no window is left.
function escDismiss(){const q=QuestReward.esc();if(q)return q;if(ov.hidden)return null;return panel.querySelector('.nav [data-nav="back"]:not([disabled])')||panel.querySelector('.nav [data-nav="close"]:not([disabled]):not([data-noesc])')}
function onEscape(){
  uiSfx('back');
  if(G.mode==='esc'){const b=escDismiss();return b?act(b.dataset.act,b.dataset.arg):escAct('esc-resume')}// (the Game Menu: a page's Back, else Resume: hub.js)
  if(G.mode==='title'){const b=G.menu&&G.menu!=='main'&&escDismiss();if(b)return act(b.dataset.act,b.dataset.arg);if(G.menu&&G.menu!=='main')return menuAct('menu','main');return}
  if(G.place&&G.mode==='world'){G.place=null;toast('You stop placing.');return}
  const b=escDismiss();if(b)return act(b.dataset.act,b.dataset.arg);
  if(ESC_CLOSE[G.mode])return act(ESC_CLOSE[G.mode]);
  showEsc();
}
// text onto the clipboard: true once it is there (the browser's clipboard, else the old copy command); false if neither would
function copyText(t){const old=()=>{const a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}a.remove();return ok};
  try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t).then(()=>true,old)}catch(e){}return Promise.resolve(old())}
function menuAct(a,arg){
  if(a==='resume'){if(G.resume){const m=G.resume;G.resume=null;if(m==='town'&&G.town){G.mode='town';renderTown()}else{G.mode='world';hidePanel()}}return true}
  if(a==='wipe-ask'){G.wipeArmed=arg||latestSlot();showTitle('load');return true}
  if(a!=='menu')return false;
  G.wipeArmed=false;
  if(arg==='wiki'){try{window.open('wiki.html','_blank')}catch(e){}return true}
  if(arg==='exit'){try{window.close()}catch(e){}showTitle('exit');return true}
  if(arg==='new')worldSetupFresh();// (each visit a fresh seed: worldsetup.js)
  showTitle(arg);const b=panel.querySelector('.card,button');if(b)b.focus({preventScroll:true});return true;
}
/* the game is over (the owner, 2026-10-22: your hero died on the road, of thirst, hunger, fever or frostbite: world/supply.js
   heroDies; the full design of death comes later): what killed her and the day; the bar: Load last save on the left (greyed with
   none), Back to the title on the right. Esc follows the bar. Nothing runs on behind it (world.js updateWorld) */
function showDeath(){const d=G.dead||{},sv=readSave(),why=WHY_SICK[d.why]||d.why||'your wounds';G.mode='dead';hideTip();
  showPanel('<div class="top"><h2>You have died</h2><span class="muted">Day '+d.day+'</span></div><div class="death"><p class="bad">You died of '+why+' on day '+d.day+'.</p>'+
    '<p class="muted">'+(sv?'Your last save: '+saveLine(sv)+'.':'There is no saved game to go back to.')+'</p></div>'+
    nav(['dead-load',null,'Load last save',sv?'':'No saved game'],['dead-title',null,'Back to the title']))}
onAct('dead-',a=>{if(a==='dead-load'){if(readSave())loadGame()}else if(a==='dead-title')toTitle()});
/* ---------- the buttons' sounds (audio.js): one listener hears every button, nav() bars and windows alike; what the press did
   picks the sound: gold changed hands, the coin; a refusal (a new message in red), the refusal; else a bottom bar's Back or way
   out, back; a primary button, confirm; any other, a click. (Before the first press there is no sound: nothing to work out) ---------- */
const uiSfx=n=>typeof sfx==='function'&&sfx(n);
document.addEventListener('click',e=>{if(typeof AUDIO==='undefined'||!AUDIO.ctx||AUDIO.muted)return;const b=e.target.closest&&e.target.closest('button,[data-act]');if(!b||b.disabled)return;
  const kind=b.dataset.nav?'back':b.classList.contains('primary')?'confirm':'click',gold=P.gold,last=G.msgs[G.msgs.length-1];
  setTimeout(()=>{const fresh=G.msgs.slice(G.msgs.lastIndexOf(last)+1);uiSfx(P.gold!==gold?'coin':fresh.some(m=>m.cls==='bad')?'refused':kind)},0)},true);
