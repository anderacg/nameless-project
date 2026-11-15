'use strict';
/* ---------- the world lab (doc/OPEN_WORLD_DESIGN.md phase 0; the owner, 2026-11-15: "Ok show me"): one stretch of land at the one
   pixel scale (1 world px = 1 figure px = 1 battle px), the land a height field drawn in layers you can see and climb. Opened
   straight from disk (engine/worldlab.html); nothing in the game reads it.
   The land: e(x, y), its height in levels (0 the sea's edge), a smooth field: the sea in the south-west, a beach and dunes, the land
   rising in terraces to a range of two peaks in the north-east with a saddle between them (the pass), a hill in the middle, a
   village on a flat shelf by the shore and a road from it up to the pass in switchbacks, its grade held to LAB.road.grade (cut into
   the hill on one side, built up on the other). Each pixel stands level × lh px higher on the screen (lh: the owner's "make it
   adjustable"); a terrace is flat at its level and its south face shows below it (an earth bank for a gentle step, a rock face with
   a ledge at every level for a steep one); the road and its shoulders are smooth, not stepped.
   Walking: by the slope (g, levels a px) where you step: flat, slope (uphill slower, downhill faster), steep (on foot, slow), cliff
   (only a climber, slowly, on stamina); water no one. Painted once (and again when lh changes) with a depth buffer: for every
   screen pixel the world y of the ground drawn there, which hides what stands behind a ridge and turns a click into a place. ---------- */
