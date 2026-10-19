# Ashmark UX/UI review

Reviewed 2026-10-16. This is stage 1 of the agreed UX improvement plan: verification and prioritization. No gameplay or interface implementation has been changed.

**Status (checked 2026-10-19):** the fixes were never queued in the implementation plan; they are now (IMPLEMENTATION_PLAN Priorities 1 and 8).
- **UX-01 fixed 2026-10-19 (6c7eb51):** the menu's Save reports a save the browser refused ("Could not save"); `tests/menu.js` checks it.
- **UX-09 built:** touch inspection on the map, pinch and pan, long-press orders and lines (39c4785), safe areas and no page zoom (8f01013).
- **UX-05 probably fixed:** Esc or a left-click now drops a right-drag before the window chain (a0ae05e, `dragCancel`, `tests/dragcancel.js`); re-check the plain right-down, Esc, right-up case.
- **UX-02, 03, 04, 06, 07, 08, 10, 11 and the design improvements:** not re-checked since; the UI has changed a lot (rail windows, people drawer, phone layout: adfcf2d, b6d4bb1, 8ecb177).

## Scope and evidence

- Inspected new game, world HUD, town/recruitment, trade, inventory, skills, hero, settings, save/load, and battle screens.
- Collected 26 screenshots: 13 views at 1600×900 and 844×390. Phone captures use coarse-pointer emulation; animations are disabled only in the audit fixture to capture stable frames.
- Measured the layouts separately at 1600×900 and 844×390 CSS pixels. The headless Chrome command has a difference between its initial window viewport and its exported screenshot size, so the measurement run compensates for window decorations; the screenshot run uses the requested output dimensions directly.
- Exercised real game input handlers through synthetic PointerEvents and KeyboardEvents. This verifies handler behavior, not the complete physical touch experience.
- Tested storage failure by temporarily making `Storage.setItem` throw a quota error. All tests used separate review browser profiles, preserving the player's normal browser saves.
- No real Android device, iOS Safari, notch/safe-area, orientation-change, or physical multi-touch test was performed. Those remain release checks.

Evidence and rerunnable diagnostic helpers are in `../ux-review/`. The audit fixture is stored outside `prototype/tests/`; the helpers install and remove only their own temporary suite when running.

## Fix order

| Order | Issue | Priority | Evidence |
| --- | --- | --- | --- |
| 1 | Save failure acknowledged as success | High | Injected storage failure; success text displayed, save absent |
| 2 | Save/load rows have detached and overlapping labels | High | Desktop and phone renders; computed `display:grid` |
| 3 | All-selected army cannot receive a touch movement order | High, mobile | Same tap fails for All and succeeds for Infantry |
| 4 | Touch equipment ring slots overlap | High, mobile | 40×40 hit boxes on positions designed for 24×24 |
| 5 | Pending mouse order completes behind pause menu | Medium | Right-down → Esc → right-up issues an order in `esc` mode |
| 6 | Battle has no touch-accessible pause-menu/help entry | High, mobile | HUD inspection; dock hidden in battle; help rejects battle mode |
| 7 | Mobile lacks map inspection, battle camera gestures, and formation placement | High, mobile | Input-handler inspection |
| 8 | Save identity details disappear on short screens | Medium | Responsive CSS and phone render |
| 9 | Settings toggles move keyboard focus to first setting | Medium | Focus changes from Blood Off to Realm economy Full |
| 10 | Small touch targets and inaccessible selected-unit details | Medium | Measured targets and compact-layout rules |

## Confirmed defects

### UX-01 — Failed saves can be reported as successful

Reproduction: start a game, open Esc → Save game, then save to an empty slot while browser storage throws a quota/unavailable-storage error.

Observed: the menu displays `Game saved (Slot 5).` although `readSlot('5')` returns no save. The test fixture restores storage immediately afterward.

Cause: `saveGame()` catches storage exceptions and does not return a success status. `escAct('esc-save')` calls it with `quiet=true` and unconditionally shows a success message. The error is therefore suppressed in this flow.

Source: `prototype/js/core/save.js:11` and `prototype/js/ui/ui.js:141`.

Fix: make save success/failure explicit; acknowledge only a successful write. Display a persistent error inside the save window when the write fails. Preserve any prior save in the slot.

Acceptance: injected write failure produces an error and no success acknowledgement; ordinary saving, overwriting, quick saving, and loading still work.

### UX-02 — Save/load row styling collides with inventory styling

Reproduction: open Load game with both occupied and empty slots, or Esc → Save game.

Observed: icons occupy one row while their slot labels and save descriptions appear below their buttons, over subsequent rows. A measured slot was 44 px high, but its label began 54 px below its top. This affects both layouts.

Cause: the save button has `class="card menu slot"`. The inventory `.slot` selector sets `display:grid` and `height:44px`. Save-row rules set flex properties without resetting display or height.

Source: `prototype/js/ui/ui.js:73`, `prototype/style.css:175`, and `prototype/style.css:347`.

