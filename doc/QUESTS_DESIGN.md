# Quests and chains: design

The owner, 2026-11-04: "Right now the chain quest and quest are barebones and look unnatural in many ways like why spawn
bandits/monster near the holding for hunting quest. Can you use your game quest design skills and design the quest properly?"

Status: **design, not built.** Decisions D1–D8 (§12) wait on the owner.

## 1. What is wrong now

The jobs (`world/quests.js`) and the questbook (`data/questbook/`, `story/questbook.js`) work, but most of them make their own
world instead of reading the one that is there.

| Kind | What it does now | Why it feels wrong |
|---|---|---|
| Bounty | Makes a new named band 8–16 tiles from the holding, idle, waiting for you (`BountyQuest.begin`) | The band did not exist before the job and did nothing. It just stands there. No caravan was robbed, no road is unsafe |
| Beast hunt | Makes a pack 6–14 tiles out, "killing livestock outside" (`BeastQuest.begin`); falls back to any spot | The beasts appear on demand, often where they never live, and the livestock is never touched |
| Hunt | "Hides for the tanner" or "meat for the feast", picked by a coin flip | No tanner, no feast and no game nearby needed. A desert town asks for deer hides |
| Supply | A good the holding is short of (`needOf`) | Grounded: this one is right. But it never says why, and the deadline is a flat 10 days |
| Courier | A letter to any friendly holding 18–60 tiles away | Nobody wrote it; it says nothing. The game already has real letters (`world/letters.js`) |
| Troops | Hand over 3–5 tier-2 troops | Asked even when the garrison is full and nothing threatens |
| Clear | The nearest uncleared site | Grounded, but the site may trouble nobody |
| Lordkill, raid | An enemy lord, the nearest enemy village | Grounded in the war, but no reason why this one |
| Questbook `beat`, `hunt` | Make the band or beasts they name | Same as the bounty: a spawn on demand |

And across all of them:

- **The boards pick at random** from the holding's job list (`jobsAt`: `questRng().pick(kinds)`) every 7 days, whatever is
  happening. A village under raid offers the same jobs as one at peace.
- **The giver is the holding.** No one in it has a name, a trade or a stake.
- **The target is a pin.** You are shown exactly where it is, so there is nothing to find out.
- **Nothing changes after.** A broken band, a slain pack or a delivered load leaves no mark: prices, roads and herds are as before,
  and no one mentions it again.
- **Chains do not grow from jobs.** The one real chain (The Wounded Traveller, `story/wounded.js`) is good, but no job leads to
  another.

What the world already knows, and the quests do not use:

- `W.news` (`world/news.js`) records what really happened and where: caravans robbed, holdings raided, estates burnt, beasts seen,
  sieges, lords beaten.
- `LandDefence` (`world/defence.js`) knows, every check, which band or pack is in which holding's lands (`land:threat`).
- The bands and packs are real parties with homes: hideouts (`world/sites.js`), dens (`doc/CAMPS_DESIGN.md`), each pack's lair
  (`hx, hy`).
- The economy knows each holding's stock, need and price (`world/economy.js`). The herds know where game lives
  (`W.critters`, `data/critters.js`). The letters know what lords are planning (`world/letters.js`). Captivity knows who is held
  where (`world/captivity.js`).

## 2. The rule

**A quest is the world asking for help with something that is already true.**

1. **Nothing is made for a quest.** Its target exists before it is offered and goes on without you. If nothing is true, nothing is
   offered.
2. **Every quest has a cause you can check.** "The Ash Crows robbed the salt caravan on the Fen road, day 41." The same fact is in
   the news, the log and the tavern talk.
3. **Things are where they live.** Bandits work the roads and sleep in hideouts in the wilds; wolves den in frost woods. A quest
   points where its target really is.
4. **Someone asks.** A person with a trade and a stake (§4), who remembers how it went.
5. **You find things out.** A lead is a place and an age ("seen at the ford two days ago"), not a pin. Scouting, tracking and
   asking sharpen it (§6).
6. **The world moves on.** Someone else may solve it first, the band may move, the shortage may ease. The quest then ends fairly
   (the closed rule as today, `QUEST_CLOSED`).
7. **It leaves a mark.** The road is safer, the price falls, the herd comes back, the giver offers better work. Some results lead to
   the next quest (§8).
8. **Fewer, better.** A holding offers what troubles it, at most `JOB_OFFERS`. An empty board in a quiet village is fine; it says so
   ("Nothing troubles {town} these days").

## 3. A quest's parts

Every job and questbook entry is built from the same parts:

