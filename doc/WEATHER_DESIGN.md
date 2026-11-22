# Regional weather

Status: implemented on codex, 2026-11-22. The owner requested less frequent, more natural weather tied to locations rather than the player.

Weather keeps the existing 24-tile climate regions and seeded weather stream. Clear and overcast fronts last longer; rain lasts 2–3 game hours and storms 1–2. Every precipitation front is followed by at least eight dry hours. Frost remains snowier and swamps wetter than grassland; seasons still adjust the climate weights. Regions take a neighbour's front only when their climate and dry break allow it. All neighbours are read from the same hourly snapshot.

`Weather.at(x,y)` remains the canonical local weather for travel, sight, events and battle setup. `Weather.sample(x,y)` is a continuous visual mixture: it interpolates neighbouring region centres and blends the previous and current fronts over one game hour. It never reads player coordinates. A camera crossing a region edge sees a gradual change. The save retains previous fronts, change times and dry breaks; older saves default to established fronts with no pending dry break.

`WeatherArt.drawMap()` paints onto the main canvas in CSS pixels, outside the low-resolution terrain overlay. Geographic samples supply a small interpolated haze field and deterministic world-anchored rain, snow and sand. Particle lengths and widths stay constant under zoom and high device density; their number is bounded by the visual budget. Each precipitation kind drifts at its own speed, with gentle wind and intensity variation. The renderer draws nothing on unknown land and dims particles on remembered land. Campaign effects precede fog; world-combat effects precede HUD and the final minimap GUI pass. World combat visuals and its weather caption sample live fronts rather than its initial battle weather. Combat stat multipliers remain the battle setup values; this change refreshes the world sky and caption without rebasing unit stats. Dedicated battlefields retain their opening weather and modifiers.

Lightning is faint and occasional, only during local storms; reduced motion disables it and reduces precipitation. Weather visuals use hashes and time without advancing simulation random streams. No new assets or web requests are needed.

Validation: targeted `weatherlocal`, `weather` and minimap GUI checks, plus actual desktop and phone render previews. World generation and combat fingerprints are not re-recorded.
