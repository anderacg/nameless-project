'use strict';
/* ---------- the unit card, as in Total War: what a troop type is before you hire or train it. Its picture and type icon, its
   numbers as bars (measured against the best of all the troops you can raise), what it can do, what it beats and what beats it,
   and what it costs. Training shows the gain over the troop it comes from. ---------- */
// vigor: how long a unit keeps its wind (fatigue.js). Heavy armour tires; mounts carry their riders; dwarves, elves and orcs are
// hardier than men, shock troops are bred for it, and every tier of training adds to it
function vigorOf(s){
  const t=tagsOf(s);let v=100;if(t.includes('heavy'))v*=.85;if(s.mounted)v*=1.15;if(t.includes('shock'))v*=1.1;
  v*={dwarf:1.15,elf:1.1,orc:1.05}[s.race]||1;v*=1+.05*((s.tier||1)-1);if(s.vigK)v*=s.vigK;return Math.round(v)}// (vigK: its rank's, troopGrowth)
// the troops you can raise (the bars' scale)
const TROOP_TYPES=()=>Object.keys(ST).filter(k=>ST[k].race&&!ST[k].beast&&!ST[k].big);
// a unit's numbers: [key, label, value, the value shown, what it means]
function unitNumbers(s){
  const melee=!s.range,ammo=quiverOf(s),chg=s.range?0:s.charge?CHARGE.cav:CHARGE.foot;
  return [
    ['hp','Health',s.hp,s.hp,'How much it takes to fell one of them'],
    ['arm','Armour',armorValue(s),armorValue(s),ARMOR[armorOf(s)].n+': of every 100 of a slash its armour stops '+armorValue(s)+', less of a thrust or a blow; magic goes through it'],
    ['mor','Morale',unitMoraleOf(s),Math.round(unitMoraleOf(s)),'Its nerve: where its morale starts in battle and how hard losses, flanking and charges shake it; your band\u2019s morale drifts toward your troops\u2019 average'],
    ['spd','Speed',s.spd,s.spd,'How fast it moves'],
    ['atk','Melee attack',meleeDmgOf(s)/s.cd,Math.round(meleeDmgOf(s))+' / '+(+s.cd.toFixed(1))+'s',melee?'Damage of a blow, and every how many seconds it strikes':'Its sidearm, in Melee Mode: damage of a blow, and every how many seconds it strikes'],
    ...(missileDmgOf(s)?[['shot','Missile attack',missileDmgOf(s)/s.cd,Math.round(missileDmgOf(s))+' / '+(+s.cd.toFixed(1))+'s','Damage of a shot, and every how many seconds it looses']]:[]),
    melee?['reach','Reach',s.reach,s.reach,'How far its weapon reaches']:['range','Range',s.range,s.range,'How far it shoots'],
    ...(melee?[]:[['ammo','Ammunition',ammo===Infinity?40:ammo,ammo===Infinity?'unlimited':ammo,'Shots before it runs out']]),
    ...(chg?[['chg','Charge bonus',chg*100,'+'+Math.round(chg*100)+'%','Its first blow after a run at the enemy'+(s.charge?', with a knock and a shock to their morale':'')]]:[]),
    ['vig','Vigor',vigorOf(s),vigorOf(s),'How long it keeps its wind: charging and running tire it (Stamina in battle)']
  ]}
// the scale: the best of every troop type, per number
let UC_MAX=null;
function ucMax(){if(UC_MAX)return UC_MAX;UC_MAX={};for(const k of TROOP_TYPES())for(const [id,,v] of unitNumbers(ST[k]))UC_MAX[id]=Math.max(UC_MAX[id]||0,v);return UC_MAX}
// what it is (its traits, data/abilities.js TRAITS: its kit's, battle/unitkit.js): [name, what it does]
const unitAbilities=s=>traitsOf(s).map(id=>[ABILITIES[id].n,abilityText(id,s)]);
/* a troop's kit on its card (doc/UNIT_KITS_DESIGN.md §8; battle/unitkit.js UnitKit; rec: its roster record, or {type}): its stances
   in their slots, its skills in theirs (their keys: data/kits.js KIT_KEYS), the perks its mastery earned; each [name, what it does].
   None with RANKS.statsOnly off (step 1's card) */
