'use strict';
/* ---------- depth on the world map: what stands in front of a figure, drawn again over it (doc/WORLD_DESIGN.md §12.5) ---------- */
// The trees, woods, small things and ranges are painted into the map's chunks (worldart.js), and the buildings, moored boats and
// sites are drawn before anyone (render.js drawWorld keeps that scene, memCv, for the fog), so a figure drawn after them would
// stand over all of it. Each figure (a party, a caravan, a beast, a herd, a worker, a ship, a fight), once drawn, has what stands
// in front of it put back over it (worldOverdraw): the kept scene's own pixels, through a mask of the pixels of whatever stands
// lower on the screen than its feet, within the box it drew in (tracked as it draws). What stands: the chunks' standing index
// (WorldArt.standing: each tree, the small things standing, the ranges' rock in column runs, by its foot) and the pictures of the
// structures as they were drawn this frame (depthPic: a building's body, not its shadow, each pixel by the foot of its column's
// run of pixels, so a cluster's back house stands behind one in its gap, its front house before him). Over every figure drawn (all
// in your sight: what the fog hides is not drawn) whatever covers it fades to WDEPTH.fade (owner, 2026-10-19: a bear deep in a wood
// was lost under the crowns; yours and everyone's the same) at PROPFADE.rate a second (real time), as in battle. A flying beast (top) is drawn after them all, over
// everything. Banners and labels come later, the fog after the figures (it puts the kept scene back outside your sight: nothing
// hidden shows). WDEPTH.on false: figures drawn as before, over everything (the tests compare); boxes: this frame's figures'
// boxes [x0, y0, x1, y1 (the kept scene's pixels: the screen's game pixels on the camera's whole pixels), feet y, own]. The
// screen may be at a finer scale than the game's pixels (core.js VS): the box a figure drew in is taken back to the scene's game
// pixels, its mask made there, and laid over him scaled up as the scene was.
// dash (the owner, 2026-11-12: "when unit is under something can we use highlight with dash to indicate that"): a figure under a tree or a
// building (one asking it: e.hl, its colour's key) has its outline drawn in dashes over what covers it, where it covers it; col by side.
// Its line w world px thick and its dashes len long (on and off), times the camera's scale, so it grows and shrinks with the zoom
// (the owner: "make the dash smaller and scale based on camera"); at least a screen pixel; a its strength
const WDEPTH={on:true,fade:.3,dash:{on:true,w:.5,len:3,a:.75,col:{own:'#ffd870',ally:'#8ac8ff',foe:'#ff6a5a'}},rec:null,sc:null,mk:null,trk:false,di:null,fr:null,pics:[],al:new Map(),cov:new Set(),t:0,cv:null,img:null,C:[],box:[0,0,0,0],boxes:[]};
// a structure's picture as drawn this frame at (x, y) on the screen (before the shake): its opaque pixels stand by their feet
function depthPic(img,x,y){if(img&&WDEPTH.on)WDEPTH.pics.push([img,Math.round(x),Math.round(y)])}
// (a picture's feet: for each opaque pixel the row its column's run of opaque pixels ends on, -1 where it is clear; kept on it)
function picFeet(img){if(img._df)return img._df;const w=img.width,h=img.height,d=img.getContext('2d', { willReadFrequently: true }).getImageData(0,0,w,h).data,F=new Int16Array(w*h).fill(-1);let top=h,mx=-1;
  for(let x=0;x<w;x++)for(let y=0;y<h;y++){if(d[(y*w+x)*4+3]<250)continue;let y1=y;while(y1+1<h&&d[((y1+1)*w+x)*4+3]>=250)y1++;for(let k=y;k<=y1;k++)F[k*w+x]=y1;if(y<top)top=y;if(y1>mx)mx=y1;y=y1}
  return img._df={w,h,F,top,foot:mx}}
// (the box a figure draws in, on the canvas's own pixels: every picture's drawn pixels and rect while it is drawn; the context's
// own drawImage and fillRect wrapped over the pass, whatever they are, and put back after it)
function dbAdd(x,y,w,h){if(!WDEPTH.trk)return;const m=ctx.getTransform(),a=m.a*x+m.c*y+m.e,b=m.b*x+m.d*y+m.f,c=m.a*(x+w)+m.c*(y+h)+m.e,d=m.b*(x+w)+m.d*(y+h)+m.f,B=WDEPTH.box;
  B[0]=Math.min(B[0],a,c);B[1]=Math.min(B[1],b,d);B[2]=Math.max(B[2],a,c);B[3]=Math.max(B[3],b,d)}
