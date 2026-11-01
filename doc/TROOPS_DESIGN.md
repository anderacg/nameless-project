# Troops: the Peasant Levy, the enlisted tree, horses and kept skills

Status: step 1 built 2026-10-31, uncommitted (the humans' tree, upgrades at a barracks, horses, kept skills, the rare mage); steps 2 to 6 designed.

Builds on the unit model (whole units, unit slots, per-kind sizes, willing pools, Replenish).

The owner, 2026-10-31:
- "add peasant levy (which is the farmer or other workers, and rename all of that into just peasant levy)";
- "every tier after levy require enlist";
- "to upgrade to cavalry unit you also require horse";
- "upgrading won't loose skills of that unit, so the lower tier skills/trait should be relevant for upgrading path";
- a dismount system ("they can fall off horses or dismount horse so that they can use ground skill");
- mages "at large holding, high prospect, ... very rare to come across", "should not be upgrade from archer";
- "make name generic";
- each people unique (gaps kept as flavour);
- free volunteers "come as Peasant Levy";
- call-ups at your holdings and "under contract as well";
- wealth decides more of what is on offer ("I'll decide more later");
- the tree drawn by the owner.

## 1. The rule

**Peasant Levy** is the only levy:
- called up at your holdings, and your liege's under contract (step 2);
- or free volunteers;
- serves a season (step 3);
- paid in food.

**Everything above it is enlisted:**
- each upgrade is done at a barracks, for gold, and for a horse a man into a mounted kind;
- never in the field;
- the unit is paid wages after.

A barracks also hires tier 1 directly, as whole units from its willing pool.

## 2. The humans' tree (built)

```
                 ┌─ Spearman ──┬─ Pikeman
                 │             └─ Lancer        🐎
Peasant Levy ────┼─ Bowman ────┬─ Longbowman
  (tier 0)       │             └─ Mounted Archer 🐎
                 ├─ Footmen ───┬─ Shield Men ─── Shield Guard
                 │             └─ Squire 🐎 ──── Knight 🐎🐎
                 └─ Crossbowman ── Arbalester

  every arrow: an upgrade at a barracks, gold      🐎 a riding horse a man   🐎🐎 a war horse a man
  Battle Mage: hired only, rarely, at a large prosperous holding (no road from the archers)
```

| Kind | Tier | From today's | Note |
|---|---|---|---|
| Peasant Levy | 0 | the six trades | One kind (each people's farmer, `peasantLevy`), a unit of 20. The other trades are only the estate workers' looks. |
| Spearman | 1 | Levy | renamed |
| Bowman, Footmen | 1 | same | |
| Crossbowman | 1 | new | short range, hard hits, slow; looks and portrait borrowed |
| Pikeman | 2 | Pikeman | was tier 3, a sixth weaker |
| Lancer | 2 | new | a mounted spear; Squire's portrait for now |
| Longbowman | 2 | same | |
| Mounted Archer | 2 | Mounted Archer | was tier 3 from the Squire, a sixth weaker |
| Shield Men | 2 | Man-at-Arms | renamed, now from the Footmen |
| Squire | 2 | same | no longer hired: from the Footmen |
| Shield Guard, Knight | 3 | same | Shield Guard from the Shield Men |
| Arbalester | 2 | same | now from the Crossbowman |

Out of the tree (no one hires or trains them; their data kept for now): Swordsman, Sword Sergeant, Greatsword.

## 3. Upgrades (built)

- **Where:** at a barracks (a holding with one, not sacked, raided or in turmoil), at rank 5 (a Peasant Levy: its experience full), for its training price a man (`trainCost`).
  - A tier-3 or caster upgrade also needs an expert trainer of its role there.
  - Your own trainers give lessons in camp, never upgrades.
- **Horses:** one a man into a mounted kind (`ST[k].horse`, a riding horse by default; the Knight a war destrier). None when it rides the same as before.
  - Your spare horses (in your bag) are used first.
  - The rest are bought at that holding's stable at its own price, if it sells them, the same economy as your mount.
  - The barracks' Train tab shows them on the button ("6 riding horses (2 yours)"), and why when it can't ("none for sale here").
- **The Army window:** shows each upgrade's place, price, trainer and horses, with no button.

## 4. Kept skills (built)

An upgraded unit starts its new kind's ranks at 1, but keeps what it learned:
- **Its ladders** (`g.learned`: each ladder's best rung) and its mastery picks (`g.keptPicks`, Drill aside) are kept.
- **Battle** reads its own ladder and its kept ones (`rankRungs`).
- **The Army window** lights the kept rungs of its own ladder and lists another ladder's under "Kept from its past".
- **Foot drills** (`foot`: Brace, Hedge of spears) are kept, but off while it rides: a Lancer from Spearmen keeps Long reach and Rally on horseback, Brace and Hedge come back on foot (step 4).

The tree keeps skills relevant along it:
- the spear ladder runs Spearman → Pikeman (all of it) and Spearman → Lancer (all of it, the foot drills on foot);
- the bow ladder runs Bowman → Longbowman and → Mounted Archer.

## 5. Mages (built)

A Battle Mage is no longer trained from the Bowman. A city (or a town, at `MAGE_HIRE.town` of it) whose prosperity is over `MAGE_HIRE.pros` (60) has, each week, a chance of one for hire (`MAGE_HIRE.chance` × how far over, 10% at 100). It's rolled on its own stream (`rngOf('mages')`). Other peoples still train theirs from their archers until their trees are done.

## 6. Sizes

Peasant Levy 20; then `UNIT_SIZE`: foot 15, ranged 10, mounted 6 (a kind's own `size` first).

## 7. Steps

1. Built: the humans' tree, upgrades at a barracks, horses, kept skills, the rare mage.
2. **Call-up.**
   - Call up the levy (Peasant Levy units) at your holdings and your liege's under contract.
   - Free volunteers come as Peasant Levy.
   - The barracks' third section.
3. **Service.**
   - A Peasant Levy unit serves a season (30 days), then goes home, unless enlisted or kept on at a wage.
   - Morale and desertion when far or long.
   - The holding's work lost while they serve.
4. **Dismount.** Built (2026-10-31; `battle/dismount.js`, `data/dismount.js` `DISMOUNT`; prototype/README.md "The dismount").
   - Dismount and Mount orders in battle (unit abilities, J and P): the men step down where they stand, their horses left there; at Mount each walks back to his own and mounts, enemies near or not.
   - A charge, a hard blow or braced spears throw a rider: down a moment, then back up on his own unless an enemy is near.
   - A horse has its own health and takes a share of the hits (missiles and spears more); killed, its rider fights on foot to the end.
   - Skills on foot or mounted: on foot a rider's stats are his kind's on foot, so his foot drills work again.
   - Horses lost in battle stay lost: the men without one start the next fight on foot; refills come without; a stable sells them (Horses for your riders). Lords' armies keep no count.
   - Not yet: the AI ordering its riders down; Dismount during deployment.
5. **Wealth.** What a barracks offers, and how often, by prosperity and size (the owner's numbers).
6. **The other peoples.** Dwarves, elves and orcs: their own trees on the same shape, unique (gaps as flavour), shown to the owner first.

## 8. Fingerprints

The roster's data (names, tiers, stats) is in every army, so every battle and world fingerprint with armies moves with step 1:
- the battle suites' hashes;
- worldprint W3 (holdings), W6 (the map drawn), W7 (the save after 3 days) and B2 (the save after a new game).

The code paths alone (kept skills, upgrades) were checked against the previous commit with the old names and stats: the actor hashes matched.
