'use strict';
/* ---------- rendering ---------- */
// x, y: the leader's feet on screen; dir: which way the host faces; seed keeps each follower's place steady; wd: how far the
// leader has walked while it walks (each follower's step by it, a little out of time with the next: WALK), null standing
// (race: the host's people; band: a bandit band, hooded and ragged. Every follower stands as tall as the leader: people.js; at
// most 9 of them, three abreast, the ranks 4 px apart; its label over it all: drawBanners)
function drawHost(n,col,x,y,dir,wd,seed,race,band){
  const k=hostSize(n);if(!k)return;const pts=[];
  for(let i=0;i<k;i++){const row=Math.floor(i/3),c=i%3,j=hash(i,seed|0,7);pts.push([x-dir*(6+row*4+(c===1?2:0))+Math.round(j*2-1),y-2+(c-1)*3+(row%2),i])}
  pts.sort((a,b)=>a[1]-b[1]);
  for(const [px,py,i] of pts){const f=wd==null?0:Math.floor(wd/WALK.foot+i*WALK.n*.325)%WALK.n,s=followerSprite(col,f,(i+(seed|0))%6,race,band);ctx.save();ctx.translate(Math.round(px),Math.round(py));if(dir<0)ctx.scale(-1,1);ctx.drawImage(s,-8,-14);ctx.restore()}
}
// a mover's step on the map (doc §10.2, R13): its frame by how far it has walked (parties.js frameOf: a frame each stride px, n a
// cycle), so the feet keep to the ground at every speed; 0 standing, once it has not moved for a moment (STILL_MS: a frame or two
// it misses mid-walk, not a stop) or at once when it is there (done: your band at its goal). Drawn only.
// WALK: the map's walk cycles, n frames each (people.js, engine/beasts.js PX.beastMap, critters.js, caravans.js; 0 the standing
// one), a frame each foot px walked on foot, each ride px riding: the strides of the old four-frame cycles cut by n/4, so the
// same slow pace steps as far, in finer steps
const STILL=new WeakMap(),STILL_MS=100,WALK={n:8,foot:1.25,ride:2,field:2,step:1.6,cap:10};// (field: a battle's own field drawn 1:1, a step each WALK.foot × field px, × step (a long stride: a little longer than the foot's own travel, so a quick man's legs do not flicker; the owner, 2026-11-07: "it seems too fast"), at most cap frames a second; as on the map's battles (× its scale): no floating, the owner, 2026-11-07: "the sprite seems like they are floating due to speed and animation is not aligned")
function mapStepping(o,done){const w=WALKED.get(o)||0,s=STILL.get(o),now=performance.now();if(!s||s.w!==w){STILL.set(o,{w,t:now});return !!s&&!done}return !done&&now-s.t<STILL_MS}
const stepOf=(o,stride,n=WALK.n)=>mapStepping(o)?frameOf(o,stride,n):0;
// (your band at its goal, or with none and nothing to chase: its head where world.js stops it, march.js marchAim)
function atGoal(){if(G.chase)return false;if(P.tx==null)return true;const a=marchAim(P.tx,P.ty);return Math.hypot(a.x-P.x,a.y-P.y)<2}
/* the world map at the screen's scale (core.js VS): the camera follows you to 1/VS of a game pixel (G.cam, what a click adds to),
   so the whole map glides a device pixel at a time and your band stays still in the middle. What stands is drawn in game pixels
   on the camera's whole pixels (drawWorld: memCv), so it keeps to the map's grid; whoever moves is drawn at his own place to
   1/VS px (subT), his parts (followers, banner, shadow) in whole game pixels round it; no picture is ever resampled */
const snapV=v=>Math.round(v*VS)/VS;
// (what a mover's drawing, in whole game pixels from his place rounded, is moved by: his place to 1/VS px; called first in his
// drawing (worldOverdraw holds the context round it: drawMover), his queued labels and lights follow)
let SUBD=null;
const subOf=o=>[snapV(o.x)-Math.round(o.x),snapV(o.y)-Math.round(o.y)];
function subT(o){if(VS<=1)return;const d=subOf(o);if(!d[0]&&!d[1])return;ctx.translate(d[0],d[1]);SUBD=d}
function drawMover(e){if(VS<=1){e.f();return}const nt=TXTQ?TXTQ.length:0,nl=LIGHTQ.length;SUBD=null;ctx.save();try{e.f()}finally{ctx.restore()}
  const d=SUBD;SUBD=null;if(!d)return;if(TXTQ)for(let i=nt;i<TXTQ.length;i++){TXTQ[i][1]+=d[0];TXTQ[i][2]+=d[1]}for(let i=nl;i<LIGHTQ.length;i++){LIGHTQ[i].x+=d[0];LIGHTQ[i].y+=d[1]}}
/* the parties' tags over their armies (the owner, 2026-11-01: "remove a floating banner, show the banner detail only when you
   inspect them along with the detail window": no banner flies over an army, its banner is on its card: ui.js tipFlag). Each over
   its army's middle (armyHome), BANNER_GAP px over its leader's head's height (headY): its label (a party's size and its stance
   against you, as before), the eye watching you just right of it; your badges over you (heroTagAt). Queued (BANNERQ) as each
   party in sight is drawn, so a party out of sight or sheltering shows none, and drawn after everyone and every tree
   (drawBanners), with a beast pack's marker and the one banner still standing: yours, planted on a pole in your camp
   (supply.js campPole) */
const BANNER_GAP=2;let BANNERQ=[];
const BAND_MARKERS=new Map();
function bandMarkerSprite(col){let s=BAND_MARKERS.get(col);if(!s){s=mkc(9,11,g=>{rect(g,col,0,0,9,9);rect(g,'#211b16',1,1,7,7);for(const [x,y] of [[2,3],[4,2],[6,3]])rect(g,'#efe2bb',x,y);rect(g,'#efe2bb',3,5,3,2);rect(g,col,4,9,1,2)});BAND_MARKERS.set(col,s)}return s}
// Shared marker bounds include its native-resolution count, so nearby indicators leave both visible.
function bandMarkerAt(o,m,cam){
  const s=bandMarkerSprite(m.col),x=snapV(o.x)-cam.x-4,y=snapV(o.y)-cam.y-m.h-BANNER_GAP-s.height,// (to the screen's own pixel, as the band under it: snapV)
    n=o.fighters??o.n;
  const count=n>1?mapTxtPic(String(n),m.col,'center',VS,dprOf()):null,right=Math.max(x+s.width,count?x+4+(count.width-count.ox+1)/VS:x+s.width);
  return{s,x,y,top:y,right};
}
// (where a party's army stands, its tag over it (the owner, 2026-10-31: "locked to the army's ring"): the point its rings are
// drawn on (world/march.js marchCircle: the middle its men make, MarchArmy mid, while it is within the ring), so tag and rings go
// together; else the party. The ring's radius worked out once a step of its men (when its middle moves): ARMY_HOME)
const ARMY_HOME=new WeakMap();
// (menCentre: the army is where its men are, its point written by its last step; put elsewhere since (a battle's end, the game
// paused) its men's middle as they stand: march.js MarchArmy#centre)
// (an army's label and banner over its men themselves (the owner, 2026-11-08: "recheck whether all sprites is in the center"): the
// middle of them across (a middle man: a column's middle, one part of a split army, never the empty ground between), over the
// topmost of those within near px of it (his feet: the label stands a head over them, armyTagAt); as smooth as they walk, no
// easing; its point otherwise (marching, the front of its column: the label stood over its first man)
const ARMY_TAG={on:true,near:40};
function armyMen(o,a){const L=a.units.filter(u=>!u.dead),X=L.map(u=>u.x).sort((p,q)=>p-q),n=X.length,x=X[(n-1)>>1];let y=Infinity;
  for(const u of L)if(Math.abs(u.x-x)<=ARMY_TAG.near&&u.y<y)y=u.y;if(y===Infinity)for(const u of L)if(u.y<y)y=u.y;return{x,y}}
function armyHome(o){const a=WORLD_BATTLE.on&&MARCH_ARMIES.get(o);if(ARMY_TAG.on&&a&&a.units.some(u=>!u.dead)&&Math.hypot(o.x-a.x,o.y-a.y)<=MARCH_MOVE.teleport)return armyMen(o,a);
  if(a&&MARCH_MOVE.menCentre&&a.units.some(u=>!u.dead)&&Math.hypot(o.x-a.x,o.y-a.y)<=MARCH_MOVE.teleport)return o.x===a.wx&&o.y===a.wy?o:a.centre();
  const m=a&&a.mid;if(!m)return o;let h=ARMY_HOME.get(a);if(!h||h.m!==m)ARMY_HOME.set(a,h={m,r:marchOuter(o)});return Math.hypot(m.x-o.x,m.y-o.y)<h.r?m:o}
// (a party's tag on the screen (cam): x, y its label's middle and foot, top and right its label's, where the eye watching you
// stands; label: [text, colour] or none)
function armyTagAt(o,label,cam){const c=armyHome(o),d=VS>1?subOf(c):[0,0],x=Math.round(c.x)-cam.x+d[0],y=o.headY()+Math.round(c.y)-Math.round(o.y)-BANNER_GAP-cam.y+d[1];
  const pic=label&&mapTxtPic(label[0],label[1],'center',VS,dprOf());return{c,x,y,top:pic?y-pic.oy/VS:y,right:pic?x+(pic.width-pic.ox+1)/VS:x+4}}
// (over your hero (the owner, 2026-11-01: the badges that stood by your banner): the eye watching you centred over his figure's
// head (marched, your army's carrier, march.js; else your tag), x, y its top left; your badges (cover, then pace) in a row just
// right of it, their feet level with its foot (bottom); screen px, a fixed size on the screen whatever the zoom: k)
function heroTagAt(cam){const a=marchPicked(P),u=a&&a.carrier&&!a.carrier.dead?a.carrier:null,t=u?{x:snapV(u.x)-cam.x,y:snapV(u.y)+a.figure(u)[1]-cam.y}:armyTagAt(P,null,cam);
  const k=dprOf()/VS,w=STEALTH_EYE.player*k,h=w*2/3;return{x:t.x-w/2,y:t.y-h-2*k,right:t.x+w/2,bottom:t.y-2*k,k}}
