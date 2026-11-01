'use strict';
/* ---------- the units' skills (doc/UNIT_KITS_DESIGN.md §5; were their abilities): a group's own bursts, each with a duration and a
   cooldown on the combat clock (B.t: a pause or deployment freezes both). UNIT_SKILLS is the registry (UNIT_ABILITIES, its old name):
   n (its name), d (what it does), key (its old letter: a quiet alias with KITS.keys2 off; the skill bar's slots are by its kit:
   battle/unitkit.js), who (does one soldier qualify: a group has it when at least half of its living, steady, non-routing troops
   do (any: one of them is enough): heroes, companions, lords and beasts never count), dur and cd (combat seconds; the cooldown runs
   from the moment it is used), use (its effect, at once), snd (the cue heard from the group as it is used: audio.js) and, for the
   timed ones, holds (still on?), step (each moment while on) and end (once, as it runs out).
   A unit on a kit (RANKS.statsOnly) has the skills its kit gives (its kind's, its mastery's, its tech tree's, five at most:
   battle/unitkit.js UnitKit skills), each soldier of it able (able: a gift of its kit needs only this of him, his weapon's or
   his ammunition's; none, every one) rather than who; kit: a skill a kit alone gives (Lunge, Volley, Pike push, Counterstroke,
   Arrow storm, Parthian shot, Ward). boost: its numbers on each of its soldiers while it lasts (reach, dmg, cd multiplied:
   boostOn). ai: when an AI captain uses it (commander.js captainSkills: melee, in a fight hand to hand; shoot, a mark in reach;
   charge, a charge coming at them braced; threat, a foe who fights hand to hand near). The lasting effects are read where they
   happen: actors.js (a braced soldier stands, a spurred rider is faster and keeps his momentum), morale.js chargeMul (a charge on
   a braced soldier), moraleHurt (kitStruck: fire's fear, a volley's shock, a cleave), flankMul (kitGuard: a ward, a pavise),
   attacks.js (a fire arrow, his aim: rankskills.js rankAim), battlefog.js fogRange (a scout's sight).
   One API for you and an AI captain alike: g.useAbility(id) (BattleControl; false when refused), groupAbilities(g) (what it has,
   each with its state), abilityWhyNot(g,id) (why not now: '' when it can). A group's state: g.abil[id]={at,until,readyAt}, created
   on first use and not enumerable (never in saves or group snapshots) ---------- */
