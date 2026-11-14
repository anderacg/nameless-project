# Outposts: a realm's flags on its land, their towers and guards

Status: named outposts in the code too since 2026-11-12 (`world/outposts.js`, `data/outposts.js`, `Outposts`, `Outpost`, `OUTPOST`; their sites' saved type `'outpost'` since 2026-11-14, was `'standard'`: `OUTPOST_TYPE`; the owner, "make sure the standard term is the outpost"). Before that, "standards" in the code and "outposts" to the player. **Phase 1 built (2026-11-10)**: the outposts placed, drawn (a stone plinth, a pole and crossbar, two banners; a watchtower or stone tower from level 2), held, on the minimap and the full map, saved; taken by you (its guards beaten, your banner up after `OUTPOST.hold` hours by it) for the realm you serve, for yourself with a holding of your own, else handed to a realm near or left to no one; a realm's guards back a day. **Phase 2 built (2026-11-10):** its sentries walk their beat round it in your sight (up to three, the game's clock); held in peace it grows a level (8 days to a watchtower, 14 more to a stone tower), paid in timber, then timber and stone, from its realm's nearest holding's stores, or waits on them; taken, its tower lies broken (its guards one level fewer, its tower's top gone in its picture) and is mended after 4 days once 6 timber and 6 stone are paid. **Phase 3 built (2026-11-10):** once a day, a lord at war with its realm (or come for a lair or a standard no one holds) with twice its guards or more within 6 tiles takes it for his realm, its tower broken; a band by one held by one guard or none takes it for its lair (their rag, their men its guards, at most 12), a band riding out of it every 4 days to raid the roads round it while fewer than 2 are out; you drive them out as you take a standard (it is then no one's, your banner going up); a lair counts in its province's danger; yours and your employer's lift the fog 7 tiles round them; no band is raised within 9 tiles of a held one; word of each taking as the world's news go. Also: guards you slew in a fight you lost stay dead; yours keep a man a day from your nearest holding's garrison (while it keeps 4). **Phase 4 built (2026-11-10), and renamed:** the owner, "can we rename it to something more straightforward?": to the player a standard is now an **outpost** ("the Highmoor ford outpost"; the code and this design keep the word standard). Its quests: a lord at war asks you to take one for his realm (the nearest held by a realm at war with his, or by a band) or to retake one of his realm's own; a captain of the watch, to drive a band from the one near it made its lair; a steward, to mend the broken tower of one of his realm's, with the timber and stone you bring (its page's Mend its tower). **Phase 5 built (2026-11-10):** its tower in battle. A fight at an outpost is now fought on the world map round it. A standing tower's footprint is raised (a watchtower 2 levels over the ground, a stone tower 3), sheer all round but for a ladder three cells wide on the side away from your army. Up to 2 (watchtower) or 4 (stone tower) of its archers are posted on its top as their own group, which holds its post. They are drawn up on the tower's platform and shoot from its height (HILL.range a level), their arrows loosed from up there. No blade reaches them from the ground, so you climb the ladder or shoot them down. A broken tower or a flag post alone gives no perch. **Its land built (2026-11-10):** each held outpost claims the land round it for its realm (`OUTPOST.land.reach`: 5, 7, 9 by level, one level fewer while broken), as a holding's reach does, after every holding's own and only where its reach beats theirs. Its tiles count as its realm's nearest holding's, so borders, the tint, the minimap, yields and whose land you stand on all follow the outposts. Taken, the land round it changes hands with it. A band's lair, one no one holds, and one you have yet to hand over claim none. **The last of §6 built (2026-11-10):** a lord at war asks you to hold one of his realm's outposts near his foes until relief comes: 12 hours by it, three waves of his foe's men (under its nearest holding's banner) marching on it from 12 tiles off, their foe's way, each met there and beaten before relief comes (the outpost's own guards fighting beside you, their archers posted on its tower); a wave that reaches it while you are away takes it; left more than 2 hours once begun, the job is lost; beaten or run off, the outpost is theirs. A lord at war also asks you to scout his foes' outposts near him (up to three) unseen: each looked on from within 6 tiles, never within 2.5 tiles of a guarded one by day (half that by night). Their towers in battle now show their ladder, and their archers fall back from it once a foe is up on the top. Every part of this design is built.

**The owner, 2026-11-10** (a photo of tall poles on stepped stone plinths, crossbars and tattered banners hung from them): "every factions will also have a static flag in their territory, and around that they may have tower or buildings to defense (have a guard patrol around) that area. This tower and flag can be captured by another factions or even bandits, goblin. Which will lead to quests, etc as well".

**Readers:** the owner, and whoever builds §8.

## Decisions (the owner's answers, 2026-11-10)

1. **Where:** a few in each province, at road crossings, passes and fords, and at its key areas: natural resources (ore veins, fishing grounds: `world/resources.js` deposits).
2. **What holding one gives:** all four of land claimed round it, sight, safety and renown (§4).
3. **Who it is taken for:**
   - you take one for whoever you serve (your employer, `P.fac`), and sometimes a realm asks you to, as a quest;
   - for yourself only once you have a realm of your own (a holding of yours);
   - until then, one you take you may hand to a realm near it.
