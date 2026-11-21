'use strict';
/* ---------- the world's ways as the world lab draws them (engine/worldlab.js; the owner, 2026-11-15: "completely rebuild the whole
   generate engine based on the lab one", "make the lab river several sizes, there can be a big river"): when the world is painted
   finer (worldterrain.js terrainChunk) its rivers and brooks are curves through their tiles, each as wide as its size
   (WORLD_WAYS.river: a brook, then rivers one, two and three tiles wide), its water deepest down its middle, a muddy bank beside
   it, its surface stepping down the land (a fall where it drops); its roads the lab's worn tracks along the plan's lines
   (worldart.js artGenPlan, P.segs); its bridges the lab's: a deck at the road's width standing over the water, beams under it,
   piles (a stone bridge's piers and arches) down to the water, rails or parapets along it. The tiles keep the game's rules (a
   river's tiles are its water to the simulation); only the picture is the lab's. ---------- */

// (game px a lab px: WORLD_WAYS is in the lab's px, two a game px)
const WAY_LP=.5;
const wsm=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
/* the plan's ways, made once (P.ways): every river and brook a curve: its points (x, y, game px), each point's half-width hw (game
   px), its surface's level lv and its depth dp (levels, down the middle); the segments SA (ax, ay, bx, by, ha, hb: game px) and
   each one's first point SP; the roads' segments RA (as SA, from P.segs) with their kind and how far along their line each starts
   (RL); mouth: the river tiles beside the sea or a lake (their water as the shore has it) */
