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
const EXPECT={
 cottage:'34c8560b',townhouse:'985f15f5',fisherhut:'cfe62d10',chapel:'8335688f',stall:'be576182',tower:'8faee54b',yurt:'0beeeb0e',
 longhouse:'f0c49654',tavern:'870e76f7',smithy:'afb5e62c',church:'736c2d01',barn:'af2bc89c',granary:'68d26177',windmill:'984bad07',
 watermill:'0e48ac92',warehouse:'288b33c4',gatehouse:'581ee919',hidehall:'d1d9bd9c',watchtower:'e3db4487',treehouse:'163b0f4c',
 elfhall:'e1b3379f',spire:'95a93ca1',stonehall:'64a3997d',forge:'43fa93a3',keep:'68945526',citadel:'7ed0ffd2',well:'c9ac944c',
 tent:'740d7ba9',wagon:'0a5e0929',minehead:'26cc8bf9',lumbershed:'22bd2373',crane:'d7433000',village:'b4ca20d1',signpost:'5093798c',
 cart:'817fedd1',haystack:'fe798ba8',woodpile:'4e63e063',fence:'4ccfec38',crates:'3bcf5dac',barrels:'3013f7a9',chiefyurt:'8f3f0c2c',
 warcamp:'f2dbe851',horselines:'67682ced',ruins:'b51e510e',shrine:'0119973c',cave:'21dca353','cluster:row':'a5a6b478',
 'cluster:yard':'e32b0691','cluster:farmstead':'280bf6b5','cluster:smithy':'2c24f04b','cluster:inn':'8c8400ac',
 'cluster:chapel':'bc45319f','cluster:market':'705f852c','cluster:mill':'c833ce73','cluster:lumber':'47fd281e',
 'cluster:mine':'735ae22a','cluster:quarry':'5a296bc3','cluster:fishery':'b1198ad0','cluster:pasture':'db5354fa',
 'cluster:brewery':'02bf8a7a','cluster:granary':'3f427385','cluster:workshop':'d57ab4a9','cluster:quarter':'dd437ff9',
 'cluster:camp':'b16be927','cluster:hideout':'b4bc5b43','cluster:travelers':'eaa68ba2'};