// (a banner planted on a pole, your camp's (supply.js campPole), standing over o; null for what flies none (a site's banner()
// is its camp flag's colour, structures.js); c: the point it stands over)
function bannerAt(o,f){const b=o.banner&&o.banner();if(!b||typeof b!=='object')return null;const s=bannerSprite(b,f),c=armyHome(o);return{s,c,x:Math.round(c.x)-s.px,y:o.headY()+Math.round(c.y)-Math.round(o.y)-BANNER_GAP-s.py}}
// Travel cover reduces detection distance; this is the same closed-eye badge used by battle concealment.
const TRAVEL_HIDE={size:14,gap:4,s:null};
function drawTravelConcealment(cam){
  if(B||P.stay||!hiddenAt(P.x,P.y))return null;
  const e=heroTagAt(cam),k=e.k,size=TRAVEL_HIDE.size*k,x=e.right+TRAVEL_HIDE.gap*k,y=e.bottom-size;
  const s=TRAVEL_HIDE.s||(TRAVEL_HIDE.s=mkc(9,9,g=>{for(const [x,y,c] of badgePx('hidden'))rect(g,c,x,y)}));
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(s,snapV(x),snapV(y),size,size);ctx.restore();return{x,y,w:size,h:size};
}
// (both badges put to the screen's own pixel (snapV), as the figure under them and the eye beside them are (the owner, 2026-11-08:
// "the moving icon seems to not smooth attach to the army"): rounded to whole game px, they stepped a game px at a time, several
// screen px on a phone, while the army glided under them)
// Pace shares the battle unit cards' walk/run badges, in a row after travel concealment.
const TRAVEL_PACE={size:14,gap:4,cache:new Map()};
function drawTravelPace(cam){
  if(B||P.stay||P.camp||!(P.tx!=null||G.chase||G.follow))return null;
  const e=heroTagAt(cam),kind='walk',k=e.k,size=TRAVEL_PACE.size*k,x=e.right+(TRAVEL_PACE.gap+(hiddenAt(P.x,P.y)?TRAVEL_HIDE.size+3:0))*k,y=e.bottom-size;
  let s=TRAVEL_PACE.cache.get(kind);if(!s){s=mkc(9,9,g=>{for(const [x,y,c] of badgePx(kind))rect(g,c,x,y)});TRAVEL_PACE.cache.set(kind,s)}
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(s,snapV(x),snapV(y),size,size);ctx.restore();return{x,y,w:size,h:size,kind};
}
const STEALTH_EYE={size:18,player:18,gap:4,cache:new Map()};
function stealthEyeSprite(exposure,col,width=18){
  const level=Math.round(clamp(exposure,0,1)*4),unit=Math.max(1,Math.round(width/18)),key=level+':'+col+':'+unit;let s=STEALTH_EYE.cache.get(key);if(s)return s;
  // Opaque pixel strokes only. Integer-sized blocks avoid soft curves and uneven mobile resampling.
  s=mkc(18*unit,12*unit,g=>{
    const lid=x=>5-Math.round(level*.75*(1-Math.pow((x-8.5)/6.5,2))),box=(col,x,y,w,h)=>{g.fillStyle=col;g.fillRect(x*unit,y*unit,w*unit,h*unit)};
    for(let x=2;x<16;x++){const top=lid(x);box('#141210',x-1,top-1,3,14-top*2)}
    for(let x=2;x<16;x++){const top=lid(x),bottom=11-top;box('#211c18',x,top,1,bottom-top+1);box(col,x,top,1,1);box(col,x,bottom,1,1)}
    if(level){const r=level===4?2:1;for(let y=6-r;y<6+r;y++)for(let x=9-r;x<9+r;x++)if(r===1||!(Math.abs(x-8.5)>1&&Math.abs(y-5.5)>1))box(col,x,y,1,1)}
  });
  STEALTH_EYE.cache.set(key,s);return s;
}
// Keep each art pixel an integer-sized block at the display density, aligned to physical pixels.
function drawStealthEye(exposure,col,x,y,size){
  const s=stealthEyeSprite(exposure,col,size*dprOf());
  ctx.drawImage(s,Math.round(x*VS)/VS,Math.round(y*VS)/VS,s.width/VS,s.height/VS);
}
// (drawn only: worked out again at most every DETECT_DRAW ms of real time, not each frame; afresh after TravelAwareness.reset)
const DETECT_DRAW=100;let DETECT_LAST=null;
function travelDetectionState(){const now=performance.now();const gen=TravelAwareness.gen;if(DETECT_LAST&&DETECT_LAST.gen===gen&&now-DETECT_LAST.at<DETECT_DRAW)return DETECT_LAST.v;const v=travelDetectionNow();DETECT_LAST={at:now,gen,v};return v}
function travelDetectionNow(){
  const rows=[];for(const o of travelObservers()){const d=travelDetection(o);if(d)rows.push(d)}
  const seen=rows.filter(d=>d.sees),exposure=Math.max(0,...rows.map(d=>d.exposure));return{rows,seen,exposure,danger:seen.some(d=>d.danger)};
}
const travelDetectionColor=state=>state.seen.length?state.danger?'#ef8c73':'#dbca91':state.exposure?'#d9ad57':'#82c6b3';
function drawTravelDetection(cam){
  if(B||P.stay)return null;const state=travelDetectionState(),k=dprOf()/VS,V=vis(),markers=new Map(BANNERQ.filter(q=>q.marker).map(q=>[q.o,bandMarkerAt(q.o,q.marker,cam)])),labels=new Map(BANNERQ.map(q=>[q.o,q.label]));ctx.save();ctx.imageSmoothingEnabled=false;
  for(const d of state.rows){const o=d.o;if(!inSight(o.x,o.y)||!o.inView(V))continue;const m=markers.get(o)||o instanceof Party&&armyTagAt(o,labels.get(o),cam),w=STEALTH_EYE.size*k,h=w*2/3,x=m?m.right+STEALTH_EYE.gap*k:o.x-cam.x-w/2,y=m?m.top:o.y-cam.y-18-h;
    drawStealthEye(d.exposure,d.sees?d.danger?'#ef8c73':'#dbca91':d.exposure?'#d9ad57':'#8f9e94',x,y,STEALTH_EYE.size);
    const q=!d.sees&&TravelSearch.of(o);if(q&&inSight(q.x,q.y))drawStealthEye(0,'#d9ad57',q.x-cam.x-w/2,q.y-cam.y-h/2,STEALTH_EYE.size);// (searching: an eye shut on where it last saw you)
  }
  const e=heroTagAt(cam);drawStealthEye(state.exposure,travelDetectionColor(state),e.x,e.y,STEALTH_EYE.player);ctx.restore();
  return state;
}
// (what is queued over all: a pack's marker and its count; a party's label (armyTagAt); a banner planted on a pole, fluttering in
// real time, still under reducedMotion (vfx.js), the only one drawn on the map: not a party's (a WorldObject), whose is on its card)
function drawBanners(cam){const now=performance.now(),still=reducedMotion(),mine=q=>q.o===P||q.o.faction==='player'?1:0;
  BANNERQ.sort((a,b)=>mine(a)-mine(b)||a.o.y-b.o.y);
  for(const q of BANNERQ){if(q.marker){if(!inSight(q.o.x,q.o.y))continue;const m=q.marker,r=bandMarkerAt(q.o,m,cam);ctx.drawImage(r.s,r.x,r.y);const n=q.o.fighters??q.o.n;if(n>1)txt(String(n),r.x+4,r.y-3,m.col,'center');continue}
    if(q.o instanceof WorldObject){if(q.label){const t=armyTagAt(q.o,null,cam);txt(q.label[0],t.x,t.y,q.label[1],'center')}continue}
    const B=bannerAt(q.o,still?0:Math.floor(now/420+q.o.x*.13)%2);if(B){const d=VS>1?subOf(B.c):[0,0];ctx.drawImage(B.s,B.x-cam.x+d[0],B.y-cam.y+d[1])}}
  BANNERQ=[]}
// (an animal's step on the map, ms a frame)
const D_STEP=150;
// the tile grid over the view: a line along every tile edge from (x0, y0) for w by h world pixels, drawn offset by (ox, oy),
// px thick (one screen pixel whatever the zoom)
function drawGrid(x0,y0,w,h,ox,oy,px){
  ctx.fillStyle='rgba(12,10,8,.3)';
  for(let x=Math.ceil(x0/TILE)*TILE;x<x0+w;x+=TILE)ctx.fillRect(x-ox,y0-oy,px,h);
  for(let y=Math.ceil(y0/TILE)*TILE;y<y0+h;y+=TILE)ctx.fillRect(x0-ox,y-oy,w,px);
}
// how dark it is (0 day … 1 night): dusk over the first tenth of the night, full dark, then dawn over its last tenth
// a picture redrawn once at the size it is shown, so the screen never scales it (true pixels); kept until the source changes
function atSize(c,w,h){if(c._at&&c._at.width===w&&c._at.height===h)return c._at;return c._at=mkc(w,h,g=>g.drawImage(c,0,0,w,h))}
function darkness(){return Clock.darkness()}// (clock.js)
const timeOfDay=()=>Clock.part();// (clock.js)
// which way a lord, band or beast faces: the way it is going; standing still, the way it last went (at first, toward you); in a
// fight, toward its foe (fights.js sets dir). Kept per mover between frames, not saved
const FACE=new WeakMap();
// lights in the dark (torches): {x, y, r} in screen pixels, queued while drawing and lit over the night
let LIGHTQ=[];
// the scene of buildings, camps and sites, before anyone is drawn over it, in game pixels on the camera's whole pixels (a pixel
// more each way, for the camera's fraction): drawn onto the screen, and what you remember of the land outside your sight
let MEM=null;const memCv=()=>MEM&&MEM.width===VW+1&&MEM.height===VH+1?MEM:(MEM=mkc(VW+1,VH+1,()=>{}));
let OVR=null;const overCv=()=>OVR&&OVR.width===VW+1&&OVR.height===VH+1?OVR:(OVR=mkc(VW+1,VH+1,()=>{}));
// the minimap's layers, bottom first, by what each thing is (mapKind): the holdings, then the sites, the beasts, the parties and
// the caravans and the encounters on the road over them; a kind not here is not dotted
const MAP_LAYER={town:0,site:1,monster:2,lord:3,band:3,patrol:3,cparty:3,caravan:4,road:4};
/* the minimap's dots, layer by layer (MAP_LAYER), each layer in worldObjects' order: fn(o, its mapDot) for each with one. The
   holdings, sites and the encounters on the road from their lists; the beasts, parties and caravans dot only in your sight, so
   they come from the chunk grid round you (worldobject.js lodGrid, with its lag), never from every mover on the map, sorted */
const MAP_NEAR=[];
function mapDots(V,fn){const T=LOD_TAG,G=lodGrid(),L=MAP_NEAR,r=V+WORLD_LOD.lag,each=o=>{if(!(o.mapKind in MAP_LAYER))return;const d=o.mapDot(V);if(d)fn(o,d)};
  for(const t of TOWNS)each(t);for(const s of W.sites)each(s);
  L.length=0;G.box(P.x-r,P.y-r,P.x+r,P.y+r,L);
  for(const o of L)if(G.tag.get(o)===T.monster)each(o);
  for(const o of L)if(G.tag.get(o)<=T.cparty&&!o.dead)each(o);
  for(const o of L)if(G.tag.get(o)===T.caravan)each(o);
  for(const o of roadList())each(o)}
// the two minimaps' frame: the management windows' brown and gold, outside their unchanged map and hit rectangles
const MAP_FRAME={bg:'#141116',edge:'#967744',light:'#c9a24e',view:'#e7d7b3',muted:'#b5a88e'};
function drawMapFrame(r){ctx.save();ctx.fillStyle=MAP_FRAME.edge;ctx.fillRect(r.x-2,r.y-2,r.w+4,r.h+4);
  ctx.fillStyle=MAP_FRAME.light;ctx.fillRect(r.x-2,r.y-2,r.w+4,1);ctx.fillStyle=MAP_FRAME.bg;ctx.fillRect(r.x-1,r.y-1,r.w+2,r.h+2);ctx.restore()}
// the minimap's rectangle on the screen, in game pixels: the top right corner, 112 wide at any map size, the same size on the
// screen at any map zoom (zk, core.js MAPZOOM); s: its pixels a tile (drawWorld draws it here, the full map's tap reads it)
function worldMiniRect(){const zk=MAPZOOM.k(),s=112*zk/MW,w=Math.round(MW*s),h=Math.round(MH*s);return{x:VW-w-Math.round(6*zk),y:Math.round(6*zk),w,h,s}}
const faceDir=o=>{let f=FACE.get(o);if(!f)FACE.set(o,f={x:o.x,d:o.x>P.x?-1:1});if(Math.abs(o.x-f.x)>.05){f.d=o.x>f.x?1:-1;f.x=o.x}return o.fight&&o.dir?o.dir:f.d};
/* the map's camera following your army (the owner, 2026-11-02: on a short walk "the camera will snap"): not locked on its point,
   which starts and stops with your men, but eased after it: within dead px of the screen's middle it stands still (a few steps
   move no map), past that it glides on over ease s (real time) to keep it so near; a leap of more than snap px (a gate, a load, a
   battle's end) is gone to at once. on false, or the tests' fixed view (FIXED_VIEW) unless a test asks (force): locked, as before.
   Drawn only: the camera is the frame's, never the world's */
const CAM_FOLLOW={on:true,force:false,dead:6,ease:.25,snap:120,x:NaN,y:NaN,t:0,out:{x:0,y:0}};
function camFollow(px,py){const F=CAM_FOLLOW,o=F.out,now=performance.now()/1000,dt=Math.min(.1,Math.max(0,now-F.t));F.t=now;
  if(!F.on||FIXED_VIEW&&!F.force||!(Math.abs(F.x-px)<F.snap&&Math.abs(F.y-py)<F.snap)){F.x=px;F.y=py}
  else{const dx=px-F.x,dy=py-F.y,d=Math.hypot(dx,dy);if(d>F.dead){const k=1-Math.exp(-dt/F.ease),m=(d-F.dead)*k;F.x+=dx/d*m;F.y+=dy/d*m}}
  o.x=F.x;o.y=F.y;return o}
