'use strict';
/* ---------- data: ordinary gear in seven material tiers ---------- */
const MATERIALS=[
  {k:'wood',n:'Wooden',col:'#a0703c'},{k:'bronze',n:'Bronze',col:'#cd7f32'},{k:'iron',n:'Iron',col:'#a7adba'},{k:'silver',n:'Silver',col:'#dfe4ea'},
  {k:'gold',n:'Golden',col:'#e8c040'},{k:'mithril',n:'Mithril',col:'#7fd8e8'},{k:'adamant',n:'Adamant',col:'#b07af0'}];
MATERIALS.forEach(m=>RARITY[m.k]=m.col);
// what each stat key means, for descriptions and comparisons; a third value of -1 means lower is better
const GEAR_STAT={hp:['health',''],dmg:['damage',''],reach:['reach',''],cd:['swing time','%',-1],spd:['battle speed','%'],travel:['travel speed','%'],crit:['crit chance','%'],
  block:['less blocked damage','%'],vis:['map vision','%'],regen:['health per second',''],slots:['bag slots',''],mp:['mana','']};
// base pieces: stats at tier t, where 0 is wood and 6 is adamant; value doubles each tier
const BASES={
  // hand: one (shield or a second weapon in the off hand), two (both hands), hybrid (two-handed grip with the off hand empty, one-handed with something in it)
  sword:{n:'Sword',slot:'weapon',icon:'blade',hand:'one',v:12,m:t=>({dmg:+(1+1.5*t).toFixed(1)})},
  spear:{n:'Spear',slot:'weapon',icon:'spear',hand:'hybrid',v:12,tag:'spear',m:t=>({dmg:+(.5+t).toFixed(1),reach:2+t})},
  helm:{n:'Helm',slot:'head',icon:'helm',v:8,m:t=>({hp:4+4*t})},
  mail:{n:'Armor',slot:'body',icon:'plate',v:16,heavyFrom:2,m:t=>({hp:8+8*t})},
  gloves:{n:'Gauntlets',slot:'arms',icon:'gloves',v:8,m:t=>({dmg:+(.5+.5*t).toFixed(1)})},
  greaves:{n:'Greaves',slot:'legs',icon:'greaves',v:8,m:t=>({hp:3+3*t})},
  boots:{n:'Boots',slot:'feet',icon:'boots',v:8,m:t=>({spd:+(.02+.02*t).toFixed(2),travel:+(.01+.01*t).toFixed(2)})},
  mask:{n:'Mask',slot:'face',icon:'mask',v:8,m:t=>({block:+(.01+.01*t).toFixed(2)})},
  earring:{n:'Earring',slot:'ear',icon:'earring',v:10,m:t=>({crit:+(.01+.01*t).toFixed(2)})},
  ring:{n:'Ring',slot:'ring',icon:'ring',v:6,m:t=>({hp:2+2*t})},
  cloak:{n:'Cloak',slot:'cape',icon:'cloak',v:8,m:t=>({hp:3+3*t,vis:+(.02+.02*t).toFixed(2)})},
  pack:{n:'Pack',slot:'bag',icon:'pack',v:10,m:t=>({slots:2+t})},
  axe:{n:'Axe',slot:'weapon',icon:'axe',hand:'one',v:12,tag:'pierce',m:t=>({dmg:+(2+1.8*t).toFixed(1),cd:.12})},
  // shot: what one attack costs (sp stamina or mp mana), its cooldown and its damage multiplier
  bow:{n:'Bow',slot:'weapon',icon:'bow',hand:'two',v:12,kind:'ranged',shot:{sp:7,mp:0,cd:.62,mult:.95},m:t=>({dmg:+(1+1.3*t).toFixed(1)})},
  crossbow:{n:'Crossbow',slot:'weapon',icon:'crossbow',hand:'two',v:14,kind:'ranged',tag:'pierce',shot:{sp:10,mp:0,cd:1.05,mult:1.5,flat:true},m:t=>({dmg:+(1.5+1.5*t).toFixed(1)})},
  staff:{n:'Staff',slot:'weapon',icon:'staff',hand:'two',v:12,kind:'magic',shot:{sp:0,mp:7,cd:.78,mult:1.15},m:t=>({dmg:+(.5+1.2*t).toFixed(1),mp:6+6*t})},
  wand:{n:'Wand',slot:'weapon',icon:'wand',hand:'one',v:12,kind:'magic',shot:{sp:0,mp:4,cd:.5,mult:.7},m:t=>({dmg:+(.5+t).toFixed(1),mp:3+3*t})},
  dagger:{n:'Dagger',slot:'weapon',icon:'dagger',hand:'one',v:8,m:t=>({dmg:+(.5+t).toFixed(1),cd:-.15})},
  greatsword:{n:'Greatsword',slot:'weapon',icon:'blade',hand:'two',v:16,m:t=>({dmg:+(3+2.2*t).toFixed(1),reach:3,cd:.2})},
  warhammer:{n:'Warhammer',slot:'weapon',icon:'club',hand:'two',v:16,tag:'pierce',m:t=>({dmg:+(3.5+2*t).toFixed(1),cd:.3})},
  // off hand: a shield blocks and makes right-click a shield bash; a tome feeds magic; a torch lights the way
  shield:{n:'Shield',slot:'offhand',icon:'shield',v:10,m:t=>({hp:4+4*t,block:+(.04+.02*t).toFixed(2)})},
  tome:{n:'Tome',slot:'offhand',icon:'tome',v:12,m:t=>t>=3?{mp:6+5*t,sk:{spell:1}}:{mp:6+5*t}},
  torch:{n:'Torch',slot:'offhand',icon:'torch',v:6,m:t=>({vis:+(.05+.02*t).toFixed(2),dmg:+(.3+.3*t).toFixed(1)})},
  // mount gear: worn by your mount, counts only while you ride
  chanfron:{n:'Chanfron',slot:'mhead',icon:'helm',v:10,m:t=>({hp:3+4*t})},
  barding:{n:'Barding',slot:'marmor',icon:'plate',v:18,m:t=>({hp:8+8*t,travel:-.03})},
  saddle:{n:'Saddle',slot:'macc',icon:'belt',v:10,m:t=>({spd:+(.02+.015*t).toFixed(2),travel:+(.02+.01*t).toFixed(2)})},
  saddlebags:{n:'Saddlebags',slot:'macc',icon:'pack',v:12,m:t=>({slots:1+Math.floor(t/2)})},
  belt:{n:'Belt',slot:'belt',icon:'belt',v:8,m:t=>({slots:1+Math.floor(t/2),hp:2+2*t})}
};
function describeGear(m,tag){
  const parts=Object.keys(m).filter(k=>GEAR_STAT[k]&&m[k]).map(k=>{const [n,u]=GEAR_STAT[k],v=u?Math.round(m[k]*100):m[k];return (v>0?'+':'')+v+u+' '+n});
  return cap1(parts.join(', '))+'.'+(tag==='spear'?' Fights as a spearman.':tag==='heavy'?' Heavy armor against arrows.':tag==='pierce'?' Pierces armor.':'');
}
const HAND_NOTE={one:' One-handed: pair it with a shield or a second weapon.',two:'',hybrid:' Hybrid: a two-handed grip with the off hand empty (+20% damage, +4 reach), one-handed with a shield.',mount:' Worn by your mount.','':''};
// ITEMS ids look like g_sword_2 (an iron sword)
Object.keys(BASES).forEach(b=>MATERIALS.forEach((mat,t)=>{const B=BASES[b],m=B.m(t),tag=B.tag||(B.heavyFrom!=null&&t>=B.heavyFrom?'heavy':undefined);
  ITEMS['g_'+b+'_'+t]={n:mat.n+' '+B.n,slot:B.slot,r:mat.k,tier:t,base:b,m,tag,v:B.v*2**t,icon:B.icon,col:mat.col,kind:B.kind,shot:B.shot,hand:B.hand,d:describeGear(m,tag)+HAND_NOTE[B.hand||(MOUNT_KEYS.includes(B.slot)?'mount':'')]+(B.kind==='ranged'?' Your attacks shoot arrows (stamina).':B.kind==='magic'?' Your attacks cast bolts of magic that splash (mana).':'')}}));
