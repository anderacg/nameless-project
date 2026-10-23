'use strict';
/* ---------- your Quests: a window of its own (Q; the Menu's Quests), over the map or the streets: its tabs, a list and the one chosen in full ----------
   The quest model (story/quest.js; the owner, 2026-10-23): every quest and story reads its category (cat) and its state the same
   way. The tabs (QW.tabs): Main, Side and Jobs (QUEST_CATS), and the Archive (QuestArchive: those done, failed or abandoned,
   newest first). A story is one quest: listed once (its stages' quests are its objective, never rows of their own). Each is
   keyed as P.track keeps it: 'q' and a quest's id, 't' and a story's number; an offer you know of (the boards seen this week,
   the last lord's: greyed while locked, with what it requires) 'o' and where it is; an archive entry 'a' and its own key.
   A tab's list: the one you track first (under its own label), then the rest, a row each (its title, its state and a line:
   how far along, "Return to X for your reward", what it requires, what it came to). The one chosen (G.qw.sel; none: the
   tracked one, else the first):
   - a quest: its category and state, its text, its facts (given by, taken, timing, turn in: world/quests.js questFacts), its
     steps, its reward;
   - a story: its category and state, who it is about, the day it began, its objective (its stage's note; the quest it waits
     on: how far along, where), its stages done so far;
   - an offer: its facts and what it requires (taken at its board, or from its lord); an archive entry: how it ended, the day,
     what it paid or cost;
   and its buttons: Show on map (from the map only) (the full map centred on its goal, its bar's Back returning here: ui/map.js), Track (a quest or
   story under way; one at a time: world/quests.js QuestTrack) and, for a job only, Abandon (it asks first, its real cost:
   what giving it up costs; Give it up is q-abandon). Main and side quests show no Abandon.
   A wide window shows the two side by side; a small one (a phone on its side: QW.compact, the overlay's size, as style.css
   8d's container query) the tabs and the list, then the chosen one alone (G.qw.open), its bar's Back returning to the list.
   One opened from the Journal's Chronicle (ui/chronicle.js chronOpen) has Back to Chronicle on its bar instead (G.qw.from).
   Esc follows the bar. ---------- */
