'use strict';
/* ---------- The Wounded Traveller: the first story chain, and Ander The Fallen, its rare variant (doc/STORY_DESIGN.md §9,
   doc/IMPLEMENTATION_PLAN.md §10.7–10.8; the owner, 2026-10-19 and 2026-10-23; the story batch, ST2) ----------
   1. Heal him: the road's wounded traveller (world/encounters.js traveller: Tend his wounds). He stands, bandaged, and his page
      offers (its next page, Wounded.offer): Join you (a first-tier soldier of his people), Take him home (the thread below
      begins), or Refuse (he limps off; a little reputation lost at his home). Ander (WOUNDED.ander.p × HIDDEN_RATE of them,
      never twice a game) offers no Join: see him home and clear the bandits who hurt him, and he joins you as a companion.
   2–7. The thread 'wounded' (story/thread.js), on the reusable step kinds (story/steps.js):
      escort  {quest: 'escort'}: him to his family's door (a house or an estate of a holding WOUNDED.home off), quiet (its next
              page speaks); late (his due day: rep lost at home; Ander has none) or left (abandoned) end the chain, each with
              its line; captured (a battle lost: morale lost) goes on to his rescue (below);
      family  a page: his family tells you who hurt him (a gang of the band of the land where he lay); promise, or ride on;
      tracks  {step: 'visit'}: back to where you found him; there the trail binds the chain to the nearest hideout of that band
              (Wounded.trail: marked on your map);
      trail   a page: ride for it, or let it lie; no hideout anywhere: the trail is cold, back to the family;
      clear   {step: 'lair'}: that hideout cleared (cleared by another or gone: the nearest of its band instead, else over);
      back    {step: 'visit'}: back to the family's door;
      reward  a page: the heirloom (ITEMS.hearthring, once a game; after it, gold), reputation and renown; Ander joins you.
   The rescue (the owner, 2026-10-23: no deadline; world/captives.js carryOff says who holds him):
      held    {step: 'held'} (story/steps.js HeldQuest): the band that beat you carries him (beat it; after WOUNDED.rescue.home
              days it takes him to its hideout: clear that), the hideout or camp you stormed keeps him (clear it), or a realm's
              men took him to their holding (pay WOUNDED.rescue.ransom at its gates, or take it). Freed: the chain ends there
              and picks itself up at the escort (Wounded.resume; from where you are, a fresh due day: no step loops back), or,
              no room for him, the call. Given up (abandoned): an ordinary traveller's chain is over;
      call    {step: 'visit'}: no one took him (beasts), or his holder was destroyed by another: he made his own way home; to
              his family's door, and on at the family's page.
   Ander is never lost (but dying unhealed): every end of his chain but the reward sends him wandering the taverns (Wanderer,
   below): refused, no passenger room (he offers to meet you later), abandoned, Ride on, Let it lie, slipped away, freed by
   others, a rescue given up.
   Its memory: {name, race, ander, at {x, y} (where he lay), home {town, lot, i}, town (his home's), band (bandits, raiders,
   bog), gang (its name), site (the hideout's i; null: none), lair (its name), lx, ly, held (who holds him: carryOff's record),
   freed (freed by you: his escort from where you are), alone (he came home on his own)}. A thread begun without it (the tests'
   generic walk) reads the memory's town and x, y. Its words and outcomes are here; its numbers: data/chains.js WOUNDED. Nothing
   here draws a random number ---------- */