const UNIT_SKILLS={
  // (Brace flanks: step 1's, KITS.brace off; spearmen in the fight always brace against a charge on their front, morale.js
  // spearBraced: Brace adds their flanks. With KITS.brace, Brace is a stance: battlecontrol.js plant, data/kits.js STANCES)
  // push: the share of a push (its distance) that still moves him
  brace:{n:'Brace flanks',key:'G',dur:8,cd:40,snd:'brace',push:.2,who:u=>unitClass(u.s)==='spear',
    d:'Spear and pike infantry plant their spears and stand fast: they stop where they are, their Braced front covers their flanks too (a charge there gets no bonus; from behind it still hits home), and pushes barely move them. A move, attack, advance or withdraw order ends it.',
    use(g,S){g.hold();S.mv=g.mvId;const m=abilityTroops(g);if(m[0])moraleSay(m[0],'Brace!','#cfe0ff',.8)},
    holds:(g,S)=>g.order==='hold'&&!g.hasTarget&&g.mvId===S.mv&&!(g.queue&&g.queue.length),
    step(g,S,dt){damp(g,u=>this.who(u),this.push,dt)}},
  // mul: their shots' damage; col: the embers they trail and the sparks where they land. With KITS.cap (a skill from the tech tree,
  // §5): lit, slower and less true (KITS.fire: cd, aim; Hot coals, none of the aim's), and those it hits shaken (fear)
  fire:{n:'Fire arrows',key:'I',dur:12,cd:45,mul:1.1,col:'#ff9a40',who:u=>u.s.range>0&&!u.s.magic&&!u.empty&&['bow','xbow'].includes(shotKind(u)),able:u=>u.s.range>0&&!u.s.magic&&!u.empty,
    get d(){return 'Bows and crossbows loose fire arrows: fire damage (magical, so armour does not stop it; wards, dwarves and some creatures resist it, trolls, wolves and spiders fear it) and 10% more of it'+(KITS.cap?', and fear: those they hit are shaken. While lit their shots are '+Math.round((KITS.fire.cd-1)*100)+'% slower and less true.':'.')},
    use(g,S){if(KITS.cap)boostOn(g,'fire',S,{cd:KITS.fire.cd});const m=abilityTroops(g);if(m[0])moraleSay(m[0],'Fire arrows!','#ffb070',.8)},
    end(g,S){boostOff(S)}},
  // spd: their speed while it lasts; sta: the stamina it costs each rider
  spur:{n:'Spur',key:'U',dur:3,cd:35,snd:'gallop',spd:1.35,sta:12,who:u=>unitClass(u.s)==='cav',able:u=>!!u.s.mounted,
    d:'Riders spur their horses: full charge momentum at once and 35% more speed for 3 seconds, at a run, for 12 stamina each.',
    can:g=>(grpStamina(abilityTroops(g))??1)*FATIGUE.max<FATIGUE.spent?'Too tired':'',
    use(g,S){S.run=g.run;S.sig=spurSig(g);for(const u of abilityTroops(g))if(skillFits(u,'spur')){u.run=CHARGE.run;staSpend(u,this.sta)}g.setRun(true);const m=abilityTroops(g);if(m[0])moraleSay(m[0],'Spur!','#ffe08a',.8)},
    // (run out: back to the pace they had, unless an order since has set its own)
    end(g,S){if(g.run&&!S.run&&spurSig(g)===S.sig)g.setRun(false)}},
  // gain: morale at once (from 0, if they are breaking); morale: needs morale on
  rally:{n:'Rally',key:'Y',dur:0,cd:60,snd:'rally',gain:15,morale:true,who:u=>!u.s.mounted&&!u.s.charge,
    d:'Officers steady the ranks: +15 shared morale at once (at most 100), and a unit that is Breaking stops breaking. Not while routing, nor with morale off.',
    use(g){const r=g.resolve;r.mor=Math.min(100,Math.max(0,r.mor)+this.gain+rankUp(g,'rally','gain'));r.breakT=0;delete r.breakLimit;r.refreshState();r.sync();const m=abilityTroops(g);if(m[0])moraleSay(m[0],'Rally!','#9fe09a',.8)}},
  // only scout troops (data/units.js isScout, by kind; never a character, the owner 2026-10-20). sight: their sight range in the fog of war
  // (battlefog.js fogRange; nothing with the fog off); speed: theirs (abilitySpeed, with Spur's); aiEarly: the AI's captains use
  // it while some enemy is unseen in the fight's first aiEarly s, or whenever they see none (commander.js captainScout)
  scout:{n:'Scout ahead',key:'O',dur:12,cd:45,sight:1.6,speed:1.25,aiEarly:20,who:u=>isScout(u.type)&&!steady(u),
    get d(){return 'Scouts range ahead: for '+this.dur+' s they see '+Math.round((this.sight-1)*100)+'% farther through the fog of war and move '+Math.round((this.speed-1)*100)+'% faster. Only scout troops: rangers, hunters, marksmen and light riders.'},
    // (the tooltip's word on the fog: battlehud.js bhudSkills)
    note:()=>B&&B.fog?'':' Fog of war is off: only the speed applies.',
    use(g){if(B.fog&&sightOn())sightStep(true);const m=abilityTroops(g);if(m[0])moraleSay(m[0],'Scout ahead!','#bfe6ff',.8)}},
  // the bows' (KITS bow): mul, their shot time while it lasts (actors.js shotTime)
  rapid:{n:'Rapid shot',key:'N',dur:8,cd:45,mul:.7,who:u=>rankRole(u)==='bow'&&!u.empty,able:u=>u.s.range>0&&!u.empty,
    get d(){return 'Bowmen loose as fast as they can draw: for '+this.dur+' s they shoot '+Math.round((1/this.mul-1)*100)+'% faster.'},
    use(g){const m=abilityTroops(g);if(m[0])moraleSay(m[0],'Rapid shot!','#ffe08a',.8)}},
  // the dismount (battle/dismount.js; any: a group has it with one of its men who can): riders step down where they stand, their
  // horses left there, and stay on foot till told to Mount; Mount: each walks back to his own horse and up, enemies near or not
  dismount:{n:'Dismount',key:'J',dur:0,get cd(){return DISMOUNT.cd.dismount},any:true,who:u=>Dismount.rider(u)&&!u.afoot,
    d:'Riders step down where they stand and fight on foot: no charge, but their foot drills (Brace, Braced flanks) are theirs again. Their horses wait where they left them. They stay on foot until ordered to Mount.',
    use(g){g.hold();const m=abilityTroops(g);for(const u of m)if(this.who(u))Dismount.down(u,'order');else if(u.afoot)u.remount=null;/* (those on foot already stay so) */if(m[0])moraleSay(m[0],'Dismount!','#e8d8b0',.8)}},
  mount:{n:'Mount',key:'P',dur:0,get cd(){return DISMOUNT.cd.mount},any:true,who:u=>Dismount.rider(u)&&!!u.afoot&&!!u.horse&&!u.horse.dead,
    d:'The men on foot walk back to their own horses and mount, enemies near or not. Those whose horse fell stay on foot.',
    use(g){const m=abilityTroops(g);for(const u of m)if(this.who(u)){u.remount='order';u.mountT=0}if(m[0])moraleSay(m[0],'Mount up!','#e8d8b0',.8)}},
  // ---- step 2's, a kit's alone (kit)
  // Lunge (§5, the spears' default, in Brace's old place): reach and dmg multiplied while it lasts (Lunge+ on top), the enemy's front
  // within reach before each of them pushed back a step (push, combat.js knock)
  lunge:{n:'Lunge',kit:true,glyph:['....g','...g.','..g..','gg...','gg...'],dur:3,cd:40,snd:'brace',reach:1.25,dmg:1.2,push:2.5,ai:'melee',who:u=>unitClass(u.s)==='spear',able:u=>!u.s.mounted,
    get d(){return 'The front ranks thrust together: for '+this.dur+' s, '+Math.round((this.reach-1)*100)+'% more reach and '+Math.round((this.dmg-1)*100)+'% more damage, and the enemy\'s front is pushed back a step.'},
    use(g,S){boostOn(g,'lunge',S,{reach:this.reach+rankUp(g,'lunge','reach'),dmg:this.dmg+rankUp(g,'lunge','dmg')});const hit=new Set(),f=g.face||0;
      for(const u of S.men){const R=(u.s.reach||11)+6;for(const e of spatialOn()?SG.near(u.x,u.y,R+13,u.team,true):B.units)if(e.hp>0&&!hit.has(e)&&battleEnemy(u,e)&&Math.hypot(e.x-u.x,e.y-u.y)<R&&angGap(Math.atan2(e.y-u.y,e.x-u.x),f)<1.05){hit.add(e);knock(e,u.x,u.y,this.push)}}
      if(S.men[0])moraleSay(S.men[0],'Lunge!','#cfe0ff',.8)},
    end(g,S){boostOff(S)}},
  // Volley (§5, the crossbows' default): all loose at once (their reload cut to a moment's spread), and for its dur every bolt of
  // theirs that hits shakes the man it hits (shock; Volley+ more)
  volley:{n:'Volley',kit:true,glyph:['g.g.g','g.g.g','.....','g.g.g','g.g.g'],dur:2.5,cd:45,shock:6,spread:.2,ai:'shoot',who:u=>!!u.s.flat&&u.s.range>0&&!u.s.magic,able:u=>u.s.range>0&&!u.empty,
    get d(){return 'They loose together: every one at once, and for '+this.dur+' s each bolt that hits shakes the man it hits.'},
    use(g,S){S.men=abilityTroops(g).filter(u=>skillFits(u,'volley'));for(const u of S.men)u.cd=Math.min(u.cd||0,Math.random()*this.spread);if(S.men[0])moraleSay(S.men[0],'Volley!','#ffe08a',.8)}},
  // Pike push (§7, a spear's mastery): braced, a charge that hits them is thrown back (throw, × its momentum) and staggered (stun s)
  pikePush:{n:'Pike push',kit:true,glyph:['g.g.g','g.g.g','g.g.g','ggggg','..g..'],dur:8,cd:40,snd:'brace',throw:3,stun:.8,ai:'charge',who:u=>unitClass(u.s)==='spear',able:u=>!u.s.mounted,
    get d(){return 'For '+this.dur+' s, a charge that hits them braced is thrown back out of reach, its riders staggered.'},
    use(g){const m=abilityTroops(g);if(m[0])moraleSay(m[0],'Push!','#cfe0ff',.8)}},
  // Counterstroke (§7, sword and shield): all strike at once, dmg multiplied while it lasts
  counter:{n:'Counterstroke',kit:true,glyph:['g...g','.g.g.','.....','.g.g.','g...g'],dur:3,cd:40,dmg:1.25,ai:'melee',who:u=>unitClass(u.s)==='foot',
    get d(){return 'They strike back as one: every one at once, '+Math.round((this.dmg-1)*100)+'% harder for '+this.dur+' s.'},
    use(g,S){boostOn(g,'counter',S,{dmg:this.dmg});for(const u of S.men)u.cd=0;if(S.men[0])moraleSay(S.men[0],'Strike!','#ffe08a',.8)}},
  // Arrow storm (§7, bows): each bow looses one arrow at once onto its mark's ground (within r px of it; their focus, else the
  // nearest foe in reach), mul of a shot's damage
  storm:{n:'Arrow storm',kit:true,glyph:['g.g.g','.g.g.','g.g.g','.g.g.','g.g.g'],dur:0,cd:50,r:40,mul:1,ai:'shoot',who:u=>rankRole(u)==='bow',able:u=>u.s.range>0&&!u.empty&&!u.s.magic,
    get d(){return 'Every bow looses at once, the arrows falling all over their mark\'s ground (within '+this.r+' px of it).'},
    can:g=>stormMark(g)?'':'No enemy in range',
    use(g){const C=stormMark(g);for(const u of abilityTroops(g)){if(!skillFits(u,'storm'))continue;const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*this.r,x=C.x+Math.cos(a)*r,y=C.y+Math.sin(a)*r;
      Missile.fire(u,Math.atan2(y-u.y,x-u.x),u.s.dmg*(.85+Math.random()*.3)*this.mul*arrowMul(u),arrowSrc(u,u.s),Math.hypot(x-u.x,y-u.y),{sc:.1});u.atkAt=B.t;Actor.of(u).useAmmo(u.s)}
      const m=abilityTroops(g);if(m[0])moraleSay(m[0],'Loose!','#ffe08a',.8)}},
  // Parthian shot (§7, horse archers): they skirmish (back away from a foe who fights hand to hand, shooting on the move) for its
  // dur, spd faster
  parthian:{n:'Parthian shot',kit:true,glyph:['..g.g','.g.gg','ggggg','.g...','..g..'],dur:8,cd:40,spd:1.2,ai:'threat',who:u=>!!(u.s.mounted&&u.s.range),able:u=>u.s.range>0&&!u.empty,
    get d(){return 'They ride away shooting: for '+this.dur+' s they skirmish, '+Math.round((this.spd-1)*100)+'% faster.'},
    use(g,S){S.was=!!g.skirmish;if(!S.was)g.setFlag('skirmish',true);const m=abilityTroops(g);if(m[0])moraleSay(m[0],'Away!','#ffe08a',.8)},
    end(g,S){if(!S.was&&g.skirmish)g.setFlag('skirmish',false)}},
  // Ward (§7, mages): the nearest friendly group within r px (its own, if none) takes cut less damage while it lasts (kitGuard)
  ward:{n:'Ward',kit:true,glyph:['.ggg.','g...g','g.g.g','g...g','.ggg.'],dur:8,cd:45,r:200,cut:.3,ai:'melee',who:u=>!!u.s.magic,
    get d(){return 'A ward over the nearest friendly unit (within '+this.r+' px; else their own): it takes '+Math.round(this.cut*100)+'% less damage for '+this.dur+' s.'},
    use(g,S){const C=g.centre();let w=g,d=this.r;for(const o of Object.values(B.groups)){if(o===g||o.team!==g.team||!o.units.length)continue;const c=o.centre(),k=Math.hypot(c.x-C.x,c.y-C.y);if(k<d){d=k;w=o}}
      WARDED.set(w,B.t+rankDur(g,'ward'));S.to=w.id;const m=w.units[0];if(m)moraleSay(m,'Warded','#c8a8ff',.8)}}
};
const SKILL_ORDER=Object.keys(UNIT_SKILLS);
// (the old names)
const UNIT_ABILITIES=UNIT_SKILLS,UNIT_ABIL_ORDER=SKILL_ORDER;
// (a kit skill's or a post's badge on the unit cards (glyph, 5×5): given to the badges' tables (ui/moraleicons.js GLYPH), rimmed as an
// ability, a post as a flag)
for(const [id,A,kind] of [...SKILL_ORDER.map(id=>[id,UNIT_SKILLS[id],'ability']),...STANCE_ORDER.map(id=>[id,STANCES[id],'flag'])])if(A.glyph&&!GLYPH[id]){GLYPH[id]=A.glyph;BADGE_KIND[id]=kind;BADGE_RIM[id]=BADGE_CAT[kind]}
// a group's orders as Spur found them (a new order since: its pace is that order's)
const spurSig=g=>[g.order,g.targetGroupId,g.targetUnitId,g.mvId,g.queue&&g.queue.length].join();
// the troops an ability looks at: living, not routing, not a character or a beast
const abilityTroops=g=>g.units.filter(u=>!u.rout&&!steady(u));
// (one soldier fit for a skill: on a kit, able (a gift of his kit's); else he qualifies (who))
function skillFits(u,id){const A=UNIT_SKILLS[id];return RANKS.statsOnly&&!A.any&&!ladderless(u)?(A.able?A.able(u):true):A.who(u)}
// has a group a skill: on a kit, its kit gives it (battle/unitkit.js) and half its troops are fit; else half its troops qualify (any:
// one) and its rank allows it (step 1's ladders: battle/rankskills.js); a kit's alone (kit) never without one
function groupHasAbility(g,id){const A=UNIT_SKILLS[id];if(!g||!A)return false;const m=abilityTroops(g);if(!m.length)return false;
  const K=RANKS.statsOnly&&!A.any?groupKit(g):null;if(K)return K.has(id)&&m.filter(u=>skillFits(u,id)).length*2>=m.length;if(A.kit)return false;
  const n=m.filter(A.who).length;return (A.any?n>0:n*2>=m.length)&&rankAllows(g,id)}
