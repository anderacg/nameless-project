'use strict';
/* ---------- a story's steps: the reusable step kinds of a chain (doc/STORY_DESIGN.md §9; the story batch, ST2) ----------
   A chain is a thread (story/thread.js); most of its steps are quests a story begins, never offered on a board: each one is in
   your Quests (C) with where to go, marked on the map, saved with P.quests as every quest is, and its end told on the bus
   (quest:ended {e, how: 'paid' | 'failed'}; e.fate says which way, what a step branches by). A thread's step begins one with
   {step: kind, town, spec} (or {quest: 'escort', …}: the escort is a job kind too); its kinds are of the shape 'step' (not jobs:
   the boards never offer them and Quest.jobs never counts them; Quest.make and Quest.as find them).
   - StepQuest, the base (on the Quest shape, story/quest.js): a side quest, not a job (counted false), never reported (it ends where it
     ends), no due day unless its spec gives days. Done: pay(fate, k): its prize applied, its line, 'Quest complete'. Failed:
     fail(why, fate): late (its due day passed), left (abandoned), or its kind's (an escort's captured); its forfeit applied
     (forfeits: one by fate, else forfeit), its line. Its lines: its spec's say ({arrive, late, left, cleared, gone …}: {N} and
     {n} its name, {to} its place, {town}), else its kind's.
   - Its place (StepQuest.place(to)): a holding ({town}), one of its lots ({town, lot: 'house' or an estate's key, i: the i-th of
     them that stands, no draw), or a spot ({x, y, name}). One that goes there (reaches) is there within ESCORT.reach of it on the
     map (Steps.frame) or on entering its holding. A home (a holding, a house, an estate) is marked with a house on the map
     (gfx/worldui.js), the rest with the quests' "!" (world/quests.js drawQuestMarks).
   - The kinds: escort (world/escort.js EscortQuest: a passenger rides with you there); visit (VisitQuest: go there: arrived);
     deliver (DeliverQuest: bring goods there, handed over on arrival: arrived); lair (LairQuest: clear a site, the hideout (or
     camp) its spec binds: cleared; cleared by another or gone from the map, the day's tick binds it to the nearest hideout of
     its band within STEP.retarget tiles instead (the band's survivors fled there), and with none it is over: gone); held
     (HeldQuest, a rescue: free a captive of yours from the band that carries him, the hideout that keeps him or a holding's
     gaol: freed; his holder destroyed by another: gone; no deadline). Over another way than done or failed (over(fate, k)):
     its line, quest:ended (paid).
   Steps.frame, each moment on the map (world/road.js updateRoad): a thread's page that waits is shown once you are
   free, else the first step at its place is reached; true when something opened. ---------- */
