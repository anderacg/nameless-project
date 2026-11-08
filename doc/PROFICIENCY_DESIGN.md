# Proficiency: how your hero grows (design)

The owner, 2026-11-08:
- "Change the name Discipline to Proficiency, Basic to Trait."
- "I want to change the way how hero player progress. Right now we get an exp to unlock skills, instead the level progress will count towards Proficiency pool."
- The skill page's order: 1. Proficiency, 2. Tree, 3. Trait, 4. Skill Bar.
- "Design first."

Status: **design, waiting for the owner's answers (§9). Nothing built.**

## 1. What exists today

| Part | Where | How it grows |
|---|---|---|
| **Level** | `world/characters.js` `gainXp`, `LV_XP = level × 60` | Experience from battles, quests, finds. |
| **Skill points** (`P.tp`) | `Character#levelled` | **One per level.** Spent on the Tree. |
| **Tree** (passives, notables, keystones, active skills) | `data/tree.js`, `core/talents.js`, `ui/talents.js` | A node is bought with one skill point, next to one you have. Some nodes add levels to a discipline (`sk:{oneh:1}`) or attributes. |
| **Disciplines** (18: One-Handed, Two-Handed, Blocking, Archery, Spellcraft, Unarmed, Athletics, Leadership, Tactics, Medicine, Engineering, Persuasion, Scouting, Riding, Woodcraft, Hunting, Survival, Trade, Stewardship) | `data/progression.js` `SKILLS`, `Character#train` | **By use only**, 0 to 10 (`SK_XP = (level+1) × 20`). A race's or past's *knack* (`P.apt`) makes one rise faster. A past starts a few at 1 or 2. |
| **Basics** (Combo, Third Blow, Stunning or Crushing Finisher, Dodge Roll, Shove, Shield Bash) | `ui/talents.js` `SPECIAL` | Innate. The Third Blow comes at weapon discipline 3, and the finisher choice at 6. |
| **Skill bar** | `ui/talents.js` | Ten slots for the active skills the Tree unlocked. |

The page opens on **Tree**, and the tabs are Tree, Skill bar, Disciplines, Basics. Companions see only Tree and Skill bar.

## 2. The change in one line

**Experience → level → Proficiency points (a pool) → you raise the Proficiencies you choose → that raising also earns your Tree points.** Use no longer raises a proficiency by itself; you decide where your growth goes.

## 3. Names

- **Discipline → Proficiency** everywhere the player reads it: the tab, its help line, the level-up and "rose" messages, the loading tips, companion role notes ("grows with their proficiency"), the unit cards, the wiki and the README.
- **Basic(s) → Trait(s)** the same way.
- **Not renamed:** the battle stance called *Discipline* (hold ground, the F key: `battlehud.js`, `input.js`, `data/kits.js`). It's a different thing, a stance and not a skill. I'd keep its name; say if you want it renamed too.
- Code names stay (`SKILLS`, `P.sk`, `SPECIAL`) so saves and tests keep working. Only the words on screen change.

## 4. Progression (the proposal)

All numbers in one tunables table, `PROF` (`data/progression.js`).

### 4.1 The pool
- Each new level gives **`PROF.perLevel` = 3** Proficiency points (`P.pp`). A new hero starts with **`PROF.start` = 3**.
- Points wait in the pool until spent. There is no time limit.

