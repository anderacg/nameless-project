'use strict';
/* ---------- PX engine: the Karn Clans' buildings (the dwarves; buildmodels.js PX.registerBuildStyle) ---------- */
// The owner's doc (doc/references/assets/REALM_STRUCTURE_ART_DESIGN.md, Karn Clans): anchored into the mountain, broad, low and thick
// at the base; dark granite, iron, slate; steep snow-shedding roofs; forge orange; runes, vents, buttresses, heavy gates.
// The Clans' language (every plan here): dark granite walls on a battered plinth, buttresses at the corners, upper storeys of dark
// timber, steep slate roofs, small chimney vents and copper vent pipes, iron-banded doors under heavy lintels, small warm-lit windows
// and firing slits, terraces held by retaining walls on arches, rough rock (the mountain) behind the great ones. The desert: red
// sandstone, flat terraced roofs behind parapets, deep shaded doorways; the swamp: a raised stone footing; the frost (their home): the
// snow on the broad roofs. Every house, working place, cluster and holding centre is the Clans' own; the camps and the small objects
// (tents, wagons, carts, crates, barrels) are the shared ones.
(function(PX){
  const {crag,sails,piece,made,prop:P}=PX.planKit;
  // the Clans' tunables: a roof's rise by its span (steep, to shed the snow), the plinth round every building, the swamp's raised
  // footing (px)
  const KT={rise:.6,plinth:1,footing:4};
  // the Clans' say in a climate (look.karn): its stone, the stone of its plinths and buttresses (base), its parapets' caps, its upper
  // storeys' timber, flat terraced roofs (the desert), a raised footing (the swamp), its decals' suffix (the desert's in sandstone,
  // 'D'); another culture building a Clans' type: its own fort stone
  const km=o=>{const k=Object.assign({stone:o.look.fort,base:null,cap:'karnCopper',upper:'log',flat:false,footing:0,dec:''},o.look.karn||{});k.base=k.base||k.stone;return k};
  const rkOf=o=>({desert:'sandrock',swamp:'darkrock'}[o.env]||'rock'),mossOf=o=>o.env==='desert'?0:.35;
  // windows along a wall of width w clear of its door (at, a decal dw px wide): n of them
  const spots=(n,w,at,dw)=>([[],[at!=null&&at<.5?.78:.22],[.2,.8],[.15,.5,.85],[.12,.36,.64,.88]][n]||[]).filter(x=>at==null||Math.abs(x-at)*w>=dw/2+4);
  // a buttress: a square pier of the stone, its top weathered
  const butt=(Q,n,c,h,M,dw)=>Q.square(n,c,4,[0,h],M.base,{form:'pyramid',rise:2,mat:M.base,o:0},{dw});
  // a vent pipe of copper through a roof, capped
  const vent=(Q,n,c,z0,z1,dw)=>Q.round(n,c,1.3,[z0,z1],'karnCopper',{form:'cone',rise:2,mat:'karnCopper',o:1},{dw});
  // a part's roof: slate (o.roofMat), or in the desert flat behind a parapet
  const kroof=(Q,on,form,axis,rise,x)=>{const M=km(Q.o);return M.flat?Q.roof(on,'flat',null,0,M.stone,{parapet:2,pmat:M.cap}):Q.roof(on,form,axis,rise,Q.o.roofMat,Object.assign({o:1,ov:1,lip:1},x))};
  // a square tower of the stone (w wide, z high): flat behind merlons capped in copper, or under a slate hip (cap: its rise; flat in
  // the desert)
  const ktower=(Q,n,c,w,z,M,dw,cap)=>{Q.box(n,[c[0]-w/2,c[0]+w/2],[c[1]-w/2,c[1]+w/2],[0,z],M.stone,{dw});
    if(cap&&!M.flat)Q.roof(n,'hip','u',cap,Q.o.roofMat,{o:1,lip:1});else Q.roof(n,'flat',null,0,M.stone,{parapet:2,merlons:true,pmat:M.cap})};
  // an iron band round a box's walls at the height z (a string course: the Clans' metalwork, tying the masonry)
  const band=(Q,n,u,v,z)=>Q.box(n,[u[0]-1,u[1]+1],[v[0]-1,v[1]+1],[z,z+1],'iron',{thin:true});
  // merlons along an edge (u, v: the strip; au: along u) at the height z
  const mer=(Q,n,u,v,z,M,au)=>{const [a0,a1]=au?u:v;for(let q=a0+1;q<a1-2;q+=4){const r=[q,q+2];Q.box(n+q,au?r:u,au?v:r,[z,z+2],M.stone,{top:true})}};
  // a bank of earth heaped against a building's walls (u, v; h its rise): turfed (sand in the desert), not a roof of the people's
  const berm=(Q,n,u,v,h,o)=>{Q.box(n,u,v,[0,2],o.env==='desert'?'sandrock':'soil',{top:true});Q.roof(n,'hip',u[1]-u[0]>=v[1]-v[0]?'u':'v',h,o.env==='desert'?'sandrock':'moss',{o:0,lip:0,keep:1})};
  // steps up to a terrace h px high whose front is at vt, w wide at u: 2 px a step, toward the front
  const steps=(Q,n,u,w,vt,h,M)=>{for(let j=0;h-2*j-1>0;j++)Q.box(n+j,[u-w/2,u+w/2],[vt+2*j,vt+2*j+2],[0,h-2*j-1],M.stone,{top:true})};
  // a rune stone: a standing slab of the stone, its rune glowing
  const runestone=(Q,n,c,h,M)=>{Q.box(n,[c[0]-1.5,c[0]+1.5],[c[1]-1,c[1]+1],[0,h],M.stone,{top:true});Q.dec(n+'.S','RuneKarn'+M.dec,.5,h-6)};
  // a brazier: a stone bowl of embers
  const brazier=(Q,n,c,M)=>Q.round(n,c,1.6,[0,3],M.stone,{form:'lid',mat:'ember'});

  /* a Clans' house: a battered plinth, walls of the stone (z), an upper storey of dark timber framed (up px; jetty: out over the
     street), a steep slate roof ('gable' along its front, 'front' its gable to the front, 'hip'), buttresses at its corners, small
     chimney vents, an iron-banded door under a lintel, small warm windows. The desert: red sandstone, a flat roof behind a parapet
     and a terrace stepped back over it, a deep shaded doorway; the swamp: a raised stone footing. s: {n, c, w, d, z, up, jetty, form,
     rise, dw, door, doorKind, wins, vents ([[u, v], ...]), butt, back ('door'), footing (false: none)} */
  function khouse(Q,s){const o=Q.o,M=km(o),n=s.n||'h',[cu,cv]=s.c||[0,0],w=s.w,d=s.d,z1=s.z||12,z2=s.up?z1+s.up:z1,top=s.up?n+'u':n,
      form=M.flat?'flat':s.form||'gable',rise=s.rise||Math.max(5,Math.round((form==='front'||(form==='hip'&&d>w)?w:d)*KT.rise)),
      u=[cu-w/2,cu+w/2],v=[cv-d/2,cv+d/2],pl=KT.plinth,at=s.door==null?.5:s.door,ft=s.footing===false?0:M.footing,lift=Q.lift,dw=s.dw;
    // (the swamp's footing and its steps to the door; what stands on it raised)
    if(ft){Q.box(n+'ft',[u[0]-2,u[1]+2],[v[0]-2,v[1]+2],[0,ft],M.base,{dw,top:true});const x=u[0]+at*w;Q.box(n+'fs',[x-3,x+3],[v[1]+2,v[1]+4],[0,ft/2],M.base,{dw,top:true});Q.lift+=ft}
    Q.box(n+'pl',[u[0]-1,u[1]+1],[v[0]-1,v[1]+1],[0,pl],M.base,{dw,top:true});
    Q.box(n,u,v,[0,z1],M.stone,{dw});
    if(s.up)Q.box(top,u,[v[0],v[1]+(s.jetty&&!M.flat?1:0)],[z1,z2],M.flat?M.stone:M.upper,{dw,frame:M.flat?null:'timber'});
    if(form==='flat'){Q.roof(top,'flat',null,0,M.stone,{parapet:2,pmat:M.cap});
      // (a terrace stepped back over its rear half, flat behind its own parapet)
      const tw=Math.max(8,w-8);Q.box(n+'t',[cu-tw/2,cu+tw/2],[v[0]+1,cv],[z2,z2+6],M.stone,{dw});Q.roof(n+'t','flat',null,0,M.stone,{parapet:2,pmat:M.cap});Q.dec(n+'t.S','WinKarn'+M.dec,.5,1)}
    else Q.roof(top,form==='front'?'gable':form,form==='front'||(form==='hip'&&d>w)?'v':'u',rise,o.roofMat,{o:1,ov:1,lip:1});
    if(s.butt!==false)for(const a of [u[0],u[1]])for(const b of [v[0],v[1]])butt(Q,n+'b'+a+b,[a,b],Math.round(z1*.6),M,dw);
    const zt=z2+(form==='flat'?6:0);for(const [i,c] of (s.vents||[]).entries())Q.chim(c,zt-1,zt+(form==='flat'?3:Math.round(rise*.8)+2),3,{mat:M.stone,name:n+'v'+i});
    // the door on its plinth, the windows (a row a storey), the back and the ends
    Q.dec(n+'.S',s.doorKind||'DoorKarn'+M.dec,at,pl);const nw=s.wins!=null?s.wins:w>=28?3:2;
    for(const x of spots(nw,w,at,9))Q.dec(n+'.S','WinKarn'+M.dec,x,pl+3);
    if(s.up)for(const x of spots(nw,w,null))Q.dec(top+'.S','WinKarnS',x,1);
    if(s.back==='door'){Q.dec(n+'.N','DoorKarn'+M.dec,.3,pl);Q.dec(n+'.N','WinKarn'+M.dec,.75,pl+3)}else Q.dec(n+'.N','WinKarn'+M.dec,.5,pl+3);
    for(const k of ['E','W']){for(const x of d>=14?[.3,.7]:[.5])Q.dec(n+'.'+k,'WinKarn'+M.dec,x,pl+3);if(s.up)Q.dec(top+'.'+k,'WinKarnS',.5,1)}
    Q.lift=lift;return{u,v,z:z2,rise,top,ft,flat:form==='flat'}}

  /* the Clans' walls round a castle (u0..u1, v0..v1; k the scale, 2 a capital's): fort 1 a low wall of granite and its stubs, 2
     walls on a battered foot behind merlons, square flat-topped towers, 3 taller with a tower halfway along each side; the gate on
     the front's middle: a gate block between two towers, its monumental gate, warm slits */
  function kcurtain(Q,u0,u1,v0,v1,fort,k,M,kz){kz=kz||k;const lo=fort===1,wz=Math.round((lo?7:fort===3?15:12)*kz),t=lo?3:4,gw=(lo?10:12)*k,tw=(lo?6:9)*k,tz=wz+Math.round((lo?3:6)*kz);
    const wall=(n,u,v)=>{Q.box(n,u,v,[0,wz],M.stone,{top:true});Q.box(n+'f',[u[0]-1,u[1]+1],[v[0]-1,v[1]+1],[0,Math.round(3*kz)],M.stone,{top:true});
      if(!lo){const au=u[1]-u[0]>v[1]-v[0];mer(Q,n+'m',au?u:[u[0],u[0]+1],au?[v[1]-1,v[1]]:v,wz,M,au)}};
    wall('cwN',[u0,u1],[v0,v0+t]);wall('cwW',[u0,u0+t],[v0,v1]);wall('cwE',[u1-t,u1],[v0,v1]);wall('cwS0',[u0,-gw/2],[v1-t,v1]);wall('cwS1',[gw/2,u1],[v1-t,v1]);
    if(!lo)for(const s of [-1,1])for(const f of [.35,.7])butt(Q,'cb'+s+f,[s*(gw/2+(u1-gw/2)*f),v1],Math.round(wz*.7),M);
    const tower=(n,c)=>{if(lo)Q.square(n,c,tw,[0,tz],M.stone,{form:'pyramid',rise:2,mat:M.stone,o:0});else ktower(Q,n,c,tw,tz,M);Q.dec(n+'.S','SlitKarn'+M.dec,.5,Math.round(tz*.55))};
    tower('tNW',[u0+tw/2-1,v0+tw/2-1]);tower('tNE',[u1-tw/2+1,v0+tw/2-1]);tower('tSW',[u0+tw/2-1,v1-tw/2+1]);tower('tSE',[u1-tw/2+1,v1-tw/2+1]);
    if(fort===3){tower('tW',[u0+tw/2-1,(v0+v1)/2]);tower('tE',[u1-tw/2+1,(v0+v1)/2]);tower('tN',[(u0+u1)/2,v0+tw/2-1])}
    if(lo)for(const s of [-1,1]){Q.box('gp'+s,[s*(gw/2+1)-2,s*(gw/2+1)+2],[v1-4,v1],[0,wz+4],M.stone,{top:true});Q.box('gl'+s,[s*(gw/2+1)-1,s*(gw/2+1)+1],[v1-3,v1-1],[wz+4,wz+6],'karnCopper',{top:true,topMat:'flame'})}
    else{const gh=Math.max(wz+6,20);Q.box('gate',[-gw/2-2,gw/2+2],[v1-9,v1+1],[0,gh],M.stone);if(gh>=26)Q.dec('gate.S','RuneKarn'+M.dec,.5,gh-6);Q.roof('gate','flat',null,0,M.stone,{parapet:2,merlons:true,pmat:M.cap});Q.dec('gate.S','GateKarn'+M.dec,.5);
      for(const s of [-1,1]){ktower(Q,'gt'+s,[s*(gw/2+6),v1-4],9,gh+3,M);Q.dec('gt'+s+'.S','SlitKarn'+M.dec,.5,gh-8);Q.dec('gt'+s+'.S','SlitKarn'+M.dec,.5,gh-15)}}
    Q.marks.gate=[0,v1,0]}

  /* the Clans' plans */
  // the forge hall: granite under a steep slate gable, its forge mouth glowing to the front, copper vent pipes through its roof, an
  // ore bunker at its side, the hearth's glow before it, anvil, coal and a quench trough
  function forgeHall(Q,o){const M=km(o),dw=Q.home('forge','work'),h=khouse(Q,{n:'f',w:18,d:14,c:[1,-2],z:11,rise:7,dw,door:.5,doorKind:'ForgeKarn'+M.dec,wins:0});
    for(const [i,u] of [-4,6].entries())vent(Q,'vp'+i,[u,-5],h.z-2,h.z+(h.flat?7:h.rise),dw);
    Q.box('ob',[-14,-8],[-2,5],[0,4],M.stone,{dw,top:true,topMat:'rock'});Q.box('ob2',[-13,-9],[-1,4],[4,5],'rock',{top:true});
    Q.box('hb',[-7,-3],[6,8],[0,2],M.stone,{top:true,topMat:'ember'});Q.prop('anvil',[7,8]);Q.prop('coal',[11,8]);Q.prop('trough',[-12,8])}
  // a stone hall: squat and broad under a hip, buttresses at its corners, its rune door, two chimney vents (4 households)
  function stoneHall(Q,o){const dw=Q.home('stonehall','home');khouse(Q,{w:22,d:16,z:12,form:'hip',rise:8,dw,door:.5,doorKind:'Rune',wins:2,vents:[[5,-3],[-5,-3]]});Q.prop('barrel',[-8,11])}
  // the Clans' stable: granite under a slate lean-to, three arched stalls, a trough
  const kstable=(C,at,face)=>made(C,at,face,Q=>{const M=km(Q.o),dw=Q.home('stable','stable');Q.box('spl',[-14,14],[-6,6],[0,2],M.stone,{dw,top:true});Q.box('s',[-13,13],[-5,5],[0,10],M.stone,{dw});
    kroof(Q,'s','shed','u',5);for(const a of [.2,.5,.8])Q.dec('s.S','ArchKarn'+M.dec,a,0);Q.prop('trough',[0,8]);Q.prop('hay',[10,8],0,1)});
  // a hay barn: hay stored under high eaves, a slate roof on heavy posts over the stack
  const haybarn=(C,at,face)=>made(C,at,face,Q=>{const dw=Q.home('haybarn','store');for(const a of [-8,6])for(const b of [-6,4])Q.box('p'+a+b,[a,a+2],[b,b+2],[0,11],'timber',{top:true,dw});
    Q.box('r',[-8,8],[-6,6],[10,11],'log',{thin:true,dw});kroof(Q,'r','gable','u',7);Q.box('hy',[-6,6],[-4,4],[0,8],'thatch',{top:true,dw});Q.dec('hy.S','Hatch',.5,1)});
  // a Clans' street: houses wall to wall from u0 to u1, their fronts at v1, granite below and timber above, steep roofs
  function krow(C,u0,u1,v1,face){const R=C.d;let u=u0;while(u1-u>=14){const w=u1-u<34?u1-u:R.pick([16,18,20]),d=R.pick([14,16]),front=R.chance(.6),up=R.pick([0,6,7]),end=u===u0||u+w>=u1;
      made(C,[u+w/2,v1-d/2],face,Q=>{const dw=Q.home(up?'townhouse':'house','home',up?2:1,up?3:2);khouse(Q,{w,d,z:11,up,jetty:true,form:front?'front':'gable',dw,door:R.pick([.3,.5,.7]),wins:w>=18?2:1,vents:[[w/2-4,-2]],butt:end})});u+=w}}
  // a low wall of the stone round a yard or a pen (pts its corners; gaps [from, to, segment] as a fence's)
  const dry=(C,n,pts,gaps,h)=>{const M=km(C.o);pts.forEach((a,i)=>{const b=pts[i+1];if(!b)return;const al=a[1]===b[1],lo=Math.min(al?a[0]:a[1],al?b[0]:b[1]),hi=Math.max(al?a[0]:a[1],al?b[0]:b[1]);
    let runs=[[lo,hi]];for(const [g0,g1,s] of gaps||[])if(s===i)runs=runs.flatMap(([r0,r1])=>[[r0,Math.min(r1,g0)],[Math.max(r0,g1),r1]]).filter(([r0,r1])=>r1>r0);
    runs.forEach(([r0,r1],j)=>C.Q.parts.push({k:'box',name:n+i+'_'+j,u:al?[r0,r1]:[a[0]-1,a[0]+1],v:al?[a[1]-1,a[1]+1]:[r0,r1],z:[0,h||4],wall:M.stone,top:true}))})};

  // a store of granite under a slate lean-to, its door (a yard's shed)
  const kshed=(Q,n,c,w,d,z,dw)=>{const M=km(Q.o);Q.box(n,[c[0]-w/2,c[0]+w/2],[c[1]-d/2,c[1]+d/2],[0,z],M.stone,{dw});kroof(Q,n,'shed','u',3,{ov:0});Q.dec(n+'.S','DoorKarn'+M.dec,.35,0)};
  // the Clans' layouts for the shared clusters (C, base): every building in them the Clans' own
  const CLUSTERS={
    // a street: houses wall to wall, their yards behind walled in stone, a granite store, a garden, a woodpile
    row(C){krow(C,-30,30,26,0);const R=C.d;made(C,[R.pick([-16,14]),-20],0,Q=>kshed(Q,'s',[0,0],14,8,9,Q.home('shed','store')));
      dry(C,'yw',[[-30,-4],[30,-4]],[[-4,0,0]],3);C.Q.parts.push({k:'bed',name:'g',u:[R.pick([2,-28]),R.pick([2,-28])+14],v:[-28,-20]});P(C,'washing',[R.pick([-6,4]),-12]);piece(C,'woodpile',[22,-28],0)},
    // a hamlet's yard: two houses within a dry-stone wall, beds, a well
    yard(C){piece(C,'cottage',[-12,-14],0,{lv:1,cut:['prop']});piece(C,'cottage',[14,8],3,{lv:C.d.chance(.5)?2:1,cut:['prop']});piece(C,'well',[-14,14],0);
      C.Q.parts.push({k:'bed',name:'b1',u:[-6,4],v:[8,22]},{k:'bed',name:'b2',u:[-28,-22],v:[2,10]});dry(C,'yw',[[-30,28],[30,28],[30,-29],[-30,-29],[-30,28]],[[-4,4,0]],3)},
    // a farmstead: the house, the stone byre with its pen, hay stored under high eaves, terraced beds held by stone, a cart
    farmstead(C){piece(C,'cottage',[-14,-16],0,{lv:2,cut:['prop']});piece(C,'barn',[14,-12],0,{cut:['prop']});haybarn(C,[-18,12],0);piece(C,'cart',[4,16],0);P(C,'trough',[0,2]);
      C.Q.parts.push({k:'bed',name:'f1',u:[-6,28],v:[20,29]},{k:'bed',name:'f2',u:[6,28],v:[10,17]});dry(C,'tw',[[-6,19],[28,19]],null,2);dry(C,'tv',[[6,9],[28,9]],null,2)},
    // a smithy yard: the forge hall to the street, an ore cart on its rails, coal; the smith's house behind, a woodpile, barrels
    smithy(C){piece(C,'smithy',[-8,14],0);piece(C,'cottage',[14,-16],0,{lv:2,cut:['prop']});made(C,[16,16],0,Q=>{Q.rails('r',-8,8,0,true);Q.prop('minecart',[0,0],1,1.5)});piece(C,'barrels',[-22,-18],0);P(C,'coal',[-2,-6]);piece(C,'woodpile',[24,4],0)},
    // an inn: its alehouse of two storeys on the street (granite and timber, its sign and lantern), the stable across the yard, a
    // well, a cart
    inn(C){made(C,[-6,18],0,Q=>{const dw=Q.home('inn','inn',2);khouse(Q,{w:30,d:14,z:11,up:7,form:'gable',rise:9,dw,door:.5,doorKind:'DoorKarn2'+km(Q.o).dec,wins:3,vents:[[10,-3],[-10,-3]]});Q.dec('h.S','Sign',.75,7);Q.dec('h.S','Lamp',.3,6)});
      kstable(C,[10,-18],0);piece(C,'well',[-22,-14],0);piece(C,'cart',[24,6],0);P(C,'barrel',[-20,4]);P(C,'barrel',[-17,6])},
    // a rune shrine, its close walled in stone with rune stones, the keeper's house
    chapel(C){piece(C,'chapel',[-12,-8],0,{cut:['prop']});piece(C,'cottage',[16,-18],0,{lv:1,cut:['prop']});dry(C,'gw',[[2,28],[28,28],[28,4],[2,4],[2,28]],[[12,18,0]],3);
      made(C,[15,16],0,Q=>{const M=km(Q.o);for(const [u,v] of [[-8,-6],[0,-6],[8,-6],[-8,4],[8,4]])runestone(Q,'r'+u+v,[u,v],7,M);brazier(Q,'b',[0,3],M)})},
    // a market: the market hall (an arcade of granite under slate), stalls before it, a well, an ore cart, crates and barrels
    market(C){made(C,[0,-14],0,Q=>{const M=km(Q.o),dw=Q.home('market','trade');Q.box('mpl',[-15,15],[-9,9],[0,2],M.stone,{dw,top:true});Q.box('mh',[-14,14],[-8,8],[0,11],M.stone,{dw});kroof(Q,'mh','hip','u',8);
        for(const k of ['S','N'])for(const a of [.17,.39,.61,.83])Q.dec('mh.'+k,'ArchKarn'+M.dec,a,2);for(const k of ['E','W'])for(const a of [.3,.7])Q.dec('mh.'+k,'ArchKarn'+M.dec,a,2);vent(Q,'v',[0,-2],10,22,dw)});
      piece(C,'stall',[-22,6],3);piece(C,'stall',[22,6],1);piece(C,'stall',[-8,12],0);piece(C,'stall',[8,12],0);piece(C,'well',[0,24],0);
      made(C,[-20,24],0,Q=>Q.prop('minecart',[0,0],0,1.5));piece(C,'crates',[16,24],0);piece(C,'barrels',[26,20],0)},
    // a mill: the watermill on its race, a granary, sacks, a cart
    mill(C){piece(C,'watermill',[-8,12],0);piece(C,'granary',[16,-16],0,{cut:['prop']});P(C,'sacks',[14,4]);piece(C,'cart',[-20,-18],0)},
    // a lumber yard: the shed of stacked logs, the woodcutter's house, stumps, a woodpile, a cart
    lumber(C){piece(C,'lumbershed',[-6,14],0);piece(C,'cottage',[14,-18],0,{lv:1,cut:['prop']});P(C,'stump',[-22,-14]);P(C,'stump',[-14,-24]);piece(C,'woodpile',[22,10],0);piece(C,'cart',[-20,-4],0)},
    // a mine: the mine head in the rock, the miners' house, ore carts on rails, spoil, barrels
    mine(C){piece(C,'minehead',[-6,6],0);piece(C,'cottage',[16,-18],0,{lv:1,cut:['prop']});made(C,[16,16],0,Q=>{Q.rails('r',-10,10,0,true);Q.prop('minecart',[-4,0],1,1.5);Q.prop('minecart',[5,0],1,1.5)});P(C,'spoil',[-24,22]);piece(C,'barrels',[-24,-20],0)},
    // a quarry: the crane over cut blocks before a face of rock, a house, a cart of stone
    quarry(C){C.Q.parts.push({k:'tower',name:'rk',round:true,c:[-12,-20],r:12,z:[0,10],wall:rkOf(C.o),roof:{form:'cone',rise:8,mat:rkOf(C.o),o:0,lip:0,moss:mossOf(C.o)*.8},rough:.6,rs:C.spec.seed|0});piece(C,'crane',[-4,8],0);
      piece(C,'cottage',[18,-16],0,{lv:1,cut:['prop']});P(C,'block',[-22,18]);P(C,'block',[-16,24],1);P(C,'block',[-24,24]);piece(C,'cart',[18,18],0)},
    // a port: a granite quay along the water, mooring posts and a crane arm on its pier, two fishers' houses, nets, barrels
    fishery(C){made(C,[0,16],0,Q=>{const M=km(Q.o),dw=Q.home('quay','work');Q.bed([-32,32],[4,16],'water');Q.box('q',[-30,30],[-2,4],[0,2],M.stone,{dw,top:true});Q.box('pr',[4,12],[4,14],[0,2],M.stone,{dw,top:true});Q.dec('q.S','Hatch',.2,0);
        for(const a of [-20,-6,20])Q.box('mp'+a,[a,a+2],[1,3],[2,6],'timber',{top:true});Q.beam('cm',[10,8,0],[10,8,13],'timber');Q.beam('cj',[10,8,12],[10,14,13],'timber');Q.box('cr',[9.5,10.5],[13,14],[6,12],'rope',{thin:true});Q.box('cb',[9,11],[12.5,14.5],[4,6],'plank',{top:true})});
      piece(C,'fisherhut',[-14,-14],0,{cut:['prop']});piece(C,'fisherhut',[14,-16],0,{cut:['prop']});P(C,'nets',[-2,-4]);piece(C,'barrels',[-24,6],0)},
    // a pasture's steading: the stone byre, a paddock walled in stone with its trough, hay stored under high eaves
    pasture(C){piece(C,'barn',[-14,-12],0,{cut:['prop']});dry(C,'pd',[[2,28],[30,28],[30,-8],[2,-8],[2,28]],[[6,12,3]],4);P(C,'trough',[16,10]);haybarn(C,[-16,16],0)},
    // a brewery: the brewhouse (granite and timber, copper vent pipes over its kettles), its malt kiln under a slate cone, casks
    brewery(C){made(C,[-8,14],0,Q=>{const M=km(Q.o),dw=Q.home('brewery','work',2),h=khouse(Q,{w:26,d:14,z:11,up:7,rise:8,dw,door:.4,doorKind:'DoorKarn2'+M.dec,wins:3});for(const [i,u] of [-6,4].entries())vent(Q,'vp'+i,[u,-3],h.z-2,h.z+(h.flat?9:h.rise+6),dw);
        Q.round('klb',[18,-4],6,[0,3],M.stone,{form:'lid',mat:M.stone},{dw});Q.round('kl',[18,-4],5,[0,12],M.stone,M.flat?{form:'lid',mat:M.stone}:{form:'cone',rise:7,mat:Q.o.roofMat,o:1},{dw});vent(Q,'kv',[18,-4],12,22,dw);Q.dec('kl.S','DoorKarn'+M.dec,.5,3)});
      piece(C,'granary',[16,-16],0,{cut:['prop']});piece(C,'barrels',[-20,-12],0);piece(C,'barrels',[-24,-22],0);P(C,'barrel',[22,8]);P(C,'barrel',[26,10])},
    // a granary yard: two granaries on their loading bridges, a cart, sacks
    granary(C){piece(C,'granary',[-14,-12],0);piece(C,'granary',[14,-16],0,{cut:['prop']});piece(C,'cart',[4,20],0);P(C,'sacks',[-16,20])},
    // a workshop yard: the store with its crane arm, a house, crates, a cart
    workshop(C){piece(C,'warehouse',[-6,12],0);piece(C,'cottage',[14,-18],0,{lv:1,cut:['prop']});piece(C,'crates',[-22,-16],0);piece(C,'cart',[22,12],0)},
    // a camp (the camp tier): the shared tents round their fire, and the Clans' kit by it: a portable anvil, an ore cart
    camp(C,base){base(C);P(C,'anvil',[-11,2],0,1.5);made(C,[11,1],0,Q=>Q.prop('minecart',[0,0],1,1.5))},
    // a town quarter (128): streets of Clans' houses both sides of two lanes, a square with its well and braziers, gardens behind
    quarter(C){krow(C,-62,-8,60,0);krow(C,8,62,60,0);krow(C,-62,-8,-4,0);krow(C,8,62,-4,0);krow(C,-62,-8,-40,0);krow(C,8,62,-40,0);
      piece(C,'well',[0,14],0);piece(C,'cart',[-18,24],0);piece(C,'barrels',[20,24],0);P(C,'bench',[-6,30],1);made(C,[0,0],0,Q=>{const M=km(Q.o);brazier(Q,'b0',[-6,6],M);brazier(Q,'b1',[6,6],M)});
      C.Q.parts.push({k:'bed',name:'g1',u:[-60,-40],v:[-28,-18]},{k:'bed',name:'g2',u:[30,58],v:[-28,-18]})}};

  PX.registerBuildStyle('karn',{
    // the style table (buildmodels.js LOOK0 its shape)
    look:{people:'dwarf',
      roof:'slate',rural:null,walls:['karnGranite'],frame:null,stone:'karnGranite',fort:'karnGranite',fieldstone:'karnGranite',wood:'plank',silo:'karnGranite',felt:null,
      trim:'iron',accent:'karnCopper',ground:null,
      forms:['gable','gable','front','hip'],cones:false,hall:'stonehall',door:'DoorKarn',win:'WinKarn',finial:'timber',
      townhouse:{lower:'karnGranite',upper:'log'},
      village:{form:'hip',rise:10,door:'Rune',wall:'karnGranite',goods:['barrels','crates']},
      swap:{smithy:'forge'},
      karn:{stone:'karnGranite',upper:'log',flat:false,footing:0,dec:''},
      desert:{wall:'karnSand',walls:['karnSand'],stone:'karnSand',fort:'karnSand',fieldstone:'karnSand',silo:'karnSand',door:'DoorKarnD',win:'WinKarnD',
        townhouse:{lower:'karnSand',upper:'karnSand'},village:{wall:'karnSand'},karn:{stone:'karnSand',base:'karnGranite',cap:'karnGranite',upper:'karnSand',flat:true,dec:'D'}},
      swamp:{karn:{footing:KT.footing}},frost:{}},
    // its materials: dark granite, the desert's red sandstone, copper (its vent pipes)
    textures:{karnGranite:'stone',karnSand:'stone'},
    materials:{karnGranite:['#a6a8b0','#7c7e88','#5a5c66','#3c3e48'],karnSand:['#eeae80','#c97e56','#9c583e','#683a30'],karnCopper:['#f6be86','#d8844a','#a05a32','#643826']},
    // its decal letters (runes, so another culture's letters never clash; its rows below write them = _ % & + *): the granite's lit
    // and deep tones, the sandstone's, hay
    letters:{'\u16b7':['karnGranite',0],'\u16be':['karnGranite',3],'\u16ca':['karnSand',0],'\u16cf':['karnSand',3],'\u16ba':['thatch',1],'\u16c3':['thatch',2]},
    // its decals (and the desert's, D: in sandstone, the doorways deep): an iron-banded door under a lintel, a double one, small warm
    // windows, a timber storey's small window, a warm-lit slit, a glowing rune, the forge's mouth, a monumental gate, an arch, a hay loft
    decals:(()=>{const D={DoorKarn:['=======','=_____=','=diiie=','=dedke=','=dedee=','=diiie=','=dedee=','=diiie=','ppppppp'],
        DoorKarn2:['=========','=_______=','=diiiiie=','=dekhkde=','=dedhdee=','=diiiiie=','=dedhdee=','=diiiiie=','ppppppppp'],
        WinKarn:['====','_ao_','_oo_','____'],RuneKarn:['O__','OO_','O_O','OO_','O__'],SlitKarn:['_','o','O','o','_'],
        ForgeKarn:['============','=__________=','=_########_=','=_###oo###_=','=_##oOOo##_=','=_#oOOOOo#_=','=_oOOOOOOo_=','=_iiiiiiii_=','pppppppppppp'],
        ArchKarn:['.===.','=___=','=###=','=###=','=###=','=###=','=###='],HayKarn:['_____','_+*+_','+*+*+','+++++']};
      // (the monumental gate: an arch of dressed stone round iron-banded doors, studded, its keystone a glowing rune)
      const G=[],gw=14,gh=17,cx=(gw-1)/2,R=gw/2-.5;for(let r=0;r<gh;r++){let s='';for(let c=0;c<gw;c++){const d=Math.hypot(c-cx,r<R?R-r:0);
        s+=d>R+.01?'.':r===0&&Math.abs(c-cx)<1?'O':d>R-2.01?'=':r<R-2?'_':c===6||c===7?'h':(r-4)%4===0?'i':(r+c)%5===0?'k':c<6?'d':'e'}G.push(s)}D.GateKarn=G;
      // (the desert's: in sandstone; its doors deep in shade)
      const sand=rows=>rows.map(r=>r.replace(/=/g,'%').replace(/_/g,'&'));for(const k of Object.keys(D))D[k+'D']=sand(D[k]);
      D.DoorKarnD=['%%%%%%%','%&&&&&%','%&DDD&%','%&dek&%','%&ded&%','%&ded&%','%&ded&%','%&ded&%','ppppppp'];
      D.WinKarnS=['iiii','iaoi','iiii'];
      // (= _ % & + * to their runes)
      const RUNE={'=':'\u16b7','_':'\u16be','%':'\u16ca','&':'\u16cf','+':'\u16ba','*':'\u16c3'};for(const k in D)D[k]=D[k].map(r=>r.replace(/[=_%&+*]/g,c=>RUNE[c]));return D})(),
    // its own types (any culture can build them; their plan the generic)
    own:{types:{stonehall:{cell:32,dwellings:4,plan:stoneHall},forge:{cell:32,dwellings:0,plan:forgeHall}}},
    // its plans for the shared types, clusters and centres: (Q, o, base), (C, base), {tier: {type} or {kind}}
    types:{
      // --- the objects ---
      // a market stall: its counter of granite, its posts of iron, its awning the market's colour
      stall(Q,o,base){base(Q,o);const M=km(o);for(const p of Q.parts){if(p.name==='ct')p.wall=M.stone;if(/^po/.test(p.name))p.wall='iron'}},
      // --- 32 px ---
      // a cottage: a granite ground floor, a dark timber storey over it, a steep slate roof, chimney vents (2 households)
      cottage(Q,o){const d=o.d,dw=Q.home('cottage','home',2),form=d.pick(['gable','gable','front']),door=d.pick([.3,.5,.7]),h=khouse(Q,{w:16,d:14,z:11,up:4,form,rise:7,dw,door,vents:form==='front'?[[4,-4]]:[[-4,-1],[4,-1]]});
        const p=d.pick(['barrel','woodpile','crate','']);if(p)Q.prop(p,[(door>.5?-1:1)*5,9+h.ft],p==='woodpile'?0:1)},
      // a town house: granite below, a jettied timber storey over the street, its gable to it (3 households)
      townhouse(Q,o){const d=o.d,dw=Q.home('townhouse','home',2);khouse(Q,{w:14,d:14,z:11,up:6,rise:6,jetty:true,form:'front',dw,door:d.pick([.3,.7]),wins:1,vents:[[3,-3]]})},
      // a fisher's hut (the port's): granite on its quay over the water, a mooring post, the net rack, a barrel
      fisherhut(Q,o){const M=km(o),dw=Q.home('fisherhut');khouse(Q,{w:16,d:14,c:[-2,-5],z:11,rise:7,form:'front',dw,door:.4,wins:1,vents:[[-6,-8]]});
        Q.bed([-16,16],[8,15],'water');Q.box('qy',[-14,12],[4,9],[0,2],M.stone,{top:true});Q.box('mp',[9,11],[6,8],[0,5],'timber',{top:true});
        for(const b of [-6,0])Q.beam('np'+b,[11,b,0],[11,b,8],'timber');Q.cut('nt',-7,10.5,1,['nnnnnnn','n.n.n.n','nnnnnnn','n.n.n.n','nnnnnnn','.nnnnn.'],{n:'net'},{alongV:true});Q.prop('barrel',[-11,6],1)},
      // a rune shrine (the Clans' chapel): squat granite under a steep slate gable, its rune door, a glowing rune stone and braziers
      chapel(Q,o){const M=km(o),dw=Q.home('chapel','worship');khouse(Q,{n:'n',w:16,d:16,c:[0,-4],z:12,form:'front',rise:8,dw,door:.5,doorKind:'Rune',wins:0});
        runestone(Q,'rs',[-10,7],9,M);for(const s of [-1,1])brazier(Q,'br'+s,[s*5,7],M)},
      // a watch tower built into a retaining wall: a terrace across the front behind merlons, steps up to it, the tower square and
      // flat-topped, warm slits on every side
      tower(Q,o){const M=km(o),dw=Q.home('tower','defence');Q.flag=true;
        Q.box('tr',[-11,11],[-3,6],[0,10],M.stone,{dw,top:true});mer(Q,'tm',[-11,11],[4,6],10,M,true);Q.dec('tr.S','DoorKarn'+M.dec,.5,0);for(const a of [.15,.85])Q.dec('tr.S','SlitKarn'+M.dec,a,4);
        for(const s of [-1,1])butt(Q,'trb'+s,[s*7,6],7,M,dw);ktower(Q,'tw',[0,-5],12,18,M,dw);band(Q,'twi',[-6,6],[-11,1],13);
        for(const a of [.25,.75])Q.dec('tw.S','SlitKarn'+M.dec,a,13);for(const k of ['E','W','N'])Q.dec('tw.'+k,'SlitKarn'+M.dec,.5,12)},
      smithy:forgeHall,
      // a stone byre: granite under a steep slate gable with high eaves, its hay in the loft, its doors; a winter pen walled in
      // stone at its side, a trough and hay in it
      barn(Q,o){const M=km(o),dw=Q.home('barn','store'),h=khouse(Q,{n:'b',w:18,d:14,c:[-4,-3],z:12,form:'front',rise:8,dw,door:.5,doorKind:'Barn',wins:0});
        if(!h.flat)Q.dec('b.S','HayKarn',.5,h.z+1,true);else Q.prop('hay',[-4,-6],0,1.5,h.z+h.ft);
        for(const [n,u,v] of [['pN',[7,15],[-10,-8]],['pE',[13,15],[-10,9]],['pS0',[7,9],[7,9]],['pS1',[12,15],[7,9]]])Q.box(n,u,v,[0,5],M.stone,{top:true});Q.prop('trough',[10,-1],1);Q.prop('hay',[-12,8],0,1)},
      // a granary: a low granite storehouse on a podium, its iron-banded door up on a raised, snow-safe loading bridge on piers
      granary(Q,o){const M=km(o),dw=Q.home('granary','store');Q.box('gp',[-12,12],[-12,5],[0,5],M.stone,{dw,top:true});
        Q.lift=5;khouse(Q,{n:'g',w:20,d:14,c:[0,-4],z:10,form:'hip',rise:6,dw,door:.5,wins:0,footing:false,butt:false});Q.lift=0;
        for(const a of [-12,12])for(const b of [-12,5])butt(Q,'gb'+a+b,[a,b],7,M,dw);
        Q.box('lb',[-3,3],[5,14],[4,5],'plank',{top:true,thin:true});for(const s of [-1,1]){Q.box('lp'+s,[s*3-1,s*3+1],[11,13],[0,4],M.stone,{top:true});Q.box('lr'+s,[s*3-.5,s*3+.5],[5,14],[5,7],'iron',{top:true,thin:true})}
        Q.prop('sacks',[8,9],0,1.5);Q.prop('sacks',[-9,8],0,1.5)},
      // a windmill: a round granite tower on its battered ring under a slate cap, its sails, an iron hub
      windmill(Q,o){const M=km(o),dw=Q.home('windmill','work');Q.round('mb',[0,0],7,[0,3],M.stone,{form:'lid',mat:M.stone},{dw});
        Q.round('m',[0,0],5.5,[0,14],M.stone,M.flat?{form:'lid',mat:M.stone}:{form:'cone',rise:7,mat:o.roofMat,o:1},{dw});Q.dec('m.S','DoorKarn'+M.dec,.5,3);for(const k of ['N','E','W'])Q.dec('m.'+k,'WinKarn'+M.dec,.5,8);
        Q.box('hub',[-1,1],[4.5,7.5],[11,13],'iron',{top:true});sails(Q,0,6,12,12);Q.prop('sacks',[-8,2])},
      // a watermill: granite under slate beside its race, its wheel turning on an iron axle from the wall
      watermill(Q,o){const M=km(o),dw=Q.home('watermill','work');khouse(Q,{w:14,d:18,c:[-6,-2],z:11,rise:6,dw,door:.4,wins:1,vents:[[-9,-6]]});
        Q.bed([-15,15],[9,14],'water');Q.box('ax',[1,7],[3,5],[5,6],'iron',{top:true});Q.wheel('wh',6,3,6,5,'plank',2);Q.prop('sacks',[8,-8],0,1.5)},
      // a warehouse (the workshop's store): long granite under slate, iron-banded double doors, a crane arm over the yard
      warehouse(Q,o){const M=km(o),dw=Q.home('warehouse','store');khouse(Q,{n:'w',w:22,d:14,c:[-3,-3],z:11,rise:6,dw,door:.35,doorKind:'DoorKarn2'+M.dec,wins:1,vents:[[-9,-5]]});
        Q.beam('cp',[11,5,0],[11,5,15],'timber');Q.beam('cj',[11,5,14],[11,11,14],'timber');Q.beam('cb',[11,5,9],[11,9,14],'timber');
        Q.box('rp',[10.5,11.5],[10,11],[7,14],'rope',{thin:true});Q.box('hk',[10,12],[9.5,11.5],[5,7],'plank',{top:true});Q.prop('crate',[-12,10]);Q.prop('barrel',[5,10])},
      // a lumber shed: a granite back wall, heavy timber posts, a slate lean-to over the stacked logs, a stump, its axe
      lumbershed(Q,o){const M=km(o),dw=Q.home('lumbershed','work');Q.box('bk',[-11,11],[-9,-5],[0,12],M.stone,{dw});Q.dec('bk.S','DoorKarn'+M.dec,.85,0);Q.dec('bk.N','DoorKarn'+M.dec,.5,0);
        for(const a of [-11,-1,9])Q.box('po'+a,[a,a+2],[6,8],[0,11],'timber',{top:true});for(const s of [-1,1])Q.box('sw'+s,s<0?[-11,-9]:[9,11],[-5,6],[0,6],M.stone,{top:true});
        Q.box('rf',[-11,11],[-9,8],[11,12],'log',{thin:true});kroof(Q,'rf','shed','u',5,{ov:0});
        Q.prop('logs',[-5,-3],0,1.5);Q.prop('logs',[1,-3],0,1.5);Q.prop('logs',[-2,-3],0,1.5,4.5);Q.prop('stump',[-7,11]);Q.box('ax',[-6,-4],[10,12],[4,5],'iron',{top:true});Q.prop('logs',[6,11],0,1)},
      // a mine head: a rock-cut entrance in the mountain's flank, dressed granite jambs and a rune lintel, timber and iron braces,
      // rails out with an ore cart, a warm lamp at the mouth, a crane arm over the spoil
      minehead(Q,o){const M=km(o),rk=rkOf(o),moss=mossOf(o),dw=Q.home('minehead','work');
        crag(Q,'h',[0,-10],10,6,9,rk,moss,o.seed);crag(Q,'h2',[-10,-4],7,4,6,rk,moss,o.seed+1);crag(Q,'h3',[10,-5],6,4,5,rk,moss,o.seed+2);
        Q.box('a',[-5,5],[-4,3],[0,12],rk,{dw,top:true});Q.dec('a.S','Adit',.5,0);
        for(const s of [-1,1])Q.box('j'+s,[s*6-1.5,s*6+1.5],[2,5],[0,10],M.stone,{dw,top:true});Q.box('lt',[-8,8],[2,5],[10,15],M.stone,{dw,top:true});Q.dec('lt.S','RuneKarn'+M.dec,.5,0);
        Q.box('bi',[-4,4],[3,4],[9,10],'iron',{thin:true});Q.rails('r',5,14,0,false);Q.prop('minecart',[0,11],0,1.5);
        Q.box('lpo',[7,8],[7,8],[0,8],'timber',{top:true});Q.box('lpl',[6.5,8.5],[6.5,8.5],[8,10],'karnCopper',{top:true,topMat:'flame'});
        Q.beam('cm',[-11,4,0],[-11,4,13],'timber');Q.beam('cj',[-11,4,12],[-11,10,13],'timber');Q.box('cr',[-11.5,-10.5],[9.5,10.5],[7,12],'rope',{thin:true});Q.box('cbk',[-12,-10],[9,11],[5,7],'iron',{top:true});
        Q.prop('spoil',[-11,11],0,1.5);Q.prop('boulder',[11,11],0,1.5)},
      // a quarry crane: a granite plinth, its mast iron-banded and braced, the jib angled out, a rope to its hook and a cut block;
      // its winch hut of granite, blocks below
      crane(Q,o){const M=km(o),dw=Q.home('crane','work');Q.box('hs',[-12,-3],[-9,2],[0,9],M.stone,{dw});kroof(Q,'hs','shed','u',4,{ov:0});Q.dec('hs.S','DoorKarn'+M.dec,.5,0);Q.dec('hs.E','WinKarn'+M.dec,.5,3);
        Q.box('pl',[-1,5],[-3,3],[0,4],M.stone,{top:true});Q.box('ms',[1,3],[-1,1],[4,17],'timber',{top:true});for(const z of [8,13])Q.box('mb'+z,[0,4],[-2,2],[z,z+1],'iron',{top:true});
        Q.beam('b0',[-.5,0,4],[1,0,10],'timber');Q.beam('b1',[4.5,0,4],[3,0,10],'timber');Q.beam('jb',[3,1,14],[8,7,19],'timber');Q.beam('st',[3,1,8],[5.5,4,15],'timber');
        Q.box('rp',[7.5,8.5],[6.5,7.5],[12,19],'rope',{thin:true});Q.box('hk',[7,9],[6,8],[10,12],'iron',{top:true});Q.box('ld',[5.5,10.5],[4.5,9.5],[5,9],M.stone,{top:true});
        Q.prop('block',[0,8],1,2);Q.prop('block',[-4,10],0,1.5);Q.box('wn',[-2,2],[3,5],[0,3],'iron',{top:true})},
      // --- 64 px ---
      // an alehouse half sunk in the ground: a broad granite hall low under a great slate roof, earth banked and turfed up its back
      // and ends, a sunken forecourt walled either side of its door, its sign and lantern; casks, benches, a stable of granite
      tavern(Q,o){const M=km(o),rk=rkOf(o),dw=Q.home('tavern','inn',1);khouse(Q,{w:34,d:18,c:[-10,-6],z:11,rise:9,dw,door:.5,doorKind:'DoorKarn2'+M.dec,wins:3,vents:[[-20,-8],[0,-8]],butt:false});
        for(const [n,u,v,h] of [['e1',[-32,-25],[-16,2],5],['e2',[5,12],[-16,2],5],['e3',[-28,8],[-22,-13],6]])berm(Q,n,u,v,h,o);
        for(const s of [-1,1])Q.box('fw'+s,[-10+s*7-1,-10+s*7+1],[3,10],[0,4],M.stone,{top:true});Q.dec('h.S','Sign',.7,6);Q.dec('h.S','Lamp',.3,6);
        Q.box('sb',[11,27],[-26,-16],[0,8],M.stone,{dw});kroof(Q,'sb','shed','u',4,{ov:0});for(const a of [.3,.7])Q.dec('sb.S','ArchKarn'+M.dec,a,0);
        for(const [n,u,v] of [['yS',[9,30],[19,21]],['yE',[28,30],[-14,21]]])Q.box(n,u,v,[0,3],M.base,{top:true});Q.prop('bench',[14,6]);Q.prop('bench',[20,12]);Q.prop('trough',[22,-8]);
        for(const [a,b] of [[25,4],[25,8],[11,-8]])Q.prop('barrel',[a,b],0,1.5);Q.prop('woodpile',[-24,14],0,1.5)},
      // an ancestors' hall (the Clans' church): a long granite hall buttressed down its sides under a steep slate gable, a squat
      // massive tower at its front under a slate pyramid, its rune door and a glowing rune, braziers, rune stones
      church(Q,o){const M=km(o),dw=Q.home('church','worship');Q.box('npl',[-10,15],[-10,10],[0,2],M.stone,{dw,top:true});Q.box('n',[-9,14],[-9,9],[0,13],M.stone,{dw});kroof(Q,'n','gable','u',11,{ov:0});
        for(const a of [-3,3,9])for(const b of [-9,9])butt(Q,'nb'+a+b,[a,b],8,M,dw);Q.round('ap',[14,0],6.5,[0,11],M.stone,M.flat?{form:'lid',mat:M.stone}:{form:'cone',rise:7,mat:o.roofMat,o:1},{dw});
        Q.box('twb',[-24,-8],[-8,8],[0,4],M.stone,{dw,top:true});ktower(Q,'tw',[-16,0],14,22,M,dw,9);
        Q.dec('tw.S','Rune',.5,4);Q.dec('tw.S','RuneKarn'+M.dec,.5,15);for(const k of ['E','W','N'])Q.dec('tw.'+k,'SlitKarn'+M.dec,.5,14);
        for(const k of ['S','N'])for(const a of [.2,.45,.7,.9])Q.dec('n.'+k,'SlitKarn'+M.dec,a,5);Q.dec('n.E','RuneKarn'+M.dec,.5,6);
        for(const s of [-1,1])brazier(Q,'br'+s,[-16+s*6,11],M);for(const [u,v] of [[4,14],[20,12]])runestone(Q,'rs'+u,[u,v],8,M)},
      // a clans' longhouse: long and low, granite under a steep slate roof, banked into the hill behind, a granite annex, vents
      longhouse(Q,o){const M=km(o),rk=rkOf(o),dw=Q.home('longhouse','home');khouse(Q,{w:44,d:18,c:[-2,6],z:11,rise:10,dw,door:.5,doorKind:'DoorKarn2'+M.dec,wins:4,vents:[[-14,4],[10,4]],back:'door'});
        berm(Q,'e1',[-26,22],[-8,-1],6,o);
        Q.box('an',[20,28],[1,13],[0,8],M.stone,{dw});kroof(Q,'an','shed','v',3,{ov:0});Q.dec('an.S','DoorKarn'+M.dec,.5,0);Q.prop('woodpile',[-6,-10],0);Q.prop('cart',[-24,22],1)},
      // a mountain keep (straight on): the mountain's flanks behind, a terrace held on arches with steps up its middle, the donjon
      // square and massive on it, turrets at its front corners, wings either side; the Clans' walls by its fortification
      keep(Q,o){const M=km(o),f=o.fort|0,dw=Q.home('keep','hall',3);Q.flag=true;Q.ground='cobble';
        
        Q.box('tr',[-19,19],[-28,-6],[0,9],M.stone,{dw,top:true});for(const a of [.1,.26,.74,.9])Q.dec('tr.S','ArchKarn'+M.dec,a,0);steps(Q,'ts',0,8,-6,9,M);
        Q.box('db',[-10,10],[-28,-8],[0,12],M.stone,{dw,top:true});ktower(Q,'dj',[0,-18],16,31,M,dw,9);band(Q,'djb',[-8,8],[-26,-10],20);
        Q.dec('dj.S','DoorKarn2'+M.dec,.5,9);for(const a of [.25,.75])Q.dec('dj.S','WinKarn'+M.dec,a,19);Q.dec('dj.S','RuneKarn'+M.dec,.5,24);for(const k of ['E','W','N'])Q.dec('dj.'+k,'SlitKarn'+M.dec,.5,22);
        for(const s of [-1,1]){ktower(Q,'dt'+s,[s*8,-11],6,36,M,dw);Q.box('wg'+s,s<0?[-18,-10]:[10,18],[-25,-13],[0,16],M.stone,{dw});kroof(Q,'wg'+s,'gable','v',6,{ov:0});Q.dec('wg'+s+'.S','WinKarn'+M.dec,.5,11)}
        brazier(Q,'by',[-12,6],M);Q.round('wl',[12,6],3,[0,3],M.stone,{form:'water'});
        if(f)kcurtain(Q,-28,28,-31,27,f,1,M);else{Q.prop('cart',[-16,18],1);Q.prop('barrel',[16,16])}},
      // a gatehouse built into a retaining wall (straight on): the wall across, its walk behind merlons, the gate block forward of it
      // with its monumental gate, square towers either side, warm slits; the barracks' hall behind under slate
      gatehouse(Q,o){const M=km(o),dw=Q.home('gatehouse','defence');Q.flag=true;
        khouse(Q,{n:'bk',w:44,d:12,c:[0,-20],z:11,dw,door:.5,wins:4,vents:[[-12,-22],[12,-22]],butt:false,footing:false});
        Q.box('rwf',[-31,31],[-9,3],[0,4],M.stone,{dw,top:true});Q.box('rw',[-30,30],[-8,2],[0,14],M.stone,{dw,top:true});mer(Q,'rm',[-30,30],[1,2],14,M,true);
        Q.box('g',[-9,9],[-6,8],[0,24],M.stone,{dw});Q.roof('g','flat',null,0,M.stone,{parapet:2,merlons:true,pmat:M.cap});Q.dec('g.S','GateKarn'+M.dec,.5);Q.dec('g.S','RuneKarn'+M.dec,.5,19);
        for(const s of [-1,1]){ktower(Q,'t'+s,[s*16,-1],10,28,M,dw);for(const z of [10,19])Q.dec('t'+s+'.S','SlitKarn'+M.dec,.5,z);for(const a of [.2,.8])Q.dec('g.S','SlitKarn'+M.dec,a,15);
          butt(Q,'rb'+s,[s*25,2],10,M,dw)}
        Q.marks.gate=[0,8,0]},
      // a village's centre (straight on): the clan hall (look.village) on a terrace held by a granite retaining wall, steps up its
      // middle; the green below with its well under slate and the clan's goods, a brazier; fortified, a low granite wall round it
      village(Q,o){const M=km(o),V=o.look.village,f=(o.fort|0)>0,dw=Q.home('village','hall',1);Q.flag=true;
        Q.box('tr',[-25,25],[-29,-5],[0,5],M.stone,{dw,top:true});steps(Q,'ts',0,8,-5,5,M);
        Q.lift=5;khouse(Q,{n:'hl',w:32,d:16,c:[0,-17],z:12,form:V.form,rise:V.rise,dw,door:.5,doorKind:V.door,wins:4,vents:[[-9,-19],[9,-19]],footing:false});Q.lift=0;
        for(const s of [-1,1])runestone(Q,'rs'+s,[s*21,-7],8,M);
        Q.round('wl',[-12,8],4.5,[0,4],M.stone,{form:'water'});for(const s of [-1,1])Q.box('wp'+s,[-12+s*4.5-1,-12+s*4.5+1],[7,9],[0,8],'timber',{top:true});Q.box('wr',[-17.5,-6.5],[6,10],[8,9],'timber',{thin:true});kroof(Q,'wr','gable','u',3,{o:0,ov:0});
        const g=V.goods;Q.prop(g[0]==='barrels'?'barrel':g[0],[12,8]);Q.prop(g[1]==='crates'?'crate':g[1],[16,14]);brazier(Q,'by',[6,12],M);
        if(f){const e=29,b=27;for(const [n,u,v] of [['pN',[-e,e],[-b-3,-b-1]],['pW',[-e,-e+2],[-b-3,b]],['pE',[e-2,e],[-b-3,b]],['pS0',[-e,-6],[b-2,b]],['pS1',[6,e],[b-2,b]]])Q.box(n,u,v,[0,7],M.stone,{top:true});
          for(const s of [-1,1]){Q.box('gp'+s,s<0?[-9,-5]:[5,9],[b-3,b],[0,11],M.stone,{top:true});Q.box('gl'+s,s<0?[-8,-6]:[6,8],[b-2,b-1],[11,13],'karnCopper',{top:true,topMat:'flame'})}Q.marks.gate=[0,b,0]}else Q.marks.gate=[0,28,0]},
      // a town's hold (straight on; a city's at 128, spec.capital): the mountain behind, the clan hall on its upper terrace between
      // two towers, the terrace held on arches (bridge-like supports) with the great stair up its middle, the lower court with its
      // braziers and well; a capital's great donjon rising behind; the Clans' walls by its fortification
      citadel(Q,o){const M=km(o),rk=rkOf(o),moss=mossOf(o),cap=o.capital,k=cap?2:1,kz=cap?1.4:1,f=o.fort|0,dw=Q.home('citadel','hall',3);Q.flag=true;Q.ground='cobble';
        const vb=cap?-56:-30;crag(Q,'m0',[-22*k,vb+6*k],9*k,10*k,9*k,rk,moss,o.seed);crag(Q,'m1',[22*k,vb+5*k],8*k,9*k,8*k,rk,moss,o.seed+1);
        const tv=cap?[-50,-16]:[-28,-8],th=Math.round(9*kz);Q.box('t1',[-21*k,21*k],tv,[0,th],M.stone,{dw,top:true});
        for(const a of (cap?[.08,.2,.32,.68,.8,.92]:[.1,.27,.73,.9]))Q.dec('t1.S','ArchKarn'+M.dec,a,0);steps(Q,'ts',0,8*k,tv[1],th,M);
        if(cap){ktower(Q,'dj',[0,-44],22,52,M,dw);for(const s of [-1,1])ktower(Q,'dt'+s,[s*11,-36],6,56,M,dw);Q.dec('dj.S','RuneKarn'+M.dec,.5,44);for(const z of [32,40])for(const a of [.3,.7])Q.dec('dj.S','SlitKarn'+M.dec,a,z)}
        Q.lift=th;khouse(Q,{n:'hl',w:cap?44:28,d:cap?16:12,c:[0,(tv[0]+tv[1])/2+(cap?2:-1)],z:cap?15:13,form:'hip',rise:cap?12:9,dw,door:.5,doorKind:'DoorKarn2'+M.dec,wins:cap?4:3,
          vents:[[-8*k,tv[0]+4*k],[8*k,tv[0]+4*k]],footing:false,butt:!cap});Q.lift=0;
        for(const s of [-1,1]){ktower(Q,'pt'+s,[s*18*k,(tv[0]+tv[1])/2],8*k,cap?38:28,M,dw,cap?0:6);Q.dec('pt'+s+'.S','SlitKarn'+M.dec,.5,cap?28:20);Q.dec('pt'+s+'.S','WinKarn'+M.dec,.5,cap?18:12)}
        // (a capital's lower town: clan houses either side of the great stair)
        if(cap)[[-36,0],[36,0],[-24,26],[24,26]].forEach(([u,v],i)=>khouse(Q,{n:'ch'+i,c:[u,v],w:18,d:14,z:11,up:5,rise:7,form:i<2?'front':'gable',dw:Q.home('house','home',2,2),door:.5,wins:2,vents:[[u+4,v-2]]}));
        for(const s of [-1,1])brazier(Q,'by'+s,[s*7*k,tv[1]+6*k],M);Q.round('ft',[0,(tv[1]+20*k)],3.5*k,[0,2],M.stone,{form:'water'});
        if(f||cap)kcurtain(Q,-27*k,27*k,vb-(cap?0:1),27*k,f||3,k,M,kz);else{Q.prop('cart',[-16,16],1);Q.prop('crate',[16,14])}},
    },
    clusters:CLUSTERS,centres:{}});
})(window.PX=window.PX||{});
