'use strict';
/* ---------- PX engine: every building as a model (the world-map building redesign, stages 2 and 3) ---------- */
// Each of PX.BUILDING_TYPES (buildings.js) made again as a model (model.js: walls, roofs, towers, drawn by our own renderer in the
// people figures' style), at the owner's scale (2026-10-22): the world tile 16 px, a figure about a tile tall; 16 px objects (a well,
// a tent, a wagon, a stall...), 32 the smallest building, 64 the big ones, groups and centres, 128 a city's citadel or capital and a
// town quarter (PX.MODEL_SIZES, one table, with the households each building holds). The game still draws the old PX.building.
//   PX.buildingModel({type, people, seed, yaw, env, snow, lv, fort, stilts, glow, capital}) -> PX.model's result (img, ground,
//     groundKey, shadow, snow, flag, door, windows, buildings (each with its dwellings: the households it holds), households, marks
//     ...) and type, people, facing, gateX. Cached by its spec (the snow overlay a third of an amount at a time inside it).
//   PX.objectModel(spec): the same for the 16 px objects (PX.MODEL_OBJECTS): alone (a well in a square) or as a cluster's dressing.
//   PX.clusterModel({kind, people, seed, yaw, env, snow}) -> the same for a cell of several buildings and objects (PX.CLUSTER_MODELS):
//     a town row, a hamlet's yard, a farmstead, a smithy yard, an inn with its stable, a chapel and its graveyard, a market, a mill, a
//     lumber camp, a mine, a quarry, a fishery, a pasture, a brewery, a granary yard, a workshop yard (64), a town quarter (128); the
//     camps: a bandits' camp and travellers (32), a hideout (64), tents and wagons round a fire (marks.fire).
//   PX.buildingModelSpec / PX.clusterModelSpec: the spec alone (for tests and the gallery).
// One model a building, simply turned: its plan never depends on its facing (PX.MODEL_YAWS: 0 its front to the camera (south), 2
//   west, 4 north, 6 east), so all four come from the same parts, sizes, materials and features; a cluster turns whole. The castle
//   centres (keep, citadel, gatehouse, village: PX.MODEL_FRONT) stand straight on, their gate on the cell's middle column (gateX).
// Proportions (PX.MODEL_RULE): a storey's walls, a roof's rise by its span; with the camera's pitch (model.js PX.MODEL_CAMERA) the
//   walls fill about 40% of a building's front view; doors and windows at the figures' scale (model.js's capitalised decals).
// Peoples (LOOK): the roof the same whoever holds the place (humans orange-red tile, thatch in the country; dwarves slate navy;
//   elves green-teal leaf; orcs hide brown), over light walls; the shapes shared by all. Climates (env): the desert's walls sun-baked
//   adobe, sand under it; the frost's snow the overlay (spec.snow, 0-1; true or the frost: 1); the swamp's mud, and stilts
//   (spec.stilts) under houses. Seeded, never Math.random: the same spec, the same pixels.
(function(PX){
  const kit=()=>PX.modelKit;
  /* the peoples' looks: their roof (the country's for humans), their walls (light), framing; the climates' walls */
  const LOOK={human:{roof:'tile',rural:'thatch',walls:['daub','whitewash','daub','stone'],frame:'timber',stone:'stone',hall:'longhouse'},
    dwarf:{roof:'slate',walls:['stone','stone','whitewash'],frame:null,stone:'stone',hall:'stonehall'},
    elf:{roof:'leaf',walls:['whitewash','whitewash','plank'],frame:null,stone:'whitewash',hall:'elfhall'},
    orc:{roof:'hide',walls:['daub','plank','daub'],frame:null,stone:'stone',wood:'log',hall:'hidehall'}};
  const DESERT={human:'adobe',dwarf:'adobe',elf:'whitewash',orc:'adobe'};
  // the types whose roof is the country's (humans thatch there), and those that stand on cobbles
  const RURAL=['cottage','fisherhut','longhouse','barn','granary','windmill','watermill','lumbershed','well','haystack'],TOWN=['townhouse','tavern','stall','warehouse','citadel'];
  PX.MODEL_LOOK=LOOK;

  /* the sizes, one table (the owner's scale, 2026-10-22): each type's cell (px) and the households (dwellings) its building holds.
     16: objects, not buildings. 32: the smallest building. 64: the big ones and the groups, the centres of villages, castles and
     towns. 128: a city's citadel or a capital (citadel with spec.capital), a town quarter. A building may rise above its plan into
     its cell (roof, chimney, spire); its picture never leaves its cell */
  const SIZE={types:{
      well:[16,0],signpost:[16,0],shrine:[16,0],tent:[16,1],wagon:[16,0],cart:[16,0],stall:[16,0],haystack:[16,0],woodpile:[16,0],fence:[16,0],crates:[16,0],barrels:[16,0],
      cottage:[32,2],townhouse:[32,3],fisherhut:[32,2],yurt:[32,2],hidehall:[32,3],treehouse:[32,2],elfhall:[32,3],stonehall:[32,4],chapel:[32,0],tower:[32,0],
      smithy:[32,0],forge:[32,0],barn:[32,0],granary:[32,0],windmill:[32,0],watermill:[32,0],watchtower:[32,0],warehouse:[32,0],lumbershed:[32,0],minehead:[32,0],
      crane:[32,0],spire:[32,0],ruins:[32,0],cave:[32,0],
      tavern:[64,0],church:[64,0],longhouse:[64,4],keep:[64,0],gatehouse:[64,0],village:[64,0],citadel:[64,0]},
    clusters:{row:64,yard:64,farmstead:64,smithy:64,inn:64,chapel:64,market:64,mill:64,lumber:64,mine:64,quarry:64,fishery:64,pasture:64,brewery:64,granary:64,workshop:64,
      quarter:128,camp:32,travelers:32,hideout:64}};
  PX.MODEL_SIZES={types:Object.fromEntries(Object.entries(SIZE.types).map(([k,[cell,dwellings]])=>[k,{cell,dwellings}])),clusters:SIZE.clusters};
  /* the shared proportions: a storey's walls (px: the door's 8 and a little, then 6 a storey up), a roof's rise by its span */
  const RULE={storey:[0,10,16,22],rise:span=>Math.max(4,Math.round(span*.55))};PX.MODEL_RULE=RULE;

  /* a plan being built: its parts, decals and buildings, in the type's own ground plan (px, the cell's middle at 0; v toward its
     front). lift raises what it builds (stilts) */
  class Plan{
    constructor(o,cell){this.o=o;this.cell=cell;this.parts=[];this.decals=[];this.dwellings=[];this.lift=0;this.marks={};this.role=null;this.ground=null;this.flag=false}
    box(name,u,v,z,wall,x){this.parts.push(Object.assign({k:'box',name,u,v,z:[z[0]+this.lift,z[1]+this.lift],wall},x));return this}
    roof(on,form,axis,rise,mat,x){this.parts.push(Object.assign({k:'roof',on,form,axis,rise,mat},x));return this}
    round(name,c,r,z,wall,roof,x){this.parts.push(Object.assign({k:'tower',name,round:true,c,r,z:[z[0]+this.lift,z[1]+this.lift],wall,roof},x));return this}
    square(name,c,w,z,wall,roof,x){this.parts.push(Object.assign({k:'tower',name,c,w,z:[z[0]+this.lift,z[1]+this.lift],wall,roof},x));return this}
    chim(at,z0,z1,w,x){this.parts.push(Object.assign({k:'chimney',name:'ch'+this.parts.length,at,w:w||3,z:[z0+this.lift,z1+this.lift]},x));return this}
    // (a prop at the figures' scale: s 2 unless said)
    prop(type,at,face,s,lift){this.parts.push({k:'prop',name:'p'+this.parts.length,type,at,face:face|0,s:s||2,lift:(lift|0)+this.lift});return this}
    dec(wall,kind,at,z,gable){this.decals.push(Object.assign({wall,kind,at,z:z||0},gable?{gable:true}:{}));return this}
    fence(pts,gates,h,mat){this.parts.push({k:'fence',name:'f'+this.parts.length,pts,gates,h:h||4,mat});return this}
    bed(u,v,mat){this.parts.push({k:'bed',name:'b'+this.parts.length,u,v,topMat:mat});return this}
    home(kind,role,storeys,dwellings){this.dwellings.push({kind,role:role||'home',storeys:storeys||1,dwellings});return this.dwellings.length-1}
    // a cut-out standing in the plane v..v+1 (a wheel, sails, a sign, braces): rows top to bottom, a material a letter, each run of a
    // row one thin box (u0 its left, z0 its foot)
    cut(name,u0,v,z0,rows,mats){rows.forEach((r,i)=>{const z=z0+rows.length-1-i;for(let c=0;c<r.length;){const ch=r[c];if(!mats[ch]){c++;continue}let e=c;while(e<r.length&&r[e]===ch)e++;
      this.box(name+i+'_'+c,[u0+c,u0+e],[v,v+1],[z,z+1],mats[ch],{thin:true,fine:true,top:true});c=e}});return this}
    // a wheel standing in the plane v..v+1 round (u, z): its rim, spokes and hub
    wheel(name,u,v,z,r,mat){const n=Math.ceil(r),rows=[];for(let j=n;j>=-n;j--){let s='';for(let i=-n;i<=n;i++){const d=Math.hypot(i,j);s+=d<.8?'i':Math.abs(d-r)<.75||(d<r&&(i===0||j===0||(r>=5&&Math.abs(Math.abs(i)-Math.abs(j))<.5)))?'w':'.'}rows.push(s)}
      return this.cut(name,u-n-.5,v,z-n,rows,{w:mat||'timber',i:'iron'})}
    // rails on timber sleepers, flat on the ground, from a to b along u (or v), centred on c across
    rails(n,a,b,c,au){for(let k=a;k<b;k+=3)this.box(n+'s'+k,au?[k,k+1]:[c-3,c+3],au?[c-3,c+3]:[k,k+1],[0,1],'timber',{thin:true,flat:true,top:true});
      for(const s of [-2,2])this.box(n+'r'+s,au?[a,b]:[c+s-.5,c+s+.5],au?[c+s-.5,c+s+.5]:[a,b],[0,1],'iron',{thin:true,flat:true,top:true});return this}
    spec(){const o=this.o;return{cell:this.cell,parts:this.parts,decals:this.decals,dwellings:this.dwellings,role:this.role,ground:this.ground||(TOWN.includes(o.type)?'cobble':null),
      env:o.env,seed:o.seed,flag:this.flag,marks:this.marks,yaw:o.yaw}}
  }

  /* the common pieces */
  // a house: its walls, roof, chimney, a door and windows on every wall (a row a storey), on a stone footing unless of stone or
  // adobe. s: {n, c, w, d, st (storeys) or z, form ('gable' along its front, 'front' its gable to the front, 'hip', 'shed', 'vault'),
  // rise, wall, roof, frame, dw, door (at), doorKind, chim (true, false or [u, v]), lip, finial, fmat, back ('door'), wins, pick}
  function house(Q,s){const o=Q.o,n=s.n||'h',[cu,cv]=s.c||[0,0],w=s.w,d=s.d,st=s.st||1,z=s.z||RULE.storey[st],wall=s.wall||o.wall,roof=s.roof||o.roofMat,form=s.form||'gable',
      rise=s.rise||RULE.rise(form==='front'?w:d),u=[cu-w/2,cu+w/2],v=[cv-d/2,cv+d/2];
    const frame=s.frame!==undefined?s.frame:(wall==='daub'||wall==='whitewash')?o.look.frame:null;
    Q.box(n,u,v,[0,z],wall,{dw:s.dw,frame,foot:wall==='stone'||wall==='adobe'||s.foot===false?null:'stone',rail:st>=2});
    Q.roof(n,form==='front'?'gable':form,form==='front'||(form==='hip'&&d>w)?'v':'u',rise,roof,{lip:s.lip||(roof==='thatch'||roof==='hide'?2:1),finial:s.finial,fmat:s.fmat,o:s.o,ov:s.ov!=null?s.ov:1,hi:s.hi});
    if(s.chim!==false&&(s.chim||o.d.chance(.6))){const at=Array.isArray(s.chim)?s.chim:form==='front'?[cu+w/2-3,cv-d/2+3]:[cu+w/2-4,cv-1];Q.chim(at,z-1,z+rise+3,3)}
    // the front: the door, windows either side clear of it, a row more a storey up; the back a door or a window; the ends a window a storey
    const at=s.door==null?.5:s.door,dk=s.doorKind||'Door',nw=s.wins!=null?s.wins:w>=40?4:w>=24?3:2,xs=[[],[at<.5?.78:.22],[.2,.8],[.15,.5,.85],[.12,.36,.64,.88]][nw];
    const clear=x=>Math.abs(x-at)*w>=(kit().DECAL[dk][0].length+6)/2+1,pick=()=>s.pick?o.d.pick(s.pick):'Win';
    Q.dec(n+'.S',dk,at);for(const x of xs)if(clear(x))Q.dec(n+'.S',pick(),x,3);
    for(let k=2;k<=st;k++)for(const x of nw===1?[.3,.7]:xs)Q.dec(n+'.S',o.d.pick(['WinS','Win']),x,RULE.storey[k-1]+1);
    if(s.back==='door'){Q.dec(n+'.N','Door',.3);Q.dec(n+'.N','Win',.75,3)}else if(nw)Q.dec(n+'.N','Win',.5,3);
    for(const k of ['E','W'])for(let i=1;i<=st&&nw;i++)Q.dec(n+'.'+k,'Win',.5,i===1?3:RULE.storey[i-1]+1);
    return{u,v,z,rise}}
  // a dormer on a house's front slope (its ridge along u): a little gabled window standing out of the roof
  const dormer=(Q,n,u,v,z,c)=>{Q.box(n,[c-3,c+3],[(v[0]+v[1])/2,v[1]-1],[z-1,z+6],Q.o.wall,{frame:null});Q.roof(n,'gable','v',3,Q.o.roofMat,{o:0,ov:0});Q.dec(n+'.S','Win',.5,1)};
  // a lean-to against a wall (an annex)
  const lean=(Q,n,u,v,z,mat)=>{Q.box(n,u,v,[0,z],'plank',{foot:'stone',keep:1});Q.roof(n,'shed','u',3,mat,{o:1,ov:0});Q.dec(n+'.S','Door',.5)};
  // stilts (spec.stilts, a swamp's houses): posts under the corners of the plan, a deck at their top
  function stilts(Q,u,v){const h=Q.lift;if(!h)return;const [u0,u1]=u,[v0,v1]=v;
    for(const [a,b] of [[u0,v0],[u1-2,v0],[u0,v1-2],[u1-2,v1-2]])Q.parts.push({k:'box',name:'post'+a+b,u:[a,a+2],v:[b,b+2],z:[0,h],wall:'log',top:true});
    Q.parts.push({k:'box',name:'deck',u:[u0-1,u1+1],v:[v0,v1+2],z:[h-1,h],wall:'plank',top:true,thin:true})}
  // a tree among buildings: its trunk and a round crown (green, evergreen or autumn)
  const tree=(Q,n,c,h,r,crown)=>{Q.round(n+'t',c,1.5,[0,h],'log',null);Q.round(n+'c',c,r,[h-2,h+1],crown,{form:'cone',rise:Math.round(r*.9),mat:crown,o:0})};
  // the holy symbol: a gold cross standing on a roof's peak
  const cross=(Q,n,u,v,z)=>Q.cut(n,u-1.5,v,z,['.y.','yyy','.y.','.y.'],{y:'gold'});
  // braces: an X of beams between two posts (w wide, h tall, in the plane v)
  const braces=(Q,n,u0,v,z0,w,h)=>{const rows=[];for(let j=h-1;j>=0;j--){let s='';for(let i=0;i<w;i++){const a=j*(w-1)/(h-1);s+=Math.abs(i-a)<.6||Math.abs(w-1-i-a)<.6?'t':'.'}rows.push(s)}Q.cut(n,u0,v,z0,rows,{t:'timber'})};
  // a windmill's four sails: an X of spars, a lattice of cloth to one side of each, in the plane v round the hub (u, z)
  function sails(Q,u,v,z,L){const rows=[];for(let j=L;j>=-L;j--){let s='';for(let i=-L;i<=L;i++){let ch='.';
      for(let k=0;k<4;k++){const a=Math.PI/4+k*Math.PI/2,al=i*Math.cos(a)+j*Math.sin(a),ac=-i*Math.sin(a)+j*Math.cos(a);if(al<1.5||al>L+.5)continue;
        if(Math.abs(ac)<.55){ch='w';break}if(ac>0&&ac<3.2&&al>3)ch=Math.round(al)%3===0?'w':'c'}s+=ch}rows.push(s)}
    Q.cut('sl',u-L-.5,v,z-L,rows,{w:'timber',c:'canvas'})}
  // castle walls round the plan u0..u1, v0..v1 at fort 1 (a palisade of stakes, log towers at the corners), 2 (stone walls, round
  // towers) or 3 (taller, a tower halfway along each side); the gate on the middle of the front, its gatehouse; towers' roofs cones of
  // the people's roof or flat; k the scale (2 a capital's)
  function curtain(Q,u0,u1,v0,v1,fort,cone,k){const o=Q.o,st=o.people==='orc'?'log':o.look.stone==='whitewash'?'whitewash':'stone',pal=fort===1,wz=(pal?8:fort===3?15:12)*k,t=pal?2:4,gw=pal?10:12,tz=wz+(pal?4:7),R=pal?4:5*k;
    const wallBox=(n,u,v)=>Q.box(n,u,v,[0,wz],pal?'stakes':st,{top:true,topMat:pal?'log':st});
    wallBox('cwN',[u0,u1],[v0,v0+t]);wallBox('cwW',[u0,u0+t],[v0,v1]);wallBox('cwE',[u1-t,u1],[v0,v1]);wallBox('cwS0',[u0,-gw/2],[v1-t,v1]);wallBox('cwS1',[gw/2,u1],[v1-t,v1]);
    // (the merlons along each wall's outer edge, every third pixel)
    if(!pal){const mer=(n,u,v,au)=>{const [a0,a1]=au?u:v;for(let q=a0+1;q<a1-1;q+=3){const r=[q,q+1.5];Q.box(n+q,au?r:u,au?v:r,[wz,wz+2],st,{top:true})}};
      mer('mN',[u0,u1],[v0,v0+1],true);mer('mS0',[u0,-gw/2],[v1-1,v1],true);mer('mS1',[gw/2,u1],[v1-1,v1],true);mer('mW',[u0,u0+1],[v0,v1],false);mer('mE',[u1-1,u1],[v0,v1],false)}
    const tower=(n,c)=>pal?Q.square(n,c,7,[0,tz],'log',{form:'pyramid',rise:4,mat:o.roofMat}):cone?Q.round(n,c,R,[0,tz],st,{form:'cone',rise:8*k,mat:o.roofMat}):Q.square(n,c,R*2,[0,tz],st,{form:'battlements'});
    tower('tNW',[u0+2,v0+2]);tower('tNE',[u1-2,v0+2]);tower('tSW',[u0+2,v1-2]);tower('tSE',[u1-2,v1-2]);
    if(fort===3){tower('tW',[u0+2,(v0+v1)/2]);tower('tE',[u1-2,(v0+v1)/2]);tower('tN',[(u0+u1)/2,v0+2])}
    // the gatehouse: a block over the gate between two towers (a palisade's: a gap between two posts)
    if(pal){Q.box('gp0',[-gw/2-2,-gw/2],[v1-3,v1],[0,wz+3],'log',{top:true});Q.box('gp1',[gw/2,gw/2+2],[v1-3,v1],[0,wz+3],'log',{top:true})}
    else{Q.box('gate',[-gw/2-1,gw/2+1],[v1-8,v1+1],[0,wz+5],st);Q.roof('gate','flat',null,0,st,{parapet:2,merlons:true});Q.dec('gate.S','Gate',.5);
      for(const s of [-1,1]){Q.round('gt'+s,[s*(gw/2+3),v1-3],4,[0,wz+8],st,cone?{form:'cone',rise:7,mat:o.roofMat}:{form:'lid',mat:st});Q.dec('gt'+s+'.S','Slit',.5,wz)}}
    for(const n of ['tSW','tSE'])Q.dec(n+'.S','Slit',.5,Math.round(tz*.55));Q.marks.gate=[0,v1,0]}
  // a shed of planks under a single slope, its door (a yard's store, a winch house, a stable's)
  const shed=(Q,n,c,w,d,z,mat,dw)=>{Q.box(n,[c[0]-w/2,c[0]+w/2],[c[1]-d/2,c[1]+d/2],[0,z],'plank',{foot:'stone',keep:1,dw});Q.roof(n,'shed','u',3,mat,{o:1,ov:0});Q.dec(n+'.S','Door',.35)};

  /* the types: each fills its plan Q from its options o: {type, people, look, wall, roofMat, env, seed, d (its dice), lv, fort, stilts,
     glow, capital}; never from its facing */
  const T={
    // --- the 16 px objects ---
    // a well: a ring of stones round dark water, two posts and a little roof of the people's over its windlass
    well(Q,o){Q.round('w',[0,1],4.5,[0,4],o.look.stone==='whitewash'?'stone':o.look.stone,{form:'water'});
      for(const s of [-1,1])Q.box('wp'+s,[s*4.5-.5,s*4.5+.5],[.5,1.5],[0,6],'timber',{top:true});
      Q.box('wr',[-5.5,5.5],[-1,3],[6,7],'timber',{thin:true});Q.roof('wr','gable','u',2,o.roofMat,{o:0,ov:0});Q.box('wx',[-3.5,3.5],[.5,1.5],[4,5],'log',{top:true})},
    // a signpost: its post, two boards pointing ways, stones at its foot
    signpost(Q,o){Q.box('p',[-.5,.5],[-.5,.5],[0,11],'timber',{top:true});Q.cut('a',-5.5,.5,5,['.bbbbbb....','bbbbbbb....','...........','....bbbbbb.','....bbbbbbb'],{b:'plank'});Q.prop('boulder',[1.5,1.5],0,1)},
    // a shrine (a site's marker): standing stones round a glowing altar, or an obelisk
    shrine(Q,o){const d=o.d,st=o.look.stone==='whitewash'?'stone':o.look.stone;Q.role='shrine';
      if(d.chance(.5)){for(const [a,b,h] of [[-5,-2,8],[5,-2,7],[-3,-5,9],[3,-5,8],[-5,3,6],[5,3,7]])Q.box('s'+a+b,[a-1,a+1],[b-1,b+1],[0,h],st,{top:true});Q.box('al',[-2,2],[-1,2],[0,3],st,{top:true,topMat:o.glow})}
      else{Q.square('ob',[0,0],4,[0,9],st,{form:'pyramid',rise:2,mat:o.glow,o:0});Q.box('al',[-4,4],[-4,4],[0,1],st,{top:true})}},
    // a tent: a ridge tent of cloth (plain, red or blue), its gable and flap to the front
    tent(Q,o){const d=o.d,c=d.pick(['canvas','canvas','canvasR','canvasB']),dw=Q.home('tent','home');
      Q.box('t',[-5.5,5.5],[-4,4],[0,2],c,{dw,keep:1});Q.roof('t','gable','v',7,c,{o:0,ov:0,lip:1,finial:1});Q.dec('t.S','Flap',.5,2,true)},
    // a covered wagon on its wheels, its shaft out in front
    wagon(Q,o){const d=o.d,c=d.pick(['canvas','canvas','linen']),dw=Q.home('wagon','store');
      Q.box('b',[-5,4],[-2.5,2.5],[2,5],'plank',{dw,top:true});Q.box('cv',[-4.5,3.5],[-2.5,2.5],[5,6],c,{keep:1,thin:true});Q.roof('cv','vault','u',4,c,{o:0,ov:0,lip:1});
      Q.wheel('wf',-3,2.5,2.5,2.5);Q.wheel('wr',2,2.5,2.5,2.5);Q.box('sh',[4,7],[-.5,.5],[2,3],'timber',{top:true});Q.dec('b.W','hatch',.5,0)},
    // a cart: an open bed on one wheel, its shafts, a load (sacks, crates, hay or logs)
    cart(Q,o){const d=o.d;Q.box('b',[-4,3],[-2.5,2.5],[2,4],'plank',{top:true});Q.wheel('w',-.5,2.5,2,2.5);Q.box('sh',[3,7],[-.5,.5],[2,3],'timber',{top:true});
      const g=d.pick(['sacks','crate','hay','logs']);Q.prop(g,[-.5,-.5],0,g==='logs'?.8:1,4)},
    // a market stall: a counter of goods under a striped awning on posts, crates or sacks behind
    stall(Q,o){const d=o.d,aw=d.pick(['awning','awningB','awningG']),dw=Q.home('stall','trade');Q.ground='cobble';
      Q.box('ct',[-5,5],[0,3],[0,3],'plank',{dw,top:true,topMat:d.pick(['crop','linen','gold']),keep:1});
      for(const [a,b] of [[-6,-3],[5,-3],[-6,3],[5,3]])Q.box('po'+a+b,[a,a+1],[b,b+1],[0,6],'timber',{top:true});
      Q.box('aw',[-6,6],[-3.5,4],[6,7],aw,{thin:true,keep:1});Q.roof('aw',d.chance(.5)?'gable':'shed','u',2,aw,{o:1,ov:0,hi:'b0'});Q.dec('ct.S','Goods',.5,0);
      Q.prop(d.pick(['crate','sacks','barrel']),[-3,-1],0,1)},
    // a haystack, round under its own cone
    haystack(Q,o){Q.round('h',[0,0],5,[0,4],'thatch',{form:'cone',rise:6,mat:'thatch',o:0});Q.prop('hay',[4.5,3],0,1)},
    // a woodpile: split logs stacked, their ends to the front, a chopping block
    woodpile(Q,o){Q.box('w',[-5,5],[-2.5,2.5],[0,5],'log',{top:true,topMat:'logend'});Q.dec('w.S','Logs',.5,0);Q.prop('stump',[3,4.5],0,1)},
    // a fence piece: posts and rails, straight, a corner or with a gate
    fence(Q,o){const k=o.d.int(0,2);Q.fence(k===1?[[-7,-4],[6,-4],[6,5]]:[[-7,1],[7,1]],k===2?[[-2,2,0]]:null,5,'plank')},
    // crates stacked
    crates(Q,o){Q.box('c0',[-5,-1],[-2,2],[0,4],'plank',{top:true});Q.box('c1',[0,4],[-1,3],[0,4],'plank',{top:true});Q.box('c2',[-3,1],[-2,1],[4,8],'plank',{top:true});for(const n of ['c0','c1','c2'])Q.dec(n+'.S','Crate',.5,0)},
    // barrels, hooped
    barrels(Q,o){for(const [n,c] of [['b0',[-2.5,-1.5]],['b1',[2.5,-1.5]],['b2',[0,2]]]){Q.round(n,c,2.4,[0,6],'plank',{form:'lid',mat:'plank'});Q.dec(n+'.S','Hoop',.5,1);Q.dec(n+'.S','Hoop',.5,4)}},

    // --- 32 px: the smallest buildings ---
    // a cottage: a side gable, a gable to the front or a hip; a chimney; a barrel, a woodpile or a crate by it; better levels a
    // chimney and flower boxes, then a second storey and a dormer
    cottage(Q,o){const d=o.d,lv=o.lv,st=lv>=3?2:1,w=d.pick([18,20]),dd=14,form=d.pick(['gable','gable','front','hip']),dw=Q.home('cottage','home',st);
      Q.lift=o.stilts?5:0;const h=house(Q,{w,d:dd,st,form,rise:form==='front'?9:undefined,dw,door:d.pick([.3,.5,.7]),chim:lv>=2?true:undefined,pick:lv>=2?['WinF','WinS']:['Win','WinS']});
      if(lv>=3&&form==='gable')dormer(Q,'dm',h.u,h.v,h.z,d.pick([-4,4]));stilts(Q,h.u,h.v);
      const p=d.pick(['barrel','woodpile','crate','barrel','']);if(p)Q.prop(p,[w/2-2,dd/2+2]);Q.lift=0},
    // a townhouse: two storeys to the street, the upper jettied out over the lower (a timber frame), its gable to the street or along it
    townhouse(Q,o){const d=o.d,w=18,dd=10,dw=Q.home('townhouse','home',2),wall=o.people==='human'?'daub':o.wall,front=d.chance(.6),lo=o.people==='dwarf'||wall==='daub'?'stone':wall;
      Q.box('lo',[-w/2,w/2],[-dd/2,dd/2],[0,9],lo,{dw});Q.box('h',[-w/2,w/2],[-dd/2,dd/2+1],[9,15],wall,{dw,frame:o.look.frame});
      Q.roof('h','gable',front?'v':'u',front?7:6,o.roofMat,{lip:1,finial:front,ov:1});Q.chim([w/2-3,-dd/2+2],13,front?22:20,3);
      const da=d.pick([.25,.75]);Q.dec('lo.S','Door',da);Q.dec('lo.S',d.pick(['Win','WinF']),1-da,2);Q.dec('h.S','WinS',.25,1);Q.dec('h.S','WinS',.75,1);
      Q.dec('lo.N','Door',.5);Q.dec('h.N','Win',.5,1);for(const k of ['E','W']){Q.dec('h.'+k,'Win',.5,1);Q.dec('lo.'+k,'Win',.5,2)}},
    // a fisher's hut: planks under a low gable, its net on a rack and a barrel; on stilts over a bog
    fisherhut(Q,o){const w=18,dd=12,dw=Q.home('fisherhut');Q.lift=o.stilts?5:0;
      const h=house(Q,{w,d:dd,z:9,wall:'plank',rise:6,dw,door:.3,chim:false,wins:1});stilts(Q,h.u,h.v);Q.prop('nets',[w/2-4,dd/2+3]);Q.prop('barrel',[-w/2+1,-1]);Q.lift=0},
    // a chapel: its nave's gable and door to the front, a bellcote over it with its bell, the cross on top, lancets
    chapel(Q,o){const st=o.look.stone,dw=Q.home('chapel','worship');
      Q.box('n',[-7,7],[-9,6],[0,10],st,{dw});Q.roof('n','gable','v',6,o.roofMat,{ov:1});
      Q.box('bc',[-2.5,2.5],[3,6],[12,17],st,{dw});Q.roof('bc','gable','v',2,o.roofMat,{o:0,ov:0});Q.dec('bc.S','Bell',.5,0);cross(Q,'x',0,4.5,19);
      Q.dec('n.S','Door2',.5);Q.dec('n.S','Lancet',.14,3);Q.dec('n.S','Lancet',.86,3);Q.dec('n.N','Lancet',.5,3);for(const k of ['E','W'])for(const a of [.25,.5,.75])Q.dec('n.'+k,'Lancet',a,3);
      Q.prop('headstone',[-10,7])},
    // a tower: round, a lookout gallery wider than its body under a cone of the people's roof; or square with battlements
    tower(Q,o){const d=o.d,st=o.people==='orc'?'log':o.look.stone,dw=Q.home('tower','defence');Q.flag=true;
      if(d.chance(.6)){Q.round('tw',[0,0],6,[0,15],st,null,{dw});Q.round('hd',[0,0],7.5,[15,19],o.people==='orc'?'log':'plank',{form:'cone',rise:8,mat:o.roofMat,o:1},{dw});
        Q.dec('hd.S','Slit',.5,0);Q.dec('hd.E','Slit',.5,0);Q.dec('hd.W','Slit',.5,0);Q.dec('tw.S','Door',.5);Q.dec('tw.S','Slit',.5,10);Q.dec('tw.N','Slit',.5,10)}
      else{Q.square('tw',[0,0],12,[0,20],st,{form:'battlements'},{dw});Q.dec('tw.S','Door',.5);Q.dec('tw.S','Slit',.3,12);Q.dec('tw.S','Slit',.7,12);for(const k of ['E','W','N'])Q.dec('tw.'+k,'Slit',.5,12)}},
    // a yurt: a round wall of felt under a low cone, its crown ring, its door, tusks either side of it
    yurt(Q,o){const d=o.d,dw=Q.home('yurt'),felt=o.people==='orc'||o.people==='human'?'canvas':o.look.walls[0];
      Q.round('y',[0,0],11,[0,9],felt,{form:'cone',rise:6,mat:o.roofMat,o:1},{dw});Q.round('yb',[0,0],11.3,[6,7],'timber',null);Q.round('cw',[0,0],2,[14,15],'timber',{form:'lid',mat:'timber'});
      Q.dec('y.S','Door',.5);if(d.chance(.6)||o.lv>=2){Q.prop('tusk',[-5,12]);Q.prop('tusk',[5,12])}else Q.prop('woodpile',[8,10])},
    // a hide hall: a long round hall, its walls low and its roof of hides vaulted over the middle and coned over its rounded ends,
    // bone horns at its ridge's ends, a totem by its door
    hidehall(Q,o){const dw=Q.home('hidehall','home'),wall=o.people==='orc'?'log':o.wall;house(Q,{w:14,d:14,z:10,form:'vault',rise:7,wall,dw,door:.5,wins:0,chim:false,o:1});
      for(const s of [-1,1]){Q.round('e'+s,[s*7,0],7,[0,10],wall,{form:'cone',rise:7,mat:o.roofMat,o:1},{dw});Q.dec('e'+s+'.S','Win',s<0?.3:.7,3);Q.cut('hn'+s,s*7-1.5,-.5,16,['b.b','b.b','.b.'],{b:'bone'})}
      Q.prop('totem',[6,10]);Q.prop('tusk',[-5,9])},
    // a smithy: its forge open to the street under a lean-to on posts, the hearth glowing inside, the anvil, a great stone chimney
    smithy(Q,o){const st=o.people==='orc'?'log':o.look.stone,dw=Q.home('smithy','work');
      Q.box('f',[-12,4],[-7,3],[0,13],st,{dw});Q.roof('f','gable','u',5,o.roofMat,{ov:1});Q.dec('f.S','Forge',.45);Q.dec('f.N','Door',.5);Q.dec('f.W','Win',.5,4);
      Q.chim([8,-3],0,20,6);Q.box('aw',[-12,4],[3,8],[11,12],'timber',{thin:true});Q.roof('aw','shed','u',1,o.roofMat,{o:1,ov:0,hi:'b0'});
      for(const a of [-12,3])Q.box('po'+a,[a,a+1],[7,8],[0,11],'timber',{top:true});Q.prop('anvil',[-10,6]);Q.prop('barrel',[1,6]);Q.prop('coal',[8,6])},
    // a dwarves' forge: stone under a hip, a heavy stone arch round its glow, a hearth before it, two chimneys, anvil and coal
    forge(Q,o){const dw=Q.home('forge','work');Q.box('f',[-12,12],[-7,4],[0,12],'stone',{dw});Q.roof('f','hip','u',5,o.roofMat,{o:1});
      Q.chim([-8,-3],10,21,4);Q.chim([8,-3],10,21,4);Q.dec('f.S','ForgeS',.5);Q.dec('f.W','Win',.5,4);Q.dec('f.E','Win',.5,4);Q.dec('f.N','Door',.5);
      Q.box('hb',[-3,3],[4,6],[0,2],'stone',{top:true,topMat:'ember'});Q.prop('anvil',[-7,7]);Q.prop('coal',[7,7])},
    // a barn: planks, its great braced doors under a big gable to the front, hay by it
    barn(Q,o){const dw=Q.home('barn','store');Q.box('b',[-10,10],[-8,6],[0,12],'plank',{dw,foot:'stone'});Q.roof('b','gable','v',8,o.roofMat,{lip:2,finial:1,ov:1});
      Q.dec('b.S','Barn',.5);Q.dec('b.N','Door',.5);for(const k of ['E','W']){Q.dec('b.'+k,'Hatch',.3,6);Q.dec('b.'+k,'Hatch',.7,6)}Q.prop('hay',[10,7],0,1.5)},
    // a granary: a timber store raised on staddle stones, steps to its door; or a round store under a cone
    granary(Q,o){const d=o.d,dw=Q.home('granary','store');
      if(d.chance(.5)){for(const [a,b] of [[-7,-5],[7,-5],[-7,4],[7,4]]){Q.round('ss'+a+b,[a,b],1,[0,3],'stone',{form:'lid',mat:'stone'});Q.round('sc'+a+b,[a,b],2.2,[3,4],'stone',{form:'lid',mat:'stone'})}
        Q.lift=4;house(Q,{n:'g',w:18,d:12,z:10,wall:'plank',dw,door:.5,chim:false,wins:0,rise:6,lip:1});Q.lift=0;Q.box('stp',[-2,2],[6,9],[0,3],'plank',{top:true});Q.prop('sacks',[7,8])}
      else{const st=o.people==='orc'?'log':o.look.stone==='whitewash'?'plank':'stone';Q.round('g',[0,-1],7,[0,12],st,{form:'cone',rise:9,mat:o.roofMat,o:1},{dw});Q.round('gb',[0,-1],7.4,[0,1],'stone',null);
        Q.dec('g.S','Door',.5);Q.dec('g.E','Win',.5,5);Q.dec('g.W','Win',.5,5);Q.dec('g.N','Win',.5,5);Q.prop('sacks',[8,6])}},
    // a windmill: its round tower under a cap, the door at its foot, its four sails on the front round the hub
    windmill(Q,o){const d=o.d,dw=Q.home('windmill','work'),wall=d.pick(['stone','whitewash','plank']);
      Q.round('m',[0,0],5.5,[0,16],wall,{form:'cone',rise:5,mat:o.roofMat,o:1},{dw});Q.dec('m.S','Door',.5);Q.dec('m.S','Win',.5,10);Q.dec('m.N','Win',.5,10);
      Q.box('hub',[-1,1],[5,7.5],[12,14],'timber',{top:true});sails(Q,0,7.5,13,10)},
    // a watermill: stone under the people's roof, its wheel turning in the race before it
    watermill(Q,o){const dw=Q.home('watermill','work');house(Q,{w:20,d:12,c:[-3,-2],z:10,rise:6,wall:'stone',dw,door:.22,wins:1,chim:[-9,-3]});
      Q.bed([-14,14],[5,11],'water');Q.wheel('wh',5,4,5,5.5)},
    // a watchtower: a hut of logs on four tall posts braced, its roof, a ladder up the front, a trap door
    watchtower(Q,o){const dw=Q.home('watchtower','defence'),H=11;Q.flag=true;
      for(const [a,b] of [[-6,-4],[5,-4],[-6,3],[5,3]])Q.box('p'+a+b,[a,a+1],[b,b+1],[0,H],'log',{top:true});braces(Q,'x',-5,3.5,1,10,H-2);
      Q.box('dk',[-7,7],[-5,5],[H,H+1],'plank',{top:true,thin:true});Q.box('h',[-5,5],[-4,4],[H+1,H+7],'log',{dw});Q.roof('h','gable','v',4,o.roofMat,{lip:2,finial:1,fmat:'bone'});
      Q.dec('h.S','Hatch',.5,1);Q.dec('h.E','Slit',.5,2);Q.dec('h.W','Slit',.5,2);Q.cut('ld',-1.5,4.5,0,Array.from({length:H},(_,i)=>i%2?'t.t':'ttt'),{t:'timber'})},
    // a warehouse: long, planks, great doors under a loft's hatch and a hoist, crates
    warehouse(Q,o){const dw=Q.home('warehouse','store');Q.box('w',[-12,12],[-7,4],[0,12],'plank',{dw,foot:'stone'});Q.roof('w','gable','u',6,o.roofMat,{ov:1});
      Q.dec('w.S','Door2',.5);Q.dec('w.S','Win',.15,4);Q.dec('w.S','Win',.85,4);Q.dec('w.N','Door',.5);for(const k of ['E','W'])Q.dec('w.'+k,'Hatch',.5,6);
      Q.box('ho',[-.5,.5],[4,7],[12,13],'timber',{top:true});Q.box('rp',[-.5,.5],[6,7],[9,12],'linen',{thin:true});Q.prop('crate',[-9,7]);Q.prop('crate',[9,7])},
    // a lumber shed: an open shed on posts under a single slope, logs stacked inside, its door at the back, a stump and a pile
    lumbershed(Q,o){const dw=Q.home('lumbershed','work');Q.box('bk',[-12,12],[-7,-5],[0,10],'log',{dw});Q.dec('bk.S','Door',.82);
      for(const a of [-12,-.5,11])Q.box('po'+a,[a,a+1],[4,5],[0,9],'log',{top:true});Q.box('rf',[-12,12],[-7,5],[9,10],'log',{thin:true});Q.roof('rf','shed','u',3,o.roofMat,{o:1,hi:'b0'});
      Q.prop('logs',[-7,-1]);Q.prop('logs',[1,-1]);Q.prop('logs',[-3,-1],0,2,6);Q.prop('stump',[-7,8]);Q.prop('logs',[6,9],0,1)},
    // a mine head: a timber headframe with its winch wheel over the shaft and its winch house; or a rock-cut adit braced with timber;
    // rails out of it with a cart of ore on them, a spoil heap
    minehead(Q,o){const d=o.d,rk=o.env==='desert'?'sandrock':'rock',dw=Q.home('minehead','work');
      // (the headframe an A of timber legs leaning in over the shaft's collar, braced, its wheel standing on its top)
      if(d.chance(.5)){Q.box('col',[-5,5],[-4,3],[0,2],'stone',{top:true,topMat:'iron',dw});const A=Array.from({length:14},(_,i)=>{const z=13-i,e=Math.round(6-z*4.5/13);let s='';for(let u=-6;u<=6;u++)s+=Math.abs(Math.abs(u)-e)<.6||(z===6&&Math.abs(u)<e)?'t':'.';return s});
        Q.cut('af',-6.5,2,0,A,{t:'timber'});Q.cut('ab',-6.5,-4,0,A,{t:'timber'});Q.box('ax',[-.5,.5],[-4,3],[14,15],'iron',{thin:true,top:true});Q.wheel('ww',0,-.5,15,4.5,'plank');Q.box('rope',[-.5,.5],[-.5,.5],[2,11],'linen',{thin:true});
        shed(Q,'wh',[10,-2],7,8,9,o.roofMat);Q.dec('wh.S','Win',.75,3)}
      else{Q.round('m',[0,-8],12,[0,8],rk,{form:'cone',rise:8,mat:rk,o:0});Q.box('a',[-6,6],[0,5],[0,11],rk,{dw,top:true});Q.dec('a.S','Adit',.5,0);Q.box('lt',[-6,6],[4,5],[11,12],'timber',{thin:true,top:true})}
      Q.rails('r',4,12,0,false);Q.prop('minecart',[0,9],0,2);Q.prop('spoil',[-9,6]);Q.prop('boulder',[9,7],0,1.5)},
    // a crane: a treadwheel by its mast, the jib out over the stones it lifts
    // (its winch house behind, its door)
    crane(Q,o){const d=o.d,dw=Q.home('crane','work');Q.wheel('tw',-6,0,6,5.5);shed(Q,'hs',[7,-7],9,6,8,o.roofMat,dw);Q.box('ax',[-7,-5],[-2,0],[5,8],'timber',{top:true,dw});
      Q.box('ms',[1,3],[-1,1],[0,19],'timber',{top:true,dw});Q.box('jb',[0,12],[-.5,.5],[18,19],'timber',{top:true});braces(Q,'jx',3,-.5,12,6,6);
      Q.box('rp',[10.5,11],[-.5,.5],[8,18],'linen',{thin:true});Q.prop('block',[11,4]);Q.prop('block',[-6,8],1);if(d.chance(.5))Q.prop('block',[5,8])},
    // a treehouse: a house on a deck round a great trunk under its crown, a vaulted roof, a ladder
    treehouse(Q,o){const d=o.d,dw=Q.home('treehouse','home'),crown=d.pick(['canopy','canopy','autumn']),H=6;
      Q.round('tr',[0,-6],3,[0,15],'log',null);Q.round('cr',[0,-6],10,[13,17],crown,{form:'cone',rise:5,mat:crown,o:0});
      Q.box('dk',[-10,10],[-3,9],[H-1,H],'plank',{top:true,thin:true});for(const [a,b] of [[-10,8],[9,8]])Q.box('p'+a,[a,a+1],[b,b+1],[0,H],'log',{top:true});
      Q.box('h',[-6,6],[-2,7],[H,H+10],o.wall==='stone'?'whitewash':o.wall,{dw});Q.roof('h','vault','u',5,o.roofMat,{lip:1});Q.dec('h.S','Door',.3);Q.dec('h.S','Lancet',.75,3);Q.dec('h.E','Lancet',.5,3);Q.dec('h.W','Lancet',.5,3);
      Q.cut('ld',6,9,0,Array.from({length:H},(_,i)=>i%2?'t.t':'ttt'),{t:'timber'})},
    // an elves' hall: light walls under a vaulted roof of leaf, tall lancets, its double door, among trees
    elfhall(Q,o){const d=o.d,dw=Q.home('elfhall','home');
      house(Q,{w:20,d:12,c:[0,1],z:11,form:'vault',rise:8,wall:o.people==='elf'?'whitewash':o.wall,dw,door:.5,doorKind:'Door2',wins:2,chim:false,pick:['Lancet2']});
      tree(Q,'ta',[-10,-6],10,4.5,'canopy');tree(Q,'tb',[10,-5],10,4.5,d.pick(['canopy','autumn']))},
    // a spire: a tall round tower of white stone, a balcony ring, a tall cone, lancets round it
    spire(Q,o){const dw=Q.home('spire','worship'),z=19;Q.flag=true;Q.round('s',[0,0],4.5,[0,z],'whitewash',{form:'cone',rise:8,mat:o.roofMat},{dw});
      Q.round('bal',[0,0],6,[11,12],'plank',{form:'lid',mat:'plank'});Q.dec('s.S','Door',.5);Q.dec('s.S','Lancet',.5,13);for(const k of ['E','W','N'])Q.dec('s.'+k,'Lancet',.5,4)},
    // a dwarves' stone hall: squat and broad, a low hip, buttresses at its corners, its rune door, a massive chimney
    stonehall(Q,o){const dw=Q.home('stonehall','home');house(Q,{w:22,d:14,z:10,wall:'stone',form:'hip',rise:5,dw,door:.5,doorKind:'Rune',wins:2,pick:['Win'],chim:[6,-2]});
      for(const a of [-11,11])for(const b of [-7,7])Q.square('bt'+a+b,[a,b],4,[0,8],'stone',{form:'battlements'});Q.prop('barrel',[-7,10])},

    // --- 64 px: the big buildings and the centres ---
    // a church: its west tower and steeple at the front over the door, the cross on top, a belfry; the long nave behind, lancets down
    // its sides, a chancel at the east end; headstones
    church(Q,o){const st=o.look.stone,dw=Q.home('church','worship');
      Q.box('n',[-9,16],[-7,7],[0,14],st,{dw});Q.roof('n','gable','u',8,o.roofMat,{ov:0,finial:1,fmat:'gold'});Q.round('ap',[16,0],5.5,[0,11],st,{form:'cone',rise:6,mat:o.roofMat,o:1},{dw});
      Q.square('tw',[-15,0],12,[0,22],st,{form:'battlements'},{dw});Q.round('sp',[-15,0],4,[22,24],st,{form:'cone',rise:12,mat:o.roofMat,o:1},{dw});cross(Q,'x',-15,0,36);
      Q.dec('tw.S','Door2',.5);Q.dec('tw.S','Rose',.5,11);for(const k of ['S','E','W','N'])Q.dec('tw.'+k,'Bell',.5,16);Q.dec('tw.W','Lancet',.5,9);
      for(const k of ['S','N'])for(const a of [.14,.38,.62,.86])Q.dec('n.'+k,'Lancet2',a,4);Q.dec('n.E','Rose',.5,6);Q.dec('ap.S','Lancet',.5,3);
      Q.prop('headstone',[-4,12]);Q.prop('headstone',[4,13]);Q.prop('headstone',[12,12]);Q.prop('headstone',[20,10])},
    // a tavern: two storeys, a gable or a hip with dormers, two chimneys, its sign hanging by the door and a lantern; a back wing; a
    // yard beside it in a fence (benches and barrels, a cart) with a shed at its back
    tavern(Q,o){const d=o.d,dw=Q.home('tavern','inn',2),hip=d.chance(.5);
      const h=house(Q,{w:34,d:16,c:[-11,10],st:2,form:hip?'hip':'gable',rise:9,dw,door:.5,doorKind:'Door2',wins:4,chim:[-24,9],pick:['WinF','WinS']});Q.chim([1,9],15,29,3);
      Q.dec('h.S','Sign',.62,10);Q.dec('h.S','Lamp',.38,7);if(!hip){dormer(Q,'d1',h.u,h.v,h.z,-18);dormer(Q,'d2',h.u,h.v,h.z,-4)}
      house(Q,{n:'bw',w:14,d:14,c:[-20,-6],z:10,dw,door:.5,wins:1,chim:false});
      Q.fence([[8,18],[28,18],[28,-12]],[[14,20,0]],3);shed(Q,'sh',[18,-18],16,8,9,o.roofMat);
      Q.prop('bench',[14,6]);Q.prop('bench',[21,11]);Q.prop('trough',[22,-2]);Q.prop('barrel',[25,4]);Q.prop('barrel',[11,-6])},
    // a longhouse: long and low under a steep roof (the country's), its door in the middle, finials; an annex, a shed behind,
    // woodpile and hay
    longhouse(Q,o){const d=o.d,dw=Q.home('longhouse','home');house(Q,{w:44,d:16,c:[-2,8],z:12,rise:9,dw,finial:1,fmat:o.people==='orc'?'bone':'timber',door:.5,doorKind:'Door2',wins:4,chim:[-2,6],back:'door'});
      lean(Q,'an',[20,27],[2,14],8,o.roofMat);shed(Q,'sh',[-14,-18],14,8,9,o.roofMat);Q.prop('woodpile',[12,-16],0);Q.prop('hay',[24,-14]);Q.prop('cart',[-24,22],1)},
    // a keep (straight on): a square donjon crenellated, turrets at its corners, its hall beside it, a well in the yard; walls by its
    // fortification
    keep(Q,o){const d=o.d,st=o.people==='orc'?'log':o.look.stone,cone=o.people!=='dwarf'&&d.chance(.7),f=o.fort|0,dw=Q.home('keep','hall',3),L=d.chance(.5)?-1:1;Q.flag=true;Q.ground='cobble';
      Q.square('dj',[L*8,-12],18,[0,30],st,{form:'battlements'},{dw});for(const a of [-1,1])Q.round('dt'+a,[L*8+a*9,-3],2.5,[0,33],st,cone?{form:'cone',rise:6,mat:o.roofMat}:{form:'lid',mat:st},{dw});
      Q.dec('dj.S','Door2',.5);Q.dec('dj.S','WinS',.3,13);Q.dec('dj.S','WinS',.7,13);Q.dec('dj.S','Lancet',.5,21);for(const k of ['E','W','N'])Q.dec('dj.'+k,'Lancet',.5,21);
      const hx=-L*10;Q.box('hl',[hx-9,hx+9],[-14,-2],[0,13],st,{dw});Q.roof('hl','gable','u',7,o.roofMat,{finial:1});for(const at of [.2,.8])Q.dec('hl.S','Lancet2',at,4);Q.dec('hl.S','Door',.5);
      Q.round('wl',[hx,8],3,[0,3],'stone',{form:'water'});if(f)curtain(Q,-27,27,-30,26,f,cone,1);else{Q.prop('cart',[-16,18],1);Q.prop('barrel',[16,16])}},
    // a gatehouse (straight on): a gate arch with its portcullis in a block between two great towers, battlements, walls either side
    gatehouse(Q,o){const d=o.d,st=o.people==='orc'?'log':o.look.stone,cone=o.people!=='dwarf'&&d.chance(.7),dw=Q.home('gatehouse','defence');Q.flag=true;
      Q.box('g',[-9,9],[-8,8],[0,24],st,{dw});Q.roof('g','flat',null,0,st,{parapet:2,merlons:true});Q.dec('g.S','Gate',.5);Q.dec('g.S','Slit',.25,18);Q.dec('g.S','Slit',.75,18);
      for(const s of [-1,1]){Q.round('t'+s,[s*16,0],8,[0,30],st,cone?{form:'cone',rise:11,mat:o.roofMat}:{form:'lid',mat:st},{dw});Q.dec('t'+s+'.S','Slit',.5,10);Q.dec('t'+s+'.S','Slit',.5,20);
        Q.box('w'+s,s<0?[-30,-23]:[23,30],[-4,4],[0,18],st,{top:true});for(let k=0;k<3;k++){const a=s*(24+k*2.5);Q.box('m'+s+k,[a-.75,a+.75],[3,4],[18,20],st,{top:true})}}Q.marks.gate=[0,8,0]},
    // a village's centre (straight on): its people's hall at the back, the green with the well and the village's goods; fortified, a
    // palisade of stakes round it all, its gate at the front
    village(Q,o){const d=o.d,f=(o.fort|0)>0,pp=o.people,dw=Q.home('village','hall',1);Q.flag=true;
      house(Q,{n:'hl',w:32,d:16,c:[0,-14],z:11,rise:pp==='dwarf'?6:10,form:{dwarf:'hip',orc:'vault',elf:'vault'}[pp]||'gable',dw,finial:1,fmat:pp==='orc'?'bone':pp==='elf'?'gold':'timber',door:.5,
        doorKind:pp==='dwarf'?'Rune':'Door2',wins:4,wall:{dwarf:'stone',orc:'log'}[pp]||o.wall,chim:pp==='orc'||pp==='elf'?false:[8,-16]});
      Q.round('wl',[-10,8],4.5,[0,4],'stone',{form:'water'});for(const s of [-1,1])Q.box('wp'+s,[-10+s*4.5-.5,-10+s*4.5+.5],[7.5,8.5],[0,8],'timber',{top:true});Q.box('wr',[-15.5,-4.5],[6,10],[8,9],'timber',{thin:true});Q.roof('wr','gable','u',2,o.roofMat,{o:0,ov:0});
      const g={human:['hay','barrel'],dwarf:['barrel','crate'],elf:['sacks','crate'],orc:['woodpile','hay']}[pp]||['hay','barrel'];Q.prop(g[0],[12,8]);Q.prop(g[1],[16,14]);
      if(f){const e=29,b=27;for(const [n,u,v] of [['pN',[-e,e],[-b-3,-b-1]],['pW',[-e,-e+2],[-b-3,b]],['pE',[e-2,e],[-b-3,b]],['pS0',[-e,-5],[b-2,b]],['pS1',[5,e],[b-2,b]]])Q.box(n,u,v,[0,8],'stakes',{top:true,topMat:'log'});
        for(const s of [-1,1])Q.box('gp'+s,s<0?[-7,-5]:[5,7],[b-3,b],[0,11],'log',{top:true});Q.marks.gate=[0,b,0]}else Q.marks.gate=[0,28,0]},
    // a citadel (straight on; a capital's at 128, spec.capital): a palace across the back between two towers (a capital's great
    // donjon rising behind it), a court with its fountain; walls by its fortification
    citadel(Q,o){const d=o.d,k=o.capital?2:1,kz=o.capital?1.6:1,st=o.people==='orc'?'log':o.look.stone,cone=o.people!=='dwarf'&&d.chance(.7),f=o.fort|0,dw=Q.home('citadel','hall',3);Q.flag=true;Q.ground='cobble';
      const Z=z=>Math.round(z*kz);Q.box('pl',[-15*k,15*k],[-24*k,-10*k],[0,Z(16)],st,{dw});Q.roof('pl',d.chance(.5)?'hip':'gable','u',Z(9),o.roofMat,{finial:1});
      Q.dec('pl.S','Door2',.5);const nw=4*k;for(let i=0;i<nw;i++){const at=(i+.5)/nw*.86+.07;if(Math.abs(at-.5)<.08)continue;Q.dec('pl.S','Lancet2',at,4);Q.dec('pl.S','WinS',at,Z(16)-6)}
      for(const s of [-1,1]){Q.round('pt'+s,[s*17*k,-17*k],5*k,[0,Z(26)],st,cone?{form:'cone',rise:Z(10),mat:o.roofMat}:{form:'lid',mat:st},{dw});Q.dec('pt'+s+'.S','Lancet',.5,Z(14))}
      if(o.capital){Q.square('dj',[0,-36],24,[0,Z(34)],st,{form:'battlements'},{dw});for(const s of [-1,1])Q.round('dt'+s,[s*12,-36],4,[0,Z(40)],st,cone?{form:'cone',rise:12,mat:o.roofMat}:{form:'lid',mat:st},{dw});Q.dec('dj.S','Lancet2',.5,Z(22))}
      Q.round('ft',[0,6*k],3.5*k,[0,2],'stone',{form:'water'});Q.round('fp',[0,6*k],1.2,[0,6],'stone',{form:'lid',mat:'stone'});
      if(f||o.capital)curtain(Q,-27*k,27*k,(o.capital?-56:-30),27*k,f||3,cone,k);else{Q.prop('cart',[-16,16],1);Q.prop('crate',[16,14])}},

    // --- sites ---
    // ruins: broken walls of stone, an arch standing, ivy, fallen blocks
    ruins(Q,o){const d=o.d,st=o.look.stone==='whitewash'?'stone':o.look.stone;Q.role='ruins';
      Q.box('a',[-12,2],[-6,-4],[0,d.int(14,17)],st);Q.box('b',[2,12],[-6,-4],[0,d.int(6,9)],st);Q.box('c',[-12,-10],[-4,6],[0,d.int(5,8)],st);Q.box('e',[7,12],[3,5],[0,4],st);
      Q.dec('a.S','Arch',.4,0);if(d.chance(.6))Q.dec('a.S','Ivy',.85,3);Q.prop('block',[2,6]);Q.prop('block',[-4,9],1);Q.prop('boulder',[9,9],0,1.5)},
    // a cave: a mound of natural rock (sandstone in the desert, dark in the swamp), its dark mouth, boulders before it
    cave(Q,o){const rk={desert:'sandrock',swamp:'darkrock'}[o.env]||'rock';Q.role='cave';
      Q.round('m2',[-8.5,-7],5.5,[0,5],rk,{form:'cone',rise:6,mat:rk,o:0});Q.round('m3',[8.5,-6],6,[0,6],rk,{form:'cone',rise:7,mat:rk,o:0});Q.round('m',[0,-2],11,[0,9],rk,{form:'cone',rise:9,mat:rk,o:0});
      Q.dec('m.S','Cave',.5,0);Q.prop('boulder',[-9,7]);Q.prop('boulder',[10,6],0,1.5);if(o.env==='swamp')Q.bed([-6,6],[9,13],'water')}
  };
  // the centres stand straight on; the rest have 4 facings
  const FRONT=['keep','citadel','gatehouse','village'];PX.MODEL_FRONT=FRONT;

  /* the options a type is planned from */
  function opts(spec,type,salt){const people=LOOK[spec.people]?spec.people:LOOK[spec.style]?spec.style:'human',look=LOOK[people],seed=spec.seed|0,yaw=FRONT.includes(type)?0:((spec.yaw|0)%8+8)%8&6,
      d=PX.dice(PX.rng(seed*7919+salt*131+3)),env=spec.env||(spec.snow===true?'frost':'grass');
    const wall=env==='desert'?DESERT[people]:look.walls[seed%look.walls.length],roofMat=RURAL.includes(type)&&look.rural?look.rural:look.roof,glow=/e8c0|d8a0|gold/.test(spec.glow||'')?'gold':'glow';
    return{type,people,look,seed,yaw,d,env,wall,roofMat,lv:spec.lv|0||1,fort:spec.fort,stilts:!!spec.stilts,glow,capital:!!spec.capital}}
  const SNOW=spec=>spec.snow===true?1:spec.snow!=null?+spec.snow:spec.env==='frost'?1:0;
  const TYPES=Object.keys(T),cellOf=(type,o)=>type==='citadel'&&o.capital?128:SIZE.types[type][0];
  // a type's plan: its building's households from the table
  function planOf(type,o){const Q=new Plan(o,cellOf(type,o));T[type](Q,o);if(Q.dwellings[0]&&Q.dwellings[0].dwellings==null)Q.dwellings[0].dwellings=SIZE.types[type][1];for(const w of Q.dwellings)w.dwellings=w.dwellings|0;return Q}
  PX.buildingModelSpec=spec=>{const type=spec.type;if(!T[type])throw new Error('no model for '+type);const o=opts(spec,type,TYPES.indexOf(type)),Q=planOf(type,o);
    const s=Q.spec();s.yaw=o.yaw;s.fitYaws=FRONT.includes(type)?[0]:[0,2,4,6];s.snow=SNOW(spec);s.role=s.role||(Q.dwellings[0]&&Q.dwellings[0].role)||null;return s};
  // the cache: a model a spec (its snow overlay a third of an amount at a time inside it)
  const CACHE=new Map(),key=(k,s)=>k+JSON.stringify([s.type||s.kind,s.people||s.style,s.seed|0,s.yaw|0,s.env||'',s.lv|0,s.fort==null?-1:s.fort,!!s.stilts,s.glow||'',!!s.capital]);
  function cached(k,spec,make){const id=key(k,spec);let m=CACHE.get(id);if(!m){m=make();CACHE.set(id,m)}const a=SNOW(spec);
    return a?Object.assign({},m,{snow:PX.modelSeason(m,'snow',a)}):Object.assign({},m,{snow:null})}
  const FACING=['front','left','back','right'];
  PX.buildingModel=spec=>cached('b',spec,()=>{const s=PX.buildingModelSpec(Object.assign({},spec,{snow:0})),m=PX.model(s);
    return Object.assign(m,{type:spec.type,people:opts(spec,spec.type,0).people,facing:FACING[s.yaw/2],gateX:FRONT.includes(spec.type)?m.cell/2:null})});
  PX.MODEL_OBJECTS=TYPES.filter(k=>SIZE.types[k][0]===16&&k!=='shrine');PX.objectModel=spec=>PX.buildingModel(Object.assign({},spec,{type:spec.type||spec.kind}));
  PX.MODEL_TYPES=PX.BUILDING_TYPES.filter(k=>T[k]).concat(TYPES.filter(k=>!PX.BUILDING_TYPES.includes(k)&&!['ruins','shrine','cave'].includes(k)));PX.MODEL_SITES=['ruins','shrine','cave'];

  /* clusters: several buildings and objects to a cell, each one of the types above at its own size, set down at a point and a
     facing (face 0 its front to the layout's south, 1 west, 2 north, 3 east), with props, fences, beds and paths about them; laid
     out for a south street and turned whole to the cluster's yaw (one layout, simply turned) */
  function piece(C,type,at,face,x){const o=Object.assign(opts(Object.assign({},C.spec,{type,seed:(C.spec.seed|0)*31+C.n*17+TYPES.indexOf(type)},x||{}),type,TYPES.indexOf(type)),{yaw:0},
      SIZE.types[type][0]>16?{roofMat:C.o.roofMat}:{},x||{});
    const Q=planOf(type,o);if(x&&x.cut)for(const k of x.cut)Q.parts=Q.parts.filter(p=>p.k!==k);kit().place(C.Q,{parts:Q.parts,decals:Q.decals,dwellings:Q.dwellings},at,face|0,'q'+(C.n++)+'.')}
  // a plan made in place (a house of a row, a stable, an inn): built by f into a Plan of the cluster's look, then set down
  function made(C,at,face,f,x){const P=new Plan(Object.assign({},C.o,x||{}),C.Q.cell);f(P);kit().place(C.Q,{parts:P.parts,decals:P.decals,dwellings:P.dwellings},at,face|0,'m'+(C.n++)+'.')}
  const P=(C,type,at,face,s)=>C.Q.parts.push({k:'prop',name:'x'+C.Q.parts.length,type,at,face:face|0,s:s||2});
  // a row of houses wall to wall along the street (+v) from u0 to u1, their fronts at v1: their own widths, storeys and roofs
  function row(C,u0,u1,v1,face){const R=C.d;let u=u0;while(u1-u>=14){const w=u1-u<34?u1-u:R.pick([16,18,20]),st=R.pick([1,2,2]),d=R.pick([12,14]),front=R.chance(.5),wall=C.o.env==='desert'?C.o.wall:C.o.look.walls[R.int(0,C.o.look.walls.length-1)];
      made(C,[u+w/2,v1-d/2],face,Q=>{const dw=Q.home(st>=2?'townhouse':'house','home',st,st>=2?3:2);house(Q,{w,d,st,form:front?'front':'gable',rise:front?Math.min(9,RULE.rise(w)):6,dw,door:R.pick([.3,.5,.7]),wins:w>=18?2:1,ov:front?1:0,chim:R.chance(.5),pick:['Win','WinS','WinF']})},{wall});u+=w}}
  // a stable: planks under a single slope, three stalls open to the yard, a trough
  const stable=(C,at,face)=>made(C,at,face,Q=>{const dw=Q.home('stable','stable');Q.box('s',[-12,12],[-5,5],[0,10],'plank',{dw,foot:'stone',keep:1});Q.roof('s','shed','u',4,C.o.roofMat,{o:1,ov:0});
    for(const a of [.18,.5,.82])Q.dec('s.S','Barn',a);Q.prop('trough',[0,8])});
  // the fire of a camp (the game's flame stands on marks.fire)
  const fire=(C,at)=>{P(C,'firepit',at);C.Q.marks.fire=[at[0],at[1],2]};
  const CL={
    // a town's row: three or four houses wall to wall along the street, the yards behind with a shed, a garden and a washing line
    row:{role:'housing',ground:'cobble',make:C=>{row(C,-30,30,26,0);const R=C.d;made(C,[R.pick([-16,14]),-18],0,Q=>shed(Q,'s',[0,0],14,8,9,C.o.roofMat,Q.home('shed','store')));
      C.Q.parts.push({k:'fence',name:'yf',pts:[[-30,-4],[30,-4]],h:4},{k:'bed',name:'g',u:[R.pick([2,-28]),R.pick([2,-28])+14],v:[-28,-20]});P(C,'washing',[R.pick([-6,4]),-12]);piece(C,'woodpile',[22,-28],0)}},
    // a hamlet's yard: two cottages in a fenced garden, beds, a well
    yard:{role:'housing',make:C=>{piece(C,'cottage',[-12,-14],0,{lv:1,cut:['prop']});piece(C,'cottage',[14,8],3,{lv:C.d.chance(.5)?2:1,cut:['prop']});piece(C,'well',[-14,14],0);
      C.Q.parts.push({k:'bed',name:'b1',u:[-6,4],v:[8,22]},{k:'bed',name:'b2',u:[-28,-22],v:[2,10]},{k:'fence',name:'yf',pts:[[-30,28],[30,28],[30,-29],[-30,-29],[-30,28]],h:4,gates:[[-4,4,0]]})}},
    // a farmstead: the farmhouse, its barn across the yard, a haystack, a cart, a trough, a field's beds, a fence
    farmstead:{role:'farm',make:C=>{piece(C,'cottage',[-12,-16],0,{lv:2,cut:['prop']});piece(C,'barn',[16,-6],1,{cut:['prop']});piece(C,'haystack',[-22,14],0);piece(C,'cart',[0,18],0);
      P(C,'trough',[-2,0]);C.Q.parts.push({k:'bed',name:'f1',u:[-30,-14],v:[20,29]},{k:'fence',name:'yf',pts:[[-30,6],[-30,28],[-12,28]],h:4})}},
    // a smithy yard: the forge to the street, its glow; the smith's cottage behind, a woodpile, barrels
    smithy:{role:'smithy',make:C=>{piece(C,C.o.people==='dwarf'?'forge':'smithy',[-8,16],0);piece(C,'cottage',[14,-16],0,{lv:2,cut:['prop']});piece(C,'woodpile',[20,14],0);piece(C,'barrels',[-22,-18],0)}},
    // an inn: its house of two storeys on the street, the sign and lantern by the door; the stable across the yard, a well, a cart
    inn:{role:'inn',ground:'cobble',make:C=>{made(C,[-6,18],0,Q=>{const dw=Q.home('inn','inn',2);house(Q,{w:30,d:14,st:2,form:'hip',rise:8,dw,door:.5,doorKind:'Door2',wins:3,chim:[10,-2],pick:['WinF','WinS']});Q.dec('h.S','Sign',.68,10);Q.dec('h.S','Lamp',.34,7)});
      stable(C,[12,-18],0);piece(C,'well',[-22,-14],0);piece(C,'cart',[22,4],0)}},
    // a chapel, its graveyard of headstones in a fence, the priest's cottage
    chapel:{role:'chapel',make:C=>{piece(C,'chapel',[-12,-8],0,{cut:['prop']});piece(C,'cottage',[16,-18],0,{lv:1,cut:['prop']});
      C.Q.parts.push({k:'fence',name:'gf',pts:[[2,28],[28,28],[28,4],[2,4],[2,28]],h:4,gates:[[12,18,0]]});for(const [u,v] of [[7,10],[13,10],[19,10],[7,19],[19,19],[24,14]])P(C,'headstone',[u,v])}},
    // a market: stalls round a square with its well, carts, crates and barrels
    market:{role:'market',ground:'cobble',make:C=>{piece(C,'stall',[-18,-18],0);piece(C,'stall',[0,-22],0);piece(C,'stall',[18,-18],0);piece(C,'stall',[-22,4],3);piece(C,'stall',[22,4],1);
      piece(C,'well',[0,2],0);piece(C,'cart',[-14,22],0);piece(C,'crates',[14,22],0);piece(C,'barrels',[2,24],0)}},
    // a mill: the watermill on its race, a granary, sacks and a cart
    mill:{role:'mill',make:C=>{piece(C,'watermill',[-8,12],0);piece(C,'granary',[16,-16],0,{cut:['prop']});P(C,'sacks',[14,4]);piece(C,'cart',[-20,-18],0)}},
    // a lumber camp: the shed of stacked logs, the woodcutter's cottage, stumps, a woodpile, a cart
    lumber:{role:'lumber',make:C=>{piece(C,'lumbershed',[-6,14],0);piece(C,'cottage',[14,-18],0,{lv:1,cut:['prop']});P(C,'stump',[-22,-14]);P(C,'stump',[-14,-24]);piece(C,'woodpile',[22,10],0);piece(C,'cart',[-20,-4],0)}},
    // a mine: the mine head, the miners' hut, spoil, barrels
    mine:{role:'mine',make:C=>{piece(C,'minehead',[-6,8],0);piece(C,'cottage',[16,-18],0,{lv:1,cut:['prop']});P(C,'spoil',[22,14]);piece(C,'barrels',[-24,-20],0)}},
    // a quarry: the crane over cut blocks before a face of rock, a hut, a cart of stone
    quarry:{role:'quarry',make:C=>{C.Q.parts.push({k:'tower',name:'rk',round:true,c:[-12,-20],r:12,z:[0,10],wall:'rock',roof:{form:'cone',rise:8,mat:'rock',o:0}});piece(C,'crane',[-4,8],0);
      piece(C,'cottage',[18,-16],0,{lv:1,cut:['prop']});P(C,'block',[-22,18]);P(C,'block',[-16,24],1);piece(C,'cart',[18,18],0)}},
    // a fishery: two fishers' huts, nets on their racks, barrels
    fishery:{role:'port',make:C=>{piece(C,'fisherhut',[-14,-14],0,{cut:['prop']});piece(C,'fisherhut',[12,12],0,{cut:['prop']});P(C,'nets',[-14,10]);P(C,'nets',[16,-16],1);piece(C,'barrels',[-22,24],0)}},
    // a pasture's steading: the barn, a fenced paddock with its trough, a haystack
    pasture:{role:'pasture',make:C=>{piece(C,'barn',[-16,-12],0,{cut:['prop']});C.Q.parts.push({k:'fence',name:'pd',pts:[[0,28],[30,28],[30,-8],[0,-8],[0,28]],h:4,gates:[[4,10,3]]});P(C,'trough',[14,10]);piece(C,'haystack',[-18,18],0)}},
    // a brewery: the brewhouse of two storeys, its granary, barrels stacked
    brewery:{role:'brewery',make:C=>{made(C,[-8,16],0,Q=>{const dw=Q.home('brewery','work',2);house(Q,{w:26,d:14,st:2,rise:8,dw,door:.4,doorKind:'Door2',wins:3,chim:[8,-2]})});piece(C,'granary',[16,-16],0,{cut:['prop']});piece(C,'barrels',[18,14],0);piece(C,'barrels',[-20,-16],0)}},
    // a granary yard: two granaries, sacks, a cart
    granary:{role:'granary',make:C=>{piece(C,'granary',[-14,-12],0);piece(C,'granary',[14,-16],0,{cut:['prop']});piece(C,'cart',[2,18],0);P(C,'sacks',[-16,18])}},
    // a workshop yard: the warehouse, a cottage, crates, a cart
    workshop:{role:'workshop',ground:'cobble',make:C=>{piece(C,'warehouse',[-6,14],0);piece(C,'cottage',[14,-18],0,{lv:1,cut:['prop']});piece(C,'crates',[-22,-16],0);piece(C,'cart',[22,12],0)}},
    // a town quarter (128): rows of houses both sides of two lanes, a square with its well in the middle, gardens and sheds behind
    quarter:{role:'housing',ground:'cobble',make:C=>{row(C,-62,-8,60,0);row(C,8,62,60,0);row(C,-62,-8,-4,0);row(C,8,62,-4,0);row(C,-62,-8,-40,0);row(C,8,62,-40,0);
      piece(C,'well',[0,14],0);piece(C,'cart',[-18,24],0);piece(C,'barrels',[20,24],0);P(C,'bench',[-6,30],1);C.Q.parts.push({k:'bed',name:'g1',u:[-60,-40],v:[-28,-18]},{k:'bed',name:'g2',u:[30,58],v:[-28,-18]})}},
    // camps: a bandits' camp (32: one or two tents round a fire, crates or a barrel, a log to sit on), a hideout (64: three tents and
    // their gear round the fire in a ring of spiked stakes, its way in at the front) and travellers (32: a tent, their wagon, the fire)
    camp:{role:'camp',make:C=>{const two=C.d.chance(.5);piece(C,'tent',[two?-7:0,-8],0);if(two)piece(C,'tent',[8,-6],0);fire(C,[0,6]);P(C,C.d.pick(['crate','barrel','sacks']),[9,8]);P(C,'logs',[-8,9],0,1)}},
    hideout:{role:'camp',flag:true,make:C=>{piece(C,'tent',[-14,-12],0);piece(C,'tent',[14,-14],0);piece(C,'tent',[0,-22],0);fire(C,[0,6]);piece(C,'crates',[-18,10],0);piece(C,'barrels',[18,8],0);P(C,'logs',[6,14],0,1);
      const e=29,b=27;for(const [n,u,v] of [['pN',[-e,e],[-b-3,-b-1]],['pW',[-e,-e+2],[-b-3,b]],['pE',[e-2,e],[-b-3,b]],['pS0',[-e,-6],[b-2,b]],['pS1',[6,e],[b-2,b]]])C.Q.parts.push({k:'box',name:n,u,v,z:[0,8],wall:'stakes',top:true,topMat:'log'})}},
    travelers:{role:'camp',flag:true,make:C=>{piece(C,'tent',[-6,-9],0);piece(C,'wagon',[6,8],0);fire(C,[-7,8])}}
  };
  PX.CLUSTER_MODELS=Object.keys(CL);const RURAL_CL=['yard','farmstead','mill','lumber','mine','quarry','fishery','pasture','granary'];
  PX.clusterModelSpec=spec=>{const L=CL[spec.kind];if(!L)throw new Error('no cluster '+spec.kind);const yaw=((spec.yaw|0)%8+8)%8&6,o=opts(spec,RURAL_CL.includes(spec.kind)?'cottage':'townhouse',97+PX.CLUSTER_MODELS.indexOf(spec.kind));
    const Q={cell:SIZE.clusters[spec.kind],role:L.role,ground:L.ground||null,parts:[],decals:[],dwellings:[],marks:{},flag:!!L.flag,env:o.env,seed:o.seed,yaw,fitYaws:[0,2,4,6]},C={Q,o,d:o.d,n:0,spec};
    L.make(C);for(const w of Q.dwellings)w.dwellings=w.dwellings|0;Q.snow=SNOW(spec);return Q};
  PX.modelCacheClear=()=>CACHE.clear();
  PX.clusterModel=spec=>cached('c',spec,()=>{const s=PX.clusterModelSpec(Object.assign({},spec,{snow:0})),m=PX.model(s);return Object.assign(m,{kind:spec.kind,people:opts(spec,'cottage',0).people,facing:FACING[s.yaw/2]})});
})(window.PX=window.PX||{});
