'use strict';
/* ---------- fire (the owner, 2026-11-01: "can you change a fire effect to be more realistic?"): one look for every flame: a camp's
   and a site's fire (structures.js drawFire), a marching man's torch (marchgear.js torchSprite), a fire arrow in flight and a
   spell's blaze (vfx.js vfxAir) and the light they cast in the dark (render.js drawWorld: fireLights). A flame is the engine's
   (pieces.js PX.fireFlame: a white-yellow heart, orange, deep red tips, its tongues licking unevenly), each frame by kind and
   lean drawn once and kept (FIRE_PICS); which frame shows is layered noise of the clock and the fire's id (fireFrameAt), so two
   fires never keep step and none blinks on a beat. Round a camp fire embers rise and fade and thin smoke drifts up; a light
   pulses unevenly, warm, with a pool of it on the ground beneath; a fire arrow streams its flame behind it, a short trail of
   smoke after, and throws sparks where it strikes. Drawing only: never Math.random nor the story's streams (a hash of the
   clock and the id), and nothing off the screen. FLAMES.on false: every fire drawn as it was (PX.flame, the torch's two frames,
   the round glow with its own small flame) ---------- */
/* FLAMES, the one table. on: this look (false: the old); frames: a flame's frames; fps: their pace; wander: how far (frames) the
   noise pushes a fire off its pace; ramp: its colours, hottest first; size: a flame's [w, h] px by kind (a torch's in a
   marcher's own pixels, drawn at the map's half scale); lean: px a carried torch's tips trail; embers: a camp fire's rising at
   once, rise: px they climb, emberLife: s each; smoke: its puffs, up: px they climb, smokeLife: s each, drift: px east they go;
   glow: a light's colour at its heart and rim, pulse (the share of its reach that wavers), pool (its light on the ground beneath:
   the share, flattened to flat), steps (its rings of strength, each edge on a game pixel); light: a camp fire's reach (px);
   trail: a fire arrow's puffs of smoke; sparks: thrown where it strikes; cull: px past the screen's edge a fire still shows;
   lights: the most lights a frame */
const FLAMES={on:true,frames:8,fps:9,wander:2.5,ramp:['#fff8d8','#ffe27a','#ffb444','#f27a2c','#cc4026','#7e2420'],
  size:{camp:[7,9],torch:[3,5],arrow:[3,4],blaze:[9,12]},lean:2,embers:3,rise:14,emberLife:1.3,smoke:3,up:16,smokeLife:2.6,drift:5,
  glow:{heart:[255,204,116],rim:[255,124,44],pulse:.14,pool:.7,flat:.4,steps:8},light:24,trail:4,sparks:5,cull:24,lights:96};
// (layered value noise of time and an id, 0..1: three rates over each other, so it never repeats on a beat)
const fireN1=(x,id)=>{const i=Math.floor(x),f=x-i,s=f*f*(3-2*f);return PX.hash(i,id,71)*(1-s)+PX.hash(i+1,id,71)*s};
const fireNoise=(t,id)=>.5*fireN1(t*1.7,id)+.3*fireN1(t*4.3+11,id)+.2*fireN1(t*9.1+29,id);
// (the frame a fire of id shows at t s: its pace pushed on and held back by the noise; its start by its id)
const fireFrameAt=(t,id)=>{const n=FLAMES.frames;return((Math.floor(t*FLAMES.fps+FLAMES.wander*4*fireNoise(t*.5,id)+PX.hash(id|0,5,73)*n)%n)+n)%n};
const fireTime=()=>performance.now()/1000;
// a flame's picture by kind, frame and lean, drawn once and kept: {img, ax, ay}
const FIRE_PICS=new Map(),FIRE_SEED={camp:11,torch:23,arrow:37,blaze:41};
function fireFlame(kind,f,lean){lean=lean|0;const key=kind+f+','+lean;let s=FIRE_PICS.get(key);if(s)return s;const [w,h]=FLAMES.size[kind];
  s=PX.fireFlame({w,h,n:FLAMES.frames,f,lean,seed:FIRE_SEED[kind],ramp:FLAMES.ramp});FIRE_PICS.set(key,s);return s}
