'use strict';
/* ---------- the Thread shape (doc/STORY_DESIGN.md §2, §3.6, §3.10; the story wave, S5: the framework only) ----------
   A thread is a story tying several happenings into steps, sharing what it knows (its memory: who, where, what was found). Its
   kinds (defineKind('thread', id, {n, steps, first})) are data; the game has none yet (the chain quests and Ander The Fallen
   will be the first: doc/IMPLEMENTATION_PLAN.md §10.7–10.8). Each step: {id, start, until, how, remember, then}:
   - start: what the step begins (Thread.starters), its fields plain or functions of the thread (th=>th.memory.town):
       {quest: kind, town, lord}: a job offered at the town (none: the memory's town), by the lord if named, and taken;
       {encounter: kind, x, y}: one on the road there (none: a spot of its own ground ahead of you);
       {incident: kind}: it befalls you, over at once;
       {page: {ico, title, text, choices}}: a page of choices (Choice specs, each its how), shown when you are free on the map;
     none: the step only waits;
   - until: the world event that ends it (core/bus.js), 'type' or {on: 'type', match(d, th)}; none: the end of what it began
     (its starter's event, for the very one it began: its shape and id);
   - how(d, th): the key it branches by (none: the event's own how: a quest 'paid' or 'failed', an encounter 'done' or 'left',
     a page's choice its how);
   - remember(d, th): what it learnt, put into the memory;
   - then: the next step's id, or {how: id} a branch (a key not there, or null: the thread ends).
   Its record (W.story.threads.on): {k, i, day (begun), at (the step under way), wait ({shape, id}: what it waits for), memory,
   past ([step, how] each done)}. Thread.start(id, memory) begins one (or an outcome's start: {thread, memory}). Never ticked:
   it hears the bus (Thread.heard), only for the events its steps wait for; it ends when its last step ends ('thread:ended',
   {e, how}). */
class Thread extends Happening{
  get shape(){
    return 'thread';
  }
  step(id){
    return this.kind.steps.find(s=>s.id===id)||null;
  }
  get current(){
    return this.step(this.at);
  }
  // (a field of a step: plain, or a function of the thread)
  param(v){
    return typeof v==='function'?v(this):v;
  }
  // ---- a step begun: what it waits for heard on the bus, then what it begins (none could be begun: it is over, 'unstarted')
  begin(id){
    const s=this.step(id);
    this.at=id;
    this.wait=null;
    Thread.hear(Thread.until(s));
    if(!s.start)return;
    const v={};
    for(const [f,x] of Object.entries(s.start))v[f]=f==='page'?x:this.param(x);
    const r=Thread.starters[Thread.starterOf(s)].start(v,this);
    if(r&&r.shape)this.wait=r;
    else this.passed(r?r.how:'unstarted');
  }
  // (is the event about what this step waits for: the very happening it began)
  waits(d){
    const w=this.wait;
    return !!w&&!!d&&!!d.e&&d.e.shape===w.shape&&d.e.id===w.id;
  }
  // the step under way is over (how: its key): what it learnt remembered, then the next step, or the end
  passed(how,d){
    const s=this.current;
    if(s.remember)Object.assign(this.memory,s.remember(d,this));
    this.past.push([s.id,how]);
    const next=Thread.next(s,how);
    if(next)this.begin(next);
    else this.end(how);
  }
  end(how){
    this.at=null;
    this.wait=null;
    this.how=how;
    const L=Thread.list();
    L.on=L.on.filter(x=>x!==this);
    this.announceEnd(how);
  }
  // ---- its page (a page step's: story/choice.js ChoicePage); no way out till chosen
  get pageSpec(){
    const s=this.current;
    return s&&s.start&&s.start.page||null;
  }
  choices(){
    const p=this.pageSpec;
    return p?Choice.list(p.choices||[]):[];
  }
  page(){
    const p=this.pageSpec,K=this.kind;
    if(!p)return null;
    return {ico:p.ico||'scroll',title:this.param(p.title)||K.n,sub:K.n+' · day '+G.day,msg:'',text:this.param(p.text)||'',
      choices:this.choices(),subject:this,act:'thr-do',done:false,close:null};
  }
  // shown when you are free on the map (true); else it waits for whoever opens it later (Thread.paged)
  showPage(){
    if(G.modal||G.mode!=='world'||!this.pageSpec)return false;
    G.thread=this;
    G.mode='story';
    CHOICE_PAGE.show(this.page(),'thread:'+this.i);
    return true;
  }
  // ---- the live threads (W.story.threads: {n (the last number given), on}), and starting one
  static store(){
    const S=storyW();
    return S.threads||(S.threads={n:0,on:[]});
  }
  static list(){
    return W.story&&W.story.threads||{n:0,on:[]};
  }
  static start(id,memory){
    const K=kindOf('thread',id);
    if(!K)return null;
    const L=this.store(),th=this.as({k:id,i:++L.n,day:G.day,at:null,wait:null,memory:{...(memory||{})},past:[]});
    L.on.push(th);
    th.begin(K.first||K.steps[0].id);
    return th;
  }
  // those with a page waiting to be shown
  static paged(){
    return this.list().on.filter(th=>th.pageSpec);
  }
  // ---- a step's starter, the event it waits for, the next step by its key
  static starterOf(s){
    return s.start?Object.keys(this.starters).find(k=>k in s.start)||null:null;
  }
  static until(s){
    const u=s.until;
    if(u)return typeof u==='string'?u:u.on;
    const k=this.starterOf(s);
    return k?this.starters[k].until:null;
  }
  static next(s,how){
    const t=s.then;
    if(t===undefined||t===null)return null;
    if(typeof t==='string')return t;
    return Object.prototype.hasOwnProperty.call(t,how)?t[how]:null;
  }
  // ---- the bus: each event a step waits for listened to once (more as new kinds' steps need them)
  static hear(type){
    if(!type||this.ears.has(type))return;
    this.ears.add(type);
    worldOn(type,d=>Thread.heard(type,d));
  }
  // (an event heard: every live thread whose step waits for it, in order, decides whether it is its own)
  static heard(type,d){
    for(const th of this.list().on.slice()){
      const s=th.current;
      if(!s||Thread.until(s)!==type)continue;
      const u=s.until,hit=u&&u.match?u.match(d,th):th.waits(d);
      if(hit)th.passed(s.how?s.how(d,th):d&&d.how,d);
    }
  }
}
Thread.ears=new Set();
/* the starters: what a step can begin; each start(v, th) gives what to wait for ({shape, id}), or {how} when it is over already,
   or null when it could not be begun; until: the event that ends what it began */
