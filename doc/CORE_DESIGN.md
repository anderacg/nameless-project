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
