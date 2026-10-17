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
const MATS={pelt:{n:'Wolf Pelt',v:12,icon:'pelt',col:'#9aa3ad'},tusk:{n:'Boar Tusk',v:14,icon:'tusk',col:'#e8e4d0'},tigerpelt:{n:'Tiger Pelt',v:45,icon:'pelt',col:'#e08a2a'},
  bearhide:{n:'Bear Hide',v:40,icon:'pelt',col:'#6e4e36'},silk:{n:'Spider Silk',v:18,icon:'silk',col:'#e4e0cf'},trollhide:{n:'Troll Hide',v:70,icon:'pelt',col:'#6a8a6a'},
  hide:{n:'Deer Hide',v:10,icon:'pelt',col:'#b08050'},antler:{n:'Antler',v:22,icon:'tusk',col:'#e0d0b0'},rabbitfur:{n:'Rabbit Fur',v:4,icon:'pelt',col:'#c8b8a0'},
  goo:{n:'Slime Jelly',v:9,icon:'vial',col:'#a0e060'},venom:{n:'Venom Sac',v:20,icon:'vial',col:'#78c474'},scale:{n:'Wyrm Scale',v:120,icon:'scale',col:'#e0b870'},feather:{n:'Griffin Feather',v:55,icon:'feather',col:'#e8dcc0'}};
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
// equipment: 16 slots plus 10 fingers. An item's slot names its kind; rings fit any finger.
const SLOTS={weapon:'Main hand',offhand:'Off hand',head:'Head',face:'Face',ear:'Earring',body:'Body',cape:'Cape',arms:'Arms',belt:'Belt',legs:'Legs',feet:'Feet',bag:'Bag',mount:'Mount',mhead:'Barding head',marmor:'Barding',macc:'Mount accessory',ring:'Ring'};
// the mount's gear (MOUNT_KEYS) only counts while you ride
const MOUNT_KEYS=['mhead','marmor','macc'];
const EQUIP=['weapon','offhand','head','face','ear','body','cape','arms','belt','legs','feet','bag','mount',...MOUNT_KEYS,...Array.from({length:10},(_,i)=>'ring'+i)];
const slotOfKey=k=>k.startsWith('ring')?'ring':k;
const emptyGear=()=>Object.fromEntries(EQUIP.map(k=>[k,null]));
const INV_SIZE=30,STACK=20;
