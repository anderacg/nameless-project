'use strict';
/* ---------- data: unit strengths and weaknesses ---------- */
// Class comes from the unit: ranged, cavalry (charges), spear, or foot. Traits add to it:
//   heavy  - armor: takes 35% less from arrows, but armor-piercing hits it harder
//   pierce - armor-piercing: +30% against heavy armor and large monsters, and its arrows ignore armor
//   shock  - shock troops: +40% against archers and casters
//   ward   - warded: takes 40% less from magic
//   shield - carries a shield: 30% less from missiles that hit its front; only shielded infantry can form a shield wall
// Core triangle: cavalry > ranged > foot > spear > cavalry. Spears also stop charges and punish large monsters.
// Magic (casters): slow bolts that splash, ignore armor (+25% against heavy), fly through trees and are only half blocked; casters are fragile, so cavalry and shock troops punish them.
const TAGS={
  spearman:['spear','shield'],chief:['heavy'],brann:['shock'],tavi:['pierce','mobile'],
  hum_levy:['spear'],hum_spear:['spear','shield'],hum_guard:['heavy','shield'],hum_pike:['spear'],hum_long:['pierce'],hum_knight:['heavy'],
  hum_foot:['shield'],hum_sword:['shield'],hum_sergeant:['heavy','shield'],hum_champ:['shock'],hum_xbow:['pierce'],
  dw_axe:['pierce'],dw_iron:['heavy','ward','shield'],dw_rune:['ward'],dw_berserk:['shock'],dw_xbow:['pierce'],dw_ramlord:['heavy'],
  dw_shield:['shield'],dw_hammer:['heavy','shield'],dw_longbeard:['heavy','ward','shield'],dw_thane:['pierce'],
  elf_dancer:['shock'],elf_blade:['shock'],elf_sentinel:['spear','heavy','ward','shield'],elf_weaver:['ward'],elf_sharp:['pierce'],elf_lance:['pierce'],
  elf_spear:['spear','shield'],elf_eternal:['spear','shield'],elf_phoenix:['spear','heavy','ward','shield'],
  orc_brute:['shock'],orc_ironjaw:['heavy','shield'],orc_reaver:['shock'],orc_thrower:['pierce'],
  orc_shield:['shield'],orc_warrior:['shield'],orc_black:['heavy','shield'],
  // (shoot on the move: their own skill; every elf with a bow has it too: battle.js onTheMove)
  ranger:['mobile'],hum_hbow:['mobile'],orc_wolfbow:['mobile'],
  tiger:['shock'],bear:['heavy'],troll:['heavy'],scorpion:['heavy','pierce'],wyrm:['heavy']
};
Object.entries(TAGS).forEach(([k,t])=>{ST[k].tags=t});
/* ---------- damage types and armour. Every blow, shot and spell is physical (slash, pierce, blunt) or magical (fire, frost,
   arcane). Physical damage is stopped in part by armour (ARMOR_VS: what is left of each kind against each armour); an
   armour-piercing weapon (the 'pierce' trait) is stopped half as much. Magic ignores armour: a ward (the 'ward' trait) takes
   WARD of it, and some creatures and peoples resist or fear a school (RESIST, RACE_RESIST). A troop's type comes from its
   weapon (WEAPON_DT; UNIT_DT for casters and beasts), its armour from what it wears (OUTER_ARMOR; plate for heavy troops; hide
   for beasts; UNIT_ARMOR where its look misleads); a character's from the weapon and body armour they carry (itemDt, itemArmor) ---------- */