const gearId=(b,t)=>'g_'+b+'_'+t;
/* damaged gear (the owner, 2026-11-13: "make drops for junk gears / damaged gear"; battle/drops.js): each ordinary piece in a damaged
   form, gd_<base>_<tier>, worn as it is: m × its good numbers (a slower swing or a heavier barding's slowness kept, a tome's Spellcraft lost), v
   × its worth; a smith mends it into the whole piece for mend × the difference of their prices (ui/town.js Smithy) */
const DAMAGED={m:.5,v:.3,mend:.6};
const damagedId=(b,t)=>'gd_'+b+'_'+t;
Object.keys(BASES).forEach(b=>MATERIALS.forEach((mat,t)=>{const W=ITEMS[gearId(b,t)],m={};
  for(const k in W.m){const v=W.m[k];if(typeof v!=='number')continue;m[k]=(v>0)!==(GEAR_STAT[k]?.[2]===-1)?+(v*DAMAGED.m).toFixed(k==='hp'||k==='mp'||k==='slots'||k==='reach'?0:2)||v:v}
  ITEMS[damagedId(b,t)]={...W,n:'Damaged '+W.n,m,v:Math.max(1,Math.round(W.v*DAMAGED.v)),damaged:true,whole:gearId(b,t),
    d:'Damaged: '+describeGear(m,W.tag).replace(/^./,c=>c.toLowerCase())+' A smith can mend it.'+W.d.slice(describeGear(W.m,W.tag).length)}}));
