# The story system: encounters, events, quests and everything that happens: design

Status: **approved** (the owner's answers, §8, 2026-10-20); building: **S0 and S1 built** (2026-10-20), **S2 and S3 built** (2026-10-21), **S5 built** (the frameworks only, 2026-10-21, §9). This is a **refactor first** design (the owner's rule): it changes how the code is organised, not how the game plays, and the new features (escort, chain quests, tournaments, new jobs, the small encounters) are then built on it.

## 1. The question: are they all the same thing?

**Mostly, yes.** Today the game has several systems that each grew their own way of doing the same steps:

| System | File | When it starts | What it is | How you act | How it ends |
|---|---|---|---|---|---|
| Road encounters | `world/encounters.js` | a pity timer while you travel | figures on the map | a page of choices | its lifetime, its end policy, a trace |
| Road events | `world/events.js` | a daily roll | instant | none: it just happens | at once |
| Quests (jobs) | `world/quests.js` | offers at holdings and lords | a task you carry | accept, then do it | done, reported, failed or due |
| Sites | `world/sites.js` | always there | a place | a page of choices | never (it is a place) |
| News and rumours | `world/news.js` | real events, by direct calls | records | asked at sources | they age out |
| Sealed letters | `world/letters.js` | robbing a messenger | an item with verbs | a page of choices | used or stale |
| *Planned:* escort, chain quests, tournaments, new jobs, small encounters, bandit raids | — | various | various | pages, tasks | various |

**They share the same anatomy:**
- a **kind** (what it is: data and behaviour);
- a **trigger** (when and where it may begin);
- an **instance** (its state, saved);
- a **presence** (how you notice it: figures, a mark, a page, a log line);
- **choices** (verbs, with their facts and odds);
- **outcomes** (what each choice does);
- a **lifetime** (how it ends);
- **links** (what it can start next).

They differ only in **shape**, how they appear and how long they live. So the design is: **one base, five shapes, many kinds, shared building blocks.**

## 2. The five shapes

| Shape | What it is | Lives | Ticks | Today / planned |
|---|---|---|---|---|
| **Encounter** | met on the map: figures, a behaviour, a page | hours | each frame, **only when near you** (the LOD tiers) | today's 24 road encounters; the small encounters; road bouts (tournaments §7); strays |
| **Incident** | befalls you: no one to meet, applies at once (a log line, maybe a popup) | an instant | never | today's road events (storm, fever, blizzard, mirage, wagon) |
| **Quest** | a task you carry: a goal, progress, a due day, a reward, where to report | days | **never per frame**: progress comes from world events (§3.6), the due day on the daily tick | today's 9 job kinds; the escort; the new jobs (named outlaw, guard the harvest, …) |
| **Gathering** | held at a place on set days, announced ahead, open to enter | days | the daily tick, from a calendar sorted by start day | tournaments (all four sizes); later fairs, festivals, market days |
| **Thread** | a story tying several happenings into steps, sharing what it knows | days to weeks | never: it advances when one of its steps ends | chain quests ("The Wounded Traveller"); Ander The Fallen; later story arcs |

