'use strict';
/* ---------- names: your hero's and your band's (the owner, 2026-10-23; their numbers and words: data/names.js) ----------
   Chosen on the New game page (ui.js showTitle: nameFields, each with Random; left empty, the default; and there, your hero a man
   or a woman: P.gender, kept only for a woman, as the names, so a save without it is a man's: core/pronouns.js), given as the game starts
   (session.js startGame: nameStart) and changed later from the party card (its band name opens the Names window). Kept as
   P.name and P.band only once chosen: a game with none stores neither (the world's fingerprint W7 hashes the save), and a save
   without them shows the defaults. Plain text: whatever shows them puts them through htmlText */
// (a name as typed: one line, its spaces squeezed, trimmed, at most NAMING.max characters; '' for none)
const cleanName=s=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim().slice(0,NAMING.max).trim();
// your band's name (NAMING.band while you have given it none); your hero's ('' while none)
const bandName=()=>P.band||NAMING.band;
const heroName=()=>P.name||'';
// random names: a folk name of the race (a man's or a woman's, as your hero is) with a byname; a band's, one of its forms filled
// from its words (the places by race)
const namePick=a=>a[Math.floor(Math.random()*a.length)];
function randomHeroName(race,g){const N=FOLK_NAMES[race]||FOLK_NAMES.human,own=N.filter(n=>!g||genderOf(n)===g);return cleanName(namePick(own.length?own:N)+' '+namePick(SWORD_BYNAMES))}
function randomBandName(race){const W=BAND_WORDS,pl=W.place[race]||W.place.human;
  return cleanName(namePick(BAND_FORMS).replace(/\w+/g,w=>w==='the'?'The':w==='adj'?namePick(W.adj):w==='noun'?namePick(W.noun):namePick(pl)))}
/* your army's flag (the owner, 2026-11-24: "add army flag customization at the start and use it everywhere for player faction";
   data/names.js ARMY_FLAG): P.flag {col, dev} once chosen other than the Free Banner's (as the names: a game that keeps it stores
   none, so the world's fingerprint W7 holds), else ARMY_FLAG.def. Its colour is the Free Banner's wherever yours shows
   (FACS.player.col: the map's land, your holdings, parties, caravans and patrols), its device on every banner of yours (facDev) */
const armyFlag=()=>typeof P!=='undefined'&&P&&P.flag||ARMY_FLAG.def;
// (a realm's device on its banners: yours, your flag's; another's, its own)
const facDev=f=>f==='player'?armyFlag().dev:f;
// (your flag put in force: as a game starts or loads (session.js resetSession, nameStart) and when changed (saveNames); the land's
//  colours reckoned again when its colour changed, world/territory.js landVer)
function applyArmyFlag(){const c=armyFlag().col;if(FACS.player.col===c)return;FACS.player.col=c;if(typeof landVer!=='undefined')landVer++}
// (a banner's picture as an image's src, cut to its pixels: structures.js flagSprite; kept by its look)
const FLAG_URLS=new Map();
function flagUrl(b){const k=b.k+b.col+b.dev;let u=FLAG_URLS.get(k);if(!u){const s=flagSprite(b,0),q=opaqueBox(s);u=mkc(q[2]-q[0]+1,q[3]-q[1]+1,g=>g.drawImage(s,-q[0],-q[1])).toDataURL();FLAG_URLS.set(k,u)}return u}
// (the flag's choices: its field's colours, its devices each on that field, the flag as it will fly beside them)
function flagFields(d){const A=ARMY_FLAG,on=(a,b)=>' class="'+a+(b?' on':'')+'" aria-pressed="'+b+'"';
  return '<div class="nm-flag" role="group" aria-label="Army flag"><img class="nm-flag-pic" src="'+flagUrl({k:'banner',col:d.col,dev:d.dev})+'" alt="Your army flag"><div class="nm-flag-pick">'+
    '<span class="nm-flag-lab">Army flag</span><span class="nm-swatches" role="group" aria-label="Field colour">'+A.cols.map(([c,n])=>'<button type="button"'+on('nm-swatch',c===d.col)+' data-act="nm-col" data-arg="'+c+'" style="--sw:'+c+'" title="'+n+'" aria-label="'+n+'"></button>').join('')+'</span>'+
    '<span class="nm-devices" role="group" aria-label="Device">'+A.devs.map(([k,n])=>'<button type="button"'+on('nm-dev',k===d.dev)+' data-act="nm-dev" data-arg="'+k+'" title="'+n+'" aria-label="'+n+'"><img src="'+flagUrl({k:'banner',col:d.col,dev:k})+'" alt=""></button>').join('')+'</span></div></div>'}
