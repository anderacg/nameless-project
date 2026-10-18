'use strict';
/* ---------- unit physics (PHYSICS.on; off in tests/harness.js, so every older fingerprint stays as it was). Every soldier has a
   mass (by his kind and armour), a heading and a speed. He speeds up toward the pace his move asks for at his kind's acceleration
   (less tired, less on bad ground or uphill), slows at its braking, and turns at its turning rate (slower the faster he goes), so
   riders need a run-up, cannot stop on the spot, overshoot and wheel round wide; a line ordered to face a flank takes time to turn;
   the side a blow lands on follows his heading (morale.js facing).
   A charge lands with its momentum (morale.js chargeMul): its damage bonus is the old one, CHARGE's, by momentum (the run that
   built it, never more than the speed it still has at the blow: momentum), and its push is this impact in place of chargePush and
   chargeJolt: the two bodies go on together (a hit that does not bounce), the one struck thrown back by what that leaves him (u.kx,
   u.ky, the slide every knock already uses: battle.js) and down a moment if thrown hard; heavy men, men backed by their ranks and a
   shield wall weigh more and give less; braced spears (morale.js spearBraced) stop the charge dead and hurt the riders; a wedge
   rider hits with its weight behind him. The jostle between soldiers shares the overlap by mass (battle.js jostle), so the heavy
   shove the light; routers stumble and wander (PHYSICS.rout, the battle's own seeded stream: physRng). All its numbers are here
   ---------- */
const PHYSICS={on:true,
  // mass: a man on foot by his armour (×heavy for heavy troops); a mount adds horse; beasts by kind, else beast (big: big)
  mass:{none:1,leather:1.1,mail:1.3,plate:1.55,hide:1.2,heavy:1.1,horse:3.2,beast:1.3,big:7,
    kinds:{wolf:.9,spider:.8,slime:1,boar:1.6,tiger:2,griffin:2.5,bear:4,troll:7,wyrm:10,dragon:20}},
  // how each kind moves: acc (px/s² speeding up), brake (px/s² slowing), turn (rad/s at full speed), turn0 (at a standstill).
  // heavy: plate or heavy foot; light: beasts under light; big: big ones, and any as heavy as heavyAt
  kinds:{foot:{acc:150,brake:260,turn:7,turn0:9},heavy:{acc:75,brake:200,turn:5,turn0:7},cav:{acc:90,brake:100,turn:2.2,turn0:6},
    light:{acc:220,brake:300,turn:8,turn0:10},beast:{acc:110,brake:160,turn:4,turn0:6},big:{acc:40,brake:70,turn:1.5,turn0:2.4}},
  light:1.2,heavyAt:5,
  // wheel: the speed kept turning, (cos + wheel)/(1 + wheel) of it (90° off a quarter, turned right round none); near: closer than
  // this to where he stops, he lines up first (cos² of it: no circling his place); spur: spurred riders gather speed this much
  // faster; press: how fast one pressing into a foe is slowed by him (a second, by the foe's share of their masses: physShare)
  wheel:.3,near:24,spur:2,press:6,
  /* a charge's impact (physImpact, physBraced): kb, the throw (× the speed the two go on with); support, the share of the mass
     of each man close behind him (within supR, up to supN) the one struck is backed by; wall: a shield wall's mass ×; wedge: a
     wedge rider's mass × (1 + wedge × its bonus); down: thrown faster than this (px/s) × his own mass, he is down downT × (thrown/that) s
     (downMin to downMax); splash: those within splashR of him thrown by this share (down too, by a wedge); brace: a braced
     spear's counter, braceHurt × his blow × the momentum, the rider stopped, thrown back braceBack of his speed and staggered
     braceStun s; blow: a heavy beast's blow (at least blowMass) throws by blow × its share of the two masses; shake: the
     momentum (mass × px/s) of a full jolt of the view (vfx.js jolt: never with reduced motion); downShock: a man knocked down
     shakes his unit's morale this much (morale.js shake) */
  hit:{kb:1.1,support:.6,supR:16,supN:3,wall:2.5,wedge:3,down:45,downT:.8,downMin:.5,downMax:1.4,splash:.5,splashR:16,
    braceHurt:1,braceBack:.25,braceStun:.4,blow:65,blowMass:4,shake:300,downShock:2},
  // routers: their way wanders up to wob rad off, by jit rad a second, drawn back back a second; a stumble trip times a second
  // (his speed × tripK)
  rout:{wob:.6,jit:3,back:.5,trip:.25,tripK:.4},
  // feel: dust (every dustEvery s at most) when a rider or big beast brakes harder than dust of his braking, or turns faster than
  // wheel of his turning at over half speed; drawn only (render.js): lean, rad at full speed, plus acc at full acceleration (back,
  // braking); downFall, downRise: s to fall and to get up
  feel:{dust:.6,wheel:.8,dustEvery:.12,lean:.1,acc:.08,downFall:.18,downRise:.25}
};
// his mass (kept until his stats change: a quiver run dry)
function physMass(u){const s=u.s;if(u.pmass!=null&&u.pmassOf===s)return u.pmass;const M=PHYSICS.mass;let m;
  if(s.beast||s.big)m=M.kinds[u.type]??(s.big?M.big:M.beast);else{m=(M[armorOf(s)]||1)*(tagsOf(s).includes('heavy')?M.heavy:1);if(s.mounted)m+=M.horse}
  u.pmassOf=s;return u.pmass=m}