// is it on (timed, and still holding: a braced group given another order is braced no more)
function abilityActive(g,id){const S=g&&g.abil&&g.abil[id],A=UNIT_SKILLS[id];return !!(S&&B&&B.t<S.until&&(!A.holds||A.holds(g,S)))}
// why a group cannot use it now ('' when it can)
function abilityWhyNot(g,id){
  const A=UNIT_SKILLS[id];if(!B||!A||!g)return 'Unknown ability';
  if(B.over)return 'The battle is over';if(B.deploy||B.ready||B.muster?.active)return 'Start the battle first';
  if(g.resolve?.routed)return 'Routing';if(g.order==='withdraw')return 'Withdrawing';if(id==='brace'&&B.surprise?.has({grp:g.id}))return 'Surprised: no time to brace';
  if(!groupHasAbility(g,id))return 'Not for this unit';
  if(A.morale&&(B.noMorale||!g.resolve))return 'Morale is off';
  const S=g.abil&&g.abil[id];if(S&&B.t<S.readyAt)return 'Ready in '+Math.ceil(S.readyAt-B.t-1e-9)+' s';
  return A.can?A.can(g):'';
}
// one ability's state for a group: on (and how long left), cooling down (how long), and why it cannot be used now
function abilityStatus(g,id){const A=UNIT_SKILLS[id],S=g.abil&&g.abil[id],on=abilityActive(g,id);
  return{id,n:A.n,active:on,left:on?Math.max(0,S.until-B.t):0,cooldown:S?Math.max(0,S.readyAt-B.t):0,cd:A.cd,dur:rankDur(g,id),why:abilityWhyNot(g,id)}}
