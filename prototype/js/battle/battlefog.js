'use strict';
/* ---------- fog of war in battle (Total War's line of sight; doc/TERRAIN_DESIGN.md §8, "Fog of war as built") ----------
   A side sees a soldier of the other only when one of its own (living, not routing, not gone off the field) stands within his
   sight range with a clear line: rises and rock block it as ever (terrain.js riseBlocked). Woods keep their own stricter rule
   (SIGHT.near, .high), and a blow or a shot gives the striker away for SIGHT.memory s (sightStruck). It is all terrain.js
   sightStep's: seenBy, visibleFoes, lastSeen and sightGoal stay the API, so whatever obeys sight obeys the fog.
   Where: field battles (every ground, rivers, a held bridge, an ambush; terrain on or off); none in tournaments, sieges or raids
   (BattleSetup.fogOn); the lab's own key (lab.js fog). Per side, a grid of FOG.cell px cells: each viewer's cell and range once,
   its disc marked (vis: a soldier there is seen; rng: in range, line or not), with a walk out along rays only where raised
   ground or rock could stand between (a cell at least a level above the viewer's in the disc's box: T.hiSum).
   The player's side sees it as a soft dark over the ground outside its sight (fogDraw: a cell a pixel, each fading FOG.fade s;
   its edge mist, wisps drifting in it: gfx/mist.js), the same on the small map (fogMiniField), and a fading mark where an
   enemy group was last seen (ghosts).
   on: a view over the Settings' "Fog of war (battle)" (PREFS bfog, ui.js; tests/harness.js turns it off for the older suites);
   foot, shoot, mounted, char: sight range by kind (px; the most of those that fit him: a mounted archer 300; Scout ahead, a scout
   unit's ability, × its sight while on: unitabilities.js); big: a big one
   (monsters, dragons) is seen from this much farther; high: +range a level the viewer stands above the cell he looks at; cell:
   the grid (px, the terrain's cells with terrain); fade: s a cell takes to clear or darken; dark: the fog's darkness (0-1);
   col: its colour; soft: blurs of its edge (each a cell's width); ghost: s a lost group's mark lasts; clear: cells round it (each way) that, all in sight and empty, clear it;
   scout, probe: an AI captain that has never seen the foe advances after scout s, its line probe px ahead of its middle */
const FOG={foot:220,shoot:260,mounted:300,char:280,big:1.5,high:.25,cell:16,fade:.3,dark:.58,col:[10,14,24],soft:2,ghost:15,clear:2,scout:3,probe:140};
Object.defineProperty(FOG,'on',{get:()=>prefGet('bfog'),set:v=>{PREFS.bfog.v=!!v},enumerable:true});
// (a viewer's sight range by his kind; a scout scouting ahead sees farther: unitabilities.js abilitySight)
function fogRange(u){if(u.hero||u.leader||u.comp)return FOG.char;const s=u.s;let r=FOG.foot;if(s.range&&FOG.shoot>r)r=FOG.shoot;if(s.mounted&&FOG.mounted>r)r=FOG.mounted;return Math.round(r*abilitySight(u))}
/* each side's sight (sightStep, fog on): S.fog {C, R, cs, vis: {team: Uint8Array}, rng, src: {team: [{x, y, r, lv, i}]}}. live:
   the living; uc, ul: each one's cell and level */
function fogGrid(S,T,live,uc,ul,teams){
  const cs=T?T.cs:FOG.cell,C=T?T.C:Math.ceil(BW/cs),R=T?T.R:Math.ceil(BH/cs),N=C*R;let G=S.fog;
  if(!G||G.N!==N)G=S.fog={C,R,cs,N,vis:{},rng:{},src:{}};
  for(const t of teams){(G.vis[t]||(G.vis[t]=new Uint8Array(N))).fill(0);(G.rng[t]||(G.rng[t]=new Uint8Array(N))).fill(0);G.src[t]=[]}
  const once=new Set();
  for(let k=0;k<live.length;k++){const u=live[k];if(u.rout||u.left||!G.src[u.team])continue;const r=fogRange(u),i=uc[k],key=(i*1024+r)*8+u.team;if(once.has(key))continue;once.add(key);
    const s={x:(i%C+.5)*cs,y:(Math.floor(i/C)+.5)*cs,r,lv:ul[k],i};G.src[u.team].push(s);fogMark(G,T,u.team,s)}
  return G}
