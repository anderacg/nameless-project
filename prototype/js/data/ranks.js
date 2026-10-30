'use strict';
/* ---------- a troop group's ranks (doc/RANKS_DESIGN.md; core/ranks.js): experience to each next rank by the group's tier (its
   kind's), rank 1 to max; peasants (tier 0) have none, only the experience to their first upgrade (peasant: made hard, the
   owner: "they may need to grind their first cap but no rank"); a rank's proficiency (prof: its damage, health and aim, each rank
   above the first, the owner: "1% per rank"); mastery (the owner: at the last rank, "once your xp is at max and you do not or cannot
   upgrade, you gain mastery xp"): bronze, silver, gold, each mastery a pick (a skill of its ladder improved, its up; or a drill: one
   more step of proficiency); upgraded, carry of its mastery's experience to the new kind's ranks. The badge: steel with its rank's
   chevrons, its mastery's metal once it has one; a peasants' plain iron ---------- */
const RANKS={max:5,
  // (an AI army's groups, till they rank (doc/RANKS_DESIGN.md phase 5): this rank, so their spears brace and their bows fire as before)
  ai:2,
  xp:{1:[40,100,180,280],2:[60,150,270,420],3:[90,220,400,620]},
  peasant:160,
  // (an AI army's groups (doc/RANKS_DESIGN.md §6, phase 5): their first rank by the army's kind (a lord's by his level: lord,
  // a rank each lordPer levels), its chieftain's own group one more; a fight on the map or one auto-resolved, each group's
  // experience (won or lost); a lord at rest in a holding, his drill a day (to rank drillCap at most); his rank-5 groups upgrade
  // where it trains)
  aiStart:{band:[1,2],patrol:[1,3],caravan:[1,2],cparty:[1,2],lord:[1,4],lordPer:4},aiFight:{win:14,lose:6},aiDrill:{xp:6,cap:4},
  prof:.01,
  mastery:{xp:[300,700,1200],metal:['bronze','silver','gold'],carry:.5},
  drill:{id:'drill',n:'Drill',d:'One more step of proficiency: +1% damage, health and aim.'},
  // the badge's colours by metal: its face, its shade, its rim, its chevrons
  col:{steel:['#a9b4bf','#6f7b87','#2f363d','#e8eef3'],iron:['#8d9196','#5f6368','#34373b','#d8dadc'],bronze:['#c07a3e','#8a522a','#4d2d16','#ffd9a8'],silver:['#c9d0d8','#8e97a3','#4f5661','#ffffff'],gold:['#f0c445','#b98a1d','#6a4b0b','#fff6c9']}};
/* ---------- each role's ladder (doc/RANKS_DESIGN.md §5; battle/rankskills.js): its five rungs, rank 1 to 5, each a skill: a passive
   (its numbers here: reach, range and aim error multiplied; a flag read where it acts) or one of the group abilities
   (ab: battle/unitabilities.js), unlocked at that rank; up: a mastery pick's gain on it (an ability's dur in seconds, Rally's gain,
   Fire arrows' mul; a passive's own number). A role not here keeps today's abilities from rank 1 (built later as data: the
   owner, "a baseline for future added") ---------- */
const RANK_SKILLS={
  spear:[{id:'setspears',n:'Set spears',d:'Braced against a charge on their front: it gets no charge bonus and no shock.'},
    {ab:'brace',up:{dur:3}},
    {id:'reach',n:'Long reach',d:'+10% reach.',reach:1.1,up:{reach:.05}},
    {ab:'rally',up:{gain:5}},
    {id:'hedge',n:'Hedge of spears',d:'Braced against a charge from the front and the flanks, always: only one from behind still hits home.'}],
  bow:[{id:'volley',n:'Volley',d:'They shoot as bowmen do: arcing shots over their own lines.'},
    {ab:'fire',up:{mul:.05}},
    {id:'aim',n:'Steady aim',d:'Their shots 10% truer.',aim:.9,up:{aim:-.05}},
    {ab:'rapid',up:{dur:2}},
    {id:'marks',n:'Marksmen',d:'+10% range.',range:1.1,up:{range:.05}}]};
