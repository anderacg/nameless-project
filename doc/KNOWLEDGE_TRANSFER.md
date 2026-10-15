# Ashmark — Knowledge Transfer

This is a handover for whoever continues work on the Ashmark prototype. It explains:
- how the project is built and run;
- how each major system works;
- the design rules the project owner has set;
- the habits that keep work safe.

It reflects the state on **2026-10-15**. The plan for what comes next is in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

The original vision is in [Game Feature Plan 2D Pixel-Art Sandbox Warband RPG.md](Game%20Feature%20Plan%202D%20Pixel-Art%20Sandbox%20Warband%20RPG.md). The code-level layout rules are in [prototype/README.md](../prototype/README.md). Read both.

---

## 1. What the game is

Ashmark is a 2D pixel-art warband RPG in the spirit of *Mount & Blade: Bannerlord*, with *Total War*-style battles. It runs in the browser.
- **World map:** you travel, trade, recruit, take quests, deal with lords and realms, and own fiefs. Holdings grow as placed buildings on a tile grid.
- **Battles:** real-time strategy. You command groups of soldiers; your hero is one of the groups. Battles use formations, morale, fatigue, ammunition, damage types and armour.
- **Platform:** desktop and mobile (landscape). The page fills the screen.

---

## 2. Repository and running it

```
F:/Game Project/
  Nameless/
    doc/                 design docs (this file, the plan, the feature plan, references/)
    engine/              PX engine: procedural pixel-art generators for buildings and sites (pixel.js, buildings.js, pieces.js)
                         gallery.html previews them; *-preview.html are art experiments kept for reference
    prototype/           THE GAME (its own git repo)
      Ashmark.html       open this: no build step, works from file://
      wiki.html          in-game reference, built from the live data tables
      style.css          the whole interface stylesheet
      js/                about 10,500 dense lines, plain <script> files (not modules)
      tests/             about 63 headless test suites + run-tests.sh + harness.js
      archive/ audio/    old single-file version; sounds
```

- **Run:** double-click `prototype/Ashmark.html`, or open it in Chrome or Edge. There is no server, bundler or npm.
- **Git:** the repo is `Nameless/prototype`. The last commit is `b141f8a`, and a large amount of work since then is uncommitted. **Commit only when the owner asks.**
- **Environment used so far:**
  - Windows 11, Git Bash for shell scripts, Python 3 for scripted edits.
  - Headless Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`) for tests and screenshots.
  - Node.js is **not** installed.

### Script architecture rules (also in the README, checked by `tests/structure.js`)
- **One name, one place.** Every top-level `const` and `function` is global across all files, so a duplicate silently replaces the first.
- **Load order is the `<script>` order in `Ashmark.html`:** core → data → systems (world, battle, scene, gfx, ui) → `main.js`. `wiki.html` loads the same list, minus `input.js` and `main.js`; keep the two in step.
- **Data, not special cases.** Tunables and "kinds of things" live in `js/data/`.
- **Actions:** every button has `data-act="prefix-name"`. A system claims its prefix once with `onAct('cv-', fn)`, and a second claim throws. Unclaimed actions fall through to `ui/input.js`.
- **Saves are plain JSON.** Behaviour comes from classes that are put back on load: `holdingOf`, `siteOf`, `asParty`, `troopOf`, `charOf`.

---

## 3. Tests and visual checks

```bash
cd "F:/Game Project/Nameless/prototype"
bash tests/run-tests.sh              # everything, about 8-10 minutes
bash tests/run-tests.sh rts menu     # chosen suites
```

- **How a run works:** each suite opens `Ashmark.html?test=<suite>` in headless Chrome. The harness exposes every global through `T` (a proxy: `t.updateBattle(...)`, `t.P`, `t.G`...). Lines starting with `FAIL`, `EXC` or `ERR` fail the run.
- **Last full run (2026-10-15): 1850 pass, 2 fail.** Both failures were in one siege raid test that then passed five times running alone.
- **Known intermittent tests** (random world state):
  - siege "village lords ride to stop your raid", and the walk-away check after it;
  - biomes "trees stop about a quarter of arrows";
  - patrols "in the grace after a fight…".

  Rerun a suite alone before assuming you broke something.
- **Tests use a fixed view.** With `?test=` and no `?v=`, `FIXED_VIEW` in `core.js` keeps the old fixed 576×360 view and a 960-wide battlefield, so the tests' positions and sums stay put. Add `&v=...` to see the real full-screen layout.
- **Screenshots** are how UI and art changes get checked:
  1. Write a temporary suite (`tests/zz_<name>.js`) that sets up a scene in `window.RUN` (start a game, open a window, start a battle).
  2. Screenshot it:
     ```bash
     chrome --headless=new --disable-gpu --allow-file-access-from-files --hide-scrollbars \
       --user-data-dir="$(mktemp -d)" --virtual-time-budget=8000 --window-size=1600,900 \
       --screenshot=out.png "file:///F:/Game Project/Nameless/prototype/Ashmark.html?test=zz_name&v=town"
     ```
  3. Always check **1600×900 (desktop)** and **844×390 (phone landscape)**.
  4. **Delete `tests/zz_*.js` afterwards.** The full runner would pick them up.
  5. For sprites, draw a lineup onto an overlay canvas at 4–8× so the pixels can be judged.

---

## 4. Working conventions (how the owner likes to work)

- **Step by step, with check-ins.** Build one agreed step, show screenshots and test results, then continue. Big features are agreed as a numbered plan first.
- **Report honestly.** Give pass and fail counts, and name flaky tests as flaky.
- **Commit only when asked.**
- **Don't start deferred work unprompted** (see the plan's "Deferred" section).
- **Comment style:** short prose comments explaining *why*, often as `// (...)` at line ends. The code is dense: single-line functions and short names, so match the surrounding style.
- **⚠ Mid-line comment trap:** a `//` comment followed by more code on the same line silently comments out that code. This bit the project many times (a missing `const C`, lost click handlers). **Use `/* … */` for any comment that has code after it on the same line.** After an edit, scan for `;// (` followed by code.
- **Editing approach:** dense lines are best edited by exact-string replacement, with a Python script that asserts each pattern matches exactly once. Keep patches in a scratch folder, not the repo.
- **Memory:** a running record of the owner's decisions exists in the assistant's memory folder. The important ones are restated in sections 6–9 below.

