'use strict';
/* ---------- data: the dismount (doc/TROOPS_DESIGN.md step 4; battle/dismount.js Horse, Dismount). on: off in tests/harness.js, so
   the older suites' riders never lose a horse (tests/dismount.js turns it on).
   spd: a rider on foot's pace by his armour, against his kind's mounted speed (× his own: his upgrades and the ground kept);
   stun: s stunned (down, physics on) when thrown or his horse falls under him;
   mountT: s to climb back into the saddle, standing by it (reach: px from it); near: px, an enemy this close keeps a thrown man
   fighting on foot (his own way back to his horse waits); look: s between his looks for one;
   hp: a horse's health by its kind (core/recruitment.js horseOf; a riding horse by default);
   share: of each hit on a mounted man, what his horse takes instead: a missile, a spear's (or a pike's) blow, magic, any other blow;
   seat: px/s × his own weight (a man's, armour and all: PHYSICS.mass) a charge or a hard blow must throw him by to unhorse him
   (× the footing it must beat: movesets.js); brace: braced spears unhorse a charging rider this share of the time, × his momentum;
   cd: the orders' cooldowns, s;
   temper: what a mount does when its rider is thrown, by its kind (the rider's look: gfx/people.js mount; the owner, 2026-11-08: "horse
   or sheep should run away. Warg may fight back"): 'fight' turns on the enemy, any other bolts;
   bolt: a bolting mount's pace (px/s) and how far it runs from the nearest enemy ([min, max] px) before it stands, to be caught again;
   fight: a fighting mount's pace (px/s; it goes for an enemy within near of its rider), its reach (px), s between bites (cd),
   a bite by its kind (dmg), and of the bitten man's own blow what it takes back (back) ---------- */
const DISMOUNT={on:true,
  spd:{none:38,leather:37,hide:37,mail:35,plate:32},
  stun:1.1,mountT:1.2,reach:8,near:70,look:.3,
  hp:{m_horse:40,m_destrier:70},
  share:{missile:.45,spear:.4,magic:.3,blow:.25},
  seat:9,brace:.6,
  cd:{dismount:4,mount:4},
  temper:{wolf:'fight',warg:'fight'},
  bolt:{spd:95,far:[150,230]},
  fight:{spd:80,reach:12,cd:.9,dmg:{wolf:5,warg:8},back:.4}};