// (a step's key: its quest's fate, else the event's how)
const fateOf=d=>d&&d.e&&d.e.fate||d&&d.how;
const Wounded={
  // ---- who he is: Ander, free only once a game and while none lies on the road or rides in a chain
  anderFree(){
    return !Thread.once('ander')&&!roadList().some(o=>o.ander&&!o.gone)&&!Thread.list().on.some(th=>th.memory.ander);
  },
  // (a wounded traveller come on the road: Ander WOUNDED.ander.p × HIDDEN_RATE of the time, by a hash of his number and seed, no
  // draw: the road's stream is as it was)
  met(e){
    if(Wounded.anderFree()&&Rng.seedOf('ander:'+e.i+':'+e.seed)/4294967296<WOUNDED.ander.p*HIDDEN_RATE)Wounded.ander(e);
  },
  ander(e){
    e.ander=1;
    e.race='human';
  },
  nameOf(e){
    if(e.ander)return 'Ander';
    const L=WOUNDED.names[e.race]||WOUNDED.names.human;
    return L[e.seed%L.length];
  },
  // his family's place (by his seed, no draw: one of the nearest holdings not hostile to you WOUNDED.home off, a house or an estate)
  homeOf(e){
    if(e.home)return e.home;
    const H=WOUNDED.home,ok=t=>!hostileTo(t.owner),d=t=>Math.hypot(t.x-e.x,t.y-e.y)/TILE;
    const near=TOWNS.filter(t=>ok(t)&&d(t)>=H.min&&d(t)<=H.max).sort((a,b)=>d(a)-d(b)).slice(0,H.near);
    const t=near.length?near[e.seed%near.length]:Spatial.nearestHolding(e.x,e.y,ok)||Spatial.nearestHolding(e.x,e.y);
    const es=(t.lots||[]).filter(l=>ESTATES[l.k]&&l.st!=='ruined');
    return e.seed%H.estate===0&&es.length?{town:t.name,lot:es[e.seed%es.length].k,i:e.seed}:{town:t.name,lot:'house',i:e.seed};
  },
  troop(e){
    return (RACES[e.race]||RACES.human).melee;
  },
  // Tend his wounds done (world/encounters.js roadTend): his home kept, time to answer, Ander met
  healed(e){
    e.home=Wounded.homeOf(e);
    e.end=Math.max(e.end,roadNow()+WOUNDED.wait);
    if(e.ander)Thread.mark('ander');
  },
  memory(e){
    const h=Wounded.homeOf(e),m={name:Wounded.nameOf(e),race:e.race,at:{x:Math.round(e.x),y:Math.round(e.y)},home:h,town:h.town,band:roadBand(e.x,e.y),
      gang:BAND_NAMES[(e.seed>>2)%BAND_NAMES.length]};
    if(e.ander)m.ander=1;
    return m;
  },
  // ---- the thread's memory, read (a thread begun bare: its town, x and y)
  name:th=>th.memory.name||'the traveller',
  who:th=>th.memory.ander?'Ander The Fallen':Wounded.name(th),
  home:th=>th.memory.home||{town:th.memory.town,lot:'house',i:th.i},
  at:th=>th.memory.at||{x:th.memory.x,y:th.memory.y},
  gang:th=>'the '+(th.memory.gang||'bandits'),
  kin:th=>th.memory.ander?'his sister':'his family',
  // (his home in words: a house in Ashford, the farm by Ashford)
  place(th){
    const h=Wounded.home(th),E=h.lot&&h.lot!=='house'&&ESTATES[h.lot];
    return (E?'the '+E.n.toLowerCase()+' by ':'a house in ')+h.town;
  },
  // (the band's kind in words, and where they struck from his home)
  bandWord:th=>(LAIR_SAY[th.memory.band]||'Bandits').toLowerCase(),
  dir(th){
    const t=townBy(Wounded.home(th).town),a=Wounded.at(th);
    return t?compass(a.x-t.x,a.y-t.y):'south';
  },
  // ---- the steps' specs (story/steps.js, world/escort.js)
  // (from where he lay; freed, from where you are: a fresh due day; Ander's none: open)
  escort(th){
    const h=Wounded.home(th),n=Wounded.name(th),E=WOUNDED.escort,m=th.memory,a=m.ander;
    return {who:'traveller',n,to:h,...(m.freed?{}:{at:Wounded.at(th)}),open:!!a,rescue:true,quiet:true,prize:{rep:[h.town,E.rep]},forfeit:{rep:[h.town,-E.late]},forfeits:{captured:{morale:-E.morale}},
      say:a?{arrive:'Ander is at his sister’s door in {town}.',captured:'In the rout, your foes drag Ander off in chains. A sellsword of his name will fetch a price; wherever they hold him, he lives.',
        scattered:'In the rout, Ander slips away into the dark. A man like him lands on his feet: the taverns will hear of him.'}
        :{arrive:'{N} is home: the door of {to} flies open.',late:'Tired of waiting on you, {n} limps the rest of the way to {town} alone. His family will hear of it.',
        captured:'In the rout, your foes drag {n} off in chains. Wherever they hold him, he lives.',scattered:'In the rout, {n} slips away into the dark. He will make his own way home.'}};
  },
  // ---- the rescue: carried off (the escort's key: captured, held; no one took him (beasts): an ordinary traveller walks home,
  // Ander is loose, wandering); freed by you (the chain resumes at the escort; no room for him: he rides on alone), his holder
  // destroyed by another (alone, as by beasts)
  caught(d,th){
    const f=fateOf(d),by=d&&d.e&&d.e.by;
    return f==='captured'&&by&&by.k==='none'?Wounded.alone(th):f;
  },
  alone:th=>th.memory.ander?'loose':'walk',
  freed(d,th){
    const f=fateOf(d);
    return f==='freed'?Escort.why()?'ride':'freed':f==='gone'?Wounded.alone(th):f;
  },
  after(d){
    const f=fateOf(d);
    return f==='freed'?{held:null,freed:1,alone:Escort.why()?1:0}:f==='gone'?{held:null,alone:1}:{};
  },
  price:th=>WOUNDED.rescue.ransom[th.memory.ander?'ander':'traveller'],
  // (his rescue, story/steps.js HeldQuest: who holds him as he was carried off (none: the gaol of his home's holding), its lines)
  held(th){
    const n=Wounded.name(th),p=Wounded.price(th);
    return {held:th.memory.held,n,home:WOUNDED.rescue.home,price:p,title:'Free '+n,
      say:{band:'You cut {n} loose from the bandits’ ropes. He is free.',lair:'In the back of {to} you find {n}, chained and starved, but alive. He is free.',
        paid:'You count out the gold. {N} walks out of the gaol, blinking at the light.',taken:'In the gaol of {town} you find {n}, and strike off his chains.',
        home:'The band has taken {n} to {to}: it is marked on your map.',moved:'Its survivors have taken {n} to {to}: it is marked on your map.',
        gone:'Word comes that those who held {n} are scattered. In the confusion, he got away.',
        gaol:th.memory.ander?'“The sellsword?” The gaoler of {town} grins through the bars. “Ander the Fallen, they say. A name like that is worth '+p+' gold.”'
          :'The gaoler of {town} leans on the bars. “{N}? Aye, we have him. '+p+' gold, and he walks.”'}};
  },
  // (what to do now: by where he is, his rescue's own words)
  heldNote(th){
    const q=th.wait&&P.quests.find(x=>x.id===th.wait.id),Q=q&&Quest.as(q);
    return Q&&Q.held?{band:'Free '+Q.pn+' from '+Q.to.name+' (marked on your map) before they take him to their hideout.',lair:'Free '+Q.pn+' from '+Q.to.name+' (marked on your map).',
      holding:'Ransom '+Q.pn+' at the gates of '+Q.held.town+' ('+Q.price+' gold), or take '+Q.held.town+'.'}[Q.held.k]:'Free '+Wounded.name(th)+'.';
  },
  // (freed: the chain picked up again at the escort, from where you are)
  resume(th){
    Thread.start('wounded',th.memory,'escort');
  },
  call(th){
    const n=Wounded.name(th),a=th.memory.ander;
    return {to:Wounded.home(th),title:a?'Ander at his sister’s':n+' is home',text:a?'Ander made his own way to his sister’s door in '+Wounded.home(th).town+'.':n+' made his own way home to '+Wounded.place(th)+'.',
      say:{arrive:a?'Ander is at his sister’s door.':n+'’s family comes out to meet you.'}};
  },
  tracks(th){
    const p=Wounded.at(th),n=Wounded.name(th),g=Wounded.gang(th);
    return {to:{x:p.x,y:p.y,name:'where you found '+n},title:'Find the trail of '+g,text:cap1(g)+' set on '+n+' on the road where you found him. Their trail starts there.',
      say:{arrive:'You are back where you found '+n+'.'}};
  },
  // (there: the nearest hideout of his attackers' band, else any; marked on your map; none, the trail is cold)
  trail(th){
    const s=LairQuest.near(Wounded.at(th),th.memory.band||'bandits');
    if(!s)return {site:null};
    s.seen=true;
    return {site:s.i,lair:s.name,lx:s.x,ly:s.y};
  },
  lair(th){
    const m=th.memory,n=Wounded.name(th),g=Wounded.gang(th);
    return {site:m.site,band:m.band||'bandits',near:Wounded.at(th),title:'Clear out '+g,text:cap1(g)+', who set on '+n+', hole up in the '+(m.lair||'hideout')+'. Clear them out.',
      say:{cleared:cap1(g)+' are broken. '+(m.ander?'Ander':n+'’s family')+' will want to hear it.',gone:'Word comes that '+g+' have scattered to the winds. '+(m.ander?'Ander':n+'’s family')+' will want to hear it.'}};
  },
  back(th){
    const n=Wounded.name(th),a=th.memory.ander;
    return {to:Wounded.home(th),title:a?'Back to Ander':'Back to '+n+'’s family',text:a?'Ander waits at his sister’s door in '+Wounded.home(th).town+'.':n+'’s family waits for news of '+Wounded.gang(th)+'.',
      say:{arrive:a?'Ander is waiting at his sister’s door.':n+'’s family comes out to meet you.'}};
  },
  // ---- the thanks: the heirloom, once a game (after it, gold), reputation and renown; Ander joins you
  gift(th){
    const R=WOUNDED.reward,t=Wounded.home(th).town,first=!Thread.once('heirloom'),I=ITEMS.hearthring;
    return {...(first?{gear:'hearthring',call:()=>Thread.mark('heirloom')}:{gold:R.gold}),rep:[t,R.rep],renown:R.renown,
      say:r=>first?(r.gear?'The '+I.n+' is yours.':'Your bag is too full to take it: they keep the '+I.n+' for you.'):'They press their savings on you, and will not take them back.'};
  },
  joins(th){
    const R=WOUNDED.reward,A=WOUNDED.ander;
    return {companion:{id:'ander',lv:A.lv,ap:A.ap,attr:A.attr},rep:[Wounded.home(th).town,R.rep],renown:R.renown,say:'Ander The Fallen rides with you now.'};
  },
  // ---- the healed traveller's page (world/encounters.js traveller, after Tend his wounds): what you see, what you know, his offer
  text(e){
    const th={memory:Wounded.memory(e),i:0},p=Wounded.place(th);
    if(e.ander)return 'The sellsword stands, testing the bandage. “Ander,” he says. “Some call me the Fallen.” An old scar runs down his cheek; his dark cloak is cut to ribbons. “See me to my sister’s door, '+p+', and help me settle with '+Wounded.gang(th)+'. Then my sword is yours.”';
    return 'On his feet now, bandaged, '+th.memory.name+' grips your hand. “I owe you my life,” he says. “I can fight: let me ride with you. Or, if you would, see me home to '+p+'. My family must think me dead.”';
  },
  facts(e){
    const th={memory:Wounded.memory(e),i:0};
    return [th.memory.name+(e.ander?', a sellsword':', a '+(RACES[e.race]||RACES.human).n.toLowerCase()),Wounded.kin(th)+': '+Wounded.place(th),'robbed by '+Wounded.gang(th)];
  },
  // (Ander, lying wounded)
  lying:()=>'A tall man in a dark cloak lies among three dead bandits, a notched sword still in his fist and a deep wound in his side. An old scar runs down his face. He is barely breathing.',
  // his offer: the encounter's choices once he is healed (world/encounters.js traveller's acts)
  offer:[
    {icon:'troops',label:'Join you',when:e=>!!e.healed&&!e.ander,need:()=>partyRoom()<1&&'Your band is full.',tip:'He takes up arms with your band: a first-tier soldier of his people.',
      out:e=>({troops:{[Wounded.troop(e)]:1},gone:true,say:'He takes up a spear and falls in with your band.'})},
    {icon:'people',label:'Take him home',when:e=>!!e.healed&&!(e.ander&&Escort.why()),need:()=>Escort.why(),tip:'He rides with you to his family’s door. More may come of it.',
      also:e=>{const th={memory:Wounded.memory(e),i:0};return Escort.facts(Wounded.escort(th)).concat(e.ander?['then he joins you, once '+Wounded.gang(th)+' are dealt with']:[])},
      out:e=>({start:{thread:'wounded',memory:Wounded.memory(e)},gone:true,say:e.ander?'Ander climbs up behind one of your riders.':'He climbs up behind one of your riders.'})},
    {icon:'shoe',label:'Refuse',when:e=>!!e.healed,tip:'You have done enough. He goes his own way.',
      out:e=>({rep:[Wounded.homeOf(e).town,-WOUNDED.refuse],call:c=>{c.e.goOff();if(e.ander)Wanderer.start(Wounded.memory(e))},say:e.ander?'Ander shrugs. “Your loss.” He limps off down the road.':'He nods slowly, and limps off down the road alone.'})},
    // (Ander, and no room for a passenger: no forced refusal, he offers to meet you later)
    {icon:'shoe',label:'Meet him later',when:e=>!!e.healed&&!!e.ander&&!!Escort.why(),tip:'You have no room for another passenger. He will find his own road; look for him in the taverns.',
      also:()=>['he goes his own way: look for him in the taverns'],out:e=>({call:c=>{c.e.goOff();Wanderer.start(Wounded.memory(e))},say:'“No room for me? Then I find my own road,” Ander says. “Look for me in the taverns.”'})}],
};
/* the chain: its steps, their pages, outcomes and notes (what to do now: your Quests), their names among the stages done
   (stage); who (its subject in your Quests). A side story: late or slipped away with you beaten, it failed (fail); freed, it is
   picked up again in a new thread (resumes: not archived) */
