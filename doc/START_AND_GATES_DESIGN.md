# A humble start, and places you must earn: design

**Status:** design only, 2026-11-05, for the owner's review. Nothing here is built.
**The owner's asks (2026-11-05):**
1. "Make a background more meaningful, like start from nothing: you spawn in a small hamlet far away."
2. "Split map loading between chunks, so that some area may be locked. E.g. bigger cities may require some requirements."

---

## 0. Where we start

| What | Today | Where |
|---|---|---|
| Pasts | Eight: soldier, guard, woodcutter, exile, apprentice, hedge mage, merchant, **nobody** (no weapon, 5 gold, 3 grain, Unarmed 2, Athletics 1) | `data/progression.js` `BGS`, `data/tree.js` `ORIGINS` |
| Where you begin | Every past: at the gate of your people's capital (`capitalOf(P.race)`), "You ride out of Ashford alone" | `core/session.js` `startGame` |
| Start setting | Wanderer (today's) or Settler (a camp founded; designed, §7.5 of WORLD_DESIGN, not built) | `world/worldsettings.js` `start` |
| Hamlets | Free folk's hamlets and small villages past every realm's reach: 24 on the classic seed | `world/worldplace.js` `genHamlets` |
| Opening story | "A Name on the Road": a first contract, a missing cart, a waiting village (designed, not built) | `doc/OPENING_STORY_DESIGN.md` |
| A holding that keeps you out | Only under siege, a raid, or when its realm is hostile (`closed()`, `foeAt`) | `world/holding.js`, `world/siege.js` |
| The map in chunks | **Already**: the world is painted in 1 MB chunks, at most 32 kept (`WorldArt`), and far parties think less often (`WORLD_LOD`) | `gfx/worldart.js`, `world/worldobject.js` |

---

## 1. A humble start: you begin in a far hamlet

### 1.1 Who starts there

A past says where it begins (`BGS[k].start`):

| Past | Begins at | Why |
|---|---|---|
| **Nobody** | **a far hamlet** | nothing to your name: a stranger nobody sent for |
| Woodcutter, Exile, Hedge Mage | a far hamlet (or village) of the free folk | the edges of the world are theirs |
| Soldier, Guard, Apprentice, Merchant | your people's capital, as today | they come from the realm's own service and trade |

*Alternative (one switch, simpler):* a **Start** choice on the New game page for every past: **Capital** or **Far hamlet**, the past's own the default. Recommended: the table above as the default, the switch to override it.

### 1.2 Which hamlet

Chosen once a new game is made, from the world's free hamlets (`WM.freeHoldings`), the best by:
- **far**: at least 2 days' march from every realm capital (Router days), the farther the better;
- **your people's** first: its folk your race, else any;
- **fair** (as the settler start's rules, WORLD_DESIGN §7.5): no bandit camp or hideout within 25 tiles; no wild region within 15; a road out of it; a realm's village or town within 2 days, so there is somewhere to go next.

No hamlet fits (Hamlets None, or a crowded map): the farthest **village** from the capitals; then the capital, as today.

### 1.3 What it gives you

- **A place that is yours, a little.** The hamlet knows you: reputation +10 there (others 0), a bed at its house for nothing, its reeve's name in your first line. Only its surroundings are known on your map: the hamlet, its road, and the first holding the road reaches (`KNOWLEDGE`); the rest is fog.
- **A first line that says so:** "You wake in Elderwell, a hamlet of free folk far from any lord's hall, with nothing but the clothes you stand in."
- **A first reason to leave:** the opening story's first contract (OPENING_STORY_DESIGN §1, "Work for a stranger") given by the hamlet's reeve, its cart lost on the road to the nearest village. With that story not built yet: one hamlet job ready on its board (a beast at the herds, or a letter to the next village).
- **Your band from nothing:** the hamlet hires a few melee volunteers (its `hires`), so your first men are the hamlet's own.
- **The way home stays open:** the hamlet is marked Home on the map until you have a holding of your own.

Nothing else changes: the same pasts' gold, gear and tree; the world is the same world.

### 1.4 What it costs to build

Small. `BGS[k].start`, a `startSpot()` beside `capitalOf` in `core/session.js`, the fairness rules as a tunables table (`START_FAR` in `data/world.js`), the first line, the map's Home mark, the known places. A new save field: `P.home` (default: the capital's name, so old saves load as before). Tests: a new `tests/humblestart.js` (each past begins where its row says, on Normal s1–s4 and the classic seed; the fairness rules hold; with Hamlets None the fallbacks).

---

## 2. Places you must earn

### 2.1 Two different things in the ask

"Split map loading between chunks" can mean:

1. **Loading the map piece by piece**, for speed. The drawing already works this way (§0), and the simulation thins out far away. Locking areas does not need more of it. Splitting the *simulation or the save* into regions is a large refactor (CONTINENTS_DESIGN's Phase C covers it for Vast and Immense maps) and is not needed at today's sizes.
2. **Areas you cannot use yet**, for progression. This is what the cities example asks for, and it is cheap on the map we have.

So this design is about the second. **Recommendation: soft locks, not walls.** The world stays open: armies, caravans and you can walk anywhere. What is locked is *what a place lets you do*. Hard walls would break what already moves freely (lords' wars, sieges, caravans, the router, following) and would feel arbitrary in a sandbox.

### 2.2 The gates

| Place | Open to you when | Until then |
|---|---|---|
| Hamlet, village | always | — |
| **Town** | renown 10, **or** a pass, **or** honour 10 with its realm | "The gate-wardens look you over and send you on": its market outside the walls only (small trade, no recruit, no hall) |
| **City** | renown 30, **or** a pass, **or** honour 25 with its realm, **or** a rank in its realm's service | as above; the market outside is smaller |
| **Castle** | its lord's leave: honour 20 with the realm, or a summons (a quest, a letter) | its gate only: "No one enters without the lord's leave" |
| Your realm's holdings | always (you serve it) | — |

Every number is in one table (`GATES` in `data/world.js`) so it is easy to tune.

**A pass** is earned, not ground for:
- a **letter of introduction** from a reeve or innkeeper after a job well done (a new reward; `world/letters.js` keeps letters today), naming one town or city;
- a **writ** bought from a town's steward with gold and some reputation;
- a **guild token** from a merchant job, for its own city's market.

A pass is kept in `P.passes` (holding name → day given; default `{}`). The reasons shown are the real ones: "Needs renown 30 (you have 12), or honour 25 with the Vale Crown, or a pass."

**Breaking in is possible, and costs:** bribing a gate-warden (gold, a chance by Persuasion, honour lost if caught), or slipping in at night (Scouting; caught: arrested, `world/captivity.js`). These are choices on the gate's page, not exploits.

### 2.3 Regions on the map (optional, phase G3)

To make "areas" visible as well as places: the map's **provinces**, each realm's land round its city, named, with a small lock on the map and the province's gate shown (its city's requirement). A province is the holdings' land (`world/territory.js` already claims it per holding), grouped by the city or capital it falls under: no new map structure.

The wild regions (WORLD_DESIGN Phase 4, a stub today) are the other kind of "area": not locked, but marked by danger ("Deep wilds: few return"), their beasts stronger.

### 2.4 The window

The gate is its own page, by the frame rule: a header ("The gate of Ashford"), its choices (Show your pass / Pay the writ / Bribe the warden / The market outside / Leave), and the bottom bar (Back, Leave). Esc follows the bar. On the map, a locked holding's label carries a small lock, and its tooltip the requirement.

### 2.5 What it costs to build

Medium. `Holding#admits(P)` → `{ok, why, need}` and the gate page in `ui/town.js` (`approachHolding` asks it first); `GATES`; passes (`P.passes`), their three sources, and the save field; the map's lock icon and tooltip. Tests: `tests/gates.js`: each tier's rule, each way in, the reasons shown, the save, your own realm's holdings open, a besieged or hostile holding as before.

**Design decisions to watch:**
- The capital you start at (the eight pasts that begin there) is **always open to you**: you were born there.
- The opening story's first trips must only need open places (hamlets and villages).
- Quests that send you into a locked city (a lord's audience, a delivery) give you the pass with them.

---

## 3. Phases

| Phase | What | Size |
|---|---|---|
| **S1** | The humble start (§1): pasts' starts, the far hamlet, fairness, the first line, Home, known places, tests | small |
| **G1** | City and castle gates (§2.2, §2.4) with renown, honour and rank; the gate page; the lock on the map | medium |
| **G2** | Passes: letters of introduction, writs, guild tokens; bribes and slipping in | medium |
| **G3** | Provinces on the map, and the wild regions' danger marks (§2.3) | medium, optional |

S1 can be built and played on its own. G1 is useful alone too (renown and honour already exist); G2 makes it fair for a nobody with neither.

---

## 4. Questions for the owner

1. **Who starts in a far hamlet?** Nobody, Woodcutter, Exile and Hedge Mage by default (§1.1), or only Nobody, or a Start switch for every past?
2. **Locks: soft (places refuse you, the land stays open, §2.1) or hard (areas you cannot enter)?** I recommend soft.
3. **Which places are locked?** Towns, cities and castles as in §2.2, or only cities and castles?
4. **The numbers:** renown 10 for a town and 30 for a city about right? (For scale: Lord Aldric has renown 24 at the start. How fast you gain it is not measured yet; I would measure it in a play-through before fixing these.)
5. **Breaking in** (bribes, slipping in at night): in, or leave it out for now?
6. **Provinces on the map (G3):** wanted now, or later?
