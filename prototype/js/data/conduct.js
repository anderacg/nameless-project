'use strict';
/* ---------- data: what your deeds cost or earn ---------- */
// rep: reputation at the holding it touches; honor: with that holding's owner; hostile: days the owner stays hostile;
// fear: days its workers keep off the fields (half its output); pros: prosperity it loses; morale: your band's.
// For refugees, "home" is where they fled from and "to" where they are bound.
const CONDUCT={
  robWorker:{rep:8,honor:3,fear:2},
  pressWorker:{rep:10,honor:4,fear:3,morale:2},
  feedRefugees:{food:5,rep:6,repTo:4,honor:2},
  settleRefugees:{rep:2,honor:2},
  robRefugees:{rep:12,honor:4,repTo:8,honorTo:3,morale:3},
  plunderEstate:{rep:10,honor:5,hostile:20,pros:8,fear:3},
  burnEstate:{rep:18,honor:8,hostile:30,pros:15,fear:3},
  sabotageEstate:{rep:3},// unseen; caught, it costs as a plunder does
  toll:{rep:4,honor:3},
  takeBrigands:{honorAll:2,morale:4}
};
