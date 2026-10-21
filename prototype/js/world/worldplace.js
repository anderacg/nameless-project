'use strict';
/* ---------- the generator's placement, stages 7-9 (doc/WORLD_DESIGN.md §8.8, §8.11, §8.12, §15.2.1): holdings, roads with their
   crossings, bandit camps; worldgen.js runs them (GEN_STAGES) with its stage context g, and their checks (§8.14) are set on its
   rows here (placeCheck). Seeded and isolated as worldgen.js (§8.1): no Math.random, rnd, rint or pick; no Math.hypot, sin, cos,
   exp, pow, log or atan2 (tests/structure.js reads this file's text).
   7. holdings: each people's liking of the land (placeSuit); a capital per realm, the best sites at least 0.3 x the map's diagonal
      apart with their nearest rivals at like distances; each realm grown from its capital by Poisson-disc candidates within 40
      tiles of its own, kinds by rules (castles high and facing rivals, towns on rivers and coasts, villages on fertile land),
      the spacing table (PLACE_GAP); ports on water joined to the sea, stilt villages in the swamp; names from syllables, prices
      and notes from the land; lords past each realm's four (D10: WM.lords). Classic: the 37 holdings whole, at their anchors
      snapped to a suitable tile within 4, one that keeps its hint (CLASSIC_HINTS: placeHint) and its own climate first.
   8. roads: a spanning tree and each holding's two nearest, great roads (between cities, towns and castles) before tracks, each
      by a least-cost search in 8 ways (diagonals x1.4142, no corner cut past water or a peak) over the ground's costs, crossing
      water only straight across: a bridge (3 tiles of water at most), a ford (tracks, streams and rivers short of great, never
      a flooding one) or a ferry (great rivers, at towns and ports). Each road's new stretches are string-pulled and their
      corners rounded (its line, at any angle), then laid on the tiles under that line, 8-connected. Then a river's crossings at
      most 60 tiles apart wherever a crossing can be made, and a town by a bridge its realm's bridge town. Classic: Stonebridge's
      bridge over the great river laid first.
   9. camps: density()'s camps, Poisson-disc in the fringe: 6-16 tiles from the roads, 14 from the holdings, reachable.
   Crossings: i, j the land tiles at each end, tiles the water between (a ferry's stays water). Roads: path the tiles a to b,
   line its own stretches as polylines [[x, y, x, y...]...] in tiles (a tile's centre at +.5; a holding's end at its gate,
   (tx, ty + 1)); a stretch it shares with an earlier road is that road's, and where it leaves or joins one it ends on its line */
/* the classic holdings' anchors (§8.15 step 1), in CLASSIC_PLACES' order, on the classic seed's Normal map (448 x 320): each
   realm's centroid doubled, each holding's offset from it x1.4; Ashford (36, 40) comes to (83, 85), Karn Hold (172, 44) to
   (338, 78). Stage 7 puts each on a suitable tile near its anchor */
function classicAnchors(){
  const C={};for(const p of CLASSIC_PLACES){const c=C[p.realm]||(C[p.realm]={x:0,y:0,n:0});c.x+=p.tx;c.y+=p.ty;c.n++}
  return CLASSIC_PLACES.map(p=>{const c=C[p.realm],cx=c.x/c.n,cy=c.y/c.n;return{name:p.name,tx:Math.round(cx*2+(p.tx-cx)*1.4),ty:Math.round(cy*2+(p.ty-cy)*1.4)}})}
// (the tile nearest (x, y), ring by ring (the larger of dx, dy) up to r, where ok(tx, ty) holds: [tx, ty], or null)
function genNear(m,x,y,r,ok){for(let d=0;d<=r;d++)for(let k=-d;k<=d;k++)for(const [tx,ty] of [[x+k,y-d],[x+k,y+d],[x-d,y+k],[x+d,y+k]])if(m.has(tx,ty)&&ok(tx,ty))return [tx,ty];return null}
// (tiles by their distance (4 ways, up to cap) from those where is(i) holds: a Uint8Array)
function* genFar(g,is,cap){
  const m=g.map,W=m.w,N=W*m.h,D=new Uint8Array(N).fill(cap=cap||255),q=new Int32Array(N);let a=0,b=0;
  for(let i=0;i<N;i++)if(is(i)){D[i]=0;q[b++]=i}
  while(a<b){const i=q[a++],d=D[i]+1,x=i%W;if(d>=cap)continue;
    if(x>0&&D[i-1]>d){D[i-1]=d;q[b++]=i-1}if(x<W-1&&D[i+1]>d){D[i+1]=d;q[b++]=i+1}if(i>=W&&D[i-W]>d){D[i-W]=d;q[b++]=i-W}if(i+W<N&&D[i+W]>d){D[i+W]=d;q[b++]=i+W}
    if((a&8191)===0&&g.tick())yield}
  return D}

// ---- the rules' tables
// each realm's people (its liking of the land, its names); the League takes its sites' by the water
const PLACE_PEOPLE={vale:'human',karn:'dwarf',sylvan:'elf',horde:'orc',salt:'league'};
// each realm's share of the holdings (37 at Normal: 8/7/7/7/8), and its kinds in today's mix (from CLASSIC_PLACES)
const PLACE_SHARE={vale:8,karn:7,sylvan:7,horde:7,salt:8};
const PLACE_REALMS=Object.keys(PLACE_SHARE);
// the least distance (tiles) between two kinds (§8.8; capitals: PLACE.cap x the map's diagonal)
const PLACE_GAP={city:{town:30,castle:30,village:24},town:{town:26,castle:24,village:20},castle:{castle:24,village:18},village:{village:16}};
const placeGap=(a,b)=>PLACE_GAP[a]&&PLACE_GAP[a][b]||PLACE_GAP[b]&&PLACE_GAP[b][a]||0;
/* the numbers: reach (a new holding within this of its realm's own), cap (capitals apart, x the diagonal), skew (capitals' nearest
   rivals within this share of their mean), suit (a capital's least liking), day (tiles: a day's travel, for a fair start), land
   (a realm's suitable tiles within landR of its capital, at Normal: x1.5 at Large, x2.4 at Huge), lords ([holdings, lords a
   realm] points, D10), bridge, ford, ferry (the most water each spans), gap (a river's crossings at most this far apart), spread
   (each realm's land within this share of their mean: placeRealmLand) */
const PLACE={reach:40,cap:.3,skew:.25,suit:.6,day:60,land:2000,landR:90,lords:[[37,4],[55,6],[90,9],[200,18]],bridge:3,ford:3,ferry:12,gap:60,spread:.3};
// the land a realm's holdings will claim, reckoned as territory.js does at the start (placeRealmLand): its travel cost by tile kind
// (its LAND_COST, which loads after the generator runs; 0 closed) and a holding's first growth past its kind's reach (its GROW0)
const PLACE_CLAIM={cost:[1,1.7,1.5,0,.8,4,1.5],grow:4};
// names: starts and ends per people (§8.8), unique in a world; lords' titles and names
const PLACE_SYL={
  human:[['Ash','Brook','Mill','Oak','Thorn','Ward','Cold','High','Bram','Ald'],['ford','wick','hollow','brook','hurst','march','moor','ley','stead']],
  dwarf:[['Karn','Dun','Iron','Coal','Granite','Deep','Grim','Thra'],['hold','rak','vein','forge','gate','delve','heim']],
  elf:[['Elder','Silver','Willow','Moss','Moon','Fern','Lin','Ael'],['glen','bough','mere','dell','well','down']],
  orc:[['Grey','Sun','Skull','Bone','Dust','Red','Scorch','Gor'],['well','reach','rock','pit','fang','spire','maw']]};
const LORD_SYL={
  human:[['Lord','Lady','Ser'],['Al','Bran','Cor','Ed','Gar','Hal','Mar','Ro','Wil','Ber','Os','Tam'],['dric','wen','win','mund','ric','ena','ard','old','ys']],
  dwarf:[['Thane'],['Bor','Hro','Da','Gim','Thra','Dur','Ba','Gro','Nor','Kil'],['ka','th','in','ra','li','nar','gun','dri','vi']],
  elf:[['Lady','Lord','Warden'],['Ith','Cae','Sy','Fae','Ela','Ae','Lin','Thal','Ny','Ere'],['riel','lan','las','lar','wen','dor','ion','nis']],
  orc:[['Warchief','Chief'],['Ul','Gash','Mok','Gru','Raz','Dur','Gor','Sna','Ur','Bol'],['gra','kk','ka','zug','bash','nak','rok','ga']],
  league:[['Admiral','Captain'],['Al','Bran','Cass','Ed','Ivo','Mar','Ner','Ro','Sel','Tam'],['ric','wen','a','ard','o','ys','elle','an']]};
// prices: each people's (as today's holdings'), moved by the land (placeMod)
const PLACE_MOD={human:{grain:.8,iron:1.35,cloth:1.1,timber:1,furs:1.3,spice:1.4},dwarf:{grain:1.3,iron:.75,cloth:1.3,timber:1.2,furs:.8,spice:1.5},
  elf:{grain:.95,iron:1.4,cloth:.85,timber:.65,furs:1.35,spice:1.25},orc:{grain:1.05,iron:1.3,cloth:1.4,timber:1.5,furs:1.2,spice:.65}};
