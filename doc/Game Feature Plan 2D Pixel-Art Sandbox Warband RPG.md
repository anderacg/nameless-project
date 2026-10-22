# Game Feature Plan: 2D Pixel-Art Sandbox Warband RPG

Oct 10, 2026 · @Adisorn · updated Oct 15, 2026 · status tags checked against the code Oct 19, 2026

This is the game's design vision. It records what the game is meant to be and how far each feature has come. Two companion documents cover the rest:
- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md):** the work order.
- **[KNOWLEDGE_TRANSFER.md](KNOWLEDGE_TRANSFER.md):** how the code works.

**Status tags:** **[Built]** works in the prototype · **[Partly]** some of it works · **[Not yet]** designed but not started.

## Design pillars

Four pillars decide what makes the cut: a player's rise, their army, a world that moves without them, and combat that stays readable in pixel art.

1. **Rise from nobody to ruler.** You start as a lone wanderer and can end up founding a kingdom.
2. **Your army is your character.** Recruiting, training, and supplying troops matters as much as your own stats.
3. **A living world that doesn't wait for you.** Factions wage war, trade, and collapse whether or not you take part.
4. **Skill-based, readable combat.** Fights are short, tactical, and legible in pixel art. Since Oct 13, "skill" means command skill: battles are fought Total War-style.

## Core loop

The game cycles through four stages, and each pass runs at a larger scale than the last.

&#91;embedded content: core loop · 4 stages, repeating\]

Each encounter pays out loot, renown, and XP; management turns that into stronger troops and a harder choice of next fight.

## Decisions made

These were the open questions on Oct 10. All are now settled.

| Question | Decision |
| --- | --- |
| Which engine? | **Plain HTML5 canvas and JavaScript**, with no build step. It runs by opening `Ashmark.html` from disk. It is not Godot. |
| Top-down or side-view battles? | **Top-down, real-time strategy**, in the style of Total War: you command groups and your hero is one of them. |
| Historical or fantasy setting? | **Fantasy:** four races (human, dwarf, elf, orc), five realms, magic, monsters and a roaming dragon. |
| Platforms | **Desktop and mobile (landscape)**, played full-screen in the browser. |

## Feature breakdown

Nine systems make up the game; combat is the one that had to be right first.

### A. Overworld

- **[Built]** Top-down tile map with party sprites moving in real time (pause and 1×/2×/4×/8× speed, f08c720).
- **[Partly]** A seeded world generator with size presets ([WORLD_DESIGN.md](WORLD_DESIGN.md)): terrain, rivers, holdings and roads built behind `WORLD.gen` (2ed6578); the full map, the classic seed and the switch-over are to come.
- **[Built]** Terrain affects speed and vision: forest, hills, snow, desert, swamp, rivers, roads.
- **[Built]** Towns, cities, castles, villages, bandit camps and hideouts, caves, ruins, shrines, and roaming armies and monsters. Holdings are placed buildings on a grid and grow over time.
- **[Partly]** Day/night with a food and morale clock for your party. **[Not yet]** Seasons.
- **[Built]** Fog of war, with scouting range set by the Scouting skill. Scouting also reads situations before you act (Insight, 980033f).
- **[Built]** Life on the map:
  - workers carry their estate's goods to town each afternoon;
  - herds graze on pastures;
  - wild game flees and can be hunted;
  - caravans, patrols, refugees and ships move about;
  - holdings defend their land (a day and a night watch), monsters keep to the wilds and fight bands (e5bca02, d24621e);
  - **[Built]** encounters on the road: small scenes on the map you can ride to or pass by (ENCOUNTERS_DESIGN.md; 17224a0, 8f1c621, 937ca04).

### B. Character and progression

- **[Built]** Attributes (Strength, Agility, Intellect, Charisma) plus skills that level through use.
- **[Built]** A skill tree with branching choices, special moves, and an ability bar for the hero.
- **[Built]** A background ("past") picked at the start, together with a race. It sets the starting weapon, gold, skills and standing.

### C. Party and troop management

- **[Built]** Party size is capped by level, renown, Leadership and Charisma.
- **[Built]** Troop trees by race, with tiers and specialist branches. Troops gain experience in battle and train up at a barracks.
- **[Partly]** Upkeep wages and morale are built. **[Not yet]** Desertion when you're broke or keep losing.
- **[Built]** Prisoners can be ransomed, recruited or released. Captured lords and bandit chieftains can be ransomed, handed over or recruited.
- **[Partly]** Companions are named characters who grow as you do. They have approval and roles (scout, surgeon), lead their own parties, and use the full skill tree.
  - **[Not yet]** Personal story quests and conflicts between companions.
  - **[Not yet]** Companions as caravan leaders or governors.

### D. Combat

Battles are real-time and top-down, in Total War style.

- **[Built]** RTS command:
  - select groups (hero, infantry, archers, mages, cavalry);
  - move in formation, drag a line for width and facing;
  - orders: hold, walk/run, charge, withdraw, hold ground, cease fire, skirmish, melee mode;
  - control groups and tactical pause.
