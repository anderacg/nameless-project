'use strict';
/* ---------- your Quests: the Character window's Quests tab (C), a list and the one chosen in full ----------
   The list: the one you track first (under its own label), then your quests, then the Stories (the chains under way:
   story/thread.js), one row each (its title, and a line: how far along, or what to do now). Each is keyed as P.track keeps
   it: 'q' and a quest's id, 't' and a story's number. The one chosen (G.qw.sel; none: the tracked one, else the first):
   - a quest: its text, then its facts (given by, taken, timing, turn in: world/quests.js questFacts), its steps, its reward;
   - a story: who it is about, the day it began, what to do now (its step's note), where (its step quest's goal);
   and its buttons: Show on map (the full map centred on its goal, its bar's Back returning here: ui/map.js), Track (one at a
   time: world/quests.js QuestTrack) and, for a quest, Abandon (it asks first: what giving it up costs; Give it up is q-abandon).
   A wide window shows the two side by side; a small one (a phone on its side: QW.compact, the overlay's size, as style.css
   8d's container query) the list, then the chosen one alone (G.qw.open), its bar's Back returning to the list. Esc follows the
   bar. ---------- */
const QW={compact:{w:760,h:520}};
// (its state: the one chosen, whether it is open on a small window, the one asking to be given up)
const qwState=()=>G.qw||(G.qw={sel:null,open:false,ask:null});
// is the window small (the overlay's content box: as the container query in style.css 8d measures it)
function qwCompact(){
  const r=$('#screen').getBoundingClientRect(),s=getComputedStyle(ov),C=QW.compact;
  const w=r.width-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight),h=r.height-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom);
  return w<=C.w||h<=C.h;
}
// everything in the list, keyed: your quests, then the stories under way
function qwItems(){
  return [...P.quests.map(q=>({k:'q'+q.id,q:Quest.as(q)})),...Thread.list().on.map(th=>({k:'t'+th.i,th}))];
}
// (a story's name and who it is about)
const qwStoryName=th=>{const K=th.kind,who=K.who?th.param(K.who):'';return K.n+(who?': '+who:'')};
// the one chosen, still there (else the tracked one, else the first; none: null)
function qwChosen(items){
  const S=qwState(),by=k=>items.find(x=>x.k===k);
  const it=by(S.sel)||by(P.track)||items[0]||null;
  // (the chosen one gone: back to the list)
  if(!by(S.sel))S.open=false;
  S.sel=it?it.k:null;
  if(S.ask!==S.sel)S.ask=null;
  return it;
}
// ---- the list: a row each (a button: choosing it opens it)
function qwRow(it,sel){
  const on=P.track===it.k,q=it.q,th=it.th;
  const title=q?q.title:qwStoryName(th),sub=q?q.progress():th.note||'Under way.',ready=q&&(q.done||q.ready());
  return '<button class="qw-row'+(it.k===sel?' on':'')+'" type="button" data-act="qw-sel" data-arg="'+it.k+'" aria-pressed="'+(it.k===sel)+'">'+
    '<strong>'+title+(on?' <span class="qw-tag">Tracked</span>':'')+'</strong><small'+(ready?' class="good"':'')+'>'+sub+'</small></button>';
}
function qwList(items,sel){
  const tk=items.find(x=>x.k===P.track),rest=items.filter(x=>x!==tk),qs=rest.filter(x=>x.q),ths=rest.filter(x=>x.th),n=P.quests.length;
  return '<div class="qw-list" role="group" aria-label="Your quests and stories">'+
    (tk?'<div class="lab">Tracked</div>'+qwRow(tk,sel):'')+
    '<div class="lab">Quests · '+n+'</div>'+(qs.length?qs.map(x=>qwRow(x,sel)).join(''):n?'':'<p class="muted">No quests. Look for work on the notice board of any holding, or ask a friendly lord.</p>')+
    (ths.length?'<div class="lab">Stories</div>'+ths.map(x=>qwRow(x,sel)).join(''):'')+'</div>';
}
// ---- the one chosen in full
const qwBtn=(act,arg,label,why,cls)=>'<button class="btn sm'+(cls?' '+cls:'')+'" type="button" data-act="'+act+'" data-arg="'+arg+'"'+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
function qwButtons(it,goal){
  const on=P.track===it.k;
  return '<div class="btns qw-acts">'+qwBtn('qw-map',it.k,'Show on map',goal?'':'It points nowhere on the map now')+
    '<button class="btn sm'+(on?' on':'')+'" type="button" data-act="qw-track" data-arg="'+it.k+'" aria-pressed="'+on+'">'+(on?'Tracked':'Track')+'</button>'+
    (it.q?qwBtn('qw-abandon',it.k,'Abandon'):'')+'</div>';
}
function qwQuest(it){
  const q=it.q,S=qwState(),g=q.goal(),f=questFacts(q),at=f.findIndex(([k])=>k==='Reward');
  const steps='<ol class="qw-steps">'+q.steps().map(([s,done])=>'<li'+(done?' class="good"':'')+'>'+s+'</li>').join('')+'</ol>';
  f.splice(at<0?f.length:at,0,['Steps',steps]);
  const ask=S.ask===it.k?'<div class="qw-ask" role="alertdialog" aria-label="Give it up?"><p>Give up '+q.title+'? It counts as failed'+(q.abandonCost()?': '+q.abandonCost():'')+'.</p>'+
    '<div class="btns">'+qwBtn('q-abandon',q.id,'Give it up','','bad')+qwBtn('qw-keep',it.k,'Keep it')+'</div></div>':'';
  return '<h3>'+q.title+'</h3><p class="qw-text">'+q.text+'</p><dl class="qfacts">'+f.map(([k,v])=>'<dt>'+k+'</dt><dd>'+v+'</dd>').join('')+'</dl>'+qwButtons(it,g)+ask;
}
function qwStory(it){
  const th=it.th,K=th.kind,who=K.who?th.param(K.who):'',q=QuestTrack.quest(it.k),g=q&&q.goal();
  const f=[['Who',who||'—'],['Begun','Day '+th.day],['Now',th.note||'Under way.'],['Where',g?(g.name?g.name+', ':'')+questWay(g):'Nowhere on the map yet']];
  if(q)f.push(['Its step',q.title]);
  return '<h3>'+K.n+'</h3><dl class="qfacts">'+f.map(([k,v])=>'<dt>'+k+'</dt><dd>'+v+'</dd>').join('')+'</dl>'+qwButtons(it,g);
}
/* the tab: its content (character.js renderChar), and its bar's Back (on a small window, the chosen one open: back to the list) */
function questWindow(){
  const items=qwItems(),it=qwChosen(items),S=qwState();
  S.compact=qwCompact();
  if(!it)return '<div class="qw">'+qwList(items,null)+'</div>';
  return '<div class="qw'+(S.open?' open':'')+'">'+qwList(items,it.k)+'<section class="qw-detail" aria-label="'+htmlText(it.q?it.q.title:it.th.kind.n)+'">'+(it.q?qwQuest(it):qwStory(it))+'</section></div>';
}
const questWindowBack=()=>{const S=qwState();return S.compact&&S.open&&S.sel?['qw-list',null,'Back']:null};
// Show on map: the full map over the world, centred on its goal; its Back (qw-back) returns to your Quests
function qwShowOnMap(k){
  const g=QuestTrack.goal(k);
  if(!g)return;
  G.mode='world';
  hidePanel();
  if(!fullMapOpen({x:g.x/TILE,y:g.y/TILE},['qw-back',null,'Back to Quests'])){G.mode='char';renderChar()}
}
onAct('qw-',(a,arg)=>{
  const S=qwState();
  if(a==='qw-back'){if(G.mode==='fullmap'){closeOver();G.char='quests';openChar()}return}
  if(G.mode!=='char')return;
  if(a==='qw-sel'){S.sel=arg;S.open=true;S.ask=null}
  else if(a==='qw-list'){S.open=false;S.ask=null}
  else if(a==='qw-track')QuestTrack.set(P.track===arg?null:arg);
  else if(a==='qw-abandon')S.ask=arg;
  else if(a==='qw-keep')S.ask=null;
  else if(a==='qw-map')return qwShowOnMap(arg);
  else return;
  updateHUD(true);
  renderChar();
  const b=a==='qw-sel'?panel.querySelector('.qw-detail .btn:not([disabled])'):a==='qw-abandon'?panel.querySelector('.qw-ask .btn'):panel.querySelector('[data-act="'+a+'"][data-arg="'+arg+'"]')||panel.querySelector('[data-act="qw-sel"].on');
  if(b){b.focus({preventScroll:true});if(a==='qw-abandon')b.scrollIntoView({block:'nearest'})}
});
// (a window turned or resized across the small window's size: drawn again, its bar with it)
addEventListener('resize',()=>{if(G.mode==='char'&&G.char==='quests'&&qwState().compact!==qwCompact())renderChar()});
