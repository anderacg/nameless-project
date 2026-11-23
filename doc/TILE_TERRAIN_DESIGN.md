# Terrain tile prototype

Status: **prototype**, 2026-11-23. The owner approved testing grassland, a road and a riverbank before converting the world renderer.

## What is built

`prototype/terrain-tiles.html` is a standalone, responsive preview. Grass, Road, Riverbank and Combined show the same renderer. Rebuild clears that scene's section cache; the header reports its first draw and cached draw. It loads one local PNG and needs no world generation or external service.

`gfx/tileground.js` assembles ground from a prebuilt texture atlas. Eight variants of grass, dirt, bank, wet ground, shallow water and deeper water share the game's material colours. A seventh atlas row holds transparent grass tufts for the edges. `art/terrain/build_tiles.py` creates the PNG offline with fixed seeds; the browser performs no per-pixel texture generation.

Roads and rivers retain the existing world's curved centre lines and varying widths (`waysOf`, `RA`, `SA`). Textures are clipped to ribbon shapes; the renderer does not replace a river with square water cells. Curves are simplified once with position and width error limits, then indexed by section. Each connected run has one outline with rounded ends. Drawing a circle at every original segment was substantially slower and was removed during the prototype.

Finished 64 × 64 world-pixel sections are cached at 2× resolution. The scene keeps at most 48: approximately **3 MiB of raw RGBA section pixels**, excluding browser/GPU overhead, plus the atlas and small repeated material patterns. Variants and texture phases use world coordinates so neighbouring sections stitch together. Renderer choices never advance the simulation RNG.

## Optional game test

Open `Ashmark.html?tileground` to try the tile foundation while detailed terrain is missing. Normal play keeps the existing renderer and does not load this atlas.

The optional overlay accepts flat, unoccupied grass-climate land, roads and curved rivers. Other climates, forests, hills, cliffs, still-water coastlines and occupied ground keep the existing fallback. Uniform ground lift is applied to the sampled texture coordinates so roads remain aligned with lifted units.

The old fallback remains underneath missing sections. Completed tile sections appear immediately; they do not wait for an entire 512-pixel procedural chunk. New section preparation targets **2 ms per frame**, shared across fallback calls and limited by the existing frame deadline. A started section finishes before that budget is checked again; it is not a hard real-time guarantee. Cached sections can still be drawn when the preparation budget is exhausted. The complete procedural artwork replaces the foundation when ready.

This is an integration experiment, not a replacement of the final painter. It reduces the time spent looking at a flat minimap placeholder on supported land. It does not yet remove the cost of generating the final terrain. Initial world-way preparation and geometry indexing are also one-time main-thread costs and need scheduling before a production rollout.

## Comparison and checks

`tests/tileground.js` checks local atlas loading, deterministic variations, road/water/bank materials, section seams, cache reuse and eviction, exhausted budgets, unsupported ground and the optional fallback hook. It compares three 128 × 128 world-pixel samples against `paintSteps` at 2× resolution and records first/cached draw time, geometry-index time and raw cache bounds. The samples use the same generated-world road and river geometry.

These timings compare a **tile foundation** with the **complete procedural paint**, which also handles relief and nature. They are not equivalent feature coverage, an iPhone measurement or a whole-game FPS claim. Report the measured preparation cost, not a claimed game-wide speed multiplier. The standalone preview is also checked on desktop and phone-sized browser viewports.

## Before replacing the world renderer

- Preserve relief, cliffs, depth/occlusion arrays, bridge ramps, water depth and fords.
- Add climate and season transitions, road-end fades, coasts, yards and farm ground.
- Keep buildings, units, trees and animated grass/crops as separate layers.
- Schedule geometry setup and section preparation through the normal loading/frame budget.
- Measure actual phone travel, fast travel, camera drags, memory pressure and battle transitions.
- Compare art quality at matched resolution before choosing the production atlas size and cache budget.
