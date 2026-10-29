# Hosts: armies that march together: design

Status: **designed** (2026-10-29). The owner's answers in §8; phases in §7.

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