// how his kind moves (PHYSICS.kinds)
function physKind(u){const s=u.s,K=PHYSICS.kinds,m=physMass(u);
  return s.big||m>=PHYSICS.heavyAt?K.big:s.beast?(m<PHYSICS.light?K.light:K.beast):s.mounted?K.cav:armorOf(s)==='plate'||tagsOf(s).includes('heavy')?K.heavy:K.foot}
// the battle's own stream for physics' dice (never Math.random: a battle with physics draws the same numbers as without it),
// seeded from where everyone stood when first needed
function physRng(){const P=B.phys||(B.phys={});if(!P.r){let h=(0x9E3779B9^B.units.length)>>>0;for(const u of B.units)h=Math.imul(h^Math.round(u.x*8+u.y*3),2654435761)>>>0;P.r=seeded(h)}return P.r}
/* his own move this moment: toward (mx, my) (a unit vector; 0, 0: none, he slows to a stop) at up to top px/s (on this ground,
   groundMul by his heading); arr: how far he has to go to stop there (null: on through, a chase or a way's bend); want: the way he
   turns to, still (null: as he is); spur: spurred. He turns his heading (u.hd) toward it, speeds up or slows (u.vel), goes on
   along his heading. The distance he went */
function physGo(u,dt,mx,my,top,arr,want,spur){
  const P=PHYSICS,K=physKind(u);if(u.hd==null){u.hd=u.dir!=null?u.dir:u.face<0?Math.PI:0;u.vel=0}
  const go=!!(mx||my)&&top>0,wa=go?Math.atan2(my,mx):want;let df=0;u.trn=0;
  if(wa!=null){df=Math.atan2(Math.sin(wa-u.hd),Math.cos(wa-u.hd));const w=(K.turn0+(K.turn-K.turn0)*clamp(u.vel/Math.max(1,u.s.spd),0,1))*dt,d=clamp(df,-w,w);u.hd=Math.atan2(Math.sin(u.hd+d),Math.cos(u.hd+d));df-=d;u.trn=d/Math.max(dt,1e-6)}
  if(!go&&!(u.vel>0)){u.acl=0;u.pstep=0;u.pf=B.t;return 0}
  const ch=Math.cos(u.hd),sh=Math.sin(u.hd),gm=groundMul(u,ch,sh);let s=0;
  if(go){const c=Math.cos(df);s=top*gm*(arr!=null&&arr<P.near?Math.max(0,c)**2:clamp((c+P.wheel)/(1+P.wheel),0,1));if(arr!=null)s=Math.min(s,Math.sqrt(2*K.brake*Math.max(0,arr-.5)))}
  const tm=tiredMul(u).spd,dv=clamp(s-u.vel,-K.brake*clamp(1/gm,.8,1.5)*dt,K.acc*tm*tm*gm*(spur?P.spur:1)*dt);
  u.acl=dv/Math.max(dt,1e-6);u.vel=Math.max(0,u.vel+dv);const d=u.vel*dt;u.x+=ch*d;u.y+=sh*d;u.pf=B.t;u.pstep=d;return d}
/* a soldier's move under his group (actors.js aiUnit, physics on): physGo, then his facing, heading and charge run as the old
   step kept them (o: chase, back, wk, routed, spurred, tm, dx, dy, s, from aiUnit). Facing a foe or his formation's way he turns,
   not snaps (want) */
