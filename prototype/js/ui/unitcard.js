'use strict';
/* ---------- the unit card, as in Total War: what a troop type is before you hire or train it. Its picture and type icon, its
   numbers as bars (measured against the best of all the troops you can raise), what it can do, what it beats and what beats it,
   and what it costs. Training shows the gain over the troop it comes from. ---------- */
// vigor: how long a unit keeps its wind (fatigue.js). Heavy armour tires; mounts carry their riders; dwarves, elves and orcs are
// hardier than men, shock troops are bred for it, and every tier of training adds to it
function vigorOf(s){
  const t=tagsOf(s);let v=100;if(t.includes('heavy'))v*=.85;if(s.mounted)v*=1.15;if(t.includes('shock'))v*=1.1;
  v*={dwarf:1.15,elf:1.1,orc:1.05}[s.race]||1;v*=1+.05*((s.tier||1)-1);return Math.round(v)}
// the troops you can raise (the bars' scale)
const TROOP_TYPES=()=>Object.keys(ST).filter(k=>ST[k].race&&!ST[k].beast&&!ST[k].big);
// a unit's numbers: [key, label, value, the value shown, what it means]
function unitNumbers(s){
  const melee=!s.range,ammo=quiverOf(s),chg=s.range?0:s.charge?CHARGE.cav:CHARGE.foot;
  return [
    ['hp','Health',s.hp,s.hp,'How much it takes to fell one of them'],
    ['atk','Melee attack',meleeDmgOf(s)/s.cd,meleeDmgOf(s)+' / '+s.cd+'s',melee?'Damage of a blow, and every how many seconds it strikes':'Its sidearm, in Melee Mode: damage of a blow, and every how many seconds it strikes'],
    ['shot','Missile attack',missileDmgOf(s)/s.cd,missileDmgOf(s)?missileDmgOf(s)+' / '+s.cd+'s':'—',missileDmgOf(s)?'Damage of a shot, and every how many seconds it looses':'It does not shoot'],
    melee?['reach','Reach',s.reach,s.reach,'How far its weapon reaches']:['range','Range',s.range,s.range,'How far it shoots'],
    ...(melee?[]:[['ammo','Ammunition',ammo===Infinity?40:ammo,ammo===Infinity?'unlimited':ammo,'Shots before it runs out']]),
    ['spd','Speed',s.spd,s.spd,'How fast it moves'],
    ['vig','Vigor',vigorOf(s),vigorOf(s),'How long it keeps its wind: charging and running tire it (Stamina in battle)'],
    ['mor','Morale',unitMoraleOf(s),Math.round(unitMoraleOf(s)),'Its nerve: where its morale starts in battle and how hard losses, flanking and charges shake it; your band\u2019s morale drifts toward your troops\u2019 average'],
    ...(chg?[['chg','Charge bonus',chg*100,'+'+Math.round(chg*100)+'%','Its first blow after a run at the enemy'+(s.charge?', with a knock and a shock to their morale':'')]]:[])
  ]}
// the scale: the best of every troop type, per number
let UC_MAX=null;
function ucMax(){if(UC_MAX)return UC_MAX;UC_MAX={};for(const k of TROOP_TYPES())for(const [id,,v] of unitNumbers(ST[k]))UC_MAX[id]=Math.max(UC_MAX[id]||0,v);return UC_MAX}
// what it is (its traits, data/abilities.js): [name, what it does]
const unitAbilities=s=>traitsOf(s).map(id=>[ABILITIES[id].n,abilityText(id,s)]);
// the type icon (ui/moraleicons.js UNIT_GLYPH) as SVG
function glyphSVG(kind,size){const G=UNIT_GLYPH[kind];if(!G)return '';size=size||18;
  return '<svg class="uc-ico" viewBox="0 0 13 13" width="'+size+'" height="'+size+'" shape-rendering="crispEdges" aria-hidden="true"><rect x="0" y="0" width="13" height="13" fill="#0a0c12"/><rect x="1" y="1" width="11" height="11" fill="#3466c0"/>'+
    G.map((r,y)=>[...r].map((c,x)=>c==='g'?'<rect x="'+(x+2)+'" y="'+(y+2)+'" width="1" height="1" fill="#f4efe0"/>':'').join('')).join('')+'</svg>'}
