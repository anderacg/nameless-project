# Live world: marching bodies, battles in the open, loot on the ground

Status: §2 built, 2026-10-31 (the owner: "just change only #1 for now"; the wheel's outer men never faster than the army, as before; the step its own in world/march.js, not shared with physics.js: the battle's fingerprints untouched). §3 and §4: designed, waiting for the owner (§5).

The owner, 2026-10-31:
- "when the unit adjust their position (turning) in the marching it's like they are teleporting and their movement is not realistic. can we have movement pace like in battle?, like unit really have physics or something";
- "then can we make it real time battle? meaning there's no battle area like that any more";
- "loots will be drop like an items on the ground, like killing monster or npc in rpg games";
- "design first".

Builds on `WORLD_BATTLE_DESIGN.md` (today's world battles).

## 1. What is there today

- **The march** (`world/march.js` `MarchArmy#step`):
  - Each man walks toward his slot at a step of at most the army's pace.
  - A parting pass then moves anyone closer than his body straight out of the way, a position change with no motion behind it.
  - A man hemmed in squeezes through.
  - He has no speed of his own and no heading that turns at a rate, so he starts, stops and side-shifts at once. That is the teleporting look, worst in a wheel, where many slots slide past one another.
- **Battle movement** (`battle/physics.js` `physGo`):
  - Every soldier has a velocity and a heading, by kind (`PHYSICS.kinds`: foot, heavy, cavalry, beasts).
  - Each kind accelerates, brakes and turns at its own rate, with an arrival brake.
  - It is tied to the battle: `B.t`, the battle's terrain.
- **A world battle** (`battle/worldbattle.js`):
  - It is a separate mode. The game loop runs either the battle or the world (`main.js`), so while you fight the clock, every other party and every AI fight stand still.
  - It takes a snapshot of the map round the meeting into a bounded field at 6× scale (`BW`, `BH`, the ring). Its men are battle units, apart from the marchers, matched to them at the start and end only.
  - It opens with a muster and a Start Battle press. Routers leave by the ring's edge.
  - The battle code reads the one global `B` (about 1,170 places in 66 files) and the field's size (`BW`/`BH`, about 128 places).
- **Loot** (`ui/loot.js`, `world/fieldloot.js`):
  - After a fight everything won goes onto one pile you take from in a window.
  - Spoils left behind with beasts holding the field become a quest spot on the map.

## 2. Marching bodies (the march with battle physics)

Every marcher moves the way a soldier does in battle, at the map's scale:
- **Motion:**
  - Each has a velocity and a heading.
  - He speeds up, slows down and turns at his kind's rate (foot quick to turn, heavy foot slower, cavalry slow to turn and wide on a wheel, beasts by kind).
  - He brakes as he comes to his place.
  - He never moves except along his heading, so no shift sideways and no jump.
- **Crowding:**
  - The parting pass becomes a soft push on his velocity (men give way to one another over a moment), not a change of place.
  - The squeeze stays, as a slow walk through with the push turned off.
- **Pace:**
  - His top speed is the army's own step (roads and woods with it), as today.
  - In a wheel the outer men need a little more. §5, question 1, asks whether they may go up to ×1.25 the pace while well behind their place. With no catch-up the wheel is slower and the outer ranks trail.
- **Walk:** the walk frames follow his speed (slow walking, a run when he hurries), as in battle.

**How:**
- First a refactor that changes nothing: the heading-and-velocity step of `physGo` becomes a pure helper (a `Mover`: velocity, heading, kind's rates, one step toward a point) that takes its clock and ground as arguments. Battle fingerprints must hold.
- Then the march uses it in place of its straight step and its position pushes.
- Tunables in `MARCH_MOVE` (the kinds' rates × a map factor).
- Tests: `marchsmooth` (no sideways jump, heading change per step under the kind's turn rate, no slot more than a step off after a halt), and the march suites as they are.

Size: medium, one wave.

## 3. Battles in the open (no battle area)

The goal: a fight happens where the armies meet, on the live map. The world goes on round it. No ring, no separate field, no muster, no Start Battle. Others can walk into it, and you can walk out of it.

Done in stages, each playable on its own:

**Stage A, the world keeps running.**
- While a world battle runs, the world's frame runs too: the clock, the other parties, the AI fights, the march formations of those not in it. The game loop runs both, the battle at its own pace inside the world's time.
- **Gone:**
  - The muster and Start Battle: the armies fight from where they stand.
  - The ring: it is not drawn, and nobody is held in it.
- **The field** is still a field under the hood, but far larger than the meeting (the sight of everyone in it, and more). It is re-centred, or grows, as the fighters move (a rolling field: its terrain read from the map as it reaches new ground).
- **A router** runs until he is out of every enemy's sight and pursuit. Then he is off the field and back with his army on the map: alive, still wounded, no longer immortal.
- **The end:** no enemy fighting within a reach of any of yours for a few seconds. To leave, walk away: no withdraw order needed (it stays, as an order).
- **Pause** (Space) still stops everything, the world with it, and orders can be given paused.
- **Unchanged:** arena battles (sieges, tournaments, the lab, hunts in the arena).

**Stage B, others fight in it too.**
- AI fights that start within your sight while a battle runs join the same battle as further sides (the many-sided fights already exist: `W.fights` multi, `wars`).
- Those out of sight stay abstract, resolved by the tally as today.
- One battle at a time stays the rule: everything near you is one fight.

**Stage C (optional, large), one kind of man.**
- The marchers and the battle units become the same objects in map coordinates, so nothing swaps at the start or end of a fight.
- This would touch the battle code throughout (`B`, `BW`/`BH`, the 6× field, the sprite factor). Only worth it if A and B leave seams the owner can see.

**Risks:**
- Speed on a phone: the world's frame and a battle's together.
- The battle fingerprints (every world battle's numbers change: re-recorded with the owner's leave).
- Saves mid-battle: today a battle is never saved. With the world running, the plan keeps that: no save while fighting.

Size: A large (two waves), B medium, C very large.

## 4. Loot on the ground

**Drops:**
- Each fallen enemy leaves what he would have paid where he fell: a sack on the ground (gold, his kind's drops, any gear roll), drawn as a small item sprite.
- A beast leaves its trophies (pelt, tusk, meat). A chief or a lord leaves a chest.
- Rolled as today (the spoils, `monsterLoot`, the gear chances), only placed on the map instead of the pile.

**Picking up:**
- Walk your hero (or any man of yours) over it, or click it to walk there. Gold goes straight to your purse with a small pop of its amount.
- Items go to your bag. If the bag is full, the loot window opens with what you just picked up, to choose what to carry (the pile as today).

**Lasting:**
- A drop lasts `days` on the map.
- Bands nearby may come for it, and beasts guard theirs, as the field loot does today (`fieldloot.js` grows into this: one `LootDrop` world object, saved).
- A fight resolved without you (auto-resolve, an AI fight you won with allies) drops at the fight's place.

**The report:** the battle's report still shows what was won, but as "on the field", with the drops marked on the map.

**How:**
- A `LootDrop` world object, `world/lootdrops.js`: its place, its contents, its expiry, drawn with the item icons.
- A pick-up check each frame for your men near one.
- `invAdd` stays the one way into the bag, so the pile, overflow and quest items work as they do.

Size: medium, one wave. Independent of §3: it works with today's battles, and better with §3.

## 5. Questions for the owner

1. **The wheel's outer men:** may a marcher well behind his place go up to ×1.25 the army's pace (smoother wheels)? Or never faster than the army (slower, trailing wheels)? Last time: never faster.
2. **Time during a battle:** does the world's clock run while you fight (food eaten, day turns to night, other armies march on)? Or does it run only for the others (they move, the clock still)?
3. **The start of a fight:** no pause at all, or a short pause at first contact so you can give orders (Space to go on)?
4. **Ground loot pick-up:** walking over it picks it up at once? Or click and confirm, or only your hero?
5. **Gold:** dropped as sacks to pick up too, or straight to your purse at the end of the fight (only items on the ground)?
6. **Order of work:** suggested §2 (march physics), then §4 (ground loot), then §3 stage A, then B. Stage C only if needed.

## 6. Road travel by army type (the owner, 2026-11-01)

The goal: the road's speed is earned by an army that marches on it in a column, not by an army whose middle happens to touch it. Each kind of army travels in its own way.

**The road bonus belongs to the men.**
- Today an army's ground speed is read at its invisible middle (`world.js` `partySpeed`, `travelMul`), so a ring spread over a field gets the whole road bonus if its middle is on the road.
- Instead: an army's ground speed is the mean of what its men stand on (a sample of about 8 marchers, cheap). A column on the road gets all of the bonus. A ring across it gets a share. An army half in a wood is slowed by it.
- Parties not marched man by man (far off, `WORLD_LOD`): by their style. A column-on-road style on a road gets the bonus; the others do not.

**Travel styles** (one table, `TRAVEL_STYLES`, next to `MARCH_STYLES`):

| Who | On roads | Off roads |
|---|---|---|
| Caravans | Always a column (wagons in the middle, guards along it), keeping to the roads (`WAY.keep`) | Only when fleeing |
| Lords | A column on long trips | Near enemy territory: their battle style (offensive or defensive, `marchstyles.js`) |
| Bandits | Never a column: they cross roads and lurk near them | A loose pack, cutting across |
| Beasts, monsters | Ignore roads | A pack |
| You | By road (key B) on: a column | Off: your march layout |

**The column:**
- 2 men abreast for now, along the road as drawn (`RoadBand`), in the march's order (the van, then the main body round the leader, then the rear).
- The ring becomes a long oval along the road, so the place where others meet the army follows its men.
- **Forming up takes time.** From formation to column and back, the men file into their new places at their own pace (§2), and the army is slow while they do. It is a choice, not a free switch.

**A fight that finds an army in column** depends on detection:
- If the army detected the enemy before contact (its sight, its scouts, `TravelAwareness`), it has time to form up: its battle lanes, as today.
- If it was ambushed (not detected), the battle starts from the column as it marched: strung out, its flanks open.
- So road travel is fast but exposed, and scouting matters. Bandit ambushes on roads become a real danger.

**How:**
- `TRAVEL_STYLES` data, and a style per army: kind, trip length, and whether it is near enemy territory (`territory.js`).
- A column layout in `marchstyles.js`, laid along the way's road points.
- The ground speed from the men's sample, in one helper for `partySpeed` and `travelMul`.
- `arrangeMarch` and world battles use the column when the fight is an ambush.
- Tests:
  - a ring across a road is slower than a column on it;
  - a lord in column on a long trip, in his battle style near enemy land;
  - bandits never in column;
  - a caravan always in column on a road;
  - an ambushed column starts strung out;
  - an army that detected the enemy starts in lanes.

Size: medium to large, one wave, after the battle lanes (the default deployment, 2026-11-01). The fingerprints `worldprint` W6–W8 and `rts` will move: re-recorded with reasons.
