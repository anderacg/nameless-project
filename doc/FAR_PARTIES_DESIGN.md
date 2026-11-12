# Far parties: a cheaper moment for what you cannot see

Status: **design, not built** (2026-11-11; rechecked the same day against the code and a profile: §10). The recheck changed the order: two exact savings first (§6 X1, X2), the far step only if they are not enough. It carries on from `WORLD_DESIGN.md` §3.5, whose far tier was left unfinished for parties.

## 1. The problem

Every mover on the map is sorted into a tier by how far it is from you (`world/worldobject.js` `WORLD_LOD`): near (1 ring of 512 px chunks), mid (to 4 rings, about 2,048 px), far (beyond). Beasts and herds have a far step: they hold by their lair. Bands, patrols, lords and caravans have none, so far from you they run their whole brain every fourth frame.

Measured on a Huge world (seed `s1`, a new game, this server, after the `WORLD_FAST` speedups), ms a frame spent thinking, by kind and tier:

| Kind and tier | How many | 1× | 8× |
|---|---|---|---|
| Bands, far | 478 | 2.94 | 2.76 |
| Patrols, far | 60 | 1.16 | 1.02 |
| Herds, far | 1,630 | (0.47) | (0.46) |
| Beasts, far | 749 | (0.27) | (0.25) |
| Lords, far | 31 | 0.03 | 0.33 |
| Caravans, far | 8 | – | 0.24 |
| Everything near and mid | about 300 | 0.83 | 0.87 |

The far tier is about 4.9 of the 5.7 ms. The whole update is 9.3 ms a frame at 1× and 12.4 at 8×.

The herds' and beasts' rows are wrong (§10): they are the measuring clock's own cost, two readings round each of 2,379 visits. Timed with no clock inside the loop, visiting them all costs 0.06 ms a frame.

### 1.1 Where a party's moment goes

A profile of the same world (1,200 frames at 1×, every tier; the far ones are nine in ten of them), ms a frame:

| Bands' moment, 2.32 | | Patrols' moment, 1.06 | |
|---|---|---|---|
| Whether it may meet you (`canMeet`, `worldBattleReach`) | 0.76 | Its pace (`partySpeed`) | 0.77 |
| A rival (`feud`) | 0.37 | Its way (`Router.travel`) | 0.06 |
| Its pace (`partySpeed`) | 0.32 | Where you are, whether it sees you | 0.07 |
| Its own lines (stance, fear, the wander) | 0.28 | Its prey (`LandDefence.prey`) | 0.04 |
| Where you are (`look`) | 0.22 | The rest | 0.12 |
| Whether it sees you (`sees`) | 0.14 | | |
| Lying in wait for you (`Waylay`) | 0.09 | | |
| Its step (`walk`), a caravan (`hunt`) | 0.08 | | |

So of 3.4 ms, about 1.3 is spent asking about you from 2,000 px away, where every answer is no, and about 1.1 reckoning a pace from the men's list afresh each moment (`listSpeeds` builds a table each time; a patrol's pace is three quarters of its moment). What is left, the thinking itself, is about 1.0 ms.

## 2. What far parties do today that matters

Three days of the same world, fights begun by a far party:

