# Proficiency: how your hero grows (design)

The owner, 2026-11-08:
- "Change the name Discipline to Proficiency, Basic to Trait."
- The skill page: 1. Proficiency, 2. Tree, 3. Trait, 4. Skill Bar.
- "Your proficiency grows as you do certain actions or doing something like the current system do. And the level progress will just based on your proficiency progress."
- "A proficiency cap for each at 99 max then we calculate the level based on that. The hero, lords, companions will start at 0; companions or lords may grow their own way."
- The combos now in Basics "should be unlocked via skill tree instead."
- Old saves: "wipe old save for now". No switch back: "revamp to new".

Status: **built** (2026-11-08). Numbers in `PROF` (`data/progression.js`).

## 1. What exists today

| Part | Where | How it grows |
|---|---|---|
| **Level** | `world/characters.js` `gainXp`, `LV_XP = level × 60` | Flat experience from battles, quests and finds. |
| **Tree points** (`P.tp`) | `Character#levelled` | One per level. |
| **Disciplines** (19) | `data/progression.js` `SKILLS`, `Character#train` | By use, 0 to 10 (`SK_XP = (level+1) × 20`). A knack (`P.apt`) makes one rise faster. A past starts a few at 1 or 2. |
| **Basics** | `ui/talents.js` `SPECIAL` | Combo, Third Blow at weapon discipline 3, finisher choice at 6, Dodge Roll, Shove, Shield Bash. |
| **Skill bar** | `ui/talents.js` | Ten slots for the active skills the Tree unlocked. |

## 2. The model

**What you do → your Proficiencies rise (0 to 99) → their rising fills your level → each level gives one Tree point.**

## 3. Names

- **Discipline → Proficiency** and **Basics → Traits** wherever the player reads them: the tabs and help lines, the messages, the loading tips, companion notes, unit cards, the wiki and the README.
- **Unchanged:**
  - The battle stance "Discipline" (hold ground, F): the owner, "leave it alone".
  - Code names (`SKILLS`, `P.sk`).

## 4. Proficiencies

### 4.1 Growth
- Each proficiency runs **0 to 99** (`PROF.max`). *(2026-11-08, the owner: no top for now, at most 9999. A made character still starts at no more than 99 (`PROF.made`), and the effects made for 99 (prices, Survival's food, Blocking's stamina, sight) read no further (`skillSafe`); the rest grow on.)*
- It rises **by use, as now**: the existing `train(...)` calls stay.
- **Pace:** reaching 99 takes about as much practice as reaching 10 does today. A level needs `PROF.xp0 + PROF.xpUp × level` practice (4 + 0.145 × level; 0 to 99 is 1099, as 0 to 10 was 1100), so early levels come quickly and later ones slowly.
- **A knack** (your race's or past's) still makes its proficiency rise faster, as today.

### 4.2 What a level is worth
- Every effect is measured in **power**: `skill(k) = level / PROF.per + Tree and gear bonuses`, with `PROF.per` = 9.9. So 99 gives today's 10, and every level in between counts a little; there are no steps of ten.
- Tree nodes and gear keep their "+1 One-Handed" in power, worth 10 proficiency levels.
- The descriptions read in tens of levels: "+0.6 damage per 10 levels".

### 4.3 Where you start
- **Everyone starts at 0** (the owner): your hero, companions, lords.
- **A past's head start** (e.g. a Veteran's One-Handed) becomes a **free starting proficiency**:
  - `PROF.pastPer` = 10 levels per point of today's bonus, so the Veteran starts at One-Handed 20.
  - It **does not count toward your level**: every past begins at level 0.

### 4.4 Battle and quest rewards
Today's flat experience becomes practice (`PROF.reward`, the share of the old amount):
- **A won battle:** the weapon proficiency your hero fought with, plus Leadership and Tactics.
- **A lost battle, or one fled:** the same, smaller.
- **A tournament:** your weapon and Athletics.
- **A monster or lair slain:** your weapon.
- **A quest:** trains what fits its kind (`QUEST_TRAIN`):
  - Persuasion for talks, envoys and surrenders;
  - Scouting for searches, rescues and missing people;
  - Trade for deliveries and caravans;
  - your weapon and Leadership for fights;
  - Medicine for the sick.