Thread.starters={
  quest:{
    until:'quest:ended',
    start(v,th){
      const t=townBy(v.town||th.memory.town),lord=v.lord?W.lords.find(l=>l.name===v.lord):null,q=t&&Quest.make(v.quest,t,lord);
      return q&&q.accept()?{shape:'quest',id:q.id}:null;
    },
  },
  encounter:{
    until:'encounter:ended',
    start(v){
      const at=v.x!=null?[v.x,v.y]:roadSpot(kindOf('encounter',v.encounter).on);
      const e=at&&roadSpawn(v.encounter,at[0],at[1]);
      return e?{shape:'encounter',id:e.i}:null;
    },
  },
  incident:{
    until:null,
    start(v){
      Incident.befall(kindOf('incident',v.incident),storyCtx());
      return {how:'over'};
    },
  },
  page:{
    until:'page:chosen',
    start(v,th){
      th.wait={shape:'thread',id:th.i};
      th.showPage();
      return th.wait;
    },
  },
};
/* a page's choice (thr-do, its place in the list; '!' once its confirm is answered): done, the page closed, and the step told
   on the bus ('page:chosen', {e, how: the choice's how, else its place}) */
function threadAct(a,arg){
  const th=G.thread;
  if(G.mode!=='story'||!th)return;
  if(a==='thr-back'){
    th.showPage();
    return;
  }
  if(a!=='thr-do')return;
  const cs=th.choices(),c=CHOICE_PAGE.choose(cs,arg,th);
  if(!c)return;
  const i=parseInt(arg);
  if(c.asks(th)&&!String(arg).endsWith('!'))return CHOICE_PAGE.confirm(c,th,{sub:th.kind.n,act:'thr-do',i,back:['thr-back',null,'Back']});
  const m=c.perform(th);
  if(m)log(m);
  G.thread=null;
  // (closed, unless what it did opened something else: a fight)
  if(G.mode==='story'){
    G.mode='world';
    hidePanel();
  }
  updateHUD(true);
  worldEmit('page:chosen',{e:th,how:c.how!==undefined?c.how:String(i)});
}
onAct('thr-',threadAct);
/* the save: W.story.threads once one has begun (none: as every save before it; the save registry, core/saves.js); each loaded
   wrapped by its kind's class (one whose kind is gone dropped), and the events its steps wait for listened to again */
Saves.add({key:'threads',order:250,defaults:null,
  save:()=>{
    const L=W.story&&W.story.threads;
    return L&&L.n?{n:L.n,on:L.on.map(th=>th.save())}:undefined;
  },
  load:v=>{
    if(!v)return;
    v.on=v.on.map(r=>Thread.load(r)).filter(th=>th&&th.current);
    storyW().threads=v;
    for(const th of v.on)Thread.hear(Thread.until(th.current));
  }});
