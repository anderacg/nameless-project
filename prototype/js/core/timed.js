'use strict';
/* ---------- timed states: a state that lasts so many days (doc/CORE_DESIGN.md, K2) ----------
   A view over the fields the game already saves, each holding the day its state ends (0 or missing: not in it), so the saved
   data stays exactly as it was:
   - a holding's own fields: Timed.of(t).has('fear') reads t.fear (and 'raided', 'sacked', 'turmoil');
   - a map of them in a field: Timed.of(P,'hostile').has(fac) reads P.hostile[fac] (hostility per realm: realms.js hostileTo),
     Timed.of(t,'mem').has(id) a holding's memory of you (its workers' and its estates': folk.js remembers).
   A state is on while its end day is still ahead: (end||0) > G.day, the old until(t,k) (siege.js, kept as its alias).
   set(state, days) ends it days from today; extend(state, days) only ever moves its end later (the Math.max(…) setters);
   clear(state) ends it now (a record's own field set to 0, as the holdings keep it; a map's entry deleted). A map field is
   made only when a state is first set, so a record that never had one saves as before.
   onEnd: optional, (state, record) => …, run by check() for each state whose end day is today; check() changes nothing
   (whoever wants the announcement calls it once a day, after the day's tick). */
class TimedView{
  constructor(record,field){
    this.record=record;
    this.field=field||null;
    this.onEnd=null;
  }
  // the object the states live on: the record itself, or the map in its field (made when make is true)
  states(make){
    if(!this.field)return this.record;
    const r=this.record;
    if(!r[this.field]&&make)r[this.field]={};
    return r[this.field]||null;
  }
  // the day the state ends (0: not in it)
  end(state){
    const m=this.states(false);
    return m&&m[state]||0;
  }
  has(state){
    return this.end(state)>G.day;
  }
  // the days left in it (0 when it is over)
  daysLeft(state){
    return Math.max(0,this.end(state)-G.day);
  }
  set(state,days){
    this.states(true)[state]=G.day+days;
  }
  extend(state,days){
    const m=this.states(true);
    m[state]=Math.max(m[state]||0,G.day+days);
  }
  clear(state){
    if(this.field){
      const m=this.states(false);
      if(m)delete m[state];
    }else this.record[state]=0;
  }
  // the states that end today (list: the names to look at; a map's own keys by default)
  ending(list){
    const m=this.states(false);
    if(!m)return [];
    return (list||Object.keys(m)).filter(k=>m[k]===G.day);
  }
  // onEnd for each state that ends today
  check(list){
    const ended=this.ending(list);
    if(this.onEnd)for(const k of ended)this.onEnd(k,this.record);
    return ended;
  }
}
const Timed={
  // one view per record and field, made once (they are read every frame: folk.js)
  views:new WeakMap(),
  of(record,field){
    let byField=this.views.get(record);
    if(!byField)this.views.set(record,byField=new Map());
    const key=field||'';
    let v=byField.get(key);
    if(!v)byField.set(key,v=new TimedView(record,field));
    return v;
  },
};
