# Random encounters on the map: design

Status: **approved** (2026-10-19); phase 1 being built.

## 1. The idea

Today a "road event" is a window that pops up at random (`world/events.js`, 21 of them). We replace the ones with people in them with **encounters you can see on the map**, in the spirit of Red Dead Redemption 2's strangers:

- They appear just outside your sight as small scenes with their own figures: a broken wagon with its owner, a wounded man by the road, hunters round a fire, a thief running.
- **Some walk to you:** someone calling for help, a messenger, a beggar.
- **Others stay put:** you choose whether to ride over or pass by.
- Clicking one, or meeting it, opens its page (the shared single page: a picture banner, what you see, verbs as key actions), with the Insight reads from Scouting.
- Ignore it and it plays out on its own: it walks away, gets robbed, or dies, and you may hear about it later.

**Weather and sickness** (blizzard, sandstorm, storm, fever) are **not map encounters**: they **stay as today's instant events** (owner, 2026-10-19: they can still happen), with their climate rules and effects unchanged.

## 2. How an encounter lives

| Part | Rule |
|---|---|
| Spawn | **Rare, with a pity timer** (owner, 2026-10-19). A counter of **travel time since the last encounter** (time moving on the map; not in towns, paused or in battle). Every in-game hour of travel, the chance is `base + rate × counter`, capped, and scaled by region (roads busier, wild land rarer). Tuned to about one encounter every 1–2 in-game days of travel. |
| Counter | **Met** (you interact): the counter resets to 0. **Passed by** (seen but not met, it leaves): the counter drops by a random 25–50%. |
| Limits | At most **2 encounters a day**, and the **same kind not again within 5 in-game days**. |
| Where | Just beyond your sight ring, 40–120 px out, on walkable ground: on or by a road for travellers, in a wood for hunters, on hills for the mine. Never inside a holding. |
| Which | Weighted by climate, terrain, time of day (some only at night), how near a holding is, your band (size, honour, renown), and a cooldown per kind (no repeat for N days). |
| Shown | Drawn like other map figures (depth order, fog, smooth movement). **No pause** (owner): instead, highlights: a pulsing **"!"** with a soft glow round its figures while unmet; a call-out line ("Help! Over here!") and a soft sound when it first comes into view; an **arrow at the screen edge** when it is just off-screen; a log line ("Someone calls out from the road to the east"). |
| Behaviour | **Approach:** walks toward you and stops beside you. **Stay:** waits in place. **Flee:** runs from you. **Scene:** a fight or event already under way, which ends on its own after a time. |
| Meet | Click it (you walk there), or it reaches you. Its page opens; some force a choice (an ambush springs). |
| Leave | It despawns when you are far away, after its time is up, or when its story ends. A few leave a trace: a body, a burnt wagon, a rumour in the next tavern. |

### How long an ignored encounter lasts (one in-game hour is 7.5 s at 1×)

| Behaviour | Lasts | Then |
|---|---|---|
| Approach | 2–3 h (15–22 s), or until you outpace it | walks off |
| Stay | 6–8 h (45–60 s) | packs up and moves on; some leave a trace: the wounded traveller dies (a body), an abandoned cart |
| Flee | until out of sight, at most 2 h | gone |
| Scene | 3–8 h (22–60 s) | plays out: the caravan plundered (a burnt wagon), the procession arrives |

Any of them leaves at once when you are about 1.5× your sight away. Traces fade after a day, and may become a tavern rumour. One table per behaviour (`ENC_LIFE`).

## 3. The encounters

### From today's events, now on the map

| Encounter | Figures and scene | Behaviour | Choices (verbs) |
|---|---|---|---|
| Wounded traveller | a man lying by the road (the fallen pose) | stays; calls out | Help (bandage, food) · Rob · Leave |
| Wandering merchant | a peddler with a mule (caravan sprite, small) | approaches | Trade · Leave |
| Roadside shrine pilgrims | 2–3 pilgrims at a little shrine (prop) | stays | Pray with them · Give alms · Leave |
| Deserters | 3–5 soldiers of a realm, no banner | stay; may flee if you are that realm's | Recruit · Turn them in · Leave |
| Gamblers | soldiers round a fire with dice | stay | Play (pick a stake) · Leave |
| Collapsed mine | a shaft mouth and old carts (hill) | stays | Search (risk) · Leave |
| Hunters' camp | 2–3 hunters, a fire, pelts | stay | Trade · Hunt with them · Leave |
| Lost child | a child alone (small figure) | approaches | Take her home (escort to the holding) · Leave |
| Wandering bard | a bard with a lute | approaches | Hear a song (renown) · Leave |
| Will-o'-wisps | lights in the bog at night | flee as you come | Follow · Leave |
| Caravan under attack | a caravan and raiders, already fighting | scene (ends in about 1 minute) | Join the fight · Leave |
| Ambush | hidden: shown only to Scouting 2+ ("movement in the trees") | springs when you pass | Fight · Withdraw |
| Refugees | a family with a cart | approaches | Give food · Escort · Leave |
| Shepherd's warning | a shepherd and sheep | approaches | Listen (reveals a band) |

