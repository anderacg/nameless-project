# A humble start, and places you must earn: design

**Status:** 2026-11-05: §1, the humble start (phase S1), built (`world/start.js`, `tests/humblestart.js`); G1, the gates by standing, a quest's seal and the lords' audiences, built (`world/gates.js`, `tests/gates.js`); G2, the passes, bribes and slipping in, built (the same files); G3, the provinces and their danger, built (`world/provinces.js`, `tests/provinces.js`).
**The owner's asks (2026-11-05):**
1. "Make a background more meaningful, like start from nothing: you spawn in a small hamlet far away."
2. "Split map loading between chunks, so that some area may be locked. E.g. bigger cities may require some requirements."

**The owner's decisions (2026-11-05)**, fixed:
1. **Every past starts in a hamlet or village, with its own reason for being there.** A Nobody wakes in a natural hamlet (one of the free folk's) far away; the others come to a hamlet or small village by their past (§1.1).
2. **Soft locks:** the land stays open; places and people refuse you until you have earned them.
3. **What is locked depends on the place:** some by their standing (cities, castles), some by danger (strong enemies about), some by quests.
4. **Lords too:** meeting some lords needs renown or other stats.
5. **Breaking in is in:** bribes and slipping in at night.
6. **Provinces on the map now** (G3), with their danger.

The rest of this document is written to those decisions.

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

### 1.1 Who starts there, and why

Every past begins in a hamlet or a small village (`BGS[k].start`), each for its own reason, told in the first line:

| Past | Begins at | Its reason (the first line, in short) |
|---|---|---|
| **Nobody** | a **natural hamlet** (the free folk's), as far from the realms as any | you woke there with nothing; they took you in |
| Soldier | a realm's village near one of its castles | discharged after the last campaign, you were paid off and left at the nearest village |
| Guard | a village on a great road | the caravan you guarded broke up here; your pay with it |
| Woodcutter | a hamlet or village by deep woods | the timber camp you worked for closed for the winter |
| Exile | a natural hamlet far from your people's realm | cast out of your own lands, you came where no lord asks questions |
| Apprentice | a village a day or more from a town | you ran from your master in the town; this is as far as your money took you |
| Hedge mage | a hamlet near a shrine or ruins | the old stones called you here |
| Merchant | a village on a trade road | your family's cart lost a wheel and its goods on the road; you are here to start again |

Each past's knack stays as it is. A past whose place cannot be found (no such village on the map) takes the next row's kind, then any far hamlet, then any village; then its people's capital, as today.

### 1.2 Which hamlet

Chosen once a new game is made, from the world's free hamlets (`WM.freeHoldings`), the best by:
- **far**: a quarter day's march at least from every realm capital (`HUMBLE_START.off`; on the classic map the farthest hamlet is some 0.7 days off), and for a Nobody or an Exile the farthest there is;
- **your people's** first: its folk your race, else any;
- **fair** (as the settler start's rules, WORLD_DESIGN §7.5): no bandit camp or hideout within 25 tiles; no wild region within 15; a road out of it; a realm's village or town within 2 days, so there is somewhere to go next.

For the pasts that begin in a realm's village, "far" is 1 day or more from its capital, not 2. No place fits: the fallbacks in §1.1.

### 1.3 What it gives you

- **A place that is yours, a little.** The hamlet knows you: reputation +10 there (others 0), a bed at its house for nothing, its reeve's name in your first line. Only what you see is known on your map: the rest is fog, the next holding too (the owner, 2026-11-05: "the map should not reveal what we still not discover").
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

**Locked by the situation** (the owner: "all depends on situations"), on top of a place's standing:
- **Danger:** a holding whose land holds a strong lord's army or beasts far above your level turns you back with a warning, not a wall ("Raiders of the Iron Jaws hold the road to Granitegate: few your size come back"); you may go on regardless. Shown on the map as the province's danger (§2.3).
- **A quest:** a holding sealed by a story (quarantine, a siege's aftermath, a hunted man inside) opens when the quest says (`t.sealed`, saved, default none).
- **War:** a realm at war with your service keeps its holdings shut to you (as today, `foeAt`).

**Lords too** (the owner: "when you want to meet certain lords you may require some renown or other stats"): a realm's ruler and its great lords hear you only once you have the standing (`LORD_AUDIENCE`: a ruler renown 40 or honour 30 with the realm, a great lord renown 20 or honour 15, others always). Until then: their steward's word ("My lord does not see every sellsword") and what you need. A summons in a quest, or a letter of introduction, lets you in.

**A pass** is earned, not ground for:
- a **letter of introduction** from a reeve or innkeeper after a job well done (a new reward; `world/letters.js` keeps letters today), naming one town or city;
- a **writ** bought from a town's steward with gold and some reputation;
- a **guild token** from a merchant job, for its own city's market.

A pass is kept in `P.passes` (holding name → day given; default `{}`). The reasons shown are the real ones: "Needs renown 30 (you have 12), or honour 25 with the Vale Crown, or a pass."

**Breaking in is possible, and costs:** bribing a gate-warden (gold, a chance by Persuasion, honour lost if caught), or slipping in at night (Scouting; caught: arrested, `world/captivity.js`). These are choices on the gate's page, not exploits.

### 2.3 Provinces on the map (phase G3, wanted now)

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
| **G3** | Provinces on the map, and their danger (§2.3) | medium |

S1 can be built and played on its own. G1 is useful alone too (renown and honour already exist); G2 makes it fair for a nobody with neither.

---

## 4. Questions for the owner

1. **Who starts in a far hamlet?** Nobody, Woodcutter, Exile and Hedge Mage by default (§1.1), or only Nobody, or a Start switch for every past?
2. **Locks: soft (places refuse you, the land stays open, §2.1) or hard (areas you cannot enter)?** I recommend soft.
3. **Which places are locked?** Towns, cities and castles as in §2.2, or only cities and castles?
4. **The numbers:** renown 10 for a town and 30 for a city about right? (For scale: Lord Aldric has renown 24 at the start. How fast you gain it is not measured yet; I would measure it in a play-through before fixing these.)
5. **Breaking in** (bribes, slipping in at night): in, or leave it out for now?
6. **Provinces on the map (G3):** wanted now, or later?
