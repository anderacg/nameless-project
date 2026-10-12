'use strict';
/* ---------- panels ---------- */
function showPanel(html){panel.innerHTML=html;ov.hidden=false;G.modal=true;const b=panel.querySelector('button:not([disabled]),.card');if(b)b.focus({preventScroll:true})}
function hidePanel(){ov.hidden=true;G.modal=false}
/* the main menu: Continue, New game, Load game, Settings, Wiki, Exit; opened from the HUD it can Resume the game in progress */
const CONTROLS='World map: click to move, Space to pause, C for your character, K for skills, I for your inventory, F6 to save. Battle: WASD to move, Space or click to attack (a 3-hit combo with melee weapons; bows and staves shoot where you aim), F to dodge, right-click to shove, 1 to 0 for your skill slots, Shift to sprint, B to block, G to pick a troop group, Z X C V T to give it orders.';
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
const ESC_SAVE=['world','town','char','inv','skills','site','herd','besiege'];
const ESC_CLOSE={town:'leave',char:'char-close',inv:'inv-close',skills:'sk-close',site:'site-leave',herd:'herd-leave',besiege:'sg-leave'};
function onEscape(){
  if(G.mode==='esc')return escAct('esc-resume');
  if(G.mode==='title'){if(G.menu&&G.menu!=='main')return menuAct('menu','main');if(G.resume)return menuAct('resume');return}
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
function begin(k){
  const b=BGS[k];P.bg=k;P.gold=b.gold;P.troops={...b.troops};P.bonus=b.bonus;P.morale=80;P.renown=0;P.level=1;P.xp=0;
  const rc=RACES[P.race=G.race||'human'];
  P.attr={str:2,agi:2,int:2,cha:2};for(const a in b.attr)P.attr[a]+=b.attr[a];for(const a in rc.attr)P.attr[a]=Math.max(1,P.attr[a]+rc.attr[a]);
  P.sk=mkSkills();for(const s in b.sk)P.sk[s].lv=b.sk[s];for(const s in rc.sk)P.sk[s].lv+=rc.sk[s];
  P.pts=0;P.perks=[];P.perkPend=0;P.origin=originOf(k);P.tree=[P.origin];applyNode(P.origin,1);P.tp=0;P.slots=Array(10).fill(null);G.skSel=P.origin;G.tv=null;P.prisoners={};P.comps={};P.fac=null;P.hostile={};P.rep={};P.honor={};P.hp=P.sp=P.mp=null;P.siege=null;P.raid=null;P.fiefWeek=0;P.quests=[];P.jobs={};P.qid=0;G.lordJob=null;G.capture=null;G.bes=null;P.gear={...emptyGear(),weapon:gearId(b.weapon||'sword',0)};P.inv=Array(INV_SIZE).fill(null);for(const g in b.cargo)invAdd('good',g,b.cargo[g]);if(b.ammo)invAdd('good',b.ammo[0],b.ammo[1]);G.perkOffer=null;G.chase=null;initWorld();W.sites=genSites();G.lastSite=null;G.site=null;W.critters=[];G.herd=null;initCritters();
  const home=townBy(START_TOWN[P.race])||TOWNS[0];if(b.rep)P.rep[home.name]=b.rep;
  P.x=(home.tx+.5)*TILE;P.y=(home.ty+2.5)*TILE;P.tx=null;G.day=1;G.clock=0;G.mode='world';G.lastTown=home;
  CAMPS.forEach(c=>{c.cleared=false;c.back=0});
  bandits=[];for(let i=0;i<BANDITS;i++)spawnBandit(true);
  for(let i=0;i<MONSTER_START;i++)spawnMonster(true);
  hidePanel();G.msgs=[];log('You ride out of '+home.name+' alone, as '+(rc.n==='Elf'||rc.n==='Orc'?'an ':'a ')+rc.n.toLowerCase()+' '+b.n.toLowerCase()+'. Win fame around here and the locals will follow you.');updateHint();updateHUD(true);
}
onAct('esc-',escAct);
