'use strict';
/* ---------- the Menu (Tab; the bar's Menu): every window, a tile each (its icon, name and key), over the map or the streets ----------
   The owner, 2026-10-23: the main way in on a phone; the bar's own buttons stay as shortcuts. A tile is one definition (a
   window adds itself): defineMenuEntry(id, {label, icon, key, open, why}) - open(): opens its window (the Menu closed first);
   why(): why it cannot open now ('' or none: it can; greyed with the reason). The tiles keep the order they are defined in.
   Closing goes back where you were (openOver); Esc follows the bar ---------- */
const MENU_ENTRIES={};
function defineMenuEntry(id,spec){
  MENU_ENTRIES[id]={id,...spec};
  return MENU_ENTRIES[id];
}
// (a window of the map's: not from the streets)
const hubMapOnly=()=>G.overBack==='world'?'':'On the map only';
function renderHub(){
  const tile=e=>{const why=e.why?e.why():'';
    return '<button type="button" class="fb-hub-tile" data-act="hub-go" data-arg="'+e.id+'"'+(why?' disabled':'')+'>'+fbIcon(e.icon,32)+'<strong>'+e.label+'</strong><kbd>'+e.key+'</kbd>'+(why?'<small>'+htmlText(why)+'</small>':'')+'</button>'};
  fbShow('Menu','Every window, and its key','','<div class="fb-scroll" data-fb-scroll="hub"><div class="fb-hub" role="group" aria-label="Windows">'+Object.values(MENU_ENTRIES).map(tile).join('')+'</div></div>',
    null,['hub-close',null,G.overBack==='scene'?'Back to the streets':'Back to map'],'fb-hubwin');
}
function openHub(){
  if(G.mode!=='hub'&&!openOver('hub',''))return false;
  renderHub();
  return true;
}
onAct('hub-',(a,arg)=>{
  if(G.mode!=='hub')return;
  if(a==='hub-close')return closeOver();
  const e=a==='hub-go'&&MENU_ENTRIES[arg];
  if(!e||e.why&&e.why())return;
  closeOver();e.open();
});
// the windows (Army: your band's roster, its skills, condition and passengers, ui/partypage.js)
defineMenuEntry('army',{label:'Army',icon:'troops',key:'C',open:()=>openChar(),why:hubMapOnly});
defineMenuEntry('inventory',{label:'Inventory',icon:'bag',key:'I',open:()=>openInv(),why:hubMapOnly});
defineMenuEntry('quests',{label:'Quests',icon:'scroll',key:'Q',open:()=>openQuests()});
defineMenuEntry('journal',{label:'Journal',icon:'book',key:'J',open:()=>openJournal()});
defineMenuEntry('map',{label:'Map',icon:'map',key:'M',open:()=>fullMapOpen(),why:hubMapOnly});
defineMenuEntry('camp',{label:'Camp',icon:'fire',key:'Z',open:()=>toggleCamp(),why:hubMapOnly});
