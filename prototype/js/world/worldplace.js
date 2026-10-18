'use strict';
/* ---------- the generator's placement, stages 7-9 (doc/WORLD_DESIGN.md §8.8, §8.11, §8.12, §15.2.1): holdings, roads with their
   crossings, bandit camps; worldgen.js runs them (GEN_STAGES) with its stage context g. Phase 2 wave 0's stubs, crude but valid:
   the 37 classic holdings at their anchors (classicAnchors, scaled to the map's size) on the nearest clear land, straight roads
   between them (a spanning tree and each one's two nearest) with a bridge or a ford where a road meets water, the classic camps
   on clear ground reachable from the holdings. Wave 1 (B) makes them real. Seeded and isolated as worldgen.js (§8.1): no
   Math.random, rnd, rint or pick; no Math.hypot, sin, cos, exp, pow, log or atan2 (tests/structure.js reads this file's text) */
/* the classic holdings' anchors (§8.15 step 1), in CLASSIC_PLACES' order, on the classic seed's Normal map (448 x 320): each
   realm's centroid doubled, each holding's offset from it x1.4; Ashford (36, 40) comes to (83, 85), Karn Hold (172, 44) to
   (338, 78). Stage 7 puts each on a suitable tile near its anchor */
function classicAnchors(){
  const C={};for(const p of CLASSIC_PLACES){const c=C[p.realm]||(C[p.realm]={x:0,y:0,n:0});c.x+=p.tx;c.y+=p.ty;c.n++}
  return CLASSIC_PLACES.map(p=>{const c=C[p.realm],cx=c.x/c.n,cy=c.y/c.n;return{name:p.name,tx:Math.round(cx*2+(p.tx-cx)*1.4),ty:Math.round(cy*2+(p.ty-cy)*1.4)}})}
// (the tile nearest (x, y), ring by ring (the larger of dx, dy) up to r, where ok(tx, ty) holds: [tx, ty], or null)
function genNear(m,x,y,r,ok){for(let d=0;d<=r;d++)for(let k=-d;k<=d;k++)for(const [tx,ty] of [[x+k,y-d],[x+k,y+d],[x-d,y+k],[x+d,y+k]])if(m.has(tx,ty)&&ok(tx,ty))return [tx,ty];return null}
/* 7. holdings: each classic holding (its data whole, realm too) on the clear land nearest its anchor (no water, ford or peak within
   2 tiles; 4 tiles from the others), its ground round it opened (the stub: wave 1 places by rules, as many as the settings ask) */
function* genHoldings(g){
  const m=g.map,W=m.w,K=m.kind,A=classicAnchors(),sx=m.w/448,sy=m.h/320,H=g.holdings=[];g.lords=null;
  const land=(x,y)=>{const k=m.kindAt(x,y);return k!==T_WATER&&k!==T_MOUNT&&k!==T_FORD},
    ok=(x,y)=>{if(x<3||y<3||x>=m.w-3||y>=m.h-4)return false;for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++)if(a*a+b*b<=6&&!land(x+a,y+b))return false;
      return H.every(h=>(h.tx-x)*(h.tx-x)+(h.ty-y)*(h.ty-y)>=16)};
  for(let k=0;k<CLASSIC_PLACES.length;k++){
    const x=Math.round(A[k].tx*sx),y=Math.round(A[k].ty*sy),at=genNear(m,x,y,40,ok)||genNear(m,x,y,40,land)||[x,y],d=JSON.parse(JSON.stringify(CLASSIC_PLACES[k]));
    d.tx=at[0];d.ty=at[1];H.push(d);
    for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++){const tx=at[0]+a,ty=at[1]+b,i=ty*W+tx;if(a*a+b*b<=6&&m.has(tx,ty)&&(K[i]===T_FOREST||K[i]===T_HILL||!a&&!b)){K[i]=T_OPEN;m.river[i]=0}}
    if(g.tick())yield k/CLASSIC_PLACES.length}
}
/* 8. roads: straight (4 ways, so walkable), between the pairs of a spanning tree (nearest first, from the first holding) and each
   holding's two nearest; land on the way becomes road; a run of water a crossing: a ford where it is a river short of great (width 1
   or 2, at most 3 tiles), else a bridge (road over water, feat bridge); a crossing already laid is shared (the stub: wave 1 lays them by
   least cost, with ferries and the crossings' spacing) */