function waysOf(P){if(P.ways)return P.ways;
  const V=WORLD_WAYS.river,Rv=WM.river,LV=WM.lv||(WM.lv=reliefOf(WM)),N=MW*MH,X=[],Y=[],HW=[],LL=[],DP=[],SP=[],SA=[];
  // (a curve through pts ([x, y, hw, lv, dp, slack]): its corners cut three times (Chaikin's way, the ends kept; each new point
  //  keeps its nearer parent's level, so the surface steps where the tiles' did), then wandering off its line by its slack)
  //  A river's (big) line is simplified first (Douglas-Peucker, within simp of a tile of its tiles' middles), so its tiles' stairs on a
  //  slant never wiggle it, and it wanders in long, uneven bends (meanderL px, their reach varying along it, some reaches nearly
  //  straight) (the owner, 2026-11-15: "avoid having so many s curve one after another, make it like natural river")
  const simplify=(pts,eps)=>{const n=pts.length;if(n<3)return pts;const keep=new Uint8Array(n);keep[0]=keep[n-1]=1;const st=[[0,n-1]];
    while(st.length){const [a,b]=st.pop(),ax=pts[a][0],ay=pts[a][1],dx=pts[b][0]-ax,dy=pts[b][1]-ay,l=Math.hypot(dx,dy)||1;let m=-1,md=eps;
      for(let k=a+1;k<b;k++){const d=Math.abs((pts[k][0]-ax)*dy-(pts[k][1]-ay)*dx)/l;if(d>md){md=d;m=k}}if(m>=0){keep[m]=1;st.push([a,m],[m,b])}}
    return pts.filter((_,k)=>keep[k])};
  const curve=(pts,id,big)=>{let p=big?simplify(pts,V.simp*TILE):pts;if(p.length<2)return;
    for(let it=0;it<3;it++){const o=[p[0]];for(let k=0;k+1<p.length;k++){const a=p[k],b=p[k+1];o.push(a.map((v,j)=>j===3?a[3]:v*.75+b[j]*.25),a.map((v,j)=>j===3?b[3]:v*.25+b[j]*.75))}o.push(p[p.length-1]);p=o}
    const n=p.length,k0=X.length;let L=0;
    for(let k=0;k<n;k++){if(k)L+=Math.hypot(p[k][0]-p[k-1][0],p[k][1]-p[k-1][1]);const a=p[Math.max(0,k-1)],b=p[Math.min(n-1,k+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,
        f=Math.min(1,k/10,(n-1-k)/10),o=(big?((wnoise2(L/V.meanderL,id*3.7,501)-.5)*2*(.2+.8*wnoise2(L/(V.meanderL*3),id*1.9,502))+(wnoise2(L/(V.meanderL*.35),id*2.3,503)-.5)*.9):(wnoise2(L/26,id*3.7,501)-.5)*2)*Math.max(0,Math.min((big?V.meanderBig:V.meander)*WAY_LP,p[k][5]))*f;
      X.push(p[k][0]-dy/l*o);Y.push(p[k][1]+dx/l*o);HW.push(p[k][2]);LL.push(p[k][3]);DP.push(p[k][4])}
    for(let k=k0;k+1<X.length;k++){SP.push(k);SA.push(X[k],Y[k],X[k+1],Y[k+1],HW[k],HW[k+1])}};
  // (a tile's point: its middle, a river two tiles wide the middle of its 2 x 2)
  const sea=i=>tiles[i]===T_WATER&&!(Rv[i]&3),mid=(i,w)=>{const x=i%MW,y=(i-x)/MW,o=w===2?16:8;return [x*TILE+o,y*TILE+o]};
  for(const r of WM.rivers){const p=r.path.slice();if(r.mouth>=0&&p[p.length-1]!==r.mouth)p.push(r.mouth);let lv=1e9,w0=1;const pts=[];
    for(let k=0;k<p.length;k++){const i=p[k],own=Rv[i]&3,w=k<r.path.length?Math.max(1,Math.min(r.width,own||w0)):w0;w0=w;lv=Math.min(lv,LV[i]);
      const [x,y]=mid(i,own&&!sea(i)?own:w),hw=V.hw[w]*WAY_LP;pts.push([x,y,hw,lv,V.depth[w]*(.75+.5*k/Math.max(1,p.length-1)),(w===1?13:w===2?22:30)-hw])}// (deeper downstream, the lab's)
    // (its mouth on the sea or a lake: wider into it)
    if(sea(r.mouth))for(let k=Math.max(0,pts.length-3);k<pts.length;k++)pts[k][2]*=V.mouth;
    // (the tarn it rises from on high ground, the lab's: a pool at its head)
    if(pts.length>2&&pts[0][3]>=V.tarn.lv){pts[0][2]*=V.tarn.w;pts[1][2]*=(1+V.tarn.w)/2}
    curve(pts,r.id,true)}
  // the brooks (painted only: no tile of water; worldgen.js genBrook): from each head down its flow to the river, the water or the
  // brook it runs into, as wide as its flow
  const B=GEN_RIVER.brook,F=WM.flow,isB=i=>{const t=tiles[i];return t!==T_WATER&&t!==T_MOUNT&&!(Rv[i]&3)&&(F[i]&31)>=B},
    down=i=>{const [dx,dy]=DIR8[F[i]>>5]||[0,1],x=i%MW+dx,y=((i/MW)|0)+dy;return x>=0&&y>=0&&x<MW&&y<MH?y*MW+x:-1};
  const fed=new Uint8Array(N),seen=new Uint8Array(N);for(let i=0;i<N;i++)if(isB(i)){const j=down(i);if(j>=0)fed[j]=1}
  let bid=1000;
  for(let h=0;h<N;h++){if(!isB(h)||fed[h])continue;const pts=[];let i=h,lv=1e9;
    while(i>=0){const b=isB(i),own=Rv[i]&3,[x,y]=mid(i,own&&!sea(i)?own:1),q=Math.max(0,Math.min(1,((F[i]&31)-B)/2)),hw=(V.brook[0]+(V.brook[1]-V.brook[0])*q)*WAY_LP;
      lv=Math.min(lv,LV[i]);pts.push([x,y,b?hw:pts.length?pts[pts.length-1][2]:hw,lv,V.depth[0],8-hw]);if(!b||seen[i])break;seen[i]=1;i=down(i)}
    // (its spring: a small pool where it rises (the owner: "rework the stream system to make it make more sense"))
    if(pts.length>2){pts[0][2]*=V.spring;pts[1][2]*=(1+V.spring)/2}
    curve(pts,bid++)}
  const mouth=new Uint8Array(N);for(let i=0;i<N;i++){if(!(Rv[i]&3)||sea(i))continue;const x=i%MW,y=(i-x)/MW;
    for(let b=-1;b<=1&&!mouth[i];b++)for(let a=-1;a<=1;a++){const u=x+a,v=y+b;if(u>=0&&v>=0&&u<MW&&v<MH&&sea(v*MW+u)){mouth[i]=1;break}}}
  // (the roads: the plan's segments, a road's or a track's half-width; along: from the first of a run of joined segments)
  // (the plan's lines (P.segs) joined into runs and their corners rounded as the lab's road bends (its filleted arcs): cut bend times
  //  more, Chaikin's way, the ends kept; then a segment between each two points)
  const S0=P.segs,n0=S0.length/5,SX=[],RW=WORLD_WAYS.road.hw;
  for(let k0=0;k0<n0;){let k1=k0;while(k1+1<n0&&S0[(k1+1)*5]===S0[k1*5+2]&&S0[(k1+1)*5+1]===S0[k1*5+3])k1++;let p=[[S0[k0*5],S0[k0*5+1]]];for(let k=k0;k<=k1;k++)p.push([S0[k*5+2],S0[k*5+3]]);
    for(let it=0;it<WORLD_WAYS.road.bend&&p.length>2;it++){const o=[p[0]];for(let k=0;k+1<p.length;k++){const a=p[k],b=p[k+1];o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}o.push(p[p.length-1]);p=o}
    const kd=S0[k0*5+4];for(let k=0;k+1<p.length;k++)SX.push(p[k][0],p[k][1],p[k+1][0],p[k+1][1],kd);k0=k1+1}
  /* (each bridge along its road, the lab's (a true rectangle): its axis its road's own line across the water, its crossing's (the owner,
     2026-11-15: "make sure the bridge just align with the road, no need to always diagonal"; it was turned toward the road's way in
     and out further back), as long as the water plus over each side; the road joined to its two ends by a short piece each. BRG: {c, mx, my (its middle), ux, uy (along it), L (long), hw (half wide), dk (its
     deck's level), stone}, game px) */
  const BRG=[],FO=[],BW=WORLD_WAYS.bridge;
  for(const c of WM.crossings){if(c.kind!=='bridge')continue;const ex=((c.i%MW)+.5)*TILE,ey=(((c.i/MW)|0)+.5)*TILE,fx=((c.j%MW)+.5)*TILE,fy=(((c.j/MW)|0)+.5)*TILE,al=Math.hypot(fx-ex,fy-ey)||1,ax=(fx-ex)/al,ay=(fy-ey)/al;
    let ux=ax,uy=ay,L=al-TILE+BW.over*2,diag=false;const mx=(ex+fx)/2,my=(ey+fy)/2,hw=(WORLD_WAYS.road.hw[1]-1)*WAY_LP;
    /* (where its river runs on a slant (its river's square across within BW.diag radians of the diagonal to its tiles' way), it crosses it square instead, on the
       slant (the owner, 2026-11-16: "Where is diagonal bridge variation"): its axis the river's own across, turned to the nearest
       eighth of a turn, the road joined to its ends; those crossing walk its tiles straight, drawn along its deck: bridgeShift) */
    {let bd=1e9,rx=0,ry=0;for(let q=0;q<SA.length;q+=6){const x1=SA[q],y1=SA[q+1],dx=SA[q+2]-x1,dy=SA[q+3]-y1,l2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((mx-x1)*dx+(my-y1)*dy)/l2)),d=Math.hypot(mx-x1-dx*t,my-y1-dy*t);if(d<bd){bd=d;rx=dx;ry=dy}}
      const rl=Math.hypot(rx,ry);if(bd<TILE*1.5&&rl>0){let nx=-ry/rl,ny=rx/rl;if(nx*ax+ny*ay<0){nx=-nx;ny=-ny}const sn=Math.round(Math.atan2(ny,nx)/(Math.PI/4))*(Math.PI/4),qx=Math.round(Math.cos(sn)*1e6)/1e6,qy=Math.round(Math.sin(sn)*1e6)/1e6,dot=qx*ax+qy*ay;
        if(dot<.99&&Math.abs(Math.acos(Math.min(1,nx*ax+ny*ay))-Math.PI/4)<BW.diag){ux=qx;uy=qy;L=(al-TILE)*dot+BW.over*2;diag=true}}}
    BRG.push({c,mx,my,ux,uy,L,hw,dk:bridgeDeck(c),stone:!!c.stone,diag,ex,ey,fx,fy,al,ax,ay});
    SX.push(ex,ey,mx-ux*L/2,my-uy*L/2,1,mx+ux*L/2,my+uy*L/2,fx,fy,1)}
  const S=SX,nR=S.length/5,RA=new Float32Array(nR*6),RK=new Uint8Array(nR),RL=new Float32Array(nR);
  for(let k=0;k<nR;k++){const o=k*5,kd=S[o+4],road=kd<2?kd:(kd-2)&1,hw=RW[road]*WAY_LP;RK[k]=road;RA.set([S[o],S[o+1],S[o+2],S[o+3],hw,hw],k*6);
    RL[k]=k&&S[o]===S[o-3]&&S[o+1]===S[o-2]?RL[k-1]+Math.hypot(S[o-3]-S[o-5],S[o-2]-S[o-4]):0}
  // (the land a river's, a ford's or a road's tile shows beside its way: its neighbours' (the woods' floor only where most are woods))
  const land=new Uint8Array(N);for(let i=0;i<N;i++){const t=tiles[i];land[i]=t;if(t!==T_WATER&&t!==T_FORD&&t!==T_ROAD)continue;const x=i%MW,y=(i-x)/MW,n={};let best=T_OPEN,bn=0;
    for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const u=x+a,v=y+b;if(u<0||v<0||u>=MW||v>=MH)continue;const q=tiles[v*MW+u];if(q!==T_OPEN&&q!==T_FOREST&&q!==T_HILL&&q!==T_MOUNT)continue;n[q]=(n[q]||0)+1;if(n[q]>bn){bn=n[q];best=q}}
    land[i]=best===T_FOREST&&bn<5?T_OPEN:best}
  // (each road's height along it, the lab's (roadOf): the land's under it, held to grade levels a game px either way over its runs and
  //  smoothed; raised to a bridge's deck within its ramp of each end, falling away from it at the grade: RZ, each segment's ends;
  //  RB, a segment within two ramps of a bridge's end: its raised sides an earth fill, never a wall)
  const LHf=landHeight(WM),RZ=new Float32Array(nR*2),RB=new Uint8Array(nR),G=WORLD_WAYS.road.grade,lvAt=(x,y)=>LHf(x*2,y*2),
    decks=WM.crossings.filter(c=>c.kind==='bridge').map(c=>{const d=bridgeDeck(c);return [((c.i%MW)+.5)*TILE,(((c.i/MW)|0)+.5)*TILE,((c.j%MW)+.5)*TILE,(((c.j/MW)|0)+.5)*TILE,d]});
  for(let k0=0;k0<nR;){let k1=k0;while(k1+1<nR&&RL[k1+1]>0)k1++;const px=[S[k0*5]],py=[S[k0*5+1]];for(let k=k0;k<=k1;k++){px.push(S[k*5+2]);py.push(S[k*5+3])}
    const n=px.length,z=px.map((x,i)=>lvAt(x,py[i])),d=[0];for(let i=1;i<n;i++)d.push(Math.hypot(px[i]-px[i-1],py[i]-py[i-1]));
    const lift=()=>{for(let i=0;i<n;i++)for(const [ax,ay,bx,by,dk] of decks)if(Math.hypot(px[i]-ax,py[i]-ay)<WORLD_WAYS.bridge.fill||Math.hypot(px[i]-bx,py[i]-by)<WORLD_WAYS.bridge.fill)z[i]=Math.max(z[i],dk)};
    for(let it=0;it<6;it++){for(let i=1;i<n;i++)z[i]=Math.min(Math.max(z[i],z[i-1]-G*d[i]),z[i-1]+G*d[i]);for(let i=n-2;i>=0;i--)z[i]=Math.min(Math.max(z[i],z[i+1]-G*d[i+1]),z[i+1]+G*d[i+1])}
    for(let it=0;it<2;it++){const q=z.slice();for(let i=0;i<n;i++){let a=0,m=0;for(let j=Math.max(0,i-3);j<=Math.min(n-1,i+3);j++){a+=q[j];m++}z[i]=a/m}}
    lift();for(let it=0;it<3;it++){for(let i=1;i<n;i++)z[i]=Math.max(z[i],z[i-1]-G*d[i]);for(let i=n-2;i>=0;i--)z[i]=Math.max(z[i],z[i+1]-G*d[i+1])}
    const nearB=i=>decks.some(([ax,ay,bx,by])=>Math.min(Math.hypot(px[i]-ax,py[i]-ay),Math.hypot(px[i]-bx,py[i]-by))<2*WORLD_WAYS.bridge.ramp);
    for(let k=k0;k<=k1;k++){RZ[k*2]=z[k-k0];RZ[k*2+1]=z[k-k0+1];RB[k]=nearB(k-k0)||nearB(k-k0+1)?1:0}
    k0=k1+1}
  /* (a stream under every road it crosses (the owner, 2026-11-15: "There should be no river crossing the road like that"): a brook is
     painted only, no tile of water, so the roads were laid over it with no crossing; now where a road's line crosses a brook's
     (not within a river's or a crossing's tiles) the road crosses it: on a track, or over a brook narrower than brook.ford px, at a
     ford (FO; the owner: "also add a small stony ford", then "No need to be human made stone ford": a natural one, the stream
     spread shallow over gravel along the road, wet gravel on its banks: worldterrain.js),
     else on a small bridge along the road (BRG, small: stone), as long as the brook is wide and its banks (brook.span px each side,
     abut px more each end), its deck at the road's height or clear of the water by brook.clear levels, whichever is higher: the
     road's band cut away under its open span (bridgeOpen), the water running under it. The roads go round streams where they can
     (worldplace.js PLACE_ROAD.brook), so there are few) */
  {const BB=WORLD_WAYS.bridge.brook,bmax=V.brook[1]*WAY_LP+.01,nS=SA.length/6,G=new Map(),cs=32,key=(x,y)=>Math.floor(x/cs)*65536+Math.floor(y/cs);
    for(let q=0;q<nS;q++){const o=q*6;if(Math.max(SA[o+4],SA[o+5])>bmax)continue;const x0=Math.min(SA[o],SA[o+2]),x1=Math.max(SA[o],SA[o+2]),y0=Math.min(SA[o+1],SA[o+3]),y1=Math.max(SA[o+1],SA[o+3]);
      for(let gx=Math.floor(x0/cs);gx<=Math.floor(x1/cs);gx++)for(let gy=Math.floor(y0/cs);gy<=Math.floor(y1/cs);gy++){const k=gx*65536+gy;let L=G.get(k);if(!L)G.set(k,L=[]);L.push(q)}}
    const near=(x,y,d)=>BRG.some(b=>(b.mx-x)*(b.mx-x)+(b.my-y)*(b.my-y)<d*d)||FO.some(b=>(b.mx-x)*(b.mx-x)+(b.my-y)*(b.my-y)<d*d),wetT=(x,y)=>{const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);if(tx<0||ty<0||tx>=MW||ty>=MH)return true;const i=ty*MW+tx;return tiles[i]===T_WATER||tiles[i]===T_FORD||(Rv[i]&3)>0};
    for(let k=0;k<nR;k++){const o=k*6,ax=RA[o],ay=RA[o+1],bx=RA[o+2],by=RA[o+3],dx=bx-ax,dy=by-ay,seen=new Set();
      for(let gx=Math.floor(Math.min(ax,bx)/cs);gx<=Math.floor(Math.max(ax,bx)/cs);gx++)for(let gy=Math.floor(Math.min(ay,by)/cs);gy<=Math.floor(Math.max(ay,by)/cs);gy++){const L=G.get(gx*65536+gy);if(!L)continue;
        for(const q of L){if(seen.has(q))continue;seen.add(q);const p=q*6,cx=SA[p],cy=SA[p+1],ex=SA[p+2]-cx,ey=SA[p+3]-cy,den=dx*ey-dy*ex;if(Math.abs(den)<1e-6)continue;
          const t=((cx-ax)*ey-(cy-ay)*ex)/den,u=((cx-ax)*dy-(cy-ay)*dx)/den;if(t<0||t>1||u<0||u>1)continue;const mx=ax+dx*t,my=ay+dy*t;
          if(wetT(mx,my)||near(mx,my,BB.apart))continue;const l=Math.sqrt(dx*dx+dy*dy)||1,a=SP[q],hb=SA[p+4]+(SA[p+5]-SA[p+4])*u,wl=riverSurf(LL[a],LL[a+1],u),rz=RZ[k*2]+(RZ[k*2+1]-RZ[k*2])*t;
          const b={c:null,small:true,mx,my,ux:dx/l,uy:dy/l,L:2*(hb+BB.span+WORLD_WAYS.bridge.abut),hw:(RW[RK[k]]-1)*WAY_LP,dk:Math.max(rz,wl+BB.clear),stone:true,hb};
          (RK[k]===0||hb<BB.ford?FO:BRG).push(b)}}}}
  /* (the roads' dead ends: a segment's end no other segment of a road meets, and no bridge's deck: there the road fades into the land
     over WORLD_WAYS.road.fade game px (the owner: "at the end of the road should blend completely")) */
  const EN=[];{const deg=new Map(),kk=(x,y)=>Math.round(x*2)+','+Math.round(y*2);for(let k=0;k<nR;k++){const o=k*6;for(const e of [0,2]){const q=kk(RA[o+e],RA[o+e+1]);deg.set(q,(deg.get(q)||0)+1)}}
    // (an end that meets another road at a T, on its line not its corner, or a bridge's end as far as its deck may run on: joined, no fade
    //  (the owner, 2026-11-18: "Why bridge not connect to the land?": the track off a bridge's end faded out where it met the road))
    const cs=32,SG=new Map(),gk=(x,y)=>Math.floor(x/cs)*65536+Math.floor(y/cs);for(let k=0;k<nR;k++){const o=k*6;for(let gx=Math.floor(Math.min(RA[o],RA[o+2])/cs);gx<=Math.floor(Math.max(RA[o],RA[o+2])/cs);gx++)for(let gy=Math.floor(Math.min(RA[o+1],RA[o+3])/cs);gy<=Math.floor(Math.max(RA[o+1],RA[o+3])/cs);gy++){const q=gx*65536+gy;let L=SG.get(q);if(!L)SG.set(q,L=[]);L.push(k)}}
    const run=new Int32Array(nR);for(let k=0;k<nR;k++)run[k]=k&&RL[k]>0?run[k-1]:k;
    const meets=(k,x,y)=>{for(let gx=Math.floor((x-8)/cs);gx<=Math.floor((x+8)/cs);gx++)for(let gy=Math.floor((y-8)/cs);gy<=Math.floor((y+8)/cs);gy++)for(const j of SG.get(gx*65536+gy)||[]){if(run[j]===run[k])continue;
      const o=j*6,ax=RA[o],ay=RA[o+1],dx=RA[o+2]-ax,dy=RA[o+3]-ay,l2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/l2));if(Math.hypot(x-ax-dx*t,y-ay-dy*t)<RA[o+4])return true}return false};
    for(let k=0;k<nR;k++){const o=k*6;for(const e of [0,2]){const x=RA[o+e],y=RA[o+e+1];if(deg.get(kk(x,y))!==1)continue;const R=WORLD_WAYS.bridge.reach+10;if(BRG.some(b=>{const dx=x-b.mx,dy=y-b.my;return dx*dx+dy*dy<(b.L/2+R)*(b.L/2+R)}))continue;if(meets(k,x,y))continue;EN.push(x,y)}}}

  return P.ways={bridges:BRG,fords:FO,ends:Float32Array.from(EN),RZ,RB,land,X:Float32Array.from(X),Y:Float32Array.from(Y),HW:Float32Array.from(HW),LV:Float32Array.from(LL),DP:Float32Array.from(DP),SP:Int32Array.from(SP),SA:Float32Array.from(SA),RA,RK,RL,mouth}}