// Wearable versions of the portrait catalog. Tier controls availability; culture biases stock, never who may wear it.
// [portrait part, name, tier, battlefield silhouette, armor class / culture]
const ARMOR_STYLES={body:[
  ['padded-jack','Padded Jack',0,'leather','leather'],['gambeson','Quilted Gambeson',1,'leather','leather'],
  ['orc-leather-vest','Laced Leather Vest',2,'leather','leather'],['orc-studded-leather','Studded Leather',2,'leather','leather'],
  ['orc-cross-harness','Cross Harness Vest',1,'harness','leather'],['orc-ring-harness','Ring Harness Vest',1,'harness','leather'],
  ['orc-layered-hide','Layered Hide Armor',2,'leather','leather','orc'],['orc-leather-guard','Leather Shoulder Guard',3,'leather','leather','orc'],
  ['brigandine','Brigandine',3,'mail','mail'],['coat-of-plates','Coat of Plates',3,'mail','mail'],
  ['steel-cuirass','Knight Cuirass',4,'plate','plate'],['dwarf-runic-plate','Runic Plate',5,'plate','plate','dwarf'],
  ['dwarf-forge-plate','Forge Plate',6,'plate','plate','dwarf'],['elf-silver-scale','Elven Silver Scale',4,'mail','mail','elf'],
  ['elf-leaf-cuirass','Leaf Cuirass',5,'plate','plate','elf'],['elf-leaf-mail','Leaf Mail',3,'mail','mail','elf'],
  ['fur','Fur Mantle Coat',0,'leather','leather']
],head:[
  ['arming-cap','Padded Arming Cap',0,'cap'],['coif','Mail Coif',1,'coif'],['nasal','Nasal Helm',2,'kettle'],['kettle','Kettle Helm',2,'kettle'],
  ['sallet','Sallet',3,'kettle'],['open-bascinet','Open Bascinet',3,'kettle'],['closed-knight-helm','Closed Knight Helm',4,'great'],
  ['great-helm','Great Helm',3,'great'],['barrel-great-helm','Barrel Great Helm',4,'great'],['rivet-banded-helm','Rivet Banded Helm',4,'great'],
  ['fluted-knight-helm','Fluted Knight Helm',5,'great'],['horned-closed-helm','Horned Closed Helm',6,'closedHorned','dwarf'],
  ['leaf-visor-helm','Leaf Visor Helm',5,'great','elf'],['tusked-closed-helm','Tusked Closed Helm',5,'great','orc'],
  ['visored-bascinet','Visored Bascinet',4,'great'],['closed-sallet','Closed Sallet',4,'great'],['beaked-bascinet','Beaked Bascinet',4,'great'],
  ['slit-mask-helm','Slitted War Mask',3,'great','orc'],['dwarf-horned-helm','Dwarven Horned Helm',4,'horned','dwarf'],
  ['dwarf-rune-helm','Dwarven Rune Helm',5,'great','dwarf'],['elf-winged-helm','Elven Winged Helm',6,'plume','elf'],['forge-helm','Forge Helm',3,'kettle','dwarf']
]};
const STYLE_GEAR=[];
for(const [slot,rows] of Object.entries(ARMOR_STYLES))for(const [part,n,tier,shape,extra,culture] of rows){
  const id='a_'+part,body=slot==='body',base=body?'mail':'helm',heavy=shape==='plate'||shape==='great'||shape==='horned'||shape==='closedHorned',light=body&&(shape==='leather'||shape==='harness'),
    armor=body?extra:null,m={hp:BASES[base].m(tier).hp+(heavy?4:0)};
  if(light)m.spd=.02;if(shape==='harness'){m.hp=Math.max(6,m.hp-4);m.crit=.02}if(heavy)m.spd=-.02;
  const col=light||tier===0?'#806047':extra==='orc'||culture==='orc'?'#8a8173':'#a9adb0',look=body?{armor:shape==='harness'?'leather':shape,harness:shape==='harness'}:{helm:shape},
    it={n,slot,tier,base,armor,m,v:Math.round(BASES[base].v*2**tier*1.15),r:tier>=5?'epic':tier>=3?'rare':'common',icon:body?(light?'vest':'plate'):'helm',col,
      portrait:{[body?'clothing':'headwear']:part},look,culture:body?culture:extra,d:describeGear(m,heavy&&body?'heavy':null),...(heavy&&body?{tag:'heavy'}:{})};
  if(body&&part==='fur')it.fur={cape:true};ITEMS[id]=it;STYLE_GEAR.push(id);
  const worn='ad_'+part,dm={};for(const [k,v] of Object.entries(m))dm[k]=v>0?+(v*DAMAGED.m).toFixed(k==='hp'?0:2)||v:v;
  ITEMS[worn]={...it,n:'Damaged '+n,m:dm,v:Math.max(1,Math.round(it.v*DAMAGED.v)),damaged:true,whole:id,d:'Damaged: '+describeGear(dm,it.tag)+' A smith can mend it.'};it.damagedForm=worn;
}
function styleGear(slot,tier,race,random=Math.random){const L=STYLE_GEAR.filter(k=>ITEMS[k].slot===slot&&ITEMS[k].tier===tier);if(!L.length)return null;
  const weight=id=>ITEMS[id].culture===race?3:1;let n=random()*L.reduce((a,k)=>a+weight(k),0);return L.find(k=>(n-=weight(k))<0)||L[L.length-1];}
