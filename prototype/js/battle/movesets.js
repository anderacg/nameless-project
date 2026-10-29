'use strict';
/* ---------- movesets: each attacker's blows (the owner, 2026-10-22: "only a hard or charge attack can knock down"). A kind's
   moveset (Moveset.of(u), by MOVESETS.kinds, else by what he is) is up to three kinds of blow:
   normal: most swings, bites and claws. Their damage, and (physics on) at most a push: never down.
   hard: a heavy blow (a two-hander's or a mace's, a bear's maul, a troll's club slam, a big one's stomp). He winds it up first,
   standing (wind s: a ring at his feet and its name over him; a stun or a fall spoils it), then it lands, ×dmg, and (physics on)
   throws the one it hits by its kb and the two masses (his ranks and shield wall behind him), down if that beats his footing
   (a shield toward the blow, a braced spear: resist) and then its chance (down). Not again for cd s (first: s into the fight
   before the first). The AI uses it when ready on a target worth it (a shield toward him, a character, a big one, a knot of
   want foes, him among them, within his reach of him), else on anyone idle s later; a charge's blow comes first. Characters
   (your hero and champions with a heavy weapon) wind up their combo's finisher: its blows are the hard attack's.
   charge: riders and the beasts with one: a charge's impact (physics.js physImpact) throws down only at speed, its momentum
   at least charge.speed (a true run: a rider at the gallop who has only just turned on his man has none); braced spears stop it
   as ever (morale.js chargeMul). A kind's charge as a number throws that much harder (a bear's rush: a light man bowled over).
   grace: no one goes down again within this many s of getting up (physics.js physFells), nor while rolling clear.
   old: true, every blow as before (a heavy one's every blow, a rider's too, may throw down; no hard attacks, no grace): the
   switch that shows the old fingerprints come back (tests/movesets.js) ---------- */
const MOVESETS={old:false,grace:1.75,push:.5,charge:{speed:.6},
  // n: said over him as he winds up; wind, cd, first: s; dmg: × his blow; kb: × the throw (PHYSICS.hit.blow by the masses);
  // down: its chance to fell one it is hard enough for; area: px round the one hit that it strikes too (half the blow)
  hard:{
    heavy:{n:'Heavy blow',wind:.45,cd:7,first:2,dmg:1.4,kb:1.6,down:.5},
    maul:{n:'Maul',wind:.5,cd:7,first:2,dmg:1.5,kb:1.3,down:.5},
    slam:{n:'Club slam',wind:.6,cd:7,first:2,dmg:1.6,kb:1.2,down:.6},
    stomp:{n:'Stomp',wind:.7,cd:8,first:3,dmg:1.4,kb:1.1,down:.6,area:16},
    // (your hero's with bare hands: seized and thrown, combat.js HeroHands#grab; more often and more surely with the talents' grabCd, grabDown)
    grapple:{n:'Grapple',wind:.35,cd:6,first:2,dmg:1.1,kb:1.5,down:.6,grab:true}},
  // × the throw it takes to fell one with a shield toward the blow, a braced spear
  resist:{shield:1.5,brace:2},
  // whose: a kind's own (hard: its hard attack; charge: its charge may throw down, × its throw if a number); else big ones a
  // stomp, riders a charge, the melee kinds with a heavy weapon (their look's: weapons) a heavy blow, characters with a heavy
  // weapon too; the rest normal blows only
  kinds:{bear:{hard:'maul',charge:1.6},troll:{hard:'slam'},wyrm:{hard:'stomp'},dragon:{hard:'stomp'},boar:{charge:true},griffin:{charge:true},
    wolf:{},tiger:{},spider:{},scorpion:{},slime:{}},
  weapons:['great','bigaxe','hammer'],
  // the AI: a knot of want foes (the one he strikes among them) within his reach of him is worth it; idle s past ready, anyone;
  // slack: px past his reach the one he wound up at may have stepped and still be struck
  want:2,idle:3,slack:6};
/* a kind's moveset (one for each soldier's stats, kept aside: a quiver run dry changes them): its hard attack (a MOVESETS.hard
   entry) or none, and whether its charge may throw down. What it decides: a hard attack now (hardNow), a charge's fall (fells),
   the footing of the one a hard attack hits (footing). Old movesets: nothing asked of it, nothing kept */
const MOVES=new WeakMap();
class Moveset{
  constructor(M,s){this.hard=M.hard?MOVESETS.hard[M.hard]:null;if(this.hard?.grab)this.hard={...this.hard,cd:this.hard.cd*(1-P.treeMod('grabCd')),down:Math.min(.95,this.hard.down+P.treeMod('grabDown'))};this.charge=M.charge===true?1:M.charge||0;this.s=s}
  static of(u){let m=MOVES.get(u);if(!m||m.s!==u.s)MOVES.set(u,m=new Moveset(Moveset.entry(u),u.s));return m}
  static entry(u){const M=MOVESETS,s=u.s,k=M.kinds[u.type];if(k)return k;if(s.big)return{hard:'stomp'};if(s.mounted)return{charge:!!s.charge};if(s.range)return{};
    if(u.hero&&unarmed())return{hard:'grapple'};// (bare hands: combat.js FISTS)
    return(isChar(u)?Moveset.charHeavy(u):M.weapons.includes((PEOPLE_LOOK[u.type]||PEOPLE_LOOK[s.look]||{}).weapon))?{hard:'heavy'}:{}}
  // (a character's weapon heavy: your hero's a two-hander or a hammer, a champion's combo the heavy one: charmind.js comboOf)
  static charHeavy(u){return u.hero?heroKind()==='melee'&&[COMBOS.heavy,COMBOS.hammer].includes(weaponCombo()):ChampionMind.comboOf(u)===COMBOS.heavy}
  // his hard attack, if he should use it now at t: ready (its first at first, then its cooldown), not charging, t worth it
  static hardNow(u,t){return MOVESETS.old||!t||t.hp<=0?null:Moveset.of(u).ready(u,t)}
  ready(u,t){const H=this.hard;if(!H)return null;const r=u.hardAt??(u.hardAt=B.t+H.first);
    if(B.t<r||momentum(u)>=(u.s.charge?CHARGE.min:CHARGE.foot_min))return null;return B.t>=r+MOVESETS.idle||this.worth(u,t)?H:null}
  // (a shield toward him, a character, a big one, or a knot round him)
  worth(u,t){if(isChar(t)||t.s.big||shieldToward(t,u))return true;const R=(u.s.reach||11)+2;let n=0;
    for(const o of spatialOn()?SG.near(t.x,t.y,R+1,t.team,false):B.units)if(battleFriend(o,t)&&o.hp>0&&Math.hypot(o.x-t.x,o.y-t.y)<=R&&++n>=MOVESETS.want)return true;return false}
  // may his charge's impact throw down? (m: its momentum) old: always, as before
  static fells(u,m){if(MOVESETS.old)return true;return Moveset.of(u).charge>0&&m>=MOVESETS.charge.speed}
  // (his charge's throw: × a kind's own; old, 1)
  static rush(u){return MOVESETS.old?1:Moveset.of(u).charge||1}
  // t's footing against u's hard blow: × the throw it takes to fell him (a shield toward it, a braced spear)
  static footing(u,t){const R=MOVESETS.resist;return(shieldToward(t,u)?R.shield:1)*(spearBraced(t,u)?R.brace:1)}
}
// (a shield on t's front toward u: a shielded kind, a character's shield)
const shieldToward=(t,u)=>(isChar(t)?charShield(t):tagsOf(t.s).includes('shield'))&&sideOf(t,u)==='front';
