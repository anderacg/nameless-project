'use strict';
/* ---------- the world generator (doc/WORLD_DESIGN.md §8, §15.2.1): a world from its clamped settings (worldsettings.js), in ten
   stages (GEN_STAGES), each a function* over the stage context g that yields its share done (0-1):
     genWorldSteps(settings): the stages as steps for runSteps (loading.js), behind "Forging the world…"; the last one's value is
       the result
     genWorld(settings): the same steps run at once (the tests, the wiki, LOADING.sync): the result,
       {map, holdings, camps, lords, hamlets, sacred, lair, regions, rivers, crossings, graph, tries, relaxed}
       holdings: places.js's schema (CLASSIC_PLACES) plus their tiles; installWorld (worldmap.js) puts it in
   The stage context g: s (the clamped settings), map (a WorldMap), rng(stage, attempt) (genRng: the stage's own stream), work
   (working fields, dropped at the end), hints (CLASSIC_HINTS when classic), attempt, tick() (true once about 10 ms of work have
   passed since the last yield: when a stage yields, never what it makes), and what the stages hand on (holdings, camps, lords,
   tries, relaxed). A stage's check (§8.14), when it has one, runs it again with attempt + 1, up to 8 times, then its relax (if
   any: a name for relaxed, and 8 tries more), else keeps the last; each stage's runs are counted in tries.
   Rules (§8.1): seeded streams only, never Math.random, rnd, rint or pick; integer hashing, + - × ÷ and Math.sqrt only (never
   Math.hypot, sin, cos, exp, pow, log or atan2), so the same settings make the same world in every browser (tests/structure.js
   reads this file's text). Stages 1-6 here (terrain), 7-9 in worldplace.js (placement), 10 the way graph (router.js
   buildWayGraph) and WM.sum. Phase 2 wave 0's stubs: crude, but a valid world (warped land, plain fbm elevation, climate by
   latitude, a few steepest-descent rivers); wave 1 (A) makes stages 1-6 real ---------- */
// (an integer hash of two 32-bit numbers: the stages' streams)
function genHash(a,b){let h=Math.imul((a>>>0)^0x9e3779b9,0x85ebca6b)^(b>>>0);h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);return(h^h>>>16)>>>0}
// each stage's stream: its own, isolated (a stage's retry, attempt + 1, draws another)
const STAGE_SALT={land:1,elev:2,climate:3,rivers:4,forest:5,regions:6,holdings:7,roads:8,sites:9,graph:10};
const genRng=(n,stage,attempt)=>seeded(genHash(n,STAGE_SALT[stage]*64+(attempt|0)));
// (a noise salt drawn from a stream: map.js noise and fbm take it)
const genSalt=R=>Math.floor(R()*0x3fffffff);
// the 8 ways (high's and flow's directions: 0 E, 1 SE, 2 S, 3 SW, 4 W, 5 NW, 6 N, 7 NE, terrain.js TDX's order)
const DIR8=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
/* D41's high ground from the world (stage 2): of the hill tiles, rises in the lowlands, steep hills in the highlands, cliffed
   hills on the escarpment candidates. steep: a hill this high (elev) or this rough (rough) is steep; cliff: this rough, an
   escarpment candidate (cliffed); scree: a steep hill this high has scree. Targets for the owner's review: rises 50-70%, steep
   25-40%, cliffed 5-12% of hill tiles (wave 1 tunes them) */