- **The hermit's lore, a ruin's carvings:** Scouting and Tactics.

## 5. Level from proficiency

- **Progress** = the sum, over all proficiencies, of each one's level gained × its **weight** (`PROF.weight`), counting part of a level as its bar fills. So your level bar moves with every hit or sale.
- **Starting levels from your past aren't counted.**
- **Level n** needs `PROF.step × n(n+1)/2` progress (`step` = 50), where a proficiency at level L gives `L(L+1)/2` × its weight. Level 10 needs 2750: one proficiency from 0 to about 74. Every proficiency at 99 (weights as below) is 17.2 × 4950 = 85140, about level 57.
- **Weights** (the owner: "go with your recommendations") make the proficiencies that rise very easily count less:

  | Weight | Proficiencies |
  |---|---|
  | 1 | One-Handed, Two-Handed, Blocking, Archery, Spellcraft, Unarmed, Leadership, Tactics, Medicine, Engineering, Persuasion, Hunting |
  | 0.8 | Riding, Woodcraft, Survival, Stewardship, Athletics |
  | 0.6 | Scouting, Trade |

- **Repeats:** the same cheap action again and again gives less. A proficiency's practice within the same in-game hour shrinks after `PROF.burst` uses (×0.5, then ×0.25). It recovers the next hour.
- **Each new level** gives **one Tree point** (the owner: "1 per level"). The toast reads "Level 7: +1 tree point", with the proficiency that did it.
- **No more flat experience.** `gainXp` for the hero and companions now trains (§4.4).

## 6. Companions and lords

- **Companions** level the same way as your hero (the owner: "based on yours"). One who joins grown in a story (Ander) keeps his level, and what he was good at is a free start, as a past's. They train their fighting proficiencies by use, plus their share of battle rewards. Their Skills window gets the same four tabs.
- **Lords and chieftains** grow their own way (the owner: "yes"). They keep today's levelling: their experience by wins and time, and a level's Tree point spent at once by their class. Their proficiencies start at 0 and grow with their level, so a lord of level n has his class's proficiencies at about 5 × n (half his level in power, as today).

## 7. The skill page

Tabs, in the owner's order: **Proficiency · Tree · Trait · Skill bar**. It opens on Proficiency.

- **Header:** "Skills · Level 7 · 1 tree point".
- **Proficiency:**
  - **Top:** the level bar ("Level 7 · 61% to 8"). The proficiency that raised it most lately is named.
  - **Rows**, grouped: Fighting, Command, The road, Trade and rule. Each shows its name, its level out of 99 with its bar, "+n" from the Tree and gear, the knack mark, what it does now, and its weight toward your level when that is under 1.
- **Tree:** as today, plus the combo's nodes (§7.1).
- **Trait:** the innate moves plus your race's and your past's traits, all in one place:
  - Moves: the two-blow combo, Dodge Roll, Shove, Shield Bash.
  - Race: an elf's forest pace, a dwarf's hills and frost, an orc's heat and swamp, a human's roads.
  - Past: what it gave you, and its knack.
- **Skill bar:** as today.
- **Frame:** header, choices only, the bottom bar from `nav()`, Esc follows the bar. It works at phone landscape (844×390).

### 7.1 The combo's upgrades on the Tree (the owner)
- Today the Third Blow comes at weapon discipline 3, and the finisher choice at 6.
- They become **Tree nodes**, off the Might spine, near Brute Force:
  - **Third Blow** (an ability node: the combo ends in a third, heavier blow);
  - then two exclusive **notables**, **Stunning Finisher** and **Crushing Finisher**. Taking one locks the other, as the choice does today.
- The same for every weapon, as the combo is.
- `COMBO_UP` and the finisher choice button go.

## 8. The owner's answers

