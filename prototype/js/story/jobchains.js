'use strict';
/* ---------- the chains that grow from jobs (doc/QUESTS_DESIGN.md §8, Q7; the owner, 2026-11-04: "build all four chains"). Each
   is a story (story/forms.js defineStory) begun by how a real job ended, every act on the world as it is: the same chief, the
   same hideout or cave, a real lord, a real letter. Begun by JobChains.begin(kind, memory) (none while one of its kind is under
   way for the same holding); who speaks: the job's giver (memory giver, gn).
   - chief, The chief who ran: a bounty paid while its band's chief got away (captives.js W.exiles). He has gone to ground at
     the nearest hideout (he is its chieftain now, his exile over); clear it; among his plunder a lord's letter (patron: a lord
     of another realm, at war with the holding's first); give it to the holding (its reputation, the lord's regard lost), sell
     it back to him (gold, his regard), or let him go at the start;
   - bigger, Something bigger: beasts at the folds paid while a cave lies near (TROUBLE.lair): the killings go on; track it
     (a check) or search blind, then kill what lairs there, or smoke it out (a lore check);
   - larder, The empty larder: a supply run paid whose shortage was a robbed caravan, a hideout near: who told the band (a talk
     check: the informer, handed over or his purse taken), or the goods back from the hideout (returned to its stores, or kept);
   - sealed, A sealed hand: a courier's letter read (letters.js read) that orders an attack on a holding: warn it (its garrison
     readied, JOB_CHAINS.gar more men), for its thanks or for a price, or keep silent.
   Their numbers: JOB_CHAINS ---------- */