const GEN_HIGH={steep:{elev:192,rough:36},cliff:{rough:44},scree:{elev:200}};
// the stages, in order (§15.2.1): id, the loading label (§5.2), w (its weight on the bar), run, and its check (§8.14), if any
const GEN_STAGES=[
  {id:'land',label:'Raising the land',w:80,run:g=>genLand(g),check:g=>{const n=g.work.land/(g.map.w*g.map.h);return n<.6||n>.8?'land '+(n*100).toFixed(0)+'%':null}},
  {id:'elev',label:'Mountains',w:200,run:g=>genElev(g)},
  {id:'climate',label:'Climates',w:150,run:g=>genClimate(g),check:g=>{const m=g.map,n=[0,0,0,0];let L=0;for(let i=0;i<m.kind.length;i++)if(m.kind[i]!==T_WATER){n[m.clim[i]]++;L++}
    const low=n.findIndex(c=>c<L*.06);return low>=0?CLIMS[low]+' '+(n[low]*100/L).toFixed(1)+'%':null}},
  {id:'rivers',label:'Carving rivers',w:250,run:g=>genRivers(g)},
  {id:'forest',label:'Forests',w:80,run:g=>genForest(g)},
  {id:'regions',label:'Wild lands',w:1,run:g=>genRegions(g)},
  {id:'holdings',label:'Founding holdings',w:250,run:g=>genHoldings(g)},
  {id:'roads',label:'Laying roads',w:500,run:g=>genRoads(g)},
  {id:'sites',label:'Placing camps',w:50,run:g=>genCamps(g)},
  {id:'graph',label:'Charting the ways',w:150,run:g=>genGraph(g)}
];
function genWorldSteps(settings){
  const s=normSettings(settings),n=seedNum(s.seed),m=new WorldMap(s.w,s.h,s.seed);
  m.gen='ashmark-1';m.seedNum=n;m.settings=s;m.classic=s.preset==='classic';m.salt=m.classic?0:n;
  let t0=performance.now();
  const g={s,map:m,rng:(stage,attempt)=>genRng(n,stage,attempt),work:{},hints:m.classic?CLASSIC_HINTS:null,attempt:0,
    holdings:[],camps:[],lords:null,tries:{},relaxed:[],tick(){const t=performance.now();if(t-t0<10)return false;t0=t;return true}};
  return GEN_STAGES.map(st=>({id:st.id,label:st.label,w:st.w,run:function*(){return yield* genStage(g,st)}}));
}
function genWorld(settings){let v;for(const st of genWorldSteps(settings)){const it=st.run();let r;while(!(r=it.next()).done);v=r.value}return v}
// one stage, its retries and relaxations (kind and feat, which several stages write, put back before each retry; a stage writes
// its own layers whole); what it yields never goes back
function* genStage(g,st){
  const m=g.map,keep=st.check&&{kind:m.kind.slice(),feat:m.feat.slice()};let top=0,v,k=0,bad;
  for(let n=0;;n++){
    g.attempt=n;if(n){m.kind.set(keep.kind);m.feat.set(keep.feat)}
    const it=st.run(g);for(let r=it.next();;r=it.next()){if(r.done){v=r.value;break}yield top=Math.max(top,typeof r.value==='number'?r.value:0)}
    g.tries[st.id]=n+1;bad=st.check?st.check(g):null;if(!bad)return v;
    if(++k<8)continue;
    const why=st.relax?st.relax(g):null;if(why){g.relaxed.push(why);k=0;continue}
    g.relaxed.push(st.id+': '+bad+', kept after 8 tries');return v}
}
// (tiles by their distance from water, 4 ways, into D (Uint16Array): 0 on water, 1 on the shore...)
function* genDist(g,D){
  const m=g.map,W=m.w,H=m.h,K=m.kind,q=new Int32Array(W*H);let a=0,b=0;D.fill(65535);
  for(let i=0;i<W*H;i++)if(K[i]===T_WATER){D[i]=0;q[b++]=i}
  while(a<b){const i=q[a++],x=i%W,y=(i-x)/W,d=D[i]+1;
    if(x>0&&D[i-1]>d){D[i-1]=d;q[b++]=i-1}if(x<W-1&&D[i+1]>d){D[i+1]=d;q[b++]=i+1}
    if(y>0&&D[i-W]>d){D[i-W]=d;q[b++]=i-W}if(y<H-1&&D[i+W]>d){D[i+W]=d;q[b++]=i+W}
    if((a&4095)===0&&g.tick())yield a/(W*H)}
}
// (each piece of tiles where is(i) holds, 4 ways: its label in L (Int32Array, -1 elsewhere); returns the pieces' sizes)
function* genPieces(g,L,is){
  const m=g.map,W=m.w,H=m.h,q=new Int32Array(W*H),size=[];L.fill(-1);
  for(let s=0;s<W*H;s++){if(L[s]>=0||!is(s))continue;const id=size.length;let a=0,b=0;L[s]=id;q[b++]=s;
    while(a<b){const i=q[a++],x=i%W,y=(i-x)/W;
      for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,y>0?i-W:-1,y<H-1?i+W:-1])if(j>=0&&L[j]<0&&is(j)){L[j]=id;q[b++]=j}}
    size.push(b);if(g.tick())yield s/(W*H)}
  return size;
}

