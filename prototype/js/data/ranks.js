'use strict';
/* ---------- a troop group's ranks (doc/RANKS_DESIGN.md; core/ranks.js): experience to each next rank by the group's tier (its
   kind's), rank 1 to max; peasants (tier 0) have none, only the experience to their first upgrade (peasant: made hard, the
   owner: "they may need to grind their first cap but no rank"); the badge's metal by tier ---------- */
const RANKS={max:5,
  // (an AI army's groups, till they rank (doc/RANKS_DESIGN.md phase 5): this rank, so their spears brace and their bows fire as before)
  ai:2,
  xp:{1:[40,100,180,280],2:[60,150,270,420],3:[90,220,400,620]},
  peasant:160,
  metal:{0:'iron',1:'bronze',2:'silver',3:'gold'},
  // the badge's colours by metal: its face, its shade, its rim, its chevrons
  col:{iron:['#8d9196','#5f6368','#34373b','#d8dadc'],bronze:['#c07a3e','#8a522a','#4d2d16','#ffd9a8'],silver:['#c9d0d8','#8e97a3','#4f5661','#ffffff'],gold:['#f0c445','#b98a1d','#6a4b0b','#fff6c9']}};
/* ---------- each role's ladder (doc/RANKS_DESIGN.md §5; battle/rankskills.js): its five rungs, rank 1 to 5, each a skill: a passive
   (its numbers here: reach, range and aim error multiplied; a flag read where it acts) or one of the group abilities
   (ab: battle/unitabilities.js), unlocked at that rank. A role not here keeps today's abilities from rank 1 (built later as
   data: the owner, "a baseline for future added") ---------- */
const RANK_SKILLS={
  spear:[{id:'setspears',n:'Set spears',d:'Braced against a charge on their front: it gets no charge bonus and no shock.'},
    {ab:'brace'},
    {id:'reach',n:'Long reach',d:'+10% reach.',reach:1.1},
    {ab:'rally'},
    {id:'hedge',n:'Hedge of spears',d:'Braced against a charge from the front and the flanks, always: only one from behind still hits home.'}],
  bow:[{id:'volley',n:'Volley',d:'They shoot as bowmen do: arcing shots over their own lines.'},
    {ab:'fire'},
    {id:'aim',n:'Steady aim',d:'Their shots 10% truer.',aim:.9},
    {ab:'rapid'},
    {id:'marks',n:'Marksmen',d:'+10% range.',range:1.1}]};
