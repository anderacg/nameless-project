'use strict';
/* ---------- weapons held apart from the body: in battle a fighter's melee weapon (sword, greatsword, dagger, axe, big axe,
   hammer, spear, pike, javelin, lance) is drawn on its own over the body, at the hand (each body frame says where it is:
   sprite.hand), turned to fit what he is doing. Pixel art does not rotate freely, so each weapon is drawn once at each of
   WEAPON_STEPS angles round the hand, outlined, and kept. A sword hangs point down at rest, rides the shoulder on the march,
   is raised up and back in a charge, held in guard near a foe and swung in a smooth arc; a spear stands upright at rest, is
   levelled forward in a charge and pointed at the foe close by, and thrust; drawn behind the body while it points up and back
   over the shoulder (GEAR.behind: a sword on the march, a wind-up) while it still shows past the body (peeks), else in front. Bows, crossbows, slings and staves turn with
   the body's frames, so they are kept with its pose (figures.js ShooterGear). ---------- */
const WEAPON_STEPS=32;
const heldWeapon=o=>o&&WPN[o.weapon]?o.weapon:null;
const POLE=k=>k==='spear'||k==='pike'||k==='javelin'||k==='lance';
// the weapon at angle step i (0: pointing forward, a quarter turn: down), round its hand at the canvas's middle; len: its length
// if not WPN's (a flag's longer spear: marchgear.js)
const WEAPONS={};let WEAPON_N=0;
function weaponSprite(k,team,skin,i,len=WPN[k][0]){
  const key=k+team+skin+i+(len===WPN[k][0]?'':'L'+len);if(WEAPONS[key])return WEAPONS[key];
  const R=len+4,S=R*2+1,g=pgrid(S,S),deg=i/WEAPON_STEPS*360;
  drawBlade((x,y,c)=>pset(g,x,y,c),R,R,deg,k,pal(team),skin,len);poutline(g);const c=pcanvas(g);c.R=R;c.n=++WEAPON_N;return WEAPONS[key]=c}
// a weapon's pixels from its hand (hx, hy) at deg (figures.js HandWeapon draws the same into a figure; a worker's tool's head too),
// len px long (WPN's, or the item's own: a flag's spear); returns the point just past its tip (a blow's flash)
function drawBlade(set,hx,hy,deg,k,Tm,skin,len=WPN[k][0]){
  const [,mat,head]=WPN[k],W=PPAL.wood,M=PPAL.steel,col=mat==='steel'?M[1]:W[1],a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  // (one pixel per step along the longer axis, so a slanted shaft is a single clean line, never two side by side)
  // (it returns its pixels: a blade's shine recolours the same ones, and a head sits on the shaft's own last pixel)
  const line=(x0,y0,ang,n,cl)=>{const pts=[];if(n<1)return pts;const ex=x0+Math.cos(ang)*(n-1),ey=y0+Math.sin(ang)*(n-1),st=Math.max(1,Math.round(Math.max(Math.abs(ex-x0),Math.abs(ey-y0))));for(let i=0;i<=st;i++){const p=[Math.round(x0+(ex-x0)*i/st),Math.round(y0+(ey-y0)*i/st)],q=pts[pts.length-1];
    // (a diagonal step gets its corner filled: one solid staircase the outline goes round once, not a chain of corners)
    if(q&&q[0]!==p[0]&&q[1]!==p[1]){const f=Math.abs(ex-x0)>=Math.abs(ey-y0)?[p[0],q[1]]:[q[0],p[1]];set(f[0],f[1],cl);pts.push(f)}set(p[0],p[1],cl);pts.push(p)}return pts};
  line(hx,hy,a+Math.PI,POLE(k)&&k!=='javelin'?3:1,W[2]);const shaft=line(hx,hy,a,len,col);
  const [tx,ty]=shaft[shaft.length-1];
  if(head==='guard'){shaft.slice(1).forEach(([x,y])=>set(x,y,M[0]));set(hx-s,hy+c,PPAL.gold[1]);set(hx+s,hy-c,PPAL.gold[2])}
  if(head==='tip'){set(tx,ty,M[1]);set(tx+c,ty+s,M[0])}
  if(head==='pennant'){set(tx,ty,M[0]);set(tx-s,ty+c,Tm[1]);set(tx-s*2,ty+c*2,Tm[2]);set(tx-s-c,ty+c-s,Tm[1])}
  if(head==='axe'||head==='bigaxe'){for(let i=1;i<=(head==='bigaxe'?3:2);i++){set(tx-s*i,ty+c*i,M[1]);set(tx-s*i-c,ty+c*i-s,M[2])}if(head==='bigaxe')for(let i=1;i<=2;i++)set(tx+s*i,ty-c*i,M[1])}
  if(head==='hammer'){for(let i=-1;i<=1;i++){set(tx-s*i,ty+c*i,M[1]);set(tx-s*i-c,ty+c*i-s,M[2])}}
  // (a tool's head, across the haft at its end: px, py the way across, forward)
  const px=-s,py=c;
  if(head==='hoe'){set(tx+px,ty+py,M[2]);set(tx+px*2,ty+py*2,M[1]);set(tx+px*2-c,ty+py*2-s,M[1])}
  if(head==='pick'){for(const k2 of [-2,-1,1,2])set(tx+px*k2,ty+py*k2,Math.abs(k2)===1?M[1]:M[2]);set(tx+px*2-c,ty+py*2-s,M[2]);set(tx-px*2-c,ty-py*2-s,M[2])}
  if(head==='crook'){set(tx+c,ty+s,W[1]);set(tx+c+px,ty+s+py,W[1]);set(tx+px*2,ty+py*2,W[1]);set(tx+px*2-c,ty+py*2-s,W[2])}
  if(head==='rod'){for(let i=1;i<=5;i++)set(tx,ty+i,'#d8dce4')}
  set(hx,hy,skin);return[tx+c,ty+s]}
