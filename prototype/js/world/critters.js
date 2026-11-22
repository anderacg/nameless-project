'use strict';
/* ---------- critters: wild game to hunt, and the livestock of the holdings' pastures ---------- */
// W.critters: {crit:true, id, x, y, hx, hy, n, home (holding name, livestock only), t, a, dir, tire, cool, milked}
// a herd on the map (plain data, saved as it is; made a Herd in place: asHerd): a world object (parties.js). Wild game roams,
// is seen, hovered and met (hunted). Livestock lives in its holding's pasture: drawn there with the estate, inside its fence
// (penEnts, from structures.js holdingEnts), never a figure of its own; a holding with no pasture keeps its animals out of sight.
// Nothing is bought from a herd: the pasture's meat, milk, cheese and wool go to its holding (economy.js)
class Herd extends WorldObject{
  get mapKind(){return 'critter'}
  // its record in a save (HERD_KEYS, below)
  toJSON(){return packs()?packRec(this,HERD_KEYS,['crit','t','a']):this}
  here(){return W.critters.includes(this)}
  get meetsAnyTime(){return true}
  get wild(){return !CRITTERS[this.id].live}
  meet(){this.cool=4;if(this.wild)hunt(this)}
  // its holding's pasture fields, where it lives (livestock only; none: no pasture, or none worked)
  pasture(){return !this.wild&&this.home&&fieldsOf(townBy(this.home),'pasture')||null}
  inView(V){return this.wild&&spotted(this,V)}
  pick(at){if(!this.wild||!this.inView(at.V)||B?.world?.hides(this))return;
    const F=HERD_FLOCK.get(this)||herdFlock(this,critterArt(this.id,0,this.coat||0),performance.now()),tol=G.mouse.type==='touch'?MARCH_PICK.tap*VW/(cv.clientWidth||VW):0;
    for(let i=0;i<F.m.length;i++){const m=F.m[i],a=critterArt(this.id,0,(this.coat||0)+i),f=WorldCombat.figure(this,m,i),w=a.w/2+tol,h=a.h+tol;
      if(at.x>=m.x-w&&at.x<=m.x+w&&at.y>=m.y-h&&at.y<=m.y+tol)at.add(f,Math.hypot(w,h)+1,a.h/2)}
  }
  // up to three of its animals, behind and beside the first, a walk of PX.MAP_STEPS frames to a body length walked (critterSprite;
  // render.js stepOf), its count near you; each at its own place to the screen's pixel (render.js subT)
  // (each of its animals on its own, a loose unit round its point (herdFlock), each its own figure in the scene: its own lift, before or
  // behind what stands by it; the herd's ring and marker at its point)
  draw(ents,cam,V){if(!this.inView(V)||B?.world?.hides(this))return;const c=this;if(WORLD_BATTLE.on)marchCircle(ents,c,cam,Math.max(WORLD_BATTLE.outer,WORLD_BATTLE.inner+Math.sqrt(c.n||1)*2),'#b4c985');
    // (each animal its battle figure, as it is in a hunt, at the marchers' scale (gfx/sprites.js critterArt), its own coat: the herd's
    // coat picked once (coat), not from its home (hx, hy), which a fleeing herd moves every frame: its coats flashed, the owner
    // 2026-11-13: "The wildlife sprite flashing, like it changes the color"); its legs by its own steps (d), its pose by its own time
    const v0=c.coat??(c.coat=Math.floor((c.hx||0)+(c.hy||0))),A=critterArt(c.id,0,v0),N=PX.MAP_STEPS,stride=Math.max(4,A.w)/N,F=herdFlock(c,A,performance.now());
    // (what it shows held steady (flockHold): the herd's doing as drawn, each animal's legs walking or still: never flickering frame to frame)
    const now=performance.now(),st=flockSt(F,c.st,now);
    F.m.forEach((m,i)=>{const go=flockHold(m,'g',herdGoes(c,m),now,WILD_LIFE.flock.hold.go);grassFoot(m.x,m.y,go,true,m);if(typeof stepPrint==='function'&&!CRITTERS[c.id].live)stepPrint(m,true,c);ents.push({x:m.x,y:m.y,f:()=>{subT(m);const q=herdPose(c,i,go,go?Math.floor(m.d/stride)%N:0,st,m),a=critterArt(c.id,q.fr,v0+i,q.how),w=Math.max(4,a.w-2),x=Math.round(m.x-cam.x),y=Math.round(m.y-cam.y);
      // (in the drawn water it wades, as a marcher does (herdWade): under it from its feet up, no shadow, no leap; else on its shadow)
      const cut=herdWade(m,a),sx=m.f<0?-a.k:a.k,bx=-(a.s.width>>1),by=-a.s.height+(a.k<1?2:1);
      if(!cut){ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x-(w>>1),y-1,w,2)}
      ctx.save();ctx.translate(x,y-(cut?0:q.up));ctx.scale(sx,a.k);if(cut){ctx.beginPath();ctx.rect(bx-8,by-8,a.s.width+16,a.s.height+8-cut);ctx.clip()}ctx.drawImage(a.s,bx,by);ctx.restore();
      if(cut)drawWading(a.s,x,y,sx,a.k,bx,by,cut,v0+i,go,cam);
      if(i)return;if(WORLD_BATTLE.on)BANNERQ.push({o:c,marker:{h:A.h,col:'#b4c985'}});else if(c.n>1&&DEV.on&&c.fromYou()<90)txt(String(c.n),Math.round(c.x-cam.x),Math.round(c.y-cam.y)-A.h-4,'#c8e0a0','center')}})})}
  tip(){const D=CRITTERS[this.id];return this.wild?'<b>'+D.n+(this.n>1?' ×'+this.n:'')+'</b><small>Wild game</small><span class="act">Click: hunt</span>':''}// (livestock: never hovered)
}
const asHerd=asClass(Herd);
/* (each of a herd's animals drawn by what the herd does (HERD_MIND st): fleeing, a gallop, its bounders leaping (WILD_LIFE.bound px,
   the hoppers hop) its own beat behind the first; bedded down at night, lying; grazing, its head down to the grass for graze s, then
   up for look s, each animal on its own time; drinking at the water's edge, its head down; wary, its head up, still; else walking as
   it steps. how: critterArt's pose; fr: its step; up: px over its shadow; st: the herd's doing as drawn (flockSt); m: the animal,
   its leaps by the ground it covers (WILD_LIFE.leap px a leap), never on the clock) */
