'use strict';
/* ---------- a unit's kit, its terms (doc/UNIT_KITS_DESIGN.md §1): one name for each kind of thing, each its one table. ORDERS: where
   to go and what to do (yours, an order each); STANCES: a mode a group stays in till changed (a row of the order bar each, a kind's
   own on the stance slots); FORMS: its shape (battle/formations.js); TRAITS: built into its kind, always on (data/abilities.js);
   UNIT_SKILLS (the design's Skills: SKILLS is your hero's disciplines, data/progression.js): a burst with a cooldown, in the skill
   bar's slots (battle/unitabilities.js); KITS: each kind's default skills and its mastery menu (MASTERY, the picks); KIT_KEYS: the keys;
   COMMANDS: your hero's (battle/commandpowers.js). A unit's own loadout from them: battle/unitkit.js UnitKit ---------- */
// the orders: n, d (the order bar's words); mouse: given with the mouse, with its modifiers (mods); their keys: KIT_KEYS. Advance is a
// Move now (Walk, the Pace stance's). Charge (G, step 2): a true order, at a run into the enemy (commands.js chargeOrder)
const ORDERS={
  move:{n:'Move',mouse:'Right-click the ground',mods:'Shift: a waypoint · a drag: a line · Shift+K: keep formation',d:'Go there in formation'},
  attack:{n:'Attack',mouse:'Right-click an enemy',mods:'Ctrl or D: an attack-move, fighting what it meets on the way',d:'Set on that enemy',
    // (the attack-move, its modifier, has its own button: commands.js armAttackMove)
    amove:{n:'Attack-move',d:'Attack-move: their next order on the ground (a right-click, a line, a tap) marches there, fighting any enemy met on the way, then on to the place; Ctrl + right-click too; Esc: off'}},
  charge:{n:'Charge',d:'Charge: at a run, into the enemy: each man at the foe nearest him'},
  run:{n:'Run',d:'Run: they move at a run; a run at an enemy is a charge'},
  hold:{n:'Hold',d:'Hold: stop and stand in formation where they are'},
  withdraw:{n:'Withdraw',d:'Withdraw: flee the battle off your edge of the field, striking no one; once everyone has withdrawn, the battle ends as your retreat'}};
/* the stances: a row of the order bar each, for the groups with a soldier who can (who). Its choices (ch): a group flag each
   (battle.js GRP_FLAGS; flag: on, its words; say: what is said of it on and off: commands.js toggleFlag), or an order (order: the
   Pace's two, commands.js setOrder), or a post (post: planted where they stand till a move, battlecontrol.js plant: Brace,
   Pavise), or a skill (skill: Mounted's, battle/dismount.js, with its cooldowns). A toggle has one choice; a cycle (cycle) more,
   one at a time, none its first (Fire at will). all: everyone's (Pace, Discipline, on their own keys); the rest a kind's own, on
   its stance slots (KITS.slots' order, three at most: Q W E) */
const STANCES={
  pace:{n:'Pace',all:true,flag:'walk',who:()=>true,ch:[{order:'charge',n:'Run'},{order:'advance',n:'Walk',d:'Walk: they move at a walk, keeping their formation'}],
    say:{walk:['walk','run']}},
  discipline:{n:'Discipline',all:true,who:()=>true,ch:[{flag:'firm',n:'Hold ground',d:'Hold their ground: strike only what comes into reach; off, they fight freely'}],
    say:{firm:['hold their ground','fight freely']}},
  shooting:{n:'Shooting',cycle:true,none:'Fire at will',who:u=>flagEligible(u,'cease'),
    ch:[{flag:'cease',n:'Hold fire',d:'Hold fire: your shooters hold their shots, loosing only at an enemy you set them on'},
      {flag:'skirmish',n:'Skirmish',d:'Skirmish: your shooters keep their distance: when a foe who fights hand to hand comes inside 60% of their range they back away, facing him, till he is at 85% of it, then shoot again'},
      {flag:'melee',n:'Melee',d:'Melee: your shooters put their bows away and fight hand to hand as fighters do, with their (low) melee damage'}],
    say:{cease:['cease fire','fire at will'],skirmish:['skirmish','stand'],melee:['melee mode on: they fight whoever reaches them','melee mode off: they keep shooting, point blank']}},
  // (step 2, KITS.brace: Brace with no timer (the owner, 2026-11-01); the spears' front braced only so: morale.js spearBraced)
  brace:{n:'Brace',who:u=>KITS.brace&&unitClass(u.s)==='spear'&&!u.s.mounted,ch:[{post:'brace',n:'Braced',d:'Brace: spears planted where they stand: a charge on their front or flanks gets no bonus and no shock, chargers may be unhorsed, pushes barely move them. They cannot move: any move order ends it. No timer, no cooldown'}],
    say:{brace:['brace','stand easy']}},
  shieldWall:{n:'Shield wall',who:u=>shieldEligible(u),ch:[{flag:'shieldWall',n:'Shields',d:'Shield wall: eligible shield infantry only; nearby supporting shields required for protection'}],
    say:{shieldWall:['shield wall requested for eligible soldiers','shields lowered']}},
  pavise:{n:'Pavise',glyph:['ggggg','g...g','g...g','ggggg','.g.g.'],who:u=>KITS.brace&&!u.s.mounted&&!u.s.magic&&!!u.s.flat,ch:[{post:'pavise',n:'Planted',d:'Pavise: their big shields planted before them: arrows and bolts from the front mostly stopped while they reload. They cannot move: any move order ends it'}],
    say:{pavise:['plant the pavises','take up the pavises']}},
  mounted:{n:'Mounted',who:u=>Dismount.rider(u),ch:[{skill:'dismount',n:'On foot'},{skill:'mount',n:'Mounted'}]}};
