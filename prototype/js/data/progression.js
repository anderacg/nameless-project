'use strict';
/* ---------- data: backgrounds, attributes, skills, perks and companions ---------- */
// A past decides your weapon (in wood), your purse and your strengths (bonus: damage, halved 2026-11-13: was 2, 1, 1). weapon: a gear base (none: your bare hands, combat.js
// FISTS); gear: what else you wear ({slot: item}: a shooter's first quiver).
const BGS={
  soldier:{n:'Veteran soldier',weapon:'sword',d:'A sword and 60 gold. Known in your home town, so you can hire there right away. One-Handed and Leadership.',gold:60,cargo:{grain:8},troops:{},bonus:1,sk:{oneh:2,lead:1},rep:12},
  guard:{n:'Village guard',weapon:'spear',d:'A spear and 45 gold. Steady against riders and beasts. Leadership.',gold:45,cargo:{grain:8},troops:{},bonus:.5,sk:{lead:2},rep:6},
  woodcutter:{n:'Woodcutter',weapon:'axe',d:'An axe, 35 gold and a load of timber. Tough and at home in the woods. Athletics.',gold:35,cargo:{grain:6,timber:6},troops:{},bonus:.5,sk:{athl:2}},
  exile:{n:'Exiled archer',weapon:'bow',gear:{quiver:'q_worn'},d:'A bow, a worn quiver of 20 arrows and 45 gold. Moves unseen and sees far. Scouting and Archery.',gold:45,cargo:{grain:6},troops:{},bonus:0,sk:{scout:1,archery:1}},
  merchant:{n:'Merchant\u2019s child',weapon:'crossbow',gear:{quiver:'q_wornCase'},d:'A crossbow, a worn case of 20 bolts, 110 gold and a small cart to trade. Trade.',gold:110,cargo:{grain:10,cloth:4},troops:{},bonus:0,sk:{trade:2}},
  hedge:{n:'Hedge mage',weapon:'staff',d:'A staff and 40 gold. Your spells hit hard; your purse is light. Spellcraft.',gold:40,cargo:{grain:6},troops:{},bonus:0,sk:{spell:2}},
  nobody:{n:'Nobody',weapon:null,d:'Nothing but the clothes you stand in, a few coins and a crust for the road. You fight with your bare hands. Unarmed and Athletics.',gold:5,cargo:{grain:3},troops:{},bonus:0,sk:{fist:2,athl:1}},
  apprentice:{n:'Runaway apprentice',weapon:'wand',d:'A wand, 55 gold and a quick wit. Spellcraft and Medicine.',gold:55,cargo:{grain:6},troops:{},bonus:0,sk:{spell:1,med:1}}
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
/* attributes are gone (the owner, 2026-11-08: "remove attribute system and turn into bonus upgrade along journey path in tree"). What
   they were is kept for two things: a check that named one (an encounter's odds, a story's condition, a chance) reads the best of
   these proficiencies' power instead (profs: "go for relevant first"; statOf, attrCheck); and a past's, a race's or an old node's
   "+1 Strength" is made into the bonuses a point of it gives (fx, half what a point gave before: attrMods) */
const ATTRS={str:{n:'Strength',profs:['oneh','twoh','fist','athl'],fx:{hp:2,dmg:.25}},agi:{n:'Agility',profs:['athl','ride','archery'],fx:{sp:2.5,cd:-.015,spd:.02}},
  int:{n:'Intellect',profs:['spell','med','tact','eng'],fx:{mp:3}},cha:{n:'Charisma',profs:['pers','lead','trade'],fx:{hire:.01}}};
const attrMods=(a,m={})=>{for(const k in a||{})for(const f in ATTRS[k].fx)m[f]=+((m[f]||0)+ATTRS[k].fx[f]*a[k]).toFixed(4);return m};
// proficiencies (were disciplines): every one starts at 0 and rises only by doing what it names (state.js train); each gives more of
// that. A race or background gives a knack (P.apt): its proficiencies are learned faster, never higher to start
// (what each does, by proficiency level: power is .06 a level to 100, slower past it (profPow); "per 10 levels" to 100)
const SKILLS={
  // fighting
  oneh:{n:'One-Handed',a:'str',d:'+0.36 damage and +0.24 reach per 10 levels with a one-handed grip (sword, axe, dagger, a spear with a shield). Rises with each hit you land one-handed'},
  twoh:{n:'Two-Handed',a:'str',d:'+0.36 damage and +0.24 reach per 10 levels with a two-handed grip (greatsword, warhammer, a spear in both hands). Rises with each hit you land two-handed'},
  block:{n:'Blocking',a:'str',d:'Blocked hits deal 0.6% less damage and guarding costs 1.8% less stamina per 10 levels. Rises with each hit you block'},
  archery:{n:'Archery',a:'agi',d:'Your arrows and bolts hit 2.4% harder per 10 levels. Rises with each one that hits'},
  spell:{n:'Spellcraft',a:'int',d:'Spells hit 2.4% harder and cost 1.2% less mana per 10 levels. Rises as you cast'},
  fist:{n:'Unarmed',a:'str',d:'+0.36 damage per 10 levels with your bare hands (no weapon in either hand): punches, kicks and throws. Rises with each blow you land unarmed'},
  athl:{n:'Athletics',a:'agi',d:'+2.4 stamina per 10 levels. Rises as you sprint and dodge'},
  // command
  lead:{n:'Leadership',a:'cha',d:'+1 unit slot per 17 levels above 33 (3 starting slots, all 10 at 150), +1 prisoner per 17 levels and +1.8 to the floor under morale per 10 levels. Rises with each battle your troops win'},
  tact:{n:'Tactics',a:'int',d:'Auto-resolved battles go 3% better per 10 levels. Rises with each battle you win, most when you auto-resolve'},
  med:{n:'Medicine',a:'int',d:'4.2% per 10 levels that a fallen troop survives, and you heal 1.8% more a day. Rises as you tend your fallen'},
  eng:{n:'Engineering',a:'int',d:'6% a day per 10 levels that a siege camp gains an extra day of work. Rises each day of a siege'},
  pers:{n:'Persuasion',a:'cha',d:'Cornered foes are 1.8% likelier per 10 levels to yield. Rises each time you demand a surrender'},
  // the road
  scout:{n:'Scouting',a:'agi',d:'+4.8 map vision per 10 levels, and a better read of people and places before you act: at 34 a rough one (how they look, roughly how many), at 84 the numbers and the odds. Rises as you travel and spot new places'},
  ride:{n:'Riding',a:'agi',d:'+1.2% travel speed per 10 levels while mounted. Rises as you ride'},
  wood:{n:'Woodcraft',a:'agi',d:'Woods slow your band 3.6% less per 10 levels on the map (with Pathfinder, less again), and you yourself in battle. Rises as you travel through woods'},
  hunt:{n:'Hunting',a:'agi',d:'An extra kill every 30 levels and 3% more hides per 10 levels when you hunt. Rises with each beast you bring down'},
  surv:{n:'Survival',a:'int',d:'Frost, desert and swamp cost your band 3.6% less per 10 levels, and swamp fever strikes less often. Rises each day you camp in harsh land'},
  // trade and rule
  trade:{n:'Trade',a:'cha',d:'Better prices, about 0.6% per 10 levels, when you buy and sell. Rises with the gold you trade'},
  stew:{n:'Stewardship',a:'cha',d:'+1.8% taxes from your fiefs per 10 levels. Rises each day you hold fiefs'}
};
/* proficiencies (the owner, 2026-11-08; doc/PROFICIENCY_DESIGN.md): what were disciplines, from 0 with no top, each rising by use as
   before. max: a proficiency's top (none); per: the levels to a point of power, to 100 (1 ÷ k: a made character's levels from
   its old points, so a lord as strong as before, never past made);
   k, lin, log: its power, what its effects read (skill(k), profPow): k a level to lin, then log × ln(level / lin) more (6 at 100, 10 at
   500, about 12 at 1000; it was a level ÷ 9.9, 10 at 99); xp0, xpUp: practice to the next level, xp0 + xpUp × its level; burst, damp:
   a proficiency practised more than burst times in one hour gets damp[0] of it, past twice that damp[1], till the next hour; reward:
   practice for each point of experience a deed gives, by kind (REWARD_TRAIN), 'weapon' your fighting proficiency; rose: a message
   every so many levels; pastPer: the levels a past gives free for each point of its head start (P.sk0, rounded: 15 at most, the
   owner: "start at very low proficiency bonus like up to 15"; was 10, 20 at most) */
// (slowed 2.5x, 2026-11-08, the owner: "proficiency increase too fast": a small battle won gave about 3 levels of your weapon's and
// Leadership at 20-30; now about 1.5. 0 to 99 about 2750 practice, was 1100; your level, worked out from them, follows. Was xp0 4, xpUp .145)
// (no top for now, 2026-11-08, the owner: "remove the proficiency cap for now, may be max at 9999": max 9999, was 99. made: the old top:
// the most a made character starts with (a lord, a chieftain, a companion, a past), and as far as the effects made for it read a
// proficiency (prices, Survival's food, Blocking's stamina, sight: skillSafe, its gear and tree on top as ever), past it they would turn
// over (a price under nothing, a block that gives stamina back); the rest grow on with it)
const PROF={max:Infinity,made:99,per:50/3,k:.06,lin:100,log:2.5,xp0:10,xpUp:.3625,burst:6,damp:[.5,.25],reward:.5,rose:10,pastPer:7.5};
// a proficiency's power at level lv (PROF k, lin, log)
const profPow=lv=>lv<=PROF.lin?lv*PROF.k:PROF.lin*PROF.k+PROF.log*Math.log(lv/PROF.lin);
/* your level, as Skyrim's (the owner, 2026-11-08: "you get XP from quest, battle, etc. and from proficiency. Once level up you will get
   skill point to be spent on the proficiency trees"): experience from what you do (battles, quests, beasts, lore: gainXp) and from
   each level a proficiency reaches (prof × that level); base + per × your level to the next (75, 125, 175…: about level 10 in two or
   three hours, 30 in fifteen, 50 in forty); each level pts skill points for the tree (no health, stamina or mana to choose: the
   tree's nodes give them); dmg: your hero's damage a level (was 2, then 1 till 2026-11-13). A companion's the same; a lord's or chieftain's as ever (LV_XP) */
const LEVEL={base:75,per:50,prof:1,pts:1,dmg:.5};
// a node's strength by its proficiency's level (the owner: "quarter at 0"): most × (lo at 0, 1 at full, then past × ln(level / full)
// more); whole: what is counted whole, never part of one (a unit slot, a prisoner), at its full number from the start. (most .6,
// 2026-11-13, the owner: "reduce stats or attributes bonus": 15% of a node at 0, 60% at 100; was 1, a quarter at 0, whole at 100)
const TREE_SCALE={lo:.25,full:100,past:.5,most:.6,whole:['slots','prison']};
const treeScale=lv=>TREE_SCALE.most*(lv<=TREE_SCALE.full?TREE_SCALE.lo+(1-TREE_SCALE.lo)*lv/TREE_SCALE.full:1+TREE_SCALE.past*Math.log(lv/TREE_SCALE.full));
// your hero's numbers before gear and tree: health, damage, battle speed, swing time, stamina, mana (2026-11-13, the owner: "starting
// hero power seems too strong": a veteran soldier 55 health and about 19 damage a second, was 67 and 31; a footman 32 and 7. Was hp
// 58, dmg 9, spd 52, cd .423, sp 70, mp 42, as the old start's, every attribute 2)
const HERO_BASE={hp:46,dmg:6,spd:50,cd:.48,sp:60,mp:36};
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