/* 1. land: warped noise over a falloff to the sides (the stub: wave 1 makes continents, inland seas and lakes by the land setting);
   land under 40 tiles sunk; feat lake (water cut off from the sea) and coast (land on the sea) */
function* genLand(g){
  const m=g.map,W=m.w,H=m.h,K=m.kind,F=m.feat,R=g.rng('land',g.attempt),sa=genSalt(R),sb=genSalt(R),sc=genSalt(R),S=W/5;
  const lv={continent:.32,coasts:.37,sea:.44,lakes:.37}[g.s.land];
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const wx=x+(fbm(x/S,y/S,sa)-.5)*S*.9,wy=y+(fbm(x/S,y/S,sb)-.5)*S*.9,ex=2*wx/W-1,ey=2*wy/H-1,e=ex*ex*ex*ex+ey*ey*ey*ey;
      const v=fbm(x*2/S,y*2/S,sc)*.7+.45-e*.8;
      K[y*W+x]=x<1||y<1||x>=W-1||y>=H-1||v<lv?T_WATER:T_OPEN}
    if(g.tick())yield y/H*.5}
  const L=new Int32Array(W*H),size=yield* genPieces(g,L,i=>K[i]!==T_WATER);
  let land=0;for(let i=0;i<W*H;i++)if(L[i]>=0){if(size[L[i]]<40)K[i]=T_WATER;else land++}
  g.work.land=land;yield .75;
  // the sea: water joined to the map's rim; the rest lakes
  const wet=yield* genPieces(g,L,i=>K[i]===T_WATER);F.fill(0);
  for(let i=0;i<W*H;i++){if(K[i]===T_WATER){if(L[i]!==L[0])F[i]|=2;continue}
    const x=i%W;for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(j>=0&&j<W*H&&K[j]===T_WATER&&L[j]===L[0]){F[i]|=4;break}}
  g.work.seas=wet.length;
}
/* 2. elevation: plain fbm rising away from the sea (the stub), so many mountains and hills by the mountains
   setting; rough (the largest step to the 8 neighbours x4, smoothed once), D41's high ground (GEN_HIGH) and the escarpment
   candidates (cliffs) */
function* genElev(g){
  const m=g.map,W=m.w,H=m.h,K=m.kind,E=m.elev,R=g.rng('elev',g.attempt),sa=genSalt(R),sb=genSalt(R),S=W/7,mul={flat:.6,normal:1,rugged:1.5}[g.s.mountains];
  const D=g.work.dist=new Uint16Array(W*H);yield* genDist(g,D);
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){const i=y*W+x;if(K[i]===T_WATER){E[i]=m.feat[i]&2?60:40;continue}
      const d=D[i],near=d<8?d/8:1;
      E[i]=Math.min(255,66+Math.floor(Math.min(d,12)*3+Math.max(0,fbm(x/S,y/S,sa)-.45)*400*mul*near+fbm(x*4/S,y*4/S,sb)*16));
      K[i]=E[i]>=212?T_MOUNT:E[i]>=168?T_HILL:T_OPEN}
    if(g.tick())yield .2+y/H*.4}
  const U=m.rough,T=new Uint8Array(W*H),at=(x,y)=>E[Math.max(0,Math.min(H-1,y))*W+Math.max(0,Math.min(W-1,x))];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const e=E[y*W+x];let s=0;for(const [a,b] of DIR8){const v=Math.abs(at(x+a,y+b)-e);if(v>s)s=v}T[y*W+x]=Math.min(255,s*4)}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;U[i]=(T[i]*4+T[y*W+Math.max(0,x-1)]+T[y*W+Math.min(W-1,x+1)]+T[Math.max(0,y-1)*W+x]+T[Math.min(H-1,y+1)*W+x])>>3}
  yield .8;
  // high ground: on each hill tile its kind, the way it rises (to its highest neighbour), scree, and mixed (a steep hill beside a rise)
  const Hi=m.high;Hi.fill(0);m.cliffs=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(K[i]!==T_HILL)continue;
    let up=0,top=-1;DIR8.forEach(([a,b],k)=>{const v=at(x+a,y+b);if(v>top){top=v;up=k}});
    const kind=U[i]>=GEN_HIGH.cliff.rough?3:E[i]>=GEN_HIGH.steep.elev||U[i]>=GEN_HIGH.steep.rough?2:1;
    Hi[i]=kind|up<<2|(kind===2&&E[i]>=GEN_HIGH.scree.elev?32:0);if(kind===3)m.cliffs.push({a:i,b:i,side:up})}
  for(let i=0;i<W*H;i++)if((Hi[i]&3)===2){const x=i%W;for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(j>=0&&j<W*H&&(Hi[j]&3)===1){Hi[i]|=64;break}}
}
/* 3. climate: temperature by latitude (cold north, hot south) less with height, moisture drier to the east (the stub); the
   climate of each tile from them (frost, desert, swamp, else grass), water too. Its check: each climate 6% of the land at least */
