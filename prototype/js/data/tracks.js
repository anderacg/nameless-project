'use strict';
/* ---------- data: tracks on the map (world/tracks.js keeps them, gfx/tracks.js draws them; doc/WORLD_DESIGN.md §12.7, the owner's
   2026-10-23). Every band that moves on the map leaves a trail: a point every sample px it walks, its prints drawn every step px
   between them. How clear a print is: its ground (by climate, times its cover's; a road's own, faint); none on water, fords and a
   bridge's deck. How long it lasts: its climate's life in hours (a road's, short), cut by the weather there (the frost's snow
   fills them fastest, the desert's wind too).
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
  // on a road (the owner, 2026-10-23): dust prints on a dirt road (a track between places, an estate's track), faint on a great
  // road's paving; how clear (0-1) and the hours they last, short (the traffic and the carts tread them out; the weather cuts them too)
  road:{ground:{dirt:.5,great:.3},life:{dirt:10,great:5}},
  // others' tracks, by your Scouting (lv): none older than age[0] + age[1] x lv hours, nor farther than your sight x
  // (range[0] + range[1] x lv) (at most your sight); your own: always while they last, in your sight
  see:{age:[3,3],range:[.25,.075]},
  // their card: from read[0] how many, how and which way; from read[1] who and how old; from read[2] their name and the hour.
  // A first reading of a trail trains Scouting by train
  read:[2,5,8],train:2,
  // the prints: px between them along a trail by their style; the most drawn a frame; how dark at their clearest
  step:{foot:13,hoof:13,paw:12,rut:3,drag:3},max:700,alpha:.8,
  // the prints (gfx/tracks.js trackPic): lanes px apart across a band's way, steps stagger px apart along it; their details
  // (tread, nails, a hoof's frog) lighter (detail)
  lane:7,stagger:3,detail:'rgba(255,246,222,.3)',
  // the size classes: up to size[0] people class 0 (a pair of prints), up to size[1] class 1, up to size[2] class 2, more class 3
  size:[2,9,29],
  // their colour on each ground; a bounty's band's once you have read one of its trails (a faint gold); on a road (dust)
  col:{grass:'#24301a',frost:'#6f82a0',desert:'#6a4c2a',swamp:'#1c180f',known:'#e8c860',road:'#2a1c0e'},
  // how a kind of beast walks (monsters by their kind; game: a size 1 animal paws, a bigger one hooves); the rest on foot
  beast:{wolf:'paw',boar:'hoof',tiger:'paw',bear:'paw',spider:'paw',troll:'foot',scorpion:'paw',wyrm:'drag',slime:'drag',griffin:'paw'},
  /* the prints' look (the owner, 2026-10-29: the art's tracks, art/tracks.svg; pixelated: data/trackart.js TRACK_PX, by art/tracks.py), by
     who left them (world/tracks.js Track#art): soldiers (yours, a lord's, a watch, your companions') hobnailed boots, a band boots,
     refugees bare feet, riders shod hooves, a wagon's ruts; a beast by its kind (beast), game by its size (big, small); else by
     its style (style). px: a print's length in game px (a band's ruts or drag: its width across; art/tracks.py reads these:
     run it again after a change) */
  art:{who:{you:'hobnail',lord:'hobnail',patrol:'hobnail',cparty:'hobnail',band:'boot',refugee:'barefoot',caravan:'ruts'},mounted:'horse',
    beast:{wolf:'wolf',boar:'cloven',tiger:'cat',bear:'bear',spider:'talon',troll:'troll',scorpion:'talon',wyrm:'dragon',slime:'drag',griffin:'talon'},
    game:{big:'cloven',small:'wolf'},style:{foot:'boot',hoof:'hoof',paw:'wolf',rut:'ruts',drag:'drag'},
    px:{hobnail:7,boot:7,barefoot:6,horse:6,hoof:6,cloven:5,wolf:4.5,bear:7,cat:5,troll:11,talon:6,dragon:12,ruts:7,drag:3}},
  // what the card calls each style (mounted people: mounted)
  how:{foot:'on foot',hoof:'hooves',paw:'paws',rut:'wagon wheels',drag:'something dragged',mounted:'mounted'}
};
