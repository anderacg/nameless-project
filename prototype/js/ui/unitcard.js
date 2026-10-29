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
  return cardHtml({key:c.key,hero:c.role==='hero',s,name:htmlText(cap1(c.role==='hero'?(P.name||'You'):c.role==='lord'?lordName(c.o):c.name)),sub:'Level '+c.lv+' · '+c.roleName+(c.race?' · '+RACES[c.race].n:''),
    abil:unitAbilities(s),skills:A,foot:c.role==='companion'?'Upkeep 2g a day':''})}
/* the card (the owner, 2026-10-28: as Total War: Warhammer III's): its picture, name and class, its damage type and armour; its
   strength (fit of a group's ten, hurt) and rank (training or experience to the next); its numbers as bars against the best of
   every troop type, now (now: {id: value}) beside its own, a red end what lowers it, a green one what raises it (▲▼ against
   the troop it trains from); its buttons under its name; its traits and skills as chips, what it is strong and weak against, its upkeep.
   o: key, s, name, sub, hero, from, fromN, now, strength {fit, max, hurt}, rank and meters ({label, v, max, tip}: a hero's stamina
   and mana), abil, skills, foot, footTip, acts */
class UnitCard{
  constructor(o){Object.assign(this,o)}
  static pct(v,m){return Math.round(clamp(v/(m||1),0,1)*1000)/10}
  bar([id,lab,v,show,d],M,F){const now=this.now&&this.now[id]!=null?this.now[id]:v,dv=F&&F[id]!=null?v-F[id]:null,a=UnitCard.pct(Math.min(v,now),M[id]),b=UnitCard.pct(Math.max(v,now),M[id]),fmt=x=>id==='chg'?'+'+Math.round(x)+'%':Math.round(x);
    const tip=d+(now!==v?' · now '+fmt(now)+' (its own '+fmt(v)+')':''),val=now!==v?'<span class="'+(now<v?'bad':'good')+'">'+fmt(now)+'</span>'+(id==='hp'?' / '+fmt(v):''):show;
    return '<div class="uc-stat" title="'+htmlText(tip)+'"><span class="uc-l">'+lab+'</span><span class="uc-bar"><i style="width:'+Math.max(a,4)+'%"></i>'+(b>a?'<i class="'+(now<v?'dn':'up')+'" style="left:'+a+'%;width:'+(b-a)+'%"></i>':'')+'</span><span class="uc-v">'+val+
      (dv?' <b class="'+(dv>0?'good':'bad')+'">'+(dv>0?'▲':'▼')+'</b>':'')+'</span></div>'}
  strengthHtml(){const S=this.strength;if(!S)return '';const fit=UnitCard.pct(S.fit,S.max),hurt=UnitCard.pct(S.fit+S.hurt,S.max)-fit;
    return '<div class="uc-strength" title="'+htmlText(S.tip||'Fit men of the group’s '+S.max+(S.hurt?'; '+S.hurt+' wounded, out of the fighting till they heal':''))+'"><span class="uc-bar"><i style="width:'+fit+'%"></i>'+(hurt>0?'<i class="dn" style="left:'+fit+'%;width:'+hurt+'%"></i>':'')+'</span><span>'+S.fit+' / '+S.max+(S.hurt?' · '+S.hurt+' hurt':'')+'</span></div>'}
  meter(R,cls){return '<div class="uc-rank'+(cls||'')+'" title="'+htmlText(R.tip||R.label)+'"><span class="uc-l">'+htmlText(R.label)+'</span><span class="uc-bar"><i style="width:'+UnitCard.pct(R.v,R.max)+'%"></i></span><span class="uc-v">'+(R.max?Math.round(R.v)+' / '+R.max:'—')+'</span></div>'}
  rankHtml(){return (this.rank?this.meter(this.rank):'')+(this.meters||[]).map(m=>this.meter(m,' uc-meter')).join('')}
  html(){const s=this.s,M=ucMax(),F=this.from?Object.fromEntries(unitNumbers(this.from).map(r=>[r[0],r[2]])):null,vs=vsInfo(s),chips=(l,cls)=>l.map(([n,d])=>'<span class="uc-ab'+(cls||'')+'" title="'+htmlText(d)+'" tabindex="0">'+n+'</span>').join('');
    return '<div class="ucard-x" data-unit="'+this.key+'"><div class="uc-head"><img class="uc-pic" src="'+(this.pic||portrait(this.key,this.hero))+'" alt=""><canvas class="uc-pic uc-anim" width="120" height="120" hidden data-spr="'+this.key+'"'+(this.hero?' data-hero="1"':'')+'></canvas><div class="uc-name"><strong>'+this.name+'</strong><small>'+this.sub+'</small><small>'+glyphSVG(this.hero?'hero':iconOfType(this.key),14)+' '+classN(s)+' · <span class="uc-type" title="Its damage type, and the armour it wears">'+DMG[dtOf(s)].n+(isMagical(dtOf(s))?' (magic)':'')+' · '+ARMOR[armorOf(s)].n+'</span></small>'+(this.fromN?'<small class="uc-from">▲▼ against '+this.fromN+'</small>':'')+'<button class="btn sm uc-sprbtn" type="button" data-act="uc-sprite" data-arg="'+this.key+'" aria-pressed="false">View sprite</button></div></div>'+(this.acts?'<div class="uc-acts">'+this.acts+'</div>':'')+
      this.strengthHtml()+this.rankHtml()+'<div class="uc-stats">'+unitNumbers(s).map(r=>this.bar(r,M,F)).join('')+'</div>'+
      (this.abil.length||this.skills?.length?'<div class="uc-abs">'+chips(this.abil)+chips(this.skills||[],' sk')+'</div>':'')+
      '<div class="uc-vs"><span class="good">✔ Strong vs</span> '+(vs.strong.join(', ')||'—')+'<br><span class="bad">✖ Weak vs</span> '+(vs.weak.join(', ')||'—')+'</div>'+
      (this.foot?'<div class="uc-foot"><span'+(this.footTip?' title="'+htmlText(this.footTip)+'"':'')+'>'+this.foot+'</span></div>':'')+'</div>'}
}
const cardHtml=o=>new UnitCard(o).html();
// the troop a type is trained from (null for one you hire)
const UP_FROM=k=>Object.keys(UP).find(f=>UP[f].includes(k))||null;
/* the card's sprite (the owner, 2026-10-29: "a button to view the unit in its sprite", animated): its battle figure enlarged in the
   picture's place, played through its poses (SPRITE_VIEW: standing and breathing, walking, running, then its blows; a beast's
   own, BEAST_POSES; your hero's bare hands, the fists'), a frame every ms; the same button brings the portrait back */
