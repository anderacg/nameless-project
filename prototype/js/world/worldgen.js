'use strict';
/* ---------- the world generator (doc/WORLD_DESIGN.md §8, §15.2.1): a world from its clamped settings (worldsettings.js), in eleven
   stages (GEN_STAGES), each a function* over the stage context g that yields its share done (0-1):
     genWorldSteps(settings): the stages as steps for runSteps (loading.js), behind "Forging the world…"; the last one's value is
       the result
     genWorld(settings): the same steps run at once (the tests, the wiki, LOADING.sync): the result,
       {map, holdings, camps, lords, hamlets, sacred, lair, regions, rivers, crossings, graph, tries, relaxed}
       holdings: places.js's schema (CLASSIC_PLACES) plus their tiles; installWorld (worldmap.js) puts it in
     genSketch(settings): the New world screen's quick sketch (§4.3: a coarse pass, at the end of this file)
   The stage context g: s (the clamped settings), map (a WorldMap), rng(stage, attempt) (genRng: the stage's own stream), work
   (working fields, dropped at the end), hints (CLASSIC_HINTS when classic), attempt, tick() (true once about 10 ms of work have
   passed since the last yield: when a stage yields, never what it makes), and what the stages hand on (holdings, camps, lords,
   tries, relaxed). A stage's check (§8.14), when it has one, runs it again with attempt + 1, up to 8 times, then its relax (if
   any: a name for relaxed, and 8 tries more), else keeps the last; each stage's runs are counted in tries.
   Rules (§8.1): seeded streams only, never Math.random, rnd, rint or pick; integer hashing, + - × ÷ and Math.sqrt only (never
   Math.hypot, sin, cos, exp, pow, log or atan2), so the same settings make the same world in every browser (tests/structure.js
   reads this file's text). Stages 1-6 here (terrain: land, mountains, climates, rivers, forests, 5b springs, ponds and oases;
   wild regions a stub until Phase 4), 7-9 in worldplace.js (placement), 10 the way graph (router.js buildWayGraph) and WM.sum.
   No shape is stamped: every boundary comes from domain-warped noise, every bump has a ragged, warped falloff (genReach) ---------- */
// (an integer hash of two 32-bit numbers: the stages' streams)
function genHash(a,b){let h=Math.imul((a>>>0)^0x9e3779b9,0x85ebca6b)^(b>>>0);h=Math.imul(h^h>>>16,0x7feb352d);h=Math.imul(h^h>>>15,0x846ca68b);return(h^h>>>16)>>>0}
// each stage's stream: its own, isolated (a stage's retry, attempt + 1, draws another)
const STAGE_SALT={land:1,elev:2,climate:3,rivers:4,forest:5,regions:6,holdings:7,roads:8,sites:9,graph:10,ponds:11};
const genRng=(n,stage,attempt)=>seeded(genHash(n,STAGE_SALT[stage]*64+(attempt|0)));
// (a noise salt drawn from a stream: map.js noise and fbm take it)
const genSalt=R=>Math.floor(R()*0x3fffffff);
// the 8 ways (high's and flow's directions: 0 E, 1 SE, 2 S, 3 SW, 4 W, 5 NW, 6 N, 7 NE, terrain.js TDX's order), and their lengths
const DIR8=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]],DIRLEN=DIR8.map(([a,b])=>a&&b?Math.SQRT2:1);
/* 1. the land (§8.2): share: the land's share of the map by the land setting (drawn within; rivers and lakes take about 3% of
   it later); seas, lakes: how many inland seas
   and big lakes (coasts: one inland sea or 2-3 big lakes, even odds; Huge 2-3 inland seas at least); minLand: land pieces
   smaller are sunk; minSea: water pockets off the sea smaller are filled */
const GEN_LAND={share:{continent:[.79,.8],coasts:[.755,.785],sea:[.64,.68],lakes:[.765,.785]},seas:{continent:[0,0],coasts:[0,0],sea:[1,2],lakes:[0,0]},
  lakes:{continent:[0,1],coasts:[2,3],sea:[1,2],lakes:[4,6]},minLand:40,minSea:12};
/* 2. elevation (§8.3), in elev's units (sea 64): ranges, highlands: how many at Normal (more on larger maps, x0.6 / x1.5 by the
   mountains setting); rangeLen, rangeW: a range's length and half width (tiles); passEvery: a pass this far apart along each
   range (tiles), passR its reach (in shares of the range's width), passDip how deep it cuts the ridge; peak: a ridge's height at full strength;
   plateau, plateauH: a highland's radius (tiles) and height; held: classic, a range walks no nearer a holding's anchor (and a highland's
   heart no nearer than 2.4 times that); mount: elevation on a range (ridge strength foot and more) or ridge
   strength (ridge) for a mountain, so peaks rise only on ranges and passes stay open; hill:
   elevation or local relief (relief: the span of elevation within 2 tiles) for a hill */
const GEN_ELEV={ranges:[3.4,5],highlands:[2.6,4.4],rangeLen:[90,200],rangeW:[18,24],passEvery:[44,56],passR:.5,passDip:.8,peak:205,
  plateau:[22,36],plateauH:[60,90],mount:200,ridge:.7,foot:.35,hill:150,relief:30,held:20};
/* D41's high ground from the world (stage 2): of the hill tiles, rises in the lowlands, steep hills in the highlands, cliffed
   hills on the escarpment candidates. steep: a hill on a highland (plateau: its share of one), this high (elev) or this rough
   (rough) is steep; cliff: an escarpment candidate is a step of a terrace level or more and step elevation or more between two
   tiles, in runs of run tiles or more (WM.cliffs), and the hills on one or beside it are cliffed; scree: a steep hill this high or beside a
   peak has scree. Targets for the owner's review: rises 50-70%, steep 25-40%, cliffed 5-12% of hill tiles; share: the steep and
   cliffed shares the rules' kinds are held within (rises the rest) */
const GEN_HIGH={steep:{plateau:.6,elev:190,rough:76},cliff:{step:10,run:4},scree:{elev:185},share:{steep:[.27,.38],cliff:[.06,.11]}};
/* 3. climate (§8.4), temperature and moisture 0-1 (stored x255): frost below a temperature, desert above a heat-less-wet score
   (dry: the weight of moisture in it), swamp above a wet-and-low score (low: the weight of low ground; warm: the temperature it
   needs over the frost line); each share of the land held within its range (lo-hi), so every climate keeps 6% of the land
   (the check), whatever the settings (cold, warm: the temperature x0.08); home: a classic hint's climate scores in more at its
   heart and out less away from its reach (desert in the south-east, the fens). Big climates, never a patch (the owner's fourth
   play-test: "ensure that the biomes are big enough"): blur, the temperature smoothed before the cut (a box of r tiles each way,
   n times), so a hill's height makes no frost of its own, and the low ground less (low: [r, n]; more turns the classic hints'
   green hollows to fen); strip, a tile with under this share of the land in its 5 x 5 its own climate's takes the most common
   one there (twice: no thin strip or 1-tile neck); minArea, a climate's piece (4 ways) smaller than this (at Normal's area, x the
   square root of the map's area over it) taken by the larger climate bordering it most (the swamp, the most broken, loses about
   a point of the land to it, so may end under its lo) */
const GEN_CLIMATE={frost:{at:.17,lo:.08,hi:.26},desert:{at:.56,dry:.9,lo:.08,hi:.24},swamp:{at:.5,low:.35,warm:.06,lo:.08,hi:.18},home:{in:.4,out:.2},
  blur:{r:4,n:2,low:[2,1]},strip:.3,minArea:400};
/* 4. drainage and rivers (§8.5): share: streams (and up) on this share of the land; systems: within this many rivers of 30 tiles
   or more reaching the sea or a lake at Normal (more on larger maps; both x0.6 / x1.5 by the rivers setting); great: how many
   great rivers (lower reaches 3 wide) at Normal, Large, Huge; river: a river (2 wide) carries this many times a stream's flow;
   min: shorter streams are brooks (painted only, no tile); meander: the warp of the drainage surface (elev's units) that bends
   lowland rivers; lake: a pit filled this deep over this many tiles is a lake, the deepest first, up to share of the land (half
   as deep and twice the share with the lakes setting); rapid: a fall of this much and a terrace level over run tiles of a
   navigable river; delta: a great river whose last run tiles have banks within flat of the sea splits into ch more channels
   fanning over fan tiles (where there is room); flood: floodplain within r tiles of a river (2 wide or more, or a swamp's
   stream), up to above over its water; grass: the share of grassland streams made seasonal. Flow (WM.flow bits 0-4) is log2 of
   the flow in units where a stream starts at 256 (log2 8): brooks, painted only, are log2 6-7 (and the streams shorter than min).
   brook: the flow the art draws a brook from (engine/worldnature.js BROOK[0]), on land but peaks with no river on it; the check
   holds each one running on into another or into water (the owner's fourth play-test: "streams end should flow into lakes or
   ponds"). Flow only grows downstream, so a brook's way runs on to the water it drains to.
   desert (the owner's fifth play-test: "I don't want many rivers in the desert"): no rain on its land, and what runs onto it
   sinks into the sand but a stream, so no stream rises there and none but a river from outside runs on it (an exotic river, from
   wetter or higher land); the drainage surface rises rise a tile into it (up to cap tiles in), so rivers mostly go round it; a
   river that still runs in ends, by the chance lake, in a terminal lake (an endorheic basin: water flows in, none out) some run
   tiles in, of radius r; no brook on its land, nor one running onto it (cut back from there) */
const GEN_RIVER={share:.026,systems:[8,14],great:[[1,2],[2,3],[3,5]],river:6,min:8,meander:5,lake:{depth:12,area:40,share:.012},rapid:{fall:16,run:6},
  delta:{flat:12,run:[8,16],ch:[1,3],fan:[8,16]},flood:{r:2,above:6},grass:.3,brook:6,desert:{rise:2.5,cap:40,lake:.75,run:[6,14],r:[2.2,3.6]}};
// 5. forests (§8.6): base density by climate (CLIMS' order: grass, frost, desert, swamp), times moisture and patches; forest over
// wood, deep (pieces of deepN tiles and more) over deep, a sparse edge over sparse; banks more wooded (bank: x1.15 plus)
const GEN_FOREST={base:[.45,.35,0,.5],wood:.55,deep:.75,deepN:300,sparse:.4,bank:.06,k:3.6};
// the stages, in order (§15.2.1): id, the loading label (§5.2), w (its weight on the bar), run, and its check (§8.14), if any
const GEN_STAGES=[
  {id:'land',label:'Raising the land',w:80,run:g=>genLand(g),check:g=>{const n=g.work.land/(g.map.w*g.map.h);return n<.6||n>.8?'land '+(n*100).toFixed(0)+'%':null}},
  {id:'elev',label:'Mountains',w:200,run:g=>genElev(g),check:g=>genPassCheck(g)},
  {id:'climate',label:'Climates',w:150,run:g=>genClimate(g),check:g=>{const m=g.map,n=[0,0,0,0];let L=0;for(let i=0;i<m.kind.length;i++)if(m.kind[i]!==T_WATER){n[m.clim[i]]++;L++}
    const low=n.findIndex(c=>c<L*.06);return low>=0?CLIMS[low]+' '+(n[low]*100/L).toFixed(1)+'%':null}},
  {id:'rivers',label:'Carving rivers',w:250,run:g=>genRivers(g),check:g=>genRiverCheck(g.map)},
  {id:'forest',label:'Forests',w:80,run:g=>genForest(g)},
  {id:'ponds',label:'Springs and oases',w:40,run:g=>genPonds(g),check:g=>genRiverCheck(g.map,true)},
  {id:'regions',label:'Wild lands',w:1,run:g=>genRegions(g)},
  {id:'holdings',label:'Founding holdings',w:250,run:g=>genHoldings(g)},
  {id:'roads',label:'Laying roads',w:500,run:g=>genRoads(g)},
  {id:'sites',label:'Placing camps',w:50,run:g=>genCamps(g)},
  {id:'graph',label:'Charting the ways',w:150,run:g=>genGraph(g)}
];
function genWorldSteps(settings){
  const s=normSettings(settings),n=seedNum(s.seed),m=new WorldMap(s.w,s.h,s.seed);
  m.gen='ashmark-1';m.seedNum=n;m.settings=s;m.classic=s.preset==='classic';m.salt=m.classic?0:n;m.ponds=[];m.oases=[];
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
// (each tile's distance in 4-way steps from the tiles where src(i) holds, into D (Uint16Array): 0 on them)
function* genBfs(g,D,src){
  const m=g.map,W=m.w,H=m.h,q=new Int32Array(W*H);let a=0,b=0;D.fill(65535);
  for(let i=0;i<W*H;i++)if(src(i)){D[i]=0;q[b++]=i}
  while(a<b){const i=q[a++],x=i%W,y=(i-x)/W,d=D[i]+1;
    if(x>0&&D[i-1]>d){D[i-1]=d;q[b++]=i-1}if(x<W-1&&D[i+1]>d){D[i+1]=d;q[b++]=i+1}
    if(y>0&&D[i-W]>d){D[i-W]=d;q[b++]=i-W}if(y<H-1&&D[i+W]>d){D[i+W]=d;q[b++]=i+W}
    if((a&4095)===0&&g.tick())yield a/(W*H)}
}
// (tiles by their distance from water, 4 ways, into D (Uint16Array): 0 on water, 1 on the shore...)
function* genDist(g,D){yield* genBfs(g,D,i=>g.map.kind[i]===T_WATER)}
// (each piece of tiles where is(i) holds, 4 ways (and, with join, only between tiles i, j where join(i, j) holds): its label in L
// (Int32Array, -1 elsewhere); returns the pieces' sizes)
function* genPieces(g,L,is,join){
  const m=g.map,W=m.w,H=m.h,q=new Int32Array(W*H),size=[];L.fill(-1);
  for(let s=0;s<W*H;s++){if(L[s]>=0||!is(s))continue;const id=size.length;let a=0,b=0;L[s]=id;q[b++]=s;
    while(a<b){const i=q[a++],x=i%W,y=(i-x)/W;
      for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,y>0?i-W:-1,y<H-1?i+W:-1])if(j>=0&&L[j]<0&&is(j)&&(!join||join(i,j))){L[j]=id;q[b++]=j}}
    size.push(b);if(g.tick())yield s/(W*H)}
  return size;
}
// (A, a W x H typed array, blurred in place: a box r tiles each way along the rows, then down the columns, the edges' the mean of
// what lies within)
function genBlur(A,W,H,r){for(const [n,a,b] of [[W,1,W],[H,W,1]])for(let o=0;o<(a===1?H:W);o++){let sum=0;const row=new Float32Array(n);for(let t=0;t<n;t++)row[t]=A[o*b+t*a];
  for(let t=-r;t<n;t++){if(t+r<n)sum+=row[t+r];if(t-r-1>=0)sum-=row[t-r-1];if(t>=0)A[o*b+t*a]=sum/(Math.min(n-1,t+r)-Math.max(0,t-r)+1)}}}
// (smoothstep, 0 below 0, 1 above 1)
const sstep=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
// (value noise in n octaves, about 0.5 ± 0.2: map.js noise, each octave its own salt)
function gfbm(x,y,s,n){let v=0,a=1,t=0;for(let k=0;k<n;k++){v+=noise(x,y,s+k)*a;t+=a;x=x*2.03+17.1;y=y*2.03+5.3;a*=.5}return v/t}
// (the warped distance from (cx, cy), in shares of r: under 1 within about r tiles; its edge ragged by noise of salt s, never a disc;
// st: stretched st times along the way (ax, ay), a unit vector)
function genReach(x,y,cx,cy,r,s,ax=1,ay=0,st=1){const dx=x-cx,dy=y-cy,k=r*.6,B=r*1.7*(st>1?st:1/st);if(dx>B||dx<-B||dy>B||dy<-B)return 9;
  const wx=dx+(gfbm(x/k,y/k,s,3)-.5)*r*1.1,wy=dy+(gfbm(x/k,y/k,s+9,3)-.5)*r*1.1,a=(wx*ax+wy*ay)/st,b=(wy*ax-wx*ay)*st;return Math.sqrt(a*a+b*b)/(r*(.7+.6*gfbm(x/k,y/k,s+19,2)))}