// (a camp fire's flame still, for a page's banner: the new look's first frame, or the old PX.flame's)
const campFlame=()=>FLAMES.on?fireFlame('camp',0,0):spr.flm0||(spr.flm0=PX.flame(0));
// a camp's or a site's fire, its foot at (x, y) in ctx's pixels (structures.js drawFire): thin smoke behind, its flame, embers rising
// over it, and its light queued (LIGHTQ, with its pool on the ground)
function fireCamp(x,y,seed){x=Math.round(x);y=Math.round(y);const m=FLAMES.cull;if(x<-m||y<-m||x>VW+m||y>VH+m)return;
  const t=fireTime(),id=seed|0,s=fireFlame('camp',fireFrameAt(t,id),0);fireSmoke(x,y-s.ay+3,t,id);ctx.drawImage(s.img,x-s.ax,y-s.ay);fireEmbers(x,y-3,t,id);
  if(LIGHTQ.length<FLAMES.lights)LIGHTQ.push({x,y:y-4,r:FLAMES.light,id,g:3})}
// a torch's flame alone, its foot at (x, y), at the map's own scale (a party's torch when its men are not drawn: parties.js)
function fireTorchAt(x,y,id){const s=fireFlame('torch',fireFrameAt(fireTime(),id|0),0);ctx.drawImage(s.img,Math.round(x)-s.ax,Math.round(y)-s.ay)}
// (smoke over a fire: FLAMES.smoke puffs on their own loops, a pixel then two, fading as they climb and drift)
function fireSmoke(x,y,t,id){const a=ctx.globalAlpha;ctx.fillStyle='#5e5854';
  for(let k=0;k<FLAMES.smoke;k++){const q=(t/FLAMES.smokeLife+k/FLAMES.smoke+PX.hash(id,k,74))%1,r=q<.45?1:2;ctx.globalAlpha=a*.34*(1-q)*Math.min(1,q*5);
    ctx.fillRect(Math.round(x+q*FLAMES.drift+Math.sin(t*1.3+k*2.1+id)*1.2)-(r>>1),Math.round(y-q*FLAMES.up),r,r)}
  ctx.globalAlpha=a}
// (embers: each on its own loop, some loops none; yellow as they leave the fire, red as they die)
function fireEmbers(x,y,t,id){const R=FLAMES.ramp;
  for(let k=0;k<FLAMES.embers;k++){const c=t/FLAMES.emberLife+PX.hash(id,k,75),n=Math.floor(c),q=c-n;if(q>.9||PX.hash(n,k,id+76)<.35)continue;
    ctx.fillStyle=R[Math.min(R.length-2,1+Math.floor(q*4))];ctx.fillRect(Math.round(x+(PX.hash(n,k,id+77)-.5)*6+Math.sin(q*7+k)*1.2),Math.round(y-q*FLAMES.rise),1,1)}}
// an ember's colour by its life left (a: 1 new, 0 gone): vfx.js's fire embers, marked so (fireMark: the vfx itself unchanged, so
// the battle's own state holds whether fire burns or not)
const FIRE_EMBERS=new WeakSet(),fireMark=p=>{if(p)FIRE_EMBERS.add(p);return p};
const fireAge=a=>FLAMES.ramp[Math.min(FLAMES.ramp.length-1,1+Math.floor((1-a)*(FLAMES.ramp.length-1)))];
/* the lights (render.js drawWorld, over the night's dark): each a glow, its reach and strength wavering on the noise of its id, with a
   flattened pool on the ground under it (g: px from the light down to the ground); light only, each fire draws its own flame.
   a: the darkness */
function fireLights(cam,a){const t=fireTime(),G=FLAMES.glow;ctx.save();ctx.globalCompositeOperation='lighter';
  for(const L of LIGHTQ){const id=L.id??L.x,k=fireNoise(t*1.4,id),r=Math.max(2,Math.round(L.r*(1+G.pulse*(2*k-1))));
    if(L.x+r<0||L.y-r>VH+1||L.x-r>VW+1||L.y+r+(L.g||0)<0||!inSight(L.x+cam.x,L.y+cam.y))continue;
    const al=(.12+.28*a)*(.8+.5*k),s=fireGlow(r,false);ctx.globalAlpha=Math.min(1,al);ctx.drawImage(s,L.x-r,L.y-r);
    if(L.g!=null){const p=fireGlow(r,true);ctx.globalAlpha=Math.min(1,al*G.pool);ctx.drawImage(p,L.x-r,L.y+L.g-(p.height>>1))}}
  ctx.restore()}
// (a light's picture by reach, drawn once and kept: round, or flattened for its pool; in G.steps crisp rings of strength, its
// heart yellower than its rim)
const FIRE_GLOWS=new Map();
function fireGlow(r,pool){const key=(pool?'p':'g')+r;let c=FIRE_GLOWS.get(key);if(c)return c;const G=FLAMES.glow,w=2*r+1,h=pool?Math.max(3,Math.round(w*G.flat)|1):w,cy=h>>1;
  c=mkc(w,h,g=>{const im=g.createImageData(w,h),d=im.data;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const q=Math.max(0,1-Math.hypot((x-r)/r,(y-cy)/(cy||1))),v=Math.floor(q*G.steps);if(!v)continue;
      const i=4*(y*w+x),u=v/G.steps;for(let j=0;j<3;j++)d[i+j]=Math.round(G.rim[j]+(G.heart[j]-G.rim[j])*u);d[i+3]=Math.round(255*Math.pow(u,1.5))}
    g.putImageData(im,0,0)});
  FIRE_GLOWS.set(key,c);return c}
