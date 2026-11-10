# Standards: a realm's flags on its land, their towers and guards

Status (to the player: outposts): **phase 1 built (2026-11-10)**: the standards placed, drawn (a stone plinth, a pole and crossbar, two banners; a watchtower or stone tower from level 2), held, on the minimap and the full map, saved; taken by you (its guards beaten, your banner up after `STANDARD.hold` hours by it) for the realm you serve, for yourself with a holding of your own, else handed to a realm near or left to no one; a realm's guards back a day. **Phase 2 built (2026-11-10):** its sentries walk their beat round it in your sight (up to three, the game's clock); held in peace it grows a level (8 days to a watchtower, 14 more to a stone tower), paid in timber, then timber and stone, from its realm's nearest holding's stores, or waits on them; taken, its tower lies broken (its guards one level fewer, its tower's top gone in its picture) and is mended after 4 days once 6 timber and 6 stone are paid. **Phase 3 built (2026-11-10):** once a day, a lord at war with its realm (or come for a lair or a standard no one holds) with twice its guards or more within 6 tiles takes it for his realm, its tower broken; a band by one held by one guard or none takes it for its lair (their rag, their men its guards, at most 12), a band riding out of it every 4 days to raid the roads round it while fewer than 2 are out; you drive them out as you take a standard (it is then no one's, your banner going up); a lair counts in its province's danger; yours and your employer's lift the fog 7 tiles round them; no band is raised within 9 tiles of a held one; word of each taking as the world's news go. Also: guards you slew in a fight you lost stay dead; yours keep a man a day from your nearest holding's garrison (while it keeps 4). **Phase 4 built (2026-11-10), and renamed:** the owner, "can we rename it to something more straightforward?": to the player a standard is now an **outpost** ("the Highmoor ford outpost"; the code and this design keep the word standard). Its quests: a lord at war asks you to take one for his realm (the nearest held by a realm at war with his, or by a band) or to retake one of his realm's own; a captain of the watch, to drive a band from the one near it made its lair; a steward, to mend the broken tower of one of his realm's, with the timber and stone you bring (its page's Mend its tower). Not yet: the land a standard claims round it (territory.js); of §6, the hold-until-relief and the scouting quests. Phase 5 to come.

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

## 1. What a standard is

A place on the map of its own kind (`Standard`, a `WorldObject`), not a holding: no people, market or gates.
- **At level 1:** a standard alone. A tall pole on a stepped stone plinth, a crossbar with two or three of its realm's banners hung from it (the hanging banner style). Ragged when long unheld, a bandit's rag or a goblin totem when taken.
- **At level 2:** a wooden watchtower beside it.
- **At level 3:** a stone tower, a palisade and a guard hut.

Its name by where it stands: "the Highmoor ford standard", "the Iron Hill standard" (a resource).

## 2. Where they stand

- **Placed:** once a world is made, from its own seed (a named stream, `rngOf('standards')`), so a world always has the same standards. The generator's own files are untouched: the G prints hold, and the W prints move once.
- **Which realm:** each province's realm holds the standards in its land.
- **The spots (`STANDARD_PLACE`):** road crossings, passes, fords and bridges, and the deposits on the province's land. Each spot is scored (a resource or a border most), then the best ones are taken, a gap kept between them and clear of holdings.
- **How many:** 1–3 a province by its size, more on a border with another realm.

## 3. Guards and levels

- **Guards:** its garrison (`STANDARD.guards`: 3, 6, 10 by level), drawn from its realm's nearest holding; one watch patrols a ring round it (`world/patrols.js`, its home the standard).
- **Growth:** held in peace a while, it grows a level, paid in resources by its nearest holding (timber, then stone).
- **Damage:** taken, it drops a level (its tower broken), and mends slowly, again on resources. Short of them, it waits: a repair quest.

## 4. What holding one gives

- **Land:** it claims land round it like a small holding (`territory.js`), so borders follow the standards.
- **Sight:** its owner sees round it; yours lifts the fog there.
- **Safety:** fewer bands spawn near a held one, caravans favour roads past it, and its province's danger falls.
- **Renown:** taking an enemy's gives renown and its realm's thanks.

## 5. Taking one

- **How:** beat its guards, then hold the ground by its flag a few hours (`STANDARD.hold`, a timer in its bar) while your banner goes up. An army come to its defence breaks it off.
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

- Take the enemy's standard at X (a realm you serve, or one that asks).
- Retake our standard at X.
- Hold the standard until relief comes (its defence, in waves).
- Bring timber and stone to mend the tower (a delivery).
- Scout the enemy's standards (go unseen).
- Cut down the goblin totem / drive the bandits from the old tower.

## 7. In battle

- **The field:** a fight there is on the world map round it (`battle/worldbattle.js`).
- **Its tower:** archers on it shoot from its height (a tall cover, the walls' rules), from phase 5.

## 8. Phases

1. **The standards:** placed, drawn, held, on the full map, saved; taken by you (fight its guards, hold its ground), who it goes to (§5), handed to a realm near.
2. **Guards and levels:** its patrol, growth on resources, damage on capture and slow repair.
3. **The world's captures:** lords, bandits (a lair), goblins (a totem), owners winning theirs back; land, sight and safety.
4. **Quests:** §6.
5. **Its tower in battle.**

Each phase: tests in its own suite (`tests/standards.js`), fingerprints held or re-recorded with their reasons, README and this status line.
