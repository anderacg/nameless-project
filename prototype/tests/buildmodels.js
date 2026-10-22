'use strict';
// Every building as a model (engine/buildmodels.js, the world-map building redesign at the owner's scale, stage 3's models; the game
// still draws the old ones): a model for every one of PX.BUILDING_TYPES and the sites (ruins, shrine, cave), each people, its facings
// (4; the castle centres straight on), the climates; each at its size from the one table (PX.MODEL_SIZES: objects 16, every building
// at least 32), nothing cut off, true pixels, the navy outline round the silhouette only; one model a building, simply turned (its
// four facings from the same plan: the same parts, sizes and features, at the same scale); the front view shows a door, its walls at
// least about a third of the building's height; never a square backdrop (the picture never fills a whole edge of its cell; its ground
// and shadow reach the edge only thinly); the households each building holds; the snow overlay by thirds, cached, inside the body
// and the ground, more with more snow, solid shapes rather than a speckle; the peoples' roofs; the clusters' buildings and roles; the
// same spec the same pixels (a hash a type, to see when the look changes); and the cost of a big holding's first view.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
// (recorded for the owner's scale, stage 3's models (2026-10-22: the gentler camera, every type redrawn at its new size, one model
// turned): a type's and a cluster's every picture, ground, shadow and snow, hashed)
const EXPECT={
 cottage:'9a69b2ba',townhouse:'9486ed79',fisherhut:'4192c731',chapel:'be9795e7',stall:'4ba88882',tower:'d024000d',yurt:'8b28e8a0',
 longhouse:'d6c7f332',tavern:'0f3dc6eb',smithy:'96b97920',church:'46765b6f',barn:'7d74d737',granary:'1906de53',
 windmill:'99ad964f',watermill:'28996351',warehouse:'0301a3fa',gatehouse:'27a301fb',hidehall:'0ca45384',watchtower:'d45e7a55',
 treehouse:'3763cd68',elfhall:'fae96b88',spire:'a592bd68',stonehall:'637afac1',forge:'ccf1d04e',keep:'3badf2d8',
 citadel:'897b5953',well:'057aa991',tent:'4569443b',wagon:'d140df8c',minehead:'38a4616a',lumbershed:'e318622d',crane:'d3a95420',
 village:'c01d1937',signpost:'fd808ea1',cart:'8aa37f61',haystack:'ea40a382',woodpile:'92a6cc47',fence:'4ccfec38',
 crates:'06e49070',barrels:'3013f7a9',ruins:'5d408579',shrine:'64783cdc',cave:'b4e6b75a','cluster:row':'8c24ded9',
 'cluster:yard':'49547920','cluster:farmstead':'dfe3e940','cluster:smithy':'bc27a2b1','cluster:inn':'e29bcbeb',
 'cluster:chapel':'90562acd','cluster:market':'46a027e6','cluster:mill':'87f150a6','cluster:lumber':'1ce0a714',
 'cluster:mine':'5a80461c','cluster:quarry':'9b14844c','cluster:fishery':'161630ad','cluster:pasture':'82f38384',
 'cluster:brewery':'72fb477a','cluster:granary':'84033469','cluster:workshop':'b8f66b85','cluster:quarter':'05095416',
 'cluster:camp':'3958e5a6','cluster:hideout':'203819db','cluster:travelers':'37015955'};
try{
 const px=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data,P=['human','dwarf','elf','orc'],FRONT=PX.MODEL_FRONT,SZ=PX.MODEL_SIZES.types,OBJ=PX.MODEL_OBJECTS;
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
     // the front view: a door seen, the walls in the door's column at least about a third of the building's height
     // (the building whose door it is: its own pixels, the rows they span, the wall pixels in the door's column)
     if(isB&&yaw===0){const F=b.px.F,I=b.px,k=b.buildings.findIndex(d=>d.door===b.door),fo=i=>I.fi[i]>=0&&b.mask[i]===1&&F[I.fi[i]].dw===k?F[I.fi[i]]:null;let y0=N,y1=-1;
       for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(fo(y*N+x)){y0=Math.min(y0,y);y1=Math.max(y1,y)}
       if(!b.door||!b.door.seen)front.push(id+' no door');else{let w=0;for(let y=0;y<N;y++){const f=fo(y*N+b.door.x);if(f&&f.cls==='wall'&&!f.cap)w++}
         const s=w/(y1-y0+1);if(FRONT.includes(type))continue;share.push(s);if(s<.3)front.push(id+' walls '+(100*s).toFixed(0)+'%')}}}
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
  info(keys.map(k=>k+':'+got[k]).join(' '));ok(!diff.length&&!none.length,'every type and cluster looks as recorded'+(diff.length?': changed '+diff.join(', '):'')+(none.length?': none recorded for '+none.length:''))}
 // the cost: a big holding's first view (every type in its facings and every cluster in its 4, made afresh)
 {PX.modelCacheClear();const t1=performance.now();let k=0;for(const type of all)for(const yaw of yaws(type)){PX.buildingModel({type,people:'human',seed:9,yaw,fort:2});k++}
  for(const kind of PX.CLUSTER_MODELS)for(const yaw of PX.MODEL_YAWS){PX.clusterModel({kind,people:'human',seed:9,yaw});k++}const t=performance.now()-t1;
  info('first view: '+k+' models in '+t.toFixed(0)+' ms ('+(t/k).toFixed(1)+' ms each); the sweep above '+n+' in '+ms.toFixed(0)+' ms');ok(t/k<25,'quick enough for a big holding\'s first view: '+(t/k).toFixed(1)+' ms a model')}
}catch(e){o.push('EXC '+e.message+'\n'+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.join('\n');document.body.appendChild(d)};
