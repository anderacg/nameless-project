# Items: categories: design

Status: **design only** (owner, 2026-10-21: "item should have type, for example, Quest item, Food, Water, Resource etc."). Nothing here is built.

**The owner's answers (2026-10-22):**
- **Quest items take a bag slot**, like any item.
- **The bag can be overfilled:** you walk slower and slower the more you carry over its room (§4a). This replaces today's "no room in your bag".
- **Valuables now**, in the first build. It comes before logistics phase 1 ([LOGISTICS_DESIGN.md](LOGISTICS_DESIGN.md)), which routes food and drink by category.

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
| **Food** | grain, meat, fish, milk, cheese, fruit | the **food pool** (logistics); spoils by kind |
| **Drink** | water, ale, liquor | the **water pool** (logistics) |
| **Ammunition** | arrows, bolts, stones | used in battle by kind (the quiver) |
| **Resource** | iron, timber, stone, wool, furs | trade; building materials (estates, walls); crafting later |
| **Trade good** | cloth, tools, spice | trade |
| **Trophy** | beast hides, fangs, scales | sell; crafting later |
| **Quest item** | the sealed letter, an heirloom, a found map | **bound:** cannot be sold or dropped; **takes a bag slot** (owner); leaves when its quest or chain ends |
| **Valuable** | jewels, rings, relics, gilded plate (owner: now) | sell; worth a lot for one slot; found in lairs, caves, ruins, camps, and on lords and chieftains (§4b) |

**The rules live with the category**, not in scattered checks:

| | What it decides |
|---|---|
| `bag` | does it take bag room (Food, Drink and Carrier: no, they go to the pools and the train; every other category: yes, Quest items too) |
| `route` | where it goes when you get it: the bag, the food pool, the water pool, the pack train |
| `sell` / `drop` | allowed or not (Quest item: neither) |
| `tab` | its bag tab and the trade window's section |
| `icon`, `col` | its tab's look |

Each kind's verbs (`ItemKind.verbs`) ask the category: a Quest item never shows Sell or Drop.

## 3. The bag and the trade window

- **Bag tabs:** All · Equipment (Weapon, Armour, Mount) · Supplies (Ammunition; the pools' days, read-only) · Goods (Resource, Trade good) · Trophies and valuables · Quest.
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

**From now on nothing is refused.** What does not fit goes into **overflow slots** beyond the bag's size, and **the more you carry over, the slower you walk**:

```text
over = slots used − the bag's size          (0 when it fits)
pace × max(BAG.floor, 1 − BAG.per × over)   e.g. per 0.04, floor 0.4: 5 slots over −20%, 10 over −40%, 15 or more −60%
```

- One more multiplier in `bandPace`, beside stamina, Parched and the pack train's.
- The card shows a **Burdened** tag (slots over, the pace it costs, what lightening the load gives back). The bag window shows the overflow slots in red after the bag's own.
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

1. **The list:** is anything missing, merged or named differently? (For example, Water as its own category apart from ale and liquor; or Resource and Trade good as one category, "Goods".)
2. ~~Quest items~~: decided: they take a bag slot, and the bag overfills (§4a).
3. ~~Valuables~~: decided: now (§4b).
4. **Bag tabs** (the tabs across the top of the bag window, grouping what you carry): All · Equipment · Supplies · Goods · Trophies and valuables · Quest. Right, or grouped otherwise?
5. **Overfill:** −4% pace a slot over, never below −60%. Right?
