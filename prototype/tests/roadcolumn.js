'use strict';
// Road travel by army type (doc/LIVE_WORLD_DESIGN.md §6; the owner, 2026-11-01: "when travel by road it will force the marching to
// columns in order to snap them near the road, this should apply for all armies, otherwise no road bonus ... a travelling style
// based on army types"): the road's speed is its men's (world.js armyGround), so a column on the road beats a ring across it, on open
// ground and in woods; a column (marchstyles.js MarchColumn) 2 abreast along its guide's trail bends with a curved road; forming up
// takes time and slows the army; each kind its own style (TRAVEL_STYLES, TravelStyle): a lord in column on a long trip, in his battle
// style near enemy land; a band never; a caravan always, its wagon in the middle; beasts ignore roads; your By road a column, the
// Under way panel says so. A column that detects a band re-forms before contact; one ambushed from the woods meets it strung out.
// Its buffers kept; no runtime errors.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TS=t.TRAVEL_STYLES,Style=t.TravelStyle,RB=t.ROAD_BAND;
 Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:99});t.WORLD_BATTLE.on=true;t.GUIDE.on=false;t.setSpeed(1);G.clock=t.DAY*.3;
 P.troops={hum_foot:20};P.comps={};P.bsta=100;
 const {segs:S,est:E}=t.artRoadSegs();
 // (px a point stands past the nearest road's band as drawn (its full width), negative inside it)
 const offBand=(x,y)=>{let v=Infinity;for(let q=0;q<S.length;q+=5){const a=S[q],b=S[q+1],c=S[q+2],d=S[q+3];if(x<Math.min(a,c)-80||x>Math.max(a,c)+80||y<Math.min(b,d)-80||y>Math.max(b,d)+80)continue;
   const vx=c-a,vy=d-b,L=vx*vx+vy*vy,u=L?Math.max(0,Math.min(1,((x-a)*vx+(y-b)*vy)/L)):0,full=S[q+4]&1?RB.great[0]:RB.track[0];v=Math.min(v,Math.hypot(x-a-vx*u,y-b-vy*u)-full)}return v};
 const ground=()=>t.travelMul()/t.bandPace();
 // (a straight stretch of road len px back from a point, land of kind kind either side 22-30 px off it, far from the holdings)
 const stretch=(kind,len)=>{for(let q=0;q<S.length;q+=5){const a=S[q],b=S[q+1],L=Math.hypot(S[q+2]-a,S[q+3]-b);if(L<4)continue;const hx=(S[q+2]-a)/L,hy=(S[q+3]-b)/L;
   for(let s=0;s<=L;s+=8){const x=a+hx*s,y=b+hy*s;if(t.TOWNS.some(h=>Math.hypot(h.x-x,h.y-y)<200))continue;let good=true;
    for(let k=-20;k<=len&&good;k+=4){const X=x-hx*k,Y=y-hy*k;if((t.RoadBand.at(X,Y)&63)<63||!t.passable(t.terrAt(X,Y)))good=false}
    for(let k=0;k<=len&&good;k+=20)for(const sd of [-1,1])for(const w of [22,30]){const X=x-hx*k-hy*w*sd,Y=y-hy*k+hx*w*sd;if(t.RoadBand.at(X,Y)||t.terrAt(X,Y)!==kind)good=false}
    if(good)return{x,y,hx,hy}}}return null};
 // (yours standing on it, your men formed round you a while: a column (By road on) laid back along it, else your battle lanes)
 const stand=(Q,col)=>{Kit.world({encCool:99});Kit.goTo(Q.x,Q.y);t.setByRoad(col);Style.forget(P);t.MARCH_ARMIES.delete(P);const A=t.MarchArmy.of(P);A.face=A.heading=Math.atan2(Q.hy,Q.hx);A.trail.clear();A.sync();
  for(let i=0;i<300;i++)A.step(1/30);return A};
 const span=A=>{let m=0;for(const u of A.units)for(const v of A.units)m=Math.max(m,Math.hypot(u.x-v.x,u.y-v.y));return m};
 // (px its men are spread along its column's way, MarchColumn vx, vy, va: from the first to the last)
 const along=(A,c)=>{let lo=Infinity,hi=-Infinity;for(const u of A.units){let best=Infinity,s=0;for(let i=0;i<c.nv-1;i++){const L=c.va[i+1]-c.va[i];if(!L)continue;const dx=c.vx[i+1]-c.vx[i],dy=c.vy[i+1]-c.vy[i],f=Math.max(0,Math.min(1,((u.x-c.vx[i])*dx+(u.y-c.vy[i])*dy)/(L*L))),d=Math.hypot(c.vx[i]+dx*f-u.x,c.vy[i]+dy*f-u.y);if(d<best){best=d;s=c.va[i]+L*f}}
   lo=Math.min(lo,s);hi=Math.max(hi,s)}return hi-lo};
 // ---- a column on the road beats a ring across it: on open ground and in the woods
 const speeds={};let deep=0;// (your lanes' depth along the road: px from the first man to the last)
 for(const [name,kind] of [['open',t.T_OPEN],['woods',t.T_FOREST]]){const Q=stretch(kind,110);if(!Q){info('no straight road through '+name);continue}
  const A=stand(Q,true),col=!!t.marchLayout(P).column,gc=ground(),off=Math.max(...A.units.map(u=>offBand(u.x,u.y))),sc=span(A);
  const B=stand(Q,false),gr=ground(),sr=span(B),pr=B.units.map(u=>(u.x-Q.x)*Q.hx+(u.y-Q.y)*Q.hy);deep=Math.max(deep,Math.max(...pr)-Math.min(...pr));const wb=t.WORLD_BATTLE.on;t.WORLD_BATTLE.on=false;const far=[true,false].map(c=>{t.setByRoad(c);Style.forget(P);return ground()});t.WORLD_BATTLE.on=wb;
  speeds[name]={col:gc,ring:gr};info(name+': a column on the road '+gc.toFixed(3)+' (its men within '+off.toFixed(1)+' px of the band, '+sc.toFixed(0)+' px long), your lanes across it '+gr.toFixed(3)+' ('+sr.toFixed(0)+' px across); not marched man by man, a column '+far[0].toFixed(3)+', a ring '+far[1].toFixed(3));
  ok(col&&off<=1&&gc>gr*1.04&&far[0]>far[1],name+': a column on the road ('+gc.toFixed(3)+') beats a ring across it ('+gr.toFixed(3)+'), its men on the band; and by its style when not marched ('+far[0].toFixed(3)+' to '+far[1].toFixed(3)+')');
  // (the owner, 2026-11-01: "Road" on the card while most of the army stood in the woods) the card's ground is its men's, as its pace is
  if(name==='woods'){stand(Q,false);const M=t.armyGroundMix(P);t.updateHUD(true);const card=(document.querySelector('.pcard')||document.body).textContent;
   ok(M.n>1&&M.road>0&&M.road*2<M.n&&M.names[0][0]!==t.regionAt(Q.x,Q.y).name&&/part on the road/.test(card),'your lanes across a road in the woods: the card names the ground most stand on, part on the road ('+M.names.map(x=>x.join(' ')).join(', ')+'; on the road '+M.road+' of '+M.n+')')}}
 t.setByRoad(false);
 // ---- your By road: a column, and the Under way panel says so
 {const Q=stretch(t.T_OPEN,110)||{x:P.x,y:P.y,hx:1,hy:0};Kit.goTo(Q.x,Q.y);t.setByRoad(true);Style.forget(P);t.updateHUD(true);const on=Style.column(P),line=(document.querySelector('#underway [data-k="road"]')||{}).textContent||'';
  t.setByRoad(false);Style.forget(P);t.updateHUD(true);const off=Style.column(P);
  ok(on&&/in column/.test(line)&&!off&&!document.querySelector('#underway [data-k="road"]'),'By road on: your army in a column, Under way shows "'+line.trim()+'"; off, your lanes again')}
 // ---- every kind its own style
 const road=stretch(t.T_OPEN,110),R0=road||{x:P.x+300,y:P.y,hx:1,hy:0};Kit.goTo(R0.x-400,R0.y-400);
 {const b=t.asParty({kind:'bandits',ld:t.newChief('bandits',1),troops:Array(15).fill('militia'),x:R0.x,y:R0.y,cool:0,t:999,idle:true});t.bandits.push(b);Style.forget(b);
  const col=Style.column(b),wb=t.WORLD_BATTLE.on;t.WORLD_BATTLE.on=false;const sp=t.partySpeed(b,b.troops);TS.on=false;const was=t.partySpeed(b,b.troops);TS.on=true;t.WORLD_BATTLE.on=wb;
  ok(!col&&t.marchLayout(b).style==='screen'&&!t.marchLayout(b).column&&sp<was,'a band on the road: never a column (its loose screen), so only a share of the road\'s speed ('+sp.toFixed(1)+' for '+was.toFixed(1)+' px a moment by its point)');t.bandits.length=0}
 {const m=t.asMonster({id:'wolf',n:8,lv:1,x:R0.x,y:R0.y,hx:R0.x,hy:R0.y,cool:0});W.monsters.push(m);Style.forget(m);
  ok(!Style.column(m)&&t.marchLayout(m).style==='pack'&&!t.marchLayout(m).column,'beasts on the road ignore it: a pack, never a column (their pace never more than the land\'s: monsters.js)');W.monsters.length=0}
 // (a caravan: always a column on the road, its guards before and after its wagon; a band in its sight: its guards round it)
 {const tw=t.TOWNS.filter(h=>h.owner&&h.owner!=='player'),c=t.asParty({cv:true,fac:tw[0].owner,from:tw[0].name,to:tw[1].name,x:R0.x,y:R0.y,goods:{grain:5},guards:8,cool:0,dir:R0.hx<0?-1:1});W.caravans.push(c);Style.forget(c);
  const col=Style.column(c);t.MARCH_ARMIES.delete(c);const A=t.MarchArmy.of(c);A.face=A.heading=Math.atan2(R0.hy,R0.hx);A.trail.clear();A.sync();for(let i=0;i<300;i++)A.step(1/30);
  for(let i=0;i<120;i++){c.x+=R0.hx*.3;c.y+=R0.hy*.3;A.step(1/30)}
  const along=A.units.map(u=>(u.x-c.x)*R0.hx+(u.y-c.y)*R0.hy),cart=t.marchCart(c),clear=Math.min(...cart.flatMap(b=>A.units.map(u=>Math.hypot(u.x-b.x,u.y-b.y)-(b.r+t.marchBody(u))/2)));
  ok(col&&t.marchLayout(c).column&&along.filter(v=>v>0).length===4&&along.filter(v=>v<0).length===4&&Math.min(...along.map(Math.abs))>12&&clear>-1.5,'a caravan on the road: a column, 4 guards before its wagon and 4 after ('+along.map(Math.round).join(' ')+' px along it), none on its wagon, ox or drover ('+clear.toFixed(1)+')');
  const b=t.asParty({kind:'bandits',troops:Array(10).fill('militia'),x:c.x+R0.hx*(TS.alert-20),y:c.y+R0.hy*(TS.alert-20),cool:0,t:999,idle:true});t.bandits.push(b);Style.forget(c);
  ok(!Style.column(c)&&t.marchLayout(c).style==='convoy','a band within '+TS.alert+' px of it: its guards round its wagon again (convoy)');t.bandits.length=0;W.caravans.length=0}
 // (a lord: a column on a long trip through his own land, his battle style near land of a realm at war with his, or a threat near)
 {const L=W.lords.find(l=>t.fiefsOf(l.fac).length>=2)||W.lords[0],fs=t.fiefsOf(L.fac);L.troops=Array(20).fill('hum_foot');L.inside=null;L.waylay=null;L.defend=null;L.follow=null;L.with=null;
  const quiet=fs.find(h=>{L.x=h.x;L.y=h.y+40;return !Style.enemyLand(L)}),far=quiet&&fs.slice().sort((a,b)=>Math.hypot(b.x-quiet.x,b.y-quiet.y)-Math.hypot(a.x-quiet.x,a.y-quiet.y))[0];
  if(!quiet||!far||Math.hypot(far.x-quiet.x,far.y-quiet.y)<=TS.long)info('no two holdings of one realm far apart, away from its enemies');
  else{L.x=quiet.x;L.y=quiet.y+40;L.state='home';L.tgt=far.name;Style.forget(L);const trip=Style.column(L),lay=t.marchLayout(L);
   L.tgt=quiet.name;L.x=quiet.x+30;Style.forget(L);const near=Style.column(L);L.tgt=far.name;
   const foe=t.TOWNS.find(h=>h.owner&&h.owner!==L.fac&&h.owner!=='player'&&t.atWar(L.fac,h.owner))||(()=>{const h=t.TOWNS.find(h=>h.owner&&h.owner!==L.fac&&h.owner!=='player');if(h)t.realmOf(L.fac).setRel(h.owner,'war');return h})();
   L.x=foe.x+TS.near/2;L.y=foe.y;Style.forget(L);const war=Style.column(L),inEnemy=Style.enemyLand(L),warLay=t.marchLayout(L);
   L.x=quiet.x;L.y=quiet.y+40;Style.forget(L);const b=t.asParty({kind:'bandits',troops:Array(10).fill('militia'),x:L.x+60,y:L.y,cool:0,t:999,idle:true});t.bandits.push(b);const threat=Style.column(L);t.bandits.length=0;Style.forget(L);
   ok(trip&&lay.column&&!near,'a lord on a long trip through his own land ('+Math.round(Math.hypot(far.x-quiet.x,far.y-quiet.y))+' px to '+far.name+'): a column; bound for where he stands: his battle style');
   ok(inEnemy&&!war&&!warLay.column,'near land of a realm at war with his ('+foe.name+'): his battle style ('+warLay.style+')');
   ok(!threat,'a band within '+TS.alert+' px of him: his battle style')}
  L.x=-9999;L.y=-9999;Style.forget(L)}
 // ---- a curved road: the column bends with it; forming up takes time; its buffers kept
 const pairs=[],pairsAll=[];for(const r of t.WM.roads){if(!r.a||!r.b||r.est)continue;const h1=t.townBy(r.a),h2=t.townBy(r.b);if(!h1||!h2||!h1.owner||!h2.owner)continue;{const d=Math.hypot(h1.x-h2.x,h1.y-h2.y);if(d>18*t.TILE&&d<40*t.TILE)pairsAll.push([h1,h2,d])}if(r.path.some(i=>t.TOWNS.some(z=>z!==h1&&z!==h2&&Math.hypot(z.tx-i%t.MW,z.ty-(i/t.MW|0))<8))||[h1,h2].some(h=>{const s=t.gateSpot(h);return Math.hypot(s.x-h.tx*t.TILE-8,s.y-(h.ty+1)*t.TILE-8)>24}))continue;const d=Math.hypot(h1.x-h2.x,h1.y-h2.y);if(d>18*t.TILE&&d<40*t.TILE)pairs.push([h1,h2,d])}
 pairs.sort((a,b)=>a[2]-b[2]);pairsAll.sort((a,b)=>a[2]-b[2]);// (between the realms' holdings, through no other's, each set out from at its gate: a hamlet's track, the free folk's own way,
 // aside, a road through a hamlet (its column round its houses), and a gate crowded by its lots, the start a way off it)
 const way=(h1,h2,road=true)=>{Kit.clear();Kit.world({encCool:99});G.clock=t.DAY*.3;const s1=t.gateSpot(h1),s2=t.gateSpot(h2);Kit.goTo(s1.x,s1.y);G.lastTown=h1;G.chase=null;P.stuck=0;t.setByRoad(road);t.MARCH_ARMIES.delete(P);Style.forget(P);
  t.worldGo(s2.x,s2.y);t.wuiSync(performance.now());const w=t.WUI.way;if(!w||!w.ok)return null;const at=[0];for(let i=1;i<w.n;i++)at.push(at[i-1]+Math.hypot(w.X[i]-w.X[i-1],w.Y[i]-w.Y[i-1]));return{X:w.X,Y:w.Y,n:w.n,at,to:s2}};
 const pick=(w,s)=>{let i=0;while(i<w.n-1&&w.at[i]<s)i++;return{x:w.X[i],y:w.Y[i],i}};
 if(!pairs.length)info('no two holdings with a road between them');
 for(const [h1,h2] of pairs.slice(0,1)){const w=way(h1,h2);if(!w){info('no way from '+h1.name+' to '+h2.name);break}
  // (in your lanes a while, then By road on: into a column on the march)
  t.setByRoad(false);for(let f=0;f<80;f++)t.updateWorld(.05);t.setByRoad(true);
  let A=null,formFrames=0,f0=null,worst=-Infinity,guide=-Infinity,places=-Infinity,offs=[],bend=0,bendWorst=-Infinity,looks=0,buf=null,same=true;const slow=[],fast=[];
  for(let f=0;f<6000&&P.tx!=null&&G.mode==='world';f++){const x0=P.x,y0=P.y;t.updateWorld(.05);A=t.MARCH_ARMIES.get(P);if(!A)continue;const col=t.marchLayout(P).column;
   if(A.col&&A.forming){formFrames++;if(f0==null)f0=f;slow.push(Math.hypot(P.x-x0,P.y-y0))}else if(A.col&&f0!=null&&fast.length<slow.length)fast.push(Math.hypot(P.x-x0,P.y-y0));
   if(!col||A.forming||f%5||!t.RoadBand.on(A.gx,A.gy)||[h1,h2].some(h=>Math.hypot(h.x-A.gx,h.y-A.gy)<6*t.TILE))continue;// (on the road between: not where it leaves the band for the arrival spot by a gate)
   if(!buf)buf={x:A.trail.x,T:col.T,t:A.targets()};else same=same&&A.trail.x===buf.x&&col.T===buf.T&&A.targets()===buf.t;
   const off=Math.max(...A.units.map(u=>offBand(u.x,u.y)));looks++;worst=Math.max(worst,off);offs.push(off);guide=Math.max(guide,offBand(A.gx,A.gy));places=Math.max(places,...col.T.map(p=>offBand(p.x,p.y)));
   const n=col.ru.length,turn=Math.abs(Math.atan2(col.ru[0]*col.rv[n-1]-col.rv[0]*col.ru[n-1],col.ru[0]*col.ru[n-1]+col.rv[0]*col.rv[n-1]));if(turn>.4){bend++;bendWorst=Math.max(bendWorst,off)}}
  const arrived=Math.hypot(P.x-w.to.x,P.y-w.to.y)<40||P.tx==null;
  info(h1.name+' to '+h2.name+' by road: '+looks+' looks at the formed column, '+bend+' on a bend (its ends '+'more than 23° apart), the farthest man '+worst.toFixed(1)+' px past the band ('+bendWorst.toFixed(1)+' on a bend), its guide (the way your hero walks) '+guide.toFixed(1)+', their places '+places.toFixed(1));
  // (its places on the band; its men on it or its shoulder (RB.great[1] px past it) a few px more, round its bends too (a man at
  // pace trails his place, and cuts a sharp bend by a little; a straggler left from forming makes straight for his place); your
  // lanes far off it, below)
  const s=offs.slice().sort((a,b)=>a-b),med=s[s.length>>1],p95=s[Math.floor(s.length*.95)],sh=RB.great[1];
  // (2026-11-01, men filling the nearest free place and the column's order merged: on a bend its farthest man in 95% of looks
  // measured 11-13.3 px off the road's line over repeated runs (the shoulder 6), at worst about 17; the bound sh+8, not sh+6)
  // (places within .5 px of the road band: men keep their room off houses by the road (battle/route.js PATHS), which shifts the
  // column's middle, and with it its guide's trail, a fraction of a pixel; the owner, 2026-11-01: paths round obstacles)
  // (within 1.5 px: out of its gate along a holding's walls, now solid (battle/route.js PATHS.holding; the owner, 2026-11-02: "the
  // holding walls is not correct because the unit can walk through it"), its men keep their room off them too: off, .5 as before)
  // (within 2: a hamlet's lots by the road, 2026-11-05: 1.6 px between Elderglen and Silverbough)
  ok(looks>40&&bend>=3&&places<=(t.PATHS.holding?2:.5)&&med<=4&&p95<=sh+8&&worst<=sh+12,'a column by road bends with it: its places on the road\'s band as drawn ('+places.toFixed(1)+' px); its farthest man a look '+med.toFixed(1)+' px past it most, '+p95.toFixed(1)+' in 95% of looks (its shoulder '+sh+' px), at worst '+worst.toFixed(1)+' ('+bendWorst.toFixed(1)+' over '+bend+' bends)');
  const ms=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length);
  ok(f0!=null&&formFrames>=8&&fast.length>=4&&ms(slow)<ms(fast)*.85,'forming up takes time: '+formFrames+' frames ('+(formFrames*.05).toFixed(2)+' s) from its lanes into its column, the army slower meanwhile ('+ms(slow).toFixed(2)+' px a frame for '+ms(fast).toFixed(2)+' formed)');
  ok(same&&looks>0,'its trail, its places and its targets the same buffers all the way (no allocation growth)');
  // (the lanes on the same way: across the band, far off it)
  {const w2=way(h1,h2);t.setByRoad(false);Style.forget(P);t.worldGo(w2.to.x,w2.to.y);let wl=-Infinity;for(let f=0;f<600&&P.tx!=null&&G.mode==='world';f++){t.updateWorld(.05);const a=t.MARCH_ARMIES.get(P);if(f>100&&f%10===0&&a)wl=Math.max(wl,...a.units.map(u=>offBand(u.x,u.y)))}
   info('the same way in your lanes (By road off): the farthest man '+wl.toFixed(1)+' px past the band')}
  // ---- detected: a band on the road ahead, in your sight (Scouting 10: your scouts out ahead, P.sight): your column takes its
  // lanes before it meets you, with TRAVEL_STYLES.yourChoice off (on, the owner's 2026-11-02: your By road alone decides yours, an
  // AI army's as here: tests/corridor.js)
  {const w3=way(h1,h2),sk=P.skill,yc=TS.yourChoice;TS.yourChoice=false;P.skill=k=>k==='scout'?10:sk.call(P,k);P.troops={hum_levy:12};let f=0;for(;f<400&&P.tx!=null&&G.mode==='world'&&!(t.MARCH_ARMIES.get(P)?.col&&!t.MARCH_ARMIES.get(P).forming&&f>60);f++)t.updateWorld(.05);
   let k=0,bd=Infinity;for(let i=0;i<w3.n;i++){const d=Math.hypot(w3.X[i]-P.x,w3.Y[i]-P.y);if(d<bd){bd=d;k=i}}const q=pick(w3,w3.at[k]+TS.alert+140);
   const b=t.asParty({kind:'bandits',ld:t.newChief('bandits',2),troops:Array(30).fill('militia'),x:q.x,y:q.y,cool:0,t:999,idle:true});t.bandits.push(b);G.encCool=0;const was=t.MARCH_ARMIES.get(P)?.col;
   let seen=-1,at=0,n=0;for(;n<1500&&G.mode==='world'&&!G.enc;n++){t.updateWorld(.05);if(seen<0&&!Style.column(P)){seen=n;at=Math.hypot(b.x-P.x,b.y-P.y)}}const A=t.MARCH_ARMIES.get(P);
   info('a band on the road: seen '+Math.round(at)+' px off (your sight '+Math.round(t.vis())+'), after '+seen+' frames; met '+Math.round(Math.hypot(b.x-P.x,b.y-P.y))+' px off, after '+n);
   ok(was&&seen>=0&&G.enc&&A&&!A.col&&!A.forming,'your column detects a band on the road ahead ('+TS.alert+' px of its ring, in your sight): it takes its lanes and stands formed before they meet ('+(seen>=0?seen:'never')+' then '+n+' frames)');
   Kit.world({encCool:99});t.bandits.length=0;P.troops={hum_foot:20};P.skill=sk;TS.yourChoice=yc}
 }
 // ---- ambushed: lying in wait in the trees by the road, unseen; it meets your column strung out
 {let at=null,w=null,from=null;
  for(const [h1,h2] of pairsAll.slice(0,6)){w=way(h1,h2);if(!w)continue;
   for(let i=0;i<w.n&&!at;i++){if(w.at[i]<260||w.at[w.n-1]-w.at[i]<120)continue;const tx=Math.floor(w.X[i]/t.TILE),ty=Math.floor(w.Y[i]/t.TILE);
    for(let j=-2;j<=2&&!at;j++)for(let k=-2;k<=2&&!at;k++){const x=(tx+k+.5)*t.TILE,y=(ty+j+.5)*t.TILE;if(t.tAt(tx+k,ty+j)===t.T_FOREST&&!t.roadNear(x,y,0)&&t.roadNear(x,y,2)&&Math.hypot(x-w.X[i],y-w.Y[i])<36)at={x,y}}}
   if(at){from=[h1,h2];break}}
  if(!at)info('no wood beside a road on the ways tried');
  else{way(...from);const X=t.WAYLAY,rate=X.spot.rate,scout=X.spot.scout,sk=P.skill,rnd=Math.random;P.skill=k=>k==='scout'?0:sk.call(P,k);X.spot.rate=0;X.spot.scout=0;
   try{const b=t.asParty({kind:'bandits',ld:t.newChief('bandits',2),troops:Array(30).fill('militia'),x:at.x+6,y:at.y,cool:0,t:999,idle:true});t.bandits.push(b);
    Math.random=()=>0;try{t.Waylay.consider(b,1)}finally{Math.random=rnd}b.waylay.x=at.x;b.waylay.y=at.y;b.x=at.x;b.y=at.y;b.waylay.until=t.Clock.hours()+6;G.encCool=0;
    let n=0;for(;n<3000&&G.mode==='world'&&!G.enc&&P.tx!=null;n++){G.encCool=0;t.updateWorld(.05)}const A=t.MARCH_ARMIES.get(P),col=t.marchLayout(P).column;
    const len=A&&col?along(A,col):0,wide=A?span(A):0;info('the ambush sprang after '+n+' frames: your army '+(A?.col?'in column':'formed')+', '+len.toFixed(0)+' px along the road (its column '+(col?col.len.toFixed(0):'-')+' px; '+wide.toFixed(0)+' px end to end)');
    ok(G.enc&&G.enc.btype?.kind==='ambush'&&A&&A.col&&col&&len>=deep*1.5,'ambushed from the trees unseen: it meets your column still in column, strung out along the road ('+len.toFixed(0)+' px of it; your lanes '+deep.toFixed(0)+' px deep)');
    if(G.enc){t.act('fight');const B=t.B,mine=B?.units.filter(u=>u.team===0&&u.hp>0)||[];let m=0;for(const u of mine)for(const v of mine)m=Math.max(m,Math.hypot(u.x-v.x,u.y-v.y));const sc=B?.world?.scale||6;
     ok(B?.world&&B.surprise&&Math.abs(m/sc-wide)<=6,'the battle opens with your men where they marched: strung out over '+(m/sc).toFixed(0)+' px end to end, as on the road');if(B){B.over=true;B.win=true;B.endT=0;t.updateBattle(.01);t.act('cont')}}}
   finally{P.skill=sk;X.spot.rate=rate;X.spot.scout=scout;Math.random=rnd;t.bandits.length=0;Kit.world({encCool:99})}}}
 t.setByRoad(false);
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
