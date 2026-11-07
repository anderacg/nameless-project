'use strict';
// Every building as a model (engine/buildmodels.js, the world-map building redesign at the owner's scale, stage 3's models; the game
// still draws the old ones): a model for every one of PX.BUILDING_TYPES and the sites (ruins, shrine, cave), each people, its facings
// (4; the castle centres straight on), the climates; each at its size from the one table (PX.MODEL_SIZES: objects 16, every building
// at least 32), nothing cut off, true pixels, the navy outline round the silhouette only; one model a building, simply turned (its
// four facings from the same plan: the same parts, sizes and features, at the same scale); the front view shows a door, its walls at
// least about a third of the building's height; (W4) its side views at least three quarters of its front's width (the long and thin
// aside), never a 1 px stick above a roof, never a sprite of one material; never a square backdrop (the picture never fills a whole edge of its cell; its ground
// and shadow reach the edge only thinly); the households each building holds; the snow overlay by thirds, cached, inside the body
// and the ground, more with more snow, solid shapes rather than a speckle; the peoples' roofs; the clusters' buildings and roles; the
// same spec the same pixels (a hash a type, to see when the look changes); and the cost of a big holding's first view.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
// (recorded for W4's polish of the owner's scale (2026-10-22: plans about square so the sides show as wide as the front, storeys of
// 12 px and 9 px doors, finials and crosses 2 px, a cone's tip never a stick, the crane, the cave, the mine head and the windmill
// redone, rough rock and crowns, the fit judged on every facing's pixels: every picture changed): a type's and a cluster's every
// picture, ground, shadow and snow, hashed; W5 (2026-10-22), the elves' hall made elven without trees, the spire and an elves'
// village hall in the same language (a leaf roof, pale living wood, moon lavender, arched doors and windows): those three re-recorded)
// (2026-10-22, re-recorded at the merge of the four culture kits (agents CV, CK, CA, CS: each culture's own houses, working
//  buildings, clusters and centres) with the shared textures for a culture's materials (model.js PX.MODEL_EXTRA.textures)):
//  every people builds in its own culture's kit now)
// (2026-10-31, re-recorded: the clusters re-laid so their buildings stand apart, none hidden behind another (the owner: "some
//  clustered builds are a bit off"): every cluster moved, here and in each culture's block; no type changed)
// (2026-11-06, recorded: two new clusters, nothing else changed: a town's hall and market (townhall: "towns stand open", no citadel
//  but the capital's) and a fort's tower and barracks (fort: the new fort kind), here and in each culture's block)
// (2026-11-06, re-recorded: a townhouse's upper storey jettied front and back alike (one side only read as a storey shifted a pixel
//  side on, the owner): townhouse and cluster:townhall here; the Vale's townhouse and townhall, the Clans' townhouse, townhall, row and
//  quarter in their blocks (their own houses jettied the same, build-karn.js khouse); nothing else changed)
// (2026-11-06, all re-recorded: no long line of one colour (the owner: "a very large line that happens to be mono colour"): model.js
//  breakRuns shades a pixel every few along any run of more than RUNS.len alike; every picture changed, its plan and shape none.
//  Proof: RUNS.len 999 gives the values before. Here and in every culture's block)
// (2026-11-07, all re-recorded: the outline a deep shade of the body it borders, not navy (the owner: "the outline should blend
//  with the sprite, a darker colour or shade of it"; engine/pixel.js PX.rim, model.js): every picture changed, its plan and shape
//  none. Proof: PX.RIM.on false gives the values before. Here and in every culture's block)
const EXPECT={
 cottage:'836d0086',townhouse:'8d1985c2',fisherhut:'13dd3fb5',chapel:'d2a1ee02',stall:'b0f54403',tower:'d3908fa3',yurt:'db978505',
 longhouse:'53d3835d',tavern:'f5475a76',smithy:'e25b235b',church:'b1cfca21',barn:'2a2b748e',granary:'48c4462f',windmill:'963d14d0',
 watermill:'9fb84c95',warehouse:'7f1142e2',gatehouse:'342511c4',hidehall:'c2123fb0',watchtower:'87b413c4',treehouse:'c7e12d04',
 elfhall:'68918f96',spire:'ad1f5d07',stonehall:'1d88e503',forge:'a3e3c565',keep:'218a1d76',citadel:'fbdd7705',well:'f1bfc2fc',
 tent:'76affd13',wagon:'6b439ab0',minehead:'eb9c7279',lumbershed:'9a256f16',crane:'a0cc80a3',village:'0839dab2',signpost:'735db237',
 cart:'e367a122',haystack:'9200d375',woodpile:'d14bd073',fence:'4ccfec38',crates:'6c3e7d68',barrels:'49bb5626',chiefyurt:'c2ed3f3a',
 warcamp:'73664586',horselines:'1231659a',ruins:'1dbd6faa',shrine:'658b352b',cave:'fb46dfd7','cluster:row':'10cac064',
 'cluster:yard':'f3dc93af','cluster:farmstead':'b20a1376','cluster:smithy':'e5c0bad0','cluster:inn':'ccd9b501',
 'cluster:chapel':'f3f98f2a','cluster:market':'c27691f3','cluster:mill':'4086711a','cluster:lumber':'c24e1138',
 'cluster:mine':'e2926c52','cluster:quarry':'e8adc706','cluster:fishery':'a00ac870','cluster:pasture':'e22974e8',
 'cluster:brewery':'1765817e','cluster:granary':'854bd5c0','cluster:workshop':'777629cc','cluster:quarter':'1ea5049a',
 'cluster:camp':'4a5bb359','cluster:hideout':'9dbd2399','cluster:travelers':'53426814','cluster:townhall':'7a8852b1','cluster:fort':'80bd475b'};
