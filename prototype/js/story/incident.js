'use strict';
/* ---------- the Incident shape (doc/STORY_DESIGN.md §2; the story wave, S2) ----------
   An incident befalls you: no one to meet and nothing on the map; it applies at once (a log line) and is over. Its kinds
   (world/events.js: the weather, the sickness, the finds) are plain data, registered with the trigger 'day' (the daily roll):
     w: its weight; ok(c): can it come here and now (c: the story context, storyCtx: its climate…);
     run(c): what it does: an outcome (story/outcome.js; its log line in it, as {log: [line, tone]}), any roll made first;
       or [line, tone], a line only.
   Incident.pick(kinds, c): of those whose ok(c) holds, one by weight (one draw), or null; Incident.befall(kind, c): it happens
   to you (its record, {k}, made one of this class: Happening.as), and is over at once ('incident:ended' on the bus). */
class Incident extends Happening{
  get shape(){
    return 'incident';
  }
  // it befalls you: its kind's run done (its outcome applied, or its line logged), and it is over
  befall(c){
    const r=this.kind.run(c);
    if(Array.isArray(r))this.say(r[0],r[1]);
    else Outcome.apply(r,{e:this});
    this.announceEnd();
    return this;
  }
  // (one by weight, from the stream 'incidents': core/rng.js)
  static pick(kinds,c){
    const ok=kinds.filter(K=>K.ok(c));
    let r=rngOf('incidents').next()*ok.reduce((a,K)=>a+K.w,0),hit=ok[0];
    for(const K of ok){
      r-=K.w;
      if(r<=0){
        hit=K;
        break;
      }
    }
    return hit||null;
  }
  static befall(K,c){
    return this.as({k:K.id}).befall(c);
  }
}