const iconOfType=k=>ST[k]?unitIcon('',[{type:k,s:ST[k]}]):'hero';
const CLASS_N={spear:'Spear infantry',foot:'Melee infantry',ranged:'Missile infantry',magic:'Caster',cav:'Cavalry'};
const classN=s=>s.mounted&&s.range?'Missile cavalry':tagsOf(s).includes('shield')&&unitClass(s)==='foot'?'Shield infantry':CLASS_N[unitClass(s)];
// the card; from: the troop it is trained from (its numbers shown as gains and losses)
function unitCard(k,from){
  const s=ST[k];return cardHtml({key:k,s,name:s.n,sub:'Tier '+s.tier+(s.race?' · '+RACES[s.race].n:''),from:from&&ST[from],fromN:from&&ST[from]&&ST[from].n,
    abil:unitAbilities(s),foot:(HIRE[k]?'Hire '+hireCost(k)+'g · ':'')+(UP_FROM(k)?'Train '+trainCost(k)+'g · ':'')+'Upkeep '+(.5+(s.mounted?.5:0))+'g a day'})}
// a character's card (a companion, a lord, a chieftain; your hero): its own numbers, its traits and the skills it casts
function charCard(c){
  const s=c.stats(),A=c.actives().map(id=>[ABILITIES[id].n,abilityText(id,s)]);
  return cardHtml({key:c.key,hero:c.role==='hero',s,name:cap1(c.role==='hero'?(P.name||'You'):c.name),sub:'Level '+c.lv+' · '+c.roleName+(c.race?' · '+RACES[c.race].n:''),
    abil:unitAbilities(s),skills:A,foot:c.role==='companion'?'Upkeep 2g a day':''})}
// the card itself: picture, name and class, the numbers as bars (▲▼ against another's), abilities and skills, strong and weak, cost
function cardHtml(o){
  const s=o.s,M=ucMax(),F=o.from?Object.fromEntries(unitNumbers(o.from).map(r=>[r[0],r[2]])):null;
  const bars=unitNumbers(s).map(([id,lab,v,show,d])=>{const dv=F&&F[id]!=null?v-F[id]:null;
    return '<div class="uc-stat" title="'+d+'"><span class="uc-l">'+lab+'</span><span class="uc-bar"><i style="width:'+Math.round(clamp(v/(M[id]||1),.04,1)*100)+'%"></i></span><span class="uc-v">'+show+
      (dv?' <b class="'+(dv>0?'good':'bad')+'">'+(dv>0?'▲':'▼')+'</b>':'')+'</span></div>'}).join('');
  const vs=vsInfo(s),chips=(l,cls)=>l.map(([n,d])=>'<span class="uc-ab'+(cls||'')+'" title="'+d+'">'+n+'</span>').join('');
  return '<div class="ucard-x" data-unit="'+o.key+'"><div class="uc-head"><img class="uc-pic" src="'+portrait(o.key,o.hero)+'" alt=""><div class="uc-name"><strong>'+o.name+'</strong><small>'+o.sub+'</small><small>'+glyphSVG(o.hero?'hero':iconOfType(o.key),14)+' '+classN(s)+'</small><small class="uc-type" title="Its damage type, and the armour it wears">'+DMG[dtOf(s)].n+' · '+(isMagical(dtOf(s))?'magical':'physical')+' · '+ARMOR[armorOf(s)].n+' armour</small>'+(o.fromN?'<small class="uc-from">▲▼ against '+o.fromN+'</small>':'')+'</div></div>'+
    '<div class="uc-stats">'+bars+'</div>'+
    (o.abil.length?'<div class="uc-lab">Abilities</div><div class="uc-abs">'+chips(o.abil)+'</div>':'')+
    (o.skills&&o.skills.length?'<div class="uc-lab">Skills</div><div class="uc-abs">'+chips(o.skills,' sk')+'</div>':'')+
    '<div class="uc-vs"><span class="good">Strong vs</span> '+(vs.strong.join(', ')||'—')+'<br><span class="bad">Weak vs</span> '+(vs.weak.join(', ')||'—')+'</div>'+
    (o.foot?'<div class="uc-foot">'+o.foot+'</div>':'')+'</div>'}
// the troop a type is trained from (null for one you hire)
const UP_FROM=k=>Object.keys(UP).find(f=>UP[f].includes(k))||null;