// what a group has (a BattleControl or its ID), in the registry's order
function groupAbilities(g){if(typeof g==='string')g=B&&B.groups[g];return g?SKILL_ORDER.filter(id=>groupHasAbility(g,id)).map(id=>abilityStatus(g,id)):[]}
// use it: false (nothing done) when it cannot be used now
function useGroupAbility(g,id){
  if(abilityWhyNot(g,id))return false;const A=UNIT_SKILLS[id];
  if(!Object.hasOwn(g,'abil'))Object.defineProperty(g,'abil',{value:{},writable:true,configurable:true});
  const S=g.abil[id]={at:B.t,until:B.t+rankDur(g,id),readyAt:B.t+A.cd};A.use(g,S);if(A.snd&&sfxOn()){const C=g.centre();sfxAt(A.snd,C.x,C.y)}// (its sound, snd: audio.js; a group rallying from a rout has its own, morale.js)
  battleEvent('ability',{g,id});
  return true;
}
// each moment of a group (BattleControl.step): a timed ability that no longer holds ends; those on do their part; fire arrows
// still in the air trail embers, cooling as they fall behind (fire.js fireMark; their flame and smoke: fireArrows) (the order
// bar's cooldowns are redrawn on the HUD's own clock: main.js, battlehud.js bhudSkills); its stances' and perks' push resistance (postStep)
function abilityStep(g,dt){
  if(KITS.brace||RANKS.mastery5)postStep(g,dt);
  if(!g.abil)return;
  for(const id in g.abil){const S=g.abil[id],A=UNIT_SKILLS[id];if(!(B.t<S.until)){if(A.end&&!S.ended){S.ended=true;A.end(g,S)}continue}if(A.holds&&!A.holds(g,S)){S.until=B.t;continue}if(A.step)A.step(g,S,dt)}
  const F=g.abil.fire;if(F&&B.t<F.until+4)for(const a of B.arrows)if(a.src&&a.src.fireArrow&&a.by&&a.by.grp===g.id&&(a.emb=(a.emb||0)+1)%2)fireMark(vfx({k:'ember',x:a.x,y:a.y-(a.arc?4+Math.max(0,a.z):0),vx:-a.vx*.05,vy:-8,life:.22,col:UNIT_SKILLS.fire.col}));
}
// (a push on its men who fit (fit(u)) fades faster: push, the share of it that still moves them; on top of a push's own fading, .004
// a combat second: battle.js)
function damp(g,fit,push,dt){const k=Math.pow(.004,dt*(1/push-1));for(const u of g.units)if((u.kx||u.ky)&&fit(u)){u.kx*=k;u.ky*=k}}
// (a group's stances and perks against a push: braced (KITS.brace; Brace+ less still), Hold the line (its perk, data/kits.js MASTERY))
function postStep(g,dt){const m=g.units[0];if(!m)return;
  if(g.planted&&g.planted('brace'))damp(g,u=>STANCES.brace.who(u),Math.max(.04,KITS.braceAt.push*(1-rankUp(g,'brace','push'))),dt);
  else if(m&&rankSkill(m,'holdLine'))damp(g,()=>true,KITS.braceAt.push,dt)}