function herdPose(c,i,go,fr,st=c.st,m){const L=WILD_LIFE,now=performance.now()/1000;
  if(st==='flee'&&go){const b=L.bounders.includes(c.id)?L.bound:L.hoppers.includes(c.id)?L.hop:0;return{how:'run',fr,up:b?Math.round(b*Math.abs(Math.sin(((m?m.d:now*30)/L.leap+i*.37)*Math.PI))):0}}
  if(go)return{how:null,fr,up:0};
  if(st==='bed')return{how:'rest',fr:0,up:0};
  if(st==='drink')return{how:'graze',fr:Math.floor(now*2+i)&1,up:0};
  if(st==='graze'){const g=L.graze,l=L.look,h=PX.hash((c.coat??(c.hx|0))+i,i,7),per=g[0]+h*(g[1]-g[0])+l[0]+h*(l[1]-l[0]),u=(now+h*per)%per;
    if(u<g[0]+h*(g[1]-g[0]))return{how:'graze',fr:Math.floor(now*2.5+i)&1,up:0}}
  return{how:null,fr:0,up:0}}
/* a herd's animals each on its own, a loose unit (the owner, 2026-11-18: "dont make them moving the same, make them move in formation
   like army but more spread like one unit"; WILD_LIFE.flock), drawn only: the herd's point (c.x, c.y) is where it is to the world (a
   hunt, sight, a click), never moved by its animals. Each (up to most) has its spot round that point (flockSpot) and walks to it at its
   own pace, a little behind the herd and catching up when far behind, setting off only once its spot is start px off (the first goes
   first, the rest follow and fan out); none nearer another than keep x its width; facing its way as it walks, else turning on its own
   time, watching who it is wary of; its legs by its own steps (d). Kept beside the herd, never in its record or a save (HERD_FLOCK) */
const HERD_FLOCK=new WeakMap();
function herdFlock(c,A,now){const L=WILD_LIFE.flock,n=Math.min(L.most,Math.max(1,c.n||1)),gap=Math.max(4,A.w)*L.gap,v0=c.coat||0;let F=HERD_FLOCK.get(c);
  if(!F||F.m.length!==n){const old=F&&F.m;F=F?{...F,m:[]}:{t:now,px:c.x,py:c.y,hd:c.dir<0?Math.PI:0,sp:0,m:[]};HERD_FLOCK.set(c,F);// (one more or fewer: the rest kept, and where it last stood, so a leap since is still seen)
    for(let i=0;i<n;i++){if(old&&old[i]){F.m.push(old[i]);continue}const q=flockSpot(c,F,i,n,gap,now,false);F.m.push({x:c.x+q[0],y:c.y+q[1],f:c.dir<0?-1:1,ft:now,d:0,go:false,h:PX.hash(v0,i,41)})}}
  const dt=Math.min(.1,Math.max(0,(now-F.t)/1000)),mx=c.x-F.px,my=c.y-F.py,mv=Math.hypot(mx,my);F.t=now;F.px=c.x;F.py=c.y;
  if(mv>L.snap){F.m.forEach((m,i)=>{const q=flockSpot(c,F,i,n,gap,now,false);m.x=c.x+q[0];m.y=c.y+q[1];m.go=false});return F}// (a leap, not a walk: each straight to its spot)
  // (its heading turned toward its way at most hd rad a s, so its wedge never swings side to side as the herd jinks; on the move by
  //  move's two speeds, held a while at rest, so its animals never switch between their wedge and their blob each frame)
  if(dt>0){F.sp+=(mv/dt-F.sp)*Math.min(1,dt*4);if(mv>.01){const w=Math.atan2(my,mx);if(!F.hdOn){F.hd=w;F.hdOn=true}else{let dh=w-F.hd;dh=Math.atan2(Math.sin(dh),Math.cos(dh));F.hd+=Math.sign(dh)*Math.min(Math.abs(dh),L.hd*dt)}}}
  {const M=L.move;if(!F.mov){if(F.sp>M[0]){F.mov=true;F.calm=0}}else if(F.sp<M[1]){F.calm=F.calm||now;if(now-F.calm>=M[2]*1000)F.mov=false}else F.calm=0}
  const moving=!!F.mov,amble=L.amble*Math.max(1,G.speed||1),wary=c.st==='wary',bed=c.st==='bed';
  F.m.forEach((m,i)=>{const q=flockSpot(c,F,i,n,gap,now,moving),ex=c.x+q[0]-m.x,ey=c.y+q[1]-m.y,e=Math.hypot(ex,ey),st=L.start[0]+m.h*(L.start[1]-L.start[0]);m.go=false;
    if(bed||!(e>st||(m.walk&&e>.3))){m.walk=false;m.vx=0;return}
    m.walk=true;m.drift=!moving&&e<gap*.6;const v=Math.max(F.sp*1.1,amble)*(L.pace[0]+m.h*L.pace[1])*(e>gap?L.catch:1),k=Math.min(1,v*dt/e),sx=ex*k,sy=ey*k;
    m.x+=sx;m.y+=sy;m.d+=Math.hypot(sx,sy);m.go=Math.hypot(sx,sy)>.01;
    // (facing its way by its eased speed across, never by a step's tiny sway or a push from its neighbour)
    m.vx=(m.vx||0)+(sx/Math.max(dt,1e-3)-(m.vx||0))*Math.min(1,dt*6);if(Math.abs(m.vx)>L.face.v)flockFace(m,m.vx>0?1:-1,now)});
  // (kept apart: any two nearer than keep x its width pushed apart, half each, none off the ground it may stand on (flockPush))
  const kp=Math.max(2,A.w*L.keep),dry=typeof drawnWet!=='function'||!drawnWet(c.x,c.y);for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const p=F.m[i],q=F.m[j];let dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy);if(d>=kp)continue;
    if(d<.01){dx=p.h-.5||.3;dy=q.h-.5||.2;d=Math.hypot(dx,dy)}const k=(kp-d)/2/d;flockPush(c,p,-dx*k,-dy*k,dry);flockPush(c,q,dx*k,dy*k,dry)}
  // (standing: each turns on its own time; wary, all watch who comes)
  F.m.forEach((m,i)=>{if(m.go)return;if(wary){flockFace(m,c.dir<0?-1:1,now);return}if(bed)return;const T=L.turn[0]+m.h*(L.turn[1]-L.turn[0]),k=Math.floor(now/1000/T+m.h*5);if(m.tk!==k){if(m.tk!=null)flockFace(m,PX.hash(v0+i,k,53)<.5?-1:1,now);m.tk=k}});
  return F}
