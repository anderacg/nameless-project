'use strict';
/* ---------- data: the road's encounters' numbers, to tune in one place (doc/ENCOUNTERS_DESIGN.md): how often one comes and
   where (ENC_SPAWN), how long each lasts (ENC_LIFE), how fast they go (ENC_SPD), the chase (ENC_CATCH), a procession's way
   (ENC_WALK), each kind's rewards (ENC_TUNE, ENC_SHEEP, the dice), your stats' odds (ENC_STAT), the way one walks off (ENC_OFF).
   Their rules: world/road.js (the road: when and where) and world/encounters.js (the kinds: who and what) ---------- */
// spawning: base, rate (a travelled hour), cap; land (× by where you are); perDay, again (days); near: how far past your sight
// (px); arc: how far off the way you go (rad; arcTo for those that walk up to you, so they can reach your way); tries (spots tried); hold: tiles from a holding; pass: what passing one by takes
// off the timer [from, to]. (base and rate halved 2026-10-22, the owner: encounters came too often; were .004 and .0016)
const ENC_SPAWN={base:.002,rate:.0008,cap:.15,land:{road:1.5,held:1,wild:.6},perDay:2,again:5,near:[40,120],arc:1.1,arcTo:.5,tries:60,hold:6,pass:[.25,.5]};
// how long one lasts unmet, in-game hours [from, to], by behaviour; trace: the hours a trace lies; leave: gone past this × your
// sight (or slack px farther than it first stood); say: real seconds its call-out shows; hail: px at which one walking up to you
// stops you (it has reached you); spring: px at which an ambush springs
// (run: one running across your view; walk: a procession, ending sooner where it arrives; spook: × your sight, one that flees runs as you come within it)
// (its time up in your sight (its ends): pray: [from, to] hours a procession stays at the shrine or ruins it walked to; dying: hours
// past his time the wounded traveller lasts while you watch him; linger: hours past its time after which one walking off ends
// once past 0.8 × your sight, though still in it)
const ENC_LIFE={approach:[2,3],stay:[6,8],flee:[2,2],run:[2,3],scene:[3,8],walk:[4,10],trace:24,leave:1.5,slack:24,say:4,hail:20,spring:18,spook:.6,pray:[2,3],dying:6,linger:6};
// how fast they walk (px of world time, as a party's base, yours 34): hurrying to you, a rider coming, running from you, running
// across your view, a procession, going away, bolting
const ENC_SPD={approach:24,ride:32,flee:20,run:36,walk:20,leave:12,bolt:34,stray:16};
/* the chase and the catch, shared (story/happening.js: Encounter run, the chase behaviour; the thief, the runaway horse): one you chase runs from you at
   ENC_SPD.run × (1 − agi × your Agility), never under lo of it, and you go after him at sprint × your pace (your Riding in it
   when mounted: world.js updateWorld, roadSprint); you have him within reach + agiReach × your Agility; he is away after hours,
   or once lose × your sight from you. A startled beast runs bolt px [from, to], then stops (spook: × your sight, it bolts as you
   come). A catch by hand: a stat check (ENC_STAT.horse: Riding and Agility) */
const ENC_CATCH={sprint:1.6,agi:.04,lo:.6,reach:14,agiReach:2,hours:1.5,lose:1,bolt:[40,64],spook:.5};
// a procession's way (walk): its goal at least min px from where it comes into the world, and near enough to reach in its
// longest time (ENC_LIFE.walk) at its pace, the roads winding (wind: the share of its way that is straight on); places within far
// px of you (the kinds' ok)
const ENC_WALK={min:64,wind:.75,far:400};
/* the new kinds' numbers: mud (Help push: sp stamina, else hours of time; rep there; give [from, to] of its goods; Rob: goods and
   coins [from, to], CONDUCT.robWorker), thief (his purse [from, to]; Return it: reward gold, rep; Keep it: honor), poacher (see:
   × your sight, he sees you first, scout less a Scouting level; Turn him in: rep, bounty; Buy the meat: meat for price),
   funeral (mourners [from, to]; Pay respects: honor, morale), wedding (Join: morale, hours; a gift: gold, rep), beggar (gold
   to give, honor for each), messenger (his purse [from, to]; Rob: CONDUCT.robMessenger, and his sealed letter: ENC_TUNE.letter,
   world/letters.js).
   Phase 4: pilgrims (n [from, to] of them; Pray with them: morale, rep in their holding, walk: hours walking with them; alms: gold,
   morale, xp; Take the coins: gold, morale), the lure (the fake wounded: w its weight, × night, × wild (no holding's land), ×
   (1 + bandit for each band or camp within near px, at most bands of them), never over cap (the real one weighs 2); warn: the
   Scouting that sees the brush move, count: that tells how many and the odds; scare: calling them out may send a band of max or
   fewer running: base + lead × Leadership + cha × Charisma, between lo and hi), the sealed letter (stale: [from, to] days it keeps;
   worth: gold [from, to] × its kind's; w: how likely each kind is, of those there can be; sell: × worth a rival pays, deliver: ×
   worth its lord pays; opened: × for an opened one, old: × for a stale one; rep: sell, deliver, seen (what delivering costs when
   the robbery was seen); witness: the roll when you rob the rider: base + per for each soul within r px of him + hold when a
   holding is within holdR px, × (1 − scout × Scouting), × night by night, between lo and hi; reveal: tiles round a place its news
   uncovers on your map); and the old ones: traveller (Tend his wounds: food; rep and renown × (1 + your care: ENC_STAT.care);
   gift: × your care, the chance he gives you gold [from, to] from his purse), hunters (Join the hunt: xp; meat × (1 + your
   ENC_STAT.hunt); furs × it) */
