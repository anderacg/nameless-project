'use strict';
/* ---------- battle effects: a small particle system (B.vfx), drawn in two layers, the ground (dust, shockwaves, stains, the
   falling dead) under the fighters and the air (sparks, glows, embers, flying blood) over them. Emitters for each moment:
   a blow landing (sparks off steel, dust off a heavy blow, blood, a flash for a big one), a charge's impact (a shockwave of
   dust, a moment of slow motion), a death (the body falls, a puff of dust). Glowing things are drawn added to what is under
   them ('lighter'), so they shine. ---------- */
const VFX={max:700,slow:.35,grav:260};
function vfx(o){if(!B)return;const L=B.vfx||(B.vfx=[]);if(L.length>=VFX.max)L.splice(0,L.length-VFX.max+1);o.age=0;o.max=o.life;L.push(o);return o}
const rnd=(a,b)=>a+Math.random()*(b-a);
// a blow lands on t from src (a unit, or a missile's point): its direction, how hard, what kind of hit
function vfxHit(src,t,dm,o){
  if(!B||!t||!src)return;o=o||{};const a=Math.atan2(t.y-src.y,t.x-src.x),x=t.x,y=t.y-7,big=dm>=14||o.crit,beast=!!(t.s&&(t.s.beast||t.s.big));
  if(o.magic){vfx({k:'glow',x,y,r:10+dm*.4,life:.25,col:o.col||'#8fb8ff'});for(let i=0;i<8;i++){const b=rnd(0,6.283),v=rnd(30,90);vfx({k:'ember',x,y,vx:Math.cos(b)*v,vy:Math.sin(b)*v-30,life:rnd(.3,.6),col:o.col||'#8fb8ff'})}return}
  if(o.arrow&&tagsOf(t.s||{}).includes('shield')&&B&&sideOf(t,src)==='front'){for(let i=0;i<4;i++){const b=a+Math.PI+rnd(-.8,.8),v=rnd(30,80);vfx({k:'spark',x:x+Math.cos(a)*-3,y,vx:Math.cos(b)*v,vy:Math.sin(b)*v-20,life:rnd(.15,.3),col:'#c8945a'})}return}// (into the shield: splinters)
  const blunt=!o.arrow&&src.s&&(src.s.big||/hammer|club|bigaxe/.test((PEOPLE_LOOK[src.type]||{}).weapon||''));
  // steel on steel: sparks thrown back past the one hit; a heavy blow: dust
  if(!blunt&&!beast)for(let i=0;i<3+Math.min(6,dm/3|0);i++){const b=a+rnd(-.7,.7),v=rnd(70,170);vfx({k:'spark',x,y,vx:Math.cos(b)*v,vy:Math.sin(b)*v-rnd(10,50),life:rnd(.12,.26),col:i%3?'#ffe9a8':'#ffffff'})}
  if(blunt||big)for(let i=0;i<4;i++){const b=a+rnd(-1,1),v=rnd(20,60);vfx({k:'dust',x:x+Math.cos(b)*3,y:t.y-2,vx:Math.cos(b)*v,vy:Math.sin(b)*v*.4,r:rnd(2,4),grow:10,life:rnd(.35,.6),col:'200,184,150'})}
  if(BLOOD.on&&!undead(t))for(let i=0;i<(big?5:2);i++){const b=a+rnd(-.5,.5),v=rnd(15,big?60:40);vfx({k:'blood',x,y:t.y,z:7,vx:Math.cos(b)*v,vy:Math.sin(b)*v*.5,vz:rnd(25,55),life:1.2})}
  // (the blow itself: a flash where it lands, bigger for a big one)
  vfx({k:'glow',x:x-Math.cos(a)*3,y,r:big?13:7,life:big?.14:.08,col:big?'#ffffff':'#fff4d0'});
}
// a charge strikes home: a ring of dust on the ground, dust thrown out, a jolt, a moment of slow motion
function vfxCharge(u,t,m){
  if(!B)return;const x=(u.x+t.x)/2,y=(u.y+t.y)/2;vfx({k:'shock',x,y,r:14+22*m,life:.45,col:'220,200,160'});
  for(let i=0;i<10;i++){const b=rnd(0,6.283),v=rnd(40,110)*m;vfx({k:'dust',x,y,vx:Math.cos(b)*v,vy:Math.sin(b)*v*.45,r:rnd(3,5),grow:14,life:rnd(.5,.9),col:'196,180,140'})}
  B.slow=Math.max(B.slow||0,.08+.14*m);shakeIt(2+3*m)}
