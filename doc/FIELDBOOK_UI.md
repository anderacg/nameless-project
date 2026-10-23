# Field-book management UI

Status: implemented on `codex`, 2026-10-23. This brings the approved cloth, brass and parchment mockup into the running game. All pictures use the existing pixel icons, equipment art, character portraits, main-menu landscape and white-tree emblem. UI type is Arial.

## Screens

- Character: the hero's portrait stage, live Health/Stamina/Mana bars, attribute tiles, skill entry and perks. Lords and Realms retain their information in the common frame.
- Party: Army, Companions, Passengers and Prisoners tabs. Army cards follow the persistent group order and show each group's fit and wounded counts. The company standard opens Condition: actual Fitness, Morale, Stamina, recovery rate and reasons, supplies, capacity, power and recruitment target. Selected groups retain rename, ordering, exact split, compatible merge and reinforcement commands. Unit details show combat morale, attacks and pooled training progress. Recovering formations remain separate.
- Companions: portrait collection and Overview/Equipment/Skills/Orders tabs. Role and equipment choices use a full page with Cancel/Apply. An occupied role names its current holder before Apply. Orders retain exact source/destination selection, quantity, non-mutating Review and revalidation at Confirm. Company service includes dismissal. Passenger deadlines and captive actions remain their existing systems.
- Inventory: equipment grid, six actual bag filters, selected-item comparison and pinned actions. All ten rings have separate targets. Original bag indices survive filtering. Two-handed displacement, overflow, bound quest items, letters and unavailable-equipment reasons remain visible; Details expands the inspection area on a narrow phone. Drag/drop and existing double-click equipment shortcuts remain available on desktop.
- Quests: book cover, coloured bookmarks, medallions, current objective, real progress, timing, reporting location and reward tiles. Main/Side/Jobs/Archive, tracking, full-map routing, stages, known locked offers and the archive use the current quest model. Longer facts remain in Details. Only jobs offer Abandon; its page states the actual penalty and Keep it is focused first. Back/Esc cancels that page.
- Skills: a focus around the selected skill, named Paths, full Fit and an accessible List containing every node. The graph adapts to its measured viewport; the selected skill and camera are independent for hero and each companion. Pan, wheel, pinch, cancellation and keyboard navigation do not buy skills. Only Learn spends a point. A pinned inspector states point, connection and refund requirements. Ten slot buttons open Cancel/Apply choice pages; automatic battle use and service validation remain unchanged. Disciplines and practice-based Basics have separate tabs.

## Layout and controls

The panel owns a fixed header, bounded content and the existing `nav()` bottom bar. Inner collections and details scroll independently, preserving context on refresh. The frame fits desktop, 844×390 landscape, 390×844 portrait and 320×568. A short landscape screen puts the title and primary navigation on one row. Portrait Army and Quests use list-to-detail navigation with Back. Inventory uses Bag/Equipment tabs and an optional expanded Details page. Companion portraits become a horizontal strip.

Choices use labelled buttons, tabs, cards and quantity steppers. No native dropdown appears in these management screens. Normal controls are at least 44 pixels high; equipment and ring targets are at least 44×44. Skill hit regions scale with the graph; Fit is for surveying the topology, with List available for precise selection. Numbers and words accompany colour. Tab rows support arrow/Home/End navigation. Reduced-motion preferences stop decorative motion.

## Ownership and implementation

`ui/fieldbook.js` owns the common frame, native-art cache, meters, rewards, scroll positions, steppers and draft choice pages (`fb-`). `ui/partypage.js` and `ui/companionpage.js` present existing party and companion commands (`party-`). `character.js`, `questwindow.js`, `inventory.js` and `talents.js` keep their action ownership and gameplay-service calls. Both HTML entry points load the new helpers in the same order. `fieldbook.css` is scoped to these windows and leaves world/battle presentation alone.

Selection, scroll, view and choice drafts are runtime UI state. No save-schema, quest-content, simulation, talent-cost, recruitment or equipment-rule change is part of this work. The journal supports the Main category; it does not invent an unshipped main story.

## Validation

`tests/fieldbook.js` checks actual values, cancellation, literal names, filtering indices, skill spending, independent skill cameras, all four viewport sizes, pinned actions, ring separation, and abandonment choices. Existing inventory, talent, transfer and quest-window tests use the new controls while retaining their gameplay assertions. `tests/visual/fieldbook.js` prepares eight real screens for screenshots (`&v=review&scene=army|condition|companion|orders|inventory|equipment|skills|journal`).

Review fixes (2026-10-23), features the older windows had: overflow bag slots and the capacity bar are red again, with the pace cost in the bag footer (shown on a phone too); gear slots keep their rarity border and the fit glow; the hero's low Health/Stamina/Mana are flagged; Condition breaks Party power down by hero, companion and troop type; the Skill bar's Basic moves again show your own attack (combo, shot or cast, with its numbers); companion source choices follow the battle order; an empty Passengers tab says so. The older suites (`characters`, `itemcats`, `burden`, `mounts`, `quivers`, `attacks`, `escort`, `helpers`, `power`, `troopxp`, `vitals`) read the new markup with their gameplay checks kept. `tests/visual/fieldbook.js` adds `compskills` and `overflow` scenes.

Targeted suites and required world/battle/RTS fingerprints are recorded in the handoff. The coordinator runs the full sweep after merge. Native-device playtesting and any additional window restyling remain separate follow-up work.