/* strayed sheep: n strays (from, to), r: px from the shepherd they wander (from, to), shy: px you come before one trots off,
   hours: how long he waits once you help, rep and good (wool or cheese) a sheep brought back, all: more when every one is */
const ENC_SHEEP={n:[3,4],r:[40,80],shy:26,hours:3,rep:1,good:1,all:{rep:2,morale:3}};
const ENC_TUNE={traveller:{food:3,rep:4,renown:1,gift:.6,gold:[5,10]},hunters:{xp:15,meat:3,furs:2},mud:{sp:20,hours:1,rep:3,give:[2,4],goods:[3,5],coins:[3,8]},thief:{purse:[20,40],reward:10,rep:4,honor:3},poacher:{see:1.15,scout:.1,rep:3,bounty:10,meat:4,price:8},
  funeral:{n:[3,5],honor:2,morale:4},wedding:{morale:10,hours:2,gift:25,rep:5},beggar:{gold:[5,10,20],honor:[1,2,3]},messenger:{purse:[8,16]},
  pilgrims:{n:[2,4],morale:8,rep:3,walk:1,alms:20,almsMorale:12,xp:25,coins:12,coinsMorale:8},
  lure:{w:.5,night:1.6,wild:1.4,bandit:.3,bands:3,near:400,cap:1.6,warn:3,count:5,scare:{max:6,base:.2,lead:.06,cha:.05,lo:.05,hi:.85}},
  letter:{stale:[5,10],worth:[30,45],kind:{army:1.4,attack:1.3,deal:1.1,news:.6},w:{army:1,attack:1,deal:.7,news:.8},sell:1.2,deliver:.8,opened:.5,old:.15,
    rep:{sell:4,deliver:5,seen:6},witness:{r:120,base:.08,per:.12,hold:.25,holdR:160,scout:.07,night:.5,lo:.02,hi:.9},reveal:5}};
const ENC_DICE=.48;// (a hand of bones won)
// (the gamblers play at most hands hands with you, and quit early once they are quit gold down to you: no endless purse)
const ENC_GAMBLE={hands:5,quit:100};
/* your stats on the road (owner, 2026-10-19: stats only add to what anyone gets, up to a cap; a stat of 0 is today's odds or
   outcome, never worse; the checks: world/encounters.js statOdds) */
const ENC_STAT={horse:{base:.25,parts:[['ride',.08],['agi',.04]],cap:.9},dice:{base:ENC_DICE,parts:[[['int','cha'],.015]],cap:.65},
  mine:{base:.6,parts:[['surv',.04],['int',.01]],cap:.85},mineGear:{base:.4,parts:[['surv',.02],['int',.01]],cap:.55},wisps:{base:.5,parts:[['int',.025]],cap:.75},
  care:{base:0,parts:[['med',.15],['int',.03]],cap:1},push:{base:0,parts:[['str',.05],['athl',.05]],cap:.6},
  hunt:{base:0,parts:[['surv',.1],['hunt',.05],['archery',.05]],cap:1},respect:{base:0,parts:[['cha',.08]],cap:1}};
const ENC_RAIDER='#4a2c26';// (raiders' rags: darker than any realm's colours, so a fight reads at a glance)
// (pilgrims praying at a shrine: px under its point)
const ENC_PRAY={dy:12};
// (the flock round the shepherd: where each sheep brought back stands, dx, dy)
const ROAD_FLOCK=[[-8,1],[-13,-2],[-6,-3],[8,2],[12,-1],[-10,4]];
/* the way one walking off takes (world/road.js roadOffGoal): near tiles to its road, steps along it, far × your sight away,
   offs: its ways (rad from straight away) */
const ENC_OFF={near:1,steps:40,far:1.6,offs:[0,.5,-.5,1,-1,1.5,-1.5,2,-2,2.6,-2.6]};
// (a camp or a scene beside the road (world/road.js ENC_ON byroad): a road tile within this many tiles, none within 1)
const ENC_BY=3;