---

## 5. Code map (where things live)

| Area | Files | Notes |
|---|---|---|
| Core | `js/core/core.js` | Canvas, view size (`VW/VH`, `fitScreen`), battlefield (`BW/BH`, `BVW/BVH`), helpers, `onAct` |
| State | `js/core/state.js`, `save.js` | `G` (game state), `P` (player band), `W` (world lists); save slots in localStorage |
| Data | `js/data/*.js` | Races, factions, units (`ST`), monsters, critters, matchups (damage and armour), gear, progression, holdings, places, economy (`ESTATES`, `JOBS`), conduct, scenes, abilities |
| World | `js/world/*.js` | `map.js` (terrain, `routeTo` pathfinding), `parties.js` / `brains.js` (all parties), `realms.js`, `siege.js`, `lots.js` (placed buildings), `estates.js`, `folk.js` (workers), `critters.js` (animals), `sites.js`, `caravans.js`, `characters.js` (Unit/Troop/Character), `world.js` (tick, clicks) |
| Battle | `js/battle/*.js` | `battle.js` (units, `aiUnit`, shooting), `battlecontrol.js` (**BattleControl**), `commander.js` (AI), `formations.js`, `morale.js`, `fatigue.js`, `camera.js`, `deploy.js`, `encounters.js` (outcomes), `abilities.js`, `combat.js` (manual hero, set aside) |
| Graphics | `js/gfx/*.js` | `people.js` (**all people sprites**), `sprites.js` (cells, map sprites), `render.js` (world and battle drawing), `structures.js` (buildings), `worldart.js` (terrain), `vfx.js`, `weapons.js` |
| UI | `js/ui/*.js`, `style.css` | `ui.js` (`showPanel`, **`nav()`**, title, Esc menu), `character.js`, `town.js`, `inventory.js`, `talents.js`, `battlehud.js`, `unitcard.js`, `input.js` |
| Scenes | `js/scene/*.js` | Walkable town interiors |
| Engine | `../engine/*.js` | `PX` namespace: building and site generators |

---

