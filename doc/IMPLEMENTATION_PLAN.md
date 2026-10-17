# Ashmark — Implementation Plan

This is the work queue as of **2026-10-15**, in priority order. For how the code works and the owner's rules, read [KNOWLEDGE_TRANSFER.md](KNOWLEDGE_TRANSFER.md) first.

**How to use this plan**
- Take items in order unless the owner picks another.
- Agree a numbered set of steps with the owner before building a big item.
- After each step, show screenshots (1600×900 and 844×390) and test results, then check in.
- Items under **Deferred** are not to be started until the owner asks.

---

## 0. Housekeeping (do first)

| # | Task | Done when |
|---|---|---|
| 0.1 | **Commit the uncommitted work**, but only once the owner approves. About 95 files have changed since `b141f8a`: the battle AI and BattleControl, damage and armour, morale carry-over, the full-screen UI, the window frame, the map sprites, the estate workers' routine and the decorative pasture. | One or more commits with clear messages |
| 0.2 | **Refresh `prototype/README.md`.** `leaders.js` now holds only the bandit chieftains; every leader grows through `Character` in `characters.js`. Describe the battle files (`battlecontrol.js`, `commander.js`, `formations.js`, `morale.js`, `fatigue.js`, `camera.js`, `deploy.js`). Add `nav()`, `FIXED_VIEW`, the worker routine and the decorative herds. | The README matches the code; `tests/structure.js` passes |
| 0.3 | **Update `wiki.html` text** for the new rules: worker deliveries, Buy livestock at pastures, Melee Mode, Kite/Hunt, ammunition, armour classes. | The wiki pages read correctly |
| 0.4 | **Steady the flaky tests:** siege raid (`tests/siege.js` around line 79), biomes arrows, patrols grace. Seed or fix the random parts the assertions depend on. | 5 full runs in a row with 0 failures |

---

## 1. Finish mobile play

**Goal:** the game is fully playable by touch on a phone held sideways (844×390 CSS px).

1. **Battle camera by touch:** pinch to zoom, two-finger drag to pan (`camera.js`: `camZoom`, `camPan`). Keep one finger for selecting.
2. **Orders without a right-click:**
   - Today a tap selects and a second tap sends (`input.js` pointerdown).
   - Add a long-press on the ground to move, a long-press on an enemy to attack, and a drag after a long-press to lay out a line (`formDragTo`).
3. **The world map:** a tap travels already. Add a tap-and-hold "what is this" card, because touch has no hover tooltips.
4. **Install-to-home-screen polish:** a manifest and icon so it opens full-screen.
5. **Test on a real phone** (Android Chrome and iOS Safari), including safe areas (notch) and rotation mid-battle.

**Done when** a full loop works by touch only: start a game, travel, trade, fight a battle with formations, and save.

---

## 2. Remaining sprite upgrades (follow the box and proportion rules)

| # | Task | Notes |
|---|---|---|
| 2.1 | ~~**The lord's map horse**~~ **Done 2026-10-17** | The battle horse (`drawMount`) in a 32×32 cell, rider seated with his banner (`people.js` `mapFigure`). |
| 2.2 | ~~**The caravan**~~ **Done 2026-10-17** | A covered two-wheeled cart, an ox with a yoke and a drover, in a 64×64 cell; the cover takes the faction colour (`caravans.js` `caravanSprite`). |
| 2.3 | **Village herds without a pasture** | Consider showing them as small animals too, for consistency. Ask the owner first. |
| 2.4 | ~~**Ships and refugees' carts**~~ **Done 2026-10-17** | Fishing boats are rowing boats with a fisherman (32×32); trade ships are cogs with castles, a square sail striped in the owner's colour and crew (64×64, `ships.js` `shipSprite`). Refugees walk as 16-px people (no carts). Moored dock boats match too (`gfx/structures.js` `estateBoats` draws `shipSprite({moored:true})`: empty rowing boats, and a cog with its sail furled at level-3 ports, tied to the pier and wholly afloat); the engine's `PX.boat` is unused. |

Check each one in a sprite lineup at 6–8× and on the map, then get the owner's approval.

---

## 3. Battle follow-ups (small, already discussed)