const QW={compact:{w:760,h:520},tabs:['main','side','job','past']};
// (its state: the tab, the one chosen, whether it is open on a small window, the one asking to be given up; the one the
// Chronicle opened, while it is the one chosen)
const qwState=()=>G.qw||(G.qw={tab:null,sel:null,open:false,ask:null,from:null});
// is the window small (the overlay's content box: as the container query in style.css 8d measures it)
function qwCompact(){
  const r=$('#screen').getBoundingClientRect(),s=getComputedStyle(ov),C=QW.compact;
  const w=r.width-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),h=r.height-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom);
  return w<=C.w||h<=C.h;
}
// everything the journal lists, keyed, each with its tab and state: your quests that are no story's stage, the stories under way,
// the offers you know of, the archive (newest first)
function qwItems(){
  const qs=P.quests.map(q=>Quest.as(q)).filter(q=>!q.story).map(q=>({k:'q'+q.id,q,tab:q.cat,state:q.state}));
  const ths=Thread.list().on.map(th=>({k:'t'+th.i,th,tab:th.cat,state:th.state}));
  const past=QuestArchive.list().slice().reverse().map(e=>({k:'a'+e.k,e,tab:'past',state:e.state}));
  return [...qs,...ths,...qwOffers(),...past];
}
// (the offers you know of: each board you have seen whose offers still stand, and the last lord's)
function qwOffers(){
  const out=[];
  for(const [name,j] of Object.entries(P.jobs||{}))if(Clock.daysSince(j.day)<JOB_REFRESH)j.list.forEach((q,i)=>{q=Quest.as(q);out.push({k:'o'+name+':'+i,o:q,tab:'job',state:q.state})});
  if(G.lordJob){const q=Quest.as(G.lordJob);out.push({k:'o:lord',o:q,tab:'job',state:q.state})}
  return out;
}
// (a tab's name; the tab to open on: the tracked one's, else the first with anything under way, else Jobs)
const qwTabName=t=>t==='past'?'Archive':QUEST_CATS[t].tab;
function qwTab(items){
  const S=qwState(),tk=items.find(x=>x.k===P.track),live=t=>items.some(x=>x.tab===t&&(x.q||x.th));
  if(!QW.tabs.includes(S.tab))S.tab=tk?tk.tab:['main','side','job'].find(live)||'job';
  return S.tab;
}
// (its title; a story's name and who it is about)
const qwStoryName=th=>th.title+(th.who?': '+th.who:'');
const qwTitle=it=>it.q?it.q.title:it.th?qwStoryName(it.th):it.o?it.o.title:it.e.title;
// (its state as a tag)
const qwStateTag=st=>'<span class="qw-st '+st+'">'+QUEST_STATES[st]+'</span>';
// (where a quest is reported, for "Return to X for your reward")
const qwReturnTo=q=>q.lord?q.giver+' or any '+FACS[q.fac].n+' holding':q.home;
// (an offer's unmet needs, its giver's trust among them)
const qwLacks=q=>q.needs().filter(n=>!n.met).map(n=>n.what);
// (its line under the title)
function qwSub(it){
  if(it.q)return it.state==='completed'?'Return to '+qwReturnTo(it.q)+' for your reward':it.q.progress();
  if(it.th)return it.th.note||'Under way.';
  if(it.o)return it.state==='locked'?'Requires '+qwLacks(it.o).join(' · '):'Offered by '+(it.o.lord?it.o.giver:it.o.home);
  return 'Day '+it.e.day+(it.e.got?' · '+it.e.got:'');
}
// the one chosen, still there in its tab (else the tracked one, else the first; none: null)
function qwChosen(items){
  const S=qwState(),by=k=>items.find(x=>x.k===k);
  const it=by(S.sel)||by(P.track)||items[0]||null;
  // (the chosen one gone: back to the list)
  if(!by(S.sel))S.open=false;
  S.sel=it?it.k:null;
  if(S.ask!==S.sel)S.ask=null;
  return it;
}
// ---- the tabs, each with its count (the archive's: all it keeps)
function qwTabs(all,tab){
  return '<div class="qw-tabs" role="tablist" aria-label="Quests">'+QW.tabs.map(t=>{const n=all.filter(x=>x.tab===t&&!x.o).length;
    return '<button class="btn sm'+(t===tab?' on':'')+'" type="button" role="tab" tabindex="'+(t===tab?0:-1)+'" data-act="qw-tab" data-arg="'+t+'" aria-selected="'+(t===tab)+'">'+qwTabName(t)+(n?' · '+n:'')+'</button>'}).join('')+'</div>';
}
// ---- the list: a row each (a button: choosing it opens it)
function qwRow(it,sel){
 const on=P.track===it.k,good=it.state==='completed'||it.state==='done',q=it.q||it.o,ico=it.th?'hero':it.e?'book':q?.type==='supply'?'wheat':q?.type==='courier'?'scroll':q?.type==='troops'?'troops':'power';
 return '<button class="qw-row'+(it.k===sel?' on':'')+(it.state==='locked'?' locked':'')+'" type="button" data-act="qw-sel" data-arg="'+htmlText(it.k)+'" aria-pressed="'+(it.k===sel)+'"><span class="fb-qseal">'+fbIcon(ico,24)+'</span><span><strong>'+htmlText(qwTitle(it))+(on?' <span class="qw-tag">Tracked</span>':'')+'</strong><small'+(good?' class="good"':'')+'>'+qwStateTag(it.state)+' '+htmlText(qwSub(it))+'</small></span></button>';
}
function qwList(items,tab,sel){
  const tk=items.find(x=>x.k===P.track),rest=items.filter(x=>x!==tk),mine=rest.filter(x=>!x.o),offers=rest.filter(x=>x.o);
  const none={main:'No main story yet.',side:'No side quests. Help those you meet on the road, and more may come of it.',
    job:'No jobs. Look for work on the notice board of any holding, or ask a friendly lord.',past:'Nothing done, failed or given up yet.'}[tab];
  const lab={main:'Main story',side:'Side quests',job:'Your jobs',past:'Archive · the last '+QUEST_ARCHIVE.keep}[tab];
  return '<div class="qw-list" role="group" aria-label="'+qwTabName(tab)+'">'+
    (tk?'<div class="lab">Tracked</div>'+qwRow(tk,sel):'')+
    (mine.length?'<div class="lab">'+lab+(tab==='past'?'':' · '+(mine.length+(tk?1:0)))+'</div>'+mine.map(x=>qwRow(x,sel)).join(''):tk?'':'<div class="lab">'+lab+'</div><p class="muted">'+none+'</p>')+
    (offers.length?'<div class="lab">Offered where you have been</div>'+offers.map(x=>qwRow(x,sel)).join(''):'')+'</div>';
}
// ---- the one chosen in full
const qwBtn=(act,arg,label,why,cls)=>'<button class="btn sm'+(cls?' '+cls:'')+'" type="button" data-act="'+act+'" data-arg="'+htmlText(arg)+'"'+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
const qwFacts=f=>'<dl class="qfacts">'+f.map(([k,v])=>'<dt>'+k+'</dt><dd>'+v+'</dd>').join('')+'</dl>';
// (its title, and beside it its category and state)
const qwHead=(it,title)=>'<div class="qw-head"><h3>'+title+'</h3><span class="qw-meta"><span class="qw-cat">'+QUEST_CATS[it.e?it.e.cat:it.tab].n+'</span>'+qwStateTag(it.state)+'</span></div>';
// (where it points on the map: a quest's goal, a story's stage's, an offer's giver; none: null)
function qwGoal(it){
  if(it.q)return it.q.goal();
  if(it.th)return QuestTrack.goal(it.k);
  if(it.o){const l=it.o.giverLord(),p=l&&!l.dead&&!l.gone?l:townBy(it.o.home);return p?{x:p.x,y:p.y,name:p.name}:null}
  return null;
}
// (its buttons, in its page under the objective: the window's bar is its only bottom bar)
function qwButtons(it,goal){
  const on=P.track===it.k,live=it.q||it.th;
  if(!live&&!it.o)return '';
  return '<div class="btns qw-acts">'+qwBtn('qw-map',it.k,'Show on map',goal?qwMapWhy():'It points nowhere on the map now')+
    (live?'<button class="btn sm'+(on?' on':'')+'" type="button" data-act="qw-track" data-arg="'+it.k+'" aria-pressed="'+on+'">'+(on?'Tracked':'Track')+'</button>':'')+
    (it.q&&it.q.abandonable?qwBtn('qw-abandon',it.k,'Abandon'):'')+'</div>';
}
function qwProgress(q){
 const n=q.n,have=q.type==='supply'?goodN(q.good):['hunt','troops'].includes(q.type)?q.have():null;if(!n||have==null)return '';
 return '<div class="fb-progress" role="progressbar" aria-label="Quest progress" aria-valuemin="0" aria-valuemax="'+n+'" aria-valuenow="'+Math.min(n,have)+'">'+fbIcon(q.type==='troops'?'troops':'crate',26)+'<div>'+htmlText(q.progress())+'<div class="fb-bar"><i style="width:'+Math.min(100,have/n*100)+'%"></i></div></div></div>';
}
function qwQuest(it){
 const q=it.q,f=questFacts(q),at=f.findIndex(([k])=>k==='Reward'),steps='<ol class="qw-steps">'+q.steps().map(([s,done])=>'<li'+(done?' class="good"':'')+'>'+s+'</li>').join('')+'</ol>';f.splice(at<0?f.length:at,0,['Steps',steps]);
 return qwHead(it,q.title)+'<div class="fb-qobjective">'+fbIcon(it.state==='completed'?'truce':'region',24)+'<span>'+htmlText(it.state==='completed'?'Return to '+qwReturnTo(q)+' for your reward':q.handsOver?q.aim():q.todo())+'</span></div>'+qwProgress(q)+qwButtons(it,qwGoal(it))+'<div class="fb-qfacts"><span>'+fbIcon('sun')+htmlText(q.timing())+'</span><span>'+fbIcon('region')+htmlText(q.reportLine())+'</span></div><ol class="fb-qsteps">'+q.steps().map(([v,done])=>'<li class="'+(done?'good':'')+'">'+v+'</li>').join('')+'</ol>'+fbRewards(q.reward,q.earned())+fbDetails('Details & terms','<p class="qw-text">'+q.text+'</p>'+qwFacts(f));
}
// (a story: its objective, the quest its stage waits on (how far along, where), then its stages: those done, and the one now)
function qwStory(it){
  const th=it.th,q=QuestTrack.quest(it.k),g=q&&q.goal(),now=th.current;
  const f=[['Who',th.who||'—'],['Begun','Day '+th.day],['Objective',th.note||'Under way.']];
  if(q)f.push(['Progress',q.progress()]);
  f.push(['Where',g?(g.name?g.name+', ':'')+questWay(g):'Nowhere on the map yet']);
  const done=th.stages().map(([n,how,bad])=>'<li class="'+(bad?'bad':'good')+'">'+n+(bad?' (failed)':'')+'</li>').join('');
  f.push(['Stages','<ol class="qw-steps">'+done+(now?'<li class="now">'+th.stageName(now)+'</li>':'')+'</ol>']);
  return qwHead(it,th.title)+'<div class="fb-qobjective">'+fbIcon('region',24)+'<span>'+htmlText(th.note||'Under way.')+'</span></div>'+qwButtons(it,qwGoal(it))+'<div class="fb-qfacts">'+(q?'<span>'+fbIcon('banner')+htmlText(q.progress())+'</span>':'')+'<span>'+fbIcon('region')+(g?htmlText((g.name?g.name+', ':'')+questWay(g)):'No destination yet')+'</span></div><ol class="fb-qsteps">'+done+(now?'<li class="now">'+th.stageName(now)+'</li>':'')+'</ol>'+fbDetails('Story & details',qwFacts(f));
}
// (an offer you know of: taken at its board or from its lord; locked, what it requires, its giver's trust among them)
function qwOffer(it){
 const q=it.o,s=QuestShut.of(q),where=q.lord?'Ask '+q.giver+' for it.':'Take it at the notice board of '+q.home+'.',needs=q.needs();
 return qwHead(it,q.title)+'<div class="fb-qobjective">'+fbIcon(it.state==='locked'?'prisoners':'region',24)+'<span>'+htmlText(it.state==='locked'?'Requires '+qwLacks(q).join(' · '):where)+'</span></div>'+qwButtons(it,qwGoal(it))+needs.map(n=>'<p class="'+(n.met?'good':'')+'">'+(n.met?'✓ ':'○ ')+htmlText(n.what)+'</p>').join('')+'<p>'+htmlText(where)+'</p>'+(s?'<p class="bad">'+QuestShut.line(q,s)+'.</p>':'')+fbRewards(q.reward)+fbDetails('Offer details','<p class="qw-text">'+q.text+'</p>'+qwFacts(questFacts(q)));
}
// (an archive entry: who, how it ended, the day, what it paid or cost; a story's, its last stage)
function qwPast(it){
  const e=it.e,story=e.k[0]==='t';
  const f=[[story?'Who':'Given by',e.giver||'—'],['Ended','Day '+e.day]];
  if(e.got)f.push([story?'Last stage':e.state==='done'?'Reward':'Cost',e.got]);
  return qwHead(it,e.title)+qwFacts(f);
}
/* the window's content (renderQuests), and its bar's Back (asking to give one up: Keep it; opened from the Chronicle: back to it; on a
   small window, the chosen one open: back to the list) */