/* screen shake, drawn only: a jolt of the whole view (frame, render.js) when a strong charge strikes home (a rider or a big beast,
   momentum over SHAKE.charge) and, lighter, when a group of yours routs; with it the small shake of every blow (G.shake). A wobble
   by the clock, never a random draw; the jolt fades over SHAKE.life seconds of real time and never moves the camera (B.cam).
   Off: SHAKE.on false, or the system asks for reduced motion */
const SHAKE={on:true,charge:.6,amp:4,rout:1.5,max:5,life:.45,hz:38};
function reducedMotion(){try{return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)}catch(e){return false}}
const shakeOn=()=>SHAKE.on&&!reducedMotion();
// a jolt of n pixels, unless a stronger one is still going (lt: its clock restarts on the next frame)
function jolt(n){if(!B||!(n>0)||!shakeOn())return;const J=B.jolt||(B.jolt={a:0,t:0,lt:0});if(n<joltAmp())return;J.a=Math.min(SHAKE.max,n);J.t=SHAKE.life;J.lt=0}
const joltAmp=()=>{const J=B&&B.jolt;return J&&J.t>0?J.a*J.t/SHAKE.life:0};
function joltStep(rt){const J=B&&B.jolt;if(!J||!(J.t>0))return;J.t=Math.max(0,J.t-rt);if(!J.t)J.a=0}
// (a charge's impact: chargeMul, morale.js)
function chargeJolt(u,m){if(m>SHAKE.charge&&(u.s.charge||u.s.big))jolt(SHAKE.amp*m)}
// each drawn frame: the jolt runs down on real time; the offset to draw at, or null (paused: no blow's shake, only a jolt fading)
function shakeView(bat){
  const now=performance.now()/1000,J=bat&&B&&B.jolt;if(J){joltStep(J.lt?Math.min(.1,now-J.lt):0);J.lt=now}
  if(!shakeOn())return null;const a=Math.max(bat&&B.paused?0:G.shake/2,bat?joltAmp():0);if(a<.5)return null;
  return{x:Math.round(Math.sin(now*SHAKE.hz)*a),y:Math.round(Math.cos(now*SHAKE.hz*1.3)*a)}}
// one falls: the body tips over (drawCorpses), lies, and bleeds; a puff of dust. Its weapon drops beside it
function vfxDeath(t,corpse){
  if(!B)return;vfx({k:'fall',x:t.x,y:t.y,life:GORE.fall+.1,corpse});
  if(corpse){const S=corpseOf(t),big=!!(S.beast||S.mount);Object.assign(corpse,{sp:S,face:t.face||1,td:B.t,dry:undead(t),pool:big?rnd(8,11):rnd(6,8.5),seed:Math.random()*4|0,
    wi:S.wk?[0,1,WEAPON_STEPS-1,WEAPON_STEPS/2,WEAPON_STEPS/2+1][Math.random()*5|0]:0,wx:rnd(3,10),wy:rnd(1,4),skin:PPAL.wood[2]})}
  for(let i=0;i<5;i++){const b=rnd(0,6.283),v=rnd(10,40);vfx({k:'dust',x:t.x,y:t.y-1,vx:Math.cos(b)*v,vy:Math.sin(b)*v*.4,r:rnd(2,3),grow:8,life:rnd(.4,.7),col:'190,176,140'})}}
/* ---------- the fallen and their blood. A man falls (GORE.fall seconds, turning about his feet), lies where he fell with his
   weapon dropped by him, and bleeds a pool that spreads for GORE.pool seconds; then he is painted into the field's own layer
   (B.gore), once, and costs nothing more to show. Blood that lands leaves a splash in that layer too. BLOOD off (ui.js): no
   blood, and the layer is painted again without it. The undead and the made (skeletons, golems) do not bleed. ---------- */