### 4.2 Raising a proficiency
- **One point raises a proficiency one level** (0 to 10, as today).
- **A cap by your level:** no proficiency above **2 + level ÷ 2** (level 1: 2; level 6: 5; level 16: 10). This stops a new hero from putting everything into one proficiency at once, and it keeps a reason to level.
- **A knack** (your race's or past's, today "learns faster") becomes **+1 to that proficiency's cap**. It still shows as "knack" on its row.
- What your past gives today (e.g. a Veteran soldier's One-Handed 2, Leadership 1) stays: you start with those levels, free.
- Tree nodes and gear still add on top (shown green, "+1"), as now. Those don't count against the cap.

### 4.3 Use
- **Use no longer raises proficiencies** for your hero. Today 38 places in the game call `train(...)`: hits landed, battles won, trade, travel and so on.
- **Recommended:** keep those calls, but they give a little **experience** instead, so playing a way still helps you grow overall. Each call gives `PROF.useXp` × its amount, a small share. The player then decides where that growth goes.

### 4.4 The Tree
Today the Tree is paid from levels (one point a level). The owner's line moves level growth into the pool, so the Tree needs a new source. **Recommended:**
- **Every `PROF.treeEvery` = 3 proficiency levels you raise earn one Tree point.** At 3 Proficiency points a level, that is one Tree point a level: the same pace as today, now earned through your choices.
- **The Tree's deeper nodes ask for proficiency in their branch:**
  - **Might:** One-Handed, Two-Handed, Blocking, Unarmed, Engineering.
  - **Finesse:** Archery, Athletics, Riding, Woodcraft, Hunting, Scouting.
  - **Arcana:** Spellcraft, Medicine, Tactics, Survival.
  - **Command:** Leadership, Persuasion, Trade, Stewardship.
- A **notable** needs 3 in its branch's best proficiency, and a **keystone** needs 6. A node that unlocks an **active skill** needs 2 in the proficiency it's built on: Whirlwind in Two-Handed or One-Handed, Rain of Arrows in Archery, Fireball in Spellcraft.
- The node still costs one Tree point. The detail panel shows what a locked node needs ("Needs Spellcraft 3").

### 4.5 Traits
- The Traits tab shows today's Basics (the combo and its upgrades, Dodge Roll, Shove, Shield Bash). The Third Blow still comes at weapon proficiency 3, and the finisher choice at 6, but now you reach those by spending.
- **Proposed addition:** your **race's and past's traits**: the knacks, and what your race gives (an elf's forest pace, a dwarf's hill and frost, and so on). These are now spread across the race screen and tooltips, so the player would see all of them in one place.

## 5. The skill page

Tabs in your order: **Proficiency · Tree · Trait · Skill bar**. It opens on **Proficiency** when you have points to spend, and otherwise on the tab you used last.

- **Header:** "Skills · Level 7 · 4 proficiency points · 1 tree point".
- **Proficiency tab** (rows grouped as on the Army page: Fighting, Command, The road, Trade and rule):
  - **Each row:** name, level / cap (and "+1" from the Tree or gear), what the next level gives, the knack mark, and a **+** button.
  - **A blocked +** says why: "At your cap: level 8 lifts it to 6".
  - **Spending:** a point is spent at once. **Undo** works until you leave the page (a mistake isn't permanent), and there is no respec after that.
  - **Under the list:** "3 more raised → 1 tree point".
- **Tree tab:** as today, with each locked node's need. Points come from the Proficiency tab.
- **Trait tab:** as in §4.5.
- **Skill bar tab:** as today.
- **Frame rule:** header, choices only, the bottom bar from `nav()` (Back to Army on the left, Back to map on the right), Esc follows the bar.
- **Phone in landscape (844×390):** the rows and **+** buttons stay at least 40 px tall to tap.
- **On the map:** the level-up toast reads "Level 7: +3 proficiency points". The Army button shows a dot while points wait.

## 6. Companions, lords, chieftains

- The same system as your hero: a companion has its own pool, cap and Tree points, and its Skills window shows the same four tabs. Today it has no Disciplines tab.
- Lords and chieftains (AI-owned) spend their own points at once, by their class, as they spend Tree points today (`autoTree` → `autoProf`).
- Troops are not affected. Their tiers and ranks stay as they are.

## 7. Saves and old games

No migration, as the house rule says. On load:
- **New fields default:** `P.pp` = 0, `P.ppSpent` = 0.
- **Proficiency levels** are kept as they are.
- **Unspent Tree points** are kept.
- **Old characters:** an old hero keeps his Tree. His next level starts giving points the new way.

## 8. What changes in code (estimate)

| Change | Files |
|---|---|
| Renames on screen | `ui/talents.js`, `companionpage.js`, `unitcard.js`, `loading.js`, `character.js`, wiki, README |
| `PROF` table; `Character#levelled` gives points; `#raise(k)`, `#capOf(k)`, Tree points from raising; `train` → experience | `data/progression.js`, `world/characters.js`, `core/state.js` |
| Tree needs (by branch and kind) | `data/tree.js`, `core/talents.js` (`canTake`) |
| The page: tab order, Proficiency rows, Trait tab | `ui/talents.js`, `style.css` |
| AI spending (`autoProf`) | `world/characters.js`, lords, chieftains |
| Saves (defaults) | `core/saves.js` |
| Tests: a new `proficiency` suite (points per level, the cap, knack, Tree points from raising, Tree needs, Undo, companions, AI, save round trip); updated tests that expect use to raise a discipline or a level to give a Tree point | `tests/` |
| Fingerprints: W7 / B2 (the save holds new fields) and W8 if lords spend differently. Re-recorded with reasons and the proof `PROF.on = false` (today's rules) | `tests/worldprint.js` |

Behind `PROF.on`: off gives today's rules exactly.

## 9. Questions for the owner

1. **Tree points:** is "every 3 proficiency levels raised gives 1 Tree point" right (§4.4)? The alternatives are Tree points from levels as today (only proficiencies change), or no Tree points at all, with Tree nodes unlocked only by proficiency levels.
2. **Use:** should using a proficiency still help? The recommendation is a little experience into your level (§4.3). The alternatives are no effect, or use as a discount on raising that proficiency.
3. **The cap:** is 2 + level ÷ 2 (10 at level 16) right, or should there be no cap?
4. **Points per level:** 3 a level, and 3 to start?
5. **Trait tab:** show race and past traits there too, or only the innate moves?
6. **The battle stance "Discipline":** keep its name?
7. **Companions:** the same system, so they gain the Proficiency tab?
