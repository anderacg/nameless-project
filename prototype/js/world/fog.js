'use strict';
/* ---------- fog of war: the land you have explored, and what you can see now ---------- */
// W.seen: a byte a tile, 1 once you have seen it. Within your sight (vis()) you see everything as it is. Land you have seen
// but are not looking at now is remembered: its ground, and the holdings, camps and sites on it as you last saw them, dimmed,
// with nothing that moves on it. Land you have never seen is dark. render.js draws it; the save keeps W.seen.
function seenArr(){if(!(W.seen instanceof Uint8Array)||W.seen.length!==MW*MH)W.seen=new Uint8Array(MW*MH);return W.seen}
const seenTile=(tx,ty)=>tx>=0&&ty>=0&&tx<MW&&ty<MH&&seenArr()[ty*MW+tx]===1;
const seenAt=(x,y)=>seenTile(Math.floor(x/TILE),Math.floor(y/TILE));
// in your sight now
const inSight=(x,y)=>Math.hypot(x-P.x,y-P.y)<vis();
let fogDirty=true,lastReveal='';
// what you see now becomes known (each tile whose middle lies within your sight)
function reveal(){
  const S=seenArr(),V=vis(),tx=Math.floor(P.x/TILE),ty=Math.floor(P.y/TILE),key=tx+','+ty+','+Math.round(V);if(key===lastReveal)return;lastReveal=key;
  const r=Math.ceil(V/TILE)+1;
  for(let y=ty-r;y<=ty+r;y++)for(let x=tx-r;x<=tx+r;x++){if(x<0||y<0||x>=MW||y>=MH||S[y*MW+x])continue;if(Math.hypot((x+.5)*TILE-P.x,(y+.5)*TILE-P.y)<V){S[y*MW+x]=1;fogDirty=true}}
}
// a fresh map (a new game): nothing known yet
function fogReset(){W.seen=new Uint8Array(MW*MH);fogDirty=true;lastReveal=''}
// in the save (doc/WORLD_DESIGN.md §9.3): run lengths from the first tile, row by row, unknown and known in turn (the first run
// unknown, maybe 0 long), each 7 bits a byte (the top bit: more follows), as base64. A save that does not add up: nothing known
function seenSave(){const S=seenArr(),b=[],put=n=>{for(;n>127;n>>>=7)b.push(n&127|128);b.push(n)};let v=0,n=0;
  for(let i=0;i<S.length;i++){if((S[i]?1:0)!==v){put(n);v^=1;n=0}n++}put(n);
  let s='';for(let i=0;i<b.length;i+=4096)s+=String.fromCharCode.apply(null,b.slice(i,i+4096));return btoa(s)}
function seenLoad(str){fogReset();if(!str)return;try{const s=atob(str),S=W.seen;let i=0,v=0;
  for(let p=0;p<s.length;v^=1){let n=0,k=0,c;do{c=s.charCodeAt(p++);n|=(c&127)<<k;k+=7}while(c&128&&k<28);if(i+n>S.length)throw 0;if(v)S.fill(1,i,i+n);i+=n}
  if(i!==S.length)throw 0}catch(e){fogReset()}}
// (what you have seen, in the world part of a save: the save registry, core/saves.js)
Saves.add({key:'seen',order:40,save:seenSave,load:seenLoad});

/* drawing: the battle fog's, over the ground and under the HUD (drawWorldFog, from render.js drawWorld): your sight clear; beyond it,
   from WFOG.ring of vis() out, the battle's dim (FOG.col, FOG.dark) over all the land you remember; over land you have never seen a
   deeper dark, each edge a haze before its dark: pale and cool where it is thin, so it reads as fog. Their edges are mist
   (gfx/mist.js mistFog: billowing, frayed, a thin pale fringe, wisps drifting ahead), from smooth strengths: your sight's by the
   distance from you, the unknown's from the whole map in one small grid (WFOGV.b: a cell WFOG.cell px, 1 unknown, blurred), a cell
   coming to light fading WFOG.fade s (at once with reducedMotion). Only what changes is redone: tiles in view are watched against
   W.seen each frame (so whatever marks it shows), and the cells round them eased and blurred again. cell: px a cell; deep: the
   unknown's darkness (0-1) over the dim; col: its colour; soft: blurs of its edge (each a cell's width); fade: s a cell takes to
   clear; ring: where your sight begins to dim (a share of vis()); feather: px inside your sight's edge over which movers fade into
   the land as you remember it; mini, miniDeep: the minimap's dark over land you know and land you do not; miniSoft: blurs of its edge
   (each a tile). haze: the unknown's edge a cool, pale haze (the owner's fifth play-test: its soft edge read as dark ground), its
   dark from hz[0] to hz[1] of its strength; your sight's edge a fainter haze (ringHaze, ringHz) into the dim of the land you
   remember */