const SPRITE_VIEW={ms:140,people:[0,0,1,1,0,0,1,1,2,3,4,5,2,3,4,5,15,16,17,18,15,16,17,18,6,7,8,0,0,9,10,11,0,0,12,13,14,0,0]};
class SpriteView{
  static poses(type,hero){if(ST[type]?.beast)return [...PX.BEAST_POSES];const P0=SPRITE_VIEW.people.slice(0,24);
    return hero&&unarmed()?[...P0,...Array.from({length:12},(_,i)=>FIST_POSE+i),0,0]:SPRITE_VIEW.people}
  // (its picture or its sprite, the button saying the other)
  static toggle(key,btn){const card=btn?.closest('.ucard-x')||document.querySelector('#panel .ucard-x[data-unit="'+key+'"]')||document.querySelector('.ucard-x[data-unit="'+key+'"]');if(!card)return;
    const img=card.querySelector('img.uc-pic'),cv=card.querySelector('canvas.uc-anim'),b=card.querySelector('.uc-sprbtn'),on=cv.hidden;
    cv.hidden=!on;img.hidden=on;if(b){b.textContent=on?'View portrait':'View sprite';b.setAttribute('aria-pressed',on)}if(on)this.play(cv)}
  // (a frame every SPRITE_VIEW.ms while it is shown; drawn whole pixels, its feet on the bottom)
  // (its scale from the figure standing, cw × ch inside its cell, so every frame is as big; the cell drawn whole, its feet on the bottom)
  static play(cv){const type=cv.dataset.spr,hero=!!cv.dataset.hero,seq=this.poses(type,hero),g=cv.getContext('2d'),s0=unitSprite(type,0,hero,0,0);let i=0;clearInterval(cv.tick);
    const k=Math.max(1,Math.floor(Math.min(cv.width/(s0.cw||s0.width),(cv.height-4)/(s0.ch||s0.height))));
    const step=()=>{if(!cv.isConnected||cv.hidden){clearInterval(cv.tick);return}const s=unitSprite(type,0,hero,0,seq[i++%seq.length]);
      g.clearRect(0,0,cv.width,cv.height);g.imageSmoothingEnabled=false;g.drawImage(s,Math.round((cv.width-s.width*k)/2),cv.height-2-s.height*k,s.width*k,s.height*k)};
    step();cv.tick=setInterval(step,SPRITE_VIEW.ms)}
}
onAct('uc-',(a,arg)=>{if(a==='uc-sprite')SpriteView.toggle(arg)});
// (a card outside the panel, the battle's own: its button works there too)
document.addEventListener('click',e=>{const b=e.target.closest('.uc-sprbtn');if(b&&!b.closest('#panel'))SpriteView.toggle(b.dataset.arg,b)});
