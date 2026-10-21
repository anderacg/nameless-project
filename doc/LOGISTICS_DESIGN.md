# Logistics: food and water as supply pools, the pack train, march preview: design

Status: **design only** (owner, 2026-10-21: "everything just design for now, not implement yet"). It builds on the owner's general design, [army-logistics-food-water-design.md](army-logistics-food-water-design.md) (its UI reference: [assets/army-logistics-ui-reference.png](assets/army-logistics-ui-reference.png)), and on Supply as built ([SUPPLY_DESIGN.md](SUPPLY_DESIGN.md), `world/supply.js`, 2026-10-21). Nothing here is built.

**The owner's decisions (2026-10-21):**
- **Food and water both become pools.** Neither is kept as bag items any more.
- **Pack animals and carts:**
  - bought at stables (mules, camels) and in towns (carts, wagons);
  - taken as loot after a battle, when the enemy had some;
  - found in encounters.
- **Design first.** The phases below wait for the owner's go.

## 1. Why

Today the band's food is bag items (grain, meat, cheese…), and its water is bag items too: waterskins filled to 2 days. The bag limits both:
- a lone hero's skins hold 8 water;
- a big band's food crowds out its loot.

The owner's design moves both into **supply pools**, measured in **days**. What limits them is **what the band can carry**: its men, its mounts and its **pack train**. Its UI reference puts food and water first, as days, with a march preview that shows where the march fails.

## 2. The two pools

Both live with the band, beside your hero's record (`BAND`, `world/supply.js`), never inside it.

| | Food | Water |
|---|---|---|
| **Unit** | 1 Food = one man's food for a day | 1 Water = one man's water for a day on the march |
| **Kept by kind** | grain, meat, fish, milk, cheese, fruit… (shown as one number) | water, ale, liquor (shown as one number) |
| **Why by kind** | spoilage stays (fresh food spoils, grain and cheese keep), and so does the varied larder's morale (3+ kinds) | ale and liquor keep their effects (slower drain, morale) |
| **Shown** | **days left** at the current rate, with `current / capacity` beside it | the same |

**Converting from goods (data, one table, `PROVISIONS`):**
- One bag item of a food today feeds 4 men a day, so **1 food good = 4 Food**.
- **1 water = 1 Water.** The skins' "ration of 6 man-hours" is retired.
- **Ale = 1 Water** (and its effect). **Liquor = 1 Water** (and its stronger effect).

Anything that gave food goods now feeds the pool instead:
- buying at a market (§5);
- loot, hunting and the hunters' encounter;
- quest rewards and estates' plunder.

**Consumption** stays hourly, as Supply runs it now, with the same modifiers (march ×1.5, frost, Forced March, the Quartermaster…). Only the units change: Food from the food pool, by kind (fresh first, as today); Water from the drink pool (water first, or liquor first when chosen).

**What the bag keeps:** gear, trade goods (cloth, iron, spice…), letters, trophies. Food and drink goods can no longer sit in the bag: a food or drink good that would go into the bag goes to its pool instead.

## 3. Capacity: what the band can carry

```text
capacity (each pool) = men × per man  +  your mount's packs  +  the pack train
```

| Source | Food | Water | Notes |
|---|---:|---:|---|
| Each man (troops, companions, you) | 3 days | 2 days | what a soldier carries on his back |
| Your mount (the Pack Mule today: slots 4) | +20 | +20 | your own saddlebags |
| **Pack train** (§4) | per animal or cart | per animal or cart | the main way to carry more |

**Over capacity:** the band is slower, as the owner's design says: pace ×0.85 up to 125% full, ×0.7 beyond. Nothing is thrown away; you choose what to drop in the Supplies window.

**Prisoners and wounded** eat and drink, but carry nothing.

## 4. The pack train

A band-level list of carriers (`BAND.train`), separate from your hero's mount. They follow the band on the map and wait behind the lines in battle.

