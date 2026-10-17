'use strict';
/* ---------- units: everyone who fights is a Unit. Two kinds:
   - a Troop: a kind of soldier (Levy, Footman, Knight...). One object per kind, shared by every soldier of it (a band on the
     map keeps only counts of its kinds: parties.js). Its numbers and abilities are fixed by its data (ST, units.js); it grows
     only by training up its troop tree.
   - a Character: one person, with a name, who grows: a level from experience (level x 60 to the next) and disciplines that rise
     by use (0 to 10, (level + 1) x 20 to the next). Its role says who it is now: your hero, a companion, a lord, a bandit
     chieftain. A role is what it does, not what it is, so it can change (a chieftain who joins you). The record it reads is the
     plain data its owner keeps and saves as it always has (P, P.comps[id], a lord, a chieftain): charOf(o) gives the
     Character over it.
   In battle a soldier is a link to its Unit (u.unit) and its own state there (health, morale, stamina, place): every one is made
   by the Unit's fieldStats. ---------- */
const LV_XP=lv=>lv*60,SK_XP=lv=>(lv+1)*20,SK_MAX=10;
class Unit{
  // key: its kind's id (its look, its data); race; name
  get key(){return ''} get race(){return null} get name(){return ''}
  // its numbers: its own (base), then what makes it more than its kind (boost: a leader's)
  base(){return {}}
  boost(s){return s}
  stats(){return this.boost(this.base())}
  get tags(){return tagsOf(this.stats())}
  // its abilities (data/abilities.js): traits by what it is, actives it can cast
  traits(){return traitsOf(this.stats())}
  actives(){return []}
  abilities(){return [...this.traits(),...this.actives()]}
  get isChar(){return false}
  // its numbers on a battlefield: the ground (env), its side (team) and the enemy's strength (lv, the encounter's level), the
  // walls of a siege, your talents for your troops; a leader's boost last
  fieldStats(env,team,lv){
    let s=envStats(this.base(),this.race,env);
    if(team===1&&lv>1)s={...s,hp:Math.round(s.hp*(1+.2*(lv-1))),dmg:s.dmg*(1+.12*(lv-1))};
    if(team===0&&s.charge&&G.enc&&G.enc.kind==='siege'&&wallOf(G.enc.ref)>0)s={...s,dmg:s.dmg*.7,charge:false};// riders at the walls
    if(team===0&&this.role!=='hero'&&(tm('tHp')||tm('tDmg')))s={...s,hp:Math.round(s.hp*(1+tm('tHp'))),dmg:s.dmg*(1+tm('tDmg'))};
    return this.boost(s)}
}
class Troop extends Unit{
  constructor(k){super();this.k=k}
  get key(){return this.k} get race(){return ST[this.k].race} get name(){return ST[this.k].n}
  base(){return ST[this.k]}
  // (a troop kind's own actives, by its data: none yet)
  actives(){return (ST[this.k].actives||[]).slice()}
  card(from){return unitCard(this.k,from)}
}
const TROOPS={};
// the Troop of a kind (one for all its soldiers)
const troopOf=k=>TROOPS[k]||(TROOPS[k]=new Troop(k));

/* the roles: what differs between a hero, a companion, a lord and a chieftain. name; key: the kind it fights as (its look);
   race; base: its numbers; boost: a leader's, over its kind's; learn: how fast it learns a discipline; levelled, rose: what a
   new level and a risen discipline bring (news of it, a skill point, a perk) */
