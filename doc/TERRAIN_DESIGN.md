# Terrain that matters: design proposal

**Status:** proposal only, nothing built yet (2026-10-17, written against HEAD 460c917 on `battle-rts-and-world`).
**Plan item:** IMPLEMENTATION_PLAN §4 battle fun pipeline item 3: "hills (range, downhill charge), river and bridge chokepoints, woods that hide and slow cavalry". It also prepares item 5 (battle types: *hold the bridge*, *ambush*).
**Readers:** the owner, who makes the decisions in §9, and the developer agents who will build it.

---

## 1. What exists today, and what is missing

| Today | Where | Effect |
|---|---|---|
| **One biome rule for the whole field.** `battleEnv()` reads the world tile under the player. Mountain and water tiles count as hill. | `setup.js` `battleEnv`, `envStats` | **Hill:** shooters get +15% range everywhere. **Grass:** cavalry is 15% faster. **Frost:** everyone is 15% slower, except races at home there. **Swamp:** foot is 20% slower and mounted 35% slower, except orcs. **Desert:** melee is 10% slower. The rule is baked into `u.s` when the unit spawns. |
| **Scattered obstacles.** `B.obs`: trees, rocks and cacti, as circles with r 5–7. | `setup.js` `placeObstacles`, `battle.js` `obstaclePush`, `render.js` y-sort | Forest gets 12 trees per screen of field, hill 6 rocks, others 2–6. They block movement (soldiers slide round). Trees stop 25–35% of low arrows (elves and magic pass), and trees and rocks block the morale view (`moraleVisible`). |
| **Painted ground.** One canvas per climate and field width. | `worldart.js` `paintArena`, `sprites.js` `arenaFor` | Fbm noise ground, decor, and swamp pools that are drawn only. |
| **Minimap.** A flat green box. | `camera.js` `drawMiniField` | Dots for soldiers. |

**The gap:** every point of the field is worth the same. No spot is worth holding, the AI never reads the ground, and there are no chokepoints and no places to hide. The hill rule is a free +15% for whoever brought archers, wherever they stand.

**Pre-existing nit found while reading:** arrows remember the trees they have passed in a bitmask (`a.tk|=1<<k`, `projectiles.js`). A wide forest field (`many`=3, so 36 trees) wraps past bit 31, so trees 32 and up alias trees 0–3. Fix it when `projectiles.js` is touched in phase 1, for example with a per-arrow `Set` or an array of visited indices.

---

## 2. Terrain features (a small set)

All the tables below are **tunable `const` tables** in a new `js/battle/terrain.js`. The name `GROUND` is taken (`estates.js`), so the new tables are `TERRAIN`, `TERRAIN_GROUND`, `HILL` and `TERRAIN_AI`. Multipliers stack multiplicatively with the existing biome rule and with tiredness, `slow`, Spur and shield wall. Speed has a floor of ×0.3.

**Race exemptions follow `RACES[r].home`, the same rule `envStats` already uses.** Elves (`forest`) ignore the slow-down in woods. Dwarves (`hills`) ignore the climb slow-down. Orcs and swamp beasts (`swamp`) ignore the slow-down in marsh and fords.

### 2.1 Hills: three terraces (level 0, 1, 2)

| `HILL` key | Value | Rule |
|---|---|---|
| `range` | +0.075 per level | A shooter's range comes from **the level he stands on**: level 2 gives +15%, the old hill bonus, now earned by position. |
| `melee` | +0.10 | A blow struck at a foe at least 1 level lower does +10% damage. |
| `charge` | ±0.35 | The charge **bonus** is scaled by `1 + 0.35·clamp(Δlevel, −1, 1)`. A full cavalry charge downhill hits ×2.22, on the flat ×1.9, uphill ×1.59. Brace, depth and wedge apply as now. |
| `climb`, `descend` | ×0.8, ×1.1 | Speed on a **slope cell** when moving with or against its uphill direction (dot product > 0.5). |
| `runUp`, `runDown` | ×0.6, ×1.25 | How fast charge momentum (`u.run`) builds on a slope, uphill or downhill. |
| `climbSta` | ×1.5 | Stamina drain while running uphill. |
| `view` | — | A soldier at least 1 level higher sees over woods (morale view, and spotting in phase 3). |