| Carrier | Food | Water | Pace | Where it comes from | Notes |
|---|---:|---:|---|---|---|
| **Pack mule** | 30 | 30 | — | every stable | cheap, sure-footed |
| **Pack camel** | 25 | 60 | — | desert stables | the desert's carrier, needs little water itself |
| **Ox cart** | 80 | 60 | ×0.92; slower off road | towns (a carpenter or the market) | carries much, hates hills and woods |
| **Wagon** | 140 | 100 | ×0.88; much slower off road | towns, cities | the bulk carrier of armies |
| **Horses** (spare) | 15 | 15 | — | stables | |

**How you get them** (owner):
- **Bought** at stables (mules, camels, spare horses) and in towns (carts, wagons). The stable's place page and the market grow a "Pack train" row.
- **Loot after a battle**, when the enemy had some:
  - lords' parties, caravans and big bands carry a train;
  - win the fight, and part of it can be yours, chosen on the loot screen.
- **Encounters**, already on the road:
  - the **abandoned cart** (a trace): repair it (Engineering, or materials) and take it;
  - the **cart stuck in the mud**: the farmer may sell it, or give it for the help;
  - the **runaway horse**: caught, it can join the train instead of being sold.

  New kinds can add more (a mule trader; a caravan's master selling a spare camel).

**Upkeep:**
- Animals eat from the food pool (they count as mouths, as mounted men do today).
- Carts and wagons need no food, but the band's wages rise a little for the drovers.
- Fodder as its own pool is later (§9).

**Risk:**
- Raiders and bandits want the train. A band with a big train is seen from farther away.
- A lost battle or a caught flight can cost carriers and the supplies on them: the rearguard rule, extended.

**On the map:** drawn following the band. The engine's mule, camel and cart figures exist for caravans and herds.

## 5. Getting supplies

| How | What it does |
|---|---|
| **Buy** at a market | "Provision" on the market page: **fill to target**, **+1 day**, **+3 days**, or by kind. It buys the holding's food goods (its stock drops and its price rises, as trade does today) and puts them in the pools |
| **Wells and water** | free water as now: at a holding's well, beside a river, lake or oasis, filling to capacity at once |
| **Auto-resupply** (§6) | in a friendly holding, top up to your target days at market price, without a click |
| **Hunt and forage** (§7) | from the land |
| **Loot** | the enemy's supplies after a battle, up to your capacity |
| **Encounters and quests** | gifts and rewards in Food or Water |

## 6. Policies (one choice each, on the Supplies window and the action ring)

| Rations | Effect |
|---|---|
| **Normal** | as now |
| **Rationing** | consumption ×0.75; morale −1 every 6 hours; the wounded heal ×0.75 |
| **Emergency** | consumption ×0.5; morale −1 every 2 hours; stamina comes back at half speed. For a desert crossing gone wrong |

| Resupply | Effect |
|---|---|
| **Target reserve** | 3, 7 or 14 days |
| **Auto-buy in friendly holdings** | on or off; it never spends your last 50 gold |

## 7. Foraging

- **A camp order: Forage.**
  - Each hour in camp, your band gathers Food and Water from the land.
  - Food: farmland and forest give the most, hills less, desert and snow almost nothing.
  - Water: beside water, the most; dry land, little.
  - Survival raises the yield, and so do Hunting and the hunters among your troops.
- **The land runs dry:** each region (a chunk of the map) keeps a forage level that recovers over days. It is saved, in the world part.
- **Costs:**
  - foraging on a holding's land costs reputation there (its peasants' food);
  - a foraging camp is seen from farther away.