| Fight | A day |
|---|---|
| Band on band (goblins against the rest: `BAND_FEUD`) | 15.3 |
| Patrol on band (its holding's land: `LandDefence`) | 6.7 |
| Lord on beast | 3.7 |
| Lord on band | 1.0 |
| Caravan and band (`BAND_HUNT`) | 0.7 |

Bands went from 510 to 459 in those days. These rates are what the far step must keep: they decide how many bands roam, how safe the roads are and what the news tells.

What a far party does that matters to no one: looking for you, fearing you, lying in wait for you, arresting you, walking tile by tile round every rock.

## 3. The rule

A far party takes a **far step** once a game hour, not a full think every fourth frame.

- **Kept:** where it is going, when it gets there, whom it fights, where it sleeps.
- **Dropped:** everything about you (sight, fear, ambush, arrest, meeting), and walking by the router.
- **Back to full thinking** the moment it is mid or near. The far tier starts at least 2,048 px from you. The view at its widest (`MAPZOOM.OUT`) is about 1,740 px across on a desktop and 1,920 on a phone, so the far tier starts over 1,000 px beyond its edge, and a far step moves a party 150 px at most: a jump is never seen.
- **You moved in one go** (a voyage, carried off, a load): the tiers are sorted at once, not at the next half second, so no party in the new view is still far.
- **Never far:** a party a quest points at or moves (a hold quest's wave `wave`, a bounty's band on its haunt `haunt`, a quest's quarry `qid`, a lead's band, an escort's, one seeking field loot `lootGo`), a party in a fight, your companions' parties, anything in your host. These think as mid, as today.
- **Towards, not only onto:** a far party goes an hour's ride towards what it is after, and is there if that is enough. (The first draft acted only on what lay within an hour's ride: a camp may be 220 px off, `bandCamp`, an hour at a band's camp pace about 130; a patrol's prey may be anywhere on its holding's land, an hour of its ride about 150.)
- **Only where it could walk:** it is set down on a rival, a camp or its prey only if `Router.reach` says the two stand on one piece of land.
- **By the frames' time, not the clock's hours:** waiting on the road (`Clock.passHours`) passes hours with no frame, and no party moves then today.

The steps are spread over the hour by each party's place in its list, so no frame takes them all.

## 4. Each kind's far step

### Bands
In the order of `BandBrain#think` (a fight before a camp, by night too):
1. **In a fight:** nothing. Its cool-down runs down by the hour; while it lasts, no caravan and no rival, as today. A band lying in wait for you (`waylay`) gives it up as it turns far.
2. **A caravan it dares, in its sight** (the test of `hunt`): an hour's ride towards it; the caravan's own brain begins the fight when the band is on it, as today.
3. **A rival band it dares, in its sight** (`BAND_FEUD.see`, 100 px, which an hour's ride of about 110 covers; the cells of `BandBrain#near`): it is on it, and the fight on the map begins there (`startFight`), by a chance (`far.feud`) set so the rates of §2 hold.
4. **Night, a camp that shelters it within `bandCamp`:** an hour's camp pace towards it; in, if that reaches it.
5. **Else it wanders:** one straight step in a heading drawn as today, three in ten of them no step at all. Its length is a number (`far.roam`), not an hour's roaming: today a band draws a new heading every 2 to 5 s, about twice an hour, so it ends an hour about half as far off as it walked. A step onto water, a peak or a holding's walls is not taken.

### Patrols
1. **Its watch over, too few men, its holding besieged or lost:** an hour's ride towards its gate; inside (`watch.back`), if that reaches it.
2. **A threat its holding set it on (`LandDefence.prey`):** an hour's ride towards it; on it, and the fight begins, if that reaches it.
3. **Else:** an hour's ride along its beat (`watch.beat`), stop to stop.

No chance is set for a patrol: it catches what an hour's ride catches. If the measure of §7 shows it catching more than today (a band that today would wander off the land in that hour), a chance is added then.

### Lords and caravans
Left as they are in the first build: together 0.03 to 0.6 ms. Their far step (along the route by time) needs a `Router.travel` that spends a whole hour's step in one call (today it stops at each waypoint): phase 4.

### Beasts and herds
Their far step already does nothing. Each is still visited every frame, which costs 0.06 ms for 2,379 of them: nothing to win, left as it is (§10).

## 5. Numbers

One table, `WORLD_FAR` (`world/worldobject.js`):

| Key | Meaning | First value |
|---|---|---|
| `on` | The switch. Off: every far party thinks as mid, as today | true |
| `band`, `patrol` | Each kind's switch | true |
| `every` | Game hours between far steps | 1 |
| `feud` | A far band's chance to fall on a rival in its sight this hour | found by the measure of §7 |
| `roam` | A far band's wandering step, px | found by the measure of §7 (about 50) |
| `ride` | The share of an hour's ride a far party covers towards a fight, a camp or its gate | 1 |

## 6. Build order

| Phase | What | Changes the world? | Saves (Huge, 1×) |
|---|---|---|---|
| X1 | A party's pace: the men's part kept while its men are the same, and not reckoned in a moment that does not move it | No (proved as `tests/worldfast.js` does: the old pace asked beside the new) | about 1.1 ms |
| X2 | A party further from you than any reach of yours or sight of its own skips what is about you (`look`, `sees`, `canMeet`, `Waylay`) | No rule changes; a skipped check that drew from the dice would move W7 and W8 | about 1.3 ms |
| F1 | Bands' far step | Yes | about 0.7 ms after X1 and X2 |
| F2 | Patrols' far step | Yes | about 0.2 ms after X1 and X2 |
| F3 | A far fight decided at once by strength (`fights.js` auto-resolve), not fought out over the hours | Yes | not measured: only the far fights' share of the `fights` system (0.4 to 1.1 ms in all) |
| F4 | Lords and caravans along their routes by time | Yes | about 0.5 ms at 8× |

After X1 and X2 the update should be about 7 ms a frame at 1× on Huge, from 9.3, with the world as it is. F1 and F2 then buy about 1 ms more for a changed far world: build them only if a measure on the phone asks for it.

- **F0 is dropped** (far beasts and herds not visited): it saves 0.06 ms, not 0.7 (§10).
- **F3 leaves these fights on the map:** one with anything of yours in it (your caravan, your holding's patrol, your companion's party), and one the news or a lead has told of. And it ends what a fight of hours allows today: a third party falling on it, you riding to it.

## 7. How it is checked

- **Speed:** the profile of §1.1 taken again, and the whole update timed with no clock inside the loops (§10).
- **The world's health (F1 on):** the same seeded world run 30 days with `WORLD_FAR.on` off and on, three seeds, at Normal and Huge, at 8× (a 30-day Huge run at 1× is about an hour of this server). The map's dice are not seeded, so two runs with it off differ too: first several runs with it off, to learn how far they lie apart; then on must lie within that spread for fights a day of each kind (§2), bands alive, caravans arrived, each realm's holdings. The rare kinds (a lord on a band, a caravan and a band: two or three in the three days of §2) are counted together. `far.feud` and `far.roam` are set from this.
- **Nothing seen changes:** no party within the mid tier ever takes a far step (a test counts them); a party that turns from far to mid stands on ground it may stand on.
- **Fingerprints:** W7 and W8 of `tests/worldprint.js` run the world and will move for F1 and F2 (the far tier reaches a Normal world too); re-recorded with their reason. With `WORLD_FAR.on` off they hold. The battle fingerprints are not touched.
- **Saves:** no new saved field (a party's wait for its next far step starts afresh on load).

## 8. Risks

- **The world drifts:** far bands may fight more or less than today. The 30-day measure and the two chances are the guard; the switch is the way back.
- **A quest's party taken for a common one:** the "never far" list of §3 must name every kind (the first draft missed `qid` and a lead's band); a test walks the quest kinds that make or move a party.
- **A band at the tiers' edge:** it could turn far and mid in turn as you move. The tiers are sorted every half second from your chunk, so it changes at most twice a second; a far step is taken only once an hour either way.
- **The spikes are another matter:** the worst frames (47 ms at 1×, 273 at 8×) come from single long calls in the parties' and the land defence's systems, not from the far tier. They need their own look.

## 9. Not in this design

- The economy's day, the realms' wars and the sieges: they are daily or hourly already.
- Drawing: a party out of sight is not drawn today.
- Generation.

## 10. Rechecked (2026-11-11)

The design was read again beside the code and a profile. What was wrong, and what it became:

| Flaw | Found by | Now |
|---|---|---|
| F0's saving was 0.7 ms | Timing the visits with no clock inside the loop: 0.06 ms. The 0.7 was two clock readings round each visit | F0 dropped; §1 marked |
| The cost was taken to be the thinking | The profile of §1.1: about 1.3 ms asks about you, 1.1 reckons a pace, 1.0 is thinking | X1 and X2 first, exact; F1 and F2 worth about 1 ms, not 3.9 |
| A camp before a fight | `BandBrain#think`: a caravan, a rival, then the camp | §4 in the code's order |
| Only what lay within an hour's ride was acted on | `bandCamp` 220 px against about 130 an hour; a patrol's prey anywhere on its land | A step towards, each hour |
| A rival within sight plus an hour's ride | Today a band never knows of a rival beyond its sight (100 px) | In its sight |
| Set down across water or peaks | No test of the land between | `Router.reach` |
| A wander of an hour's roaming | Headings drawn about twice an hour: half the way | `far.roam`, measured |
| The never-far list | `qid` (a quest's quarry) and a lead's band were not in it | Named |
| Far steps on the clock's hours | `Clock.passHours` passes hours with no frame | By the frames' time |
| A far party in view after you are moved in one go | The tiers are sorted every half second | Sorted at once then |
| "A screen and a half beyond the view" | True at the usual zoom only | Over 1,000 px at the widest; §3 |
| "Within a fifth" | Unseeded dice; two or three of the rare fights in the baseline | The spread of runs with it off; rare kinds together |
| No number for the patrols' catch | The second most fights (6.7 a day) | Said in §4; a chance only if the measure asks |
| F3's exceptions | Fights with yours in them, fights told of | Listed in §6 |

Also read again, with no flaw found: the two speedups already in (`WORLD_FAST`). The sites' list only grows or is made anew, so the outposts' list cannot go stale; no beast's moment changes an owner or an outpost; no fight ends inside the bands' pass, so the sweep of stale fight marks at the pass's first look does what every look did.