function physAct(u,g,t,dt,mv,mx,my,spd,arr,o){
  const top=spd*(u.slow>0?.5:1)*(u.buffT>0?1.25:1),want=u.inSlot&&g?g.face:t?Math.atan2(o.dy,o.dx):null;
  const sp=physGo(u,dt,mv?mx:0,mv?my:0,mv?top:0,arr,want,o.spurred);u.spdNow=u.vel;
  if(sp>0){ownStep(u);u.dir=u.hd}
  const c=Math.cos(u.hd);if(sp>0||!(o.s.range&&!roundFire(u))&&(t||u.inSlot)){if(Math.abs(c)>(sp>0?.35:.2))u.face=c>0?1:-1}
  if(mv)u.run=o.chase&&!o.back&&!o.wk&&!o.routed?(u.run||0)+sp*o.tm.run*groundRun(u,c,Math.sin(u.hd),sp):o.spurred?u.run:0;
  else{if(t&&!u.inSlot)u.dir=u.hd;if(!o.spurred)u.run=Math.max(0,(u.run||0)-CHARGE.run*dt)}
  physFeel(u,dt)}
// knocked down: he lies till he gets up (no blow, no move but his slide); true while he is down (actors.js aiUnit)
function physDown(u,dt){if(!(u.down>0))return false;u.down-=dt;u.shot=null;u.vel=0;u.acl=0;u.pstep=0;u.pf=B.t;u.spdNow=0;return true}
// a router's wandering, stumbling way (morale.js routStep, physics on): (mx, my) his way off, top his speed
function physRout(u,dt,mx,my,top){
  const R=PHYSICS.rout,r=physRng();u.wob=clamp(((u.wob||0)+(r()-.5)*2*R.jit*dt)*(1-R.back*dt),-R.wob,R.wob);if(r()<R.trip*dt)u.vel=(u.vel||0)*R.tripK;
  const a=Math.atan2(my,mx)+u.wob,sp=physGo(u,dt,Math.cos(a),Math.sin(a),top,null,null,false);u.spdNow=u.vel;if(sp>0){ownStep(u);u.dir=u.hd;u.face=Math.cos(u.hd)>=0?1:-1}physFeel(u,dt);return sp}
// the momentum a charge lands with, 0 to 1 (morale.js momentum): the share of his top speed he still has
function physSpeed(u){return clamp((u.vel||0)/Math.max(1,u.s.spd),0,1)}
// the mass behind the one struck (a toward him from the blow): his own, his ranks close behind him, a shield wall
function physBacked(t,a){
  const H=PHYSICS.hit,c=Math.cos(a),s=Math.sin(a);let m=physMass(t),n=0;
  for(const o of spatialOn()?SG.near(t.x,t.y,H.supR+1,t.team,false):B.units){if(n>=H.supN)break;if(o===t||o.team!==t.team||o.hp<=0||o.rout||o.down>0)continue;
    const dx=o.x-t.x,dy=o.y-t.y,al=dx*c+dy*s;if(al>2&&al<H.supR&&Math.abs(dx*s-dy*c)<8){m+=H.support*physMass(o);n++}}
  return m*(shieldWallActive(t)?H.wall:1)}
// thrown back by dv px/s along a; down a moment if hard enough for his weight (heavy men stand firmer; riders and big ones never)
function physThrow(t,a,dv,canDown){
  const H=PHYSICS.hit;if(!(dv>0)||t.hp<=0)return;t.kx=(t.kx||0)+Math.cos(a)*dv;t.ky=(t.ky||0)+Math.sin(a)*dv;
  if(canDown&&dv>H.down*physMass(t)&&!t.s.big&&!t.s.mounted&&!(t.down>0)){t.down=t.downFor=clamp(H.downT*dv/(H.down*physMass(t)),H.downMin,H.downMax);t.shot=null;t.vel=0;if(!steady(t))shake(t,H.downShock)}}
/* a charge lands (morale.js chargeMul, physics on, in place of chargePush and chargeJolt): the rider (or runner) u and t go on
   together at the speed their masses leave; t is thrown by that and those beside him by splash of it; u keeps only it */
function physImpact(u,t,m){
  const H=PHYSICS.hit,a=Math.atan2(t.y-u.y,t.x-u.x),va=Math.max(0,(u.vel||0)*Math.cos(a-(u.hd??a)));if(!(va>0))return;
  const W=u.s.charge&&u.grp?wedgeMembers(u.grp):[],wb=W.includes(u)?wedgeBonus(W.length):0,ma=physMass(u)*(1+H.wedge*wb),mt=physBacked(t,a),vc=va*ma/(ma+mt),dv=vc*H.kb;
  physThrow(t,a,dv,true);
  for(const o of spatialOn()?SG.near(t.x,t.y,H.splashR+1,t.team,false):B.units)if(o!==t&&o.team===t.team&&o.hp>0&&!o.s.big&&Math.hypot(o.x-t.x,o.y-t.y)<H.splashR)physThrow(o,a,dv*H.splash*physMass(t)/physMass(o),wb>0);
  u.vel=Math.min(u.vel,vc);if((u.s.charge||u.s.big)&&m>SHAKE.charge)jolt(SHAKE.amp*clamp(ma*va/H.shake,0,1.25))}