/* the nearest of a set of segments (A: ax, ay, bx, by, ha, hb, game px) to every px of a window (x0, y0, w x h, in px sc a game px),
   within reach px past its edge: S how far past its edge (px; < 0 within it), Q the segment (-1 none), T how far along it (0-1) */
function* waysBand(A,x0,y0,w,h,sc,reach){const S=new Float32Array(w*h).fill(1e9),Q=new Int32Array(w*h).fill(-1),T=new Float32Array(w*h),n=A.length/6;let work=0;
  for(let s=0,o=0;s<n;s++,o+=6){const ha=A[o+4]*sc,hb=A[o+5]*sc,R=Math.max(ha,hb)+reach,ax=A[o]*sc-x0,ay=A[o+1]*sc-y0,bx=A[o+2]*sc-x0,by=A[o+3]*sc-y0;
    const xa=Math.max(0,Math.floor(Math.min(ax,bx)-R)),xb=Math.min(w-1,Math.ceil(Math.max(ax,bx)+R)),ya=Math.max(0,Math.floor(Math.min(ay,by)-R)),yb=Math.min(h-1,Math.ceil(Math.max(ay,by)+R));
    if(xa>xb||ya>yb)continue;const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy||1;
    for(let y=ya;y<=yb;y++){const py=y+.5-ay;for(let x=xa;x<=xb;x++){const px=x+.5-ax,t=Math.max(0,Math.min(1,(px*dx+py*dy)/l2)),ex=px-dx*t,ey=py-dy*t,d=Math.sqrt(ex*ex+ey*ey)-(ha+(hb-ha)*t),j=y*w+x;
        if(d<S[j]){S[j]=d;Q[j]=s;T[j]=t}}
      if((work+=xb-xa+1)>60000){work=0;yield}}}
  return {S,Q,T}}