// (an animal turned about f, not sooner than face.hold s after its last turn)
function flockFace(m,f,now){if(m.f===f||now-(m.ft??-1e9)<WILD_LIFE.flock.face.hold*1000)return;m.f=f;m.ft=now}
// (a value held steady on o[k]: a new one shown once it has lasted s seconds; the first at once)
function flockHold(o,k,v,now,s){if(o[k]===undefined||o[k]===v){o[k]=v;o[k+'n']=undefined;return v}if(o[k+'n']!==v){o[k+'n']=v;o[k+'t']=now}if(now-o[k+'t']>=s*1000){o[k]=v;o[k+'n']=undefined}return o[k]}
// (the herd's doing as its animals show it: fleeing at once, any other once it has lasted hold.st s, so a herd caught between flight
//  and watching never flickers from a gallop to a walk)
function flockSt(F,st,now){if(st==='flee'){F.st='flee';F.stn=undefined;return st}return flockHold(F,'st',st,now,WILD_LIFE.flock.hold.st)}
// (does it walk, its legs moving? not one only drifting about its spot while its herd grazes, drinks or lies: it shifts as it grazes)
const herdGoes=(c,m)=>m.go&&!(m.drift&&(c.st==='graze'||c.st==='drink'||c.st==='bed'));
// (an animal's spot about its herd's point: a hunt's scatter (c.m) its own; on the way, a loose wedge behind the first along the herd's
//  way, its ranks gap apart and its files to either side, jittered, flee x wider as it bolts; at rest a loose blob round the point,
//  each drifting about its spot over its own time, a herd of split.n or more in two knots that drift apart and back)
function flockSpot(c,F,i,n,gap,now,moving){const m=c.m&&c.m[i];return m?[m.dx,m.dy]:flockLand(c,flockOut(c,F,i,n,gap,now,moving))}
function flockOut(c,F,i,n,gap,now,moving){const L=WILD_LIFE.flock,v0=c.coat||0,h1=PX.hash(v0,i,17),h2=PX.hash(v0,i,29),j=L.jit*gap,t=now/1000;
  if(moving||c.st==='flee'){const k=c.st==='flee'?L.flee:1,r=Math.ceil(i/2),back=gap*.9*r*k+(i?(h1-.5)*j:0),side=i?(i%2?1:-1)*gap*(.45+.5*h2)*k:0,ca=Math.cos(F.hd),sa=Math.sin(F.hd);
    return [-back*ca-side*sa,-back*sa+side*ca]}
  const W0=L.wander,wa=W0[0]*gap,wp=W0[1]+h1*(W0[2]-W0[1]),ang=i*2.39996+h1*.9,rad=i?gap*(.5+.8*Math.sqrt(i/n))+(h2-.5)*j:0;
  let x=Math.cos(ang)*rad+Math.sin(t*6.283/wp+h2*6)*wa,y=Math.sin(ang)*rad*.7+Math.cos(t*6.283/(wp*1.3)+h1*6)*wa*.7;
  const S=L.split;if(n>=S.n){const per=S.per[0]+PX.hash(v0,0,61)*(S.per[1]-S.per[0]),u=.5-.5*Math.cos(t*6.283/per+PX.hash(v0,1,61)*6),ga=PX.hash(v0,2,61)*6.283,off=u*S.far*gap*.5*(i%2?1:-1);x+=Math.cos(ga)*off;y+=Math.sin(ga)*off*.7}
  return [x,y]}
/* the ground under each animal (the owner, 2026-11-21: "Wildlife doesnt seems to be effected by water, rivers or hills?"). Its herd's
   point kept to its habitat, off water and never over a ledge (HERD_MIND, world.js walk), but each animal's own spot about it was
   checked against nothing: one in twelve herds had an animal standing on a river, a mountain, a lot or the far side of a cliff.
   flockOk: may an animal of herd c stand at (x, y)? Ground it could walk to from its herd's point: no water tile and no mountain, no
   ledge between, wild game off the holdings' lots, livestock on its own grazing; dry: and off the drawn water (a brook or a bank's
   over the land), asked while its herd's own point is dry. flockLand: its spot q pulled in toward its herd's point (WILD_LIFE.flock
   .pull shares of its way out) to the first it may stand on, the point itself if none.
   herdWade: one in the drawn water all the same (crossing a brook its herd stands in, or on its way round a pool) wades as a man
   does: the water up its picture by its depth (march.js wadeCut, a man's figure px made its own by their two scales), WILD_LIFE.wade.most of it
   at most (its back and head out: swimming) */
function flockOk(c,x,y,dry){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);if(tx<0||ty<0||tx>=MW||ty>=MH||!passable(tAt(tx,ty))||!ledgePass(c.x,c.y,x,y))return false;
  if(dry&&typeof drawnWet==='function'&&drawnWet(x,y))return false;return CRITTERS[c.id].live?grazeOk(c.id,x,y,c.pen):!(OCC&&occAt(tx,ty))}
function flockLand(c,q){const dry=typeof drawnWet!=='function'||!drawnWet(c.x,c.y);for(const k of WILD_LIFE.flock.pull)if(flockOk(c,c.x+q[0]*k,c.y+q[1]*k,dry))return k===1?q:[q[0]*k,q[1]*k];return [0,0]}
// (an animal pushed (dx, dy) by its neighbour, but never from ground it may stand on to ground it may not)
function flockPush(c,m,dx,dy,dry){if(flockOk(c,m.x+dx,m.y+dy,dry)||!flockOk(c,m.x,m.y,dry)){m.x+=dx;m.y+=dy}}
function herdWade(m,a){if(typeof drawnWet!=='function'||!drawnWet(m.x,m.y))return 0;const K=WILD_LIFE.wade,d=wadeCut(drawnDepth(m.x,m.y))||WATER.cut[1];
  return Math.max(1,Math.min(Math.round(a.s.height*K.most),Math.round(d*WORLD_BATTLE.sprite/WORLD_BATTLE.scale/a.k)))}
