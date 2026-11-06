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
const EXPECT={
 cottage:'e510339b',townhouse:'ad695eea',fisherhut:'d282f42b',chapel:'2889c5c3',stall:'4a1bf651',tower:'20c2851b',yurt:'a4385a81',
 longhouse:'c60f3313',tavern:'2100e43c',smithy:'2fd06b7c',church:'86265dda',barn:'f4af7947',granary:'0a2e6666',windmill:'80b3df62',
 watermill:'296cd4de',warehouse:'f3508657',gatehouse:'0e837bdb',hidehall:'9d4a9b22',watchtower:'c10e79a9',treehouse:'b4f86081',
 elfhall:'acc3ed1f',spire:'9bf728e9',stonehall:'492b7273',forge:'3207c0f2',keep:'bcd1edb4',citadel:'b8feafba',well:'a37ee39f',
 tent:'c7549918',wagon:'441be824',minehead:'b0c6d9fb',lumbershed:'fb66401a',crane:'890c2925',village:'2ba3d88f',signpost:'f0f7e32d',
 cart:'7803a78d',haystack:'89d63720',woodpile:'96cf2f85',fence:'4ccfec38',crates:'b1a3740c',barrels:'9c96b9f5',chiefyurt:'57e8ced6',
 warcamp:'bf78bf72',horselines:'87addb77',ruins:'7df82f5e',shrine:'94bb4075',cave:'bc4512f1','cluster:row':'dc1e37f8',
 'cluster:yard':'85059e88','cluster:farmstead':'820de933','cluster:smithy':'e4465f49','cluster:inn':'24750dce',
 'cluster:chapel':'dda796cb','cluster:market':'78057948','cluster:mill':'71b2afba','cluster:lumber':'dda2681b',
 'cluster:mine':'8528be1b','cluster:quarry':'233d5f2a','cluster:fishery':'e069bbfc','cluster:pasture':'013bb928',
 'cluster:brewery':'4cbd4e6b','cluster:granary':'228d16f2','cluster:workshop':'80af3e59','cluster:quarter':'a6c42190',
 'cluster:camp':'16cb9063','cluster:hideout':'8f631136','cluster:travelers':'ca0283cd','cluster:townhall':'204b0ae7','cluster:fort':'2041f9d6'};
