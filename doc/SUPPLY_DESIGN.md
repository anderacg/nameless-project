# Travel supplies: stamina, food, drink and furs: design

Campaign recovery tuning (2026-10-24): stamina recovers at 4/hour stopped, 16/hour in camp and 20/hour lodging; food and drink penalties still apply. Wounded companions show gradual recovery across their two-day injury timer. Hourly Medicine, camp and lodging bonuses shorten it; expired injuries clear and return the companion to duty.

Status: **built 2026-10-21**, all four phases (`world/supply.js` with every number in `SUPPLY`, `ui/ring.js`; tests `tests/supply.js`, `tests/camp.js`, `tests/ring.js`; prototype/README.md "Supplies"). As built, where it differs from the plan below:

**Next, designed only (owner, 2026-10-21):** food and water become supply pools with a carrying capacity, a pack train (mules, camels, carts, wagons: bought, looted, found), rations and resupply policies, foraging and a march preview: [LOGISTICS_DESIGN.md](LOGISTICS_DESIGN.md).
- **The hero's stamina** is kept where it was, in `P.sp` (her scale), and the band's 0-100 (`P.bsta`) reads and sets it: every battle snapshot holds `P` whole, so a new field there would move them all. When her maximum grows (a level, Agility, Athletics) her stamina stays as it was, so the band's share of it dips a little. The band's camp and the hour's counters are `BAND`, beside `P`, saved as the world piece `band`.
- **Water and liquor** are goods in the bag (`data/places.js` `DRINK_GOODS`) but no market trades them (kept out of `GOODS`'s keys: a new traded good would change every holding's stock and the world's draws). Water fills **free** at the water's edge (a river, lake, pond or oasis) or at **any holding's well**, over game time (below), into **empty waterskins** (§4a); the tavern's tapster sells liquor (2 for 112g) and empty waterskins, and fills your empty skins at once. A new hero sets out with 4 full waterskins.
- **One drink is one person's day** (the owner, 2026-10-24, built): §4a.
- **Frostbite** and the toll of hunger and thirst are counted, not rolled (nothing in the hour draws Math.random): frostbite after 6 hours' worth of fur shortage; hunger after a day, every 12 hours a man deserts or falls sick by turns; thirst after 12 hours, every 6 hours. A sick man is the kind you have most of, wounded.
- **A tournament** leaves your hero's (and so the band's) stamina as she fought it; the lab is untouched.
- **The owner's play-test, 2026-10-22 (built):** hunger and thirst hit your hero (Parched or Hungry: her mana stops coming back; Dying of thirst: every thirst toll −10% health and mana; Starving: −5% of each every 6 hours; Starving or Dying of thirst: her health stops coming back; `SUPPLY.thirst.hero`, `SUPPLY.hunger.hero`, `heroRegen`); at 0 health off the battlefield she dies and the game is over (`heroDies`, `ui.js showDeath`: Load last save or Back to the title; `tests/gameover.js`). Make camp pitches only on clear ground (`campSpot`, `campGround`: no water, ford, wood, swamp, lot or anything standing; the band walks to the nearest within `SUPPLY.camp.r` 4 tiles, else "No clear ground to camp here"), the tents drawn by their feet among the trees. **Hurry** (key 4, the top bar, the ring's Hurry here) replaced Travel fast's 8×: the band marches ×2, its march drain ×2.5 (`SUPPLY.forcedMarch`), off once Exhausted, stopped, or when an event or a window opens; named Hurry, apart from the Forced March perk.
- **The owner's camp notes, 2026-10-23 (built):** in camp your hero's figure is hidden and your banner stands on a pole in the camp (`bandCampEnt`, `SUPPLY.camp.pole`); the camp keeps off roads and their painted bands, tracks, crossings, fords, water, brooks, lots and fields, a holding's ring, sites, woods, swamp and peaks (`campGround`, `SUPPLY.camp` margins); Make camp pitches at the nearest allowed spot, at once within 2 tiles (`hop`), else walking there, within 6 tiles (`r`, was 4), never across water.
- **The owner's second play-test, 2026-10-22 (built):** Hurry left the top bar (key R and the ring's Hurry here / Stop hurrying) and Travel fast's 8× came back on it (key 4, a toggle, `TRAVEL_FAST`). Click or hold: a press on the map does nothing until it is let go (a click: travel, or meet what was clicked) or held 0.35 s (the ring opens and waits), mouse and touch alike (`ui/ring.js`). The console's `noNeeds true` switches off hunger, thirst, the stamina drain and their tolls on your hero (`CHEAT.noNeeds`), for testing only.
- **Left:** "you cannot outrun anyone" when Exhausted needs `battle/engage.js` `fleeOdds` to read `P.staminaState()`; the wiki's goods table does not list the drinks.

