# Casual command: the battles as an auto battler

The owner, 2026-11-27: "I want to make it auto battler but with formation management and ordering a bit (just casual style like attack hold etc.) so it wont the same as in the market". Chosen with the owner: a standing battle plan, casual group orders, the hero fights on his own, the detailed controls hidden but kept.

**Status:** built 2026-11-27, on by default. Switch: Settings, Casual command (`PREFS.casual`, `CASUAL.on`; the developer console's `casual on|off`). Code: `battle/casual.js` (`CASUAL_ORDERS`, `Casual`). Tests: `tests/casualbattle.js`.

## 1. What it is

- **The plan:** the Army window's March formation, Field view, as before: each group's place round the army and its formation, and now its **opening order**, Attack or Hold (`P.army.march[id].order`; a plan saved before has none: Attack). Every battle opens with your army stood in it: a fight on the map as it marched, a field battle laid out from it (`setup.js` `arrangeMarch`). No deployment phase.
- **The fight:** your army fights on its own. A group on **Attack** is the AI's (`deploy.js` `aiHas`): the same captain that leads the enemy leads it (`commander.js`), its arms, charges, volleys and abilities. A group on **Hold** stands where it is and fights whoever comes within reach; shooters shoot (`battlecontrol.js` `hold`). Your hero is one of your groups: on Attack the AI fights him.
- **The orders:** in the fight, for the selected groups (or All): **Attack**, **Hold**, **Fall back** (back from the nearest foe it sees, `CASUAL_BACK` px, a fight on the map's times `fightSpace`, facing it, then holds). Also the formations (line, column, loose, wedge, circle) and **Retreat** (the whole army off the field, as before), and the commander's powers where they are on.
- **The field:** a tap picks your groups (and still draws in the armies and beasts round a fight on the map); no moves, targets, waypoints or lines dragged (`commands.js` `rtsOrder`, `formDragTo`, `armAttackMove`; `input.js` `battleTap`).
- **Hidden, kept:** the detailed orders (Charge, Attack-move), the stances, the skill bar, Keep formation and the AI button (`style.css` `#bbar.casual`). The keyboard's keys still give them on a desktop. Off, the battles are as they were, every order yours.

## 2. What makes it its own

Not a grid of units that fight alone once placed (the market's auto battlers), nor the full control of a real-time strategy game: a plan of places, formations and opening orders kept from fight to fight, then a few orders in the fight to change its course (hold the line while the archers shoot, send the riders in, pull a spent group back).

## 3. The screens

- **Desktop:** the battle bar shows Attack, Hold, Fall back (labelled), the formations and Retreat; the group cards and its details say each group's order.
- **Phone (844 x 390):** the Orders drawer's quick row is Attack, Hold, Fall back, Retreat (AI gone); the formations under Formations; the dock's Attack puts the selection on Attack.

## 4. Left

- Opening orders beyond Attack and Hold (a reserve that waits, then attacks), if wanted.
- The tests' harness turns casual command off (`CASUAL.on=false`, as the AI's Auto), so the battle suites and their fingerprints run as before; `tests/casualbattle.js` turns it on.
