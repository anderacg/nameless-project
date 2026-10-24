'use strict';
/* ---------- actor execution and local targeting ---------- */
// Actors execute their group's orders; commanders and BattleControl retain command authority.
// (the grid open: the same pick from the buckets round him, spatial.js)
const nearest=u=>{if(spatialOn())return SG.nearest(u);let best=null,bd=1e9;for(const e of B.units){if(e.hp<=0||e.team===u.team)continue;const d=((e.x-u.x)**2+(e.y-u.y)**2)*(e.rout?9:1);if(d<bd){bd=d;best=e}}return best};
// strike: how it hits (a character: combos, the bow and casts, charmind.js charStrike); else a troop's attack
/* every shooter's shot, as in Total War: they shoot only in a forward arc (SHOOT.arc), where their group faces; turning it is
   yours or their commander's call (a move, a dragged line, the commander's facing: commander.js), never theirs; mages (their bolt; their spells have their own shapes), riders and units marked 'circle' shoot all round. The moment a foe is in range and in the arc (and
   they are not told to cease fire), they draw (their aim time), loose, and reload (their reload time); the two make up their
   attack time (s.cd), split by their weapon: a bow draws and reloads alike, a crossbow aims fast and spans slowly, a sling
   whirls, a staff gathers. s.aim and s.reload on a kind set them outright. A draw held with no foe to loose at is let down */
const SHOOT={arc:Math.PI/2,turn:3.2,hold:1.5,kinds:{bow:[.5,.5],xbow:[.25,.75],sling:[.45,.55],throw:[.4,.6],magic:[.55,.45]}};
// (all round: a mage's bolt (their spells keep their own shapes: battle/abilities.js), a rider, a unit marked 'circle')
const roundFire=u=>!!(u.s.magic||u.s.mounted||tagsOf(u.s).includes('circle'));
// Grouped firing uses the current group heading, not a soldier's slot-correction movement. Orders set the desired
// heading; the group turns on simulation time. Ungrouped shooters retain movement/aim/body fallbacks.
const bodyAim=u=>(u.face||(u.team?-1:1))>0?0:Math.PI;
const arcAim=u=>{const g=u.grp&&B.groups[u.grp];if(g&&g.currentFacing!=null)return g.currentFacing;if(u.walkA!=null)return u.walkA;return u.aimA!=null?u.aimA:bodyAim(u)};
const inArc=(u,t)=>roundFire(u)||angGap(Math.atan2(t.y-u.y,t.x-u.x),arcAim(u))<=SHOOT.arc/2+.01;
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
/* (a foe his side cannot see, hidden in woods or behind a rise, is no one's pick: terrain.js seenBy; the nearest he can see. With
   no terrain everyone is seen and this is nearest itself) */
const nearestSeen=u=>{const n=nearest(u);if(!n||seenBy(u.team,n))return n;let best=null,bd=1e9;
  for(const e of B.units){if(e.hp<=0||e.team===u.team||!seenBy(u.team,e))continue;const d=((e.x-u.x)**2+(e.y-u.y)**2)*(e.rout?9:1);if(d<bd){bd=d;best=e}}return best};
const meleeTarget=u=>nearestSeen(u);// named targeting contract, also used by the RTS tests
function shooterTarget(u){
  const R=u.s.range,d=e=>Math.hypot(e.x-u.x,e.y-u.y),inR=(spatialOn()?SG.near(u.x,u.y,R+1,u.team,true):B.units).filter(e=>e.hp>0&&e.team!==u.team&&!e.rout&&d(e)<=R&&seenBy(u.team,e));if(!inR.length)return nearestSeen(u);
  const fr=inR.filter(e=>inArc(u,e)),L=fr.length?fr:inR;return L.reduce((a,e)=>d(e)<d(a)?e:a)}