// (its record in a save: packed on a generated world, worldobject.js packRec, its grazing drawn again on its next moment (t, a:
// 0); herdRec reads it back, either way)
const HERD_KEYS=['id','x','y','hx','hy','n','dir','tire','cool','idle','escapeSta'];
const herdRec=o=>Array.isArray(o)?asHerd(unpackRec(o,HERD_KEYS,{crit:true,t:0,a:0})):o;
// the wild herds on the map (render.js drawWorld); livestock is drawn with its pasture (penEnts)
function drawHerds(ents,cam,V){for(const c of W.critters.map(asHerd))if(c.wild)c.draw(ents,cam,V)}
// a pasture's herd, drawn with its estate (structures.js holdingEnts, while its pasture is in sight): its animals inside the
// fence, a cow to a fenced tile or two of the smaller kinds (one at the front of the tile, one at the back), each grazing a while
// then walking to another spot by the clock (PEN_WALK), on its own tile or, every other walk, on the next tile of the pen (two
// tiles side by side: a straight walk never crosses a fence), its legs moving only as it walks, never past its fence (penSpots: where each stands at time now: x, y its
// feet, a its picture, flip). None while the pasture has no worked fields or no herd. Seen only: the pasture answers a click
// (estates.js), its Pens tell of the herd
function penSpots(t,now){const c=herdOf(t),F=c&&fieldsOf(t,'pasture');if(!F)return [];const T=F.tiles,per=CRITTERS[c.id].size>=3?1:2,out=[],W0=PEN_WALK,sec=now/1000;
  for(let j=0;j<Math.min(c.n,T.length*per);j++){const [tx,ty]=T[j%T.length],sd=t.seed+j*31,h=hash(tx,ty,sd),L=W0.seg[0]+h*(W0.seg[1]-W0.seg[0]),
    a0=critterArt(c.id,0,j),amp=Math.max(0,Math.min(W0.roam,(TILE-4-a0.w)>>1)),y0=ty*TILE+(j<T.length?TILE-3:TILE-8),
    nb=[[0,0],...[[1,0],[-1,0],[0,1],[0,-1]].filter(([a,b])=>T.some(q=>q[0]===tx+a&&q[1]===ty+b))],
    at=k=>{const [ox,oy]=k&1?nb[Math.floor(hash(k,tx+ty,sd)*nb.length)]:[0,0];return[(tx+ox)*TILE+TILE/2+(hash(tx*7+k,ty,sd)*2-1)*amp,y0+oy*TILE+(j<T.length?-1:1)*hash(tx,ty*7+k,sd)*W0.yAmp]},// (the front row a little back, the back row a little forward: both clear of the fence)
    u=sec/L+h*7,k=Math.floor(u),A=at(k),B=at(k+1),Z=at(k-1),d=Math.hypot(B[0]-A[0],B[1]-A[1]),go=Math.min(d/W0.walk,L*.6),r=(u-k)*L-(L-go),
    f=r>0&&go>0?r/go:0,x=A[0]+(B[0]-A[0])*f,y=A[1]+(B[1]-A[1])*f,fr=f>0?1+Math.floor(f*d/W0.stride)%(PX.MAP_STEPS-1):0,
    dx=f>0?B[0]-A[0]:A[0]-Z[0];out.push({x,y,a:fr?critterArt(c.id,fr,j):a0,flip:dx<0,tx,ty})}
  return out}
// (each at its pen's lift, its barn's, as its ground is drawn (structures.js drawLotGround), not its own spot's: on a slope it stood
// past the fence (liftDraw lifts it by its own, LIFT_NOW))
// (PEN_ENTS: the pens' animals, handed from the holdings' pass (structures.js, drawn into the scene at the game's pixels, where a figure at
// the marchers' scale lost every other pixel: "sticks") to those who move (render.js drawWorld), drawn at the screen's pixels as
// in a battle; the owner, 2026-11-13: "For pasture use the same drawing in battle")
const PEN_ENTS=[];
function penEnts(t,ents,cam){const p=bldSpots(t).pasture,L0=p&&typeof liftAt==='function'?liftAt(p.x,p.y):0;penSpots(t,performance.now()).forEach((s0,j)=>ents.push({x:s0.x,y:s0.y,f:()=>{const s=penSpots(t,performance.now())[j];if(!s)return;ctx.save();subT(s);const x=Math.round(s.x-cam.x),sy=Math.round(s.y-cam.y-(p?L0-LIFT_NOW:0)),w=Math.max(4,s.a.w-2);// (its fraction of a pixel kept inside save/restore: drawn into the scene, a shift left over would pile up frame on frame)
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x-(w>>1),sy-1,w,2);ctx.translate(x,sy);ctx.scale(s.flip?-s.a.k:s.a.k,s.a.k);ctx.drawImage(s.a.s,-(s.a.s.width>>1),-s.a.s.height+(s.a.k<1?2:1));ctx.restore()}}))}
// (the wild game's and the herds' own dice: the stream 'critters', core/rng.js, so a kind added or a spawning rule changed never
// moves the world's Math.random)
const critRng=()=>rngOf('critters');
function spawnCritter(initial){
  const ids=Object.keys(CRITTERS).filter(k=>!CRITTERS[k].live),wt=id=>CRITTERS[id].w/(1+W.critters.filter(c=>c.id===id).length*.3);
  const R=critRng();
  let r=R.next()*ids.reduce((a,id)=>a+wt(id),0),id=ids[0];for(const f of ids){r-=wt(f);if(r<=0){id=f;break}}
  const D=CRITTERS[id];
  for(let k=0;k<200;k++){
    const x=R.int(2,MW-3)*TILE+8,y=R.int(2,MH-3)*TILE+8,tags=habitatAt(x,y);
    if(!D.where.some(w=>tags.includes(w))||wildTame(x,y)||D.where.includes('forest')&&!tags.includes('forest')&&R.next()>CRITTER_WOODS.keep||D.rare&&tags.some(g=>D.rare[g]!=null&&R.next()>D.rare[g])||Math.hypot(x-P.x,y-P.y)<WORLD_SCALE.spawn.critter[initial?0:1]||TOWNS.some(t=>Math.hypot(t.x-x,t.y-y)<WORLD_SCALE.spawn.critterHold))continue;
    W.critters.push(asHerd({crit:true,id,x,y,hx:x,hy:y,n:R.int(D.herd[0],D.herd[1]),t:0,a:0,dir:1,tire:0,cool:0}));return;
  }
}
// can this kind of livestock stand here? its own ground and climate, never a road, a holding's yard, or another estate's plot
const GROUND_OF={[T_OPEN]:'open',[T_HILL]:'hills',[T_FOREST]:'forest'};
function grazeOk(id,x,y,pen){
  if(pen&&pen.town){const F=fieldsOf(townBy(pen.town),pen.k);return F?onFields(F,x,y):true}// (a pasture's fields: estates.js)
  if(pen)return x>=pen.x&&x<=pen.x+pen.w&&y>=pen.y&&y<=pen.y+pen.h;
  const G0=GRAZE[id];if(!G0)return passable(terrAt(x,y));const g=GROUND_OF[terrAt(x,y)];
  if(!g||!G0.on.includes(g)||G0.clim&&!G0.clim.includes(climAt(x,y)))return false;
  return !isClear(x,y);
}
// wild game wanders inside its habitat
const habitatOk=(id,x,y)=>{const tags=habitatAt(x,y);return CRITTERS[id].where.some(w=>tags.includes(w))};
// (the holdings' ground wild game keeps out of: a tile of a lot, or within WILD_LIFE.town px of a holding; a tile each, made again each
//  day and as lots are placed (lots.js lotN))
const WILD_TAME={key:null,m:null};
function wildTame(x,y){const T=WILD_TAME,tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);if(tx<0||ty<0||tx>=MW||ty>=MH)return true;
  const key=G.day+':'+lotN+':'+TOWNS.length;if(!T.m||T.key!==key||T.m.length!==MW*MH){const m=T.m=new Uint8Array(MW*MH),r=WILD_LIFE.town,R=Math.ceil(r/TILE);T.key=key;
    for(const t of TOWNS){const cx=Math.floor(t.x/TILE),cy=Math.floor(t.y/TILE);for(let j=Math.max(0,cy-R);j<=Math.min(MH-1,cy+R);j++)for(let i=Math.max(0,cx-R);i<=Math.min(MW-1,cx+R);i++)if(Math.hypot((i+.5)*TILE-t.x,(j+.5)*TILE-t.y)<r)m[j*MW+i]=1}
    if(OCC)for(let j=0;j<MH;j++)for(let i=0;i<MW;i++)if(occAt(i,j))m[j*MW+i]=1}
  return T.m[ty*MW+tx]===1}
