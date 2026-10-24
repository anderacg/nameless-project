# World-map battles

Status: playable campaign version, with seamless world rendering, smooth march turns, army circles and battle completion fixes, 2026-10-24. Enabled by `WORLD_BATTLE.on` in `prototype/js/battle/worldbattle.js`. Small colored figures stand in for travel soldiers; combat keeps the existing unit sprites, actors, orders, morale and campaign settlement.

## Travel and contact

The hero anchors the player's army. Army → Roster → March formation opens a drag editor, with group buttons and arrow controls for touch and keyboard use. The hero stays at zero. Apply stores offsets under `P.army.march`, keyed by persistent group ID; Back discards edits. Missing offsets use a ring round the hero. Wounded and away companions do not march as fit groups. Existing saves need no new world save piece.

The inner ring marks the core. Groups can stand anywhere inside the outer ring, including inside the core. Their entire formation footprint must fit; the interaction band outside it accepts no placement. The outer radius grows when a group's existing frontage/formation needs more room. Travel offsets rotate toward the army's movement heading at a bounded angular speed, including while it finishes a turn. Each visible military party has a faction-colored outer circle and a faint dashed interaction ring; your camp retains its army circle. This first version keeps travel groups attached to the hero; individual travel pathfinding is not simulated.

Party contact uses both armies' outer radii plus their interaction bands. It opens the existing encounter window. Holdings and other non-party objects retain their normal interaction reach. Fight enters world combat for bands, lords, patrols, caravans, monsters and battles the player joins. Tournaments, assaults, raids, camps, caves and the Battle Lab retain their existing setup. Autoresolve remains available.

## Fixed battle area

The initial circle encloses the two starting parties' formation circles at their actual world positions. Its centre and radius stay fixed. Hero movement and reinforcements cannot move or enlarge it. A small apron outside the boundary allows escape and regrouping.

The battle uses local combat coordinates with a reversible world transform. Combat draws over the live world renderer, with its surrounding terrain, buildings, fog and minimap. The native world canvas, map zoom and camera position stay unchanged when dialogue becomes combat; no arena fit, map switch or battle loading screen occurs. Campaign figures of participating armies are suppressed while their combat actors occupy those same world coordinates. The movement/sight grid samples this same window of `WM`: terrain kinds, climates, elevation, roads, water, cliff edges and building footprints. It does not generate or mirror an arena. This first grid is coarse: it follows world tiles, rather than every painted tree or rock pixel. Specialized generated bridge/ambush layouts are replaced by the actual world terrain on these road battles.

Group markers retain a stable screen size at the world canvas scale. The world camera can still pan; there is no separate battle zoom or automatic fit. Ordinary route grids are masked to the circle, with separate unmasked grids for escape into the apron. Normal selection, move, dragged line, attack, abilities, AI control, zoom, pause and touch commands remain the battle engine's. Group destinations, waypoints and ordinary soldiers are constrained to the circle. Withdrawal uses the normal disengagement and stamina rules, with a circular exit. Saving during combat remains unavailable.

## Reinforcements and routing

Eligible lords, patrols, companions' parties and bandit bands can approach during combat. Existing relation/help rules choose a side; bands can help another band. Reinforcements enter from their world position when they physically reach the circle. Allies listed in the encounter also approach, rather than appearing immediately. Their existing actors activate once; later arrivals receive unique actor/group IDs and retain source-army and source-group identity. Troop casualties go back to those sources. Armies that never arrive receive no battle spoils or capture/relationship outcomes.

Routing soldiers may cross the boundary. They run into the apron, wait to regroup, then physically return. Health, ammunition and spent fatigue survive the trip. The group recovers enough morale to accept orders again. Each group gets one return by default; another rout leaves permanently, preventing endless escape/rejoin cycles. Explicit withdrawal does not cause an automatic return. A clear-field interval allows returns and arrivals before victory; new fighting cancels the countdown. Once the interval expires, the normal campaign report resolves the fight. After 30 combat seconds without damage, a battle where neither side has a legal route or an unobstructed attack in range ends as Disengaged. This does not award victory, charge a retreat renown/gold penalty, or force a rematch. Connected armies that the player orders to hold are not timed out. The surviving hero's actual position becomes the travel anchor afterward.

Campaign calendar time and unrelated world simulation remain paused during combat, as in the previous battle mode. The arriving armies advance on combat time. Simultaneous independent tactical battles and a continuously advancing campaign are later work.

## Owners and tuning

| File | Responsibility |
| --- | --- |
| `prototype/js/battle/worldbattle.js` | `marchRows`, formation footprint/radius, direction, mock drawing; `WorldBattleArea` coordinates, terrain, boundary, arrivals, regrouping and cleanup; `WorldBattleSetup` |
| `prototype/js/ui/march.js` | Formation editor, draft/apply/back and touch dragging |
| `prototype/js/battle/setup.js` | Chooses world or existing battle setup |
| `prototype/js/battle/battlecontrol.js` | Normal order destinations constrained immediately, including while paused |
| `prototype/js/battle/battle.js` | World-area tick, final bounds and clear-field result check |
| `prototype/js/battle/morale.js` | Routing escape hook and circular withdrawal exit |
| `prototype/js/battle/resolution.js` | World-area cleanup before existing campaign settlement |
| `prototype/js/gfx/render.js`, `battle/camera.js` | World ground/boundary and minimap inside the existing battle renderer |
| `prototype/js/world/brains.js`, `world/world.js` | Party contact range |
| `prototype/js/world/parties.js`, `gfx/render.js` | Small travel formations |

`WORLD_BATTLE` owns the numbers: scale 6 combat pixels per world pixel; inner radius 18, minimum outer radius 38, interaction band 8, escape apron 22; approach speed 9 world pixels per combat second, reinforcement search 220 past the boundary; regroup wait 7 combat seconds, clear-field interval 16; at most 1 regrouped return per group, turn speed 3.5 radians/second and terrain-stalemate quiet interval 30. Formation footprint can grow the outer radius. No new Systems/Saves registry entries are required.

```mermaid
flowchart LR
    A[Hero and saved march offsets] --> B[Party interaction contact]
    B --> C[Existing encounter choices]
    C -->|Fight on road| D[Fixed world battle circle]
    D --> E[Existing controls, actors and combat]
    F[Eligible nearby armies] -->|Approach and enter| E
    E -->|Route| G[Escape and regroup outside]
    G -->|Physical return| E
    E -->|Clear field or withdrawal| H[Existing campaign settlement]
    H --> A
```

## Verification

`worldbattle` covers formation bounds/drafts, contact, world coordinates, orders while paused, escape/return without restored vitals, dynamic arrivals, source casualties, withdrawal, non-arrival cleanup, saving/loading and heading. `worldbattleedges` checks circles, the shared world viewport/minimap, final routing, circular route grids and neutral disengagement. `worldbattleterrain` runs on untouched generated roads, forests and hills. `worldbattleplay` runs complete campaign combat with physics, sight, AI, an approaching ally and normal results. `visual/worldbattle` supplies desktop and landscape phone travel, editor, combat and reinforcement scenes. Older fixtures explicitly disable `WORLD_BATTLE`, preserving their isolated battle behavior and fingerprints.
