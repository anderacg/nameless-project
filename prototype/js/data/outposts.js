'use strict';
/* ---------- data: outposts (doc/OUTPOSTS_DESIGN.md): a realm's flags on its land, their guards ---------- */
// OUTPOST: its guards by level (1-3: guards[lv]); hold: the hours you must stay by one whose guards you beat (within r px) to raise
// your banner; renown for one you take, and thanks (honour) from the realm you take it for; regrow: a realm's guards back a day;
// hostile: attacking one of a realm not at war with you (days hostile, honour); I0: their site numbers (far past the world's own)
// grow: held in peace days[lv] days, it grows to lv + 1, paid cost[lv + 1] from its realm's nearest holding's stores; repair: a
// tower broken in its taking mended days on, paid cost; sentries (walk: the least px a real second a sentry walks on toward his place
// on his beat, as a marcher; snap: farther behind it than this, he is put there): at most most on the map, a breath at a post each stride × 4 game minutes (walking, a step by the way walked: outposts.js draw); their
// beat (the owner, 2026-11-11: "patrol around the flag and stop, dont make them always walk, and they should go rest in the tower like
// garrison"): posts in an arc in front of the flag, r px either side, walked at pace px a game minute, a stand of stand game
// minutes at each; after a round of them, rest game minutes in its tower (none standing: by the flag's foot), each sentry's turn
// a share of the round apart, so one rests while the others walk
// (an outpost's site type in W.sites, as saves keep it: the word it was first named by, kept so a save before the rename still loads)
const OUTPOST_TYPE='standard';
const OUTPOST={on:true,guards:[0,3,6,10],hold:4,r:44,renown:4,thanks:6,regrow:1,I0:200000,hostile:{days:20,honor:-10},
  grow:{days:[0,8,14],cost:{2:{timber:14},3:{timber:8,stone:20}}},repair:{days:4,cost:{timber:6,stone:6}},sentries:{most:3,r:28,stride:2,posts:4,pace:4,stand:[20,40],rest:120,walk:16,snap:40},
  // (phase 3) capture: a lord with more times its guards within r tiles takes it, chance a day; a band takes one held by weak guards
  // or fewer, its men its guards (lairMost at most); lair: the bands that make one their lair (kinds), a band out of it every
  // days while fewer than most are out, of n men (and the days'); own: yours keeps a man a day from your nearest holding's
  // garrison while it keeps keep; sight: tiles of fog lifted round yours and your employer's; safe: no band raised within safe
  // tiles of a held one (world.js spawnBandit)
  capture:{r:6,more:2,chance:.5,weak:1,lairMost:12},lair:{kinds:['bandits','raiders','bog','goblins'],every:4,most:2,n:[3,5]},own:{keep:4},sight:7,safe:9,
  // (phase 5) tower: its tower in a fight on the world map (world/outposts.js OutpostTower): its top rise[lv] levels over the ground
  // (HILL.range a level on its archers' range; no blade between its top and the ground: terrain.js apart), perch[lv] of its archers posted on it in a fight for it,
  // its men drawn top[lv] of its model's height up (its platform), its ladder ladder cells wide on the side away from your army (a world battle's man needs more than one: terrain.js routeBody); look: s between
  // its archers' looks for a foe up on its top (then they fall back from the ladder)
  tower:{rise:[0,0,2,3],perch:[0,0,2,4],top:[0,0,.26,.3],ladder:3,look:.5},
  // land: the land a held one claims round it for its realm (world/territory.js, as a holding's reach: travel cost from its tile),
  // reach[lv] by its level (one fewer while its tower lies broken); its tiles its realm's nearest holding's
  land:{reach:[0,5,7,9]},
  T:{n:'Outpost',ico:'banner',col:'#e8b94a',d:'A realm’s outpost on its land: a tall flag pole on a stepped stone plinth, its banners hung from a crossbar, its guards beside it.'}};// (an outpost to the player, a standard in the code)
// OUTPOST_PLACE: where they stand (doc §2). score: by why (a deposit, a pass, a ford, a road crossing), and add more on a border with
// another realm's land (within border.r tiles); town: tiles from any holding, clear: tiles to anything built; gap: tiles between two; per province base + one for
// each per of its holdings, most at most, one more where it borders another realm, a kind it has already worth same less (its
// crossings, fords and passes as well as its deposits); lv: the score for level 2 and 3; near: tiles
// from its spot it may stand to keep off the road
const OUTPOST_PLACE={score:{deposit:3,fish:2,pass:2.5,ford:2,crossing:1.5},border:{r:8,add:2},town:7,clear:2,gap:16,base:1,per:4,most:3,same:2,lv:[3,4.5],near:3};
// its name by why it stands there: '<the nearest holding> ford', '<the nearest holding> iron diggings'
const OUTPOST_WHY={crossing:'crossroads',ford:'ford',pass:'pass',deposit:'diggings',fish:'fishing grounds'};
// its picture (world/outposts.js outpostSprite): the stone plinth's ramp, the iron pole's, the bare rags of one no one holds
// broken: the share of its tower's height gone when it lies broken
// ladder: its tower's ladder in battle (OutpostTower.draw, ladderSprite), world px: w wide at its foot, top at its top (it narrows
// up), a rung every step, over: its top over the parapet behind, lean: its foot that far out from the wall (a side's), rail: its
// rails' light, mid and shade, rung: a rung's top and its underside, rope: the lashings at every other rung, knot: the grain's,
// shadow: on the wall behind, broken: the chance one rung of it is snapped (half of it left)
const OUTPOST_ART={stone:['#c4bcae','#a39b8c','#7f786b','#5a554b'],iron:['#8a8c94','#5e6068','#3e4048'],rag:'#6a5a48',rope:'#c8b070',broken:.45,
  ladder:{w:6,top:4,step:3,over:3,lean:2,rail:['#a8794a','#7d5532','#56381f'],rung:['#c69257','#8e6036'],rope:'#cdb67a',knot:'#4a2f19',shadow:'rgba(24,16,8,.3)',broken:.5}};