const STANCE_ORDER=Object.keys(STANCES);
// (the skills a stance is made of: never in a skill slot)
const STANCE_SKILLS=new Set(STANCE_ORDER.flatMap(id=>STANCES[id].ch.map(c=>c.skill).filter(Boolean)));
/* the keys (§7b, the owner's layout, KITS.keys2; was: step 1's): the orders, the Pace and Discipline stances, the formation cycle,
   the AI, your hero's commands (rally, stand: battle/commandpowers.js); stance, a kind's own stances' slots; skill, the skill
   slots; ring, each kind its own ring (a circle for foot, a Cantabrian circle for horse archers: commands.js ringForm, the owner,
   2026-11-01; O, a ring's shape, free in both layouts). Withdraw on Backspace (never by accident); M and S free. A key's face on
   its button: face */
const KIT_KEYS={
  now:{hold:'H',charge:'G',amove:'D',pace:'R',discipline:'F',form:'T',withdraw:'Backspace',ai:'A',rally:'Y',stand:'U',ring:'O',stance:['Q','W','E'],skill:['Z','X','C','V','B']},
  was:{hold:'H',charge:'V',amove:'D',pace:'Q',discipline:'F',shooting:'M',shieldWall:'B',mounted:'J',loose:'L',wedge:'T',withdraw:'W',ai:'A',rally:'R',stand:'S',ring:'O',stance:[],skill:['Z','X','C']},
  face:{Backspace:'⌫'}};
const keysNow=()=>KITS.keys2?KIT_KEYS.now:KIT_KEYS.was;
// (a key by its job; its face on a button; the skill slots' keys)
const kitKey=id=>keysNow()[id]||'';
const keyFace=k=>KIT_KEYS.face[k]||k;
const skillKeys=()=>keysNow().skill;
// (the old name: the skill slots' keys)
const SKILL_KEYS=KIT_KEYS.was.skill;
/* the mastery picks (§7): each a menu's option, by its id: n, d (its effect in words, the pick window's); one of
     sk: a skill unlocked (battle/unitabilities.js UNIT_SKILLS);
     up: a stance or skill improved (by: its numbers each step, added: a skill's dur in s, a multiplier's share (dmg, reach, spd),
       Rally's gain, Volley's shock, Brace's push (less of a push still moves them) and unhorse (more riders thrown));
     perk: a passive (its numbers multiplied on the soldier: reach, range, aim (his aim's error), cd (his swing or shot time), dmg,
       spd, sight; a flag read where it acts: hedge, ironWall, holdLine, cleave, heavyCharge, wedgeDrill, rideDown, ap (armour
       stops this share of what it stopped: data/matchups.js typeMul));
     drill: RANKS.drill.
   again: can be taken again, a step each time; foot: not on a horse. kn: its name in a kind's menu */
