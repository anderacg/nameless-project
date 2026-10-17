'use strict';
/* ---------- characters, and the other side's command ---------- */

/* characters: your hero, a lord, a chieftain or a companion. One mind for them all (your hero's own hands are combat.js: their
   swing, bow, crits and training, which the manual control shares). They go where their group is sent (aiUnit), strike with the
   combo of their weapon (a blow inside the window carries the chain on, a breath after the finisher), and every CHAR_AI.think
   seconds look for a moment: a special move (a Shield Bash, a Shove, a Dodge Roll: charBasics) or a skill from their slots
   (battle/abilities.js chooseAbility). Their stamina is a soldier's (fatigue.js): it pays for blows and moves and comes back only
   standing out of the fight, so they keep CHAR_AI.keepSp of it for blows. Mana comes back only with the talents for it.
   A duel: a character who sees one of the other side's near (CHAR_AI.duel) goes for them, unless on the move elsewhere. */
// think: how often they look for a moment; keepSp: stamina kept back from skills and moves; release: a bow loosed this far drawn;
// breath: the pause after a finisher; pause: after every blow; duel: how near another side's character draws them
// bash, shove: how often the AI uses each (the manual control's own SHOVE.cd, BASH.cd are its button's); low: the dodge, under this
// share of health with roll: this many foes round them
const CHAR_AI={think:.3,keepSp:10,release:.85,breath:[.9,1.4],pause:.12,duel:140,bash:6,shove:4,low:.35,roll:2};
// (sp: a champion's breath, their soldier's stamina on its scale; mp: their mana; mana: a second with the talents for it, at +100%)
const CHAMP={sp:[60,5],mp:[30,6],mana:2.5};
const isFighter=u=>!!(u.leader||u.comp);
const isChar=u=>!!(u&&(u.hero||u.leader||u.comp));
const champLv=u=>u.leader?u.leader.lv:u.comp&&compInit(u.type)?compInit(u.type).lv:1;
function champ(u){if(u.ch)return u.ch;const lv=champLv(u),sp=CHAMP.sp[0]+CHAMP.sp[1]*lv+(u.s.spX||0),mp=Math.round((CHAMP.mp[0]+CHAMP.mp[1]*lv+(u.s.mpX||0))*(1+(u.s.mpPct||0)));
  const C=u.ch={lv,mp,spMax:sp,mpMax:mp,spT:9,step:-1,win:0,cds:{},think:Math.random()*CHAR_AI.think,leap:null,roll:0,rollCd:0,inv:0,rx:0,ry:0,shoveCd:0};
  // (their stamina is their soldier's (u.sta, fatigue.js): it comes back only standing out of the fight)
  Object.defineProperty(C,'sp',{get:()=>(u.sta==null?FATIGUE.max:u.sta)/FATIGUE.max*C.spMax,set:v=>{u.sta=clamp(v/C.spMax*FATIGUE.max,0,FATIGUE.max)},enumerable:true});return C}
// a character's state: your hero's (combat.js heroState) or a champion's
const charState=u=>u.hero?heroState():champ(u);
// the combo their weapon fights: a rider's sword, a spear's thrusts, a heavy hitter's cleaves
const champCombo=u=>u.s.charge?COMBO:unitClass(u.s)==='spear'?COMBOS.thrust:u.s.dmg>=12||u.type==='chief'?COMBOS.heavy:COMBO;
// what they hold: a shield (a Shield Bash), a bow (a Shove)
const charShield=u=>u.hero?grip()==='shield':tagsOf(u.s).includes('shield')||!!unitLook(u).shield;
const charBow=u=>u.hero?isBow():!!u.s.range&&!u.s.magic;
// aim at a point: your hero's skills and blows land where they choose (combat.js aimPoint, cursorDist), a champion faces it
function aimAt(u,p){if(u.hero){B.aim=Math.atan2(p.y-u.y,p.x-u.x);B.aiAim={x:p.x,y:p.y}}else u.face=p.x>=u.x?1:-1}

// one moment of a character: their timers, a move under way, a moment's move or skill if one fits, else as their group goes
function charAuto(u,dt){
  if(!u||u.hp<=0)return;
  if(u.hero){B.blocking=false;u.cd-=dt;u.swing=Math.max(0,(u.swing||0)-dt);u.spdNow=0}
  if(!charThink(u,dt)){const S=charState(u);if(S.fallBack&&!withdrawing(u))fallStep(u,S,dt);else aiUnit(u,dt,charStrike)}}
// his own moment, as an actor: his timers, a roll, leap or dash under way; true while it owns him (no decisions: commandCharacters)
function charThink(u,dt){
  const S=charState(u);
  if(u.hero){if(heroActions(dt))return true}// (your hero's timers, roll, leap and dash: combat.js)
  else{S.spT+=dt;if(u.s.mpRegen)S.mp=Math.min(S.mpMax,S.mp+CHAMP.mana*u.s.mpRegen*dt);S.win=Math.max(0,S.win-dt);for(const k in S.cds)S.cds[k]=Math.max(0,S.cds[k]-dt);
    S.shoveCd=Math.max(0,S.shoveCd-dt);S.rollCd=Math.max(0,S.rollCd-dt);S.inv=Math.max(0,S.inv-dt);
    if(S.leap)return leapStep(u,S,dt);if(S.dash)return dashStep(u,S,dt);// (a leap or a dash under way: battle/abilities.js)
    if(S.roll>0){S.roll-=dt;u.x=clamp(u.x+S.rx*170*dt,8,BW-8);u.y=clamp(u.y+S.ry*170*dt,fieldTop(),fieldBot());u.face=S.rx>=0?1:-1;u.spdNow=170;return true}}
  if(withdrawing(u)||u.stun>0)return false;// (withdrawing: no skills, just away: morale.js)
  // (a skill or a move just used on his commander's call or your Auto skills: commandCharacters)
  if(u.castNow){u.castNow=false;return true}
  return false;
}
// a blow at t: your hero's (the combo, the bow drawn, a staff's cast: combat.js) or a champion's
function charStrike(u,t){
  {const m=momentum(u);u.run=0;if(m>=CHARGE.min)fatigueCharge(u,m)}// (a charge spends their stamina, as a soldier's: fatigue.js)
  aimAt(u,t);
  // (a bow: drawn already, by the shot cycle every shooter has (actors.js shotStep); loosed now, at full draw)
  if(drawsBow(u)){if(u.hero){G.bowRange=clamp(Math.hypot(t.x-u.x,t.y-u.y),BOW_RANGE[0],BOW_RANGE[1]);shoot('ranged',1)}else champLoose(u,t,1);return}
  if(!u.hero)return champStrike(u,t);
  if(heroKind()==='melee'){const X=heroState(),CB=heroCombo(),at=u.atkAt;swing();
    if(u.atkAt!==at){u.cd+=CHAR_AI.pause;if(X.step===CB.length-1)u.cd+=breath()}return}
  swing();
}
/* the bow, the same for every character and soldier: drawn, loosed and reloaded by the shot cycle (actors.js shotStep), as true
   as their skill, their bow and their draw allow (attacks.js aimErr). A character's arrow is their own (your hero's from your
   bag: combat.js shoot); crossbows, slings and magic shoot as a soldier's do */
const drawsBow=u=>u.hero?isBow():!!u.s.range&&!u.s.magic&&!u.s.flat;
function champLoose(u,t,p){
  if(!t||t.hp<=0)return;
  u.atkAt=B.t;const E=aimErr(u,p);
  fireBolt(u,Math.atan2(t.y-u.y,t.x-u.x)+spreadOf(E),u.s.dmg*(.55+.6*p)*(.9+Math.random()*.2)*(u.buffT>0?1.3:1)*tiredMul(u).dmg,u.s,Math.min(Math.hypot(t.x-u.x,t.y-u.y),aimReach(p)),{speed:ARC_SPEED*(.8+Math.min(Math.hypot(t.x-u.x,t.y-u.y),aimReach(p))/250)*(.6+.4*p),sc:E.d});
  if(u.ammo==null)u.ammo=quiverOf(u.s);if(--u.ammo<=0)outOfAmmo(u)}