// Brace for an AI captain (commander.js) and the order bar alike: the stance (KITS.brace: planting or planted), else step 1's skill
const braceOn=g=>!!g&&(KITS.brace?g.posted('brace'):abilityActive(g,'brace'));
const braceCan=g=>KITS.brace?!g.resolve?.routed&&g.order!=='withdraw'&&!B.surprise?.has({grp:g.id})&&abilityTroops(g).some(u=>STANCES.brace.who(u)):!abilityWhyNot(g,'brace');
const braceUse=g=>KITS.brace?g.plant('brace',true):g.useAbility('brace');
// ---- the effects, where they happen
// a soldier under one of his group's abilities (he fits it himself, and it is on)
function unitAbility(u,id){const g=u&&u.grp&&B.groups[u.grp];return !!(g&&g.abil&&!u.rout&&abilityActive(g,id)&&skillFits(u,id))}
// (a soldier's group has a post planted (Brace, Pavise: battlecontrol.js plant) and he is one who takes it)
function unitPost(u,id){const g=u&&u.grp&&B.groups[u.grp];return !!(g&&g.posts&&!u.rout&&g.planted(id)&&STANCES[id].who(u))}
// his speed (actors.js aiUnit): spurred (Spur+ faster), scouting ahead, riding away (Parthian shot), faster; his shield wall at a
// walk (Iron wall, its perk: formations.js formPace's slowing undone)
const abilitySpeed=u=>(unitAbility(u,'spur')?UNIT_SKILLS.spur.spd+rankUp(B.groups[u.grp],'spur','spd'):1)*(unitAbility(u,'scout')?UNIT_SKILLS.scout.speed:1)*(unitAbility(u,'parthian')?UNIT_SKILLS.parthian.spd:1)*
  (RANKS.mastery5&&rankSkill(u,'ironWall')&&shieldWallActive(u)?1/WALL.spd:1);
