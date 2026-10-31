'use strict';
/* ---------- units: everyone who fights is a Unit. Two kinds:
   - a Troop: a kind of soldier (Levy, Footman, Knight...). One object per kind, shared by every soldier of it (a band on the
     map keeps only counts of its kinds: parties.js). Its numbers and abilities are fixed by its data (ST, units.js); it grows
     only by training up its troop tree.
   - a Character: one person, with a name, who grows: a level from experience (level x 60 to the next) and disciplines that rise
     by use (0 to 10, (level + 1) x 20 to the next). Its role is its class: your Hero, a Companion, a Lord, a bandit
     Chieftain. The record it reads is the plain data its owner keeps and saves as it always has (P, P.comps[id], a lord, a
     chieftain): charOf(o) gives the Character over it. A chieftain who joins you is a companion from then on, on a record of
     his own (captives.js recruitCaptive).
   In battle a soldier is a link to its Unit (u.unit) and its own state there (health, morale, stamina, place): every one is made
   by the Unit's fieldStats. ---------- */
const LV_XP=lv=>lv*60,SK_XP=lv=>(lv+1)*20,SK_MAX=10;
// every fighter's health in battle, × this (your hero's and a lord's own health come and go at it: battle/setup.js, resolution.js,
// sides.js)
const FIELD_HP=2;
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
    let s=envStats(this.base(),this.race,env);s={...s,hp:s.hp*FIELD_HP};// (the owner, 2026-10-31: "the battle seems to finish too fast": every fighter's health on the field)
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

/* ---------- a Character: one person who grows. Its role is its class, one step under Character: your Hero (below), a
   Companion (companions.js), a Lord and a Chieftain (leaders.js). Each says only what differs: the kind it fights as (key: its
   look), its race and name, its numbers (base), how fast it learns (learn), what a new level and a risen discipline bring
   (levelled, grew, rose) and whether it spends its own skill points (aiOwned). The rest is one rule for all of them. ---------- */
