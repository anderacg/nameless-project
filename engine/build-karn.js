'use strict';
/* ---------- PX engine: the Karn Clans' buildings (the dwarves; buildmodels.js PX.registerBuildStyle) ---------- */
// The owner's doc (doc/references/assets/REALM_STRUCTURE_ART_DESIGN.md, Karn Clans): anchored into the mountain, broad, low and thick
// at the base; dark granite, iron, slate; steep snow-shedding roofs; forge orange; runes, vents, buttresses, heavy gates.
// Today: the generic plans with the Clans' look (navy slate roofs, walls of stone and whitewash, townhouses on stone, castles' towers
// flat-topped, a village's hall of stone under a low hip with a rune door, the forge in a smithy's yard), and its own types: the
// stone hall and the forge.
(function(PX){
  const {house}=PX.planKit;
  PX.registerBuildStyle('karn',{
    // the style table (buildmodels.js LOOK0 its shape)
    look:{people:'dwarf',
      roof:'slate',rural:null,walls:['stone','stone','whitewash'],frame:null,stone:'stone',fort:'stone',fieldstone:'stone',wood:'plank',silo:'stone',felt:null,
      trim:null,accent:'ember',ground:null,
      forms:['gable','gable','front','hip'],cones:false,hall:'stonehall',door:'Door',win:'Win',finial:'timber',
      townhouse:{lower:'stone'},
      village:{form:'hip',rise:6,door:'Rune',wall:'stone',goods:['barrel','crate']},
      swap:{smithy:'forge'},
      desert:{wall:'adobe'},swamp:{},frost:{}},
    // its own types (any culture can build them; their plan the generic)
    own:{types:{
      // a dwarves' stone hall: squat and broad, a low hip, buttresses at its corners, its rune door, a massive chimney
      stonehall:{cell:32,dwellings:4,plan(Q,o){const dw=Q.home('stonehall','home');house(Q,{w:20,d:16,z:11,wall:'stone',form:'hip',rise:6,dw,door:.5,doorKind:'Rune',wins:2,pick:['Win'],chim:[5,-3]});
        for(const a of [-10,10])for(const b of [-8,8])Q.square('bt'+a+b,[a,b],4,[0,8],'stone',{form:'pyramid',rise:2,mat:'stone',o:0});Q.prop('barrel',[-7,10])}},
      // a dwarves' forge: stone under a hip, a heavy stone arch round its glow, a hearth before it, two chimneys, anvil and coal
      forge:{cell:32,dwellings:0,plan(Q,o){const dw=Q.home('forge','work');Q.box('f',[-10,10],[-8,6],[0,11],'stone',{dw});Q.roof('f','hip','u',6,o.roofMat,{o:1});
        Q.chim([-7,-3],10,19,4);Q.chim([7,-3],10,19,4);Q.dec('f.S','ForgeS',.5);for(const k of ['W','E'])for(const a of [.3,.7])Q.dec('f.'+k,'Win',a,3);Q.dec('f.N','Door',.5);
        Q.box('hb',[-3,3],[6,8],[0,2],'stone',{top:true,topMat:'ember'});Q.prop('anvil',[-7,9]);Q.prop('coal',[7,9])}},
    }},
    // its plans for the shared types, clusters and centres: (Q, o, base), (C, base), {tier: {type} or {kind}}
    types:{},clusters:{},centres:{}});
})(window.PX=window.PX||{});