// how he holds it now: [angle (degrees, 0 forward, -90 up), hand dx, hand dy] by what he is doing
const HOLD={
  // at rest, on the march, in a charge, in guard near a foe, stunned, a parry (raised across before him: battle/defence.js) and
  // a low one (down across his legs, meeting a low cut or a thrust: battle/duel.js)
  blade:{rest:62,march:-128,run:-122,guard:-38,stun:85,parry:-78,parryLow:32},heavy:{rest:58,march:-140,run:-118,guard:-55,stun:85,parry:-72,parryLow:28},
  pole:{rest:-90,march:-90,run:-6,guard:0,stun:70,parry:-48,parryLow:22},lance:{rest:-72,march:-76,run:4,guard:2,stun:60,parry:-40,parryLow:20}};
function holdOf(u,k){
  const kind=k==='lance'?'lance':POLE(k)?'pole':k==='great'||k==='bigaxe'||k==='hammer'?'heavy':'blade',H=HOLD[kind],t=u.tgt&&u.tgt.hp>0?u.tgt:null,f=u.face||1;
  // the foe's direction as he sees it (he faces right in his own picture)
  const aim=t?clamp(Math.atan2(t.y-6-(u.y-6),Math.abs(t.x-u.x)+.01)*180/Math.PI,-40,35):0;
  if(u.stun>0)return[H.stun,0,1];
  if(Defence.now(u)==='parry')return u.defH==='low'?[H.parryLow,2,1]:[H.parry,2,-2];
  // (a blow: its look (battle/duel.js: a low cut, a thrust from above, a shield bash) or its style)
  if(u.atkAt!=null&&B.t-u.atkAt<ATK_ANIM){const p=(B.t-u.atkAt)/ATK_ANIM,st=u.atkLook||u.atkStyle||'swing';
    if(st==='bash')return[H.guard,-2,0];
    if(st==='thrust'||POLE(k)&&st!=='overhead'){const push=Math.sin(Math.PI*Math.min(1,p*1.3));return[(POLE(k)?aim:aim-10)+(st==='high'?-28:st==='low'?22:0),-2+push*5,st==='high'?-2:st==='low'?1:0]}
    // (a wind-up held a moment, then the strike, fast, then it comes back a little)
    const q=p<.3?0:p<.55?(p-.3)/.25:1-Math.min(1,(p-.55)/.45)*.12;
    if(st==='low')return[-30+q*95,-1+q*2,1+q*2];
    if(st==='overhead')return[-100+q*170,q*2-1,-1+q*2];
    return[-120+q*165,-3+q*4,-3+q*4]}
  // (each state has room before it changes back, so a man on its edge does not flicker between two holds)
  const dn=t?Math.hypot(t.x-u.x,t.y-u.y):1e9,R=(u.s.reach||12);u.nearW=dn<R+22||u.nearW&&dn<R+34;
  if(u.nearW)return kind==='pole'||kind==='lance'?[aim,1,0]:[H.guard,0,0];
  const moving=u.spdNow>0||(u.movF||0)>0;if(!moving)return[H.rest,0,0];
  u.runW=u.spdNow>u.s.spd*.75||u.runW&&u.spdNow>u.s.spd*.6;const running=u.runW;return running?[kind==='pole'||kind==='lance'?H.run+aim*.3:H.run,0,kind==='pole'?0:-1]:[H.march,0,0]}
