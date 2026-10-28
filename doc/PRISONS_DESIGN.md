# Prisons: where captives are held: design

Status: **phase 1 built** (2026-10-28): your own captivity. `data/prisons.js` `PRISONS` (§3: Lock-up, Jail, Prison, Dungeon, Cage, The pit: each its break-out odds, bribe price, the guards' first watch, a camp's harder beatings; a holding's walls (−2% a level) and garrison (−0.2% a man, at most −6%)); `world/captivity.js` `Captivity.prisonOf` (the cell's title, "In the Dungeon of Highmoor", and its numbers; a ransom broker keeps his own cage). The war rule (§4, `CAPTIVITY.war`; `Captivity.atWar`): taken by a lord or a realm's men at war with your realm, you go straight to the prison of the realm's nearest walled holding; the war price is 3 times the ransom and never comes down; no persuading, serving or release by time; your realm may pay it (8% a day while your honour with it is 20 or more, from its treasury: `payRealm`); a lord whose relation with you was 20 or more when he took you may let you go on your word (2% a day, +0.2% a point above 20 and +0.1% a point of your honour with his realm, at most 10%; you keep your bag); peace frees you (you keep your bag). Not at war: as before, but their cage is a prison of its place's kind. Tests: captivity. **Phases 2–4 built** (2026-10-28, `world/prisons.js` `Prisons`; its rules `PRISON` in `data/prisons.js`; tests: prisons, wounded):

