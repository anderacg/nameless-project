'use strict';
/* ---------- conversations: talking with someone (doc/DIALOGUE_DESIGN.md; phase 1) ----------
   A Conversation is one talk with one Speaker: the speaker's face, name and standing (its head), what has been said this visit
   (lines: {who, html}, a speaker's quoted, the rest told), the replies you can give (each {act, arg, label, why, primary}: an
   action its own system already answers, as a button numbered 1-9), what else stands on the page (body: the speaker's own
   blocks, a lord's relation or job, a worker's deeds) and its bottom bar (the frame rule: nav, Back on the left, the way out on
   the right; Esc follows it). A reply may carry a note (what it does, under its label). It is drawn in the dialog (showPanel) or inside a holding's rail (estateRail).
   A Speaker wraps whoever talks: a lord (LordSpeaker), a townsperson (FolkSpeaker), a guard (GuardSpeaker), a worker
   (WorkerSpeaker); its role picks its words (data/dialogue.js DIALOGUE) and its face (TALK_PIC).
   TalkMemory: what each person remembers of you (met: the day you met, last: the day you last talked; a lord's: tried, the day
   you last tried each check; slight and threat, the day you last slighted or threatened him; temper, his manner known to you),
   saved with the world (key talk); its greeting is by it: first words, or again, or what he holds against you.
   A lord (phase 2) has a temper (TEMPERS: drawn once from the stream talk): his words by it, and the checks it makes easier or
   harder (DIALOGUE.checks: praise him, ask a favour, threaten him), each a roll with its odds read by Insight and its outcome
   shown on the button; his temper hinted in his words, named once your Insight is sharp or another lord told you of it.
   A companion (phase 3, CompanionSpeaker; their words: DIALOGUE.comps): from the Army's Role tab; greets you by approval (in
   words: apName), tells their story, what they think of your last deed they cared about, and, trusted (DIALOGUE.trust), their
   wish: their own quest (a step kind), its prize their approval and experience. Turning angry, they warn you first (core/state.js
   mood). Banter: now and then on the road two companions of yours speak (DIALOGUE.banter: once a day at most, the stream talk).
   Phase 4: your captor speaks (CaptorSpeaker: the captive's page, its choices the replies); a story's page step may name who
   speaks (its spec's who: {name, pic, sub}): the page draws their head and tells its text as theirs (story/choice.js). ---------- */