function drawWorld(){
  // (the camera to 1/VS px: G.cam; cam its whole pixels, the rest (fx, fy) the shift of everything drawn on the screen)
  reveal();FIGURES.frame();const V=vis(),C=G.cam;if(!B?.world){const F=camFollow(P.x,P.y);C.x=snapV(clamp(F.x-VW/2,0,MW*TILE-VW));C.y=snapV(clamp(F.y-VH/2,0,MH*TILE-VH));}
  const cam={x:Math.floor(C.x),y:Math.floor(C.y)},fx=C.x-cam.x,fy=C.y-cam.y,scr=ctx,low=memCv(),hi=VS>1,ents=[];let nPlace=0;
  // what stands, into the scene in game pixels (memCv: its extra pixel each way counted in VW, VH while it is drawn)
  ctx=low.getContext('2d', { willReadFrequently: true });ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,low.width,low.height);if(hi){VW++;VH++}// (its transform reset each frame: nothing drawn into it can leave a shift that piles up)
  try{
  WorldArt.draw(ctx,cam);// (the painted map by chunks, those in view: worldart.js)
  drawEnv(cam,V,0);drawLand(cam,'tint');drawTracks(cam);drawEstates(cam,V);
  // each thing on the map draws itself onto the frame's list (WorldObject draw), in the order they always went (two as deep stay
  // in it): the sites, the parties, the beasts, the herds, you, then the workers, caravans, ships, refugees, the encounters on
  // the road (road.js) and fights
  for(const s of W.sites)s.draw(ents,cam,V);
  // the holdings (and their estates) are drawn as their placed buildings (lotEnts, called with the estates below)
  drawParties(ents,cam,V);// lords, bands, patrols and your companions' parties (each party draws itself: parties.js)
  for(const m of W.monsters)asMonster(m).draw(ents,cam,V);
  drawHerds(ents,cam,V);// (a pasture's herd: one animal on each worked field tile; the rest as herds: critters.js)
  // (your siege camp, raid and camp: not while a battle is fought on the map round you (B.world): its men stand there instead)
  if(P.raid&&!B?.world)ents.push({y:P.y-1,f:()=>{subT(P);txt('Raiding '+Math.round(P.raid.t/RAID_TIME*100)+'%',Math.round(P.x-cam.x),Math.round(P.y-20-cam.y),'#ff9a90','center')}});
  if(P.siege&&!B?.world)ents.push({y:P.y-1,f:()=>{subT(P);const s=campSprite(77,'bandit'),X=Math.round(P.x-24-s.ax-cam.x),Y=Math.round(P.y+2-s.ay-cam.y);ctx.globalAlpha=SHADOW.a;ctx.drawImage(s.sh,X,Y);ctx.globalAlpha=1;ctx.drawImage(s,X,Y);drawFire(X+s.fire[0],Y+s.fire[1],0);drawFlag(P.banner(),X+s.flag[0],Y+s.flag[1],0);txt('Siege day '+P.siege.days,Math.round(P.x-cam.x),Math.round(P.y-18-cam.y),'#e8b94a','center')}});
  if(P.camp&&!B?.world){if(WORLD_BATTLE.on)marchCircle(ents,P,cam);ents.push(bandCampEnt(cam));}// (your camp's tents, fire and banner in your place, by their feet among the trees as everyone is: world/supply.js)
  // (you, not while you camp: on foot, a step each WALK.foot px you walk; mounted, your horse on the same feet, a step each WALK.ride px; your host behind, as a lord's: drawParties)
  // (marching: you are one of your army, in your own place in it: march.js)
  if(!P.stay&&!P.camp&&!B?.world){if(WORLD_BATTLE.on){marchDraw(ents,P,cam)}
    else ents.push({y:P.y,own:1,f:()=>{subT(P);const sx=Math.round(P.x-cam.x),sy=Math.round(P.y-cam.y),m=mountDef(),go=mapStepping(P,atGoal()),s=partySprite('#e8b94a',m?m.col:'',go?frameOf(P,m?WALK.ride:WALK.foot,WALK.n):0);
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(sx-(m?6:3),sy-1,m?12:6,2);drawHost(partySize(),'#3d74d6',sx-(m?P.dir*4:0),sy+2,P.dir,go?WALKED.get(P)||0:null,5,P.race);ctx.save();ctx.translate(sx,sy-10);ctx.scale(P.dir,1);ctx.drawImage(s,-(s.width>>1),13-s.height);ctx.restore()}}); }
  drawFolk(ents,cam,V);drawCaravans(ents,cam,V);drawShips(ents,cam,V);drawRefugees(ents,cam,V);drawRoad(ents,cam,V);drawFights(ents,cam,V);
  ambientWorld(ents,cam,V);// (the birds, critters and butterflies on the ground, with everyone; the rest stepped: ambient.js)
  // the order: the ground (the chunks: their trees, woods and ranges painted in), what lies flat (fields, yards, borders), the
  // shadows of what is built (one pass), the buildings, moored boats, camps and sites (in their own order, by their feet), then everyone who moves by their feet, each with
  // what stands in front of him drawn again over him (depth.js worldOverdraw; whoever flies, after them all); then the clouds,
  // smoke and weather, the fog, the night and its lights, the way you walk, and over it all the banners and every label, the
  // quest marks, your goal and the pointer's brackets (worldui.js), and the minimap
  TXTQ=[];TXTQ.ctx=scr;TXTQ.lo=ctx;LIGHTQ=[];BANNERQ=[];WDEPTH.pics.length=0;const bents=[];estateEnts(bents,cam,V);for(const e of ents.filter(e=>e.st))bents.push(e);
  drawShadows(bents);bents.sort((a,b)=>a.y-b.y).forEach(e=>e.f());// (their shadows first, in one pass: structures.js)
  drawLand(cam,'line');// (the borders over all that stands and the water's glints, under everyone who moves: territory.js)
  nPlace=TXTQ.length}finally{ctx=scr;if(hi){VW--;VH--}}
  // onto the screen, shifted by the camera's fraction, as is everything over it up to the minimap
  ctx.drawImage(low,-fx,-fy);ctx.save();ctx.translate(-fx,-fy);
  // fog of war: keep the scene of structures, draw everyone, then put the remembered scene back over all but your sight, so
  // nothing that moves shows outside it; labels likewise (a place's, where you know the land; anyone's, only in your sight)
  ambientFlat(cam);worldOverdraw(ents.filter(e=>!e.st).sort((a,b)=>a.y-b.y),cam);ambientAir(cam);// (the splashes and the flyers' shadows under everyone, the flyers over them: ambient.js)
  // (at the screen's finer scale the remembered scene, the clouds and weather and the fog are laid in game pixels, as ever, into
  // one more picture the scene's size (overCv), drawn up in one step: three full screens' work made one)
  const ov=hi?overCv():null;if(ov){ctx=ov.getContext('2d', { willReadFrequently: true });ctx.clearRect(0,0,ov.width,ov.height)}
  try{
  fogMem(low,cam,V);
  drawEnv(cam,V,1);
  // the weather where you are (gfx/weather.js; in a battle on the map, over the field instead: drawBattle), under the fog: seen
  // where you see, dim where you remember, none on land you have never seen (the owner, 2026-11-08)
  if(!B?.world)WeatherArt.draw(ambWeather(),VW+1,VH+1,Weather.strength(P.x,P.y));
  // fog and night: the land you remember, outside your sight, lies dim; land you have never seen is dark (fog.js)
  drawWorldFog(cam,V);
  }finally{ctx=scr}if(ov)ctx.drawImage(ov,0,0);
  // the tile grid and a building being placed lie over the fog
  if(GRID.on||G.place)drawGrid(cam.x,cam.y,VW+1,VH+1,cam.x,cam.y,1);
  if(G.place)drawPlace(cam);
  const a=darkness();
  if(a>0){ctx.fillStyle='rgba(10,14,50,'+(a*.34).toFixed(3)+')';ctx.fillRect(0,0,VW+1,VH+1)}
  // torchlight: a warm glow over the dark, pulsing unevenly, its pool on the ground; light only, each fire draws its own flame
  // (fire.js fireLights). FLAMES off: as it was, a round glow and a small flame of its own, flickering
  if(FLAMES.on)fireLights(cam,a);
  else{const now=performance.now();for(const L of LIGHTQ){if(!inSight(L.x+cam.x,L.y+cam.y))continue;const r=L.r*(1+.06*Math.sin(now/90+L.x)),g=ctx.createRadialGradient(L.x,L.y,1,L.x,L.y,r);g.addColorStop(0,'rgba(255,190,90,'+(.12+.28*a).toFixed(3)+')');g.addColorStop(1,'rgba(255,150,60,0)');
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(L.x-r,L.y-r,2*r,2*r);ctx.restore();const f=Math.floor(now/120+L.x)%2;rect(ctx,'#e8803a',L.x-1+f,L.y-2,2,2);rect(ctx,'#ffe090',L.x,L.y-1-f,1,1)}}
  ambientGlow(cam);// (the fireflies' light: ambient.js)
  wuiUnder(cam);// (the way you walk, your goal's ring, a click's ripple, the ring round what you chase: worldui.js)
  WildHunt.drawArea(cam);
  drawTravelConcealment(cam);
  drawTravelPace(cam);
  drawTravelDetection(cam);
  drawBanners(cam);// (the parties' labels and the packs' markers, over all, their counts queued with the rest)
  // Queued names and counts use native-resolution text; their world anchors and visibility stay the same.
  const q=TXTQ;TXTQ=null;q.forEach((a,i)=>{const wx=a[1]+cam.x,wy=a[2]+cam.y;if(i<nPlace?seenAt(wx,wy+6):inSight(wx,wy+8))mapTxt(...a)});
  drawQuestMarks(cam);drawRumourMarks(cam);// (the quests' marks, then the rumours' faint "?": news.js)
  wuiOver(cam);// (your goal's arrow, the arrow over what you chase, the brackets round what the pointer is on: worldui.js)
  ctx.restore();
  // minimap (the land from the tile data, a pixel per k tiles: worldart.js WorldArt.mini, k = ceil(MW / 256); where it lies on the
  // screen: worldMiniRect)
  const zk=MAPZOOM.k(),{x:mx,y:my,w:mw,h:mh,s:MS}=worldMiniRect(),mk=Math.ceil(MW/256),dot=(x,y,col,s)=>{s=Math.max(1,Math.round(s*zk));rect(ctx,col,mx+Math.floor(x/TILE*MS)-(s>>1),my+Math.floor(y/TILE*MS)-(s>>1),s,s)};
  drawMapFrame({x:mx,y:my,w:mw,h:mh});ctx.drawImage(atSize(WorldArt.mini(mk),mw,mh),mx,my);ctx.globalAlpha=.4;ctx.drawImage(atSize(landMiniCv(),mw,mh),mx,my);ctx.globalAlpha=1;ctx.drawImage(atSize(fogMiniCv(),mw,mh),mx,my);
  // each its own dot (WorldObject mapDot), layer by layer (MAP_LAYER; in a layer, as worldObjects lists them): the holdings and
  // sites you know of, then the beasts, parties and caravans in sight over them
  // (the holdings' walls and fences you have seen: each ring's outline, world/townwalls.js)
  ctx.lineWidth=1;for(const t of TOWNS){const r=TownWall.of(t);if(!r||!r.parts.some(q=>seenTile(q.x,q.y)))continue;ctx.strokeStyle=TownWall.mapCol(t);ctx.beginPath();TownWall.outline(r).forEach(([x,y],k)=>{const px=Math.round(mx+(x+.5)*MS)+.5,py=Math.round(my+(y+.5)*MS)+.5;if(k)ctx.lineTo(px,py);else ctx.moveTo(px,py)});ctx.closePath();ctx.stroke()}
  mapDots(V,(o,d)=>{if(!B?.world?.hides(o))dot(o.x,o.y,d[0],d[1])});
  drawQuestDots(dot);// (the quests' goals, the tracked one the strongest: world/quests.js)
  for(const m of rumourMarks())if(rumourFade(m)>0)dot(m.x,m.y,RUMOUR_COL,2);
  if(B?.world){for(const u of B.units)if(u.hp>0&&seenBy(0,u)){const p=B.world.world(u);dot(p.x,p.y,u.hero?'#fff':sideCol(u,'ui'),u.hero?3:1)}}else dot(P.x,P.y,'#fff',3);
}
// how long a unit holds its attack pose after it strikes
const ATK_ANIM=.36;
// the body's small life (drawUnit): a flinch for flinch s after a blow; standing (the owner, 2026-10-31: "idle animation for
// sprites", breathing and fidgets), every 1/idle s a glance back (look of it) and the weight shifted (shift of it) on foot, a
// horse tossing its head (toss of it: a px start forward), a beast swaying (sway px each swayT s); never the whole body lifted (the
// owner: a breathing bob made them look to float). From his id and the clock, drawn only: the map's marchers too (drawMarcher)
const BODY_LIFE={flinch:.16,idle:.11,look:.07,shift:.08,toss:.06,sway:1,swayT:3.1};
// (standing: kind foot, mount or beast; t its clock) its pose (a glance, a shift: null, his own), and its offset
function idleLife(id,t,kind){const L=BODY_LIFE,i=id||0,ph=(t*L.idle+i*.618)%1;
  return{pose:kind!=='foot'?null:ph<L.look?LOOK_POSE:ph>.5&&ph<.5+L.shift?SHIFT_POSE:null,dx:kind==='mount'&&ph>.25&&ph<.25+L.toss?1:kind==='beast'?Math.round(L.sway*Math.sin((t+i)*6.283/L.swayT)):0}}
