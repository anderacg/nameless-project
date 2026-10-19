# Random encounters on the map: design

Status: **approved** (2026-10-19); phase 1 built (2026-10-19: `world/encounters.js`, `tests/encounters.js`); **phase 2 built** (2026-10-19: the 8 new encounters of normal priority, as data in `ROAD_ENC` with their numbers in `ENC_TUNE`; the shared chase and catch in `RoadEncounter` and `ENC_CATCH`; stand-in figures until phase 3's props); **phase 4 in part built** (2026-10-19: the sealed letter as a real item, `world/letters.js`; the fake wounded (a lure); the pilgrims at real shrines; see "Phase 4 as built" below).

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
| Scene | 3–8 h (22–60 s) | plays out: the caravan plundered (a burnt wagon) |
| Walk (phase 2: a procession) | as long as its walk, 4–10 h | it arrives and ends: its goal is chosen within 10 h of walking |
| Run (phase 2: the thief across your view) | 2–3 h | gone once out of sight |

Any of them leaves at once when you are about 1.5× your sight away. Traces fade after a day, and may become a tavern rumour. One table per behaviour (`ENC_LIFE`).

## 3. The encounters

### From today's events, now on the map

| Encounter | Figures and scene | Behaviour | Choices (verbs) |
|---|---|---|---|
| Wounded traveller | a man lying by the road (the fallen pose) | stays; calls out | Help (bandage, food) · Rob · Leave |
| Wandering merchant | a peddler with a mule (caravan sprite, small) | approaches | Trade · Leave |
| Pilgrims (built 2026-10-19: real shrines) | 2–4 pilgrims on the road to the nearest real shrine on the map; or, a shrine just past your sight, kneeling and standing at it, beside the map's own shrine (no shrine of their own) | walks to the shrine and ends there; or stays, praying | Pray with them (walking: Walk and pray with them, an hour) · Give alms · Take the coins (asks first) · Leave |
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
| Fake wounded (a lure) (built 2026-10-19) | the wounded traveller to the eye (his picture, call-out, highlight and page), bandits hidden in the woods or hills by the road, a band the size of an ambush's | stays; calls out | Below Scouting 3, his page is the real one's: helping or robbing him springs the ambush (their edge) · Scouting 3: "something moves in the brush behind him": Approach ready (no edge) · Call them out (they show themselves: fight or leave; a small band may run, by Leadership and Charisma) · Scouting 5: how many and the odds · Leave. Rarer than the real one; likelier at night, in the wild, near bands and camps. Ignored: the bandits move on (word on the road) |
| Execution | a gallows (prop), soldiers, a prisoner | stays | Watch · Free him (fight the guards) · Leave |
| Duel challenge | a lone swordsman | approaches | Accept (hero duel) · Refuse |
| Poacher | a hunter with a deer, in a lord's wood | flees if seen | Turn him in · Buy the meat · Leave |
| Funeral procession | mourners with a bier | passes along the road | Pay respects (honour) · Leave |
| Wedding party | villagers with music | passes along the road | Join (morale) · Gift · Leave |
| Runaway horse | a saddled horse | flees, then stops | Catch (Riding check: the mount is yours) · Leave |
| Beggar | an old man | approaches | Give · Ignore |
| Prisoner wagon | guards escorting a cage cart | passes along the road | Free the prisoners (fight) · Leave |
| Messenger | a rider | approaches | Read (a rumour or quest) · Rob (his purse and his sealed letter: an item, phase 4) |

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
     Also in phase 4: **the sealed letter** as a real item (owner, 2026-10-19; see below).

  The owner reviews screenshots after each phase.

### Phase 2 as built (2026-10-19)

| Encounter | Where and when | Behaviour | Choices and outcomes |
|---|---|---|---|
| Cart stuck in the mud | on a road by water, a ford or a bog; by day | stays, calls out | Help push (stamina, or an hour if you are spent: reputation in its holding, a little grain) · Rob (asks first: grain and coins, costs as robbing a worker) · Leave. Ignored: an abandoned cart for a day |
| Thief on the run | on a road near a holding, by day; comes at the edge of your sight | runs across your view from his victim (left where he was robbed); a click opens his page at once | Chase (you sprint after him on the map, ×1.6 your pace; he runs slower for your Agility, your reach grows with it, a mount and Riding make you faster; he is away after 1.5 h or out of sight; Scouting 5 reads whether you can) · caught: Return the purse (reward, reputation) or Keep it (asks first; honor) · Let go |
| Poacher | the edge of a lord's wood (a holding's land with an owner) | stays; runs if he sees you first (at 1.15× your sight, less 0.1 a Scouting level) | Turn him in (reputation, a bounty) · Buy the meat · Leave |
| Funeral procession | on a road near a holding with a shrine or ruins in reach, by day | walks the roads to the shrine or ruins and ends there | Pay respects (honor with its realm, morale) · Leave |
| Wedding party | on a road between two holdings, by day; likelier when your band's morale is low | walks to the other holding, a lute player leading, music over them | Join (morale, 2 hours) · Give a gift (gold, reputation) · Leave |
| Runaway horse | open land, not a bog; likelier with no mount | bolts as you come (half your sight), runs 40–64 px, then grazes | Catch it (Riding and Agility; Insight reads the odds): the region's mount (camel, pony or horse), or its worth if you have one; missed, it bolts · Leave |
| Beggar | on a road near a holding; likelier when your purse is fat | walks up to you | Give 5, 10 or 20 gold (honor with the land's realm) · Ignore |
| Messenger | on a road; a realm's rider in its colours | rides up to you (faster than one on foot) | Read the news (a place you have not found goes on your map, where a lord rides, or the wars) · Rob (asks first: his purse and a sealed letter's price; reputation and honor with his realm) |

