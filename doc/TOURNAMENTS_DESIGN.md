# Tournaments: design

Status: **draft for the owner's review** (2026-10-19). Nothing here is built yet. The numbers live in one tunables table (`TOURNEY`), so they are easy to change.

## 1. The idea

Today every holding with lists offers "a tournament today" at any time: pay 10 gold, fight the town champion one-on-one, win 45 gold and renown (`ui/townui.js` `tourneyBody`, `ui/town.js` `tourney`, `battle/resolution.js` with `tournament:true`).

Tournaments become **events**:
- they are **announced ahead**, held on certain days in certain places, and then over;
- they come in four sizes, from the yearly **Grand Tournament** to a brawl at a roadside camp;
- **lords and champions attend**, people talk about them (rumours, notices), and winning one means something.

## 2. The four kinds

| Kind | Where | How often | Entrants | Announced | Prizes |
|---|---|---|---|---|---|
| **Grand Tournament** | the **Grand Stadium**, a new site (§5) | **once a year** (§6) | 16; the realms' best: lords, champions, famous outlaws who come under truce | **20 days ahead, everywhere** (heralds, every tavern) | the biggest purse, a **unique item**, a title (**Champion of the Realm**) for the year, much renown, the attending lords' respect |
| **Regional tournament** | each **big holding** (towns, cities, castles) | about every **25–35 days** per holding, staggered so nearby ones don't clash | 8; local lords, the holding's champion, wandering knights | **7 days ahead**, in that holding and its neighbours | a good purse, a good item at times, renown, reputation with the host |
| **Small tournament** (a fair) | **small holdings** (villages, hamlets) | about every **12–20 days** | 4; the village champion, locals, travellers | **3 days ahead**, in that holding | a small purse, food or goods, local reputation |
| **Small fighting events** | **road encounters near holdings** (§7) | random, as the other encounters | 1–2 bouts | none: you come upon them | a little gold, a wager, a story |

**No overlap (owner):** a small fighting event never comes near a holding whose own tournament is announced or running.

## 3. How a tournament plays

- **Before it:**
  - The **notice** goes up on the holding's notice board and in taverns, through the new rumour system, so you hear it on the road.
  - It shows on the map: banners and pavilions round the holding while it runs, and a mark on the map once you know of it.
  - **Entering:** a fee scaled to the kind (small 10, regional 40, grand 150), paid at the lists. You must be there on the day it opens; it runs for a day or two.
- **The bouts** (owner to choose, §9):
  - **Melee duel:** your hero against one opponent, as today's champion fight (the battle with `tournament:true`): blunted weapons, nobody dies, the loser **yields** at low health and becomes **wounded**.
  - **Team melee** (regional and grand): your hero and up to 4 of your band against a team of the same size.
  - **Archery** and **joust:** stat contests, resolved in rounds with your skills (Archery; Riding and Lance) and the shared stat-odds helper, shown through Insight. Quick to play, and a picture of each round.
- **The bracket:** a knock-out over rounds (2 rounds in a small, 3 in a regional, 4 in the grand). Between rounds you rest; your hero's health partly returns. Leaving forfeits.
- **Betting** (optional): a bookmaker at the lists takes wagers on any bout, yours included, at odds read from both sides' power. Insight by Scouting shows how good the odds really are.
- **Afterwards:** the winner's name goes into the news (rumours: "The Red Knight took the lists at Ashford"), lords who attended remember you (relations), and the holding's prosperity rises a little for hosting.

## 4. Lords and champions attend

- Lords who are **at peace and nearby** (or, for the grand, from every realm under a truce) travel to the tournament and enter. Their brains get a light "attend" state, like defending their land: never from a war march or a siege.
- **Champions:** each big holding has a named champion (a character who grows), and famous outlaws may enter the grand under truce.
- Beating a lord in the lists is a safe way to win his respect (relation +), not his enmity.

## 5. The Grand Stadium (a new site)

- One per world, placed by the generator: a large **stone stadium** on neutral or central land, near a main road, away from borders. On the classic map, a fixed spot.
- **Most of the year it is quiet:** a caretaker, a practice yard (training bouts for a fee; no prize), the hall of past champions (names and years).
- **During the Grand Tournament:** crowds, pavilions, every realm's banner, merchants (a temporary market), and the bracket.
- **Art:** a new engine structure in the house style (an oval of stone stands, gates, banners); a site page like the others (the single-page style).

## 6. The calendar

- A **year** is `TOURNEY.year` days, proposed **120**. World Design D17 plans a minimal season calendar; if it lands first, the year is that calendar's.
- The Grand Tournament has its day in the year (e.g. day 90). The regional and small ones are scheduled per holding with a seeded offset, so the map always has something coming somewhere.
- **The schedule is saved** with the holdings (next date, kind, state).

## 7. Small fighting events on the road

New encounter kinds on the encounter system (`ROAD_ENC`), near holdings, never near one with its own tournament (§2):
- **A brawl at a camp:** soldiers or drovers settle a dispute with fists; a purse for the winner. A duel, nonlethal.
- **A knight's challenge:** a knight holds a bridge or a crossroads and challenges all comers ("pass of arms"); beat him for his purse and renown; refuse and go round.
- **A wrestling ring at a fair:** near a village on a market day; Strength and Athletics; a wager.
- **An archery wager:** hunters bet on a mark; Archery; a wager.

They reuse the duel (battle with `tournament:true`) or the stat contests.

## 8. How it is built

- **Files:**
  - `world/tourneys.js` (new): `TOURNEY` (kinds, fees, purses, cadence, sizes, the year), `Tourney` (an event: place, kind, dates, entrants, bracket, state), scheduling per holding, announcing (notices, rumours via the news service), lords attending (a light state in `brains.js`), results to the news.
  - `ui/townui.js` and `ui/town.js`: **the lists** place shows the schedule ("Regional tournament in 6 days"), the entry, the bracket, the bookmaker, and practice bouts.
  - `battle/resolution.js`: the tournament result by kind and round, the yield-and-wounded rule, prizes.
  - The Grand Stadium: a site in `world/sites.js`, its structure in the engine, its page; generator placement.
  - `world/encounters.js`: the small fighting events.
- **Reuses:** the duel battle (`tournament:true`), the stat-odds helper, the news and rumours, notices, Insight, sites and pages, the lords' brains.
- **Tests:** the schedule (cadence, no clashes, the year), announcements reaching taverns, entering and the fee, the bracket advancing and forfeits, nonlethal (yield and wounded), prizes per kind, lords attending and not from wars, no small event near an announced tournament, save and load mid-tournament, fingerprints guarded.
- **Phases:**
  1. Scheduled regional and small tournaments with the **melee duel**, announcements, the lists page, prizes (replacing today's always-on fight). **M**
  2. The **bracket** over rounds, **team melee**, **betting**. **M**
  3. **Lords and champions attend**; results in the news; relations. **M**
  4. The **Grand Stadium** and the **Grand Tournament** (the site, its art, the yearly event, unique prizes, the title). **M–L**
  5. **Archery and joust** contests. **M**
  6. The **small fighting events** on the road. **S–M**

## 9. Questions for the owner

1. **Bouts:** melee duel and team melee for sure? Archery and joust as stat contests (fast, with pictures), or as real battles later?
2. **Nonlethal:** the loser yields and is wounded, never killed. Right?
3. **Betting:** yes or no?
4. **The year:** 120 days (the Grand Tournament once in that), or a different length?
5. **The Grand Stadium:** a neutral spot near the middle of the world, or beside the largest city?
6. **Your own tournaments:** once you hold a holding (founding, World Phase 4b), can you host one (cost, prestige)? For later.
