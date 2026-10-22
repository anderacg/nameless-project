'use strict';
/* ---------- PX engine: every building as a model (the world-map building redesign, stage 2) ---------- */
// Each of PX.BUILDING_TYPES (buildings.js) made again as a model (model.js: walls, roofs, towers in the castles' 3/4 top-down view,
// the people figures' style), beside the old PX.building, which the game still draws. Each type is a plan builder: its parts in its
// own ground plan (front +v), from the seed, the people, the climate, its level and fortification. The game does not draw these yet.
//   PX.buildingModel({type, people, seed, yaw, env, snow, lv, fort, stilts, glow}) -> PX.model's result (img, ground, groundKey,
//     shadow, snow, flag, door, windows, buildings, marks ...) and type, people, facing, gateX. Cached by its spec (the snow overlay a
//     third of an amount at a time inside it: PX.modelSeason).
//   PX.clusterModel({kind, people, seed, yaw, env, snow, lv}) -> the same for a cell (32, a 64 quarter) of several small buildings
//     (PX.CLUSTER_MODELS): a town's row plot, a hamlet's yard plot, a farmstead, a smithy yard, an inn with its stable, a chapel and
//     its graveyard, a market, a mill, a lumber camp, a mine, a quarry, a fishery, a pasture, a brewery, a granary yard, a workshop
//     yard, a town quarter (64); its buildings each a kind and a role.
//   PX.buildingModelSpec / PX.clusterModelSpec: the spec alone (for tests and the gallery).
// Facings (yaw): PX.MODEL_YAWS, 0 its front to the camera (south), 2 west, 4 north (its back to the camera), 6 east. A 16 px
//   building turned to a side is planned again for it (its front shorter, its depth longer: about square on the ground), so it is
//   not drawn tall and narrow. A cluster's yaw is the side its street is on: laid out for a south or an east street, mirrored for
//   north and west, then settled into the cell (moved down or up, small things dropped) so it fits at full scale. Castle centres
//   (keep, citadel, gatehouse, village) stand straight on (yaw 0): their gate on the cell's middle column (gateX), toward the road.
// Peoples (LOOK): the roof the same whoever holds the place (humans orange-red tile, thatch in the country; dwarves slate navy;
//   elves green-teal leaf; orcs hide brown), over light walls. Climates (env): the desert's walls sun-baked adobe (orcs' too, under their
//   hide), sand under it; the frost's snow the overlay (spec.snow, 0-1; true or the frost: 1); the swamp's mud, and stilts
//   (spec.stilts, as the old buildings) under houses. Seeded, never Math.random: the same spec, the same pixels.
(function(PX){
  const kit=()=>PX.modelKit;
  /* the peoples' looks: their roof (the country's for humans), their walls (light), framing; the climates' walls */
  const LOOK={human:{roof:'tile',rural:'thatch',walls:['daub','whitewash','daub','stone'],frame:'timber',stone:'stone',hall:'longhouse'},
    dwarf:{roof:'slate',walls:['stone','stone','whitewash'],frame:null,stone:'stone',hall:'stonehall'},
    elf:{roof:'leaf',walls:['whitewash','whitewash','plank'],frame:null,stone:'whitewash',hall:'elfhall'},
    orc:{roof:'hide',walls:['daub','plank','daub'],frame:null,stone:'stone',wood:'log',hall:'hidehall'}};
  const DESERT={human:'adobe',dwarf:'adobe',elf:'whitewash',orc:'adobe'};
  // the types whose roof is the country's (humans thatch there), and those that stand on cobbles
  const RURAL=['cottage','fisherhut','longhouse','barn','granary','windmill','watermill','lumbershed','well'],TOWN=['townhouse','tavern','stall','warehouse','citadel'];
  PX.MODEL_LOOK=LOOK;

  /* a plan being built: its parts, decals and buildings, in the type's own ground plan (px, the cell's middle at 0). lift raises what
     it builds (stilts) */
  class Plan{
    constructor(o,cell){this.o=o;this.cell=cell;this.parts=[];this.decals=[];this.dwellings=[];this.lift=0;this.marks={};this.role=null;this.ground=null;this.flag=false}
    box(name,u,v,z,wall,x){this.parts.push(Object.assign({k:'box',name,u,v,z:[z[0]+this.lift,z[1]+this.lift],wall},x));return this}
    roof(on,form,axis,rise,mat,x){this.parts.push(Object.assign({k:'roof',on,form,axis,rise,mat},x));return this}
    round(name,c,r,z,wall,roof,x){this.parts.push(Object.assign({k:'tower',name,round:true,c,r,z:[z[0]+this.lift,z[1]+this.lift],wall,roof},x));return this}
    square(name,c,w,z,wall,roof,x){this.parts.push(Object.assign({k:'tower',name,c,w,z:[z[0]+this.lift,z[1]+this.lift],wall,roof},x));return this}
    chim(at,z0,z1,w,x){this.parts.push(Object.assign({k:'chimney',name:'ch'+this.parts.length,at,w:w||2,z:[z0+this.lift,z1+this.lift]},x));return this}
    prop(type,at,face){this.parts.push({k:'prop',name:'p'+this.parts.length,type,at,face:face|0});return this}
    dec(wall,kind,at,z){this.decals.push({wall,kind,at,z:z||0});return this}
    fence(pts,gates,h,mat){this.parts.push({k:'fence',name:'f'+this.parts.length,pts,gates,h,mat});return this}
    bed(u,v,mat){this.parts.push({k:'bed',name:'b'+this.parts.length,u,v,topMat:mat});return this}
    home(kind,role,storeys){this.dwellings.push({kind,role:role||'home',storeys:storeys||1});return this.dwellings.length-1}
    spec(){const o=this.o;return{cell:this.cell,parts:this.parts,decals:this.decals,dwellings:this.dwellings,role:this.role,ground:this.ground||(TOWN.includes(o.type)?'cobble':null),
      env:o.env,seed:o.seed,flag:this.flag,marks:this.marks,yaw:o.yaw}}
  }

  /* the common pieces */
  // a 16 px building's footprint for its facing: turned to a side, its front shorter and its depth longer (about square on the ground),
  // so it is not drawn tall and narrow
  const fp=(o,w,d)=>o.side?[d+1,Math.min(w,Math.round(w*.8))]:[w,d];
  // a house: its walls, roof, chimney, a door and windows on every wall (two rows on two storeys), on a stone footing unless of
  // stone. s: {n, w, d, z, c, form ('gable' along its front, 'front' its gable to the front, 'hip', 'shed'), rise, wall, roof, frame,
  // dw, door (at), doorKind, chim (true, false or [u, v]), lip, finial, back ('door'), wins}
  function house(Q,s){const o=Q.o,n=s.n||'h',[cu,cv]=s.c||[0,0],w=s.w,d=s.d,z=s.z,wall=s.wall||o.wall,roof=s.roof||o.roofMat,form=s.form||'gable',rise=s.rise||3,u=[cu-w/2,cu+w/2],v=[cv-d/2,cv+d/2];
    const frame=s.frame!==undefined?s.frame:(wall==='daub'||wall==='whitewash'||wall==='hide')?o.look.frame||(wall==='hide'?'log':null):null;
    Q.box(n,u,v,[0,z],wall,{dw:s.dw,frame,foot:wall==='stone'||wall==='adobe'||s.foot===false?null:'stone',rail:z>=9});
    Q.roof(n,form==='front'?'gable':form,form==='front'||(form==='hip'&&d>w)?'v':'u',rise,roof,{lip:s.lip||(Q.cell>16&&(roof==='thatch'||roof==='hide')?2:1),finial:s.finial,fmat:s.fmat,o:s.o,ov:s.ov!=null?s.ov:Q.cell>16?1:0,hi:s.hi});
    if(s.chim!==false&&(s.chim||o.d.chance(.6))){const at=Array.isArray(s.chim)?s.chim:[form==='front'?cu+w/2-2:cu+w/2-2.5,form==='front'?cv-d/2+2.5:cv-1];Q.chim(at,z-1,z+rise+2)}
    const two=z>=9,wz=z>=6?2:1,uz=Math.round(z*.6),at=s.door==null?.5:s.door,nw=s.wins||(w>=11?3:2),xs=nw===1?[at<.5?.78:.22]:nw===2?[.2,.8]:[.16,.5,.84];
    const big=w>=12;// (a small front keeps to narrow windows: wide ones would cover it)
    Q.dec(n+'.S',s.doorKind&&(big||s.doorKind==='rune')?s.doorKind:w>=10?'doorL':'door',at);for(const x of xs)if(Math.abs(x-at)>.22)Q.dec(n+'.S',s.pick&&big?o.d.pick(s.pick):'win',x,wz);
    if(two)for(const x of nw===1?[.3,.7]:xs)Q.dec(n+'.S',big?o.d.pick(['shut','win']):'win',x,uz);
    Q.dec(n+'.N',s.back==='door'?'door':'win',s.back==='door'?.3:.5,s.back==='door'?0:wz);if(s.back==='door')Q.dec(n+'.N','win',.75,wz);if(two)Q.dec(n+'.N','win',.5,uz);
    for(const k of ['E','W']){Q.dec(n+'.'+k,'win',.5,wz);if(two)Q.dec(n+'.'+k,'win',.5,uz)}
    return{u,v,z,rise}}
  // the door of a round (or square, symmetric) building by its facing: it stands as it is (yaw 0, its light and its sails the same),
  // its door round to the left or the right, or out of sight at the back (a window there)
  const rdoor=(Q,o,n,kind,z)=>{Q.yaw=0;if(o.yaw===4)Q.dec(n+'.S','win',.5,(z|0)+2);else Q.dec(n+'.S',kind||'door',[.5,.2,0,.8][o.yaw/2],z|0)};
  // a lean-to against a wall (an annex), a porch over the front door
  const lean=(Q,n,u,v,z,mat,hi)=>{Q.box(n,u,v,[0,z],'plank',{foot:'stone',keep:1});Q.roof(n,'shed','u',2,mat,{o:1,ov:0,hi});Q.dec(n+'.S','door',.5)};
  // stilts (spec.stilts, a swamp's houses): posts under the corners of the plan's first box, a deck at their top
  function stilts(Q,u,v){const h=Q.lift;if(!h)return;const [u0,u1]=u,[v0,v1]=v;
    for(const [a,b] of [[u0,v0],[u1-1,v0],[u0,v1-1],[u1-1,v1-1]])Q.parts.push({k:'box',name:'post'+a+b,u:[a,a+1],v:[b,b+1],z:[0,h],wall:'log',top:true});
    Q.parts.push({k:'box',name:'deck',u:[u0-1,u1+1],v:[v0,v1+1],z:[h-1,h],wall:'plank',top:true,thin:true})}
  // castle walls round the plan u0..u1, v0..v1 at fort 1 (a palisade of stakes, log towers at the corners), 2 (stone walls, round
  // towers) or 3 (taller, a tower halfway along each side); the gate on the middle of the front, its gatehouse; towers' roofs cones of
  // the people's roof or battlements
  function curtain(Q,u0,u1,v0,v1,fort,cone){const o=Q.o,st=o.people==='orc'?'log':o.look.stone==='whitewash'?'whitewash':'stone',pal=fort===1,wz=pal?6:fort===3?10:8,t=pal?1:3,gw=pal?8:10,tz=wz+(pal?3:5),R=pal?3:4;
    const wallBox=(n,u,v)=>Q.box(n,u,v,[0,wz],pal?'stakes':st,{top:true,topMat:pal?'log':st});
    wallBox('cwN',[u0,u1],[v0,v0+t]);wallBox('cwW',[u0,u0+t],[v0,v1]);wallBox('cwE',[u1-t,u1],[v0,v1]);
    wallBox('cwS0',[u0,-gw/2],[v1-t,v1]);wallBox('cwS1',[gw/2,u1],[v1-t,v1]);
    // (the merlons along each wall's outer edge, every third pixel)
    if(!pal){const mer=(n,u,v,au)=>{const [a0,a1]=au?u:v;for(let k=a0+1;k<a1-1;k+=3){const r=[k,k+1.5];Q.box(n+k,au?r:u,au?v:r,[wz,wz+2],st,{top:true})}};
      mer('mN',[u0,u1],[v0,v0+1],true);mer('mS0',[u0,-gw/2],[v1-1,v1],true);mer('mS1',[gw/2,u1],[v1-1,v1],true);mer('mW',[u0,u0+1],[v0,v1],false);mer('mE',[u1-1,u1],[v0,v1],false)}
    const tower=(n,c)=>pal?Q.square(n,c,5,[0,tz],'log',{form:'pyramid',rise:3,mat:o.roofMat}):cone?Q.round(n,c,R,[0,tz],st,{form:'cone',rise:6,mat:o.roofMat}):Q.round(n,c,R,[0,tz],st,{form:'lid',mat:st});
    tower('tNW',[u0+1,v0+1]);tower('tNE',[u1-1,v0+1]);tower('tSW',[u0+1,v1-1]);tower('tSE',[u1-1,v1-1]);
    if(fort===3){tower('tW',[u0+1,(v0+v1)/2]);tower('tE',[u1-1,(v0+v1)/2]);tower('tN',[(u0+u1)/2,v0+1])}
    // the gatehouse: a block over the gate between two towers (a palisade's: a gap between two posts)
    if(pal){Q.box('gp0',[-gw/2-1,-gw/2],[v1-2,v1],[0,wz+2],'log',{top:true});Q.box('gp1',[gw/2,gw/2+1],[v1-2,v1],[0,wz+2],'log',{top:true})}
    else{Q.box('gate',[-gw/2,gw/2],[v1-5,v1+1],[0,wz+3],st);Q.roof('gate','flat',null,0,st,{parapet:1,merlons:true});Q.dec('gate.S','gate',.5);
      for(const s of [-1,1]){Q.round('gt'+s,[s*(gw/2+1),v1-2],3,[0,wz+5],st,cone?{form:'cone',rise:5,mat:o.roofMat}:{form:'lid',mat:st});Q.dec('gt'+s+'.S','slit',.5,wz)}}
    for(const n of ['tSW','tSE'])Q.dec(n+'.S','slit',.5,Math.round(tz*.55));Q.marks.gate=[0,v1,0]}

  /* the types: each fills its plan Q from its options o: {people, look, wall, roofMat, env, seed, d (its dice), side, yaw, lv, fort} */
  const T={
    // a cottage: a side gable, a gable to the front or a hip; a chimney; a barrel, a woodpile or a crate by its side; better levels
    // a porch and a chimney, then a second storey and a dormer
    cottage(Q,o){const d=o.d,lv=o.lv,[w,dd]=fp(o,d.int(9,10),4),z=lv>=3?9:6,form=o.side?'gable':d.pick(['gable','gable','front','hip']),dw=Q.home('cottage','home',lv>=3?2:1);
      Q.lift=o.stilts?3:0;house(Q,{w,d:dd,z,form,rise:form==='front'||o.side?3:2,dw,door:d.pick([.3,.5,.7]),chim:lv>=2?true:undefined,pick:['win','shut','winF']});stilts(Q,[-w/2,w/2],[-dd/2,dd/2]);Q.lift=0;
      if(lv>=2&&!o.stilts){Q.box('porch',[-2,2],[dd/2,dd/2+2],[0,4],'timber',{top:true,thin:true})}
      if(lv>=3&&form==='gable')Q.parts.push(...kit().dormer('dm','h',[-w/2,w/2],[-dd/2,dd/2],z,3,.35,o.roofMat,o.wall)),Q.dec('dm.S','win',.5,1);
      const p=d.pick(['barrel','woodpile','crate','barrel','']);if(p)Q.prop(p,[w/2+2,dd/2-1],p==='woodpile'?1:0)},
    // a townhouse: narrow and tall, its gable to the street, its upper storey jettied out over the lower (a timber frame)
    townhouse(Q,o){const d=o.d,[w,dd]=fp(o,9,4),dw=Q.home('townhouse','home',2),wall=o.people==='human'?'daub':o.wall,front=!o.side&&d.chance(.4);
      Q.box('lo',[-w/2,w/2],[-dd/2,dd/2],[0,4],o.people==='dwarf'?'stone':wall,{dw,frame:o.look.frame,foot:'stone'});
      Q.box('h',[-w/2,w/2],[-dd/2,dd/2+.5],[4,9],wall,{dw,frame:o.look.frame});Q.roof('h','gable',front?'v':'u',front?3:2,o.roofMat,{lip:1,finial:front,ov:0});Q.chim([w/2-2,-dd/2+1.5],8,13);
      Q.dec('lo.S','door',d.pick([.3,.7]));Q.dec('lo.S','win',d.chance(.5)?.75:.25,1);Q.dec('h.S','shut',.28,1);Q.dec('h.S','shut',.72,1);Q.dec('h.N','win',.5,1);Q.dec('lo.N','door',.5);
      for(const k of ['E','W'])Q.dec('h.'+k,'win',.5,1);if(d.chance(.5))Q.dec('h.S','sign',.95,0)},
    // a fisher's hut: planks under a low gable, its net on a rack and a barrel; on stilts over a bog
    fisherhut(Q,o){const d=o.d,[w,dd]=fp(o,9,5),dw=Q.home('fisherhut');Q.lift=o.stilts?3:0;
      house(Q,{w,d:dd,z:5,wall:'plank',rise:2,dw,door:.35,chim:false,wins:1});stilts(Q,[-w/2,w/2],[-dd/2,dd/2]);Q.lift=0;Q.prop('nets',[-w/2-1,dd/2+1],1);Q.prop('barrel',[w/2+1.5,dd/2-1])},
    // a chapel: its nave's gable to the front, a bellcote over it, lancets down its sides, a headstone
    chapel(Q,o){const d=o.d,[w,dd]=o.side?[7,8]:[7,6],dw=Q.home('chapel','worship'),st=o.look.stone;
      Q.box('n',[-w/2,w/2],[-dd/2,dd/2],[0,6],st,{dw});Q.roof('n','gable','v',3,o.roofMat,{finial:1,fmat:'gold',ov:0});
      Q.box('bc',[-1,1],[dd/2-2,dd/2-.5],[8,11],st,{dw});Q.roof('bc','hip','u',2,o.roofMat,{o:0});Q.dec('bc.S','lancet',.5,0);
      Q.dec('n.S','door',.5);Q.dec('n.N','lancet',.5,1);for(const k of ['E','W']){Q.dec('n.'+k,'lancet',.3,1);Q.dec('n.'+k,'lancet',.72,1)}Q.prop('headstone',[w/2+2,dd/2-1])},
    // a market stall: a counter of goods under a striped awning on posts, crates or sacks beside it
    stall(Q,o){const d=o.d,aw=d.pick(['awning','awningB','awningG']),[w,dd]=fp(o,d.int(8,10),4),dw=Q.home('stall','trade');Q.ground='cobble';
      Q.box('ct',[-w/2+1,w/2-1],[0,dd/2],[0,2],'plank',{dw,top:true,topMat:d.pick(['crop','linen','gold']),keep:1});
      for(const [a,b] of [[-w/2,-dd/2],[w/2-1,-dd/2],[-w/2,dd/2-1],[w/2-1,dd/2-1]])Q.box('po'+a+b,[a,a+1],[b,b+1],[0,4],'timber',{top:true});
      Q.box('aw',[-w/2,w/2],[-dd/2,dd/2],[4,5],aw,{thin:true,keep:1});Q.roof('aw',lvPeak(o)?'gable':'shed','u',2,aw,{o:1,ov:0,hi:'b0'});Q.dec('ct.S','goods',.5,0);
      const s=d.pick(['crate','sacks','barrel']);Q.prop(s,[w/2+1.5,dd/2])},
    // a tower: round with a cone of the people's roof, or square with battlements; arrow slits, a door
    tower(Q,o){const d=o.d,st=o.people==='orc'?'log':o.look.stone,dw=Q.home('tower','defence'),z=d.int(8,9);Q.flag=true;
      if(d.chance(.6)){Q.round('tw',[0,0],3.5,[0,z],st,{form:'cone',rise:4,mat:o.roofMat},{dw});}
      else{Q.square('tw',[0,0],7,[0,z],st,{form:'battlements'},{dw})}
      rdoor(Q,o,'tw');Q.dec('tw.S','slit',.5,5);Q.dec('tw.E','slit',.5,5);Q.dec('tw.W','slit',.5,5);Q.dec('tw.N','slit',.5,5)},
    // a yurt: a round wall of hides under a low cone, its door, tusks either side of it
    yurt(Q,o){const d=o.d,dw=Q.home('yurt'),hide=o.people==='orc'||o.people==='human'?'hide':o.look.walls[0];
      Q.round('y',[0,0],5,[0,3],hide,{form:'cone',rise:4,mat:o.roofMat,o:1},{dw});rdoor(Q,o,'y');
      if(d.chance(.6)||o.lv>=2){Q.prop('tusk',[-2.5,6.5]);Q.prop('tusk',[2.5,6.5])}else Q.prop('woodpile',[6,3],1)},
    // a longhouse: long and low under a steep roof (the country's), its door in the middle, an annex or a woodpile
    longhouse(Q,o){const d=o.d,[w,dd]=fp(o,12,5),dw=Q.home('longhouse','home');
      house(Q,{w,d:dd,z:4,rise:4,dw,finial:1,door:.5,wins:3,chim:[0,-1],back:'door'});
      if(!o.side&&d.chance(.4))lean(Q,'an',[w/2,w/2+3],[-dd/2+1,dd/2-1],3,o.roofMat);else Q.prop(d.pick(['woodpile','barrel','hay']),[w/2+2,dd/2-1],1)},
    // a tavern: two storeys, a hip or a gable with a dormer, two chimneys, its sign and lantern by the door, barrels
    tavern(Q,o){const d=o.d,[w,dd]=fp(o,11,4),dw=Q.home('tavern','inn',2),hip=d.chance(.5);
      house(Q,{w,d:dd,z:8,form:hip?'hip':'gable',rise:2,dw,door:.5,doorKind:'door3',chim:[-w/2+2.5,-1],pick:['winF','shut']});Q.chim([w/2-2.5,-1],7,11);
      Q.dec('h.S','sign',.8,3);Q.dec('h.S','lamp',.3,3);Q.prop('barrel',[w/2+1.5,dd/2-1])},
    // a smithy: stone, its forge open to the street and glowing, a big chimney, the anvil outside, coal
    smithy(Q,o){const d=o.d,[w,dd]=fp(o,10,5),dw=Q.home('smithy','work'),st=o.people==='orc'?'log':o.look.stone;
      Q.box('f',[-w/2,w/2],[-dd/2,dd/2],[0,4],st,{dw});Q.roof('f','gable','u',3,o.roofMat);Q.chim([w/2-2,-dd/2+1.5],3,10,3);
      Q.dec('f.S','forge',.38);Q.dec('f.S','door',.82);for(const k of ['E','W','N'])Q.dec('f.'+k,'win',.5,2);Q.prop('anvil',[-1,dd/2+2]);Q.prop(d.pick(['coal','barrel']),[-w/2-1,dd/2])},
    // a church: its nave behind a tower at the front, a spire of the people's roof, a rose window, lancets
    church(Q,o){const d=o.d,[w,dd]=fp(o,8,7),dw=Q.home('church','worship'),st=o.look.stone;
      Q.box('n',[-w/2,w/2],[-dd/2,dd/2-2],[0,5],st,{dw});Q.roof('n','gable','v',3,o.roofMat,{finial:1,fmat:'gold'});
      Q.square('tw',[0,dd/2-2],5,[0,8],st,{form:'pyramid',rise:3,mat:o.roofMat,o:1},{dw});Q.dec('tw.S','door',.5);Q.dec('tw.S','rose',.5,4);Q.dec('tw.E','lancet',.5,5);Q.dec('tw.W','lancet',.5,5);
      for(const k of ['E','W']){Q.dec('n.'+k,'lancet',.3,1);Q.dec('n.'+k,'lancet',.65,1)}Q.dec('n.N','rose',.5,1)},
    // a barn: planks, its great doors under a big gable to the front, hay and a cart by it
    barn(Q,o){const d=o.d,[w,dd]=fp(o,10,5),dw=Q.home('barn','store');
      Q.box('b',[-w/2,w/2],[-dd/2,dd/2],[0,5],'plank',{dw,foot:'stone'});Q.roof('b','gable','v',3,o.roofMat,{lip:1,finial:1,ov:0});
      Q.dec('b.S','barn',.5);Q.dec('b.N','door',.5);Q.dec('b.E','hatch',.5,3);Q.dec('b.W','hatch',.5,3);
      if(!o.side&&d.chance(.4))lean(Q,'an',[w/2,w/2+3],[-dd/2+1,dd/2-1],3,o.roofMat);else Q.prop('hay',[w/2+2,dd/2])},
    // a granary: a round store on staddle stones under a cone, its door, sacks
    granary(Q,o){const d=o.d,dw=Q.home('granary','store'),st=o.people==='orc'?'log':o.look.stone;Q.lift=1;
      Q.round('g',[0,-1],4,[0,4],st,{form:'cone',rise:4,mat:o.roofMat},{dw});Q.lift=0;Q.round('st',[0,-1],3,[0,1],'stone',{form:'lid',mat:'stone'});
      rdoor(Q,o,'g');Q.prop('sacks',[o.yaw===6?-4:4,4])},
    // a windmill: a round tower under a cone, its sails always to the wind (the camera), its door by its facing
    windmill(Q,o){const d=o.d,dw=Q.home('windmill','work'),wall=d.pick(['stone','whitewash','plank']),z=7;Q.yaw=0;
      Q.round('m',[0,0],3,[0,z],wall,{form:'cone',rise:4,mat:o.roofMat},{dw});rdoor(Q,o,'m');Q.dec('m.S','win',.5,4);
      const c=z,h=6;Q.box('sv',[-.5,.5],[4,5],[c-h,c+h],'canvas',{frame:'timber',thin:true});Q.box('sh',[-h,h],[4,5],[c-.5,c+.5],'canvas',{frame:'timber',thin:true});Q.box('hub',[-1,1],[3.5,5.5],[c-1,c+1],'timber',{top:true})},
    // a watermill: stone under the people's roof, its wheel turning in the race in front of it
    watermill(Q,o){const d=o.d,[w,dd]=fp(o,10,5),dw=Q.home('watermill','work');
      house(Q,{w,d:dd,z:4,wall:'stone',rise:3,dw,door:.22,wins:1,chim:[w/2-2,-1]});Q.dec('h.S','wheel5',.78,0);Q.bed([-w/2-3,w/2+3],[dd/2,dd/2+3],'water')},
    // a warehouse: long, planks, great doors under a hoist, a hatch above; crates
    warehouse(Q,o){const d=o.d,[w,dd]=fp(o,11,5),dw=Q.home('warehouse','store');
      Q.box('w',[-w/2,w/2],[-dd/2,dd/2],[0,5],'plank',{dw,foot:'stone'});Q.roof('w','gable','u',3,o.roofMat);Q.box('ho',[-.5,.5],[dd/2,dd/2+2],[5,6],'timber',{top:true});
      Q.dec('w.S','barn',.5);Q.dec('w.N','door',.5);Q.dec('w.E','hatch',.5,3);Q.dec('w.W','hatch',.5,3);Q.prop('crate',[w/2+1.5,dd/2]);if(d.chance(.6))Q.prop('crate',[-w/2-1.5,dd/2])},
    // a gatehouse (32, straight on): the gate in a block between two towers, battlements, cones of the people's roof or not
    gatehouse(Q,o){const d=o.d,st=o.people==='orc'?'log':o.look.stone,cone=o.people!=='dwarf'&&d.chance(.7),dw=Q.home('gatehouse','defence');Q.flag=true;Q.yaw=0;
      Q.box('g',[-7,7],[-4,4],[0,13],st,{dw});Q.roof('g','flat',null,0,st,{parapet:2,merlons:true});Q.dec('g.S','gate',.5);Q.dec('g.S','slit',.3,9);Q.dec('g.S','slit',.7,9);
      for(const s of [-1,1]){Q.round('t'+s,[s*9.5,0],4.5,[0,16],st,cone?{form:'cone',rise:6,mat:o.roofMat}:{form:'lid',mat:st},{dw});Q.dec('t'+s+'.S','slit',.5,8)}Q.marks.gate=[0,4,0]},
    // a hide hall: low log walls under a steep hide roof, tusks at its ridge's ends, a totem by its door
    hidehall(Q,o){const d=o.d,[w,dd]=fp(o,12,5),dw=Q.home('hidehall','home');
      house(Q,{w,d:dd,z:4,wall:o.people==='orc'?'log':o.wall,rise:4,dw,finial:1,fmat:'bone',door:.5,wins:1,chim:false});Q.prop('totem',[w/2-1,dd/2+2]);Q.prop('tusk',[-2.5,dd/2+1.5])},
    // a watchtower (32): a hut of logs on four tall posts, its roof of hide, a ladder up a post
    watchtower(Q,o){const d=o.d,dw=Q.home('watchtower','defence'),H=d.int(11,12);Q.flag=true;
      for(const [a,b] of [[-5,-4],[4,-4],[-5,3],[4,3]])Q.box('p'+a+b,[a,a+1],[b,b+1],[0,H],'log',{top:true});
      Q.box('x',[-5,5],[3,4],[3,4],'log',{top:true,thin:true});Q.box('dk',[-6,6],[-5,5],[H,H+1],'plank',{top:true,thin:true});
      Q.box('h',[-4.5,4.5],[-3.5,3.5],[H+1,H+6],'log',{dw});Q.roof('h','gable','v',5,o.roofMat,{lip:2,finial:1,fmat:'bone'});Q.dec('h.S','door',.5);Q.dec('h.E','slit',.5,2);Q.dec('h.W','slit',.5,2);
      Q.box('ld',[-1,1],[5,6],[0,H],'timber',{thin:true});Q.dec('ld.S','ladder',.5,1)},
    // a treehouse (32): a house on a deck round a great trunk under its crown (green, evergreen or autumn), a ladder or steps
    treehouse(Q,o){const d=o.d,dw=Q.home('treehouse','home'),crown=d.pick(['canopy','canopy','autumn']),H=4;
      Q.round('tr',[0,-4],2.5,[0,13],'log',null);Q.round('cr',[0,-4],8,[11,14],crown,{form:'cone',rise:4,mat:crown,o:0});
      Q.box('dk',[-7,7],[0,8],[H-1,H],'plank',{top:true,thin:true});for(const [a,b] of [[-7,7],[6,7]])Q.box('p'+a,[a,a+1],[b,b+1],[0,H],'log',{top:true});
      Q.box('h',[-5,5],[1,7],[H,H+5],o.wall==='stone'?'whitewash':o.wall,{dw});Q.roof('h','gable','u',3,o.roofMat,{finial:1});Q.dec('h.S','door',.35,0);Q.dec('h.S','win',.75,2);Q.dec('h.E','win',.5,2);Q.dec('h.W','win',.5,2);
      if(d.chance(.6))Q.dec('h.S','lamp',.55,3);Q.box('ld',[-1,1],[8,9],[0,H],'timber',{thin:true});Q.dec('ld.S','ladder',.5,0)},
    // an elves' hall: light walls under a leafy roof, finials, lanterns by its door
    elfhall(Q,o){const d=o.d,[w,dd]=fp(o,11,5),dw=Q.home('elfhall','home');
      house(Q,{w,d:dd,z:4,wall:o.people==='elf'?d.pick(['whitewash','plank']):o.wall,rise:4,dw,finial:1,fmat:'gold',door:.5,wins:3,chim:false});Q.dec('h.S','lamp',.36,3);Q.dec('h.S','lamp',.64,3)},
    // a spire (32): a tall round tower of white stone, a balcony ring, a tall cone, lancets round it
    spire(Q,o){const d=o.d,dw=Q.home('spire','worship'),z=d.int(16,17);Q.flag=true;
      Q.round('s',[0,0],5,[0,z],'whitewash',{form:'cone',rise:8,mat:o.roofMat},{dw});Q.round('bal',[0,0],6,[z-6,z-5],'plank',{form:'lid',mat:'plank'});
      rdoor(Q,o,'s','doorL');for(const k of ['S','E','W'])Q.dec('s.'+k,'lancet',.5,k==='S'?6:4);Q.dec('s.S','lancet',.5,z-4)},
    // a dwarves' stone hall: squat and broad, a low roof, its rune door, a chimney
    stonehall(Q,o){const d=o.d,[w,dd]=fp(o,12,6),dw=Q.home('stonehall','home');
      house(Q,{w,d:dd,z:4,wall:'stone',rise:2,dw,door:.5,doorKind:'rune',wins:3,chim:[w/2-3,-1]});Q.prop('barrel',[-w/2-1.5,dd/2-1])},
    // a dwarves' forge: stone under a hip, its glowing mouth, a great chimney, the anvil and coal
    forge(Q,o){const d=o.d,[w,dd]=fp(o,10,6),dw=Q.home('forge','work');
      Q.box('f',[-w/2,w/2],[-dd/2,dd/2],[0,4],'stone',{dw});Q.roof('f','hip','u',3,o.roofMat);Q.chim([w/2-2.5,-1],3,10,3);
      Q.dec('f.S','forge',.4);for(const k of ['E','W','N'])Q.dec('f.'+k,'win',.5,2);Q.prop('anvil',[-1,dd/2+2]);Q.prop('coal',[w/2+1,dd/2])},
    // a keep (64, straight on): a donjon at the back, its hall beside it, a well in the yard; walls by its fortification
    keep(Q,o){const d=o.d,st=o.people==='orc'?'log':o.look.stone,cone=o.people!=='dwarf'&&d.chance(.7),f=o.fort|0,dw=Q.home('keep','hall',3);Q.flag=true;Q.yaw=0;Q.ground='cobble';
      Q.square('dj',[d.chance(.5)?-6:6,-8],14,[0,22],st,d.chance(.5)?{form:'pyramid',rise:7,mat:o.roofMat,o:1}:{form:'battlements'},{dw});Q.dec('dj.S','doorL',.5);Q.dec('dj.S','win',.3,9);Q.dec('dj.S','win',.7,9);Q.dec('dj.S','win',.5,15);
      const hx=Q.parts[0].c[0]>0?-10:10;Q.box('hl',[hx-9,hx+9],[-8,1],[0,9],st,{dw});Q.roof('hl','gable','u',5,o.roofMat,{finial:1});for(const at of [.2,.5,.8])Q.dec('hl.S','lancet',at,3);Q.dec('hl.S','door',hx<0?.85:.15);
      Q.round('wl',[hx,9],2.5,[0,3],'stone',{form:'water'});if(f)curtain(Q,-27,27,-20,27,f,cone);else{Q.prop('cart',[-14,14],1);Q.prop('barrel',[12,12])}},
    // a citadel (64, straight on): a palace across the back between two towers, a court before it; walls by its fortification
    citadel(Q,o){const d=o.d,st=o.people==='orc'?'log':o.look.stone,cone=o.people!=='dwarf'&&d.chance(.7),f=o.fort|0,dw=Q.home('citadel','hall',3);Q.flag=true;Q.yaw=0;Q.ground='cobble';
      Q.box('pl',[-14,14],[-14,-3],[0,13],st,{dw});Q.roof('pl',d.chance(.5)?'hip':'gable','u',6,o.roofMat,{finial:1});Q.dec('pl.S','door3',.5);for(const at of [.12,.3,.7,.88]){Q.dec('pl.S','lancet',at,3);Q.dec('pl.S','lancet',at,8)}
      for(const s of [-1,1]){Q.round('pt'+s,[s*15,-6],4.5,[0,19],st,cone?{form:'cone',rise:7,mat:o.roofMat}:{form:'lid',mat:st},{dw});Q.dec('pt'+s+'.S','lancet',.5,12)}
      Q.round('ft',[0,8],3,[0,2],'stone',{form:'water'});Q.round('fp',[0,8],.9,[0,4],'stone',{form:'lid',mat:'stone'});if(f)curtain(Q,-28,28,-20,27,f,cone);else{Q.prop('cart',[-16,14],1);Q.prop('crate',[14,12])}},
    // a well: a ring of stones round dark water, two posts and a little roof of the people's over its windlass
    well(Q,o){Q.round('w',[0,1],3.2,[0,2],o.look.stone==='whitewash'?'stone':o.look.stone,{form:'water'});
      // (its windlass across the camera whatever its facing: turned to a side, it is built along its own depth)
      const S=o.side,A=(u,v)=>S?[v,u]:[u,v];for(const s of [-1,1])Q.box('wp'+s,...A([s*3.5-.5,s*3.5+.5],[.5,1.5]),[0,7],'timber',{top:true});
      Q.box('wr',...A([-4.5,4.5],[-.5,2.5]),[7,8],'timber',{thin:true});Q.roof('wr','gable',S?'v':'u',2,o.roofMat,{o:0,ov:0});Q.box('wx',...A([-3,3],[.5,1.5]),[5,6],'log',{top:true});Q.prop('barrel',[5.5,4])},
    // a tent: a ridge tent of cloth (plain, red or blue), its door in its gable
    tent(Q,o){const d=o.d,c=d.pick(['canvas','canvas','canvasR','canvasB']),[w,dd]=fp(o,10,7),dw=Q.home('tent','home');
      Q.box('t',[-w/2,w/2],[-dd/2,dd/2],[0,1],c,{dw,keep:1});Q.roof('t','gable','v',5,c,{o:0,ov:0,lip:1,finial:1});Q.dec('t.S','door',.5,1);Q.prop('firepit',[w/2+1,dd/2+1])},
    // a wagon: a covered wagon on its wheels, its shaft out in front
    wagon(Q,o){const d=o.d,c=d.pick(['canvas','canvas','linen']),dw=Q.home('wagon','store');
      Q.box('b',[-5,4],[-2.5,2.5],[2,4],'plank',{dw,top:true});Q.box('cv',[-4.5,3.5],[-2.5,2.5],[4,5],c,{dw,keep:1});Q.roof('cv','gable','u',3,c,{o:0,ov:0});
      for(const [a,s] of [[-3,'f'],[2,'r']])Q.box('wh'+s,[a-1.5,a+1.5],[2.5,3],[0,3],'timber',{thin:true}),Q.dec('wh'+s+'.S','wheel5',.5,-1);Q.box('sh',[4,8],[-.5,.5],[1,2],'timber',{top:true});Q.dec('b.W','hatch',.5,0)},
    // a mine head: a mound of rock (sandstone in the desert), its timbered adit, a cart of ore on its way out, a spoil heap
    minehead(Q,o){const d=o.d,rk=o.env==='desert'?'sandrock':'rock',dw=Q.home('minehead','work');
      Q.round('m',[0,-2],6,[0,2],rk,{form:'cone',rise:5,mat:rk,o:0});Q.box('a',[-3,3],[2,5],[0,5],'timber',{dw,top:true});Q.dec('a.S','adit',.5,0);
      Q.prop('minecart',[5,5],1);if(d.chance(.7))Q.prop('spoil',[-5.5,4]);else Q.prop('boulder',[-5,5])},
    // a lumber shed: an open shed of logs stacked under a single slope, a stump and a pile of logs
    lumbershed(Q,o){const d=o.d,[w,dd]=fp(o,d.int(10,11),5),dw=Q.home('lumbershed','work');
      Q.box('s',[-w/2,w/2],[-dd/2,dd/2],[0,4],'log',{dw});Q.roof('s','shed','u',2,o.roofMat,{o:1});Q.dec('s.S','beams',.5,3);Q.dec('s.S','door',.85);Q.prop('stump',[-w/2+1,dd/2+2]);Q.prop('logs',[w/2-2,dd/2+2.5])},
    // a crane: a treadwheel by its mast, the jib out over the stones it lifts
    crane(Q,o){const d=o.d,dw=Q.home('crane','work');
      Q.box('wh',[-5,1],[-1,0],[0,7],'timber',{thin:true,dw});Q.dec('wh.S','wheel',.5,0);Q.box('ms',[2,3],[-1,0],[0,12],'timber',{top:true,dw});Q.box('jb',[0,9],[-1,0],[11,12],'timber',{top:true});
      Q.box('rp',[8,8.5],[-1,0],[6,11],'linen',{thin:true});Q.prop('block',[7,3]);Q.prop('block',[-4,4]);if(d.chance(.5))Q.prop('block',[0,5])},
    // a village's centre (32, straight on): its people's hall at the back, the green with a path, the well and its goods; fortified, a
    // palisade of stakes round it, the gate at the front
    village(Q,o){const d=o.d,f=(o.fort|0)>0,dw=Q.home('village','hall',1);Q.flag=true;Q.yaw=0;const v0=f?-10:-12;
      house(Q,{n:'hl',w:f?20:24,d:8,c:[0,v0+4],z:5,rise:5,dw,finial:1,fmat:o.people==='orc'?'bone':o.people==='elf'?'gold':'timber',door:.5,doorKind:o.people==='dwarf'?'rune':'doorL',wins:3,
        wall:{dwarf:'stone',orc:'log'}[o.people]||o.wall,chim:o.people==='orc'?false:[6,v0+3]});
      Q.round('wl',[-7,6],2.5,[0,3],'stone',{form:'water'});const g={human:['hay','barrel'],dwarf:['barrel','crate'],elf:['sacks','crate'],orc:['woodpile','hay']}[o.people]||['hay','barrel'];
      Q.prop(g[0],[7,5]);Q.prop(g[1],[9,9]);
      if(f){const e=14,b=13;for(const [n,u,v] of [['pN',[-e,e],[-b,-b+1]],['pW',[-e,-e+1],[-b,b]],['pE',[e-1,e],[-b,b]],['pS0',[-e,-4],[b-1,b]],['pS1',[4,e],[b-1,b]]])Q.box(n,u,v,[0,4],'stakes',{top:true,topMat:'log'});
        Q.marks.gate=[0,b,0]}else Q.marks.gate=[0,14,0]},
    // ruins (a site): broken walls of stone, an arch standing, ivy, fallen blocks
    ruins(Q,o){const d=o.d,st=o.look.stone==='whitewash'?'stone':o.look.stone;Q.role='ruins';
      Q.box('a',[-6,1],[-3,-2],[0,d.int(6,8)],st);Q.box('b',[1,6],[-3,-2],[0,d.int(3,5)],st);Q.box('c',[-6,-5],[-2,3],[0,d.int(3,5)],st);Q.box('e',[4,6],[1,2],[0,2],st);
      Q.dec('a.S','arch',.45,0);if(d.chance(.6))Q.dec('a.S','ivy',.85,2);Q.prop('block',[2,3]);Q.prop('block',[-2,4],1)},
    // a shrine (a site): standing stones in a ring round a glowing altar, or an obelisk
    shrine(Q,o){const d=o.d,st=o.look.stone==='whitewash'?'stone':o.look.stone;Q.role='shrine';
      if(d.chance(.6)){for(const [a,b,h] of [[-5,-2,6],[5,-2,5],[-3,-4,7],[3,-4,6],[-5,3,4],[5,3,5]])Q.box('s'+a+b,[a-1,a+1],[b-.5,b+.5],[0,h],st,{top:true});Q.box('al',[-2,2],[0,2],[0,2],st,{top:true,topMat:o.glow})}
      else{Q.square('ob',[0,0],3,[0,11],st,{form:'pyramid',rise:2,mat:o.glow,o:0});Q.box('al',[-3,3],[-3,3],[0,1],st,{top:true})}}
  };
  const lvPeak=o=>o.lv>=3;
  T.citadel.cell=T.keep.cell=64;T.gatehouse.cell=T.watchtower.cell=T.treehouse.cell=T.spire.cell=T.village.cell=32;
  // the centres stand straight on; the rest have 4 facings
  const FRONT=['keep','citadel','gatehouse','village'];PX.MODEL_FRONT=FRONT;

  /* the options a type is planned from */
  function opts(spec,type,salt){const people=LOOK[spec.people]?spec.people:LOOK[spec.style]?spec.style:'human',look=LOOK[people],seed=spec.seed|0,yaw=FRONT.includes(type)?0:((spec.yaw|0)%8+8)%8&6,
      d=PX.dice(PX.rng(seed*7919+salt*131+3)),env=spec.env||(spec.snow===true?'frost':'grass');
    const wall=env==='desert'?DESERT[people]:look.walls[seed%look.walls.length],roofMat=RURAL.includes(type)&&look.rural?look.rural:look.roof,glow=/e8c0|d8a0|gold/.test(spec.glow||'')?'gold':'glow';
    return{type,people,look,seed,yaw,side:yaw===2||yaw===6,d,env,wall,roofMat,lv:spec.lv|0||1,fort:spec.fort,stilts:!!spec.stilts,glow}}
  const SNOW=spec=>spec.snow===true?1:spec.snow!=null?+spec.snow:spec.env==='frost'?1:0;
  const TYPES=Object.keys(T);
  PX.buildingModelSpec=spec=>{const type=spec.type;if(!T[type])throw new Error('no model for '+type);const o=opts(spec,type,TYPES.indexOf(type)),Q=new Plan(o,T[type].cell||16);Q.yaw=o.yaw;T[type](Q,o);
    const s=Q.spec();s.yaw=Q.yaw;s.snow=SNOW(spec);s.role=s.role||(Q.dwellings[0]&&Q.dwellings[0].role)||null;return s};
  // the cache: a model a spec (its snow overlay a third of an amount at a time inside it)
  const CACHE=new Map(),key=(k,s)=>k+JSON.stringify([s.type||s.kind,s.people||s.style,s.seed|0,s.yaw|0,s.env||'',s.lv|0,s.fort==null?-1:s.fort,!!s.stilts,s.glow||'']);
  function cached(k,spec,make){const id=key(k,spec);let m=CACHE.get(id);if(!m){m=make();CACHE.set(id,m)}const a=SNOW(spec);
    return a?Object.assign({},m,{snow:PX.modelSeason(m,'snow',a)}):Object.assign({},m,{snow:null})}
  const FACING=['front','left','back','right'];
  PX.buildingModel=spec=>cached('b',spec,()=>{const s=PX.buildingModelSpec(Object.assign({},spec,{snow:0})),m=PX.model(s);
    return Object.assign(m,{type:spec.type,people:opts(spec,spec.type,0).people,facing:FACING[s.yaw/2],gateX:FRONT.includes(spec.type)?m.cell/2:null})});
  PX.MODEL_TYPES=TYPES.filter(k=>!['ruins','shrine'].includes(k));PX.MODEL_SITES=['ruins','shrine'];

  /* clusters: several small buildings to a cell, each one of the types above set down at a point and a facing (face 0 its front to
     the street's side of the layout, south; 1 west, 2 north, 3 east), with props, fences, beds and paths about them. A layout is
     drawn for a south street (S) and, where it differs, an east one (E); north mirrors S, west mirrors E, then the whole is settled
     into its cell at full scale */
  // a piece: one type's plan, its own front +v, then set down in the cluster (model.js place)
  function piece(C,type,at,face,x){const o=Object.assign(opts(Object.assign({},C.spec,x||{},{type,seed:(C.spec.seed|0)*31+C.n*17+TYPES.indexOf(type)}),type,TYPES.indexOf(type)),{side:false,yaw:0,roofMat:C.o.roofMat},x||{});
    const Q=new Plan(o,16);T[type](Q,o);if(x&&x.cut)for(const k of x.cut)Q.parts=Q.parts.filter(p=>p.k!==k);kit().place(C.Q,{parts:Q.parts,decals:Q.decals,dwellings:Q.dwellings},at,face|0,'q'+(C.n++)+'.')}
  // a row of town houses wall to wall along the street (+v), their own widths and heights, ridges this way and that
  function row(C,u0,u1,v1,d,face){const R=C.d;let u=u0;const hs=[];while(u<u1-5){const w=Math.min(u1-u,R.pick([8,9,10,11])),z=R.pick([5,6,9,10]),ax=R.chance(.5)?'v':'u';hs.push({u,w,z,ax});u+=w}
    for(const h of hs){const o=C.o,wall=o.look.walls[C.d.int(0,o.look.walls.length-1)],dw=C.Q.dwellings.length,n='r'+C.n++ +'.';
      C.Q.dwellings.push({kind:h.z>=9?'townhouse':'house',role:'home',storeys:h.z>=9?2:1});
      const P=new Plan(Object.assign({},o,{wall:o.env==='desert'?o.wall:wall}),32);house(P,{n:'h',w:h.w,d,z:h.z,form:h.ax==='v'?'front':'gable',rise:h.ax==='v'?4:3,dw:0,door:C.d.pick([.3,.5,.7]),wins:h.w>=10?2:1,o:h.ax==='v'?0:1,ov:h.ax==='v'?1:0,chim:C.d.chance(.5)});
      kit().place(C.Q,{parts:P.parts.map(p=>p.dw!=null?Object.assign({},p,{dw:0}):p),decals:P.decals,dwellings:[C.Q.dwellings.pop()]},[h.u+h.w/2,v1-d/2],face,n)}}
  const CL={
    // a town's row plot: two to four houses wall to wall along the street (their own widths and heights), a yard behind with a shed
    row:{cell:32,role:'housing',ground:'cobble',S:C=>{row(C,-15,15,13,C.d.int(8,10),0);C.Q.parts.push({k:'fence',name:'yf',pts:[[-15,-14],[15,-14]]},{k:'prop',name:'yp',type:C.d.pick(['washing','woodpile','cart']),at:[C.d.int(-8,8),-9]})},
      E:C=>{const d=C.d.int(9,11);rowE(C,15,d,15,32);C.Q.parts.push({k:'fence',name:'yf',pts:[[-14,-12],[-14,14]]},{k:'prop',name:'yp',type:C.d.pick(['washing','woodpile','cart']),at:[-6,C.d.int(-4,8)],face:1})}},
    // a hamlet's yard plot: one or two houses in a fenced garden, beds, a well
    yard:{cell:32,role:'housing',S:C=>{piece(C,'cottage',[-4,-6],0,{lv:1});if(C.d.chance(.6))piece(C,'cottage',[8,4],3,{lv:1,cut:['prop']});else C.Q.parts.push({k:'tower',name:'wl',round:true,c:[9,6],r:2.5,z:[0,3],wall:'stone',roof:{form:'water'}});
      C.Q.parts.push({k:'bed',name:'b1',u:[-13,-6],v:[5,11]},{k:'bed',name:'b2',u:[-4,2],v:[5,11]},{k:'fence',name:'yf',pts:[[-14,13],[14,13],[14,-13],[-14,-13],[-14,13]],gates:[[-1,3,0]]})}},
    // a farmstead: the farmhouse, its barn across the yard, a haystack, a cart, a trough, fields' beds
    farmstead:{cell:32,role:'farm',E:C=>{piece(C,'longhouse',[8,2],3,{cut:['prop']});piece(C,'barn',[-6,-5],0,{cut:['prop']});
      C.Q.parts.push({k:'prop',name:'hay',type:'hay',at:[-10,8]},{k:'prop',name:'cart',type:'cart',at:[-2,10]},{k:'prop',name:'tr',type:'trough',at:[-1,2],face:1},{k:'fence',name:'yf',pts:[[-15,-1],[-15,13],[-6,13]]})},
      S:C=>{piece(C,'longhouse',[-5,-7],0,{cut:['prop']});piece(C,'barn',[9,4],3,{cut:['prop']});
      C.Q.parts.push({k:'prop',name:'hay',type:'hay',at:[-10,6]},{k:'prop',name:'cart',type:'cart',at:[-3,10],face:1},{k:'prop',name:'tr',type:'trough',at:[1,2]},{k:'fence',name:'yf',pts:[[-15,13],[-15,1],[-6,1]]})}},
    // a smithy yard: the forge to the street, its glow; the smith's cottage behind, a coal store, a woodpile
    smithy:{cell:32,role:'smithy',S:C=>{piece(C,C.o.people==='dwarf'?'forge':'smithy',[-3,6],0);piece(C,'cottage',[4,-9],0,{lv:2,cut:['prop']});
      C.Q.parts.push({k:'prop',name:'coal',type:'coal',at:[11,7]},{k:'prop',name:'wp',type:'woodpile',at:[-11,-8],face:1},{k:'prop',name:'b',type:'barrel',at:[12,2]})}},
    // an inn with its stable across the yard, a well and a cart
    inn:{cell:32,role:'inn',ground:'cobble',S:C=>{piece(C,'tavern',[-3,6],0,{cut:['prop']});stable(C,[3,-9],0);
      C.Q.parts.push({k:'tower',name:'wl',round:true,c:[-11,-4],r:2.5,z:[0,3],wall:'stone',roof:{form:'water'}},{k:'prop',name:'cart',type:'cart',at:[11,-1],face:1},{k:'prop',name:'b1',type:'barrel',at:[12,7]})}},
    // a chapel, its graveyard of headstones in a fence, the priest's cottage
    chapel:{cell:32,role:'chapel',S:C=>{piece(C,'chapel',[-6,-2],0,{cut:['prop']});piece(C,'cottage',[8,-8],3,{lv:1,cut:['prop']});
      C.Q.parts.push({k:'fence',name:'gf',pts:[[2,13],[14,13],[14,1],[2,1],[2,13]],gates:[[6,9,0]]},...[[5,4],[8,4],[11,4],[5,9],[11,9]].map(([u,v],i)=>({k:'prop',name:'hs'+i,type:'headstone',at:[u,v]})))}},
    // a market: stalls round a small square with a fountain, crates and sacks
    market:{cell:32,role:'market',ground:'cobble',S:C=>{piece(C,'stall',[-7,-9],0);piece(C,'stall',[7,-9],0);piece(C,'stall',[-9,7],1);piece(C,'stall',[9,7],3);
      C.Q.parts.push({k:'tower',name:'fb',round:true,c:[0,1],r:3,z:[0,2],wall:'stone',roof:{form:'water'}},{k:'tower',name:'fp',round:true,c:[0,1],r:.9,z:[0,4],wall:'stone',roof:{form:'lid',mat:'stone'}})}},
    // a mill: the watermill on its race, a granary, sacks and a cart
    mill:{cell:32,role:'mill',S:C=>{piece(C,'watermill',[-4,0],0);piece(C,'granary',[9,-8],0,{cut:['prop']});C.Q.parts.push({k:'prop',name:'s1',type:'sacks',at:[9,-1]},{k:'prop',name:'cart',type:'cart',at:[-11,-10],face:1})}},
    // a lumber camp: the shed of stacked logs, the woodcutter's hut, stumps and a pile
    lumber:{cell:32,role:'lumber',S:C=>{piece(C,'lumbershed',[-3,6],0);piece(C,'cottage',[6,-8],0,{cut:['prop'],lv:1});C.Q.parts.push({k:'prop',name:'s1',type:'stump',at:[-11,-6]},{k:'prop',name:'s2',type:'stump',at:[-7,-11]},{k:'prop',name:'lg',type:'logs',at:[11,4],face:1})}},
    // a mine: the mine head in its mound, a hut, a spoil heap, carts
    mine:{cell:32,role:'mine',S:C=>{piece(C,'minehead',[-3,0],0);piece(C,'cottage',[8,-9],3,{cut:['prop'],lv:1});C.Q.parts.push({k:'prop',name:'sp',type:'spoil',at:[10,6]},{k:'prop',name:'b',type:'boulder',at:[-12,9]})}},
    // a quarry: the crane over cut blocks, a hut, a cart of stone
    quarry:{cell:32,role:'quarry',S:C=>{piece(C,'crane',[-3,2],0);piece(C,'cottage',[8,-9],0,{cut:['prop'],lv:1});C.Q.parts.push({k:'prop',name:'b1',type:'block',at:[-11,9]},{k:'prop',name:'b2',type:'block',at:[-8,11],face:1},{k:'prop',name:'cart',type:'cart',at:[10,9]})}},
    // a fishery: two fishers' huts, nets on their racks, barrels
    fishery:{cell:32,role:'port',S:C=>{piece(C,'fisherhut',[-6,-6],0,{cut:['prop']});piece(C,'fisherhut',[7,4],0,{cut:['prop']});
      C.Q.parts.push({k:'prop',name:'n1',type:'nets',at:[-6,4]},{k:'prop',name:'n2',type:'nets',at:[8,-6],face:1},{k:'prop',name:'b1',type:'barrel',at:[-12,10]},{k:'prop',name:'b2',type:'barrel',at:[0,11]})}},
    // a pasture's steading: the barn, a fenced paddock with its trough, hay
    pasture:{cell:32,role:'pasture',S:C=>{piece(C,'barn',[-7,-6],0,{cut:['prop']});C.Q.parts.push({k:'fence',name:'pd',pts:[[0,12],[14,12],[14,-4],[0,-4],[0,12]],gates:[[-2,2,3]]},
      {k:'prop',name:'tr',type:'trough',at:[8,4]},{k:'prop',name:'hay',type:'hay',at:[-9,9]})}},
    // a brewery: the brewhouse (a tavern's), its granary, barrels stacked
    brewery:{cell:32,role:'brewery',S:C=>{piece(C,'tavern',[-4,5],0,{cut:['prop']});piece(C,'granary',[9,-8],0,{cut:['prop']});C.Q.parts.push({k:'prop',name:'b1',type:'barrel',at:[10,4]},{k:'prop',name:'b2',type:'barrel',at:[12,6]},{k:'prop',name:'b3',type:'barrel',at:[10,8]})}},
    // a granary yard: two granaries, sacks, a cart
    granary:{cell:32,role:'granary',S:C=>{piece(C,'granary',[-7,-6],0);piece(C,'granary',[6,-7],0,{cut:['prop']});C.Q.parts.push({k:'prop',name:'cart',type:'cart',at:[2,8],face:1},{k:'prop',name:'s',type:'sacks',at:[-6,9]})}},
    // a workshop yard: the warehouse, crates, a cart
    workshop:{cell:32,role:'workshop',ground:'cobble',S:C=>{piece(C,'warehouse',[-3,5],0);piece(C,'cottage',[6,-9],0,{cut:['prop'],lv:1});C.Q.parts.push({k:'prop',name:'cart',type:'cart',at:[-10,-8],face:1},{k:'prop',name:'c',type:'crate',at:[-12,-1]})}},
    // a town quarter (64): houses on both sides of a lane, a little square with a well, sheds and a garden behind
    quarter:{cell:64,role:'housing',ground:'cobble',E:C=>{rowE(C,31,9,31,64);rowE(C,1,9,31,64);C.Q.parts.push({k:'tower',name:'wl',round:true,c:[12,8],r:2.5,z:[0,3],wall:'stone',roof:{form:'water'}},
        {k:'bed',name:'g1',u:[-28,-20],v:[-10,4]},{k:'prop',name:'w1',type:'washing',at:[-22,14],face:1},{k:'prop',name:'c1',type:'cart',at:[16,-4]})},
      S:C=>{row(C,-31,-3,30,9,0);row(C,3,31,30,9,0);row(C,-31,-3,0,9,0);row(C,3,31,0,9,0);
      C.Q.parts.push({k:'tower',name:'wl',round:true,c:[0,12],r:2.5,z:[0,3],wall:'stone',roof:{form:'water'}},{k:'bed',name:'g1',u:[-28,-18],v:[-26,-20]},{k:'prop',name:'w1',type:'washing',at:[20,-24]},{k:'prop',name:'c1',type:'cart',at:[-6,16],face:1})}}
  };
  // camps (sites): a bandits' camp (32: one or two tents round a fire, crates or barrels), a hideout (64: the same in a ring of
  // spiked stakes, its way in at the front) and travellers (32: two tents, their wagon, the fire; the old picture is 3 x 2 tiles).
  // marks.fire: the foot of the fire's flame (PX.flame, the game's to animate); the flag on the highest tent
  function camp(C,ring,trav){const d=C.d,two=trav||d.chance(.5),k=ring?1.6:1;C.Q.role='camp';
    piece(C,'tent',[two?-7*k:0,-6*k],0,{cut:['prop']});if(two)piece(C,'tent',[7*k,-5*k],0,{cut:['prop']});if(trav)piece(C,'wagon',[6,8],0);
    C.Q.parts.push({k:'prop',name:'fire',type:'firepit',at:[trav?-6:0,trav?8:6]});C.Q.marks.fire=[trav?-6:0,trav?8:6,1];if(!trav)C.Q.parts.push({k:'prop',name:'gd',type:d.pick(['crate','barrel','sacks']),at:[two?9:8,6]});
    if(ring){const e=26,b=24;for(const [n,u,v] of [['pN',[-e,e],[-b,-b+1]],['pW',[-e,-e+1],[-b,b]],['pE',[e-1,e],[-b,b]],['pS0',[-e,-5],[b-1,b]],['pS1',[5,e],[b-1,b]]])C.Q.parts.push({k:'box',name:n,u,v,z:[0,4],wall:'stakes',top:true,topMat:'log'});
      C.Q.parts.push({k:'prop',name:'b1',type:'barrel',at:[-16,14]},{k:'prop',name:'lg',type:'logs',at:[15,-14]})}}
  CL.camp={cell:32,role:'camp',flag:false,S:C=>camp(C,false,false)};CL.hideout={cell:64,role:'camp',flag:true,S:C=>camp(C,true,false)};CL.travelers={cell:32,role:'camp',flag:true,S:C=>camp(C,false,true)};
  // a stable: planks under a single slope, three stalls open to the yard, a trough
  function stable(C,at,face){const n='q'+(C.n++)+'.',dw=C.Q.dwellings.length;C.Q.dwellings.push({kind:'stable',role:'stable',storeys:1});
    kit().place(C.Q,{parts:[{k:'box',name:'s',dw:0,u:[-7,7],v:[-3,3],z:[0,5],wall:'plank',foot:'stone',keep:1},{k:'roof',on:'s',form:'shed',axis:'u',rise:2,mat:C.o.roofMat},{k:'prop',type:'trough',at:[0,5]}],
      decals:[{wall:'s.S',kind:'stall',at:.18},{wall:'s.S',kind:'stall',at:.5},{wall:'s.S',kind:'stall',at:.82}],dwellings:[C.Q.dwellings.pop()]},at,face,n)}
  // a row of town houses down an east street: wall to wall up the plot's east side, their fronts east, gardens to the west
  // a row of town houses down an east street: wall to wall up the plot from its south end (v0) north, their fronts east at u1, as many
  // as stand with their roofs inside the cell (the last a low one), gardens behind them to the west
  function rowE(C,u1,d,v0,N){const R=C.d,top=-N/2+1;let v=v0,k=R.int(0,1);
    for(;;k++){let w=R.pick([9,10,11]),z=R.pick([5,6,9]),rise=3;if(v-w-(z+rise+1)<top){z=5;if(v-w-(z+rise+1)<top){w=v-top-(z+rise+1);if(w<7)break}}
      const o=C.o,wall=o.look.walls[R.int(0,o.look.walls.length-1)],P=new Plan(Object.assign({},o,{wall:o.env==='desert'?o.wall:wall}),32);C.Q.dwellings.push({kind:z>=9?'townhouse':'house',role:'home',storeys:z>=9?2:1});
      const dd=d+R.int(-2,1);house(P,{n:'h',w,d:dd,z,form:k%2?'front':'gable',rise,dw:0,door:.5,wins:1,chim:R.chance(.4),o:k%2?1:0,ov:k%2?0:1});kit().place(C.Q,{parts:P.parts,decals:P.decals,dwellings:[C.Q.dwellings.pop()]},[u1-dd/2-R.int(0,2),v-w/2],3,'r'+(C.n++)+'.');v-=w}}
  PX.CLUSTER_MODELS=Object.keys(CL);const RURAL_CL=['yard','farmstead','mill','lumber','mine','quarry','fishery','pasture','granary'];
  // mirror a layout: in u (an east street to a west one) or in v (south to north); the pieces turn to face the same way round
  function mirror(Q,axis){const U=axis==='u',m=p=>U?[-p[0],p[1]]:[p[0],-p[1]],mr=r=>[-r[1],-r[0]],ff=f=>U?[0,3,2,1][f&3]:[2,1,0,3][f&3],sd={E:'W',W:'E',N:'S',S:'N'};
    for(const p of Q.parts){if(p.u&&p.v){if(U)p.u=mr(p.u);else p.v=mr(p.v)}if(p.c)p.c=m(p.c);if(p.at)p.at=m(p.at);if(p.k==='prop')p.face=ff(p.face|0);
      if(p.k==='roof'&&p.form==='shed'&&((U&&p.axis==='v')||(!U&&p.axis!=='v')))p.hi=(p.hi||'b0')==='b1'?'b0':'b1';
      if(p.pts){const old=p.pts;p.pts=old.map(m);p.gates=(p.gates||[]).map(([g0,g1,i])=>{const a=old[i],b=old[i+1],alongU=a[1]===b[1];return(U===alongU)?[-g1,-g0,i]:[g0,g1,i]})}}
    for(const d of Q.decals){const k=d.wall.match(/\.([SNEW])$/);if(k&&(U?'EW':'NS').includes(k[1]))d.wall=d.wall.slice(0,-1)+sd[k[1]]}
    for(const k in Q.marks)Q.marks[k]=m(Q.marks[k]).concat(Q.marks[k].slice(2))}
  // settle into the cell: move the whole up or down so it stands inside at full scale; if it is too tall, the props off (the farthest
  // out first), then its fences and beds
  function settle(Q,N){const ext=()=>kit().extent(Object.assign({},Q,{yaw:0})),fit=N-2;
    for(let k=0;k<12;k++){const e=ext();if(e.y1-e.y0+1<=fit){const lo=-N/2+1-e.y0,hi=N/2-1-e.y1,dv=Math.round(Math.max(lo,Math.min(0,hi)));if(dv)shift(Q,dv);return}
      const loose=Q.parts.filter(p=>p.k==='prop'),flat=Q.parts.filter(p=>p.k==='fence'||p.k==='bed'),L=loose.length?loose:flat;if(!L.length)return;
      const far=L.reduce((a,p)=>Math.abs(at1(p))>Math.abs(at1(a))?p:a);Q.parts.splice(Q.parts.indexOf(far),1)}}
  const at1=p=>p.at?p.at[1]:p.v?(p.v[0]+p.v[1])/2:p.pts.reduce((a,q)=>a+q[1],0)/p.pts.length;
  const shift=(Q,dv)=>{for(const p of Q.parts){if(p.v)p.v=[p.v[0]+dv,p.v[1]+dv];if(p.c)p.c=[p.c[0],p.c[1]+dv];if(p.at)p.at=[p.at[0],p.at[1]+dv];if(p.pts)p.pts=p.pts.map(q=>[q[0],q[1]+dv])}for(const k in Q.marks)Q.marks[k][1]+=dv};
  PX.clusterModelSpec=spec=>{const L=CL[spec.kind];if(!L)throw new Error('no cluster '+spec.kind);const yaw=((spec.yaw|0)%8+8)%8&6,o=opts(spec,RURAL_CL.includes(spec.kind)?'cottage':'townhouse',97+PX.CLUSTER_MODELS.indexOf(spec.kind));
    const Q={cell:L.cell,role:L.role,ground:L.ground||null,parts:[],decals:[],dwellings:[],marks:{},flag:!!L.flag,env:o.env,seed:o.seed,yaw:0},C={Q,o,d:o.d,n:0,spec};
    const east=yaw===2||yaw===6;if(east&&L.E)L.E(C);else L.S(C);
    if(east&&!L.E){const r=([u,v])=>[v,-u];for(const p of Q.parts){if(p.u&&p.v){const a=[p.u[0],p.v[0]],b=[p.u[1],p.v[1]],A=r(a),B=r(b);p.u=[Math.min(A[0],B[0]),Math.max(A[0],B[0])];p.v=[Math.min(A[1],B[1]),Math.max(A[1],B[1])];
}if(p.c)p.c=r(p.c);if(p.at)p.at=r(p.at);if(p.k==='prop')p.face=((p.face|0)+3)%4;if(p.pts){p.pts=p.pts.map(r)}if(p.k==='chimney'&&p.d){const w=p.w;p.w=p.d;p.d=w}
        if(p.k==='roof'){const hv=(p.axis||'u')==='u'?[0,p.hi==='b1'?1:-1]:[p.hi==='b1'?1:-1,0],nh=r(hv);p.axis=(p.axis||'u')==='u'?'v':'u';p.hi=(p.axis==='u'?nh[1]:nh[0])>0?'b1':'b0'}}
      for(const d of Q.decals){const k=d.wall.match(/\.([SNEW])$/);if(k)d.wall=d.wall.slice(0,-1)+{S:'E',W:'S',N:'W',E:'N'}[k[1]]}for(const k in Q.marks)Q.marks[k]=r(Q.marks[k]).concat(Q.marks[k].slice(2))}
    if(yaw===4)mirror(Q,'v');if(yaw===2)mirror(Q,'u');
    settle(Q,Q.cell);Q.snow=SNOW(spec);return Q};
  PX.modelCacheClear=()=>CACHE.clear();
  PX.clusterModel=spec=>cached('c',spec,()=>{const s=PX.clusterModelSpec(Object.assign({},spec,{snow:0})),m=PX.model(s);return Object.assign(m,{kind:spec.kind,people:opts(spec,'cottage',0).people,facing:FACING[(((spec.yaw|0)%8+8)%8&6)/2]})});
})(window.PX=window.PX||{});
