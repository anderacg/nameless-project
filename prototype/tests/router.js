'use strict';
// The router (doc/WORLD_DESIGN.md §3.6, §15.2.1; world/router.js): on today's map (WM.graph null) the three calls answer as Phase 0's
// wrapper did (a holding's field, the box search, the land's pieces); on the generated world the way graph (buildWayGraph: its
// shape, every holding a node, connected like the land, the generator's rules in its text) and the two-level router: 200 random
// trips at Normal (the classic seed) and at Large within 5% of a full A* over the tiles, their tiles walkable and joined; the pair
// cache; Router.close shuts a crossing (ways round it) and opens it again; a walker gets from one gate to another; Router.days;
// ships on the generated world only on water boats can sail (no river that is not navigable). The generated worlds are put in for
// the checks (useWorld) and today's put back after, so the suite runs with the flag off and with -Gen.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,TILE=t.TILE;let W0=null;
try{
 W0=t.WM;const pct=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.min(s.length-1,Math.floor(s.length*p))]};
 ok(t.WAY.pace===t.MAP_BASE,'the graph\'s days are at MAP_BASE\'s pace (WAY.pace '+t.WAY.pace+')');
 // ---- the generator's rules, by the text of buildWayGraph and what it calls
 {const src=[t.buildWayGraph,t.wayStep,t.wayDay].map(f=>f.toString()).join('\n'),bad=['Math.random','hypot','Math.sin','Math.cos','Math.exp','Math.pow','Math.log','atan2','rnd(','rint(','pick('].filter(w=>src.includes(w));
  ok(!bad.length,'buildWayGraph keeps the generator\'s rules: no Math.random, hypot, sin, cos, exp, pow, log or atan2'+(bad.length?': '+bad.join(', '):''))}
 // ---- today's map: Phase 0's wrapper
 if(!t.WORLD.gen){const s0=t.Router.stats(),A=t.TOWNS[0],B=t.TOWNS[5],a={x:A.x+40,y:A.y+30},b={x:a.x,y:a.y},g=t.gateGoal(B);
  ok(t.WM.graph===null,'today\'s map has no way graph');
  let same=true;for(let i=0;i<300;i++){t.Router.travel(a,g,2);t.travelTo(b,B,g.x,g.y,2);if(a.x!==b.x||a.y!==b.y){same=false;break}}
  const p={x:A.x,y:A.y+12},q={x:p.x,y:p.y},pt={x:A.x+120,y:A.y-80};let same2=true;for(let i=0;i<300;i++){const r1=t.Router.travel(p,pt,1.5),r2=t.routeTo(q,pt.x,pt.y,1.5);if(r1!==r2||p.x!==q.x||p.y!==q.y){same2=false;break}}
  const d=t.Router.days(B,A),f=t.flowTo(A)[B.ty*t.MW+B.tx]*TILE/t.moveStep(t.MAP_BASE,t.DAY_SECONDS*t.WORLD_PACE);
  ok(same&&same2&&d===f&&JSON.stringify(t.Router.stats())===JSON.stringify(s0),'Router.travel walks to a holding by its field and to a point by the box search, Router.days reads the field, step for step as before; the graph is never asked ('+d.toFixed(2)+' days)')}
 // ---- the generated worlds: the classic seed (Normal) and a Large one
 const worlds=[['Normal (classic seed)',t.WORLD.gen?t.WM:t.genWorld(t.classicSettings()).map],['Large',t.genWorld({preset:'large',seed:'1'}).map]];
 for(const [name,m] of worlds){if(t.WM!==m)t.useWorld(m);const G=m.graph,MW=t.MW,MH=t.MH,N=MW*MH;
  // the shape
  {let bad=[];const n=G.n,M=G.to.length;if(G.off.length!==n+1||G.off[0]!==0||G.off[n]!==M)bad.push('off');for(let v=0;v<n;v++)if(G.off[v+1]<G.off[v])bad.push('off order');
   for(let e=0;e<M;e++){if(G.to[e]<0||G.to[e]>=n||G.ek[e]>5||!(G.cost[e]>0))bad.push('edge '+e);if(G.ek[e]===2!==(G.xing[e]>=0))bad.push('xing '+e);if(G.ek[e]<2!==(G.leg[e*3]>=0))bad.push('leg '+e)}
   const nodes=new Map(Array.from(G.tile,(x,v)=>[x,v])),gates=m.roads.flatMap(r=>[r.path[0],r.path[r.path.length-1]]),ends=m.crossings.flatMap(c=>[c.i,c.j]);
   if(G.nk.some(k=>k>5))bad.push('nk');if(gates.some(x=>!nodes.has(x)))bad.push('a holding not a node');if(ends.some(x=>!nodes.has(x)))bad.push('a crossing\'s end not a node');
   const inCh=new Set(G.cnode);if(inCh.size!==n||G.coff[G.coff.length-1]!==n)bad.push('chunks');
   const kinds=[0,0,0,0,0,0],ek=[0,0,0,0,0,0];for(const k of G.nk)kinds[k]++;for(const k of G.ek)ek[k]++;bad=[...new Set(bad)];
   ok(!bad.length,name+': the graph\'s shape: '+n+' nodes ('+kinds.join('/')+' gates, junctions, crossing ends, landings, camps, portals), '+M+' edges ('+ek.join('/')+' road, track, crossing, river down, up, portal steps), every road\'s ends and crossing\'s ends nodes, every node in its chunk'+(bad.length?': '+bad.slice(0,5).join(', '):''))}
  // connected like the land: from the first holding's node, over every edge and chunk table, every node on its piece of land
  {const L=t.landPieces(),nodes=t.wayNodes(),s=nodes.get(m.roads[0].path[0]),seen=new Uint8Array(G.n),q=[s];seen[s]=1;const t0=performance.now();
   while(q.length){const u=q.pop();const go=v=>{if(!seen[v]){seen[v]=1;q.push(v)}};for(let e=G.off[u];e<G.off[u+1];e++)if(G.ek[e]<3||G.ek[e]===5)go(G.to[e]);
    const T=t.wayChunk(G,t.wayChunkOf(G,G.tile[u])),k=T.ids.length,a=T.ids.indexOf(u);for(let b=0;b<k;b++)if(T.d[a*k+b]<Infinity)go(T.ids[b])}
   const piece=L[G.tile[s]];let on=0,miss=0,gm=0;for(let v=0;v<G.n;v++)if(L[G.tile[v]]===piece){on++;if(!seen[v]){miss++;if(G.nk[v]===0)gm++}}
   ok(!gm&&miss<=on*.01,name+': connected like the land: from the first holding, '+(on-miss)+' of the '+on+' nodes on its land reached, every holding among them ('+miss+' portals cut off inside their chunks; every chunk\'s table '+(performance.now()-t0).toFixed(0)+' ms)')}
  // 200 random trips: the two levels against a full A* over the tiles
  {const R=t.seeded(name.length*31+7),L=t.landPieces(),cells=[];for(let i=0;i<N;i++)if(t.passable(t.tiles[i]))cells.push(i);
   const rat=[],gms=[],bad=[];let tries=0,ferries=0;t.WAYS.queries=0;
   while(rat.length<200&&tries<5000){tries++;const s=cells[Math.floor(R()*cells.length)],g=cells[Math.floor(R()*cells.length)],sx=s%MW,gx=g%MW;
    if(L[s]!==L[g]||Math.max(Math.abs(sx-gx),Math.abs((s-sx)/MW-(g-gx)/MW))<=t.WAY.near)continue;const [x0,y0]=t.wayCentre(s),[x1,y1]=t.wayCentre(g);
    const full=t.findPath(x0,y0,x1,y1,Math.max(MW,MH));if(!full)continue;
    // (the two levels' trip walked leg by leg: a walker put on each leg's last tile; its tiles in order, a ferry's crossing at its days)
    const w={x:x0,y:y0},P0=performance.now(),plan=t.wayTrip(w,{x:x1,y:y1});gms.push(performance.now()-P0);if(!plan.legs){bad.push('no way '+s+'>'+g);continue}
    // (the last stretch walked straight when nothing is in the way: its tiles as the box search finds them, to weigh it)
    const tl=[];let fd=0;for(const leg of plan.legs){let p=t.wayLeg(leg,w,{x:x1,y:y1});if(leg.k==='end'&&p&&!p.length)p=t.findPath(w.x,w.y,x1,y1)||[];if(!p){bad.push('a leg not found');break}
     if(p.ferry!=null){fd+=t.WAY.ferry;tl.push(-1);[w.x,w.y]=t.wayCentre(p.ferry);tl.push(p.ferry);ferries++;continue}for(const k of p)tl.push(k);if(p.length)[w.x,w.y]=t.wayCentre(p[p.length-1])}
    let a=s,joined=true;for(let k=0;k<tl.length;k++){const x=tl[k];if(x<0){k++;a=tl[k];continue}if(Math.max(Math.abs(a%MW-x%MW),Math.abs((a/MW|0)-(x/MW|0)))>1||!t.passable(t.tiles[x]))joined=false;a=x}
    if(!joined||a!==g&&Math.max(Math.abs(a%MW-gx),Math.abs((a/MW|0)-(g-gx)/MW))>1){bad.push('broken '+s+'>'+g);continue}
    rat.push((t.wayCost(s,tl.filter(x=>x>=0))+fd)/t.wayCost(s,full))}
   const mean=rat.reduce((a,b)=>a+b,0)/Math.max(1,rat.length),st=t.Router.stats();
   ok(rat.length>=150&&!bad.length&&mean<=1.05&&pct(rat,.9)<=1.1,name+': '+rat.length+' random trips (over '+t.WAY.near+' tiles) by the two levels, walked leg by leg, are whole (every tile walkable, each beside the last) and within 5% of a full A* over the tiles: '+((mean-1)*100).toFixed(1)+'% more on average, 90% within '+((pct(rat,.9)-1)*100).toFixed(1)+'%, at worst '+((Math.max(...rat)-1)*100).toFixed(1)+'%'+(bad.length?' — '+bad.slice(0,4).join(', '):''));
   info(name+': a trip planned in '+pct(gms,.5).toFixed(2)+' ms (median; 90% within '+pct(gms,.9).toFixed(2)+', slowest '+Math.max(...gms).toFixed(1)+', with every chunk\'s table made); ferries taken '+ferries+'; Router.stats '+JSON.stringify(st,(k,v)=>typeof v==='number'?Math.round(v*10)/10:v))}
  // the pair cache: a holding to a holding asked twice is answered from the cache, the same way
  {const nodes=t.wayNodes(),r0=m.roads.find(r=>r.path.length>60)||m.roads[0],a=r0.path[0],b=r0.path[r0.path.length-1],s0=t.Router.stats();
   const q=performance.now(),x=t.wayRoute(G,a,b,nodes.get(b)),q1=performance.now(),y=t.wayRoute(G,a,b,nodes.get(b)),q2=performance.now(),s1=t.Router.stats();
   ok(x&&y&&s1.hits===s0.hits+1&&s1.queries===s0.queries+2&&x.cost===y.cost&&x.nodes.join()===y.nodes.join(),name+': the pair cache answers a gate-to-gate trip asked again ('+(q1-q).toFixed(2)+' ms, then '+(q2-q1).toFixed(3)+' ms; '+(x?x.cost.toFixed(2):'-')+' days)')}
  // Router.close: a crossing on a way shut, the way goes round it (or there is none), then opened again
  {const nodes=t.wayNodes();let hit=null;
   for(const r of m.roads){const a=r.path[0],b=r.path[r.path.length-1],x=t.wayRoute(G,a,b,nodes.get(b));if(!x)continue;const e=x.via.find(e=>e>=0&&G.ek[e]===2);if(e!=null){hit={a,b,x,xi:G.xing[e]};break}}
   if(!hit)ok(true,name+': (no way crosses a river: Router.close not tried)');
   else{const {a,b,x,xi}=hit,c=m.crossings[xi],V=t.WAYV;t.Router.close(xi,true);const y=t.wayRoute(G,a,b,nodes.get(b)),w={x:t.wayCentre(a)[0],y:t.wayCentre(a)[1]},g={x:t.wayCentre(b)[0],y:t.wayCentre(b)[1]+10};
    const shutT=c.tiles.every(i=>t.SHUT[i]),avoid=!y||!y.via.some(e=>e>=0&&G.xing[e]===xi);let walk=0,on=0;for(;walk<12000&&Math.hypot(w.x-g.x,w.y-g.y)>3;walk++){if(!t.Router.travel(w,g,2))break;if(c.tiles.includes(Math.floor(w.y/TILE)*MW+Math.floor(w.x/TILE)))on++}
    t.Router.close(xi,false);const z=t.wayRoute(G,a,b,nodes.get(b));
    ok(shutT&&avoid&&!on&&t.WAYV>V&&G.closed[xi]===0&&z&&Math.abs(z.cost-x.cost)<1e-6,name+': Router.close shuts the '+c.kind+' on a way from '+a+' to '+b+' ('+x.cost.toFixed(2)+' days): the way goes round it ('+(y?y.cost.toFixed(2)+' days':'none left')+'), a walker never sets foot on it ('+walk+' steps), and opened again the way is as before')}}
  // a walker from one holding's gate to another's
  {const r0=m.roads.find(r=>r.path.length>80)||m.roads[0],a=r0.path[0],b=r0.path[r0.path.length-1],[x0,y0]=t.wayCentre(a),[x1,y1]=t.wayCentre(b),w={x:x0,y:y0+12},g={x:x1,y:y1+12};let i=0,moved=true;
   for(;i<40000&&Math.hypot(w.x-g.x,w.y-g.y)>3&&moved;i++)moved=t.Router.travel(w,g,2);ok(Math.hypot(w.x-g.x,w.y-g.y)<=3,name+': a walker gets from one holding\'s gate to another\'s by Router.travel ('+i+' steps of 2 px, '+r0.path.length+' road tiles)')}
  // Router.days
  {const r0=m.roads[0],[x0,y0]=t.wayCentre(r0.path[0]),[x1,y1]=t.wayCentre(r0.path[r0.path.length-1]),d=t.Router.days({x:x0,y:y0},{x:x1,y:y1}),d2=t.Router.days({x:x0,y:y0},{x:x1,y:y1},t.MAP_BASE*2);
   let sea=-1;for(let i=0;i<N&&sea<0;i++)if(t.tiles[i]===t.T_WATER&&!(m.river[i]&3))sea=i;const [sx,sy]=t.wayCentre(sea);
   ok(d>0&&d<Infinity&&Math.abs(d2-d/2)<1e-9&&t.Router.days({x:x0,y:y0},{x:sx,y:sy})===Infinity,name+': Router.days from the graph: '+d.toFixed(2)+' days along a road at MAP_BASE, half at twice the pace, none to the sea')}
  // ships: only on open water and navigable rivers (under their bridges, over their fords): a river not navigable is no water to
  // boats, so it joins no sea or lake for them
  {let bad=0,nav=0,cut=0;for(let i=0;i<N;i++){const r=m.river[i];if(!(r&3)||t.climate[i]===t.CLIM.frost)continue;const x=i%MW,y=(i-x)/MW,sail=t.isWater(x,y);
    if(t.tiles[i]===t.T_WATER&&r&4){nav++;if(!sail)bad++}else if(!(r&4)){cut++;if(sail)bad++}}
   ok(!bad&&nav,name+': boats sail every navigable river tile ('+nav+') and none of the '+cut+' that are not'+(bad?' ('+bad+' wrong)':''))}
 }
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{try{if(W0&&T.WM!==W0)T.useWorld(W0)}catch(e){o.push('EXC putting today\'s world back: '+e.message)}}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
