# Campaign UI

Status: first playable campaign HUD implemented on codex. The approved campaign concept guides materials and layout; army windows and battle HUD remain later phases.

The desktop HUD has a heraldic title, a live resource rail, original clock controls, a timber command console, company portrait and condition meters, and a survey frame around the real canvas minimap. Company details expands the existing complete party card. All seven window shortcuts and five utility controls keep their original IDs, handlers and keys. Resource values come from the game, including food and drink warnings below one day; supply gauges show coverage up to three days. No illustration values are used.

Frames use a painted nine-slice iron/brass panel and an oak texture. The title cloth and command/resource illustrations use decorative regions of the approved concept through SVG viewBoxes. No illustrated resource values or gameplay state are displayed. Labels remain Arial and sprites retain pixel rendering. Landscape phones place status and the five existing controls in one 52px strip, with 44px buttons. Smaller portrait layouts retain a shortened two-row stack. Drawers still open above the controls. The campaign decorations hide outside the world screen.

`ui/campaignhud.js` owns the resource rail, detail toggle and desktop minimap slot. `gfx/render.js` uses that slot for drawing; full-map hit testing already uses the same rectangle. The renderer presents its existing live minimap canvas inside a transparent button; that button opens the original map control and makes the minimap keyboard accessible. No cutout through the console is needed. Help sits with the utility controls, leaving six illustrated main commands. The company card has external labels and inset condition meters. Ongoing actions sit above the console, and tracked quests sit under the clock. A nearby-holding card shows the real name, faction, garrison and gate status; its actions use normal approach/gate handling or the full map. Mobile minimap placement stays with the existing layout.

Visual fingerprint: W6 changes from `8d7629ca` to `92f27da3` because the desktop minimap moves from the top-right corner into the bottom console. This is the only updated baseline. W1–W5, W7–W8, B2 and all generator sums held. No world or battle rules were edited.

Review: desktop at 1440×900 and 1200×800; landscape touch at 844×390. Targeted checks: campaignhud, structure, mobilehud, fullmap and worldprint. Captures and check results are exported under `/workspace/artifacts`.
