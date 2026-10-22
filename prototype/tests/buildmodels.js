'use strict';
// Every building as a model (engine/buildmodels.js, the world-map building redesign's stage 2; the game still draws the old ones):
// a model for every one of PX.BUILDING_TYPES and the built sites (ruins, shrine), each people, its facings (4; the castle centres
// straight on), the climates; each exactly its old cell (so stage 3 swaps it in lot for lot), nothing cut off, true pixels, the navy
// outline round the silhouette only; the weak spots of stage 1 fixed (a 16 px building turned to a side as wide as it is tall or
// near, a cluster by any street's side at near full scale); never a square backdrop (the picture never fills a whole edge of its
// cell; its ground and shadow reach the cell's edge only thinly); the snow overlay by thirds, cached, inside the body and the
// ground, more with more snow, solid shapes rather than a speckle; the peoples' roofs; the clusters' buildings and roles; the same
// spec the same pixels (a hash a type, to see when the look changes); and the cost of a big holding's first view.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
// (recorded when stage 2 was drawn: a type's and a cluster's every picture, ground, shadow and snow, hashed)
const EXPECT={
 cottage:'01a4aedf',townhouse:'689aa233',fisherhut:'1b2cfc8f',chapel:'5087d625',stall:'9803ccf6',tower:'34a9bd4c',yurt:'c446ef76',
 longhouse:'64f2af25',tavern:'2fab4a66',smithy:'26f00d00',church:'1097c032',barn:'e472df69',granary:'de5b1c17',
 windmill:'0f1ea8e0',watermill:'201f54de',warehouse:'8e34ed5b',gatehouse:'87c2fe70',hidehall:'22b00707',watchtower:'2291ab83',
 treehouse:'f2559e4b',elfhall:'9ee655ee',spire:'aa63d595',stonehall:'0956dc08',forge:'a7170b03',keep:'bb8384e9',
 citadel:'465b7b8d',well:'5434f461',tent:'83c6670c',wagon:'d4d08f8f',minehead:'1acc0035',lumbershed:'141767d9',crane:'fcfdae7b',
 village:'2e1cafc5',ruins:'78919384',shrine:'bfb4d6da','cluster:row':'3143cce8','cluster:yard':'9fe195e0',
 'cluster:farmstead':'14d73c92','cluster:smithy':'abe876f2','cluster:inn':'9810db05','cluster:chapel':'06f0f59e',
 'cluster:market':'be98f11e','cluster:mill':'e926ab59','cluster:lumber':'11a7c6d8','cluster:mine':'58d280c7',
 'cluster:quarry':'519fa161','cluster:fishery':'0e5f48fb','cluster:pasture':'4ae66009','cluster:brewery':'666e99d6',
 'cluster:granary':'1c356c0b','cluster:workshop':'71abc0e4','cluster:quarter':'d72f24e0','cluster:camp':'e6d6449f',
 'cluster:hideout':'55561042','cluster:travelers':'2c27037d'};
