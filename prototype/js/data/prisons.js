'use strict';
/* ---------- data: prisons, where captives are held (doc/PRISONS_DESIGN.md §3; world/captivity.js) ----------
   By the place's kind (a holding's kind, a bandit camp, a hideout): name (inside; on a holding's rail it is the Prison), brk
   (added to a break-out's odds), bribe (a bribe's cost, times), watch (the guards' watch from the first day: each a step off the
   odds of breaking out or bribing, a step dearer), beat (a failed break-out's beating, times; none 1), holds (how many leaders it
   keeps: lords, chieftains, companions), men (how many soldiers you may lock up in it).
   walls: a holding's break-out odds less per level of its walls (world/buildings.js wallOf); garrison: less per man of its
   garrison (t.gar), at most garMax. */
const PRISONS={
  hamlet:{name:'Lock-up',brk:.16,bribe:.6,watch:0,holds:2,men:6},
  village:{name:'Lock-up',brk:.12,bribe:.7,watch:0,holds:3,men:10},
  town:{name:'Jail',brk:.04,bribe:1,watch:0,holds:6,men:20},
  city:{name:'Prison',brk:0,bribe:1.4,watch:1,holds:12,men:40},
  fort:{name:'Stockade',brk:.02,bribe:1.2,watch:1,holds:4,men:16},
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
   for its watch; fine, found out), brk (breaking one out: base + per point of Athletics (athl), the prison's own odds (its walls
   and garrison in them) and its watch; won: his relation, the holding's realm hostile for days and honour lost; caught: fine,
   hurt), visit (a lord held: relation, once every days), offer (a lord in your prison: his realm's offer after so many days), ask
   (asking more: ch, more; refused: the offer withdrawn for wait days), exec (a lord put to death: honour with his realm, with
   every realm, his realm's lords' relation).
   (the owner, 2026-11-09: "Revise prisoner, and bribe ... make the logic make more sense") the gaoler's bribe: price, a share of
   the ransom by the prison's kind, so buying him is cheaper than paying, but a gamble; ch, the odds, + per point of Persuasion
   (pers) and of Trade (trade), less a step for the prison's watch and for its alarm; failing, he reports you (report of the
   failures: your coin taken, the watch's fine, the alarm) or else refuses (your coin back), and he hears no more from you today.
   alarm: a bribe reported or a break-out caught puts the watch on its guard for days, a step of watch more on both. field: a lord
   ransomed where you hold him, not from a prison, his realm's envoy paying a share of it (a quick deal; a prison's offer is the
   whole, and you may ask more); enemy: freeing a lord of a realm at war with yours costs honour with your own */
const PRISON={take:.5,ransom:[14,28],exchange:.1,comp:{escape:.03,base:60,lv:20},pay:{rel:10,honor:3,enemy:5},
  bribe:{price:.35,ch:.45,pers:.04,trade:.03,watch:.12,report:.5,fine:60},brk:{base:.3,athl:.01,watch:.06,rel:12,hostile:20,honor:5,fine:120,hurt:.25},
  alarm:{days:3,watch:1},field:.7,
  visit:{rel:2,days:7},offer:[5,10],ask:{ch:.4,more:1.5,wait:7},exec:{honor:-30,all:-5,rel:-25}};
