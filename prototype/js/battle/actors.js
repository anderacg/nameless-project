'use strict';
/* ---------- actor execution and local targeting ---------- */
// Actors execute their group's orders; commanders and BattleControl retain command authority.
const nearest=u=>{let best=null,bd=1e9;for(const e of B.units){if(e.hp<=0||e.team===u.team)continue;const d=((e.x-u.x)**2+(e.y-u.y)**2)*(e.rout?9:1);if(d<bd){bd=d;best=e}}return best};
function monsterAbility(u,dt){
  const ab=u.s.ability;
  if(ab==='regen')u.hp=Math.min(u.max,u.hp+4*dt);
  else if(ab==='pounce'){u.ab=(u.ab??1.5)-dt;if(u.ab>0)return;const t=nearest(u);if(!t)return;const d=Math.hypot(t.x-u.x,t.y-u.y);if(d<24||d>110)return;
    const a=Math.atan2(t.y-u.y,t.x-u.x);fx(u.x,u.y-6,'#e8d8a0',6);u.x=t.x-Math.cos(a)*10;u.y=t.y-Math.sin(a)*10;u.face=Math.cos(a)>=0?1:-1;
    hit(u,t,u.s.dmg*1.6);B.floats.push({x:u.x,y:u.y-20,t:'POUNCE',life:.6,c:'#ffb070'});u.ab=4.5}
}
// strike: how it hits (a character: combos, the bow and casts, commander.js charStrike); else a troop's attack
/* every shooter's shot, as in Total War: they shoot only in a forward arc (SHOOT.arc), where their group faces; turning it is
   yours or their commander's call (a move, a dragged line, the commander's facing: commander.js), never theirs; mages (their bolt; their spells have their own shapes), riders and units marked 'circle' shoot all round. The moment a foe is in range and in the arc (and
   they are not told to cease fire), they draw (their aim time), loose, and reload (their reload time); the two make up their
   attack time (s.cd), split by their weapon: a bow draws and reloads alike, a crossbow aims fast and spans slowly, a sling
   whirls, a staff gathers. s.aim and s.reload on a kind set them outright. A draw held with no foe to loose at is let down */
const SHOOT={arc:Math.PI/2,turn:3.2,hold:1.5,kinds:{bow:[.5,.5],xbow:[.25,.75],sling:[.45,.55],throw:[.4,.6],magic:[.55,.45]}};
function shotKind(u){
  if(u.s.magic)return 'magic';if(u.hero)return heroShot().flat?'xbow':'bow';if(ST[u.type]&&ST[u.type].beast)return 'throw';
  const w=unitLook(u).weapon||'';return w==='xbow'?'xbow':w==='sling'?'sling':w==='javelin'?'throw':u.s.flat?'xbow':'bow'}
function shotTimes(u){const f=SHOOT.kinds[shotKind(u)],tot=u.hero?heroShot().cd*(u.s.cd/.45):u.s.cd;return{aim:u.s.aim??tot*f[0],reload:u.s.reload??tot*f[1]}}
// (all round: a mage's bolt (their spells keep their own shapes: battle/abilities.js), a rider, a unit marked 'circle')
const roundFire=u=>!!(u.s.magic||u.s.mounted||tagsOf(u.s).includes('circle'));
// Grouped firing uses the current group heading, not a soldier's slot-correction movement. Orders set the desired
// heading; the group turns on simulation time. Ungrouped shooters retain movement/aim/body fallbacks.
const bodyAim=u=>(u.face||(u.team?-1:1))>0?0:Math.PI;
const arcAim=u=>{const g=u.grp&&B.groups[u.grp];if(g&&g.currentFacing!=null)return g.currentFacing;if(u.walkA!=null)return u.walkA;return u.aimA!=null?u.aimA:bodyAim(u)};
const inArc=(u,t)=>roundFire(u)||angGap(Math.atan2(t.y-u.y,t.x-u.x),arcAim(u))<=SHOOT.arc/2+.01;
// a moment of a shooter: follow the movement/group facing, then draw, loose, reload
function shotStep(u,g,t,can,mv,dx,dy,mx,my,dt,strike){
  // Movement may face the travelling body, but never redirects grouped firing. Standing forward shooters follow the
  // current group heading; all-round shooters (mages and riders) can face their immediate target.
  u.walkA=mv?Math.atan2(my,mx):null;
  if(roundFire(u)){if(can&&!mv&&Math.abs(dx)>3)u.face=dx>=0?1:-1}else if(!mv){const c=Math.cos(arcAim(u));if(Math.abs(c)>.2)u.face=c>=0?1:-1}
  // (on the move, only those who shoot on the move draw: the rest let a draw down and stand to shoot)
  const still=!mv&&!u.skirm||onTheMove(u.s);/* (his group backing off counts as moving) */if(u.shot&&!still)u.shot=null;
  if(u.shot){u.shot.t+=dt*(u.slow>0?.5:1);
    if(u.shot.t>=u.shot.aim){if(can&&inArc(u,t)){u.shot=null;(strike||attack)(u,t);u.atkAt=B.t;u.atkStyle='swing';u.cd=shotTimes(u).reload*(.9+Math.random()*.2)}
      else if(u.shot.t>u.shot.aim+SHOOT.hold)u.shot=null}
    return}
  if(can&&u.cd<=0&&inArc(u,t)&&still)u.shot={t:0,aim:shotTimes(u).aim}}