class StepQuest extends Quest{
  // (a side quest: not a job, never given up by you; a story's stage is its story's)
  get cat(){
    return 'side';
  }
  get kind(){
    return kindOf('step',this.type)||kindOf('quest',this.type);
  }
  reportableAt(){
    return false;
  }
  // (from its spec: its prize, forfeits, own lines and days; each set only when the spec has it, so a plain one's record is as it was)
  takes(s){
    this.prize=s.prize||{};
    this.forfeit=s.forfeit||{};
    if(s.forfeits)this.forfeits=s.forfeits;
    if(s.say)this.lines=s.say;
    if(s.quiet)this.quiet=true;
    this.days=s.days||0;
    this.reward=StepQuest.reward(this.prize);
  }
  // (its reward for the panels, from its prize)
  static reward(o){
    return {gold:Outcome.amount(o.gold||0),rep:o.rep?o.rep[1]:0,honor:o.honor?o.honor[1]:0,xp:o.xp||0};
  }
  rewardLine(){
    return Outcome.describe(this.prize);
  }
  // ---- its place: where it points you, the house over a home on the map
  seek(){
    const t=this.to;
    return t?{x:t.x,y:t.y,name:t.name}:null;
  }
  homeMark(){
    const t=this.to;
    return t&&(t.k==='holding'||t.k==='house'||t.k==='estate')?t:null;
  }
  // ---- there: one that goes to its place (reaches), near it on the map, or entering its holding
  get reaches(){
    return false;
  }
  near(){
    return Math.hypot(P.x-this.to.x,P.y-this.to.y)<=ESCORT.reach[this.to.k==='holding'?'holding':'lot'];
  }
  arrive(t){
    if(this.reaches&&this.to.town&&t.name===this.to.town)this.reached();
  }
  reached(){
    this.pay();
  }
  // ---- done: its prize, its line ({k} of its lines), its page if it has one of its own; then quest:ended (paid)
  pay(fate,k){
    this.fate=fate||'arrived';
    P.quests=P.quests.filter(x=>x!==this);
    const r=Outcome.apply(this.prize,{e:this}),line=this.say(k||'arrive');
    if(line)log(line,'good');
    log('Quest complete: '+this.title+'.'+(r.say?' '+r.say:''),'good');
    updateHUD(true);
    this.shown(line);
    this.announceEnd('paid');
  }
  shown(){}
  // ---- failed: late (its due day), left (abandoned), its kind's own; its forfeit (forfeits by fate), its line
  fail(why,fate){
    this.fate=fate||'late';
    P.quests=P.quests.filter(x=>x!==this);
    Outcome.apply(this.penalty(this.fate),{e:this});
    log('Quest failed: '+this.title+'. '+(why||this.say(this.fate)),'bad');
    this.announceEnd('failed');
  }
  // (its forfeit by fate, else its forfeit; what it paid, its prize)
  penalty(fate){
    return this.forfeits&&this.forfeits[fate]||this.forfeit||{};
  }
  gotLine(state){
    return state==='done'?Outcome.describe(this.prize||{}):Outcome.describe(this.penalty(this.fate));
  }
  lapse(){
    if(this.days&&G.day>this.due)this.fail(null,'late');
  }
  // ---- over another way (neither done by you nor failed: its holder gone, a captive moved): its line, then quest:ended (paid)
  over(fate,k){
    this.fate=fate;
    P.quests=P.quests.filter(x=>x!==this);
    const line=this.say(k||fate);
    if(line)log(line,'gold');
    this.announceEnd('paid');
  }
  // (given up: fate left, its line. Never by your Abandon: a side quest is not abandonable (the owner, 2026-10-23); kept as the
  // way a story's stage is dropped, its 'left' end)
  abandon(){
    this.fail(null,'left');
  }
  // ---- its words: its own line (its spec's say), else its kind's (sayOf), with its names in
  say(k){
    return this.fill(this.lines&&this.lines[k]||this.sayOf(k)||'');
  }
  sayOf(k){
    return STEP.say[k]||'';
  }
  fill(s){
    const t=this.to||{};
    const n=this.pn||'';
    return s.replace('{N}',n&&cap1(n)).replace('{n}',n).replace('{to}',t.name||'').replace('{town}',t.town||'');
  }
  // its place from a spec's to: a holding, one of its lots (its door), or a spot; null: none
  static place(to){
    if(to&&!to.town&&to.x!=null)return {k:'spot',x:Math.round(to.x),y:Math.round(to.y),name:to.name||'the place'};
    const t=to&&townBy(to.town);
    if(!t)return null;
    const ls=to.lot?(t.lots||[]).filter(l=>l.k===to.lot&&l.st!=='ruined'):[];
    if(!ls.length)return {k:'holding',town:t.name,x:t.x,y:t.y,name:t.name};
    const l=ls[Math.abs(to.i|0)%ls.length],m=lotMid(l),house=to.lot==='house';
    return {k:house?'house':'estate',town:t.name,lot:to.lot,x:Math.round(m.x),y:Math.round(m.y),name:house?'a house in '+t.name:ESTATES[to.lot].n+' of '+t.name};
  }
}
/* go there (spec: {to, title, text, prize, say, days}): arrived */
class VisitQuest extends StepQuest{
  setup(t,lord,s){
    const to=s&&StepQuest.place(s.to);
    if(!to)return false;
    this.to=to;
    this.giver=t.name;
    this.title=s.title||'Go to '+to.name;
    this.text=s.text||'Go to '+to.name+'.';
    this.takes(s);
  }
  begin(){
    this.x=this.to.x;
    this.y=this.to.y;
  }
  get reaches(){
    return true;
  }
  todo(){
    return 'Go to '+this.to.name+'.';
  }
}
/* bring goods there (spec: as a visit's, and give: {good: n}): ready once you carry them; there with them, they are handed over
   and it is done (arrived) */