function dbImage(s,a1,a2,a3,a4,a5,a6,a7,a8){const n=arguments.length;if(WDEPTH.trk&&WDEPTH.rec&&s&&s.getContext)dashNote(this,s,arguments);
  if(n>=9)dbAdd(a5,a6,a7,a8);else if(n>=5)dbAdd(a1,a2,a3,a4);else{const o=s.getContext&&s.width<=96&&s.height<=96?opaqueBox(s):null;if(o)dbAdd(a1+o[0],a2+o[1],o[2]-o[0]+1,o[3]-o[1]+1);else dbAdd(a1,a2,s.width,s.height)}
  return WDEPTH.di.apply(this,arguments)}
function dbRect(x,y,w,h){dbAdd(x,y,w,h);return WDEPTH.fr.call(this,x,y,w,h)}
// what stands in front of a figure whose feet are at map y fy, over the scene's box x0..x1, y0..y1 (its corner at (ox, oy) on the
// map): its scene's pixels put back over it (the context's transform: the scene's onto the screen), each thing's at its fade;
// own: what covers it is marked to fade; nf: nothing is (ambient life: gfx/ambient.js, a hare in a wood fades no crown)
function overdrawBox(x0,y0,x1,y1,ox,oy,fy,own,cam,nf){
  const w=x1-x0+1,h=y1-y0+1,wx0=x0+ox,wy0=y0+oy,wx1=x1+ox,wy1=y1+oy,C=WDEPTH.C,AL=WDEPTH.al;C.length=0;
  WorldArt.standing(wx0,wy0,wx1,wy1,(S,k)=>{const f=S.Y+S.E[k*4+3];if(f>fy)C.push([f,S,k])});
  for(const p of WDEPTH.pics){const D=picFeet(p[0]),px=p[1]+cam.x,py=p[2]+cam.y;if(py+D.foot>fy&&px<=wx1&&px+D.w>wx0&&py+D.top<=wy1&&py+D.h>wy0)C.push([py+D.foot,null,p])}
  if(!C.length)return;C.sort((a,b)=>a[0]-b[0]);
  if(!WDEPTH.img||WDEPTH.img.width<w||WDEPTH.img.height<h){const W=Math.max(w,WDEPTH.img?WDEPTH.img.width:0,64),H=Math.max(h,WDEPTH.img?WDEPTH.img.height:0,64);WDEPTH.img=new ImageData(W,H);WDEPTH.cv=mkc(W,H,()=>{})}
  const I=WDEPTH.img,M=I.data,st=I.width;for(let y=0;y<h;y++)M.fill(0,y*st*4,(y*st+w)*4);let any=0;
  for(const [,S,k] of C){let key,n=0;
    if(S){const E=S.E,o=k*4,dx=S.X+E[o],dy=S.Y+E[o+1],r=E[o+2];key=(S.Y*MW*TILE+S.X)*65536+k;const A=Math.round((AL.has(key)?AL.get(key):1)*255);
      const cx0=Math.max(wx0,S.X),cy0=Math.max(wy0,S.Y),cx1=Math.min(wx1,S.X+S.w-1),cy1=Math.min(wy1,S.Y+S.h-1);
      if(r<0){if(dx<cx0||dx>cx1)continue;for(let y=Math.max(cy0,dy);y<=Math.min(cy1,dy-r-1);y++){M[((y-wy0)*st+dx-wx0)*4+3]=A;n++}}
      else{const s=PX.WN_SPR[r],N=s.width,a=s.a,b=s.box;for(let y=Math.max(cy0,dy+b[1]);y<=Math.min(cy1,dy+b[3]);y++){const ro=(y-dy)*N-dx,mo=(y-wy0)*st-wx0;
        for(let x=Math.max(cx0,dx+b[0]);x<=Math.min(cx1,dx+b[2]);x++)if(a[ro+x]){M[(mo+x)*4+3]=A;n++}}}}
    else{const [img,px,py]=k,D=picFeet(img),F=D.F,X=px+cam.x,Y=py+cam.y;key=img;const A=Math.round((AL.has(key)?AL.get(key):1)*255);
      for(let y=Math.max(wy0,Y+D.top);y<=Math.min(wy1,Y+D.h-1);y++){const ro=(y-Y)*D.w-X,mo=(y-wy0)*st-wx0;for(let x=Math.max(wx0,X);x<=Math.min(wx1,X+D.w-1);x++){const f=F[ro+x];if(f>=0&&Y+f>fy){M[(mo+x)*4+3]=A;n++}}}}
    if(n){any=1;if(!nf)WDEPTH.cov.add(key)}}
  if(!any)return false;
  const cv=WDEPTH.cv,g=cv.getContext('2d', { willReadFrequently: true });g.putImageData(I,0,0,0,0,w,h);g.globalCompositeOperation='source-in';g.drawImage(memCv(),x0,y0,w,h,0,0,w,h);g.globalCompositeOperation='source-over';
  ctx.drawImage(cv,0,0,w,h,x0,y0,w,h);return true}