const breath=()=>CHAR_AI.breath[0]+Math.random()*(CHAR_AI.breath[1]-CHAR_AI.breath[0]);
const champFoes=u=>B.units.filter(e=>e.team!==u.team&&e.hp>0);
// a champion's blow: the next step of their combo (a troop's shot for one with a crossbow, a sling or magic). It costs what a soldier's blow does; tired, softer
function champStrike(u,t){
  if(u.s.range)return attack(u,t);
  const C=champ(u),CB=champCombo(u),step=C.win>0?(C.step+1)%CB.length:0,tired=tiredMul(u).dmg;
  staSpend(u,blowSta(step,CB));C.spT=0;C.step=step;const c=CB[step],a=Math.atan2(t.y-u.y,t.x-u.x);
  u.cd=c.cd*((u.s.cd||.8)/.45)*.9+CHAR_AI.pause;C.win=u.cd+COMBO_WINDOW;u.atkAt=B.t;u.atkStyle=STYLE[c.shape];u.face=Math.cos(a)>=0?1:-1;
  const R=(u.s.reach||12)+c.reach,life=c.shape==='slam'||c.shape==='spin'?.32:.2;
  B.slashes.push({kind:c.shape,x:u.x,y:u.y-6,a,life,max:life,arc:c.arc,r:R,col:u.team?'255,170,150':c.col,w:c.w,dir:c.dir,area:c.area,wid:c.wid});
  let n=0;for(const e of champFoes(u)){if(!inShape(u.x,u.y,a,R,c,e))continue;hit(u,e,u.s.dmg*tired*c.mult*(.85+Math.random()*.3)*(c.shape==='thrust'?Math.max(.5,1-.2*n):1),shapeDt(c.shape,dtOf(u.s)));knock(e,u.x,u.y,c.kb||0);if(c.stun)stun(e,c.stun);n++}
  if(step===CB.length-1){u.cd+=breath();if(n)B.floats.push({x:u.x,y:u.y-26,t:c.n,life:.5,c:u.team?'#ff9a90':'#9fc0ff'})}
}
/* the special moves, for every character: a Shield Bash (with a shield) when it matters: a heavy hitter, a big beast or another
   character in front, or two or more pressing; a Shove (with a bow) at a foe who reaches them; a Dodge Roll away when badly hurt
   and hemmed in. Bash and Shove every CHAR_AI.bash / .shove seconds, and only while not tired (fatigue.js); true if one was used */
function charBasics(u){
  const S=charState(u),foes=champFoes(u);if(!foes.length)return false;
  const dist=e=>Math.hypot(e.x-u.x,e.y-u.y)-(e.s.big?12:0),close=foes.reduce((a,e)=>dist(e)<dist(a)?e:a),d=dist(close),around=foes.filter(e=>Math.hypot(e.x-u.x,e.y-u.y)<22);
  const shield=charShield(u),bow=!shield&&charBow(u),M=shield?BASH:SHOVE,fresh=staOf(u)>=FATIGUE.tired;
  if((shield||bow)&&d<=(u.s.reach||12)+6&&!(S.shoveCd>0)&&fresh&&S.sp>=M.sp+CHAR_AI.keepSp&&(bow||isChar(close)||close.s.big||close.s.dmg>=12||around.length>=2)){
    aimAt(u,close);if(u.hero)shove();else champShove(u,close,M);S.shoveCd=Math.max(S.shoveCd||0,shield?CHAR_AI.bash:CHAR_AI.shove);return true}
  const cost=u.hero?dodgeCost():STAM.dodge;
  if(u.hp<u.max*CHAR_AI.low&&around.length>=CHAR_AI.roll&&!(S.rollCd>0)&&S.sp>=cost){const cx=around.reduce((a,e)=>a+e.x,0)/around.length,cy=around.reduce((a,e)=>a+e.y,0)/around.length,l=Math.hypot(u.x-cx,u.y-cy)||1;
    S.fallBack={at:B.t,...fallSpot(u,around,{x:cx,y:cy}),ord:ordKey(u.grp&&B.groups[u.grp])};S.fbT=CHAR_AI.think;B.floats.push({x:u.x,y:u.y-26,t:'Falling back',life:.9,c:u.team?'#ff9a90':'#cfe0ff'});// (out of the press, then a look before going in again)
    if(u.hero)dodge((u.x-cx)/l,(u.y-cy)/l);else champDodge(u,(u.x-cx)/l,(u.y-cy)/l,cost);return true}
  return false;
}
/* falling back: a character who rolled out of a press (charBasics) does not run straight back into it. It falls back to cover
   (S.fallBack {at, x, y}: behind the nearest troops of its own side, away from the press, CHAR_FALL.near-dist px off; never into
   other foes), striking only a foe in its way and healing if it can, and gets its breath back. Each think it looks again
   (fallLook): its breath back (FATIGUE.tired) and where it would go no trap (at most CHAR_FALL.crowd of theirs within trap px of
   it, or as many of ours already there): then it goes in again, to its ordered target (yours keep your attack order), else to
   the safest foe near (fallMark). Health is no gate (it never comes back in battle); after CHAR_FALL.max s, or with no troops of
   its own left to cover it, it goes in anyway; any order of yours to its group (a move, an attack, Hold, the pace: orderSeq)
   ends it at once. Your hero under your own hands (MANUAL_HERO), or yours with Auto skills off, never does */
// near, dist: how far it falls back (px); cover: troops of its own this near to fall back behind; min: s before it looks again;
// crowd, trap: a target point that is no trap; look: an AI character's own pick among foes this near; max: the longest it stays
// out; heal: it heals on the way under this share of its health
// keep: s after going in again at its own pick that a duel does not draw it off him
const CHAR_FALL={near:60,dist:100,cover:250,min:1,crowd:2,trap:40,look:300,max:12,heal:.6,keep:2};
// a group's orders as a fall-back remembers them: any order of yours (commands.js bumps orderSeq), a move, a target
const ordKey=g=>g?[g.mvId,g.targetGroupId,g.targetUnitId,g.order,g.orderSeq|0].join():'';
const fallMates=u=>B.units.filter(o=>o.team===u.team&&o.hp>0&&!o.rout&&!o.left&&!isChar(o));
const liveFoes=u=>B.units.filter(e=>e.team!==u.team&&e.hp>0&&!e.rout&&!e.left);
// where to fall back to from the press round c: behind the nearest troops of ours within cover, else straight away from it
function fallSpot(u,around,c){
  const X=CHAR_FALL,dd=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),ax=u.x-c.x,ay=u.y-c.y,l=Math.hypot(ax,ay)||1,away={x:u.x+ax/l*X.dist*.8,y:u.y+ay/l*X.dist*.8};
  const mates=fallMates(u),f=mates.length?mates.reduce((a,o)=>dd(o,u)<dd(a,u)?o:a):null;let to=away;
  if(f&&dd(f,u)<X.cover){const fx=f.x-c.x,fy=f.y-c.y,fl=Math.hypot(fx,fy)||1;to={x:f.x+fx/fl*25,y:f.y+fy/fl*25}}
  const dx=to.x-u.x,dy=to.y-u.y,d=Math.hypot(dx,dy)||1,k=clamp(d,X.near,X.dist)/d;to={x:u.x+dx*k,y:u.y+dy*k};
  const from={x:u.x,y:u.y};if(liveFoes(u).some(e=>!around.includes(e)&&dd(e,to)<X.trap||segDist(e,from,to)<X.trap/2))to=away;// (not into other foes, nor back through the press)
  return{x:clamp(to.x,8,BW-8),y:clamp(to.y,fieldTop(),fieldBot())}}
// each moment falling back: to its spot (running, as tired as it is), a blow only at a foe in its reach; standing there, its breath comes back
function fallStep(u,S,dt){
  if(u.stun>0){u.stun-=dt;u.spdNow=0;return}
  const F=S.fallBack,reach=(u.s.reach||12)+2,block=drawsBow(u)?null:liveFoes(u).find(e=>Math.hypot(e.x-u.x,e.y-u.y)-(e.s.big?12:0)<=reach+1);
  const dx=F.x-u.x,dy=F.y-u.y,d=Math.hypot(dx,dy);u.spdNow=0;u.run=0;let moved=false;
  if(d>4){const sp=Math.min(d,u.s.spd*tiredMul(u).spd*(u.slow>0?.5:1)*dt);u.x+=dx/d*sp;u.y+=dy/d*sp;u.face=dx>=0?1:-1;u.dir=Math.atan2(dy,dx);u.spdNow=sp/Math.max(dt,1e-6);moved=true}
  if(block){u.tgt=block;if(u.cd<=0)charStrike(u,block)}
  fatigueStep(u,dt,moved,false,false,!!block)}
// the point it would go in at: its group's ordered target (yours: your attack order), else (an AI character) the foe near with the
// fewest of theirs round him and the nearer the better ({x,y,e})
function fallMark(u,g){
  if(g&&g.hasTarget){const p=g.targetPoint();return p&&{x:p.x,y:p.y,e:null}}
  const foes=liveFoes(u),near=foes.filter(e=>Math.hypot(e.x-u.x,e.y-u.y)<CHAR_FALL.look),l=near.length?near:foes;if(!l.length)return null;
  const sc=e=>Math.hypot(e.x-u.x,e.y-u.y)+60*foes.filter(o=>o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<CHAR_FALL.trap).length,e=l.reduce((a,o)=>sc(o)<sc(a)?o:a);return{x:e.x,y:e.y,e}}
