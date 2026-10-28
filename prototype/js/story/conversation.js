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
   shown on the button; his temper hinted in his words, named once your Insight is sharp or another lord told you of it. ---------- */
class TalkMemory{
  static all={};
  static knows(key){return !!this.all[key]?.met}
  static of(key){return this.all[key]||(this.all[key]={})}
  static meet(key){const m=this.of(key);m.met??=G.day;m.last=G.day;return m}
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
  body(){return ''}
  // (its first words: by role, first meeting or again; '' says nothing)
  greet(again){const g=DIALOGUE.greet[this.role]||{},s=again?g.again:g.first;return s?this.fill(s):''}
  fill(s){return s.replace(/\{N\}/g,this.name()).replace(/\{you\}/g,heroName()||'Stranger').replace(/\{town\}/g,this.t?.name||'').replace(/\{realm\}/g,this.realm?.()||'')}
}
class LordSpeaker extends Speaker{
  get role(){return 'lord'}
  get key(){return 'lord:'+this.o.id}
  name(){return this.o.name}
  realm(){return FACS[this.o.fac].n}
  temper(){return this.o.temper||(this.o.temper=rngOf('talk').pick(TEMPERS))}
  knowsTemper(){return insightLv()>=2||!!TalkMemory.all[this.key]?.temper}
  sub(){const l=this.o,f=FACS[l.fac];return 'Lord of the <span style="color:'+f.col+'">'+f.n+'</span>, leading '+l.troops.length+' soldiers (power '+l.power()+' vs your '+partyPower()+')'+(this.knowsTemper()?' · '+this.temper():'')}
  // (his first words: what he holds against you first (a threat a month, a slight a week), else by his temper)
  greet(again){const m=TalkMemory.all[this.key]||{},G0=DIALOGUE.greet.lord,g=G0[this.temper()]||G0;
    return this.fill(m.threat!=null&&G.day-m.threat<=30?G0.threatened:m.slight!=null&&G.day-m.slight<=7?G0.slighted:again?g.again:g.first)}
  // ---- the checks: why not now ('' free; false: not offered), the odds, the outcome won or lost
  checkWhy(id){const l=this.o,m=TalkMemory.all[this.key]||{},v=relWith(l);
    if(id==='threaten'&&P.fac===l.fac)return false;if(id==='favour'&&v>=RELATION.troopsAt)return false;
    if(m.tried?.[id]===G.day)return 'Not again today';if(id==='favour')return v<0?'He does not like you enough':lendWhy(l);
    if(id==='threaten'&&partyPower()<l.power())return 'Your army is weaker';return ''}
  odds(id){const C=DIALOGUE.checks,X=C[id],l=this.o,pw=Math.max(0,partyPower()/Math.max(1,l.power())-1);
    return clamp(X.base+(P.attr?.cha||0)*(X.cha||0)+skill('pers')*(X.pers||0)+P.renown*(X.renown||0)+honorWith(l.fac)*(X.honor||0)+Math.min(1,pw)*(X.power||0)+(X.temper[this.temper()]||0)+(has('silver')?CAPTIVITY.traits.silver:0),C.min,C.max)}
  outcome(id,won){const X=DIALOGUE.checks[id],o=won?X.win:X.lose,l=this.o,out={};if(!o)return out;
    if(o.gold)out.gold=Math.min(o.gold,treas(l.fac));if(o.rel)out.rel=[l,o.rel,'what you said to him'];if(o.honor)out.honor=[l.fac,o.honor];return out}
  replies(){const l=this.o,C=DIALOGUE.checks,read=p=>insight(['you cannot tell your odds',p>=.5?'he may well':'a long chance','about '+Math.round(p*100)+'%'],'know the odds');
    return [{act:'lr-rumours',arg:l.id,label:'Ask for rumours'},{act:'lr-lords',arg:l.id,label:'Ask about other lords'},
      ...['flatter','favour','threaten'].map(id=>{const why=this.checkWhy(id);if(why===false)return null;const win=Outcome.describe(this.outcome(id,true)),lose=Outcome.describe(this.outcome(id,false));
        return {act:'talk-'+id,arg:l.id,label:C[id].label+' · '+read(this.odds(id)),note:(id==='favour'?RELATION.troops+' soldiers':win)+(lose?' / failing: '+lose:''),why}})]}
  // a check tried: your words, the roll (the stream talk), his answer by temper, what came of it; remembered
  act(id,cv){const l=this.o,X=DIALOGUE.checks[id];if(!X||this.checkWhy(id))return;const m=TalkMemory.meet(this.key);(m.tried||(m.tried={}))[id]=G.day;
    cv.say(X.you,false,heroName()||'You');const won=rngOf('talk').chance(this.odds(id)),o=this.outcome(id,won),words=won?X.yes:X.no;train('pers',won?3:1);
    cv.say(this.fill(words[this.temper()]||words.plain));
    if(won&&id==='favour'){const got=lordLend(l);cv.say(l.name+' lends you '+got.join(', ')+'.',true)}
    if(o.gold)W.treas[l.fac]=Math.max(0,treas(l.fac)-o.gold);Outcome.apply(o,{});const d=Outcome.describe(o);if(d)cv.say('<span class="muted">'+d+'</span>',true);
    if(id==='threaten')m.threat=G.day;else if(!won)m.slight=G.day;updateHUD(true);lordMeet(l)}
  facts(){const l=this.o,f=FACS[l.fac],st=hostileTo(l.fac)?'Your realms are at odds, but '+l.name+' will not draw on a friend.':P.fac===l.fac?'You serve the '+f.n+'.':P.fac?'Your employer is at '+(relOf(P.fac,l.fac).s==='ally'?'alliance':'peace')+' with them.':'They have no quarrel with you.';
    return '<p class="muted">Level '+lordStats(l).lv+' · renown '+(l.renown||0)+' · Leadership '+lordSkill(l,'lead')+' · Tactics '+lordSkill(l,'tact')+' · Medicine '+lordSkill(l,'med')+' · leads up to '+lcapOf(l)+'.</p><p>'+st+'</p>'}
  body(talk){const l=this.o,f=FACS[l.fac],free=P.fac===l.fac||l.inside;
    return relHtml(l,!talk?.lords)+(l.inside?'<p class="muted">Holding court in '+l.inside+', with '+l.troops.length+' soldiers quartered alongside the garrison.</p>':'')+lordJobHtml(l)+
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
class Conversation{
  // (a new talk: its greeting first, by what they remember of you; then they remember you)
  constructor(sp){this.sp=sp;this.lines=[];const g=sp.greet(TalkMemory.knows(sp.key));if(g)this.say(g);TalkMemory.meet(sp.key)}
  // (a line: quoted, the speaker's; told (who null), as it is)
  say(html,told=false,who=null){if(html)this.lines.push({who:told?null:who||this.sp.name(),you:!!who,html});return this}
  // the page's parts: head (face, name, standing), what was said, the replies (numbered), the speaker's own blocks
  head(){const p=this.sp.pic(),s=this.sp.sub();return '<div class="talk-head">'+(p?'<img class="talk-pic" src="'+p+'" alt="">':'')+'<div class="talk-who"><h2>'+htmlText(this.sp.name())+'</h2>'+(s?'<span class="muted">'+s+'</span>':'')+'</div></div>'}
  said(){return this.lines.length?'<div class="talk-lines">'+this.lines.slice(-TALK.lines).map(l=>l.who?'<p class="talk-line'+(l.you?' you':'')+'"><b>'+htmlText(l.who)+'</b> &ldquo;'+l.html+'&rdquo;</p>':'<div class="talk-told">'+l.html+'</div>').join('')+'</div>':''}
  answers(rs){rs=rs.filter(Boolean);return rs.length?'<div class="btns talk-replies">'+rs.map((r,i)=>'<button class="btn talk-r'+(r.primary?' primary':'')+'" type="button" data-act="'+r.act+'"'+(r.arg!=null?' data-arg="'+r.arg+'"':'')+(i<9?' data-key="'+(i+1)+'"':'')+(r.why?' disabled title="'+r.why+'"':'')+'>'+(i<9?'<b class="talk-k">'+(i+1)+'</b>':'')+r.label+(r.why?' · '+r.why:'')+(r.note?'<small class="talk-out">'+r.note+'</small>':'')+'</button>').join('')+'</div>':''}
  html(o={}){return '<div class="talk">'+(o.head===false?'':this.head())+this.sp.facts()+this.said()+this.answers(this.sp.replies())+(o.body??'')+'</div>'}
  // shown: in the dialog, or in a holding's rail ({rail: [from, tab, key]}); close (and back) its bottom bar's
  show(o){Conversation.now=this;if(o.rail){const [from,tab,k]=o.rail;estateRail(from,tab,{title:this.sp.name(),sub:this.sp.sub(),body:this.html({...o,head:false}),back:o.back,close:o.close},k);return}
    showPanel(this.html(o)+nav(o.back||null,o.close))}
  // a number key: that reply, on the conversation shown (input.js)
  static key(k){if(ov.hidden)return false;const b=panel.querySelector('.talk-replies [data-key="'+k+'"]');if(!b||b.disabled)return false;act(b.dataset.act,b.dataset.arg);return true}
  static save(){return TalkMemory.save()}
}
const TALK={lines:6};
onWorld(()=>{TalkMemory.all={};Conversation.now=null});
// a lord's check, on the talk shown with him (LordSpeaker#act)
onAct('talk-',(a,arg)=>{const cv=Conversation.now,sp=cv?.sp;if(!(sp instanceof LordSpeaker)||String(sp.o.id)!==String(arg)||G.enc?.kind!=='lord'||G.enc.ref!==sp.o||sp.o.dead)return;sp.act(a.slice(5),cv)});
Saves.add({key:'talk',order:340,defaults:null,save:()=>TalkMemory.save(),load:v=>TalkMemory.load(v)});