// the box a picture's drawn pixels fill, [x0, y0, x1, y1] (inclusive), worked out once per picture: what a label clears and a
// click answers on (world.js pickAt)
function opaqueBox(s){if(s._ob)return s._ob;const d=s.getContext('2d', { willReadFrequently: true }).getImageData(0,0,s.width,s.height).data;let x0=s.width,y0=s.height,x1=-1,y1=-1;
  for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++)if(d[(y*s.width+x)*4+3]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}return s._ob=x1<0?[0,0,0,0]:[x0,y0,x1,y1]}
// a party's leader as drawn (L: its look; f: the step, 0 to PEOPLE_STEPS-1): his picture, its cell's top left on the map and whether it faces
// left. The cell's bottom is 3 below his place (a rider in the same 16 cell: the same feet, his banner taller)
function partyFig(o,L,f){const s=WORLD_BATTLE.on?marchLeaderSprite(o,f):L.bandit?banditSprite(f):partySprite(L.col,L.rider==='horse'?C.horse:'',f,L.race);return{s,x:o.x-(s.width>>1),y:o.y+3-s.height,flip:L.dir<0}}
// (the rows above a leader's cell top his label clears: his highest pixel in either step, so it stands still as he walks)
const figTop=(L,o=P)=>Math.min(...[...Array(PEOPLE_STEPS).keys()].map(f=>{const s=partyFig(o,L,f).s;return 16-s.height+opaqueBox(s)[1]}));
// every party in sight, one way (Party.draw: its host, its leader's figure, a torch on a night watch, its label)
function drawParties(ents,cam,V){for(const o of W.parties)o.draw(ents,cam,V)}
/* the outline engine (the owner, 2026-11-06: "an outline for unit highlights, selections, or to focus"): any picture's ring of one
   pixel round its opaque pixels in a colour, kept by picture and colour (outlineOf: a canvas 2 px bigger, the ring alone); a unit's
   highlight (unitHighlight: selected, pointed at, a foe you point at) drawn as its rings round his body and his weapon under them, so
   it runs round his whole silhouette. HILITE: the colours */
const HILITE={sel:'#ffe08a',hover:'#ffffff',foe:'#ff6a5a'},OUTLINES=new WeakMap();
function outlineOf(pic,col){let m=OUTLINES.get(pic);if(!m)OUTLINES.set(pic,m=new Map());let c=m.get(col);if(c)return c;
  const w=pic.width,h=pic.height,a=pic.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data,on=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&a[(y*w+x)*4+3]>0;
  c=mkc(w+2,h+2,g=>{g.fillStyle=col;for(let y=-1;y<=h;y++)for(let x=-1;x<=w;x++)if(!on(x,y)&&(on(x-1,y)||on(x+1,y)||on(x,y-1)||on(x,y+1)))g.fillRect(x+1,y+1,1,1)});m.set(col,c);return c}
// (whom you have picked out: his group selected, his group under your pointer, a foe you point at and can see; null for none)
// (worked out once a frame, FIGURES' frame count, again if the selection or the pointer changes: the groups selected, your group
// under the pointer, the foe under it)
let HL_F=-1,HL_K=null,HL_S=null;
function hiliteNow(){const k=[B.sel,B.hov];if(HL_F===FIGURES.tick&&HL_S&&HL_K[0]===k[0]&&HL_K[1]===k[1])return HL_S;HL_F=FIGURES.tick;HL_K=k;const h=B.hov,m=h?rtsUnitAt(h.x,h.y,0):null,f=h&&!m?rtsUnitAt(h.x,h.y,1):null;return HL_S={sel:new Set(selGroups()),mine:m&&m.grp||null,foe:f}}
function unitHighlight(u){if(B.over||u.hp<=0)return null;const H=hiliteNow();if(u.grp&&H.sel.has(u.grp))return HILITE.sel;
  if(u.team===0)return H.mine&&H.mine===u.grp?sideKey(u)==='ally'?SIDE.ally.ui:HILITE.hover:null;
  const f=H.foe;return f&&(f.grp?f.grp===u.grp:f===u)&&seenBy(0,u)?HILITE.foe:null}
/* small without losing lines (the owner, 2026-11-07: "what's this?": zoomed out, at a scale of less than a screen pixel a sprite
   pixel, as the map's marchers and its battles draw their men (WORLD_BATTLE.sprite / scale), a 1-px shaft fell between the screen's
   pixels and the spearhead and the flag floated): the picture shrunk first, each pixel the opaque one nearest its block's middle, so
   a line a pixel thin is still whole, then drawn 1:1 (mapPic, kept by picture and scale; src: the picture it was made from). reduced(fn): fn's drawing so */
const MAP_PICS=new WeakMap();
function mapPic(img,e){let m=MAP_PICS.get(img);if(!m)MAP_PICS.set(img,m=new Map());const key=Math.round(e*1000);let c=m.get(key);if(c)return c;
  const w=img.width,h=img.height,W=Math.max(1,Math.ceil(w*e)),H=Math.max(1,Math.ceil(h*e)),d=img.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;
  c=mkc(W,H,g=>{const o=g.createImageData(W,H),D=o.data;for(let Y=0;Y<H;Y++)for(let X=0;X<W;X++){const x0=Math.floor(X/e),x1=Math.min(w,Math.ceil((X+1)/e)),y0=Math.floor(Y/e),y1=Math.min(h,Math.ceil((Y+1)/e)),cx=(X+.5)/e,cy=(Y+.5)/e;
      let best=-1,bd=1e9;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*w+x)*4;if(!d[i+3])continue;const dd=(x+.5-cx)**2+(y+.5-cy)**2;if(dd<bd){bd=dd;best=i}}
      if(best>=0){const j=(Y*W+X)*4;D[j]=d[best];D[j+1]=d[best+1];D[j+2]=d[best+2];D[j+3]=d[best+3]}}g.putImageData(o,0,0)});c.src=img;m.set(key,c);return c}
function reduced(fn){const c=ctx,d0=c.drawImage;c.drawImage=function(img,...a){if(a.length===2&&img&&img.getContext){const T=c.getTransform(),e=Math.hypot(T.a,T.b);if(e<.99&&e>.05)return d0.call(c,mapPic(img,e),a[0],a[1],img.width,img.height)}return d0.call(c,img,...a)};
  try{return fn()}finally{c.drawImage=d0}}
/* the hands on the grip (the owner, 2026-11-07: "hands that grip the shaft"): a doll's weapon drawn before him hid the hand that
   held it; his fist (GRIP_FIST: two pixels of his skin, lit over shaded) laid back over it at his hand, and a two-handed hold's
   far hand (hand2) on the shaft too */
const GRIP_FIST=new Map();
function drawGrip(sp,X,Y,L){if(!L||!dollable(L))return;const k=L.skin||'skin';let f=GRIP_FIST.get(k);if(!f){const P=pal(k);GRIP_FIST.set(k,f=mkc(1,2,g=>{g.fillStyle=P[0];g.fillRect(0,0,1,1);g.fillStyle=P[2];g.fillRect(0,1,1,1)}));f.fist=true}
  for(const h of [sp.hand,sp.hand2])if(h)ctx.drawImage(f,X+h[0],Y+h[1]-1)}
/* a bowman's bow, drawn apart (figures.js bowPic): his bow, if one; the frame's part in a shot (the loose and the draw aimed, the
   reload not); his aim, the shot's own launch angle at his mark (battle/projectiles.js arcRise: higher for a long shot or one up
   to higher ground, flatter for a near one or one down from above), the nearest of BOW_AIM.steps (degrees up) */
const bowOf=u=>{const w=unitLook(u).weapon;return w==='bow'||w==='longbow'?w:null};
const bowFrame=p=>p>=6&&p<=8?{style:'swing',atk:p-6,aim:true}:p>=9&&p<=11?{style:'thrust',atk:p-9,aim:true}:p>=12&&p<=14?{style:'overhead',atk:p-12,aim:false}:{style:null,atk:-1,aim:false};
function bowAim(u){const t=u.tgt;if(!t||t.hp<=0)return 0;const d=Math.hypot(t.x-u.x,t.y-u.y);if(d<1)return 0;
  // (by the throw's rise, uncapped, so a far shot keeps rising though its arc's height is capped; BOW_AIM.k how steeply: 45 degrees
  // only for a long shot)
  const dh=(levelAt(u.x,u.y)-levelAt(t.x,t.y))*(PX.ROCK_PX||4),rise=Math.max(ARC_RISE.min,d*d/ARC_RISE.d2-dh*ARC_RISE.lvl),deg=Math.min(45,Math.atan(BOW_AIM.k*rise/d)*180/Math.PI);
  return BOW_AIM.steps.reduce((b,s)=>Math.abs(s-deg)<Math.abs(b-deg)?s:b,0)}
