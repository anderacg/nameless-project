'use strict';
window.RUN=async()=>{const r=Kit.report(),{ok,info}=r;window.requestAnimationFrame=()=>0;
 try{const t=T,TG=t.TileGround,TC=t.TILE_GROUND;Kit.begin('soldier',1);Kit.clear();Kit.world();t.G.paused=true;
  ok(await TG.load(),'prebuilt local terrain atlas loads');ok(TG.atlas.width===TC.cell*TC.variants&&TG.atlas.height===TC.cell*7,'atlas contains eight variants of six reusable materials plus transparent bank grass');
  ok(!TG.enabled,'tile renderer is opt-in; the normal renderer remains the default');
  const dense=[];for(let i=0;i<120;i++)dense.push(i,Math.sin(i/30)*12,i+1,Math.sin((i+1)/30)*12,5+i/120,5+(i+1)/120);const original=dense.slice(),reduced=TG.simplify(dense);
  ok(reduced.length<dense.length&&dense.join()===original.join(),'simplifying dense curves reduces work without modifying the shared world geometry');
  ok(reduced[0]===dense[0]&&reduced[1]===dense[1]&&reduced[reduced.length-4]===dense[dense.length-4]&&reduced[reduced.length-1]===dense[dense.length-1],'curve simplification retains endpoints and endpoint widths');
  const fixture=()=>TG.makeScene({seed:41,roads:Float32Array.from([0,64,256,64,5.5,5.5]),rivers:Float32Array.from([180,0,180,256,10,12])}),canvas=(w=256,h=256)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c},hash=c=>{const p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=2166136261;for(const x of p)n=Math.imul(n^x,16777619)>>>0;return n},pixel=(c,x,y)=>c.getContext('2d').getImageData(x,y,1,1).data;
  const scene=fixture(),cv=canvas(),g=cv.getContext('2d'),random=Math.random;let draws=0;Math.random=()=>{draws++;return random()};try{TG.draw(g,scene,0,0,256,256)}finally{Math.random=random}
  ok(draws===0,'terrain variations and transitions never advance simulation RNG');
  const grass=pixel(cv,30,30),road=pixel(cv,40,64),water=pixel(cv,180,120),bank=pixel(cv,168,120);
  ok(grass[1]>grass[0]&&road[0]>road[1]&&water[2]>water[0]&&bank[0]>bank[2],'ground, road, water and bank use their own textured materials');
  const pixels=g.getImageData(0,0,128,32).data,colours=new Set();for(let i=0;i<pixels.length;i+=4)colours.add(pixels[i]+','+pixels[i+1]+','+pixels[i+2]);ok(colours.size>20,'grass uses a detailed baked texture instead of a solid placeholder');
  const first=hash(cv),builds=TG.stats.builds;TG.draw(g,scene,0,0,256,256);ok(hash(cv)===first&&TG.stats.builds===builds,'cached redraws preserve pixels without rebuilding sections');
  const split=canvas(),sg=split.getContext('2d'),other=fixture();for(let x=0;x<256;x+=37)TG.draw(sg,other,x,0,Math.min(37,256-x),256,x,0);ok(hash(split)===first,'section and viewport boundaries produce no seams, including partial sections');
  const copy=canvas();TG.draw(copy.getContext('2d'),fixture(),0,0,256,256);ok(hash(copy)===first,'a fresh cache reproduces the same terrain');
  const small=TG.makeScene({seed:41}),cap=TC.cap;try{TC.cap=3;for(let i=0;i<4;i++)TG.section(small,i,0);ok(small.cache.size===3&&!small.cache.has('0,0'),'section cache obeys its memory cap')}finally{TC.cap=cap;small.cache.clear()}
  const denied=TG.makeScene({supported:()=>false});ok(!TG.draw(g,denied,0,0,32,32)&&denied.cache.size===0,'unsupported terrain falls back without creating misleading ground');
  const waiting=fixture(),before=TG.stats.builds;ok(!TG.draw(g,waiting,0,0,256,256,0,0,0)&&TG.stats.builds===before,'an exhausted frame budget starts no tile work');TG.section(waiting,0,0);const cachedBuilds=TG.stats.builds;ok(TG.draw(g,waiting,0,0,256,256,0,0,0)&&TG.stats.builds===cachedBuilds,'finished sections remain visible even when there is no budget for missing ones');
  const enabled=TG.enabled,game=TG.gameScene,seen=window.seenAny,mini=t.WorldArt.mini;let miniCalls=0;
  try{TG.enabled=true;TG.gameScene=()=>fixture();window.seenAny=()=>true;t.WorldArt.mini=function(...a){miniCalls++;return mini.apply(this,a)};const old=TG.stats.builds;ok(t.WorldArt.standIn(g,0,0,0,0,128,128,{x:0,y:0})&&miniCalls===1&&TG.stats.builds>old,'opt-in world fallback overlays completed textured sections immediately')}
  finally{TG.enabled=enabled;TG.gameScene=game;window.seenAny=seen;t.WorldArt.mini=mini}
  // Drawing comparisons share the actual world's road/river geometry. The reference also paints relief and nature.
  const plan=t.WorldArt.ensure(),ways=t.waysOf(plan),indexStart=performance.now(),actual=TG.makeScene({seed:t.WM.seedNum||1,roads:ways.RA,rivers:ways.SA}),indexMs=performance.now()-indexStart;
  const patch=(x,y)=>({x:Math.max(0,Math.min(t.MW*16-128,Math.floor(x-64))),y:Math.max(0,Math.min(t.MH*16-128,Math.floor(y-64)))}),find=A=>{for(let i=0;i<A.length;i+=6){const x=(A[i]+A[i+2])/2,y=(A[i+1]+A[i+3])/2;if(t.climAt(x,y)==='grass')return patch(x,y)}return patch(t.P.x,t.P.y)};
  let open=null;for(let i=0;i<t.tiles.length&&!open;i+=3)if(t.tiles[i]===t.T_OPEN&&t.climate[i]===t.CLIMS.indexOf('grass'))open=patch((i%t.MW)*16,Math.floor(i/t.MW)*16);
  const results=[];for(const [name,p] of [['grass',open],['road',find(ways.RA)],['riverbank',find(ways.SA)]]){Kit.progress('comparing terrain',{name});const a=canvas(128,128),start=performance.now(),rec={fine:2};t.runGen(t.paintSteps(plan,p.x,p.y,128,128,a.getContext('2d'),0,0,rec));const referenceMs=performance.now()-start;
    actual.cache.clear();const b=canvas(256,256),q=b.getContext('2d');q.scale(2,2);const cold=performance.now();TG.draw(q,actual,p.x,p.y,128,128);const coldMs=performance.now()-cold,warm=[];for(let i=0;i<10;i++){const at=performance.now();TG.draw(q,actual,p.x,p.y,128,128);warm.push(performance.now()-at)}warm.sort((a,b)=>a-b);
    results.push({name,...p,referenceMs,coldMs,warmMedianMs:warm[5]});window.tileComparisons=window.tileComparisons||[];window.tileComparisons.push({name,reference:rec.fcv||a,tiles:b,p})}
  window.tileBenchmark={indexMs,atlasBytes:TG.atlas.width*TG.atlas.height*4,cacheLimitBytes:TC.cap*(TC.section*TC.fine)**2*4,results};info('TILE_BENCHMARK '+JSON.stringify(window.tileBenchmark));
  ok(results.every(r=>r.coldMs<r.referenceMs),'tile foundation prepares faster than the complete procedural reference in each sampled scene');
  info('Prototype omits relief, climate transitions, yards, vegetation and water animation; this is not a whole-game FPS comparison.');ok(!ERR.length,'no runtime errors');
 }catch(e){r.exc(e)}r.out();
};
