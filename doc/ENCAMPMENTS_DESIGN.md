# Encampments: camps as places where people live

Status: **design, revision 1** (2026-11-14). **Phase 1 built** (2026-11-14, §12); the rest waits. This doc folds in `CAMPS_DESIGN.md` revision 2 (mobile camps, dens, your camp as a place): the owner, 2026-11-14, "same mechanic just different purpose". Where the two disagree, this one wins; `CAMPS_DESIGN.md`'s decisions D1–D13 still hold.

## The owner's brief (2026-11-14)

"Can you make a camp or location like actual places? I mean pilgrim camps, orc hunters etc. make them have some people standing there have their life etc. Camp can be more larger area or have more tents etc based on people live there. And some camps are not permanents, they may travel around (like caravan) etc. ... Also the same goes for monster lair, it should follow the same pattern with bandits lair where they live in and out."

His answers to revision 0's questions:
1. **Goblins too:** goblin camps join the model (people living there, the home rule).
2. **Counts by area:** "scale based in area, I don't want it to be too crowded, at least one for each and scale based on the world".
3. **A camp can grow into a hamlet.**
4. **Wandering camps travel visibly** on the map and can be attacked by bandits and lords.
5. **All the daily-life detail listed, for now.**
6. **The earlier camps design folds in:** "same mechanic just different purpose".

## 1. The idea in one paragraph

An **encampment** is a small community: a number of people (its **population**), each with a **role**, living in tents round a fire. Its tents and its ground grow with its people (one tent for every few). They live by the clock: they sleep in the tents at night with a watch by the fire, cook and eat at dawn, go about their work by day (hunting, cutting wood, praying, trading, playing music), and gather at the fire at dusk. You see this only when it is within your sight; out of sight the camp is its record and its tents. Some camps stay where they are, some move with the seasons, and some travel the roads as a party. A lair is the same thing for outlaws, goblins and beasts: a home they live in, go out from and come back to.

## 2. Kinds

One table, `ENCAMP` in `data/encampments.js`. Each kind:

| Kind | People | Lives | Ground | Roles (by share) | What you do there |
|---|---|---|---|---|---|
| Merchant caravan | human, 8–14 | wandering | by a road | traders, guards, drovers, a cook | trade, hire, the fire |
| Dwarf prospectors | dwarf, 5–10 | seasonal | hills by mountains | miners, a smith, guards | trade (iron), hire, the fire |
| Elf wanderers | elf, 5–9 | wandering | a wood's edge | rangers, singers | trade (timber, fruit), hire, the fire |
| Orc hunters | orc, 6–12 | seasonal | grass or hills by a wood | hunters, skinners, a cook | trade (furs, meat), hire, the fire |
| Pilgrims | any, 6–16 | wandering | by a road | pilgrims, a priest | blessing, the fire |
| Minstrels | any, 4–8 | wandering | by a road | players, dancers | a song, the fire |
| Charcoal burners (new) | human, 4–8 | settled | a wood's edge | burners, woodcutters, children | trade (timber, tools), the fire |
| Desert nomads (new) | human, 8–16 | seasonal | desert | herders, traders, guards, children | trade (spice, cloth), hire, the fire |
| Hermit (new) | one | settled | wild land | the hermit | his counsel (insight, a place on your map), the fire |
| Refugees (new) | the region's people, 6–14 | settled | by a road, near water | folk, children, a few guards | food and work for them; they may grow into a hamlet (§7) |