Choices made in building it: the procession's time is its walk (4–10 h) rather than the scene's 3–8 h, since holdings stand 300+ px apart; the thief keeps his own 2–3 h and comes at the edge of your sight, so he crosses it; the chase is a sprint (×1.6) so a band on foot can catch a runner; the messenger's sealed letter is paid in gold (no letter item yet); a poacher may be on your own land too. Figures are stand-ins: the cart is the caravan's (a mud patch under it), the bier a shrouded body between two bearers, the dead deer the map's deer on its back, the horse the map's horse with a saddle, the messenger a rider on it.

### The sealed letter (phase 4; owner, 2026-10-19)

Today, robbing a messenger pays his purse plus 20–35 gold "for the letter" at once; there is no letter. It becomes a real item:

- **What you get:** the robbed messenger's **sealed letter** (an item in your bag, one at a time per messenger), with real contents chosen when he spawns: where a lord's army is heading, a holding his realm means to attack, a deal between two realms, or plain news. From, to and what it says are saved with it.
- **What you can do with it** (its page from the bag, verbs only):

| Verb | Does |
|---|---|
| **Break the seal** | You read it: its news goes on your map or in your log (the lord's route, the target, the deal). It stays in your bag, opened. |
| **Sell it to a rival** | In a holding of a realm at war with the sender: gold (more if still sealed) and reputation there. |
| **Deliver it** | Take it to the holding it is addressed to: a reward and reputation. They do not learn you robbed the rider, unless the robbery was seen (a witness roll, by who was near, lowered by Scouting and night). An opened letter pays less and may raise questions. |
| **Burn it** | Gone; nobody learns what it said. |

- **Sealed or opened:** a sealed letter sells and delivers for more; an opened one tells you what it says. You choose which matters more.
- **It goes stale:** after its news has happened (the lord arrived, the attack came, about 5–10 days), it is worth little to anyone.
- **Reuses:** the rumour helpers (`roadNews`), `addRep`/`wrong`, the bag and item pages, the realms' wars and lords' targets.

### Phase 4 as built (2026-10-19, in part)

**The sealed letter** (`world/letters.js`; its numbers `ENC_TUNE.letter`):

- **Its contents** are chosen when the messenger comes (`letterMake`), from the world as it stands, by weight among the kinds there can be: **army** (a lord of his realm marching, laying siege or riding to relieve: his name, his target, his men), **attack** (a holding of a realm at war with his that it means to fall on), **deal** (an alliance against a common enemy, or friendship and trade, offered a realm at peace with his: addressed to that realm's nearest holding), **news** (plain news, perhaps of a place you have not found). From (another holding of his realm), to, the day, when it goes stale (5–10 days) and its worth (30–45 gold × its kind's) are saved with him, and then with the letter.
- **Robbing him:** his purse, and the letter into a free slot of your bag (a full bag: it stays in the mud); the instant "letter's price" is gone. The **witness roll** is made then and stored on the letter: 8% + 12% for each soul within 120 px of him (workers out, caravans, patrols, refugees, lords, bands, other encounters) + 25% within 160 px of a holding, × (1 − 7% a Scouting level), halved by night, 2–90%. The page says whether someone saw.
- **In the bag:** one to a slot, never stacked; its record goes with it (saved as the bag is). Its icon is a folded letter, its wax seal whole or broken. Look it over (or a double-click) opens its page; a holding's overview lists the letters it would take (Show it).
- **Its page** (`PageScreen`, verbs only; Back to the bag or the holding on the left, Back to map or Leave on the right): **Break the seal** (you read it: its words in your log; the place it names goes on your map, or the land round the holding it names; it stays, opened), **Sell it to a rival** (only in a holding of a realm at war with the sender: 1.2× its worth, reputation +4 there), **Deliver it** (only at the holding it is addressed to, while its realm still holds it: 0.8× its worth, reputation +5; seen, it asks first and costs reputation −6 instead), **Burn it** (asks first). Opened, it fetches half (and half the reputation); stale, 15%.
- **Stale:** its lord has reached his target, rides elsewhere or has fallen; the holding to be attacked is besieged or changed hands; the realms settled the deal; or its days are up. Its page says so.

**The fake wounded (a lure)** (`ROAD_ENC.lure`, `ENC_TUNE.lure`): as in §3. It shares the wounded traveller's name, call, log line, tooltip, highlight, picture, text and facts; its band (5–7, more as the days go by, the ambush's kind by the land) is mustered when it comes and is the one you fight (`roadFight(e, true, edge)`: the ambush's battle with its edge, or without). Weight 0.5 × 1.6 at night × 1.4 off a holding's land × (1 + 0.3 for each band or camp within 400 px, at most 3), never over 1.6 (the real one weighs 2). Calling them out scares a band of 6 or fewer at 20% + 6% a Leadership level + 5% a point of Charisma (5–85%).

**The pilgrims** (`ROAD_ENC.pilgrims`): the made-up roadside shrine is gone. A real shrine (the map's shrine sites) just past your sight, with open ground before it: they are found praying there (stay; heard or seen, the shrine goes on your map, and it shows on their page's banner); else they walk the roads to the nearest real shrine they can reach in their time (as the funeral walks) and end there. No shrine within reach: they do not come. Kneeling is the standing figure with its thighs folded away (a stand-in until phase 3's poses).

Choices made in building it: the letter's record rides in its bag slot rather than a list of its own, so the bag's save carries it and nothing is left behind when it is dropped or burnt; a letter cannot be put back on a loot pile; it is read and sold from its own page only (the market's "From your inventory" leaves it out); its page is reached from the bag on the map and from a holding's overview (the bag does not open in a holding); "in a holding" is the holding you are in; the witness is shown to you, so you can choose; the lure's warning and Insight read your Scouting when its page opens.

## 6. Questions for the owner

1. ~~Spawn rate~~: decided (a pity timer, 2 a day, no repeat within 5 days; passed by: −25–50%).
2. ~~Pause~~: decided (no pause; highlights).
3. ~~Cuts~~: none; four are lower priority (phase 4).
