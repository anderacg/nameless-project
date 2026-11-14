# Fights in the open

The owner, 2026-11-14: "Can you remove the battle area for hunting? The hunting is just using the same world speed and battle sprites and hunt drops, trophy required player to click at carcass to loot them. This is also the same as monsters etc." Asked to choose, the owner picked: the world keeps running, every fight on the map, and the loot in a window where you decide what to take and look it over.

Status: **built 2026-11-14** (phases 1–3 below). Switches: `OPEN_FIGHT` (`battle/worldbattle.js`) and `CARCASS` (`data/drops.js`). Tests: `tests/openfights.js` and `tests/carcasses.js`.

## 1. No ring

Every fight on the map (a hunt, a beast, a band, a lord, a patrol, a caravan, a fight you join) has no circle drawn round it (`OPEN_FIGHT.ring` false). Sieges, raids, camps, caves and tournaments keep their own fields.

- The fight's field is `OPEN_FIGHT.reach` (1.3) times as wide as the ring was. A band fight on seed 51 has a radius of 161 px (was 124); a hunt has 143 px (`HUNT_AREA.radius` 110 × 1.3).
- Its edge lies past your sight, and nobody sees it. A foe that runs past it has got away; your men stop at it.
- The fight ends as before: when one side has nobody left in it (dead, fled or past the edge), or by End hunt or a withdrawal.
- The arrival markers still show where a joining army comes in.

## 2. The world runs on

During a fight on the map, the world takes its own step every frame after the fight's (`openFightWorld`, called from `main.js`):

- The clock runs at the game's speed. Every system's frame runs except those in `OPEN_FIGHT.still`: your march, a holding or the road reached, your camp, raids, auto reinforce, travel awareness.
- The parties, beasts and herds in the fight, and those riding to it, are left to the fight (`inMapFight`, checked in `worldobject.js` `lodThink` and the march systems). Everyone else goes about their business.
- Your band's days and hours (`OPEN_FIGHT.held`: wages, the wounded, companions, food) wait in `Systems.hold` while the fight lasts. Once it is over they run in their order (`Systems.release`), so a fight across midnight never skips a payday.
- No encounter or meeting opens while a fight goes on (`startEncounter` and `interact` refuse).
- A paused fight pauses the world too. So does one that is still forming up, or that is over.
- `OPEN_FIGHT.world` false: the world waits through the fight, as before.

Tests call `updateBattle` directly, so their fights run without the world, and every battle fingerprint held.

## 3. The fallen and their loot

Every foe who falls in a fight on the map lies where he fell, as the fight drew him (`world/carcasses.js` `Carcass`).

- **Where the loot goes:** the things the fight gives (what the end window's pile would hold) lie on the fallen, not in your bag. Meat, furs and a beast's trophy go on beasts, its own kind first. Gear and goods go on the men. Gold, experience, renown and prisoners are still paid at the fight's end.
- **Ground drops:** in a fight on the map, `DROPS` leaves no coins, gear or hides about the field. Only its experience dots fly.
- **The end window:** it says how many things lie on the fallen.
- **Looting:** a click on a carcass walks you there. Met, it opens the spoils window (`ui/loot.js`) for everything on the fallen within `CARCASS.near` (40 px), beside your bag. Take one thing at a time or Take all, and put things back. Leave the rest here: it stays on the one you clicked.
- **Rotting:** a carcass lasts `CARCASS.days` (3) with anything on it, or `bare` (1) once it is picked clean. At most `most` (120) are kept on the map.
- **Saves:** carcasses are saved (key `carcasses`). After a load each is drawn as a plain shape, since its picture lived only in that session.
- `CARCASS.on` false: no carcasses, and the field's drops and the end window work as before.

## Left

- Bands do not yet pick over the fallen (the remains do: `Remains.hour`).
- Parties not in the fight may walk through it (the bystanders' avoidance runs only while the world waits).
- The field is still a fixed window: a chase past its edge ends there.