// (one viewer's disc: every cell within his range (by the height between) marked in range, and seen unless the ground hides it)
function fogMark(G,T,t,s){
  const {C,R,cs}=G,vis=G.vis[t],rng=G.rng[t],ci=s.i%C,ri=Math.floor(s.i/C),LV=T&&T.has.hills?T.lvl:null,lv=s.lv,Rm=s.r*(1+FOG.high*lv),rc=Math.ceil(Rm/cs);
  const lim=lc=>{const k=s.r*(1+FOG.high*(lv>lc?lv-lc:0))/cs;return k*k};
  const c0=Math.max(0,ci-rc),c1=Math.min(C-1,ci+rc),r0=Math.max(0,ri-rc),r1=Math.min(R-1,ri+rc);
  // (no cell in the box a level above his: nothing can hide; every cell in range is seen)
  const la=T&&T.shTop?T.sh[s.i]:0,H=T&&T.shTop?T.hiSum[Math.min(la+1,T.lvlTop+1)]:null,W1=C+1;
  if(!H||H[(r1+1)*W1+c1+1]-H[r0*W1+c1+1]-H[(r1+1)*W1+c0]+H[r0*W1+c0]<1){
    const m=(Rm/cs)*(Rm/cs);for(let r=r0;r<=r1;r++){const dy=r-ri,h=m-dy*dy;if(h<0)continue;const w=Math.floor(Math.sqrt(h)),a=Math.max(c0,ci-w),b=Math.min(c1,ci+w),o=r*C;
      for(let c=a;c<=b;c++){const j=o+c;if(LV){const dx=c-ci;if(dx*dx+dy*dy>lim(LV[j]))continue}vis[j]=1;rng[j]=1}}
    return}
  // (else what he sees from that cell with that range, cast once a battle and kept (the ground never changes): S.fogCast, emptied
  // past FOG_CAST.keep entries)
  const S=B.sight,K=S.fogCast||(S.fogCast=new Map()),key=s.i*1024+s.r;let q=K.get(key);
  if(!q){if(K.size>=FOG_CAST.keep)K.clear();q=fogCast(G,T,ci,ri,la,[0,1,2,3].map(lim),rc);K.set(key,q)}
  for(const j of q.v){vis[j]=1;rng[j]=1}for(const j of q.g)rng[j]=1}
/* (rays from a cell to each cell round the box rc cells each way (fogRays: laid once a radius, each a list of cells out to rc):
   a cell is hidden by one passed on the way at least a level above both, as riseBlocked has it; his own and the cells beside
   him never. lims: (range in cells)² by the level looked at. {v: the cells seen, g: those in range but hidden}) */
const FOG_CAST={keep:2500};
let FOG_RAYS=new Map(),FOG_BUF=null;
function fogRays(rc){let Tm=FOG_RAYS.get(rc);if(Tm)return Tm;const dc=[],dr=[],st=[0],m=rc*rc;
  const ray=(ec,er)=>{const dx=ec,dy=er,sx=dx>0?1:-1,sy=dy>0?1:-1,tdx=dx?Math.abs(1/dx):Infinity,tdy=dy?Math.abs(1/dy):Infinity;let c=0,r=0,tx=dx?.5*tdx:Infinity,ty=dy?.5*tdy:Infinity;
    for(let n=2*rc+2;n>0;n--){if(tx<ty){c+=sx;tx+=tdx}else{r+=sy;ty+=tdy}if(c*c+r*r>m)break;dc.push(c);dr.push(r)}st.push(dc.length)};
  for(let c=-rc;c<=rc;c++){ray(c,-rc);ray(c,rc)}for(let r=-rc+1;r<rc;r++){ray(-rc,r);ray(rc,r)}
  Tm={dc:Int16Array.from(dc),dr:Int16Array.from(dr),d2:Int32Array.from(dc.map((c,i)=>c*c+dr[i]*dr[i])),st:Int32Array.from(st)};FOG_RAYS.set(rc,Tm);return Tm}
