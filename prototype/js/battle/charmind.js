'use strict';
/* ---------- characters: one mind for your hero, the lords, the chieftains and the companions ---------- */

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
    if(S.roll>0){S.roll-=dt;u.x=clamp(u.x+S.rx*170*dt,8,BW-8);u.y=clamp(u.y+S.ry*170*dt,fieldTop(),fieldBot());ownStep(u);u.face=S.rx>=0?1:-1;u.spdNow=170;return true}}
  if(withdrawing(u)||u.stun>0)return false;// (withdrawing: no skills, just away: morale.js)
  // (a skill or a move just used on his commander's call or your Auto skills: commandCharacters)
  if(u.castNow){u.castNow=false;return true}
  return false;
}
// a blow at t: your hero's (the combo, the bow drawn, a staff's cast: combat.js) or a champion's
function charStrike(u,t){
  {const m=momentum(u);u.run=0;if(m>=(u.s.charge?CHARGE.min:CHARGE.foot_min))fatigueCharge(u,m)}// (a charge spends their stamina, as a soldier's: fatigue.js)
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
   its own left to cover it, it goes in anyway; any order of yours to its group (a move, an attack, Hold, the pace, a formation
   or a flag: orderSeq, commands.js playerOrder) ends it at once, but not a unit ability. Your hero under your own hands (MANUAL_HERO), or yours with Auto skills off, never does */
// near, dist: how far it falls back (px); cover: troops of its own this near to fall back behind; min: s before it looks again;
// crowd, trap: a target point that is no trap; look: an AI character's own pick among foes this near; max: the longest it stays
// out; heal: it heals on the way under this share of its health
// keep: s after going in again at its own pick that a duel does not draw it off him
const CHAR_FALL={near:60,dist:100,cover:250,min:1,crowd:2,trap:40,look:300,max:12,heal:.6,keep:2};
// a group's orders as a fall-back remembers them: any order of yours (commands.js bumps orderSeq), a move, a target
const ordKey=g=>g?[g.mvId,g.targetGroupId,g.targetUnitId,g.order,g.orderSeq|0].join():'';
const fallMates=u=>B.units.filter(o=>o.team===u.team&&o.hp>0&&!o.rout&&!o.left&&!isChar(o));
const liveFoes=u=>B.units.filter(e=>e.team!==u.team&&e.hp>0&&!e.rout&&!e.left&&seenBy(u.team,e));// (those its side can see: terrain.js sight)
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
  const d=Math.hypot(F.x-u.x,F.y-u.y),w=d>4&&B.terrain?steerDir(u,F.x,F.y):null,dx=w?w[0]*d:F.x-u.x,dy=w?w[1]*d:F.y-u.y;u.spdNow=0;u.run=0;let moved=false;// (round rock, cliffs and impassable water: terrain.js)
  if(d>4){const sp=Math.min(d,u.s.spd*tiredMul(u).spd*(u.slow>0?.5:1)*groundMul(u,dx/d,dy/d)*dt);u.x+=dx/d*sp;u.y+=dy/d*sp;ownStep(u);u.face=dx>=0?1:-1;u.dir=Math.atan2(dy,dx);u.spdNow=sp/Math.max(dt,1e-6);moved=true}
  if(block){u.tgt=block;if(u.cd<=0)charStrike(u,block)}
  fatigueStep(u,dt,moved,false,false,!!block)}
// the point it would go in at: its group's ordered target (yours: your attack order), else (an AI character) the foe near with the
// fewest of theirs round him and the nearer the better ({x,y,e})
function fallMark(u,g){
  if(g&&g.hasTarget){const p=sightGoal(g,u.team)||g.targetPoint();return p&&{x:p.x,y:p.y,e:null}}
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
    if(ai&&!sent&&!(g&&g.hasTarget)&&!(B.t-(S.backIn??-99)<CHAR_FALL.keep)){let best=null,bd=CHAR_AI.duel;for(const e of B.units)if(e.team!==u.team&&e.hp>0&&isChar(e)&&seenBy(u.team,e)){const d=Math.hypot(e.x-u.x,e.y-u.y);if(d<bd){bd=d;best=e}}if(best){u.tgt=best;u.rt=.5}}
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