// the names typed on the New game page (kept while you go to the New world screen and back; taken, and cleared, as the game
// starts); nameDraft: those of the page or window open now
const NEW_NAMES={hero:'',band:'',gender:'m',col:ARMY_FLAG.def.col,dev:ARMY_FLAG.def.dev};
let nameDraft=NEW_NAMES;
// the two fields, each with Random (draft: the names they edit)
function nameFields(draft){nameDraft=draft;
  const f=(k,label,ph)=>'<label class="nm-field"><span>'+label+'</span><span class="nm-line"><input data-name="'+k+'" type="text" maxlength="'+NAMING.max+'" autocomplete="off" spellcheck="false" value="'+htmlText(draft[k])+'" placeholder="'+htmlText(ph)+'">'+
    '<button class="btn sm" type="button" data-act="nm-random" data-arg="'+k+'">Random</button></span></label>';
  // (the New game page's: your hero a man or a woman)
  const g=draft===NEW_NAMES?'<div class="nm-field"><span>Your hero</span><span class="nm-line" role="group" aria-label="Your hero">'+[['m','Man'],['f','Woman']].map(([k,n])=>'<button class="btn sm'+(draft.gender===k?' on':'')+'" type="button" data-act="nm-gender" data-arg="'+k+'" aria-pressed="'+(draft.gender===k)+'">'+n+'</button>').join('')+'</span></div>':'';
  return '<div class="nm-fields">'+f('hero','Hero name','Unnamed')+f('band','Band name',NAMING.band)+g+'</div>'+flagFields(draft)}
// (the game begun: the page's names become your hero's and your band's; the page's cleared)
function nameStart(){for(const [k,f] of [['hero','name'],['band','band']]){const v=cleanName(NEW_NAMES[k]);if(v)P[f]=v;NEW_NAMES[k]=''}if(NEW_NAMES.gender==='f')P.gender='f';
  const d=ARMY_FLAG.def;if(NEW_NAMES.col!==d.col||NEW_NAMES.dev!==d.dev)P.flag={col:NEW_NAMES.col,dev:NEW_NAMES.dev};NEW_NAMES.col=d.col;NEW_NAMES.dev=d.dev;applyArmyFlag()}
/* the Names window (the party card's band name): both names, each with Random; the bar: Back (nothing changed) on the left,
   Save on the right; Esc goes Back, Enter in a field saves. A name left empty goes back to its default (stored as none) */
function openNames(){if(!openOver('names','<div class="top"><h2>Names and flag</h2><span class="muted">Your band, your hero and your army\'s flag</span></div><div class="nm-win">'+nameFields({hero:P.name||'',band:P.band||'',col:armyFlag().col,dev:armyFlag().dev})+
    '<p class="muted">Up to '+NAMING.max+' characters each. Left empty, your band is '+htmlText(NAMING.band)+' and your hero goes by your race and past.</p></div>'+nav(['nm-back',null,'Back'],['nm-save',null,'Save'])))return false;
  const i=panel.querySelector('[data-name]');if(i)i.focus({preventScroll:true});return true}
function saveNames(){const was=bandName();for(const [k,f] of [['hero','name'],['band','band']]){const v=cleanName(nameDraft[k]);if(v)P[f]=v;else delete P[f]}
  const d=ARMY_FLAG.def,fl=nameDraft;if(fl.col!==d.col||fl.dev!==d.dev)P.flag={col:fl.col,dev:fl.dev};else delete P.flag;applyArmyFlag();
  closeOver();if(bandName()!==was)log('Your band is now '+htmlText(bandName())+'.','good');updateHUD(true)}
onAct('nm-',(a,arg)=>{
  if(a==='nm-open'){if(G.mode==='world'&&!G.modal)openNames();return}
  if(a==='nm-gender'&&(arg==='m'||arg==='f')&&nameDraft===NEW_NAMES){NEW_NAMES.gender=arg;for(const b of panel.querySelectorAll('[data-act="nm-gender"]')){const on=b.dataset.arg===arg;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)}return}
  if(a==='nm-random'&&(arg==='hero'||arg==='band')){const race=G.mode==='title'?G.race||'human':P.race,v=arg==='hero'?randomHeroName(race,G.mode==='title'?NEW_NAMES.gender:genderOf(P)):randomBandName(race);
    nameDraft[arg]=v;const i=panel.querySelector('[data-name="'+arg+'"]');if(i)i.value=v;return}
  // (the flag's choices: the draft's colour or device, the flag's part of the page drawn again)
  if((a==='nm-col'&&ARMY_FLAG.cols.some(c=>c[0]===arg))||(a==='nm-dev'&&ARMY_FLAG.devs.some(v=>v[0]===arg))){nameDraft[a==='nm-col'?'col':'dev']=arg;const el=panel.querySelector('.nm-flag');if(el)el.outerHTML=flagFields(nameDraft);return}
  if(G.mode!=='names')return;
  if(a==='nm-back')closeOver();else if(a==='nm-save')saveNames()});
// the fields: typing (into the draft), Enter (the window saves; the page leaves the field), Esc (follows the bottom bar)
panel.addEventListener('input',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.name;if(k)nameDraft[k]=e.target.value});
panel.addEventListener('keydown',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.name;if(!k)return;
  if(e.key==='Enter'){e.preventDefault();if(G.mode==='names')act('nm-save');else e.target.blur()}else if(e.key==='Escape'){e.preventDefault();e.target.blur();onEscape()}});
// (the party card: its band name, a button)
{const c=document.getElementById('stats');if(c)c.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b)act(b.dataset.act,b.dataset.arg)})}
