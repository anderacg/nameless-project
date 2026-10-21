# Terrain that matters: design proposal

**Status (checked 2026-10-19):** phases 1 and 2 built and committed (0b6cde6, d208962; the AI reads the ground, 9038878); phase 3 (depth-sorted trees and cliff faces, concealment, ambush) built 2026-10-18 (e527d86), **awaiting the owner's art approval** (not recorded; IMPLEMENTATION_PLAN Priority 3); the AI sight filter is **built** (e527d86, 3f24f1d: `commander.js` and `charmind.js` see only what their side sees; see §8, "Fog of war as built"); phase 4's simulation (impassable deep water, cliffs, one-way hills, mountains, routing) built 2026-10-18 on top of phase 3, its art (mountains, spires, cliff edges) built with it (e527d86; natural ramps 3f24f1d, smooth rises 5e9453d), its approval with phase 3's (see §8, "Phase 4 routing as built"); battle types *Hold the bridge* and *Ambush* built 2026-10-18 on top of both (see §8, "Battle types as built"). Field variety (battlefields that reflect the world map: real forests, a recipe per tile kind, edges from the neighbours, roads, any field size) and fog of war built 2026-10-18 (3f24f1d; see §8, "Field variety as built", "Fog of war as built"). **Still to come, from the world:** river width, the world's bridges and D41's steep hills (WORLD_DESIGN Phase 2 wave 2, agent E), world cliffs and desert mesas (Phase 7). **Open in battle:** woods see-through over every soldier you see (IMPLEMENTATION_PLAN §3.5). Written first as a proposal against HEAD 460c917 on `battle-rts-and-world`.
**Art approved by the owner 2026-10-20** ("I like the current version"): phases 3 and 4 stay as they are in the code; no changes now.

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
| `climb`, `descend` | ×0.8, ×1.1 (as built: foot ×0.5, riders and big ×0.4; ×1.15) | Speed on a **slope cell** (as built: 1 cell in from a terrace's rim) when moving with or against its uphill direction (dot product > 0.5). |
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
| **1. Core: hills, woods, marsh** (built 2026-10-17, 0b6cde6) | Grid, generation (no rivers yet), all hill, wood and marsh rules, painting, minimap, lab `ground`, wiki | **A (sim):** new `battle/terrain.js`; hooks in `setup.js`, `actors.js`, `charmind.js`, `morale.js`, `fatigue.js`, `formations.js`, `attacks.js`, `projectiles.js` (and the `a.tk` fix); `tests/terrain.js`; `tests/harness.js` (one line); `tests/structure.js`. **B (art):** `engine/` painter and gallery, then `gfx/render.js`, `battle/camera.js`. **C (after A's consts):** `battle/lab.js`, `wiki.html`, `README.md` | M |
| **2. Rivers and AI** (built 2026-10-17/18, d208962, 9038878) | Deep, ford and bridge generation and rules (wadeable); captains read the ground (§5) | **A:** `terrain.js` rivers, plus `actors.js` `shotStep`. **D (AI):** `commander.js` (`TERRAIN_AI`, temperament keys), `tests/aiterrain.js`. **B:** water and bridge art | M |
| **3. Hidden in woods** (built 2026-10-18, e527d86; art approval open) | Spotting: a unit in a wood is unseen by a team with no living soldier within 64 px (96 from higher ground) and none it struck or shot in the last 3 s. Unseen enemies are not drawn and not on the minimap; free fire skips them; captains' `assess` and `foes` filter them (fair both ways). A hidden group's first charge gives `CHARGE.shock`×1.5 and an "Ambush!" callout | **A:** `terrain.js` spotting (every 0.25 s); `actors.js` `shooterTarget`. **D:** `commander.js` filter. **B:** `render.js`, `camera.js`, `ui/battlehud.js` callout and chips | M |
| **4. Routing** (simulation and art built 2026-10-18, e527d86; art approval open) | Impassable deep water with crossing routing for every group; cliffs (sheer and one-way hills, ramps); mountains and rock spires; every step guarded; AI by route length (see "Phase 4 routing as built") | **A:** `terrain.js` generation, grids and steering; hooks in `battle.js`, `battlecontrol.js`, `actors.js`, `morale.js`, `charmind.js`, `commander.js`, `lab.js`; `route.js` (`routeFlood`, `routeDist`); `tests/routing.js`. **B:** mountains, spires and cliff edges in `engine/` and `render.js` | L |
| **5. Battle types** (shared with item 5; built 2026-10-18, e527d86) | *Hold the bridge* and *Ambush* battle types; the defender's ground is the bridge itself | `setup.js` `BTYPE`, `encounters.js` triggers and panel, `terrain.js` fields, `commander.js` AI, `lab.js` `type`, `events.js` road event; `tests/battletypes.js`, `tests/visual/btypebalance.js` | M |

---

### Phase 3 as built (2026-10-18)

- **Standing trees.** `PX.battleGround` no longer paints trees into the ground. Trees are 32-px sprites (`PX.battleTree`: oak, birch, fir, snowy pine, bare birch, dead, willow, palm), returned in `ground.props`. Their shadows, roots, undergrowth and bushes stay painted.
- **Cliff faces.** The plateaus' south cliff faces are also returned in `ground.props`, cut into column-run sections up to 16 px wide whose foot rows lie within 2 px. Each section is its own small canvas: drawing many sections from one shared atlas was much slower in Chrome.
- **Depth order.** `render.js` `battleEnts` sorts the props in view in with the soldiers by their feet, so a soldier behind a trunk's foot or a face's foot is drawn under it. `propsInView` fades a prop to 0.4 (`PROPFADE`) while it covers one of your or your allies' men. Enemies get no fade. (Agreed 2026-10-19, open: fade over every soldier you can see, to the world map's level, `WDEPTH.fade` 0.3; IMPLEMENTATION_PLAN §3.5.)
- **Sight.** `terrain.js` `sightStep` runs every 0.25 s of battle time (`SIGHT`); at a battle's start (`setup.js`); and on the real clock while you deploy.
  - A soldier in a wood is unseen by a side with no soldier within 64 px of him (96 px from higher ground), unless he struck or shot at that side in the last 3 s.
  - A soldier anywhere is also unseen when every soldier of that side has raised ground between them: a cell at least one level higher than both (`riseBlocked`). A `TERRAIN_GROUND` kind with `blocks: true` hides whatever lies behind it at any height, so phase 4's mountains only need that flag.
  - `terrainBlocksView`, the morale view, honours rises too.
- **The API.** `seenBy(team,u)`, `visibleFoes(team)`, `lastSeen(team,u)` and `sightGoal(g,team)`. A blow, a shot loosed or a missile landing reveals the attacker at once (`sightStruck`).
- **Fair both ways (player side).** Unseen enemies are not drawn and are not on the minimap. They have no icon (`moraleicons.js`) and cannot be clicked (`commands.js` `rtsUnitAt`). Free fire skips them (`shooterTarget`, and the fallback `nearestSeen`, `meleeTarget` and `roomyFoe`).
- **An order at a target gone from sight** goes to where it was last seen: the soldiers march to their slots round that point and shoot nothing (`actors.js` `lostStep`). Once they are there with the target still unseen, the order lapses and the group holds. Anyone who comes near enough is seen again, and the order goes on as before. The order line points at the last known place.
- **Ambush.** A group wholly unseen by its foes within 3 s before its charge lands multiplies its charges' shock by 1.5 for 1.5 s (`AMBUSH`), once a battle, with an "Ambush!" callout.
- ~~**Still to do.** The enemy captain is not yet bound by sight: `commander.js` must filter its `assess`, `foes` and target picks through `seenBy`/`visibleFoes`. `charmind.js` (characters' own targeting) is unfiltered too.~~ **Done 2026-10-18** (e527d86, 3f24f1d): `commander.js` `assess` and the lord pick, `charmind.js` `liveFoes` and duels, `beastmind.js` and `commandpowers.js` all read `seenBy`; see "Fog of war as built".

### Fog of war as built (2026-10-18)

- **The rule** (`battle/battlefog.js` `FOG`, through `terrain.js` `sightStep`): with `B.fog`, a side sees an enemy soldier only when one of its living, non-routing soldiers is within his sight range with a clear line. Foot 220 px, shooters 260, riders 300, characters 280; big units seen ×1.5 farther; +25% per level the viewer stands above the cell he looks at. Rises and rock block as `riseBlocked`; woods keep the 64/96 px rule; `sightStruck` reveals for 3 s. The API is unchanged (`seenBy`, `visibleFoes`, `lastSeen`, `sightGoal`), and the sight state moved to `B.sight` (`B.terrain.sight` is the same object), so it also runs with no terrain.
- **Where:** field battles on any ground (rivers, bridge and ambush types included), terrain on or off; never tournaments, sieges or raids (`BattleSetup.fogOn`). `FOG.on` is the Settings toggle (`PREFS.bfog`); the lab has a `fog` key.
- **Grid:** per side, 16-px cells `vis` (seen) and `rng` (in range). A viewer cell's disc is filled directly unless its box holds a cell a level above it (`hiSum`); then rays from ray templates (`fogCast`), cached per cell and range for the battle. An ambush now needs the group hidden in a wood or within its foes' range behind the ground (`rng`), not merely beyond sight.
- **Display:** a soft fog over the field and the small map (`fogDraw`, `fogMiniField`), easing over 0.3 s; ghosts at enemy groups' last known places (`fogGhosts`, `drawFogGhosts`), fading over 15 s.
- **AI:** blind captains advance as a line after 3 s (`captainSearch`); the lull and posture clocks run from the first sighting (`captainMem.seen`).

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
- **The ambush on the road** (only with terrain and cover; since the encounters on the map, `ROAD_ENC.ambush` in `world/encounters.js`, doc/ENCOUNTERS_DESIGN.md: unseen below Scouting 2, it springs as you pass): fight (the ambush above), or cut the baggage loose and run (−4 food, −15 gold, −4 morale).
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

### Field variety as built (2026-10-18)

The owner: "Make battlemap variations based on world map: if you are in forest, you have to have a lot of trees in the map." Built in `battle/terrain.js` (generation, recipes, fairness), with two small hooks in `commander.js` and the lab's `ground` key in `lab.js`. With `TERRAIN.on` false nothing changes.

**What the world says** (`terrainAt`, the tile and its 8 neighbours):
- **The recipe:** as before, plus **peaks** (a hill tile with 3 or more peak tiles round it). A forest tile in the swamp is the **mire wood**; a forest tile within `TERRAIN_DENSE.elfR` (10) tiles of an elves-only town is **elven woods**.
- **Edges** (`terrainEdges`): each side's three tiles, the middle one counting twice, 2 of 4 at least: `forest`, `hills`, `peaks`, `water`, `marsh` (a swamp beside a field that is not), or `open` (open land beside a forest's field). A kind like the field's own counts for nothing.
- **A road:** the tile is a road. It crosses the field west to east, and north to south too where the world's road goes on that way.
- **A frozen river:** a frost field with no water near gets one at `TERRAIN_RIVER.frostP` (.35). It is all ice and crossed anywhere. Swamp streams now come at .6 (was .5).

**Recipes by tile kind.** Several layouts each, picked by the tile's seed (`TERRAIN_RECIPE`):

| Tile | Layouts |
|---|---|
| Plains | plain, hill, copse, wooded hill, copses, **rise** (one broad low hill). In the frost: **snowwood** (snowy copses in pairs), copses, wooded hill, plain, hill |
| Forest | **deepwood** (58–64% woods), **stands** (50–56%, big stands and clearings), **hillwood** (a low hill under the trees, a clearing on its top), **glade** (a wide glade in the middle); elven: **elvenwood** (55–62%, old stands, two deer paths) |
| Hills | pair, ridge, wooded ridge, pair with a wooded flank, **rolling** (a level-2 hill in the middle and a low pair), **ridges** (two long ridges); cliffs at .36 / .24 (were .3 / .2) |
| Peaks | **pass** (mountains along both edges, the lane down the valley between), **saddle** (a hill between four mountains), **gorge** (one great crag off the middle, spires) |
| Swamp | marsh, **fen** (30–38% marsh, dead trees, dry hummocks, a causeway), **mere** (marsh pools and dead stands); a forest tile: **mirewood** (40–46% woods, 14–18% marsh) |
| Desert | plain, dune, **dunes** (two long dunes), **erg** (a dune down the middle and a pair), **spires** (rock spires always); still no woods and no water but an oasis |

**Dense fields** (`TERRAIN_DENSE_LAYOUT`, `densePlan`, laid by `denseLay` once hills, rock and rivers are down):
- **Woods by share.** Seeded noise over the cells, two octaves at the layout's stand size. Each half's deployment zone and its middle take the most wooded cells up to their share. The zone gets the field's share ×(1 − `zoneLess` .2), and the middle gets the rest. What a band cannot hold goes to the other band. Both halves are done alike, so the cover is fair by construction.
- **The glades.** Each army has a deployment glade: a ragged ellipse at .45 of its zone from its edge, .42 of the zone wide each way and .3 of the field high each way. Clearings come in mirrored pairs; the middle glade and the hilltop clearing have their own.
- **The way through:**
  - A road tile has a **road**: 2 cells wide, a cell of verge cleared each side, `T.road` 1.
  - Otherwise, a **deer path** (2 cells, `T.road` 2) at `pathP` (.65), or a **chain of clearings**.
  - Elven woods have a second path round the other way. A fen's causeway is always a path.
  - A way runs edge to edge through both glades and crosses deep water at a crossing (laid like a real road since: see "Roads laid like real ones").
- **Open neighbours** thin the woods toward their side (`edge` .4 over `band` .22 of the field's height).
- **Frost:** a frost forest is ×.92 woods (snow fields), never under half the field. The snowy firs are the art's frost palette.
- **Short fields** (a phone's, the lab's) get smaller clearings (`ks` = field height/520, .55 at least).

**Roads on other fields:** edge to edge near the open lane's height, verges cleared (laid like a real road: see "Roads laid like real ones"). **A road is a little faster:** ×1.1 (`TERRAIN_ROAD.spd`, in `groundMul`), and the HUD line says "On the road (+10% speed)". The ground paints them (see "Sizes, variety and the art joined").

**Edges** (`edgePlan`):
- **North and south shape their own edge:**
  - forest: copses along it, ×.75 in the zones;
  - hills: a low ridge along it (no cliffs);
  - peaks: crags in its middle stretch, never in a zone;
  - water, marsh: reed marsh on its shore.
- **West and east would favour one army** (D5), so they shape both ends alike: woods or marsh at the zones' outer corners, a low hill in a corner, spires just off the zones.
- A desert takes no woods, water or marsh from its neighbours.

**Larger fields** (`fieldScale`, `TERRAIN_SIZE`). The playable area is compared with ref 572,000 px² (1100 × 520) ×1.3 slack:
- Beyond that, a field gets an extra mirrored pair of its recipe's `extra` features per ref (copses, hillocks, marsh, dunes), and features up to ×1.5 larger (the 4th root of the area).
- Dense layouts lay by share, so their coverage holds at any size; their clearings scale with the area.
- Today's sizes are as before.
- **The join with the field-size work:** `buildTerrain({W, H, top, bot})`. H is the field's height; it defaults to `BH`, so once `BH` follows the chosen size, nothing more is needed. `riverPlan`, `riverExplicit`, `terrainExplicit` and `rasterTerrain` (`plan.H`) take it too. The deployment zones are the sized field's (see "Sizes, variety and the art joined").

**Fairness** (`terrainFair`):
- **A dense field (`T.dense`)**, in place of the 25% zone rule:
  - both zones' shares of cover (woods and marsh) within `fair` (8 points) of each other, and the same for open ground;
  - each army's glade 70% open at its heart;
  - an open way from glade to glade (`openWay`: 2×2 blocks of open, ford or bridge cells);
  - each zone's middle reaching the other's (`route.js` `reachable`, both ways).
- **Every field, as before:** the halves within 15%, rivers, no rock in a zone or the lane, and reach.
- **When no sub-seed is fair**, features are dropped in this order: rocks, cliffs, woods, marsh, hills, the dense woods, then the river.
- **Hills:** a layout's hills are centred or mirrored by another. A pair's shoulders, an edge's ridge and hummocks are `low` (no cliffs).

**The AI** (`commander.js`, only on dense fields):
- A defending captain may hold a glade or clearing on its half (`TERRAIN_AI.gladeHold`, 1 level's worth). Its infantry stands at the glade's edge toward the foe, who must come through the woods with his formations broken.
- Riders riding to a spot keep to the roads, paths and clearings' chains when their straight way is 35% woods or more and the way is 10% quicker (`terrain.js` `wayRide`).
- `B.terrain.ai` gains `dense`, `glades` ({x, y, r, half}) and `ways` ([[x, y], …]). On a dense field, `ai.woods` lists only stands up to 256 px (`denseStands`); the great wood is no patch to ride round.

**For the art** (built since: see "Sizes, variety and the art joined"):
- `B.terrain.road` (1 road, 2 path) and `recipe.ways` are there to paint a dirt track (now painted).
- `B.terrain.deep` marks a wood's heart (wood two cells all round). It could be painted as canopy in the ground instead of standing sprites (not done: see below).
- `recipe.elven` and `recipe.frost` could pick an older or snowier tree mix.

**Measured** (headless, software canvas; `tests/visual/fieldperf.js`):

| Field | Generation | Paint | Trees | Of them in `deep` | A frame of props, whole field | Zoomed ×2 |
|---|---|---|---|---|---|---|
| 1100×600 forest | 2–3 ms | 85 ms (old forest about 37) | about 1,000 | 30–37% | 0.9 ms | 0.4 ms |
| 1600×900 forest | 3–4 ms | 170 ms | about 2,400 | 33–45% | 8.7 ms | 0.4 ms |
| 2000×1200 forest | 5–6 ms | 270 ms | about 3,700 | 39–47% | 9.5 ms | 0.5 ms |
| 3200×1800 forest | 10–13 ms | 640 ms | about 9,000 | 47–55% | 22 ms | 0.5 ms |

- The simulation is no dearer on a forest: 1.9 / 4.9 ms a frame at 400 / 800 soldiers, against 2.0 / 5.0 with no terrain.
- **At today's sizes this is fine.**
- **On a big field zoomed out, the props cost too much.** Drawn downscaled one by one, they take 9–22 ms a frame. The recommended art change is a level of detail: below zoom ×0.9, draw one tree layer painted once with the ground, not the sorted sprites. Painting `deep` as canopy would also halve the sprites.

**AI on AI** (`tests/visual/fieldbalance.js`; fog on, mirror armies of 20 foot, 12 bows and 6 riders, 30 seeds):

| Field | Left / right wins | Length, mean / median | Unfinished |
|---|---|---|---|
| Forest | 16 / 14 | 43 / 42 s | 0 |
| Hills | 20 / 10 | 46 / 43 s | 0 |
| Plains | 21 / 9 | 36 / 31 s | 0 |
| Flat field (control, same code before and after) | 21 / 9 | — | 0 |

- **The left-hand lean is the lab's.** At 1d84c88, the flat control gives the same 21 / 9.
- **The swamp** (10 seeds): 5 / 5, 48 s.
- **Riders still spend most of their time in the woods:** 73% of it, against 54% of the field. Their charges go straight at their targets (`actors.js`); only their rides to a spot keep to the ways. (Since: their captains' charges keep to the ways too; see below.)

### Sizes, variety and the art joined (2026-10-18)

**The zones.** `terrain.js` `terrainZone(W, H)`: a sized field (`BFIELD`, when the field built is that one) gives `[back, back + depth]` px off each edge (`fieldZone`); otherwise null, today's outer `TERRAIN.zone` (30%). `buildTerrain` passes it to the plan (`P.zone`, `spec.zone` to force one) and the grid (`T.zone`). Read through `zOut`, `zIn`, `zHi`, `zMid`; with null every expression is today's, so today's fields are the same cell for cell.
- **Dense fields:** each army's glade at `.45` of its real zone (`G.x`, `G.rx` of the zone's depth); the woods laid by share over the zone and the rest of the half (the ground behind the zone is in "the rest"); clearings spread over the half outside the zone (`outZ`), not all crowded into the narrow middle a big field leaves.
- **Fairness** (`terrainFair`, `terrainReachFair`): cover, open ground, wood and water counted in the real zones; reach from zone middle to zone middle; every passable cell from the edge to the zone's far side reaches.
- **Rock** keeps off the zone and the ground behind it (`zHi`).
- **A pass on a sized field:** its crags as big as the field's height asks (`fh/520`, at most `TERRAIN_ROCK.pass` 2.2) and more of them: two more mirrored pairs along each edge in the middle and one in the ground behind each zone. Rock still never enters a zone's columns (the fairness rule), so the valley's walls have gaps there.
- **Measured** (`tests/fieldvariety.js`, sizes on): forests at every size 50–64% woods, 120 fields, glades in their zones, fair, nothing dropped; a lab battle on a forest at each size, the lines in their glades; held bridges at big and large and ambushes at small and big fight to the end, nobody in deep water.

**Big woods zoomed out** (`render.js` `LOD {on, z: .9, trees: 2000, rate: 5}`, `engine/ground.js` `PX.battleCanopy`): on a field of more than 2,000 standing trees (`ground.trees`), under zoom ×0.9, the trees are one canopy layer (every tree sprite painted once, in order, into a field-sized canvas, made when first needed and kept) drawn after the corpses and ground effects, under the selection marks and the men; cliff faces and mountains stay sorted sprites. Zoomed in, the sorted sprites as before (depth order, the fade over your men), culled to the view. Across ×0.9 the two cross-fade over 0.2 s of real time (`TREE_A`). Today's fields have well under 2,000 trees (about 1,000 on a forest), so they never use it; their frames are pixel-identical to before (a pixel hash over 4 seeds each: no terrain, hills, plains, forest, swamp, and a large forest at ×1). The canopy layer costs a field-sized canvas (22 MB on a huge field). Not done: painting `deep` as canopy at every zoom (men in a wood's heart would stand on top of its crowns zoomed in).

| Field (forest, whole field in a 1280×720 view) | Trees | Props a frame, sprites | With the canopy layer | Canopy made once |
|---|---|---|---|---|
| 1100×600 | 940–1,040 | 2.5–2.7 ms | (no LOD: zoom ×1.16) | — |
| 1600×900 | 2,000–2,400 | 4.9–5.8 ms | 0.4–0.5 ms | 3–4 ms |
| 2000×1200 | 3,300–3,800 | 7.7–8.3 ms | 0.5–0.6 ms | 6–9 ms |
| 3200×1800 | 8,000–9,000 | 15.8–18.4 ms | 0.8–0.9 ms | 18–19 ms |

(`tests/visual/fieldperf.js`, each frame timed to a pixel read back; zoomed in ×2, 1.6–2 ms either way.) A whole `drawBattle` frame of a huge forest battle, 300 soldiers, at the fit (×0.30): 20.8 ms before, 9.7 ms with the canopy; at ×1, 4.9 / 5.0 ms.

**Roads and paths painted** (`engine/ground.js` `paintWays`, step 3b of `PX.battleGround`, from `spec.ways` or `recipe.ways`; `WAYPAL` by climate). Each way's line smoothed (Catmull-Rom); each pixel near it takes its distance, how far along it lies and its kind.
- **A road:** a worn cart track 20 px wide (restyled since: see "Roads laid like real ones"). Packed snow with snow banked at its verges in the frost, sand in the desert, mud in the swamp.
- **A path:** a trodden strip 8 px wide (restyled since).
- **Over marsh:** a way's stretch with marsh round it (a road: 7 of the 7×7 cells round a point, its verges being cleared; a path: 6 of 5×5; gaps of up to 3 samples closed, runs under 4 dropped) is a causeway (a road: raised earth, a log along each side every 14 px, its south face and shadow) or a boardwalk (a path: planks across, 4 px a plank, a beam each side lit on the north, a post every 16 px).
- Never on water or a sheer face; fainter on a slope (and see below: a face cut for a climbing road). Details, lone trees and copses, and a river bank's reeds keep off it (checked after their draws: the seeded stream is unchanged, and a field with no way paints exactly as before).
- An ambush's road (straight down its middle) is in `recipe.ways` for the art alone: no `T.road`, so no faster going.

**Riders' charges keep to the ways** (`commander.js` `captainCav`, `TERRAIN_AI.wayCharge` 160): on a dense field an AI charge at a mark over 160 px off whose straight way runs through the woods (`wayRide`: 35% woods or more, 10% quicker by the way) first rides for the road, path or clearings' chain, and goes in from there. Effect (a one-off count, 10 seeds, the field-balance armies, fog on): on today's field with the lab's armies 500 px apart, the riders' time in woods stays 68% (their fights are short and in the woods); on a large field with the armies 1,100 px apart it falls from 63% to 58%, wins 6/4 either way, lengths about the same.

**Tests:** `tests/fieldvariety.js` (35 checks):
- forest coverage at six sizes (960×290 playable up to 3200×1800), 300 fields with frost, elven, river and road variants;
- the glades, the fairness numbers and reach;
- each kind's signature;
- roads, and the road speed;
- edges, from the lab and from the world;
- the same tile, the same field, and tiles that vary;
- generation time by size;
- no `Math.random`;
- the AI's reading;
- the lab key;
- terrain off;
- a world battle in a forest.

`tests/terrain.js`'s hill-symmetry check now allows hills mirrored round a middle one (rolling, erg, isles).

### Roads laid like real ones, and natural ramps (2026-10-18)

The owner: "Battle map road looks bland, it's just like S S S, and it is even drawn above the hills." The road was a Catmull-Rom line through a few fixed points (edge, glade, the crossing nearest the lane, glade, edge) with an even sine meander on top, laid without a look at the ground: it ran straight over hills and cliffs. Then, on the ramps: "make ramp looks natural, no need wood planks, etc. just natural ramp!!!", and on the roads: "cart tracks can have, just make it look natural".

**Planning** (`terrain.js` `wayPlan`, `wayGrid`, `wayCells`, `TERRAIN_WAY`; `denseLay` lays every road, deer path, causeway and chain of clearings with it, on dense fields and others alike):
- **A least-cost line over the cells** (`route.js` `routeSearch` on a grid of the way's own, laid once the hills, rock, rivers and cliffs are down). A cell's cost: open ground 12, ×1 to ×3.4 by seeded two-octave noise (the way wanders as ground does); wood +14 for a road (+4 a path: paths live in woods), marsh +26 (+16), a ford +44 (+14: a road takes a bridge where there is one), +10 a level of plateau, +80 a slope band (+45), +12 a low cell at a terrace's foot (it keeps off a face); a dense field's stands-to-be (its woods' noise as `denseLay` will lay them) as dear as woods, so a forest road threads the gaps. Rock and deep water are closed; **cliffs are closed both ways** (a one-way hill's too), so a way crosses a terrace's edge only at a slope or a ramp. Rows off the field are closed.
- **Ends:** where the world's road crosses the edges, as before: west to east (the cheapest edge cell near the lane's height, ±32 px, or near each glade's on a dense field), and top to bottom for one that goes on north or south; the line is carried straight on off the field unless rock or deep water lies there. Legs pass through each army's glade on a dense field; the elven woods' second path keeps its waypoints round the other way.
- **Loops cut; crossings pinned:** a deep river's crossing on the line is held straight over, from 56 px off one mouth to 56 px off the other.
- **Shape:** simplified to within 20 px (a path 12; Douglas-Peucker, the pins kept), smoothed (Chaikin, three times), resampled every 4 px, and swayed across its line by seeded value noise: up to 34 px (a path 12), its wavelength 190-330 px (a path 90-150) stretched and squeezed by noise of its own, its strength by an envelope that dies to 30% (straighter stretches); a path has a finer wobble on top (3.5 px, 30-52 px). No sway within 44 px (a path 30) of an end or a pin. **No sine.**
- **The corridor:** every sample must lie in a cell within 3 of the least-cost cells and like them (kind, level, slope band), with no cliff crossed from the last; where one strays its sway is eased (halved, then dropped, over ±14 samples), where the smoothing strays the line is simplified less (20, 10, 6, 0 px), and at worst the least-cost cells' middles are the line. The points kept (`ways[].p`, every 16 px, was 32) are closer where a chord between two would cut a cliff's corner.
- **The same tile, the same road** (the way's noise from the field's seed); tiles differ. A way that could not get through without crossing a cliff (never seen in 150 fields) falls back to the foot's cliffs, then none, marked `fall`.
- **Cells:** `B.terrain.road` as before (1 road, ×1.1; 2 path), but a road cell only on the sample's own level or a slope, never over a cliff's rim. The AI reads `ai.ways` as ever (`wayRide`, `wayCharge`).
- **The lab:** its own grounds (`{hills, woods, …}`) take `road`: `true` (west to east at the middle), `'ns'` (north to south too) or a share of the field's height.

**Height in the art** (`engine/ground.js`):
- The ways' lines are reckoned first (2b: `DR`, `DS`, `DK`, now with each pixel's side of the line and a **climb** flag: the terrace level under the line changes within 20 px), then the colour pass. Where a climbing way passes a terrace's face (on a field with no cliffs every edge's earth face is climbable) the face within its half-width and 3 px is **cut to a slope** (`cutW`: graded, worn, `F` 4, no face prop); the side walls likewise. A sheer face is never cut and never painted over (and a road never climbs one). A road climbing a ramp simply runs up its slope, ruts and all, a little stronger than on other slopes (×.85).
- **Trees keep their crowns off a way's line** (`crownWay`; a wood's trees decided after their draws, so the seeded stream is the same): the forest road shows through the canopy layer zoomed out.

