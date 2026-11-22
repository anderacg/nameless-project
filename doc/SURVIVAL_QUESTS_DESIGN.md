# Optional survival quests

Implemented on `codex`, 2026-11-22. `world/survivalquests.js` registers two side-quest kinds, a world-frame guide and optional saved preferences. It uses the existing quest tracker, map markers, wildlife, carcasses and waterskin filling. It creates no animals, supplies or extra rewards.

When food or drink falls below half a day, or the company is hungry or thirsty, a nonmodal HUD popup offers Hunt for food or Find drinking water. Track wildlife / Find water accepts and tracks the task. Not now and × dismiss it; ignoring it expires it after 25 real seconds. Travel, pause and speed remain under player control. Offers do not appear during battles, dialogue, captivity or quiet test simulation.

Each need prompts once per low-supply episode. Its suppression survives saves and clears once that need recovers; a 12-game-hour cooldown also prevents rapid repeated offers after completion or abandonment. Army → Condition → Company rules contains Survival tips: On/Off. Turning tips off does not discard accepted tasks.

The desktop tracker sits below the minimap. On portrait phones, the survival popup fits beside the minimap and stacks below tracked objectives; its description and buttons keep a readable block layout. Both use the current HUD materials and button states.

Hunting searches living individual wildlife positions, excluding livestock, dead animals and unreachable land. Hidden game receives a search-area marker instead of a precise visible-animal marker. An accepted task refreshes its goal as wildlife moves or disappears. Nearby fresh wildlife carcasses with meat become collection targets. Meat actually collected completes the task; merely killing, opening the loot window or leaving the meat does not. Normal resupply also closes a task whose need has passed.

Water guidance compares admitted settlement wells with reachable dry ground within actual water-filling reach. It searches banks within 80 tiles and uses a reachable well as fallback. Without any water containers it points to a settlement so the player can obtain empty skins. It completes when water is actually acquired, or the company otherwise becomes supplied. Targets update while exploring. Water searches cache for up to 15 seconds while the player stays within four tiles and container/reach conditions are unchanged.

Accepted tasks are ordinary saved `P.quests` records, shown in Side quests, trackable on map and abandonable without a penalty or deadline. Completion archives the task and removes tracking. There is no turn-in, XP/gold bonus, reward modal or battle summary. Derived search caches and the transient popup are not saved. Default preferences with no prompts add no world-save fields.

`world/carcasses.js` now emits the existing `meat:hunted` event for meat actually taken from wildlife carcasses. A saved remaining-yield count prevents putting meat back and collecting it again from counting as another hunt. Existing hunting jobs can also receive this actual collection progress.

Checks: `tests/survivalquests.js` covers target choice, real water reach, optional prompt controls, suppression/save-load, normal quest tracking/serialization, carcass collection, completion and abandonment. `structure`, `quests` and `carcasses` cover integration. No generator, sprite or combat changes.