const CHAR_ROLES={
  hero:{n:'Hero',name:()=>'you',key:()=>'hero',race:()=>P.race,base:()=>heroStats(),
    learn:(c,k)=>(1+P.attr[SKILLS[k].a]*.1)*(1+(P.apt&&P.apt[k]||0)),
    levelled:(c,up)=>{P.tp=(P.tp||0)+up;log('You reach level '+P.level+'. '+(up>1?up+' skill points':'A skill point')+' to spend in Skills (K).','gold')},
    rose:(c,k,lv)=>log(SKILLS[k].n+' rises to '+lv+'.','gold')},
  // a companion: a perk to choose every third level
  companion:{n:'Companion',name:c=>COMPS[c.id].short,key:c=>c.id,race:c=>ST[c.id].race,base:c=>charStats(c),
    levelled:(c,up)=>{const o=c.o;for(let lv=o.lv-up+1;lv<=o.lv;lv++){if(lv%3===0)o.perkPend++;log(c.name+' reaches level '+lv+(lv%3===0?': a perk to choose (Hero, Party tab)':'')+'.','gold')}},
    rose:(c,k,lv)=>log(c.name+'’s '+COMP_SK[k]+' rises to '+lv+'.','gold')},
  // a lord: he fights as his realm's best kind (with his own attributes, skills and gear: charStats); news of him when he is near or serves your realm
  lord:{n:'Lord',key:c=>lordUnit(c.o),race:c=>ST[lordUnit(c.o)].race,base:c=>charStats(c),
    levelled:c=>{const l=c.o;if(Math.hypot(l.x-P.x,l.y-P.y)<vis()*1.5||l.fac===P.fac)log(l.name+' of the '+FACS[l.fac].n+' grows in skill: level '+l.lv+'.')}},
  // a bandit chieftain: a chief (with his own attributes, skills and gear); he grows only by winning battles (chiefWins)
  chieftain:{n:'Chieftain',key:()=>'chief',race:()=>null,base:c=>charStats(c),
    levelled:c=>{const o=chiefHolder(c.o);if(o&&Math.hypot(o.x-P.x,o.y-P.y)<vis()*2)log('Word spreads of '+c.o.name+': the bandit chief grows bolder (level '+c.o.lv+', bounty '+bountyOf(c.o)+' gold).')}}
};
class Character extends Unit{
  constructor(o,role,id){super();this.o=o;this.role=role;this.id=id||null}
  get R(){return CHAR_ROLES[this.role]}
  get isChar(){return true}
  get key(){return this.R.key(this)} get race(){return this.R.race(this)} get name(){return this.R.name?this.R.name(this):this.o.name}
  base(){return this.R.base(this)}
  boost(s){return this.R.boost?this.R.boost(this,s):s}
  // growth (your hero keeps hers on P as level, xp, sk)
  get lv(){return this.role==='hero'?P.level:this.o.lv} set lv(v){if(this.role==='hero')P.level=v;else this.o.lv=v}
  get xp(){return this.o.xp} set xp(v){this.o.xp=v}
  get sk(){return this.o.sk}
  skill(k){const s=this.sk[k];return (s?s.lv:0)+(this.role==='hero'?0:treeSkOf(this.o,k))}
  learn(k){return this.R.learn?this.R.learn(this,k):1}
  // experience: returns the levels it gained
  gainXp(n){if(!(n>0))return 0;if(this.role!=='hero')charKit(this);this.xp+=n;let up=0;while(this.xp>=LV_XP(this.lv)){this.xp-=LV_XP(this.lv);this.lv++;up++}
    if(up){if(this.role!=='hero'){this.o.tp+=up;if(this.aiOwned){autoTree(this);outfit(this)}}if(this.R.levelled)this.R.levelled(this,up)}return up}
  // a lord or a chieftain spends its skill points itself, by its class, and wears gear of its level; one who rides with you
  // leaves its points to you (the Skills page, from its window)
  get aiOwned(){return this.role==='lord'||this.role==='chieftain'}
  // a discipline used: it rises by its use, as fast as this character learns it
  train(k,n){const s=this.sk[k];if(!s||s.lv>=SK_MAX||!(n>0))return;s.xp+=n*this.learn(k);
    while(s.lv<SK_MAX&&s.xp>=SK_XP(s.lv)){s.xp-=SK_XP(s.lv);s.lv++;if(this.R.rose)this.R.rose(this,k,s.lv)}if(s.lv>=SK_MAX)s.xp=0}
  // the learned skills in its slots (each character's own tree and slots; yours are P's)
  actives(){if(this.role!=='hero')charKit(this);return (this.o.slots||[]).filter(id=>id&&HSKILLS[id]&&knowsOf(this.o,id))}
  card(){return charCard(this)}
  // its class: what it fights as, which sets the path its tree grows along when it chooses for itself
  get cls(){return classOf(this)}
}
/* ---------- every character's kit and its numbers (your hero's are her own: heroStats, state.js). A companion, a lord, a
   chieftain: the full skill tree as yours (its own tree, a skill point a level and two to start (for your origin's), its own skill slots;
   the tree gives its attributes), fighting skills (One-Handed, Two-Handed, Archery, rising by use), gear in seven slots
   (COMP_SLOTS) and perks. One formula for all of them: the kind it fights as (ST[key]), grown by its level (CHAR_GROW: its
   role's rate), then attributes, gear, skills, its tree and perks. Until it joins you a character grows its tree itself,
   along its class's path (autoTree); once with you, its points are yours to spend. Lords and chieftains wear gear of their level. ---------- */
