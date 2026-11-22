# Company rules

Implemented on `codex`, 2026-11-22. Optional rules reduce repeated supply, rest and battle orders. New games and saves without rules remain manual.

`world/companyrules.js` owns preferences, the interrupted journey and duty decisions. It registers before marching and saves through `Saves` as `companyRules`; an untouched company adds no save fields. The existing market, camping and BattleControl services perform the work.

Army → Condition contains Auto resupply and Rest on journeys. Resupply runs once on an admitted settlement visit, before the market bargain is built. It buys the cheapest available food up to two marching days, buys missing empty waterskins and fills them at the well. Normal stock, changing prices and reputation apply; automatic purchases never add pack overflow. It keeps the larger of 100 gold or two days of wages, and skips food purchases when the settlement has less than three days of food. It never sells equipment or buys while merely passing a settlement.

An ordinary journey pauses at 25% stamina and resumes at 85%. Existing legal campsite search and approach are used; without a campsite the company rests in place. A chase, follow, siege, raid or stay is not interrupted. New travel orders, manual camp controls, danger and battles cancel the planned continuation. A saved rest retains its destination, including a save during the campsite approach. No automatic rest starts where supplies prevent stamina recovery. Resting does not pause the world or prevent enemies from approaching.

Army → Roster → troop group → Edit contains Battle duty: Manual, Protect me, Hold line, Support or Skirmish. Duties use persistent group IDs, so reinforcement, wounds and whole-group upgrades retain the choice. A newly split group starts manual; a merge keeps the destination group's duty. Protect follows near the hero, Support follows farther behind, Hold line anchors to the group's initial position, and ranged Skirmish chooses a firing distance from a visible foe. Melee skirmishers protect the hero. Existing attack-move, skirmish eligibility, terrain routing and world battle constraints apply. Hero and companion groups retain their own behavior.

A direct order suspends a duty for the rest of the encounter; the next encounter uses the saved choice again. Full AI ownership takes priority. Duties do not run during deployment, muster, surprise holds, tournaments, or after battle resolution. Runtime duty notes live outside battle snapshots. No renderer or generator randomness changes.

Verification: `tests/companyrules.js` covers opt-in defaults, save/load, purchases and reserve, stock accounting, journey recovery and cancellation, battle duties and manual/AI priority. Existing structure, supply and battle command checks cover integration. Equipment automation and progression changes remain outside this first pass.
