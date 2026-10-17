---
name: ashmark-art
description: Role skill for agents drawing or changing Ashmark's code-drawn pixel art — map figures, animals, buildings, ships, battle sprites (prototype/js/gfx/*, engine/*, sprite code in js/world/*). Covers the owner's art rules (power-of-two cells, realistic proportions, muted hue-shifted palettes), the approval workflow with screenshots, and the checks to run. Load after ashmark-core for any visual/sprite task.
---

# Pixel art (all drawn by code)

## Owner's art rules (strict)
- Sprites live in **power-of-two cells**: 8, 16, 32, 64. The drawn pixels may be smaller than the cell (a 4×6 critter in an 8 cell is fine).
- **Realistic proportions** against people: people are **16×16 template figures** (`js/gfx/people.js`: `mapPerson`, `followerSprite`, `workerSprite`, `peopleSprite`, battle templates like `MOUNT_T`). A horse is the battle horse (32 cell); an ox cart with drover is 64; a cog is ~57 px in a 64 cell; a rowing boat 32.
- **Muted, hue-shifted palettes** (ramps via `pal`/`rampOf`; faction colour blended warm for lights and cool for shades, never garish). Outline with the existing helper (`poutline`).
- Medieval, structurally varied; **one building per 16 px tile**, consistent depth. Generators for buildings live in `engine/` (PX namespace).
- Keep animation hooks callers expect (frame counts), and anchor sprites by cell size so feet stay on the map row; labels move with `figTop`.

## Workflow
1. Read how existing sprites of the same kind are built and called (grep the sprite function and its callers).
2. Draw; cache per variant (seed, colour, frame).
3. **Make images:** a temporary harness page (`tests/zz_<prefix>_*.js`, see `tests/visual/`) rendering a lineup at 6–8× (old vs new, next to a person and related sprites for scale) and an in-context map/battle shot (`&v=1`). Save PNGs to the scratchpad, **Read them yourself**, iterate until right.
4. Hand the PNG paths to the coordinator: **the owner approves art before commit.** Delete temporary tests (keep PNGs).

## Checks
`pixels` (power-of-two cells, whole-pixel drawing), `people`, `mappolish`, `mapview`, `clicks` (bigger sprites must stay clickable via the drawn box, without stealing small figures' clicks), `structure`, plus suites for the systems using the sprite.
