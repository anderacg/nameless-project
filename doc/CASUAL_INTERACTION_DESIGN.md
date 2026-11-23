# Direct battle controls and equipment comparison

Implemented: direct battle clicks/taps, shared compact selection feedback, progressive phone orders and pre-purchase smith previews.

Ordinary clicks/taps select friendly fighters; with a selection, enemy and ground taps issue the existing attack/move commands. The All selection works the same as individual groups. World combat retains individual targets, visibility checks, joining rules and disengagement. Mouse drag, Shift selection, right-click and long-press/formation gestures remain separate. Finished battles ignore new ordinary commands.

The existing status panel adds one compact row with selected name/count, aggregate living/on-field health, current or mixed orders and Manual/AI/mixed ownership. Phone Orders offers Attack, Hold, Retreat and AI before a native disclosure for advanced formations and abilities. Retreat retains its two-step preview; the first tap keeps the drawer open for confirmation. The five main dock buttons stay in one row.

Command feedback uses a destination diamond or enemy brackets/ring. Enemy feedback follows the clicked living target; the short animation uses elapsed wall time instead of frames, including tactical pause. It does not reveal unseen enemies or alter combat timing.

Smith previews stay inside the smith's existing page and navigation. Armor/headwear/cape comparisons show current and hypothetical actual portrait renders; other slots show their existing equipment illustration. Stats compare against the slot the item would occupy. Previewing or closing costs nothing and never changes equipment.

Buy & equip uses the shared equipment transaction for displaced gear, inventory capacity and two-hand/mount rules. Gold and stock change only after the transaction succeeds. The previous item is kept in the bag. The action validates the preview item against live shop stock and clears the preview after purchase, preventing a stale repeated activation from purchasing a second item. Buy to bag remains available.

Validation: focused battle, purchase and phone layout suites; existing touch and RTS command regressions. Checks cover All commands, individual targeting, selecting friends, attack-move cancellation, AI status, real pointer routing, non-mutating previews, successful purchase and stale/insufficient-funds/full-inventory/mount failures. Visual review covers phone/desktop battle and smith layouts.

Validation result: 53 focused checks passed (12 battle, 9 shop, 32 phone). Existing touch tests have the same three world-action-ring failures/exception on the untouched code; RTS has the same legacy white-flag/badge assertion failure on both, with 429 checks passing. RTS comparisons use the same fixed-view harness; responsive preview runs use `v=1`. No fingerprints were re-recorded.


## Optional road choices (2026-11-23)

Implemented in `world/roadguide.js`: On the road opens a framed choice page from the quest tracker or Camp dock. It offers up to one hunt, camp-clearing and exploration destination. Missing opportunities show a scouting hint rather than inventing content. Only visible individual wildlife and discovered, uncleared camps/caves or unsearched ruins qualify; destinations must be reachable within the existing route system. Sites are limited to 80 tiles. Herd centres do not control wildlife eligibility.

Cards show estimated game-time travel, the existing regional danger forecast and possible reward types. Area danger is explicitly an estimate, not knowledge of a hidden garrison. Track destination marks the world, minimap and full map without moving, engaging, creating a quest or granting a reward. Visible animal positions update at most once per second; losing sight retains the last seen position. Saving keeps that waypoint without serializing animal objects. Cleared sites and dead tracked animals remove their marker.

The Camp dock now opens these choices. Rest until ready pitches a legal camp, uses existing hourly stamina recovery and time acceleration, and restores prior speed at full stamina. Food/water limits and estimates appear before starting. Danger cancels recovery and drops to 1×. Manual travel cancels it, as does packing. Stop recovery retains camp at normal speed; Make camp and Pack camp preserve untargeted camping and the existing packing timer. The Z shortcut still directly toggles camp. Wounded recovery remains on its normal schedule; no instant healing or supply purchases are added.

Automatic looting is reserved for a future pet ability, per the owner. All loot collection remains manual.

Validation: 27 road-guide checks, 47 company-rule checks, 24 camp-packing checks, 36 structure checks, 31 survival-quest checks and 88 quest checks passed. Supply: 93 passed, with the same four terrain/legacy HUD assertions failing on unchanged ee28990. Desktop, landscape phone and portrait phone previews have no horizontal overflow, three illustrated cards and standard navigation. An additional identity probe confirms that replacing a herd member cannot silently retarget its waypoint. No fingerprints were re-recorded.