## 1. The idea

Today travel is free: food is eaten once a day whether you march or sit, stamina belongs to the hero alone and refills each day, and furs only cost morale at night. Supplies become **fuel**:

- **Band stamina** runs down as you march and comes back when you stop or make camp.
- **Food** and **drink** are used every hour, more while marching.
- **Drink** (water, ale or liquor) keeps stamina from running down too fast.
- The land adds its own drain: **furs** in the frost, **water** in the desert.
- A tired band arrives at a battle tired.

## 2. Band stamina (0–100)

| | Rule |
|---|---|
| Drains | Each hour you move on the map: `SUPPLY.march` 2 (owner, 2026-10-21: 3 drained too fast; about 40 marched hours from full to Tired on easy ground). |
| Faster | Rough ground (hills, forest, swamp, snow, sand) ×1.5; night ×1.3; Forced March ×1.5; no drink ×1.5; desert without water ×2; frost without furs ×1.5. |
| Slower | A mostly mounted band ×0.7; Athletics (on foot) or Riding (mounted) −3% a level; a Guide −10%. |
| Recovers | **Stopped** on the map: +2 an hour. **Make camp**: +8 an hour. **Staying in a holding**: +10 an hour. |
| No recovery | With no food left. With no water in the desert. |
| Shown | The **Stamina** bar on the party card, with an arrow for which way it is going (▼ marching, ▲ resting). |

**When it runs low** (owner: 20 and 5):

| State | Stamina | Effect |
|---|---|---|
| Fresh | 20–100 | none |
| **Tired** | below 20 | pace −15%, morale drifts down 1 a few hours |
| **Exhausted** | below 5 | pace −40%; you cannot outrun anyone; men start falling sick (wounded) the longer it lasts |

