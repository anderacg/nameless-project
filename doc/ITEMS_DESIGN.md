# Items: categories: design

Status: **design only** (owner, 2026-10-21: "item should have type, for example, Quest item, Food, Water, Resource etc."). Nothing here is built. It comes before logistics phase 1 ([LOGISTICS_DESIGN.md](LOGISTICS_DESIGN.md)), which routes food and drink by category.

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
| **Quest item** | the sealed letter, an heirloom, a found map | **bound:** cannot be sold or dropped; takes no bag room; leaves when its quest or chain ends |
| **Valuable** | jewels, relics (later: loot of lairs) | sell; light, worth a lot |

**The rules live with the category**, not in scattered checks:

| | What it decides |
|---|---|
| `bag` | does it take bag room (Food, Drink, Carrier and Quest item: no) |
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
- **Bound** to their quest: no Sell, no Drop, no bag room, a mark on the icon.
- **Gone** when the quest or chain ends: delivered, failed or abandoned (`quest:ended`, `thread:ended` on the bus).
- The story system's outcomes (`story/outcome.js`) give and take them: `item: {give: id}`, `item: {take: id}`.

## 5. What changes in code

- `data/items.js` (new): `ITEM_CATS` and each data entry's `cat` where its kind's default is wrong.
- `core/items.js`: `ItemKind.cat(rec)`; the verbs and room ask it; `itemKind` unchanged.
- `core/inventory.js`: `add` routes by the category (the bag, the pools, the train); room counts only `bag` categories.
- `ui/inventory.js`, the trade window, the loot screen: tabs and grouping.
- **Saves:** unchanged. A category is read from the data, never saved.
- **Fingerprints:** unchanged, so long as nothing's route changes. Food and drink only change their route with logistics phase 1, which carries that re-record.

## 6. Effort

**S–M**, one agent. Best built just before logistics phase 1, or as its first step.

## 7. Questions for the owner

1. **The list:** is anything missing, merged or named differently? (For example, Water as its own category, or Drink covering water, ale and liquor.)
2. **Quest items:** no bag room at all, or a small separate quest pouch?
3. **Valuables** (jewels, relics) as a new kind of loot: now, or with lairs and treasure later?
4. **Bag tabs:** are the five above right?
