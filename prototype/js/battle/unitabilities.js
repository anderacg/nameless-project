'use strict';
/* ---------- unit abilities: a group's own special orders (Brace, Fire arrows, Spur, Rally, Scout ahead), each with a duration and a cooldown
   on the combat clock (B.t: a pause or deployment freezes both). UNIT_ABILITIES is the registry: n (its name), d (what it does),
   key (its hotkey), who (does one soldier qualify; a group has the ability when at least half of its living, steady, non-routing
   troops do: heroes, companions, lords and beasts never count), dur and cd (combat seconds; the cooldown runs from the moment
   it is used), use (its effect, at once), snd (the cue heard from the group as it is used: audio.js) and, for the timed ones,
   holds (still on?) and step (each moment while on). The lasting
   effects are read where they happen: actors.js (a braced soldier stands, a spurred rider is faster and keeps his momentum),
   morale.js chargeMul (a charge on a braced soldier's flank), attacks.js (a fire arrow), battlefog.js fogRange (a scout's sight). An end hook (end) runs once when it runs out. One API for you and an AI captain alike: g.useAbility(id) (BattleControl; false when refused),
   groupAbilities(g) (what it has, each with its state), abilityWhyNot(g,id) (why not now: '' when it can). A group's state:
   g.abil[id]={at,until,readyAt}, created on first use and not enumerable (never in saves or group snapshots) ---------- */
