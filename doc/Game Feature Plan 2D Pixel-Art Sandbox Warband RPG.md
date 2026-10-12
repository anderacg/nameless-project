# Game Feature Plan: 2D Pixel-Art Sandbox Warband RPG

Oct 10, 2026 · @Adisorn

## Design pillars

Four pillars decide what makes the cut: a player's rise, their army, a world that moves without them, and combat that stays readable in pixel art.

1. **Rise from nobody to ruler.** You start as a lone wanderer and can end up founding a kingdom.
2. **Your army is your character.** Recruiting, training, and supplying troops matters as much as your own stats.
3. **A living world that doesn't wait for you.** Factions wage war, trade, and collapse whether or not you take part.
4. **Skill-based, readable combat.** Fights are short, tactical, and legible in pixel art.

## Core loop

The game cycles through four stages, and each pass runs at a larger scale than the last.

&#91;embedded content: core loop · 4 stages, repeating\]

Each encounter pays out loot, renown, and XP; management turns that into stronger troops and a harder choice of next fight.

## Feature breakdown

Nine systems make up the game; combat is the one that must be right first.

### A. Overworld

- Top-down tile map with party sprites moving in real time (pause and speed controls).
- Terrain affects speed and vision (forest, hills, snow, desert, rivers).
- Towns, castles, villages, bandit camps, and roaming armies as map nodes.
- Day/night and seasons, with a food and morale clock for your party.
- Fog of war, with scouting range set by a Scouting skill.

### B. Character and progression

- Attributes (Strength, Agility, Intellect, Charisma) plus skills (One-Handed, Archery, Riding, Leadership, Trade, Tactics, Medicine, and so on).
- Skills level through use, as in Mount & Blade.
- Perks every few levels that give meaningful branching choices.
- Background picked at the start (merchant's child, exile, soldier, noble, outlaw) that changes starting skills and relationships.

### C. Party and troop management

- Party size is capped by Leadership and renown.
- **Troop trees:** each recruit starts at Tier 1 and branches by culture into specialist paths (for example, Militia → Spearman → Pikeman or Shield Guard).
- Upkeep wages, morale, and desertion when you're broke or keep losing.
- Prisoners can be ransomed, recruited, or released.
- Companions: unique named NPCs with personalities, quests, and conflicts with each other. They can be assigned as caravan leaders, governors, or scouts.

### D. Combat

Real-time top-down battles are the recommended style for the prototype.

| Style | Pros | Cons |
| --- | --- | --- |
| **Real-time top-down battles** (recommended) | Closest to M&B, supports formations and flanking | Needs good AI and camera tuning |
| **Side-view brawler** | Great pixel-art animation, easy to read | Weak fit for large armies |
| **Tactical grid** | Simple AI, deep strategy | Loses the M&B feel |

- Directional melee (swing from 4 angles, block by matching direction), ranged weapons, and mounted charges with momentum.
- Formations and orders for infantry, archers, and cavalry (hold, advance, charge, follow, spread out).
- Player control of one unit while commanding the rest.
- Auto-resolve option for small fights.
- Sieges: ladders, rams, towers, walls, and gate defense.
- Tournaments for easy early money and renown.

### E. Economy and trade

- Local supply and demand, so prices vary by town and shift with events like war, famine, and caravans.
- Production chains (grain → flour, ore → weapons).
- Buy cheap and sell dear, or own workshops and caravans for passive income.
- Gear crafting and smithing as a late-game gold sink.

### F. Factions, politics, and the world sim

- 4 to 6 factions with distinct cultures, troop trees, and goals.
- Lords with traits, grudges, and loyalty to the king.
- Wars, truces, and alliances driven by simulation, with fief ownership changing hands.
- Relations system: help villages, fight their enemies, and they offer recruits and quests.
- Player endgame options: serve a king and earn a fief, become a mercenary, or **found your own kingdom** (laws, vassals, diplomacy).

### G. Quests and content

- Procedural contracts: escort, bounty, delivery, raid, rescue, and defend.
- Authored story arcs per companion and a few faction chains.
- Random events on the road (merchants, refugees, plague, ambush).
- Optional main threat in the late game (invasion or civil war) to give long runs a climax.

### H. UI and presentation

- Pixel-art style with a limited palette (16 to 32 colors) and 16×16 or 32×32 sprites.
- Layered paper-doll equipment so every item visibly changes the character.
- Clean menus for party, inventory, kingdom, and a world map overview.
- Chiptune or lo-fi medieval soundtrack with distinct battle and map themes.

### I. Technical

- Engine options: **Godot 4** (recommended for 2D and pixel art), Unity, or GameMaker.
- Data-driven design: troops, items, and events defined in JSON or resources.
- Save-anywhere and autosave.
- Deterministic simulation tick for the world, so it can run efficiently in the background.

## Roadmap

Five phases take the game from pitch to release in roughly 10 to 14 months.

| Phase | Duration | Goal | Deliverables |
| --- | --- | --- | --- |
| **0. Pre-production** | 2–4 weeks | Prove the fun | One-page pitch, art style tests, combat prototype (1v1 and 10v10) |
| **1. Vertical slice** | 2–3 months | One playable loop | Small map with 3 towns, recruit → fight → loot → upgrade, 5 troop types |
| **2. Core systems** | 3–4 months | Sandbox foundation | Economy, factions at war, full troop trees, sieges, save/load |
| **3. Content** | 3 months | Depth | Companions, quests, events, kingdom founding, balance pass |
| **4. Polish and release** | 2–3 months | Ship it | Audio, tutorial, UI polish, playtesting, bug fixing |

## Scope control

The MVP is travel, recruitment, real-time battles, trading, and a small war between factions; everything else can slip.

**MVP must-haves**

- Overworld travel
- Party and recruitment
- Real-time battles with formations
- Towns with trading
- 2 to 3 factions at war
- Save/load

**Cut or delay if needed**

- Sieges
- Kingdom founding
- Crafting
- Seasons
- Multiplayer

## Key risks

Battle AI is the biggest unknown, so it gets prototyped first.

- **Battle AI and performance** with 50+ units. Prototype this first.
- **World sim balance.** Factions can snowball or stall, so build debug tools to fast-forward and inspect.
- **Content volume.** Procedural quests and modular troop trees reduce hand-authoring.
- **Scope creep.** Keep a strict feature-freeze date before polish.

## Open questions

Three choices would shape the plan further.

- [ ] Which engine, and how large is the team?
- [ ] Should battles be top-down or side-view?
- [ ] Historical or fantasy setting?
