'use strict';
/* ---------- names: your hero's and your band's (the owner, 2026-10-23; their numbers and words: data/names.js) ----------
   Chosen on the New game page (ui.js showTitle: nameFields, each with Random; left empty, the default), given as the game starts
   (session.js startGame: nameStart) and changed later from the party card (its band name opens the Names window). Kept as
   P.name and P.band only once chosen: a game with none stores neither (the world's fingerprint W7 hashes the save), and a save
   without them shows the defaults. Plain text: whatever shows them puts them through htmlText */
// (a name as typed: one line, its spaces squeezed, trimmed, at most NAMING.max characters; '' for none)
const cleanName=s=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim().slice(0,NAMING.max).trim();
// your band's name (NAMING.band while you have given it none); your hero's ('' while none)
const bandName=()=>P.band||NAMING.band;
const heroName=()=>P.name||'';
// random names: a folk name of the race with a byname; a band's, one of its forms filled from its words (the places by race)
const namePick=a=>a[Math.floor(Math.random()*a.length)];
function randomHeroName(race){return cleanName(namePick(FOLK_NAMES[race]||FOLK_NAMES.human)+' '+namePick(SWORD_BYNAMES))}
function randomBandName(race){const W=BAND_WORDS,pl=W.place[race]||W.place.human;
  return cleanName(namePick(BAND_FORMS).replace(/\w+/g,w=>w==='the'?'The':w==='adj'?namePick(W.adj):w==='noun'?namePick(W.noun):namePick(pl)))}
// the names typed on the New game page (kept while you go to the New world screen and back; taken, and cleared, as the game
// starts); nameDraft: those of the page or window open now
const NEW_NAMES={hero:'',band:''};
let nameDraft=NEW_NAMES;
// the two fields, each with Random (draft: the names they edit)
function nameFields(draft){nameDraft=draft;
  const f=(k,label,ph)=>'<label class="nm-field"><span>'+label+'</span><span class="nm-line"><input data-name="'+k+'" type="text" maxlength="'+NAMING.max+'" autocomplete="off" spellcheck="false" value="'+htmlText(draft[k])+'" placeholder="'+htmlText(ph)+'">'+
    '<button class="btn sm" type="button" data-act="nm-random" data-arg="'+k+'">Random</button></span></label>';
  return '<div class="nm-fields">'+f('hero','Hero name','Unnamed')+f('band','Band name',NAMING.band)+'</div>'}
// (the game begun: the page's names become your hero's and your band's; the page's cleared)
function nameStart(){for(const [k,f] of [['hero','name'],['band','band']]){const v=cleanName(NEW_NAMES[k]);if(v)P[f]=v;NEW_NAMES[k]=''}}
/* the Names window (the party card's band name): both names, each with Random; the bar: Back (nothing changed) on the left,
   Save on the right; Esc goes Back, Enter in a field saves. A name left empty goes back to its default (stored as none) */
function openNames(){if(!openOver('names','<div class="top"><h2>Names</h2><span class="muted">Your band and your hero</span></div><div class="nm-win">'+nameFields({hero:P.name||'',band:P.band||''})+
    '<p class="muted">Up to '+NAMING.max+' characters each. Left empty, your band is '+htmlText(NAMING.band)+' and your hero goes by your race and past.</p></div>'+nav(['nm-back',null,'Back'],['nm-save',null,'Save'])))return false;
  const i=panel.querySelector('[data-name]');if(i)i.focus({preventScroll:true});return true}
function saveNames(){const was=bandName();for(const [k,f] of [['hero','name'],['band','band']]){const v=cleanName(nameDraft[k]);if(v)P[f]=v;else delete P[f]}
  closeOver();if(bandName()!==was)log('Your band is now '+htmlText(bandName())+'.','good');updateHUD(true)}
onAct('nm-',(a,arg)=>{
  if(a==='nm-open'){if(G.mode==='world'&&!G.modal)openNames();return}
  if(a==='nm-random'&&(arg==='hero'||arg==='band')){const race=G.mode==='title'?G.race||'human':P.race,v=arg==='hero'?randomHeroName(race):randomBandName(race);
    nameDraft[arg]=v;const i=panel.querySelector('[data-name="'+arg+'"]');if(i)i.value=v;return}
  if(G.mode!=='names')return;
  if(a==='nm-back')closeOver();else if(a==='nm-save')saveNames()});
// the fields: typing (into the draft), Enter (the window saves; the page leaves the field), Esc (follows the bottom bar)
panel.addEventListener('input',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.name;if(k)nameDraft[k]=e.target.value});
panel.addEventListener('keydown',e=>{const k=e.target&&e.target.dataset&&e.target.dataset.name;if(!k)return;
  if(e.key==='Enter'){e.preventDefault();if(G.mode==='names')act('nm-save');else e.target.blur()}else if(e.key==='Escape'){e.preventDefault();e.target.blur();onEscape()}});
// (the party card: its band name, a button)
{const c=document.getElementById('stats');if(c)c.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b)act(b.dataset.act,b.dataset.arg)})}
