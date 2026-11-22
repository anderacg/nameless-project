# Fights in the open

The owner, 2026-11-14: "Can you remove the battle area for hunting? The hunting is just using the same world speed and battle sprites and hunt drops, trophy required player to click at carcass to loot them. This is also the same as monsters etc." Asked to choose, the owner picked: the world keeps running, every fight on the map, and the loot in a window where you decide what to take and look it over.

Status: **built 2026-11-14**, extended for continuous encounters on 2026-11-22 (section 5 supersedes the older meeting, exclusion-zone and results-window rules below). Switches: `OPEN_FIGHT` (`battle/worldbattle.js`) and `CARCASS` (`data/drops.js`). Tests: `tests/openfights.js`, `tests/carcasses.js` and `tests/fallenlife.js` (yours too, looters, clearers).

## 1. No ring

Every fight on the map (a hunt, a beast, a band, a lord, a patrol, a caravan, a fight you join) has no circle drawn round it (`OPEN_FIGHT.ring` false). Sieges, raids, camps, caves and tournaments keep their own fields.

- The fight's field is `OPEN_FIGHT.reach` (2.2) times as wide as the ring was. A band fight on seed 51 has a radius of about 296 px (was 134), and a hunt 242 px (`HUNT_AREA.radius` 110 × 2.2). Your sight is 110 px, so the edge lies far past what you see. A fight costs about the same per step: on seed 51, 2.5 ms at reach 1.3 and 2.7 ms at 2.
- **Since 2026-11-22** (the owner: "Fix battle area to be smaller based on army size"; `battle/worldbattle.js` `WorldBattleArea`, `WORLD_BATTLE.room`, `perMan`): a fight's field (not a hunt's) is sized by its armies: their bodies (`core`), `room` (60) px past them, a bow's reach on the map, and `perMan` (3) px a man's square root, never wider than it was. Seed 51: a pack of five wolves 121 px (was 291), 4 a side 131 (294), 12 a side 157 (313), 40 a side 190 (348), 120 a side 253 (406); its terrain grid a fifth to two fifths as many cells. Its edge may now lie in your sight: a foe past it has got away, as before. The join range (`ring`) is as it was.
- Nobody sees the edge. A foe that runs past it has got away; your men stop at it.
- Who hears of the fight and joins it is measured from the ring's edge as before (`WorldBattleArea#ring`, `knows`: the owner, "the join range should be not that far, reduce to the original range"), not the wide field's. So a lord within 220 px of the old ring joins, as ever; one within hearing is usually inside the wide field already and comes in where it stands.
- A hunted beast that none of your men has seen for `OPEN_FIGHT.lost` (20 s) has got away too (`HuntBattleArea#turn`), so a hunt never drags on after game hidden far off.
- The fight ends as before: when one side has nobody left in it (dead, fled or past the edge), or by End hunt or a withdrawal.
- The arrival markers still show where a joining army comes in.

## 2. The world runs on

During a fight on the map, the world takes its own step every frame after the fight's (`openFightWorld`, called from `main.js`):

- The clock runs at the game's speed. Every system's frame runs except those in `OPEN_FIGHT.still`: your march, a holding or the road reached, your camp, raids, auto reinforce, travel awareness.
- The parties, beasts and herds in the fight, and those riding to it, are left to the fight (`inMapFight`, checked in `worldobject.js` `lodThink` and the march systems). Everyone else goes about their business.
- Those that come near the fight without joining it (a caravan, a worker, refugees, a herd, a party) step aside out of its way and wait there till it is over (`BattleBystanders`; `fightHolds` holds their own moments: `lodThink`, the march systems, `folk.js`, `refugees.js`).
- Your band's days and hours (`OPEN_FIGHT.held`: wages, the wounded, companions, food) wait in `Systems.hold` while the fight lasts. Once it is over they run in their order (`Systems.release`), so a fight across midnight never skips a payday.
- No encounter or meeting opens while a fight goes on (`startEncounter` and `interact` refuse).
- A paused fight pauses the world too. So does one that is still forming up, or that is over.
- `OPEN_FIGHT.world` false: the world waits through the fight, as before.

Tests call `updateBattle` directly, so their fights run without the world, and every battle fingerprint held.

## 3. The fallen and their loot