- **Phase 2, the Prison place:** every holding's rail has a **Prison** (`ui/town.js` `definePlace('prison')`): its kind's name and keepers, its cells (`holds`), who is held there. For a lord held by a realm: **Visit** (relation +2, once a week), **Pay** his ransom (his relation +10, honour +3 with your realm if he is its own), **Bribe the gaoler** (half his ransom times the kind's bribe; 55% less 15% a step of its watch; found out: the watch's 60 gold fine), **Break out** (30% + Agility and Athletics + the prison's own odds and walls; won: his relation +12, the holding's realm hostile 20 days and honour −5; caught: a 120 gold fine and hurt). The same for your companions held there. A hostile holding's prison is reached from outside its walls (the siege window's **The prison**). The rescue quest (`HeldQuest`) is ransomed or broken out there; its page at the gates is gone. A camp's or hideout's page says which of your companions it holds; clearing it frees them.
- **Phase 3, realms keep prisoners:** a lord routed by a lord at war with his realm (a map fight, `fights.js routParty`), or taken inside the walls of a holding that falls (`realms.js resolveSiege`), is taken half the time (`PRISON.take`) to the victor's nearest walled holding with a free cell; else he gets away and rebuilds as before. His realm ransoms him in 14–28 days (`lordRansom`, from its treasury to his keeper's; short of gold, a week later); two realms at war trade a lord each (10% a day); peace between them frees theirs (`Realm#setRel`); a holding that changes hands, is sacked or is gone breaks its prison open. **Your companions:** taken with you (`Captivity.held.with`), freed with you any way but breaking out alone: then they stay in that prison (`Prisons.leave`), to be ransomed, bribed or broken out at its Prison, freed by clearing a camp or by peace, or to slip away themselves (3% a day). Your companions' rescue frees you all. At war, your realm may trade a lord of theirs it holds for you (10% a day).
- **Phase 4, your own prisons:** at a holding of yours or your realm's, **Lock up** the lords and chieftains you carry and your soldier prisoners (`men`); a lost battle frees them no more; **Take out** brings them back. A lord: his realm's offer comes 5–10 days later (**Ransom**, or **Ask for more**: 40% it rises by half, else withdrawn for a week), **Let go** (honour +8 with his realm, his relation), **Exchange** (for your companion, or a lord of your realm, that his realm holds), **Execute** (gone for good: honour −30 with his realm and −5 with every other, his realm's lords' relation −25, your companions' mood). A chieftain: **Hand over** for his bounty, or let go. Soldiers: **Recruit one** (as from your prisoners), take out, or let go. The holding no longer yours or your realm's (or sacked): they go free.
- **Straight to prison (2026-10-28, the owner's):** now and then a captor does not bargain at all (`CAPTIVITY.straight`: a band 35%, a lord 25% (less 0.5% a point of his relation with you), a realm's men 40%, a broker never): taken, you go straight into the prison of their place ("They do not bargain: straight into their Cage at the Bandit camp"), their ask on its page as ever (pay, break out, bribe, wait; no persuading, no serving). When they do bargain, Refuse names where it leads ("Refuse (to the cage)").
- **Fingerprints:** the world's change, by design: lords taken in the world's fights are out for weeks, not 4 days.

The owner's answers in §8; phases in §7.

## 1. Today

- **You, taken** (`world/captivity.js` `Captivity`): an abstract cage page, the same wherever you are held; any captor offers ransom, persuasion, service, or the cage. At war, a realm lets you go as easily as a band.
- **Lords and chieftains you take** (`world/captives.js` `P.captives`): ride with you; lose a battle and they slip away.
- **A rescue's "gaol of a holding"** (`story/steps.js` `HeldQuest`): its own one-off gaoler's page.

## 2. The idea (the owner's)

At war, getting out should be hard: you are an enemy's prize, so you are **held in prison**. Every holding and every bandit camp or hideout has **a prison of its own kind**, a place where captives are kept: you, your companions, enemy lords and chieftains.

## 3. Prisons by kind

The place is called **Prison** on a holding's rail; inside, its kind's own name. The numbers live in one table, `PRISONS` (`data/prisons.js`):

| Kind | Its name | Guards | Escape | Bribe | Holds |
|---|---|---|---|---|---|
| Village | **Lock-up** | a few men of the village | easy | cheap | few |
| Town | **Jail** | the watch | moderate | moderate | some |
| City | **Prison** | strong | hard | dear | many |
| Castle | **Dungeon** | the garrison | hardest | dearest | some |
| Bandit camp | **Cage** | rough, careless | moderate (beatings) | cheap | few |
| Hideout | **The pit** | hidden | moderate; a rescue must find it first | cheap | few |

A holding's walls and its garrison make it harder still. A sacked or raided holding's prison is broken open (its prisoners scatter or flee).

## 4. At war: held, not bargained with

Taken by a realm at war with yours (or by one of its lords):

- **No persuading, no serving.** You go to its prison: the nearest holding of the realm, or the lord's own.
- **The ransom**: your realm may pay it (by your honour with it, now and then, a dear sum), or you, at the war price (much higher than a band's).
- **Ways out:** break out (by the prison's kind), bribe a guard, your companions' rescue, your realm's ransom, **a prisoner exchange** (your realm trades a lord it holds for you), or **peace** (a peace between the realms frees their prisoners).
- **No release by time** while the war lasts.
- **A gentleman's parole** (the owner's): a lord who thought well of you before the war (a good relation) may, now and then, let you go on your word: a rare chance each day, by his relation with you and your honour.

Not at war (a band, a lord of a realm only hostile to you): as today: ransom, persuade, serve, or their cage.

## 5. The Prison place (holdings and camps)

A rail entry, like the Tavern or the Barracks, in every holding (and a page in a camp or hideout once found):

- **Who is held:** captured lords of other realms, chieftains, your companions if taken, and (later) you.
- **What you can do:** pay a prisoner's ransom; bribe the gaoler to free one; visit a lord held (relation, news); break one out (a crime: hostility, honour, the watch). Not at your own holdings' prisons: those are yours (§6).
- **The rescue quest** (`HeldQuest`) uses it in place of its own gaoler's page.

## 6. Your own prisons (later)

Lords and chieftains you take ride with you first (as today, `P.captives`): taken in a battle or anywhere else, they travel with your band, and a lost battle may free them. Once you bring them to a holding of yours, or of the realm you serve (handed to your liege's keeping), you can lock them in its prison: there they wait for their ransom or your mercy, and a lost battle no longer frees them; you can take them out again to ride with you. Captured soldiers can be recruited from it.

## 7. Phases

| Phase | What | Effort |
|---|---|---|
| 1 | The war rule (§4: held, no persuading or serving, the war ransom, no release by time, parole, peace frees you) and prisons by kind (§3) for your own captivity: its name, its escape and bribe numbers | M |
| 2 | The Prison place in holdings and camps (§5): who is held, ransom, bribe, visit; the rescue quest moved into it | M |
| 3 | Realms keep captured lords and your companions there; prisoner exchange; peace frees prisoners on both sides | M |
| 4 | Your own prisons (§6) | M |

## 8. The owner's answers (2026-10-28)

1. **Parole:** yes, a lord who had a good relation with you before may let you go now and then.
2. **Names:** the place is **Prison**; inside, by kind: **Lock-up**, **Jail**, **Prison**, **Dungeon**, **Cage**, **The pit**.
3. **Your captives (§6):** taken, a captive travels with you; only once you bring him to a holding of yours or of the realm you serve can you lock him in its prison.
4. **More (2026-10-28):** lords beaten by other realms are taken half the time; companions held apart when you break out alone; your own prisoners: ransom, mercy, exchange, execution; soldier prisoners locked up too.