onWorld(()=>{WILD_TAME.m=null});
// (where wild game may step: its habitat, off the holdings' ground)
const wildOk=(id,x,y)=>habitatOk(id,x,y)&&!wildTame(x,y);
// (water within r tiles of a herd: a dry tile of its habitat at its edge, the nearest, to drink from; null for none)
function wildWater(c,r){const tx=Math.floor(c.x/TILE),ty=Math.floor(c.y/TILE);let best=null,bd=1e9;
  for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const a=tx+i,b=ty+j;if(a<1||b<1||a>=MW-1||b>=MH-1||tAt(a,b)!==T_WATER)continue;
    for(const [ox,oy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=(a+ox+.5)*TILE,y=(b+oy+.5)*TILE;if(tAt(a+ox,b+oy)===T_WATER||!wildOk(c.id,x,y))continue;const d=Math.hypot(x-c.x,y-c.y);
      if(d<bd){bd=d;best={x:x-ox*(TILE/2-2),y:y-oy*(TILE/2-2)}}}}
  return best}
// (a copy of a shuffled by binary insertion, a draw a comparison: what sort(()=>Math.random()-.5) did on a fresh page. That sort
// is not a function of its draws: once the browser optimizes its caller it compares in another order and draws fewer, so a
// new game's later draws hung on how warm the page was)
function drawShuffle(a){const R=critRng();a=a.slice();for(let s=1;s<a.length;s++){const p=a[s];let l=0,r=s;while(l<r){const m=(l+r)>>1;if(R.next()-.5<0)r=m;else l=m+1}a.splice(s,1);a.splice(l,0,p)}return a}
/* a pasture's herd: one of its land's animals (PASTURE_HERD), its people's taste tipping the choice, the same for a holding every
   game (its own hash). Its land: the climate where its barn stands; on the grass, hills or the forest's edge round it
   (PASTURE_LAND; the land as it lay before the estates' tracks, lots.js kindWas), else grass. What the pasture makes of it: its
   kind's own make, else MAKE.pasture's (estates.js Estate makes) */
function pastureLand(t){
  const l=lotAt(t,'pasture'),x0=l?l.x+(l.n>>1):t.tx,y0=l?l.y+(l.n>>1):t.ty,c=climAt((x0+.5)*TILE,(y0+.5)*TILE),L=PASTURE_LAND;if(c!=='grass')return c;
  const was=trackWas();let n=0,hill=0,wood=0;for(let y=y0-L.r;y<=y0+L.r;y++)for(let x=x0-L.r;x<=x0+L.r;x++){const g=kindWas(was,x,y);n++;if(g===T_HILL||g===T_MOUNT)hill++;else if(g===T_FOREST)wood++}
  return hill>=n*L.hill?'hills':wood>=n*L.wood?'forest':'grass'}
function pastureHerd(t){
  const ks=PASTURE_HERD[pastureLand(t)],like=LIVESTOCK[t.races[0]]||LIVESTOCK.human,w=ks.map(k=>like.includes(k)?PASTURE_LAND.taste:1);
  let r=hash(t.tx,t.ty,93)*w.reduce((a,b)=>a+b,0);for(let i=0;i<ks.length;i++){r-=w[i];if(r<0)return ks[i]}return ks[ks.length-1]}
