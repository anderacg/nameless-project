# Robbing villagers, ruins, and knowing the odds: design

Status: **approved by the owner** (2026-10-19); being built. All numbers live in one tunables table per system, so they are easy to change.

## 1. Insight: what you can tell before you act

Reading a situation is earned with the **Scouting** skill (`skill('scout')`, levels 0–10). The same rule applies everywhere:

| Scouting | What you see |
|---|---|
| 0–1 | Only what anyone sees: "a group of farmers with tools", "a camp with tents". No odds. |
| 2–4 | A rough read: "They look ready to fight" / "They cower"; "Fewer than ten"; "They look stronger than your band". |
| 5+ | The full picture: exact numbers and kinds, their power against yours, and the chance in % (to resist, to be seen, to yield). |

**It applies to:**
- robbing villagers (§2);
- scouting a camp or cave (the Scout action itself still rolls; Insight decides how much is shown before you choose);
- Parley odds;
- the ruins awareness check (§4).

A tooltip on a vague line names the level that would reveal more ("Scouting 5: know their odds").

## 2. Robbing villagers

### What a worker carries depends on what they are doing

| State (`f.st`) | Goods | Coins |
|---|---|---|
| Working at the estate (`in`) | a little of their product (1–2) | 1–3 |
| On the way to the holding (`out`) | their delivery: their product, 3–6 (farmer grain, miner iron, fisher fish, woodcutter timber…) | 2–5 |
| In town, or on the way home (`town`, `back`) | none | 6–15 (just paid) |

### They may fight back

When you choose Rob, the workers decide whether to resist:

- **Their strength:**
  - the workers present;
  - estate guards within reach (as today's `estateGuards`);
  - the holding's garrison if the estate is near its walls.
- **Their nerve:** by people (orcs ×1.4, dwarves ×1.2, humans ×1, elves ×0.9); lower when they already fear you (the holding's `fear`), higher where they love their lord.
- **Chance to resist:** their strength against yours, scaled by nerve, clamped to 5–90%.
- **If they give in:** you take what they carry (the table above), with today's costs (`CONDUCT.robWorker`: reputation −8, honour −3, fear 2).
- **If they resist:** a small battle against them as the new peasant units (Farmer, Miner, Fisher…), joined by the guards if near.
  - **You win:** you take what they carry. Killing villagers costs far more (new `CONDUCT.killWorkers`: reputation −20, honour −8, fear 5, and their realm hostile for 10–20 days if not already).
  - **You flee or lose:** nothing taken; reputation −8; the holding is hostile for 5 days.
- **The Rob button** shows the Insight read (§1) under it.

### Fear and memory, by days

- A robbed worker **remembers you for 5 days** (`ROB.memory`). Killing or press-ganging their fellows makes the whole estate remember you for 10 days.
- **While they remember:**
  - their talk changes to fearful or bitter lines ("You've taken enough from us.");
  - Rob is greyed out ("They have nothing left to give you");
  - Hire is refused.
- Today's fear (workers fleeing the fields for a while) stays as is.

## 3. Ruins: treasure once, then new occupants

- A ruin's **treasure is found once**. Searched ruins never refill with treasure.
- After the cooldown (today's 40 days), a revisit finds the ruin **occupied or empty**, chosen by region and climate.
- **Peaceful occupants:**
  - **Refugees or homeless:** help them (gold or food, honour +) or chase them off (honour −).
  - **A travelling camp:** the travellers' page (trade, sellswords, campfire).
  - **A hermit:** rumours or lore for a little gold; once a visit.
  - **Rival treasure hunters:** talk, trade, or buy their map to another ruin.
- **Hostile occupants:**
  - **Bandits:** the bandit-camp page (Scout, Attack, Parley).
  - **Creatures:** the cave page (Scout, Enter).
  - **Cultists or grave robbers:** a fight, with a small loot chance.
- **Or empty:** "Only wind in the stones."
- Clearing occupants gives their loot or bounty, never the ruin's treasure again. A ruin keeps cycling through occupants after each cooldown.

## 4. Guardians: a forced fight, prevented by stats

- **Today:** about 30% of searches wake guardians, and you can still back out.
- **Change:** if guardians wake, **the fight starts at once; there is no leaving**. Three checks, all shown with the §1 Insight rules, can prevent it:

| Check | When | Uses | On success |
|---|---|---|---|
| Awareness | Before searching | Scouting + Agility | "Something stirs below…": choose Search anyway or Leave |
| Stealth | While searching | Agility, night, a small band (≤ 12) | You take the treasure without waking them |
| Lore | Reading the walls | Intellect, or a lore talent if one exists | You learn what guards it (kind, count, level) before choosing |

- **If you fail and fight:**
  - **You win:** the treasure they guarded is yours, guaranteed.
  - **You flee:** **the ruin remembers what you found.** The page then shows "Guardians: 4 × Cave Bear, level 5" with **Attack** and **Leave** only; no new roll.

## 5. Build notes

- **Files:**
  - `world/folk.js`: worker loot by state, resistance, memory;
  - `data/conduct.js`: `killWorkers`;
  - `world/sites.js`: ruin occupants, guardians memory, checks;
  - `battle/encounters.js`: the villager fight, forced guardian fights;
  - a small shared helper for the Insight reads.
- **Reuses:** the peasant troop kinds, the bandit-camp and cave pages, travellers, refugees, `parley.js`, and `PageScreen`.
- **Tests:**
  - loot by state;
  - resist odds bounds;
  - the memory lasting 5 days, then clearing;
  - treasure only once;
  - the occupant mix;
  - guardians remembered after fleeing;
  - each check;
  - the Insight levels.

  Seeded wherever the game's existing randomness patterns allow.
