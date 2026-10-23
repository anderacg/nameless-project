'use strict';
/* ---------- data: tracks on the map (world/tracks.js keeps them, gfx/tracks.js draws them; doc/WORLD_DESIGN.md §12.7, the owner's
   2026-10-23). Every band that moves on the map leaves a trail: a point every sample px it walks, its prints drawn every step px
   between them. How clear a print is: its ground (by climate, times its cover's); none on roads, tracks, water and fords. How long
   it lasts: its climate's life in hours, cut by the weather there (the frost's snow fills them fastest, the desert's wind too).
   Who sees them: your own always while they last; others' by Scouting. Units: px, game hours, Scouting levels (0-10). ---------- */
const TRACKS={on:true,
  // a trail's point every sample px walked; a jump of more than gap samples (into a holding, out of one, a ferry) starts a new trail
  sample:24,gap:4,
  // the points kept in all, the oldest dropped first (slack: how far over the cap before they are cut back), never older than keep hours
  cap:4000,slack:400,keep:48,
  // how clear a print is (0-1): on open ground by its climate, times its cover's (hills fainter, woods very faint)
  ground:{grass:.55,frost:1,desert:1,swamp:.9},
  cover:{open:1,hill:.6,forest:.3},
  // the hours a print lasts on open ground in clear weather, by its climate (the desert's wind fills them fast) …
  life:{grass:36,frost:30,desert:14,swamp:30},
  // … and how many times faster the weather fills them (the frost's snow the fastest)
  weather:{clear:1,rain:2,storm:2.5,snow:3},
  // others' tracks, by your Scouting (lv): none older than age[0] + age[1] x lv hours, nor farther than your sight x
  // (range[0] + range[1] x lv) (at most your sight); your own: always while they last, in your sight
  see:{age:[3,3],range:[.25,.075]},
  // their card: from read[0] how many, how and which way; from read[1] who and how old; from read[2] their name and the hour.
  // A first reading of a trail trains Scouting by train
  read:[2,5,8],train:2,
  // the prints: px between them along a trail by their style; the most drawn a frame; how dark at their clearest
  step:{foot:6,hoof:7,paw:5,rut:3,drag:3},max:700,alpha:.8,
  // the size classes: up to size[0] people class 0 (a pair of prints), up to size[1] class 1, up to size[2] class 2, more class 3
  size:[2,9,29],
  // their colour on each ground; a bounty's band's once you have read one of its trails (a faint gold)
  col:{grass:'#24301a',frost:'#6f82a0',desert:'#6a4c2a',swamp:'#1c180f',known:'#e8c860'},
  // how a kind of beast walks (monsters by their kind; game: a size 1 animal paws, a bigger one hooves); the rest on foot
  beast:{wolf:'paw',boar:'hoof',tiger:'paw',bear:'paw',spider:'paw',troll:'foot',scorpion:'paw',wyrm:'drag',slime:'drag',griffin:'paw'},
  // what the card calls each style (mounted people: mounted)
  how:{foot:'on foot',hoof:'hooves',paw:'paws',rut:'wagon wheels',drag:'something dragged',mounted:'mounted'}
};