| Part | What it is | Where it comes from |
|---|---|---|
| **Cause** | The true thing: an event, a shortage, a threat | `W.news`, `LandDefence`, the economy, the war, letters |
| **Giver** | The person who asks, their trade, why they care | The holding's people (§4) |
| **Target** | The real band, pack, site, good, place or person | The cause's own object, by id |
| **Lead** | Where to start: an area and how old the word is | The cause's place and day (§6) |
| **Objective** | What counts as done | A bus event, as today (`band:beaten`, `monster:slain`, ...) |
| **Turns** | What may happen on the way, from the world, not dice | §7 |
| **Resolution** | How it ended: done, closed, failed, or a choice | As today, plus the choice taken |
| **Mark** | What changes in the world after | §9 |
| **Hook** | The next quest it may open | §8 |

## 4. Givers

Each holding has a few standing people who give work, drawn from what it has (its estates, walls, kind). Each is a plain record on
the holding (name, trade, face, regard for you), made once by the holding's seed. No random draw from the world's stream.

| Giver | At | Gives |
|---|---|---|
| The reeve or headman | every village | beasts at the folds, game, bandits on the village road |
| The captain of the watch | walled holdings | bounties, clearing lairs, the garrison |
| The steward | towns, castles, cities | supplies, letters, the garrison |
| A guild master or merchant | towns and cities with a market | escorts, robbed caravans, goods |
| The tanner, the brewer, the smith | a holding with that estate | hides, game, ore, timber |
| The priest | a holding with a shrine or temple | the missing, the sick, pilgrims |
| The lord | where he is | the war (as today), his letters |

The offer card shows the giver's face, name and trade, and one line of why they care ("my brother drives that caravan"). Their
regard rises with work done well and falls with work given up (`QuestShut` as today, now per giver).

## 5. The quest kinds, grounded

Each kind is offered only while its cause holds. Its target is the cause's own object.

### 5.1 Bounty (the captain of the watch, a merchant)
- **Cause:** a band (`bandits`, not one of yours) robbed a caravan, a traveller or an estate in this holding's lands in the last
  `BOUNTY.fresh` days (news `caravan`, `raid`), or has stood in its lands (`land:threat`) for `BOUNTY.lingers` checks.
- **Target:** that band, by id. If it shelters in a hideout (`Lair` `sheltering`), the hideout too.
- **Lead:** where it last struck, and the day.
- **Turns:** it moved on (the lead ages, §6); it went to ground in its hideout (the quest becomes "find their hideout");
  another band joined it (the cause names both).
- **Mark:** that road's robbery news stops; caravans on it are less wary (their fear, `caravanfear`); the captain's regard.
- **Hook:** the chief got away (he escapes if not taken), and his hideout is the next quest (§8 "The chief who ran").
- **None offered** when no band troubles the holding. The `n` and `ld` of the band are its own, not the job's.

### 5.2 Beasts at the folds (the reeve, a herder)
- **Cause:** a pack whose lair (`hx, hy`) or den lies within `FOLDS.near` tiles of the holding's pastures or fields, or a beast news
  item near it.
- **Target:** that pack, by id; or its den.
- **Lead:** the fields where it was seen, and the direction of its lair (tracks).
- **Turns:** a bigger beast in the den than the pack (a den with a mythic tenant, §8 "Something bigger").
- **Mark:** the pasture's herd is safe again (no pasture losses while the den is empty, `CAMPS_DESIGN` D11's quiet); the reeve.
- **None offered** in a land with no pack near its fields. Wolves in the desert never come up.

### 5.3 Game for the tanner or the table (the tanner, the innkeeper, the lord's steward)
- **Cause:** a tannery or workshop estate short of hides; or a feast that is really coming: a wedding, a lord's visit or a
  tournament at the holding (`gathering:announced`).
- **Target:** what the herds near the holding give: deer, boar, elk, reindeer, camel (`data/critters.js` `where`, `mat`). The
  quest names the game that lives there and roughly where (a herd within `GAME.near` tiles).
- **Turns:** a hard winter thins the herds (fewer, further).
- **Mark:** the tanner's stock, the feast held (its news line names you).
- **None offered** where no herd lives within reach.

### 5.4 Short of goods (the steward, a merchant)
- **Cause:** as today (`needOf`), now with its reason when the world has one: its caravan was robbed, the road is cut by a siege, its
  farm was burnt.
- **Days:** from how long its stock lasts at its use, not a flat 10.
- **Pays:** its price there, plus a share, so the job is worth it.
- **Mark:** its price eases (the stock is real, as today).

