'use strict';
/* ---------- escorts: a passenger in your band, seen safe to a place (doc/IMPLEMENTATION_PLAN.md §10.7, doc/STORY_DESIGN.md §9) ----------
   An escort is a quest kind, 'escort' (EscortQuest, on the Quest shape: story/quest.js), begun by a choice's outcome
   ({passenger: spec}: story/outcome.js; the lost child, the refugees: world/encounters.js roadEscort), by a thread's step
   ({start: {quest: 'escort', spec}}: story/thread.js), or offered at a holding as a job (no spec: a traveller of the holding to
   another, ESCORT.offer). Its numbers and lines: data/encounters.js ESCORT.
   - The passenger rides inside your band: listed on the party card (world/supply.js supplyNow's tag) and in the Party window
     (Escort.html), eating with you (Escort.foodHour, world/supply.js), never fighting, taking no troop slot, no target of its
     own (no figure on the map, none in battle). At most ESCORT.max at once; escorts are not jobs (Quest.jobs does not count them):
     a side quest (story/quest.js, the quest model), never yours to abandon, still failing by the world (late, captured).
   - spec: {who (ESCORT.who: child, refugees, traveller), n (its name: the kind's), eat (food a day: the kind's), to {town, lot
     (none: the holding; 'house' or an estate's key: one of its lots, i choosing which, no draw)}, days (none: the way's tiles ÷
     ESCORT.pace + slack), prize (the outcome on arrival), forfeit (on failing: reputation at its place), at {x, y} (where it
     begins: the way's length; none, you); a chain's may add forfeits (by fate: captured …), say (its own lines, as a kind's;
     scattered: its captured line when no one took him), quiet (no page of its own on arrival: the chain's next page speaks),
     open (no due day: Ander) and rescue (carried off, he is held: world/captives.js carryOff, his holder on its record, by)}.
   - It is a chain's step kind (story/steps.js StepQuest: its place, arrival, prize, failing and lines are the steps' own).
   - Its record is the quest's, saved with P.quests as it is: {type: 'escort', who, pn (its name), eat, to {k (holding, house,
     estate), town, lot, x, y, name}, prize, forfeit, days, due, title, text, reward (for the panels), fate (once over)}.
   - It ends one of four ways, each with its line (its kind's, else ESCORT.say's):
     arrival: within ESCORT.reach of its place on the map (story/steps.js Steps.frame, each moment: world/road.js updateRoad), or entering its
       holding (arrive): its prize applied, its page shown (Ride on), paid: fate 'arrived';
     deadline: its due day passed (the quests' day: lapse): failed, fate 'late' (it goes on alone);
     a battle lost while it rides with you (battle:ended, lost: battle/resolution.js): failed, fate 'captured' (carried off by the
       victors; a rescue's holder kept on its record, by: his chain rescues him, story/wounded.js);
     given up (abandon: a story dropping its stage; never your Quests' Abandon): failed, fate 'left' (set down by the road).
     A failure applies its forfeit. Then the bus's quest:ended {e, how: 'paid' or 'failed'}, and e.fate says which way: what a
     thread's step branches by (how: d=>d.e.fate). ---------- */
class EscortQuest extends StepQuest{
  // (not a job: its own limit, ESCORT.max)
  full(){
    return Escort.list().length>=ESCORT.max;
  }
  setup(t,lord,spec){
    const s=spec||Escort.offer(t),to=s&&StepQuest.place(s.to);
    if(!to)return false;
    const K=Escort.who(s.who),o=s.prize||{},g=o.gold||0;
    this.who=s.who||'traveller';
    this.pn=s.n||K.n;
    this.eat=s.eat!=null?s.eat:K.eat;
    this.to=to;
    this.giver=cap1(this.pn);
    this.home=to.town;
    this.fac=townBy(to.town).owner;
    this.days=s.open?0:Escort.days(s,to);
    this.prize=o;
    this.forfeit=s.forfeit||{rep:[to.town,-ESCORT.forfeit]};
    this.title='Escort '+this.pn+' to '+to.name;
    this.text=cap1(this.pn)+' rides with you, to be seen safe to '+to.name+'.';
    this.reward={gold:Outcome.amount(g),rep:o.rep?o.rep[1]:0,honor:o.honor?o.honor[1]:0,xp:o.xp||0};
    if(s.forfeits)this.forfeits=s.forfeits;
    if(s.say)this.lines=s.say;
    if(s.quiet)this.quiet=true;
    if(s.rescue)this.rescue=true;
  }
  begin(){
    this.x=this.to.x;
    this.y=this.to.y;
  }
  todo(){
    return 'Bring '+this.pn+' to '+this.to.name+'.';
  }
  rewardLine(){
    return Outcome.describe(this.prize)||'their thanks';
  }
  // ---- there (story/steps.js: near its place, or entering its holding): paid, its page (none when quiet); failing: late (its due
  // day), captured (a battle lost), left (abandoned): the steps' own, its lines its kind's (Escort.say)
  get reaches(){
    return true;
  }
  shown(line){
    if(!this.quiet)Escort.show(this,line);
  }
  lapse(){
    if(this.days&&G.day>this.due)this.fail(null,'late');
  }
  // (carried off by no one, beasts: its scattered line, if it has one)
  say(k){
    return super.say(k==='captured'&&this.by&&this.by.k==='none'&&this.lines&&this.lines.scattered?'scattered':k);
  }
  sayOf(k){
    const K=Escort.who(this.who);
    return (K.say&&K.say[k])||ESCORT.say[k]||'';
  }
}
defineKind('quest','escort',{cls:EscortQuest});
/* the escorts in your band: who rides with you, starting one, its place and days, what it eats, the frame's arrival, a battle
   lost, and their words (the card, the Party window, an outcome's facts, its page) */
