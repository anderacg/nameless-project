'use strict';
/* ---------- the spirit on the Slain page (the owner, 2026-11-13: "After you die Make a cool spirit glowing and moving around at the
   center of the screen and make a choices around it to select whether to load, new character or go to the void"; world/death.js
   Death.open). A wisp of light drawn small and laid on its stage pixel by pixel (its stage SPIRIT.h game pixels tall, so it
   grows with its stage), so it is of the game's world: a teardrop flame, its core near white, its glow added in light; it wanders a slow figure of eight round the middle of the three (by its stage's height, SPIRIT.wander),
   bobbing, leaning into its way, a trail of light behind it, sparks shed upward, three motes about it, faint stars drifting up; a
   choice pointed at or focused draws it toward that choice (lean), and it brightens. Its loop runs while its canvas is on the page,
   and stops of itself when it is gone. Prefers less motion: it hangs still in the middle, breathing ---------- */
const SPIRIT={h:110,wander:[.12,.08],speed:[.45,.9],bob:[2.2,1.6],lean:.32,ease:2.4,trail:22,sparks:{n:60,rate:26,life:[.8,1.8],rise:[6,16]},motes:3,stars:40,
  size:11,col:{core:'#f4feff',inner:'#a9f0ff',glow:'#47c8ff',outer:'#2a5cff',spark:'#bfefff',star:'#7fa8ff',eye:'#0d2a52'}};