Fix: use a distinct save-row class and explicit row layout, with a height that contains the icon, title, and metadata.

Acceptance: every title and description remains within its own button; the Delete button lines up with the corresponding save; verify occupied, empty, and overwrite-confirmation states.

[Desktop evidence](../ux-review/load-desktop.png) · [Phone evidence](../ux-review/load-phone.png)

### UX-03 — Touch cannot move All troops

Reproduction: select All in a battle and tap clear ground. Repeat after selecting Infantry.

Observed: All leaves the infantry anchor unchanged and creates no movement marker. Infantry receives the same touch order and changes its destination.

Cause: the touch-to-order branch explicitly requires `B.sel !== 'all'`; the tap instead falls through to selection.

Source: `prototype/js/ui/input.js:113`.

Fix: define touch selection and command intent consistently for individual groups, multiple groups, and All. Preserve a reliable way to select friendly groups.

Acceptance: the same command gesture works with all three selection types, on ground and enemies, while deploying and during tactical pause.

### UX-04 — Touch ring-slot hit areas overlap

Reproduction: open Inventory with coarse-pointer emulation and inspect the ring positions beside each hand.

Observed: ring controls measure 40×40 although their positions are spaced for 24×24 controls. For example, the first two positions differ by only 26 px horizontally and 4 px vertically. Adjacent controls overlap, and the later control can intercept a tap intended for the earlier one.

Cause: `.slot { min-width:40px; min-height:40px }` in the touch media query overrides the smaller ring dimensions without relaying out `FINGERS`.

Source: `prototype/js/ui/inventory.js:131`, `prototype/style.css:341`, and `prototype/style.css:478`.

Fix: provide a non-overlapping touch layout for rings, such as a separate equipment strip or equipment list. Increasing hit areas alone is insufficient.

Acceptance: every ring is independently tappable, no controls overlap, and selection/equip/unequip works for all ten slots.

[Phone evidence](../ux-review/inv-phone.png)

### UX-05 — A mouse gesture survives opening the pause menu

Reproduction: press and hold the right mouse button on a battlefield destination, press Esc before releasing it, then release the button.

Observed: the game is in `esc` mode, but the release creates a battle order marker and changes the group's destination.

Cause: the global pointer-up handler consumes `B.rdrag` without checking the current mode/modal. Opening Esc does not cancel pending selection/order/camera drags.

Source: `prototype/js/ui/input.js:119` and `prototype/js/ui/ui.js:124`.

Fix: cancel pending gestures when leaving the battlefield or opening a modal; handle pointer cancellation and guard release processing.

Acceptance: no destination, facing, selection, or camera change completes behind the menu; normal movement and formation dragging still work after resuming.

### UX-06 — Save details disappear on compact screens

Reproduction: open Load game on a short screen with several occupied slots.

Observed: day, character, level, gold, and saved time disappear. Only slot names remain, making it difficult to choose between saves.

Cause: the compact menu rule `.card.menu .mt span { display:none }` also matches save metadata.

Source: `prototype/style.css:502`.

Fix: target decorative main-menu subtitles specifically. Keep at least character/level, campaign day, and saved time available for saves.

Acceptance: users can distinguish saves on phone landscape without having to load them.

### UX-07 — Settings changes lose the active control

Reproduction: focus Blood → Off with the keyboard and activate it.

Observed: focus moves to Realm economy → Full. In the measured case scroll remained at 200 px; the earlier preliminary claim that scroll always resets was not confirmed.

Cause: each setting rebuilds the screen through `showTitle('settings')`; `showPanel()` focuses the first available button.

Source: `prototype/js/ui/input.js:5` and `prototype/js/ui/ui.js:3`.

Fix: update the changed control or restore its focus and the scroll position after rendering.

Acceptance: repeated keyboard adjustment remains on the same setting and the focused control remains visible.

## Confirmed interaction gaps

### UX-08 — Battle needs visible Help and Menu controls

`openHelp()` rejects battle mode; H is Hold in battle. The normal dock, including Menu and Help, is hidden. The battle Pause button only performs tactical pause and does not open the game menu.

On desktop, Esc still opens the menu. On touch there is no equivalent battle HUD entry. Add explicit Menu and contextual Help controls, with battle state preserved on return. Keep tactical Pause separate and clearly named.

Source: `prototype/js/ui/ui.js:11`, `prototype/style.css:252`, and `prototype/Ashmark.html:55`.

### UX-09 — Mobile input is incomplete

The reviewed input handlers provide no pinch camera zoom, two-finger pan, long-press formation placement, or long-press map inspection. Map tooltips are suppressed for touch. Ground travel and basic single-group touch orders exist.

Implement and document a gesture scheme with explicit cancellation rules before polishing the rest of the phone HUD. Two fingers must not accidentally issue a one-finger order; inspect must not also start travel or combat.