// his sight in the fog (battlefog.js fogRange): scouting ahead, farther; Keen eyes (its perk), farther
const abilitySight=u=>(unitAbility(u,'scout')?UNIT_SKILLS.scout.sight:1)*(RANKS.mastery5?rankSkill(u,'keenEyes')?.sight||1:1);
// braced (Brace flanks, or the Brace stance) or behind a planted pavise, he stands where he is (actors.js aiUnit)
const abilityStands=u=>unitAbility(u,'brace')||KITS.brace&&(unitPost(u,'brace')||unitPost(u,'pavise'));
// spurred, he keeps his momentum while he is not chasing (actors.js aiUnit)
const abilityMomentum=u=>unitAbility(u,'spur');
// a shot (attacks.js attack): the shooter's stats as his arrow carries them, fire arrows their fire copy (made once a kind)
const FIRE_ARROW_SRC=new WeakMap();
function arrowSrc(u,s){if(!unitAbility(u,'fire'))return s;let f=FIRE_ARROW_SRC.get(s);if(!f){f={...s,dt:'fire',bolt:UNIT_SKILLS.fire.col,fireArrow:true};FIRE_ARROW_SRC.set(s,f)}return f}
const arrowMul=u=>unitAbility(u,'fire')?UNIT_SKILLS.fire.mul+rankUp(B.groups[u.grp],'fire','mul'):1;
// (his aim while lit: Fire arrows' cost (KITS.cap; Hot coals, none): rankskills.js rankAim)
const fireAim=u=>KITS.cap&&unitAbility(u,'fire')&&!rankUp(B.groups[u.grp],'fire','coals')?KITS.fire.aim:1;
/* a skill's boost (boost: reach, dmg, cd multiplied): each of its soldiers who fits it (S.men) given a boosted copy of his numbers
   while it lasts, his own kept (BOOSTED) and given back as it ends; one whose numbers were made anew since (out of ammunition, say)
   has the boost taken off them */
