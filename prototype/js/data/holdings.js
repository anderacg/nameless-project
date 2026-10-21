'use strict';
/* ---------- data: the kinds of holding. Everything that differs between a village, a town, a city and a castle lives in its
   entry here and is read through the holding itself (t.T, t.label, t.has(tab), ...). To add a kind: give it an entry, a
   class in world/holding.js (or reuse one), and holdings of that kind in places.js. ---------- */
// tier / next: its step on the growth path (camp 0 … city or castle 4) and the kinds it may grow into (holdingOf(t, next); nothing
// grows yet) · centre: what stands at its heart, by its first people (_: anyone; lots.js) · pop0 / popCap: people at the start /
// at most ·
// store: the market's room for each good · gar: garrison · patrol: the watch it sends out (size) and the guard it keeps (keep) ·
// wall0 / wallMax: fortification at the start / at best (WALL_N) · estMax: highest estate level · reach / growMax: its land, tiles
// out from it, and how far that grows in peace · ring / tries: how far from the centre its houses stand, how hard it looks for room ·
// needs / wants: what 100 of its people use each day (wants: luxuries, and a castle's old stores of arrows and bolts, which
// nobody makes now: doc/ITEMS_DESIGN.md §2b) · jobs: the work it offers (quests.js) · sack: gold for
// sacking it · income: a fief's daily base · handover: what a realm pays you for it · renown: for taking it · guards: extra
// caravan guards · tabs: its window · hires: the kinds of troop it raises (RACES) · train / tourney / broker / contract: what
// its barracks and tavern offer · mounts: which stables' horses it sells (MOUNTS where; 'local': by race and climate) ·
// herds: livestock grazes round it · rural: farms first, few trades · fort: a stockpile and no market or workshops ·
// scene: its walkable streets (SCENES) · temple: a priest in its streets · smoke: chimneys that smoke
const HOLDING_TYPES={
  village:{n:'village',tier:2,next:['town'],centre:{_:'village'},pop0:60,popCap:140,store:150,gar:6,patrol:{size:3,keep:2},wall0:0,wallMax:1,estMax:2,
    reach:10,growMax:7,ring:9,tries:60,needs:{food:5,cloth:.4,timber:.6,tools:.3,ale:.4},wants:{},jobs:['bounty','beast','hunt','hunt'],
    sack:80,income:8,handover:60,renown:10,guards:0,tabs:['recruit','trade','stable','jobs','tavern'],hires:['melee','shield'],
    mounts:['any'],herds:true,rural:true,smoke:2},
  town:{n:'town',tier:3,next:['city','castle'],centre:{_:'citadel'},pop0:200,popCap:420,store:320,gar:16,patrol:{size:6,keep:6},wall0:2,wallMax:3,estMax:3,
    reach:15,growMax:10,ring:10,tries:60,needs:{food:5,cloth:1,timber:.8,tools:.5,ale:.8,spice:.5,iron:.3},wants:{copper:.15,tin:.08,silver:.12,gold:.05,gems:.05,pearls:.03},
    jobs:['bounty','supply','courier','clear','beast'],sack:300,income:25,handover:150,renown:25,guards:2,
    tabs:['recruit','trade','smith','stable','jobs','tavern'],hires:['melee','shield','ranged'],train:true,tourney:true,broker:true,contract:true,
    mounts:['any','town','local'],herds:true,scene:'town',temple:true,smoke:3},
  city:{n:'city',tier:4,next:[],centre:{_:'citadel'},pop0:320,popCap:700,store:480,gar:24,patrol:{size:8,keep:8},wall0:3,wallMax:3,estMax:3,
    reach:17,growMax:12,ring:12,tries:90,needs:{food:5,cloth:1.2,timber:.9,tools:.6,ale:1,spice:.8,iron:.4},wants:{copper:.2,tin:.1,silver:.18,gold:.08,gems:.08,pearls:.05},
    jobs:['bounty','supply','courier','clear','beast','supply'],sack:450,income:40,handover:250,renown:40,guards:3,
    tabs:['recruit','trade','smith','stable','jobs','tavern'],hires:['melee','shield','ranged'],train:true,tourney:true,broker:true,contract:true,
    mounts:['any','town','castle','local'],herds:true,scene:'town',temple:true,smoke:4},
  castle:{n:'castle',tier:4,next:[],centre:{_:'keep'},pop0:80,popCap:170,store:220,gar:18,patrol:{size:8,keep:6},wall0:3,wallMax:3,estMax:2,
    reach:18,growMax:10,ring:9,tries:60,needs:{food:5,cloth:.5,timber:.6,tools:.6,iron:.6,ale:.5},wants:{copper:.15,tin:.08,silver:.04,arrows:3,bolts:1.5},
    jobs:['troops','courier','bounty','clear'],sack:200,income:15,handover:200,renown:30,guards:2,
    tabs:['recruit','stores','smith','stable','jobs'],hires:['melee','shield','ranged','horse'],train:true,
    mounts:['any','town','castle','local'],fort:true,smoke:3}
};

