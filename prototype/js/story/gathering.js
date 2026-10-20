'use strict';
/* ---------- the Gathering shape (doc/STORY_DESIGN.md §2, §3.3; the story wave, S5: the framework only) ----------
   A gathering is held at a place on set days, announced ahead, open to enter. Its kinds (defineKind('gathering', id, spec)) are
   data; the game has none yet (the tournaments will be the first: doc/TOURNAMENTS_DESIGN.md). The spec:
   - n, ico, text: its name, icon and what its page says;
   - places(): the places it is held at (holdings' names), read when the calendar is planned;
   - schedule: {every: N} (every N days at each place, on the days that fall on its offset: seeded by the world, the kind and the
     place, Rng.seedOf, no draw from any stream) or {day: D} (that day of the year, CLOCK.year days: Clock.dayOfYear);
   - announce: the days ahead it is told of (0: on the day it opens); lasts: the days it is open (1 by default);
   - fee: its entry's cost in gold (none: free); choices: its page's own (Choice specs; none: Enter).
   Its record: {k, i, at (the place), open (the day it opens), close (the day it is over: lasts days on), st ('planned',
   'announced', 'open'), due (the day of its next change), entrants (who entered: 'you', or a name; enter(who))}.
   The calendar (W.story.gatherings: {n, on}) keeps every coming one sorted by its due day (then its number), so the day's check
   reads only its head (O(1) while nothing is due): the system "gatherings", last in the day. Each change is told on the bus:
   'gathering:announced', 'gathering:opened', 'gathering:closed' ({e, at, day: the day it opens; closed: the day it closed}),
   for the rumours and notices to listen to. Once closed, the next at that place is put on the calendar. */