function questWindow(){
  const all=qwItems(),tab=qwTab(all),items=all.filter(x=>x.tab===tab),it=qwChosen(items),S=qwState();
  S.compact=qwCompact();
  const tabs=qwTabs(all,tab);
  if(!it)return '<div class="qw">'+tabs+qwList(items,tab,null)+'</div>';
  const body=it.q?qwQuest(it):it.th?qwStory(it):it.o?qwOffer(it):qwPast(it);
  if(S.ask===it.k&&it.q?.abandonable)return '<div class="qw confirm open"><section class="qw-detail"><div class="fb-qscroll"><div class="qw-ask" role="alertdialog" aria-label="Give it up?"><h3>Give up this job?</h3><p>Give up '+it.q.title+'? It counts as abandoned: '+it.q.abandonCost()+'.</p><div class="btns">'+qwBtn('qw-keep',it.k,'Keep it','','primary')+qwBtn('q-abandon',it.q.id,'Give it up','','bad')+'</div></div></div></section></div>';
  return '<div class="qw'+(S.open?' open':'')+'">'+tabs+qwList(items,tab,it.k)+'<section class="qw-detail" aria-label="'+htmlText(it.e?it.e.title:it.th?it.th.title:qwTitle(it))+'"><div class="fb-qscroll" data-fb-scroll="journal:'+htmlText(it.k)+'">'+body+'</div></section></div>';
}
const questWindowBack=()=>{const S=qwState();return S.ask?['qw-keep',S.sel,'Back']:S.from&&S.from===S.sel?['ch-back',null,'Back to Chronicle']:S.compact&&S.open&&S.sel?['qw-list',null,'Back']:null};
// the window (Q, the Menu's Quests; opened over the map or the streets, closing back there: ui.js openOver), drawn again; Q or its
// way out closes it
function renderQuests(){
  const n=qwItems().filter(x=>x.q||x.th).length;
  fbShow('Quests',n?n+' under way':'Nothing under way','',questWindow(),fbMenu(questWindowBack()),['quests-close',null,G.overBack==='scene'?'Back to the streets':'Back to map'],'fb-quests');
}
function openQuests(){
  if(G.mode!=='quests'&&!openOver('quests',''))return false;
  renderQuests();
  return true;
}
const questsKey=()=>G.mode==='quests'?act('quests-close'):openQuests();
onAct('quests-',()=>{if(G.mode==='quests'){qwState().from=null;closeOver()}});
// Show on map (from the map only: the streets have no full map): the full map over the world, centred on its goal; its Back
// (qw-back) returns to your Quests
const qwMapWhy=()=>G.overBack==='world'?'':'Leave the streets first';
function qwShowOnMap(k){
  const it=qwItems().find(x=>x.k===k),g=it&&qwGoal(it);
  if(!g||qwMapWhy())return;
  closeOver();
  if(!fullMapOpen({x:g.x/TILE,y:g.y/TILE},['qw-back',null,'Back to Quests']))openQuests();
}
onAct('qw-',(a,arg)=>{
  const S=qwState();fbRemember();
  if(a==='qw-back'){if(G.mode==='fullmap'){closeOver();openQuests()}return}
  if(G.mode!=='quests')return;
  if(a==='qw-tab'){S.tab=arg;S.sel=null;S.open=false;S.ask=null;S.from=null}
  else if(a==='qw-sel'){S.sel=arg;S.open=true;S.ask=null;if(S.from!==arg)S.from=null}
  else if(a==='qw-list'){S.open=false;S.ask=null}
  else if(a==='qw-track')QuestTrack.set(P.track===arg?null:arg);
  else if(a==='qw-abandon')S.ask=arg;
  else if(a==='qw-keep')S.ask=null;
  else if(a==='qw-map')return qwShowOnMap(arg);
  else return;
  updateHUD(true);
  renderQuests();
  const b=a==='qw-sel'?panel.querySelector('.qw-detail .btn:not([disabled])'):a==='qw-abandon'?panel.querySelector('.qw-ask .btn'):panel.querySelector('[data-act="'+a+'"][data-arg="'+CSS.escape(arg)+'"]')||panel.querySelector('[data-act="qw-sel"].on');
  if(b){b.focus({preventScroll:true});if(a==='qw-abandon')b.scrollIntoView({block:'nearest'})}
});
// (a window turned or resized across the small window's size: drawn again, its bar with it)
addEventListener('resize',()=>{if(G.mode==='quests'&&qwState().compact!==qwCompact())renderQuests()});
