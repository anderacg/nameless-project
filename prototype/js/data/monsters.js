'use strict';
/* ---------- data: monsters, trophies and gear ---------- */
// battle units for monsters; beasts ignore their home biome's battle rule, big ones ignore all of them
Object.assign(ST,{
  boar:{n:'Dire Boar',tier:2,hp:46,dmg:8,spd:56,reach:11,range:0,cd:1,charge:true,beast:true,home:['grass']},
  tiger:{n:'Tiger',tier:3,hp:170,dmg:16,spd:60,reach:13,range:0,cd:.85,beast:true,ability:'pounce',home:['forest','swamp']},
  bear:{n:'Cave Bear',tier:3,hp:230,dmg:18,spd:38,reach:13,range:0,cd:1.3,beast:true,home:['frost','forest']},
  spider:{n:'Giant Spider',tier:2,hp:30,dmg:4,spd:44,reach:0,range:60,cd:1.8,beast:true,ability:'web',home:['forest','swamp']},
  troll:{n:'Troll',tier:3,hp:280,dmg:16,spd:30,reach:20,range:0,cd:1.5,beast:true,big:true,ability:'regen'},
  wyrm:{n:'Sand Wyrm',tier:4,hp:650,dmg:24,spd:28,reach:24,range:0,cd:1.6,beast:true,big:true},
  griffin:{n:'Griffin',tier:3,hp:170,dmg:16,spd:72,reach:12,range:0,cd:.9,charge:true,beast:true,ability:'pounce'}
});
// One larger leader may replace an ordinary wolf; the pack's total headcount is unchanged.
const WOLF_ALPHA={unit:'alpha_wolf',chance:.25,xp:25};
ST.alpha_wolf={...ST.wolf,n:'Alpha Wolf',tier:2,hp:52,dmg:10,reach:12};
// where: climates for open ground, 'forest' or 'hills' for those tiles. aggro monsters hunt you; the rest wait to be hunted.
const MONSTERS={
  wolf:{n:'Wolf pack',unit:'wolf',count:[4,6],where:['frost'],w:3,aggro:true,xp:10,mat:'pelt',gear:[['fangdagger',.06],['fangcharm',.06]],d:'Fast and hungry. Their pelts keep a band warm.'},
  boar:{n:'Dire boars',unit:'boar',meat:3,count:[2,3],where:['grass','hills'],w:3,aggro:false,xp:14,mat:'tusk',gear:[['tuskcharm',.1]],d:'Charge hard, but only fight when cornered.'},
  tiger:{n:'Tiger',unit:'tiger',count:[1,1],where:['forest','swamp'],w:2,aggro:true,xp:45,mat:'tigerpelt',gear:[['clawblade',.14]],d:'Stalks travelers and pounces on the nearest fighter.'},
  bear:{n:'Cave bear',unit:'bear',meat:6,count:[1,1],where:['forest','hills','frost'],w:2,aggro:false,xp:50,mat:'bearhide',gear:[['bearcoat',.18]],d:'Slow and very tough. Leaves you alone if you leave it alone.'},
  spider:{n:'Giant spiders',unit:'spider',count:[2,4],where:['forest','swamp'],w:2,aggro:true,xp:15,mat:'silk',gear:[['silkvest',.08]],d:'Spit webs that slow whoever they hit.'},
  troll:{n:'Troll',unit:'troll',count:[1,2],where:['frost','hills'],w:1.2,aggro:true,xp:90,mat:'trollhide',gear:[['trollhide',.12],['trollclub',.1]],d:'Huge, and its wounds close as you watch.'},
  scorpion:{n:'Giant scorpions',unit:'scorpion',count:[2,4],where:['desert'],w:3,aggro:true,xp:18,mat:'venom',gear:[['scorpplate',.1]],d:'Armored hunters of the dunes.'},
  wyrm:{n:'Sand wyrm',unit:'wyrm',count:[1,1],where:['desert'],w:.6,aggro:true,xp:150,mat:'scale',gear:[['wyrmspear',.2],['wyrmeye',.1]],d:'A legend of the deep desert. Few who see it return.'},
  slime:{n:'Bog slimes',unit:'slime',count:[3,5],where:['swamp'],w:2,aggro:true,xp:12,mat:'goo',gear:[],d:'Spit burning acid from afar. It is magic: armor does not help.'},
  griffin:{n:'Griffin',unit:'griffin',count:[1,1],where:['hills'],w:1,aggro:true,xp:60,mat:'feather',gear:[['griffcharm',.15],['m_griffin',.04]],d:'Dives from the hilltops onto lone fighters.'},
  // mythic monsters live by other rules (world/monsters.js): one at a time, roaming the whole map instead of a lair.
  // first: the day it first appears; back: days until another comes after one is slain; lair: where it appears (in order of
  // preference); see: how far it spots you; speed: [roaming, hunting]; fly: crosses anything; mapH: its height on the map;
  // scorch: daily chance it burns a nearby holding's fields (halving the garrison); ravage: share of any army it lands on that
  // dies; fame: reputation for slaying it; hoard: what its death pays (gold, renown, a gear tier range, a chance of an item)
  dragon:{n:'Dragon',unit:'dragon',count:[1,1],where:[],w:0,aggro:true,xp:200,gear:[],d:'Wings blot out the sun. The beast is said to guard a vast hoard, and its breath burns whole lines of soldiers.',
    mythic:{title:'A dragon descends',first:8,back:30,lair:['mountains','hills'],see:80,speed:[16,30],fly:true,mapH:18,scorch:.15,ravage:.5,fame:20,
      hoard:{gold:250,renown:40,gear:[4,5],egg:['m_drake',.35],text:'You claim the dragon’s hoard. Bards will sing of this.'}}}
};
// trophies sell at any town market. icon and col pick the pixel icon drawn for the inventory
const MATS={pelt:{n:'Wolf Pelt',v:12,icon:'pelt',col:'#9aa3ad'},tusk:{n:'Boar Tusk',v:14,icon:'tusk',col:'#e8e4d0'},tigerpelt:{n:'Tiger Pelt',v:90,icon:'pelt',col:'#e08a2a'},
  bearhide:{n:'Bear Hide',v:40,icon:'pelt',col:'#6e4e36'},silk:{n:'Spider Silk',v:25,icon:'silk',col:'#e4e0cf'},trollhide:{n:'Troll Hide',v:70,icon:'pelt',col:'#6a8a6a'},
  hide:{n:'Deer Hide',v:10,icon:'pelt',col:'#b08050'},antler:{n:'Antler',v:22,icon:'tusk',col:'#e0d0b0'},rabbitfur:{n:'Rabbit Fur',v:4,icon:'pelt',col:'#c8b8a0'},
  goo:{n:'Slime Jelly',v:9,icon:'vial',col:'#a0e060'},venom:{n:'Venom Sac',v:20,icon:'vial',col:'#78c474'},scale:{n:'Wyrm Scale',v:260,icon:'scale',col:'#e0b870'},feather:{n:'Griffin Feather',v:100,icon:'feather',col:'#e8dcc0'}};
