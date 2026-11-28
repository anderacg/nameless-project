# One clock, one speed table, even frames

The owner, 2026-11-28: "I still feel like the battle frame rate is not smooth, can you check and make the game use single time unit, speed and make all units, or characters even the town folks or camps or armys or bandit using the same speed system? This also include world battle, battle screen and etc. Design what you do first".

**Status:** built 2026-11-28 (the owner: "Go": choice A1, the battle's speeds everywhere; B, evened time on). Code: `core/time.js` `Time`, `data/speed.js` `SPEED`, `core/speed.js` `Speed`; `battle/route.js` `routeRegions`, `routeReach`, `routeNearest`. Tests: `smoothframes`, `speedtable`, `frametime`, `battlespeed`. What is in the game is in `prototype/README.md`, "Time and speed: one clock, one table"; what was built otherwise than designed here, and what is left, in §7.

## 1. What was measured

A fight of 40 against 40, phone size (844 x 390 at 3 device px), every battle feature on, the real frame loop, 12 seconds recorded. The machine is a test server, slower than a phone: read the numbers against each other, not as a phone's.

| | Simulation a frame | Worst step | Frames on time (a 60th) |
|---|---|---|---|
| Battle screen | 1.3 ms | 9 ms | 72%, the rest one late |
| Fight on the map | 11.4 ms (battle 9.7, the world round it 1.6) | 107 ms; one-off 200 to 300 ms | 62%, one in eight two or more late |

Drawing costs the same in both (9 to 10 ms). The unevenness is the simulation of a fight on the map. Its causes, each confirmed by taking it out and recording again:

1. **Extra steps.** A fight on the map steps its battle in sixtieths of a second (`WORLD_BATTLE.step`), whatever the frame rate. A phone on Auto runs at 30 frames a second (Graphics: Medium), so every frame runs the whole battle twice; a late frame, three times, which makes the next one late too. One step a frame: 9.7 to 7.2 ms.
2. **Every captain thinks on the same step**, twice a second (`FOE_CMD.think`), and each of its groups measures the way to every foe with a search of the whole field's ground (`routeDist`, asked only "can they reach it?"). That is a hitch of about 50 ms, about twice a second. In casual command your own army has a captain too. Without the search: 9.7 to 8.6 ms, the slowest hundredth of frames 79 to 42 ms; with cause 1 also gone, 5.2 ms and 32 ms.
3. **Work done in lumps.** Morale views (every .2 s), sight (every .25 s) and the look for reinforcements (every .25 s) each do all their men on one step; the world round the fight is stepped every third step with three steps' time (`OPEN_FIGHT.every`). When two or three land on one frame, it is long.
4. **Frames of unequal length move men unequal distances.** Each frame moves everyone by the time the last frame took; when frames alternate 33 and 50 ms, a man steps 2, 3, 2, 3 px. Nothing evens it out.
5. One-off hitches of .2 to .3 s in the world's update round the fight. Cause not yet traced.

## 2. Time and speed as they are

**Time: six clocks.**

| Where | A second of play is |
|---|---|
| The map | real x `WORLD_TEMPO` .75; its movers then x `WORLD_PACE` .4 ("world seconds"), its calendar real x .75 / 293 |
| Battle screen | real x `BATTLE_TEMPO` 1 x `BATTLE_PACE` 1 x the battle's speed, x .35 at a charge's impact, x .4 at your hero's kill |
| Fight on the map | the battle's clock for blows; a second clock, `dw`, the map's, for whoever walks in, passes by or regroups |
| Town and camp scenes | real time, no speed control |
| Herd animals, pasture animals, camp pitching, a column's turning | the wall clock (`performance.now`): they move while the game is paused and ignore 2x and 4x |
| Far parties, caravans, ships, beasts | counted in frames (every 4th or 12th step), so they think half as often at 30 frames a second as at 60 |

**Speed: five ways of writing it.** Open ground, 1x, a man on foot; all turned into map px a real second so they can be compared:

| Who | Written as | Map px a second |
|---|---|---|
| Your army, bandits, lords marching | 34 x the unit's pace ratio, x .4 x .75 x 1.11 x 1.28 | 14.5 |
| Patrols | the same x .75 | 10.9 |
| Bandits going home / wandering | the numbers 16 and 12 in the code | 6.8 / 5.1 |
| Caravans, refugees | `CARAVAN_SPD` 17, `REFUGEE_SPD` 11 | 7.2 / 4.7 |
| Ships, boats | 26, 13 | 11.1 / 5.5 |
| Town folk, workers, camp folk, hunters | gaits of 34: stroll, laden, walk, hurry, run | 11.1 / 7.8 / 14.5 / 15.8 / 21.7 |
| Deer, rabbits, livestock | 40, 30, 12 to 14; grazing 4 or 8 | 17.0 / 12.8 / 5.1 to 6.0; 1.7 / 3.4 |
| A soldier in a fight on the map | his stat 38 x .54, walking x .55, x 3 / 6 | walk 5.6, charge 10.3 |
| A rider in a fight on the map | stat 72, the same | charge 19.4 |
| Your hero out of his ranks | x 1.42 | about 14.5 |
| A soldier on the battle screen | stat 38 x .54, field px | as many of his own lengths a second as above |
| An army walking into a fight | the map's march | 14.5 (its men's steps 1.28 times too long, to be checked) |
| Your hero in a town scene, its folk | 64 and 20 scene px | their own |