const JOB_CHAINS={gar:4};
const JobChains={
  live(k,town){return QuestChain.list().on.some(th=>th.k===k&&th.memory.town===town)},
  who(th){const m=th.memory;return m.giver?{name:m.giver,pic:'folk',sub:'The '+m.gn+' of '+m.town}:null},
  // (a job's giver, for its chain's pages)
  giverOf(q){const g=q.person;return g?{giver:g.name,gn:g.n}:{giver:'The steward',gn:'steward'}},
  dir(a,b){return Math.round(Math.hypot(a.x-b.x,a.y-b.y)/TILE)+' tiles '+compass(a.x-b.x,a.y-b.y)},
  begin(k,memory){if(this.live(k,memory.town))return null;return QuestChain.start(k,memory)},
  // ---- the triggers, from the jobs (world/quests.js pay) and the letters (world/letters.js read)
  bounty(q){const t=townBy(q.home),ex=(W.exiles||[]).find(x=>x.ld&&x.ld.name===q.chief&&!x.done),s=t&&Troubles.lairs(t)[0];if(!t||q.lord||!ex||!s)return null;
    const others=W.lords.filter(l=>!l.dead&&!l.gone&&l.fac!==t.owner&&FACS[l.fac]),foes=others.filter(l=>atWar(l.fac,t.owner)),pat=Spatial.nearest(foes.length?foes:others,t.x,t.y);if(!pat)return null;
    ex.done=true;s.ld=ex.ld;// (he went to ground there: its chieftain now)
    return this.begin('chief',{town:t.name,fac:t.owner,...this.giverOf(q),chief:q.chief,band:q.band,lair:s.name,site:s.i,dir:this.dir(s,t),lord:pat.name,patron:pat.name,prealm:FACS[pat.fac].n})},
  beast(q){const t=townBy(q.home),c=t&&W.sites.filter(s=>s.type==='cave'&&!s.cleared&&Math.hypot(s.x-t.x,s.y-t.y)/TILE<TROUBLE.lair).sort((a,b)=>Math.hypot(a.x-t.x,a.y-t.y)-Math.hypot(b.x-t.x,b.y-t.y))[0];
    if(!t||q.lord||!c)return null;return this.begin('bigger',{town:t.name,fac:t.owner,...this.giverOf(q),mon:MONSTERS[q.mon].n.toLowerCase(),cave:c.name,site:c.i,dir:this.dir(c,t)})},
  supply(q){const t=townBy(q.home),s=t&&Troubles.lairs(t)[0];if(!t||!s||!/^They robbed a caravan/.test(q.cause||''))return null;
    const N=FOLK_NAMES[(t.races&&t.races[0])||'human']||FOLK_NAMES.human;
    return this.begin('larder',{town:t.name,fac:t.owner,...this.giverOf(q),good:GOODS[q.good].n.toLowerCase(),gk:q.good,n:q.n,lair:s.name,site:s.i,dir:this.dir(s,t),informer:N[folkHash(t.name+':informer')%N.length]})},
  letter(L){const tg=townBy(L.tgt);if(!L.job||L.kind!=='attack'||!tg||tg.gone)return null;
    return this.begin('sealed',{town:tg.name,fac:tg.owner,giver:'',sender:FACS[L.fac]?FACS[L.fac].n:'a fallen realm',vsn:FACS[tg.owner]?FACS[tg.owner].n:'its lord',tgt:tg.name})},
  // (a holding warned: its garrison readied)
  ready(th){const t=townBy(th.memory.tgt);if(t)t.gar=Math.min((t.T.gar||0)+JOB_CHAINS.gar,(t.gar||0)+JOB_CHAINS.gar)},
  // (the robbed goods back in its stores)
  restock(th){const t=townBy(th.memory.town),m=th.memory;if(t&&m.gk){ensureEcon(t);t.stock[m.gk]=(t.stock[m.gk]||0)+m.n}}
};
defineStory('chief',{n:'The chief who ran',ico:'sword',speaker:th=>JobChains.who(th),steps:{
  start:{title:'{chief} got away',stage:'Hear what became of {chief}',note:'Hear {giver} out.',
    text:'“You broke the {band},” {giver} says, “but {chief} got away. They say he ran for the {lair}, {dir}. Give him a month and he is back on our roads.”',
    choose:[{label:'Ride after him',icon:'sword',next:'den',tip:'Follow him to the {lair} and finish it.'},
      {label:'Let him go',icon:'shoe',next:'let',tip:'Someone else can deal with him.'}]},
  den:{goal:'clear',site:th=>th.memory.site,title:'Clear the {lair}',stage:'Clear the {lair}',note:'Clear the {lair}, where {chief} went to ground.',next:'letter'},
  letter:{title:'What {chief} kept',stage:'Decide what to do with the letter',note:'Decide what to do with the letter.',
    text:'Among {chief}’s plunder is a letter under the seal of {patron} of the {prealm}: so much gold for every caravan out of {town} that never arrives.',
    choose:[{label:'Give it to {town}',icon:'house',next:'told',tip:'Let {town} know who paid for its robbers.'},
      {label:'Sell it back to {patron}',icon:'gold',next:'paid',tip:'He will pay well for it to disappear.'}]},
  told:{end:{reward:{rep:10,rel:-8,xp:120,renown:4},say:'{town} will not forget whose gold bought its robbers. Nor will {patron} forget you.'}},
  paid:{end:{reward:{gold:250,rel:6,rep:-3},say:'{patron}’s steward pays, and the letter goes into the fire.'}},
  let:{end:{say:'You leave {chief} to the roads.'}}}});
defineStory('bigger',{n:'Something bigger',ico:'paw',speaker:th=>JobChains.who(th),steps:{
  start:{title:'It was not the {mon}',stage:'Hear {giver} out',note:'Hear {giver} out.',
    text:'“The {mon} are dead,” {giver} says, “and still the folds are torn open at night. Tracks as long as my arm, going {dir}, toward the {cave}.”',
    choose:[{label:'Follow the tracks',icon:'eye',check:'track',win:'mouth',lose:'blind',winSay:'The tracks are plain all the way: they lead into the {cave}.',loseSay:'You lose them in the rocks. You will have to search the {cave} blind.'},
      {label:'Not my trouble',icon:'shoe',next:'left'}]},
  mouth:{title:'At the {cave}',stage:'Face what lairs in the {cave}',note:'Decide how to face it.',
    text:'The stink of it reaches you a hundred paces off. Bones by the mouth of the {cave}, and fresh.',
    choose:[{label:'Go in after it',icon:'sword',next:'fight'},
      {label:'Smoke it out',icon:'fire',check:'lore',win:'driven',lose:'fight',winSay:'Smoke and noise: it bolts from the {cave} into the hills, and does not come back.',loseSay:'The smoke only angers it. It comes for you.'}]},
  blind:{goal:'clear',site:th=>th.memory.site,title:'Search the {cave}',stage:'Search the {cave}',note:'Find what lairs in the {cave}, and kill it.',next:'won'},
  fight:{goal:'clear',site:th=>th.memory.site,title:'Kill what lairs in the {cave}',stage:'Kill what lairs in the {cave}',note:'Kill what lairs in the {cave}.',next:'won'},
  won:{end:{reward:{rep:12,renown:6,xp:150,gold:80},say:'{town} names you at its fires: the one who killed what came for the folds.'}},
  driven:{end:{reward:{rep:7,renown:3,xp:90},say:'The folds of {town} are quiet again.'}},
  left:{end:{say:'You leave {town} to its trouble.'}}}});
