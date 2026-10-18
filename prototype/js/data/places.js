'use strict';
/* ---------- data: trade goods, towns, castles, villages and bandit camps ---------- */
// trade goods live in the bag like any other item; stack is how many fit in one bag slot.
// food: the band eats any of these; spoil is the share of a stack that goes bad each day
const GOODS={grain:{n:'Grain',base:8,stack:30,icon:'sack',col:'#d8b860',food:true,spoil:0,d:'Keeps for months. Plain, but it fills bellies.'},
  meat:{n:'Meat',base:10,stack:20,icon:'meat',col:'#c0503a',food:true,spoil:.08,d:'From the hunt or the herd. Spoils within a couple of weeks.'},
  fish:{n:'Fish',base:7,stack:20,icon:'fish',col:'#8ab0c8',food:true,spoil:.1,d:'Cheap by the water. Spoils quickly.'},
  milk:{n:'Milk',base:5,stack:20,icon:'jug',col:'#eeeae0',food:true,spoil:.2,d:'Fresh from the herds. Drink it within days.'},
  cheese:{n:'Cheese',base:13,stack:25,icon:'cheese',col:'#e8c040',food:true,spoil:0,d:'Hard dwarven and farm cheeses. Never spoils.'},
  arrows:{n:'Arrows',base:1,stack:50,icon:'arrows',col:'#c8b48a',ammo:true,d:'Ammunition for bows. Each shot uses one; after a won battle you gather some back.'},
  bolts:{n:'Bolts',base:2,stack:40,icon:'bolts',col:'#9aa3ad',ammo:true,d:'Ammunition for crossbows. Each shot uses one; after a won battle you gather some back.'},
  fruit:{n:'Fruit',base:9,stack:25,icon:'fruit',col:'#d84a3a',food:true,spoil:.05,d:'Apples, dates and berries. Slow to spoil.'},
  iron:{n:'Iron',base:28,stack:15,icon:'ingot',col:'#9aa3ad',d:'Heavy bars for smiths. Cheap in the mountain holds.'},
  cloth:{n:'Cloth',base:20,stack:20,icon:'bolt',col:'#b05a4a',d:'Bolts of woven cloth from the lowland towns.'},
  timber:{n:'Timber',base:14,stack:15,icon:'logs',col:'#8b5a2b',d:'Cut logs from the forests. Bulky for what it is worth.'},
  furs:{n:'Furs',base:24,stack:20,icon:'pelt',col:'#8a6a4a',d:'Keep your band warm in the frost: carry 1 for every 5 people.'},
  stone:{n:'Stone',base:6,stack:25,icon:'stone',col:'#a7a49a',d:'Cut blocks from the quarries. Walls and halls are built of it.'},
  wool:{n:'Wool',base:9,stack:25,icon:'wool',col:'#eeeae0',d:'Shorn from the herds. Weavers turn it into cloth.'},
  tools:{n:'Tools',base:30,stack:10,icon:'tools',col:'#9aa3ad',d:'Saws, picks and hammers from the smithies. Every building project and estate wears them out.'},
  ale:{n:'Ale',base:12,stack:15,icon:'barrel',col:'#c88a3a',d:'Brewed from grain. Towns drink it; content people work harder.'},
  spice:{n:'Spice',base:34,stack:25,icon:'jar',col:'#d87a30',d:'Light and precious. Worth the most per bag slot.'},
  // regional goods (res): only mines and ports whose land holds them bring them up (resources.js), so they are cheap at the source
  // and dear everywhere else
  copper:{n:'Copper',base:16,stack:15,icon:'ingot',col:'#cd7f32',res:'ore',d:'Soft red metal from the hills. Smiths cast bronze from copper and tin.'},
  tin:{n:'Tin',base:18,stack:15,icon:'ingot',col:'#c8ccd0',res:'ore',d:'Bright and brittle. Bronze needs it as much as copper.'},
  silver:{n:'Silver',base:60,stack:15,icon:'ingot',col:'#dfe4ea',res:'ore',d:'Mined deep in the mountains. Coin, plate and silver arms.'},
  gold:{n:'Gold',base:110,stack:15,icon:'ingot',col:'#e8c040',res:'ore',d:'Washed and dug from the desert hills and a few mountain seams.'},
  gems:{n:'Gems',base:90,stack:20,icon:'gem',col:'#d84a8a',res:'ore',d:'Rough stones from desert and mountain mines. Towns pay well for them.'},
  mithril:{n:'Mithril',base:240,stack:15,icon:'ingot',col:'#7fd8e8',res:'ore',d:'Light as silver, hard as steel. Found only under the frozen peaks.'},
  adamant:{n:'Adamantite',base:400,stack:15,icon:'ingot',col:'#b07af0',res:'ore',d:'The rarest metal of all, in a handful of deep mountain seams.'},
  salmon:{n:'Salmon',base:16,stack:20,icon:'fish',col:'#e88a6a',food:true,spoil:.08,res:'fish',d:'Caught in cold rivers and northern waters. Prized at every table.'},
  eel:{n:'Eel',base:11,stack:20,icon:'fish',col:'#6a7a4a',food:true,spoil:.07,res:'fish',d:'Trapped in the bogs and slow waters of the swamp.'},
  pearls:{n:'Pearls',base:150,stack:25,icon:'pearl',col:'#f0ece0',res:'fish',d:'Dived for in warm southern waters. A fortune in a pouch.'}};
