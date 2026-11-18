'use strict';
const WILDLIFE_AWARE={cover:.6,switch:.8};
/* ---------- data: critters ---------- */
// Wild game roams its habitat (where: climates, or 'forest' / 'hills'), runs when you come near and tires as it runs.
// Catch a herd to hunt it: meat for each animal brought down, sometimes a hide or antler (mat: [trophy, chance]).
// Livestock (live) lives in its holding's pasture, inside the fence (critters.js penEnts): to be seen, never sold; what the pasture
// makes of it (meat, milk, cheese, wool) goes to the holding (economy.js).
// spd: map speed while fleeing (your band walks at 36, more on a road or a mount); shy: how close you get before it bolts.
// (game of the woods (where has 'forest') is found mostly in them: a spot it may live on outside a wood is kept only keep of the
// time when it is placed (critters.js spawnCritter); its kinds of the open alone (goats, gazelles…) as ever)
const CRITTER_WOODS={keep:.3};
// (rare: {habitat: share}: a spot of that habitat kept only that share of the time when one is placed: reindeer and snow hares mostly
// in the snowy woods, some on the open snow. w: how often a kind is placed, against the others: hares are few)
// a hunted animal's figure in a battle (gfx/sprites.js wildKind): on, its battle figure (engine/wildlife.js, the owner, 2026-11-12: "make
// wildlife sprite a battle sprite too": shaded, outlined, walking, running and dying as the beasts do, at its real size); off, its map
// figure, as before
const WILD_ART={on:true};
/* how wild game lives between its flights (critters.js HERD_MIND and Herd draw; the owner, 2026-11-18: "add more wildlife behavior and
   recheck correctness"): night, as dark as this (darkness()), it beds down where it stands, lying with its legs folded under it;
   wary, anyone within this share past its shy reach stops it, its head up, facing him; drink, on a new turn this chance it walks to
   water within r tiles and stands at its edge (within at px of it) time s, its head down; town, px round a holding it keeps out of
   (and its lots: it walks off them, away from the holding); graze, s with its head down to the grass, then look s with it up;
   bound, px the leaps of its bounders reach as they flee, hop its hoppers' (bounce: their leaps a second) */
/* (flock: a herd's animals each on its own, a loose unit round the herd's point (critters.js herdFlock; the owner, 2026-11-18: "dont make
   them moving the same, make them move in formation like army but more spread like one unit"): most drawn of it; gap its width × between
   its ranks and files, jit that × of jitter; flee its spots that × wider as it bolts; pace an animal's speed against the herd's (+ its own
   share of pace[1]), amble px a s at least, catch × when gap × behind; start px from its spot before it sets off (its own share of the
   range: the first goes first, the rest follow); keep its width × apart at least; wander × gap each drifts about its spot at rest, over
   its own s in the range; split: a herd of n or more in two knots drifting apart, far × gap at most, and back over per s; turn: s
   between an idle one's turns, its own) (graze, look: slow, each on its own time, so a herd never ducks and rises as one) */
const WILD_LIFE={night:.55,wary:1.6,drink:{chance:.25,r:4,at:6,time:[4,8]},town:48,graze:[6,12],look:[2,4],bound:3,hop:2,bounce:3,
  flock:{most:6,gap:1.8,jit:.35,flee:1.8,pace:[.85,.3],amble:5,catch:1.6,start:[.6,2.4],keep:.8,wander:[.22,7,13],split:{n:4,far:2.4,per:[35,70]},turn:[3,8]},
  bounders:['deer','stag','reindeer','gazelle','ibex'],hoppers:['rabbit','hare']};