class Spirit{
  // (its stage: the canvas, and the choices that draw it toward them)
  constructor(cv,stage){this.cv=cv;this.stage=stage;this.g=cv.getContext('2d');this.t=0;this.last=0;this.pos=null;this.trail=[];this.sparks=[];this.lean={x:0,y:0};this.to=null;this.glow=0;this.acc=0;this.n=0;
    this.still=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.stars=Array.from({length:SPIRIT.stars},(_,i)=>({x:Spirit.hash(i,1),y:Spirit.hash(i,2),s:.3+Spirit.hash(i,3)*.7,v:.4+Spirit.hash(i,4)}));
    for(const b of stage.querySelectorAll('[data-spirit-to]')){const on=()=>{this.to=b},off=()=>{if(this.to===b)this.to=null};
      b.addEventListener('pointerenter',on);b.addEventListener('focus',on);b.addEventListener('pointerleave',off);b.addEventListener('blur',off)}}
  // (its own draws, never the game's: the sparks)
  rnd(){return Spirit.hash(++this.n,7)}
  static hash(i,k){const v=Math.sin(i*127.1+k*311.7)*43758.5453;return v-Math.floor(v)}
  // (its first frame now, then each the browser gives until its canvas leaves the page)
  start(){const step=now=>{if(!this.cv.isConnected)return;const dt=this.last?Math.min(.05,(now-this.last)/1000):0;this.last=now;this.frame(dt);requestAnimationFrame(step)};this.frame(0);requestAnimationFrame(step)}
  // (sized to its stage, in game pixels)
  fit(){const r=this.cv.getBoundingClientRect(),k=Math.max(2,Math.round(r.height/SPIRIT.h)),w=Math.max(40,Math.round(r.width/k)),h=Math.max(30,Math.round(r.height/k));if(this.cv.width!==w||this.cv.height!==h){this.cv.width=w;this.cv.height=h}return{w,h}}
  frame(dt){const {w,h}=this.fit(),S=SPIRIT,g=this.g;this.t+=this.still?dt*.2:dt;const t=this.t;
    // (where it wanders: a figure of eight round the middle, bobbing; drawn toward the choice pointed at)
    const cx=w/2,cy=h/2,ax=this.still?0:h*S.wander[0],ay=this.still?0:h*S.wander[1];
    let tx=cx+ax*Math.sin(t*S.speed[0]),ty=cy+ay*Math.sin(t*S.speed[1])+S.bob[0]*Math.sin(t*S.bob[1]);
    const R=this.stage.getBoundingClientRect(),b=this.to&&this.to.getBoundingClientRect();
    const lx=b?((b.left+b.width/2-R.left)/R.width*w-cx)*S.lean:0,ly=b?((b.top+b.height/2-R.top)/R.height*h-cy)*S.lean:0,e=Math.min(1,dt*S.ease);
    this.lean.x+=(lx-this.lean.x)*e;this.lean.y+=(ly-this.lean.y)*e;this.glow+=((b?1:0)-this.glow)*e;tx+=this.lean.x;ty+=this.lean.y;
    const p=this.pos||(this.pos={x:tx,y:ty}),vx=dt?(tx-p.x)/dt:0;p.x=tx;p.y=ty;
    this.trail.unshift({x:p.x,y:p.y});if(this.trail.length>S.trail)this.trail.length=S.trail;
    // (sparks: shed from its flame, rising and fading)
    if(!this.still)for(this.acc+=S.sparks.rate*dt;this.acc>=1;this.acc--)if(this.sparks.length<S.sparks.n){const L=S.sparks.life,r=()=>this.rnd();
      this.sparks.push({x:p.x+(r()-.5)*S.size*.8,y:p.y-S.size*.2,vx:(r()-.5)*4-vx*.05,vy:-(S.sparks.rise[0]+r()*(S.sparks.rise[1]-S.sparks.rise[0])),age:0,life:L[0]+r()*(L[1]-L[0])})}
    for(const s of this.sparks){s.age+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vx*=.98}this.sparks=this.sparks.filter(s=>s.age<s.life);
    g.save();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);g.imageSmoothingEnabled=false;
    // (the stars, drifting up)
    for(const s of this.stars){const y=((s.y-t*.012*s.v)%1+1)%1,a=.25+.35*Math.sin(t*1.3+s.x*20)**2;g.globalAlpha=a*s.s;g.fillStyle=S.col.star;g.fillRect(Math.floor(s.x*w),Math.floor(y*h),1,1)}
    g.globalCompositeOperation='lighter';const br=1+.35*this.glow+.12*Math.sin(t*2.1);
    // (its glow on the dark about it, its trail of light behind)
    const halo=(x,y,r,c,a)=>{const G2=g.createRadialGradient(x,y,0,x,y,r);G2.addColorStop(0,c);G2.addColorStop(1,'rgba(0,0,0,0)');g.globalAlpha=a;g.fillStyle=G2;g.fillRect(x-r,y-r,2*r,2*r)};
    halo(p.x,p.y,S.size*4.2*br,S.col.outer,.28);halo(p.x,p.y,S.size*2.2*br,S.col.glow,.45);
    this.trail.forEach((q,i)=>{if(i%2)return;const k=1-i/S.trail;halo(q.x,q.y,S.size*1.1*k,S.col.glow,.18*k)});
    for(const s of this.sparks){const k=1-s.age/s.life;g.globalAlpha=.9*k;g.fillStyle=k>.6?S.col.core:S.col.spark;g.fillRect(Math.round(s.x),Math.round(s.y),1,1)}
    // (three motes circling it)
    for(let i=0;i<S.motes;i++){const a=t*1.7+i*2.094,r=S.size*1.6+Math.sin(t*1.1+i)*2;g.globalAlpha=.8;g.fillStyle=S.col.inner;g.fillRect(Math.round(p.x+Math.cos(a)*r),Math.round(p.y+Math.sin(a)*r*.55),1,1)}
    // (its flame: a teardrop pointed up, leaning back from its way, flickering; layer by layer, outer to core)
    const lean=Math.max(-.6,Math.min(.6,-vx*.03)),fl=Math.sin(t*9)*.6+Math.sin(t*13.7)*.4;
    for(const [rk,c,a] of [[1,S.col.glow,.55],[.72,S.col.inner,.8],[.42,S.col.core,1]]){const r=S.size*.5*rk*br;g.globalAlpha=a;g.fillStyle=c;
      for(let y=-Math.ceil(r*2.4);y<=Math.ceil(r);y++){const u=y<0?-y/(r*2.4):0,half=y<0?r*(1-u)**1.3:Math.sqrt(Math.max(0,r*r-y*y));if(half<.4)continue;
        const sx=Math.round(p.x+lean*(-y)+(y<0?fl*u*1.5:0)-half),ex=Math.round(p.x+lean*(-y)+(y<0?fl*u*1.5:0)+half);g.fillRect(sx,Math.round(p.y+y),Math.max(1,ex-sx),1)}}
    // (two eyes, dark in its light, blinking now and then)
    g.globalCompositeOperation='source-over';g.globalAlpha=.85;g.fillStyle=S.col.eye;const blink=(t%4.3)<.12;
    if(!blink){g.fillRect(Math.round(p.x-2),Math.round(p.y-1),1,2);g.fillRect(Math.round(p.x+1),Math.round(p.y-1),1,2)}
    g.restore()}
}