**Roads restyled, natural and low in contrast:** worn earth fading in over a soft, ragged edge, its tone varying smoothly, lighter bare patches; **two faint wheel ruts**, each wandering on its own side of the line (noise, ±1.6 px about 4.6 px out) and fading in and out, so they draw together and apart; a patchy grassy crown between; the odd stone; now and then a puddle in a rut (ice in the frost); its width wandering a little (±2 px). **A path:** a trodden strip a little lighter than the ground, no ruts. Causeways and boardwalks as before.

**Ramps, purely natural** (the phase-4 switchback track of plank-like stripes and the stone cairns are gone, `paintRamps` with them): where a cliff-ringed plateau's edge is a ramp the cliff breaks and the hillside slopes down through the gap, as tall as the cliff beside it (12 px a level): the plateau's own ground and grass shaded in four steps down toward the ground's, the earth showing through in its middle (worn, lighter), grass tufts, its west side in shade and its east side lit, a few loose stones of scree in a soft fan at its foot; the face's end each side a **rock shoulder** (the west one's end in shade, the east one's lit). East, west and north ramps likewise across their edges (`rampPx`, `rampFan`, `rampSide` in `wlTop`/`wlLow`). By climate: snow lying over it in the frost, sand in the desert, mud and moss in the swamp. Its pixels are `F` 4: never a face prop, nothing stands there. A level-2 climb is one long slope. **A field with no cliffs and no way paints exactly as before** (24 such fields hashed pixel for pixel against the snapshot).

