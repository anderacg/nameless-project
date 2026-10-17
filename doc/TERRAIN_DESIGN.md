# Terrain that matters: design proposal

**Status:** phases 1 and 2 built and committed; phase 3 (depth-sorted trees and cliff faces, concealment, ambush) built 2026-10-18, awaiting the owner's art approval and the `commander.js` sight filter (see §8, "Phase 3 as built"); phase 4's simulation (impassable deep water, cliffs, one-way hills, mountains, routing) built 2026-10-18 on top of phase 3, its art in parallel (see §8, "Phase 4 routing as built"); battle types *Hold the bridge* and *Ambush* built 2026-10-18 on top of both (see §8, "Battle types as built"). Written first as a proposal against HEAD 460c917 on `battle-rts-and-world`.
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
| `hide` (phase 3, built) | 64 px | Unseen by a side with no soldier this near (96 px from higher ground) and none struck or shot by him in the last 3 s: `SIGHT` in `terrain.js`. |

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
| **3. Hidden in woods** (built 2026-10-18) | Spotting: a unit in a wood is unseen by a team with no living soldier within 64 px (96 from higher ground) and none it struck or shot in the last 3 s. Unseen enemies are not drawn and not on the minimap; free fire skips them; captains' `assess` and `foes` filter them (fair both ways). A hidden group's first charge gives `CHARGE.shock`×1.5 and an "Ambush!" callout | **A:** `terrain.js` spotting (every 0.25 s); `actors.js` `shooterTarget`. **D:** `commander.js` filter. **B:** `render.js`, `camera.js`, `ui/battlehud.js` callout and chips | M |
| **4. Routing** (simulation built 2026-10-18) | Impassable deep water with crossing routing for every group; cliffs (sheer and one-way hills, ramps); mountains and rock spires; every step guarded; AI by route length (see "Phase 4 routing as built") | **A:** `terrain.js` generation, grids and steering; hooks in `battle.js`, `battlecontrol.js`, `actors.js`, `morale.js`, `charmind.js`, `commander.js`, `lab.js`; `route.js` (`routeFlood`, `routeDist`); `tests/routing.js`. **B:** mountains, spires and cliff edges in `engine/` and `render.js` | L |
| **5. Battle types** (shared with item 5; built 2026-10-18) | *Hold the bridge* and *Ambush* battle types; the defender's ground is the bridge itself | `setup.js` `BTYPE`, `encounters.js` triggers and panel, `terrain.js` fields, `commander.js` AI, `lab.js` `type`, `events.js` road event; `tests/battletypes.js`, `tests/visual/btypebalance.js` | M |

---

### Phase 3 as built (2026-10-18)

- **Standing trees.** `PX.battleGround` no longer paints trees into the ground. Trees are 32-px sprites (`PX.battleTree`: oak, birch, fir, snowy pine, bare birch, dead, willow, palm), returned in `ground.props`. Their shadows, roots, undergrowth and bushes stay painted.
- **Cliff faces.** The plateaus' south cliff faces are also returned in `ground.props`, cut into column-run sections up to 16 px wide whose foot rows lie within 2 px. Each section is its own small canvas: drawing many sections from one shared atlas was much slower in Chrome.
- **Depth order.** `render.js` `battleEnts` sorts the props in view in with the soldiers by their feet, so a soldier behind a trunk's foot or a face's foot is drawn under it. `propsInView` fades a prop to 0.4 (`PROPFADE`) while it covers one of your or your allies' men. Enemies get no fade.
- **Sight.** `terrain.js` `sightStep` runs every 0.25 s of battle time (`SIGHT`); at a battle's start (`setup.js`); and on the real clock while you deploy.
  - A soldier in a wood is unseen by a side with no soldier within 64 px of him (96 px from higher ground), unless he struck or shot at that side in the last 3 s.
  - A soldier anywhere is also unseen when every soldier of that side has raised ground between them: a cell at least one level higher than both (`riseBlocked`). A `TERRAIN_GROUND` kind with `blocks: true` hides whatever lies behind it at any height, so phase 4's mountains only need that flag.
  - `terrainBlocksView`, the morale view, honours rises too.