const FIGHT_SK=['oneh','twoh','archery'];
// health and damage against its kind's: [at level 0, more each level] (a recruit keeps the rate it had: o.grow)
const CHAR_GROW={companion:{hp:[.9,.1],dmg:[.93,.07]},lord:{hp:[1.3,.08],dmg:[.95,.04]},chieftain:{hp:[1.3,.08],dmg:[.95,.04]}};
// its class, by what it fights as: a caster, an archer, a rider, a guardian (shield or heavy armour), else a warrior
function classOf(c){const s=ST[c.key]||{},t=tagsOf(s),o=c.o,w=o.gear&&o.gear.weapon&&ITEMS[o.gear.weapon],L=(typeof PEOPLE_LOOK!=='undefined'&&(PEOPLE_LOOK[c.key]||PEOPLE_LOOK[s.look]))||{};
  return s.magic||w&&w.kind==='magic'||!w&&L.weapon==='staff'?'caster':s.range||w&&w.kind==='ranged'||!w&&/bow|sling/.test(L.weapon||'')?'archer':s.mounted?'rider':t.includes('shield')||t.includes('heavy')||o.gear&&o.gear.offhand?'guardian':'warrior'}
// each class's path through the tree: the nodes it takes first, in order (then whatever is nearest)
const CLASS_PATHS={
  warrior:['might0','might1','might2','mighta0','might3','finessea0','finessea1','might4','mightc0','mighta1','mightb0','might5','mightc1','mightb1','finesse0','finesse1','finesse2','might6'],
  guardian:['might0','might1','might2','might3','might4','might5','mightb0','command0','command1','commanda0','mightc0','mightc1','command2','command3','mightb1','commanda1'],
  rider:['might0','might1','finesse0','finesse1','finesse2','might2','mighta0','finessea0','finesse3','finesse4','finessea1','finesse5','mighta1','might3'],
  archer:['finesse0','finesse1','finesse2','finessed0','finessed1','finessed2','finesse3','finesse4','finessec0','finessec1','finessec2','finesse5','finesseb0'],
  caster:['arcana0','arcana1','arcana2','arcanad0','arcana3','arcana4','arcanac0','arcanac1','arcanad1','arcanac2','arcanab1','arcana5','arcanad2']
};
// the kit on its record (made once, saved with it). A newcomer has grown on its own until now: its tree along its class's path
function charKit(c){
  const o=c.o;if(o.kit>=2)return o;o.attr=o.attr||{str:0,agi:0,int:0,cha:0};o.gear=o.gear||{};o.perks=o.perks||[];o.sk=o.sk||{};
  const ai=c.role==='lord'||c.role==='chieftain';
  for(const k of FIGHT_SK)if(!o.sk[k])o.sk[k]={lv:ai?Math.min(SK_MAX,Math.floor(c.lv/3)):0,xp:0};
  // (a tree for each: a point a level, and one to start; an older kit's attribute points become tree points)
  if(!o.tree){o.tree=['start'];o.tp=(o.tp||0)+c.lv+1;o.slots=Array(10).fill(null);if(o.kit===1){o.attr={str:0,agi:0,int:0,cha:0};delete o.pts;delete o.spent;delete o.build}}
  o.kit=2;if(ai)outfit(c);autoTree(c);
  return o}
// a character chooses for itself: its points along its class's path (the first it can take), else the nearest open node
function autoTree(c){const o=c.o,path=CLASS_PATHS[classOf(c)]||CLASS_PATHS.warrior;
  while(o.tp>0){const id=path.find(n=>TREE[n]&&canTakeOf(o,n))||Object.keys(TREE).find(n=>canTakeOf(o,n));if(!id||!takeNodeOf(o,id,true))break}}
