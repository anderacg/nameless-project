# The core wave: shared foundations: design

Status: **approved by the owner 2026-10-20** ("let's start with refactor"); building. This is the first refactor wave, before the story wave ([STORY_DESIGN.md](STORY_DESIGN.md)) and the class waves A–E. **The game plays exactly the same after it:** the world and battle fingerprints are unchanged, and each part is tested with the fingerprints and its area's suites (the owner's rule, 2026-10-20).

## 1. Why

The same few patterns are re-written all over the code (counted 2026-10-20):

| Pattern | How often |
|---|---|
| The daily tick calls 19 `…Day()` functions by hand; the frame update another dozen | 19 + about 12 |
| The HUD refreshed by hand after each change | 41 calls |
| Timed states (a holding's fear, raided, sacked, turmoil; hostility per realm; workers' memory) | 29 + more |
| Time counted several ways (day, clock, road hours, world time) | many |
| One shared random source | 175 uses |
| Each system's own save and load | 13 pairs |
| "Nearest holding" and distances | 36 + 481 |
| Test helpers copied between test files | 27 of 171 files |

## 2. The parts

| Part | File | What it gives | Who uses it first |
|---|---|---|---|
| **Systems registry** | `core/systems.js` | `System`: each registers its `frame`, `hour` and `day` work, with an order. The daily tick and the frame update run the registry, in **today's exact order** | the world loop (`world.js` `dayTick`, `updateWorld`) |
| **Event bus** | `core/bus.js` | `worldOn(type, fn)`, `worldEmit(type, data)`, the world's twin of `battleOn` | the story wave; the HUD's refresh |
| **Clock** | `core/clock.js` | one `Clock`: the day, the hour, night, the part of the day, time since, every N days, the year (for the tournaments). Today's helpers (`timeOfDay`, `darkness`, `worldTime`, `roadNow`…) delegate to it | everything that counts time |
| **Timed states** | `core/timed.js` | `Timed`: `set(state, days)`, `has(state)`, `daysLeft(state)`, announcing when one runs out. A **view over today's saved fields** (so saves are unchanged) | holdings (fear, raided, sacked, turmoil), the player's hostility per realm, workers' memory |
| **Save registry** | `core/saves.js` | each system registers `{key, save, load, defaults}`; one envelope; defaults merged on load. **The saved shape stays byte-identical** | today's 13 save/load pairs |
| **Random streams** | `core/rng.js` | `rngOf(name)`: a seeded stream per system, its state saved. **Infrastructure only in this wave**; the story systems move onto it in S4 | (S4) |
| **Spatial helper** | `core/spatial.js` | `nearestHolding(x, y)`, `within(list, x, y, r)`, a small grid for big lists (reusing the battle's `SpatialGrid` idea) | the 36 "nearest holding" sites, gradually |
| **Test kit** | `tests/kit.js` | shared helpers: start a game, go home, travel, frames, stub the dice, meet, the panel's text | new and touched tests |

## 3. Rules

- **Composition over deep inheritance:** small components on the classes, not do-everything classes.
- **Saves stay plain data**, and byte-identical in this wave.
- **Old names stay as one-line aliases** until the tests move over.
- **New code lives under a namespace** (`Systems`, `Clock`, `Timed`, `Saves`, `Spatial`), to avoid global name clashes (the `TIERS` clash).
- **Readable classes:** clear method names and multi-line bodies in the new parts; data tables stay compact.
- **The HUD:** `updateHUD(true)` becomes a cheap "mark dirty", redrawn once a frame, but only if the tests that read the HUD at once still pass. Otherwise it stays as it is, noted.

## 4. Steps (two background jobs, by file)

| Job | Parts | Owns |
|---|---|---|
| **K1: loop and saves** | systems registry, save registry | `core/systems.js`, `core/saves.js`, `world/world.js`, `main.js`, `core/save.js`, the save and load lines of the systems |
| **K2: time, states and helpers** | clock, timed states, event bus, random streams, spatial helper, test kit | `core/clock.js`, `core/timed.js`, `core/bus.js`, `core/rng.js`, `core/spatial.js`, `tests/kit.js`, the call sites of `until(…)` and the time helpers outside `world.js` |

Then the story wave (S0–S5), on these.

## 5. Status

| Part | Status |
|---|---|
| Systems registry | **built (K1, 2026-10-20)**: `core/systems.js`. 23 day and 15 frame systems, each registered in its own file (`Systems.add`); `dayTick` and `updateWorld` run `Systems.day()` and `Systems.frame()` in today's exact order (fingerprints unchanged; `tests/structure.js` pins the order). `Systems.hour()` is ready, not called yet: the Clock (K2) calls it |
| Save registry | **built (K1, 2026-10-20)**: `core/saves.js`. The world part of a save is 24 pieces (`Saves.add`: `seen` in fog.js, `road` in encounters.js, `news` in news.js, the rest in save.js); the saved JSON is byte-identical (W7, B2 unchanged); defaults merged on load, then a settle pass (lots, sites, herds). The envelope (`P`, day, clock, speed, bandits…) stays in `saveGame` / `applySave` |
| Clock | **built (K2, 2026-10-20)**: `core/clock.js`. `Clock` reads `G.day`/`G.clock` in the old arithmetic and moves it on (`Clock.advance`, `world.js` `updateWorld`'s one clock line; `passHours`, the road's wait), calling `Systems.hour(h)` on each new hour (no hour system yet); `timeOfDay`, `darkness`, `worldTime`, `roadNow`, `roadDay`, `roadHours`, `dayPart`, `watchNow` are its aliases, and the scattered `G.clock/DAY`, `G.day-x`, `G.day%n` reads outside `world.js` use it. |
| Timed states | **built (K2, 2026-10-20)**: `core/timed.js`. The 29 `until(t,…)` sites, the holdings' fear/raided/sacked/turmoil setters, `P.hostile` (15 sites) and the holdings' memory (`remembers`/`remember`) go through `Timed.of`; `until` stays as its alias. `world.js` and the save lines untouched; saves byte-identical. |
| Event bus | **built (K2, 2026-10-20)**: `core/bus.js`. Infrastructure only (no emitters moved). **The HUD stays as it is:** `updateHUD(true)` as a dirty mark would break the suites that call it and read `#stats`/`#stay` in the same synchronous step (biomes, critters, power, territory, vitals, stay): no frame runs between in the harness. |
| Random streams | **built (K2, 2026-10-20)**: `core/rng.js`. **In use since S4 (2026-10-21, doc/STORY_DESIGN.md §9)**: the story and content systems draw from `road`, `letters`, `incidents`, `quests`, `critters`, `monsters`, seeded per world and per game (`Rng.game`, drawn as a new game begins); saved as the world's last piece, `rng`; `Rng.use(name, fn)` for a shared helper's draws. |
| Spatial helper | **built (K2, 2026-10-20)**: `core/spatial.js`. 50 `nearestOf` sites moved one-for-one to `Spatial.nearestHolding`/`Spatial.nearest` (same scan, same order, same ties); `nearestOf` is its alias. `Spatial.index` (a grid) is there for big lists, unused so far. |
| Test kit | **built (K2, 2026-10-20)**: `tests/kit.js`. Loaded by `tests/harness.js` before each suite and left out of the sweep. On it: `relations`, `reputation`, `leaders`, `quests`, `monsters`, and the new `coreparts` (the K2 parts' own checks); the rest move as they are touched. |

K2 (time, states and helpers): **built 2026-10-20**, behaviour-preserving: the world fingerprint (`worldprint -Seed 1`) and the five battle fingerprint suites unchanged, no re-records.