## 6. Battle system (the deepest part of the code)

**Model: "who decides".** The owner's rule:
- **Units are actors only.** `aiUnit` in `battle.js` executes; by itself a unit attacks the nearest foe in its reach, in its firing arc first (`shooterTarget`, `meleeTarget`).
- **`BattleControl`** (`battlecontrol.js`) is one object per group in `B.groups[id]`: yours (`hero`, `inf`, `arc`, `mag`, `cav`), the enemy's (`e_*`) and allies' (`a_*`).
  - Every order is a method: `hold`, `moveTo`, `queueTo`, `standAt`, `attack`, `charge`, `advance`, `withdraw`, `setWalk`, `setRun`, `setFlag`, `setForm`.
  - `step(dt)` runs the group's mechanics: waypoints, skirmish backing, and slot swaps for hold ground.
- **All intelligence belongs to the player or the commander AI** (`commander.js`). The player and the AI call the *same* methods.
  - The AI's focus fire, Kite (threat and cover), Hunt (sending shooters out when safe), stop-to-shoot, and targeting of bare shooters are all in `captain()`.
  - The shooters' priority order is Kite > shoot what is in reach > Hunt > March.
  - `commandCharacters` handles heroes' duels and skills; the player's characters use skills only with **Auto skills (K)** on.
- **New group behaviour goes in BattleControl**, never in `aiUnit`.

**Shooting:**
- Units shoot in a forward arc (`SHOOT.arc` π/2). The arc follows the **group's facing**, set by the player or the commander. Units never rotate it themselves; the owner calls auto-rotation "cheating".
- Shots go draw → loose → reload. Only units with the `mobile` trait shoot on the move.
- Ammunition is limited (`AMMO`) and shown on the unit cards.

**Melee Mode (X):** shooters put their bows away, stop shooting and fight with their (low) melee damage (`meleeDmgOf`). It is off by default.

**Skirmish (E):** keep distance by backing off in bursts, with checks for being cornered or outpaced.

**Damage and armour** (`data/matchups.js`):
- Physical damage (slash, pierce, blunt) against armour classes (Unarmoured, Leather, Mail, Plate, Hide/scales).
- Magical damage (fire, frost, arcane) against ward and resistance.
- Each unit has its own Morale stat (`unitMoraleOf`).

**Morale and fatigue** (`morale.js`, `fatigue.js`):
- Flanks, charges with knockback, routing and rallying.
- A unit at 0 stamina cannot run.

**After a battle:**
- Battles keep simulating for `END_WAIT` (2 s) before the summary.
- Casualties and morale carry over to the world map (`battleMood`).
- A successful retreat costs morale and renown.

**Camera:**
- The battlefield is 600 high and as wide as the screen's shape (960–1300, `FIELD_W`).
- The camera "fit" zoom shows the whole field (`camFit`); turning a phone keeps it whole (`c.fit`).

**Manual hero control** (`combat.js`, `MANUAL_HERO=false`) is kept, not deleted, because the owner may bring it back.

---

## 7. World systems

- **Parties** (`parties.js`, `brains.js`):
  - Lords, bands, patrols, companions' parties and your band all keep soldiers as counts.
  - Each kind has a Brain; `updateParties` runs them all.
  - On the map a party's host shows full-size followers of its race (`drawHost`, `followerSprite`).
- **Holdings** (`data/holdings.js`): the type registry `HOLDING_TYPES` plus classes. Never check `t.kind==='…'`.
- **Placed buildings** (`lots.js`): an occupancy grid with power-of-two footprints. Realms grow their holdings, and in your fiefs you place what you build.
- **Estates and fields** (`estates.js`):
  - `fieldsOf(t,k)` returns an estate's worked field tiles and their middle; `onFields` and `fieldSpot` are helpers.
  - Clicking an estate opens `estateMeet`. It offers **Buy livestock** (pasture), **Talk to the <workers>**, sabotage, plunder and burn.
- **Workers** (`folk.js`) follow a daily routine:
  - They work **inside** their estate's building, unseen (`st:'in'`).
  - Once a day, at a random hour between afternoon and dusk (`DELIVER`), each carries a load to the holding's gate (`'out'`), stops inside briefly (`'town'`), walks back (`'back'`) and goes in again.
  - Workers inside are met through the estate. One on the road can be clicked.
  - A scare sends anyone on the road back in.