function drawUnit(u){if(B.world)return reduced(()=>drawUnitAt(u));return drawUnitAt(u)}
function drawUnitAt(u){
  // (placed on the camera's pixels, not the field's: zoomed in, they glide instead of stepping)
  const q=camPx(),big=u.s.big?2:1,s=actorSprite(u),w=s.width,h=s.ch,x=Math.round(u.x*q)/q,y=Math.round(u.y*q)/q;
  if(B.world){const k=WORLD_BATTLE.sprite;ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.translate(-x,-y)}
  // (in a river (terrain.js groundAt; engine/ground.js paints it): deep water hides him to the waist, sunk 2 px, a ring of ripples
  // round him, its back half behind him; a ford wets his feet and splashes as he walks; a frozen ford (frost) is ice. From the
  // battle's time and his id: drawn only)
  const z=Math.round(u.z||0),ghost=u.hero&&B.hx&&B.hx.inv>0,wk=B.terrain&&!z?groundAt(u.x,u.y):0,deep=wk===4,ford=wk===3&&B.env.c!=='frost',rr=Math.round(5*big+1);
  if(deep)waterRing(x,y-2,rr,u,-1);else{const sh=1-Math.min(.5,(u.z||0)/32);ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(x,y,5.5*big*sh,1.8*big*sh,0,0,6.283);ctx.fill()}// (a soft shadow, smaller as he leaps)
  heroAura(u,x,y,big);stateAura(u,x,y,big);// (what lifts him, under his feet: vfx.js STATE_FX)
  const hit=u.hitAt!=null&&B.t-u.hitAt<.09;
  // (moving: a step in the last few frames, so a man who stops and starts as he settles does not flicker between standing and walking)
  // (stopped, those frames show the pass, his legs under him, not a stride frozen wide: the owner, "leg stuck before going to idle")
  // (knocked down: over, lying, up again, physics.js)
  const dq=physDownPose(u);if(dq!=null){drawDowned(u,x,y-z,dq);u.plx=u.x;u.ply=u.y}else{const distance=u.plx!=null?Math.hypot(u.x-u.plx,u.y-u.ply):0,step=distance>.02;{const dt=Math.max(0,B.t-(u.wpT??B.t));u.wpT=B.t;u.walkPhase=(u.walkPhase||0)+Math.min(distance/(WALK.foot*WALK.step*(B.world?B.world.scale:WALK.field)),dt*WALK.cap)}u.plx=u.x;u.ply=u.y;u.movF=step?6:Math.max(0,(u.movF||0)-(B.paused?0:1));if(!step&&u.movF>0&&!(Math.floor(u.walkPhase+(u.v||0))&1))u.walkPhase+=1;const moved=u.movF>0;const beast=!!(ST[u.type]&&ST[u.type].beast),cl=moved&&typeof climbState==='function'?climbState(u):null;let pose=beast?beastPose(u,moved):procPose(u,moved);
    // (on a hill's slope (the ground's climbState): walking or running up, bent forward on short slow steps; down, leaning on long ones)
    if(cl&&!beast&&((pose>=2&&pose<=5)||(pose>=15&&pose<=18)))pose=cl==='up'?19+Math.floor(B.t*5+(u.v||0))%4:23+Math.floor(B.t*9+(u.v||0))%4;
    // (rocked by a throw: leaning back from it, a step or two back, flinching; a mount rearing on its hocks: gfx/stagger.js)
    const rl=Stagger.reel(u);
    // (struck, a flinch; standing about, now and then a glance back or the weight shifted: from his id and the battle's time, drawn only)
    if(!beast&&!u.s.mounted&&!cl){if((u.hitAt!=null&&B.t-u.hitAt<BODY_LIFE.flinch||rl)&&(pose<6||pose>=15&&pose<=18))pose=FLINCH_POSE;else if(pose<2&&!moved){const ip=idleLife(u.id,B.t,'foot').pose;if(ip!=null)pose=ip}}
    // (a bowman on foot: his bow drawn apart, aimed up for a long shot or one to higher ground (figures.js bowPic, bowAim))
    const bowK=!beast&&!u.s.mounted&&!u.inMelee&&BOW_AIM.on?bowOf(u):null;
    const sp=beast?actorSprite(u,pose):actorSprite(u,pose,bowK?'bow':true,!!u.inMelee);
    // (a beast's blow: its pose, and a short lunge with it; its steps bob in its frames)
    let [bx,sa]=stateShake(u),bo=0;if(beast&&u.atkAt!=null&&B.t-u.atkAt<ATK_ANIM)bx=Math.round(2*Math.sin((B.t-u.atkAt)/ATK_ANIM*Math.PI))
    // (meeting a blow (battle/defence.js): turned to it; a dodge, a sway back on the spot, leaning away, or a step aside; a heavy
    // blow blocked, a step back; struck, a flinch back, a heavy wound a stagger; a blow of his own, a lunge into it (battle/duel.js))
    const dk=Defence.now(u),dp=dk?Math.sin((B.t-u.defAt)/DEFENCE.anim*Math.PI):0,side=dk==='dodge'&&u.defV==='side';
    if(dk==='dodge'&&!side)bx-=Math.round(2*dp);if(side)bo+=Math.round((u.id&1?2:-2)*dp);if(dk==='block'&&u.defV==='push')bx-=Math.round(2*dp);if(hit)bx-=1;
    const sg=u.stagAt!=null&&B.t-u.stagAt<.3?Math.sin((B.t-u.stagAt)/.3*Math.PI):0;if(sg)bx-=Math.round(2*sg);if(rl){bx+=rl.dx*Math.max(1,Math.round((sp.ch||sp.height)/20));bo+=rl.dy}
    if(!moved&&!dk&&!hit&&!sg&&!(u.atkAt!=null&&B.t-u.atkAt<ATK_ANIM)){const I=idleLife(u.id,B.t,beast?'beast':u.s.mounted?'mount':'foot');bx+=I.dx}// (standing: a horse's toss, a beast's sway)
    if(!beast&&DUEL.on&&u.atkLook&&u.atkAt!=null&&B.t-u.atkAt<ATK_ANIM)bx+=Math.round((u.atkLook==='bash'?2.5:1.5)*Math.sin((B.t-u.atkAt)/ATK_ANIM*Math.PI));
    ctx.save();ctx.translate(x,y-z+bo);if(deep||ford){const sk=deep?2:0;ctx.translate(0,sk);ctx.beginPath();ctx.rect(-64,-128,128,128-sk-(deep?2:0));ctx.clip()}if(spinFace(u,dk?u.defFace:u.face)<0)ctx.scale(-1,1);{const ln=physLeanDrawn(u,16)+(dk==='dodge'&&!side?-.18*dp:0)-.15*sg+(rl&&!u.s.mounted?rl.lean*Math.min(1,STAGGER.reel.leanPx/(STAGGER.reel.lean*(sp.ch||sp.height))):0);if(ln)ctx.transform(1,0,-ln,1,0,0)}if(rl&&u.s.mounted){const hk=-Math.round(sp.width*.22);ctx.translate(hk,0);ctx.rotate(rl.lean/STAGGER.reel.lean*STAGGER.reel.rear);ctx.translate(-hk,0)}/* (leaning into his run: physics.js) */ctx.globalAlpha=(ghost?.55:1)*sa;
    // (his weapon in his hand behind his body or in front of it: weapons.js heldNow, figures.js GEAR.behind)
    const X=-Math.floor(sp.width/2)+bx,Y=-sp.height+2,hw=!beast&&heldNow(u,u.inMelee?sidearmLook(u):unitLook(u),sp,pose);if(hw&&hw.back)ctx.drawImage(hit?whiteOf(hw.w):hw.w,X+hw.x,Y+hw.y);
    const fb=!beast&&battleFlag(u),fw=fb?battleWave(u,moved):0;if(fb)battleFlagBack(u,fb,sp,X,Y,fw);// (his army's flag: marchgear.js)
    // (picked out: his rings first, round his body and his weapon, the pictures over them: outlineOf)
    {const hl=unitHighlight(u);if(hl){ctx.drawImage(outlineOf(sp,hl),X-1,Y-1);if(hw)ctx.drawImage(outlineOf(hw.w,hl),X+hw.x-1,Y+hw.y-1);if(hw&&hw.back)ctx.drawImage(hw.w,X+hw.x,Y+hw.y)}}
    ctx.drawImage(hit?whiteOf(sp):statePic(u,sp),X,Y);if(bowK&&sp.hand){const f=bowFrame(pose),bp=bowPic(bowK,f.style,f.atk,f.aim?bowAim(u):0,pal(unitLook(u).skin)[1]);ctx.drawImage(hit?whiteOf(bp):bp,X+sp.hand[0]-bp.R,Y+sp.hand[1]-bp.R)}if(hw&&!hw.back){ctx.drawImage(hit?whiteOf(hw.w):hw.w,X+hw.x,Y+hw.y);if(!hit)drawGrip(sp,X,Y,unitLook(u))}if(fb)battleFlagFront(u,fb,hw,X,Y,fw);ctx.restore();
    // (climbing: a little grit trickles down the slope behind him now and then; coming down, a puff at the heel: from his id and the
    // battle's time, drawn only)
    if(cl){const ph=(B.t*(cl==='up'?2.2:3)+((u.id||0)*.37))%1,dc=B.env.c==='frost'?'#e8eef4':B.env.c==='desert'?'#e6cc96':'#a8987a';
      if(cl==='up'&&ph<.4){const f=u.face<0?1:-1;ctx.fillStyle=dc;ctx.fillRect(Math.round(x+f*3),Math.round(y+1+ph*10),1,1);ctx.fillStyle='#6e6252';ctx.fillRect(Math.round(x+f*5),Math.round(y+ph*7),1,1)}
      else if(cl==='down'&&ph<.25){ctx.fillStyle=dc;ctx.globalAlpha=.7;ctx.fillRect(Math.round(x-(u.face<0?-4:4)),Math.round(y-1),2,1);ctx.globalAlpha=1}}
    if(deep)waterRing(x,y-2,rr,u,1,moved);else if(ford){const ph=(B.t*3+(u.id||0)*.37)%1;ctx.fillStyle='rgba(232,242,240,.55)';ctx.fillRect(Math.round(x-rr+1),Math.round(y),2*rr-2,1);
      if(moved&&ph<.5){ctx.fillStyle='#e8f2f0';ctx.fillRect(Math.round(x-3),Math.round(y-1-ph*4),1,1);ctx.fillRect(Math.round(x+3),Math.round(y-ph*5),1,1);ctx.fillRect(Math.round(x+(u.face<0?4:-4)),Math.round(y),1,1)}}}// (his weapon in his hand: weapons.js)
  drawStuck(u,x,y-Math.round(u.z||0));// (arrows in him: vfx.js)
  stateAir(u,x,y-z,h);// (stars, sweat, a router's dust: vfx.js)
  drawMorale(u,x,y-h-z-3);// (running or wavering: ui/moraleicons.js)
  // its health: over every fighter with health bars on (Settings, or HP bars in battle; off at first), your hero, companions and
  // leaders too; else none (each group's health stands by its icon: battlehud.js drawGroupHealth)
  if(u.leader)txt(u.leader.name+' Lv'+u.leader.lv,x,y-h-8-z,sideCol(u,'say'),'center');// a leader: his name over him
  if(HPBARS.on){const bw=u.s.big?28:12,f=Math.max(0,u.hp/u.max),bx=Math.round(x-bw/2),by=y-h-2-z;ctx.fillStyle='#0a0c12';ctx.fillRect(bx-1,by-1,bw+2,4);ctx.fillStyle='#3a2420';ctx.fillRect(bx,by,bw,2);
    ctx.fillStyle=u.hero||u.comp?'#e8b94a':sideCol(u);ctx.fillRect(bx,by,Math.round(bw*f),2)}// (by side: battle.js SIDE)
  if(B.world)ctx.restore();
}
// one knocked down (physics.js physDownPose: q 0 standing to 1 lying): he goes over as the fallen do (vfx.js drawBody), lies, and
// gets up, his weapon still in his hand (sprites.js downedOf); a beast pressed low, then on its side
function drawDowned(u,x,y,q){const c=downedOf(u);if(STAGGER.on&&!c.beast){Stagger.draw(u,c,x,y);return}ctx.save();ctx.translate(Math.round(x),Math.round(y));if(u.face<0)ctx.scale(-1,1);
  if(c.beast){const sp=c.beast,w=sp.width,h=sp.height,x0=-Math.floor(w/2);if(c.down&&q>=.6)ctx.drawImage(c.down,x0,-h+2);else{const k=1-.5*q*q;ctx.drawImage(sp,x0,Math.round((-h+2)*k),w,Math.max(1,Math.round(h*k)))}}
  else if(q<1){ctx.translate(0,1);ctx.rotate(q*q*Math.PI/2);ctx.drawImage(c.stand,-12,-18-(c.top||0))}else ctx.drawImage(c.body,-c.ax,1-c.ay);
  ctx.restore()}
// a ring of ripples round one wading (half -1: its back half, drawn before him; 1: its front, after): whole pixels on the ellipse
// (rx, 2), a fainter one spreading from it, a wake behind him as he moves
function waterRing(x,y,rx,u,half,moved){x=Math.round(x);y=Math.round(y);const ph=(B.t*(moved?1.6:.8)+(u.id||0)*.37)%1,r2=rx+1+Math.round(ph*4);
  for(const [r,a] of [[rx,.8],[r2,.5*(1-ph)]]){ctx.fillStyle='rgba(232,242,244,'+a.toFixed(2)+')';const ry=r===rx?2:2+Math.round(ph*1.5);
    for(let dx=-r;dx<=r;dx++){const dy=Math.round(ry*Math.sqrt(Math.max(0,1-(dx/(r+.5))**2)));ctx.fillRect(x+dx,y+half*dy,1,1)}}
  if(moved&&half>0){const f=u.face<0?1:-1;ctx.fillStyle='rgba(232,242,244,.6)';for(let k=1;k<=3;k++){ctx.fillRect(x+f*(rx+k*2),y-k+1,2,1);ctx.fillRect(x+f*(rx+k*2),y+k,2,1)}}}
