# The battle gauge: design

Status: **design, for the owner's answers** (2026-11-10). Nothing built yet. Mockups were sent with this design; they were drawn in the running game by a throwaway script, not by game code.

**The owner, 2026-11-10:** "How about we make it like battle gauge like left vs right, the more units fighting the group will expands and unit icon will be embedded in that vs gauge. Also please rescale to icon to be a bit smaller". This came from a screenshot of a world battle at a castle: five allied plates and the enemy's stacked on one another by the gate, unreadable on a phone.

**Readers:** the owner, and whoever builds §7.

## 1. What is there today

- **Over each group:** a plate in its side's colour with its kind's glyph (13 art px, drawn 2× on the screen: `ui/moraleicons.js` `drawUnitIcons`, `UICON`). A health bar stands on its left (`ui/battlehud.js` `drawGroupHealth`), and its status badges sit on its right.
- **Overlap:** plates may overlap. Only plates of two sides at blows are fanned apart (`iconLayout`, `ICON_FAN`). Allies' plates and your own pile up.
- **The top bar:** your men's number, a two-colour strength bar, then the enemy's number (`bhudTop`, `.bpowbar`). The bar's split is strength: health weighted by tier.

## 2. The gauge

The top bar's strength bar becomes **the gauge**: one bar, your side on the left and theirs on the right, meeting at **the front**. The front is a bright seam with a gold notch above and below it.

- **Left:** everyone fighting for you. Your own groups first, from the left edge, in the order of your unit cards (hero, companions, then groups 1, 2, 3...). Then your allies' armies, toward the front.
- **Right:** everyone against you. The main enemy's groups first, from the front outward. Then each other hostile army.
- **Width:** each segment's width is its **men still fighting** (alive and not running), as asked. The front sits where the two sides' men divide the bar, so it moves toward whoever is losing men. It eases there, as the bar does now.
- **Segments:** each is a small plate in its side's colours (`SIDE.*.plate`: lit top, dark foot, a dark edge) with its kind's glyph in it. When the segment is wide enough, its men's number stands beside the glyph.
- **Armies:** a light divider marks where one army ends and the next begins.

### What is folded

- **Your groups:** always one segment each. There are at most ten, plus your hero and companions.
- **The main enemy:** one segment for each group.
- **Every other army** (your allies and other foes who joined): **one segment for the whole army**, its men summed, the glyph of its most common kind. The first desktop mock showed why: five armies' groups each at their least width filled the bar and squeezed the enemy off it.
- **Least width:** 12 art px. When even that does not fit, the main enemy folds too. First its groups of one kind merge ("×2"), then it becomes one segment.
- **On a phone:** with folding, 3 to 4 of your groups, three allied armies and eight enemy groups fit in the phone bar (mock: `gauge_phone.png`).

### What it shows

- **Men lost:** a light strip flashes at the segment's front end and fades over 0.9 s. You see where the losses are as they happen.
- **Wavering:** the segment's edge blinks amber, as its plate does today.
- **Routed:** a group whose men all run is greyed. It keeps its least width until they are gone or rally.
- **Selected:** a gold edge, as on its card and plate.

### Using it

- **Tap or click one of your segments:** selects that group, the same as its card. A double tap moves the camera to it.
- **Tap or click another army's segment:** moves the camera to it and rings its men, as pointing at its plate does now. On desktop, hovering does the ringing.
- **Long-press, or hover on desktop:** shows its info card (the one a plate shows now).
- The keyboard is unchanged.

### Where it sits

- **Phone (844×390):** in the bar's place, between "20 Your band" and "Enemy 10", 20 px tall. The top bar keeps its size.
- **Desktop:** its own row under the numbers, 22 px tall. The top bar widens from 440 px to 660 px (at most 56% of the screen). The mock showed it must not run under the speed buttons, so its width is the top bar's, never more.

## 3. The plates on the field: smaller

- **Size:** a quarter smaller, drawn 1.5× and no longer 2× (`UICON.k` 2 to 1.5). On a phone's 2× screen that is 3 device pixels an art pixel, still crisp.
- **Health bar:** the bar beside each plate goes. A group's health is now its width on the gauge, so a plate takes about half the room it does now.
- **Status badges:** on the phone mock they are now the clutter (arrows, skulls and hourglasses round every plate). See question 2.
- **Fanning:** the fan stays as it is. Smaller plates overlap less.

## 4. Tunables

One table, `BATTLE_GAUGE`, for the gauge's height (phone, desktop), least width, divider widths, the loss strip's colour and fade, the front's colours, the ease, and when to fold. `UICON.k` holds the plates' size.

## 5. Questions for the owner

1. **Width:** by **men fighting** (as asked, and in the mocks), or by **strength** (health weighted by tier, what the bar measures now: two knights count for more than two levies)? Men is easier to read. Strength says better who is winning.
2. **Badges on the field:** keep them all, keep **one** (the most urgent: running, then wavering, flanked, tired), or **none** (all of them in the info card and on the gauge's segment)? I suggest one.
3. **Armies who fight both sides** (rivals: neither your friends nor your foes): put them on the right after a gap, in their own gold, or leave them off the gauge? I suggest the right, in gold.
4. **Desktop:** is a second row in a wider top bar all right, or should the gauge stay inside today's bar at 440 px (folding more)?
5. **Allies:** one segment per allied army, as in the mock, or each allied group while there is room?

## 6. What does not change

- Commands, selection, the unit cards and the info card.
- The world battle's armies menu ("Armies 3/8").
- Morale, health and every battle rule. The gauge only reads them.
- **Fingerprints:** the battle suites and `aishare` do not draw the HUD, so they should hold. `rts` checks the HUD and the plates; any value that moves is re-recorded with its reason.

## 7. Building it, once agreed

1. `ui/battlegauge.js`: `BattleGauge` (its canvas in the top bar, what it shows, what you touch) and a pure `gaugeLayout(groups, width)` (which segments, how wide, folded or not) that tests can call alone.
2. `bhudTop` calls it in place of `.bpowbar`. `style.css` gets its own "Battle gauge" section with the phone rules. Field plates go to `UICON.k` 1.5, and `drawGroupHealth` stops drawing on the field.
3. `tests/battlegauge.js`:
   - the layout: widths follow men, a least width, the folding order;
   - the front moves as men fall;
   - a tap on your segment selects its group;
   - phone and desktop sizes, with nothing past the top bar's edge.
4. Update `prototype/README.md` and this status line.