// braced spears take a charge (morale.js chargeMul, physics on): the rider stopped dead, thrown back, staggered, and hurt
function physBraced(u,t,m){
  const H=PHYSICS.hit,a=Math.atan2(u.y-t.y,u.x-t.x),v=u.vel||0;u.vel=0;u.kx=(u.kx||0)+Math.cos(a)*v*H.braceBack;u.ky=(u.ky||0)+Math.sin(a)*v*H.braceBack;stun(u,H.braceStun);
  hit(t,u,meleeDmgOf(t.s)*H.braceHurt*m);fx(t.x,t.y-6,'#cfe0ff',4)}
// a heavy beast's blow (attacks.js attack, physics on): the one it hits thrown by its weight, and down if hard enough
function physBlow(u,t){const H=PHYSICS.hit,ma=physMass(u);if(ma<H.blowMass||t.hp<=0)return;const mt=physMass(t);physThrow(t,Math.atan2(t.y-u.y,t.x-u.x),H.blow*ma/(ma+mt),true)}
/* the jostle's share of the overlap a gives (b the rest: battle.js jostle; dx, dy from a to b), the lighter more; one pressing
   into a foe (heading at him: dt the frame) is slowed by him, the lighter more (PHYSICS.press: a rider ploughing into a crowd is
   soon held in it, a troll barely; one breaking away is not held) */
function physShare(a,b,dt,dx,dy){const ma=physMass(a),mb=physMass(b),f=mb/(ma+mb);
  if(a.team!==b.team&&dt>0){const k=PHYSICS.press*dt;if(a.vel>0&&Math.cos(a.hd)*dx+Math.sin(a.hd)*dy>0)a.vel*=Math.exp(-k*f);if(b.vel>0&&Math.cos(b.hd)*dx+Math.sin(b.hd)*dy<0)b.vel*=Math.exp(-k*(1-f))}return f}
/* after the frame's moves (battle.js updateBattle, after keepOffObstacles: rock, cliffs, water and the field's edge as ever): one
   who went under 40% as far along his heading as his speed took him (a cliff, a rock, the edge, a press too thick) has
   his speed cut to what he went: nobody grinds on against a wall. One moved some other way this frame (withdrawing, a leap,
   falling back) takes the speed and heading that move left him */
function physPost(was,dt){
  for(const u of B.units){if(u.hp<=0)continue;
    if(u.pf!==B.t){if(u.hd!=null){u.vel=u.spdNow||0;if(u.dir!=null)u.hd=u.dir}continue}
    const p=was.get(u);if(!p||!(u.pstep>.05))continue;const al=(u.x-p[0])*Math.cos(u.hd)+(u.y-p[1])*Math.sin(u.hd);if(al<u.pstep*.4)u.vel=Math.max(0,al)/Math.max(dt,1e-6)}}
// riders and big beasts braking hard or wheeling at speed throw up dust (vfx.js; none where your side cannot see them)
function physFeel(u,dt){
  const F=PHYSICS.feel;if(!(u.s.mounted||u.s.big)||!((u.vel||0)>4)||!seenBy(0,u))return;u.pdust=(u.pdust||0)-dt;if(u.pdust>0)return;
  const K=physKind(u),hard=-(u.acl||0)>K.brake*F.dust||Math.abs(u.trn||0)>K.turn*F.wheel&&u.vel>u.s.spd*.5;if(!hard)return;u.pdust=F.dustEvery;
  const r=physRng(),f=u.face||1,col=typeof dustCol==='function'?dustCol():'170,152,112';
  for(let i=0;i<2;i++)vfx({k:'dust',x:u.x-f*(4+r()*4),y:u.y+r()*2-1,vx:-Math.cos(u.hd)*(10+r()*20)+(r()-.5)*20,vy:-r()*6,r:2.5+r()*2,grow:11,life:.5+r()*.4,col})}
// how he is drawn (render.js drawUnit): leaning into his run (forward speeding up and at speed, back braking), radians; and, down,
// how far over he is (0 standing to 1 lying: falling, lying, getting up), or null
function physLean(u){const F=PHYSICS.feel;if(!PHYSICS.on||u.down>0||u.s.beast||u.s.big)return 0;const K=physKind(u);
  return(F.lean*physSpeed(u)+F.acc*clamp((u.acl||0)/K.acc,-1,1))*(u.s.mounted?.5:1)}
function physDownPose(u){if(!PHYSICS.on||!(u.down>0))return null;const F=PHYSICS.feel,since=(u.downFor||u.down)-u.down;return Math.min(1,since/F.downFall,u.down/F.downRise)}