// a random ordinary piece of a tier in [lo, hi]
const randomGear=(lo,hi)=>{const base=Object.keys(BASES)[rint(0,Object.keys(BASES).length-1)],tier=rint(lo,Math.min(hi,MATERIALS.length-1));return styleGear(BASES[base].slot,tier)||gearId(base,tier)};

/* ---------- mounts: one mount slot, and nobody starts with one ---------- */
// sold at stables: where 'any' (every holding), 'town' (towns and castles), 'castle', or by race or climate. drop: only from beasts.
// ign: terrain and climates crossed at full speed; fly crosses all of them.
// fig: how it is drawn under you (people.js lookOf): its figure's kind (a horse in its coat col, a ram, a stag, a warg, a griffin, a
// drake, a strider: the drake's body, green and wingless) and whether it is barded. A camel has no figure of its own yet: a horse in its colour.
const MOUNTS={
  mule:{n:'Pack Mule',r:'common',m:{travel:.05,slots:4},v:90,col:'#8a7a6a',where:'any',fig:['horse'],d:'Slow but steady, with saddlebags.'},
  pony:{n:'Pony',r:'common',m:{travel:.12,spd:.04},v:130,col:'#a07a4a',where:'any',fig:['horse'],d:'Small and sure-footed.'},
  horse:{n:'Riding Horse',r:'common',m:{travel:.22,spd:.1},v:260,col:'#7a4a2a',where:'town',fig:['horse'],d:'A good horse for the long roads.'},
  destrier:{n:'War Destrier',r:'rare',m:{travel:.15,spd:.1,hp:30,dmg:2},v:640,col:'#3a3030',where:'castle',fig:['horse',true],d:'Armored and bred for battle.'},
  courser:{n:'Courser',r:'rare',m:{travel:.32,spd:.18},v:560,col:'#d8c8a0',race:'human',fig:['horse'],d:'The fastest horse in the human kingdoms.'},
  ram:{n:'Mountain Ram',r:'rare',m:{travel:.15,hp:20},ign:['hills','frost'],v:420,col:'#c8c0b0',race:'dwarf',fig:['ram'],d:'Dwarven stock that climbs anything.'},
  elk:{n:'Great Elk',r:'rare',m:{travel:.18,vis:.1},ign:['forest'],v:440,col:'#9a6a3a',race:'elf',fig:['stag'],d:'Slips between the trees like a shadow.'},
  warg:{n:'Warg',r:'rare',m:{travel:.22,spd:.18,dmg:3},v:480,col:'#5a5a5a',race:'orc',fig:['warg'],d:'Bites whatever its rider points at.'},
  camel:{n:'Camel',r:'rare',m:{travel:.15,slots:2},ign:['desert'],v:380,col:'#d8b070',clim:'desert',fig:['horse'],d:'Crosses the sand without slowing.'},
  strider:{n:'Marsh Strider',r:'rare',m:{travel:.15,hp:15},ign:['swamp'],v:380,col:'#5a8a5a',clim:'swamp',fig:['strider'],d:'A long-legged lizard at home in the bog.'},
  griffin:{n:'Griffin',r:'epic',m:{travel:.4,vis:.25},fly:true,v:1600,col:'#e8dcc0',drop:true,fig:['griffin'],d:'Tamed from a wild griffin.'},
  drake:{n:'Young Drake',r:'epic',m:{travel:.35,hp:40,dmg:4},fly:true,v:2200,col:'#c84a3a',drop:true,fig:['drake'],d:'Hatched from an egg in a dragon’s hoard.'}
};
const ALL_GROUND=['forest','hills','grass','frost','desert','swamp'];
Object.keys(MOUNTS).forEach(k=>{const M=MOUNTS[k],ign=M.fly?ALL_GROUND:M.ign||[];
  ITEMS['m_'+k]={n:M.n,slot:'mount',r:M.r,m:M.m,v:M.v,icon:'mount',col:M.col,ign,fly:!!M.fly,fig:M.fig,
    d:M.d+' '+describeGear(M.m)+(M.fly?' Flies over forest, hills, sand and bog at full speed.':ign.length?' Crosses '+ign.join(' and ')+' at full speed.':'')}});

