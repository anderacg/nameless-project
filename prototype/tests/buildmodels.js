'use strict';
// Every building as a model (engine/buildmodels.js, the world-map building redesign at the owner's scale, stage 3's models; the game
// still draws the old ones): a model for every one of PX.BUILDING_TYPES and the sites (ruins, shrine, cave), each people, its facings
// (4; the castle centres straight on), the climates; each at its size from the one table (PX.MODEL_SIZES: objects 16, every building
// at least 32), nothing cut off, true pixels, the navy outline round the silhouette only; one model a building, simply turned (its
// four facings from the same plan: the same parts, sizes and features, at the same scale); the front view shows a door, its walls at
// least about a third of the building's height; (W4) its side views at least three quarters of its front's width (the long and thin
// aside), never a 1 px stick above a roof (authored fine poles and pennants aside), never a sprite of one material; never a square backdrop (the picture never fills a whole edge of its cell; its ground
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
// (keep re-recorded 2026-11-10, on purpose, in EXPECT, vale's and league's blocks (the cultures that build the shared keep): the owner,
// "the castle building looks a bit odd for the balcony vs tower roof": a keep whose towers wear cones now roofs its donjon too (a hip
// roof over its battlements) and its turrets rise over it, its low windows left off where its walls' towers stand. Were keep 1b27855b,
// vale dc351a52, league 3e85bdbb. Proof: 6e16d3b (the commit before) gives the old values)
// (re-recorded 2026-11-17, on purpose, in EXPECT and every culture's block, every value that moved: the owner's own changes since
// 4afa310 (which, with 696f4ca and 20df4c1 after it, gives every value before): c463fba, "medieval props" (a woodpile's logs lengthwise,
// no log ends to the front, the Logs decal and a log end's top without a chequer: model.js, buildmodels.js; so the cottage,
// townhouse, longhouse, tavern, smithy, lumbershed, cart, woodpile, the camps' log pieces and tents and every cluster holding them);
// e88f78c, the camps' fires in the open before their tents (cluster:travelers, camp, hideout); 4f6204a, the camp's tents and fire
// spaced so none hides another (cluster:camp). Proof: 20df4c1 gives every value before; 6643ae6 (the keep's lancets) moves none)
// Re-recorded 2026-11-21 from untouched codex 5ecd53f. Approved cloth/pennants (508ad8c) and Vale roof (a24474d); see doc/RUNTIME_REFACTOR_BASELINE.md.
const EXPECT={
 // (the camp's tents and pieces recorded 2026-11-14, new types (engine/build-camp.js: the owner, "make more tent variety", "it should
 //  be top down view"); every other type and cluster unchanged)
 // (camp_ridge, camp_bell, camp_tepee, camp_yurt, camp_pavilion, camp_leanto, camp_wagon, camp_stall re-recorded the same day, on purpose,
 //  here and in every culture's block: the owner, "so their portion fit with the unit sprites?": 32 px cells at the figures' 5 px a
 //  metre, a man walking through a tent's door, a yurt's wall a man high; the camp set keeps the objects' rules)
 // (camp_ridge, camp_bell, camp_tepee, camp_yurt, camp_pavilion, camp_leanto, camp_pup re-recorded and camp_marquee, camp_porch, camp_hut
 //  recorded the same day, on purpose, here and in every culture's block: the owner, "also please add the tent variety": each tent
 //  varies by its seed (its size, its door, a porch, bands, a store yurt, gear before it), and three styles more)
 camp_ridge:'41f214ef', camp_bell:'a00cb86c', camp_tepee:'8ee2bbe2', camp_yurt:'debbea23', camp_pavilion:'db8633a9', camp_leanto:'0810aa48', camp_pup:'2175db7d',camp_marquee:'6d188498',camp_porch:'b894e8c7',camp_hut:'14bc425c', camp_barrels:'ff4a8816', camp_crates:'84e17250', camp_sacks:'0fa03893', camp_logs:'f954202a', camp_wagon:'4325596f', camp_cart:'feb6232a', camp_stall:'42f15a39', camp_shrine:'d233aea2', camp_rack:'a3051e89', camp_mound:'cf56eac3',
 cottage:'70e1e989',townhouse:'a878948c',fisherhut:'06c8f023',chapel:'ee701b42',stall:'4767df6f',tower:'39385c43',yurt:'e4f2a051',
 longhouse:'7662b79f',tavern:'c7ba38b8',smithy:'b0819529',church:'67220c36',barn:'49d574b4',granary:'f988c2b4',windmill:'c772137a',
 watermill:'0951441d',warehouse:'9aec496c',gatehouse:'9dba6038',hidehall:'a95045b6',watchtower:'136aae17',treehouse:'9c1e7963',
 elfhall:'85e2227d',spire:'b2011903',stonehall:'4a3fa0ba',forge:'54f9007c',keep:'1fe24a40',citadel:'9921b68c',well:'b2fa5ca0',
 tent:'13411678',wagon:'fdb79bc0',minehead:'45d6809c',lumbershed:'61622b7d',crane:'d840c1d9',village:'8186a1f9',signpost:'bc1b0551',
 cart:'d133bacc',haystack:'1e55c871',woodpile:'3d2d74b9',fence:'4ccfec38',crates:'2ec14f27',barrels:'38164d9d',chiefyurt:'24010cc2',
 warcamp:'e5d74e75',horselines:'42069c16',ruins:'0aa26bed',shrine:'8479cf14',cave:'48639c12','cluster:row':'5f7b791a',
 'cluster:yard':'0fdcb778','cluster:farmstead':'77f281a9','cluster:smithy':'0be9cc86','cluster:inn':'a1ab7573',
 'cluster:chapel':'d7239881','cluster:market':'5046c0c6','cluster:mill':'a0084f53','cluster:lumber':'c59d9684',
 'cluster:mine':'f56a0cf6','cluster:quarry':'5107366e','cluster:fishery':'a64e77f9','cluster:pasture':'4774fd4a',
 'cluster:brewery':'af57dd89','cluster:granary':'689640f3','cluster:workshop':'8739af5c','cluster:quarter':'9cdf4e51',
 'cluster:camp':'cf52188c','cluster:hideout':'4d701c66','cluster:travelers':'8399e3e7','cluster:townhall':'a1c3ecb7','cluster:fort':'868f900d'};