const BOOSTED=new WeakMap();
function boostOn(g,id,S,k){S.men=abilityTroops(g).filter(u=>skillFits(u,id));S.k=k;
  for(const u of S.men){const s=u.s,b={...s};if(k.reach)b.reach=(s.reach||11)*k.reach;if(k.dmg)b.dmg=s.dmg*k.dmg;if(k.cd)b.cd=s.cd*k.cd;BOOSTED.set(u,{s,b});u.s=b}}
function boostOff(S){if(!S.men)return;for(const u of S.men){const o=BOOSTED.get(u);if(!o)continue;BOOSTED.delete(u);if(u.s===o.b){u.s=o.s;continue}
  const s={...u.s},k=S.k;if(k.reach&&s.reach)s.reach/=k.reach;if(k.dmg)s.dmg/=k.dmg;if(k.cd)s.cd/=k.cd;u.s=s}S.men=[]}
// (Arrow storm's mark: its focus, else the nearest foe it sees within its bows' reach)
function stormMark(g){const p=g.targetPoint&&g.targetPoint();if(p)return p;const m=abilityTroops(g).filter(u=>skillFits(u,'storm'));if(!m.length)return null;const C=g.centre(),R=Math.max(...m.map(u=>u.s.range||0));
  let e=null,d=R;for(const f of B.units)if(f.hp>0&&!f.rout&&battleEnemy(g.team,f)&&seenBy(g.team,f)){const k=Math.hypot(f.x-C.x,f.y-C.y);if(k<d){d=k;e=f}}return e&&{x:e.x,y:e.y}}
