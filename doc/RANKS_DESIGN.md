# Unit ranks: design

Status: **design only, revision 1** (2026-10-30, written against `codex` at c06c6b3). Nothing here is built. The owner's answers are in **Decisions**; §9 lists what is still open.

**Readers:** the owner, and whoever builds the phases of §8.

**Words used here:**
- A **group** is one of an army's troop groups (`ArmyRoster` groups, `core/army.js`): one kind of soldier, its own id, name, slot and formation. Every army has them: yours, a lord's, a band's, a patrol's.
- A **kind** is a troop type (`ST`, `data/units.js`); its **tier** is `ST[k].tier` (0 peasants, 1 to 3 soldiers).
- A **role** is what a kind does in a fight: spear, shield, sword, bow, crossbow (and sling), caster, cavalry, horse archer, scout (`unitClass`, `isScout`).

## Decisions (owner, 2026-10-30)

- **Experience and rank belong to the group,** not to the kind. A group earns experience and climbs **ranks 1 to 5**, each rank shown by a small badge.
- **The badge's metal is the tier:** bronze for tier 1, silver for tier 2, gold for tier 3. Its rank is shown on it.
- **Each rank unlocks skills** (passive or active), limited to the group's role, like a hero's but narrower.
- **Upgrading needs rank 5.** A rank-5 group upgrades as a whole to the next tier of its path and starts again at rank 1; the loop goes on to the end of the path.
- **Rank stays fixed:** recruits joining a group take its rank. Nothing lowers a rank.
- **Training is now two things:**
  - **Train** gives a group experience. It is limited in how often it can be done (per day and per week), the limits the owner's to set (tunables).
  - **Upgrade** moves a rank-5 group to the next tier. The "free in the field" rule of 2026-10-30 now applies to Upgrade: an upgrade below tier 3 that is not into a caster is free and done anywhere; tier 3 and casters only at a holding that trains, for gold (`TRAIN_PLACE`, `trainPrice`).
- **Training single soldiers goes:** Train 1 / Train all and the barracks' count stepper are removed; only whole groups upgrade.
- **The five group abilities move into the ladder:** Brace, Fire arrows, Spur, Rally and Scout ahead are no longer there from the start; each is unlocked at a rank.
- **AI armies have ranks too,** and they grow realistically (§6).

## 1. Experience and rank

- Each group keeps `xp` (its experience) and `rank` (1 to 5). A new group starts at rank 1, `xp` 0.
- **Earned in battle:** as today each soldier earns `u.xp` (damage done, kills, `TROOP_XP`); a group gains the **average its men earned** (the sum over its men who fought, divided by how many fought), plus `TROOP_XP.fight` for fighting and `TROOP_XP.win` for a win. The average keeps a big group from ranking up faster than a small one.
- **Earned by Train** (§3).
- **The ladder** (tunables, per tier: a tier-3 group needs more):

  | | to rank 2 | to rank 3 | to rank 4 | to rank 5 |
  |---|---|---|---|---|
  | tier 1 | 40 | 100 | 180 | 280 |
  | tier 2 | 60 | 150 | 270 | 420 |
  | tier 3 | 90 | 220 | 400 | 620 |

  (A first proposal, about 2 to 3 even fights a rank at tier 1. `RANKS.xp` in `data/`.)
- **Rank stays fixed:** recruits join at the group's rank; merging two groups keeps the higher rank; a split keeps the rank in both; the wounded keep their group's rank (a group all wounded keeps its slot already: `ArmyRoster#held`). A group wiped out is gone, its rank with it.
- At rank 5 experience stops; the group waits to upgrade.
- **The old pool goes:** `P.txp` (experience by kind) and `txpReady` are removed. The Army window's "Training" meter becomes the group's rank meter.

## 2. The badge

- A small pixel shield, its metal the tier: **iron** (tier 0, peasants), **bronze** (1), **silver** (2), **gold** (3). On it, **1 to 5 chevrons** for the rank. Drawn once per metal and rank and cached (17 pictures).
- Shown on: the Army window's group list and unit card, the battle unit cards (bottom bar), the March formation group buttons, the Barracks' Upgrade tab, and the report after a battle (a group that ranked up: "Rank 3!").
- A group ranking up says so in the messages, with its badge.

## 3. Train (experience)

