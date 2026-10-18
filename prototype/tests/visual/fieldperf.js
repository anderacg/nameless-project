'use strict';
// Not a test (run by name: -Suites visual/fieldperf -TimeoutSeconds 300): the cost of field variety's dense forests by field size
// (buildTerrain's {W, H, top, bot}): generation, painting (PX.battleGroundSteps: the whole, kept by tiles, R16), the standing props
// (trees) it hands back, and their per-frame cost as render.js draws them (the props in view culled by their boxes, each one
// drawImage'd), zoomed out to the whole field in a 1280×720 view and zoomed in to a third of it. Zoomed out, a field of more than
// LOD.trees trees draws its canopy layer (render.js LOD, PX.battleCanopy) and only its other props as sprites: "LOD" is that frame,
// "sprites" the frame without it. Each frame is timed to a pixel read back (the canvas's drawing done, not only queued).
// R16: the ground's own draw (its tiles in view, or its overview zoomed out), a tile painted alone from the plan, and the pictures a
// field holds: before (R15: full-field canvases: the arena, the ground, the canopy on a big wood, the blood, the reach) and after
// (the ground's tiles (at most PX.GROUND_TILE.cap), its overview, its half-resolution canopy, the small map; the reach a layer the
// view's size; the blood by tiles where it falls: here one tile's worth, a fight's corner).
// Plains (copses) beside them. Then a battle's start by field size, open and forest (R15: the start in steps, setup.js): the start,
// each step's time and the longest piece of work between two yields, then its first frame. Then a real battle frame (drawBattle)
// on a huge forest, LOD on and off, and what it holds. Never fails.
window.RUN=()=>{const t=T,o=[],ev=s=>(0,eval)(s),PX=t.PX,TL=PX.GROUND_TILE,MB=b=>(b/1048576).toFixed(1);
 try{window.requestAnimationFrame=()=>0;ev('TERRAIN.on=true');
  const med=a=>{a=a.slice().sort((x,y)=>x-y);return a[a.length>>1]};
  const frame=(G,cv,view,z,lod)=>{const g=cv.getContext('2d'),L=G.props;g.imageSmoothingEnabled=false;const t0=performance.now();let n=0;g.setTransform(z,0,0,z,-view[0]*z,-view[1]*z);
   if(lod)PX.battleCanopy(G).drawView(g,view[0],view[1],view[2],view[3]);
   for(const p of L){if(lod&&p.dk===1)continue;const b=p.box;if(b[2]<view[0]||b[0]>view[2]||b[3]<view[1]||b[1]>view[3])continue;g.drawImage(p.s,p.dx,p.dy);n++}g.setTransform(1,0,0,1,0,0);g.getImageData(0,0,1,1);return[performance.now()-t0,n]};
  // (the ground alone: its tiles in view (painted already), or the overview)
  const ground=(G,cv,view,z)=>{const g=cv.getContext('2d');g.imageSmoothingEnabled=false;const t0=performance.now();g.setTransform(z,0,0,z,-view[0]*z,-view[1]*z);G.drawView(g,view[0],view[1],view[2],view[3],z);g.setTransform(1,0,0,1,0,0);g.getImageData(0,0,1,1);return performance.now()-t0};
  const SZ=[['today',1100,600],['big',1600,900],['large',2000,1200],['vlarge',2400,1344],['huge',3200,1800]],cv=t.PX.canvas(1280,720),VWr=1067,VHr=600;
  for(const [name,W,H] of SZ)for(const [rc,lay] of [['open','copses'],['forest','deepwood'],['forest','stands']]){const top=40,bot=H-40,gen=[],paint=[];let T0=null,G=null;ev('BW='+W+';BH='+H);
   for(let s=1;s<=3;s++){let a=performance.now();T0=t.buildTerrain({recipe:rc,seed:s*101,W,H,top,bot,layout:lay});gen.push(performance.now()-a);a=performance.now();const it=PX.battleGroundSteps({...T0,climate:'grass',base:t.paintArena('grass')});let n;while(!(n=it.next()).done);G=n.value;paint.push(performance.now()-a)}
   const trees=G.props.filter(p=>p.dk===1).length,deep=T0.deep?G.props.filter(p=>p.dk===1&&T0.deep[t.tIx(T0,p.x,p.y)]).length:0,z=Math.min(1280/W,720/H),fo=[],fi=[],fl=[],go=[],gi=[];let no=0,ni=0,nl=0;
   const lod=z<t.LOD.z&&trees>t.LOD.trees,a0=performance.now();if(lod)PX.battleCanopy(G);const cb=performance.now()-a0;
   const vin=[W*.3,H*.3,W*.3+1280/2,H*.3+720/2];TL.sync=true;G.ready(vin[0]-2,vin[1]-2,vin[2]+2,vin[3]+2);TL.sync=false;
   for(let k=0;k<12;k++){const [a,n]=frame(G,cv,[0,0,W,H],z);fo.push(a);no=n;if(lod){const [c,m]=frame(G,cv,[0,0,W,H],z,true);fl.push(c);nl=m}const [b,m]=frame(G,cv,vin,2);fi.push(b);ni=m;go.push(ground(G,cv,[0,0,W,H],z));gi.push(ground(G,cv,vin,2))}
   // (a tile painted alone from the plan: the middle one, three times)
   const tp=[];for(let k=0;k<3;k++){const a=performance.now();PX.battleGroundPaint(G.plan,[Math.floor(W/2/TL.size)*TL.size,Math.floor(H/2/TL.size)*TL.size,Math.min(TL.size,W-Math.floor(W/2/TL.size)*TL.size),Math.min(TL.size,H-Math.floor(H/2/TL.size)*TL.size)]);tp.push(performance.now()-a)}
   // (the pictures it holds: before (R15) and after, the ground's tiles as many as a view at ×1 and its ring would keep (cap at most))
   for(let k=0;k<G.cols*G.rows&&G.tiles.size<Math.min(G.cap,G.cols*G.rows);k++)G.tile(k);const B_=G.bytes(),full=W*H*4,reach=(VWr+8)*(VHr+8)*4,blood=TL.size*TL.size,before=full*(4+(lod?1:0)),after=B_.tiles+B_.over+B_.canopy+B_.mini+reach+blood;
   o.push('INFO '+(name+' '+W+'×'+H).padEnd(18)+' '+(rc+':'+lay).padEnd(16)+' gen '+med(gen).toFixed(1)+' ms, paint '+med(paint).toFixed(0)+' ms, props '+G.props.length+' (trees '+trees+', '+deep+' in the woods’ hearts: T.deep); a frame zoomed out: sprites '+med(fo.slice(2)).toFixed(2)+' ms ('+no+' drawn)'+(lod?', LOD '+med(fl.slice(2)).toFixed(2)+' ms (the canopy and '+nl+' sprites; the canopy made once in '+cb.toFixed(0)+' ms)':', no LOD (under '+t.LOD.trees+' trees or zoom '+z.toFixed(2)+')')+'; zoomed in ×2 '+med(fi.slice(2)).toFixed(2)+' ms ('+ni+' drawn)');
   o.push('INFO '+''.padEnd(35)+' the ground: drawn zoomed out (×'+z.toFixed(2)+', '+(G.over&&z<=TL.over?'its overview':'its tiles')+') '+med(go.slice(2)).toFixed(2)+' ms, zoomed in ×2 '+med(gi.slice(2)).toFixed(2)+' ms; a tile painted alone '+med(tp).toFixed(0)+' ms ('+G.cols*G.rows+' tiles); pictures held: before '+MB(before)+' MB, after '+MB(after)+' MB (tiles '+B_.n+' '+MB(B_.tiles)+', overview '+MB(B_.over)+', canopy '+MB(B_.canopy)+', reach '+MB(reach)+', blood '+MB(blood)+')')}
  ev('BW=960;BH=600');
  // (a battle's start by field size: the lab's, 60 a side; its steps timed where it runs them (runSteps, at once, as LOADING.sync))
  {const L=t.BattleLab,G=t.G,r0=window.runSteps,arm=[{type:'hum_foot',count:40},{type:'hum_bow',count:20}];t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;
   for(const size of t.FIELD_SIZES.order)for(const tr of ['open','forest']){G.mode='world';G.modal=false;const st=[];let big=0;
    window.runSteps=(title,steps)=>{let v;for(const s of steps){const a=performance.now();let m=0,n=0;v=s.run?s.run():undefined;
      if(v&&typeof v.next==='function'){let x;for(;;){const q=performance.now();x=v.next();m=Math.max(m,performance.now()-q);n++;if(x.done)break}v=x.value}
      const all=performance.now()-a;big=Math.max(big,n?m:all);st.push(s.id+' '+all.toFixed(0)+(n>1?' ('+n+' pieces, the longest '+m.toFixed(0)+')':''))}return Promise.resolve(v)};
    let a=performance.now();try{L.start({leftGroups:arm,rightGroups:arm,deploy:false,paused:true,ai:true,morale:true,seed:7,terrain:tr,ground:'auto',size,fog:false})}finally{window.runSteps=r0}
    const set=performance.now()-a,p0=t.B.ground&&t.B.ground.painted;a=performance.now();t.drawBattle();t.ctx.getImageData(0,0,1,1);const f1=performance.now()-a,g=t.B.ground;
    o.push('INFO start, '+(size+' '+tr).padEnd(13)+(' '+t.BW+'×'+t.BH).padEnd(11)+' setup '+set.toFixed(0)+' ms, first frame '+f1.toFixed(0)+' ms (×'+t.B.cam.z.toFixed(2)+', '+(g&&g.over&&t.B.cam.z<=TL.over?'the overview':'tiles cut at the start')+', '+(g?g.painted-p0:0)+' painted)'+(st.length?', the longest piece '+big.toFixed(0)+' ms; '+st.join(', '):' (one piece)'));L.exit()}}
  // (a real frame: a huge forest battle of 300 soldiers, drawBattle whole, at the field's fit and at ×1, LOD on and off; and what it holds)
  {const L=t.BattleLab,G=t.G;t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;ev('FIELD_SIZES.on=true;EXITS.on=true');
   const arm=[{type:'hum_foot',count:60},{type:'hum_bow',count:40},{type:'hum_knight',count:30},{type:'hum_foot',count:20}];G.mode='world';G.modal=false;
   L.start({leftGroups:arm,rightGroups:arm,deploy:false,paused:true,ai:true,morale:true,seed:7,terrain:'forest',ground:{recipe:'forest',seed:7,layout:'deepwood'},size:'huge',fog:false});const B=t.B;
   for(let i=0;i<5;i++)L.step(15);const res=[];
   for(const fit of [true,false])for(const on of [false,true]){t.LOD.on=on;if(fit)t.camReset();else{t.camReset();B.cam.z=1;B.cam.fit=false;B.cam.x=1200;B.cam.y=600;t.camClamp()}if(B.ground)B.ground.lod=null;TL.sync=true;t.drawBattle();TL.sync=false;t.drawBattle();
    const ms=[];for(let k=0;k<10;k++){const a=performance.now();t.drawBattle();t.ctx.getImageData(0,0,1,1);ms.push(performance.now()-a)}res.push((fit?'fit ×'+B.cam.z.toFixed(2):'×1')+' LOD '+(on?'on':'off')+' '+med(ms).toFixed(1)+' ms')}
   // (panning at ×1 across the field: the tiles painted ahead a few ms a frame; the longest frame)
   const pf=[];B.cam.z=1;B.cam.fit=false;B.cam.x=0;B.cam.y=500;t.camClamp();const p0=B.ground.painted;for(let k=0;k<120;k++){t.camPan(24,0);const a=performance.now();t.drawBattle();t.ctx.getImageData(0,0,1,1);pf.push(performance.now()-a)}
   const gb=B.ground.bytes(),hold=gb.tiles+gb.over+gb.canopy+gb.mini+(B.gore?B.gore.bytes():0)+(B.rangeCv?B.rangeCv.width*B.rangeCv.height*4:0);
   t.LOD.on=true;o.push('INFO a huge forest battle, '+B.units.length+' soldiers, '+B.ground.trees+' trees, drawBattle whole frame: '+res.join(', ')+'; panning at ×1 across it (120 frames, '+(B.ground.painted-p0)+' tiles painted ahead): median '+med(pf).toFixed(1)+' ms, longest '+Math.max(...pf).toFixed(1)+' ms; it holds '+MB(hold)+' MB of pictures (before R16 up to '+MB(t.BW*t.BH*4*5)+' MB)');L.exit();ev('FIELD_SIZES.on=false;EXITS.on=false')}
  o.push('PASS field perf report completed');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{try{ev('TERRAIN.on=false');TL.sync=false}catch(e){}}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
