'use strict';
/* ---------- data: playable races ---------- */
// home: biomes whose travel and survival penalties the race ignores (climates: grass, frost, desert, swamp; terrain: forest, hills)
const RACES={
  human:{n:'Human',d:'Adaptable. +1 Charisma; learns Leadership faster. 10% faster on roads and open grassland.',attr:{cha:1},sk:{lead:1},skin:'#e8c39e',melee:'hum_levy',ranged:'hum_bow',horse:'hum_squire',shield:'hum_foot',mage:'hum_mage',home:['grass']},
  dwarf:{n:'Dwarf',d:'Stubborn. +1 Strength, +1 Intellect; learns Trade fast. Ignores hills and frost.',attr:{str:1,int:1},sk:{trade:2},skin:'#d9a882',melee:'dw_clan',ranged:'dw_sling',horse:'dw_ram',shield:'dw_shield',mage:'dw_rune',home:['hills','frost']},
  elf:{n:'Elf',d:'Keen-eyed. +1 Agility, +1 Intellect; learns Scouting fast. Moves through forest freely.',attr:{agi:1,int:1},sk:{scout:2},skin:'#f2dcc4',melee:'elf_glade',ranged:'elf_archer',horse:'elf_hart',shield:'elf_spear',mage:'elf_weaver',home:['forest']},
  orc:{n:'Orc',d:'Brutal. +2 Strength, −1 Charisma; learns One-Handed faster. Ignores desert heat and swamp.',attr:{str:2,cha:-1},sk:{oneh:1},skin:'#7aa35a',melee:'orc_grunt',ranged:'orc_thrower',horse:'orc_wolf',shield:'orc_shield',mage:'orc_shaman',home:['desert','swamp']}
};