// Free firing uses the nearest eligible foe in the current arc, else range, then nearest; commander targets stay authoritative.
/* a shooter close pressed. Skirmish (a group's E) has them keep their distance: the whole group backs away together (battlecontrol.js step),
   and on foot they do not shoot while backing (only those who shoot on the move loose while they go). The
   distance is each shooter's own, by his reach: a bowman keeps a foe further off than a slinger. Melee Mode (a group's X, off
   by default) puts the bow away: aiUnit uses melee reach and bladeBlow until the group switches it off. Otherwise they keep
   shooting, even point blank; there is no automatic sidearm switch while ammunition remains */
const SKIRM={keep:.6,until:.85,max:140,burst:1.5,stand:1.2,outpaced:1.15,room:24};// (outpaced: a foe this much faster is not run from; room: the field's edge kept behind them)// (burst: the longest it backs off at a time; stand: then it stands that long to loose a volley)// (max: the farthest a skirmisher starts backing off, a long bow too)
// (shooting on the move: a trait, 'mobile' (riders' bows, rangers), and every elf with a bow; the rest stand to shoot)
const onTheMove=s=>!!s&&!s.magic&&(tagsOf(s).includes('mobile')||s.race==='elf');
const meleeFoe=(u,r)=>{let best=null,bd=r;for(const e of B.units){if(e.hp<=0||e.team===u.team||e.rout||e.s.range)continue;const d=Math.hypot(e.x-u.x,e.y-u.y)-(e.s.big?12:0);if(d<bd){bd=d;best=e}}return best};
/* whom a soldier goes for by himself (fire at will): the nearest foe in his reach, one already in his arc first (he turns for
   none he need not); out of reach, the nearest, to face or close on. Routers last. Nothing cleverer: whom to finish, whom to
   focus, when to hold fire are his commander's calls (commander.js) or yours: an attack order, cease fire */
// (his blows to fell a foe, by his damage against him, armour and kind counted: matchups.js; for his commander's reckoning)
const blowsToFell=(u,e)=>Math.ceil(e.hp/Math.max(.5,u.s.dmg*matchup(u.s,e.s)));
const meleeTarget=u=>nearest(u);// named targeting contract, also used by the RTS tests
function shooterTarget(u){
  const R=u.s.range,d=e=>Math.hypot(e.x-u.x,e.y-u.y),inR=B.units.filter(e=>e.hp>0&&e.team!==u.team&&!e.rout&&d(e)<=R);if(!inR.length)return nearest(u);
  const fr=inR.filter(e=>inArc(u,e)),L=fr.length?fr:inR;return L.reduce((a,e)=>d(e)<d(a)?e:a)}
