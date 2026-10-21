'use strict';
/* ---------- data: the economy: estates and walls, what they make, what people need, taxes, building materials, caravans ---------- */

/* estates and walls (estates.js): t.bld = {farm:lv, …}, t.wall = 0..its kind's wallMax (holdings.js) */
const ESTATES={
  farm:{n:'Farmland',goods:['grain','fruit'],cost:70,ground:'open',work:'farmer',d:'Fields: 6 grain and a little fruit a day per level (less in frost, desert and swamp).'},
  pasture:{n:'Pasture',goods:['meat','milk','cheese','wool'],cost:80,ground:'open',work:'herder',d:'Herds behind a fence: meat, milk, cheese and 2 wool a day per level.'},
  lumber:{n:'Woodcutter',goods:['timber'],cost:60,ground:'forest',work:'woodcutter',d:'A logging camp: 4 timber a day per level.'},
  mine:{n:'Mine',goods:['iron'],cost:120,ground:'rock',work:'miner',d:'A mine in the hills: 3 iron a day per level.'},
  quarry:{n:'Quarry',goods:['stone'],cost:90,ground:'rock',work:'miner',d:'Cut stone for walls and halls: 4 stone a day per level.'},
  port:{n:'Port',goods:['fish','spice'],cost:140,ground:'shore',work:'fisher',d:'Piers and boats: 5 fish a day per level, and ships bring spice.'},
  workshop:{n:'Weavers & Tanners',goods:['cloth','furs'],cost:90,ground:null,d:'Turns 2 wool into 2 cloth a day per level; trappers bring furs in the frost.'},
  smithy:{n:'Smithy',goods:['tools'],cost:110,ground:null,d:'Turns 1 iron and 1 timber into 1 tools a day per level.'},
  brewery:{n:'Brewery',goods:['ale'],cost:80,ground:null,d:'Turns 2 grain into 2 ale a day per level. Ale keeps people content.'},
  granary:{n:'Granary',goods:[],cost:90,ground:null,d:'+50% storage per level, food spoils half as fast, and more people can live here.'},
  market:{n:'Market',goods:[],cost:110,ground:null,d:'Stalls and a counting house: +3 gold a day in dues per level, and caravans set out more often.'}
};
// some estates need others first: a brewery needs the grain of level-2 farmland, weavers and tanners a pasture's wool and hides,
// a market a granary to store what it trades
const ESTATE_NEEDS={brewery:{farm:2},workshop:{pasture:1},market:{granary:1}};
const WALL_N=['No walls','Palisade','Stone walls','Great walls'],WALL_COST=[0,100,300,650];

/* what each estate makes per level per day, from what (inputs come out of the holding's stock), and what people need (economy.js) */
const MAKE={
  farm:{out:{grain:6,fruit:.8}},pasture:{out:{meat:1.5,milk:2,cheese:.6,wool:2}},lumber:{out:{timber:4}},mine:{out:{iron:3}},quarry:{out:{stone:4}},
  port:{out:{fish:5,spice:.6}},workshop:{in:{wool:2},out:{cloth:2}},smithy:{in:{iron:1,timber:1},out:{tools:1}},brewery:{in:{grain:2},out:{ale:2}},
  market:{},granary:{}
};
const FARM_CLIM={grass:1,frost:.5,desert:.7,swamp:.75};
const WORKERS=8; // people needed per estate level
// daily needs per 100 people: by kind of holding (holdings.js needs; food is pooled across every kind of food)
const TAX_RATE=[.04,.07,.11],TAX_N=['Low','Normal','High'];

/* where the regional goods are found (resources.js): ore veins on hills and mountains, fishing grounds in the water, by climate.
   Weights: how likely a vein of each ore is, on a hill and on a mountain, and in each climate; a fishing ground's catch by climate */
const ORE_W={
  copper:{hill:3,mount:1,clim:{grass:1,swamp:1,desert:1,frost:.3}},tin:{hill:2,mount:.8,clim:{grass:1,swamp:.8,desert:.5,frost:.6}},
  iron:{hill:2.5,mount:2.5,clim:{grass:1,frost:1.2,desert:.8,swamp:1}},silver:{hill:.3,mount:1.2,clim:{grass:1,frost:1,desert:.6,swamp:.4}},
  gold:{hill:.25,mount:.6,clim:{grass:.4,frost:.3,desert:1.6,swamp:.3}},gems:{hill:.2,mount:.5,clim:{grass:.5,frost:.4,desert:1.4,swamp:.6}},
  mithril:{hill:0,mount:.3,clim:{grass:.1,frost:1.4,desert:0,swamp:0}},adamant:{hill:0,mount:.12,clim:{grass:.4,frost:.6,desert:.8,swamp:1.2}}};
const FISH_W={salmon:{grass:1,frost:1.6,desert:0,swamp:.2},eel:{grass:.4,frost:0,desert:0,swamp:1.8},pearls:{grass:.2,frost:0,desert:.6,swamp:.1}};
// what a mine or port brings up per level from each vein or fishing ground in its land (rich ones up to twice that)
const RES_RATE={copper:3,tin:2.5,iron:3,silver:1,gold:.5,gems:.4,mithril:.2,adamant:.12,salmon:2,eel:2.5,pearls:.15};
const RES_RANGE=WORLD_SCALE.econ.resRange,HOME_RANGE=WORLD_SCALE.econ.homeRange;// tiles from a holding to the veins and waters it works (to its own home deposit)
// what a smith takes from its holding's stock to forge one piece of each material tier (wood, bronze, iron, silver, gold, mithril,
// adamant): it forges only what its holding has the metal for
const FORGE=[{timber:1},{copper:1,tin:1},{iron:2},{silver:2},{gold:2},{mithril:2},{adamant:2}];

/* building projects: gold, plus materials from the holding's own stock */
const ESTATE_MAT=(k,lv)=>({timber:6*lv,tools:lv,...(['mine','quarry','port','market','granary','smithy'].includes(k)?{stone:5*lv}:{})});
const WALL_MAT=[null,{timber:30,tools:2},{stone:60,timber:10,tools:6},{stone:120,iron:15,tools:12}];

/* the Realm economy setting, realm treasuries, and your caravans (hire cost, guard cost, daily upkeep, how many) */
const ECON_MODES={full:['Full','Realms pay for every soldier, garrison and wall from taxes, and feed their armies from their holdings. A broke or starving realm loses soldiers and sues for peace.'],
  light:['Light','Realms pay half, may run into debt, and never lose soldiers to it. Shortages still slow their recruiting.'],
  off:['Off','Realms raise armies and garrisons for free, as in older versions. Markets, people and caravans still work.']};
const TREAS0=300;
const PCV={hire:50,guard:12,upkeep:2,guardUp:1,max:6};

/* people on the map: workers' colors, what a robbed worker carries, why refugees leave */
const JOBS={farmer:{col:'#c8a24a',tool:'#d8c890'},herder:{col:'#8a6a3a',tool:'#a8783a'},woodcutter:{col:'#5a7a3a',tool:'#c9ced8'},miner:{col:'#6a6a7a',tool:'#9aa3ad'},fisher:{col:'#4a7aa8',tool:'#d8c890'}};
const JOB_GOODS={farmer:['grain',4],herder:['meat',3],woodcutter:['timber',3],miner:['iron',2],fisher:['fish',4]};// (a miner and a fisher carry their holding's own catch: jobGood)
const REFUGEE_WHY={crowded:'there is no room left for them',sacked:'their home was sacked',raided:'raiders burned their fields',hunger:'there is no food',siege:'the siege',hardship:'hard times',conquest:'new masters'};