// a river's water (the lab's underWater with its river's colours): d its depth (levels), its bed of pebbles showing in the shallows,
// light caught there; a ford's gravel bar (ford: how much of one, 0-1: its bed's gravel showing, riffles running white where it meets
// the deeper water, stepping stones down its middle; WORLD_WAYS.river.fordBar); the frost's edges frozen (q: how far out from the middle, 0-1);
// still: how much of the still water's it is where it runs into a lake or the sea (its colours and bed theirs, its ripples gone; 0-1)
function wayWater(Q,cl,fx,fy,d,q,ford,fa,fc,fe,still=0){const S=still>0?Q.river.map((v,i)=>tmix(v,Q.sea[i],still)):Q.river,CL=WORLD_TERRAIN.water.clear,clear=CL+(WORLD_TERRAIN.clear-CL)*still;
  if(cl==='frost'&&q>.62+(wnoise2(fx/14,fy/14,511)-.5)*.5){let c=tpick(Q.ice,fx,fy,512);if(Math.abs(wnoise2(fx/10,fy/10,513)-.5)<.02)c=tmul(c,.86);return c}
  let c=d<.4?tmix(S[0],S[1],d/.4):d<1?tmix(S[1],S[2],(d-.4)/.6):tmix(S[2],S[3],Math.min(1,d-1));
  // (over a ford's bar its own fine gravel instead; into still water its sandy bed)
  const a=Math.pow(Math.max(0,1-d/clear),1.4)*(ford>0?1-.75*ford:1),pb=Q.pebble[Math.floor(hs(fx>>1,fy>>1,514)*4)];c=tmix(c,still>0?tmix(pb,Q.bed[1],still):pb,a*.8);if(a>.15&&wnoise2(fx/3,fy/3,515)>.74)c=tmix(c,[232,246,246],.22*a);
  if(ford>0){const B=WORLD_WAYS.river.fordBar,g=tmix(WAY_COL.gravel[Math.floor(hs(fx,fy,516)*3)],S[1],.35);c=tmix(c,g,ford*B.gravel*(.55+.9*wnoise2(fx/3.5,fy/3.5,520)));
    if(ford>.12&&ford<.75&&wnoise2((fa??fx)/5,(fc??fy)/1.4,521)>B.riffle)c=tmix(c,WAY_COL.foam,.62*(1-Math.abs(ford-.42)/.34));
    if(ford>.55){const C=B.cell,cx=Math.floor(fx/C),cy=Math.floor(fy/C);if(hs(cx,cy,522)<B.stone){const sx=(cx+.25+hs(cx,cy,523)*.5)*C,sy=(cy+.25+hs(cx,cy,524)*.5)*C,dx=fx+.5-sx,dy=fy+.5-sy,R=1.2+hs(cx,cy,525)*.9;
      if(dx*dx+dy*dy<R*R)c=WAY_COL.stone[dx+dy<-.4?0:dx+dy>.8?2:1];else if(dy>0&&dy<R+1&&dx*dx+(dy-1)*(dy-1)<R*R)c=tmul(c,.82)}}}
  else if(d<.6&&hs(fx,fy,518)<.004)c=WAY_COL.stone[1];
  // (a ripple now and then along the current, lighter (fa, fc: how far along its line and across it, fe how far out of its main
  //  stream, fewer farther out; none given: along the screen's rows)
  if(d>.3&&still<.9&&(fa===undefined?wnoise2(fx/9,fy/2.5,519)>.8:wnoise2(fa/9,fc/2.5,519)>.8+.08*Math.min(1.5,fe)+.2*still))c=tmix(c,Q.fall[1],(fe>1?.14:.22)*(1-still));
  return c}
// the lab's colours of the ways (its RCOL, plank, beam, stone, reeds)
const WAY_COL={pack:[[176,148,104],[168,140,98]],groove:[118,94,66],crown:[[150,124,86],[142,116,80]],loose:[[136,110,76],[126,102,70],[146,120,84]],
  gravel:[[178,170,154],[150,144,130],[118,112,102]],soil:[96,78,54],sky:[170,196,210],puddle:[118,138,150],
  plank:[[154,112,70],[138,98,60],[166,124,80]],beam:[[92,64,40],[70,48,30]],lit:[204,170,120],stone:[[176,170,156],[150,144,132],[118,114,106]],cap:[206,200,186],
  sett:[[160,154,140],[140,134,122],[176,170,156]],reed:[[120,150,64],[96,124,52],[150,118,72]],foam:[236,244,246]};
/* a dirt road as it is worn (the lab's roadCol): sd its side of the middle (signed, px), hw its half-width there, t how far along
   (px), flat (no puddle on a slope), land the ground's colour (its tufts on the crown, the grass creeping in at its verge): two
   wheel tracks wandering a little, a dark groove down each, the crown between them, loose ground and gravel outside them, puddles
   in the tracks where it is flat. k: px a lab px */
function wayRoad(fx,fy,sd,hw,t,flat,land,k){const RR=WORLD_WAYS.road,C=WAY_COL,a=Math.abs(sd);let c;
  // (no wheel ruts painted (the owner: "the road should not have that cart tracks, since we also have a cart tracks generated": the
  //  bands' own tracks, world/tracks.js): its packed crown worn in patches, loose at its sides)
  if(a<hw*.72){c=C.crown[wnoise2(fx/5,fy/5,523)>.5?0:1];const p=wnoise2(fx/(6*k),fy/(6*k),522);if(p>.6)c=C.pack[p>.72?0:1];if(flat&&wnoise2(fx/4,fy/4,524)>.6)c=tmix(c,land,.6)}
  else{c=C.loose[Math.floor(wnoise2(fx/3,fy/3,525)*2.99)];if(hs(fx,fy,526)<RR.gravel)c=C.gravel[Math.floor(hs(fx,fy,527)*3)]}
  if(flat&&a<hw*.72){const p=wnoise2(fx/14/k,fy/14/k,528)*.6+wnoise2(fx/5/k,fy/5/k,529)*.4;if(p>RR.puddle){c=p-RR.puddle<.02?C.soil:tmix(tmix(C.puddle,C.soil,.4),C.sky,hs(fx>>1,fy,530)<.15?.45:.1)}}
  // (the verge: the grass creeping in, dithered, the trodden soil inside it)
  const v=Math.abs(sd)-(hw-3.5*k);if(v>0){if(hs(fx,fy,531)<v/(3.5*k)*.9+(wnoise2(fx/3,fy/3,532)-.5)*.5)c=land;else if(v<1.2*k)c=tmix(c,C.soil,.5)}
  return c}

/* a bridge's own picture, the lab's (engine/worldlab.js paint, the bridge: a structure over the land, only its parts drawn; the owner,
   2026-11-15: "Can you confirm me that the bridge is draw over the terrain (separated layer)"): a layer of its own over the land, which
   lies whole under it. A true rectangle along its road (P.ways.bridges), its deck at its level (DL fine px up): planks across it, a
   thin gap between, worn where the wheels go (a stone one's setts); a beam under its every edge; under its near (south) edge piles
   (a stone one's piers and arches) down to what lies under it (its lift where its chunk is painted: worldterrain.js liftAt), only
   where it stands over open space, evenly, braced between, foam and a ripple at their feet in water; rails on posts along both its sides
   on their very edge, a taller post at each corner (a stone one's capped parapets), its north rail's shade on the deck; its shadow on
   what lies under it, to the south-east (the owner, 2026-11-15: "make sure the bridge look like the bridge", the lab's). Px by px, north to south, the nearer over the farther. At r fine px a game px: {cv, x, y (its corner, map px), y1 (its
   south edge on the ground, map px)} */
/* a bridge's end comes down to a bank lower than its deck by stairs (the owner, 2026-11-21: "Why dont you make a stairs based on the
   height that player have to go up?"), as many steps as the height: bridgeFall(d, k): how far under its deck (fine px) it stands d
   fine px out along its stairs, a step of stair.rise down every stair.tread (lab px, k fine px each), the first at its deck's end */
