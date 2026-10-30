'use strict';
/* ---------- the hero's moves, made flashy (the owner, 2026-10-30: "flashy hero moves and effects"; Wave 2 of a livelier battle).
   Drawn only, as the fighters' states are (vfx.js STATE_FX): their particles in FXP (fxp), their randomness the same stream (fxr),
   told by the battle's events (battle.js: swing, blow, cast, land), so no fight goes otherwise and no fingerprint moves.
     trail: a glowing ribbon along each swing's arc (a thrust's streak), wider on the finisher (life s, w px);
     fin: the combo's last blow landing, a zoom-punch (zoom, over zt s) and a white flash over the field (flash s, at fa);
     crit: a star of light where it lands (star px); a kill of yours, a white burst;
     beat: a crit or a kill of your hero's slows the battle to slow for t s, at most once every every s (main.js heroBeat: the
       loop's own clock, never the battle's);
     whirl: after-images of the caster all round him (ghosts, of them); leap: his shadow shrinks as he rises; landing, debris
       (debris pieces), a shockwave and a flash; dash: a streak of light behind him; a spell: sparks drawn into his hand, then a
       burst (spell col by ability);
     aura: a faint gold glow under your hero, so you find her in the crowd (r px, at a, pulsing every pulse s).
   Light (Settings, Battle effects): the ribbons, streaks, flashes and rings; no debris, sparks or ghosts. Reduced motion: no zoom
   or beat */
const HERO_FX={trail:{life:.24,w:4,fin:7,col:'255,240,200'},fin:{zoom:.045,zt:.2,flash:.16,fa:.28},crit:{star:11},
  beat:{slow:.4,t:.2,every:3},ghosts:6,debris:10,aura:{r:9,a:.22,pulse:2.2},
  spell:{fireball:'255,140,60',nova:'190,230,255',heal:'150,240,150',bolt:'255,224,138',cry:'255,210,110',banner:'255,224,138',quake:'200,160,110',volley:'255,224,138'}};
// (the view's moments, on the real clock: a zoom-punch, a flash, a beat; kept with their battle)
const HERO_VIEW={b:null,zoom:0,flash:0,beat:0,beatAt:-99};
const heroView=()=>{if(HERO_VIEW.b!==B)Object.assign(HERO_VIEW,{b:B,zoom:0,flash:0,beat:0,beatAt:-99});return HERO_VIEW};
const mine=u=>!!u&&u===B.hero;
function heroBeatNow(){const V=heroView(),now=performance.now()/1000;if(B.world||reducedMotion()||now-V.beatAt<HERO_FX.beat.every)return;V.beatAt=now;V.beat=HERO_FX.beat.t}
// the loop's dt for the battle: slowed in a beat (main.js), its own time counted down in real time
function heroBeat(dt){if(!B)return dt;const V=heroView();if(!(V.beat>0))return dt;V.beat-=dt;return dt*HERO_FX.beat.slow}
// each drawn frame: the zoom-punch's scale (1: none), and the flash's alpha
function heroZoom(){if(!B)return 1;const V=heroView(),F=HERO_FX.fin,now=performance.now()/1000,q=(now-V.zoom)/F.zt;if(!V.zoom||q>=1||q<0||reducedMotion())return 1;return 1+F.zoom*Math.sin(Math.PI*q)*(1-q)}
function heroFlash(){if(!B)return 0;const V=heroView(),F=HERO_FX.fin,q=(performance.now()/1000-V.flash)/F.flash;return V.flash&&q>=0&&q<1?F.fa*(1-q):0}
function heroFinisher(){if(reducedMotion())return;const V=heroView(),now=performance.now()/1000;V.zoom=now;V.flash=now}
// the moments, as the battle tells them
battleOn((type,d)=>{if(!STATE_FX.on||!B)return;const T=HERO_FX.trail;
  if(type==='swing'&&d.u){const big=d.last&&d.n,u=d.u;fxp({k:'trail',x:u.x,y:u.y-6,a:d.a,r:d.r,arc:d.c.arc||.9,dir:d.c.dir||1,shape:d.c.shape,w:big?T.fin:T.w,col:d.c.col||T.col,life:T.life*(big?1.4:1)});
    if(d.c.shape==='spin')stateMark(u).spin=B.t;if(big&&mine(u))heroFinisher()}
  if(type==='blow'&&d.e){const e=d.e;if(d.crit){fxp({k:'star',x:e.x,y:e.y-8,r:HERO_FX.crit.star,life:.3});if(mine(d.u))heroBeatNow()}
    if(d.kill&&mine(d.u)){fxp({k:'flash',x:e.x,y:e.y-6,r:12,col:'255,255,255',life:.22});fxp({k:'ring',x:e.x,y:e.y,r:16,col:'255,240,200',life:.4});heroBeatNow()}}
  if(type==='cast'&&d.u){const u=d.u,id=d.id,C=HERO_FX.spell[id];
    if(id==='whirl')stateMark(u).spin=B.t;if(id==='whirl')for(let i=0;i<HERO_FX.ghosts;i++)fxp({k:'ghost',u,x:u.x,y:u.y,a:i/HERO_FX.ghosts*6.283,r:11,face:i&1?-1:1,life:.32});
    if(id==='dash'){const D=d.st&&d.st.dash;if(D)fxp({k:'streak',x:D.sx,y:D.sy-6,tx:D.tx,ty:D.ty-6,col:'235,230,210',life:.36})}
    if(C){const hx=u.x+(u.face||1)*4,hy=u.y-10;for(let i=0;i<8;i++){const b=fxr()*6.283;fxp({k:'mote',x:hx+Math.cos(b)*16,y:hy+Math.sin(b)*10,tx:hx,ty:hy,col:C,life:.22})}
      fxp({k:'flash',x:hx,y:hy,r:14,col:C,life:.28});fxp({k:'ring',x:u.x,y:u.y,r:22,col:C,life:.45})}}
  if(type==='land'&&d.u){const u=d.u;for(let i=0;i<HERO_FX.debris;i++){const b=fxr()*6.283,v=30+fxr()*50;fxp({k:'rock',x:u.x,y:u.y,vx:Math.cos(b)*v,vy:Math.sin(b)*v*.45,z:0,vz:40+fxr()*50,g:260,life:.6})}
    fxp({k:'wave',x:u.x,y:u.y,r:(d.r||30)*1.3,col:'255,214,140',life:.4});fxp({k:'flash',x:u.x,y:u.y-2,r:12,col:'255,236,190',life:.18});if(mine(u))heroFinisher()}});
