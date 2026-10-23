'use strict';
// The way straightened (world/router.js waySmooth, wayStraight; the owner, 2026-10-23: the way planned and walked was a staircase,
// east, then diagonal, then east again): over the generated worlds (the classic seed, Normal s1-s4), random trips of 10 to 120
// tiles walked by Router.travel 2 px a step, with the straightening on and off (WAY_SMOOTH.on), plain, a road keeper's (a
// caravan's, WAY.keep) and a worker's (WAY.folk): the walk straightened costs (the tiles' costs, px by px) at most WAY_SMOOTH.tol
// more than the tile to tile walk, and turns far less (heading changes over 15 degrees); it never sets foot on a closed tile nor
// passes within 1 px of one (no corner cut); a diagonal over open ground is one straight line; lords to a holding's gate and
// caravans on the roads arrive as before (steps), the caravans no more off the road. INFO: turns, cost ratios, ms a straightening.
Kit.suite(({ok,info})=>{
 const t=T,S=t.WAY_SMOOTH,TL=t.TILE,W0=t.WM,pct=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(s.length*p))]};
 // (walker w to goal g, 2 px a step: its points, whether it got there)
 const walk=(x,y,g,on,max)=>{S.on=on;const w={x,y},pts=[[x,y]];let i=0,moved=true;
  for(;i<(max||30000)&&Math.hypot(w.x-g.x,w.y-g.y)>3&&moved;i++){const x0=w.x,y0=w.y;moved=t.Router.travel(w,g,2)&&(w.x!==x0||w.y!==y0);pts.push([w.x,w.y])}
  return{pts,steps:i,there:Math.hypot(w.x-g.x,w.y-g.y)<=3}};
 // (a walk's cost by the tiles' costs (rm a road keeper's), its turns, its points on a closed tile or within 1 px of one, away
 // from its two ends)
 const cost=(pts,rm)=>{let c=0;for(let i=1;i<pts.length;i++)c+=t.wayLineCost(pts[i-1][0],pts[i-1][1],pts[i][0],pts[i][1],rm);return c};
 const turns=pts=>{let n=0,h=null;for(let i=1;i<pts.length;i++){const dx=pts[i][0]-pts[i-1][0],dy=pts[i][1]-pts[i-1][1];if(Math.hypot(dx,dy)<.5)continue;const a=Math.atan2(dy,dx);
  if(h!=null){let d=Math.abs(a-h);if(d>Math.PI)d=2*Math.PI-d;if(d>.26)n++}h=a}return n};
 const closed=(x,y)=>{const tx=Math.floor(x/TL),ty=Math.floor(y/TL);return tx<0||ty<0||tx>=t.MW||ty>=t.MH||!t.wayOpen(ty*t.MW+tx)};
 const cuts=pts=>{let n=0;const a=pts[0],b=pts[pts.length-1];for(const [x,y] of pts){if(Math.hypot(x-a[0],y-a[1])<14||Math.hypot(x-b[0],y-b[1])<14)continue;
  if(closed(x,y)||closed(x-1,y-1)||closed(x+1,y-1)||closed(x-1,y+1)||closed(x+1,y+1))n++}return n};
 const offRoad=pts=>pts.filter(([x,y])=>!t.RoadBand.on(x,y)&&t.terrAt(x,y)!==t.T_ROAD).length;
 const worlds=[['classic',null],...[1,2,3,4].map(k=>['Normal s'+k,{preset:'normal',seed:'s'+k}])],all={tb:[],ta:[],rat:[],ms:[],n:0};
 try{for(const [name,set] of worlds){
  const m=set?t.genWorld(set).map:W0;if(t.WM!==m)t.useWorld(m);const MW=t.MW,MH=t.MH,N=MW*MH,L=t.landPieces(),R=t.seeded(name.length*977+13),cells=[];
  for(let i=0;i<N;i++)if(t.wayOpen(i)&&t.tiles[i]!==t.T_FORD)cells.push(i);
  // ---- random trips, plain, a road keeper's and a worker's
  const tb=[],ta=[],rat=[],bad=[];let tries=0,trips=0,cutA=0,cutB=0,s0=t.Router.stats();
  while(trips<40&&tries<4000){tries++;const s=cells[Math.floor(R()*cells.length)],g=cells[Math.floor(R()*cells.length)],sx=s%MW,gx=g%MW,dd=Math.max(Math.abs(sx-gx),Math.abs((s-sx)/MW-(g-gx)/MW));
   if(L[s]!==L[g]||dd<10||dd>120)continue;const [x0,y0]=t.wayCentre(s),[x1,y1]=t.wayCentre(g),q=R(),road=q<.6?undefined:q<.8?true:t.WAY.folk,goal={x:x1,y:y1,road},rm=t.wayKeep(goal);
   const B=walk(x0,y0,goal,false),A=walk(x0,y0,goal,true);if(!B.there)continue;trips++;
   if(!A.there){bad.push(name+' '+s+'>'+g+' not reached');continue}
   const cb=cost(B.pts,rm),ca=cost(A.pts,rm);rat.push(ca/cb);tb.push(turns(B.pts));ta.push(turns(A.pts));cutB+=cuts(B.pts);const c=cuts(A.pts);cutA+=c;if(c)bad.push(name+' '+s+'>'+g+' '+c+' points by a closed tile')}
  const st=t.Router.stats(),ms=(st.smoothMs-s0.smoothMs)/Math.max(1,st.smooths-s0.smooths),sum=a=>a.reduce((x,y)=>x+y,0);all.tb.push(...tb);all.ta.push(...ta);all.rat.push(...rat);all.ms.push(ms);all.n+=st.smooths-s0.smooths;
  ok(trips>=30&&!bad.length&&pct(rat,1)<=1+S.tol+.01,name+': '+trips+' random trips (10-120 tiles; plain, a caravan\'s and a worker\'s road keeping) all walked there straightened, at most '+((pct(rat,1)-1)*100).toFixed(1)+'% dearer than tile to tile (the tolerance '+(S.tol*100)+'%; mean '+((sum(rat)/rat.length-1)*100).toFixed(1)+'%), never within 1 px of a closed tile (tile to tile: '+cutB+' points)'+(bad.length?': '+bad.slice(0,4).join('; '):''));
  ok(sum(ta)<=sum(tb)*.4,name+': far fewer turns: '+sum(tb)+' tile to tile, '+sum(ta)+' straightened ('+(sum(tb)/trips).toFixed(1)+' and '+(sum(ta)/trips).toFixed(1)+' a trip)');
  // ---- pushed off the way half-way (a fight, a shove: 2-3 tiles aside onto open ground), a walker still gets there, never on a
  // closed tile (it finds its way again from there when the line to its next tile is not clear)
  {let n=0,got=0,base=0,bad=0;for(let tries=0;n<12&&tries<3000;tries++){const s=cells[Math.floor(R()*cells.length)],g=cells[Math.floor(R()*cells.length)],sx=s%MW,gx=g%MW,dd=Math.max(Math.abs(sx-gx),Math.abs((s-sx)/MW-(g-gx)/MW));
    if(L[s]!==L[g]||dd<30||dd>90)continue;const [x0,y0]=t.wayCentre(s),[x1,y1]=t.wayCentre(g),goal={x:x1,y:y1},push=(w,k)=>{for(let a=0;a<16;a++){const r=TL*(2+R()),q=R()*6.283,x=w.x+Math.cos(q)*r,y=w.y+Math.sin(q)*r;if(t.passable(t.terrAt(x,y))&&L[Math.floor(y/TL)*MW+Math.floor(x/TL)]===L[g]){w.x=x;w.y=y;return true}}return false};
    const run=on=>{S.on=on;const w={x:x0,y:y0};let i=0,pushed=false,off=0;for(;i<30000&&Math.hypot(w.x-x1,w.y-y1)>3;i++){if(i===150&&!pushed)pushed=push(w);const px=w.x,py=w.y;if(!t.Router.travel(w,goal,2)||px===w.x&&py===w.y&&++off>40)break;const r=t.ROUTES.get(w);if(!t.passable(t.terrAt(w.x,w.y))&&!(r&&r.path&&r.path.ferry!=null))bad++}return Math.hypot(w.x-x1,w.y-y1)<=3};
    const st=Math.random;Math.random=t.seeded(n+1);const b0=run(false);Math.random=t.seeded(n+1);const a0=run(true);Math.random=st;n++;if(b0)base++;if(a0)got++}
   ok(n>=8&&got>=base&&!bad,name+': pushed off the way half-way, '+got+' of '+n+' walkers still get there straightened ('+base+' tile to tile), none on a closed tile')}
  // ---- a diagonal over open ground: one straight line
  {let spot=null;const k0=t.wayCostAt(cells[0],1);
   for(let ty=4;ty<MH-20&&!spot;ty+=3)for(let tx=4;tx<MW-28&&!spot;tx+=3){let even=true;const c=t.tiles[ty*MW+tx]===t.T_OPEN?t.wayCostAt(ty*MW+tx,1):-1;if(c<0)continue;
    for(let j=-2;j<=14&&even;j++)for(let i=-2;i<=24&&even;i++){const k=(ty+j)*MW+tx+i;if(t.tiles[k]!==t.T_OPEN||t.wayCostAt(k,1)!==c||!t.wayOpen(k))even=false}if(even)spot=[tx,ty]}
   if(!spot)info(name+': no open ground 27 x 17 tiles to try a diagonal on');
   else{const [x0,y0]=t.wayCentre(spot[1]*MW+spot[0]),[x1,y1]=t.wayCentre((spot[1]+11)*MW+spot[0]+20),p=t.findPath(x0,y0,x1,y1,0,1),q=t.waySmooth(x0,y0,p,1),pts=[[x0,y0],...p.map(k=>t.wayCentre(k))];
    ok(p.length>=20&&turns(pts)>0&&q.length===1&&q[0]===p[p.length-1],name+': a diagonal over open ground (20 x 11 tiles) is one straight line: '+p.length+' tiles with '+turns(pts)+' turns, straightened to '+q.length+' (k '+k0.toFixed(2)+')')}}
  // ---- lords to a holding's gate, caravans on the roads: there as before, the caravans no more off the road
  {const H=t.TOWNS.filter(h=>h.ty>3&&h.ty<MH-4),lb=[],cv=[];let worse=0,roadB=0,roadA=0,miss=[];
   for(let k=0;k<12&&H.length>1;k++){const a=H[Math.floor(R()*H.length)],b=H[Math.floor(R()*H.length)];if(a===b||!t.Router.reach(a,b))continue;const s=t.gateSpot(a);
    for(const road of [false,true]){const goal=road?{...t.gateGoal(b),road:true}:t.gateGoal(b),B=walk(s.x,s.y,goal,false,60000),A=walk(s.x,s.y,goal,true,60000);
     if(B.there&&!A.there)miss.push(a.name+'>'+b.name+(road?' (caravan)':''));if(A.steps>B.steps*1.02+4)worse++;(road?cv:lb).push(A.steps/B.steps);if(road){roadB+=offRoad(B.pts);roadA+=offRoad(A.pts)}}}
   const n=cv.length;ok(!miss.length&&!worse&&roadA<=roadB*1.02+4,name+': lords to a holding\'s gate ('+lb.length+') and caravans by the roads ('+n+') get there as before, steps x '+(lb.reduce((a,b)=>a+b,0)/Math.max(1,lb.length)).toFixed(3)+' and x '+(cv.reduce((a,b)=>a+b,0)/Math.max(1,n)).toFixed(3)+' on average; the caravans '+roadB+' steps off the road (its tiles and its band) tile to tile, '+roadA+' straightened'+(miss.length?'; not there: '+miss.join(', '):''))}
  info(name+': '+(st.smooths-s0.smooths)+' straightenings, '+ms.toFixed(3)+' ms each on average')}
  // ---- the cost of one: the longest run (WAY_SMOOTH.run tiles), a staircase over open ground
  {S.on=true;const p=[];let x=40,y=40;for(let i=0;i<S.run;i++){if(i%3)x++;else{x++;y++}p.push(y*t.MW+x)}const T0=performance.now();for(let k=0;k<50;k++)t.waySmooth(40.5*TL,40.5*TL,p,1);
   info('a run of '+S.run+' tiles straightened in '+((performance.now()-T0)/50).toFixed(3)+' ms (once a leg, never a frame)')}
  const sum=a=>a.reduce((x,y)=>x+y,0);
  info('all worlds: '+all.tb.length+' trips, turns '+sum(all.tb)+' tile to tile, '+sum(all.ta)+' straightened; cost ratio mean '+(sum(all.rat)/all.rat.length).toFixed(4)+', 90% within '+pct(all.rat,.9).toFixed(4)+', at most '+pct(all.rat,1).toFixed(4)+', at least '+pct(all.rat,0).toFixed(4)+'; '+all.n+' straightenings, '+(sum(all.ms)/all.ms.length).toFixed(3)+' ms each on average')
 }finally{S.on=true;if(t.WM!==W0)t.useWorld(W0)}
});
