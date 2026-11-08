'use strict';
/* ---------- data: backgrounds, attributes, skills, perks and companions ---------- */
// A past decides your weapon (in wood), your purse and your strengths. weapon: a gear base (none: your bare hands, combat.js
// FISTS); gear: what else you wear ({slot: item}: a shooter's first quiver).
const BGS={
  soldier:{n:'Veteran soldier',weapon:'sword',d:'A sword and 60 gold. Known in your home town, so you can hire there right away. Strength and One-Handed.',gold:60,cargo:{grain:8},troops:{},bonus:2,attr:{str:2},sk:{oneh:2,lead:1},rep:12},
  guard:{n:'Village guard',weapon:'spear',d:'A spear and 45 gold. Steady against riders and beasts. Strength and Leadership.',gold:45,cargo:{grain:8},troops:{},bonus:1,attr:{str:1,cha:1},sk:{lead:2},rep:6},
  woodcutter:{n:'Woodcutter',weapon:'axe',d:'An axe, 35 gold and a load of timber. Tough and at home in the woods. Strength and Athletics.',gold:35,cargo:{grain:6,timber:6},troops:{},bonus:1,attr:{str:2},sk:{athl:2}},
  exile:{n:'Exiled archer',weapon:'bow',gear:{quiver:'q_worn'},d:'A bow, a worn quiver of 20 arrows and 45 gold. Moves unseen and sees far. Agility, Archery and Scouting.',gold:45,cargo:{grain:6},troops:{},bonus:0,attr:{agi:2},sk:{scout:1,archery:1}},
  merchant:{n:'Merchant\u2019s child',weapon:'crossbow',gear:{quiver:'q_wornCase'},d:'A crossbow, a worn case of 20 bolts, 110 gold and a small cart to trade. Charisma and Trade.',gold:110,cargo:{grain:10,cloth:4},troops:{},bonus:0,attr:{cha:2},sk:{trade:2}},
  hedge:{n:'Hedge mage',weapon:'staff',d:'A staff and 40 gold. Your spells hit hard; your purse is light. Intellect and Spellcraft.',gold:40,cargo:{grain:6},troops:{},bonus:0,attr:{int:2},sk:{spell:2}},
  nobody:{n:'Nobody',weapon:null,d:'Nothing but the clothes you stand in, a few coins and a crust for the road. You fight with your bare hands. Unarmed and Athletics.',gold:5,cargo:{grain:3},troops:{},bonus:0,attr:{},sk:{fist:2,athl:1}},
  apprentice:{n:'Runaway apprentice',weapon:'wand',d:'A wand, 55 gold and a quick wit. Intellect and Medicine.',gold:55,cargo:{grain:6},troops:{},bonus:0,attr:{int:1,agi:1},sk:{spell:1,med:1}}
};
// where a past begins and why (doc/START_AND_GATES_DESIGN.md §1.1; the owner, 2026-11-05: "start from nothing: you spawn in a
// small hamlet far away", every past, each its reason; a Nobody in a natural hamlet): at, whose (free: the free folk's; realm: a
// realm's; any); kinds, the holdings it may be; near, what it lies by (castle, road, woods, town, stones: a shrine or ruins); away:
// the farthest there is from the capitals, your own people's most (HUMBLE_START.off from every capital at least, for all); line,
// the first line ({h} the place, {c} what it lies by)
const PAST_START={
  nobody:{at:'free',kinds:['hamlet'],away:true,line:'You wake in {h}, a hamlet of free folk far from any lord\u2019s hall. They found you on the road with nothing and took you in.'},
  soldier:{at:'realm',kinds:['village'],near:'castle',line:'Paid off after the last campaign, you were left at {h}, the nearest village to {c}. Your sword is all the pay you kept.'},
  guard:{at:'any',kinds:['village'],near:'road',line:'The caravan you guarded broke up at {h}, and your pay went with it. The road goes on without you.'},
  woodcutter:{at:'any',kinds:['hamlet','village'],near:'woods',line:'The timber camp you worked for has shut for the season. {h}, by the woods, is where they let you go.'},
  exile:{at:'free',kinds:['hamlet','village'],away:true,line:'Cast out of your own lands, you came to {h}, where no lord asks questions.'},
  apprentice:{at:'any',kinds:['village','hamlet'],near:'town',line:'You ran from your master in {c}. {h} is as far as your coins took you.'},
  hedge:{at:'any',kinds:['hamlet','village'],near:'stones',line:'The old stones near {h} called to you, and here you are.'},
  merchant:{at:'realm',kinds:['village'],near:'road',line:'Your family\u2019s cart lost a wheel and its goods on the road. You limped into {h} with what was left, to start again.'}
};
const ATTRS={str:['Strength','Health and damage'],agi:['Agility','Attack speed, footspeed and stamina'],int:['Intellect','Mana, and faster Tactics and Medicine'],cha:['Charisma','Party size, hire costs, Leadership and Trade']};
// proficiencies (were disciplines): every one starts at 0 and rises only by doing what it names (state.js train); each gives more of
// that. A race or background gives a knack (P.apt): its proficiencies are learned faster, never higher to start
// (what each does, by proficiency level: power is level / PROF.per, so "per 10 levels" is a point of power)
const SKILLS={
  // fighting
  oneh:{n:'One-Handed',a:'str',d:'+0.6 damage and +0.4 reach per 10 levels with a one-handed grip (sword, axe, dagger, a spear with a shield). Rises with each hit you land one-handed'},
  twoh:{n:'Two-Handed',a:'str',d:'+0.6 damage and +0.4 reach per 10 levels with a two-handed grip (greatsword, warhammer, a spear in both hands). Rises with each hit you land two-handed'},
  block:{n:'Blocking',a:'str',d:'Blocked hits deal 1% less damage and guarding costs 3% less stamina per 10 levels. Rises with each hit you block'},
  archery:{n:'Archery',a:'agi',d:'Your arrows and bolts hit 4% harder per 10 levels. Rises with each one that hits'},
  spell:{n:'Spellcraft',a:'int',d:'Spells hit 4% harder and cost 2% less mana per 10 levels. Rises as you cast'},
  fist:{n:'Unarmed',a:'str',d:'+0.6 damage per 10 levels with your bare hands (no weapon in either hand): punches, kicks and throws. Rises with each blow you land unarmed'},
  athl:{n:'Athletics',a:'agi',d:'+4 stamina per 10 levels. Rises as you sprint and dodge'},
  // command
  lead:{n:'Leadership',a:'cha',d:'+1 unit slot per 10 levels above 20 (3 starting slots, 10 maximum), +1 prisoner and +3 to the floor under morale per 10 levels. Rises with each battle your troops win'},
  tact:{n:'Tactics',a:'int',d:'Auto-resolved battles go 5% better per 10 levels. Rises with each battle you win, most when you auto-resolve'},
  med:{n:'Medicine',a:'int',d:'7% per 10 levels that a fallen troop survives, and you heal 3% more a day. Rises as you tend your fallen'},
  eng:{n:'Engineering',a:'int',d:'10% a day per 10 levels that a siege camp gains an extra day of work. Rises each day of a siege'},
  pers:{n:'Persuasion',a:'cha',d:'Cornered foes are 3% likelier per 10 levels to yield. Rises each time you demand a surrender'},
  // the road
  scout:{n:'Scouting',a:'agi',d:'+8 map vision per 10 levels, and a better read of people and places before you act: at 20 a rough one (how they look, roughly how many), at 50 the numbers and the odds. Rises as you travel and spot new places'},
  ride:{n:'Riding',a:'agi',d:'+2% travel speed per 10 levels while mounted. Rises as you ride'},
  wood:{n:'Woodcraft',a:'agi',d:'Woods slow your band 6% less per 10 levels on the map (with Pathfinder, less again), and you yourself in battle. Rises as you travel through woods'},
  hunt:{n:'Hunting',a:'agi',d:'An extra kill every 30 levels and 5% more hides per 10 levels when you hunt. Rises with each beast you bring down'},
  surv:{n:'Survival',a:'int',d:'Frost, desert and swamp cost your band 6% less per 10 levels, and swamp fever strikes less often. Rises each day you camp in harsh land'},
  // trade and rule
  trade:{n:'Trade',a:'cha',d:'Better prices, about 1% per 10 levels, when you buy and sell. Rises with the gold you trade'},
  stew:{n:'Stewardship',a:'cha',d:'+3% taxes from your fiefs per 10 levels. Rises each day you hold fiefs'}
};
/* proficiencies (the owner, 2026-11-08; doc/PROFICIENCY_DESIGN.md): what were disciplines, now 0 to 99, each rising by use as before;
   your level is worked out from them. max: a proficiency's top; per: levels to one point of power (what its effects read: skill(k),
   so 99 is the old 10); xp0, xpUp: practice to the next level, xp0 + xpUp × its level;
   step: progress to level n is step × n(n+1)/2, progress the sum over proficiencies of weight × L(L+1)/2 at its level L (part of a
   level as its bar fills); weight: the easy ones count less toward your level (1 if not named); burst, damp: a proficiency practised
   more than burst times in one hour gets damp[0] of it, past twice that damp[1], till the next hour; reward: practice for each point
   of the experience a deed used to give, by kind (REWARD_TRAIN), 'weapon' your fighting proficiency; rose: a message every so many
   levels; pastPer: the levels a past gives free for each point of its old head start (P.sk0) */
