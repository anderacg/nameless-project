---
name: ashmark-ui
description: Role skill for agents changing Ashmark's interface — windows/panels, the battle HUD, unit cards, callouts, input (mouse, keys, touch), mobile layout and CSS (prototype/js/ui/*, style.css, Ashmark.html). Covers the window frame rule, CSS tokens, mobile/touch conventions, accessibility and the tests to run. Load after ashmark-core for any UI, input, HUD or mobile task.
---

# UI, HUD, input and mobile

## Direction (owner-approved)
Full-screen dynamic view; **Arial-first** UI font; **mobile landscape** is a first-class target (~844×390 CSS px) alongside desktop (1600×900). Organised `style.css` with tokens (`--edge`, safe-area `--sa-*`/`--e-*`, colour tokens like `--void`), compact rules at max-height 600 / max-width 820, **44 px touch targets** on coarse pointers.

## Window frame rule (strict)
Every window: header → content (only game information and choices) → bottom bar from `nav(back, close)` (Back left, the way out right; buttons `[act,arg,label,whyDisabled,noEsc]`). Esc follows the bar (`escDismiss`). Actions live in the content; navigation lives only in `nav()`.

## Battle HUD
`battlehud.js`: unit cards (group morale badges from `grpMorale`), order bar (`[data-order]/[data-flag]/[data-form]` — fingerprinted by `tests/battlecommands.js`; new controls use their own attribute, e.g. ability buttons `data-abil`), details panel, callouts (`CALLOUT`, `#bCallouts`, deduped and throttled). UI must never change simulation state (render-only shake, no `B.cam` writes for effects).

## Input
`input.js`: mouse/keys unchanged by touch work; touch uses Pointer Events with `pointerType==='touch'` (`TOUCH`: tap acts on lift, 450 ms long-press = move/attack, long-press-drag = line, pinch/two-finger pan via `camPinch`, map hold card). HUD is `touch-action:none` (cards `pan-x`, details `pan-y`), windows `pan-x pan-y`; iOS `gesturestart` cancelled; hold card clamped with `safeInsets()`. Keys: check `input.js`/`commands.js` before assigning a new one (G/I/U/Y are abilities).

## Checks
Look at it: take screenshots at **1600×900 and 844×390** (`tests/visual/`, add `&v=1` for the real dynamic layout; `FIXED_VIEW` 576×360 is the default for tests) and Read the PNGs. Verify nothing overlaps (time bar, minimap, cards, order bar, messages, DEV tab at the right edge middle). Must-run: `touch`, `mobile`, `input`, `menu`, `battlecommands`, `battlejuice`, `unitabilities`, `clicks`, `mapview`, `structure`, `wiki`, plus suites for the screens you touched. Real-device checks (iOS Safari, Android Chrome) can't be done here — list them as unverified.