- **It solves short emergencies, not long marches** (the owner's balancing principle).

## 8. The march preview

When you pick a destination more than half a day away, a bar at the bottom shows the march before you go. It is the reference image's March Preview.

```text
March to Brookhollow — 3 days
Food on arrival: 4 days · Water on arrival: 0 days
⚠ Water runs out on day 2 (dry hills). A well at Millbrook, day 1 — 2 h off the road.
```

- The route comes from the router (World Phase 2's way graph and `Router.days`).
- Along it, the preview counts the hours over each kind of ground (march, rough, desert, frost).
- It adds the free water on the way: wells of holdings you pass within reach, rivers, lakes and oases next to the route.
- It counts friendly holdings where auto-resupply would buy.
- It marks the **first failure** (food, water or furs) and the **nearest fix** (a well, a holding, a river) with its detour.
- **The full map (M)** draws the route coloured by supply: green fine, yellow low, red failing. Wells, oases and friendly holdings show as supply points.
- The preview is a projection only; nothing is spent until you march.

## 9. Later (not in the phases below)

- **Fodder** as a third pool for mounts and pack animals (grass on the march, hay in winter: Phase 5's seasons).
- **Convoys:** your caravans (`world/caravans.js`) deliver to your band or to a depot; enemies can raid them.
- **Several armies:** companion-led parties (they can lead today) get their own pools and train, shown on the map and in a Logistics tab.
- **Supply points as objectives:** wells, oases and granaries as sites to hold or deny; a siege cuts a holding's supply (Besieged).
- **Map overlays:** water access, forage left, supply range.
- **The baggage in battle:** the train behind your lines, a target for the enemy's cavalry.

## 10. What changes in today's code

- **`world/supply.js`:** the pools by kind replace the bag's food and drink goods. Capacity, the train and the policies are added. The hourly eating and drinking keep their rules, in the new units. `fillSkins` becomes "fill to capacity". The card shows `days` and `current / capacity`.
- **Inventory:** food and drink goods never go into the bag (`invAdd`'s food branch goes to the pool). The market's food rows become **Provision**.
- **Loot, hunting, encounters, quests:** their food rewards go to the pool. The supply job (`world/quests.js`) delivers from it.
- **The trade window:** you sell from the pool (sell surplus food), and buy into it.
- **New:** `data/logistics.js` (`PROVISIONS`, `CARRIERS`, the policies' numbers), the Supplies window (frame rule: header, the two pools with days, the train, rations and resupply, Provision presets; Back and Close), the march preview bar, the pack train on the map.
- **Saves:** `BAND` gains the pools, the train, the policies and the forage levels (the world part). No migration, as agreed for every save: a save from before starts a new game.
- **Fingerprints:**
  - Moving the starting food out of the bag changes your hero's record, which every battle snapshot hashes whole. So this moves the battle fingerprints and W7/B2 **once**, a deliberate re-record with its reason.
  - Every later phase keeps them.

## 11. Phases and effort

| Phase | What | Effort |
|---|---|---|
| **1. The pools** | Food and water as pools by kind (spoilage, variety, ale and liquor kept); capacity from men and your mount; over capacity slower; buying and selling into the pools (Provision: fill to target, +1, +3); loot, hunting, encounters and quests into them; the card and the Supplies window. The one fingerprint re-record | **L**: 1 agent, the biggest piece: it touches the inventory, trade, loot, hunting, quests and many tests |
| **2. The pack train** | `CARRIERS`; bought at stables and in towns; won as loot (the loot screen's train row); the encounters (abandoned cart, the mud cart, the runaway horse); drawn following the band; pace and off-road costs; upkeep; lost on a defeat | **M** |
| **3. The march preview** | The projection along the router's route; the bottom bar; the first failure and the nearest fix; the full map's coloured route and supply points | **M** (can run beside phase 2) |
| **4. Policies and auto-resupply** | Rations (normal, rationing, emergency); target reserve; auto-buy in friendly holdings | **S–M** |
| **5. Foraging** | The Forage camp order; forage levels by region, recovering, saved; reputation and being seen | **M** |
| Later | §9 | **L** |

Phases 2 and 3 can run as two agents in parallel once phase 1 is in. 4 and 5 follow.

## 12. Questions for the owner

1. **Units:** 1 Food and 1 Water = one man for a day. Is that the right scale?
2. **What each man carries:** 3 days of food and 2 of water. Is that right?
3. **Over capacity:** slower (×0.85, then ×0.7), and nothing lost. Or should part spoil or be left behind?
4. **Carts and wagons off road:** how much slower in forest and hills?
5. **Loot of the train:** all of it, or part, chosen on the loot screen?
6. **Auto-resupply:** on by default?
7. **Foraging on holdings' land:** a reputation cost only, or can it anger the realm (hostility) when you strip a village's fields?