function fogCast(G,T,ci,ri,la,lims,rc){
  const {C,R,N}=G,sh=T.sh,lvl=T.lvl,Tm=fogRays(rc),DC=Tm.dc,DR=Tm.dr,D2=Tm.d2,ST=Tm.st;if(!FOG_BUF||FOG_BUF.m.length!==N)FOG_BUF={m:new Uint8Array(N),l:new Int32Array(N)};
  const M=FOG_BUF.m,Ls=FOG_BUF.l,i0=ri*C+ci;let n=0,nv=0;M[i0]=2;Ls[n++]=i0;nv++;
  for(let k=0;k<ST.length-1;k++){let mh=0;for(let p=ST[k],e=ST[k+1];p<e;p++){const c=ci+DC[p],r=ri+DR[p];if(c<0||r<0||c>=C||r>=R)break;const j=r*C+c,hj=sh[j],d=D2[p];
    if(d<=lims[lvl[j]]){const w=d<=1||mh<=(la>hj?la:hj)?2:1,o=M[j];if(!o)Ls[n++]=j;if(w>o){M[j]=w;if(w===2)nv++}}if(hj>mh)mh=hj}}
  const A=N<65536?Uint16Array:Int32Array,v=new A(nv),g=new A(n-nv);let a=0,b=0;for(let x=0;x<n;x++){const j=Ls[x];if(M[j]===2)v[a++]=j;else g[b++]=j;M[j]=0}
  return{v,g}}
// does side t see u (cell i, level lu; not in a wood: that rule is sightStep's)? His cell in its sight; a big one from FOG.big
// farther, with a clear line
function fogSees(G,T,t,u,i,lu){
  if(G.vis[t][i])return true;if(!u.s.big)return false;
  for(const s of G.src[t]){const R=s.r*FOG.big*(1+FOG.high*(s.lv>lu?s.lv-lu:0)),dx=u.x-s.x,dy=u.y-s.y;if(dx*dx+dy*dy<=R*R&&!(T&&T.shTop&&riseBlocked(T,s.x,s.y,u.x,u.y)))return true}
  return false}
/* the marks of enemy groups gone from sight (your side's, team 0): S.ghost {group id: {x, y, t}}, set where the group was last
   seen (lastSeen, their middle) as it goes; gone when it is seen again, after FOG.ghost s, when all its men are dead, or when
   that place (FOG.clear cells each way, not a wood) lies in your sight with none of them there */
function fogGhosts(S,T){
  const G=S.fog,Gs=S.ghost||(S.ghost=new Map()),on=S.gseen||(S.gseen=new Set()),vis=G&&G.vis[0];
  for(const id in B.groups){const g=B.groups[id];if(g.team===0)continue;const m=grpUnits(id);if(!m.length){Gs.delete(id);on.delete(id);continue}
    if(m.some(u=>!(u.hid&1))){Gs.delete(id);on.add(id);continue}
    if(on.has(id)){on.delete(id);let x=0,y=0,c=0;for(const u of m){const p=lastSeen(0,u);if(p){x+=p.x;y+=p.y;c++}}if(c)Gs.set(id,{x:x/c,y:y/c,t:B.t})}
    const q=Gs.get(id);if(!q)continue;if(B.t-q.t>FOG.ghost||vis&&fogClear(G,T,vis,q))Gs.delete(id)}}
const fogClear=(G,T,vis,q)=>{const ci=Math.floor(q.x/G.cs),ri=Math.floor(q.y/G.cs),k=FOG.clear;if(T&&T.has.wood&&T.kind[tIx(T,q.x,q.y)]===TKIND.wood)return false;
  for(let r=ri-k;r<=ri+k;r++)for(let c=ci-k;c<=ci+k;c++){if(c<0||r<0||c>=G.C||r>=G.R)continue;if(!vis[r*G.C+c])return false}return true};
// (a ghost's strength now, 1 fresh to 0 gone)
const ghostFade=q=>Math.max(0,1-(B.t-q.t)/FOG.ghost);
/* the fog over the field (render.js, over the soldiers and under the HUD): your side's sight a cell a pixel (B.fogView: alpha
   per cell easing to 0 in sight, 1 out of it over FOG.fade s of real time; cv, the small map's), softened (fogSoft: s) and
   drawn as mist (fogDraw): its edge billowing, no hard lines where the fog begins */