const herdMake=t=>CRITTERS[pastureHerd(t)].make||MAKE.pasture.out;
// (a herd of a holding with a pasture: of the kind its pasture keeps (one that grazed by the holding before its pasture was built)
function herdKind(c){const t=c.home&&townBy(c.home);if(!t||!bldLv(t,'pasture'))return;const id=pastureHerd(t);if(c.id!==id){c.id=id;c.n=Math.min(c.n,CRITTERS[id].herd[1])}}
// one herd grazing beside a holding, of an animal its people keep and its land can feed: inside the pasture fence if it has one
// (of its pasture's kind: pastureHerd)
function spawnHerd(t){
  const kinds=drawShuffle(LIVESTOCK[t.races[0]]||LIVESTOCK.human),sp=typeof bldSpots==='function'&&bldLv(t,'pasture')?bldSpots(t).pasture:null;
  // (a pasture's herd grazes the middle of its fields (or round the barn, if it has none), a sight to see: its herders are met at
  // the pasture itself (estates.js estateMeet))
  if(sp){const F=fieldsOf(t,'pasture'),lv=bldLv(t,'pasture'),w=16+6*lv,h=12+3*lv,pen=F?{town:t.name,k:'pasture'}:{x:sp.x-w/2+3,y:sp.y-h/2+3,w:w-6,h:h-6},at=F||sp,
      id=pastureHerd(t),D=CRITTERS[id];
    W.critters.push(asHerd({crit:true,decor:true,id,x:at.x,y:at.y,hx:at.x,hy:at.y,pen,n:critRng().int(D.herd[0],D.herd[1]),home:t.name,t:0,a:0,dir:1,tire:0,cool:0,milked:0}));return true}
  for(const id of kinds){const D=CRITTERS[id],near=id==='hen';
    for(let k=0;k<160;k++){const R=critRng(),a=R.next()*6.283,d=(near?22:30)+R.next()*(near?10:18)+k*.5,// wider out if it finds no room close by
      x=t.x+Math.cos(a)*d,y=t.y+12+Math.sin(a)*d;
      // the spot and the ground around it, so the herd has room to graze
      if(!grazeOk(id,x,y)||[[8,0],[-8,0],[0,6],[0,-6]].filter(([a2,b2])=>grazeOk(id,x+a2,y+b2)).length<3)continue;
      W.critters.push(asHerd({crit:true,id,x,y,hx:x,hy:y,n:critRng().int(D.herd[0],D.herd[1]),home:t.name,t:0,a:0,dir:1,tire:0,cool:0,milked:0}));return true}}
  return false;
}
const herdOf=t=>W.critters.find(c=>c.home===t.name);
// (a pasture herd from before: moved to the middle of its fields, to be seen only)
function herdToFields(c){herdKind(c);const t=c.home&&townBy(c.home),F=t&&bldLv(t,'pasture')&&fieldsOf(t,'pasture');if(!c.pen||!t)return;c.decor=true;if(F&&!c.pen.town){c.pen={town:t.name,k:'pasture'};c.x=c.hx=F.x;c.y=c.hy=F.y}}
// (the wild game: as much as the world's density, data/world.js)
function initCritters(){TOWNS.filter(t=>t.T.herds).forEach(spawnHerd);for(let i=0,n=density(WM).critterStart;i<n;i++)spawnCritter(true)}
// each day: game returns, herds regrow and empty pastures restock
function critterDay(){
  const R=critRng(),D=density(WM);
  for(let k=0;k<D.daily.critters;k++)if(W.critters.filter(c=>!c.home).length<D.critterCap&&R.chance(.7))spawnCritter(false);
  for(const c of W.critters){herdKind(c);const D=CRITTERS[c.id];if(c.n<D.herd[1]&&R.chance(c.home?.35:.15))c.n++}
  TOWNS.filter(t=>t.T.herds&&!herdOf(t)&&R.chance(.25)).forEach(spawnHerd);
}
// Nearby people and beasts spook game even outside the player's view. Runtime caches never enter saves.
class WildlifeThreats{
  static index=Spatial.index([]);
  static chosen=new WeakMap();
  static present(o){return o&&!o.dead&&!o.gone&&!o.inside&&Number.isFinite(o.x)&&Number.isFinite(o.y)}
  /* the threats indexed each frame: those where herds think (worldobject.js lodBox: the mid rings round you, the shyest's reach
     wider), from the chunk grid in the lists' order (the parties, caravans, refugees and beasts: tags to LOD_TAG.monster), and
     the workers in sight and the hunters out (world/hunters.js); a herd asking from beyond it (the tiers off, or a test) has the whole world indexed for it (all), as
     it always was */
  static rebuild(){const b=lodBox(this.shy()+WORLD_LOD.lag),L=this.list||(this.list=[]);L.length=0;this.all=null;this.box=lodBox(0);
    if(b){const G=lodGrid();G.box(b[0],b[1],b[2],b[3],L);let n=0;for(const o of L)if(G.tag.get(o)<=LOD_TAG.monster&&o!==P&&this.present(o))L[n++]=o;L.length=n;for(const f of W.folk)if(folkSeen(f)&&this.present(f))L.push(f);for(const h of Hunters.list)if(this.present(h))L.push(h);this.index.rebuild(L)}
    else this.index.rebuild(this.everyone())}
  static everyone(){return [...new Set([...W.parties,...W.caravans,...W.refugees,...W.monsters,...W.folk.filter(folkSeen),...Hunters.list])].filter(o=>o!==P&&this.present(o))}
  static shy(){if(this.most==null){this.most=0;for(const k in CRITTERS)this.most=Math.max(this.most,CRITTERS[k].shy||0)}return this.most}
  static indexFor(c){if(lodIn(this.box,c.x,c.y))return this.index;return this.all||(this.all=Spatial.index(this.everyone()))}
  // (each seen within its shy reach, less under cover, and a hunter stalking it only within his share of it, noticeAt: world/hunters.js)
  static target(c){
    const D=CRITTERS[c.id];if(!D||D.live)return null;
    const player=TravelAwareness.target(c),near=this.indexFor(c).within(c.x,c.y,D.shy).filter(o=>this.present(o)&&Math.hypot(o.x-c.x,o.y-c.y)<D.shy*(hiddenAt(o.x,o.y)?WILDLIFE_AWARE.cover:1)*(o.noticeAt??1));
    if(player)near.push(player);
    const distance=o=>Math.hypot(o.x-c.x,o.y-c.y),previous=this.chosen.get(c);
    let target=Spatial.nearest(near,c.x,c.y);
    // Keep an escape heading until another threat is clearly closer.
    if(previous&&near.includes(previous)&&target&&distance(target)>=distance(previous)*WILDLIFE_AWARE.switch)target=previous;
    if(target)this.chosen.set(c,target);else this.chosen.delete(c);
    return target;
  }
}
onWorld(()=>{WildlifeThreats.index.rebuild([]);WildlifeThreats.chosen=new WeakMap()});
// (an animal's place in its herd, i: x, y px about its point, its facing's way: the first three as drawn (Herd draw), the rest on
//  theirs in turn; sp: the herd's spacing, its art's)
const herdSp=c=>Math.max(4,Math.round(critterArt(c.id,0,c.coat??Math.floor((c.hx||0)+(c.hy||0))).w*.55));
function herdSlot(c,i,sp){const j=i%3,ox=j===0?0:j===1?-sp:Math.round(sp*.4),oy=j===0?0:j===1?-1:-3;return {x:c.dir<0?-ox:ox,y:oy}}
// (a herd scattered by a hunt (HERD_SCATTER, battle/hunting.js finish: m, each animal's spot about its point, its facing f, whether it
// walks, go): its animals drawn there by its flock (flockSpot), back to their places as they gather (herdGather))
// (its animals walk back to their places, HERD_SCATTER.gather px a s, carried along as the herd moves (mx, my this step); all
//  within near px of theirs: the herd as before)
function herdGather(c,d,mx,my){const X=HERD_SCATTER,sp=herdSp(c),st=moveStep(X.gather,d);let back=true;if(c.m.length>(c.n||0))c.m.length=c.n||0;
  c.m.forEach((m,i)=>{const q=herdSlot(c,i,sp),ex=q.x-m.dx,ey=q.y-m.dy,e=Math.hypot(ex,ey);let gx=0,gy=0;if(e>X.near){const k=Math.min(1,st/e);gx=ex*k;gy=ey*k;m.dx+=gx;m.dy+=gy;back=false}
    const vx=gx+mx;m.go=Math.hypot(vx,gy+my)>.01;if(Math.abs(vx)>.05)m.f=vx>0?1:-1});
  if(back)delete c.m}
