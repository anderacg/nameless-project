'use strict';
/* ---------- fog of war: the land you have explored, and what you can see now ---------- */
// W.seen: a byte a tile, 1 once you have seen it. Within your sight (every man's: Sight) you see everything as it is. Land you have seen
// but are not looking at now is remembered: its ground, and the holdings, camps and sites on it as you last saw them, dimmed,
// with nothing that moves on it. Land you have never seen is dark. render.js draws it; the save keeps W.seen.
function seenArr(){if(!(W.seen instanceof Uint8Array)||W.seen.length!==MW*MH)W.seen=new Uint8Array(MW*MH);return W.seen}
const seenTile=(tx,ty)=>tx>=0&&ty>=0&&tx<MW&&ty<MH&&seenArr()[ty*MW+tx]===1;
const seenAt=(x,y)=>seenTile(Math.floor(x/TILE),Math.floor(y/TILE));
// the one point you see from, for whoever needs only one (the camera, the scout's ground: parties.js sight): your army's middle
// on the map, your hero in a battle fought on it
const worldEye=()=>B?.world&&B.hero?B.world.world(B.hero):P;
/* your sight (the owner, 2026-11-01: "the vision and fog of war should be based on all army units not only heroes"): the union of
   every man's in your army. On the map each marcher of yours (march.js MarchArmy: where he stands round its middle, carried along
   with it until it next steps) and, with middle, your army's middle, vis() wide as before (a few men spread round a wide ring
   never see less than the army did); you alone without an army (or far from it). In a battle fought on the map, till it is
   over, each of your side's living men still in it (worldbattle.js). Each man sees vis(), the army's scouting, times his kind's
   share of a character's (data/world.js SIGHT_KIND, sightShare: a rider farther, a man on foot less, a scout far farther), as the
   battle's sides see (battlefog.js fogRange).
   eyes ({x, y, r}): only those whose disks make its edge, the farthest out first; one whose rim (rim points round it) and middle
   lie within the kept ones' disks, tol px wider, adds nothing, so a big army keeps a dozen or two (tol doubled, up to most px,
   while more than max: never more, so no edge man's sight is lost; armies in lanes, marchstyles.js, keep the most). Gathered
   again when you, your army or the battle moved on (at most once a frame), built again only when someone moved over move px.
   x0..x1, y0..y1: the men's box; rm: the widest sight; ver: counts its builds */
