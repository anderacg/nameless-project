# The story system: encounters, events, quests and everything that happens: design

Status: **draft for the owner's review** (2026-10-20). Nothing here is built yet. This is a **refactor first** design (the owner's rule): it changes how the code is organised, not how the game plays, and the new features (escort, chain quests, tournaments, new jobs, the small encounters) are then built on it.

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
| **S0** | Foundations: the bus (§3.6), the context (§3.2), Outcomes with their text (§3.5), Choices and the ChoicePage (§3.4); today's encounter choices expressed through them | M | unchanged |
| **S1** | The registry and `Happening` with the **Encounter** shape; today's encounters onto it (behaviours as small strategies: approach, stay, flee, walk, graze, bolt) | M | unchanged |
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

## 8. The owner's answers (2026-10-20)

1. **Names:** yes: the story system, with encounters, incidents, quests, gatherings and threads.
2. **Named streams (S4):** accepted: one deliberate fingerprint re-record, so new content never shifts the world again.
3. **Tests for the refactor steps:** the fingerprints plus each area's suites (no full sweep).
4. **Order:** this wave first. A core wave (the systems registry, clock, timed states, event bus, save registry, spatial helper, stream helper, test kit) is proposed to come just before it: see [CORE_DESIGN.md](CORE_DESIGN.md) once written.