// no trap there: few of theirs about it, or as many of ours already in the fight there
function fallSafe(u,p){const n=l=>l.filter(o=>Math.hypot(o.x-p.x,o.y-p.y)<CHAR_FALL.trap).length,theirs=n(liveFoes(u));return theirs<=CHAR_FALL.crowd||n(fallMates(u))>=theirs}
// each think falling back: a heal if it has one and needs it; then, once ready, in again
function fallLook(u,S){
  const X=CHAR_FALL,F=S.fallBack,g=u.grp&&B.groups[u.grp];
  if(g&&!aiCommands(u)&&ordKey(g)!==F.ord){S.fallBack=null;return}// (a new order of yours: at once)
  if(u.hp<u.max*X.heal&&u.unit&&u.unit.actives().includes('heal')){const K=kitOf(u,'heal');if(!(K.st.cds.heal>0)&&K.can(false)){if(u.hero)castSkill('heal');else castAbility(u,'heal',{x:u.x,y:u.y})}}
  if(B.t-F.at<X.min)return;
  const mark=fallMark(u,g),ok=!fallMates(u).length||B.t-F.at>=X.max||!mark||staOf(u)>=FATIGUE.tired&&fallSafe(u,mark);
  if(!ok)return;S.fallBack=null;if(mark&&mark.e&&!(g&&g.hasTarget)){u.tgt=mark.e;u.rt=1.5;S.backIn=B.t}}// (its own pick: no duel draws it off him for CHAR_FALL.keep s)
/* the calls for the characters (your hero, lords, chieftains, companions), each CHAR_AI.think: their commander's for the AI's
   (the enemy, your allies, your army on auto: A), and for yours your Auto skills (K): a special move or a skill when the moment
   is right (charBasics, chooseAbility). Duels are the commander's alone: a character of the other side near, and not on the
   move elsewhere, it sets him on him */
const aiCommands=u=>u.team===1||!!(u.grp&&u.grp.startsWith('a_'))||!!B.auto;
function commandCharacters(dt){
  for(const u of B.units){if(u.hp<=0||!isChar(u)||u.stun>0||withdrawing(u)||u.hero&&MANUAL_HERO)continue;
    const ai=aiCommands(u),S=charState(u);
    // (falling back: no skills nor duels, a look now and then; yours with Auto skills off have none of the AI's: as you order them)
    if(S.fallBack){if(!ai&&!AUTOSK.on)S.fallBack=null;else{if((S.fbT=(S.fbT||0)-dt)<=0){S.fbT=CHAR_AI.think;fallLook(u,S)}continue}}
    /* (your hero under your own hands: yours alone) */if(!ai&&!AUTOSK.on)continue;
    const g=u.grp&&B.groups[u.grp],sent=!!g&&relocating(u,g);if(S.leap||S.dash||S.roll>0)continue;
    if(ai&&!sent&&!(g&&g.hasTarget)&&!(B.t-(S.backIn??-99)<CHAR_FALL.keep)){let best=null,bd=CHAR_AI.duel;for(const e of B.units)if(e.team!==u.team&&e.hp>0&&isChar(e)){const d=Math.hypot(e.x-u.x,e.y-u.y);if(d<bd){bd=d;best=e}}if(best){u.tgt=best;u.rt=.5}}
    if((S.think=(S.think||0)-dt)<=0){S.think=CHAR_AI.think;if(sent)continue;if(charBasics(u)||chooseAbility(u))u.castNow=true}}}
// a champion's own: the shove or bash (those in front knocked back and staggered), the roll (away, unhurt while it lasts)
function champShove(u,t,M){
  const C=champ(u),a=Math.atan2(t.y-u.y,t.x-u.x);C.sp-=M.sp;u.atkAt=B.t;u.face=Math.cos(a)>=0?1:-1;
  if(M===BASH)B.floats.push({x:u.x,y:u.y-26,t:'Shield Bash',life:.6,c:u.team?'#ff9a90':'#cfe0ff'});
  B.slashes.push({x:u.x,y:u.y-6,a,life:.15,r:(u.s.reach||12)+2,arc:.9,col:'200,220,255',w:2});
  for(const e of champFoes(u)){const d=Math.hypot(e.x-u.x,e.y-u.y)-(e.s.big?12:0),ea=Math.atan2(e.y-u.y,e.x-u.x),df=angGap(ea,a);
    if(d<=(u.s.reach||12)+6&&df<1.1){hit(u,e,u.s.dmg*M.mult,'blunt');knock(e,u.x,u.y,M.kb);stun(e,M.stun)}}}
function champDodge(u,dx,dy,cost){const C=champ(u);C.sp-=cost;C.rx=dx;C.ry=dy;C.roll=.24;C.inv=.3;C.rollCd=DODGE_CD;fx(u.x,u.y,'#c8b48a',6)}
// (kept for the tests and the console: a champion's skill now, if one fits)
const champSkill=u=>chooseAbility(u);

/* the other side's command: as you command yours, the enemy's captain orders their army's groups (beasts just fight). Infantry advances in line and charges once the lines are close; archers hold behind their infantry
   and shoot, at your hero once the lines meet; cavalry swings round a flank and falls on your archers (or your hero). */
// think: how often a captain decides (s); clash: the lines have met when this close (px); behind: archers stand this far behind
// their infantry; flankY, flankAt, flankMax: cavalry rides this far round a flank, is there within flankAt, or gives up after
// flankMax s; advance: an advancing line's pace; threat: an enemy this close to its archers threatens them; reach: archers aim
// at what is within this share of their range; regroup: cavalry pulls back this far after a charge, recharge: after this long
// in the melee; attackAt / defendAt: the strength ratios to attack or hold at (hold: an attack goes on down to attackAt-hold); stall: a standoff turns into an attack after this;
// lull: no blow struck anywhere for this long (two sides that cannot reach each other), and every group goes in
const FOE_CMD={think:.5,clash:70,behind:50,outgun:.8,volley:12,screen:20,replan:3,moved:30,flankY:110,flankAt:40,flankMax:8,advance:22,threat:70,reach:.97,regroup:90,recharge:3,attackAt:1.15,hold:.1,defendAt:.85,stall:30,lull:10,patience:6,beaten:.4,broken:30};
// unit-level morale (each captain's, a group's own resolve): an infantry group under pullAt with a steady one (backAt) beside it
// steps pullDist back to recover, till backAt or maxRecover s, the nearest steady one free going into the gap; riders under
// chargeAt start no new charge, standing off cavRecover s at most (short: riders out of the fight get their breath back and come
// again, so a long stand-off only drags a cavalry fight out); prey, preyShot: the cavalry's and the shooters' liking for a
// wavering foe (under MORALE.waver)
const UNIT_AI={pullAt:25,backAt:45,pullDist:90,maxRecover:15,chargeAt:40,cavRecover:4,prey:2,preyShot:1.5};
/* AI tactics (every captain: the enemy, your allies, your army under the AI). Its shooters' posture (rangedMode, B.rmode[ck]):
   aggressive, they lead the army and open fire first, or safe, behind the infantry screen; charges begun from further off as
   the group's stamina allows (runFor); and the groups' own abilities (unitabilities.js: Brace, Rally, Spur, Fire arrows) */
// fast: a foe who fights hand to hand this fast (or a rider) can run down shooters; fastIn, fastOut: their strength, as a share of
// our shooters', under which ours may lead (in) or keep leading (out); outRange, outShoot: our shooters' reach and strength over
// theirs to lead (either; to keep leading, at least theirs); ammo: under this share of their quivers they are worn; dwell: s safe
// before leading again; dangerT, near: a foe who fights hand to hand this many s off (by his speed, at most CAPT.danger px) or
// this near (px), and leading shooters fall back behind their infantry; screenGap: the infantry this far further off than the
// leading shooters' full reach; pushRun: leading shooters run to their place from this far
// fresh: a group's stamina (FATIGUE's scale) for a long run; runFar: fresh infantry charge at a run from this near (CAPT.runAt
// when not fresh, runNear tired, at a walk spent; riders fresh gallop all the way); footFar: fresh infantry attacking charge from
// this gap (else FOE_CMD.clash); cavStart: fresh riders on their way round a flank charge from this gap, not on top of the foe;
// regroupFar: fresh riders pull back this far to charge again; rested, restMax: tired riders stand off till this stamina, or this long
// braceAt, braceMom: riders or a big beast with this momentum this near a spear group's front (px), it braces; braceKeep: and is
// left braced while one is this near; spur, spurWin, spurSta: riders spur on a fresh charge (spurWin s old) at a mark this far off
// (px), with this stamina; fireGain: fire arrows at an armoured mark (or one weak to fire) when fire does this much more than theirs
const AI_TACTICS={fast:60,fastIn:.15,fastOut:.3,outRange:1.1,outShoot:1.25,ammo:.35,dwell:2,dangerT:3.5,near:110,screenGap:60,pushRun:80,
  fresh:60,runFar:240,runNear:130,footFar:140,cavStart:160,regroupFar:150,rested:55,restMax:5,
  braceAt:80,braceMom:.3,braceKeep:120,spur:[60,140],spurWin:2.5,spurSta:45,fireGain:1.15};
// a group's stamina on FATIGUE's scale (full for one that has none)
const grpSta=m=>(grpStamina(m)??1)*FATIGUE.max;
// how near its mark a group on a charge order starts running: infantry and riders by their stamina, others CAPT.runAt
function runFor(k,st){const X=AI_TACTICS;if(k!=='inf'&&k!=='cav')return CAPT.runAt;
  return st>=X.fresh?(k==='cav'?Infinity:X.runFar):st>=FATIGUE.tired?CAPT.runAt:st>=FATIGUE.spent?X.runNear:0}