// (K0, 2026-10-22: recorded at the split into the cultures' files, every culture on the generic plans with its own style table)
// each culture's own block, which only its own file changes: re-record only that block (its INFO line 'culture <name>: ...')
const EXPECT_CULTURE={
 // vale (build-vale.js)
 vale:{cottage:'45a69a45',townhouse:'b507272f',fisherhut:'b08931fe',chapel:'74163786',stall:'1f5d90a1',tower:'61e923bc',
  longhouse:'72b928a6',tavern:'8fa8e782',smithy:'f734517a',church:'a4f8e367',barn:'0a3425a1',granary:'3ec809fe',windmill:'9787a2a9',
  watermill:'e1746f1d',warehouse:'f2347227',gatehouse:'d9c0ffef',keep:'2c4f12b6',citadel:'f0d78740',well:'74ffdc90',tent:'adf18230',
  wagon:'53b1099d',minehead:'012ce176',lumbershed:'19b2113e',crane:'f08b6cf4',village:'dc2267fa',signpost:'d5cec05f',
  cart:'0d451d84',haystack:'d6ad6a2d',woodpile:'a1e5079e',fence:'f1fa5cce',crates:'359812ef',barrels:'67ec5c86',ruins:'6f460598',
  shrine:'a24b6746',cave:'2f1b5ef3','cluster:row':'651091fd','cluster:yard':'181ff005','cluster:farmstead':'d7c5df61',
  'cluster:smithy':'162ea352','cluster:inn':'0fecafb3','cluster:chapel':'3df9ef71','cluster:market':'18df48c6',
  'cluster:mill':'56a942eb','cluster:lumber':'b50d80ad','cluster:mine':'dbe60df0','cluster:quarry':'1252c4a1',
  'cluster:fishery':'004c83b5','cluster:pasture':'449886a9','cluster:brewery':'39931e4d','cluster:granary':'9c4d8e0f',
  'cluster:workshop':'5e2d2eb4','cluster:quarter':'e85ad964','cluster:camp':'ae47d644','cluster:hideout':'7e02cac8',
  'cluster:travelers':'baf3ea3d','cluster:townhall':'b600b622','cluster:fort':'0a114f0f'},
 // league (build-vale.js, on the Vale’s)
 league:{cottage:'a868fcf7',townhouse:'ae76740d',fisherhut:'55a573ed',chapel:'22d6ac3f',stall:'7685f10e',tower:'34c5ba64',
  longhouse:'59f4a654',tavern:'379478f5',smithy:'bd1715f3',church:'6ce21cb0',barn:'dc266ecc',granary:'2cd3bae4',windmill:'68616606',
  watermill:'ab74f4ce',warehouse:'dc86c9b1',gatehouse:'0bffbcf7',keep:'a22b07d8',citadel:'d0a4d7ad',well:'be86505a',tent:'afc7c18f',
  wagon:'53b1099d',minehead:'012ce176',lumbershed:'65f9a3ec',crane:'464ebecc',village:'fece5af4',signpost:'d5cec05f',
  cart:'0d451d84',haystack:'d6ad6a2d',woodpile:'a1e5079e',fence:'f1fa5cce',crates:'359812ef',barrels:'67ec5c86',ruins:'6f460598',
  shrine:'a24b6746',cave:'2f1b5ef3','cluster:row':'e85f9e27','cluster:yard':'3be79ec9','cluster:farmstead':'00011d1d',
  'cluster:smithy':'37eb03e4','cluster:inn':'89b2afba','cluster:chapel':'58373a97','cluster:market':'ed72537a',
  'cluster:mill':'da25d271','cluster:lumber':'202702fa','cluster:mine':'bbe95e10','cluster:quarry':'5713654a',
  'cluster:fishery':'daf355f7','cluster:pasture':'9290797d','cluster:brewery':'3673bc21','cluster:granary':'c85c0760',
  'cluster:workshop':'84ef2b0c','cluster:quarter':'9ac7031b','cluster:camp':'4a0373b2','cluster:hideout':'c2492008',
  'cluster:travelers':'a945e692','cluster:townhall':'41fcd594','cluster:fort':'cedd31d1'},
 // karn (build-karn.js)
 karn:{cottage:'365295ec',townhouse:'adb8f832',fisherhut:'bb81b3a6',chapel:'32e2bc96',stall:'0a8e871b',tower:'78d02e60',
  longhouse:'4e873a3a',tavern:'b43f66a4',smithy:'00e64de1',church:'695863c7',barn:'6a153aa8',granary:'1693859d',windmill:'9acbc73e',
  watermill:'92ba2695',warehouse:'fa6637f3',gatehouse:'eb576414',stonehall:'b7f6c281',forge:'00e64de1',keep:'365be143',
  citadel:'5c83d7cf',well:'c0044b0f',tent:'29a7e2e0',wagon:'53b1099d',minehead:'3764bd6b',lumbershed:'5e21bfbc',crane:'837d4e4c',
  village:'2720359a',signpost:'d5cec05f',cart:'0d451d84',haystack:'d6ad6a2d',woodpile:'a1e5079e',fence:'f1fa5cce',crates:'359812ef',
  barrels:'67ec5c86',ruins:'ef9feb66',shrine:'6447b926',cave:'2f1b5ef3','cluster:row':'a9518884','cluster:yard':'1b4bb70a',
  'cluster:farmstead':'eb1b29af','cluster:smithy':'3bb59407','cluster:inn':'c9501397','cluster:chapel':'7a9b0799',
  'cluster:market':'a3121318','cluster:mill':'db85cafe','cluster:lumber':'5e31aab9','cluster:mine':'34c4dd5d',
  'cluster:quarry':'78935dbb','cluster:fishery':'c2f1ff8d','cluster:pasture':'83ff220f','cluster:brewery':'9a4b47e9',
  'cluster:granary':'60b5f3a2','cluster:workshop':'3701de39','cluster:quarter':'757986c1','cluster:camp':'74a46095',
  'cluster:hideout':'029f812c','cluster:travelers':'f7dfedfc','cluster:townhall':'465ee66c','cluster:fort':'191a5a70'},
 // ashgor (build-ashgor.js)
 ashgor:{cottage:'cf76b5b9',townhouse:'35743e12',fisherhut:'2e175851',chapel:'d7310b10',stall:'27601031',tower:'fae00910',yurt:'b5f8e22f',
  longhouse:'339f5c85',tavern:'a94a53b7',smithy:'5eb42a97',church:'f2670bab',barn:'3ede730c',granary:'81c4b7bc',windmill:'0d5cba56',
  watermill:'fa79a59b',warehouse:'a16675eb',gatehouse:'4c91a9cc',hidehall:'d2ed8a05',watchtower:'96f1fdfc',keep:'95ad9d20',
  citadel:'cabc4830',well:'4e92a832',tent:'1af0cad3',wagon:'53b1099d',minehead:'a811a4da',lumbershed:'1101d539',crane:'ccc75fbf',
  village:'52f765ed',signpost:'d5cec05f',cart:'0d451d84',haystack:'d6ad6a2d',woodpile:'a1e5079e',fence:'f1fa5cce',crates:'359812ef',
  barrels:'67ec5c86',chiefyurt:'8160fbc7',warcamp:'a9b79ae7',horselines:'4e60c2d7',ruins:'6f460598',shrine:'a24b6746',
  cave:'2f1b5ef3','cluster:row':'90802765','cluster:yard':'40d5c9c0','cluster:farmstead':'4d4693dd','cluster:smithy':'cb7b9464',
  'cluster:inn':'bdfb1609','cluster:chapel':'09dc3006','cluster:market':'1ecabbc8','cluster:mill':'67a8ea36',
  'cluster:lumber':'e60d1a40','cluster:mine':'9621bae7','cluster:quarry':'625bb6d8','cluster:fishery':'d420b74f',
  'cluster:pasture':'b8033504','cluster:brewery':'0de69691','cluster:granary':'a36670c2','cluster:workshop':'64ff27cc',
  'cluster:quarter':'25d29f13','cluster:camp':'575c5685','cluster:hideout':'4dc505c9','cluster:travelers':'e64b69d3','cluster:townhall':'b240aa1f','cluster:fort':'3adffeef'},
 // sylvan (build-sylvan.js)
 sylvan:{cottage:'218d2f6c',townhouse:'94392b0d',fisherhut:'c0521de9',chapel:'2d43aecb',stall:'49595711',tower:'31702e51',
  longhouse:'e1d3d1a9',tavern:'931fa151',smithy:'acb28fa3',church:'03c86e11',barn:'159238a1',granary:'94955fe2',windmill:'d977d3e5',
  watermill:'76468746',warehouse:'c1f7fb34',gatehouse:'68977b4c',treehouse:'fd4d27dd',elfhall:'3a744598',spire:'9b2296a1',
  keep:'2a9d80fa',citadel:'644e257b',well:'630f4b84',tent:'d0372f8a',wagon:'7ea583a0',minehead:'74011657',lumbershed:'2d989d4a',
  crane:'719a3bb9',village:'308c2746',signpost:'8e8a4d4c',cart:'86d3a9d2',haystack:'d6ad6a2d',woodpile:'a1e5079e',fence:'f1fa5cce',
  crates:'359812ef',barrels:'67ec5c86',ruins:'6f460598',shrine:'a24b6746',cave:'2f1b5ef3','cluster:row':'6367359d',
  'cluster:yard':'b3fb611c','cluster:farmstead':'24b07422','cluster:smithy':'6b47e141','cluster:inn':'9a321c3a',
  'cluster:chapel':'1c54df57','cluster:market':'5ade7537','cluster:mill':'77ed768d','cluster:lumber':'0d854d32',
  'cluster:mine':'4a82c39f','cluster:quarry':'825dbcde','cluster:fishery':'c39e7ce8','cluster:pasture':'b86d650d',
  'cluster:brewery':'665f5b6b','cluster:granary':'b4946a44','cluster:workshop':'ab654ab7','cluster:quarter':'45594043',
  'cluster:camp':'98308f0e','cluster:hideout':'14075e8e','cluster:travelers':'f3c790c8','cluster:townhall':'45099595','cluster:fort':'930767ad'}
};
try{
 const px=c=>c.getContext('2d', { willReadFrequently: true }).getImageData(0,0,c.width,c.height).data,P=['human','dwarf','elf','orc'],FRONT=PX.MODEL_FRONT,SZ=PX.MODEL_SIZES.types,OBJ=PX.MODEL_OBJECTS;
 const fnv=()=>{let h=2166136261;const H={b(a){for(let i=0;i<a.length;i++)h=Math.imul(h^a[i],16777619)>>>0;return H},s(x){x=String(x);for(let i=0;i<x.length;i++)h=Math.imul(h^x.charCodeAt(i),16777619)>>>0;return H},get x(){return h.toString(16).padStart(8,'0')}};return H};
 const all=PX.MODEL_TYPES.concat(PX.MODEL_SITES),miss=PX.BUILDING_TYPES.filter(t=>!PX.MODEL_TYPES.includes(t)),sites=PX.MODEL_SITES;
 ok(!miss.length,'a model for every building type ('+PX.BUILDING_TYPES.length+') and the sites ('+sites.join(', ')+'), and the objects ('+OBJ.join(', ')+')'+(miss.length?': none for '+miss.join(', '):''));
 // the size table: objects 16 px, every building at least 32 (2 x 2 tiles), each type its cell and its households
 {const b=all.filter(t=>!SZ[t]||![16,32,64,128].includes(SZ[t].cell)||(OBJ.includes(t)?SZ[t].cell!==16:SZ[t].cell<32&&t!=='shrine'));
  ok(!b.length&&OBJ.length>=11,'the size table: the '+OBJ.length+' objects and the shrine\'s marker 16 px, every building at least 32 ('+all.filter(t=>SZ[t].cell===32).length+' at 32, '+all.filter(t=>SZ[t].cell===64).length+' at 64; the capital 128)'+(b.length?': '+b.join(', '):''))}
 // the checks on one result: its cell, true pixels, the outline round the silhouette only, no square backdrop
 const bad={cell:[],soft:[],rim:[],edge:[],turn:[]},yaws=t=>FRONT.includes(t)?[0]:PX.MODEL_YAWS;
 const look=(b,id,N)=>{const a=px(b.img);if(b.img.width!==N||b.img.height!==N||b.ax!==0||b.ay!==N||b.clipped)bad.cell.push(id);
   let soft=false,rim=false;const K=(x,y)=>x<0||y<0||x>=N||y>=N?0:b.mask[y*N+x],nb=(x,y)=>[K(x-1,y),K(x+1,y),K(x,y-1),K(x,y+1)],L=(x,y)=>{const i=(y*N+x)*4;return a[i]*.3+a[i+1]*.59+a[i+2]*.11},dark=(x,y)=>{const B=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([u,v])=>K(u,v)===1);return !B.length||L(x,y)<B.reduce((m,[u,v])=>m+L(u,v),0)/B.length};
   for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=(y*N+x)*4,al=a[i+3],k=K(x,y);if(al&&al!==255)soft=true;
     if(k===3&&(!dark(x,y)||!nb(x,y).some(q=>q===0||q===2)))rim=true;if(k===4&&!dark(x,y))rim=true;if(k===1&&nb(x,y).includes(0))rim=true}
   if(soft)bad.soft.push(id);if(rim)bad.rim.push(id);
   // (along each edge of the cell: the picture never the whole edge; its ground and shadow never a straight run longer than a
   // quarter of it, never half of it opaque)
   for(const [c,full] of [[b.img,true],[b.ground,false],[b.shadow,false]]){const d=px(c);for(const e of [0,1,2,3]){let n=0,run=0,best=0;
     for(let k=0;k<N;k++){const [x,y]=[[k,0],[k,N-1],[0,k],[N-1,k]][e],on=d[(y*N+x)*4+3]>0;n+=on;run=on?run+1:0;best=Math.max(best,run)}
     if(full?n>=N:(best>N/4||n>N/2)){bad.edge.push(id+(full?' img':c===b.ground?' ground':' shadow')+' edge '+e);break}}}
   return a.join()};
 const t0=performance.now();let n=0;const plan=[],scl=[],front=[],share=[];
 for(const type of all){const N=SZ[type].cell,isB=N>=32&&!sites.includes(type);
   for(const people of P)for(const seed of [1,2]){const seen=new Set(),sc=new Set();for(const yaw of yaws(type)){const id=type+'/'+people+'/'+seed+'/'+yaw,b=PX.buildingModel({type,people,seed,yaw,fort:2});n++;
     const h=look(b,id,N);if(seen.has(h))bad.turn.push(id);seen.add(h);sc.add([b.scale.u,b.scale.v,b.scale.z,b.scale.o].join());
     // the front view: a door seen, the walls in the door's column at least about a third of the building's height (but a windmill's, its
     // sails before its tower, and a watchtower's, its hut up on posts)
     // (the building whose door it is: its own pixels, the rows they span, the wall pixels in the door's column)
     if(isB&&yaw===0){const F=b.px.F,I=b.px,k=b.buildings.findIndex(d=>d.door===b.door),fo=i=>I.fi[i]>=0&&b.mask[i]===1&&F[I.fi[i]].dw===k?F[I.fi[i]]:null;let y0=N,y1=-1;
       for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(fo(y*N+x)){y0=Math.min(y0,y);y1=Math.max(y1,y)}
       if(!b.door||!b.door.seen)front.push(id+' no door');else{let w=0;for(let y=0;y<N;y++){const f=fo(y*N+b.door.x);if(f&&f.cls==='wall'&&!f.cap)w++}
         const s=w/(y1-y0+1);if(FRONT.includes(type)||type==='windmill'||type==='watchtower')continue;share.push(s);if(s<.3)front.push(id+' walls '+(100*s).toFixed(0)+'%')}}}
     // one model, simply turned: every facing from the same plan (the same parts, sizes, materials and features), at the same scale
     if(!FRONT.includes(type)){const S=PX.MODEL_YAWS.map(yaw=>{const s=PX.buildingModelSpec({type,people,seed,yaw,fort:2});return JSON.stringify(Object.assign({},s,{yaw:0}))});if(S.some(s=>s!==S[0]))plan.push(type+'/'+people+'/'+seed)}
     if(sc.size>1)scl.push(type+'/'+people+'/'+seed+' '+[...sc].join(' | '))}
   for(const env of ['desert','swamp','frost']){const b=PX.buildingModel({type,people:'human',seed:3,env,stilts:env==='swamp',fort:1});look(b,type+'/'+env,N);n++}}
 const ms=performance.now()-t0;
 const L=(k,m)=>ok(!bad[k].length,m+(bad[k].length?': '+bad[k].slice(0,8).join(', ')+(bad[k].length>8?' …':''):''));
 L('cell',n+' models ('+all.length+' types x 4 peoples x 2 seeds x their facings, and each climate): each exactly its cell from the size table, standing on its bottom row, nothing cut off');
 L('soft','every pixel opaque or empty');L('rim','the outline round the silhouette only, a shade darker than the body it borders (engine/pixel.js PX.rim)');L('turn','each facing its own picture');
 ok(!plan.length,'one model a building, simply turned: its four facings from the same plan (the same parts, sizes, materials and features)'+(plan.length?': '+plan.slice(0,6).join(', '):''));
 ok(!scl.length,'and at the same scale in every facing (never drawn smaller turned)'+(scl.length?': '+scl.slice(0,4).join(', '):''));
 ok(!front.length,'every building\'s front view shows its door (a castle centre\'s its gate), its walls at least about a third of its height (least '+(100*Math.min(...share)).toFixed(0)+'%, middle '+(100*share.slice().sort((a,b)=>a-b)[share.length>>1]).toFixed(0)+'%)'+(front.length?': '+front.slice(0,8).join(', '):''));
 // (W4) the side views as wide as the front (within a quarter; PX.MODEL_LONG's long and thin aside); never a 1 px stick above a roof
 // (a column's topmost pixels a pixel wide for 2 or more, standing on what is below: a finial, a cone's tip, a pole); and no sprite of
 // one material (a building 3 or more, an object 2 or more, each at least 3% of its pixels)
 {const thin=[],lines=[],mono=[],LONG=PX.MODEL_LONG||{},MAT=PX.MODEL_MAT;let least=9,lt='';
  const width=b=>{const N=b.cell;let x0=N,x1=-1;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(b.mask[y*N+x]===1){if(x<x0)x0=x;if(x>x1)x1=x}return x1-x0+1};
  const stick=b=>{const N=b.cell,B=(x,y)=>x>=0&&y>=0&&x<N&&y<N&&b.mask[y*N+x]===1,one=(x,y)=>B(x,y)&&!B(x-1,y)&&!B(x+1,y);
    for(let x=0;x<N;x++){let y=0;while(y<N&&!B(x,y))y++;let k=0;while(one(x,y+k))k++;if(k>=2&&B(x,y+k))return x+','+y}return null};
  for(const type of all)for(const people of P)for(const seed of [1,2]){const ws=[];for(const yaw of yaws(type)){const b=PX.buildingModel({type,people,seed,yaw,fort:2}),s=stick(b);if(s)lines.push(type+'/'+people+'/'+seed+'/'+yaw+' at '+s);ws.push(width(b));
      if(yaw===0&&people==='human'){const n={},N=b.cell;let t=0;for(let i=0;i<N*N;i++)if(b.mask[i]===1){t++;const m=MAT[b.px.m[i]];n[m]=(n[m]||0)+1}if(t&&Object.values(n).filter(c=>c>=t*.03).length<(N>=32?3:2))mono.push(type+'/'+seed+' '+Object.keys(n).join('/'))}}
    if(ws.length===4&&SZ[type].cell>=32&&!LONG[type]){const r=Math.min(ws[1],ws[3])/ws[0];if(r<least){least=r;lt=type+'/'+people+'/'+seed}if(r<.75)thin.push(type+'/'+people+'/'+seed+' '+ws.join('/'))}}
  ok(!thin.length,'every building\'s side views at least three quarters as wide as its front (least '+(100*least).toFixed(0)+'%, '+lt+'; the long and thin aside: '+Object.keys(LONG).join(', ')+')'+(thin.length?': '+thin.slice(0,8).join(', '):''));
  ok(!lines.length,'never a 1 px stick above a roof (a finial, a cone\'s tip, a pole: 2 px or more)'+(lines.length?': '+lines.slice(0,8).join(', '):''));
  ok(!mono.length,'no sprite of one material: a building shows 3 or more, an object 2 or more'+(mono.length?': '+mono.slice(0,8).join(', '):''))}
 L('edge','never a square backdrop: the picture never fills an edge of its cell, its ground and shadow reach the edge only thinly');
 // the castle centres straight on, their gate on the middle column; the capital at 128
 {const g=['keep','citadel','gatehouse','village'].filter(t=>{const b=PX.buildingModel({type:t,people:'human',seed:1,fort:2,yaw:4});return b.yaw!==0||b.gateX!==b.cell/2||!b.marks.gate||Math.abs(b.marks.gate[0]-b.cell/2)>1||!b.flag});
  const c=PX.buildingModel({type:'citadel',people:'human',seed:1,fort:3,capital:true});look(c,'capital',128);
  ok(!g.length&&c.cell===128&&!c.clipped,'the castle centres stand straight on whatever the yaw, their gate on the cell\'s middle column, flying the flag; a capital\'s citadel 128'+(g.length?': '+g.join(', '):''))}
 // the households: each home at least 2 (fewer, bigger houses), work places none
 {const b=[];for(const type of all){const m=PX.buildingModel({type,people:'human',seed:1,fort:1}),D=SZ[type].dwellings,h=m.buildings.filter(x=>x.role==='home');
   if(m.households!==m.buildings.reduce((a,x)=>a+x.dwellings,0)||(SZ[type].cell>=32&&h.some(x=>x.dwellings<2))||(D&&m.households!==D))b.push(type+' '+m.households)}
  const r=PX.clusterModel({kind:'row',people:'human',seed:1}),q=PX.clusterModel({kind:'quarter',people:'human',seed:1});
  ok(!b.length&&r.households>=6&&q.households>r.households*3,'the households: each building\'s from the table, a house at least 2 (a cottage 2, a townhouse 3, a longhouse 4); a town row '+r.households+', a quarter '+q.households+(b.length?': '+b.join(', '):''))}
 // the peoples' roofs, the same whoever holds the place
 {const R={human:['tile','thatch'],dwarf:['slate'],elf:['leaf'],orc:['hide']},b=[];
  for(const people of P)for(const type of ['cottage','townhouse','tavern','church','keep','village']){const s=PX.buildingModelSpec({type,people,seed:1,fort:1});
   const mats=s.parts.filter(p=>p.k==='roof'&&!p.keep&&!/canvas|awning|linen/.test(p.mat)&&p.form!=='flat').map(p=>p.mat).concat(s.parts.filter(p=>p.k==='tower'&&p.roof&&p.roof.form==='cone').map(p=>p.roof.mat));
   if(!mats.length||mats.some(m=>!R[people].includes(m)))b.push(people+' '+type+' '+mats.join('/'))}
  ok(!b.length,'each people its own roof: humans tile (thatch in the country), dwarves slate, elves leaf, orcs hide'+(b.length?': '+b.slice(0,6).join(', '):''))}
 // (W5) the elves' hall without trees, in their own language: no tree's parts (a crown of leaves, a trunk) in its plan or its picture,
 // whoever holds it; the elves' a leaf roof, pale living wood and moon lavender in every facing, an arched door
 {const b=[],MAT=PX.MODEL_MAT;for(const people of P)for(const seed of [1,2]){const s=PX.buildingModelSpec({type:'elfhall',people,seed}),mats=s.parts.flatMap(p=>[p.wall,p.topMat,p.roof&&p.roof.mat]);
   if(s.parts.some(p=>p.rough||p.wall==='log')||mats.some(m=>m==='canopy'||m==='autumn'))b.push(people+'/'+seed+' plan');
   if(people==='elf'&&(!s.parts.some(p=>p.k==='roof'&&p.form==='leaf')||!s.decals.some(d=>d.kind==='DoorLeaf')))b.push('elf/'+seed+' its roof and door');
   for(const yaw of PX.MODEL_YAWS){const m=PX.buildingModel({type:'elfhall',people,seed,yaw}),N=m.cell,seen=new Set();for(let i=0;i<N*N;i++)if(m.mask[i]===1)seen.add(MAT[m.px.m[i]]);
     if(seen.has('canopy')||seen.has('autumn'))b.push(people+'/'+seed+'/'+yaw+' a crown');if(people==='elf'&&!['leaf','elfwood','moon'].every(k=>seen.has(k)))b.push('elf/'+seed+'/'+yaw+' '+[...seen].join('/'))}}
  ok(!b.length,'the elves\' hall stands without trees (no crown or trunk in its plan or picture), in the elves\' language: a leaf roof, pale living wood and moon lavender in every facing, an arched door'+(b.length?': '+b.slice(0,6).join(', '):''))}
 // clusters and camps: turned whole, at near full scale and the same in every facing, their buildings each a kind, a role, a door
 {bad.edge=[];bad.rim=[];bad.cell=[];const bc=[],sc=[],tu=[];let nc=0;for(const kind of PX.CLUSTER_MODELS)for(const people of ['human','orc']){const ss=new Set();for(const yaw of PX.MODEL_YAWS){const b=PX.clusterModel({kind,people,seed:2,yaw}),B=b.buildings||[],id=kind+'/'+yaw+'/'+people;nc++;
    look(b,id,PX.MODEL_SIZES.clusters[kind]);if(!b.role||!B.length||B.some(d=>!d.kind||!d.role||!(d.area>0)||!d.door))bc.push(id+' ('+B.length+')');if(Math.min(b.scale.u,b.scale.v)<.85||b.scale.z<.8)sc.push(id+' '+[b.scale.u,b.scale.v,b.scale.z].join('/'));ss.add([b.scale.u,b.scale.v,b.scale.z].join())}
    if(ss.size>1)tu.push(kind+'/'+people)}
  ok(!bc.length,nc+' clusters and camps ('+PX.CLUSTER_MODELS.join(', ')+') turned to each side: each its role, its buildings each a kind, a role, a footprint and a door'+(bc.length?': '+bc.slice(0,6).join(', '):''));
  ok(!sc.length&&!tu.length,'a cluster turned stands at near its full scale, the same in every facing'+(sc.length||tu.length?': '+sc.concat(tu).slice(0,6).join(', '):''));
  L('cell','the clusters each exactly its cell (64; a quarter 128; a camp 32), nothing cut off');L('edge','the clusters never a square backdrop either');L('rim','the clusters\' outline round the silhouette only');
  const c=PX.clusterModel({kind:'camp',seed:3}),h=PX.clusterModel({kind:'hideout',seed:3});ok(c.marks.fire&&h.marks.fire&&h.flag&&c.cell===32&&h.cell===64,'the camps: tents and wagons round a fire (marks.fire), a hideout 64 with its flag')}
 // (the owner, 2026-10-31: "some clustered builds are a bit off") a cluster's buildings stand apart: seen from its street or either
 // side (its back aside: the yard behind its house), no building's front wall more than half hidden by another piece standing before
 // it (the plan's boxes on the screen: x along it, the depth at the camera's share (PX.MODEL_CAMERA), each part's top with its roof);
 // a row of houses and a quarter are wall to wall, and stalls may stand in a row
 {const pre=n=>n.split('.')[0],D=PX.MODEL_CAMERA.depth,hid=[];
  const solid=Q=>{const rise={};for(const p of Q.parts)if(p.k==='roof')rise[p.on]=Math.max(rise[p.on]||0,p.rise||4);
   return Q.parts.filter(p=>p.name&&p.name.includes('.')&&(p.k==='box'||p.k==='tower')).map(p=>{const r=p.k==='tower'&&(p.r||p.w/2),u=r?[p.c[0]-r,p.c[0]+r]:p.u,v=r?[p.c[1]-r,p.c[1]+r]:p.v,pc=Q.parts.find(q=>q.name&&pre(q.name)===pre(p.name)&&q.dw!=null);
    return{id:pre(p.name),dw:p.dw!=null,stall:!!pc&&Q.dwellings[pc.dw].kind==='stall',u,v,wall:p.z[1],top:p.z[1]+(rise[p.name]||0)+(p.roof&&p.roof.rise||0)}}).filter(p=>p.top>=3)};
  // (a box at a facing: x across the screen, g toward the camera)
  const turn=(p,yaw)=>{const [a,b]=[[1,0],[0,1],[-1,0],[0,-1]][yaw/2],x=[p.u[0]*a-p.v[0]*b,p.u[1]*a-p.v[1]*b],g=[p.u[0]*b+p.v[0]*a,p.u[1]*b+p.v[1]*a];return Object.assign({},p,{x0:Math.min(...x),x1:Math.max(...x),g0:Math.min(...g),g1:Math.max(...g)})};
  for(const culture of PX.MODEL_CULTURES)for(const kind of PX.CLUSTER_MODELS){if(kind==='row'||kind==='quarter')continue;const Q=PX.clusterModelSpec({kind,culture,seed:1,yaw:0}),S=solid(Q);
   for(const yaw of [0,2,6]){const A=S.map(p=>turn(p,yaw));for(const id of new Set(A.filter(p=>p.dw).map(p=>p.id))){const W=A.filter(p=>p.id===id&&p.dw),x0=Math.min(...W.map(p=>p.x0)),x1=Math.max(...W.map(p=>p.x1)),g1=Math.max(...W.map(p=>p.g1)),y1=g1*D,y0=y1-Math.max(...W.map(p=>p.wall));let n=0,c=0;
    for(let x=Math.floor(x0)+.5;x<x1;x++)for(let y=Math.floor(y0)+.5;y<y1;y++){n++;if(A.some(a=>a.id!==id&&!(a.stall&&W[0].stall)&&a.g1>g1+.5&&x>=a.x0&&x<=a.x1&&y>=a.g0*D-a.top&&y<=a.g1*D))c++}
    if(n&&c/n>.5)hid.push(culture+' '+kind+'/'+yaw+' '+id+' '+Math.round(c/n*100)+'%')}}}
  ok(!hid.length,'a cluster\'s buildings stand apart: none more than half hidden behind another, from its street or either side (every culture\'s clusters)'+(hid.length?': '+hid.slice(0,8).join(', '):''))}
 // the snow overlay: by thirds, cached, inside the body and the yard, more with more snow, in shapes rather than a speckle
 {const bs=[];let iso=0,tot=0;for(const type of all){const b=PX.buildingModel({type,people:'human',seed:1}),N=b.cell,gr=px(b.ground);let last=-1;
   if(PX.modelSeason(b,'snow',0)!==null||PX.modelSeason(b,'snow',.3)!==PX.modelSeason(b,'snow',1/3))bs.push(type+' cache');
   for(const a of [1/3,2/3,1]){const s=PX.modelSeason(b,'snow',a),si=px(s.img),sg=px(s.ground);let c=0;
     for(let i=0;i<N*N;i++){if(si[i*4+3]){c++;if(b.mask[i]!==1)bs.push(type+' outside');}if(sg[i*4+3]&&!gr[i*4+3])bs.push(type+' off its ground')}
     if(c<last)bs.push(type+' less at '+a.toFixed(2));last=c;
     if(a===1)for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){const i=y*N+x;if(!si[i*4+3])continue;tot++;if(![i-1,i+1,i-N,i+N].some(j=>si[j*4+3]))iso++}}
   if(!last&&!['fence','signpost'].includes(type))bs.push(type+' no snow')}
  ok(!bs.length,'the snow overlay: none at 0, the same layer for the same third, only on the building and its yard, more as it deepens'+(bs.length?': '+[...new Set(bs)].slice(0,6).join(', '):''));
  ok(iso/Math.max(1,tot)<.04,'full snow in solid shapes, not a speckle: '+(100*iso/Math.max(1,tot)).toFixed(1)+'% of its pixels alone');
  // (no long line of one colour, the owner 2026-11-06: no run of body pixels alike longer than RUNS.len + RUNS.step, across or down)
  {const X=PX.MODEL_RUNS,lim=X.len+X.step,long=[];for(const type of all){const b=PX.buildingModel({type,people:'human',seed:3}),N=b.cell,d=px(b.img);let worst=0;
    for(const across of [true,false])for(let a=0;a<N;a++){let n=1;for(let k=1;k<N;k++){const i=across?a*N+k:k*N+a,j=across?a*N+k-1:(k-1)*N+a;if(b.mask[i]===1&&b.mask[j]===1&&d[i*4]===d[j*4]&&d[i*4+1]===d[j*4+1]&&d[i*4+2]===d[j*4+2]){n++;worst=Math.max(worst,n)}else n=1}}
    if(worst>lim)long.push(type+' '+worst)}
   ok(!long.length,'no long line of one colour on any building (at most '+lim+' alike in a row)'+(long.length?': '+long.slice(0,8).join(', '):''))}
  const b=PX.buildingModel({type:'cottage',people:'human',seed:1,env:'frost'});ok(b.snow&&b.snow.amount===1&&b.groundKey==='snow','the frost has full snow by default, its yard trodden snow')}
 // the same spec, the same pixels: a hash a type and a cluster (INFO), checked against EXPECT once recorded
 {const got={};PX.modelCacheClear();const add=(H,b)=>{H.b(px(b.img)).b(px(b.ground)).b(px(b.shadow));if(b.snow)H.b(px(b.snow.img)).b(px(b.snow.ground));H.s(JSON.stringify([b.flag,b.door,b.windows,b.groundKey,b.buildings.map(d=>[d.kind,d.role,d.area,d.dwellings])]))};
  for(const type of all){const H=fnv();for(const people of P)for(const yaw of yaws(type))add(H,PX.buildingModel({type,people,seed:5,yaw,fort:2}));add(H,PX.buildingModel({type,people:'human',seed:6,env:'frost'}));got[type]=H.x}
  for(const kind of PX.CLUSTER_MODELS){const H=fnv();for(const yaw of PX.MODEL_YAWS)add(H,PX.clusterModel({kind,people:'human',seed:5,yaw}));got['cluster:'+kind]=H.x}
  const again=PX.buildingModel({type:'tavern',people:'elf',seed:5,yaw:2,fort:2});PX.modelCacheClear();const fresh=PX.buildingModel({type:'tavern',people:'elf',seed:5,yaw:2,fort:2});
  ok(px(again.img).join()===px(fresh.img).join()&&px(again.ground).join()===px(fresh.ground).join(),'the same spec draws the same pixels, cached or made afresh');
  const keys=Object.keys(got),diff=keys.filter(k=>EXPECT[k]&&EXPECT[k]!==got[k]),none=keys.filter(k=>!EXPECT[k]);
  info(keys.map(k=>k+':'+got[k]).join(' '));ok(!diff.length&&!none.length,'every type and cluster looks as recorded'+(diff.length?': changed '+diff.join(', '):'')+(none.length?': none recorded for '+none.length:''))
  // (K0) the same a culture: each shared type and its own (its facings, the frost, the desert, the swamp) and each cluster (its
  // facings, the desert) as the culture builds it, checked against its own block of EXPECT_CULTURE, which only its own file changes
  // (re-record only that block: copy its INFO line). Another culture's own types it builds: in EXPECT above
  const OWN=PX.MODEL_OWN||{},byC={};for(const c of Object.keys(EXPECT_CULTURE)){const g={},mine=OWN[c]||[],foreign=Object.values(OWN).flat().filter(t=>!mine.includes(t));
   for(const type of all.filter(t=>!foreign.includes(t))){const H=fnv();for(const yaw of yaws(type))add(H,PX.buildingModel({type,culture:c,seed:5,yaw,fort:2}));
    for(const [env,seed] of [['frost',6],['desert',7],['swamp',8]])add(H,PX.buildingModel({type,culture:c,seed,env,stilts:env==='swamp',fort:1}));g[type]=H.x}
   for(const kind of PX.CLUSTER_MODELS){const H=fnv();for(const yaw of PX.MODEL_YAWS)add(H,PX.clusterModel({kind,culture:c,seed:5,yaw}));add(H,PX.clusterModel({kind,culture:c,seed:7,env:'desert'}));g['cluster:'+kind]=H.x}
   byC[c]=g;info('culture '+c+': '+Object.keys(g).map(k=>k+':'+g[k]).join(' '))}
  const cd=[];for(const c in byC){for(const k in byC[c])if(EXPECT_CULTURE[c][k]!==byC[c][k])cd.push(c+' '+k);for(const k in EXPECT_CULTURE[c])if(!byC[c][k])cd.push(c+' '+k+' (gone)')}
  ok(!cd.length,'each culture\'s types and clusters look as recorded in its own block ('+Object.keys(byC).join(', ')+')'+(cd.length?': changed or new '+cd.slice(0,12).join(', ')+(cd.length>12?' …':''):''))}
 // the cost: a big holding's first view (every type in its facings and every cluster in its 4, made afresh)
 {PX.modelCacheClear();const t1=performance.now();let k=0;for(const type of all)for(const yaw of yaws(type)){PX.buildingModel({type,people:'human',seed:9,yaw,fort:2});k++}
  for(const kind of PX.CLUSTER_MODELS)for(const yaw of PX.MODEL_YAWS){PX.clusterModel({kind,people:'human',seed:9,yaw});k++}const t=performance.now()-t1;
  info('first view: '+k+' models in '+t.toFixed(0)+' ms ('+(t/k).toFixed(1)+' ms each); the sweep above '+n+' in '+ms.toFixed(0)+' ms');ok(t/k<25,'quick enough for a big holding\'s first view: '+(t/k).toFixed(1)+' ms a model')}
 // the cultures (K0, the owner's doc: the culture chooses the architecture, the owner the banners): each its own file, its style
 // table of the one shape with its climates' slots; a spec's culture from its people unless given, the same pixels either way; the
 // Salt League on the Vale's style whoever its people; a holding's centre by tier; each culture's own types
 {const C=PX.MODEL_CULTURES||[],L=PX.MODEL_LOOK||{},want=['vale','league','karn','ashgor','sylvan'],keys=['people','roof','walls','frame','stone','fort','fieldstone','wood','silo','trim','accent','ground','forms','cones','hall','door','win','finial','townhouse','village','swap','desert','swamp','frost'];
  const bad=want.filter(c=>!C.includes(c)||keys.some(k=>!(k in L[c]))||['desert','swamp','frost'].some(k=>typeof L[c][k]!=='object'));
  ok(!bad.length&&want.every(c=>C.includes(c)),'the cultures each register their style (build-vale.js with the League, build-karn.js, build-ashgor.js, build-sylvan.js), a style table of the one shape with desert, swamp and frost slots: '+C.join(', ')+(bad.length?': '+bad.join(', '):''));
  const own={sylvan:['treehouse','elfhall','spire'],karn:['stonehall','forge'],ashgor:['yurt','hidehall','watchtower']},miss=Object.entries(own).flatMap(([c,ts])=>ts.filter(t=>!all.includes(t)).map(t=>c+' '+t));
  ok(!miss.length,'each culture\'s own types are built (any culture may build them): '+Object.entries(own).map(([c,ts])=>c+' '+ts.join('/')).join('; ')+(miss.length?': missing '+miss.join(', '):''));
  const same=(a,b)=>px(a.img).join()===px(b.img).join()&&px(a.ground).join()===px(b.ground).join(),cb=[];
  for(const [pp,c] of Object.entries(PX.CULTURE_OF))for(const type of ['cottage','village','keep','spire']){const a=PX.buildingModel({type,people:pp,seed:3,fort:1}),b=PX.buildingModel({type,culture:c,seed:3,fort:1});
   if(a.culture!==c||b.people!==pp||!same(a,b))cb.push(pp+'/'+type)}
  for(const kind of ['smithy','row'])for(const [pp,c] of Object.entries(PX.CULTURE_OF)){if(!same(PX.clusterModel({kind,people:pp,seed:3}),PX.clusterModel({kind,culture:c,seed:3})))cb.push(pp+' cluster '+kind)}
  ok(!cb.length,'a spec\'s culture is its people\'s own unless given (human vale, dwarf karn, elf sylvan, orc ashgor), the same pixels named either way'+(cb.length?': '+cb.join(', '):''));
  const lg=['cottage','tavern','village','citadel'].filter(type=>{const v=PX.buildingModel({type,culture:'league',people:'human',seed:4,fort:2});return['elf','orc'].some(pp=>{const m=PX.buildingModel({type,culture:'league',people:pp,seed:4,fort:2});return m.culture!=='league'||m.people!==pp||!same(m,v)})});
  ok(!lg.length,'the culture, not the people, chooses the building: a Salt League holding builds alike whether its people are human, elf or orc'+(lg.length?': '+lg.join(', '):''));
  const fs=PX.clusterModel({kind:'smithy',culture:'karn',seed:2}).buildings.map(d=>d.kind),hs=PX.clusterModel({kind:'smithy',culture:'vale',seed:2}).buildings.map(d=>d.kind);
  ok(fs.includes('forge')&&!hs.includes('forge'),'a culture builds its own in place of another in its clusters (look.swap): the Clans\' smithy yard has the forge ('+fs.join(', ')+'), the Vale\'s its smithy');
  const T0={camp:['kind','camp'],hamlet:['kind','yard'],village:['type','village'],fort:['kind','fort'],town:['kind','townhall'],city:['type','citadel'],castle:['type','keep']},cz=[];
  for(const [tier,[k,v]] of Object.entries(T0)){const m=PX.centreModel({tier,people:'dwarf',seed:2,fort:2});if(m[k]!==v||m.culture!=='karn')cz.push(tier)}
  const cap=PX.centreModel({tier:'city',culture:'vale',seed:2});
  ok(!cz.length&&cap.cell===128,'a holding\'s centre by its tier (PX.centreModel): a camp and a hamlet\'s yard, a village, a fort\'s tower and barracks, a town\'s hall and market, a city\'s citadel at 128, a castle\'s keep'+(cz.length?': '+cz.join(', '):''));
  // (last: a culture registered here, built on the Clans: its own type, its plans wrapping the generic, its cluster, its centre)
  const reg=PX.registerBuildStyle('k0test',{from:'karn',look:{roof:'thatch',village:{goods:['crate','crate']}},
    own:{types:{k0hut:{cell:32,dwellings:2,look:{wall:null},plan(Q,o){const dw=Q.home('k0hut');PX.planKit.house(Q,{w:16,d:14,dw,wall:o.look.k0hut.wall||o.wall})}}}},
    types:{cottage(Q,o,base){base(Q,o);Q.prop('barrel',[0,10])}},clusters:{yard(C,base){base(C);PX.planKit.prop(C,'trough',[0,0])}},centres:{town:{type:'keep'}}});
  const sp=PX.buildingModelSpec({type:'cottage',culture:'k0test',seed:2}),hut=PX.buildingModel({type:'k0hut',people:'orc',seed:1}),lk=PX.MODEL_LOOK.k0test;
  ok(reg&&lk.roof==='thatch'&&lk.cones===false&&lk.village.goods[0]==='crate'&&lk.village.door==='Rune'&&sp.parts[sp.parts.length-1].type==='barrel'&&sp.parts[sp.parts.length-1].at.join()==='0,10'&&sp.parts.some(p=>p.k==='roof'&&p.mat==='thatch')
   &&PX.clusterModelSpec({kind:'yard',culture:'k0test',seed:2}).parts.some(p=>p.type==='trough')&&PX.centreModel({tier:'town',culture:'k0test',seed:2}).type==='keep'
   &&PX.MODEL_TYPES.includes('k0hut')&&PX.MODEL_SIZES.types.k0hut.cell===32&&hut.households===2&&hut.cell===32,
   'PX.registerBuildStyle: a culture built on another (from) takes its look and plans where it gives none, its plans wrap the generic (base), its own cluster layout and centre; its own type joins the lists, at its size, built by any culture');
  let late='';try{PX.registerBuildStyle('k0late',{materials:{k0mat:['#ffffff','#cccccc','#888888','#444444']}})}catch(e){late=e.message}
  ok(PX.MODEL_EXTRA&&/before model\.js/.test(late)&&!PX.MODEL_CULTURES.includes('k0late'),'a culture\'s own materials, decal letters and decals go to model.js through PX.MODEL_EXTRA, given before model.js loads (after: refused, '+late+')')}
}catch(e){o.push('EXC '+e.message+'\n'+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.join('\n');document.body.appendChild(d)};
