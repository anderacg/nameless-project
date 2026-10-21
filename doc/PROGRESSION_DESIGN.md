# Progression for every unit: characters by role, troops by speciality: design

Status: **design only** (owner, 2026-10-21). Nothing here is built.

**The owner's direction:**
- All units (the hero, companions, lords, unique units and normal troops) have skill trees and upgrades.
- The hero, companions, lords and unique units have **special skills and a special progression**.
- **Normal troops** keep upgrading to the next tier as now. They also earn **skill points** for a **speciality**, which depends on their **path**.

## 1. What exists (the class system)

The Unit/Character refactor (class wave A, `world/characters.js`, `leaders.js`, `companions.js`) built it:

```text
Unit
├─ Troop        one per kind of soldier (data/units.js ST): its stats, tier, upgrades (UP)
└─ Character    one person who grows; its role is its class:
   ├─ Hero      you
   ├─ Companion your companions
   ├─ Lord      the realms' lords
   └─ Chieftain the bandit chieftains
```

| Who | Grows today by |
|---|---|
| **Hero** | XP and level; the **skill tree** (`data/tree.js`: branches, hybrids, perks); disciplines that grow by use (`SKILLS`); active skills on the ability bar; combos and finishers (`HeroHands`) |
| **Companion** | level and XP; disciplines (`COMP_SK`); **a perk every third level**; gear in seven slots; a role (scout, surgeon, quartermaster, guide); can lead a party |
| **Lord** | level and stats (`lordStats`, `lordSkill`); wins and losses; no tree |
| **Chieftain** | level; grows with raids won |
| **Troops** | **XP per kind** (`P.txp`, troop XP in battle, Leadership speeds it), spent to **upgrade to the next tier** (`UP`: levy, spearman…); **abilities by kind** (`UNIT_ABILITIES`: Scout ahead, Brace…); unit morale |

## 2. Characters: one base, a progression by role