/* the shooters' posture, each think, kept a while (hysteresis): aggressive while attacking, not outnumbered, out-ranging or
   out-shooting the other side, with little of theirs fast enough to run them down, quivers and nerve whole and no foe who fights
   hand to hand closing on them; else safe. why: what keeps it safe ('' when aggressive) */
function rangedMode(ck,S,post,shots,engaged){
  const X=AI_TACTICS,R=B.rmode=B.rmode||{},P=R[ck]||{mode:'safe',at:-99},was=P.mode==='aggressive',foes=S.foes,d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const armed=shots.filter(u=>u.s.range&&!u.empty),theirs=foes.filter(e=>e.s.range&&!e.empty&&!e.rout),w=l=>l.reduce((a,u)=>a+wOf(u),0),rng=l=>l.reduce((a,u)=>a+u.s.range,0)/l.length;
  let why='';
  if(!armed.length)why='none';else if(post!=='attack')why='defend';else if(S.ratio<FOE_CMD.defendAt)why='outnumbered';
  else{const Wm=w(armed),melee=foes.filter(e=>!(e.s.range&&!e.empty)&&!e.rout);
    const ammo=armed.filter(u=>isFinite(quiverOf(u.s))),rs=[...new Set(armed.map(u=>!B.noMorale&&resolveOf(u)).filter(r=>r&&!r.routed))];
    if(w(melee.filter(e=>e.s.charge||e.s.spd>=X.fast))>Wm*(was?X.fastOut:X.fastIn))why='cavalry';
    else if(ammo.length&&ammo.reduce((a,u)=>a+(u.ammo??quiverOf(u.s))/quiverOf(u.s),0)/ammo.length<X.ammo||rs.some(r=>r.mor<MORALE.waver))why='worn';
    else if(melee.some(e=>!engaged(e)&&armed.some(a=>d2(a,e)<Math.max(X.near,Math.min(CAPT.danger,e.s.spd*X.dangerT)))))why='closing';
    else if(theirs.length&&rng(armed)<rng(theirs)*(was?1:X.outRange)&&Wm<w(theirs)*(was?1:X.outShoot))why='outshot';}
  if(!why&&!was&&B.t-P.at<X.dwell)why='wait';// (safe a moment ago: a breath before leading again)
  const mode=why?'safe':'aggressive';return R[ck]={mode,at:mode!==P.mode?B.t:P.at,why}}
// beaten / broken: the enemy army falls back (withdraws off its edge) once its strength is under beaten of yours and its
// formations' shared morale (morale.js BattleResolve), weighted by the men in them, is under broken. Your own army never does on its own.
function beatenArmy(N,S){
  const rs=[...new Set(Object.values(N).flat().flatMap(grpUnits).map(resolveOf).filter(r=>r&&!r.routed&&r.live().length))],n=rs.reduce((a,r)=>a+r.live().length,0);
  return !!n&&S.ratio<FOE_CMD.beaten&&rs.reduce((a,r)=>a+r.mor*r.live().length,0)/n<FOE_CMD.broken;
}
function captainGroups(team,key){
  const ids=Object.keys(B.groups).filter(id=>{const g=B.groups[id];return g.team===team&&(team===1||key==='ally'?team===1||g.ally:g.player)});
  return Object.fromEntries(['inf','arc','mag','cav','hero'].map(role=>[role,ids.filter(id=>B.groups[id].role===role)]));
}
// each moment: an advancing line's anchor moves toward the other army (the enemy's; yours under the AI)
// twice a second, the captains' orders: the enemy's always; yours only with the AI in command (B.auto)
function command(dt){
  if(!B||(B.cmdT=(B.cmdT||0)-dt)>0)return;B.cmdT=FOE_CMD.think;
  captain(1);captainFinish(1,captainGroups(1));
  if(Object.values(B.groups).some(g=>g.ally)){captain(0,'ally');captainFinish(0,captainGroups(0,'ally'))}// (your allies' own captain)
  if(B.auto){captain(0);captainFinish(0,captainGroups(0))}
}
/* a captain gives its orders through the same tools you use. Its pace: a charge (and a cavalry's ride round a flank) at a run,
   else at a walk. A new place well away (CAPT.move): a move, its men break off and go (battlecontrol.js moveOrder). Its formation for
   the moment: a wedge for a cavalry charge, a shield wall for shielded infantry holding under the other side's arrows, loose
   order for archers under them, else a line; its front toward the other army. */
// shotFor, shotShare: a group is under fire when this share of its men were hit by a shot in the last shotFor seconds; brace: riders
// building a charge at it this near (a big beast half that), and it braces; keep: a shield wall or loose order is kept this long at least
// contact, cover: Kite (kiteFrom): a foe there within contact s is coming; one of ours within cover px of his path covers
const CAPT={move:40,shoot:.25,turn:.45,shotFor:3,shotShare:.15,brace:140,keep:3,runAt:180,contact:2.5,cover:20,danger:250,haltAt:.97,toBlades:22,threatShare:.5,bare:60,prey:400};// (threatShare: a threat to our shooters worth the infantry, by strength; bare: their shooters with none of their fighters this near)// (toBlades: a melee foe this near its shooters, and no kiting away: melee mode)// (haltAt: on the way, a foe this far into its shooters' reach and they stop to shoot)// (danger: a melee foe this near its shooters counts first in their focus)
/* Hunt: a group of the commander's shooters sent out, while it is safe, to shoot from a spot of its own (HUNT.spot of their reach
   from their mark, on the near side). Safe: every foe who fights hand to hand at least HUNT.safe s (by his own speed) from the
   spot, a rider not already fighting HUNT.ride s; none of their shooters who outrange ours able to reach it. Marks, best first:
   their shooters ours outrange, a man alone, a slow one, the nearer the better */
const HUNT={safe:6,ride:9,spot:.95,ammo:.3,clash:150,tries:6,home:3};
function huntSafe(p,foes,busy,R){
  for(const e of foes){if(e.rout||e.hp<=0)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);
    if(e.s.range){if(e.s.range>R&&d<=e.s.range)return false;continue}
    if(!busy(e)&&d/Math.max(1,e.s.spd)<(e.s.charge?HUNT.ride:HUNT.safe))return false}
  return true}
function huntSpot(sh,foes,busy){
  const C={x:sh.reduce((a,u)=>a+u.x,0)/sh.length,y:sh.reduce((a,u)=>a+u.y,0)/sh.length},R=Math.min(...sh.map(u=>u.s.range)),r=R*HUNT.spot;
  const alone=e=>!foes.some(o=>o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<40),score=e=>(e.s.range&&e.s.range<R?3:0)+(alone(e)?2:0)+(e.s.spd<35?1:0)-Math.hypot(e.x-C.x,e.y-C.y)/400;
  for(const t of foes.filter(e=>!e.rout&&e.hp>0).sort((a,b)=>score(b)-score(a)).slice(0,HUNT.tries)){const a0=Math.atan2(C.y-t.y,C.x-t.x);
    for(const da of [0,.5,-.5,1,-1]){const p={x:clamp(t.x+Math.cos(a0+da)*r,8,BW-8),y:clamp(t.y+Math.sin(a0+da)*r,fieldTop(),fieldBot())};
      if(Math.hypot(p.x-t.x,p.y-t.y)<=R&&huntSafe(p,foes,busy,R))return{t,x:p.x,y:p.y,tx:t.x,ty:t.y}}}
  return null}
// fire arrows worth it on e: armoured (mail, plate) or weak to fire, and fire does AI_TACTICS.fireGain more to him than a's own shots
function fireWorth(a,e){const s=e.s,ar=armorOf(s);return (ar==='mail'||ar==='plate'||((s.resist&&s.resist.fire)||1)>1)&&typeMul(a.s,s,'fire')*UNIT_ABILITIES.fire.mul>=typeMul(a.s,s)*AI_TACTICS.fireGain}
const segDist=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,L=dx*dx+dy*dy||1,k=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/L,0,1);return Math.hypot(a.x+dx*k-p.x,a.y+dy*k-p.y)};
/* Kite: the commander's look at a group of its shooters. The foe they must keep away from: one who fights hand to hand coming
   at them (inside their keeping distance, or charging in, there within CAPT.contact s) with none of our fighters on him or
   between him and them. The nearest such foe, or null: then they need not move */
function kiteFrom(sh,foes,mates){let best=null,bd=1e9;
  for(const e of foes){if(e.s.range||e.rout)continue;const n=sh.reduce((a,u)=>Math.hypot(e.x-u.x,e.y-u.y)<Math.hypot(e.x-a.x,e.y-a.y)?u:a),d=Math.hypot(e.x-n.x,e.y-n.y),keep=Math.min(SKIRM.max,n.s.range*SKIRM.keep);
    const v=(e.spdNow||0)*Math.cos(Math.atan2(n.y-e.y,n.x-e.x)-(e.dir||0));if(!(d<=keep||v>5&&d/v<CAPT.contact))continue;
    if(!mates.some(f=>f.hp>0&&!f.rout&&(Math.hypot(f.x-e.x,f.y-e.y)<(f.s.reach||12)+8||segDist(f,e,n)<CAPT.cover&&Math.hypot(f.x-e.x,f.y-e.y)<d))&&d<bd){bd=d;best=e}}
  return best}
