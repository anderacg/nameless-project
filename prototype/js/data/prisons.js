'use strict';
/* ---------- data: prisons, where captives are held (doc/PRISONS_DESIGN.md §3; world/captivity.js) ----------
   By the place's kind (a holding's kind, a bandit camp, a hideout): name (inside; on a holding's rail it is the Prison), brk
   (added to a break-out's odds), bribe (a bribe's cost, times), watch (the guards' watch from the first day: each a step off the
   odds of breaking out or bribing, a step dearer), beat (a failed break-out's beating, times; none 1), holds (how many leaders it
   keeps: lords, chieftains, companions), men (how many soldiers you may lock up in it).
   walls: a holding's break-out odds less per level of its walls (world/buildings.js wallOf); garrison: less per man of its
   garrison (t.gar), at most garMax. */
const PRISONS={
  village:{name:'Lock-up',brk:.12,bribe:.7,watch:0,holds:3,men:10},
  town:{name:'Jail',brk:.04,bribe:1,watch:0,holds:6,men:20},
  city:{name:'Prison',brk:0,bribe:1.4,watch:1,holds:12,men:40},
  castle:{name:'Dungeon',brk:-.03,bribe:1.8,watch:1,holds:8,men:30},
  camp:{name:'Cage',brk:.06,bribe:.7,watch:0,beat:1.5,holds:3,men:0},
  hideout:{name:'The pit',brk:.06,bribe:.7,watch:0,holds:3,men:0},
  walls:.02,garrison:.002,garMax:.06
};
/* the prisons' rules (world/prisons.js Prisons): take (a lord routed by a realm at war with his: taken to its prison, else he gets
   away and rebuilds), ransom (his realm pays his ransom after so many days, from its treasury to his keeper's; short of it, a week
   later), exchange (a day's chance two realms at war trade a lord each), comp (your companion held: escape, a day's chance he gets
   away and finds you; price, his ransom: base + per level), pay (paying a lord's ransom: his relation, and your honour with his
   realm if it is yours), bribe (the gaoler, to free one: price, his ransom times, by the prison's kind; ch, the chance, less a step
   for its watch; fine, found out), brk (breaking one out: base + per point of Agility and of Athletics, the prison's own odds and
   its watch; won: his relation, the holding's realm hostile for days and honour lost; caught: fine, hurt), visit (a lord held:
   relation, once every days), offer (a lord in your prison: his realm's offer after so many days), ask (asking more: ch, more;
   refused: the offer withdrawn for wait days), exec (a lord put to death: honour with his realm, with every realm, his realm's
   lords' relation) */
const PRISON={take:.5,ransom:[14,28],exchange:.1,comp:{escape:.03,base:60,lv:20},pay:{rel:10,honor:3},
  bribe:{price:.5,ch:.55,watch:.15,fine:60},brk:{base:.3,agi:.02,athl:.01,watch:.06,rel:12,hostile:20,honor:5,fine:120,hurt:.25},
  visit:{rel:2,days:7},offer:[5,10],ask:{ch:.4,more:1.5,wait:7},exec:{honor:-30,all:-5,rel:-25}};