const MASTERY={
  // spear
  lungeUp:{n:'Lunge+',up:'lunge',by:{dur:1,dmg:.05,reach:.05},again:true,d:'Lunge lasts 1 s longer and hits 5% harder, 5% further.'},
  quickBrace:{n:'Quick brace',up:'brace',by:{set:1},foot:true,d:'They brace at once, even from a move: no moment to plant the spears.'},
  hedge:{n:'Hedge of spears',perk:true,hedge:true,foot:true,d:'Their front braced even unordered: a charge on their front gets no bonus while they are in the fight.'},
  longReach:{n:'Long reach',perk:true,reach:1.1,d:'+10% reach.'},
  pikePush:{n:'Pike push',sk:'pikePush',d:'A skill: braced, they throw back a charge that hits them, the riders hurled out of reach and staggered.'},
  braceUp:{n:'Brace+',up:'brace',by:{push:.2,unhorse:.25},again:true,foot:true,d:'Braced, pushes move them 20% less and 25% more riders are unhorsed.'},
  rallyUp:{n:'Rally+',up:'rally',by:{gain:5},again:true,d:'Rally gives 5 more morale.'},
  // sword and shield
  ironWall:{n:'Iron wall',perk:true,ironWall:true,d:'Their shield wall moves at a walking pace, not slowed.'},
  counterstroke:{n:'Counterstroke',sk:'counter',d:'A skill: they strike back as one, at once and 25% harder for 3 s.'},
  holdLine:{n:'Hold the line',perk:true,holdLine:true,d:'Pushes barely move them, braced or not.'},
  cleave:{n:'Cleave',perk:true,cleave:true,d:'Their blows hit a second foe beside the first, for half.'},
  // bow, crossbow, scouts, horse archers
  steadyAim:{n:'Steady aim',perk:true,aim:.9,d:'Their shots 10% truer.'},
  marksmen:{n:'Marksmen',perk:true,range:1.1,d:'+10% range, on top of their bows\' own.'},
  hotCoals:{n:'Hot coals',up:'fire',by:{coals:1},d:'Fire arrows without the aim cost: lit, their shots as true as ever.'},
  arrowStorm:{n:'Arrow storm',sk:'storm',d:'A skill: every bow looses at once, arrows falling all over their mark\'s ground.'},
  rapidUp:{n:'Rapid shot+',up:'rapid',by:{dur:2},again:true,d:'Rapid shot lasts 2 s longer.'},
  heavyBolt:{n:'Heavy bolt',perk:true,ap:.7,d:'Armour stops 30% less of their bolts than before.'},
  quickReload:{n:'Quick reload',perk:true,cd:.85,d:'They reload 15% faster.'},
  fireSkill:{n:'Fire arrows',sk:'fire',kn:{xbow:'Fire bolts'},d:'A skill: Fire arrows (bolts), lit for 12 s.'},
  volleyUp:{n:'Volley+',up:'volley',by:{shock:4},again:true,d:'Their volley shakes those it hits 4 more.'},
  // cavalry, horse archers
  heavyCharge:{n:'Heavy charge',perk:true,heavyCharge:1.25,d:'Their charge shakes those it hits 25% more and hits 10% harder.'},
  wedgeDrill:{n:'Wedge drill',perk:true,wedgeDrill:1.15,d:'In a wedge, their charge bonus 15% more.'},
  rideDown:{n:'Ride down',perk:true,rideDown:1.3,d:'+30% damage against routers.'},
  outriders:{n:'Outriders',perk:true,spd:1.08,d:'8% faster.'},
  spurUp:{n:'Spur+',up:'spur',by:{dur:1,spd:.05},again:true,d:'Spur lasts 1 s longer, 5% faster.'},
  rallySkill:{n:'Rally',sk:'rally',d:'A skill: Rally, +15 morale at once.'},
  parthian:{n:'Parthian shot',sk:'parthian',d:'A skill: they ride away shooting, 20% faster, skirmishing for 8 s.'},
  rapidSkill:{n:'Rapid shot',sk:'rapid',d:'A skill: Rapid shot, 30% faster shots for 8 s.'},
  // mage
  strongerSpell:{n:'Stronger spell',perk:true,dmg:1.15,d:'Their bolts hit 15% harder.'},
  ward:{n:'Ward',sk:'ward',d:'A skill: shield the nearest friendly unit, which takes 30% less damage for 8 s.'},
  deepMana:{n:'Deep mana',perk:true,range:1.1,aim:.9,d:'+10% range, their bolts 10% truer.'},
  quickCast:{n:'Quick cast',perk:true,cd:.85,d:'They cast 15% faster.'},
  // scouts
  keenEyes:{n:'Keen eyes',perk:true,sight:1.25,d:'They see 25% farther through the fog of war.'},
  scoutUp:{n:'Scout ahead+',up:'scout',by:{dur:3},again:true,d:'Scout ahead lasts 3 s longer.'},
  drill:{n:'Drill',drill:true,again:true,d:'+1% damage, health and aim.'}};
/* each kind's kit (§3-§5, §7, §8): n; skills, its default skills (Lunge, in Brace's old place: Brace flanks with KITS.brace off);
   menu, its mastery options (MASTERY); ai, the order an AI unit picks them in (§9). A unit's kinds (battle/unitkit.js kitKinds):
   by class, shot and tags, a scout's its kind's and scout's.
   Step 2's switches here (§10.2, each its own for the fingerprint proofs): brace, Brace and Pavise as stances, Lunge (off: the
   always braced front and the timed Brace flanks); traits2, Anti-cavalry and Anti-large (off: the one spear rule, ×1.6 against
   riders or big); cap, the cap of max skills, skills bought from the tech tree (data/buffs.js skill) and Fire arrows as that skill
   (lit: slower, less true, fear: fire; an AI lord's archers have it from level aiFire, bands never); keys2, the keys (KIT_KEYS.now)
   and the order bar's slots. braceAt: Brace's numbers (set, s to plant the spears, Quick brace none; push, the share of a push
   that still moves them, Brace+ less: MASTERY braceUp); pavise (set; cover, the share of a shot from the front that still
   hits). slots: the kind's own stances, in their slot order. ladders: step 1's (RANKS.statsOnly off) */