### 5.5 A letter (the steward, the lord, a merchant)
- **Cause:** a real letter the realm sends (`world/letters.js` `make`: an army's march, an attack, a deal, news), given to you to
  carry instead of a messenger.
- **Turns:** it is sealed. You may read it (its news), sell it to a rival, or carry it true. The same verbs as a robbed letter,
  each with its cost to your honour and the giver's regard.
- **Mark:** the deal or the march happens or is spoilt by what you did.

### 5.6 A caravan to see through (a merchant)
- **Cause:** a caravan leaving on a road with robbery news in the last `ESCORT.fresh` days.
- **Target:** that caravan (a real one, `world/caravans.js`), its road and its goal. An escort as `world/escort.js` does for a
  person.
- **Turns:** the band that worked that road is real and may come.
- **Mark:** the merchant's regard; the trade on that road.

### 5.7 The garrison (the captain of the watch)
- **Cause:** the garrison is below its holding's level after a siege or a raid (news `siege`, `raid`), or an enemy army is near.
- **Mark:** the garrison, as today.
- **None offered** when the garrison is full and nothing is near.

### 5.8 Clear a lair (the captain of the watch)
- **Cause:** a hideout or den whose band or pack has troubled this holding (§5.1 or §5.2's cause, traced home). Not merely the
  nearest site.
- **Mark:** its lands are quiet for a while (the den's quiet, a hideout's return time).

### 5.9 The missing (the priest, a family)
- **Cause:** someone really taken: a traveller or a caravan's people held at a hideout (captivity), a lord's man held in a prison.
- **Target:** the hideout or prison where they are held. The Wounded Traveller's rescue step (`story/wounded.js`) is the model.

### 5.10 The war (the lord)
- Lordkill and raid, as today, but with the reason from the war's state: the lord who burnt his village, the village that feeds the
  army besieging his castle. Plus two new ones from real armies: **scout an army** (a lord's army whose march a letter named:
  see it and report) and **relieve a siege** (a holding of his besieged: break it).

## 6. Leads and finding things out

A target is not shown as a pin until you have found it.

- **The lead:** an area round where the target was last known (`LEAD.r` tiles), and how old that word is. The map shows a dashed
  circle, not a mark. It grows as the word ages (`LEAD.grow` tiles a day, up to `LEAD.max`) because the band may have moved.
- **Sharpening it:** asking at a holding or a village near it (the news service, `rumourFrom`: a fresher sighting moves the circle),
  a tracking check on the spot (`QUEST_CHECKS.track`: the circle shrinks to its true place), your scouts' sight (seen: it is
  found).
- **Found:** once you have seen it, it is marked as today and followed as it moves (`seek`).
- **Fixed things** (a site, a holding, a caravan) are marked at once. Only moving targets have leads.

## 7. Turns on the way

Turns come from the world, not a dice roll on the quest. Each kind lists the world facts that change it (§5). The quest notices
on its daily check (`lapse`) and rewrites its objective with a line in the journal:

- the target moved: the lead ages;
- the target went to ground: find its hideout or den;
- someone else fought it: weaker, or gone (closed);
- the cause ended (the shortage eased, the siege broke): closed, a share paid;
- the giver's holding changed hands: the giver asks you to finish it anyway (the new lord pays) or lets you go without cost.

## 8. Chains

Chains are stories several quests long. They are **threads** (`story/thread.js`) whose steps are the quests above, so every step
is grounded too. A chain starts from how a quest ended, from a place you find, or from a person.

Rules:
- **Three acts at most** before a pause. Each act has its own reward, so stopping halfway is fine.
- **Every act reuses the world.** The chief who ran is the same leader record (`ld`); the den is the same site; the lord is the same
  lord.
- **Branches come from choices and from the world.** A choice changes who is your friend; the world changes what happens next.
- **Failing goes forward.** A lost fight or a missed deadline moves the story to a worse place, not to its end, unless it was the
  last act.
- **Each chain has a face.** A person who comes back: the reeve, the chief, the merchant's brother.

Four chains built on the jobs:

| Chain | Act 1 | Act 2 | Act 3 |
|---|---|---|---|
| **The chief who ran** | A bounty (§5.1). The band is broken, its chief escapes | His trail leads to his hideout (§5.8). Inside: what he took, and a letter with a lord's seal | Who paid him: give the letter to the lord's rival (gold, honour lost), to the lord (his regard), or to the victims' holding (its reputation) |
| **Something bigger** | Beasts at the folds (§5.2). The pack is slain, the killings go on | Tracks lead to a cave: a bigger beast (a mythic one where the land has one) | Kill it, or drive it off with a lore or a tracking check; the reeve's village names you |
| **The empty larder** | Short of goods (§5.4): the caravan with them was robbed | The robbed goods are at the band's hideout or for sale at the next market | Return them (reputation), sell them (gold), or find who tipped off the band (a merchant in the holding) |
| **A sealed hand** | A letter (§5.5) | Read it: an attack is coming on a holding | Warn its lord (his regard, your realm's honour if he is an enemy), sell the warning, or stay silent |

The questbook keeps its hand-written entries. Two changes:
- **Its goals find real targets.** `beat` with a band name picks the band in the giver's lands (the cause), naming it as the entry
  says only if none (a band of that name is made as a world band would be: at a hideout, never beside the holding). `hunt` picks
  the pack near the giver's fields. An entry whose target cannot be found is not offered.
- **Its conditions can name the world:** `when:{news:'caravan'}` (a news item of that kind near the giver), `when:{threat:'band'}`,
  `when:{short:'grain'}`.

## 9. The marks a quest leaves

| Quest ended | What changes |
|---|---|
| A band broken | Its road's caravans are less afraid for `MARK.road` days; the holding's news says so ("the road to {town} is safe again") |
| A pack slain, a den cleared | The den's quiet (`CAMPS_DESIGN` D11); the pasture's losses stop |
| Goods brought | The stock and price, as today |
| A letter carried true, read, or sold | The deal or the march goes ahead or is spoilt |
| A garrison filled | The garrison, as today |
| Any quest done | The giver's regard; their next offers are bigger (their tier: §10) |

## 10. Rewards

- **By the giver's purse.** A village reeve pays little gold and mostly goods (grain, cheese, a fur), regard and reputation; a city
  guild pays well. The pay comes from the holding's own wealth (`income`, prosperity).
- **By the work.** The band's real size and chief, the pack's real level, the distance, the risk.
- **By trust.** A giver with high regard offers harder and better-paid work, and tells you more (a tighter lead).
- **Shown before you take it,** as today, in the reward window after (`ui/questreward.js`).

## 11. Screens

- **The board** (a holding's work): the givers there, each with their face, name, trade and the one line of why; their offer under
  them. An empty board says why ("Nothing troubles {town} these days").
- **The offer card:** Cause (with its day), What, Where (lead or place), Reward, and what it asks of you, as today.
- **Your Quests (J):** each quest's lines grow as it does ("Day 43: the Ash Crows were seen at Elmford"). The lead's circle on the
  map, sharpened as you learn.
- Every window keeps the frame rule (a header, choices only, `nav()` at the bottom).

## 12. Decisions for the owner

| # | Question | Proposed |
|---|---|---|
| D1 | Should a quest ever make its own target? | **Never for a job.** A questbook entry may make a band only as a world band would be (at a hideout in the wilds) |
| D2 | Leads instead of pins for moving targets | **Yes**, with a circle that ages, and a tracking check to sharpen it |
| D3 | Named givers on each holding | **Yes**, 2–4 per holding by its estates and kind, each with regard |
| D4 | Empty boards when nothing is true | **Yes**, saying why |
| D5 | Rewards from the giver's purse (villages pay in goods) | **Yes** |
| D6 | Chains from jobs: the four in §8 | **Build all four**, one at a time |
| D7 | Old saves | No migration (the house rule): quests already taken keep their old target; new fields get defaults |
| D8 | The boards' offers stay seeded from the `quests` stream | **Yes**, so `worldprint` (W1–W8) holds; only quest content moves |

## 13. Build plan

Each step is its own patch, behaviour-preserving first where it refactors; tests in the existing style.

| Step | What | Files | Tests |
|---|---|---|---|
| Q1 | **Causes:** one service that answers, for a holding, what troubles it now: bands (news, `LandDefence`), packs near its fields, shortages, garrison, game near. Plain data, no random draw | `world/troubles.js` (new) | `tests/troubles.js` |
| Q2 | **Givers:** the holding's people, their regard, saved with the holding (defaults on load) | `world/givers.js` (new), `world/holding.js` | `tests/givers.js` |
| Q3 | **The job kinds rewritten on causes** (§5.1–5.4, 5.7, 5.8): no spawns; offered only while the cause holds; text names the cause; the board shows givers | `world/quests.js`, `ui/questwindow.js` | `tests/quests.js` updated, `tests/questcauses.js` |
| Q4 | **Leads:** the ageing circle, rumours and tracking sharpen it | `world/quests.js`, `ui/questmarks` in `quests.js` | `tests/questleads.js` |
| Q5 | **Turns and marks** (§7, §9) | `world/quests.js`, `world/caravans.js` (fear), `world/news.js` (the safe-road line) | `tests/questmarks.js` |
| Q6 | **New kinds:** the letter (real), the caravan escort, the missing, the war's two | `world/quests.js`, `world/letters.js`, `world/escort.js` | one suite each |
| Q7 | **Chains:** the four in §8, one at a time | `story/chains/*.js` (new, as `story/wounded.js`) | one suite each |
| Q8 | **The questbook's goals and conditions** find real targets (§8) | `story/questbook.js`, `data/questbook/samples.js` | `tests/questbook.js` updated |

Fingerprints: the quests draw from their own stream, so `worldprint` should hold. The battle suites are untouched. Any re-record
gets its reason written, as always.
