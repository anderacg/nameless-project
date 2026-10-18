'use strict';
// Model buildings (engine/model.js, the world-map building redesign): every sample in its 4 facings (PX.MODEL_YAWS), and the 45°
// turns the renderer keeps though nothing uses them (all 8 directions), fits its power-of-two cell
// (the picture as wide and tall as the cell, standing on its bottom row: ax 0, ay the cell), every pixel opaque or empty, the
// navy outline round the silhouette only (every navy pixel beside an empty one or the cell's edge; the silhouette's edge navy, but
// for what lies low and flat, fences and garden beds, unoutlined), the same spec drawing the same pixels, the turned ones different, the ground shadow inside the cell and off the picture,
// the windows and door it records inside the cell; and it is quick enough to make a few hundred at load.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const px=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data,bad={cell:[],soft:[],rim:[],same:[],turn:[],shadow:[],marks:[],ground:[]};let n=0,ms=0,nm=0;
 for(const name of PX.MODEL_SAMPLES){const seen=new Set();for(let yaw=0;yaw<8;yaw++){const sp=PX.modelSample(name,{yaw,seed:3}),b=PX.model(sp),N=sp.cell,id=name+'/'+yaw,a=px(b.img);n++;if(yaw%2===0){ms+=b.ms;nm++}
   if(b.img.width!==N||b.img.height!==N||b.w!==N||b.ax!==0||b.ay!==N||b.clipped||b.tiles[0]!==N/16)bad.cell.push(id);
   // (b.mask: 0 empty, 1 the body, 2 low and flat (fences, beds, tufts), 3 the outline: every outline pixel navy and beside empty or flat
   // ground, no body pixel beside an empty one)
   let soft=false,rim=false;const K=(x,y)=>x<0||y<0||x>=N||y>=N?0:b.mask[y*N+x],nb=(x,y)=>[K(x-1,y),K(x+1,y),K(x,y-1),K(x,y+1)];
   for(let y=0;y<N;y++)for(let x=0;x<N;x++){const al=a[(y*N+x)*4+3];if(al&&al!==255)soft=true;const k=K(x,y),i=(y*N+x)*4;
     if(k===3&&(!(a[i]===0x1a&&a[i+1]===0x1c&&a[i+2]===0x26)||!nb(x,y).some(q=>q===0||q===2)))rim=true;if(k===1&&nb(x,y).includes(0))rim=true}
   if(soft)bad.soft.push(id);if(rim)bad.rim.push(id);
   const h=a.join(),b2=PX.model(sp);if(px(b2.img).join()!==h)bad.same.push(id);if(seen.has(h))bad.turn.push(id);seen.add(h);
   const s=px(b.shadow),gr=px(b.ground);for(let i=0;i<N*N;i++)if(s[i*4+3]&&a[i*4+3]||gr[i*4+3]&&gr[i*4+3]!==255){bad.shadow.push(id);break}
   // (the ground never a square: never along a whole edge of the cell)
   {const G=(x,y)=>gr[(y*N+x)*4+3]>0;let sq=false;for(const e of [0,N-1]){let r=0,c=0;for(let k=0;k<N;k++){if(G(k,e))r++;if(G(e,k))c++}if(r>=N-2||c>=N-2)sq=true}if(sq||(N>16&&!gr.some((v,i)=>i%4===3&&v)))bad.ground.push(id)}
   for(const [x,y] of b.windows.concat(b.door?[[b.door.x,b.door.y]]:[]))if(x<0||y<0||x>=N||y>=N){bad.marks.push(id);break}}}
 const L=(k,m)=>ok(!bad[k].length,m+(bad[k].length?': '+bad[k].slice(0,8).join(', '):''));
 L('cell',n+' models ('+PX.MODEL_SAMPLES.length+' samples x 8 directions): each exactly its cell, standing on its bottom row, nothing cut off');
 L('soft','every pixel opaque or empty');L('rim','the navy outline round the silhouette only');L('same','the same spec draws the same pixels');
 L('turn','each direction draws its own picture');L('shadow','the layers apart: the shadow (a mask, shaded once by the game) off the picture, the flat ground opaque, inside the cell');L('ground','a plot or cluster has its flat ground, never a square (never along a whole edge of the cell)');L('marks','the windows and the door it records lie in its cell');
 // house plots: 1-4 dwellings each, each with its footprint (inside the plot), its floor area and a door; a row plot's houses reach both
 // its sides (so plots side by side make one row)
 {const bp=[];for(const name of PX.MODEL_PLOTS)for(let yaw=0;yaw<8;yaw++){const sp=PX.modelSample(name,{yaw,seed:5}),b=PX.model(sp),D=b.dwellings||[];
   if(D.length<1||D.length>4||D.some(d=>!(d.area>0)||!d.door||d.footprint.u[0]<-16||d.footprint.u[1]>16||d.footprint.v[0]<-16||d.footprint.v[1]>16))bp.push(name+'/'+yaw);
   if(name.startsWith('row')&&yaw===0&&!(Math.min(...D.map(d=>d.footprint.u[0]))<=-15&&Math.max(...D.map(d=>d.footprint.u[1]))>=15&&b.scale.u===1))bp.push(name+' not wall to wall')}
  ok(PX.MODEL_PLOTS.length>=4&&!bp.length,PX.MODEL_PLOTS.length+' house plots ('+PX.MODEL_PLOTS.join(', ')+'): 1-4 dwellings each, each its footprint, floor area and door; the row plots wall to wall'+(bp.length?': '+bp.slice(0,8).join(', '):''))}
 ok(PX.MODEL_YAWS.join()==='0,2,4,6','four facings by default: front, left side, back, right side (yaw 0, 2, 4, 6)');
 {const r=['human','dwarf','elf','orc'].map(pp=>PX.modelSample('row_b',{seed:2,people:pp}).parts.filter(p=>p.k==='roof').map(p=>p.mat));
  ok(r.every((m,i)=>m.every(x=>x===['tile','slate','leaf','hide'][i])),'each people its own roof on the same plot: humans tile, dwarves slate, elves leaf, orcs hide')}
 // clusters: several small buildings of any kind in one cell (a 64 quarter too), each with its kind, role, footprint and door; the
 // cluster its role
 {const bc=[];for(const name of PX.MODEL_CLUSTERS)for(const yaw of PX.MODEL_YAWS){const b=PX.model(PX.modelSample(name,{yaw,seed:3})),B=b.buildings||[];
   if(!b.role||B.length<(name==='market'?4:2)||B.some(d=>!d.kind||!d.role||!(d.area>0)||!d.door))bc.push(name+'/'+yaw+' ('+B.length+')')}
  ok(!bc.length,PX.MODEL_CLUSTERS.length+' clusters ('+PX.MODEL_CLUSTERS.join(', ')+'): each its role, its buildings each a kind, a role, a footprint and a door'+(bc.length?': '+bc.slice(0,8).join(', '):''))}
 ok(ms/nm<15,'quick enough to make a few hundred at load: '+(ms/nm).toFixed(2)+' ms a model (its 4 facings)');
}catch(e){o.push('EXC '+e.message+'\n'+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.join('\n');document.body.appendChild(d)};