function captainFinish(team,N){
  const S=assess(team),foes=S.foes;if(!foes.length)return;const M={x:foes.reduce((a,u)=>a+u.x,0)/foes.length,y:foes.reduce((a,u)=>a+u.y,0)/foes.length};
  for(const k of ['inf','arc','mag','cav','hero'])for(const id of N[k]){const g=B.groups[id],m=grpUnits(id);if(!g||!m.length||g.order==='withdraw')continue;
    // (a charge at a walk till near its foe, then at a run: it comes in with breath left for the impact, from further off the
    // fresher it is (runFor), at a walk once spent; riders gallop round a flank unless tired; leading shooters run to their
    // place and back behind their infantry: rangedMode)
    const tg=g.targetPoint(),Cm={x:m.reduce((a,u)=>a+u.x,0)/m.length,y:m.reduce((a,u)=>a+u.y,0)/m.length},near=tg?Math.hypot(tg.x-Cm.x,tg.y-Cm.y):Math.min(...foes.map(e=>Math.hypot(e.x-Cm.x,e.y-Cm.y))),st=grpSta(m);
    g.setRun(g.backing||!!g.huntBack||!!g.screenBack||!!g.pushRun||!g.hunt&&g.order==='charge'&&near<runFor(k,st)||k==='cav'&&g.order==='hold'&&g.phase==='flank'&&st>=FATIGUE.tired);
    if(k==='hero')continue;
    // (whether a new place is a move, its men breaking off to go: battlecontrol.js standAt)
    // (what the moment calls for: shot at, a shield wall (infantry) or loose order (shooters); a charge coming, they brace in a
    // shield wall; on the march or charging, a line; a wall or loose order kept a while once taken, then dropped when it passes)
    const C0={x:m.reduce((a,u)=>a+u.x,0)/m.length,y:m.reduce((a,u)=>a+u.y,0)/m.length},marching=Math.hypot(C0.x-g.ax,C0.y-g.ay)>(g.shieldWall?40:25);
    const shot=m.filter(u=>B.t-(u.shotAt??-99)<CAPT.shotFor).length>=Math.max(1,m.length*CAPT.shotShare);
    const brace=foes.some(e=>{const d=Math.hypot(e.x-C0.x,e.y-C0.y);return e.s.charge&&(e.run||0)>CHARGE.run*.25&&d<CAPT.brace||e.s.big&&d<CAPT.brace/2});
    const held=(g.shieldWall||g.form==='loose')&&g.formAt!=null&&B.t-g.formAt<CAPT.keep;// (taken by the captain: one with no time of its own is not held)
    const wall=k==='inf'&&g.order!=='charge'&&!marching&&(shot||brace||held&&g.shieldWall)&&m.some(shieldEligible);
    if(wall&&!g.shieldWall)g.formAt=B.t;g.setFlag('shieldWall',wall);
    const f=k==='cav'&&g.order==='charge'&&formFits(id,'wedge')?'wedge':(k==='arc'||k==='mag')&&(shot||held&&g.form==='loose')&&formFits(id,'loose')?'loose':'line';
    if(f!==g.form&&f==='loose')g.formAt=B.t;
    // (its front: toward the foe's army; its shooters toward whom they should shoot (their mark, else the nearest in their
    // reach), turned only once he is out of their arc: the soldiers never turn themselves)
    const C={x:m.reduce((a,u)=>a+u.x,0)/m.length,y:m.reduce((a,u)=>a+u.y,0)/m.length},sm=(k==='arc'||k==='mag')&&m.some(u=>u.s.range),R=sm?Math.max(...m.map(u=>u.s.range||0)):0,inR=sm?foes.filter(e=>Math.hypot(e.x-C.x,e.y-C.y)<=R):[],
      mark=sm&&(g.targetPoint()||(inR.length?inR.reduce((a,e)=>Math.hypot(e.x-C.x,e.y-C.y)<Math.hypot(a.x-C.x,a.y-C.y)?e:a):null)),
      face=mark?Math.atan2(mark.y-C.y,mark.x-C.x):Math.atan2(M.y-C.y,M.x-C.x),turned=angGap(face,g.currentFacing??g.face)>(mark?SHOOT.arc*.4:CAPT.turn);
    if(g.form!==f||turned)g.setForm(f,{face})}
}
/* one side's captain. It reads the whole battle (assess): each side's strength (health by tier), how much of it shoots, how
   close the lines are, and who threatens its archers. Its posture: attack if it is the stronger, or if the other side
   outshoots it (it must close in); hold its ground if it is the weaker but shoots as well (let them come to its arrows); a
   standoff turns into an attack. Then each arm:
   infantry: to its archers' rescue when they are threatened; else advance (attack) or hold a line in front of its archers
   (defend), and charge once the lines meet;
   archers: behind their infantry, stepping back from melee (skirmish), all shooting at the best target in reach: whoever is
   fighting its own men, else the other side's archers, else whoever is nearest (the other side's leader only if nothing
   better is in reach); out of arrows, into the melee;
   cavalry: round a flank, then charges the best target (archers, then those already fighting its men: their backs, then the
   isolated; never braced spearmen if it can help it); after a while in the melee it pulls back and charges again; it rides to
   its archers' rescue first;
   your hero (under the AI): behind the infantry until the lines meet, then into the fight. */
