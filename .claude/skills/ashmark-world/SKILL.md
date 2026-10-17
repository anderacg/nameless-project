---
name: ashmark-world
description: Role skill for agents changing Ashmark's campaign/world map (prototype/js/world/*, js/core/save.js, holdings, parties, brains, economy, estates, sites, ships, caravans) — the OOP model, save rules, map entities, brains, and must-run suites. Load after ashmark-core whenever a task touches the world map, campaign simulation, saves or parties.
---

# World map and campaign

Read `prototype/README.md` world sections and `doc/IMPLEMENTATION_PLAN.md` sections 5–7 first.

## Model
- **Parties** (`parties.js`: `Party`, band/patrol/lord kinds, `asParty`, `partyRoster`, `allParties`) carry troops and a **brain** (`brains.js`) that decides movement each tick (stance: hunt/flee/patrol; `stanceMove` in `battle/encounters.js` for lords/bands/monsters). Caravans are being moved onto `Party` (plan 5.1).
- **Holdings** (`HOLDING_TYPES` + Holding classes), **sites** (`siteOf`), **estates** with workers (`folk.js`: workers stay inside their estate, carry goods to the holding afternoon–dusk and return; met by clicking the estate), decorative pasture herds (`critters.js`).
- Daily world tick runs economy, realms (war/peace/treasuries), sieges, quests, events. World sim is not deterministic yet (procedural/seeded world is **deferred**; keep a classic seed if it ever comes).
- After a fight there is a **grace period** (`G.encCool>0`): hunters keep `GRACE_GAP` (24 px) — step caps exist in `PatrolBrain.think` and `stanceMove`; keep them.

## Saves
- `save.js` writes `{v:2, P, world:{v:2,...}}`; `readSlot` rejects anything else. **No migrations, no compatibility shims.** Classes are restored from plain fields on load (`asParty`, `siteOf`…). If you need a new saved field, keep it plain JSON and make load tolerate its absence only if the owner wants that; if the shape must change, stop and report.
- Battle-only state never goes into saves.

## Map rendering and picking
- Sprites are drawn in `js/gfx/` (`render.js` `drawParties`, `drawCaravans`, ships in `world/ships.js`, docks in `gfx/structures.js`) anchored by cell size so feet stay on the map row; labels sit above `figTop`. Picking (`world.js` `pickAt`) uses small circles first, then the drawn pixel box (`partyFig`, `caravanPic`) so big sprites are clickable without stealing clicks. Art rules: ashmark-art.

## Must-run suites for world changes
Grep `prototype/tests` for the system you touched, plus: `parties`, `economy`, `estates`, `fights`, `events`, `patrols`, `fear`, `brains`, `siege`, `clicks`, `mapview`, `mappolish`, `menu`, `stay`, `armygroups` (save rejection), `structure`; `worldsim` for anything affecting the long-run simulation (slow).