const WFOG={cell:8,deep:.97,col:[5,7,12],soft:3,fade:.3,ring:.62,feather:10,mini:.2,miniDeep:1,miniSoft:3,haze:[132,144,166],hz:[.3,.85],ringHaze:[64,74,92],ringHz:[0,.5]};
let WFOGV=null;
// (alphas a, a C-wide grid, blurred [1 2 1] across and down n times within the box x0..x1, y0..y1 (its edge held) into a (t: scratch))
function fogBlur(a,t,C,x0,y0,x1,y1,n){
  for(let k=0;k<n;k++){for(let r=y0;r<=y1;r++){const o=r*C;for(let c=x0;c<=x1;c++)t[o+c]=(a[o+(c>x0?c-1:c)]+2*a[o+c]+a[o+(c<x1?c+1:c)])/4}
    for(let r=y0;r<=y1;r++){const o=r*C,u=(r>y0?r-1:r)*C,w=(r<y1?r+1:r)*C;for(let c=x0;c<=x1;c++)a[o+c]=(t[u+c]+2*t[o+c]+t[w+c])/4}}}
// (the map's unknown built afresh from W.seen, nothing fading: a new game, a load. a: each cell 1 unknown .. 0 known (easing);
// b: that blurred)
function wfogBuild(){
  const S=seenArr(),k=TILE/WFOG.cell,C=MW*k,R=MH*k;let O=WFOGV;
  if(!O||O.C!==C||O.R!==R)O=WFOGV={C,R,k,a:new Float32Array(C*R),b:new Float32Array(C*R),s:new Float32Array(C*R),t:new Float32Array(C*R),edge:{},v:0};
  O.src=S;O.sh=S.slice();O.act=null;O.lt=0;for(let r=0;r<R;r++)for(let c=0;c<C;c++)O.a[r*C+c]=S[(r/k|0)*MW+(c/k|0)]?0:1;
  wfogPut(O,0,0,C-1,R-1)}
// (cells c0..c1, r0..r1 changed: blurred again, with the cells round them that the blur reaches)
function wfogPut(O,c0,r0,c1,r1){
  const {C,R,a,b,s,t}=O,n=WFOG.soft,X0=Math.max(0,c0-n),Y0=Math.max(0,r0-n),X1=Math.min(C-1,c1+n),Y1=Math.min(R-1,r1+n),x0=Math.max(0,X0-n),y0=Math.max(0,Y0-n),x1=Math.min(C-1,X1+n),y1=Math.min(R-1,Y1+n);
  for(let r=y0;r<=y1;r++){const o=r*C;for(let c=x0;c<=x1;c++)s[o+c]=a[o+c]}fogBlur(s,t,C,x0,y0,x1,y1,n);
  for(let r=Y0;r<=Y1;r++){const o=r*C;for(let c=X0;c<=X1;c++)b[o+c]=s[o+c]}}
// (a frame's step: tiles in view newly known start to clear; those clearing ease on; the ring's radius eases to V)
function wfogStep(cam,V){
  const S=seenArr();if(!WFOGV||WFOGV.src!==S)wfogBuild();const O=WFOGV,k=O.k,sh=O.sh,now=performance.now(),rm=reducedMotion(),dt=O.lt?Math.max(0,Math.min(.1,(now-O.lt)/1000)):1;O.lt=now;
  const x0=Math.max(0,Math.floor(cam.x/TILE)-1),y0=Math.max(0,Math.floor(cam.y/TILE)-1),x1=Math.min(MW-1,Math.floor((cam.x+VW)/TILE)+1),y1=Math.min(MH-1,Math.floor((cam.y+VH)/TILE)+1);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*MW+x;if(S[i]!==sh[i]){sh[i]=S[i];const b=O.act;O.act=b?[Math.min(b[0],x*k),Math.min(b[1],y*k),Math.max(b[2],x*k+k-1),Math.max(b[3],y*k+k-1)]:[x*k,y*k,x*k+k-1,y*k+k-1]}}
  if(O.act){const [c0,r0,c1,r1]=O.act,st=rm?1:dt/WFOG.fade;let on=false;
    for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const i=r*O.C+c,to=sh[(r/k|0)*MW+(c/k|0)]?0:1,a=O.a[i];if(a===to)continue;const b=Math.abs(to-a)<=st+1e-4?to:a<to?a+st:a-st;O.a[i]=b;if(b!==to)on=true}
    wfogPut(O,c0,r0,c1,r1);if(!on)O.act=null}
  O.v=rm||!O.v?V:O.v+(V-O.v)*Math.min(1,dt*3/WFOG.fade);if(Math.abs(O.v-V)<.5)O.v=V;
  return O}