### New ones in the RDR2 spirit

| Encounter | Figures and scene | Behaviour | Choices |
|---|---|---|---|
| Cart stuck in mud | a farmer pushing a cart (by water or swamp) | stays; calls out | Help push (stamina) · Rob · Leave |
| Thief on the run | a man running, a shouting victim behind | flees | Chase (catch: reward or loot) · Let go |
| Fake wounded (a lure) | a "wounded man", bandits hidden near | calls out | Help (Scouting 3+ warns you) · Leave |
| Execution | a gallows (prop), soldiers, a prisoner | stays | Watch · Free him (fight the guards) · Leave |
| Duel challenge | a lone swordsman | approaches | Accept (hero duel) · Refuse |
| Poacher | a hunter with a deer, in a lord's wood | flees if seen | Turn him in · Buy the meat · Leave |
| Funeral procession | mourners with a bier | passes along the road | Pay respects (honour) · Leave |
| Wedding party | villagers with music | passes along the road | Join (morale) · Gift · Leave |
| Runaway horse | a saddled horse | flees, then stops | Catch (Riding check: the mount is yours) · Leave |
| Beggar | an old man | approaches | Give · Ignore |
| Prisoner wagon | guards escorting a cage cart | passes along the road | Free the prisoners (fight) · Leave |
| Messenger | a rider | approaches | Read (a rumour or quest) · Rob (a letter to sell) |

## 4. Art: the figures and props

- **People:** today's 16 px map figures (`gfx/people.js`) with poses we already have: walking, the fallen pose, seated or idle. Small variants: a child (shorter template), a peddler with a pack, a bard with a lute.
- **Beasts:** the map beasts (`PX.beastMap`): the deer, the sheep, a horse.
- **Props** (new, small, in the engine's house style, 8–16 px):
  - a broken cart or wheel, a cage cart, a gallows;
  - a roadside shrine, a mine mouth with carts;
  - a fire (exists), dice on a cloth, a bier.
- **Scene layout:** each encounter is a small arrangement of these pieces (people placed round a fire, a cart and its owner). One `EncounterScene` composes them, so most new encounters need only data.
- **The page banner:** cropped from the map around the scene, as the sites' pages are.

## 5. How it is built

- **`world/encounters.js` (new):**
  - `class RoadEncounter extends WorldObject`: position, kind, behaviour (approach, stay, flee, scene), scene pieces, timers.
  - Spawn and despawn rules; the data table `ROAD_ENC` (kind → where, when, weights, cooldown, behaviour, scene, page).
- **The page:** through `PageScreen`, so buttons are verbs, confirms come from the base, and Insight reads from Scouting.
- **Reuses:** existing fights (`startEncounter`), trade (the travellers' shop), recruiting, conduct and reputation (`wrong`, `addRep`, honour), quests and rumours.
- **Kept in `world/events.js`:** the weather and sickness entries (blizzard, sandstorm, storm, fever) stay instant events. Only the people events move to the map.
- **Phased:**
  1. the system, plus today's 14 people events moved onto the map;
  2. the 8 new ones of normal priority: cart stuck in mud, thief on the run, poacher, funeral, wedding, runaway horse, beggar, messenger;
  3. the new props;
  4. **lower priority, kept in the game, built last** (owner, 2026-10-19): fake wounded (lure), prisoner wagon, execution, duel challenge. The duel needs a one-on-one hero fight first.

  The owner reviews screenshots after each phase.

  The owner reviews screenshots after each phase.

## 6. Questions for the owner

1. ~~Spawn rate~~: decided (a pity timer, 2 a day, no repeat within 5 days; passed by: −25–50%).
2. ~~Pause~~: decided (no pause; highlights).
3. ~~Cuts~~: none; four are lower priority (phase 4).