**Interactions.**
- **Fatigue:** climbing drains stamina faster, so the existing stamina gate on charges (`runFor`) makes uphill charges arrive tired.
- **Morale:** no new morale term. High ground acts through damage, charges and sight, which already feed the group's morale.
- **Formations:** none. A shield wall works on a hill.
- **Abilities:** Spur's momentum is still scaled by the charge rule.

**What the player sees:** shaded terraces with a 2 px contour, and a "High ground +N% range" line in the selected group's details (§6).

### 2.2 Woods: patches of cells

| `TERRAIN_GROUND.wood` | Value | Rule |
|---|---|---|
| `spd` | foot ×0.8, mounted or big ×0.55 | Elves ×1. |
| `run` | ×0.35 | Momentum builds slowly. Cavalry cannot work up a real charge inside a wood. |
| `chargeIn` | ×0.5 | The charge bonus against a target **standing in** a wood is halved, because the trees break it. |
| `stop` | 8% per wood cell entered | The chance a missile that is low (arc `z<10`, or a flat bolt) is stopped. It is per cell, so a shot through 3 cells loses about 22%. Elves and magic pass, as with trees today. |
| cohesion | off | `cohesionReady` is false inside a wood. Shield wall cannot form (`wallReady`). Riders in a wood don't count toward the wedge (`wedgeMembers`). This is what "woods break formations" means here. |
| `view` | 3 cells | A morale-view line crossing 3 or more wood cells (48 px) is blocked, unless the viewer is higher (`HILL.view`). |
| `hide` (phase 3) | 64 px | Covered in §6 and phase 3. |

Today's scattered `B.obs` trees and rocks stay as they are: they still collide and stop arrows. Woods are **ground**: they do not collide.

### 2.3 Rivers, fords and bridges

A river runs top to bottom across the middle band of the field (x between 0.38 and 0.62 BW), meandering ±2 cells. Deep water is 3 cells wide (48 px).

| Kind | Rules |
|---|---|
| **Deep water** (v1: wadeable, decision D1) | **Speed:** ×0.35 for everyone (×0.5 for big units). **Momentum:** reset, and none builds. **Stamina:** drains ×2 while moving. **Shooting:** shooters cannot draw. **Melee:** blows dealt ×0.75, blows taken ×1.25. **Cohesion:** off. It is a place no one wants to be under fire, so it works as a chokepoint without pathfinding. |
| **Ford** (shallow, 4 cells / 64 px wide) | Same as **marsh**, below. |
| **Bridge** (2 cells / 32 px wide) | Open ground. Its width is the chokepoint: a line of 8 files (112 px) must narrow or spill into the water. |
| **Frost** | The river is frozen. The whole length counts as ford (slippery), so there is no chokepoint. One line of flavour. |

### 2.4 Marsh and rough ground

| `TERRAIN_GROUND.marsh` | Value |
|---|---|
| `spd` | foot ×0.7, mounted ×0.5, big ×0.7. Orcs and swamp beasts ×1. |
| `run` | ×0.3 |
| `sta` | ×1.5 drain while moving |
| `hit` | ×0.9 melee damage dealt (bad footing) |

The swamp biome's whole-field slow-down stays. Marsh patches stack on it, down to the ×0.3 floor.

**Out of scope:**
- Hills do not block line of sight or line of fire.
- Units on hills are not drawn raised.
- No fire spreads in woods.
- No roads on the battlefield.

---

## 3. Generation

**Determinism and isolation.**
- **Separate RNG.** `buildTerrain()` uses its own `seeded(terrainSeed)` (or `PX.rng`) and **never `Math.random`**. The unit-spawn random sequence that `tests/battlesetup.js` counts is therefore untouched.
- **Seed:** `hash(tileX, tileY, kindCode)` of the battle's world tile. The same ford always looks the same, and the pre-battle panel can describe it before you choose to fight (decision D4).
- **Build order:** terrain is built in `createState()` **before** `placeObstacles`. Obstacles then reject points on deep water, fords, bridges and wood cells. Rejection consumes `Math.random`, but only when terrain is on.

