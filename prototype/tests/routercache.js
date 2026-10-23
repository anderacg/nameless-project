'use strict';
// Huge's 768 chunks exceed the old 512-table LRU: a sweep must keep every table, then reuse it without rebuilding. Check
// route costs and nodes, closure invalidation, a new world and a rechart; timings and retained bytes are INFO, not deadlines.
Kit.suite(({ok,info})=>{
 const t=T,W0=t.WM,m=t.genWorld({preset:'huge',seed:'s1'}).map;
 try{
  t.useWorld(m);const G=m.graph,n=G.coff.length-1,first=Array.from({length:n},(_,c)=>c).find(c=>G.coff[c+1]>G.coff[c]);
  ok(!G.chunk.size,'a new Huge graph builds no chunk tables until asked');
  ok(n>512,'Huge has '+n+' chunks, beyond the former 512-table limit');
  const one=t.wayChunk(G,first);
  ok(G.chunk.size===1&&t.wayChunk(G,first)===one,'one requested chunk is built lazily and reused');
  const refs=new Map(),cold=performance.now();
  for(let c=0;c<n;c++)refs.set(c,t.wayChunk(G,c));
  const coldMs=performance.now()-cold;
  ok(G.chunk.size===n,'a full sweep retains all '+n+' tables ('+G.chunk.size+' kept)');
  let rebuilt=0;const warm=performance.now();
  for(let c=0;c<n;c++)if(t.wayChunk(G,c)!==refs.get(c))rebuilt++;
  ok(!rebuilt&&G.chunk.size===n,'a second full sweep reuses every table ('+rebuilt+' rebuilt)');
  info('Huge s1: all chunk tables '+(Array.from(refs.values()).reduce((s,q)=>s+q.d.byteLength,0)/1048576).toFixed(3)+' MiB of cost arrays; cold sweep '+coldMs.toFixed(1)+' ms, warm sweep '+(performance.now()-warm).toFixed(2)+' ms; node IDs are views of the graph');
  // Distinct long trips and cost preferences bypass the pair cache, so cached pairs cannot conceal table churn.
  const gates=Array.from(G.tile).filter((_,v)=>G.nk[v]===0),R=t.seeded(7),L=t.landPieces(),trips=[],rm=[1,t.WAY.keep,t.WAY.folk];
  for(let k=0;k<12;k++){
   const a=gates[k%gates.length],bs=gates.filter(b=>b!==a&&L[b]===L[a]&&Math.max(Math.abs(a%t.MW-b%t.MW),Math.abs((a/t.MW|0)-(b/t.MW|0)))>t.WAY.near),b=bs[Math.floor(R()*bs.length)];
   t.PAIRS.clear();const s=performance.now(),r=t.wayRoute(G,a,b,null,rm[k%rm.length]);
   trips.push({a,b,rm:rm[k%rm.length],r,ms:performance.now()-s});
  }
  ok(trips.every(q=>q.r&&Number.isFinite(q.r.cost)),'twelve long Huge trips work with normal, caravan and worker costs');
  for(let c=0;c<n;c++)t.wayChunk(G,c);
  let same=true;for(const q of trips){t.PAIRS.clear();const r=t.wayRoute(G,q.a,q.b,null,q.rm);if(!r||r.cost!==q.r.cost||r.nodes.join()!==q.r.nodes.join()||r.via.join()!==q.r.via.join())same=false}
  ok(same,'the same long trips keep their exact costs, nodes and edges after other chunks are used');
  ok(Array.from(refs).every(([c,q])=>G.chunk.get(c)===q),'long graph searches do not replace warmed chunk tables');
  const ms=trips.map(q=>q.ms).sort((a,b)=>a-b);info('Huge s1: twelve warm graph searches (pair cache cleared each time), median '+ms[ms.length>>1].toFixed(2)+' ms, slowest '+ms[ms.length-1].toFixed(2)+' ms');
  // Only chunks touched by a closed crossing should be rebuilt; opening it must recover the original tables' costs.
  const xi=m.crossings.findIndex(c=>c.tiles.length),xing=m.crossings[xi],affected=[...new Set(xing.tiles.map(i=>t.wayChunkOf(G,i)))],before=affected.map(c=>t.wayChunk(G,c)),other=Array.from({length:n},(_,c)=>c).find(c=>!affected.includes(c)),untouched=t.wayChunk(G,other),v=t.WAYV;
  t.Router.close(xi,true);
  ok(affected.every(c=>!G.chunk.has(c))&&G.chunk.get(other)===untouched&&!t.PAIRS.size&&t.WAYV>v,'closing a crossing invalidates its chunk tables, pairs and walker version, retaining other tables');
  const closed=affected.map(c=>t.wayChunk(G,c));
  ok(closed.every((q,k)=>q!==before[k])&&xing.tiles.every(i=>t.SHUT[i]),'closed-crossing tables are rebuilt with its tiles shut');
  t.Router.close(xi,false);
  ok(affected.every((c,k)=>{const q=t.wayChunk(G,c);return q!==closed[k]&&q.d.every((d,j)=>d===before[k].d[j])}),'reopening the crossing rebuilds exactly its original costs');
  t.useWorld(m);
  ok(!G.chunk.size&&!t.PAIRS.size,'putting a world in again clears its chunk and pair caches');
  const old=t.wayChunk(G,first);t.wayRechart();
  ok(m.graph!==G&&!m.graph.chunk.size&&t.wayChunk(m.graph,t.wayChunkOf(m.graph,m.graph.tile[0]))!==old,'recharting roads starts a new graph with fresh chunk tables');
 }finally{t.useWorld(W0)}
});