**Goblin camps** (`GoblinCamp`, today's) and **bandit hideouts** (`Hideout`) are encampments of outlaws: the same people, tents by population, and the home rule (§6). Their fight and pages stay as they are.

**Lords' and caravans' camps, and yours** (`CAMPS_DESIGN.md` §2–§4, §7; the gate camps and your stay camp built 2026-11-14 with `CampSite`) are the same drawing and the same people: their soldiers are the population, their roles are the watch, the cooks and the sleepers. Only the purpose differs.

## 3. Population, tents and ground

- **Population** `pop`: drawn from the kind's range when made, then changed by life: births and newcomers (settled, slowly), losses (raids), people leaving (a wandering camp splits off a second band past its most).
- **Tents:** one for every `ENCAMP.tents.per` people (3 for folk; an army's 8 as today, `CAMP_SITE.men`), at least one, at most `ENCAMP.tents.most` (8); the hermit has one tent. Laid out by `CampSite.layout` round the fire, ring after ring, each tent where the ground lets it stand (`CampSite.tentOk`: no road, water, field or building).
- **Ground:** the camp's footprint is its tents' box; that box is its click area, its reach, and what keeps other camps and sites off it.
- **Pieces by kind:** wagons (merchants, minstrels), a charcoal mound (burners), a drying rack with hides (hunters), a shrine pole (pilgrims), pack animals (prospectors, nomads). Phase 1 draws the tents, the fire and the people; the pieces come with the art phase.

## 4. Daily life (drawn only within your sight)

The people are not saved: they are made from the camp's seed when it comes into sight, as the estates' workers are (`world/folk.js`), and placed where the hour says they should be, so a camp looks the same whether you watched it all day or just arrived.

| Hours (`Clock.frac`) | What they do |
|---|---|
| Night (.5–1) | asleep in the tents (unseen); one watch by the fire, another walking the ring; the fire bright |
| Dawn (0–.06) | out of the tents, to the fire: the cook stirs, the others stand or sit round it |
| Morning to afternoon (.06–.4) | each at his role's work: **guards** walk the ring; **cooks** at the fire; **traders** by the goods; **hunters, woodcutters, miners, herders** walk out 3–6 tiles to a spot of their ground (a wood, a rock, the grass) and back; **priests and pilgrims** kneel in a ring at midday; **players** practise; **children** run between the tents |
| Dusk (.4–.5) | everyone back at the fire, sitting; the players play |

Each person has a home tent, a work spot and a seat at the fire, all from the seed. They walk at a folk's pace, stop, turn and idle; a person's look comes from the kind's race and his role (`personSprite` for folk; soldiers' sprites for guards and hunters).

**Danger:** a band, a beast or an army near the camp sends its folk to the tents and its guards to the fire (as the estates' workers flee, `fieldDanger`).

## 5. Three ways of living

- **Settled** (charcoal burners, a hermit, refugees): they stay. A settled camp grows (§7).
- **Seasonal** (prospectors, orc hunters, nomads): they stay `ENCAMP.stay` days (20–40), then strike camp and **travel** to a new spot of their ground 30–80 tiles away.
- **Wandering** (merchants, elves, pilgrims, minstrels): they stay 3–8 days, then travel. Pilgrims go from shrine to shrine; merchants from holding to holding along the roads; minstrels from town to town.

**Travelling** (phase 4): a camp that strikes becomes a **party** on the map (a `CampParty extends Party`: its people walking with their carts and pack animals, its guards round them), moving by the router as caravans do. It is seen and can be met, followed, and **attacked**: bands fall on weak ones for their goods, and a lord at war with their people may too. Beaten, they lose goods and people, and may scatter (gone) or limp on. At its new spot it pitches again, tent by tent, as your camp does (`CampSite.pitch`). Today's travellers' camps "move on" by vanishing and appearing elsewhere; until phase 4 they keep doing that, but only while you cannot see them.

## 6. The home rule: living in and going out

One rule for every home with people who go out from it: an encampment's workers, a hideout's bands, a goblin camp's warbands, a beast den's pack.

- A home has **residents**; some are **in** (drawn there, counted in its fight), some are **out** (on the map as a party, or at work nearby).
- **Going out** by the kind's hours and needs: bands out to raid by day and home by night or when hurt; goblin warbands the same (they already shelter by night: `world/goblins.js`); hunting parties of orcs out for a day's hunt with their kill brought back; a beast pack out by its roaming hours (`CAMPS_DESIGN.md` §6.1's table) and back to rest.
- **Coming back:** at their hour, or when hurt, laden or chased. Home, they heal and the home's count grows by them.
- **Born there:** new bands only from hideouts (D10), new packs only at dens, new hunters at the camp.
- **Attacking a home:** you fight those **in**; those out may come back while you fight (late arrivals at the ring's edge, as in any world battle). A home caught at night has fewer awake (the caught-in-camp rule, `CampWake`).

**Dens** (`CAMPS_DESIGN.md` §6, unchanged): wolves, bears, boars, tigers, spiders, scorpions, slimes and griffins get a den on their ground; trolls, sand wyrms and dragons keep their caves.

## 7. Growing into a hamlet

A **settled** camp that thrives grows: refugees, charcoal burners, or a seasonal camp that stayed past its time on good ground.

- Each day a settled camp's population grows by a chance (`ENCAMP.grow.daily`), more with water and a road near, less in danger, none past its kind's most.
- At `ENCAMP.grow.hamlet` (16) people, on ground a hamlet may take (the hamlets' rules: room for its lots, off other holdings' land), it **becomes a hamlet**: a new holding of the realm whose land it is on (or free folk off realm land, as the hamlets made by the generator), its tents replaced by a hamlet's buildings over a few days, its people its first villagers. It leaves the sites list and joins `TOWNS`.
- **You can help:** give refugees food or coin (their page), or clear the bands near them, and they grow faster. A hamlet you helped found remembers you (reputation there).
- The world keeps a cap on hamlets founded this way (`ENCAMP.grow.most`, by world size).

## 8. What you do there

Today's travellers' pages stay (`TravellersCamp`: the wagons, the hiring desk, the campfire with blessing, song, news and rest) and become the encampment's, by its kind's roles: a kind without traders has no Wagons, one without sellswords no hiring. New:
- **Talk to someone** in the camp: a click on a person in sight opens the page at that person's place (the trader at the wagons, the priest at the fire).
- **The hermit's counsel:** insight (Wisdom practice) and the nearest unknown place on your map, once a week.
- **Refugees:** give food or coin (renown, their growth), take some into your band as levies.
- **Jobs** (phase 5): escort a wandering camp to its next spot; hunt the beast that troubles hunters; bring medicine to refugees; find a pilgrim lost on the road. They go through the quest board's `Troubles` service as any cause.
- **Attacking a peaceful camp** is a crime: honour and reputation lost with the realm whose land it is on and the camp's people (their race's realms), as robbing a caravan is.

## 9. Counts (the owner: "at least one for each, scale based on the world")

`ENCAMP.count`: each kind's number at the base world's land (`DENSITY.grow.land`, 32,042 tiles), grown by `(land / base)^pow` with `pow` .5, rounded, **at least one**. A kind whose ground the world lacks (no desert: no nomads) gets none. The bases sum to 13, so a base-sized world has 13 camps, the default Normal world (seed 1, land 3.19 × the base) about 24, near today's 21 travellers' camps. `DENSITY.sites.travelers` gives way to it.

## 10. Code: what exists, what is new

| | What | Where |
|---|---|---|
| `Encampment extends Site` | today's `TravellersCamp`, generalised by kind (`TravellersCamp` stays as an alias; the site type stays `travelers`, so saves load) | `world/encampments.js` (new; `TravellersCamp` moves there from `world/sites.js`) |
| `ENCAMP` | the kinds, roles, counts, schedules, tents, growth | `data/encampments.js` (new) |
| `CampSite` | tents by population: `layout(key, x, y, n, per)`; draw takes the camp's tent count | `world/campsite.js` |
| `CampFolk` | the people in sight: made from the seed, placed by the hour, walking their day | `world/encampments.js` |
| `CampParty extends Party` (phase 4) | a travelling camp | `world/encampments.js` |
| `Home` (phase 2) | the home rule's record on any site with residents (`in`, `out`, the hours) | `world/home.js` (new) |
| `Den extends Cave` (phase 3) | `CAMPS_DESIGN.md` §6 | `world/dens.js` |

## 11. Phases

| | What | Fingerprints that move |
|---|---|---|
| **1** | **Settled encampments with people:** `ENCAMP`, `Encampment` (all ten kinds, replacing the travellers' six), tents by population through `CampSite`, people living their day in sight, counts by area with at least one of each, the hermit's and refugees' pages. Wandering and seasonal camps still move on unseen | worldprint (the sites: their kinds, counts and places) |
| 2 | **The home rule** for hideouts and goblin camps (bands live in and go out), orc hunting parties | W7, W8 |
| 3 | **Dens** (`CAMPS_DESIGN.md` §6) | W7, W8 |
| 4 | **Travelling camps** on the map, attacked by bands and lords; seasonal moves; lords' and caravans' camps on the march (`CAMPS_DESIGN.md` §4) | W7, W8 |
| 5 | **Growth into hamlets**, camp jobs, crimes | W7, W8 |

Your camp as a place (`CAMPS_DESIGN.md` §7) follows phase 4, on the same `CampSite` and people.

## 12. Status

- **Phase 1: built** (2026-11-14). `data/encampments.js` (`ENCAMP_KINDS`, `ENCAMP_ROLES`, `ENCAMP`), `world/encampments.js` (`Encampment`, `CampFolk`, `ENCAMP_GROUND`, `encampClear`), `CampSite.layout` and `draw` taking people to a tent; `tests/encampments.js`. On seed 1: 26 camps (merchants 4, prospectors 2, wanderers 2, hunters 4, pilgrims 4, minstrels 2, burners 2, nomads 2, hermit 2, refugees 2).
  - **Phase 1's rest, built 2026-11-14** (the owner: "make that happen"): **a click on one of its people** (`CampDweller`, a world object within your sight; named from their people's names, `FOLK_NAMES`) opens the camp's page at that person's place (`ENCAMP_ROLES` `at`: a trader at the Wagons, a guard at the Sellswords, the cook at the Campfire; a place the camp lacks: the fire), the greeting over it (`say`); the tip gives the name and calling. **Each kind's pieces** (`ENCAMP_KINDS` `props`, `ENCAMP_PROPS`): wagons, carts, crates, barrels, woodpiles, a stall and a shrine from the engine's 16 px models; drying racks of hides and charcoal mounds with thin smoke drawn here (`propPic`, `propSmoke`); laid once from the seed round the tents where the ground lets each stand (`Encampment#props`), and on the camp's page banner. The traders stand by the wares, the drovers about the carts, the burners at their mounds. **Walks to work go by the router** (`Router.travel`, `WAY.folk`, past `ENCAMP.folk.route` tiles): round water and rock; a work spot must be reachable (`Router.reach`). **Their animals** (`beasts`, `ENCAMP.folk.graze`; built 2026-11-14): the prospectors' two pack goats, the nomads' camels and goats, tethered past the tents and grazing round the tether by day, standing by night or with danger near, drawn as the herds are (`critterArt`). **The woodpile** is drawn here, logs stacked with their cut ends out.
  - **Camp art, 2026-11-14** (the owner: "make each object such as barrel etc more detailed", "if they are a cluster then just stack them", "make more tent variety", then "it should be top down view"): every tent and piece is an engine model (`engine/build-camp.js`), at the figures' scale (the owner: "so their portion fit with the unit sprites?": 5 px a metre, a man 8 or 9 px; the tents, the wagon and the stall in 32 px cells, a door a man walks through, a yurt's wall a man high, the tepee tallest; barrels, crates and sacks waist to chest high in 16), drawn by `model.js` in the map's own view like every building: roofs seen from above, fronts below, lit from the upper left, outlined, snowed in the frost. **Seven tent styles:** ridge, bell (a pennant on its pole), tepee (stitched hides, a bundle by its door), yurt (banded felt, a crown ring), pavilion (striped walls, a hipped roof, a pennant), lean-to (a sheet on poles, a bedroll), pup tent. Each kind has its own (`ENCAMP_KINDS` `tents`: styles, cloth, trim; the first tent in its first style): the orc hunters' hide tepees and yurts, the minstrels' striped pavilions, the nomads' dyed yurts, the refugees' patched lean-tos. Any colour is the engine's nearest of `PX.CAMP_COLOURS`. An army's camp (yours, a lord's by a gate): plain canvas ridge, bell and pup tents, the first, the commander's, a pavilion in its side's colour (`CampArt.army`). **Pieces:** barrels hooped in iron, braced crates, sacks with a coil of rope, logs in stepped rows with a block and axe, a covered wagon, a cart and its load, a market stall striped in the camp's trim, a wayside shrine with candles and flowers, a rack of hides with a skull on its post, a charcoal mound of earth and turf with glowing vents. Barrels, crates, sacks and logs (`ENCAMP_PROPS` `stack`) form one heap per camp, standing on one another (the model's own heights). `gfx/campart.js` `CampArt` asks the engine for them. **Tents near their fire:** an encampment's tents stand within `ENCAMP.tents.rings` (2) rings. A camp whose tents cannot stand there (trees the generator does not see) moves its fire, when first drawn, to the nearest spot within `ENCAMP.ground.r` px where they can, never onto a road (`Encampment#ground`, kept); with none, its people sleep round the fire.
  - Fingerprints: W6–W8 and B2, and the battle suites' cases that begin a game (actorrules, attackrules, battleresolution, battlesetup, aishare's battle), re-recorded: the camps' placement moves the start stream's later draws. With the old placement put back over the rest of the change, every old value holds.
