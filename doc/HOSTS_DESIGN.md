# Hosts: armies that march together: design

Status: **phase 1 built** (2026-10-29): `world/hosts.js` `Host` (`HOSTS`: crumb 6, gap 22, catch 1.3, far 160, join 220 px). Your companions' parties with the order **Follow** (the order's button renamed from Ride with me; its party's line "following you") are your host: each walks to its place back along your trail (`Host.keep`, from `CompanionBrain`), in the order they were told to follow (`fseq`); you go at the slowest's pace, their own paces before the ground (`Host.base`, `paceOf`: world.js your step); following, they hunt no prey; one farther than `far` makes for you; each within `join` of a battle of yours joins it (battle/engage.js, past `REINF.r`). Tests: hosts.

**Phase 2 built** (2026-10-29; the owner's: ask or be asked, battles decided by conditions, marching together among friends): `HOSTS.lord`. Who may march with you: a lord of your realm or its ally, or one whose relation with you is 20 or more, never one hostile to you (`Host.friend`).

- **A lord follows you** (`l.follow`, saved with him): asked in his talk, **Ask him to follow you** (the check `follow` of `DIALOGUE.checks`: his relation (+0.6% a point), your honour with his realm, renown, Charisma, Persuasion, his temper; once a day; a refusal is no slight), refused while he has under 6 men or a siege to see to, or your host has 3 lords; or **he asks you** (a friend within 150 px, a 3% chance a day: his page, Accept or Decline; never while the tests' `G.quietEvents`). He keeps his place in your column (`LordBrain`, `Host.lordStep`) for 5–10 days, then takes his leave; no longer a friend, or his men under 3, he goes.
- **Battles of yours** (`Host.decide`, battle/engage.js): each lord of your host within 220 px decides as any lord near would (`lordWhy`: his realm at war with your foe's, a friend); he stands aside when the odds are hopeless (the foe 2.5 times you and your allies) and his temper cautious (greedy, cunning), and when you fight those his realm is at peace with (and, if your realm is not at war with them either, he leaves your host, relation −6). The battle's page names who stands aside and why.
- **You follow a lord** (`Host.under`, the save piece `hosts`): **Follow** on a friend's ring makes you a member of his host for 5–10 days; your band keeps its place in his column (world.js `followStep`), waits at his gate while he is inside, and takes it up again after a battle, a talk or a window (`Host.watch`). His battle within 220 px: its page, Join a side or **Stand aside** (relation −3). Stop following before his days are up, or going three times `far` from him: relation −6, honour −2 with his realm; his days up: relation +5, renown +3, honour +2.

**Phase 3 built** (2026-10-29): realm campaigns (`HOSTS.camp`). Each day a realm at war with no campaign under way begins one with a 12% chance: its strongest free lord its **marshal** (`l.campaign`: target, days), 2–4 of its free lords nearest him (within 700 px, 9 men or more) his host (`l.with`, `wseq`). They march in his column on its enemy holding nearest him, at the host's pace (`Host.paceFor`, LordBrain), and lay siege together: the marshal resolves the siege with all his host's strength there (`Host.besiegers`, realms.js `resolveSiege`: their troops, the best Tactics, each taking his share of the losses), the members never alone (realms.js `worldDay` leaves them to him). It ends when the holding is taken (or no longer an enemy's), the marshal is beaten, or its 20 days are up; its members go their own way. Serving the realm, you are summoned: **Ride with his host** (you follow him for its days, last in his column) or Decline (honour −3). Its start and end are news. Fingerprints: the world's move, by design (lords march and besiege together).

Tests: hosts. The owner's answers in §8; phases in §7.

## 1. Today

- **Follow** (`world/world.js` `followStart`): you trail a lord at a distance; it ends when he is out of sight or goes into a holding, and it is not saved. You fight beside him only if you happen to be near.
- **Your companions' parties** (`world/brains.js` `CompanionBrain`): with the order `follow` they head for a spot beside you, each on its own, and bunch up; they hunt any weaker foe they see.
- **Battles**: armies near enough join a fight (`battle/engage.js` `nearAllies`, your companions' parties within `REINF.r`; on the map `world/fights.js`), up to `BATTLE_JOIN`.
- **Lords** march alone; two besieging one holding just stand side by side.

## 2. The idea

A **host**: several armies moving as one behind a leader. Each army is still drawn and fights as itself (never merged); on the march they walk **in a column** along the leader's own path, so on a long road they string out along it.

## 3. The host

| Part | What |
|---|---|
| Leader and members | a host has one leader (you, or a lord) and its members (your companions' parties, lords) |
| The column | the leader's path kept as a trail (a point every `HOSTS.crumb` px); member *i* makes for the point `(i + 1) × HOSTS.gap` px back along it, so the column follows the very way the leader went: a road, a ford, round a wood. Standing still, they stand in that column behind him |
| Pace | the host goes at its slowest member's pace (the leader slowed to it); a member behind its place hurries (`HOSTS.catch`) |
| Far off | a member farther than `HOSTS.far` (back from a patrol, a stay) makes straight for the leader, then takes its place |
| Fighting | a member keeps its place: it never runs off after prey; the host fights together, every member within `HOSTS.join` of the battle joining it (as allies: AI, the owner's) |
| Ending | the leader routed, dead or gone: the host breaks up; a member's order changed, or its days up: it leaves |

## 4. Your host (phase 1)

- Your companions' parties with the order **Follow** are its members (the word the owner chose).
- Their place in the column by the order they were given Follow.
- The host's pace: yours, slowed to the slowest of them.
- They join every battle of yours while within `HOSTS.join`, wherever they are in the column.

## 5. You and lords (phase 2)

- **A lord follows you**: ask a lord of your realm, or one whose relation with you is high enough, in his talk; he joins your host for some days, fights in your battles as an AI ally, and takes a share of the spoils. His men lost carelessly or him left behind: his relation falls.
- **You follow a lord**: **Follow** on a friendly lord now makes you a member of his host (saved; today's trailing Follow is kept for any other party). You keep your place in his column on your own (your band walks to it: no clicking), and fight in all his battles. Leaving before he lets you go costs relation and honour; staying to the end: relation, renown, a share of the spoils.

## 6. Realm campaigns (phase 3)

- At war, a realm's strongest lord becomes its **marshal**: he gathers two to four of its lords into his host and leads them to one target; they siege and fight together; the host breaks up after the siege, a defeat, or `HOSTS.campaign` days.
- Serving the realm, you may be summoned to follow him.
- The world's fingerprints move (accepted: the owner).

## 7. Phases

| Phase | What | Effort |
|---|---|---|
| 1 | `world/hosts.js` `Host`: the column on the leader's trail, the pace, keeping place (no hunting), joining battles; your companions' parties with Follow as your host's members | M |
| 2 | A lord follows you; you follow a lord (saved hosts) | M |
| 3 | Realm campaigns under a marshal | M |

## 8. The owner's answers (2026-10-29)

1. **On the map**: never merged; in a column when travelling, as on a long road.
2. **Lords in your host**: AI allies in battle.
3. **Realm campaigns**: yes (fingerprints move).
4. **The word**: Follow.