// (tile: the blood layer's tiles, px)
const GORE={fall:.3,pool:2.5,col:['#4a0c0c','#68140f','#7e1c14'],tile:256};
const undead=u=>!!(u&&(u.type==='slime'||u.s&&(u.s.undead||u.s.race==='undead')||/skel|ghoul|wraith|golem|zomb/.test(u.type||'')));
/* the blood layer (B.gore, R16): by tiles of GORE.tile px, each made only where blood falls or one of the fallen is painted in, and
   kept for the battle (blood is never painted twice; the ground's tiles come and go apart from it). each(x0,y0,x1,y1,f): f(g) for
   every tile the box touches, g in field px; drawView: those in view; getContext('2d'): read as one picture (getImageData), cleared
   (clearRect) */
class GoreLayer{
  constructor(W,H){this.width=W;this.height=H;this.n=GORE.tile;this.cols=Math.ceil(W/this.n);this.tiles=new Map()}
  each(x0,y0,x1,y1,f){const n=this.n;for(let ty=Math.max(0,Math.floor(y0/n));ty<=Math.min(Math.ceil(this.height/n)-1,Math.floor(y1/n));ty++)for(let tx=Math.max(0,Math.floor(x0/n));tx<=Math.min(this.cols-1,Math.floor(x1/n));tx++){
    const k=ty*this.cols+tx;let t=this.tiles.get(k);if(!t)this.tiles.set(k,t=mkc(Math.min(n,this.width-tx*n),Math.min(n,this.height-ty*n),()=>{}));const g=t.getContext('2d');g.setTransform(1,0,0,1,-tx*n,-ty*n);f(g)}}
  clear(){this.tiles.clear()}
  drawView(g,x0,y0,x1,y1){const n=this.n;x0=Math.max(0,Math.floor(x0)-2);y0=Math.max(0,Math.floor(y0)-2);x1=Math.min(this.width,Math.ceil(x1)+2);y1=Math.min(this.height,Math.ceil(y1)+2);
    for(const [k,t] of this.tiles){const X=(k%this.cols)*n,Y=Math.floor(k/this.cols)*n,sx=Math.max(x0,X),sy=Math.max(y0,Y),sw=Math.min(x1,X+t.width)-sx,sh=Math.min(y1,Y+t.height)-sy;if(sw>0&&sh>0)g.drawImage(t,sx-X,sy-Y,sw,sh,sx,sy,sw,sh)}}
  bytes(){let b=0;for(const t of this.tiles.values())b+=t.width*t.height*4;return b}
  getContext(){const L=this;return{clearRect(){L.clear()},getImageData(x,y,w,h){const out=new ImageData(w,h),n=L.n;
    for(const [k,t] of L.tiles){const X=(k%L.cols)*n,Y=Math.floor(k/L.cols)*n,sx=Math.max(x,X),sy=Math.max(y,Y),sw=Math.min(x+w,X+t.width)-sx,sh=Math.min(y+h,Y+t.height)-sy;if(sw<=0||sh<=0)continue;
      const d=t.getContext('2d').getImageData(sx-X,sy-Y,sw,sh).data;for(let r=0;r<sh;r++)out.data.set(d.subarray(r*sw*4,(r+1)*sw*4),((sy-y+r)*w+sx-x)*4)}return out}}}
}
function goreLayer(){if(!B.gore){B.gore=new GoreLayer(BW,BH);B.goreOn=BLOOD.on}return B.gore}
// a splash where a drop lands: two or three pixels, dark, a little see-through, so many of them darken the ground as a fight goes on
function splat(x,y){if(!B||!BLOOD.on)return;const X=Math.round(x),Y=Math.round(y),col=GORE.col[Math.random()*3|0],p=[[X,Y]];
  if(Math.random()<.7)p.push([X+(Math.random()<.5?-1:1),Y]);if(Math.random()<.4)p.push([X,Y+(Math.random()<.5?-1:1)]);
  goreLayer().each(X-1,Y-1,X+1,Y+1,g=>{g.fillStyle=col;g.globalAlpha=.55;for(const [a,b] of p)g.fillRect(a,b,1,1);g.globalAlpha=1})}
