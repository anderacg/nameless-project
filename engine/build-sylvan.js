'use strict';
/* ---------- PX engine: the Sylvan Court's buildings (the elves; buildmodels.js PX.registerBuildStyle) ---------- */
// The owner's doc (doc/references/assets/REALM_STRUCTURE_ART_DESIGN.md, Sylvan Court): pale living wood, bark and moss; curved leaf
// and canopy roofs; moon lavender; arches, roots, lanterns, bridges; grown with the land, still read as buildings (doors, platforms,
// railings, work areas), never every building a giant tree.
// The Court's language (W5, then its kit): pods of pale living wood (look.sylvan.wood) under leaf roofs (model.js: a pointed arch,
// the eaves flared and curled, the ridge swept up, a moon-lavender verge), a curled leaf on the peak, arched doors and windows of
// moon glass, moon lanterns; root plinths and root stairs, decks with thin railings on curved branch braces, living trees only where
// a building is about one (the treehouse, the great tree hall, a warden's keep).
(function(PX){
  const {curtain,crag,piece,made,prop:P}=PX.planKit;
  // the Court's say (look.sylvan, by climate): its wood, its verge, its curled leaf, its lantern (a decal) and lanterns' light, its
  // shades (the desert's canvas); a living tree's crown by the climate's species (the map's: grass oak, frost pine, desert palm, swamp
  // willow)
  const SY0={wood:'elfwood',vmat:'moon',leaf:'leaf',lamp:'LampLeaf',glow:'moon',shade:null},SY=o=>o.look.sylvan||SY0;
  const CROWN={grass:'oak',frost:'pine',desert:'palm',swamp:'willow'};
  // (W5) a curled leaf standing on a leaf roof's peak (u, v, z), 2 px thick both ways, curling to side s (1 right, -1 left)
  const curl=(Q,n,u,v,z,s,mat)=>Q.cut(n,u-1.5,v-1,z,s>0?['.ll','ll.','ll.']:['ll.','.ll','.ll'],{l:mat},{dv:2});
  // a pod, the Court's house: pale living wood under a leaf roof (its verge moon lavender), its gable (ax 'v') or its eaves (ax 'u')
  // to the front, a curled leaf on its peak; an arched door, a lantern by it, arched windows of moon glass on every side and a round
  // one in a front gable. s: {n, c, w, d, z, R, ax, sweep, o, wall, roof, dw, door (at, or false), wins (the front's), back (a door),
  // lamp, curl}. Returns its plan {u, v, z, R}
  function pod(Q,o,s){const K=SY(o),n=s.n||'h',[cu,cv]=s.c||[0,0],w=s.w,d=s.d,z=s.z||11,ax=s.ax||'v',R=s.R||Math.round((ax==='v'?w:d)*.7),S=s.sweep!=null?s.sweep:2,
      u=[cu-w/2,cu+w/2],v=[cv-d/2,cv+d/2],at=s.door==null?.5:s.door;
    Q.box(n,u,v,[0,z],s.wall||K.wood,{dw:s.dw});Q.roof(n,'leaf',ax,R,s.roof||o.roofMat,{o:s.o!=null?s.o:2,ov:1,lip:1,sweep:S,curl:1,vmat:K.vmat});
    if(s.curl!==false){if(ax==='v')curl(Q,n+'fn',cu,v[1]+1,z+R+S-1,1,K.leaf);else curl(Q,n+'fn',u[1],cv,z+R+S-1,1,K.leaf)}
    if(at!==false){Q.dec(n+'.S',s.doorKind||'DoorLeaf',at);if(s.lamp!==false&&w>=12)Q.dec(n+'.S',K.lamp,at+(at>.5?-1:1)*6/w,5)}
    const dl=at===false?0:PX.modelKit.DECAL[s.doorKind||'DoorLeaf'][0].length,clear=x=>at===false||Math.abs(x-at)*w>=(dl+4)/2+1;for(const x of s.wins||(w>=18?[.17,.83]:w>=15?[.2,.8]:[]))if(clear(x))Q.dec(n+'.S','WinLeaf',x,3);
    if(ax==='v'&&R>=7)Q.dec(n+'.S','WinRound',.5,z+2,true);
    if(s.back)Q.dec(n+'.N','DoorLeaf',.5);else Q.dec(n+'.N','WinLeaf',.5,3);
    for(const k of ['E','W'])for(const x of d>=14?[.3,.7]:[.5])Q.dec(n+'.'+k,'WinLeaf',x,3);
    return{u,v,z,R}}
  // a root plinth H high under a plan (u, v), bark, its top mossed at the front; a root stair down from it to the front at du, a
  // root curling down either side of it
  function plinth(Q,n,u,v,H,du){Q.box(n,[u[0]-1,u[1]+1],[v[0]-1,v[1]+1],[0,H],'bark',{top:true});
    for(let i=0;i<H;i++)Q.box(n+'s'+i,[du-3,du+3],[v[1]+1,v[1]+1+(H-i)*1.5],[i,i+1],'bark',{top:true,topMat:i===H-1?'moss':null});
    for(const s of [-1,1])Q.round(n+'r'+s,[du+s*4.2,v[1]+1.5],1.2,[0,H],'bark',{form:'lid',mat:'moss'})}
  // a deck of planks at z over (u, v) and its thin railing of pale wood (a rail on balusters) along the sides named (S, N, E, W); a
  // gap in the front's for a stair ([a, b] along u), and in the west side's (vgap, along v)
  function deck(Q,o,n,u,v,z,sides,gap,vgap){const K=SY(o);Q.box(n,u,v,[z-1,z],'plank',{top:true,thin:true});
    const rows=(L,a0,gp)=>{const top=[],bal=[];for(let i=0;i<L;i++){const g=gp&&a0+i>=gp[0]&&a0+i<gp[1];top.push(g?'.':'r');bal.push(g||!(i%3===0||i===L-1)?'.':'r')}return[top.join(''),bal.join('')]};
    for(const k of sides){const L=Math.round(k==='S'||k==='N'?u[1]-u[0]:v[1]-v[0]);
      if(k==='S'||k==='N')Q.cut(n+k,u[0],k==='S'?v[1]-1:v[0],z,rows(L,u[0],k==='S'&&gap),{r:K.wood});else Q.cut(n+k,v[0],k==='E'?u[1]-1:u[0],z,rows(L,v[0],k==='W'&&vgap),{r:K.wood},{alongV:true})}}
  // a curved brace of bark from a (low) to b (high), rising steeply first, then out (a branch)
  const brace=(Q,n,a,b,mat)=>{const m=[a[0]+(b[0]-a[0])*.3,a[1]+(b[1]-a[1])*.3,a[2]+(b[2]-a[2])*.7];Q.beam(n+'a',a,m,mat||'bark');Q.beam(n+'b',m,b,mat||'bark')};
  // a moon lantern on a bark post h high: its light (look.sylvan.glow) under a gold cap
  const lantern=(Q,o,n,c,h)=>{Q.box(n,[c[0]-1,c[0]+1],[c[1]-1,c[1]+1],[0,h],'bark',{top:true});Q.box(n+'l',[c[0]-1.5,c[0]+1.5],[c[1]-1.5,c[1]+1.5],[h,h+3],SY(o).glow,{top:true,topMat:'gold'})};
  // roots spread over the ground from a trunk's foot at c (r its trunk's radius): a mossed flare, k roots out to L
  function roots(Q,n,c,r,L,k,rot){Q.round(n+'f',c,r+1.6,[0,1.5],'bark',{form:'lid',mat:'moss'});
    for(let i=0;i<k;i++){const a=(rot||0)+i*2*Math.PI/k+(i%2?.3:-.2),l=L*(i%2?.8:1),ca=Math.cos(a),sa=Math.sin(a);Q.beam(n+i,[c[0]+ca*r*.8,c[1]+sa*r*.8,1],[c[0]+ca*l,c[1]+sa*l*.9,0],'bark')}}
  // a living tree at c: a slightly twisted trunk of bark (r) to z, its crown by the climate's species (CROWN) at z0 up, cr wide;
  // its crown leafy (canopy; the frost's snow settles on it), lumps under cones, or flat (tiers of lumps, no cone: a castle's,
  // whose cones are its roofs)
  function tree(Q,o,n,c,r,z0,z,cr,flat){const sp=CROWN[o.env]||'oak',rs=o.seed|0,[cu,cv]=c,m='canopy',lump=(k,at,rr,za,zb,rise)=>{if(!flat)return Q.round(n+k,at,rr,[za,zb],m,{form:'cone',rise,mat:m,o:0,lip:0},{rough:.5,rs});
      for(let i=0;i<3;i++)Q.round(n+k+'_'+i,at,rr*(1-i*.28),[i?zb+(i-1)*rise/2:za,zb+i*rise/2],m,{form:'lid',mat:m},{rough:.5,rs:rs+i})};
    Q.round(n+'t0',[cu-.4,cv],r,[0,z*.4],'bark',null);Q.round(n+'t1',[cu+.4,cv-.4],r*.9,[z*.4,z*.75],'bark',null);Q.round(n+'t2',[cu,cv-.8],r*.8,[z*.75,z],'bark',null);
    const bv=cv-cr*.12;if(sp==='pine'){lump('c0',[cu,bv],cr*.44,z0,z0+2,Math.round(cr*.4));lump('c1',[cu,bv],cr*.32,z0+5,z0+6,Math.round(cr*.35));lump('c2',[cu,bv],cr*.2,z0+9,z0+10,Math.round(cr*.3))}
    else if(sp==='palm'){lump('c0',[cu,cv-1],cr*.2,z0+2,z0+4,2);for(let i=0;i<6;i++){const a=i*Math.PI/3+.4,ca=Math.cos(a),sa=Math.sin(a);Q.beam(n+'fr'+i,[cu+ca*2,cv-1+sa*2,z0+4],[cu+ca*cr*.5,cv-1+sa*cr*.4,z0],m)}}
    else if(sp==='willow'){lump('c0',[cu,bv],cr*.44,z0,z0+3,Math.round(cr*.18));for(let i=0;i<7;i++){const a=i*2*Math.PI/7+.2,ca=Math.cos(a),sa=Math.sin(a);if(sa>.3)continue;Q.box(n+'w'+i,[cu+ca*cr*.4-1,cu+ca*cr*.4+1],[bv+sa*cr*.4-1,bv+sa*cr*.4+1],[z0-5+(i%2),z0],m,{top:true})}}
    else{lump('c0',[cu,cv-5],cr*.3,z0+2,z0+4,Math.round(cr*.12));for(const k of [-1,1]){lump('c'+k,[cu+k*cr*.3,cv-1.5],cr*.2,z0-1,z0+1,Math.round(cr*.1));Q.beam(n+'b'+k,[cu+k,cv-1,z-4],[cu+k*cr*.25,cv-1.5,z0],'bark')}}}
  // the ground a house stands on, its plan (u, v), its door at du: a root plinth and its root stair; in the swamp (o.stilts) posts of
  // bark, a deck round it and a boardwalk stepping down from the front. Sets Q.lift to the floor
  function footing(Q,o,n,u,v,du){if(!o.stilts){plinth(Q,n,u,v,2,du);Q.lift=2;return}const H=4;
    for(const [a,b] of [[u[0],v[0]],[u[1]-2,v[0]],[u[0],v[1]-2],[u[1]-2,v[1]-2]])Q.box(n+'p'+a+b,[a,a+2],[b,b+2],[0,H],'bark',{top:true});
    Q.box(n+'d',[u[0]-1,u[1]+1],[v[0]-1,v[1]+3],[H-1,H],'plank',{top:true,thin:true});for(let i=0;i<H-1;i++)Q.box(n+'w'+i,[du-2,du+2],[v[1]+3+(H-2-i)*1.6,v[1]+4.6+(H-2-i)*1.6],[i,i+1],'plank',{top:true});Q.lift=H}
  // a shade (the desert's): a leaf's arch of canvas (look.sylvan.shade) on four posts of bark over (u, v), z high
  function shade(Q,o,n,u,v,z){const K=SY(o);for(const a of [u[0],u[1]-1])for(const b of [v[0],v[1]-1])Q.box(n+a+'_'+b,[a,a+1],[b,b+1],[0,z],'bark',{top:true});
    Q.box(n,u,v,[z,z+1],K.shade,{thin:true,keep:1});Q.roof(n,'leaf','u',3,K.shade,{o:1,ov:0,lip:1,sweep:1,curl:1,vmat:K.vmat})}
  // a plan's materials swapped (the generic plans in the Court's: timber to bark...)
  const tint=(Q,map)=>{for(const p of Q.parts){if(map[p.wall])p.wall=map[p.wall];if(p.topMat&&map[p.topMat])p.topMat=map[p.topMat];if(p.k==='roof'&&map[p.mat])p.mat=map[p.mat]}};
  // castle walls round a plan (planKit.curtain) in the Court's way: their towers under leaf cones, moss along the walls' tops,
  // banners of moon lavender on the front towers
  const walls=(Q,...a)=>{curtain(Q,...a);for(const p of Q.parts){if(p.k==='tower'&&p.roof&&p.roof.form==='cone'&&!p.rough)p.roof=Object.assign({},p.roof,{leaf:true});if(/^cw/.test(p.name))p.topMat='moss'}
    for(const n of ['tSW','tSE'])Q.dec(n+'.S','Banner',.5,3)};
  // a little pod (a shed, a store): pale wood under a leaf roof along it, a small arched door
  const hut=(Q,o,n,c,w,d,dw)=>pod(Q,o,{n,c,w,d,z:8,ax:'u',R:4,sweep:1,dw,doorKind:'DoorSylvanPod',lamp:false,wins:[],curl:false});
  // a row of the Court's town houses about (u0, v0) (a cluster's): two of two storeys either side of a narrower pod, their upper
  // floors linked by plank bridges with rope rails
  function rowOf(C,u0,v0){piece(C,'townhouse',[u0-20,v0+13],0);piece(C,'townhouse',[u0+20,v0+13],0);
    made(C,[u0,v0+13],0,Q=>{const dw=Q.home('house','home',1,2);plinth(Q,'pl',[-6,6],[-6,6],2,0);Q.lift=2;pod(Q,Q.o,{w:12,d:12,z:11,ax:'v',R:8,dw,lamp:false});Q.lift=0});
    for(const s of [-1,1])made(C,[u0+s*10,v0+13],0,Q=>{Q.box('bd',[-3,3],[-2,2],[12,13],'plank',{top:true,thin:true});for(const b of [-2,1])Q.cut('br'+b,-3,b,13,['rrrrrr'],{r:'rope'})})}
  // the Court's stable (a cluster's): stalls of planks under a leaf roof, a trough, hay
  const stableOf=(C,at)=>made(C,at,0,Q=>{const K=SY(Q.o),dw=Q.home('stable','stable');Q.box('s',[-12,12],[-5,5],[0,10],'plank',{dw,foot:'bark',keep:1});
    Q.roof('s','leaf','u',5,Q.o.roofMat,{o:2,ov:1,lip:1,sweep:2,curl:1,vmat:K.vmat});for(const a of [.18,.5,.82])Q.dec('s.S','Barn',a);Q.prop('trough',[0,8]);Q.prop('hay',[-9,8],0,1)});

  PX.registerBuildStyle('sylvan',{
    // the style table (buildmodels.js LOOK0 its shape)
    look:{people:'elf',
      roof:'leaf',rural:null,walls:['elfwood'],frame:null,stone:'stone',fort:'stone',fieldstone:'stone',wood:'plank',silo:'plank',felt:null,
      trim:'moon',accent:'moon',ground:null,
      forms:['gable','gable','front','hip'],cones:true,hall:'elfhall',door:'DoorLeaf',win:'WinLeaf',finial:'timber',
      // a village's hall of pale living wood under a leaf roof, no chimney, arched door and windows, a lantern by its door
      village:{form:'leaf',door:'DoorLeaf',wall:'elfwood',fmat:'gold',chim:false,foot:false,pick:['WinLeaf'],win:'WinLeaf',vmat:'moon',lamp:['LampLeaf',.6,5],goods:['sacks','crate']},
      elfhall:{wall:'elfwood',vmat:'moon',leaf:'leaf'},treehouse:{leafy:true},
      sylvan:SY0,
      // the desert: pale wood, its roofs of palm fronds (thatch on the leaf's arch), canvas shades, lanterns of moon lavender; the
      // frost: silver birch, ice lanterns, the snow on the leaf roofs; the swamp: pods on stilts, boardwalks
      desert:{wall:'elfwood',roof:'thatch',sylvan:{shade:'canvas'}},swamp:{},frost:{wall:'sylvanBirch',sylvan:{wood:'sylvanBirch',lamp:'LampSylvanIce',glow:'ice'}}},
    // its own types (any culture can build them; their plan the generic)
    own:{types:{
      // a treehouse (the owner's plan, 2026-10-22): the tree its spine, a thick, slightly twisted trunk from the middle of the cell,
      // big roots spread at its foot, a broad crown on top by the climate's species; a pod wrapping the trunk at mid-height (its own
      // look: the Court's pale living wood under a leaf roof tucked under the crown, an arched window, a warm door; another culture's
      // its wall and roof) on a round deck with a thin railing, held by curved branch braces; root steps winding up round the trunk,
      // a moon lantern hanging from the crown; the pod on the trunk's east or west by the seed. One model turned: the trunk stays, the
      // pod and the stair turn round it
      treehouse:{cell:32,dwellings:2,look:{leafy:false},plan(Q,o){const dw=Q.home('treehouse','home'),leafy=o.look.treehouse.leafy,K=SY(o),H=8,rw=leafy?K.wood:'timber',L=o.d.chance(.5)?1:-1,U=(a,b)=>L>0?[a,b]:[-b,-a];
        roots(Q,'rt',[0,-1],2.6,8,5,.9);
        for(const b of [-3,5.5])brace(Q,'bf'+b,[2*L,b<0?-2:0,1],[10*L,b,H-1],rw);
        deck(Q,o,'dk',U(-1,11.5),[-4.5,7.5],H,['S',L>0?'E':'W']);
        Q.lift=H;if(leafy)pod(Q,o,{w:9,d:9,c:[6*L,1],z:9,ax:'v',R:6,sweep:2,dw,wins:[],lamp:false,doorKind:'DoorSylvanPod'});
        else{Q.box('h',U(1.5,10.5),[-3.5,5.5],[0,9],o.wall,{dw});Q.roof('h','gable','v',5,o.roofMat,{lip:1,o:2,ov:2});Q.dec('h.S','Door',.5);for(const k of ['E','W','N'])Q.dec('h.'+k,o.look.win,.5,3)}
        Q.lift=0;tree(Q,o,'tr',[0,-1],2.6,19,22,26);
        // (root steps winding up round the trunk's other side to the deck)
        for(let i=0;i<8;i++){const a=Math.PI*(.55+i*.135),u=L*Math.cos(a)*3.7,v=-1+Math.sin(a)*3.7;Q.box('st'+i,[u-1.2,u+1.2],[v-1.2,v+1.2],[i,i+1],'bark',{top:true,topMat:'moss'})}
        Q.box('lr',U(-10.5,-9.5),[1.5,2.5],[15,19],'rope',{thin:true});Q.box('ln',U(-11,-9),[1,3],[12,15],K.glow,{top:true,topMat:'gold'})}},
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
    types:{
      // --- the 16 px objects: the Court's posts of bark; a stall under a leaf-shaped awning, a tent under a leaf arch of canvas ---
      well(Q,o,base){base(Q,o);tint(Q,{timber:'bark'})},
      signpost(Q,o,base){base(Q,o);tint(Q,{timber:'bark',plank:SY(o).wood})},
      cart(Q,o,base){base(Q,o);tint(Q,{timber:'bark'})},
      wagon(Q,o,base){base(Q,o);tint(Q,{timber:'bark'})},
      // a market stall: a counter of pale wood and its goods under an awning shaped as a leaf (moon lavender, leaf or canvas) on posts
      // of bark, a crate or sacks by it
      stall(Q,o){const d=o.d,K=SY(o),dw=Q.home('stall','trade'),aw=K.shade||d.pick(['moon','leaf','moon']);
        Q.box('ct',[-5,5],[0,3],[0,3],K.wood,{dw,top:true,topMat:d.pick(['crop','linen','gold','flower']),keep:1});
        for(const [a,b] of [[-6,-3],[5,-3],[-6,3],[5,3]])Q.box('po'+a+b,[a,a+1],[b,b+1],[0,6],'bark',{top:true});
        Q.box('aw',[-6,6],[-3.5,4],[6,7],aw,{thin:true,keep:1});Q.roof('aw','leaf','u',3,aw,{o:1,ov:0,lip:1,sweep:1,curl:1,vmat:aw==='moon'?'leaf':K.vmat});Q.dec('ct.S','Goods',.5,0);
        Q.prop(d.pick(['crate','sacks','barrel']),[-3,-1],0,1)},
      // a tent: cloth under a leaf's arch, its verge moon lavender, its flap to the front
      tent(Q,o){const d=o.d,K=SY(o),c=d.pick(['canvas','canvas','linen']),dw=Q.home('tent','home');
        Q.box('t',[-5.5,5.5],[-4.5,4.5],[0,2],c,{dw,keep:1});Q.roof('t','leaf','v',7,c,{o:0,ov:0,lip:1,sweep:1,curl:1,vmat:K.vmat});Q.dec('t.S','Flap',.5,2,true);Q.prop('crate',[5.5,4.5],0,1)},

      // --- 32 px: the houses ---
      // a residence (2 households): a raised cottage of pale living wood on a root plinth under a leaf roof, its gable or its eaves to
      // the front, a root stair to its arched door; or a pod raised on a deck on curved braces, a stair up to it. Better levels a
      // lantern post and herb beds; the desert's a canvas shade and a pool; the swamp's on stilts
      cottage(Q,o){const d=o.d,lv=o.lv,dw=Q.home('cottage','home',lv>=3?2:1),k=d.int(0,2),K=SY(o);
        if(k<2||o.stilts){const ax=k===1?'u':'v',w=ax==='v'?14:18,dd=ax==='v'?16:14;footing(Q,o,'pl',[-w/2,w/2],[-dd/2,dd/2],0);
          pod(Q,o,{w,d:dd,z:11,ax,R:ax==='v'?10:8,dw});Q.lift=0}
        else{const H=4;for(const [a,b] of [[-6,-5],[6,-5],[-6,5],[6,5]])brace(Q,'b'+a+b,[a*.6,b*.6,0],[a,b,H-1]);deck(Q,o,'dk',[-9,9],[-7,9],H,['S','E','W'],[-3,3]);
          Q.lift=H;pod(Q,o,{w:14,d:12,c:[0,-1],z:11,ax:'v',R:9,dw});Q.lift=0;for(let i=0;i<H-1;i++)Q.box('st'+i,[-2.5,2.5],[9+(H-1-i)*1.5,10.5+(H-1-i)*1.5],[0,i+1],'bark',{top:true,topMat:i?null:'moss'})}
        if(K.shade)shade(Q,o,'sh',[7,13],[2,12],7);
        if(lv>=2){lantern(Q,o,'ln',[-10,10],7);Q.bed([-14,-10],[-6,4],'crop')}},
      // a house of two storeys (3 households): pale living wood on a root plinth, its upper storey jettied under a leaf roof's gable,
      // an arched door below, a balcony with its railing on curved braces before the upper door
      townhouse(Q,o){const K=SY(o),d=o.d,dw=Q.home('townhouse','home',2),w=16,dd=13,da=d.pick([.3,.7]);footing(Q,o,'pl',[-w/2,w/2],[-dd/2,dd/2],(da-.5)*w);const L=Q.lift;
        Q.box('lo',[-w/2,w/2],[-dd/2,dd/2],[0,11],K.wood,{dw});Q.dec('lo.S','DoorLeaf',da);Q.dec('lo.S','WinLeaf',1-da,3);Q.dec('lo.N','WinLeaf',.5,3);for(const k of ['E','W'])for(const x of [.3,.7])Q.dec('lo.'+k,'WinLeaf',x,3);
        for(const s of [-1,1])brace(Q,'bc'+s,[s*4,dd/2,6],[s*4,dd/2+3,10.5]);deck(Q,o,'bc',[-5.5,5.5],[dd/2,dd/2+3.5],11,['S','E','W']);
        Q.lift=L+11;pod(Q,o,{w:w+1,d:dd+1,c:[0,.5],z:8,ax:'v',R:7,dw,doorKind:'DoorSylvanPod',lamp:false,wins:[.12,.88]});Q.lift=0},
      // a fisher's hut: a pod on bark stilts, its deck round the front with a railing and a boardwalk down; its net on a rack beside
      fisherhut(Q,o){const K=SY(o),dw=Q.home('fisherhut'),H=4;for(const [a,b] of [[-7,-6],[5,-6],[-7,6],[5,6]])Q.box('p'+a+b,[a,a+2],[b,b+2],[0,H],'bark',{top:true});
        deck(Q,o,'dk',[-8,8],[-7,10],H,['S','E','W'],[-2.5,2.5]);Q.lift=H;pod(Q,o,{w:12,d:9,c:[0,-2.5],z:10,ax:'u',R:6,dw,wins:[]});Q.lift=0;
        for(let i=0;i<H-1;i++)Q.box('bw'+i,[-2,2],[10+(H-2-i)*1.6,11.6+(H-2-i)*1.6],[i,i+1],'plank',{top:true});
        for(const b of [-4,4])Q.beam('np'+b,[11,b,0],[11,b,8],'bark');Q.cut('nt',-3,10.5,1,['nnnnnnn','n.n.n.n','nnnnnnn','n.n.n.n','nnnnnnn','n.n.n.n','.nnnnn.'],{n:'net'},{alongV:true});lantern(Q,o,'ln',[-11,8],7)},
      // a moon shrine (the Court's chapel): a slender hall of pale living wood on a root plinth under a tall leaf roof, a lantern turret
      // of moon glass on its front peak (a little leaf cone, a gold curled leaf), banners of moon lavender; moon lanterns at its stair
      chapel(Q,o){const K=SY(o),dw=Q.home('chapel','worship'),w=13,dd=16,z=11,R=11;plinth(Q,'pl',[-w/2,w/2],[-dd/2,dd/2],2,0);Q.lift=2;
        pod(Q,o,{w,d:dd,z,ax:'v',R,dw,lamp:false,curl:false,wins:[]});for(const k of ['E','W'])Q.dec('h.'+k,'Banner',.5,1);
        Q.round('bc',[0,dd/2-2],2.3,[z+R-4,z+R+1],K.wood,{form:'cone',leaf:true,rise:5,mat:o.roofMat},{dw});Q.dec('bc.S','WinLeaf',.5,0);Q.box('fn',[-1.5,1.5],[dd/2-3.5,dd/2-.5],[z+R+5,z+R+7],'gold',{top:true});
        Q.lift=0;for(const s of [-1,1])lantern(Q,o,'l'+s,[s*8,dd/2+4],6)},
      // a warden's lookout (the Court's tower): a platform on four tall posts of bark braced with pale wood, its railing, a narrow round
      // lookout of pale living wood under a leaf cone (a gold curled leaf), a ladder up the front
      tower(Q,o){const K=SY(o),dw=Q.home('tower','defence'),H=13;Q.flag=true;
        for(const [a,b] of [[-5,-5],[5,-5],[-5,5],[5,5]])Q.box('p'+a+b,[a-1,a+1],[b-1,b+1],[0,H],'bark',{top:true});
        Q.beam('xs',[-4,5,1],[4,5,H-3],K.wood);Q.beam('xn',[4,-5,1],[-4,-5,H-3],K.wood);Q.beam('xe',[5,4,1],[5,-4,H-3],K.wood);Q.beam('xw',[-5,-4,1],[-5,4,H-3],K.wood);
        deck(Q,o,'dk',[-8,8],[-8,8],H,['S','E','W','N'],[-2,1]);Q.lift=H;
        Q.round('lk',[0,-1.5],4,[0,8],K.wood,{form:'cone',leaf:true,rise:7,mat:o.roofMat},{dw});curl(Q,'fn',0,-1.5,14,1,'gold');
        Q.dec('lk.S','DoorSylvanPod',.5);for(const k of ['E','W','N'])Q.dec('lk.'+k,'WinLeaf',.5,3);Q.lift=0;
        Q.cut('ld',-1.5,8,0,Array.from({length:H},(_,i)=>i%2?'t.t':'ttt'),{t:'bark'},{dv:2})},
      // a smithy: pale living wood under a leaf roof, its forge open to the front in a stone arch, a great chimney of fieldstone; a leaf
      // awning on bark posts over the anvil, coal and a quenching trough
      smithy(Q,o){const K=SY(o),dw=Q.home('smithy','work');
        Q.box('f',[-11,4],[-8,4],[0,11],K.wood,{dw,foot:'stone'});Q.roof('f','leaf','u',5,o.roofMat,{o:1,ov:1,lip:1,sweep:2,curl:1,vmat:K.vmat});
        Q.dec('f.S','ForgeS',.45);Q.dec('f.N','DoorLeaf',.5);Q.dec('f.W','WinLeaf',.3,3);Q.dec('f.W','WinLeaf',.7,3);
        Q.chim([6.5,-2],0,20,5);Q.box('aw',[-11,4],[4,9],[10,11],'bark',{thin:true});Q.roof('aw','shed','u',1,o.roofMat,{o:1,ov:0,hi:'b0'});
        for(const a of [-11,3])Q.box('po'+a,[a,a+1.5],[7.5,9],[0,10],'bark',{top:true});Q.prop('anvil',[-9,6.5]);Q.prop('coal',[7,7])},
      // a garden barn: planks on a bark footing under a tall leaf roof, its great braced doors, a round window in the gable, herb beds
      barn(Q,o){const K=SY(o),dw=Q.home('barn','store');Q.box('b',[-9,9],[-8,8],[0,11],'plank',{dw,foot:'bark'});Q.roof('b','leaf','v',10,o.roofMat,{o:2,ov:1,lip:1,sweep:2,curl:1,vmat:K.vmat});
        curl(Q,'fn',0,9,22,1,K.leaf);Q.dec('b.S','Barn',.5);Q.dec('b.S','WinRound',.5,13,true);Q.dec('b.N','DoorLeaf',.5);for(const k of ['E','W']){Q.dec('b.'+k,'Hatch',.3,4);Q.dec('b.'+k,'WinLeaf',.7,3)}
        Q.bed([-14,-10],[-4,10],'crop');Q.prop('hay',[10,11],0,1.2)},
      // a dry store (the Court's granary): a pavilion raised on posts of bark, moon-lavender guards on them against damp and vermin, a
      // store of pale wood under a leaf roof (or round under a leaf cone), a lantern under its eaves, a stair up to its door
      granary(Q,o){const K=SY(o),d=o.d,dw=Q.home('granary','store'),H=7;
        for(const [a,b] of [[-6,-5],[6,-5],[-6,5],[6,5]]){Q.round('ps'+a+b,[a,b],1.1,[0,H],'bark',null);Q.round('rg'+a+b,[a,b],2.2,[H-2,H-1],K.vmat,{form:'lid',mat:K.vmat})}
        Q.box('fl',[-8,8],[-7,7],[H-1,H],'plank',{top:true,thin:true});Q.lift=H;
        if(o.seed%2){pod(Q,o,{w:13,d:11,z:8,ax:'v',R:8,dw,doorKind:'DoorSylvanPod',lamp:false,wins:[]});Q.dec('h.S',K.lamp,.85,5)}
        else{Q.round('g',[0,0],6.5,[0,10],K.wood,{form:'cone',leaf:true,rise:7,mat:o.roofMat},{dw});Q.dec('g.S','DoorSylvanPod',.5);Q.dec('g.S',K.lamp,.85,6);for(const k of ['E','W','N'])Q.dec('g.'+k,'Hatch',.5,4)}
        Q.lift=0;for(let i=0;i<H-1;i++)Q.box('s'+i,[-2,2],[7+(H-2-i)*1.5,8.5+(H-2-i)*1.5],[i,i+1],'plank',{top:true});Q.prop('sacks',[8,10])},
      // a windmill: a round tower of pale living wood on a mossed root flare under a leaf cone, its sails on the front round the hub
      windmill(Q,o){const K=SY(o),dw=Q.home('windmill','work');Q.round('rf',[0,0],7,[0,1.5],'bark',{form:'cone',rise:1,mat:'moss',o:0,lip:0});
        Q.round('m',[0,0],5.5,[0,14],K.wood,{form:'cone',leaf:true,rise:7,mat:o.roofMat},{dw});Q.dec('m.S','DoorLeaf',.5);for(const k of ['N','E','W'])Q.dec('m.'+k,'WinLeaf',.5,8);
        Q.box('hub',[-1,1],[4.5,7.5],[11,13],'bark',{top:true});PX.planKit.sails(Q,0,6,12,12);tint(Q,{timber:'bark'});Q.prop('sacks',[-7,1])},
      // a watermill: a hall of pale living wood under a leaf roof, its wheel turning in the race before it, fed by a flume on posts
      watermill(Q,o){const K=SY(o),dw=Q.home('watermill','work');pod(Q,o,{w:14,d:16,c:[-4,-3],z:11,ax:'v',R:9,dw,door:.5});
        Q.bed([-15,15],[8,13],'water');Q.wheel('wh',8,7,5,5,K.wood,2);Q.box('fl',[4,13],[6.5,9.5],[11,12],'plank',{top:true,topMat:'water'});Q.box('fp',[11,13],[6.5,8],[0,11],'bark',{top:true})},
      // a store hall (the Court's warehouse): long, pale living wood under a leaf roof, its wide arched doors, a loft with its hatch and
      // a hoist of bark, a crate on the rope
      warehouse(Q,o){const K=SY(o),dw=Q.home('warehouse','store');Q.box('w',[-11,11],[-8,8],[0,12],K.wood,{dw,foot:'bark'});Q.roof('w','leaf','u',8,o.roofMat,{o:1,ov:1,lip:1,sweep:3,curl:1,vmat:K.vmat});
        Q.dec('w.S','DoorSylvanWide',.28);Q.dec('w.S','WinLeaf',.88,3);Q.dec('w.N','DoorLeaf',.5);for(const k of ['E','W'])for(const a of [.3,.7])Q.dec('w.'+k,a<.5?'Hatch':'WinLeaf',a,4);
        Q.box('lf',[2,8],[2,8],[11,16],K.wood,{});Q.roof('lf','leaf','v',4,o.roofMat,{o:1,ov:0,lip:1,sweep:1,curl:1,vmat:K.vmat});Q.dec('lf.S','Hatch',.5,1);
        Q.box('ho',[4,6],[7,11],[16,18],'bark',{top:true});Q.box('rp',[4.5,5.5],[9.5,10.5],[10,16],'rope',{thin:true});Q.box('hc',[3.5,6.5],[8.5,11.5],[7,10],'plank',{top:true});
        Q.prop('crate',[-9,10]);Q.prop('barrel',[10,10])},

      // --- 64 px ---
      // a tavern: a hall of two storeys of pale living wood on a root plinth under a great leaf roof, its sign and lantern by the door;
      // a terrace of planks before it with its railing, benches and lantern posts; a back wing; a yard in a fence, a shed
      tavern(Q,o){const K=SY(o),dw=Q.home('tavern','inn',2);Q.box('pl',[-28,4],[-2,14],[0,2],'bark',{top:true});deck(Q,o,'tr',[-28,4],[14,21],2,['S','E','W'],[-15,-9]);
        for(const a of [-27,-15,-9,3])Q.box('tp'+a,[a,a+1],[19.5,20.5],[0,1],'bark',{top:true});for(const s of [0,1])Q.box('ts'+s,[-15,-9],[21+s*1.5,22.5+s*1.5],[1-s,2-s],'bark',{top:true,topMat:s?'moss':null});
        Q.lift=2;pod(Q,o,{n:'h',w:30,d:16,c:[-12,6],z:19,ax:'u',R:10,sweep:3,dw,door:.5,wins:[.1,.3,.7,.9]});for(const x of [.1,.3,.86])Q.dec('h.S','WinLeaf',x,12);Q.dec('h.S','Sign',.62,11);
        Q.prop('bench',[-22,17]);Q.prop('bench',[-2,17]);Q.lift=0;pod(Q,o,{n:'bw',w:14,d:12,c:[-20,-10],z:11,ax:'v',R:8,dw,door:.5,lamp:false});
        for(const a of [-28,4])lantern(Q,o,'l'+a,[a+(a<0?-1:1),22],7);if(K.shade)shade(Q,o,'sd',[-6,4],[14,21],8);
        Q.fence([[8,18],[28,18],[28,-14]],[[14,20,0]],3);PX.planKit.shed(Q,'sh',[18,-19],16,10,9,o.roofMat);tint(Q,{timber:'bark'});
        Q.prop('trough',[22,-3]);Q.prop('barrel',[25,4]);Q.prop('barrel',[11,-6]);Q.prop('bench',[18,8])},
      // a temple (the Court's church): a long nave of pale living wood on a root plinth under a leaf roof, a round tower at its front
      // end rising to a leaf spire with a gold curled leaf and a balcony ring, a round apse under a leaf cone; arched windows of moon
      // glass, a round one high in the tower, moon lanterns along the front
      church(Q,o){const K=SY(o),dw=Q.home('church','worship');Q.box('pl',[-24,21],[-11,11],[0,2],'bark',{top:true});Q.lift=2;
        Q.box('n',[-9,14],[-9,9],[0,14],K.wood,{dw});Q.roof('n','leaf','u',11,o.roofMat,{o:2,ov:1,lip:1,sweep:3,curl:1,vmat:K.vmat});
        Q.round('ap',[14,0],6.5,[0,11],K.wood,{form:'cone',leaf:true,rise:8,mat:o.roofMat},{dw});
        Q.round('tw',[-16,0],6.5,[0,24],K.wood,{form:'cone',leaf:true,rise:13,mat:o.roofMat},{dw});curl(Q,'fn',-16,0,36,1,'gold');Q.round('bal',[-16,0],8,[15,16],'bark',{form:'lid',mat:'bark'});
        Q.dec('tw.S','DoorLeaf',.5);Q.dec('tw.S','WinRound',.5,17);for(const k of ['E','W','N'])Q.dec('tw.'+k,'WinLeaf',.5,8);
        for(const k of ['S','N'])for(const a of [.15,.38,.62,.85])Q.dec('n.'+k,'WinLeaf',a,4);Q.dec('n.S','Banner',.27,8);Q.dec('n.S','Banner',.73,8);Q.dec('n.E','WinRound',.5,7);Q.dec('ap.S','WinLeaf',.5,3);Q.dec('ap.E','WinLeaf',.5,3);
        Q.lift=0;for(const s of [0,1])Q.box('ts'+s,[-19,-13],[11+s*1.5,12.5+s*1.5],[1-s,2-s],'bark',{top:true,topMat:s?'moss':null});for(const u of [-3,10])lantern(Q,o,'l'+u,[u,14],7)},
      // a long hall (4 households): long and low, pale living wood on a root plinth under a leaf roof swept up to its curled ends, its
      // door in the middle and one at the back; a pod of its own beside it, herb beds, a woodpile
      longhouse(Q,o){const K=SY(o),dw=Q.home('longhouse','home');footing(Q,o,'pl',[-24,20],[-2,16],-2);pod(Q,o,{n:'h',w:44,d:18,c:[-2,7],z:13,ax:'u',R:8,sweep:3,dw,door:.5,back:true,wins:[.1,.28,.72,.9]});
        Q.lift=0;pod(Q,o,{n:'an',w:10,d:10,c:[-14,-17],z:9,ax:'v',R:6,dw,door:.5,lamp:false,doorKind:'DoorSylvanPod'});
        Q.bed([4,18],[-24,-14],'crop');Q.prop('woodpile',[24,-16],0);lantern(Q,o,'ln',[-27,20],7);if(K.shade)shade(Q,o,'sh',[22,30],[4,16],8)},
      // a warden's keep (straight on; the Court's castle): a great living tree at the back, its roots spread, the warden hall of pale
      // living wood wrapped round its foot under a leaf roof, two warden lookouts either side linked to the tree by plank bridges with
      // rope rails; a pool and lanterns before it; walls by its fortification, their towers under leaf cones
      keep(Q,o){const K=SY(o),f=o.fort|0,dw=Q.home('keep','hall',3);Q.flag=true;
        roots(Q,'gr',[0,-17],4.5,13,6,.3);tree(Q,o,'gt',[0,-17],4.5,25,29,40,true);
        pod(Q,o,{n:'hl',w:22,d:12,c:[0,-6],z:13,ax:'u',R:7,sweep:2,dw,door:.5,wins:[.14,.86]});Q.dec('hl.S','Banner',.3,4);Q.dec('hl.S','Banner',.7,4);
        for(const s of [-1,1]){Q.round('t'+s,[s*17,-12],4,[0,22],K.wood,{form:'cone',leaf:true,rise:8,mat:o.roofMat},{dw});Q.dec('t'+s+'.S','WinLeaf',.5,15);Q.dec('t'+s+'.S','DoorSylvanPod',.5);
          const a=s<0?[-13,-5]:[5,13];Q.box('bd'+s,a,[-14,-11],[17,18],'plank',{top:true,thin:true});Q.cut('br'+s,a[0],-11,18,['rrrrrrrr'],{r:'rope'})}
        Q.round('pool',[-12,9],4,[0,1],'stone',{form:'water'});for(const s of [-1,1])lantern(Q,o,'ln'+s,[s*6,6],7);
        if(f)walls(Q,-27,27,-30,26,f,true,1)},
      // a gate (straight on): an arch of pale living wood under a leaf roof between two warden towers under leaf cones, a walkway with
      // its railing linking their tops over the gate, banners; walls either side
      gatehouse(Q,o){const K=SY(o),st=o.look.fort,dw=Q.home('gatehouse','defence');Q.flag=true;
        Q.box('g',[-9,9],[-6,6],[0,17],K.wood,{dw});Q.roof('g','leaf','u',7,o.roofMat,{o:1,ov:1,lip:1,sweep:2,curl:1,vmat:K.vmat});Q.dec('g.S','Gate',.5);
        deck(Q,o,'wk',[-10,10],[6,9],17,['S']);for(const s of [-1,1])brace(Q,'wb'+s,[s*6,6,10],[s*6,8.5,16],'bark');
        for(const s of [-1,1]){Q.round('t'+s,[s*16,0],7,[0,26],K.wood,{form:'cone',leaf:true,rise:12,mat:o.roofMat},{dw});curl(Q,'fn'+s,s*16,0,37,1,'gold');Q.dec('t'+s+'.S','WinLeaf',.5,19);Q.dec('t'+s+'.S','Banner',.5,8);
          Q.box('w'+s,s<0?[-30,-23]:[23,30],[-4,4],[0,16],st,{top:true,topMat:'moss'})}Q.marks.gate=[0,6,0]},
      // a village's centre (straight on): the hall and green as every culture's (look.village: the Court's hall of pale living wood),
      // moon lanterns by the path; fortified, a hedge of living green round it all, its gate between two lantern posts
      village(Q,o,base){const f=(o.fort|0)>0;base(Q,Object.assign({},o,{fort:0}));tint(Q,{timber:'bark'});for(const s of [-1,1])lantern(Q,o,'lp'+s,[s*5,20],6);
        if(f){const e=29,b=27;for(const [n,u,v] of [['hN',[-e,e],[-b-3,-b]],['hW',[-e,-e+3],[-b-3,b]],['hE',[e-3,e],[-b-3,b]],['hS0',[-e,-6],[b-3,b]],['hS1',[6,e],[b-3,b]]])Q.box(n,u,v,[0,6],'canopy',{top:true});
          for(const s of [-1,1])lantern(Q,o,'gp'+s,[s*7.5,b-1.5],9);Q.marks.gate=[0,b,0]}if(SY(o).shade)Q.round('pool',[12,-1],3.5,[0,1],'stone',{form:'water'})},
      // the great tree hall (straight on; a town's centre at 64, a city's or capital's at 128): a great living tree, its broad roots, a
      // hall of pale living wood under a leaf roof built into its foot (a great arched door), a ring of platforms round the trunk with
      // its railing, water spilling from it into pools either side, a moon-lantern beacon crowning the tree; walls by its fortification
      citadel(Q,o){const K=SY(o),k=o.capital?2:1,kz=o.capital?1.6:1,Z=z=>Math.round(z*kz),f=o.fort|0,dw=Q.home('citadel','hall',3),tv=-16*k,tr=6*k,cz=Z(27)+(o.capital?12:0);Q.flag=true;
        roots(Q,'gr',[0,tv],tr,tr*2.4,7,.2);tree(Q,o,'gt',[0,tv],tr,cz,cz+Z(4),46*k);
        Q.round('ring',[0,tv+2*k],tr+6*k,[Z(14)-1,Z(14)],'plank',{form:'lid',mat:'plank'});Q.round('rl',[0,tv+2*k],tr+6*k,[Z(14)+2,Z(14)+3],K.wood,null);
        for(const s of [-1,1])brace(Q,'rb'+s,[s*tr*.8,tv+2,2],[s*(tr+5*k),tv+3*k,Z(14)-1]);
        pod(Q,o,{n:'hl',w:18*k,d:10*k,c:[0,tv+tr+3*k],z:Z(13),ax:'v',R:Z(10),sweep:2,dw,door:.5,wins:[.15,.85]});
        for(const s of [-1,1]){pod(Q,o,{n:'w'+s,w:10*k,d:10*k,c:[s*19*k,tv+6*k],z:Z(11),ax:'v',R:Z(7),dw,door:.5,lamp:false,doorKind:'DoorSylvanPod'});
          Q.box('sp'+s,[s*(tr+5*k)-1.5,s*(tr+5*k)+1.5],[tv+3*k+tr+5*k,tv+3*k+tr+5*k+1],[0,Z(14)],'water',{thin:true});Q.round('po'+s,[s*(tr+5*k),tv+tr+11*k],4*k,[0,1],'stone',{form:'water'})}
        const bz=cz+3+Math.round(46*k*.12);Q.round('bc',[0,tv-5],2*k,[bz,bz+3*k],K.glow,{form:'cone',rise:2*k,mat:'gold',o:0,lip:0});
        for(const s of [-1,1])lantern(Q,o,'ln'+s,[s*8*k,8*k],Z(7));if(o.capital)for(const s of [-1,1])pod(Q,o,{n:'cq'+s,w:14,d:12,c:[s*36,10],z:12,ax:'u',R:7,dw,door:.5,lamp:false});
        if(f||o.capital)walls(Q,-27*k,27*k,(o.capital?-56:-30),27*k,f||3,true,k)},

      // --- 32 px: work places ---
      // a mine: a careful mouth into the hillside (rough rock, its crown mossed), framed by a portal of curved bark posts under a little
      // leaf roof, moon lanterns either side; rails out of it with a cart of ore, spoil
      minehead(Q,o){const K=SY(o),rk={desert:'sandrock',swamp:'darkrock'}[o.env]||'rock',moss=o.env==='desert'?0:.45,dw=Q.home('minehead','work');
        crag(Q,'h',[0,-10],10,7,10,rk,moss,o.seed);crag(Q,'h2',[-10,-2],6,4,6,rk,moss,o.seed+1);crag(Q,'h4',[10,-3],5.5,3,6,rk,moss,o.seed+3);Q.box('a',[-5,5],[-2,4],[0,12],rk,{dw,top:true,topMat:moss?'moss':rk});Q.dec('a.S','Adit',.5,0);
        for(const s of [-1,1])brace(Q,'po'+s,[s*5.5,5,0],[s*4,5,10]);Q.box('lt',[-6.5,6.5],[3.5,6.5],[10,11],K.wood,{top:true});Q.roof('lt','leaf','u',3,o.roofMat,{o:1,ov:1,lip:1,sweep:1,curl:1,vmat:K.vmat});
        for(const s of [-1,1])lantern(Q,o,'ln'+s,[s*9,7],6);Q.rails('r',6,13,0,false);Q.prop('minecart',[0,13],0,1.5);Q.prop('spoil',[-10,10],0,2)},
      // a lumber yard: a fallen tree on the ground, its cut end pale, a work platform beside it under a leaf roof on bark posts, the
      // tool hut, and a careful nursery of saplings in a bed (never a clear-cut: no stumps)
      lumbershed(Q,o){const K=SY(o),dw=Q.home('lumbershed','work');
        Q.box('lg',[-13,4],[5,10],[0,5],'bark',{top:true,topMat:'moss'});Q.box('le',[4,5],[5,10],[0,5],K.wood,{top:true});Q.beam('lb',[-8,7,4],[-11,12,7],'bark');
        deck(Q,o,'wp',[-12,4],[-8,2],2,['W','N']);for(const [a,b] of [[-12,-8],[3,-8],[-12,1],[3,1]])Q.box('sp'+a+b,[a,a+1],[b,b+1],[2,10],'bark',{top:true});
        Q.box('sr',[-12,4],[-8,2],[10,11],'bark',{thin:true});Q.roof('sr','leaf','u',4,o.roofMat,{o:1,ov:1,lip:1,sweep:1,curl:1,vmat:K.vmat});Q.prop('logs',[-5,-4],0,1,2);Q.prop('stump',[0,-1],0,1,2);
        pod(Q,o,{n:'h',w:8,d:8,c:[10,-4],z:9,ax:'v',R:6,dw,doorKind:'DoorSylvanPod',lamp:false});
        Q.bed([7,14],[4,13],'crop');for(let i=0;i<4;i++){const u=8.5+(i%2)*4,v=6+(i>>1)*4;Q.box('sk'+i,[u-.5,u+.5],[v-.5,v+.5],[0,1],'bark',{top:true});Q.round('sa'+i,[u,v],1.5,[1,2],'canopy',{form:'cone',rise:2,mat:'canopy',o:0,lip:0})}},
      // a quarry's crane in the Court's woods: the crane's mast and jib of bark and pale wood, its hut under a leaf roof
      crane(Q,o,base){base(Q,o);tint(Q,{timber:'bark',plank:SY(o).wood})}},

    // its layouts (laid out for a south street, turned whole): the Court's grounds earth and moss, never cobbles
    clusters:{
      // a town row: houses of two storeys either side of a narrower pod, their upper floors linked by plank bridges with rope rails;
      // gardens, a shed and a washing line behind
      row(C){rowOf(C,0,0);C.Q.ground=null;const R=C.d;made(C,[R.pick([-16,14]),-20],0,Q=>hut(Q,Q.o,'s',[0,0],12,8,Q.home('shed','store')));
        C.Q.parts.push({k:'bed',name:'g',u:[R.pick([2,-28]),R.pick([2,-28])+14],v:[-30,-24]});P(C,'washing',[R.pick([-6,4]),-12])},
      // a town quarter (128): four rows round a green, its living tree on a mossed plinth with moon lanterns, benches, gardens
      quarter(C){C.Q.ground=null;for(const u of [-32,32])for(const v of [-38,38])rowOf(C,u,v);
        made(C,[0,0],0,Q=>{Q.round('pl',[0,0],7,[0,1],'bark',{form:'lid',mat:'moss'});tree(Q,Q.o,'t',[0,0],2.2,15,17,22);for(const s of [-1,1])lantern(Q,Q.o,'l'+s,[s*11,6],7)});
        P(C,'bench',[-14,12],1);P(C,'bench',[14,12],3);C.Q.parts.push({k:'bed',name:'g1',u:[-60,-44],v:[4,12]},{k:'bed',name:'g2',u:[44,60],v:[-12,-4]})},
      // a hamlet's yard: two pods in a fenced garden, beds, a well, a young living tree, a lantern by the gate
      yard(C,base){base(C);made(C,[18,-17],0,Q=>tree(Q,Q.o,'t',[0,0],1.6,13,15,16));made(C,[8,25],0,Q=>lantern(Q,Q.o,'l',[0,0],6))},
      // a forest garden (the Court's farm): the farmer's pod and a garden barn; terraces of raised beds stepping down to the path,
      // a pergola of hanging baskets, herb beds, two little orchard platforms each round its fruit tree; the desert's water channels
      farmstead(C){const K=SY(C.o),des=!!K.shade;piece(C,'cottage',[-15,-15],0,{lv:1,cut:['prop']});piece(C,'barn',[17,-9],1,{cut:['prop']});
        made(C,[-18,12],0,Q=>{for(let i=0;i<3;i++)Q.box('t'+i,[-12,12],[-8+i*5,-3+i*5],[0,3-i],'bark',{top:true,topMat:'crop'});
          if(des)for(let i=0;i<2;i++)Q.box('ch'+i,[-12,12],[-3.5+i*5,-2.5+i*5],[0,2.5-i],'stone',{top:true,topMat:'water'})});
        made(C,[2,6],0,Q=>{for(const s of [-1,1])Q.box('pp'+s,[s*5-.5,s*5+.5],[-.5,.5],[0,8],'bark',{top:true});Q.box('pb',[-6,6],[-.5,.5],[8,9],K.wood,{top:true});
          for(const a of [-3,0,3]){Q.box('br'+a,[a-.5,a+.5],[-.5,.5],[6,8],'rope',{thin:true});Q.box('bk'+a,[a-1,a+1],[-1,1],[4,6],'plank',{top:true,topMat:'flower'})}});
        for(const [u,v] of [[10,20],[23,15]])made(C,[u,v],0,Q=>{Q.round('dk',[0,0],4.5,[1,2],'plank',{form:'lid',mat:'plank'});Q.round('rl',[0,0],4.5,[3,4],K.wood,null);tree(Q,Q.o,'t',[0,0],1,7,9,12)});
        C.Q.parts.push({k:'bed',name:'h1',u:[-6,4],v:[18,27]});P(C,'sacks',[-2,0])},
      // an inn: its hall of two storeys on a root plinth under a leaf roof, the sign and lantern by the door; the stable across the
      // yard (stalls under a leaf roof), a well, a cart, lanterns
      inn(C){C.Q.ground=null;made(C,[-6,17],0,Q=>{const K=SY(Q.o),dw=Q.home('inn','inn',2);plinth(Q,'pl',[-14,14],[-6.5,6.5],2,0);Q.lift=2;
          pod(Q,Q.o,{n:'h',w:28,d:13,z:18,ax:'u',R:9,sweep:3,dw,door:.5,wins:[.12,.32,.68,.88]});for(const x of [.12,.88])Q.dec('h.S','WinLeaf',x,11);Q.dec('h.S','Sign',.68,10);Q.lift=0});
        stableOf(C,[12,-18]);piece(C,'well',[-22,-14],0);piece(C,'cart',[22,4],0);made(C,[-24,26],0,Q=>lantern(Q,Q.o,'l',[0,0],7))},
      // a herd's shelter: stalls under a leaf roof on bark posts, a paddock in its fence, a trough, a haystack, a lantern
      pasture(C){stableOf(C,[-14,-16]);C.Q.parts.push({k:'fence',name:'pd',pts:[[0,28],[30,28],[30,-8],[0,-8],[0,28]],h:4,gates:[[4,10,3]]});P(C,'trough',[14,10]);piece(C,'haystack',[-18,14],0);made(C,[-4,24],0,Q=>lantern(Q,Q.o,'l',[0,0],6))},
      // a lumber yard: the fallen tree's work platform, the woodcutter's pod, a second nursery bed of saplings, a woodpile, a cart;
      // never a clear-cut (no stumps)
      lumber(C){piece(C,'lumbershed',[-6,12],0);piece(C,'cottage',[14,-18],0,{lv:1,cut:['prop']});piece(C,'woodpile',[22,10],0);piece(C,'cart',[-20,-4],0);
        made(C,[-16,-20],0,Q=>{Q.bed([-8,8],[-4,4],'crop');for(let i=0;i<6;i++){const u=-6+(i%3)*6,v=-2+(i>>1>0?4:0)*(i>2?1:0);Q.round('sa'+i,[u,v],1.5,[1,2],'canopy',{form:'cone',rise:2,mat:'canopy',o:0,lip:0});Q.box('sk'+i,[u-.5,u+.5],[v-.5,v+.5],[0,1],'bark',{top:true})}})},
      // a weavers' workshop: the weavers' hall, an open weaving porch under a leaf roof with its loom, lines of dyed cloth, dye vats,
      // a bridge of planks with rope rails from the hall to a pod across the yard
      workshop(C){C.Q.ground=null;piece(C,'warehouse',[-12,-14],0);piece(C,'cottage',[18,-16],0,{lv:1,cut:['prop']});
        made(C,[-12,14],0,Q=>{const K=SY(Q.o);for(const [a,b] of [[-10,-5],[9,-5],[-10,5],[9,5]])Q.box('p'+a+b,[a,a+1],[b,b+1],[0,9],'bark',{top:true});Q.box('r',[-10,10],[-5,6],[9,10],'bark',{thin:true});
          Q.roof('r','leaf','u',4,Q.o.roofMat,{o:1,ov:1,lip:1,sweep:1,curl:1,vmat:K.vmat});for(const s of [-1,1])Q.box('lp'+s,[s*4-.5,s*4+.5],[-.5,.5],[0,6],'bark',{top:true});
          Q.cut('lm',-4,0,1,['bbbbbbbb','m.m.m.m.','.m.m.m.m','m.m.m.m.','mmmmmmmm'],{b:'bark',m:K.vmat})});
        made(C,[16,12],0,Q=>{for(const s of [-1,1])Q.box('cp'+s,[s*8-.5,s*8+.5],[-.5,.5],[0,8],'bark',{top:true});Q.box('cl',[-8,8],[-.5,.5],[7,8],'rope',{thin:true});
          ['moon','canvasB','flower','awningG','gold'].forEach((m,i)=>Q.box('c'+i,[-6.5+i*3,-4.5+i*3],[-.5,.5],[3+(i%2),7],m,{thin:true}));
          for(const [u,m] of [[-5,'moon'],[0,'canvasB'],[5,'flower']])Q.round('v'+u,[u,6],1.8,[0,2],'plank',{form:'lid',mat:m})});
        made(C,[6,-15],0,Q=>{Q.box('bd',[-8,8],[-1.5,1.5],[7,8],'plank',{top:true,thin:true});for(const s of [-1,1]){Q.box('bp'+s,[s*4-.5,s*4+.5],[-.5,.5],[0,7],'bark',{top:true});Q.cut('br'+s,-8,s<0?-1.5:.5,8,['rrrrrrrrrrrrrrrr'],{r:'rope'})}})},
      // a market: stalls under leaf-shaped awnings round a green with its living tree on a mossed plinth, moon lanterns, carts, crates
      market(C){C.Q.ground=null;piece(C,'stall',[-18,-18],0);piece(C,'stall',[0,-22],0);piece(C,'stall',[18,-18],0);piece(C,'stall',[-22,4],3);piece(C,'stall',[22,4],1);
        made(C,[0,0],0,Q=>{Q.round('pl',[0,0],5.5,[0,1],'bark',{form:'lid',mat:'moss'});tree(Q,Q.o,'t',[0,0],1.6,12,14,16);for(const s of [-1,1])lantern(Q,Q.o,'l'+s,[s*8,5],6);if(SY(Q.o).shade)Q.round('pool',[0,9],3,[0,1],'stone',{form:'water'})});
        piece(C,'cart',[-14,22],0);piece(C,'crates',[14,22],0);piece(C,'barrels',[2,24],0)},
      // a brewhouse: two storeys of pale living wood under a leaf roof, a rack of drying herbs, its dry store, casks
      brewery(C){made(C,[-8,15],0,Q=>{const dw=Q.home('brewery','work',2);plinth(Q,'pl',[-12,12],[-6.5,6.5],2,-2);Q.lift=2;pod(Q,Q.o,{n:'h',w:24,d:13,z:17,ax:'u',R:8,sweep:2,dw,door:.42,wins:[.12,.8]});Q.dec('h.S','WinLeaf',.2,10);Q.dec('h.S','WinLeaf',.8,10);Q.lift=0});
        piece(C,'granary',[16,-16],0,{cut:['prop']});piece(C,'barrels',[20,12],0);piece(C,'barrels',[-20,-16],0);
        made(C,[-4,-16],0,Q=>{for(const s of [-1,1])Q.box('hp'+s,[s*6-.5,s*6+.5],[-.5,.5],[0,8],'bark',{top:true});Q.box('hb',[-6,6],[-.5,.5],[7,8],SY(Q.o).wood,{top:true});for(let i=0;i<4;i++)Q.box('hh'+i,[-4.5+i*3,-3.5+i*3],[-.5,.5],[4,7],'crop',{thin:true})})},
      // a fishery: the fishers' huts on stilts, their nets, a boardwalk pier out over the water with lantern posts, barrels
      fishery(C,base){base(C);C.Q.parts.push({k:'bed',name:'wt',u:[-30,30],v:[22,30],topMat:'water'});
        made(C,[16,20],0,Q=>{Q.box('pr',[-2,2],[-6,9],[1,2],'plank',{top:true,thin:true});for(const v of [-4,2,8])for(const s of [-1,1])Q.box('pp'+v+s,[s*2-.5,s*2+.5],[v-.5,v+.5],[0,1],'bark',{top:true});lantern(Q,Q.o,'l',[3,8],6)})},
      // a camp: tents under leaf arches of cloth round the fire, a moon lantern on its post
      camp(C,base){base(C);made(C,[-10,10],0,Q=>lantern(Q,Q.o,'l',[0,0],6))}},
    // the holdings' centres by tier: the generic table (a camp, a hamlet's yard, the village, the town's citadel, the city's at 128,
    // the castle's keep), each the Court's own plan: the great tree hall for a town and a city, the warden's keep for a castle
    centres:{},
    // its own materials, decal letters and decals (model.js, through PX.MODEL_EXTRA): silver birch (the frost's wood), ice lanterns
    textures:{sylvanBirch:'elfwood'},
    materials:{sylvanBirch:['#e2e6e2','#bcc2bf','#868d8e','#45484e']},
    letters:{'λ':['ice',0],'ι':['ice',2]},
    decals:{LampSylvanIce:['uu.','.u.','ιλι','.λ.','.ι.'],DoorSylvanPod:['.uuu.','umjmu','uuuuu','udadu','udadu','udkdu','udadu','udadu'],
      DoorSylvanWide:['..uuuuu..','.ummjmmu.','uuuuuuuuu','udedudedu','udedudedu','udedudedu','udekukedu','udedudedu','udedudedu','udedudedu']}});
})(window.PX=window.PX||{});
