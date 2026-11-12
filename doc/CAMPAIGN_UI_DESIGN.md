# Campaign UI

Status: shared campaign HUD implemented on codex. Desktop and phone use the same artwork, type, palette, frame material and condition components; layouts adjust their scale and placement.

`ui/icons.js` maps illustrated HUD glyphs to one transparent atlas. The nine-slice rim has true alpha outside its silhouette and a transparent center. Timber is a panel surface, not part of an icon crop. Legacy pixel glyphs remain available for other game symbols. No concept screenshot values or backgrounds are used as icons.

`ui/campaignhud.js` owns the live resource rail, company detail toggle, nearby-holding card and map frames. Its condition component renders the same fitness heart, morale standard, stamina bolt, Arial label, numeric value and gauge in the company card and phone strip. The narrower phone status layout hides only redundant names when needed; its full accessible party-status label remains.

The unframed desktop header shows only the current army name and its actual map flag, with no button background; clicking it opens the existing naming window. Resource icons fit within the rail. Low food or drink has a tinted cell and LOW badge in that rail, with no separate floating warning; supply cells open inventory. Gauges cover up to three days.

The desktop company card has no portrait. Stamina occupies its former left slot, beside fitness and morale; the detail toggle retains the full party information. Six illustrated commands and utility Help retain their original IDs and handlers. Nearby holdings show real faction, garrison and gate state; their buttons delegate to existing travel/gate rules and the full map. Time controls share one frame with an underline for selected speed. Day/weather has extra leading padding on desktop and phone.

Landscape phones retain one 52px strip and 44px controls. Icon captions are visually hidden; speed remains a visible setting. Status, speed and map drawers share the panel surface and rim palette. Drawers open above the strip. Portrait layouts use the compact two-row arrangement.

Map frames hug their live canvases with no padded wood plate. Desktop panels use the common safe outer margins and at least 16px between console sections. The broad gray edge strips are removed. The renderer presents its existing minimap canvas inside the framed button, and draw/hit coordinates use the shared map rectangle. The phone keeps its existing map size and position. Frames hide outside the world HUD.

The previous desktop minimap relocation changed W6 from `8d7629ca` to `92f27da3`. This spacing pass deliberately realigns the desktop map with the other panel edges, updating W6 to `821e075c`. The targeted W1–W6 check covers that view change; the full worldprint run exceeded this runner’s 600s timeout. No generation, simulation, save or battle rules are changed.

Review targets: 1440×900, 1200×800 and 844×390 touch. Targeted checks and captures are exported under `/workspace/artifacts`.