const PLACE_WORD={human:'human',dwarf:'dwarven',elf:'elven',orc:'orc',league:'League'};

/* the fields stages 7-9 read (once a world; g.work.place): distances (tiles, 4 ways, to 255) to sea or lake water (dW), rivers
   (dR), navigable rivers (dN), peaks (dM) and forest (dF); each river tile's river (rv, -1 elsewhere) and its place along that
   river's path (rp); bodies of water (wl, 4 ways; sea: the largest at the map's rim); the land a road can join (conn: walkable
   land, rivers, and water a bridge spans; main its largest piece) */
function* placeFields(g){
  const m=g.map,W=m.w,H=m.h,N=W*H,K=m.kind,Rv=m.river,F={};
  F.dW=yield* genFar(g,i=>K[i]===T_WATER&&!(Rv[i]&3));F.dR=yield* genFar(g,i=>(Rv[i]&3)>0);F.dN=yield* genFar(g,i=>(Rv[i]&4)>0);
  F.dM=yield* genFar(g,i=>K[i]===T_MOUNT);F.dF=yield* genFar(g,i=>K[i]===T_FOREST);
  const rv=F.rv=new Int16Array(N).fill(-1),rp=F.rp=new Int32Array(N),q=[];
  for(const r of m.rivers)r.path.forEach((i,k)=>{if(rv[i]<0){rv[i]=r.id;rp[i]=k;q.push(i)}});
  for(let a=0;a<q.length;a++){const i=q[a],x=i%W,y=(i-x)/W;for(const [dx,dy] of DIR8){const nx=x+dx,ny=y+dy,j=ny*W+nx;if(m.has(nx,ny)&&rv[j]<0&&(Rv[j]&3)){rv[j]=rv[i];rp[j]=rp[i];q.push(j)}}}
  F.wl=new Int32Array(N);const ws=yield* genPieces(g,F.wl,i=>K[i]===T_WATER);F.sea=-1;
  for(let i=0;i<N;i++){const x=i%W,y=(i-x)/W;if((x===0||y===0||x===W-1||y===H-1)&&F.wl[i]>=0&&(F.sea<0||ws[F.wl[i]]>ws[F.sea]))F.sea=F.wl[i]}
  const run=F.run=placeRuns(m);F.conn=new Int32Array(N);
  const cs=yield* genPieces(g,F.conn,i=>K[i]!==T_MOUNT&&(K[i]!==T_WATER||(Rv[i]&3)>0||run[i]<=PLACE.bridge));
  F.main=cs.indexOf(Math.max(...cs));return F}
// (each water tile's span: the shorter of its straight runs of water, across and down, to 255)
function placeRuns(m){const W=m.w,H=m.h,K=m.kind,S=new Uint8Array(W*H).fill(255);
  for(let y=0;y<H;y++)for(let x=0;x<W;){if(K[y*W+x]!==T_WATER){x++;continue}let e=x;while(e<W&&K[y*W+e]===T_WATER)e++;for(let k=x;k<e;k++)S[y*W+k]=Math.min(255,e-x);x=e}
  for(let x=0;x<W;x++)for(let y=0;y<H;){if(K[y*W+x]!==T_WATER){y++;continue}let e=y;while(e<H&&K[e*W+x]===T_WATER)e++;for(let k=y;k<e;k++)S[k*W+x]=Math.min(S[k*W+x],e-y);y=e}
  return S}
// how much a people likes tile i (about 0-1; §8.8's likes and avoids); the League by coasts, lake shores and navigable rivers
function placeSuit(m,F,p,i){
  const c=m.clim[i],k=m.kind[i],f=m.feat[i],GR=CLIM.grass,FR=CLIM.frost,DE=CLIM.desert,SW=CLIM.swamp,dR=F.dR[i],dW=F.dW[i],dM=F.dM[i],dF=F.dF[i];
  if(p==='human')return(c===GR?.45:c===FR?.1:c===SW?.05:0)+(k===T_OPEN?.2:k===T_HILL?.05:0)+(dR<=3?.25:dR<=8?.1:0)+(f&1?.1:0)-(f&8?.3:0)-(dM<6?.3:0);
  if(p==='dwarf')return(dM<=4?.4:dM<=10?.2:0)+(k===T_HILL?.2:0)+(c===FR?.25:c===GR?(m.temp[i]<110?.2:.05):-.4)+(dR<=3&&dM<=10?.1:0);
  if(p==='elf')return(dF<=2&&!(f&8)?.35:dF<=5?.15:0)+(c===GR?.3:c===SW?.05:-.5)+(dR<=3&&dF<=4?.15:0)+(k===T_OPEN?.1:0);
  if(p==='orc')return(c===DE?.45:c===SW?.3:c===GR&&m.temp[i]>150?.15:c===FR?-.6:0)+(dW<=6||dR<=4?.3:0)+(k===T_OPEN?.1:0);
  return(dW<=2?.5:0)+(F.dN[i]<=2?.4:0)+(dR<=3&&dW<=4?.2:0)-(dW>6&&F.dN[i]>4?.4:0)+(c===GR||c===SW?.1:0)}
// (the body of water a port at tile i sails from: water within 2 joined to the sea, or a navigable river; else -1)
function placePort(m,F,i){const W=m.w,x=i%W,y=(i-x)/W;let r=-1;
  for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++){const j=(y+b)*W+x+a;if(m.has(x+a,y+b)&&m.kind[j]===T_WATER&&(F.wl[j]===F.sea||(m.river[j]&4))&&r<0)r=F.wl[j]}return r}
// (the tiles reached from tile s over walkable ground, 4 ways, and over ferries; shut: fords on flooding rivers closed)
function placeReach(m,s,shut){
  const W=m.w,H=m.h,N=W*H,K=m.kind,Rd=new Uint8Array(N),q=new Int32Array(N),fx=new Map();let a=0,b=0;
  for(const c of m.crossings)if(c.kind==='ferry'){fx.set(c.i,c.j);fx.set(c.j,c.i)}
  const go=j=>{if(!Rd[j]&&passable(K[j])&&!(shut&&K[j]===T_FORD&&(m.river[j]&32))){Rd[j]=1;q[b++]=j}};go(s);
  while(a<b){const i=q[a++],x=i%W;if(x>0)go(i-1);if(x<W-1)go(i+1);if(i>=W)go(i-W);if(i+W<N)go(i+W);if(fx.has(i))go(fx.get(i))}
  return Rd}
/* (the classic hints (CLASSIC_HINTS) a holding's tile keeps, by its name: tile i => true where it does. A League port (sea): water
   of the sea within 2. The river's town (river, bridge): a bridge's span of the great river within 3 (placeNarrows). The island's
   village (island): land ringed by water, off the main land (rivers count as land, the sea and lakes not)) */
function* placeHint(g,F){const m=g.map,W=m.w,o={};
  for(const h of g.hints||[]){
    if(h.kind==='sea')for(const p of h.ports)o[p]=i=>placeShore(m,i,j=>F.wl[j]===F.sea)>=0;
    if(h.kind==='river'&&h.bridge)o[h.at]=i=>!!placeNarrows(m,F,i%W,(i-i%W)/W,3);
    if(h.kind==='island'){const L=new Int32Array(W*m.h),s=yield* genPieces(g,L,i=>m.kind[i]!==T_WATER||(m.river[i]&3)>0),main=s.indexOf(Math.max(...s));o[h.at]=i=>L[i]!==main}}
  return o}
// (the great river's narrowest span by (x, y): a straight run across or down of PLACE.bridge water tiles at most, one of them a great
// river's, from walkable joined land to such land (no end a notch), an end within r of (x, y) (the larger of dx, dy): {i, j, tiles}
// (i the end by (x, y)), the shortest, then the nearest; or null)
function placeNarrows(m,F,x,y,r){
  const W=m.w,K=m.kind,ok=i=>passable(K[i])&&K[i]!==T_FORD&&F.conn[i]===F.main;let best=null;
  for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++){const ex=x+a,ey=y+b,i=ey*W+ex;if(!m.has(ex,ey)||!ok(i))continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const s=dx+dy*W;let k=0;while(k<=PLACE.bridge&&m.has(ex+dx*(k+1),ey+dy*(k+1))&&K[i+s*(k+1)]===T_WATER)k++;
      const j=i+s*(k+1);if(!k||k>PLACE.bridge||!m.has(ex+dx*(k+1),ey+dy*(k+1))||!ok(j)||placeNotch(m,i,s)||placeNotch(m,j,s))continue;
      const tiles=[];for(let q=1;q<=k;q++)tiles.push(i+s*q);const v=k*100+Math.max(Math.abs(a),Math.abs(b));
      if(tiles.some(q=>(m.river[q]&3)===3)&&(!best||v<best.v))best={v,i,j,tiles}}}
  return best}

/* 7. holdings (above). The fields once (g.work.place); each try its own stream; D41's high ground under the cleared ground put back
   before each try (the driver puts back kind and feat) */
