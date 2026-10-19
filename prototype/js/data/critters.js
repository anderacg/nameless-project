'use strict';
/* ---------- data: critters ---------- */
// Wild game roams its habitat (where: climates, or 'forest' / 'hills'), runs when you come near and tires as it runs.
// Catch a herd to hunt it: meat for each animal brought down, sometimes a hide or antler (mat: [trophy, chance]).
// Livestock (live) lives in its holding's pasture, inside the fence (critters.js penEnts): to be seen, never sold; what the pasture
// makes of it (meat, milk, cheese, wool) goes to the holding (economy.js).
// spd: map speed while fleeing (your band walks at 36, more on a road or a mount); shy: how close you get before it bolts.
const CRITTERS={
  rabbit:{n:'Rabbits',one:'rabbit',where:['grass','forest'],herd:[2,4],meat:1,mat:['rabbitfur',.5],xp:2,spd:30,shy:50,w:4,size:1,col:'#b8a088'},
  deer:{n:'Deer',one:'deer',where:['forest','grass'],herd:[2,4],meat:4,mat:['hide',.6],xp:5,spd:40,shy:70,w:3,size:2,col:'#a0683a'},
  stag:{n:'Stag',one:'stag',where:['forest','hills'],herd:[1,1],meat:6,mat:['antler',.8],xp:12,spd:44,shy:80,w:1.2,size:3,col:'#8a5a30',antlers:true},
  ibex:{n:'Mountain goats',one:'mountain goat',where:['hills'],herd:[2,3],meat:3,mat:['hide',.4],xp:4,spd:34,shy:60,w:2,size:2,col:'#d8d0c0',horns:true},
  reindeer:{n:'Reindeer',one:'reindeer',where:['frost'],herd:[3,5],meat:5,mat:['antler',.4],xp:6,spd:38,shy:70,w:3,size:2,col:'#7a6a5a',antlers:true},
  hare:{n:'Snow hares',one:'snow hare',where:['frost'],herd:[2,3],meat:1,mat:['rabbitfur',.6],xp:2,spd:32,shy:50,w:2,size:1,col:'#eef3f8'},
  gazelle:{n:'Gazelles',one:'gazelle',where:['desert'],herd:[2,4],meat:3,mat:['hide',.4],xp:5,spd:48,shy:85,w:3,size:2,col:'#d0a060',horns:true},
  fowl:{n:'Marsh fowl',one:'marsh fowl',where:['swamp'],herd:[3,6],meat:1,mat:null,xp:2,spd:28,shy:45,w:3,size:1,col:'#6a7a5a',bird:true},
  cow:{n:'Cattle',one:'cow',live:true,herd:[2,4],meat:8,spd:12,size:3,col:'#e8e4d0',spots:'#3a2a20',horns:true},
  sheep:{n:'Sheep',one:'sheep',live:true,herd:[3,6],meat:4,spd:12,size:2,col:'#eeeae0',wool:true},
  pig:{n:'Pigs',one:'pig',live:true,herd:[2,4],meat:5,spd:12,size:2,col:'#e0a0a0'},
  goat:{n:'Goats',one:'goat',live:true,herd:[2,4],meat:3,spd:14,size:2,col:'#a89880',horns:true},
  hen:{n:'Hens',one:'hen',live:true,herd:[3,6],meat:1,spd:12,size:1,col:'#c87a3a',bird:true}
};
// where each kind of livestock can graze: ground (open, hills, forest) and climates (null: any)
const GRAZE={cow:{on:['open'],clim:['grass','swamp','frost']},sheep:{on:['open','hills'],clim:['grass','frost']},pig:{on:['open','forest'],clim:['grass','swamp','desert']},
  goat:{on:['open','hills'],clim:null},hen:{on:['open'],clim:null}};
// which animals each people keeps
const LIVESTOCK={human:['cow','sheep','pig','hen'],dwarf:['goat','pig','sheep'],elf:['sheep','hen','goat'],orc:['pig','goat','cow']};
const CRITTER_CAP=density().critterCap,CRITTER_START=density().critterStart;