// (the unknown's smooth strength at ground point (x, y): the blurred grid, smoothly between its cells)
function wfogAt(O,x,y){const cs=WFOG.cell,C=O.C,R=O.R;let u=x/cs-.5,v=y/cs-.5;u=u<0?0:u>C-1?C-1:u;v=v<0?0:v>R-1?R-1:v;
  const a=Math.min(C-2,u|0),b=Math.min(R-2,v|0),fx=u-a,fy=v-b,B=O.b,i=b*C+a,p=B[i],q=B[i+1],r=B[i+C],z=B[i+C+1];return p+(q-p)*fx+(r-p+(z-r-q+p)*fx)*fy}
// the fog over the map (render.js drawWorld, over the ground and everyone, under the grid, the night and the HUD): the dim of
// the land you remember, the dark of the land you never saw over it, their edges mist and wisps drifting in them (mist.js),
// laid into one small picture of the frame (a pixel 4 ground px) and drawn up onto the screen in one step
function drawWorldFog(cam,V){
  const O=wfogStep(cam,V),v=O.v,r0=v*WFOG.ring,rw=v-r0,px=P.x,py=P.y,W=MIST.warp,flat=mistFlat(O.fl||(O.fl={}),O.b,O.C,O.R,WFOG.cell,cam.x,cam.y,cam.x+VW,cam.y+VH);
  const E=mistFog(O.edge,cam.x,cam.y,VW,VH,WFOG.cell,4,[
    {s:(x,y)=>{const d=Math.hypot(x-px,y-py);return d<=r0?0:d>=v?1:(d-r0)/rw},flat:(X,Y)=>{const d=Math.hypot(X-px,Y-py);return d+W<=r0?0:d-W>=v?1:-1},a:FOG.dark,col:FOG.col,m:FOG.dark,haze:WFOG.ringHaze,hz:WFOG.ringHz},
    // (the unknown's dark kept out of your sight but for its last tenth, so its puffs never hide what you see)
    {s:(x,y,X,Y)=>{const d=Math.hypot(X-px,Y-py),u=wfogAt(O,x,y);return d<=v*.9?0:d>=v?u:Math.min(u,(d-v*.9)/(v*.1))},flat:(X,Y)=>{const d=Math.hypot(X-px,Y-py);if(d<=v*.9)return 0;const f=flat(X,Y);return f===0||d>=v?f:-1},a:WFOG.deep,col:WFOG.col,m:FOG.dark,haze:WFOG.haze,hz:WFOG.hz}]);
  // (bilinear: as soft, a quarter of the cost of the smoothest)
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='low';ctx.drawImage(E.comp,0,0,E.cw,E.ch,E.gx-cam.x,E.gy-cam.y,E.cw*E.k,E.ch*E.k);ctx.restore()}
// the remembered scene (render.js memCv: the structures before anyone was drawn) put back over all but your sight, its edge
// fading in over WFOG.feather px inside it: nothing that moves shows outside your sight, and none is cut off sharp at its edge
function fogMem(mem,px,py,V){
  const g=mem.getContext('2d'),f=Math.min(WFOG.feather,V*.5),gr=g.createRadialGradient(px,py,V-f,px,py,V);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');
  g.save();g.globalCompositeOperation='destination-out';g.fillStyle=gr;g.beginPath();g.arc(px,py,V,0,Math.PI*2);g.fill();g.restore();ctx.drawImage(mem,0,0)}
// the minimap's dark: one pixel a tile, soft-edged, dim over land you know, dark over land you do not; rebuilt when more land is
// known (at most twice a second)
let fogMini=null,fogMiniT=0;
// (a world of another size: the minimap's dark made afresh; W.seen and the fog's grid follow the size by themselves)
onWorld(()=>{if(fogMini&&(fogMini.width!==MW||fogMini.height!==MH))fogMini=null});
function fogMiniCv(){
  const now=performance.now();if(fogMini&&(!fogDirty||now-fogMiniT<500))return fogMini;fogDirty=false;fogMiniT=now;
  const S=seenArr(),N=MW*MH,a=new Float32Array(N),t=new Float32Array(N),[cr,cg,cb]=WFOG.col,lo=WFOG.mini*255,hi=WFOG.miniDeep*255;for(let i=0;i<N;i++)a[i]=S[i]?0:1;fogBlur(a,t,MW,0,0,MW-1,MH-1,WFOG.miniSoft);
  return fogMini=mkc(MW,MH,g=>{const d=g.createImageData(MW,MH);for(let i=0;i<N;i++){const p=i*4;d.data[p]=cr;d.data[p+1]=cg;d.data[p+2]=cb;d.data[p+3]=Math.round(lo+(hi-lo)*a[i])}g.putImageData(d,0,0)});
}