function* genHoldings(g){
  const m=g.map,W=m.w,H=m.h,K=m.kind,R=g.rng('holdings',g.attempt),out=g.holdings=[];g.lords=null;
  if(g.work.high7)m.high.set(g.work.high7);else g.work.high7=m.high.slice();
  const F=g.work.place||(g.work.place=yield* placeFields(g));yield .3;
  const xy=i=>[i%W,(i-i%W)/W],d2=(i,j)=>{const [a,b]=xy(i),[c,d]=xy(j);return(a-c)*(a-c)+(b-d)*(b-d)};
  const site=i=>{const [x,y]=xy(i);if(x<4||y<4||x>=W-5||y>=H-5||F.conn[i]!==F.main)return false;
    for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const k=K[i+a+b*W];if(k===T_WATER||k===T_MOUNT||k===T_FORD)return false}return true};
  const P=[];
  if(m.classic){
    // classic: the 37 whole, each on a free tile within 4 of its anchor (else the nearest within 40), 4 tiles from the others; of
    // those within 4, one that keeps its hint (placeHint) first, then one in its own climate, then the nearest
    const A=classicAnchors(),sx=W/448,sy=H/320,free=(tx,ty)=>site(ty*W+tx)&&out.every(h=>(h.tx-tx)*(h.tx-tx)+(h.ty-ty)*(h.ty-ty)>=16),hint=yield* placeHint(g,F);
    CLASSIC_PLACES.forEach((p,k)=>{const x=Math.round(A[k].tx*sx),y=Math.round(A[k].ty*sy),want=hint[p.name],top=want?3:1,d=JSON.parse(JSON.stringify(p));let at=null,v=-1;
      genNear(m,x,y,4,(tx,ty)=>{if(!free(tx,ty))return false;const i=ty*W+tx,s=(want&&want(i)?2:0)+(CLIMS[m.clim[i]]===p.clim?1:0);if(s>v){v=s;at=[tx,ty]}return s===top});
      at=at||genNear(m,x,y,40,free)||[x,y];d.tx=at[0];d.ty=at[1];out.push(d)})}
  else{
    const diag=Math.sqrt(W*W+H*H),gap=PLACE.cap*diag,cand=g.work.cands||{},N=g.s.holdings-(g.work.fewer|0)*PLACE_REALMS.length,quota=placeQuota(N);
    // the capitals: each people's best sites (every 5th tile, 24 apart), valued by their liking (less short of PLACE.suit) and the
    // suitable land round them (once a world: g.work.cands); then the best of 400 draws that keep them apart and their nearest
    // rivals alike
    const need=placeNeed(m);
    if(!g.work.cands)for(const f of PLACE_REALMS){const p=PLACE_PEOPLE[f],L=[];for(let y=4;y<H-4;y+=5)for(let x=4;x<W-4;x+=5){const i=y*W+x;if(site(i))L.push([placeSuit(m,F,p,i),i])}
      L.sort((a,b)=>b[0]-a[0]||a[1]-b[1]);const top=cand[f]=[];for(const c of L){if(top.length>=64)break;if(top.every(o=>d2(o[1],c[1])>=576))top.push(c)}
      for(const c of top){const [x,y]=xy(c[1]);const n=placeLand(m,F,p,x,y);c[2]=Math.min(1,c[0])-(c[0]<PLACE.suit?.6:0)-(n<need?.4:0)+.3*Math.min(1,n/need)}top.sort((a,b)=>b[2]-a[2]||a[1]-b[1]);
      if(g.tick())yield .3+.1*PLACE_REALMS.indexOf(f)/PLACE_REALMS.length}
    g.work.cands=cand;
    const worth=ch=>{for(const f of PLACE_REALMS)for(const e of PLACE_REALMS)if(f<e&&d2(ch[f][1],ch[e][1])<gap*gap)return -Infinity;
      return PLACE_REALMS.reduce((a,f)=>a+ch[f][2],0)-3*Math.max(0,placeSkew(PLACE_REALMS.map(f=>ch[f][1]),d2)-PLACE.skew*.8)};
    let best=null;
    for(let s=0;s<400;s++){const ord=PLACE_REALMS.slice(),ch={};let ok=true;for(let k=ord.length-1;k>0;k--){const j=Math.floor(R()*(k+1));[ord[k],ord[j]]=[ord[j],ord[k]]}
      for(const f of ord){const C=cand[f];let got=null;for(let t=0;t<16&&!got&&C.length;t++){const c=C[Math.floor(R()*R()*C.length)];if(Object.values(ch).every(o=>d2(o[1],c[1])>=gap*gap))got=c}
        if(!got){ok=false;break}ch[f]=got}
      if(ok){const v=worth(ch);if(!best||v>best.v)best={v,ch}}}
    // then each realm's capital moved to whichever of its sites does better, while one does
    for(let more=!!best;more;){more=false;for(const f of PLACE_REALMS)for(const c of cand[f]){const ch={...best.ch,[f]:c},v=worth(ch);if(v>best.v+1e-9){best={v,ch};more=true}}}
    for(const f of PLACE_REALMS){const c=best?best.ch[f]:cand[f][0];if(c)P.push({f,kind:'city',i:c[1]})}
    yield .5;
    // the realms grow in turn, a holding each, its kind by the realm's mix: the best of 40 candidates (then 80 more) within reach
    // of its own, clear of every holding by the spacing table and nearer its own than any other realm's (the first three within a
    // day of the capital); the best liked, for its kind, near its capital and with room round it
    const left={};for(const f of PLACE_REALMS)left[f]=placeKinds(f,quota[f]);
    for(let more=true;more;){more=false;
      for(const f of PLACE_REALMS){if(!left[f].length)continue;more=true;const kind=left[f].shift(),own=P.filter(h=>h.f===f);if(!own.length)continue;
        const p=PLACE_PEOPLE[f],cap=own[0].i;let top=null;
        for(let t=0;t<120&&!(top&&t>=40);t++){const b=own[Math.floor(R()*own.length)].i,dx=Math.floor(R()*81)-40,dy=Math.floor(R()*81)-40,dd=dx*dx+dy*dy;
          if(dd>PLACE.reach*PLACE.reach||dd<144)continue;const [bx,by]=xy(b);if(!m.has(bx+dx,by+dy))continue;const i=b+dx+dy*W;if(!site(i))continue;
          let near=null,nd=Infinity,rival=Infinity;
          for(const h of P){const e=d2(h.i,i),gp=h.kind==='city'&&kind==='city'?gap:placeGap(h.kind,kind);if(e<gp*gp){near=null;nd=-1;break}if(e<nd){nd=e;near=h}if(h.f!==f&&e<rival)rival=e}
          if(!near||near.f!==f||own.length<4&&d2(cap,i)>(PLACE.day-5)*(PLACE.day-5))continue;
          const v=placeSuit(m,F,p,i)+placeKindScore(m,F,kind,i,Math.sqrt(rival),own.length)-.2*Math.sqrt(d2(cap,i))/100+.1*Math.min(1,(Math.sqrt(nd)-placeGap(near.kind,kind))/12)+R()*.15;if(!top||v>top.v)top={v,i}}
        if(top)P.push({f,kind,i:top.i})}
      if(g.tick())yield .5+.4*P.length/N}
    // their data: realm, races, style, name, prices and note
    const used=new Set(),ports={};
    for(const h of P){const [tx,ty]=xy(h.i),pp=PLACE_PEOPLE[h.f],c=CLIMS[m.clim[h.i]],water=placePort(m,F,h.i)>=0&&(F.dW[h.i]<=2||F.dN[h.i]<=2);
      const races=pp!=='league'?[pp]:F.dF[h.i]<=3?['elf','human']:c==='swamp'||c==='desert'?['human','orc']:F.dM[h.i]<=8?['human','dwarf']:R()<.5?['human','elf']:['elf','orc'];
      const d={name:placeName(R,races[0],used),realm:h.f,races,kind:h.kind,clim:c,tx,ty,seed:out.length+1};
      if(water&&(pp==='league'||h.kind!=='castle'&&h.kind!=='city'&&!ports[h.f]&&F.dW[h.i]<=2)){d.style='port';ports[h.f]=1}
      else if(h.kind==='village'&&c==='swamp')d.style='stilt';
      if(h.kind!=='castle')d.mod=placeMod(m,F,d,h.i,R);d.note=placeNote(m,F,d,h.i);
      out.push(Object.assign({name:d.name,realm:d.realm},d.style?{style:d.style}:{},d))}
    g.lords=placeLords(R,Math.round(areaTable(PLACE.lords,N)))}
  // the ground under each holding opened (forest and hills within 2 tiles)
  for(const h of out)for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++){const tx=h.tx+a,ty=h.ty+b,i=ty*W+tx;if(a*a+b*b<=6&&m.has(tx,ty)&&(K[i]===T_FOREST||K[i]===T_HILL||!a&&!b)){K[i]=T_OPEN;m.high[i]=0}}
  yield 1}