// (slowed 2.5x, 2026-11-08, the owner: "proficiency increase too fast": a small battle won gave about 3 levels of your weapon's and
// Leadership at 20-30; now about 1.5. 0 to 99 about 2750 practice, was 1100; your level, worked out from them, follows. Was xp0 4, xpUp .145)
const PROF={max:99,per:9.9,xp0:10,xpUp:.3625,step:50,burst:6,damp:[.5,.25],reward:.5,rose:10,pastPer:10,
  weight:{ride:.8,wood:.8,surv:.8,stew:.8,athl:.8,scout:.6,trade:.6}};
const REWARD_TRAIN={battle:[['weapon',.6],['lead',.2],['tact',.2]],tourney:[['weapon',.7],['athl',.3]],monster:[['weapon',1]],hunt:[['hunt',1]],
  fight:[['weapon',.6],['lead',.4]],talk:[['pers',1]],search:[['scout',1]],trade:[['trade',1]],command:[['lead',1]],lore:[['scout',.5],['tact',.5]],story:[['pers',.5],['scout',.5]]};
// (a quest's kind of practice, by its class: what doing it is)
const QUEST_TRAIN={CourierQuest:'trade',SupplyQuest:'trade',StashQuest:'trade',FieldLootQuest:'trade',ScoutQuest:'search',VisitQuest:'search',MissingQuest:'search',
  HuntQuest:'hunt',TroopsQuest:'command',RelieveQuest:'command'};