const DMG={slash:{n:'Slash',main:'physical'},pierce:{n:'Pierce',main:'physical'},blunt:{n:'Blunt',main:'physical'},fire:{n:'Fire',main:'magical'},frost:{n:'Frost',main:'magical'},arcane:{n:'Arcane',main:'magical'}};
const ARMOR={none:{n:'Unarmoured'},leather:{n:'Leather'},mail:{n:'Mail'},plate:{n:'Plate'},hide:{n:'Hide / scales'}};
const ARMOR_VS={slash:{none:1,leather:.85,mail:.65,plate:.45,hide:.8},pierce:{none:1,leather:.9,mail:.8,plate:.6,hide:.85},blunt:{none:1,leather:.9,mail:.8,plate:.75,hide:.85}};
const WARD=.6,AP=.5;// (a ward keeps 60% of magic; armour-piercing: armour stops half as much)
const RESIST={troll:{fire:1.5,frost:.5},wolf:{fire:1.3,frost:.3},dragon:{fire:.2},wyrm:{fire:.6},slime:{fire:1.3,frost:.6},spider:{fire:1.3}};
const RACE_RESIST={elf:{arcane:.85},dwarf:{fire:.85},orc:{frost:.85}};
const WEAPON_DT={sword:'slash',great:'slash',axe:'slash',bigaxe:'slash',spear:'pierce',pike:'pierce',lance:'pierce',javelin:'pierce',hammer:'blunt',bow:'pierce',longbow:'pierce',xbow:'pierce',sling:'blunt',staff:'arcane'};
const UNIT_DT={hum_mage:'fire',orc_shaman:'fire',hedge:'frost',dw_rune:'arcane',elf_weaver:'arcane',elske:'arcane',slime:'frost',wolf:'slash',tiger:'slash',bear:'slash',griffin:'slash',dragon:'slash',boar:'pierce',spider:'pierce',scorpion:'pierce',wyrm:'pierce',troll:'blunt'};
const OUTER_ARMOR={steel:'mail',iron:'mail',silver:'mail',gold:'mail',rust:'mail',leather:'leather',fur:'leather',skull:'leather'};
const UNIT_ARMOR={chief:'mail',elf_eternal:'mail',elf_blade:'leather',slime:'none'};
const ITEM_DT={sword:'slash',greatsword:'slash',axe:'slash',spear:'pierce',dagger:'pierce',warhammer:'blunt',bow:'pierce',crossbow:'pierce',staff:'arcane',wand:'arcane'};
const ITEM_ARMOR={bearcoat:'hide',trollhide:'hide',silkvest:'leather',scorpplate:'plate'};
// a weapon's damage type, a body armour's class (by its id: g_<base>_<tier>, or a monster piece)
function itemDt(id){const I=id&&ITEMS[id];if(!I)return null;return I.dt||ITEM_DT[I.base]||(I.icon==='club'?'blunt':I.icon==='spear'||I.icon==='dagger'?'pierce':'slash')}
function itemArmor(id){const I=id&&ITEMS[id];if(!I)return null;return I.armor||ITEM_ARMOR[id]||(I.base==='mail'?I.tier<2?'leather':I.tier<4?'mail':'plate':'leather')}
// every troop kind its type and armour, from its look (once at load, and for any kind added since: a recruit)
function damageTypesInit(){for(const [k,s] of Object.entries(ST)){const L=(typeof PEOPLE_LOOK!=='undefined'&&(PEOPLE_LOOK[k]||PEOPLE_LOOK[s.look]))||{};
  if(!s.dt)s.dt=UNIT_DT[k]||WEAPON_DT[L.weapon]||(s.magic?'arcane':s.range?'pierce':'slash');
  if(!s.armor)s.armor=UNIT_ARMOR[k]||(s.beast||s.big?'hide':(s.tags||[]).includes('heavy')?'plate':OUTER_ARMOR[L.outer]||'none');
  if(!s.resist&&RESIST[k])s.resist=RESIST[k]}}
const dtOf=s=>s&&s.dt||(s&&s.magic?'arcane':s&&s.range?'pierce':'slash');
const armorOf=s=>s&&s.armor||'none';
const isMagical=dt=>!!(DMG[dt]&&DMG[dt].main==='magical');
// a combo step's own kind: a thrust pierces, a slam crushes, a sweep is the weapon's
const shapeDt=(shape,base)=>shape==='thrust'||shape==='twin'?'pierce':shape==='slam'?'blunt':base;
// what is left of a blow of type dt (else the attacker's) from a on d, after armour or ward and resistances
function typeMul(a,d,dt){dt=dt||dtOf(a);if(!DMG[dt])return 1;
  if(isMagical(dt))return (tagsOf(d).includes('ward')?WARD:1)*((d.resist&&d.resist[dt])||1)*((RACE_RESIST[d.race]||{})[dt]||1);
  const m=(ARMOR_VS[dt]||{})[armorOf(d)]??1;return m<1&&tagsOf(a).includes('pierce')?m+(1-m)*AP:m}
const tagsOf=s=>s.tags||[];
/* every unit two attacks: a melee damage and a missile damage. A shooter's melee (his sidearm: Melee Mode) is s.mdmg, else
   MELEE_SHOT of his shot; a fighter's missile is his shot if he has one, else none (0) */
