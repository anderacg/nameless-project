'use strict';
/* ---------- data: factions ---------- */
// four single-race kingdoms and one mixed league
const FACS={
  vale:{n:'Vale Crown',col:'#e07a48',d:'Human kingdom of the western farmlands. Shield walls, pikes and armored knights.',races:['human'],lords:['Lord Aldric','Lady Maren','Ser Corwin','Lady Rowena']},
  karn:{n:'Karn Clans',col:'#6b9cf0',d:'Dwarf holds in the frozen north-east. Axes, crossbows and stubborn walls.',races:['dwarf'],lords:['Thane Borka','Thane Hroth','Thane Dain','Thane Gimra']},
  sylvan:{n:'Sylvan Court',col:'#e7a0d8',d:'Elven realm of the south-western woods. Archers without equal and swift riders.',races:['elf'],lords:['Lady Ithriel','Lord Caelan','Warden Sylas','Lord Faelar']},
  horde:{n:'Ashgor Horde',col:'#c84040',d:'Orc warbands of the eastern desert. Brutal, fast and many.',races:['orc'],lords:['Warchief Ulgra','Gash Bonecleaver','Mok the Red','Grukk Ironjaw']},
  salt:{n:'Salt League',col:'#4cc0a8',d:'Free merchant ports of the south coast, where elves, humans and orcs trade and fight side by side.',races:['elf','human','orc'],lords:['Admiral Cass','Captain Ivo','Admiral Neri','Captain Mirelle']}
};
// city guards: every holding sends a patrol out of its garrison to ride its land (world/patrols.js); how many, and the guard it
// keeps behind, by its kind (holdings.js patrol). days: how long it stays out; see: how far it spots trouble (px); speed: on foot;
// fine: gold per point of reputation a crime cost, demanded when the guards catch you; wanted: days they remember it
const PATROL={days:2,see:110,speed:24,fine:3,wanted:5,rest:1};// rest: days a beaten watch keeps in
// the two standing watches of every holding (world/patrols.js watchesOf): n its name; its make-up, its first kinds (lead) then
// drawn from its mix (seeded by the holding; 'spear' is its people's second footman), by the holding's peoples in turn; beat:
// what it is about; say: its words when it stops you (quiet: one by the day; band: bandits on its land; mine: your own fief's).
// The day watch rides the roads (riders and archers among its foot), the night watch keeps close by torchlight (spearmen and
// shield foot) under a dark pennant with a lantern (pennant). refill: men a day a watch takes back from the garrison for its fallen
const WATCH={refill:1,
  day:{n:'Day watch',lead:['horse','ranged'],mix:['melee','shield','horse','melee','ranged','shield'],beat:'riding the roads of',
    say:{quiet:['Roads are clear to the next milestone. Keep to them and keep moving.','Carts, drovers, pilgrims: all on the move, and all of it ours to watch. On your way.','Clear and dry. Ride on while the light lasts.'],
      band:'Bandits on our roads. We will have them by noon; keep your blade loose till then.',mine:'The roads are clear, my lord. Nothing moves on them we have not seen.'}},
  night:{n:'Night watch',lead:['spear','shield'],mix:['spear','shield','melee'],beat:'keeping the dark round of',pennant:'#1c2238',
    say:{quiet:['Who goes there? ... Hm. Keep to the lit lanes, stranger, and be quick about it.','Nothing honest walks about this late. Say your business, then get indoors.','Quiet tonight. Too quiet. Keep your torch where we can see it.'],
      band:'There are cutthroats out past the fields tonight. Stay in the light.',mine:'The gates are shut and the lanes are lit, my lord. All quiet.'}}};
// battles on the map between parties (world/fights.js) take time, so you (and others nearby) can join: one lasts about
// base + per x every fighter in it (world time), each side wearing the other down by their strength; a side whose strength
// falls below rout x the other's breaks. join: how close a lord or patrol must be to ride in
const FIGHT={base:3,per:.25,rout:.3,join:60};
// reinforcements: armies near your fight that join it (battle/engage.js nearAllies; the owner, 2026-10-23). r: how near (px);
// max: how many join you (the nearest first; of those within band px of each other, the strongest); foes: how many join your
// enemy; guards: the guards a caravan you save on the road fights with. A neutral one (a lord neither friend nor hostile, a
// watch off its land) helps against a common enemy by chance: chance at a relation of 0, rising to sure at RELATION.helpAt and
// to none at -helpAt; and only if his strength and yours come to fair x theirs. Won: honor from each realm's force beside you
// (beside) and, for a common enemy cleared on a realm's land with its men beside you, once more from that realm (land);
// rep: a watch's holding thinks better of you once it fought beside you and won (battle/sides.js thanks);
// renown: yours x renown when a lord or a watch helped (they take their share of the gold by their men: reinfCut)
const BATTLE_JOIN={armies:8,fighters:300};
const REINF={r:110,max:3,foes:2,band:30,guards:2,chance:.5,fair:.8,honor:{beside:3,land:2},rep:3,renown:.8};
// the land defended (world/defence.js; the owner, 2026-10-19). A threat: a bandit band or a beast (not a mythic one, nor one a
// quest set out), out of any fight. A holding sends its watch at one on its land that the watch (PATROL.see) or the holding or
// one of its estates (see, px) has in sight, if the watch is at least edge times as strong. A lord at or near home (resting,
// going home or riding his lands, within home px of one of his realm's holdings) rides at one on his realm's land that comes
// within near px of one of its holdings or estates and within ride px of him, on the same edge; he gives it up past leash px
// from where he set out, and after it waits cool (worldTime: a day is DAY, 12) before he looks again. A beast falls on a band
// it meets (meet px), and the band fights back; a beast beaten in a fight on the map is cut down as it flees, rout of its pack
// (rounded up: a lone beast dies). look: how often the land is looked over (the map's own time, as the watch check)
const DEFEND={see:110,edge:1.2,home:200,near:80,ride:200,leash:260,cool:3,meet:12,rout:.5,look:.5};
// personal relations (world/relations.js): you and each lord, and lords with each other, from -100 to 100, apart from
// realm honor. levels name them; the rest is what moves them, and what they buy. A lord's friends and rivals feel some of
// what you do to them (ripple). Relations drift back toward where they started by decay a day.
const RELATION={
  levels:[[60,'Sworn friend','good'],[30,'Friend','good'],[10,'Warm','good'],[-9,'Neutral',''],[-29,'Cool','bad'],[-59,'Rival','bad'],[-100,'Enemy','bad']],
  fightBeside:6,beatThem:-15,letGo:8,ransom:-6,jobDone:6,jobFailed:-5,breakSiege:10,harmRealm:-2,ripple:.4,
  gift:{gold:100,rel:5,days:7},decay:.02,
  helpAt:30,   // rides to help you in a fight even when their realm is only at peace with you
  spareAt:50,  // will not attack you while their realm is merely hostile to you (not at war with your employer)
  troopsAt:40,troops:3,troopsDays:10, // lends you soldiers from their army
  jobsAt:-20,  // below this, no work for you
  friend:20,rival:-30, // between lords: friends ride to each other's help, rivals won't
  together:4,beaten:-8 // lords who win a fight side by side; a lord beaten by another
};