const UNIT_ABILITIES={
  // (spearmen in the fight always brace against a charge on their front, morale.js chargeMul: Brace adds their flanks)
  // push: the share of a push (its distance) that still moves him
  brace:{n:'Brace',key:'G',dur:8,cd:40,snd:'brace',push:.2,who:u=>unitClass(u.s)==='spear',
    d:'Spear and pike infantry plant their spears and stand fast: they stop where they are, a charge on their front or flank gets no charge bonus (spearmen always brace against one on their front; from behind it still hits home), and pushes barely move them. A move, attack, advance or withdraw order ends it.',
    use(g,S){g.hold();S.mv=g.mvId;const m=abilityTroops(g);if(m[0])moraleSay(m[0],'Brace!','#cfe0ff',.8)},
    holds:(g,S)=>g.order==='hold'&&!g.hasTarget&&g.mvId===S.mv&&!(g.queue&&g.queue.length),
    step(g,S,dt){const k=Math.pow(.004,dt*(1/this.push-1));/* (on top of a push's own fading, .004 a combat second: battle.js) */for(const u of g.units)if((u.kx||u.ky)&&this.who(u)){u.kx*=k;u.ky*=k}}},
  // mul: their shots' damage; col: the embers they trail and the sparks where they land
  fire:{n:'Fire arrows',key:'I',dur:12,cd:45,mul:1.1,col:'#ff9a40',who:u=>u.s.range>0&&!u.s.magic&&!u.empty&&['bow','xbow'].includes(shotKind(u)),
    d:'Bows and crossbows loose fire arrows: fire damage (magical, so armour does not stop it; wards, dwarves and some creatures resist it, trolls, wolves and spiders fear it) and 10% more of it.',
    use(g){const m=abilityTroops(g);if(m[0])moraleSay(m[0],'Fire arrows!','#ffb070',.8)}},
  // spd: their speed while it lasts; sta: the stamina it costs each rider
  spur:{n:'Spur',key:'U',dur:3,cd:35,snd:'gallop',spd:1.35,sta:12,who:u=>unitClass(u.s)==='cav',
    d:'Riders spur their horses: full charge momentum at once and 35% more speed for 3 seconds, at a run, for 12 stamina each.',
    can:g=>(grpStamina(abilityTroops(g))??1)*FATIGUE.max<FATIGUE.spent?'Too tired':'',
    use(g,S){S.run=g.run;S.sig=spurSig(g);for(const u of abilityTroops(g))if(this.who(u)){u.run=CHARGE.run;staSpend(u,this.sta)}g.setRun(true);const m=abilityTroops(g);if(m[0])moraleSay(m[0],'Spur!','#ffe08a',.8)},
    // (run out: back to the pace they had, unless an order since has set its own)
    end(g,S){if(g.run&&!S.run&&spurSig(g)===S.sig)g.setRun(false)}},
  // gain: morale at once (from 0, if they are breaking); morale: needs morale on
  rally:{n:'Rally',key:'Y',dur:0,cd:60,snd:'rally',gain:15,morale:true,who:u=>!u.s.mounted&&!u.s.charge,
    d:'Officers steady the ranks: +15 shared morale at once (at most 100), and a unit that is Breaking stops breaking. Not while routing, nor with morale off.',
    use(g){const r=g.resolve;r.mor=Math.min(100,Math.max(0,r.mor)+this.gain);r.breakT=0;delete r.breakLimit;r.refreshState();r.sync();const m=abilityTroops(g);if(m[0])moraleSay(m[0],'Rally!','#9fe09a',.8)}},
  // only scout troops (data/units.js isScout, by kind; never a character, the owner 2026-10-20). sight: their sight range in the fog of war
  // (battlefog.js fogRange; nothing with the fog off); speed: theirs (abilitySpeed, with Spur's); aiEarly: the AI's captains use
  // it while some enemy is unseen in the fight's first aiEarly s, or whenever they see none (commander.js captainScout)
  scout:{n:'Scout ahead',key:'O',dur:12,cd:45,sight:1.6,speed:1.25,aiEarly:20,who:u=>isScout(u.type)&&!steady(u),
    get d(){return 'Scouts range ahead: for '+this.dur+' s they see '+Math.round((this.sight-1)*100)+'% farther through the fog of war and move '+Math.round((this.speed-1)*100)+'% faster. Only scout troops: rangers, hunters, marksmen and light riders.'},
    // (the tooltip's word on the fog: battlehud.js bhudAbilities)
    note:()=>B&&B.fog?'':' Fog of war is off: only the speed applies.',
    use(g){if(B.fog&&sightOn())sightStep(true);const m=abilityTroops(g);if(m[0])moraleSay(m[0],'Scout ahead!','#bfe6ff',.8)}}
};
const UNIT_ABIL_ORDER=Object.keys(UNIT_ABILITIES);
// a group's orders as Spur found them (a new order since: its pace is that order's)
const spurSig=g=>[g.order,g.targetGroupId,g.targetUnitId,g.mvId,g.queue&&g.queue.length].join();
// the troops an ability looks at: living, not routing, not a character or a beast
const abilityTroops=g=>g.units.filter(u=>!u.rout&&!steady(u));
function groupHasAbility(g,id){const A=UNIT_ABILITIES[id];if(!g||!A)return false;const m=abilityTroops(g);return m.length>0&&m.filter(A.who).length*2>=m.length}
// is it on (timed, and still holding: a braced group given another order is braced no more)
function abilityActive(g,id){const S=g&&g.abil&&g.abil[id],A=UNIT_ABILITIES[id];return !!(S&&B&&B.t<S.until&&(!A.holds||A.holds(g,S)))}
// why a group cannot use it now ('' when it can)
function abilityWhyNot(g,id){
  const A=UNIT_ABILITIES[id];if(!B||!A||!g)return 'Unknown ability';
  if(B.over)return 'The battle is over';if(B.deploy||B.ready||B.muster?.active)return 'Start the battle first';
  if(g.resolve?.routed)return 'Routing';if(g.order==='withdraw')return 'Withdrawing';if(id==='brace'&&B.surprise?.has({grp:g.id}))return 'Surprised: no time to brace';
  if(!groupHasAbility(g,id))return 'Not for this unit';
  if(A.morale&&(B.noMorale||!g.resolve))return 'Morale is off';
  const S=g.abil&&g.abil[id];if(S&&B.t<S.readyAt)return 'Ready in '+Math.ceil(S.readyAt-B.t-1e-9)+' s';
  return A.can?A.can(g):'';
}
// one ability's state for a group: on (and how long left), cooling down (how long), and why it cannot be used now
function abilityStatus(g,id){const A=UNIT_ABILITIES[id],S=g.abil&&g.abil[id],on=abilityActive(g,id);
  return{id,n:A.n,active:on,left:on?Math.max(0,S.until-B.t):0,cooldown:S?Math.max(0,S.readyAt-B.t):0,cd:A.cd,dur:A.dur,why:abilityWhyNot(g,id)}}