- **Train** is an order to a group: it drills, and gains `RANKS.train.xp` experience.
- **Limits:** each group may be trained `RANKS.train.day` times a day and `RANKS.train.week` times a week (the owner's numbers; proposal: once a day, three times a week).
- **Proposal for where and what it costs** (open, §9):
  - in camp or staying in a holding: free, `RANKS.train.xp` (proposal 15);
  - at a holding's barracks: more (`RANKS.train.barracks`, proposal ×2) for gold (`RANKS.train.gold`, by tier);
  - Train alone reaches **rank 3 at most** (`RANKS.train.cap`); ranks 4 and 5 are earned in battle.
- In the Army window (the group's page: Train, with how many times are left this day and week) and at a barracks (its Train tab, for every group).

## 4. Upgrade (tier)

- A **rank-5** group upgrades as a whole: it keeps its id, name, slot and count; its kind becomes the next tier's (the path's choice where there are two, as now); it starts at **rank 1**, `xp` 0. This is today's whole-group upgrade (`RecruitmentService#trainGroup`, `ArmyRoster#upgrade`), now gated by rank instead of pooled experience.
- **Where and its cost:** below tier 3 and not into a caster, anywhere, free (from the Army window); tier 3 and casters at a holding that trains, for `trainCost` × the group's men (as today).
- A group at the end of its path at rank 5 is done: its badge gold, five chevrons.

## 5. The skills ladder

Each role has five rungs. **Rank 1** has the role's basic skill; the rest unlock at ranks 2 to 5. Today's five abilities are placed on the ladder (marked ★). The rest are a first proposal for the owner to cut or change. Passives are small (5% to 10%); actives have a duration and a cooldown like today's abilities (`UNIT_ABILITIES`, `battle/unitabilities.js`).

| Role | Rank 1 | Rank 2 | Rank 3 | Rank 4 | Rank 5 |
|---|---|---|---|---|---|
| Spear | Set spears (passive: braced against a charge on their front, as today) | ★ Brace (active) | Long reach (passive: +1 reach) | Rally ★ (active) | Hedge of spears (passive: a charge into them loses its bonus from any side but behind) |
| Shield | Shield up (passive: +5% block) | Rally ★ | Shield push (active: knocks the front foe back) | Steady (passive: +10% morale) | Shield wall mastery (passive: shield wall without supporting shields) |
| Sword | Drilled (passive: +5% attack speed) | Rally ★ | Press (active: +15% damage for 8 s) | Hardened (passive: +10% health) | Veteran blades (passive: +10% crit) |
| Bow | Volley (the plain shot, as today) | ★ Fire arrows | Steady aim (passive: +10% accuracy) | Rapid shot (active: faster shots for 8 s) | Marksmen (passive: +10% range) |
| Crossbow, sling | Load (as today) | ★ Fire arrows (crossbows) / Stones (slings: knock back) | Pavise (passive: +10% armour vs. missiles while still) | Aimed bolt (active: one shot ignores armour) | Sharpshooters (passive: +10% damage) |
| Caster | Bolt (as today) | Focus (passive: +10% bolt damage) | Ward (active: allies near take less magic damage) | Swift casting (passive: faster bolts) | Their people's signature (one per caster: e.g. the Runepriest's rune of iron) |
| Cavalry | Charge (as today) | ★ Spur | Trample (passive: knockdowns on a charge) | Wheel (active: turn and charge again quicker) | Shock (passive: +15% charge damage) |
| Horse archer | Ride and shoot (as today) | ★ Spur | Parthian shot (passive: shoot while withdrawing) | Rapid shot (active) | Skirmish mastery (passive: keeps its distance better) |
| Scout | Light (as today) | ★ Scout ahead | Keen eyes (passive: +20% sight) | Ambush (active: first strike from cover) | Pathfinder (passive: faster over rough ground) |

- A group has a skill when its rank has reached it. The rule that a group has an ability when half its men qualify stays for the role check.
- One table (`RANK_SKILLS`, by role and rank) in `data/`, its numbers there; actives are new entries in `UNIT_ABILITIES`, gated by `rank`.

## 6. AI armies' ranks

- **Every AI group has a rank,** shown on its unit cards in battle and on the Look card of a party.
- **Where they start** (tunables):
  - bandits, raiders: rank 1 to 2 (a chieftain's own group +1);
  - a holding's patrol and garrison: 1 to 3, by the holding's size;
  - a lord's groups: by his level and how long his army has served, 1 to 4 at the start of a game;
  - caravan guards: 1 to 2.
- **How they grow** (realistically: by what they live through):
  - every battle they fight, against you or each other on the map (`fights.js`, auto-resolve and world battles), earns the survivors experience as yours do (a battle on the map without soldiers' own numbers: by the fight's size and its outcome);
  - a lord's army at rest in a holding drills (as Train: the same day and week limits);
  - a lord's rank-5 group upgrades when he is in a holding that trains (he pays nothing, as now when lords' troops change);
  - new recruits into a group take its rank (as yours); a new group starts at rank 1;
  - a beaten army keeps the ranks of what is left.
- So a lord who has fought all season has veterans, and a fresh levy does not.

## 7. Saves, tests, fingerprints

- **Saves:** each group gains `xp` and `rank` (defaults on load: 0 and 1); no migration of old saves (the house rule); `P.txp` is dropped. AI groups' ranks are saved with their armies.
- **Fingerprints:** gating today's five abilities behind ranks changes battles where they are used (the battle suites' AI captains use Brace, Spur and the others); the battle fingerprints and `rts` will move in phase 2, each with its reason written. Phase 1 changes no battle numbers.
- **Tests:** a suite per phase (ranks, badge, train, upgrade gate, skills ladder, AI ranks), in the existing style.

## 8. Phases

1. **Ranks and badges:** group `xp`/`rank`, the ladder, earning in battle, the badge everywhere, Upgrade gated by rank 5 (Train 1/all removed), `P.txp` dropped. No battle numbers change.
2. **The ladder:** `RANK_SKILLS`, today's five abilities gated by rank, the passives. Fingerprints re-recorded with reasons.
3. **Train:** the drill order, its limits and caps, in the Army window and the barracks.
4. **AI ranks:** starting ranks, growth from fights and drill, lords' upgrades.
5. **New actives:** the new ★-less actives of §5, a few at a time.

## 9. Open questions

1. **Train: where and what it costs.** My proposal (§3): free in camp or a holding, more for gold at a barracks, at most once a day and three times a week, reaching rank 3 at most. Your numbers?
2. **Recruits at the group's rank.** With rank fixed, ten fresh recruits joining a rank-5 group become rank-5 veterans at once. Is that what you want, or should recruits only fill a group up to the men it had (its losses), with a larger group needing a new rank-1 group?
3. **Rank 1's skill.** I gave every role a basic rank-1 skill that is what it does today (a spearman braced to the front, a bowman's volley), so a new group is not weaker than today's. Keep it so?
4. **The skills of §5:** cut, keep or change any of them; which two roles to build first (my proposal: Spear and Bow).
5. **Peasants (tier 0):** do they rank (iron badge), or only upgrade to their first soldiers as now?