function kitChips(rec){if(!RANKS.statsOnly||!ST[rec.type])return null;const K=UnitKit.of(rec),SK=skillKeys(),SS=KITS.keys2?KIT_KEYS.now.stance:[],from={kind:'Its kind\u2019s.',mastery:'From its mastery.',tech:'From an upgrade (the tech tree).'};
  return{stances:K.slots.map((id,i)=>[(SS[i]?SS[i]+', ':'')+STANCES[id].n,STANCES[id].ch.map(c=>c.d||c.n).join(' / ')]),
    skills:K.skills.map((x,i)=>{const A=UNIT_SKILLS[x.id];return [(SK[i]?SK[i]+', ':'')+A.n+(x.idle?' (idle)':''),A.d+' '+from[x.from]+(x.idle?' Not for their kind.':'')]}),
    perks:K.perks.map(p=>['★ '+p.n,p.d+' Earned by mastery.'])}}
// the type icon (ui/moraleicons.js UNIT_GLYPH) as SVG
function glyphSVG(kind,size){const G=UNIT_GLYPH[kind];if(!G)return '';size=size||18;
  return '<svg class="uc-ico" viewBox="0 0 13 13" width="'+size+'" height="'+size+'" shape-rendering="crispEdges" aria-hidden="true"><rect x="0" y="0" width="13" height="13" fill="#0a0c12"/><rect x="1" y="1" width="11" height="11" fill="#3466c0"/>'+
    G.map((r,y)=>[...r].map((c,x)=>c==='g'?'<rect x="'+(x+2)+'" y="'+(y+2)+'" width="1" height="1" fill="#f4efe0"/>':'').join('')).join('')+'</svg>'}
const iconOfType=k=>ST[k]?unitIcon('',[{type:k,s:ST[k]}]):'hero';
const CLASS_N={spear:'Spear infantry',foot:'Melee infantry',ranged:'Missile infantry',magic:'Caster',cav:'Cavalry'};
const classN=s=>s.mounted&&s.range?'Missile cavalry':tagsOf(s).includes('shield')&&unitClass(s)==='foot'?'Shield infantry':CLASS_N[unitClass(s)];
// the card; from: the troop it is trained from (its numbers shown as gains and losses)
function unitCard(k,from){
  const s=ST[k];return cardHtml({key:k,s,name:s.n,sub:'Tier '+s.tier+(s.race?', '+raceOf(s.race).n:''),from:from&&ST[from],fromN:from&&ST[from]&&ST[from].n,
    abil:unitAbilities(s),kit:kitChips({type:k}),foot:(HIRE[k]?'Hire '+hireCost(k)+'g, ':'')+(UP_FROM(k)?'Train '+trainCost(k)+'g, ':'')+'Upkeep '+(soldierPay(k)+(s.mounted?BAND_PAY.mounted:0))+'g a day'})}
/* growth (the owner, 2026-11-01: "the unit detail should show which stat they grow from the original"): a troop group or a
   character now against its original, and what grew it, in the order a battle gives it. A troop group: its kind's own numbers (ST),
   then your talents (tHp, tDmg: as Unit.fieldStats), its rank (proficiency on damage and health, its ladder's reach and range
   and their mastery: its kit's, battle/unitkit.js UnitKit; in battle rankskills.js rankUnit) and its upgrades (world/buffs.js Buffs). A character: the one formula
   on its record stripped (its kind at its level and race; your hero's background and race bonus kept), then its disciplines,
   talents and gear given back in turn, the last its numbers now (c.stats()); then its upgrades. Each step its numbers (unitNumbers).
   statGrowth(x) → {s: its numbers now, stats: {id: {base, now, parts: [[label, n]]}}}: a part what one source added; a number
   its original has not (a bow's range on a swordsman) shows no growth */
const growNums=s=>Object.fromEntries(unitNumbers(s).map(r=>[r[0],r[2]]));
function statGrowth(x){
  const steps=x&&x.isChar?charGrowth(x):troopGrowth(x),nums=steps.map(([l,s])=>[l,growNums(s)]),base=nums[0][1],stats={};
  for(const [id,now] of Object.entries(nums[nums.length-1][1])){if(base[id]==null)continue;const parts=[];
    for(let i=1;i<nums.length;i++){const a=nums[i-1][1][id],b=nums[i][1][id];if(a!=null&&b!=null&&Math.abs(b-a)>1e-6)parts.push([nums[i][0],b-a])}
    stats[id]={base:base[id],now,parts}}
  return {s:steps[steps.length-1][1],stats}}