// Tactical focus is a formation; each soldier selects an opponent appropriate to its own position and firing arc.
function orderedTarget(u,g,s){
  const members=g.targetMembers(),standing=members.filter(e=>!e.rout),pool=standing.length?standing:members;
  if(!pool.length)return null;
  const dist=e=>Math.hypot(e.x-u.x,e.y-u.y);let eligible=pool;
  if(s.range){const inR=pool.filter(e=>dist(e)<=s.range),forward=inR.filter(e=>inArc(u,e));if(forward.length)eligible=forward;else if(inR.length)eligible=inR}
  return eligible.reduce((a,e)=>dist(e)<dist(a)?e:a);
}
function aiUnit(u,dt,strike){
  if(u.stun>0){u.stun-=dt;u.spdNow=0;u.shot=null;return}
  if(u.rout){u.shot=null;return routStep(u,dt)}// (broken: it runs for its edge, morale.js)
  if(withdrawing(u)){u.shot=null;return withdrawStep(u,dt)}// (withdrawn: it leaves the field, morale.js)
  u.inSlot=false;
  // its target: the enemy its group was set on (right-click), else the nearest
  // (Melee Mode, his group's: a shooter puts his bow away and is a fighter: his melee damage, a sword's reach; he shoots nothing)
  const g=u.grp&&B.groups[u.grp],mm=!!(u.s.range&&!u.empty&&g&&g.melee),s=mm?(u.mmS&&u.mmS.base===u.s?u.mmS:(u.mmS={...u.s,base:u.s,range:0,reach:BLADE.reach,dmg:meleeDmgOf(u.s)})):u.s;u.rt-=dt;// (his group lets a fallen foe go: battlecontrol.js step)
  // (set on a target, it still turns on an enemy right on top of it: it does not stand and take the blows)
  if(g&&g.hasTarget&&!g.tgt)g.hold();
  if(g&&g.tgt){
    // Re-evaluate immediately on an order change or casualty; otherwise retain the normal thinking interval.
    const member=e=>e&&e.hp>0&&!e.left&&e.team!==u.team&&(g.targetGroupId!==null?e.grp===g.targetGroupId:e.id===g.targetUnitId);
    if(u.rt<=0||!member(u.tgt)){u.tgt=orderedTarget(u,g,s);u.rt=.4;u.near=null}
    const n=nearest(u),close=s.range?30:(s.reach||11)+8;
    u.near=n&&!n.rout&&!member(n)&&Math.hypot(n.x-u.x,n.y-u.y)<close?n:null;
    if(u.near)u.tgt=u.near;
  }
  else if(u.rt<=0||!u.tgt||u.tgt.hp<=0){u.tgt=s.range?shooterTarget(u):meleeTarget(u);u.rt=.4}
  crowdTarget(u,dt);
  const t=u.tgt;u.spdNow=0;
  // The hero is a single-unit group: an explicit attack turns its firing arc toward the target,
  // even after a move left/right. Ordinary shooter formations keep their commanded facing.
  if(u.hero&&s.range&&g&&g.tgt){const p=g.targetPoint();g.faceTo(Math.atan2(p.y-u.y,p.x-u.x))}
  const order=g?(g.tgt?'charge':g.order):'charge';
  if(!t&&!(g&&order!=='charge'))return;
  const dx=t?t.x-u.x:0,dy=t?t.y-u.y:0,d=Math.hypot(dx,dy)||1,de=t?d-(t.s.big&&!s.range?12:0):1e9;
  const reach=s.range?s.range:s.reach+2;let mv=false,mx=0,my=0,chase=false,back=false;
  const reloc=relocating(u,g);
  // (his group moves him: its place for him, backing off together when it skirmishes, stopping together to shoot (battlecontrol.js step);
  // he himself only picks his foe, shoots, and fights with his blades whoever reaches him)
  u.skirm=!!(g&&g.backing);u.inMelee=mm;if(mm)u.shot=null;// (melee mode: his bow down (a draw let down), a sword out: render.js)
  if(g&&order!=='charge'){
    // keep a slot in the group's formation; melee breaks off only for enemies that come close to it (never, holding its
    // ground or withdrawing: it strikes only what is in reach)
    const sx=clamp(g.ax+u.sx,8,BW-8),sy=clamp(g.ay+u.sy,fieldTop(),fieldBot());
    const engage=order==='withdraw'||g.firm||unitFlag(u,'shieldWall')?0:28;
    if(reloc){const px=sx-u.x,py=sy-u.y,pd=Math.hypot(px,py);if(u.relocFor!==g.mvId){u.relocFor=g.mvId;u.relocT=0}u.relocT+=dt;
      if(pd>RELOCATE.near&&u.relocT<RELOCATE.max){mv=true;mx=px/pd;my=py/pd}else{u.mvId=g.mvId;u.relocT=0;u.inSlot=true}}
    else if(t&&!s.range&&de<=reach){}
    else if(t&&!s.range&&engage&&Math.hypot(t.x-sx,t.y-sy)<engage){mv=true;mx=dx/d;my=dy/d;chase=true}
    else if(s.range&&t&&de<=reach&&!onTheMove(s)&&!g.backing&&!(g.cease&&!g.tgt)){}// (a foe in reach: they keep their ground and shoot, not step to their exact place: attacking first)
    else{const px=sx-u.x,py=sy-u.y,pd=Math.hypot(px,py);const going=g.going;// (its place on the move: battlecontrol.js step)
      if(pd>(u.slotted&&!going?7:2)){mv=true;mx=px/pd;my=py/pd;u.slotted=false}else{u.inSlot=true;u.slotted=true}}// (in its slot: it faces the formation's way, and stays till pushed clearly out)
  }else{
    if(s.range){if(d>s.range||!u.inRng&&d>s.range*.97){mv=true;mx=dx/d;my=dy/d;u.inRng=false}else{u.inRng=true;if(d<28){mv=true;mx=-dx/d;my=-dy/d;back=true}}}
    else if(de>reach){mv=true;mx=dx/d;my=dy/d}
    chase=true;
  }
  // walking, they keep to the slowest one's pace (and keep their formation); running, or fighting, each goes as fast as it can
  const tm=tiredMul(u),wk=(walking(g)||staOf(u)<FATIGUE.runMin)&&order!=='withdraw';/* (no breath left: he walks, whatever he is told) */let spd=(wk?Math.min(s.spd,g&&g.pace||s.spd)*MARCH.walk:s.spd)*tm.spd;// (tired: slower, fatigue.js)
  spd*=formPace(u)*abilitySpeed(u);// Only supported, eligible shield-wall soldiers pay its speed cost. (spurred riders: faster, unitabilities.js)
  if(mv&&abilityStands(u))mv=false;// (braced: he stands fast where he is and strikes what comes into reach)
  // (stuck: trying to move but going nowhere, against a rock or the field's edge, it steps aside to get round; not in the press
  // round its foe, where it finds another instead: crowdTarget)
  if(mv&&chase&&!back&&!(t&&!s.range&&de<reach+CROWD.slack)){u.stk=(u.stk||0)+dt;if(u.stk>.5){if(u.sx0!=null&&Math.hypot(u.x-u.sx0,u.y-u.sy0)<3){u.side=u.side||(Math.random()<.5?-1:1);u.sideT=.6}u.stk=0;u.sx0=u.x;u.sy0=u.y}
    if(u.sideT>0){u.sideT-=dt;const px=-my*u.side,py=mx*u.side;mx=mx*.3+px;my=my*.3+py;const l=Math.hypot(mx,my)||1;mx/=l;my/=l}}else{u.stk=0;u.sx0=u.x;u.sy0=u.y}
  if(mv&&!wk)footDust(u,dt);// (running: dust from their feet, vfx.js)
  if(mv){const sp=spd*dt*(u.slow>0?.5:1)*(u.buffT>0?1.25:1);u.x+=mx*sp;u.y+=my*sp;u.spdNow=spd;
    // (he faces where he goes, backing off too (no walking backwards): he turns to his foe again when he stops to shoot)
    if(Math.abs(mx)>.35)u.face=mx>0?1:-1;u.dir=Math.atan2(my,mx);u.run=chase&&!back&&!wk?(u.run||0)+sp*tm.run:0}
  else{if(t){if(Math.abs(dx)>3&&!(s.range&&!roundFire(u)))u.face=dx>=0?1:-1;if(!u.inSlot)u.dir=Math.atan2(dy,dx)}u.run=Math.max(0,(u.run||0)-CHARGE.run*dt)}
  // (facing: where it marches or whom it fights; momentum: the run at its target, spent on its first blow)
  fatigueStep(u,dt,mv,wk,chase&&!back&&!!t&&!wk,!!t&&de<=reach+8);
  // shooters: whatever comes into range and their arc, unless told to cease fire (then only the enemy you set them on); a move lets a draw down
  if(s.range){if(reloc)u.shot=null;shotStep(u,g,t,!!t&&!reloc&&de<=reach&&!(g&&g.cease&&!g.tgt),mv,dx,dy,mx,my,dt,strike);return}
  if(t&&u.cd<=0&&!reloc&&de<=reach+1){if(mm)bladeBlow(u,t);else(strike||attack)(u,t)}
}
/* the press: when the men round a foe stand too thick, those behind cannot reach him and would stand idle. A melee soldier
   kept out of reach for CROWD.wait turns on another foe close by (within CROWD.look) that has room round him, for CROWD.keep */