function bridgeFall(d,k){const S=WORLD_WAYS.bridge.stair;return d>0?Math.ceil(d/(S.tread*k))*S.rise*k:0}
// (its height (fine px) t fine px along it from its first end: p its picture's measures (b.pr))
function bridgeH(p,t){const k=p.r/2;return t<p.sA?p.DL-bridgeFall(p.sA-t,k):t>p.sB?p.DL-bridgeFall(t-p.sB,k):p.DL}
function bridgePic(b,r){const BG=WORLD_WAYS.bridge,C=WAY_COL,lh=WORLD_TERRAIN.lh,k=r/2;
  {const mx=b.mx*r,my=b.my*r,ux=b.ux,uy=b.uy,nx=-uy,ny=ux,hl=b.L*r/2,hw=Math.round(b.hw*r),R=Math.round(BG.rail*k),SH=Math.ceil(BG.shade*k);
    // (what lies under it: the land's lift there (fine px) and whether it is water: the water as drawn where its chunk is painted, else the tiles')
    const liftF=(fx,fy)=>Math.round(liftAt(fx/r,fy/r)*r),wetT=(fx,fy)=>{const tx=Math.floor(fx/r/TILE),ty=Math.floor(fy/r/TILE);if(tx<0||ty<0||tx>=MW||ty>=MH)return 0;const i=ty*MW+tx;return tiles[i]===T_WATER||WM.river[i]&3?1:0},
      wetF=(fx,fy)=>typeof drawnWet==='function'&&drawnWet(fx/r,fy/r)?1:wetT(fx,fy);
    /* (its ends on the land (the owner, 2026-11-16: "Make sure bridge fully connect to the land"): each runs on past the water as it is
       drawn under its middle to dry ground, and up a bank's face to its top (on to the first dry ground at its deck's level within reach),
       reach game px at most; its deck at its level or the higher bank's; to a lower
       bank its stairs come down (bridgeFall), a stone abutment under them: never a gap at its end) */
    const wetAt=s=>wetF(mx+ux*s,my+uy*s),upAt=s=>liftF(mx+ux*s,my+uy*s),D0=Math.round(b.dk*lh),
      // (a bank's top at the deck's level within reach: the deck runs on to it, over the low shore or the water before it (the owner,
      //  2026-11-18: "Why bridge not connect to the land?"), never ending on a strip of shore against the bank's face; its end already on
      //  such ground: no further, never on over the water past a strip of land; none: as below)
      top=sg=>{for(let e=-1;e<=BG.reach*r;e++){const s1=sg*(hl+e+1);if(!wetAt(s1)&&upAt(s1)>=D0-k)return Math.max(0,e)}return -1},
      runOn=sg=>{const t0=top(sg);if(t0>=0)return t0;let e=0;while(e<BG.reach*r){const s1=sg*(hl+e+1);if(!(wetAt(s1)||wetAt(sg*(hl+e+3))||upAt(sg*(hl+e+4*k))>upAt(s1)+k))break;e++}return e};
    const eA=runOn(-1),eB=runOn(1),lA=Math.max(0,liftF(mx-ux*(hl+eA+2),my-uy*(hl+eA+2))),lB=Math.max(0,liftF(mx+ux*(hl+eB+2),my+uy*(hl+eB+2))),DL=Math.max(Math.round(b.dk*lh),lA,lB);
    // (its stairs fall from the deck (bridgeFall) till they meet the land under them, never past it into a hollow with the land rising again)
    const ramp=(sg,e0)=>{const n=Math.ceil(DL*BG.stair.tread/BG.stair.rise);for(let e=0;e<=n;e++)if(upAt(sg*(hl+e0+e))>=DL-bridgeFall(e,k)-k)return e;return n};
    const rA=ramp(-1,eA),rB=ramp(1,eB),lo=-(hl+eA+rA),hi=hl+eB+rB,LEN=hi-lo,sA=-(hl+eA)-lo,sB=hl+eB-lo,
      HL=Math.max(-lo,hi),pr=b.pr={lo,hi,sA,sB,DL,r,lA,lB},H=t=>bridgeH(pr,t);
    const CS=BG.cast,CX=Math.ceil(CS[0]*DL),CY=Math.ceil(CS[1]*DL);// (its shadow's reach from its deck at its highest: cast)
    const ext=Math.abs(ux)*HL+Math.abs(nx)*hw+2,eyt=Math.abs(uy)*HL+Math.abs(ny)*hw+2,bx0=Math.floor(mx-ext),bx1=Math.ceil(mx+ext)+SH+CX,by0=Math.floor(my-eyt),by1=Math.ceil(my+eyt);
    const py0=by0-DL-R-3,PW=bx1-bx0+1,PH=by1+SH+CY+2-py0+1,img=new ImageData(PW,PH),O=img.data;
    const put=(x,y,c,a=255)=>{x-=bx0;y-=py0;if(x<0||y<0||x>=PW||y>=PH)return;const o=(y*PW+x)*4;if(a<255&&O[o+3]===255)return;O[o]=c[0];O[o+1]=c[1];O[o+2]=c[2];O[o+3]=a};
    const inB=(x,y)=>{const dx=x+.5-mx,dy=y+.5-my,t=dx*ux+dy*uy,v=dx*nx+dy*ny;return t>=lo&&t<=hi&&Math.abs(v)<=hw},TV=(x,y)=>{const dx=x+.5-mx,dy=y+.5-my;return [dx*ux+dy*uy-lo,dx*nx+dy*ny]};
    // (its north side: the side whose rail shades the deck (the sun from the north-west); a side px: on its edge, along a long side)
    const north=ny<0||ny===0&&nx<0?1:-1,side=(x,y,v)=>Math.abs(v)>=hw-1.5*k&&(!inB(x-1,y)||!inB(x+1,y)||!inB(x,y-1)||!inB(x,y+1));
    const pile=BG.pile*k,arch=BG.arch*k,post=BG.post*k,beam=Math.round(3*k),FL=BG.flag,CW=BG.cut;
    // (a px of stone laid in courses (3 lab px high, joints staggered every 4), a little lit or shaded by sh: piers, abutments, cutwaters)
    const course=(x,yy,sh=1)=>{const row=Math.floor(yy/(3*k)),j=((x+(row&1)*2*k)%(4*k)+4*k)%(4*k);return tmul(j<.9||((yy%(3*k))+3*k)%(3*k)<.9?C.stone[2]:C.stone[hs(Math.floor((x+(row&1)*2*k)/(4*k)),row,547)<.5?0:1],sh)};
    /* (where it stands over open space: along its middle, over water or a drop under its beams of more than open px (the owner,
       2026-11-15: "if the foundation already cover like certain amount of the bridge then we should leave it open like real bridge"):
       its supports only there, evenly, a pile at each end of it and every pile px at most between (a stone one's piers, an arch every
       arch px at most); where the bank under it carries it (its foundation), nothing under its deck) */
    const atT=t=>[mx+ux*(t+lo),my+uy*(t+lo)];let oa=-1,ob=-1;
    for(let t=0;t<=LEN;t++){const [fx,fy]=atT(t);if(wetF(fx,fy)||H(t)-liftF(fx,fy)>beam+BG.open*k){if(oa<0)oa=t;ob=t}}
    const sup=[];if(oa>=0){const n=Math.max(1,Math.ceil((ob-oa)/(b.stone?arch:pile)));for(let i=0;i<=n;i++)sup.push(oa+(ob-oa)*i/n)}
    const bay=t=>{let i=0;while(i+2<sup.length&&t>=sup[i+1])i++;return [t-sup[i],sup[i+1]-sup[i]]},nearS=t=>{let d=1e9;for(const s of sup)d=Math.min(d,Math.abs(t-s));return d};
    /* (its shadow on the water or the land under it, cast to the south-east by its height (the owner, 2026-11-21: "it like floating,
       even weird to draw over trees without shadow or something to tell that it's higher"): each px of its deck throws its shadow
       cast x its height over what lies under it away (fine px east and south a px of height), SH more, on the ground there at its
       own lift. So a deck high over a low bank lies well off its shadow, a ramp's shadow closes on it as it comes down, and one on
       the ground has none: its height read off the gap, where its shadow was SH px off it whatever its height) */
    for(let y=by0;y<=by1;y++)for(let x=bx0-CX;x<=bx1;x++)if(inB(x,y)){const [t]=TV(x,y),hh=Math.max(0,H(t)-liftF(x,y)),gx=Math.round(x+SH+CS[0]*hh),gy=Math.round(y+SH+CS[1]*hh);
      put(gx,gy-liftF(gx,gy),[14,20,28],BG.shadow);if(hh>2)put(gx+1,gy-liftF(gx,gy),[14,20,28],BG.shadow)}
    // (a bridge running north and south: its piers stand out of its sides as cutwaters, pointed up- and downstream, each pier's lit
    //  cap and south face down to the water under its deck's beams, foam at its foot; its long sides show no piers else)
    if(Math.abs(uy)>Math.abs(ux)&&sup.length){const out=CW.out*k,half=(b.stone?CW.half:CW.half*.6)*k,inP=(x,y)=>{const [t,v]=TV(x,y),e=Math.abs(v)-hw;
        for(const s0 of sup){if(s0<CW.end*k||s0>LEN-CW.end*k)continue;// (a support at its very end is its abutment on the bank: no pier standing out of the water there, a block of bridge beside the road)
          const d=Math.abs(t-s0),w=e>0?half*(1-e/out):half;if(e<out&&d<=w){const [fx,fy]=atT(s0);if(wetF(fx,fy)||DL-liftF(fx,fy)>beam+BG.open*k)return true}}return false};
      for(let y=by0-out;y<=by1+out;y++)for(let x=bx0-out;x<=bx1+out;x++){if(!inP(x,y))continue;const lf=liftF(x,y),top=y-DL+beam+1;if(y-lf<=top)continue;
        put(x,top,inP(x,y-1)?C.stone[0]:C.cap);if(inP(x,y+1))continue;const lit=!inP(x-1,y);
        for(let yy=top+1;yy<y-lf;yy++)put(x,yy,course(x,yy,lit?1.08:.94));if(wetF(x,y)){put(x,y-lf,C.foam);put(x+1,y-lf,C.foam,150)}}}
    for(let y=by0;y<=by1;y++)for(let x=bx0;x<=bx1;x++){if(!inB(x,y))continue;const [t,v]=TV(x,y),sy=y-Math.round(H(t)),pl=Math.floor(t/(4*k));
      // (the deck: planks across, a thin gap between, knots, worn where the wheels go; a stone one's setts; shaded inside its north rail,
      //  lit along its north edge)
      let c;if(b.stone){const vv=v+hw,FW=FL.w*k,FH=FL.h*k;
        if(hw-Math.abs(v)<FL.kerb*k){c=tmul(C.stone[1],(Math.floor(t/FW)&1)?.96:1.03);if(t%FW<.8)c=tmul(c,FL.mortar)}
        else{const row=Math.floor(vv/FH),o=(row&1)*FW/2,q=hs(Math.floor((t+o)/FW),row,541);c=tmul(C.sett[0],1-FL.vary/2+FL.vary*q);if((t+o)%FW<.8||vv%FH<.8)c=tmul(c,FL.mortar);else if(hs(x,y,545)<.06)c=tmul(c,.94)}}
      else{c=C.plank[Math.floor(hs(pl,7,542)*3)];if(t%(4*k)<.6*k)c=tmul(C.plank[1],.72);else if(hs(pl,Math.floor(v/k),543)<.05)c=tmul(c,.82);if((Math.abs(v)>hw-2.2*k)&&hs(pl,v>0?1:2,544)<.5)c=tmul(c,.9)}
      if(Math.abs(Math.abs(v)-hw*WORLD_WAYS.road.track)<1.3*k)c=tmul(c,.92);if(v*north>hw-1.5*k-2.5*k&&v*north<hw-1.5*k)c=tmul(c,.82);if(!inB(x,y-1))c=tmul(c,1.1);
      // (on its stairs: each tread a slab, shaded by turns, its outer edge lit; where they come down toward you, each one's riser
      //  under its edge, down to the tread below)
      const dS=t<sA?sA-t:t>sB?t-sB:0;if(dS>0){const ST=BG.stair,TW=ST.tread*k,n=Math.ceil(dS/TW);c=tmul(b.stone?C.stone[1]:C.plank[0],ST.shade[n&1]);if(n*TW-dS<1)c=tmul(c,ST.nose)}
      put(x,sy,c);if((t<sA||t>sB)&&inB(x,y+1)){const dz=Math.round(H(t))-Math.round(H(TV(x,y+1)[0]));for(let j=1;j<=dz;j++)put(x,sy+j,tmul(b.stone?C.stone[2]:C.beam[0],BG.stair.riser))}
      // (a beam under its every edge)
      //  (its face under its edge where it stands over the ground: a stone one's dressed stone, its lit lip and its shade under it, not
      //   timber; a wooden one's beam; none where its end lies on the land)
      const south=!inB(x,y+1),edge=south||!inB(x-1,y)||!inB(x+1,y),hg=Math.round(H(t))-liftF(x,y+1);
      if(edge&&hg>1)for(let j=1;j<=Math.min(hg,beam);j++)put(x,sy+j,b.stone?(j===1?C.cap:j===beam?tmul(C.stone[2],.82):course(x,sy+j,.94)):j<=k?C.beam[0]:tmul(C.beam[0],.8));
      // (under its near (south) edge, down to what lies under it: piles braced between (a stone one's piers and arches), stone only at its
      //  very ends (its abutments); foam and a ripple at their feet in water)
      // (past its supports, on the land: its abutment, stone in courses down to the ground under it)
      if(south&&!(sup.length&&t>=sup[0]-2.5*k&&t<=sup[sup.length-1]+2.5*k)){
        // (its very end, where its deck stops across its way: its face down to the bank it lands on (lA, lB), never on down past it to
        //  water beside the bank: a shore crossing its end aslant left half of it over the water and a sheer wall of 20 px down to it
        //  beside the road, a piece of bridge out of place (the owner, 2026-11-21: "Bridge still bug"))
        const tS=TV(x,y+1)[0],gy=y+1-Math.max(liftF(x,y+1),tS<0?lA:tS>LEN?lB:0);for(let yy=sy+beam+1;yy<gy;yy++)put(x,yy,course(x,yy,yy===gy-1?.86:1));continue}
      if(south&&sup.length&&t>=sup[0]-2.5*k&&t<=sup[sup.length-1]+2.5*k){const tS=TV(x,y+1)[0],lf=Math.max(liftF(x,y+1),tS<0?lA:tS>LEN?lB:0),gy=y+1-lf,// (its very end's pier the same: down to its bank, as its abutment above)
        top=sy+beam+1;if(gy<=top)continue;const n2=gy-top,wet=wetF(x,y+1)&&lf===liftF(x,y+1),d=nearS(t),[tp,s]=bay(t),pw=b.stone?2.5*k:k;
        for(let yy=top;yy<gy;yy++){const dz=yy-top;let c2=null;
          if(d<pw)c2=b.stone?course(x,yy,d>pw-k?.8:1):d<pw/2?C.plank[1]:C.beam[0];
          else if(b.stone){const q=(tp-pw)/Math.max(1,s-2*pw),ar=(n2-2*k)*(1-Math.sqrt(Math.max(0,1-(2*q-1)*(2*q-1))))+2*k;
            if(dz<ar-2*k)c2=C.stone[(Math.floor(yy/(3*k))+(x>>1))%2?0:1];else if(dz<ar)c2=(Math.floor(tp/(2*k))&1)?tmul(C.stone[0],1.06):C.stone[1];else{put(x,yy,[30,36,44],dz<ar+3*k?210:120);continue}}
          else if(n2>5*k&&s>4*k&&(Math.abs(tp-pw-dz*(s-2*pw)/n2)<.8*k||Math.abs(s-pw-tp-dz*(s-2*pw)/n2)<.8*k))c2=tmul(C.beam[0],.9);
          if(c2)put(x,yy,c2)}
        if(wet&&d<pw){put(x,gy,C.foam);put(x-1,gy+1,C.foam,170);put(x+1,gy+1,C.foam,170)}}}
    // (the rails on posts, or the parapets, along both its long sides on its very edge, rising rail px over it: a post every post px,
    //  a taller one at each corner, its top rail lit, its shadow under it, a middle rail; a stone one's parapet capped and coursed)
    for(let y=by0;y<=by1;y++)for(let x=bx0;x<=bx1;x++){if(!inB(x,y))continue;const [t,v]=TV(x,y);if(!side(x,y,v))continue;const sy=y-Math.round(H(t)),end=Math.min(t,LEN-t),ps=((t%post)+post)%post<1.2*k;
      if(b.stone){const pier=end<2.5*k||Math.abs(t-sA)<2*k||Math.abs(t-sB)<2*k,H=R+(pier?k:0);for(let j=1;j<=H;j++)put(x,sy-j,j===H?C.cap:j===H-1?C.stone[0]:j===1?tmul(C.stone[2],.8):(j===Math.ceil(H/2)||((x>>1)+(j>H/2?1:0))%3===0)?C.stone[2]:tmul(C.stone[1],1.04))}
      else if(end<1.5*k)for(let j=1;j<=R+2;j++)put(x,sy-j,j>=R+1?C.lit:j===1?C.beam[1]:C.beam[0]);
      else if(ps)for(let j=1;j<=R+1;j++)put(x,sy-j,j>=R?C.lit:C.beam[1]);
      else if(end>=k){put(x,sy-R,C.lit);put(x,sy-R+1,C.beam[1]);put(x,sy-(R>>1),C.plank[0]);put(x,sy-(R>>1)+1,C.beam[1])}}
    const cv=mkcv(PW,PH);cv.getContext('2d').putImageData(img,0,0);return {cv,x:bx0/r,y:py0/r,y1:(by1+1)/r}}}