const SIGHT_EYES={tol:3,most:6,rim:24,max:16,move:.5,middle:true,armies:true};// (armies: another army seen, and drawn, man by man: worldobject.js spotted, march.js marchDraw)
class Sight{
  constructor(){const K=SIGHT_EYES.rim;this.eyes=[];this.pool=[];this.raw=new Float64Array(96);this.was=new Float64Array(96);this.m=0;this.mw=-1;this.ord=[];this.key=new Float64Array(32);
    this.cos=Float64Array.from({length:K},(_,i)=>Math.cos(i*2*Math.PI/K));this.sin=Float64Array.from({length:K},(_,i)=>Math.sin(i*2*Math.PI/K));
    this.by=(a,b)=>this.key[b]-this.key[a]||a-b;this.st={};this.V=0;this.ver=0;this.x0=this.y0=this.x1=this.y1=this.rm=0}
  // up to date for sight V (your army left further behind than a march's leap (MARCH_MOVE.teleport) is made again round you when
  // it next steps, MarchArmy.of: you alone till then; a battle over is not seen from)
  at(V){const s=this.st,w=B&&!B.over&&B.world||null;let a=!w&&WORLD_BATTLE.on&&MARCH_ARMIES.get(P)||null;if(a&&Math.hypot(P.x-a.x,P.y-a.y)>MARCH_MOVE.teleport)a=null;
    if(s.V===V&&s.w===w&&s.a===a&&(w?s.t===B.t&&s.n===B.units.length:s.x===P.x&&s.y===P.y&&s.t===(a?a.time:0)&&s.n===(a?a.units.length:0)))return this;
    s.V=V;s.w=w;s.a=a;s.x=P.x;s.y=P.y;s.t=w?B.t:a?a.time:0;s.n=w?B.units.length:a?a.units.length:0;this.V=V;
    this.gather(V,w,a);if(this.moved())this.build();return this}
  // (each man's x, y, r into raw, m of them)
  gather(V,w,a){this.m=0;
    if(w){for(const u of B.units)if(!u.team&&u.hp>0&&!u.left&&!u.rout)this.put(w.x0+u.x/w.scale,w.y0+u.y/w.scale,V*fogRange(u)/FOG.char)}
    else if(a){const dx=P.x-a.x,dy=P.y-a.y;if(SIGHT_EYES.middle)this.put(P.x,P.y,V);for(const u of a.units)if(!u.dead)this.put(u.x+dx,u.y+dy,V*manSight(u))}
    if(!this.m){const p=w?worldEye():P;this.put(p.x,p.y,V)}}
  put(x,y,r){let R=this.raw;const i=3*this.m++;if(i+3>R.length){R=new Float64Array(R.length*2);R.set(this.raw);this.raw=R}R[i]=x;R[i+1]=y;R[i+2]=r}
  // (anyone moved over move px, came or went since the last build: raw kept as was)
  moved(){const R=this.raw,n=3*this.m,e=SIGHT_EYES.move;let go=this.m!==this.mw;for(let i=0;i<n&&!go;i++)if(Math.abs(R[i]-this.was[i])>e)go=true;
    if(go){if(this.was.length!==R.length)this.was=new Float64Array(R.length);this.was.set(R);this.mw=this.m}return go}
  // (the eyes: the men by how far each reaches from the middle of them all, the farthest first, each kept unless the kept cover
  // him; the men's box)
  build(){const R=this.raw,m=this.m,o=this.ord;if(this.key.length<m)this.key=new Float64Array(2*m);const key=this.key;let cx=0,cy=0;
    for(let i=0;i<m;i++){cx+=R[3*i];cy+=R[3*i+1]}cx/=m;cy/=m;o.length=m;
    for(let i=0;i<m;i++){o[i]=i;key[i]=Math.hypot(R[3*i]-cx,R[3*i+1]-cy)+R[3*i+2]}o.sort(this.by);
    for(let tol=SIGHT_EYES.tol;this.pick(tol)>SIGHT_EYES.max&&tol*2<=SIGHT_EYES.most;)tol*=2;
    let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity,rm=0;for(let i=0;i<3*m;i+=3){const x=R[i],y=R[i+1];if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;if(R[i+2]>rm)rm=R[i+2]}
    this.x0=x0;this.y0=y0;this.x1=x1;this.y1=y1;this.rm=rm;this.ver++}
  // (the kept, tol px over their edge: how many)
  pick(tol){const R=this.raw,o=this.ord,E=this.eyes,C=this.cos,S=this.sin,K=C.length;E.length=0;
    for(let q=0;q<o.length;q++){const i=3*o[q],x=R[i],y=R[i+1],r=R[i+2];let out=!this.covered(x,y,tol);for(let k=0;k<K&&!out;k++)out=!this.covered(x+r*C[k],y+r*S[k],tol);
      if(out){const e=this.pool[E.length]||(this.pool[E.length]={x:0,y:0,r:0});e.x=x;e.y=y;e.r=r;E.push(e)}}
    return E.length}
  covered(x,y,tol){const E=this.eyes;for(let j=0;j<E.length;j++){const e=E[j],dx=x-e.x,dy=y-e.y,r=e.r+tol;if(dx*dx+dy*dy<=r*r)return true}return false}
  // (x, y) in your sight, each eye's r times k (k below 1: a wood's nearer sight, asked of every man; above: a margin past it), and
  // pad px more (a ring of that much round x, y that it touches)
  sees(x,y,k=1,pad=0){const g=this.rm*(k>1?k:1)+pad;if(x<this.x0-g||x>this.x1+g||y<this.y0-g||y>this.y1+g)return false;
    const E=this.eyes;for(let j=0;j<E.length;j++){const e=E[j],dx=x-e.x,dy=y-e.y,r=e.r*k+pad;if(dx*dx+dy*dy<r*r)return true}
    if(k>=1)return false;const R=this.raw;for(let i=0;i<3*this.m;i+=3){const dx=x-R[i],dy=y-R[i+1],r=R[i+2]*k+pad;if(dx*dx+dy*dy<r*r)return true}return false}
  // px from (x, y) out to its edge (below 0: inside), the nearest eye's: the fog's smooth strengths (past far px out, only that it
  // is: the men's box tells, no eye asked)
  edge(x,y,far=Infinity){const bx=x<this.x0?this.x0-x:x>this.x1?x-this.x1:0,by=y<this.y0?this.y0-y:y>this.y1?y-this.y1:0,lo=Math.sqrt(bx*bx+by*by)-this.rm;if(lo>=far)return lo;
    const E=this.eyes;let d=Infinity;for(let j=0;j<E.length;j++){const e=E[j],dx=x-e.x,dy=y-e.y,v=Math.sqrt(dx*dx+dy*dy)-e.r;if(v<d)d=v}return d}
}
const ARMY_SIGHT=new Sight();
// your sight now, for sight V (vis(): the army's scouting); in it
const yourSight=(V=vis())=>ARMY_SIGHT.at(V);
// (a marcher's share of a character's sight, by his kind: data/world.js sightShare; a character's 1)
const manSight=u=>u.character||u.row==='hero'||u.row==='leader'?1:sightShare(u.type);
/* an army's eyes (the owner, 2026-11-01: "Every unit spots now and has its vision range, so the army should depend on all units'
   capabilities"): each man of its march (march.js MarchArmy, carried with its middle till it next steps) r px times his kind's
   share (manSight), merged as yours are; a column's head sees furthest down its road. marchstyles.js TravelStyle asks it, of armies
   marched man by man (near you), when a foe comes near enough: gathered again when its men stepped or it moved, built again only
   when one moved over SIGHT_EYES.move px (ver counts its builds). One an army (armySight), kept with its march */
