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
// thin: a paper doll's (dollfigs.js): a line a pixel wide, unoutlined, as the owner's reference holds them
function weaponSprite(k,team,skin,i,len=WPN[k][0],thin=false){
  const key=k+team+skin+i+(len===WPN[k][0]?'':'L'+len)+(thin?'t':'');if(WEAPONS[key])return WEAPONS[key];
  const R=len+(thin?8:4),S=R*2+1,g=pgrid(S,S),deg=i/WEAPON_STEPS*360;
  drawBlade((x,y,c)=>pset(g,x,y,c),R,R,deg,k,pal(team),skin,len,thin);if(!thin)poutline(g);const c=pcanvas(g);c.R=R;c.n=++WEAPON_N;return WEAPONS[key]=c}
// a weapon's pixels from its hand (hx, hy) at deg (figures.js HandWeapon draws the same into a figure; a worker's tool's head too),
// len px long (WPN's, or the item's own: a flag's spear); returns the point just past its tip (a blow's flash)
// (a thin weapon always straight (the owner, 2026-11-07: "the sword looks bending"): drawn along the nearest of the 16 slopes a line
// a pixel wide steps evenly on, flat, 1 in 2, 45 degrees, 2 in 1 and upright each way (CLEAN_DEG); between them its pixels step
// unevenly and the blade looks bent, the kink moving as it turns)
const CLEAN_DEG=[0,26.565,45,63.435].flatMap(a=>[0,90,180,270].map(q=>a+q));
const cleanDeg=d=>{d=((d%360)+360)%360;let b=0,bd=1e9;for(const c of CLEAN_DEG){const e=Math.abs(((d-c+540)%360)-180);if(e<bd){bd=e;b=c}}return b};
function drawBlade(set,hx,hy,deg,k,Tm,skin,len=WPN[k][0],thin=false){if(thin)deg=cleanDeg(deg);
  const [,mat,head]=WPN[k],W=PPAL.wood,M=PPAL.steel,col=mat==='steel'?M[1]:W[1],a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  // (one pixel per step along the longer axis, so a slanted shaft is a single clean line, never two side by side)
  // (it returns its pixels: a blade's shine recolours the same ones, and a head sits on the shaft's own last pixel)
  const line=(x0,y0,ang,n,cl)=>{const pts=[];if(n<1)return pts;const ex=x0+Math.cos(ang)*(n-1),ey=y0+Math.sin(ang)*(n-1),st=Math.max(1,Math.round(Math.max(Math.abs(ex-x0),Math.abs(ey-y0))));for(let i=0;i<=st;i++){const p=[Math.round(x0+(ex-x0)*i/st),Math.round(y0+(ey-y0)*i/st)],q=pts[pts.length-1];
    // (a diagonal step gets its corner filled: one solid staircase the outline goes round once, not a chain of corners; with the
    //  paper dolls, unoutlined, a clean line a pixel wide, corner to corner)
    if(q&&q[0]!==p[0]&&q[1]!==p[1]&&!thin){const f=Math.abs(ex-x0)>=Math.abs(ey-y0)?[p[0],q[1]]:[q[0],p[1]];set(f[0],f[1],cl);pts.push(f)}set(p[0],p[1],cl);pts.push(p)}return pts};
  // (its butt below the hand: a pole's 3 px; a paper doll's, held across his back, 5, so it shows by his far leg as the reference's
  //  and never reaches under his feet, 2026-11-07: "make sure the sprite looks correct")
  line(hx,hy,a+Math.PI,POLE(k)&&k!=='javelin'?(thin&&k!=='lance'?5:3):1,W[2]);const shaft=line(hx,hy,a,len,col);
  const [tx,ty]=shaft[shaft.length-1];
  if(head==='guard'){shaft.slice(1).forEach(([x,y])=>set(x,y,M[0]));set(hx-s,hy+c,PPAL.gold[1]);set(hx+s,hy-c,PPAL.gold[2]);
    // (thin: its edge a tone darker down the blade's far side, its point lit, a pommel behind the hand)
    if(thin){shaft.slice(1,-1).forEach(([x,y],j)=>{if(j&1)set(x,y,M[1])});set(tx,ty,'#ffffff');set(Math.round(hx-c),Math.round(hy-s),PPAL.gold[2])}}
  // (a spearhead: thin (a paper doll's), on the shaft's last pixels (its length as it was): its socket, a leaf of steel three pixels
  //  long, a pixel either side of it where it widens; else its tip two pixels)
  const P=(t,n)=>[Math.round(tx+c*t-s*n),Math.round(ty+s*t+c*n)];
  if(head==='tip'&&thin){set(...P(-3,0),M[2]);set(...P(-2,0),M[1]);set(...P(-1,0),M[1]);set(...P(0,0),M[0]);set(...P(-2,-1),M[2]);set(...P(-2,1),M[2])}
  else if(head==='tip'){set(tx,ty,M[1]);set(tx+c,ty+s,M[0])}
  if(head==='pennant'&&thin){set(...P(-2,0),M[2]);set(...P(-1,0),M[1]);set(...P(0,0),M[0]);set(...P(-1,-1),M[2]);set(...P(-1,1),M[2]);set(tx-s,ty+c,Tm[1]);set(tx-s*2,ty+c*2,Tm[2])}
  else if(head==='pennant'){set(tx,ty,M[0]);set(tx-s,ty+c,Tm[1]);set(tx-s*2,ty+c*2,Tm[2]);set(tx-s-c,ty+c-s,Tm[1])}
  if(head==='axe'||head==='bigaxe'){for(let i=1;i<=(head==='bigaxe'?3:2);i++){set(tx-s*i,ty+c*i,M[1]);set(tx-s*i-c,ty+c*i-s,M[2])}if(head==='bigaxe')for(let i=1;i<=2;i++)set(tx+s*i,ty-c*i,M[1])}
  if(head==='hammer'){for(let i=-1;i<=1;i++){set(tx-s*i,ty+c*i,M[1]);set(tx-s*i-c,ty+c*i-s,M[2])}}
  // (a tool's head, across the haft at its end: px, py the way across, forward)
  const px=-s,py=c;
  if(head==='hoe'){set(tx+px,ty+py,M[2]);set(tx+px*2,ty+py*2,M[1]);set(tx+px*2-c,ty+py*2-s,M[1])}
  if(head==='pick'){for(const k2 of [-2,-1,1,2])set(tx+px*k2,ty+py*k2,Math.abs(k2)===1?M[1]:M[2]);set(tx+px*2-c,ty+py*2-s,M[2]);set(tx-px*2-c,ty-py*2-s,M[2])}
  if(head==='crook'){set(tx+c,ty+s,W[1]);set(tx+c+px,ty+s+py,W[1]);set(tx+px*2,ty+py*2,W[1]);set(tx+px*2-c,ty+py*2-s,W[2])}
  if(head==='rod'){for(let i=1;i<=5;i++)set(tx,ty+i,'#d8dce4')}
  set(hx,hy,skin);return[tx+c,ty+s]}
