# Mounts beyond the horse: each its own movement

Status: **ideas, not built** (the owner, 2026-11-03: "I think each of them should have different movements. no need to change yet"). Nothing here is in the game yet.

The owner, 2026-11-03: "can you make this movement but think for something cooler than horse?"

## How it would be built

The horse's movement is data-driven (`prototype/js/gfx/people.js` `HORSE_ART`):
- a body shape;
- per frame, each leg's joints (hip, knee or hock, fetlock, hoof);
- the body's bob, the head's pump, the tail's lag;
- the rider's seat a frame behind.

Each new mount is its own table in the same system, with its own shape, number of legs and gait frames. Adding one is mostly art.

## The mounts and how each moves

| Mount | Who rides it | Its movement |
|---|---|---|
| Horse | humans (Vale, Salt League) | the four-beat walk and gallop, as built |
| War-boar (tusked, bristled, armour plates) | Ashgor orcs, or Karn dwarves | a short, heavy charge: head low, back bouncing, legs churning fast |
| Dire wolf, warg (a mount today, old drawing) | Ashgor orcs | a bounding gallop, a greyhound's: the spine bending and stretching, two moments in the air a stride |
| Great stag, elk (a mount today) | Sylvan elves | springing leaps, the antlers held steady; light and graceful |
| Mountain ram (a mount today) | Karn dwarves | a sure-footed trot; the head butting forward on the charge |
| Desert raptor (a two-legged running lizard) | Salt League, desert bands | a two-legged sprint, a balancing tail, the head bobbing |
| Armoured beetle, giant lizard | rare, exotic heavy cavalry | six or four legs rippling in a wave: slow, relentless |
| Griffin (eagle before, lion behind) | elite knights, a lord's guard | a gallop, the wings half-open and flapping on each push; no flight |

## Suggested order (when the owner picks it up)

1. **The warg:** it exists already, and the biggest change in feel from a horse.
2. **The desert raptor:** the newest-looking.
3. **The rest, race by race;** the griffin last, as a rare elite.

Each mount needs a picture sheet (old beside new, 1×, 2×, 8×, with the black silhouettes) for the owner's judgement before it is merged, as the horse had.