// (K0, 2026-10-22: recorded at the split into the cultures' files, every culture on the generic plans with its own style table)
// each culture's own block, which only its own file changes: re-record only that block (its INFO line 'culture <name>: ...')
const EXPECT_CULTURE={
 // vale (build-vale.js)
 vale:{camp_ridge:'d021427d', camp_bell:'6435e7dd', camp_tepee:'f3366fdc', camp_yurt:'70228908', camp_pavilion:'f5e472bc', camp_leanto:'77820105', camp_pup:'8e33161d',camp_marquee:'2ed8e73c',camp_porch:'91a4e2eb',camp_hut:'8be0d3c1', camp_barrels:'41982d39', camp_crates:'85141062', camp_sacks:'75b1d4ee', camp_logs:'8454436f', camp_wagon:'b039ffc4', camp_cart:'1b938449', camp_stall:'62f78699', camp_shrine:'c49bb3f1', camp_rack:'e320f251', camp_mound:'5adb8995',cottage:'1675dbaa',townhouse:'c4c6e8ab',fisherhut:'cded18e1',chapel:'e009cbba',stall:'ec2b41a4',tower:'392e5970',
  longhouse:'0793e251',tavern:'cc00a199',smithy:'5e056d49',church:'5c23d20b',barn:'2d350b53',granary:'4443b66b',windmill:'beca74c4',
  watermill:'a20a03ac',warehouse:'e5ea1bf1',gatehouse:'aea9c5e4',keep:'e712bce0',citadel:'31572182',well:'b9d0bf82',tent:'5ac8ad61',
  wagon:'7f883ead',minehead:'e3a3c641',lumbershed:'b89220e7',crane:'3684fe3d',village:'9b82ff3d',signpost:'6aa0a05a',
  cart:'bfc36e03',haystack:'a0645989',woodpile:'5d14f430',fence:'f1fa5cce',crates:'b10eb20e',barrels:'2d8697bb',ruins:'14952244',
  shrine:'021850c8',cave:'78ef68d1','cluster:row':'d4fcb733','cluster:yard':'1de0b6d3','cluster:farmstead':'cc1ae121',
  'cluster:smithy':'e9ff97f2','cluster:inn':'26e89d07','cluster:chapel':'cdb18f9d','cluster:market':'2c2e118e',
  'cluster:mill':'ab653154','cluster:lumber':'210322b8','cluster:mine':'3069756e','cluster:quarry':'933c973d',
  'cluster:fishery':'1cad2544','cluster:pasture':'343ffb06','cluster:brewery':'4b355125','cluster:granary':'78a8f82b',
  'cluster:workshop':'47cbe8d5','cluster:quarter':'56769c21','cluster:camp':'e218825e','cluster:hideout':'fdcec507',
  'cluster:travelers':'0a287e3d','cluster:townhall':'544ad52a','cluster:fort':'45e95b3c'},
 // league (build-vale.js, on the Vale’s)
 league:{camp_ridge:'d021427d', camp_bell:'6435e7dd', camp_tepee:'f3366fdc', camp_yurt:'70228908', camp_pavilion:'f5e472bc', camp_leanto:'77820105', camp_pup:'8e33161d',camp_marquee:'2ed8e73c',camp_porch:'91a4e2eb',camp_hut:'8be0d3c1', camp_barrels:'41982d39', camp_crates:'85141062', camp_sacks:'75b1d4ee', camp_logs:'8454436f', camp_wagon:'b039ffc4', camp_cart:'1b938449', camp_stall:'62f78699', camp_shrine:'c49bb3f1', camp_rack:'e320f251', camp_mound:'5adb8995',cottage:'5c8bfd68',townhouse:'20ef3234',fisherhut:'10e0915a',chapel:'c2560107',stall:'01fe78d2',tower:'4b3e2e96',
  longhouse:'4f3ac671',tavern:'c7d0d701',smithy:'69744288',church:'307a7d73',barn:'2c5e5154',granary:'fdc46d73',windmill:'ceab0d14',
  watermill:'ad359c76',warehouse:'67233d64',gatehouse:'517ba774',keep:'5c0c5c8d',citadel:'3f21cca9',well:'df8286cb',tent:'b51b91e2',
  wagon:'7f883ead',minehead:'e3a3c641',lumbershed:'32285418',crane:'d1abb9f9',village:'b7c4d6b0',signpost:'6aa0a05a',
  cart:'bfc36e03',haystack:'a0645989',woodpile:'5d14f430',fence:'f1fa5cce',crates:'b10eb20e',barrels:'2d8697bb',ruins:'14952244',
  shrine:'021850c8',cave:'78ef68d1','cluster:row':'5ee0baf0','cluster:yard':'a3b6b6e7','cluster:farmstead':'a25296f7',
  'cluster:smithy':'a9654850','cluster:inn':'ce9d64c3','cluster:chapel':'8556e1da','cluster:market':'239fc002',
  'cluster:mill':'9fa3ed8c','cluster:lumber':'59f77591','cluster:mine':'17c92d2c','cluster:quarry':'de546355',
  'cluster:fishery':'ce836676','cluster:pasture':'ee68b8f5','cluster:brewery':'04aae1ff','cluster:granary':'1dc4fd5b',
  'cluster:workshop':'90e44e85','cluster:quarter':'d8aed571','cluster:camp':'57841c3f','cluster:hideout':'0e1a81ab',
  'cluster:travelers':'3d6ca223','cluster:townhall':'632c4d70','cluster:fort':'e34c0c27'},
 // karn (build-karn.js)
 karn:{camp_ridge:'d021427d', camp_bell:'6435e7dd', camp_tepee:'f3366fdc', camp_yurt:'70228908', camp_pavilion:'f5e472bc', camp_leanto:'77820105', camp_pup:'8e33161d',camp_marquee:'2ed8e73c',camp_porch:'91a4e2eb',camp_hut:'8be0d3c1', camp_barrels:'41982d39', camp_crates:'85141062', camp_sacks:'75b1d4ee', camp_logs:'8454436f', camp_wagon:'b039ffc4', camp_cart:'1b938449', camp_stall:'62f78699', camp_shrine:'c49bb3f1', camp_rack:'e320f251', camp_mound:'5adb8995',cottage:'dbcb9235',townhouse:'5513b821',fisherhut:'7fbeb008',chapel:'ea458768',stall:'e2608f07',tower:'81c477b4',
  longhouse:'f9065fee',tavern:'4dd7eb61',smithy:'d5993b4b',church:'3869f8e0',barn:'8f2323ad',granary:'5e37c04b',windmill:'a74c05f5',
  watermill:'69fc95ef',warehouse:'ef03b828',gatehouse:'469e4902',stonehall:'3da7d6a2',forge:'d5993b4b',keep:'2eb70a33',
  citadel:'74d12b1c',well:'cd20df02',tent:'a9f97f45',wagon:'7f883ead',minehead:'bb61184a',lumbershed:'4b9b3d85',crane:'c85dbed4',
  village:'a427f522',signpost:'6aa0a05a',cart:'bfc36e03',haystack:'a0645989',woodpile:'5d14f430',fence:'f1fa5cce',crates:'b10eb20e',
  barrels:'2d8697bb',ruins:'6c98f60e',shrine:'68eb9fa3',cave:'78ef68d1','cluster:row':'c5a38258','cluster:yard':'fc4d2a3e',
  'cluster:farmstead':'383d9b36','cluster:smithy':'4d8b972d','cluster:inn':'d1674647','cluster:chapel':'4d467794',
  'cluster:market':'91c94384','cluster:mill':'24a1c758','cluster:lumber':'53b8db6b','cluster:mine':'5a2a4448',
  'cluster:quarry':'a0e4dc61','cluster:fishery':'22d78ce3','cluster:pasture':'13315aa6','cluster:brewery':'e64b4aba',
  'cluster:granary':'491bd57d','cluster:workshop':'529f9af2','cluster:quarter':'13b849b6','cluster:camp':'4a0e82ad',
  'cluster:hideout':'70ddba43','cluster:travelers':'f26c8561','cluster:townhall':'2109b346','cluster:fort':'96f168f0'},
 // ashgor (build-ashgor.js)
 ashgor:{camp_ridge:'d021427d', camp_bell:'6435e7dd', camp_tepee:'f3366fdc', camp_yurt:'70228908', camp_pavilion:'f5e472bc', camp_leanto:'77820105', camp_pup:'8e33161d',camp_marquee:'2ed8e73c',camp_porch:'91a4e2eb',camp_hut:'8be0d3c1', camp_barrels:'41982d39', camp_crates:'85141062', camp_sacks:'75b1d4ee', camp_logs:'8454436f', camp_wagon:'b039ffc4', camp_cart:'1b938449', camp_stall:'62f78699', camp_shrine:'c49bb3f1', camp_rack:'e320f251', camp_mound:'5adb8995',cottage:'dd863fde',townhouse:'de788e25',fisherhut:'336d8639',chapel:'47d105c0',stall:'affb38f8',tower:'c194b62e',yurt:'9e37a10e',
  longhouse:'1c128df3',tavern:'948955f2',smithy:'33cb353d',church:'f871bc81',barn:'9eee6250',granary:'c55a50d9',windmill:'c856d3d9',
  watermill:'ec4f5735',warehouse:'8e3235cf',gatehouse:'baaffc3c',hidehall:'e0dd4ec6',watchtower:'5afb43ab',keep:'af531d7a',
  citadel:'a540020d',well:'5d96bda2',tent:'df17ff1f',wagon:'7f883ead',minehead:'e1d369ff',lumbershed:'0a071b75',crane:'2eeee207',
  village:'d308a4d9',signpost:'6aa0a05a',cart:'bfc36e03',haystack:'a0645989',woodpile:'5d14f430',fence:'f1fa5cce',crates:'b10eb20e',
  barrels:'2d8697bb',chiefyurt:'fb33a873',warcamp:'c11d2269',horselines:'92ec79c0',ruins:'14952244',shrine:'021850c8',
  cave:'78ef68d1','cluster:row':'bc7e0c3e','cluster:yard':'d8cad183','cluster:farmstead':'ed422389','cluster:smithy':'1a685dfe',
  'cluster:inn':'e4b35e60','cluster:chapel':'c3189fe2','cluster:market':'1a2d8d00','cluster:mill':'59b5f61d',
  'cluster:lumber':'71590d79','cluster:mine':'0bb61df0','cluster:quarry':'edcccac5','cluster:fishery':'8f3d1f4e',
  'cluster:pasture':'d4adc599','cluster:brewery':'248e332f','cluster:granary':'4f1ee46b','cluster:workshop':'d7807989',
  'cluster:quarter':'c535b3a2','cluster:camp':'10c67fde','cluster:hideout':'df9e5cbe','cluster:travelers':'a97a1634','cluster:townhall':'53bb9f6c','cluster:fort':'5d674376'},
 // sylvan (build-sylvan.js)
 sylvan:{camp_ridge:'d021427d', camp_bell:'6435e7dd', camp_tepee:'f3366fdc', camp_yurt:'70228908', camp_pavilion:'f5e472bc', camp_leanto:'77820105', camp_pup:'8e33161d',camp_marquee:'2ed8e73c',camp_porch:'91a4e2eb',camp_hut:'8be0d3c1', camp_barrels:'41982d39', camp_crates:'85141062', camp_sacks:'75b1d4ee', camp_logs:'8454436f', camp_wagon:'b039ffc4', camp_cart:'1b938449', camp_stall:'62f78699', camp_shrine:'c49bb3f1', camp_rack:'e320f251', camp_mound:'5adb8995',cottage:'bbaa13c0',townhouse:'c3a1a81c',fisherhut:'81764468',chapel:'e048514e',stall:'5be53a2f',tower:'fb52ea5a',
  longhouse:'657d772d',tavern:'8dbe8428',smithy:'4f5997a2',church:'213adec0',barn:'23f3b7e8',granary:'79f64200',windmill:'d62672b9',
  watermill:'9a79d992',warehouse:'d7ea4d02',gatehouse:'f3b5f2b8',treehouse:'994d39b3',elfhall:'1900a0d5',spire:'39f2950a',
  keep:'1c46113b',citadel:'320dfc10',well:'958f322d',tent:'6edac7e0',wagon:'f893a049',minehead:'4152beca',lumbershed:'4a03568f',
  crane:'eac8b977',village:'a766e63b',signpost:'8e402bdd',cart:'c167ec23',haystack:'a0645989',woodpile:'5d14f430',fence:'f1fa5cce',
  crates:'b10eb20e',barrels:'2d8697bb',ruins:'14952244',shrine:'021850c8',cave:'78ef68d1','cluster:row':'d4844488',
  'cluster:yard':'91812699','cluster:farmstead':'0d7fdf6f','cluster:smithy':'b7806072','cluster:inn':'3d643a9a',
  'cluster:chapel':'60a08da3','cluster:market':'20622f29','cluster:mill':'b8772497','cluster:lumber':'e73e71b1',
  'cluster:mine':'f6baa3de','cluster:quarry':'0dbc9d2a','cluster:fishery':'2a70e3cb','cluster:pasture':'11c139a8',
  'cluster:brewery':'d04b3e21','cluster:granary':'77282aae','cluster:workshop':'edbb2247','cluster:quarter':'ee301016',
  'cluster:camp':'82cf669c','cluster:hideout':'4f63c25c','cluster:travelers':'157c17b0','cluster:townhall':'56023621','cluster:fort':'2bb5810d'}
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
 // (a camp's tents, wagon and stall (engine/build-camp.js) are 32 px to stand at a man's scale (the owner, 2026-11-14: "so their
 // portion fit with the unit sprites?"), but are no buildings: a tent's walls are its roof, a pavilion wider than it is deep;
 // they keep the objects' rules)
 const CAMP=PX.CAMP_TYPES||[];
 for(const type of all){const N=SZ[type].cell,isB=N>=32&&!sites.includes(type)&&!CAMP.includes(type);
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
 // (W4) the side views as wide as the front (within a quarter; PX.MODEL_LONG's long and thin aside); never a 1 px stick above a roof (authored fine poles and pennants aside)
 // (a column's topmost pixels a pixel wide for 2 or more, standing on what is below: a finial, a cone's tip, a pole); and no sprite of
 // one material (a building 3 or more, an object 2 or more, each at least 3% of its pixels)
 {const thin=[],lines=[],mono=[],LONG=PX.MODEL_LONG||{},MAT=PX.MODEL_MAT;let least=9,lt='';
  const width=b=>{const N=b.cell;let x0=N,x1=-1;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(b.mask[y*N+x]===1){if(x<x0)x0=x;if(x>x1)x1=x}return x1-x0+1};
  const stick=b=>{const N=b.cell,B=(x,y)=>x>=0&&y>=0&&x<N&&y<N&&b.mask[y*N+x]===1,one=(x,y)=>B(x,y)&&!B(x-1,y)&&!B(x+1,y);
    for(let x=0;x<N;x++){let y=0;while(y<N&&!B(x,y))y++;let k=0;while(one(x,y+k))k++;if(k>=2&&B(x,y+k)){const I=b.px,F=I.F,f=F[I.fi[y*N+x]];if(f&&f.fine)continue;return x+','+y}}return null};
  for(const type of all)for(const people of P)for(const seed of [1,2]){const ws=[];for(const yaw of yaws(type)){const b=PX.buildingModel({type,people,seed,yaw,fort:2}),s=stick(b);if(s)lines.push(type+'/'+people+'/'+seed+'/'+yaw+' at '+s);ws.push(width(b));
      if(yaw===0&&people==='human'){const n={},N=b.cell;let t=0;for(let i=0;i<N*N;i++)if(b.mask[i]===1){t++;const m=MAT[b.px.m[i]];n[m]=(n[m]||0)+1}if(t&&Object.values(n).filter(c=>c>=t*.03).length<(N>=32&&!CAMP.includes(type)?3:2))mono.push(type+'/'+seed+' '+Object.keys(n).join('/'))}}
    if(ws.length===4&&SZ[type].cell>=32&&!LONG[type]&&!CAMP.includes(type)){const r=Math.min(ws[1],ws[3])/ws[0];if(r<least){least=r;lt=type+'/'+people+'/'+seed}if(r<.75)thin.push(type+'/'+people+'/'+seed+' '+ws.join('/'))}}
  ok(!thin.length,'every building\'s side views at least three quarters as wide as its front (least '+(100*least).toFixed(0)+'%, '+lt+'; the long and thin aside: '+Object.keys(LONG).join(', ')+')'+(thin.length?': '+thin.slice(0,8).join(', '):''));
  ok(!lines.length,'never a 1 px stick above a roof (authored fine poles and pennants aside) (a finial, a cone\'s tip, a pole: 2 px or more)'+(lines.length?': '+lines.slice(0,8).join(', '):''));
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
 // the rotors (2026-11-08, the owner: "draw mills separately from the building to animate it"): a windmill's sails and a watermill's
 // wheel are not in its picture but its rotors (m.rotors: hub, axes), drawn apart turning (PX.rotorFrame); the building the same size
 // (the rotor's ghost counts in the fit); with PX.ROTORS off, drawn into the picture as before
 {const R=PX.ROTORS,bad=[];for(const c of PX.MODEL_CULTURES)for(const type of ['windmill','watermill'])for(const seed of [1,2,3]){const m=PX.buildingModel({type,culture:c,seed});
    const r=m.rotors&&m.rotors[0];if(!r||r.kind!==(type==='windmill'?'sails':'wheel')||!(Math.hypot(...r.ez)>3)||r.c[0]<0||r.c[0]>m.cell||r.c[1]<0||r.c[1]>m.cell)bad.push(c+' '+type+' '+seed)}
  ok(!bad.length,'every culture\'s windmill carries its sails and every watermill its wheel as a rotor, its hub on the picture'+(bad.length?': '+bad.join(', '):''));
  const m=PX.buildingModel({type:'windmill',culture:'vale',seed:1}),r=m.rotors[0],a=PX.rotorFrame(r,0),b=PX.rotorFrame(r,.4),pa=px(a.img).join(),pb=px(b.img).join(),again=PX.rotorFrame(r,Math.PI/2);
  ok(pa!==pb&&px(again.img).join()===pa&&a.img===again.img,'its sails drawn at their angle: another a fifth of a turn on, the same a quarter on (four sails), a frame kept');
  const side=PX.rotorFrame(PX.buildingModel({type:'windmill',culture:'vale',seed:1,yaw:2}).rotors[0],.3),sp=px(side.img);let n=0;for(let i=3;i<sp.length;i+=4)n+=sp[i]?1:0;ok(n>=6,'seen from the side, edge on, its sails still show ('+n+' px)');
  const sc0=m.scale;R.on=false;PX.modelCacheClear();try{const o=PX.buildingModel({type:'windmill',culture:'vale',seed:1});ok(!(o.rotors&&o.rotors.length)&&o.scale.u===sc0.u,'with PX.ROTORS off the sails are in its picture as before, the building at the same scale ('+sc0.u+')')}
  finally{R.on=true;PX.modelCacheClear()}}
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