// the figures, by their feet (render.js drawWorld's ents that move: {y, f, own, top}), each with what stands in front of it put
// back over it; those in flight after them all; each at its own place to the screen's pixel (render.js drawMover). The context's
// transform: the kept scene's game pixels onto the screen. The fades step first, toward what covered your own last frame
function worldOverdraw(list,cam){
  const now=performance.now(),st=WDEPTH.t?Math.min(.1,Math.max(0,now-WDEPTH.t)/1000)*PROPFADE.rate:1,AL=WDEPTH.al,cov=WDEPTH.cov;WDEPTH.t=now;
  for(const k of cov)if(!AL.has(k))AL.set(k,1);
  for(const [k,a] of AL){const to=cov.has(k)?WDEPTH.fade:1,v=a<to?Math.min(to,a+st):Math.max(to,a-st);if(v>=1&&to>=1)AL.delete(k);else AL.set(k,v)}
  cov.clear();WDEPTH.boxes.length=0;const top=[],m=ctx.getTransform(),k=m.a||1,mem=memCv(),cw=mem.width,ch=mem.height,B=WDEPTH.box;
  const own=k=>Object.prototype.hasOwnProperty.call(ctx,k),di=own('drawImage'),fr=own('fillRect');WDEPTH.di=ctx.drawImage;WDEPTH.fr=ctx.fillRect;if(WDEPTH.on){ctx.drawImage=dbImage;ctx.fillRect=dbRect}
  const D=WDEPTH.dash;
  try{for(const e of list){if(e.top){top.push(e);continue}if(!WDEPTH.on){drawMover(e);continue}
    // (its dash asked: the biggest picture it draws noted, its body, for its outline)
    const dash=D.on&&!!e.hl;WDEPTH.rec=dash?{a:0}:null;
    B[0]=B[1]=1e9;B[2]=B[3]=-1e9;WDEPTH.trk=true;drawMover(e);WDEPTH.trk=false;const rec=WDEPTH.rec;WDEPTH.rec=null;
    const x0=Math.max(0,Math.floor((B[0]-m.e)/k)),y0=Math.max(0,Math.floor((B[1]-m.f)/k)),x1=Math.min(cw,Math.ceil((B[2]-m.e)/k))-1,y1=Math.min(ch,Math.ceil((B[3]-m.f)/k))-1;
    if(x1>=x0&&y1>=y0){WDEPTH.boxes.push([x0,y0,x1,y1,e.y,!!e.own]);const cov=overdrawBox(x0,y0,x1,y1,cam.x,cam.y,e.y,!!e.own,cam,!!e.nf);
      if(dash&&cov&&rec&&rec.s)dashDraw(rec,m,x0,y0,x1,y1,D.col[e.hl]||D.col.own)}}}
  finally{WDEPTH.trk=false;if(di)ctx.drawImage=WDEPTH.di;else delete ctx.drawImage;if(fr)ctx.fillRect=WDEPTH.fr;else delete ctx.fillRect}
  for(const e of top)drawMover(e);WDEPTH.pics.length=0}
// (the picture drawn while a figure is tracked: the biggest on the screen is its body, kept with the transform and the arguments it had)
function dashNote(g,s,A){const T=g.getTransform(),n=A.length,w=n>=9?A[7]:n>=5?A[3]:s.width,h=n>=9?A[8]:n>=5?A[4]:s.height,a=Math.abs(w*h*(T.a*T.d-T.b*T.c));
  const R=WDEPTH.rec;if(a>R.a){R.a=a;R.s=s;R.T=T;R.A=Array.prototype.slice.call(A,1)}}
