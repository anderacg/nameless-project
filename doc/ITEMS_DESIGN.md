# Items: categories: design

Status: **built** (2026-10-22): the categories (`data/items.js` `ITEM_CATS`, `ItemKind.cat`), the bag's tabs, the market and the loot screen by category, quest items (`QuestItem`, the outcome `item`, the sealed letter one), the overfilled bag (`BAG`, the Burdened tag, the red overflow slots, `bandPace`), valuables (`Valuable`, `VALUABLES`), Water and the drinks' morale once, quivers in place of arrows (`QUIVERS`, `ARROWS`, the quiver slot). Food and Water still go to the bag: their pools, and Carriers to the pack train, come with logistics phase 1. The tests: `tests/itemcats.js`, `tests/quivers.js`, `tests/burden.js`, `tests/valuables.js`. (Owner, 2026-10-21: "item should have type, for example, Quest item, Food, Water, Resource etc.")

**The owner's answers (2026-10-22):**
- **Quest items take a bag slot**, like any item.
- **The bag can be overfilled:** you walk slower and slower the more you carry over its room (§4a). This replaces today's "no room in your bag".
- **Valuables now**, in the first build.
- **Water is its own category** (owner): water, and ale and liquor with it. Given to the water pool, ale and liquor count as water and **add a little morale** as they go in (§2a).
- **Morale** stands beside the food and water pools (it exists today: the band's morale, 0–100), as the third bar of the Supplies window.
- **No more arrows and bolts as items** (owner): a **Quiver** is equipment (it takes a bag slot when not worn); it sets how many shots your hero and the special units carry into a battle. Normal troops' ammunition comes from their tier and specialities (§2b).
- **The bag tabs** (§3): agreed.
- **(2026-10-22)** Ale and liquor give their morale once, as they go into the pool, replacing today's slower drain: **yes**. Quivers **full at every battle's start**, and each shows its **arrow type** (wooden, bronze…); equipment upgrades come later. The quiver sizes: **agreed for now**, kept in a table so more can be added. It comes before logistics phase 1 ([LOGISTICS_DESIGN.md](LOGISTICS_DESIGN.md)), which routes food and drink by category.

## 1. What exists

Class wave C (`core/items.js`) gave every bag record a **kind**, an object over its data table:

| Kind | Data | Holds |
|---|---|---|
| `Gear` | `ITEMS` | weapons, armour, shields, helmets… |
| `Mount` (a `Gear`) | `MOUNTS` | the mount slot |
| `Good` | `GOODS` | food, ale, ammunition, wares (iron, cloth, spice…) and the drinks (`DRINK_GOODS`) |
| `Trophy` | `MATS` | beast parts |
| `Letter` | the sealed letters | the messenger's letter |

Each kind knows its name, words, stack, price, slot and verbs (equip, sell, drop, read). What is missing is a **category** the player sees and that rules ask: food, water, iron and cloth are all just "a Good". Rules ask the data instead, in scattered checks (`GOODS[g].food`, `.drink`, `AMMO`…).

## 2. Categories

One table, `ITEM_CATS` (`data/items.js`, new), and every item has exactly one category. A data entry may name its category; otherwise its kind gives a default (a food good: Food).

| Category | Examples | Its rules |
|---|---|---|
| **Weapon** | swords, spears, bows, staves | an equip slot (main or off hand) |
| **Armour** | body, helmet, gloves, boots, shield | an equip slot |
| **Mount** | riding horse, destrier, pack mule | the mount slot |
| **Carrier** | pack mule, camel, cart, wagon (logistics) | the **pack train**, never the bag |
| **Quiver** | quivers and bolt cases, plain to master-made | an equip slot (the quiver); its size is your shots in a battle (§2b) |
| **Food** | grain, meat, fish, milk, cheese, fruit | the **food pool** (logistics); spoils by kind |
| **Water** (owner) | water, ale, liquor | the **water pool** (logistics); ale and liquor add morale as they go in (§2a) |
| **Resource** | iron, timber, stone, wool, furs | trade; building materials (estates, walls); crafting later |
| **Trade good** | cloth, tools, spice | trade |
| **Trophy** | beast hides, fangs, scales | sell; crafting later |
| **Quest item** | the sealed letter, an heirloom, a found map | **bound:** cannot be sold or dropped; **takes a bag slot** (owner); leaves when its quest or chain ends |
| **Valuable** | jewels, rings, relics, gilded plate (owner: now) | sell; worth a lot for one slot; found in lairs, caves, ruins, camps, and on lords and chieftains (§4b) |

**The rules live with the category**, not in scattered checks:

| | What it decides |
|---|---|
| `bag` | does it take bag room (Food, Water and Carrier: no, they go to the pools and the train; every other category: yes, Quest items and Quivers too) |
| `route` | where it goes when you get it: the bag, the food pool, the water pool, the pack train |
| `sell` / `drop` | allowed or not (Quest item: neither) |
| `tab` | its bag tab and the trade window's section |
| `icon`, `col` | its tab's look |

Each kind's verbs (`ItemKind.verbs`) ask the category: a Quest item never shows Sell or Drop.

## 2a. Water, ale and liquor; morale (owner, 2026-10-22)

- **Water** is the category of everything drunk: water, ale, liquor.
- **Given to the water pool** (bought, looted, found, or donated from the bag; logistics §5), each counts as Water, and ale and liquor **lift morale as they go in**:

  | Item | Water | Morale |
  |---|---|---|
  | Water | 1 | 0 |
  | Ale | 1 | +0.5 |
  | Liquor | 1 | +1.5 |

  These are one-off bonuses; the numbers go in `PROVISIONS`.
- This **replaces** today's effect of drinking ale and liquor on the march (stamina drain ×0.9 and ×0.8 while you drink them). One effect, simple to read.
- **Morale** is the band's morale as today (0–100): the third bar of the Supplies window, beside Food and Water. It is raised by ale and liquor, victories, a varied larder and pay, and lowered by hunger, thirst, tiredness, defeats and unpaid wages. It is not a pool with a capacity: it is a state.

## 2b. Quivers, not arrows (owner, 2026-10-22)

- **Arrows and bolts stop being items.** Markets no longer sell them, smithies no longer make them (their `out` gives tools and more), and nobody starts with any.
- **A Quiver** is equipment, in a new equip slot. Bows, crossbows, slings and javelins need one. Unworn, it takes a bag slot like any gear.
- **Its size is your shots in a battle:** every battle starts with the quiver full (owner: agreed), as troops' quivers do today, so there is no counting arrows between battles.
- **Every quiver carries an arrow type** (owner), shown in its name and tooltip: "Hunter's quiver · 30 bronze arrows". The types are a table of their own, `ARROWS` (wooden, bronze, iron, steel; elven and dwarven makes; bolts for crossbows: wooden, iron, steel), each with its name, icon and a damage factor (1 for all now). **Equipment upgrades** (owner: later) can then raise a quiver's arrows from wooden to iron, or its size, without new item kinds.
- **Flexible** (owner): quivers are a data table, `QUIVERS` (`data/gear.js`): each entry is its name, size, arrow type, its weapons (bow, crossbow, sling, javelin), where it is sold, its worth and rarity. A new quiver is one more line; nothing in code lists them.

  | Quiver | Shots | Arrows | Where |
  |---|---|---|---|
  | Worn quiver | 20 | wooden | anyone; your first |
  | Hunter's quiver | 30 | bronze | markets |
  | Soldier's quiver / bolt case | 40 | iron (bolts: iron) | towns, the smith |
  | Elven / dwarven make | 50, +accuracy or +damage | elven / dwarven | their people's holdings |
  | Master's quiver | 60 | steel | cities, rare loot |
- **Who carries one:** your hero, companions, lords, chieftains and unique units (the characters). A character with a bow and no quiver shoots a handful (5) before drawing his sword.
- **Normal troops** keep today's per-kind quivers (`AMMO`, `quiverOf`). Their size grows with their **tier** (a higher kind's `ammo`) and with **specialities** (PROGRESSION_DESIGN.md: e.g. the bow line's "Full quiver" +25%).
- Today's after-battle gathering of arrows goes away with the arrows.

## 3. The bag and the trade window

- **Bag tabs** (owner: agreed): All · Equipment (Weapon, Armour, Quiver, Mount) · Supplies (the pools' days and morale, read-only) · Goods (Resource, Trade good) · Trophies and valuables · Quest.
- **Sort within a tab:** by category, then by worth.
- **The trade window:** the market's rows grouped by category (Food and Drink become Provision rows, logistics §5). Selling allows only what the category allows.
- **Loot screen:** grouped the same way. Quest items are always taken; Carriers go to the train when there is room for them.

## 4. Quest items

- **Given** by a quest, a chain step or an encounter (the sealed letter today; the wounded traveller's heirloom; a map that marks a site).
- **Bound** to their quest: no Sell, no Drop, a mark on the icon; **it takes a bag slot** (owner), so a full bag is overfilled by it (§4a), never refused.
- **Gone** when the quest or chain ends: delivered, failed or abandoned (`quest:ended`, `thread:ended` on the bus).
- The story system's outcomes (`story/outcome.js`) give and take them: `item: {give: id}`, `item: {take: id}`.

## 4a. Overfilling the bag (owner, 2026-10-22)

Today the bag is a fixed row of slots (`P.inv`: its size from your hero and your mount's packs), and an item that does not fit is refused ("There is no room in your bag").

**Up to a limit, nothing is refused.** What does not fit goes into **overflow slots** beyond the bag's size, and **the more you carry over, the slower you walk**:

```text
over = slots used − the bag's size          (0 when it fits)
pace × max(BAG.floor, 1 − BAG.per × over)   e.g. per 0.04, floor 0.4: 5 slots over −20%, 10 over −40%, 15 or more −60%
```

- One more multiplier in `bandPace`, beside stamina, Parched and the pack train's.
- The card shows a **Burdened** tag (slots over, the pace it costs, what lightening the load gives back). The bag window shows the overflow slots in red after the bag's own.
- **The limit** (owner, 2026-10-22): once the burden reaches its floor (−60%: `BAG.maxOver`, 15 slots over), **nothing more can be carried**. A new item is refused ("You cannot carry any more"), and loot stays on the loot screen to choose from. Quest items are the one exception: they are never left behind.
- Dropping, selling or stowing an item frees a slot at once.
- The numbers (`BAG.per`, `BAG.floor`) are in one table. Weight per item (rather than per slot) can come later if slots feel too coarse.
- **With logistics:** the bag's overfill and the pools' over-capacity (LOGISTICS_DESIGN.md §3) are separate burdens, each with its own tag, and they multiply.

## 4b. Valuables (owner: now)

A new item kind, `Valuable` (`core/items.js`), over a new table, `VALUABLES` (`data/items.js`): jewels, rings, a gold chalice, a relic, gilded plate, each with its worth and rarity. They stack small (5) and sell for a lot.

**Where they come from:**
- the loot of lairs, caves and ruins (`world/sites.js`: their chests);
- bandit camps and hideouts;
- lords and chieftains you beat (their purse);
- rare finds among the incidents (the abandoned wagon);
- quest rewards.

**Where they go:**
- sold at markets, at a better price in cities;
- later, given as gifts to lords (relations), or carried as a quest's prize.

## 5. What changes in code

- `data/items.js` (new): `ITEM_CATS` and each data entry's `cat` where its kind's default is wrong.
- `core/items.js`: `ItemKind.cat(rec)`; the verbs and room ask it; `itemKind` unchanged.
- `core/inventory.js`: `add` routes by the category (the bag, the pools, the train); room counts only `bag` categories; **never refuses**: overflow slots past the bag's size (§4a); `over()` for the pace.
- `world/world.js` `bandPace`: × the bag's burden (§4a). The card: the Burdened tag.
- **Valuables:** `VALUABLES`, the `Valuable` kind, their loot in sites, camps and the loot screen (§4b).
- `ui/inventory.js`, the trade window, the loot screen: tabs and grouping.
- **Saves:** unchanged. A category is read from the data, never saved.
- **Fingerprints:** unchanged, so long as nothing's route changes. Food and drink only change their route with logistics phase 1, which carries that re-record.

## 6. Effort

**S–M**, one agent. Best built just before logistics phase 1, or as its first step.

## 7. Questions for the owner

1. ~~The list~~: decided: Water as a category (water, ale, liquor; ale and liquor add morale), Quiver in place of Ammunition (§2a, §2b).
2. ~~Quest items~~: decided: they take a bag slot, and the bag overfills (§4a).
3. ~~Valuables~~: decided: now (§4b).
4. ~~Bag tabs~~: agreed.
5. ~~Overfill~~: decided: −4% pace a slot over, down to −60% (15 over); past that, nothing more can be carried (quest items excepted).
6. ~~Ale and liquor~~: decided: a one-off morale bonus into the pool, replacing the slower drain.
7. ~~Quivers~~: decided: full at every battle's start; each shows its arrow type (`ARROWS`); upgrades later.
8. ~~The quiver sizes~~: agreed for now, in the `QUIVERS` table, so more can be added.