// a pool r pixels across (flattened: the ground seen at a slant), ragged at its edge; a few shapes, made once each
const POOLS={};
function poolSprite(r,seed){const key=r+'_'+seed;if(POOLS[key])return POOLS[key];const ry=Math.max(1,r*.5),h=seed*2.4+1,H=Math.ceil(ry);
  return POOLS[key]=mkc(r*2+3,H*2+3,g=>{for(let y=-H-1;y<=H+1;y++)for(let x=-r-1;x<=r+1;x++){
    const d=Math.hypot(x/(r+.5),y/(ry+.5)),n=Math.sin(x*1.7+h)*Math.cos(y*2.3+h*.3)*.18;if(d>1+n)continue;g.fillStyle=d<.45?GORE.col[0]:d<.8?GORE.col[1]:GORE.col[2];g.fillRect(x+r+1,y+H+1,1,1)}})}
// one of the fallen on g: q, how far through his fall (0-1); k, how far his pool has spread (0-1)
function drawBody(g,c,q,k){const S=c.sp,X=Math.round(c.x),Y=Math.round(c.y);
  if(k>0&&BLOOD.on&&!c.dry){const r=Math.max(1,Math.round(c.pool*Math.sqrt(k))),p=poolSprite(r,c.seed),px=S.beast?0:S.mount?2*c.face:7*c.face,py=S.beast||S.mount?2:3;g.globalAlpha=.85;g.drawImage(p,X+px-(p.width>>1),Y+py-(p.height>>1));g.globalAlpha=1}
  g.save();g.translate(X,Y);if(c.face<0)g.scale(-1,1);
  // (a beast, a mount: slumped low where it stood; its rider thrown forward of it)
  if(S.beast){const sp=S.beast,w=sp.width,h=sp.height,x0=-Math.floor(w/2),Q=q*q;
    if(S.down&&q>=.6)g.drawImage(S.down,x0,-h+2);// (down: lying dead, engine/beasts.js)
    else if(S.how==='over'){g.rotate(Q*Math.PI/2);g.drawImage(sp,x0,-h+2)}
    else if(S.how==='back'){const s=1-1.7*Q;if(s<0)g.translate(0,Math.round((h-2)*s*.5));g.scale(1,Math.abs(s)<.05?.05:s);g.drawImage(sp,x0,-h+2)}
    else{const s=1-(S.how==='melt'?.75:.5)*Q;g.drawImage(sp,x0,Math.round((-h+2)*s),w,Math.max(1,Math.round(h*s)))}}
  else{if(S.mount){if(q<1){const m=S.mount,s=1-.5*q*q;g.drawImage(m,-16,Math.round(1-31*s),32,Math.max(1,Math.round(32*s)))}else g.drawImage(S.down,-16,-19);g.translate(4,7)}
    if(S.wk&&q>=1){const w=weaponSprite(S.wk,S.team,c.skin,c.wi);g.drawImage(w,Math.round(c.wx)-w.R,Math.round(c.wy)-w.R)}
    if(q<1){g.translate(0,1);g.rotate(q*q*Math.PI/2);g.drawImage(S.stand,-12,-18)}else g.drawImage(S.body,-S.ax,1-S.ay)}
  g.restore()}
// all of them: the settled painted into the layer once (into each of its tiles the body reaches), and the layer drawn; those still
// falling or bleeding drawn as they are
function drawCorpses(){
  if(!B.corpses)return;const L=goreLayer(),bake=c=>{const X=Math.round(c.x),Y=Math.round(c.y),S=c.sp,r=Math.max(48,S&&S.beast?Math.max(S.beast.width,S.beast.height)+12:0);L.each(X-r,Y-r,X+r,Y+r,g=>drawBody(g,c,1,1))};
  if(B.goreOn!==BLOOD.on){B.goreOn=BLOOD.on;L.clear();for(const c of B.corpses)if(c.baked)bake(c)}// (blood switched: painted again)
  const live=[];
  for(const c of B.corpses){if(c.baked||!c.sp)continue;const t=B.t-(c.td||0),q=Math.min(1,t/GORE.fall),k=Math.min(1,Math.max(0,(t-GORE.fall)/GORE.pool));
    if(k>=1||q>=1&&(!BLOOD.on||c.dry)){bake(c);c.baked=true}else live.push([c,q,k])}
  drawLayer(L);for(const [c,q,k] of live)drawBody(ctx,c,q,k)}
