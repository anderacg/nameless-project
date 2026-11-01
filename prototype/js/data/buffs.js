'use strict';
/* ---------- data: upgrades for your units, the tech tree's (the owner, 2026-10-31: "tied to holdings, you have to visit the workshop/smith
   or relevant buildings for upgrades"; "tied to unit group"). Each, by its id: n its name, d what it says, at the building of a holding that
   offers it (a place: smith, stable, recruit ...), need what that holding must be (tier: its kind's, data/holdings.js), cost its gold a man,
   who the kinds it fits (none: all; any of race, unit (foot, ranged, mounted: data/units.js unitKind), cls (matchups.js unitClass: foot,
   spear, ranged, cav, magic), tier [lowest, highest], kinds [ids]), and mods what it changes on the field:
     hpPct, dmgPct, spdPct, reachPct, rangePct: a share more (.1: +10%); cdPct: a share of their swing or shot time (-.1: 10% faster);
     armor: points of armour (matchups.js ARMOR, 0-100); morale: points of morale.
   skill: a skill it teaches the group (doc/UNIT_KITS_DESIGN.md §5, "Skills from the tech tree"; battle/unitkit.js UnitKit reads it,
   KITS.cap): one of battle/unitabilities.js UNIT_SKILLS, in the group's next free skill slot, idle for a kind whose soldiers cannot use it.
   Bought and kept by world/buffs.js (Buffs). The tech tree adds the rest. One as it would be written:
     temperedBlades:{n:'Tempered blades',d:'Better steel for their swords.',at:'smith',need:{tier:3},cost:6,who:{unit:'foot'},mods:{dmgPct:.08}}
   ---------- */
const BUFFS={
  // PLACEHOLDER building: at 'smith' only so Fire arrows can be bought and tested; which building sells it is the owner's to say
  // (doc/UNIT_KITS_DESIGN.md §5: "a fletcher's or the smith's, at a level")
  fireArrows:{n:'Fire arrows',d:'Pitch, tow and fire pots: their bows and crossbows can loose fire arrows (a skill).',at:'smith',need:{tier:1},cost:4,who:{cls:'ranged'},skill:'fire',placeholder:true}};
