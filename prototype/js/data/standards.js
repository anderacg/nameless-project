'use strict';
/* ---------- data: standards (doc/STANDARDS_DESIGN.md): a realm's flags on its land, their guards ---------- */
// STANDARD: its guards by level (1-3: guards[lv]); hold: the hours you must stay by one whose guards you beat (within r px) to raise
// your banner; renown for one you take, and thanks (honour) from the realm you take it for; regrow: a realm's guards back a day;
// hostile: attacking one of a realm not at war with you (days hostile, honour); I0: their site numbers (far past the world's own)
// grow: held in peace days[lv] days, it grows to lv + 1, paid cost[lv + 1] from its realm's nearest holding's stores; repair: a
// tower broken in its taking mended days on, paid cost; sentries: at most most walking a ring r px round it, a lap each lap and a
// stride each stride game minutes
const STANDARD={on:true,guards:[0,3,6,10],hold:4,r:44,renown:4,thanks:6,regrow:1,I0:200000,hostile:{days:20,honor:-10},
  grow:{days:[0,8,14],cost:{2:{timber:14},3:{timber:8,stone:20}}},repair:{days:4,cost:{timber:6,stone:6}},sentries:{most:3,r:14,lap:40,stride:2},
  // (phase 3) capture: a lord with more times its guards within r tiles takes it, chance a day; a band takes one held by weak guards
  // or fewer, its men its guards (lairMost at most); lair: the bands that make one their lair (kinds), a band out of it every
  // days while fewer than most are out, of n men (and the days'); own: yours keeps a man a day from your nearest holding's
  // garrison while it keeps keep; sight: tiles of fog lifted round yours and your employer's; safe: no band raised within safe
  // tiles of a held one (world.js spawnBandit)
  capture:{r:6,more:2,chance:.5,weak:1,lairMost:12},lair:{kinds:['bandits','raiders','bog','goblins'],every:4,most:2,n:[3,5]},own:{keep:4},sight:7,safe:9,
  // (phase 5) tower: its tower in a fight on the world map (world/standards.js StandardTower): its top rise[lv] levels over the ground
  // (HILL.range a level on its archers' range; no blade between its top and the ground: terrain.js apart), perch[lv] of its archers posted on it in a fight for it,
  // its men drawn top[lv] of its model's height up (its platform), its ladder ladder cells wide on the side away from your army (a world battle's man needs more than one: terrain.js routeBody)
  tower:{rise:[0,0,2,3],perch:[0,0,2,4],top:[0,0,.26,.3],ladder:3},
  T:{n:'Outpost',ico:'banner',col:'#e8b94a',d:'A realm’s outpost on its land: a tall flag pole on a stepped stone plinth, its banners hung from a crossbar, its guards beside it.'}};// (an outpost to the player, a standard in the code)
// STANDARD_PLACE: where they stand (doc §2). score: by why (a deposit, a pass, a ford, a road crossing), and add more on a border with
// another realm's land (within border.r tiles); town: tiles from any holding, clear: tiles to anything built; gap: tiles between two; per province base + one for
// each per of its holdings, most at most, one more where it borders another realm, a kind it has already worth same less (its
// crossings, fords and passes as well as its deposits); lv: the score for level 2 and 3; near: tiles
// from its spot it may stand to keep off the road
const STANDARD_PLACE={score:{deposit:3,fish:2,pass:2.5,ford:2,crossing:1.5},border:{r:8,add:2},town:7,clear:2,gap:16,base:1,per:4,most:3,same:2,lv:[3,4.5],near:3};
// its name by why it stands there: '<the nearest holding> ford', '<the nearest holding> iron diggings'
const STANDARD_WHY={crossing:'crossroads',ford:'ford',pass:'pass',deposit:'diggings',fish:'fishing grounds'};
// its picture (world/standards.js standardSprite): the stone plinth's ramp, the iron pole's, the bare rags of one no one holds
// broken: the share of its tower's height gone when it lies broken
const STANDARD_ART={stone:['#c4bcae','#a39b8c','#7f786b','#5a554b'],iron:['#8a8c94','#5e6068','#3e4048'],rag:'#6a5a48',rope:'#c8b070',broken:.45};