// (the length from point a to point b, [x, y])
const genLen=(a,b)=>{const dx=a[0]-b[0],dy=a[1]-b[1];return Math.sqrt(dx*dx+dy*dy)};
// (the distance from (x, y) to the polyline P ([[x, y]...]) and the share of its length where it is nearest, 0-1)
function genSeg(x,y,P){let best=1e9,at=0,len=0;const L=[0];for(let k=1;k<P.length;k++)L.push(len+=genLen(P[k],P[k-1]));
  for(let k=1;k<P.length;k++){const [ax,ay]=P[k-1],[bx,by]=P[k],dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/l2)),ex=ax+dx*t-x,ey=ay+dy*t-y,d=ex*ex+ey*ey;
    if(d<best){best=d;at=(L[k-1]+(L[k]-L[k-1])*t)/(len||1)}}return[Math.sqrt(best),at]}
// (the cut over the scores a (Float32Array, sorted here) that leaves above it the count of them over want, held within lo-hi of n:
// the tiles scoring more than the cut)
function genCut(a,n,want,lo,hi){a.sort();const L=a.length;let l=0,h=L;while(l<h){const k=(l+h)>>1;if(a[k]>want)h=k;else l=k+1}
  const c=Math.min(L,Math.max(Math.round(lo*n),Math.min(Math.round(hi*n),L-l)));return c<=0?Infinity:c>=L?-Infinity:a[L-1-c]}
// (the pits filled: a priority flood over Z (Float64Array, raised in place) from the tiles where src(i) holds, each tile at least
// a hair over the one that reached it; returns the tiles in the order filled, never downhill of the one before)
function* genFlood(g,Z,src,f0,f1){const m=g.map,W=m.w,H=m.h,N=W*H,ord=new Int32Array(N),seen=new Uint8Array(N),hp=genHeap(N);let no=0;
  for(let i=0;i<N;i++)if(src(i)){seen[i]=1;hp.push(Z[i],i)}
  while(hp.size()){const c=hp.pop(),x=c%W,y=(c-x)/W;ord[no++]=c;
    for(let k=0;k<8;k++){const nx=x+DIR8[k][0],ny=y+DIR8[k][1];if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;if(seen[j])continue;seen[j]=1;
      if(Z[j]<=Z[c])Z[j]=Z[c]+1e-3*DIRLEN[k];hp.push(Z[j],j)}
    if((no&8191)===0&&g.tick())yield f0+(f1-f0)*no/N}
  return ord.subarray(0,no)}
// (a binary heap of tiles by key, the smallest first: the priority flood's)
function genHeap(n){const k=new Float64Array(n+1),v=new Int32Array(n+1);let z=0;return{
  size:()=>z,
  push(key,i){let c=++z;while(c>1){const p=c>>1;if(k[p]<=key)break;k[c]=k[p];v[c]=v[p];c=p}k[c]=key;v[c]=i},
  pop(){const r=v[1],lk=k[z],lv=v[z--];let c=1;for(;;){let ch=c*2;if(ch>z)break;if(ch<z&&k[ch+1]<k[ch])ch++;if(k[ch]>=lk)break;k[c]=k[ch];v[c]=v[ch];c=ch}k[c]=lk;v[c]=lv;return r}}}
// (the classic hints with their places: pts, the points they name, [x, y] on this map: a holding's anchor or map shares)
function genHints(g,kind){if(!g.hints)return[];const A=classicAnchors(),m=g.map,at=a=>{const p=A.find(o=>o.name===a);return p?[p.tx,p.ty]:null};
  return g.hints.filter(h=>h.kind===kind).map(h=>{const a=h.at,pts=a==null?[]:typeof a==='string'?[at(a)]:typeof a[0]==='number'?[[a[0]*m.w,a[1]*m.h]]:a.map(at);
    return{...h,pts:pts.filter(Boolean)}})}

/* 1. land (§8.2): warped fbm (5 octaves, wavelength 27% of the width, and bays and capes at a third of it, more with More sea) less a falloff toward the frame (an oval swelling to the
   corners, warped less; a margin of sea), so no coast follows the frame; inland seas and big lakes dug as ragged dips; the cut chosen for the land setting's share; land
   under 40 tiles sunk, water pockets under 12 filled; feat lake (water cut off from the sea) and coast (land on the sea).
   Classic: no inland sea or big lake on a holding's anchor; land round every anchor, the League's bay with an inlet up to each
   port, Willowmere's isle (genLandHints) */
/* (the land's field, before its cut: stage 1's first draws from its stream R, in their order (the noise salts, the share wanted, the
   inland seas and big lakes); at(x, y) its value at tile point (x, y) of a W x H map, want the land share drawn. The quick sketch
   samples the same field (genSketch)) */
function genLandField(s,W,H,R,hints){
  const N=W*H,T=GEN_LAND,sc=Math.sqrt(N/143360);
  const sw=genSalt(R),sx=genSalt(R),sb=genSalt(R),sr=genSalt(R),S=W*.27,SW=W*.16,AW=W*.07,rag=s.land==='sea';
  const pk=a=>a[0]+Math.floor(R()*(a[1]-a[0]+1)),sh=T.share[s.land],want=sh[0]+R()*(sh[1]-sh[0]);
  let ns=pk(T.seas[s.land]),nl=pk(T.lakes[s.land]);if(s.land==='coasts'&&R()<.5){ns=1;nl=0}if(N>=400000)ns=Math.max(ns,2+(R()<.5?1:0));
  const bl=[],AN=hints?classicAnchors():[];for(let k=0;k<ns+nl;k++){const sea=k<ns,r=sea?W*(.055+R()*.035):(8+R()*8)*Math.max(1,sc*.8);
    for(let t=0;t<30;t++){const x=W*(.2+R()*.6),y=H*(.2+R()*.6);if(bl.every(b=>(b.x-x)*(b.x-x)+(b.y-y)*(b.y-y)>(b.r+r+12)*(b.r+r+12))&&AN.every(a=>(a.tx-x)*(a.tx-x)+(a.ty-y)*(a.ty-y)>(r*1.4+8)*(r*1.4+8))){bl.push({x,y,r,d:sea?.7:.6,s:genSalt(R)});break}}}
  return{want,at(x,y){
    const wx=x+(gfbm(x/SW,y/SW,sw,3)-.5)*4*AW,wy=y+(gfbm(x/SW,y/SW,sx,3)-.5)*4*AW;
    let v=gfbm(wx/S,wy/S,sb,5)+(gfbm(wx/(S*.3),wy/(S*.3),sr,3)-.5)*(rag?.6:.35);
    {const ex=2*(x+(wx-x)*.4)/W-1,ey=2*(y+(wy-y)*.4)/H-1;v-=sstep((Math.sqrt(ex*ex*.8+ey*ey*.8+ex*ex*ey*ey*.6)-.45)/.65)*1.1+(1-sstep(Math.min(x,W-1-x,y,H-1-y)/(W*.04)))*.6}
    for(const b of bl)v-=b.d*sstep(1-genReach(wx,wy,b.x,b.y,b.r,b.s));
    return v}}}
function* genLand(g){
  const m=g.map,W=m.w,H=m.h,N=W*H,K=m.kind,F=m.feat,T=GEN_LAND,R=g.rng('land',g.attempt),LF=genLandField(g.s,W,H,R,g.hints),want=LF.want;
  const V=g.work.landv=new Float32Array(N);
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++)V[y*W+x]=LF.at(x,y);
    if(g.tick())yield y/H*.6}
  {const q=V.slice().sort(),cut=q[Math.min(N-1,Math.floor((1-want)*N))];for(let i=0;i<N;i++)V[i]-=cut}
  if(g.hints){genLandHints(g,V,R);const q=V.slice().sort(),cut=q[Math.min(N-1,Math.floor((1-want)*N))];for(let i=0;i<N;i++)V[i]-=cut}
  for(let i=0;i<N;i++){const x=i%W,y=(i-x)/W;K[i]=x<1||y<1||x>=W-1||y>=H-1||V[i]<0?T_WATER:T_OPEN}
  yield .7;
  // land under minLand tiles sunk; then the sea (water joined to the rim), water pockets under minSea filled, the rest lakes
  const L=new Int32Array(N);let size=yield* genPieces(g,L,i=>K[i]!==T_WATER);
  for(let i=0;i<N;i++)if(L[i]>=0&&size[L[i]]<T.minLand)K[i]=T_WATER;
  size=yield* genPieces(g,L,i=>K[i]===T_WATER);const rim=L[0];F.fill(0);
  for(let i=0;i<N;i++)if(L[i]>=0&&L[i]!==rim){if(size[L[i]]<T.minSea)K[i]=T_OPEN;else F[i]|=2}
  let land=0;for(let i=0;i<N;i++){if(K[i]===T_WATER)continue;land++;const x=i%W;
    for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(j>=0&&j<N&&K[j]===T_WATER&&!(F[j]&2)){F[i]|=4;break}}
  g.work.land=land;
}
/* (the classic land (GEN_HINT_LAND): each sea hint's bay, a ragged one at the heart of its ports (their middle), as wide as the
   holdings round it leave room for, open to the frame on its side by a strait aimed between the holdings (of 9 ways within 60° of
   side, the one passing farthest from any), and an inlet from beside each port to the bay; then land round each holding's anchor,
   that high at least whatever the frame's falloff (a port's only close round it, so it stands on the shore), and a neck of land
   neck tiles wide toward its realm's heart; Willowmere's isle
   (willowIsle) ringed by a narrow lake) */
const GEN_HINT_LAND={land:.3,r:13,port:3,neck:6,bay:{port:.8,room:16,deep:1.2},strait:.6,inlet:[2.5,4.5]};
function genLandHints(g,V,R){
  const m=g.map,W=m.w,H=m.h,A=classicAnchors(),T=GEN_HINT_LAND,sa=genSalt(R);
  const add=(cx,cy,r,f)=>{for(let y=Math.max(0,cy-r*1.5|0);y<Math.min(H,cy+r*1.5+1);y++)for(let x=Math.max(0,cx-r*1.5|0);x<Math.min(W,cx+r*1.5+1);x++){const d=genReach(x,y,cx,cy,r,sa);if(d<1.4)f(y*W+x,d,x,y)}};
  const cut=(x,y)=>{const ox=(gfbm(x/9,y/9,sa+3,2)-.5)*8,oy=(gfbm(x/9,y/9,sa+5,2)-.5)*8;return[x+ox,y+oy]},ports=new Set(genHints(g,'sea').flatMap(h=>h.ports));
  for(const h of genHints(g,'sea')){const P=h.ports.map(p=>A.find(o=>o.name===p)).filter(Boolean);if(!P.length)continue;
    const cx=P.reduce((a,p)=>a+p.tx,0)/P.length,cy=P.reduce((a,p)=>a+p.ty,0)/P.length,far=a=>genLen([a.tx,a.ty],[cx,cy]);
    const r=Math.min(...P.map(far))*T.bay.port,room=Math.min(...A.filter(a=>!ports.has(a.name)).map(far))-T.bay.room,br=Math.max(6,Math.min(r,room));
    const sx=h.side==='e'?1:h.side==='w'?-1:0,sy=h.side==='s'?1:h.side==='n'?-1:0;let S=null,best=-1;
    for(let k=-1.6;k<=1.61;k+=.4){const ux=sx-sy*k,uy=sy+sx*k,l=Math.sqrt(ux*ux+uy*uy),L=[[cx,cy],[cx+ux/l*W*2,cy+uy/l*W*2]],d=Math.min(...A.map(a=>genSeg(a.tx,a.ty,L)[0]));if(d>best){best=d;S=L}}
    const sw=Math.min(br,best*.8)*T.strait;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const [u,v]=cut(x,y),[d]=genSeg(u,v,S),a=Math.max(sstep(1.1-genReach(x,y,cx,cy,br,sa+1)),sstep((sw-d)/(sw*.5)));if(a)V[y*W+x]-=T.bay.deep*a}
    // (each port's inlet, from beside it (its widest half width and a tile off) to the bay's heart)
    const [w0,w1]=T.inlet;for(const p of P){const l=far(p);if(l<1)continue;const o=(w1+1)/l,L=[[p.tx+(cx-p.tx)*o,p.ty+(cy-p.ty)*o],[cx,cy]];
      const e=w1+12,x0=Math.max(0,Math.min(L[0][0],cx)-e|0),x1=Math.min(W-1,Math.max(L[0][0],cx)+e),y0=Math.max(0,Math.min(L[0][1],cy)-e|0),y1=Math.min(H-1,Math.max(L[0][1],cy)+e);
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const [u,v]=cut(x,y),[d]=genSeg(u,v,L),w=w0+gfbm(x/14,y/14,sa+7,2)*(w1-w0);if(d<w+2)V[y*W+x]-=T.bay.deep*sstep((w+2-d)/2)}}}
  // (the anchors' land, and a neck of land from each but a port toward its realm's heart (its holdings' middle), so none stands on an isle)
  const C={};A.forEach((a,k)=>{const c=C[CLASSIC_PLACES[k].realm]||(C[CLASSIC_PLACES[k].realm]={x:0,y:0,n:0});c.x+=a.tx;c.y+=a.ty;c.n++});
  A.forEach((a,k)=>{const c=C[CLASSIC_PLACES[k].realm],L=ports.has(a.name)?[]:[[a.tx,a.ty],[c.x/c.n,c.y/c.n]],x0=Math.max(0,Math.min(a.tx,c.x/c.n)-T.neck*2|0),x1=Math.min(W-1,Math.max(a.tx,c.x/c.n)+T.neck*2),
    y0=Math.max(0,Math.min(a.ty,c.y/c.n)-T.neck*2|0),y1=Math.min(H-1,Math.max(a.ty,c.y/c.n)+T.neck*2);
    if(L.length)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const [u,v]=cut(x,y),[d]=genSeg(u,v,L);if(d<T.neck)V[y*W+x]=Math.max(V[y*W+x],T.land*sstep((T.neck-d)/3))}
    add(a.tx,a.ty,ports.has(a.name)?T.port:T.r,(i,d)=>{V[i]=Math.max(V[i],T.land*sstep(1.15-d))})});
  for(const h of genHints(g,'island'))for(const [cx,cy] of h.pts)add(cx,cy,11,(i,d,x,y)=>{const r=Math.sqrt((x-cx)*(x-cx)+(y-cy)*(y-cy))*(.7+.6*gfbm(x/7,y/7,sa+11,3));
    V[i]=r<6?Math.max(V[i],.3):r<8.2?Math.min(V[i],-.3):Math.max(V[i],.2)});
}

/* 2. elevation (§8.3): lowlands rising gently from the coast, with rolling hill country; highlands (plateaus, terraced into the
   4 levels, their risers the escarpments); ranges: smoothed random walks through the interior, each a ridge (1 - d/width)² times
   ridged noise (peaks and saddles), cut by a pass every 44-56 tiles. Kinds: mountain at elevation 200 on a range or ridge
   strength 0.7, hill at 150 or local relief 30 (GEN_ELEV); sea deepening off the shore, lakes just under their shores. rough (the largest step to
   the 8 neighbours x4, smoothed once), the escarpment candidates (cliffs: {a, b, side}, a run of tiles a to b, each a terrace
   level or more over its neighbour on side, a DIR8 way: 0 E, 2 S, 4 W, 6 N, the cliff's face), D41's high ground (GEN_HIGH).
   Hands on the float elevation (work.ef), the highland share (work.plateau), the ranges (work.spines) and the elevation as made
   (work.elev0, so the rivers' carving starts over on a retry). Classic: the hinted ranges (elev: the northern peaks, the peaks
   north of Karn Hold), no other range or highland near a holding's anchor (held), the valley of the great river past
   Stonebridge (stonebridge: genValleyHint) */