So in one picture a peasant strolls past (11.1) faster than the soldiers charge (10.3), and an army marches in (14.5) faster than either: what the owner called "weird" on 2026-11-16. Each earlier fix added a multiplier; there are nine now.

## 3. The design

### 3.1 One clock: the game second

A game second is a real second at 1x, in every mode. `Time` (new, `core/time.js`) is the only reader of the frame's time and the only thing that scales it:

- `Time.frame(now)`: the real time since the last frame, evened (§3.3), times the mode's speed (the map's 1x, 2x, 4x and Travel fast; a battle's own speed; slow motion at a charge and at your hero's kill). It hands out steps of at most `TIME.step` (.05 game seconds): one step a frame at 20 frames a second or better, in every mode. A fight on the map loses its sixtieths.
- Every system gets the same two numbers: `dt` (game seconds, for whatever is simulated) and `real` (for effects and the HUD). `Systems.frame`, `updateBattle`, the scenes and the world round a fight all take them from `Time`.
- The calendar is read from it: a day is `DAY_SECONDS` game seconds (391: today's 293 / .75, so a day lasts what it lasts now). Hours and days stay as they are (`Clock`).
- `WORLD_PACE`, `WORLD_TEMPO`, `BATTLE_PACE`, `BATTLE_TEMPO`, `dw` and `heroBeat`'s own scaling go. The map's timers written in "world seconds" are rewritten in game seconds (each constant x 1 / .3), family by family, each checked by running old and new code side by side.
- Nothing simulated reads the wall clock: herd and pasture animals, pitching a camp and a column's turning move on `dt`, so they stop when paused and follow 2x.
- Nothing counts frames: far parties think every so many seconds (`WORLD_LOD`), the world round a fight every so many seconds.

### 3.2 One speed table

Every mover's step is one line: **its pace x its gait x the ground x the step's time x the screen's scale**. `Speed` (new, `core/speed.js`) does it; `SPEED` (new, `data/speed.js`) holds every number.

- **The unit:** map px a game second. One reference: a man on foot (stat 38).
- **Pace:** from what he is. Soldiers and characters: their stat (`ST.spd`, as now). Animals: their own (`CRITTERS.spd`). A party: its slowest and its average, as now (`paceRatio`), its size, its load. Caravans, refugees, ships and beasts get a row in the table instead of numbers in the code.
- **Gait:** one ladder for everyone: stroll, laden, walk, march, hurry, run, rout. Town folk stroll, workers go laden, armies march, soldiers walk in formation and run in a charge, bandits going home walk.
- **Ground:** the map's (`speedAt`: tile, climate, slope, road, water, weather) and a battlefield's (`speedFor`) stay two readers, their numbers side by side in the table; where they mean the same thing they become one number (road 1.1, frost .85).
- **Scale:** each screen has one: the map 1, a fight on the map 6 (its men drawn 3 times their size), the battle screen and a scene their own. `fightSpace`, `WORLD_SCALE.move` and `.travel`, `MARCH.walk` and `BATTLE_RHYTHM.move` fold into the ladder and these scales.
- **Who uses it:** your army and its marchers, lords, bandits, patrols, companions, caravans, refugees, ships, herds and their animals, beasts, town folk, workers, camp folk, hunters, sentries, road encounters; soldiers, riders, characters and your hero in both kinds of battle; whoever walks into, past or back to a fight on the map; you and the folk in a scene. Missiles, rolls, leaps and knockbacks keep their own speeds, written in the same unit.
- **Kept:** who outruns whom (flee odds, chases) reads the same paces, so no rule changes with a number on the ladder.

### 3.3 Even frames

1. One battle step a frame in a fight on the map (§3.1).
2. Captains: "can they reach it?" answered from the ground's regions, labelled once when the ground changes; each side's captain thinks on its own step.
3. A beat for periodic work (`Time.beat(period)`, each caller given its own offset): morale views, sight, the look for reinforcements and the world round a fight never land on the same step; morale views done a few groups a step.
4. Evened time: the frame's time rounded to the screen's own beat (a 60th or a 30th) and averaged over a few frames, so a late frame does not make men jump; what was lost is given back over the next frames.
5. A steady rate on High: when 60 cannot be held the game holds 30 and says so (Settings), in place of wavering between them.
6. The one-off hitches traced and fixed.
7. The developer console's Timings also show steps a frame and the worst frame of the last ten seconds.

**Aim:** a fight of 40 against 40 on the map: the battle's update under 4 ms a frame on the test server (9.7 now), no step over 16 ms.

## 4. Order of work

1. **Even frames first** (§3.3: 1, 2, 3, 6, 7). No rule changes. Battle fingerprints hold (the tests step in sixtieths already).
2. **`Time` and `Speed` with today's numbers.** A refactor: every mover goes through them, every speed in the table, nothing looks different. Old and new run side by side; fingerprints hold.
3. **Evened time and the steady rate** (§3.3: 4, 5).
4. **The ladder made one** (§5, choice A), then the wall-clock and frame-counted movers. This is where speeds change on screen; fingerprints that move are re-recorded with the reason.
5. **The map's timers into game seconds**, family by family.

Tests: a new `smoothframes` (steps a frame, the worst step, no lump of periodic work on one step); `speedtable` (every mover's speed read back from the table: a stroll is the same px a second for a townsman, a worker and a soldier; nothing moves while paused; 2x doubles everyone); `battlespeed` kept. `structure` gets a rule: no `performance.now` and no frame counting in simulation files, no speed number outside `data/speed.js`.

## 5. The owner's choices

**A. Whose speeds the one ladder takes.** A march on the map (14.5) and a charge in a fight (10.3) cannot both stay if a walk is to be a walk everywhere.

1. *The battle's speeds everywhere (recommended).* The battle was tuned last and most carefully ("not slow motion", "not so fast"). The ladder for a man: stroll 4.5, laden 4, walk 5.6, march 8, hurry 9, run 10.3, rout 11.3. Armies on the map march at 8 in place of 14.5; a day is made as much longer (11.8 minutes at 1x in place of 6.5), so a day's march covers the same ground and everything counted in days is unchanged. 2x then looks much as 1x does today.
2. *The map's speeds everywhere.* Fights 1.4 to 2.6 times faster: against what the owner asked on 2026-11-17 to 19.
3. *One table, two ladders.* Today's numbers kept exactly; the table says the map travels faster than a fight moves. The system is one; the picture stays as "weird" where the two meet.

**B. Evened time (§3.3: 4).** It makes motion smooth when frames are uneven, at the price of the picture running up to a frame behind for a moment after a hitch. Recommended on.

## 6. Left out

- No drawing between simulation steps (interpolation): with one step a frame and evened time it adds nothing, and it would touch every drawing routine.
- The cost of drawing (9 to 10 ms a frame here) is its own work: `?gpu=1` and the final composite, as said on 2026-11-27.

## 7. As built

- **The map's time is calendar time.** §3.1 and §4 step 5 said the map's timers would be rewritten in game seconds. They were not: everything the map counts is a share of a day (the owner's earlier requests kept it so), so the map keeps its own seconds, 293 a day, and `Time.map` makes them from game seconds in one place, at a rate that follows from the march's speed in the table. A day's march is the same ground at any speed; the timers needed no change and the world's fingerprints held.
- **The ladder as built** (map px a game second, a man on foot): stalk 3, laden 4, stroll 4.5, walk 5.6, march 8, hurry 9, run 10.3, rout 11.3, sprint 16.4. A day is 708 game seconds at 1x (was 391).
- **Two tables' pace numbers stay where they are**, on the march's old scale (34 is a march): the animals' (`CRITTERS.spd`), the beasts' (`data/monsters.js`) and the road encounters' (`ENC_SPD`). `Speed.px` turns one into px a second.
- **Even frames:** done: one battle step a frame, the captains' reach by regions, one way out for the men who break (a hitch of 129 ms found while measuring, not in §1), evened time, the steady rate. Not done: the beat for periodic work (§3.3 item 3): each side's captain on its own step and morale a few groups a step would move the battle's fingerprints for a few ms; the world round a fight still steps every third frame. The Timings panel already showed the worst frame (item 7). One hitch of .2 s in the parties' update round a fight was seen twice and not caught again in a 30 s profile: not traced.
- **Still counted in steps:** far parties, caravans, ships and beasts think every 4th or 12th step with that many steps' time (`WORLD_LOD`).
- **Still on the wall clock, drawing only:** a camp's tents going up, a caravan's gait frames, flags and fires.