// an attack's trail by its shape: a sweeping crescent, a darting streak, a chop and its shockwave, a full circle, claw marks
function drawSlash(s){
  const p=1-s.life/(s.max||.2),fade=Math.min(1,s.life/(s.max||.2)*1.6),col=s.col||'255,255,255',st=a=>'rgba('+col+','+Math.max(0,a).toFixed(2)+')';
  ctx.save();const scale=worldEffectScale();effectTransform(s.x,s.y,scale);s={...s,r:s.r/scale,area:s.area/scale};ctx.lineCap='round';
  if(s.kind==='arc'||s.kind==='spin'){const span=s.kind==='spin'?Math.PI*2:2*s.arc,q=Math.min(1,p*2.4),a0=s.kind==='spin'?s.a:s.a-s.dir*s.arc,a1=a0+s.dir*span*q,tail=Math.max(0,q-.55)*span;
    const lo=Math.min(a0+s.dir*tail,a1),hi=Math.max(a0+s.dir*tail,a1);
    for(let k=0;k<3;k++){ctx.strokeStyle=st(fade*(1-k*.3));ctx.lineWidth=Math.max(1,(s.w||3)-k);ctx.beginPath();ctx.arc(s.x,s.y,s.r-k*2,lo,hi);ctx.stroke()}
    if(s.kind==='spin'){ctx.strokeStyle=st(fade*.4);ctx.lineWidth=1;ctx.beginPath();ctx.arc(s.x,s.y,s.r*.6,0,7);ctx.stroke()}}
  else if(s.kind==='thrust'||s.kind==='twin'){for(const o of s.kind==='twin'?[-.28,.28]:[0]){const a=s.a+o,ext=s.r*Math.min(1,p*3.2),c=Math.cos(a),sn=Math.sin(a),x0=s.x+c*4,y0=s.y+sn*4,x1=s.x+c*ext,y1=s.y+sn*ext;
      ctx.strokeStyle=st(fade);ctx.lineWidth=s.w||2;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
      ctx.fillStyle=st(fade);ctx.beginPath();ctx.moveTo(x1+c*4,y1+sn*4);ctx.lineTo(x1-sn*2.5,y1+c*2.5);ctx.lineTo(x1+sn*2.5,y1-c*2.5);ctx.fill();
      ctx.strokeStyle=st(fade*.45);ctx.lineWidth=1;for(const k of [-3,3]){ctx.beginPath();ctx.moveTo(x0-sn*k+c*ext*.3,y0+c*k+sn*ext*.3);ctx.lineTo(x1-sn*k-c*4,y1+c*k-sn*4);ctx.stroke()}}}
  else if(s.kind==='slam'){const cx=s.x+Math.cos(s.a)*s.r*.6,cy=s.y+6+Math.sin(s.a)*s.r*.6;
    if(p<.3){ctx.strokeStyle=st(1);ctx.lineWidth=s.w||3;ctx.beginPath();ctx.moveTo(cx,cy-20+p/.3*14);ctx.lineTo(cx,cy-4);ctx.stroke()}
    else{const q=(p-.3)/.7;ctx.strokeStyle=st((1-q)*.9);ctx.lineWidth=Math.max(1,(s.w||3)-1);ctx.beginPath();ctx.ellipse(cx,cy,s.area*q+2,(s.area*q+2)*.5,0,0,7);ctx.stroke();
      ctx.strokeStyle='rgba(60,44,30,'+((1-q)*.8).toFixed(2)+')';ctx.lineWidth=1;for(let k=0;k<5;k++){const a=k*1.26+s.a,l=s.area*.6;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*l,cy+Math.sin(a)*l*.5);ctx.stroke()}}}
  else if(s.kind==='claw'){ctx.strokeStyle=st(fade);ctx.lineWidth=1;const c=Math.cos(s.a+.8),sn=Math.sin(s.a+.8);for(const k of [-3,0,3]){ctx.beginPath();ctx.moveTo(s.x-c*5-sn*k,s.y-sn*5+c*k);ctx.lineTo(s.x+c*5-sn*k,s.y+sn*5+c*k);ctx.stroke()}}
  ctx.restore();
}
/* a field with terrain: its standing trees and plateau cliff faces (engine/ground.js cv.props) are drawn in the same depth order
   as the soldiers, by their feet (a soldier whose feet are lower on the screen than a trunk's foot stands in front of it; one
   behind is under its crown). Those in view only; each one covering one of your or your allies' men behind it fades to PROPFADE.a
   (at PROPFADE.rate a second, real time) so you see them; the enemy's men get no fade. The men are filed by the 8-px cells their
   bodies cover (PF: the least feet y there), so a prop looks at a few cells, not at every soldier */
const PROPFADE={a:.4,rate:4,cell:8};
let PF=null,PFT=0;
/* the woods zoomed out (a level of detail): a field of more than LOD.trees standing trees, seen at a zoom under LOD.z, has its trees
   drawn as one canopy layer (engine/ground.js PX.battleCanopy, painted once and kept, at half resolution) under the soldiers, not thousands of sprites
   sorted in with them; cliff faces and mountains stay sorted. Across LOD.z the two cross-fade over 1/LOD.rate s (real time). Only
   art: who is seen, hidden or drawn is as ever. TREE_A: the sprites' share this frame (1 - the layer's) */
const LOD={on:true,z:.9,trees:2000,rate:5};
let TREE_A=1;
function lodStep(){const g=B.ground;if(!g||!LOD.on||!(g.trees>LOD.trees)){if(g)g.lod=0;return 0}const to=(B.cam?B.cam.z:1)<LOD.z?1:0,now=performance.now();
  if(g.lod==null){g.lod=to;g.lodT=now}const st=Math.min(.1,(now-g.lodT)/1000)*LOD.rate;g.lodT=now;g.lod=g.lod<to?Math.min(to,g.lod+st):Math.max(to,g.lod-st);return g.lod}
function propsInView(out,v0,v1,v2,v3){
  const L=B.ground&&B.ground.props;if(!L||!L.length)return;const c=PROPFADE.cell,gw=Math.ceil(BW/c)+1,gh=Math.ceil(BH/c)+1;
  if(!PF||PF.length!==gw*gh)PF=new Float32Array(gw*gh);PF.fill(1e9);let any=false;
  for(const u of B.units){if(u.hp<=0||u.team!==0)continue;const k=u.s.big?2:1,x0=u.x-5*k,x1=u.x+5*k,y0=u.y-15*k,y1=u.y-1;if(x1<v0||x0>v2||y1<v1||y0>v3)continue;any=true;
    const ga=Math.max(0,Math.floor(y0/c)),gb=Math.min(gh-1,Math.floor(y1/c)),ha=Math.max(0,Math.floor(x0/c)),hb=Math.min(gw-1,Math.floor(x1/c));
    for(let gy=ga;gy<=gb;gy++)for(let gx=ha;gx<=hb;gx++){const i=gy*gw+gx;if(u.y<PF[i])PF[i]=u.y}}
  const now=performance.now(),st=PFT?Math.min(.1,(now-PFT)/1000)*PROPFADE.rate:1;PFT=now;
  const noT=TREE_A<=0;for(const p of L){if(noT&&p.dk===1)continue;const b=p.box;if(b[2]<v0||b[0]>v2||b[3]<v1||b[1]>v3)continue;let cov=false;
    if(any){const ga=Math.max(0,Math.floor(b[1]/c)),gb=Math.min(gh-1,Math.floor(b[3]/c)),ha=Math.max(0,Math.floor(b[0]/c)),hb=Math.min(gw-1,Math.floor(b[2]/c));
      for(let gy=ga;gy<=gb&&!cov;gy++){const o=gy*gw;for(let gx=ha;gx<=hb;gx++)if(PF[o+gx]<p.y){cov=true;break}}}
    const to=cov?PROPFADE.a:1,a=p.al==null?1:p.al;p.al=a<to?Math.min(to,a+st):Math.max(to,a-st);out.push(p)}}
// one standing prop: a tree, or a section of a cliff face (faded by propsInView)
function drawProp(o){const a=(o.al==null?1:o.al)*(o.dk===1?TREE_A:1);if(a<1)ctx.globalAlpha=a;ctx.drawImage(o.s,o.dx,o.dy);if(a<1)ctx.globalAlpha=1}
// what stands on the field, in the order it is drawn (by feet): obstacles and the living; with terrain the trees and cliff faces
// in view sorted in too, and of the enemy only those your side sees (terrain.js seenBy: woods, rises, the fog). Only those in view
// (ENT_PAD px round it for their bodies; a big field zoomed in leaves most of them out)
const ENT_PAD={x:64,up:24,down:96};
function battleEnts(){
  const v=camView(),vx=v.x,vy=v.y,x0=vx-ENT_PAD.x,x1=vx+v.w+ENT_PAD.x,y0=vy-ENT_PAD.up,y1=vy+v.h+ENT_PAD.down,inV=o=>o.x>=x0&&o.x<=x1&&o.y>=y0&&o.y<=y1;
  let ents;if(B.terrain&&B.ground){ents=B.obs.filter(inV);propsInView(ents,vx-16,vy-16,vx+v.w+16,vy+v.h+40);for(const u of B.units)if(u.hp>0&&inV(u)&&seenBy(0,u))ents.push(u)}
  else ents=[...B.obs.filter(inV),...B.units.filter(u=>u.hp>0&&inV(u)&&seenBy(0,u))];
  for(const h of B.horses||[])if(inV(h))ents.push(h);// (horses no one rides: battle/dismount.js)
  return ents.sort((a,b)=>a.y-b.y)}
// (a canvas the field's size, only the part in view: the same pixels as drawing it whole)
function drawInView(img){const v=camView(),vx=v.x,vy=v.y,W=img.width,H=img.height,x0=clamp(Math.floor(vx)-2,0,W),y0=clamp(Math.floor(vy)-2,0,H),x1=clamp(Math.ceil(vx+v.w)+2,0,W),y1=clamp(Math.ceil(vy+v.h)+2,0,H);
  if(x1>x0&&y1>y0)ctx.drawImage(img,x0,y0,x1-x0,y1-y0,x0,y0,x1-x0,y1-y0)}