// (a charge met by braced spears (morale.js chargeMul, KITS.brace): Brace+ throws more riders (DISMOUNT.brace × the momentum × its
// unhorse, the battle's own dice); under Pike push it is thrown back out of reach, staggered)
function braceCounter(u,t,m){const g=B.groups[t.grp],k=g?rankUp(g,'brace','unhorse'):0;if(k&&PHYSICS.on&&Dismount.rider(u)&&u.s.mounted&&u.hp>0&&Math.random()<DISMOUNT.brace*m*k)Dismount.down(u,'thrown');
  if(!unitAbility(t,'pikePush'))return;const A=UNIT_SKILLS.pikePush;knock(u,t.x,t.y,A.throw*Math.max(.3,m));stun(u,A.stun)}
// (a rider's charge perks (Heavy charge: shock; Heavy charge, Wedge drill in a wedge: its bonus), each a multiplier: morale.js chargeMul)
const NO_PERK={shock:1,bonus:1};
function chargePerk(u){if(!RANKS.mastery5)return NO_PERK;const h=rankSkill(u,'heavyCharge')?.heavyCharge,w=rankSkill(u,'wedgeDrill')?.wedgeDrill,g=B.groups[u.grp];if(!h&&!w)return NO_PERK;
  return{shock:h||1,bonus:(h?1+(h-1)*.4:1)*(w&&g?.form==='wedge'?w:1)}}
// a wounded man's group's guard (morale.js flankMul; src: the blow's, side: where it lands): a ward over it (Ward), and from the
// front an arrow or bolt mostly stopped by a planted pavise (KITS.pavise cover)
const WARDED=new WeakMap();
function kitGuard(t,src,side){const g=t.grp&&B.groups[t.grp];if(!g)return 1;const w=WARDED.get(g);let k=w&&B.t<w?1-UNIT_SKILLS.ward.cut:1;
  if(side==='front'&&src&&src.arrow&&KITS.brace&&unitPost(t,'pavise'))k*=KITS.pavise.cover;return k}
// what a blow does beyond its wound (morale.js moraleHurt; amt: what it took, source: who struck, missile: a shot): a fire arrow's
// fear (KITS.cap), a volley's shock, a cleave's second foe (Cleave, its perk; never a cleave of a cleave)
let CLEAVING=false;
function kitStruck(t,amt,source,missile){if(!source||!source.grp||!B.groups[source.grp])return;
  if(missile){if(KITS.cap&&unitAbility(source,'fire')&&!steady(t))shake(t,KITS.fire.fear);if(unitAbility(source,'volley')&&!steady(t))shake(t,UNIT_SKILLS.volley.shock+rankUp(B.groups[source.grp],'volley','shock'));return}
  if(CLEAVING||!RANKS.mastery5||!rankSkill(source,'cleave'))return;const o=(spatialOn()?SG.near(t.x,t.y,14,source.team,true):B.units).find(e=>e!==t&&e.hp>0&&battleEnemy(source,e)&&Math.hypot(e.x-t.x,e.y-t.y)<12);
  if(!o)return;CLEAVING=true;try{Actor.of(o).wound(amt*.5,1,dtOf(source.s),source,false)}finally{CLEAVING=false}}