// (a troop group's steps: [label, numbers]; g its roster record, or its wounded's)
function troopGrowth(g){
  const k=g.type,out=[['',ST[k]]],step=(label,s)=>{if(s!==out[out.length-1][1])out.push([label,s]);return s};let s=ST[k];
  if(tm('tHp')||tm('tDmg'))s=step('Talents',{...s,hp:Math.round(s.hp*(1+tm('tHp'))),dmg:s.dmg*(1+tm('tDmg'))});
  // (its kit's: its rank's stats (§6) and its drills, its perks and their mastery, on a horse no foot drill: battle/unitkit.js; as
  // battle/rankskills.js rankUnit gives them)
  const K=UnitKit.of(g),p=K.prof,S=K.stats,dr=(g.picks||[]).filter(x=>x==='drill').length,rode=!!ST[k]?.mounted,rk='Rank '+rankOf(g)+(RANKS.statsOnly&&rankOf(g)?' ('+rankWord(rankOf(g))+')':'')+(dr?', '+dr+' drill'+(dr>1?'s':''):'');
  if(!RANKS.statsOnly){if(p>0)s=step(rk,{...s,dmg:s.dmg*(1+p),hp:Math.round(s.hp*(1+p))});
    for(const r of K.rungs(rode)){if(r.reach)s=step(r.n,{...s,reach:(s.reach||11)*(r.reach+K.up(r.id,'reach',rode))});if(r.range&&s.range)s=step(r.n,{...s,range:s.range*(r.range+K.up(r.id,'range',rode))})}}
  else{if(S.dmg>0||S.hp>0||S.mor>0||S.vig>0)s=step(rk,{...s,dmg:s.dmg*(1+S.dmg),hp:Math.round(s.hp*(1+S.hp)),morale:unitMoraleOf(s)+S.mor,vigK:(s.vigK||1)*(1+S.vig)});
    for(const r of K.rungs(rode)){const c={};if(r.reach)c.reach=(s.reach||11)*r.reach;if(r.range&&s.range)c.range=s.range*r.range;if(r.cd)c.cd=s.cd*r.cd;if(r.dmg)c.dmg=s.dmg*r.dmg;if(r.spd)c.spd=s.spd*r.spd;if(Object.keys(c).length)s=step(r.n,{...s,...c})}}
  for(const b of Buffs.list(g.id))s=step(BUFFS[b.id].n,Buffs.apply(s,[b],k));
  return out}
// (a character's steps: the same formula on a view of its record, each source given back in turn)
const GROW_SOURCES=[['Skills',['sk']],['Talents',['tree','perks']],['Gear',['gear']]];
function charGrowth(c){
  const now=c.stats(),hero=c.role==='hero',o=hero?P:c.o,rec={sk:Object.fromEntries(Object.entries(o.sk||{}).map(([k,v])=>[k,{...v,lv:0}])),tree:(o.tree||[]).filter(id=>id==='start'),perks:[],gear:{}};
  const view=r=>{if(hero)return Object.assign(Object.create(P),r).heroStats();const v=Object.create(c);v.o={...o,...r};return v.base()};
  const out=[['',view(rec)]];GROW_SOURCES.forEach(([label,keys],i)=>{for(const k of keys)rec[k]=o[k];out.push([label,i<GROW_SOURCES.length-1?view(rec):now])});
  const id=hero?'hero':c.role==='companion'?'comp_'+c.id:null;let s=now;
  if(id)for(const b of Buffs.list(id)){const n=Buffs.apply(s,[b],c.key);if(n!==s)out.push([BUFFS[b.id].n,s=n])}
  return out}
// (a part's amount as the card says it: a blow's share of the original, a charge's points, else the number)
const growPart=(id,n,base)=>(n>0?'+':'−')+(id==='atk'||id==='shot'?Math.round(Math.abs(n)/(base||1)*100)+'%':id==='chg'?Math.round(Math.abs(n))+'%':Math.round(Math.abs(n)*10)/10);
// a character's card (a companion, a lord, a chieftain; your hero): its own numbers, its traits and the skills it casts
function charCard(c){
  const g=statGrowth(c),s=g.s,A=c.actives().map(id=>[ABILITIES[id].n,abilityText(id,s)]);
  return cardHtml({key:c.key,hero:c.role==='hero',s,grow:g.stats,name:htmlText(cap1(c.role==='hero'?(P.name||'You'):c.role==='lord'?lordName(c.o):c.name)),sub:'Level '+c.lv+', '+c.roleName+(c.race?', '+RACES[c.race].n:''),
    abil:unitAbilities(s),skills:A,foot:c.role==='companion'?'Upkeep 2g a day':''})}
