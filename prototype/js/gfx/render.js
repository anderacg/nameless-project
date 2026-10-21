'use strict';
/* ---------- rendering ---------- */
// x, y: the leader's feet on screen; dir: which way the host faces; seed keeps each follower's place steady; wd: how far the
// leader has walked while it walks (each follower's step by it, a little out of time with the next: WALK), null standing
// (race: the host's people; band: a bandit band, hooded and ragged. Every follower stands as tall as the leader: people.js; at
// most 9 of them, three abreast, the ranks 4 px apart; the party's banner floats over it all: drawBanners)
function drawHost(n,col,x,y,dir,wd,seed,race,band){
  const k=hostSize(n);if(!k)return;const pts=[];
  for(let i=0;i<k;i++){const row=Math.floor(i/3),c=i%3,j=hash(i,seed|0,7);pts.push([x-dir*(6+row*4+(c===1?2:0))+Math.round(j*2-1),y-2+(c-1)*3+(row%2),i])}
  pts.sort((a,b)=>a[1]-b[1]);
  for(const [px,py,i] of pts){const f=wd==null?0:Math.floor(wd/WALK.foot+i*WALK.n*.325)%WALK.n,s=followerSprite(col,f,(i+(seed|0))%6,race,band);ctx.save();ctx.translate(Math.round(px),Math.round(py));if(dir<0)ctx.scale(-1,1);ctx.drawImage(s,-8,-14);ctx.restore()}
}
// a mover's step on the map (doc §10.2, R13): its frame by how far it has walked (parties.js frameOf: a frame each stride px, n a
// cycle), so the feet keep to the ground at every speed; 0 standing, once it has not moved for a moment (STILL_MS). Drawn only.
// WALK: the map's walk cycles, n frames each (people.js, engine/beasts.js PX.beastMap, critters.js, caravans.js; 0 the standing
// one), a frame each foot px walked on foot, each ride px riding: the strides of the old four-frame cycles cut by n/4, so the
// same slow pace steps as far, in finer steps
const STILL=new WeakMap(),STILL_MS=250,WALK={n:8,foot:1.25,ride:2};
function mapStepping(o){const w=WALKED.get(o)||0,s=STILL.get(o),now=performance.now();if(!s||s.w!==w){STILL.set(o,{w,t:now});return !!s}return now-s.t<STILL_MS}
const stepOf=(o,stride,n=WALK.n)=>mapStepping(o)?frameOf(o,stride,n):0;
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
/* the parties' banners (Total War-style, Party.banner): each over its party, its pole's foot BANNER_GAP px over the leader's head
   (headY), the cloth to the east; queued (BANNERQ) as each party in sight is drawn, so a party out of sight or sheltering shows
   none, and drawn after everyone and every tree (drawBanners), yours over the rest, each its label over it (a party's size and its
   stance against you, as before). They flutter in real time, still under reducedMotion (vfx.js). A click on one picks its party
   (Party.pick, world.js pickAt) */
