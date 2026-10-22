'use strict';
/* ---------- PX engine: the Sylvan Court's buildings (the elves; buildmodels.js PX.registerBuildStyle) ---------- */
// The owner's doc (doc/references/assets/REALM_STRUCTURE_ART_DESIGN.md, Sylvan Court): pale living wood, bark and moss; curved leaf
// and canopy roofs; moon lavender; arches, roots, lanterns, bridges; grown with the land, still read as buildings (doors, platforms,
// railings, work areas), never every building a giant tree.
// Today: the generic plans with the Court's look (leaf roofs, light walls of whitewash and plank, whitewash its civic stone and its
// castles), and its own types: W5 (the owner's Sylvan Court) in its own language and no trees (leaf roofs (model.js), pale living
// wood, bark, moss and moon lavender, arched doors, windows of moon glass, lanterns and banners: the elf hall, the spire, a village's
// hall when the Court holds it); the treehouse keeps its tree.
(function(PX){
  // (W5) a curled leaf standing on a leaf roof's peak (u, v, z), 2 px thick both ways, curling to side s (1 right, -1 left)
  const curl=(Q,n,u,v,z,s,mat)=>Q.cut(n,u-1.5,v-1,z,s>0?['.ll','ll.','ll.']:['ll.','.ll','.ll'],{l:mat},{dv:2});
  PX.registerBuildStyle('sylvan',{
    // the style table (buildmodels.js LOOK0 its shape)
    look:{people:'elf',
      roof:'leaf',rural:null,walls:['whitewash','whitewash','plank'],frame:null,stone:'whitewash',fort:'whitewash',fieldstone:'stone',wood:'plank',silo:'plank',felt:null,
      trim:'moon',accent:'moon',ground:null,
      forms:['gable','gable','front','hip'],cones:true,hall:'elfhall',door:'Door',win:'Win',finial:'timber',
      // a village's hall of pale living wood under a leaf roof, no chimney, arched door and windows, a lantern by its door
      village:{form:'leaf',door:'DoorLeaf',wall:'elfwood',fmat:'gold',chim:false,foot:false,pick:['WinLeaf'],win:'WinLeaf',vmat:'moon',lamp:['LampLeaf',.6,5],goods:['sacks','crate']},
      elfhall:{wall:'elfwood',vmat:'moon',leaf:'leaf'},
      desert:{wall:'whitewash'},swamp:{},frost:{}},
    // its own types (any culture can build them; their plan the generic)
    own:{types:{
      // a treehouse: a house on a deck round a great trunk under its lumpy crown, a vaulted roof, a ladder
      treehouse:{cell:32,dwellings:2,plan(Q,o){const d=o.d,dw=Q.home('treehouse','home'),crown=d.pick(['canopy','canopy','autumn']),H=6;
        Q.round('tr',[0,-6],3,[0,15],'log',null);Q.round('cr',[0,-6],10,[13,17],crown,{form:'cone',rise:5,mat:crown,o:0,lip:0},{rough:.5,rs:o.seed});
        Q.box('dk',[-10,10],[-3,9],[H-1,H],'plank',{top:true,thin:true});for(const [a,b] of [[-10,8],[9,8]])Q.box('p'+a,[a,a+1.5],[b,b+1.5],[0,H],'log',{top:true});
        Q.box('h',[-6,6],[-2,8],[H,H+10],o.wall==='stone'?'whitewash':o.wall,{dw});Q.roof('h','vault','u',5,o.roofMat,{lip:1});Q.dec('h.S','Door',.3);Q.dec('h.S','Lancet',.75,3);Q.dec('h.E','Lancet',.5,3);Q.dec('h.W','Lancet',.5,3);
        Q.cut('ld',6,9,0,Array.from({length:H},(_,i)=>i%2?'t.t':'ttt'),{t:'timber'},{dv:2})}},
      // an elves' hall (W5, the owner's Sylvan Court; no trees): a slender house of pale living wood raised on a root plinth, its gable
      // to the front under a leaf roof (a pointed arch, its ridge swept up to its ends, the eaves flared and their tips curled, each
      // slope a great leaf's veins, a moon-lavender verge), a curled leaf on its front peak; bark posts at its corners, a root stair up
      // to its arched door, a lantern of moonlight by it, arched windows of moon glass and a round one in each gable, a banner of moon
      // lavender on each side; moss on the stair and the roots. look.elfhall: its wall, its verge, its curled leaf (the Court's: pale
      // living wood, moon lavender, leaf; another culture's: its own wall, no verge, timber)
      elfhall:{cell:32,dwellings:3,look:{wall:null,vmat:null,leaf:'timber'},plan(Q,o){const dw=Q.home('elfhall','home'),K=o.look.elfhall,wall=K.wall||o.wall,w=12,dd=14,z=11,H=2,R=11,S=2,v1=dd/2;
        Q.box('pl',[-w/2-1,w/2+1],[-v1-1,v1+1],[0,H],'bark',{top:true});Q.lift=H;
        Q.box('h',[-w/2,w/2],[-v1,v1],[0,z],wall,{dw});Q.roof('h','leaf','v',R,o.roofMat,{o:2,ov:1,lip:1,sweep:S,curl:1,vmat:K.vmat});
        for(const a of [-1,1])for(const b of [-1,1])Q.round('cp'+a+b,[a*w/2,b*v1],1.4,[0,z],'bark',null);
        curl(Q,'fn',0,v1+1,z+R+S-1,1,K.leaf);Q.lift=0;
        Q.dec('h.S','DoorLeaf',.5);Q.dec('h.S','LampLeaf',.86,5);Q.dec('h.S','WinRound',.5,z+2,true);Q.dec('h.N','WinRound',.5,z+2,true);Q.dec('h.N','WinLeaf',.5,2);
        for(const k of ['E','W']){Q.dec('h.'+k,'WinLeaf',.22,2);Q.dec('h.'+k,'WinLeaf',.78,2);Q.dec('h.'+k,'Banner',.5,1)}
        // (the root stair: two steps up to the plinth, a root curling down either side)
        Q.box('s0',[-3,3],[v1+1,v1+3],[0,1],'bark',{top:true,topMat:'moss'});Q.box('s1',[-3,3],[v1+1,v1+2],[1,2],'bark',{top:true});
        for(const s of [-1,1])Q.round('rt'+s,[s*4,v1+2],1.2,[0,2],'bark',{form:'cone',rise:1,mat:'moss',o:0,lip:0})}},
      // a spire (the elves', W5): a tall round tower of pale living wood on a mossed root flare, a balcony ring, a leaf cone (a pointed
      // arch, its eave's tips curled) with a gold curled leaf on top, its arched door, windows of moon glass round it
      spire:{cell:32,dwellings:0,plan(Q,o){const dw=Q.home('spire','worship'),z=17,R=9;Q.round('rf',[0,0],5.8,[0,2],'bark',{form:'cone',rise:1,mat:'moss',o:0,lip:0});
        Q.round('s',[0,0],4.5,[0,z],'elfwood',{form:'cone',leaf:true,rise:R,mat:o.roofMat},{dw});curl(Q,'fn',0,0,z+R-1,1,'gold');
        Q.round('bal',[0,0],6,[10,11],'bark',{form:'lid',mat:'bark'});Q.dec('s.S','DoorLeaf',.5);Q.dec('s.S','WinLeaf',.5,12);for(const k of ['E','W','N'])Q.dec('s.'+k,'WinLeaf',.5,3)}},
    }},
    // its plans for the shared types, clusters and centres: (Q, o, base), (C, base), {tier: {type} or {kind}}
    types:{},clusters:{},centres:{}});
})(window.PX=window.PX||{});
