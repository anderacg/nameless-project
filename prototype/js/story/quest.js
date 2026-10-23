'use strict';
/* ---------- the Quest shape (doc/STORY_DESIGN.md §2, §3.6; the story wave, S3) ----------
   A quest is a task you carry, taken from a holding's notice board or from a lord: a goal, its progress, its timing, a reward
   and where to report. Its record is saved as it always was (P.quests; an offer: P.jobs, G.lordJob): {type (its kind), giver,
   lord, fac, home, ...its kind's fields, title, text, days, reward {gold, rep, honor, xp}; once taken: id, due, done, x, y}
   (a job's timing is its own: world/quests.js JobQuest, taken, and days and due only for a kind where time matters).
   The class is put on it in place (Quest.as) when it is made or first used, so a record from a save or a test is one too.
   Its kinds (world/quests.js: bounty, beast, clear, supply, hunt, courier, troops, lordkill, raid) are subclasses, each with
   its own rules, overriding only what differs:
   - setup(t, lord): its offer made at the holding t (by the lord, if one gives it); false: none can be made there;
   - begin(t): taking it (what must be hunted put on the map, where it points); false: it cannot be taken;
   - seek(): where the deed is (goal() points you home once it is done, or when it is handed over);
   - deed and hits(d): the world event it waits for (core/bus.js) and whether this one is its own; heard, it is done (finish);
   - ready(), progress(), todo(): can it be handed in, how far along it is, what is left;
   - handsOver (goods or troops handed over, not a deed reported) and handOver(t); arrive(t) (at a holding: a courier paid).
   The rest is the same for every kind: accept(), pay(where) (earned(): the gold it pays now), turnIn(t), fail(why), lapse()
   (the day's check: here its due day passed, failed; a job's own: world/quests.js), abandon(), its quarry (Quest.quarry:
   whatever it marked, roving or sheltering; unmarked once it is done or failed), and the bus's 'quest:ended' once it is paid or
   failed ({e, how: 'paid' or 'failed'; a job the world closed: 'closed'}). Never ticked per frame: its progress comes from the
   bus (Quest.listen), its day's check from the day's tick (world/quests.js). Its words for your Quests (ui/questwindow.js) and
   the boards: givenBy(), timing(), reportLine(), steps(), abandonCost(). A kind made by another (an escort: world/escort.js)
   is given its spec (make's, setup's). There is no cap on the jobs you hold (the boards limit the work); one that is not a
   job is counted false (Quest.jobs: the plain count), and a kind may have its own limit (full: an escort's).
   The quest model (the owner, 2026-10-23; doc/STORY_DESIGN.md QM), read the same way by every quest and story (story/thread.js):
   - cat, its category (QUEST_CATS, data/quests.js): 'job' (the boards' and lords', JobQuest), 'side' (a step kind: an escort
     from the road, StepQuest), 'main' (a story kind marked main: Thread). Only a job can be given up (abandonable), at a cost
     (penalty(fate): what failing it costs, as an outcome; a job's grows with its size) and never while it is a story's stage;
   - state (QUEST_STATES): an offer 'locked' (needs(): what it asks of you, unmet) or 'available'; taken, 'active', or
     'completed' (ready: report it); over, its archive entry's: 'done', 'failed' or 'abandoned' (endState);
   - story: the story it is a stage of (a live thread waiting on it), or null: listed and archived as its story, not alone;
   - over (announceEnd): kept in the archive (QuestArchive, below: P.archive), unless it is a story's stage. */