const wOf=u=>u.hp/Math.max(1,u.max)*(u.hero||u.leader||u.comp?4:(ST[u.type]&&ST[u.type].tier||1));
function assess(team){
  const mine=B.units.filter(u=>u.team===team&&fighting(u)),foes=B.units.filter(u=>u.team!==team&&fighting(u));
  const pw=l=>l.reduce((a,u)=>a+wOf(u),0),shoot=l=>l.filter(u=>u.s.range).reduce((a,u)=>a+wOf(u),0),pm=pw(mine),pf=pw(foes);
  return{mine,foes,ratio:pm/Math.max(.01,pf),shootMe:shoot(mine)/Math.max(.01,pm),shootFoe:shoot(foes)/Math.max(.01,pf)};
}
// (ck: the captain's own memory; attacking, it keeps attacking down to FOE_CMD.hold under attackAt: no flip on noise)
function posture(ck,S){
  const P_=(B.post=B.post||{})[ck];
  if(S.shootFoe>S.shootMe+.15||S.ratio>=FOE_CMD.attackAt-(P_==='attack'?FOE_CMD.hold:0))return 'attack';
  if(S.ratio<FOE_CMD.defendAt&&S.shootMe>=S.shootFoe&&S.shootMe>.1)return B.t<FOE_CMD.stall*2?'defend':'attack';
  return P_==='defend'&&B.t<FOE_CMD.stall?'defend':S.shootMe>S.shootFoe+.1&&B.t<FOE_CMD.stall?'defend':'attack';
}
function captain(team,key){
  // (ck: this captain's own plan and volleys: your army's and your allies' are on one side but each its own)
  const ck=key==null?team:key,N0=captainGroups(team,key),S=assess(team),foes=S.foes;if(!foes.length)return;
  // (a beaten enemy army falls back as one, rather than fighting to the last man; once begun it does not turn round)
  if(team===1&&key==null&&!B.noMorale&&(B.fallBack||beatenArmy(N0,S))){if(!B.fallBack){B.fallBack=true;log('The enemy falls back.','good')}for(const id of Object.values(N0).flat())B.groups[id].withdraw();return}const post=(B.post=B.post||{})[ck]=B.commit&&B.commit[ck]?'attack':posture(ck,S);// (once it has gone in after a lull, it stays in)
  // (a group withdrawing (your order, before Auto) is left to it, as captainFinish does: the AI never takes a withdrawal back)
  const N=Object.fromEntries(Object.entries(N0).map(([k,l])=>[k,l.filter(id=>B.groups[id].order!=='withdraw')]));
  const mid=l=>({x:l.reduce((a,u)=>a+u.x,0)/l.length,y:l.reduce((a,u)=>a+u.y,0)/l.length}),M=mid(foes),d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const lead=team?(B.hero&&B.hero.hp>0?B.hero:null):foes.find(u=>u.leader)||null;
  const gap=l=>Math.min(...l.map(u=>Math.min(...foes.map(o=>d2(o,u)))));
  const members=k=>N[k].flatMap(grpUnits).filter(u=>!u.rout),inf=members('inf'),arc=members('arc'),mag=members('mag'),cav=members('cav');
  const offset=(id,role)=>{const ids=N[role],i=ids.indexOf(id);return (i-(ids.length-1)/2)*Math.min(100,(fieldBot()-fieldTop()-80)/Math.max(1,ids.length))};
  const shots=[...arc,...mag];// (all their shooters: archers and mages, each group placed on its own below)
  const mine=S.mine,engaged=(e)=>mine.some(u=>d2(u,e)<18);// (an enemy already fighting one of ours)
  // (a lull: nobody has landed a blow in a while, everyone holding out of reach: every group of ours goes in; not an army already
  // on its way in, which walks up on its own plan)
  if(B.t-(B.lastHit||0)>FOE_CMD.lull&&post!=='attack'){(B.commit=B.commit||{})[ck]=true;for(const k of ['inf','arc','mag','cav'])for(const id of N[k]){const g=B.groups[id];if(grpUnits(id).length&&!abilityActive(g,'brace')){g.charge();g.setFlag('skirmish',false)}}return}// (a braced group stands: any order would end it)
  const clash=inf.length?gap(inf)<FOE_CMD.clash:true;
  /* the ranged duel: what each side's shooters put out (damage a second, those with shots left). Our fighters shot at (a share of
     them hit lately) by shooters who outdo ours (or we have none): standing there is losing, so they go for those shooters,
     attacking or defending alike (FOE_CMD.outgun) */
  const fire=l=>l.filter(u=>u.s.range&&!u.empty&&!u.rout).reduce((a,u)=>a+u.s.dmg/(u.s.cd||1),0),ourFire=fire(S.mine),theirFire=fire(foes);
  const melee=S.mine.filter(u=>!u.s.range&&!u.hero),hitNow=melee.filter(u=>B.t-(u.shotAt??-99)<CAPT.shotFor).length;
  const theirShots=foes.filter(u=>u.s.range&&!u.empty),goIn=!clash&&theirShots.length>0&&hitNow>=Math.max(1,melee.length*CAPT.shotShare)&&theirFire>ourFire*FOE_CMD.outgun;
  const shooterNear=from=>theirShots.reduce((a,u)=>d2(u,from)<d2(a,from)?u:a);
  // (an army with shooters never sits out of reach: none of them able to reach anyone for FOE_CMD.patience seconds, it commits to
  // going up (the army's march below), defending or not)
  B.idle=B.idle||{};if(shots.some(a=>a.s.range)&&post!=='attack'&&!shots.some(a=>a.s.range&&foes.some(e=>d2(a,e)<=a.s.range))){B.idle[ck]=(B.idle[ck]||0)+FOE_CMD.think;if(B.idle[ck]>=FOE_CMD.patience)(B.commit=B.commit||{})[ck]=true}else B.idle[ck]=0;
  // (how long our archers have had a foe in reach: the volleys before the infantry goes in)
  B.vol=B.vol||{};if(shots.some(a=>a.s.range&&!(B.groups[a.grp]&&B.groups[a.grp].hunt)&&foes.some(e=>d2(a,e)<=a.s.range)))B.vol[ck]=(B.vol[ck]||0)+FOE_CMD.think;// (hunting volleys not counted)
  // who threatens our archers: an enemy that fights hand to hand, close to them (the nearest to them first); never further than
  // their reach (a short one, a spider's spit): held still by a threat they cannot shoot, they would never close to shoot at all
  const A=shots.length?mid(shots):null,threats=A?foes.filter(e=>!e.s.range&&shots.some(a=>d2(a,e)<Math.min(FOE_CMD.threat,a.s.range||FOE_CMD.threat))).sort((a,b)=>d2(a,A)-d2(b,A)):[];
  /* the army's line, attacking with shooters: each group of shooters where its own reach covers the foe's front (the shortest
     reach among its men), the infantry a screen just in front of the nearest of them, all opposite the foe's middle; planned
     once and kept (B.plan) till the foe's front moves FOE_CMD.moved or FOE_CMD.replan seconds pass, so the army walks up as
     one, to one place, not a step at a time */
  // (its shooters' posture: aggressive, they lead; safe, behind the infantry: rangedMode)
  const X=AI_TACTICS,rm=rangedMode(ck,S,post,shots,engaged),leads=rm.mode==='aggressive';
  const ours=[...inf,...shots];let line=null;
  // (a melee foe at its shooters: the march is off (no plan), and it plans afresh once they are safe)
  if(threats.length&&B.plan)B.plan[ck]=null;
  if(post==='attack'&&shots.length&&ours.length&&!threats.length){const P0=(B.plan=B.plan||{})[ck],O=mid(ours),F=foes.reduce((a,u)=>d2(u,O)<d2(a,O)?u:a);
    if(!P0||d2(P0.F,F)>FOE_CMD.moved||B.t-P0.t>FOE_CMD.replan||!!P0.leads!==leads){const dir=Math.sign(F.x-O.x)||1,R=l=>Math.min(...l.filter(u=>u.s.range).map(u=>u.s.range))*FOE_CMD.reach,y=clamp(M.y,fieldTop(),fieldBot());
      const at={};if(arc.some(u=>u.s.range))at.arc=R(arc);if(mag.some(u=>u.s.range))at.mag=R(mag);const front=Math.min(...Object.values(at));
      // (its shooters leading (rangedMode): the infantry a screen AI_TACTICS.screenGap behind them, not in front)
      // (only ever forward: a foe nearer than their reach is in reach already; they stand where they are, behind their frontline,
      // and pulling back from danger is Kite's (kiteFrom), when nobody covers them)
      const fwd=(want,from)=>from&&(want-from.x)*dir<0?from.x:want,grpOf_={arc,mag};
      B.plan[ck]={F:{x:F.x,y:F.y},t:B.t,dir,y,leads,x:Object.fromEntries(Object.entries(at).map(([k,r])=>[k,clamp(fwd(F.x-dir*r,grpOf_[k].length?mid(grpOf_[k]):null),8,BW-8)])),inf:clamp(fwd(F.x-dir*(leads?front/FOE_CMD.reach+X.screenGap:front-FOE_CMD.screen),inf.length?mid(inf):null),8,BW-8)}}
    line=B.plan[ck]}
  const aggr=leads&&!!line;
  // (a charge coming: riders or a big beast running in (momentum mom), within far px of one of these men and not behind them)
  const chargeOn=(m,far,mom)=>foes.some(e=>(e.s.charge||e.s.big)&&!e.rout&&momentum(e)>=mom&&m.some(u=>d2(u,e)<far&&(mom<=0||sideOf(u,e)!=='rear')));
  const footCharge=m=>{const I=mid(m),e=foes.reduce((a,o)=>d2(o,I)<d2(a,I)?o:a);return !(e.s.charge||e.s.big)&&!chargeOn(m,CAPT.brace,.25)};
  // (unit-level morale, UNIT_AI: a group's own resolve (none: steady); a foe wavering is worth more to riders and shooters;
  // recovering: a group stepped back to get its breath, g.recover {at, x, y}, or {done} once ended by the time cap)
  const rOf=id=>!B.noMorale&&B.groups[id]&&B.groups[id].resolve||null,weak=e=>{const r=!B.noMorale&&resolveOf(e);return !!r&&!r.routed&&r.mor<MORALE.waver};
  const recovering=id=>{const r=B.groups[id].recover;return !!r&&r.done==null},firm=id=>{const r=rOf(id);return grpUnits(id).some(u=>!u.rout)&&!recovering(id)&&(!r||!r.routed&&r.mor>=UNIT_AI.backAt)};
  // infantry
  for(const id of N.inf){const inf=grpUnits(id).filter(u=>!u.rout);if(!inf.length)continue;const g=B.groups[id],busy=inf.some(u=>foes.some(e=>d2(e,u)<20)),r=rOf(id);
    // (Brace: a charge coming at its front, a spear group braces; braced, it is given no order (any would end it) while one is near)
    if(abilityActive(g,'brace')){if(chargeOn(inf,X.braceKeep,0))continue}
    else if(chargeOn(inf,X.braceAt,X.braceMom)&&!abilityWhyNot(g,'brace')){g.useAbility('brace');continue}
    // (recovering: it stands where it stepped back to, till its resolve is back to backAt or maxRecover s pass; then its orders as ever)
    if(recovering(id)){if(!r||r.mor>=UNIT_AI.backAt)delete g.recover;else if(B.t-g.recover.at>=UNIT_AI.maxRecover)g.recover={done:B.t};else{g.standAt(g.recover.x,g.recover.y);continue}}
    // (wavering, a steady group of ours beside it: it steps back from the foe; the nearest steady one not in a fight of its own goes
    // at the foe nearest the gap, once, and keeps at him while it recovers (plug); not again within maxRecover s of a time-capped one)
    // (only one not in a fight hand to hand: an engaged one stepping back loses men and breaks as soon; it fights on, Rally its help)
    else if(r&&!r.routed&&r.mor<UNIT_AI.pullAt&&!busy&&(!g.recover||B.t-g.recover.done>=UNIT_AI.maxRecover)&&N.inf.some(o=>o!==id&&firm(o))){
      const I=mid(inf),x=clamp(I.x-(Math.sign(M.x-I.x)||1)*UNIT_AI.pullDist,8,BW-8),y=clamp(I.y,fieldTop(),fieldBot());g.recover={at:B.t,x,y};g.plug=null;g.standAt(x,y);
      const free=N.inf.filter(o=>o!==id&&firm(o)&&!abilityActive(B.groups[o],'brace')&&!grpUnits(o).some(u=>!u.rout&&foes.some(e=>d2(e,u)<20))).sort((a,b)=>d2(B.groups[a].centre(),I)-d2(B.groups[b].centre(),I));
      if(free.length){const q=B.groups[free[0]];q.attack(foes.reduce((a,e)=>d2(e,I)<d2(a,I)?e:a));q.plug=id}
      continue}
    if(g.plug){if(recovering(g.plug)&&g.hasTarget&&g.targetMembers().some(u=>!u.rout))continue;g.plug=null}
    // (a threat to our shooters worth the infantry: strong enough that they cannot see to it themselves, or with nowhere to back
    // to; a lone man is theirs to shoot, kite or fight. Their shooters bare (none of theirs who fight hand to hand near them, and
    // nearer us than their fighters): the infantry goes for them; else at the nearest of theirs)
    const pow=l=>l.reduce((a,u)=>a+u.hp*(u.s.dmg||1),0);
    const I0=mid(inf),theirMelee=foes.filter(e=>!e.s.range&&!e.rout),bare=foes.filter(e=>e.s.range&&!e.rout&&!theirMelee.some(f=>d2(f,e)<CAPT.bare)),nearMelee=theirMelee.length?Math.min(...theirMelee.map(e=>d2(e,I0))):1e9;
    const prey=bare.length?bare.reduce((a,e)=>d2(e,I0)<d2(a,I0)?e:a):null,preyOk=!!prey&&d2(prey,I0)<CAPT.prey;
    // (with an opening, a threat to our shooters is theirs to see to (shoot, kite, fight) unless they are cornered; without one, worth
    // the infantry only if strong enough that they cannot)
    const realThreat=threats.length&&(shots.some(u=>B.groups[u.grp]&&B.groups[u.grp].cornered)||!preyOk&&pow(threats)>pow(shots)*CAPT.threatShare);
    if(realThreat&&!busy)g.attack(threats[0]);
    else if(goIn&&!busy)g.attack(shooterNear(I0));// (losing the ranged duel: at their shooters)
    else if(preyOk&&!busy&&(post==='attack'||clash))g.attack(prey);// (their shooters bare: at them)
    // (attacking and fresh, it charges from further off (AI_TACTICS.footFar), to come in at a full run; not while it stands for the
    // volleys, nor at riders or a beast (the nearest foe), nor with a charge coming at it (a shield wall's moment: captainFinish))
    else if(clash||post==='attack'&&!threats.length&&inf.every(u=>u.s.range)||post==='attack'&&!(line&&(B.vol[ck]||0)<FOE_CMD.volley)&&grpSta(inf)>=X.fresh&&gap(inf)<X.footFar&&footCharge(inf))g.charge();
    // (attacking with archers: the infantry stands a little in front of them while they shoot (FOE_CMD.volley seconds of it), then
    // goes in; while they lead (rangedMode), a little behind them: the army's line)
    else if(line&&(B.vol[ck]||0)<FOE_CMD.volley)g.standAt(line.inf,line.y+offset(id,'inf'));
    else if(post==='attack')g.advance();
    else{// defend: a line between the archers and the enemy
      const I=A||mid(inf),dir=Math.sign(M.x-I.x)||1;g.standAt(I.x+dir*(A?40:0),(A?A.y:I.y)+offset(id,'inf'))}}
  // (Rally: a group of ours wavering or breaking, its officers steady it; after the infantry's orders, so a wavering group still pulls back)
  for(const k of ['inf','arc','mag'])for(const id of N[k]){const r=rOf(id);if(r&&!r.routed&&r.mor<MORALE.waver&&!abilityWhyNot(B.groups[id],'rally'))B.groups[id].useAbility('rally')}
  // archers, and mages apart (a step behind the infantry, their reach being short)
  for(const k of ['arc','mag'])for(const id of N[k]){const grp=grpUnits(id).filter(u=>!u.rout);if(!grp.length)continue;const behind=k==='arc'?FOE_CMD.behind:FOE_CMD.behind*.5,g=B.groups[id],armed=grp.filter(u=>u.s.range);
    if(!armed.length){g.charge();g.setFlag('skirmish',false);g.screenBack=null;g.pushRun=false}// (out of ammo: they go in)
    else{      // (Kite: a foe coming at them uncovered: they skirmish (and no focus: keeping away comes first); melee mode on, its call)
      const open=kiteFrom(armed,foes,S.mine.filter(u=>!u.s.range));g.setFlag('skirmish',!!open);const C=mid(armed),near=a=>foes.reduce((p,e)=>d2(e,a)<d2(p,a)?e:p);g.setFlag('melee',armed.some(a=>foes.some(e=>!e.s.range&&!e.rout&&d2(a,e)<CAPT.toBlades))&&(!open||g.cornered||foes.some(e=>!e.s.range&&e.s.spd>g.pace*SKIRM.outpaced&&d2(e,C)<CAPT.toBlades*2)));/* (melee mode: a foe on them they cannot kite from) */
      // (attacking: on the army's line, where their own reach covers the foe; defending: behind their infantry, waiting for you)
      // (attacking: their place on the army's line; on the way, never ahead of their infantry: they keep behind it till it is there)
      // (threatened, or with no infantry left to stand behind: they stop where they are (held there till it passes) and shoot; the
      // skirmishers among them step back from whoever comes at them)
      // the foe worth shooting: fighting our men, then their shooters, then a character (their leader, your hero) (score)
      // (the foe worth it, in order: one who fights hand to hand coming at them (the nearer the more), one they can finish (a shot
      // from falling, or badly hurt), one fighting our men, their shooters, a character; and the nearer the better)
      // (fall back: a group that led the army (pushed: rangedMode), its captain safe again and it still ahead of its infantry: back
      // behind it at a run (screenBack), no focus or hunt on the way; Kite first)
      g.pushRun=false;const I0=inf.length?mid(inf):null,fd=I0?Math.sign(M.x-I0.x)||1:1;
      if(!I0||aggr||(C.x-I0.x)*fd<=-behind*.6){g.screenBack=null;if(!aggr)g.pushed=false}
      else if(g.pushed&&((C.x-I0.x)*fd>0||g.screenBack))g.screenBack={x:I0.x-fd*behind,y:I0.y+offset(id,k)};
      const coming=e=>!e.s.range&&!e.rout&&d2(e,C)<CAPT.danger?5*(1-d2(e,C)/CAPT.danger):0;
      const inR=foes.filter(e=>armed.some(a=>d2(e,a)<=a.s.range)),score=e=>coming(e)+(blowsToFell(armed[0],e)<=1?4:0)+2*(1-e.hp/e.max)+(engaged(e)?3:0)+(e.s.range?1.5:0)+(e===lead||e.hero||e.leader||e.comp?1:0)+(weak(e)?UNIT_AI.preyShot:0)-d2(e,C)/Math.max(...armed.map(a=>a.s.range));// (nearness: by their reach)
      const best=inR.length?inR.reduce((a,e)=>score(e)>score(a)?e:a):null,worth=best&&score(best)>=.5?best:null;
      // focus fire: one worth it that half of them can reach already, and nobody at them: the group is set on him, as your
      // right-click sets yours (those out of reach close to their own range of him); dropped when he falls, or danger comes
      // (Hunt: out of anyone's reach, the armies apart, ammunition left: off to a safe spot of their own to shoot from; home at a run
      // the moment it is not safe, their mark is gone or out of reach, the ammunition runs low, or the armies close; Kite first)
      const R0=Math.min(...armed.map(a=>a.s.range)),meleeF=foes.filter(e=>!e.s.range),meleeM=S.mine.filter(u=>!u.s.range),closing=meleeM.length&&meleeF.length&&Math.min(...meleeM.map(u=>Math.min(...meleeF.map(e=>d2(u,e)))))<HUNT.clash;
      const ammoOk=armed.every(u=>u.ammo==null||!isFinite(quiverOf(u.s))||u.ammo>quiverOf(u.s)*HUNT.ammo),reachNone=!armed.some(a=>foes.some(e=>d2(a,e)<=a.s.range));
      // (a hunt that has someone in reach has done its work: they stand where they are and shoot, no walking on, no run home)
      if(g.hunt&&!reachNone){g.hunt=null;g.stand={x:C.x,y:C.y}}
      if(g.hunt){const H=g.hunt;if(open||closing||g.backing||g.screenBack||!ammoOk||H.t.hp<=0||H.t.rout||!huntSafe({x:H.x,y:H.y},foes,engaged,R0)||!huntSafe(C,foes,engaged,R0)){g.hunt=null;g.huntBack=B.t||.001}
        else if(d2(H.t,{x:H.tx,y:H.ty})>30){const h=huntSpot(armed,[H.t],()=>false);if(h&&huntSafe({x:h.x,y:h.y},foes,engaged,R0))Object.assign(H,{x:h.x,y:h.y,tx:H.t.x,ty:H.t.y});else{g.hunt=null;g.huntBack=B.t||.001}}}// (huntBack: when it turned home, never 0)
      else if(!open&&!closing&&!threats.length&&!g.backing&&!g.screenBack&&reachNone&&ammoOk)g.hunt=huntSpot(armed,foes,engaged);
      if(g.huntBack&&B.t-g.huntBack>HUNT.home&&d2(C,{x:g.ax,y:g.ay})<30)g.huntBack=0;// (home: at a run, HUNT.home s at least, till back in its place)
      const focus=!g.hunt&&!g.huntBack&&worth&&!open&&!threats.length&&!g.backing&&!g.screenBack&&armed.filter(a=>d2(a,worth)<=a.s.range).length*2>=armed.length;
      if(g.hunt){if(g.order==='charge')g.toHold();g.stand=null;g.standAt(g.hunt.x,g.hunt.y);// (leading: out to it at a run, ahead of their infantry)
        if(aggr){if(I0&&(g.hunt.x-I0.x)*fd>0)g.pushed=true;g.pushRun=d2(C,g.hunt)>X.pushRun&&grpSta(armed)>=FATIGUE.tired}}
      else if(focus){if(!g.hasTarget||(worth.grp?g.targetGroupId!==worth.grp:g.targetUnitId!==worth.id))g.attack(worth)}
      else{if(g.order==='charge')g.toHold();
      // (stop to shoot: on its way, a foe in its shooters' reach: it stops where it is, they turn to him and shoot; no walking on
      // while they could be shooting)
      const halt=!g.hunt&&armed.some(u=>relocating(u,g)||g.going)&&armed.some(a=>foes.some(e=>d2(a,e)<=a.s.range*CAPT.haltAt));
      if(g.backing){g.stand={x:g.ax,y:g.ay}}// (backing off from a foe: the group's own (battlecontrol.js step); left to it)
      else if(g.screenBack){g.stand=null;g.standAt(g.screenBack.x,g.screenBack.y)}
      // (someone in their reach: they stay where they are, turn to him and shoot; only Kite moves them then)
      else if(threats.length||halt||!reachNone||!inf.length&&!line){if(!g.stand)g.stand={x:C.x,y:C.y};g.standAt(g.stand.x,g.stand.y)}
      else{g.stand=null;
      if(line&&line.x[k]!=null){let x=line.x[k];if((x-C.x)*line.dir<0)x=C.x;// (forward only, from where they are now)
        // (there, and still nobody in anyone's reach (the line's height or their ranks put them a little out: a short reach, a
        // spider's spit): the line steps on by what they lack, and stays that much nearer)
        if(reachNone&&Math.abs(C.x-x)<8){const short=Math.min(...armed.map(a=>Math.min(...foes.map(e=>d2(a,e)))-a.s.range));if(short>0){x+=line.dir*(short+4);line.x[k]=x}}
        // (leading (rangedMode aggressive): straight to it, ahead of their infantry, at a run from far (pushRun); else never ahead of it)
        if(aggr){if(I0&&(x-I0.x)*line.dir>0)g.pushed=true;g.pushRun=Math.abs(x-C.x)>X.pushRun&&grpSta(armed)>=FATIGUE.tired}
        else if(inf.length&&N.inf.some(id=>B.groups[id].order==='hold')){const I=mid(inf);if(Math.abs(I.x-line.inf)>40){const cap=I.x-line.dir*behind;x=line.dir>0?Math.min(x,cap):Math.max(x,cap)}}g.standAt(x,line.y+offset(id,k))}
      else if(inf.length){const I=mid(inf),dir=Math.sign(I.x-M.x)||1;g.standAt(I.x+dir*behind,I.y+offset(id,k))}}
      // (without a focus order, actors.js shooterTarget selects the nearest eligible foe by range and arc)
      }
      // (Fire arrows: their mark (their focus, else the nearest in reach) armoured or weak to fire: fireWorth)
      const mk=focus?worth:g.tgt||(inR.length?inR.reduce((p,e)=>d2(e,C)<d2(p,C)?e:p):null);if(mk&&fireWorth(armed[0],mk)&&!abilityWhyNot(g,'fire'))g.useAbility('fire')}}
  // cavalry
  // (fresh riders (AI_TACTICS.fresh) charge from further off (cavStart: not only once on top of the foe) and pull back further to
  // charge again (regroupFar); tired ones stand off after a charge till rested (rested, restMax), and walk (runFor, captainFinish))
  for(const id of N.cav){const cav=grpUnits(id).filter(u=>!u.rout);if(!cav.length)continue;const g=B.groups[id],C=mid(cav),was=g.phase;g.t=(g.t||0)+FOE_CMD.think;g.phase=g.phase||'flank';
    const st=grpSta(cav),fresh=st>=X.fresh,back=fresh?X.regroupFar:FOE_CMD.regroup;
    const pick=()=>{const sc=e=>(e.s.range?3:0)+(engaged(e)?2:0)+(foes.some(o=>o!==e&&d2(o,e)<30)?0:1)+(unitClass(e.s)==='spear'?-3:0)+(e===lead?.5:0)+(weak(e)?UNIT_AI.prey:0)-d2(e,C)/300;return foes.reduce((a,e)=>sc(e)>sc(a)?e:a)};
    // (shaken (under UNIT_AI.chargeAt): no new charge; they stand off as after one (regroup) till their resolve is back, or cavRecover s
    // (losses lower the ceiling it recovers to: worn riders would stand off for ever); one under way goes on)
    const r=rOf(id),into=()=>{if(!r||r.mor>=UNIT_AI.chargeAt||g.phase==='charge'||g.phase==='regroup'&&g.t>=UNIT_AI.cavRecover)return true;if(g.phase!=='regroup'){const dir=Math.sign(C.x-M.x)||1;g.phase='regroup';g.t=0;g.standAt(C.x+dir*back,C.y)}return false};
    // (on a charge, any (a rescue of its shooters too): half of them in the melee for recharge s, they pull back to charge again;
    // the count kept only while charging, so one left from before never pulls them back at once)
    if(g.phase==='charge'){g.inMelee=cav.filter(u=>foes.some(e=>d2(e,u)<16)).length*2>=cav.length?(g.inMelee||0)+FOE_CMD.think:0;
      if(g.inMelee>=FOE_CMD.recharge){const dir=Math.sign(C.x-M.x)||1;g.phase='regroup';g.t=0;g.standAt(C.x+dir*back,C.y)}}
    if(g.phase!=='charge'&&g.inMelee)g.inMelee=0;
    if(threats.length&&g.phase!=='regroup'&&into()){g.phase='charge';g.attack(threats[0])}
    else if(goIn&&g.phase!=='regroup'&&into()){g.phase='charge';g.t=0;g.attack(!g.tgt||g.tgt.hp<=0||!g.tgt.s.range?shooterNear(C):g.tgt)}// (losing the ranged duel: ride down their shooters)
    // (its flank chosen once, on setting out (flankSide): the side the riders are on, level with the foe the open side; kept till the phase changes)
    else if(g.phase==='flank'){if(g.flankSide==null)g.flankSide=Math.abs(C.y-M.y)>20?Math.sign(C.y-M.y):M.y<BH/2?1:-1;g.standAt(M.x,M.y+g.flankSide*FOE_CMD.flankY);
      if((d2(C,{x:g.ax,y:g.ay})<FOE_CMD.flankAt||g.t>FOE_CMD.flankMax||gap(cav)<(fresh?X.cavStart:30))&&into()){g.phase='charge';g.t=0;g.attack(pick())}}
    else if(g.phase==='charge')g.attack(!g.tgt||g.tgt.hp<=0||g.tgt.rout?pick():g.tgt);
    else if(g.phase==='regroup'){g.rest=g.t<X.restMax&&st<X.rested&&(g.rest||st<FATIGUE.tired);if(!g.rest&&(d2(C,{x:g.ax,y:g.ay})<25||g.t>4)&&into()){g.phase='charge';g.t=0;g.attack(pick())}}
    if(g.phase!=='flank'&&g.flankSide!=null)delete g.flankSide;// (off the flank: a fresh choice next time)
    // (Spur: a fresh charge (spurWin s since it was ordered) on a mark spur[0]-spur[1] px off, with breath for it: full momentum at once)
    if(g.phase==='charge'&&was!=='charge')g.chargeAt=B.t;
    if(g.phase==='charge'&&B.t-(g.chargeAt??-99)<=X.spurWin&&st>=X.spurSta){const p=g.targetPoint(),d=p?d2(p,C):1e9;if(d>=X.spur[0]&&d<=X.spur[1]&&!abilityWhyNot(g,'spur'))g.useAbility('spur')}}
  // your hero, under the AI
  for(const id of N.hero){const g=B.groups[id];if(!grpUnits(id).some(u=>!u.rout))continue;
    if(clash||!inf.length){if(g.order!=='charge')g.charge()}else{const I=mid(inf),dir=Math.sign(I.x-M.x)||1;g.standAt(I.x+dir*FOE_CMD.behind*.5,I.y)}}
}