// Tactical focus is a formation; each soldier selects an opponent appropriate to its own position and firing arc.
function orderedTarget(u,g,s){
  const members=targetMembersOf(g),standing=members.filter(e=>!e.rout),pool=standing.length?standing:members;
  if(!pool.length)return null;
  const dist=e=>Math.hypot(e.x-u.x,e.y-u.y);let eligible=pool;
  if(s.range){const inR=pool.filter(e=>dist(e)<=s.range),forward=inR.filter(e=>inArc(u,e));if(forward.length)eligible=forward;else if(inR.length)eligible=inR}
  return eligible.reduce((a,e)=>dist(e)<dist(a)?e:a);
}
// (battlecontrol.js targetMembers' test of one soldier)
const targetTest=g=>u=>u.hp>0&&!u.left&&u.team!==g.team&&(g.targetGroupId!==null?u.grp===g.targetGroupId:u.id===g.targetUnitId);
/* g.targetMembers() (battlecontrol.js), during the soldiers' turns (the grid open): the list sifted from the whole battle once
   per turn of the battle and target, then only sifted again by the same test. Nobody joins a target mid-turn (no one rises,
   comes back, changes side or group), so the members then are those of the first list still passing it, plus any soldier
   added since, in B.units order: the same list */
function targetMembersOf(g){
  if(!spatialOn())return g.targetMembers();if(!g.hasTarget||g.targetGroupId!==null&&!B.groups[g.targetGroupId])return [];
  const k=g.team+'|'+g.targetGroupId+'|'+g.targetUnitId,U=B.units;let c=SG.memo.get(k);if(!c){c={n:U.length,m:g.targetMembers()};SG.memo.set(k,c);return c.m.slice()}
  const is=targetTest(g),out=c.m.filter(is);
  for(let i=c.n;i<U.length;i++)if(is(U[i]))out.push(U[i]);return out}
/* is anyone of g's target left (g.tgt is someone: battlecontrol.js targetMembers is not empty)? Its test, unit by unit, but the
   last one found is tried first (TARGET_SEEN): still a member, the answer is yes without sifting the whole battle again */
const TARGET_SEEN=new WeakMap();
function targetStands(g){
  if(g.targetGroupId!==null&&!B.groups[g.targetGroupId])return false;
  const is=targetTest(g),w=TARGET_SEEN.get(g);
  if(w&&w.U===B.units&&is(w.u))return true;const u=B.units.find(is);if(u)TARGET_SEEN.set(g,{U:B.units,u});return !!u}
/* the press: when the men round a foe stand too thick, those behind cannot reach him and would stand idle. A melee soldier
   kept out of reach for CROWD.wait turns on another foe close by (within CROWD.look) that has room round him, for CROWD.keep */
const CROWD={wait:.8,keep:2.5,look:90,slack:16,full:3};
function roomyFoe(u,not,s=u.s){let best=null,bs=1e9;const R=(s.reach||11)+6;
  const g=u.grp&&B.groups[u.grp],grid=spatialOn(),pool=g&&g.hasTarget?targetMembersOf(g):grid?SG.near(u.x,u.y,CROWD.look+1,u.team,true):B.units;
  for(const e of pool){if(e.hp<=0||e.team===u.team||e===not||e.rout||!seenBy(u.team,e))continue;const d=Math.hypot(e.x-u.x,e.y-u.y);if(d>CROWD.look)continue;
    let n=0;for(const o of grid?SG.near(e.x,e.y,R+1,u.team,false):B.units)if(o!==u&&o.hp>0&&o.team===u.team&&Math.hypot(o.x-e.x,o.y-e.y)<R)n++;if(n>=CROWD.full)continue;const sc=d+n*14;if(sc<bs){bs=sc;best=e}}
  return best}
/* an order at a target gone from sight (terrain.js sightGoal: in woods or behind a rise, none of it seen by his side): he leaves
   it be and makes for his place round where it was last seen (its last known place plus his slot), at his group's pace, shooting
   nothing; whoever comes near enough is seen again and the order goes on as before. Once there (LOST.near of his place) with it
   still unseen, the order lapses: his group holds where it stands (battlecontrol.js hold) */
const LOST={near:10};
/* a move order (the ground right-clicked, a line dragged, the next waypoint): the group relocates. Each of its men breaks off
   the fight he is in and goes to his new place, striking no one on the way (and taking blows in the back if he turns from a
   foe), as in Total War; once there, he fights whatever comes to him. Hold where they stand is no move: they keep fighting.
   RELOCATE.near: close enough to his place; RELOCATE.max: he gives up getting there after this long (a place he cannot reach) */