class TalkMemory{
  static all={};
  static knows(key){return !!this.all[key]?.met}
  static of(key){return this.all[key]||(this.all[key]={})}
  // (gen: the generation of your line who met them last (world/legacy.js Legacy.fallen): one met by one of your line before you
  // knows you not, your name nor your words to them, but remembers that one)
  static meet(key){const m=this.of(key);m.met??=G.day;m.last=G.day;m.gen=Legacy.fallen;return m}
  static mine(key){const m=this.all[key];return !!m?.met&&(m.gen??Legacy.fallen)===Legacy.fallen}
  static save(){return Object.keys(this.all).length?this.all:null}
  static load(v){this.all=v||{}}
}
class Speaker{
  constructor(o,t){this.o=o;this.t=t||null}
  get role(){return 'folk'}
  get key(){return this.role}
  name(){return 'Someone'}
  sub(){return ''}
  pic(){const f=TALK_PIC[this.role];return f?f(this.o,this.t):''}
  // (what stands under its name: html; its replies; the rest of the page: html)
  facts(){return ''}
  replies(){return []}
  // (its topics: {id, label, note, has}; a reply of a topic (its topic: id) is shown once that topic is opened; has: shown with none)
  topics(){return []}
  body(){return ''}
  // (its first words: by role, first meeting or again; '' says nothing)
  greet(again){const g=DIALOGUE.greet[this.role]||{},s=again?g.again:g.first;return s?this.fill(s):''}
  // (who the words are of: {he}, {his} and the like are theirs, core/pronouns.js)
  who(){return this.o}
  fill(s){return prFill(s,this.who()).replace(/\{N\}/g,this.name()).replace(/\{you\}/g,heroName()||'Stranger').replace(/\{town\}/g,this.t?.name||'').replace(/\{realm\}/g,this.realm?.()||'')}
}
class LordSpeaker extends Speaker{
  get role(){return 'lord'}
  get key(){return 'lord:'+this.o.id}
  name(){return this.o.name}
  realm(){return FACS[this.o.fac].n}
  temper(){return lordTemper(this.o)}
  knowsTemper(){return insightLv()>=2||!!TalkMemory.all[this.key]?.temper}
  sub(){const l=this.o,f=FACS[l.fac];return cap1(lordWord(l))+' of the <span style="color:'+f.col+'">'+f.n+'</span>, leading '+l.troops.length+' soldiers (power '+l.power()+' vs your '+partyPower()+')'+(this.knowsTemper()?', '+this.temper():'')}
  // (his first words: what he holds against you first (a threat a month, a slight a week), else by his temper)
  greet(again){const m=TalkMemory.mine(this.key)?TalkMemory.all[this.key]:{},G0=DIALOGUE.greet.lord,g=G0[this.temper()]||G0;
    return this.fill(m.threat!=null&&G.day-m.threat<=30?G0.threatened:m.slight!=null&&G.day-m.slight<=7?G0.slighted:again?g.again:g.first)}
  // ---- what he remembers and tells you as you meet (DIALOGUE.remember): the first few that hold, each said once (m.said)
  remarks(){const l=this.o,D=DIALOGUE.remember,m=TalkMemory.of(this.key),said=m.said??=[],out=[],R=Relations,v=relWith(l),days=n=>n<=0?'today':n===1?'yesterday':n+' days ago';
    const add=(k,line)=>{if(out.length>=D.most||!line||said.includes(k))return;said.push(k);out.push(this.fill(line))},sub=(t,o)=>t.replace(/\{(\w+)\}/g,(x,k)=>o[k]!=null?o[k]:x);
    // (your line: the last of it he met, fallen since; kin of that one, or a stranger under their banner)
    const L=Legacy.line.find(r=>m.met&&m.gen!=null&&r.n===m.gen+1);
    if(L&&m.gen<Legacy.fallen){const P0=pr(L.g||null);add('line:'+L.n,sub(Legacy.kin?.rel&&Legacy.kin.of===L.n?D.kin:D.stranger,{who:htmlText(L.who),them:P0.him,they:P0.he,by:htmlText(L.by)}))}
    if(DEATH.on&&l.house){const h=Houses.byId(l.house);if(h){const close=v>=DEATH.house.tell,gr=h.grudged()&&h.grudge;
      if(gr)add('grudge:'+gr.day,sub(gr.half?D.kinGrudge:D.grudge,{name:htmlText(gr.name)}));
      const d=h.buried.filter(x=>G.day-x.day<=D.days&&!(gr&&x.name===gr.name)).pop();
      if(d)add('mourn:'+d.id,close?sub(D.mourn,{name:htmlText(d.name),ago:days(G.day-d.day),How:cap1(htmlText(d.how))}):D.mournVague);
      const kid=h.kinLive.filter(k=>!k.inlaw&&k.born!=null&&G.day-k.born<=D.days&&G.day>=k.born).pop(),wed=h.kinLive.filter(k=>k.inlaw&&k.wed!=null&&G.day-k.wed<=D.days).pop();
      if(kid){add('born:'+kid.id,close?sub(D.born,{child:kid.gender==='f'?'daughter':'son',ago:days(G.day-kid.born),name:htmlText(kid.name)}):D.bornVague);if(close)h.learn([kid.id])}
      if(wed){const to=h.person(wed.spouse);add('wed:'+wed.id,close&&to?sub(D.wed,{name:htmlText(to.name),spouse:htmlText(wed.name)}):D.wedVague);if(close)h.learn([wed.id])}
      const pre=l.succeeded&&h.dead.find(x=>x.id===l.succeeded);if(pre&&G.day-pre.day<=D.deed)add('rose:'+pre.id,sub(D.rose,{name:htmlText(pre.name),they:pr(pre).he}))}}
    // (your last deed toward him, in his words: "you let them go" his "you let me go"; none naming a lord you do not know, nor what
    // you said to him this visit (a check's), nor the grudge he named already)
    const w=(P.lrelWhy||{})[l.id]?.slice(-1)[0];
    const gr0=DEATH.on&&l.house&&Houses.byId(l.house)?.grudged()&&Houses.byId(l.house).grudge;
    if(w&&G.day-w.d<=D.deed&&!/^what you said/.test(w.why)&&!(gr0&&w.why.includes(gr0.name))&&!W.lords.some(o=>o!==l&&!KNOWLEDGE.knowsLord(o)&&w.why.includes(o.name))){const why=w.why.replace(/\bthem\b/g,'me').replace(/\btheir\b/g,'my').replace(/\bthey\b/g,'I').replace(/\bto (him|her)\b/g,'to me');
      add('deed:'+w.d+':'+w.why,sub(w.n>0?D.good:D.bad,{why,Why:cap1(why)}))}
    // (the war his realm is in: yours too, a foe you share, or his alone; once a month (D.month) at most; your name once to each of your line)
    const foes=FIDS.filter(f=>f!==l.fac&&!W.dead[f]&&atWar(l.fac,f));
    if(foes.length&&!hostileTo(l.fac)){const foe=foes.find(f=>P.fac&&P.fac!==l.fac&&atWar(P.fac,f))||foes[0],F=FACS[foe].n;
      add('war:'+foe+':'+Math.floor(G.day/D.month),sub(P.fac===l.fac?D.ally:P.fac&&atWar(P.fac,foe)?D.shared:D.war,{realm:htmlText(FACS[l.fac].n),foe:htmlText(F)}))}
    if(!TalkMemory.mine(this.key)&&P.renown>=D.known)add('name:'+Legacy.fallen,P.renown>=D.famed?D.famed:D.known);
    if(said.length>D.keep)m.said=said.slice(-D.keep);return out}
  // ---- the checks: why not now ('' free; false: not offered), the odds, the outcome won or lost
  checkWhy(id){const l=this.o,m=TalkMemory.mine(this.key)?TalkMemory.all[this.key]:{},v=relWith(l);
    if(id==='follow'){const w=Host.askWhy(l);if(w!=='')return w===false?false:w}
    if(id==='threaten'&&P.fac===l.fac)return false;if(id==='favour'&&v>=RELATION.troopsAt)return false;
    if(m.tried?.[id]===G.day)return 'Not again today';if(id==='favour')return v<0?pr(l).He+' does not like you enough':lendWhy(l);
    if(id==='threaten'&&partyPower()<l.power())return 'Your army is weaker';return ''}
  // (a way to put it: why not ('' free), its need: his liking Warm, or your army the stronger)
  wayWhy(w){const n=DIALOGUE.ways[w]?.need;return n==='warm'&&relWith(this.o)<10?pr(this.o).He+' is not warm enough to you':n==='power'&&partyPower()<this.o.power()?'Your army is weaker':''}
  // (the odds of an aim, put one way (w; none: the aim's own manner))
  odds(id,w){const C=DIALOGUE.checks,X=C[id],l=this.o,pw=Math.max(0,partyPower()/Math.max(1,l.power())-1),T=w?DIALOGUE.ways[w].temper:X.temper;
    return clamp(X.base+skill('pers')*(X.pers||0)+P.renown*(X.renown||0)+honorWith(l.fac)*(X.honor||0)+relWith(l)*(X.rel||0)+Math.min(1,pw)*(X.power||0)+(T[this.temper()]||0)+(has('silver')?CAPTIVITY.traits.silver:0),C.min,C.max)}
  // (what you bring to it yourself, your words, name and tongue: the die's bonus, ui/dice.js)
  mine(id){const X=DIALOGUE.checks[id];return skill('pers')*(X.pers||0)+P.renown*(X.renown||0)+(has('silver')?CAPTIVITY.traits.silver:0)}
  // (won (true), won in part ('part'), lost (false): its outcome; a part's lend and days are done by act)
  outcome(id,won){const X=DIALOGUE.checks[id],o=won==='part'?X.part:won?X.win:X.lose,l=this.o,out={};if(!o)return out;
    if(o.gold)out.gold=Math.min(o.gold,treas(l.fac));if(o.rel)out.rel=[l,o.rel,'what you said to '+pr(l).him];if(o.honor)out.honor=[l.fac,o.honor];return out}
  // (the ways open for an aim, the one his manner suits best first marked: by Insight (rough), or his manner known)
  ways(id){return (DIALOGUE.checks[id].ways||[]).filter(w=>DIALOGUE.ways[w])}
  best(id){const t=this.temper();return this.ways(id).filter(w=>!this.wayWhy(w)).sort((a,b)=>(DIALOGUE.ways[b].temper[t]||0)-(DIALOGUE.ways[a].temper[t]||0))[0]}
  // (his topics: talk (news, other lords, his house), ask (his soldiers, his company), sway (praise or threaten), work (his job, the board's))
  topics(){const l=this.o;return [{id:'talk',label:'Talk with '+pr(l).him},{id:'ask',label:'Ask '+pr(l).him+' for something'},{id:'sway',label:'Sway '+pr(l).him},
    {id:'work',label:'Work',has:!!lordJobHtml(l),note:'What '+pr(l).he+' would have you do'}]}
  replies(){const l=this.o,C=DIALOGUE.checks;
    return [{act:'lr-rumours',arg:l.id,label:'Ask for rumours',short:'rumours',topic:'talk'},{act:'lr-lords',arg:l.id,label:'Ask about other lords',short:'other lords',topic:'talk'},
      // (his house, the rule on: told only to a close friend, world/lineage.js LordHouse#tell)
      ...(DEATH.on?[{act:'lr-house',arg:l.id,label:'Tell me of your house',short:pr(l).his+' house',topic:'talk',why:LordHouse.of(l).tellWhy(l)}]:[]),
      ...this.aims(),
      ...(this.cv?.aim?[]:relReplies(l)),...Questbook.replies(l).map(r=>({...r,topic:'work'}))]}
  aimLabel(id){return this.fill(DIALOGUE.checks[id].label)}
  // (what you can try to win of him (an aim: praise him, his soldiers, his company, tribute); an aim open (cv.aim), its ways instead)
  aims(){const l=this.o,C=DIALOGUE.checks,cv=this.cv,topicOf=id=>id==='flatter'||id==='threaten'?'sway':'ask';
    if(cv?.aim&&C[cv.aim]){const id=cv.aim,best=this.best(id),hint=insightLv()>=1||this.knowsTemper(),why=this.checkWhy(id);
      return this.ways(id).map(w=>({act:'talk-way_'+w,arg:l.id,label:this.fill(DIALOGUE.ways[w].label),odds:this.odds(id,w),topic:topicOf(id),why:why||this.wayWhy(w),
        note:hint&&w===best?'suits '+pr(l).his+' manner':''}))}
    return ['flatter','favour','threaten','follow'].map(id=>{const why=this.checkWhy(id);if(why===false)return null;const win=Outcome.describe(this.outcome(id,true)),part=Outcome.describe(this.outcome(id,'part')),lose=Outcome.describe(this.outcome(id,false));
      const won=id==='favour'?RELATION.troops+' soldiers':id==='follow'?pr(l).he+' follows you for some days':win;
      return {act:'talk-'+id,arg:l.id,label:this.fill(C[id].label),topic:topicOf(id),short:this.fill(C[id].short||C[id].label),
        note:won+' / in part: '+(id==='favour'?C[id].part.lend+' soldiers':id==='follow'?C[id].part.days+' days':part)+(lose?' / failing: '+lose:''),why:why||(this.ways(id).every(w=>this.wayWhy(w))?this.wayWhy(this.ways(id)[0]):'')}})}
  /* an aim chosen: with more than one way open, its ways to choose from (cv.aim); one way (or a way chosen: way_<w>), tried: your
     words, the roll (the stream talk), his answer by temper (won, in part, lost), what came of it; remembered (once a day each) */
  act(id,cv){const l=this.o;if(id.startsWith('way_'))return this.attempt(cv.aim,id.slice(4),cv);const X=DIALOGUE.checks[id];if(!X||this.checkWhy(id))return;
    const open=this.ways(id).filter(w=>!this.wayWhy(w));if(open.length>1){cv.aim=id;return cv.reshow()}if(!open.length&&this.ways(id).length)return cv.reshow();return this.attempt(id,open[0]||null,cv)}
  attempt(id,w,cv){const l=this.o,X=DIALOGUE.checks[id];cv.aim=null;if(!X||this.checkWhy(id)||w&&this.wayWhy(w))return cv.reshow();const m=TalkMemory.meet(this.key);(m.tried||(m.tried={}))[id]=G.day;
    // (your words: what you ask (none for his regard: the way is the asking), then the way you put it)
    const W0=w&&DIALOGUE.ways[w],me=heroName()||'You';if(!(w&&X.ways.length>1)||X.ask)cv.say(this.fill(X.ask||X.you),false,me);if(w&&X.ways.length>1)cv.say(this.fill(W0.you),false,me);
    const p=this.odds(id,w),r=rngOf('talk').next(),won=r<p?true:r<p+DIALOGUE.part?'part':false,words=won==='part'?X.half:won?X.yes:X.no;train('pers',won?3:1);
    // (the roll shown as it falls: ui/dice.js)
    Dice.show({p,r,part:DIALOGUE.part,bonus:this.mine(id),label:this.fill(X.label)+(w&&X.ways.length>1?': '+this.fill(W0.label):'')});
    cv.say(this.fill(words[this.temper()]||words.plain));const o=this.outcome(id,won);
    // (a way's cost whatever comes of it: leaning on him for what is not tribute, his liking)
    if(W0?.cost&&id!=='threaten')o.rel=[l,(o.rel?.[1]||0)+W0.cost,'you leaned on them'];
    if(won&&id==='favour'){const got=lordLend(l,won==='part'?X.part.lend:undefined);cv.say(l.name+' lends you '+got.join(', ')+'.',true)}
    if(won&&id==='follow'){const n=Host.lead(l,won==='part'?X.part.days:undefined);cv.say(l.name+' will follow you for '+n+' days.',true)}// (his place in your host: world/hosts.js)
    if(o.gold)W.treas[l.fac]=Math.max(0,treas(l.fac)-o.gold);Outcome.apply(o,{});const d=Outcome.describe(o);if(d)cv.say('<span class="muted">'+d+'</span>',true);
    if(id==='threaten')m.threat=G.day;else if(!won&&id!=='follow')m.slight=G.day;updateHUD(true);lordMeet(l)}
  facts(){const l=this.o,f=FACS[l.fac],st=hostileTo(l.fac)?'Your realms are at odds, but '+l.name+' will not draw on a friend.':P.fac===l.fac?'You serve the '+f.n+'.':P.fac?'Your employer is at '+(relOf(P.fac,l.fac).s==='ally'?'alliance':'peace')+' with them.':'They have no quarrel with you.';
    return '<p class="muted">Level '+lordStats(l).lv+', renown '+(l.renown||0)+', Leadership '+Math.round(lordSkill(l,'lead')*PROF.per)+', Tactics '+Math.round(lordSkill(l,'tact')*PROF.per)+', Medicine '+Math.round(lordSkill(l,'med')*PROF.per)+', leads up to '+lcapOf(l)+'.</p><p>'+st+'</p>'}
  // (the page under the replies: his standing toward you and the way to attack him; in his Work, his job; in another topic, none)
  body(talk){const l=this.o,f=FACS[l.fac],free=P.fac===l.fac||l.inside,tp=talk?.cv?.topic;if(tp)return tp==='work'?lordJobHtml(l):'';
    return relHtml(l,!talk?.lords)+(l.inside?'<p class="muted">Holding court in '+l.inside+', with '+l.troops.length+' soldiers quartered alongside the garrison.</p>':'')+
      '<div class="btns">'+(free?'':'<button class="btn" type="button" data-act="lord-attack">Attack</button>')+'</div>'+(free?'':'<p class="muted">Attacking makes the '+f.n+' hostile to you for 20 days.</p>')}
}
class FolkSpeaker extends Speaker{
  get key(){return 'folk:'+(this.t?.name||'')}
  name(){return this.o?.name||'A townsperson'}
}
class GuardSpeaker extends Speaker{
  get role(){return 'guard'}
  get key(){return 'guard:'+(this.t?.name||'')}
  name(){return 'Guard'}
}
class WorkerSpeaker extends Speaker{
  get role(){return 'worker'}
  get key(){return 'worker:'+this.o.id}
  name(){return cap1(an(this.o.job))+' of '+this.t.name}
  sub(){return this.t.owner?'Subject of the '+FACS[this.t.owner].n:''}
}
class CompanionSpeaker extends Speaker{
  get role(){return 'companion'}
  get key(){return 'comp:'+this.o}
  get c(){return compInit(this.o)}
  get D(){return DIALOGUE.comps[this.o]||{}}
  name(){return COMPS[this.o].n}
  sub(){const a=this.c.ap;return 'Companion, <span title="Approval '+a+' (from −10 to 10)">'+apName(a)+'</span>'}
  greet(){const g=this.D.greet;return g?g[apName(this.c.ap).toLowerCase()]||'':''}
  // (what they think: of the last deed they cared about, liked or not; none, by how they feel)
  thinks(){const d=this.c.deed,F=DIALOGUE.feel;return (d&&F[d[0]]?.[d[1]>0?'good':'bad'])||F.none[apName(this.c.ap).toLowerCase()]}
  wishWhy(){const D=this.D,c=this.c;if(!D.wish)return false;if(c.wish)return c.wish==='asked'&&P.quests.some(q=>q.wish===this.o)?'You are helping already':false;return ''}
  replies(){const id=this.o,w=this.wishWhy();return [{act:'talk-about',arg:id,label:'Tell me about yourself'},{act:'talk-think',arg:id,label:'How do you think we are doing?'},
    w!==false&&{act:'talk-wish',arg:id,label:'Is there anything you want?',why:w},...Questbook.compReplies(id)]}
  act(k,cv){const D=this.D,c=this.c;
    if(k==='about'){cv.say('Tell me about yourself.',false,heroName()||'You').say(D.about||'There is not much to tell.')}
    if(k==='think'){cv.say('How do you think we are doing?',false,heroName()||'You').say(this.thinks())}
    if(k==='wish'&&this.wishWhy()===''){cv.say('Is there anything you want?',false,heroName()||'You');
      if(c.ap<DIALOGUE.trust)cv.say('Ask me again when I know you better.');
      else{const q=this.wishQuest();if(q){c.wish='asked';cv.say(D.wish.ask).say('<span class="muted">New quest: '+q.title+'.</span>',true)}else cv.say('Not now. Ask me another time.')}}
    this.show(cv)}
  // (their quest: its place by its kind (a hideout near their home, the hungriest holding near you, the farthest one), its spec)
  wishQuest(){const W0=this.D.wish,home=townBy(COMPS[this.o].town)||Spatial.nearestHolding(P.x,P.y),s={...W0.spec};
    if(W0.kind==='lair')s.near=home;
    if(W0.kind==='deliver'){const t=TOWNS.filter(t=>!hostileTo(t.owner)).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y)).slice(0,5).sort((a,b)=>a.pros-b.pros)[0];if(!t)return null;s.to={town:t.name};s.text='Bring grain and cloth to the hungry of '+t.name+', with Elske.'}
    if(W0.kind==='visit'){const t=TOWNS.slice().sort((a,b)=>Math.hypot(b.x-P.x,b.y-P.y)-Math.hypot(a.x-P.x,a.y-P.y))[0];if(!t)return null;s.to={town:t.name};s.text='Take '+COMPS[this.o].short+' to '+t.name+', the farthest holding there is.'}
    const q=Quest.make(W0.kind,home,null,s);if(!q)return null;q.wish=this.o;return q.accept()?q:null}
  show(cv){cv.show({close:['talk-back',null,'Back to the army']})}
}
// your captor (phase 4; world/captivity.js Captivity.open): their chief, the lord himself, the realm's captain or the broker; the
// page's choices its replies (Captivity.replies)
class CaptorSpeaker extends Speaker{
  get role(){return 'captor'}
  get key(){return 'captor:'+(this.o.id??this.o.town??this.o.fac??this.o.k)}
  get lord(){return Captivity.lord(this.o)}
  who(){return this.lord}
  name(){const c=this.o;return this.lord?.name||(c.k==='broker'?cap1(c.name):c.k==='band'?'Their chief':'Their captain')}
  sub(){const c=this.o;return c.k==='broker'?'Holds you, bought from your captors':'Holds you: '+c.name}
  pic(){return this.lord?TALK_PIC.lord(this.lord):TALK_PIC.captor(this.o)}
  greet(){return this.fill(DIALOGUE.captor[this.o.took?'robbed':this.o.k]||'')}
  facts(){return Captivity.facts(this.o)}
  replies(){return Captivity.replies(this.o)}
}
class Conversation{
  // (a new talk: its greeting first, by what they remember of you, and what else they remember (remarks); then they remember you)
  constructor(sp){this.sp=sp;sp.cv=this;this.lines=[];const g=sp.greet(TalkMemory.mine(sp.key));if(g)this.say(g);for(const r of sp.remarks?.()||[])this.say(r);TalkMemory.meet(sp.key)}
  // (a line: quoted, the speaker's; told (who null), as it is)
  say(html,told=false,who=null){if(html)this.lines.push({who:told?null:who||this.sp.name(),you:!!who,html});return this}
  // the page's parts: head (face, name, standing), what was said, the replies (numbered), the speaker's own blocks
  head(){return Conversation.headOf({pic:this.sp.pic(),name:this.sp.name(),sub:this.sp.sub()})}
  // (a speaker's head: face, name and standing; a story's page with someone speaking draws one too: story/choice.js ChoicePage)
  static headOf(w){return '<div class="talk-head">'+(w.pic?'<img class="talk-pic" src="'+w.pic+'" alt="">':'')+'<div class="talk-who"><h2>'+htmlText(w.name)+'</h2>'+(w.sub?'<span class="muted">'+w.sub+'</span>':'')+'</div></div>'}
  said(){return this.lines.length?'<div class="talk-lines">'+this.lines.slice(-TALK.lines).map(l=>l.who?'<p class="talk-line'+(l.you?' you':'')+'"><b>'+htmlText(l.who)+'</b> &ldquo;'+l.html+'&rdquo;</p>':'<div class="talk-told">'+l.html+'</div>').join('')+'</div>':''}
  /* the replies shown: an open topic's (its bar's Back to the rest: show), else those of no topic and one button for each
     topic; numbered, as keys; those that cannot be chosen now folded into one line under them, each with why. A reply's odds
     (odds: a chance) a small chip by its label, read by Insight */
  answers(rs){rs=rs.filter(Boolean);const T=this.sp.topics(),tp=T.find(x=>x.id===this.topic),ofT=r=>T.some(x=>x.id===r.topic);
    let shown=tp?rs.filter(r=>r.topic===tp.id):rs.filter(r=>!ofT(r));
    if(!tp)shown=[...T.map(x=>{const of=rs.filter(r=>r.topic===x.id),free=of.filter(r=>!r.why);if(!of.length&&!x.has)return null;
      return {act:'talk-topic',arg:x.id,label:x.label,note:x.note||free.map(r=>r.short||r.label).join(', '),why:free.length||x.has?'':of.map(r=>r.why)[0]}}).filter(Boolean),...shown];
    const can=shown.filter(r=>!r.why),cant=shown.filter(r=>r.why);
    const btn=(r,i)=>'<button class="btn talk-r'+(r.primary?' primary':'')+(r.back?' talk-back':'')+'" type="button" data-act="'+r.act+'"'+(r.arg!=null?' data-arg="'+r.arg+'"':'')+(i<9?' data-key="'+(i+1)+'"':'')+'>'+
      (i<9?'<b class="talk-k">'+(i+1)+'</b>':'')+'<span class="talk-l">'+r.label+(r.odds!=null?Conversation.odds(r.odds):'')+'</span>'+(r.note?'<small class="talk-out">'+r.note+'</small>':'')+'</button>';
    return (tp?'<div class="lab talk-topic">'+tp.label+(this.aim&&this.sp.aimLabel?', '+this.sp.aimLabel(this.aim):'')+'</div>':'')+(can.length?'<div class="btns talk-replies">'+can.map(btn).join('')+'</div>':'')+
      (cant.length?'<p class="talk-not">Not now: '+cant.map(r=>'<span>'+r.label+' <i>('+r.why+')</i></span>').join(', ')+'</p>':'')}
  // (a chance, as Insight reads it: ? (none), likely or a long chance (rough), its number (sharp))
  static odds(p){const l=insightLv(),w=['odds?',p>=.5?'likely':'a long chance',Math.round(p*100)+'%'][l];
    return '<span class="talk-odds'+(l?(p>=.5?' good':' bad'):'')+'" title="'+(l===2?'Your odds':'Scouting '+(l?INSIGHT.exact:INSIGHT.rough)+' to know your odds better')+'">'+w+'</span>'}
  html(o={}){return '<div class="talk">'+(o.head===false?'':this.head())+this.sp.facts()+this.said()+this.answers(this.sp.replies())+(o.body??'')+'</div>'}
  // shown: in the dialog, or in a holding's rail ({rail: [from, tab, key]}); close (and back) its bottom bar's
  show(o){Conversation.now=this;this.last=o;if(o.rail){const [from,tab,k]=o.rail;estateRail(from,tab,{title:this.sp.name(),sub:this.sp.sub(),body:this.html({...o,head:false}),back:this.backTo()||o.back,close:o.close},k);return}
    showPanel(this.html(o)+nav(this.backTo()||o.back||null,o.close))}
  // (its bar's Back: an aim's ways back to its topic, a topic back to the rest; none: the page's own)
  backTo(){return this.aim?['talk-topic',this.topic,'Back']:this.topic?['talk-topic','','Back']:null}
  // (drawn again as it stands: its own way (again: a lord's audience), else as last shown)
  reshow(){if(this.again)return this.again();if(this.last)this.show(this.last)}
  // a number key: that reply, on the conversation shown (input.js)
  static key(k){if(ov.hidden)return false;const b=panel.querySelector('.talk-replies [data-key="'+k+'"]');if(!b||b.disabled)return false;act(b.dataset.act,b.dataset.arg);return true}
  static save(){return TalkMemory.save()}
}
const TALK={lines:6};
onWorld(()=>{TalkMemory.all={};Conversation.now=null});
// the talks' own actions: a companion's, opened from the Army (talk-comp) and closed back to it (talk-back); a lord's check or a
// companion's topic, on the talk shown with them (their Speaker's act)
onAct('talk-',(a,arg)=>{
  if(a==='talk-topic'){const cv=Conversation.now;if(!cv||ov.hidden)return;cv.topic=arg||null;cv.aim=null;cv.reshow();return}
  if(a==='talk-comp'){if(!P.comps[arg]||P.comps[arg].jail||!['char','dialog'].includes(G.mode))return;G.mode='dialog';const sp=new CompanionSpeaker(arg);sp.show(new Conversation(sp));return}
  if(a==='talk-back'){hidePanel();G.mode='world';openChar();return}
  const cv=Conversation.now,sp=cv?.sp;
  if(sp instanceof CompanionSpeaker){if(sp.o===arg&&P.comps[arg])sp.act(a.slice(5),cv);return}
  if(!(sp instanceof LordSpeaker)||String(sp.o.id)!==String(arg)||G.enc?.kind!=='lord'||G.enc.ref!==sp.o||sp.o.dead)return;sp.act(a.slice(5),cv)});
// banter: an hour on the road (not in a holding, nor held), once a day at most, two companions of yours speak (DIALOGUE.banter)
const Banter={hour(){const m=TalkMemory.of('banter'),here=compsInBand();if(m.day===G.day||here.length<2||P.stay||G.town||Captivity.held||G.mode!=='world')return;
    const R=rngOf('talk');if(!R.chance(DIALOGUE.banterDay/12))return;const ok=DIALOGUE.banter.filter(b=>here.includes(b.a)&&here.includes(b.b));if(!ok.length)return;
    const b=R.pick(ok);m.day=G.day;log(COMPS[b.a].short+': “'+b.lines[0]+'” '+COMPS[b.b].short+': “'+b.lines[1]+'”','','band')}};
Systems.add({name:'banter',order:{hour:170},hour:()=>Banter.hour()});
Saves.add({key:'talk',order:340,defaults:null,save:()=>TalkMemory.save(),load:v=>TalkMemory.load(v)});