function* genElev(g){
  const m=g.map,W=m.w,H=m.h,N=W*H,K=m.kind,E=m.elev,s=g.s,T=GEN_ELEV,G=GEN_HIGH,R=g.rng('elev',g.attempt),A=N/143360,mul={flat:.6,normal:1,rugged:1.5}[s.mountains];
  const D=g.work.dist=new Uint16Array(N);yield* genDist(g,D);
  const Ef=g.work.ef=new Float32Array(N),Rg=new Float32Array(N),P=g.work.plateau=new Float32Array(N),ap=Math.sqrt(A)*Math.sqrt(Math.sqrt(Math.sqrt(A)));
  const span=a=>Math.max(1,Math.round((a[0]+R()*(a[1]-a[0]))*ap*mul)),sp=g.work.spines=[],hl=[];
  const near=(x,y,r)=>sp.some(q=>q.pts.some(p=>(p[0]-x)*(p[0]-x)+(p[1]-y)*(p[1]-y)<r*r)),AN=g.hints?classicAnchors():[],held=(x,y)=>AN.some(a=>(a.tx-x)*(a.tx-x)+(a.ty-y)*(a.ty-y)<T.held*T.held);
  // the ranges: a walk each way from an inland start, turning slowly; smoothed; a pass every passEvery tiles along it
  const spine=(pts,R)=>{for(let r=0;r<2;r++){const q=pts.map(p=>p.slice());for(let j=2;j<pts.length-2;j++)for(const c of [0,1])pts[j][c]=(q[j-2][c]+q[j-1][c]+q[j][c]+q[j+1][c]+q[j+2][c])/5}
    const a=[0];for(let j=1;j<pts.length;j++)a.push(a[j-1]+genLen(pts[j],pts[j-1]));
    const ps=[],L=a[a.length-1];for(let t=T.passEvery[0]*.5+R()*16,j=0;t<L-10;t+=T.passEvery[0]+R()*(T.passEvery[1]-T.passEvery[0])){while(a[j]<t)j++;ps.push(pts[j])}
    sp.push({pts,arc:a,passes:ps,w:T.rangeW[0]+R()*(T.rangeW[1]-T.rangeW[0]),k:sp.length*7.3})};
  for(const h of genHints(g,'elev'))for(const [cx,cy] of h.pts){const dy=h.side==='n'?-h.r:h.side==='s'?h.r:0,dx=h.side==='w'?-h.r:h.side==='e'?h.r:0,pts=[];
    for(let t=-40;t<=40;t+=1.5)pts.push([cx+dx+(dy?t:0),cy+dy+(dx?t:0)+(R()-.5)*3]);spine(pts,R)}
  const nr=span(T.ranges)+sp.length;
  for(let t=0;sp.length<nr&&t<300;t++){
    const x0=8+R()*(W-16),y0=8+R()*(H-16),i0=(y0|0)*W+(x0|0);if(K[i0]===T_WATER||D[i0]<14||near(x0,y0,40)||held(x0,y0))continue;
    let ux=R()-.5,uy=R()-.5;{const l=Math.sqrt(ux*ux+uy*uy)||1;ux/=l;uy/=l}
    const len=T.rangeLen[0]+R()*(T.rangeLen[1]-T.rangeLen[0]);
    const Da=(x,y)=>x<1||y<1||x>=W-1||y>=H-1?0:D[(y|0)*W+(x|0)];
    // (each step turning a little, and away from the coast when it comes near)
    const walk=(dx,dy)=>{const o=[];let x=x0,y=y0,c=0;for(let j=0;j<len/3;j++){c=c*.9+(R()-.5)*.09;if(Da(x+dx*8,y+dy*8)<12)c+=Da(x+(dx-dy*.6)*8,y+(dy+dx*.6)*8)>Da(x+(dx+dy*.6)*8,y+(dy-dx*.6)*8)?.03:-.03;c=Math.max(-.07,Math.min(.07,c));const nx=dx-dy*c,ny=dy+dx*c,l=Math.sqrt(nx*nx+ny*ny);dx=nx/l;dy=ny/l;x+=dx*1.5;y+=dy*1.5;
      if(x<6||y<6||x>=W-6||y>=H-6)break;const i=(y|0)*W+(x|0);if(K[i]===T_WATER||D[i]<3||near(x,y,26)||held(x,y))break;o.push([x,y])}return o};
    const a=walk(ux,uy),b=walk(-ux,-uy),pts=b.reverse().concat([[x0,y0]],a);if(pts.length>=24)spine(pts,R)}
  const sn=genSalt(R);
  for(const q of sp){const L=q.arc[q.arc.length-1];
    for(let j=0;j<q.pts.length;j++){const [px,py]=q.pts[j],a=q.arc[j];let st=Math.min(1,a/22,(L-a)/22);if(st<=0)continue;
      const w=q.w*(.75+.5*noise(a/22,q.k,sn));
      for(let y=Math.max(0,Math.floor(py-w));y<=Math.min(H-1,py+w);y++)for(let x=Math.max(0,Math.floor(px-w));x<=Math.min(W-1,px+w);x++){
        const i=y*W+x,d=Math.sqrt((x-px)*(x-px)+(y-py)*(y-py))/w;if(d<1){const c=(1-d)*(1-d)*st;if(c>Rg[i])Rg[i]=c}}}
    if(g.tick())yield .1}
  // the passes: a notch through the ridge at each
  for(const q of sp)for(const [px,py] of q.passes){const r=T.passR*q.w;
    for(let y=Math.max(0,Math.floor(py-r));y<=Math.min(H-1,py+r);y++)for(let x=Math.max(0,Math.floor(px-r));x<=Math.min(W-1,px+r);x++){const d=Math.sqrt((x-px)*(x-px)+(y-py)*(y-py))/r;if(d<1)Rg[y*W+x]*=1-T.passDip*sstep(1-d)}}
  // the highlands: ragged plateaus inland, apart from each other
  const nh=span(T.highlands);
  for(let t=0;hl.length<nh&&t<300;t++){const x=12+R()*(W-24),y=12+R()*(H-24),i=(y|0)*W+(x|0);
    if(K[i]===T_WATER||D[i]<18||hl.some(h=>(h.x-x)*(h.x-x)+(h.y-y)*(h.y-y)<(h.r+60)*(h.r+60))||AN.some(a=>(a.tx-x)*(a.tx-x)+(a.ty-y)*(a.ty-y)<T.held*T.held*5.6))continue;
    let ux=R()-.5,uy=R()-.5;const l=Math.sqrt(ux*ux+uy*uy)||1;
    hl.push({x,y,r:T.plateau[0]+R()*(T.plateau[1]-T.plateau[0]),h:T.plateauH[0]+R()*(T.plateauH[1]-T.plateauH[0]),s:genSalt(R),ux:ux/l,uy:uy/l,st:1+R()*.7})}
  // the land: lowland rising from the coast, rolling hill country, the highlands terraced, the ranges on top
  const s1=genSalt(R),s2=genSalt(R),s3=genSalt(R),s4=genSalt(R),s5=genSalt(R),SL=W*.25;
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){const i=y*W+x;if(K[i]===T_WATER)continue;const d=D[i];
      let e=66+24*sstep(Math.min(d,30)/30)+(gfbm(x/36,y/36,s1,3)-.5)*24*Math.min(1,d/10)+Math.max(0,gfbm(x/SL,y/SL,s5,3)-.35)*90*Math.min(1,d/15);
      e+=(gfbm(x/6,y/6,s3,3)-.5)*72*sstep((gfbm(x/48,y/48,s2,2)-.47)*5)*Math.min(1,d/6);
      let p=0,ph=null;for(const h of hl){const v=sstep((1-genReach(x,y,h.x,h.y,h.r,h.s,h.ux,h.uy,h.st))*2.2);if(v>p){p=v;ph=h}}
      if(p>0){const t=e+p*ph.h*(.55+.9*(gfbm(x/18,y/18,ph.s+30,3)-.3)),l=(t-64)/32,f=l-Math.floor(l),q=64+32*(Math.floor(l)+sstep((f-.72)/.28));
        e=t+(q-t)*sstep(p*3)*sstep((gfbm(x/22,y/22,ph.s+40,2)-.26)*6)}
      P[i]=p;
      if(Rg[i]>0){Rg[i]*=1-.3*Math.min(1,Math.abs(2*gfbm(x/14,y/14,s4,3)-1)*2.5);e+=T.peak*Rg[i]}
      Ef[i]=e}
    if(g.tick())yield .15+y/H*.45}
  for(const h of genHints(g,'river'))genValleyHint(g,h,Ef,Rg,R);
  // water: the sea deepening off the shore; each lake just under the lowest of its shores
  {const Dl=new Uint16Array(N);yield* genBfs(g,Dl,i=>K[i]!==T_WATER);const L=new Int32Array(N),size=yield* genPieces(g,L,i=>K[i]===T_WATER&&(m.feat[i]&2)),lo=size.map(()=>255);
    for(let i=0;i<N;i++){if(K[i]!==T_WATER||L[i]>=0)continue;Ef[i]=63-Math.min(Dl[i],12)}
    for(let i=0;i<N;i++){if(L[i]<0)continue;const x=i%W;for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(j>=0&&j<N&&K[j]!==T_WATER&&Ef[j]<lo[L[i]])lo[L[i]]=Ef[j]}
    for(let i=0;i<N;i++)if(L[i]>=0)Ef[i]=Math.max(65,lo[L[i]]-2)}
  // kinds: by elevation, ridge strength and local relief (the span within 2 tiles: rows, then columns)
  const mx=new Float32Array(N),mn=new Float32Array(N),rx=new Float32Array(N),rn=new Float32Array(N);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){let a=-1e9,b=1e9;for(let k=Math.max(0,x-2);k<=Math.min(W-1,x+2);k++){const v=Ef[y*W+k];if(v>a)a=v;if(v<b)b=v}rx[y*W+x]=a;rn[y*W+x]=b}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){let a=-1e9,b=1e9;for(let k=Math.max(0,y-2);k<=Math.min(H-1,y+2);k++){const j=k*W+x;if(rx[j]>a)a=rx[j];if(rn[j]<b)b=rn[j]}mx[y*W+x]=a;mn[y*W+x]=b}
  for(let i=0;i<N;i++){if(K[i]===T_WATER){E[i]=Math.max(0,Math.min(63,Math.round(Ef[i])));if(m.feat[i]&2)E[i]=Math.round(Ef[i]);continue}
    const e=Ef[i];E[i]=Math.max(65,Math.min(255,Math.round(e)));K[i]=e>=T.mount&&Rg[i]>=T.foot||Rg[i]>=T.ridge?T_MOUNT:e>=T.hill||mx[i]-mn[i]>=T.relief?T_HILL:T_OPEN}
  yield .7;
  // rough: the largest step to the 8 neighbours x4, smoothed once
  const U=m.rough,Tm=new Uint8Array(N),at=(x,y)=>E[Math.max(0,Math.min(H-1,y))*W+Math.max(0,Math.min(W-1,x))];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const e=E[y*W+x];let s=0;for(const [a,b] of DIR8){const v=Math.abs(at(x+a,y+b)-e);if(v>s)s=v}Tm[y*W+x]=Math.min(255,s*4)}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;U[i]=(Tm[i]*4+Tm[y*W+Math.max(0,x-1)]+Tm[y*W+Math.min(W-1,x+1)]+Tm[Math.max(0,y-1)*W+x]+Tm[Math.min(H-1,y+1)*W+x])>>3}
  // the escarpment candidates: on land, a terrace level or more and cliff.step over the neighbour on a side, in runs along it
  const tr=i=>Math.max(0,Math.min(3,(E[i]-64)>>5)),cl=new Uint8Array(N);m.cliffs=[];
  const runs=(side,dx,dy)=>{const ax=dy?1:0,ay=dx?1:0,n=ax?W:H,len=ax?H:W;
    for(let o=0;o<len;o++){let a=-1,c=0;for(let t=0;t<=n;t++){let ok=false,i=-1;if(t<n){const x=ax?t:o,y=ax?o:t,nx=x+dx,ny=y+dy;i=y*W+x;
          if(nx>=0&&ny>=0&&nx<W&&ny<H){const j=ny*W+nx;ok=K[i]!==T_WATER&&tr(i)>tr(j)&&E[i]-E[j]>=G.cliff.step}}
        if(ok){if(a<0)a=i;c++;continue}
        if(c>=G.cliff.run){m.cliffs.push({a,b:i>=0?i-(ax?1:W):(ax?o*W+n-1:(n-1)*W+o),side});for(let k=0,j=a;k<c;k++,j+=ax?1:W)cl[j]=1}a=-1;c=0}}};
  runs(0,1,0);runs(2,0,1);runs(4,-1,0);runs(6,0,-1);
  // D41's high ground on each hill: its kind by the rules above, then held within GEN_HIGH.share (cliffed ones added within 2 of an
  // escarpment, the roughest first, or the ones only beside it dropped; steep ones of the lowest score made rises, or rises of the
  // highest made steep); the way it rises (to its highest neighbour), scree; mixed: a steep hill by a rise
  const Hi=m.high,hs=[],on=i=>{const x=i%W;return cl[i]||x>0&&cl[i-1]||x<W-1&&cl[i+1]||i>=W&&cl[i-W]||i+W<N&&cl[i+W]},
    near2=i=>{const x=i%W,y=(i-x)/W;for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++){const nx=x+a,ny=y+b;if(nx>=0&&ny>=0&&nx<W&&ny<H&&cl[ny*W+nx])return true}return false};
  Hi.fill(0);for(let i=0;i<N;i++)if(K[i]===T_HILL){hs.push(i);Hi[i]=on(i)?3:P[i]>=G.steep.plateau||E[i]>=G.steep.elev||U[i]>=G.steep.rough?2:1}
  const n=hs.length,cnt=k=>hs.filter(i=>Hi[i]===k).length,sc=i=>U[i]+E[i]-150+P[i]*60,hold=(k,lo,hi,down,up,key)=>{let c=cnt(k);
    if(c>hi*n)for(const i of hs.filter(i=>Hi[i]===k&&down(i)).sort((a,b)=>key(a)-key(b)||a-b)){if(c<=hi*n)break;Hi[i]=k-1;c--}
    else if(c<lo*n)for(const i of hs.filter(i=>Hi[i]<k&&up(i)).sort((a,b)=>key(b)-key(a)||a-b)){if(c>=lo*n)break;Hi[i]=k;c++}};
  hold(3,G.share.cliff[0],G.share.cliff[1],i=>!cl[i],near2,i=>U[i]);hold(2,G.share.steep[0],G.share.steep[1],()=>true,i=>Hi[i]===1,sc);
  for(const i of hs){const x=i%W,y=(i-x)/W,kind=Hi[i];let up=0,top=-1,peak=false;DIR8.forEach(([a,b],k)=>{const v=at(x+a,y+b);if(v>top){top=v;up=k}if(m.kindAt(x+a,y+b)===T_MOUNT)peak=true});
    Hi[i]=kind|up<<2|(kind===2&&(peak||E[i]>=G.scree.elev)?32:0)}
  for(let i=0;i<N;i++)if((Hi[i]&3)===2){const x=i%W;for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(j>=0&&j<N&&(Hi[j]&3)===1){Hi[i]|=64;break}}
  g.work.elev0=E.slice();
}
/* (the classic great river's valley (stonebridge, GEN_VALLEY): a trough from the highest ground of the north (within head tiles
   of the anchor's line, in the band band of the map's height) past the anchor (just east of it, so the holding is on its west
   bank, east tiles off, unbent within still[0] tiles of it and fully bent past still[0] + still[1]) to the coast on side to. The land within bowl tilted gently toward it first (tilt at the trough), so the valley gathers
   a great river's water; then its bed, deep below the land along it and never rising downstream (the lowest so far, at n points
   along it), its floor floor tiles across, its walls rising wall a tile from it, within w; ranges cut through; its line bent by
   bend[0] tiles of noise bend[1] tiles across, so it winds) */
