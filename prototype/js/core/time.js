'use strict';
/* ---------- time: the one clock (doc/TIME_SPEED_DESIGN.md) ----------
   A game second is a real second at 1x, in every mode: the frame loop (main.js) hands it out in steps no longer than
   FRAME_TIME.step (core/frametime.js), to a battle as it is, to the map through map(dt).
   map(dt): the map's own seconds in dt game seconds. The map reckons in calendar time, a day DAY_SECONDS of its seconds (core.js),
   and how many of them a game second holds follows from the march's speed (core/speed.js Speed.mapRate), so a day's march covers
   the same ground at any speed on screen; day(): the game seconds of a day at 1x. */
const Time={
  map(dt){return dt*Speed.mapRate()},
  day(){return DAY_SECONDS/Speed.mapRate()}
};