// (a spin: turning round on his feet, his facing flipped n times over t s of the battle's clock (render.js drawUnit))
const SPIN={t:.36,n:6};
function spinFace(u,f){const m=STATE_MARKS.get(u),q=m&&m.spin!=null?(B.t-m.spin)/SPIN.t:-1;return q>=0&&q<1&&Math.floor(q*SPIN.n)%2?-f:f}
// under your hero: her glow
function heroAura(u,x,y,big){if(!STATE_FX.on||!mine(u)||u.hp<=0)return;const A=HERO_FX.aura,p=.5+.5*Math.sin(performance.now()/1000/A.pulse*6.283),R=A.r*big;
  ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,'rgba(255,220,140,'+(A.a*(.7+.3*p)).toFixed(2)+')');g.addColorStop(1,'rgba(255,220,140,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,R,R*.42,0,0,6.283);ctx.fill();ctx.restore()}
// (a ribbon along an arc: from its tail to its head, widening to w; q how far it has swept)
function trailArc(p,q,a){const span=p.shape==='spin'?6.283:2*p.arc,a0=p.shape==='spin'?p.a:p.a-p.dir*p.arc,head=a0+p.dir*span*q,tail=a0+p.dir*span*Math.max(0,q-.6),N=12;
  ctx.beginPath();for(let i=0;i<=N;i++){const t=i/N,b=tail+(head-tail)*t;ctx.lineTo(p.x+Math.cos(b)*p.r,p.y+Math.sin(b)*p.r)}
  for(let i=N;i>=0;i--){const t=i/N,b=tail+(head-tail)*t,r=p.r-p.w*t;ctx.lineTo(p.x+Math.cos(b)*r,p.y+Math.sin(b)*r)}ctx.closePath();
  ctx.fillStyle='rgba('+p.col+','+(a*.55).toFixed(2)+')';ctx.fill();ctx.strokeStyle='rgba(255,255,255,'+(a*.8).toFixed(2)+')';ctx.lineWidth=1;ctx.beginPath();
  for(let i=0;i<=N;i++){const b=tail+(head-tail)*i/N;ctx.lineTo(p.x+Math.cos(b)*p.r,p.y+Math.sin(b)*p.r)}ctx.stroke()}
// (a streak: tapered from tail to head)
function trailLine(x0,y0,x1,y1,w,col,a){const dx=x1-x0,dy=y1-y0,l=Math.hypot(dx,dy)||1,nx=-dy/l*w/2,ny=dx/l*w/2;
  ctx.fillStyle='rgba('+col+','+(a*.6).toFixed(2)+')';ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1+nx,y1+ny);ctx.lineTo(x1+dx/l*3,y1+dy/l*3);ctx.lineTo(x1-nx,y1-ny);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,'+(a*.8).toFixed(2)+')';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0+dx*.3,y0+dy*.3);ctx.lineTo(x1,y1);ctx.stroke()}