/* the card (the owner, 2026-10-28: as Total War: Warhammer III's): its picture, name and class, its damage type and armour; its
   strength (fit of a group's ten, hurt) and rank (training or experience to the next); its numbers as bars against the best of
   every troop type: its original and what grew it since (grow: statGrowth's stats; the gain in the grown colour, its sources in
   the tip and in a line under them), and now (now: {id: value}) beside that, a red end what lowers it, a green one what raises it
   (▲▼ against the troop it trains from); its buttons under its name; its traits and skills as chips, what it is strong and weak
   against, its upkeep.
   o: key, s, name, sub, hero, from, fromN, grow, now, strength {fit, max, hurt}, rank and meters ({label, v, max, tip}: a hero's
   stamina and mana), abil, skills, kit (a troop's: kitChips, its stances, skills in slots and earned perks), foot, footTip, acts */
class UnitCard{
  constructor(o){Object.assign(this,o)}
  static pct(v,m){return Math.round(clamp(v/(m||1),0,1)*1000)/10}
  // (a number's bar: its original (grow: statGrowth's), what grew it since in the grown colour (gr; lost: lo), then its state now
  // (now) over that, red what lowers it (striped over growth, so both show), green what raises it)
  bar([id,lab,v,show,d],M,F){if(typeof show==='number'&&!Number.isInteger(show))show=+show.toFixed(1);// (a proficiency's power makes fractions: one decimal)
    const g=this.grow&&this.grow[id],o=g?g.base:v,now=this.now&&this.now[id]!=null?this.now[id]:v,dv=F&&F[id]!=null?v-F[id]:null,p=x=>UnitCard.pct(x,M[id]),fmt=x=>id==='chg'?'+'+Math.round(x)+'%':Math.round(x);
    const own=Math.max(p(Math.min(o,v)),4),seg=(cls,a,b)=>b>a?'<i class="'+cls+'" style="left:'+a+'%;width:'+(b-a)+'%"></i>':'',grown=v>o?seg('gr',own,Math.max(p(v),own+2)):v<o?seg('lo',p(v),p(o)):'';
    const tip=d+(g&&g.parts.length?', original '+fmt(o)+': '+g.parts.map(([l,n])=>l+' '+growPart(id,n,o)).join(', '):'')+(now!==v?', now '+fmt(now)+' (its own '+fmt(v)+')':'');
    const val=now!==v?'<span class="'+(now<v?'bad':'good')+'">'+fmt(now)+'</span>'+(id==='hp'?' / '+fmt(v):''):v!==o?'<span class="gr">'+show+'</span>':show;
    return '<div class="uc-stat" data-stat="'+id+'" title="'+htmlText(tip)+'"><span class="uc-l">'+lab+'</span><span class="uc-bar"><i style="width:'+own+'%"></i>'+grown+
      (now<v?seg('dn'+(v>o?' over':''),p(now),p(v)):seg('up',p(v),p(now)))+'</span><span class="uc-v">'+val+(dv?' <b class="'+(dv>0?'good':'bad')+'">'+(dv>0?'▲':'▼')+'</b>':'')+'</span></div>'}
  // (what grew it, in a line under its numbers, a phone having no tooltips: each source once, gains first)
  growHtml(){const G=this.grow;if(!G)return '';const by=[...new Set(Object.values(G).flatMap(g=>g.parts.filter(([,n])=>n>0).map(([l])=>l)))];
    return by.length?'<p class="uc-grow"><i aria-hidden="true"></i>Grown by '+by.map(htmlText).join(', ')+'</p>':''}
  strengthHtml(){const S=this.strength;if(!S)return '';const fit=UnitCard.pct(S.fit,S.max),hurt=UnitCard.pct(S.fit+S.hurt,S.max)-fit;
    return '<div class="uc-strength" title="'+htmlText(S.tip||'Fit men of the group’s '+S.max+(S.hurt?'; '+S.hurt+' wounded, out of the fighting till they heal':''))+'"><span class="uc-bar"><i style="width:'+fit+'%"></i>'+(hurt>0?'<i class="dn" style="left:'+fit+'%;width:'+hurt+'%"></i>':'')+'</span><span>'+S.fit+' / '+S.max+(S.hurt?', '+S.hurt+' hurt':'')+'</span></div>'}
  meter(R,cls){return '<div class="uc-rank'+(cls||'')+'" title="'+htmlText(R.tip||R.label)+'"><span class="uc-l">'+htmlText(R.label)+'</span><span class="uc-bar"><i style="width:'+UnitCard.pct(R.v,R.max)+'%"></i></span><span class="uc-v">'+(R.val!=null?htmlText(R.val):R.max?Math.round(R.v)+' / '+R.max:'—')+'</span></div>'}
  rankHtml(){return (this.rank?this.meter(this.rank):'')+(this.meters||[]).map(m=>this.meter(m,' uc-meter')).join('')}
  html(){const s=this.s,M=ucMax(),F=this.from?Object.fromEntries(unitNumbers(this.from).map(r=>[r[0],r[2]])):null,vs=vsInfo(s),chips=(l,cls)=>l.map(([n,d])=>'<span class="uc-ab'+(cls||'')+'" title="'+htmlText(d)+'" tabindex="0">'+n+'</span>').join('');
    return '<div class="ucard-x" data-unit="'+this.key+'"><div class="uc-head"><img class="uc-pic" src="'+(this.pic||portrait(this.key,this.hero))+'" alt=""><canvas class="uc-pic uc-anim" width="120" height="120" hidden data-spr="'+this.key+'"'+(this.hero?' data-hero="1"':'')+'></canvas><div class="uc-name"><strong>'+this.name+'</strong><small>'+this.sub+'</small><small>'+glyphSVG(this.hero?'hero':iconOfType(this.key),14)+' '+classN(s)+', <span class="uc-type" title="Its damage type, and the armour it wears">'+DMG[dtOf(s)].n+(isMagical(dtOf(s))?' (magic)':'')+', '+ARMOR[armorOf(s)].n+'</span></small>'+(this.fromN?'<small class="uc-from">▲▼ against '+this.fromN+'</small>':'')+'<button class="btn sm uc-sprbtn" type="button" data-act="uc-sprite" data-arg="'+this.key+'" aria-pressed="false">View sprite</button></div></div>'+(this.acts?'<div class="uc-acts">'+this.acts+'</div>':'')+
      this.strengthHtml()+this.rankHtml()+'<div class="uc-stats">'+unitNumbers(s).map(r=>this.bar(r,M,F)).join('')+'</div>'+this.growHtml()+
      (this.abil.length||this.skills?.length||this.kit?'<div class="uc-abs">'+chips(this.abil)+(this.kit?chips(this.kit.stances,' st')+chips(this.kit.skills,' sk')+chips(this.kit.perks,' pk'):'')+chips(this.skills||[],' sk')+'</div>':'')+
      '<div class="uc-vs"><span class="good">✔ Strong vs</span> '+(vs.strong.join(', ')||'—')+'<br><span class="bad">✖ Weak vs</span> '+(vs.weak.join(', ')||'—')+'</div>'+
      (this.foot?'<div class="uc-foot"><span'+(this.footTip?' title="'+htmlText(this.footTip)+'"':'')+'>'+this.foot+'</span></div>':'')+'</div>'}
}
const cardHtml=o=>new UnitCard(o).html();
// the troop a type is trained from (null for one you hire)
const UP_FROM=k=>Object.keys(UP).find(f=>UP[f].includes(k))||null;
/* the card's sprite (the owner, 2026-10-29: "a button to view the unit in its sprite", still for now): its battle figure standing,
   enlarged in whole pixels in the picture's place; the same button brings the portrait back */