class ArmySight extends Sight{
  of(a,r){const s=this.st,o=a.owner;if(s.a===a&&s.r===r&&s.t===a.time&&s.x===o.x&&s.y===o.y&&s.n===a.units.length)return this;
    s.a=a;s.r=r;s.t=a.time;s.x=o.x;s.y=o.y;s.n=a.units.length;this.m=0;const dx=o.x-a.x,dy=o.y-a.y;
    for(const u of a.units)if(!u.dead)this.put(u.x+dx,u.y+dy,r*manSight(u));if(!this.m)this.put(o.x,o.y,r);if(this.moved())this.build();return this}
}
const ARMY_SIGHTS=new WeakMap();
// (march a's eyes, a character's r px wide)
const armySight=(a,r)=>{let s=ARMY_SIGHTS.get(a);if(!s)ARMY_SIGHTS.set(a,s=new ArmySight());return s.of(a,r)};
const inSight=(x,y)=>yourSight().sees(x,y);
let fogDirty=true,lastReveal=-1;
// what you see now becomes known (each tile whose middle lies within an eye of your sight, after each build)
function revealDisk(px,py,V){
  const S=seenArr(),tx=Math.floor(px/TILE),ty=Math.floor(py/TILE);
  const r=Math.ceil(V/TILE)+1;
  for(let y=ty-r;y<=ty+r;y++)for(let x=tx-r;x<=tx+r;x++){if(x<0||y<0||x>=MW||y>=MH||S[y*MW+x])continue;if(Math.hypot((x+.5)*TILE-px,(y+.5)*TILE-py)<V){S[y*MW+x]=1;fogDirty=true}}
}
function reveal(){
  const S=yourSight(),E=S.eyes;if(S.ver===lastReveal)return;lastReveal=S.ver;
  for(let j=0;j<E.length;j++)revealDisk(E[j].x,E[j].y,E[j].r);
}
// a fresh map (a new game): nothing known yet
function fogReset(){W.seen=new Uint8Array(MW*MH);fogDirty=true;lastReveal=-1}
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
   from WFOG.ring of an eye's sight out, the battle's dim (FOG.col, FOG.dark) over all the land you remember; over land you have never seen a
   deeper dark, each edge a haze before its dark: pale and cool where it is thin, so it reads as fog. Their edges are mist
   (gfx/mist.js mistFog: billowing, frayed, a thin pale fringe, wisps drifting ahead), from smooth strengths: your sight's by the
   distance out to its edge (Sight edge), the unknown's from the whole map in one small grid (WFOGV.b: a cell WFOG.cell px, 1 unknown, blurred), a cell
   coming to light fading WFOG.fade s (at once with reducedMotion). Only what changes is redone: tiles in view are watched against
   W.seen each frame (so whatever marks it shows), and the cells round them eased and blurred again. cell: px a cell; deep: the
   unknown's darkness (0-1) over the dim; col: its colour; soft: blurs of its edge (each a cell's width); fade: s a cell takes to
   clear; ring: where your sight begins to dim (a share of vis(), inside its edge); feather: px inside your sight's edge over which movers fade into
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
// (your sight's edge (Sight edge: px out of it), less the ring easing to V (off); each cell's middle read once for both levels)
function drawWorldFog(cam,V){
  const O=wfogStep(cam,V),v=O.v,S=yourSight(V),off=v-V,rw=v*(1-WFOG.ring),tn=v*.1,W=MIST.warp,flat=mistFlat(O.fl||(O.fl={}),O.b,O.C,O.R,WFOG.cell,cam.x,cam.y,cam.x+VW,cam.y+VH);
  let lx=NaN,ly=NaN,le=0;const far=W+Math.abs(off)+1,at=(X,Y)=>X===lx&&Y===ly?le:(lx=X,ly=Y,le=S.edge(X,Y,far)-off);
  const E=mistFog(O.edge,cam.x,cam.y,VW,VH,WFOG.cell,4,[
    {s:(x,y)=>{const e=S.edge(x,y)-off;return e<=-rw?0:e>=0?1:(e+rw)/rw},flat:(X,Y)=>{const e=at(X,Y);return e+W<=-rw?0:e-W>=0?1:-1},a:FOG.dark,col:FOG.col,m:FOG.dark,haze:WFOG.ringHaze,hz:WFOG.ringHz},
    // (the unknown's dark kept out of your sight but for its last tenth, so its puffs never hide what you see)
    {s:(x,y,X,Y)=>{const e=at(X,Y),u=wfogAt(O,x,y);return e<=-tn?0:e>=0?u:Math.min(u,(e+tn)/tn)},flat:(X,Y)=>{const e=at(X,Y);if(e<=-tn)return 0;const f=flat(X,Y);return f===0||e>=0?f:-1},a:WFOG.deep,col:WFOG.col,m:FOG.dark,haze:WFOG.haze,hz:WFOG.hz}]);
  // (bilinear: as soft, a quarter of the cost of the smoothest)
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='low';ctx.drawImage(E.comp,0,0,E.cw,E.ch,E.gx-cam.x,E.gy-cam.y,E.cw*E.k,E.ch*E.k);ctx.restore()}
// the remembered scene (render.js memCv: the structures before anyone was drawn, its corner at cam) put back over all but your
// sight, each eye's edge fading in over WFOG.feather px inside it: nothing that moves shows outside your sight, and none is cut
// off sharp at its edge. Each eye cut out by its feathered disk (fogDisk), one after another
function fogMem(mem,cam,V){
  const g=mem.getContext('2d', { willReadFrequently: true }),E=yourSight(V).eyes;g.save();g.globalCompositeOperation='destination-out';
  for(let j=0;j<E.length;j++){const e=E[j],s=fogDisk(e.r),h=s.width>>1;g.drawImage(s,Math.round(e.x-cam.x)-h,Math.round(e.y-cam.y)-h)}
  g.restore();ctx.drawImage(mem,0,0)}