class Quest extends Happening{
  get shape(){
    return 'quest';
  }
  static kindId(rec){
    return rec.type;
  }
  // (its class: a job's kind's, or a chain's step's: story/steps.js, the shape 'step', quests no board offers)
  static classFor(rec){
    const K=kindOf('quest',rec.type)||kindOf('step',rec.type);
    return K&&K.cls||this;
  }
  // ---- the offer: its record made one of its kind's class, then its kind's setup (null: none here); spec: what a kind made by
  // another is given (an escort's passenger and place: world/escort.js; a chain's step: story/steps.js)
  static make(type,t,lord,spec){
    if(!kindOf('quest',type)&&!kindOf('step',type))return null;
    const q=this.as({type,giver:lord?lord.name:t.name,lord:!!lord,fac:lord?lord.fac:t.owner,home:t.name});
    return q.setup(t,lord,spec)===false?null:q;
  }
  setup(){
    return false;
  }
  // (its reward: the gold grows with the days, qScale)
  pays(gold,rep,honor,xp){
    this.reward={gold:Math.round(gold*qScale()*.7),rep,honor,xp};
  }
  // (its reward in words, for the panels)
  rewardLine(){
    return rewardText(this.reward);
  }
  // ---- taking it (no cap on jobs; a kind's own limit: full, an escort's, world/escort.js); its number is spent even when it
  // cannot be taken
  // (a job, counted in Quest.jobs; an escort or a chain's step is not)
  get counted(){
    return this.cat==='job';
  }
  // ---- its category (the shape's: a job; a step kind's, side: story/steps.js), state and story (the quest model, above)
  get cat(){
    return 'job';
  }
  get story(){
    return Thread.list().on.find(th=>th.waits({e:this}))||null;
  }
  get abandonable(){
    return this.cat==='job'&&!this.story;
  }
  get state(){
    if(this.id==null)return this.needs().some(n=>!n.met)?'locked':'available';
    return this.ready()?'completed':'active';
  }
  // (what it asks of you before it is given: {k, what, met} each; a job's: world/quests.js)
  needs(){
    return [];
  }
  full(){
    return false;
  }
  static jobs(){
    return P.quests.filter(q=>Quest.as(q).counted).length;
  }
  accept(){
    if(this.full())return false;
    this.id=P.qid=(P.qid||0)+1;
    this.stamp();
    this.done=false;
    if(this.begin(townBy(this.home))===false)return false;
    P.quests.push(this);
    log('New quest: '+this.title+'. '+this.takenLine()+'Track it with C → Quests.','gold');
    return true;
  }
  // (taken: its due day; its words for it in the line)
  stamp(){
    this.due=G.day+this.days;
  }
  takenLine(){
    return this.days?this.days+' days. ':'';
  }
  begin(){}
  // ---- where it points you now, and how far along it is
  goal(){
    if(this.done||this.handsOver)return this.homeGoal();
    return this.seek();
  }
  // (home: the giver's holding; a lord's, his realm's nearest holding that is not hostile to you)
  homeGoal(){
    const t=this.lord?Spatial.nearest(fiefsOf(this.fac).filter(x=>!hostileTo(x.owner)),P.x,P.y)||townBy(this.home):townBy(this.home);
    return t?{x:t.x,y:t.y,name:t.name}:null;
  }
  seek(){
    return null;
  }
  // (a home it is bound for, marked with a house on the map: a step's, story/steps.js; a job's none)
  homeMark(){
    return null;
  }
  get handsOver(){
    return false;
  }
  ready(){
    return this.done;
  }
  progress(){
    if(this.done)return 'Done. Report to '+(this.lord?this.giver+' or any '+FACS[this.fac].n+' holding':this.home)+'.';
    return this.todo();
  }
  todo(){
    return 'Not done yet.';
  }
  // who it is reported to: its lord, or its holding
  get reportTo(){
    return this.lord?this.giver:this.home;
  }
  reportableAt(t){
    return this.lord?t.owner===this.fac:t.name===this.home;
  }
  // ---- its words, for your Quests (ui/questwindow.js) and the boards: who gave it and where they are, its timing, where it is
  // reported (as reportableAt says; a step that goes there: on arrival; none: ''), its steps ([text, done] each), its forfeit
  givenBy(){
    const t=townBy(this.home);
    if(this.lord){
      const l=W.lords.find(x=>x.name===this.giver),at=l&&!l.dead&&!l.gone?(l.inside?', in '+l.inside:', in the field near '+Spatial.nearestHolding(l.x,l.y).name):'';
      return this.giver+' of the '+FACS[this.fac].n+at;
    }
    const where=t?t.name+' ('+t.label+(t.owner&&FACS[t.owner]?' of the '+FACS[t.owner].n:'')+')':this.home;
    return this.giver===this.home?where:this.giver+', from '+where;
  }
  timing(){
    if(!this.days)return '';
    if(this.due==null)return 'Within '+this.days+' days; late, it fails';
    return 'Due by day '+this.due+' ('+Math.max(0,this.due-G.day)+' days left); late, it fails';
  }
  reportLine(){
    if(this.reaches&&this.to)return 'On arrival at '+this.to.name;
    if(this.lord)return 'To '+this.giver+', or at any holding of the '+FACS[this.fac].n;
    return TOWNS.some(t=>this.reportableAt(t))?'At '+this.home:'';
  }
  steps(){
    const g=this.goal(),d=g&&!this.done?questWay(g):'';
    return [[this.progress()+(d?' ('+d+(g.name?', '+g.name:'')+')':''),this.ready()]];
  }
  abandonCost(){
    return Outcome.describe(this.penalty('left'));
  }
  // what failing it costs (fate: how; 'left', given up), as an outcome: its giver's, flat (a job's grows with its size:
  // world/quests.js JobQuest; a step's its forfeit: story/steps.js)
  penalty(){
    return this.lord?{honor:[this.fac,-5]}:{rep:[this.home,-6]};
  }
  // ---- the deed: the world event it waits for, heard on the bus
  get deed(){
    return null;
  }
  hits(){
    return false;
  }
  finish(){
    this.done=true;
    Quest.unmark(this.id);
    log('Quest done: '+this.title+'. Report back to '+this.reportTo+'.','gold');
  }
  // ---- its quarry: every party or beast it marked (qid), wherever it is: roving, gone to ground in a camp or hideout (a site's
  // bands), a beast; unmarked once the quest is done or failed, so it is left to roam on its own
  static quarry(id){
    return [...new Set([...W.parties,...W.sites.flatMap(s=>s.bands||[]),...W.monsters])].filter(o=>o.qid===id);
  }
  static unmark(id){
    for(const o of Quest.quarry(id))delete o.qid;
  }
  // (an event heard: every quest of yours not done yet that waits for it, in order, decides whether it is its own)
  static heard(type,d){
    for(const q of P.quests){
      if(q.done)continue;
      const Q=this.as(q);
      if(Q.deed===type&&Q.hits(d))Q.finish();
    }
  }
  // the kinds' deeds listened to, once each (world/quests.js, once its kinds are defined)
  static listen(){
    const deeds=new Set(Kinds.all('quest').concat(Kinds.all('step')).map(K=>K.cls.prototype.deed).filter(Boolean));
    for(const type of deeds)worldOn(type,d=>Quest.heard(type,d));
  }
  // ---- reporting: the reward (a friendly lord adds to it), and it is off your list
  pay(where){
    const r=this.reward,giver=this.lord&&W.lords.find(l=>l.name===this.giver),gold=this.earned();
    P.gold+=gold;
    if(giver){
      const bonus=Math.round(gold*Math.max(0,relWith(giver))/200);
      if(bonus){
        P.gold+=bonus;
        log(giver.name+' adds '+bonus+' gold for a friend.','gold');
      }
      changeRel(giver,RELATION.jobDone,'you did their work');
    }
    gainXp(r.xp);
    P.renown+=this.lord?4:2;
    // (a lord's: where you were paid; none, his realm holding nothing: no holding's reputation)
    const at=this.lord?where:this.home;
    if(r.rep&&at)addRep(at,r.rep,true);
    if(r.honor)addHonor(this.fac,r.honor,true);
    P.quests=P.quests.filter(x=>x!==this);
    log('Quest complete: '+this.title+'. +'+gold+' gold'+(r.rep?', +'+r.rep+' reputation':'')+(r.honor?', +'+r.honor+' honor':'')+'.','good');
    this.announceEnd('paid');
  }
  // (the gold it pays now: its reward's; a late job's less, world/quests.js)
  earned(){
    return this.reward.gold;
  }
  // handed in at the holding t: what it asked for given over, then paid
  turnIn(t){
    if(!this.ready())return false;
    this.handOver(t);
    this.pay(t.name);
    return true;
  }
  handOver(){}
  arrive(){}
  // ---- failing: given up, or its due day passed (a job never: world/quests.js); its penalty; its quarry is left to roam on its
  // own, wherever it is
  fail(why){
    P.quests=P.quests.filter(x=>x!==this);
    Outcome.apply(this.penalty(this.fate),{e:this});
    Quest.unmark(this.id);
    log((this.fate==='left'?'Quest abandoned: ':'Quest failed: ')+this.title+'. '+why,'bad');
    const giver=this.lord&&W.lords.find(l=>l.name===this.giver);
    if(giver)changeRel(giver,RELATION.jobFailed,'you failed their work');
    this.announceEnd('failed');
  }
  lapse(){
    if(G.day>this.due&&!this.done)this.fail(this.reportTo+' is disappointed.');
  }
  // given up (Abandon, in your quests: only one that is abandonable; fate 'left')
  abandon(){
    this.fate='left';
    this.fail('You gave it up.');
  }
  // ---- over: kept in the archive (none for a story's stage: its story is), then told on the bus
  announceEnd(how){
    if(!this.story)QuestArchive.add(this.entry(how));
    super.announceEnd(how);
  }
  // (how it ended, as a state: paid, done; given up, abandoned; else failed (the world closing a job among them))
  endState(how){
    return how==='paid'?'done':this.fate==='left'?'abandoned':'failed';
  }
  // (its archive entry: small, plain; got: what it paid, or what it cost)
  entry(how){
    const state=this.endState(how);
    return {k:'q'+this.id,cat:this.cat,title:this.title,giver:this.giver,state,day:G.day,got:this.gotLine(state,how)};
  }
  gotLine(state,how){
    const r=this.reward||{};
    if(how==='closed')return '+'+Math.round(r.gold*QUEST_CLOSED.gold)+' gold for your trouble';
    if(state!=='done')return Outcome.describe(this.penalty(this.fate));
    return ['+'+this.earned()+' gold',r.rep&&'+'+r.rep+' reputation',r.honor&&'+'+r.honor+' honor',r.xp&&r.xp+' XP'].filter(Boolean).join(' · ');
  }
}
/* ---------- the archive: every quest and story over (done, failed, abandoned), the last QUEST_ARCHIVE.keep, oldest first; each a
   small record {k ('q' and a quest's id, 't' and a story's number), cat, title, giver, state, day, got (a quest's: what it
   paid or cost; a story's: its last stage)}. Kept in P.archive, saved with you (none yet: no field, so a save is as it was) ---------- */
const QuestArchive={
  list(){
    return P.archive||[];
  },
  add(e){
    P.archive=this.list().concat([e]).slice(-QUEST_ARCHIVE.keep);
  },
};
// (a quest's number, id, is its record's own field, set when it is taken, not a happening's getter (its i); so is a troops
// job's tier, which things on the map read as their level of detail (parties.js WorldObject): plain fields of the record)
for(const f of ['id','tier'])Object.defineProperty(Quest.prototype,f,{value:undefined,writable:true,configurable:true});