defineKind('thread','wounded',{n:'The Wounded Traveller',who:th=>Wounded.who(th),resumes:['freed'],steps:[
  {id:'escort',stage:th=>'Bring '+Wounded.name(th)+' home',fail:['late','loose'],start:{quest:'escort',town:th=>Wounded.home(th).town,spec:th=>Wounded.escort(th)},how:(d,th)=>Wounded.caught(d,th),
    remember:d=>fateOf(d)==='captured'?{held:d.e.by||null,freed:0}:{},
    note:th=>'Bring '+Wounded.name(th)+' home to '+Wounded.place(th)+'.',then:{arrived:'family',late:null,left:null,captured:'held',walk:'call',loose:null}},
  {id:'family',stage:th=>'Hear '+Wounded.kin(th)+' out',start:{page:{ico:'people',title:th=>th.memory.ander?'Ander’s sister':Wounded.name(th)+'’s family',
    text:th=>{const n=Wounded.name(th),g=Wounded.gang(th),b=Wounded.bandWord(th),d=Wounded.dir(th),m=th.memory;
      if(m.ander)return (m.alone?'Ander is at his sister’s in '+Wounded.home(th).town+' before you, leaner and meaner for his road.':'His sister meets you at the door of '+Wounded.place(th)+', and swears at the state of him.')+' “'+cap1(g)+',” Ander says, easing himself onto a bench. “'+cap1(b)+'. Six of them jumped me on the road to the '+d+'; I left three in the dirt. The rest crawled back to their hole. See that they never crawl out again, and my sword is yours.”';
      return (m.alone?'At '+Wounded.place(th)+', '+n+' is home before you: thin and bruised, he made his own way back. His family runs out to meet you all the same.':'At '+Wounded.place(th)+', '+n+'’s family runs out to meet him: his wife in tears, the children at his legs.')+' Over bread at their table he tells you who did this: '+g+', '+b+' who prey on the road to the '+d+'. “They took all we had saved,” his wife says. “If only someone would make them pay.”'},
    choices:[
      {icon:'sword',label:'Promise to find them',how:'ask',tip:'Their trail starts where you found him.',out:th=>({say:'You promise to find '+Wounded.gang(th)+'. Their trail starts where you found '+Wounded.name(th)+'.'})},
      {icon:'shoe',label:'Ride on',how:'part',tip:'Wish them well and go your way.',out:th=>({say:th.memory.ander?'You leave Ander to mend. “When you want a sword,” he says, “ask in the taverns.”':'You wish them well and ride on.'})}]}},
    note:th=>cap1(Wounded.kin(th))+' waits for you at '+Wounded.place(th)+'.',then:{ask:'tracks',part:null}},
  {id:'tracks',stage:'Find the trail',start:{step:'visit',town:th=>Wounded.home(th).town,spec:th=>Wounded.tracks(th)},how:fateOf,remember:(d,th)=>fateOf(d)==='arrived'?Wounded.trail(th):{},
    note:th=>'Find the trail where you found '+Wounded.name(th)+'.',then:{arrived:'trail',left:null}},
  {id:'trail',stage:'Read the trail',start:{page:{ico:'eye',title:th=>'The trail of '+Wounded.gang(th),
    text:th=>{const m=th.memory,n=Wounded.name(th),g=Wounded.gang(th),a=Wounded.at(th);
      if(m.site==null)return 'Where you found '+n+', rain has washed the road clean. The trail is cold: wherever '+g+' went, they are gone.';
      return 'Where you found '+n+', the trail is still plain: hoofprints, a dropped boot, the ruts of a stolen cart turning off the road. Your scouts follow it '+Math.round(Math.hypot(m.lx-a.x,m.ly-a.y)/TILE)+' tiles to the '+compass(m.lx-a.x,m.ly-a.y)+', to the '+m.lair+'. It is marked on your map.'},
    choices:[
      {icon:'sword',label:'Ride for their hideout',how:'follow',when:th=>th.memory.site!=null,tip:'Clear it out: they will not give up their plunder for asking.',out:th=>({say:'You turn your band toward the '+th.memory.lair+'.'})},
      {icon:'people',label:'Back to his family',how:'cold',when:th=>th.memory.site==null,tip:'Tell them what you found.',out:()=>({say:'You turn back with the news.'})},
      {icon:'shoe',label:'Let it lie',how:'drop',tip:'Leave them be.',ask:th=>th.memory.ander?'Ander will not ride with you while they go unpunished: he will go his own way.':null,out:()=>({say:'You let it lie.'})}]}},
    note:()=>'Read the trail.',then:{follow:'clear',cold:'back',drop:null}},
  {id:'clear',stage:th=>'Clear out '+Wounded.gang(th),start:{step:'lair',town:th=>Wounded.home(th).town,spec:th=>Wounded.lair(th)},how:fateOf,
    note:th=>'Clear '+Wounded.gang(th)+' out of the '+(th.memory.lair||'hideout')+'.',then:{cleared:'back',gone:'back',left:null}},
  {id:'back',stage:th=>'Back to '+(th.memory.ander?'Ander':Wounded.kin(th)),start:{step:'visit',town:th=>Wounded.home(th).town,spec:th=>Wounded.back(th)},how:fateOf,
    note:th=>'Go back to '+(th.memory.ander?'Ander':Wounded.name(th)+'’s family')+' at '+Wounded.place(th)+'.',then:{arrived:'reward',left:null}},
  {id:'reward',stage:th=>th.memory.ander?'Ander’s word':'Their thanks',start:{page:{ico:'gold',title:th=>th.memory.ander?'Ander The Fallen':Wounded.name(th)+'’s family',
    text:th=>{const g=Wounded.gang(th),n=Wounded.name(th);
      if(th.memory.ander)return 'Ander is on his feet again, his sword belted on and his dark cloak about him. “'+cap1(g)+' are done,” he says. “I pay my debts. Where you ride, I ride.”';
      return Thread.once('heirloom')?n+'’s family has heard: '+g+' are no more. They have little, but they press their savings on you all the same. Word of you goes round '+Wounded.home(th).town+'.'
        :n+'’s family has heard: '+g+' are no more. His wife presses a small cloth bundle into your hands: the '+ITEMS.hearthring.n+', worn by her mother and hers before her. “It has kept this house. Let it keep you.” Word of you goes round '+Wounded.home(th).town+'.'},
    choices:[
      {icon:'gold',label:'Accept their thanks',how:'thanks',when:th=>!th.memory.ander,out:th=>Wounded.gift(th)},
      {icon:'troops',label:'Ride with me',how:'joins',when:th=>!!th.memory.ander,tip:'Ander joins your band as a companion.',out:th=>Wounded.joins(th)}]}},
    note:th=>cap1(Wounded.kin(th))+' waits for you at '+Wounded.place(th)+'.',then:{thanks:null,joins:null}},
  // ---- the rescue: no deadline; freed by you, the chain ends there and picks itself up at the escort (Wounded.resume: a thread
  // never loops back on itself), or, no room for him, the call; his holder destroyed by another, or slipped away: the call
  // (Ander: wandering); given up: over
  {id:'held',stage:th=>'Free '+Wounded.name(th),start:{step:'held',town:th=>Wounded.home(th).town,spec:th=>Wounded.held(th)},how:(d,th)=>Wounded.freed(d,th),remember:d=>Wounded.after(d),
    note:th=>Wounded.heldNote(th),then:{freed:null,ride:'call',walk:'call',loose:null,left:null}},
  {id:'call',stage:th=>Wounded.name(th)+' made his own way home',start:{step:'visit',town:th=>Wounded.home(th).town,spec:th=>Wounded.call(th)},how:fateOf,
    note:th=>(th.memory.ander?'Ander':Wounded.name(th))+' is home: go to '+Wounded.place(th)+'.',then:{arrived:'family',left:null}}]});