/* the bridges as their own layer (render.js drawWorld, through worldterrain.js terrainEnts): each in view among what stands, by its south
   edge, its picture made once its land is painted (its chunk's lift known) and kept for the scene's resolution; one in water under a
   bridge has the bridge drawn again over him (bridgeOver: worldterrain.js liftDraw) */
function bridgeEnts(ents,cam){const r=sceneRes(),P0=WorldArt.plan;if(!P0)return;const BRS=waysOf(P0).bridges;if(!BRS)return;
  for(const b of BRS){const ex=b.L/2+b.hw+8+WORLD_WAYS.bridge.reach*2;if(b.mx+ex<cam.x||b.mx-ex>cam.x+VW||b.my+ex<cam.y||b.my-ex-40>cam.y+VH||!seenAny(b.mx-b.L/2,b.my-b.L/2,b.mx+b.L/2+1,b.my+b.L/2+1))continue;// (none of it known: fog.js VIEW_SEEN)
    const ends=()=>[-1,1].every(sg=>{const x=b.mx+sg*b.ux*(b.L/2+12),y=b.my+sg*b.uy*(b.L/2+12),c=WorldArt.chunks.get(Math.floor(y/CHUNK)*WorldArt.cols+Math.floor(x/CHUNK));return c&&c.lift&&(c.fr||1)>=r});
    // (made again once the land at both its ends is painted, so its ends meet the land as it is drawn)
    if(!b.pic||b.picR!==r||(!b.picEnds&&ends())){const c=WorldArt.chunks.get(Math.floor(b.my/CHUNK)*WorldArt.cols+Math.floor(b.mx/CHUNK));if(!c||!c.lift)continue;b.picEnds=ends();b.pic=bridgePic(b,r);b.picR=r}
    const q=b.pic;ents.push({st:true,y:q.y1,f:()=>ctx.drawImage(q.cv,q.x-cam.x,q.y-cam.y,q.cv.width/r,q.cv.height/r)})}}