// Move every herd: wild game bolts from perceived threats and tires as it runs; livestock just grazes.
// a herd's moment (parties.js lodThink; hide: how well you are hidden from it). Hunting is an explicit choice.
const HERD_MIND={think(c,d,hide){
    const A=WORLD_SCALE.ai,D=CRITTERS[c.id],threat=WildlifeThreats.target(c),ox=c.x,oy=c.y;c.cool=Math.max(0,c.cool-d);
    // (fleeing: its grazing ground goes with it, and it keeps on away a little after, so it does not turn back into you)
    if(threat){const sp=moveStep(D.spd*Math.min(1,speedAt(c.x,c.y)||1),d);Router.flee(c,threat,sp);
      c.hx=c.x;c.hy=c.y;c.a=Math.atan2(c.y-threat.y,c.x-threat.x);c.t=Math.max(c.t,1.5);c.idle=false;c.st='flee';c.drink=null}
    // (still bolting from a hunt (HERD_SCATTER.run): on the way its animals ran, at their speed, till it tires of it or is stopped)
    else if(c.run>0){c.run-=d;if(!walk(c,Math.cos(c.a),Math.sin(c.a),moveStep(D.spd*Math.min(1,speedAt(c.x,c.y)||1),d),(x,y)=>habitatOk(c.id,x,y)))c.run=0;c.hx=c.x;c.hy=c.y;c.idle=false;c.st='flee'}
    // (else, its moment between flights (between: wary, bedded down; not on a holding's ground, which it walks off first), or grazing
    //  and wandering, now and then to water)
    else if(D.live||wildTame(c.x,c.y)||!this.between(c,D,d)){c.t-=d;if(c.t<=0){const R=critRng();c.t=2+R.next()*4;c.a=R.next()*6.283;c.idle=R.chance(.5);c.st=null;
        // (a wild one now and then walks to water near it to drink: WILD_LIFE.drink)
        const L=WILD_LIFE.drink;if(!D.live&&R.chance(L.chance)){const w=wildWater(c,L.r);if(w){c.drink=w;c.idle=false}}}
      const hx=c.hx-c.x,hy=c.hy-c.y;if(Math.hypot(hx,hy)>(D.live?(c.pen?A.penLeash:A.herdLeash):A.gameLeash))c.a=Math.atan2(hy,hx);
      if(c.drink){const dx=c.drink.x-c.x,dy=c.drink.y-c.y;if(Math.hypot(dx,dy)<=WILD_LIFE.drink.at){c.st='drink';c.t=critRng().next()*(WILD_LIFE.drink.time[1]-WILD_LIFE.drink.time[0])+WILD_LIFE.drink.time[0];c.idle=true;c.dir=dx>=0?1:-1;c.drink=null}else c.a=Math.atan2(dy,dx)}
      // (wild game on a holding's ground (a lot, or by the holding) walks off it, away from the holding: WILD_LIFE.town)
      const tame=!D.live&&wildTame(c.x,c.y);if(tame){let t=null,td=1e9;for(const h of TOWNS){const e=Math.hypot(h.x-c.x,h.y-c.y);if(e<td){td=e;t=h}}if(t)c.a=Math.atan2(c.y-t.y,c.x-t.x);c.idle=false;c.drink=null}
      if(c.st!=='drink')c.st=c.idle?'graze':'walk';
      if(!c.idle){const ok=D.live?(x,y)=>grazeOk(c.id,x,y,c.pen):tame?(x,y)=>habitatOk(c.id,x,y):(x,y)=>wildOk(c.id,x,y);if(!walk(c,Math.cos(c.a),Math.sin(c.a),moveStep(D.live?4:8,d),ok)){c.a=Math.atan2(hy,hx)+(critRng().next()-.5);c.idle=true;c.drink=null;c.st='graze'}}}
    // (it faces the way it went, turning only on a clear step sideways: no flicker as it swerves or runs straight up or down)
    {const mx=c.x-ox,my=c.y-oy;if(Math.abs(mx)>Math.hypot(mx,my)*.35&&Math.abs(mx)>.01)c.dir=mx>0?1:-1;if(c.m)herdGather(c,d,mx,my)}

    return false},
  // (between its flights (WILD_LIFE): anyone within wary × its shy reach and it stops, its head up, facing him; in the dark it beds
  //  down where it stands. true while it holds so)
  between(c,D,d){const L=WILD_LIFE,r=D.shy*L.wary,P0=!P.stay&&!P.inside?P:null;let w=P0&&Math.hypot(P0.x-c.x,P0.y-c.y)<r?P0:null;
    if(!w)for(const o of WildlifeThreats.indexFor(c).within(c.x,c.y,r))if(WildlifeThreats.present(o)){w=o;break}
    if(w){c.st='wary';c.idle=true;c.drink=null;if(Math.abs(w.x-c.x)>1)c.dir=w.x>c.x?1:-1;return true}
    if(darkness()>=L.night){c.st='bed';c.idle=true;c.drink=null;return true}
    if(c.st==='bed'||c.st==='wary')c.st=null;return false},
  // far from you (the far tier, worldobject.js): it holds where it grazes (doc/WORLD_DESIGN.md §3.5: game wanders only near you)
  farStep(){return false}};
function updateCritters(d){WildlifeThreats.rebuild();return lodEach(W.critters,HERD_MIND,d,P.stay?0:hiddenAt(P.x,P.y)?.6:1)}
// One collected animal pays the existing meat, materials and experience rewards.
function hunt(c){return WildHunt.prepare(asHerd(c))}
function huntRewards(c,kills,paidXp=0){
  const D=CRITTERS[c.id];
  const meat=invAdd('good','meat',kills*D.meat),got=[meat+' meat'];if(meat)worldEmit('meat:hunted',{n:meat});// (a meat job counts it: world/quests.js HuntQuest)
  if(D.mat){let m=0;for(let i=0;i<kills;i++)if(critRng().chance(D.mat[1]*(1+.05*skill('hunt'))))m++;if(m){const k=invAdd('mat',D.mat[0],m);if(k)got.push(k+' '+MATS[D.mat[0]].n.toLowerCase()+(k>1?'s':''))}}
  gainXp(Math.max(0,kills*D.xp-paidXp),'hunt');train('hunt',kills*3);
  log('You bring down '+(kills>1?kills+' '+D.n.toLowerCase():an(D.one))+': '+got.join(', ')+'.'+(meat<kills*D.meat?' Your bag is full, so you leave some meat.':''),'good');
  updateHUD(true);
}
/* sprites: the animals on the world map's scale (doc/WORLD_DESIGN.md §10.1: a person stands 10 high there, a house 16): a cow 9 × 5
   inside its outline (a water buffalo 10 × 5, its horns swept back), a camel 10 × 7 (its hump and neck), a deer 8 × 7 (a stag or a
   reindeer with its antlers over that), a sheep, a pig or a goat 7 × 4 or 5, a rabbit 6 × 5, a hare 7 × 6, a hen or a fowl 5 × 5
   or 6; drawn pixel by pixel, side-on facing right, in its colour's hue-shifted ramp (engine PX.ramp:
   h its light, H the coat, d its shade, k darker; w white, e eye, n nose, b beak, y legs, r comb, a antler, o horn, s spots, f a
   face), with the people's outline (people.js), each in the smallest power-of-two cell it fits (8, 16: sprites.js cellOf). rows:
   the body over the legs; legs: two steps (under it, then apart), walked in PX.MAP_STEPS frames (engine/beasts.js PX.mapLegs; f 0
   standing: a walk to a body length walked, critters.js draw) */