// (a field layer, the part in view: kept by tiles or at half resolution (R16: the ground, the arena, the canopy, the blood:
// drawView), or a canvas the field's size)
function drawLayer(L){if(!L)return;if(!L.drawView){drawInView(L);return}const v=camView();L.drawView(ctx,v.x,v.y,v.x+v.w,v.y+v.h,v.z)}
// (what an arcing missile is, for its look: a spider's web (a.web), a sling's stone or a thrown javelin by its shooter's weapon;
// else an arrow. Read when drawn, so a shot's own state is as it was)
const missileOf=a=>{if(a.web)return 'web';const w=(a.by&&PEOPLE_LOOK[a.by.type]||{}).weapon;return w==='sling'?'stone':w==='javelin'?'javelin':'arrow'};
function drawBattle(){
  warmStep();FIGURES.frame();// (sprites made ahead before they are needed: sprites.js; the finished figures' frame: figures.js)
  // the camera (camera.js): the field drawn at its zoom and pan, its corner on a whole canvas px (V.k of them a view px: core.js
  // bview), the HUD over it at the screen's scale
  if(B.cam)camTick();const Cz=B.cam?B.cam.z:1,V=bview();
  // (deploying, the battle's clock stands: who sees whom is reckoned on the real one as your men are placed, terrain.js)
  if(sightOn()&&B.deploy){const n=performance.now(),S=B.sight;if(!S||!(n-(S.rt||0)<250)){sightStep(true);B.sight.rt=n}}ctx.fillStyle='#07090e';ctx.fillRect(0,0,V.w,V.h);if(B.world)B.world.base();const scrT=ctx.getTransform();ctx.save();if(B.cam){ctx.scale(Cz,Cz);const q=B.world?VS:V.k;ctx.translate(-Math.round(B.cam.x*Cz*q)/(Cz*q),-Math.round(B.cam.y*Cz*q)/(Cz*q))}
  // (a field with terrain: its own ground, painted over the arena at the start and kept by tiles (engine/ground.js PX.BattleGround);
  // without, the arena by its own tiles (worldart.js paintArena); units, as ever, over it)
  if(B.world){B.world.draw();B.world.clipSight()}else drawLayer(B.terrain?B.ground||(B.ground=runGen(PX.battleGroundSteps({...B.terrain,climate:B.env.c,base:B.arena}))):B.arena.ground||B.arena);
  // (a river moves: glints and current over its water, engine/ground.js PX.battleWater, on the ground's own clock (real time, still
  // while paused); still water for those who ask for less motion (vfx.js reducedMotion))
  if(!B.world&&B.terrain&&B.ground.water){const gw=B.ground,now=performance.now();if(!B.paused&&gw.wl)gw.wt=(gw.wt||0)+Math.min(.1,(now-gw.wl)/1000);gw.wl=now;
    if(!reducedMotion()){const v=camView();PX.battleWater(ctx,gw,gw.wt||0,[v.x,v.y,v.x+v.w,v.y+v.h])}}if(!B.world){const t=fieldTop()-FIELD_EDGE.body+6,b=fieldBot()+4;ctx.fillStyle='rgba(8,10,16,.35)';if(t>0)ctx.fillRect(0,0,BW,t);if(b<BH)ctx.fillRect(0,b,BW,BH-b);ctx.fillStyle='rgba(232,224,200,.18)';if(t>0)ctx.fillRect(0,t,BW,1);if(b<BH)ctx.fillRect(0,b,BW,1)}// (the field's edges in sight: battle.js fieldTop)
  if(!B.world){if(!B.deploy)drawExit();drawDeploy();}// (the withdrawal edge: morale.js; the deployment zone: deploy.js)
  drawCorpses();vfxGround();stateGround();heroFxGround();// (the fallen and their blood; dust, shockwaves: vfx.js)
  {const l=!B.world&&B.terrain&&B.ground?lodStep():0;TREE_A=1-l;if(l>0){if(l<1)ctx.globalAlpha=l;drawLayer(PX.battleCanopy(B.ground));ctx.globalAlpha=1}}// (a big wood zoomed out: its canopy layer, LOD)
  for(const g of playerGroups()){const gr=B.groups[g];if((gr.order!=='hold'&&gr.order!=='advance')||!grpUnits(g).length)continue;
    const fx_=Math.round(gr.ax),fy=Math.round(gr.ay);rect(ctx,C.wood,fx_,fy-14,1,14);rect(ctx,C.team[0],fx_+1,fy-14,6,4);rect(ctx,'#e4e0cf',fx_+3,fy-13,2,2)}
  // your selection underlined; the box you drag; where you last sent them (a ring), or whom you set them on (red)
  drawFireRange();drawSelection();// (shooters' reach and line of fire: battlehud.js)
  if(B.hunt)B.hunt.tracks.draw(B.units.filter(u=>u.team===0&&u.hp>0&&!u.left));// (a hunt's tracks your hunters read, under everyone: battle/hunting.js)
  if(orderPathsOn())drawOrderPaths();else drawOrderLines();// (order paths and destination ghosts beneath characters: ui/orderpaths.js)
  drawFormGhost();// (a line being dragged: formations.js)
  drawCommandPowers();// (the command radius, Stand Fast!'s glow: commandpowers.js)
  if(B.box){const b=B.box;ctx.strokeStyle='#e8b94a';ctx.lineWidth=1;ctx.strokeRect(Math.min(b.x0,b.x1)+.5,Math.min(b.y0,b.y1)+.5,Math.abs(b.x1-b.x0),Math.abs(b.y1-b.y0))}
  if(B.mark&&B.mark.t>0){const m=B.mark;ctx.strokeStyle=m.foe||m.am?'#ff6a5a':'#e8b94a';ctx.globalAlpha=Math.min(1,m.t*2);ctx.beginPath();ctx.ellipse(m.x,m.y,8*(1.4-m.t*.5),4*(1.4-m.t*.5),0,0,7);ctx.stroke();ctx.globalAlpha=1;m.t-=1/60}
  // (obstacles: their ground, then each in the depth order: sprites.js; on the world map (a world battle) each with the trees in front of
  // it drawn back over it, as the map's own figures are, those over your men faded: depth.js worldOverdraw; the owner, 2026-10-31:
  // "the forest seems not to cover units")
  obstacleGround();{const draw=o=>o.kind?drawObstacle(o):o.dk?drawProp(o):o.isHorse?o.draw():drawUnit(o),E=battleEnts();
    // (the overdraw reckons in the map scene's pixels: under that transform, each drawn under the field's own)
    if(B.world){const T=ctx.getTransform(),w=B.world,k=T.a*w.scale;ctx.save();ctx.setTransform(k,0,0,k,T.e+k*(G.cam.x-w.x0),T.f+k*(G.cam.y-w.y0));
      try{worldOverdraw(E.map(o=>({y:w.world(o).y,own:!o.kind&&!o.dk&&o.team===0,f:()=>{ctx.setTransform(T);draw(o)}})),G.cam)}finally{ctx.restore()}}else E.forEach(draw)}
  for(const a of B.arrows){if(a.arc){const z=Math.max(0,a.z),ang=Math.atan2(a.vy-a.vz,a.vx),sc=Math.min(1,z/50),kind=missileOf(a);
      ctx.fillStyle='rgba(0,0,0,'+(.35-sc*.2).toFixed(2)+')';const k=B.world?WORLD_BATTLE.sprite:1;ctx.fillRect(Math.round(a.x-2*k),Math.round(a.y),4*k,k);
      ctx.save();ctx.translate(Math.round(a.x),Math.round(a.y-4-z));ctx.scale(k,k);
      // (its look by what it is: a spider's web a sticky white clot with loose strands, a sling's stone, a javelin's long shaft; else an arrow)
      if(kind==='web'){const sp=Math.floor(a.t*12)%2;ctx.fillStyle='#eef0f4';ctx.fillRect(-1,-1,3,3);ctx.fillStyle='#c8ccd6';if(sp){ctx.fillRect(-3,-2,2,1);ctx.fillRect(2,2,2,1)}else{ctx.fillRect(-3,2,2,1);ctx.fillRect(2,-2,2,1)}ctx.fillStyle='#ffffff';ctx.fillRect(0,-1,1,1)}
      else if(kind==='stone'){ctx.fillStyle='#7a776e';ctx.fillRect(-1,-1,2,2);ctx.fillStyle='#a8a498';ctx.fillRect(-1,-1,1,1)}
      // (an arrow or a javelin: its own picture at the nearest of its angles, pixel for pixel, its head barbed: weapons.js missileSprite)
      else{const m=missileSprite(kind==='javelin'?'javelin':'arrow',ang);ctx.drawImage(m,-m.ax,-m.ax)}
      ctx.restore();continue}
    if(a.magic){if(Math.random()<.6)vfx({k:'ember',x:a.x+rnd(-2,2),y:a.y+rnd(-2,2),vx:rnd(-12,12),vy:rnd(-12,6),life:rnd(.2,.4),col:a.col});const fl=Math.floor(performance.now()/80)%2;ctx.save();effectTransform(a.x,a.y);ctx.fillStyle=a.col;ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(a.x,a.y,5+fl,0,7);ctx.fill();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(a.x,a.y,2.5,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(Math.round(a.x)-1,Math.round(a.y)-1,2,2);ctx.restore();continue}ctx.save();ctx.translate(Math.round(a.x),Math.round(a.y));const k=B.world?WORLD_BATTLE.sprite:1;ctx.scale(k,k);{const m=missileSprite('arrow',a.a);ctx.drawImage(m,-m.ax,-m.ax)}ctx.restore()}
  ambientBattle();// (birds out of the trees as it begins, crows over the field once it is over: ambient.js)
  // (the field's weather (gfx/weather.js), at the screen's scale, under the fog of war, as on the map; a battle on the map, whose
  // fog is the map's, drawn under the field (worldbattle.js base), has it over the field instead, below)
  if(!B.world){ctx.save();ctx.setTransform(scrT);ctx.scale(V.w/VW,V.h/VH);WeatherArt.draw(B.env&&B.env.w,VW,VH);ctx.restore()}
  if(!B.world)fogDraw();// (the fog of war over the field outside your side's sight: battlefog.js)
  const h=B.hero;
  // No persistent short aim arc; selected shooters already have the shared range fan.
  if(h&&h.hp>0&&B.blocking){ctx.strokeStyle='#9fc0ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(h.x,h.y-6,13,B.aim-.9,B.aim+.9);ctx.stroke()}
  for(const s of B.slashes){if(s.kind){drawSlash(s);continue}ctx.strokeStyle='rgba('+(s.col||'255,255,255')+','+Math.min(1,s.life*7).toFixed(2)+')';ctx.lineWidth=(s.w||3)*worldEffectScale();ctx.beginPath();ctx.arc(s.x,s.y,s.r||B.hero.s.reach,s.a-(s.arc||1.1),s.a+(s.arc||1.1));ctx.stroke()}
  for(const r of B.rings){const p=1-r.life/r.max;ctx.strokeStyle='rgba('+r.col+','+(r.life/r.max).toFixed(2)+')';ctx.lineWidth=3*worldEffectScale();ctx.beginPath();ctx.arc(r.x,r.y,r.r*(.5+.5*p),0,6.283);ctx.stroke()}
  for(const p of B.parts){ctx.save();effectTransform(p.x,p.y);if(p.stuck){const x=Math.round(p.x),y=Math.round(p.y);ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle='#c9b48a';ctx.fillRect(x-p.stuck,y-3,1,2);ctx.fillRect(x-2*p.stuck,y-5,1,2);ctx.fillStyle='#e8e4d0';ctx.fillRect(x-3*p.stuck,y-6,1,1);ctx.globalAlpha=1;ctx.restore();continue}
    ctx.fillStyle=p.c;ctx.fillRect(Math.round(p.x),Math.round(p.y),2,2);ctx.restore()}
  vfxAir();stateFxAir();heroFxAir();// (sparks, glows, embers, flying blood: vfx.js)
  // (a number pops up big and settles)
  for(const f of B.floats){const a=f.age||0,k=a<.12?1+(1-a/.12)*.6:1;if(k===1){txt(f.t,Math.round(f.x),Math.round(f.y),f.c,'center');continue}ctx.save();ctx.translate(Math.round(f.x),Math.round(f.y));ctx.scale(k,k);txt(f.t,0,0,f.c,'center');ctx.restore()}
  ctx.restore();
  drawFogGhosts();drawUnitIcons();drawGroupHealth();// (the fog's ghosts, where enemy groups were last seen; each group's type, health, morale and weaknesses, over it, the same size at any zoom: ui/moraleicons.js; its health of what it began with, a bar standing by it: battlehud.js)
  // the HUD at the screen's scale over the zoomed-out field
  ctx.save();ctx.scale(V.w/VW,V.h/VH);
  if(B.world)WeatherArt.draw(B.env&&B.env.w,VW,VH);// (a battle on the map: its weather over the field, under the HUD)
  drawHeroHud();if(!B.world)drawMiniField();// (the small map of the field, top right: camera.js)
  if(B.over){txt(B.stalemate?'DISENGAGED':B.hunt?'HUNT OVER':B.retreat?'WITHDRAWN':B.win?'VICTORY':'DEFEAT',VW/2,VH/2,B.win?'#e8b94a':B.retreat?'#6fa8e0':'#e0605a','center')}
  ctx.restore();
  calloutFrame();// (the banners for the big moments, over the field: battlehud.js)
}
function frame(){
  {const sc=document.getElementById('screen');if(sc&&sc.dataset.mode!==G.mode){sc.dataset.mode=G.mode;updateHint();hideTip()}}
  window.mobileWorldHud?.sync();window.mobileBattleHud?.sync();
  // (loading: the overlay over the last frame, nothing drawn under it, so no effect draws a random number meanwhile: ui/loading.js)
  if(G.mode==='loading'){if(typeof loadingFrame==='function')loadingFrame();return}
  const bat=B&&(G.mode==='battle'||G.mode==='esc'&&G.esc&&G.esc.mode==='battle'),scn=!bat&&G.scene&&(G.mode==='scene'||G.mode==='town'&&G.town&&G.town.inScene||G.mode==='esc'&&G.esc&&(G.esc.mode==='scene'||G.esc.mode==='town'&&G.town&&G.town.inScene)),map=(!bat||!!B?.world)&&!scn;
  // (a battle: the field's height, the screen's shape, drawn sharp at the screen's own pixels, V.k a view px (core.js bview); the
  // world map: the screen's own pixels, VS a game pixel: core.js; the map's zoom only on the map: core.js MAPZOOM)
  if(map!==MAPZOOM.map){MAPZOOM.map=map;if(MAPZOOM.z||MAPZOOM.auto!==MAPZOOM.s0)fitScreen()}
  if(bat&&B.world){BVW=VW;BVH=VH}const V=bat&&!map?bview():null;setRes(map?VW*VS:V?V.cw:VW,map?VH*VS:V?V.ch:VH,map?VS:V?V.k:1);
  ctx.save();if(CVS!==1)ctx.scale(CVS,CVS);
  {const s=shakeView(bat);if(s)ctx.translate(Math.round(s.x*CVS)/CVS,Math.round(s.y*CVS)/CVS)}// (a blow's shake, a charge's jolt, on whole canvas px: drawn only, vfx.js)
  if(bat){const z=heroZoom();if(z!==1){const w=ctx.canvas.width/2/CVS,h=ctx.canvas.height/2/CVS;ctx.translate(w,h);ctx.scale(z,z);ctx.translate(-w,-h)}}// (the finisher's zoom-punch about the middle: herofx.js)
  if(bat){drawBattle();if(B.hudWait){B.hudWait=false;bbar.hidden=false}}// (its HUD shown with its first frame: setup.js present)
  else if(scn)drawScene();
  else if(G.mode==='title'){ctx.fillStyle='#0b0d14';ctx.fillRect(0,0,VW,VH);drawWorld()}
  else drawWorld();
  ctx.restore();if(bat)heroFlashDraw();
  if(typeof drawTouchHold==='function')drawTouchHold();
  if(typeof drawMapHold==='function')drawMapHold();// (the map's click-and-hold progress, in screen pixels: ring.js)
}
/* the band card (top left; doc/SUPPLY_DESIGN.md §8; the owner, 2026-10-23): your band's name, big (a button: the Names window,
   ui/names.js), under it your hero's name (else your race and past), level and rank, her portrait and the points to spend; three
   bars, each in %: Fitness (world/supply.js bandFitness: the fit and your hero's health over the whole band; red under half; on
   hover the fit, the wounded, your hero's health and what hurt them lately), Morale (P.morale; red under 30; on hover the
   troops' nerve it drifts toward) and Stamina (green, amber Tired, red Exhausted, the state's word by its %, an arrow for which
   way it goes: ▼ draining, ▲ coming back; on hover its rate an hour and why); while the waterskins fill, a thin bar under them
   (Filling waterskins, in %: world/supply.js SKINS); the tags that apply (Tired, Exhausted, Thirsty,
   Hungry, Cold, In camp: on hover, why); gold, food and drink in days at the current rate, furs in or near the frost or when
   carried, troops, power and pace as icon chips (what runs short is red); where you are and whom you serve. Your hero's health
   and mana are in the Hero window (C) and the battle. The top bar: the day and the time */
// the left panel's group at the bottom left (the owner, 2026-11-04: "a level up button at the bottom left corner ... like a square
// box and animated in blinking"): its one notice now, talent points to spend after a level up (P.tp), a square that blinks till
// they are spent; a click opens your Skills (as K). None: the group hidden
function lvBox(){const el=$('#lgroup');if(!el)return;const n=P.tp||0,sig=String(n);if(el.dataset.sig===sig)return;el.dataset.sig=sig;el.hidden=!n;
  el.innerHTML=n?'<button class="lvup" type="button" title="Level up: '+n+' talent point'+(n>1?'s':'')+' to spend (K)" aria-label="Level up: '+n+' talent point'+(n>1?'s':'')+' to spend">'+icon('skills',22)+'<b>+'+n+'</b><small>Level up</small></button>':''}
{const g=document.getElementById('lgroup');if(g)g.addEventListener('click',e=>{if(e.target.closest('.lvup'))document.getElementById('skillBtn')?.click()})}
function updateHUD(force){
  lvBox();
  const el=$('#stats');if(!el)return;const cnt=partySize(),cap=partyCap(),S=supplyNow(),F=bandFitness(),fp=Math.round(F.pct),mo=Math.round(P.morale),lh=landHold(P.x,P.y),sp=bandPace();
  const bar=(v,cls,txt,title)=>'<div class="bar '+cls+'" title="'+title+'"><i style="width:'+Math.max(0,Math.min(100,Math.round(v)))+'%"></i><em>'+txt+'</em></div>';
  const chip=(ic,val,title,warn,cls)=>'<span class="chip'+(warn?' warn':'')+'" title="'+title+'">'+icon(ic,14)+'<span'+(cls?' class="'+cls+'"':'')+'>'+val+'</span></span>';
  const days=d=>(d>=10?Math.floor(d):Math.floor(d*10)/10)+'d',rate=S.r.n,go=S.go?'on the march':'at rest';
  const arrow=rate<0?' ▼':rate>0&&P.bsta<100?' ▲':'',word={tired:'Tired',exhausted:'Exhausted'}[S.st],hurt=BAND.hurt.map(h=>h.why).join(', ');
  const staTip='Your band’s stamina '+Math.round(P.bsta)+'%'+(rate?': '+(rate>0?'+':'')+Math.round(rate*10)/10+' an hour ('+S.r.why.join(', ')+')':'')+'. Tired under '+SUPPLY.tired+'%, Exhausted under '+SUPPLY.exhausted+'%.';
  const fit0='Your band’s fitness '+fp+'%: '+F.fit+' fit, '+F.wounded+' wounded, your hero at '+Math.round(F.hp*100)+'% health'+(hurt?'. Lately: '+hurt:'')+'.',hl=healthLines(),fitTip=fit0+(hl?' '+hl:'');
  const moTip='Your band’s morale '+mo+'%'+(bandNerve()!=null?': your troops’ nerve is '+Math.round(bandNerve())+', and it drifts toward it':'')+'.';
  const foodTip='Food: '+(FOODS.filter(g=>goodN(g)).map(g=>GOODS[g].n+' '+goodN(g)).join(', ')||'none')+' · about '+days(S.foodDays)+' '+go;
  const tags=[...S.tags,burdenTag()].filter(Boolean);// (an overfilled bag: Burdened, core/inventory.js)
  const drinkTip='Drink: '+(drinkOrder(S.L).filter(g=>goodN(g)).map(g=>GOODS[g].n+' '+goodN(g)).join(', ')||'none')+' · about '+days(S.drinkDays)+' '+go+(S.L.desert?' (in the desert, water only)':'')+(BAND.liquor?' · liquor first':'')+' · '+skinsTip();
  const who=RACES[P.race].n+' '+(BGS[P.bg]?BGS[P.bg].n:'');
  setHtml(el,'<div class="pc-head"><img class="pc-pic" src="'+portrait('hero',true)+'" alt=""><div class="pc-who"><button class="pc-band" type="button" data-act="nm-open" title="'+htmlText(bandName())+': rename your band and your hero">'+htmlText(bandName())+'</button>'+
      '<small title="'+htmlText((heroName()?heroName()+', ':'')+who)+' · Level '+P.level+' · '+rankName()+'">'+htmlText(heroName()||who)+' · Lv '+P.level+' · '+rankName()+'</small></div>'+
'</div>'+
    '<div class="bars">'+bar(fp,'fit'+(fp<50?' low':''),'Fitness<b>'+fp+'%</b>',fitTip)+bar(mo,'mor'+(mo<30?' low':''),'Morale<b>'+mo+'%</b>',moTip)+
      bar(P.bsta,'sta '+S.st,'Stamina'+arrow+'<b>'+(word?word+' · ':'')+Math.round(P.bsta)+'%</b>',staTip)+'</div>'+
    (S.fill!=null?'<div class="pc-fill" title="Filling your waterskins: '+S.fill+'%. Any order stops it; you keep what is in."><i style="width:'+S.fill+'%"></i><em>Filling waterskins<b>'+S.fill+'%</b></em></div>':'')+
    (tags.length?'<div class="pc-tags">'+tags.map(([t,c,w])=>'<span class="tag '+c+'" title="'+w+'">'+t+'</span>').join('')+'</div>':'')+
    '<div class="pc-res">'+chip('gold',P.gold,'Gold',false,'gold')+chip('food',days(S.foodDays),foodTip,S.foodDays<1)+chip('mug',days(S.drinkDays),drinkTip,S.drinkDays<1)+
      (S.furs.show?chip('furs',S.furs.have+'<small>/'+S.furs.need+'</small>','Furs: '+S.furs.need+' needed in the frost (1 for every '+SUPPLY.furPer+' people)',S.L.frost&&S.furs.have<S.furs.need):'')+
      chip('troops',cnt+'<small> '+partyRoster(P).slots+'/'+partyRoster(P).groupLimit+'</small>','Troops: '+cnt+' men in '+partyRoster(P).slots+' of '+partyRoster(P).groupLimit+' unit slots')+chip('power',partyPower(),'Party power','', 'gold')+
      chip('speed',sp.toFixed(1)+'×','Your band’s pace before the ground: the slowest of you, its size, the wounded, mounts, Athletics or Riding, a Guide, Forced March, tiredness, Hurry, an overfilled bag',sp<.8)+
      (prisonerCount()?chip('prisoners',prisonerCount(),'Prisoners'):'')+'</div>'+
    (()=>{const M=armyGroundMix(P),main=M.names[0][0],part=M.road&&M.road*2<M.n?' · part on the road':'',
      pace=travelMul()/Math.max(1e-6,bandPace()),tip='Your men stand on: '+M.names.map(([k,v])=>k+' '+v+' of '+M.n).join(', ')+' · their ground, pace ×'+pace.toFixed(2)+(M.n>1&&!P.byRoad&&M.road?'. By road (B): your men form a column on the road, at its full speed':'');
      return '<div class="pc-line" title="Where you are">'+icon('region',12)+'<span>'+regionAt(P.x,P.y).name+' · <span title="'+htmlText(tip)+'">'+htmlText(main)+part+'</span> · '})()+'<span style="color:'+(lh?landCol(lh.owner):'#9a958a')+'">'+landName(P.x,P.y)+'</span></span></div>'+
    '<div class="pc-line" title="Renown and whom you serve">'+icon('renown',12)+'<span>'+P.renown+'</span>'+icon('banner',12)+'<span'+(P.fac?' style="color:'+FACS[P.fac].col+'"':'')+'>'+(P.fac?FACS[P.fac].n:'Independent')+'</span></div>');
  // (the day, its season and its time; the weather where you are by it, its icon in the sun's or moon's place: world/weather.js)
  const d=$('#wday');if(d){const w=WEATHER.on?ambWeather():null,K=w&&WEATHER.kinds[w],sky=icon(darkness()>.3?'moon':'sun',16);
    setHtml(d,(K?'<i class="wx" title="Weather: '+Weather.name(w)+' · travel ×'+K.speed+' · sight ×'+K.sight+'">'+(w==='clear'?sky:icon('wx_'+w,16))+'</i>':sky)+'<span>Day '+G.day+(K?' · '+Weather.season().n:'')+' · '+timeOfDay()+(K?' · '+Weather.name(w):'')+'</span><b'+(G.paused?'':' class="off"')+'>Paused</b>')}
  window.mobileWorldHud?.update(fp,mo,Math.round(P.bsta));
  const cb=$('#campBtn');if(cb){cb.classList.toggle('on',!!P.camp);cb.setAttribute('aria-pressed',String(!!P.camp))}
  questTrackHUD();// (the quests you track, under the band card as it now stands: ui/questtrack.js)
  underwayHUD();// (what your band is doing, under the minimap: ui/underway.js)
}
// a short hint at the top of the screen for where you are (H shows every control)
function updateHint(){
  const h=$('#hint');if(!h)return;h.hidden=!GUIDE.on;// (guide texts off: no hint: ui.js)
  h.textContent=G.mode==='scene'?'WASD or click to walk · E talk · out of the gate to leave · H help':G.mode==='battle'?'':'Click to travel · hover for details · Space pause · H help';
}
// (a group holding: standing in its places, sent nowhere and set on no one. 'hold' is also the order a move gives, its men going
// to their new places, so the order alone would light Hold on nearly always)
function holding(g){const gr=B.groups[g],m=grpUnits(g);return !!gr&&gr.order==='hold'&&!gr.tgt&&!(gr.queue&&gr.queue.length)&&m.length>0&&m.filter(u=>u.slotted&&!u.spdNow).length>=m.length*.6}
function setOrderUI(){
  if(!B)return;const gs=selGroups().filter(g=>grpUnits(g).length),src=gs.length?gs:selGroups();
  document.querySelectorAll('[data-order]').forEach(b=>{const o=b.dataset.order;b.classList.toggle('on',o==='charge'?src.every(g=>!walking(B.groups[g])):o==='advance'?src.every(g=>walking(B.groups[g])):o==='hold'?src.every(holding):src.every(g=>B.groups[g].order===o))});
  // the formation buttons: lit when every selected group it suits stands in it; dimmed when it suits none of them
  document.querySelectorAll('[data-form]').forEach(b=>{const f=b.dataset.form,fit=src.filter(g=>formFits(g,f)),on=fit.length>0&&fit.every(g=>B.groups[g].form===f);b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));b.disabled=!fit.length});
  // (a shooters' flag dimmed when none of the selection shoots; lit when every one of them that does has it)
  document.querySelectorAll('[data-flag]').forEach(b=>{const f=b.dataset.flag,l=src.filter(g=>grpUnits(g).some(u=>flagEligible(u,f))),on=l.length>0&&l.every(g=>B.groups[g][f]);b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));b.disabled=!l.length;
    if(f==='shieldWall'){const m=gs.flatMap(grpUnits),eligible=m.filter(shieldEligible).length,active=m.filter(shieldWallActive).length;b.title='Shield wall (a stance slot: Q, W or E by the kind): '+eligible+'/'+m.length+' eligible, '+active+' supported and active. Supported shield infantry: 35% less frontal damage, 40% slower. Charge/run lowers shields.';b.setAttribute('aria-label',b.title)}});
  // unit cards, the selected unit's details and the top bar (battlehud.js)
  bhudCards();document.querySelectorAll('[data-grp]').forEach(b=>bhudCard(b,b.dataset.grp));bhudInfo();bhudTop();
}
// the world's speed (SPEEDS, TRAVEL_FAST: core.js), lit on its button; why: Travel fast ends (world.js fastWatch), said in the log.
// Travel fast will not start with danger in sight
function setSpeed(n,why){
  if(why&&G.speed===TRAVEL_FAST&&n!==TRAVEL_FAST)log('Travel fast ends: '+why+'.','bad');
  G.speed=n;window.mobileWorldHud?.speed();document.querySelectorAll('[data-speed]').forEach(b=>{const on=+b.dataset.speed===n;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))})}
function pauseUI(){const b=$('#pause');if(!b)return;b.innerHTML=icon(G.paused?'play':'pause',14);b.setAttribute('aria-label',G.paused?'Play':'Pause');b.classList.toggle('on',!!G.paused)}
function togglePause(){G.paused=!G.paused;pauseUI();updateHUD(true)}