// breeds (the owner, 2026-11-12: "add more monster variations"): a lair of a kind may be one of its breeds, by the ground it lies on.
// kind: whose it is (its figure, deaths, mind, prints and portrait its kind's, drawn in its own coats); where: its ground, where it
// may lair besides its kind's; w: how often it takes a lair there, its kind's own 1; unit: its fighter, its kind's changed; dt, resist,
// armor, tags: its kind's unless given (data/matchups.js); the rest (n, xp, mat, gear, meat, d) as in MONSTERS, its kind's if left
// out. The wolf and the tiger are painted (engine/wolf.js, tiger.js): no breeds. on false: none, every lair its kind's own
const MONSTER_BREEDS={on:true,kinds:{
  frost_slime:{kind:'slime',n:'Frost slimes',where:['frost'],w:1,coats:['#6aa8d0','#8cc4dc','#5a88c0'],xp:14,mat:'rime',
    unit:{n:'Frost Slime',hp:28,bolt:'#bfe6f4',home:['frost']},resist:{fire:1.6,frost:.2},d:'Spit freezing slime. Fire boils them away; cold does little.'},
  ember_slime:{kind:'slime',n:'Ember slimes',where:['desert'],w:1,coats:['#d0602a','#e08a30','#b8402e'],xp:14,mat:'ember',
    unit:{n:'Ember Slime',hp:22,dmg:6,bolt:'#ffa040',home:['desert']},dt:'fire',resist:{fire:.2,frost:1.6},d:'Spit burning embers. Frost puts them out.'},
  snow_spider:{kind:'spider',n:'Snow spiders',where:['snowwood'],w:1,coats:['#d4d8e2','#c2cad8','#b4bccc'],xp:17,
    unit:{n:'Snow Spider',hp:34,home:['frost']},resist:{fire:1.5,frost:.4},d:'Pale as the drifts they hide in. Their webs slow whoever they hit.'},
  widow:{kind:'spider',n:'Blood widows',where:['forest','swamp'],w:.5,coats:['#7a2a34','#6a2430','#863040'],xp:22,mat:'venom',gear:[['silkvest',.1]],
    unit:{n:'Blood Widow',hp:26,dmg:7,cd:1.6},d:'Smaller than their kin, and their bite runs deeper.'},
  ironhide:{kind:'boar',n:'Ironhide boars',where:['hills'],w:.6,coats:['#5c6066','#4e5258','#686c72'],xp:19,
    unit:{n:'Ironhide Boar',hp:62,spd:50},tags:['heavy'],d:'Hides like iron: arrows glance off. Slow to anger, hard to stop.'},
  ice_bear:{kind:'bear',n:'Ice bear',where:['frost'],w:1.2,coats:['#e2e0d8','#d6d2c6','#cac6ba'],xp:56,mat:'whitepelt',
    unit:{n:'Ice Bear',hp:250,dmg:19,home:['frost']},resist:{frost:.4},d:'White as the snow, and bigger than the bears of the woods.'},
  frost_troll:{kind:'troll',n:'Frost troll',where:['frost'],w:1,coats:['#96aebe','#a2b2c0','#8aa2b6'],xp:100,
    unit:{n:'Frost Troll',hp:300},resist:{fire:1.8,frost:.2},d:'Rimed with ice. Fire is the only thing it fears.'},
  bog_troll:{kind:'troll',n:'Bog troll',where:['swamp'],w:1,coats:['#4e6a3e','#5a6e3a','#46603e'],xp:85,
    unit:{n:'Bog Troll',hp:250,dmg:15,spd:34,home:['swamp']},d:'Rises dripping out of the mire. Its wounds close as you watch.'},
  black_scorpion:{kind:'scorpion',n:'Black scorpions',where:['desert'],w:.6,coats:['#3e383c','#322e34','#48403e'],xp:26,gear:[['scorpplate',.14]],
    unit:{n:'Black Scorpion',hp:58,dmg:10},d:'The dunes\u2019 night hunters. Their plates turn a blade.'},
  snow_griffin:{kind:'griffin',n:'Snow griffin',where:['frost'],w:.8,coats:['#d6dade','#c6cad2','#ded8cc'],xp:65,
    unit:{n:'Snow Griffin',hp:180},resist:{frost:.4},d:'Dives out of the white sky onto lone fighters.'},
  ice_wyrm:{kind:'wyrm',n:'Ice wyrm',where:['frost'],w:.4,coats:['#a6c2d2','#98b6c8','#b4cad6'],xp:160,
    unit:{n:'Ice Wyrm',hp:620,home:['frost']},resist:{fire:1.4,frost:.3},d:'A serpent of the frozen wastes. Few who see it return.'}}};
