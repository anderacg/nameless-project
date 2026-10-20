'use strict';
/* ---------- the clock: one place that reads the world's time (doc/CORE_DESIGN.md, K2) ----------
   The time itself stays where it is saved: G.day (the day, from 1) and G.clock (the time of day, 0 to DAY clock units:
   core.js DAY, DAY_SECONDS, NIGHT_AT). Clock reads it in the very arithmetic the old helpers used, so every number comes out
   the same to the last bit; advance (world.js updateWorld's step) and passHours (the road's wait) move it on, running dayTick
   on a new day and then Systems.hour on each new hour (core/systems.js). The old helpers stay as aliases of it: timeOfDay and
   darkness (render.js), worldTime (stay.js), roadNow, roadDay and roadHours (encounters.js), dayPart (folk.js), watchNow
   (patrols.js).
   The units:
   - frac: the share of today gone, 0 to 1 (the first NIGHT_AT of it daylight);
   - hour: the hour of the day, 0 to 24;
   - worldTime: clock units since the world began (DAY of them a day: the timers that count in clock units);
   - hours: hours since the world began (the road's timers: encounters.js).
   CLOCK.year: the days of a year (the tournaments' calendar, doc/TOURNAMENTS_DESIGN.md: the owner's 120). */
const CLOCK={year:120};
const Clock={
  // the day (from 1)
  get day(){
    return G.day;
  },
  // the share of today gone, 0 to 1
  get frac(){
    return G.clock/DAY;
  },
  // the hour of the day, 0 to 24
  get hour(){
    return G.clock/DAY*24;
  },
  // night: from NIGHT_AT of the day on, to the day's end
  get isNight(){
    return G.clock/DAY>=NIGHT_AT;
  },
  get isDay(){
    return G.clock/DAY<NIGHT_AT;
  },
  // the part of the day in words: Dawn, Morning, Midday, Afternoon, Dusk, Night, Before dawn
  part(){
    const t=G.clock/DAY;
    return t<.07?'Dawn':t<.25?'Morning':t<.375?'Midday':t<NIGHT_AT?'Afternoon':t<NIGHT_AT+.1?'Dusk':t<.9?'Night':'Before dawn';
  },
  // how dark it is, 0 (day) to 1: night falls over the first fifth of the dark half and lifts over its last fifth
  darkness(){
    const t=G.clock/DAY;
    if(t<NIGHT_AT)return 0;
    const n=(t-NIGHT_AT)/(1-NIGHT_AT);
    return n<.2?n/.2:n>.8?(1-n)/.2:1;
  },
  // clock units since the world began
  worldTime(){
    return G.day*DAY+G.clock;
  },
  // hours since the world began
  hours(){
    return G.day*24+G.clock/DAY*24;
  },
  // hours since t (a time in hours), and days since day d
  hoursSince(t){
    return this.hours()-t;
  },
  daysSince(d){
    return G.day-d;
  },
  // every n days: true on the days that divide by n
  every(n){
    return G.day%n===0;
  },
  // the year (from 1) and the day of the year (from 1), CLOCK.year days to a year
  year(){
    return Math.floor((G.day-1)/CLOCK.year)+1;
  },
  dayOfYear(){
    return (G.day-1)%CLOCK.year+1;
  },
  // the world-paced seconds of an hour, and the hours in d world-paced seconds (the road's travel: encounters.js)
  hourSecs(){
    return WORLD_PACE*DAY_SECONDS/24;
  },
  hoursIn(d){
    return d/WORLD_PACE*24/DAY_SECONDS;
  },
  // the clock on by u clock units, a moment on the map (world.js updateWorld): a new day's tick (world.js dayTick) when it rolls
  // over, then each new hour's (Systems.hour, core/systems.js)
  advance(u){
    const h0=this.hourCount();
    G.clock+=u;
    if(G.clock>=DAY){
      G.clock-=DAY;
      dayTick();
    }
    this.hoursFrom(h0);
  },
  // the clock on by h hours at once (waiting on the road: encounters.js roadHours), each new day's tick run, then each new hour's
  passHours(h){
    const h0=this.hourCount();
    G.clock+=h*DAY/24;
    while(G.clock>=DAY){
      G.clock-=DAY;
      dayTick();
    }
    this.hoursFrom(h0);
  },
  // whole hours since the world began, and Systems.hour(hour of the day) for each one begun since h0
  hourCount(){
    return G.day*24+Math.floor(G.clock/DAY*24);
  },
  hoursFrom(h0){
    const h1=this.hourCount();
    for(let k=h0+1;k<=h1;k++)Systems.hour(k%24);
  },
};