- **The API.** `seenBy(team,u)`, `visibleFoes(team)`, `lastSeen(team,u)` and `sightGoal(g,team)`. A blow, a shot loosed or a missile landing reveals the attacker at once (`sightStruck`).
- **Fair both ways (player side).** Unseen enemies are not drawn and are not on the minimap. They have no icon (`moraleicons.js`) and cannot be clicked (`commands.js` `rtsUnitAt`). Free fire skips them (`shooterTarget`, and the fallback `nearestSeen`, `meleeTarget` and `roomyFoe`).
- **An order at a target gone from sight** goes to where it was last seen: the soldiers march to their slots round that point and shoot nothing (`actors.js` `lostStep`). Once they are there with the target still unseen, the order lapses and the group holds. Anyone who comes near enough is seen again, and the order goes on as before. The order line points at the last known place.
- **Ambush.** A group wholly unseen by its foes within 3 s before its charge lands multiplies its charges' shock by 1.5 for 1.5 s (`AMBUSH`), once a battle, with an "Ambush!" callout.
- **Still to do.** The enemy captain is not yet bound by sight: `commander.js` must filter its `assess`, `foes` and target picks through `seenBy`/`visibleFoes`. `charmind.js` (characters' own targeting) is unfiltered too.

### Phase 4 routing as built (2026-10-18, simulation)

**The contract with the art** (written at the top of `terrain.js`):
- **Kind.** `TKIND.rock` = 6 is a mountain's or a rock spire's cell. `TERRAIN_GROUND.rock` has `solid: true` (no one steps in) and `blocks: true` (it hides what lies behind it at any height).
- **Walls.** `B.terrain.wall` is a `Uint8Array(C*R)`, or absent when the field has no cliff. It uses `route.js`'s bits: E 1, S 2, W 4, N 8. A set bit forbids stepping from that cell over that edge. A bit set on one side only is one-way: a one-way hill has its bits on the low cells, pointing up. A ramp is a stretch of rim with no bits. `B.terrain.recipe.hills[i]` carries `cliff`, `oneway` and `ramps` (angles in radians, screen y down: 0 east, π/2 south).
- **Heights.** `B.terrain.lvl` still gives the terrace levels (a rock cell keeps the level under it, 0 as generated). `B.terrain.rockH` is a `Uint8Array(C*R)`, or absent with no rock: a rock cell's height in **levels** above the ground, each `PX.ROCK_PX` (14 px) of screen height as the art draws it (1 at least on rock; mountains peak at 4–7, spires 2–3, `TERRAIN_ROCK.mh`/`sh`; 0 elsewhere). The art reads `wall` and `rockH` straight off `B.terrain`; `wall` is absent on a field with no cliffed hill, whose terrace edges are then painted as before. `B.terrain.recipe.rocks` lists them as `{x, y, r, h}`.

**Generation.**
- `featurePlan` adds cliffs and rock to a recipe's plan from a stream of its own, so the rest of the field is as before.
  - Each recipe has `cliff: [sheer, one-way]` chances: open .12/.08, forest .08/.05, hills .3/.2; deserts (dunes) and swamps none. Frost multiplies them by 1.3.
  - Each recipe has `rock: [mountains, spires]` chances: open .06/.1, forest .04/.04, hills .5/.15, desert 0/.55 (spires only). Frost multiplies them by 1.6.
- **Sheer hills** have one ramp or two (`ramps2` .5); their walls are set on both sides. **One-way hills** have one ramp; their walls are set on the low side only, so men can drop down anywhere but climb only by the ramp.
- **Fair ramps.** A lone hill's ramps face up or down the field, or one to each side. A pair's ramps are mirrored about the middle.
- **Rock.** A mountain stands in the middle, or a mirrored pair; spires come in mirrored pairs. Rock keeps off the deployment zones, the open lane, the hills and the river.
- **Fairness** (`terrainFair`, now with `reach`): no rock in a zone or the lane. On the foot grid, each zone's middle reaches the other's, every passable cell of its own zone, and every hilltop, both ways round. When no sub-seed is fair, rock is dropped first, then cliffs, then the old order.
- **The lab.** Hills take `cliff`, `oneway` and `ramps` (degrees); `rocks: [{x, y, r, h}]`; recipe `'crags'` (the hills recipe, always with cliffs and mountains). A frost lab field counts as frost.
- **Text.** "Deep water cannot be crossed: only at the fords and bridges." "Sheer cliffs ring a hill: it is climbed only by its ramps." "A hill is climbed by one ramp only, though men can drop down its cliffs." "Rock bars the way and hides what lies behind it." Mountains and spires are named in the field's sentence.

**Movement.**
- **Grids.** `B.terrain.route = {foot, mounted, big}`, built with the field (`terrainRoutes`). Deep water is impassable unless `TERRAIN.wade` (false; true brings phase 2's wading back). Cell rows wholly off the field are closed. `T.blocky` is set when anything blocks a step. Without it, none of this runs and a battle is exactly phase 3's.
- **The guard.** `terrainHold`, once a frame after all movement, knocks, jostling and the field clamp (`battle.js`). It refuses any soldier's step into a solid cell or over a cliff edge its blocked way, sliding him along x or y instead. One standing in a solid cell steps out freely.
- **Group moves.** `BattleControl.step` lays `g.way` (`groupWay`) for a holding or advancing group. It runs from its men's middle to its place, on its slowest kind's grid, with legs keeping min(half its front, 24 px) clear. It is laid again on a new place cell, a new grid version, or a cut way's end. Each soldier (`slotWay`):
  - goes straight to his place when the line is clear;
  - else walks the group's way from his own index on it, skipping ahead while the next point is in a clear line;
  - pushed off it, he takes his own way to that point.
  - A place in rock or across a cliff from the group's goal is pulled in toward the goal.
  - On a narrow crossing the men stream through the waypoints as a column and re-form at the goal.
- **Chases, charges, routs, withdrawals, fall-backs and lost targets** steer with `steerTo`/`steerDir`. They go straight while `lineClear` holds (r 3 px, reckoned again on a cell change or every 0.5 s). Otherwise they follow their own `routePath`, taken again every 0.5 s (staggered), on a grid version change, or when the goal changes cell (after 0.25 s). A charge builds no momentum while its way is routed, so momentum comes only on the clear last leg.
- **The AI.** `wayLen` (a `routeDist` field, cached) measures the infantry's and shooters' way to tops, woods and river banks in `captainCtx`. A top whose ramp is on the far side is far; one out of reach is never chosen. Flank spots and hunt spots must be reachable (`canReach`). Shooters' perches must be walkable within twice their reach (`nearLen`, a bounded search). Rock counts as no perch. The captains' own crossing logic (`wayVia`, files narrowed) is kept: it works with the routing.
- **The art and the HUD may read** `B.groups[id].way.p` (the group's waypoints, `[[x, y], …]`) to draw an order's path.

- **Finding nothing to fight.** When a captain can see none of its foes (they are hidden by rock, a crest or woods) and no blow has been struck for `FOE_CMD.lull` (10 s), `captainSearch` sends every group of its army looking.
  - It goes to where the foe was last seen.
  - If the group is already there, or never saw the foe, it goes toward the foe's side of the field instead.
  - This was a gap in phase 3's sight that rock made common: in a cliff battle, neither side saw the other and both stood for good.

**Tests.** `tests/routing.js` (38 checks) covers:
- the art's contract;
- 300 generated fields: the zones reach each other and their own ground, every top is reached from both sides, no rock in a zone or the lane, variety by biome, more rock in frost;
- determinism, with no `Math.random`;
- the lab key;
- one-way hills: climbed only by the ramp, dropped down anywhere;
- the sheer hill's ramp, both ways;
- riders round a mountain;
- four kinds of group over a bridge and a ford;
- a charge over a river;
- two columns crossing one bridge each way at once;
- two AI battles on a single-bridge field;
- a charge round a cliff (no momentum without a clear line);
- the AI taking a top by its ramp, and leaving one whose ramp is far;
- a crags-and-river AI battle, run twice for the same result;
- the search;
- `routeFlood`/`routeDist`.

Every soldier's every step is judged each frame in its battles. `tests/terrain.js` keeps phase 2's wading checks under `TERRAIN.wade`, and adds the impassable line over a bridge. `tests/aiterrain.js` lays its hand-made river's grids again, and blind captains now cross by the ford too.

**Performance** (`tests/visual/terrainperf.js`, ms per frame; fcb67d6 → phase 4):

| Field | 400 soldiers | 800 soldiers |
|---|---|---|
| None | 1.91 → 1.97 | 4.67 → 4.73 |
| Hills and woods (nothing blocks) | 2.02 → 1.96 | 5.26 → 5.30 |
| Cliffs, mountains and a river | 2.07 → 2.42 | 5.46 → 6.60 |

- The fingerprints of the first two rows are unchanged.
- On the blocking field, part of the cost is the routing itself, which a profile puts at about 0.5–0.8 ms at 800 soldiers: the guard, about 0.05 ms; slots and steering; the captains' route measures. The rest is a different battle: armies bunch at crossings instead of wading.

**Lab balance** (`tests/visual/terrainbalance.js`; AI on AI, mirror armies of 20 foot, 12 bows and 6 riders a side, seeds 1–10):

| Field | Left / right wins | Length, mean / median |
|---|---|---|
| Flat | 5 / 5 | 64 / 66 s |
| Cliffs (crags) | 3 / 7 | 65 / 68 s |
| Mountains | 6 / 4 | 64 / 63 s |
| River (bridge and ford) | 4 / 6 | 72 / 74 s |
| One bridge | 4 / 6 | 68 / 74 s |

No battle was unfinished at 300 s. Every length is within +13% of flat.

### Battle types as built (2026-10-18)

Two battle types are built on the phase 3+4 snapshot: `BTYPE` in `setup.js`, and `B.btype`, which is absent on an open field. They come only with terrain. With `TERRAIN.on` false nothing changes: every older suite stays byte-identical.

**Hold the bridge** (`{kind:'bridge', def, ford}`).
- **When:** a fight with a lord, band, patrol or caravan on a road bridge or next to it (a road tile with water on both sides, within 1 tile: `bridgeNear`). Not in the frost, where the river is ice, and not in the desert, which has no river.
- **Who holds it:** the side set upon. That is you, unless you rode at them (`e.mine`).
- **The field:** the recipe's river, held (`rv.hold`). One bridge lies in the open lane near the middle (±15% of the field's height). At 40% of such places (`hash` of the tile) a ford lies at the field's far end from it as well, if there are at least 100 px of ground between them. On a short field there is none.
  - Deep water is impassable, as phase 4 made it.
  - `terrainFair` asks only for the bridge's 32 px of crossing.
  - The river is never the feature dropped when no sub-seed is fair.
- **Who stands where** (`arrangeType`): the holders' foot stands on its bank at the bridge, `BTYPE.front` (24 px) off the water's edge where each group stands. Their shooters are 50 px behind, their characters further back, and their riders back on the flanks (±110 px). The takers start at their own edge as ever. Your deployment zone, when you hold, runs to your bank (`B.dzone`, `deploy.js`).
- **AI holding** (`typeHolds`, `commander.js`):
  - It defends while the river lies between the armies, judged by the takers' fighters' middle against the river's (`acrossRiver`). The straight way may run over the bridge itself, so `wadesDeep` cannot tell.
  - No lull, idle shooters or search sends it over until `BTYPE.wait` (60 s) passes with no blow struck.
  - It holds TERRAIN_AI's river bank, the bridge first. The holding check skips `safe` (the holders start there).
  - Its foot stands at the bank and never follows anyone over the water. While none of their fighters is within `alert` (260 px), it stands `back` (30 px) further from the water, out of the worst of their arrows.
  - Its riders wait behind and ride only at those who come over. Its characters stay behind the foot.
- **AI taking** (`typeTake`, `BTYPE.take`). The army goes over as one, by the crossing least held: the holders' strength within 150 px of each far mouth, then the way. It goes through four phases:
  1. **wait:** the foot and riders hold where they started while the shooters shoot (2 × `FOE_CMD.volley`, 30 s at most).
  2. **stage:** they gather 60 px back from the near mouth (15 s at most).
  3. **cross:** the foot goes over to a place 50 px beyond the far mouth. The routing streams it over as a column and re-forms it there. The riders wait.
  4. **go:** once every group of foot is ¾ over and formed (or 20 s pass), the captain's usual orders resume.
  - Before this, the takers' foot walked into the arrows alone and broke at the bridge (holders won 95% of battles). With staging but no waiting it stood under fire at the mouth.
- **Telling the player:** the panel says **Hold the bridge** or **Take the bridge**, and its ground line says "a river with a single bridge (and a ford far off it)". The battle opens with a banner and a log line (`typeSay`).

**Ambush** (`{kind:'ambush', hid}`; `hid` is the side lying in wait).
- **When** (`battleTypeFor`, `BTYPE_WORLD`): a band or a hostile lord's army comes at you where there is cover (`coverAt`). The chance is set by the cover: a forest tile (or 3 forest tiles round it) .35, hills or peaks .3, woods or rock on the field .15. It is multiplied by the band: bandits ×1, raiders and bog raiders ×1.2, lord ×0.5.
  - Patrols, caravans and fights you start never ambush you.
  - A bridge comes first.
  - The draw is from the tile and the day (`hash`), never `Math.random`.
  - It is sprung once: if you are run down after it, you meet them again on an open field (`e.btype` false).
- **The field** (`ambushLayout` in `setup.js`, before the ground is built; `ambushPlan` in `terrain.js`):
  - **The column:** a road down the middle, kept clear of cover edge to edge. The caught side stands on it in march order, `BTYPE.files` (4) wide, facing on: riders as the van, then foot, characters and shooters.
  - **The ambushers:** on one flank or both (50%). Each group faces the road with its front 84 px (`gap`) off the column's edge, beyond `SIGHT.near`.
  - **Their cover:** each group stands in a wood of its own sized round it (r ≥ 56). In deserts, and on half of hill fields (`ambushRidge`, by the seed), they stand behind a low ridge the length of their flank instead, which hides them by `riseBlocked`.
  - Its own stream, from the ground's seed.
- **Rules:**
  - No deployment for either side (`opts.deploy` false).
  - No fleeing when you are caught: "They have you in their trap".
  - The ambushers' first charge out of hiding gets `AMBUSH`'s shock and the "Ambush!" callout, as phase 3 built them.
  - The AI lying in wait goes straight in for `BTYPE.rush` (6 s): its foot charges and its riders ride at once. A column of the AI's marches on west along the road until it sees whoever lies in wait.
- **Spring an ambush:** riding at a band, lord, patrol or caravan where there is cover, the panel offers it beside Fight (`bt-spring`). Your band starts hidden beside the road and theirs in march order on it.
- **The ambush road event** (only with terrain and cover; `TERRAIN_EVENTS` in `events.js`, kept apart from `EVENTS` so a game without terrain draws from the very same list): fight (the ambush above), or cut the baggage loose and run (−4 food, −15 gold, −4 morale).
- **Telling the player:** the panel says **Ambush!** and its ground line says "The road runs between woods / dune ridges / low ridges". The battle opens with "Ambushed!" (or "Lie in wait").
- **Window frame:** the pre-battle panel and the event's choice page stay forced choices with no bar. Esc pauses there. The event's outcome ends with the `nav` bar, "Continue".

**Lab:** `type: 'field' | 'bridge' | 'ambush' | {kind, side, ford}`. `side` is the side set upon, `'left'` by default. A typed battle with `ground:'none'` gets `'auto'`, and an ambush's ground is always its own.

**Balance** (`tests/visual/btypebalance.js`: AI on AI, mirror armies of 20 foot, 12 bows and 6 riders, 500 px apart, ground `'auto'`, open recipe):

| Set | Seeds 1–10 | Length, mean / median |
|---|---|---|
| Bridge, left holds | holders 7 / takers 3 | 42 / 43 s |
| Bridge, right holds | holders 9 / takers 1 | 37 / 36 s |
| **Bridge, both** | **holders 16 / 20 (80%)** | 39 / 39 s |
| Ambush, left caught | ambushed 2 / ambushers 8 | 28 / 21 s |
| Ambush, right caught | ambushed 5 / ambushers 5 | 23 / 26 s |

- Over seeds 1–20 the bridge's holders won 30 of 40 battles (75%), with means of 44 and 39 s.
- How hard the bridge is to take turns mostly on `BTYPE.back`. Over 40 battles: 0 px gave the holders 58%, 20 px 63%, 30 px 75%, 40 px 80%, and 60 px 90%.
- No battle went unfinished. They are shorter than the flat field's 64 s, because one side breaks at the crossing.
- The headless lab's field is short (about 290 px between the HUD bars), so none of these fields had a ford.

**Tests:** `tests/battletypes.js` (49 checks):
- the triggers, with their chances measured over 600 days;
- no `Math.random` drawn;
- who stands where, in the world and the lab;
- the single-bridge field and its impassable water;
- a held bridge fought to its end with nobody ever in deep water;
- the AI holding and taking it;
- an ambush in the lab, in a desert, in the world, from the road event, and sprung by you;
- the panels' frame;
- the lab key;
- terrain off.

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

---

## 10. Phase 4 routing core (built 2026-10-17: `battle/route.js`, `tests/route.js`)

`route.js` is a standalone library. Since 2026-10-18 game code calls it (wired as below; see "Deviations as built" at the end of this section). Two helpers were added then: `routeFlood(g, s)` (every cell reachable from cell s) and `routeDist(g, x, y)` (a Dijkstra cost field from a point, kept per start cell, `ROUTE.dist` of them).

### Grid
`g = {C, R, cs, cost, wall, v}`.

- **`cost`** (`Uint8Array`): 0 means impassable; 16 is open ground.
- **`wall`**: 4 edge bits per cell (E 1, S 2, W 4, N 8). A set bit forbids stepping out of that cell over that edge, so a bit set on one side only makes the cliff **one-way**.
- **`v`**: the grid's version. Edits made through `routeCell` and `routeWall` bump it.

### API
- **Building a grid:**
  - `routeGrid(C, R, cs)` makes an open grid.
  - `routeGridOf(T, {deep, who})` builds one from `B.terrain`:
    - the cost comes from `TGROUND` speeds for `who` (foot, mounted or big);
    - deep water is wadeable at cost 46, or impassable with `deep:true`;
    - a `TERRAIN_GROUND` entry with `solid:true` is impassable;
    - `T.wall` holds the cliffs.
- **`routePath(g, ax, ay, bx, by, {budget, r, cache})`**:
  - A* over 8 directions with an octile heuristic and no corner cutting, then string-pulled.
  - Returns the waypoints after the start, with `.ok`, `.cut` and `.n`.
  - An unreachable or blocked goal gives the nearest reachable point.
  - The work is bounded by `ROUTE.budget`.
  - Results are cached by start cell × goal cell, invalidated when `v` changes.
- **`reachable(g, …)`**
- **`lineClear(g, ax, ay, bx, by, cap, r)`**: no blocked cell, blocked edge or cut corner on the segment.

### Performance
On the largest field (82×38 cells):

| Case | Time |
|---|---|
| Typical path | about 0.1 ms mean, 0.3 ms p95 |
| Cache hit or short move | about 0.007 ms |
| Worst case (bounded by the budget) | about 1 ms |
| `lineClear` | about 0.5 µs |

### Wiring it in (phase 4: built 2026-10-18)
- **Grids:**
  - Build `B.terrain.route = {foot, mounted, big}` once per battle, after generation, with `routeGridOf(T, {deep:true, who})`.
  - The ground is static. Bump `v` only if the terrain changes (e.g. a burnt bridge).
- **Generation:**
  - **Mountains and spires:** `TKIND.rock` (6), with a `TERRAIN_GROUND` entry that has `solid:true`.
  - **Cliffs:** `T.wall`, filled in `rasterTerrain` on the cardinal edges between a terrace cell and a lower neighbour.
    - A two-way cliff sets the bit on both sides.
    - A one-way hill sets it only on the low cell, pointing up: down is allowed, up is refused.
    - The open rim (the slope band) is the ramp.
  - **Fairness:** `terrainFair` adds `reachable` checks:
    - each deployment zone reaches the other, both ways;
    - mountains never seal a zone;
    - every hilltop is reachable from both zones, or the hills come as a mirrored pair with their ramps facing the middle.
- **Group moves** (`battlecontrol.js` `moveTo`):
  - Call `routePath(grid, centre, goal, {r: min(half frontage, 24)})` and keep `g.way`, `g.wi` and `g.wayV`.
  - Lay the slots at the next waypoint, facing along the leg; the last waypoint uses the ordered facing.
  - Slots that land in blocked cells snap to `routeNear`, or the group narrows to a column (as `crossWay` does on bridges).
- **Soldier steps** (`actors.js`): refuse any step into a cost-0 cell or across a set wall bit, and slide along the other axis instead. This covers knockback and routs too.
- **Chases:**
  - When `lineClear(grid, u, t)` holds, go straight, as today.
  - Otherwise take `routePath`'s next waypoint. Nearby soldiers share the start-cell × goal-cell cache.
  - Re-path at most every 0.5 s per soldier (staggered), or when the target changes cell.
  - With deep water impassable this replaces `crossWay`/`crossingFor`, which stay for wadeable mode.
- **Charges:**
  - A charge needs `lineClear(grid, u.x, u.y, t.x, t.y, 255, 4)`. Otherwise it becomes a routed move, and momentum builds only once the rest of the leg is clear, so no charge crosses a cliff.
  - Missiles ignore `wall` and fly over.
  - Line of sight past mountains and tall plateaus belongs in `terrainBlocksView`, not in `lineClear`.
- **AI:** captains already move through `moveTo`. When choosing tops and positions they should use `reachable` and the route's length instead of straight-line distance, so a hill whose ramp is on the far side counts as far.
- **When to re-path:**
  1. a new order;
  2. `grid.v` changes;
  3. a 0.5-s check finds no `lineClear` to the next waypoint (the group was shoved off its leg);
  4. a cut path reaches its last waypoint;
  5. a chase target changes cell.

### Deviations as built (2026-10-18)
- **Group moves keep `g.ax, g.ay` as the order.**
  - The way is `g.way = {p, id, gc, v, who, ok, cut, end}`; there is no `g.wi` or `g.wayV`.
  - Each soldier keeps his own index on the way (`u.gw`) instead of the group laying its slots at each waypoint.
  - He makes for his own slot as soon as the straight line to it is clear, so a group streams through a narrow crossing as a column and re-forms at the goal.
  - A slot in a blocked cell, or across a cliff from the goal, is pulled in toward the goal rather than snapped by `routeNear`, which could pick the far bank.
  - Why: the captains, the HUD, `standAt` and the tests all read `ax, ay` as the order. Re-laying the formation per leg would churn `layForm` and the slot swaps mid-march.
- **Soldier steps are guarded in one place.** `terrainHold` runs once a frame after all movement, rather than in each step function. One pass covers troops, characters, knockback, routs, withdrawals, jostling, leaps, pounces and the field clamp. The movers steer (`steerTo`) so that they rarely meet the guard.
- **Clear lines.** A soldier's `lineClear` uses r 3 px (`ROUTE_UNIT.r`), not 4. It is reckoned again only when he or his goal changes cell, or every 0.5 s.
- **Re-path triggers.**
  - A chase re-paths when the target changes cell no sooner than 0.25 s after the last path.
  - A soldier pushed off his group's way takes his own path to its next point (trigger 3), at most every 0.5 s.
- **Off-field rows are closed** on the grids. A way along rows the field clamp forbids would stall.
- **The captains** measure by `routeDist` (`wayLen`) and a bounded search (`nearLen`), not by `routePath` lengths per query.
  - Their own crossing logic (`wayVia`: to the crossing's near end, files narrowed) stays, and works with the routing.
  - `crossWay` stays for wadeable water only (`TERRAIN.wade`, nothing else blocking).
  - `crossingFor` is retired: no game code called it once routing came.
- **Fairness is stricter than proposed.** Every hilltop must be reachable from both zones, even for a mirrored pair. A pair's ramps are mirrored at any angle, not only facing the middle.
