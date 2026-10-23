# Mobile camps and beast dens: design

Status: **design only, revision 2** (agent MCD, 2026-10-23, written against `main` at 0a5f569, with HO's hideouts merged at 9205094). Nothing here is built, and the owner said "do not start implementation yet". The owner answered every open question of revision 1; his answers are in **Decisions** below and are folded into the rules. §11 lists the few questions that are new.

**Readers:** the owner, and the agents who will build it in the phases of §9.

**Words used here:**
- A **band** is a roving bandit party on the map: a `BandParty` (`world/parties.js`), one of the `bandits` list: bandits, desert raiders or bog raiders, under a chieftain.
- A **party** is anyone who moves on the map as a host of soldiers: a lord's army (`LordParty`), a band, a caravan (`CaravanParty`), a holding's patrol, your companion's party, and your own band (`PlayerParty`).
- A **camp** is a party's tents and fire where it stops; a **den** is a beast pack's home; a **hideout** is a band's base (a `Hideout` site).

## Decisions (owner, 2026-10-23)

Revision 1's brief:
- **The 38 fixed bandit camps go, completely:** generator stage 9, `CAMP_SPOTS`, the `BanditCamp` sites, `DENSITY` camps, the bands sheltering in them by night, and their tests. Mobile camps and hideouts take their place. **Hideouts are the bands' home**, deep in the wilds (HO, merged: `HIDEOUT_PLACE`, `wildLand`, `wildGround`, `HIDEOUT_BAND`, `Lair.plunder`; about 30 on the classic seed).
- **Any party makes camp:** bands at night, when tired or while lying in wait (3–8 tiles off a road, by water and cover, dry and fairly flat, 10+ tiles from holdings, 1–3 nights, then on); lords' armies at dusk on the march, by their road and water, breaking at dawn (siege camps as they are); caravans at night, a target for bandits.
- **The same rules for everyone:** a camped party's figure is hidden and its camp shows; faster rest and healing; caught less ready; night fires seen from afar.
- **Beast dens now:** wolves in woods or hills, bears in rock, boars in thickets; packs rest at their den and roam from it; born there; clearing a den quiets the land; caves stay the big beasts' lairs; dens count with `DENSITY`.
- **Your camp is a place:** pitch it, walk away, come back; it stays until you break it; you choose what stays; it can be raided; while you are in it, it works as today. Every camp window follows the window frame rule.

The answers to revision 1's questions:

| | Decision | Where in this doc |
|---|---|---|
| D1 | **Lords and caravans camp only when no holding is near.** In their own realm's land, or with a friendly holding within reach, they go into the holding for the night; only outside it, with none near, they make camp. | §4.2, §4.3 |
| D2 | **Stamina in %:** stamina and its rates are percentages of the party's maximum (rest +8% an hour, and so on), for you and the AI alike. | §3.1 |
| D3 | **AI parties keep wounded:** lords, bands and caravans' guards keep wounded troops after a fight, as you do; the wounded recover over time, faster in camp or at a holding. | §3.2 |
| D4 | **Caught in camp: morale drops by one percentage for everyone:** you, AI parties and map fights alike. This doc proposes **−10% of starting morale**, replacing your old −8 points. | §2.6 |
| D5 | **Raids on your camp** as designed: any band or beast pack that sees it and would attack, does. | §7.4 |
| D6 | **Your camp's guard counts against your band's size and is paid**, as designed. | §7.2 |
| D7 | **One mobile camp at a time.** Base building will start from a camp later: a camp can be founded in place as the first tier of your own holding; any number of founded bases later, still one mobile camp. | §8 |
| D8 | **You hear of a raid by your army's scouting:** good Scouting hears sooner, or sees the raiders coming in time to ride back; poor Scouting finds out on its return. | §7.5 |
| D9 | **What a raid costs scales by chance with the raiders' size against the guard's strength** (the store, the wounded, the tents), with a random spread. | §7.4 |
| D10 | **New bands spawn only from hideouts** (confirmed by the owner). With every hideout of a kind cleared, no new band of that kind until one returns. | §4.1 |
| D11 | **Den timings** as designed: a slain pack's den empty 12 days; a cleared den quiets 16 tiles for 40 days. | §6.4 |
| D12 | **Smoke by day, fire at night, a camp icon on the map:** camps show smoke by day and fire at night; every camp shows a camp icon on the minimap and the full map once seen (by sight and fog); no fireless "cold camp" for you. | §2.7, §2.8 |
| D13 | **Code: use existing classes as much as possible**; refactor where needed, and consider extending. | §1 |

---

## 0. What exists today, measured

Measured on seed 1 (the default Normal world, 448 × 320) with throwaway probe suites (deleted, not in the patch).

| What | Today | Where |
|---|---|---|
| Fixed bandit camps | 38, placed by generator stage 9 in the fringe; stage 9 **opens their tiles** (`T_OPEN`, height 0), the router makes them nodes, the lots keep clear of them | `world/worldplace.js` `genCamps`; `world/holding.js` `CAMP_SPOTS`; `world/sites.js` `BanditCamp` |
| Bands sheltering | at night a band goes into a camp within 220 px and is off the map till dawn; **only 15 of the 76 bands start within reach of one** | `world/brains.js` `BandBrain`, `updateBands`; `world/world.js` `campNear`, `campEmpty`, `campFight` |
| Hideouts | about 30 since HO: on wild land (22+ tiles from holdings, 8+ from roads), 20 tiles apart; a den hideout's band is bigger and richer (`HIDEOUT_BAND`); `Lair` already counts sheltering bands (`bands`, `sheltering`, `all`) and has `plunder` | `world/sites.js` |
| Bands | 76, spawned anywhere passable 120 px from homes (`spawnBandit`); no stamina, no wounded | `world/world.js` |
| Lords | 20. Of their hours over 8 days: **71% inside holdings**, 6% at sieges, **24% on the map**. Of their night hours on the map: 67% on their own realm's land, 5% with a friendly holding within 320 px, **28% with neither** | probe |
| Caravans | up to 72. Of their hours on the road: **88% on friendly land** (their realm's or one not at war with it), 6% with a friendly holding within 320 px, 6% with neither; at night the same, 8% with neither | probe |
| Your stamina | stored as your hero's `P.sp` (her scale, `maxSP`); `P.bsta` reads and sets it as 0–100; `SUPPLY`'s rates are points of that 0–100 (march −2, camp +8, stay +10) | `world/parties.js`, `world/supply.js` |
| Your wounded | `P.wounded` (counts by kind), `P.woundedGroups` (by formation), `BAND.sick`; made by `heal()` after a battle (`battle/resolution.js`), healed by `woundedDay` at `healShare` | `battle/resolution.js`, `world/world.js` |
| AI losses | a battle you fight: the dead are removed (`l.remove`, `cull`); a map fight: `Party.takeLoss` removes one fighter a blow; nobody is wounded | `battle/resolution.js`, `battle/engage.js`, `world/fights.js`, `world/realms.js` `cull` |
| Your camp | `P.camp` = `BAND.camp` = `{at}`: **no position of its own**, drawn at your place (`bandCampEnt`); a travel order breaks it; caught: −8 band morale (`campCaught`) | `world/supply.js` |
| Camp ground | `campGround(x, y)`: the tents' 26 × 26 px box and 2 px round it on no water, ford, peak, wood, swamp, crossing, brook, road (4 px), lot, holding's ring, site or anything standing | `world/supply.js` |
| Beasts | 153 packs at the start; each has an **invisible lair** (`hx, hy`): it wanders within 60 px and hunts you within 140 px. Wolves live only in the frost | `world/monsters.js`, `data/monsters.js` |
| Night | half of every day (`NIGHT_AT` .5) | `core/core.js` |
| Lights | drawn only inside your sight (`render.js` `inSight`); the fog masks everything that moves | `gfx/render.js`, `world/fog.js` |

**Findings that shape this design:**
- **`campGround` is costly away from you:** 1.5 ms a call on average, about 6 ms when the art chunks under it are not painted yet (`WorldArt.standing` paints them), 29 ms a `campSpot`. AI camps use a cheap tile test; the full test runs once a camp comes near you (§2.3).
- **The band-camp rules, as filters, leave few spots:** 700 tiles on seed 1, and only 36% of road tiles have one within 10 tiles (1,391 and 49% with water within 6, cover within 3); `campGround` passes only 11–14% of them. The rules are **scores with fallbacks**.
- **D1 makes camps rare for lords and caravans, but not the halt:** going into a holding for the night stops them as a camp does. Lords march 24% of their time; at night two thirds of those hours are on their own land (a holding for the night), a third outside it (a camp). Caravans are on friendly land 88% of the time, so **about 1 caravan-night in 12 is a camp**. Either way they no longer move at night: an army's or a caravan's daily distance about halves, plus the detour to the holding (§11 Q1).
- **Removing stage 9 changes the map itself:** every world fingerprint moves in phase 2a.

---

## 1. The class plan: reuse what exists

The owner: "use existing classes as much as possible; a refactor may be needed, but extends can also be considered." Every camp, den and condition below is an existing class extended, or a method added to an existing base.

| Class | Extends | File | What it reuses, and why |
|---|---|---|---|
| **`Camp`** | `Site` (→ `WorldObject`) | `world/camp.js` | A camp is a place on the map, as `TravellersCamp` already is: `Site` gives its picture with yard, sprite, fire and flag, a click anywhere on it (`box`/`at.camp`), its page and page banner (`page`, `view`, `PAGE_SCREEN`), seen and known (`seen`, `known`), the map dot (`mapDot`). It overrides: `here()` (its owner's camp is this one), its window key (`'camp:'+owner uid`), `draw` (a mover by its feet, in sight only, not in the remembered scene: camps move), `meet` (an AI camp meets its owner: `owner.meet()`) |
| **`PlayerCamp`** | `Camp` | `world/campplace.js` | Your camp: its page (the window, §7.6), its standing orders and store; its record shaped like a holding's for founding (§8) |
| **`CampGuard`** | `Party` | `world/campplace.js` | Your camp's guard and wounded while you are away: a party, so map fights, stance and power work for it as for any party (`fights.js` finds sides among the parties) |
| **`Stay`** (a class over today's `P.stay` record) | — | `world/stay.js` | **New base, justified:** today's stay is functions over `P.stay`; a class gives the record an owner and lets the camp's wait reuse its tick, its bar (`#staybar`) and its leaving. `HoldingStay` is today's, unchanged |
| **`HoldingStay`** | `Stay` | `world/stay.js` | Today's stay in a holding (`startStay`, `leaveStay`, `stayTick`, `stayBanner` as its methods; the old names one-line aliases). `P.stay` keeps meaning "inside a holding" (off the map, unseen) |
| **`CampStay`** | `Stay` | `world/stay.js` | Waiting in your camp (until dawn, rested, healed): on the map, seen as any camp; kept on your camp, not in `P.stay` |
| **`Den`** | `Cave` (→ `Site`) | `world/dens.js` | A beast lair, as a cave is: `Cave` gives the tracks-and-bones page, Scout, the pack's power, Enter/Attack. It overrides: `ground`/`clear`/`point` by kind, `lair` (its pack's kind and number, not a fixed count), the fight (its pack, caught resting), `returned` (a new pack moves in) |
| **`Hideout`** | `Lair` (as now) | `world/sites.js` | The bands' home: `Lair.bands` (sheltering, already in its fight and its guess), `Lair.plunder` (HO), the stash (§4.1) |
| **`Holding`** kind `camp` (later) | `Holding` | `world/holding.js`, `data/holdings.js` | Base building (§8): `HOLDING_TYPES` already gives every kind a `tier` and `next` (camp 0 … city or castle 4) |
| On **`Party`** | — | `world/parties.js` | Every party kind inherits (`BandParty`, `LordParty`, `CaravanParty`, `PatrolParty`, `CompanionParty`, `PlayerParty`), so no mixin: `camp` (its `Camp`), `pitch(spot, why)`, `strike()`, `camped`; `sta` and `staminaState()` (§3.1); `wounded`, `woundedCount()` (moved up from `PlayerParty`), `wound(lost, share)`, `healDay(share)` (§3.2) |
| On **`Brain`** | — | `world/brains.js`; `world/bands.js` | The camping policy is each kind's mind: `Brain#camping(o, d)` (the shared moment: keep still, watch, wake, strike) and the kind's own `wantsCamp(o)`, `campSpot(o)`, `nightIn(o)` (a holding for the night), overridden in `LordBrain`, `CaravanBrain` and `BandBrain`. No separate policy registry |
| **`BandBrain`** | `Brain` | moved to `world/bands.js` | A pure move with the bands' other world code, so the bands' agent owns one file (§9) |

Not classes, kept as functions (pure helpers stay functions): the ground tests (`campAt`, `campGround`, `campSpot` and the rest, moved from `world/supply.js` to `world/camp.js` and taking the walker and the kind), `allCamps()` (every camp, as `allParties()` is every party), `stanceVs(pw, against)`. One new table, plain data: `CAMPS` (`data/camps.js`, §10).

---

## 2. The camp

### 2.1 Its record

A camp's record lives on its party (`o.camp`, plain data, saved with the party; `asCamp` puts the class back on load, as `asParty` does for parties). Yours is `BAND.camp` (the world piece `band`).

| Field | What | Who |
|---|---|---|
| `k` | `band`, `lord`, `caravan`, `player` | all |
| `x, y` | its point (the tents' feet), px | all |
| `at` | the hour it was pitched | all |
| `seed` | its picture's seed (as a site's) | all |
| `seen` | you have seen it (§2.8) | all |
| `n`, `stay` | nights on this spot, and the nights it means to stay (1–3) | band |
| `why` | `night`, `tired`, `wait` (lying in wait) | band |
| `full` | it passed the full ground test (§2.3) | all but yours |
| yours | §7.7 | player |

### 2.2 What every camp does

- **Hidden figure:** while camped, `Party.draw` skips the party (figure, host, label); the camp is drawn instead by its feet among the trees (`depth.js worldOverdraw`, as yours today), its banner in `BANNERQ`.
- **Click and hover:** anywhere on its picture or banner; the tip is its owner's with "In camp".
- **Rest and heal:** §3.
- **Caught:** §2.6.
- **Smoke by day, fire at night:** §2.7.
- **Struck:** at its time, when its owner moves on, or when a battle finds it.

### 2.3 Where a camp may stand

**The shared rule is today's `campGround`**, made the camp's: the box is the kind's picture's (a lord's camp is bigger), with `CAMPS.ground`'s margins (today's `SUPPLY.camp`).

**Two levels, for speed:** the **tile test** (`campTiles(x, y, k)`: the tile rules alone, cheap) for every AI camp; the **full test** (`campGround`: the tile test, the art's kept-clear mask and what stands there) for yours, and for an AI camp once it comes within twice your sight: then it is checked once; failing, it moves to the nearest spot that passes within 2 tiles, or, with none, is drawn as a fire and bedrolls only.

**Choosing a spot** (`campBest(o, k)`): candidates every 8 px within the kind's search radius that pass the tile test and the router's reach, each **scored**, the best taken:

| | Band | Lord | Caravan |
|---|---|---|---|
| Off the road | best 3–8 tiles; under 3 never; past 8 less and less | best 1–3 | best 1–2 |
| Water within | 6 tiles | 4 | 4 |
| Cover | a wood's edge or a hill within 3 tiles; more if a hill or wood lies between it and the road (its fire hidden from the road, §2.7) | none | none |
| Ground | open over hills | open | open |
| Holdings | never within 10 tiles | any | any |
| Search radius | 12 tiles | 6 | 4 |
| Nothing found | walks on an hour and tries again; at the third try, the best of any score | where it stands if the tile test passes, else the best of any score | the same |

**Spread over frames:** parties wanting a spot at dusk queue; the brains' frame takes up to `CAMPS.perFrame` (4) a frame (no new frame system: `tests/structure.js`'s pinned order is untouched).

### 2.4 Drawing

| Kind | Its camp (new model, phase 2g) | Placeholder until then | Banner |
|---|---|---|---|
| Band | a rough camp: lean-tos or a ragged tent, a fire, sacks, a spit | `campSprite(seed, 'bandit')` | its rag |
| Lord | an ordered camp: tents in two rows round a pavilion, banner poles, a horse picket (64 px) | `campSprite(seed, 'hideout')` | his banner; his realm's pennants |
| Caravan | the carts in a ring round the fire, the oxen inside | `campSprite(seed, 'travelers')` | its trade pennant |
| Yours | as today (`campSprite(5, 'travelers')`) | as today | yours |
| No full ground | a fire and bedrolls only | a fire only | as above |

By culture: `PX.clusterModel({kind, culture, people, seed, env, snow})`: a lord's by his realm's first race, a band's by its kind, a caravan's by its realm; snow in the frost.

### 2.5 Rest and healing

The same table for everyone (§3 has the models):

| | Stamina an hour (% of the party's maximum) | Wounded fit again a day (share) |
|---|---|---|
| On the march | −2% (× ground, night, mount…) | the base (0.2, +0.2 near a friendly holding) |
| Stopped | +2% | the base |
| **In camp** | **+8%** | **× 1.5** |
| **Inside a holding** (your stay; a lord's or caravan's night or rest; a band in its hideout) | **+10%** | **× 2** |

### 2.6 Caught less ready (D4)

**Everyone caught in camp starts the fight at −`CAMPS.caught` (10%) of its starting morale**: you, an AI party, a map fight alike.
- **A battle:** each soldier of the caught side starts at `mor0 × 0.9` (`moraleInit`, `battle/morale.js`). For you this **replaces the old −8 points of band morale** (`campCaught`): those 8 points moved a soldier's start by about 3%; now it is 10%, the same as the AI's. The encounter's panel says "caught in camp".
- **A map fight** (`world/fights.js`): the caught side's fighting power × 0.9 for that fight.
- **Unless it saw you coming:** a camp's watch is its owner's sight × `CAMPS[k].watch` (0.6 a band, 0.7 a lord, 0.6 a caravan; your cover counts as ever, `Brain.sight`). Seen before you reach it, the party breaks camp and stands (no penalty), or flees if it fears you.
- The camp is struck either way.

### 2.7 Smoke by day, fire at night (D12)

- **By day** a lit camp sends up a thin column of smoke (the drawn weather's smoke, `drawEnv`, or a small smoke sprite from phase 2g), seen from `CAMPS.smoke.see` × the seer's sight (1.5: about 165 px for you).
- **At night** its fire is seen from `CAMPS.fire.see` × the seer's sight (3: about 330 px, 20 tiles), scaled by the dark (`darkness()`).
- **Either:** × 0.5 in a wood's cover (`hiddenAt`); not at all across a peak on the line between; × 0.5 across two or more hill tiles (sampled every 4 px, as `campAcross` does). Your camp with nobody in it has no fire and no smoke.
- `Camp#seenFrom(x, y, sight)` is that rule, one function for everyone:
  - **You:** a fire beyond your sight is drawn over the fog as a flickering point of light; smoke as a faint column. Hovering: **"Firelight: someone camps there"** (or "Smoke"); clicking walks you there. Within your sight the camp itself shows.
  - **The AI:** bands look for caravans', lords' and your fires and smoke (§4.1); a holding's watch looks for band fires and smoke on its land (`LandDefence`).

### 2.8 The camp icon (D12)

- Every camp you have **seen** (in your sight, or its fire or smoke seen from afar: `seen`) shows a **camp icon** on the minimap and on the full map (`ui/map.js`), in its kind's colour (a band's red, a lord's realm colour, a caravan's pale gold, yours blue). A fire or smoke seen from afar shows a plain icon (who is unknown).
- **What you know, not what is:** a camp struck out of your sight leaves its icon where you saw it, faded, until you see that spot again (the fog's rule for what you remember). Those remembered icons are kept with your band (`BAND.marks`, saved only when there are any).
- Yours always shows.

---

## 3. A party's condition: stamina and wounded

### 3.1 Stamina in % (D2)

**You, today and after:**
- Stored as today: your hero's `P.sp` on her scale (every battle snapshot holds `P` whole, so it stays); `P.bsta` is the band's stamina as **a percentage of its maximum**. `SUPPLY`'s rates are already points of that 0–100 (march −2, stopped +2, camp +8, stay +10; Tired under 20, Exhausted under 5): **they are percentages already; nothing in the numbers changes.**
- **What changes is how it reads:** the card shows "Stamina 64%", its tip "+8% an hour (in camp)", the thresholds "Tired under 20%"; the README and `SUPPLY_DESIGN.md` say %.
- One quirk stays visible in % (§11 Q4): when your hero's maximum grows (a level, Agility, Athletics), her `P.sp` stays and the band's % dips a little.

**AI parties (new):** `o.sta`, a percentage 0–100 kept on the party (`Party`, saved only while under 100). Each hour (the `camps` hour system, §9) by the same rates as yours, without food and drink: −2% an hour on the march (× 1.5 rough ground, × 1.3 night, × 0.7 mostly mounted), +2% stopped, +8% in camp, +10% inside a holding or hideout. `staminaState()` (Tired under 20%, Exhausted under 5%) on `Party`: Tired a band camps even by day; Exhausted any party's pace × 0.6, as yours. **Into battle** its soldiers start at its stamina (`u.sta = FATIGUE.max × max(SUPPLY.battleMin, o.sta) / 100`, as your band's do, `battle/fatigue.js`).

### 3.2 Wounded for AI parties too (D3)

**Where it lives:** on the party, with your fields' names: `o.wounded` (counts by kind), saved only when there are any. `woundedCount()` moves up from `PlayerParty` to `Party`. AI parties keep no formation groups for them (yours keep `woundedGroups` as today). A caravan's wounded guards are of its guards' kinds (its counts, `CV_TC`); healed, they go back into its guards.

**How fights hand them back:**

| Fight | Today | With wounded |
|---|---|---|
| Your battle, and they live on (you lose or withdraw, or they are your allies) | the dead removed (`l.remove`, `syncForces`) | of their fallen, a share lives wounded (`CAMPS.wounds.ai`, 0.3; a lord's +0.04 a level of his Medicine, `lordSkill(l, 'med')`), the rest dead: `o.wound(lost, share)` |
| Your battle, and they are beaten | the party is gone | as today: its fallen are the slain you may take prisoner (`takePrisoners`) |
| Auto-resolve | `cull(l, frac)` | `cull` returns the fallen; `o.wound(fallen, share)` |
| A map fight (`fights.js`) | `takeLoss`: one fighter removed a blow | the one hit is wounded at the same share, else dead |
| A siege's end (`realms.js resolveSiege`) | `cull` | as auto-resolve |

**Recovery:** each day (the existing `wounded` day system, `world/world.js woundedDay`, extended to every party), a share of each party's wounded is fit again by **the same rule as yours** (`healShare`, made `healShareOf(o)`): 0.2 a day, +0.2 near a friendly holding, × 1.5 in camp, × 2 inside a holding (a band in its hideout counts as inside), at most 0.9; your Medicine for you, a lord's own for him.

**Strength and display:**
- The wounded **do not fight**: they are out of `tc`, so `power()`, `fightPower()` and every battle read only the fit, as yours.
- They **slow** the party as yours do (`partySpeed`: × (1 − 0.5 × wounded ÷ everyone)).
- They **count toward its size**: a lord's cap (`lcapOf`: he recruits up to it counting the wounded), a band's.
- **Shown:** the label stays the fit number; the tip says "24 soldiers (+6 wounded)"; your scouts' look at a hideout or a camp counts them apart ("6 wounded by the fire").
- A party with only wounded left is beaten (routed, as with none).

---

## 4. Each party

### 4.1 Bands (`world/bands.js`: `BandBrain`)

**When they camp:** at night (from an hour after dusk until dawn); Tired (stamina under 20%), by day too; lying in wait: beside a road with nothing in sight, a band may camp for 4–10 hours watching it (no fire by day; smoke kept low: seen at half the range), ending on a caravan or on you passing within its sight (the bandit raids plan's ambush, IMPLEMENTATION_PLAN #14).

**Where:** §2.3's band score.

**How long, and moving on:** it keeps its spot for 1–3 nights; by day it roams within 80 px of it and is back by dusk; after its last night it moves 12–30 tiles. **After a raid**, or **when a patrol or a lord at home comes within its sight**, it breaks camp at once and goes 30–50 tiles.

**The hideout as home (D10):**
- **New bands spawn only from hideouts** of their kind (bandits, raiders, bog raiders), never one in your sight; at most `CAMPS.hideout.bands` (3) out from one hideout. With every hideout of a kind cleared, **no new band of that kind** until one returns (its `respawn`, 10 days).
- Each band knows its home (`b.home`, the hideout's index). It **goes home** every 4–7 days, after a raid with plunder, or with more than a third of its men wounded: inside for 1–2 days (off the map, in the hideout's `bands`, counted in its fight and its look as `Lair` already does), healing as in a holding (§3.2) and taking on +1 recruit a day up to its size when it set out.
- **Plunder** it carries (`b.loot`: gold, goods from a raid) goes into the hideout's stash (`s.stash`); clearing the hideout pays it out with `Lair.plunder` (HO), and the captivity design's "take it back" points there (CAPTIVITY_DESIGN §6.2).
- A hideout cleared: its bands out on the roads make for the nearest hideout of their kind, or roam homeless.

**Seeking prey at night:** a band weighs any fire or smoke it sees (§2.7): a caravan's or lord's camp it can beat (`stanceVs`: its power against the camp's), or yours (against your band, or your camp's guard when you are away, §7.4), and goes for it.

### 4.2 Lords' armies (`LordBrain`, D1)

At dusk, a lord on the map (marching, going home, riding his lands):
- **On his realm's land, or with a friendly holding within `CAMPS.lord.inn` (6 hours' march, about 320 px):** he goes into the nearest one for the night (`l.enter(t)`, as his rest does; his realm's holdings take him: `shelterWhy`), and rides out at dawn to his target.
- **Else** (about a third of his nights on the map, §0): he camps 1–3 tiles off the road nearest him, by water within 4; breaks at dawn.
- A lord riding to **relieve** a siege marches on through the night; a **siege** keeps its own camp as today; a lord at **rest** is inside his holding as today.
- In camp at night a hostile lord does not hunt you; you within his camp's watch, he breaks camp and comes at you by his stance. Lords at war camped within 20 px fight as today (`updateLords`), the one caught at × 0.9.

### 4.3 Caravans (`CaravanBrain`, D1)

At dusk:
- **On friendly land, or with a friendly holding within `CAMPS.caravan.inn` (4 hours, about 140 px):** it drives into the nearest one for the night (inside it, off the map: `Party.enter`), out at dawn. Its own destination near: it drives on in.
- **Else** (about 1 caravan-night in 12, §0): it camps 1–2 tiles off its road, the carts in a ring.
- **A target:** a band that sees its fire and can beat its guards falls on it (a map fight, as today within 12 px), the guards at × 0.9 if caught. You can trade with it at its fire, toll it or attack it as on the road.

### 4.4 Who does not camp (v1)

Holdings' patrols (their watches go home at dawn and dusk), your companions' parties (as today), the travellers (`TravellersCamp` sites, already a moving camp), refugees and road encounters.

### 4.5 Attacking a camp

| Whose | The encounter | What changes |
|---|---|---|
| A band's | `kind:'party'`, `camp` set | −10% morale unless they saw you; its plunder (`b.loot`) in the spoils |
| A lord's | `kind:'lord'`, `camp` set | as a lord, −10% |
| A caravan's | `kind:'caravan'`, `camp` set | as a caravan, −10% |
| A hideout | the hideout's fight (`Hideout.attack`), with the bands inside (today's `campFight` folded in) | its stash with the loot |
| Yours, you in it | as today; −10% for your soldiers | |
| Yours, you away | a map fight with your camp's guard (§7.4) | × 0.9 if caught |
| A den, the pack home | `kind:'monster'`, `den` set | −10% (caught resting) |

**The battle at a camp, a hook only:** `startEncounter` passes `camp: {k, culture}` to the battle's setup; the field's plan (`FieldPlan#planFeatures`, TERRAIN_DESIGN §8) may later lay tents, a fire and carts on the defender's half. Not in any phase here.

---

## 5. Removing the fixed camps

| Today | Where | Done with it | What takes its role |
|---|---|---|---|
| Stage 9 `genCamps`, its `GEN_STAGES` row `sites` and check | `world/worldplace.js`, `world/worldgen.js` | deleted; the result's `camps` gone | mobile camps |
| The tiles stage 9 opened | stage 9 | no longer opened | the map's own ground |
| `CAMP_SPOTS`, `setCamps` | `world/holding.js`, `world/worldmap.js` | 2a leaves `CAMP_SPOTS` empty; 2b deletes it | — |
| The router's camp nodes | `world/router.js` | dropped | — |
| `occReserve`; `banditSpots` | `world/lots.js` | dropped; hideouts only | hideouts |
| Tramples round camp spots | `gfx/worldart.js` | dropped | each camp's own yard |
| `DENSITY` camps; `WORLD_SCALE.ai.bandCamp` | `data/world.js` | deleted | bands, hideouts |
| "N camps" in the world setup | `ui/worldsetup.js` | dropped | — |
| `SITE_TYPES.camp`, `BanditCamp`, `SITE_CLASS.camp`, `camps()`, `SITE_GAP`'s `camp` | `world/sites.js` | deleted | the band's own camp; the hideout |
| `siteSprite`'s `BanditCamp` branch | `gfx/structures.js` | a type test in phase 1, gone in 2b | `Camp`'s look |
| `campNear`, `campEmpty`, `campFight`, `updateBands`' dawn release, `BandBrain`'s night shelter | `world/bands.js` (moved in phase 1), `world/brains.js` | deleted | `BandBrain`'s camping (§4.1); the hideout's fight |
| `ON_WIN.camp`'s sheltering bands; `lairGone` | `battle/engage.js`, `battle/parley.js` | the hideout's | — |
| A quest's band in a camp; the lure's weight | `world/quests.js`, `world/encounters.js` | hideouts' bands; camped bands and hideouts | — |
| The wiki's camp row | `wiki.html` | a row for camps and dens | — |
| Tests | `campbands`, `garrison`, `sites`, `clicks`, `conduct`, `estateui`, `siteopen`, `pixels`, `holdingfactory`, `holdings`, `loading`, `mainmenu`, `menu`, `mapview`, `territory`, `worldgen`, `worldsanity`, `worldscale`, `visual/shot`, `visual/townshots` | rewritten or the camp checks dropped | §10 |
| Fingerprints | `worldprint` | W1–W8 and B2 re-recorded in 2a with reasons | — |

---

## 6. Beast dens

### 6.1 Which beasts, where

From `data/monsters.js`. Wild game (`data/critters.js`) has **no dens**: it is prey and keeps grazing round its home as today.

| Kind | Its den | Ground | Rests | Roams (leash) |
|---|---|---|---|---|
| Wolf pack | a hollow under roots and rock | a wood's edge or a hill face; **its habitat widened from the frost to woods and hills** | by day | at night, 160 px |
| Cave bear | a rock overhang | a hill or mountain face (as a cave stands) | at night | by day, 80 px |
| Dire boars | a wallow in a thicket | grass or hills beside a wood | at night | by day, 100 px |
| Tiger | a lair in a tangle | forest, swamp wood | by day | at night, 140 px |
| Giant spiders | a nest of webs | deep wood, swamp wood | by day | at night, 80 px |
| Giant scorpions | a burrow | open desert | by day | at night, 120 px |
| Bog slimes | a bog pool | swamp by water | never | 60 px |
| Griffin | an eyrie on a crag | a hill top | at night | by day, 200 px |
| Troll, sand wyrm | **no den**: caves are their lairs (`Cave` sites) as today; their packs on the map keep the invisible home | — | — | as today |
| Dragon | mythic, as today | — | — | — |

Seed 1 has 2,009 wild wood-edge tiles, 999 hill faces and 1,925 grass tiles by a wood.

### 6.2 The den: `Den extends Cave`

- A den is a site in its own list, `W.dens` (the world piece `dens`, order 115): `{uid, id (its kind), tx, ty, x, y, seed, seen, cleared, back}`. A pack points at its den (`m.den`, its uid; `MON_KEYS` gains `den`); the den's point is the pack's home (`hx, hy`), so today's leash and hunting radius work from it.
- **Resting:** in its rest hours a pack walks home and lies in its den: **its figure is hidden** and the den shows (the camps' rule); it does not hunt; it wakes if you come within half its sight, or at the end of its rest.
- **Roaming:** out of its rest hours it wanders within its kind's leash and hunts you as today (`lairHunt`).
- **Its page** (Cave's, `PAGE_SCREEN`): tracks and bones, the pack at home or out; Scout; **Attack** while the pack is home (caught resting, −10%); **Clear the den** while it is empty (§6.4); Leave.

### 6.3 Born at the den

`spawnMonster` and `monsterDay` (`world/monsters.js`, the stream `monsters`):
- **Births:** a pack under its kind's most grows by one every `DENS.birth` (6) days at its den.
- **A young pack leaves:** a full pack for `DENS.split` (10) days sends a young pack off to found a den 15–40 tiles away, on its kind's ground, in the wilds (`lairLand`), outside quiet land, while the world is under its cap.
- **A new den now and then:** the daily tries (`DENSITY.daily.monsters`) found a den where a kind is scarce.
- **A new game:** each starting pack is made with its den.

### 6.4 Clearing a den (D11)

- **The pack slain** (anywhere): its den lies empty; after `DENS.back` (12) days a new pack moves in, if the world is under its cap.
- **Clear the den** (its page, while empty: an hour's work): the den is destroyed and **the land round it is quiet**: no den within `DENS.quiet.r` (16) tiles for `DENS.quiet.days` (40) days, and the nearest holding's reach grows (`pacify`). The quiet marks are saved with the dens.
- A holding's watch that kills a pack empties its den the same way (no quiet).

### 6.5 Counts and art

- **One den for each pack of a den kind:** `DENSITY`'s `monsterStart` and `monsterCap` set them; no new `DENSITY` key.
- **Art** (phase 2g): a model per kind from the engine's pieces (rocks and roots, an overhang, bushes round mud, webs, a sand mound, a pool, a nest of sticks; bones by the mouth). Placeholders: the cave model for rock dens, a bush cluster for thickets.

---

## 7. Your camp as a place

### 7.1 The flow

1. **Pitch:** Make camp (Z, the dock, the ring) as today, at the nearest allowed spot. Your camp has its own point and **stays until you break it**. One mobile camp at a time (D7): Make camp elsewhere asks to break the old one first.
2. **In camp:** as today (stamina +8% an hour, the wounded × 1.5, fast forward stops on danger). `P.camp` keeps meaning "you are in your camp", so every reader of it today is unchanged; `myCamp()` is the place.
3. **The window:** clicking your camp, Z while in it, or the ring's **Camp**.
4. **Leave:** any travel order marches you out; **the camp stays**, with what its standing orders keep there. Nothing kept: an empty camp, no fire, no smoke.
5. **Return:** click it (or the ring's **Back to camp**); arriving, you are in camp and everyone left there is with you again.
6. **Break camp:** in its window (it asks first if anything is kept there) or the ring's Break camp while in it; the store comes into your bag as it has room, the rest left on the ground with a line in the log.

### 7.2 Standing orders: who and what stays

Set in the window, remembered, applied each time you leave:

| Stays | Chosen by | While you are away |
|---|---|---|
| **The wounded** | all or none | they heal at the camp's rate (`healShareOf`: × 1.5, a friendly holding near; not your Medicine, which rides with you); the healed stay as part of the guard |
| **A guard** | troops by kind (`railPicker`) | they stand at the camp and fight raiders (§7.4); they never move |
| **Supplies** | the camp's store: food, drink, goods and gear in and out (`railPicker`) | the people there eat and drink from it at the rest rate; beside water the skins fill free; with none, the wounded stop healing and one man a day deserts, the guard first |

- **The band size (D6):** everyone at your camp counts against your band's size and is paid each day (`bandWages`).
- Companions and prisoners always ride with you (v1).

### 7.3 The people there: `CampGuard extends Party`

Made from the camp's record when you leave and on loading; on the map at the camp (`mapKind` `campguard`, `faction` `player`, no brain: it stands), so map fights, stance and power work as for any party; never drawn as a figure (the camp is). Its wounded are its own `wounded` (§3.2). Back with you, it is folded into your band (`partyRoster(P)`: its groups restored as your wounded's are).

### 7.4 Raids on your camp (D5, D9)

- **Who:** any band, or any pack of an aggro beast kind when the camp holds food and no guard.
- **When:** no extra dice. A band that sees the camp (its sight by day, its smoke by day, its fire at night, §2.7; an empty camp shows none) weighs the guard (`stanceVs`; an unguarded camp's power is 0) and comes for it if it would attack.
- **How:** a map fight at the camp, the guard caught at × 0.9 unless its watch saw them first. You can ride in and join it.
- **What it costs (D9), by the raiders' size against the guard's strength, with a random spread:** let `r` = the raiders' power ÷ (theirs + the guard's), 0.5–1 for a raid that wins (1 for an unguarded camp). Then, each drawn once (`Math.random`, the simulation's):

| | Lost |
|---|---|
| The store | `r × U(0.6, 1.2)` of each good and piece of gear, at most all |
| The wounded | `0.5 × r × U(0.5, 1.5)` of them killed (lost for good, "killed in a raid") |
| The tents | slashed with chance `r` (the camp drawn torn; Re-pitch in its window mends it in an hour) |
| The guard | its losses in the fight (dead or wounded, §3.2) |

  The raiders carry what they took as plunder to their hideout (§4.1), where clearing it can win it back. A raid the guard beats: the raiders routed, as any map fight.

### 7.5 How you hear of a raid (D8)

By your army's Scouting (`skill('scout')`, the same discipline that already widens your sight, `vis()`), in steps like Insight's (`INSIGHT`: rough 2, exact 5):

| Your Scouting | You learn |
|---|---|
| **The camp in your sight** (any Scouting) | you see it: the raiders coming, the fight; fast forward stops (`dangerInSight`) |
| **5 or more** | your scouts watch the camp: within `vis() × (1 + CAMPS.raid.watch × Scouting)` (0.5: Scouting 5 = 3.5 × your sight) you are **warned when raiders make for it** ("Your scouts see bandits making for your camp, about N hours off"), in time to ride back, and told at once when it starts |
| **2 to 4** | **word reaches you after a rider's time**: the distance ÷ `CAMPS.raid.runner` (a rider's pace) hours after the raid, wherever you are |
| **0 or 1** | **you find out on your return**: the camp seen again (your sight), torn and robbed |

Every word is a log line and a notice; the camp's icon is lit red until you see it (§2.8).

### 7.6 The window

A page (`PAGE_SCREEN`, `ui/window.js`, as a site's: the `PlayerCamp`'s `page`): a header, a banner of the camp as it stands, the choices, and the bottom bar from `nav()`; Esc follows its Back; Arial; on a phone in landscape (844 × 390) the choices are the page's key actions in rows of up to four, the pickers full height.

```
┌──────────────────────────────────────────────────────────────┐
│ [fire] Your camp                                 412 g       │
│        Ashford vale · pitched day 14                         │
├──────────────────────────────────────────────────────────────┤
│ [ the camp as it stands: tents, fire, your banner ]          │
│ Resting: stamina +8% an hour, the wounded mend faster.       │
│                                                              │
│ ( Wait )      ( Wounded )      ( Guard )      ( Stores )     │
│  until dawn    stay: all 6      4 spearmen     12 food        │
│  until rested                   power 40       20 water       │
│                                                              │
│ ( Break camp )                                               │
├──────────────────────────────────────────────────────────────┤
│ [Back]                                         [March out]   │
└──────────────────────────────────────────────────────────────┘
```

- **Wait** (until dawn, rested, the wounded fit): a `CampStay` (§1): time runs at your speed, the stay bar (`#staybar`) says so with a Stop button, and it ends when done or when anything hostile comes into sight.
- **Wounded, Guard, Stores:** each its picker (`railPicker`), Back to the camp page.
- **Back** (left) closes the window, you stay in camp; **March out** (right, the way out) leaves with the standing orders applied. Opened from afar, the right button is **Go there**.

### 7.7 Saving

`BAND.camp` (the `band` piece), each field only when it has anything: `{x, y, at, seed, keep:{wounded, guard:{kind:n}}, stock:{good:n}, gear:[id], away:{tc, wounded, woundedGroups, sick}, raided, name}`. `stock` is named as a holding's stock is, for founding (§8). No migration.

---

## 8. Toward base building (later, not in scope)

The owner: "there will be a base-building mechanic, right? Which will start as a camp as well?" Yes: WORLD_DESIGN §7 ("Founding your own holding") already plans one tier model for every holding, **camp → hamlet → village → town → city or castle**, and the owner's art design lists the tier ("Camp: 2–4 tents/wagons around a fire or supply cart; temporary, vulnerable, player-founded possibility": `doc/references/concepts/REALM_STRUCTURE_ART_DESIGN.md`, "Shared tier progression"; that file is in the main tree, not yet committed). `HOLDING_TYPES` already gives each kind a `tier` and `next` (camp 0 … city or castle 4); the `camp` kind is not in the table yet.

What this design does now so that path needs no rewrite:
- **Your camp's record is shaped like a holding's data** where they meet: `x, y` (and its tile `tx, ty`), `name` (when named), `stock` (goods by id, as `t.stock`), the guard as troop counts (a garrison's roster later). `PlayerCamp` is a `Site`, which a founding site also is (§7.2 there: `FoundingSite`).
- **Founding, later:** a **Found a holding here** choice in the camp's window, where WORLD_DESIGN §7.2's founding rules pass (a clear 6 × 6 block, room for estates, far enough from holdings, not on a realm's land): `addHolding({kind:'camp', name, tx, ty, owner:'player', stock: camp.stock, …})` makes a `Holding` of kind `camp` (`holdingOf`), its guard its first garrison, its store its first stock; the mobile camp record is then empty, and you may pitch a new mobile camp elsewhere.
- **Counts:** one mobile camp at a time (D7), and any number of founded bases later (each a `Holding`, its own rules: §7.6 there, raids, upkeep, neglect).

Not in any phase of §9.

---

## 9. Phases

### 9.1 Refactors first (phase 1)

Behaviour-preserving: `worldprint -Seed 1` (W1–W8), the battle suites and `aishare`, and `rts -Seed 1,2,44` unchanged; `camp`, `supply`, `ring`, `stay`, `sites` pass as they are. No new `Math.random` draws: the AI wound code exists but nothing calls it with AI losses until 2w, so `cull` and `takeLoss` draw as today.

| | What | Files |
|---|---|---|
| R1 | `CAMPS` (`data/camps.js`): the whole table of §10.1, written once here; `SUPPLY.camp`'s numbers moved into it, `SUPPLY.camp` a one-line alias. Later phases tune it by line request to the coordinator | `data/camps.js` (new), `world/supply.js` |
| R2 | `Camp extends Site`: `BAND.camp` a `Camp` of kind `player`, its record still `{at}` (its point read from you while you are in it), so saves are byte-identical; `bandCampEnt` → `Camp#draw`, `campPole` → its banner; `campCaught` → `Camp#caught` (it keeps today's −8 band morale until 2w switches every side to −10%) | `world/camp.js` (new), `world/supply.js`, `battle/setup.js` |
| R3 | The ground functions moved to `world/camp.js`, taking the walker and the kind; the tile test split out (`campTiles`); old names one-line aliases | `world/camp.js`, `world/supply.js` |
| R4 | On `Party`: `camp`, `pitch`, `strike`, `camped` (none camps yet); `Party.draw` skips a camped party; `sta` and `staminaState()` (no `sta`: fresh); `wounded`, `woundedCount()` moved up from `PlayerParty`, `wound(lost, share)` (called only for you until 2w), `healDay(share)`; `woundTip(o)` in the tips (empty with none); `PlayerParty`'s `camp` getter reads "in camp" | `world/parties.js`, `world/caravans.js` (its tip, one line) |
| R5 | On `Brain`: `camping(o, d)` and the kinds' `wantsCamp` (false), `campSpot`, `nightIn`; one line at the top of `LordBrain`, `BandBrain`, `CaravanBrain` `think`; `Brain.sight` asks the camp rule (the same number while no camp exists) | `world/brains.js` |
| R6 | `BandBrain`, `spawnBandit`, `campNear`, `campEmpty`, `campFight` moved from `world/brains.js` and `world/world.js` to `world/bands.js` (`BRAINS.band` set there) | `world/bands.js` (new), `world/brains.js`, `world/world.js` |
| R7 | `Stay` as a class over `P.stay` with `HoldingStay` (today's functions its methods, old names aliases); `woundedDay` → each party's `healDay` (only yours has wounded yet); `healShare` → `healShareOf(o)` | `world/stay.js`, `world/world.js` |
| R8 | `stanceVs(pw, against)`, `stance(pw)` its case against you | `battle/engage.js` |
| R9 | `siteSprite`'s `instanceof BanditCamp` → a type test; `drawWorld` draws `allCamps()` (only yours now); a `camps` hour system (`Systems.add({name:'camps', order:{hour:20}})`: the hour's camping and stamina work, nothing yet; hour order is not pinned) | `gfx/structures.js`, `gfx/render.js`, `world/camp.js` |

Script tags for `data/camps.js`, `world/camp.js` (after `world/sites.js`, before `world/supply.js`) and `world/bands.js` (after `world/brains.js`) in `Ashmark.html` and `wiki.html` at the same places.

### 9.2 The phases

Phase 1 first, alone. Then at most five agents at once, each owning its files outright; the coordinator re-records fingerprints at each merge, each with its reason. HO's hideouts are merged, so 2b can start with wave A.

| Phase | What | Effort | Owns | Fingerprints that move | After |
|---|---|---|---|---|---|
| **1** | The refactors (§9.1) | **L** | `data/camps.js`, `world/camp.js`, `world/bands.js` (new); `world/supply.js`, `world/world.js`, `world/stay.js`, `world/parties.js`, `world/brains.js`, `world/caravans.js` (one line), `battle/setup.js`, `battle/engage.js`, `gfx/render.js`, `gfx/structures.js`; tags in `Ashmark.html`, `wiki.html`; a new `camps` test | none | — |
| **2a** | The generator without camps (§5, the map side) | M | `world/worldplace.js`, `world/worldgen.js`, `world/holding.js`, `world/worldmap.js`, `world/router.js`, `world/lots.js`, `gfx/worldart.js`, `ui/worldsetup.js`, `data/world.js`; tests `worldgen`, `worldsanity`, `worldscale`, `holdingfactory`, `holdings`, `loading`, `mainmenu`, `menu`, `mapview`, `territory`, `worldprint` | **W1–W8, B2** | 1 |
| **2b** | Bands: mobile camps, hideouts as home (§4.1, §5's site side) | L | `world/bands.js`, `world/sites.js`, `battle/engage.js` (`ON_WIN.camp`), `battle/parley.js`, `world/quests.js`, `world/encounters.js`, `world/defence.js` (the watch seeks band fires); tests `campbands` → `bandcamps`, `garrison`, `sites`, `clicks`, `conduct`, `estateui`, `siteopen`, `pixels`, `visual/shot`, `visual/townshots`; `wiki.html`'s camp rows | W7, W8; W6 if a band camps in view | 1 |
| **2c** | Lords and caravans: a holding for the night, else a camp (§4.2, §4.3) | M | `world/brains.js` (`LordBrain`, `CaravanBrain`), `world/camparmy.js` (new: their spot scores, the night-in rule); test new `armycamps` | W7 | 1 |
| **2d** | Your camp as a place (§7), stamina shown in % | L | `world/supply.js`, `world/stay.js` (`CampStay`), `world/world.js` (`marchStep`: leave, not break; `bandWages`), `world/campplace.js` (new: `PlayerCamp`, `CampGuard`), `gfx/render.js` (`updateHUD`: %), `ui/input.js`, `style.css`; tests `camp`, `supply`, `ring`, `stay`, new `campplace` | none expected | 1 |
| **2w** | The AI parties' condition: stamina in % and wounded (§3), and readiness at −10% for every side (§2.6) | **L** | `world/parties.js` (`Party` stamina and wounds), `battle/resolution.js`, `battle/setup.js` and `battle/morale.js` (readiness: the old −8 points out, −10% for every caught side), `battle/fatigue.js` (AI soldiers start at their party's %), `world/fights.js`, `world/realms.js` (`cull`, `lcapOf`, sieges); test new `aicondition` | W7, W8 (sizes after map fights; `sta` and `wounded` in records); battle suites expected to hold (they start no world party): check | 1; 2a–2d merged |
| **2f** | Beast dens (§6) | L | `world/dens.js` (new), `world/monsters.js`, `data/monsters.js` (wolves' ground, the `DENS` table); tests `monsters`, `beastai`, `wilddensity`, new `dens` | W7, W8; W6 if a den or a resting pack is in view | 1 |
| **2e** | Smoke, fires and the camp icon (§2.7, §2.8: your side) | M | `world/fires.js` (new: far fires and smoke, hover and click, the remembered icons), `gfx/render.js` (the pass over the fog; the minimap icons), `ui/map.js` (the full map's icons); test new `fires` | W6 at its spots once camps exist near them | 1; best after 2b, 2c |
| **2g** | Camp, den and smoke art (§2.4, §6.5) | M | `engine/buildmodels.js`, `engine/pieces.js`, `gfx/structures.js` (`campSprite` kinds, `denSprite`), `engine/gallery.html`; tests `buildmodels`, `models`, `pixels` (its model part) | W6 if a camp or den is in view | 1 |

**Waves:** A: 2a, 2b, 2c, 2d, 2f (five); B: 2w, 2e, 2g. 2w goes in wave B: it owns `world/parties.js` and the battle files once wave A's camping has landed, and the bands' and lords' camping read its stamina through phase 1's `staminaState()` (fresh until 2w, so "Tired" camps start with it). `tests/structure.js` needs no change (the camps' work runs in the hour and the brains' frame; births inside `monsterDay`; AI healing inside the `wounded` day). Each phase updates `prototype/README.md` for its part, and 2d updates `SUPPLY_DESIGN.md`'s numbers to %.

---

## 10. The numbers and the tests

### 10.1 `CAMPS` and `DENS`

```
CAMPS = {                                                     // data/camps.js
  ground:   {m:2, road:4, lot:0, ring:1, site:4, step:8, r:6, hop:2, across:4},  // today's SUPPLY.camp
  player:   {pole:[20,1], max:1},
  rest:     {march:-2, stop:2, camp:8, inside:10},            // % of the maximum an hour (SUPPLY.rest for you)
  heal:     {camp:1.5, inside:2},                             // × the day's share (healShareOf)
  caught:   .1,                                               // −10% of starting morale, every side; map fights × 0.9
  smoke:    {see:1.5}, fire:{see:3, cover:.5, hill:.5, r:22},
  perFrame: 4,
  band:     {road:[3,8], hold:10, water:6, cover:3, search:12, nights:[1,3], watch:.6, leash:80, move:[12,30], flee:[30,50], wait:[4,10]},
  lord:     {road:[1,3], water:4, search:6, watch:.7, inn:320},
  caravan:  {road:[1,2], water:4, search:4, watch:.6, inn:140},
  hideout:  {bands:3, every:[4,7], stay:[1,2], recruit:1, woundedHome:1/3},
  wounds:   {ai:.3, med:.04},                                 // the share of AI fallen who live wounded
  raid:     {store:[.6,1.2], wounded:[.5,1.5], watch:.5, runner:60},
}
DENS = {birth:6, split:10, back:12, quiet:{r:16, days:40}, kinds:{wolf:{...}, bear:{...}, …}}  // data/monsters.js
```

### 10.2 Tests per phase

Targeted suites only; the coordinator runs the sweep after each merge.

| Phase | Tests |
|---|---|
| 1 | `camp`, `supply`, `ring`, `stay`, `sites`, `campbands`, `garrison`, `structure` unchanged; new `camps`: your camp is a `Camp` (a `Site`), its record `{at}` saved byte for byte as before, `allCamps()` is yours alone, `campTiles` agrees with `campGround` on the tile rules over a sample, `stanceVs` matches `stance`, `HoldingStay` behaves as the old stay, `woundedCount` and `healDay` give the player's old numbers; fingerprints held |
| 2a | `worldgen` (no camps, no stage row), `worldsanity`, `worldscale`, `holdingfactory`, `holdings`, `loading`, `mainmenu`, `menu`, `mapview`, `territory`; `worldprint` re-recorded |
| 2b | new `bandcamps`: a band camps at night 3–8 tiles off a road, never on one, 10+ from holdings, by water or cover when any; hidden figure, its camp drawn; 1–3 nights, then 12–30 tiles; a patrol in sight sends it 30–50; lying in wait ends on a caravan; **bands spawn only at hideouts**, none of a kind with its hideouts all cleared; home every 4–7 days, healing and recruiting; plunder to the stash and out with the hideout's loot; a cleared hideout's bands go to another; saved and loaded; and the old camp tests rewritten |
| 2c | new `armycamps`: at dusk a lord on his land goes into his realm's nearest holding, outside it he camps 1–3 tiles off his road; dawn out; relief marches on; a caravan on friendly land drives into a holding, outside it rings its carts; a band that sees a caravan's fire and can beat its guards falls on it; saved and loaded; INFO: march days and deliveries a day against today's |
| 2d | new `campplace`: pitch, leave, the camp stays with its orders; the wounded heal there and join the guard; the store eaten, filled beside water; return; break; the guard counts and is paid; a raid on an unguarded camp, a stronger guard holds; the raid's losses scale with `r` over many seeded raids; word by Scouting (in sight, 5+ warned, 2–4 after the rider's hours, 0–1 on return); one camp at a time; the card in %; the window: header, choices, `nav()` bar with Back left and March out right, Esc = Back, 844 × 390 unclipped; saved and loaded |
| 2w | new `aicondition`: an AI party's stamina drains and comes back by the table, Tired and Exhausted as yours, its soldiers start a battle at it; after your lost battle, an auto-resolve, a map fight and a siege, a share of the AI fallen live wounded; they heal by `healShareOf` (camp × 1.5, inside × 2); they do not fight, they slow the party, they count toward a lord's cap; tips show them; a caravan's wounded guards return to its guards; −10% for every caught side; saved and loaded |
| 2e | new `fires`: smoke by day at 1.5×, fire at night at 3×, × 0.5 in a wood, none across a peak; hover and click; the icon on the minimap and the full map once seen, faded where it was until you see the spot; a band finds your fire; a watch finds a band's |
| 2f | new `dens`: each kind on its ground off holdings' land; rests hidden by its hours, roams by its leash; births; a young pack founds a den 15–40 tiles off; slain, empty 12 days; cleared, quiet 16 tiles for 40 days and `pacify`; trolls and wyrms none; the count follows `DENSITY`; saved and loaded |
| 2g | `buildmodels`, `models`: each new model's spec, size and culture variants; `pixels`: camps and dens on their own ground |

---

## 11. Questions of revision 2: answered

**The owner, 2026-10-23: "default".** Every default below is decided; the phases build them. Building waits for the owner's go.

1. **Night halts slow war and trade:** a holding for the night stops a lord or caravan as a camp does, so their daily distance about halves (§0). *Default:* accept it; 2c measures march days and deliveries a day, and if trade falls by more than a quarter, caravans move faster by day.
2. **The readiness number:** −10% of starting morale for everyone caught (D4). *Default:* 10%.
3. **AI wounded share:** 30% of an AI party's fallen live wounded (yours: 25%, +4% a level of Medicine, at most 70%); a lord adds 4% a level of his Medicine. *Default:* these.
4. **Your stamina's % dips when your hero's maximum grows** (her `P.sp` is stored on her scale). *Default:* rescale `P.sp` when her maximum changes, so the % holds (a tiny change, in 2d).
5. **Smoke seen from afar by day** at 1.5 × sight (fire at night 3 ×). *Default:* these.
6. **A camp icon you saw stays, faded, where the camp was** until you see that spot again. *Default:* yes.
7. **Raid word by Scouting:** warned within 3.5 × your sight at Scouting 5, a rider's word at 2–4, none below 2 until you return. *Default:* these steps.