function fogView(){
  const G=B.fog&&B.sight&&B.sight.fog;if(!G||!G.vis[0])return null;let O=B.fogView;const vis=G.vis[0];
  if(!O||O.N!==G.N){O=B.fogView={N:G.N,C:G.C,R:G.R,cs:G.cs,a:new Float32Array(G.N),lt:0,f:-1};for(let i=0;i<G.N;i++)O.a[i]=vis[i]?0:1;O.cv=mkc(G.C,G.R,()=>{});O.img=O.cv.getContext('2d', { willReadFrequently: true }).createImageData(G.C,G.R);O.dirty=true}
  const now=performance.now(),st=O.lt?Math.min(.1,(now-O.lt)/1000)/FOG.fade:1;O.lt=now;let ch=O.dirty;
  for(let i=0;i<G.N;i++){const to=vis[i]?0:1,a=O.a[i];if(a!==to){O.a[i]=Math.abs(to-a)<=st+1e-4?to:a<to?a+st:a-st;ch=true}}
  if(ch){const d=O.img.data,[r,g,b]=FOG.col,A=fogSoft(O);for(let i=0;i<G.N;i++){const p=i*4;d[p]=r;d[p+1]=g;d[p+2]=b;d[p+3]=Math.round(A[i]*FOG.dark*255)}O.cv.getContext('2d', { willReadFrequently: true }).putImageData(O.img,0,0);O.dirty=false}
  return O}
// (its edge softened: the cells' alphas blurred [1 2 1] across and down, FOG.soft times, the field's edge held)
function fogSoft(O){const {C,R,N}=O,a=O.s||(O.s=new Float32Array(N)),b=O.t||(O.t=new Float32Array(N));a.set(O.a);
  for(let k=0;k<FOG.soft;k++){for(let r=0;r<R;r++){const o=r*C;for(let c=0;c<C;c++)b[o+c]=(a[o+(c?c-1:0)]+2*a[o+c]+a[o+(c<C-1?c+1:c)])/4}
    for(let r=0;r<R;r++){const o=r*C,u=(r?r-1:0)*C,w=(r<R-1?r+1:r)*C;for(let c=0;c<C;c++)a[o+c]=(b[u+c]+2*b[o+c]+b[w+c])/4}}
  return a}
function fogDraw(){const O=fogView();if(!O||!O.s)return;
  // (over the field in view, its edge mist and wisps drifting in it (gfx/mist.js mistFog), from the cells' softened strength
  // (fogSoft), half a cell a cell; drawn up in one step)
  const c=B.cam,z=c?c.z:1,vx=c?c.x:0,vy=c?c.y:0,x0=Math.max(0,vx),y0=Math.max(0,vy),x1=Math.min(O.C*O.cs,vx+BVW/z),y1=Math.min(O.R*O.cs,vy+BVH/z);if(x1<=x0||y1<=y0)return;
  const {C,R,cs}=O,S=O.s,at=(x,y)=>{let u=x/cs-.5,v=y/cs-.5;u=u<0?0:u>C-1?C-1:u;v=v<0?0:v>R-1?R-1:v;const a=Math.min(C-2,u|0),b=Math.min(R-2,v|0),fx=u-a,fy=v-b,i=b*C+a,p=S[i],q=S[i+1],r=S[i+C],w=S[i+C+1];return p+(q-p)*fx+(r-p+(w-r-q+p)*fx)*fy};
  const E=mistFog(O.edge||(O.edge={}),x0,y0,x1-x0,y1-y0,cs/2,4,[{s:at,flat:mistFlat(O.fl||(O.fl={}),S,C,R,cs,x0,y0,x1,y1),a:FOG.dark,col:FOG.col,m:FOG.dark}]);
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='low';ctx.drawImage(E.comp,0,0,E.cw,E.ch,E.gx,E.gy,E.cw*E.k,E.ch*E.k);ctx.restore()}
// (the small map, rect r: the same fog over its ground)
function fogMiniField(r){const O=B.fog&&B.fogView;if(!O)return;ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(O.cv,r.x,r.y,O.C*O.cs*r.w/BW,O.R*O.cs*r.h/BH);ctx.restore()}
// (the overlay's state of the cell under field point (x, y): 0 clear .. 1 fogged; null with no fog: tests)
function fogAt(x,y){const O=B&&B.fogView;if(!O)return null;const c=clamp(Math.floor(x/O.cs),0,O.C-1),r=clamp(Math.floor(y/O.cs),0,O.R-1);return O.a[r*O.C+c]}
