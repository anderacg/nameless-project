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
      const [x,y]=mid(i,own&&!sea(i)?own:w),hw=V.hw[w]*WAY_LP;pts.push([x,y,hw,lv,V.depth[w],(w===1?8:w===2?16:24)-hw])}
    // (its mouth on the sea or a lake: wider into it)
    if(sea(r.mouth))for(let k=Math.max(0,pts.length-3);k<pts.length;k++)pts[k][2]*=V.mouth;
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
  const S=P.segs,nR=S.length/5,RA=new Float32Array(nR*6),RK=new Uint8Array(nR),RL=new Float32Array(nR),RW=WORLD_WAYS.road.hw;
  for(let k=0;k<nR;k++){const o=k*5,kd=S[o+4],road=kd<2?kd:(kd-2)&1,hw=RW[road]*WAY_LP;RK[k]=road;RA.set([S[o],S[o+1],S[o+2],S[o+3],hw,hw],k*6);
    RL[k]=k&&S[o]===S[o-3]&&S[o+1]===S[o-2]?RL[k-1]+Math.hypot(S[o-3]-S[o-5],S[o-2]-S[o-4]):0}
  // (the land a river's, a ford's or a road's tile shows beside its way: its neighbours' (the woods' floor only where most are woods))
  const land=new Uint8Array(N);for(let i=0;i<N;i++){const t=tiles[i];land[i]=t;if(t!==T_WATER&&t!==T_FORD&&t!==T_ROAD)continue;const x=i%MW,y=(i-x)/MW,n={};let best=T_OPEN,bn=0;
    for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const u=x+a,v=y+b;if(u<0||v<0||u>=MW||v>=MH)continue;const q=tiles[v*MW+u];if(q!==T_OPEN&&q!==T_FOREST&&q!==T_HILL&&q!==T_MOUNT)continue;n[q]=(n[q]||0)+1;if(n[q]>bn){bn=n[q];best=q}}
    land[i]=best===T_FOREST&&bn<5?T_OPEN:best}
  return P.ways={land,X:Float32Array.from(X),Y:Float32Array.from(Y),HW:Float32Array.from(HW),LV:Float32Array.from(LL),DP:Float32Array.from(DP),SP:Int32Array.from(SP),SA:Float32Array.from(SA),RA,RK,RL,mouth}}

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
  plank:[[154,112,70],[138,98,60],[166,124,80]],beam:[[92,64,40],[70,48,30]],lit:[204,170,120],stone:[[176,170,156],[150,144,132],[118,114,106]],
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

/* the bridges over a chunk (the lab's, standing over the land: only their parts drawn), into O (the chunk's fine picture, W2 x H2,
   its corner the game px X, Y; r fine px a game px): each bridge of WM.crossings, straight across from its bank tile c.i to c.j,
   its deck as wide as the road (planks across it, a thin gap between, worn where the wheels go; a stone one's setts) a little under
   the road's width; a beam under every edge; under its near (south) edge the piles (a stone one's piers and arches) down to the
   water or the bank, foam at their feet, braced between; the rails on posts (a stone one's parapets) along both sides. Its height:
   clear levels over the water, never under its banks. Lv, at: the chunk's levels (game px) and their index; FM: what is covered */
