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
  const MO=[],V=WORLD_WAYS.river,Rv=WM.river,LV=WM.lv||(WM.lv=reliefOf(WM)),N=MW*MH,X=[],Y=[],HW=[],LL=[],DP=[],SP=[],SA=[];
  // (a curve through pts ([x, y, hw, lv, dp, slack]): its corners cut three times (Chaikin's way, the ends kept; each new point
  //  keeps its nearer parent's level, so the surface steps where the tiles' did), then wandering off its line by its slack)
  const curve=(pts,id)=>{let p=pts;if(p.length<2)return;
    for(let it=0;it<3;it++){const o=[p[0]];for(let k=0;k+1<p.length;k++){const a=p[k],b=p[k+1];o.push(a.map((v,j)=>j===3?a[3]:v*.75+b[j]*.25),a.map((v,j)=>j===3?b[3]:v*.25+b[j]*.75))}o.push(p[p.length-1]);p=o}
    const n=p.length,k0=X.length;let L=0;
    for(let k=0;k<n;k++){if(k)L+=Math.hypot(p[k][0]-p[k-1][0],p[k][1]-p[k-1][1]);const a=p[Math.max(0,k-1)],b=p[Math.min(n-1,k+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,
        f=Math.min(1,k/10,(n-1-k)/10),o=(wnoise2(L/26,id*3.7,501)-.5)*2*Math.max(0,Math.min(V.meander*WAY_LP,p[k][5]))*f;
      X.push(p[k][0]-dy/l*o);Y.push(p[k][1]+dx/l*o);HW.push(p[k][2]);LL.push(p[k][3]);DP.push(p[k][4])}
    for(let k=k0;k+1<X.length;k++){SP.push(k);SA.push(X[k],Y[k],X[k+1],Y[k+1],HW[k],HW[k+1])}};
  // (a tile's point: its middle, a river two tiles wide the middle of its 2 x 2)
  const sea=i=>tiles[i]===T_WATER&&!(Rv[i]&3),mid=(i,w)=>{const x=i%MW,y=(i-x)/MW,o=w===2?16:8;return [x*TILE+o,y*TILE+o]};
  for(const r of WM.rivers){const p=r.path.slice();if(r.mouth>=0&&p[p.length-1]!==r.mouth)p.push(r.mouth);let lv=1e9,w0=1;const pts=[];
    for(let k=0;k<p.length;k++){const i=p[k],own=Rv[i]&3,w=k<r.path.length?Math.max(1,Math.min(r.width,own||w0)):w0;w0=w;lv=Math.min(lv,LV[i]);
      const [x,y]=mid(i,own&&!sea(i)?own:w),hw=V.hw[w]*WAY_LP;pts.push([x,y,hw,lv,V.depth[w]*(.75+.5*k/Math.max(1,p.length-1)),(w===1?8:w===2?16:24)-hw])}// (deeper downstream, the lab's)
    // (its mouth on the sea or a lake: wider into it)
    if(sea(r.mouth))for(let k=Math.max(0,pts.length-3);k<pts.length;k++)pts[k][2]*=V.mouth;
    // (its plume into the sea past its mouth; the tarn it rises from on high ground, the lab's: a pool at its head)
    if(sea(r.mouth)&&pts.length){const q=pts[pts.length-1];MO.push([q[0],q[1],Math.max(20,q[2]*V.plume)])}
    if(pts.length>2&&pts[0][3]>=V.tarn.lv){pts[0][2]*=V.tarn.w;pts[1][2]*=(1+V.tarn.w)/2}
    curve(pts,r.id)}
  // the brooks (painted only: no tile of water; worldgen.js genBrook): from each head down its flow to the river, the water or the
  // brook it runs into, as wide as its flow
  const B=GEN_RIVER.brook,F=WM.flow,isB=i=>{const t=tiles[i];return t!==T_WATER&&t!==T_MOUNT&&!(Rv[i]&3)&&(F[i]&31)>=B},
    down=i=>{const [dx,dy]=DIR8[F[i]>>5]||[0,1],x=i%MW+dx,y=((i/MW)|0)+dy;return x>=0&&y>=0&&x<MW&&y<MH?y*MW+x:-1};
  const fed=new Uint8Array(N),seen=new Uint8Array(N);for(let i=0;i<N;i++)if(isB(i)){const j=down(i);if(j>=0)fed[j]=1}
  let bid=1000;
  for(let h=0;h<N;h++){if(!isB(h)||fed[h])continue;const pts=[];let i=h,lv=1e9;
    while(i>=0){const b=isB(i),own=Rv[i]&3,[x,y]=mid(i,own&&!sea(i)?own:1),q=Math.max(0,Math.min(1,((F[i]&31)-B)/2)),hw=(V.brook[0]+(V.brook[1]-V.brook[0])*q)*WAY_LP;
      lv=Math.min(lv,LV[i]);pts.push([x,y,b?hw:pts.length?pts[pts.length-1][2]:hw,lv,V.depth[0],8-hw]);if(!b||seen[i])break;seen[i]=1;i=down(i)}
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
  const BRG=[],BW=WORLD_WAYS.bridge;
  for(const c of WM.crossings){if(c.kind!=='bridge')continue;const ex=((c.i%MW)+.5)*TILE,ey=(((c.i/MW)|0)+.5)*TILE,fx=((c.j%MW)+.5)*TILE,fy=(((c.j/MW)|0)+.5)*TILE,al=Math.hypot(fx-ex,fy-ey)||1,ax=(fx-ex)/al,ay=(fy-ey)/al;
    const ux=ax,uy=ay,mx=(ex+fx)/2,my=(ey+fy)/2,L=al-TILE+BW.over*2,hw=(WORLD_WAYS.road.hw[1]-1)*WAY_LP;
    BRG.push({c,mx,my,ux,uy,L,hw,dk:bridgeDeck(c),stone:!!c.stone});
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
    const lift=()=>{for(let i=0;i<n;i++)for(const [ax,ay,bx,by,dk] of decks)if(Math.hypot(px[i]-ax,py[i]-ay)<WORLD_WAYS.bridge.ramp||Math.hypot(px[i]-bx,py[i]-by)<WORLD_WAYS.bridge.ramp)z[i]=Math.max(z[i],dk)};
    for(let it=0;it<6;it++){for(let i=1;i<n;i++)z[i]=Math.min(Math.max(z[i],z[i-1]-G*d[i]),z[i-1]+G*d[i]);for(let i=n-2;i>=0;i--)z[i]=Math.min(Math.max(z[i],z[i+1]-G*d[i+1]),z[i+1]+G*d[i+1])}
    for(let it=0;it<2;it++){const q=z.slice();for(let i=0;i<n;i++){let a=0,m=0;for(let j=Math.max(0,i-3);j<=Math.min(n-1,i+3);j++){a+=q[j];m++}z[i]=a/m}}
    lift();for(let it=0;it<3;it++){for(let i=1;i<n;i++)z[i]=Math.max(z[i],z[i-1]-G*d[i]);for(let i=n-2;i>=0;i--)z[i]=Math.max(z[i],z[i+1]-G*d[i+1])}
    const nearB=i=>decks.some(([ax,ay,bx,by])=>Math.min(Math.hypot(px[i]-ax,py[i]-ay),Math.hypot(px[i]-bx,py[i]-by))<2*WORLD_WAYS.bridge.ramp);
    for(let k=k0;k<=k1;k++){RZ[k*2]=z[k-k0];RZ[k*2+1]=z[k-k0+1];RB[k]=nearB(k-k0)||nearB(k-k0+1)?1:0}
    k0=k1+1}
  return P.ways={bridges:BRG,mouths:MO,RZ,RB,land,X:Float32Array.from(X),Y:Float32Array.from(Y),HW:Float32Array.from(HW),LV:Float32Array.from(LL),DP:Float32Array.from(DP),SP:Int32Array.from(SP),SA:Float32Array.from(SA),RA,RK,RL,mouth}}

/* the nearest of a set of segments (A: ax, ay, bx, by, ha, hb, game px) to every px of a window (x0, y0, w x h, in px sc a game px),
   within reach px past its edge: S how far past its edge (px; < 0 within it), Q the segment (-1 none), T how far along it (0-1) */
function* waysBand(A,x0,y0,w,h,sc,reach){const S=new Float32Array(w*h).fill(1e9),Q=new Int32Array(w*h).fill(-1),T=new Float32Array(w*h),n=A.length/6;let work=0;
  for(let s=0,o=0;s<n;s++,o+=6){const ha=A[o+4]*sc,hb=A[o+5]*sc,R=Math.max(ha,hb)+reach,ax=A[o]*sc-x0,ay=A[o+1]*sc-y0,bx=A[o+2]*sc-x0,by=A[o+3]*sc-y0;
    const xa=Math.max(0,Math.floor(Math.min(ax,bx)-R)),xb=Math.min(w-1,Math.ceil(Math.max(ax,bx)+R)),ya=Math.max(0,Math.floor(Math.min(ay,by)-R)),yb=Math.min(h-1,Math.ceil(Math.max(ay,by)+R));
    if(xa>xb||ya>yb)continue;const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy||1;
    for(let y=ya;y<=yb;y++){const py=y+.5-ay;for(let x=xa;x<=xb;x++){const px=x+.5-ax,t=Math.max(0,Math.min(1,(px*dx+py*dy)/l2)),ex=px-dx*t,ey=py-dy*t,d=Math.sqrt(ex*ex+ey*ey)-(ha+(hb-ha)*t),j=y*w+x;
        if(d<S[j]){S[j]=d;Q[j]=s;T[j]=t}}}
    if((work+=(xb-xa+1)*(yb-ya+1))>250000){work=0;yield}}
  return {S,Q,T}}

// a river's water (the lab's underWater with its river's colours): d its depth (levels), its bed of pebbles showing in the shallows,
// light caught there; a ford's stones; the frost's edges frozen (q: how far out from the middle, 0-1)
function wayWater(Q,cl,fx,fy,d,q,ford){const S=Q.river;
  if(cl==='frost'&&q>.62+(wnoise2(fx/14,fy/14,511)-.5)*.5){let c=tpick(Q.ice,fx,fy,512);if(Math.abs(wnoise2(fx/10,fy/10,513)-.5)<.02)c=tmul(c,.86);return c}
  let c=d<.4?tmix(S[0],S[1],d/.4):d<1?tmix(S[1],S[2],(d-.4)/.6):tmix(S[2],S[3],Math.min(1,d-1));
  const a=Math.pow(Math.max(0,1-d/.55),1.4);c=tmix(c,Q.pebble[Math.floor(hs(fx>>1,fy>>1,514)*4)],a*.8);if(a>.15&&wnoise2(fx/3,fy/3,515)>.74)c=tmix(c,[232,246,246],.22*a);
  if(ford&&hs(fx>>1,fy>>1,516)<.12)c=WAY_COL.stone[hs(fx,fy,517)<.5?0:1];else if(hs(fx,fy,518)<.004)c=WAY_COL.stone[1];
  // (a ripple now and then along the current, lighter)
  if(d>.3&&wnoise2(fx/9,fy/2.5,519)>.8)c=tmix(c,Q.fall[1],.25);
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
function wayRoad(fx,fy,sd,hw,t,flat,land,k){const RR=WORLD_WAYS.road,C=WAY_COL,rk=hw*RR.track+(wnoise2(t/40/k,.5,521)-.5)*2*RR.wander*k,tr=Math.min(Math.abs(sd-rk),Math.abs(sd+rk))/k;let c;
  if(tr<.7)c=C.groove;else if(tr<2.2)c=C.pack[wnoise2(fx/4,fy/4,522)>.5?0:1];
  else if(Math.abs(sd)<rk){c=C.crown[wnoise2(fx/5,fy/5,523)>.5?0:1];if(flat&&wnoise2(fx/4,fy/4,524)>.58)c=tmix(c,land,.7)}
  else{c=C.loose[Math.floor(wnoise2(fx/3,fy/3,525)*2.99)];if(hs(fx,fy,526)<RR.gravel)c=C.gravel[Math.floor(hs(fx,fy,527)*3)]}
  if(flat&&tr<2.6){const p=wnoise2(fx/14/k,fy/14/k,528)*.6+wnoise2(fx/5/k,fy/5/k,529)*.4;if(p>RR.puddle){c=p-RR.puddle<.02?C.soil:tmix(tmix(C.puddle,C.soil,.4),C.sky,hs(fx>>1,fy,530)<.15?.45:.1)}}
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
function bridgePic(b,r){const BG=WORLD_WAYS.bridge,C=WAY_COL,lh=WORLD_TERRAIN.lh,k=r/2;
  {const DL=Math.round(b.dk*lh),mx=b.mx*r,my=b.my*r,ux=b.ux,uy=b.uy,nx=-uy,ny=ux,hl=b.L*r/2,hw=Math.round(b.hw*r),R=Math.round(BG.rail*k),SH=Math.ceil(BG.shade*k);
    const ext=Math.abs(ux)*hl+Math.abs(nx)*hw+2,eyt=Math.abs(uy)*hl+Math.abs(ny)*hw+2,bx0=Math.floor(mx-ext),bx1=Math.ceil(mx+ext)+SH,by0=Math.floor(my-eyt),by1=Math.ceil(my+eyt);
    const py0=by0-DL-R-3,PW=bx1-bx0+1,PH=by1+SH+2-py0+1,img=new ImageData(PW,PH),O=img.data;
    const put=(x,y,c,a=255)=>{x-=bx0;y-=py0;if(x<0||y<0||x>=PW||y>=PH)return;const o=(y*PW+x)*4;if(a<255&&O[o+3]===255)return;O[o]=c[0];O[o+1]=c[1];O[o+2]=c[2];O[o+3]=a};
    // (what lies under it: the land's lift there (fine px) and whether it is water)
    const liftF=(fx,fy)=>Math.round(liftAt(fx/r,fy/r)*r),wetF=(fx,fy)=>{const tx=Math.floor(fx/r/TILE),ty=Math.floor(fy/r/TILE);if(tx<0||ty<0||tx>=MW||ty>=MH)return 0;const i=ty*MW+tx;return tiles[i]===T_WATER||WM.river[i]&3?1:0};
    const inB=(x,y)=>{const dx=x+.5-mx,dy=y+.5-my,t=dx*ux+dy*uy,v=dx*nx+dy*ny;return Math.abs(t)<=hl&&Math.abs(v)<=hw},TV=(x,y)=>{const dx=x+.5-mx,dy=y+.5-my;return [dx*ux+dy*uy+hl,dx*nx+dy*ny]};
    // (its north side: the side whose rail shades the deck (the sun from the north-west); a side px: on its edge, along a long side)
    const north=ny<0||ny===0&&nx<0?1:-1,side=(x,y,v)=>Math.abs(v)>=hw-1.5*k&&(!inB(x-1,y)||!inB(x+1,y)||!inB(x,y-1)||!inB(x,y+1));
    const pile=BG.pile*k,arch=BG.arch*k,post=BG.post*k,beam=Math.round(3*k);
    /* (where it stands over open space: along its middle, over water or a drop under its beams of more than open px (the owner,
       2026-11-15: "if the foundation already cover like certain amount of the bridge then we should leave it open like real bridge"):
       its supports only there, evenly, a pile at each end of it and every pile px at most between (a stone one's piers, an arch every
       arch px at most); where the bank under it carries it (its foundation), nothing under its deck) */
    const atT=t=>[mx+ux*(t-hl),my+uy*(t-hl)];let oa=-1,ob=-1;
    for(let t=0;t<=2*hl;t++){const [fx,fy]=atT(t);if(wetF(fx,fy)||DL-liftF(fx,fy)>beam+BG.open*k){if(oa<0)oa=t;ob=t}}
    const sup=[];if(oa>=0){const n=Math.max(1,Math.ceil((ob-oa)/(b.stone?arch:pile)));for(let i=0;i<=n;i++)sup.push(oa+(ob-oa)*i/n)}
    const bay=t=>{let i=0;while(i+2<sup.length&&t>=sup[i+1])i++;return [t-sup[i],sup[i+1]-sup[i]]},nearS=t=>{let d=1e9;for(const s of sup)d=Math.min(d,Math.abs(t-s));return d};
    // (its shadow on the water or the land under it, SH px to the south-east)
    for(let y=by0;y<=by1;y++)for(let x=bx0;x<=bx1;x++)if(inB(x,y)){const lf=liftF(x,y);put(x+SH,y+SH-lf,[14,20,28],BG.shadow)}
    for(let y=by0;y<=by1;y++)for(let x=bx0;x<=bx1;x++){if(!inB(x,y))continue;const [t,v]=TV(x,y),sy=y-DL,pl=Math.floor(t/(4*k));
      // (the deck: planks across, a thin gap between, knots, worn where the wheels go; a stone one's setts; shaded inside its north rail,
      //  lit along its north edge)
      let c;if(b.stone){const row=Math.floor((v+hw)/(2*k)),o=(row&1)*1.5*k;c=C.sett[Math.floor(hs(Math.floor((t+o)/(3*k)),row,541)*3)];if((t+o)%(3*k)<k*.6||(v+hw)%(2*k)<k*.5)c=tmul(C.sett[1],.78)}
      else{c=C.plank[Math.floor(hs(pl,7,542)*3)];if(t%(4*k)<.6*k)c=tmul(C.plank[1],.72);else if(hs(pl,Math.floor(v/k),543)<.05)c=tmul(c,.82);if((Math.abs(v)>hw-2.2*k)&&hs(pl,v>0?1:2,544)<.5)c=tmul(c,.9)}
      if(Math.abs(Math.abs(v)-hw*WORLD_WAYS.road.track)<1.3*k)c=tmul(c,.92);if(v*north>hw-1.5*k-2.5*k&&v*north<hw-1.5*k)c=tmul(c,.82);if(!inB(x,y-1))c=tmul(c,1.1);put(x,sy,c);
      // (a beam under its every edge)
      const south=!inB(x,y+1),edge=south||!inB(x-1,y)||!inB(x+1,y);if(edge)for(let j=1;j<=Math.round(3*k);j++)put(x,sy+j,j<=k?C.beam[0]:tmul(C.beam[0],.8));
      // (under its near (south) edge, down to what lies under it: piles braced between (a stone one's piers and arches), stone only at its
      //  very ends (its abutments); foam and a ripple at their feet in water)
      if(south&&sup.length&&t>=sup[0]-2.5*k&&t<=sup[sup.length-1]+2.5*k){const lf=liftF(x,y+1),gy=y+1-lf,top=sy+beam+1;if(gy<=top)continue;const n2=gy-top,wet=wetF(x,y+1),d=nearS(t),[tp,s]=bay(t),pw=b.stone?2.5*k:k;
        for(let yy=top;yy<gy;yy++){const dz=yy-top;let c2=null;
          if(d<pw)c2=b.stone?tmul(C.stone[(Math.floor(yy/(3*k))+(x&1))%2?1:2],d>pw-k?.8:1):d<pw/2?C.plank[1]:C.beam[0];
          else if(b.stone){const q=(tp-pw)/Math.max(1,s-2*pw),ar=(n2-2*k)*(1-Math.sqrt(Math.max(0,1-(2*q-1)*(2*q-1))))+2*k;
            if(dz<ar-2*k)c2=C.stone[(Math.floor(yy/(3*k))+(x>>1))%2?0:1];else if(dz<ar)c2=(Math.floor(tp/(2*k))&1)?tmul(C.stone[0],1.06):C.stone[1];else{put(x,yy,[30,36,44],dz<ar+3*k?210:120);continue}}
          else if(n2>5*k&&s>4*k&&(Math.abs(tp-pw-dz*(s-2*pw)/n2)<.8*k||Math.abs(s-pw-tp-dz*(s-2*pw)/n2)<.8*k))c2=tmul(C.beam[0],.9);
          if(c2)put(x,yy,c2)}
        if(wet&&d<pw){put(x,gy,C.foam);put(x-1,gy+1,C.foam,170);put(x+1,gy+1,C.foam,170)}}}
    // (the rails on posts, or the parapets, along both its long sides on its very edge, rising rail px over it: a post every post px,
    //  a taller one at each corner, its top rail lit, its shadow under it, a middle rail; a stone one's parapet capped and coursed)
    for(let y=by0;y<=by1;y++)for(let x=bx0;x<=bx1;x++){if(!inB(x,y))continue;const [t,v]=TV(x,y);if(!side(x,y,v))continue;const sy=y-DL,end=Math.min(t,2*hl-t),ps=((t%post)+post)%post<1.2*k;
      if(b.stone){const H=R-(end<2.5*k?-k:0);for(let j=1;j<=H;j++)put(x,sy-j,j===H?C.cap:j===H-1?C.stone[0]:j===1?tmul(C.stone[2],.8):(j===Math.ceil(H/2)||((x>>1)+(j>H/2?1:0))%3===0)?C.stone[2]:tmul(C.stone[1],1.04))}
      else if(end<1.5*k)for(let j=1;j<=R+2;j++)put(x,sy-j,j>=R+1?C.lit:j===1?C.beam[1]:C.beam[0]);
      else if(ps)for(let j=1;j<=R+1;j++)put(x,sy-j,j>=R?C.lit:C.beam[1]);
      else if(end>=k){put(x,sy-R,C.lit);put(x,sy-R+1,C.beam[1]);put(x,sy-(R>>1),C.plank[0]);put(x,sy-(R>>1)+1,C.beam[1])}}
    const cv=mkcv(PW,PH);cv.getContext('2d').putImageData(img,0,0);return {cv,x:bx0/r,y:py0/r,y1:(by1+1)/r}}}

/* the bridges as their own layer (render.js drawWorld, through worldterrain.js terrainEnts): each in view among what stands, by its south
   edge, its picture made once its land is painted (its chunk's lift known) and kept for the scene's resolution; one in water under a
   bridge has the bridge drawn again over him (bridgeOver: worldterrain.js liftDraw) */
function bridgeEnts(ents,cam){const r=sceneRes(),P0=WorldArt.plan;if(!P0)return;const BRS=waysOf(P0).bridges;if(!BRS)return;
  for(const b of BRS){const ex=b.L/2+b.hw+8;if(b.mx+ex<cam.x||b.mx-ex>cam.x+VW||b.my+ex<cam.y||b.my-ex-40>cam.y+VH)continue;
    if(!b.pic||b.picR!==r){const c=WorldArt.chunks.get(Math.floor(b.my/CHUNK)*WorldArt.cols+Math.floor(b.mx/CHUNK));if(!c||!c.lift)continue;b.pic=bridgePic(b,r);b.picR=r}
    const q=b.pic;ents.push({st:true,y:q.y1,f:()=>ctx.drawImage(q.cv,q.x-cam.x,q.y-cam.y,q.cv.width/r,q.cv.height/r)})}}
function bridgeOver(x,y,L){const P0=WorldArt.plan;if(!P0||!P0.ways)return;const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);if(tx<0||ty<0||tx>=MW||ty>=MH||!waterBand(ty*MW+tx))return;
  const r=sceneRes(),cam={x:Math.floor(G.cam.x),y:Math.floor(G.cam.y)};
  for(const b of P0.ways.bridges||[]){const q=b.pic;if(!q||b.picR!==r||x<q.x||x>q.x+q.cv.width/r||y<q.y||y>q.y1+4)continue;
    const bx0=Math.max(q.x,x-10),bx1=Math.min(q.x+q.cv.width/r,x+10),by0=Math.max(q.y,y-L-30),by1=Math.min(q.y+q.cv.height/r,y-L+3);if(bx1<=bx0||by1<=by0)continue;
    ctx.drawImage(q.cv,(bx0-q.x)*r,(by0-q.y)*r,(bx1-bx0)*r,(by1-by0)*r,bx0-cam.x,by0-cam.y,bx1-bx0,by1-by0)}}
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