- **[Built]** Formations: line, shield wall, loose, wedge.
- **[Built]** Flanking, charges with momentum and knockback, and morale with routing and rallying.
- **[Built]** Damage types (physical: slash, pierce, blunt; magical: fire, frost, arcane) against armour classes (unarmoured, leather, mail, plate, hide/scales).
- **[Built]** Shooters fire in a forward arc with draw, loose and reload. Ammunition is limited.
- **[Built]** Stamina limits running and weakens tired fighters.
- **[Built]** A commander AI that uses the same orders as the player, with focus fire, kiting, hunting and covering shooters. An "AI command" switch lets it lead your side, and "Auto skills" lets your characters use theirs.
- **[Built]** A deployment phase, camera zoom and pan, a minimap, and battle speeds 0.5× to 5×.
- **[Built]** Battle results carry over: casualties, band morale, and the cost of a retreat.
- **[Changed]** "Player control of one unit while commanding the rest" was set aside on Oct 13. The manual hero controls (combos, dodge, block, bow) are kept in the code behind a switch in case they return.
- **[Not yet]** Directional melee (swing angles, blocking by matching direction).
- **[Built]** Auto-resolve, sieges and village raids, and tournaments.
- **[Built]** Terrain that matters (hills, woods, marsh, rivers, cliffs, mountains), fog of war, battle types (Hold the bridge, Ambush), unit abilities, commander powers and unit physics ([TERRAIN_DESIGN.md](TERRAIN_DESIGN.md); e527d86, 3f24f1d, b81c21f, da78db0).

### E. Economy and trade

- **[Built]** Local supply and demand. Prices vary by town and shift with war, shortages, caravans and estates' output.
- **[Partly]** Holdings run estates: farms, pastures, lumber camps, mines, quarries, ports and workshops. **[Not yet]** Production chains (grain → flour, ore → weapons).
- **[Built]** Buy cheap and sell dear, run your own caravans, and own fiefs that pay taxes.
- **[Not yet]** Gear crafting and smithing as a late-game gold sink. Gear can be bought at smiths today.

### F. Factions, politics, and the world sim

- **[Built]** Five realms: four single-race kingdoms and a mixed league, each with its own troop trees.
- **[Partly]** Lords have levels, skills, friendships and standing toward you. **[Not yet]** Personal traits and grudges.
- **[Built]** Wars, peace and the capture of fiefs come from the simulation. Realms build, fortify and run treasuries.
- **[Built]** Reputation with holdings and honour with realms. Helping or harming them changes recruits, prices and quests.
- **[Partly]** Endgame paths:
  - **[Built]** serving a realm and earning fiefs;
  - **[Built]** mercenary contracts;
  - **[Not yet]** founding your own kingdom (laws, vassals, diplomacy).

### G. Quests and content

- **[Built]** Contracts from holdings and lords: bounty, beast hunt, lair clearing, supply run, hunting, courier, reinforcements, war and raid.
- **[Not yet]** Escort, rescue and defend contracts. Escort is planned in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) §10.7, which owns it; defend a caravan as a battle type in §4.5.
- **[Not yet]** Authored story arcs per companion and faction story chains.
- **[Built]** Random events on the road: the people in them are now encounters on the map (wounded travellers, merchants, deserters, refugees, a sealed letter to rob…); weather and sickness stay instant events. **[Built]** Ambush events (e527d86; on the map, 17224a0).
- **[Not yet]** A late-game main threat (invasion or civil war). The dragon is a roaming danger, but not a story climax yet.

### H. UI and presentation

- **[Built]** Pixel art drawn by code with muted, hue-shifted palettes:
  - people are 16×16 template figures with race and troop variety;
  - animals and buildings are drawn to scale in power-of-two boxes (8, 16, 32, 64).
- **[Built]** A paper-doll equipment screen.
- **[Built]** A full-screen interface that works on phones:
  - an Arial-first interface font;
  - every window has the same layout, with navigation (Back, close) in a bottom bar;
  - a Total War-style battle HUD.
- **[Partly]** Walkable town streets. Other interiors are planned (castle, cave, ruins, mine, dragon lair).
- **[Built]** Music and sound in the game: generative music and synthesised effects (4796112; `core/music.js`, `core/audio.js`).

### I. Technical

- **[Changed]** Data lives in `js/data/` tables, not JSON. Browsers block reading JSON files from disk, so moving to JSON is deferred until there's a way to load it.
- **[Built]** Save slots, quick save (F6) and autosave.
- **[Built]** About 170 automated browser test suites (and some 40 report-only `tests/visual/` suites) cover every system.
- **[Partly]** The world simulation runs every frame on a daily tick. The world it runs on is generated from a seed by default (today's hand-made map behind `?gen=0`); play itself is not deterministic.

## Status

The original roadmap planned five phases over 10 to 14 months, starting from a combat prototype. The prototype has moved past it:
- All the MVP must-haves are built.
- So are several items once marked "cut if needed": sieges, tournaments, companions, quests and captives.

What remains (the bigger seeded world, travel supplies, the backlog above, a real-phone check and polish) is ordered in **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** ("Priorities").

## Scope control

The MVP was travel, recruitment, real-time battles, trading, and a small war between factions.

**MVP must-haves (all built)**

- Overworld travel
- Party and recruitment
- Real-time battles with formations
- Towns with trading
- Factions at war (five)
- Save/load

**Still cut or delayed**

- Kingdom founding
- Crafting
- Seasons
- Multiplayer

## Key risks

- **Battle AI and performance** with 50+ units. The AI part is largely answered: the commander AI is built. Performance with very large armies hasn't been measured yet; `Ashmark.html?test=visual/perf` gives rough timings.
- **World sim balance.** Factions can snowball or stall. The `worldsim` test reports five 120-day campaigns to check this.
- **Content volume.** Procedural quests, events and troop trees keep hand-authoring down. Story arcs are still to come.
- **Scope creep.** Keep a strict feature-freeze date before polish.
- **New: mobile.** Touch controls for battle and map are built (pinch zoom, long-press orders, 39c4785); a check on a real phone is still to do.