/* a missile in flight, pixel for pixel at the nearest of MISSILE_STEPS angles (the owner, 2026-11-06: "the spearhead, the arrow
   head"): its shaft, its head (an arrow's: a steel point and two barbs behind it; a javelin's: a leaf-shaped blade), an arrow's
   fletching; ax: its middle in its picture. MISSILE: each kind's [shaft from, to], head [from, to], barbs at, fletching, colours */
const MISSILE_STEPS=16,MISSILE={arrow:{shaft:[-4,2],head:[3,4],barb:3,fletch:[-5,-4],wood:'#c8a878',steel:['#eef0f4','#a8b0bc','#6e7682'],feather:'#e8e2d0'},
  javelin:{shaft:[-6,3],head:[4,6],barb:4,fletch:null,wood:'#9a6a3a',steel:['#eef0f4','#a8b0bc','#6e7682']}},MISSILE_PICS={};
function missileSprite(kind,ang){const S=MISSILE_STEPS,i=((Math.round(ang/(2*Math.PI)*S)%S)+S)%S,key=kind+i;if(MISSILE_PICS[key])return MISSILE_PICS[key];
  const M=MISSILE[kind],R=9,g=pgrid(2*R+1,2*R+1),a=i/S*2*Math.PI,c=Math.cos(a),s=Math.sin(a),at=(t,n,col)=>pset(g,R+Math.round(c*t-s*n),R+Math.round(s*t+c*n),col);
  for(let t=M.shaft[0];t<=M.shaft[1];t++)at(t,0,M.wood);
  if(M.fletch)for(let t=M.fletch[0];t<=M.fletch[1];t++){at(t,-1,M.feather);at(t,1,M.feather)}
  for(let t=M.head[0];t<=M.head[1];t++)at(t,0,t===M.head[1]?M.steel[0]:M.steel[1]);at(M.barb,-1,M.steel[2]);at(M.barb,1,M.steel[2]);
  const cv=pcanvas(g);cv.ax=R;return MISSILE_PICS[key]=cv}