const MELEE_SHOT=.4;
const meleeDmgOf=s=>s.range?(s.mdmg??+(s.dmg*MELEE_SHOT).toFixed(1)):s.dmg;
const missileDmgOf=s=>s.range?s.dmg:0;
/* a unit's Morale: its nerve, as Total War's leadership. 40 + 10 a tier (levies 50, veterans 70, the best 80); dwarves are
   stubborn (+8), elves steady (+4); heavy and shock troops +5. s.morale on a kind sets it outright. In battle it is where a
   soldier's morale starts (scaled by your band's morale, or the enemy's level) and how hard every shock hits him (steadiness:
   UNIT_MOR.ref / it); on the map, your band's morale drifts toward your troops' average (world.js dayTick) */
const UNIT_MOR={base:40,tier:10,race:{dwarf:8,elf:4},heavy:5,shock:5,ref:60,min:.5,max:1.6};
function unitMoraleOf(s){if(!s)return UNIT_MOR.ref;if(s.morale!=null)return s.morale;const t=s.tags||[];
  return UNIT_MOR.base+UNIT_MOR.tier*(s.tier||1)+(UNIT_MOR.race[s.race]||0)+(t.includes('heavy')?UNIT_MOR.heavy:0)+(t.includes('shock')?UNIT_MOR.shock:0)}
const unitClass=s=>s.range?(s.magic?'magic':'ranged'):s.charge?'cav':tagsOf(s).includes('spear')?'spear':'foot';
// damage multiplier when a hits d (dt: the blow's own type, else a's): its kind against d's, then its type against d's armour or ward
function matchup(a,d,dt){
  const ac=unitClass(a),dc=unitClass(d),at=tagsOf(a);let m=1;
  if(ac==='spear'&&(dc==='cav'||d.big))m*=1.6;
  if(ac==='cav'&&(dc==='ranged'||dc==='magic'))m*=1.4;
  if(ac==='ranged'&&dc==='foot')m*=1.2;
  if(ac==='foot'&&dc==='spear')m*=1.25;
  if(at.includes('shock')&&(dc==='ranged'||dc==='magic'))m*=1.4;
  return m*typeMul(a,d,dt);
}
// plain-language strengths and weaknesses for a unit's stats
function vsInfo(s){
  const c=unitClass(s),t=tagsOf(s),strong=[],weak=[];
  if(c==='spear'){strong.push('cavalry','large monsters');weak.push('swordsmen and axemen')}
  if(c==='cav'){strong.push('archers');weak.push('spearmen')}
  if(c==='ranged'){strong.push('infantry');weak.push('cavalry','shock troops')}
  if(c==='magic'){strong.push('armour (magic ignores it)','packed ranks');weak.push('cavalry','shock troops','warded troops')}
  if(c==='foot'){strong.push('spearmen');if(armorOf(s)!=='plate')weak.push(t.includes('shield')?'archers on their flanks':t.includes('shock')?'archers at range':'archers')}
  if(t.includes('shock')&&!strong.includes('archers'))strong.push('archers');
  // (its blows against armour, its armour against blows)
  const d=dtOf(s),a=armorOf(s);
  if(d==='slash'){strong.push('the unarmoured');weak.push('plate')}
  if(d==='blunt')strong.push('plate (crushing blows)');
  if(d==='pierce')strong.push('mail');
  if(t.includes('pierce'))strong.push('heavy armour (armour-piercing)');
  if(a==='plate'){strong.push('slashing blows','arrows');weak.push('magic','crushing blows')}
  if(a==='mail')strong.push('slashing blows');
  if(a==='none'&&!isMagical(d)&&c!=='magic')weak.push('slashing blows');
  if(t.includes('ward'))strong.push('magic (40% less damage)');
  for(const [k,v] of Object.entries(s.resist||{}))(v<1?strong:weak).push(DMG[k].n.toLowerCase()+' ('+(v<1?Math.round((1-v)*100)+'% less':Math.round((v-1)*100)+'% more')+')');
  if(t.includes('shield')&&!s.range)strong.push('missiles from the front (30% less)');
  if(s.big){weak.push('spearmen','armor-piercing attacks')}
  return{strong:[...new Set(strong)],weak:[...new Set(weak)]};
}
const vsLine=s=>{const v=vsInfo(s);return 'Strong vs '+(v.strong.join(', ')||'—')+' · Weak vs '+(v.weak.join(', ')||'—')};