// a lord's or chieftain's gear: of a tier by its level (one every three), a weapon of its people, armour and a helm (a shield for
// men and dwarves); better gear replaces worse
const OUTFIT={human:['sword','shield'],dwarf:['axe','shield'],elf:['spear'],orc:['axe']};
function outfit(c){const o=c.o,t=clamp(Math.floor(c.lv/3),0,6);if(o.gearT!=null&&o.gearT>=t&&o.gear.weapon)return;o.gearT=t;
  const [w,off]=c.role==='chieftain'?['axe']:OUTFIT[c.race]||OUTFIT.human;Object.assign(o.gear,{weapon:gearId(w,t),body:gearId('mail',t),head:gearId('helm',t)});if(off)o.gear.offhand=gearId(off,t)}
// the discipline its weapon trains: two hands, Two-Handed; else One-Handed
const meleeSkOf=o=>{const I=o.gear&&o.gear.weapon&&ITEMS[o.gear.weapon];return I&&!I.kind&&I.hand==='two'?'twoh':'oneh'};
// a character's numbers: its kind's, grown by its level, then attributes, gear, skills and perks
function charStats(c){
  const o=charKit(c),K=ST[c.key],gr=CHAR_GROW[o.grow||c.role],lv=c.lv,a=o.attr,s={...K},w=o.gear.weapon&&ITEMS[o.gear.weapon];
  const g=k=>COMP_SLOTS.reduce((t,sl)=>{const it=o.gear[sl]&&ITEMS[o.gear[sl]];return t+(it&&it.m&&it.m[k]||0)},0),pk=p=>o.perks.includes(p),t=k=>tmOf(o,k);
  s.hp=Math.round((K.hp*(gr.hp[0]+gr.hp[1]*lv)+4*a.str+g('hp')+t('hp'))*(1+t('hpPct'))*(pk('stalwart')?1.15:1));
  // (a weapon that shoots: a bow's reach, a crossbow's, a staff's: as a troop's of that kind)
  if(w){if(w.kind){s.range=Math.max(K.range||0,w.kind==='magic'?160:w.shot&&w.shot.flat?200:400);s.reach=0}else{s.range=0;s.reach=Math.max(K.reach||13,13)+(w.m.reach||0)}}
  if(!s.range)s.reach+=t('reach');
  let dmg=K.dmg*(gr.dmg[0]+gr.dmg[1]*lv)+.5*a.str+g('dmg')+t('dmg');
  if(s.range)dmg*=1+.04*c.skill('archery');else dmg+=.6*c.skill(meleeSkOf(o));
  s.dmg=+(dmg*(1+t('dmgPct'))*(pk('brute')?1.12:1)).toFixed(1);
  s.spd=Math.round((K.spd+2*a.agi)*(1+g('spd')+t('spd')+(pk('swift')?.1:0)));
  s.cd=+(K.cd*(1-.03*a.agi)*(1+t('cd'))).toFixed(3);
  s.block=Math.min(.6,g('block')+t('block')+(pk('guardian')?.1:0));
  // (taken less, and more breath and mana for its skills: charmind.js champ)
  s.dr=t('dr');s.spX=t('sp');s.mpX=t('mp');s.mpPct=t('mpPct');s.mpRegen=t('mpRegen');
  // (their weapon's type, their body armour's class; else their kind's: matchups.js)
  if(w)s.dt=itemDt(o.gear.weapon);if(o.gear.body)s.armor=itemArmor(o.gear.body);
  return s}
// the role a record plays: your hero (P), a chieftain, a lord (a realm and an army), else a companion (P.comps[id])
const charRole=o=>o===P?'hero':o.k==='chief'?'chieftain':o.fac&&Array.isArray(o.troops)?'lord':'companion';
// the Character over a record (made once and kept aside, never saved)
const CHARS=new WeakMap();
function charOf(o,id){
  if(!o)return null;let c=CHARS.get(o);if(c)return c;const role=charRole(o);if(role==='lord')lordStats(o);
  c=new Character(o,role,role==='companion'?id||Object.keys(P.comps).find(k=>P.comps[k]===o):null);CHARS.set(o,c);return c;
}
// (the older name: every leader is a character)
const leaderOf=charOf;