Source: `prototype/js/ui/input.js:95` onward and `prototype/js/battle/camera.js`.

### UX-10 — Compact controls remove too much information

At 844×390 with coarse-pointer emulation, battle order buttons measure 40×40, time buttons are 36 px high, and AI is approximately 28 px wide. These fall below the project's stated 44 px touch target goal. The selected-unit detail panel is hidden, and some card badges are hidden, without a visible replacement.

Use non-overlapping 44 px hit areas and an expandable group-details view. Keep essential ammunition, fatigue, morale, and order state accessible. Check total HUD height after enlarging controls.

Source: `prototype/style.css:506` and `prototype/style.css:518`.

### UX-11 — Keyboard and assistive-technology support needs a pass

The panel has `role="dialog"`, but lacks an accessible name and `aria-modal`. The background is not inert; a background dock control remained focusable while the pause menu was open. Skill-tree nodes all have `tabindex="-1"`, with no reviewed keyboard node-navigation handler.

Add contained modal focus, appropriate labels, restored focus on close, and keyboard navigation for the skill tree. Verify with actual Tab/Shift+Tab and a screen reader; programmatic focus checks alone do not establish the full assistive-technology experience.

Source: `prototype/Ashmark.html:102`, `prototype/js/ui/ui.js:3`, and `prototype/js/ui/talents.js:81`.

## Design improvements after the defects

1. **Reduce the town introduction on phones.** At 844×390 the ownership/economy paragraph, street/lodging actions, and tabs consume most of the space above the first hire row. Put the long summary behind Details and keep the active task near the top.
2. **Keep recruitment details beside the decision.** On compact layouts the selected unit card is placed after the entire recruitment/training list. Show a compact inline card or a dedicated unit-details sheet near the selected row.
3. **Select a background before starting.** All seven background cards currently start immediately. Make cards select, show starting equipment/gold/advantages, and add Begin journey. Use a short first-loop guide after starting.
4. **Make the skill tree readable at entry.** Fit-to-all starts with tiny labels and many distant branches. Focus initially on the origin and available choices, with an Overview option. Keep the selected node's detail/action visible on phones.
5. **Make transaction feedback explicit.** Trade does update quantities and gold, and the tested Buy 5 retained button focus. Show a brief result such as `Bought 5 grain for 35g`, and disclose exact bulk cost or partial completion where prices change per item. This is a clarity improvement, not a reproduced failed-trade bug.
6. **Refine battle overlays.** Selection rings, destinations, order lines, active buttons, and group details already exist. Improve their visual hierarchy and persistence rather than adding duplicate feedback. Showing every selected group's range arc at once can obscure the field.
7. **Align control language.** Help still describes C/V as Charge/Advance while the buttons and current implementation describe Run/Walk pace changes. Explain that setting a pace does not itself choose an enemy or a destination.
8. **Provide Settings from the pause menu.** Currently it is on the main menu; reaching that menu abandons Resume. Keep settings adjustments within the current session, and make progress-loss consequences clear when leaving it.

[Recruitment](../ux-review/recruit-phone.png) · [Skills](../ux-review/skills-phone.png) · [Battle](../ux-review/battle-phone.png) · [New game](../ux-review/new-phone.png)

## What passed and corrections to the preliminary review

- A normal Esc pause changes mode to `esc`; pressing C behind that menu did not change the battle order. The confirmed modal bug is the pending pointer-release case, not ordinary keyboard commands behind the standard pause menu.
- Settings focus loss reproduced; unconditional scroll reset did not.
- Town trading retained focus and completed the tested quantity with enough money and room.
- Inventory already has explicit equip/unequip buttons; it does not require drag-and-drop to function.
- Battle already has substantial order feedback. The recommendation is to make it clearer and accessible on touch, not to build it from scratch.
- The shared bottom navigation frame is a useful foundation and remains visible in the reviewed phone windows. Long windows intentionally scroll; content below the initial viewport is not automatically a clipping bug.

## Existing test baseline

| Suite | Pass | Fail/exception/error |
| --- | ---: | ---: |
| menu | 47 | 0 |
| input | 6 | 0 |
| inventory | 50 | 0 |
| rts | 422 | 0 |
| scenes | 26 | 0 |
| unitcard | 28 | 0 |
| Total | 579 | 0 |

These existing tests do not cover the reproduced save-failure, layout, or gesture defects. The audit diagnostics record those separately in `../ux-review/interaction-checks.txt`. The complete game test suite was not run for this read-only review.

## Next implementation checkpoint

First fix UX-01 through UX-05: trustworthy save results, independent save-row styling, All touch orders, ring layout, and gesture cancellation. Include settings focus preservation while touching the screen renderer. Add narrowly targeted regression checks for the reproduced failures and rerun the affected suites.

Then implement mobile inspection/camera/formation gestures and visible battle Menu/Help controls, before the onboarding and information-layout pass. Present desktop and phone screenshots at each checkpoint, as agreed in the implementation plan.