/* fire arrows in flight (vfx.js vfxAir, over the fighters): at each one's head a flame streaming back from the way it flies, a
   little light round it, and a short trail of smoke behind; drawn where render.js drawBattle draws the arrow (an arc's at its
   height, a bolt's flat) */
const FIRE_IDS=new WeakMap();let FIRE_N=0;
const fireId=a=>{let i=FIRE_IDS.get(a);if(i==null)FIRE_IDS.set(a,i=++FIRE_N);return i};
function fireArrows(){if(!FLAMES.on||!B||!B.arrows||!B.arrows.length)return;const t=fireTime(),T=ctx.getTransform(),k=B.world?WORLD_BATTLE.sprite:1,cw=ctx.canvas.width,ch=ctx.canvas.height;
  for(const a of B.arrows){if(!a.src||!a.src.fireArrow||!(a.life>0))continue;
    const z=a.arc?Math.max(0,a.z):0,vx=a.vx,vy=a.arc?a.vy-a.vz:a.vy,ang=a.arc?Math.atan2(vy,vx):a.a,hx=Math.round(a.x)+Math.cos(ang)*4*k,hy=Math.round(a.arc?a.y-4-z:a.y)+Math.sin(ang)*4*k;
    const sx=T.a*hx+T.c*hy+T.e,sy=T.b*hx+T.d*hy+T.f;if(sx<-40||sy<-40||sx>cw+40||sy>ch+40)continue;
    const id=fireId(a),sp=Math.hypot(vx,vy)||1,ux=vx/sp,uy=vy/sp;ctx.save();ctx.fillStyle='#4e4a48';
    for(let i=0;i<FLAMES.trail;i++){const d=(3+i*3)*k,j=(PX.hash(Math.floor(t*20)+i,id,78)-.5)*2*k,s=(i>1?2:1)*k;ctx.globalAlpha=.42*(1-i/FLAMES.trail);
      ctx.fillRect(Math.round(hx-ux*d-uy*j),Math.round(hy-uy*d+ux*j-i*k),s,s)}
    const f=fireFlame('arrow',fireFrameAt(t,id),Math.max(-3,Math.min(3,Math.round(-ux*3)))),gl=fireGlow(4,false);
    ctx.translate(Math.round(hx),Math.round(hy));ctx.scale(k,k);ctx.globalAlpha=1;ctx.drawImage(f.img,-f.ax,-f.ay+2);
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.45;ctx.drawImage(gl,-4,-5);ctx.restore()}}
// (where a fire arrow strikes, or lands: FLAMES.sparks sparks thrown up and out and a flash, drawn only (vfx.js fxp: off the
// battle's own effects, aged by the real clock), by a count of their own, never Math.random)
let FIRE_SPARK=0;
function fireSparks(x,y,n){if(!FLAMES.on||!B)return;n=n??FLAMES.sparks;
  for(let i=0;i<n;i++){const h=++FIRE_SPARK,b=-Math.PI/2+(PX.hash(h,1,79)-.5)*2.6,v=40+PX.hash(h,2,79)*80;fxp({k:'spark',x,y,vx:Math.cos(b)*v,vy:Math.sin(b)*v,life:.2+PX.hash(h,3,79)*.25,col:FLAMES.ramp[1+i%3]})}
  fxp({k:'flash',x,y,r:6,life:.12,col:'255,180,68'})}
// (a spell's explosion leaves a blaze a moment where it burst (vfx.js vfxExplode), dying down: drawn only, as the sparks)
const fireBlazeAt=(x,y)=>fxp({k:'blaze',x,y,life:.7});
function fireBlazes(){if(!FLAMES.on||!B||FXP.b!==B)return;for(const p of FXP)if(p.k==='blaze')fireBlaze(p,1-p.age/p.life)}
// (one blaze, p, a its life left)
function fireBlaze(p,a){const k=worldEffectScale(),f=fireFlame('blaze',fireFrameAt(fireTime(),fireId(p)),0);ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,a*2.5));ctx.translate(Math.round(p.x),Math.round(p.y));ctx.scale(k,k);
  ctx.drawImage(f.img,-f.ax,-f.ay+3);ctx.restore()}