const BANNER_GAP=2;let BANNERQ=[];
// (a party's banner only: a site's banner() is its camp flag's colour, structures.js)
function bannerAt(o,f){const b=o.banner&&o.banner();if(!b||typeof b!=='object')return null;const s=bannerSprite(b,f);return{s,x:Math.round(o.x)-4,y:o.headY()-BANNER_GAP-14}}
function drawBanners(cam){const now=performance.now(),still=reducedMotion(),mine=q=>q.o===P||q.o.faction==='player'?1:0;
  BANNERQ.sort((a,b)=>mine(a)-mine(b)||a.o.y-b.o.y);
  for(const q of BANNERQ){const B=bannerAt(q.o,still?0:Math.floor(now/420+q.o.x*.13)%2);if(!B)continue;const d=VS>1?subOf(q.o):[0,0],X=B.x-cam.x+d[0],Y=B.y-cam.y+d[1];ctx.drawImage(B.s,X,Y);
    if(q.label)txt(q.label[0],X+7,Y+opaqueBox(B.s)[1]-2,q.label[1],'center')}
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
const faceDir=o=>{let f=FACE.get(o);if(!f)FACE.set(o,f={x:o.x,d:o.x>P.x?-1:1});if(Math.abs(o.x-f.x)>.05){f.d=o.x>f.x?1:-1;f.x=o.x}return o.fight&&o.dir?o.dir:f.d};
function drawWorld(){
  // (the camera to 1/VS px: G.cam; cam its whole pixels, the rest (fx, fy) the shift of everything drawn on the screen)
  reveal();const V=vis(),C=G.cam;C.x=snapV(clamp(P.x-VW/2,0,MW*TILE-VW));C.y=snapV(clamp(P.y-VH/2,0,MH*TILE-VH));
  const cam={x:Math.floor(C.x),y:Math.floor(C.y)},fx=C.x-cam.x,fy=C.y-cam.y,scr=ctx,low=memCv(),hi=VS>1,ents=[];let nPlace=0;
  // what stands, into the scene in game pixels (memCv: its extra pixel each way counted in VW, VH while it is drawn)
  ctx=low.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,low.width,low.height);if(hi){VW++;VH++}// (its transform reset each frame: nothing drawn into it can leave a shift that piles up)
  try{
  WorldArt.draw(ctx,cam);// (the painted map by chunks, those in view: worldart.js)
  drawEnv(cam,V,0);drawLand(cam);drawEstates(cam,V);
  // each thing on the map draws itself onto the frame's list (WorldObject draw), in the order they always went (two as deep stay
  // in it): the sites, the parties, the beasts, the herds, you, then the workers, caravans, ships, refugees, the encounters on
  // the road (road.js) and fights
  for(const s of W.sites)s.draw(ents,cam,V);
  // the holdings (and their estates) are drawn as their placed buildings (lotEnts, called with the estates below)
  drawParties(ents,cam,V);// lords, bands, patrols and your companions' parties (each party draws itself: parties.js)
  for(const m of W.monsters)asMonster(m).draw(ents,cam,V);
  drawHerds(ents,cam,V);// (a pasture's herd: one animal on each worked field tile; the rest as herds: critters.js)
  if(P.raid)ents.push({y:P.y-1,f:()=>{subT(P);txt('Raiding '+Math.round(P.raid.t/RAID_TIME*100)+'%',Math.round(P.x-cam.x),Math.round(P.y-20-cam.y),'#ff9a90','center')}});
  if(P.siege)ents.push({y:P.y-1,f:()=>{subT(P);const s=campSprite(77,'bandit'),X=Math.round(P.x-24-s.ax-cam.x),Y=Math.round(P.y+2-s.ay-cam.y);ctx.globalAlpha=SHADOW.a;ctx.drawImage(s.sh,X,Y);ctx.globalAlpha=1;ctx.drawImage(s,X,Y);drawFire(X+s.fire[0],Y+s.fire[1],0);drawFlag(FACS.player.col,X+s.flag[0],Y+s.flag[1],0);txt('Siege day '+P.siege.days,Math.round(P.x-cam.x),Math.round(P.y-18-cam.y),'#e8b94a','center')}});
  // (you: on foot, a step each WALK.foot px you walk; mounted, your horse on the same feet, a step each WALK.ride px; your host behind, as a lord's: drawParties)
  if(!P.stay)ents.push({y:P.y,own:1,f:()=>{subT(P);const sx=Math.round(P.x-cam.x),sy=Math.round(P.y-cam.y),m=mountDef(),go=mapStepping(P),s=partySprite('#e8b94a',m?m.col:'',go?frameOf(P,m?WALK.ride:WALK.foot,WALK.n):0);
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(sx-(m?6:3),sy-1,m?12:6,2);drawHost(partySize(),'#3d74d6',sx-(m?P.dir*4:0),sy+2,P.dir,go?WALKED.get(P)||0:null,5,P.race);ctx.save();ctx.translate(sx,sy-10);ctx.scale(P.dir,1);ctx.drawImage(s,-(s.width>>1),13-s.height);ctx.restore();BANNERQ.push({o:P})}});
  drawFolk(ents,cam,V);drawCaravans(ents,cam,V);drawShips(ents,cam,V);drawRefugees(ents,cam,V);drawRoad(ents,cam,V);drawFights(ents,cam,V);
  ambientWorld(ents,cam,V);// (the birds, critters and butterflies on the ground, with everyone; the rest stepped: ambient.js)
  // the order: the ground (the chunks: their trees, woods and ranges painted in), what lies flat (fields, yards, borders), the
  // shadows of what is built (one pass), the buildings, moored boats, camps and sites (in their own order, by their feet), then everyone who moves by their feet, each with
  // what stands in front of him drawn again over him (depth.js worldOverdraw; whoever flies, after them all); then the clouds,
  // smoke and weather, the fog, the night and its lights, the way you walk, and over it all the banners and every label, the
  // quest marks, your goal and the pointer's brackets (worldui.js), and the minimap
  TXTQ=[];TXTQ.ctx=scr;TXTQ.lo=ctx;LIGHTQ=[];BANNERQ=[];WDEPTH.pics.length=0;const bents=[];estateEnts(bents,cam,V);for(const e of ents.filter(e=>e.st))bents.push(e);
  drawShadows(bents);bents.sort((a,b)=>a.y-b.y).forEach(e=>e.f());// (their shadows first, in one pass: structures.js)
  nPlace=TXTQ.length}finally{ctx=scr;if(hi){VW--;VH--}}
  // onto the screen, shifted by the camera's fraction, as is everything over it up to the minimap
  ctx.drawImage(low,-fx,-fy);ctx.save();ctx.translate(-fx,-fy);const px0=P.x-cam.x,py0=P.y-cam.y;
  // fog of war: keep the scene of structures, draw everyone, then put the remembered scene back over all but your sight, so
  // nothing that moves shows outside it; labels likewise (a place's, where you know the land; anyone's, only in your sight)
  ambientFlat(cam);worldOverdraw(ents.filter(e=>!e.st).sort((a,b)=>a.y-b.y),cam);ambientAir(cam);// (the splashes and the flyers' shadows under everyone, the flyers over them: ambient.js)
  // (at the screen's finer scale the remembered scene, the clouds and weather and the fog are laid in game pixels, as ever, into
  // one more picture the scene's size (overCv), drawn up in one step: three full screens' work made one)
  const ov=hi?overCv():null;if(ov){ctx=ov.getContext('2d');ctx.clearRect(0,0,ov.width,ov.height)}
  try{
  fogMem(low,px0,py0,V);
  drawEnv(cam,V,1);
  // fog and night: the land you remember, outside your sight, lies dim; land you have never seen is dark (fog.js)
  drawWorldFog(cam,V);
  }finally{ctx=scr}if(ov)ctx.drawImage(ov,0,0);
  // the tile grid and a building being placed lie over the fog
  if(GRID.on||G.place)drawGrid(cam.x,cam.y,VW+1,VH+1,cam.x,cam.y,1);
  if(G.place)drawPlace(cam);
  const a=darkness();
  if(a>0){ctx.fillStyle='rgba(10,14,50,'+(a*.34).toFixed(3)+')';ctx.fillRect(0,0,VW+1,VH+1)}
  // torchlight: a warm glow over the dark, and the flame itself, flickering
  {const now=performance.now();for(const L of LIGHTQ){if(!inSight(L.x+cam.x,L.y+cam.y))continue;const r=L.r*(1+.06*Math.sin(now/90+L.x)),g=ctx.createRadialGradient(L.x,L.y,1,L.x,L.y,r);g.addColorStop(0,'rgba(255,190,90,'+(.12+.28*a).toFixed(3)+')');g.addColorStop(1,'rgba(255,150,60,0)');
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(L.x-r,L.y-r,2*r,2*r);ctx.restore();const f=Math.floor(now/120+L.x)%2;rect(ctx,'#e8803a',L.x-1+f,L.y-2,2,2);rect(ctx,'#ffe090',L.x,L.y-1-f,1,1)}}
  ambientGlow(cam);// (the fireflies' light: ambient.js)
  wuiUnder(cam);// (the way you walk, your goal's ring, a click's ripple, the ring round what you chase: worldui.js)
  drawBanners(cam);// (the parties' banners, over all, their labels queued with the rest)
  const q=TXTQ;TXTQ=null;q.forEach((a,i)=>{const wx=a[1]+cam.x,wy=a[2]+cam.y;if(i<nPlace?seenAt(wx,wy+6):inSight(wx,wy+8))txt(...a)});
  drawQuestMarks(cam);drawRumourMarks(cam);// (the quests' marks, then the rumours' faint "?": news.js)
  wuiOver(cam);// (your goal's arrow, the arrow over what you chase, the brackets round what the pointer is on: worldui.js)
  ctx.restore();
  // minimap (the land from the tile data, a pixel per k tiles: worldart.js WorldArt.mini; the same size on the screen at any map
  // zoom: zk, core.js MAPZOOM)
  const zk=MAPZOOM.k(),MS=112*zk/MW,mk=Math.max(1,Math.round(MW/256)),mw=Math.round(MW*MS),mh=Math.round(MH*MS),mx=VW-mw-Math.round(6*zk),my=Math.round(6*zk),dot=(x,y,col,s)=>{s=Math.max(1,Math.round(s*zk));rect(ctx,col,mx+Math.floor(x/TILE*MS)-(s>>1),my+Math.floor(y/TILE*MS)-(s>>1),s,s)};
  ctx.fillStyle='#000';ctx.fillRect(mx-1,my-1,mw+2,mh+2);ctx.drawImage(atSize(WorldArt.mini(mk),mw,mh),mx,my);ctx.globalAlpha=.4;ctx.drawImage(atSize(landMiniCv(),mw,mh),mx,my);ctx.globalAlpha=1;ctx.drawImage(atSize(fogMiniCv(),mw,mh),mx,my);
  // each its own dot (WorldObject mapDot), layer by layer (MAP_LAYER; in a layer, as worldObjects lists them): the holdings and
  // sites you know of, then the beasts, parties and caravans in sight over them
  for(const o of worldObjects().filter(o=>o.mapKind in MAP_LAYER).sort((a,b)=>MAP_LAYER[a.mapKind]-MAP_LAYER[b.mapKind])){const d=o.mapDot(V);if(d)dot(o.x,o.y,d[0],d[1])}
  P.quests.forEach(q=>{const g=questGoal(q);if(g)dot(g.x,g.y,'#ffe040',2)});
  for(const m of rumourMarks())if(rumourFade(m)>0)dot(m.x,m.y,RUMOUR_COL,2);
  dot(P.x,P.y,'#fff',3);
}
// how long a unit holds its attack pose after it strikes
const ATK_ANIM=.36;
// the box a picture's drawn pixels fill, [x0, y0, x1, y1] (inclusive), worked out once per picture: what a label clears and a
// click answers on (world.js pickAt)
function opaqueBox(s){if(s._ob)return s._ob;const d=s.getContext('2d').getImageData(0,0,s.width,s.height).data;let x0=s.width,y0=s.height,x1=-1,y1=-1;
  for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++)if(d[(y*s.width+x)*4+3]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}return s._ob=x1<0?[0,0,0,0]:[x0,y0,x1,y1]}
