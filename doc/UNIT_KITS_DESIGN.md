# Unit kits: orders, stances, formations, traits, skills, ranks and mastery

Status: **approved by the owner** (2026-11-01; answers in §11). Steps 1 and 2 built (§10). The numbers are first guesses, to tune later.

The owner, 2026-11-01:
- "I want to simplify it and make it more clean to govern the code and terms";
- "some orders should be default per kind, e.g. spear would know how to brace, but to do it better they can gain it from mastery which let you decide which to pick";
- "some skills should be considered a unit stance";
- "each unit can have multiple traits".

## 1. The seven terms

One name for each kind of thing, in the game and in the code. Each has one data table.

| Term | What it is | Who controls it | Table |
|---|---|---|---|
| **Order** | Where to go and what to do | You, per order | `ORDERS` |
| **Stance** | A mode the unit stays in until changed, at a cost | You, switched on and off | `STANCES` |
| **Formation** | The unit's shape | You | `FORMS` |
| **Trait** | Built into the kind (or race), always on | Nobody: the kind's | `TRAITS` |
| **Skill** | A burst with a cooldown | You, or Auto skills | `SKILLS` |
| **Rank** | 1–5, from experience: **stats only** | Earned | `RANKS` |
| **Mastery** | Past rank 5, five levels: **one pick each** | Earned, picked by you | `RANKS.mastery`, `KITS` |

Your hero's **Commands** (Rally the Line, Stand Fast!) are the hero's, not a unit's. They stay as they are, under `COMMANDS`.

The test between a stance and a skill: a **stance** is a mode you switch on and leave on, at a cost (no cooldown). A **skill** is a burst you fire, then wait for (a cooldown).

## 2. Orders (every unit)

| Order | How |
|---|---|
| Move | Right-click the ground. Shift queues a waypoint; a drag sets a line; Keep formation (Shift+K) moves a block |
| Attack | Right-click an enemy. Ctrl (or the button) makes it an attack-move: fight what it meets on the way |
| Charge | The button: at a run, into the enemy |
| Hold | Stand where they are |
| Withdraw | Fall back off the field |

Advance folds into Move (a move toward the enemy line).

## 3. Stances

One row each on the order bar, only the rows a unit has. A row is a toggle, or a small cycle.

| Stance | Who | Its choices | What it does, and its cost |
|---|---|---|---|
| Pace | everyone | Walk / Run | running tires |
| Discipline | everyone | Hold ground / Fight freely | hold: they keep their place in a fight; free: they chase |
| Shooting | shooters | Fire at will / Hold fire / Skirmish / Melee | as today's cease fire, skirmish and melee mode, made one cycle |
| **Brace** | spears | Off / Braced | braced: front and flanks take no charge bonus and no shock, chargers may be unhorsed, pushes barely move them. They can't move; a move order ends it. No timer, no cooldown |
| **Shield wall** | shield units | Off / On | blows and arrows from the front blocked better; slow, no charge |
| **Mounted** | riders who can dismount | Mounted / On foot | on foot: foot drills and Brace (if spears); no charge; the horses wait (`battle/dismount.js`) |
| **Pavise** | crossbows | Off / Planted | cover from arrows while reloading; can't move |

AI captains switch stances by rule: Brace when a charge comes, Shield wall under arrows, Pavise when shot at, Fire arrows against packed foot. Stances are not skills, so they never take a skill slot.

## 4. Traits

Built into the kind (and its race), always on, several per unit. Shown first on the unit card.

| Trait | Who | What it does |
|---|---|---|
| **Anti-cavalry** | spears (levies, pikes, shield-spears) | ×1.6 damage against mounted units |
| **Anti-large** | pikes, spear-armed veterans | ×1.4 damage against large beasts (`big`) |
| **Longshot** | bows | today's range trait |
| **Elven aim** | elf bows | today's aim trait |
| **Flat shot** | crossbows | a straight, hard shot, no arc to fall short; +armour piercing |
| **Charge** | cavalry | its first blow after a run hits harder, with knockdown and shock |
| **Shield block** | shield units | part of the blows and arrows from the front blocked |
| **Shoot on the move** | elf archers, rangers, mounted archers | today's trait |
| **Magic bolts** | mages | shots go through armour |
| **Scout** | scout kinds | sees further on the map and in battle |
| race traits | dwarves, elves, orcs | as today (stubborn, steady, hardy...) |