const RELOCATE={near:6,max:8};
const relocating=(u,g,tgt)=>!!(g&&g.mvId&&u.mvId!==g.mvId&&g.order==='hold'&&!(tgt===undefined?g.tgt:tgt));// (tgt: g.tgt, already read)
/* ---------- a soldier's moment (Actor, class wave E3): one for each soldier (Actor.of(u), kept aside, holding nothing but its
   man; his moment's notes stay on him: his shot, target, the foe he brushes past, the one he turns on in the press, his stuck
   steps). Its blows and wounds are the Fighter's it extends (attacks.js). Each turn (turn: a troop's or a beast's step, then a
   beast's ability and breath), his step as his group goes (step, was aiUnit), the shot cycle (shot, shotKind, shotTimes), the
   press (crowd), an order at a target gone from sight (lost). Its kind by the record, looked at each time: a character
   (CharActor: lords, chieftains, companions, whose turn is their mind's, charmind.js) and your hero (HeroActor: their shot by
   your weapon, the attack's facing, no press, their wounds and aim, and the manual control) override what differs ---------- */
const ACTORS=new WeakMap();
class Actor extends Fighter{
  static of(u){const K=u.hero?HeroActor:isFighter(u)?CharActor:Actor;let a=ACTORS.get(u);if(!a||a.constructor!==K)ACTORS.set(u,a=new K(u));return a}
  // Non-hero turns keep the original order and simulation clock. The hero's separate HERO_PACE turn stays in updateBattle.
  static turns(dt){
    // every unit's moment (lords, chieftains and companions fight as your hero does: charmind.js CharacterMind.auto)
    // (the grid, spatial.js: only the one taking his turn moves, so he is held loose while he acts, then filed where he ends up)
    const S=spatialOpen();
    try{for(let i=0;i<B.units.length;i++){const u=B.units[i];if(u.hp<=0||u.hero)continue;S.hold(i);u.cd-=dt;Actor.of(u).turn(dt);S.release(i)}}finally{spatialClose()}
  }
  // a troop's or a beast's turn: its step, then a monster's ability and a dragon's breath
  turn(dt){const u=this.u;this.step(dt,null);this.ability(dt);if(u.s.breath){u.br=(u.br??2.5)-dt;if(u.br<=0){const t=nearest(u);if(t&&Math.hypot(t.x-u.x,t.y-u.y)<90){this.breathe(t);u.br=3.5}}}}
  ability(dt){
    const u=this.u,ab=u.s.ability;
    if(ab==='regen')u.hp=Math.min(u.max,u.hp+4*dt);
    else if(ab==='pounce'){u.ab=(u.ab??1.5)-dt;if(u.ab>0)return;const t=nearest(u);if(!t)return;const d=Math.hypot(t.x-u.x,t.y-u.y);if(d<24||d>110)return;
      const a=Math.atan2(t.y-u.y,t.x-u.x);fx(u.x,u.y-6,'#e8d8a0',6);u.x=t.x-Math.cos(a)*10;u.y=t.y-Math.sin(a)*10;u.face=Math.cos(a)>=0?1:-1;
      this.hit(t,u.s.dmg*1.6);B.floats.push({x:u.x,y:u.y-20,t:'POUNCE',life:.6,c:'#ffb070'});u.ab=4.5}
  }
  shotKind(){
    const u=this.u;if(u.s.magic)return 'magic';if(ST[u.type]&&ST[u.type].beast)return 'throw';
    const w=unitLook(u).weapon||'';return w==='xbow'?'xbow':w==='sling'?'sling':w==='javelin'?'throw':u.s.flat?'xbow':'bow'}
  // (his attack time, split into his aim and reload by his weapon)
  shotTime(){return this.u.s.cd}
  shotTimes(){const u=this.u,f=SHOOT.kinds[this.shotKind()],tot=this.shotTime();return{aim:u.s.aim??tot*f[0],reload:u.s.reload??tot*f[1]}}
  // a moment of a shooter: follow the movement/group facing, then draw, loose, reload
  shot(g,t,can,mv,dx,dy,mx,my,dt,strike){
    const u=this.u;
    // Movement may face the travelling body, but never redirects grouped firing. Standing forward shooters follow the
    // current group heading; all-round shooters (mages and riders) can face their immediate target.
    u.walkA=mv?Math.atan2(my,mx):null;
    if(roundFire(u)){if(can&&!mv&&Math.abs(dx)>3)u.face=dx>=0?1:-1}else if(!mv){const c=Math.cos(arcAim(u));if(Math.abs(c)>.2)u.face=c>=0?1:-1}
    // (on the move, only those who shoot on the move draw: the rest let a draw down and stand to shoot)
    const still=!mv&&!u.skirm||onTheMove(u.s);/* (his group backing off counts as moving) */if(u.shot&&!still)u.shot=null;
    if(u.shot){u.shot.t+=dt*(u.slow>0?.5:1);
      if(u.shot.t>=u.shot.aim){if(can&&inArc(u,t)){u.shot=null;if(strike)strike(u,t);else this.attack(t);u.atkAt=B.t;u.atkStyle='swing';u.cd=this.shotTimes().reload*(.9+Math.random()*.2)}
        else if(u.shot.t>u.shot.aim+SHOOT.hold)u.shot=null}
      return}
    if(can&&u.cd<=0&&inArc(u,t)&&still)u.shot={t:0,aim:this.shotTimes().aim}}
  // (sent at a foe: he turns on an enemy right on top of him on the way)
  turnsOn(g){return true}
  // (an explicit attack turning his own firing arc: only your hero's, a group of one)
  faceFoe(g,gt,s){}
  step(dt,strike){
    const u=this.u;
    if(PHYSICS.on&&physDown(u,dt))return;// (knocked down: he lies a moment, physics.js)
    if(u.stun>0){u.stun-=dt;u.spdNow=0;u.shot=null;return}
    if(u.wind&&this.winding(dt))return;// (a hard attack wound up: he stands till it lands, attacks.js)
    if(u.rout){u.shot=null;return routStep(u,dt)}// (broken: it runs for its edge, morale.js)
    if(withdrawing(u)){u.shot=null;return withdrawStep(u,dt)}// (withdrawn: it leaves the field, morale.js)
    u.inSlot=false;
    // its target: the enemy its group was set on (right-click), else the nearest
    // (Melee Mode, his group's: a shooter puts his bow away and is a fighter: his melee damage, a sword's reach; he shoots nothing)
    const g=u.grp&&B.groups[u.grp],mm=!!(u.s.range&&!u.empty&&g&&g.melee),s=mm?(u.mmS&&u.mmS.base===u.s?u.mmS:(u.mmS={...u.s,base:u.s,range:0,reach:BLADE.reach,dmg:meleeDmgOf(u.s)})):u.s;u.rt-=dt;// (his group lets a fallen foe go: battlecontrol.js step)
    // (set on a target, it still turns on an enemy right on top of it: it does not stand and take the blows)
    // (whether g.tgt is set: read once here (nothing before his blow below changes it, and hold() leaves none); only its truth is used)
    const gt=!!g&&g.hasTarget&&targetStands(g);if(g&&g.hasTarget&&!gt)g.hold();
    // (set on a target his side sees none of now: they make for where it was last seen, terrain.js sightGoal)
    if(gt&&B.sight){const lk=sightGoal(g,u.team);if(lk)return this.lost(g,s,lk,dt)}
    if(gt){
      // Re-evaluate immediately on an order change or casualty; otherwise retain the normal thinking interval.
      const member=e=>e&&e.hp>0&&!e.left&&e.team!==u.team&&(g.targetGroupId!==null?e.grp===g.targetGroupId:e.id===g.targetUnitId);
      if(u.rt<=0||!member(u.tgt)){u.tgt=orderedTarget(u,g,s);u.rt=.4;u.near=null}
      // (your hero and companions, sent at a foe, go for him: they do not turn on whoever they brush past on the way; soldiers do)
      const n=nearest(u),close=s.range?30:(s.reach||11)+8;
      u.near=this.turnsOn(g)&&n&&!n.rout&&!member(n)&&Math.hypot(n.x-u.x,n.y-u.y)<close?n:null;
      if(u.near)u.tgt=u.near;
    }
    else{if(u.near)u.near=null;if(u.rt<=0||!u.tgt||u.tgt.hp<=0||!seenBy(u.team,u.tgt)){u.tgt=s.range?shooterTarget(u):meleeTarget(u);u.rt=.4}}// (free: no ordered foe, so no foe brushed past either; one gone from sight is let go)
    this.crowd(dt,s);
    const t=u.tgt;u.spdNow=0;
    // The hero is a single-unit group: an explicit attack turns its firing arc toward the target,
    // even after a move left/right. A shooter never turns himself: his group wheels to its foe (BattleControl.aimAt).
    this.faceFoe(g,gt,s);
    const order=g?(gt?'charge':g.order):'charge';
    if(!t&&!(g&&order!=='charge'))return;
    const dx=t?t.x-u.x:0,dy=t?t.y-u.y:0,d=Math.hypot(dx,dy)||1,de=t?d-(t.s.big&&!s.range?12:0):1e9;
    const reach=s.range?s.range:s.reach+2;let mv=false,mx=0,my=0,chase=false,back=false,routed=false,arr=null;// (arr: how far to where he stops, physics.js)
    // (on ground that blocks: round it toward (x,y) when the straight way is not clear (terrain.js steerDir); routed, a charge builds no momentum)
    const round=(x,y)=>{const w=B.terrain&&B.terrain.blocky?steerDir(u,x,y):null;if(w){mx=w[0];my=w[1];routed=true}};
    const reloc=relocating(u,g,gt);
    // (his group moves him: its place for him, backing off together when it skirmishes, stopping together to shoot (battlecontrol.js step);
    // he himself only picks his foe, shoots, and fights with his blades whoever reaches him)
    u.skirm=!!(g&&g.backing);u.inMelee=mm;if(mm)u.shot=null;// (melee mode: his bow down (a draw let down), a sword out: render.js)
    if(g&&order!=='charge'){
      // keep a slot in the group's formation; melee breaks off only for enemies that come close to it (never, holding its
      // ground or withdrawing: it strikes only what is in reach)
      const sx=clamp(g.ax+u.sx,8,BW-8),sy=clamp(g.ay+u.sy,fieldTop(),fieldBot());
      // (the way there: round rock, cliffs and impassable water along its group's way (terrain.js slotWay; via: not yet his place);
      // with wadeable water alone, over a ford or bridge when that beats wading (crossWay))
      let wx=sx,wy=sy,via=false;const TR=B.terrain;if(TR&&TR.blocky){const w=slotWay(u,g,sx,sy);if(w){wx=w[0];wy=w[1];via=!w.at}}else if(TR&&TR.has.water){const w=crossWay(u,sx,sy);if(w){wx=w[0];wy=w[1]}}
      const engage=order==='withdraw'||g.firm||unitFlag(u,'shieldWall')?0:28;
      if(reloc){const px=wx-u.x,py=wy-u.y,pd=Math.hypot(px,py);if(u.relocFor!==g.mvId){u.relocFor=g.mvId;u.relocT=0}u.relocT+=dt;
        if((pd>RELOCATE.near||via)&&u.relocT<RELOCATE.max){mv=true;mx=px/pd;my=py/pd;if(!via)arr=pd}else{u.mvId=g.mvId;u.relocT=0;u.inSlot=true}}
      else if(t&&!s.range&&de<=reach){}
      else if(t&&!s.range&&engage&&Math.hypot(t.x-sx,t.y-sy)<engage&&!holdsBank(u,t)&&!wayBarred(u,t)){mv=true;mx=dx/d;my=dy/d;chase=true;round(t.x,t.y)}// (not down off a bank into the water after him, nor round a cliff: terrain.js)
      else if(s.range&&t&&de<=reach&&!onTheMove(s)&&!g.backing&&!(g.cease&&!gt)){}// (a foe in reach: they keep their ground and shoot, not step to their exact place: attacking first)
      else{const px=wx-u.x,py=wy-u.y,pd=Math.hypot(px,py);const going=g.going;// (its place on the move: battlecontrol.js step)
        if(pd>(u.slotted&&!going?7:2)||via&&pd>.5){mv=true;mx=px/pd;my=py/pd;u.slotted=false;if(!via&&!going)arr=pd}else{u.inSlot=true;u.slotted=true}}// (in its slot: it faces the formation's way, and stays till pushed clearly out)
    }else{
      if(s.range){if(d>s.range||!u.inRng&&d>s.range*.97){mv=true;mx=dx/d;my=dy/d;u.inRng=false;round(t.x,t.y)}else{u.inRng=true;if(d<28){mv=true;mx=-dx/d;my=-dy/d;back=true}}}
      else if(de>reach){mv=true;mx=dx/d;my=dy/d;if(B.terrain&&B.terrain.blocky)round(t.x,t.y);else if(B.terrain&&B.terrain.has.water){const w=crossWay(u,t.x,t.y);if(w){const qx=w[0]-u.x,qy=w[1]-u.y,ql=Math.hypot(qx,qy)||1;mx=qx/ql;my=qy/ql}}}// (a charge goes over a bridge or ford when that beats wading, terrain.js)
      chase=true;
    }
    // walking, they keep to the slowest one's pace (and keep their formation); running, or fighting, each goes as fast as it can
    const tm=tiredMul(u),wk=(walking(g)||staOf(u)<FATIGUE.runMin)&&order!=='withdraw';/* (no breath left: he walks, whatever he is told) */let spd=(wk?Math.min(s.spd,g&&g.pace||s.spd)*MARCH.walk:s.spd)*tm.spd;// (tired: slower, fatigue.js)
    spd*=formPace(u)*abilitySpeed(u);// Only supported, eligible shield-wall soldiers pay its speed cost. (spurred riders: faster, unitabilities.js)
    const spurred=abilityMomentum(u);/* (spurred: he keeps his momentum, unitabilities.js) */if(mv&&abilityStands(u))mv=false;// (braced: he stands fast where he is and strikes what comes into reach)
    // (stuck: trying to move but going nowhere, against a rock or the field's edge, it steps aside to get round; not in the press
    // round its foe, where it finds another instead: crowd)
    if(mv&&chase&&!back&&!(t&&!s.range&&de<reach+CROWD.slack)){u.stk=(u.stk||0)+dt;if(u.stk>.5){if(u.sx0!=null&&Math.hypot(u.x-u.sx0,u.y-u.sy0)<3){u.side=u.side||(Math.random()<.5?-1:1);u.sideT=.6}u.stk=0;u.sx0=u.x;u.sy0=u.y}
      if(u.sideT>0){u.sideT-=dt;const px=-my*u.side,py=mx*u.side;mx=mx*.3+px;my=my*.3+py;const l=Math.hypot(mx,my)||1;mx/=l;my/=l}}else{u.stk=0;u.sx0=u.x;u.sy0=u.y}
    if(mv&&!wk&&seenBy(0,u))footDust(u,dt);// (running: dust from their feet, vfx.js; none where your side cannot see him: terrain.js)
    // (the ground: woods, marsh, slopes slow him or speed him, and build his charge slower or faster: terrain.js)
    // (physics on: he speeds up, slows and turns as his mass and kind let him, physics.js; off, he steps at his speed at once)
    if(PHYSICS.on)physAct(u,g,t,dt,mv,mx,my,spd,arr,{chase,back,wk,routed,spurred,tm,dx,dy,s});
    else if(mv){const sp=spd*dt*(u.slow>0?.5:1)*(u.buffT>0?1.25:1)*groundMul(u,mx,my);u.x+=mx*sp;u.y+=my*sp;u.spdNow=spd;ownStep(u);// (his own step: down a one-way cliff only so, terrain.js terrainHold)
      // (he faces where he goes, backing off too (no walking backwards): he turns to his foe again when he stops to shoot)
      if(Math.abs(mx)>.35)u.face=mx>0?1:-1;u.dir=Math.atan2(my,mx);u.run=chase&&!back&&!wk&&!routed?(u.run||0)+sp*tm.run*groundRun(u,mx,my,sp):spurred?u.run:0}
    else{if(t){if(Math.abs(dx)>3&&!(s.range&&!roundFire(u)))u.face=dx>=0?1:-1;if(!u.inSlot)u.dir=Math.atan2(dy,dx)}if(!spurred)u.run=Math.max(0,(u.run||0)-CHARGE.run*dt)}
    // (facing: where it marches or whom it fights; momentum: the run at its target, spent on its first blow; spurred, kept: unitabilities.js)
    fatigueStep(u,dt,mv,wk,chase&&!back&&!!t&&!wk,!!t&&de<=reach+8);
    // shooters: whatever comes into range and their arc, unless told to cease fire (then only the enemy you set them on); a move lets a draw down
    if(s.range){if(reloc)u.shot=null;this.shot(g,t,!!t&&!reloc&&de<=reach&&!(g&&g.cease&&!gt)&&!groundNoShoot(u),mv,dx,dy,mx,my,dt,strike);return}// (no shooting from deep water, terrain.js)
    if(t&&u.cd<=0&&!reloc&&de<=reach+1){if(mm)this.blade(t);else if(strike)strike(u,t);else this.attack(t)}
  }
  // (s: the stats he fights with now, a shooter's Melee Mode ones: step)
  crowd(dt,s){
    const u=this.u;if(s.range||u.near&&u.tgt===u.near)return;const g=u.grp&&B.groups[u.grp];if(u.alt&&(u.alt.hp<=0||u.alt.rout||(u.altT-=dt)<=0||g&&g.hasTarget&&!targetMembersOf(g).includes(u.alt)))u.alt=null;
    const t=u.tgt;if(t&&t.hp>0&&!u.alt){const R=(s.reach||11)+2,d=Math.hypot(t.x-u.x,t.y-u.y)-(t.s.big?12:0);
      if(d>R&&d<R+CROWD.slack){u.blockT=(u.blockT||0)+dt;if(u.blockT>CROWD.wait){u.blockT=0;const a=roomyFoe(u,t,s);if(a){u.alt=a;u.altT=CROWD.keep}}}else u.blockT=0}
    if(u.alt)u.tgt=u.alt}
  lost(g,s,lk,dt){
    const u=this.u;u.tgt=null;u.near=null;u.shot=null;u.inSlot=false;u.skirm=false;
    const x=clamp(lk.x+(u.sx||0),8,BW-8),y=clamp(lk.y+(u.sy||0),fieldTop(),fieldBot()),px=x-u.x,py=y-u.y,pd=Math.hypot(px,py);
    // (there, or (his place in rock, or past a cliff no way leads over) at the end of his way toward it: terrain.js steerTo)
    const W=u.wy,e=W&&!W.p.ok&&W.p.length&&W.gc===routeIx(W.g,x,y)?W.p[W.p.length-1]:null;
    if(pd<=LOST.near||e&&Math.hypot(e[0]-u.x,e[1]-u.y)<=LOST.near){u.spdNow=0;g.hold();return}
    const w=steerDir(u,x,y),mx=w?w[0]:px/pd,my=w?w[1]:py/pd,tm=tiredMul(u),wk=walking(g)||staOf(u)<FATIGUE.runMin,spd=(wk?Math.min(s.spd,g.pace||s.spd)*MARCH.walk:s.spd)*tm.spd*formPace(u)*abilitySpeed(u);
    if(PHYSICS.on){physAct(u,g,null,dt,true,mx,my,spd,pd-LOST.near,{s,tm,spurred:false});u.run=0}else{const sp=spd*dt*(u.slow>0?.5:1)*(u.buffT>0?1.25:1)*groundMul(u,mx,my);u.x+=mx*sp;u.y+=my*sp;u.spdNow=spd;ownStep(u);if(Math.abs(mx)>.35)u.face=mx>0?1:-1;u.dir=Math.atan2(my,mx);u.run=0;}
    fatigueStep(u,dt,true,wk,false,false)}
}
// a character (a lord, a chieftain, a companion): their turn their mind's (charmind.js), sent at a foe by you they go for him;
// their wounds (a companion's shield; wounded, never killed) and their aim (their skill and weapon), and no XP of a troop's
class CharActor extends Actor{
  turn(dt){CharacterMind.of(this.u).auto(dt)}
  turnsOn(g){return !g.player}
  taken(amt){const t=this.u;if(t.wardT>0)amt*=.75;if(t.comp&&t.s.block)amt*=1-t.s.block;if(t.s.dr)amt*=1-t.s.dr;return amt}// (a companion's shield and armour; a character's tree: less damage taken)
  fell(){const t=this.u;if(t.comp){const c=compInit(t.type);if(c)c.hurt=Math.max(c.hurt||0,G.day+Clock.frac+2);log(COMPS[t.type].n+' is wounded and drops out of the fight: out for 2 days.','bad')}else super.fell()}// (never killed)
  steady(){return Math.max(AIM.floor,1-AIM.skill*this.shotSkill())*Math.max(AIM.floor,1-AIM.gear*this.weaponTier())}
  earnXp(t,was){}
  // (a hard attack: their combo's finisher, charmind.js)
  hardBlow(t,H){CharacterMind.of(this.u).hard(t,H)}
}
// your hero: shooting with your weapon (heroShot), an attack order turns their own arc, no press, their roll and talents
// against wounds, your block (combat.js HeroHands), their fall, your race, skill and weapon in their aim, your bag for ammunition
class HeroActor extends CharActor{
  shotKind(){if(this.u.s.magic)return 'magic';return heroShot().flat?'xbow':'bow'}
  shotTime(){return heroShot().cd*(this.u.s.cd/.45)}
  faceFoe(g,gt,s){const u=this.u;if(s.range&&g&&gt){const p=g.targetPoint();g.faceTo(Math.atan2(p.y-u.y,p.x-u.x))}}
  crowd(dt,s){}
  dodging(){return B.hx&&B.hx.inv}
  taken(amt){amt*=1-tm('dr');if(this.u.wardT>0)amt*=.75;return amt}
  fell(){const t=this.u;B.heroDown=true;B.floats.push({x:t.x,y:t.y-22,t:'You are down!',life:1.6,c:'#fff'});log('You are knocked down. Your troops fight on.','bad')}
  guards(a,dm){return B.blocking&&angGap(a,B.aim)<1.25&&HeroHands.of().guard(dm)}
  flatShot(){return heroShot().flat}
  race(){return P.race}
  shotSkill(){return skill(this.u.s.magic?'spell':'archery')}
  weaponTier(){const I=P.gear.weapon&&ITEMS[P.gear.weapon];return I&&I.tier||0}
  useAmmo(s){}
  /* the manual control of your hero, set aside for now (RTS command: commands.js): WASD, Space, F, B, the skill slots (input.js) */
  static manual(dt){
    const h=B.hero;B.blocking=!!(G.keys.b||B.touchBlock);
    if(!h||h.hp<=0){B.blocking=false;return}
    h.cd-=dt;h.swing=Math.max(0,h.swing-dt);h.spdNow=0;
    if(HeroHands.of().actions(dt))return;
    const k=G.keys;let dx=(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0),dy=(k.s||k.arrowdown?1:0)-(k.w||k.arrowup?1:0);
    if(dx||dy)B.mt=null;else if(B.mt){const ex=B.mt.x-h.x,ey=B.mt.y-h.y,ed=Math.hypot(ex,ey);if(ed<3)B.mt=null;else{dx=ex/ed;dy=ey/ed}}
    const l=Math.hypot(dx,dy);
    const X=HeroHands.of(),run=l>0&&G.keys.shift&&!B.blocking&&X.sp>0;if(run){X.sp=Math.max(0,X.sp-STAM.sprint*dt);X.spT=0}
    if(l>0){dx/=l;dy/=l;const sp=h.s.spd*(B.blocking?.55:1)*(B.draw?.6:1)*(run?SPRINT_MUL:1)*(h.slow>0?.5:1)*groundMul(h,dx,dy)*dt;h.x+=dx*sp;h.y+=dy*sp;h.face=dx>=0?1:-1;h.spdNow=h.s.spd;if(run)train('athl',dt*.4)}
    if(G.mouse.in&&G.mouse.type==='mouse')B.aim=Math.atan2(G.mouse.y-(h.y-6),G.mouse.x-h.x);
    else{const n=nearest(h);if(n)B.aim=Math.atan2(n.y-h.y,n.x-h.x)}
  }
}
// ---------- the old names: one-line aliases ----------
function monsterAbility(u,dt){return Actor.of(u).ability(dt)}
function shotKind(u){return Actor.of(u).shotKind()}
function shotTimes(u){return Actor.of(u).shotTimes()}
function shotStep(u,g,t,can,mv,dx,dy,mx,my,dt,strike){return Actor.of(u).shot(g,t,can,mv,dx,dy,mx,my,dt,strike)}
function aiUnit(u,dt,strike){return Actor.of(u).step(dt,strike)}
function crowdTarget(u,dt,s=u.s){return Actor.of(u).crowd(dt,s)}
function lostStep(u,g,s,lk,dt){return Actor.of(u).lost(g,s,lk,dt)}
function updateHero(dt){return HeroActor.manual(dt)}
function updateNonHeroActors(dt){return Actor.turns(dt)}