// (holdings per realm for N in all: PLACE_SHARE's ratio, the remainders largest first)
function placeQuota(N){const T=PLACE_REALMS.reduce((a,f)=>a+PLACE_SHARE[f],0),o={},rem=[];let n=0;
  for(const f of PLACE_REALMS){o[f]=Math.floor(N*PLACE_SHARE[f]/T);n+=o[f];rem.push([N*PLACE_SHARE[f]/T-o[f],f])}
  rem.sort((a,b)=>b[0]-a[0]||PLACE_REALMS.indexOf(a[1])-PLACE_REALMS.indexOf(b[1]));for(let k=0;n<N;k++,n++)o[rem[k][1]]++;return o}
// (a realm's kinds past its capital, by today's mix of its holdings (CLASSIC_PLACES), interleaved: the scarcest share first)
function placeKinds(f,n){
  const out=[],C=CLASSIC_PLACES.filter(p=>p.realm===f&&p.kind!=='city'),ks=['town','castle','village'],want={},rem=[];let t=0;
  for(const k of ks){const v=(n-1)*C.filter(p=>p.kind===k).length/C.length;want[k]=Math.floor(v);t+=want[k];rem.push([v-want[k],k])}
  rem.sort((a,b)=>b[0]-a[0]||ks.indexOf(a[1])-ks.indexOf(b[1]));for(let k=0;t<n-1;k++,t++)want[rem[k%3][1]]++;
  const had={town:0,castle:0,village:0};for(let k=0;k<n-1;k++){const nx=ks.filter(q=>had[q]<want[q]).sort((a,b)=>had[a]/want[a]-had[b]/want[b]||ks.indexOf(a)-ks.indexOf(b))[0];had[nx]++;out.push(nx)}
  return out}
// (a people's suitable tiles (walkable, liked .4 or more; the League's any not frost or desert) within PLACE.landR of (x, y),
// every 3rd tile counted for 9; how many a capital needs: PLACE.land at Normal's area, x1.5 at Large's, x2.4 at Huge's)
function placeLand(m,F,p,x0,y0){const W=m.w,r=PLACE.landR,lo=p==='league'?-.35:.4;let n=0;
  for(let y=y0-r;y<=y0+r;y+=3)for(let x=x0-r;x<=x0+r;x+=3){const i=y*W+x;if(m.has(x,y)&&(x-x0)*(x-x0)+(y-y0)*(y-y0)<=r*r&&passable(m.kind[i])&&placeSuit(m,F,p,i)>=lo)n+=9}return n}
const placeNeed=m=>PLACE.land*areaTable([[143360,1],[286720,1.5],[786432,2.4]],m.w*m.h);
// (each realm's land at the start (PLACE_REALMS' order), as territory.js reckons it: from each holding in turn, its reach spreading 8
// ways over the land's travel costs (PLACE_CLAIM), each tile to the holding with the least share of its reach used getting there)
function placeRealmLand(m,Hd){
  const W=m.w,H=m.h,N=W*H,K=m.kind,C=PLACE_CLAIM.cost,best=new Float32Array(N).fill(2),own=new Int8Array(N).fill(-1),D=new Float32Array(N).fill(1e9),q=genHeap(N);
  Hd.forEach(h=>{const lim=HOLDING_TYPES[h.kind].reach+PLACE_CLAIM.grow,s0=h.ty*W+h.tx,used=[s0],f=PLACE_REALMS.indexOf(h.realm);D[s0]=0;q.push(0,s0);
    while(q.size()){const i=q.pop(),c=D[i],x=i%W,y=(i-x)/W;if(c/lim<best[i]){best[i]=c/lim;own[i]=f}
      for(const [dx,dy] of DIR8){const nx=x+dx,ny=y+dy,j=ny*W+nx;if(!m.has(nx,ny)||!C[K[j]])continue;const nc=c+C[K[j]]*(dx&&dy?1.41:1);
        if(nc<=lim&&nc<D[j]&&nc/lim<best[j]){if(D[j]===1e9)used.push(j);D[j]=nc;q.push(nc,j)}}}
    for(const i of used)D[i]=1e9});
  const n=PLACE_REALMS.map(()=>0);for(let i=0;i<N;i++)if(own[i]>=0)n[own[i]]++;return n}
// (how far the capitals' nearest rivals stray from their mean: the largest share)
function placeSkew(cs,d2){const ds=cs.map(a=>Math.sqrt(Math.min(...cs.filter(b=>b!==a).map(b=>d2(a,b))))),mean=ds.reduce((a,b)=>a+b,0)/ds.length;return Math.max(...ds.map(d=>Math.abs(d-mean)/mean))}
// (a kind's liking of tile i: castles high and facing rivals (rival: tiles to the nearest), towns on rivers and coasts and among
// their realm's, villages on fertile land and rivers)
function placeKindScore(m,F,kind,i,rival,own){
  const border=clamp(1-(rival-30)/60,0,1),dR=F.dR[i];
  if(kind==='castle')return .35*clamp((m.elev[i]-90)/80,0,1)+.3*border+(dR<=2&&border>.5?.15:0);
  if(kind==='town')return(dR<=2?.3:0)+(F.dW[i]<=2?.2:0)+.05*Math.min(3,own);
  return(m.kind[i]===T_OPEN&&m.moist[i]>70&&m.clim[i]!==CLIM.desert?.2:0)+(dR<=3?.2:0)}
// (a name from a people's syllables, not yet in used; past them, Upper, Lower... before one)
function placeName(R,p,used){const [A,B]=PLACE_SYL[p]||PLACE_SYL.human;
  for(let t=0;t<400;t++){const a=A[Math.floor(R()*A.length)],b=B[Math.floor(R()*B.length)],n=(t<200?'':['Upper ','Lower ','Old ','New ','Little '][t%5])+a+b;
    if(a.toLowerCase()!==b&&!used.has(n)){used.add(n);return n}}
  const n=A[0]+B[0]+' '+used.size;used.add(n);return n}
// (a holding's prices: its people's, moved by its climate, woods, rivers (mills), peaks and port; towns and cities nearer fair)
function placeMod(m,F,d,i,R){const o={},c=d.clim;
  for(const k of ['grain','iron','cloth','timber','furs','spice']){let v=d.races.reduce((a,r)=>a+PLACE_MOD[r][k],0)/d.races.length;
    if(c==='frost')v+={furs:-.25,grain:.15}[k]||0;if(c==='desert')v+={spice:-.15,timber:.15,grain:.05}[k]||0;if(c==='swamp')v+={timber:-.1,grain:.05}[k]||0;
    if(F.dF[i]<=3&&k==='timber')v-=.15;if(F.dR[i]<=2&&k==='grain')v-=.1;if(F.dM[i]<=8&&k==='iron')v-=.15;if(d.style==='port')v+={cloth:-.1,spice:-.15}[k]||0;
    if(d.kind!=='village')v=1+(v-1)*.6;o[k]=clamp(Math.round((v+(R()-.5)*.1)*20)/20,.55,1.6)}
  return o}
// (its note: what and whose it is, where, and what is cheap)
function placeNote(m,F,d,i){
  const p=d.realm==='salt'?'league':d.races[0],w=PLACE_WORD[p],rv=F.dR[i]<=2?m.rivers[placeRiver(m,F,i)]:null,
    where=rv?'on the '+rv.name:F.dW[i]<=2?(m.feat[i]&2||F.wl[placeShore(m,i)]!==F.sea?'on a lake shore':'by the sea'):F.dM[i]<=5?'below the peaks':m.elev[i]>=150?'in the hills':
      d.clim==='desert'?'in the dunes':d.clim==='swamp'?'in the fens':d.clim==='frost'?'in the snow':F.dF[i]<=1?'in the woods':'on open grassland',
    cheap=d.mod?Object.keys(d.mod).filter(k=>d.mod[k]<=.85).sort((a,b)=>d.mod[a]-d.mod[b]).slice(0,2).map(k=>GOODS[k].n):[],
    list=cheap.length?cheap[0]+(cheap[1]?' and '+cheap[1].toLowerCase():'')+(cheap.length>1?' are':' is')+' cheap here.':'Fair prices on everything.';
  if(d.kind==='castle')return 'A'+(/^[aeiou]/i.test(w)?'n ':' ')+w+' keep '+where+'. Hires '+(p==='orc'?'wolf riders':'mounted troops')+'.';
  if(d.kind==='city')return 'The '+w+' capital '+where+'. '+list;
  if(d.kind==='town')return 'A'+(/^[aeiou]/i.test(w)?'n ':' ')+w+' market town '+where+'. '+list;
  const trade=d.style==='port'||d.style==='stilt'?'fishing':F.dM[i]<=6?'mining':F.dF[i]<=2?'woodcutters’':'farming';
  return 'A'+(/^[aeiou]/i.test(w)?'n ':' ')+w+' '+trade+' village '+where+'. '+(cheap.length?cheap.join(', ')+' and recruits.':'Recruits and fair prices.')}
