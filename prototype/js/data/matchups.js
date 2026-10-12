'use strict';
/* ---------- data: unit strengths and weaknesses ---------- */
// Class comes from the unit: ranged, cavalry (charges), spear, or foot. Traits add to it:
//   heavy  - armor: takes 35% less from arrows, but armor-piercing hits it harder
//   pierce - armor-piercing: +30% against heavy armor and large monsters, and its arrows ignore armor
//   shock  - shock troops: +40% against archers and casters
//   ward   - warded: takes 40% less from magic
// Core triangle: cavalry > ranged > foot > spear > cavalry. Spears also stop charges and punish large monsters.
// Magic (casters): slow bolts that splash, ignore armor (+25% against heavy), fly through trees and are only half blocked; casters are fragile, so cavalry and shock troops punish them.
const TAGS={
  spearman:['spear'],chief:['heavy'],brann:['shock'],tavi:['pierce'],
  hum_spear:['spear'],hum_guard:['heavy'],hum_pike:['spear'],hum_long:['pierce'],hum_knight:['heavy'],
  dw_axe:['pierce'],dw_iron:['heavy','ward'],dw_rune:['ward'],dw_berserk:['shock'],dw_xbow:['pierce'],dw_ramlord:['heavy'],
  elf_dancer:['shock'],elf_blade:['shock'],elf_sentinel:['spear','heavy','ward'],elf_weaver:['ward'],elf_sharp:['pierce'],elf_lance:['pierce'],
  orc_brute:['shock'],orc_ironjaw:['heavy'],orc_reaver:['shock'],orc_thrower:['pierce'],
  tiger:['shock'],bear:['heavy'],troll:['heavy'],scorpion:['heavy','pierce'],wyrm:['heavy']
};
Object.entries(TAGS).forEach(([k,t])=>{ST[k].tags=t});
const tagsOf=s=>s.tags||[];
const unitClass=s=>s.range?(s.magic?'magic':'ranged'):s.charge?'cav':tagsOf(s).includes('spear')?'spear':'foot';
// damage multiplier when a hits d
function matchup(a,d){
  const ac=unitClass(a),dc=unitClass(d),at=tagsOf(a),dt=tagsOf(d);let m=1;
  if(ac==='spear'&&(dc==='cav'||d.big))m*=1.6;
  if(ac==='cav'&&(dc==='ranged'||dc==='magic'))m*=1.4;
  if(ac==='ranged'&&dc==='foot'&&!dt.includes('heavy'))m*=1.2;
  if(ac==='foot'&&dc==='spear')m*=1.25;
  if(at.includes('shock')&&(dc==='ranged'||dc==='magic'))m*=1.4;
  if(ac==='magic'){if(dt.includes('heavy'))m*=1.25;if(dt.includes('ward'))m*=.6}
  if(dt.includes('heavy')&&ac==='ranged'&&!at.includes('pierce'))m*=.65;
  if(at.includes('pierce')&&(dt.includes('heavy')||d.big))m*=1.3;
  return m;
}
// plain-language strengths and weaknesses for a unit's stats
function vsInfo(s){
  const c=unitClass(s),t=tagsOf(s),strong=[],weak=[];
  if(c==='spear'){strong.push('cavalry','large monsters');weak.push('swordsmen and axemen')}
  if(c==='cav'){strong.push('archers');weak.push('spearmen')}
  if(c==='ranged'){strong.push('unarmored infantry');weak.push('cavalry','shock troops')}
  if(c==='magic'){strong.push('heavy armor','packed ranks');weak.push('cavalry','shock troops','warded troops')}
  if(c==='foot'){strong.push('spearmen');if(!t.includes('heavy'))weak.push('archers')}
  if(t.includes('shock')&&!strong.includes('archers'))strong.push('archers');
  if(t.includes('heavy')){strong.push('arrows (35% less damage)');weak.push('armor-piercing attacks','magic')}
  if(t.includes('pierce'))strong.push('heavy armor');
  if(t.includes('ward'))strong.push('magic (40% less damage)');
  if(s.big){weak.push('spearmen','armor-piercing attacks')}
  return{strong:[...new Set(strong)],weak:[...new Set(weak)]};
}
const vsLine=s=>{const v=vsInfo(s);return 'Strong vs '+(v.strong.join(', ')||'—')+' · Weak vs '+(v.weak.join(', ')||'—')};
