# Fights inside: design

**Status:** 2026-11-06: caves, ruins' cellars and hideouts built (`prototype/js/battle/interior.js`, `tests/interiors.js`); siege walls built (§4: `prototype/js/battle/siegeworks.js`, `tests/siegewalls.js`).

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

## 4. Siege walls (built)

The assault on a walled holding (palisade, stone or great walls) is fought against its wall, not across an open field. Villages and raids keep the open field (they have no walls).

| Part | As built |
|---|---|
| The wall | Down the field at 0.6 of its width, the holding behind it. A wall-walk raised 1 level (palisade) or 2 (stone, great), its outer face sheer, its inner face sheer but at the stairs |
| Towers | Flanking the gate and along the wall (great walls twice as many), rock |
| The gate | In the middle, shut (rock: no way through, nothing seen through) |
| Ladders | Built in camp (the assault needs them): 3 places where the outer face can be climbed, a man at a time |
| The ram | Built in camp by RAM_DAYS: each of your foot at the gate takes 12 a second from it (palisade 260, stone 480, great 720). Broken, the gate is a way in, and every defender is roused |
| Defenders | Shooters along the wall-walk facing out, foot behind the gate, lords and characters in the yard; they hold their posts till roused (a foe near, one of theirs hurt, the gate broken) |
| Everyone | On foot |
| Rules | The wall is the battle terrain's levels, cliffs and rock: routes, sight (the yard hidden behind the wall), high ground (archers reach farther, blows land harder from above) and the ways off the field obey it |
| Look | `SiegeArt` over the climate's ground: the walk's stone courses (a palisade's stakes), the parapet and merlons, its shadow, stairs, towers with their faces, the gate's doors (shut, battered, or broken), the ladders, the ram |