class SpriteView{
  // (its picture or its sprite, the button saying the other)
  static toggle(key,btn){const card=btn?.closest('.ucard-x')||document.querySelector('#panel .ucard-x[data-unit="'+key+'"]')||document.querySelector('.ucard-x[data-unit="'+key+'"]');if(!card)return;
    const img=card.querySelector('img.uc-pic'),cv=card.querySelector('canvas.uc-anim'),b=card.querySelector('.uc-sprbtn'),on=cv.hidden;
    cv.hidden=!on;img.hidden=on;if(b){b.textContent=on?'View portrait':'View sprite';b.setAttribute('aria-pressed',on)}if(on)this.draw(cv)}
  // (as large as the canvas takes the figure standing, cw × ch inside its cell; its feet on the bottom)
  static draw(cv){const type=cv.dataset.spr,hero=!!cv.dataset.hero,s=unitSprite(type,0,hero,!hero&&typeof Faces!=='undefined'&&Faces.unit(type)?Faces.vOf(type):0,0),g=cv.getContext('2d'),k=Math.max(1,Math.floor(Math.min(cv.width/(s.cw||s.width),(cv.height-4)/(s.ch||s.height))));
    g.clearRect(0,0,cv.width,cv.height);g.imageSmoothingEnabled=false;g.drawImage(s,Math.round((cv.width-s.width*k)/2),cv.height-2-s.height*k,s.width*k,s.height*k)}
}
onAct('uc-',(a,arg)=>{if(a==='uc-sprite')SpriteView.toggle(arg)});
// (a card outside the panel, the battle's own: its button works there too)
document.addEventListener('click',e=>{const b=e.target.closest('.uc-sprbtn');if(b&&!b.closest('#panel'))SpriteView.toggle(b.dataset.arg,b)});
