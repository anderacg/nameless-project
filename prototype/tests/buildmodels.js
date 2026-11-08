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
// (re-recorded 2026-11-07, on purpose, every type and cluster and each culture's block: the owner, "some world map sprites still has black
// outer line instead of darker shading colour": an outline by a dark body a lighter shade of it and no navy (engine/pixel.js PX.RIM.dark),
// and each outline pixel shaded again from the body as it finally stands (engine/model.js). Proof: PX.RIM.dark null gives the old values)
// (every type and cluster and each culture's block re-recorded 2026-11-08, on purpose: the owner, "the outer line should be darker
// shading not completely black" and "inside the structure itself it looks like merging together": a building's outline the body's
// mean x .66 (x .8 by a dark body), no navy, never under a floor (PX.BUILD_RIM, PX.buildRim), and a seam inside it where two parts
// meet, the one behind .66 darker (PX.SEAM, model.js). Proof: PX.BUILD_RIM.on and PX.SEAM.on false give every value below as it was)
// (ruins, shrine and cave re-recorded 2026-11-08, on purpose, in EXPECT and every culture's block: the owner, "add more variations for
// caves, hideouts, places with more detail; currently stone pillars look not like stone pillar": each now one of four by its seed (a
// colonnade of real columns: plinth, round shaft, capital; a tower stump; a temple's steps; standing stones of rough rock; a column
// gate; a cairn; a cliff cave, a low mound, twin crags). Proof: 99c96eb (the commit before) gives the old values. Were ruins 885cc7fd,
// shrine f895e57b, cave fdff66d2; in the blocks ruins 7aa41f18 (karn e883e3f3), shrine dd70f9ee (karn 7ef8af13), cave 77e05999)
const EXPECT={
 cottage:'566a0878',townhouse:'fb9511de',fisherhut:'2d6d2bf1',chapel:'762d3bbe',stall:'48ec423e',tower:'6acd7ef2',yurt:'86b1b101',
 longhouse:'d3212831',tavern:'f53264e7',smithy:'75f35aaf',church:'cc12a724',barn:'6e101819',granary:'de56ef0e',windmill:'65d7585c',
 watermill:'0d75b86e',warehouse:'e1d6564f',gatehouse:'086b156b',hidehall:'29442873',watchtower:'fee9afe9',treehouse:'15172543',
 elfhall:'c3176da7',spire:'b2b90839',stonehall:'3a7b6dc9',forge:'ca2badee',keep:'1b27855b',citadel:'2dd8a20d',well:'33e99b97',
 tent:'df76730a',wagon:'fdb79bc0',minehead:'422e6aa4',lumbershed:'84bc6106',crane:'797e027a',village:'669be472',signpost:'bc1b0551',
 cart:'8db7e550',haystack:'1e55c871',woodpile:'a63e45e5',fence:'4ccfec38',crates:'2ec14f27',barrels:'38164d9d',chiefyurt:'b2ed7c38',
 warcamp:'5ab3c989',horselines:'107a7786',ruins:'0aa26bed',shrine:'8479cf14',cave:'48639c12','cluster:row':'6310eca6',
 'cluster:yard':'0fdcb778','cluster:farmstead':'77f281a9','cluster:smithy':'3d8aabd7','cluster:inn':'d5167dce',
 'cluster:chapel':'d7239881','cluster:market':'66dac74d','cluster:mill':'21bd192f','cluster:lumber':'ac7479a1',
 'cluster:mine':'f56a0cf6','cluster:quarry':'d4dc561e','cluster:fishery':'a64e77f9','cluster:pasture':'4774fd4a',
 'cluster:brewery':'af57dd89','cluster:granary':'fa7f1ff9','cluster:workshop':'8739af5c','cluster:quarter':'467598b5',
 'cluster:camp':'cc3c4924','cluster:hideout':'22f8b99c','cluster:travelers':'a1abf71c','cluster:townhall':'2b66b7a9','cluster:fort':'12e702bf'};
