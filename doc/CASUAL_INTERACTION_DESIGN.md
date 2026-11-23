# Direct battle controls and equipment comparison

Implemented: direct battle clicks/taps, shared compact selection feedback, progressive phone orders and pre-purchase smith previews.

Ordinary clicks/taps select friendly fighters; with a selection, enemy and ground taps issue the existing attack/move commands. The All selection works the same as individual groups. World combat retains individual targets, visibility checks, joining rules and disengagement. Mouse drag, Shift selection, right-click and long-press/formation gestures remain separate. Finished battles ignore new ordinary commands.

The existing status panel adds one compact row with selected name/count, aggregate living/on-field health, current or mixed orders and Manual/AI/mixed ownership. Phone Orders offers Attack, Hold, Retreat and AI before a native disclosure for advanced formations and abilities. Retreat retains its two-step preview; the first tap keeps the drawer open for confirmation. The five main dock buttons stay in one row.

Command feedback uses a destination diamond or enemy brackets/ring. Enemy feedback follows the clicked living target; the short animation uses elapsed wall time instead of frames, including tactical pause. It does not reveal unseen enemies or alter combat timing.

Smith previews stay inside the smith's existing page and navigation. Armor/headwear/cape comparisons show current and hypothetical actual portrait renders; other slots show their existing equipment illustration. Stats compare against the slot the item would occupy. Previewing or closing costs nothing and never changes equipment.

Buy & equip uses the shared equipment transaction for displaced gear, inventory capacity and two-hand/mount rules. Gold and stock change only after the transaction succeeds. The previous item is kept in the bag. The action validates the preview item against live shop stock and clears the preview after purchase, preventing a stale repeated activation from purchasing a second item. Buy to bag remains available.

Validation: focused battle, purchase and phone layout suites; existing touch and RTS command regressions. Checks cover All commands, individual targeting, selecting friends, attack-move cancellation, AI status, real pointer routing, non-mutating previews, successful purchase and stale/insufficient-funds/full-inventory/mount failures. Visual review covers phone/desktop battle and smith layouts.

Validation result: 53 focused checks passed (12 battle, 9 shop, 32 phone). Existing touch tests have the same three world-action-ring failures/exception on the untouched code; RTS has the same legacy white-flag/badge assertion failure on both, with 429 checks passing. RTS comparisons use the same fixed-view harness; responsive preview runs use `v=1`. No fingerprints were re-recorded.