// a party's leader as drawn (L: its look; f: the step, 0 to PEOPLE_STEPS-1): his picture, its cell's top left on the map and whether it faces
// left. The cell's bottom is 3 below his place (a rider in the same 16 cell: the same feet, his banner taller)
function partyFig(o,L,f){const s=L.bandit?banditSprite(f):partySprite(L.col,L.rider==='horse'?C.horse:'',f);return{s,x:o.x-(s.width>>1),y:o.y+3-s.height,flip:L.dir<0}}
// (the rows above a leader's cell top his label clears: his highest pixel in either step, so it stands still as he walks)
const figTop=L=>Math.min(...[...Array(PEOPLE_STEPS).keys()].map(f=>opaqueBox(partyFig(P,L,f).s)[1]));
// every party in sight, one way (Party.draw: its host, its leader's figure, a torch on a night watch, its label)
function drawParties(ents,cam,V){for(const o of W.parties)o.draw(ents,cam,V)}
function drawUnit(u){
  // (placed on the camera's pixels, not the field's: zoomed in, they glide instead of stepping)
  const q=B.cam?B.cam.z:1,big=u.s.big?2:1,s=unitSprite(u.type,spriteTeam(u),u.hero,u.v),w=s.width,h=s.ch,x=Math.round(u.x*q)/q,y=Math.round(u.y*q)/q;
  // (in a river (terrain.js groundAt; engine/ground.js paints it): deep water hides him to the waist, sunk 2 px, a ring of ripples
  // round him, its back half behind him; a ford wets his feet and splashes as he walks; a frozen ford (frost) is ice. From the
  // battle's time and his id: drawn only)
  const z=Math.round(u.z||0),ghost=u.hero&&B.hx&&B.hx.inv>0,wk=B.terrain&&!z?groundAt(u.x,u.y):0,deep=wk===4,ford=wk===3&&B.env.c!=='frost',rr=Math.round(5*big+1);
  if(deep)waterRing(x,y-2,rr,u,-1);else{ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(x,y,5.5*big,1.8*big,0,0,6.283);ctx.fill()}// (a soft shadow)
  if(u.buffT>0){ctx.fillStyle='rgba(232,185,74,.35)';ctx.fillRect(x-6,y-2,12,3)}
  const hit=u.hitAt!=null&&B.t-u.hitAt<.09;
  // (moving: a step in the last few frames, so a man who stops and starts as he settles does not flicker between standing and walking)
  // (knocked down: over, lying, up again, physics.js)
  const dq=physDownPose(u);if(dq!=null){drawDowned(u,x,y-z,dq);u.plx=u.x;u.ply=u.y}else{const step=u.plx!=null&&Math.hypot(u.x-u.plx,u.y-u.ply)>.02;u.plx=u.x;u.ply=u.y;u.movF=step?6:Math.max(0,(u.movF||0)-(B.paused?0:1));const moved=u.movF>0;const beast=!!(ST[u.type]&&ST[u.type].beast),cl=moved&&typeof climbState==='function'?climbState(u):null;let pose=beast?beastPose(u,moved):procPose(u,moved);
    // (on a hill's slope (the ground's climbState): walking or running up, bent forward on short slow steps; down, leaning on long ones)
    if(cl&&!beast&&((pose>=2&&pose<=5)||(pose>=15&&pose<=18)))pose=cl==='up'?19+Math.floor(B.t*5+(u.v||0))%4:23+Math.floor(B.t*9+(u.v||0))%4;
    const sp=beast?unitSprite(u.type,spriteTeam(u),u.hero,u.v,pose):unitSprite(u.type,spriteTeam(u),u.hero,u.v,pose,true,!!u.inMelee);
    // (a beast's blow: its pose, and a short lunge with it; its steps bob in its frames)
    let bx=0,bo=0;if(beast&&u.atkAt!=null&&B.t-u.atkAt<ATK_ANIM)bx=Math.round(2*Math.sin((B.t-u.atkAt)/ATK_ANIM*Math.PI))
    ctx.save();ctx.translate(x,y-z+bo);if(deep||ford){const sk=deep?2:0;ctx.translate(0,sk);ctx.beginPath();ctx.rect(-64,-128,128,128-sk-(deep?2:0));ctx.clip()}if(u.face<0)ctx.scale(-1,1);{const ln=physLean(u);if(ln)ctx.transform(1,0,-ln,1,0,0)}/* (leaning into his run: physics.js) */if(ghost)ctx.globalAlpha=.55;ctx.drawImage(hit?whiteOf(sp):sp,-Math.floor(sp.width/2)+bx,-sp.height+2);if(!beast)drawHeld(u,u.inMelee?sidearmLook(u):unitLook(u),sp,-Math.floor(sp.width/2)+bx,-sp.height+2,hit);ctx.restore();
    // (climbing: a little grit trickles down the slope behind him now and then; coming down, a puff at the heel: from his id and the
    // battle's time, drawn only)
    if(cl){const ph=(B.t*(cl==='up'?2.2:3)+((u.id||0)*.37))%1,dc=B.env.c==='frost'?'#e8eef4':B.env.c==='desert'?'#e6cc96':'#a8987a';
      if(cl==='up'&&ph<.4){const f=u.face<0?1:-1;ctx.fillStyle=dc;ctx.fillRect(Math.round(x+f*3),Math.round(y+1+ph*10),1,1);ctx.fillStyle='#6e6252';ctx.fillRect(Math.round(x+f*5),Math.round(y+ph*7),1,1)}
      else if(cl==='down'&&ph<.25){ctx.fillStyle=dc;ctx.globalAlpha=.7;ctx.fillRect(Math.round(x-(u.face<0?-4:4)),Math.round(y-1),2,1);ctx.globalAlpha=1}}
    if(deep)waterRing(x,y-2,rr,u,1,moved);else if(ford){const ph=(B.t*3+(u.id||0)*.37)%1;ctx.fillStyle='rgba(232,242,240,.55)';ctx.fillRect(Math.round(x-rr+1),Math.round(y),2*rr-2,1);
      if(moved&&ph<.5){ctx.fillStyle='#e8f2f0';ctx.fillRect(Math.round(x-3),Math.round(y-1-ph*4),1,1);ctx.fillRect(Math.round(x+3),Math.round(y-ph*5),1,1);ctx.fillRect(Math.round(x+(u.face<0?4:-4)),Math.round(y),1,1)}}}// (his weapon in his hand: weapons.js)
  drawStuck(u,x,y-Math.round(u.z||0));// (arrows in him: vfx.js)
  if(u.buffT>0&&Math.random()<.06)vfx({k:'ember',x:u.x+rnd(-4,4),y:u.y-rnd(2,12),vx:rnd(-4,4),vy:-rnd(10,25),life:rnd(.4,.7),col:'#ffd25a'});// (inspired: golden sparks)
  if(u.stun>0)txt('*',x+(Math.floor(performance.now()/120)%2?3:-3),y-h-z-2,'#ffe08a','center');
  drawMorale(u,x,y-h-z-3);// (running or wavering: ui/moraleicons.js)
  // its health: over every fighter with health bars on (Settings, or HP bars in battle), else over you and your companions
  if(u.leader)txt(u.leader.name+' Lv'+u.leader.lv,x,y-h-8-z,sideCol(u,'say'),'center');// a leader: his name over him
  if(HPBARS.on||u.hero||u.comp||u.leader){const bw=u.s.big?28:12,f=Math.max(0,u.hp/u.max),bx=Math.round(x-bw/2),by=y-h-2-z;ctx.fillStyle='#0a0c12';ctx.fillRect(bx-1,by-1,bw+2,4);ctx.fillStyle='#3a2420';ctx.fillRect(bx,by,bw,2);
    ctx.fillStyle=u.hero||u.comp?'#e8b94a':sideCol(u);ctx.fillRect(bx,by,Math.round(bw*f),2)}// (by side: battle.js SIDE)
}
// one knocked down (physics.js physDownPose: q 0 standing to 1 lying): he goes over as the fallen do (vfx.js drawBody), lies, and
// gets up; a beast pressed low, then on its side
function drawDowned(u,x,y,q){const c=corpseOf(u);ctx.save();ctx.translate(Math.round(x),Math.round(y));if(u.face<0)ctx.scale(-1,1);
  if(c.beast){const sp=c.beast,w=sp.width,h=sp.height,x0=-Math.floor(w/2);if(c.down&&q>=.6)ctx.drawImage(c.down,x0,-h+2);else{const k=1-.5*q*q;ctx.drawImage(sp,x0,Math.round((-h+2)*k),w,Math.max(1,Math.round(h*k)))}}
  else if(q<1){ctx.translate(0,1);ctx.rotate(q*q*Math.PI/2);ctx.drawImage(c.stand,-12,-18)}else ctx.drawImage(c.body,-c.ax,1-c.ay);
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
  ctx.save();ctx.lineCap='round';
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
  const c=B.cam,z=c?c.z:1,vx=c?c.x:0,vy=c?c.y:0,x0=vx-ENT_PAD.x,x1=vx+BVW/z+ENT_PAD.x,y0=vy-ENT_PAD.up,y1=vy+BVH/z+ENT_PAD.down,inV=o=>o.x>=x0&&o.x<=x1&&o.y>=y0&&o.y<=y1;
  let ents;if(B.terrain&&B.ground){ents=B.obs.filter(inV);propsInView(ents,vx-16,vy-16,vx+BVW/z+16,vy+BVH/z+40);for(const u of B.units)if(u.hp>0&&inV(u)&&seenBy(0,u))ents.push(u)}
  else ents=[...B.obs.filter(inV),...B.units.filter(u=>u.hp>0&&inV(u)&&seenBy(0,u))];
  return ents.sort((a,b)=>a.y-b.y)}
