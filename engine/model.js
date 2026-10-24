'use strict';
/* ---------- PX engine: buildings as small 3D models ---------- */
// A building is a few simple parts (wall boxes, roofs, towers, chimneys) in its own ground plan, turned to one of 4 facings
// (PX.MODEL_YAWS: yaw 0 its front to the south, toward the camera, 2 west, 4 north, 6 east; the renderer can turn by 45° too, odd
// yaws, but nothing uses it: a diagonal house reads as an isometric diamond on this straight map) and drawn to true pixels by a
// small renderer of our own, in the people figures' style.
//   Camera (stage 3, the owner's gentler pitch, PX.MODEL_CAMERA): a ground point (x, g) at height z shows at (x, g*depth - z), the
//     ground's depth at half its length, so the walls turned to the camera show tall below the roof (about 40% of a building's front
//     view, with buildmodels.js's storeys and roofs); a face turned away (or edge-on) is not drawn. Light reads each face's true slope.
//   Plan: the part's local (u, v) (u along its front, v toward its front, z up, in px) snap to steps of the turned grid: 1 px on
//     the 4 straight yaws, 1 px across and 1 down (√2 along the ground) on the 4 diagonals, so every edge is straight or a clean
//     staircase and parts that share an edge meet exactly.
//   Depth: a buffer a pixel (the nearest face wins: the one whose point on the pixel's ray stands highest toward the camera).
//   Light: from the upper left (as the trees and figures), each face by its normal, picking from its material's 4-tone ramp
//     (hue-shifted: light warm, shade cool). Detail in the mid-tones, in the face's own (u, v) so it turns with it: tile courses
//     with scalloped edges, thatch strands with a bound ridge and a thick eave, staggered slate plates, shingle, leaf, hide; ridge
//     caps, a lit verge on the sun side, moss and slipped tiles; finials, dormers, capped chimneys; timber framing (posts, a cross-
//     beam, braces) on daub, coursed stone with quoins, plank, logs, a stone footing, weathering at the foot, a band of shade under
//     the eaves; a little 2-tone speckle inside every surface. Decals on a named wall ('main.S', by where along it): doors framed
//     on a step, windows with lintels, shutters, panes and flower boxes, lancets, signs, a lantern, beam ends, a barn's doors, a
//     forge's glowing mouth, a stable's stalls, a stall's goods, a mill-wheel. Props by walls and in yards: barrels, crates, a
//     woodpile, a bench, a trough, a cart, a washing line, sacks, an anvil, headstones, coal, a haystack; fences of posts and
//     rails with gaps.
//   Fit: the plan's width, depth, height and eaves are scaled (each its own way, the least change first) until the picture fits
//     its cell; then cleanup: spurs and notches off the silhouette, orphan pixels into their surroundings, a navy outline round the
//     silhouette only (#1a1c26, the figures'), every pixel opaque or empty, cropped to the cell.
//   Layers, each a canvas of the cell: img what stands (buildings and props, transparent everywhere else, never a box); ground the
//     flat layer under it (a yard of worn earth or cobbles closed over the gaps between what stands, paths from the doors, garden
//     beds, a mill's race; its edge dithered into the terrain with grass poking in, tufts at the walls' feet; by climate), drawn
//     with the flat things before anything standing; shadow a solid mask (every face laid on the ground along the light, to the
//     lower right, off the picture), which the game lays with every other shadow in view into one mask and shades once at shade
//     (PX.MODEL_SHADE, .28), after the ground and before anything standing, so neighbours' shadows merge instead of stacking.
// PX.model(spec) -> {img, ground, shadow, shade, w, h, ax:0, ay:cell, cell, tiles, flag, yaw, role, windows:[[x,y],...],
//   door:{x,y,seen}, buildings, dwellings, mask, clipped, scale:{u,v,z,o}, ms}: img, ground and shadow all drawn at tileX*16,
//   (tileY+1)*16 - cell. spec: {cell (16, 32, 64), yaw (PX.MODEL_YAWS), seed, parts:[...], decals:[...], dwellings:[{kind, role,
//   storeys}], role, ground ('earth' | 'cobble'), env, snow, flag}; the same spec, the same pixels. buildings: each building's kind,
//   role (home, inn, work, store, stable, worship, trade), storeys, plan rects and footprint (local px), area, floor (area x
//   storeys), windows and door; dwellings: those whose role is home.
//   parts (local px, the cell's middle at u = v = 0; a part's dw is its building, an index into spec.dwellings):
//     {k:'box', name, u:[u0,u1], v:[v0,v1], z:[z0,z1], wall, frame, foot, rail}: walls 'name.S' (the front, +v), N, E (+u), W
//     {k:'roof', on:boxName, form:'gable'|'hip'|'shed'|'flat'|'vault'|'leaf', axis:'u'|'v' (the ridge), rise, mat, o, ov (overhang
//       at the eaves and at the verges, steps), lip (px), finial, hi ('b1': a shed high at the front), parapet, merlons (flat), sweep,
//       curl, vmat (leaf)}
//     {k:'tower', name, c:[u,v], r (round) or w (square), z:[z0,z1], wall, roof:{form:'cone'|'pyramid'|'battlements'|'water'|'lid',
//       rise, mat}} (a round one with water is a well); {k:'chimney', at:[u,v], w, d, z:[z0,z1], mat}
//     {k:'fence', pts:[[u,v],...], gates:[[from,to,segment]], h, mat}: posts and rails, unoutlined; {k:'bed', u, v, topMat ('crop'
//       or 'water')}: on the ground layer; {k:'prop', type (PROP), at:[u,v], face (0-3)}
//   decals: {wall:'main.S', kind (DECAL), at (0-1 along the wall), z (px up it)}
// PX.modelCluster({cell, role, ground, seed, pieces:[{piece (PIECE: house, barn, shed, forge, stable, chapel, stall, fountain,
//   well, granary, mill, graves, yard), at:[u,v], face (0-3: front south, west, north, east), ...its options}], parts, decals}): a
//   cell of several small buildings, each built in its own plan and set down turned, as one spec.
// PX.modelSample(name, {yaw, seed, people}): the checkpoint's samples as specs (PX.MODEL_SAMPLES): shed, garden, cottage, house,
//   frost, desert (16), farmhouse, inn, chapel (32); the house plots (PX.MODEL_PLOTS, 32: row_a-row_d compact street plots, wall
//   to wall, yard_a and yard_b a hamlet's fenced yards; 'row' and 'yard' pick one by the seed); the clusters (PX.MODEL_CLUSTERS:
//   farmstead, smithy, inn_yard, chapel_yard, market, mill at 32, a town quarter at 64). people: the roofs by people (bold, the
//   same whoever holds the place: humans tile, thatch in the country; dwarves slate; elves leaf; orcs hide) over light walls.
// Stage 2 (buildmodels.js builds every building type from these parts): the result's groundKey (its ground's material), marks
//   (spec.marks, named plan points on the picture) and px (each pixel's face, (u, v), height, tone, decal); PX.modelSeason(m, kind,
//   amount): a season's overlay made from the model (PX.MODEL_SEASONS: snow), two layers over its img and ground, by thirds, cached
//   on the model; PX.modelKit, the pieces for the catalogue.
// Stage 3 (the owner's scale, a figure a tile tall): the gentler camera; decals at that scale (capitalised: Door, Door2, Win, WinS,
//   WinF, Lancet, Lancet2, Rose, Sign, Lamp, Cross, Bell, Rune, Slit, Hatch, Beams, Barn, Gate, Arch, Ivy, Logs, Goods, Crate, Hoop,
//   Flap, Cave, Adit, Forge, ForgeS), a decal on a roof's gable (decal.gable: a tent's flap); a vaulted roof (form 'vault': a hide
//   hall's, a wagon's, an elves' hall's); props scaled (p.s) and lifted (p.lift); spec.fitYaws: the fit's one scale for all those
//   facings (a building turned is the same building); thin parts keep their gaps (a wheel's spokes, sails, braces); each face its
//   building (f.dw); the result's buildings each with its dwellings (the households it holds, spec.dwellings[i].dwellings) and
//   households, their sum; the door the first one seen.
// W4: rough round parts (p.rough: crags, crowns), a cone's crown grassed (roof.moss), a cone's tip never a 1 px line, finials 2 px,
//   each pixel's material (px.m), the fit's facings judged on their pixels together and the scale kept for the plan.
// W5 (the elves, the owner's Sylvan Court): a roof form 'leaf' (a pointed arch over the walls, flared over the overhang to curled
//   eave tips, its ridge swept up to its ends, its verges of r.vmat, each slope a great leaf's veins) and a tower's leaf cone
//   (roof.leaf: the same arch round, its leaves in rows); materials moon (lavender), elfwood (pale living wood) and bark; decals
//   DoorLeaf (a pointed arch door), WinLeaf, WinRound (moon glass, a warm glint), LampLeaf (a lantern), Banner.
(function(PX){
  const NAVY='#1a1c26',R2=Math.SQRT2;
  const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
  /* materials: each a hue-shifted 4-tone ramp (PX.ramp, beasts.js: light toward warm, shade toward cool), lightest first */
  const BASE={shingle:'#86644a',daub:'#e2d6b8',timber:'#5e402c',plank:'#8f6c49',stone:'#aaa498',door:'#6e4c32',log:'#80603e',iron:'#5a5e66'};
  // (the roofs by people, bold enough to tell a settlement's people at a glance: humans' tile (warm orange-red) and thatch, dwarves'
  // slate (navy blue), elves' leaf (green-teal), orcs' hide (brown); walls light against them)
  const FIXED={tile:['#f28c52','#d65a32','#a63c2c','#6c2a2c'],thatch:['#f4c860','#d89e3c','#aa722e','#6e4a2a'],slate:['#6e94d4','#4a68aa','#344c82','#222f58'],
    leaf:['#72d4a8','#3ca888','#287c6a','#1c4e4c'],hide:['#c8945e','#9c6c40','#724c32','#4a3226'],whitewash:['#fcf8ee','#ebe4d2','#c6bca8','#90877e'],snow:['#fbfcff','#e0e8f2','#b4c2d8','#8494b6'],adobe:['#f6ead0','#e2cca2','#bc9c78','#8a6e5c'],mud:['#d2ae7a','#b48c60','#8e6c4c','#62503e'],
    water:['#7a9cb4','#4e7088','#34506a','#22344a'],soil:['#9a7650','#7c5c3e','#5e4430','#423226'],crop:['#b4cc6a','#86ac4c','#5e863c','#3e5e30'],
    glass:['#ffe0a0','#e8b860','#3a4258','#262c3c'],gold:['#ffdc6a','#d8a838','#a87828','#704c20'],moss:['#a8b85c','#7a9442','#567036','#3a4c2e'],
    flower:['#ff9aa0','#e8566a','#b03a52','#6e2a3e'],linen:['#f6f0e2','#dcd2bc','#b2a68e','#7c7466'],awning:['#f47e6e','#d04a40','#9c3438','#682830'],flame:['#fff0a0','#ffb040','#e86a2a','#a83a1a'],
    // (stage 2: natural rock, bone, a tree's crown (green, autumn), tent cloths, more awnings, ice)
    rock:['#c4beb0','#9c968a','#77726a','#524f4c'],sandrock:['#ecc890','#c89c66','#9a7048','#664a36'],bone:['#f6eed8','#d8ccae','#a89c82','#6e6658'],
    canopy:['#9ccc5a','#62a046','#3c7838','#26502e'],autumn:['#f6c45a','#dc8a34','#a85a2a','#6a3a26'],canvas:['#f2e8cc','#d4c4a0','#a8987a','#6e6656'],
    canvasR:['#ec8e72','#c4523e','#8e3634','#5a2630'],canvasB:['#92b4dc','#5a7cb0','#3e5682','#283656'],awningB:['#92c4ee','#4a86c8','#345e98','#243e66'],
    awningG:['#acd68a','#62a056','#3e7442','#284c34'],ice:['#ffffff','#d8ecfa','#a8c8e8','#7898c0'],darkrock:['#9c9c86','#76765e','#58584a','#3a3a32'],glow:['#f0feff','#9ae6f4','#4aaccc','#2a6a8a'],net:['#d2c6a6','#a0947a','#706656','#4a4236'],
    // (W4: a rope's light fibre, and the dark of a cave's mouth)
    rope:['#f4e4b4','#dcc488','#b09660','#76623e'],dark:['#3a3430','#2a2624','#1e1c1c','#141416'],
    // (W5: the elves' moon lavender, their pale living wood and its bark)
    moon:['#f0e6ff','#c6aaf2','#9070d0','#5c4498'],elfwood:['#f6f1e2','#ddd5be','#b3ab96','#7f7c74'],bark:['#a48e70','#7c6852','#5a4a3c','#3a3029']};
  // (the cultures' own materials, decal letters and decals: given to PX.registerBuildStyle (buildmodels.js PX.MODEL_EXTRA) before this
  // file loads, added after the built-in ones; a name already taken is an error)
  const extra=(k,into,...taken)=>{for(const [n,v] of Object.entries((PX.MODEL_EXTRA||{})[k]||{})){if([into,...taken].some(t=>t[n]))throw new Error('the '+k+' '+n+' is taken');into[n]=v}};
  extra('materials',FIXED,BASE);
  // (a culture's material that takes a built-in one's texture, its own colours kept: its walls coursed as stone, its roof tiled)
  const TEX=Object.assign({},(PX.MODEL_EXTRA||{}).textures);
  let RAMP=null;const ramps=()=>RAMP||(RAMP=Object.assign({},...Object.keys(BASE).map(k=>({[k]:PX.ramp(BASE[k]).map(hx)})),...Object.keys(FIXED).map(k=>({[k]:FIXED[k].map(hx)}))));
  PX.MODEL_MAT=Object.keys(BASE).concat(Object.keys(FIXED));const MATI=Object.fromEntries(PX.MODEL_MAT.map((k,i)=>[k,i]));
  // the light: from the upper left of the screen (west, a little north, high). Walls and roofs read it on their own scales: a wall
  // lit (west), in the half light (south), in shade (east); a roof slope lit (north, west), mid (south), shade (east)
  const L=(v=>{const l=Math.hypot(...v);return v.map(a=>a/l)})([-.6,-.35,.72]);
  const SUN=[.6,.15];// (a shadow falls this far right and down a px of height)
  const toneOf=(cls,s)=>cls==='wall'?(s>.4?0:s>-.45?1:2):cls==='floor'?1:(s>.6?0:s>.15?1:s>-.25?2:3);
  // (a roof is lit as if twice as steep: low roofs show more of their back slope, but their slopes still part in the light)
  const litN=f=>f.cls==='roof'?nrm([f.tn[0]*2,f.tn[1]*2,f.tn[2]]):f.tn;
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],nrm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];

  /* the camera's pitch (stage 3, the owner's gentler one): the ground's depth shows at this share of its length (a px of plan
     toward or away from the camera, half a px on screen), its heights whole, so a building's walls fill about 40% of its front view
     (with buildmodels.js's storeys and roofs, PX.MODEL_RULE). The world is drawn squashed in depth by it and then seen as before (a
     point (x, g) at height z at (x, g*depth - z)): the hidden faces stay right, the light reads each face's true slope (f.tn) */
  const CAM={depth:.5};PX.MODEL_CAMERA=CAM;
  /* the turned grid: local (u, v) in px, scaled by the fit (sc.u, sc.v), snap to steps; a step is 1 px (straight) or 1 across and
     1 down (diagonal); heights by sc.z, overhangs by sc.o; the world's depth by the camera */
  function grid(yaw,sc){const d=yaw&1,th=yaw*Math.PI/4,c=Math.round(Math.cos(th)*(d?R2:1)),s=Math.round(Math.sin(th)*(d?R2:1)),k=d?1/R2:1,K=CAM.depth;
    return{d,K,step:d?R2:1,sc,U:u=>Math.round(u*k*sc.u),V:v=>Math.round(v*k*sc.v),Z:z=>Math.round(z*sc.z),W:(U,V,z)=>[c*U-s*V,(s*U+c*V)*K,z],dir:(dU,dV)=>nrm([c*dU-s*dV,(s*dU+c*dV)*K,0])}}

  /* faces: a flat convex polygon (world points), its outward normal, its material and class (wall, roof, lip, floor, top), its
     texture frame (O, eu, ev; u in steps along it, v in px up it), a name (a wall's), its decals */
  function face(F,pts,o){let n=nrm(cross(sub(pts[1],pts[0]),sub(pts[2],pts[0])));if(o.out&&dot(n,o.out)<0)n=n.map(a=>-a);
    F.push(Object.assign({prio:0,dec:[]},o,{P:pts,n,tn:nrm([n[0],n[1]*CAM.depth,n[2]]),c:dot(n,pts[0]),vis:n[1]+n[2]}))}
  // a wall quad along the plan's edge (U0,V0)-(U1,V1) from z0 to z1, its outside toward out, u from its start
  function wall(F,G,U0,V0,U1,V1,z0,z1,o){const a=G.W(U0,V0,z0),b=G.W(U1,V1,z0),e=nrm(sub(b,a));
    face(F,[a,b,G.W(U1,V1,z1),G.W(U0,V0,z1)],Object.assign({cls:'wall',O:a,eu:e,su:1/G.step,ev:[0,0,1],fw:Math.hypot(b[0]-a[0],b[1]-a[1])/G.step,fh:z1-z0},o))}// (its length as drawn: a wall running in depth is shortened by the camera)
  // a box: its four walls (named S, N, E, W) and, unless roofed, its top
  function box(F,G,p,B){const {U0,U1,V0,V1,Z0,Z1}=B,o=(side,out)=>({mat:p.wall,name:p.name+'.'+side,frame:p.frame,foot:p.foot,rail:p.rail,out:G.dir(...out),hz:Z1-Z0,part:p.name,flat:p.flat,cap:p.cap,fine:p.thin||p.fine||U1-U0<=1||V1-V0<=1});
    wall(F,G,U0,V1,U1,V1,Z0,Z1,o('S',[0,1]));wall(F,G,U1,V0,U0,V0,Z0,Z1,o('N',[0,-1]));wall(F,G,U1,V1,U1,V0,Z0,Z1,o('E',[1,0]));wall(F,G,U0,V0,U0,V1,Z0,Z1,o('W',[-1,0]));
    if(p.top)face(F,[G.W(U0,V0,Z1),G.W(U1,V0,Z1),G.W(U1,V1,Z1),G.W(U0,V1,Z1)],{cls:p.topCls||'top',mat:p.topMat||p.wall,out:[0,0,1],O:G.W(U0,V1,Z1),eu:G.dir(1,0),su:1/G.step,ev:G.dir(0,-1),fw:U1-U0,fh:V1-V0,part:p.name,flat:p.flat,fine:p.thin||p.fine||U1-U0<=1||V1-V0<=1})}
  // a roof over a box's plan B: the ridge along a (u or v), across b; o its overhang at the eaves and ov at the verges (steps: 0
  // where a house shares its wall with the next), e its lip (px), R its rise
  function roof(F,G,r,B,bp){
    const au=(r.axis||'u')==='u',[A0,A1,B0,B1]=au?[B.U0,B.U1,B.V0,B.V1]:[B.V0,B.V1,B.U0,B.U1],P=au?(a,b,z)=>G.W(a,b,z):(a,b,z)=>G.W(b,a,z);
    const D=(da,db)=>au?G.dir(da,db):G.dir(db,da),o=Math.round((r.o==null?1:r.o)*G.sc.o),ov=r.ov==null?o:Math.round(r.ov*G.sc.o),e=r.lip==null?1:r.lip,zt=B.Z1,R=G.Z(r.rise||4),m=r.mat,Bm=(B0+B1)/2,sd={mat:m,part:bp.name,rf:r};
    const name=side=>bp.name+'.'+(au?{a0:'W',a1:'E',b0:'N',b1:'S'}:{a0:'N',a1:'S',b0:'W',b1:'E'})[side],wallOf=side=>F.find(f=>f.name===name(side)&&!f.gable)||{mat:bp.wall,cls:'wall',name:name(side)};
    const slope=(pts,out,O,eu)=>face(F,pts,Object.assign({cls:'roof',out,O,eu:nrm(sub(eu,O)),su:1/G.step,ev:null,prio:2},sd));
    const lip=(a,b,out)=>e&&face(F,[sub(a,[0,0,e]),sub(b,[0,0,e]),b,a],Object.assign({cls:'lip',out,O:a,eu:nrm(sub(b,a)),su:1/G.step,ev:[0,0,1],prio:3},sd));
    const gableEnd=(a,side)=>face(F,[P(a,B0,zt),P(a,B1,zt),P(a,Bm,zt+R)],Object.assign({},wallOf(side),{out:D(side==='a0'?-1:1,0),gable:true}));
    const up=(da,db)=>{const h=D(da,db);return[h[0],h[1],1]};
    // (its walls darker in a band under the eaves, where the lip shades them)
    if(r.form!=='flat')for(const f of F)if(f.part===bp.name&&f.cls==='wall'&&!f.gable&&!(r.form==='leaf'&&(f.name===name('a0')||f.name===name('a1'))))f.ae=f.hz-Math.max(1,Math.min(3,o+e));
    if(r.form==='flat'){const t=Math.min(A1-A0,B1-B0)<6?0:r.parapet||0;// (too small for a parapet to leave a roof inside it: none)
      face(F,[P(A0,B0,zt),P(A1,B0,zt),P(A1,B1,zt),P(A0,B1,zt)],Object.assign({},sd,{cls:'floor',out:[0,0,1],O:P(A0,B1,zt),eu:D(1,0),su:1/G.step,ev:D(0,-1),fw:A1-A0,fh:B1-B0,mat:r.mat||bp.wall}));
      if(t){const pz=G.Z(t)||1,pm=r.pmat||bp.wall,q=(a0,a1,b0,b1)=>au?{U0:a0,U1:a1,V0:b0,V1:b1}:{U0:b0,U1:b1,V0:a0,V1:a1};
        const pb=(a0,a1,b0,b1)=>{if(!r.merlons)return box(F,G,{name:bp.name+'.par',wall:pm,top:true},Object.assign(q(a0,a1,b0,b1),{Z0:zt,Z1:zt+pz}));
          box(F,G,{name:bp.name+'.par',wall:pm,top:true},Object.assign(q(a0,a1,b0,b1),{Z0:zt,Z1:zt+pz-1}));// the parapet, then its merlons
          const along=a1-a0>=b1-b0;for(let k=along?a0:b0;k<(along?a1:b1);k+=2)box(F,G,{name:bp.name+'.mer',wall:pm,top:true},Object.assign(along?q(k,Math.min(k+1,a1),b0,b1):q(a0,a1,k,Math.min(k+1,b1)),{Z0:zt+pz-1,Z1:zt+pz}))};
        pb(A0,A1,B1-1,B1);pb(A0,A1,B0,B0+1);pb(A0,A0+1,B0+1,B1-1);pb(A1-1,A1,B0+1,B1-1)}
      return}
    if(r.form==='shed'){// one slope, high at the back (b0; r.hi 'b1': at the front)
      const hb=r.hi==='b1',Bl=hb?B0:B1,Bh=hb?B1:B0,sg=hb?-1:1,s0=P(A0-ov,Bl+sg*o,zt),s1=P(A1+ov,Bl+sg*o,zt),Rb=Math.round(R*(B1-B0+o)/(B1-B0+2*o));
      slope([s0,s1,P(A1+ov,Bh-sg*o,zt+R),P(A0-ov,Bh-sg*o,zt+R)],up(0,sg),s0,s1);lip(s0,s1,D(0,sg));
      face(F,[P(A0,Bh,zt),P(A1,Bh,zt),P(A1,Bh,zt+Rb),P(A0,Bh,zt+Rb)],Object.assign({},wallOf(hb?'b1':'b0'),{out:D(0,-sg),gable:true}));
      for(const [a,s] of [[A0,'a0'],[A1,'a1']])face(F,[P(a,Bl,zt),P(a,Bh,zt),P(a,Bh,zt+Rb)],Object.assign({},wallOf(s),{out:D(s==='a0'?-1:1,0),gable:true}));
      return}
    if(r.form==='vault'){// a barrel roof (stage 3: a hide hall's, a yurt-like wagon's, an elves' hall's): facets round a half ellipse from
      // the front eave over to the back one, its ends closed by its walls' arched gables
      // (a facet's texture from its lower edge up, as a slope's)
      const n=6,arc=(i,a,w,h)=>{const t=Math.PI*i/n;return P(a,Bm+w*Math.cos(t),zt+h*Math.sin(t))},W=B1+o-Bm,h=D(0,1);
      for(let i=0;i<n;i++){const tm=Math.PI*(i+.5)/n,lo=i<n/2?i:i+1;
        slope([arc(i,A0-ov,W,R),arc(i,A1+ov,W,R),arc(i+1,A1+ov,W,R),arc(i+1,A0-ov,W,R)],[h[0]*Math.cos(tm),h[1]*Math.cos(tm),Math.sin(tm)],arc(lo,A0-ov,W,R),arc(lo,A1+ov,W,R))}
      lip(P(A0-ov,B1+o,zt),P(A1+ov,B1+o,zt),D(0,1));
      for(const [a,s] of [[A0,'a0'],[A1,'a1']]){const w=(B1-B0)/2,hh=R*w/W;face(F,Array.from({length:n+1},(_,i)=>arc(i,a,w,hh)),Object.assign({},wallOf(s),{out:D(s==='a0'?-1:1,0),gable:true}))}
      return}
    if(r.form==='leaf'){// (W5: the elves' leaf roof) across, a pointed arch over the walls, flaring flatter over the overhang to the
      // eaves, their tips curled out and up (r.curl; an edge, cls lip); along, its ridge swept up toward its ends (r.sweep px; less down
      // its slopes, the eaves level: each facet two triangles); its gable walls up to the arch, its long walls closed up to it, a verge
      // along the arch at each end (r.vmat: a board of that). Its facets keep their texture in step (uo along and ul its length, vo up
      // from the eave; arc the eave to the ridge)
      const m=6,hw=(B1-B0)/2,S=G.Z(r.sweep==null?2:r.sweep),Am=(A0+A1)/2,La=(A1-A0)/2+ov,sw=a=>S*((a-Am)/La)*((a-Am)/La),pt=(a,[b,h])=>P(a,Bm+b,zt+h+sw(a)*h/R);
      const half=leafArch(R,hw,hw+o,r.curl==null?1:r.curl),pr=half.slice(1).reverse().map(([b,h])=>[-b,h]).concat(half),r0=half.length-1,N=pr.length-1,h1=half[LEAF_N][1];
      const as=Array.from({length:m+1},(_,k)=>A0-ov+(A1-A0+2*ov)*k/m),dst=(p,q)=>Math.hypot(...sub(p,q)),L=pr.map((q,j)=>j?dst(pt(Am,q),pt(Am,pr[j-1])):0),sum=(i,j)=>L.slice(i,j).reduce((x,y)=>x+y,0);
      const arc=sum(2,r0+1),up=j=>j<r0?sum(2,j+1):sum(j+2,N);
      for(let j=0;j<N;j++){let uo=0;const lo=j<r0?pr[j]:pr[j+1],ul=as.slice(1).reduce((x,a,k)=>x+dst(pt(a,lo),pt(as[k],lo)),0)/G.step;for(let k=0;k<m;k++){const O=pt(as[k],lo),E=pt(as[k+1],lo),pts=[pt(as[k],pr[j]),pt(as[k+1],pr[j]),pt(as[k+1],pr[j+1]),pt(as[k],pr[j+1])];
        const fo=j===0||j===N-1?Object.assign({cls:'lip',out:[0,0,1],O,eu:nrm(sub(E,O)),su:1/G.step,ev:[0,0,1],prio:3},sd):Object.assign({cls:'roof',out:[0,0,1],O,eu:nrm(sub(E,O)),su:1/G.step,ev:null,prio:2,uo,ul,vo:up(j),arc,ridge:j===r0-1||j===r0},sd);
        face(F,[pts[0],pts[1],pts[2]],fo);face(F,[pts[0],pts[2],pts[3]],fo);uo+=dst(E,O)/G.step}}
      for(let k=0;k<m;k++){lip(pt(as[k],pr[0]),pt(as[k+1],pr[0]),D(0,-1));lip(pt(as[k],pr[N]),pt(as[k+1],pr[N]),D(0,1))}
      // (the verges: the roof's own edge, or a board of r.vmat along the arch: the elves' moon lavender)
      for(const [a,s] of [[as[0],-1],[as[m],1]])for(let j=0;j<N;j++){const lo=pt(a,pr[j]),hi=pt(a,pr[j+1]);
        face(F,[sub(lo,[0,0,e||1]),sub(hi,[0,0,e||1]),hi,lo],Object.assign({cls:'lip',out:D(s,0),O:lo,eu:nrm(sub(hi,lo)),su:1,ev:[0,0,1],prio:3},sd,r.vmat?{cls:'wall',mat:r.vmat,fine:true,fw:1,fh:1}:{}))}
      // (the gable walls up to the arch; the long walls closed up to the roof over the overhang)
      for(const [a,s] of [[A0,'a0'],[A1,'a1']]){const g=[P(a,B0,zt),P(a,B1,zt),...pr.filter(q=>Math.abs(q[0])<=hw+.01).reverse().map(q=>pt(a,q))];
        face(F,g.filter((q,i)=>!i||dst(q,g[i-1])>.01),Object.assign({},wallOf(s),{out:D(s==='a0'?-1:1,0),gable:true}))}
      const aw=[A0,...as.filter(a=>a>A0+.01&&a<A1-.01),A1];
      for(const [b,s] of [[-hw,'b0'],[hw,'b1']])for(let k=0;k+1<aw.length;k++)face(F,[P(aw[k],Bm+b,zt),P(aw[k+1],Bm+b,zt),pt(aw[k+1],[b,h1]),pt(aw[k],[b,h1])],
        Object.assign({},wallOf(s),{out:D(0,s==='b0'?-1:1),gable:true}));
      return}
    const hip=r.form==='hip',ins=hip?Math.min((B1-B0)/2+o,(A1-A0)/2+o):0;
    // the two long slopes (b1 toward the front, b0 away), the ends (gable walls or hips), the lips along every edge
    const f0=P(A0-ov,B1+o,zt),f1=P(A1+ov,B1+o,zt),k0=P(A1+ov,B0-o,zt),k1=P(A0-ov,B0-o,zt),r0=P(A0-ov+ins,Bm,zt+R),r1=P(A1+ov-ins,Bm,zt+R);
    slope([f0,f1,r1,r0],up(0,1),f0,f1);slope([k0,k1,r0,r1],up(0,-1),k0,k1);lip(f0,f1,D(0,1));lip(k0,k1,D(0,-1));
    if(hip){slope([k1,f0,r0],up(-1,0),k1,f0);slope([f1,k0,r1],up(1,0),f1,k0);lip(k1,f0,D(-1,0));lip(f1,k0,D(1,0))}
    else{gableEnd(A0,'a0');gableEnd(A1,'a1');
      // a finial at each end of the ridge (2 px square: a carved post's head, never a 1 px stick)
      if(r.finial)for(const a of [A0-ov,A1+ov-2]){const bm=Math.round(Bm)-1,q=au?{U0:a,U1:a+2,V0:bm,V1:bm+2}:{U0:bm,U1:bm+2,V0:a,V1:a+2};box(F,G,{name:bp.name+'.fin',wall:r.fmat||'timber',top:true},Object.assign(q,{Z0:zt+R-1,Z1:zt+R+2}))}
      // the verges: the roof's edge along each gable, a board as thick as its lip
      if(e)for(const [a,s] of [[A0-ov,-1],[A1+ov,1]])for(const bb of [B1+o,B0-o]){const lo=P(a,bb,zt),hi=P(a,Bm,zt+R);
        face(F,[sub(lo,[0,0,e]),sub(hi,[0,0,e]),hi,lo],Object.assign({cls:'lip',out:D(s,0),O:lo,eu:nrm(sub(hi,lo)),su:1,ev:[0,0,1],prio:3},sd))}}
  }
  // (W5) the leaf roof's profile (a ridge's or a cone's), from its ridge (b 0, height R) out: a pointed arch over the walls (to hw; a
  // little full), then flatter over the overhang to the eave (W, height 0), its tip curled out and up by cu: [[b, h], ...]; LEAF_N
  // facets over the walls
  const LEAF_N=3,leafArch=(R,hw,W,cu)=>{const h1=W>hw+.01?Math.min(R*.25,(W-hw)*.7):0,out=[];
    for(let i=0;i<=LEAF_N;i++){const t=i/LEAF_N;out.push([hw*t,h1+(R-h1)*(.85*(1-t)+.15*(1-t*t))])}if(h1)out.push([W,0]);out.push([W+cu,cu]);return out};
  // a round tower (facets) or a square one, and its roof: a cone, a pyramid or battlements
  function tower(F,G,p){const [cu,cv]=p.c,Z0=G.Z(p.z[0]),Z1=G.Z(p.z[1]),rf=p.roof||{},R=G.Z(rf.rise||0);
    if(!p.round){const h=p.w/2,B={U0:G.U(cu-h),U1:G.U(cu+h),V0:G.V(cv-h),V1:G.V(cv+h),Z0,Z1};box(F,G,Object.assign({},p,{top:rf.form==='battlements'}),B);
      if(rf.form==='battlements')roof(F,G,{form:'flat',parapet:2,merlons:true,mat:p.wall},B,p);else roof(F,G,{form:'hip',rise:rf.rise,mat:rf.mat,o:rf.o==null?1:rf.o,lip:1},B,p);return}
    // (its ring in depth by the camera; a big one more facets; p.rough (0-1, W4): a crag or a crown, its ring's radius and its apex
    // knocked about by the part's name and p.rs, so a rock is lumpy and faceted, never a smooth dome)
    const c=G.W(G.U(cu),G.V(cv),0),cx=c[0],cy=c[1],r=p.r*Math.min(G.sc.u,G.sc.v),n=p.rough?(p.r>6?14:10):p.r>5?24:16,hn=[...p.name].reduce((a,ch)=>a*31+ch.charCodeAt(0)|0,p.rs|0),
      jr=i=>p.rough?1+p.rough*(H(i%n,hn,7)-.5)*.9:1,ring=(rr,z)=>Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2+(p.rough?(H(i,hn,8)-.5)*.5:0),k=jr(i);return[cx+Math.cos(a)*rr*k,cy+Math.sin(a)*rr*k*G.K,z]});
    const lo=ring(r,Z0),hi=ring(r,Z1),ch=2*Math.PI*r/n;
    for(let i=0;i<n;i++){const j=(i+1)%n,a=lo[i],b=lo[j],m=nrm([(a[0]+b[0])/2-cx,(a[1]+b[1])/2-cy,0]);face(F,[a,b,hi[j],hi[i]],{cls:'wall',mat:p.wall,name:p.name+'.'+i,out:m,O:a,eu:nrm(sub(b,a)),su:1,ev:[0,0,1],fw:ch,fh:Z1-Z0,uo:i*ch,hz:Z1-Z0,part:p.name,round:true})}
    if(rf.form==='water'||rf.form==='lid')face(F,hi.slice().reverse(),{cls:'top',mat:rf.form==='water'?'water':rf.mat,out:[0,0,1],O:hi[0],eu:[1,0,0],su:1,ev:[0,-1,0],part:p.name});// (a well: dark water in its ring; a barrel's lid)
    if(rf.form==='cone'&&rf.leaf){// (W5: an elves' leaf cone) rings up the leaf roof's arch to its tip, the eave's tips curled out and up
      // (a lip), its shingles in step from ring to ring (uo, vo, arc as the leaf roof's)
      const rg=leafArch(R,r,r+(rf.o==null?1:rf.o)*G.sc.o,rf.curl==null?1:rf.curl).reverse(),k=rg.length-1,at=([d,h],i)=>{const a=i/n*Math.PI*2;return[cx+Math.cos(a)*d,cy+Math.sin(a)*d*G.K,Z1+h]};
      const L=rg.map((q,j)=>j?Math.hypot(q[0]-rg[j-1][0],q[1]-rg[j-1][1]):0),arc=L.slice(2).reduce((x,y)=>x+y,0);
      for(let j=0;j<k;j++){const vo=L.slice(2,j+1).reduce((x,y)=>x+y,0),ch=2*Math.PI*rg[j][0]/n;
        for(let i=0;i<n;i++){const a=at(rg[j],i),b=at(rg[j],i+1),pts=j===k-1?[a,b,at(rg[k],0)]:[a,b,at(rg[j+1],i+1),at(rg[j+1],i)];
          if(!j){face(F,pts,{cls:'lip',mat:rf.mat,out:[0,0,1],O:a,eu:nrm(sub(b,a)),su:1,ev:[0,0,1],prio:3,rf,part:p.name});if(rf.lip!==0)face(F,[sub(a,[0,0,1]),sub(b,[0,0,1]),b,a],{cls:'lip',mat:rf.mat,out:nrm([(a[0]+b[0])/2-cx,(a[1]+b[1])/2-cy,0]),O:a,eu:nrm(sub(b,a)),su:1,ev:[0,0,1],prio:3,rf,part:p.name})}
          else face(F,pts,{cls:'roof',mat:rf.mat,out:[0,0,1],O:a,eu:nrm(sub(b,a)),su:1,ev:null,prio:2,rf,part:p.name,uo:i*ch,vo,arc,ridge:j===k-1})}}}
    else if(rf.form==='cone'){const rr=r+(rf.o==null?1:rf.o)*G.sc.o,base=ring(rr,Z1),ap=p.rough?[cx+(H(1,hn,9)-.5)*r*.5,cy+(H(2,hn,9)-.5)*r*.4*G.K,Z1+R*(.85+.3*H(3,hn,9))]:[cx,cy,Z1+R];
      for(let i=0;i<n;i++){const j=(i+1)%n,a=base[i],b=base[j],m=nrm([(a[0]+b[0])/2-cx,(a[1]+b[1])/2-cy,rr/Math.max(1,R)]);
        face(F,[a,b,ap],{cls:'roof',mat:rf.mat,out:m,O:a,eu:nrm(sub(b,a)),su:1,ev:null,prio:2,rf,part:p.name});if(rf.lip!==0)face(F,[sub(a,[0,0,1]),sub(b,[0,0,1]),b,a],{cls:'lip',mat:rf.mat,out:[m[0],m[1],0],O:a,eu:nrm(sub(b,a)),su:1,ev:[0,0,1],prio:3,rf,part:p.name})}}
  }

  /* textures: the material and tone (0 lit .. 3 deep) a face shows at (u, v), from its tone by the light b. Every surface has its
     courses and a little 2-tone speckle inside them (never a flat fill), within its 4-tone ramp */
  const H=PX.hash,cl=t=>t<0?0:t>3?3:t;
  function texel(f,u,v,b,sd){const m=f.mat,iu=Math.floor(u),iv=Math.floor(v),h=H(iu,iv,sd+f.sd),sp=h<.07?1:h>.96?-1:0;
    if(f.cls==='lip'){const lit=f.n[0]<-.3?-1:0;// (the sun side's edge caught by the light)
      return m==='thatch'?[m,cl(b+1+lit+(iu%3===0&&iv<1?1:0))]:m==='shingle'?['timber',cl(b+1+lit)]:[m,cl(3+lit)]}
    if(f.cls==='roof'){const top=f.fh-v;// (v up the slope from the eave; top: how far below the ridge)
      // (W5: a leaf roof, from its eave up: each slope one great leaf, its midrib down its middle and its veins in chevrons from it, light
      // on the blade (a ridge's facets, f.ul their length along it); a cone's leaves laid in staggered rows, each 4 x 3, dark between
      // their tips, lit at their middles; moss low down here and there)
      if(f.vo!=null&&m==='leaf'){if(v<f.arc*.45&&H(iu>>1,iv>>1,sd+29+f.sd)<.05)return['moss',cl(b+(h<.5?0:1))];
        if(f.ul){const du=Math.abs(u-f.ul/2);return[m,du<.5||Math.floor(v+du*.6)%4===0?Math.max(0,b-1):cl(b+(b?0:1)+(h<.08?1:0))]}
        const r=Math.floor(v/3),x=((iu+(r%2)*2)%4+4)%4,y=iv-r*3;return[m,cl(b+(y===0&&(x===0||x===3)?1:0)-(y===1&&(x===1||x===2)&&b>0?1:0))]}
      if(top<1&&f.rf.form!=='shed'&&f.rf.form!=='cone'&&f.rf.form!=='vault'&&f.rf.form!=='leaf')return m==='thatch'?[m,cl(b+1-(iu%4===0?1:0))]:[m,b?(iu%2?0:1):2];// the ridge's cap (a bound ridge on thatch)
      if(m==='thatch'&&top<2&&f.rf.form!=='cone'&&f.rf.form!=='vault'&&f.rf.form!=='leaf')return[m,cl(b+(iu%4===0?0:1))];
      if(f.rf.moss&&top+(H(iu,0,sd+17)-.5)*2.5<f.fh*f.rf.moss)return['moss',cl(b+(h<.3?1:0)-(h>.9&&b>0?1:0))];// (a crag's grassy crown, its edge ragged)
      if(H(iu>>1,iv>>1,sd+31+f.sd)<(m==='thatch'||m==='shingle'?.03:.012)&&v<f.fh*.6&&m!=='awning'&&m!=='sandrock')return['moss',cl(b+(h<.5?0:1))];// moss and worn patches, low on the slope
      if(H(iu,iv,sd+41+f.sd)<.012)return[m,3];// a tile slipped (each face its own: a cone's facets never all at once)
      switch(TEX[m]||m){
        case 'tile':{const c=Math.floor(v/2);return iv%2===0?[m,cl(b+1+(((iu>>1)+c)%2&&iu%2?1:0))]:[m,cl(b+sp)]}// courses: their lower edges scalloped
        case 'thatch':{const st=H(iu,Math.floor(v/5),sd)<.2?1:0;return[m,cl(b+st+(iv%3===0&&H(iu,iv>>1,sd+2)<.5?1:0)-(h>.92?1:0))]}// strands
        case 'slate':{const c=Math.floor(v/2),j=(iu+(c%2)*2)%3===0,pl=H((iu+(c%2)*2)/3|0,c,sd+3);return[m,cl(b+(iv%2===0?1:0)+(iv%2&&j?1:0)+(pl<.15?1:pl>.9?-1:0))]}// staggered plates
        case 'shingle':{const c=Math.floor(v/2);return[m,cl(b+(iv%2===0?1:0)+(iv%2&&(iu+c*3)%2===0&&H(iu,c,sd)<.6?1:0)+sp)]}
        case 'leaf':{const c=Math.floor(v/2);return[m,cl(b+(iv%2===0&&(iu+c)%3===0?1:0)+sp)]}// leaves laid like scales
        case 'hide':{return[m,cl(b+((iu%5===0&&iv%2)||iv%4===0&&iu%2?1:0)+(H(iu>>1,iv>>1,sd+9)<.15?1:0))]}// stitched hides
        case 'awning':case 'awningB':case 'awningG':return[(iu>>1)%2?'linen':m,cl(b+(iv%2===0?1:0))];// striped cloth
        case 'canopy':case 'autumn':{const k=H(iu>>1,iv>>1,sd+13);return[m,cl(b+(k<.3?1:0)-(k>.88&&b>0?1:0)+(iv%3===0&&iu%2?1:0))]}// leafy clumps
        case 'rock':case 'sandrock':case 'darkrock':{const c=H(iu>>1,iv>>1,sd),k=H(iu>>2,(iv+1)>>2,sd+1);return[m,cl(b+(c<.2?1:0)+(k>.84?1:0)-(c>.93&&b>0?1:0))]}// a rock's blocks and cracks
        case 'canvas':case 'canvasR':case 'canvasB':return[m,cl(b+(iu%5===0?1:0)+sp)];// a tent's seams
        default:return[m,cl(b+sp)]}}
    if(f.cls==='floor')return[m,cl(b+sp+(H(iu>>1,iv>>1,sd+4)<.1?1:0))];
    if(f.cls==='top'){if(m==='iron')return[m,3];if(m==='ember')return h<.25?['flame',2]:['iron',h<.6?3:2];// (a fire's ash and embers: the game's flame stands over it)
      if(m==='crop')return iv%2?['soil',cl(b+1)]:[m,cl(b+(h<.2?1:0))];if(m==='logend')return['log',(iu+iv)%2?0:2];
      if(m==='water')return[m,h<.08?0:1];return[m,cl(b-1+sp)]}
    // walls: the chimney's cap, the band of shade under the eaves, the footing, weathering at the foot, the frame, the wall's courses
    if(f.cap&&v>=f.hz-1)return[m,0];
    if(f.ae!=null&&v>=f.ae&&!f.gable)return[f.frame&&(u<1||u>=f.fw-1)?f.frame:m,cl(b+1)];
    if(f.foot&&v<1)return[f.foot,cl(b+1+(iu%3===0?1:0))];
    const wx=v<2&&H(iu,iv,sd+6)<.22?1:0;// (weathering at the foot)
    if(f.frame&&!f.gable){const w=f.fw,P=w>=9&&f.hz>=7?Math.max(4,Math.round(w/Math.round(w/5))):99,rail=f.hz>=8?Math.floor(f.hz/2):-1,pu=u-Math.floor(u/P)*P;
      if(u<1||u>=w-1||(P<99&&pu<1&&u<w-2)||iv===rail)return[f.frame,b];// posts and the cross-beam
      if(rail>0&&f.hz>=14&&iv<rail&&P<99&&(u<P&&Math.floor(u)===iv+1||u>w-P&&Math.floor(w-1-u)===iv+1))return[f.frame,cl(b+1)]}// braces
    if(f.frame&&f.gable&&Math.abs(u-f.fw/2)<.5)return[f.frame,b];
    switch(TEX[m]||m){
      case 'stone':{const row=Math.floor(v/3),mort=iv%3===2,j=(iu+(row%2)*2)%5===4,q=u<2||u>=f.fw-2;
        if(q&&!f.round)return[m,mort?cl(b+1):row%2?0:cl(b-1)];return[m,cl(b+(mort||j?1:0)+(!mort&&H((iu+(row%2)*2)/5|0,row,sd+7)<.25?1:0)+wx)]}// courses, quoins
      case 'plank':return[m,cl(b+(iu%3===2?1:0)+(h<.05?1:0)+wx)];
      case 'log':return[m,cl(b+(iv%2===1?1:0)-((u<1||u>=f.fw-1)&&iv%2===0?1:0))];
      case 'adobe':return[m,cl(b+(v<1?1:0)+sp+wx)];
      case 'rock':case 'sandrock':case 'darkrock':{const c=H(iu>>1,iv>>1,sd);return[m,cl(b+(c<.2?1:0)+(H(iu>>2,iv>>2,sd+1)>.85?1:0))]}
      case 'bone':return[m,cl(b+(iv%3===0?1:0))];
      case 'net':return[m,cl(b+((iu+iv)%2?2:0))];
      case 'elfwood':return[m,cl(b+(iu%3===1&&H(iu,iv>>2,sd+8)<.75?1:0)+(h<.03?1:0)+wx)];// (W5: living wood, its grain running up it)
      case 'bark':return[m,cl(b+(iu%2&&H(iu,iv>>1,sd+8)<.7?1:0)-(h>.94&&b>0?1:0))];
      case 'stakes':return['log',cl(b+(iu%2?1:0)-(v>=f.hz-1&&iu%2===0?1:0))];// a palisade's stakes, their points lit
      default:return[m,cl(b+sp+wx)]}
  }
  /* decals: tiny pictures on a wall, rows top to bottom; '.' shows the wall. t frame (timber), l lintel (stone), p a step, d e door
     (lit, shade), k latch, g G glass (pane, glint), s shutter, b board, y gold, r flowers, c greens, o O the forge's glow, # its dark
     mouth, w the mill-wheel */
  const DECAL={door:['ttt','tet','tdk','ppp'],doorL:['tttt','teet','tdet','tdkt','pppp'],door3:['ttttt','teeet','tdedt','tdekt','ppppp'],
    win:['ll','Gg','gg'],shut:['.ll.','sGgs','sggs'],winF:['.ll.','sGgs','sggs','rcrc'],lancet:['l','g','G','g'],
    sign:['ttt.','.yby','.bbb'],lamp:['t','y'],beams:['t.t.t.t'],goods:['rycr','bbbb'],
    barn:['tttttt','tdeedt','teddet','tdeedt','teddet','pppppp'],stall:['tttt','t##t','t##t','tddt'],forge:['tttttt','t####t','t#oo#t','tOOOOt','pppppp'],
    wheel:['..www..','.w.w.w.','w..w..w','wwwwwww','w..w..w','.w.w.w.','..www..'],
    // (stage 2: an arrow slit, a rose window, a gate's portcullis, a mine's timbered adit, a dwarf's rune door, an open arch, ivy, a
    // ladder, a small wheel, a shuttered hatch)
    slit:['h','h','h'],rose:['.ll.','lGgl','lggl','.ll.'],gate:['.tttttt.','tiiiiiit','tihihiht','tihihiht','tihihiht','tihihiht'],
    adit:['tttttt','th##ht','t####t','t####t'],rune:['tttt','tyyt','tdet','tdkt','pppp'],arch:['.ll.','l##l','l##l','l##l'],
    ivy:['v.v','vvv','.vv','v.v','.v.'],ladder:['t.t','ttt','t.t','ttt','t.t','ttt','t.t'],wheel5:['.www.','w.w.w','wwwww','w.w.w','.www.'],hatch:['ttt','tbt','ttt']};
  const DCOL={t:['timber',2],l:['stone',0],p:['stone',1],d:['door',1],e:['door',2],k:['gold',0],g:['glass',3],G:['glass',2],s:['door',1],b:['plank',1],y:['gold',1],
    r:['flower',1],c:['crop',1],o:['flame',1],O:['flame',0],'#':['iron',3],w:['timber',1],h:['iron',3],i:['iron',1],v:['canopy',2],n:['canvas',2],L:['log',0],M:['log',2],D:['dark',2],X:['dark',0],
    // (W5: moon glass and its light, a warm glow, the elves' bark frames)
    m:['moon',2],j:['moon',0],q:['moon',3],a:['glass',1],u:['bark',2]};
  /* stage 3's decals, at the owner's scale (a figure a tile tall, the smallest building 32 px; capitalised): a door 5 x 8 on its step,
     a double door, windows 4 x 5 under a lintel (shutters, a flower box), lancets, a rose, a hanging sign and a lantern, a holy cross,
     a belfry's bell, a rune door, a slit, a hatch, beam ends, a barn's braced doors, a castle's gate and an open arch, ivy, log ends,
     goods, a crate's brace, a barrel's hoop, a tent's flap, a cave's mouth, a mine's adit, a forge's open front and glow */
  const gen=(w,h,f)=>Array.from({length:h},(_,r)=>Array.from({length:w},(_,c)=>f(c,r)).join(''));
  const barnDoors=(w,h)=>gen(w,h,(c,r)=>{const m=w>>1,y=h-2-r;if(r===h-1)return'p';if(r===0||c===0||c===w-1||c===m||r===h>>1)return't';const lc=c<m?c-1:w-2-c;return lc===Math.round(y*(m-2)/(h-3))?'t':lc%2?'e':'d'});
  const archOf=(w,h,bars)=>{const cx=(w-1)/2,R=w/2-.5;return gen(w,h,(c,r)=>{const d=Math.hypot(c-cx,r<R?R-r:0);if(d>R+.01)return'.';if(d>R-1.01||c===0||c===w-1)return'l';return bars&&(c%3===1||r%3===1)?'i':'#'})};
  const FORGE=['tttttttttttt','t##########t','t##o#######t','t#oOo######t','t#OOO##iii#t','t#lll###i##t','t#lll##iii#t','t#lll######t','pppppppppppp'];
  Object.assign(DECAL,{Door:['.ttt.','tdedt','tdedt','tdedt','tdedt','tdekt','tdedt','tdedt','ppppp'],Door2:['.ttttt.','tdetedt','tdetedt','tdetedt','tdetedt','tdktkdt','tdetedt','tdetedt','tdetedt','ppppppp'],
    Win:['llll','tGgt','tggt','tggt','tttt'],WinS:['.llll.','stGgts','stggts','stggts','.tttt.'],WinF:['.llll.','.tGgt.','.tggt.','.tggt.','rcrrcr','.bbbb.'],
    Lancet:['.l.','lGl','lgl','lgl','lgl','lll'],Lancet2:['.lll.','lGlgl','lglgl','lglgl','lglgl','lllll'],Rose:['.lll.','lgGgl','lGyGl','lgGgl','.lll.'],
    Sign:['tttt..','...t..','.bbbbb','.byrrb','.bbbbb'],Lamp:['tt','.y','.y'],Cross:['.y.','yyy','.y.','.y.'],Bell:['.lll.','l###l','l#y#l','lyyyl','lllll'],
    Rune:['.llll.','lddddl','ldyydl','ldeedl','ldyedl','ldeedl','ldekdl','ldeedl','ldeedl','pppppp'],Slit:['h','h','h','h'],Hatch:['ttttt','tbebt','tbebt','tbebt','ttttt'],Beams:['t...t...t...t...t...t'],
    Barn:barnDoors(11,11),Gate:archOf(12,16,true),Arch:archOf(7,10,false),Ivy:['v.v.v','vvv.v','.vvvv','v.vv.','vv.vv','.v.v.','v..v.','..v..'],
    Logs:gen(10,5,(c,r)=>(c+r)%2?'M':'L'),Goods:['rycrycry','bbbbbbbb','bbbbbbbb'],Crate:['tttt','t..t','t..t','tttt'],Hoop:['iiiiii'],Flap:['..n..','.n#n.','n###n','n###n','n###n'],
    Cave:['...XXX.....','..XDDDXX...','.XDDDDDDX..','XDDDDDDDDX.','XDDDDDDDDDX','XDDDDDDDDDX','.XDDDDDDDDX','XDDDDDDDDDX','XDDDDDDDDDX'],
    Cave2:['.....XX....','...XXDDX...','..XDDDDDXX.','.XDDDDDDDDX','XDDDDDDDDDX','XDDDDDDDDX.','XDDDDDDDDX.','XDDDDDDDDDX'],
    Adit:['.XDDDX.','XDDDDDX','XDDDDDX','XDDDDDX','XDDDDDX','XDDDDDX','XDDDDDX','XiDDDiX'],
    Forge:FORGE,ForgeS:FORGE.map(r=>r.replace(/t/g,'l'))});
  // (W5: the elves' openings: a pointed arch door, its fanlight of moon glass, a warm light between its leaves; an arched window and a
  // round one of moon glass with a warm glint; a hanging lantern of moonlight; a banner of moon lavender, its gold leaf)
  Object.assign(DECAL,{DoorLeaf:['...u...','..umu..','.umjmu.','.uuuuu.','udeaedu','udeaedu','udeaedu','udkaedu','udeaedu','udeaedu'],
    WinLeaf:['.uu.','ujmu','umju','ujmu','umau','uuuu'],WinRound:['.uuu.','ujmmu','umjau','ummmu','.uuu.'],LampLeaf:['uu.','.u.','yjy','.j.','.y.'],Banner:['uuu','mjm','mym','mmm','mqm','mmm','m.m']});
  extra('letters',DCOL);extra('decals',DECAL);
  // (what counts as a door: a way in, for the game's doors and paths)
  const DOORISH=/^(door|barn|stall|forge|goods|rune|gate|adit|arch|hatch|flap)|^wheel$/i;

  /* props: small things in a yard or at a wall, each a few parts round its foot (at), turned by face (0-3) */
  const PROP={barrel:[{k:'tower',round:true,r:1.3,z:[0,3],wall:'plank',roof:{form:'lid',mat:'plank'}}],sacks:[{k:'tower',round:true,r:1.2,z:[0,2],wall:'linen',roof:{form:'lid',mat:'linen'}},{k:'tower',round:true,r:1.1,c:[2,0],z:[0,2],wall:'linen',roof:{form:'lid',mat:'linen'}}],
    crate:[{k:'box',w:2,d:2,z:[0,2],wall:'plank',top:true}],woodpile:[{k:'box',w:5,d:2,z:[0,2],wall:'log',top:true,topMat:'logend'}],bench:[{k:'box',w:4,d:1,z:[0,2],wall:'plank',top:true}],
    trough:[{k:'box',w:4,d:2,z:[0,2],wall:'plank',top:true,topMat:'water'}],anvil:[{k:'box',w:2,d:1,z:[0,2],wall:'iron',top:true}],headstone:[{k:'box',w:2,d:1,z:[0,3],wall:'stone',top:true}],
    coal:[{k:'box',w:4,d:3,z:[0,1],wall:'plank',top:true,topMat:'iron'}],hay:[{k:'tower',round:true,r:2.5,z:[0,2],wall:'thatch',roof:{form:'cone',rise:3,mat:'thatch',o:0}}],
    cart:[{k:'box',w:5,d:3,z:[1,3],wall:'plank',top:true},{k:'box',w:1,d:1,c:[-1,2],z:[0,2],wall:'timber',top:true},{k:'box',w:1,d:1,c:[-1,-2],z:[0,2],wall:'timber',top:true}],
    washing:[{k:'box',w:1,d:1,c:[-4,0],z:[0,5],wall:'timber',top:true},{k:'box',w:1,d:1,c:[4,0],z:[0,5],wall:'timber',top:true},{k:'box',w:7,d:1,z:[3,5],wall:'linen',top:true}],
    // (stage 2: a fisher's net on its rack, a stump, a cut stone block, an orcs' totem and a tusk, a fire pit, a mine cart of ore, a
    // spoil heap, a boulder, a lantern on its post, a stack of logs)
    nets:[{k:'box',w:1,d:1,c:[-2,0],z:[0,5],wall:'timber',top:true},{k:'box',w:1,d:1,c:[2,0],z:[0,5],wall:'timber',top:true},{k:'box',w:3,d:1,z:[1,5],wall:'net',top:true,topMat:'timber'}],
    stump:[{k:'tower',round:true,r:1.4,z:[0,2],wall:'log',roof:{form:'lid',mat:'logend'}}],block:[{k:'box',w:3,d:2,z:[0,2],wall:'stone',top:true}],
    totem:[{k:'box',w:1,d:1,z:[0,7],wall:'timber',top:true},{k:'box',w:3,d:1,z:[5,6],wall:'bone',top:true},{k:'box',w:2,d:2,z:[7,9],wall:'bone',top:true}],tusk:[{k:'box',w:1,d:1,z:[0,4],wall:'bone',top:true}],
    firepit:[{k:'tower',round:true,r:2.2,z:[0,1],wall:'stone',roof:{form:'lid',mat:'ember'}}],minecart:[{k:'box',w:4,d:3,z:[1,3],wall:'iron',top:true,topMat:'rock'}],
    spoil:[{k:'tower',round:true,r:2.6,z:[0,1],wall:'rock',roof:{form:'cone',rise:2,mat:'rock',o:0}}],boulder:[{k:'tower',round:true,r:1.6,z:[0,1],wall:'rock',roof:{form:'cone',rise:2,mat:'rock',o:0}}],
    lantern:[{k:'box',w:1,d:1,z:[0,6],wall:'timber',top:true},{k:'box',w:1,d:1,z:[5,6],wall:'gold',top:true}],logs:[{k:'box',w:6,d:3,z:[0,3],wall:'log',top:true,topMat:'logend'}]};
  const rotP=(f,[u,v])=>[[u,v],[-v,u],[-u,-v],[v,-u]][((f%4)+4)%4];
  // (stage 3: a prop's s scales it (2 at the 32 px scale, where a figure is a tile tall), its lift raises it (on a cart, a deck))
  const sized=(q,s,l)=>s===1&&!l?q:Object.assign({},q,{r:q.r&&q.r*s,w:q.w&&q.w*s,d:q.d&&q.d*s,c:q.c&&q.c.map(x=>x*s),z:q.z.map(x=>x*s+l),roof:q.roof&&q.roof.rise?Object.assign({},q.roof,{rise:q.roof.rise*s}):q.roof});
  function expand(parts){const out=[];for(const p of parts){if(p.k!=='prop'){out.push(p);continue}const f=p.face|0,[au,av]=p.at;
    PROP[p.type].forEach((q0,i)=>{const q=sized(q0,p.s||1,p.lift||0);const [cu,cv]=rotP(f,q.c||[0,0]),c=[au+cu,av+cv],n=(p.name||'prop')+'.'+i;
      if(q.k==='tower')out.push(Object.assign({},q,{name:n,c}));else{const [w,d]=f%2?[q.d,q.w]:[q.w,q.d];out.push(Object.assign({},q,{name:n,u:[c[0]-w/2,c[0]+w/2],v:[c[1]-d/2,c[1]+d/2]}))}})}return out}

  /* the model's faces at a scale of the fit */
  function build(spec,sc){const yaw=((spec.yaw|0)%8+8)%8,G=grid(yaw,sc),F=[],boxes={},parts=expand(spec.parts),base=[],beds=[],rect=(B)=>[G.W(B.U0,B.V0,0),G.W(B.U1,B.V0,0),G.W(B.U1,B.V1,0),G.W(B.U0,B.V1,0)];
    for(const p of parts){const n0=F.length;
      if(p.k==='box'){const B={U0:G.U(p.u[0]),U1:G.U(p.u[1]),V0:G.V(p.v[0]),V1:G.V(p.v[1]),Z0:G.Z(p.z[0]),Z1:G.Z(p.z[1])};if(B.U1<=B.U0)B.U1=B.U0+1;if(B.V1<=B.V0)B.V1=B.V0+1;if(B.Z1<=B.Z0+1&&!p.thin)B.Z1=B.Z0+2;boxes[p.name]=B;box(F,G,p,B);if(!B.Z0&&p.wall!=='stakes')base.push(rect(B))}
      else if(p.k==='roof')roof(F,G,p,boxes[p.on],parts.find(q=>q.name===p.on));
      else if(p.k==='tower'){tower(F,G,p);if(!G.Z(p.z[0])){const c=G.W(G.U(p.c[0]),G.V(p.c[1]),0),r=(p.r||p.w/2)*Math.min(G.sc.u,G.sc.v)*(G.d&&!p.round?R2:1);base.push(Array.from({length:12},(_,i)=>[c[0]+Math.cos(i*Math.PI/6)*r,c[1]+Math.sin(i*Math.PI/6)*r*G.K,0]))}}
      // a fence: posts every few steps and a rail between them, here and there a rail missing, a gap for a gate; a bed: a low box of
      // soil, its crop in rows (or water: a mill's race); both low and flat, unoutlined
      else if(p.k==='fence'){const z1=p.h||2;p.pts.forEach((a,i)=>{const b=p.pts[i+1];if(!b)return;const along=a[1]===b[1],lo=Math.min(along?a[0]:a[1],along?b[0]:b[1]),hi=Math.max(along?a[0]:a[1],along?b[0]:b[1]),gaps=(p.gates||[]).filter(g=>g[2]===i);
        let runs=[[lo,hi]];for(const [g0,g1] of gaps)runs=runs.flatMap(([r0,r1])=>[[r0,Math.min(r1,g0)],[Math.max(r0,g1),r1]]).filter(([r0,r1])=>r1>r0);
        const at=(r0,r1,z0,z1)=>{const B=along?{U0:G.U(r0),U1:G.U(r1),V0:G.V(a[1]),V1:G.V(a[1])+1}:{U0:G.U(a[0]),U1:G.U(a[0])+1,V0:G.V(r0),V1:G.V(r1)};if(B.U1<=B.U0)B.U1=B.U0+1;if(B.V1<=B.V0)B.V1=B.V0+1;
          box(F,G,{name:(p.name||'fence')+'.'+i,wall:p.mat||'plank',top:true,flat:true,thin:true},Object.assign(B,{Z0:z0,Z1:z1}))};
        for(const [r0,r1] of runs){const zt=G.Z(z1)||1;for(let k=r0;k<r1;k+=3)at(k,k+1,0,zt);if(zt>1)for(let k=r0;k<r1;k+=3)if(H(k,i,(spec.seed|0)+p.pts.length)>.12)at(k,Math.min(r1,k+3),zt-1,zt);else at(k,k+1,0,zt)}})}
      else if(p.k==='bed'){const B={U0:G.U(p.u[0]),U1:G.U(p.u[1]),V0:G.V(p.v[0]),V1:G.V(p.v[1])};if(B.U1<=B.U0)B.U1=B.U0+1;if(B.V1<=B.V0)B.V1=B.V0+1;beds.push({pts:rect(B),mat:p.topMat||'crop'})}// (on the ground layer)
      else if(p.k==='chimney'){const h=p.w/2,hd=(p.d||p.w)/2,[cu,cv]=p.at,U0=G.U(cu-h),V0=G.V(cv-hd);
        box(F,G,{name:p.name||'chimney',wall:p.mat||'stone',top:true,topMat:'iron',cap:true},{U0,U1:Math.max(U0+1,G.U(cu+h)),V0,V1:Math.max(V0+1,G.V(cv+hd)),Z0:G.Z(p.z[0]),Z1:G.Z(p.z[1])})}
      // (each face its building, the part's dw or its roof's box's: for the tests and the game to tell its buildings' pixels)
      const dw=p.dw!=null?p.dw:p.on?(parts.find(q=>q.name===p.on)||{}).dw:undefined;
      for(let i=n0;i<F.length;i++){if(F[i].sd==null)F[i].sd=(i*7)%97;if(F[i].dw==null)F[i].dw=dw}}
    return{F,G,yaw,parts,base,beds}}
  // how much room it takes on screen (its points' extent)
  function extent(F){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const f of F)for(const p of f.P){const y=p[1]-p[2];if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(y<y0)y0=y;if(y>y1)y1=y}return[x1-x0,y1-y0]}
  // the fit's choices, the least change first: width, depth and height each its own way (a long house turned end-on grows less
  // deep, not smaller all over), the eaves pulled in last
  const SCALES=(()=>{const st=[1,.9,.8,.7,.6,.5],zs=[1,.95,.9,.85,.8,.7,.6,.5],out=[];const lg=Math.log;
    for(const u of st)for(const v of st)for(const z of zs)for(const o of [1,0])out.push({u,v,z,o,s:lg(u)+lg(v)+.8*lg(z)-.45*Math.abs(lg(u/v))-.3*Math.abs(lg(z/Math.sqrt(u*v)))-(o?0:.35)});
    return out.sort((a,b)=>b.s-a.s)})();
  // (the scale found for a plan turned to its fitYaws, kept: PX.modelFitClear() forgets them)
  const FITS=new Map();PX.modelFitClear=()=>FITS.clear();

  /* the model to pixels: each face's pixels (their centres inside it) on its plane, the nearest kept, then shaded */
  function render(spec,sc){
    const {F,G,yaw,base,beds}=build(spec,sc),N=spec.cell||16,sd=spec.seed|0;
    for(const f of F){if(f.cls==='roof'){const tp=f.P.reduce((a,q)=>q[2]>a[2]?q:a),d=sub(tp,f.O),pe=dot(d,f.eu);
        f.ev=nrm(sub(d,f.eu.map(x=>x*pe)));f.fh=dot(d,f.ev);f.fw=f.P.reduce((a,q)=>Math.max(a,dot(sub(q,f.O),f.eu)),0)*f.su}}
    let di=0;for(const d of spec.decals||[]){di++;const f=F.find(q=>q.name===d.wall&&!q.gable===!d.gable),rows=DECAL[d.kind],w=rows[0].length,h=rows.length;
      if(f){f.dec.push({id:di,kind:d.kind,rows,w,h,u0:Math.round((d.at==null?.5:d.at)*f.fw-w/2),v0:Math.max(f.foot&&!DOORISH.test(d.kind)?1:0,G.Z(d.z||0)),onGable:!!d.gable});continue}
      // (a round tower's side by its letter, 'name.S': the decal on its facets round the curve there, turned with the building)
      const dot=d.wall.lastIndexOf('.'),pn=d.wall.slice(0,dot),s=d.wall.slice(dot+1),fs=F.filter(q=>q.part===pn&&q.round);if(!fs.length||!SIDES[s])continue;
      const C=fs.reduce((a,q)=>a+q.fw,0),dv=G.dir(...SIDES[s]),c=((Math.atan2(dv[1],dv[0])/(2*Math.PI))%1+1)%1*C,u0=Math.round(c+((d.at==null?.5:d.at)-.5)*C/4-w/2),v0=G.Z(d.z||0);
      for(const q of fs)if(u0<q.uo+q.fw&&u0+w>q.uo)q.dec.push({id:di,kind:d.kind,rows,w,h,u0,v0,main:u0+w/2>=q.uo&&u0+w/2<q.uo+q.fw})}
    // the screen: x, g - z, on a buffer with room round the cell
    const M=N*2,B=M*M,ox=M>>1,oy=Math.round(M*.7),depth=new Float32Array(B).fill(-1e9),fid=new Int16Array(B).fill(-1),PT=new Float32Array(B*3);
    for(let fi=0;fi<F.length;fi++){const f=F[fi];if(f.vis<=1e-4)continue;const S=f.P.map(p=>[p[0]+ox,p[1]-p[2]+oy]);
      let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,area=0;for(const [x,y] of S){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
      for(let i=0;i<S.length;i++){const a=S[i],b=S[(i+1)%S.length];area+=a[0]*b[1]-b[0]*a[1]}if(Math.abs(area)<1e-6)continue;const sg=area>0?1:-1;
      for(let Y=Math.max(0,Math.floor(y0));Y<=Math.min(M-1,Math.ceil(y1));Y++)for(let X=Math.max(0,Math.floor(x0));X<=Math.min(M-1,Math.ceil(x1));X++){
        const px=X+.5,py=Y+.5;let ins=true;for(let i=0;i<S.length&&ins;i++){const a=S[i],b=S[(i+1)%S.length];if(sg*((b[0]-a[0])*(py-a[1])-(b[1]-a[1])*(px-a[0]))<-1e-7)ins=false}if(!ins)continue;
        const wx=px-ox,wy=py-oy,t=(f.c-f.n[0]*wx-f.n[1]*wy)/f.vis,dd=t+f.prio*1e-3,q=Y*M+X;
        if(dd>depth[q]+1e-6){depth[q]=dd;fid[q]=fi;PT[q*3]=wx;PT[q*3+1]=wy+t;PT[q*3+2]=t}}}
    // shade every pixel a face won; note the walls' feet on the ground (for tufts) and the doors' steps (for a worn apron)
    // (and what each pixel is, for the season's overlays: its face, its (u, v) on it, its height, its tone by the light, its decal's letter)
    const RP=ramps(),col=new Uint8Array(B*3),A=new Uint8Array(B),DEC=new Int16Array(B),FL=new Uint8Array(B),GZ=new Uint8Array(B),SU=new Float32Array(B),SV=new Float32Array(B),SZ=new Float32Array(B),SB=new Uint8Array(B),SC=new Uint8Array(B),SM=new Uint8Array(B);
    for(let q=0;q<B;q++){const fi=fid[q];if(fi<0)continue;const f=F[fi],d=sub([PT[q*3],PT[q*3+1],PT[q*3+2]],f.O),u=dot(d,f.eu)*f.su+(f.uo||0),v=dot(d,f.ev),s=dot(f.ln||(f.ln=litN(f)),L);
      const b=toneOf(f.cls==='lip'?'roof':f.cls,s);let mat,t,dk=0,step=false;
      for(const dc of f.dec){const du=Math.floor(u)-dc.u0,dv=Math.floor(v)-dc.v0;if(du>=0&&du<dc.w&&dv>=0&&dv<dc.h){const ch=dc.rows[dc.h-1-dv][du];if(ch!=='.'){[mat,t]=DCOL[ch];if('gGde'.includes(ch))t=Math.min(3,t+(b>1?1:0));dk=dc.id;step=ch==='p'&&dv===0;SC[q]=ch.charCodeAt(0);break}}}
      SU[q]=u;SV[q]=v;SZ[q]=PT[q*3+2];SB[q]=b;
      if(!dk)[mat,t]=texel(f,u,f.vo?v+f.vo:v,b,sd);
      SM[q]=MATI[mat];const c=RP[mat][Math.max(0,Math.min(3,t))];col[q*3]=c[0];col[q*3+1]=c[1];col[q*3+2]=c[2];A[q]=1;DEC[q]=dk;FL[q]=f.flat?1:f.fine?2:0;
      if(f.cls==='wall'&&!f.flat&&PT[q*3+2]<1)GZ[q]=step?2:1}
    return{F,G,M,ox,oy,col,A,DEC,FL,GZ,yaw,N,base,beds,fid,SU,SV,SZ,SB,SC,SM}
  }
  // a pixel's colour and what it is, taken from another's
  const like=(R,q,j)=>{R.col.copyWithin(q*3,j*3,j*3+3);R.fid[q]=R.fid[j];R.SU[q]=R.SU[j];R.SV[q]=R.SV[j];R.SZ[q]=R.SZ[j];R.SB[q]=R.SB[j];R.SC[q]=R.SC[j];R.SM[q]=R.SM[j];R.FL[q]=R.FL[j]};
  // the silhouette's spurs off and notches in, orphan pixels into their surroundings (decals kept)
  // (each pass judged on the silhouette as it was before it, so a fill never runs on through an open frame: a headframe, a wheel)
  function clean(R){const {M,A,col,DEC}=R;let S=A;const at=(x,y)=>x>=0&&y>=0&&x<M&&y<M?S[y*M+x]:0,nb=(x,y)=>at(x-1,y)+at(x+1,y)+at(x,y-1)+at(x,y+1);
    for(let pass=0;pass<2;pass++){S=A.slice();for(let y=0;y<M;y++)for(let x=0;x<M;x++){const q=y*M+x;if(A[q]&&!DEC[q]&&!R.FL[q]&&nb(x,y)<=1)A[q]=0;else if(!A[q]&&nb(x,y)>=3){const j=[[0,1],[-1,0],[1,0],[0,-1]].map(([dx,dy])=>(y+dy)*M+x+dx).find(j=>A[j]);A[q]=1;like(R,q,j)}}}
    // (W4: a roof's tip drawn out into a 1 px line (a cone's apex) cut back to its last pixel: never a stick above a roof)
    for(let k=0;k<8;k++){let cut=0;for(let y=1;y<M-1;y++)for(let x=1;x<M-1;x++){const q=y*M+x,f=R.F[R.fid[q]];if(!A[q]||A[q-M]||A[q-1]||A[q+1]||!f||(f.cls!=='roof'&&f.cls!=='lip'))continue;
      if(A[q+M]&&!A[q+M-1]&&!A[q+M+1]){A[q]=0;cut++}}if(!cut)break}
    const k=c=>col[c*3]<<16|col[c*3+1]<<8|col[c*3+2];
    for(let y=1;y<M-1;y++)for(let x=1;x<M-1;x++){const q=y*M+x;if(!A[q]||DEC[q])continue;const ns=[q-1,q+1,q-M,q+M];if(!ns.every(j=>A[j]&&!DEC[j]))continue;
      const c0=k(ns[0]);if(c0!==k(q)&&ns.every(j=>k(j)===c0))col.copyWithin(q*3,ns[0]*3,ns[0]*3+3)}}
  function bnd(R){const {M,A}=R;let x0=M,y0=M,x1=-1,y1=-1;for(let y=0;y<M;y++)for(let x=0;x<M;x++)if(A[y*M+x]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}return{x0,y0,x1,y1}}
  // grass at the walls' feet by climate (worldnature's tufts), a door's worn apron
  const TUFT={grass:['#a2c062','#5e8c3a','#3e6a2e'],frost:['#f2f6fa','#d8e2ee','#aebcd2'],desert:['#c8b46a','#9a9450','#72703e']},DIRT=['#9a7c56','#b49870'];

  /* the ground under it, a flat layer of its own (drawn with the flat things, before any shadow or anything standing): a yard of worn
     earth (or cobbles in town) a few px round what stands, a path from each door, garden beds in rows, a mill's race; its edge broken
     and dithered into the terrain over 2-3 px, grass tufts poking in, tufts at the walls' feet; by climate (frost trodden snow,
     desert sand, swamp mud). Never a square, never the cell's outline */
  const EARTH={grass:['#a88c5e','#94784e','#7c6440'],frost:['#e6ebf2','#ccd4de','#aab6c6'],desert:['#e2c690','#ceae7a','#b69666'],swamp:['#665a44','#524834','#40382a']};
  const COBBLE={grass:['#b4ac9a','#968e7e','#7a736a'],frost:['#d8dde4','#b8c0cc','#98a2b0'],desert:['#dac69c','#c2ac82','#a28e6a'],swamp:['#7a7462','#625c4e','#4a463c']};
  const SHADE=.28;PX.MODEL_SHADE=SHADE;
  function fillPoly(m,N,pts,v){const ys=pts.map(p=>p[1]);for(let y=Math.max(0,Math.floor(Math.min(...ys)));y<=Math.min(N-1,Math.ceil(Math.max(...ys)));y++){const cy=y+.5,xs=[];
    for(let i=0;i<pts.length;i++){const [ax,ay]=pts[i],[bx,by]=pts[(i+1)%pts.length];if((ay<=cy&&by>cy)||(by<=cy&&ay>cy))xs.push(ax+(cy-ay)/(by-ay)*(bx-ax))}xs.sort((a,b)=>a-b);
    for(let k=0;k+1<xs.length;k+=2)for(let x=Math.max(0,Math.round(xs[k]));x<Math.min(N,Math.round(xs[k+1]));x++)m[y*N+x]=v}}
  // (the ground's material, for the game to tint by the world's covers: earth, cobble, sand, mud, trodden snow)
  const groundKey=spec=>spec.ground==='cobble'?'cobble':{desert:'sand',swamp:'mud',frost:'snow'}[spec.env]||'earth';
  function groundOf(spec,R,dx,dy,N,body,gz,doors){const env=EARTH[spec.env]?spec.env:'grass',sd=(spec.seed|0)+5,cob=spec.ground==='cobble',T=(TUFT[env]||TUFT.grass).map(hx);
    // (the yard: what stands, closed over the gaps between (grown by Dc, shrunk back), then grown by D; its depth from its edge, for
    // the dithered border)
    const D=spec.yard!=null?spec.yard:N>=128?5:N>=64?4:N>=32?3:1,Dc=N>=128?10:N>=64?8:N>=32?6:D,sh=p=>[p[0]+R.ox-dx,p[1]+R.oy-dy],B=new Uint8Array(N*N);
    for(const poly of R.base)fillPoly(B,N,poly.map(sh),1);
    const bfs=(src,lim)=>{const d=new Int16Array(N*N).fill(99),q=[];for(let i=0;i<N*N;i++)if(src(i)){d[i]=0;q.push(i)}
      for(let h=0;h<q.length;h++){const i=q[h],x=i%N,y=(i/N)|0;if(d[i]>=lim)continue;for(const [ax,ay] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+ax,Y=y+ay,j=Y*N+X;if(X<0||Y<0||X>=N||Y>=N||d[j]<=d[i]+1)continue;d[j]=d[i]+1;q.push(j)}}return d};
    const db=bfs(i=>B[i],Dc+1),out=bfs(i=>db[i]>Dc||i%N===0||i%N===N-1||i<N||i>=N*N-N,Dc+3),dist=new Int16Array(N*N);for(let i=0;i<N*N;i++)dist[i]=db[i]>Dc?99:Math.max(0,Dc+1-out[i]);
    const P=new Uint8Array(N*N);for(const d of doors){for(let y=d.y;y<Math.min(N,d.y+(N>=32?9:5));y++)for(let x=d.x-1;x<=d.x+(N>=32?1:0);x++)if(x>=0&&x<N&&y>=0&&(Math.abs(x-d.x)<1||H(x,y,sd+3)<.7))P[y*N+x]=1}
    const C=new Uint8Array(N*N);for(const b of R.beds)fillPoly(C,N,b.pts.map(sh),b.mat==='water'?2:1);
    const RP=ramps(),E=(cob?COBBLE:EARTH)[env].map(hx),Ea=EARTH[env].map(hx);
    // (it thins out over the cell's last two pixels: never a straight edge along the cell)
    const rim=(x,y)=>{const e=Math.min(x,y,N-1-x,N-1-y);return e>1||H(x,y,sd+9)<(e?.6:.3)};
    const c=PX.canvas(N,N,g=>{const im=g.createImageData(N,N),o=im.data,put=(i,c)=>{o[i*4]=c[0];o[i*4+1]=c[1];o[i*4+2]=c[2];o[i*4+3]=255};
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,d=dist[i],h=H(x,y,sd);if(!rim(x,y)&&!body[i])continue;
        if(C[i]){put(i,C[i]===2?RP.water[(x+y)%5?1:0]:y%2?RP.soil[1]:RP.crop[h<.3?2:1]);continue}// beds in rows, a race of water
        const yard=d<=D||(d<=D+2&&h<(D+2.6-d)/3.2);if(!yard&&!P[i])continue;
        if(!P[i]&&d>D-1&&env!=='desert'&&env!=='frost'&&H(x,y,sd+1)<.28){put(i,T[h<.5?1:2]);continue}// grass poking in at its edge
        if(P[i]&&!yard){put(i,Ea[h<.5?0:1]);continue}// the path from the door
        put(i,cob&&!P[i]?E[((x+((y>>1)%2)*2)%3===0||y%2===0)?(h<.5?1:2):0]:E[h<.12?2:h<.55?1:0])}// cobbles, or worn earth
      // tufts at the walls' feet, just below their outline
      if(env==='grass'||env==='swamp')for(let y=0;y<N-2;y++)for(let x=0;x<N;x++)if(gz[y*N+x]===1&&!body[(y+2)*N+x]&&!body[(y+1)*N+x]&&H(x,y,sd+77)<.35)put((y+2)*N+x,T[H(x,y,sd+78)<.5?0:1]);
      g.putImageData(im,0,0)});
    c.info={dist,path:P,beds:C,D};return c}

  PX.model=spec=>{const t0=performance.now(),N=spec.cell||16,fit=N-2,sd=spec.seed|0;
    // the scale: the first of the fit's choices whose points fit the cell (in every facing of spec.fitYaws, so a building turned is
    // the same building at the same scale); then drawn, and smaller again if its pixels do not
    // (W4: several facings are judged on their pixels together, and the scale kept for the plan, so a facing whose pixels run a pixel
    // over never draws the building smaller than its other facings)
    const yaws=spec.fitYaws||[spec.yaw|0],at=y=>y===(spec.yaw|0)?spec:Object.assign({},spec,{yaw:y}),fits=R=>{clean(R);const b=bnd(R);return b.x1-b.x0+1<=fit&&b.y1-b.y0+1<=fit},key=yaws.length>1?JSON.stringify(Object.assign({},spec,{yaw:0,snow:0})):null;
    let sc=key&&FITS.get(key),R,bx;
    // (the fit's next choice when the pixels run over its points, up to three; then smaller all over)
    if(!sc){let i=-1;const next=()=>{for(i++;i<SCALES.length;i++)if(yaws.every(y=>{const B=build(at(y),SCALES[i]),[w,h]=extent(B.F),k=B.G.d?1:0;return w<=fit-k&&h<=fit-k}))return SCALES[i];return null};
      sc=next()||SCALES[SCALES.length-1];
      for(let k=0;k<12;k++){if(yaws.every(y=>fits(render(at(y),sc)))||sc.u<.2)break;sc=(k<3&&next())||{u:sc.u*.92,v:sc.v*.92,z:sc.z*.92,o:0}}if(key){if(FITS.size>2000)FITS.clear();FITS.set(key,sc)}}
    R=render(spec,sc);clean(R);bx=bnd(R);
    const {M,A,col,DEC,FL,GZ,F}=R,cw=bx.x1-bx.x0+1,dx=bx.x0-1-Math.floor((fit-cw)/2),dy=bx.y1-(N-2);
    // the picture: the body and its navy outline round it (not round what lies low and flat: fences, beds), cropped to the cell
    const img=PX.canvas(N,N),g=img.getContext('2d', { willReadFrequently: true }),im=g.createImageData(N,N),D=im.data,body=new Uint8Array(N*N),fine=new Uint8Array(N*N),gap=new Uint8Array(N*N),gz=new Uint8Array(N*N),nv=hx(NAVY);
    const I={F,fi:new Int16Array(N*N).fill(-1),u:new Float32Array(N*N),v:new Float32Array(N*N),z:new Float32Array(N*N),b:new Uint8Array(N*N),ch:new Uint8Array(N*N),m:new Uint8Array(N*N)},
      take=(c,q)=>{I.fi[c]=R.fid[q];I.u[c]=R.SU[q];I.v[c]=R.SV[q];I.z[c]=R.SZ[q];I.b[c]=R.SB[q];I.ch[c]=R.SC[q];I.m[c]=R.SM[q]};
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=M||Y>=M)continue;const q=Y*M+X;if(A[q]){body[y*N+x]=FL[q]===1?2:1;fine[y*N+x]=FL[q]===2;gz[y*N+x]=GZ[q];const i=(y*N+x)*4;D[i]=col[q*3];D[i+1]=col[q*3+1];D[i+2]=col[q*3+2];D[i+3]=255;take(y*N+x,q)}}
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(body[y*N+x])continue;if((x>0&&body[y*N+x-1]===1)||(x<N-1&&body[y*N+x+1]===1)||(y>0&&body[(y-1)*N+x]===1)||(y<N-1&&body[(y+1)*N+x]===1)){const i=(y*N+x)*4;D[i]=nv[0];D[i+1]=nv[1];D[i+2]=nv[2];D[i+3]=255}}
    // (an outline pixel shut in by the body and the outline, touching nothing empty, is part of the body: the outline lies round the
    // silhouette only, one pixel thick; but not between thin parts, where it is the gap of an open frame: a wheel's spokes, braces)
    const emp=(x,y)=>x<0||y<0||x>=N||y>=N||!D[(y*N+x)*4+3];
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=(y*N+x)*4;if(body[y*N+x]||!D[i+3]||emp(x-1,y)||emp(x+1,y)||emp(x,y-1)||emp(x,y+1))continue;
      const j=[[x,y+1],[x-1,y],[x+1,y],[x,y-1]].find(([u,v])=>body[v*N+u]);if(!j)continue;if([[x,y+1],[x-1,y],[x+1,y],[x,y-1]].some(([u,v])=>fine[v*N+u])){gap[y*N+x]=1;continue}const c=j[1]*N+j[0],k=c*4;D[i]=D[k];D[i+1]=D[k+1];D[i+2]=D[k+2];body[y*N+x]=1;
      for(const a of ['fi','u','v','z','b','ch','m'])I[a][y*N+x]=I[a][c]}
    g.putImageData(im,0,0);
    // (what each pixel is, for the tests: 0 empty, 1 the body, 2 low and flat (fences), 3 the outline, 4 the navy gap in an open frame)
    const mask=new Uint8Array(N*N);for(let i=0;i<N*N;i++)mask[i]=body[i]?body[i]:gap[i]?4:D[i*4+3]?3:0;
    // its ground shadow, a mask of its own (solid; the game lays every shadow in view into one mask and shades it once, at SHADE, after
    // the ground and before anything standing, so neighbours' shadows merge rather than stack): every face laid on the ground along
    // the light (to the lower right), inside the cell, off the picture
    const shadow=PX.canvas(N,N,sg=>{const m=PX.canvas(N,N),P=PX.paint(m.getContext('2d', { willReadFrequently: true }));for(const f of F)P.poly(f.P.map(p=>[p[0]+p[2]*SUN[0]+R.ox-dx,p[1]+p[2]*SUN[1]+R.oy-dy]),'#000');
      const sm=m.getContext('2d', { willReadFrequently: true }).getImageData(0,0,N,N).data,o=sg.createImageData(N,N),on=i=>sm[i*4+3]&&!D[i*4+3];
      // (soft: its edge on open ground a checker, so it fades off rather than ending on a hard line)
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;if(!on(i))continue;const open=j=>!sm[j*4+3]&&!D[j*4+3],e=(x>0&&open(i-1))||(x<N-1&&open(i+1))||(y>0&&open(i-N))||(y<N-1&&open(i+N))||x===0||y===0||x===N-1||y===N-1;
        if(e&&(x+y)%2)continue;o.data[i*4]=20;o.data[i*4+1]=24;o.data[i*4+2]=12;o.data[i*4+3]=255}sg.putImageData(o,0,0)});
    // what the game will light: each window seen (its middle) and the door (the first of the spec's, on its front: its foot's middle,
    // seen or not)
    const seen={};for(let y=0;y<N;y++)for(let x=0;x<N;x++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=M||Y>=M)continue;const id=DEC[Y*M+X];if(id&&body[y*N+x]===1){const w=seen[id]||(seen[id]=[0,0,0]);w[0]+=x;w[1]+=y;w[2]++}}
    // each building (spec.dwellings, its parts' dw: {kind, role, storeys}; role 'home' a dwelling, else a work place or a store):
    // its plan's rectangles and footprint (local px), its floor area (px of plan x storeys, for the game to count housing and work
    // places by), its windows and door
    const bs=(spec.dwellings||[]).map((D,i)=>{const rects=spec.parts.filter(p=>(p.k==='box'||p.k==='tower')&&p.dw===i).map(p=>p.k==='box'?[p.u[0],p.u[1],p.v[0],p.v[1]]:(r=>[p.c[0]-r,p.c[0]+r,p.c[1]-r,p.c[1]+r])(p.r||p.w/2)),cells=new Set();
      for(const [u0,u1,v0,v1] of rects)for(let v=Math.round(v0);v<Math.round(v1);v++)for(let u=Math.round(u0);u<Math.round(u1);u++)cells.add(u+','+v);
      return{kind:D.kind,role:D.role||'home',storeys:D.storeys||1,dwellings:D.dwellings|0,rects,footprint:{u:[Math.min(...rects.map(r=>r[0])),Math.max(...rects.map(r=>r[1]))],v:[Math.min(...rects.map(r=>r[2])),Math.max(...rects.map(r=>r[3]))]},area:cells.size,floor:cells.size*(D.storeys||1),windows:[],door:null}});
    const own=f=>{const p=spec.parts.find(q=>q.name===f.part);return p&&p.dw!=null?bs[p.dw]:null};
    const windows=[];let door=null;
    for(const f of F)for(const d of f.dec){if((f.gable&&!d.onGable)||d.main===false)continue;const o=own(f);
      if(DOORISH.test(d.kind)){const a=(d.u0+d.w/2-(f.uo||0))/f.su,p=[f.O[0]+f.eu[0]*a,f.O[1]+f.eu[1]*a,f.O[2]],dr={x:Math.round(p[0]+R.ox-dx),y:Math.round(p[1]-p[2]+R.oy-dy),seen:!!seen[d.id]};if(!door||(!door.seen&&dr.seen))door=dr;if(o&&(!o.door||(!o.door.seen&&dr.seen)))o.door=dr}
      else if(seen[d.id]&&/win|shut|lancet/i.test(d.kind)){const w=seen[d.id],at=[Math.round(w[0]/w[2]),Math.round(w[1]/w[2])];windows.push(at);if(o)o.windows.push(at)}}
    // a flag's pole: on the highest point of the roofs
    let flag=null;if(spec.flag){let best=null;for(const f of F)if(f.cls==='roof')for(const p of f.P)if(!best||p[2]>best[2])best=p;if(best)flag=[Math.round(best[0]+R.ox-dx),Math.round(best[1]-best[2]+R.oy-dy)]}
    // named points of the plan on the picture (spec.marks {name:[u,v,z]}: a camp's fire, a gate's middle)
    const marks={};for(const k in spec.marks||{}){const [u,v,z]=spec.marks[k],G=R.G,p=G.W(G.U(u),G.V(v),G.Z(z||0));marks[k]=[Math.round(p[0]+R.ox-dx),Math.round(p[1]-p[2]+R.oy-dy)]}
    const ground=groundOf(spec,R,dx,dy,N,body,gz,bs.map(b=>b.door).concat(door?[door]:[]).filter(Boolean));
    const out={img,ground,groundKey:groundKey(spec),shadow,shade:SHADE,w:N,h:N,ax:0,ay:N,cell:N,tiles:[N/16,N/16],flag,yaw:R.yaw,role:spec.role||null,windows,door,buildings:bs,dwellings:bs.filter(b=>b.role==='home'),households:bs.reduce((a,b)=>a+b.dwellings,0),mask,clipped:cw>fit||bx.y1-bx.y0+1>fit,scale:sc,view:'model',
      seed:sd,marks,px:I,season:{}};
    // (spec.snow, 0-1 or true: the snow overlay made with it, out.snow; the game may ask for another amount later, PX.modelSeason)
    if(spec.snow)out.snow=PX.modelSeason(out,'snow',spec.snow===true?1:+spec.snow);
    out.ms=performance.now()-t0;return out};

  /* the seasons: overlays made from the model itself (it is 3D in code: each pixel knows its face, its slope, its height), two layers
     drawn over the building's img and its ground, so the game changes them as the seasons come without building it again. Each is
     by an amount 0-1, kept to thirds (0, 1/3, 2/3, 1), made once a model and amount. PX.MODEL_SEASONS holds them by name: snow now;
     room for wet (darker roofs after rain), autumn (leaves on roofs and ground), spring (blossom, moss) */
  const QS=a=>Math.round(Math.max(0,Math.min(1,a))*3)/3;
  PX.modelSeason=(m,kind,amount)=>{const q=QS(amount);if(!q||!PX.MODEL_SEASONS[kind])return null;const k=kind+q.toFixed(2);return m.season[k]||(m.season[k]=PX.MODEL_SEASONS[kind](m,q))};
  // snow, by a: a dusting (1/3: the ridges, the top of each slope), patchy (2/3: most of each slope, bare patches, sills, drifts
  // starting), full (1: every slope but the steepest's foot, icicles under the eaves, drifts against the walls on the windward
  // (west) side, the yard white but its paths). Roofs by their pitch: gentle slopes hold more, steep ones shed it. Clean shapes,
  // solid on the roof planes (a wavy line where it ends, its edge a tone deeper), never a speckle; lit as the face under it
  function snowOf(m,a){const N=m.cell,I=m.px,sd=m.seed+701,RP=ramps(),S=RP.snow,ICE=RP.ice,mk=m.mask,on=new Int8Array(N*N).fill(-1),ice=new Int8Array(N*N).fill(-1);
    const fc=i=>I.fi[i]>=0&&mk[i]===1?I.F[I.fi[i]]:null,code=s=>new Set([...s].map(c=>c.charCodeAt(0))),DOOR=code('dekp'),WIN=code('gGs');
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,f=fc(i);if(!f)continue;const u=I.u[i],v=I.v[i],iu=Math.floor(u),b=I.b[i];
      if(f.cls==='roof'){const lf=f.vo!=null,fh=f.fh||1,pf=Math.max(0,Math.min(1,(f.tn[2]-.45)/.4)),cover=a*(.6+.55*pf)*(f.rf&&f.rf.form==='cone'?.8:1),w=(H(iu>>1,0,sd)-.5)*.22,top=lf?1-(v+f.vo)/f.arc:1-v/fh;
        // (the eave's row keeps its roof: the people's colour under the snow; a leaf roof's facets by the whole arc, its ridge its top's)
        let s=(fh-v<1&&f.rf&&f.rf.form!=='shed'&&(!lf||f.ridge)||top+w<cover)&&(lf?v+f.vo>=1:v>=1||fh<3);
        if(s&&a>.4&&a<.9&&fh-v>=1&&H(iu>>1,Math.floor(v)>>1,sd+3)<.16)s=false;// (bare patches when patchy)
        if(s)on[i]=fh-v<1&&(!lf||f.ridge)?0:Math.min(3,Math.min(2,b)+(Math.floor(v)%3===2&&H(iu>>1,Math.floor(v/3),sd+4)<.6?1:0))}
      else if(f.cls==='top'||f.cls==='floor'){if(f.mat==='water'||f.mat==='iron'||f.mat==='ember'||a<.5)continue;if(a>.9||H(x>>1,y>>1,sd+5)<(a-.3)*1.5)on[i]=Math.min(1,b)}
      else if(f.cls==='wall'&&!I.ch[i]){
        if(a>.6&&y>0&&WIN.has(I.ch[i-N]))on[i]=1;// a sill
        else if(a>.6&&!f.gable&&I.z[i]<(a>.9?.9+1.3*(1-u/(f.fw||1)):.2+.8*(1-u/(f.fw||1)))+(H(iu>>1,1,sd+7)-.5)*.8)on[i]=Math.min(2,b)}// a drift, deeper at the windward end
      else if(f.cls==='wall'&&a>.6&&!DOOR.has(I.ch[i])&&I.z[i]<.5&&!f.gable&&H(iu,2,sd+9)<.5)on[i]=Math.min(2,b)}
    // (the snow's lower edge on a slope a tone deeper: its thickness)
    for(let y=0;y<N-1;y++)for(let x=0;x<N;x++){const i=y*N+x,f=fc(i);if(on[i]>=0&&f&&f.cls==='roof'&&on[i+N]<0&&fc(i+N)===f)on[i]=Math.min(3,on[i]+1)}
    // icicles under the eaves at full snow: from the lip's pixel down the wall, one or two long
    if(a>.95)for(let y=1;y<N-1;y++)for(let x=0;x<N;x++){const i=y*N+x,f=fc(i),o=fc(i-N);if(!f||f.cls!=='wall'||!o||o.cls!=='lip'||H(x,5,sd+11)>=.42)continue;ice[i]=1;if(fc(i+N)===f&&H(x,6,sd+12)<.5)ice[i+N]=2}
    const img=PX.canvas(N,N,g=>{const im=g.createImageData(N,N),o=im.data;for(let i=0;i<N*N;i++){const c=ice[i]>=0?ICE[ice[i]]:on[i]>=0?S[on[i]]:null;if(!c)continue;o[i*4]=c[0];o[i*4+1]=c[1];o[i*4+2]=c[2];o[i*4+3]=255}g.putImageData(im,0,0)});
    // the ground: from the yard's edge in (its paths trodden, last), the beds' soil rows first
    const gi=m.ground.info,gd=m.ground.getContext('2d', { willReadFrequently: true }).getImageData(0,0,N,N).data,D=gi.D,lim=(D+3)-a*(D+4.5);
    const ground=PX.canvas(N,N,g=>{const im=g.createImageData(N,N),o=im.data;for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;if(!gd[i*4+3]||mk[i]===1)continue;const h=H(x,y,sd+13);
      const s=gi.beds[i]?(a>.6&&y%2)||a>.9:gi.path[i]?a>.9&&h<.35:gi.dist[i]+h*1.6>lim;if(!s)continue;const c=S[h<.2?2:h<.6?1:0];o[i*4]=c[0];o[i*4+1]=c[1];o[i*4+2]=c[2];o[i*4+3]=255}g.putImageData(im,0,0)});
    return{img,ground,amount:a}}
  PX.MODEL_SEASONS={snow:snowOf};


  /* the checkpoint's samples, as specs */
  const S={
    // a shed of planks under a single slope (no dwelling): what fills a gap by a street
    shed:o=>({cell:16,parts:[{k:'box',name:'main',u:[-5,4],v:[-3,3],z:[0,5],wall:'plank',keep:1},{k:'roof',on:'main',form:'shed',axis:'u',rise:2,mat:'shingle',keep:1},{k:'prop',type:'barrel',at:[6,2]}],
      decals:[{wall:'main.S',kind:'door',at:.35}]}),
    // a fenced kitchen garden (no dwelling): two beds, a gate to the street; it lies flat, unoutlined
    garden:o=>({cell:16,parts:[{k:'bed',name:'b0',u:[-5,-1],v:[-4,4]},{k:'bed',name:'b1',u:[1,5],v:[-4,4]},{k:'fence',pts:[[-7,6],[7,6],[7,-6],[-7,-6],[-7,6]],gates:[[-1,1,0]]}]}),
    // a human cottage: timber-framed daub on a stone footing, a thatched gable, a chimney, a door and windows
    cottage:o=>({cell:16,dwellings:[{kind:'cottage'}],parts:[{k:'box',name:'main',dw:0,u:[-5,5],v:[-3,3],z:[0,6],wall:'daub',frame:'timber',foot:'stone'},{k:'roof',on:'main',form:'gable',axis:'u',rise:2,mat:'thatch',lip:1},{k:'chimney',at:[-3,0],w:2,z:[5,10]}],
      decals:[{wall:'main.S',kind:'door',at:.3},{wall:'main.S',kind:'win',at:.75,z:2},{wall:'main.N',kind:'win',at:.5,z:2},{wall:'main.E',kind:'win',at:.5,z:2},{wall:'main.W',kind:'door',at:.4}]}),
    // a stone house under a tiled roof, a chimney at one end
    house:o=>({cell:16,dwellings:[{kind:'house'}],parts:[{k:'box',name:'main',dw:0,u:[-5,5],v:[-3,3],z:[0,6],wall:'stone'},{k:'roof',on:'main',form:'gable',axis:'u',rise:2,mat:'tile'},{k:'chimney',at:[3,-1],w:2,z:[5,10]}],
      decals:[{wall:'main.S',kind:'door',at:.5},{wall:'main.S',kind:'win',at:.15,z:2},{wall:'main.S',kind:'win',at:.85,z:2},{wall:'main.N',kind:'win',at:.5,z:2},{wall:'main.W',kind:'win',at:.5,z:2},{wall:'main.E',kind:'win',at:.5,z:2}]}),
    // the frost: a log cottage, snow on its roof
    frost:o=>({cell:16,snow:true,dwellings:[{kind:'cottage'}],parts:[{k:'box',name:'main',dw:0,u:[-5,5],v:[-3,3],z:[0,6],wall:'log',foot:'stone'},{k:'roof',on:'main',form:'gable',axis:'u',rise:2,mat:'shingle',lip:1},{k:'chimney',at:[-3,-1],w:2,z:[5,10]}],
      decals:[{wall:'main.S',kind:'door',at:.62},{wall:'main.S',kind:'win',at:.22,z:2},{wall:'main.E',kind:'win',at:.5,z:2},{wall:'main.W',kind:'win',at:.5,z:2}]}),
    // the desert: a flat-roofed adobe house, a parapet, the roof beams' ends showing
    desert:o=>({cell:16,env:'desert',dwellings:[{kind:'house'}],parts:[{k:'box',name:'main',dw:0,u:[-5,5],v:[-4,4],z:[0,6],wall:'adobe'},{k:'roof',on:'main',form:'flat',mat:'mud',parapet:1}],
      decals:[{wall:'main.S',kind:'door',at:.68},{wall:'main.S',kind:'win',at:.25,z:2},{wall:'main.S',kind:'beams',at:.5,z:4},{wall:'main.E',kind:'win',at:.5,z:2},{wall:'main.W',kind:'win',at:.5,z:2},
        {wall:'main.N',kind:'door',at:.4},{wall:'main.E',kind:'beams',at:.5,z:4},{wall:'main.W',kind:'beams',at:.5,z:4}]}),
    // an L-shaped farmhouse: a long hall and a wing at one end, both thatched; a dormer, a woodpile and a bench
    farmhouse:o=>({cell:32,dwellings:[{kind:'farmhouse'}],parts:[{k:'box',name:'main',dw:0,u:[-12,10],v:[-9,-1],z:[0,8],wall:'daub',frame:'timber',foot:'stone'},{k:'roof',on:'main',form:'gable',axis:'u',rise:4,mat:'thatch',lip:2,finial:1},
      {k:'box',name:'wing',dw:0,u:[2,10],v:[-5,11],z:[0,8],wall:'daub',frame:'timber',foot:'stone'},{k:'roof',on:'wing',form:'gable',axis:'v',rise:4,mat:'thatch',lip:2,finial:1},{k:'chimney',at:[-8,-6],w:2,z:[8,15]},
      ...dormer('dm','main',[-12,10],[-9,-1],8,4,.35,'thatch','daub'),{k:'prop',type:'woodpile',at:[-9,1]},{k:'prop',type:'bench',at:[-3,0.5]}],
      decals:[{wall:'main.S',kind:'doorL',at:.3},{wall:'main.S',kind:'shut',at:.1,z:3},{wall:'main.S',kind:'winF',at:.52,z:3},{wall:'wing.S',kind:'win',at:.5,z:3},{wall:'wing.W',kind:'shut',at:.6,z:3},{wall:'wing.E',kind:'win',at:.3,z:3},{wall:'wing.E',kind:'win',at:.75,z:3},
        {wall:'main.N',kind:'win',at:.3,z:3},{wall:'main.N',kind:'doorL',at:.7},{wall:'main.W',kind:'win',at:.5,z:3},{wall:'dm.S',kind:'win',at:.5,z:1}]}),
    // an inn: two storeys, timber-framed, a tiled hip roof, dormers and two chimneys, its sign and lantern by the door, barrels
    inn:o=>({cell:32,role:'inn',dwellings:[{kind:'inn',role:'inn',storeys:2}],parts:[{k:'box',name:'main',dw:0,u:[-12,12],v:[-6,6],z:[0,13],wall:'daub',frame:'timber',foot:'stone',rail:true},{k:'roof',on:'main',form:'hip',axis:'u',rise:4,mat:'tile'},
      {k:'chimney',at:[-6,-1],w:2,z:[12,20]},{k:'chimney',at:[7,-2],w:2,z:[12,20]},...dormer('d1','main',[-12,12],[-6,6],13,4,.3,'tile','daub'),...dormer('d2','main',[-12,12],[-6,6],13,4,.7,'tile','daub'),
      {k:'prop',type:'barrel',at:[-14,5]},{k:'prop',type:'barrel',at:[14,5]},{k:'prop',type:'bench',at:[-6,7.5]}],
      decals:[{wall:'main.S',kind:'door3',at:.5},{wall:'main.S',kind:'sign',at:.66,z:5},{wall:'main.S',kind:'lamp',at:.4,z:5},{wall:'main.S',kind:'winF',at:.2,z:2},{wall:'main.S',kind:'winF',at:.8,z:2},
        {wall:'main.S',kind:'shut',at:.2,z:8},{wall:'main.S',kind:'shut',at:.5,z:8},{wall:'main.S',kind:'shut',at:.8,z:8},{wall:'d1.S',kind:'win',at:.5,z:1},{wall:'d2.S',kind:'win',at:.5,z:1},
        ...['N','E','W'].flatMap(w=>[{wall:'main.'+w,kind:'win',at:.3,z:2},{wall:'main.'+w,kind:'shut',at:.7,z:8}])]}),
    // a chapel: a stone nave end-on, its gable and door to the front under a square tower with a pyramid spire
    chapel:o=>({cell:32,role:'chapel',dwellings:[{kind:'chapel',role:'worship'}],parts:[{k:'box',name:'nave',dw:0,u:[-6,6],v:[-12,6],z:[0,10],wall:'stone'},{k:'roof',on:'nave',form:'gable',axis:'v',rise:6,mat:'slate',finial:1},
      {k:'tower',name:'tower',dw:0,c:[0,8],w:8,z:[0,17],wall:'stone',roof:{form:'pyramid',rise:9,mat:'slate',o:1}},{k:'prop',type:'headstone',at:[-9,9]},{k:'prop',type:'headstone',at:[9,10]}],
      decals:[{wall:'tower.S',kind:'doorL',at:.5},{wall:'tower.S',kind:'lancet',at:.5,z:11},{wall:'tower.E',kind:'lancet',at:.5,z:11},{wall:'tower.W',kind:'lancet',at:.5,z:11},
        {wall:'nave.E',kind:'lancet',at:.25,z:4},{wall:'nave.E',kind:'lancet',at:.6,z:4},{wall:'nave.W',kind:'lancet',at:.25,z:4},{wall:'nave.W',kind:'lancet',at:.6,z:4},{wall:'nave.N',kind:'lancet',at:.5,z:4}]})
  };
  // a dormer on a box's front slope (its ridge along u): a little gabled window standing out of the roof, at a share of its length
  function dormer(n,on,u,v,z,R,at,mat,wall){const c=u[0]+(u[1]-u[0])*at;return[{k:'box',name:n,u:[c-2,c+2],v:[(v[0]+v[1])/2,v[1]-1],z:[z-1,z+Math.max(2,Math.round(R*.6))],wall},{k:'roof',on:n,form:'gable',axis:'v',rise:2,mat,o:0,ov:0,lip:1}]}

  /* house plots: a 2 x 2 tile plot (32) of 1-4 dwellings of their own footprints, built as one model. A row plot is a stretch of a
     town street: its houses touch and share their walls (to the plot's sides too, so plots side by side read as one row), their
     roofs at staggered heights and ridges both ways, an alley or a back yard behind; a yard plot is a hamlet's: one or two houses
     in a fenced garden with a well. The street is in front (+v, the plot's south at yaw 0). Each house is a dwelling (dw): its
     footprint, windows and door come back in the result's dwellings */
  const home=(Q,o)=>{// a house: its box, its roof, a chimney, a dormer on a tall one, its windows on every side, its decals by wall
    // ({S:[...], N:[...]}), set back o.set px from the street (so a row is not ruler-straight); kept within the cell's height at yaw 0
    const R=o.rise||4,bk=o.axis==='v'?(o.ov==null?1:o.ov)+R:(o.o==null?1:o.o),v0=o.free?o.v[0]:Math.max(o.v[0],o.z+bk-15),v1=o.v[1]-(o.set|0),u=o.u;
    Q.parts.push({k:'box',name:o.n,dw:o.dw,u,v:[v0,v1],z:[0,o.z],wall:o.wall,frame:o.wall==='daub'||o.wall==='whitewash'?'timber':null,foot:o.wall==='stone'?null:'stone',rail:o.z>=10});
    Q.parts.push({k:'roof',on:o.n,form:o.form||'gable',axis:o.axis||'u',rise:R,mat:o.mat,o:o.o,ov:o.ov,lip:o.mat==='thatch'?2:1,finial:o.axis==='v'});
    if(o.chim!==false)Q.parts.push({k:'chimney',name:o.n+'c',at:[o.axis==='v'?(u[0]+u[1])/2:u[1]-2.5,o.axis==='v'?v0+2.5:(v0+v1)/2-1],w:2,z:[o.z-1,o.z+R+2]});
    if(o.z>=10&&(o.axis||'u')==='u'&&u[1]-u[0]>=12){Q.parts.push(...dormer(o.n+'d',o.n,u,[v0,v1],o.z,R,.35,o.mat,o.wall));Q.decals.push({wall:o.n+'d.S',kind:'win',at:.5,z:1})}
    const dec=Object.assign({E:[{kind:'win',at:.5,z:o.z>=10?8:3}],W:[{kind:'win',at:.5,z:o.z>=10?8:3}]},o.dec||{});
    for(const w in dec)for(const x of dec[w])Q.decals.push(Object.assign({wall:o.n+'.'+w},x))};
  // its front: the door, windows (shuttered or with a flower box), a second row on two storeys
  const fr=(z,door,n,d)=>{const out=[{kind:'doorL',at:door}],xs=n===1?[door<.5?.75:.25]:n===2?[.2,.8]:[.18,.5,.82],k=()=>d?d.pick(['win','shut','winF']):'win';for(const at of xs)if(Math.abs(at-door)>.2)out.push({kind:k(),at,z:2});
    if(z>=10)for(const at of n===1?[.3,.7]:xs)out.push({kind:d?d.pick(['shut','win']):'win',at,z:8});return out};
  const back=z=>[{kind:'win',at:.5,z:z>=10?8:3}];
  const mats=d=>({wall:d.pick(['daub','daub','stone','plank','whitewash']),roof:d.pick(['thatch','tile','slate','shingle','tile'])});
  const plotOf=(seed,k)=>PX.dice(PX.rng((seed|0)*977+k*131+17));
  // what stands about a yard, by the seed: barrels, crates, a woodpile, a trough, a washing line, a cart, sacks
  const yardProps=(Q,d,spots)=>{for(const [u,v,f] of spots)if(d.chance(.75))Q.parts.push({k:'prop',name:'p'+Q.parts.length,type:d.pick(['barrel','crate','woodpile','trough','washing','sacks','barrel','cart']),at:[u,v],face:f|0})};
  const PLOT={
    // a narrow two-storey townhouse, its gable to the street, beside a long cottage under a ridge along it; a shed in the yard behind
    row_a:o=>{const d=plotOf(o.seed,1),Q={cell:32,role:'housing',ground:'cobble',parts:[],decals:[],dwellings:[{kind:'townhouse',storeys:2},{kind:'cottage',storeys:1}]},m1=mats(d),m2=mats(d),z1=d.int(10,12);
      home(Q,{n:'a',dw:0,u:[-15,-5],v:[0,13],set:d.int(0,2),z:z1,wall:m1.wall,mat:m1.roof,axis:'v',o:0,ov:1,dec:{S:fr(z1,.35,1,d),N:back(z1)}});
      home(Q,{n:'b',dw:1,u:[-5,15],v:[2,13],set:d.int(0,2),z:7,wall:m2.wall,mat:m2.roof,axis:'u',o:1,ov:0,dec:{S:fr(7,.22,3,d),N:back(7)}});
      Q.parts.push({k:'box',name:'shed',u:[5,12],v:[-9,-4],z:[0,4],wall:'plank',keep:1},{k:'roof',on:'shed',form:'shed',axis:'u',rise:2,mat:'shingle',o:1,ov:1,keep:1},
        {k:'fence',pts:[[-5,-13],[15,-13]]},{k:'fence',name:'fence2',pts:[[-5,-13],[-5,0]]});yardProps(Q,d,[[0,-8],[-2,-11,1]]);return Q},
    // three narrow houses wall to wall, each its own height, their ridges this way and that
    row_b:o=>{const d=plotOf(o.seed,2),Q={cell:32,role:'housing',ground:'cobble',parts:[],decals:[],dwellings:[]},zs=d.pick([[10,12,9],[12,8,11],[9,11,12],[11,9,10]]),ax=d.pick([['v','u','v'],['u','v','u'],['v','v','u']]);
      [[-15,-5],[-5,5],[5,15]].forEach((u,i)=>{const m=mats(d),z=zs[i],a=ax[i];Q.dwellings.push({kind:'townhouse',storeys:z>=10?2:1});
        home(Q,{n:'h'+i,dw:i,u,v:[d.int(-3,1),13],set:d.int(0,2),z,wall:m.wall,mat:m.roof,axis:a,o:a==='v'?0:1,ov:a==='v'?1:0,rise:a==='v'?4:3,chim:d.chance(.6),dec:{S:fr(z,d.pick([.3,.7]),1,d),N:back(z)}})});
      Q.parts.push({k:'fence',pts:[[-15,-13],[15,-13]]});yardProps(Q,d,[[-10,-10],[0,-11,1],[10,-10]]);return Q},
    // an L-house (its hall along the street, a wing back into the yard) and a townhouse against it; a well in the yard
    row_c:o=>{const d=plotOf(o.seed,3),Q={cell:32,role:'housing',ground:'cobble',parts:[],decals:[],dwellings:[{kind:'lhouse',storeys:1},{kind:'townhouse',storeys:2}]},m1=mats(d),m2=mats(d),z2=d.int(10,12);
      home(Q,{n:'a',dw:0,u:[-15,3],v:[3,13],z:7,wall:m1.wall,mat:m1.roof,axis:'u',o:1,ov:0,dec:{S:fr(7,.4,3,d)}});
      home(Q,{n:'aw',dw:0,u:[-15,-7],v:[-4,4],z:7,wall:m1.wall,mat:m1.roof,axis:'v',o:0,ov:1,chim:false,dec:{E:[{kind:'win',at:.5,z:3}]}});
      home(Q,{n:'b',dw:1,u:[3,15],v:[0,13],set:d.int(0,2),z:z2,wall:m2.wall,mat:m2.roof,axis:'v',o:0,ov:1,dec:{S:fr(z2,.65,1,d),N:back(z2)}});
      Q.parts.push({k:'tower',name:'well',round:true,c:[-1,-7],r:2.5,z:[0,3],wall:'stone',roof:{form:'water'}},{k:'fence',pts:[[-7,-12],[15,-12]]});yardProps(Q,d,[[7,-8],[3,-10,1]]);return Q},
    // two houses with a narrow alley between: a hipped one and a tall gabled one; a shed at the alley's end
    row_d:o=>{const d=plotOf(o.seed,4),Q={cell:32,role:'housing',ground:'cobble',parts:[],decals:[],dwellings:[{kind:'house',storeys:1},{kind:'townhouse',storeys:2}]},m1=mats(d),m2=mats(d),z2=d.int(10,12);
      home(Q,{n:'a',dw:0,u:[-15,-2],v:[1,13],set:d.int(0,2),z:8,wall:m1.wall,mat:m1.roof==='thatch'?'tile':m1.roof,form:'hip',axis:'u',o:0,rise:4,dec:{S:fr(8,.5,2,d),N:back(8)}});
      home(Q,{n:'b',dw:1,u:[1,15],v:[-1,13],set:d.int(0,2),z:z2,wall:m2.wall,mat:m2.roof,axis:'u',o:1,ov:0,dec:{S:fr(z2,.3,2,d),N:back(z2)}});
      Q.parts.push({k:'box',name:'shed',u:[-3,2],v:[-8,-3],z:[0,4],wall:'plank',keep:1},{k:'roof',on:'shed',form:'shed',axis:'u',rise:2,mat:'shingle',o:1,ov:0,keep:1});yardProps(Q,d,[[-9,-9],[9,-11,1]]);return Q},
    // a hamlet's yard: a cottage with a lean-to against it, garden beds, a well, a fence round it all, its gate to the street
    yard_a:o=>{const d=plotOf(o.seed,5),Q={cell:32,role:'housing',parts:[],decals:[],dwellings:[{kind:'cottage',storeys:1}]},m=mats(d);
      home(Q,{n:'a',dw:0,u:[-12,5],v:[-7,3],z:7,wall:m.wall,mat:m.roof,axis:'u',o:1,ov:1,dec:{S:fr(7,.35,2,d),N:back(7),W:[{kind:'win',at:.5,z:3}]}});
      Q.parts.push({k:'box',name:'lean',u:[5,10],v:[-6,2],z:[0,4],wall:'plank',keep:1},{k:'roof',on:'lean',form:'shed',axis:'v',rise:2,mat:m.roof,o:1,ov:0,keep:1},
        {k:'tower',name:'well',round:true,c:[9,8],r:2.5,z:[0,3],wall:'stone',roof:{form:'water'}},{k:'bed',name:'bed0',u:[-12,-6],v:[6,11]},{k:'bed',name:'bed1',u:[-4,1],v:[6,11]},
        {k:'fence',pts:[[-14,13],[14,13],[14,-12],[-14,-12],[-14,13]],gates:[[-1,3,0]]});yardProps(Q,d,[[-9,-10,1],[2,-10]]);return Q},
    // a hamlet's yard of two: an L-house at the back, a small cottage in front of it, a bed and a well, fenced
    yard_b:o=>{const d=plotOf(o.seed,6),Q={cell:32,role:'housing',parts:[],decals:[],dwellings:[{kind:'lhouse',storeys:1},{kind:'cottage',storeys:1}]},m1=mats(d),m2=mats(d);
      home(Q,{n:'a',dw:0,u:[-10,9],v:[-9,-1],z:7,wall:m1.wall,mat:m1.roof,axis:'u',dec:{S:fr(7,.25,2,d),N:back(7)}});
      home(Q,{n:'aw',dw:0,u:[3,9],v:[-2,6],z:7,wall:m1.wall,mat:m1.roof,axis:'v',chim:false,dec:{S:[{kind:'win',at:.5,z:3}],E:[{kind:'win',at:.5,z:3}]}});
      home(Q,{n:'b',dw:1,u:[-12,-3],v:[3,10],z:6,wall:m2.wall,mat:m2.roof,axis:d.pick(['u','v']),rise:3,dec:{S:fr(6,.5,1,d),E:[{kind:'win',at:.5,z:2}]}});
      Q.parts.push({k:'tower',name:'well',round:true,c:[10,10],r:2.5,z:[0,3],wall:'stone',roof:{form:'water'}},{k:'bed',u:[-1,6],v:[8,12]},
        {k:'fence',pts:[[-14,13],[14,13],[14,-12],[-14,-12],[-14,13]],gates:[[-8,-4,0]]});yardProps(Q,d,[[-12,-11,1]]);return Q}
  };

  /* clusters: a cell (32, or a 64 quarter) holding several small buildings of any kind, each built in its own plan (its front +v) and
     set down at a point of the cell turned to one of 4 facings (face 0 front south, 1 west, 2 north, 3 east), with the yards, props
     and fences round them. PX.modelCluster({cell, role, people, seed, pieces:[{piece, at:[u,v], face, ...its options}], parts,
     decals}) -> a spec for PX.model; every building keeps its kind and role (home, work, store, stable, worship, trade) for the
     result's buildings, the cluster its role */
  const SIDES={S:[0,1],E:[1,0],N:[0,-1],W:[-1,0]},sideOf=([a,b])=>Object.keys(SIDES).find(k=>SIDES[k][0]===a&&SIDES[k][1]===b);
  function place(Q,pc,at,f,id){const T=([u,v])=>{const [a,b]=rotP(f,[u,v]);return[a+at[0],b+at[1]]},R=(u,v)=>{const p=[T([u[0],v[0]]),T([u[1],v[1]])];return[[Math.min(p[0][0],p[1][0]),Math.max(p[0][0],p[1][0])],[Math.min(p[0][1],p[1][1]),Math.max(p[0][1],p[1][1])]]};
    const base=Q.dwellings.length;Q.dwellings.push(...(pc.dwellings||[]));
    for(const p0 of pc.parts){const p=Object.assign({},p0);if(p.name)p.name=id+p.name;if(p.on)p.on=id+p.on;if(p.dw!=null)p.dw+=base;
      if(p.u&&p.v){[p.u,p.v]=R(p.u,p.v)}if(p.c)p.c=T(p.c);if(p.at)p.at=T(p.at);if(p.k==='prop')p.face=((p.face|0)+f)%4;
      if(p.k==='tower'&&!p.round&&f%2){p.w=p.w}// (square: the same either way)
      if(p.k==='chimney'&&f%2){const w=p.w;p.w=p.d||p.w;p.d=w}
      if(p.k==='roof'){const ax=p.axis||'u',hv=ax==='u'?[0,p.hi==='b1'?1:-1]:[p.hi==='b1'?1:-1,0],nh=rotP(f,hv);if(f%2)p.axis=ax==='u'?'v':'u';p.hi=(p.axis==='u'?nh[1]:nh[0])>0?'b1':'b0'}
      if(p.pts){const P0=p.pts.map(T),gates=(p.gates||[]).map(([g0,g1,i])=>{const a=p.pts[i],b=p.pts[i+1],alongU=a[1]===b[1],q0=T(alongU?[g0,a[1]]:[a[0],g0]),q1=T(alongU?[g1,a[1]]:[a[0],g1]),nu=P0[i][1]===P0[i+1][1];return[Math.min(nu?q0[0]:q0[1],nu?q1[0]:q1[1]),Math.max(nu?q0[0]:q0[1],nu?q1[0]:q1[1]),i]});p.pts=P0;p.gates=gates}
      Q.parts.push(p)}
    for(const d0 of pc.decals||[]){const [n,s]=d0.wall.split(/\.(?=[SNEW]$)/);Q.decals.push(Object.assign({},d0,{wall:s?id+n+'.'+sideOf(rotP(f,SIDES[s])):id+d0.wall}))}}
  // the pieces, each in its own plan (front +v, its middle at 0): its parts, decals and the buildings it holds
  const PIECE={
    house:o=>{const w=o.w||12,d=o.d||8,z=o.z||7,Q={parts:[],decals:[],dwellings:[{kind:o.kind||(z>=10?'townhouse':'house'),role:o.role||'home',storeys:z>=10?2:1}]};
      home(Q,{n:'h',dw:0,free:1,u:[-w/2,w/2],v:[-d/2,d/2],z,wall:o.wall||'daub',mat:o.mat||'tile',axis:o.axis||'u',rise:o.rise||(w>=12?4:3),o:o.o,ov:o.ov,chim:o.chim,dec:Object.assign({S:o.front||fr(z,o.door||.35,w>=14?3:2,o.d6),N:back(z)},o.dec||{})});
      return Q},
    barn:o=>{const w=o.w||12,d=o.d||9,z=o.z||8;return{dwellings:[{kind:'barn',role:'store'}],parts:[{k:'box',name:'b',dw:0,u:[-w/2,w/2],v:[-d/2,d/2],z:[0,z],wall:'plank',foot:'stone',keep:1},{k:'roof',on:'b',form:'gable',axis:'u',rise:4,mat:'thatch',lip:2,finial:1}],
      decals:[{wall:'b.S',kind:'barn',at:.5},{wall:'b.E',kind:'win',at:.5,z:4},{wall:'b.W',kind:'win',at:.5,z:4},{wall:'b.N',kind:'door',at:.3}]}},
    shed:o=>({dwellings:[{kind:'shed',role:'store'}],parts:[{k:'box',name:'s',dw:0,u:[-(o.w||6)/2,(o.w||6)/2],v:[-(o.d||5)/2,(o.d||5)/2],z:[0,o.z||5],wall:'plank',keep:1},{k:'roof',on:'s',form:'shed',axis:'u',rise:2,mat:o.mat||'shingle',keep:o.mat?0:1}],decals:[{wall:'s.S',kind:'door',at:.4}]}),
    forge:o=>({dwellings:[{kind:'forge',role:'work'}],parts:[{k:'box',name:'f',dw:0,u:[-6,6],v:[-4,4],z:[0,7],wall:'stone',keep:1},{k:'roof',on:'f',form:'gable',axis:'u',rise:3,mat:'tile'},{k:'chimney',name:'fc',at:[4,-1],w:3,z:[6,15]},
      {k:'prop',type:'anvil',at:[2,6]},{k:'prop',type:'barrel',at:[-5,5.5]}],decals:[{wall:'f.S',kind:'forge',at:.4},{wall:'f.S',kind:'sign',at:.85,z:3},{wall:'f.E',kind:'win',at:.5,z:3},{wall:'f.W',kind:'win',at:.5,z:3}]}),
    stable:o=>({dwellings:[{kind:'stable',role:'stable'}],parts:[{k:'box',name:'s',dw:0,u:[-7,7],v:[-3,3],z:[0,6],wall:'plank',keep:1},{k:'roof',on:'s',form:'shed',axis:'u',rise:2,mat:'thatch'},{k:'prop',type:'trough',at:[0,5]}],
      decals:[{wall:'s.S',kind:'stall',at:.18},{wall:'s.S',kind:'stall',at:.5},{wall:'s.S',kind:'stall',at:.82}]}),
    chapel:o=>({dwellings:[{kind:'chapel',role:'worship'}],parts:[{k:'box',name:'n',dw:0,u:[-4,4],v:[-7,7],z:[0,8],wall:'stone'},{k:'roof',on:'n',form:'gable',axis:'v',rise:5,mat:'slate',finial:1},
      {k:'box',name:'bc',dw:0,u:[-1,1],v:[5,7],z:[11,15],wall:'stone'},{k:'roof',on:'bc',form:'hip',axis:'u',rise:3,mat:'slate',o:0}],
      decals:[{wall:'n.S',kind:'doorL',at:.5},{wall:'n.S',kind:'lancet',at:.5,z:5},{wall:'n.E',kind:'lancet',at:.3,z:3},{wall:'n.E',kind:'lancet',at:.7,z:3},{wall:'n.W',kind:'lancet',at:.3,z:3},{wall:'n.W',kind:'lancet',at:.7,z:3},{wall:'bc.S',kind:'lancet',at:.5,z:0}]}),
    stall:o=>({dwellings:[{kind:'stall',role:'trade'}],parts:[{k:'box',name:'s',dw:0,u:[-3.5,3.5],v:[-2,2],z:[0,4],wall:'plank',keep:1},{k:'roof',on:'s',form:'shed',axis:'u',rise:2,mat:'awning',o:1,keep:1},{k:'prop',type:o.prop||'crate',at:[5,1]}],
      decals:[{wall:'s.S',kind:'goods',at:.5,z:1}]}),
    fountain:o=>({parts:[{k:'tower',name:'fb',round:true,c:[0,0],r:3.2,z:[0,2],wall:'stone',roof:{form:'water'}},{k:'tower',name:'fp',round:true,c:[0,0],r:.9,z:[0,5],wall:'stone',roof:{form:'lid',mat:'stone'}}]}),
    well:o=>({parts:[{k:'tower',name:'w',round:true,c:[0,0],r:2.5,z:[0,3],wall:'stone',roof:{form:'water'}}]}),
    granary:o=>({dwellings:[{kind:'granary',role:'store'}],parts:[{k:'tower',name:'g',dw:0,round:true,c:[0,0],r:3.5,z:[0,7],wall:'stone',roof:{form:'cone',rise:5,mat:'thatch'}},{k:'prop',type:'sacks',at:[3,4]}],decals:[{wall:'g.4',kind:'door',at:.5}]}),
    mill:o=>({dwellings:[{kind:'watermill',role:'work'}],parts:[{k:'box',name:'m',dw:0,u:[-6,6],v:[-4,4],z:[0,9],wall:'stone',keep:1},{k:'roof',on:'m',form:'gable',axis:'u',rise:4,mat:'shingle',finial:1},{k:'chimney',at:[-4,-1],w:2,z:[9,15]},
      {k:'bed',name:'race',u:[-15,15],v:[4,8],topMat:'water'}],decals:[{wall:'m.S',kind:'wheel',at:.7,z:0},{wall:'m.S',kind:'door',at:.2},{wall:'m.E',kind:'doorL',at:.5},{wall:'m.W',kind:'win',at:.5,z:4},{wall:'m.S',kind:'win',at:.35,z:5}]}),
    graves:o=>({parts:[{k:'fence',pts:[[-6,5],[6,5],[6,-5],[-6,-5],[-6,5]],gates:[[-1,1,0]]},...[[-3,-2],[0,-2],[3,-2],[-3,2],[2,2]].map(([u,v],i)=>({k:'prop',name:'hs'+i,type:'headstone',at:[u,v]}))]}),
    yard:o=>({parts:[{k:'fence',pts:o.pts,gates:o.gates}]})
  };
  PX.modelCluster=c=>{const Q={cell:c.cell||32,role:c.role,ground:c.ground,parts:(c.parts||[]).slice(),decals:(c.decals||[]).slice(),dwellings:[]},d=PX.dice(PX.rng((c.seed|0)*613+29));
    c.pieces.forEach((p,i)=>place(Q,PIECE[p.piece](Object.assign({d6:d},p)),p.at,p.face|0,'q'+i+'.'));return Q};
  const CL={
    // a farmstead: the farmhouse, its barn across the yard, a shed, a haystack, a cart and a trough, fenced
    farmstead:o=>PX.modelCluster({role:'farm',seed:o.seed,pieces:[{piece:'house',kind:'farmhouse',at:[-5,-7],w:15,d:8,z:7,mat:'thatch'},{piece:'barn',at:[9,-1],face:1,w:12,d:9},{piece:'shed',at:[-10,8]},
      {piece:'yard',pts:[[-15,14],[2,14],[2,4]],at:[0,0]}],parts:[{k:'prop',name:'hay',type:'hay',at:[-2,8]},{k:'prop',name:'cart',type:'cart',at:[2,-12],face:1},{k:'prop',name:'tr',type:'trough',at:[-12,1]},{k:'prop',name:'wp',type:'woodpile',at:[-12,-12]}]}),
    // a smithy: the forge open to the street, its glow; a coal store, a woodpile, the anvil outside; the smith's house behind
    smithy:o=>PX.modelCluster({role:'smithy',seed:o.seed,pieces:[{piece:'forge',at:[-3,5]},{piece:'shed',kind:'coal',at:[10,6],face:3,w:6,d:5},{piece:'house',at:[-4,-9],w:13,d:7,z:7,chim:true}],
      parts:[{k:'prop',name:'coal',type:'coal',at:[10,-3]},{k:'prop',name:'wp',type:'woodpile',at:[9,-10]},{k:'prop',name:'bar',type:'barrel',at:[-13,11]}]}),
    // an inn: the inn on the street, its stable across the yard, a well and a cart
    inn_yard:o=>PX.modelCluster({role:'inn',ground:'cobble',seed:o.seed,pieces:[{piece:'house',kind:'inn',role:'inn',at:[-3,6],w:20,d:9,z:11,mat:'tile',front:[{kind:'door3',at:.5},{kind:'sign',at:.66,z:5},{kind:'lamp',at:.4,z:5},{kind:'winF',at:.2,z:2},{kind:'winF',at:.8,z:2},{kind:'shut',at:.2,z:8},{kind:'shut',at:.5,z:8},{kind:'shut',at:.8,z:8}]},
      {piece:'stable',at:[3,-10]},{piece:'well',at:[-11,-6]}],parts:[{k:'prop',name:'cart',type:'cart',at:[11,-2],face:1},{k:'prop',name:'b1',type:'barrel',at:[12,6]},{k:'prop',name:'b2',type:'barrel',at:[13.5,8]}]}),
    // a chapel, its priest's cottage, a little graveyard of headstones
    chapel_yard:o=>PX.modelCluster({role:'chapel',seed:o.seed,pieces:[{piece:'chapel',at:[-6,-1]},{piece:'house',kind:'priest',at:[8,-8],face:1,w:9,d:7,z:6},{piece:'graves',at:[7,7]}]}),
    // a market: four stalls round a small square with a fountain, crates and sacks
    market:o=>PX.modelCluster({role:'market',ground:'cobble',seed:o.seed,pieces:[{piece:'stall',at:[-8,-10]},{piece:'stall',at:[7,-10],prop:'sacks'},{piece:'stall',at:[-10,6],face:3,prop:'barrel'},{piece:'stall',at:[10,6],face:1},{piece:'fountain',at:[0,1]}],
      parts:[{k:'prop',name:'c1',type:'crate',at:[-3,10]},{k:'prop',name:'c2',type:'sacks',at:[3,11]}]}),
    // a mill: the watermill on its race, the wheel turning in it; a granary, sacks and a cart
    mill:o=>PX.modelCluster({role:'mill',seed:o.seed,pieces:[{piece:'mill',at:[-4,-1]},{piece:'granary',at:[10,-8]}],parts:[{k:'prop',name:'s1',type:'sacks',at:[8,1]},{k:'prop',name:'cart',type:'cart',at:[-11,-11]}]}),
    // a town quarter (64): eight houses along a lane through it, a little square with a well in the middle, sheds and gardens behind
    quarter:o=>{const d=PX.dice(PX.rng((o.seed|0)*41+7)),H2=(at,face,w,d2,z,ax)=>({piece:'house',at,face,w,d:d2,z,axis:ax});
      return PX.modelCluster({cell:64,role:'housing',ground:'cobble',seed:o.seed,pieces:[
        H2([-10,-22],3,12,10,d.pick([10,11]),'u'),H2([-10,-9],3,10,10,7,'v'),H2([-10,11],3,12,9,d.pick([10,7]),'u'),H2([-10,24],3,10,10,8,'v'),
        H2([10,-21],1,12,10,7,'u'),H2([10,-7],1,10,10,d.pick([11,10]),'v'),H2([10,12],1,12,9,7,'u'),H2([10,25],1,10,10,10,'u'),
        {piece:'well',at:[0,2]},{piece:'shed',at:[-24,-14],face:3},{piece:'shed',at:[24,4],face:1},{piece:'yard',at:[0,0],pts:[[-29,18],[-17,18],[-17,30]]}],
        parts:[{k:'bed',name:'g1',u:[-29,-19],v:[-4,4]},{k:'bed',name:'g2',u:[19,29],v:[-30,-22]},{k:'prop',name:'w1',type:'washing',at:[-23,-26]},{k:'prop',name:'c1',type:'cart',at:[24,18],face:1},{k:'prop',name:'b1',type:'bench',at:[-4,-4],face:3},{k:'prop',name:'b2',type:'barrel',at:[4,7]}]})}
  };
  Object.assign(S,PLOT,CL);PX.MODEL_PLOTS=Object.keys(PLOT);PX.MODEL_CLUSTERS=Object.keys(CL);
  PX.MODEL_SAMPLES=Object.keys(S);PX.MODEL_GROUND=['garden'];
  // the facings in use: front, left side, back, right side (yaw 0, 2, 4, 6). The renderer turns by 45° too (odd yaws), but nothing
  // uses it: on this straight top-down camera a diagonal house reads as an isometric diamond, a box tipped over. A street that runs
  // on the diagonal is followed by its plots stepping a tile at a time, each at its nearest straight facing
  PX.MODEL_YAWS=[0,2,4,6];
  // the peoples' looks (o.people, human by default): their roof, the same whoever holds the place (humans' thatch in the country, tile
  // in town), their light walls; what is kept as built (keep: barns, sheds, stalls) keeps its own
  const PEOPLE={human:{roof:'tile',rural:'thatch',wall:['whitewash','daub','daub','stone']},dwarf:{roof:'slate',wall:['stone']},elf:{roof:'leaf',wall:['whitewash']},orc:{roof:'hide',wall:['daub','plank']}};
  const RURAL=['cottage','frost','farmhouse','yard_a','yard_b','farmstead','mill'],ROOFS=['thatch','tile','slate','shingle','leaf','hide'],WALLS=['daub','whitewash','stone','plank'];
  PX.MODEL_PEOPLES=Object.keys(PEOPLE);
  function people(Q,name,pp,seed){const P=PEOPLE[pp]||PEOPLE.human,roof=RURAL.includes(name)&&P.rural?P.rural:P.roof,walls={};let k=seed|0;
    for(const p of Q.parts){if(p.keep)continue;if(p.k==='roof'&&ROOFS.includes(p.mat))p.mat=roof;if(p.k==='tower'&&p.roof&&ROOFS.includes(p.roof.mat))p.roof.mat=roof;
      if((p.k==='box'||p.k==='tower')&&WALLS.includes(p.wall)){const key=p.dw!=null?'d'+p.dw:p.name.split('.')[0];
        const w=walls[key]||(walls[key]=P.wall[(k++)%P.wall.length]);p.wall=w;p.frame=(w==='daub'||w==='whitewash')&&pp!=='dwarf'&&p.frame!==undefined?'timber':null;if(w==='stone')p.foot=null}}
    return Q}
  // ('row' or 'yard' picks a plot of that kind by the seed)
  // the kit, for the building catalogue (buildmodels.js): the house, its dormer, front and back walls' decals, the cluster pieces and how
  // one is set down, the peoples' looks, the props and decals by name, a quarter turn, and a spec's extent on screen at full scale
  // ({x0, x1, y0, y1}: px from the cell's middle, y up the screen negative)
  PX.modelKit={home,dormer,fr,back,PIECE,place,people,PEOPLE,PROP,DECAL,rotP,
    extent:spec=>{const {F}=build(spec,{u:1,v:1,z:1,o:1});let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const f of F)for(const p of f.P){const y=p[1]-p[2];if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(y<y0)y0=y;if(y>y1)y1=y}return{x0,x1,y0,y1}}};
  PX.modelSample=(name,o)=>{o=o||{};if(name==='row'||name==='yard'){const ks=PX.MODEL_PLOTS.filter(k=>k.startsWith(name));name=ks[((o.seed|0)%ks.length+ks.length)%ks.length]}
    return Object.assign(people(S[name](o),name,o.people,o.seed),{yaw:o.yaw|0,seed:o.seed|0,flag:!!o.flag,name,people:o.people||'human'})};
})(window.PX=window.PX||{});