class DeliverQuest extends VisitQuest{
  setup(t,lord,s){
    if(!s||!s.give||super.setup(t,lord,s)===false)return false;
    this.give=s.give;
    this.title=s.title||'Bring '+this.what()+' to '+this.to.name;
  }
  what(){
    return Object.entries(this.give).map(([g,n])=>n+' '+GOODS[g].n.toLowerCase()).join(', ');
  }
  ready(){
    return Object.entries(this.give).every(([g,n])=>goodN(g)>=n);
  }
  near(){
    return this.ready()&&super.near();
  }
  arrive(t){
    if(this.ready())super.arrive(t);
  }
  reached(){
    for(const [g,n] of Object.entries(this.give))goodTake(g,n);
    this.pay();
  }
  progress(){
    return Object.entries(this.give).map(([g,n])=>Math.min(n,goodN(g))+' / '+n+' '+GOODS[g].n.toLowerCase()).join(', ');
  }
}
/* clear a site (spec: {site (its i), band (bandits, raiders, bog), near {x, y} (where to look for one: none given, or gone),
   title, text, prize, say, days}): the hideout bound (its i and seed); its deed heard on the bus (site:cleared): cleared. The
   day's tick: cleared by another or gone, the nearest of its band within STEP.retarget tiles instead, else over (gone) */
class LairQuest extends StepQuest{
  setup(t,lord,s){
    const own=s&&s.site!=null?W.sites.find(x=>x.i===s.site):null,lair=own&&own instanceof Lair&&!own.cleared?own:s&&LairQuest.near(s.near||t,s.band);
    if(!lair)return false;
    this.band=s.band||lair.band;
    this.bind(lair);
    this.giver=t.name;
    this.title=s.title||'Clear the '+lair.name;
    this.text=s.text||'Clear out the '+lair.name+'.';
    this.takes(s);
  }
  bind(s){
    this.site=s.i;
    this.sseed=s.seed;
    this.to={k:'site',x:s.x,y:s.y,name:'the '+s.name};
    this.x=s.x;
    this.y=s.y;
  }
  begin(){
    const s=this.lair();
    if(!s)return false;
    s.seen=true;
  }
  // (its hideout: the very one bound, by its place in W.sites and its seed; null: gone)
  lair(){
    return W.sites.find(x=>x.i===this.site&&x.seed===this.sseed)||null;
  }
  // (the nearest live hideout to at, of its band first, then any; within: tiles, none: anywhere)
  static near(at,band,within){
    const hs=W.sites.filter(s=>s instanceof Hideout&&!s.cleared&&!s.within&&(!within||Math.hypot(s.x-at.x,s.y-at.y)<=within*TILE));
    return Spatial.nearest(hs.filter(s=>s.band===band),at.x,at.y)||Spatial.nearest(hs,at.x,at.y);
  }
  get deed(){
    return 'site:cleared';
  }
  hits(d){
    return !!d.site&&d.site.i===this.site&&d.site.seed===this.sseed;
  }
  // (heard: done at once, never reported)
  finish(){
    this.pay('cleared','cleared');
  }
  todo(){
    return 'Clear '+this.to.name+'.';
  }
  lapse(){
    const s=this.lair();
    if(s&&!s.cleared)return super.lapse();
    const n=LairQuest.near(this.to,this.band,STEP.retarget);
    if(!n)return this.pay('gone','gone');
    const was=this.to.name;
    this.bind(n);
    n.seen=true;
    log('Word comes that '+was+' stands empty: its survivors have fled to '+this.to.name+', to the '+compass(n.x-P.x,n.y-P.y)+'.','gold');
  }
}
/* free a captive of yours (the owner, 2026-10-23: no deadline; spec: {held (who holds him: world/captives.js carryOff's record;
   none: the gaol of its holding), n (his name), home (days a band carries him), price (his ransom), title, text, say}). Where
   he is, held.k (its record kept on the quest, as it changes):
   - band: the band that carries him, found wherever it is (roving, or sheltering in a camp) and marked; beaten by you
     (band:beaten): freed (say.band). The day's tick: gone from the map (beaten by another): over, gone; its home days up, it
     takes him to the nearest hideout of its kind and lets go of him: lair (say.home, marked);
   - lair: the hideout or camp that keeps him, marked; cleared by you (site:cleared): freed (say.lair). The day's tick: cleared
     by another or gone, the nearest of its kind within STEP.retarget tiles (its survivors took him there: say.moved), else
     over, gone;
   - holding: its gaol; at its gates on the map (within ESCORT.reach, Steps.frame; hostile or not) the gaoler's page: pay his
     price (freed: say.paid), or Not now (asked again once you have gone and come back); stormed by you (battle:ended, a siege
     won there): freed (say.taken). The day's tick: it changed hands, to you or your realm, freed (say.taken); to another, over,
     gone (let out in the turmoil).
   Freed: done, its fate 'freed'. Its ears are its own (HeldQuest.heard: band:beaten, site:cleared, battle:ended), by where he is */
