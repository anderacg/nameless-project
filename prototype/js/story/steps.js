'use strict';
/* ---------- a story's steps: the reusable step kinds of a chain (doc/STORY_DESIGN.md §9; the story batch, ST2) ----------
   A chain is a thread (story/thread.js); most of its steps are quests a story begins, never offered on a board: each one is in
   your Quests (C) with where to go, marked on the map, saved with P.quests as every quest is, and its end told on the bus
   (quest:ended {e, how: 'paid' | 'failed'}; e.fate says which way, what a step branches by). A thread's step begins one with
   {step: kind, town, spec} (or {quest: 'escort', …}: the escort is a job kind too); its kinds are of the shape 'step' (not jobs:
   the boards and QUEST_MAX never see them; Quest.make and Quest.as find them).
   - StepQuest, the base (on the Quest shape, story/quest.js): not a job (counted false), never reported (it ends where it
     ends), no due day unless its spec gives days. Done: pay(fate, k): its prize applied, its line, 'Quest complete'. Failed:
     fail(why, fate): late (its due day passed), left (abandoned), or its kind's (an escort's captured); its forfeit applied
     (forfeits: one by fate, else forfeit), its line. Its lines: its spec's say ({arrive, late, left, cleared, gone …}: {N} and
     {n} its name, {to} its place, {town}), else its kind's.
   - Its place (StepQuest.place(to)): a holding ({town}), one of its lots ({town, lot: 'house' or an estate's key, i: the i-th of
     them that stands, no draw), or a spot ({x, y, name}). One that goes there (reaches) is there within ESCORT.reach of it on the
     map (Steps.frame) or on entering its holding. A home (a holding, a house, an estate) is marked with a house on the map
     (gfx/worldui.js), the rest with the quests' "!" (world/quests.js drawQuestMarks).
   - The kinds: escort (world/escort.js EscortQuest: a passenger rides with you there); visit (VisitQuest: go there: arrived);
     deliver (DeliverQuest: bring goods there, handed over on arrival: arrived); lair (LairQuest: clear a site, the hideout its
     spec binds: cleared; cleared by another or gone from the map, the day's tick binds it to the nearest hideout of its band
     within STEP.retarget tiles instead (the band's survivors fled there), and with none it is over: gone).
   Steps.frame, each moment on the map (world/road.js updateRoad): a thread's page that waits is shown once you are
   free, else the first step at its place is reached; true when something opened. ---------- */
class StepQuest extends Quest{
  get counted(){
    return false;
  }
  full(){
    return false;
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
    Outcome.apply(this.forfeits&&this.forfeits[this.fate]||this.forfeit,{e:this});
    log('Quest failed: '+this.title+'. '+(why||this.say(this.fate)),'bad');
    this.announceEnd('failed');
  }
  lapse(){
    if(this.days&&G.day>this.due)this.fail(null,'late');
  }
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
    const own=s&&s.site!=null?W.sites.find(x=>x.i===s.site):null,lair=own&&own instanceof Hideout&&!own.cleared?own:s&&LairQuest.near(s.near||t,s.band);
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
defineKinds('step',{},{
  visit:{cls:VisitQuest},
  deliver:{cls:DeliverQuest},
  lair:{cls:LairQuest},
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
