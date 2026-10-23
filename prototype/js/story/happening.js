'use strict';
/* ---------- happenings: the base of every shape (doc/STORY_DESIGN.md §2, §3.8–3.10; the story wave, S1) ----------
   A Happening is one running thing of the story: an encounter on the road, an incident (story/incident.js), a quest
   (story/quest.js), a thread (story/thread.js), a gathering (story/gathering.js): each its shape, a subclass. Its record is plain data, saved as it is ({k, i,
   ...its state}; a quest's names its kind type and its number id, as it always did: kindId); the class is put on it
   in place (Happening.as), the class its kind names (story/kinds.js: spec.cls) or its shape's. Every happening is a thing of
   the world (parties.js WorldObject), so the map's lists take an encounter as any other thing.
   - id (its number: i), k (its kind's id), kind (its kind: kindOf);
   - presence (§3.9): marker() (its mark on the map: {x, y, icon, col, tip}, or null), page() (what its ChoicePage shows),
     say(line, cls) (a log line);
   - lifetime (§3.10): ends (how it ends: its shape's policy), announceEnd(how) (the bus's '<shape>:ended', {e, how}: once it
     is over; how: the way it ended, where its shape says);
   - the save (§3.8): save() (its record: its own fields, nothing derived), Happening.load(rec) (wrapped by its kind's class, its
     kind's defaults filled in where the record has none, the way new fields load without a migration; a record whose kind no
     longer exists: null, dropped quietly).
   The Encounter (story/encounter.js) is the road's: met on the map, its figures, a behaviour, a page. ---------- */
class Happening extends WorldObject{
  // its shape ('encounter', …): its kinds are that shape's
  get shape(){
    return null;
  }
  get id(){
    return this.i;
  }
  get kind(){
    return kindOf(this.shape,this.constructor.kindId(this));
  }
  // ---- presence
  marker(){
    return null;
  }
  page(){
    return null;
  }
  // its lines (the chronicle: core/state.js log): their kind, for the Chronicle's filters, and what they link to in the Journal
  // (its key there); none: null (a quest's and a story's: story/quest.js, thread.js; an incident's: your band's)
  get logKind(){
    return null;
  }
  get journalKey(){
    return null;
  }
  say(line,cls){
    log(line,cls,this.logKind,this.journalKey);
  }
  // ---- lifetime
  get ends(){
    return null;
  }
  // (the bus's event when it is over: '<shape>:ended'; a gathering's is its closing)
  get endEvent(){
    return this.shape+':ended';
  }
  // over: {e} on the bus, and how it ended when its shape says (a quest 'paid' or 'failed'; an encounter its finish's: 'done',
  // 'left', 'timeout', 'caught', 'escaped', 'won', 'lost', 'fled'), the key a thread's step branches by (story/thread.js)
  announceEnd(how){
    worldEmit(this.endEvent,how===undefined?{e:this}:{e:this,how});
  }
  // ---- the save
  save(){
    return {...this};
  }
  // (a record's kind: its k; a shape whose records name it otherwise says so: a quest's type)
  static kindId(rec){
    return rec.k;
  }
  // (the class for a record: its kind's own, or this shape's)
  static classFor(rec){
    const K=kindOf(this.prototype.shape,this.kindId(rec));
    return K&&K.cls||this;
  }
  // a record made one of its class, in place (new, from a save or a test): the same object, its fields as they were
  static as(rec){
    if(!rec)return rec;
    const C=this.classFor(rec);
    if(Object.getPrototypeOf(rec)!==C.prototype)Object.setPrototypeOf(rec,C.prototype);
    return rec;
  }
  static load(rec){
    const K=rec&&kindOf(this.prototype.shape,this.kindId(rec));
    if(!K)return null;
    if(K.defaults)for(const [f,v] of Object.entries(K.defaults))if(!(f in rec))rec[f]=structuredClone(v);
    return this.as(rec);
  }
}
// the story's own store in the world (§3.8): W.story, made with the first thing in it (a thread, a gathering's calendar), saved by
// each shape's own piece (story/thread.js, story/gathering.js) only once it holds anything
const storyW=()=>W.story||(W.story={});