// (the dashes: a canvas of diagonal stripes p screen px apart, half of them on; kept by p, with its pattern. The ways a silhouette is
// laid round itself: four at a pixel out, eight farther)
const DASH_OUT4=[[1,0],[-1,0],[0,1],[0,-1]],DASH_OUT8=[...DASH_OUT4,[1,1],[1,-1],[-1,1],[-1,-1]];
const DASH_STRIPES=new Map();
function dashStripes(p){let c=DASH_STRIPES.get(p);if(c)return c;c=mkc(p,p,g=>{const I=g.createImageData(p,p),o=I.data;for(let y=0;y<p;y++)for(let x=0;x<p;x++)if((x+y)%p<p/2)o[(y*p+x)*4+3]=255;g.putImageData(I,0,0)});DASH_STRIPES.set(p,c);return c}
// (its outline in dashes where something covers it, at the screen's pixels: the cover (overdrawBox's picture of it, WDEPTH.cv) laid on
// a scratch canvas, its fades made whole by laying it on itself to DASH_FILL times, its ring (dashRing) kept only there, laid where
// its body was drawn, then laid on the screen; no pixel read back nor sent up. Built each frame from its body before (12 draws, a mask sent up from the
// cover's bytes): a battle by a wood lost half its frame to it, the owner 2026-11-13: "Battle lag very much is it because of outline
// when near tree?")
const DASH_FILL=4;
function dashDraw(rec,m,x0,y0,x1,y1,col){const D=WDEPTH.dash,k=m.a||1,w=x1-x0+1,h=y1-y0+1,W=Math.ceil(w*k),H=Math.ceil(h*k),R=dashRing(rec,k,col);if(!R)return;
  let S=WDEPTH.sc;if(!S||S.c.width<W||S.c.height<H){const c=mkc(Math.max(W,128),Math.max(H,128),()=>{});S=WDEPTH.sc={c,g:c.getContext('2d')}}
  const g=S.g,ox=x0*k+m.e,oy=y0*k+m.f;g.setTransform(1,0,0,1,0,0);g.imageSmoothingEnabled=false;g.globalCompositeOperation='copy';g.drawImage(WDEPTH.cv,0,0,w,h,0,0,W,H);
  g.globalCompositeOperation='lighter';for(let i=1;i<DASH_FILL;i*=2)g.drawImage(S.c,0,0,W,H,0,0,W,H);
  g.globalCompositeOperation='source-in';g.drawImage(R.c,Math.round(rec.T.e+R.ox-ox),Math.round(rec.T.f+R.oy-oy));g.globalCompositeOperation='source-over';
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha*=D.a;WDEPTH.di.call(ctx,S.c,0,0,W,H,ox,oy,W,H);ctx.restore()}
// (a body's dashed ring, once for each of its pictures at its turn and scale and in each colour: its body laid round itself t px out,
// itself cut away, cut to the stripes (fixed to it, so they hold as it walks), coloured; ox, oy: its corner from the body's origin)
const DASH_RINGS=new WeakMap();
function dashRing(rec,k,col){const D=WDEPTH.dash,T=rec.T,A=rec.A,t=Math.max(1,Math.round(D.w*k)),p=Math.max(2,Math.round(2*D.len*k)),key=[T.a,T.b,T.c,T.d,...A,col,t,p].join();
  let M=DASH_RINGS.get(rec.s);if(!M)DASH_RINGS.set(rec.s,M=new Map());let R=M.get(key);if(R)return R;
  const n=A.length,[dx,dy,dw,dh]=n>=8?[A[4],A[5],A[6],A[7]]:n>=4?A:[A[0],A[1],rec.s.width,rec.s.height];
  const cs=[[dx,dy],[dx+dw,dy],[dx,dy+dh],[dx+dw,dy+dh]].map(([x,y])=>[T.a*x+T.c*y,T.b*x+T.d*y]),pad=t+1;
  const bx0=Math.floor(Math.min(...cs.map(c=>c[0])))-pad,by0=Math.floor(Math.min(...cs.map(c=>c[1])))-pad,bx1=Math.ceil(Math.max(...cs.map(c=>c[0])))+pad,by1=Math.ceil(Math.max(...cs.map(c=>c[1])))+pad;
  const W=bx1-bx0,H=by1-by0;if(W<=0||H<=0||W*H>1e6)return null;
  const c=mkc(W,H,g=>{g.imageSmoothingEnabled=false;const at=(ax,ay)=>{g.setTransform(T.a,T.b,T.c,T.d,ax-bx0,ay-by0);g.drawImage(rec.s,...A)};
    for(let r=1;r<=t;r++)for(const [ax,ay] of r>1?DASH_OUT8:DASH_OUT4)at(ax*r,ay*r);
    g.globalCompositeOperation='destination-out';at(0,0);g.setTransform(1,0,0,1,0,0);
    g.globalCompositeOperation='destination-in';g.fillStyle=g.createPattern(dashStripes(p),'repeat');g.fillRect(0,0,W,H);
    g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,W,H);g.globalCompositeOperation='source-over'});
  R={c,ox:bx0,oy:by0};if(M.size>64)M.clear();M.set(key,R);return R}
// a world goes in: no fades carried over
onWorld(()=>{WDEPTH.al.clear();WDEPTH.cov.clear();WDEPTH.t=0});