// (K0, 2026-10-22: recorded at the split into the cultures' files, every culture on the generic plans with its own style table)
// each culture's own block, which only its own file changes: re-record only that block (its INFO line 'culture <name>: ...')
const EXPECT_CULTURE={
 // vale (build-vale.js)
 vale:{cottage:'9b8c016a',townhouse:'9ee921f4',fisherhut:'a9ba02fa',chapel:'f889742d',stall:'42d9f03c',tower:'34aa3ff9',
  longhouse:'f6b60a2d',tavern:'3725525e',smithy:'a8c6cc87',church:'0f415d72',barn:'123f5c9a',granary:'78b19834',windmill:'77c0ebc5',
  watermill:'694f2543',warehouse:'93809849',gatehouse:'ed3adaf0',keep:'9b0fc426',citadel:'330d6c34',well:'56755f8c',tent:'de057503',
  wagon:'7be171eb',minehead:'447ae4f6',lumbershed:'6b5a6ec9',crane:'e9b2e5fb',village:'d433ea22',signpost:'0c50c7de',
  cart:'7e0c0104',haystack:'0141126c',woodpile:'91289e33',fence:'f1fa5cce',crates:'9dc99dc3',barrels:'52cd4caf',ruins:'804efa00',
  shrine:'ba32e4b3',cave:'e6f63f86','cluster:row':'13cfed64','cluster:yard':'1e959f75','cluster:farmstead':'61bf6f1c',
  'cluster:smithy':'260f5425','cluster:inn':'403393d8','cluster:chapel':'201c185f','cluster:market':'a4a2dc29',
  'cluster:mill':'396c397a','cluster:lumber':'f72e6dcb','cluster:mine':'362ece7a','cluster:quarry':'89113cf7',
  'cluster:fishery':'b452898c','cluster:pasture':'6238788d','cluster:brewery':'9b9d55ee','cluster:granary':'95f67ad3',
  'cluster:workshop':'16a93211','cluster:quarter':'557bb477','cluster:camp':'f2e0be37','cluster:hideout':'3893225d',
  'cluster:travelers':'9285ed08'},
 // league (build-vale.js, on the Vale’s)
 league:{cottage:'e0026d14',townhouse:'54b6ec8c',fisherhut:'3171fded',chapel:'a071ef69',stall:'b97d1b36',tower:'d67dff0f',
  longhouse:'0205715c',tavern:'773217b3',smithy:'782a69a4',church:'113afed9',barn:'c47dd297',granary:'ff10e0bd',windmill:'ce28f19b',
  watermill:'8a71a5d7',warehouse:'8291763c',gatehouse:'f048b0d8',keep:'3805bdd3',citadel:'5d431900',well:'4ebe9842',tent:'68d6d141',
  wagon:'7be171eb',minehead:'447ae4f6',lumbershed:'6f1cf1b9',crane:'807e5f8b',village:'63636303',signpost:'0c50c7de',
  cart:'7e0c0104',haystack:'0141126c',woodpile:'91289e33',fence:'f1fa5cce',crates:'9dc99dc3',barrels:'52cd4caf',ruins:'804efa00',
  shrine:'ba32e4b3',cave:'e6f63f86','cluster:row':'483daef4','cluster:yard':'3d9d2aa1','cluster:farmstead':'b72fd12a',
  'cluster:smithy':'8d905b12','cluster:inn':'b385d4a3','cluster:chapel':'220afa26','cluster:market':'4e514dad',
  'cluster:mill':'4e589d8d','cluster:lumber':'06e575d1','cluster:mine':'716b7049','cluster:quarry':'d8843b0f',
  'cluster:fishery':'d40a528b','cluster:pasture':'8a408352','cluster:brewery':'995a7b67','cluster:granary':'19fdb889',
  'cluster:workshop':'a9a618d3','cluster:quarter':'ef485628','cluster:camp':'ac45f579','cluster:hideout':'0429e275',
  'cluster:travelers':'a90bdc68'},
 // karn (build-karn.js)
 karn:{cottage:'4a425d36',townhouse:'4ed98e54',fisherhut:'75f3aa32',chapel:'6730e8c0',stall:'d2669600',tower:'159eaa4f',
  longhouse:'645104ab',tavern:'41b29164',smithy:'b5a540bf',church:'01009c2e',barn:'3279f39a',granary:'8dd0c3ed',windmill:'304bfc7c',
  watermill:'9bebf06f',warehouse:'6f7a4cd4',gatehouse:'9f0c7b51',stonehall:'2f235361',forge:'b5a540bf',keep:'0a15c33f',
  citadel:'19f52475',well:'0807789e',tent:'ef7a0923',wagon:'7be171eb',minehead:'d4ecf424',lumbershed:'902923b1',crane:'60309761',
  village:'1f335979',signpost:'0c50c7de',cart:'7e0c0104',haystack:'0141126c',woodpile:'91289e33',fence:'f1fa5cce',crates:'9dc99dc3',
  barrels:'52cd4caf',ruins:'b225d5e4',shrine:'ae0815c2',cave:'e6f63f86','cluster:row':'e770cf35','cluster:yard':'e105ed2f',
  'cluster:farmstead':'d7f9a278','cluster:smithy':'571d6c98','cluster:inn':'7df1a642','cluster:chapel':'9b4d7e06',
  'cluster:market':'8d15f7aa','cluster:mill':'9bf51765','cluster:lumber':'db841eea','cluster:mine':'fec17ded',
  'cluster:quarry':'b8b139f1','cluster:fishery':'08b04c2a','cluster:pasture':'c5531294','cluster:brewery':'492ac2e6',
  'cluster:granary':'d78ee17b','cluster:workshop':'3022eba2','cluster:quarter':'329dbbe1','cluster:camp':'d0dad721',
  'cluster:hideout':'5bc351f9','cluster:travelers':'f3676546'},
 // ashgor (build-ashgor.js)
 ashgor:{cottage:'3a1e865e',townhouse:'6978b5f3',fisherhut:'5de9645b',chapel:'ca6bb9f2',stall:'47a4e4b4',tower:'a422859b',yurt:'cc0d22e8',
  longhouse:'33d0cacf',tavern:'768aa82f',smithy:'8c663b65',church:'e491ffb2',barn:'37974e76',granary:'ef556cc3',windmill:'84a9398b',
  watermill:'a2635d7c',warehouse:'e644be97',gatehouse:'88836163',hidehall:'068da549',watchtower:'f14a8eed',keep:'40c9b946',
  citadel:'84c8cf54',well:'7b032ba6',tent:'3be7d91e',wagon:'7be171eb',minehead:'69eb6a7f',lumbershed:'2c806cf7',crane:'7154d567',
  village:'94875589',signpost:'0c50c7de',cart:'7e0c0104',haystack:'0141126c',woodpile:'91289e33',fence:'f1fa5cce',crates:'9dc99dc3',
  barrels:'52cd4caf',chiefyurt:'fb1491fa',warcamp:'287f61a1',horselines:'a69df0b6',ruins:'804efa00',shrine:'ba32e4b3',
  cave:'e6f63f86','cluster:row':'3f6256c3','cluster:yard':'db386909','cluster:farmstead':'f2a35d21','cluster:smithy':'cd8af3e6',
  'cluster:inn':'dfe97c9a','cluster:chapel':'573df1b7','cluster:market':'4f01b3d2','cluster:mill':'c781a49f',
  'cluster:lumber':'d5434ca3','cluster:mine':'20946f3b','cluster:quarry':'a44189fd','cluster:fishery':'3630ce0b',
  'cluster:pasture':'cf0cf9df','cluster:brewery':'b82bf1a4','cluster:granary':'785d27e5','cluster:workshop':'ca262800',
  'cluster:quarter':'f3ca8c30','cluster:camp':'9385ce67','cluster:hideout':'7de362cf','cluster:travelers':'5d9537d5'},
 // sylvan (build-sylvan.js)
 sylvan:{cottage:'2866254a',townhouse:'86862f92',fisherhut:'20f14781',chapel:'7a7c2819',stall:'f9301b85',tower:'63d61cbb',
  longhouse:'a584e630',tavern:'1a1c5129',smithy:'64119c77',church:'d3974598',barn:'7d29fefb',granary:'36e3d966',windmill:'5cf78eae',
  watermill:'4f9ffe6a',warehouse:'8fe43d77',gatehouse:'09bea18e',treehouse:'5480d2a8',elfhall:'4c1d61a4',spire:'3803d41b',
  keep:'8c3509c9',citadel:'b183e65d',well:'123d411b',tent:'2b57db4f',wagon:'dcb20736',minehead:'d521947f',lumbershed:'307b4fff',
  crane:'dfddb665',village:'7a5b355b',signpost:'f1013ad9',cart:'b19a410e',haystack:'0141126c',woodpile:'91289e33',fence:'f1fa5cce',
  crates:'9dc99dc3',barrels:'52cd4caf',ruins:'804efa00',shrine:'ba32e4b3',cave:'e6f63f86','cluster:row':'38d81dde',
  'cluster:yard':'cf83dc75','cluster:farmstead':'ae7a8e4c','cluster:smithy':'5eb5aa8c','cluster:inn':'a12f748a',
  'cluster:chapel':'cadd8877','cluster:market':'382a156d','cluster:mill':'9b705b7a','cluster:lumber':'ef70bb60',
  'cluster:mine':'49122f9e','cluster:quarry':'e4c72230','cluster:fishery':'b4e086e1','cluster:pasture':'b2b02b35',
  'cluster:brewery':'44a4308f','cluster:granary':'81669ce5','cluster:workshop':'562f714a','cluster:quarter':'a9d7e778',
  'cluster:camp':'4625d501','cluster:hideout':'c11ca49f','cluster:travelers':'f49cda9b'}
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
   let soft=false,rim=false;const K=(x,y)=>x<0||y<0||x>=N||y>=N?0:b.mask[y*N+x],nb=(x,y)=>[K(x-1,y),K(x+1,y),K(x,y-1),K(x,y+1)];
   for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=(y*N+x)*4,al=a[i+3],k=K(x,y);if(al&&al!==255)soft=true;
     if(k===3&&(!(a[i]===0x1a&&a[i+1]===0x1c&&a[i+2]===0x26)||!nb(x,y).some(q=>q===0||q===2)))rim=true;if(k===4&&!(a[i]===0x1a&&a[i+1]===0x1c&&a[i+2]===0x26))rim=true;if(k===1&&nb(x,y).includes(0))rim=true}
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
 L('soft','every pixel opaque or empty');L('rim','the navy outline round the silhouette only');L('turn','each facing its own picture');
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
  const T0={camp:['kind','camp'],hamlet:['kind','yard'],village:['type','village'],town:['type','citadel'],city:['type','citadel'],castle:['type','keep']},cz=[];
  for(const [tier,[k,v]] of Object.entries(T0)){const m=PX.centreModel({tier,people:'dwarf',seed:2,fort:2});if(m[k]!==v||m.culture!=='karn')cz.push(tier)}
  const cap=PX.centreModel({tier:'city',culture:'vale',seed:2});
  ok(!cz.length&&cap.cell===128,'a holding\'s centre by its tier (PX.centreModel): a camp and a hamlet\'s yard, a village, a town\'s citadel, a city\'s at 128, a castle\'s keep'+(cz.length?': '+cz.join(', '):''));
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