const Escort={
  list(){
    return P.quests.filter(q=>q.type==='escort').map(q=>Quest.as(q));
  },
  // (why no more can ride with you: '' when one can)
  why(){
    return Escort.list().length>=ESCORT.max?'You have no room for another passenger.':'';
  },
  who(k){
    return ESCORT.who[k]||ESCORT.who.traveller;
  },
  // one begun from its spec (an outcome's passenger): given at its place's holding; the quest, or null
  start(spec){
    const t=townBy(spec.to&&spec.to.town),q=t&&Quest.make('escort',t,null,spec);
    return q&&q.accept()?q:null;
  },
  // its place: the holding, or one of its lots (a house, an estate: the i-th of them that stands, its door); null: none (the
  // steps': story/steps.js StepQuest.place)
  place(to){
    return StepQuest.place(to);
  },
  // the days given: the spec's, else the way from where it begins (none: you) ÷ pace, and slack more
  days(s,to){
    const at=s.at||P;
    return s.days||Math.ceil(Math.hypot(to.x-at.x,to.y-at.y)/TILE/ESCORT.pace)+ESCORT.slack;
  },
  // a traveller of t asks to be seen to a holding not hostile to you, offer.min–max tiles off (the jobs' stream: the offer's draw)
  offer(t){
    const O=ESCORT.offer,ps=TOWNS.filter(o=>o!==t&&!hostileTo(o.owner)&&qTiles(o,t)>=O.min&&qTiles(o,t)<=O.max);
    if(!ps.length)return null;
    const d=questRng().pick(ps);
    return {who:'traveller',to:{town:d.name},prize:{gold:Math.round((O.gold+O.per*qTiles(d,t))*qScale()*.7),rep:[t.name,O.rep]},forfeit:{rep:[t.name,-ESCORT.forfeit]},at:{x:t.x,y:t.y}};
  },
  // what they eat: food a day, all of them; an hour of it (as the band's: world/parties.js foodHour)
  eatDay(){
    let n=0;
    for(const q of P.quests)if(q.type==='escort')n+=q.eat||0;
    return n;
  },
  foodHour(moving){
    const n=Escort.eatDay();
    return n?n/24*(moving?SUPPLY.eat.march:SUPPLY.eat.rest):0;
  },
  // a battle lost (e: its encounter): each passenger carried off by the victors; a rescue's held by them (by)
  lost(e){
    for(const q of Escort.list()){
      if(q.rescue)q.by=carryOff(e,q.id,q.pn);
      q.fail(null,'captured');
    }
  },
  // ---- the words: its line ({N}, {n}, {to}, {town}: its own, else its kind's, else ESCORT.say's); the way there from you; its
  // facts (an outcome's: story/outcome.js)
  say(q,k){
    return Quest.as(q).say(k);
  },
  left:q=>q.days?Math.max(0,q.due-G.day)+' days left':'no hurry',
  way(q){
    const d=Math.round(Math.hypot(q.to.x-P.x,q.to.y-P.y)/TILE);
    return d<2?'just here':d+' tiles to the '+compass(q.to.x-P.x,q.to.y-P.y);
  },
  facts(s){
    const to=Escort.place(s.to);
    if(!to)return [];
    const p=Outcome.describe(s.prize||{});
    return ['escort '+(s.n||Escort.who(s.who).n)+' to '+to.name+(s.open?', in your own time':' within '+Escort.days(s,to)+' days'),p&&'there: '+p];
  },
  // ---- shown: the card's tag (world/supply.js), the Party window's rows (ui/character.js), its page on arrival
  tag(){
    const L=Escort.list();
    if(!L.length)return null;
    return ['Escort'+(L.length>1?' ×'+L.length:''),'good',L.map(q=>cap1(q.pn)+' rides with you to '+q.to.name+' ('+Escort.left(q)+')').join('. ')+'. They eat '+Math.round(Escort.eatDay()*100)/100+' food a day, do not fight and take no place in your ranks.'];
  },
  html(){
    const L=Escort.list();
    if(!L.length)return '';
    return '<div class="lab" style="margin-top:6px">Passengers ('+L.length+' / '+ESCORT.max+')</div>'+L.map(q=>'<div class="row"><div class="info"><strong>'+cap1(q.pn)+'</strong><small>To '+q.to.name+', '+Escort.way(q)+' · '+Escort.left(q)+' · eats '+q.eat+' food a day · does not fight</small></div></div>').join('');
  },
  show(q,line){
    if(G.mode!=='world'||G.modal)return;
    G.escort=q;
    G.mode='story';
    CHOICE_PAGE.show({ico:Escort.who(q.who).ico,title:'Escort: '+cap1(q.pn),sub:q.to.name+' · day '+G.day,text:line,facts:[Outcome.describe(q.prize)],choices:[],subject:q,act:'pas-do',done:true,close:['pas-close',null,'Ride on']},'escort:'+q.id);
  },
};
// (its page's way out: back on the map)
onAct('pas-',a=>{
  if(a!=='pas-close'||G.mode!=='story'||!G.escort)return;
  G.escort=null;
  G.mode='world';
  hidePanel();
});
// a battle lost with passengers aboard (battle/resolution.js: battle:ended)
worldOn('battle:ended',d=>{
  if(d&&d.how==='lost')Escort.lost(d.enc);
});