Today's one rule "spear against cavalry or big ×1.6" (`matchup`) becomes the two traits, each with its own number.

## 5. Skills

At most **5 per unit** (the owner, 2026-11-01: "can have more skills, cap may be not over than 5"): its kind's default skill, those unlocked by mastery, and those bought from the tech tree (below). They are bursts with cooldowns, on the skill bar in fixed slots: **Z, X, C** (the owner) for the first three, slots 4 and 5 on keys to choose (step 2), not a letter per skill.

| Skill | Who | Burst | Cooldown |
|---|---|---|---|
| **Lunge** | spears (their default, in Brace's old place) | for 3 s the front ranks thrust together: +25% reach, +20% damage, the enemy's front pushed back a step | 40 s |
| Rally | foot | morale +15 at once | 60 s |
| Spur | cavalry | speed ×1.35 for 3 s | 35 s |
| Rapid shot | bows | shots ×0.7 time for 8 s | 45 s |
| Volley | crossbows | one loosed together: a morale shock where it lands | 45 s |
| Scout ahead | scouts | sight ×1.6, speed ×1.25 for 12 s | 45 s |
| **Fire arrows** | bows, crossbows (fire bolts) | +damage and fear for 12 s; slower shots, worse aim while lit | 45 s |
| a spell | mages | the mage's own | its own |
| **unlocked by mastery:** Pike push, Arrow storm, Counterstroke, Heavy charge, Parthian shot, Ward | see §7 | | |

### Skills from the tech tree (the owner, 2026-11-01: "fire arrows should be skills unlocked through tech tree"; the tech tree tied to holdings, 2026-10-31)

Some skills are not a unit's own, nor its mastery's: they are bought, as a **unit upgrade at a holding's building** (the tech tree: `data/buffs.js` `BUFFS`, `world/buffs.js` `Buffs`, a building's window `ui/town.js` `buffShop`; for a whole unit, at its price a man, refills paying the new men's share). **Fire arrows** is the first: bought for a bow or crossbow unit at a holding with the right building (a fletcher's or the smith's, at a level: `need`), that unit has it as a skill. It counts toward the cap of 5. Which building sells it: later (the owner). (Not a stance, as in the first draft, nor the hero's talent tree.)
- A `BUFFS` entry gains `skill:'fire'` (the skill it unlocks) beside its stat mods; `UnitKit` reads a unit's bought upgrades for their skills.
- AI armies: a lord's archers have it by his level (a tunable), bands' never.
- More such skills follow the same way: a building's upgrade that teaches one.

## 6. Ranks: stats only

Ranks 1–5 from experience, the experience per rank as today (`RANKS.xp` by tier). Each rank above the first:

| Stat | Per rank | At rank 5 |
|---|---|---|
| Damage | +3% | +12% |
| Health | +3% | +12% |
| Aim | 3% truer | 12% truer |
| Morale | +2 | +8 |
| Vigor (stamina) | +2% | +8% |

No skill is unlocked by a rank any more. A rank-5 unit is still ready to upgrade into its next kind (`rankReady`).

## 7. Mastery: five levels, one pick each

Past rank 5 a unit's experience goes into mastery:

| Level | Experience past rank 5 |
|---|---|
| Adept | 300 |
| Expert | 700 |
| Master | 1,200 |
| Grandmaster | 1,800 |
| Legend | 2,500 |

The ranks 1–5 are named too: **Recruit, Trained, Seasoned, Veteran, Elite**. The badges keep their metal colours underneath (bronze for Adept up to gold).

