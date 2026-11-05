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
    if(this.ownWay(t)||this.pass(t))return{ok:true};
    const g=GATES[t.kind];if(!g)return{ok:true};
    const hon=t.owner&&FACS[t.owner]?honorWith(t.owner):0,need=[];
    if(g.renown!=null){if(P.renown>=g.renown)return{ok:true};need.push('renown '+g.renown+' (you have '+P.renown+')')}
    if(g.honor!=null&&t.owner&&FACS[t.owner]){if(hon>=g.honor)return{ok:true};need.push('honour '+g.honor+' with the '+FACS[t.owner].n+' (you have '+hon+')')}
    need.push('a pass (a letter of introduction, a guild token or a writ)','a quest that takes you there');
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
  // (a pass of yours for t: a letter, a token, a writ; a bribe's or a night's for its day)
  static pass(t){const p=P.passes&&P.passes[t.name];return !!p&&(p.until==null||G.day<=p.until)}
  static give(t,kind,from,until){if(!P.passes)P.passes={};P.passes[t.name]={kind,day:G.day,...(from?{from}:{}),...(until!=null?{until}:{})}}
  // (a quest done: a reeve's or an innkeeper's work, a letter of introduction; a merchant's, a guild token; to the nearest town or
  // city that would refuse you, within GATE_WAYS.letter tiles)
  static reward(q){
    if(!GATES.on)return;const [home,role]=String(q.who||'').split(':'),h=townBy(home),kinds=role==='merchant'?['city','town']:role==='reeve'||role==='innkeeper'?['town','city']:null;if(!h||!kinds)return;
    let best=null,bd=Infinity;for(const t of TOWNS){if(!kinds.includes(t.kind)||this.admits(t).ok)continue;const d=Math.hypot(t.tx-h.tx,t.ty-h.ty)+kinds.indexOf(t.kind)*20;if(d<=GATE_WAYS.letter&&d<bd){bd=d;best=t}}
    if(!best)return;const g=q.person,kind=role==='merchant'?'token':'letter';this.give(best,kind,h.name);
    log((g?Givers.label(g):'The '+role+' of '+h.name)+' gives you '+(kind==='token'?'a guild token for the market of ':'a letter of introduction to ')+best.name+'. Its gate will open to you.','gold','story')}
  // (the odds of a way in: a bribe, a night's slip; the words for them)
  static odds(way){const X=GATE_WAYS[way],a=P.attr||{};return clamp(way==='bribe'?X.base+skill('pers')*X.pers+(a.cha||0)*X.cha:X.base+skill('scout')*X.scout+(a.agi||0)*X.agi,.05,.9)}
  static oddsWord(p){return p>=.7?'likely':p>=.45?'an even chance':p>=.25?'a long shot':'all but hopeless'}
  static barred(t){return (P.gateBan&&P.gateBan[t.name]||0)>=G.day}
  // a quest seals a holding (why: the words at its gate) or opens it again (why null)
  static seal(t,why,by){if(!W.sealed)W.sealed={};if(why)W.sealed[t.name]={why,by:by||null};else delete W.sealed[t.name]}
  // the gate of t, refused (g: admits)
  static showGate(t,g){
    G.gate=t;G.lastTown=t;P.tx=null;G.chase=null;G.mode='gate';const f=t.owner&&FACS[t.owner];
    showPanel('<div class="top"><h2>The gate of '+t.name+'</h2><span class="muted">'+cap1(t.label)+(f?' of the <span style="color:'+f.col+'">'+f.n+'</span>':'')+'</span></div>'+
      '<p>'+g.why+'</p>'+(g.need&&g.need.length?'<p class="muted">The way in: '+g.need.join(', or ')+'.</p>':'')+
      '<div class="btns">'+(g.sealed?'':'<button class="btn primary" type="button" data-act="gt-market">The market outside the walls</button>'+this.waysHtml(t))+'</div>'+
      (G.gateSay?'<p class="'+G.gateSay[0]+'">'+G.gateSay[1]+'</p>':'')+
      nav(null,['gt-leave',null,'Leave']));
  }
  // (the ways in at its gate: a writ, a bribe, a night's slip; greyed with their reason)
  static waysHtml(t){
    const W2=GATE_WAYS,b=(a,label,why,tip)=>'<button class="btn" type="button" data-act="'+a+'"'+(why?' disabled title="'+why+'"':tip?' title="'+tip+'"':'')+'>'+label+'</button>',ban=this.barred(t)&&'The wardens know your face.';
    const writ=W2.writ[t.kind],bribe=W2.bribe[t.kind],night=Clock.isNight;
    return (writ?b('gt-writ','Buy a writ · '+writ+' gold',P.gold<writ?'Not enough gold.':standingAt(t)<W2.writ.rep?'Your name is not good here.':'','A steward\u2019s writ: the gate opens to you from now on.'):'')+
      (bribe?b('gt-bribe','Bribe the warden · '+bribe+' gold · '+this.oddsWord(this.odds('bribe')),ban||(P.gold<bribe?'Not enough gold.':''),'Persuasion and Charisma help. Caught, honour and reputation are lost.'):'')+
      b('gt-slip','Slip in by night · '+this.oddsWord(this.odds('slip')),ban||(night?'':'Only after dark.'),'Scouting and Agility help. Caught, a fine, and honour and reputation lost.')}
  // a way in tried at t's gate: true when in
  static tryWay(t,a){
    const X=GATE_WAYS,R=rngOf('gates');G.gateSay=null;
    if(a==='gt-writ'){const c=X.writ[t.kind];if(!c||P.gold<c||standingAt(t)<X.writ.rep)return false;P.gold-=c;this.give(t,'writ');log('You buy a writ for '+t.name+' ('+c+' gold).','gold');return true}
    if(this.barred(t))return false;
    if(a==='gt-bribe'){const c=X.bribe[t.kind];if(!c||P.gold<c)return false;P.gold-=c;
      if(R.next()<this.odds('bribe')){this.give(t,'bribe',null,G.day);log('The warden pockets '+c+' gold and looks the other way.','gold');return true}
      if(R.next()<X.bribe.caught){if(t.owner&&FACS[t.owner])addHonor(t.owner,-X.bribe.honor,true);addRep(t.name,-X.bribe.rep,true);P.gateBan[t.name]=G.day+X.bribe.ban;G.gateSay=['bad','The warden takes your coin and calls his sergeant. You are marked as a briber (honour \u2212'+X.bribe.honor+', reputation \u2212'+X.bribe.rep+').']}
      else G.gateSay=['muted','The warden takes your coin and shrugs. Not today.'];return false}
    if(a==='gt-slip'){if(!Clock.isNight)return false;
      if(R.next()<this.odds('slip')){this.give(t,'night',null,G.day);log('You slip into '+t.name+' in the dark.','gold');return true}
      const fine=Math.floor(P.gold*X.slip.fine);P.gold-=fine;if(t.owner&&FACS[t.owner])addHonor(t.owner,-X.slip.honor,true);addRep(t.name,-X.slip.rep,true);P.gateBan[t.name]=G.day+X.slip.ban;
      G.gateSay=['bad','The watch catches you at the wall. A fine of '+fine+' gold, and they will know your face (honour \u2212'+X.slip.honor+', reputation \u2212'+X.slip.rep+').'];return false}
    return false}
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
  if((a==='gt-writ'||a==='gt-bribe'||a==='gt-slip')&&G.mode==='gate'&&G.gate){const t=G.gate;if(Gates.tryWay(t,a)){G.gate=null;G.gateSay=null;enterTown(t)}else Gates.showGate(t,Gates.admits(t));return true}
  if(a==='gt-leave'){G.gate=null;G.gateSay=null;G.mode='world';hidePanel();return true}
  if(a==='gt-steward'){G.enc=null;G.mode=G.town?'town':'world';if(G.town)renderTown();else hidePanel();return true}
});
Saves.add({key:'sealed',order:360,defaults:{},save:()=>W.sealed||{},load:v=>{W.sealed=v||{}}});