class Character extends Unit{
  constructor(o,id){super();this.o=o;this.id=id||null}
  get isChar(){return true}
  get role(){return ''}
  get roleName(){return ''}
  get name(){return this.o.name}
  // growth: a level and its experience, and the disciplines (sk: {k: {lv, xp}})
  get lv(){return this.o.lv} set lv(v){this.o.lv=v}
  get xp(){return this.o.xp} set xp(v){this.o.xp=v}
  get sk(){return this.o.sk}
  // a discipline as it has trained it, and with what its tree adds
  trained(k){
    const s=this.sk[k];
    return s?s.lv:0}
  skill(k){return this.trained(k)+treeSkOf(this.o,k)}
  learn(k){return 1}
  // experience: returns the levels it gained
  gainXp(n){
    if(!(n>0))return 0;
    this.kit();
    this.xp+=n;
    let up=0;
    while(this.xp>=LV_XP(this.lv)){this.xp-=LV_XP(this.lv);this.lv++;up++}
    if(up)this.levelled(up);
    return up}
  // new levels: a skill point each; one that chooses for itself spends them at once and dresses for its level; then what else
  // a level brings it (grew: news of it, a perk)
  levelled(up){
    this.o.tp+=up;
    if(this.aiOwned){this.autoTree();this.outfit()}
    this.grew(up)}
  grew(up){}
  // a lord or a chieftain spends its skill points itself, by its class, and wears gear of its level; one who rides with you
  // leaves its points to you (the Skills page, from its window)
  get aiOwned(){return false}
  // a discipline used: it rises by its use, as fast as this character learns it (rose: news of a new level)
  train(k,n){
    const s=this.sk[k];
    if(!s||s.lv>=SK_MAX||!(n>0))return;
    s.xp+=n*this.learn(k);
    while(s.lv<SK_MAX&&s.xp>=SK_XP(s.lv)){s.xp-=SK_XP(s.lv);s.lv++;this.rose(k,s.lv)}
    if(s.lv>=SK_MAX)s.xp=0}
  rose(k,lv){}
  // the learned skills in its slots (each character's own tree and slots; yours are P's)
  actives(){
    this.kit();
    return (this.o.slots||[]).filter(id=>id&&HSKILLS[id]&&knowsOf(this.o,id))}
  card(){return charCard(this)}
  /* its kit on its record (made once, saved with it): the full skill tree as yours (its own tree, a skill point a level and one
     to start, its own skill slots; the tree gives its attributes), the fighting disciplines (FIGHT_SK, rising by use), gear in
     seven slots (COMP_SLOTS) and perks. A newcomer has grown on its own until now: its tree along its class's path, and (one
     that chooses for itself) the disciplines and gear of its level */
  kit(){
    const o=this.o;if(o.kit>=2)return o;
    o.attr=o.attr||{str:0,agi:0,int:0,cha:0};o.gear=o.gear||{};o.perks=o.perks||[];o.sk=o.sk||{};
    const ai=this.aiOwned;
    for(const k of FIGHT_SK)if(!o.sk[k])o.sk[k]={lv:ai?Math.min(SK_MAX,Math.floor(this.lv/3)):0,xp:0};
    // (a tree for each: a point a level, and one to start; an older kit's attribute points become tree points)
    if(!o.tree){
      o.tree=['start'];o.tp=(o.tp||0)+this.lv+1;o.slots=Array(10).fill(null);
      if(o.kit===1){o.attr={str:0,agi:0,int:0,cha:0};delete o.pts;delete o.spent;delete o.build}}
    o.kit=2;
    if(ai)this.outfit();
    this.autoTree();
    return o}
  // its class, by what it fights as: a caster, an archer, a rider, a guardian (shield or heavy armour), else a warrior
  cls(){
    const s=ST[this.key]||{},t=tagsOf(s),o=this.o,w=o.gear&&o.gear.weapon&&ITEMS[o.gear.weapon];
    const L=(typeof PEOPLE_LOOK!=='undefined'&&(PEOPLE_LOOK[this.key]||PEOPLE_LOOK[s.look]))||{};
    if(s.magic||w&&w.kind==='magic'||!w&&L.weapon==='staff')return 'caster';
    if(s.range||w&&w.kind==='ranged'||!w&&/bow|sling/.test(L.weapon||''))return 'archer';
    if(s.mounted)return 'rider';
    return t.includes('shield')||t.includes('heavy')||o.gear&&o.gear.offhand?'guardian':'warrior'}
  // it chooses for itself: its points along its class's path (the first node it can take), else the nearest open node
  autoTree(){
    const o=this.o,path=CLASS_PATHS[this.cls()]||CLASS_PATHS.warrior;
    while(o.tp>0){
      const id=path.find(n=>TREE[n]&&canTakeOf(o,n))||Object.keys(TREE).find(n=>canTakeOf(o,n));
      if(!id||!takeNodeOf(o,id,true))break}}
  // a lord's or chieftain's gear: of a tier by its level (one every three), a weapon of its people (outfitWeapons), armour and a
  // helm; better gear replaces worse
  outfit(){
    const o=this.o,t=clamp(Math.floor(this.lv/3),0,6);
    if(o.gearT!=null&&o.gearT>=t&&o.gear.weapon)return;
    o.gearT=t;
    const [w,off]=this.outfitWeapons();
    Object.assign(o.gear,{weapon:gearId(w,t),body:gearId('mail',t),head:gearId('helm',t)});
    if(off)o.gear.offhand=gearId(off,t)}
  outfitWeapons(){return OUTFIT[this.race]||OUTFIT.human}
  // the discipline its weapon trains: two hands, Two-Handed; else One-Handed
  meleeSkill(){
    const o=this.o,I=o.gear&&o.gear.weapon&&ITEMS[o.gear.weapon];
    return I&&!I.kind&&I.hand==='two'?'twoh':'oneh'}
  // what its gear (in COMP_SLOTS), its tree and its perks give
  gearMod(k){
    const o=this.o;
    return COMP_SLOTS.reduce((t,sl)=>{const it=o.gear[sl]&&ITEMS[o.gear[sl]];return t+(it&&it.m&&it.m[k]||0)},0)}
  treeMod(k){return tmOf(this.o,k)}
  hasPerk(p){return this.o.perks.includes(p)}
  // its numbers on a battlefield, with the shots its quiver holds there (core/items.js quiverShots; none when it shoots nothing)
  fieldStats(env,team,lv){const s=super.fieldStats(env,team,lv),g=this.o.gear||{},q=quiverShots(g,g.weapon,s);return q==null?s:{...s,shots:q}}
  /* its numbers: the kind it fights as (ST[key]), grown by its level (CHAR_GROW: its role's rate, or the one a recruit kept:
     o.grow), then attributes, gear, disciplines, its tree and perks. One formula for every character but your hero */
  base(){
    const o=this.kit(),K=ST[this.key],gr=CHAR_GROW[o.grow||this.role],lv=this.lv,a=o.attr,s={...K},w=o.gear.weapon&&ITEMS[o.gear.weapon];
    const g=k=>this.gearMod(k),pk=p=>this.hasPerk(p),t=k=>this.treeMod(k);
    s.hp=Math.round((K.hp*(gr.hp[0]+gr.hp[1]*lv)+4*a.str+g('hp')+t('hp'))*(1+t('hpPct'))*(pk('stalwart')?1.15:1));
    // (a weapon that shoots: a bow's reach, a crossbow's, a staff's: as a troop's of that kind)
    if(w){
      if(w.kind){s.range=Math.max(K.range||0,w.kind==='magic'?160:w.shot&&w.shot.flat?200:400);s.reach=0}
      else{s.range=0;s.reach=Math.max(K.reach||13,13)+(w.m.reach||0)}}
    if(!s.range)s.reach+=t('reach');
    let dmg=K.dmg*(gr.dmg[0]+gr.dmg[1]*lv)+.5*a.str+g('dmg')+t('dmg');
    if(s.range)dmg*=1+.04*this.skill('archery');else dmg+=.6*this.skill(this.meleeSkill());
    s.dmg=+(dmg*(1+t('dmgPct'))*(pk('brute')?1.12:1)).toFixed(1);
    s.spd=Math.round((K.spd+2*a.agi)*(1+g('spd')+t('spd')+(pk('swift')?.1:0)));
    s.cd=+(K.cd*(1-.03*a.agi)*(1+t('cd'))).toFixed(3);
    s.block=Math.min(.6,g('block')+t('block')+(pk('guardian')?.1:0));
    // (taken less, and more breath and mana for its skills: charmind.js champ)
    s.dr=t('dr');s.spX=t('sp');s.mpX=t('mp');s.mpPct=t('mpPct');s.mpRegen=t('mpRegen');
    // (their weapon's type, their body armour's class; else their kind's: matchups.js)
    if(w)s.dt=itemDt(o.gear.weapon);
    if(o.gear.body)s.armor=itemArmor(o.gear.body);
    return s}
}
const FIGHT_SK=['oneh','twoh','archery'];
// health and damage against its kind's: [at level 0, more each level] (a recruit keeps the rate it had: o.grow)
const CHAR_GROW={companion:{hp:[.9,.1],dmg:[.93,.07]},lord:{hp:[1.3,.08],dmg:[.95,.04]},chieftain:{hp:[1.3,.08],dmg:[.95,.04]}};
// each class's path through the tree: the nodes it takes first, in order (then whatever is nearest)
const CLASS_PATHS={
  warrior:['might0','might1','might2','mighta0','might3','finessea0','finessea1','might4','mightc0','mighta1','mightb0','might5','mightc1','mightb1','finesse0','finesse1','finesse2','might6'],
  guardian:['might0','might1','might2','might3','might4','might5','mightb0','command0','command1','commanda0','mightc0','mightc1','command2','command3','mightb1','commanda1'],
  rider:['might0','might1','finesse0','finesse1','finesse2','might2','mighta0','finessea0','finesse3','finesse4','finessea1','finesse5','mighta1','might3'],
  archer:['finesse0','finesse1','finesse2','finessed0','finessed1','finessed2','finesse3','finesse4','finessec0','finessec1','finessec2','finesse5','finesseb0'],
  caster:['arcana0','arcana1','arcana2','arcanad0','arcana3','arcana4','arcanac0','arcanac1','arcanad1','arcanac2','arcanab1','arcana5','arcanad2']
};
// the weapons (and a shield) a lord wears, by his people
const OUTFIT={human:['sword','shield'],dwarf:['axe','shield'],elf:['spear'],orc:['axe']};