// (a black disk r px wide (rounded), its rim fading over WFOG.feather px: drawn once a radius and kept, keep of them (a gradient
// drawn afresh for a dozen eyes a frame cost ms; a stamp a tenth of it))
const FOG_DISK={keep:12,pics:new Map()};
function fogDisk(r){
  const R=Math.round(r),M=FOG_DISK.pics;let s=M.get(R);if(s)return s;if(M.size>=FOG_DISK.keep)M.delete(M.keys().next().value);
  s=mkc(2*R+2,2*R+2,g=>{const f=Math.min(WFOG.feather,R*.5),gr=g.createRadialGradient(R+1,R+1,R-f,R+1,R+1,R);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(R+1,R+1,R,0,Math.PI*2);g.fill()});
  M.set(R,s);return s}
/* the minimap's dark: one pixel a tile, soft-edged, dim over land you know, dark over land you do not; brought up to date when
   more land is known (at most twice a second), by chunks of FOG_MINI.chunk tiles: what is known is compared, chunk by chunk,
   with what the picture shows (sh), and only a chunk that changed is blurred again, with the tiles round it the blur reaches
   (as wfogPut: its box miniSoft wider written, from one twice as wide), so the picture is the whole map's blur (the old way: all
   of it, every time: 50-130 ms on a Huge map). A new W.seen or map size: made whole */
