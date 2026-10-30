'use strict';
/* ---------- a troop group's ranks (doc/RANKS_DESIGN.md; core/ranks.js): experience to each next rank by the group's tier (its
   kind's), rank 1 to max; peasants (tier 0) have none, only the experience to their first upgrade (peasant: made hard, the
   owner: "they may need to grind their first cap but no rank"); the badge's metal by tier ---------- */
const RANKS={max:5,
  xp:{1:[40,100,180,280],2:[60,150,270,420],3:[90,220,400,620]},
  peasant:160,
  metal:{0:'iron',1:'bronze',2:'silver',3:'gold'},
  // the badge's colours by metal: its face, its shade, its rim, its chevrons
  col:{iron:['#8d9196','#5f6368','#34373b','#d8dadc'],bronze:['#c07a3e','#8a522a','#4d2d16','#ffd9a8'],silver:['#c9d0d8','#8e97a3','#4f5661','#ffffff'],gold:['#f0c445','#b98a1d','#6a4b0b','#fff6c9']}};
