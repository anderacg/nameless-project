'use strict';
/* ---------- the quest tracker (the owner, 2026-10-30: "a quest tracking tab at the left-hand side, opposite the map, for quick
   access like RPG games"; a new quest's note "pops up below that tracking tab and disappears by itself after 5 secs, with an
   animation to show the time running out"). On the world map, under your band card (a phone: at the top left, the card hidden):
   the quests you track (world/quests.js QuestTrack.list), each its title, what to do now and which way; a click opens it in your
   Quests; the one marked on the map in gold. Each quest you take shows its note below it for QTRACK.show s, its bar running down (several taken at once: their notes stacked, at most QTRACK.stack, the oldest first; the owner, 2026-10-30): Track adds it
   to the tracker and marks it, × lets it go, as the time does. ---------- */
const QTRACK={show:5,fade:.3,gap:8,stack:3};
const QT={el:null,pops:[]};
// (a tracked one's lines: its title, what to do, the way to it)
function qtLines(k){
  const q=QuestTrack.quest(k),th=QuestTrack.thread(k),g=QuestTrack.goal(k);
  const title=th?qwStoryName(th):q?q.title:'',todo=th?th.note||'Under way.':q.state==='completed'?'Return to '+qwReturnTo(q)+' for your reward':q.handsOver?q.aim():q.todo();
  return{title,todo,way:g?questWay(g):''};
}
// (where it stands: under the band card while it shows (all of it, its lines past its box too), else at the top left)
function qtPlace(el){
  const s=document.getElementById('stats'),phone=document.getElementById('screen')?.classList.contains('mobile-world'),up=!phone&&s&&s.offsetParent&&!s.hidden&&getComputedStyle(s).display!=='none';// (a phone: the card a sheet over the bottom bar, the tracker at the top)
  el.style.top=up?s.offsetTop+Math.max(s.offsetHeight,s.scrollHeight)+QTRACK.gap+'px':'';el.style.left=up?s.offsetLeft+'px':'';
}
// each HUD tick (render.js updateHUD): drawn afresh only when what it shows has changed
function questTrackHUD(){
  let el=QT.el;const host=document.querySelector('.hudlayer');if(!host)return;
  if(!el){el=QT.el=document.createElement('aside');el.id='qtrack';el.className='qtrack';el.setAttribute('aria-label','Tracked quests');host.appendChild(el);
    el.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b){e.stopPropagation();act(b.dataset.act,b.dataset.arg)}})}
  const scr=document.getElementById('screen'),now=performance.now()/1000;QT.pops=QT.pops.filter(p=>now<p.until);const ps=QT.pops.slice(-QTRACK.stack);
  const ks=QuestTrack.list(),on=G.mode==='world'&&!G.modal&&!scr?.classList.contains('party-open')&&(ks.length||ps.length);
  el.hidden=!on;if(!on){if(el.dataset.sig){el.innerHTML='';el.dataset.sig=''}return}qtPlace(el);
  const rows=ks.map(k=>{const L=qtLines(k);return '<button type="button" class="qt-row'+(k===P.track?' on':'')+'" data-act="qt-open" data-arg="'+k+'" title="Open it in your Quests"><b>'+htmlText(L.title)+'</b><small>'+htmlText(L.todo)+'</small>'+(L.way?'<em>'+htmlText(L.way)+'</em>':'')+'</button>'}).join('');
  const going=p=>now>p.until-QTRACK.fade;
  const pop=p=>'<div class="qt-pop'+(going(p)?' going':'')+'" role="status" data-k="'+p.k+'"><span class="qt-new">New quest</span><b>'+htmlText(p.title)+'</b><div class="qt-btns"><button type="button" class="btn sm primary" data-act="qt-track" data-arg="'+p.k+'">Track</button><button type="button" class="btn sm" data-act="qt-hide" data-arg="'+p.k+'" aria-label="Not now">×</button></div><div class="qt-bar"><i style="animation-duration:'+QTRACK.show+'s"></i></div></div>';
  const html=(rows?'<div class="qt-list"><div class="qt-head">Quests</div>'+rows+'</div>':'')+(ps.length?'<div class="qt-pops">'+ps.map(pop).join('')+'</div>':''),sig=html.replace(/ going/g,'')+ps.map(p=>going(p)?'g':'').join('');
  if(el.dataset.sig===sig)return;
  // (each note's bar keeps running as the rest is drawn afresh: a note already shown is kept as it was)
  const old=new Map([...el.querySelectorAll('.qt-pop')].map(d=>[d.dataset.k,d]));el.innerHTML=html;el.dataset.sig=sig;
  for(const d of el.querySelectorAll('.qt-pop')){const o=old.get(d.dataset.k);if(o){d.replaceWith(o);o.classList.toggle('going',d.classList.contains('going'))}}
}
// a quest taken: its note (a story's step has its story's place in your Quests; one tracked already, none)
worldOn('quest:new',d=>{const q=d&&d.q;if(!q||q.story||QuestTrack.list().includes('q'+q.id))return;
  QT.pops.push({k:'q'+q.id,title:q.title,until:performance.now()/1000+QTRACK.show});if(QT.el)QT.el.dataset.sig='';if(typeof updateHUD==='function'&&WM)questTrackHUD()});
onAct('qt-',(a,arg)=>{
  if(a==='qt-track'){QuestTrack.set(arg);QT.pops=QT.pops.filter(p=>p.k!==arg)}
  else if(a==='qt-hide')QT.pops=QT.pops.filter(p=>p.k!==arg);
  else if(a==='qt-open'){const it=qwItems().find(x=>x.k===arg);if(!it||G.mode!=='world')return;const S=qwState();S.tab=it.tab;S.sel=arg;S.open=true;S.ask=null;S.from=null;openQuests()}
  questTrackHUD();
});