// draw it, in the fighter's own (already turned) frame: (bx, by) is where his sprite's corner went
// (the weapon turns toward how he should hold it, WEAPON_TURN degrees a second, never snapping: a man whose state flickers from
// one frame to the next, a step and a halt as he settles in his place, would otherwise show his weapon at two angles at once.
// A blow is followed as it is)
const WEAPON_TURN=420;
function heldAngle(u,k){
  let [deg,dx,dy]=holdOf(u,k);const dt=Math.min(.1,Math.max(0,B.t-(u.wT??B.t)));u.wT=B.t;
  u.wAng=deg;// (straight to the hold: a sweep from hold to hold looked like spinning)
  u.wDx=u.wDx==null?dx:u.wDx+(dx-u.wDx)*Math.min(1,dt*12);u.wDy=u.wDy==null?dy:u.wDy+(dy-u.wDy)*Math.min(1,dt*12);
  return[u.wAng,u.wDx,u.wDy]}
// (the weapon in his hand this frame, worked out once (HELD, one record, no allocation a frame): its picture, its corner from his
// sprite's, and whether it goes behind his body (GEAR.behind); null for none. render.js drawUnit draws it before his body or after)
const HELD={w:null,x:0,y:0,back:false,k:null,i:0};// (k, i: the weapon and its angle's step: a flag's cloth at its tip, marchgear.js)
function heldNow(u,o,sp){
  const k=heldWeapon(o);if(!k||!sp.hand)return null;const [deg,hx,hy]=heldAngle(u,k),dx=sp.rig?0:hx,dy=sp.rig?0:hy,f=deg/360*WEAPON_STEPS;// (rigged: the fist carries it, people.js BLOW_RIG)
  // (the step drawn changes only when the angle is well past the middle between two: no flicker on the boundary)
  if(u.wIdx==null||Math.abs(((f-u.wIdx)%WEAPON_STEPS+WEAPON_STEPS*1.5)%WEAPON_STEPS-WEAPON_STEPS/2)>.8)u.wIdx=Math.round(f);
  const i=((u.wIdx%WEAPON_STEPS)+WEAPON_STEPS)%WEAPON_STEPS,w=weaponSprite(k,o.team,pal(o.skin)[1],i),a=(i/WEAPON_STEPS*360+180)%360-180;
  HELD.w=w;HELD.k=k;HELD.i=i;HELD.x=sp.hand[0]+Math.round(dx)-w.R;HELD.y=sp.hand[1]+Math.round(dy)-w.R;HELD.back=a>GEAR.behind[0]&&a<GEAR.behind[1]&&peeks(sp,w,HELD.x,HELD.y);return HELD}
// (a picture's alpha by pixel, read once)
function alphaOf(c){if(c.alpha)return c.alpha;const d=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data,A=new Uint8Array(c.width*c.height);for(let i=0;i<A.length;i++)A[i]=d[i*4+3];return c.alpha=A}
/* (behind the body sp at (x, y), does the weapon w still show past it, GEAR.peek of its pixels at least? A sword on the shoulder
   from a hand before the belt lies all over his body: behind it only its hilt would show (the owner, 2026-11-01: "the hero battle
   unit should also draw a weapon from start to finish"), so it is drawn before him instead. Kept on the body, by weapon and place) */
function peeks(sp,w,x,y){const m=sp.peek||(sp.peek=new Map()),k=(w.n*256+x+128)*256+y+128;let v=m.get(k);if(v!=null)return v;
  const A=alphaOf(sp),Wa=alphaOf(w);let n=0,out=0;
  for(let j=0;j<w.height;j++)for(let i=0;i<w.width;i++){if(!Wa[j*w.width+i])continue;n++;const X=x+i,Y=y+j;if(X<0||Y<0||X>=sp.width||Y>=sp.height||!A[Y*sp.width+X])out++}
  m.set(k,v=out>=n*GEAR.peek);return v}
function drawHeld(u,o,sp,bx,by,flash){const h=heldNow(u,o,sp);if(h)ctx.drawImage(flash?whiteOf(h.w):h.w,bx+h.x,by+h.y)}
