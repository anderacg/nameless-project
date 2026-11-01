'use strict';
/* ---------- a troop group's ranks (doc/RANKS_DESIGN.md, doc/UNIT_KITS_DESIGN.md §6, §7; core/ranks.js): experience to each next rank
   by the group's tier (its kind's), rank 1 to max, each its name (names); peasants (tier 0) have none, only the experience to their
   first upgrade (peasant: made hard, the owner: "they may need to grind their first cap but no rank"). A rank gives stats only
   (statsOnly, §6): each above the first its share more damage, health and aim, morale points and vigor (per); mastery past the
   last (§7, mastery5): five levels, each one pick from its kind's menu (data/kits.js KITS); upgraded, carry of its mastery's
   experience to the new kind's ranks. The badge: steel with its rank's chevrons, its mastery's metal once it has one (bronze for
   Adept up to gold); a peasants' plain iron.
   Step 2's two switches here (§10.2, each its own for the fingerprint proofs): statsOnly off, step 1's ladders (a skill or perk
   from a rank: data/kits.js KITS.ladders) and its proficiency (prof, 1% a rank); mastery5 off, step 1's three metals (mastery1),
   each a pick of a ladder skill's up or a drill ---------- */
const RANKS={max:5,
  statsOnly:true,mastery5:true,
  names:['Recruit','Trained','Seasoned','Veteran','Elite'],
  // (an AI army's groups, till they rank (doc/RANKS_DESIGN.md phase 5): this rank)
  ai:2,
  xp:{1:[40,100,180,280],2:[60,150,270,420],3:[90,220,400,620]},
  peasant:160,
  // (an AI army's groups (doc/RANKS_DESIGN.md §6, phase 5): their first rank by the army's kind (a lord's by his level: lord,
  // a rank each lordPer levels), its chieftain's own group one more; a fight on the map or one auto-resolved, each group's
  // experience (won or lost); a lord at rest in a holding, his drill a day (to rank drillCap at most); his rank-5 groups upgrade
  // where it trains)
  aiStart:{band:[1,2],patrol:[1,3],caravan:[1,2],cparty:[1,2],lord:[1,4],lordPer:4},aiFight:{win:14,lose:6},aiDrill:{xp:6,cap:4},
  // each rank above the first (§6): dmg, hp, its share more; aim, its share truer; mor, morale points; vig, vigor's share. prof:
  // step 1's, damage, health and aim alike
  per:{dmg:.03,hp:.03,aim:.03,mor:2,vig:.02},
  prof:.01,
  // mastery (§7): the experience past the last rank each level needs (ends), its name, its badge's metal; carry: its share kept
  // through an upgrade. mastery1: step 1's (xp: each metal's own). RANKS.mastery: the one in play
  levels:{ends:[300,700,1200,1800,2500],n:['Adept','Expert','Master','Grandmaster','Legend'],metal:['bronze','silver','silver','gold','gold'],carry:.5},
  mastery1:{xp:[300,700,1200],n:['Bronze mastery','Silver mastery','Gold mastery'],metal:['bronze','silver','gold'],carry:.5},
  get mastery(){return this.mastery5?this.levels:this.mastery1},
  // a drill (a pick, again and again): its share more damage, health and aim
  drill:{id:'drill',n:'Drill',d:'One more step of training: +1% damage, health and aim.',dmg:.01,hp:.01,aim:.01},
  // the badge's colours by metal: its face, its shade, its rim, its chevrons
  col:{steel:['#a9b4bf','#6f7b87','#2f363d','#e8eef3'],iron:['#8d9196','#5f6368','#34373b','#d8dadc'],bronze:['#c07a3e','#8a522a','#4d2d16','#ffd9a8'],silver:['#c9d0d8','#8e97a3','#4f5661','#ffffff'],gold:['#f0c445','#b98a1d','#6a4b0b','#fff6c9']}};
// (each kind's kit, its default skills and its mastery menu: data/kits.js KITS)