const GEN_VALLEY={w:22,deep:26,bowl:90,tilt:34,head:60,band:[.05,.22],floor:1.5,wall:2.5,bend:[60,26],east:5,still:[8,30],n:256};
function genValleyHint(g,h,Ef,Rg,R){
  const m=g.map,W=m.w,H=m.h,N=W*H,T=GEN_VALLEY,[cx,cy]=h.pts[0],sa=genSalt(R);let hx=cx,hy=H*T.band[0],top=-1e9;
  for(let y=Math.round(H*T.band[0]);y<=H*T.band[1];y++)for(let x=Math.max(0,Math.round(cx-T.head));x<=Math.min(W-1,cx+T.head);x++){const i=y*W+x;if(m.kind[i]!==T_WATER&&Ef[i]>top){top=Ef[i];hx=x;hy=y}}
  const P=[[hx,hy]];for(let k=1;k<=5;k++)P.push([hx+(cx+T.east-hx)*k/5+(k<5?(R()-.5)*20:0),hy+(cy-hy)*k/5]);for(let k=1;k<=4;k++)P.push([cx+T.east+(R()-.5)*30,cy+(H-cy)*k/4]);
  const D=new Float32Array(N).fill(-1),At=new Float32Array(N),L=[0];for(let k=1;k<P.length;k++)L.push(L[k-1]+genLen(P[k],P[k-1]));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(m.kind[i]===T_WATER)continue;const st=sstep((Math.sqrt((x-cx)*(x-cx)+(y-cy)*(y-cy))-T.still[0])/T.still[1]),[d,at]=genSeg(x+((gfbm(x/T.bend[1],y/T.bend[1],sa,2)-.5)*T.bend[0]+(gfbm(x/9,y/9,sa+3,2)-.5)*10)*st,y,P);if(d>T.bowl)continue;
    Ef[i]-=T.tilt*sstep(1-d/T.bowl);D[i]=d;At[i]=at}
  // (the bed: the land along the line less deep, the lowest so far from the head)
  const bed=new Float32Array(T.n+1);let lo=1e9;
  for(let k=0;k<=T.n;k++){const s=k/T.n*L[L.length-1];let j=1;while(j<L.length-1&&L[j]<s)j++;const t=(s-L[j-1])/((L[j]-L[j-1])||1),x=Math.round(P[j-1][0]+(P[j][0]-P[j-1][0])*t),y=Math.round(P[j-1][1]+(P[j][1]-P[j-1][1])*t);
    const i=Math.max(0,Math.min(H-1,y))*W+Math.max(0,Math.min(W-1,x));lo=Math.min(lo-.05,m.kind[i]===T_WATER?lo:Ef[i]-T.deep);bed[k]=lo}
  for(let i=0;i<N;i++){const d=D[i];if(d<0||d>=T.w)continue;Ef[i]=Math.min(Ef[i],bed[Math.round(At[i]*T.n)]+Math.max(0,d-T.floor)*T.wall);if(d<8)Rg[i]*=d/8}
}
// (stage 2's check: a pass at least every 60 tiles of each range: along its spine, a cross-section with no mountain on it)
function genPassCheck(g){const m=g.map;for(const q of g.work.spines){const p=q.pts;let run=0,last=0;
  for(let j=0;j<p.length;j++){const a=p[Math.max(0,j-2)],b=p[Math.min(p.length-1,j+2)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.sqrt(dx*dx+dy*dy)||1,ux=-dy/l,uy=dx/l;
    let shut=false;for(let t=-q.w*.7;t<=q.w*.7&&!shut;t+=1)shut=m.kindAt(Math.round(p[j][0]+ux*t),Math.round(p[j][1]+uy*t))===T_MOUNT;
    run=shut?run+q.arc[j]-last:0;last=q.arc[j];if(run>60)return'a range '+Math.round(q.arc[q.arc.length-1])+' tiles long without a pass for 60'}}
  return null}

/* 3. climate (§8.4): temperature by latitude (the north cold), less with height (x0.35), warped noise ±0.12 and the climate
   setting; moisture blown from the west (gained over water, lost over land and faster up slopes: rain shadows east of the
   ranges), plus the coast's, blurred into broad fields, warped noise ±0.15 and the rivers setting; the climate a lookup on the
   two (GEN_CLIMATE, the temperature and low ground smoothed first), its cuts held so each keeps its share of the land; then
   tidied, no strip and no piece under minArea (genClimTidy). Classic: the cold north and marches (frostNorth,
   frostMarches), the hot dry south-east, the desert's home (desertSouthEast), the green west (greenWest), the fens, the swamp's
   home (fens) */
function* genClimate(g){
  const m=g.map,W=m.w,H=m.h,N=W*H,E=m.elev,K=m.kind,s=g.s,C=GEN_CLIMATE,R=g.rng('climate',g.attempt),st=genSalt(R),sm=genSalt(R),sw=genSalt(R),sx=genSalt(R),D=g.work.dist;
  const Tf=new Float32Array(N),Mf=new Float32Array(N),Sw=new Float32Array(N),dt={cold:-.08,temperate:0,warm:.08}[s.climate],dm={dry:-.08,normal:0,wet:.08}[s.rivers],S=W*.15,AW=W*.04;
  // moisture: a wind from the west along each row, then blurred (a box of 6, rows and columns, twice)
  for(let y=0;y<H;y++){let h=1;for(let x=0;x<W;x++){const i=y*W+x;if(K[i]===T_WATER){h+=(1-h)*.12;Mf[i]=h*.55;continue}
    const up=x?Math.max(0,E[i]-E[i-1]):0;Mf[i]=h*(.5+up*.05);h=Math.max(0,h-h*(.0045+up*.012))}}
  for(let r=0;r<2;r++){genBlur(Mf,W,H,6);if(g.tick())yield .1+r*.1}
  for(let y=0;y<H;y++){for(let x=0;x<W;x++){const i=y*W+x,wx=x+(gfbm(x/S,y/S,sw,2)-.5)*4*AW,wy=y+(gfbm(x/S,y/S,sx,2)-.5)*4*AW,el=Math.max(0,E[i]-64)/191;
      Tf[i]=.06+.88*wy/(H-1)+(gfbm(wx/S,wy/S,st,3)-.5)*.48-.35*el+dt;
      Mf[i]=Mf[i]+.22*(1-Math.min(D[i],18)/18)+(gfbm(wx/S,wy/S,sm,3)-.5)*.6+dm}
    if(g.tick())yield .2+y/H*.4}
  // (a hint's climate (clim: desert or swamp) at home in its reach: its score up there, down elsewhere (GEN_CLIMATE.home))
  const Dw=new Float32Array(N),home=(c,i,b)=>{const v=C.home.in*b-C.home.out*(1-b);if(c==='swamp')Sw[i]+=v;else if(c==='desert')Dw[i]+=v};
  // (a hint's bump, 0-1 a tile: the largest of its points' warped reaches of r, each within its box)
  const bump=(pts,r,sb)=>{const B=new Float32Array(N),e=Math.ceil(r*1.7);for(const [cx,cy] of pts)for(let y=Math.max(0,Math.floor(cy-e));y<=Math.min(H-1,cy+e);y++)for(let x=Math.max(0,Math.floor(cx-e));x<=Math.min(W-1,cx+e);x++){
    const v=sstep(1.2-genReach(x,y,cx,cy,r,sb)),i=y*W+x;if(v>B[i])B[i]=v}return B};
  for(const h of genHints(g,'temp')){const sb=genSalt(R),B=h.side?null:bump(h.pts,h.r*1.6,sb);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let b=0;
      if(h.side){const d=h.side==='n'?y:h.side==='s'?H-1-y:h.side==='w'?x:W-1-x;b=sstep(1-(d+(gfbm(x/30,y/30,sb,3)-.5)*h.r*.8)/h.r)}else b=B[i];
      if(b){Tf[i]+=.45*h.d*b;if(h.dry)Mf[i]-=.35*h.dry*b}if(h.clim)home(h.clim,i,b)}}
  for(const h of genHints(g,'moist')){const B=bump(h.pts,h.r,genSalt(R));for(let i=0;i<N;i++){const b=B[i];if(b)Mf[i]+=.3*h.d*b;if(h.clim)home(h.clim,i,b)}}
  // the temperature and the low ground smoothed (blur)
  const Lw=new Float64Array(N);for(let i=0;i<N;i++)Lw[i]=1-Math.min(1,Math.max(0,E[i]-64)/50);
  for(let r=0;r<C.blur.n;r++)genBlur(Tf,W,H,C.blur.r);for(let r=0;r<C.blur.low[1];r++)genBlur(Lw,W,H,C.blur.low[0]);if(g.tick())yield .65;
  // the climates: frost below a cut, then desert above a heat-less-wet cut, then swamp above a wet-and-low cut; each cut held so
  // its climate keeps lo-hi of the land; then tidied (genClimTidy)
  let L=0;for(let i=0;i<N;i++)if(K[i]!==T_WATER)L++;
  const pass=(want,lo,hi,score,ok)=>{const a=new Float32Array(L);let n=0;for(let i=0;i<N;i++)if(K[i]!==T_WATER&&ok(i))a[n++]=score(i);return genCut(a.subarray(0,n),L,want,lo,hi)};
  const fs=i=>-Tf[i],ds=i=>Tf[i]-C.desert.dry*Mf[i]+Dw[i],ss=i=>Mf[i]*(1-C.swamp.low)+Lw[i]*C.swamp.low+Sw[i];
  const cf=pass(-C.frost.at,C.frost.lo,C.frost.hi,fs,()=>true),cd=pass(C.desert.at,C.desert.lo,C.desert.hi,ds,i=>fs(i)<=cf);
  const tw=-cf+C.swamp.warm,cs=pass(C.swamp.at,C.swamp.lo,C.swamp.hi,ss,i=>fs(i)<=cf&&ds(i)<=cd&&Tf[i]>tw);
  yield .75;
  for(let i=0;i<N;i++)m.clim[i]=fs(i)>cf?CLIM.frost:ds(i)>cd?CLIM.desert:Tf[i]>tw&&ss(i)>cs?CLIM.swamp:CLIM.grass;
  yield* genClimTidy(g,Tf,Mf);
  for(let i=0;i<N;i++){m.temp[i]=Math.max(0,Math.min(255,Math.round(Tf[i]*255)));m.moist[i]=Math.max(0,Math.min(255,Math.round(Mf[i]*255)))}
}
/* (stage 3's tidying (GEN_CLIMATE strip, minArea): the strips, then the small pieces, each given to the larger piece bordering it
   most (pieces smaller than it, or as large and later, never: no two swap), until none is left that can be; a piece with no larger
   one beside it (an isle's) stays, and so does a classic holding's home: the piece its anchor stands on, in its own climate (the
   hints' green hollow of Mossdell in the fens). Each tile moved takes the mean temperature and moisture of its new climate's
   tiles round it, ring by ring inward, so WM.temp and moist still match its climate (the frost: every frost tile colder than
   every other)) */
function* genClimTidy(g,Tf,Mf){
  const m=g.map,W=m.w,H=m.h,N=W*H,K=m.kind,Cl=m.clim,C=GEN_CLIMATE,land=i=>K[i]!==T_WATER,moved=new Uint8Array(N),min=Math.round(C.minArea*Math.sqrt(N/143360));
  // (a tile ringed by land of its own climate keeps it: 9 of its 5 x 5 at least, over strip while strip is 9/25 or less)
  const R8=[-W-1,-W,-W+1,-1,1,W-1,W,W+1],inner=(i,x,y)=>{if(!x||!y||x===W-1||y===H-1)return false;for(const o of R8)if(!land(i+o)||Cl[i+o]!==Cl[i])return false;return true};
  for(let r=0;r<2;r++){const nc=Cl.slice();
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!land(i)||inner(i,x,y))continue;const n=[0,0,0,0];let l=0;
      for(let b=Math.max(0,y-2);b<=Math.min(H-1,y+2);b++)for(let a=Math.max(0,x-2);a<=Math.min(W-1,x+2);a++){const j=b*W+a;if(land(j)){n[Cl[j]]++;l++}}
      if(n[Cl[i]]>=C.strip*l)continue;let c=0;for(let k=1;k<4;k++)if(n[k]>n[c])c=k;if(c!==Cl[i]){nc[i]=c;moved[i]=1}}
    Cl.set(nc);if(g.tick())yield .8+r*.05}
  const L=new Int32Array(N),home=g.hints?classicAnchors().map((a,k)=>[a.ty*W+a.tx,CLIM[CLASSIC_PLACES[k].clim]]):[];
  for(let r=0;r<16;r++){const size=yield* genPieces(g,L,land,(i,j)=>Cl[i]===Cl[j]),n=size.length,bd=new Int32Array(n*4),to=new Int8Array(n).fill(-1);let any=false;
    for(let i=0;i<N;i++){const p=L[i];if(p<0||size[p]>=min)continue;const x=i%W;
      for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,i>=W?i-W:-1,i+W<N?i+W:-1]){const q=j<0?-1:L[j];if(q>=0&&q!==p&&(size[q]>size[p]||size[q]===size[p]&&q>p))bd[p*4+Cl[j]]++}}
    for(const [i,c] of home)if(L[i]>=0&&Cl[i]===c)size[L[i]]=min;
    for(let p=0;p<n;p++){if(size[p]>=min)continue;let c=-1;for(let k=0;k<4;k++)if(bd[p*4+k]&&(c<0||bd[p*4+k]>bd[p*4+c]))c=k;if(c>=0){to[p]=c;any=true}}
    if(!any)break;
    for(let i=0;i<N;i++){const p=L[i];if(p>=0&&to[p]>=0){Cl[i]=to[p];moved[i]=1}}}
  yield .9;
  let left=[];for(let i=0;i<N;i++)if(moved[i])left.push(i);
  while(left.length){const set=[],next=[];
    for(const i of left){const x=i%W,y=(i-x)/W;let t=0,w=0,n=0;
      for(const [a,b] of DIR8){const u=x+a,v=y+b,j=v*W+u;if(u>=0&&v>=0&&u<W&&v<H&&!moved[j]&&land(j)&&Cl[j]===Cl[i]){t+=Tf[j];w+=Mf[j];n++}}
      if(n)set.push(i,t/n,w/n);else next.push(i)}
    if(!set.length)break;for(let k=0;k<set.length;k+=3){const i=set[k];Tf[i]=set[k+1];Mf[i]=set[k+2];moved[i]=0}left=next}
}

/* 4. drainage and rivers (§8.5, §6.6): the pits filled by a priority flood from the sea (over the elevation and a little warped
   noise, so lowland rivers meander), a hair's slope kept so water always drains; pits filled deep enough lakes (feat lake, water)
   that spill out; each tile draining to its steepest neighbour (flow's way); rain (moisture) gathered downstream (flow); a basin
   to each outlet on the sea (basin, basins); Strahler order over the brooks and up. The stream's flow chosen for as many river
   systems as the size and setting ask; streams (1 wide), rivers (2) and great rivers (3, order 4 and up, their lower reaches)
   by flow; each river a list from its source down to where it joins water or a larger river, 4-way joined (no gap a walker could
   slip through), its bed never rising downstream; deltas, rapids, navigable, floodplain, seasonal flags (§6.6.4) */
