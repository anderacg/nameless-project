# Campaign UI

Status: shared campaign HUD implemented on codex. Desktop and phone use the same artwork, type, palette, frame material and condition components; layouts adjust their scale and placement.

`ui/icons.js` maps illustrated HUD glyphs to one transparent atlas. The nine-slice rim has true alpha outside its silhouette and a transparent center. Timber is a panel surface, not part of an icon crop. Legacy pixel glyphs remain available for other game symbols. No concept screenshot values or backgrounds are used as icons.

`ui/campaignhud.js` owns the live resource rail, company detail toggle, nearby-holding card and map frames. Its condition component renders the same fitness heart, morale standard, stamina bolt, Arial label, numeric value and gauge in the company card and phone strip. The narrower phone status layout hides only redundant names when needed; its full accessible party-status label remains.

The unframed desktop header shows only the current army name and its actual map flag, with no button background; clicking it opens the existing naming window. Resources occupy the left column of the bottom-left company panel, with condition icons and meters in its right column. Low food or drink has a LOW badge and amber value there, with no separate floating warning; supply cells open inventory. Gauges cover up to three days.

The larger desktop company card has no portrait. The full-width bottom timber backdrop is removed; the world remains visible and clickable in the gaps. Five slimmer command tiles have separate, thinner frames and sit at the bottom-right. Stamina, fitness and morale share the right status column; the detail toggle retains the full party information. Five visible illustrated desktop commands and utility Help retain their original IDs and handlers. The original Map control remains available to the phone drawer and minimap action. Nearby holdings show real faction, garrison and gate state; their buttons delegate to existing travel/gate rules and the full map. Time controls share one frame with an underline for selected speed. Day/weather has extra leading padding on desktop and phone.

Landscape phones retain one 52px strip and 44px controls. Icon captions are visually hidden; speed remains a visible setting. Status, speed and map drawers share the panel surface and rim palette. Drawers open above the strip. Portrait layouts use the compact two-row arrangement.

Map frames hug their live canvases with no padded wood plate. Desktop panels use common safe outer margins and at least 16px between console sections. The minimap sits at the upper-right beneath the time bar; its existing zoom buttons attach to the lower frame edge. Clicking the minimap opens the full map, replacing the redundant desktop Map command. Save, full-screen, menu and help controls occupy the top rail. Phone controls retain their existing layout. The broad gray edge strips are removed. The renderer presents its existing minimap canvas inside the framed button, and draw/hit coordinates use the shared map rectangle. The phone keeps its existing map size and position. Frames hide outside the world HUD.

The previous desktop minimap relocation changed W6 from `8d7629ca` to `92f27da3`. This spacing pass deliberately realigns the desktop map with the other panel edges, updating W6 to `821e075c`. The targeted W1–W6 check covers that view change; the full worldprint run exceeded this runner’s 600s timeout. The requested upper-right relocation on 2026-11-12 changes W6 from `821e075c` to `a1a8a0c9`; the targeted measurement confirms W1–W5 still match. No generation, simulation, save or battle rules are changed.

Review targets: 1440×900, 1200×800 and 844×390 touch. Targeted checks and captures are exported under `/workspace/artifacts`.