const KITS={
  brace:true,traits2:true,cap:true,keys2:true,
  max:5,aiFire:6,
  braceAt:{set:1.2,push:.2},pavise:{set:1,cover:.25},
  slots:['brace','shieldWall','shooting','pavise','mounted'],
  // fire: Fire arrows' costs while lit (cd, their shot time; aim, their aim's error) and its fear (shake, on whom it hits)
  fire:{cd:1.15,aim:1.25,fear:3},
  kinds:{
    spear:{n:'Spear',skills:['lunge','rally'],menu:['lungeUp','quickBrace','hedge','longReach','pikePush','braceUp','rallyUp','drill'],ai:['braceUp','longReach','hedge','lungeUp','pikePush']},
    foot:{n:'Sword and shield',skills:['rally'],menu:['ironWall','counterstroke','holdLine','cleave','rallyUp','drill'],ai:['holdLine','counterstroke','cleave','rallyUp','drill']},
    bow:{n:'Bow',skills:['rapid'],menu:['steadyAim','marksmen','hotCoals','arrowStorm','rapidUp','drill'],ai:['steadyAim','marksmen','arrowStorm','rapidUp','drill']},
    xbow:{n:'Crossbow',skills:['volley'],menu:['heavyBolt','quickReload','steadyAim','fireSkill','volleyUp','drill'],ai:['heavyBolt','quickReload','steadyAim','volleyUp','drill']},
    thrower:{n:'Thrower',skills:['rally'],menu:['steadyAim','marksmen','rallyUp','drill'],ai:['steadyAim','marksmen','rallyUp','drill']},
    cav:{n:'Cavalry',skills:['spur'],menu:['heavyCharge','wedgeDrill','rideDown','outriders','spurUp','rallySkill','drill'],ai:['heavyCharge','wedgeDrill','rideDown','spurUp','rallySkill']},
    horsebow:{n:'Mounted archers',skills:['spur'],menu:['parthian','steadyAim','rapidSkill','outriders','spurUp','drill'],ai:['steadyAim','rapidSkill','parthian','spurUp','drill']},
    mage:{n:'Mage',skills:[],menu:['strongerSpell','ward','deepMana','quickCast','drill'],ai:['strongerSpell','quickCast','ward','deepMana','drill']},
    scout:{n:'Scouts',skills:['scout'],menu:['keenEyes','scoutUp','steadyAim','drill'],ai:['keenEyes','scoutUp']}},
  // old saves' picks (§9: defaults on load, core/ranks.js kitsMigrate) as the new menu's, and what a rank gave by its ladder's rung
  // (kept, as picks, up to its levels); a rank's Brace and Rally now a stance and a default: none
  old:{brace:'braceUp',reach:'longReach',rally:'rallyUp',fire:'hotCoals',aim:'steadyAim',rapid:'rapidUp',marks:'marksmen',hedge:'hedge',drill:'drill'},
  oldRungs:{spear:[null,null,'longReach',null,'hedge'],bow:[null,'fireSkill','steadyAim',null,'marksmen']},
  /* step 1's ladders (doc/RANKS_DESIGN.md §5; RANKS.statsOnly off): five rungs, rank 1 to 5, each a skill or a perk: a passive
     (its numbers: reach, range and aim error multiplied; a flag read where it acts) or one of the skills (ab), unlocked at that
     rank; up: a mastery pick's gain on it; foot: a foot drill, not while he rides. Rank 1 is the kind's own trait */
  ladders:{
    spear:[{traits:['brace'],foot:true},
      {ab:'brace',up:{dur:3},foot:true},
      {id:'reach',n:'Long reach',d:'+10% reach.',reach:1.1,up:{reach:.05}},
      {ab:'rally',up:{gain:5}},
      {id:'hedge',foot:true,n:'Braced flanks',d:'Braced front on the flanks too, always, Brace flanks ordered or not: only a charge from behind still hits home.'}],
    bow:[{traits:['longshot','elvenaim']},
      {ab:'fire',up:{mul:.05}},
      {id:'aim',n:'Steady aim',d:'Their shots 10% truer.',aim:.9,up:{aim:-.05}},
      {ab:'rapid',up:{dur:2}},
      {id:'marks',n:'Marksmen',d:'+10% range, on top of their bows\' own.',range:1.1,up:{range:.05}}]}};
// (the old name: each kind's ladder)
const RANK_SKILLS=KITS.ladders;
