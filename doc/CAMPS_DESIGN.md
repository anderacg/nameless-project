# Mobile camps and beast dens: design

Status: **design only** (agent MCD, 2026-10-23, written against `main` at fa163d0). Nothing here is built. The owner's decisions of 2026-10-23 below are fixed; §9 lists what is still open, each with a recommended default.

**Readers:** the owner, and the agents who will build it in the phases of §7.

**The owner's decisions (2026-10-23):**
- **The 38 fixed bandit camps go, completely:** generator stage 9, `CAMP_SPOTS`, the `BanditCamp` sites, `DENSITY` camps, the bands sheltering in them by night (`campNear`, `campEmpty`, `campFight`) and their tests. Mobile camps and hideouts take their place. **Hideouts become the bandits' home**, deep in the wilds (agent HO is moving them now: `world/sites.js` `Hideout`, `HIDEOUT_PLACE`, at least about 22 tiles from holdings and 8 from roads, about half as many).
- **Any party makes camp:**
  - **bandit bands** at night, when tired, or while lying in wait: 3–8 tiles off a road (never on it), by water and cover (a wood's edge, behind a hill, a hollow), on dry and fairly flat ground, at least 10 tiles from holdings; 1–3 nights in one place, then on, further after a raid or when a patrol comes near;
  - **lords' armies** at dusk on the march, near the road they follow and by water; they break camp at dawn. Siege camps stay as they are;
  - **merchants' caravans** at night, which makes them a target for bandits.
- **The same rules for everyone:** a camped party's figure is hidden and its camp shows (tents, fire, banner, as yours does since 07d0929); faster rest and healing; caught less ready if attacked; **night fires seen from afar**, so hunting bandits becomes looking for firelight off the road.
- **Beast dens, now:** wolves in woods or hills, bears in rock, boars in thickets; packs rest at their den (by day or by night, by kind) and roam from it; new beasts are born there; clearing a den quiets the land for a long while; caves stay the big beasts' lairs (trolls, wyrms); dens count with the world's `DENSITY`.
- **Your camp becomes a place:** pitch it, walk away, come back; it stays until you break it (no timeout); you choose what stays (the wounded, a guard, supplies); an unguarded or lightly guarded camp can be found and raided; while you are in it, it works as today. Every camp window follows the window frame rule.

---

## 0. What exists today, measured

Measured on seed 1 (the default Normal world, 448 × 320) with a throwaway probe suite (deleted, not in the patch).

| What | Today | Where |
|---|---|---|
| Fixed bandit camps | 38 (`DENSITY.classic.camps` 12, grown with the land), placed by generator stage 9 in the fringe (6–16 tiles from roads, 14 from holdings); stage 9 **opens their tiles** (`T_OPEN`, height 0) | `world/worldplace.js` `genCamps`; `world/holding.js` `CAMP_SPOTS`, `setCamps`; `world/sites.js` `BanditCamp` |
| Bands sheltering | at night a band goes into a camp within 220 px (`WORLD_SCALE.ai.bandCamp`) and is off the map till dawn. **Only 15 of the 76 bands start within reach of one** | `world/brains.js` `BandBrain`, `updateBands`; `world/world.js` `campNear`, `campEmpty`, `campFight` |
| Hideouts | 61 (density, before HO's change); `Lair` (shared with `BanditCamp`) already knows sheltering bands (`bands`, `sheltering`, `all`) | `world/sites.js` |
| Roving bands | 76, spawned anywhere passable 120 px from homes (`spawnBandit`); no stamina, no wounded | `world/world.js` |
| Lords, caravans | 20 lords; caravans up to 72; neither stops at night | `world/brains.js` `LordBrain`, `CaravanBrain` |
| Your camp | `P.camp` = `BAND.camp` = `{at}`: **no position of its own**, drawn at `P.x, P.y` (`bandCampEnt`); any travel order breaks it; +8 stamina an hour, the wounded heal ×1.5, caught −8 morale | `world/supply.js` |
| Camp ground | `campGround(x, y)`: no water, ford, peak, wood, swamp, crossing, brook, road or track within 4 px, lot, holding's ring, site or anything standing under the tents' box (26 × 26 px) and a 2 px margin | `world/supply.js` |
| Beasts | 153 packs at the start (wolf 21, scorpion 19, slime 18, spider 18, troll 16, boar 15, bear 13, tiger 13, wyrm 11, griffin 9). Each already has an **invisible lair** (`hx, hy`): it wanders within 60 px of it and hunts you within 140 px (`lairLeash`, `lairHunt`). Wolves live only in the frost (`where:['frost']`) | `world/monsters.js`, `data/monsters.js` |
| Night | half of every day (`NIGHT_AT` .5, a day 180 s at 1×) | `core/core.js`, `core/clock.js` |
| Lights | torches and fires queue `LIGHTQ` and are drawn **only inside your sight** (`render.js` `inSight`); everything that moves is masked by the fog | `gfx/render.js`, `world/fog.js` |
| Sight | yours 110 px (Scouting, ground, gear); a band's 95, a lord's 90, a caravan's 80 | `data/world.js` `WORLD_SCALE.sight` |

**Findings that shape this design** (more in the report at the end of §9):
- **`campGround` is costly away from you.** 1.5 ms a call on average; `WorldArt.standing` alone takes about 6 ms when the chunks under it are not painted yet, because it paints them (the art's LRU holds 20–32 chunks). `campSpot` takes about 29 ms. A hundred parties pitching at dusk cannot call it: AI camps out of your sight use a cheap tile test, and the full test runs once a camp comes near you (§1.3).
- **The owner's band-camp rules leave few spots.** Open tiles 3–8 off a road: 14,451; also 10+ tiles from holdings: 11,143; also water within 4: 3,297; also a wood or hill within 2: **700**, and only 36% of the 3,282 road tiles have one within 10 tiles. With water within 6 and cover within 3: 1,391 (49%). Of these, `campGround` passes only 11–14% at the tile's middle (its wood and road margins are strict). So the rules are **scores, not filters**, with fallbacks (§1.3).
- **Lords and caravans halt half of every day** if they camp all night: wars and trade run at about half their pace (§9 Q1).
- **Removing stage 9 changes the map itself** (the tiles it opened, the router's camp nodes, the lots it kept clear): every world fingerprint moves in phase 2a.

---

## 1. The Camp model

### 1.1 One class for every camp

`class Camp` (new `world/camp.js`): a party's camp, whoever it is. **Its record lives on its party** (`o.camp`, plain data, saved with the party); the class is put back over it with `asCamp`, as parties are with `asParty`. `Camps` is a view over all of them (`Camps.all()`: yours, then the bands', the lords', the caravans'), as `W.parties` is over the parties. No list of its own, so nothing new to keep in step.

| Field | What | Who |
|---|---|---|
| `k` | its kind: `band`, `lord`, `caravan`, `player` | all |
| `x, y` | its point (the tents' feet), px | all |
| `at` | the hour it was pitched (`Clock.hours()`) | all |
| `n` | nights spent on this spot; `stay` the nights it means to stay (1–3 for a band) | band |
| `why` | why it camps: `night`, `tired`, `wait` (lying in wait) | band |
| `full` | it passed the full ground test (`campGround`) where it stands (§1.3) | all but yours |
| `keep`, `store`, `guard`, `wounded` | what stays when you leave (§5) | player |
| `raided` | the day it was raided (its tents slashed, §5.4) | player |

What it says of itself (methods, not saved):

| Method | What |
|---|---|
| `owner` | its party (yours: `P`) |
| `fire` | lit: someone is in it and it is not a cold wait (`why` `wait` by day). Your empty camp has no fire |
| `banner()` | the owner's banner (`Party.banner`: a band's rag, a lord's banner, a caravan's trade pennant, yours) on a pole by the fire, as `campPole` plants yours |
| `look()` | the model and culture it is drawn with (§1.4) |
| `watch` | the share of its owner's sight it keeps while camped (`CAMPS[k].watch`: a camp's watch sees less) |
| `seenFrom(x, y)` | whether its fire is seen from there now (§1.7) |
| `draw(ents, cam, V)` | its tents, fire and banner in the depth order (today's `bandCampEnt`) |
| `pick(at)`, `tip()` | a click and a hover anywhere on its picture: the owner's tip with "In camp" (or "Firelight" from afar, §1.7) |
| `caught(opts)` | the readiness penalty when a battle finds it (§1.6) |
| `strike()` | broken: the record dropped, the figure back on the map |

`Camping` (also `world/camp.js`) is **each kind's policy** for when, where and how long: `Camping.add(kind, policy)` registers one, and every brain asks it first (`Camping.step(o, d)`: true while camped or making for a spot, so the brain does nothing else this moment, except meet you). The policies live with their owners' code (§2), so the agents of phase 2 never share a file.

### 1.2 Saving

- A camp is saved inside its party's record (`bandits` in the save's top level, `W.lords`, `W.caravans`), **only while there is one** (no camp: no field, so a save without camps is as it was). A generated world packs a band's record to tenths (`BandParty.toJSON`): the camp's `x, y` with it.
- Yours stays in `BAND.camp` (the world piece `band`, order 280), now with its own `x, y` and what stays (§5.5).
- No migration (saves are v3; `core/saves.js` defaults fill new fields).

### 1.3 Where a camp may stand

**The shared rule is today's `campGround`**, made the camp's: the picture's box is the kind's (a lord's camp is bigger: §1.4), with `CAMPS.ground`'s margins (today's `SUPPLY.camp` numbers: 2 px round the picture, no road within 4 px, outside every holding's ring, 4 px clear of sites, nothing standing, no wood, swamp, water, ford, peak, brook or crossing).

**Two levels, for speed:**
1. **The tile test** (`CampGround.tiles(x, y, k)`): the tile rules alone (terrain, swamp, brook, crossing, road margin, lots, holdings' rings, sites). Cheap: no painted art. Used for every AI camp, everywhere.
2. **The full test** (`campGround`): the tile test, the art's kept-clear mask and what stands there (trees, bushes, rocks). Used for your camp (as today), and for an AI camp **once it comes within twice your sight**: then it is checked once (`full`); if it fails, the camp moves to the nearest spot that passes within 2 tiles (`campSpot` from its point), or, with none, stays where it is (no tents over a tree: the camp is drawn as a bare fire and bedrolls, §1.4).

**Choosing a spot** (`CampGround.best(o, k)`): candidates every 8 px within the kind's search radius that pass the tile test and the router's reach (`Router.reach`), each **scored**, the best taken. A score, not filters, because the strict rules leave too few spots (§0). The weights are in `CAMPS[k].score`:

| | Band | Lord | Caravan |
|---|---|---|---|
| Off the road (tiles to the nearest road or track tile) | best 3–8; under 3 never; over 8 less and less | best 1–3 | best 1–2 |
| Water (a river, lake or pond within n tiles) | + within 6 | + within 4 | + within 4 |
| Cover (a wood's edge or a hill within n tiles) | + within 3; ++ if a hill or wood lies between it and the nearest road (its fire hidden from the road, §1.7) | none | none |
| Ground | open over hills (dry, fairly flat); never swamp (already) | open only | open only |
| Holdings | never within 10 tiles of a holding (`CAMPS.band.hold`) | any | any |
| Search radius | 12 tiles round where it stopped, walked to | 6 tiles | 4 tiles |
| Nothing found | walks on an hour and tries again; at the third try, camps on the best tile-test spot of any score | camps where it stands if the tile test passes, else on the best of any score within 6 tiles | the same |

**Spread over frames:** at dusk many parties want a spot at once. A party that wants to camp joins a queue (`Camping.queue`); the 'parties' frame takes up to `CAMPS.perFrame` (4) a frame. A party in the queue keeps walking. No new frame system (the queue runs inside the brains' frame), so the pinned frame order (`tests/structure.js`) is untouched.

### 1.4 Drawing

While camped, **the figure, host and label are not drawn** (`Party.draw` skips a camped party, as `drawWorld` skips you in camp); the camp is drawn instead, by its feet among the trees as yours is (`depth.js worldOverdraw`, `nf`). Its banner goes to `BANNERQ` as yours does, so a camp is clicked anywhere on its picture or its banner.

| Kind | Its camp (new model: phase 2g) | Placeholder until then | Banner |
|---|---|---|---|
| Band | a rough camp: one or two lean-tos or a ragged tent, a fire, sacks and a spit; plunder piled if it carries any | `campSprite(seed, 'bandit')` (the `camp` cluster) | its rag on a stake |
| Lord | an ordered camp: tents in two rows round a pavilion, banner poles, a horse picket, cook fires (64 px, as the hideout's cell) | `campSprite(seed, 'hideout')` | his banner on the pavilion, his realm's pennants |
| Caravan | the carts in a ring round the fire, the oxen picketed inside | `campSprite(seed, 'travelers')` | its trade pennant |
| Yours | as today (`campSprite(5, 'travelers')`) | as today | yours |
| Fallback (no full ground) | a fire and bedrolls only (no tents) | a fire only | as above |

**By culture:** the models take the owner's people (`PX.clusterModel({kind, culture, people, seed, env, snow})`): a lord's by his realm's first race (`FACS[fac].races[0]`), a band's by its kind (bandits human, raiders and bog raiders orcish), a caravan's by its realm. The frost's snow on them as on every site.

### 1.5 Rest and healing

| | Stopped | In camp | In a holding |
|---|---|---|---|
| Your stamina an hour | +2 | **+8** | +10 (as today, `SUPPLY.rest`) |
| Your wounded healed a day | ×1 | **×1.5** (`healShare`) | ×2 |
| An AI party | — | its march hours reset (`o.march`, below) | — |
| A band at its hideout | — | — | **+1 man a day** back, up to the band's size when it set out (`CAMPS.hideout.refill`) |

AI parties have no stamina and no wounded today. They get one small counter only: `o.march`, the hours on the move since they last camped (saved while not 0). A band is **tired** at `CAMPS.band.tired` (14) hours and camps even by day. No AI wounded model in v1 (§9 Q3).

### 1.6 Caught less ready

Today a battle that finds you in camp costs your band 8 morale (`campCaught`, `battle/setup.js`). The same for everyone:
- **You:** as today (−`CAMPS.readiness.player` 8 morale, the camp struck).
- **An AI party you attack in its camp:** its soldiers start at ×`CAMPS.readiness.foe` (0.9) of their starting morale (`moraleInit`'s `theirs`), the encounter panel says so ("They are caught in their camp"), and its camp is struck.
- **Unless it saw you coming:** a camp's watch is its owner's sight × `CAMPS[k].watch` (0.6 a band, 0.7 a lord, 0.6 a caravan; your hiding in woods counts as ever, `Brain.sight`). If you come within it before you reach the camp, the party breaks camp and stands (no penalty), or flees if it fears you. So a night approach through the woods pays.
- **A map fight** (`world/fights.js`) with a camped side: its fighting power ×`CAMPS.readiness.map` (0.8) for that fight.

### 1.7 Night fires seen from afar

A lit camp's fire is seen, at night, from `CAMPS.fire.see` × the seer's sight (3: yours 110 px, so about 330 px, 20 tiles), scaled by the dark (`darkness()`: from dusk to full night), and:
- × `CAMPS.fire.cover` (0.5) when the camp stands in a wood's cover (`hiddenAt`);
- **not at all** across a peak (`T_MOUNT`) on the line between, and × 0.5 across two or more hill tiles (sampled every 4 px, as `campAcross` does);
- not by day (no smoke in v1, §9).

`Camp.seenFrom(x, y)` is that rule, one function for everyone:
- **You** (phase 2e): a fire seen beyond your sight is drawn over the fog as a flickering point of light (2–3 px, a soft glow of `CAMPS.fire.r` 22 px), even over land you have not explored. Hovering it: **"Firelight: someone camps there"**; clicking it walks you there (the chase ends at the camp, then you meet whoever it is). Within your sight the camp itself shows, owner and all. Not on the minimap.
- **The AI** (each kind's policy, §2): bands at night look for caravan and lord fires and for yours; a holding's night watch looks for band fires on its land (`LandDefence`: a fire seen from its homes or by its watch is a threat to run down).
- **Your fire** is seen by them the same way: camping in the open at night, a band 20 tiles off can find you; behind a hill or in a wood's edge, far less.

### 1.8 The numbers: `CAMPS` (new `data/camps.js`)

Every number in one table, as `SUPPLY` is. `SUPPLY.camp` becomes `CAMPS.ground` and `CAMPS.player` (`SUPPLY.camp` kept as a one-line alias for the tests).

```
CAMPS = {
  ground:   {m:2, road:4, lot:0, ring:1, site:4, step:8, r:6, hop:2, across:4},  // today's SUPPLY.camp placement
  player:   {rest:8, heal:1.5, pole:[20,1], max:1},
  readiness:{player:8, foe:.9, map:.8},
  fire:     {see:3, cover:.5, hill:.5, r:22},
  perFrame: 4,
  band:     {road:[3,8], hold:10, water:6, cover:3, search:12, nights:[1,3], tired:14, watch:.6,
             leash:80, move:[12,30], flee:[30,50], wait:{hours:[4,10]}, score:{...}},
  lord:     {road:[1,3], water:4, search:6, watch:.7, score:{...}},
  caravan:  {road:[1,2], water:4, search:4, watch:.6, score:{...}},
  hideout:  {bands:3, every:[4,7], stay:[1,2], refill:1},
  raid:     {kill:.3},
}
```

---

## 2. Each party

### 2.1 Bandit bands (`world/bands.js`, `BandCamping`)

**When they camp:**
- **At night:** from an hour after dusk (`NIGHT_AT` + 1 h) until dawn.
- **Tired:** after `CAMPS.band.tired` (14) hours on the move, by day too.
- **Lying in wait:** a band beside a road with nothing in sight may camp cold (`why` `wait`: no fire by day) for 4–10 hours, watching the road; a caravan or you passing within its sight end the wait (it falls on a caravan as `CaravanBrain` already lets it, or comes at you by its stance). This is the bandit raids plan's ambush (IMPLEMENTATION_PLAN #14), ready for it.

**Where:** §1.3's band score, round where it stopped.

**How long, and moving on:**
- It keeps its spot for `stay` nights (1–3, drawn when it first camps there). By day it roams within `CAMPS.band.leash` (80 px) of the spot and is back by dusk; after the last night it moves on 12–30 tiles (`move`) and picks a new spot.
- **Further after a raid** (it robbed a caravan or a worker, beat a party) or **when a patrol or a lord at home comes within its sight:** it breaks camp at once and goes 30–50 tiles (`flee`), its `stay` reset.
- Today's "bands shelter in a fixed camp at night" goes (§3).

**The hideout as home** (`world/sites.js` `Hideout`, after HO's move):
- **New bands start at a hideout** of their climate's kind (bandits, raiders, bog raiders), never one in your sight; at most `CAMPS.hideout.bands` (3) out from one hideout at once. `spawnBandit` picks the hideout with the fewest out. With no hideout of that kind standing (all cleared), **no new band of that kind** until one returns (§9 Q10).
- Each band knows its home (`b.home`: the hideout's index) and **goes home** every 4–7 days, after a raid with plunder, or when under half its size: it walks to the hideout and goes inside for 1–2 days (off the map, in the hideout's `bands`, as bands sheltered in a camp: `Lair` already counts them in its fight and its guess), resting and refilling (+1 man a day).
- **Plunder** a band carries (gold it robbed: `b.loot`) goes into the hideout's stash (`s.stash`): clearing the hideout pays it out with the chieftain's purse, and the captivity design's "take it back" quest points there (CAPTIVITY_DESIGN §6.2).
- A hideout cleared: its bands out on the roads become homeless and make for the nearest hideout of their kind, or roam without going home.
- **HO's placement** (22+ tiles from holdings, 8+ from roads, about half as many) suits this: bands live out on the roads between, and the hideout is the deep base. 2b starts after HO's merge.

**Seeking prey at night:** a band at night weighs any camp fire it sees (§1.7): a caravan's or a lord's camp it can beat (`stanceVs`: its power against the camp's owner's), or yours (against your band, or your camp's guard when you are away, §5.4). It breaks camp and goes for it.

### 2.2 Lords' armies (`world/camparmy.js`, `LordCamping`)

- **When:** at dusk, a lord on the march (`march`, `home`, `patrol`), outside any holding. A lord riding to **relieve** a siege marches on through the night. A lord at rest is inside his realm's holding (garrisoning it) as today; **if one of his realm's holdings is within an hour's march at dusk, he goes in instead of camping.** A siege keeps its own camp (`P.siege`, the lord's `siege` state) as today.
- **Where:** §1.3's lord score: 1–3 tiles off the road nearest him (within 3 tiles of where he stands), by water within 4; else where he stands.
- **Breaking:** at dawn, then on to his target as before.
- **At night in camp** a hostile lord does not hunt you; if you come within his camp's watch he breaks camp and comes at you by his stance (he caught you, not you him). Lords at war camped within 20 px of each other fight as today (`updateLords`), the one caught in camp at ×0.8 (§1.6).

### 2.3 Caravans (`world/camparmy.js`, `CaravanCamping`)

- **When:** at night, until dawn; one within `CAMPS.caravan.search` tiles of its destination's gate drives on in.
- **Where:** 1–2 tiles off its road, by water if any within 4: the carts in a ring.
- **A target:** a band that sees its fire (§2.1) and can beat its guards falls on it: a map fight (`startFight`, as `CaravanBrain` does today within 12 px), the guards at ×0.8 if caught. You can trade with it at its fire, toll it or attack it, as on the road (`CaravanParty.meet`), and attack it caught in camp.
- Trade slows (§9 Q1).

### 2.4 Who does not camp (v1)

- **Holdings' patrols:** their watches change at dawn and dusk and go home (`world/patrols.js`), as today.
- **Your companions' parties:** as today (they follow you, patrol from their holding, or stay in it).
- **Travellers** (the `TravellersCamp` sites by the road) stay sites: they already are a camp that moves on every few days.
- **Refugees and road encounters:** as today.

### 2.5 Attacking a camp

| Whose camp | The encounter (`startEncounter`) | What changes |
|---|---|---|
| A band's | `kind:'party'` (as meeting a band), `camp` set | their morale ×0.9 unless they saw you; the band's plunder (`b.loot`) added to the spoils |
| A lord's | `kind:'lord'`, `camp` set | as a lord, ×0.9 |
| A caravan's | `kind:'caravan'`, `camp` set | as a caravan, ×0.9 |
| A hideout (bands inside) | the hideout's fight (`Hideout.attack`, `kind:'camp'` as today) with its sheltering bands, today's `campFight` folded into it | its stash with the loot |
| Yours, with you in it | the band or lord meets you as today, `campCaught` | as today |
| Yours, you away | a map fight: the raiders against your camp's guard (§5.4) | the guard at ×0.8 if caught |
| A den, the pack at home | `kind:'monster'`, `den` set (§4) | the pack ×0.9 (caught resting) |

**The battle at a camp, a hook only:** `startEncounter` passes `camp: {k, culture}` on to the battle's setup; the field's plan (`FieldPlan#planFeatures`, doc/TERRAIN_DESIGN.md §8) may later lay tents, a fire and carts on the defender's half. Not built in any phase here.

---

## 3. Removing the fixed camps

| Today | Where | Done with it | What takes its role |
|---|---|---|---|
| Stage 9 `genCamps`, its `GEN_STAGES` row `sites` ("Placing camps") and its check (`placeCheck('sites')`) | `world/worldplace.js`, `world/worldgen.js` | deleted; the result's `camps` gone | nothing on the map: camps are mobile |
| The tiles stage 9 opened under each camp | stage 9 | no longer opened | (the map's own ground) |
| `CAMP_SPOTS`, `setCamps` | `world/holding.js`, `world/worldmap.js installWorld` | 2a leaves `CAMP_SPOTS` an empty list; 2b deletes it once nothing reads it | — |
| The router's camp nodes | `world/router.js` (`buildWayGraph` `camps`, `wayRechart`) | dropped | — |
| `occReserve` (camp ground kept from lots) | `world/lots.js` | dropped | — |
| `banditSpots` (estates kept `BANDIT_GAP` from bandits) | `world/lots.js` | hideouts only | hideouts |
| Tramples and marks round camp spots | `gfx/worldart.js` (line 57) | dropped | each camp's own yard (`siteCanvas` `gr`) |
| `DENSITY.classic.camps`, `grow.by.camps`; `WORLD_SCALE.ai.bandCamp` | `data/world.js` | deleted | `DENSITY` bandits and hideouts |
| The world setup's "N camps" | `ui/worldsetup.js` | dropped | — |
| `SITE_TYPES.camp`, `class BanditCamp`, `SITE_CLASS.camp`, `camps()`, `SITE_GAP`'s `camp` | `world/sites.js` | deleted | the band's own camp; the hideout |
| `siteSprite`'s `BanditCamp` branch | `gfx/structures.js` | a type test in phase 1, gone with the type in 2b | `Camp.look` |
| `campNear`, `campEmpty`, `campFight`; `updateBands`' dawn release; `BandBrain`'s night shelter | `world/world.js` → `world/bands.js` (phase 1), `world/brains.js` | deleted | `BandCamping` (§2.1); the hideout's own fight |
| `ON_WIN.camp` (bands sheltering) | `battle/engage.js` | the hideout's (no camp sites left) | — |
| `lairGone` (bands sheltering) | `battle/parley.js` | the hideout's | — |
| A quest's band found in a camp | `world/quests.js` line 45 | looked for in hideouts' bands | — |
| The lure's weight (bands and camps near) | `world/encounters.js roadLureW` | counts camped bands and hideouts | — |
| The wiki's camp row | `wiki.html` line 526 | dropped; a row for camps and dens | — |
| Tests | `campbands` (all of it), `garrison`, `sites`, `clicks`, `conduct`, `estateui`, `siteopen`, `pixels`, `holdingfactory`, `holdings`, `loading`, `mainmenu`, `menu`, `mapview`, `territory`, `worldgen`, `worldsanity`, `worldscale`, `visual/shot`, `visual/townshots` | rewritten to hideouts and mobile camps, or the camp checks dropped | §8 |
| Fingerprints | `worldprint` | W1–W8 and B2 re-recorded in 2a, each with its reason | — |

---

## 4. Beast dens

### 4.1 Which beasts, where

The kinds come from `data/monsters.js` (`MONSTERS`). Wild game (`data/critters.js`: rabbits, deer, stags, goats, reindeer, hares, gazelles, fowl) has **no dens**: it is prey, and keeps grazing round its home (`hx, hy`) as today.

| Kind | Its den | Ground (`habitatAt` and the tile) | Rests | Roams (leash) |
|---|---|---|---|---|
| Wolf pack | a hollow under roots and rock | a wood's edge (a forest tile with open ground beside it) or a hill face; **its habitat widened from the frost to woods and hills** (owner) | by day | at night, 160 px |
| Cave bear | a rock overhang | a hill or mountain face (as a cave stands: the rock tile with open ground below) | at night | by day, 80 px |
| Dire boars | a wallow in a thicket | grass or hills beside a wood | at night | by day, 100 px |
| Tiger | a lair in a tangle | forest, swamp wood | by day | at night, 140 px |
| Giant spiders | a nest of webs | deep wood (forest all round), swamp wood | by day | at night, 80 px |
| Giant scorpions | a burrow | open desert | by day (the heat) | at night, 120 px |
| Bog slimes | a bog pool | swamp by water | never (they keep near it) | 60 px |
| Griffin | an eyrie on a crag | a hill top | at night | by day, 200 px |
| Troll, sand wyrm | **no den**: the caves are their lairs as today (`Cave` sites); their packs on the map keep today's invisible home | — | — | as today |
| Dragon | mythic, as today | — | — | — |

Seed 1 has plenty of den ground off the holdings' land: 2,009 wood-edge tiles, 999 hill faces, 1,925 grass tiles by a wood.

### 4.2 The den

`class Den extends Site` (new `world/dens.js`): it shares the sites' page, scouting, `cleared`/`back` and drawing, but lives in its own list, `W.dens` (saved as the world piece `dens`, order 115), with its own `here()` and window key (`'den:'+uid`). A den: `{uid, id (its kind), tx, ty, x, y, seed, seen, cleared, back}`. A pack points at its den (`m.den`: the den's uid; `MON_KEYS` gains `den`); the den's point is the pack's home (`hx, hy`), so today's leash and hunting radius work from it.

- **Resting:** in its rest hours (by kind) a pack walks home and lies in its den: **its figure is hidden** and the den shows (the same rule as camps); it does not hunt you. It wakes if you come within its sight × 0.5, or at the end of its rest.
- **Roaming:** out of its rest hours it wanders within its kind's leash and hunts you within `lairHunt` (aggro kinds), as today.
- **Seen:** a den is a site: your scouts see it within your sight (`updateSites`), then it stays on the map as you last saw it.
- **Its page** (`PAGE_SCREEN`, the frame rule): what you see (tracks, bones; the pack at home or out), Scout (as a cave), **Attack** while the pack is home (the fight with them caught resting, §1.6), **Clear the den** while it is empty (§4.4), Leave.

### 4.3 Born at the den

Spawning moves to the dens (`world/monsters.js` `spawnMonster`, `monsterDay`; the stream `monsters` as today):
- **Births:** a pack under its kind's most (`MONSTERS[id].count[1]`) grows by one every `DENS.birth` (6) days at its den.
- **A young pack leaves:** a full pack for `DENS.split` (10) days sends a young pack (`count[0]`) to found a new den 15–40 tiles away, on its kind's ground, in the wilds (`lairLand`), outside any quiet land (§4.4), while the world is under its cap.
- **A new den now and then:** the daily tries (`DENSITY.daily.monsters`) found a den with a pack where a kind is scarce (as `spawnMonster` picks kinds today), so a kind wiped out comes back.
- **A new game:** each starting pack (`DENSITY` `monsterStart`) is made with its den.

### 4.4 Clearing a den

- **The pack slain** (anywhere): its den lies empty; after `DENS.back` (12) days a new pack moves in (if the world is under its cap).
- **Clear the den** (its page, while empty: an hour's work, Woodcraft trained): the den is destroyed and **the land round it is quiet**: no den is founded within `DENS.quiet.r` (16) tiles for `DENS.quiet.days` (40) days, and the nearest holding's reach grows as when a camp was cleared (`pacify`). The quiet marks are saved with the dens.
- A holding's watch that kills a pack on its land empties its den the same way (no quiet).

### 4.5 Counts

Dens count with the world: **one den for each pack of a den kind**, so `DENSITY`'s `monsterStart` and `monsterCap` (grown with the land, `density(m)`) set them. No new `DENSITY` key, so `data/world.js` is untouched. Trolls, wyrms and the dragon have none.

### 4.6 The art

A den model per kind (phase 2g, `engine/buildmodels.js`), each a 16 or 32 px cell from the engine's pieces: rocks and roots and a dark mouth (wolf), an overhang (bear: the cave model's mouth at half size), a ring of bushes round trampled mud (boar), white strands between trunks (spider), a sand mound with a hole (scorpion), a green pool (slime), a nest of sticks on a rock (griffin); bones by the mouth. Placeholders until then: the cave model (`PX.buildingModel` `cave`) for rock dens, a bush cluster for thickets.

---

## 5. Your camp as a place

### 5.1 The flow

1. **Pitch:** Make camp (Z, the dock, the ring) as today: on allowed ground, at the nearest spot (`campSpot`). Your camp now has its own point (`BAND.camp.x, y`) and **stays until you break it**. One camp at a time (`CAMPS.player.max` 1; §9 Q7).
2. **In camp:** as today (stamina +8, the wounded ×1.5, fast forward stops on danger). `P.camp` keeps meaning "you are in your camp", so every reader of it today is unchanged; `myCamp()` is the place.
3. **The camp's window:** clicking your camp, Z while in it, or the ring's **Camp**.
4. **Leave:** any travel order marches you out; **the camp stays**, with whatever its standing orders keep there (§5.2). Nothing set to stay: an empty camp, its fire out.
5. **Return:** click it (or the ring's **Back to camp**): you walk there; arriving, you are in camp again and everyone left there is with you.
6. **Break camp:** in its window (it asks first, if anything is kept there), or the ring's Break camp while in it. What was stored comes into your bag (as the bag's room allows; the rest left on the ground with a line in the log, as the bag does today).

### 5.2 Standing orders: who and what stays

Set in the window, remembered, and applied **each time you leave**:

| Stays | How you choose | While you are away |
|---|---|---|
| **The wounded** | all, or none (one toggle) | they heal at the camp's rate (`healShare` there: ×1.5, a friendly holding near, your Medicine not: it rides with you); healed men stay as part of the guard until you return |
| **A guard** | troops by kind (`railPicker`, as hiring) | they stand at the camp and fight raiders (§5.4); they never move |
| **Supplies** | the camp's own store: put food, drink, goods and gear in, take them out (`railPicker` both ways) | the people there eat and drink from it at the rest rate; beside water, the skins fill free (as yours do); with none, the wounded stop healing and one man a day deserts, the guard first |

- **The band size:** everyone at your camp still counts against your band's size and is paid each day (`bandWages`), so a camp cannot hold an army past your cap (§9 Q6).
- **Companions and prisoners** always ride with you in v1.

### 5.3 What the people there are

The guard (and the wounded) are a small party: `class CampGuard extends Party` (`mapKind` `campguard`, `faction` `player`, no brain: it stands), made from the camp's record when you leave and on loading, on the map at the camp (so map fights, stance and power work for it as for any party), never drawn as a figure (the camp is). Back with you, it is folded into your band (`partyRoster(P)`: its groups restored as the wounded's are).

### 5.4 Raids on your camp

- **Who:** any band, or any pack of an aggro beast kind (wolves, tigers, spiders, scorpions, slimes, griffins) when the camp holds food and no guard.
- **When:** no extra dice. A band that sees the camp (in its sight by day, its fire at night, §1.7; an empty camp has no fire) weighs the guard (`stanceVs`: its power against the guard's; an unguarded camp's is 0) and comes for it if it would attack. A band seeking prey at night (§2.1) counts it as prey.
- **How:** a map fight at the camp, the guard caught at ×0.8 unless its watch saw them first. You can ride in and join it as any map fight.
- **Lost:** the store taken (the band carries it as plunder to its hideout: §2.1, the stash), `CAMPS.raid.kill` (30%) of the wounded killed (counted as lost, `supplyLost` "killed in a raid"), the tents slashed (`raided`: drawn torn; Re-pitch in its window mends them). The guard's losses are the fight's.
- **Won:** the raiders routed as in any map fight.
- **How you hear:** at once: a log line and a notice ("Your camp near X is raided"), the camp's mark lit red until you look (§9 Q8). If you are in sight, you see it (fast forward stops, `dangerInSight`).

### 5.5 Saving

`BAND.camp` (the `band` piece) becomes `{x, y, at, keep:{wounded, guard:{kind:n}}, store:{goods:{id:n}, gear:[id]}, away:{tc, wounded, woundedGroups, sick} (only while you are away), raided}`, each written only when it has anything, so a save without a camp is as before. No migration.

### 5.6 The window

The camp's window is a page (`PAGE_SCREEN`, `ui/window.js`): a header, a banner of the camp as it stands, the choices, and the bottom bar from `nav()`. Esc follows the bar's Back. Arial, `style.css`'s window sections; on a phone in landscape (844 × 390) the choices are the page's key actions in rows of up to four, the pickers full height.

```
┌──────────────────────────────────────────────────────────────┐
│ [fire] Your camp                                 412 g       │
│        Ashford vale · pitched day 14                         │
├──────────────────────────────────────────────────────────────┤
│ [ the camp as it stands: tents, fire, your banner ]          │
│ Resting: stamina +8 an hour, the wounded mend faster.        │
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

- **Wait** (until dawn, until rested, until the wounded are fit): time runs at the speed you set and stops when it is done or anything hostile comes into sight; a bar over the map says so with a Stop button (today's stay bar, `#staybar`, shared: §6 R8).
- **Wounded, Guard, Stores:** each opens its picker (`railPicker`), Back to the camp page.
- **Back** (left): closes the window, you stay in camp. **March out** (right, the way out): you leave, the standing orders applied. Away from it (opened from the map), the right button is **Go there**.

---

## 6. Refactors first (phase 1)

Behaviour-preserving: the world fingerprint (`worldprint -Seed 1`), the battle suites and `aishare`, and `rts -Seed 1,2,44` unchanged; the camp, supply and ring suites pass as they are.

| | What | Files |
|---|---|---|
| R1 | `CAMPS` (`data/camps.js`): `SUPPLY.camp`'s numbers moved there (`ground`, `player`), `SUPPLY.camp` a one-line alias | `data/camps.js` (new), `world/supply.js` |
| R2 | `class Camp` over today's camp: `BAND.camp` is a `Camp` of kind `player`; its record stays `{at}` (its `x, y` read from you while you are in it, as today), so saves are byte-identical. `bandCampEnt` → `Camp#draw`, `campPole` → `Camp#banner`, `campCaught` → `Camp#caught` (both sides: `opts.caught` read in `moraleInit`; no AI camp yet, so nothing changes) | `world/camp.js` (new), `world/supply.js`, `battle/setup.js`, `battle/morale.js` (one line each) |
| R3 | The ground: `campAt`, `campGround`, `campXings`, `campRing`, `siteBox`, `campKeptClear`, `campAcross`, `campSpot` moved to `CampGround` in `world/camp.js`, taking the walker and the kind (yours by default); the tile test split out of `campGround` (`CampGround.tiles`). The old names one-line aliases | `world/camp.js`, `world/supply.js` |
| R4 | `Camps` (the view), `Camping` (the policy registry, `step` false for every kind), `Camps.parties()` in `allParties` (empty now) | `world/camp.js`, `world/parties.js` |
| R5 | The brains' hooks: `Camping.step(o, d)` at the top of `LordBrain`, `BandBrain`, `CaravanBrain` `think`; `Party.draw` skips a camped party; `Brain.sight` asks `Camps` (the same number while no fire rule is on) | `world/brains.js`, `world/parties.js` |
| R6 | The bands' world code moved out of `world/world.js` into `world/bands.js`: `spawnBandit`, `campNear`, `campEmpty`, `campFight` (a pure move) | `world/bands.js` (new), `world/world.js` |
| R7 | `stanceVs(pw, against)`; `stance(pw)` = `stanceVs(pw, partyPower())` | `battle/engage.js` |
| R8 | `siteSprite`'s `s instanceof BanditCamp` → `s.type==='camp'`; `drawWorld` draws `Camps.draw` (only yours now) | `gfx/structures.js`, `gfx/render.js` |

Script tags for the three new files in `Ashmark.html` and `wiki.html` at the same places (`data/camps.js` with the data, `world/camp.js` before `world/supply.js`, `world/bands.js` after `world/world.js`).

---

## 7. Phases

Phase 1 first, alone. Then up to five agents at once (the owner's limit), each owning its files outright. **2b waits for HO's hideouts to merge.** The coordinator re-records the fingerprints at each merge, each value with its reason.

| Phase | What | Effort | Owns | Fingerprints that move | After |
|---|---|---|---|---|---|
| **1** | The camp refactor (§6) | M | `data/camps.js`, `world/camp.js`, `world/bands.js` (new); `world/supply.js`, `world/world.js`, `world/parties.js`, `world/brains.js` (hooks only), `battle/setup.js`, `battle/morale.js`, `battle/engage.js`, `gfx/render.js`, `gfx/structures.js` (one line each); `Ashmark.html`, `wiki.html` tags | none | — |
| **2a** | The generator without camps (§3, the map side) | M | `world/worldplace.js`, `world/worldgen.js`, `world/holding.js`, `world/worldmap.js`, `world/router.js`, `world/lots.js`, `gfx/worldart.js`, `ui/worldsetup.js`, `data/world.js`; tests `worldgen`, `worldsanity`, `worldscale`, `holdingfactory`, `holdings`, `loading`, `mainmenu`, `menu`, `mapview`, `territory`, `worldprint` | **W1–W8, B2** (the tiles stage 9 opened, the router's nodes, the lots, the painted marks, everything after) | 1 |
| **2b** | Bandits: mobile camps, hideouts as home (§2.1, §3's site side) | L | `world/bands.js`, `world/brains.js`, `world/sites.js`, `battle/engage.js`, `battle/parley.js`, `world/quests.js`, `world/encounters.js`, `world/defence.js` (the watch seeks band fires), `world/parties.js` (`BandParty`); tests `campbands` (rewritten as `bandcamps`), `garrison`, `sites`, `clicks`, `conduct`, `estateui`, `siteopen`, `pixels`, `visual/shot`, `visual/townshots`; `wiki.html`'s camp rows | W7, W8 (bands start at hideouts, camp, go home); W6 if a band camps in view at its night draws | 1, HO |
| **2c** | Lords and caravans camp (§2.2, §2.3) | M | `world/camparmy.js` (new), `world/caravans.js`; tests new `armycamps` | W7 (three days with nights); W8 only if a night falls in its 600 frames | 1 |
| **2d** | Your camp as a place (§5) | L | `world/supply.js`, `world/stay.js` (the shared rest bar), `world/world.js` (`marchStep`, `healShare`, `woundedDay`, `bandWages`), `world/campguard.js` (new), `ui/campwin.js` (new), `ui/input.js` (Z), `style.css` (the camp window's section); tests `camp`, `supply`, `ring`, new `campplace` | none expected (W7's hero never camps) | 1 |
| **2f** | Beast dens (§4) | L | `world/dens.js` (new), `world/monsters.js`, `data/monsters.js` (wolves' ground, the `DENS` table); tests `monsters`, `beastai`, `wilddensity`, new `dens` | W7, W8 (packs at dens, wolves in the woods); W6 if a den or a resting pack is in view | 1 |
| **2e** | Night fires (§1.7, your side) | M | `world/fires.js` (new: the far fires' list, hover and click), `gfx/render.js` (the pass over the fog); tests new `fires` | W6 at its night draws, once camps exist near its spots | 1; best after 2b, 2c |
| **2g** | Camp and den art (§1.4, §4.6) | M | `engine/buildmodels.js`, `engine/pieces.js`, `gfx/structures.js` (`campSprite` kinds, `denSprite`), `engine/gallery.html`; tests `buildmodels`, `models`, `pixels` (its model part) | W6 if a camp or den is in view | 1 |

**Waves:** 2a, 2b, 2c, 2d, 2f together (five); then 2e and 2g. Line requests between them should not be needed: phase 1 puts every hook in place, and the policies (`BandCamping`, `LordCamping`, `CaravanCamping`) live in their owners' new files. Two known touches: `tests/structure.js`'s pinned day and frame orders need no change (the camps' work runs in the hour and inside the brains' frame; the dens' births inside `monsterDay`); and `prototype/README.md` is updated by each phase for its own part.

---

## 8. Tests

Targeted suites only, as the rules say; the coordinator runs the sweep after each merge.

| Phase | Tests |
|---|---|
| 1 | `camp`, `supply`, `ring`, `stay`, `sites`, `campbands`, `garrison`, `structure` pass unchanged; a new `camps` suite: a camp is a `Camp`, its record `{at}` saved byte for byte as before, `Camps.all()` is yours alone, `CampGround.tiles` agrees with `campGround` on the tile rules over a sample, `stanceVs` matches `stance`; fingerprints held |
| 2a | `worldgen` (no `camps` in the result, no stage row), `worldsanity`, `worldscale` (no camps in `DENSITY`), `holdingfactory`, `holdings`, `loading`, `mainmenu`, `menu`, `mapview`, `territory` (pacify from a hideout), `worldprint` re-recorded with reasons |
| 2b | `bandcamps` (new): at night a band camps 3–8 tiles off a road, never on one, 10+ tiles from holdings, by water or cover when there is any; its figure hidden and its camp drawn; stays 1–3 nights then moves 12–30 tiles; a patrol in sight sends it 30–50; tired after 14 hours it camps by day; lying in wait it ends on a caravan; a band starts at a hideout and goes home and refills; plunder into the stash and out with the hideout's loot; a cleared hideout's bands go to another; saved and loaded with its camp; attacking it caught: morale ×0.9, seen coming: none; `sites`, `garrison`, `clicks`, `conduct`, `siteopen`, `estateui`, `pixels` without camp sites |
| 2c | `armycamps` (new): a marching lord camps at dusk 1–3 tiles off his road, breaks at dawn; one near his realm's holding goes in; relief marches on; a siege as before; a caravan camps at night in a ring, a band that sees its fire and can beat its guards falls on it; saved and loaded; the days a march and the deliveries a day measured (INFO) for §9 Q1 |
| 2d | `campplace` (new): pitch, leave, the camp stays with its standing orders; the wounded heal there and join the guard; the store eaten from, filled beside water; return and everyone is with you; break and the store into the bag; the guard counts against your size and is paid; a band raids an unguarded camp, a stronger guard holds; the raid's losses and the notice; one camp at a time; the window: header, choices, `nav()` bar with Back left and March out right, Esc = Back, at 844 × 390 nothing clipped; saved and loaded; `camp`, `supply`, `ring` updated (a travel order leaves the camp, no longer breaks it) |
| 2e | `fires` (new): a fire beyond your sight drawn at night over the fog, not by day; ×0.5 in a wood, none across a peak, ×0.5 across hills; hover says Firelight, click walks there; your camp's fire brings a band from afar; a holding's night watch runs down a band camped on its land |
| 2f | `dens` (new): each den kind on its ground, off holdings' land; the pack rests at home by its hours (hidden) and roams by its leash; births up to its most; a young pack founds a new den 15–40 tiles off; the pack slain, the den empty 12 days; Clear the den: no den within 16 tiles for 40 days, `pacify`; trolls and wyrms none; the count follows `DENSITY`; saved and loaded; `monsters`, `beastai`, `wilddensity` updated |
| 2g | `buildmodels`, `models`: each new model's spec, size and culture variants; `pixels`: camps and dens on their own ground |

---

## 9. Open questions for the owner

Each with the default the phases will build unless you say otherwise.

1. **War and trade slow down:** lords and caravans halt half of every day (night is 12 of 24 hours). *Default:* accept it; 2c measures days a march and deliveries a day, and if trade falls by more than a quarter, caravans move faster by day.
2. **Rest rates:** yours as today (+8 an hour, the wounded ×1.5). *Default:* unchanged.
3. **AI healing:** AI parties have no wounded. *Default:* none in v1; bands refill +1 man a day at their hideout.
4. **Readiness:** you −8 morale (today); an AI party caught ×0.9 of its starting morale; a map fight ×0.8. *Default:* these.
5. **Raids on your camp:** no extra dice; any band (or aggro pack, when there is food and no guard) that sees it and would attack does. *Default:* this.
6. **Your guard counts against your band's size** and is paid. *Default:* yes.
7. **One camp at a time.** *Default:* yes; Make camp elsewhere asks to break the other first.
8. **How you hear of a raid:** *Default:* at once (log and notice); the alternative is a survivor reaching you after hours by the distance.
9. **What a raid costs:** the store, 30% of the wounded, the tents slashed. *Default:* this.
10. **Bands only from hideouts:** with every hideout of a kind cleared, no new bands of it until one returns (10 days). *Default:* yes (clearing hideouts quiets the roads).
11. **Dens:** the pack slain, the den empty 12 days; Clear the den: quiet within 16 tiles for 40 days. *Default:* these.
12. **Smoke by day, a cold camp for you (no fire, slower rest), fires on the minimap:** *Default:* none in v1.

**What made it harder than expected** (for the report):
- `campGround` paints the art's chunks to see what stands there: about 6 ms a call far from you, 29 ms a `campSpot`. AI camps need the cheap tile test and a full check only near you (§1.3).
- The band-camp rules, taken as filters, leave few spots (700 on seed 1, 36% of the road with one within 10 tiles), and `campGround` passes only 11–14% of those: they must be scores with fallbacks.
- Your camp has no position of its own today (drawn at `P.x, P.y`); the place needs one, and `P.camp`'s meaning ("you are in camp") kept apart from the place.
- AI parties have no stamina or wounded, so "tired" and "healing" need a small new counter.
- Night is half the day: halting at night halves the armies' and caravans' pace.
- Stage 9 opens the camps' tiles and the router and the lots use the spots: removing it moves every world fingerprint.
- Lights are drawn only in your sight, and the fog masks everything that moves: far fires need their own pass.
- Stance is always against you (`stance` vs `partyPower()`), and map fights find their sides among the parties: a camp's guard must be a party and the AI needs `stanceVs`.
- Wolves are frost-only in the data; the owner's woods and hills move the beasts' placement (W7, W8).
- Good news: beasts already have an invisible lair (`hx, hy`, leash and hunting radius), and `Lair` already counts sheltering bands: dens and hideout homes build on both.
