'use strict';
/* ---------- data: prisons, where captives are held (doc/PRISONS_DESIGN.md §3; world/captivity.js) ----------
   By the place's kind (a holding's kind, a bandit camp, a hideout): name (inside; on a holding's rail it is the Prison), brk
   (added to a break-out's odds), bribe (a bribe's cost, times), watch (the guards' watch from the first day: each a step off the
   odds of breaking out or bribing, a step dearer), beat (a failed break-out's beating, times; none 1).
   walls: a holding's break-out odds less per level of its walls (world/buildings.js wallOf); garrison: less per man of its
   garrison (t.gar), at most garMax. */
const PRISONS={
  village:{name:'Lock-up',brk:.12,bribe:.7,watch:0},
  town:{name:'Jail',brk:.04,bribe:1,watch:0},
  city:{name:'Prison',brk:0,bribe:1.4,watch:1},
  castle:{name:'Dungeon',brk:-.03,bribe:1.8,watch:1},
  camp:{name:'Cage',brk:.06,bribe:.7,watch:0,beat:1.5},
  hideout:{name:'The pit',brk:.06,bribe:.7,watch:0},
  walls:.02,garrison:.002,garMax:.06
};
