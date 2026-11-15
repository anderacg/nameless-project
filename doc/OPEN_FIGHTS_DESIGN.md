# Fights in the open

The owner, 2026-11-14: "Can you remove the battle area for hunting? The hunting is just using the same world speed and battle sprites and hunt drops, trophy required player to click at carcass to loot them. This is also the same as monsters etc." Asked to choose, the owner picked: the world keeps running, every fight on the map, and the loot in a window where you decide what to take and look it over.

Status: **built 2026-11-14** (phases 1–3 below). Switches: `OPEN_FIGHT` (`battle/worldbattle.js`) and `CARCASS` (`data/drops.js`). Tests: `tests/openfights.js`, `tests/carcasses.js` and `tests/fallenlife.js` (yours too, looters, clearers).

## 1. No ring

Every fight on the map (a hunt, a beast, a band, a lord, a patrol, a caravan, a fight you join) has no circle drawn round it (`OPEN_FIGHT.ring` false). Sieges, raids, camps, caves and tournaments keep their own fields.

- The fight's field is `OPEN_FIGHT.reach` (2.2) times as wide as the ring was. A band fight on seed 51 has a radius of about 296 px (was 134), and a hunt 242 px (`HUNT_AREA.radius` 110 × 2.2). Your sight is 110 px, so the edge lies far past what you see. A fight costs about the same per step: on seed 51, 2.5 ms at reach 1.3 and 2.7 ms at 2.
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
- **Rotting:** a carcass lasts `CARCASS.days` (3) with anything on it, or `bare` (1) once it is picked clean. At most `most` (120) are kept on the map.
- **Saves:** carcasses are saved (key `carcasses`). After a load each is drawn as a plain shape, since its picture lived only in that session.
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

## Left

- The field is still a fixed window, though now 2.2 times as wide. Moving it with the chase would mean moving every position the fight keeps (its men's ways and goals, groups, missiles, corpses, the blood layer, fog, the terrain grid, the tracks, the captains' memory), so a chase past its edge still ends there: the foe has got away.
- An ally riding in walks straight at the fight, and ground it cannot cross can stop it (`tests/worldbattle.js` and `tests/worldbattleplay.js` check an ally walking in at the old width).