// (the river nearest tile i within 2, by its tiles; the water tile nearest i within 2)
function placeRiver(m,F,i){const j=placeShore(m,i,j=>F.rv[j]>=0);return j<0?0:F.rv[j]}
function placeShore(m,i,ok){const W=m.w,x=i%W,y=(i-x)/W;for(let d=1;d<=2;d++)for(let b=-d;b<=d;b++)for(let a=-d;a<=d;a++){const j=(y+b)*W+x+a;if(m.has(x+a,y+b)&&m.kind[j]===T_WATER&&(!ok||ok(j)))return j}return -1}
// (lords per realm: past FACS' four, names from their people's syllables, unique; null when four will do)
function placeLords(R,n){if(n<=4)return null;const used=new Set(PLACE_REALMS.flatMap(f=>FACS[f].lords)),o={};
  for(const f of PLACE_REALMS){const L=o[f]=FACS[f].lords.slice(),[T,A,B]=LORD_SYL[PLACE_PEOPLE[f]];
    for(let t=0;L.length<n;t++){const s=T[Math.floor(R()*T.length)]+' '+A[Math.floor(R()*A.length)]+B[Math.floor(R()*B.length)]+(t>300?' '+t:'');if(!used.has(s)){used.add(s);L.push(s)}}}
  return o}

/* 8. roads (above). The search's buffers kept for the stage; a tile's cost: open 1, forest 1.8, hill 2.2, a road or ford 0.5,
   x4 in a wild region, x0.8-1.25 by a noise (so a road wanders as the land leads it), +1.5 a terrace climbed or
   descended; peaks, water (but straight across, below) and cliff edges closed */