4. **Taken by bandits or goblins:** it becomes a lair that raids the roads round it, cleared like a hideout.
5. **Its tower in battle:** yes, archers shoot from it, in the first versions.
6. **Rebuilding:** a tower damaged in a capture mends slowly by itself but needs resources (timber, stone), and there may be a quest to help rebuild or repair it.

## 1. What an outpost is

A place on the map of its own kind (`Outpost`, a `WorldObject`), not a holding: no people, market or gates.
- **At level 1:** a flag post alone. A tall pole on a stepped stone plinth, a crossbar with two or three of its realm's banners hung from it (the hanging banner style). Ragged when long unheld, a bandit's rag or a goblin totem when taken.
- **At level 2:** a wooden watchtower beside it.
- **At level 3:** a stone tower, a palisade and a guard hut.

Its name by where it stands: "the Highmoor ford outpost", "the Iron Hill outpost" (a resource).

## 2. Where they stand

- **Placed:** once a world is made, by a pure reckoning of the world (`Outposts.place`: its spots scored, ties broken by a hash of the tile), so a world always has the same outposts. The generator's own files are untouched: the G prints hold, and the W prints move once.
- **Which realm:** each province's realm holds the outposts in its land.
- **The spots (`OUTPOST_PLACE`):** road crossings, passes, fords and bridges, and the deposits on the province's land. Each spot is scored (a resource or a border most), then the best ones are taken, a gap kept between them and clear of holdings.
- **How many:** 1–3 a province by its size, more on a border with another realm.

## 3. Guards and levels

- **Guards:** its garrison (`OUTPOST.guards`: 3, 6, 10 by level), drawn from its realm's nearest holding; one watch patrols a ring round it (`world/patrols.js`, its home the outpost).
- **Growth:** held in peace a while, it grows a level, paid in resources by its nearest holding (timber, then stone).
- **Damage:** taken, it drops a level (its tower broken), and mends slowly, again on resources. Short of them, it waits: a repair quest.

## 4. What holding one gives

- **Land:** it claims land round it like a small holding (`territory.js` `landCompute`, `Outposts.claims`), its tiles its realm's nearest holding's, so borders follow the outposts.
- **Sight:** its owner sees round it; yours lifts the fog there.
- **Safety:** fewer bands spawn near a held one, caravans favour roads past it, and its province's danger falls.
- **Renown:** taking an enemy's gives renown and its realm's thanks.

## 5. Taking one

- **How:** beat its guards, then hold the ground by its flag a few hours (`OUTPOST.hold`, a timer in its bar) while your banner goes up. An army come to its defence breaks it off.
- **Who it goes to:**
  - your employer's (`P.fac`), if you serve one;
  - yours, if you have a holding of your own;
  - else you choose a realm near it to hand it to (its thanks and renown), or leave it unheld (it falls to the wilds: anyone's).
- **Who else takes them:**
  - lords at war, as small objectives on their campaigns;
  - bandits and goblins, the poorly guarded ones;
  - owners send lords to win theirs back.
- **Taken by bandits or goblins:** it becomes their lair (a camp round it, their rag or totem), its band raiding the roads near, cleared like a hideout.

## 6. Quests

- Take the enemy's outpost at X (a realm you serve, or one that asks).
- Retake our outpost at X.
- Hold the outpost until relief comes (its defence, in waves).
- Bring timber and stone to mend the tower (a delivery).
- Scout the enemy's outposts (go unseen).
- Cut down the goblin totem / drive the bandits from the old tower.

## 7. In battle

- **The field:** a fight there is on the world map round it (`battle/worldbattle.js`).
- **Its tower** (phase 5, `world/outposts.js` `OutpostTower`, `OUTPOST.tower`): its footprint raised `rise[lv]` levels and sheer but for its ladder (`ladder` cells, on the side away from you); `perch[lv]` of its archers posted on its top (`g.post`: no captain orders them, the muster leaves them); drawn up on its platform (`top[lv]` of its model's height: the field's `lift`, `u.z`); no melee between its top and the ground (`BattleTerrain#apart`).

## 8. Phases

1. **The outposts:** placed, drawn, held, on the full map, saved; taken by you (fight its guards, hold its ground), who it goes to (§5), handed to a realm near.
2. **Guards and levels:** its patrol, growth on resources, damage on capture and slow repair.
3. **The world's captures:** lords, bandits (a lair), goblins (a totem), owners winning theirs back; land, sight and safety.
4. **Quests:** §6.
5. **Its tower in battle.**

Each phase: tests in its own suite (`tests/outposts.js`), fingerprints held or re-recorded with their reasons, README and this status line.

**Off the roads, 2026-11-14** (the owner's rule, nothing built on a road): an outpost stands where none of the tiles its picture covers at its biggest (its tower to the left of its flag: `OUTPOST_PLACE.foot`, x −3 to 1, y −2 to 0) is a road (`Outposts.onRoad`, in `stand`); only its flag's tile was looked at, and 9 of seed 1's 21 lay partly on a road. Some stand a tile or two farther from their crossing; two crossroads with no room have none (19 on seed 1). Test: `tests/holdings.js` (nothing on a road) passes again.
