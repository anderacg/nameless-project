'use strict';
/* ---------- the Chronicle: a section of the Journal (journal.js; the owner, 2026-10-23: the old Message log, folded in; L) ----------
   Every message of the game (G.msgs: core/state.js CHRONICLE, every one kept), newest first, under its day's header. Its filters
   are tabs (CHRON.filters): All, or the messages of one kind (those of no kind under All only), each with its count. One page at a
   time (CHRONICLE.page messages: Newest, Newer, Older, Oldest), so tens of thousands open at once: only that page is drawn. A
   quest's or story's message opens its entry in your Quests (questwindow.js: Open in Main, Side, Jobs or Archive; chronEntry;
   its bar's Back returning here) while it can be found; a rumour's shows its "?" on the full map (Show on map) while its mark
   lasts, from the map only (journal.js journalAwayWhy). One you heard of later (a rider's news: world/worldlog.js) says when it
   happened (chronWhen). Its state (G.chron: the filter, the page) is runtime only ---------- */
const CHRON={filters:[['all','All'],['war','War & battles'],['rumour','Rumours'],['band','Your band'],['story','Story & quests']]};
const chronState=()=>G.chron||(G.chron={f:'all',page:0});
// (the entry a message links to, among the journal's (keyed: questwindow.js qwItems): its own; a story's stage's quest, its story;
// one over, its archive entry; none: null)
function chronEntry(ref,byK){
  if(byK.has(ref))return byK.get(ref);
  if(ref[0]==='q'){const q=questBy(+ref.slice(1)),th=q&&Quest.as(q).story;if(th&&byK.has('t'+th.i))return byK.get('t'+th.i)}
  return byK.get('a'+ref)||null;
}
const chronItems=()=>new Map(qwItems().map(x=>[x.k,x]));
// (a rumour's mark (its ref 'n' and its news id: news.js rumourHear; or 'ni…', information bought: worldlog.js intelLearn), while
// it lasts on the map; none: null)
const chronMark=ref=>{const id=String(ref).slice(1);return rumourMarks().find(m=>String(m.id)===id&&rumourFade(m)>0)||null};
// (a message's link: Show on map for a rumour, Open in its tab for a quest or story; none)
function chronLink(r,byK){
  if(!r.ref)return '';
  if(r.ref[0]==='n')return qwBtn('ch-map',r.ref,'Show on map',chronMark(r.ref)?journalAwayWhy():'Its mark has faded from the map','ch-link');
  const it=chronEntry(r.ref,byK);
  return it?qwBtn('ch-open',it.k,'Open in '+qwTabName(it.tab),'','ch-link'):'';
}
// (heard later than it happened: "happened day 12 (2 days before you heard)"; else nothing)
const chronWhen=r=>r.at&&r.at<r.day?' <small class="muted ch-when">happened day '+r.at+' ('+(r.day-r.at)+(r.day-r.at===1?' day':' days')+' before you heard)</small>':'';
// the section: its filters, the page (its days' headers, a row each: the message and its link), its pages
function chronicleWindow(){
  const C=chronState(),M=G.msgs,n={all:M.length};
  for(const r of M)if(r.kind)n[r.kind]=(n[r.kind]||0)+1;
  if(!CHRON.filters.some(([f])=>f===C.f))C.f='all';
  const list=C.f==='all'?M:M.filter(r=>r.kind===C.f),N=CHRONICLE.page,pages=Math.max(1,Math.ceil(list.length/N));
  C.page=clamp(C.page|0,0,pages-1);
  const hi=list.length-C.page*N,lo=Math.max(0,hi-N),byK=chronItems();
  let h='',day=null;
  for(let i=hi-1;i>=lo;i--){const r=list[i];if(r.day!==day){day=r.day;h+='<h4 class="ch-day">Day '+day+'</h4>'}
    h+='<div class="ch-msg'+(r.cls?' '+r.cls:'')+'"><span>'+r.m+chronWhen(r)+'</span>'+chronLink(r,byK)+'</div>'}
  const filters=fbTabs(CHRON.filters.map(([f,l])=>[f,l+' · '+(n[f]||0)]),C.f,'ch-filter','Chronicle filters');
  const first=pages>1&&list[hi-1].day,last=pages>1&&list[lo].day,at=C.page===0,end=C.page===pages-1;
  const pager=pages>1?'<div class="ch-pager" role="group" aria-label="Pages">'+qwBtn('ch-page',0,'Newest',at?'This is the newest page':'')+qwBtn('ch-page',C.page-1,'Newer',at?'This is the newest page':'')+
    '<span>Page '+(C.page+1)+' of '+pages+' · day '+first+(last!==first?'–'+last:'')+'</span>'+qwBtn('ch-page',C.page+1,'Older',end?'This is the oldest page':'')+qwBtn('ch-page',pages-1,'Oldest',end?'This is the oldest page':'')+'</div>':'';
  return '<div class="chron">'+filters+'<div class="ch-scroll" data-fb-scroll="chron:'+C.f+':'+C.page+'" role="region" aria-label="Messages">'+
    (h||'<p class="muted">'+(C.f==='all'?'Nothing has happened yet.':'Nothing of this kind yet.')+'</p>')+'</div>'+pager+'</div>';
}
// (a quest's or story's entry opened in your Quests: its tab, chosen and open, its bar's Back returning to the Chronicle)
function chronOpen(k){
  const S=qwState(),it=chronItems().get(k);if(!it)return;
  closeOver();S.tab=it.tab;S.sel=k;S.open=true;S.ask=null;S.from=k;
  openQuests();
  panel.querySelector('.qw-detail .btn:not([disabled])')?.focus({preventScroll:true});
}
// L: the Journal on the Chronicle, its newest page (open on it already: closed)
function chronicleKey(){
  if(!journalOn('chronicle'))chronState().page=0;
  return journalKey('chronicle');
}
onAct('ch-',(a,arg)=>{
  if(a==='ch-back'){if(G.mode==='quests'){qwState().from=null;closeOver();openJournal('chronicle')}return}
  if(G.mode!=='journal')return;
  const C=chronState();fbRemember();
  if(a==='ch-filter'){C.f=arg;C.page=0}
  else if(a==='ch-page')C.page=+arg;
  else if(a==='ch-open')return chronOpen(arg);
  else if(a==='ch-map'){const m=chronMark(arg);if(m)journalMap(m.x/TILE,m.y/TILE);return}
  else return;
  renderJournal();
  const b=a==='ch-filter'?panel.querySelector('[data-act="ch-filter"].on'):a==='ch-page'?panel.querySelector('[data-act="ch-page"][data-arg="'+CSS.escape(arg)+'"]:not([disabled])')||panel.querySelector('[data-act="ch-page"]:not([disabled])'):null;
  if(b)b.focus({preventScroll:true});
});
defineJournalSection('chronicle',{label:'Chronicle',icon:'log',render:chronicleWindow,sub:()=>G.msgs.length+(G.msgs.length===1?' message':' messages')});
