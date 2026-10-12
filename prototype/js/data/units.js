'use strict';
/* ---------- data: troop stats, race troop trees, the dragon's battle stats, hiring and upgrades ---------- */
const ST={
  militia:{n:'Militia',hp:26,dmg:5,spd:38,reach:11,range:0,cd:.9,tier:1},
  spearman:{n:'Spearman',hp:38,dmg:7,spd:38,reach:17,range:0,cd:.95,tier:2},
  archer:{n:'Archer',hp:18,dmg:5,spd:34,reach:0,range:90,cd:1.5,tier:1},
  ranger:{n:'Ranger',hp:24,dmg:8,spd:36,reach:0,range:110,cd:1.3,tier:2},
  horse:{n:'Horseman',hp:44,dmg:8,spd:72,reach:13,range:0,cd:1,tier:2,charge:true},
  chief:{n:'Chieftain',hp:80,dmg:10,spd:44,reach:16,range:0,cd:.8,tier:3},
  brann:{n:'Brann',hp:72,dmg:11,spd:46,reach:16,range:0,cd:.8,tier:3},
  elske:{n:'Elske',hp:42,dmg:6,spd:40,reach:13,range:0,cd:.9,tier:3},
  tavi:{n:'Tavi',hp:32,dmg:9,spd:40,reach:0,range:115,cd:1.1,tier:3}
};
// race troops: [race,id,name,tier,hp,dmg,spd,reach,range,cd,look,charge]
[['human','hum_levy','Levy',1,30,5,38,12,0,.85,'militia'],['human','hum_spear','Man-at-Arms',2,42,8,38,17,0,.95,'spearman'],['human','hum_guard','Shield Guard',3,64,8,34,16,0,1,'spearman'],['human','hum_pike','Pikeman',3,46,10,36,22,0,1.05,'spearman'],
 ['human','hum_bow','Bowman',1,18,5,34,0,90,1.5,'archer'],['human','hum_long','Longbowman',2,24,8,36,0,120,1.5,'ranger'],['human','hum_squire','Squire',2,44,8,70,13,0,1,'horse',1],['human','hum_knight','Knight',3,64,11,70,14,0,.95,'horse',1],
 ['dwarf','dw_clan','Dwarf Clansman',1,30,6,34,11,0,.95,'militia'],['dwarf','dw_axe','Dwarf Axeman',2,46,9,34,12,0,.9,'chief'],['dwarf','dw_iron','Ironbreaker',3,76,10,32,13,0,.9,'chief'],['dwarf','dw_berserk','Berserker',3,50,14,44,12,0,.7,'chief'],
 ['dwarf','dw_sling','Dwarf Slinger',1,22,4,34,0,80,1.2,'archer'],['dwarf','dw_xbow','Crossbowman',2,30,11,30,0,100,2.1,'ranger'],['dwarf','dw_ram','Ram Rider',2,44,7,62,12,0,.95,'horse',1],['dwarf','dw_ramlord','Ram Knight',3,58,10,66,13,0,.85,'horse',1],
 ['elf','elf_glade','Glade Warden',1,24,5,44,12,0,.8,'militia'],['elf','elf_dancer','Wardancer',2,36,8,48,13,0,.75,'militia'],['elf','elf_blade','Bladesinger',3,46,11,52,14,0,.65,'militia'],['elf','elf_sentinel','Sentinel',3,54,10,40,20,0,1,'spearman'],
 ['elf','elf_archer','Elf Archer',1,18,6,38,0,100,1.3,'archer'],['elf','elf_marks','Elf Marksman',2,24,8,38,0,120,1.3,'ranger'],['elf','elf_sharp','Starshot',3,28,12,38,0,135,1.3,'ranger'],['elf','elf_hart','Hart Rider',2,36,6,78,12,0,.95,'horse',1],['elf','elf_lance','Wild Lancer',3,50,10,76,16,0,.95,'horse',1],
 ['orc','orc_grunt','Orc Grunt',1,32,6,38,12,0,1,'militia'],['orc','orc_brute','Orc Brute',2,46,9,38,13,0,1,'chief'],['orc','orc_ironjaw','Ironjaw',3,78,12,34,14,0,1.05,'chief'],['orc','orc_reaver','Bloodreaver',3,54,16,46,13,0,.8,'chief'],
 ['orc','orc_thrower','Spear Thrower',1,22,7,38,0,70,1.6,'archer'],['orc','orc_hunter','Orc Hunter',2,28,9,38,0,90,1.5,'ranger'],['orc','orc_wolf','Wolf Rider',2,42,8,74,12,0,.95,'horse',1],['orc','orc_warg','Warg Raider',3,56,11,80,13,0,.9,'horse',1]
].forEach(([race,id,n,tier,hp,dmg,spd,reach,range,cd,look,charge])=>{ST[id]={n,tier,hp,dmg,spd,reach,range,cd,look,race,charge:!!charge}});
// casters: they shoot slow bolts of magic that splash and ignore armor (see matchups); bolt is the colour of their magic
[['human','hum_mage','Battle Mage',2,24,9,34,0,100,1.7,'#7fb0ff'],['dwarf','dw_rune','Runepriest',2,32,8,30,0,90,1.8,'#ff9a40'],
 ['elf','elf_weaver','Spellweaver',2,22,9,38,0,110,1.6,'#c58af0'],['orc','orc_shaman','Orc Shaman',2,28,9,36,0,85,1.8,'#78e070']
].forEach(([race,id,n,tier,hp,dmg,spd,reach,range,cd,bolt])=>{ST[id]={n,tier,hp,dmg,spd,reach,range,cd,look:'mage',race,charge:false,magic:true,bolt}});
ST.dw_xbow.flat=true;ST.orc_thrower.ammo=6;
// bows outrange everything: at least 200, and elves reach farthest (their arrows also scatter half as much)
Object.entries({archer:200,ranger:220,tavi:220,hum_bow:200,hum_long:230,orc_hunter:200,elf_archer:240,elf_marks:260,elf_sharp:280}).forEach(([k,r])=>{ST[k].range=r;ST[k].bow=true});
ST.hedge={n:'Hedge Witch',tier:1,hp:18,dmg:6,spd:34,reach:0,range:85,cd:1.8,look:'mage',magic:true,bolt:'#d070e0'};
ST.slime={n:'Bog Slime',tier:1,hp:24,dmg:5,spd:24,reach:0,range:75,cd:1.7,beast:true,magic:true,bolt:'#a0e060',home:['swamp']};
ST.wolf={n:'Frost Wolf',tier:1,hp:26,dmg:6,spd:62,reach:10,range:0,cd:.8,beast:true,home:['frost']};
ST.scorpion={n:'Giant Scorpion',tier:2,hp:48,dmg:8,spd:34,reach:12,range:0,cd:1.1,beast:true,home:['desert']};
ST.dragon={n:'Dragon',tier:4,hp:1500,dmg:22,spd:30,reach:24,range:0,cd:1.4,big:true,breath:true,beast:true};
const HIRE={militia:20,archer:35,horse:65,hum_levy:22,hum_bow:32,hum_squire:60,dw_clan:26,dw_sling:26,dw_ram:58,elf_glade:24,elf_archer:36,elf_hart:56,orc_grunt:22,orc_thrower:26,orc_wolf:54};
const UP={militia:['spearman'],archer:['ranger'],
  hum_levy:['hum_spear'],hum_spear:['hum_guard','hum_pike'],hum_bow:['hum_long','hum_mage'],hum_squire:['hum_knight'],
  dw_clan:['dw_axe'],dw_axe:['dw_iron','dw_berserk'],dw_sling:['dw_xbow','dw_rune'],dw_ram:['dw_ramlord'],
  elf_glade:['elf_dancer'],elf_dancer:['elf_blade','elf_sentinel'],elf_archer:['elf_marks','elf_weaver'],elf_marks:['elf_sharp'],elf_hart:['elf_lance'],
  orc_grunt:['orc_brute'],orc_brute:['orc_ironjaw','orc_reaver'],orc_thrower:['orc_hunter','orc_shaman'],orc_wolf:['orc_warg']};
// older saves used faction culture ids
const MIG={vale_levy:'hum_levy',vale_spear:'hum_spear',vale_guard:'hum_guard',vale_pike:'hum_pike',vale_bow:'hum_bow',vale_long:'hum_long',vale_squire:'hum_squire',vale_knight:'hum_knight',
  karn_clan:'dw_clan',karn_axe:'dw_axe',karn_huscarl:'dw_iron',karn_berserk:'dw_berserk',karn_sling:'dw_sling',karn_xbow:'dw_xbow',karn_rider:'dw_ram',karn_raider:'dw_ramlord',
  salt_sailor:'elf_glade',salt_marine:'elf_dancer',salt_corsair:'elf_blade',salt_halberd:'elf_sentinel',salt_archer:'elf_archer',salt_marks:'elf_marks',salt_sharp:'elf_sharp',salt_scout:'elf_hart',salt_lancer:'elf_lance'};
const RANSOM=[0,15,30,60];