const CRITTERS={
  rabbit:{n:'Rabbits',one:'rabbit',where:['grass','forest'],herd:[2,4],meat:1,mat:['rabbitfur',.5],xp:2,spd:30,shy:50,w:4,size:1,col:'#b8a088'},
  deer:{n:'Deer',one:'deer',where:['forest','grass'],herd:[2,4],meat:3,mat:['hide',.6],xp:5,spd:40,shy:70,w:3,size:2,col:'#a0683a'},
  stag:{n:'Stag',one:'stag',where:['forest','hills'],herd:[1,1],meat:4,mat:['antler',.8],xp:12,spd:44,shy:80,w:1.2,size:3,col:'#8a5a30',antlers:true},
  ibex:{n:'Mountain goats',one:'mountain goat',where:['hills'],herd:[2,3],meat:2,mat:['hide',.4],xp:4,spd:34,shy:60,w:2,size:2,col:'#d8d0c0',horns:true},
  reindeer:{n:'Reindeer',one:'reindeer',where:['frost','snowwood'],rare:{frost:.3},herd:[3,5],meat:3,mat:['antler',.4],xp:6,spd:38,shy:70,w:3,size:2,col:'#7a6a5a',antlers:true},
  hare:{n:'Snow hares',one:'snow hare',where:['frost','snowwood'],rare:{frost:.3},herd:[2,3],meat:1,mat:['rabbitfur',.6],xp:2,spd:32,shy:50,w:.8,size:1,col:'#eef3f8'},
  gazelle:{n:'Gazelles',one:'gazelle',where:['desert'],herd:[2,4],meat:2,mat:['hide',.4],xp:5,spd:48,shy:85,w:3,size:2,col:'#d0a060',horns:true},
  fowl:{n:'Marsh fowl',one:'marsh fowl',where:['swamp'],herd:[3,6],meat:1,mat:null,xp:2,spd:28,shy:45,w:3,size:1,col:'#6a7a5a',bird:true},
  cow:{n:'Cattle',one:'cow',live:true,herd:[2,4],meat:8,spd:12,size:3,col:'#e8e4d0',spots:'#3a2a20',horns:true},
  sheep:{n:'Sheep',one:'sheep',live:true,herd:[3,6],meat:4,spd:12,size:2,col:'#eeeae0',wool:true},
  pig:{n:'Pigs',one:'pig',live:true,herd:[2,4],meat:5,spd:12,size:2,col:'#e0a0a0'},
  goat:{n:'Goats',one:'goat',live:true,herd:[2,4],meat:3,spd:14,size:2,col:'#a89880',horns:true},
  hen:{n:'Hens',one:'hen',live:true,herd:[3,6],meat:1,spd:12,size:1,col:'#c87a3a',bird:true},
  // (the land's own, kept only in its pastures (PASTURE_HERD): make, what their pasture makes a level a day in place of MAKE.pasture's;
  // a camel's and a reindeer's hides are furs. look: drawn as another kind, critters.js CRITTER_MAP; a kept reindeer one to a fenced
  // tile as a cow, size 3, its antlers high)
  camel:{n:'Camels',one:'camel',live:true,herd:[2,4],meat:6,spd:14,size:3,col:'#c8a070',make:{milk:3,cheese:.6,meat:1,furs:.75}},
  buffalo:{n:'Water buffalo',one:'water buffalo',live:true,herd:[2,4],meat:8,spd:12,size:3,col:'#55525a',horns:true,make:{meat:2.5,milk:3,cheese:.8}},
  tamereindeer:{n:'Reindeer',one:'reindeer',live:true,herd:[3,5],meat:5,spd:12,size:3,col:'#8c7a66',antlers:true,look:'reindeer',make:{meat:2,milk:1.5,cheese:.5,furs:.6}}
};
// a pasture's animals at their grazing (critters.js penSpots; the owner, 2026-11-16: "make animal in pasture walk instead of jumping
// frequently"): each stands grazing, then walks to another spot in its pen (its tile or the next), a turn of seg s (from its own dice), walk game px a
// second, a walk frame each stride px; x as far as its tile's room (up to roam px), y by yAmp
const PEN_WALK={seg:[7,15],walk:2.5,stride:1.6,roam:4,yAmp:1};
// where each kind of livestock can graze: ground (open, hills, forest) and climates (null: any)
const GRAZE={cow:{on:['open'],clim:['grass','swamp','frost']},sheep:{on:['open','hills'],clim:['grass','frost']},pig:{on:['open','forest'],clim:['grass','swamp','desert']},
  goat:{on:['open','hills'],clim:null},hen:{on:['open'],clim:null},camel:{on:['open','hills'],clim:['desert']},buffalo:{on:['open'],clim:['swamp','grass']},
  tamereindeer:{on:['open','hills'],clim:['frost']}};
// which animals each people keeps (a holding's herd with no pasture; a pasture's taste)
const LIVESTOCK={human:['cow','sheep','pig','hen'],dwarf:['goat','pig','sheep'],elf:['sheep','hen','goat'],orc:['pig','goat','cow']};
/* a pasture's herd (critters.js pastureHerd; the owner, 2026-10-23): its land chooses the animals: the climate where its barn
   stands, and on the grass the ground round it (PASTURE_LAND: hills, or the forest's edge, this share of the tiles within r tiles
   of it); its people's taste only tips the choice between them (taste: an animal they keep, LIVESTOCK, weighs this much more) */
const PASTURE_HERD={grass:['cow','sheep'],hills:['sheep','goat'],forest:['pig','goat'],frost:['tamereindeer','sheep'],desert:['goat','camel'],swamp:['pig','buffalo']};
const PASTURE_LAND={r:4,hill:.3,wood:.3,taste:1.5};
// today's wild game at most and at the start (a world's own: density(), data/world.js)
const CRITTER_CAP=density().critterCap,CRITTER_START=density().critterStart;