**Recipe from the world.** The generator reads the tile under the player and its 8 neighbours (`terrAt`). The road-over-water bridge test already exists in `worldart.js`.

| World around the battle | Hills | Woods | River | Marsh |
|---|---|---|---|---|
| Open (grass) | 50%: one low hill (level 1) | 30%: 1 small patch | if a water tile is adjacent | – |
| Forest tile, or 3+ forest neighbours | 0–1 | 3–4 patches covering 20–30%; scattered trees halved | if water is adjacent | – |
| Hill or mountain | 2 hills (one per half, level 2) or one central ridge | 0–1 | if water is adjacent | – |
| Swamp climate | – | 1–2 patches of dead trees | 50%: a ford-only stream | 3–5 patches, 15–25% |
| Desert | 50%: a dune ridge (level 1) | – | only if water is adjacent | – |
| River detail | — | — | **a bridge** if a road-bridge tile lies within 2 tiles, else 1–2 fords | — |

| Battle kind | Terrain |
|---|---|
| `tourney` | none (as obstacles today) |
| `siege`, `raid` | none in v1: walls are their own feature (decision D6) |
| `monster`, `cave` | hills and woods from the recipe, no river |
| `lord`, `party`, `patrol`, `camp`, `field`, `caravan`, `estate` | the full recipe |

**Fairness.** Validation runs after generation. The generator tries up to 8 sub-seeds; if all fail, it drops the offending feature.
1. **Deployment zones:** no deep water, ford or bridge where x < 0.32·BW or x > 0.68·BW. The player's zone is `DEPLOY.zone` (0.3), and the enemy is anchored at BW−105. Woods cover at most 25% of either zone.
2. **Hills:** either one centred hill (|x − BW/2| < 0.08·BW), or a pair mirrored about BW/2 (±32 px jitter). The *advantage score* (high cells + wood cells per half) differs by at most 15% between halves.
3. **River crossings:** at least one; at least 64 px of total crossing width; crossings at least 120 px apart, and at least 40 px from `fieldTop()` and `fieldBot()`.
4. **An open lane** at least 96 px high runs edge to edge, so cavalry always has a road.
5. **Defender advantage:** none by default (decision D5). A battle type may ask for it later.

**Existing fixtures and fingerprints stay valid.**
- **A global switch.** `TERRAIN.on` defaults to true in the game. `tests/harness.js` sets it false, as it already does with `BDEPLOY.on=false;BAUTO.on=false`, so all ~116 suites, including the 9 `battlesetup` fingerprints, `battleperf`'s `fp` and the `B.obs=[]` fixtures, see exactly today's battle.
- **Terrain stays out of `B.env`.** `B.env` is part of the snapshot, so terrain lives in `B.terrain`, which is `null` when off.
- **A null fast path.** With `B.terrain===null`, every helper returns 1 or "open", and `x*1===x` exactly, so arithmetic is bit-identical.
- **Lab:** a new lab config key `ground: 'none' | 'auto' | {hills, woods, river, marsh, seed}`, default `'none'`. Saved presets still validate, and the key is added to `validate`'s output list.
- **New tests opt in** with `TERRAIN.on=true` or a lab `ground`, and record their own fingerprints.

---

## 4. Data model and performance

```js
B.terrain = {
  cs: 16, C, R,                 // power-of-two cells: C = ceil(BW/16) ≤ 82, R = ceil(BH/16) = 38 (~3.1k cells)
  kind: Uint8Array(C*R),        // 0 open, 1 wood, 2 marsh, 3 ford, 4 deep, 5 bridge
  lvl:  Uint8Array(C*R),        // 0..2 terrace
  up:   Int8Array(C*R),         // slope cells: uphill direction 0..7, else -1 (precomputed)
  has:  {hills, wood, marsh, water},     // fast-path flags
  seed, recipe,                 // {hills:[{x,y,r,top}], woods:[...], river:{path, crossings:[{kind,x,y,w}]}}
  ai:   {tops:[{x,y,lvl,half}], crossings:[...], woods:[{x,y,box}]}   // static reading for captains (§5)
};
```