// the classic holdings: plain data, each made one of its kind, with its prices and its point, by makeHolding (holdings.js);
// realm: the realm it starts under
const CLASSIC_PLACES=[
  {name:'Ashford',realm:'vale',races:['human'],kind:'city',clim:'grass',tx:36,ty:40,col:'#e8b94a',seed:1,mod:{grain:.7,iron:1.4,cloth:1.1,timber:1,furs:1.3,spice:1.4},note:'Farmland on open grassland. Grain is cheap here.'},
  {name:'Karn Hold',realm:'karn',races:['dwarf'],kind:'city',clim:'grass',tx:172,ty:44,col:'#5a8fe8',seed:2,mod:{grain:1.3,iron:.7,cloth:1.2,timber:1.3,furs:.7,spice:1.3},note:'Dwarven mining town below the peaks. Iron and furs sell cheap.'},
  {name:'Saltmere',realm:'salt',style:'port',races:['elf','human'],kind:'city',clim:'grass',tx:108,ty:124,col:'#78c474',seed:3,mod:{grain:1,iron:1.1,cloth:.75,timber:.65,furs:1.4,spice:1},note:'Forest port with weavers. Cloth and timber are cheap.'},
  {name:'Greywell',realm:'horde',races:['orc'],kind:'village',clim:'desert',tx:196,ty:128,col:'#c7a46a',seed:4,mod:{grain:.8,iron:1.5,cloth:1.3,timber:1.5,furs:1.5,spice:.6},note:'A desert village by a well. Grain, spice and recruits.'},
  {name:'Highmoor',realm:'vale',races:['human'],kind:'castle',clim:'grass',tx:64,ty:80,seed:5,note:'A stone keep on the moor. Hires mounted troops.'},
  {name:'Dunrak',realm:'karn',races:['dwarf'],kind:'castle',clim:'frost',tx:144,ty:20,seed:6,note:'A dwarven fortress cut into the frozen mountain. Hires mounted troops.'},
  {name:'Brinewatch',realm:'salt',style:'port',races:['elf','orc'],kind:'castle',clim:'swamp',tx:148,ty:92,seed:7,note:'A sea fort above the mire. Hires mounted troops.'},
  {name:'Thornwick',realm:'vale',races:['human'],kind:'village',clim:'grass',tx:16,ty:72,seed:8,mod:{grain:.7,iron:1.4,cloth:1.2,timber:.7,furs:1.4,spice:1.5},note:'A farming village on the western fields. Grain, timber and recruits.'},
  {name:'Elderglen',realm:'sylvan',races:['elf'],kind:'city',clim:'grass',tx:40,ty:116,seed:9,mod:{grain:1,iron:1.3,cloth:.9,timber:.6,furs:1.3,spice:1.2},note:'An elven town in the old woods. Timber is cheap here.'},
  {name:'Frosthelm',realm:'karn',races:['dwarf'],kind:'village',clim:'frost',tx:200,ty:16,seed:10,mod:{grain:1.4,iron:.9,cloth:1.3,timber:1.2,furs:.6,spice:1.5},note:'A dwarven hamlet in the snow. Grain, furs and recruits.'},
  {name:'Sunreach',realm:'horde',races:['orc'],kind:'city',clim:'desert',tx:160,ty:144,seed:11,mod:{grain:1.2,iron:1,cloth:1.2,timber:1.4,furs:1.6,spice:.65},note:'The orc capital on the spice road. Spice is cheap here.'},
  {name:'Brookhollow',realm:'vale',races:['human'],kind:'village',clim:'grass',tx:80,ty:28,seed:16,mod:{grain:.65,iron:1.4,cloth:1.1,timber:.8,furs:1.2,spice:1.5},note:'A mill village on a cold brook. Grain is cheapest here.'},
  {name:'Ironvein',realm:'karn',races:['dwarf'],kind:'village',clim:'frost',tx:116,ty:12,seed:17,mod:{grain:1.4,iron:.6,cloth:1.4,timber:1.3,furs:.8,spice:1.6},note:'A dwarven mining camp over a rich seam. Iron is cheapest here.'},
  {name:'Mossdell',realm:'sylvan',races:['elf'],kind:'village',clim:'grass',tx:28,ty:144,seed:18,mod:{grain:.9,iron:1.5,cloth:.7,timber:.65,furs:1.3,spice:1.3},note:'Elven weavers in a mossy hollow. Cloth and timber.'},
  {name:'Bonepit',realm:'horde',races:['orc'],kind:'village',clim:'desert',tx:180,ty:152,seed:19,mod:{grain:1.1,iron:1.2,cloth:1.5,timber:1.5,furs:.9,spice:.7},note:'An orc hunting camp ringed with bones. Spice and furs.'},
  {name:'Stonebridge',realm:'salt',style:'bridge',races:['human','dwarf'],kind:'town',clim:'grass',tx:92,ty:92,seed:20,mod:{grain:.9,iron:.9,cloth:1,timber:1,furs:1.1,spice:1.1},note:'A river-crossing market where humans and dwarves trade everything at fair prices.'},
  {name:'Gullhaven',realm:'salt',style:'port',races:['human','elf'],kind:'village',clim:'grass',tx:128,ty:148,seed:21,mod:{grain:.9,iron:1.3,cloth:.8,timber:.9,furs:1.4,spice:.9},note:'A fishing harbor on the south coast. Cloth and spice from the boats.'},
  {name:'Silverbough',realm:'sylvan',races:['elf'],kind:'castle',clim:'grass',tx:60,ty:108,seed:13,note:'An elven keep grown from living trees. Hires mounted troops.'},
  {name:'Willowmere',realm:'sylvan',races:['elf'],kind:'village',clim:'grass',tx:16,ty:128,seed:14,mod:{grain:.85,iron:1.5,cloth:.9,timber:.6,furs:1.4,spice:1.3},note:'An elven village among the willows. Grain, timber and recruits.'},
  {name:'Skullrock',realm:'horde',races:['orc'],kind:'castle',clim:'desert',tx:200,ty:100,seed:15,note:'An orc stronghold on a skull-shaped crag. Hires wolf riders.'},
  {name:'Mirefen',realm:'salt',style:'stilt',races:['orc','human'],kind:'village',clim:'swamp',tx:76,ty:140,seed:12,mod:{grain:.9,iron:1.4,cloth:1.3,timber:.7,furs:1.5,spice:1.2},note:'Stilt huts above the bog where orcs and humans fish side by side. Grain, timber and recruits.'},
  {name:'Coldmarch',realm:'vale',races:['human'],kind:'village',clim:'frost',tx:24,ty:14,seed:22,mod:{grain:1.2,iron:1.2,cloth:1.2,timber:.8,furs:.6,spice:1.6},note:'A hard northern village on the Vale frontier. Furs and timber.'},
  {name:'Wardenhall',realm:'vale',races:['human'],kind:'castle',clim:'grass',tx:48,ty:60,seed:23,note:'The Vale’s western bastion. Hires mounted troops.'},
  {name:'Millbrook',realm:'vale',races:['human'],kind:'village',clim:'grass',tx:60,ty:40,seed:24,mod:{grain:.6,iron:1.4,cloth:1.1,timber:.9,furs:1.3,spice:1.5},note:'Water mills and wide fields. Grain is cheap.'},
  {name:'Oakhurst',realm:'vale',races:['human'],kind:'town',clim:'grass',tx:100,ty:56,seed:25,mod:{grain:.9,iron:1.2,cloth:1,timber:.7,furs:1.2,spice:1.3},note:'A timber town in the oak country. Timber sells cheap.'},
  {name:'Coldforge',realm:'karn',races:['dwarf'],kind:'village',clim:'frost',tx:168,ty:12,seed:26,mod:{grain:1.4,iron:.7,cloth:1.4,timber:1.2,furs:.7,spice:1.6},note:'Forges in the snow. Iron and furs.'},
  {name:'Granitegate',realm:'karn',races:['dwarf'],kind:'castle',clim:'frost',tx:210,ty:50,seed:27,note:'A dwarven gatehouse over the eastern pass. Hires mounted troops.'},
  {name:'Deepdelve',realm:'karn',races:['dwarf'],kind:'town',clim:'grass',tx:128,ty:38,seed:28,mod:{grain:1.2,iron:.75,cloth:1.2,timber:1.2,furs:.9,spice:1.3},note:'A dwarven mining town that trades with the lowlands. Iron is cheap.'},
  {name:'Thistledown',realm:'sylvan',races:['elf'],kind:'village',clim:'grass',tx:12,ty:100,seed:29,mod:{grain:.85,iron:1.5,cloth:.8,timber:.7,furs:1.4,spice:1.3},note:'Elven herb gardens on the western shore. Cloth and timber.'},
  {name:'Moonwell',realm:'sylvan',races:['elf'],kind:'town',clim:'grass',tx:36,ty:84,seed:30,mod:{grain:1,iron:1.4,cloth:.8,timber:.65,furs:1.3,spice:1.1},note:'An elven town around a silver spring. Timber and cloth are cheap.'},
  {name:'Fernhollow',realm:'sylvan',races:['elf'],kind:'village',clim:'grass',tx:56,ty:152,seed:31,mod:{grain:.9,iron:1.4,cloth:.85,timber:.7,furs:1.4,spice:1.2},note:'A fern-choked hollow by the southern sea. Timber and recruits.'},
  {name:'Dustfang',realm:'horde',races:['orc'],kind:'village',clim:'desert',tx:216,ty:148,seed:32,mod:{grain:1.1,iron:1.3,cloth:1.5,timber:1.6,furs:1,spice:.6},note:'An orc raiding camp at the edge of the dunes. Spice.'},
  {name:'Redspire',realm:'horde',races:['orc'],kind:'castle',clim:'desert',tx:176,ty:120,seed:33,note:'A red rock tower over the spice road. Hires wolf riders.'},
  {name:'Scorchwell',realm:'horde',races:['orc'],kind:'village',clim:'desert',tx:214,ty:72,seed:34,mod:{grain:.9,iron:1.4,cloth:1.4,timber:1.5,furs:1.3,spice:.65},note:'A well in the hot rocks. Grain, spice and recruits.'},
  {name:'Pearlbay',realm:'salt',style:'port',races:['human','elf'],kind:'village',clim:'grass',tx:104,ty:152,seed:35,mod:{grain:1,iron:1.3,cloth:.8,timber:1,furs:1.4,spice:.85},note:'Pearl divers and fishers on the south coast. Cloth and spice from the boats.'},
  {name:'Tidewatch',realm:'salt',style:'port',races:['human','orc'],kind:'castle',clim:'swamp',tx:124,ty:104,seed:36,note:'A League fort over the tidal marsh. Hires mounted troops.'},
  {name:'Crossmere',realm:'salt',races:['human','orc'],kind:'town',clim:'grass',tx:128,ty:70,seed:37,mod:{grain:1,iron:1,cloth:1,timber:1.1,furs:1.1,spice:1},note:'A crossroads market in the middle of Ashmark. Fair prices on everything.'}
];
// eaten first: whatever spoils fastest
const FOODS=Object.keys(GOODS).filter(g=>GOODS[g].food).sort((a,b)=>GOODS[b].spoil-GOODS[a].spoil);
// standing needed to hire by troop tier, and the trust your own race gives
const REP_NEED={1:15,2:30,3:50},RACE_TRUST=10;
// where the bandit camps stand on the classic map (CAMP_SPOTS, holdings.js; both made into the world by worldmap.js installClassic)
const CLASSIC_CAMPS=[{tx:88,ty:48},{tx:20,ty:96},{tx:116,ty:76},{tx:200,ty:84},{tx:60,ty:140},{tx:176,ty:106},{tx:146,ty:58},{tx:44,ty:130},{tx:100,ty:112},{tx:150,ty:130},{tx:28,ty:58},{tx:190,ty:30}];
/* the classic seed's terrain hints (doc/WORLD_DESIGN.md §8.15 step 2): what Ashmark's land must say about its places, read by the
   generator when the world is classic (worldgen.js: g.hints) as soft nudges, warped-falloff bumps of temperature, moisture or
   elevation over 12-30 tiles, never stamps. Each hint: id; kind (sea: these ports on one body of water, on side; temp, moist: a
   bump of d (-1..1 of the field's range) over r tiles round at, or a band r tiles deep along side (dry: moisture down with it); elev: high ground on side of at; island: at stands on land ringed
   by water, joined by bridges; river: a great river from from to to, past at, crossed there by a bridge); at: a holding's name
   (its anchor, worldplace.js classicAnchors) or a point as shares of the map [x, y]; side: n, s, e or w; r: tiles */
const CLASSIC_HINTS=[
  {id:'southSea',kind:'sea',side:'s',ports:['Saltmere','Gullhaven','Pearlbay','Brinewatch','Tidewatch'],note:'a south coast, the League’s ports on one sea'},
  {id:'frostNorth',kind:'temp',side:'n',r:48,d:-1,note:'frost in the north'},
  {id:'desertSouthEast',kind:'temp',at:[.85,.85],r:30,d:1,dry:1,note:'desert in the south-east'},
  {id:'karnPeaks',kind:'elev',at:'Karn Hold',side:'n',r:16,note:'Karn Hold below the peaks'},
  {id:'willowIsle',kind:'island',at:'Willowmere',bridges:true,note:'Willowmere an island village with bridges (tests/routes.js)'},
  {id:'stonebridge',kind:'river',at:'Stonebridge',from:'n',to:'s',great:true,bridge:true,note:'a great river from the northern peaks to the south coast, past Stonebridge, bridged there'},
  {id:'fens',kind:'moist',at:['Mirefen','Tidewatch'],r:18,d:1,clim:'swamp',note:'Mirefen and Tidewatch in fen'}
];
