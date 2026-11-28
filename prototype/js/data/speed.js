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
     run (a charge, a flight on foot), rout (a broken man's), sprint (your hero, in hand).
     The battle's speeds are the ladder's (the owner, 2026-11-28: chosen; walk and run as the battle was tuned, 2026-11-19): an
     army on the map marches between a formation's walk and a charge, a townsman strolls slower than a soldier walks. The map
     marched at 14.5 before; a day is as much longer (core/time.js Time.day: 708 game seconds at 1x, was 391), so a day's march
     covers the same ground and whatever is counted in days is as it was. Each number is a man's px a second: change one here
     and everyone at that gait follows.
   foot: a map walker's word for a gait where it is not the ladder's (world.js footPace: his walk is a march).
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
  gait:{stalk:3,laden:4,stroll:4.5,walk:5.643,march:8,hurry:9,run:10.26,rout:11.286,sprint:16.416},
  foot:{walk:'march'},
  map:{caravan:4,refugee:2.6,ship:6.1,boat:3.1,bandHome:3.8,bandWander:2.8,beast:6.1,beastWander:2.4,herd:1.9,herdTame:.95,gather:1.4,graze:1.2,loot:3.8},
  body:2,
  hero:.85/.6
};