try{
 const px=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data,P=['human','dwarf','elf','orc'],FRONT=PX.MODEL_FRONT;
 const fnv=()=>{let h=2166136261;const H={b(a){for(let i=0;i<a.length;i++)h=Math.imul(h^a[i],16777619)>>>0;return H},s(x){x=String(x);for(let i=0;i<x.length;i++)h=Math.imul(h^x.charCodeAt(i),16777619)>>>0;return H},get x(){return h.toString(16).padStart(8,'0')}};return H};
 const all=PX.MODEL_TYPES.concat(PX.MODEL_SITES),miss=PX.BUILDING_TYPES.filter(t=>!PX.MODEL_TYPES.includes(t));
 ok(!miss.length,'a model for every building type ('+PX.BUILDING_TYPES.length+') and the built sites ('+PX.MODEL_SITES.join(', ')+')'+(miss.length?': none for '+miss.join(', '):''));
 // the checks on one result: its cell, true pixels, the outline round the silhouette only, no square backdrop
 const bad={cell:[],soft:[],rim:[],edge:[],turn:[],side:[]},yaws=t=>FRONT.includes(t)?[0]:PX.MODEL_YAWS;
 const look=(b,id,N)=>{const a=px(b.img);if(b.img.width!==N||b.img.height!==N||b.ax!==0||b.ay!==N||b.clipped)bad.cell.push(id);
   let soft=false,rim=false;const K=(x,y)=>x<0||y<0||x>=N||y>=N?0:b.mask[y*N+x],nb=(x,y)=>[K(x-1,y),K(x+1,y),K(x,y-1),K(x,y+1)];
   for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=(y*N+x)*4,al=a[i+3],k=K(x,y);if(al&&al!==255)soft=true;
     if(k===3&&(!(a[i]===0x1a&&a[i+1]===0x1c&&a[i+2]===0x26)||!nb(x,y).some(q=>q===0||q===2)))rim=true;if(k===1&&nb(x,y).includes(0))rim=true}
   if(soft)bad.soft.push(id);if(rim)bad.rim.push(id);
   // (along each edge of the cell: the picture never the whole edge; its ground and shadow never a straight run longer than a
   // quarter of it, never half of it opaque)
   for(const [c,full] of [[b.img,true],[b.ground,false],[b.shadow,false]]){const d=px(c);for(const e of [0,1,2,3]){let n=0,run=0,best=0;
     for(let k=0;k<N;k++){const [x,y]=[[k,0],[k,N-1],[0,k],[N-1,k]][e],on=d[(y*N+x)*4+3]>0;n+=on;run=on?run+1:0;best=Math.max(best,run)}
     if(full?n>=N:(best>N/4||n>N/2)){bad.edge.push(id+(full?' img':c===b.ground?' ground':' shadow')+' edge '+e);break}}}
   return a.join()};
 const t0=performance.now();let n=0;
 for(const type of all){const N=PX.BUILDING_TYPES.includes(type)?PX.building({type,style:'human',seed:1}).w:16;
   for(const people of P)for(const seed of [1,2]){const seen=new Set();for(const yaw of yaws(type)){const id=type+'/'+people+'/'+seed+'/'+yaw,b=PX.buildingModel({type,people,seed,yaw,fort:2});n++;
     const h=look(b,id,N);if(seen.has(h))bad.turn.push(id);seen.add(h);
     // (stage 1's weak spot 1: turned to a side, a 16 px building no longer tall and narrow)
     if(N===16&&(yaw===2||yaw===6)){let x0=N,x1=-1,y0=N,y1=-1;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(b.mask[y*N+x]===1){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
       if((x1-x0+1)<.55*(y1-y0+1)&&!['tower','windmill','granary','yurt','crane','wagon'].includes(type))bad.side.push(id+' '+(x1-x0+1)+'x'+(y1-y0+1))}}}
   for(const env of ['desert','swamp','frost']){const b=PX.buildingModel({type,people:'human',seed:3,env,stilts:env==='swamp',fort:1});look(b,type+'/'+env,N);n++}}
 const ms=performance.now()-t0;
 const L=(k,m)=>ok(!bad[k].length,m+(bad[k].length?': '+bad[k].slice(0,8).join(', ')+(bad[k].length>8?' …':''):''));
 L('cell',n+' building models ('+all.length+' types x 4 peoples x 2 seeds x their facings, and each climate): each exactly its old cell, standing on its bottom row, nothing cut off');
 L('soft','every pixel opaque or empty');L('rim','the navy outline round the silhouette only');L('turn','each facing its own picture');
 L('side','a 16 px building turned to a side is not tall and narrow (at least .55 as wide as tall)');
 L('edge','never a square backdrop: the picture never fills an edge of its cell, its ground and shadow reach the edge only thinly');
 // the castle centres straight on, their gate on the middle column
 {const g=['keep','citadel','gatehouse','village'].filter(t=>{const b=PX.buildingModel({type:t,people:'human',seed:1,fort:2,yaw:4});return b.yaw!==0||b.gateX!==b.cell/2||!b.marks.gate||Math.abs(b.marks.gate[0]-b.cell/2)>1||!b.flag});
  ok(!g.length,'the castle centres stand straight on whatever the yaw, their gate on the cell\'s middle column, flying the flag'+(g.length?': '+g.join(', '):''))}
 // the peoples' roofs, the same whoever holds the place
 {const R={human:['tile','thatch'],dwarf:['slate'],elf:['leaf'],orc:['hide']},b=[];
  for(const people of P)for(const type of ['cottage','townhouse','tavern','church','keep','village']){const s=PX.buildingModelSpec({type,people,seed:1,fort:1});
   const mats=s.parts.filter(p=>p.k==='roof'&&!p.keep&&!/canvas|awning/.test(p.mat)).map(p=>p.mat).concat(s.parts.filter(p=>p.k==='tower'&&p.roof&&p.roof.form==='cone').map(p=>p.roof.mat));
   if(!mats.length||mats.some(m=>!R[people].includes(m)))b.push(people+' '+type+' '+mats.join('/'))}
  ok(!b.length,'each people its own roof: humans tile (thatch in the country), dwarves slate, elves leaf, orcs hide'+(b.length?': '+b.slice(0,6).join(', '):''))}
 // clusters: by every street's side, near full scale (stage 1's weak spot 4), their buildings each a kind, a role, a door
 {bad.edge=[];bad.rim=[];const bc=[],sc=[];let nc=0;for(const kind of PX.CLUSTER_MODELS)for(const yaw of PX.MODEL_YAWS)for(const people of ['human','orc']){const b=PX.clusterModel({kind,people,seed:2,yaw}),B=b.buildings||[],id=kind+'/'+yaw+'/'+people;nc++;
    look(b,id,b.cell);if(!b.role||!B.length||B.some(d=>!d.kind||!d.role||!(d.area>0)||!d.door))bc.push(id+' ('+B.length+')');if(Math.min(b.scale.u,b.scale.v)<.85||b.scale.z<.8)sc.push(id+' '+[b.scale.u,b.scale.v,b.scale.z].join('/'))}
  ok(!bc.length,nc+' clusters ('+PX.CLUSTER_MODELS.join(', ')+') by each street\'s side: each its role, its buildings each a kind, a role, a footprint and a door'+(bc.length?': '+bc.slice(0,6).join(', '):''));
  ok(!sc.length,'a cluster turned to any street\'s side stands at near its full scale (never shrunk to .7)'+(sc.length?': '+sc.slice(0,6).join(', '):''));
  L('edge','the clusters never a square backdrop either');L('rim','the clusters\' outline round the silhouette only')}
 // the snow overlay: by thirds, cached, inside the body and the yard, more with more snow, in shapes rather than a speckle
 {const bs=[];let iso=0,tot=0;for(const type of all){const b=PX.buildingModel({type,people:'human',seed:1}),N=b.cell,gr=px(b.ground);let last=-1;
   if(PX.modelSeason(b,'snow',0)!==null||PX.modelSeason(b,'snow',.3)!==PX.modelSeason(b,'snow',1/3))bs.push(type+' cache');
   for(const a of [1/3,2/3,1]){const s=PX.modelSeason(b,'snow',a),si=px(s.img),sg=px(s.ground);let c=0;
     for(let i=0;i<N*N;i++){if(si[i*4+3]){c++;if(b.mask[i]!==1)bs.push(type+' outside');}if(sg[i*4+3]&&!gr[i*4+3])bs.push(type+' off its ground')}
     if(c<last)bs.push(type+' less at '+a.toFixed(2));last=c;
     if(a===1)for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){const i=y*N+x;if(!si[i*4+3])continue;tot++;if(![i-1,i+1,i-N,i+N].some(j=>si[j*4+3]))iso++}}
   if(!last)bs.push(type+' no snow')}
  ok(!bs.length,'the snow overlay: none at 0, the same layer for the same third, only on the building and its yard, more as it deepens'+(bs.length?': '+[...new Set(bs)].slice(0,6).join(', '):''));
  ok(iso/Math.max(1,tot)<.04,'full snow in solid shapes, not a speckle: '+(100*iso/Math.max(1,tot)).toFixed(1)+'% of its pixels alone');
  const b=PX.buildingModel({type:'cottage',people:'human',seed:1,env:'frost'});ok(b.snow&&b.snow.amount===1&&b.groundKey==='snow','the frost has full snow by default, its yard trodden snow')}
 // the same spec, the same pixels: a hash a type and a cluster (INFO), checked against EXPECT once recorded
 {const got={};PX.modelCacheClear();const add=(H,b)=>{H.b(px(b.img)).b(px(b.ground)).b(px(b.shadow));if(b.snow)H.b(px(b.snow.img)).b(px(b.snow.ground));H.s(JSON.stringify([b.flag,b.door,b.windows,b.groundKey,b.buildings.map(d=>[d.kind,d.role,d.area])]))};
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