(function(PX){
  // the lab's numbers: the stretch (px), the cell (the battle's), lh (px a level: the owner's slider, lhMin to lhMax), the levels
  // where the beach, dunes, bare rock and snow begin, the peaks and the hill ([x, y, radius as shares of W, height in levels]),
  // the village's shelf, the road (its width, shoulders and most levels a px along it), the walk (px a second, the battle's
  // militia), steps: the range's shelves (a rise every band levels, as sharp as sharp where its noise (sc px) passes at), the
  // slope classes (g at least: slope, steep, cliff) and what each does (speed up and down, stamina a second), the woods (noise
  // scale and threshold), the zoom (screen px a world px; phoneZoom on a screen narrower than phone px).
  // The river (the owner, 2026-11-15: "add rivers water and etc"): from a tarn (its ellipse) high on the range down to the sea along
  // pts (shares of W, H), meandering meander px; half as wide as w[0] at its source to w[1] at its mouth (px), its banks bank px; its
  // surface never rising downstream, stepped by levels (a fall where it drops); a stream no wider than wade px is waded; a ford at
  // ford (a share of its length), the mill beside it at mill; it ends where its surface comes down to mouth levels (the sea). The road (the owner: "make those road more realistic"): a curve
  // through its points, ruts rut px either side of its crown, a grassy crown on its flat stretches, puddles in the ruts where it is
  // flat (puddle: the noise past which), its edge ragged by edge px; a stone parapet where it runs along a drop of wall levels.
  // Its half-width wanders by vary of itself; its two wheel tracks at track of it from the middle, wandering wander px; gravel: a
  // share of its outer ground that is loose stones. Its bends (the owner, 2026-11-15: "looks weird for roads when have a sharp
  // turn"): each corner a round arc of bend px (less where its legs are short), climbed at turnGrade of the grade (a hairpin
  // nearly level); the ground between two legs of it more than legs points apart takes both legs' heights, so a switchback's
  // inside is one smooth bank
  const LAB={W:2048,H:1280,cell:16,lh:8,lhMin:4,lhMax:16,seed:7,
    beach:.45,dune:.95,rock:9,snow:11.5,shore:{wet:5,sand:34,dune:80},
    peaks:[[.66,.15,.26,11],[.93,.36,.24,9.5]],steps:{band:3,sharp:16,sc:110,at:.38},hill:[.40,.42,.14,2.2],shelf:{x:.21,y:.73,rx:190,ry:120,e:1.4},
    road:{w:26,sh:22,grade:1/34,bend:30,turnGrade:.35,legs:40,rut:5,edge:3,puddle:.74,wall:2,vary:.18,track:.42,wander:1.3,gravel:.07,pts:[[.13,.80],[.21,.73],[.31,.69],[.42,.61],[.50,.53],[.60,.50],[.70,.47],[.62,.41],[.73,.36],[.67,.31],[.79,.26],[.86,.14],[.88,0]]},
    river:{pts:[[.588,.118],[.565,.20],[.525,.28],[.475,.36],[.435,.46],[.395,.55],[.355,.62],[.338,.70],[.343,.79],[.328,.88],[.31,1]],
      w:[2.5,11],bank:9,meander:14,ford:.5,mill:.64,mouth:.15,tarn:{x:.597,y:.10,rx:48,ry:26}},
    walk:38,run:1.6,
    cls:{slope:.035,steep:.11,cliff:.22},
    // (depth, in levels (a level about 0.85 m): past bands[0] ankle-deep, [1] knee, [2] waist, beyond it you swim; speed and cut
    //  (px of a man under the water) by each (dry, ankle, knee, waist, swimming); clear: how deep the bed still shows; swimCost: a
    //  cell of deep water to the way-finder; river: its depth at its middle from source to mouth; ford: its share there; tarn: its
    //  depth at the middle)
    depth:{bands:[.12,.35,.8],speed:[1,.85,.6,.35,.3],cut:[0,1,4,8,12],clear:.9,swimCost:9,river:[.2,1.5],ford:.25,tarn:1.6},
    speed:{flat:1,road:1.1,sand:.85,dune:.8,snow:.55,wood:.85,up:.5,down:1.15,steep:.3,cliff:.16},
    sta:{slope:.03,steep:.08,cliff:.18,wade:.04,swim:.12,rest:.06},
    woods:{sc:170,at:.56,step:11,fringe:.06},
    // (the biomes blended (the owner, 2026-11-15: "make the transition between biomes more blend"): each ground's own colour shifted
    //  toward its neighbours' over r px, k of the way, the edge ragged by a warp of warp px)
    blend:{r:8,k:.85,warp:10},
    // (a road's cutting: earth begins to show at slope from, all earth (but its tufts) by to; rag: how ragged that is; earth: its most
    //  share; lit: the warm earth of its upper part)
    cut:{from:.04,to:.2,rag:.9,earth:.92,lit:[176,140,96]},zoom:2,phoneZoom:1.5,phone:700};

  const hsh=(x,y,s)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1274126177);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};
  const vn=(x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),a=hsh(xi,yi,s),b=hsh(xi+1,yi,s),c=hsh(xi,yi+1,s),d=hsh(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
  const fbm=(x,y,s,n)=>{let t=0,a=.5,f=1,m=0;for(let i=0;i<n;i++){t+=vn(x*f,y*f,s+i*17)*a;m+=a;a*=.5;f*=2}return t/m};
  const smooth=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
  const hex=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
  const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  const mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];

  // (shore: px from the water: wet sand, then the beach, then the dunes)
  // the colours (the battle map's grass palette, PX.GROUND_PAL, where it has them)
  const GP=PX.GROUND_PAL.grass;
  const COL={grass:GP.base.map(hex),meadow:[[92,138,60],[108,152,68],[126,166,80]],wood:[[52,84,40],[60,94,44],[70,104,50]],
    sand:[[222,204,150],[232,216,166],[240,226,180]],wet:[[188,168,120],[198,178,128]],dune:[[204,190,128],[180,176,112]],
    road:[[150,122,84],[164,136,94],[178,150,104]],rut:[120,96,66],
    rock:GP.rock.c.map(hex),snow:[[226,232,240],[240,244,250],[250,252,255]],
    face:GP.face.map(hex),bank:[[120,98,66],[98,80,56],[78,64,46]],lip:[70,104,48],
    sea:[[120,196,200],[70,150,186],[44,104,160],[30,72,128]],foam:[236,244,246],
    tuft:GP.tuft.map(hex),flower:[[230,214,120],[220,140,160],[236,236,236],[150,150,220]],drift:[126,100,72],shell:[244,236,220],marram:[[168,170,96],[132,140,74]],
    scree:[[150,148,138],[118,116,110]],
    river:[[118,190,196],[84,156,184],[58,118,160]],tarn:[[96,160,190],[54,104,150]],fall:[[236,244,248],[182,216,232],[134,180,208]],
    mud:[[104,96,62],[86,80,52]],reed:[[120,150,64],[96,124,52],[150,118,72]],
    shallow:[[150,212,204],[90,170,190],[52,118,170],[30,72,128]],seabed:[[214,196,146],[196,178,128]],pebble:[[150,140,118],[122,114,98],[170,160,136],[104,98,86]],tarnbed:[[96,100,98],[78,82,84]],
    plank:[[154,112,70],[138,98,60],[166,124,80]],beam:[[92,64,40],[70,48,30]],stone:[[176,170,156],[150,144,132],[118,114,106]],puddle:[[118,138,150],[150,172,184]]};

  // the land's height (levels) at a px, before the road and the shelf
  function elev(x,y){const W=LAB.W,H=LAB.H,u=x/W,v=y/H,s=LAB.seed;
    let e=-1.6+(u*.62+(1-v)*.52)*6+(fbm(x/240,y/240,s+11,4)-.5)*3.4;
    // (the range stepped: shelves with a sharp rise every band levels (a cliff where the noise says, a ramp where it does not))
    let m=0;for(const [px,py,r,h] of LAB.peaks){const d=Math.hypot(x-px*W,y-py*H)/(r*W);if(d<1)m+=h*Math.pow(1-d,1.2)*(.8+.4*fbm(x/80,y/80,s+23,3))}
    if(m>0){const M=LAB.steps,k=m/M.band,f=k-Math.floor(k),sh=1+(M.sharp-1)*smooth((fbm(x/M.sc,y/M.sc,s+24,2)-M.at)/.2);e+=(Math.floor(k)+Math.pow(f,sh))*M.band}
    {const [px,py,r,h]=LAB.hill,d=Math.hypot(x-px*W,y-py*H)/(r*W);if(d<1)e+=h*smooth(1-d)}
    const S=LAB.shelf,ds=Math.hypot((x-S.x*W)/S.rx,(y-S.y*H)/S.ry);if(ds<1.4){const k=smooth((1.4-ds)/.4);e=e+(S.e-e)*k}
    return e}

  // a Catmull-Rom curve through P (px), a point every step px
  function spline(P,step){const out=[];for(let i=0;i+1<P.length;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)],n=Math.max(1,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/step));
      for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t;out.push([0,1].map(j=>.5*(2*p1[j]+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3)))}}
    out.push(P[P.length-1].slice());return out}
  // every px within reach of the polyline pts: D its distance, I where along it (a fractional index)
  function bandOf(pts,reach){const W=LAB.W,H=LAB.H,D=new Float32Array(W*H).fill(1e9),I=new Float32Array(W*H);
    for(let i=0;i+1<pts.length;i++){const [ax,ay]=pts[i],[bx,by]=pts[i+1],dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy||1;
      for(let y=Math.max(0,Math.floor(Math.min(ay,by)-reach));y<=Math.min(H-1,Math.ceil(Math.max(ay,by)+reach));y++)
        for(let x=Math.max(0,Math.floor(Math.min(ax,bx)-reach));x<=Math.min(W-1,Math.ceil(Math.max(ax,bx)+reach));x++){
          const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/l2)),d=Math.hypot(x-ax-dx*t,y-ay-dy*t),j=y*W+x;if(d<D[j]){D[j]=d;I[j]=i+t}}}
    return {D,I}}
  const along=(A,f)=>{const i=Math.min(A.length-1,Math.floor(f)),j=Math.min(A.length-1,i+1),t=f-Math.floor(f);return A[i]+(A[j]-A[i])*t};

  // the road: its polyline (px), heights along it (the land's, the grade held by passes both ways, then smoothed), and every px
  // near it: its distance and the road's height there
  // a path through P with each corner rounded: straight legs and a circular arc of radius r (less where the legs are short) at each
  // turn; its points every step px, turn[i] 1 on an arc
  function filleted(P,r,step){const pts=[],turn=[],line=(a,b,f)=>{const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let k=0;k<n;k++){pts.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);turn.push(f)}};
    let from=P[0];
    for(let i=1;i<P.length-1;i++){const a=P[i-1],b=P[i],c=P[i+1],l1=Math.hypot(b[0]-a[0],b[1]-a[1]),l2=Math.hypot(c[0]-b[0],c[1]-b[1]),d1=[(b[0]-a[0])/l1,(b[1]-a[1])/l1],d2=[(c[0]-b[0])/l2,(c[1]-b[1])/l2],
        th=Math.acos(Math.max(-1,Math.min(1,d1[0]*d2[0]+d1[1]*d2[1]))),cr=d1[0]*d2[1]-d1[1]*d2[0];
      if(th<.05){line(from,b,0);from=b;continue}
      const L=Math.min(r*Math.tan(th/2),.45*l1,.45*l2),rr=L/Math.tan(th/2),A=[b[0]-d1[0]*L,b[1]-d1[1]*L],sg=cr>0?1:-1,O=[A[0]-d1[1]*rr*sg,A[1]+d1[0]*rr*sg];
      line(from,A,0);const a0=Math.atan2(A[1]-O[1],A[0]-O[0]),n=Math.max(2,Math.ceil(rr*th/step));for(let k=0;k<n;k++){const q=a0+sg*th*k/n;pts.push([O[0]+Math.cos(q)*rr,O[1]+Math.sin(q)*rr]);turn.push(1)}
      from=[b[0]+d2[0]*L,b[1]+d2[1]*L]}
    line(from,P[P.length-1],0);pts.push(P[P.length-1].slice());turn.push(0);return {pts,turn}}
  // every px near the polyline pts: as bandOf, and D2, I2 the nearest of another part of it (gap points or more along it away)
  function bandOf2(pts,reach,gap){const W=LAB.W,H=LAB.H,D=new Float32Array(W*H).fill(1e9),I=new Float32Array(W*H),D2=new Float32Array(W*H).fill(1e9),I2=new Float32Array(W*H);
    for(let i=0;i+1<pts.length;i++){const [ax,ay]=pts[i],[bx,by]=pts[i+1],dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy||1;
      for(let y=Math.max(0,Math.floor(Math.min(ay,by)-reach));y<=Math.min(H-1,Math.ceil(Math.max(ay,by)+reach));y++)
        for(let x=Math.max(0,Math.floor(Math.min(ax,bx)-reach));x<=Math.min(W-1,Math.ceil(Math.max(ax,bx)+reach));x++){
          const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/l2)),d=Math.hypot(x-ax-dx*t,y-ay-dy*t),j=y*W+x,f=i+t;
          if(d<D[j]){if(D[j]<1e9&&Math.abs(I[j]-f)>gap){D2[j]=D[j];I2[j]=I[j]}D[j]=d;I[j]=f}else if(d<D2[j]&&Math.abs(I[j]-f)>gap){D2[j]=d;I2[j]=f}}}
    for(let j=0;j<W*H;j++)if(D2[j]<1e9&&Math.abs(I2[j]-I[j])<=gap)D2[j]=1e9;
    return {D,I,D2,I2}}

  function roadOf(E){const W=LAB.W,H=LAB.H,R=LAB.road,F=filleted(R.pts.map(([u,v])=>[u*W,v*H]),R.bend,2),pts=F.pts;
    const at=(x,y)=>E[Math.min(H-1,Math.max(0,Math.round(y)))*W+Math.min(W-1,Math.max(0,Math.round(x)))];
    let r=pts.map(([x,y])=>at(x,y));const ds=i=>2*R.grade*(F.turn[i]?R.turnGrade:1);
    for(let it=0;it<6;it++){for(let i=1;i<r.length;i++)r[i]=Math.min(Math.max(r[i],r[i-1]-ds(i)),r[i-1]+ds(i));for(let i=r.length-2;i>=0;i--)r[i]=Math.min(Math.max(r[i],r[i+1]-ds(i)),r[i+1]+ds(i))}
    for(let it=0;it<3;it++){const q=r.slice();for(let i=0;i<r.length;i++){let s=0,n=0;for(let j=-8;j<=8;j++){const k=i+j;if(k>=0&&k<r.length){s+=q[k];n++}}r[i]=s/n}}
    const {D,I,D2,I2}=bandOf2(pts,R.w/2+R.sh+2,R.legs),RE=new Float32Array(W*H),RE2=new Float32Array(W*H);for(let j=0;j<W*H;j++){if(D[j]<1e9)RE[j]=along(r,I[j]);if(D2[j]<1e9)RE2[j]=along(r,I2[j])}
    return {pts,r,turn:F.turn,D,I,RE,D2,RE2}}

  // the river: its course (a curve, meandering), its surface along it (the land's, never rising downstream), its half-width; every
  // px near it: RV 1 water, 2 bank, 3 ford; RW the half-width there, RT px along it
  function riverOf(E){const W=LAB.W,H=LAB.H,V=LAB.river,s=LAB.seed,c=spline(V.pts.map(([u,v])=>[u*W,v*H]),2),n=c.length;
    const pts=c.map((p,i)=>{const a=c[Math.max(0,i-1)],b=c[Math.min(n-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,o=(fbm(i/45,.5,s+70,2)-.5)*2*V.meander*Math.min(1,i/40);return [p[0]-dy/l*o,p[1]+dx/l*o]});
    const at=(x,y)=>E[Math.min(H-1,Math.max(0,Math.round(y)))*W+Math.min(W-1,Math.max(0,Math.round(x)))];
    const rh=pts.map(([x,y])=>at(x,y));for(let i=1;i<n;i++)rh[i]=Math.min(rh[i],rh[i-1]-.0004);
    const rw=pts.map((_,i)=>V.w[0]+(V.w[1]-V.w[0])*Math.pow(i/(n-1),.8)+(fbm(i/30,2.5,s+71,2)-.5)*1.6);
    const {D,I}=bandOf(pts,V.w[1]+V.bank+3),RV=new Uint8Array(W*H),RW=new Float32Array(W*H),RT=new Float32Array(W*H),DP=new Float32Array(W*H),fi=V.ford*(n-1),Dp=LAB.depth;
    for(let j=0;j<W*H;j++){if(D[j]>=1e9)continue;const f=I[j],w=along(rw,f),h=along(rh,f),d=D[j];if(h<V.mouth)continue;
      if(d<w){E[j]=Math.min(E[j],h)-.001;RV[j]=Math.abs(f-fi)<w/2+5?3:1;RW[j]=w;RT[j]=f*2;
        // (deepest down its middle, deeper downstream; shallow at the ford)
        const base=Dp.river[0]+(Dp.river[1]-Dp.river[0])*f/(n-1),q=d/w;DP[j]=(base*(1-q*q)+.04)*(RV[j]===3?Dp.ford:1)}
      else if(d<w+V.bank){const tg=h+.5;if(E[j]>tg)E[j]=tg+(E[j]-tg)*smooth((d-w)/V.bank);RV[j]=2;RW[j]=w;RT[j]=f*2}}
    // (the tarn it rises from: still water, its rim a bank)
    const T=V.tarn,tx=T.x*W,ty=T.y*H,tl=Math.floor(at(tx,ty))-.001;
    for(let y=Math.max(0,Math.floor(ty-T.ry*1.6));y<Math.min(H,ty+T.ry*1.6);y++)for(let x=Math.max(0,Math.floor(tx-T.rx*1.6));x<Math.min(W,tx+T.rx*1.6);x++){const j=y*W+x,q=Math.hypot((x-tx)/T.rx,(y-ty)/T.ry)+(fbm(x/20,y/20,s+72,2)-.5)*.3;
      if(q<1){E[j]=tl;RV[j]=1;RW[j]=99;RT[j]=0;DP[j]=(1-q)*Dp.tarn+.05}else if(q<1.5&&RV[j]!==1){const tg=tl+.5;if(E[j]>tg)E[j]=tg+(E[j]-tg)*smooth((q-1)/.5);RV[j]=2;RW[j]=99}}
    return {pts,rh,rw,D,RV,RW,RT,DP}}

  /* the land made: E (levels, the road and its shoulders in), smooth (1 where the ground is not stepped), kind (by px), g (slope:
     levels a px), gx/gy its way uphill. Kinds: 0 water, 1 wet sand, 2 sand, 3 dune, 4 grass, 5 meadow, 6 wood floor, 7 road,
     8 scree, 9 rock, 10 snow, 11 river (or the tarn), 12 ford, 13 bridge, 14 river bank, 15 a road's cutting or embankment (its
     shoulders where they are steep: earth, grass clinging to it) */
  const K={water:0,wet:1,sand:2,dune:3,grass:4,meadow:5,wood:6,road:7,scree:8,rock:9,snow:10,river:11,ford:12,bridge:13,bank:14,cut:15};
  const KNAME=['sea','wet sand','sand','dunes','grass','meadow','woods','road','scree','rock','snow','river','ford','bridge','river bank','road cutting'];
  function makeLand(){const t0=performance.now(),W=LAB.W,H=LAB.H,s=LAB.seed,E=new Float32Array(W*H),st=4,CW=W/st+2,CH=H/st+2,Cg=new Float32Array(CW*CH);
    for(let cy=0;cy<CH;cy++)for(let cx=0;cx<CW;cx++)Cg[cy*CW+cx]=elev(cx*st,cy*st);
    for(let y=0;y<H;y++){const cy=Math.floor(y/st),fy=y/st-cy;for(let x=0;x<W;x++){const cx=Math.floor(x/st),fx=x/st-cx,i=cy*CW+cx;
      E[y*W+x]=(Cg[i]*(1-fx)+Cg[i+1]*fx)*(1-fy)+(Cg[i+CW]*(1-fx)+Cg[i+CW+1]*fx)*fy}}
    const road=roadOf(E),river=riverOf(E),RV=river.RV,R=LAB.road,SM=new Uint8Array(W*H),KD=new Uint8Array(W*H);
    // (the road's edge ragged; over the river its deck (a bridge), the water left beside it)
    const RD=new Float32Array(W*H),HW=new Float32Array(W*H);for(let i=0;i<W*H;i++){const d=road.D[i];RD[i]=d>=1e9?d:d-(fbm((i%W)/26,((i/W)|0)/26,s+73,2)-.5)*2*R.edge;HW[i]=d>=1e9?0:R.w/2*(1+R.vary*(vn(road.I[i]/30,.5,s+95)-.5)*2)}
    for(let i=0;i<W*H;i++){const d=RD[i],hw=HW[i];if(d<hw){E[i]=road.RE[i];SM[i]=1}else if(d<hw+R.sh&&RV[i]!==1&&RV[i]!==3){let rt=road.RE[i],k=smooth((d-hw)/R.sh);
        const d2=road.D2[i];if(d2<hw+R.sh){const w1=1/((d-hw+1)**2),w2=1/((Math.max(d2-hw,0)+1)**2);rt=(rt*w1+road.RE2[i]*w2)/(w1+w2);k*=smooth((d2-hw)/R.sh)}
        E[i]=rt+(E[i]-rt)*k;SM[i]=1}}
    const G=new Float32Array(W*H),GX=new Float32Array(W*H),GY=new Float32Array(W*H),o=3;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,a=E[y*W+Math.min(W-1,x+o)]-E[y*W+Math.max(0,x-o)],b=E[Math.min(H-1,y+o)*W+x]-E[Math.max(0,y-o)*W+x];GX[i]=a/(2*o);GY[i]=b/(2*o);G[i]=Math.hypot(GX[i],GY[i])}
    // (how far each px is from the water: two chamfer passes)
    const DW=new Float32Array(W*H);for(let i=0;i<W*H;i++)DW[i]=E[i]<0?0:1e6;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;let d=DW[i];if(!d)continue;if(x>0)d=Math.min(d,DW[i-1]+1);if(y>0){d=Math.min(d,DW[i-W]+1);if(x>0)d=Math.min(d,DW[i-W-1]+1.414);if(x<W-1)d=Math.min(d,DW[i-W+1]+1.414)}DW[i]=d}
    for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const i=y*W+x;let d=DW[i];if(!d)continue;if(x<W-1)d=Math.min(d,DW[i+1]+1);if(y<H-1){d=Math.min(d,DW[i+W]+1);if(x<W-1)d=Math.min(d,DW[i+W+1]+1.414);if(x>0)d=Math.min(d,DW[i+W-1]+1.414)}DW[i]=d}
    const S=LAB.shelf,Wd=LAB.woods,B=LAB.shore;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,e=E[i],g=G[i];let k;
      const wob=fbm(x/50,y/50,s+63,2)-.5,dw=DW[i];
      const rv=RV[i],onRoad=RD[i]<HW[i];
      if(onRoad&&(rv===1||rv===3))k=K.bridge;else if(e<0&&!rv)k=K.water;else if(rv===1)k=e<0?K.water:K.river;else if(rv===3)k=K.ford;else if(onRoad)k=K.road;
      else if(rv===2&&(river.RW[i]>50||river.D[i]<river.RW[i]+4))k=K.bank;
      else if(SM[i]&&g>=LAB.cls.slope*1.5&&e>=LAB.dune)k=K.cut;else if(dw<B.wet+wob*4)k=K.wet;else if(dw<B.sand+wob*24&&e<LAB.dune)k=K.sand;else if(dw<B.dune+wob*40&&e<LAB.dune+.6)k=K.dune;
      else if(e>=LAB.snow+(fbm(x/40,y/40,s+61,2)-.5)*1.6)k=K.snow;else if(e>=LAB.rock+(fbm(x/50,y/50,s+62,2)-.5)*2||g>=LAB.cls.cliff)k=K.rock;
      else if(g>=LAB.cls.steep&&e>2)k=K.scree;
      else{const inShelf=Math.hypot((x-S.x*W)/S.rx,(y-S.y*H)/S.ry)<1.2,w=fbm(x/Wd.sc,y/Wd.sc,s+41,3);
        k=!inShelf&&RD[i]>HW[i]+10&&!rv&&e>=1&&e<8&&w>Wd.at?K.wood:fbm(x/60,y/60,s+44,2)>.62?K.meadow:K.grass}
      KD[i]=k}
    // (every water px's depth: the sea's how far the land lies under it, the river's and the tarn's their own)
    const DP=new Float32Array(W*H);for(let i=0;i<W*H;i++){const k=KD[i];if(k===K.water)DP[i]=Math.max(-E[i],river.DP[i]);else if(k===K.river||k===K.ford)DP[i]=river.DP[i]}
    return {E,SM,KD,G,GX,GY,road,river,RD,HW,DP,ms:performance.now()-t0}}

  /* painting: the terrain canvas (W x H+T, T the highest lift), its depth (the world y of the ground at each of its px, -1 none)
     and the walk map. Column by column, north to south: each px's top at y - lift + T; where the ground ahead is lower, this px's
     south face fills down to it (a bank or a rock face, a ledge line at every level, snow on a high ledge's lip) */
  function paint(L){const t0=performance.now(),W=LAB.W,H=LAB.H,lh=LAB.lh,s=LAB.seed,E=L.E,SM=L.SM,KD=L.KD,G=L.G;
    const lift=new Int16Array(W*H);let top=0;
    for(let i=0;i<W*H;i++){const e=E[i];const h=e<=0?0:SM[i]?Math.round(e*lh):Math.floor(e)*lh;lift[i]=h;if(h>top)top=h}
    const T=top+8,CH=H+T,cv=document.createElement('canvas');cv.width=W;cv.height=CH;const g=cv.getContext('2d'),img=g.createImageData(W,CH),D=img.data,dep=new Int16Array(W*CH).fill(-1);
    const put=(x,y,c,wy)=>{if(y<0||y>=CH)return;const o=(y*W+x)*4;D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2];D[o+3]=255;dep[y*W+x]=wy};
    // (a tone by patches a few px across, a little grain within)
    const pick=(L3,x,y,sd)=>L3[Math.min(L3.length-1,Math.floor((vn(x/5,y/5,sd)*.8+hsh(x,y,sd+1)*.2)*L3.length))];
    // water's colour by its depth (shallow, then deeper, then deep), the bed (bed) showing through it while it is shallow, and the
    // light caught in the shallows
    const underWater=(x,y,i,bed)=>{const d=L.DP[i],S=COL.shallow,Dp=LAB.depth;let c=d<.4?mix(S[0],S[1],d/.4):d<1?mix(S[1],S[2],(d-.4)/.6):mix(S[2],S[3],Math.min(1,(d-1)));
      const a=Math.pow(Math.max(0,1-d/Dp.clear),1.4);c=mix(c,bed,a*.8);if(a>.15&&vn(x/3,y/3,s+93)>.74)c=mix(c,[232,246,246],.22*a);return c};
    /* a dirt road as it is worn: its side of the middle (sd: signed px), two wheel tracks (light, packed) wandering a little, a
       dark groove down each; between them the crown, a little higher, grass in tufts on it where the road is flat; outside them
       loose ground and gravel; at its edge the grass creeping in, dithered, a dark line of trodden soil inside it; puddles lying
       in the tracks where it is flat */
    const RCOL={pack:[[176,148,104],[168,140,98]],groove:[118,94,66],crown:[[150,124,86],[142,116,80]],loose:[[136,110,76],[126,102,70],[146,120,84]],
      gravel:[[178,170,154],[150,144,130],[118,112,102]],soil:[96,78,54],sky:[170,196,210]};
    const roadCol=(x,y,i,n)=>{const RR=LAB.road,Rd=L.road,f=Rd.I[i],j=Math.min(Rd.pts.length-2,Math.floor(f)),a=Rd.pts[j],b=Rd.pts[j+1],t=f*2,
        side=Math.sign((b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]))||1,sd=Rd.D[i]*side,hw=L.HW[i],dr=L.RD[i],flat=L.G[i]<.015,
        rk=hw*RR.track+(vn(t/40,.5,s+98)-.5)*2*RR.wander,tr=Math.min(Math.abs(sd-rk),Math.abs(sd+rk));
      let c;
      if(tr<.7)c=RCOL.groove;
      else if(tr<2.2)c=RCOL.pack[vn(x/4,y/4,s+99)>.5?0:1];
      else if(Math.abs(sd)<rk){c=RCOL.crown[vn(x/5,y/5,s+100)>.5?0:1];if(flat&&vn(x/4,y/4,s+101)>.58)c=mix(c,COL.grass[n<.5?1:2],.7)}
      else{c=RCOL.loose[Math.floor(vn(x/3,y/3,s+102)*2.99)];if(hsh(x,y,s+103)<RR.gravel)c=RCOL.gravel[Math.floor(hsh(x,y,s+104)*3)]}
      // (puddles: in the tracks where the road is flat, the sky in them, a dark rim)
      if(flat&&tr<2.6&&fbm(x/14,y/14,s+74,2)>RR.puddle){const q=fbm(x/14,y/14,s+74,2)-RR.puddle;c=q<.02?RCOL.soil:mix(mix(COL.puddle[0],RCOL.soil,.4),RCOL.sky,hsh(x>>1,y,s+75)<.15?.45:.1)}
      // (the verge: the grass creeping in, dithered, the trodden soil inside it)
      const v=dr-(hw-3.5);if(v>0){if(hsh(x,y,s+105)<v/3.5*.9+(vn(x/3,y/3,s+106)-.5)*.5)c=COL.grass[hsh(x,y,s+107)<.5?1:2];else if(v<1.2)c=mix(c,RCOL.soil,.5)}
      return c};
    // the biomes blended: each px's ground's plain colour (its palette's middle), averaged over blend.r px round it among the grounds
    // that blend (not water, roads, bridges), sampled through a warp so the edge is ragged; a px's colour shifts by the difference
    const KB=[],mean=L3=>[0,1,2].map(j=>L3.reduce((a,c)=>a+c[j],0)/L3.length),BLEND=new Uint8Array(16);
    KB[K.wet]=mean(COL.wet);KB[K.sand]=mean(COL.sand);KB[K.dune]=mix(mean(COL.sand),COL.dune[0],.45);KB[K.grass]=mean(COL.grass);KB[K.meadow]=mean(COL.meadow);KB[K.wood]=mean(COL.wood);
    KB[K.scree]=mean(COL.scree);KB[K.rock]=mean(COL.rock.slice(0,3));KB[K.snow]=mean(COL.snow);KB[K.bank]=mix(mean(COL.mud),mean(COL.grass),.5);KB[K.cut]=mix(mean(COL.bank),mean(COL.grass),.5);
    for(const k of [K.wet,K.sand,K.dune,K.grass,K.meadow,K.wood,K.scree,K.rock,K.snow,K.bank])BLEND[k]=1;
    const BR=new Float32Array(W*H),BG=new Float32Array(W*H),BB=new Float32Array(W*H),BM=new Float32Array(W*H);
    for(let i=0;i<W*H;i++){const k=KD[i];if(!BLEND[k])continue;const c=KB[k];BR[i]=c[0];BG[i]=c[1];BB[i]=c[2];BM[i]=1}
    {const r=LAB.blend.r,tmp=new Float32Array(Math.max(W,H));
      const box=(A,len,stride,start)=>{let acc=0;for(let k=-r;k<=r;k++){const q=Math.min(len-1,Math.max(0,k));acc+=A[start+q*stride]}
        for(let k=0;k<len;k++){tmp[k]=acc;const o=Math.max(0,k-r),p=Math.min(len-1,k+r+1);acc+=A[start+p*stride]-A[start+o*stride]}for(let k=0;k<len;k++)A[start+k*stride]=tmp[k]};
      for(const A of [BR,BG,BB,BM])for(let pass=0;pass<2;pass++){for(let y=0;y<H;y++)box(A,W,1,y*W);for(let x=0;x<W;x++)box(A,H,W,x)}}
    const blendAt=(x,y,k,c)=>{const B=LAB.blend,wx=Math.min(W-1,Math.max(0,Math.round(x+(vn(x/12,y/12,s+108)-.5)*B.warp))),wy=Math.min(H-1,Math.max(0,Math.round(y+(vn(x/12+9,y/12,s+109)-.5)*B.warp))),j=wy*W+wx,m=BM[j];
      if(!m)return c;const o=KB[k];return [c[0]+(BR[j]/m-o[0])*B.k,c[1]+(BG[j]/m-o[1])*B.k,c[2]+(BB[j]/m-o[2])*B.k]};
    // a px's top colour
    const topCol=(x,y,i)=>{const k=KD[i],e=E[i],n=hsh(x,y,s+5);let c;
      switch(k){
        case K.water:{c=underWater(x,y,i,COL.seabed[Math.sin(x*.35+y*.12+vn(x/12,y/12,s+90)*6)>.55?0:1]);if(n<.006&&L.DP[i]>.5)c=mix(c,COL.foam,.4);break}
        case K.wet:c=pick(COL.wet,x,y,s+6);break;case K.sand:c=pick(COL.sand,x,y,s+7);break;
        case K.dune:c=mix(pick(COL.sand,x,y,s+8),COL.dune[n<.5?0:1],.45);break;
        case K.road:c=roadCol(x,y,i,n);break;
        case K.bridge:{const RR=LAB.road,d=L.road.D[i],t=L.road.I[i]*2;c=pick(COL.plank,Math.floor(t/3),3,s+77);if(t%3<.9)c=COL.beam[1];if(Math.abs(d-RR.rut)<1.2)c=mul(c,.9);
          if(d>RR.w/2-2.5)c=Math.floor(t)%6<1.5?COL.beam[1]:COL.plank[2];break}
        case K.river:{const tarn=L.river.RW[i]>50;c=underWater(x,y,i,tarn?COL.tarnbed[hsh(x>>1,y>>1,s+78)<.5?0:1]:COL.pebble[Math.floor(hsh(x>>1,y>>1,s+91)*4)]);if(!tarn&&n<.004)c=COL.stone[1];break}
        case K.ford:c=underWater(x,y,i,COL.pebble[Math.floor(hsh(x>>1,y>>1,s+92)*4)]);if(hsh(x>>1,y>>1,s+79)<.12)c=COL.stone[hsh(x,y,s+80)<.5?0:1];break;
        case K.cut:{
          // (earth showing as the bank steepens, gradually and in ragged patches; lighter and warmer up its sunlit upper part, darker
          //  at its foot; tufts regrowing on it, the fewer the steeper; the grass of its lip hanging over)
          const C=LAB.cut,t=smooth((L.G[i]-C.from)/(C.to-C.from)+(vn(x/6,y/6,s+110)-.5)*C.rag),up=smooth((L.road.D[i]-L.HW[i])/LAB.road.sh),q=vn(x/3,y/3,s+111)*.55+hsh(x,y,s+112)*.45;
          if(q<t*C.earth){const E1=mix(COL.bank[2],COL.bank[0],.35+.65*up);c=mix(E1,C.lit,up*.35*vn(x/5,y/4,s+113));if(hsh(x,y,s+114)<.03)c=mix(c,COL.stone[1],.6)}
          else c=pick(COL.grass,x,y,s+115);
          if(q>=t*C.earth&&q<t*C.earth+.06)c=mul(c,.82);break}
        case K.bank:c=mix(pick(COL.mud,x,y,s+81),COL.grass[0],L.river.RW[i]>50?.5:Math.min(1,Math.max(0,(L.river.D[i]-L.river.RW[i])/4)));break;
        case K.scree:c=mix(pick(COL.scree,x,y,s+10),COL.grass[0],hsh(x>>2,y>>2,s+11)<.3?.4:0);break;
        case K.rock:{c=pick(COL.rock.slice(0,3),x,y,s+12);const gp=smooth((vn(x/14,y/14,s+13)-.56)/.12+(hsh(x,y,s+14)-.5)*.6);if(gp>0)c=mix(c,COL.grass[0],.55*gp);break}
        case K.snow:c=pick(COL.snow,x,y,s+14);break;
        case K.wood:c=pick(COL.wood,x,y,s+15);break;
        case K.meadow:c=pick(COL.meadow,x,y,s+16);break;
        default:c=pick(COL.grass,x,y,s+17)}
      if(BLEND[k])c=blendAt(x,y,k,c);
      // (higher land a little cooler and darker; the smooth ground lit from the west by its slope)
      if(k>=K.grass&&k<=K.wood)c=mix(c,[60,84,64],Math.min(.35,Math.max(0,e-3)*.04));
      if(SM[i]&&k!==K.water){const sl=(L.GX[i]*-1+L.GY[i]*-.6)*lh*.55;c=mul(c,1+Math.max(-.16,Math.min(.12,sl)))}
      return c};
    for(let x=0;x<W;x++){
      for(let y=0;y<H;y++){const i=y*W+x,h=lift[i],sy=y-h+T,k=KD[i];let c=topCol(x,y,i);
        // (the lip: a step's edge lit; the foot of a face in its shade)
        const hs=y+1<H?lift[i+W]:0,hn=y>0?lift[i-W]:h;
        const wet=k===K.river||k===K.ford;
        if(hs<h-1&&k!==K.water&&!wet)c=mul(c,1.12);if(wet&&hn>h+1)c=mix(c,COL.foam,.75);else if(wet&&y>1&&lift[i-2*W]>h+1)c=mix(c,COL.foam,.4);else if(hn>h+1)c=mul(c,.78);else if(y>1&&lift[i-2*W]>h+1)c=mul(c,.9);
        // (a stone parapet along the road's edge where the ground beyond it drops wall levels or more)
        if(k===K.road&&L.RD[i]>L.HW[i]-2.2){let lo=h;for(const [a,b] of [[4,0],[-4,0],[0,4],[0,-4]]){const xx=x+a,yy=y+b;if(xx>=0&&yy>=0&&xx<W&&yy<H)lo=Math.min(lo,lift[yy*W+xx])}if(lo<=h-LAB.road.wall*lh)c=COL.stone[(x+y)%5===0?2:hsh(x,y,s+82)<.5?0:1]}
        put(x,sy,c,y);
        // the south face, down to where the next px's top starts
        const sy2=(y+1<H?y+1-hs:H-1+0)+T;if(y+1>=H){for(let r=sy+1;r<CH;r++)put(x,r,COL.face[2],y);continue}
        if(sy2>sy+1&&wet){for(let r=sy+1;r<sy2;r++){const n=hsh(x,r,s+83),q=hsh(x,0,s+84);put(x,r,r>=sy2-2?COL.foam:COL.fall[q<.35?0:q<.75?1:2],y);if(n<.02)put(x,r,COL.foam,y)}}
        else if(sy2>sy+1&&k===K.bridge){for(let r=sy+1;r<sy2;r++){const dz=r-sy;put(x,r,dz<=2?COL.beam[0]:Math.floor(L.road.I[i]*2)%14<2?COL.beam[0]:mul(COL.beam[1],.85),y)}}
        else if(sy2>sy+1&&SM[i]&&h-hs<=3){const cn=topCol(x,y+1,i+W),n2=sy2-sy;for(let r=sy+1;r<sy2;r++)put(x,r,mul(mix(c,cn,(r-sy)/n2),.93),y)}
        else if(sy2>sy+1&&SM[i]&&L.RD[i]<L.HW[i]+5){for(let r=sy+1;r<sy2;r++){const dz=r-sy,row=Math.floor(dz/3),off=(row&1)*3;put(x,r,dz%3===0||(x+off)%6===0?COL.stone[2]:COL.stone[hsh(Math.floor((x+off)/6),row,s+85)<.5?0:1],y)}}
        else if(sy2>sy+1){const drop=h-hs,rocky=G[i]>=LAB.cls.steep||drop>=2*lh||k===K.rock||k===K.snow||k===K.scree,sand=k<=K.dune;
          for(let r=sy+1;r<sy2;r++){const dz=r-sy,zh=h-dz,f=dz/Math.max(1,drop),n=hsh(x,r,s+20);let c2;
            if(sand)c2=mix(COL.sand[0],COL.wet[1],f*.8);
            else if(rocky){const RC=COL.rock;c2=mix(f<.5?RC[2]:RC[3],COL.face[2],.25);c2=mix(c2,RC[4],Math.min(.5,f*.5));if(zh%lh===0)c2=mul(c2,.62);else if((zh+1)%lh===0)c2=mul(RC[1],.95);if(n<.1)c2=mul(c2,.88);if(vn(x/3,r/6,s+21)>.7)c2=mul(c2,.9);
              if(k===K.snow&&(zh%lh===0||zh%lh===lh-1)&&n<.7)c2=COL.snow[1]}
            else{c2=dz===1?COL.lip:dz===2&&n<.5?COL.lip:mix(COL.bank[0],COL.bank[2],f);if(n<.06)c2=mul(c2,.85)}
            put(x,r,c2,y)}}}}
    // the small things on the ground (where its own px shows): tufts, flowers, pebbles; marram on the dunes; driftwood and shells on
    // the beach; snow's sparkle
    const vis=(x,y)=>{const sy=y-lift[y*W+x]+T;return sy>=2&&dep[sy*W+x]===y?sy:-1};
    for(let y=2;y<H;y++)for(let x=1;x<W-1;x++){const i=y*W+x,k=KD[i],r=hsh(x,y,s+30);if(r>.06)continue;const sy=vis(x,y);if(sy<0)continue;
      if(k===K.grass||k===K.meadow){if(r<.03){const c=COL.tuft[r<.012?0:1];put(x,sy-1,c,y);if(r<.015)put(x,sy-2,COL.tuft[0],y)}else if(k===K.meadow&&r<.05)put(x,sy-1,COL.flower[Math.floor(hsh(x,y,s+31)*4)],y)}
      else if(k===K.dune&&r<.05){const h=2+Math.floor(hsh(x,y,s+32)*3);for(let j=1;j<=h;j++)put(x+(j>2&&r<.025?1:0),sy-j,COL.marram[j&1],y)}
      else if(k===K.sand&&r<.004){for(let j=-2;j<=2;j++)if(dep[sy*W+x+j]===y)put(x+j,sy,COL.drift,y)}
      else if(k===K.sand&&r<.012)put(x,sy,COL.shell,y)
      else if(k===K.wood&&r<.03)put(x,sy-1,r<.01?[110,76,48]:COL.tuft[2],y)
      else if((k===K.scree||k===K.rock)&&r<.03)put(x,sy,COL.scree[1],y)
      else if(k===K.bank&&r<.05){const h=3+Math.floor(hsh(x,y,s+86)*3);for(let j=1;j<=h;j++)put(x,sy-j,j===h&&r<.02?COL.reed[2]:COL.reed[j&1],y)}}
    g.putImageData(img,0,0);
    // the shore's px (the foam rides them): water beside land, on the screen
    const shore=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(KD[i]!==K.water)continue;if(KD[i-1]||KD[i+1]||KD[i-W]||KD[i+W])shore.push(x,y+T,hsh(x,y,s+40)*6.283)}
    // the river's moving water: each surface px seen (x, screen y, px along, a phase) and each fall's px (flagged by a negative)
    const flow=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x,k=KD[i];if(k!==K.river&&k!==K.ford)continue;if(L.river.RW[i]>50)continue;const sy=vis(x,y);if(sy<0)continue;
      flow.push(x,sy,L.river.RT[i],hsh(x,y,s+87));const hs=lift[i+W],sy2=y+1-hs+T;for(let r=sy+1;r<sy2-2;r++)if(dep[r*W+x]===y)flow.push(x,r,-1,hsh(x,0,s+88)*20)}
    // the walk map: each px's class as a tint
    const wm=document.createElement('canvas');wm.width=W;wm.height=CH;{const wg=wm.getContext('2d'),wi=wg.createImageData(W,CH),WD=wi.data;
      for(let y=0;y<CH;y++)for(let x=0;x<W;x++){const wy=dep[y*W+x];if(wy<0)continue;const i=wy*W+x,c=classAt(L,i),b=bandAt(L,i),o=(y*W+x)*4,col=b?[0,[120,230,240],[90,200,240],[60,140,240],[40,50,200]][b]:[[60,120,255],[60,200,80],[230,210,60],[240,130,40],[230,40,40]][c];WD[o]=col[0];WD[o+1]=col[1];WD[o+2]=col[2];WD[o+3]=110}
      wg.putImageData(wi,0,0)}
    return {cv,dep,lift,T,CH,shore,flow,wm,ms:performance.now()-t0}}

  // a px's walk class: 0 water, 1 flat, 2 slope, 3 steep, 4 cliff (the road always flat: its grade is held)
  // (water: its depth band (1 ankle, 2 knee, 3 waist, 4 swimming), 0 dry)
  function bandAt(L,i){const d=L.DP[i];if(!(d>0))return 0;const B=LAB.depth.bands;return d<B[0]?1:d<B[1]?2:d<B[2]?3:4}
  // (water: knee-deep or less walks as a slope, waist-deep as steep, deeper is 0: swimming)
  function classAt(L,i){const b=bandAt(L,i);if(b)return b<=2?2:b===3?3:0;const k=L.KD[i];if(k===K.road||k===K.bridge)return 1;const g=L.G[i],C=LAB.cls;return g>=C.cliff?4:g>=C.steep?3:g>=C.slope?2:1}
  // how fast a man goes at px i heading (dx, dy) (a unit vector), times the walk; 0 he cannot. climber: a cliff is slow, not shut
  // (heavy: in heavy armour, so he cannot swim; nor can a man with no stamina left)
  function speedAt(L,i,dx,dy,climber,sta,heavy){const S=LAB.speed,k=L.KD[i],b=bandAt(L,i);if(b)return b===4&&(heavy||sta<=0)?0:LAB.depth.speed[b];const c=classAt(L,i);if(k===K.bridge)return S.road;
    let m=k===K.road?S.road:k===K.sand||k===K.wet?S.sand:k===K.dune?S.dune:k===K.snow?S.snow:k===K.wood?S.wood:S.flat;
    const up=(dx*L.GX[i]+dy*L.GY[i])>0;
    if(c===2)m*=up?S.up:S.down;else if(c===3)m*=S.steep;else if(c===4){if(!climber||sta<=0)return 0;m*=S.cliff}
    return m}

  // the props: trees in the woods (and a few in the open), boulders on the scree, the village's houses on its shelf (models drawn on a
  // cell twice the game's: twice the detail, the same size beside a man), its people; each {x, y (its foot), img, ax, ay}
  function makeProps(L){const W=LAB.W,H=LAB.H,s=LAB.seed,P=[],st=LAB.woods.step,S=LAB.shelf;
    for(let gy=st;gy<H;gy+=st)for(let gx=st;gx<W;gx+=st){const x=Math.round(gx+(hsh(gx,gy,s+50)-.5)*st*.9),y=Math.round(gy+(hsh(gx,gy,s+51)-.5)*st*.9);if(x<2||y<2||x>=W-2||y>=H)continue;
      const i=y*W+x,k=L.KD[i],r=hsh(gx,gy,s+52);
      const Wd=LAB.woods,wn=k===K.wood||k===K.grass||k===K.meadow?fbm(x/Wd.sc,y/Wd.sc,s+41,3):0,edge=k===K.wood?smooth((wn-Wd.at)/Wd.fringe):smooth((wn-(Wd.at-Wd.fringe))/Wd.fringe)*.35;
      if(k===K.wood&&r<.62*(.35+.65*edge)||(k===K.grass||k===K.meadow)&&r<.025+.6*edge&&L.road.D[i]>30&&!L.river.RV[i]&&(k===K.wood||Math.hypot((x-S.x*W)/S.rx,(y-S.y*H)/S.ry)>1.25)){const e=L.E[i],sp=e>5.5?'fir':r<.12?'birch':e>3.5&&r<.3?'fir':'oak',t=PX.battleTree('grass',sp,Math.floor(hsh(gx,gy,s+53)*4));P.push({x,y,img:t,ax:16,ay:30,kind:'tree'})}
      else if(k===K.scree&&r<.05&&L.road.D[i]>LAB.road.w/2+LAB.road.sh){const b=PX.battleObstacle('rock','grass',Math.floor(hsh(gx,gy,s+54)*6));P.push({x,y,img:b.s,ax:b.ax,ay:b.ay,kind:'rock'})}}
    const sx=S.x*W,sy=S.y*H,house=(type,dx,dy,seed,yaw)=>{try{const sp=PX.buildingModelSpec({type,culture:'vale',seed,yaw:yaw||0,env:'grass'});sp.cell*=2;const m=PX.model(sp);P.push({x:Math.round(sx+dx),y:Math.round(sy+dy),img:m.img,ax:0,ay:m.img.height,kind:'house',sh:m.shadow})}catch(e){console.warn('lab: no model',type,e)}};
    house('cottage',-150,-40,3);house('cottage',-60,-70,8,2);house('townhouse',40,-62,5);house('fisherhut',-170,58,9,6);house('well',-40,12,4);house('cart',30,24,6);house('tavern',90,40,12,4);
    // (the watermill beside the river, on its east bank)
    {const V=L.river,j=Math.round(LAB.river.mill*(V.pts.length-1)),[px,py]=V.pts[j];try{const sp=PX.buildingModelSpec({type:'watermill',culture:'vale',seed:21,yaw:6,env:'grass'});sp.cell*=2;const m=PX.model(sp);
      P.push({x:Math.round(px+V.rw[j]+4),y:Math.round(py+20),img:m.img,ax:0,ay:m.img.height,kind:'house'})}catch(e){console.warn('lab: no watermill',e)}}
    const folk=[['peasant',-20,30],['peasant',-90,20],['spearman',60,-10]];for(const [u,dx,dy] of folk){const d=PX.doll({race:'human',uniform:u,team:'blue',hair:'brown',style:'short'});P.push({x:Math.round(sx+dx),y:Math.round(sy+dy),img:d,ax:d.width>>1,ay:d.height-1,kind:'folk'})}
    return P}

  // a picture cut where the ground is nearer than its foot (wy): a ridge in front hides what stands behind it
  function occluded(img,X,Y,wy,Pn){const w=img.width,h=img.height,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(img,0,0);
    const d=g.getImageData(0,0,w,h),DD=d.data,W=LAB.W,dep=Pn.dep;let cut=false;
    for(let y=0;y<h;y++){const Y2=Y+y;if(Y2<0||Y2>=Pn.CH)continue;for(let x=0;x<w;x++){const X2=X+x;if(X2<0||X2>=W)continue;const o=(y*w+x)*4;if(DD[o+3]&&dep[Y2*W+X2]>wy+1){DD[o+3]=0;cut=true}}}
    if(cut)g.putImageData(d,0,0);return c}

  /* the lab: the canvas, the hero (click to walk there by the cells, WASD to walk), the panel's controls and numbers */
  PX.worldLab=function(root){
    const cv=document.createElement('canvas'),ctx=cv.getContext('2d');root.appendChild(cv);cv.style.touchAction='none';ctx.imageSmoothingEnabled=false;
    const panel=document.getElementById('panel'),out=document.getElementById('stats');
    let L=makeLand(),Pn=paint(L),props=makeProps(L);
    const hero={x:LAB.shelf.x*LAB.W+20,y:LAB.shelf.y*LAB.H+40,face:1,walked:0,sta:1,path:[],climber:false,heavy:false,moving:false};
    let walkmap=false,cam={x:0,y:0},keys={},fps=0,fa=0,fn=0,frameMs=0;
    // the props cut by the ground in front of them (kept until the land is painted again)
    const cut=()=>{for(const p of props){const lf=Pn.lift[p.y*LAB.W+p.x];p.X=p.x-p.ax;p.Y=p.y-lf+Pn.T-p.ay;p.pic=occluded(p.img,p.X,p.Y,p.y,Pn)}props.sort((a,b)=>a.y-b.y)};
    cut();
    if(innerWidth<LAB.phone)LAB.zoom=LAB.phoneZoom;{const z=document.getElementById('zoom');if(z)z.value=String(LAB.zoom)}
    const resize=()=>{const z=LAB.zoom;cv.width=Math.ceil(innerWidth/z);cv.height=Math.ceil(innerHeight/z);cv.style.width=cv.width*z+'px';cv.style.height=cv.height*z+'px';ctx.imageSmoothingEnabled=false};
    addEventListener('resize',resize);resize();
    // the cells' A*: a cell's cost by the class at its middle and the steepest of its corners (water and, but for a climber, cliffs shut)
    const C=LAB.W/LAB.cell,R=LAB.H/LAB.cell;
    // (each cell's class, counted once over all its px: water if a few px are (a river shuts it, but at its ford), a cliff if a few
    //  px are (a thin band still shuts it),
    //  else the steepest class enough of it has)
    let CC=null;const cells=()=>{CC=new Uint8Array(C*R);const cs=LAB.cell;for(let cy=0;cy<R;cy++)for(let cx=0;cx<C;cx++){const n=[0,0,0,0,0];
      let ford=0;for(let y=0;y<cs;y++)for(let x=0;x<cs;x++){const i=(cy*cs+y)*LAB.W+cx*cs+x;n[classAt(L,i)]++;if(L.KD[i]===K.ford)ford++}CC[cy*C+cx]=n[0]>=4&&ford<4?0:n[4]>=4?4:n[3]>=16?3:n[2]>=32?2:1}};
    function cellCost(cx,cy){const c=CC[cy*C+cx];if(c===0)return hero.heavy?Infinity:LAB.depth.swimCost;if(c===4&&!hero.climber)return Infinity;return [0,1,1.8,3.5,7][c]}
    cells();
    function route(tx,ty){const s0=Math.floor(hero.y/LAB.cell)*C+Math.floor(hero.x/LAB.cell),g0=Math.floor(ty/LAB.cell)*C+Math.floor(tx/LAB.cell),N=C*R,gs=new Float32Array(N).fill(Infinity),from=new Int32Array(N).fill(-1),open=[s0];gs[s0]=0;
      const hh=i=>Math.hypot(i%C-g0%C,((i/C)|0)-((g0/C)|0)),done=new Uint8Array(N);let it=0;
      while(open.length&&it++<40000){let bi=0;for(let k=1;k<open.length;k++)if(gs[open[k]]+hh(open[k])<gs[open[bi]]+hh(open[bi]))bi=k;const cur=open[bi];open.splice(bi,1);if(cur===g0)break;if(done[cur])continue;done[cur]=1;
        const cx=cur%C,cy=(cur/C)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=C||ny>=R)continue;const n=ny*C+nx,c=cellCost(nx,ny);if(c===Infinity)continue;
          const ng=gs[cur]+c*(dx&&dy?1.414:1);if(ng<gs[n]){gs[n]=ng;from[n]=cur;open.push(n)}}}
      if(from[g0]<0&&g0!==s0)return null;const p=[[tx,ty]];for(let k=from[g0];k>=0&&k!==s0;k=from[k])p.unshift([(k%C+.5)*LAB.cell,(((k/C)|0)+.5)*LAB.cell]);return p}
    // a click: the ground under it (the depth buffer), walked to
    cv.addEventListener('pointerdown',ev=>{const r=cv.getBoundingClientRect(),X=Math.floor((ev.clientX-r.left)/LAB.zoom+cam.x),Y=Math.floor((ev.clientY-r.top)/LAB.zoom+cam.y);if(X<0||Y<0||X>=LAB.W||Y>=Pn.CH)return;
      const wy=Pn.dep[Y*LAB.W+X];if(wy<0)return;const p=route(X,wy);hero.path=p||[];if(!p)note='No way there'+(hero.climber?'':' (cliffs: try Climber)')});
    addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true});addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
    let note='';
    // the panel's controls
    const lh=document.getElementById('lh'),lhv=document.getElementById('lhv');lh.min=LAB.lhMin;lh.max=LAB.lhMax;lh.value=LAB.lh;lhv.textContent=LAB.lh;
    lh.addEventListener('change',()=>{LAB.lh=+lh.value;lhv.textContent=LAB.lh;Pn=paint(L);cut()});lh.addEventListener('input',()=>{lhv.textContent=lh.value});
    document.getElementById('climb').addEventListener('change',e=>{hero.climber=e.target.checked});
    {const hv=document.getElementById('heavy');if(hv)hv.addEventListener('change',e=>{hero.heavy=e.target.checked})}
    document.getElementById('walkmap').addEventListener('change',e=>{walkmap=e.target.checked});
    document.getElementById('zoom').addEventListener('change',e=>{LAB.zoom=+e.target.value;resize()});
    // a step of the hero: by the keys, else along his path; his speed by the ground where he steps; stamina spent climbing
    function step(dt){let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
      if(dx||dy)hero.path=[];else if(hero.path.length){const [tx,ty]=hero.path[0];dx=tx-hero.x;dy=ty-hero.y;if(Math.hypot(dx,dy)<2){hero.path.shift();return step(dt)}}
      const l=Math.hypot(dx,dy);hero.moving=false;const i0=Math.round(hero.y)*LAB.W+Math.round(hero.x),c0=classAt(L,i0);
      if(!l){hero.sta=Math.min(1,hero.sta+LAB.sta.rest*dt);return}dx/=l;dy/=l;
      // (blocked straight on, he tries a little to either side, as a man steps round a rock)
      const run=keys.shift?LAB.run:1;let m=0,nx=0,ny=0,i1=0,d=0;
      for(const a of [0,.5,-.5,1,-1]){const ca=Math.cos(a),sa=Math.sin(a),ex=dx*ca-dy*sa,ey=dx*sa+dy*ca,mm=speedAt(L,i0,ex,ey,hero.climber,hero.sta,hero.heavy),dd=Math.min(l,LAB.walk*run*Math.max(mm,.0001)*dt),px=hero.x+ex*dd,py=hero.y+ey*dd;
        if(px<1||py<1||px>=LAB.W-1||py>=LAB.H-1)continue;const j=Math.round(py)*LAB.W+Math.round(px);if(mm&&speedAt(L,j,ex,ey,hero.climber,hero.sta,hero.heavy)){m=mm;nx=px;ny=py;i1=j;d=dd;if(a){dx=ex;dy=ey}break}if(!a){i1=j}}
      if(!m){hero.path=[];note=bandAt(L,i1)===4?'Deep water: '+(hero.heavy?'too heavy in armour to swim':'too tired to swim'):classAt(L,i1)===4?'A cliff'+(hero.climber?(hero.sta<=0?': too tired to climb':''):': only a climber goes up here'):classAt(L,i1)===0?'Water':'';return}
      hero.x=nx;hero.y=ny;hero.walked+=d;hero.moving=true;if(Math.abs(dx)>.2)hero.face=dx<0?-1:1;note='';
      const up=(dx*L.GX[i1]+dy*L.GY[i1])>0,c=classAt(L,i1),b=bandAt(L,i1),S=LAB.sta;hero.sta=Math.max(0,Math.min(1,hero.sta-(b===4?S.swim:b===3?S.wade:b?-S.rest*.3:c===4?S.cliff:c===3&&up?S.steep:c===2&&up?S.slope:-S.rest*.5)*dt))}
    // a frame: the land, the props and the hero in order of their feet, each cut by the ground in front of it, the foam, the walk map
    let last=performance.now();
    function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;const f0=performance.now();step(dt);
      const W=LAB.W,hl=Pn.lift[Math.round(hero.y)*W+Math.round(hero.x)],hx=hero.x,hy=hero.y-hl+Pn.T;
      cam.x=Math.round(Math.max(0,Math.min(W-cv.width,hx-cv.width/2)));cam.y=Math.round(Math.max(0,Math.min(Pn.CH-cv.height,hy-cv.height/2-10)));
      ctx.fillStyle='#1a2030';ctx.fillRect(0,0,cv.width,cv.height);ctx.drawImage(Pn.cv,cam.x,cam.y,cv.width,cv.height,0,0,cv.width,cv.height);
      // (the foam: the shore's px that are cresting now)
      {const S=Pn.shore,t=now/1000;ctx.fillStyle='rgba(236,244,246,.85)';for(let k=0;k<S.length;k+=3){const x=S[k]-cam.x,y=S[k+1]-cam.y;if(x<0||y<0||x>=cv.width||y>=cv.height)continue;if(Math.sin(t*1.6+S[k+2]+S[k]*.02)>.55)ctx.fillRect(x,y,1,1)}}
      {const F=Pn.flow,t=now/1000;for(let k=0;k<F.length;k+=4){const x=F[k]-cam.x,y=F[k+1]-cam.y;if(x<0||y<0||x>=cv.width||y>=cv.height)continue;
        if(F[k+2]<0){if(((F[k+1]*.5-t*24+F[k+3])%5+5)%5<1){ctx.fillStyle='rgba(250,252,255,.8)';ctx.fillRect(x,y,1,1)}}
        else if(((F[k+2]*.35-t*6+F[k+3]*14)%9+9)%9<.6){ctx.fillStyle='rgba(225,240,245,.55)';ctx.fillRect(x,y,1,1)}}}
      if(walkmap)ctx.drawImage(Pn.wm,cam.x,cam.y,cv.width,cv.height,0,0,cv.width,cv.height);
      // the hero's picture, cut by the ground before him
      const fr=hero.moving?Math.floor(hero.walked/5)%4:0,dl=PX.doll({race:'human',uniform:'swordsman',team:'blue',hair:'brown',style:'short',pose:hero.moving?'walk':undefined,frame:fr}),
        HX=Math.round(hx)-(dl.width>>1),HY=Math.round(hy)-dl.height+1,hp=occluded(dl,HX,HY,Math.round(hero.y),Pn);
      const ents=[];for(const p of props){if(p.X+p.pic.width<cam.x||p.X>cam.x+cv.width||p.Y+p.pic.height<cam.y||p.Y>cam.y+cv.height)continue;ents.push(p)}
      ents.push({y:hero.y,hero:true});ents.sort((a,b)=>a.y-b.y);
      const hb=bandAt(L,Math.round(hero.y)*W+Math.round(hero.x)),cut=LAB.depth.cut[hb];
      for(const p of ents){if(p.hero){if(!hb){ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(Math.round(hx)-cam.x-4,Math.round(hy)-cam.y,9,2)}
          ctx.save();ctx.translate(Math.round(hx)-cam.x,0);if(hero.face<0)ctx.scale(-1,1);const sh=hp.height-cut;if(sh>0)ctx.drawImage(hp,0,0,hp.width,sh,HX-Math.round(hx),HY-cam.y,hp.width,sh);ctx.restore();
          if(hb){const wy=HY-cam.y+sh,ph=Math.floor(now/180);ctx.fillStyle='rgba(232,246,250,.75)';for(let k=-6;k<=6;k++)if((k+ph)%3)ctx.fillRect(Math.round(hx)-cam.x+k,wy-(Math.abs(k)>4?0:0),1,1);
            if(hb>=3){ctx.fillStyle='rgba(232,246,250,.4)';for(let k=-8;k<=8;k+=2)if((k+ph)%4)ctx.fillRect(Math.round(hx)-cam.x+k,wy+1,1,1)}}continue}
        if(p.kind==='tree'){ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(p.x-cam.x-6,p.Y+p.ay-cam.y-1,13,3)}ctx.drawImage(p.pic,p.X-cam.x,p.Y-cam.y)}
      // (his path ahead, a dot at each turn)
      ctx.fillStyle='rgba(255,230,140,.8)';for(const [x,y] of hero.path){const l2=Pn.lift[Math.min(LAB.H-1,Math.round(y))*W+Math.min(W-1,Math.round(x))];ctx.fillRect(Math.round(x)-cam.x-1,Math.round(y)-l2+Pn.T-cam.y-1,2,2)}
      frameMs=frameMs*.9+(performance.now()-f0)*.1;fn++;fa+=dt;if(fa>=.5){fps=Math.round(fn/fa);fn=0;fa=0}
      const i=Math.round(hero.y)*W+Math.round(hero.x),c=classAt(L,i),e=L.E[i],chunk=Pn.ms*512*512/(W*LAB.H);
      out.innerHTML=`<b>${fps}</b> fps · frame ${frameMs.toFixed(1)} ms<br>land ${L.ms.toFixed(0)} ms · paint ${Pn.ms.toFixed(0)} ms (≈${chunk.toFixed(1)} ms a 512 px chunk)<br>`+
        `here: level ${Math.max(0,Math.floor(e))} · ${KNAME[L.KD[i]]} · ${hb?['','ankle-deep','knee-deep','waist-deep','swimming'][hb]+' ('+(L.DP[i]*.85).toFixed(1)+' m)':['water','flat','slope','steep','cliff'][c]} · ×${(speedAt(L,i,1,0,hero.climber,hero.sta,hero.heavy)||0).toFixed(2)} east<br>`+
        `stamina <span class="bar"><i style="width:${Math.round(hero.sta*100)}%"></i></span>${note?'<br><em>'+note+'</em>':''}`;
      requestAnimationFrame(frame)}
    requestAnimationFrame(frame);
    PX.worldLab.state={LAB,get L(){return L},get Pn(){return Pn},hero,props,classAt:i=>classAt(L,i),route};
  };
  PX.WORLD_LAB=LAB;
})(window.PX);