const PLACE_ROAD={hm:1,pull:40,slack:1.04,round:[6,3,1.5,.75],xing:{bridge:[2,8,12],ford:[1.5,4],ferry:[2,16],reuse:.5}};
// (the last roads stage's numbers, for the tests: roads searched, ms in all and the most for one, tiles searched, searches that
// left their box for the whole map, and the stretches of river where no crossing can be made: bare)
const PLACE_STATS={roads:0,ms:0,max:0,search:0,whole:0,bare:[]};
function* genRoads(g){
  const m=g.map,W=m.w,H=m.h,N=W*H,K=m.kind,Fe=m.feat,Rv=m.river,E=m.edge,Hd=g.holdings,n=Hd.length,F=g.work.place,R=g.rng('roads',g.attempt),salt=genSalt(R);
  m.roads=[];m.crossings=[];g.work.roadFail=[];PLACE_STATS.roads=PLACE_STATS.ms=PLACE_STATS.max=PLACE_STATS.search=PLACE_STATS.whole=0;PLACE_STATS.bare=[];
  const X=new Int32Array(N).fill(-1),LI=new Int32Array(N).fill(-1),lines=[],jit=new Float32Array(N),ter=new Uint8Array(N),ferry=new Uint8Array(N),nearH=new Uint8Array(N);
  for(let i=0;i<N;i++){const x=i%W,y=(i-x)/W;jit[i]=.8+.45*fbm(x/9,y/9,salt);ter[i]=clamp((m.elev[i]-64)>>5,0,3)}
  // ferries land within 8 tiles of a town, a city or a port; nearH: within 6 tiles of a holding (the larger of dx, dy)
  for(const h of Hd)for(let b=-6;b<=6;b++)for(let a=-6;a<=6;a++)if(m.has(h.tx+a,h.ty+b))nearH[(h.ty+b)*W+h.tx+a]=1;
  for(const h of Hd)if(h.kind==='town'||h.kind==='city'||h.style==='port')for(let b=-8;b<=8;b++)for(let a=-8;a<=8;a++)if(a*a+b*b<=64&&m.has(h.tx+a,h.ty+b))ferry[(h.ty+b)*W+h.tx+a]=1;
  const xy=i=>[i%W,(i-i%W)/W],cen=i=>[i%W+.5,(i-i%W)/W+.5];
  const tc=(i,great)=>great&&K[i]===T_FORD?Infinity:cost[i],cost=new Float32Array(N),price=i=>{const k=K[i];cost[i]=(k===T_ROAD||k===T_FORD?.5:k===T_OPEN?jit[i]:k===T_FOREST?1.8*jit[i]:k===T_HILL?2.2*jit[i]:Infinity)*(m.region[i]?4:1)};
  for(let i=0;i<N;i++)price(i);
  const shut=i=>K[i]===T_WATER||K[i]===T_MOUNT,cut=(i,dx,dy)=>dx>0&&E[i]&1||dx<0&&E[i]&4||dy>0&&E[i]&2||dy<0&&E[i]&8,DX=DIR8.map(d=>d[0]),DY=DIR8.map(d=>d[1]);
  // (the crossing a straight run of k water tiles from land tile i (step s) would be: [kind, its cost]; kind 0 none)
  const xing=(i,s,k,great)=>{let old=-2,riv=true,w=0,flood=false;
    for(let t=1;t<=k;t++){const j=i+s*t;old=old===-2?X[j]:old===X[j]?old:-3;if(!(Rv[j]&3))riv=false;w=Math.max(w,Rv[j]&3);if(Rv[j]&32)flood=true}
    const C=PLACE_ROAD.xing;if(old>=0)return m.crossings[old].kind==='ford'&&great?[0,0]:[4,(k+1)*C.reuse];if(old!==-1)return[0,0];
    if(!great&&riv&&w<=2&&k<=PLACE.ford&&!flood)return[1,(k+1)*C.ford[0]+C.ford[1]];
    if(k<=PLACE.bridge)return[2,(k+1)*C.bridge[0]+C.bridge[great?1:2]];
    if(riv&&w===3&&k<=PLACE.ferry&&(ferry[i]||ferry[i+s*(k+1)]))return[3,(k+1)*C.ferry[0]+C.ferry[1]];return[0,0]};
  // the least-cost search (A*: the octile distance x PLACE_ROAD.hm to go), inside box [x0, y0, x1, y1]: the tiles a to b, or null
  const G=new Float32Array(N),from=new Int32Array(N),mark=new Uint32Array(N),done=new Uint32Array(N);let stamp=0,hf=new Float64Array(4096),hi=new Int32Array(4096),hn=0;
  const push=(f,i)=>{if(hn===hf.length){const a=new Float64Array(hn*2),b=new Int32Array(hn*2);a.set(hf);b.set(hi);hf=a;hi=b}let k=hn++;while(k>0){const p=(k-1)>>1;if(hf[p]<=f)break;hf[k]=hf[p];hi[k]=hi[p];k=p}hf[k]=f;hi[k]=i};
  const pop=()=>{const top=hi[0],f=hf[--hn],i=hi[hn];let k=0;for(;;){let c=2*k+1;if(c>=hn)break;if(c+1<hn&&hf[c+1]<hf[c])c++;if(hf[c]>=f)break;hf[k]=hf[c];hi[k]=hi[c];k=c}if(hn){hf[k]=f;hi[k]=i}return top};
  const search=(a,b,great,box)=>{
    stamp++;hn=0;const bx=b%W,by=(b-bx)/W,x0=box[0],y0=box[1],x1=box[2],y1=box[3],hm=PLACE_ROAD.hm;
    const relax=(i,j,v)=>{if(mark[j]!==stamp||v<G[j]){mark[j]=stamp;G[j]=v;from[j]=i;const jx=j%W,jy=(j-jx)/W,dx=jx>bx?jx-bx:bx-jx,dy=jy>by?jy-by:by-jy;push(v+(dx>dy?dx+.4142*dy:dy+.4142*dx)*hm,j)}};
    G[a]=0;mark[a]=stamp;from[a]=-1;push(0,a);
    while(hn){const i=pop();if(done[i]===stamp)continue;done[i]=stamp;PLACE_STATS.search++;
      if(i===b){const P=[];for(let j=b;j!==a;j=from[j]){P.push(j);const f=from[j],[fx,fy]=xy(f),[jx,jy]=xy(j),k=Math.max(Math.abs(jx-fx),Math.abs(jy-fy));for(let t=k-1;t>0;t--)P.push(f+(j-f)/k*t)}P.push(a);return P.reverse()}
      const x=i%W,y=(i-x)/W,gi=G[i],te=ter[i];
      for(let d=0;d<8;d++){const dx=DX[d],dy=DY[d],nx=x+dx,ny=y+dy;if(nx<x0||ny<y0||nx>x1||ny>y1)continue;const j=ny*W+nx;let c=tc(j,great);
        if(c===Infinity||E[i]&&cut(i,dx,dy))continue;if(d&1){if(shut(i+dx)||shut(i+dy*W))continue;c*=1.4142}
        relax(i,j,gi+c+1.5*(ter[j]>te?ter[j]-te:te-ter[j]))}
      // over water: straight on, 4 ways, from land to land
      if(K[i]!==T_WATER)for(let d=0;d<8;d+=2){const dx=DX[d],dy=DY[d],s=dx+dy*W;if(K[i+s]!==T_WATER)continue;let k=0,nx=x+dx,ny=y+dy;
        while(k<=PLACE.ferry&&nx>=x0&&ny>=y0&&nx<=x1&&ny<=y1&&K[ny*W+nx]===T_WATER){k++;nx+=dx;ny+=dy}
        if(!k||k>PLACE.ferry||nx<x0||ny<y0||nx>x1||ny>y1)continue;const j=ny*W+nx;if(tc(j,great)===Infinity)continue;
        const [kind,c]=xing(i,s,k,great);if(kind&&!placeNotch(m,i,s)&&!placeNotch(m,j,s))relax(i,j,gi+c+1.5*Math.abs(ter[j]-ter[i]))}}
    return null};
  // (the tiles under a line through points pts, 8-connected and thin (no corner tile where the next touches the one before):
  // null if one is not free ground (or a road), a diagonal step cuts past water or a peak, or it costs more than most)
  const free=i=>{const k=K[i];return k===T_OPEN||k===T_FOREST||k===T_HILL||k===T_ROAD};
  const under=(pts,great,most)=>{const T=[];let c=0;
    for(let k=1;k<pts.length;k++){const [ax,ay]=pts[k-1],[bx,by]=pts[k],st=Math.max(1,Math.ceil(Math.sqrt((bx-ax)*(bx-ax)+(by-ay)*(by-ay))*4));
      for(let s=k>1?1:0;s<=st;s++){const x=Math.floor(ax+(bx-ax)*s/st),y=Math.floor(ay+(by-ay)*s/st),t=y*W+x;if(t===T[T.length-1])continue;
        if(T.length>=2){const [px,py]=xy(T[T.length-2]);if(Math.abs(px-x)<=1&&Math.abs(py-y)<=1)T.pop()}T.push(t)}}
    for(let k=0;k<T.length;k++){const t=T[k];if(!free(t))return null;if(k){const [px,py]=xy(T[k-1]),[x,y]=xy(t),dx=x-px,dy=y-py;
      if(Math.abs(dx)>1||Math.abs(dy)>1||cut(T[k-1],dx,dy))return null;if(dx&&dy&&(shut(T[k-1]+dx)||shut(T[k-1]+dy*W)))return null;c+=tc(t,great)*(dx&&dy?1.4142:1)}}
    T.cost=c;return c<=most?T:null};
  // (a stretch of land tiles Q, a to b: string-pulled (each leg as far as a straight line stays as cheap), its corners rounded;
  // {tiles, pts}, its ends at pa and pb)
  const smooth=(Q,pa,pb,great)=>{
    const n=Q.length,cum=[0];for(let k=1;k<n;k++){const [px,py]=xy(Q[k-1]),[x,y]=xy(Q[k]);cum.push(cum[k-1]+tc(Q[k],great)*(px!==x&&py!==y?1.4142:1))}
    if(n<3)return{tiles:Q,pts:[pa,pb]};
    const V=[0];for(let a=0;a<n-1;){let to=a+1;for(let b=a+2;b<n&&b<=a+PLACE_ROAD.pull;b++){if(!under([cen(Q[a]),cen(Q[b])],great,(cum[b]-cum[a])*PLACE_ROAD.slack+.5))break;to=b}V.push(to);a=to}
    const most=cum[n-1]*PLACE_ROAD.slack+1,ends=p=>{p=p.slice();p[0]=cen(Q[0]);p[p.length-1]=cen(Q[n-1]);return p},pl=V.map(k=>cen(Q[k]));pl[0]=pa;pl[pl.length-1]=pb;
    // each corner as round as its own legs allow (on free ground, about as cheap), moved out from what it turns round (up to 1.4
    // tiles along its bisector) when it must
    const rs=pl.map(()=>0),pv=pl.slice(),cl=ends(pl);
    for(let k=1;k<pl.length-1;k++){const p=cl[k-1],v=cl[k],q=cl[k+1],base=under([p,v,q],great,Infinity);if(!base)continue;
      const lp=Math.sqrt((p[0]-v[0])*(p[0]-v[0])+(p[1]-v[1])*(p[1]-v[1]))||1,lq=Math.sqrt((q[0]-v[0])*(q[0]-v[0])+(q[1]-v[1])*(q[1]-v[1]))||1,
        ix=(p[0]-v[0])/lp+(q[0]-v[0])/lq,iy=(p[1]-v[1])/lp+(q[1]-v[1])/lq,il=Math.sqrt(ix*ix+iy*iy)||1;
      found:for(const r of PLACE_ROAD.round)for(const d of [0,.7,1.4]){const w=[v[0]-ix/il*d,v[1]-iy/il*d];
        if(under(placeRound([p,w,q],[0,r,0]),great,base.cost*PLACE_ROAD.slack+.5)){rs[k]=r;pv[k]=w;break found}}}
    {const pts=placeRound(pv,rs),T=under(ends(pts),great,most);if(T)return{tiles:T,pts}}
    const T=under(ends(pl),great,most);if(T)return{tiles:T,pts:pl};return{tiles:Q,pts:[pa,...Q.slice(1,-1).map(cen),pb]}};
  // (the point on line l nearest p)
  const snap=(l,p)=>{let best=p,bd=Infinity;for(let k=2;k<l.length;k+=2){const ax=l[k-2],ay=l[k-1],dx=l[k]-ax,dy=l[k+1]-ay,L=dx*dx+dy*dy,t=L?clamp(((p[0]-ax)*dx+(p[1]-ay)*dy)/L,0,1):0,x=ax+dx*t,y=ay+dy*t,d=(x-p[0])*(x-p[0])+(y-p[1])*(y-p[1]);if(d<bd){bd=d;best=[x,y]}}return best};
  const gate=h=>[h.tx,h.ty+1];
  // a road found: its new stretches smoothed and laid (roads, crossings, feat), its line kept
  const lay=(P,ha,hb,great)=>{
    const old=i=>K[i]===T_ROAD||K[i]===T_FORD||X[i]>=0,out=[],line=[];let k=0;
    while(k<P.length){if(old(P[k])){out.push(P[k++]);continue}
      // a new stretch, from the tile before it (a junction, or the holding) to the tile after it
      let e=k;while(e<P.length&&!old(P[e]))e++;const s=Math.max(0,k-1),t=Math.min(P.length-1,e),Q=P.slice(s,t+1),pts=[],tiles=[];
      const endPt=(j,h)=>h?gate(h):LI[j]>=0?snap(lines[LI[j]],cen(j)):cen(j);
      for(let a=0;a<Q.length;){let b=a+1;while(b<Q.length&&K[Q[b]]!==T_WATER)b++;b=Math.min(b,Q.length)-1;
        const pa=a===0?endPt(Q[0],s===0?ha:null):cen(Q[a]),pb=b===Q.length-1?endPt(Q[b],t===P.length-1?hb:null):cen(Q[b]),r=smooth(Q.slice(a,b+1),pa,pb,great);
        if(tiles.length&&tiles[tiles.length-1]===r.tiles[0])tiles.pop();tiles.push(...r.tiles);pts.push(...r.pts);
        let w=b+1;while(w<Q.length&&K[Q[w]]===T_WATER)tiles.push(Q[w++]);a=w}
      if(out.length&&out[out.length-1]===tiles[0])out.pop();out.push(...tiles);
      const l=[];for(const p of pts){const x=Math.round(p[0]*100)/100,y=Math.round(p[1]*100)/100;if(l.length<2||l[l.length-2]!==x||l[l.length-1]!==y)l.push(x,y)}lines.push(l);line.push(l);k=t+1;
      for(const i of tiles)if(LI[i]<0)LI[i]=lines.length-1}
    // within 6 tiles of a holding a diagonal step takes a corner too (4 ways there, so lots.js leads it round the holding's centre)
    for(let k=1;k<out.length;k++){const a=out[k-1],b=out[k],ax=a%W,bx=b%W,dx=bx-ax,dy=(b-bx)/W-(a-ax)/W;
      if(dx&&dy&&(nearH[a]||nearH[b])){const c1=a+dx,c2=a+dy*W,c=free(c1)&&(!free(c2)||cost[c1]<=cost[c2])?c1:free(c2)?c2:-1;if(c>=0)out.splice(k++,0,c)}}
    // the tiles laid: roads (great over track), and each new run of water a crossing
    for(let k=0;k<out.length;k++){const i=out[k];
      if(K[i]===T_WATER&&X[i]<0){let e=k;while(K[out[e]]===T_WATER&&X[out[e]]<0)e++;placeCross(m,F,X,out[k-1],out[e],out.slice(k,e),xing(out[k-1],out[k]-out[k-1],e-k,great)[0]||2,great,Hd);k=e-1;continue}
      if(K[i]!==T_FORD&&K[i]!==T_WATER)K[i]=T_ROAD;if(K[i]===T_ROAD)Fe[i]=great?Fe[i]&~128|64:Fe[i]&64?Fe[i]:Fe[i]|128}
    for(const i of out)price(i);m.roads.push({a:ha.name,b:hb.name,kind:great?'road':'track',path:out,line})};
  // the pairs: a spanning tree (nearest first, from the first holding) and each one's two nearest; great roads first, short first
  const d2=(a,b)=>(Hd[a].tx-Hd[b].tx)*(Hd[a].tx-Hd[b].tx)+(Hd[a].ty-Hd[b].ty)*(Hd[a].ty-Hd[b].ty),pairs=new Set(),key=(a,b)=>a<b?a*4096+b:b*4096+a;
  {const inT=[0],is=new Uint8Array(n);is[0]=1;while(inT.length<n){let best=null;for(const a of inT)for(let b=0;b<n;b++)if(!is[b]&&(!best||d2(a,b)<best[2]))best=[a,b,d2(a,b)];pairs.add(key(best[0],best[1]));inT.push(best[1]);is[best[1]]=1}}
  for(let a=0;a<n;a++)Hd.map((h,b)=>b).filter(b=>b!==a).sort((u,v)=>d2(a,u)-d2(a,v)||u-v).slice(0,2).forEach(b=>pairs.add(key(a,b)));
  const big=h=>h.kind!=='village',list=[...pairs].map(p=>[Math.floor(p/4096),p%4096]).map(([a,b])=>({a,b,great:big(Hd[a])&&big(Hd[b]),d:d2(a,b)})).sort((p,q)=>q.great-p.great||p.d-q.d||p.a-q.a||p.b-q.b);
  // (the least-cost way from tile a to tile b: in their box, padded by 12 tiles and 0.4 of their distance, else over the whole map)
  const find=(a,b,great)=>{const [ax,ay]=xy(a),[bx,by]=xy(b),pad=12+Math.round(Math.sqrt((ax-bx)*(ax-bx)+(ay-by)*(ay-by))*.4);
    return search(a,b,great,[Math.max(0,Math.min(ax,bx)-pad),Math.max(0,Math.min(ay,by)-pad),Math.min(W-1,Math.max(ax,bx)+pad),Math.min(H-1,Math.max(ay,by)+pad)])||PLACE_STATS.whole++>=0&&search(a,b,great,[0,0,W-1,H-1])};
  // classic: the river's town at a bridge over the great river (CLASSIC_HINTS river, bridge), laid first: its narrowest span within
  // 4 (placeNarrows) bridged, a road from the town over it to the nearest holding beyond (nearer the far end than the near one)
  const forced=new Set();
  for(const ht of g.hints||[])if(ht.kind==='river'&&ht.bridge){const k=Hd.findIndex(h=>h.name===ht.at),h=Hd[k],s=h&&placeNarrows(m,F,h.tx,h.ty,4);if(!s)continue;
    const [ix,iy]=xy(s.i),[jx,jy]=xy(s.j),dd=(o,x,y)=>(o.tx-x)*(o.tx-x)+(o.ty-y)*(o.ty-y);let b=-1;
    Hd.forEach((o,q)=>{if(q!==k&&dd(o,jx,jy)<dd(o,ix,iy)&&(b<0||dd(o,jx,jy)<dd(Hd[b],jx,jy)))b=q});
    const great=b>=0&&big(h)&&big(Hd[b]),P=b>=0&&find(h.ty*W+h.tx,s.i,great),Q=P&&find(s.j,Hd[b].ty*W+Hd[b].tx,great);if(!Q)continue;
    placeCross(m,F,X,s.i,s.j,s.tiles,2,great,Hd);for(const i of s.tiles)price(i);lay([...P,...s.tiles,...Q],h,Hd[b],great);forced.add(key(k,b))}
  for(let e=0;e<list.length;e++){const {a,b,great}=list[e],A=Hd[a],B=Hd[b],t0=performance.now();if(forced.has(key(a,b)))continue;
    const P=find(A.ty*W+A.tx,B.ty*W+B.tx,great);
    if(P)lay(P,A,B,great);else g.work.roadFail.push(A.name+' to '+B.name);
    const dt=performance.now()-t0;PLACE_STATS.roads++;PLACE_STATS.ms+=dt;PLACE_STATS.max=Math.max(PLACE_STATS.max,dt);if(g.tick())yield .9*e/list.length}
  // a river's crossings at most PLACE.gap apart along its path (its source counts as one, its mouth not; a crossing's place on it:
  // placeAlong): past that, the best spot 36-60 tiles on (else 10-35, else any within 60), a ford (on a great river a bridge, or a
  // ferry by a town or port). Where no spot within 60 tiles can take one (banks of peaks or land no road joins, a great river
  // wider than a bridge away from towns), the first spot past them, that stretch left bare (PLACE_STATS.bare): the rule holds
  // wherever a crossing can be made
  for(const r of m.rivers){const L=r.path.length,on=new Map(r.path.map((i,k)=>[i,k])),at=[0];
    for(const c of m.crossings)if(c.river===r.id){const p=placeAlong(m,on,c.tiles);if(p>=0)at.push(p)}at.sort((a,b)=>a-b);at.push(L-1);
    for(let k=1;k<at.length;k++){let lo=at[k-1];while(at[k]-lo>PLACE.gap){const hi=Math.min(lo+PLACE.gap,at[k]-1);
      let s=placeSpot(m,F,X,r,on,lo+36,Math.min(hi,at[k]-5),ferry)||placeSpot(m,F,X,r,on,lo+10,lo+35,ferry)||placeSpot(m,F,X,r,on,lo+1,hi,ferry);
      if(!s){for(let a=hi+1;a<at[k]&&!s;a+=10)s=placeSpot(m,F,X,r,on,a,Math.min(a+9,at[k]-1),ferry);PLACE_STATS.bare.push(r.name+' '+lo+'-'+(s?placeAlong(m,on,s.tiles):at[k])+' of '+L)}
      if(!s)break;placeCross(m,F,X,s.i,s.j,s.tiles,s.kind,false,Hd,r.id);lo=Math.max(lo+1,placeAlong(m,on,s.tiles))}}}
  // the bridge town: a town by a bridge (within 3 tiles), one a realm (none where a realm has one; none in the classic world, whose
  // holdings keep their own styles)
  if(!m.classic)for(const f of PLACE_REALMS){if(Hd.some(h=>h.realm===f&&h.style==='bridge'))continue;let best=null,bd=99;
    for(const h of Hd)if(h.realm===f&&h.kind==='town'&&!h.style)for(const c of m.crossings)if(c.kind==='bridge')for(const i of [c.i,c.j,...c.tiles]){const [x,y]=xy(i),d=Math.max(Math.abs(x-h.tx),Math.abs(y-h.ty));if(d<=3&&d<bd){bd=d;best=h}}
    if(best)best.style='bridge'}
  yield 1}
