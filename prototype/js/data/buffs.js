'use strict';
/* ---------- data: upgrades for your units, the tech tree's (the owner, 2026-10-31: "tied to holdings, you have to visit the workshop/smith
   or relevant buildings for upgrades"; "tied to unit group"). Each, by its id: n its name, d what it says, at the building of a holding that
   offers it (a place: smith, stable, recruit ...), need what that holding must be (tier: its kind's, data/holdings.js), cost its gold a man,
   who the kinds it fits (none: all; any of race, unit (foot, ranged, mounted: data/units.js unitKind), cls (matchups.js unitClass: foot,
   spear, ranged, cav, magic), tier [lowest, highest], kinds [ids]), and mods what it changes on the field:
     hpPct, dmgPct, spdPct, reachPct, rangePct: a share more (.1: +10%); cdPct: a share of their swing or shot time (-.1: 10% faster);
     armor: points of armour (matchups.js ARMOR, 0-100); morale: points of morale.
   Bought and kept by world/buffs.js (Buffs). None yet: the tech tree adds them. One as it would be written:
     temperedBlades:{n:'Tempered blades',d:'Better steel for their swords.',at:'smith',need:{tier:3},cost:6,who:{unit:'foot'},mods:{dmgPct:.08}}
   ---------- */
const BUFFS={};
