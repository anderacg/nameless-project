'use strict';
/* ---------- data: backgrounds, attributes, skills, perks and companions ---------- */
// A past decides your weapon (in wood), your purse and your strengths. weapon: a gear base; ammo: [good, count].
const BGS={
  soldier:{n:'Veteran soldier',weapon:'sword',d:'A sword and 60 gold. Known in your home town, so you can hire there right away. Strength and One-Handed.',gold:60,cargo:{grain:8},troops:{},bonus:2,attr:{str:2},sk:{oneh:2,lead:1},rep:12},
  guard:{n:'Village guard',weapon:'spear',d:'A spear and 45 gold. Steady against riders and beasts. Strength and Leadership.',gold:45,cargo:{grain:8},troops:{},bonus:1,attr:{str:1,cha:1},sk:{lead:2},rep:6},
  woodcutter:{n:'Woodcutter',weapon:'axe',d:'An axe, 35 gold and a load of timber. Tough and at home in the woods. Strength and Athletics.',gold:35,cargo:{grain:6,timber:6},troops:{},bonus:1,attr:{str:2},sk:{athl:2}},
  exile:{n:'Exiled archer',weapon:'bow',ammo:['arrows',30],d:'A bow, 30 arrows and 45 gold. Moves unseen and sees far. Agility, Archery and Scouting.',gold:45,cargo:{grain:6},troops:{},bonus:0,attr:{agi:2},sk:{scout:1,archery:1}},
  merchant:{n:'Merchant\u2019s child',weapon:'crossbow',ammo:['bolts',20],d:'A crossbow, 20 bolts, 110 gold and a small cart to trade. Charisma and Trade.',gold:110,cargo:{grain:10,cloth:4},troops:{},bonus:0,attr:{cha:2},sk:{trade:2}},
  hedge:{n:'Hedge mage',weapon:'staff',d:'A staff and 40 gold. Your spells hit hard; your purse is light. Intellect and Spellcraft.',gold:40,cargo:{grain:6},troops:{},bonus:0,attr:{int:2},sk:{spell:2}},
  apprentice:{n:'Runaway apprentice',weapon:'wand',d:'A wand, 55 gold and a quick wit. Intellect and Medicine.',gold:55,cargo:{grain:6},troops:{},bonus:0,attr:{int:1,agi:1},sk:{spell:1,med:1}}
};
const ATTRS={str:['Strength','Health and damage'],agi:['Agility','Attack speed, footspeed and stamina'],int:['Intellect','Mana, and faster Tactics and Medicine'],cha:['Charisma','Party size, hire costs, Leadership and Trade']};
const SKILLS={
  oneh:{n:'One-Handed',a:'str',d:'Damage and reach'},
  lead:{n:'Leadership',a:'cha',d:'Party size, prisoners, morale floor'},
  trade:{n:'Trade',a:'cha',d:'Better buy and sell prices'},
  tact:{n:'Tactics',a:'int',d:'Stronger auto-resolve'},
  med:{n:'Medicine',a:'int',d:'Fallen troops may survive'},
  scout:{n:'Scouting',a:'agi',d:'See farther on the map'},
  archery:{n:'Archery',a:'agi',d:'Your arrows hit 4% harder per level. Rises when they hit'},
  spell:{n:'Spellcraft',a:'int',d:'Spells hit 4% harder and cost 2% less mana per level. Rises as you cast'},
  athl:{n:'Athletics',a:'agi',d:'+4 stamina per level. Rises as you sprint and dodge'},
  eng:{n:'Engineering',a:'int',d:'Siege camps build faster. Rises each day of a siege'}
};
const PERKS={
  shieldwall:{n:'Shieldwall',d:'Blocked hits deal only 10% damage.'},
  bloodlust:{n:'Bloodlust',d:'Your swings crit twice as often.'},
  quarter:{n:'Quartermaster',d:'Your band eats 25% less grain.'},
  drill:{n:'Drillmaster',d:'Training troops costs 40% less.'},
  silver:{n:'Silver Tongue',d:'Hiring troops costs 20% less.'},
  path:{n:'Pathfinder',d:'Forest and hills slow you half as much.'},
  warden:{n:'Warden',d:'Hold 6 more prisoners.'}
};
const ROLES={scout:'Scout',surgeon:'Surgeon',quarter:'Quartermaster'};
const COMPS={
  // short: name in passing; rival: a companion they quarrel with when both ride with you
  brann:{n:'Brann the Wolf',short:'Brann',rival:'elske',town:'Karn Hold',cost:120,look:'chief',d:'A ruthless sellsword. Likes ransoms and wins, hates running.',react:{ransom:2,win:1,flee:-2,release:-1,cruel:1,mercy:-1}},
  elske:{n:'Sister Elske',short:'Elske',town:'Saltmere',cost:80,look:'militia',d:'An honorable healer. Wants prisoners freed, not sold.',react:{release:2,ransom:-2,hungry:-1,kind:2,cruel:-2,mercy:1}},
  tavi:{n:'Tavi Quickfoot',short:'Tavi',town:'Ashford',cost:60,look:'ranger',d:'A cheerful scout. Hates going hungry or unpaid.',react:{win:1,hungry:-2,unpaid:-2,kind:1,cruel:-1}}
};
