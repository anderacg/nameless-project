# Clash gauges: design

Status: **design, for the owner's answers** (2026-11-10). Nothing built yet. Mockups were sent with this design; they were drawn in the running game by a throwaway script, not by game code.

**The owner, 2026-11-10:** "How about we make it like battle gauge like left vs right, the more units fighting the group will expands and unit icon will be embedded in that vs gauge. Also please rescale to icon to be a bit smaller". Then: "change those clustered unit flag, not the top bar, the top bar is fine as it is". This came from a screenshot of a world battle at a castle: five allied plates and the enemy's stacked on one another by the gate, unreadable on a phone.

**Readers:** the owner, and whoever builds §7.

## 1. What is there today

- **Over each group:** a plate in its side's colour with its kind's glyph (13 art px, drawn 2× on the screen: `ui/moraleicons.js` `drawUnitIcons`, `UICON`). A health bar stands on its left (`ui/battlehud.js` `drawGroupHealth`), and its status badges sit on its right.
- **Overlap:** plates may overlap. Only plates of two sides at blows are fanned apart side by side (`iconLayout`, `ICON_FAN`). Allies' plates and your own pile up, one over another.
- **The top bar:** stays as it is.

## 2. Plates that crowd become one clash gauge

When group plates touch on the field, they are drawn as **one bar over them**: a clash gauge.

- **Sides:** everyone fighting for you on the left (your groups, then your allies' toward the middle), everyone against you on the right.
- **The front:** a bright seam with gold ticks marks where the two sides meet.
- **One side only** (your allies' groups stacked together, say): a bar with no seam.

**Each group is a segment** of that bar:
- **Look:** in its side's colours (`SIDE.*.plate`) with its kind's glyph in it, as its plate had.
- **Width:** it grows with its men still fighting, as asked: 12 art px for one man, 2 more for each man after, at most 34. A group of ten is three times as wide as a man alone. Its width drops as its men fall, so you see who is winning a fight and who is being ground down.
- **Number:** when it is wide enough, its men's count stands beside its glyph.
- **Health:** its men's health of what it began with, as a thin green line along its foot. This replaces today's bar standing beside the plate.
- **Wavering:** its edge blinks amber. **Routed:** it is greyed. **Selected:** a gold edge.
- **Order:** within a side, groups stand left to right as they stand on the field, so a segment is above its own men.

**Where the bar stands:** over the cluster, at the height of its highest plate. Its front is at the middle of the groups in it.

**Clicking and pointing:** each segment is its group's click target (`B.icons`), so selecting, pointing at and ordering work as they do on plates today.

**Joining and leaving:**
- A plate **joins** a gauge when it touches a plate already in it, or its group is at blows with one in it.
- It **leaves** only once it is clearly apart (a margin), so a gauge does not flicker as men shuffle.
- The bar's place and its segments' widths **ease** over a quarter second, as the fan does now. With less motion (`reducedMotion`) they are simply put there.

**A long bar:**
- When a gauge would be wider than `CLASH.most` (about a fifth of the screen), each **allied army** in it folds into one segment: its men summed, the glyph of its most common kind.
- If it is still too wide, so does each **enemy army** but the one most at blows with yours.
- **Your own groups never fold.** In the desktop mock the gate's whole fight was one bar (yours, five allied groups, the front, eight enemy groups), and it read well even unfolded.

## 3. A group alone: a smaller plate

- **Size:** a plate not in a gauge is drawn a quarter smaller (`UICON.k` 2 to 1.5). On a phone's 2× screen that is 3 device px an art px, still crisp.
- **Health:** the bar beside it becomes a thin strip under it, so the plate takes about half its room today.
- **Badges:** it keeps only its most urgent status badge: running, then wavering, flanked, tired... All of them stay in its info card.

## 4. Tunables

One table, `CLASH`, holds:
- the bar's height;
- a segment's least width, the width each man adds, and its most;
- the join margin and the leave margin;
- the ease;
- the most width before folding;
- the front's colours.

`UICON.k` holds the plates' size.

## 5. Questions for the owner

1. **When a gauge forms:**
   - only for a real clash, groups of two sides at blows;
   - or whenever plates touch, which also gathers your allies' stacked plates into one bar (as in the mock)?

   I suggest whenever plates touch.
2. **Width:** by **men fighting** (as asked and in the mocks), or by **strength** (health weighted by tier: two knights more than two levies)? I suggest men: easy to read, and the health line shows the rest.
3. **Badges in a gauge:** none on the bar (the info card has them), or one small badge over a segment for its most urgent state? I suggest one, over the segment.
4. **Your allies:** each allied group a segment until the bar is too long (as in the mock), or always one segment per allied army?

## 6. What does not change

- **Unchanged:** the top bar, the unit cards, the info card, commands and selection.
- **Display only:** morale, health and every battle rule; the gauges only show them.
- **Fingerprints:** the battle suites and `aishare` do not draw the plates, so they should hold. `rts` checks the plates and their click targets; any value that moves is re-recorded with its reason.

## 7. Building it, once agreed

1. **`ui/moraleicons.js`:**
   - `ClashGauges`: which plates gather (with the join and leave margins), its bars' places eased, each segment's width, the folding.
   - A pure `clashLayout(items, view)` that tests can call alone.
   - `drawUnitIcons` draws gauges and lone plates; `iconLayout` keeps placing plates and the fan's easing.
2. **`ui/battlehud.js`:** `drawGroupHealth` stops drawing beside plates (the strip and the segment's line take its place). `B.icons` holds each segment as its group's target.
3. **`tests/clashgauge.js`:**
   - touching plates make one gauge, friends left and foes right;
   - widths follow men fighting, with a least and a most;
   - a group joins and leaves by the margins (no flicker over a few frames);
   - folding when too long, your groups never;
   - a click on a segment selects its group;
   - a lone plate is the smaller size.
4. Update `prototype/README.md` and this status line.
