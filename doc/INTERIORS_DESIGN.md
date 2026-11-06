# Fights inside: design

**Status:** 2026-11-06: caves, ruins' cellars and hideouts built (`prototype/js/battle/interior.js`, `tests/interiors.js`); siege walls next (§4).

**The owner's asks and decisions (2026-11-06):**
1. "Please do the small in caves fighting."
2. Up to 8 of your band go in with you, "yes for now".
3. Hideouts are fought inside too, "with more camp detail".
4. Real siege walls, now.

## 1. What was there

Every battle but caves, ruin guardians, sieges, raids, tournaments and the Battle Lab is fought on the world map. A cave's fight used the ordinary outdoor field made from the land round the cave (no river), with your whole band and nothing of a cave about it.

## 2. Caves and cellars (built)

| Part | As built |
|---|---|
| Ground | `InteriorLayout`: 4–6 chambers joined by passages, one loop at times, a mouth from the west edge, seeded by the place. Cave ragged, cellars square-cut |
| Rules | Its rock is the battle terrain's rock, so routes, sight, missiles and the ways off the field obey it. The mouth is the only way out |
| Who goes in | The page: up to `INTERIOR.men` (8, companions count), Back and Enter. The rest wait outside and cannot fall |
| Riders | On foot inside |
| Dark | Fog always on, sight × 0.5, the unseen darker |
| Foes | Wait in their chambers until roused (a foe seen within 180 px, or hurt); the strongest deepest, with the chest |
| Look | `InteriorArt`: its own floor, wall faces, stalagmites and bones; a cellar's flags and crates; daylight at the mouth |

## 3. Hideouts (built)

A cave's shape (in ruins, cellars), with the camp in it: bandits in squads of 3 through the chambers, a palisade across the way in with a gap, tents, bedrolls, a fire in each chamber whose light shows whoever stands in it to both sides, and the chieftain's tent with the plunder in the deepest.

## 4. Siege walls (next)

The siege and raid field gets the holding's wall: a wall across the field with a gate and towers, defenders on the wall, attackers with ladders and a ram. To be designed and built next.