// (a canvas the field's size, only the part in view: the same pixels as drawing it whole)
function drawInView(img){const c=B.cam,z=c?c.z:1,vx=c?c.x:0,vy=c?c.y:0,W=img.width,H=img.height,x0=clamp(Math.floor(vx)-2,0,W),y0=clamp(Math.floor(vy)-2,0,H),x1=clamp(Math.ceil(vx+BVW/z)+2,0,W),y1=clamp(Math.ceil(vy+BVH/z)+2,0,H);
  if(x1>x0&&y1>y0)ctx.drawImage(img,x0,y0,x1-x0,y1-y0,x0,y0,x1-x0,y1-y0)}
// (a field layer, the part in view: kept by tiles or at half resolution (R16: the ground, the arena, the canopy, the blood:
// drawView), or a canvas the field's size)
function drawLayer(L){if(!L)return;if(!L.drawView){drawInView(L);return}const c=B.cam,z=c?c.z:1,vx=c?c.x:0,vy=c?c.y:0;L.drawView(ctx,vx,vy,vx+BVW/z,vy+BVH/z,z)}
// (what an arcing missile is, for its look: a spider's web (a.web), a sling's stone or a thrown javelin by its shooter's weapon;
// else an arrow. Read when drawn, so a shot's own state is as it was)
const missileOf=a=>{if(a.web)return 'web';const w=(a.by&&PEOPLE_LOOK[a.by.type]||{}).weapon;return w==='sling'?'stone':w==='javelin'?'javelin':'arrow'};
function drawBattle(){
  warmStep();// (sprites made ahead before they are needed: sprites.js)
  // the camera (camera.js): the field drawn at its zoom and pan, the HUD over it at the screen's scale
  if(B.cam)camTick();const Cz=B.cam?B.cam.z:1;
  // (deploying, the battle's clock stands: who sees whom is reckoned on the real one as your men are placed, terrain.js)
  if(sightOn()&&B.deploy){const n=performance.now(),S=B.sight;if(!S||!(n-(S.rt||0)<250)){sightStep(true);B.sight.rt=n}}ctx.fillStyle='#07090e';ctx.fillRect(0,0,BVW,BVH);ctx.save();if(B.cam){ctx.scale(Cz,Cz);ctx.translate(-Math.round(B.cam.x*Cz)/Cz,-Math.round(B.cam.y*Cz)/Cz)}
  // (a field with terrain: its own ground, painted over the arena at the start and kept by tiles (engine/ground.js PX.BattleGround);
  // without, the arena by its own tiles (worldart.js paintArena); units, as ever, over it)
  drawLayer(B.terrain?B.ground||(B.ground=runGen(PX.battleGroundSteps({...B.terrain,climate:B.env.c,base:B.arena}))):B.arena.ground||B.arena);
  // (a river moves: glints and current over its water, engine/ground.js PX.battleWater, on the ground's own clock (real time, still
  // while paused); still water for those who ask for less motion (vfx.js reducedMotion))
  if(B.terrain&&B.ground.water){const gw=B.ground,now=performance.now();if(!B.paused&&gw.wl)gw.wt=(gw.wt||0)+Math.min(.1,(now-gw.wl)/1000);gw.wl=now;
    if(!reducedMotion()){const c=B.cam,z=c?c.z:1,vx=c?c.x:0,vy=c?c.y:0;PX.battleWater(ctx,gw,gw.wt||0,[vx,vy,vx+BVW/z,vy+BVH/z])}}{const t=fieldTop()-FIELD_EDGE.body+6,b=fieldBot()+4;ctx.fillStyle='rgba(8,10,16,.35)';if(t>0)ctx.fillRect(0,0,BW,t);if(b<BH)ctx.fillRect(0,b,BW,BH-b);ctx.fillStyle='rgba(232,224,200,.18)';if(t>0)ctx.fillRect(0,t,BW,1);if(b<BH)ctx.fillRect(0,b,BW,1)}// (the field's edges in sight: battle.js fieldTop)
  if(!B.deploy)drawExit();drawDeploy();// (the withdrawal edge: morale.js; the deployment zone: deploy.js)
  drawCorpses();vfxGround();// (the fallen and their blood; dust, shockwaves: vfx.js)
  {const l=B.terrain&&B.ground?lodStep():0;TREE_A=1-l;if(l>0){if(l<1)ctx.globalAlpha=l;drawLayer(PX.battleCanopy(B.ground));ctx.globalAlpha=1}}// (a big wood zoomed out: its canopy layer, LOD)
  for(const g of playerGroups()){const gr=B.groups[g];if((gr.order!=='hold'&&gr.order!=='advance')||!grpUnits(g).length)continue;
    const fx_=Math.round(gr.ax),fy=Math.round(gr.ay);rect(ctx,C.wood,fx_,fy-14,1,14);rect(ctx,C.team[0],fx_+1,fy-14,6,4);rect(ctx,'#e4e0cf',fx_+3,fy-13,2,2)}
  // your selection underlined; the box you drag; where you last sent them (a ring), or whom you set them on (red)
  drawFireRange();drawSelection();// (shooters' reach and line of fire: battlehud.js)
  if(!orderPathsOn())drawOrderLines();// (Settings → Order paths off: the straight lines; on, ui/orderpaths.js draws the paths over the men below)
  drawFormGhost();// (a line being dragged: formations.js)
  drawCommandPowers();// (the command radius, Stand Fast!'s glow: commandpowers.js)
  if(B.box){const b=B.box;ctx.strokeStyle='#e8b94a';ctx.lineWidth=1;ctx.strokeRect(Math.min(b.x0,b.x1)+.5,Math.min(b.y0,b.y1)+.5,Math.abs(b.x1-b.x0),Math.abs(b.y1-b.y0))}
  if(B.mark&&B.mark.t>0){const m=B.mark;ctx.strokeStyle=m.foe||m.am?'#ff6a5a':'#e8b94a';ctx.globalAlpha=Math.min(1,m.t*2);ctx.beginPath();ctx.ellipse(m.x,m.y,8*(1.4-m.t*.5),4*(1.4-m.t*.5),0,0,7);ctx.stroke();ctx.globalAlpha=1;m.t-=1/60}
  obstacleGround();battleEnts().forEach(o=>o.kind?drawObstacle(o):o.dk?drawProp(o):drawUnit(o));// (obstacles: their ground, then each in the depth order: sprites.js)
  drawOrderPaths();// (where your groups are going, routed and cut as they walk, over the men, trees and rock: ui/orderpaths.js)
  for(const a of B.arrows){if(a.arc){const z=Math.max(0,a.z),ang=Math.atan2(a.vy-a.vz,a.vx),sc=Math.min(1,z/50),kind=missileOf(a);
      ctx.fillStyle='rgba(0,0,0,'+(.35-sc*.2).toFixed(2)+')';ctx.fillRect(Math.round(a.x-2),Math.round(a.y),4,1);
      ctx.save();ctx.translate(Math.round(a.x),Math.round(a.y-4-z));
      // (its look by what it is: a spider's web a sticky white clot with loose strands, a sling's stone, a javelin's long shaft; else an arrow)
      if(kind==='web'){const sp=Math.floor(a.t*12)%2;ctx.fillStyle='#eef0f4';ctx.fillRect(-1,-1,3,3);ctx.fillStyle='#c8ccd6';if(sp){ctx.fillRect(-3,-2,2,1);ctx.fillRect(2,2,2,1)}else{ctx.fillRect(-3,2,2,1);ctx.fillRect(2,-2,2,1)}ctx.fillStyle='#ffffff';ctx.fillRect(0,-1,1,1)}
      else if(kind==='stone'){ctx.fillStyle='#7a776e';ctx.fillRect(-1,-1,2,2);ctx.fillStyle='#a8a498';ctx.fillRect(-1,-1,1,1)}
      else if(kind==='javelin'){ctx.rotate(ang);ctx.fillStyle='#9a6a3a';ctx.fillRect(-6,0,10,1);ctx.fillStyle='#c9ced8';ctx.fillRect(4,0,3,1)}
      else{ctx.rotate(ang);ctx.fillStyle='#e8e4d0';ctx.fillRect(-4,0,7,1);ctx.fillStyle='#c9ced8';ctx.fillRect(3,0,2,1);ctx.fillStyle='#d8d0c0';ctx.fillRect(-5,-1,2,1);ctx.fillRect(-5,1,2,1)}
      ctx.restore();continue}
    if(a.magic){if(Math.random()<.6)vfx({k:'ember',x:a.x+rnd(-2,2),y:a.y+rnd(-2,2),vx:rnd(-12,12),vy:rnd(-12,6),life:rnd(.2,.4),col:a.col});const fl=Math.floor(performance.now()/80)%2;ctx.fillStyle=a.col;ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(a.x,a.y,5+fl,0,7);ctx.fill();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(a.x,a.y,2.5,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(Math.round(a.x)-1,Math.round(a.y)-1,2,2);continue}ctx.save();ctx.translate(Math.round(a.x),Math.round(a.y));ctx.rotate(a.a);ctx.fillStyle='#e8e4d0';ctx.fillRect(-4,0,7,1);ctx.fillStyle='#c9ced8';ctx.fillRect(3,0,2,1);ctx.restore()}
  ambientBattle();// (birds out of the trees as it begins, crows over the field once it is over: ambient.js)
  fogDraw();// (the fog of war over the field outside your side's sight: battlefog.js)
  const h=B.hero;
  // No persistent short aim arc; selected shooters already have the shared range fan.
  if(h&&h.hp>0&&B.blocking){ctx.strokeStyle='#9fc0ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(h.x,h.y-6,13,B.aim-.9,B.aim+.9);ctx.stroke()}
  for(const s of B.slashes){if(s.kind){drawSlash(s);continue}ctx.strokeStyle='rgba('+(s.col||'255,255,255')+','+Math.min(1,s.life*7).toFixed(2)+')';ctx.lineWidth=s.w||3;ctx.beginPath();ctx.arc(s.x,s.y,s.r||B.hero.s.reach,s.a-(s.arc||1.1),s.a+(s.arc||1.1));ctx.stroke()}
  for(const r of B.rings){const p=1-r.life/r.max;ctx.strokeStyle='rgba('+r.col+','+(r.life/r.max).toFixed(2)+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(r.x,r.y,r.r*(.5+.5*p),0,6.283);ctx.stroke()}
  for(const p of B.parts){if(p.stuck){const x=Math.round(p.x),y=Math.round(p.y);ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle='#c9b48a';ctx.fillRect(x-p.stuck,y-3,1,2);ctx.fillRect(x-2*p.stuck,y-5,1,2);ctx.fillStyle='#e8e4d0';ctx.fillRect(x-3*p.stuck,y-6,1,1);ctx.globalAlpha=1;continue}
    ctx.fillStyle=p.c;ctx.fillRect(Math.round(p.x),Math.round(p.y),2,2)}
  vfxAir();// (sparks, glows, embers, flying blood: vfx.js)
  // (a number pops up big and settles)
  for(const f of B.floats){const a=f.age||0,k=a<.12?1+(1-a/.12)*.6:1;if(k===1){txt(f.t,Math.round(f.x),Math.round(f.y),f.c,'center');continue}ctx.save();ctx.translate(Math.round(f.x),Math.round(f.y));ctx.scale(k,k);txt(f.t,0,0,f.c,'center');ctx.restore()}
  ctx.restore();
  drawFogGhosts();drawUnitIcons();// (the fog's ghosts, where enemy groups were last seen; each group's type, health, morale and weaknesses, over it, the same size at any zoom: ui/moraleicons.js)
  // the HUD at the screen's scale over the zoomed-out field
  ctx.save();ctx.scale(BVW/VW,BVH/VH);
  drawHeroHud();drawMiniField();// (the small map of the field, top right: camera.js)
  if(B.over){txt(B.retreat?'WITHDRAWN':B.win?'VICTORY':'DEFEAT',VW/2,VH/2,B.win?'#e8b94a':B.retreat?'#6fa8e0':'#e0605a','center')}
  ctx.restore();
  calloutFrame();// (the banners for the big moments, over the field: battlehud.js)
}
function frame(){
  {const sc=document.getElementById('screen');if(sc&&sc.dataset.mode!==G.mode){sc.dataset.mode=G.mode;updateHint();hideTip()}}
  // (loading: the overlay over the last frame, nothing drawn under it, so no effect draws a random number meanwhile: ui/loading.js)
  if(G.mode==='loading'){if(typeof loadingFrame==='function')loadingFrame();return}
  const bat=B&&(G.mode==='battle'||G.mode==='esc'&&G.esc&&G.esc.mode==='battle'),scn=!bat&&G.scene&&(G.mode==='scene'||G.mode==='town'&&G.town&&G.town.inScene||G.mode==='esc'&&G.esc&&(G.esc.mode==='scene'||G.esc.mode==='town'&&G.town&&G.town.inScene)),map=!bat&&!scn;
  // (a battle: the field's height, the screen's shape; the world map: the screen's own pixels, VS a game pixel: core.js; the map's
  // zoom only on the map: core.js MAPZOOM)
  if(map!==MAPZOOM.map){MAPZOOM.map=map;if(MAPZOOM.z)fitScreen()}
  setRes(bat?BVW:map?VW*VS:VW,bat?BVH:map?VH*VS:VH,map?VS:1);
  ctx.save();if(map&&VS>1)ctx.scale(VS,VS);
  {const s=shakeView(bat);if(s)ctx.translate(s.x,s.y)}// (a blow's shake, a charge's jolt: drawn only, vfx.js)
  if(bat){drawBattle();if(B.hudWait){B.hudWait=false;bbar.hidden=false}}// (its HUD shown with its first frame: setup.js present)
  else if(scn)drawScene();
  else if(G.mode==='title'){ctx.fillStyle='#0b0d14';ctx.fillRect(0,0,VW,VH);drawWorld()}
  else drawWorld();
  ctx.restore();
}
// your party, top left: the day, your level, health, stamina and mana as bars, then what you have; what runs short is red
// the party card (top left): your hero (portrait, name, level), health, stamina and mana, your band's gold, food, troops, power,
// morale and pace as icon chips, then where you are and whom you serve; the top bar: the day and the time
function updateHUD(force){
  stayBanner();const el=$('#stats');if(!el)return;const cnt=partySize(),cap=partyCap(),eat=eatPerDay(),m=vitals(),fd=foodN(),days=Math.floor(fd/Math.max(1,eat));
  const bar=(v,mx,c,lab)=>'<div class="bar" title="'+lab+'"><i style="width:'+Math.max(0,Math.min(100,Math.round(v/mx*100)))+'%;background:'+c+'"></i><em'+(v<mx*.3?' class="low"':'')+'>'+lab+' '+Math.round(v)+'/'+mx+'</em></div>';
  const chip=(ic,val,title,warn,cls)=>'<span class="chip'+(warn?' warn':'')+'" title="'+title+'">'+icon(ic,14)+'<span'+(cls?' class="'+cls+'"':'')+'>'+val+'</span></span>';
  const frost=climAt(P.x,P.y)==='frost'&&!RACES[P.race].home.includes('frost'),furNeed=Math.ceil((cnt+1)/5),lh=landHold(P.x,P.y),sp=bandPace();
  el.innerHTML='<div class="pc-head"><img class="pc-pic" src="'+portrait('hero',true)+'" alt=""><div class="pc-who"><b>'+RACES[P.race].n+' '+(BGS[P.bg]?BGS[P.bg].n:'')+'</b><small>Level '+P.level+' · '+rankName()+'</small></div>'+
      (P.tp?'<span class="pc-pts" title="Talent points to spend (K)">+'+P.tp+'</span>':'')+'</div>'+
    '<div class="bars" title="Health · Stamina · Mana">'+bar(P.hp,m[0],'#c8503a','Health')+bar(P.sp,m[1],'#78c474','Stamina')+bar(P.mp,m[2],'#5a8fe8','Mana')+'</div>'+
    '<div class="pc-res">'+chip('gold',P.gold,'Gold',false,'gold')+chip('food',fd+'<small> '+days+'d</small>','Food: '+(FOODS.filter(g=>goodN(g)).map(g=>GOODS[g].n+' '+goodN(g)).join(', ')||'none')+' · about '+days+' days',days<2)+
      chip('troops',cnt+'<small>/'+cap+'</small>','Troops: '+cnt+' of '+cap)+chip('power',partyPower(),'Party power','', 'gold')+chip('morale',Math.round(P.morale),'Morale'+(bandNerve()!=null?' (your troops\u2019 nerve: '+Math.round(bandNerve())+', it drifts toward it)':''),P.morale<30)+
      chip('speed',sp.toFixed(1)+'×','Your band\u2019s pace before the ground: the slowest of you, its size, the wounded, mounts, Athletics or Riding, a Guide, Forced March',sp<.8)+
      (frost||goodN('furs')?chip('furs',goodN('furs')+(frost?'<small>/'+furNeed+'</small>':''),'Furs'+(frost?': '+furNeed+' needed in the frost':''),frost&&goodN('furs')<furNeed):'')+
      (prisonerCount()?chip('prisoners',prisonerCount(),'Prisoners'):'')+(woundedN()?chip('wounded',woundedN(),'Wounded, riding with you while they heal',true):'')+'</div>'+
    '<div class="pc-line" title="Where you are">'+icon('region',12)+'<span>'+regionAt(P.x,P.y).name+' · <span style="color:'+(lh?landCol(lh.owner):'#9a958a')+'">'+landName(P.x,P.y)+'</span></span></div>'+
    '<div class="pc-line" title="Renown and whom you serve">'+icon('renown',12)+'<span>'+P.renown+'</span>'+icon('banner',12)+'<span'+(P.fac?' style="color:'+FACS[P.fac].col+'"':'')+'>'+(P.fac?FACS[P.fac].n:'Independent')+'</span></div>';
  const d=$('#wday');if(d)d.innerHTML=icon(darkness()>.3?'moon':'sun',16)+'<span>Day '+G.day+' · '+timeOfDay()+'</span><b'+(G.paused?'':' class="off"')+'>Paused</b>';
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
    if(f==='shieldWall'){const m=gs.flatMap(grpUnits),eligible=m.filter(shieldEligible).length,active=m.filter(shieldWallActive).length;b.title='Shield wall (B): '+eligible+'/'+m.length+' eligible, '+active+' supported and active. Supported shield infantry: 35% less frontal damage, 40% slower. Charge/run lowers shields.';b.setAttribute('aria-label',b.title)}});
  // unit cards, the selected unit's details and the top bar (battlehud.js)
  bhudCards();document.querySelectorAll('[data-grp]').forEach(b=>bhudCard(b,b.dataset.grp));bhudInfo();bhudTop();
}
// the world's speed (SPEEDS, TRAVEL_FAST: core.js), lit on its button; why: Travel fast ends (world.js fastWatch), said in the log.
// Travel fast will not start with danger in sight
function setSpeed(n,why){
  if(why&&G.speed===TRAVEL_FAST&&n!==TRAVEL_FAST)log('Travel fast ends: '+why+'.','bad');
  G.speed=n;document.querySelectorAll('[data-speed]').forEach(b=>{const on=+b.dataset.speed===n;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))})}
function pauseUI(){const b=$('#pause');if(!b)return;b.innerHTML=icon(G.paused?'play':'pause',14);b.setAttribute('aria-label',G.paused?'Play':'Pause');b.classList.toggle('on',!!G.paused)}
function togglePause(){G.paused=!G.paused;pauseUI();updateHUD(true)}
