'use strict';
/* ---------- data: playable races ---------- */
// home: biomes whose travel and survival penalties the race ignores (climates: grass, frost, desert, swamp; terrain: forest, hills)
const RACES={
  human:{n:'Human',d:'Adaptable. Hiring 1% cheaper; learns Leadership faster. 10% faster on roads and open grassland.',attr:{cha:1},sk:{lead:1},skin:'#e8c39e',melee:'hum_levy',ranged:'hum_bow',horse:'hum_squire',shield:'hum_foot',mage:'hum_mage',hires:{ranged:['hum_bow','hum_crossbow'],horse:[]},home:['grass']},
  dwarf:{n:'Dwarf',d:'Stubborn. +2 health, +0.25 damage and +3 mana; learns Trade fast. Ignores hills and frost.',attr:{str:1,int:1},sk:{trade:2},skin:'#d9a882',melee:'dw_clan',ranged:'dw_sling',horse:'dw_ram',shield:'dw_shield',mage:'dw_rune',home:['hills','frost']},
  elf:{n:'Elf',d:'Keen-eyed. +2.5 stamina, quicker blows and feet, +3 mana; learns Scouting fast. Moves through forest freely.',attr:{agi:1,int:1},sk:{scout:2},skin:'#f2dcc4',melee:'elf_glade',ranged:'elf_archer',horse:'elf_hart',shield:'elf_spear',mage:'elf_weaver',home:['forest']},
  orc:{n:'Orc',d:'Brutal. +4 health and +0.5 damage, hiring 1% dearer; learns One-Handed faster. Ignores desert heat and swamp.',attr:{str:2,cha:-1},sk:{oneh:1},skin:'#7aa35a',melee:'orc_grunt',ranged:'orc_thrower',horse:'orc_wolf',shield:'orc_shield',mage:'orc_shaman',home:['desert','swamp']}
};
// races no one plays, who only field troops (their looks: gfx/people.js RACE_LOOK); raceOf(r): a race of either table
const WILD_RACES={goblin:{n:'Goblin',home:['forest','swamp']}};
const raceOf=r=>RACES[r]||WILD_RACES[r]||null;
