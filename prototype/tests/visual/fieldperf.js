'use strict';
// Not a test (run by name: -Suites visual/fieldperf -TimeoutSeconds 300): the cost of field variety's dense forests by field size
// (buildTerrain's {W, H, top, bot}): generation, painting (PX.battleGround), the standing props (trees) it hands back, and their
// per-frame cost as render.js draws them (the props in view culled by their boxes, each one drawImage'd), zoomed out to the whole
// field in a 1280×720 view and zoomed in to a third of it. Zoomed out, a field of more than LOD.trees trees draws its canopy layer
// (render.js LOD, PX.battleCanopy) and only its other props as sprites: "LOD" is that frame, "sprites" the frame without it.
// Each frame is timed to a pixel read back (the canvas's drawing done, not only queued).
// Plains (copses) beside them. Then a battle's start by field size, open and forest (R15: the start in steps, setup.js; before it
// the ground was painted in the first frame): the start, each step's time and the longest piece of work between two yields (the
// page answers between pieces: loading.js runSteps cuts its slices only there), then its first frame. Then a real battle frame
// (drawBattle) on a huge forest, LOD on and off. Never fails.
window.RUN=()=>{const t=T,o=[],ev=s=>(0,eval)(s);
 try{window.requestAnimationFrame=()=>0;ev('TERRAIN.on=true');
  const med=a=>{a=a.slice().sort((x,y)=>x-y);return a[a.length>>1]};
  const frame=(G,cv,view,z,lod)=>{const g=cv.getContext('2d'),L=G.props;g.imageSmoothingEnabled=false;const t0=performance.now();let n=0;g.setTransform(z,0,0,z,-view[0]*z,-view[1]*z);
   if(lod){const C=t.PX.battleCanopy(G),x0=Math.max(0,Math.floor(view[0])-2),y0=Math.max(0,Math.floor(view[1])-2),x1=Math.min(C.width,Math.ceil(view[2])+2),y1=Math.min(C.height,Math.ceil(view[3])+2);g.drawImage(C,x0,y0,x1-x0,y1-y0,x0,y0,x1-x0,y1-y0)}
   for(const p of L){if(lod&&p.dk===1)continue;const b=p.box;if(b[2]<view[0]||b[0]>view[2]||b[3]<view[1]||b[1]>view[3])continue;g.drawImage(p.s,p.dx,p.dy);n++}g.setTransform(1,0,0,1,0,0);g.getImageData(0,0,1,1);return[performance.now()-t0,n]};
  const SZ=[['today',1100,600],['big',1600,900],['large',2000,1200],['huge',3200,1800]],cv=t.PX.canvas(1280,720);
  for(const [name,W,H] of SZ)for(const [rc,lay] of [['open','copses'],['forest','deepwood'],['forest','stands']]){const top=40,bot=H-40,gen=[],paint=[];let T0=null,G=null;
   for(let s=1;s<=3;s++){let a=performance.now();T0=t.buildTerrain({recipe:rc,seed:s*101,W,H,top,bot,layout:lay});gen.push(performance.now()-a);a=performance.now();G=t.PX.battleGround({...T0,climate:'grass'});paint.push(performance.now()-a)}
   const trees=G.props.filter(p=>p.dk===1).length,deep=T0.deep?G.props.filter(p=>p.dk===1&&T0.deep[t.tIx(T0,p.x,p.y)]).length:0,z=Math.min(1280/W,720/H),fo=[],fi=[],fl=[];let no=0,ni=0,nl=0;
   const lod=z<t.LOD.z&&trees>t.LOD.trees,a0=performance.now();if(lod)t.PX.battleCanopy(G);const cb=performance.now()-a0;
   for(let k=0;k<12;k++){const [a,n]=frame(G,cv,[0,0,W,H],z);fo.push(a);no=n;if(lod){const [c,m]=frame(G,cv,[0,0,W,H],z,true);fl.push(c);nl=m}const v=[W*.3,H*.3,W*.3+1280/2,H*.3+720/2],[b,m]=frame(G,cv,v,2);fi.push(b);ni=m}
   o.push('INFO '+(name+' '+W+'×'+H).padEnd(18)+' '+(rc+':'+lay).padEnd(16)+' gen '+med(gen).toFixed(1)+' ms, paint '+med(paint).toFixed(0)+' ms, props '+G.props.length+' (trees '+trees+', '+deep+' in the woods’ hearts: T.deep); a frame zoomed out: sprites '+med(fo.slice(2)).toFixed(2)+' ms ('+no+' drawn)'+(lod?', LOD '+med(fl.slice(2)).toFixed(2)+' ms (the canopy and '+nl+' sprites; the canopy made once in '+cb.toFixed(0)+' ms)':', no LOD (under '+t.LOD.trees+' trees or zoom '+z.toFixed(2)+')')+'; zoomed in ×2 '+med(fi.slice(2)).toFixed(2)+' ms ('+ni+' drawn)')}
  // (a battle's start by field size: the lab's, 60 a side; its steps timed where it runs them (runSteps, at once, as LOADING.sync))
  {const L=t.BattleLab,G=t.G,r0=window.runSteps,arm=[{type:'hum_foot',count:40},{type:'hum_bow',count:20}];t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;
   for(const size of t.FIELD_SIZES.order)for(const tr of ['open','forest']){G.mode='world';G.modal=false;const st=[];let big=0;
    window.runSteps=(title,steps)=>{let v;for(const s of steps){const a=performance.now();let m=0,n=0;v=s.run?s.run():undefined;
      if(v&&typeof v.next==='function'){let x;for(;;){const q=performance.now();x=v.next();m=Math.max(m,performance.now()-q);n++;if(x.done)break}v=x.value}
      const all=performance.now()-a;big=Math.max(big,n?m:all);st.push(s.id+' '+all.toFixed(0)+(n>1?' ('+n+' pieces, the longest '+m.toFixed(0)+')':''))}return Promise.resolve(v)};
    let a=performance.now();try{L.start({leftGroups:arm,rightGroups:arm,deploy:false,paused:true,ai:true,morale:true,seed:7,terrain:tr,ground:'auto',size,fog:false})}finally{window.runSteps=r0}
    const set=performance.now()-a;a=performance.now();t.drawBattle();t.ctx.getImageData(0,0,1,1);const f1=performance.now()-a;
    o.push('INFO start, '+(size+' '+tr).padEnd(13)+(' '+t.BW+'×'+t.BH).padEnd(11)+' setup '+set.toFixed(0)+' ms, first frame '+f1.toFixed(0)+' ms'+(st.length?', the longest piece '+big.toFixed(0)+' ms; '+st.join(', '):' (one piece)'));L.exit()}}
  // (a real frame: a huge forest battle of 300 soldiers, drawBattle whole, at the field's fit and at ×1, LOD on and off)
  {const L=t.BattleLab,G=t.G;t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;ev('FIELD_SIZES.on=true;EXITS.on=true');
   const arm=[{type:'hum_foot',count:60},{type:'hum_bow',count:40},{type:'hum_knight',count:30},{type:'hum_foot',count:20}];G.mode='world';G.modal=false;
   L.start({leftGroups:arm,rightGroups:arm,deploy:false,paused:true,ai:true,morale:true,seed:7,terrain:'forest',ground:{recipe:'forest',seed:7,layout:'deepwood'},size:'huge',fog:false});const B=t.B;
   for(let i=0;i<5;i++)L.step(15);const res=[];
   for(const fit of [true,false])for(const on of [false,true]){t.LOD.on=on;if(fit)t.camReset();else{t.camReset();B.cam.z=1;B.cam.fit=false;B.cam.x=1200;B.cam.y=600;t.camClamp()}if(B.ground)B.ground.lod=null;t.drawBattle();t.drawBattle();
    const ms=[];for(let k=0;k<10;k++){const a=performance.now();t.drawBattle();t.ctx.getImageData(0,0,1,1);ms.push(performance.now()-a)}res.push((fit?'fit ×'+B.cam.z.toFixed(2):'×1')+' LOD '+(on?'on':'off')+' '+med(ms).toFixed(1)+' ms')}
   t.LOD.on=true;o.push('INFO a huge forest battle, '+B.units.length+' soldiers, '+B.ground.trees+' trees, drawBattle whole frame: '+res.join(', '));L.exit();ev('FIELD_SIZES.on=false;EXITS.on=false')}
  o.push('PASS field perf report completed');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{try{ev('TERRAIN.on=false')}catch(e){}}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