All characters share one progression engine, the **trees** (today's `TREE`, generalised). Each role gets its own tree and its own pace.

| Role | Tree | Special skills | Notes |
|---|---|---|---|
| **Hero** | today's full tree (unchanged) | the ability bar, combos, finishers | the reference |
| **Companion** | a **smaller tree of its own**, shaped by who it is (Brann: the berserker's; Elske: the healer's; Tavi: the scout's), plus today's perks folded into it | **one signature skill**, its own (Brann's Bloodrage, Elske's Mend, Tavi's Mark), learned at level 1 and stronger as it grows | the player picks its nodes (in its window); approval may lock a branch it dislikes |
| **Lord** | a **doctrine tree**: command (his army), and his own fighting | one signature by temperament or race style (the orc's Warcry, the elf's Volley at will) | chosen by the AI along his temperament (`TEMPERAMENT`); his doctrine also gives his troops their specialities (§3.5) |
| **Unique units** (new role, `Unique`) | **fixed**: a named fighter's set skills, growing with level | a **signature** that defines him (Ander The Fallen's Last Stand) | rare (`HIDDEN_RATE`); met as a foe, a rival or a recruit; one per world each |
| **Chieftain** | as now (grows by raids), plus a signature from his band (the wolf-riders' Pack call) | | |

**Special skills** are active battle abilities with a cooldown, the same machinery the hero's skills use (`HeroHands` for you, `ChampionMind` for the AI's characters). Companions under your command use theirs on Auto or when you trigger them (the ability bar shows your companions' too).

## 3. Troops: tiers, then a speciality

### 3.1 Tiers stay as they are
XP by kind (`P.txp`), spent to upgrade to the next tier along `UP`, at the barracks' price. Nothing changes here.

### 3.2 A speciality belongs to an army group (owner, 2026-10-21: "yes, by group")
Troops are counts, not individuals, so a speciality cannot be per soldier. It belongs to an **army group**: the groups you already manage in the Army panel (`{id, type, count, form}`, up to `ARMY_LIMIT`), like a regiment in Total War.

- **Earned:** a group gains **drill** from battles (its kills, its survival, the battle's size, your Leadership) and, slowly, from days in camp with a drillmaster (a companion's role, or a perk).
- **Points:** every so much drill, a **speciality point**: at most 3 per group (a veteran regiment).
- **Spent** in the group's row in the Army panel, from its **path**.

### 3.3 Specialities by path
A path is a line of the tier tree (`UP`): spear, sword-and-shield, bow, crossbow, light cavalry, heavy cavalry, horse archers, mages, beast riders, and each race's own line. Each path has a small set of specialities (3–5), each 1–3 points:

| Path | Specialities (examples) |
|---|---|
| **Spear** | Brace drill (Brace sooner and longer), Long spears (+reach), Hedge (resist cavalry charges) |
| **Sword and shield** | Shield wall (block more in formation), Push of shields (knockback), Steady (morale) |
| **Bow** | Volley (wider spread, stronger first volley), Steady aim (accuracy), Fire arrows (unlock), Full quiver (+25% shots: ITEMS_DESIGN.md §2b) |
| **Crossbow** | Pavise (cover while reloading), Bolt-thrower (damage vs armour), Full case (+25% bolts) |
| **Light cavalry** | Skirmish (wheel and return), Pursuit (run down routers), Scout ahead (longer) |
| **Heavy cavalry** | Couched lance (charge damage), Barding (resist arrows), Reform (regroup fast) |
| **Mages** | Ward (resist magic), Focus (cast speed), the race's school |
| **Beast riders** | the beast's own (wolf: Pack hunt; ram: Battering charge) |

Small numbers (about 5–10% each) or one unlock each, so the counts still decide most battles.

### 3.4 Upgrades, merges, recruits
- **Upgrading to the next tier** keeps the group's specialities that belong to the same path. A spearman's Brace drill stays on the pikeman. A speciality that the new kind cannot use is refunded as a point.
- **Merging** two groups keeps the larger group's specialities. **Splitting** gives each part the same.
- **Recruits** joining a veteran group dilute its drill a little (by their share). A group of half recruits earns its next point more slowly; its specialities stay.
- **A group wiped out** loses its specialities. A group that keeps its name and banner after losses keeps them: the regiment lives.

### 3.5 Lords' and AI armies
AI armies have no Army panel. Their groups take specialities from their lord's **doctrine** (§2): a lord who favours the bow gives his archer groups Volley. A bandit chieftain's band gets its band's style. This is also where the held **band auras** (leaders' skills reaching their troops, `band-aura-plan`) belong: one rule for both.

## 4. In battle and on screen

- **Battle:** the group's specialities reach its soldiers through `Actor`/`Fighter` (class wave E3): one read per soldier, through the group's `BattleControl`. Unlocked abilities join the group's order bar (`UNIT_ABILITIES`).
- **Army panel:** each group row shows its drill, its points and its specialities (icons), with a "Specialise" button when a point is free.
- **Unit card** (battle and recruit screen): the group's specialities and what they do.
- **Character windows:** a tree tab for each companion; a lord's page shows his doctrine and signature (read-only).

## 5. What changes in code

- **Trees:** `data/tree.js` generalised to trees by role (`TREES.hero`, `TREES.companion[id]`, `TREES.lord`); `Character` gets `tree()` and `spend(node)`; the hero's tree unchanged.
- **Signature skills:** `data/abilities.js` gains each character's signature; `ChampionMind` uses them.
- **`Unique`:** a new role class beside `Hero`, `Companion`, `Lord` and `Chieftain`.
- **Specialities:** `data/specialities.js` (new: `PATHS` from `UP`, `SPECIALITIES` by path); army groups gain `drill`, `pts` and `spec` (`core/army.js`); battle reads them in `actors.js`/`attacks.js`.
- **Saves:** the groups' and characters' new fields, defaults empty (no migration).
- **Fingerprints:** with every speciality and new tree empty, the battle and world fingerprints hold. Lords' doctrines change AI armies, so that phase re-records once, on purpose.

## 6. Phases and effort

| Phase | What | Effort |
|---|---|---|
| **1. Troop specialities** | Paths, specialities, drill and points on army groups, the Army panel, battle effects, merges and upgrades | **M–L** |
| **2. Companion trees and signatures** | Trees by companion, signatures, the ability bar for companions, the tree tab | **L** |
| **3. Lords' doctrines** | Doctrine trees chosen by temperament; AI armies' specialities from them; band auras folded in | **M** (re-records once) |
| **4. Unique units** | The `Unique` role; Ander The Fallen (with the wounded chain) and a few named rivals | **M** |

Phase 1 stands alone; 2 and 3 can run in parallel after it; 4 goes with the wounded chain.

## 7. Questions for the owner

1. ~~Troop specialities per army group (a regiment), not per soldier?~~ **Decided (owner, 2026-10-21): by group.**
2. **How many points** per group: 3, or more for elite tiers?
3. **Drill from camp:** should a drillmaster in camp also give drill, or only battles?
4. **Recruits diluting a veteran group:** yes, or should a group's specialities never weaken?
5. **Companion trees:** their own small trees (as above), or the hero's full tree, as the feature plan says today?
6. **Lords' doctrines:** chosen by the AI only, or visible and countered (you learn a lord favours cavalry and bring spears)?
7. **Unique units:** recruitable after a chain (as Ander), or some only ever foes?