// what a group has (a BattleControl or its ID), in the registry's order
function groupAbilities(g){if(typeof g==='string')g=B&&B.groups[g];return g?UNIT_ABIL_ORDER.filter(id=>groupHasAbility(g,id)).map(id=>abilityStatus(g,id)):[]}
// use it: false (nothing done) when it cannot be used now
function useGroupAbility(g,id){
  if(abilityWhyNot(g,id))return false;const A=UNIT_ABILITIES[id];
  if(!Object.hasOwn(g,'abil'))Object.defineProperty(g,'abil',{value:{},writable:true,configurable:true});
  const S=g.abil[id]={at:B.t,until:B.t+A.dur,readyAt:B.t+A.cd};A.use(g,S);if(A.snd&&sfxOn()){const C=g.centre();sfxAt(A.snd,C.x,C.y)}// (its sound, snd: audio.js; a group rallying from a rout has its own, morale.js)
  battleEvent('ability',{g,id});
  return true;
}
// each moment of a group (BattleControl.step): a timed ability that no longer holds ends; those on do their part; fire arrows
// still in the air trail embers (the order bar's cooldowns are redrawn on the HUD's own clock: main.js, battlehud.js bhudAbilities)
function abilityStep(g,dt){
  if(!g.abil)return;
  for(const id in g.abil){const S=g.abil[id],A=UNIT_ABILITIES[id];if(!(B.t<S.until)){if(A.end&&!S.ended){S.ended=true;A.end(g,S)}continue}if(A.holds&&!A.holds(g,S)){S.until=B.t;continue}if(A.step)A.step(g,S,dt)}
  const F=g.abil.fire;if(F&&B.t<F.until+4)for(const a of B.arrows)if(a.src&&a.src.fireArrow&&a.by&&a.by.grp===g.id&&(a.emb=(a.emb||0)+1)%2)vfx({k:'ember',x:a.x,y:a.y-(a.arc?4+Math.max(0,a.z):0),vx:-a.vx*.05,vy:-8,life:.22,col:UNIT_ABILITIES.fire.col});
}
// ---- the effects, where they happen
// a soldier under one of his group's abilities (he qualifies himself, and it is on)
function unitAbility(u,id){const g=u&&u.grp&&B.groups[u.grp];return !!(g&&g.abil&&!u.rout&&abilityActive(g,id)&&UNIT_ABILITIES[id].who(u))}
// his speed (actors.js aiUnit): spurred, faster; scouting ahead, faster (both: both)
const abilitySpeed=u=>(unitAbility(u,'spur')?UNIT_ABILITIES.spur.spd:1)*(unitAbility(u,'scout')?UNIT_ABILITIES.scout.speed:1);
// his sight in the fog (battlefog.js fogRange): scouting ahead, farther
const abilitySight=u=>unitAbility(u,'scout')?UNIT_ABILITIES.scout.sight:1;
// braced, he stands where he is (actors.js aiUnit)
const abilityStands=u=>unitAbility(u,'brace');
// spurred, he keeps his momentum while he is not chasing (actors.js aiUnit)
const abilityMomentum=u=>unitAbility(u,'spur');
// a shot (attacks.js attack): the shooter's stats as his arrow carries them, fire arrows their fire copy (made once a kind)
const FIRE_ARROW_SRC=new WeakMap();
function arrowSrc(u,s){if(!unitAbility(u,'fire'))return s;let f=FIRE_ARROW_SRC.get(s);if(!f){f={...s,dt:'fire',bolt:UNIT_ABILITIES.fire.col,fireArrow:true};FIRE_ARROW_SRC.set(s,f)}return f}
const arrowMul=u=>unitAbility(u,'fire')?UNIT_ABILITIES.fire.mul:1;