// on the ground: the landing's shockwave; the debris thrown
function heroFxGround(){if(!B||!FXP.length)return;for(const p of FXP){const a=1-p.age/p.life,q=p.age/p.life;
  if(p.k==='wave'){for(const [k,w] of [[1,3],[.75,1.5]]){const r=p.r*k*(.2+.8*Math.sqrt(q));ctx.strokeStyle='rgba('+p.col+','+(a*.8).toFixed(2)+')';ctx.lineWidth=w;ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.42,0,0,6.283);ctx.stroke()}}
  else if(p.k==='rock'){ctx.fillStyle='rgba(0,0,0,'+(a*.3).toFixed(2)+')';ctx.fillRect(Math.round(p.x),Math.round(p.y),2,1);ctx.fillStyle='#7a6a54';ctx.globalAlpha=Math.min(1,a*2);ctx.fillRect(Math.round(p.x),Math.round(p.y-p.z),2,2);ctx.globalAlpha=1}}}
// in the air: ribbons, streaks, ghosts, stars, motes
function heroFxAir(){if(!B||!FXP.length)return;ctx.save();ctx.globalCompositeOperation='lighter';for(const p of FXP){const a=1-p.age/p.life,q=p.age/p.life;
  if(p.k==='trail'){const s=Math.min(1,q/.45),f=q<.45?1:1-(q-.45)/.55;if(p.shape==='thrust'||p.shape==='twin'){for(const o of p.shape==='twin'?[-.28,.28]:[0]){const b=p.a+o,e=p.r*s;trailLine(p.x+Math.cos(b)*3,p.y+Math.sin(b)*3,p.x+Math.cos(b)*e,p.y+Math.sin(b)*e,p.w,p.col,f)}}
    else if(p.shape==='slam'){const cx=p.x+Math.cos(p.a)*p.r*.6,cy=p.y+6+Math.sin(p.a)*p.r*.6;trailLine(cx,cy-22,cx,cy-22+18*s,p.w,p.col,f)}else trailArc(p,s,f)}
  else if(p.k==='streak'){const s=Math.min(1,q/.4),f=q<.4?1:1-(q-.4)/.6,hx=p.x+(p.tx-p.x)*s,hy=p.y+(p.ty-p.y)*s;trailLine(p.x+(p.tx-p.x)*Math.max(0,s-.8),p.y+(p.ty-p.y)*Math.max(0,s-.8),hx,hy,6,p.col,f)}
  else if(p.k==='ghost'){const b=p.a+q*9,x=Math.round(p.x+Math.cos(b)*p.r),y=Math.round(p.y+Math.sin(b)*p.r*.5);ctx.globalAlpha=a*.35;ctx.save();ctx.globalCompositeOperation='source-over';ctx.translate(x,y);if(p.face<0)ctx.scale(-1,1);const sp=p.sp||(p.sp=actorSprite(p.u,0,true));ctx.drawImage(sp,-Math.floor(sp.width/2),-sp.height+2);ctx.restore();ctx.globalAlpha=1}
  else if(p.k==='star'){const r=p.r*(.5+.5*Math.sin(Math.PI*Math.min(1,q*1.5)));ctx.fillStyle='rgba(255,236,160,'+a.toFixed(2)+')';for(const [w,h] of [[r,1],[1,r*.8]])ctx.fillRect(Math.round(p.x-w),Math.round(p.y-h/2),Math.round(2*w),Math.max(1,Math.round(h)));
    const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*.6);g.addColorStop(0,'rgba(255,255,255,'+a.toFixed(2)+')');g.addColorStop(1,'rgba(255,220,120,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r*.6,0,6.283);ctx.fill()}
  else if(p.k==='mote'){const x=p.x+(p.tx-p.x)*q,y=p.y+(p.ty-p.y)*q;ctx.fillStyle='rgba('+p.col+','+Math.min(1,.4+q).toFixed(2)+')';ctx.fillRect(Math.round(x),Math.round(y),1,1)}}
  ctx.restore()}
// over the whole field: the finisher's flash (frame, render.js: in the canvas's own pixels)
function heroFlashDraw(){const f=heroFlash();if(!f)return;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(255,250,236,'+f.toFixed(2)+')';ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.restore()}