// (K0, 2026-10-22: recorded at the split into the cultures' files, every culture on the generic plans with its own style table)
// each culture's own block, which only its own file changes: re-record only that block (its INFO line 'culture <name>: ...')
const EXPECT_CULTURE={
 // vale (build-vale.js)
 vale:{cottage:'596a2542',townhouse:'493f1766',fisherhut:'cded18e1',chapel:'e009cbba',stall:'34446497',tower:'392e5970',
  longhouse:'150da3e0',tavern:'a2e66800',smithy:'5e056d49',church:'5c23d20b',barn:'2d350b53',granary:'4443b66b',windmill:'8649a830',
  watermill:'7915c527',warehouse:'e5ea1bf1',gatehouse:'aea9c5e4',keep:'dc351a52',citadel:'31572182',well:'b9d0bf82',tent:'ae51fca4',
  wagon:'7f883ead',minehead:'e3a3c641',lumbershed:'3424207a',crane:'3684fe3d',village:'9b82ff3d',signpost:'6aa0a05a',
  cart:'28df91db',haystack:'a0645989',woodpile:'99d02398',fence:'f1fa5cce',crates:'b10eb20e',barrels:'2d8697bb',ruins:'14952244',
  shrine:'021850c8',cave:'78ef68d1','cluster:row':'398f34f4','cluster:yard':'eb0ce1a9','cluster:farmstead':'cc1ae121',
  'cluster:smithy':'b5109198','cluster:inn':'c1fbac0c','cluster:chapel':'418271b7','cluster:market':'0f6cea48',
  'cluster:mill':'66ecef12','cluster:lumber':'a08a2b30','cluster:mine':'ab2b3d72','cluster:quarry':'a323eb3b',
  'cluster:fishery':'1cad2544','cluster:pasture':'343ffb06','cluster:brewery':'4b355125','cluster:granary':'5a88d6a1',
  'cluster:workshop':'9a2b5a9d','cluster:quarter':'aabf0a35','cluster:camp':'8e0c1bce','cluster:hideout':'266cc5ac',
  'cluster:travelers':'6db648a9','cluster:townhall':'4a86be91','cluster:fort':'468efc26'},
 // league (build-vale.js, on the Vale’s)
 league:{cottage:'ac264369',townhouse:'5dc0a33c',fisherhut:'10e0915a',chapel:'c2560107',stall:'7a3166a8',tower:'4b3e2e96',
  longhouse:'4e06b740',tavern:'6f8e047b',smithy:'69744288',church:'307a7d73',barn:'2c5e5154',granary:'fdc46d73',windmill:'5d700f4b',
  watermill:'5f57d598',warehouse:'67233d64',gatehouse:'517ba774',keep:'3e85bdbb',citadel:'3f21cca9',well:'df8286cb',tent:'b51b91e2',
  wagon:'7f883ead',minehead:'e3a3c641',lumbershed:'7c51be02',crane:'d1abb9f9',village:'b7c4d6b0',signpost:'6aa0a05a',
  cart:'28df91db',haystack:'a0645989',woodpile:'99d02398',fence:'f1fa5cce',crates:'b10eb20e',barrels:'2d8697bb',ruins:'14952244',
  shrine:'021850c8',cave:'78ef68d1','cluster:row':'5ee0baf0','cluster:yard':'54b1814f','cluster:farmstead':'a25296f7',
  'cluster:smithy':'70966ffa','cluster:inn':'ff1ff1c6','cluster:chapel':'0cb25743','cluster:market':'aef268ad',
  'cluster:mill':'acda581c','cluster:lumber':'6598c76e','cluster:mine':'66f50c5f','cluster:quarry':'dbab4436',
  'cluster:fishery':'ce836676','cluster:pasture':'ee68b8f5','cluster:brewery':'04aae1ff','cluster:granary':'da60ee7d',
  'cluster:workshop':'6139d9fa','cluster:quarter':'d8aed571','cluster:camp':'896e7cce','cluster:hideout':'a27af816',
  'cluster:travelers':'74b15e56','cluster:townhall':'fada6cef','cluster:fort':'5896a98e'},
 // karn (build-karn.js)
 karn:{cottage:'8a5cd67f',townhouse:'5513b821',fisherhut:'7fbeb008',chapel:'ea458768',stall:'f4079858',tower:'81c477b4',
  longhouse:'dd6027ed',tavern:'5462b3a2',smithy:'d5993b4b',church:'3869f8e0',barn:'8f2323ad',granary:'5e37c04b',windmill:'c2a31ead',
  watermill:'4afb2c1b',warehouse:'ef03b828',gatehouse:'469e4902',stonehall:'3da7d6a2',forge:'d5993b4b',keep:'2eb70a33',
  citadel:'74d12b1c',well:'cd20df02',tent:'d5e846c9',wagon:'7f883ead',minehead:'bb61184a',lumbershed:'c61b276b',crane:'c85dbed4',
  village:'a427f522',signpost:'6aa0a05a',cart:'28df91db',haystack:'a0645989',woodpile:'99d02398',fence:'f1fa5cce',crates:'b10eb20e',
  barrels:'2d8697bb',ruins:'6c98f60e',shrine:'68eb9fa3',cave:'78ef68d1','cluster:row':'1d4e5f46','cluster:yard':'fc4d2a3e',
  'cluster:farmstead':'383d9b36','cluster:smithy':'d19df676','cluster:inn':'d1674647','cluster:chapel':'4d467794',
  'cluster:market':'7f84b2bb','cluster:mill':'c80258e2','cluster:lumber':'d42f1913','cluster:mine':'5a2a4448',
  'cluster:quarry':'f01e0ab8','cluster:fishery':'22d78ce3','cluster:pasture':'13315aa6','cluster:brewery':'e64b4aba',
  'cluster:granary':'f2bd699f','cluster:workshop':'529f9af2','cluster:quarter':'75fd632e','cluster:camp':'04081813',
  'cluster:hideout':'29a74435','cluster:travelers':'aef56f8d','cluster:townhall':'287bbe84','cluster:fort':'fd167952'},
 // ashgor (build-ashgor.js)
 ashgor:{cottage:'b17b9fb1',townhouse:'1550b382',fisherhut:'d708d2b4',chapel:'d7c681c6',stall:'9ac45d76',tower:'afb99a51',yurt:'21f7117d',
  longhouse:'4b1c638a',tavern:'6058997f',smithy:'0b9b85de',church:'2b0a3357',barn:'1c30bfd1',granary:'331ae95b',windmill:'09d07c66',
  watermill:'69b37468',warehouse:'efeb83b4',gatehouse:'e41e61a5',hidehall:'de00969a',watchtower:'5d7bcadc',keep:'1735c8a4',
  citadel:'7d4d5948',well:'3056a38a',tent:'81523c0e',wagon:'7f883ead',minehead:'af48187f',lumbershed:'b1e5fcb5',crane:'5beb8a76',
  village:'090a1b0e',signpost:'6aa0a05a',cart:'28df91db',haystack:'a0645989',woodpile:'99d02398',fence:'f1fa5cce',crates:'b10eb20e',
  barrels:'2d8697bb',chiefyurt:'00a92765',warcamp:'5cb9dcc8',horselines:'4310f68e',ruins:'14952244',shrine:'021850c8',
  cave:'78ef68d1','cluster:row':'46787328','cluster:yard':'c3facc5a','cluster:farmstead':'91945f24','cluster:smithy':'dc9249a8',
  'cluster:inn':'0a2fc031','cluster:chapel':'180343ad','cluster:market':'25fd00b5','cluster:mill':'ccca2669',
  'cluster:lumber':'eb529bb6','cluster:mine':'2186bd52','cluster:quarry':'131a6aea','cluster:fishery':'48aec8da',
  'cluster:pasture':'5df02688','cluster:brewery':'1a8193b1','cluster:granary':'44faa862','cluster:workshop':'6dd65b34',
  'cluster:quarter':'9153b352','cluster:camp':'ea7a6c6f','cluster:hideout':'0a9ac9b4','cluster:travelers':'26b7209a','cluster:townhall':'f657025a','cluster:fort':'d8cafa80'},
 // sylvan (build-sylvan.js)
 sylvan:{cottage:'1e3b72af',townhouse:'c3a1a81c',fisherhut:'81764468',chapel:'e048514e',stall:'715229ce',tower:'fb52ea5a',
  longhouse:'f695c381',tavern:'00c9616e',smithy:'4f5997a2',church:'213adec0',barn:'23f3b7e8',granary:'79f64200',windmill:'0be9bdbb',
  watermill:'61caaec9',warehouse:'d7ea4d02',gatehouse:'f3b5f2b8',treehouse:'994d39b3',elfhall:'1900a0d5',spire:'39f2950a',
  keep:'1c46113b',citadel:'320dfc10',well:'958f322d',tent:'6edac7e0',wagon:'f893a049',minehead:'4152beca',lumbershed:'73c6e961',
  crane:'eac8b977',village:'a766e63b',signpost:'8e402bdd',cart:'3c2bd557',haystack:'a0645989',woodpile:'99d02398',fence:'f1fa5cce',
  crates:'b10eb20e',barrels:'2d8697bb',ruins:'14952244',shrine:'021850c8',cave:'78ef68d1','cluster:row':'d4844488',
  'cluster:yard':'a1508683','cluster:farmstead':'491eae10','cluster:smithy':'0612cd26','cluster:inn':'3d643a9a',
  'cluster:chapel':'a2f4e4c6','cluster:market':'d2a07d8a','cluster:mill':'bc34e134','cluster:lumber':'f3ccce18',
  'cluster:mine':'9141220d','cluster:quarry':'888256d1','cluster:fishery':'2a70e3cb','cluster:pasture':'11c139a8',
  'cluster:brewery':'d04b3e21','cluster:granary':'5d8ee038','cluster:workshop':'dfaf8454','cluster:quarter':'ee301016',
  'cluster:camp':'eb7797fb','cluster:hideout':'b6cd646c','cluster:travelers':'b3658304','cluster:townhall':'4c861811','cluster:fort':'0d0582a8'}
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
 const LOOKS=['shrine','ruins','cave','smithy','barn','granary','warehouse','chapel','windmill','watermill','townhouse','elfhall','treehouse','lumbershed','yurt','hidehall','stonehall'];
 const t0=performance.now();let n=0;const plan=[],scl=[],front=[],share=[];
 for(const type of all){const N=SZ[type].cell,isB=N>=32&&!sites.includes(type);
   // (the types in several looks by their dice (the sites, and since 2026-11-08 the smithy, barn, granary, warehouse, chapel,
   // windmill, watermill, and the cultures' townhouse, elf hall, treehouse, lumber shed, yurt, hide hall, stone hall): more seeds, so
   // every look meets the rules)
   for(const people of P)for(const seed of LOOKS.includes(type)?[1,2,3,4,5,6,7,8,9,10]:[1,2]){const seen=new Set(),sc=new Set();for(const yaw of yaws(type)){const id=type+'/'+people+'/'+seed+'/'+yaw,b=PX.buildingModel({type,people,seed,yaw,fort:2});n++;
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