const CROWD={wait:.8,keep:2.5,look:90,slack:16,full:3};
function roomyFoe(u,not){let best=null,bs=1e9;const R=(u.s.reach||11)+6;
  const g=u.grp&&B.groups[u.grp],pool=g&&g.hasTarget?g.targetMembers():B.units;
  for(const e of pool){if(e.hp<=0||e.team===u.team||e===not||e.rout)continue;const d=Math.hypot(e.x-u.x,e.y-u.y);if(d>CROWD.look)continue;
    let n=0;for(const o of B.units)if(o!==u&&o.hp>0&&o.team===u.team&&Math.hypot(o.x-e.x,o.y-e.y)<R)n++;if(n>=CROWD.full)continue;const sc=d+n*14;if(sc<bs){bs=sc;best=e}}
  return best}
function crowdTarget(u,dt){
  if(u.s.range||u.hero||u.near&&u.tgt===u.near)return;const g=u.grp&&B.groups[u.grp];if(u.alt&&(u.alt.hp<=0||u.alt.rout||(u.altT-=dt)<=0||g&&g.hasTarget&&!g.targetMembers().includes(u.alt)))u.alt=null;
  const t=u.tgt;if(t&&t.hp>0&&!u.alt){const R=(u.s.reach||11)+2,d=Math.hypot(t.x-u.x,t.y-u.y)-(t.s.big?12:0);
    if(d>R&&d<R+CROWD.slack){u.blockT=(u.blockT||0)+dt;if(u.blockT>CROWD.wait){u.blockT=0;const a=roomyFoe(u,t);if(a){u.alt=a;u.altT=CROWD.keep}}}else u.blockT=0}
  if(u.alt)u.tgt=u.alt}