/* ---------- Ander wandering (the owner, 2026-10-23: never lost, but for dying unhealed): every end of his chain but the reward
   sends him to the taverns, kept aside (Thread.store().aside.ander, saved with the threads: {since (the day he set off), memory
   (his chain's), done (his attackers dealt with)}). He moves to another holding with a tavern every WOUNDED.wander.days (by a
   hash of the world, the day he set off and his leg: no draw, at(day)), the first his home's or the nearest to it; every tavern's
   rumours tell where he was seen (world/news.js 'ander': news()); in his tavern his card (ui/town.js Tavern: card, job, pay)
   wins him back: finish the job (his chain picked up at the tracks; his attackers dealt with already, he joins at once) or his
   price, WOUNDED.wander.price. He joins as the reward joins him (compJoin), only with room in your band. Seen only in a game where
   he was met ---------- */
const Wanderer={
  get state(){
    const a=Thread.list().aside;
    return a&&a.ander||null;
  },
  start(memory,done){
    if(P.comps.ander)return;
    const m={...memory},L=Thread.store();
    for(const k of ['held','freed','alone'])delete m[k];
    (L.aside||(L.aside={})).ander={since:G.day,memory:m,done:done?1:0};
    log('Ander goes his own way. Word of him may reach the taverns.','gold');
  },
  stop(){
    const L=Thread.store();
    if(!L.aside)return;
    delete L.aside.ander;
    if(!Object.keys(L.aside).length)delete L.aside;
  },
  // (the holdings with a tavern)
  taverns:()=>TOWNS.filter(t=>!t.gone&&t.T.tabs.includes('tavern')),
  // where he is on a day (none: today): {town, leg, from, to (the day he moves on)}; null: not wandering
  at(day){
    const s=this.state,ts=this.taverns(),D=WOUNDED.wander.days,h=k=>Rng.seedOf('ander:'+s.since+':'+k),now=day==null?G.day:day;
    if(!s||!ts.length)return null;
    const home=townBy(s.memory.town)||P;
    let t=ts.includes(home)?home:Spatial.nearest(ts,home.x,home.y),from=s.since;
    for(let k=0;;k++){
      const len=D[0]+h(k)%(D[1]-D[0]+1);
      if(now<from+len)return {town:t.name,leg:k,from,to:from+len};
      from+=len;
      const o=ts.filter(x=>x!==t);
      if(o.length)t=o[h(k+1)%o.length];
    }
  },
  here(t){
    const a=!P.comps.ander&&this.at();
    return !!a&&a.town===t.name;
  },
  // ---- his tavern: his card; finish the job, or his price (with room in your band)
  card(t){
    if(!this.here(t))return null;
    const s=this.state,p=WOUNDED.wander.price,g=Wounded.gang({memory:s.memory}),full=partyRoom()<1?'Your band is full: come back with room':'';
    return {pic:portrait('ander'),name:COMPS.ander.n,role:'A sellsword, drinking alone',facts:[s.done?cap1(g)+' are dealt with':cap1(g)+' still ride'],
      note:s.done?'“'+cap1(g)+' are done. I said my sword was yours, and I meant it.”':'“'+cap1(g)+' still ride the roads. Finish what we started, or pay my price: '+p+' gold, and I ride with you.”',
      acts:[['ander-job',null,s.done?'Ride with me':'Finish the job',s.done?full:''],['ander-pay',null,'Pay '+p+'g',P.gold<p?'Not enough gold':full]]};
  },
  job(t){
    const s=this.state;
    if(!this.here(t))return;
    if(s.done)return this.join();
    const m={...s.memory};
    for(const k of ['site','lair','lx','ly'])delete m[k];
    this.stop();
    Thread.start('wounded',m,'tracks');
    log('“Then we finish it,” Ander says. “Their trail starts where you found me. I will wait at my sister’s.”','gold');
  },
  pay(t){
    const p=WOUNDED.wander.price;
    if(!this.here(t)||P.gold<p||partyRoom()<1)return;
    P.gold-=p;
    this.join();
  },
  join(){
    if(partyRoom()<1)return log('“Come back when you have room in your band,” Ander says.','bad');
    const A=WOUNDED.ander;
    this.stop();
    compJoin('ander',{lv:A.lv,ap:A.ap,attr:A.attr});
  },
  // ---- the rumour (world/news.js: told by every tavern but his): where he was seen, one a leg, dated the day he came
  news(){
    const a=!P.comps.ander&&this.at(),N=newsW();
    if(!a)return;
    const s=this.state,it=N.items.find(x=>x.k==='ander');
    if(it&&it.detail.leg===a.leg&&it.detail.since===s.since)return;
    N.items=N.items.filter(x=>x.k!=='ander');
    const r=newsRecord('ander',townBy(a.town),{town:a.town,leg:a.leg,since:s.since});
    if(r)r.day=a.from;
  },
};
// (his chain ended: freed, it picks itself up at the escort; Ander, any other way but the reward, wanders, his attackers dealt
// with once its clear step is past)
worldOn('thread:ended',d=>{
  const th=d&&d.e;
  if(!th||th.k!=='wounded')return;
  if(d.how==='freed')return Wounded.resume(th);
  if(th.memory.ander&&d.how!=='joins')Wanderer.start(th.memory,th.past.some(([s,h])=>s==='clear'&&(h==='cleared'||h==='gone')));
});