1. **The AI withdraws a beaten army:** the commander orders `withdraw()` when its side is clearly lost (power ratio, morale), instead of fighting to the last.
2. **Bigger morale hits when a whole group is lost** (a group wiped out or routed), in `morale.js`.
3. **Re-check the battle tests** (`tests/rts.js`); they pass today.
4. **AI tactics** (owner's request, 2026-10-17) — **built 2026-10-17** (`AI_TACTICS`, `CHAR_FALL` in `commander.js`; per-army temperament can come later as a per-captain multiplier):
   - **Ranged units lead:** the AI opens with its shooters to scout and fire first when its range or numbers pay (pushing ahead of its infantry and pulling back when your melee closes in), but plays **safe** (shooters behind the infantry screen) when your cavalry or fast troops threaten them, when it is outnumbered or defending a holding, or when its archers are worn (ammunition, morale). Leave room for per-army temperament (see "Race fighting styles" below).
   - **Charges from further away:** cavalry and shock infantry start their run earlier so they hit at full momentum more often, but **stamina gates each charge** (no long charge when tired: walk closer or wait; a charge already under way drops to a walk if they tire).
   - **Ability use:** captains call `g.useAbility(id)` (Brace against charging cavalry, Rally when wavering, Spur on attack, Fire arrows against armour or beasts).
   - **Characters fall back and reassess** (owner's request): after a defensive roll (badly hurt and surrounded), a character moves away toward its own troops, watches, and goes back in only when it's OK (stamina recovered, the target area no longer a trap or friendly troops already fighting there); your hero resumes your order then. Health isn't a hard gate (it doesn't regenerate in battle).

---

## 4. Battle fun pipeline (pick with the owner; not started)

Recommended order, with what already exists to build on:

1. **Unit-type abilities with cooldowns** on the order bar (spear Brace, archer Volley or Fire arrows, cavalry Charge burst, infantry Rally). Build them on `ST[k].actives` and the ability system (`data/abilities.js`, `battle/abilities.js`). Spears already brace automatically, and monsters have `ability`.
2. **Commander powers for the player** (Rally the line, Hold!, pre-battle Ambush or Scout). These are distinct from the hero's own skills.
3. **Terrain that matters:** hills (range, downhill charge), river and bridge chokepoints, woods that hide and slow cavalry. — **designed** in [TERRAIN_DESIGN.md](TERRAIN_DESIGN.md) (all D1–D10 recommendations accepted 2026-10-17); phase 1 (hills, woods, marsh) in progress.
4. **Juice:** shake and slow motion on a full charge, callouts ("Flanked!", "Routed!"), and a "unit of the battle" in the summary.
5. **Battle types:** ambush (surrounded, no deploy), defend a caravan, hold the bridge, run down a fleeing enemy.
6. ~~**Race fighting styles**~~ **Built 2026-10-17** (`TEMPERAMENT` in `commander.js`: dwarves hold, elves skirmish, orcs frenzy, mixed hunts the wavering; human = base). Beasts get no style yet.
7. **Reinforcements that arrive mid-battle** from the field's edge. Reinforcements exist today but are present from the start.

On hold by the owner's call: a battle scale of one unit ≈ 100 men.

---

## 5. World OOP refactor (continue the agreed order)

Already built: holdings as classes, sites as classes, parties, brains, leaders, captives, and Unit/Troop/Character.

1. ~~**Caravans as a Party**~~ **Done 2026-10-17** (`CaravanParty`; save shape unchanged; not in `W.parties` until the `WorldObject` step).
2. **A `WorldObject` base:** shared pick, tooltip, interact, draw and save for everything on the map.
3. **Estates, buildings and deposits as classes.**
4. **The other movers as classes:** ships, monsters, critters, folk, refugees.
5. **Clean-up:** remove the compatibility views.

Rules: classes for behaviour, plain JSON in saves, check in after each step.

---

**Refactor plan:** see [REFACTOR_PLAN.md](REFACTOR_PLAN.md) (code-structure review 2026-10-17; wave 1 approved, items 9–10 there map to steps 2–5 here).

## 6. Holdings growth and new types

1. **Growth tiers** (village → town → city) on top of `HOLDING_TYPES`. `holdingOf(t, kind)` already switches a holding's class.
2. **New holding types:** the owner will add more. Each should be one registry entry plus a class if it behaves differently.
3. **Open art question:** cities reuse the town's citadel sprite.

---

## 7. Interiors (walkable scenes, added gradually)

The proposed milestone order:
1. The engine and towns (partly done: towns have streets).
2. Castle.
3. Cave and hideout.
4. Ruins.
5. Mine.
6. **Dragon lair**, which must be very hard to find.

Each place keeps its text panel, plus an "Enter" choice once its scene exists. Entering hostile holdings (sneaking in, disguise) is **deferred**, but don't design scenes that assume you're always welcome.

---

## 8. Character parity (technical)

- **Hero stats:** the hero still uses `heroStats`, while companions, lords and chieftains use `charStats`. Merge them if the owner wants one formula.
- **Hero's bow:** the hero's bow is a drawn shot (`B.draw`), while champions shoot as troops. Unify them if needed.

---

## 9. Design backlog (from the Feature Plan, not started)

These are in the [Game Feature Plan](Game%20Feature%20Plan%202D%20Pixel-Art%20Sandbox%20Warband%20RPG.md) but not built. Agree a design with the owner before building any of them.

| Area | Feature |
|---|---|
| Overworld | Seasons (effects on travel, food, prices) |
| Party | Desertion when you're broke or keep losing |
| Companions | Personal story quests and conflicts between companions; companions as caravan leaders or governors |
| Combat | Directional melee (swing angles, blocking by matching direction), if manual control returns |
| Economy | Production chains (grain → flour, ore → weapons); gear crafting and smithing |
| Politics | Lord traits and grudges; **founding your own kingdom** (laws, vassals, diplomacy) |
| Quests | Escort, rescue and defend contracts; faction story chains; ambush road events; a late-game threat (invasion or civil war) |
| Presentation | Music in the game (a chiptune generator exists in `prototype/audio/`); more walkable interiors (see section 7) |

---

## Deferred (do not start without the owner)

| Item | Notes when it comes back |
|---|---|
| **Procedural world** (a seeded map) | Holdings placed by rules, generated names, realms as territories. **Keep a fixed "classic" seed** so tests that name holdings (Ashford, Karn Hold…) still work. Saves are not backward compatible for now (schema v2 only), so a new world shape only needs a new save version. |
| **Game data as JSON** | Browsers block reading `.json` from `file://`. Ask how to load it first: a Python-built bundle (recommended), a local server, or `.js` files shaped like JSON. |
| **Art derived from the `graphics/` pack** | Order: recolour → kit-bash (dwarves, elves, mounted hero) → missing animals. Bake offline to `graphics/generated/`. |
| **Entering hostile holdings** | See section 7. |
| **Manual hero control** | Kept behind `MANUAL_HERO`. Don't delete it; ask before changing it. |

---

## Technical debt and watch-outs

- **Seeded failure:** `lots` "its realm builds it another house" fails with `-Seed 1` and `-Seed 2` (seen 2026-10-17, also before the spatial grid).
- **Unseeded flake:** `monsters` "spiders web your fighters" sometimes fails unseeded (spiders now shoot; fight outcome varies).
- **Lab warm-up:** the first BattleLab battle after a page load plays slightly differently from the same battle run again (visible in `visual/battleperf` fingerprints).
- **Remaining hot scans (perf, later):** `commander.js` members×foes `busy` checks (~2 ms/frame at 1200), `BattleResolve.live()/members()` filters (2–4 ms at 800–1200; a per-frame member cache), `setOrderUI` on every death (batch per frame), `targetMembers`/`tgt` getter O(n) per access, `FORM_SWAP` pairwise pass.

- **Timing-sensitive test:** `rts` "fights in bursts, a breath after each finisher" can fail under `-Parallel 4` CPU load (passes alone); harden it to measure combat time only.

- **The mid-line `//` trap:** a comment followed by code on the same line hides that code. Use `/* */` (see the knowledge transfer).
- **Frame cost:** the world frame rose from about 1.2 to 3 ms with placed buildings. Profile with `Ashmark.html?test=visual/perf` before adding more map entities.
- **Interior painter:** interior scenes still use their own painter rather than the PX engine.
- **Two Esc mechanisms:** `ESC_CLOSE` in `ui.js` still maps modes to close actions for screens with no open window (walking the streets). Fold it into the window frame if possible.
- **Temporary files:** `tests/zz_*.js` must never be committed.

---

## Definition of done (every item)

1. Tests: the affected suites pass, then the full suite, with any known flaky tests named in the report.
2. Screenshots at 1600×900 and 844×390 for anything visible.
3. The window frame rule is followed: actions in the content, `nav()` last.
4. Sprite box and proportion rules are followed for anything drawn.
5. No duplicate global names (`tests/structure.js`), and no code hidden after a `//` comment.
6. README and wiki updated if behaviour changed.
7. The owner has seen it before moving on.