**Measured** (`tests/roads.js`, 150 fields: every recipe and its layouts, rivers with bridges, frost, crags; 200 ways):
- no leg of any way crosses a cliff (13,000+ legs walked on a grid with cliffs closed both ways), none lies on rock or deep water but at a crossing; no way fell back;
- roads round hills: of 80 roads whose straight way meets a hill, 0.0% of the road lies on a terrace against 19.1% of the straight line;
- not periodic: the autocorrelation of a road's turning, past its first zero, peaks over .6 on 0 of 188 roads (mean .23); the old even sine meander peaks at .98;
- the same tile, the same road (points and cells); the next tile another;
- ends: west-east roads come in off the west edge and leave off the east, north-south ones run top to bottom; both armies reach the road alike (the road's distance from each zone's middle differs by 44 px on average, 102 at the 90th percentile);
- riders keep to the ways on a dense field (`wayRide`) as before;
- planning time a field (all its ways): today's 1.0-1.2 ms, 1600×900 2.0-2.5, 2000×1200 2.8-3.3, 3200×1800 6.8-8.7;
- the art: no road line under a cliff face prop, no face prop over a ramp's middle, a forest road's line open through the canopy.

**Changed expectations:** `tests/fieldvariety.js` "a road that goes on north or south crosses the field that way too" now looks for a road cell in every row within the middle half of the field (was the middle 40%): the road may go round what lies in the middle. Road cells (`B.terrain.road`), `recipe.ways` and the painted ground change on every field with a way, and the ramps on every field with cliffs; the terrain-off fingerprints (battlecommands, actorrules, attackrules, battlesetup, battleresolution, `visual/moraleaudit`, `rts` seeds 1, 2, 44) are byte-identical.

