'use strict';
/* ---------- data: the story's chains (doc/STORY_DESIGN.md §9; the story batch, ST2): their numbers, and Ander The Fallen as a
   companion. Their steps, words and outcomes: story/wounded.js; the step kinds: story/steps.js ---------- */
// × the chance of every hidden thing (a rare variant met on the road: Ander The Fallen), 1 by default (0: never)
const HIDDEN_RATE=1;
/* the steps (story/steps.js): retarget, tiles from its hideout a clear step looks for another of its band once it is gone or
   cleared by another; keep, the ended threads kept (how each went); say, a step's lines when its spec
   has none ({to} its place) */
const STEP={retarget:40,keep:12,
  say:{arrive:'You reach {to}.',late:'You took too long.',left:'You give it up.',cleared:'{to} is cleared.',gone:'{to} is no more.',
    band:'{N} is free.',lair:'{N} is free.',paid:'You pay, and {n} is let go.',taken:'{N} walks out of the gaol a free man.',home:'They have taken {n} to {to}.',
    moved:'They have taken {n} to {to}.'}};
/* The Wounded Traveller (the owner, 2026-10-19 and 2026-10-23): wait, hours he waits for your answer once healed; home: his
   family's holding, min–max tiles from where he lay, one of the near nearest (by his seed: no draw), an estate's when his seed
   is a multiple of estate and it has one, else a house; refuse: reputation lost at his home when you will not see him home;
   escort: on arrival rep at his home; late: rep lost there; morale lost when he is carried off (captured); reward: rep and
   renown at his home, and the heirloom (ITEMS.hearthring, data/items.js: once a game; after it, gold); ander: p, the chance a
   wounded traveller is Ander The Fallen (× HIDDEN_RATE, never twice a game), and as he joins you: his level, attributes and
   trust (ap); rescue (the owner, 2026-10-23: no deadline): home, the days a band carries him before it takes him to its hideout;
   ransom, the gold his gaolers ask at a lord's holding (a traveller's, Ander's: a known sword fetches more); wander: Ander, once
   lost to you, moves to another tavern every days [from, to] (by a hash of the world, no draw), and joins you there for price
   gold (or once you finish the job); names: his, by his people (his seed picks) */
const WOUNDED={wait:24,home:{min:6,max:30,near:3,estate:3},refuse:1,escort:{rep:3,late:4,morale:5},reward:{rep:8,renown:2,gold:60},
  ander:{p:.01,lv:4,ap:3,attr:{str:4,agi:4,int:0,cha:1}},rescue:{home:2,ransom:{traveller:80,ander:150}},wander:{days:[3,5],price:300},
  names:{human:['Oswin','Hal','Wendel','Godric','Aldo','Bram','Cole','Edric'],dwarf:['Borin','Thrain','Brokk','Gunnar','Harald','Korrin'],
    elf:['Aelin','Sylvar','Ithel','Thalion','Faen','Caelum'],orc:['Grub','Mokra','Azga','Thrak','Ragh','Durz']}};
/* Ander The Fallen as a companion (story/wounded.js: he joins you once you have seen him home and cleared his attackers' hideout):
   his kind (ST: a veteran sellsword, strong and quick, shock troops: data/matchups.js) and his entry among the companions
   (COMPS, data/progression.js), registered here as a recruit's are (world/captives.js). Hidden content: his entry is unlisted
   (not enumerable), so no tavern's hiring list offers him and the wiki keeps his secret, while COMPS.ander reads as any
   companion's; story: met only in his story (no town: world/companions.js compTown), and in the tavern where he wanders once
   lost to you (story/wounded.js Wanderer: a card of his own) */
ST.ander={n:'Ander',hp:84,dmg:12,spd:50,reach:16,range:0,cd:.75,tier:3,tags:['shock']};
Object.defineProperty(COMPS,'ander',{enumerable:false,configurable:true,writable:true,value:{n:'Ander The Fallen',short:'Ander',race:'human',story:true,
  d:'A veteran sellsword, scarred, in a dark cloak. Likes a hard fight won; hates running and cruelty.',react:{win:1,flee:-2,cruel:-2,mercy:1,kind:1}}});
// the checks a story's choice may name (story/forms.js), shaped as data/encounters.js ENC_STAT's ({base, parts: [[stat or skill, per
// point]], cap}); their odds on the button read by Insight
const QUEST_CHECKS={
  talk:{base:.25,parts:[['pers',.05],['cha',.04]],cap:.9},
  threaten:{base:.15,parts:[['cha',.04],['str',.04]],cap:.8},
  sneak:{base:.2,parts:[['agi',.05],['scout',.04]],cap:.85},
  heal:{base:.1,parts:[['med',.1],['int',.02]],cap:.95},
  track:{base:.2,parts:[['scout',.06],['surv',.04]],cap:.9},
  lift:{base:.15,parts:[['str',.06],['athl',.04]],cap:.85},
  lore:{base:.15,parts:[['int',.06]],cap:.85},
  haggle:{base:.2,parts:[['trade',.06],['cha',.02]],cap:.85}
};