function* genClimate(g){
  const m=g.map,W=m.w,H=m.h,E=m.elev,R=g.rng('climate',g.attempt),sa=genSalt(R),sb=genSalt(R),S=W/6;
  const dt={cold:-20,temperate:0,warm:20}[g.s.climate],dm={dry:-20,normal:0,wet:20}[g.s.rivers];
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){const i=y*W+x,e=Math.max(0,E[i]-64);
      const t=Math.max(0,Math.min(255,Math.floor(y*255/(H-1)+(fbm(x/S,y/S,sa)-.5)*110-e*.3+dt))),w=Math.max(0,Math.min(255,Math.floor(fbm(x/S,y/S,sb)*320-x*60/W-20+dm)));
      m.temp[i]=t;m.moist[i]=w;m.clim[i]=t<52?CLIM.frost:t>165&&w<130?CLIM.desert:w>140&&e<60&&t>80?CLIM.swamp:CLIM.grass}
    if(g.tick())yield y/H}
}
/* 4. rivers: every land tile drains to the neighbour nearest the water (the lowest of them), flow summed down; a basin to each
   outlet; the stub's rivers (1, 2 or 3 by the rivers setting) the main stems of the largest basins, from where the flow is a few
   percent of the outlet's down to the sea: water, never uphill (the bed cut down), width by flow, navigable from width 2, a
   floodplain beside them */