Everyone who falls in a fight on the map lies where he fell, as the fight drew him (`world/carcasses.js` `Carcass`). That means the foe, and also your men and your allies' (2026-11-15, the owner: "make every unit the same way"). Your own fallen are marked `ours`. The fight's things go on the foe's fallen only, so yours lie empty.

- **Where the loot goes:** the things the fight gives (what the end window's pile would hold) lie on the fallen, not in your bag. Meat, furs and a beast's trophy go on beasts, its own kind first. Gear and goods go on the men. Gold, experience, renown and prisoners are still paid at the fight's end.
- **Ground drops:** in a fight on the map, `DROPS` leaves no coins, gear or hides about the field. Only its experience dots fly.
- **The end window:** it says how many things lie on the fallen.
- **Looting:** a click on a carcass walks you there. Met, it opens the spoils window (`ui/loot.js`) for everything on the fallen within `CARCASS.near` (40 px), beside your bag. Take one thing at a time or Take all, and put things back. Leave the rest here: it stays on the one you clicked.
- **Looters** (2026-11-15, the owner: "make random looters loot or check body"): each hour, every fallen with something on them may draw a band. A band within `CARCASS.seek` (160 px) sets out for them, at `CARCASS.find` (0.35) an hour (`b.corpse`). With none near, fresh fallen (under `loot.fresh`, 1 day old) may draw looters out of the wilds instead: at `loot.spawn` (0.25), a band of 2–4 `band_looter` from 220–320 px off, out of your sight, with at most `loot.most` (3) at once (`Carcass.looters`). The band walks there, seen or not (`BandBrain.think` runs `Carcass.seek` while it neither fears nor sees you). Within `loot.at` (24 px), it stands searching for `loot.check` (6 s). Then it takes everything on the fallen within `near`, and the carcass reads "picked clean by bandits". The goods become its plunder, yours if you beat it, as with a fallen hero's remains (`Remains.beaten`). A town's patrol may ride the looters down first.
- **Clearers** (the owner: "make people work to clear those corpses"): each hour, the fallen near a holding are cleared once they are past their time. That means picked clean for `clear.bare` (0.25 day), or `clear.after` (1.5 days) with anything on them, and the holding's gate within `clear.reach` (420 px). Out of your sight they are simply gone. In it, one of the holding's folk walks out (a farmer, `Carcass.diggers`, at most `clear.most` 3 at once), digs for `clear.dig` (8 s) and walks home. The fallen is gone when the digging is done. Diggers are not saved: a load clears them, and the fallen they were digging stay until the next hour.
- **Rotting** (2026-11-15, the owner: "the corpse should still be there like others, but after a while the corpse can start rotting and finally turns into bones. This should be the same for all dead bodies"): every body on the map goes through the same stages (`world/carcasses.js` `BodyRot`, tunables in `BODY_ROT`, `data/drops.js`). That covers the fallen of a fight, beasts, and your own remains (`world/death.js` `Remains`, and an unburied grave).
  - **Fresh:** for its first day (`rot`) it lies as it fell.
  - **Rotting:** until `bones` (3 days) it is darker and greener. It draws no flies of its own (2026-11-15, the owner: "we can use different sprite for flies to draw over").
  - **Bones:** after that it is a skeleton: a man's skull, ribs and limbs on a rag of his clothes, or a beast's long skull, arched ribs and legs on a scrap of hide.
  - **Gone:** the fallen of a fight are removed at `gone` (8 days), picked clean or not. Your remains stay as bones until they are buried.
  - Each body's picture is made once (`BodyRot.pic`), from the fight's drawing of its fall, or after a load from its kind lying as the battle's fallen lie (`corpseOf`). Your hero's own fall is kept the same way (`Remains.lay` reads it off the fight on the map).
  - At most `CARCASS.most` (240) fallen are kept on the map.
- **Saves:** carcasses are saved (key `carcasses`). After a load each is drawn as its kind lying, since the picture of its fall lived only in that session.
- `CARCASS.on` false: no carcasses, and the field's drops and the end window work as before.

## 4. After the fight: each where it stood

The owner, 2026-11-14: "The hunting should not warp the wildlife back to the group, each will keep the state and position. Same goes for the army".

- **Armies:** each man is handed back to his marcher where he stood (`WorldBattleArea#finish`), and walks back into the march from there. Checked on a win and on a withdrawal, for both sides: no man moves more than 0.1 px at the hand-back.
- **Herds:** a herd was one point drawn as up to three animals, so a hunt's survivors used to jump to their middle. Now each animal keeps its own spot about the herd's point (`Herd` `m`: its offset, facing and wind; `battle/hunting.js` `finish`).
  - The map draws each animal where it is. Each walks back to its place at `HERD_SCATTER.gather` (6 px a second, `data/exertion.js`), carried along as the herd moves. Once all are within `near` (1 px), the herd is drawn as before.
  - Animals still bolting when the hunt ended keep the herd running their way for `HERD_SCATTER.run` (4 s), at their speed.
  - A hunt begun on a scattered herd meets each animal where it stands, facing its way, with its own wind (`herdSpot`). If the herd is still running, each is already alert.
  - The spots are not saved: after a load the herd is gathered.
- `HERD_SCATTER.on` false: the herd as before. Tests: `tests/herdscatter.js`.

## 5. Continuous encounters — 2026-11-22

The owner: normal world combat stays interactive on the world map, for wildlife, monsters, bandits and armies alike. Each visible animal or hostile soldier is a target. Only dungeons and deliberately separate battle maps retain a results screen.

- `battle/worldcombat.js` owns the transient interaction and reward coordination. `WorldFigure` holds the actual marcher or flock member under the pointer; its coordinates follow that individual while approaching. Herds and armies remain the owners of their members and their existing AI.
- Body hits take priority over army outlines. An individual animal is clickable anywhere on its own body, including far from the herd marker. Mouse clicks and phone taps attack individual enemies during combat; right-click attacks retain that same identity. Dragging still selects formations, and clicking friendly soldiers selects their group.
- Combat begins at the existing world positions with the existing camera. Travel and combat return to 1x on contact. No battle introduction, preparation screen or victory overlay interrupts a seamless world encounter. Ground clicks move the selection; without a selection they move the hero. A destination beyond the active combat window orders physical withdrawal and resumes travel after disengagement; it does not teleport the army.
- Visible wildlife and hostile armies can be brought into an ongoing encounter by clicking their individuals. They enter through the existing side, reinforcement and fighter-limit systems. A mixed hunt can include armed enemies; End hunt orders withdrawal while an armed threat remains, rather than declaring victory over it.
- Uninvolved travelers, workers and wildlife keep their normal world movement. The former automatic evacuation and waiting zone does not apply to continuous encounters.
- Your army's credited kills award real hero/companion XP immediately: species XP for wildlife, 8 XP for armed/monster kills. Existing proficiency practice also displays immediately. Since 2026-11-22, gold XP motes and blue proficiency motes flow into their actual hero or companion recipient. Rapid gains combine by recipient and effect type, with bounded effects and reduced-motion support. The final motes follow the restored marchers after settlement. Routine reward labels and repeating reward-log toasts are removed; awards and proficiency math are unchanged. Arena effects remain unchanged.
- A per-encounter ledger deducts already-paid combat XP from settlement. Wildlife rewards stay separate from war spoils in mixed fights. Earned kill XP remains yours after withdrawal or defeat; it is not reduced from 8 to the old 4 XP defeat payout. Species loot, medicine, survivors, diplomacy, prisoners, ranks, gold and other campaign outcomes still use their existing settlement rules.
- World settlement opens no report, loot summary or Continue prompt. Corpses and their items remain on the map, and unplaced spoils are retained in a ground pack, without inventing a casualty. Bound quest items go directly into the inventory. A brief message reports contact ending and its gold/renown changes. Explicit carcass inspection still opens its existing loot window.
- Death, captivity and a required holding-capture decision keep their own consequence UI. Dungeons, siege works, tournaments, sandbox arenas and separate battle maps retain their existing reports.
- No save migration or new saved combat session is introduced. The active combat units and target handles are transient; existing roster, character and carcass save paths retain the resulting campaign state.

Validation: 584 assertions passed across the 15 focused suites below; one existing attack fingerprint mismatch remains. No JavaScript errors were reported. Two browser pages at most ran concurrently; no full sweep was run.

| Suite | Passed | Failed |
|---|---:|---:|
| worldcombat | 28 | 0 |
| seamless | 14 | 0 |
| wildhunt | 25 | 0 |
| carcasses | 19 | 0 |
| openfights | 20 | 0 |
| worldbattleplay | 5 | 0 |
| proficiency | 33 | 0 |
| actorrules | 69 | 0 |
| attackrules | 77 | 1 existing fingerprint |
| battlecommands | 59 | 0 |
| battleresolution | 82 | 0 |
| battlesetup | 68 | 0 |
| aishare | 23 | 0 |
| mobilebattlehud | 26 | 0 |
| structure | 36 | 0 |

`attackrules` produces `web_hit = 37b66365` on both the changed code and untouched `2bb0545`, served from an immutable source overlay. Both have the same 77 passes and one mismatch. The baseline comparison also passes all 59 command and 82 settlement assertions. No canonical fingerprints were re-recorded. A command-argument difference caught during implementation was fixed before the final command run.

The historical settlement fixture explicitly disables live coordination while comparing campaign accounting and its historical presentation snapshots. The new worldcombat suite exercises the production live path, including actual mouse/touch input, mixed encounters, immediate XP, withdrawal, full-bag bound quest items and ground packs. Longer setup and AI suites now emit progress; their earlier 180-second no-progress timeouts were rerun to completion (setup 228 seconds, AI 227 seconds). The settlement matrix completed in 424 seconds.

Phone verification uses Chromium touch emulation, not a physical phone or Safari. Raw reports are in `/tmp/ashmark-progress-97oCtR/`, `/tmp/ashmark-progress-MvyBhX/` and `/tmp/ashmark-progress-Y1DQvk/`; baseline comparison reports are in `/tmp/ashmark-progress-DYWf8R/`. The source overlay, final responsive-view check and desktop/phone screenshots are under `/workspace/artifacts/continuous-world/`.

 `tests/worldcombat.js` covers pointer identity, actual mouse/touch input, live XP/proficiency, mixed interactions and non-blocking settlement. Updated older hunt, carcass, passing-caravan and world-victory expectations describe the requested behavior; canonical fingerprints are not re-recorded.

## Left

- The field is still a fixed window, though now 2.2 times as wide. Moving it with the chase would mean moving every position the fight keeps (its men's ways and goals, groups, missiles, corpses, the blood layer, fog, the terrain grid, the tracks, the captains' memory), so a foe past its edge has got away. A player destination beyond it now orders physical disengagement and continues travel, rather than silently clamping that destination. A rolling combat terrain window remains a separate architectural change.
- An ally riding in walks straight at the fight, and ground it cannot cross can stop it (`tests/worldbattle.js` and `tests/worldbattleplay.js` check an ally walking in at the old width).

## Visible boundary — 2026-11-22

The actual active combat edge is now visible by default (`OPEN_FIGHT.ring`). A narrow amber line follows the ground, with a soft glow, moving highlights, small sigils and rising sparks. It warms toward orange within 24 world pixels of the hero. Effects use battle time, freeze when paused and remain steady with reduced motion enabled. Drawing consumes no random stream and changes no combat bounds or collision rules. Visible segments alone sample terrain lift; an amber dashed circle also marks the active area on the minimap.

Checks: `battleboundary` verifies visible pixels, animation, reduced motion, proximity feedback, preserved canvas state and unchanged area/health; `openfights` checks the default visibility switch and existing world behavior.

Validation: battleboundary 11 and openfights 20 passed, with no JavaScript errors. The boundary checks also pass at the actual responsive viewport; desktop and phone previews are in `/workspace/artifacts/battle-boundary/`.

## Individual wildlife visibility — 2026-11-22

Implemented: wildlife members each have their own position, forest-cover sight check, drawing entry and `WorldFigure` target. The herd is retained internally as the shared roaming/fleeing coordinator. A hidden centre cannot hide exposed members, and a visible centre cannot reveal members hidden in the forest. Drawing and picking filter each animal independently. Hunting validates and approaches the actual selected animal; a target lost in cover is no longer chased through its live hidden coordinates.

The controller's shared marker and outline are removed. Wild counts map to actual members, including counts above the old six-sprite display cap; pasture livestock retains its existing cap and presentation. Nearby formation movement continues when the centre is hidden. A broad sight test includes the formation's possible extent, existing member positions and saved scatter offsets, avoiding work on distant flocks while keeping separated visible members discoverable. Saves, population accounting, rewards and coordinated herd movement retain their existing rules.

Validation: individualwildlife covers mixed forest/open ground, independent drawing/picking/targeting, complete counts, scattered members and hidden-centre updates. Worldcombat, wildlife, wildground and critters check hunting, rewards, animation, terrain/wading and livestock. Drawing-only fixture overrides now target member visibility and pass an explicit sight radius rather than bypassing group visibility.
