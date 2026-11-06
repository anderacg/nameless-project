# Fights inside: design

**Status:** 2026-11-06: caves, ruins' cellars and hideouts built (`prototype/js/battle/interior.js`, `tests/interiors.js`); siege walls built (§4: `prototype/js/battle/siegeworks.js`, `tests/siegewalls.js`); walls round holdings on the map built (§5: `prototype/js/world/townwalls.js`, `tests/townwalls.js`).

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

## 3. Hideouts and bandit lairs (built)

The owner (2026-11-06): two kinds. A **bandit hideout** is a camp of tents in a ring of stakes (its camp sprite), fought on the map as a camp with your whole band, as before. A **bandit lair** (`HIDEOUT_LAIR.share`, 45% of them, by a hash of the tile: no new draw, never saved) is drawn as a cave's mouth where hills or peaks stand within 3 tiles, else as a timbered tunnel dug into the ground, with the band's banner; it has its own name (Bandit lair, Raider tunnels, Bog raider warren) and is fought inside. Bandits in ruins (a den) are fought in its cellars.

Inside a lair: a cave's shape (in ruins, cellars), with the camp in it: bandits in squads of 3 through the chambers, a palisade across the way in with a gap, tents, bedrolls, a fire in each chamber whose light shows whoever stands in it to both sides, and the chieftain's tent with the plunder in the deepest.

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
| Look | `SiegeArt` (improved 2026-11-06, the owner: "improve the sprites in siege"), in the holding's culture (its arena's stone or timber): the wall's sloped foot, a walk of flagstones (a palisade's logs with lit points and a plank walk), merlons each with its face, the inner lip, a soft shadow; towers standing (props sorted with the soldiers: raised tops, crenellated, faces of courses with arrow slits, the holder's banner); a cobbled passage (a palisade's earth); studded doors and a portcullis that crack under the ram, splinters once broken; ladders with rails and rungs; a covered ram on wheels whose head swings as your men work it |

## 5. Walls round holdings on the map (built)

The owner (2026-11-06): "make a wall for holding or estates": drawn **and blocking**, the estates **inside the town wall**.

| Part | As built |
|---|---|
| Who | Every holding with walls (palisade, stone or great: `wallOf` > 0); raised or razed with them (a village fortified gets one) |
| The ring | A rectangle a tile out round its centre, houses, estates and their fields (those within 14 tiles of its own tile) |
| Gates | Wherever a road or ford crosses the ring (not one running along it), a tile wider either side; gates within 3 tiles one; none: one below the centre |
| No wall | On water and peaks (already impassable), or a tile another holding's building stands on |
| Blocking | The router's layer (`SHUT` bit 4): every way (`findPath`, the chunk tables, straight lines, road legs over a wall are no way), every walker (`walk`), every march (`wayLand`), your own straight step; whoever stands on a wall as it rises steps off it |
| Look | Standing pieces sorted with the buildings: a stretch across (its walk and merlons over its face), one down (its walk between parapets), towers at the corners, either side of each gate and every 7 tiles of stone; a palisade's stakes and timber towers; in the holding's culture; drawn where you have seen their ground |
| Shut to its foes | (the owner, 2026-11-06, "Yes") While it is besieged (a lord's siege, yours), while an army at war with it marches on it within 16 tiles, or while you, its foe, stand outside its walls that near, its gates shut too: no one passes. Its besiegers camp 3 tiles outside the gate nearest them; riding at it, you are met at that gate. Lifted, the gates open again |
| Saves | Never saved: made from the lots |
| Switch | `TOWN_WALL.on` (off in the harness, so the older suites keep the map as it was) |