// how he holds it now: [angle (degrees, 0 forward, -90 up), hand dx, hand dy] by what he is doing
const HOLD={
  // at rest, on the march, in a charge, in guard near a foe, stunned, a parry (raised across before him: battle/defence.js) and
  // a low one (down across his legs, meeting a low cut or a thrust: battle/duel.js)
  blade:{rest:62,march:-128,run:-122,guard:-38,stun:85,parry:-78,parryLow:32},heavy:{rest:58,march:-140,run:-118,guard:-55,stun:85,parry:-72,parryLow:28},
  pole:{rest:-90,march:-90,run:-6,guard:0,stun:70,parry:-48,parryLow:22},lance:{rest:-72,march:-76,run:4,guard:2,stun:60,parry:-40,parryLow:20}};
// (with the paper dolls, as the owner's reference holds them: a sword or an axe low at rest, 40 degrees off upright, a great one so
//  too; a spear, a pike or a javelin across his back, its tip up and forward, 35 degrees off upright, at rest and on the march;
//  POLE_BACK: the angles a pole goes behind him at)
// (a doll's blade walking and running as at rest, low before him (the owner, 2026-11-07: "the weapons seem shorter when walking":
//  over the shoulder, behind him, the body hid most of it), a little higher at a run; a great weapon, too long to hold low, upright
//  before him, its blade up and a little forward)
// (a one-handed axe carried head up, as a great weapon is, a little forward (the owner, 2026-11-07: "when walk it touches the ground":
//  held low its head hung under its haft to the ground); in a fight as a blade)
// (a blade on the move point up before him, standing low at his side: walking, low, its point by the ground at each step)
const HOLD_DOLL={blade:{...HOLD.blade,rest:50,march:-62,run:-55},hafted:{...HOLD.blade,rest:-62,march:-62,run:-55},heavy:{...HOLD.heavy,rest:-72,march:-72,run:-60},pole:{...HOLD.pole,rest:-55,march:-60},lance:HOLD.lance},POLE_BACK=[-80,-30];
// (d: the look, or whether he is a paper doll (a fighter's u.wDoll, heldNow); none: as the switch says)
// (a weapon's kind of hold: a lance, a pole, a great one (heavy), a one-handed axe (hafted), a blade)
const holdKind=k=>k==='lance'?'lance':POLE(k)?'pole':k==='great'||k==='bigaxe'||k==='hammer'?'heavy':k==='axe'?'hafted':'blade';
const holdTab=(kind,d)=>(d==null?DOLL_FIGS.on:typeof d==='object'?dollable(d):d)?HOLD_DOLL[kind]:HOLD[kind]||HOLD.blade;
// (behind him: the angles over his shoulder (GEAR.behind), or a pole across his back (a paper doll's))
const heldBack=(k,a,o)=>a>GEAR.behind[0]&&a<GEAR.behind[1]||o&&dollable(o)&&POLE(k)&&k!=='lance'&&a>POLE_BACK[0]&&a<POLE_BACK[1];
function holdOf(u,k){
  const kind=holdKind(k),H=holdTab(kind,u.wDoll),t=u.tgt&&u.tgt.hp>0?u.tgt:null,f=u.face||1;
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
// on the map (world/march.js drawMarcher): his weapon apart from his body, as in battle (the owner, 2026-11-03: "make a weapon
// sprite to look separated from the horse"), held at rest or on the march (HOLD: no blow nor foe there); its picture and corner
// from his sprite's, and whether it goes behind his body; null for none
/* sheathed off the field (the owner, 2026-11-07: "make weapon sheathing like pointing downward near the waist; make it realistic; only
   when non battle", then "the hero sheathing weapon looks very confusing"): on the map a sword or a dagger hangs from his belt behind
   him, its scabbard slung down and back so its end stands out past his hips and his back leg against the ground (the part over him
   hidden by his body, nothing laid over his tunic), plain leather, its chape steel; a one-handed axe so, its haft. Spears, great
   weapons and shooters' arms stay in his hand; on foot only (a rider's in his hand as before). In battle every weapon is drawn
   (heldNow). SHEATH: kinds, deg (the slant: 90 down, 180 back), at (its top from his hand: dx, dy), long (px more than the blade) */
// (show false (the owner, 2026-11-07, chose it: a sheath a few pixels big tangled with the body at the map's size): worn out of sight,
// no weapon drawn on him off the field; show true: its scabbard behind his hip as below)
const SHEATH={on:true,show:false,kinds:['sword','dagger','axe'],deg:150,at:[-5,-3],long:2},SHEATHS={};
function sheathSprite(k,team,skin){const key=k+team+skin;if(SHEATHS[key])return SHEATHS[key];
  const n=WPN[k][0]+SHEATH.long,R=n+3,g=pgrid(2*R+1,2*R+1),a=SHEATH.deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a),
    set=(x,y,col)=>pset(g,R+Math.round(x),R+Math.round(y),col),Lt=PPAL.leather,W=PPAL.wood,M=PPAL.steel;
  // (one clean line, a staircase with its corners filled so it never breaks into dots; its last pixel the chape, or an axe's haft end)
  let q=null;for(let t=0;t<n;t++){const x=Math.round(c*t),y=Math.round(s*t),last=t===n-1,col=k==='axe'?W[t&1?2:1]:last?M[1]:Lt[1];
    if(q&&q[0]!==x&&q[1]!==y)set(q[0],y,k==='axe'?W[2]:Lt[2]);set(x,y,col);q=[x,y]}
  const cv=pcanvas(g);cv.R=R;return SHEATHS[key]=cv}