class Gathering extends Happening{
  get shape(){
    return 'gathering';
  }
  get endEvent(){
    return 'gathering:closed';
  }
  // ---- its change, once due: announced, then open, then closed (the next one planned)
  advance(C){
    if(this.st==='planned'){
      this.st='announced';
      this.due=this.open;
      worldEmit('gathering:announced',{e:this,at:this.at,day:this.open});
      Gathering.file(C,this);
    }else if(this.st==='announced'){
      this.st='open';
      this.due=this.close;
      worldEmit('gathering:opened',{e:this,at:this.at,day:this.open});
      Gathering.file(C,this);
    }else{
      this.st='closed';
      worldEmit(this.endEvent,{e:this,at:this.at,day:this.close});
      Gathering.plan1(C,this.kind,this.at,this.close);
    }
  }
  // ---- entering: 'you', or another's name (once each; only while it is announced or open)
  enter(who){
    if(this.st!=='announced'&&this.st!=='open'||this.entrants.includes(who))return false;
    this.entrants.push(who);
    return true;
  }
  // ---- its page (story/choice.js ChoicePage): when and where, who entered, its choices
  when(){
    if(this.st==='open')return 'open till day '+(this.close-1);
    return 'opens on day '+this.open+(this.open>G.day?' (in '+(this.open-G.day)+' days)':'');
  }
  choices(){
    return Choice.list(this.kind.choices||Gathering.entry(this.kind));
  }
  page(){
    const K=this.kind;
    return {ico:K.ico||'banner',title:K.n,sub:this.at+' · '+this.when(),msg:G.gatherMsg||'',text:K.text||'',
      facts:[this.entrants.length+' entered',this.entrants.includes('you')&&'you among them'],choices:this.choices(),subject:this,act:'gth-do',
      done:false,close:['gth-close',null,'Leave']};
  }
  show(){
    if(G.mode!=='story')G.gatherBack=G.mode;
    G.gather=this;
    G.mode='story';
    CHOICE_PAGE.show(this.page(),'gathering:'+this.i);
  }
  // (the plain entry: the fee paid, you on the list)
  static entry(K){
    return [{icon:'banner',label:'Enter',
      need:g=>g.st!=='open'&&g.st!=='announced'?'Not open':g.entrants.includes('you')?'You have entered':K.fee&&P.gold<K.fee?'Not enough gold':'',
      out:g=>({...(K.fee?{gold:-K.fee}:{}),call:()=>g.enter('you'),say:'You enter the '+K.n.toLowerCase()+'.'})}];
  }
  // ---- the calendar: W.story.gatherings, made with the first planned
  static store(){
    const S=storyW();
    return S.gatherings||(S.gatherings={n:0,on:[]});
  }
  static list(){
    return W.story&&W.story.gatherings||{n:0,on:[]};
  }
  // the coming and running ones at a place, by when they open
  static at(place){
    return this.list().on.filter(g=>g.at===place).sort((a,b)=>a.open-b.open);
  }
  // (put in its place by its due day, then its number: a binary search)
  static file(C,g){
    const key=x=>x.due*1e6+x.i;
    let lo=0,hi=C.on.length;
    while(lo<hi){
      const mid=(lo+hi)>>1;
      if(key(C.on[mid])<key(g))lo=mid+1;
      else hi=mid;
    }
    C.on.splice(lo,0,g);
  }
  // the first day it opens at the place, from day from on
  static opens(K,at,from){
    const s=K.schedule;
    if(s.day){
      const y=CLOCK.year;
      return from+((s.day-Clock.dayOfYear(from))%y+y)%y;
    }
    const n=s.every,o=Rng.seedOf('gathering:'+K.id+':'+at)%n;
    return from+((o-from)%n+n)%n;
  }
  // (the next one of a kind at a place, opening from day from on: its record on the calendar)
  static plan1(C,K,at,from){
    const open=this.opens(K,at,from),g=this.as({k:K.id,i:++C.n,at,open,close:open+(K.lasts||1),st:'planned',due:open-(K.announce||0),entrants:[]});
    this.file(C,g);
    return g;
  }
  // every kind at each of its places with none coming planned, the first told of from tomorrow on (once a calendar, and again
  // when kinds are added: Gathering.planned, never saved)
  static plan(C){
    const kinds=Kinds.all('gathering');
    if(this.planned.get(C)===kinds.length)return;
    this.planned.set(C,kinds.length);
    for(const K of kinds){
      for(const at of K.places()){
        if(!C.on.some(g=>g.k===K.id&&g.at===at))this.plan1(C,K,at,G.day+1+(K.announce||0));
      }
    }
  }
  // the day's check: every one due today changes (none: nothing done, and no calendar made while there are no kinds)
  static day(){
    if(!Kinds.all('gathering').length)return;
    const C=this.store();
    this.plan(C);
    while(C.on.length&&C.on[0].due<=G.day)C.on.shift().advance(C);
  }
}
Gathering.planned=new WeakMap();
// its page's choices (gth-do, its place; '!' once its confirm is answered) and the way out (gth-close: back where you were)
function gatheringAct(a,arg){
  const g=G.gather;
  if(G.mode!=='story'||!g)return;
  if(a==='gth-close'){
    G.gather=null;
    G.gatherMsg='';
    G.mode=G.gatherBack||'world';
    hidePanel();
    return;
  }
  if(a==='gth-back'){
    g.show();
    return;
  }
  if(a!=='gth-do')return;
  const cs=g.choices(),c=CHOICE_PAGE.choose(cs,arg,g);
  if(!c)return;
  if(c.asks(g)&&!String(arg).endsWith('!'))return CHOICE_PAGE.confirm(c,g,{sub:g.kind.n,act:'gth-do',i:parseInt(arg),back:['gth-back',null,'Back']});
  G.gatherMsg=c.perform(g)||'';
  updateHUD(true);
  g.show();
}
onAct('gth-',gatheringAct);
// the day's check: last of the day's systems, after every other (so none of theirs moves)
Systems.add({name:'gatherings',order:{day:240},day:()=>Gathering.day()});
/* the save: the calendar once it holds any (none: as every save before it; the save registry, core/saves.js); each loaded wrapped
   by its kind's class (one whose kind is gone dropped), in its order again */
Saves.add({key:'gatherings',order:260,defaults:null,
  save:()=>{
    const C=W.story&&W.story.gatherings;
    return C&&C.on.length?{n:C.n,on:C.on.map(g=>g.save())}:undefined;
  },
  load:v=>{
    if(!v)return;
    const on=v.on.map(r=>Gathering.load(r)).filter(Boolean);
    v.on=[];
    for(const g of on)Gathering.file(v,g);
    storyW().gatherings=v;
  }});
