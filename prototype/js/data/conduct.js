'use strict';
/* ---------- data: what your deeds cost or earn ---------- */
// rep: reputation at the holding it touches; honor: with that holding's owner; hostile: days the owner stays hostile;
// fear: days its workers keep off the fields (half its output); pros: prosperity it loses; morale: your band's.
// For refugees, "home" is where they fled from and "to" where they are bound.
const CONDUCT={
  robWorker:{rep:8,honor:3,fear:2},
  killWorkers:{rep:20,honor:8,fear:5,hostile:[10,20]},// (hostile: the realm's days, rolled between the two)
  robFailed:{rep:8},// they fought you off, or you fled them: their holding's guards want you too (ROB.hostile days)
  pressWorker:{rep:10,honor:4,fear:3,morale:2},
  feedRefugees:{food:5,rep:6,repTo:4,honor:2},
  settleRefugees:{rep:2,honor:2},
  robRefugees:{rep:12,honor:4,repTo:8,honorTo:3,morale:3},
  plunderEstate:{rep:10,honor:5,hostile:20,pros:8,fear:3},
  burnEstate:{rep:18,honor:8,hostile:30,pros:15,fear:3},
  sabotageEstate:{rep:3},// unseen; caught, it costs as a plunder does
  toll:{rep:4,honor:3},
  robMessenger:{rep:6,honor:6},// a realm's rider on the road (world/road.js), robbed: his realm's nearest holding
  takeBrigands:{honorAll:2,morale:4},
  // the homeless sheltering in searched ruins (sites.js RUIN_OCC): help them with gold or food (honor with the realm whose land
  // it is), or chase them off
  helpRefugees:{gold:20,food:5,honor:2},
  chaseRefugees:{honor:2}
};
/* robbing villagers (doc/CONDUCT_RUINS_DESIGN.md §2, folk.js): what a worker carries by what he is doing (st: at work 'in', on the
   way to the holding 'out', in town or on the way home 'town'; goods: of his product, coins: [from, to]); whether they fight
   back: their power (the workers within reach tiles, the estate's guards if he is within reach of it) against yours, × k, ×
   their people's nerve, × fear while their holding already fears you, × love where it prospers (pros at loveAt or more),
   between resist[0] and resist[1]; memory: the days a robbed worker remembers you, estate: the days his whole estate does after
   a killing or a press-gang; hostile: the days their holding's guards want you when they fought you off or you fled */
const ROB={loot:{in:{goods:[1,2],coins:[1,3]},out:{goods:[3,6],coins:[2,5]},town:{goods:[0,0],coins:[6,15]}},
  reach:5,k:.6,nerve:{orc:1.4,dwarf:1.2,human:1,elf:.9},fear:.6,love:1.2,loveAt:70,resist:[.05,.9],memory:5,estate:10,hostile:5};
