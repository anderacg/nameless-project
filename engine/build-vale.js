'use strict';
/* ---------- PX engine: the Vale Crown's buildings (the humans), and the Salt League's (buildmodels.js PX.registerBuildStyle) ---------- */
// The owner's doc (doc/references/assets/REALM_STRUCTURE_ART_DESIGN.md, Vale Crown and its climate variations): practical,
// prosperous, organized; pale stone, oak and plaster; red and orange pitched tile; royal blue and old gold; wheat, orderly braces,
// shield plaques; neat streets and squared yards.
// Today: the generic plans with the Vale's look (orange-red tile in the towns, thatch in the country, walls of daub and whitewash
// under a timber frame or stone, townhouses daub over stone). Its own types to come here.
// The Salt League (Salt League): white plaster, sea stone, painted timber; low tile roofs and warehouse gables; teal and sea blue;
// rigging, shutters, rope, striped awnings. A mixed, human-styled realm: it builds on the Vale's style (from) until its own is drawn.
(function(PX){
  PX.registerBuildStyle('vale',{
    // the style table (buildmodels.js LOOK0 its shape)
    look:{people:'human',
      roof:'tile',rural:'thatch',walls:['daub','whitewash','daub','stone'],frame:'timber',stone:'stone',fort:'stone',fieldstone:'stone',wood:'plank',silo:'stone',felt:'canvas',
      trim:null,accent:'gold',ground:null,
      forms:['gable','gable','front','hip'],cones:true,hall:'longhouse',door:'Door',win:'Win',finial:'timber',
      townhouse:{upper:'daub'},
      village:{form:'gable',rise:10,door:'Door2',chim:[8,-16],goods:['hay','barrel']},
      desert:{wall:'adobe'},swamp:{},frost:{}},
    // its own types (any culture can build them; their plan the generic)
    own:{types:{}},
    // its plans for the shared types, clusters and centres: (Q, o, base), (C, base), {tier: {type} or {kind}}
    types:{},clusters:{},centres:{}});
  // the Salt League: the Vale's style where it gives none of its own
  PX.registerBuildStyle('league',{from:'vale',
    look:{people:'human'},
    own:{types:{}},
    types:{},clusters:{},centres:{}});
})(window.PX=window.PX||{});
