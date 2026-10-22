'use strict';
/* ---------- PX engine: the Ashgor Horde's buildings (the orcs; buildmodels.js PX.registerBuildStyle) ---------- */
// The owner's doc (doc/references/assets/REALM_STRUCTURE_ART_DESIGN.md, Ashgor Horde): mobile, repairable, defensible; felt, hide,
// heavy timber, earth, horn and bone; round yurt crowns, low palisades, wagon roofs; oxblood red and black; wagon wheels, smoke
// crowns, clan bands, earth berms.
// Today: the generic plans with the Horde's look (hide roofs, walls of daub and plank, log towers and castles, bone finials, a
// village's hall of logs under a vault), and its own types: the yurt, the hide hall and the watchtower.
(function(PX){
  const {house}=PX.planKit;
  PX.registerBuildStyle('ashgor',{
    // the style table (buildmodels.js LOOK0 its shape)
    look:{people:'orc',
      roof:'hide',rural:null,walls:['daub','plank','daub'],frame:null,stone:'stone',fort:'log',fieldstone:'stone',wood:'log',silo:'log',felt:'canvas',
      trim:null,accent:'canvasR',ground:null,
      forms:['gable','gable','front','hip'],cones:true,hall:'hidehall',door:'Door',win:'Win',finial:'bone',
      village:{form:'vault',wall:'log',chim:false,goods:['woodpile','hay']},
      hidehall:{wall:'canvas'},
      desert:{wall:'adobe'},swamp:{},frost:{}},
    // its own types (any culture can build them; their plan the generic)
    own:{types:{
      // a yurt: a round wall of felt (look.felt, else the culture's first wall) under a low cone, its crown ring, its door, a band
      // round it, tusks either side of the door
      yurt:{cell:32,dwellings:2,plan(Q,o){const d=o.d,dw=Q.home('yurt'),felt=o.look.felt||o.look.walls[0];
        Q.round('y',[0,0],11,[0,11],felt,{form:'cone',rise:6,mat:o.roofMat,o:1},{dw});Q.round('yb',[0,0],11.3,[9,10],'timber',null);Q.round('cw',[0,0],2,[15,16],'timber',{form:'lid',mat:'timber'});
        Q.dec('y.S','Door',.5);Q.dec('y.E','Win',.5,3);Q.dec('y.W','Win',.5,3);if(d.chance(.6)||o.lv>=2){Q.prop('tusk',[-5,12]);Q.prop('tusk',[5,12])}else Q.prop('woodpile',[8,10])}},
      // a hide hall: a long round hall of felt (look.hidehall.wall, else the culture's wall), its roof of hides vaulted over the middle
      // and coned over its rounded ends, bone horns at its ridge's ends, a totem by its door
      hidehall:{cell:32,dwellings:3,look:{wall:null},plan(Q,o){const dw=Q.home('hidehall','home'),wall=o.look.hidehall.wall||o.wall;house(Q,{w:6,d:18,z:10,form:'vault',rise:8,wall,dw,door:.5,wins:0,chim:false,o:1});
        for(const s of [-1,1]){Q.round('e'+s,[s*3,0],9,[0,10],wall,{form:'cone',rise:8,mat:o.roofMat,o:1},{dw});Q.dec('e'+s+'.S','Win',s<0?.3:.7,3);Q.dec('e'+s+'.'+(s<0?'W':'E'),'Win',.5,3);Q.cut('hn'+s,s*3-1.5,-1,17,['b.b','b.b','.b.'],{b:'bone'},{dv:2})}
        Q.prop('totem',[6,11]);Q.prop('tusk',[-5,10])}},
      // a watchtower: a hut of planks on four tall posts braced, its roof, a ladder up the front, its hatch
      watchtower:{cell:32,dwellings:0,plan(Q,o){const dw=Q.home('watchtower','defence'),H=11;Q.flag=true;
        for(const [a,b] of [[-5,-5],[5,-5],[-5,5],[5,5]])Q.box('p'+a+b,[a-1,a+1],[b-1,b+1],[0,H],'log',{top:true,dw});
        Q.beam('xs',[-4,5,1],[4,5,H-2],'timber');Q.beam('xn',[4,-5,1],[-4,-5,H-2],'timber');Q.beam('xe',[5,4,1],[5,-4,H-2],'timber');Q.beam('xw',[-5,-4,1],[-5,4,H-2],'timber');
        Q.box('dk',[-7,7],[-7,7],[H,H+1],'plank',{top:true,thin:true});Q.box('h',[-5,5],[-5,5],[H+1,H+7],'plank',{dw});Q.roof('h','gable','v',4,o.roofMat,{lip:2,finial:1,fmat:'bone'});
        Q.dec('h.S','Hatch',.5,1);for(const k of ['E','W','N'])Q.dec('h.'+k,'Slit',.5,2);Q.cut('ld',-1.5,6,0,Array.from({length:H},(_,i)=>i%2?'t.t':'ttt'),{t:'timber'},{dv:2})}},
    }},
    // its plans for the shared types, clusters and centres: (Q, o, base), (C, base), {tier: {type} or {kind}}
    types:{},clusters:{},centres:{}});
})(window.PX=window.PX||{});
