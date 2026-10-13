'use strict';
/* ---------- fighting on their own (RTS command): your hero is a real fighter, not a troop. They go where their group is sent
   (aiUnit), strike with the combo (Slash, Sweep, Finisher: a swing inside the window carries the chain on), draw the bow and
   loose it near full, cast with a staff, and use the skills in their slots when the moment is right. Lords, chieftains and
   your companions fight the same way (commander.js: champions). ---------- */
// a skill decided 4 times a second; stamina kept for swings; the bow loosed at 85% drawn; a breath after each finisher, and a
// wait while short of stamina for the next blow (no flurry of failed swings)
const HERO_AI={think:.25,keepSp:10,release:.85,breath:[.9,1.4],pause:.12,wait:.35};
// a moment of your hero: their timers, a roll or leap or dash in progress, a skill if one fits, else move and strike as their group
function heroAuto(dt){
  B.blocking=false;const h=B.hero;if(!h||h.hp<=0)return;const X=heroState();
  h.cd-=dt;h.swing=Math.max(0,(h.swing||0)-dt);h.spdNow=0;
  if(heroActions(dt))return;
  if(withdrawing(h)){aiUnit(h,dt,heroStrike);return}// (withdrawing: no skills, just away: morale.js)
  if(B.draw){const t=h.tgt&&h.tgt.hp>0?h.tgt:nearest(h);if(t)aimAt(h,t);if(B.draw.t>=DRAW_TIME*HERO_AI.release)drawRelease();return}// drawing: stand and loose
  if((B.heroThink=(B.heroThink||0)-dt)<=0){B.heroThink=HERO_AI.think;if(heroSkill(h))return}
  aiUnit(h,dt,heroStrike);
}
// aim at a point (skills land there, not at the cursor: combat.js aimPoint, cursorDist, Leap Slam)
function aimAt(h,p){B.aim=Math.atan2(p.y-h.y,p.x-h.x);B.aiAim={x:p.x,y:p.y}}
// a blow at t: the combo (melee), the bow drawn (loosed in heroAuto), or a staff's cast
function heroStrike(h,t){
  aimAt(h,t);
  if(isBow()){if(!B.draw){G.bowRange=clamp(Math.hypot(t.x-h.x,t.y-h.y),BOW_RANGE[0],BOW_RANGE[1]);drawStart()}return}
  if(heroKind()==='melee'){const X=heroState(),CB=heroCombo(),step=X.win>0?(X.step+1)%CB.length:0;
    if(X.sp<Math.round(STAM.swing[step]*(CB.sp||1))){h.cd=HERO_AI.wait;return}// short of breath: wait, do not flail
    const at=h.atkAt;swing();if(h.atkAt!==at)h.cd+=HERO_AI.pause;if(h.atkAt!==at&&X.step===CB.length-1)h.cd+=HERO_AI.breath[0]+Math.random()*(HERO_AI.breath[1]-HERO_AI.breath[0]);// the finisher: a breath
    return}
  swing();
}
// the skill that fits the moment, if one is slotted, learned, cooled down and paid for; true if cast
function heroSkill(h){
  const X=heroState(),foes=B.units.filter(e=>e.team===1&&e.hp>0),mine=B.units.filter(u=>u.team===0&&u.hp>0&&!u.hero);if(!foes.length)return false;
  const near=(x,y,r,list)=>list.filter(e=>Math.hypot(e.x-x,e.y-y)-(e.s.big?12:0)<=r).length,R=id=>abil(id).r;
  const ready=id=>(P.slots||[]).includes(id)&&knows(id)&&!(X.cds[id]>0)&&!(HSKILLS[id].needs==='bow'&&(!isBow()||goodN('arrows')<4))&&(A=>X.sp>=A.sp+(A.sp?HERO_AI.keepSp:0)&&X.mp>=A.mp)(abil(id));
  const close=foes.reduce((a,e)=>Math.hypot(e.x-h.x,e.y-h.y)<Math.hypot(a.x-h.x,a.y-h.y)?e:a),d=Math.hypot(close.x-h.x,close.y-h.y);
  // the thickest knot of enemies within r of one of them
  const knot=r=>{let best=null,bn=0;for(const e of foes){const n=near(e.x,e.y,r,foes);if(n>bn){bn=n;best=e}}return best&&{x:best.x,y:best.y,n:bn}};
  const cast=(id,at)=>{if(at)aimAt(h,at);castSkill(id);return X.cds[id]>0};
  if(ready('heal')&&(h.hp<h.max*.45||mine.filter(u=>u.hp<u.max*.5&&Math.hypot(u.x-h.x,u.y-h.y)<90*R('heal')).length>=3))return cast('heal');
  if(ready('whirl')&&near(h.x,h.y,(h.s.reach+14)*R('whirl'),foes)>=2)return cast('whirl');
  if(ready('quake')&&near(h.x,h.y,50*R('quake'),foes)>=3)return cast('quake');
  if(ready('nova')&&near(h.x,h.y,60*R('nova'),foes)>=3)return cast('nova');
  if(ready('leap')){const k=knot(34*R('leap')),dd=k&&Math.hypot(k.x-h.x,k.y-h.y);if(k&&k.n>=2&&dd>40&&dd<110)return cast('leap',k)}
  if(ready('dash')&&!isBow()&&d>30&&d<85)return cast('dash',close);
  if(ready('fireball')){const k=knot(32*R('fireball'));if(k&&(k.n>=2||d>60)&&Math.hypot(k.x-h.x,k.y-h.y)<140)return cast('fireball',k)}
  if(ready('volley')){const k=knot(28*R('volley'));if(k&&k.n>=3&&Math.hypot(k.x-h.x,k.y-h.y)<200)return cast('volley',k)}
  if(ready('cry')&&near(h.x,h.y,90*R('cry'),mine)>=4&&d<120)return cast('cry');
  if(ready('banner')&&!B.banner&&near(h.x,h.y,100*R('banner'),mine)>=5&&d<150)return cast('banner');
  return false;
}