Object.assign(MATS,{rime:{n:'Rime Jelly',v:12,icon:'vial',col:'#a8dcf0'},ember:{n:'Ember Jelly',v:14,icon:'vial',col:'#f09040'},
  whitepelt:{n:'Ice Bear Pelt',v:60,icon:'pelt',col:'#ece8dc'}});
// each breed's fighter (its kind's, changed: ST[id].breed its kind) and figure (engine/beasts.js PX.breed)
for(const [id,b] of Object.entries(MONSTER_BREEDS.kinds)){const K=MONSTERS[b.kind];ST[id]={...ST[K.unit],...b.unit,breed:b.kind};if(window.PX&&PX.breed)PX.breed(id,K.unit,b.coats)}
// a table by unit kind (resistances, minds, prints, how it falls): each breed's own (b[own]) or its kind's
function breedsInto(T,own){for(const [id,b] of Object.entries(MONSTER_BREEDS.kinds)){const u=MONSTERS[b.kind].unit,v=own&&b[own]!=null?b[own]:T[u];if(v!=null&&T[id]==null)T[id]=v}return T}
// (a unit's kind: a breed's, else its own)
const breedOf=t=>ST[t]?.breed?MONSTERS[ST[t].breed].unit:t;
// a lair's record (its kind's, or its breed's over it); monOf(m) a lair's on the map
const MON_RECS={};
const monRec=(id,breed)=>{const b=breed&&MONSTER_BREEDS.kinds[breed];if(!b)return MONSTERS[id];return MON_RECS[breed]||(MON_RECS[breed]={...MONSTERS[id],...b,unit:breed,breed})};
const monOf=m=>monRec(m.id,m.breed);
// gear for the hero. m: hp, dmg, reach (flat); cd, spd, crit, block, vis, travel (fractions); regen (health per second); sk (skill levels)
const ITEMS={
  fangdagger:{n:'Fang Dagger',slot:'weapon',r:'common',d:'Swings 12% faster.',m:{cd:-.12},v:60,icon:'dagger',col:'#e8e4d0'},
  clawblade:{n:'Tiger Claw Blade',slot:'weapon',r:'rare',d:'+3 damage. Crits 10% more often. Tears into archers.',m:{dmg:3,crit:.1},tag:'shock',v:140,icon:'blade',col:'#e08a2a'},
  trollclub:{n:'Troll Bone Club',slot:'weapon',r:'rare',d:'+6 damage, but swings 15% slower. Crushes armor.',m:{dmg:6,cd:.15},tag:'pierce',v:160,icon:'club',col:'#9a7a52'},
  wyrmspear:{n:'Wyrm Tooth Spear',slot:'weapon',r:'epic',d:'+5 damage and +6 reach. Fights as a spearman.',m:{dmg:5,reach:6},tag:'spear',v:320,icon:'spear',col:'#e0b870'},
  bearcoat:{n:'Bear Hide Coat',slot:'body',r:'common',d:'+25 health.',m:{hp:25},v:90,icon:'coat',col:'#6e4e36'},
  silkvest:{n:'Spider Silk Vest',slot:'body',r:'rare',d:'+15 health. Move 10% faster in battle.',m:{hp:15,spd:.1},v:120,icon:'vest',col:'#d8d4c4'},
  scorpplate:{n:'Scorpion Plate',slot:'body',r:'rare',d:'+30 health. Blocked hits deal 5% less. Heavy armor against arrows.',m:{hp:30,block:.05},tag:'heavy',v:180,icon:'plate',col:'#b5733e'},
  trollhide:{n:'Troll Hide Armor',slot:'body',r:'rare',d:'+40 health. Heal 1 health per second in battle. Heavy armor against arrows.',m:{hp:40,regen:1},tag:'heavy',v:220,icon:'coat',col:'#6a8a6a'},
  fangcharm:{n:'Wolf Fang Earring',slot:'ear',r:'common',d:'See 15% farther on the map.',m:{vis:.15},v:40,icon:'earring',col:'#e8e4d0'},
  tuskcharm:{n:'Boar Tusk Ring',slot:'ring',r:'common',d:'+10 health.',m:{hp:10},v:35,icon:'ring',col:'#e8b94a'},
  griffcharm:{n:'Griffin Feather Cloak',slot:'cape',r:'rare',d:'Travel 15% faster on the map.',m:{travel:.15},v:150,icon:'cloak',col:'#6a9cf0'},
  wyrmeye:{n:'Eye of the Wyrm',slot:'face',r:'epic',d:'+2 Tactics. See 10% farther.',m:{sk:{tact:2},vis:.1},v:280,icon:'charm',col:'#e0605a'}
};
// how monster weapons are held: one hand, two hands, or hybrid (either)
Object.assign(ITEMS.fangdagger,{hand:'one'});Object.assign(ITEMS.clawblade,{hand:'one'});Object.assign(ITEMS.trollclub,{hand:'two'});Object.assign(ITEMS.wyrmspear,{hand:'hybrid'});
const RARITY={common:'#c8c2ae',rare:'#6a9cf0',epic:'#c58af0'};
// equipment: 17 slots plus 10 fingers. An item's slot names its kind; rings fit any finger.
const SLOTS={weapon:'Main hand',offhand:'Off hand',quiver:'Quiver',head:'Head',face:'Face',ear:'Earring',body:'Body',cape:'Cape',arms:'Arms',belt:'Belt',legs:'Legs',feet:'Feet',bag:'Bag',mount:'Mount',mhead:'Barding head',marmor:'Barding',macc:'Mount accessory',ring:'Ring'};
// the mount's gear (MOUNT_KEYS) only counts while you ride
const MOUNT_KEYS=['mhead','marmor','macc'];
const EQUIP=['weapon','offhand','head','face','ear','body','cape','arms','belt','legs','feet','bag','quiver','mount',...MOUNT_KEYS,...Array.from({length:10},(_,i)=>'ring'+i)];
const slotOfKey=k=>k.startsWith('ring')?'ring':k;
const emptyGear=()=>Object.fromEntries(EQUIP.map(k=>[k,null]));
const INV_SIZE=30,STACK=20;