**The hero tires with the band** (owner): the hero's stamina on the map *is* the band's. There is no separate hero stamina any more (`P.sp` goes; the hero's Health and Mana stay their own).

**Into battle (owner: yes):** each of your troops, your hero and your companions start a battle at the band's stamina (`u.sta = FATIGUE.max × stamina / 100`, never under `SUPPLY.battleMin` 25, so a battle is still playable). The battle's own fatigue (`battle/fatigue.js`) takes it from there. After the battle, the band's stamina is the average your side ended with.

## 3. Food

- **Eaten every hour**, not once a day: `eatPerDay() / 24` an hour, ×1 at rest and ×1.5 while marching (owner: yes). Forced March, the Quartermaster and the rest of today's modifiers still apply.
- Spoiling and the order foods are eaten in stay as today (`FOODS`).
- **With no food** (owner, 2026-10-21: food matters less than water, but it can kill, much later), by stages (`SUPPLY.hunger`), each with its tag on the card:

| Stage | From | Effect |
|---|---|---|
| **Hungry** | at once | morale −1 every 2 hours; stamina comes back at half speed |
| **Starving** | 3 days (72 h) | the march drains ×1.25; morale −1 an hour |
| Desertion | 4 days (96 h) | every 12 h a man deserts (the kind you have most of) |
| Sickness | 7 days (168 h) | every 12 h a man also falls sick (hunger) |
| Death | 10 days (240 h) | every 12 h a sick man (else a fit one) dies of hunger |
- The card shows food in **days left at the current rate** (marching or resting).

## 4. Drink: water, ale and liquor (owner: they keep stamina up)

| Drink | Where from | What it does |
|---|---|---|
| **Water** (new good, in waterskins) | Cheap in every holding. **Free refill** when you stop beside a river, lake, oasis or well. | The plain ration: with it, stamina drains at the normal rate. |
| **Ale** (exists) | Holdings with a brewery; taverns. | Counts as a ration, **slows the drain** (×0.9 while you drink it) and lifts morale (+1 a day). |
| **Liquor** (new good: spirits) | Taverns and some markets; dearer. | Counts as a ration, **slows the drain more** (×0.8) and lifts morale more (+2 a day). |

Owner (2026-10-19): ale and liquor slow the drain and lift morale; water does neither, it only keeps the drain at the normal rate. No instant swig.

- **Rations:** the band drinks `(people + 1) / 6` an hour while marching (since 2026-10-24 one a person a day: §4a), half that at rest; water first, then ale, then liquor (cheapest first). A setting picks liquor first for a hard march.
- **No drink:** stamina drains ×1.5 and recovers half as fast. **The desert (owner: yes):** without water (ale and liquor do not count there), stamina drains ×2 and does not recover. Today's daily desert morale loss goes away; this replaces it.
- **Thirst kills, after the sickness** (owner, 2026-10-21: water before food), by stages (`SUPPLY.thirst`), the hours counted double in the desert, each with its tag on the card:

| Stage | From (desert) | Effect |
|---|---|---|
| **Thirsty** | at once | the drain above |
| **Parched** | 12 h (6 h) | pace −15%; morale −1 an hour |
| **Dying of thirst** | 24 h (12 h) | every 6 h (3 h) a man falls sick (thirst) |
| Deaths | 48 h (24 h) | every 6 h (3 h) a sick man (else a fit one) dies of thirst |

- ~~Water fills at once~~ (owner, 2026-10-21; replaced 2026-10-23 below). Water and liquor are not market goods (the well is free; the tapster sells liquor; markets and the tapster sell empty waterskins, §4a).
- **Filling takes time** (owner, 2026-10-23, built: `SkinFill`, the one `SKINS`, in `world/supply.js`; every number in `SUPPLY.fill`):
  - **How long:** 15 game minutes (`minPerDay`) for each man's day of drink filled (one waterskin since 2026-10-24: `drink.perDay`; it was 4 rations), never under 5 (`min`) nor over 180 (`max`). Alone, the full 2 days (2 waterskins) take 30 minutes; a band of three, 90; six or more people, 3 hours. Topping up half-full skins takes half as long. Only as many as you have **empty waterskins** fill (§4a).
  - **By the game clock** (`Clock.hours()`): it stands still while paused and runs faster at 2× and 4×. The water comes in as the share rises, not at the end.
  - **Moving stops it,** keeping what is in: any order (travel, a chase, following), Hurry, a step off the spot (a camp's hop), a battle (`battle:ended`), an encounter or any page off the map (`G.mode` not the world; the card's `supplyNow`, read every quarter second in any mode, asks `SKINS.watch`).
  - **The auto-fill uses it:** every half a second (real time), standing at a holding's well or stopped at the water's edge with the skins not full, it starts by itself (quietly). The ring's Fill waterskins starts it with a line in the log; the ring offers it only where it can fill, lit while it fills (pressed then, its end is said in the log).
  - **Shown:** a thin water-blue bar under the band card's three bars, "Filling waterskins 60%" (`render.js updateHUD`, `style.css .pc-fill`), and a small drop beside your band's head on the map, filling from the bottom (`gfx/worldui.js wuiFilling`).
  - **A new game** sets out with 4 full waterskins (`SUPPLY.skins.start`, `skinsStart`; `SKINS.first`, due from `onWorld`, cleared by the band's save piece on a load: nothing free for a loaded game). The tavern's tapster fills your empty ones at once (`fillNow`: the town's time stands still).
  - **Nearer** (the owner: "much shorter"): the water's edge is a water pixel as the world art draws it (`gfx/worldart.js wpx`: the shore's curve, a ford's shallows, a bridge's water, a pond's) within half a tile (`near: .5`, `waterEdge`; was 3 tiles round by the tile); a holding's well within 1.5 tiles (`well`, `wellNear`; was 40 px of its middle) of where you arrive at it (its x, y) or of the spot before its gate where you set out (`world.js gateSpot`, kept a holding: `wellGate`).
  - **Off** (`SUPPLY.fill.timed false`): they fill at once as before (the frame and the hour).
  - **Not yet** (the owner, for later): ordering workers, passengers or troops to fetch water with the camp system.

## 4a. The unit and the waterskins (owner, 2026-10-24: "make water simple"; built)

- **One of a drink is one person's day of it** (`SUPPLY.drink.perDay` 1): the band drinks `(people + 1) × perDay ÷ 24` an hour on the march, half that at rest (`parties.js drinkHour`). A band of 20 and your hero drinks **21 a day** on the march, 10.5 resting. It was `(people + 1) ÷ 6` an hour (a ration a quarter of a day; a lone hero's 2 days were 8 water).
- **Ale and liquor** use the same unit. Their morale, once as they come into your stores, is ×4 per item so a person's day lifts it as before: ale +2 (was +0.5), liquor +6 (was +1.5). Liquor costs 56g (was 14, ×4); the tapster sells 2 at a time (112g, was 5 for 70g). **Ale keeps its 12g:** it is a market good the economy makes and trades (a brewery's 2 grain into 2 ale), so its price stays the world's; a day of ale is now 4× cheaper than before, and its morale per gold 4× higher. They need no bottles yet.
- **Water lives in waterskins** (`data/places.js` `CONTAINERS`): a full **Waterskin** is the good `water` (one person's day), an **Empty waterskin** the good `skin_empty` (category Water, Supplies tab, no drink, its own icon; both stack 50 to a slot and take bag room as goods do).
  - **Drinking** water leaves each skin empty in the bag (`drinkTake`; past the bag's limit too, never lost).
  - **Filling** (the timed `SKINS`, the ring's Fill waterskins, the tapster) turns empty skins full, up to the 2 days, **never more than you have empty**. With none, nothing fills: the ring's button reads **No empty waterskins**, the tapster's Fill waterskins is off with that tooltip, and the log says to buy them (`skinsWhy`).
  - **Getting skins:** a new hero starts with **4 full** (`SUPPLY.skins.start`); each soldier **recruited** (a holding's volunteers, a prisoner who joins: `core/recruitment.js` → `skinsJoin`) brings **1 empty** (`recruit`); dismissing or losing men takes none away; **markets** (under Water) and the **tapster** (5 at a time, `lot`) sell empty ones at 2g each (`skin_empty` base, `skinsBuy`).
  - **Containers to come** (the owner: "in the future we will have container upgrades"): `CONTAINERS` holds one kind today, `skin: {full, empty}`. Bigger skins and barrels would be more entries (each its own full and empty goods, or a size), read by `drinkTake` and `skinsFill`.
- **The card:** drink in days left as before (`supplyNow drinkDays`: what you carry ÷ the day's drink), so 42 water for 21 people is 2 days on the march.
- **Not rescaled:** the thirst stages count hours, not water; food is as it was (the owner has not decided). No encounter gives or takes water, ale or liquor.
- **Joins that bring no skin yet:** troops from encounters (`story/outcome.js` `troops`), hiring a worker at an estate (`folk.js`), refugees and a site's mercenaries, bandits who join after a parley; they add to the party directly, not through the recruitment service.

## 5. Furs (the frost)

- Need as today: 1 fur for every 5 people.
- **Short of furs in the frost:** stamina drains ×1.5 (scaled by how short you are), and every few hours a man may get **frostbite** (becomes wounded).
- Today's nightly morale loss is kept, but smaller.
- Furs are not used up (as today). A later option: they wear out slowly.

## 6. Band health (casualties)

- **Health bar** = the share of your band fit to fight: `fit / (fit + wounded)`, the hero counted as one.
- Falls with battle losses (the wounded), frostbite, thirst, hunger and swamp fever.
- Rises as the wounded heal: as today (Medicine, a surgeon), faster in camp or a holding.
- Hovering it shows: fit, wounded, how many of them are sick, what is hurting them, and the men lost lately.
- **Swamp fever** (owner, 2026-10-21; `SUPPLY.fever`), as thirst and hunger: on a fever night (as often as before) a man **falls sick** with fever (half the time; before, he died outright), and a man already sick of it may **die** (20%, less 2% a level of Medicine, never under 5%), a sick one first.
- **The sick** are wounded (out of the line, riding with you, eating, healing as the wounded do), with the cause kept (`BAND.sick`: thirst, hunger, exhaustion, frostbite). **The lost** (died of thirst or hunger, deserted) are kept for 7 days (`BAND.lost`). Both are saved only when there are any.
- **The troops tab** (Hero window) has a **Wounded and sick** section: each kind's wounded and sick and why, the share fit again each day and what would raise it (camp, a holding, Medicine), and **Lost on the road** these 7 days.

## 7. Make camp (owner: add it)

- **Make camp** from the keyboard (**Z**, owner: yes), the bottom-right dock, or the **action ring** (§7a) for mouse and touch.
- Your band stops and pitches tents (drawn at your figure: two small tents and a fire). Stamina +8 an hour, the wounded heal ×1.5, food and drink at the rest rate.
- **Fast forward:** 8× is allowed in camp, and stops at once when anything hostile comes into sight, as travelling fast does.
- **Breaking camp:** any travel order. A hostile band that finds you in camp catches you unready: your troops start that battle a little lower in morale.
- Camping beside water refills empty waterskins for free.

## 7a. The action ring: left-click and hold (owner)

A ring of actions for mouse and touch, so nothing needs a key:

- **Open it:** hold the left button (or a finger) still on the map for 0.35 s. A short click still travels, as today; dragging still pans. On a phone, a long press.
- **The ring:** 4–6 round buttons in a circle round the point you hold, each an icon with its name under it, drawn in the same style as the battle's COMMAND buttons. It opens with a short grow and a soft click sound.
- **Pick:** release over a button (hold, slide, let go), or let go first and tap one. Esc, a right-click or a tap outside closes it.
- **What is in it** (only those that apply, the rest left out, not greyed):

| Button | When | Does |
|---|---|---|
| **Make camp** | always (on the map, not in a holding) | §7 |
| **Break camp** | in camp | leaves camp |
| **Travel here** | held on the ground | the same as a click (for touch) |
| **Travel here fast** | held on the ground, nothing hostile in sight | travel at 8× until anything calls for you |
| **Fill waterskins** | at the water's edge or a holding's well (lit while filling; "No empty waterskins" with none to fill) | fills your empty waterskins, free, over game time (§4, §4a) |
| **Drink liquor** | carrying liquor | switches rations to liquor first (a hard march) |
| **Look** | held on a party, holding or site | its tooltip as a card (for touch, where there is no hover) |

```
            ( Travel here fast )
   ( Fill waterskins )     ( Make camp )
              ·  ← you held here
   ( Travel here )         ( Look )
```

- **Hold progress (built 2026-10-24):** a gold circular progress arc fills clockwise before the menu opens, for mouse/pen and touch. It appears after 90 ms and fills to the existing 350 ms hold threshold. Mouse/pen radius 18 CSS pixels, touch 34; width 3, with a dark rim and faint full-circle track. Drawn over the final frame in screen pixels, independent of world zoom and device scale. Release, wandering, cancellation, leaving the canvas with a mouse/pen, losing focus, opening the ring or another window removes the indicator. Touch holds in battle keep their existing gold/red progress ring. No hold timing, action or save change. Tests: holdprogress, ring, touch.
- **Later:** the ring is the one place for new map actions (Forage, Hunt, Scout around…), so the screen stays clean.
- **Built as** one small `ActionRing` class (`ui/ring.js`): it takes a point and a list of `{icon, label, ok(), run()}` and draws itself as HTML over the canvas. The map and, later, the battle can each hand it their own list.

## 8. The new status display (owner: design it)

The hero's Health and Mana bars leave the party card for the Hero window (C), and stay in battle as they are; the hero's stamina is the band's. The card becomes the **band's**:

```
┌────────────────────────────────────────┐
│ [portrait]  Human Veteran   Lv 7  +2   │
│             Knight of the Stag         │
├────────────────────────────────────────┤
│ STAMINA ▼  ████████████░░░░  64  Tired?│
│ HEALTH     ███████████████░  31/34     │
├────────────────────────────────────────┤
│ ⛁ 412   🍖 5.5d   💧 3.1d   🧥 6/7 ❄   │
│ ⚔ 34/40  ⚡ 210  ☺ 62  ➶ 1.1×          │
├────────────────────────────────────────┤
│ ⌂ Ashford vale · Kingdom of the Stag   │
│ ★ 120 · Independent                    │
└────────────────────────────────────────┘
```

- **Stamina bar:** green above 20, amber below 20 (Tired), red below 5 (Exhausted), with the state word at its end. The arrow shows ▼ marching, ▲ resting or in camp, nothing when steady. Hover: the rate an hour and why ("marching ‑3, rough ground ×1.5, no water ×2").
- **Health bar:** fit out of the whole band. Red when under half. Hover: fit, wounded, and the last causes.
- **Supply chips:** food and **drink in days left at the current rate**. Furs show only in or near the frost or when carried (have/need). Each one turns red when it will run out within a day.
- **Status tags** appear under the bars only when they apply: **Tired**, **Exhausted**, **Thirsty**, **Hungry**, **Cold**, **In camp**. Each is a small coloured pill with its reason in a tooltip.
- **A first-run hint**, once: "Marching tires your band. Stop, or Make camp (Z), to rest."
- On a phone, the card folds to the two bars and the chips; the tags fold into the bars' colours.
- **Built since (the owner, 2026-10-23):** the card is the band's: its name (the player's, or The Free Company; a button that opens
  the Names window) over the hero's name, level and rank; three bars in %: **Fitness** (replaces Health: `(fit + hero's health share)
  / (all troops + 1)`, `world/supply.js` `fitnessOf`, `bandFitness`), **Morale** (moved from its chip) and **Stamina**. Names:
  `ui/names.js`, `data/names.js`.

## 9. Build notes

- **Files:**
  - `world/supply.js` (new): the `SUPPLY` table and band stamina, hourly food and drink, furs, desert water, and states.
  - `core/state.js`: the band stamina (`P.bsta`) and the drink goods.
  - `data/places.js`: Water and Liquor goods; holdings and taverns sell them.
  - `world/world.js`: the hourly hook while moving or stopped; `bandPace` reads the states; `survive()` is replaced.
  - `world/stay.js` / a new camp: Make camp.
  - `ui/ring.js` (new): the action ring; `ui/input.js`: the hold on the map.
  - `battle/setup.js` / `fatigue.js`: troops start at the band's stamina; it is read back after.
  - `gfx/render.js` `updateHUD`: the new card; `style.css`; the Hero window takes the hero's bars.
- **Saves:** `P.bsta`, the camp, and the new goods (no migration).
- **Tests:** drain and recovery by ground, night, mount, drink and furs; the 20 and 5 states; hourly food at rest and on the march; water refills by water; desert without water; frostbite; the battle start and read-back; Make camp (rest, fast forward stops on danger); the card's bars, chips and tags.
- **Phases:** (1) stamina, hourly food and drink, the states and the new card; (2) Make camp and the action ring; (3) battle carry-in (troops, hero, companions); (4) furs, desert and casualties.

## 10. Questions for the owner

1. ~~Liquor~~: decided (ale and liquor slow the drain and lift morale; water neither).
2. ~~The hero~~: decided (tires with the band).
3. ~~Make camp~~: decided (Z, the dock, and the action ring on a left-click and hold).