function* genRivers(g){
  const m=g.map,W=m.w,H=m.h,N=W*H,K=m.kind,Fe=m.feat,E=m.elev,s=g.s,T=GEN_RIVER,R=g.rng('rivers',g.attempt),A=N/143360,Ef=g.work.ef,ap=Math.sqrt(A)*Math.sqrt(Math.sqrt(Math.sqrt(A))),Rv=m.river;
  E.set(g.work.elev0);Rv.fill(0);m.flow.fill(0);m.basin.fill(0);
  const sea=i=>K[i]===T_WATER&&!(Fe[i]&2)&&!(Rv[i]&3),lake=i=>K[i]===T_WATER&&(Fe[i]&2);
  // the pits filled (a priority flood from the sea over the elevation, the meander noise and the desert's rise)
  const Z=new Float64Array(N),Z0=new Float32Array(N),sm=genSalt(R),sf=genSalt(R),TD=T.desert,dz=i=>K[i]!==T_WATER&&m.clim[i]===CLIM.desert,Dd=new Uint16Array(N);
  yield* genBfs(g,Dd,i=>!dz(i));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!sea(i))Z0[i]=Z[i]=Ef[i]+(gfbm(x/9,y/9,sm,2)-.5)*T.meander*2*(1-sstep((Ef[i]-100)/60))+TD.rise*Math.min(Dd[i],TD.cap)}
  yield* genFlood(g,Z,sea,0,.1);
  // (the pits' depth, filled over the land as it was: stage 5b's ponds lie in them)
  {const P=g.work.pit=new Float32Array(N);for(let i=0;i<N;i++)P[i]=Z[i]-Z0[i]}
  // lakes: the pits filled lake.depth and more over lake.area tiles and more
  {const L=new Int32Array(N),size=yield* genPieces(g,L,i=>!sea(i)&&Z[i]-Z0[i]>=1),deep=size.map(()=>0),lk=s.land==='lakes'?2:1,ok=new Uint8Array(size.length);let land=0;
    for(let i=0;i<N;i++){if(K[i]!==T_WATER)land++;if(L[i]>=0&&Z[i]-Z0[i]>deep[L[i]])deep[L[i]]=Z[i]-Z0[i]}
    let room=land*T.lake.share*lk;for(const k of size.map((n,k)=>k).filter(k=>size[k]>=T.lake.area&&deep[k]>=T.lake.depth/lk).sort((a,b)=>deep[b]*size[b]-deep[a]*size[a]||a-b))if(size[k]<=room){ok[k]=1;room-=size[k]}
    for(let i=0;i<N;i++)if(L[i]>=0&&ok[L[i]]&&K[i]!==T_WATER){K[i]=T_WATER;Fe[i]=(Fe[i]&~4)|2;E[i]=Math.max(65,Math.min(255,Math.floor(Z[i])))}
    // the flats left (filled, no lake) given a wandering floor, and filled again, so rivers wind across them; ord the tiles in the
    // order filled, never downhill of the one before
    for(let i=0;i<N;i++)if(L[i]>=0&&!ok[L[i]]){const x=i%W,y=(i-x)/W;Z[i]+=gfbm(x/10,y/10,sf,2)*T.meander*2}}
  const ord=yield* genFlood(g,Z,sea,.2,.3),no=ord.length;
  // each tile's way down (the steepest); the flow gathered (rain by moisture) and its main source (up: the largest inflow)
  const dn=new Int32Array(N).fill(-1),Fa=new Float32Array(N),up=new Int32Array(N).fill(-1);
  for(let i=0;i<N;i++){if(sea(i))continue;const x=i%W,y=(i-x)/W;let b=-1,bk=0,bs=0;
    for(let k=0;k<8;k++){const nx=x+DIR8[k][0],ny=y+DIR8[k][1];if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx,v=(Z[i]-Z[j])/DIRLEN[k];if(v>bs){bs=v;b=j;bk=k}}
    dn[i]=b;m.flow[i]=bk<<5}
  // (the flow gathered downstream: no rain on the desert's land, and with fs, the stream's flow, what runs onto it sinks into the
  // sand there but a stream's (its main inflow at fs or more); none out of a terminal lake (sink))
  const sink=new Uint8Array(N),gather=fs=>{up.fill(-1);for(let i=0;i<N;i++)Fa[i]=sea(i)||dz(i)?0:.3+m.moist[i]/255;
    for(let k=no-1;k>=0;k--){const i=ord[k],d=dn[i];if(fs&&dz(i)&&!(up[i]>=0&&Fa[up[i]]>=fs))Fa[i]=0;if(d<0||sea(d)||sink[i])continue;Fa[d]+=Fa[i];if(up[d]<0||Fa[i]>Fa[up[d]])up[d]=i}};
  gather(0);
  yield .35;
  // the stream's flow: streams on share of the land, then held so the river systems (30 tiles or more into the sea or a lake) are
  // within systems (more on larger maps; x0.6, x1.5 by the rivers setting)
  const mul={dry:.6,normal:1,wet:1.5}[s.rivers],len=new Int32Array(N),land=i=>K[i]!==T_WATER,sys=T.systems.map(v=>Math.max(2,Math.round(v*ap*mul)));
  const systems=fs=>{let n=0;for(let k=no-1;k>=0;k--){const i=ord[k];if(!land(i)||Fa[i]<fs){len[i]=0;continue}const u=up[i];len[i]=1+(u>=0&&land(u)?len[u]:0);
    if(len[i]>=30&&!land(dn[i]))n++}return n},tiles=fs=>{let n=0;for(let i=0;i<N;i++)if(Fa[i]>=fs&&land(i))n++;return n};
  const find=(f,v)=>{let lo=1,hi=1;for(let i=0;i<N;i++)if(land(i)&&Fa[i]>hi)hi=Fa[i];for(let t=0;t<16;t++){const mid=Math.sqrt(lo*hi);if(f(mid)>v)lo=mid;else hi=mid}return hi};
  let L0=0;for(let i=0;i<N;i++)if(land(i))L0++;let Fs=find(tiles,L0*T.share*mul);const n0=systems(Fs);
  if(n0>sys[1])Fs=Math.min(Fs*1.6,find(systems,sys[1]));else if(n0<sys[0])Fs=Math.max(Fs/1.6,find(systems,sys[0]-1)*.999);
  const Fr=Fs*T.river,Fb=Fs/8;
  gather(Fs);
  // a stream running into the desert (its main inflow from outside it) ends there, by the chance desert.lake, in a terminal lake
  // desert.run tiles down (or fewer, short of where it leaves the desert again), ragged, of radius desert.r, on the desert's land
  // only and touching no other water (else none); the flow gathered again
  {const ld=[];for(let k=no-1;k>=0;k--){const i=ord[k],u=up[i];if(dz(i)&&Fa[i]>=Fs&&u>=0&&!dz(u))ld.push(i)}
    if(ld.length){const sl=genSalt(R);let any=false;
      for(const e of ld){if(sink[e]||genHash(sl,e)/4294967296>=TD.lake)continue;const want=TD.run[0]+genHash(sl+1,e)%(TD.run[1]-TD.run[0]+1);let c=e,n=0;
        while(n<want){const d=dn[c];if(d<0||!dz(d))break;c=d;n++}
        if(n<TD.run[0]>>1)continue;const cx=c%W,cy=(c-cx)/W,r=TD.r[0]+(genHash(sl+2,e)%1000)/1000*(TD.r[1]-TD.r[0]),e2=Math.ceil(r*1.7),pts=[];let ok=true;
        for(let y=Math.max(1,cy-e2);y<=Math.min(H-2,cy+e2)&&ok;y++)for(let x=Math.max(1,cx-e2);x<=Math.min(W-2,cx+e2);x++){const i=y*W+x;if(i!==c&&(genReach(x,y,cx,cy,r,sl+3)>=1||!dz(i)||K[i]===T_MOUNT))continue;
          for(const j of [i-1,i+1,i-W,i+W,i-W-1,i-W+1,i+W-1,i+W+1])if(K[j]===T_WATER&&!sink[j]){ok=false;break}if(!ok)break;pts.push(i)}
        if(!ok)continue;let lo=255;for(const i of pts){K[i]=T_WATER;Fe[i]=(Fe[i]&~4)|2;sink[i]=1}any=true;
        for(const i of pts)for(const j of [i-1,i+1,i-W,i+W])if(!sink[j]&&E[j]<lo)lo=E[j];for(const i of pts)E[i]=Math.max(65,lo-2)}
      if(any)gather(Fs)}}
  for(let i=0;i<N;i++)if(!sea(i)){let l=0,t=2;const v=Fa[i]*256/Fs;while(l<31&&v>=t){l++;t*=2}m.flow[i]|=l}
  // Strahler order over the rills (an eighth of a stream's flow) and up
  const so=new Uint8Array(N),mo=new Uint8Array(N),mc=new Uint8Array(N);
  for(let k=no-1;k>=0;k--){const i=ord[k];if(sea(i)||Fa[i]<Fb)continue;so[i]=!mo[i]?1:mc[i]>=2?Math.min(255,mo[i]+1):mo[i];const d=dn[i];if(d<0||sea(d))continue;
    if(so[i]>mo[d]){mo[d]=so[i];mc[d]=1}else if(so[i]===mo[d])mc[d]++}
  // great rivers: the largest outlets on the sea, their reaches over Fg (between the last great one's flow and the next's)
  const outs=[];for(let i=0;i<N;i++)if(land(i)&&sea(dn[i]))outs.push(Fa[i]);outs.sort((a,b)=>b-a);
  const gr=T.great[A<1.5?0:A<3.5?1:2],ng=gr[0]+Math.floor(R()*(gr[1]-gr[0]+1)),f1=outs[ng-1]||Infinity,f2=outs[ng]||0;
  const Fg=Math.max(f1*.45,Math.min(f2*1.05,f1*.8));
  const width=i=>Fa[i]>=Fg&&so[i]>=4?3:Fa[i]>=Fr?2:1;
  yield .45;
  // the rivers: from each source (a stream tile no stream flows into) down the main stem to water or to where it joins a larger one
  const riv=i=>land(i)&&Fa[i]>=Fs,P=[];
  for(let i=0;i<N;i++){if(!riv(i)||up[i]>=0&&riv(up[i]))continue;const p=[i];let c=i;
    for(;;){const d=dn[c];if(!riv(d)||up[d]!==c){P.push({p,mouth:d});break}p.push(d);c=d}}
  // brooks: streams shorter than min with none joining them (painted only)
  {const into=new Set(P.map(r=>r.mouth));for(const r of P)r.drop=r.p.length<T.min&&!r.p.some(i=>into.has(i))}
  const rs=P.filter(r=>!r.drop);
  // 4-way joined: a corner tile (the lower free one, else one already a river) in each diagonal step; a corner on water ends it there
  const isR=new Uint8Array(N);for(const r of rs)for(const i of r.p)isR[i]=1;
  for(const r of rs){const p=r.p,q=[p[0]],w=[width(p[0])];
    for(let k=1;k<=p.length;k++){const a=q[q.length-1],b=k<p.length?p[k]:r.mouth,ax=a%W,ay=(a-ax)/W,bx=b%W,by=(b-bx)/W;
      if(ax!==bx&&ay!==by){const c1=ay*W+bx,c2=by*W+ax,f1=K[c1]!==T_WATER&&!isR[c1],f2=K[c2]!==T_WATER&&!isR[c2],c=f1&&f2?(Ef[c1]<=Ef[c2]?c1:c2):f1?c1:f2?c2:isR[c1]?c1:c2;if(K[c]===T_WATER&&!isR[c]){r.mouth=c;break}q.push(c);w.push(w[w.length-1])}
      if(k<p.length){q.push(b);w.push(width(b))}}
    r.p=q;r.w=w}
  // (and one cut shorter than min there, with none joining it, a brook after all)
  {const into=new Set(rs.map(r=>r.mouth));for(let k=rs.length-1;k>=0;k--)if(rs[k].p.length<T.min&&!rs[k].p.some(i=>into.has(i)))rs.splice(k,1)}
  yield .5;
  // deltas: a great river whose last delta.run tiles have banks within delta.flat of the sea narrows to 2 there (its main channel)
  const dl=[];
  const bank=i=>{const x=i%W,y=(i-x)/W;let e=0,c=0;for(const [a,b] of DIR8){const j=(y+b*2)*W+x+a*2;if(land(j)&&!isR[j]){e+=E[j];c++}}return c?e/c:64};
  for(const r of rs){const p=r.p,n=p.length;if(r.w[n-1]<3||!sea(r.mouth))continue;let k=n;while(k>0&&bank(p[k-1])<=64+T.delta.flat)k--;
    const run=Math.min(n-k,T.delta.run[0]+Math.floor(R()*(T.delta.run[1]-T.delta.run[0]+1)));if(run<T.delta.run[0])continue;
    for(let j=n-run;j<n;j++)r.w[j]=2;r.delta=n-run;dl.push(r)}
  // names: unique, from two syllables
  const NA=['Ash','Black','Silver','Red','Cold','Willow','Stone','Grey','Elder','Wolf','Thorn','Swift','Alder','Bright','Cedar','Clear','Crow','Dark','Deep','Dun','Fair','Fern','Frost','Glen','Gold','Green',
    'Hollow','Iron','Long','Moss','Oak','Raven','Reed','Rush','Salt','Sand','Shadow','Silt','Slate','Still','Sun','Tarn','Wild','White','Wych','Yew','Bram','Kestrel','Heron','Otter','Pike','Bitter','Hart','Elm','Rowan','Stag'],
    NZ=['water','run','burn','flow','wash','rush','wend','beck','bourne','mere','rill','wade','lode','fleet','brook','tarn'],used=new Set(CLASSIC_PLACES.map(p=>p.name));
  const name=()=>{for(let t=0;t<40;t++){const n=NA[Math.floor(R()*NA.length)]+NZ[Math.floor(R()*NZ.length)];if(!used.has(n)){used.add(n);return n}}const n='Nameless '+used.size;used.add(n);return n};
  // the delta's other channels, before any tile is laid (occ: the tiles the rivers will cover): from the split, sideways out of the
  // main channel, then each toward its own point on the coast across the fan, wandering a little; traced at a few stretches of
  // the targets, the first whose mouths fan over delta.fan kept, else no delta (the main channel full width to the sea)
  const brush=(i,w,f)=>{const x=i%W,y=(i-x)/W,a=w===3?-1:0,b=w===1?0:1;for(let dy=a;dy<=b;dy++)for(let dx=a;dx<=b;dx++){const nx=x+dx,ny=y+dy;if(nx>0&&ny>0&&nx<W-1&&ny<H-1)f(ny*W+nx)}};
  const occ=new Uint8Array(N);for(const r of rs)for(let k=0;k<r.p.length;k++)brush(r.p[k],r.w[k],j=>{occ[j]=1});
  for(const r of dl){const p=r.p,sp=p[r.delta],sx=sp%W,sy=(sp-sx)/W,mx=r.mouth%W,my=(r.mouth-mx)/W,vx=mx-sx,vy=my-sy,l=Math.sqrt(vx*vx+vy*vy)||1,ux=-vy/l,uy=vx/l,sn=genSalt(R);
    const nc=T.delta.ch[0]+Math.floor(R()*(T.delta.ch[1]-T.delta.ch[0]+1)),fan=T.delta.fan[0]+R()*(T.delta.fan[1]-T.delta.fan[0]);
    // (the room on each side of the split: land off the main channel, 4 ways across it, before water; the channels shared out
    // between the sides with room, the farthest half the fan out, or the whole fan with one side)
    const side=sd=>{const ox=Math.abs(ux)>=Math.abs(uy)?Math.sign(ux*sd):0,oy=ox?0:Math.sign(uy*sd);let c=sp,n=0;
      for(let t=0;t<12;t++){c+=ox+oy*W;if(K[c]===T_WATER)break;if(!occ[c])n++}return{sd,ox,oy,n}};
    const S=[side(-1),side(1)].filter(o=>o.n>=4),reach=S.length>1?fan/2:fan,spread=cs=>{const ms=[r.mouth,...cs.map(c=>c.mouth)];let v=0;
      for(const a of ms)for(const b of ms)v=Math.max(v,Math.abs(a%W-b%W),Math.abs(((a-a%W)-(b-b%W))/W));return v};
    let best=null;
    for(const z of S.length?[1.3,1,1.8,2.4]:[]){const cs=[],used=new Set();
      for(let k=0;k<S.length;k++){const o=S[k],per=Math.floor(nc/S.length)+(k<nc%S.length?1:0);
        for(let n=0;n<per;n++){const d=reach*z*(n+1)/per,tx=mx+ux*o.sd*d,ty=my+uy*o.sd*d,q=[],was=new Set([sp]);let c=sp,ok=false;
          for(let t=0;t<2;t++){c+=o.ox+o.oy*W;was.add(c);if(!occ[c])q.push(c)}
          for(let t=0;t<(p.length-r.delta)*3+12&&!ok;t++){const cx=c%W,cy=(c-cx)/W;let b=-1,bs=1e9;
            for(const [a,e] of [[1,0],[0,1],[-1,0],[0,-1]]){const nx=cx+a,ny=cy+e,j=ny*W+nx;if(nx<1||ny<1||nx>=W-1||ny>=H-1||was.has(j)||used.has(j)||occ[j])continue;
              const v=Math.sqrt((tx-nx)*(tx-nx)+(ty-ny)*(ty-ny))+noise(nx/4,ny/4,sn)*2.5;if(v<bs){bs=v;b=j}}
            if(b<0)break;was.add(b);if(sea(b)){ok=true;q.push(b);break}q.push(b);c=b}
          if(ok&&q.length>=5){for(const i of q)used.add(i);cs.push({path:q.slice(0,-1),mouth:q[q.length-1]})}}}
      const v=spread(cs);if(cs.length&&v>=T.delta.fan[0]&&v<=T.delta.fan[1]){best=cs;break}}
    if(best){r.ch=best;for(const c of best)for(const i of c.path)occ[i]=1}else{for(let k=r.delta;k<p.length;k++)r.w[k]=3;r.delta=null}}
  // the tiles: water, the width (a 2 x 2 brush for rivers, 3 x 3 for great rivers), the delta's bit; then the delta's channels
  const id=new Int32Array(N).fill(-1);
  m.rivers=[];
  for(const r of rs){r.id=m.rivers.length;r.name=name();for(let k=0;k<r.p.length;k++){const i=r.p[k],w=r.w[k],dt=r.delta!=null&&k>=r.delta?128:0;id[i]=r.id;
      brush(i,w,j=>{if(sea(j)||lake(j))return;K[j]=T_WATER;Rv[j]=Math.max(Rv[j]&3,w)|(Rv[j]&~3)|dt;if(id[j]<0)E[j]=Math.min(E[j],E[i])})}
    m.rivers.push({id:r.id,name:r.name,path:r.p,order:Math.max(1,...r.p.map(i=>so[i])),width:Math.max(...r.w),basin:0,mouth:r.mouth,nav:false,rapids:[],seasonal:null})}
  for(const r of dl)for(const c of r.ch||[]){const cid=m.rivers.length,sp=r.p[r.delta];for(const i of c.path){K[i]=T_WATER;Rv[i]=1|128;id[i]=cid;E[i]=Math.min(E[i],E[sp])}
    m.rivers.push({id:cid,name:r.name,path:c.path,order:so[sp]||1,width:1,basin:0,mouth:c.mouth,nav:false,rapids:[],seasonal:null})}
  yield .6;
  // beds never rising: along each river the lowest so far, then (mouths first) never under the water it runs into
  const RL=m.rivers,by=RL.slice().sort((a,b)=>Z[a.mouth]-Z[b.mouth]||a.id-b.id);
  for(let t=0;t<4;t++){for(const r of RL){let e=255;for(const i of r.path){e=Math.min(e,E[i]);E[i]=e}}let n=0;
    for(const r of by){const e=E[r.mouth];for(const i of r.path)if(E[i]<e){E[i]=e;n++}}if(!n)break}
  for(const r of RL)for(const i of r.path)brush(i,Rv[i]&3,j=>{if(id[j]<0&&Rv[j]&3)E[j]=E[i]});
  // basins: one to each outlet on the sea or a terminal lake (lake water 0); a basin's river: the longest reaching the sea (or that
  // lake) there
  {const bi=new Int32Array(N).fill(-1),bs=m.basins=[];
    for(let k=0;k<no;k++){const i=ord[k];if(sea(i))continue;const d=dn[i];if(d<0)continue;if(sea(d)||sink[d]){if(bs.length<65535)bs.push({id:bs.length,outlet:i,area:0,river:null});bi[i]=bs.length-1}else bi[i]=bi[d]}
    for(let i=0;i<N;i++)if(bi[i]>=0&&!lake(i)){m.basin[i]=bi[i]+1;if(K[i]!==T_WATER)bs[bi[i]].area++}
    for(const r of RL){const b=bi[r.path[r.path.length-1]];r.basin=Math.max(0,b);if(b>=0&&(sea(r.mouth)||sink[r.mouth])&&(bs[b].river===null||RL[bs[b].river].path.length<r.path.length))bs[b].river=r.id}}
  // navigable: rivers 2 wide and more, but for their rapids (a fall of rapid.fall and a terrace level over rapid.run tiles); a river
  // sets its own tiles' and narrower ones', never a wider river's it runs into
  for(const r of RL){if(r.width<2)continue;const p=r.path,ra=[];r.nav=true;
    for(let k=0;k<p.length;k++){const j=Math.min(p.length-1,k+T.rapid.run);if(E[p[k]]-E[p[j]]>=T.rapid.fall&&(E[p[k]]-64>>5)>(E[p[j]]-64>>5)){const l=ra[ra.length-1];if(l&&l[1]>=k-1)l[1]=j;else ra.push([k,j])}}
    r.rapids=ra;const rp=new Uint8Array(p.length);for(const [a,b] of ra)for(let k=a;k<=b;k++)rp[k]=1;
    for(let k=0;k<p.length;k++)if((Rv[p[k]]&3)>=2)brush(p[k],Rv[p[k]]&3,j=>{if((Rv[j]&3)>=2&&(Rv[j]&3)<=r.width)Rv[j]=rp[k]?Rv[j]&~4:Rv[j]|4})}
  for(const r of RL)for(const [a,b] of r.rapids)for(let k=a;k<=b;k++)brush(r.path[k],Rv[r.path[k]]&3,j=>{if((Rv[j]&3)<=r.width)Rv[j]&=~4});
  yield .7;
  // floodplain: low land within flood.r of a river 2 wide or more, or of a swamp's stream, or in a delta
  for(let i=0;i<N;i++){const w=Rv[i]&3;if(!w||w<2&&m.clim[i]!==CLIM.swamp&&!(Rv[i]&128))continue;const x=i%W,y=(i-x)/W,r=Rv[i]&128?3:T.flood.r;
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const j=ny*W+nx;
      if((K[j]===T_OPEN||K[j]===T_FOREST)&&E[j]<=E[i]+T.flood.above)Fe[j]|=1}}
  // seasonal flags (§6.6.4), by the climate most of a river runs through: frost, all but great rivers freeze and streams flood in
  // the thaw; desert, streams with no lasting source (a lake, or high ground of another climate) flash and run dry; swamp, streams
  // and delta channels flood and dry; grass, about 30% of streams, by cold or high ground (freeze), a high source (flood) or dry
  // land (dry)
  if(s.seasonal){const grass=[];
    for(const r of RL){if(r.width>=3)continue;const n=[0,0,0,0];let t=0,w=0;for(const i of r.path){n[m.clim[i]]++;t+=m.temp[i];w+=m.moist[i]}t/=r.path.length;w/=r.path.length;
      const c=n.indexOf(Math.max(...n)),src=r.path[0],high=g.work.elev0[src]>=150,fed=lake(up[src]>=0?up[src]:src)||high&&m.clim[src]!==CLIM.desert,ch=Rv[src]&128;let f=null;
      if(c===CLIM.frost)f={freeze:true,flood:r.width===1,dry:false,flash:false};
      else if(r.width>1&&!ch)continue;
      else if(c===CLIM.desert&&r.width===1&&!fed)f={freeze:false,flood:true,dry:true,flash:true,day:1+Math.floor(R()*13)};
      else if(c===CLIM.swamp)f={freeze:false,flood:true,dry:true,flash:false};
      else if(c===CLIM.grass&&r.width===1&&!ch){const why=t<80||high&&g.work.elev0[src]>=170?'freeze':high?'flood':w<95?'dry':null;grass.push({r,why,k:genHash(r.id,g.map.seedNum)})}
      if(f)r.seasonal={day:null,...f}}
    grass.sort((a,b)=>(!!b.why-!!a.why)||a.k-b.k);const take=Math.round(grass.length*T.grass);
    for(let k=0;k<take;k++){const o=grass[k],why=o.why||['flood','dry','freeze'][o.k%3];o.r.seasonal={freeze:why==='freeze',flood:why==='flood',dry:why==='dry',flash:false,day:null}}
    for(const r of RL){const f=r.seasonal;if(!f)continue;const bits=8|(f.freeze?16:0)|(f.flood?32:0)|(f.dry?64:0);for(const i of r.path)brush(i,Math.min(Rv[i]&3,r.width),j=>{if((Rv[j]&3)<=r.width)Rv[j]|=bits})}}
  // the flow's way on each river tile: to the next along its river (the wider river's where two share a tile)
  for(const r of RL.slice().sort((a,b)=>a.width-b.width||a.id-b.id)){const p=r.path;for(let k=0;k<p.length;k++){const a=p[k],b=k+1<p.length?p[k+1]:r.mouth,dx=b%W-a%W,dy=Math.round((b-a-dx)/W),d=DIR8.findIndex(([u,v])=>u===Math.sign(dx)&&v===Math.sign(dy));if(d>=0)m.flow[a]=(m.flow[a]&31)|d<<5}}
  // no brook on the desert's land (its flow under brook), nor one running onto it: cut back from there (ord: downstream first)
  {const B=T.brook,cut=new Uint8Array(N),bk=i=>K[i]!==T_WATER&&!(Rv[i]&3)&&(m.flow[i]&31)>=B;
    for(let k=0;k<no;k++){const i=ord[k];if(!bk(i))continue;const d=dn[i];if(dz(i)||d>=0&&K[d]!==T_WATER&&(dz(d)||cut[d]))cut[i]=1}
    for(let i=0;i<N;i++)if(cut[i])m.flow[i]=(m.flow[i]&~31)|(B-1)}
  g.work.ord=ord;g.work.dn=dn;
}
// (stage 4's check, the rivers' rules (§8.14): each never rising downstream, ends in water, water all along, its widths as made;
// and every brook (GEN_RIVER.brook) runs on into another brook or into water, never ending dry; with src (stage 5b's, once the
// woods and springs are laid), every brook's head has a source (genSourced)
function genRiverCheck(m,src){for(const r of m.rivers){const p=r.path;if(!p.length)return r.name+' is empty';if(m.kind[r.mouth]!==T_WATER)return r.name+' ends on land';
  for(let k=0;k<p.length;k++){if(m.kind[p[k]]!==T_WATER||!(m.river[p[k]]&3))return r.name+' has a dry tile';if(k&&m.elev[p[k]]>m.elev[p[k-1]])return r.name+' runs uphill'}
  if(m.elev[r.mouth]>m.elev[p[p.length-1]])return r.name+' runs uphill into its mouth'}
  const W=m.w,H=m.h,K=m.kind,F=m.flow,bk=i=>K[i]!==T_WATER&&K[i]!==T_MOUNT&&!(m.river[i]&3)&&(F[i]&31)>=GEN_RIVER.brook;
  for(let i=0;i<W*H;i++){if(!bk(i))continue;const x=i%W,y=(i-x)/W,[dx,dy]=DIR8[F[i]>>5],u=x+dx,v=y+dy;
    if(u<0||v<0||u>=W||v>=H||K[v*W+u]!==T_WATER&&!bk(v*W+u))return 'a brook ends dry at ('+x+', '+y+')'}
  if(src)for(let i=0;i<W*H;i++)if(bk(i)&&!genFed(m,i)&&!genSourced(m,i))return 'a brook rises on open land at ('+i%W+', '+(i-i%W)/W+')';
  return null}