**Places** (sites, a holding's places) are not happenings: they stay put and never end. They use the same **choices, outcomes and pages** (§3.4–3.5), so a ruin's Search and an encounter's Help are built the same way.

**Not in this system:** the world's own running situations (map fights, sieges, raids by lords, bandit raids). They stay world systems with their classes. They **emit world events** (§3.6), which happenings listen to, so the two meet without knowing each other.

## 3. The building blocks (shared, one file each)

### 3.1 Kinds: a registry

- **`defineKind(shape, id, spec)`** registers a kind once. `spec` holds:
  - the kind's data (numbers, names, weights);
  - optional hooks;
  - or a **subclass** of its shape when it needs real behaviour (the thief's chase, the shepherd's strays).
- **Most kinds stay plain data**, as most of today's `ROAD_ENC` rows are. Only the ones with their own behaviour become subclasses. No class for the sake of a class.
- **At load, the registry sorts the kinds by trigger** (§3.3), so a trigger only looks at the kinds it can start.

### 3.2 The context: computed once, read by everyone

**`storyCtx()`** is a snapshot made **once per trigger** (or once a frame for encounters):
- **where:** the tile, its terrain and climate, whose land, the nearest holding and its distance, road or wild;
- **when:** the day, the hour, night or day, later the season;
- **who:** your band's size and power, renown, honour, and skills through the existing accessors;
- **the weather.**

Every kind's conditions read it, instead of each calling `climAt`, `nearHold`, `tAt` again. It's cheap, and it's the one place to add a new fact (the season) for all of them.

### 3.3 The storyteller: when things happen

**One scheduler, with triggers:**

| Trigger | For |
|---|---|
| `travelHour` | encounters (the pity timer, kept as built) |
| `day` | incidents (the daily roll); gatherings (the calendar); quest due days and offer refresh |
| `enterHolding` | job offers; a gathering's welcome |
| `talk` | rumours (the sources and caps, as built) |
| a world event | a thread's next step; a quest's progress |

**It owns the shared rules, in one place:**
- weights;
- **cooldowns per kind** (a kind not again within N days);
- **caps** (per day, per source, per place);
- **pity timers**;
- "no overlap" rules (a road bout never near a holding's own tournament).

A kind only says *its* numbers.

**Its randomness:** a named stream of its own (§3.7).

### 3.4 Choices: one model for every verb

A **`Choice`** has:
- the verb and icon;
- `when` (shown or not);
- `need` (why it is greyed);
- `ask` (the confirm);
- `odds` (a stat-odds spec: the shared helper built 2026-10-19, with its Insight read);
- `run`, which returns an **Outcome** (§3.5).

Its **facts are written from its outcome and its odds**, never by hand, so what the button says is what it does.

**One `ChoicePage`** (on today's `PageScreen`) shows any happening or place: header, what you see, the choices, and `nav()` with Back left and the way out right (the frame rule). Kinds never build HTML.

### 3.5 Outcomes: what a choice does, declared

An **Outcome** is plain data, for example `{gold:+20, honor:[fac,-5], morale:-3, goods:{grain:3}, rep:[town,4], news:{k:'robbed'}, start:'quest:escort', end:true}`.
- **`applyOutcome(o, ctx)`** does it, through a small **handlers table**:
  - gold, goods, items, reputation, honour, renown, morale, XP, training, wounded;
  - a news record, a log line;
  - start a fight, start a chase;
  - start another happening, end this one.
- **`describeOutcome(o)`** writes its text ("+20 gold · honour −5"). It's the same object, so the facts and the effect can't drift apart.
- **A new effect** (a title, a trophy, a passenger) is **one new handler**; every kind can use it at once.

### 3.6 World events: a bus

- **`worldOn(type, fn)` / `worldEmit(type, data)`**, the world's twin of today's `battleOn`.
- **Emitted once, where things happen:**
  - a band destroyed; a beast killed; a site cleared; a lord beaten;
  - a holding raided, besieged or taken; a caravan beaten;
  - goods delivered; you arriving at a holding;
  - an encounter ended; a day passed.
- **Listened to by** quest progress, the news, threads' steps, and later trophies, achievements and the bandit raids' rumours.
- **What it removes:** the direct cross-calls of today, `questNotify(...)` (11 call sites in 4 files) and `newsRecord(...)` (12 call sites in 7 files). Fight, siege and site code then knows nothing of quests or news. A new listener (trophies: "first kill of each kind") needs **no edit** in the files that emit.

### 3.7 Randomness: named streams

- **`rngOf('story')`** (and `'road'`, `'quests'`, …): each is a small seeded PRNG of its own, seeded from the world's seed and its name, its state saved.
- **Why:** today almost everything draws from the shared `Math.random`, so **adding one encounter kind or changing one weight shifts the whole world's later randomness**. That's what moved the world and battle fingerprints on 2026-10-19 (the snow hares, the Woodcraft day). With the story systems on their own streams, **new content never changes the simulation**, and the fingerprints stay put.
- **The cost:** moving the existing story systems onto their streams changes the fingerprints **once**, as one deliberate step (§6, S4) with the reason written.

### 3.8 Saving

- **One store, `W.story`:**
  - `live` (the running happenings, as plain records `{k, id, v, …state}`);
  - `cd` (cooldowns);
  - `caps`;
  - `rng` (the streams' states);
  - `threads`.
- **On load:** each record is wrapped by its kind's class (by `k`, from the registry). A record whose kind no longer exists is dropped quietly, so a removed kind never breaks a save.
- **Fields evolve without migrations:** every kind declares its defaults, and loading merges `{...defaults, ...saved}`, the way new skills load at 0 today. That fits the owner's no-migration rule: nothing old needs converting, missing things just start fresh.

### 3.9 Presence: marks, pages, the log

- **A happening may have:**
  - `marker()`: a mark on the map and minimap (`{x, y, icon, col, tip}`);
  - `scene()`: figures, for encounters;
  - `page()`: what the ChoicePage shows;
  - `say()`: log lines.
- **One marker layer draws all of them:** today's waves and "!", quest marks, rumour "?", a gathering's banners. A new shape or kind gets its mark without touching the drawing code.

### 3.10 Lifetime

- **Ending by shape:**
  - encounters: today's end policies (leave, unseen, die; nothing ends in sight);
  - quests: their due day;
  - gatherings: their last day;
  - threads: when their last step ends.
- **When a happening ends, it emits `ended`.** That's how a thread knows to take its next step.

## 4. Performance

| Rule | Why |
|---|---|
| **Tick only what needs it:** encounters each frame only when near (the LOD tiers); quests, gatherings and threads never per frame (events and the daily tick) | the cost stays flat however many quests or gatherings are running |
| **Triggers look only at their own kinds** (sorted at load), with **cheap conditions first**: the kind's declared `where` (climate, terrain, land, road, near a holding) checked against the context in O(1), its own `ok()` only after | a roll over 50 kinds costs a few comparisons, not 50 map lookups |
| **The context once per trigger** (§3.2) | no repeated map queries |
| **Spot searches bounded** (today's tries), **sampled in a ring round you** | spawning never stalls |
| **A small spatial grid** (128 px cells) for positioned records (news items, live happenings, marks) once there are more than about 50 | "what is near here" stays cheap as the world fills |
| **No allocation in draw paths**; sprites cached per kind and variant (as today) | no garbage-collection stutter |
| **Saves compact:** no derived data saved, trimmed lists (news 60, cooldowns by day) | small saves, fast load |
| **Budget:** under 0.5 ms a frame with 20 live happenings; under 2 ms for the daily tick | checked by an INFO line in the tests |

## 5. Built to change little later

| When you add… | You touch |
|---|---|
| **a new encounter, incident, job or gathering kind** | **one entry** in its family's kinds file (data, or a small subclass). Nothing in the save, the UI, the scheduler, the marks, the news or the generic tests |
| **a new effect** (a title, a trophy, a passenger) | one outcome handler, with its text |
| **a new trigger** (something the world should announce) | one `worldEmit` where it happens |
| **a new listener** (trophies, achievements) | one `worldOn`, in its own file |
| **a new shape** (rare) | one subclass of `Happening` |

**Kinds never touch the page or the canvas directly;** they describe, and the shared parts draw. That's also what lets the same kinds work on phone and desktop layouts.

**Generic tests for free:** one test walks **every registered kind**:
1. spawns it in a fitting context;
2. lists its choices;
3. applies each with a stubbed stream;
4. checks that what the button said is what happened;
5. checks that it saves and loads, and that it ends cleanly.

A new kind is covered the day it's added (today's encounters suite already does part of this by hand).

## 6. The steps (refactor first: the game plays the same after each)

| Step | What | Size | Fingerprints |
|---|---|---|---|
| **S0** | Foundations: the bus (§3.6), the context (§3.2), Outcomes with their text (§3.5), Choices and the ChoicePage (§3.4); today's encounter choices expressed through them. **Built 2026-10-20** (§9) | M | unchanged |
| **S1** | The registry and `Happening` with the **Encounter** shape; today's encounters onto it (behaviours as small strategies: approach, stay, flee, walk, graze, bolt). **Built 2026-10-20** (§9) | M | unchanged |
| **S2** | **Incident** shape; today's road events onto it. **Built 2026-10-21** (§9) | S | unchanged |
| **S3** | **Quest** shape: today's 9 kinds as subclasses; progress through the bus (`questNotify` goes); the news listens on the bus (`newsRecord` calls go). **Built 2026-10-21** (§9) | M | unchanged |
| **S4** | **Named streams** for the story systems. **Built 2026-10-21** (§9) | S | **changed once**, re-recorded with the reason |
| **S5** | **Thread** and **Gathering** shapes (the frameworks only), ready for the features. **Built 2026-10-21** (§9) | M | unchanged |

**Then the features go on top:**
- the healed traveller's **escort** (a quest kind with a passenger outcome), **Ander The Fallen** and the **chain quests** (threads);
- **tournaments** (gatherings);
- the **new jobs** (quest kinds);
- the **small encounters** (encounter kinds);
- **trophies** (a bus listener);
- **bandit raids**: a world system that emits; quests and rumours listen.

## 7. With the class refactor (waves A–E)

This becomes the **story wave (S)**:
- it takes **quests** from wave B, **news and rumours** from wave C, and the encounter part of wave D;
- **letters** become an item kind with choices and outcomes (wave C).

**Proposed order:**
1. **S together with A** (characters and the player); they touch different files, so they can run in parallel.
2. Then B (holdings).
3. Then C (items, realms).
4. Then world Phase 2 wave 2.
5. Then D and E (places, battle).

S goes first because nearly every queued feature (escort, chains, tournaments, jobs, encounters, raids' rumours) is built on it.

**Wave A (characters and the player): built 2026-10-20**, in parallel with S1, behaviour-preserving: the world fingerprint (`worldprint -Seed 1`) and the five battle fingerprint suites unchanged, no re-records; saves byte-identical (the classes wrap the plain records, `P`, `P.comps`, the lords' and chieftains').
- **Characters** (`world/characters.js`): the loose functions are `Character` methods: `stats()` (was `charStats`; the formula is `base()`), `cls()` (`classOf`), `kit()` (`charKit`), `autoTree()`, `outfit()`, `meleeSkill()` (`meleeSkOf`), with `trained(k)`, `gearMod`, `treeMod`, `hasPerk`; `train` and `skill` kept.
- **Roles are classes**, one step under `Character` (no deeper): `Hero` (characters.js), `Companion` (companions.js), `Lord` and `Chieftain` (leaders.js). Each overrides only what differs (key, race, name, numbers, learning, `levelled`/`grew`/`rose`, `aiOwned`, `outfitWeapons`); `CHAR_ROLES` and the `role==='hero'` branches are gone; `charOf(o)` picks the class by the record (`charRole`).
- **Companions:** `Companion` has `inBand()`, `canLead()`, `partyCap()`, `equipment()`, `fits`, `equip`, `unequip`; `compOf(id)` gives it; the `comp…` names are aliases.
- **Leaders:** `Lord.won(foes)` (`lordWins`), `Chieftain.won(foes)` (`chiefWins`), `bounty()`, `holder()`; the pure record helpers (`bountyOf`, `chiefLabel`, `lordStats`, `lordSkill`, `lcapOf`) stay functions.
- **The player's numbers** are `PlayerParty` methods (`P`: your band and your hero's record at once): `headcount`, `cap`, `room`, `prisonCap`, `eatPerDay`, `sight`, `skill`, `treeMod`, `gearMod`, `hasPerk`, `roleBonus`, `heroStats`, `maxSP`, `maxMP`, `vitals`, `regenVitals`, `restoreVitals`…; the old global names (`skill`, `partyCap`, `tm`, `gm`, `has`, `vitals`…) are one-line aliases.
- **Left:** callers still use the old names (they move as files are touched); `lordSkill` and `lcapOf` could become `Lord` methods once every caller holds a real lord party.

**Wave B (holdings): built 2026-10-21**, behaviour-preserving: the world fingerprint (`worldprint -Seed 1`), the five battle fingerprint suites and `aishare` unchanged, no re-records; saves byte-identical (the classes and parts wrap the plain records: `Holding.saveRec`/`loadRec`, `t.lots`, `t.bld`, `t.stock`… as they were).
- **The holding's own** (`data/holdings.js` `Holding`): at war, `walled()`, `besiegers()` (`siegeLordsAt`), `besieged()`, `closed()` (`closedNow`), `defenders()` (`siegeDefenders`), `siegeLv()`, `garCap()` (`fiefCap`), `ruined()`, `fiefIncome()`; its people, `draft(n)` (`draftLocals`), `canDraft()`, `fleeReason()`, `refuge()`; its days, `setUp()` (`initHolding`), `landDay()` (territory.js's per-holding day), `refillGuards()` (`guardsDay`); and `estate(k)`.
- **Its parts** (composition, each kept aside in a `WeakMap`, never saved, working on the holding's plain fields): `t.econ`, an `Economy` (`world/economy.js`: `init`, `ensure`, `need(g)`, `target(g)`, `storeCap`, `food`, `foodNeed`, `foodDays`, `price(g)`, `state(g)`, `buyPrice`, `sellPrice`, `workerScale`, `produce(ly)`, `consume`, `spoil`, `grow(c)` (the people growing or starving, prosperity, volunteers: was `people`), `day(ly)`, `tax(rate)`, `buy`, `sell`, `lacking(mats)`, `take(mats)`, `sack(…)` (`sackStock`)); `t.buildings`, a `Buildings` (`world/estates.js`: estates' levels, walls and projects: `needsMet`, `total`, `canHave`, `cap`, `init`, `line`, `day` (the realm's building AI), `finish`, `burn(n)`, `breach`, `speed`, `days(lv)`, `progress`, `start(k, lv, at)`, `houseDone`, `house(at)`, `build(k, at)`, `demolish(l)`); `t.layout`, a `Layout` (`world/lots.js`: `add`, `drop`, `at(k)`, `centre`, `housing`, `full`, `spots`, `init`, `innerBox`, `wallBox`, `estateLot`, `sync`).
- **Estates** (`Estate`, `world/estates.js`, the map's world object, one per holding and kind: `estateOf(t, k)` / `t.estate(k)`; `estatePick` places it): `plots`, `plotsAt(lv)`, `fieldShare`, `fields` (`fieldsOf`), `sabotaged`, `sabotage`, `sabotageChance`, `guardsDown`, `nearWalls`, `guards` (`estateGuards`), `guardsBeaten`, `refillGuards`, and its day's work `produce(ws, clim, add)` (called from `Economy.produce`, in `MAKE`'s order).
- **Lots stay plain records:** a lot carries no behaviour of its own (`lotMid`, `lotTiles` are small helpers used on any box, a ghost's too), so there is no `Lot` class; the grid's own searches and resets (`lotFits`, `lotSpot`, `fieldsFor`, `occRebuild`, `lotsReset`, `roadsToGates`) stay functions of the grid (`tests/lots.js` stands in for `lotSpot`).
- **The systems** call the methods: `economy` (`econDay`: each `t.econ.day`, then the realms), `estates` (`estateDay`: each `t.buildings.day()`), `estate guards` (`t.refillGuards()`), `lands` (`landDay`: each `t.landDay()`), `refugees` (`t.fleeReason()`, `t.refuge()`).
- **The old names are one-line aliases** (`ensureEcon`, `foodDays`, `needOf`, `marketPrice`, `taxOf`, `people`, `produce`, `buyGoods`, `matsLacking`, `bldCap`, `initEstates`, `burnEstates`, `breach`, `estateGuards`, `guardsBeaten`, `guardsDay`, `sabotage`, `fieldsOf`, `bldSpots`, `lotAdd`, `lotDrop`, `lotAt`, `housing`, `housingFull`, `initLots`, `syncLots`, `startWork`, `buildHouse`, `demolish`, `walled`, `besieged`, `closedNow`, `siegeLv`, `ruined`, `fiefCap`, `fiefIncome`, `sackStock`, `fleeReason`, `refuge`, `draftLocals`, `initHolding`…); small readers used on any record stay functions (`bldLv`, `wallOf`, `garList`, `bldCost`, `takeFood`, `projectNeed`).
- **Proof:** a scratch probe run on the base (85dd3da) and the new code printed the same, line for line (336 lines, 1.72 million draws): at three seeds, 48 days of the world, each day's every system with its draws and every holding's state after it, and every holding query (prices, needs, food, taxes, the siege's numbers, flight, housing, each estate's cap, fields, guards and sabotage odds, the map's estates); a lord's siege, your siege, a raid in part and in full, a sack with burning and a breach, estates' guards beaten and sabotage, an estate burnt and wrecked (`estateWon`), a capture sacked and one taken in peace, your fief's orders (walls, estates, a house, pulling down) and trading; the world's save, a load and six days after it.
- **Found, kept as it was:** Chrome's `Array.prototype.sort` calls `estates.js`'s `want` comparator (it draws `Math.random`) in an order that changes with unrelated code (the base itself, with only a pass-through wrapper on `Math.random` for one day, drew 135 times there instead of 122), so the realm's building choices on later days are sensitive to any code change; the probe pins the sort to a plain merge sort in both trees. The fingerprints do not reach it. Also: `buildHouse` (now `Buildings.house`) never says "Builders start on a new house" nor answers true: a `//` comment in the middle of its line swallowed both; kept as it was, noted in the method. (Both fixed in S4, §9.)
- **Left:** callers still use the old names (UI, caravans, folk, sites…; they move as files are touched).

**Wave C (items and realms): built 2026-10-21**, behaviour-preserving: the world fingerprint (`worldprint -Seed 1`), the five battle fingerprint suites and `aishare` unchanged, no re-records; the bag's records and the save JSON byte-identical. A scratch probe run on the base (f7dafb1, after waves B and S5) and the new code printed the same, line for line (2,127 lines, 7.4 MB; `Array.prototype.sort` pinned to one stable merge sort in both, as wave B found): every item's name, stack, prices at three Trading levels, damage type, armour class, loot rank and line; the ring fingers; every holding's stable and who may buy there; four seeded bags (filled, sorted, every slot and worn key shown, every piece worn and held in the off hand, taken off, dropped, moved by drag and drop; your numbers); trade at five holdings, twice (the smith's, stable's and market's windows at two Trading levels, buying gear and mounts, selling every piece and trophy, goods); the loot pile (shown, taken, put back, all, left); letters in the bag and in a holding (sorted, shown, read, delivered, sold, dropped); every realm pair through the old names with and without a contract and hostility, peoples and seeded armies, honour, a chain of wars, an alliance and a fall; every deed (`CONDUCT`) at six holdings, ripples and the lords' feelings and their days; 90 seeded days of the whole world at three seeds (wars, peace, alliances, honour, hostility, the lords' feelings, a caravan attacked) with the save written, loaded and written again.
- **Items** (`core/items.js`): the item kinds, one object each over the data tables (which stay the data): `Gear` (`ITEMS`), `Mount` (a `Gear` for the mount slot), `Good` (`GOODS`), `Trophy` (`MATS`), `Letter`; `itemKind(rec)` gives a bag record's. Each knows its data entry, name and description, stack size, worth, price (a market's) and cost (yours), slot and stats, colour, its words (the bag's label, left behind, sold), its order in a sorted bag and on a loot pile, and its **verbs**: Choices read with the bag slot's index (gear: Equip, Off hand, Sell, Drop; trophies: Sell, Drop; a letter's page keeps `LETTER_VERBS`, its `pageVerbs`). The bag's buttons are greyed by the verbs' `need`, and Equip, Off hand, Drop and Sell run through them. Moved in: `itemDef`, `stackOf`, `sortInventory`'s order (inventory.js), `targetKey` (equipment.js), `itemDt`, `itemArmor` (matchups.js), `itemPrice`, `gearPrice`, `matPrice`, `stableStock`, `canBuyMount` (ui/town.js), `lootRank`, `lootDesc` (ui/loot.js), the bag's labels and drop line (ui/inventory.js); all stay as one-line aliases. The pure helpers `itemRank` and `kindLabel` stay functions.
- **Realms** (`world/realms.js`): `Realm`, over `FACS` and the saved maps (`W.rel`, `W.dead`, `P.honor`, `P.hostile` through its `Timed` view), never saved itself; `realmOf(fac)` gives it, `PlayerRealm` for your banner. Wars and peace (`relWith`, `atWar`, `enemies`, `setRel`, `fall`, and the day's diplomacy: `Realm.day`, each pair's `dayWith`, the first of `worldDay`), how it sees you (`honor`, `addHonor`, `hostility`, `hostile`, `provoke`: the "hostile for 20 days and honour lost" of attacking a caravan, a watch or a lord, `wronged`: a deed's realm part, from `wrong`), its holdings and lords (`fiefs`, `lords`, `races`, `army`). The lords' own feelings (you and each lord, lords with each other) are `Relations` (`world/relations.js`), and its `day` is the old `relDay`. The old names are aliases (`relOf`, `atWar`, `enemiesOf`, `fiefsOf`, `hostileTo`, `honorWith`, `addHonor`, `setRel`, `fallFaction`, `facRaces`, `armyOf`; `relWith`, `changeRel`, `rippleRel`, `lordRel`, `changeLordRel`, `lordFriends`, `lordRivals`, `lordHelps`, `lordSpares`, `relDay`), and `lordsOf` is new.
- **Left:** callers still use the old names; the trade window's rows and the bag's detail pane still write their own HTML from the kinds' words (no page of their own); the smith's and stable's Buy and the market's goods (`buyGoods`, `sellGoods`: wave B's economy) are not verbs yet; `siege.js` keeps its own copies of the "turn hostile" lines (wave B's file: `Realm.provoke` fits them); a holding's local standing (`repAt`, `addRep`, `standingAt`, `repNear`) stays with the holdings.

**Wave D (holding places and world services): built 2026-10-21**, behaviour-preserving: the world fingerprint (`worldprint -Seed 1`), the five battle fingerprint suites and `aishare` unchanged, no re-records; saves byte-identical (`t.watches` stays the holding's plain saved record).
- **Places** (`ui/town.js`): a `Place` base and its registry, `definePlace(id, spec)` (a `Place` subclass, or plain data with hooks), kept in `PLACES` in the rail's order. A place knows its name, short name and icon, `at(t)` (the holding has it: by default its kind's tabs), `rail` (on the rail or not), `opens(t)`, `item(t, tab)` (its rail entry) and `dot(t)`, `page(t)` (`shut(t)`, the closed line, else `body(t)`, through `railCards`/`railRow`/`railBtn` and `RailScreen`), its `verbs` (`{act: method}`; `act`, `handles`) and `focus` after the redraw. A verb that opens another window (a picker, a confirm, a talk, a battle, the siege camp) answers `Place.AWAY`; else the window redraws as before.
  - The twelve: `Market` (trade), `Tavern`, `Smithy` (its week's stock: `stock`), `Stable`, `Barracks` (recruit; its order form, quote and buttons: `orderForm`, `orderQuote`, `orderAct`), `Hall`, the notice board (jobs) and the walls (garrison) as plain entries, `Lists` (tourney), `Storehouse` (stores; its `st-` actions keep their own prefix), `Steward` (fief: every `fief-` order, `siege.js fiefAct`), `SiegeCamp` (siege: not on the rail, on the overview). The lists' Enter and the hall's Sign and End contract are `Choice`s (story/choice.js), greyed and done by the same `need`.
  - `renderTown` is the place's page or the overview (`townPlace`), `townAct` the place's verb or the window's own (`qty`, `tab`, `bld`); `townPlaces` is the registry's (`townui.js`), and `townTabs` (the streets', `scene/town.js`) asks `PLACES.fief`/`PLACES.siege` for its rule. The tournament's lists and the stadium will be one `definePlace` each.
- **World services:** `Watches` (`world/patrols.js`), a part of the holding kept aside as `t.watch` (`Watches.of(t)`, a `WeakMap`; `get watch` on `Holding`): `all()` (the two standing watches, `t.watches`), `out`, `power`, `send`, `back`, `refill`, `beat` (the waypoint), `beatenOff`; the service: `Watches.day()`, `Watches.frame(d)` (the change of the watch, its timer `Watches.check`), `meet`, `act`, `beaten`, `won`. `LandDefence` (`world/defence.js`): its state (`check`) and `isThreat`, `threats`, `canBeat`, `homeDist`, `huntable`, `prey`, `watchAt`, `lordAtHome`, `lordRides`, `lordDefended`, `lordDefends`, `look(d)`.
  - **Systems:** the parties' frame is split at its seams, same order and same early ends: `parties` (frame 100: companions, bands, lords, caravans), `patrols` (day 40 as before; frame 101: `Watches.frame`), `land defence` (102: `LandDefence.look`), `patrol moves` (103: the patrols' brains). `updatePatrols` and `updateParties` stay as the three (and four) in turn, for the tests; `tests/structure.js` pins the new frame order.
- **The old names are one-line aliases:** `hallBody`, `tourneyBody`, `storesBody`, `storesAct`, `siegeBody`, `smithStock`, `townRecruitControls`, `townRecruitQuote`, `townRecruitAction`, `shut`; `watchesOf`, `sendWatch`, `watchBack`, `patrolDay`, `patrolWaypoint`, `patrolMeet` (a function: tests stand in for it), `patrolAct`, `patrolBeaten`, `patrolWon`; `isThreat`, `threats`, `canBeat`, `homeDist`, `watchOut`, `watchPower`, `huntable`, `patrolPrey`, `watchAt`, `lordAtHome`, `lordRides`, `lordDefended`, `lordDefends`, `landDefence`. Small helpers stay functions (`patrolOf`, `watchNow`, `watchOf`, `watchName`, `crimeAt`, `patrolLand`, `forgeTiers`, `forgeText`, `questHere`, `compsHere`, `ransomValue`).
- **Proof:** a scratch probe run on the base (8b2e3a6) and the new code printed the same, line for line (8,055 lines, 121 MB; `Array.prototype.sort` pinned to one stable merge sort in both): at two seeds, six holdings (village, town, city, castle) in 13 states each (as it is, at war and hostile, yours, your employer's, a lord inside, sacked, raided, in turmoil, a quest to report, a companion in the tavern, staying, from the streets, hungry): the overview, every place's page on the rail and the siege, Steward, garrison, an unknown tab and home, your holding's buildings, the number keys, with the draws; every action at four holdings, yours and not (recruits and the order form, training, the broker, companions, lodgings, the contract both ways, a lord's talk, the smith, ammunition, the stable (a bad mount id throws as before), the market, selling, the stores, the garrison's orders, building, the notice board, an unknown act, the lists with and without the fee, the siege's confirm and plan): state, log, panel and focus after each; at three seeds 9,000 frames of the whole world (the watches, the patrols, the lords riding out), every holding's watches, sending and coming back, five days of watches, meeting the guards (peace, a crime paid, run from, fought, beaten), staged threats by six holdings' estates with lords at home and watches kept in, and a save, a load and 3,000 frames more.
- **Outside, noted:** the estate's areas (`world/estates.js` `estateMenus`, `showEstate`) and the sites' pages (`Site.page`) keep their own screens: their subject is the estate or the site, not a holding, and their areas are named by the estate's kind, so they would need a registry per screen (an `Area` beside `Place`); no clean fit yet. The places are rail pages, not `ChoicePage`s (their buttons sit on cards and rows; a `ChoicePage` would change the HTML). The notice board's `q-` actions stay `questAct` (input.js, before the town), the walls' orders the steward's `fief-`. Callers elsewhere still use the old names (`fights.js`, `realms.js`, `battle/encounters.js`).

**Wave E1 (battle terrain): built 2026-10-21**, behaviour-preserving: the world fingerprint (`worldprint -Seed 1`), the five battle fingerprint suites and `aishare` unchanged, no re-records; `groundhash` and `pixels` unchanged. `battle/terrain.js`'s 89 loose functions are classes (doc/TERRAIN_DESIGN.md §8, "Classes as built"):
- **`BattleTerrain`** is `B.terrain` itself (the same fields in the same order, so the art's `{...B.terrain}` and every test's reads are as they were): queries (`kindAt`, `levelAt`, `rulesAt`, `isWood`, `isWater`, `isDeep`, `coverAt`), movement (`speedFor` was `groundMul`, `runFor`, `climbOf`, `staminaFor`, `wadeFor`, `chargeFor`, `hitFor`, `heightEdge`, `flag`, `holdsBank`, `slope`, `slopeMul`), sight over the ground (`riseBlocked`, `blocksView`, `stopsMissile`), `update()` (the frame's `terrainStep`), `label`, the water, the built field's own (`index`, `markDeep`, `stands`, `layDense`, `fair`, `reachFair`, `openWay`) and its words (`describe`); statics read the world (`ofSite`, `recipeOf`, `edgesOf`, `riverOf`, `at`, `specFor`) and make one (`build`, `raster`, then `finish`).
- **Components:** `T.routes`, a `TerrainRoutes` (the guard, steering, a group's way, the captains' measures: `wayLen`, `nearLen`, `ride`), non-enumerable so no spread or JSON sees it; `B.sight` (= `T.sight`), a `BattleSight` (`step`, `reckon`, `struckBy`, `goalFor`, `ambushFor`; `seen`, `foes`, `lastSeen`), with fog and no terrain too. The planners: `FieldPlan` (layouts, dense woods, edges, cliffs and rock), `BattleRiver` (a river's plain record; `half` and `kinds` are World Phase 2's slots for the width and the world's crossings), `FieldWays` (roads and paths). The captains' reading of the ground stays in `commander.js` (E2).
- **Stayed functions:** the pure helpers (`tIx`, `groundHome`, `groundSpd`, `unitSkill`, `routeWho`, `groupWho`, `fieldScale`, `terrainZone`, `zOut`…, `groundEnv`). **The old names are 81 one-line aliases**, each declared as it was (`tests/roads.js` wraps `wayPlan`, so `layDense` calls it by that name).
- **World Phase 2 slots in** at `BattleTerrain.riverOf` (BattleSite's river and crossing), `BattleRiver.half` (3, 5 or 8 cells), `BattleRiver.kinds` (the world's bridge, fords only, the ferry's ford), `FieldPlan#planFeatures` (BattleSite's `high`), `BattleTerrain#slopeMul` (a steep hill's climb, with `runFor`, `staminaFor`, `chargeFor`) and `routeGridOf` under `TerrainRoutes#build`.
- **Proof, terrain on** (the older suites run with `TERRAIN` off): a scratch probe run on the base (8b2e3a6) and the new code printed the same, line for line (8,435 lines, 1.1 MB; `Array.prototype.sort` pinned to one stable merge sort in both): 620 generated fields (every recipe and layout, two seeds, rivers with a road bridge, plain, frozen and a stream, a held bridge with its ford, frost, crags, roads both ways, edges of every kind, an oasis; three field sizes, a sized one with its zones), two lab grounds of their own (cliffs, a one-way hill, ramps, rock, two rivers, a road) and two ambush fields: each field's own keys in order, its grids, walls, rock, roads, route grids, the AI's reading, recipe, words and fairness; the world's specs at 1,026 tiles, the recipe, `groundSpecFor`, the panel's words five ways (party, monster, a held bridge, an ambush, a siege) and `coverAt` at 70 spots; 16 seeded lab battles with the ground on, AI on both sides, fog on in 9 and off in 7, physics on in 5 (open, forest, frosty hills, swamp, desert, a river with a bridge, *Hold the bridge*, two ambushes, crags, a pass, spires, the lab's cliffs and river, elven woods, a large frozen river, a fen with a stream; 13 fought out): each second every soldier's place, health, hiding, last-seen marks, ground, level, range, momentum and crossing, each group's place, order and way, both sides' sight sets, the ambush marks, and the Math.random draws (406,916 in all, the same count each second); every 30 s and at the end, at 60 to 176 points for every kind of soldier on the field, the ground, speed, momentum, stamina and climb eight ways, charge, blow, height, bank, wading, the flags, steering, a barred way, the crossing, missiles stopped in woods, the view, rises, deep water, the river's span, the way's length for foot, riders and the big, reach, a near way and riders' way through woods, each group's label, and 18 routed paths; four seeded battle screenshots (crags, forest, desert spires, an ambush; the clock frozen while drawing) pixel for pixel.
- **Left:** callers still use the old names (E2: the commander and the AI; E3: combat and the soldiers move onto the methods as they are touched).

**Wave E2 (the commanders and the AI): built 2026-10-21**, behaviour-preserving: the world fingerprint (`worldprint -Seed 1`), the five battle fingerprint suites and `aishare` unchanged, no re-records. The loose functions of `battle/commander.js`, `charmind.js` and `beastmind.js` are classes; they act on the groups only through each group's `BattleControl`, as before:
- **`Commander`** (commander.js): one for each side the AI commands, by its key (`Commander.of(ck)`: the enemy's 1, your army's 0, your allies' `'ally'`), kept with the battle. It holds nothing but its key: its state is still the memory `B.captains[ck]` (`captainMem`; the getter `Q` makes it, made only when first needed as before, and `mem` reads it without making it), with the same fields (`post`, `plan`, `idle`, `vol`, `commit`, `rmode`, `temper`, `seen`, `take`, `hold`, `files`, `lineT`, `beast`). The groups' notes (`g.phase`, `g.t`, `AI_NOTES`) stay on the groups. The think: `Commander.command(dt)` (was `command`: the powers, then each captain's `think()` every `FOE_CMD.think` s) runs `orders()` (was `captain`), then `finish(N)` (was `captainFinish`: each group's pace, formation and front).
  - Its reading: `assess()`, `groups()`, `read(Q, S, N, post)` (was `captainCtx`; a think's reading stays a plain object, now carrying `ck`), `T` (its temperament's entry), `gt(k)` (was `gtun`), `ground()` (was `groundAI`), `temperFor()`.
  - Its decisions: `posture(S)`; `rangedMode(...)` (the shooters' lead); the arms `infantry`, `rally`, `shooters`, `cavalry` and `hero` (charges, Brace, Fire arrows, Spur, hunts, kiting); `scout(N, S)` (Scout ahead); `search(N)`; the battle types `typePost`, `typeHolds`, `typeRush` and `take(c)` (was `typeTake`); the withdrawal, `fallsBack` and `fallBack`.
- **Strategies, where they remove branching:**
  - `EnemyCommander` (key 1) overrides `announce` (its style told: `TEMPER_SAY`), `fallsBack` (a beaten army falls back as one: `beatenArmy`) and `leadOf` (your hero, its mark). The `team===1&&key==null`, `ck===1` and `team?` branches are gone.
  - The temperaments and race styles had no branches to remove: they stay multipliers read through `tun`, with no class.
  - Characters: `CharacterMind` (charmind.js; `CharacterMind.of(u)`, one for each character, holding only its man) with `HeroMind` (your hero's hands: combat.js's timers, swing, bow, shove, dodge and skills) and `ChampionMind` (a lord's, chieftain's or companion's: its state `u.ch`, its combo, loose, shove and roll). The `u.hero ? ... : ...` branches are now the two classes' overrides. Shared: `auto`, `strike`, `basics`, the fall back (`fallSpot`, `fallStep`, `fallMark`, `fallSafe`, `fallLook`), `command`, `duel`, and `CharacterMind.command(dt)` (was `commandCharacters`).
  - Beasts: `PackMind` (beastmind.js), a captain's mind over its beasts for one think. It was `beastCtx`'s object: `L`, `M`, `mine`, `packs`, `n`; `byKey`, `reach`, `nearest`, `mark`, `circle`, `join`, `bite`, `cover`, `dread`; statics `think` (was `captainBeasts`), `tick`, `go`, `grips`. The ways stay the strategy table `BEAST_WAYS` (pack, rush, brute, ambush, swoop, blob), one function per way, each handed the PackMind.
- **Stayed data or functions:**
  - The tables, as they were: `FOE_CMD`, `UNIT_AI`, `AI_TACTICS`, `TEMPERAMENT`, `TEMPER_SAY`, `TERRAIN_AI`, `TERRAIN_TEMPER`, `CAPT`, `HUNT`, `CHAR_AI`, `CHAMP`, `CHAR_FALL`, `BEAST_TACTICS`.
  - The pure helpers: `tun`, `holdsGround`, `lvlOf`, `wetK`, `wadesDeep`, `crossingOf`, `wayVia`, `dryOf`, `woodAround`, `grpSta`, `centroid`, `reachOf`, `runFor`, `beatenArmy`, `huntSafe`, `huntSpot`, `fireWorth`, `segDist`, `kiteFrom`, `wOf`, `captainMem`, `foesKnown`, `acrossRiver`; `isFighter`, `isChar`, `champLv`, `breath`, `champFoes`, `ordKey`, `fallMates`, `liveFoes`, `aiCommands`; `beastNum`, `beastKind`, `beastsOf`, `beastPacks`, `hpOf`, `atGrips`, `awayFrom`.
- **The old names are 55 one-line aliases** (23 in commander.js, 21 in charmind.js, 11 in beastmind.js), each declared as it was. Four are called by name, because tests stand in for them: `command` (tests/aishare.js), `posture` (rts.js), `beatenArmy` (battlejuice.js) and `captainBeasts` (beastai.js wraps it).
- **Proof:** a scratch probe printed the same, line for line, on the base (e53fe0a, and again on b2414ef) and on the new code: 3,135 lines, 388 KB, with `Array.prototype.sort` pinned to one stable merge sort in both. It ran 42 seeded battles, AI on both sides, each also run long (morale off, the armies 520 px apart):
  - every temperament and race style (human, dwarf, elf, orc, mixed);
  - beasts and packs (wolves, boars, bears, trolls, griffins, slimes, spiders, scorpions, a tiger, a dragon, a wyrm);
  - characters falling back (your hero and companions on both sides);
  - scouts using Scout ahead;
  - an allies' captain beside groups you handed the AI;
  - a bridge held by either side (and taken), and an ambush;
  - a beaten enemy falling back, and your army under the AI beaten;
  - three real battles (an allied lord, your companions, an enemy lord; Auto for all, or for one group);
  - terrain on (open, forest, frosty hills, cliffs with a river, elven woods, crags, swamp, desert) and off; fog on and off; physics on and off.

  Each second it printed every soldier's state (place, health, rout, target, cooldown, stamina, run, the character's state), every group's (its order, place, form, flags, target, waypoints, phase and every AI note, ability, way, morale), the captains' memories, the `Math.random` draws (816,758 in all), and every order given to a group (60,682, hashed each second, with counts by order, ability and flag at the end: Brace, Rally, Fire arrows, Spur, Scout ahead, withdrawals and 41 character fall-backs among them). Sieges have no branch of their own in the captains' code.
- **Left:** callers still use the old names: battle.js (`command`, `commandCharacters`, `charAuto`), actors.js (`charAuto`, `charStrike`), abilities.js, fatigue.js and battlehud.js (`champ`, `aimAt`). E3 moves them as its files are touched.

## 8. The owner's answers (2026-10-20)

1. **Names:** yes: the story system, with encounters, incidents, quests, gatherings and threads.
2. **Named streams (S4):** accepted: one deliberate fingerprint re-record, so new content never shifts the world again.
3. **Tests for the refactor steps:** the fingerprints plus each area's suites (no full sweep).
4. **Order:** this wave first. A core wave (the systems registry, clock, timed states, event bus, save registry, spatial helper, stream helper, test kit) is proposed to come just before it: see [CORE_DESIGN.md](CORE_DESIGN.md) once written.

## 9. Status

**S0 (built 2026-10-20), behaviour-preserving:** the world fingerprint (`worldprint -Seed 1`) and the five battle fingerprint suites unchanged, no re-records; the encounters suite's seeded runs (12, 3) print the very same lines; a scratch probe run on the old code and the new (every road choice in 3 Insight levels and 2 seeds: its page, its confirm, what it did, the draws; the kinds' conditions at 4,600 spots and hours; the spot rules on 8,400 tiles; 120 picks; a long seeded journey; the sealed letter's verbs in the bag and in holdings; the shrine) printed the same, line for line.
- **The context** (`js/story/context.js`): `storyCtx()`, a `StoryContext` (where: worked out once when first read; when and who: read live; the weather); one a frame inside `Story.frame` (the road's moment, `updateRoad`), fresh outside; `Story.at(tx, ty)` for a tile. The road's 24 kinds' `ok(c)` read it (`roadPick` passes one for the whole roll), the chance its `landKind`, and the spot rules (`ENC_ON`) a tile's. `roadLand` is its alias.
- **Outcomes** (`js/story/outcome.js`): `Outcome.apply` (`applyOutcome`), `Outcome.facts` / `describeOutcome`, 27 handlers (gold, food, goods, gear, troops, lose, wounded, rep, honor, renown, morale, xp, train, sp, hours, vitals, mood, wrong, log, news, fight, chase, end, gone, start, band, call), applied in the order the keys are written, none drawing Math.random.
- **Choices** (`js/story/choice.js`): `Choice` (when, need, ask, again, odds, out or run, facts) and the one `ChoicePage` (`CHOICE_PAGE`, on `PageScreen`: header, what you see, the choices, `nav()` with Back left and the way out right; its confirm).
- **On them:** every road encounter's choices (`ROAD_ENC[k].acts` are Choices; `showRoad`, `roadAct`); the sealed letter's verbs (`LETTER_VERBS`, `letterPage`, `letterAct`); the shrine's page (`SHRINE_CHOICES`).
  - Declared outcomes (`out`): 33 choices of 19 kinds (the traveller's Take his purse; the lure's Approach ready and Fight them; the peddler; the pilgrims' Pray, alms and coins; the deserters; the hunters; the child; the bard; the caravan; the ambush; the refugees' Escort and food; the warning; the cart in the mud; the thief's Chase, Return, Keep; the poacher; the funeral; the wedding; the beggar; the messenger's Rob), the letter's Sell, Deliver and Burn, the shrine's Pray and Offer.
  - Hooks kept (a roll, a chase, their own state), returning outcomes for their plain part: the traveller's Tend (his care and gift), the lure's Tend and Take (the ambush springs) and Call them out (the scare roll), the gamblers' hands, the mine's search, the wisps, the pilgrims' Walk and pray (the hour first), the horse's catch; plain lines: Ask for news, Ask why they fled, the sheep's Round them up, the messenger's Read the news, the letter's Break the seal.
- **The bus:** one new event, `encounter:ended` (`{e}`, from `RoadEncounter.over`); nobody listens yet.
- **Facts kept by hand** (no visible change): 29 road choices, the letter's 4 verbs and the shrine's 2 say other words than their outcomes would (missing numbers, `honor`/`honour`, a cost written `15 gold` for `−15 gold`, the order, extra hints such as "Charisma helps"); `tests/story.js` lists them (INFO) for the owner. Written from the outcome already, the same words as before: the pilgrims' Take the coins, the ambush's Cut the baggage loose, the refugees' Give food, the warning's Listen.

**S1 (built 2026-10-20), behaviour-preserving but for the agreed fact wording:** the world fingerprint (`worldprint -Seed 1`) and the five battle fingerprint suites unchanged, no re-records; a scratch probe run on S0's code and S1's (every road kind's life three ways, walked up to, watched while its time ran out and passed close by, at two seeds, its pages and choices; every choice of every kind at Scouting 0, 3 and 5 and two seeds, its page, confirm, result, state and draws; 160 picks and rolls at random spots; two long seeded journeys on the full world loop with their encounters met and chosen; the road's save and load: 4,578 lines, about 1.06 million draws) printed the same, line for line, but for the buttons' facts and the one word honor/honour in the robbing result line.
- **The registry** (`js/story/kinds.js`): `defineKind(shape, id, spec)` / `defineKinds`, `kindOf`, `Kinds.all`; the triggers' buckets built at load (`Kinds.on`, `Kinds.view`). The road's 24 kinds are Encounter kinds with the trigger `travelHour` (`roadPick` reads its bucket, in the same order); the traces (`ROAD_TRACE`) and the stray (`ROAD_PART`) are Encounter kinds with no trigger. `ROAD_ENC` is the bucket's view, for the tests and the wiki.
- **`Happening` and the Encounter shape** (`js/story/happening.js`): `Happening` (a `WorldObject`: `id` (the record's `i`), `k`, `kind`, `marker()`, `page()`, `say()`, `ends`, `announceEnd()`, `save()`, `Happening.as` / `Happening.load`: its kind's class put on the record in place, its kind's `defaults` filled in, a record whose kind is gone dropped). `Encounter extends Happening` took over `RoadEncounter` (its moment `step`, `over`, `goOff`, `timeUp`, `drop`, `off`, `arrive`, the page as `page()`, the "!" as `marker()`); `RoadEncounter` and `asRoadEnc` stay as its names. `W.road`'s saved record is byte-identical.
- **Behaviours as strategies** (`Behaviours`, chosen by the record's `beh`): `approach`, `stay`, `scene`, `flee`, `walk`, `leave`, `bolt`, `graze`, and the `chase` (while `e.chase` is set). Each `step(e, m)`, and where it has them `ends` (what `ENC_END` said: stay and scene leave, graze unseen), `due` (its time up: one coming to you turns away) and `settle` (dealt with or left be: it goes on its way; the old `roadDone`). `ENC_END` and `roadEnds` are gone into them.
- **Subclasses only where a kind has behaviour of its own:** the strayed sheep's `Shepherd` (scatters his strays, counts them home, thanks you once) and `Stray` (met or ridden into, sent home; its end tells the shepherd), in `world/encounters.js` (`cls`). Every other kind stays plain data with hooks (the thief's chase is the shared `chase` behaviour; the horse's catch a choice's hook).
- **Facts written from outcomes** (owner, 2026-10-20): every choice that declares its outcome (33 on the road, the letter's Sell, Deliver and Burn, the shrine's Pray and Offer) has its facts written from it: exact signed numbers, the place named, costs shown, one spelling, honour (the outcome's `wrong` text and its cost line in `world/conduct.js` too). By hand, after them (`also`), only the lines no outcome can say: the lure's "no ambush: they lose their edge" and its bandits and odds, the ambush's "caught in their trap", the caravan's raiders, the refugees' "safe passage", the thief's "Agility and Riding help", the stats that help (`statHelps`: the hunt, the cart, the funeral, the wedding), the messenger's sealed letter, the letter's "they know you robbed the rider" and "it is gone". The hooks keep their words by hand; the lure's Take his purse shows the real traveller's; the pilgrims' Walk and pray writes its own from its outcome.
- **Generic tests:** `tests/kinds.js` walks every registered Encounter kind (28): a fitting context, its choices, each declared outcome shown pure, done with the dice stubbed and measured against `describeOutcome`, its facts from it; its record saved and loaded; its clean end. `tests/story.js` checks the facts of the letter's and the shrine's too, and lists the lines kept by hand (INFO).

**S2 and S3 (built 2026-10-21), behaviour-preserving:** the world fingerprint (`worldprint -Seed 1`), the five battle fingerprint suites and `aishare` unchanged, no re-records; saved quests (`P.quests`, `P.jobs`) byte-identical. A scratch probe run on the base (11fae65) and the new code printed the same, line for line (1,659 lines): every road event alone at three climates, every race, four seeds (each branch of its run, its line and tone, the draws); 400 seeded rolls (five spots, four races, 20 seeds each); 120 days of the daily systems at four spots; at three seeds, every holding's offers, 80 offers made by kind and holding and 36 by lords (records and draws), and a life of every kind: taken, its target spawned, its goal and progress, done by its deed (a band beaten in a fight and by giving up, a beast, a camp or cave cleared and a lair given up, a lord beaten and yielding, a village raided in full and in part), reported at the holding and to the lord, handed over (supply, hides, meat, troops), paid on arrival (courier), failed by its due day (a holding's and a lord's), abandoned, the limit, the panels' HTML, saved and loaded; and the news: 30 seeded days of the world at two seeds (sieges laid, broken, holdings taken, lords routed, caravans taken, map battles, threats on the land), then each hook called (an estate burnt, a caravan robbed, raids, a lord beaten while besieging, two sieges resolved, a lord and a caravan routed, a trace dropped, the land's watch), and a tavern's rumours.
- **The Incident shape** (`js/story/incident.js`): `Incident extends Happening`; `Incident.pick(kinds, c)` (of those whose `ok(c)` holds, one by weight: the one draw, as before) and `Incident.befall(kind, c)` (its record `{k}` made one, its `run(c)` done: an outcome applied, or a line logged; then `incident:ended`). The road events (`world/events.js`) are its six kinds, plain data registered with the trigger `day`; `EVENTS` is the bucket (`Kinds.on('incident','day')`, the tests' and the wiki's list); their `ok(c)` read the context (its `climate`); each `run` returns an outcome (`gold`, `food`, `morale`, its `log` line and tone; the race checks and the mirage's roll first). `roadEvent` (the system `road events`, day order 230) rolls through it, the same draws in the same order.
- **The Quest shape** (`js/story/quest.js`): `Quest extends Happening`; its record is the old one (`type` names its kind: `Happening.kindId`, which a shape may override; `id` is the record's own field, as is a troops job's `tier`), the class put on it in place when made or used (`Quest.as`), so a quest from a save or a test is one at once. Shared: `make` (the offer), `pays` (the reward), `accept`, `goal` (home once done or for a hand-over, else `seek()`), `progress`/`todo`, `ready`, `finish`, `pay`, `turnIn`, `reportableAt`, `fail`, `lapse`, and `quest:ended` when paid or failed. The nine kinds are subclasses in `world/quests.js` (`BountyQuest`, `BeastQuest`, `ClearQuest`, `SupplyQuest`, `HuntQuest`, `CourierQuest`, `TroopsQuest`, `LordkillQuest`, `RaidQuest`), registered with `defineKinds('quest', …)`, each its own setup (the old `makeQuest` branch), begin (the old `acceptQuest` branch), target, deed, readiness, progress and hand-over: every `if(type==='…')` branch is gone. `makeQuest`, `acceptQuest`, `questGoal`, `questReady`, `questProgress`, `payQuest`, `turnIn`, `canReportAt`, `failQuest`, `questDay`, `questArrive` stay as its names.
- **The world events bus** (`core/bus.js`, its header lists them: name, data, where emitted, who hears): `questNotify` is gone; the five deeds are `band:beaten`, `monster:slain`, `site:cleared`, `lord:beaten`, `holding:razed` (a raid to the ground), emitted where the old calls were (battle/encounters.js 5, battle/parley.js 4, world/realms.js 1, world/siege.js 1); each kind names its `deed` and decides in `hits(d)` whether it is its own (`Quest.listen`). The hooks' `newsRecord` calls are gone too: `siege:laid` (brains.js), `siege:broken` (realms.js twice, fights.js), `holding:taken`, `lord:routed` (realms.js, fights.js), `holding:raided` (siege.js), `estate:burnt` (estates.js), `caravan:robbed` (caravans.js), `caravan:beaten` and `fight:ended` (fights.js; the old `newsFight` call), `trace:left` (story/happening.js), `land:threat` (defence.js; the old `newsThreat` call); `world/news.js` listens (`NEWS_HEARS`) and records each exactly as before (`newsRecord`, `newsFight`, `newsThreat` stay: the news's own and the tests'). The listeners run at once, in order, at the very moment of the old calls, so every effect comes in the same order. One raid is two events because the news and the quest came at two moments: `holding:raided` (any raid; the news) and then, after its log line, `holding:razed` (to the ground; the quest).
- **Generic tests:** `tests/kinds.js` walks every Incident kind (a fitting spot, every race, both ways of a roll: what it did is what `describeOutcome` says, its line and tone, its end announced once) and every Quest kind (offered somewhere, taken, saved and loaded byte-identical and its class again, done by its own deed on the bus and not by another's, reported and paid, failed on its due day, `quest:ended` once).
- **Natural listeners now (not built, no gameplay added):** the "Quest done" and "Quest complete" log lines could listen to a `quest:done` / `quest:ended` instead of being written in `finish` and `pay`; the "is routed near" and "lays siege to" log lines (fights.js, brains.js) and the HUD's refresh after a deed could hear `lord:routed` and `siege:laid`; the companions' moods (`mood('cruel')` on `estate:burnt`, `mood('ransom')` on a yield) are reactions to deeds; the reputation change near a band given up (`repNear`, parley.js) is the land's reaction to `band:beaten`; trophies and the bandit raids' rumours (§6) are new listeners with no edit to the emitters.

**S5 (built 2026-10-21), the frameworks only, no new gameplay:** the game registers **no thread and no gathering kind**, so it plays the same: the world fingerprint (`worldprint -Seed 1`), the five battle fingerprint suites and `aishare` unchanged, no re-records; no save key and no day order moved (the two new keys are saved only once they hold anything, and come last; the new day system is last of the day and does nothing while there are no gathering kinds, never creating `W.story`).
- **The Thread shape** (`js/story/thread.js`): `Thread extends Happening`, a story of steps sharing a **memory** (a small saved blackboard). Its kind is data, `defineKind('thread', id, {n, steps, first})`; **a step**: `{id, start, until, how, remember, then}`:
  - `start`, one of the **starters** (`Thread.starters`, a small table like the outcome handlers): `{quest: kind, town, lord}` (a job offered at the town, by default the memory's, and taken), `{encounter: kind, x, y}` (one on the road there; none: a spot of its ground ahead of you), `{incident: kind}` (befalls you, over at once: `how` 'over'), `{page: {ico, title, text, choices}}` (a `ChoicePage` of Choices, each with its `how`); any field may be a function of the thread (`th=>th.memory.town`); none: the step only waits;
  - `until`: the bus event that ends it (`'quest:ended'`, or `{on, match(d, th)}`); none: the end of what it began, matched by its shape and id;
  - `how(d, th)`: the key to branch by (none: the event's own `how`);
  - `remember(d, th)`: merged into the memory;
  - `then`: the next step's id, or `{how: id}` a branch by outcome (a key not there, or null: the thread ends).
  It advances **only on bus events** (`Thread.heard`: each event a step waits for is listened to once, when first needed, so nothing listens while no thread runs), never per frame. Begun by `Thread.start(id, memory)` or an outcome (**`start: {thread, memory}`**, the `start` handler extended; its fact "then: <its name>"). It ends when its last step ends: **`thread:ended`** `{e, how}`. Record: `{k, i, day, at, wait {shape, id}, memory, past [[step, how]…]}`. A page step shows when you are free on the map (`thr-` actions, `G.mode` 'story'; no way out till chosen; **`page:chosen`** `{e, how}` on the bus), else waits in `Thread.paged()` for whatever opens it later (the first feature decides: on arriving at a holding, …).
- **The ends now say how:** `Happening.announceEnd(how)` (`endEvent`: '<shape>:ended'); `quest:ended` `{e, how: 'paid' | 'failed'}`, `encounter:ended` `{e, how: 'done' | 'left'}` (dealt with, or left be); the incident's as before.
- **The Gathering shape** (`js/story/gathering.js`): `Gathering extends Happening`, held at a place on set days, announced ahead. Its kind: `{n, ico, text, places(), schedule, announce, lasts, fee, choices}`; **`schedule`**: `{every: N}` (at each place every N days, on its own offset: `Rng.seedOf('gathering:'+kind+':'+place) % N`, a hash of the world's seed, no draw from any stream) or `{day: D}` (that day of the year, `CLOCK.year` 120 days: `Clock.dayOfYear(d)`, which now takes a day). Record: `{k, i, at, open, close (open + lasts), st ('planned' → 'announced' → 'open'), due (its next change's day), entrants}`.
  - **The calendar** (`W.story.gatherings` `{n, on}`): every coming one **sorted by its due day** (then its number; filed by a binary search), so **the day's check reads only its head**: O(1) while nothing is due (about 0.1 µs). The system **`gatherings`** (day order **240**, after `road events` 230: last, so no other system moves). Planned once per calendar (and again when kinds are added): each kind at each place, the first told of from tomorrow on; once one closes, the next at that place is planned.
  - **The bus:** `gathering:announced` (N days ahead: `{e, at, day}` the place and the day it opens, for the rumours and notices), `gathering:opened`, `gathering:closed` (its end, `endEvent`).
  - `entrants`, `enter(who)` (while announced or open, once each); **its page** (`page()`, `show()`; `gth-` actions): its name, place, when, who entered, and its choices (the kind's own; none: **Enter**, its fee as the outcome `{gold: −fee}`); Leave goes back where you were. `Gathering.at(place)`: those coming there.
- **Saving:** **`W.story`** (`storyW()`, made with the first thing in it), two registry pieces, each saved only once it holds anything (as `road` and `news`): **`threads`** (order 250: `{n, on}`, once one has begun) and **`gatherings`** (order 260: `{n, on}`, once one is planned). Loaded, each record is wrapped by its kind's class; one whose kind is gone is dropped; a thread's events are listened to again, the calendar filed in order again.
- **The test kinds, only in the tests** (`tests/kit.js` `Kit.storyKinds`): a thread (`test_thread`: a supply job at the memory's town; paid, it remembers the giver and meets a wandering merchant where its memory says; failed, a page of two choices) and a gathering (`test_fair`: the first three holdings, every 12 days, told of 3 days ahead, open 2, a fee of 10). `tests/threads.js` walks them for real (an outcome starts the thread, its job paid or failed, saved and loaded at each step, its encounter met, its page chosen; the gathering's 40 days against its schedule, its order, saved and loaded midway, entered); `tests/kinds.js` gives **every registered thread and gathering kind** the generic checks (the steps hold together; every way through answered on the bus, another's event ignored, saved and loaded at each step, ended once; a year of the calendar on schedule and in order, saved midway; its page entered once). `tests/structure.js`: the day's order ends with `gatherings`; the save's tail may hold `threads` and `gatherings`.
- **For the features on top:** the escort and the chain quests (`doc/IMPLEMENTATION_PLAN.md` §10.7–10.8) are thread kinds (a passenger is one more outcome handler; "go to" a step waiting for an arrival event); the tournaments (`doc/TOURNAMENTS_DESIGN.md`) are gathering kinds (their places, cadences, the Grand Tournament's `{day: 90}`; the lists' page and the bracket their own choices and state).

**S4 (built 2026-10-21), the one fingerprint re-record (owner accepted, §8):** the story and the content that gets tuned often draw from named streams (`core/rng.js`, §3.7), so **adding a kind or changing a weight never moves the world's randomness again**.
- **The streams**, each seeded from the world's seed (a generated world's `seedNum`, the classic map's one fixed number), **the game's number** and its name (`Rng.seedOf`). The game's number (`Rng.game`) is one draw of Math.random as a new game begins (`Rng.newGame`, session.js `startGame`, before the wild game is placed), wherever the game's content stands, so every new game on the same world has its own wild game, beasts and encounters, a seeded begin (the tests') gives the same ones, and adding content still never moves the world's Math.random. The gatherings' offsets (`Rng.seedOf('gathering:…')`) follow it too:
  - `road`: the encounters (`world/encounters.js`, `story/happening.js`): the hour's roll and the pity timer (and its cut when one is passed by), the kind, its spot, its time, race and seed, every setup (the shepherd's strays, the lure's band, the merchant's piece, the purses, the mourners, the thief's run, the pilgrims, the horse's bolt, the messenger's realm), the procession's stay at its shrine, and the choices' rolls (`Choice.roll`, the scare, the tend's gift, the mine's gear and cave-in, the horse's catch, the messenger's news);
  - `letters`: the sealed letter (`world/letters.js`: its sender's holding, its kind, its lord or realm, its days and worth; the witness roll);
  - `incidents`: the day's roll for a road event, its kind (`Incident.pick`) and the mirage;
  - `quests`: the job offers (`jobsAt`, `lordJob`: the kind), every kind's setup, `spotNear`, the beast hunt's level (`monLevel(r)`), the bounty's band and chief;
  - `critters`: the wild game (`spawnCritter`, the day's spawning and regrowth, its grazing and wandering, the hunt's kills and hides) and the herds (`spawnHerd`: their kind and place);
  - `monsters`: the beasts (`spawnMonster`, the day's spawning, their level, their wandering, the mythic ones' lairs, roaming and scorching, the loot and the hoard).
  The news and rumours, the threads and the gatherings draw nothing. **Shared helpers** a content system calls (`makeEnemies`, `randomGear`, `newChief`) draw from its stream through `Rng.use(name, fn)` (Math.random taken from the stream while fn runs). Each stream's draws are one for one the old ones, in the old order.
- **Left on Math.random:** the world's simulation and the battles: the parties' brains (lords, bands, caravans, patrols, companions' parties), fights on the map, the economy, the realms, the estates and their building AI, the sites (their making, guards and spies; `monLevel()` with no stream), the folk, refugees, ships, the bands' spawning, an outcome's `band` (a band set on the map) and `lose` (a soldier lost), and every battle.
- **Saved** as the world's last piece, `rng` (order 270: `{game, on: {stream: state}}`), restored on a load (the same game's number, every stream where it was); a new game starts every stream afresh from its own number.
- **Two fixes found by wave B**, behaviour changes: the realms' building choice (`Buildings.day`, `world/estates.js`) draws each kind's random share once, in the list's order, before its sort (it drew inside the comparator, so its draws hung on the engine's sort order); your order for a new house (`Buildings.house`) logs "Builders start on a new house in …" and answers true (a `//` comment had swallowed both; its one caller, `placeClick`, ignores the answer).
- **Found on the way:** two timers a new game never reset (`defendCheck`, `world/defence.js`; `watchCheck`, `world/patrols.js`) ran on from the last game in the same page, so one game played twice in a page went differently; both start from 0 with a new world (no fingerprint moves). Also seen, not changed: a page's first battle goes differently from the ones after it (the battles' caches, as `tests/aishare.js` notes); a band's cached power (`pw`) is saved but reset on a load, so a load and a save again differ in it (wave C's probe).
- **The re-record**, once, against 35a563d (each reason beside it: "2026-10-21 S4: story and content systems on named streams, seeded per world and per game (owner accepted once); the estates' sort keys drawn before sorting"): `tests/worldprint.js` W6 089d600e → 33d059e4, W7 74c85482 → d7c2a900, W8 0f46a757 → 742df600, B2 2c4b512f → fd6d5be4 (W1–W5 unchanged); `battleresolution.js` `monster_win` c95d35c7 → 1744f530; `battlesetup.js` `chief_reuse` 2aa140f4 → a69d5122; `aishare.js` A 29dca01d → b739f365. **Proof by switching off:** the streams back on Math.random (no game's number drawn, their save piece left out): every battle print and W6, W8, B2 as before, W7 f9b6f403 (the estates' keys alone); the estates' comparator as it was too: every hash as before; the streams with no game's number: W6 935d7896, W8 ca1ff21b.
- **Tests:** `tests/streams.js`: a test-only encounter kind registered and the merchant's weight changed: after 4 days of play the world, the shared Math.random and a battle fought then are the same and only the road's stream moved (with the streams switched off, they all differ); the same game gives the same encounters and job offers; a save and a load keep the game's number and continue every stream; a new game starts them afresh; the same seeded begin gives the same game's number, wild game, beasts and encounters, another begin (seeded otherwise, or not) its own; the estates' choice draws the same, and chooses the same, whichever way the sort compares; the house order's line. `Kit.stubStream(name, v, fn)` fixes a stream's draws (`encounters`, `story` and `kinds` stub the road's, the letters' and the incidents' streams as they stubbed Math.random).

**Left for after:** the other site pages (ruins, caves, camps, the hermit, the travellers) onto Choices.
