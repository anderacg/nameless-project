'use strict';
/* ---------- the speed table: how fast everything moves, in one unit (doc/TIME_SPEED_DESIGN.md; the owner, 2026-11-28: "make the game
   use single time unit, speed and make all units, or characters even the town folks or camps or armys or bandit using the same
   speed system ... This also include world battle, battle screen and etc") ----------
   The unit: map px a game second (a game second: a real second at 1x, in every mode: core/time.js). The reference: a man on foot
   on open ground (man: his kind's speed stat, data/units.js ST.spd; a rider's 72 goes 72/38 as fast). Every mover's step is his
   pace x his gait x the ground x the step's time x the screen's scale (core/speed.js Speed). base: the map's own pace number
   for a march (world.js MAP_BASE: its parties' paces are reckoned on it).
   gait: the one ladder, a man's px a second at each: stalk (creeping up on game), laden (carrying), stroll (about his day), walk (a
     formation's advance in a fight), march (an army on the map, and whoever walks the map on his way), hurry (home from danger),
     run (a charge, a flight on foot), rout (a broken man's), sprint (your hero, in hand). flee: the map's walkers' run, till the
     ladder is made one.
   foot: the words the map's walkers use for their gaits (world.js footPace: town and camp folk, workers, hunters, sentries) and the
     ladder's gait each is.
   map: who else goes on the map at what, px a second on open ground: caravan, refugee, ship (a trader's) and boat (a fisher's),
     bandHome and bandWander (a band going home, and with nowhere to go), beast and beastWander (a beast after someone, and idle),
     herd and herdTame (a herd wandering: wild, and a holding's stock), gather (a scattered herd coming together), graze (a camp's
     beasts), loot (a band going to a field's leavings).
     A pace written as a number in the other tables (data/critters.js spd, data/monsters.js speed, data/encounters.js ENC_SPD) is
     on the march's old scale: 34 is a march (Speed.px turns it into px a second).
   body: a figure's own px to a map px: the battle screen and a town's scene draw a figure at its own size, 2 of its px to the
     map's 1 (a fight on the map draws it 3 times its field's px, 6 of them a map px: battle.js fightSpace).
   hero: your hero out of his ranks, times his men's time (the owner, 2026-11-18). */
const SPEED={
  man:38,base:34,
  gait:{stalk:5.11488,laden:7.757568,stroll:11.08224,walk:5.643,march:14.49216,hurry:15.77088,flee:21.73824,run:10.26,rout:11.286,sprint:16.416},
  foot:{walk:'march',run:'flee'},
  map:{caravan:7.24608,refugee:4.68864,ship:11.08224,boat:5.54112,bandHome:6.81984,bandWander:5.11488,beast:11.08224,beastWander:4.2624,herd:3.40992,herdTame:1.70496,gather:2.55744,graze:2.1312,loot:6.81984},
  body:2,
  hero:.85/.6
};