function* genRoads(g){
  const m=g.map,W=m.w,K=m.kind,H=g.holdings,n=H.length,RV=new Int16Array(W*m.h).fill(-1),X=new Int32Array(W*m.h).fill(-1);
  for(const r of m.rivers)for(const i of r.path)RV[i]=r.id;
  const d2=(a,b)=>(H[a].tx-H[b].tx)*(H[a].tx-H[b].tx)+(H[a].ty-H[b].ty)*(H[a].ty-H[b].ty),pairs=new Set(),key=(a,b)=>a<b?a*1024+b:b*1024+a;
  {const inT=[0];while(inT.length<n){let best=null;for(const a of inT)for(let b=0;b<n;b++)if(!inT.includes(b)&&(!best||d2(a,b)<best[2]))best=[a,b,d2(a,b)];pairs.add(key(best[0],best[1]));inT.push(best[1])}}
  for(let a=0;a<n;a++)H.map((h,b)=>b).filter(b=>b!==a).sort((u,v)=>d2(a,u)-d2(a,v)||u-v).slice(0,2).forEach(b=>pairs.add(key(a,b)));
  m.roads=[];m.crossings=[];const list=[...pairs].sort((p,q)=>p-q);
  const lay=run=>{if(!run.length)return;const ford=run.length<=3&&run.every(i=>RV[i]>=0&&(m.river[i]&3)<=2),rv=RV[run[0]],x=m.crossings.length;
    m.crossings.push({i:run[0],j:run[run.length-1],kind:ford?'ford':'bridge',river:rv>=0?rv:null,tiles:run.slice(),stone:!ford&&run.length>1,toll:null,when:null});
    for(const i of run){X[i]=x;if(ford)K[i]=T_FORD;else{K[i]=T_ROAD;m.feat[i]|=32}}run.length=0};
  for(let e=0;e<list.length;e++){const a=H[Math.floor(list[e]/1024)],b=H[list[e]%1024],ex=Math.abs(b.tx-a.tx),ey=Math.abs(b.ty-a.ty),sx=Math.sign(b.tx-a.tx),sy=Math.sign(b.ty-a.ty);
    let x=a.tx,y=a.ty,ix=0,iy=0;const path=[y*W+x],run=[];
    while(ix<ex||iy<ey){if((ix+.5)*ey<(iy+.5)*ex){x+=sx;ix++}else{y+=sy;iy++}path.push(y*W+x)}
    for(const i of path){if(K[i]===T_WATER&&X[i]<0){run.push(i);continue}lay(run);if(K[i]!==T_FORD&&X[i]<0)K[i]=T_ROAD}
    lay(run);m.roads.push({a:a.name,b:b.name,kind:'road',path});if(g.tick())yield e/list.length}
}
/* 9. camps: the classic camps' spots (scaled to the map), each on the clear ground nearest it: reachable from the first holding,
   5 tiles from every holding and 4 from the other camps, its 2 x 2 tiles and a tile round them off roads, water, fords and peaks;
   its tiles opened (the stub: wave 1 sets them in the fringe, as many as density() asks) */
function* genCamps(g){
  const m=g.map,W=m.w,Hh=m.h,K=m.kind,H=g.holdings,C=g.camps=[],reach=new Int32Array(W*Hh);
  yield* genPieces(g,reach,i=>passable(K[i]));const home=reach[H[0].ty*W+H[0].tx];
  const ok=(cx,cy)=>{if(reach[cy*W+cx]!==home||H.some(t=>(t.tx-cx)*(t.tx-cx)+(t.ty-cy)*(t.ty-cy)<25)||C.some(c=>(c.tx-cx)*(c.tx-cx)+(c.ty-cy)*(c.ty-cy)<16))return false;
    for(let y=cy-2;y<=cy+1;y++)for(let x=cx-1;x<=cx+2;x++){if(x<1||y<1||x>=W-1||y>=Hh-1)return false;const t=K[y*W+x];if(t===T_ROAD||t===T_WATER||t===T_MOUNT||t===T_FORD)return false}return true};
  for(const c of CLASSIC_CAMPS){const p=genNear(m,Math.round(c.tx*W/224),Math.round(c.ty*Hh/160),40,ok);if(!p)continue;
    for(let y=p[1]-1;y<=p[1];y++)for(let x=p[0];x<=p[0]+1;x++)K[y*W+x]=T_OPEN;C.push({tx:p[0],ty:p[1]})}
}
