'use strict';
/* ---------- data: a fight lost to beasts (the owner, 2026-11-09: "When you lost to the beast, or monster, you should be dead. But
   there might be a chance that you may survived which would be wounded but the day should be passed and the monster should not be
   there anymore"; doc/DEATH_DESIGN.md). World/death.js Death reads it ----------
   on: the rule at all (the tests' harness: off, a beast's loss as before); die: a roll lost kills you (phase 2, not built: off, every
   roll lives); live: the chance to live, shifted (shift) and kept within min-max:
     med: a point of the best Medicine among those who fell; armor: your body armour's class; day / night; near: a holding within
     near tiles; road: on a road; lv: each level of the beast past the first (less); big: a big beast (less); mythic (less); frost: a
     frost night (less); alone: no companion and no soldier with you (less);
   wake: the hours you lie there; hp: your health on waking (of the most); weak: the days you are weak, and your damage and speed
   while so; food: the share of your food the beasts eat; horse: the chance your horse bolts (lost);
   comps: where your companions wake (among the n nearest holdings), wounded for hurt days; after wander days they leave your service
   for another holding (a tile range), their approval left lower; won back: a talk (base, a point of Persuasion, a point of approval,
   min-max; one a day) or their pay (base + lv a level);
   pass: the chance each passenger you escort lives (else slain);
   eater: the chance the beast becomes a man-eater: levels and beasts it gains, its bounty (× a quest's gold that marks it), the
   renown for slaying it, the parts of its name */
const DEATH={on:true,die:false,live:.3,min:.1,max:.6,
  shift:{med:.03,armor:{leather:.03,mail:.06,plate:.1},day:.05,night:-.05,near:.08,road:.04,lv:.02,big:.08,mythic:.2,frost:.06,alone:.05},near:12,
  wake:24,hp:.2,weak:{days:3,dmg:.85,spd:.9},food:.6,horse:.5,
  comps:{n:3,hurt:2,wander:7,far:[8,30],left:2,talk:{base:.35,pers:.05,ap:.04,min:.1,max:.9},pay:{base:40,lv:12}},
  pass:.5,
  eater:{chance:.6,lv:2,n:1,bounty:1.5,renown:12,first:['Grey','Red','Black','Old','Scarred','Pale','Hollow','Silent'],last:['Widow','Maw','Hunger','Shadow','Fang','Reaver','Ghost','Butcher']}};
