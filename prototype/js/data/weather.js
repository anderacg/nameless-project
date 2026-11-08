'use strict';
/* ---------- data: the weather (world/weather.js Weather keeps it, gfx/weather.js draws it; the owner, 2026-11-07: "add weather to
   the game like raining, sunny days, sandstorm etc. some events may relevant to them"). The map is cut into regions of cell x cell
   tiles, each with its climate (the most of its tiles') and its front: a kind of weather and the hour it ends. As a front ends the
   next is drawn from the stream 'weather' (core/rng.js): now and then a neighbour's (spread), if it can come there, else one by
   its climate's weights (climates). Units: tiles, game hours, multipliers.
   on: off, the old way (ambient.js ambWeather: the frost's snow, clear elsewhere; nothing drawn, nothing slowed): the test suites
   run with it off (tests/harness.js), so the fingerprints stand; tests/weather.js turns it on.
   kinds (their order is the save's: an index each):
     n its name (by day a clear sky is day's); like: what the older readers know it as (ambient.js birds, data/tracks.js): clear, rain,
     storm or snow; hours: [least, most] a front of it lasts; say: the line as it comes over you;
     speed: travel on the map x (at home in its climate only home of the loss: speedAt); sight: sight on the map x (visMulAt);
     battle: the field's, as a battle starts there (setup.js battleEnv: env.w): spd everyone's pace x, range shooters' reach x,
       spread an arc's length scatter x, aim a shot's aim off by up to so many radians, sight each man's sight x (B.sightK)
     art (gfx/weather.js): dim the sky's shade [r, g, b, a]; fall {n drops or flakes at full strength, vx, vy px/s, len a streak's
       px (0: a flake), sway px, col}; veil a haze over all [r, g, b, a] and its drifting bands (bands); flash: lightning every
       s, lasting len s ---------- */
const WEATHER={on:true,
  // a region's side in tiles; how often a new front takes a neighbour's; the share of the loss a race at home in the climate feels
  cell:24,spread:.35,home:.5,
  // seconds (real) the drawing eases from one weather to the next, the old fading out as the new fades in; the share of the particles
  // drawn with reducedMotion, and their pace; the size (px) of a haze band's soft cloud, drawn up over the view (gfx/weather.js band);
  // game hours a new front takes to build to its full strength (drawn: a shower before the rain, a haze before the fog)
  ease:5,calm:.35,slow:.3,band:[64,32],build:1.5,
  // the seasons (the owner, 2026-11-08: "make it into a seasons"), in the year's order, CLOCK.year days shared between them (a game
  // begins in spring): n its name; mul each kind's chance x there; add more chance of a kind in a climate (winter's snow on the
  // grass and in the swamps, summer's rain in the frost, winter's in the desert)
  seasons:[
    {k:'spring',n:'Spring',mul:{rain:1.4,storm:1.1,fog:1.2,clear:.9,snow:.6,blizzard:.4,heat:.5}},
    {k:'summer',n:'Summer',mul:{clear:1.3,heat:2.2,storm:1.4,sandstorm:1.4,rain:.7,fog:.4,snow:.4,blizzard:.2},add:{frost:{rain:1.2}}},
    {k:'autumn',n:'Autumn',mul:{rain:1.5,fog:1.8,cloudy:1.3,storm:1.1,clear:.8,heat:.3}},
    {k:'winter',n:'Winter',mul:{snow:1.8,blizzard:1.8,fog:1.3,cloudy:1.2,clear:.8,rain:.5,storm:.4,heat:0,sandstorm:.7},add:{grass:{snow:1.6},swamp:{snow:.8,fog:.6},desert:{rain:.6}}}],
  // each climate's weights (a kind missing never comes there: no sandstorm in the frost, no blizzard in the desert)
  climates:{
    grass:{clear:5,cloudy:3,rain:2.5,storm:.8,fog:1.2},
    frost:{clear:2.5,cloudy:3,fog:1,snow:3.5,blizzard:1.3},
    desert:{clear:6,cloudy:1,heat:2,sandstorm:1.3,storm:.2},
    swamp:{clear:2.5,cloudy:3,rain:3,storm:1,fog:2.5}},
  kinds:{
    clear:{n:'Clear',day:'Sunny',like:'clear',hours:[6,14],say:'The sky clears.',speed:1,sight:1},
    cloudy:{n:'Overcast',like:'clear',hours:[4,10],say:'Clouds roll in.',speed:1,sight:.95,
      art:{dim:[40,46,60,.12]}},
    rain:{n:'Rain',like:'rain',hours:[3,8],say:'Rain begins to fall.',speed:.85,sight:.8,
      battle:{spd:.95,range:.9,spread:2,aim:.04,sight:.85},
      art:{dim:[30,38,56,.18],fall:{n:110,vx:-40,vy:300,len:6,col:'#aebfda'}}},
    storm:{n:'Storm',like:'storm',hours:[2,5],say:'A storm breaks over you.',speed:.7,sight:.65,
      battle:{spd:.9,range:.8,spread:3,aim:.08,sight:.7},
      art:{dim:[16,20,36,.34],fall:{n:190,vx:-110,vy:380,len:8,col:'#b8c6e0'},flash:{every:7,len:.14}}},
    fog:{n:'Fog',like:'clear',hours:[3,7],say:'A thick fog rises.',speed:.9,sight:.5,
      battle:{sight:.5},
      art:{veil:[206,210,216,.34],bands:5}},
    snow:{n:'Snow',like:'snow',hours:[4,10],say:'Snow starts to fall.',speed:.85,sight:.8,
      battle:{spd:.92,range:.95,sight:.8},
      art:{dim:[60,68,84,.08],fall:{n:90,vx:8,vy:22,len:0,sway:6,col:'#ffffff'}}},
    blizzard:{n:'Blizzard',like:'snow',hours:[2,6],say:'A blizzard howls in.',speed:.55,sight:.4,
      battle:{spd:.8,range:.75,spread:2.5,aim:.06,sight:.45},
      art:{veil:[232,238,246,.3],bands:3,fall:{n:240,vx:-120,vy:70,len:0,sway:10,col:'#ffffff'}}},
    sandstorm:{n:'Sandstorm',like:'storm',hours:[2,6],say:'A sandstorm sweeps in.',speed:.55,sight:.4,
      battle:{spd:.85,range:.8,spread:2.5,aim:.06,sight:.45},
      art:{veil:[196,158,96,.36],bands:4,fall:{n:170,vx:220,vy:24,len:3,col:'#dcbc80'}}},
    heat:{n:'Heat wave',like:'clear',hours:[6,12],say:'The heat grows fierce.',speed:.9,sight:1,
      battle:{spd:.95},
      art:{dim:[255,196,110,.07]}}},
};
// (the kinds in their order: the save's indices)
const WEATHER_KINDS=Object.keys(WEATHER.kinds);