- **Animals** (`critters.js`):
  - Wild game flees and is hunted. A fleeing animal faces the way it moves, and its home range moves with it, so it doesn't spin back toward you.
  - A **pasture's herd is decoration only** (`decor:true`): one *small* animal per field tile (`BEASTS_SMALL`). Its trade is the pasture's "Buy livestock".
  - Village herds without a pasture are still met by walking into them.

---

## 8. Graphics rules (set by the owner)

- **Power-of-two boxes:** every sprite sits in an 8, 16, 32 or 64 square cell (`cellOf`, `CELLS`), feet on the bottom row. The drawn pixels may be smaller than the box: a 4×6 critter in an 8 box is fine.
- **Realistic proportions between figures:**
  - A person is about 15 px tall.
  - A cow is body-long and about shoulder-high in a 32 box; a sheep or pig is waist-high in a 16 box; a hen or rabbit is about 6×6 in an 8 box.
  - The battle horse (`MOUNT_T`) is the scale reference.
- **People template** (`people.js`):
  - A 10×15 figure in a 16 cell, with hue-shifted 4-tone ramps, light from the top-left, and a dark navy outline `#1a1c26`. The head is small and colours are muted.
  - Races are parameters (dwarf short and bearded, elf ears, orc green with tusks).
  - `mapPerson` builds all world-map people: followers, workers with tools (hoe, crook, axe, pick, rod, hammer) and loads (`LOADS`), and refugees.
- **Animals:** `critterSprite(id, f, small)` builds four-legged animals from `BEASTS` and small ones from `SMALL_BEASTS` pixel templates. There are two walk frames.
- **Buildings:** use the PX engine (`../engine`): medieval look, one building per 16 px tile, consistent depth. Show the owner a gallery before integrating new art.
- **Fonts:** the interface uses Arial first. The pixel font Silkscreen is used only for words drawn on the canvas map.

---

## 9. UI rules (set by the owner)

- **Full screen:** the canvas fills the window at a whole-number pixel scale (`fitScreen`). A bigger window shows more map.
- **Mobile is a target.** Layouts must work at 844×390:
  - compact HUD at max-height 600 or max-width 820;
  - 44 px touch targets on coarse pointers;
  - windows go full-screen at 720 px wide or 520 px high and below.
- **`style.css`** is organized in 9 sections (tokens → base → primitives → windows → menus → world HUD → battle HUD → screens → responsive). Use the tokens in section 1.
- **Every window has the same frame:**
  - **Header:** title and context, with tabs directly under it.
  - **Content:** only game information and choices. All game actions go here.
  - **Bottom bar:** navigation only, built with **`nav(back, close)`** in `ui.js`. Back sits on the left, shown only when the window was opened from another one. The way out sits on the right as the primary button, named for where it goes ("Leave city", "Back to map", "Continue").
  - `nav(...)` must be the **last** thing in the window's HTML, or it won't pin to the bottom.
  - **Esc** presses Back, else the way out. A way out that costs something gets `noEsc` (the 5th element): the loot screen's "leave N behind".
  - Forced choices (a fight, a parley) have no bar.
- **Sub-pages** remember where they came from and pass Back, as `openHerd(c, from)` and `workerMeet(f, from)` do.
- **Name buttons by action:** "Buy livestock", not "The herders · 3 sheep".
- **Main menu:** no Resume. The pause menu (Esc) is where you resume.

---

## 10. Glossary

| Term | Meaning |
|---|---|
| `G` / `P` / `W` / `B` | Game state / player band / world lists / current battle |
| `ST` | Troop stats table (`js/data/units.js`) |
| Group | A battle group with a `BattleControl` (`B.groups`) |
| Captain | The commander AI for one side (`commander.js captain`) |
| Holding | A village, town, city or castle |
| Estate | Farm, pasture, lumber camp, mine, quarry, port… (`ESTATES`) |
| Lot | A placed building on the grid (`lots.js`) |
| Cell | A sprite's power-of-two square (`cellOf`) |
| `nav()` | A window's bottom bar |
| `FIXED_VIEW` | The tests' fixed 576×360 view |