const PERKS={
  shieldwall:{n:'Shieldwall',d:'Blocked hits deal only 10% damage.'},
  bloodlust:{n:'Bloodlust',d:'Your swings crit twice as often.'},
  quarter:{n:'Quartermaster',d:'Your band eats 25% less grain.'},
  drill:{n:'Drillmaster',d:'Training troops costs 40% less.'},
  silver:{n:'Silver Tongue',d:'Hiring troops costs 20% less.'},
  path:{n:'Pathfinder',d:'Forest and hills slow you half as much.'},
  warden:{n:'Warden',d:'Hold 6 more prisoners.'},
  vanish:{n:'Vanish',d:'+15% to get away when you flee in forest, hills or at night.'},
  rearguard:{n:'Rearguard',d:'Caught fleeing, you lose half as many men.'},
  forced:{n:'Forced March',d:'Your band travels 15% faster, and eats 20% more.'}
};
const ROLES={scout:'Scout',surgeon:'Surgeon',quarter:'Quartermaster',guide:'Guide',trainer:'Trainer'};
const COMPS={
  // short: name in passing; rival: a companion they quarrel with when both ride with you; town: whose tavern they wait in,
  // race: their people (all drawn human: people.js), whose capital they wait in where the world has no such town (compTown);
  // gender: 'm' or 'f', as their portraits show them (core/pronouns.js)
  brann:{n:'Brann the Wolf',short:'Brann',gender:'m',rival:'elske',town:'Karn Hold',race:'human',cost:120,look:'chief',d:'A ruthless sellsword. Likes ransoms and wins, hates running.',react:{ransom:2,win:1,flee:-2,release:-1,cruel:1,mercy:-1}},
  elske:{n:'Sister Elske',short:'Elske',gender:'f',town:'Saltmere',race:'human',cost:80,look:'militia',d:'An honorable healer. Wants prisoners freed, not sold.',react:{release:2,ransom:-2,hungry:-1,kind:2,cruel:-2,mercy:1}},
  tavi:{n:'Tavi Quickfoot',short:'Tavi',gender:'f',town:'Ashford',race:'human',cost:60,look:'ranger',d:'A cheerful scout. Hates going hungry or unpaid.',react:{win:1,hungry:-2,unpaid:-2,kind:1,cruel:-1}}
};