| # | Question | Answer |
|---|---|---|
| 1 | Battle and quest rewards | Turn them into practice (§4.4). |
| 2 | Level from proficiency | Cap 99 each, level calculated from them. Everyone starts at 0. Companions and lords may grow their own way. |
| 3 | Easy proficiencies | Weights and fewer repeats (§5). |
| 4 | Ceiling | Answered by 99. |
| 5 | Tree points | One per level. |
| 6 | A past's head start | Free, and not counted toward level. |
| 7 | Companions | The same as the hero. |
| 8 | Lords and chieftains | Their own levelling. |
| 9 | Trait tab | Moves plus race and past traits. The combos move to the Tree. |
| 10 | The stance "Discipline" | Leave it alone. |
| 11 | Old saves | Wipe them: a save from before is refused, with a notice, and a new game starts. |
| 12 | Off switch | None: the new way only. |

## 9. What changes in code

| Change | Files |
|---|---|
| `PROF` table; proficiency 0–99, its practice curve, power (`skill`), weights, repeats | `data/progression.js`, `world/characters.js` |
| Level from proficiency progress; one Tree point per level; `gainXp` → practice for the hero and companions | `world/characters.js`, `battle/engage.js`, `resolution.js`, `sides.js`, `story/quest.js`, `outcome.js`, `world/sites.js`, `critters.js` |
| Starting levels at 0; a past's free start; lords' proficiencies from their level | `core/state.js`, `world/leaders.js`, `world/companions.js` |
| Combo upgrades as Tree nodes | `data/tree.js`, `battle/combat.js`, `core/talents.js` |
| The page: tabs, Proficiency rows and level bar, Trait tab, renames | `ui/talents.js`, `companionpage.js`, `unitcard.js`, `loading.js`, `style.css`, wiki |
| Old saves refused (version bump), with a notice | `core/save.js` |
| Tests: a new `proficiency` suite (0–99, the curve, power, weights and repeats, level from progress, a Tree point a level, rewards as practice, the past's free start, combo nodes, companions, lords, an old save refused); suites that expect flat experience, levels or discipline numbers brought up to date | `tests/` |
| Fingerprints: W7, W8 and B2 (the save and lords' levels) and the battle suites where heroes' numbers change. Re-recorded with reasons. The proof is the commit before. | `tests/worldprint.js` and others |

## 9b. Since built: a tree for each proficiency, and the level's choice (2026-11-08)

The owner: "make each skill tree separated by proficiency"; "when you level up you choose to upgrade health, stamina or magic". This replaces §5's and §7's Tree point:
- Each proficiency has its own tree (`data/tree.js` `PROF_TREE`): milestones (15, 35, 60, 90 for the fighting ones and Leadership; 15, 35, 60 for the rest), two nodes at each. Its points, one each 15 levels of it (`TREE_PT`), are spent freely on any node a milestone has opened that grows from the tier below (the owner: "freely spend based on their preferences"). Drawn as a tree that grows when shown.
- Each level is a choice of +10 health, +10 stamina or +10 mana (`LEVEL_UP`); the level no longer adds these by itself.
- Companions choose in their own trees; lords and chieftains choose for themselves, their trees opening as if their proficiencies were 8 × their level (`AI_TREE`).
- The skill page's Tree tab is now Skill trees: the shown one's milestones the whole page, the proficiencies switched under it (‹ ›, or the list of them all from its name). See `prototype/README.md`, "Skill trees by proficiency".

## 11. Skyrim's loop, no attributes (2026-11-08, step 1 built)

The owner: "I want a scale to be like a skyrim. You get XP from quest, battle, etc. and from proficiency. Once level up you will get skill point to be spend on the proficiency trees"; "no more cap based on the proficiency like every 15, 30"; "no cap on max how you can gain proficiency"; "nerf the buff from proficiency and attribute"; "refine background start bonus ... up to 15"; "remove attribute system and turn into bonus upgrade along journey path in tree". Asked: Skyrim-like pace, a node a quarter strong at proficiency 0, gold to unlearn, companions' points yours (theirs while away), checks by the relevant proficiency. This replaces §5, §9b's points and level choice:
- **Experience and level** (`data/progression.js` `LEVEL`; `characters.js` `gainXp`, `addXp`, `xpNeed`, `HERO_XP`): a deed gives experience (battles, quests, beasts, lore), and practice as before (`REWARD_TRAIN`); each level a proficiency reaches gives experience equal to it (`LEVEL.prof`). The next level takes 75 + 50 × your level (about level 10 in two or three hours, 30 in fifteen, 50 in forty). Each level: one skill point (`LEVEL.pts`). Your damage gains 1 a level (was 2). No health, stamina or mana to choose (`LEVEL_UP`, `P.lvUp`, `lvPick` gone).
- **Skill points** (`core/talents.js` `points`, `canTake`): one pool, spent on any tree; no milestone: a node opens once a node of the tier below in its tree is learned. Unlearning costs gold, as before.
- **A node's strength** (`TREE_SCALE`, `treeScale`, `core/state.js` `nodeScale`, `tmOf`): a quarter at its proficiency 0, whole at 100, then 0.5 × ln(level ÷ 100) more. A unit slot and a prisoner are whole at once (`TREE_SCALE.whole`).
- **No top on a proficiency** (`PROF.max` Infinity); its power (`profPow`): .06 a level to 100 (6), then 2.5 × ln(level ÷ 100) more (10 at 500, about 12 at 1000; was a level ÷ 9.9, 10 at 99). `PROF.per` is now the levels to a point of power (16.7): a lord's, chieftain's or companion's made proficiencies give the power they gave before. The effects made for the old top read a proficiency only to 99 (`skillSafe`). Your army's unit slots: one more each 16.7 levels of Leadership past 33 (all ten at 150; was each 10 past 20).
- **Attributes are gone** (`P.attr`): your past's and race's are their bonuses (`ORIGINS` attr, `TREE.r_<race>`: half what a point gave: `ATTRS[k].fx`, `attrMods`), a node's "+2 Strength" too; a companion's (Ander's) is his own (`o.own`). Your hero starts as the old start with every attribute 2 (`HERO_BASE`). A check that named one reads the proficiency it is about (`data/encounters.js` `ENC_STAT`, `data/chains.js`: horse and sneaking Athletics, the mine Engineering, the wisps Spellcraft, respect and haggling Persuasion…; a story's condition, `attrCheck`: the best of `ATTRS[k].profs`).
- **Your past** starts its proficiencies at 15 at most (`PROF.pastPer` 7.5, rounded; was 10, 20 at most).
- **Lords and chieftains** get a point a level and spend it themselves (`autoTree`: their class's nodes, else their strongest proficiency's tree); **companions** get a point a level for you to spend, spent by themselves while away leading a party; a newcomer spends what its level has given it as it joins.
- **The round tree (step 2, built; the owner: "one big circle node tree spans across each proficiency"):** every proficiency a slice of one wheel round your origin, by group (`data/tree.js` `TREE_RING`: Fighting, Body and wilds, Command, Word and coin). A path runs out from the middle: its first tier's pair open at once (`entry`), then between each two tiers a bonus node (`TREE_PATH`, named by `PATH_NAME`: health, damage, stamina, mana, troops, travel, thrift…, the first also its proficiency learned 10% faster) joining both below to both above (`links`). A node opens once a node linked to it is learned (`core/talents.js` `reach`, `canTake`); unlearning only while every other learned node is still reached from the middle (`canRefund`); `pathTo(id)` the nodes still to learn on the way. 63 tiers' pairs and 44 bonus nodes, 170 in all. Lords and chieftains walk the way to their class's nodes (`CLASS_PICK`, an active skill near the front), else their strongest proficiency's tree.
- **Its page** (`ui/talents.js` `treeSvg`, `treePos`, `TREE_ROUND`; `fieldbook.css` "the round tree"): the shown slice turned to the top, the wheel spinning to it when ‹ › or the list change it (`G.skRot`); its names beside their nodes, the other slices dim; a tap on another slice's node turns to it; ◎ the whole circle (`G.skWhole`, every slice named, a name turning back to it). Still to come (step 3): pinch and drag over the whole wheel.

## 10. Phases

1. **Names, tabs, the Trait tab.** Display only.
2. **Proficiency 0–99 and power.** Every effect keeps today's strength at 99.
3. **Level from proficiency, Tree points, rewards as practice, repeats.** Starting at 0, the past's free start.
4. **Combo upgrades on the Tree.**
5. **Companions and lords.**
6. **Old saves refused; tests, fingerprints, docs.**