function* genRivers(g){
  const m=g.map,W=m.w,H=m.h,N=W*H,K=m.kind,E=m.elev,D=g.work.dist,R=g.rng('rivers',g.attempt),down=new Int32Array(N).fill(-1),F=new Uint32Array(N);
  let top=0;for(let i=0;i<N;i++)if(K[i]!==T_WATER&&D[i]>top)top=D[i];
  // down: the neighbour nearer the water, the lowest of them; by distance, so the flow is summed from the farthest
  const by=Array.from({length:top+1},()=>[]);
  for(let i=0;i<N;i++){if(K[i]===T_WATER)continue;const x=i%W,y=(i-x)/W;let best=-1,bk=0;
    DIR8.forEach(([a,b],k)=>{const nx=x+a,ny=y+b;if(nx<0||ny<0||nx>=W||ny>=H)return;const j=ny*W+nx;if(D[j]<D[i]&&(best<0||D[j]<D[best]||D[j]===D[best]&&E[j]<E[best])){best=j;bk=k}});
    down[i]=best;m.flow[i]=bk<<5;F[i]=1;by[D[i]].push(i)}
  yield .3;
  for(let d=top;d>=1;d--)for(const i of by[d])if(down[i]>=0&&K[down[i]]!==T_WATER)F[down[i]]+=F[i];
  for(let i=0;i<N;i++)if(F[i]){let l=0;while(l<31&&F[i]>>>(l+1))l++;m.flow[i]|=l}
  // basins: one to each outlet (a land tile draining into water)
  const B=m.basin,bs=m.basins=[];B.fill(0);
  for(let d=1;d<=top;d++)for(const i of by[d]){const j=down[i];if(j<0)continue;
    if(K[j]===T_WATER){if(bs.length<65535)bs.push({id:bs.length,outlet:i,area:0,river:null});B[i]=bs.length}else B[i]=B[j];if(B[i])bs[B[i]-1].area++}
  yield .6;
  // the rivers: the main stems of the largest basins
  const n={dry:1,normal:2,wet:3}[g.s.rivers],big=bs.slice().sort((a,b)=>b.area-a.area||a.id-b.id).slice(0,n),Rv=m.river;Rv.fill(0);m.rivers=[];
  const A=['Ash','Black','Silver','Red','Cold','Willow','Stone','Grey','Elder','Wolf','Thorn','Swift'],Z=['water','run','burn','flow','wash','brook','rush','wend'],names=new Set();
  for(const b of big){const path=[b.outlet],fo=F[b.outlet],min=Math.max(16,fo*.03);
    for(;;){const i=path[path.length-1],x=i%W,y=(i-x)/W;let up=-1;
      for(const [a,c] of DIR8){const nx=x+a,ny=y+c;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(down[j]===i&&!Rv[j]&&(up<0||F[j]>F[up]))up=j}
      if(up<0||F[up]<min)break;path.push(up)}
    if(path.length<8)continue;path.reverse();
    let name;do name=A[Math.floor(R()*A.length)]+Z[Math.floor(R()*Z.length)];while(names.has(name));names.add(name);
    let wmax=1;for(let k=0;k<path.length;k++){const i=path[k],f=F[i],w=f>=fo*.55?3:f>=fo*.2?2:1;if(w>wmax)wmax=w;if(k)E[i]=Math.min(E[i],E[path[k-1]]);K[i]=T_WATER;Rv[i]=w|(w>=2?4:0)}
    for(const i of path)if((Rv[i]&3)>=2){const x=i%W,y=(i-x)/W;for(const [a,c] of DIR8){const nx=x+a,ny=y+c;if(nx>=0&&ny>=0&&nx<W&&ny<H&&K[ny*W+nx]!==T_WATER)m.feat[ny*W+nx]|=1}}
    const id=m.rivers.length;b.river=id;
    m.rivers.push({id,name,path,order:wmax,width:wmax,basin:b.id,mouth:down[b.outlet],nav:wmax>=2,rapids:[],seasonal:null});if(g.tick())yield .6+.4*id/n}
}
/* 5. forests: open land where it is wet enough (never the desert); deep wood inside wide wet woods, a sparse edge round them */
function* genForest(g){
  const m=g.map,W=m.w,H=m.h,K=m.kind,F=m.feat,R=g.rng('forest',g.attempt),sa=genSalt(R),S=W/12;
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){const i=y*W+x;if(K[i]===T_OPEN&&m.clim[i]!==CLIM.desert&&m.moist[i]+(fbm(x/S,y/S,sa)-.5)*160>135)K[i]=T_FOREST}
    if(g.tick())yield y/H*.7}
  for(let i=0;i<W*H;i++){if(K[i]!==T_FOREST)continue;const x=i%W,y=(i-x)/W;let n=0,edge=false;
    for(const [a,b] of DIR8){const nx=x+a,ny=y+b,f=nx>=0&&ny>=0&&nx<W&&ny<H&&K[ny*W+nx]===T_FOREST;if(f)n++;else if(!a||!b)edge=true}
    if(edge)F[i]|=16;else if(n===8&&m.moist[i]>=170)F[i]|=8}
}
// 6. wild regions: Phase 4's; none yet
function* genRegions(g){g.map.region.fill(0);g.map.regions=[];yield 1}
// 10. the way graph (router.js buildWayGraph: Phase 2 wave 2's), then the checksum; the result
function* genGraph(g){const m=g.map;m.graph=buildWayGraph(g);yield .5;m.sum=m.checksum(g.holdings);g.work=null;
  return{map:m,holdings:g.holdings,camps:g.camps,lords:g.lords,hamlets:[],sacred:[],lair:null,regions:m.regions,rivers:m.rivers,crossings:m.crossings,graph:m.graph,tries:g.tries,relaxed:g.relaxed}}
