'use strict';
/* ---------- trainers (doc/RANKS_DESIGN.md §3; world/trainers.js): as Skyrim's, a person who drills a group of the roles he knows,
   up to his level's rank (cap), for a flat experience (xp), TRAINERS.week times a week for your whole army; a holding's for its
   price (gold, by his level, times the group's tier), yours (your hero with Drillmaster, a companion as Trainer) free, in your
   camp. An expert or a master (upgrade) of its role is needed for a special upgrade (to tier 3, into a caster). How many a
   holding keeps and how good, by its kind (at: [how many, lowest level, highest]); a few wander from holding to holding, their
   whereabouts in the news (wander) ---------- */
const TRAINERS={week:5,
  levels:['Journeyman','Expert','Master'],cap:[2,4,5],xp:[15,25,35],gold:[20,40,70],upgrade:2,
  roles:{spear:'Spear',foot:'Infantry',bow:'Bow',xbow:'Crossbow',caster:'Caster',cav:'Cavalry',horsebow:'Horse archer'},
  at:{town:[1,1,2],city:[2,2,3],castle:[2,2,3]},
  // (wandering trainers (phase 4): how many, their levels (masters rare), how long they stay at a holding (days), how far they go next)
  wander:{levels:[3,3,2,2,2],stay:[3,6]},
  // (a companion's roles by his look; your hero's with Drillmaster)
  look:{ranger:['bow'],militia:['spear','foot'],chief:['foot','cav']},hero:['foot','spear','bow'],
  // (a trainer's name: a folk name and his title by his first role)
  title:{spear:'Spearmaster',foot:'Drillmaster',bow:'Bowmaster',xbow:'Arbalest',caster:'Magister',cav:'Horsemaster',horsebow:'Horse-bow'}};
