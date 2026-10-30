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
const ATTRS={str:['Strength','Health and damage'],agi:['Agility','Attack speed, footspeed and stamina'],int:['Intellect','Mana, and faster Tactics and Medicine'],cha:['Charisma','Party size, hire costs, Leadership and Trade']};
// disciplines: every one starts at 0 and rises only by doing what it names (state.js train); each gives more of that. A race
// or background gives a knack (P.apt): its disciplines are learned faster, never higher to start
const SKILLS={
  // fighting
  oneh:{n:'One-Handed',a:'str',d:'+0.6 damage and +0.4 reach per level with a one-handed grip (sword, axe, dagger, a spear with a shield). Rises with each hit you land one-handed'},
  twoh:{n:'Two-Handed',a:'str',d:'+0.6 damage and +0.4 reach per level with a two-handed grip (greatsword, warhammer, a spear in both hands). Rises with each hit you land two-handed'},
  block:{n:'Blocking',a:'str',d:'Blocked hits deal 1% less damage and guarding costs 3% less stamina per level. Rises with each hit you block'},
  archery:{n:'Archery',a:'agi',d:'Your arrows and bolts hit 4% harder per level. Rises with each one that hits'},
  spell:{n:'Spellcraft',a:'int',d:'Spells hit 4% harder and cost 2% less mana per level. Rises as you cast'},
  fist:{n:'Unarmed',a:'str',d:'+0.6 damage per level with your bare hands (no weapon in either hand): punches, kicks and throws. Rises with each blow you land unarmed'},
  athl:{n:'Athletics',a:'agi',d:'+4 stamina per level. Rises as you sprint and dodge'},
  // command
  lead:{n:'Leadership',a:'cha',d:'+1 army group slot per trained level above 2 (3 starting slots, 10 maximum), +1 party size, +1 prisoner and +3 to the floor under morale per level. Rises with each battle your troops win'},
  tact:{n:'Tactics',a:'int',d:'Auto-resolved battles go 5% better per level. Rises with each battle you win, most when you auto-resolve'},
  med:{n:'Medicine',a:'int',d:'7% per level that a fallen troop survives, and you heal 3% more a day. Rises as you tend your fallen'},
  eng:{n:'Engineering',a:'int',d:'10% a day per level that a siege camp gains an extra day of work. Rises each day of a siege'},
  pers:{n:'Persuasion',a:'cha',d:'Cornered foes are 3% likelier per level to yield. Rises each time you demand a surrender'},
  // the road
  scout:{n:'Scouting',a:'agi',d:'+8 map vision per level, and a better read of people and places before you act: at 2 a rough one (how they look, roughly how many), at 5 the numbers and the odds. Rises as you travel and spot new places'},
  ride:{n:'Riding',a:'agi',d:'+2% travel speed per level while mounted. Rises as you ride'},
  wood:{n:'Woodcraft',a:'agi',d:'Woods slow your band 6% less per level on the map (with Pathfinder, less again), and you yourself in battle. Rises as you travel through woods'},
  hunt:{n:'Hunting',a:'agi',d:'An extra kill every 3 levels and 5% more hides per level when you hunt. Rises with each beast you bring down'},
  surv:{n:'Survival',a:'int',d:'Frost, desert and swamp cost your band 6% less per level, and swamp fever strikes less often. Rises each day you camp in harsh land'},
  // trade and rule
  trade:{n:'Trade',a:'cha',d:'Better prices, about 1% per level, when you buy and sell. Rises with the gold you trade'},
  stew:{n:'Stewardship',a:'cha',d:'+3% taxes from your fiefs per level. Rises each day you hold fiefs'}
};
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
  // race: their people (all drawn human: people.js), whose capital they wait in where the world has no such town (compTown)
  brann:{n:'Brann the Wolf',short:'Brann',rival:'elske',town:'Karn Hold',race:'human',cost:120,look:'chief',d:'A ruthless sellsword. Likes ransoms and wins, hates running.',react:{ransom:2,win:1,flee:-2,release:-1,cruel:1,mercy:-1}},
  elske:{n:'Sister Elske',short:'Elske',town:'Saltmere',race:'human',cost:80,look:'militia',d:'An honorable healer. Wants prisoners freed, not sold.',react:{release:2,ransom:-2,hungry:-1,kind:2,cruel:-2,mercy:1}},
  tavi:{n:'Tavi Quickfoot',short:'Tavi',town:'Ashford',race:'human',cost:60,look:'ranger',d:'A cheerful scout. Hates going hungry or unpaid.',react:{win:1,hungry:-2,unpaid:-2,kind:1,cruel:-1}}
};