/* a move order (the ground right-clicked, a line dragged, the next waypoint): the group relocates. Each of its men breaks off
   the fight he is in and goes to his new place, striking no one on the way (and taking blows in the back if he turns from a
   foe), as in Total War; once there, he fights whatever comes to him. Hold where they stand is no move: they keep fighting.
   RELOCATE.near: close enough to his place; RELOCATE.max: he gives up getting there after this long (a place he cannot reach) */
const RELOCATE={near:6,max:8};
const relocating=(u,g)=>!!(g&&g.mvId&&u.mvId!==g.mvId&&g.order==='hold'&&!g.tgt);
/* the manual control of your hero, set aside for now (RTS command: commands.js): WASD, Space, F, B, the skill slots (input.js) */
function updateHero(dt){
  const h=B.hero;B.blocking=!!(G.keys.b||B.touchBlock);
  if(!h||h.hp<=0){B.blocking=false;return}
  h.cd-=dt;h.swing=Math.max(0,h.swing-dt);h.spdNow=0;
  if(heroActions(dt))return;
  const k=G.keys;let dx=(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0),dy=(k.s||k.arrowdown?1:0)-(k.w||k.arrowup?1:0);
  if(dx||dy)B.mt=null;else if(B.mt){const ex=B.mt.x-h.x,ey=B.mt.y-h.y,ed=Math.hypot(ex,ey);if(ed<3)B.mt=null;else{dx=ex/ed;dy=ey/ed}}
  const l=Math.hypot(dx,dy);
  const X=heroState(),run=l>0&&G.keys.shift&&!B.blocking&&X.sp>0;if(run){X.sp=Math.max(0,X.sp-STAM.sprint*dt);X.spT=0}
  if(l>0){dx/=l;dy/=l;const sp=h.s.spd*(B.blocking?.55:1)*(B.draw?.6:1)*(run?SPRINT_MUL:1)*(h.slow>0?.5:1)*dt;h.x+=dx*sp;h.y+=dy*sp;h.face=dx>=0?1:-1;h.spdNow=h.s.spd;if(run)train('athl',dt*.4)}
  if(G.mouse.in&&G.mouse.type==='mouse')B.aim=Math.atan2(G.mouse.y-(h.y-6),G.mouse.x-h.x);
  else{const n=nearest(h);if(n)B.aim=Math.atan2(n.y-h.y,n.x-h.x)}
}
// Non-hero turns keep the original order and simulation clock. The hero's separate HERO_PACE turn stays in updateBattle.
function updateNonHeroActors(dt){
  // every unit's moment (lords, chieftains and companions fight as your hero does: commander.js charAuto)
  for(const u of B.units){if(u.hp<=0||u.hero)continue;u.cd-=dt;if(isFighter(u)){charAuto(u,dt);continue}aiUnit(u,dt,null);monsterAbility(u,dt);if(u.s.breath){u.br=(u.br??2.5)-dt;if(u.br<=0){const t=nearest(u);if(t&&Math.hypot(t.x-u.x,t.y-u.y)<90){breathe(u,t);u.br=3.5}}}}
}