**API (`terrain.js`).**
- `groundAt(x,y)` and `levelAt(x,y)`: O(1) shift-and-index lookups.
- `groundMul(u,mx,my)`, `groundRun(u,mx,my)`, `groundSta(u,mx,my)`.
- `heightEdge(a,b)`.
- `groundHit(att,t)` (high ground, marsh, deep).
- `terrainBlocksView(a,b)`: a DDA walk over cells, run only if `has.wood`.
- `terrainStep()`, once per frame after movement: it caches `u.gk` and `u.glv`. When a shooter's level changes, it rewrites `u.s.range = u.s.range0·(1+HILL.range·lvl)`.

**Why the range rewrite.** `s.range` is read at about 70 sites (actors, commander, HUD envelope, charmind). Rewriting it on a level change keeps all of them correct with no edits. A big unit's `u.s` can be the shared `ST` object (`envStats` returns `s` itself), so copy it first if it is.

**Hook sites.** Each is one multiplier.

| What | Where |
|---|---|
| Speed | `actors.js:149` (troops), `charmind.js:131` (characters), `morale.js:235` (`routStep`), `morale.js:264` (`withdrawStep`), and `actors.js:189` (the manual hero, which is off) |
| Charge build | `actors.js:149` `u.run+=…` |
| Stamina | `fatigueStep` |
| Charge bonus | `morale.js` `chargeMul` |
| Melee damage | `attacks.js:57` |
| Missiles | `projectiles.js` `arcStep` and `flyArrows` (wood cells) |
| Shooting from deep water | `shotStep`'s `can` |
| Morale view | `moraleVisible` |
| Cohesion | `cohesionReady` |
| Shield wall and wedge | `wallReady`, `wedgeMembers` |

**Cost per frame** (budget: **≤ 2%** of frame time at 800 soldiers in `tests/visual/battleperf`):
- 1,600–2,400 typed-array reads for the moving soldiers.
- One cell lookup per low arrow, re-checked only when the arrow enters a new cell (`a.cell`).
- The DDA rays in morale views: at most 14 cells each, and only on wood fields.

**One-off costs at battle start:** generation ≤ 10 ms; ground painting ≤ 50 ms. Painting can run in `warmBattle`. Memory: about 10 KB of grids plus one BW×BH canvas (about 3 MB, freed with `B`).

**Spatial grid.** Terrain is static, so it does not go into `SpatialGrid`, which is re-filed every frame. The two are aligned: terrain cells are 16 px and `SPATIAL.cell` is 32, so each bucket covers exactly 2×2 terrain cells (and the 16-px jostle grid matches 1:1). A later "units in this wood" query can walk buckets without float-edge issues. `spatial.js`'s exactness contract is unaffected, because no query's candidate set or order changes. `terrain.js` loads right after `spatial.js` in both entry points (`Ashmark.html`, `wiki.html`) and in `tests/structure.js`'s order check.

---

## 5. AI: captains read the ground

**Captain context.** `captainCtx` gains one field, `ground`: `B.terrain ? B.terrain.ai : null`, plus helpers `topNear(x,y,r,half)`, `crossesDeep(a,b)` and `crossingFor(a,b)`. When `ground` is null, every rule below is skipped, so AI tests without terrain are unchanged.