defineStory('larder',{n:'The empty larder',ico:'sack',speaker:th=>JobChains.who(th),steps:{
  start:{title:'Who told them?',stage:'Hear {giver} out',note:'Hear {giver} out.',
    text:'“That {good} should never have run short,” {giver} says. “The caravan was taken on the road, on the one day it passed. Someone told the band.”',
    choose:[{label:'Find who told them',icon:'eye',check:'talk',win:'informer',lose:'den',winSay:'A drink here, a coin there: one name comes up again and again.',loseSay:'Nobody will talk. The goods may still be at the {lair}.'},
      {label:'Go after the goods',icon:'sword',next:'den',tip:'The band went back to the {lair}, {dir}.'},
      {label:'Leave it',icon:'shoe',next:'left'}]},
  informer:{title:'{informer}',stage:'Deal with {informer}',note:'Decide what to do with {informer}.',
    text:'{informer}, a carter of {town}, sold the caravan’s road for a purse. He begs you not to tell.',
    choose:[{label:'Hand him to the watch',icon:'house',next:'told'},
      {label:'Take his purse and keep quiet',icon:'gold',next:'bribe'}]},
  den:{goal:'clear',site:th=>th.memory.site,title:'Take back the {good}',stage:'Take back the {good}',note:'The robbed {good} is at the {lair}, {dir}.',next:'goods'},
  goods:{title:'The {good}',stage:'Decide what to do with the {good}',note:'Decide what to do with the {good}.',
    text:'The {good} is there, most of it, under a tarp. It would fetch a good price elsewhere.',
    choose:[{label:'Bring it to {town}',icon:'house',next:'returned'},
      {label:'Keep it',icon:'gold',next:'kept'}]},
  returned:{end:{reward:th=>({rep:10,xp:100,gold:60,call:()=>JobChains.restock(th)}),say:'{town}’s stores are full again, and its people know who filled them.'}},
  kept:{end:{reward:th=>({goods:{[th.memory.gk]:th.memory.n},rep:-3,xp:60}),say:'You keep the {good}. {town} need not know.'}},
  told:{end:{reward:{rep:8,xp:80},say:'The watch takes {informer} away. The roads out of {town} are safer for it.'}},
  bribe:{end:{reward:{gold:120,rep:-2},say:'{informer} presses his purse on you. You say nothing.'}},
  left:{end:{say:'You leave it lie.'}}}});
defineStory('sealed',{n:'A sealed hand',ico:'scroll',steps:{
  start:{title:'A sealed hand',stage:'Read the letter',note:'Decide what to do with what you read.',
    text:'The letter of the {sender} orders an attack on {tgt} of the {vsn}. {tgt} does not know it is coming.',
    choose:[{label:'Warn {tgt}',icon:'house',next:'warn',tip:'Ride to {tgt} and tell its lord.'},
      {label:'Keep it to yourself',icon:'shoe',next:'silent'}]},
  warn:{goal:'visit',to:th=>({town:th.memory.tgt}),title:'Warn {tgt}',stage:'Ride to {tgt}',note:'Ride to {tgt} and warn its lord.',next:'warned'},
  warned:{title:'{tgt} warned',stage:'Tell the lord of {tgt}',note:'Answer the lord of {tgt}.',
    text:'The lord of {tgt} reads your words twice. “Why tell us?”',
    choose:[{label:'For the people in it',icon:'people',next:'thanked'},
      {label:'For a price',icon:'gold',next:'sold'}]},
  thanked:{end:{reward:th=>({rep:10,honor:6,xp:80,call:()=>JobChains.ready(th)}),say:'{tgt} doubles its watch. When the {sender} come, they will not find it sleeping.'}},
  sold:{end:{reward:th=>({gold:150,rep:3,call:()=>JobChains.ready(th)}),say:'The lord of {tgt} pays, and doubles the watch.'}},
  silent:{end:{say:'You keep what you read to yourself.'}}}});