// (corners rounded: at each inner point k, a curve (quadratic, its control the corner) from rs[k] tiles back along each leg (at most
// .45 of it); 0 keeps the corner)
function placeRound(P,rs){const O=[P[0]];
  for(let k=1;k<P.length-1;k++){const p=P[k-1],v=P[k],q=P[k+1],r=rs[k],lp=Math.sqrt((p[0]-v[0])*(p[0]-v[0])+(p[1]-v[1])*(p[1]-v[1])),lq=Math.sqrt((q[0]-v[0])*(q[0]-v[0])+(q[1]-v[1])*(q[1]-v[1]));
    if(!r||!lp||!lq){O.push(v);continue}const ta=Math.min(r,.45*lp)/lp,tb=Math.min(r,.45*lq)/lq,a=[v[0]+(p[0]-v[0])*ta,v[1]+(p[1]-v[1])*ta],b=[v[0]+(q[0]-v[0])*tb,v[1]+(q[1]-v[1])*tb];
    for(let s=0;s<=6;s++){const u=s/6,w0=(1-u)*(1-u),w1=2*(1-u)*u,w2=u*u;O.push([w0*a[0]+w1*v[0]+w2*b[0],w0*a[1]+w1*v[1]+w2*b[1]])}}
  O.push(P[P.length-1]);return O}
// (a crossing laid: kind 1 ford, 2 bridge, 3 ferry; from land tile a over water tiles to land tile b; its river rid, or the most
// of its tiles', stone (a bridge on a great road or over more than a tile), its toll the nearest city, town or castle within 8 tiles)
function placeCross(m,F,X,a,b,tiles,kind,great,Hd,rid){
  const W=m.w,c=m.crossings.length,rv={},kinds=['','ford','bridge','ferry'];let river=rid==null?null:rid,top=0;
  if(rid==null)for(const i of tiles){const r=F.rv[i];if(r>=0){rv[r]=(rv[r]||0)+1;if(rv[r]>top){top=rv[r];river=r}}}
  let toll=null,td=65;if(kind!==1)for(const h of Hd)if(h.kind!=='village')for(const i of [a,b]){const x=i%W,y=(i-x)/W,d=(x-h.tx)*(x-h.tx)+(y-h.ty)*(y-h.ty);if(d<td){td=d;toll=h.name}}
  m.crossings.push({i:a,j:b,kind:kinds[kind],river,tiles:tiles.slice(),stone:kind===2&&(great||tiles.length>1),toll,when:null});
  for(const i of tiles){X[i]=c;if(kind===1)m.kind[i]=T_FORD;else if(kind===2){m.kind[i]=T_ROAD;m.feat[i]|=32}}}
// (a crossing's place along a river, its path's tiles' places in on: its last tile on the path, else the path's first found within
// 2 of a tile; -1 if none)
function placeAlong(m,on,tiles){const W=m.w;let p=-1;for(const i of tiles){if(on.has(i))p=on.get(i);else{const x=i%W,y=(i-x)/W;
  for(let b=-2;b<=2&&p<0;b++)for(let a=-2;a<=2&&p<0;a++)if(m.has(x+a,y+b)&&on.has(i+a+b*W))p=on.get(i+a+b*W)}}return p}
