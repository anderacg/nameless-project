# Unit ranks: design

Status: **phases 1 to 3 built** (trainers: README "Trainers"; mastery and proficiency too) (2026-10-30: ranks, badges, the rank-5 upgrade, the peasants' grind; the Spear and Bow ladders; README "Ranks", "Rank skills"); phases 4 to 6 not yet; design revision 3 (2026-10-30, written against `codex` at c06c6b3). Nothing here is built. The owner answered revisions 1 and 2's questions; his answers are in **Decisions** and folded into the rules. §9 lists what is still open.

**Readers:** the owner, and whoever builds the phases of §8.

**Words used here:**
- A **group** is one of an army's troop groups (`ArmyRoster` groups, `core/army.js`): one kind of soldier, its own id, name, slot and formation. Every army has them: yours, a lord's, a band's, a patrol's.
- A **kind** is a troop type (`ST`, `data/units.js`); its **tier** is `ST[k].tier` (0 peasants, 1 to 3 soldiers).
- A **role** is what a kind does in a fight: spear, shield, sword, bow, crossbow (and sling), caster, cavalry, horse archer, scout (`unitClass`, `isScout`).
- A **trainer** is someone who drills soldiers: your hero or a companion with the trainer trait, or a holding's or special place's trainer.

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

Revision 2 (the owner's answers to revision 1's questions):
- **Train needs a trainer.** In your camp, only if your band has a trainer (a hero or companion with the trainer trait); otherwise for gold at a holding, or at a special place, that has one. Train gives **flat experience, by the trainer's expertise**. **About 5 trainings a week.** A trainer is expert in **certain kinds of units** (by role): a holding without a trainer for your group's role cannot train it. **The trainer's expertise level caps the tier** he can train (§3).
- **Rank stays with the group, as in Total War:** a group refilled with recruits keeps its rank.
- **No old saves:** the game restarts; nothing is carried over (no defaults for old records needed).
- **The ladder is a baseline for later:** Spear and Bow are built first; the table and its code are made so the other roles are added as data later.
- **Peasants (tier 0) have no ranks:** they grind experience toward their first upgrade, and that first grind is made hard.

Revision 3 (the owner's answers to revision 2's questions):
- **Trainers are like Skyrim's:** named people who teach, each only up to his own level. His level caps the **rank** he can train a group to.
- **Training can reach rank 5,** but it is not the main way to advance: an optional thing to advance a little faster. Battle stays the main road.
- **5 trainings a week per trainer,** for your whole army.
- **The trainer trait** is a companion role (Trainer) and a hero talent, and **holdings' trainers work by the same rules** (roles, level, 5 a week).
- **Some trainers stay put, some travel** between holdings and places; where they are is heard in the news and rumours. A player may need a certain trainer to train, or to **upgrade**, certain units.

## 0. Proficiency and mastery (owner, 2026-10-30; built)

- **Proficiency:** each rank above the first, +1% damage, health and aim (`RANKS.prof`).
- **Mastery replaces the tier metals:** the badge is steel with its rank's chevrons; at rank 5 a group's experience is mastery experience, its badge bronze, silver, gold at 300, 700, 1200 more (`RANKS.mastery`).
- **Each mastery is a pick:** a reached skill of its ladder improved (its `up`), or a drill (one more step of proficiency).
- **Upgraded,** mastery and picks reset; half its mastery experience is its new kind's first experience (`RANKS.mastery.carry`).
- §2's "metal is the tier" is superseded by this.

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
- **Rank stays with the group (Total War):** a group refilled with recruits keeps its rank; merging two groups keeps the higher rank; a split keeps the rank in both; the wounded keep their group's rank (a group all wounded keeps its slot already: `ArmyRoster#held`). A group wiped out is gone, its rank with it.
- At rank 5 experience stops; the group waits to upgrade.
- **The old pool goes:** `P.txp` (experience by kind) and `txpReady` are removed. The Army window's "Training" meter becomes the group's rank meter.
- **Peasants (tier 0) have no ranks** and no badge rank: a group of peasants gathers experience toward its first upgrade only (`RANKS.peasant`, proposal: as much as a tier-1 group needs for rank 3, 100). No skills.

## 2. The badge

- A small pixel shield, its metal the tier: **bronze** (1), **silver** (2), **gold** (3). On it, **1 to 5 chevrons** for the rank. Peasants show a plain iron shield, no chevrons. Drawn once per metal and rank and cached (16 pictures).
- Shown on: the Army window's group list and unit card, the battle unit cards (bottom bar), the March formation group buttons, the Barracks' Upgrade tab, and the report after a battle (a group that ranked up: "Rank 3!").
- A group ranking up says so in the messages, with its badge.

## 3. Train (experience) and trainers

Training is optional: a way to advance a little faster, never the main one (the owner). Battle stays the main road to rank 5.

### 3.1 A trainer
- A **trainer** is a person (`Trainer`, one record each) with:
  - **roles:** one or two (spear, bow, shield, sword, cavalry, horse archer, caster, scout);
  - **a level**, as Skyrim's trainers: **1 journeyman, 2 expert, 3 master**. His level caps the rank he trains a group to: journeyman to **rank 2**, expert to **rank 4**, master to **rank 5** (`RANKS.train.cap`);
  - **what a training gives:** flat experience by his level (`RANKS.train.xp`, proposal 15 / 25 / 35: about a third of a fight's, so it helps without replacing battle);
  - **5 trainings a week** (`RANKS.train.week`), for your whole army: each is one group trained once; the count starts again each week;
  - **his price** (a holding's or a wandering trainer's; yours are free): by his level and the group's tier, `RANKS.train.gold`.
- **Every trainer follows these rules,** yours or the world's.

### 3.2 Who trains
- **Your own:** your hero with the trainer talent (the tree's Drillmaster becomes it: his people's melee or bow role, the level rising with the talent's ranks), and any **companion with the Trainer role** (a new `ROLES.trainer`: each companion his own roles, his level rising as he levels). They train only while you are **in your camp**, free.
- **The world's:** trainers living in holdings (a town's 1 to 2, a castle's 2 to 3, a capital's more, by its people and size), at **special places** (a knightly order's house, a mercenary camp, a hermit's hut: later), and **wandering ones** who travel between holdings and places on a round, a few days at each.

### 3.3 Finding them
- A holding's trainers are listed in its Barracks (their Train tab: each his roles, level, price and trainings left this week).
- **Wandering trainers are news:** where one is now, and where he goes next, is heard in the rumours (`news.js`: "A master of the bow, Aldric Greywater, is teaching at Saltmere this week") and in the tavern's information. The Journal keeps the trainers you have met and where they were last heard of.
- A trainer you need is a reason to travel: a master is rare (a few in the world), and some upgrades need one (§4).

## 4. Upgrade (tier)

- A **rank-5** group upgrades as a whole: it keeps its id, name, slot and count; its kind becomes the next tier's (the path's choice where there are two, as now); it starts at **rank 1**, `xp` 0. This is today's whole-group upgrade (`RecruitmentService#trainGroup`, `ArmyRoster#upgrade`), now gated by rank instead of pooled experience.
- **Where and its cost:**
  - an upgrade below tier 3 and not into a caster: **anywhere, free** (from the Army window);
  - **special upgrades** (to tier 3, or into a caster): only with **a trainer of that role at expert level or more** (master for some: `RANKS.upgrade.need`, by target), wherever he is (a holding, a place, a wandering one, or your own), for his price (`trainCost` × the group's men; your own: free). This replaces "a holding that trains" (`TRAIN_PLACE`).
- A group at the end of its path at rank 5 is done: its badge gold, five chevrons.

## 5. The skills ladder

Each role has five rungs. **Rank 1** has the role's basic skill; the rest unlock at ranks 2 to 5. Today's five abilities are placed on the ladder (marked ★). The rest are a first proposal for the owner to cut or change. Passives are small (5% to 10%); actives have a duration and a cooldown like today's abilities (`UNIT_ABILITIES`, `battle/unitabilities.js`).

| Role | Rank 1 | Rank 2 | Rank 3 | Rank 4 | Rank 5 |
|---|---|---|---|---|---|
| Spear | Set spears (passive: braced against a charge on their front, as today) | ★ Brace (active) | Long reach (passive: +10% reach; built so, as world battles scale reach) | Rally ★ (active) | Hedge of spears (passive: a charge into them loses its bonus from any side but behind) |
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
- **As built (phase 2):** an ability on a role's ladder unlocks at its rung; one on another role's ladder and not its own is lost (bowmen have no Rally now); one on no built ladder yet (Spur, Scout ahead) stays from rank 1, as does every ability of a role not yet on a ladder. AI armies' groups count as rank `RANKS.ai` (2) until phase 5. Rapid shot is a new order (key N).
- **Built first: Spear and Bow** (the owner). The other rows stay in the table as the plan, each added later as data (its passives as stat changes, its actives as `UNIT_ABILITIES` entries) with no new code paths. Until a role is built, its group has today's abilities from rank 1, so no role is left weaker meanwhile.

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

- **Saves:** each group saves `xp` and `rank`; the game restarts (the owner: no old saves are used), so no defaults for old records; `P.txp` is dropped. AI groups' ranks are saved with their armies; trainers with their holdings and companions.
- **Fingerprints:** gating today's five abilities behind ranks changes battles where they are used (the battle suites' AI captains use Brace, Spur and the others); the battle fingerprints and `rts` will move in phase 2, each with its reason written. Phase 1 changes no battle numbers.
- **Tests:** a suite per phase (ranks, badge, train, upgrade gate, skills ladder, AI ranks), in the existing style.

## 8. Phases

1. **Ranks and badges:** group `xp`/`rank`, the ladder, earning in battle, the badge everywhere, Upgrade gated by rank 5 (Train 1/all removed), `P.txp` dropped, the peasants' first grind. No battle numbers change.
2. **The ladder, Spear and Bow:** `RANK_SKILLS`, Brace and Fire arrows gated by rank, their passives. Fingerprints re-recorded with reasons.
3. **Trainers:** the `Trainer` record and its rules; holdings' trainers (Barracks); your hero's talent and the companions' Trainer role (in camp); special upgrades needing a trainer.
4. **Wandering trainers:** their rounds, the news and rumours, the Journal's list.
5. **AI ranks:** starting ranks, growth from fights and drill, lords' upgrades.
6. **The other roles' ladders** and new actives, a few at a time.

## 9. Open questions

None now. The numbers marked "proposal" are first values in the tunables, for the owner to adjust in play.
