'use strict';
/* ---------- places you must earn (doc/START_AND_GATES_DESIGN.md §2; the owner, 2026-11-05: soft locks: the land stays open, places
   and people refuse you until you have earned them, "all depends on situations"): a holding's gate (Gates.admits: GATES by its
   kind, its seal) and a great lord's audience (Gates.audience: LORD_AUDIENCE). Each answers {ok, why, need: [the ways in, as
   words]}. A holding that refuses you shows its gate (Gates.showGate: the market outside its walls, or leave; with passes, bribes
   and slipping in, phase G2); a lord, his steward's word. Sealed holdings (by a quest: Gates.seal) kept in W.sealed, saved ---------- */
class Gates{
  // (open to you whatever its kind: yours, your service's, your home, a quest of yours takes you there)
  static ownWay(t){
    if(t.owner==='player'||P.fac&&t.owner===P.fac||t.name===P.home)return 'yours';
    if(P.quests.some(q=>q.home===t.name||canReportAt(q,t)))return 'quest';
    return null}
  // a holding's gate: {ok, why, need}
  static admits(t){
    if(!GATES.on)return{ok:true};
    const s=W.sealed&&W.sealed[t.name];if(s)return{ok:false,sealed:true,why:s.why,need:['what is wrong there put right']};
    if(this.ownWay(t))return{ok:true};
    const g=GATES[t.kind];if(!g)return{ok:true};
    const hon=t.owner&&FACS[t.owner]?honorWith(t.owner):0,need=[];
    if(g.renown!=null){if(P.renown>=g.renown)return{ok:true};need.push('renown '+g.renown+' (you have '+P.renown+')')}
    if(g.honor!=null&&t.owner&&FACS[t.owner]){if(hon>=g.honor)return{ok:true};need.push('honour '+g.honor+' with the '+FACS[t.owner].n+' (you have '+hon+')')}
    need.push('a quest that takes you there');
    return{ok:false,why:t.kind==='castle'?'No one enters without the lord’s leave.':'The gate-wardens look you over and send you on.',need}}
  // a lord's audience: {ok, why, need}
  static audience(l){
    const X=LORD_AUDIENCE;if(!X.on)return{ok:true};
    const lr=l.renown||0;if(lr<X.great||P.fac===l.fac)return{ok:true};
    if(P.quests.some(q=>q.lord&&q.giver===l.name||q.foeName===l.name))return{ok:true};
    const want=Math.ceil(lr*X.need),hon=honorWith(l.fac),rel=Math.round(Relations.withYou(l)),need=[];
    if(P.renown>=want)return{ok:true};need.push('renown '+want+' (you have '+P.renown+')');
    if(hon>=X.honor)return{ok:true};need.push('honour '+X.honor+' with the '+FACS[l.fac].n+' (you have '+hon+')');
    if(rel>=X.rel)return{ok:true};need.push('his regard '+X.rel+' (you have '+rel+')');
    need.push('his work, or service in his realm');
    return{ok:false,why:'“My lord does not see every sellsword who comes to the gate.”',need}}
  // a quest seals a holding (why: the words at its gate) or opens it again (why null)
  static seal(t,why,by){if(!W.sealed)W.sealed={};if(why)W.sealed[t.name]={why,by:by||null};else delete W.sealed[t.name]}
  // the gate of t, refused (g: admits)
  static showGate(t,g){
    G.gate=t;G.lastTown=t;P.tx=null;G.chase=null;G.mode='gate';const f=t.owner&&FACS[t.owner];
    showPanel('<div class="top"><h2>The gate of '+t.name+'</h2><span class="muted">'+cap1(t.label)+(f?' of the <span style="color:'+f.col+'">'+f.n+'</span>':'')+'</span></div>'+
      '<p>'+g.why+'</p>'+(g.need&&g.need.length?'<p class="muted">The way in: '+g.need.join(', or ')+'.</p>':'')+
      '<div class="btns">'+(g.sealed?'':'<button class="btn primary" type="button" data-act="gt-market">The market outside the walls</button>')+'</div>'+
      nav(null,['gt-leave',null,'Leave']));
  }
  // the steward's word: a great lord who will not see you yet (g: audience)
  static showSteward(l,g){
    G.mode='dialog';G.enc={kind:'steward',ref:l};P.tx=null;
    showPanel('<div class="top"><h2>'+lordName(l)+'’s steward</h2><span class="muted">of the '+FACS[l.fac].n+'</span></div>'+
      '<p>'+g.why+'</p><p class="muted">To be heard: '+g.need.join(', or ')+'.</p>'+nav(null,['gt-steward',null,'Leave']));
  }
}
// its pages' answers: the market outside (the holding's window with its market alone), leave
onAct('gt-',a=>{
  if(a==='gt-market'&&G.mode==='gate'&&G.gate){const t=G.gate;G.gate=null;enterTown(t);G.town.outside=true;G.town.tab='trade';renderTown();return true}
  if(a==='gt-leave'){G.gate=null;G.mode='world';hidePanel();return true}
  if(a==='gt-steward'){G.enc=null;G.mode=G.town?'town':'world';if(G.town)renderTown();else hidePanel();return true}
});
Saves.add({key:'sealed',order:360,defaults:{},save:()=>W.sealed||{},load:v=>{W.sealed=v||{}}});
