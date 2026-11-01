# Battle AI: a commander who observes, plans and commits

Status: **planned, not built** (the owner, 2026-11-01: "please keep this in the future development"). Nothing here is in the game yet. Open questions for the owner are in §6.

The owner, 2026-11-01:
- "what do you think you can improve AI command in the battle (all)? it seems like they tend to spam movements";
- "what i think is it should observe what's going on first then order something based on their play style or tactics";
- "I want a realistic and challenging, smart AI".

## 1. Today

Every captain (`battle/commander.js` `Commander`, `EnemyCommander`; your allies and your army under the AI use the same class) thinks every `FOE_CMD.think` (0.5 s). Each think reads the whole battle afresh and works out every group's orders from where everyone stands at that moment.
- **Why it twitches:** a foe who drifts a few px drifts every move target with him, so groups re-path, turn and re-form instead of acting.
- **No commitment:** attack and defend have some hysteresis (`hold`), but an order is never kept because it was given.
- **What to build on:**
  - tempers (`TEMPER_SAY`, `temperFor`);
  - shooter postures (`rangedMode`: aggressive or safe);
  - the cavalry's phases (approach, charge, recover);
  - brace timing (`chargeIn`);
  - rally, falling back (`fallsBack`, `beatenArmy`), `assess`, scouting (`scout`, `search`).

## 2. What a good commander does

1. **Observes, then decides.**
   - **What it knows:** only what its side sees (the battle's fog, `seenBy`). Unseen groups are guessed from where they were last seen.
   - **Reaction delay:** it acts after a delay by its skill, about 1 s for a seasoned lord and 3 s for a bandit chief.
2. **Makes a plan and follows it.** At the start it reads what it faces (the foe's make-up, the ground) and picks a plan that fits its style:

   | Plan | How it fights |
   |---|---|
   | Hold and shoot | holds a hill, lets the archers work, charges when the foe is worn |
   | Hammer and anvil | infantry pins the foe; cavalry swings round onto a flank or the archers |
   | Refused flank | strong on one wing, weak on the other |
   | Skirmish and bait | horse archers harass and lure the foe out (the Cantabrian circle, `FORMS.cantabrian`) |
   | All-in rush | a wild charge |

   - **Steps and triggers:** a plan has steps, e.g. "advance to X; hold till their line is within 80 px; when their cavalry commits, release the reserve".
   - **Re-planning:** only on real events: first contact, a flank laid open, a group broken, a step done, or the plan failing.
3. **Commits to orders.**
   - Each order holds for a minimum time.
   - It changes only when the situation clearly changes: the target moved past a threshold, or a new threat appeared.
   - Targets are rounded, so a small drift never causes a re-path.
4. **Has a limited attention budget:** so many orders a second, more for a better tactician. It removes the spam outright, it is realistic (no general handles everything at once), and it is a fair difficulty dial with no cheating stats.
5. **Keeps reserves and times its moves.**
   - A group held back is committed where the foe's line wavers or a flank opens.
   - The arms work together: cavalry strikes once the infantry has engaged, not before; archers shoot what their infantry is about to meet.
6. **Reads the foe.**
   - **Spots weaknesses:** exposed archers, a lone group, an open flank, tired troops.
   - **Counters cavalry:** braced spears, or the circle (`FORMS.circle`).
   - **Rotates:** pulls a spent group back and swaps a fresh one in.
7. **Commands in its own style.**
   - **By race and faction:** orcs swarm and flank, dwarves form shield walls and hold, elves skirmish and kite, humans mix arms.
   - **By lord:** each lord's temper and tactics skill on top.
   - **Bandits:** poor generals, slow to react, few plans, quick to break.

## 3. Shape in code (a proposal)

- **`BattlePlan`:** one per captain. Its plan type, its steps, each step's trigger, and its reserve.
- **A style table:** plain data (e.g. `AI_STYLES`) by faction, race and lord temper: reaction delay, attention budget, preferred plans, risk.
- **Orders through one gate** (e.g. `Commander#order(g, kind, target)`): it applies the commitment time, the change threshold, target rounding and the attention budget, so every arm's code issues orders the same way.
- **Perception:** what the captain knows (seen groups, last-seen places), read through the reaction delay.
- **Switches:** one per part, so each can be turned off. The fingerprints' proof needs them, and so does tuning.

## 4. Building it: three steps

1. **Stop the spam** (small to medium; one agent, one session).
   - **Scope:** order commitment, change thresholds, rounded targets, the attention budget and the reaction delay, on top of today's captain.
   - **Measure:** orders per group per minute in AI battles, before and after. The aim is a few a minute outside melee.
2. **Plans and styles** (medium to large; two or three agent sessions, split by area).
   - **Scope:** `BattlePlan`, the plan types of §2 with steps and triggers, and the style table.
   - **Testing:** scripted battles per plan check it does what it says (hammer and anvil hits the flank after the lines meet, not before).
   - **Tuning:** a round or two of the owner's play-tests.
3. **Reading the foe** (large and open-ended; in small pieces, each a feature of its own).
   - **Scope:** weakness spotting, reserves, rotating tired groups, baits and feigned retreats.

## 5. Tests and fingerprints

- **Fingerprints:** every step changes how battles play out, so the battle fingerprints move: `actorrules`, `attackrules`, `battlecommands`, `battleresolution`, `battlesetup`, `aishare`, `terrain`, `rts`. Each is re-recorded with its reason and proof (that step's switch off gives the old value).
- **Suites to re-check:** the AI suites, `aishare`, `aitactics`, `controlaudit`, `rts`.
- **Balance checks:** some may need retuning, e.g. Pikemen against Knights (`tests/kitbalance.js`).

## 6. Questions for the owner (open)

1. **Fair or omniscient:** does the AI know only what its side sees? The proposal is yes: fairer, and it lets you ambush and surprise it.
2. **Styles:** from race and faction plus each lord's temper and skill (proposed), or per lord only?
3. **Difficulty:** a setting (reaction time and attention budget), or one standard?
4. **Your army under the AI** (the A key): the same brain, in your army's style?
5. **Order:** step 1 first (proposed); it fixes the twitching and does not depend on the rest.
