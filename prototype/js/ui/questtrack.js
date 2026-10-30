'use strict';
/* ---------- the quest tracker (the owner, 2026-10-30: "a quest tracking tab at the left-hand side, opposite the map, for quick
   access like RPG games"; a new quest's note "pops up below that tracking tab and disappears by itself after 5 secs, with an
   animation to show the time running out"). On the world map, under your band card (a phone: at the top left, the card hidden):
   the quests you track (world/quests.js QuestTrack.list), each its title, what to do now and which way; a click opens it in your
   Quests; the one marked on the map in gold. A quest you take shows below it for QTRACK.show s, its bar running down: Track adds it
   to the tracker and marks it, × lets it go, as the time does. ---------- */
const QTRACK={show:5,fade:.3,gap:8};
const QT={el:null,pop:null};
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
  const scr=document.getElementById('screen'),now=performance.now()/1000,p=QT.pop&&now<QT.pop.until?QT.pop:null;if(!p)QT.pop=null;
  const ks=QuestTrack.list(),on=G.mode==='world'&&!G.modal&&!scr?.classList.contains('party-open')&&(ks.length||p);
  el.hidden=!on;if(!on){if(el.dataset.sig){el.innerHTML='';el.dataset.sig=''}return}qtPlace(el);
  const rows=ks.map(k=>{const L=qtLines(k);return '<button type="button" class="qt-row'+(k===P.track?' on':'')+'" data-act="qt-open" data-arg="'+k+'" title="Open it in your Quests"><b>'+htmlText(L.title)+'</b><small>'+htmlText(L.todo)+'</small>'+(L.way?'<em>'+htmlText(L.way)+'</em>':'')+'</button>'}).join('');
  const pop=p?'<div class="qt-pop'+(now>p.until-QTRACK.fade?' going':'')+'" role="status"><span class="qt-new">New quest</span><b>'+htmlText(p.title)+'</b><div class="qt-btns"><button type="button" class="btn sm primary" data-act="qt-track" data-arg="'+p.k+'">Track</button><button type="button" class="btn sm" data-act="qt-hide" aria-label="Not now">×</button></div><div class="qt-bar"><i style="animation-duration:'+QTRACK.show+'s"></i></div></div>':'';
  const html=(rows?'<div class="qt-list"><div class="qt-head">Quests</div>'+rows+'</div>':'')+pop,sig=html.replace(/ going/,'')+(p&&now>p.until-QTRACK.fade?'g':'');
  if(el.dataset.sig===sig)return;
  // (the note's bar keeps running as the rest is drawn afresh: the note itself kept when only the list changed)
  const old=el.querySelector('.qt-pop'),same=old&&p&&old.dataset.k===p.k;el.innerHTML=html;el.dataset.sig=sig;
  const fresh=el.querySelector('.qt-pop');if(fresh&&p){fresh.dataset.k=p.k;if(same){fresh.replaceWith(old);if(now>p.until-QTRACK.fade)old.classList.add('going')}}
}
// a quest taken: its note (a story's step has its story's place in your Quests; one tracked already, none)
worldOn('quest:new',d=>{const q=d&&d.q;if(!q||q.story||QuestTrack.list().includes('q'+q.id))return;
  QT.pop={k:'q'+q.id,title:q.title,until:performance.now()/1000+QTRACK.show};if(QT.el)QT.el.dataset.sig='';if(typeof updateHUD==='function'&&WM)questTrackHUD()});
onAct('qt-',(a,arg)=>{
  if(a==='qt-track'){QuestTrack.set(arg);QT.pop=null}
  else if(a==='qt-hide')QT.pop=null;
  else if(a==='qt-open'){const it=qwItems().find(x=>x.k===arg);if(!it||G.mode!=='world')return;const S=qwState();S.tab=it.tab;S.sel=arg;S.open=true;S.ask=null;S.from=null;openQuests()}
  questTrackHUD();
});
