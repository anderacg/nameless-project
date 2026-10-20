'use strict';
/* ---------- the Quest shape (doc/STORY_DESIGN.md §2, §3.6; the story wave, S3) ----------
   A quest is a task you carry, taken from a holding's notice board or from a lord: a goal, its progress, a due day, a reward
   and where to report. Its record is saved as it always was (P.quests; an offer: P.jobs, G.lordJob): {type (its kind), giver,
   lord, fac, home, ...its kind's fields, title, text, days, reward {gold, rep, honor, xp}; once taken: id, due, done, x, y}.
   The class is put on it in place (Quest.as) when it is made or first used, so a record from a save or a test is one too.
   Its kinds (world/quests.js: bounty, beast, clear, supply, hunt, courier, troops, lordkill, raid) are subclasses, each with
   its own rules, overriding only what differs:
   - setup(t, lord): its offer made at the holding t (by the lord, if one gives it); false: none can be made there;
   - begin(t): taking it (what must be hunted put on the map, where it points); false: it cannot be taken;
   - seek(): where the deed is (goal() points you home once it is done, or when it is handed over);
   - deed and hits(d): the world event it waits for (core/bus.js) and whether this one is its own; heard, it is done (finish);
   - ready(), progress(), todo(): can it be handed in, how far along it is, what is left;
   - handsOver (goods or troops handed over, not a deed reported) and handOver(t); arrive(t) (at a holding: a courier paid).
   The rest is the same for every kind: accept(), pay(where), turnIn(t), fail(why), lapse() (its due day passed), and the
   bus's 'quest:ended' once it is paid or failed. Never ticked per frame: its progress comes from the bus (Quest.listen), its
   due day from the day's tick (world/quests.js). */
class Quest extends Happening{
  get shape(){
    return 'quest';
  }
  static kindId(rec){
    return rec.type;
  }
  // ---- the offer: its record made one of its kind's class, then its kind's setup (null: none here)
  static make(type,t,lord){
    if(!kindOf('quest',type))return null;
    const q=this.as({type,giver:lord?lord.name:t.name,lord:!!lord,fac:lord?lord.fac:t.owner,home:t.name});
    return q.setup(t,lord)===false?null:q;
  }
  setup(){
    return false;
  }
  // (its reward: the gold grows with the days, qScale)
  pays(gold,rep,honor,xp){
    this.reward={gold:Math.round(gold*qScale()*.7),rep,honor,xp};
  }
  // ---- taking it (at most QUEST_MAX; its number is spent even when it cannot be taken)
  accept(){
    if(P.quests.length>=QUEST_MAX)return false;
    this.id=P.qid=(P.qid||0)+1;
    this.due=G.day+this.days;
    this.done=false;
    if(this.begin(townBy(this.home))===false)return false;
    P.quests.push(this);
    log('New quest: '+this.title+'. '+this.days+' days. Track it with C → Quests.','gold');
    return true;
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
  // ---- the deed: the world event it waits for, heard on the bus
  get deed(){
    return null;
  }
  hits(){
    return false;
  }
  finish(){
    this.done=true;
    log('Quest done: '+this.title+'. Report back to '+this.reportTo+'.','gold');
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
    const deeds=new Set(Kinds.all('quest').map(K=>K.cls.prototype.deed).filter(Boolean));
    for(const type of deeds)worldOn(type,d=>Quest.heard(type,d));
  }
  // ---- reporting: the reward (a friendly lord adds to it), and it is off your list
  pay(where){
    const r=this.reward,giver=this.lord&&W.lords.find(l=>l.name===this.giver);
    P.gold+=r.gold;
    if(giver){
      const bonus=Math.round(r.gold*Math.max(0,relWith(giver))/200);
      if(bonus){
        P.gold+=bonus;
        log(giver.name+' adds '+bonus+' gold for a friend.','gold');
      }
      changeRel(giver,RELATION.jobDone,'you did their work');
    }
    gainXp(r.xp);
    P.renown+=this.lord?4:2;
    if(r.rep)addRep(this.lord?where:this.home,r.rep,true);
    if(r.honor)addHonor(this.fac,r.honor,true);
    P.quests=P.quests.filter(x=>x!==this);
    log('Quest complete: '+this.title+'. +'+r.gold+' gold'+(r.rep?', +'+r.rep+' reputation':'')+(r.honor?', +'+r.honor+' honor':'')+'.','good');
    this.announceEnd();
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
  // ---- failing: given up, or its due day passed; its quarry is left to roam on its own
  fail(why){
    P.quests=P.quests.filter(x=>x!==this);
    if(this.lord)addHonor(this.fac,-5,true);
    else addRep(this.home,-6,true);
    bandits.forEach(b=>{if(b.qid===this.id)delete b.qid});
    W.monsters.forEach(m=>{if(m.qid===this.id)delete m.qid});
    log('Quest failed: '+this.title+'. '+why,'bad');
    const giver=this.lord&&W.lords.find(l=>l.name===this.giver);
    if(giver)changeRel(giver,RELATION.jobFailed,'you failed their work');
    this.announceEnd();
  }
  lapse(){
    if(G.day>this.due&&!this.done)this.fail(this.reportTo+' is disappointed.');
  }
}
// (a quest's number, id, is its record's own field, set when it is taken, not a happening's getter (its i); so is a troops
// job's tier, which things on the map read as their level of detail (parties.js WorldObject): plain fields of the record)
for(const f of ['id','tier'])Object.defineProperty(Quest.prototype,f,{value:undefined,writable:true,configurable:true});