const CRITTER_MAP={
  // (more detail, 2026-11-08, the owner: "change wildlife sprites as well to have more detail": each its marks at this scale: a cow's
  //  patches and horns, a sheep's fleece and dark face, a pig's snout and curled tail, a goat's horns and beard, a rabbit's ears and
  //  white scut, a hen's comb and tail, a deer's ears, neck and white rump, antlers branched, a gazelle's flank stripe)
  cow:{rows:['.......o.','.hhhshhHe','dHsHHHsHn','.dHHsHHd.'],legs:[['.kH..kH..'],['k.H.k..H.']]},
  sheep:{x:{f:'#4a423c'},rows:['.hhhh..','hhHhHHf','hHHHHff','.dHHd..'],legs:[['.f..f'],['f..f.']]},
  pig:{rows:['.hhhhh.','dHHHHHe','.dHHHHn'],legs:[['.k..k.'],['k..k..']]},
  goat:{rows:['....o..','...oHe.','dhhhHHn','.dHHH.w'],legs:[['.k..k.'],['k..k..']]},
  deer:{rows:['.....d.d','.....hHe','....hHHn','whhhhHH.','.dHHHHd.'],legs:[['.kH..kH.','.kH..kH.'],['.kH..kH.','k.H.k..H']]},
  stag:{rows:['...a.a.a','....aa..','.....hHe','....hHHn','whhhhHH.','.dHHHHd.'],legs:[['.kH..kH.','.kH..kH.'],['.kH..kH.','k.H.k..H']]},
  reindeer:{rows:['...a.a.a','...aaa..','.....hHe','....wHHn','dhhhwwH.','.dHHHHd.'],legs:[['.kH..kH.','.kH..kH.'],['.kH..kH.','k.H.k..H']]},
  ibex:{rows:['....oo..','...o.hHe','.....HHk','dhhhhHH.','.dHHHHd.'],legs:[['.kH..kH.','.kH..kH.'],['.kH..kH.','k.H.k..H']]},
  gazelle:{rows:['......o.','.....oHe','.....HHn','whhhhhH.','.kkkkkd.'],legs:[['.kH..kH.','.kH..kH.'],['.kH..kH.','k.H.k..H']]},
  rabbit:{rows:['....hd','....hd','.hhhHe','whHHHn'],legs:[['.d..d.'],['d..d..']]},
  hare:{rows:['.....k','.....k','....hd','.hhhhHe','whHHHHn'],legs:[['.d...d.'],['d...d..']]},
  hen:{rows:['...r.','d..hb','dhhH.','.dHH.'],legs:[['.y.y.'],['y..y.']]},
  camel:{rows:['....h...he','...hHh..Hn','.hhHHHh.H.','dHHHHHHHH.','.dHHHHHd..'],legs:[['..kH..kH..','..kH..kH..'],['..kH..kH..','.k.H.k..H.']]},
  buffalo:{x:{n:'#2a2628'},rows:['......oo..','..hhhhhoHe','.hHHHHHHHn','dHHHHHHHd.'],legs:[['.hd...hd..'],['h.d..h..d.']]},
  fowl:{rows:['...He','...Hb','d.hH.','dhhHH','.dHH.'],legs:[['.y.y.'],['y..y.']]}
};
// (its colours by CRITTER_MAP's letters)
const critterCols=(D,T,R)=>({h:R[0],H:R[1],d:R[2],k:R[3],w:'#f4f0e8',e:'#1a1410',n:'#e8a0a0',b:'#e8b94a',y:'#d8963a',r:'#d83a2a',a:'#d8c8a0',o:'#a89a7a',s:D.spots||R[3],...(T.x||{})});
function critterSprite(id,f){f=(f||0)%PX.MAP_STEPS;const k='cr'+id+f;if(spr[k])return spr[k];
  const D=CRITTERS[id],T=CRITTER_MAP[D.look||id],R=PX.ramp(D.col),rows=T.rows.concat(PX.mapLegs(T.legs[0],T.legs[1],f)),g=pgrid(Math.max(...rows.map(r=>r.length))+2,rows.length+2),col=critterCols(D,T,R);
  // (the paper dolls' style (dollfigs.js DOLL_FIGS.edge): its outline inside it (DOLL_FIGS.rim), its feet on the row over the
  // picture's bottom as every figure's; with no outline at all, a row down (CRITTER_DROP))
  const E=CRITTER_EDGE();if(E)g.edge=true;rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(col[c])pset(g,x+1,y+1+CRITTER_DROP(),col[c])}));poutline(g);return spr[k]=cellOf(pcanvas(g))}
const CRITTER_EDGE=()=>DOLL_FIGS.on&&DOLL_FIGS.edge?1:0,CRITTER_DROP=()=>CRITTER_EDGE()&&!DOLL_FIGS.rim?1:0;
/* one killed in a hunt (sprites.js deathOf, CRITTER_DEATHS): back, on its back, its legs in the air; belly, down on its belly, its
   legs folded under it; slump, its rump up on its hind legs, its front and head sunk to the ground. Its eye shut; the same cell as
   it stood, its body on the bottom row */
const CRITTER_DEATHS=['back','belly','slump'];
function critterDead(id,how){const k='crd'+id+how;if(spr[k])return spr[k];
  const D=CRITTERS[id],T=CRITTER_MAP[D.look||id],legs=T.legs[0],body=T.rows.map(r=>r.replace('e','H')),W=Math.max(...T.rows.map(r=>r.length),...legs.map(r=>r.length)),col=critterCols(D,T,PX.ramp(D.col));
  // (its rows over the ground: slump sinks each column of its front half by its legs' height, what goes under the ground lost)
  const rows=how==='back'?body.concat(legs).reverse():how==='belly'?body:body.concat(legs),n=rows.length,g=pgrid(W+2,(how==='belly'?body.length:body.length+legs.length)+2);
  const E=CRITTER_EDGE();if(E)g.edge=true;rows.forEach((r,y)=>[...r].forEach((c,x)=>{const dy=how==='slump'&&x>=W>>1?legs.length:0;if(col[c]&&y+dy<n)pset(g,x+1,y+1+dy+CRITTER_DROP(),col[c])}));poutline(g);return spr[k]=cellOf(pcanvas(g))}
// its work in the world's day and frame (core/systems.js)
Systems.add({name:'herds',order:{day:80,frame:120},day:critterDay,frame:updateCritters,ends:true});
