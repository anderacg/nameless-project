'use strict';
/* ---------- the Journal: a window of its own, over the map or the streets (L and the bar's Log: on its Chronicle) ----------
   Its sections are the field book's tabs (doc/FIELDBOOK_UI.md), in the order they are defined; today the Chronicle
   (ui/chronicle.js), others to come beside it. A section is one definition, as a town's places are (town.js definePlace):
   defineJournalSection(id, {label, icon, render, back, sub}):
   - render(): its content (HTML: a section draws its own panes and keeps its own state);
   - back(): its bar's Back while it has one ([act, arg, label]: an inner page back to the one behind it), else none;
   - sub(): the line under the window's title (none: nothing).
   A section's buttons are its own actions (onAct, by their prefix: the Chronicle's ch-). The section last opened is opened
   again (runtime only, G.jsec: never saved). Closing goes back where you were (openOver: the map or the streets); Esc follows
   the bar. journalMap: a section's Show on map (the full map, its Back returning to the section; from the streets, none) ---------- */
const JOURNAL_SECTIONS={};
function defineJournalSection(id,spec){
  JOURNAL_SECTIONS[id]={id,...spec};
  return JOURNAL_SECTIONS[id];
}
// (the section open: the last one opened, else the first defined)
function journalSection(){
  if(!JOURNAL_SECTIONS[G.jsec])G.jsec=Object.keys(JOURNAL_SECTIONS)[0];
  return G.jsec;
}
// the window drawn again, on the section open
function renderJournal(){
  KNOWLEDGE.watch();
  const id=journalSection(),s=JOURNAL_SECTIONS[id];
  const tabs=fbTabs(Object.values(JOURNAL_SECTIONS).map(x=>[x.id,(x.icon?fbIcon(x.icon)+' ':'')+x.label]),id,'jn-sec','Journal sections');
  fbShow('Journal',s.sub?s.sub():'',tabs,s.render(),fbMenu(s.back&&s.back()),['journal-close',null,G.overBack==='scene'?'Back to the streets':'Back to map'],'fb-journal fb-jn-'+id);
}
// opened (on a section, if one is named; already open: turned to it), from the map or the streets; true once it is open
function openJournal(sec){
  if(sec&&JOURNAL_SECTIONS[sec])G.jsec=sec;
  if(G.mode!=='journal'&&!openOver('journal',''))return false;
  renderJournal();
  return true;
}
// is it open (on this section)
const journalOn=sec=>G.mode==='journal'&&(!sec||journalSection()===sec);
// opened on a section, or closed while open on it
function journalKey(sec){
  if(journalOn(sec))return act('journal-close');
  return openJournal(sec);
}
// (from the map only: the streets have no full map; why not, else '')
const journalAwayWhy=()=>G.overBack==='world'?'':'Leave the streets first';
// Show on map: the full map centred on a point (tiles), its Back returning to the section open
function journalMap(x,y){
  if(journalAwayWhy())return;
  closeOver();
  if(!fullMapOpen({x,y},['jn-back',null,'Back to '+JOURNAL_SECTIONS[journalSection()].label]))openJournal();
}
onAct('jn-',(a,arg)=>{
  if(a==='jn-back'){if(G.mode==='fullmap'){closeOver();openJournal()}return}
  if(a!=='jn-sec'||G.mode!=='journal'||!JOURNAL_SECTIONS[arg])return;
  fbRemember();G.jsec=arg;
  renderJournal();
  panel.querySelector('[data-act="jn-sec"].on')?.focus({preventScroll:true});
});
onAct('journal-',()=>{if(G.mode==='journal')closeOver()});