### Desert life as built (2026-10-18)

The owner: "Can you ensure that the desert battle map contains the cactus or relevant details generated." Decoration only, as the woods' trees are: the fields keep no scattered colliding props, the desert no woods and no water but an oasis. All in `engine/ground.js` (`PX.battleGround` step 4b, `PX.desertSprite`), from a stream of its own (`seed*89+29`); nothing in `terrain.js` changed.
- **Standing** (props `dk: 4`, `dc` their kind; `cv.decor` how many): saguaros (the obstacle cactus's: two arms, one and a bloom), young saguaros, barrel cacti, prickly pear (fruit now and then), dead shrubs, dry sage, an ox skull or a ribcage now and then (one a cluster at most), small sandstone rocks. Sorted by their feet with the soldiers and faded over your men (`render.js` as a tree; no LOD canopy: they are few). Each has its shadow painted (a cactus its own).
- **Where:** clusters of 2–5 round a main kind, 64 px apart at least, one a 34,000 px² of the ground, and a few pieces alone (one a 40,000). A spot in a deployment zone counts ×.35, in the open lane ×.45, on a dune ×.45, so those stay fairly clear. Erg and spires fields, and any spot within two cells of rock, take more rocks and dry sage. Never on a face, a slope, a way, the water or the oasis's heart.
- **An oasis:** past its palms, tall grass and green shrubs on its green fringe; round it out to twice its radius, thinning, grass and green shrubs near, then sage, prickly pear and young cacti; green tufts painted between.
- **Painted** (flat): sun-cracked clay pans (a pale wobbly ellipse split into plates), pebble scatters, dark flecks, tufts round each cluster, and wind ripples over the dunes and in a patch here and there on the open sand (noise only).
- **Fairness:** none of it is in `B.terrain`; the cells, levels and routes are as built and nobody steps round it. Fields with terrain off and every other climate are unchanged (47 grounds hashed pixel for pixel, props included, against the snapshot: grass, frost and swamp, every recipe, today's size and larger).

| Field (desert, 3 seeds) | Pieces | Paint | A frame of them, whole field in 1280×720 | Zoomed ×2 (every prop) |
|---|---|---|---|---|
| 1100×600 | 70–90 (an oasis 100–150) | 35–80 ms (about +25) | 0.2 ms | 0.1–0.3 ms |
| 1600×900 | 155–220 | 85–155 ms | 0.3–0.5 ms | 0.2–0.4 ms |
| 2000×1200 | 260–340 | 145–285 ms | 0.5–0.6 ms | 0.1–0.7 ms |
| 3200×1800 | 665–745 | 410–720 ms (about +90) | 1.2–1.6 ms | 0.2–1.0 ms |

(Headless, software canvas, timings noisy by load.) A whole `drawBattle` frame of a huge desert battle, 300 soldiers, with and without the decor: 12.7 / 13.4 ms at the fit (×0.30), 5.6 / 6.5 ms at ×1: within the noise.

**Tests:** `tests/desertlife.js` (17 checks): every layout stands its life, every kind stands, the flat details painted; lighter in the zones and the lane; rockier on erg; counts by area; clustered; an oasis denser and greener; decoration only (cells and routes as built, `B.obs` empty, a soldier walks straight through a saguaro's foot, the fade over yours); seeded and never `Math.random`; no decor in other climates; each sprite on its foot.

### Narrower slope bands and smooth rises (2026-10-18)

The owner: "Can you adjust the area when you climb the hill? Currently it seems too wide", then "slope should be smooth with terrain", and earth and rock may show on a climbable slope, broken up and varied.

**The band** (`terrain.js` `rasterTerrain`, `TERRAIN.slope` 2 → 1): a slope cell is one with ground k cells off at least ceil(k/S) levels lower, so the band is **1 cell (16 px) in from a rim a level down** (was 2, 32 px), and 2 cells where a terrace drops two levels at once (the art's taller rise there). Measured over every layout of every recipe (seeds 1–4), the band's width crossed along a hill's radius went from 44–57 px to 21–26 px at either level; on the hills recipe the share of level-1 terrace that is slope went from 86% to 49%, of level 2 from 93% to 58% (the tops are now flat tops). Ramps are unchanged (their gap is `TERRAIN_ROCK.ramp` wide; the cliffs stop where it begins) and still climbed only by them (`tests/routing.js`).

**The climb** (`HILL.climb` foot .6 → .5, mounted and big .5 → .4; `climbSta` 2 kept): a walk from a level-2 hill's foot to its top takes about as long as before (foot 13.8 → 14.4 s from the east, 9.9 → 9.6 s from the south; riders 6.9 → 7.2 s, 5.1 → 4.8 s), a running climb tires a little less (foot 30 → 27 stamina from the east). A `climbSta` of 2.5 kept the stamina cost but gave the hill's holder every lab battle, so it stays 2.

**Balance** (lab, AI on both sides, mirror armies of 20 foot, 12 bows and 6 riders, a level-2 hill of r 130 in one side's half, each side holding it in turn): the holder won 13 of 20 battles before (seeds 1–10) and 17 of 20 after (31 of 40 over seeds 1–20; 30 of 40 with the old band and climb); means 52–56 s either way. `visual/fieldbalance` hills (mirrored, fair): left/right 8/2 → 5/5, mean length 37 → 42 s; `visual/terrainbalance` cliffs: 2/8 both, 66 → 67 s.

**Smooth rises** (`engine/ground.js` `slopeAt`, `slopePx`, `slopeLow`): every edge with no wall bit (all of them on a field with no cliffs) is painted as a smooth rise, never an earth face: the ground's own grass, snow, sand or mud shaded in soft steps from the top to the foot inside the higher cells (`SLB` 10 px a level of the step facing south, 6 east, 4 west and north), lit from the upper left (the south and east ones in shade, the west and north ones lit), the terrace's tint easing toward the level below on the way down, and a soft shadow at the foot; no rim line. Along each hill, by seed and climate (`SLV`), stretches are **grassy**, **earthy** (bare earth through the grass, now and then a low turf lip) or **stony** (stones and small lit boulders poking through); frost shows dark rock through the snow, its boulders capped white; the desert low sandstone ledges, broken; the swamp mud, moss and roots. Nothing there is a prop (`F` 4): only a real cliff (wall bits) is a grey rock face with strata, a bright rim and a long shadow, cut into depth-sorted props (`dk` 2) that fade. A road runs up a rise as it does up a ramp (the cut faces, `cutW`, are gone). The small map draws a climbable edge's contour faint (as with walls). Sight, `riseBlocked` and concealment read levels, not the art, and are unchanged. A field with no terrace paints exactly as before (75 fields hashed, ground and small map).

**Changed expectations:** `tests/concealment.js` (depth): its field's hills are climbable and now have no face props, so it checks that and puts a sheer hill's cliff faces in among the props for the face's depth test. Terrain-on fields change by design (`B.terrain.up`, the painted ground of hill fields); the terrain-off fingerprints (battlesetup, battlecommands, actorrules, attackrules, battleresolution, `visual/moraleaudit`, `visual/battleperf`, `rts` seeds 1, 2, 44) and `worldprint` are byte-identical.

### Classes as built (class wave E1, 2026-10-21)

`battle/terrain.js`'s loose functions are classes now (doc/STORY_DESIGN.md §7, wave E), **behaviour-preserving**: the same fields, the same draws in the same order, the art pixel for pixel. `B.terrain` keeps the data shape of §4 and phase 4's contract (the art still gets `{...B.terrain}`); it is a `BattleTerrain`.
- **`BattleTerrain`** (`B.terrain` itself): queries `ix`, `kindAt`, `levelAt`, `rulesAt` (the `TERRAIN_GROUND` entry), `isWood`, `isDeep`, `isWater`, `coverAt` (woods or marsh); movement `speedFor` (was `groundMul`), `runFor`, `climbOf`, `staminaFor`, `wadeFor`, `chargeFor`, `hitFor`, `heightEdge`, `flag`, `holdsBank`, `slope`, `slopeMul`; sight over the ground `riseBlocked`, `blocksView`, `stopsMissile`; `update()` (once a frame: `terrainStep`), `label(m)`; the water `riverSpan`, `crossesDeep`; the built field's own `index`, `markDeep`, `stands`, `layDense`, `openWay`, `fair`, `reachFair`; `describe()`. Statics: from the world `ofSite(S, env)` (`terrainOf`), `recipeOf`, `edgesOf`, `riverOf`, `at`, `specFor`; making one `build(spec)` (the sub-seeds and drops, then `finish`), `raster(W, plan, seed)`; the words `describe(rc, has)`, `envText`, `textFor`.
- **Its parts:** `T.routes`, a `TerrainRoutes` (the way round: `build` (the grids), `stepOk`, `hold` (the guard), `ownStep`, `steerTo`, `steerDir`, `barred`, `groupWay`, `wayOn`, `slotWay`, `crossWay`, `wayLen`, `canReach`, `nearLen`, `ride`), a field no spread or JSON sees; `B.sight` (and `T.sight`, the same object), a `BattleSight` (`BattleSight.step(force)`, `reckon`, `struckBy`, `goalFor`, `ambushFor`; statics `on`, `seen`, `foes`, `lastSeen`), which runs with fog and no terrain too.
- **The planners:** `FieldPlan` (a plan before the grid: `FieldPlan.recipe`, `explicit`, `ambush`, `layouts`; `planDense`, `planEdges`, `planFeatures`), `BattleRiver` (a river's plain record: `plan`, `straight`, `explicit`, `half`, `kinds`), `FieldWays` (roads and paths: `grid`, `cells`, `plan`).
- **Stayed functions:** the small pure helpers `tIx`, `groundHome`, `groundSpd`, `unitSkill`, `routeWho`, `groupWho`, `fieldScale`, `terrainZone`, `zOut`, `zIn`, `zHi`, `zMid`, `groundEnv`; the tables as they were. The captains' own reading of the ground (`TERRAIN_AI`, `commander.js`) is E2's.
- **The old names** (81 of them: `buildTerrain`, `groundMul`, `seenBy`, `sightStep`, `climbState`, `slopeWay`, `wayLen`, `terrainFair`…) are one-line aliases at the end of the file, each declared as it was (a `function` stays one: `tests/roads.js` wraps `wayPlan`, which `layDense` calls by that name). Callers are unchanged.
- **Where World Phase 2 (§13 of doc/WORLD_DESIGN.md, D41) slots in:** `BattleTerrain.riverOf` (BattleSite's `river` and `crossing` into the river spec), `BattleRiver.half` (the width: 3, 5 or 8 cells), `BattleRiver.kinds` (the world's bridge, fords only, the ferry's ford), `FieldPlan#planFeatures` (BattleSite's `high`: rise, steep or cliffed), `BattleTerrain#slopeMul` (a steep slope's climb; `runFor`, `staminaFor` and `chargeFor` beside it) and `route.js` `routeGridOf` under `TerrainRoutes#build` (a steep edge's cost).
- **Proof:** see doc/STORY_DESIGN.md §7, wave E1.

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
