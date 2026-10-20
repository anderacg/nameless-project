# The story system: encounters, events, quests and everything that happens: design

Status: **approved** (the owner's answers, §8, 2026-10-20); building: **S0 and S1 built** (2026-10-20, §9). This is a **refactor first** design (the owner's rule): it changes how the code is organised, not how the game plays, and the new features (escort, chain quests, tournaments, new jobs, the small encounters) are then built on it.

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
| **S2** | **Incident** shape; today's road events onto it | S | unchanged |
| **S3** | **Quest** shape: today's 9 kinds as subclasses; progress through the bus (`questNotify` goes); the news listens on the bus (`newsRecord` calls go) | M | unchanged |
| **S4** | **Named streams** for the story systems | S | **changed once**, re-recorded with the reason |
| **S5** | **Thread** and **Gathering** shapes (the frameworks only), ready for the features | M | unchanged |

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

**Left for S2 and after:** the other site pages (ruins, caves, camps, the hermit, the travellers) onto Choices; the road events (`world/events.js` `EVENTS[].ok`) onto the context with the Incident shape (S2); the emitters (`questNotify`, `newsRecord`) onto the bus (S3).