// (a spear or a pike sloped over his shoulder on the march (the owner, 2026-11-07: "make spearmen carry spears over the shoulder on the
//  march"): from his hand its shaft back and up behind his shoulder, its head over and behind his head; on foot, walking, on the map only;
//  a javelin, short, in hand as before)
const SHOULDER={on:true,deg:-126,up:4};// (up: px slid up along its shaft, its butt ending at his hand (a doll's pole's is 5 px: drawBlade), never below it)
function mapHeld(L,sp,walking,step){
  const k=heldWeapon(L);if(!k||!sp.hand)return null;
  if(SHEATH.on&&SHEATH.kinds.includes(k)&&!L.mount&&dollable(L)){if(!SHEATH.show)return null;const w=sheathSprite(k,L.team,pal(L.skin)[1]);return{w,x:sp.hand[0]+SHEATH.at[0]-w.R,y:sp.hand[1]+SHEATH.at[1]-w.R,back:true,sheathed:true}}const kind=holdKind(k),sh=SHOULDER.on&&walking&&kind==='pole'&&k!=='javelin'&&!L.mount&&dollable(L),deg=sh?SHOULDER.deg:groundClamp(holdTab(kind,L)[walking?'march':'rest'],WPN[k][0],sp,L);
  const i=((Math.round(deg/360*WEAPON_STEPS)%WEAPON_STEPS)+WEAPON_STEPS)%WEAPON_STEPS,sw=walking?swayOf(step,false,L,k):null,w=weaponSprite(k,L.team,pal(L.skin)[1],i,undefined,dollable(L)),a=(i/WEAPON_STEPS*360+180)%360-180,up=sh?SHOULDER.up:0,ua=deg*Math.PI/180,x=sp.hand[0]-w.R+(sw?sw[0]:0)+Math.round(Math.cos(ua)*up),y=sp.hand[1]-w.R+(sw?sw[1]:0)+Math.round(Math.sin(ua)*up);
  return{w,x,y,back:heldBack(k,a,L)&&peeks(sp,w,x,y)}}
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
// (a flag man's spear in battle drawn BATTLE_BANNER.pole longer, so his flag flies over his head (marchgear.js); else its own length)
const flagPole=(u,k)=>POLE(k)&&B&&!B.over&&typeof battleFlag==='function'&&battleFlag(u)?WPN[k][0]+BATTLE_BANNER.pole:undefined;
// (a doll's weapon never through the ground (the owner, 2026-11-07: "make sure the sprite looks correct"): pointing down, its tip a
// pixel over the row his feet stand on (the picture's height less 2), however long it is: an axe low as a sword, not cut off)
const downClamp=(deg,len,drop)=>{const a=((deg%360)+360)%360,s=Math.sin(a*Math.PI/180);if(s<=0||len*s<=drop)return deg;const m=Math.asin(Math.max(0,Math.min(1,drop/len)))*180/Math.PI;return a<=90?m:180-m};
// (the room under his hand taken as he stands (DOLL_DROP at most), never the swing of one step's: his weapon at one angle the whole
// walk long, not jumping between two as his arm swings)
const DOLL_DROP=2;// (2: its tip clear of the ground though his hand dips a pixel as each foot lands, the owner: "when walk it touches the ground")
function groundClamp(deg,len,sp,o){return dollable(o)&&sp.hand?downClamp(deg,len,Math.min(DOLL_DROP,sp.height-3-sp.hand[1])):deg}
/* a weapon carried on the move moves with his stride (the owner, 2026-11-07: "make weapon at least shake or moving a bit with unit
   walking animations", then "make weapon shift from up to down or left to right instead of changing the angle"): by the walk's or the
   run's four frames (contact, pass, contact, pass) it is moved, never turned: [dx, dy] px (+x toward his front, +y down), its own
   angle kept; besides, his hand goes down with him as each foot lands (engine/doll.js POSES.walk). Only as he carries it (no foe at
   hand, no blow); in the saddle his hand bobs with his mount's gait already (its frames), the weapon still at a walk, moved so at a run */