/* ---------- quivers (doc/ITEMS_DESIGN.md §2b): no arrows nor bolts in the bag. A quiver is worn in its own slot (unworn, it takes a
   bag slot); its shots are its wearer's in every battle, full at each start (your hero and the characters: core/items.js Quiver).
   ARROWS, the arrow types: n, their word; col, their look; f, their damage factor (1 for all now); bolt: crossbow bolts.
   QUIVERS: n; shots; arrow (ARROWS); fits, the weapon (a bow or a crossbow); sold, where: market (any market square), smith (any
   smith), city (a city's smith), or a people (their holdings); v, worth; r, rarity. A new quiver is one more line, as is a new
   arrow. QUIVER.none: the shots of a character whose bow has no quiver (or one that does not fit it) ---------- */
const ARROWS={wood:{n:'wooden',col:'#a0703c',f:1},bronze:{n:'bronze',col:'#cd7f32',f:1},iron:{n:'iron',col:'#a7adba',f:1},steel:{n:'steel',col:'#dfe4ea',f:1},
  elven:{n:'elven',col:'#78c474',f:1},dwarven:{n:'dwarven',col:'#5a8fe8',f:1,bolt:true},
  woodBolt:{n:'wooden',col:'#a0703c',f:1,bolt:true},ironBolt:{n:'iron',col:'#a7adba',f:1,bolt:true},steelBolt:{n:'steel',col:'#dfe4ea',f:1,bolt:true}};
const QUIVERS={
  worn:{n:'Worn quiver',shots:20,arrow:'wood',fits:'bow',sold:'market',v:12,r:'common'},
  wornCase:{n:'Worn bolt case',shots:20,arrow:'woodBolt',fits:'crossbow',sold:'market',v:14,r:'common'},
  hunter:{n:'Hunter’s quiver',shots:30,arrow:'bronze',fits:'bow',sold:'market',v:30,r:'common'},
  soldier:{n:'Soldier’s quiver',shots:40,arrow:'iron',fits:'bow',sold:'smith',v:60,r:'rare'},
  boltCase:{n:'Soldier’s bolt case',shots:40,arrow:'ironBolt',fits:'crossbow',sold:'smith',v:70,r:'rare'},
  elven:{n:'Elven quiver',shots:50,arrow:'elven',fits:'bow',sold:'elf',v:120,r:'rare'},
  dwarven:{n:'Dwarven bolt case',shots:50,arrow:'dwarven',fits:'crossbow',sold:'dwarf',v:130,r:'rare'},
  master:{n:'Master’s quiver',shots:60,arrow:'steel',fits:'bow',sold:'city',v:200,r:'epic'},
  masterCase:{n:'Master’s bolt case',shots:60,arrow:'steelBolt',fits:'crossbow',sold:'city',v:220,r:'epic'}};
const QUIVER={none:5};
// (their arrows in words: 30 bronze arrows)
const arrowsText=Q=>Q.shots+' '+ARROWS[Q.arrow].n+' '+(ARROWS[Q.arrow].bolt?'bolts':'arrows');
// ITEMS ids look like q_hunter
Object.keys(QUIVERS).forEach(k=>{const Q=QUIVERS[k],A=ARROWS[Q.arrow];
  ITEMS['q_'+k]={n:Q.n,slot:'quiver',r:Q.r,m:{},v:Q.v,icon:A.bolt?'bolts':'arrows',col:A.col,quiver:k,
    d:cap1(arrowsText(Q))+' for a '+Q.fits+': your shots in every battle, the quiver full again at each start.'}});