// (K0, 2026-10-22: recorded at the split into the cultures' files, every culture on the generic plans with its own style table)
// each culture's own block, which only its own file changes: re-record only that block (its INFO line 'culture <name>: ...')
const EXPECT_CULTURE={
 // vale (build-vale.js)
 vale:{cottage:'5ee8f48b',townhouse:'56e6e6b0',fisherhut:'0ab415c3',chapel:'f6860bf5',stall:'b2d9e5fb',tower:'eae2fe2a',
  longhouse:'082f766c',tavern:'9beeebcd',smithy:'a333c224',church:'ce79df8d',barn:'d2d25bdb',granary:'8d722b9b',windmill:'e4934e6b',
  watermill:'6c66f473',warehouse:'8834abe4',gatehouse:'38a5db15',keep:'0a4ad793',citadel:'c51bef8a',well:'d0cd3f42',tent:'f0c70823',
  wagon:'92b8cc48',minehead:'3e3da957',lumbershed:'938c9604',crane:'08e4dcd0',village:'e10c6b25',signpost:'f899a136',
  cart:'07d1919c',haystack:'ef6c2610',woodpile:'5df4fda2',fence:'f1fa5cce',crates:'345a7247',barrels:'ad4aea99',ruins:'c40cc63c',
  shrine:'84bc6ef7',cave:'68c202b2','cluster:row':'ab7ec3b4','cluster:yard':'b1529478','cluster:farmstead':'25d812d1',
  'cluster:smithy':'d5169a2e','cluster:inn':'599a28a3','cluster:chapel':'00fa4181','cluster:market':'bcfc75f7',
  'cluster:mill':'d7a4db4d','cluster:lumber':'e3b2d665','cluster:mine':'ec2ffde3','cluster:quarry':'f4ea3435',
  'cluster:fishery':'dfebb23e','cluster:pasture':'c76c8b81','cluster:brewery':'863f754b','cluster:granary':'9fb695f4',
  'cluster:workshop':'f50cd1cd','cluster:quarter':'d5b2e235','cluster:camp':'a93a5afc','cluster:hideout':'50c66f2c',
  'cluster:travelers':'8e0560f1','cluster:townhall':'af4928a5','cluster:fort':'674adf33'},
 // league (build-vale.js, on the Vale’s)
 league:{cottage:'6296bebe',townhouse:'f33095f1',fisherhut:'6a5d30fc',chapel:'104cc9bb',stall:'8e46637e',tower:'9e756ca3',
  longhouse:'6e9930ce',tavern:'549c5a15',smithy:'a49390dd',church:'bfc1fe34',barn:'5dab1c8d',granary:'19708d19',windmill:'d1df81e2',
  watermill:'6bfc32ef',warehouse:'ba15804a',gatehouse:'68434335',keep:'3397a8ef',citadel:'7c9aa7e9',well:'2af137de',tent:'aa66fd66',
  wagon:'92b8cc48',minehead:'3e3da957',lumbershed:'5dceb7a7',crane:'07017f0c',village:'a8a4a2f5',signpost:'f899a136',
  cart:'07d1919c',haystack:'ef6c2610',woodpile:'5df4fda2',fence:'f1fa5cce',crates:'345a7247',barrels:'ad4aea99',ruins:'c40cc63c',
  shrine:'84bc6ef7',cave:'68c202b2','cluster:row':'7193b0fb','cluster:yard':'0a7747a9','cluster:farmstead':'0c5635a2',
  'cluster:smithy':'d1ce5f84','cluster:inn':'2f28b3a8','cluster:chapel':'1e102de8','cluster:market':'83f50c12',
  'cluster:mill':'55b345c2','cluster:lumber':'5d38f2fd','cluster:mine':'95bfc69c','cluster:quarry':'fdd45fde',
  'cluster:fishery':'5bc03bf6','cluster:pasture':'60a85911','cluster:brewery':'b71790f4','cluster:granary':'3bdd43f7',
  'cluster:workshop':'d0d715bb','cluster:quarter':'37d0c881','cluster:camp':'0fabd815','cluster:hideout':'c8fa42b2',
  'cluster:travelers':'a13bc39b','cluster:townhall':'1f06338e','cluster:fort':'c21b908d'},
 // karn (build-karn.js)
 karn:{cottage:'1a750df8',townhouse:'8faec2c5',fisherhut:'f7e58082',chapel:'c604e183',stall:'5ea5b5aa',tower:'844dbe93',
  longhouse:'b3f1c3d0',tavern:'bcfc3683',smithy:'0f02c7bf',church:'19ffc641',barn:'e76f44e8',granary:'9a36700e',windmill:'fc5c318c',
  watermill:'954a30f0',warehouse:'de8ec62b',gatehouse:'2cb57e4f',stonehall:'130c055d',forge:'0f02c7bf',keep:'f6cf2843',
  citadel:'31739417',well:'2f9d683a',tent:'313e4657',wagon:'92b8cc48',minehead:'0bb34696',lumbershed:'6ed0f858',crane:'91dc4e62',
  village:'6df1ebd5',signpost:'f899a136',cart:'07d1919c',haystack:'ef6c2610',woodpile:'5df4fda2',fence:'f1fa5cce',crates:'345a7247',
  barrels:'ad4aea99',ruins:'c30205e6',shrine:'bb60ddf2',cave:'68c202b2','cluster:row':'66001989','cluster:yard':'dcdde776',
  'cluster:farmstead':'68586a16','cluster:smithy':'3a133a45','cluster:inn':'49a71751','cluster:chapel':'7c328f82',
  'cluster:market':'9295b0a1','cluster:mill':'50f696d6','cluster:lumber':'b11cba92','cluster:mine':'9ecb2b49',
  'cluster:quarry':'7cfe5c14','cluster:fishery':'28592737','cluster:pasture':'a3d5e3d6','cluster:brewery':'b0c62cd0',
  'cluster:granary':'6fb508b5','cluster:workshop':'40917857','cluster:quarter':'dff2c118','cluster:camp':'ce87f10e',
  'cluster:hideout':'1b2eec3e','cluster:travelers':'c1aabcc9','cluster:townhall':'c844986f','cluster:fort':'84c15cc0'},
 // ashgor (build-ashgor.js)
 ashgor:{cottage:'e42e52a7',townhouse:'727ad1c1',fisherhut:'dcdaf5fd',chapel:'fa937bc7',stall:'46c7ab4b',tower:'9fa2d091',yurt:'ac03b721',
  longhouse:'a6d2d32f',tavern:'10aaf832',smithy:'745e65bc',church:'62d6e1da',barn:'dbb9c8e1',granary:'3ac3b301',windmill:'e4697cef',
  watermill:'d889e11b',warehouse:'e2f9173f',gatehouse:'f223325f',hidehall:'4b7d2eee',watchtower:'e2b6a2db',keep:'e2594394',
  citadel:'13792405',well:'e239a54a',tent:'726201a2',wagon:'92b8cc48',minehead:'ae61ee5d',lumbershed:'fc963a92',crane:'989ec09d',
  village:'efc853ce',signpost:'f899a136',cart:'07d1919c',haystack:'ef6c2610',woodpile:'5df4fda2',fence:'f1fa5cce',crates:'345a7247',
  barrels:'ad4aea99',chiefyurt:'b9835214',warcamp:'609d87c3',horselines:'9edd2c51',ruins:'c40cc63c',shrine:'84bc6ef7',
  cave:'68c202b2','cluster:row':'5dcb78dc','cluster:yard':'138b9d03','cluster:farmstead':'c90c97f1','cluster:smithy':'c514314b',
  'cluster:inn':'377b6be3','cluster:chapel':'3d261cd6','cluster:market':'6d6acec2','cluster:mill':'36ed28ac',
  'cluster:lumber':'1bc0598b','cluster:mine':'3c594143','cluster:quarry':'6ad5256f','cluster:fishery':'919989cf',
  'cluster:pasture':'9bf5dee0','cluster:brewery':'0ecec0ed','cluster:granary':'25ef66b8','cluster:workshop':'45f8b401',
  'cluster:quarter':'1bd384e6','cluster:camp':'14ffea52','cluster:hideout':'41d14b69','cluster:travelers':'003c6138','cluster:townhall':'7235e2ab','cluster:fort':'7a94f769'},
 // sylvan (build-sylvan.js)
 sylvan:{cottage:'6e22b8b7',townhouse:'fedc1de2',fisherhut:'fc7c9969',chapel:'319ff3c2',stall:'351a9af6',tower:'d3d0b528',
  longhouse:'a5a079f7',tavern:'2528c41d',smithy:'7380d607',church:'b4824e42',barn:'0920e7fa',granary:'8a469e15',windmill:'571df6fd',
  watermill:'d56201c0',warehouse:'bc827583',gatehouse:'3c34286a',treehouse:'bb8f1f36',elfhall:'273787db',spire:'8b89f1da',
  keep:'d450eab2',citadel:'c0ac8787',well:'627fb474',tent:'2b3afd64',wagon:'494fc036',minehead:'7c60f474',lumbershed:'391c44e1',
  crane:'cec22a51',village:'bfa7a59d',signpost:'d5835576',cart:'4734497a',haystack:'ef6c2610',woodpile:'5df4fda2',fence:'f1fa5cce',
  crates:'345a7247',barrels:'ad4aea99',ruins:'c40cc63c',shrine:'84bc6ef7',cave:'68c202b2','cluster:row':'72777e9f',
  'cluster:yard':'b3bdca66','cluster:farmstead':'5facff0c','cluster:smithy':'aebd15de','cluster:inn':'addb9f01',
  'cluster:chapel':'b4614e8c','cluster:market':'5eabc110','cluster:mill':'e82461ee','cluster:lumber':'60dc4c89',
  'cluster:mine':'aeaa83c4','cluster:quarry':'f0d645dd','cluster:fishery':'33f382fe','cluster:pasture':'db5724a4',
  'cluster:brewery':'f5dc019d','cluster:granary':'351ace14','cluster:workshop':'7c60d9de','cluster:quarter':'25309734',
  'cluster:camp':'21d516f4','cluster:hideout':'acbe5075','cluster:travelers':'67cf1082','cluster:townhall':'4993cfd4','cluster:fort':'cfc1aeb8'}
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