/* 5. forests (§8.6): density by climate (GEN_FOREST.base) x moisture x warped patches, thinning up high; banks more wooded (gallery
   forests, palms by desert rivers); open land over wood is forest; deep wood in pieces of deepN tiles and more where denser than
   deep (feat 8); sparse edges (feat 16, copses and lone trees) on open land between sparse and wood */
function* genForest(g){
  const m=g.map,W=m.w,H=m.h,N=W*H,K=m.kind,F=m.feat,T=GEN_FOREST,R=g.rng('forest',g.attempt),sa=genSalt(R),sw=genSalt(R),S=W*.06,AW=W*.02,Dn=new Float32Array(N);
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){const i=y*W+x;if(K[i]!==T_OPEN)continue;
      let bank=false;for(const [a,b] of DIR8){const nx=x+a,ny=y+b;if(nx>=0&&ny>=0&&nx<W&&ny<H&&m.river[ny*W+nx]&3){bank=true;break}}
      const c=m.clim[i],base=c===CLIM.desert&&bank?T.base[0]:T.base[c],wx=x+(gfbm(x/S,y/S,sw,2)-.5)*4*AW,wy=y+(gfbm(x/S,y/S,sw+5,2)-.5)*4*AW;
      let d=base*T.k*(.25+.75*m.moist[i]/255)*1.2*sstep((gfbm(wx/S,wy/S,sa,4)-.3)*3)*(1-sstep((m.elev[i]-140)/60));
      if(bank)d=d*1.15+T.bank;Dn[i]=d;if(d>T.wood)K[i]=T_FOREST;else if(d>=T.sparse)F[i]|=16}
    if(g.tick())yield y/H*.8}
  const L=new Int32Array(N),size=yield* genPieces(g,L,i=>K[i]===T_FOREST);
  for(let i=0;i<N;i++)if(L[i]>=0&&size[L[i]]>=T.deepN&&Dn[i]>T.deep)F[i]|=8;
}
/* 5b. springs, ponds and oases (the owner's fifth play-test): small water of its own, lake water (feat lake, basin 0), never in a
   river's way, each listed with its middle tile i, its radius r (tiles: its water and a ring of one tile round it, the art's reeds,
   palms and green ground) and its water tiles: m.ponds [{i, r, kind, tiles}], m.oases [{i, r, big, tiles}]. None within held
   tiles of a classic holding's anchor.
   ponds (kind): hollow (grass and woods), pool (swamp), tarn (the frost, and among hills and peaks: meltwater), each in a pit
   the rivers' filling left (no lake: stage 4's pits, deep and more), at its deepest, by its kind's chance p (x 0.5 + the
   moisture), of 1 to n tiles of the pit, apart tiles (4 ways) from other water and space from another pond, the pits in an
   order by hash; oxbow: on a river's floodplain (a river 2 wide and more within 2 tiles), 2 tiles from its water and never
   beside it (8 ways), in a bend (bend river tiles in the 5 x 5 round it), by the chance p, 2 to n tiles 2-3 from it. None in the
   desert: its water is the oases'.
   spring: every brook's head (no brook running into it: GEN_RIVER.brook) has a source (genSourced: in a wood or the hills, by
   a hill, a peak or lake water, or water running into it; the owner: "small streams ending ... should go into a lake or pond");
   one on open flat land is carried up its main feeder, reach tiles at most, to one that has (their flow raised to the brook's),
   else a spring pond of one tile at its head, or (by other water or a classic anchor) the brook cut back to where another joins
   it or away */
const GEN_POND={deep:1.5,apart:4,space:12,held:8,hollow:{p:.2,n:3},pool:{p:.5,n:4},tarn:{p:.45,n:3},oxbow:{p:.35,n:4,bend:9},spring:{reach:20}};
/* oases (the owner's fifth play-test: "add oases in the desert"): no desert land farther than reach tiles (4 ways; a day's march
   there is some 88) from water (or a classic holding's anchor): while some is, an oasis near the farthest (within near tiles of
   it, apart tiles from other water), and while the desert has fewer than one an every tiles of its land, one at its farthest
   from water all the same; each where springs would rise: low ground (against its mean within 8 tiles) and old dry
   riverbeds (the flow all its rain would gather), scored low + bed x √that flow; its water 1-2 tiles (n), or by the chance big a
   large one's 3 (nBig), compact; r: its water and ring tiles round it (ring: small, big) */
const GEN_OASIS={reach:40,every:4000,near:24,apart:10,bed:.3,n:[1,2],big:.25,nBig:[3,3],ring:[2,4],max:64};
// (a brook (GEN_RIVER.brook): what the art draws, land but peaks with no river on it, its flow a brook's)
const genBrook=(m,i)=>{const t=m.kind[i];return t!==T_WATER&&t!==T_MOUNT&&!(m.river[i]&3)&&(m.flow[i]&31)>=GEN_RIVER.brook};
// (the tile next to i the way k (DIR8), or -1 off the map)
const genStep=(m,i,k)=>{const W=m.w,x=i%W+DIR8[k][0],y=(i-i%W)/W+DIR8[k][1];return x<0||y<0||x>=W||y>=m.h?-1:y*W+x};
// (a brook runs into tile i: a neighbour whose way down is i)
function genFed(m,i){for(let k=0;k<8;k++){const j=genStep(m,i,k);if(j>=0&&genBrook(m,j)&&(m.flow[j]>>5)===(k+4)%8)return true}return false}
// (tile i has a source for a brook rising there: a wood or a hill, beside (8 ways) a hill, a peak or lake water, or water runs into it)
function genSourced(m,i){const K=m.kind;if(K[i]===T_FOREST||K[i]===T_HILL)return true;
  for(let k=0;k<8;k++){const j=genStep(m,i,k);if(j<0)continue;const t=K[j];if(t===T_HILL||t===T_MOUNT||t===T_WATER&&(m.feat[j]&2||(m.flow[j]>>5)===(k+4)%8))return true}
  return false}
