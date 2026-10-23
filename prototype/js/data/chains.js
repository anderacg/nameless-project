'use strict';
/* ---------- data: the story's chains (doc/STORY_DESIGN.md §9; the story batch, ST2): their numbers, and Ander The Fallen as a
   companion. Their steps, words and outcomes: story/wounded.js; the step kinds: story/steps.js ---------- */
// × the chance of every hidden thing (a rare variant met on the road: Ander The Fallen), 1 by default (0: never)
const HIDDEN_RATE=1;
/* the steps (story/steps.js): retarget, tiles from its hideout a clear step looks for another of its band once it is gone or
   cleared by another; keep, the ended threads kept (who was carried off, for a rescue later); say, a step's lines when its spec
   has none ({to} its place) */
const STEP={retarget:40,keep:12,
  say:{arrive:'You reach {to}.',late:'You took too long.',left:'You give it up.',cleared:'{to} is cleared.',gone:'{to} is no more.'}};
/* The Wounded Traveller (the owner, 2026-10-19 and 2026-10-23): wait, hours he waits for your answer once healed; home: his
   family's holding, min–max tiles from where he lay, one of the near nearest (by his seed: no draw), an estate's when his seed
   is a multiple of estate and it has one, else a house; refuse: reputation lost at his home when you will not see him home;
   escort: on arrival rep at his home; late: rep lost there; morale lost when he is carried off (captured); reward: rep and
   renown at his home, and the heirloom (ITEMS.hearthring, data/items.js: once a game; after it, gold); ander: p, the chance a
   wounded traveller is Ander The Fallen (× HIDDEN_RATE, never twice a game), and as he joins you: his level, attributes and
   trust (ap); names: his, by his people (his seed picks) */
const WOUNDED={wait:24,home:{min:6,max:30,near:3,estate:3},refuse:1,escort:{rep:3,late:4,morale:5},reward:{rep:8,renown:2,gold:60},
  ander:{p:.01,lv:4,ap:3,attr:{str:4,agi:4,int:0,cha:1}},
  names:{human:['Oswin','Hal','Wendel','Godric','Aldo','Bram','Cole','Edric'],dwarf:['Borin','Thrain','Brokk','Gunnar','Harald','Korrin'],
    elf:['Aelin','Sylvar','Ithel','Thalion','Faen','Caelum'],orc:['Grub','Mokra','Azga','Thrak','Ragh','Durz']}};
/* Ander The Fallen as a companion (story/wounded.js: he joins you once you have seen him home and cleared his attackers' hideout):
   his kind (ST: a veteran sellsword, strong and quick, shock troops: data/matchups.js) and his entry among the companions
   (COMPS, data/progression.js), registered here as a recruit's are (world/captives.js). Hidden content: his entry is unlisted
   (not enumerable), so no tavern offers him and the wiki keeps his secret, while COMPS.ander reads as any companion's; story:
   met only in his story (no town: world/companions.js compTown) */
ST.ander={n:'Ander',hp:84,dmg:12,spd:50,reach:16,range:0,cd:.75,tier:3,tags:['shock']};
Object.defineProperty(COMPS,'ander',{enumerable:false,configurable:true,writable:true,value:{n:'Ander The Fallen',short:'Ander',race:'human',story:true,
  d:'A veteran sellsword, scarred, in a dark cloak. Likes a hard fight won; hates running and cruelty.',react:{win:1,flee:-2,cruel:-2,mercy:1,kind:1}}});