/* ---------- your hero: her record is P (as your band is: parties.js PlayerParty). Her numbers are her own (P.heroStats); she
   keeps her growth on P as level, xp, sk; her kit is her own (no kit to make); she learns faster by the attribute behind a
   discipline and her knacks (P.apt) ---------- */
class Hero extends Character{
  get role(){return 'hero'}
  get roleName(){return 'Hero'}
  get key(){return 'hero'}
  get race(){return P.race}
  get name(){return 'you'}
  base(){return heroStats()}
  get lv(){return P.level} set lv(v){P.level=v}
  // (as she trained it: what her companions, gear and tree add is P.skill)
  skill(k){return this.trained(k)}
  learn(k){return (1+P.attr[SKILLS[k].a]*.1)*(1+(P.apt&&P.apt[k]||0))}
  kit(){return this.o}
  levelled(up){
    P.tp=(P.tp||0)+up;
    log('You reach level '+P.level+'. '+(up>1?up+' skill points':'A skill point')+' to spend.','gold')}
  rose(k,lv){log(SKILLS[k].n+' rises to '+lv+'.','gold')}
  meleeSkill(){return meleeSk()}
  hasPerk(p){return has(p)}
}
// the role a record plays: your hero (P), a chieftain, a lord (a realm and an army), else a companion (P.comps[id])
const charRole=o=>o===P?'hero':o.k==='chief'?'chieftain':o.fac&&Array.isArray(o.troops)?'lord':'companion';
// the Character over a record (made once and kept aside, never saved)
const CHARS=new WeakMap();
function charOf(o,id){
  if(!o)return null;
  let c=CHARS.get(o);if(c)return c;
  const role=charRole(o);
  if(role==='hero')c=new Hero(o);
  else if(role==='lord'){lordStats(o);c=new Lord(o)}
  else if(role==='chieftain')c=new Chieftain(o);
  else c=new Companion(o,id||Object.keys(P.comps).find(k=>P.comps[k]===o));
  CHARS.set(o,c);return c}
// (the older names: every leader is a character; and its loose functions, now its methods)
const leaderOf=charOf;
const charStats=c=>c.stats();
const charKit=c=>c.kit();
