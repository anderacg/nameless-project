'use strict';
/* ---------- data: interior scenes: who you meet inside a place, the buildings they work in, and how each people builds ---------- */
// A scene is a small walkable map of a place you enter (16 px tiles, drawn zoomed in). Each role is someone you walk up to:
// bld is the building they keep (stall: a market stall in the square), tab is the town panel tab that talking to them opens
// (a role whose tab this holding lacks stays home; null just talks), icon marks them, say is how they greet you, look is
// how they dress (guard: armed, as a soldier of the town's people; the rest wear their work clothes).
const SCENE_ZOOM=2;
const SCENE_ROLES={
  steward:{look:'steward',n:'Steward',bld:'hall',tab:'jobs',icon:'scroll',say:'The lord has work for those who can do it.'},
  reeve:{look:'steward',n:'Reeve',bld:'hall',tab:'fief',icon:'crown',say:'Welcome home, my lord. The ledgers are ready.'},
  captain:{look:'guard',n:'Captain of the guard',bld:'barracks',tab:'recruit',icon:'sword',say:'Looking for fighters? Some here would follow you.'},
  merchant:{look:'merchant',n:'Merchant',bld:'stall',tab:'trade',icon:'coin',say:'Fresh goods, fair prices. Mostly fair.'},
  smith:{look:'smith',n:'Smith',bld:'smithy',tab:'smith',icon:'anvil',say:'Blades, mail and arrows. Mind the sparks.'},
  groom:{look:'groom',n:'Stablemaster',bld:'stable',tab:'stable',icon:'shoe',say:'Good horses, if you can pay for them.'},
  innkeeper:{look:'innkeeper',n:'Innkeeper',bld:'tavern',tab:'tavern',icon:'mug',say:'A bed, a meal, and sellswords by the fire.'},
  priest:{look:'priest',n:'Priest',bld:'temple',tab:null,icon:'candle',say:'Rest a while, traveller. The gods keep their own counsel.'}
};
// two guards stand at every gate; anyone without a role is townsfolk with gossip (SCENE_GOSSIP)
// a priest's blessing, once a day: morale
const BLESSING={morale:5};
// buildings: footprint in tiles; the front faces south with the door in the middle. near: where it likes to stand
// (square: by the market square; gate: by the gate; north: at the top of the town; any: wherever there is room)
const SCENE_BLD={
  hall:{n:'Hall',w:8,h:5,near:'north'},temple:{n:'Temple',w:5,h:5,near:'square'},tavern:{n:'Tavern',w:6,h:4,near:'square'},
  smithy:{n:'Smithy',w:4,h:3,near:'square'},stable:{n:'Stable',w:5,h:3,near:'gate'},barracks:{n:'Barracks',w:5,h:3,near:'gate'},house:{n:'House',w:3,h:3,near:'any'}
};
// how a holding builds, by its style (holding.style, else its first people)
const SCENE_STYLE={
  human:{wall:'#d8c8a0',beam:'#6a4a2a',roof:['#a14b38','#8a3d2d','#7a5a3a','#5a6a8a']},
  dwarf:{wall:'#8a8e98',beam:'#5a5e68',roof:['#4a5060','#5a5048','#3e4652'],stone:true},
  elf:{wall:'#c8b890',beam:'#5a4a2a',roof:['#3a7a3a','#2f6a30','#4a8040'],leaf:true},
  orc:{wall:'#8a6a4a',beam:'#4a2e1e',roof:['#5a3a20','#6a4a2a','#7a3a2a'],spikes:true},
  port:{wall:'#e0d8c0',beam:'#5a4a3a',roof:['#4a6a9a','#5a7aa8','#a14b38']},
  stilt:{wall:'#8a7a52',beam:'#4a3a24',roof:['#6a5a3a','#5a4a2a'],spikes:true},
  bridge:{wall:'#d8c8a0',beam:'#6a4a2a',roof:['#a14b38','#7a5a3a']}
};
// ground by climate: base and speckle
const SCENE_GROUND={grass:['#5a8a3a','#4e7c34','#6a9a44'],frost:['#d8dde4','#c4ccd6','#eef2f6'],desert:['#d8b878','#c8a868','#e4c890'],swamp:['#5a6a3a','#4a5a32','#6a7a44']};
// what townsfolk talk about (a few are filled in from the world when you ask)
const SCENE_GOSSIP=['Taxes again. Always taxes.','My cousin went off to fight and never wrote back.','They say the roads are worse every year.','Have you tried the ale at the tavern? Don\'t.','The smith\'s boy is sweet on the miller\'s girl.','Mind the guards; they are in a mood today.'];