| Arm | Rule (tunables in `TERRAIN_AI`) |
|---|---|
| **Defend posture** (`captainInf` defend branch) | Stand the infantry line on the forward crest of the best top within `holdR` (220 px) on our half, if it is at least `hillGain` (1) level above the planned spot. Shooters stand behind it on the same top. |
| **Attack: no charge uphill** (`footCharge`) | Don't start a running charge at a group standing `uphill` (1) or more levels higher. Advance at a walk instead, unless the strength ratio is at least `attackAt×1.3`. |
| **Shooters** (line plan) | After the line `x` is planned, shift up to `shooterHill` (60 px) along the line toward higher ground. Avoid standing in woods (their own shots get stopped); elves are exempt. |
| **Cavalry** (`captainCav`) | **Flank:** try `flankProbe` (3) spots at `flankY` × 1, 1.4 and the other side, and take the first that is open (not wood, marsh or deep). **Targets:** `pick()` scores foes in wood, marsh or water at `woodsCav` (−2). |
| **River** (moves) | If a planned `standAt`, `advance` or attack crosses deep water, go by `crossingFor`: queue the crossing entry, then the exit, then the goal, and narrow `files` to the crossing width ÷ `gx` until across. **Posture:** a defender with a river between the armies uses `defendAt×riverDefend` (1.15) and holds the bank at the crossings. |
| **Temperaments** (new keys, read through `tun()`) | **Dwarf** `holdR` ×1.5, `riverDefend` ×1.2: they seek and keep high ground. **Elf**: likes woods, shooting from wood edges. **Orc** `uphill` ×2: they charge up anything. Human and mixed use the base. |

Your army under Auto uses the same captain, so the player gets the same reading.

---

## 6. Art and UI

**Painting.**
- **Per battle.** A per-battle `B.ground` canvas is painted once: the cached `arenaFor(c)` is copied in, then the terrain is painted over it. `drawBattle` draws `B.ground || B.arena`. Units always draw on top of ground and woods, so readability holds.
- **Through the engine.** Following the art direction, the painter goes in `engine/` as `PX.battleGround({C,R,cs,kind,lvl,up,climate,seed})`. It is previewed in `engine/gallery.html` and the owner approves it before integration.
- **Hills.** Each terrace is lighter and slightly warmer (+6% L, hue toward yellow by about 6°). Slope cells facing south and east are cooler and darker (hue toward blue, −10% L). A 2 px contour sits at each terrace edge in a darker shade of the ground. Lines this thick survive whole-field zoom on an 844×390 phone, where 1 field px is about 0.65 CSS px and a 16-px cell about 10 CSS px.
- **Woods.** The undergrowth is painted as darker ground, in 16-px cells with a ragged edge. Small non-colliding trunk and bush clusters are drawn with the ground. Each climate gets its own tree palette (snow pine, dead swamp trees), reusing the `obstacleSprite` colours.
- **Water.**
  - Deep water uses 2–3 tones with bank pixels, plus the world map's sliding glints, drawn on real time.
  - Fords are lighter, with stepping stones.
  - Bridges are 32 px (2 cells) wide, with planks and rails.
  - Frost rivers are ice.

**Minimap.** `drawMiniField` draws a scaled `B.ground` instead of the flat green box: one `drawImage` into 80×~37 px.

**Details and tooltips.**
- **Selected group:** one chip line, for example "Ground: High ground (+15% range) · Woods (slowed)".
- **Desktop:** hovering empty ground shows the cell's rule in the hint line.
- **Touch:** while deploying, the terrain legend shows on the field: crossing markers, and a "High ground" label at each top. Deployment is when the ground matters most, so touch needs no hover.

**Text.**
- **Log line** at the start: "A river with one ford; a hill on your side."
- **Pre-battle panel** (`encounters.js`, the "Battleground:" line): the same, from the recipe.
- **Wiki:** a "Terrain" subsection under *The field and its effects*, with a table built from `TERRAIN_GROUND` and `HILL`, the same way the unit-abilities table is built, so it stays in parity.

---

## 7. Tests and balance

**New suite `tests/terrain.js`** (it turns `TERRAIN.on` on itself):
- **Determinism:** the same tile gives an identical grid hash, a different tile gives a different one, and the `Math.random` call count is unchanged by generation.
- **Fairness:** the four checks of §3 over 200 random tiles.
- **Rule checks**, one per row of the §2 tables, each in a fixed fixture:
  - distance walked in 1 s on open, wood, marsh and deep ground, and the race exemptions;
  - momentum build up and down a slope;
  - `chargeMul` downhill, flat and uphill;
  - range by level;
  - melee high ground;
  - wood stops on missiles over 400 seeded shots (a band, as `biomes.js` does);
  - morale view through woods;
  - shield wall and wedge off in woods;
  - no shooting from deep water.
