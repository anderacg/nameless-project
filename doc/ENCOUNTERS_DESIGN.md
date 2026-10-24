# Random encounters on the map: design

Status (checked 2026-10-19): **approved** (2026-10-19); phase 1 built (2026-10-19, 17224a0: `world/road.js`, `tests/encounters.js`); **phase 2 built** (8f1c621) (2026-10-19: the 8 new encounters of normal priority, as data in `ROAD_ENC` with their numbers in `ENC_TUNE`; the shared chase and catch in `RoadEncounter` and `ENC_CATCH`; stand-in figures until phase 3's props); **phase 4 in part built** (2026-10-19, 937ca04: the sealed letter as a real item, `world/letters.js`; the fake wounded (a lure); the pilgrims at real shrines; see "Phase 4 as built" below). Also built 2026-10-19: the sound-wave highlights (3baad24, aed29cd, b3560c5), the healed traveller walking off bandaged (51841e8), nothing ending in sight (7c895f0), stat checks (8f072a3), strayed sheep (19c0cae), the gamblers' cap (da995ab). **Built 2026-10-23 (ST3):** three small encounters from the backlog, a warm campfire, an herbalist and a toll on the road (see "The small encounters" below). **Open:** phase 3 (the props) and the rest of phase 4 (prisoner wagon, execution, duel), and the small-encounters backlog; their order is in IMPLEMENTATION_PLAN §10 (items 2, 3 and 9), which owns the queue; this doc owns the designs.

**Built 2026-10-24:** the abandoned wagon is a visible, silent roadside encounter, replacing the instant daily 15-gold find. It uses the cart prop, lasts 24 game hours, and offers Search the wagon (15 gold once) or Leave (no reward; return while it remains). Searched wagons remain in sight; expired wagons end outside sight. No owner, call, notice sound or sound waves. The usual sight check and encounter mark apply. Repairing a cart for the pack train remains planned in LOGISTICS_DESIGN §4. Tests: `tests/wagon.js`.

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
| Shown | Drawn like other map figures (depth order, fog, smooth movement). **No pause** (owner): instead, highlights: a pulsing **"!"** with a soft glow round its figures while unmet; a call-out line ("Help! Over here!") and a soft sound when it first comes into view; an **arrow at the screen edge** when it is just off-screen; a log line ("Someone calls out from the road to the east"). **As built (2026-10-19):** sound waves ripple out from it instead of the glow (3baad24); a plain blue "!" (aed29cd); off the screen, waves rolling in "((((" at the screen's edge instead of the arrow (b3560c5; `gfx/worldui.js` `wuiArc`, `WAVE`). |
| Behaviour | **Approach:** walks toward you and stops beside you. **Stay:** waits in place. **Flee:** runs from you. **Scene:** a fight or event already under way, which ends on its own after a time. |
| Meet | Click it (you walk there), or it reaches you. Its page opens; some force a choice (an ambush springs). |
| Leave | It despawns when you are far away, after its time is up, or when its story ends; never while you can see it (owner, 2026-10-19: its time up in your sight, it ends its kind's way and is gone once out of your sight; see below). A few leave a trace: a body, a burnt wagon, a rumour in the next tavern. |

### How long an ignored encounter lasts (one in-game hour is 7.5 s at 1×)

| Behaviour | Lasts | Then |
|---|---|---|
| Approach | 2–3 h (15–22 s), or until you outpace it | walks off (along the road where there is one); gone once out of your sight |
| Stay | 6–8 h (45–60 s) | out of your sight: ends there (the wounded traveller's body, the abandoned cart). In your sight, by its kind: **moves on** (gamblers, hunters, deserters, the poacher with his deer): packs up and walks off along the road, its people only (the tent, fire and dice stay out of the picture), gone once out of your sight; the **cart in the mud**: the farmer walks off and the abandoned cart is left at once in its place; the **wounded traveller** holds on (still there to help) and dies only while you are not looking, or before your eyes once you have watched him 6 h past his time; the **collapsed mine**, the **lure** and the **ambush** end only out of your sight |
| Flee | until out of sight, at most 2 h | gone once out of your sight (the thief, a spooked poacher, the wisps); a grazing horse past its time in your sight wanders off slowly |
| Scene | 3–8 h (22–60 s) | out of your sight: plundered (a burnt wagon). In your sight it plays out: the raiders ride off (raiders only: the caravan's folk are dead or fled) and the burnt wagon is left at once in its place |
| Walk (phase 2: a procession) | as long as its walk, 4–10 h | it arrives: out of your sight it ends; at a holding's gate it ends (they went in); at a shrine or ruins in your sight it stays 2–3 h (the pilgrims kneel and pray, as the pilgrims found praying do; the mourners stand by their dead), then walks off and is gone once out of your sight |
| Run (phase 2: the thief across your view) | 2–3 h | gone once out of sight |

**Nothing ends while you can see it** (owner, 2026-10-19). An encounter whose time is up in your sight does not vanish: it ends its kind's way (above) and disappears only once out of your sight. One walking off is never forced away in your sight; 6 h past its time it ends once past 0.8× your sight, so nothing lingers. Out of your sight, it ends at its time as before. Built as data: each kind's `ends` in `ROAD_ENC` (`leave`, `unseen`, `die`), else its behaviour's (`ENC_END`: stay and scene walk off; the rest wait till you are not looking); `goes` picks which of its pieces walk off; the numbers in `ENC_LIFE` (`pray`, `dying`, `linger`). Passing one by still cuts the pity timer once, when it truly ends.

Any of them leaves at once when you are about 1.5× your sight away. Traces fade after a day, and may become a tavern rumour. One table per behaviour (`ENC_LIFE`).

## 3. The encounters

### From today's events, now on the map

| Encounter | Figures and scene | Behaviour | Choices (verbs) |
|---|---|---|---|
| Wounded traveller | a man lying by the road (the fallen pose) | stays; calls out | Help (bandage, food) · Rob · Leave |
| Wandering merchant | a peddler with a mule (caravan sprite, small) | approaches | Trade · Leave |
| Pilgrims (built 2026-10-19: real shrines) | 2–4 pilgrims on the road to the nearest real shrine on the map; or, a shrine just past your sight, kneeling and standing at it, beside the map's own shrine (no shrine of their own) | walks to the shrine and ends there; or stays, praying | Pray with them (walking: Walk and pray with them, an hour) · Give alms · Take the coins (asks first) · Leave |
| Deserters | 2 soldiers of a realm, no banner | stay; may flee if you are that realm's | Recruit (15 gold: both join; their map figures disappear immediately, including while moving) · Turn them in · Leave |
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

- **`world/road.js` (new):**
  - `class RoadEncounter extends WorldObject`: position, kind, behaviour (approach, stay, flee, scene), scene pieces, timers.
  - Spawn and despawn rules; the data table `ROAD_ENC` (kind → where, when, weights, cooldown, behaviour, scene, page).
- **The page:** through `PageScreen`, so buttons are verbs, confirms come from the base, and Insight reads from Scouting.
- **Reuses:** existing fights (`startEncounter`), trade (the travellers' shop), recruiting, conduct and reputation (`wrong`, `addRep`, honour), quests and rumours.
- **Kept in `world/events.js`:** the weather and sickness entries (blizzard, sandstorm, storm, fever) stay instant events. Only the people events move to the map.
- **Phased:**
  1. the system, plus today's 14 people events moved onto the map;
  2. the 8 new ones of normal priority: cart stuck in mud, thief on the run, poacher, funeral, wedding, runaway horse, beggar, messenger;
  3. the new props (open: IMPLEMENTATION_PLAN §10.2);
  4. **lower priority, kept in the game, built last** (owner, 2026-10-19): fake wounded (lure; built, 937ca04), prisoner wagon, execution, duel challenge (open: IMPLEMENTATION_PLAN §10.9). The duel needs a one-on-one hero fight first.
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

Choices made in building it: the procession's time is its walk (4–10 h) rather than the scene's 3–8 h, since holdings stand 300+ px apart; the thief keeps his own 2–3 h and comes at the edge of your sight, so he crosses it; the chase is a sprint (×1.6) so a band on foot can catch a runner; the messenger's sealed letter is paid in gold (no letter item yet; since 937ca04 a real item, see "Phase 4 as built"); a poacher may be on your own land too. Figures are stand-ins: the cart is the caravan's (a mud patch under it), the bier a shrouded body between two bearers, the dead deer the map's deer on its back, the horse the map's horse with a saddle, the messenger a rider on it.

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

### Stats on the road (2026-10-19)

The owner's rule: **your stats only add.** The base is what anyone gets today; stats add on top of it, up to a cap, and a stat of 0 is never worse than today (no new ways to fail). One table, `ENC_STAT` (`{base, parts: [[stat, per]…], cap}`), and one helper, `statOdds(k)` (base + Σ stat × per, at most cap), with `statRead` (the chance through Insight: vague, rough or exact by Scouting) and `statHelps` (which stats help, on the page, so you learn what to train).

| Encounter | Choice | Stats | With stats |
|---|---|---|---|
| Wounded traveller | Tend his wounds | Medicine +15%, Intellect +3% (care, 0–1) | still always heals; reputation and renown × (1 + care), a chance (care × 60%) of 5–10 gold from his purse; `e.care` kept on him for later chains or escorts. The lure's Tend shows the same and springs the ambush (no check) |
| Cart in the mud | Help push | Strength +5%, Athletics +5% | up to 60% less stamina (or time) |
| Gamblers | Play | Intellect or Charisma (the higher) +1.5% | 48% → at most 65%. They play at most 5 hands and quit once 100 gold down to you (`ENC_GAMBLE`, da995ab) |
| Collapsed mine | Search it | Survival +4%, Intellect +1% (gear: +2%, +1%) | 60% → at most 85% (gear 40% → 55%) |
| Will-o'-wisps | Follow them | Intellect +2.5% | 50% → at most 75% |
| Hunters' camp | Join the hunt | Survival +10%, Hunting +5%, Archery +5% | meat × (1 + it), up to 6; furs × it, up to 2 |
| Funeral / Wedding | Pay respects / Join / Give a gift | Charisma +8% | honour, morale, reputation × (1 + it), up to twice |
| Runaway horse | Catch it | Riding +8%, Agility +4% | as before, 25% → at most 90% (on the helper, the same numbers) |

### Strayed sheep (built 2026-10-19, 19c0cae, from the owner's small-encounters backlog)

A shepherd on open land near a holding, by day; 3-4 of his sheep scattered 40-80 px round him (`ROAD_PART.stray`, parts of
his encounter that never come alone). **Round them up**: the strays are marked; ride into each (within your grab reach, which
Agility widens) and it goes back to his flock; they trot off when you come close. His thanks, once, for what came back: his
wool or cheese and reputation a sheep, more (and morale) when every one is home; then he walks off with his flock. Numbers:
`ENC_SHEEP`. The rest of that backlog (fortune teller, runaway serf, flotsam, snowed-in travellers) is noted, not built:
IMPLEMENTATION_PLAN §10.3; the toll, the warm campfire and the herbalist are built (below).

### The small encounters (built 2026-10-23, ST3, from the same backlog)

Three kinds in `ROAD_ENC` (`world/encounters.js`, their helpers at the file's end), their numbers in `ENC_TUNE` (`campfire`,
`herbalist`, `toll`: weights, the numbers below, and `again`, each one's days before it comes again once the road reads it) and
their checks in `ENC_STAT` (stats only add, as above). Every ending goes through `Encounter#finish`; their state (what you read,
learnt, searched, how high the toll went) is on the record and saved with `W.road`. Figures from the map's people and props;
new small pieces: a fire burnt to its embers, a bedroll, an herbalist's basket and a toll's striped barrier (`gfx/encounterscene.js`).

| Encounter | Where and when | Behaviour | Choices and outcomes |
|---|---|---|---|
| Warm campfire | beside a road (`byroad`), anywhere, ×1.4 by night | stays (ends out of your sight) | **Read the tracks** (40%, +10% a Scouting level, +4% a Survival level, at most 95%; trains Scouting): who left it, how many, which way, and where they went goes on your map as a rumour's "?" (news `tracks`); missed, the ground is too trampled, no second try. Who: bandits 35% (a band of the land's), a lord's patrol 25% (only on a realm's land), travellers 25%, beasts 15% (wolves; jackals in the desert, marsh hounds in the swamp, white wolves in the frost) · **Lie in wait** (bandits read, 3+ men): 2 hours, then a fight with only the first 60% of them (they come back a few at a time) · **Rest a while**: 2 hours, stamina and mana and some health; whoever left may come back (bandits 50%, beasts 35%, a patrol or travellers 25%; less by your watch: −8% a Scouting level, −4% a Leadership level, at most −70%): bandits catch you in their trap (an ambush you cannot flee), beasts tear into your packs (−3 food, morale −4), a patrol or the travellers share the fire (morale +3; the travellers' news) · **Search the ashes** (once): a purse (5–15 gold), or 12% of finds a piece of gear (finds likelier at a bandits' fire: 70%, travellers' 60%, a patrol's 50%, after beasts 40%); or a trap (bandits 40%, others 10%, beasts none; less by Agility +4% and Scouting +5% a level, at most −80%) that lames a man · Leave |
| Herbalist | a wood's edge (`wood`), by day, never in the frost or the desert; ×1.5 while you carry wounded | stays, then walks off with her basket | **Buy remedies**: up to 4 of your wounded mended (the fevered first, back into their groups), 8 gold a man, −5% a Trade level (at most −40%) · **Buy a tonic** (12 gold, Trade too): stamina, mana, some health · **Help her gather**: 2 hours (less by Survival 8% and Hunting 4% a level, at most −50%), reputation +3 in her holding, Survival trained, 2 of your wounded mended free (none wounded: a rest) · **Learn from her** (once): 2 hours, Medicine trained (+12 if she takes to you: 30%, +8% a Medicine level, +3% a point of Intellect, at most 85%; else +4) and 20 XP · **Rob her** (asks first): her purse (6–14 gold) and her salves (2 of your wounded mended, if any), honour with her realm −4, reputation in her holding −6, morale −3 · Leave |
| Toll on the road | on a road, on a realm's land (not yours, nor a realm hostile to you), by day | stays at its barrier; springs as you pass | Men in the colours of the realm whose land it is: the lord's own (30%) or impostors (a band of the land's). The toll: 10 gold + 1 a man of your band, at most 60, −5% a Trade level. Who they are shows on the page at Scouting 3 ("the lord's own men: their writ bears the seal" / "no lord's men: patched colours and a forged writ"); below it, the Insight read of the writ's odds · **Pay the toll** · **Ask for their writ** (30%, +10% a Scouting level, +3% a point of Intellect, at most 90%; once): the truth · **Talk your way through** (25%, +8% a Persuasion level, +4% a point of Charisma, at most 85%; once): through for nothing; failed, the toll ×1.5 · **Refuse**: the lord's own let you by (honour −4 with the realm, reputation −4 in its holding); false ones back off from a band 1.5× their power, else fight · **Fight them** (asks first unless you know they are false): the lord's own cost honour −10 and reputation −8 too; the fight is named for them ("the Vale Crown's toll-men", `vs`) · **Report them** (known false, a band 2× their power, room for a passenger): their ringleader rides bound with you to the reeve of the holding (an escort, `ESCORT.who.impostor`): 25 gold, reputation +5, honour +3 there, and the news (`toll`) goes round; late, he slips his bonds (reputation −2) · Turn back |

Choices made in building it: the campfire's band is mustered when it comes (the lure's way) and marked by a heard rumour
rather than a band on the map (the shepherd's warning makes a band somewhere else; this one is the one at the fire); a real
toll's men are the realm's own troops, their fight not a band's; reporting false toll-men is an escort of their ringleader
(the escort system, ST1) rather than a new "report at a holding" path; the per-kind cooldown (`again`) waits for a one-line
change in `world/road.js` `roadPick` (until then the shared 5 days).

## 6. Questions for the owner

1. ~~Spawn rate~~: decided (a pity timer, 2 a day, no repeat within 5 days; passed by: −25–50%).
2. ~~Pause~~: decided (no pause; highlights).
3. ~~Cuts~~: none; four are lower priority (phase 4).
