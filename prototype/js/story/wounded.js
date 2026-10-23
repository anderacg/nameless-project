'use strict';
/* ---------- The Wounded Traveller: the first story chain, and Ander The Fallen, its rare variant (doc/STORY_DESIGN.md §9,
   doc/IMPLEMENTATION_PLAN.md §10.7–10.8; the owner, 2026-10-19 and 2026-10-23; the story batch, ST2) ----------
   1. Heal him: the road's wounded traveller (world/encounters.js traveller: Tend his wounds). He stands, bandaged, and his page
      offers (its next page, Wounded.offer): Join you (a first-tier soldier of his people), Take him home (the thread below
      begins), or Refuse (he limps off; a little reputation lost at his home). Ander (WOUNDED.ander.p × HIDDEN_RATE of them,
      never twice a game) offers no Join: see him home and clear the bandits who hurt him, and he joins you as a companion.
   2–7. The thread 'wounded' (story/thread.js), on the reusable step kinds (story/steps.js):
      escort  {quest: 'escort'}: him to his family's door (a house or an estate of a holding WOUNDED.home off), quiet (its next
              page speaks); late (his due day: rep lost at home), captured (a battle lost: morale lost, his fate kept on the
              thread's end for a rescue later) or left (abandoned) each end the chain, each with its line;
      family  a page: his family tells you who hurt him (a gang of the band of the land where he lay); promise, or ride on;
      tracks  {step: 'visit'}: back to where you found him; there the trail binds the chain to the nearest hideout of that band
              (Wounded.trail: marked on your map);
      trail   a page: ride for it, or let it lie; no hideout anywhere: the trail is cold, back to the family;
      clear   {step: 'lair'}: that hideout cleared (cleared by another or gone: the nearest of its band instead, else over);
      back    {step: 'visit'}: back to the family's door;
      reward  a page: the heirloom (ITEMS.hearthring, once a game; after it, gold), reputation and renown; Ander joins you.
   Its memory: {name, race, ander, at {x, y} (where he lay), home {town, lot, i}, town (his home's), band (bandits, raiders,
   bog), gang (its name), site (the hideout's i; null: none), lair (its name), lx, ly}. A thread begun without it (the tests'
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
  escort(th){
    const h=Wounded.home(th),n=Wounded.name(th),E=WOUNDED.escort,a=th.memory.ander;
    return {who:'traveller',n,to:h,at:Wounded.at(th),quiet:true,prize:{rep:[h.town,E.rep]},forfeit:{rep:[h.town,-E.late]},forfeits:{captured:{morale:-E.morale}},
      say:a?{arrive:'Ander is at his sister’s door in {town}.',late:'Ander will wait on you no longer: he sets off for {town} alone and does not look back.',
        captured:'In the rout, your foes drag Ander off in chains. A sellsword of his name will fetch a price; wherever they hold him, he lives.'}
        :{arrive:'{N} is home: the door of {to} flies open.',late:'Tired of waiting on you, {n} limps the rest of the way to {town} alone. His family will hear of it.',
        captured:'In the rout, your foes drag {n} off in chains. Wherever they hold him, he lives.'}};
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
    {icon:'people',label:'Take him home',when:e=>!!e.healed,need:()=>Escort.why(),tip:'He rides with you to his family’s door. More may come of it.',
      also:e=>{const th={memory:Wounded.memory(e),i:0};return Escort.facts(Wounded.escort(th)).concat(e.ander?['then he joins you, once '+Wounded.gang(th)+' are dealt with']:[])},
      out:e=>({start:{thread:'wounded',memory:Wounded.memory(e)},gone:true,say:e.ander?'Ander climbs up behind one of your riders.':'He climbs up behind one of your riders.'})},
    {icon:'shoe',label:'Refuse',when:e=>!!e.healed,tip:'You have done enough. He goes his own way.',
      out:e=>({rep:[Wounded.homeOf(e).town,-WOUNDED.refuse],call:c=>c.e.goOff(),say:e.ander?'Ander shrugs. “Your loss.” He limps off down the road.':'He nods slowly, and limps off down the road alone.'})}],
};
/* the chain: its steps, their pages, outcomes and notes (what to do now: your Quests); who (its subject in your Quests) */
defineKind('thread','wounded',{n:'The Wounded Traveller',who:th=>Wounded.who(th),steps:[
  {id:'escort',start:{quest:'escort',town:th=>Wounded.home(th).town,spec:th=>Wounded.escort(th)},how:fateOf,
    note:th=>'Bring '+Wounded.name(th)+' home to '+Wounded.place(th)+'.',then:{arrived:'family',late:null,captured:null,left:null}},
  {id:'family',start:{page:{ico:'people',title:th=>th.memory.ander?'Ander’s sister':Wounded.name(th)+'’s family',
    text:th=>{const n=Wounded.name(th),g=Wounded.gang(th),b=Wounded.bandWord(th),d=Wounded.dir(th);
      return th.memory.ander?'His sister meets you at the door of '+Wounded.place(th)+', and swears at the state of him. “'+cap1(g)+',” Ander says, easing himself onto a bench. “'+cap1(b)+'. Six of them jumped me on the road to the '+d+'; I left three in the dirt. The rest crawled back to their hole. See that they never crawl out again, and my sword is yours.”'
        :'At '+Wounded.place(th)+', '+n+'’s family runs out to meet him: his wife in tears, the children at his legs. Over bread at their table he tells you who did this: '+g+', '+b+' who prey on the road to the '+d+'. “They took all we had saved,” his wife says. “If only someone would make them pay.”'},
    choices:[
      {icon:'sword',label:'Promise to find them',how:'ask',tip:'Their trail starts where you found him.',out:th=>({say:'You promise to find '+Wounded.gang(th)+'. Their trail starts where you found '+Wounded.name(th)+'.'})},
      {icon:'shoe',label:'Ride on',how:'part',tip:'Wish them well and go your way.',out:th=>({say:th.memory.ander?'You leave Ander to mend. He will not ride with you now.':'You wish them well and ride on.'})}]}},
    note:th=>cap1(Wounded.kin(th))+' waits for you at '+Wounded.place(th)+'.',then:{ask:'tracks',part:null}},
  {id:'tracks',start:{step:'visit',town:th=>Wounded.home(th).town,spec:th=>Wounded.tracks(th)},how:fateOf,remember:(d,th)=>fateOf(d)==='arrived'?Wounded.trail(th):{},
    note:th=>'Find the trail where you found '+Wounded.name(th)+'.',then:{arrived:'trail',left:null}},
  {id:'trail',start:{page:{ico:'eye',title:th=>'The trail of '+Wounded.gang(th),
    text:th=>{const m=th.memory,n=Wounded.name(th),g=Wounded.gang(th),a=Wounded.at(th);
      if(m.site==null)return 'Where you found '+n+', rain has washed the road clean. The trail is cold: wherever '+g+' went, they are gone.';
      return 'Where you found '+n+', the trail is still plain: hoofprints, a dropped boot, the ruts of a stolen cart turning off the road. Your scouts follow it '+Math.round(Math.hypot(m.lx-a.x,m.ly-a.y)/TILE)+' tiles to the '+compass(m.lx-a.x,m.ly-a.y)+', to the '+m.lair+'. It is marked on your map.'},
    choices:[
      {icon:'sword',label:'Ride for their hideout',how:'follow',when:th=>th.memory.site!=null,tip:'Clear it out: they will not give up their plunder for asking.',out:th=>({say:'You turn your band toward the '+th.memory.lair+'.'})},
      {icon:'people',label:'Back to his family',how:'cold',when:th=>th.memory.site==null,tip:'Tell them what you found.',out:()=>({say:'You turn back with the news.'})},
      {icon:'shoe',label:'Let it lie',how:'drop',tip:'Leave them be.',ask:th=>th.memory.ander?'Ander will not ride with you if they go unpunished.':null,out:()=>({say:'You let it lie.'})}]}},
    note:()=>'Read the trail.',then:{follow:'clear',cold:'back',drop:null}},
  {id:'clear',start:{step:'lair',town:th=>Wounded.home(th).town,spec:th=>Wounded.lair(th)},how:fateOf,
    note:th=>'Clear '+Wounded.gang(th)+' out of the '+(th.memory.lair||'hideout')+'.',then:{cleared:'back',gone:'back',left:null}},
  {id:'back',start:{step:'visit',town:th=>Wounded.home(th).town,spec:th=>Wounded.back(th)},how:fateOf,
    note:th=>'Go back to '+(th.memory.ander?'Ander':Wounded.name(th)+'’s family')+' at '+Wounded.place(th)+'.',then:{arrived:'reward',left:null}},
  {id:'reward',start:{page:{ico:'gold',title:th=>th.memory.ander?'Ander The Fallen':Wounded.name(th)+'’s family',
    text:th=>{const g=Wounded.gang(th),n=Wounded.name(th);
      if(th.memory.ander)return 'Ander is on his feet again, his sword belted on and his dark cloak about him. “'+cap1(g)+' are done,” he says. “I pay my debts. Where you ride, I ride.”';
      return Thread.once('heirloom')?n+'’s family has heard: '+g+' are no more. They have little, but they press their savings on you all the same. Word of you goes round '+Wounded.home(th).town+'.'
        :n+'’s family has heard: '+g+' are no more. His wife presses a small cloth bundle into your hands: the '+ITEMS.hearthring.n+', worn by her mother and hers before her. “It has kept this house. Let it keep you.” Word of you goes round '+Wounded.home(th).town+'.'},
    choices:[
      {icon:'gold',label:'Accept their thanks',how:'thanks',when:th=>!th.memory.ander,out:th=>Wounded.gift(th)},
      {icon:'troops',label:'Ride with me',how:'joins',when:th=>!!th.memory.ander,tip:'Ander joins your band as a companion.',out:th=>Wounded.joins(th)}]}},
    note:th=>cap1(Wounded.kin(th))+' waits for you at '+Wounded.place(th)+'.',then:{thanks:null,joins:null}}]});