const FOG_MINI={chunk:32};
let fogMini=null,fogMiniT=0;
onWorld(()=>{if(fogMini&&(fogMini.w!==MW||fogMini.h!==MH))fogMini=null});
function fogMiniCv(){
  const now=performance.now();if(fogMini&&(!fogDirty||now-fogMiniT<500))return fogMini.cv;fogDirty=false;fogMiniT=now;
  const S=seenArr(),C=FOG_MINI.chunk;let M=fogMini;
  if(!M||M.src!==S||M.w!==MW||M.h!==MH){const cv=mkc(MW,MH,()=>{}),g=cv.getContext('2d', { willReadFrequently: true }),img=g.createImageData(MW,MH),[cr,cg,cb]=WFOG.col;
    for(let i=0,D=img.data;i<MW*MH;i++){D[i*4]=cr;D[i*4+1]=cg;D[i*4+2]=cb}
    M=fogMini={src:S,w:MW,h:MH,sh:S.slice(),cv,g,img};fogMiniPut(M,0,0,MW-1,MH-1);return cv}
  const sh=M.sh;let any=false;
  for(let cy=0;cy*C<MH;cy++)for(let cx=0;cx*C<MW;cx++){const x0=cx*C,y0=cy*C,x1=Math.min(MW,x0+C)-1,y1=Math.min(MH,y0+C)-1;let ch=false;
    for(let y=y0;y<=y1&&!ch;y++){const o=y*MW;for(let x=x0;x<=x1;x++)if(S[o+x]!==sh[o+x]){ch=true;break}}
    if(!ch)continue;for(let y=y0;y<=y1;y++)sh.set(S.subarray(y*MW+x0,y*MW+x1+1),y*MW+x0);fogMiniPut(M,x0,y0,x1,y1);any=true}
  if(any)M.cv._at=null;// (its picture at the minimap's size made again: render.js atSize)
  return M.cv}
// (tiles x0..x1, y0..y1 changed: their alpha and that of the tiles their blur reaches, from the known tiles round them, put in)
function fogMiniPut(M,c0,r0,c1,r1){const n=WFOG.miniSoft,X0=Math.max(0,c0-n),Y0=Math.max(0,r0-n),X1=Math.min(MW-1,c1+n),Y1=Math.min(MH-1,r1+n),
  x0=Math.max(0,X0-n),y0=Math.max(0,Y0-n),x1=Math.min(MW-1,X1+n),y1=Math.min(MH-1,Y1+n),w=x1-x0+1,h=y1-y0+1,a=new Float32Array(w*h),t=new Float32Array(w*h),S=M.src,D=M.img.data,lo=WFOG.mini*255,hi=WFOG.miniDeep*255;
  for(let y=0;y<h;y++){const o=(y+y0)*MW+x0;for(let x=0;x<w;x++)a[y*w+x]=S[o+x]?0:1}fogBlur(a,t,w,0,0,w-1,h-1,n);
  for(let y=Y0;y<=Y1;y++)for(let x=X0;x<=X1;x++)D[(y*MW+x)*4+3]=Math.round(lo+(hi-lo)*a[(y-y0)*w+x-x0]);
  M.g.putImageData(M.img,0,0,X0,Y0,X1-X0+1,Y1-Y0+1)}