- **Off is identical:** a battle with `TERRAIN.on=false` matches the pre-terrain snapshot.

**AI suite** (`tests/aiterrain.js`): defenders take the top; no uphill foot charge; cavalry flank avoids woods; a move across a river routes by the crossing; temperament keys apply.

**Lab measurements** (BattleLab, seeds 1–8, mirror armies, `-Parallel 2` at most), with target bands:

| Measurement | Target band |
|---|---|
| Who holds a central hill wins | 60–70% (not over 80%) |
| Downhill vs uphill cavalry charge, casualty ratio | about 1.5–2× |
| Ford defence: defender wins with equal armies | 65–75% |
| Archers against infantry hiding in woods: archer damage | down 20–35% |
| Battle length on terrain fields | within +25% of flat |

**Perf:** `visual/battleperf` at 800 and 1200 soldiers stays within the 2% budget, and its `fp` is unchanged with terrain off.

---

## 8. Phased plan

Agents are split by files that do not overlap. The **`B.terrain` shape in §4 is the contract**, so the art agent can start at once.

| Phase | Scope | Agents and files | Effort |
|---|---|---|---|
| **1. Core: hills, woods, marsh** | Grid, generation (no rivers yet), all hill, wood and marsh rules, painting, minimap, lab `ground`, wiki | **A (sim):** new `battle/terrain.js`; hooks in `setup.js`, `actors.js`, `charmind.js`, `morale.js`, `fatigue.js`, `formations.js`, `attacks.js`, `projectiles.js` (and the `a.tk` fix); `tests/terrain.js`; `tests/harness.js` (one line); `tests/structure.js`. **B (art):** `engine/` painter and gallery, then `gfx/render.js`, `battle/camera.js`. **C (after A's consts):** `battle/lab.js`, `wiki.html`, `README.md` | M |
| **2. Rivers and AI** | Deep, ford and bridge generation and rules (wadeable); captains read the ground (§5) | **A:** `terrain.js` rivers, plus `actors.js` `shotStep`. **D (AI):** `commander.js` (`TERRAIN_AI`, temperament keys), `tests/aiterrain.js`. **B:** water and bridge art | M |
| **3. Hidden in woods** | Spotting: a unit in a wood is unseen by a team with no living soldier within 64 px (96 from higher ground) and none it struck or shot in the last 3 s. Unseen enemies are not drawn and not on the minimap; free fire skips them; captains' `assess` and `foes` filter them (fair both ways). A hidden group's first charge gives `CHARGE.shock`×1.5 and an "Ambush!" callout | **A:** `terrain.js` spotting (every 0.25 s); `actors.js` `shooterTarget`. **D:** `commander.js` filter. **B:** `render.js`, `camera.js`, `ui/battlehud.js` callout and chips | M |
| **4. Battle types** (shared with item 5) | Impassable deep water with crossing routing for every group; *Hold the bridge* and *Ambush* battle types; optional defender's ground | `terrain.js` routing, `battlecontrol.js` `moveTo`, `encounters.js` types | L |

---

## 9. Owner decisions (with recommendations)

**Decided 2026-10-17: the owner accepted all ten recommendations (D1–D10) and approved building phase 1.**

**Revised after the art review (2026-10-17):** D10 reversed — battlefields with terrain on have **no scattered trees, rocks or other props** (terrain features only; with terrain off, as in tests, the old obstacles stay). **Desert gets no woods** — only a few sparse grass tufts. Hills must **look steeper and higher** (visible cliff faces, strata, shadows). Forest art approved as is.

**Second art review (2026-10-17):** desert has **no water**, only an **oasis** on maps that warrant one; **more variation** (trees on hills, wooded ridges, copses, species mixes); **climbing harder** (stronger slow and stamina cost on a rising slope band, brief cohesion loss; `climbState(u)` for a lean-forward climbing animation); **more painted ground detail** per biome (flowers, grass, pebbles, bushes, branches, mushrooms; frost drifts; sparse desert stones and cracked earth; swamp reeds and moss) — decoration only, never colliding props.

**Art v3 approved by the owner (2026-10-17):** steep cliff-faced terraces, trees on hills and species mixes, desert oasis only, per-biome painted detail, lean-forward climbing / downhill poses for foot soldiers (riders keep their pose).

**Owner requests after phase 2 art (2026-10-17):**
- **Depth-sorted trees (not a flat layer):** trees bigger (32-px cells) and each one a sprite in the same **depth-sorted draw list** as units and obstacles, by the base of its trunk: a unit whose feet are lower on screen than a trunk's base is drawn **in front of** that tree; a unit behind it (feet higher on screen) is drawn **under** its crown. A tree that covers one of your or your allies' soldiers behind it fades to partly transparent so you see your men. The ground under woods (undergrowth, shadows, roots) stays in the painted ground layer; only trunks and crowns are sorted sprites, culled to the camera view (budget ~0.5 ms/frame).
- **Tall terrain uses the same depth rules (owner, 2026-10-17):** plateau **cliff faces** become depth-sorted sprite sections too (a soldier in front of a face is drawn over it; one walking behind a raised rim is covered by the rock), done with the depth-sorted trees. New **mountains / rock spires**: impassable masses drawn with real height (peaks rising up the screen); units behind them are hidden, your and your allies' units make them fade; mountains and tall plateaus **block line of sight** (enemies behind stay unseen until spotted, AI bound by the same rule). Mountains are built with the routing phase (impassable, routed around; fair placement never seals a deployment zone). **Enemies under trees stay covered until spotted** (the full phase-3 concealment: unseen by a team with no soldier near; revealed when one of yours is close or they attack). Order: right after phase 2.
- **Cliffs and one-way hills:** impassable cliff edges, and hills climbable from one side only (a plateau with cliffs all round but one ramp), built **together with grid route-finding and impassable deep water** (phase 4 routing): moves, AI moves and chases become waypoints around cliffs; charges can't cross a cliff, missiles fly over; generation keeps one-way hills fair (mirrored or reachable by both sides). Order: after the canopy/concealment work.

| # | Decision | Recommendation |
|---|---|---|
| D1 | Deep water: **wadeable but punishing** (×0.35 speed, no shooting, weak in melee), or **impassable** (which needs crossing routing for every move and chase)? | **Wadeable in phase 2.** Impassable comes with *Hold the bridge* in phase 4. |
| D2 | Should physical hills **replace** the old whole-field "+15% range on hill battles"? | **Yes**, when terrain is on. Keep the old rule only for `ground:'none'` (lab or terrain off). |
| D3 | Build **concealment in woods** (unseen enemies, ambush shock) at all? | **Yes, as phase 3.** It is the most "Total War" feature, but it is a new idea (battle sight), so it comes after the basics prove fun. |
| D4 | Same place, same field (seeded by world tile), or a new field each battle? | **Same place, same field.** It is learnable, and the pre-battle panel can tell you the ground before you fight. |
| D5 | Should the defender get the better ground? | **No by default** (symmetric). Leave it to battle types. |
| D6 | Terrain in sieges and raids? | **Not in v1.** Walls are their own feature. Monsters and caves get hills and woods only. |
| D7 | Race exemptions from `home` (elves in woods, dwarves uphill, orcs in marsh)? | **Yes.** It matches the world map and the wiki. |
| D8 | Height as **3 terraces** (readable pixel art, simple rules) or smooth? | **3 terraces** (levels 0–2). |
| D9 | High-ground melee bonus (+10%) in addition to range and charge? | **Yes, small.** Tune it in the lab. |
| D10 | Keep today's colliding scattered trees and rocks alongside the new woods? | **Yes.** Forest fields keep half of them. |