/* ---------- C: movement. Feet kick up dust as they run (riders and big beasts a cloud), the colour of the ground; arrows stay
   where they strike, in the ground or in a man (in his shield, with splinters, when it takes them from the front) ---------- */
const dustCol=()=>({desert:'214,190,140',frost:'232,238,244',swamp:'118,118,92'}[B&&B.env&&B.env.c]||'170,152,112');
function footDust(u,dt){
  u.dustT=(u.dustT??Math.random()*.2)-dt;if(u.dustT>0)return;const m=!!(u.s.mounted||u.s.big),f=u.face||1;u.dustT=m?.07:.22;
  vfx({k:'dust',x:u.x-f*(m?6:2)+rnd(-2,2),y:u.y,vx:-f*rnd(5,15),vy:rnd(-4,0),r:m?rnd(2,3.5):rnd(1,2),grow:m?9:5,life:m?rnd(.5,.8):rnd(.3,.45),col:dustCol()})}
// (sunk in, slanting down the way it flew: a stub of shaft and a fletch, never mistaken for a weapon in his hand)
function stickArrow(e,a){if(!e||e.hp<=0)return;const ang=Math.atan2(a.vy||0,a.vx||1);e.stuckA=(e.stuckA||[]).filter(x=>B.t-x.t<5).slice(-2);e.stuckA.push({dx:rnd(-2,2),dy:-rnd(5,10),a:ang+(Math.cos(ang)>=0?.5:-.5),f:e.face||1,t:B.t})}
// (drawn on him, turning as he turns, for a while)
function drawStuck(u,x,y){if(!u.stuckA||!u.stuckA.length)return;for(const s of u.stuckA){const age=B.t-s.t;if(age>5)continue;const a=s.f===(u.face||1)?s.a:Math.PI-s.a,dx=s.f===(u.face||1)?s.dx:-s.dx;
  ctx.save();ctx.translate(x+dx,y+s.dy);ctx.rotate(a);ctx.globalAlpha=Math.min(1,(5-age)/1.5);ctx.fillStyle='#6a4a2a';ctx.fillRect(-3,0,3,1);ctx.fillStyle='#f2efe6';ctx.fillRect(-4,-1,1,1);ctx.fillRect(-4,1,1,1);ctx.restore()}}
/* ---------- D: the skills, each its own: helpers ---------- */
function vfxRing(x,y,r,col,life){vfx({k:'shock',x,y,r,life:life||.45,col})}
function vfxBurst(x,y,n,col,v0,v1,k,up){for(let i=0;i<n;i++){const b=rnd(0,6.283),v=rnd(v0,v1);vfx({k:k||'ember',x,y,vx:Math.cos(b)*v,vy:Math.sin(b)*v*(k==='spark'?.6:1)-(up||0),life:rnd(.3,.7),col})}}
function vfxCracks(x,y,n,len){for(let i=0;i<n;i++){const a=i/n*6.283+rnd(-.3,.3);vfx({k:'crack',x,y,a,len:len*rnd(.6,1.1),br:rnd(-.6,.6),life:rnd(1.2,1.8)})}}
function vfxSmoke(x,y,n){for(let i=0;i<n;i++)vfx({k:'dust',x:x+rnd(-6,6),y:y+rnd(-4,2),vx:rnd(-8,8),vy:rnd(-22,-10),r:rnd(3,5),grow:10,life:rnd(.7,1.1),col:'120,116,110'})}
function vfxGhost(u){const sp=unitSprite(u.type,spriteTeam(u),u.hero,u.v,0,true);vfx({k:'ghost',x:u.x,y:u.y-(u.z||0),face:u.face||1,sp,life:.22,col:sideCol(u,'say')})}
// a spell's explosion: a flash, a ring of fire, embers and smoke
function vfxExplode(x,y,r,col){vfx({k:'glow',x,y,r:r*1.1,life:.3,col:col||'#ffb050'});vfxRing(x,y+4,r,'255,150,70',.4);vfxBurst(x,y,16,'#ffd070',40,130,'ember',30);vfxBurst(x,y,6,'#ff7a30',20,70,'spark');vfxSmoke(x,y,5);shakeIt(3)}
// each moment: they move, slow, fall, fade (blood that lands leaves a stain that fades)
function vfxStep(dt){
  const L=B&&B.vfx;if(!L)return;
  for(const p of L){p.age+=dt;p.life-=dt;
    if(p.k==='spark'){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=VFX.grav*.6*dt;p.vx*=1-3*dt}
    else if(p.k==='dust'){p.x+=p.vx*dt;p.y+=p.vy*dt;const d=1-4*dt;p.vx*=d;p.vy*=d;p.r+=p.grow*dt}
    else if(p.k==='ember'){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=1-2*dt;p.vy-=20*dt}
    else if(p.k==='blood'){p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz-=VFX.grav*dt;if(p.z<=0){p.life=0;splat(p.x,p.y)}}
    else if(p.k==='swirl')p.a+=dt*22}
  for(const p of L)if(p.k==='fall'&&p.life<=0&&p.corpse)p.corpse.wait=false;
  B.vfx=L.filter(p=>p.life>0)}