// (the brook rising at i cut back, down to where another joins it or away: its flow under the brook's)
function genCutBrook(m,i){const F=m.flow;for(let c=i;c>=0&&genBrook(m,c)&&(c===i||!genFed(m,c));c=genStep(m,c,F[c]>>5))F[c]=F[c]&~31|(GEN_RIVER.brook-1)}
function* genPonds(g){
  const m=g.map,W=m.w,H=m.h,N=W*H,K=m.kind,Fe=m.feat,E=m.elev,F=m.flow,Rv=m.river,Cl=m.clim,T=GEN_POND,O=GEN_OASIS,wk=g.work,R=g.rng('ponds',g.attempt);
  // (a retry starts from the land as stage 5 left it)
  if(!wk.keep6)wk.keep6={flow:F.slice(),elev:E.slice(),high:m.high.slice(),basin:m.basin.slice(),area:m.basins.map(b=>b.area)};
  else{const k=wk.keep6;F.set(k.flow);E.set(k.elev);m.high.set(k.high);m.basin.set(k.basin);m.basins.forEach((b,j)=>{b.area=k.area[j]})}
  m.ponds=[];m.oases=[];
  const AN=g.hints?classicAnchors():[],held=(i,r)=>{const x=i%W,y=(i-x)/W;return AN.some(a=>(a.tx-x)*(a.tx-x)+(a.ty-y)*(a.ty-y)<r*r)};
  const des=i=>Cl[i]===CLIM.desert,n4=i=>{const x=i%W;return[x>0?i-1:-1,x<W-1?i+1:-1,i>=W?i-W:-1,i+W<N?i+W:-1]};
  const wet8=i=>{for(let k=0;k<8;k++){const j=genStep(m,i,k);if(j>=0&&K[j]===T_WATER)return true}return false};
  const spaced=(i,r)=>{const x=i%W,y=(i-x)/W;for(const l of [m.ponds,m.oases])for(const p of l){const u=p.i%W,v=(p.i-u)/W;if((u-x)*(u-x)+(v-y)*(v-y)<r*r)return false}return true};
  // (n tiles grown from c over tiles where ok holds, 4 ways, compact: the one most of whose 8 neighbours it holds first (never a
  // hook where a cluster fits), then the lowest key; a line of 3 or more cut to 2)
  const grow=(c,n,ok,key)=>{const ts=[c],S=new Set(ts),near=j=>{let v=0;for(let k=0;k<8;k++)if(S.has(genStep(m,j,k)))v++;return v};
    while(ts.length<n){let b=-1,bv=0;for(const i of ts)for(const j of n4(i)){if(j<0||S.has(j)||!ok(j))continue;const v=near(j);if(b<0||v>bv||v===bv&&(key(j)<key(b)||key(j)===key(b)&&j<b)){b=j;bv=v}}
      if(b<0)break;ts.push(b);S.add(b)}
    if(ts.length>2){const xs=ts.map(i=>i%W),ys=ts.map(i=>(i-i%W)/W);if(Math.max(...xs)-Math.min(...xs)+1>=ts.length||Math.max(...ys)-Math.min(...ys)+1>=ts.length)ts.length=2}
    return ts};
  // (water laid on tiles ts: lake water just under its lowest shore, no wood, out of its basin; listed in l with its ring)
  const lay=(l,o,ts,ring)=>{const S=new Set(ts),cx=o.i%W,cy=(o.i-cx)/W;let lo=255,r=0;
    for(const i of ts){for(const j of n4(i))if(j>=0&&!S.has(j)&&K[j]!==T_WATER&&E[j]<lo)lo=E[j];const dx=i%W-cx,dy=(i-i%W)/W-cy;r=Math.max(r,Math.sqrt(dx*dx+dy*dy))}
    for(const i of ts){K[i]=T_WATER;Fe[i]=Fe[i]&~(4|8|16)|2;E[i]=Math.max(65,lo-2);m.high[i]=0;const b=m.basin[i];if(b){m.basins[b-1].area--;m.basin[i]=0}}
    l.push({...o,r:Math.ceil(r)+ring,tiles:ts})};
  const Dw=new Uint16Array(N);yield* genDist(g,Dw);
  // the ponds in the pits, at each one's deepest
  {const P=wk.pit,L=new Int32Array(N),size=yield* genPieces(g,L,i=>K[i]!==T_WATER&&!des(i)&&!(Rv[i]&3)&&P[i]>=T.deep),deep=new Int32Array(size.length).fill(-1),sp=genSalt(R);
    for(let i=0;i<N;i++){const p=L[i];if(p>=0&&(deep[p]<0||P[i]>P[deep[p]]))deep[p]=i}
    const order=[...deep.keys()].sort((a,b)=>genHash(sp,deep[a])-genHash(sp,deep[b])||a-b);
    for(const p of order){const c=deep[p],kind=Cl[c]===CLIM.frost||K[c]===T_HILL||K[c]===T_MOUNT?'tarn':Cl[c]===CLIM.swamp?'pool':'hollow',k=T[kind];
      if(genHash(sp+1,c)/4294967296>=k.p*(.5+m.moist[c]/255)||Dw[c]<T.apart||held(c,T.held)||!spaced(c,T.space))continue;
      lay(m.ponds,{i:c,kind},grow(c,1+genHash(sp+2,c)%k.n,j=>L[j]===p&&Dw[j]>=T.apart,j=>-P[j]),1)}}
  if(g.tick())yield .5;
  // the oxbows: in a big river's bends, on its floodplain
  {const sp=genSalt(R),k=T.oxbow,box=(i,f)=>{const x=i%W,y=(i-x)/W;let n=0;for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++){const u=x+a,v=y+b;if(u>=0&&v>=0&&u<W&&v<H&&f(v*W+u))n++}return n};
    const on=i=>K[i]!==T_WATER&&K[i]!==T_MOUNT&&!des(i)&&Fe[i]&1&&Dw[i]>=2&&Dw[i]<=3&&!wet8(i)&&box(i,j=>(Rv[j]&3)>=2)>0,cs=[];
    for(let i=0;i<N;i++)if(on(i)&&Dw[i]===2&&box(i,j=>Rv[j]&3)>=k.bend)cs.push(i);
    cs.sort((a,b)=>genHash(sp,a)-genHash(sp,b)||a-b);
    for(const c of cs){if(genHash(sp+1,c)/4294967296>=k.p||held(c,T.held)||!spaced(c,T.space)||!on(c))continue;
      lay(m.ponds,{i:c,kind:'oxbow'},grow(c,2+genHash(sp+2,c)%(k.n-1),on,j=>genHash(sp+3,j)),1)}}
  // the springs: each brook's head given a source (ponds first: one rising by a pond has it)
  {const B=GEN_RIVER.brook,feeder=c=>{let b=-1;for(let k=0;k<8;k++){const j=genStep(m,c,k);
      if(j>=0&&K[j]!==T_WATER&&K[j]!==T_MOUNT&&!(Rv[j]&3)&&!des(j)&&(F[j]>>5)===(k+4)%8&&(b<0||(F[j]&31)>(F[b]&31)||(F[j]&31)===(F[b]&31)&&j<b))b=j}return b};
    for(let i=0;i<N;i++){if(!genBrook(m,i)||genFed(m,i)||genSourced(m,i))continue;
      const ch=[];let c=i,ok=false;for(let s=0;s<T.spring.reach&&!ok;s++){c=feeder(c);if(c<0)break;ch.push(c);ok=genSourced(m,c)}
      if(ok){for(const j of ch)F[j]=F[j]&~31|B;continue}
      if(Dw[i]>=2&&!wet8(i)&&!held(i,T.held)){lay(m.ponds,{i,kind:'spring'},[i],1);continue}
      genCutBrook(m,i)}}
  if(g.tick())yield .7;
  // the oases: while desert land lies farther than reach from water, one near the farthest
  {const D=new Uint16Array(N),dl=i=>des(i)&&K[i]!==T_WATER&&K[i]!==T_MOUNT,ord=wk.ord,dn=wk.dn,Fo=new Float32Array(N),Mn=new Float32Array(N),so=genSalt(R);
    const A0=new Set(AN.map(a=>a.ty*W+a.tx));yield* genBfs(g,D,i=>K[i]===T_WATER||A0.has(i));
    for(let k=ord.length-1;k>=0;k--){const i=ord[k],d=dn[i];Fo[i]+=K[i]===T_WATER?0:.3+m.moist[i]/255;if(d>=0)Fo[d]+=Fo[i]}
    for(let i=0;i<N;i++)Mn[i]=E[i];genBlur(Mn,W,H,8);
    const sc=i=>Mn[i]-E[i]+O.bed*Math.sqrt(Fo[i]);
    const DL=[];for(let i=0;i<N;i++)if(dl(i))DL.push(i);const want=Math.floor(DL.length/O.every);
    for(let t=0;t<O.max;t++){let f=-1;for(const i of DL)if(K[i]!==T_WATER&&D[i]>O.apart*2&&(f<0||D[i]>D[f]))f=i;if(f<0||D[f]<=O.reach&&t>=want)break;
      const fx=f%W,fy=(f-fx)/W;let c=-1;
      for(let y=Math.max(1,fy-O.near);y<=Math.min(H-2,fy+O.near);y++)for(let x=Math.max(1,fx-O.near);x<=Math.min(W-2,fx+O.near);x++){const i=y*W+x;
        if((x-fx)*(x-fx)+(y-fy)*(y-fy)>O.near*O.near||!dl(i)||D[i]<O.apart||held(i,T.held))continue;if(c<0||sc(i)>sc(c))c=i}
      if(c<0)c=f;
      const big=genHash(so,c)/4294967296<O.big,nr=big?O.nBig:O.n,ts=grow(c,nr[0]+genHash(so+1,c)%(nr[1]-nr[0]+1),j=>dl(j)&&D[j]>=2,j=>E[j]);
      lay(m.oases,{i:c,big},ts,O.ring[big?1:0]);
      // (the distances again from its water)
      const q=ts.slice();for(const i of ts)D[i]=0;for(let a=0;a<q.length;a++){const i=q[a];for(const j of n4(i))if(j>=0&&D[j]>D[i]+1){D[j]=D[i]+1;q.push(j)}}
      if(g.tick())yield .8}}
}
// 6. wild regions: Phase 4's; none yet
function* genRegions(g){g.map.region.fill(0);g.map.regions=[];yield 1}
// 10. a brook whose head lost its source to stages 7-9 (a road or a holding's ground over its wood) cut back (genCutBrook); the way
// graph (router.js buildWayGraph: Phase 2 wave 2's), then the checksum; the result
function* genGraph(g){const m=g.map;for(let i=0;i<m.w*m.h;i++)if(genBrook(m,i)&&!genFed(m,i)&&!genSourced(m,i))genCutBrook(m,i);m.graph=buildWayGraph(g);yield .5;m.sum=m.checksum(g.holdings);g.work=null;
  return{map:m,holdings:g.holdings,camps:g.camps,lords:g.lords,hamlets:[],sacred:[],lair:null,regions:m.regions,rivers:m.rivers,crossings:m.crossings,graph:m.graph,tries:g.tries,relaxed:g.relaxed}}

/* ---------- the quick sketch (§4.3, D28): the world these settings make, roughly, for the New game screen's preview, in tens of
   ms at any size: a WorldMap of GEN_SKETCH.n cells across (k tiles a cell), each cell taken at its middle tile point.
   Real at those points: the land (stage 1's field and stream, genLandField, cut at its share), the climates' temperature and
   moisture noise (stage 3's salts and cuts) and the forests' patches (stage 5's). Approximate: the elevation (the rise from the
   coast, the hill country, highlands and ranges as coarse walks: stage 2's rules, not its draws), the rivers (a coarse drainage,
   as much river as stage 4's share of the land asks), the holdings (each people's liking on the coarse land, worldplace.js
   placeSuit: the capitals apart and balanced, then each realm's in turn, as stage 7). No classic hints: the screen shows the
   classic world itself. Its result: {map (kind, clim, temp, moist, elev, river (its width), feat (2 a lake)), k, holdings ({tx,
   ty} a cell, realm, kind), rivers (how many of 30 tiles or more reach water), land (its share), ms} ---------- */