// (a crossing's end tile i, crossing by step s, a notch: water on both its sides across the way, so its road would read as one
// more tile of bridge (world.js bridgeAt) and a ford's or bridge's end would stand in the river)
function placeNotch(m,i,s){const W=m.w,K=m.kind,x=i%W,y=(i-x)/W;
  return s===1||s===-1?y>0&&y<m.h-1&&K[i-W]===T_WATER&&K[i+W]===T_WATER:x>0&&x<W-1&&K[i-1]===T_WATER&&K[i+1]===T_WATER}
// (the best spot to cross river r between places lo and hi along its path (its place as placeAlong reads it; on: the path's
// places): the narrowest straight run of water, across or down, the latest first, from walkable land to walkable land on the
// joined land (no end a notch), none of it a crossing yet: {i, j, tiles, kind}, or null)
function placeSpot(m,F,X,r,on,lo,hi,ferry){
  const W=m.w,K=m.kind,ok=i=>passable(K[i])&&K[i]!==T_FORD&&F.conn[i]===F.main;let best=null;
  for(let p=Math.max(1,lo-12);p<=Math.min(hi+12,r.path.length-2);p++){const t=r.path[p];if(K[t]!==T_WATER||X[t]>=0)continue;const x=t%W,y=(t-x)/W;
    for(const [dx,dy] of [[1,0],[0,1]]){let a=0,b=0;while(a<=PLACE.ferry&&m.has(x-dx*(a+1),y-dy*(a+1))&&K[t-(dx+dy*W)*(a+1)]===T_WATER)a++;while(b<=PLACE.ferry&&m.has(x+dx*(b+1),y+dy*(b+1))&&K[t+(dx+dy*W)*(b+1)]===T_WATER)b++;
      const s=dx+dy*W,i=t-s*(a+1),j=t+s*(b+1),k=a+b+1;if(!m.has(x-dx*(a+1),y-dy*(a+1))||!m.has(x+dx*(b+1),y+dy*(b+1))||!ok(i)||!ok(j)||placeNotch(m,i,s)||placeNotch(m,j,s))continue;
      const tiles=[];for(let q=1;q<=k;q++)tiles.push(i+s*q);if(tiles.some(q=>X[q]>=0))continue;const w=Math.max(...tiles.map(q=>m.river[q]&3));
      const kind=w<3&&k<=PLACE.ford?1:w===3&&k<=PLACE.bridge?2:w===3&&k<=PLACE.ferry&&(ferry[i]||ferry[j])?3:0;
      const q=kind?placeAlong(m,on,tiles):-1,v=q>=lo&&q<=hi?k*4+hi-q:Infinity;if(v<Infinity&&(!best||v<best.v))best={v,i,j,tiles,kind}}}
  return best}

/* 9. camps: density()'s, in the fringe (6-16 tiles from a road, 14 from a holding, outside wild regions), reachable from the
   first capital with the flooding fords shut; in a random order, the farthest apart first (28 tiles, down to 8 when short); each
   on its 2 x 2 tiles and a ring round them clear of roads, water, fords and peaks, its tiles opened */
function* genCamps(g){
  const m=g.map,W=m.w,H=m.h,K=m.kind,Hd=g.holdings,R=g.rng('sites',g.attempt),C=g.camps=[],want=density().camps;
  if(g.work.high9)m.high.set(g.work.high9);else g.work.high9=m.high.slice();
  const dRd=yield* genFar(g,i=>K[i]===T_ROAD||K[i]===T_FORD,64),reach=placeReach(m,Hd[0].ty*W+Hd[0].tx,true);yield .5;
  const ok=(cx,cy)=>{for(let y=cy-2;y<=cy+1;y++)for(let x=cx-1;x<=cx+2;x++){if(x<1||y<1||x>=W-1||y>=H-1)return false;const t=K[y*W+x];if(t===T_ROAD||t===T_WATER||t===T_MOUNT||t===T_FORD)return false}return true};
  const L=[];for(let y=3;y<H-3;y+=2)for(let x=2;x<W-3;x+=2){const i=y*W+x;if(reach[i]&&dRd[i]>=6&&dRd[i]<=16&&!m.region[i]&&ok(x,y)&&Hd.every(h=>(h.tx-x)*(h.tx-x)+(h.ty-y)*(h.ty-y)>=196))L.push(i)}
  for(let k=L.length-1;k>0;k--){const j=Math.floor(R()*(k+1));[L[k],L[j]]=[L[j],L[k]]}
  for(let sep=28;C.length<want&&sep>=8;sep-=4)for(const i of L){if(C.length>=want)break;const x=i%W,y=(i-x)/W;if(C.every(c=>(c.tx-x)*(c.tx-x)+(c.ty-y)*(c.ty-y)>=sep*sep))C.push({tx:x,ty:y})}
  for(const c of C)for(let y=c.ty-1;y<=c.ty;y++)for(let x=c.tx;x<=c.tx+1;x++){K[y*W+x]=T_OPEN;m.high[y*W+x]=0}
  yield 1}

/* the checks of stages 7-9 (§8.14), set on worldgen.js's GEN_STAGES rows: a reason to try the stage again, or null.
   holdings: as many as asked, by realm (PLACE_SHARE); capitals 0.3 x the diagonal apart, each liked at PLACE.suit or more, their
   nearest rivals within PLACE.skew of the mean, each with PLACE.land suitable tiles round it; a fair start (3 holdings within a
   day's travel of each capital); each realm's land within PLACE.spread of their mean (placeRealmLand); every port on water
   joined to the sea or a navigable river. Its relaxation, the last rung of §4.5's order (hamlets, sacred places and the wild
   share come with Phase 4): one holding fewer a realm, twice at most, where too few fit or a capital has no fair start. roads: every pair joined; every holding reachable from the first capital, also with every ford on a
   flooding river shut (a river's crossings within PLACE.gap need no retry: the pass makes them wherever a crossing can be made,
   and a retry's other roads cannot make a bare stretch crossable). camps: as many as density() asks */
function placeCheck(id){return g=>{
  const m=g.map,W=m.w,Hd=g.holdings;
  if(id==='holdings'){if(m.classic)return null;const F=g.work.place,N=g.s.holdings-(g.work.fewer|0)*PLACE_REALMS.length,q=placeQuota(N);
    for(const f of PLACE_REALMS){const n=Hd.filter(h=>h.realm===f).length;if(n!==q[f])return f+' has '+n+' holdings of '+q[f]}
    const caps=PLACE_REALMS.map(f=>Hd.find(h=>h.realm===f&&h.kind==='city')),gap=PLACE.cap*Math.sqrt(W*W+m.h*m.h),d2=(i,j)=>{const a=i%W,b=j%W;return(a-b)*(a-b)+((i-a)/W-(j-b)/W)*((i-a)/W-(j-b)/W)},ti=h=>h.ty*W+h.tx;
    for(const a of caps)for(const b of caps)if(a!==b&&d2(ti(a),ti(b))<gap*gap)return 'capitals '+a.name+' and '+b.name+' too near';
    const sk=placeSkew(caps.map(ti),d2);if(sk>PLACE.skew)return 'capitals unbalanced ('+(sk*100).toFixed(0)+'%)';
    const need=placeNeed(m);
    for(const c of caps){const p=PLACE_PEOPLE[c.realm],v=placeSuit(m,F,p,ti(c)),n=placeLand(m,F,p,c.tx,c.ty);if(v<PLACE.suit)return c.name+' liked '+v.toFixed(2);
      if(n<need)return c.name+' has '+n+' suitable tiles';
      if(Hd.filter(h=>h!==c&&(h.tx-c.tx)*(h.tx-c.tx)+(h.ty-c.ty)*(h.ty-c.ty)<=PLACE.day*PLACE.day).length<3)return c.name+' has no fair start'}
    const L=placeRealmLand(m,Hd),mean=L.reduce((a,b)=>a+b,0)/L.length,far=Math.max(...L.map(v=>Math.abs(v-mean)/mean));
    if(far>PLACE.spread)return 'realm land unbalanced ('+L.join('/')+')';
    const bad=Hd.find(h=>h.style==='port'&&placePort(m,F,ti(h))<0);return bad?bad.name+' a port on no sea':null}
  if(id==='roads'){if(g.work.roadFail.length)return 'no road '+g.work.roadFail[0];
    for(const shut of [false,true]){const Rd=placeReach(m,Hd[0].ty*W+Hd[0].tx,shut),h=Hd.find(h=>!Rd[h.ty*W+h.tx]);if(h)return h.name+' unreachable'+(shut?' with the flooding fords shut':'')}
    return null}
  return g.camps.length<density().camps?g.camps.length+' camps of '+density().camps:null}}
for(const id of ['holdings','roads','sites'])Object.assign(GEN_STAGES.find(s=>s.id===id),{check:placeCheck(id)},
  id==='holdings'?{relax:g=>{if((g.work.fewer|0)>=2||g.map.classic||!/holdings of|fair start/.test(placeCheck(id)(g)))return null;g.work.fewer=(g.work.fewer|0)+1;return 'holdings: one fewer a realm'}}:{});
