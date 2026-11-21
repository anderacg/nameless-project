'use strict';
// Wildlife by where it is and what it does (the owner, 2026-11-18: "a duck that goes on water but when it move onto the land it
// doesnt have leg", "add more wildlife behavior and recheck correctness"; gfx/ambient.js, world/critters.js WILD_LIFE, engine/
// beasts.js PX.BEAST_GRAZE, PX.BEAST_REST): a duck swims on the drawn water with no legs and stands and waddles on land on its legs,
// goes ashore to rest and back, flies up when anyone comes near and comes down on the water again; a heron in the shallows wades,
// its legs cut at the waterline; birds flushed off their feeding come down to it again; the wild game grazes, its head down, looks
// up, stops and watches one coming near, beds down at night, walks to water to drink, gallops and its deer bound as they flee, keeps
// off the holdings' ground and is never placed on it; their counts hold over days; a beast in deep water is drawn cut at its
// waterline; none of it jitters (no jumps, no turning about each moment, no pose flicker); and a frame of all of it stays cheap.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,TILE=t.TILE,A=t.AMBIENT,AV=t.AMBV,L=t.WILD_LIFE;
 Kit.begin('soldier',1);Kit.world();G.mode='world';G.modal=false;
 // ---- a duck: on the drawn water and on land (gfx/ambient.js ambDuck, ambGround)
 {// (a shore near you: drawn water with dry land a few px off it, in a painted chunk)
  let spot=null;const tx0=Math.floor(P.x/TILE),ty0=Math.floor(P.y/TILE);
  for(let r=1;r<60&&!spot;r++)for(let j=-r;j<=r&&!spot;j++)for(let i=-r;i<=r&&!spot;i++){if(Math.max(Math.abs(i),Math.abs(j))!==r)continue;const a=tx0+i,b=ty0+j;
    if(t.tAt(a,b)===t.T_WATER&&t.ambHabitat('duck',(a+.5)*TILE,(b+.5)*TILE)&&t.nearTile(a,b,t.T_OPEN,1)&&t.ambLot(a,b)===0&&!t.nearTile(a,b,t.T_ROAD,2)&&!t.landHold((a+.5)*TILE,(b+.5)*TILE))spot=[(a+.5)*TILE,(b+.5)*TILE]}
  if(!spot)info('no duck water near you: ducks not checked');else{
   Kit.goTo(spot[0],spot[1]+24);for(let i=0;i<200;i++){t.drawWorld();t.WorldArt.step(60);if(!t.WorldArt.queue.length)break}
   let wet=null,dry=null;for(let d=0;d<24&&!(wet&&dry);d++)for(let a=0;a<16;a++){const x=spot[0]+Math.cos(a*.39)*d,y=spot[1]+Math.sin(a*.39)*d;if(!wet&&t.ambDuckWet(x,y))wet=[x,y];if(!dry&&t.ambDuckLand(x,y))dry=[x,y]}
   if(!wet||!dry)info('no drawn water and bank by it: ducks not checked (water '+!!wet+', bank '+!!dry+' by '+spot.map(Math.round)+', painted '+!!t.WorldArt.chunks.get(Math.floor(spot[1]/t.CHUNK)*t.WorldArt.cols+Math.floor(spot[0]/t.CHUNK))+')');else{
    const S=t.ambSpr(),di=t.ctx.drawImage,drawn=[];t.ctx.drawImage=function(...a){drawn.push(a[0]);return di.apply(this,a)};
    const put=e=>{drawn.length=0;try{t.ambGround(e,G.cam)}finally{}return drawn.slice()};
    const has=(list,set)=>list.length>0&&list.every(c=>set.includes(c));
    try{AV.q=777;const e=t.ambSpawn('duck',wet[0],wet[1]);e.x=wet[0];e.y=wet[1];e.st='swim';e.t=1;for(const m of e.m){m.dx=0;m.dy=0}
     ok(e.m.length>=A.duck.n[0]&&e.m.length<=A.duck.n[1],'ducks paddle together: '+e.m.length+' of them');
     const sw=put(e);ok(has(sw,S.duck.swim),'on the drawn water each duck swims: no legs, its waterline ('+sw.length+' drawn, all swimming)');
     e.x=dry[0];e.y=dry[1];e.st='rest';const st=put(e),legged=[...S.duck.walk.flat(),...S.duck.preen];ok(has(st,legged),'on land each stands on its legs ('+st.length+' drawn, all on legs)');
     e.st='ashore';e.to={x:dry[0]+30,y:dry[1]};const wk=[];for(let i=0;i<8;i++){e.t=1+i*.09;wk.push(...put(e))}
     ok(has(wk,S.duck.walk.flat())&&new Set(wk).size>=2,'walking on land it waddles, its legs stepping ('+new Set(wk).size+' pictures)');
     // (to the bank and back: ashore, resting, then into the water where it left it)
     const e2=t.ambSpawn('duck',wet[0],wet[1]);e2.x=wet[0];e2.y=wet[1];e2.st='swim';e2.t=1;e2.life=1e9;const b=t.ambBank(e2,A.duck.bank+20);
     if(!b)info('no bank in reach of that water');else{e2.turn=0;const a0=A.duck.ashore;A.duck.ashore=1;let seen=new Set();
      try{for(let i=0;i<4000&&!(seen.has('rest')&&seen.has('back')&&e2.st==='swim'&&seen.has('ashore'));i++){t.ambDuck(e2,.05,[],()=>true);e2.t+=.05;seen.add(e2.st)}}finally{A.duck.ashore=a0}
      ok(seen.has('ashore')&&seen.has('rest')&&seen.has('back')&&e2.st==='swim'&&t.ambDuckWet(e2.x,e2.y),'it waddles ashore to rest on the bank and back into the water ('+[...seen].join(', ')+')')}
     // (anyone near: up and off, its wings beating, and down on the water again further on)
     const e3=t.ambSpawn('duck',wet[0],wet[1]);e3.x=wet[0];e3.y=wet[1];e3.st='swim';e3.t=1;e3.life=1e9;t.ambDuck(e3,.05,[{x:wet[0]+5,y:wet[1]}],()=>true);
     let hi=0,air=[];for(let i=0;i<800&&e3.st==='fly';i++){t.ambDuck(e3,.05,[],()=>true);e3.t+=.05;hi=Math.max(hi,e3.alt);t.ambBirds(e3,(x,y,alt,s)=>air.push(s))}
     ok(hi>=A.duck.fly.top*.8&&has(air,S.duckAir)&&new Set(air).size>=2,'scared, the ducks fly up ('+hi.toFixed(0)+' px) on beating wings ('+new Set(air).size+' pictures)');
     ok(e3.st==='swim'&&t.ambDuckWet(e3.x,e3.y)&&Math.hypot(e3.x-wet[0],e3.y-wet[1])>20,'they wheel back and come down on the water again, '+Math.round(Math.hypot(e3.x-wet[0],e3.y-wet[1]))+' px on ('+e3.st+')')}
    finally{t.ctx.drawImage=di}}}}
 // ---- a heron in the shallows wades
 {let sp=null;for(let d=0;d<600&&!sp;d+=2)for(let a=0;a<24&&!sp;a++){const x=P.x+Math.cos(a*.26)*d,y=P.y+Math.sin(a*.26)*d;if(t.drawnWet(x,y))sp=[x,y]}
  if(!sp)info('no drawn water near you: herons not checked');else{const S=t.ambSpr(),di=t.ctx.drawImage;let src=null;t.ctx.drawImage=function(...a){if(a[0]===S.heron[0]||a[0]===S.heron[1])src=a;return di.apply(this,a)};
   try{const e={k:'heron',x:sp[0],y:sp[1],t:1,life:9,dir:1,st:'sit'};t.ambGround(e,G.cam)}finally{t.ctx.drawImage=di}
   ok(src&&src.length===9&&src[4]<S.heron[0].height,'a heron in the drawn water wades, its legs cut at the waterline ('+(src?S.heron[0].height-src[4]:'?')+' of '+S.heron[0].height+' rows under it)')}}
 // ---- flushed, the birds come down to feed again
 {const h={key:'test',k:'peck',x:P.x+60,y:P.y,roost:{x:P.x+90,y:P.y,alt:14},feed:null,species:'sparrow'};const e=t.ambPlace(t.ambSpawn('peck',h.x,h.y),h);e.t=0;
  t.ambScatter(e,h.x-5,h.y);e.roost=h.roost;const seen=new Set();for(let i=0;i<2000&&!(seen.has('land')&&e.st==='peck');i++){e.t+=.05;t.ambStep(e,.05,[],()=>true);seen.add(e.st)}
  ok(seen.has('perch')&&seen.has('land')&&e.st==='peck'&&Math.hypot(e.x-h.x,e.y-h.y)<2,'flushed off their feeding, birds perch, then come down to it again ('+[...seen].join(', ')+')')}
 // ---- the wild game's poses (engine/beasts.js): grazing, bedded down, galloping
 {const id='deer',st=t.critterArt(id,0,0),gz=t.critterArt(id,0,0,'graze'),rs=t.critterArt(id,0,0,'rest'),rn=[0,2,4,6].map(f=>t.critterArt(id,f,0,'run').s);
  ok(gz.s!==st.s&&rs.s!==st.s&&rs.h<st.h,'a deer grazes with its head down and beds down lower ('+st.h+' px standing, '+rs.h+' lying)');
  ok(new Set(rn).size>=3,'fleeing it gallops ('+new Set(rn).size+' frames)');
  const fw=t.critterArt('fowl',0,0,'rest');ok(fw.h<t.critterArt('fowl',0,0).h,'a marsh fowl sits down on its legs to rest');
  const c={id:'deer',st:'flee',hx:0,hy:0},up=[];for(let k=0;k<20;k++){const pn=performance.now;performance.now=()=>k*37;try{up.push(t.herdPose(c,0,true,2).up)}finally{performance.now=pn}}
  ok(Math.max(...up)>=L.bound-1&&Math.min(...up)===0,'a deer bounds as it flees, up to '+Math.max(...up)+' px');
  c.st='bed';ok(t.herdPose(c,0,false,0).how==='rest','at night it lies');c.st='drink';ok(t.herdPose(c,0,false,0).how==='graze','drinking, its head down');c.st='wary';ok(t.herdPose(c,0,false,0).how===null,'wary, its head up')}
 // ---- the wild game's ways (world/critters.js HERD_MIND)
 {const wild=()=>W.critters.filter(c=>!c.home);const H=t.HERD_MIND,think=(c,n,dt=1/30)=>{for(let i=0;i<n;i++)H.think(t.asHerd(c),dt,1)};
  const far=c=>Math.hypot(c.x-P.x,c.y-P.y)>400;
  // (night: every herd beds down where it stands)
  {const dk=window.darkness;window.darkness=()=>1;try{const c=wild().find(far);const x=c.x,y=c.y;think(c,60);ok(c.st==='bed'&&Math.hypot(c.x-x,c.y-y)<.01,'at night a herd beds down where it stands ('+c.st+')')}finally{window.darkness=dk}}
  // (wary: one between its shy reach and wary × it, and it stops, facing him)
  {const c=wild().find(far),D=t.CRITTERS[c.id],x=c.x,y=c.y,p0=[P.x,P.y];P.x=c.x+D.shy*1.3;P.y=c.y;
   try{think(c,30);ok(c.st==='wary'&&Math.hypot(c.x-x,c.y-y)<.01&&c.dir===1,'one coming near (past its shy reach, within '+L.wary+'×): it stops and watches him ('+c.st+')')}finally{P.x=p0[0];P.y=p0[1]}}
  // (to water to drink: its edge reached, it stands there, head down)
  {let c=null,w=null;for(const q of wild())if(far(q)){w=t.wildWater(q,L.drink.r);if(w){c=q;break}}
   if(!c)info('no herd by water');else{c.drink=w;c.st='walk';c.idle=false;c.t=9;let got=false;for(let i=0;i<900&&!got;i++){think(c,1);got=c.st==='drink'}
    ok(got&&Math.hypot(c.x-w.x,c.y-w.y)<=L.drink.at+2&&t.tAt(Math.floor(c.x/TILE),Math.floor(c.y/TILE))!==t.T_WATER,'it walks to the water near it and drinks at its edge, on dry ground')}}
  // (off the holdings' ground: one put on a lot walks off it, none are placed on it)
  // (one by a holding, on ground of its own kind it may stand on: on a lot's field or by the holding)
  {let c=null,at=null;for(const h of t.TOWNS){for(let j=-2;j<=2&&!at;j++)for(let i=-2;i<=2&&!at;i++){const x=h.x+i*TILE,y=h.y+24+j*TILE;if(!t.wildTame(x,y)||!t.walkAt(x,y))continue;
      const q=wild().find(q=>far(q)&&t.habitatOk(q.id,x,y));if(q){c=q;at=[x,y]}}if(at)break}
   if(!at)info('no holding\'s ground any herd may stand on');else{c.x=c.hx=at[0];c.y=c.hy=at[1];c.st=null;think(c,900);
    ok(!t.wildTame(c.x,c.y),'wild game on a holding\'s ground walks off it, away from the holding ('+Math.round(Math.hypot(c.x-at[0],c.y-at[1]))+' px)')}}
  {const n0=W.critters.length;for(let i=0;i<40;i++)t.spawnCritter(false);const nw=W.critters.slice(n0);ok(nw.length>0&&nw.every(c=>!t.wildTame(c.x,c.y)),'new wild game is never placed on a holding\'s ground ('+nw.length+' placed)')}
  // (all of it for three days near and far: none off its habitat, in the water or on the holdings' ground at the end; counts held)
  {const counts=[wild().length];for(let d=0;d<3;d++){for(let i=0;i<400;i++)for(const c of wild())H.think(t.asHerd(c),1/10,1);t.critterDay();counts.push(wild().length)}
   const off=wild().filter(c=>!t.habitatOk(c.id,c.x,c.y)).length,wet=wild().filter(c=>!t.passable(t.terrAt(c.x,c.y))).length,tame=wild().filter(c=>t.wildTame(c.x,c.y)).length;
   ok(!off&&!wet&&tame<=Math.ceil(wild().length*.02),'three days on: none off its habitat ('+off+'), in deep water ('+wet+'), '+tame+' on a holding\'s ground');
   ok(Math.max(...counts)<=t.density(t.WM).critterCap&&Math.min(...counts)>=counts[0]*.9,'its numbers hold: '+counts.join(', ')+' (cap '+t.density(t.WM).critterCap+')')}}
 // ---- a beast in deep water is drawn cut at its waterline (march.js wadeCut), as every marcher is
 {let d=0;for(let r=0;r<1200&&!d;r+=4)for(let a=0;a<24&&!d;a++){const x=P.x+Math.cos(a*.26)*r,y=P.y+Math.sin(a*.26)*r;if(t.depthBand(t.drawnDepth(x,y))>=3)d=t.drawnDepth(x,y)}
  if(!d)info('no deep drawn water near you');else ok(t.wadeCut(d)>=t.WATER.cut[2]&&t.wadeCut(d)>t.wadeCut(d/3)&&t.marchOwners().some(o=>W.monsters.includes(o)),'a beast in deep water ('+d.toFixed(2)+') is cut at its waterline as a marcher, the deeper the more ('+t.wadeCut(d)+' px, '+t.wadeCut(d/3)+' at a third of it)')}
 // ---- a herd as a loose unit (world/critters.js herdFlock, WILD_LIFE.flock; the owner, 2026-11-18: "Wildlife sprite is shrinking back
 //      and forth", "make them move in formation like army but more spread like one unit"): one size, spread, each on its own
 {const FL=L.flock,kinds=Object.keys(t.CRITTERS).filter(k=>!t.CRITTERS[k].live);
  // (every pose of a kind at one scale, and its two nibbling frames one size: no grazer bobbing bigger and smaller)
  const bad=kinds.filter(id=>{const P0=[[0,null],[2,null],[0,'run'],[0,'graze'],[1,'graze'],[0,'rest']].map(([f,h])=>t.critterArt(id,f,0,h)),g0=P0[3],g1=P0[4];return new Set(P0.map(a=>a.k)).size>1||g0.w!==g1.w||g0.h!==g1.h});
  ok(!bad.length,'each kind\'s poses at one scale, its nibbling frames one size ('+(bad.join(', ')||'all '+kinds.length+' kinds')+')');
  const herd=(id,n)=>({crit:true,id,x:5000,y:5000,hx:5000,hy:5000,n,t:0,a:0,dir:1,tire:0,cool:0,coat:7,st:'graze'}),gs0=G.speed;G.speed=1;
  const run=(c,s0,s1,fn)=>{const A0=t.critterArt(c.id,0,c.coat);let F=null;for(let s=s0;s<s1;s+=1/30){if(fn)fn(c,1/30);F=t.herdFlock(c,A0,s*1000)}return F},
    pairs=F=>{let lo=1e9,sum=0;F.m.forEach((p,i)=>{let nn=1e9;F.m.forEach((q,j)=>{if(i!==j)nn=Math.min(nn,Math.hypot(p.x-q.x,p.y-q.y))});sum+=nn;lo=Math.min(lo,nn)});return [sum/F.m.length,lo]},
    spread=(F,c)=>F.m.reduce((a,m)=>a+Math.hypot(m.x-c.x,m.y-c.y),0)/F.m.length;
  // (the flock's own shape, on open ground: its animals' ground, a river bank's or a cliff's edge, is tests/wildground.js's)
  const land0=window.flockLand,push0=window.flockPush;window.flockLand=(c,q)=>q;window.flockPush=(c,m,dx,dy)=>{m.x+=dx;m.y+=dy};
  try{// (at rest: spread round its point, none on another, each grazing, looking up and turning on its own time)
   const c=herd('reindeer',5),A0=t.critterArt(c.id,0,c.coat),w=A0.w;let F=run(c,0,4),low=1e9,same=0,samples=0,flips=0,prev=null;
   for(let s=4;s<34;s+=1/30){F=t.herdFlock(c,A0,s*1000);const pn=performance.now;performance.now=()=>s*1000;let hows;try{hows=F.m.map((m,i)=>t.herdPose(c,i,t.herdGoes(c,m),0).how)}finally{performance.now=pn}
    low=Math.min(low,pairs(F)[1]);if(Math.round(s*30)%15===0){samples++;if(new Set(hows).size===1&&new Set(F.m.map(m=>m.f)).size===1)same++}
    if(prev)flips+=hows.filter((h,i)=>h!==prev[i]).length;prev=hows}
   const [mean]=pairs(F);
   ok(mean>=w*FL.gap*.6&&low>=w*FL.keep-.6,'a herd at rest stands spread round its point: '+mean.toFixed(1)+' px on average to the nearest (its width '+w+', gap '+FL.gap+'), none nearer than '+low.toFixed(1)+' (keep '+(w*FL.keep).toFixed(1)+')');
   ok(same<=samples*.3,'its animals graze, look up and turn each on its own time: all alike '+same+' times of '+samples);
   ok(flips<=c.n*30/(L.graze[0]+L.look[0])*2+c.n,'each lowers and lifts its head slowly ('+flips+' changes among '+c.n+' in 30 s)');
   // (on the way: the first ahead, the rest behind it fanned out, each at its spot's reach, not in step)
   c.st='walk';let far=0,lead=0,n0=0,phase=0;F=run(c,34,36,(c,d)=>{c.x+=8*d});
   for(let s=36;s<46;s+=1/30){c.x+=8/30;F=t.herdFlock(c,A0,s*1000);const q=F.m.map((m,i)=>Math.hypot(...t.flockSpot(c,F,i,F.m.length,Math.max(4,w)*FL.gap,s*1000,true).map((v,k)=>(k?c.y:c.x)+v-(k?m.y:m.x))));far=Math.max(far,...q);
    n0++;if(F.m[0].x>=Math.max(...F.m.slice(1).map(m=>m.x)))lead++;if(new Set(F.m.map(m=>Math.floor(m.d/(Math.max(4,w)/t.PX.MAP_STEPS))%t.PX.MAP_STEPS)).size>1)phase++}
   ok(far<=Math.max(4,w)*FL.gap*2.5&&lead>=n0*.8,'walking, the first goes ahead ('+Math.round(lead/n0*100)+'% of the time) and each keeps within '+far.toFixed(1)+' px of its spot in the wedge');
   ok(phase>=n0*.6,'they do not step as one ('+Math.round(phase/n0*100)+'% of the time on different steps)');
   // (fleeing they scatter wider; at rest again they come back together)
   const walk=spread(F,c);c.st='flee';F=run(c,46,49,(c,d)=>{c.x+=48*d});const fled=spread(F,c);
   c.st='graze';F=run(c,49,61);const back=spread(F,c);
   ok(fled>walk*1.3&&back<fled,'fleeing they scatter wider ('+fled.toFixed(1)+' px from its point, '+walk.toFixed(1)+' walking), and gather again at rest ('+back.toFixed(1)+')');
   // (one more in it and the herd gone far meanwhile (out of sight a while, a calf born): none left behind where it was)
   {c.x+=900;c.y+=300;c.n=6;c.st='graze';const F3=t.herdFlock(c,A0,62000),off=Math.max(...F3.m.map(m=>Math.hypot(m.x-c.x,m.y-c.y)));
    ok(F3.m.length===6&&off<Math.max(4,w)*FL.gap*3,'one more in a herd gone far meanwhile: all '+F3.m.length+' with it ('+off.toFixed(1)+' px from its point at most)')}
   // (a big herd splits in two knots that drift apart and back)
   const c2=herd('fowl',6),A2=t.critterArt(c2.id,0,c2.coat),knots=F=>{const g=i=>F.m.filter((m,j)=>j%2===i),cen=a=>[a.reduce((s,m)=>s+m.x,0)/a.length,a.reduce((s,m)=>s+m.y,0)/a.length];const [a,b]=[cen(g(0)),cen(g(1))];return Math.hypot(a[0]-b[0],a[1]-b[1])};
   let lo2=1e9,hi2=0;for(let s=0;s<140;s+=1/10){const F2=t.herdFlock(c2,A2,s*1000);if(s>4){const k=knots(F2);lo2=Math.min(lo2,k);hi2=Math.max(hi2,k)}}
   ok(hi2>lo2+A2.w*FL.gap*.8,'a herd of '+c2.n+' splits in two knots drifting apart ('+hi2.toFixed(1)+' px between them at most) and back ('+lo2.toFixed(1)+')')}
  finally{G.speed=gs0;window.flockLand=land0;window.flockPush=push0}}
 // ---- steady, never jittering (the owner, 2026-11-18: "The wildlife sometimes jumping rapidly and looping left and right rapidly"):
 //      a herd caught between fleeing and watching, its point jinking, its facing flipping each moment, at 30 and 60 frames a second
 {const FL=L.flock,gs0=G.speed,land0=window.flockLand,push0=window.flockPush;G.speed=1;window.flockLand=(c,q)=>q;window.flockPush=(c,m,dx,dy)=>{m.x+=dx;m.y+=dy};// (on open ground, as above)
  try{for(const fps of [30,60]){const dt=1/fps,c={crit:true,id:'deer',x:5000,y:5000,hx:5000,hy:5000,n:5,t:0,a:0,dir:1,tire:0,cool:0,coat:11,st:'graze'},A0=t.critterArt(c.id,0,c.coat);
    let F=null,over=0,worst=0,fast=0,flick=0,frames=0;const hist=new Map(),last=new Map(),seen=new Map();
    for(let k=0;k<fps*20;k++){const s=k*dt,ms=s*1000,ph=Math.floor(k/(fps>30?3:2));
     // (the herd's mind flickering: fleeing two or three frames, watching two or three; its point bolting with jinks; its dir flipping)
     c.st=s<4?'graze':s<16?(ph%2?'flee':'wary'):'graze';c.dir=ph%2?1:-1;if(s>=4&&s<16&&c.st==='flee'){const a=Math.sin(s*5)*1.2;c.x+=Math.cos(a)*44*dt;c.y+=Math.sin(a)*44*dt*.6}
     const before=F?F.m.map(m=>[m.x,m.y]):null;F=t.herdFlock(c,A0,ms);const st=t.flockSt(F,c.st,ms);frames++;
     F.m.forEach((m,i)=>{if(before&&before[i]){const d=Math.hypot(m.x-before[i][0],m.y-before[i][1]),lim=Math.max(F.sp*1.1,FL.amble)*(FL.pace[0]+FL.pace[1])*FL.catch*dt+.6;worst=Math.max(worst,d);if(d>lim)over++}
      if(last.has(i)&&last.get(i).f!==m.f&&s-last.get(i).ft<FL.face.hold-dt)fast++;if(!last.has(i)||last.get(i).f!==m.f)last.set(i,{f:m.f,ft:s});
      const go=t.flockHold(m,'g',t.herdGoes(c,m),ms,FL.hold.go),pk=(t.herdPose(c,i,go,0,st,m).how||'')+(go?'+':''),H=hist.get(i)||[];if(!H.length||H[H.length-1][0]!==pk)H.push([pk,s]);hist.set(i,H)})}
    // (a flicker: a pose shown under 0.3 s between two of the same)
    for(const H of hist.values())for(let j=1;j+1<H.length;j++)if(H[j-1][0]===H[j+1][0]&&H[j+1][1]-H[j][1]<.3)flick++;
    ok(!over&&!fast&&!flick,fps+' fps, a herd torn between flight and watching 12 s: no animal steps further than its walk allows in a frame ('+worst.toFixed(2)+' px at most, '+over+' over), none turns about sooner than '+FL.face.hold+' s after its last turn ('+fast+'), no pose flickers under 0.3 s ('+flick+')')}}
  finally{G.speed=gs0;window.flockLand=land0;window.flockPush=push0}
  // (a duck's way wobbling about the vertical and a lizard darting to and fro: drawn turning at most once in AMBIENT.face s; a duck's mate
  //  at the bank drawn swimming or standing only once it has been over the water or the land AMBIENT.duck.wet s)
  {const e={t:0,dir:1};let n=0,fd=1,lt=-9,early=0;for(let k=0;k<120;k++){e.t=k/60;e.dir=k%3?1:-1;t.ambFace(e);if(e.fd!==fd){if(e.t-lt<A.face-1e-9)early++;lt=e.t;fd=e.fd;n++}}
   const m={};let sw=0,prev=null;for(let k=0;k<60;k++){const w=t.ambWet(m,k%4<2,k/60);if(prev!=null&&w!==prev)sw++;prev=w}const m2={};t.ambWet(m2,true,0);let at=null;for(let k=1;k<60;k++){if(!t.ambWet(m2,false,k/60)&&at==null)at=k/60}
   ok(!early&&n<=Math.ceil(2/A.face)+1&&!sw&&at!=null&&Math.abs(at-A.duck.wet)<.05,'ambient creatures drawn steady: '+n+' turns in 2 s of a facing flipping every few frames (none sooner than '+A.face+' s), a duck\'s mate at a flickering bank '+sw+' changes, onto land for good after '+(at==null?'never':at.toFixed(2)+' s'))}}
 // ---- a frame of it stays cheap
 {A.on=true;try{t.drawWorld();const t0=performance.now();for(let i=0;i<30;i++){t.drawWorld()}const per=(performance.now()-t0)/30;const a0=performance.now();for(let i=0;i<30;i++){const e=[];t.ambientWorld(e,G.cam,t.vis());t.drawHerds(e,G.cam,t.vis())}const amb=(performance.now()-a0)/30;
   ok(amb<4,'the wildlife\'s share of a frame: '+amb.toFixed(2)+' ms (the frame '+per.toFixed(1)+' ms)')}finally{A.on=false}}
});