const GEN_SKETCH={n:256,rangeR:40,river:30};
function genSketch(settings){
  const t0=performance.now(),s=normSettings(settings),n=seedNum(s.seed),W=s.w,H=s.h,k=Math.max(1,W/GEN_SKETCH.n),cw=Math.round(W/k),ch=Math.round(H/k),N=cw*ch;
  const m=new WorldMap(cw,ch,s.seed),K=m.kind,E=m.elev,X=i=>(i%cw+.5)*k,Y=i=>((i-i%cw)/cw+.5)*k,run=it=>{let r;while(!(r=it.next()).done);return r.value};
  const g={s,map:m,tick:()=>false},far=is=>{const D=run(genFar(g,is,255));for(let i=0;i<N;i++)D[i]=Math.min(255,Math.round(D[i]*k));return D};
  m.settings=s;m.seedNum=n;
  // the land: stage 1's field at each cell, cut at its share; water off the rim's a lake
  {const LF=genLandField(s,W,H,genRng(n,'land',0),null),V=new Float32Array(N);for(let i=0;i<N;i++)V[i]=LF.at(X(i),Y(i));
    const cut=V.slice().sort()[Math.min(N-1,Math.floor((1-LF.want)*N))];
    for(let i=0;i<N;i++){const x=i%cw,y=(i-x)/cw;K[i]=!x||!y||x===cw-1||y===ch-1||V[i]<cut?T_WATER:T_OPEN}
    const L=new Int32Array(N);run(genPieces(g,L,i=>K[i]===T_WATER));for(let i=0;i<N;i++)if(L[i]>0)m.feat[i]=2}
  let land=0;for(let i=0;i<N;i++)if(K[i]!==T_WATER)land++;
  // elevation: the rise from the coast and the hill country (stage 2's), highlands and ranges by its rules on the cells
  const D=far(i=>K[i]===T_WATER),T=GEN_ELEV,R=genRng(n,'elev',0),A=W*H/143360,ap=Math.sqrt(A)*Math.sqrt(Math.sqrt(Math.sqrt(A))),mul={flat:.6,normal:1,rugged:1.5}[s.mountains];
  const span=a=>Math.max(1,Math.round((a[0]+R()*(a[1]-a[0]))*ap*mul)),Rg=new Float32Array(N),Ef=new Float32Array(N),sp=[],hl=[],SL=W*.25;
  const s1=genSalt(R),s2=genSalt(R),s3=genSalt(R),s4=genSalt(R),s5=genSalt(R),sn=genSalt(R);
  const at=(x,y)=>Math.min(ch-1,Math.max(0,Math.floor(y/k)))*cw+Math.min(cw-1,Math.max(0,Math.floor(x/k))),near=(x,y,r)=>sp.some(q=>q.some(p=>(p[0]-x)*(p[0]-x)+(p[1]-y)*(p[1]-y)<r*r));
  // (a ridge on the cells within w of (px, py), times st; a pass's notch)
  const ridge=(px,py,w,st)=>{for(let cy=Math.max(0,Math.floor((py-w)/k));cy<=Math.min(ch-1,(py+w)/k);cy++)for(let cx=Math.max(0,Math.floor((px-w)/k));cx<=Math.min(cw-1,(px+w)/k);cx++){
    const i=cy*cw+cx,d=Math.sqrt((X(i)-px)*(X(i)-px)+(Y(i)-py)*(Y(i)-py))/w;if(d<1){const v=(1-d)*(1-d)*st;if(v>Rg[i])Rg[i]=v}}};
  const notch=(px,py,r)=>{for(let cy=Math.max(0,Math.floor((py-r)/k));cy<=Math.min(ch-1,(py+r)/k);cy++)for(let cx=Math.max(0,Math.floor((px-r)/k));cx<=Math.min(cw-1,(px+r)/k);cx++){
    const i=cy*cw+cx,d=Math.sqrt((X(i)-px)*(X(i)-px)+(Y(i)-py)*(Y(i)-py))/r;if(d<1)Rg[i]*=1-T.passDip*sstep(1-d)}};
  for(let t=0,nr=span(T.ranges);sp.length<nr&&t<300;t++){const x0=8+R()*(W-16),y0=8+R()*(H-16),i0=at(x0,y0);if(K[i0]===T_WATER||D[i0]<14||near(x0,y0,GEN_SKETCH.rangeR))continue;
    let ux=R()-.5,uy=R()-.5;{const l=Math.sqrt(ux*ux+uy*uy)||1;ux/=l;uy/=l}const len=T.rangeLen[0]+R()*(T.rangeLen[1]-T.rangeLen[0]);
    const walk=(dx,dy)=>{const o=[];let x=x0,y=y0,c=0;for(let j=0;j<len/3;j++){c=Math.max(-.07,Math.min(.07,c*.9+(R()-.5)*.09));const nx=dx-dy*c,ny=dy+dx*c,l=Math.sqrt(nx*nx+ny*ny);dx=nx/l;dy=ny/l;x+=dx*1.5;y+=dy*1.5;
      if(x<6||y<6||x>=W-6||y>=H-6)break;const i=at(x,y);if(K[i]===T_WATER||D[i]<3||near(x,y,26))break;o.push([x,y])}return o};
    const pts=walk(-ux,-uy).reverse().concat([[x0,y0]],walk(ux,uy));if(pts.length<24)continue;
    const w=T.rangeW[0]+R()*(T.rangeW[1]-T.rangeW[0]),L=(pts.length-1)*1.5,kk=sp.length*7.3;sp.push(pts);
    // (its width wandering along it, as stage 2's; then a pass every passEvery tiles)
    pts.forEach(([px,py],j)=>{const a=j*1.5,st=Math.min(1,a/22,(L-a)/22);if(st>0)ridge(px,py,w*(.75+.5*noise(a/22,kk,sn)),st)});
    for(let a=T.passEvery[0]*.5+R()*16;a<L-10;a+=T.passEvery[0]+R()*(T.passEvery[1]-T.passEvery[0])){const p=pts[Math.min(pts.length-1,Math.round(a/1.5))];notch(p[0],p[1],T.passR*w)}}
  for(let t=0,nh=span(T.highlands);hl.length<nh&&t<300;t++){const x=12+R()*(W-24),y=12+R()*(H-24),i=at(x,y);
    if(K[i]===T_WATER||D[i]<18||hl.some(h=>(h.x-x)*(h.x-x)+(h.y-y)*(h.y-y)<(h.r+60)*(h.r+60)))continue;let ux=R()-.5,uy=R()-.5;const l=Math.sqrt(ux*ux+uy*uy)||1;
    hl.push({x,y,r:T.plateau[0]+R()*(T.plateau[1]-T.plateau[0]),h:T.plateauH[0]+R()*(T.plateauH[1]-T.plateauH[0]),s:genSalt(R),ux:ux/l,uy:uy/l,st:1+R()*.7})}
  // (the land: the rise from the coast, the hill country, the highlands ragged, the ranges rough on top)
  for(let i=0;i<N;i++){if(K[i]===T_WATER){Ef[i]=60;continue}const x=X(i),y=Y(i),d=D[i];
    let e=66+24*sstep(Math.min(d,30)/30)+(gfbm(x/36,y/36,s1,3)-.5)*24*Math.min(1,d/10)+Math.max(0,gfbm(x/SL,y/SL,s5,3)-.35)*90*Math.min(1,d/15);
    e+=(gfbm(x/6,y/6,s3,3)-.5)*72*sstep((gfbm(x/48,y/48,s2,2)-.47)*5)*Math.min(1,d/6);
    for(const h of hl){const v=sstep((1-genReach(x,y,h.x,h.y,h.r,h.s,h.ux,h.uy,h.st))*2.2);if(v)e+=v*h.h*(.55+.9*(gfbm(x/18,y/18,h.s+30,3)-.3))}
    if(Rg[i]>0){Rg[i]*=1-.3*Math.min(1,Math.abs(2*gfbm(x/14,y/14,s4,3)-1)*2.5);e+=T.peak*Rg[i]}Ef[i]=e}
  // kinds: a mountain on a range, a hill by its height or the relief of the cells round it (stage 2's)
  for(let i=0;i<N;i++){if(K[i]===T_WATER){E[i]=60;continue}const x=i%cw,y=(i-x)/cw,e=Ef[i];let hi=e,lo=e;
    for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const nx=x+a,ny=y+b;if(nx<0||ny<0||nx>=cw||ny>=ch)continue;const v=Ef[ny*cw+nx];if(v>hi)hi=v;if(v<lo)lo=v}
    E[i]=Math.max(65,Math.min(255,Math.round(e)));K[i]=e>=T.mount&&Rg[i]>=T.foot||Rg[i]>=T.ridge?T_MOUNT:e>=T.hill||hi-lo>=T.relief?T_HILL:T_OPEN}
  // the climates: stage 3's wind, noise and cuts, on the cells (a wind's gain and loss over k tiles a cell, its blur 6 tiles)
  const C=GEN_CLIMATE,RC=genRng(n,'climate',0),st=genSalt(RC),sm=genSalt(RC),sw=genSalt(RC),sx=genSalt(RC),Tf=new Float32Array(N),Mf=new Float32Array(N);
  const dt={cold:-.08,temperate:0,warm:.08}[s.climate],dm={dry:-.08,normal:0,wet:.08}[s.rivers],S=W*.15,AW=W*.04,br=Math.max(1,Math.round(6/k));
  for(let y=0;y<ch;y++){let h=1;for(let x=0;x<cw;x++){const i=y*cw+x;if(K[i]===T_WATER){h+=(1-h)*Math.min(1,.12*k);Mf[i]=h*.55;continue}
    const up=x?Math.max(0,E[i]-E[i-1]):0;Mf[i]=h*(.5+up/k*.05);h=Math.max(0,h-h*Math.min(1,.0045*k+up*.012))}}
  for(let r=0;r<2;r++)genBlur(Mf,cw,ch,br);
  for(let i=0;i<N;i++){const x=X(i),y=Y(i),wx=x+(gfbm(x/S,y/S,sw,2)-.5)*4*AW,wy=y+(gfbm(x/S,y/S,sx,2)-.5)*4*AW,el=Math.max(0,E[i]-64)/191;
    Tf[i]=.06+.88*wy/(H-1)+(gfbm(wx/S,wy/S,st,3)-.5)*.48-.35*el+dt;Mf[i]+=.22*(1-Math.min(D[i],18)/18)+(gfbm(wx/S,wy/S,sm,3)-.5)*.6+dm}
  {const pass=(want,lo,hi,score,ok)=>{const a=new Float32Array(land);let c=0;for(let i=0;i<N;i++)if(K[i]!==T_WATER&&ok(i))a[c++]=score(i);return genCut(a.subarray(0,c),land,want,lo,hi)};
    const Lw=new Float64Array(N),cell=r=>Math.max(1,Math.round(r/k));for(let i=0;i<N;i++)Lw[i]=1-Math.min(1,Math.max(0,E[i]-64)/50);
    for(let r=0;r<C.blur.n;r++)genBlur(Tf,cw,ch,cell(C.blur.r));for(let r=0;r<C.blur.low[1];r++)genBlur(Lw,cw,ch,cell(C.blur.low[0]));
    const fs=i=>-Tf[i],ds=i=>Tf[i]-C.desert.dry*Mf[i],ss=i=>Mf[i]*(1-C.swamp.low)+Lw[i]*C.swamp.low;
    const cf=pass(-C.frost.at,C.frost.lo,C.frost.hi,fs,()=>true),cd=pass(C.desert.at,C.desert.lo,C.desert.hi,ds,i=>fs(i)<=cf),tw=-cf+C.swamp.warm,cs=pass(C.swamp.at,C.swamp.lo,C.swamp.hi,ss,i=>fs(i)<=cf&&ds(i)<=cd&&Tf[i]>tw);
    for(let i=0;i<N;i++){m.temp[i]=Math.max(0,Math.min(255,Math.round(Tf[i]*255)));m.moist[i]=Math.max(0,Math.min(255,Math.round(Mf[i]*255)));
      m.clim[i]=fs(i)>cf?CLIM.frost:ds(i)>cd?CLIM.desert:Tf[i]>tw&&ss(i)>cs?CLIM.swamp:CLIM.grass}}
  let rivers=0;
  // the rivers: the cells' pits filled from the water, each draining to its lowest neighbour, rain (moisture) gathered down; river
  // where the flow is in the top share of the land stage 4 makes river (one tile wide in a cell of k), wider by its flow
  {const Z=new Float64Array(N);for(let i=0;i<N;i++)Z[i]=Ef[i];const ord=run(genFlood(g,Z,i=>K[i]===T_WATER,0,1)),dn=new Int32Array(N).fill(-1),fl=new Float32Array(N),ln=new Float32Array(N);
    for(let i=0;i<N;i++){if(K[i]===T_WATER)continue;const x=i%cw,y=(i-x)/cw;let lo=Z[i];
      for(const [a,b] of DIR8){const nx=x+a,ny=y+b;if(nx<0||ny<0||nx>=cw||ny>=ch)continue;const j=ny*cw+nx;if(Z[j]<lo){lo=Z[j];dn[i]=j}}}
    for(let i=0;i<N;i++)fl[i]=K[i]===T_WATER?0:.2+Mf[i];
    for(let q=ord.length-1;q>=0;q--){const i=ord[q],j=dn[i];if(j>=0){fl[j]+=fl[i];ln[j]=Math.max(ln[j],ln[i]+k)}}
    const RV=GEN_RIVER,want=Math.max(1,Math.round(land*RV.share*{dry:.6,normal:1,wet:1.5}[s.rivers]/k)),f=[];for(let i=0;i<N;i++)if(K[i]!==T_WATER)f.push(fl[i]);
    f.sort((a,b)=>b-a);const cut=f[Math.min(f.length-1,want)]||Infinity;
    for(let i=0;i<N;i++){if(K[i]===T_WATER||fl[i]<cut)continue;m.river[i]=fl[i]>=cut*RV.river*RV.river?3:fl[i]>=cut*RV.river?2:1;if(dn[i]>=0&&K[dn[i]]===T_WATER&&ln[i]>=GEN_SKETCH.river)rivers++}}
  // the forests: stage 5's patches over the climates and moisture, thinning up high
  {const TF=GEN_FOREST,RF=genRng(n,'forest',0),sa=genSalt(RF),sw5=genSalt(RF),S5=W*.06,AW5=W*.02;
    for(let i=0;i<N;i++){if(K[i]!==T_OPEN||m.river[i])continue;const x=X(i),y=Y(i),wx=x+(gfbm(x/S5,y/S5,sw5,2)-.5)*4*AW5,wy=y+(gfbm(x/S5,y/S5,sw5+5,2)-.5)*4*AW5;
      const d=TF.base[m.clim[i]]*TF.k*(.25+.75*m.moist[i]/255)*1.2*sstep((gfbm(wx/S5,wy/S5,sa,4)-.3)*3)*(1-sstep((E[i]-140)/60));if(d>TF.wood)K[i]=T_FOREST}}
  // the holdings: each people's liking (placeSuit, on distances in tiles); the capitals the best of 200 draws apart and balanced,
  // (nearer while none are, as stage 7), then the realms in turn, a holding each within reach (rc) of its own, spaced and liking
  // room as stage 7 does
  const F={dW:far(i=>K[i]===T_WATER),dR:far(i=>m.river[i]>0),dN:far(i=>m.river[i]>1),dM:far(i=>K[i]===T_MOUNT),dF:far(i=>K[i]===T_FOREST)};
  const RH=genRng(n,'holdings',0),d2=(i,j)=>(X(i)-X(j))*(X(i)-X(j))+(Y(i)-Y(j))*(Y(i)-Y(j)),gap0=PLACE.cap*Math.sqrt(W*W+H*H),P=[];
  const site=i=>{const x=i%cw,y=(i-x)/cw;return x>=2&&y>=2&&x<cw-2&&y<ch-2&&K[i]!==T_WATER&&K[i]!==T_MOUNT},cand={};
  for(const f of PLACE_REALMS){const p=PLACE_PEOPLE[f],L=[];for(let i=0;i<N;i++)if(!(i%2)&&!(((i-i%cw)/cw)%2)&&site(i))L.push([placeSuit(m,F,p,i),i]);L.sort((a,b)=>b[0]-a[0]||a[1]-b[1]);
    const top=cand[f]=[];for(const c of L){if(top.length>=48)break;if(top.every(o=>d2(o[1],c[1])>=576))top.push(c)}}
  const worth=pk=>PLACE_REALMS.reduce((a,f)=>a+pk[f][0],0)-3*Math.max(0,placeSkew(PLACE_REALMS.map(f=>pk[f][1]),d2)-PLACE.skew*.8);
  let best=null,gap=gap0;
  for(;;){for(let t=0;t<200;t++){const ord=PLACE_REALMS.slice(),pick={};let ok=true;for(let q=ord.length-1;q>0;q--){const j=Math.floor(RH()*(q+1));[ord[q],ord[j]]=[ord[j],ord[q]]}
    for(const f of ord){const L=cand[f];let got=null;for(let u=0;u<16&&!got&&L.length;u++){const c=L[Math.floor(RH()*RH()*L.length)];if(Object.values(pick).every(o=>d2(o[1],c[1])>=gap*gap))got=c}if(!got){ok=false;break}pick[f]=got}
    if(ok){const v=worth(pick);if(!best||v>best.v)best={v,pick}}}
    if(best||gap*.9<gap0*PLACE.capMin)break;gap*=.9}
  for(const f of PLACE_REALMS){const c=best?best.pick[f]:cand[f][0];if(c)P.push({f,kind:'city',i:c[1]})}
  const quota=placeQuota(s.holdings),left={},rc=PLACE.reach*Math.max(1,Math.sqrt(land*k*k/s.holdings)/PLACE.space),rk=rc/PLACE.reach;for(const f of PLACE_REALMS)left[f]=placeKinds(f,quota[f]);
  for(let more=true;more;){more=false;
    for(const f of PLACE_REALMS){if(!left[f].length)continue;more=true;const kind=left[f].shift(),own=P.filter(h=>h.f===f);if(!own.length)continue;const p=PLACE_PEOPLE[f];let top=null;
      for(let u=0;u<60;u++){const b=own[Math.floor(RH()*own.length)].i,dx=RH()*(2*rc+1)-rc,dy=RH()*(2*rc+1)-rc,dd=dx*dx+dy*dy;if(dd>rc*rc||dd<144)continue;
        const x=X(b)+dx,y=Y(b)+dy;if(x<0||y<0||x>=W||y>=H)continue;const i=at(x,y);if(!site(i))continue;let nd=Infinity,nk=null,mine=false,bad=false;
        for(const h of P){const e=d2(h.i,i),gp=h.kind==='city'&&kind==='city'?gap:placeGap(h.kind,kind);if(e<gp*gp){bad=true;break}if(e<nd){nd=e;nk=h.kind;mine=h.f===f}}
        if(bad||!mine)continue;const v=placeSuit(m,F,p,i)-PLACE.pull*Math.sqrt(d2(own[0].i,i))/100+PLACE.room[0]*Math.min(1,(Math.sqrt(nd)-placeGap(nk,kind))/(PLACE.room[1]*rk))+RH()*.15;if(!top||v>top.v)top={v,i}}
      if(top)P.push({f,kind,i:top.i})}}
  return{map:m,k,holdings:P.map(h=>({tx:h.i%cw,ty:(h.i-h.i%cw)/cw,realm:h.f,kind:h.kind})),rivers,land:land/N,ms:performance.now()-t0}}