// (pole: a spear's, a pike's, a lance's, a pixel higher all the walk long, its butt over the ground though his hand dips as he steps)
const WEAPON_SWAY={on:true,walk:[[0,0],[1,-1],[0,0],[-1,-1]],run:[[1,-1],[0,0],[-1,-1],[0,0]],pole:{walk:[[0,-1],[1,-1],[0,-1],[-1,-1]],run:[[1,-1],[0,-1],[-1,-1],[0,-1]]}};
const swayOf=(step,run,L,k)=>{if(!WEAPON_SWAY.on||step==null||step<0||L?.mount&&!run)return null;const T=k&&POLE(k)?WEAPON_SWAY.pole:WEAPON_SWAY;return (run?T.run:T.walk)[step&3]};
// (the battle's pose's stride: [frame 0-3, running], or null standing or striking)
const poseStride=pose=>pose>=2&&pose<=5?[pose-2,false]:pose>=15&&pose<=18?[pose-15,true]:null;
function heldNow(u,o,sp,pose){
  const k=heldWeapon(o);if(!k||!sp.hand)return null;u.wDoll=dollable(o);const [deg0,hx,hy]=heldAngle(u,k),deg=groundClamp(deg0,WPN[k][0],sp,o),dx=sp.rig?0:hx,dy=sp.rig?0:hy,f=deg/360*WEAPON_STEPS;// (rigged: the fist carries it, people.js BLOW_RIG)
  // (the step drawn changes only when the angle is well past the middle between two: no flicker on the boundary)
  if(u.wIdx==null||Math.abs(((f-u.wIdx)%WEAPON_STEPS+WEAPON_STEPS*1.5)%WEAPON_STEPS-WEAPON_STEPS/2)>.8)u.wIdx=Math.round(f);
  const st=!u.nearW&&!sp.rig?poseStride(pose):null,sw=st?swayOf(st[0],st[1],o,k):null;
  const i=((u.wIdx%WEAPON_STEPS)+WEAPON_STEPS)%WEAPON_STEPS,w=weaponSprite(k,o.team,pal(o.skin)[1],i,flagPole(u,k),dollable(o)),a=(i/WEAPON_STEPS*360+180)%360-180;
  HELD.w=w;HELD.k=k;HELD.i=i;HELD.x=sp.hand[0]+Math.round(dx)-w.R+(sw?sw[0]:0);HELD.y=sp.hand[1]+Math.round(dy)-w.R+(sw?sw[1]:0);HELD.back=heldBack(k,a,o)&&peeks(sp,w,HELD.x,HELD.y);return HELD}
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
