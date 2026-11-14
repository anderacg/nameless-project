# Fights in the open world

The owner, 2026-11-14: "Why cant we make it like open world game no battle boundary just based on units range etc", then "I want option 2 but just that the fights or unit sprites are only draw when player is near". Option 2 means the fight runs on the world map itself, not in a patch of ground copied out of it.

Status: **designed 2026-11-14; phase 1 in work.** It follows doc/OPEN_FIGHTS_DESIGN.md, the first step: no ring, the world running on, the fallen holding their loot.

## 1. What changes for the player

- **No edge.** A fight has no area. A man stays in it while a foe is within his reach: his sight, his weapon's range, the morale of those round him. A chase goes as far as the chasers and the chased can run.
- **It ends when no one has a foe near.** When every man of a side is dead, fled or out of reach of every foe for a while, that side is done. Its losses are settled, its men are back on the map as their party, and the fallen lie where they fell (as now).
- **Near you, it is drawn.** Fights are drawn, and fought man by man, only within `OPEN_WORLD.near` of you (your sight and a margin). Farther off, two parties fight as they do today (`world/fights.js`, by numbers), and nothing of them is drawn.
- **More than one fight.** Every fight near you is fought for real, side by side in one live field, as the battle engine's sides already allow (up to eight armies). Walking up to a fight between two others shows it, man by man; you may join a side, or pass by.

## 2. How it is built: one coordinate space, grids that move

Today a fight copies a window of the map into its own space (field px = world px × 6, its corner at the fight's start) and builds its grids for that window: ground, ways, fog, the blood layer. Every man's position, way and goal is in that space, so the window can never move.

Option 2 keeps the battle engine and changes its space:

- **Field px are the world's, × 6, everywhere.** The field's corner is the map's corner, the same for every fight. A man's position, way and goal never need moving, because nothing is copied.
- **Only the grids are windows.** The ground grid (`BattleTerrain`), the ways (`route.js` grids), the fog and the blood layer cover a window round the action, with an origin (`ox`, `oy`, field px). They are caches. When the action nears a window's edge, the window is built again centred on it; no man moves.
- **The field's bounds are the window's.** Every bound check (`BW`, `BH`, `fieldTop`, `fieldBot`) becomes the window's, offset by its origin.

## 3. Phases

1. **Grids with an origin** (refactor; every fingerprint holds). Route grids and `BattleTerrain` carry `ox`/`oy` (0 for every fight as it is), and every cell-to-point conversion goes through one helper (`routeAt`, `tAt`). About 90 conversions in the battle, drawing and UI code.
2. **Fights on the map in the world's own space.** `WorldBattleArea`'s field corner is the map's; its grids cover a window round the fight. The bounds checks become the window's (about 140 uses of `BW` and `BH`). Fields of their own (sieges, raids, camps, caves, tournaments, the Battle Lab) stay as they are, with origin 0.
3. **No edge.** The window follows the action. A man with no foe in reach for `OPEN_WORLD.loose` s leaves the fight; a party whose men come within reach of a fight's joins it. The fight ends when no side has a foe in reach.
4. **The live field and far fights.** One live field round you holds every fight near you. A fight between others that comes within `near` joins it (from `world/fights.js`); one left behind goes back to being fought by numbers. Only the live field's men are drawn.

Each phase has its tests, keeps the old way behind a switch till the last, and the battle and world fingerprints either hold or are re-recorded with the proof that the switch off gives them back.