Each level is one **pick** from the kind's **menu**. A menu has 6–7 options against 5 picks, so two units of one kind can turn out differently. A pick is one of:
- **unlock a skill** (up to 5 skills in all, with the kind's default and the bought ones);
- **improve a stance or a skill** (it can be taken again, as its own steps);
- **a perk:** a passive, shown under the traits, marked as earned;
- **Drill:** +1% damage, health and aim (can be taken again).

| Kind | Its menu |
|---|---|
| **Spear** | *Lunge+* (longer, harder) · *Quick brace* (bracing at once, even from a move) · *Hedge of spears* (perk: front braced even unordered) · *Long reach* (perk: +10% reach) · *Pike push* (skill: throw back a charge that hits them braced) · *Brace+* (pushes move them less, unhorse more) · *Rally+* · Drill |
| **Sword and shield** | *Iron wall* (Shield wall at walking pace) · *Counterstroke* (skill: strike back as one) · *Hold the line* (perk: not pushed) · *Cleave* (perk: blows hit two) · *Rally+* · Drill |
| **Bow** | *Steady aim* (perk: 10% truer) · *Marksmen* (perk: +10% range) · *Hot coals* (Fire arrows without the aim cost) · *Arrow storm* (skill: an area volley) · *Rapid shot+* (longer) · Drill |
| **Crossbow** | *Heavy bolt* (perk: pierces more) · *Quick reload* (perk) · *Steady aim* · *Fire bolts* (adds the Fire arrows stance) · *Volley+* · Drill |
| **Cavalry** | *Heavy charge* (perk: more knockdown and shock) · *Wedge drill* (perk: the wedge hits harder) · *Ride down* (perk: against routers) · *Outriders* (perk: faster on the map) · *Spur+* · *Rally* (skill) · Drill |
| **Mounted archers** | *Parthian shot* (skill: shoot while riding away) · *Steady aim* · *Rapid shot* (skill) · *Outriders* · *Spur+* · Drill |
| **Mage** | *Stronger spell* · *Ward* (skill: shield a unit near) · *Deep mana* (perk) · *Quick cast* (perk) · Drill |
| **Scouts** | *Keen eyes* (perk: farther sight) · *Scout ahead+* · *Steady aim* · Drill |

An upgrade keeps the unit's picks that its new kind can use (as today: "upgrading won't lose skills of that unit"), and half its mastery experience carries over (`RANKS.mastery.carry`).

## 7b. Keys (the owner, 2026-11-01: skill slots first on Z, X, C; then "stances ... maximum 3, the same keys for all kinds": the layout below, approved)

Slots by kind: a key means a slot, not a skill; with several kinds selected, each unit uses its own in that slot. The order bar shows each slot with its key and what it holds for the units selected.

| Keys | What | Examples |
|---|---|---|
| **Q W E** | stance slots 1–3 (the kind's own, at most 3) | spear: Q Brace · shield: Q Shield wall · bow: Q Shooting cycle · crossbow: Q Shooting, W Pavise · cavalry: Q Mounted / On foot · horse archer: Q Shooting, W Mounted |
| **Z X C V B** | skill slots 1–5 | spear: Z Lunge, then mastery's and the tech tree's in order (Fire arrows bought: the next free slot) |

Orders and every unit's own stances:

| Key | What | Was |
|---|---|---|
| H | Hold | H |
| G | Charge | V |
| D | Attack-move | D |
| R | Walk / Run (pace) | Q |
| F | Hold ground / Fight freely | F |
| T | Formation cycle: Line → Loose → Circle or Cantabrian circle → Wedge or Column (what the kind has) | L / T |
| O | The ring: a Circle for foot, a Cantabrian circle for horse archers (§7d); again: Line | (Scout ahead's quiet alias) |
| Backspace | Withdraw (deliberate: never by accident) | W |
| A | the AI captain | A |

Your hero's commands: **Y** Rally the Line (was R), **U** Stand Fast! (was S).

The old letters' quiet aliases (G, I, U, Y, O, N, P) go; M and S are free. Step 1 (built) has the interim layout: Z X C skills, R Rally the Line, V Charge, M Shooting, Q pace, J Mounted.

## 7c. Troop trees (the owner: "for other races just use current trees but update and migrate to new system")

The dwarf, elf and orc trees stay as they are today (`UP` in `data/units.js`). Each of their troop kinds gets its kit by its class and tags (§8), as every human one does, and its own traits where it has them (`ST[type].traits`). The Spearman → Lancer question stays for later: in this system it is only which tree the Lancer belongs to.

## 7d. The circle and the Cantabrian circle (the owner, 2026-11-01)

The owner: "the circle shape where you can order unit to form in circle, the circle size will determine whether to have unit stack by layers ... the maximum circle size is where your unit can fill a whole circle without gap otherwise you may have a gap in circle".

| | Circle (a schiltron) | Cantabrian circle |
|---|---|---|
| Who | foot who fight hand to hand; spears best (Brace) | horse archers (they shoot on the move) |
| Shape | every man facing out; the outer ring holds `files` places (radius files × spacing ÷ 2π); the rest on rings one rank further in; files past the men: one ring with gaps; too few: as few more as hold them | single file on one ring, the same size rule |
| Size | the drag across it (its width), or the march tab's drawn formation; no new saved field (`files`) | the same |
| Rules | no flank or rear: every blow on the front (arrows keep their side); Brace all round; half a walk, never runs; Charge, an attack or Withdraw break it into a line | rides its loop at a walk, shooting as it passes; a move order moves the loop's middle; Hold stops it; Charge, an attack or Withdraw break it |
| AI | a captain rings its spears against riders on more than one side, and breaks it when they go (`CIRCLE.ai`) | not used by the AI yet |
| On the map | a circle | a loose clump (`mapForm`, once `world/march.js` `marchSlots` reads it: a line requested) |

Its weakness comes from the shape: few men face any one side, and it is packed against arrows. No new damage numbers.

**Status: built (2026-11-01).** `battle/formations.js` `FORMS.circle`, `FORMS.cantabrian`, `CIRCLE`, `CANTABRIAN`, `circleRings`, `ringed`; `battlecontrol.js` `loop`; `commands.js` `ringForm` (O, and the order bar's ring button); `commander.js` (the AI's circle). The battle fingerprints held. Shelter inside the ring: later.

## 8. The kit, in code

- **`KITS`** (data): for each kind, its traits, its stances, its default skill and its mastery menu. Kinds by `unitClass` and tags: spear, foot, shield, bow, crossbow, cav, mounted archer, mage, scout. A troop type may add or remove a trait (`ST[type].traits`).
- **`UnitKit`** (one small class): a unit's actual loadout, worked out once from its kind, race, type and picks. It gives:
  - its traits, stances and skills, in slots;
  - its perks;
  - the stat bonus from its rank and Drill.
  The unit card, the order bar, the AI captains, the battle and saves all read it. Nothing else works this out.
- **Merged into it:** `UNIT_ABILITIES` (unitabilities.js), `RANK_SKILLS` (ranks.js), the trait half of `ABILITIES` (abilities.js), `FLAG_N` (commands.js) and `rankProf`.
- **Not part of it:** characters (your hero, companions, lords) keep their own skills from talents and gear. Beasts and monsters keep theirs.

## 9. AI and old saves

- **AI picks:** an AI unit picks by a default order per kind (the kind's first menu entries), so lords' veterans grow sensibly.
- **AI stances:** by the rules in §3.
- **Old saves** (no migration; defaults on load): a unit's old picks map to the new menu (`brace` to Brace+, `reach` to Long reach, and so on). A unit that had a skill unlocked by its rank keeps it as a pick, up to its picks. Its mastery experience stands; its level is read again against the new five steps.

## 10. Building it: two steps

1. **The refactor, the same game:** the seven terms, the tables, `KITS` and `UnitKit`, the order bar's stance rows and skill slots. Today's rules expressed in the new shape (rank-gated skills still gated, today's numbers). The battle fingerprints must hold.
   **Status: built (2026-11-01).** The battle fingerprints held, none re-recorded.
   - Tables: `data/kits.js` `ORDERS`, `STANCES`, `KITS` (the ladders, `RANK_SKILLS` its old name), `SKILL_KEYS`; `data/abilities.js` `TRAITS` (with `HERO_SKILLS`, `ABILITIES` as before); `battle/unitabilities.js` `UNIT_SKILLS` (the design's `SKILLS`: that name is the hero's disciplines, `data/progression.js`; `UNIT_ABILITIES` its old name); `battle/commandpowers.js` `COMMANDS` (`COMMAND_POWERS`). `FLAG_N` is made from `STANCES`.
   - `UnitKit` (`battle/unitkit.js`): kept on its record, made again when its type, rank, picks or ladders change. `rankskills.js`, `groupHasAbility` (the AI captains), the order bar and the unit card read it.
   - The order bar (`ui/battlehud.js` `bhudBar`, from the tables): Hold and the Attack-move; the stances, a row each (Pace: Charge and Walk; Discipline; Shooting, one cycle; Shield wall; Mounted); the formations; the skill bar's three slots; Withdraw last, on the right. Today's buttons kept their data attributes and order (the command fingerprints read them). On a phone, one grid of six a row.
   - Keys: Z X C the slots (each selected group its own skill there), R Rally the Line, V Charge, M the Shooting cycle, **Q the Pace** (R's old job), **J Mounted** (Dismount while any rider is up, else Mount), B Shield wall, F Discipline, S Stand Fast!. **G and the old letters (I, U, Y, O, N, P) are quiet aliases** of their skill, not on the bar nor in the Help. E is free.
   - Dismount and Mount are the Mounted stance's buttons now, with their cooldowns, never in a skill slot. A group with more than three skills (none today) would show the rest past C, with no key.
2. **The new rules:**
   - ranks give stats only;
   - five mastery levels and the menus;
   - Brace, Shield wall, Fire arrows and Mounted as stances; Anti-cavalry and Anti-large as traits;
   - the skill cap of 5.
   The battle fingerprints move: re-recorded with the reason "unit kits (the owner)", with proof by a switch for each part.
   **Status: built (2026-11-01).** Each part behind its own switch, on in the game: `RANKS.statsOnly` (ranks' stats, §6; no skill from a
   rank, the kinds' default skills), `RANKS.mastery5` (the five levels, the menus: `data/kits.js` `MASTERY`, `KITS.kinds`), `KITS.brace`
   (Brace and Pavise stances: `battlecontrol.js` `plant`; Lunge), `KITS.traits2` (Anti-cavalry, Anti-large), `KITS.cap` (five skills, the
   tech tree's: `BUFFS` `skill`, Fire arrows, its building a placeholder; an AI lord's archers from `KITS.aiFire`), `KITS.keys2` (§7b's keys,
   the stance slots on the order bar). The step-1 suites run with all of them off (`tests/kit.js` `Kit.kits`); step 2's rules:
   `tests/kits2.js`. Choices made in building it: old picks map brace→Brace+, reach→Long reach, aim→Steady aim, marks→Marksmen,
   rally→Rally+, rapid→Rapid shot+, fire→Hot coals (a bow's rank-2 Fire arrows kept as a pick, Fire arrows); the Mounted stance keeps
   Dismount's and Mount's cooldowns (data/dismount.js); slings and javelins a Thrower kind (Rally; Steady aim, Marksmen, Rally+, Drill);
   Outriders is +8% speed in battle (on the map: a line in world code to come); Deep mana is +10% range and 10% truer; Cleave, a second foe
   beside the first for half (from `morale.js` `moraleHurt`); skill slots in the order kind, mastery, tech tree (not the order bought).
   **Balance pass (2026-11-01):** the AI braces in time. `commander.js` `chargeIn` reads a charge's run-up, and a captain braces from
   `braceAt` 180 px, about `braceT` 1.9 s off, holding it `braceKeep` 120 px once the riders turn away; Pikemen now beat Knights head-on.
   The battle lab counts a rank's morale (`lab.js` `unitMoraleOf` plus `rankMor`), as a battle does. `aishare` re-recorded with both, proof
   by reverting each.
   **Upgrades never lose men (2026-11-01):** a group trains up by whole units of its new kind. 7 levies into Lancers (a unit of 6) make
   6 Lancers, the last levy kept, if a unit slot is free (`ArmyRoster#upgradeCount`, `upgradeSplits`); with no free slot, only a kind
   whose unit takes them all. A lord over his unit slots trains none (`realms.js` `lordRecruit`; it lost the men before).

## 11. Questions for the owner

Answered (the owner, 2026-11-01):
1. **Brace with no timer:** yes. Spears get a skill in its place: **Lunge** (§5).
2. **The numbers:** ok for now, to adjust later.
3. **The skill keys:** Z, X, C (§7b).
4. **Names:** words, not metals: ranks Recruit to Elite, mastery Adept to Legend (§7).
5. **Troop trees:** the current trees, moved onto the new system (§7c).