class HeldQuest extends StepQuest{
  setup(t,lord,s){
    s=s||{};
    this.held=s.held&&s.held.k&&s.held.k!=='none'?{...s.held}:{k:'holding',town:t.name,fac:t.owner};
    this.pn=s.n||'the captive';
    this.price=s.price||0;
    this.goes=G.day+(s.home||0);
    this.giver=t.name;
    this.title=s.title||'Free '+this.pn;
    this.text=s.text||'';
    this.takes(s);
    this.bind();
  }
  // (where it points: the band, wherever it is; the hideout; the holding)
  bind(){
    const h=this.held,s=h.k==='lair'&&this.lair(),t=h.k==='holding'&&townBy(h.town);
    this.to=s?{k:'site',x:s.x,y:s.y,name:'the '+s.name}:t?StepQuest.place({town:t.name}):{k:'band',name:h.chief?h.chief+'’s band':'the '+(LAIR_SAY[h.kind]||'bandits').toLowerCase()};
    if(s)s.seen=true;
    if(this.to.x!=null){
      this.x=this.to.x;
      this.y=this.to.y;
    }
  }
  begin(){
    const b=this.party();
    if(b){
      this.x=b.x;
      this.y=b.y;
    }
  }
  // (who has him: the band that carries him; the hideout, by its place in W.sites and its seed; null: gone)
  party(){
    return this.held.k==='band'?bandCarrying(this.held.cap):null;
  }
  lair(){
    const h=this.held;
    return W.sites.find(x=>x.i===h.site&&x.seed===h.sseed)||null;
  }
  seek(){
    const b=this.party();
    return b?{x:b.x,y:b.y,name:this.to.name}:this.to.x!=null?{x:this.to.x,y:this.to.y,name:this.to.name}:null;
  }
  homeMark(){
    return null;
  }
  todo(){
    const h=this.held;
    return h.k==='band'?'Beat '+this.to.name+'.':h.k==='lair'?'Clear '+this.to.name+'.':'Ransom '+this.pn+' at '+h.town+' ('+this.price+' gold), or take it.';
  }
  // ---- the gaol: its gates reached on the map, once each time you come (Not now waits till you have gone off and come back)
  get reaches(){
    return !!this.held&&this.held.k==='holding';
  }
  near(){
    const n=super.near();
    if(!n)this.off=0;
    return n&&!this.off;
  }
  arrive(){}
  reached(){
    this.off=1;
    if(G.mode!=='world'||G.modal)return;
    G.ransom=this;
    G.mode='story';
    CHOICE_PAGE.show({ico:'gold',title:'The gaol of '+this.held.town,sub:this.title+' · day '+G.day,text:this.say('gaol')||this.todo(),facts:[this.price+' gold asked'],choices:RANSOM_CHOICES,subject:this,act:'rs-do',
      close:['rs-close',null,'Not now']},'ransom:'+this.id);
  }
  ransom(){
    if(P.gold<this.price||!this.reaches)return '';
    P.gold-=this.price;
    this.pay('freed','paid');
    return '';
  }
  // ---- freed by your hand: its own event, by where he is
  frees(type,d){
    const h=this.held;
    if(!d)return false;
    if(h.k==='band')return type==='band:beaten'&&carries(d.band,h.cap);
    if(h.k==='lair')return type==='site:cleared'&&!!d.site&&d.site.i===h.site&&d.site.seed===h.sseed;
    return type==='battle:ended'&&d.how==='won'&&!!d.enc&&d.enc.kind==='siege'&&!!d.enc.ref&&d.enc.ref.name===h.town;
  }
  static heard(type,d){
    for(const q of P.quests.slice()){
      if(q.type!=='held')continue;
      const Q=Quest.as(q);
      if(Q.frees(type,d)){
        uncarry(Q.party(),Q.held.cap);
        Q.pay('freed',{band:'band',lair:'lair',holding:'taken'}[Q.held.k]);
      }
    }
  }
  // ---- the day: his holder gone (over), the band home, the hideout's survivors moved, the holding changed hands
  lapse(){
    const h=this.held;
    if(h.k==='band'){
      const b=this.party();
      if(!b)return this.over('gone','gone');
      const s=G.day>=this.goes&&LairQuest.near(b,h.kind);
      if(!s)return;
      uncarry(b,h.cap);
      this.held={k:'lair',site:s.i,sseed:s.seed,lair:s.name,kind:h.kind};
      this.bind();
      return log(this.say('home'),'gold');
    }
    if(h.k==='lair'){
      const s=this.lair();
      if(s&&!s.cleared)return;
      const n=LairQuest.near(this.to,h.kind,STEP.retarget);
      if(!n)return this.over('gone','gone');
      this.held={...h,site:n.i,sseed:n.seed,lair:n.name};
      this.bind();
      return log(this.say('moved'),'gold');
    }
    const t=townBy(h.town);
    if(t&&!t.gone&&t.owner===h.fac)return;
    if(t&&!t.gone&&(t.owner==='player'||P.fac&&t.owner===P.fac))return this.pay('freed','taken');
    this.over('gone','gone');
  }
  // (given up: the band lets go of him, lost to you)
  fail(why,fate){
    uncarry(this.party(),this.held.cap);
    super.fail(why,fate);
  }
}
for(const type of ['band:beaten','site:cleared','battle:ended'])worldOn(type,d=>HeldQuest.heard(type,d));
// the gaoler's page: pay (its way out: Not now)
const RANSOM_CHOICES=Choice.list([{icon:'gold',label:'Pay the ransom',need:q=>P.gold<q.price&&'Not enough gold',facts:q=>['−'+q.price+' gold',cap1(q.pn)+' is free'],
  tip:'Pay his gaolers, and he walks free.',run:q=>q.ransom()}]);
onAct('rs-',(a,arg)=>{
  const q=G.ransom;
  if(G.mode!=='story'||!q)return;
  const c=a==='rs-do'&&CHOICE_PAGE.choose(RANSOM_CHOICES,arg,q);
  if(a!=='rs-close'&&!c)return;
  G.ransom=null;
  G.mode='world';
  hidePanel();
  if(c)c.perform(q);
  updateHUD(true);
});
defineKinds('step',{},{
  visit:{cls:VisitQuest},
  deliver:{cls:DeliverQuest},
  lair:{cls:LairQuest},
  held:{cls:HeldQuest},
});
/* each moment on the map: a thread's page that waits shown once you are free; else the first step at its place reached (one a
   moment); true: something opened (the moment ends there) */
const Steps={
  frame(){
    if(G.mode!=='world')return false;
    if(Thread.showWaiting())return true;
    for(const q of P.quests){
      const Q=Quest.as(q);
      if(Q.reaches&&Q.near()){
        Q.reached();
        return true;
      }
    }
    return false;
  },
};