function bridgeOver(x,y,L){const P0=WorldArt.plan;if(!P0||!P0.ways||ON_DECK)return;const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);if(tx<0||ty<0||tx>=MW||ty>=MH||!waterBand(ty*MW+tx))return;
  const r=sceneRes(),cam={x:Math.floor(G.cam.x),y:Math.floor(G.cam.y)};
  for(const b of P0.ways.bridges||[]){const q=b.pic;if(!q||b.picR!==r||x<q.x||x>q.x+q.cv.width/r||y<q.y||y>q.y1+4)continue;
    // (on whole px of the map, as everything drawn: his place is not, 2026-11-17)
    const bx0=Math.max(q.x,Math.floor(x-10)),bx1=Math.min(q.x+q.cv.width/r,Math.ceil(x+10)),by0=Math.max(q.y,Math.floor(y-L-30)),by1=Math.min(q.y+q.cv.height/r,Math.ceil(y-L+3));if(bx1<=bx0||by1<=by0)continue;
    ctx.drawImage(q.cv,(bx0-q.x)*r,(by0-q.y)*r,(bx1-bx0)*r,(by1-by0)*r,bx0-cam.x,by0-cam.y,bx1-bx0,by1-by0)}}
// (a river's surface between two of its points (levels, t 0-1 along): the lab's, stepped a whole step (WORLD_WAYS.river.step) at a
//  time, a fall at each (the owner, 2026-11-15: "Look how the river and hill work in the lab": its surface runs flat, then drops a
//  level over a fall, down the hills); one dropping steps.min levels or more at once falls at its middle)
function riverSurf(A,B,t){const s=A-B<WORLD_TERRAIN.steps.min?A+(B-A)*t:t<.5?A:B,st=WORLD_WAYS.river.step;return st>0?Math.floor(s/st+1e-4)*st:s}
/* (where a river runs as rapids, its surface sloping down a drop instead of stepping over a fall (the owner, 2026-11-19: "I see waterfall
   in big river looks weird": a wide river stepping two levels at once drew a straight white band right across its water above a
   lake): a reach falls.rapid.hw game px of half-width or more, within falls.rapid.mouth px (along it) of still water at its end or of a wider river it runs into (its level there), or
   within falls.rapid.bridge px of a bridge's deck; there its stepped surface (riverSurf) averaged over falls.rapid.ramp px along it
   each way (the window never past the run's ends, so it meets the still water's level), eased in over ramp px from the reach: no
   face (a fall) nor its lip and pool, white water down the slope (terrainChunk). Per river point, NaN where none (riverLevel)) */
function riverRamp(WY){const X=WY.X,Y=WY.Y,LV=WY.LV,n=X.length,R=new Float32Array(n).fill(NaN),FR=WORLD_TERRAIN.falls.rapid,on=new Uint8Array(n),D=new Float32Array(n),S=new Float32Array(n),core=new Uint8Array(n),BR=WY.bridges||[],ML=WM.lv||(WM.lv=reliefOf(WM));
  for(const k of WY.SP)on[k]=1;
  // (the river a point lies in the water of: another run's, wider, whose half-width reaches it (-1 none); that river's stepped level there)
  const run=new Int32Array(n),G=new Map(),cell=32;{let q=0;for(let k=0;k<n;k++){run[k]=q;if(!on[k])q++;const g=Math.floor(X[k]/cell)+','+Math.floor(Y[k]/cell);if(!G.has(g))G.set(g,[]);G.get(g).push(k)}}
  const inside=k=>{const cx=Math.floor(X[k]/cell),cy=Math.floor(Y[k]/cell);let b=-1,bd=0;for(let v=cy-1;v<=cy+1;v++)for(let u=cx-1;u<=cx+1;u++)for(const j of G.get(u+','+v)||[]){if(run[j]===run[k]||WY.HW[j]<=WY.HW[k]+1)continue;const d=Math.hypot(X[j]-X[k],Y[j]-Y[k])-WY.HW[j];if(d<bd){bd=d;b=j}}return b};
  const lvOf=j=>on[j]?riverSurf(LV[j],LV[j+1],0):j>0&&on[j-1]?riverSurf(LV[j-1],LV[j],1):LV[j];
  const still=(x,y)=>{const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);if(tx<0||ty<0||tx>=MW||ty>=MH)return false;const i=ty*MW+tx;return tiles[i]===T_WATER&&(!(WM.river[i]&3)||!!(WY.mouth&&WY.mouth[i]))};
  for(let k0=0;k0<n;){let k1=k0;while(k1<n-1&&on[k1])k1++;
    for(let k=k0+1;k<=k1;k++)D[k]=D[k-1]+Math.hypot(X[k]-X[k-1],Y[k]-Y[k-1]);
    for(let k=k0;k<=k1;k++)S[k]=k<k1?riverSurf(LV[k],LV[k+1],0):k>k0?riverSurf(LV[k-1],LV[k],1):riverSurf(LV[k],LV[k],0);
    // (its end in water not its own: still water (a lake's, the sea's), or a brook's run over land into another's water (a river it
    //  joins): its mouth. From its first point there (ka) on its water lies at that water's level (ML), never a step of water raised in
    //  it; over ramp px before ka it eases down to that level)
    const wet=(x,y)=>{const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return tx>=0&&ty>=0&&tx<MW&&ty<MH&&tiles[ty*MW+tx]===T_WATER},back=k=>{let j=k;while(j>k0&&D[k]-D[j]<FR.join)j--;return j};
    let ka=k1+1;if(k1>k0&&(still(X[k1],Y[k1])||wet(X[k1],Y[k1])&&!wet(X[back(k1)],Y[back(k1)]))){ka=k1;while(ka>k0&&wet(X[ka-1],Y[ka-1]))ka--}
    else if(k1>k0&&inside(k1)>=0){ka=k1;while(ka>k0&&inside(ka-1)>=0)ka--}// (or its tail run on within a wider river's banks: from where it enters that river)
    for(let k=ka;k<=k1;k++){const i=Math.floor(Y[k]/TILE)*MW+Math.floor(X[k]/TILE),j=inside(k);S[k]=Math.min(S[k],ML[i],j>=0?lvOf(j):1e9)}
    for(let k=k1-1;k>=ka;k--)S[k]=Math.min(S[k],S[k+1]);// (and never above the water further in: a river's stepped surface, not its tile's level)
    const e0=still(X[k0],Y[k0]),e1=ka<=k1,DA=e1?D[ka]:D[k1];
    for(let k=k0;k<=k1;k++)core[k]=WY.HW[k]>=FR.hw||e1&&DA-D[k]<FR.mouth||e0&&D[k]-D[k0]<FR.mouth||BR.some(b=>Math.hypot(X[k]-b.mx,Y[k]-b.my)<b.L/2+FR.bridge)?1:0;
    // (each point's distance along to the nearest of the reach, both ways: its weight 1 there, 0 ramp px off it)
    const dc=new Float32Array(k1-k0+1);let last=-1e9;for(let k=k0;k<=k1;k++){if(core[k])last=D[k];dc[k-k0]=D[k]-last}
    last=1e9;for(let k=k1;k>=k0;k--){if(core[k])last=D[k];dc[k-k0]=Math.min(dc[k-k0],last-D[k])}
    const kz=Math.min(k1,ka-1);
    for(let k=k0;k<=k1;k++){const w=1-dc[k-k0]/FR.ramp;if(w<=0)continue;if(k>=ka){R[k]=S[k];continue}
      const rad=Math.min(FR.ramp,D[k]-D[k0],D[kz]-D[k]);let sm=0,sw=0;
      for(let j=k;j>=k0&&D[k]-D[j]<=rad;j--){const v=1-(D[k]-D[j])/(rad+1);sm+=S[j]*v;sw+=v}
      for(let j=k+1;j<=kz&&D[j]-D[k]<=rad;j++){const v=1-(D[j]-D[k])/(rad+1);sm+=S[j]*v;sw+=v}
      R[k]=S[k]+(sm/sw-S[k])*Math.min(1,w)}
    // (down to its mouth's level over the ramp before it: from the ramp's value ramp px up to the water's at ka, never rising)
    if(e1){let ku=ka;while(ku>k0&&DA-D[ku-1]<=FR.ramp)ku--;const top=R[ku]===R[ku]?R[ku]:S[ku],lo=S[ka];
      for(let k=ku;k<ka;k++){const f=FR.ramp>0?Math.min(1,(D[k]-(DA-FR.ramp))/FR.ramp):1;R[k]=Math.max(lo,top+(lo-top)*Math.max(0,f))}}
    // (never rising downstream where its river does not)
    for(let k=k0+1;k<=k1;k++)if(R[k]===R[k]&&R[k-1]===R[k-1]&&LV[k]<=LV[k-1]&&R[k]>R[k-1])R[k]=R[k-1];
    k0=k1+1}
  return R}