function waysBridges(O,W2,H2,X,Y,r,Lv,Wa,at,FM){const BG=WORLD_WAYS.bridge,C=WAY_COL,lh=WORLD_TERRAIN.lh,k=r/2,LVT=WM.lv;
  const fx0=X*r,fy0=Y*r,put=(x,y,c,mask)=>{x-=fx0;y-=fy0;if(x<0||y<0||x>=W2||y>=H2)return;const o=(y*W2+x)*4;O[o]=c[0];O[o+1]=c[1];O[o+2]=c[2];O[o+3]=255;if(mask!==false)FM[y*W2+x]=1};
  const lvAt=(fx,fy)=>{const q=at(Math.floor(fx/r),Math.floor(fy/r));return q<0?null:Lv[q]},wetAt=(fx,fy)=>{const q=at(Math.floor(fx/r),Math.floor(fy/r));return q<0?0:Wa[q]};
  for(const c of WM.crossings){if(c.kind!=='bridge')continue;const ax=c.i%MW,ay=(c.i-ax)/MW,bx=c.j%MW,by=(c.j-bx)/MW,hor=ay===by,lo=hor?Math.min(ax,bx):Math.min(ay,by),hi=hor?Math.max(ax,bx):Math.max(ay,by);
    const u0=Math.round((lo*TILE+12)*r),u1=Math.round((hi*TILE+4)*r),mid=((hor?ay:ax)*TILE+8)*r,hw=Math.round((WORLD_WAYS.road.hw[1]-1)*k),v0=mid-hw,v1=mid+hw;
    // (the chunk's box, and as far round it as the bridge's rails rise and its piles hang)
    const deep=Math.ceil((BG.clear+4)*lh),bx0=hor?u0:v0,bx1=hor?u1:v1,by0=(hor?v0:u0)-BG.rail*k-2,by1=(hor?v1:u1)+deep;
    if(bx1<fx0||bx0>=fx0+W2||by1<fy0||by0>=fy0+H2)continue;
    let wl=1e9;for(const t of c.tiles)wl=Math.min(wl,LVT[t]);const dk=Math.max(wl+BG.clear,LVT[c.i],LVT[c.j]),stone=!!c.stone,P=hor?(u,v)=>[u,v]:(u,v)=>[v,u];
    // (the deck)
    for(let u=u0;u<=u1;u++)for(let v=v0;v<=v1;v++){const [x,y]=P(u,v),pl=Math.floor((u-u0)/(4*k));let col;
      if(stone){const row=Math.floor((v-v0)/(2*k)),o=(row&1)*1.5*k;col=C.sett[Math.floor(hs(Math.floor((u-u0+o)/(3*k)),row,541)*3)];if((u-u0+o)%(3*k)<k*.6||(v-v0)%(2*k)<k*.5)col=tmul(C.sett[1],.78)}
      else{col=C.plank[Math.floor(hs(pl,7,542)*3)];if((u-u0)%(4*k)<.6*k)col=tmul(C.plank[1],.72);if(hs(pl,v>>1,543)<.04)col=tmul(col,.85)}
      if(Math.abs(Math.abs(v-mid)-hw*WORLD_WAYS.road.track)<1.3*k)col=tmul(col,.92);
      if(v===v0&&hor||u===u0&&!hor)col=tmul(col,1.1);put(x,y,col)}
    // (under it: beams, then the piles or piers down to what lies under; along a crossing north to south its sides' beams and piles)
    const pile=BG.pile*k,arch=BG.arch*k;
    if(hor){for(let u=u0;u<=u1;u++){const fy=v1+1,lv=lvAt(u,fy+2),n=lv===null?Math.round(BG.clear*lh):Math.max(3,Math.round((dk-lv)*lh)),wet=wetAt(u,fy+2),tp=(u-u0)%pile,ta=(u-u0)%arch,end=Math.min(u-u0,u1-u);
        for(let dz=0;dz<n;dz++){let col=null;
          if(dz<3*k)col=dz<k?C.beam[0]:tmul(C.beam[0],.8);
          else if(end<4*k||!wet)col=C.stone[(Math.floor(dz/(3*k))+((u>>1)&1))%2?0:1];
          else if(stone){const q=(ta-5*k)/(arch-5*k);if(ta<5*k)col=C.stone[(Math.floor(dz/(3*k))+(u&1))%2?1:2];else{const top=3*k+(n-3*k)*(1-Math.sqrt(Math.max(0,1-(2*q-1)*(2*q-1))));col=dz<top?C.stone[(Math.floor(dz/(3*k))+(u>>1))%2?0:1]:dz<top+k?tmul(C.stone[2],.7):null}}
          else if(tp<2*k)col=tp<k?C.plank[1]:C.beam[0];
          else if(n>7*k&&(Math.abs(tp-2*k-(dz-3*k)*(pile-4*k)/Math.max(1,n-3*k))<.8*k||Math.abs(pile-2*k-tp-(dz-3*k)*(pile-4*k)/Math.max(1,n-3*k))<.8*k))col=tmul(C.beam[0],.9);
          if(col)put(u,fy+dz,col)}
        if(wet&&(tp<2*k||stone&&ta<5*k))put(u,fy+n,C.foam,false)}}
    else{for(let u=u0;u<=u1;u++){const tp=(u-u0)%pile,wet=wetAt(v0-2,u)||wetAt(v1+2,u);for(const [x,s] of [[v0-1,-1],[v1+1,1]]){put(x,u,C.beam[1]);put(x+s,u,tmul(C.beam[0],.85),false);
        if(wet&&(stone?(u-u0)%arch<5*k:tp<2*k)){for(let a=1;a<=2*k;a++)put(x+s*a,u,stone?C.stone[1]:C.beam[0]);put(x+s*(2*k+1),u,C.foam,false)}}}
      // (its south end over the bank)
      const lv=lvAt(mid,u1+2),n=lv===null?0:Math.round((dk-lv)*lh);for(let v=v0;v<=v1;v++)for(let dz=1;dz<=Math.max(2,n);dz++)put(v,u1+dz,dz<=2*k?C.beam[0]:C.stone[(Math.floor(dz/(3*k))+(v&1))%2?0:1])}
    // (the rails on posts, or the parapets: along both sides, rising rail px over their edge)
    const R=BG.rail*k,post=BG.post*k;
    for(const e of [v0,v1])for(let u=u0+k;u<=u1-k;u++){const [x,y]=P(u,e),ps=(u-u0)%post<1.2*k;
      if(stone){for(let j=1;j<=R-k;j++)put(x,y-j,j>=R-k-1?C.stone[0]:j===1?C.stone[2]:C.stone[((u>>1)+j)%3===0?2:1])}
      else if(ps)for(let j=1;j<=R+1;j++)put(x,y-j,j>=R?C.lit:C.beam[1]);
      else{put(x,y-R,C.lit);put(x,y-R+1,C.beam[1]);put(x,y-(R>>1),C.plank[0]);put(x,y-(R>>1)+1,C.beam[1])}}}}

// (a bridge's deck at game px, for what sails under it (worldart.js WorldArt.deck, world/ships.js): its deck and rails, one colour:
// only its shape is read)
function wayDeck(c){const ax=c.i%MW,ay=(c.i-ax)/MW,bx=c.j%MW,by=(c.j-bx)/MW,hor=ay===by,lo=hor?Math.min(ax,bx):Math.min(ay,by),hi=hor?Math.max(ax,bx):Math.max(ay,by),
    u0=lo*TILE+12,u1=hi*TILE+4,mid=(hor?ay:ax)*TILE+8,hw=Math.ceil((WORLD_WAYS.road.hw[1]-1)*WAY_LP),R=Math.ceil(WORLD_WAYS.bridge.rail*WAY_LP);
  const x=hor?u0:mid-hw,y=(hor?mid-hw:u0)-R,w=hor?u1-u0+1:2*hw+1,h=(hor?2*hw+1:u1-u0+1)+R+2;
  return {cv:mkc(w,h,g=>{g.fillStyle='#000';g.fillRect(0,0,w,h)}),x,y,foot:y+h-1}}