const vfxA=p=>Math.max(0,Math.min(1,p.life/p.max));
// the ground layer: under the fighters
function vfxGround(){
  const L=B&&B.vfx;if(!L)return;
  for(const p of L){const a=vfxA(p);
    if(p.k==='crack'){const al=Math.min(1,a*2)*.7;ctx.strokeStyle='rgba(58,40,24,'+al.toFixed(2)+')';ctx.lineWidth=1;const mx=p.x+Math.cos(p.a)*p.len*.55,my=p.y+Math.sin(p.a)*p.len*.55*.5;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(mx,my);ctx.lineTo(p.x+Math.cos(p.a+p.br*.4)*p.len,p.y+Math.sin(p.a+p.br*.4)*p.len*.5);ctx.moveTo(mx,my);ctx.lineTo(mx+Math.cos(p.a+p.br)*p.len*.35,my+Math.sin(p.a+p.br)*p.len*.35*.5);ctx.stroke()}
    else if(p.k==='frost'){ctx.fillStyle='rgba(200,230,255,'+(.5*Math.min(1,a*2)).toFixed(2)+')';ctx.fillRect(Math.round(p.x),Math.round(p.y),2,1)}
    else if(p.k==='shock'){const q=1-a;ctx.strokeStyle='rgba('+p.col+','+(a*.8).toFixed(2)+')';ctx.lineWidth=2+2*a;ctx.beginPath();ctx.ellipse(p.x,p.y,p.r*(.3+.9*q),p.r*(.3+.9*q)*.45,0,0,6.283);ctx.stroke()}
    else if(p.k==='dust'){ctx.fillStyle='rgba('+p.col+','+(a*.45).toFixed(2)+')';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fill()}}}
// the air layer: over the fighters, glowing
function vfxAir(){
  const L=B&&B.vfx;if(!L)return;
  for(const p of L)if(p.k==='blood'){ctx.fillStyle='#c03232';ctx.fillRect(Math.round(p.x),Math.round(p.y-p.z),1,1)}
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const p of L){const a=vfxA(p);
    if(p.k==='spark'){ctx.strokeStyle=p.col;ctx.globalAlpha=a;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.05,p.y-p.vy*.05);ctx.stroke()}
    else if(p.k==='ember'){ctx.fillStyle=p.col;ctx.globalAlpha=a*(Math.random()<.2?.4:1);ctx.fillRect(Math.round(p.x),Math.round(p.y),1+(a>.6),1+(a>.6))}
    else if(p.k==='swirl'){ctx.lineWidth=2;for(let k=0;k<3;k++){const b=p.a+k*2.094;ctx.strokeStyle=k?p.col:'#ffffff';ctx.globalAlpha=a*(k?.6:.9);ctx.beginPath();ctx.arc(p.x,p.y,p.r*(.7+.3*(1-a)),b,b+1.1);ctx.stroke()}}
    else if(p.k==='ghost'){ctx.globalAlpha=a*.5;ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));if(p.face<0)ctx.scale(-1,1);ctx.drawImage(whiteOf(p.sp),-Math.floor(p.sp.width/2),-p.sp.height+2);ctx.restore()}
    else if(p.k==='glow'){const r=p.r*(1.2-.4*a),g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);g.addColorStop(0,p.col);g.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=a;ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,6.283);ctx.fill()}}
  ctx.restore()}