// (a river's surface at segment a, t 0-1 along it: on its rapids' ramp (riverRamp), else stepped (riverSurf))
function riverLevel(WY,a,t){const R=WY.RR||(WY.RR=riverRamp(WY)),r0=R[a],r1=R[a+1];if(r0!==r0&&r1!==r1)return riverSurf(WY.LV[a],WY.LV[a+1],t);
  const p=r0===r0?r0:riverSurf(WY.LV[a],WY.LV[a+1],0),q=r1===r1?r1:riverSurf(WY.LV[a],WY.LV[a+1],1);return p+(q-p)*t}
// (how far each river point lies from a fall along its river (game px; less than 0 above it, more below), within a fall's lip above and
//  its pool below (WORLD_TERRAIN.falls); else 1e9: a fall where its stepped surface (riverSurf) drops from one point to the next)
function fallDist(WY){const X=WY.X,Y=WY.Y,LV=WY.LV,n=LV.length,FD=new Float32Array(n).fill(1e9),FA=WORLD_TERRAIN.falls,gap=(a,b)=>Math.hypot(X[b]-X[a],Y[b]-Y[a]);
  const RR=WY.RR||(WY.RR=riverRamp(WY));// (no fall on a rapids' reach: riverRamp)
  for(let a=0;a+1<n;a++){const g=gap(a,a+1);if(g>24||RR[a]===RR[a]||RR[a+1]===RR[a+1]||riverSurf(LV[a],LV[a+1],0)-riverSurf(LV[a],LV[a+1],1)<.5)continue;
    let d=g/2;for(let b=a;b>=0&&d<FA.lip;b--){if(Math.abs(FD[b])>d)FD[b]=-d;if(b>0){const h=gap(b-1,b);if(h>24)break;d+=h}}
    d=g/2;for(let b=a+1;b<n&&d<FA.pool;b++){if(Math.abs(FD[b])>d)FD[b]=d;if(b+1<n){const h=gap(b,b+1);if(h>24)break;d+=h}}}
  return FD}
// where one crossing a bridge is drawn (render.js drawMover): on its deck at its height (a deck stands over the water's lift), and on a
// turned one, along it: its crossing walked straight between its end tiles (world.js walk), drawn along the road to its deck, the deck
// and the road on from it. [dx, dy, on its deck] (game px to move him by), or null off every bridge; x, y his place.
// ON_DECK: the one being drawn stands on a deck (bridgeOver draws no bridge over him)
let ON_DECK=false;
// (the bridges whose span (and half its width either side) reaches each tile: a map from the tile's index, kept on the bridges' list,
// so a mover asks only those by him, not every bridge in the world each frame)
function bridgeTiles(BR){if(BR._bt)return BR._bt;const M=new Map();for(const b of BR){if(b.ex===undefined)continue;const m=b.hw+3+WORLD_WAYS.bridge.reach+WORLD_WAYS.bridge.stair.run,// (and its run-on and its stairs past its end tiles)
   
    x0=Math.floor((Math.min(b.ex,b.fx)-m)/TILE),x1=Math.floor((Math.max(b.ex,b.fx)+m)/TILE),y0=Math.floor((Math.min(b.ey,b.fy)-m)/TILE),y1=Math.floor((Math.max(b.ey,b.fy)+m)/TILE);
    for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){const k=ty*MW+tx;let L=M.get(k);if(!L)M.set(k,L=[]);L.push(b)}}
  return BR._bt=M}
function bridgeShift(x,y){const P0=WorldArt.plan;if(!P0||!P0.ways||!P0.ways.bridges||typeof liftAt!=='function')return null;
  const near=bridgeTiles(P0.ways.bridges).get(Math.floor(y/TILE)*MW+Math.floor(x/TILE));if(!near)return null;
  for(const b of near){const p=b.pr;if(!p||b.ex===undefined)continue;const s=(x-b.ex)*b.ax+(y-b.ey)*b.ay,q=(y-b.ey)*b.ax-(x-b.ex)*b.ay;if(Math.abs(q)>b.hw+2)continue;
    // (past its end tiles but on its run-on or its stairs, a straight one's: on it all the same, at their height: he was drawn on the
    //  ground under its stairs and the bank laid over him)
    if(s<0||s>b.al){if(b.diag)continue;const t0=((x-b.mx)*b.ux+(y-b.my)*b.uy)*p.r-p.lo;if(t0<0||t0>p.hi-p.lo)continue}
    const r=p.r,A=[b.mx+b.ux*p.lo/r,b.my+b.uy*p.lo/r],Bp=[b.mx+b.ux*p.hi/r,b.my+b.uy*p.hi/r];let vx=x,vy=y,t;
    if(b.diag){const la=Math.hypot(A[0]-b.ex,A[1]-b.ey),ld=(p.hi-p.lo)/r,lb=Math.hypot(b.fx-Bp[0],b.fy-Bp[1]),v=s/b.al*(la+ld+lb);
      if(v<la){const f=v/la;vx=b.ex+(A[0]-b.ex)*f;vy=b.ey+(A[1]-b.ey)*f}else if(v<la+ld){const f=(v-la)/ld;vx=A[0]+(Bp[0]-A[0])*f;vy=A[1]+(Bp[1]-A[1])*f}else{const f=(v-la-ld)/(lb||1);vx=Bp[0]+(b.fx-Bp[0])*f;vy=Bp[1]+(b.fy-Bp[1])*f}
      const qx=-b.uy,qy=b.ux;vx+=qx*q*.5;vy+=qy*q*.5}
    t=((vx-b.mx)*b.ux+(vy-b.my)*b.uy)*r-p.lo;const dq=Math.abs((vy-b.my)*b.ux-(vx-b.mx)*b.uy);
    const on=t>=0&&t<=p.hi-p.lo&&dq<=b.hw+1,H=bridgeH(p,t),
      want=on?Math.max(H/r,liftAt(vx,vy)):liftAt(vx,vy);
    return [vx-x,vy-y-(want-liftAt(x,y)),on]}
  return null}
// (a bridge's open span cut out of a road's band (S, at sc px a game px over x0,y0 w x h): nearer its line than its half-width and
//  reach, and more than abut game px in from its ends; the lab's OPEN: worldlab.js)
function bridgeOpen(BRS,B,x0,y0,w,h,sc,reach){if(!BRS)return;const ab=WORLD_WAYS.bridge.abut;
  for(const b of BRS){const hl=b.L/2-ab,hv=b.hw+reach;if(hl<=0)continue;const ex=(Math.abs(b.ux)*hl+Math.abs(b.uy)*hv)*sc,ey=(Math.abs(b.uy)*hl+Math.abs(b.ux)*hv)*sc,cx=b.mx*sc-x0,cy=b.my*sc-y0;
    const xa=Math.max(0,Math.floor(cx-ex)),xb=Math.min(w-1,Math.ceil(cx+ex)),ya=Math.max(0,Math.floor(cy-ey)),yb=Math.min(h-1,Math.ceil(cy+ey));
    for(let y=ya;y<=yb;y++)for(let x=xa;x<=xb;x++){const dx=(x+.5-cx)/sc,dy=(y+.5-cy)/sc;if(Math.abs(dx*b.ux+dy*b.uy)<hl&&Math.abs(dy*b.ux-dx*b.uy)<hv){const j=y*w+x;B.S[j]=1e9;B.Q[j]=-1}}}}
// (a bridge's deck's level: clear levels over its water, never under its banks)
function bridgeDeck(c){const L=WM.lv;let wl=1e9;for(const t of c.tiles)wl=Math.min(wl,L[t]);return Math.max(wl+WORLD_WAYS.bridge.clear,L[c.i],L[c.j])}
// (a bridge's deck at game px, for what sails under it (worldart.js WorldArt.deck, world/ships.js): its deck and rails, one colour:
// only its shape is read)
function wayDeck(c){const b=(waysOf(WorldArt.ensure()).bridges||[]).find(q=>q.c===c);if(!b)return {cv:mkc(1,1,()=>{}),x:0,y:0,foot:0};
  const R=Math.ceil(WORLD_WAYS.bridge.rail*WAY_LP),ex=Math.abs(b.ux)*b.L/2+Math.abs(b.uy)*b.hw+1,ey=Math.abs(b.uy)*b.L/2+Math.abs(b.ux)*b.hw+1,x=Math.floor(b.mx-ex),y=Math.floor(b.my-ey)-R,w=Math.ceil(2*ex)+1,h=Math.ceil(2*ey)+R+2;
  return {cv:mkc(w,h,g=>{g.fillStyle='#000';g.translate(b.mx-x,b.my-y-R/2);g.rotate(Math.atan2(b.uy,b.ux));g.fillRect(-b.L/2,-b.hw-R/2,b.L,2*b.hw+R)}),x,y,foot:y+h-1}}
