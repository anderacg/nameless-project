'use strict';
/* ---------- data: standards (doc/STANDARDS_DESIGN.md): a realm's flags on its land, their guards ---------- */
// STANDARD: its guards by level (1-3: guards[lv]); hold: the hours you must stay by one whose guards you beat (within r px) to raise
// your banner; renown for one you take, and thanks (honour) from the realm you take it for; regrow: a realm's guards back a day;
// hostile: attacking one of a realm not at war with you (days hostile, honour); I0: their site numbers (far past the world's own)
const STANDARD={on:true,guards:[0,3,6,10],hold:4,r:44,renown:4,thanks:6,regrow:1,I0:200000,hostile:{days:20,honor:-10},
  T:{n:'Standard',ico:'banner',col:'#e8b94a',d:'A realm’s standard on its land: a tall pole on a stepped stone plinth, its banners hung from a crossbar, its guards beside it.'}};
// STANDARD_PLACE: where they stand (doc §2). score: by why (a deposit, a pass, a ford, a road crossing), and add more on a border with
// another realm's land (within border.r tiles); town: tiles from any holding, clear: tiles to anything built; gap: tiles between two; per province base + one for
// each per of its holdings, most at most, one more where it borders another realm, a kind it has already worth same less (its
// crossings, fords and passes as well as its deposits); lv: the score for level 2 and 3; near: tiles
// from its spot it may stand to keep off the road
const STANDARD_PLACE={score:{deposit:3,fish:2,pass:2.5,ford:2,crossing:1.5},border:{r:8,add:2},town:7,clear:2,gap:16,base:1,per:4,most:3,same:2,lv:[3,4.5],near:3};
// its name by why it stands there: '<the nearest holding> ford', '<the nearest holding> iron diggings'
const STANDARD_WHY={crossing:'crossroads',ford:'ford',pass:'pass',deposit:'diggings',fish:'fishing grounds'};
// its picture (world/standards.js standardSprite): the stone plinth's ramp, the iron pole's, the bare rags of one no one holds
const STANDARD_ART={stone:['#c4bcae','#a39b8c','#7f786b','#5a554b'],iron:['#8a8c94','#5e6068','#3e4048'],rag:'#6a5a48',rope:'#c8b070'};
