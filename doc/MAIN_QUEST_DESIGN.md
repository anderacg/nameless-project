# The main quest line: "The Unpaid": design

**Proposed, for the owner's review, 2026-10-23.** Design only; nothing here is built. Written by agent MS against `battle-rts-and-world` as of 2026-10-23 (ST1–ST4 and QU built; QM is building the quest model in its own worktree).

**What this is:** a sketch of the main story that follows the opening, "A Name on the Road" (doc/OPENING_STORY_DESIGN.md, the owner's own, approved). It offers proposals and choices, not decisions. Section 8 lists the open questions, each with a suggested default.

**The quest model it assumes** (the owner, 2026-10-23; QM is building it):
- **Main:** can't be abandoned; failing a stage rolls back to a checkpoint.
- **Side:** optional, can't be abandoned, can fail.
- **Jobs:** the boards' and the lords' repeatable work.
- **States:** Locked (greyed, with its requirements), Available, Active, Completed, Done, Failed, Abandoned.
- **A story is one quest;** its steps are stages with objectives.

**Words used here:**
- **The home realm:** the realm whose land the opening's village lies in. If the village belongs to no realm, the realm nearest to it.
- **Your patron:** the person your chosen lead introduced at the end of the opening: the village head (more local work), the grain factor at the marked market (a merchant's living) or the lord (a lord's service).
- **The cast:** the story's people and places, chosen when the story needs them and kept in the thread's memory (§1.4).

---

## 1. Premise and through-line

### 1.1 The premise in one paragraph

The opening's three deserters were not alone. Across the land, soldiers are being turned out unpaid. Where the realms are at war, the pay is months behind. Where peace has come, armies are simply sent home with nothing. Hungry, armed and owed, these soldiers drift onto the roads. A former sergeant of the home realm, **the Captain**, starts gathering them under a grey rag on a pole. They cut their realm's colours off their coats and sew on grey cloth. Within a season, the muster becomes **the Grey Company**: soldiers of every realm and every people, a few hundred strong, owed more than any one lord can pay. The main line is the story of that company, and of the one person every side ends up trusting enough to talk to: you.

### 1.2 Why this premise fits

| The owner's taste | How it fits |
|---|---|
| Medieval and grounded, not epic fantasy kitsch | Free companies after a war are real history (the Great Companies of the 1360s, the Écorcheurs). No dark lord, no prophecy, no chosen one. The antagonists are hunger, debt and a few people who profit from them |
| Grows out of the opening | The opening's deserters say it themselves: "Orders stopped. Pay stopped. Hunger didn't." The main line follows that line to its end |
| No shared family tragedy, no imposed allegiance | You are a stranger with a name, nothing more. The Company is of every realm and race. You never have to serve the home realm, or anyone |
| Works whatever the world does | The sim decides whether realms are at war or at peace. Both produce unpaid soldiers, so the story reads the world's state and fits it: "the war goes on and the pay doesn't", or "the war ended and they turned us out" |
| Stakes grow from local to realm-wide | Act I: one cart, one muster. Act II: roads, prices, a burnt village, a captain on the gallows. Act III: a castle, a council of the realms, where hundreds of soldiers will go |
| Consequences that last | Each act leaves marks on the world: tolls and prices, a steward hanged or rich, a village standing or burnt, a castle changed hands, the Company's men in your band, your realm's ranks or your fields |
| Player freedom | Every quest offers several ways through (fight, talk, pay, walk away, side with them). The destination is fixed (the council); the route and the ending are yours |

### 1.3 Themes

- **A promise and who keeps it.** The roadkeeper's promise, the deserters' unpaid wages, the Captain's word to his men, your word to all of them. The opening's last line was "people here know your name"; the main line asks what that name is worth when everyone wants it.
- **Who soldiers belong to.** To the realm that raised them, the captain who feeds them, or themselves?
- **Bread before banners.** Most of the conflict is about food and pay, not glory. The economy you already play (grain, prices, granaries, caravans) is the story's ground.
- **Mercy and its price.** Hanging deserters is easy and lawful. Feeding them is costly and makes enemies. Neither is free.

### 1.4 The cast (roles, bound at runtime)

The world is generated, so no person or place is hand-placed. Each role is chosen when its quest begins, kept in the thread's memory, and **rebound** if the world takes it away. This is the same rule as the opening ("bind targets by identity", "rebind safely").

| Role | Who or what | Chosen as | If the world takes it away |
|---|---|---|---|
| **The Captain** | A former sergeant of the home realm, of its people (a generated name; e.g. Captain Hallam Vey). Tired, fair, hard when he must be | Made at Q3 (a story character, like Ander: a `Character`, unlisted) | Never killed off the map: he shelters at the Company's site until Q8. Q8 decides his fate |
| **The Lieutenant** | His second, of another people (e.g. Brask, an orc). Angrier; thinks the realms understand only fire | Made at Q3 | As the Captain, until Q7 |
| **The Deserter** | The leader of the opening's three deserters | Already met in the opening | Gone if he died in the opening's battle; a prisoner if he surrendered (§4) |
| **Your patron** | The village head, the grain factor, or the lord, by your chosen lead | The opening's lead | The lord killed, captured or his realm fallen: his realm's senior lord, else the nearest lord not hostile to you. The village burnt: its head lives on as a refugee in the nearest holding |
| **The Steward** | The steward of a town or castle of the home realm, who keeps its granary and its lord's accounts | Q5: the home realm's holding with the most grain, within reach of the opening region | Holding captured: he flees with his ledger to the realm's next holding |
| **The muster** | A ruin in the wild edge near the opening region | Q2: the nearest ruin 15–40 tiles from the opening's village, reachable by land | No ruin: a hideout clearing (`HIDEOUT_PLACE` rules), marked as the muster |
| **The crossing** | A bridge or ford on a road through the home realm (the world's crossings, built) | Q4 | No crossing in reach: the narrowest point of a road between two holdings |
| **The burnt village** | A village of the home realm near the muster, **not** the opening's own village | Q7 | Changed hands: the next village near the muster |
| **The castle** | A weakly held castle or town of the home realm, best one sacked in the wars | Q9 | Taken by another realm before Q9: the Company's plan names the next one |
| **The council place** | Neutral ground: the Grand Stadium (designed, not built); else a monastery (designed, not built); else the hall of a holding whose realm is at peace with every side | Q10 | Changed hands: the next candidate |
| **The home realm** | See "Words used here" | The opening | It falls: the realm that conquered its last holding inherits the Company's grievance ("they took the land, they can take the debt") |

**Names (the owner, 2026-10-23: "use the band name from user input"):** your band's name is always the one you chose (`P.band`, the band card; its random names and its default included). The story's own names give way to it, never the other way: if your band's name matches the Company's ("the Grey Company") or an ending's title ("The Free Company"), the story uses another for its side ("the Grey Banner", "the Unpaid"), chosen when the role is bound and kept in the thread's memory.

### 1.5 The three leads: one destination, three routes

All three of the opening's leads lead into the main line. **The lead colours the route, not the destination.** Your patron reappears through the story, gives you an easier way through some stages, and colours your ending.

| Lead | Your patron | How Q2 begins | Their help later | Their colour in the ending |
|---|---|---|---|---|
| **More local work** | The village head | Another cart lost; guard the next one | The village vouches for you (local reputation counts for more in talks with the Company); the village takes in refugees in Q7 | The village's fate is told first in the epilogue |
| **A merchant's living** | The grain factor at the marked market | Cheap grain sold in her market by men with grey cloth | Reads the Steward's accounts (Q5); can lend gold toward the arrears (Q10, a loan) | Trade and prices in the epilogue; the factor's house prospers or not |
| **A lord's service** | The lord | His own men have deserted; he gives you a writ to bring them back | Opens his hall and his realm's ear (Q6, Q8, Q10); his word can save a life in Q8 | Your standing in his realm in the epilogue |

If you chose no lead, or your patron is lost, the village head is the default patron. The main line does not need a patron to continue.

---

## 2. Acts and quests

### 2.0 At a glance

| Act | # | Quest | Size | Needs NEW systems? |
|---|---|---|---|---|
| **I. Hungry Men** (local) | 1 | A Name on the Road (the opening) | M | its own doc |
| | 2 | Grey Cloth | M | the cast (N2), Company bands (N3) |
| | 3 | The Muster | M | N2, N3 |
| **II. The Company** (regional) | 4 | The Toll at the Crossing | M | a band that holds a spot (N4) |
| | 5 | The Steward's Granary | M | none beyond N2 |
| | 6 | Terms | M | the Company's stance per realm (N3) |
| | 7 | Smoke over the Village | L | a scripted raid (N4) |
| | 8 | The Captain Taken | M | none: the `held` step (ST4) |
| **III. Bread or Banners** (realm-wide) | 9 | Winter Quarters | L | a staged siege by the Company (N4) |
| | 10 | The Council | L | a truce at the council place (N4); endings (N5) |
| | 11 | A Name Remembered | S | endings (N5) |

Eleven quests, three acts. **Act II has an open middle:** Q4, Q5 and Q6 can be taken in any order, and Q7 needs two of the three. Everything else runs in order.

**The NEW systems** (kept to five; details in §7.1):
- **N1.** The main-quest category and checkpoints. QM is building it; this design only uses it.
- **N2.** The cast: roles bound at runtime, with rebinding rules (§1.4).
- **N3.** The Grey Company: a band kind, its strength as a story number, its bands spawned from its sites, its stance toward each realm.
- **N4.** Staged map actions: a band that holds a spot, a scripted raid, a staged siege camp, a truce zone.
- **N5.** Endings: the closing pages, the world's changes, a title, the sandbox after.

Everything else in the line uses what is built: threads and their step kinds (`visit`, `deliver`, `lair`, `escort`, `held`), pages and choices with odds, outcomes, the bus, bands and hideouts, parley and yielding, sieges and capture, fiefs, contracts, lords' relations, honour, reputation, renown, letters and messengers, rumours, refugees, the economy's stocks, ruins, the toll encounter (ST3), the lists, the dragon, and the `companion` outcome (Ander's).

**How to read the stage tables:** each stage has an objective and a **checkpoint**: what failing it rolls back to, and what the world says. "Fail forward" marks a stage whose failure changes the story instead of rolling back (§6.2).

---

### Act I. Hungry Men

**The act's shape:** from one stolen cart to a muster of sixty. You learn the Company exists, meet its Captain, and decide what he is to you. Nothing you do in Act I stops the Company forming; it decides how it forms and how it sees you.

#### Q1. A Name on the Road (the opening) · M

As designed in doc/OPENING_STORY_DESIGN.md, unchanged. It becomes the first Main quest: it can't be abandoned, and its "Find my own way" choice only delays it (the roadkeeper still offers it).

**What the main line takes from it** (kept in the thread's memory when Q1 ends):
- the opening's village, the home realm and the region;
- how the deserters were dealt with: **deal** (paid from the contract), **fought** (beaten in battle) or **yielded** (a stronger band, by parley);
- the Deserter's fate: free (deal), a prisoner (yielded and kept), dead or fled (fought);
- the chosen lead, and so your patron.

**Checkpoints:** the opening's own recovery rules already are checkpoints: a lost battle leaves the band where it was, the deal is always offered, and every stage survives save and load.

#### Q2. Grey Cloth · M

Whatever lead you chose, your patron has a problem that smells the same. More carts are lost. Soldiers walk the roads in twos and threes, armed and thin. Grain turns up in markets far from where it grew. The opening's deserters had a strip of grey cloth sewn where their realm's colours had been, and others wear it too. Someone is gathering them.

| Stage | Objective | Checkpoint (fail → back to; the world says) |
|---|---|---|
| 2.1 Your patron's problem (by lead) | **Local:** carry the village's next 10 grain to the nearest holding (a `deliver` step); a band of four grey-cloth deserters waits on the way. **Merchant:** find who sells cheap grain in the factor's market (a `visit` at night: the seller, the Company's quartermaster; press him by Charisma, pay him, or follow his cart: Scouting). **Lord:** find his deserters with his writ (a placed band of five of his men) | The band beats you: it stays where it was, and "the grey-coats are still on the {road}". The quartermaster refuses: he comes back to the market in 2 days |
| 2.2 The grey cloth | Each route ends with the same clue: a strip of grey cloth and a place, "the muster at {ruin}". Go there (a `visit`) | Cannot fail |

**Choices and what lasts:**
- **The deserters on the road (local, lord):** fight, take their yield (parley), or let them go. **Handed to the lord** (lord route): he hangs them, lord relation +6, the Company's trust −1 (they hear of it). **Let go:** lord relation −5 if he asked, the Company's trust +1; they vouch for you at the muster.
- **The quartermaster (merchant):** buy his grain (cheap; the factor sees you trade with them) or turn him in to the holding's watch (reputation +3 there, the Company's trust −1).
- **The Company's trust** is a story number from −3 to +3, kept in the thread's memory (not a new system: a memory field). It opens and shuts choices later.

**Systems:** `deliver`, `visit` steps; a story-placed band (a quest's quarry, `Quest.quarry`); parley and yielding; prisoners handed to a lord (a small outcome on top of the existing hand-over of leaders) [N3 for the band kind].
**Requirements (Locked):** Q1 done.

#### Q3. The Muster · M

At a ruin in the wild edge, sixty soldiers of every realm and people sit round cook-fires under a grey rag on a pole. It is not a bandit camp: there are no captives, no loot. It is a muster. Their captain makes no secret of it: "Orders stopped. Pay stopped. We are owed, and we will eat while we wait." He asks you for nothing but food. The Lieutenant, beside him, asks nothing at all, and watches your band.

| Stage | Objective | Checkpoint |
|---|---|---|
| 3.1 The muster | Ride up to it (a page: Insight shows their numbers and mood). If you bring the lord's men in chains, or come in force, they meet you armed: a stand-off page | Cannot fail; a fight here starts 3.2c |
| 3.2 What the muster is to you | Take **one** of four ways (below) | By the way taken |
| 3.3 Back to whoever asked | Report to your patron or the Captain (a `visit`, or the page at the muster) | Cannot fail |

**The four ways at 3.2:**

| Way | What you do | Fail → checkpoint | What lasts |
|---|---|---|---|
| **a. Bread** | Bring 30 food to the muster (a `deliver`; scaled by its size) | None: bring it when you can; it waits | The Company's trust +2. The home realm's honour −2 if you serve it. The Captain remembers who fed them |
| **b. Count them** | Count them for your patron or the nearest lord (stay a night, or Scouting 3), and report | Caught counting (a roll on Agility and Scouting): thrown out, the Company's trust −1, try again from 3.1 | Lord relation +6, the home realm's honour +3. The Company's trust −1 (they find out in Act II) |
| **c. Break it up** | Attack the muster (a `lair` step: 30–40 low-tier soldiers, mixed peoples; the Captain yields at a third of his men lost) | Lost: back to 3.1. "They let you go. They have no food for prisoners." | The muster scatters, but the Company forms anyway, smaller and angrier: the Lieutenant's voice is stronger (§3.2). The home realm's honour +5, renown +5, the Company's trust −3 |
| **d. Walk away** | Say nothing, do nothing | — | Nothing changes; the Company forms. Trust stays where it is |

**The Deserter:** if he went free in the opening (the deal), he is here, and he vouches for you (the Company's trust +1 at 3.1). If you hold him prisoner, the Captain asks for him: release him (trust +1) or keep him. See side quest S3 (§4).

**Act I ends** with a line in the log and the taverns: "Through the lean months, soldiers keep coming to the grey rag at {ruin}."

**Systems:** a ruin as the muster (ruins already take occupants: CONDUCT_RUINS_DESIGN §3; the muster is a story occupant); `deliver`, `visit`, `lair` steps; parley; the Captain and Lieutenant as unlisted characters (as Ander) [N2, N3].
**Requirements (Locked):** Q2 done; level 3.

---

### Act II. The Company

**The act's shape:** the muster becomes the Grey Company: 150–300 soldiers in three to five bands, with a site of their own (the muster, now a fortified camp). It starts to feed itself, from the roads and the granaries. Everyone (holdings, merchants, lords, the Company itself) starts asking you to settle things. Act II ends with the Company split or united, and its Captain free, dead or in your debt.

**Unlock:** Q3 done, 10 days after it, level 6, renown 40.

**The open middle:** Q4, Q5 and Q6 are Available together, in any order. Q7 needs any two of them done.

**The Company on the map in Act II** (N3): its bands are ordinary bands of a new kind, `company` (grey pennants, mixed peoples' troops, no chieftain's bounty until it turns to raiding). They roam the home realm's fringes and rest at their site. They do not attack you while the Company's trust is 0 or above. Their number grows only as the stages say (§5.3: the story waits).

#### Q4. The Toll at the Crossing · M

The Company has learned to feed itself: a toll at the crossing. Caravans pay or turn back. Prices rise in the holding beyond it. Its people, or your patron, ask you to open the road.

| Stage | Objective | Checkpoint |
|---|---|---|
| 4.1 The crossing | Go there (a `visit`). The toll men are the toll on the road (ST3) as a fixed story copy: a Company band of 20–40 holding the crossing | Cannot fail |
| 4.2 Open the road | One of four ways (below) | Lost a battle: back to 4.2; the band still holds the crossing, its wounded back in 3 days. "The grey toll still stands at {crossing}." |
| 4.3 Report | Back to the holding that asked (a `visit`) | Cannot fail |

| Way | What lasts |
|---|---|
| **Break the toll** (a battle) | The road opens; reputation +8 at the holding; the Company's trust −2; one of its bands is gone |
| **Bargain** (Persuasion and Charisma; easier with trust 1+) | A fair toll, half to the holding: a lawful toll the realm puts up with. Reputation +4, the Company's trust +1. Prices settle |
| **Take a cut** | 10 gold a day for 20 days. Honour −3 with the home realm; reputation −6 at the holding. The Company's trust +1 |
| **Leave it** | The toll stays until Act III; the holding's stocks run low and prices stay high (the economy does it: the outcome takes goods from its stock) |

**Systems:** the toll encounter (ST3), the world's crossings (built), the economy's stocks (built); a band that holds a spot [N4].
**Requirements:** Act II unlocked.

#### Q5. The Steward's Granary · M

Why is there no pay and no bread, when the Steward's granary is full? He has been selling the realm's grain over the border and sending the lords the bill. The proof is in his letters. What you do with the proof decides who eats.

| Stage | Objective | Checkpoint |
|---|---|---|
| 5.1 The rumour | Hear it (your patron, a tavern, or the Captain). Go to the Steward's holding | Cannot fail |
| 5.2 The proof | One of three ways: **intercept his rider** (a messenger on the road carrying a sealed letter: letters, built); **buy his clerk** (gold); **search his stores by night** (Agility; Stealth) | The rider escapes: another rides in 3 days. Caught in the stores: a fine (the watch's, built), and the stores are guarded for 2 days; then try again |
| 5.3 The use of it | One of four ways (below) | Cannot fail |

| Way | What lasts |
|---|---|
| **To his lord** | The Steward is hanged; the granary opens (the holding's food and prosperity up). The home realm's honour +5, lord relation +10. The lord pays part of the Company's arrears: the Company's trust +1, and its arrears (Q10) smaller |
| **To the Captain** | The Company takes the Steward's grain caravans. The Company's trust +2, it grows (one more band); the home realm's honour −4 if they learn |
| **Blackmail him** | 150 gold now. Honour −3. He remembers you (side quest S8) |
| **Burn the letter** | Nothing changes. The Steward keeps selling; prices in his holding stay high |

On the merchant route, the factor reads the ledger for you: a third way to the proof (no roll), and she knows who else bought the grain.

**Systems:** letters and the messenger encounter (built), the watch's fines (built), the economy's stocks, a lord's talk; the Steward as a story character on the holding's page [N2].
**Requirements:** Act II unlocked.

#### Q6. Terms · M

The Company wants terms: its arrears, and quarters for the lean months, in exchange for its swords. You are the one person both sides will talk to. You carry the terms. The world's state matters: a realm at war is tempted to hire them; a realm at peace wants them gone.

If the Company's trust is below 0, the same quest comes from the other side: the lord sends you to the Company with an ultimatum. The stages are the same, reversed.

| Stage | Objective | Checkpoint |
|---|---|---|
| 6.1 Carry the terms | To your patron lord, or the home realm's senior lord (a `visit` and a talk page) | The lord gone or captured: rebound (§1.4). You are hostile to the realm: the village head or the factor carries them for you, at a cost (gold, and the answer is colder) |
| 6.2 Carry the answer back | Back to the Captain. **Tell it straight**, or **shade it** (Persuasion) | A shaded answer found out later (Act III): the Company's trust −2 |
| 6.3 The outcome | Read below | Cannot fail |

| Outcome | When | What lasts |
|---|---|---|
| **A season's contract** | The realm is at war, and you argued well (relation, honour, Persuasion) | The Company serves the home realm for 30 days: its bands leave that realm's land alone and fight its enemies' bands and caravans. Its arrears shrink. The Company's trust +1, honour +3 |
| **Hired by the enemy** | The realm refuses while at war with another | The Company sells its swords to the enemy realm: for 30 days its bands raid the home realm's caravans. Prices there rise |
| **Refused at peace** | No war to fight | The Company turns to tolls and "protection" of villages: one more toll (as Q4) on another road |

**Systems:** a lord's talk, honour, relations; the Company's stance per realm (N3: a flag the band brains read: who they leave alone and whom they hunt).
**Requirements:** Act II unlocked. Shown Locked as "The Company does not know you yet" only before Q3.

#### Q7. Smoke over the Village · L

The turning point. Not all of the Company keeps the Captain's rules. The Lieutenant takes his band and burns a village of the home realm: to teach the realm what the Company could do, or to take what the Captain would not. You hear it from a rider, with smoke already on the horizon.

This stage has **the act's one clock**: two days to reach the village in time. Missing it is not a failure; it changes what you find.

| Stage | Objective | Checkpoint |
|---|---|---|
| 7.1 The rider | A messenger finds you (a page). Ride to the village | **Fail forward:** later than 2 days, 7.2 becomes "Ashes" |
| 7.2a In time | Fight the Lieutenant's raiders at the village (40–60, his best; the village's militia with you) | **Fail forward:** lost, the village burns: 7.2b. You wake near the next holding (today's rule), and the Lieutenant's band rides back to its site |
| 7.2b Ashes | The village raided to the ground (its estates burnt, `raided`): survivors on the road as refugees (built) | — |
| 7.3 The Company's fate | Choose (below) | By the way chosen |

| Way at 7.3 | Needs | Fail → checkpoint | What lasts |
|---|---|---|---|
| **Make the Captain give him up** | Trust 1+; Persuasion and Charisma, easier with the village saved | Refused: the Captain won't; choose again | The Captain hangs the Lieutenant himself. **The Company united** under the Captain. Trust +1 |
| **Hunt the Lieutenant** | — | Lost: his band stays, falling back to its hideout (`lair` retarget, built). "{Lieutenant}'s men drink to your health in {hideout}." | The Lieutenant dead or yielded. **The Company split:** his half turns outlaw (ordinary bandit bands for the rest of the game, his name on their bounty) |
| **Turn the realm on the Company** | — | — | You tell the home realm's lord where the Company's site is. The realm's lords ride against it in Act III; the realm route opens wide (honour +8). The Company's trust −3 |
| **Ride with the Lieutenant** | Trust 1+; you raided or sacked before (your honour with the home realm under 0) | — | The dark road: the Lieutenant leads the Company (§3.2). Honour −10 with the home realm; reputation −20 across its villages |

Saved or burnt, the village lasts: a burnt village is a ruin for 20 days (today's rules) and its people are refugees in the nearest holding, where your patron (if local) speaks for them. Side quest S7 hangs here.

**Systems:** the messenger page, refugees (built), raided and burnt estates (built for your own raids), `lair` with retarget (built); a scripted raid by a story band [N4: an outcome `raid: {town, f}` that runs the existing raid code for a band, since bandit raids are not built].
**Requirements:** two of Q4–Q6 done; level 10; renown 100 (the rank of Warlord).

#### Q8. The Captain Taken · M

The realm strikes back. The home realm's lord catches the Captain on the road and holds him in his castle. He will hang in five days, at the gate, for the realm to see. Everyone has an opinion about what you should do.

If you turned the realm on the Company in Q7, this quest is the same seen from the other side: you are there when the lord takes him, and the choice is mercy or the rope.

This stage has a **clock** (the hanging day), with one rule: **while you besiege the castle, the hanging waits** (no lord hangs a prisoner of value with an army at his gates). The clock also pauses while you are held captive (§6.4).

| Stage | Objective | Checkpoint |
|---|---|---|
| 8.1 The news | A page, from whoever is nearest you (your patron, the Deserter, a Company rider) | Cannot fail |
| 8.2 The Captain's life | One of five ways (below) | **Fail forward:** the day passes, he hangs: 8.3 with the Lieutenant (or, if he is dead, the hardest of the Company's sergeants) leading |
| 8.3 After | The Company's new shape, told on a page; Act II ends | — |

| Way | Needs | Fail → checkpoint | What lasts |
|---|---|---|---|
| **Ransom him** | Gold at the gates (the gaoler's page, the `held` step, built: ST4; 400 gold, tunable) | Not enough gold: come back with it before the day | Free. The Company's trust +2. The lord's relation −5 (he wanted a hanging) |
| **Plead for him** | Lord relation Friend (30+), or your patron's word (lord route), or honour 30+ with the home realm; a Persuasion check | Failed: one try only; ransom or the other ways remain | Free on parole: the Company's trust +2, and the realm's view of the Company softens (Q10 easier) |
| **Storm the castle** | A siege (built) | Lost: back to 8.2 (the clock resumes); your band beaten, as today | Free; the castle is yours to keep or hand over (today's capture page). War with the home realm if you were not already |
| **Let him hang** | — | — | The Company hardens. The Lieutenant (or the hardest sergeant) leads it into Act III (§3.2) |
| **Hang him yourself** | You serve the home realm | — | Honour +5 with the realm; the Company's trust −3 for good; the Company leaderless, then led by the Lieutenant |

A held Captain is never lost to the world's chaos. If the castle changes hands, its new holder keeps him; if it is razed, he walks free. These are ST4's rules for a held traveller, reused.

**Systems:** the `held` step and the gaoler's ransom page (built, ST4), sieges and capture (built), lord relations, honour; a clock on a stage (N1's checkpoint framework, with the pause rules).
**Requirements:** Q7 done.

---

### Act III. Bread or Banners

**The act's shape:** the lean months are coming, and the Company (300–500 soldiers by now, in its bands) must have a roof or scatter into banditry for good. Its leader has a plan: take a castle. Every side asks you to choose. **Act III opens with your allegiance**, and that choice sets the route to the council and the ending (§3).

**Unlock:** Q8 done, 10 days after it, level 14, renown 180.

#### Q9. Winter Quarters · L

The Company's leader names the castle: a weakly held castle of the home realm, best one sacked in the wars. Your allegiance decides which side of its walls you stand on.

| Stage | Objective | Checkpoint |
|---|---|---|
| 9.1 Choose your side | A page with three answers, each shown with what it needs (below). The choice locks the route until the end | Cannot fail |
| 9.2 The route's task | By route (below) | By route |
| 9.3 After the castle | A page: who holds it, who is owed, who is angry. A call to the council | Cannot fail |

| Route | Needs at 9.1 | 9.2: the task | Fail → checkpoint | What lasts |
|---|---|---|---|---|
| **For a realm** | A contract with the home realm (or sign one now at its hall: today's mercenary contract), or service with any realm at war with the Company | Break the Company's siege of the castle: its bands camp before the walls (a staged siege camp, N4); you attack them in the field, with the realm's lords near the castle riding with you (lords join your fights: built) | Lost: back to 9.2; the siege goes on, the castle holds 5 more days (a soft clock; past it, fail forward: the castle falls to the Company, and Q10 opens with the Company inside its walls) | The Company beaten in the field. The castle stays the realm's. Honour +10 |
| **With the Company** | The Company's trust 1+, and no contract (or end it, at today's cost) | Lead the assault: your band and the Company's bands besiege the castle (your siege, built; the Company's bands fight beside you as allies) | Lost: back to the siege camp; the Company regroups in 3 days | The castle falls. **Keep it** (today's capture page): it becomes yours, the Company its garrison. The home realm at war with you |
| **On your own land** | You hold a holding of your own (a fief you took, or one you founded: Phase 4b) | Offer it as quarters. No siege: lead the Company's march there, past the home realm's watch. A realm's lord blocks the road (a field battle) | Lost: back to the march's last camp; the lord's army holds the road 3 more days | The Company quartered on your land (its men as your holding's garrison and people). The home realm's honour −10 (you sheltered its deserters) |

On the dark road (the Lieutenant leads, and you rode with him at Q7), only the Company route is offered. On the realm route, the Lieutenant's Company fights to the last.

**Systems:** sieges, capture and keeping a holding (built), lords riding with you (built), contracts (built), your fiefs (built); a staged siege camp and the Company's bands as allies in your siege [N4]; founding (Phase 4b, not built: see §6.5).
**Requirements:** Act III unlocked.

#### Q10. The Council · L

Whatever happened at the castle, the realms come to the table. Hundreds of soldiers cannot all be hanged, and none of the realms will pay them alone. A council meets on neutral ground under truce: the home realm's senior lord, the senior lord of any realm the Company served or fought, the Company's leader, and you. You come with what you have earned: honour, relations, the Company's trust, renown, and gold.

| Stage | Objective | Checkpoint |
|---|---|---|
| 10.1 The arrears (optional, powerful) | Raise the Company's arrears: 3,000 gold by default, less by what Q5 and Q6 paid off. Any source counts: your gold, ransoms, trade, the factor's loan (merchant route), the dragon's hoard (side quest S5), the Steward's purse (if you blackmailed him). Pay it in at the council | None: any part helps |
| 10.2 To the council | Ride to the council place (a `visit`). A truce holds within 8 tiles: no fights there (N4) | Cannot fail |
| 10.3 The council | Four rounds, each a page of choices with their odds: **who pays**, **where the soldiers go**, **the leader's fate**, **what you get**. Checks read honour, lord relations, the Company's trust, renown, Persuasion, the gold you brought, and what you did (the Steward exposed, the village saved, the Captain spared) | A round lost: the next round is harder. Two lost: the council breaks (10.4) |
| 10.4 If the council breaks | The last battle: on the realm route, against the Company's hardest men; on the Company or own-land routes, against the home realm's host (its lords together) | Lost: back to 10.3, the council's first round, with relations shifted (the lords remember the field). "The lords sit down again, warier than before." |

The council's result, with your route, gives the ending (§3.1).

**Systems:** pages and choices with odds (built), gold outcomes, honour, relations, lords' battles; a truce zone and the council's speakers [N4, N5]. The Grand Stadium and monasteries are designed, not built: see §6.5.
**Requirements:** Q9 done.

#### Q11. A Name Remembered · S

The epilogue, in the opening's village. The roadkeeper, the carter, the village head. A short page for each thread you touched: the village, the Deserter, the Steward, the burnt village, the Lieutenant, the Captain, the Company's soldiers. Then a title for your name, and the sandbox goes on.

| Stage | Objective | Checkpoint |
|---|---|---|
| 11.1 Home | Go to the opening's village (a `visit`; if it is gone, its head's new holding) | Cannot fail |
| 11.2 What came of it | The pages; the title; renown +20 | — |

The village head's last line echoes the opening's: "A stranger came down this road with a note. Look at the road now."

**Systems:** pages, a title [N5].
**Requirements:** Q10 done.

---

## 3. Branches and endings

### 3.1 Three endings, each with a hard variant

Your route (Q9) gives the ending. Whether the council held (Q10) gives its tone.

| Route | The council holds | The council breaks (and you win the field) |
|---|---|---|
| **For a realm** | **The Lord's Peace.** The Company is taken into the realm's pay and spread across its garrisons. You are granted a fief (the castle, or the next free holding of the realm) and its lords' respect (honour +15, relations +10). Title: *Marshal of {realm}* | **The Rope.** The Company is broken by force; its leader hangs. The fief is granted all the same, but the realm's villages remember the hangings (reputation −10 there), and the Company's remnants become outlaw bands |
| **With the Company** | **The Free Company.** The Company is yours: the castle (if taken) and a standing force. The realms sign terms: peace with you, for now. The Company's soldiers become a large one-off pool of recruits of every people at your holding. Title: *Captain of the Grey* | **The Wolf's Share.** No terms: you hold the castle by the sword. The home realm at war with you; the others wary. A great band of your own, and every lord's suspicion |
| **On your own land** | **Land for Swords.** The soldiers settle on your land: your holding's people and garrison grow, and the realms that signed recognise your holding (honour + with each). Title: *Breadgiver* | **A Hard Winter.** The soldiers stay without terms. The home realm hostile for 60 days; your holding a target. They are yours to feed |

That is **three distinct endings** (realm, Company, own land), each with a softer and a harder form. The **dark road** (you rode with the Lieutenant at Q7) can only reach the Company route; it starts at the hard variant unless the council holds against the odds.

**The Captain and the Lieutenant in the endings:**
- **The Captain alive:** in the Lord's Peace, a sergeant again, in the realm's pay; in the Free Company, your second and a companion (the `companion` outcome, as Ander's); in Land for Swords, the reeve of your holding (a governor, once Phase 4b's governors exist; a line on its page until then).
- **The Lieutenant alive:** leads the outlaw remnants (a named chieftain with a bounty that grows), or, on the dark road, your second.

### 3.2 What changes the route along the way

| Earlier choice | Its effect in Act III |
|---|---|
| The muster broken up (Q3c) | The Company is smaller and angrier: its council rounds are harder, and the Lieutenant leads it if the Captain dies |
| The Company's trust (−3 to +3) | Opens the Company route (1+); shades every council round |
| The Steward exposed, or given to the Captain (Q5) | Lowers the arrears; a realm round easier (exposed) or a Company round easier (given) |
| A season's contract (Q6) | The home realm's lords already know the Company's worth: "who pays" is easier |
| The village saved (Q7) | Every council round a little easier: the story people tell about you is a good one |
| The Company split (Q7) | Fewer soldiers to place; the outlaw half stays a menace after the end |
| The Captain freed by your word or gold (Q8) | His voice is on your side at the council |
| The Captain hanged (Q8) | The Lieutenant leads: the Company route reaches its hard variant unless trust is 3 |

### 3.3 After the end: the sandbox goes on

- The main line moves to the journal's archive as Done. Nothing else stops.
- The Company's remnants follow the ending: soldiers in a realm's garrisons, your troops, your holding's people, or outlaw bands that dwindle as they are beaten (no new ones spawn).
- The realms' wars, the dragon, tournaments, jobs, side quests, your holdings: all as before.
- The world remembers: the titles, honour and relations the ending gave; the castle's owner; the burnt village's ruin until it rebuilds; the Steward's fate.
- **Later hooks (not in this design):** realm rulers (deferred), founding a kingdom (the design backlog), and a second main line, if the owner wants one. The Company's terms could seed it.

---

## 4. Side quests that hang off the main line

Side quests are optional, can't be abandoned, and can fail by the world. None is needed to finish the main line; several make it easier.

| # | Side quest | Hangs off | What it is | Needs | Size |
|---|---|---|---|---|---|
| S1 | **The Wounded Traveller** (built, ST2) | None: any time | As built. In Act II, the gang that robbed him wears grey cloth (a line on the family's page, nothing more) | built | — |
| S2 | **Ander The Fallen** (built, ST2, ST4) | None: rare (1% × `HIDDEN_RATE`) | As built. If Ander rides with you in Acts II–III, **he served with the Captain once** ("We held the line at {place}. He paid us out of his own purse when the lords didn't."): his lines at the muster, and one council round easier with him there. Never required | a few lines and one check | S |
| S3 | **The Deserter's Debt** | Q1, Q3 | The opening's deserter. **Freed by the deal:** at the muster he vouches for you; later he asks to ride with you: a companion (unlisted, like Ander), a veteran of the home realm. **Your prisoner:** release him at the muster (trust +1) or hand him to a lord (hanged; trust −1). **Dead:** his brother asks the Captain about you at the muster (trust −1 unless you fought fairly). A lasting face from the first hour | the `companion` outcome (built) | S |
| S4 | **The Carter's New Cart** | Q1 | The carter from the opening needs 60 gold for a cart and a mule. Pay it, and the village's grain runs again: its prosperity up, and a small grain gift each week while you hold it in good standing | outcomes only | S |
| S5 | **The Hoard** | Q10 | The old soldiers say the dragon's hoard holds a king's ransom. Find the lair (WORLD_DESIGN §6.5: clues from monasteries, taverns, standing stones) and take the hoard: enough to pay much of the Company's arrears. Without the lair (not built): kill the roaming dragon (built); its story hoard pays 1,500 gold on top of its own | the dragon (built); the lair (Phase 4) for the full version | M |
| S6 | **The Grey Champion** | Act II | The Company's best fighter enters the lists at a regional tournament (TOURNAMENTS_DESIGN, designed). Beat him for the Company's respect (trust +1) and his sword. Until tournaments are built: today's lists, where he is the champion you fight | the lists (built, basic) | S |
| S7 | **The Ashes of {village}** | Q7 | Its refugees on the road: escort them (the escort, built) to a holding that will take them, or to your own; settle them (today's refugees' "settle"). The village rebuilds faster with its people back | escort, refugees (built) | S |
| S8 | **The Steward's Memory** | Q5 (blackmail) | The Steward does not forget. Weeks later, men he hired wait on a road (an ambush, built) and his letters turn a lord against you (relation −10). Clear it by exposing him after all, or by paying again | the ambush (built) | S |

**The jobs' role.** Jobs (the boards' and the lords' work) are how the sandbox breathes between main quests: the gold, renown and levels the next main quest asks for come mostly from jobs, trade and war. In Act II, a few board jobs take Company targets (a bounty on a Company band gone to raiding, a supply run to a hungry holding) through the existing kinds with a story target; they are still jobs, repeatable and free to leave. No job is ever required by the main line.

---

## 5. Pacing

### 5.1 Where the player is expected to be

Band size follows today's capacity (`8 + 3 × level + renown ÷ 25 + Leadership + Charisma ÷ 2`). These are expectations to tune in play-tests, not walls; the Locked requirements (§2) are the only walls.

| When | Level | Your band | Renown (rank) | The Company | Rough days |
|---|---|---|---|---|---|
| The opening (Q1) | 1–2 | 0–8 | 0–10 (Wanderer) | three deserters | 1–3 |
| Act I (Q2–Q3) | 2–7 | 8–30 | 10–60 (Captain at 30) | a muster of 30–60 | 3–30 |
| Act II (Q4–Q8) | 7–14 | 30–55 | 60–180 (Warlord at 100) | 150–300, in 3–5 bands | 30–90 |
| Act III (Q9–Q11) | 14+ | 55–90, with lords or the Company beside you | 180–300 (Lord at 250) | 300–500 | 90–150 |

The battles scale with it: Act I's fights are 4–40 a side; Act II's 20–60; Act III's are sieges and field battles with allies.

### 5.2 How the sandbox breathes

- **The main quest waits.** No main stage has a timer except the two that need one (Q7's village, Q8's hanging), and both fail forward. Everything else waits for as long as you like.
- **Gaps between acts.** Each act needs some days after the last (10 by default) as well as level and renown. The world needs time for a muster to become a company; you need time to grow.
- **The Company waits too.** Its growth is tied to the stages, not to the days (§5.3), so a player who wanders off for 100 days does not come back to an unwinnable war.
- **Reminders, not nagging.** While a main quest is Available, a rumour or two a week mentions the Company in taverns; the journal shows the next objective. Nothing pops up.

### 5.3 The world doesn't wait; the story does

The design pillar says the world moves without you. This line squares that with "the main quest waits" so:
- **The world moves on its own:** realms' wars and peace, sieges, lords, prices, bands and the dragon run as ever, and the story reads them (war or peace, who holds what).
- **The Company moves only with the story:** its size, its sites and its deeds (a toll, a raid, a march) happen at the stages that call them. Between stages, its bands roam and rest; they do not grow or take castles on their own.

---

## 6. The rules applied

### 6.1 The main line can't be abandoned

- No Abandon button for a Main quest (QM's model). **Untrack** stays: you can put it away.
- Every choice that sounds like "walk away" (Q3d, "leave the toll") is a choice inside the story, not an abandonment: the story notes it and goes on.

### 6.2 Failing rolls back to a checkpoint, or fails forward

Three kinds of failure, each with one rule:

| Kind | Example | Rule |
|---|---|---|
| **A decisive fight lost** | The toll band beats you (Q4); the siege fails (Q8, Q9) | **Rollback** to the stage's checkpoint. The foe stays (its wounded recover), and a log line says so. You wake by today's rule |
| **A clocked stage missed** | Late to the village (Q7); the hanging day (Q8) | **Fail forward:** the story goes on down its harder branch. Never a dead end |
| **The world takes a role away** | The lord dies; the castle changes hands; the home realm falls | **Rebind** (§1.4). Not a failure: the stage continues with its new target, and a line says what changed |

**What the world says:** every rollback writes one log line and, where people would talk, a rumour ("The grey toll still stands at {crossing}"). The journal's objective shows the checkpoint's objective again.

**Saving:** each stage, its choice and its outcome happen at most once and survive save and load, as the opening requires. The thread's memory holds the cast, the Company's trust and strength, and every choice.

### 6.3 Hero death

The campaign's rule today: **a hero whose health runs out outside a battle ends the game**, with a Load last save button (CAPTIVITY_DESIGN, "Death"); **a lost battle** costs a quarter of your gold and you wake near the nearest holding. The main line adds nothing: **no story resurrection**, and no main stage kills you by script. A lost battle in a main stage is a rollback (§6.2). If the owner adds more to death later, the main line follows it.

### 6.4 Capture

Captivity is designed, not built (CAPTIVITY_DESIGN.md).
- **Built:** captured during a main stage, the captivity thread runs first; the main stage **pauses**, and its clocks pause with it (fair to the player). Once you are free, the stage resumes at its checkpoint.
- **Special cases:** taken by the Company with its trust 1+, they let you go the next morning (a page; "light" terms, nothing taken). Taken by the Lieutenant's men, you are held; the Captain (trust 1+) or the Deserter (S3) may free you.
- **Not built (today):** a lost battle is a rollback as above. Nothing in the main line needs captivity.

### 6.5 Unbuilt designs: where a stage needs them, and how it degrades

| Unbuilt design | Where the main line would use it | Without it |
|---|---|---|
| **Captivity** (CAPTIVITY_DESIGN) | Being taken during a main stage (§6.4) | Today's "wake up near"; a rollback |
| **Natural hamlets** (WORLD_DESIGN §6.3; paused) | Q6's "protection" of Free folk; the burnt village could be a hamlet | Villages of the home realm and their estates |
| **Mobile camps and dens** (CAMPS_DESIGN) | The Company's bands camping on the march; the siege camp at Q9; the muster as a camp | The muster is a ruin (or a hideout clearing); the siege camp is a staged band at the holding (N4) |
| **Bandit raids** (planned) | The Lieutenant's raid (Q7); the outlaw remnants raiding after the end | A scripted raid outcome (N4) that runs today's raid code; remnants as ordinary bands |
| **Founding and tiers** (WORLD_DESIGN §7, Phase 4b) | The own-land route (Q9, Land for Swords) | Needs a fief you took (built). With no holding of your own, the route is shown Locked with its reason: "You hold no land of your own" |
| **Governors** (Phase 4b) | The Captain as your holding's reeve | A line on the holding's page |
| **Tournaments as events** (TOURNAMENTS_DESIGN) | S6, the Grey Champion | Today's always-on lists |
| **The Grand Stadium, monasteries** (designed) | The council place (Q10) | The hall of a holding whose realm is at peace with every side; failing that, the Company's site under a truce flag |
| **The dragon's lair** (Phase 4) | S5, the Hoard | Killing the roaming dragon pays the story hoard |
| **Realm rulers** (deferred) | Who speaks for a realm at the council | Each realm's senior lord (its highest level) speaks for it |
| **Entering hostile holdings** (deferred) | A quiet rescue of the Captain (Q8) | Not offered: ransom, plead, storm or let him hang |

---

## 7. Build order

### 7.1 The new systems, small to large

| # | System | What | Size |
|---|---|---|---|
| N1 | Main quests and checkpoints | QM's model; a stage's checkpoint, its clock and its pause rules | (QM) |
| N2 | The cast | Story roles in the thread's memory; their pickers (nearest ruin, a crossing, the granary holding, a castle, the council place); rebinding on the bus (`lord:routed`, `holding:taken`, a realm's fall) | S–M |
| N3 | The Grey Company | A band kind `company` (grey pennant, mixed peoples' troops from each realm's `RACES` kinds); its strength (a story number) and its bands, spawned at its site at the stages that say so; its stance per realm (leave alone, hunt, raid), read by the band brain; unlisted Captain and Lieutenant (as Ander) | M |
| N4 | Staged map actions | A band that holds a spot (the toll; the siege camp); a `raid` outcome for a band, on today's raid code; the Company's bands as allies in your siege; a truce zone round the council place | M |
| N5 | Endings | The council's rounds (pages, built); the ending's world changes (fief granted, garrison and people, recruits, terms as relations and honour, remnants); a title on your character; the epilogue's pages | M |

### 7.2 What can be built first

**Acts I and II can be built almost entirely on what exists.** Their step kinds (`visit`, `deliver`, `lair`, `held`), pages, parley, letters, the toll encounter, refugees, sieges and the gaoler's ransom page are all built. They need N2 and the smaller part of N3 (the band kind; the stance can come with Q6). **Act III needs N4 and N5.**

### 7.3 Proposed order and rough agent sessions

| Step | What | Depends on | Sessions |
|---|---|---|---|
| **MQ0** | QM's model (in progress), then the opening (its own doc's four steps) | — | 4 (the opening) |
| **MQ1** | N2 (the cast), N3's band kind; Act I (Q2, Q3); `tests/mainline.js` (every route through Act I, save and load at each stage); developer commands (`main act 2`, `main q 5`) | MQ0 | 3 |
| **MQ2** | Act II's open middle (Q4, Q5, Q6); N3's stance; the band that holds a spot (N4, part) | MQ1 | 3 |
| **MQ3** | Q7 (the scripted raid, N4) and Q8 (the clock and its pause rules, on the `held` step) | MQ2 | 2–3 |
| **MQ4** | Act III (Q9, Q10, Q11): the staged siege, allies in your siege, the truce, the council, endings (N5), the sandbox after | MQ3 | 4–5 |
| **MQ5** | Side quests S2–S8 (S1 built); one session each, in any order after the act each hangs off | its act | 1 each |

**About 16 sessions after the opening.** By file ownership, MQ5's side quests can run in parallel with MQ2–MQ4 (up to the owner's five agents). Suggested files: `js/story/mainline.js` (the thread kinds, one per act at most), `js/data/mainline.js` (one tunables table, `MAIN`: sizes, sums, days, odds), `js/world/company.js` (N3). Every number in `MAIN`, so the play-tests can tune it.

**Fingerprints:** nothing here runs until the opening ends, and the story draws from its own stream, so the world and battle fingerprints should hold. N3's band kind adds a band brain branch; its suites must show no change while no Company band exists.

---

## 8. Open questions for the owner

Each has a suggested default.

1. **The premise:** a Grey Company of unpaid soldiers of every realm, with no dark lord and no prophecy? *Default: yes.*
2. **The names:** the line "The Unpaid", the "Grey Company", the Captain and the Lieutenant as generated names (e.g. Hallam Vey, Brask)? *Default: yes; the owner may rename any.*
3. **Three acts, eleven quests, an open middle in Act II** (Q4–Q6 in any order)? *Default: yes.*
4. **Endings:** three (a realm's, the Company's, your own land's), each with a hard variant when the council breaks; the dark road (riding with the Lieutenant) kept as a path into the Company's hard variant? *Default: yes, all three and the dark road.*
5. **Failure:** rollback only for lost decisive fights; clocked stages fail forward; lost roles are rebound? *Default: yes.*
6. **Clocks:** only two (Q7's village, 2 days; Q8's hanging, 5 days), both failing forward, both paused while you besiege or are held? *Default: yes.*
7. **The Company grows only with the story,** not with the days, so the main quest truly waits? *Default: yes.*
8. **When you choose your side:** at Q9, locked until the end (the sandbox frees you after)? *Default: yes.*
9. **The burnt village:** a neighbour of the opening's village, never the opening's own? *Default: never the opening's own.*
10. **The dragon:** an optional source of the arrears (S5), not the climax? *Default: yes.*
11. **The opening's deserter** as a recurring face and a possible companion (S3), unlisted like Ander? *Default: yes.*
12. **Ander's tie to the Captain** (S2): he served with him once; lines and one easier council round? *Default: yes.*
13. **Who speaks for a realm** at the council while realm rulers are deferred: its senior lord? *Default: yes.*
14. **Requirements:** level, renown and days since the last act (Act II: level 6, renown 40, 10 days; Q7: level 10, renown 100; Act III: level 14, renown 180, 10 days)? *Default: these, tuned in play-tests.*
15. **Skipping the opening:** may a returning player tell the roadkeeper "I know this road" and start the main line at Q2 (the opening done by the deal)? *Default: yes, offered only on a new game's first page.*
