'use strict';
/* ---------- stamina for every soldier, your hero too (theirs is their own SP, combat.js, on the same scale): a charge spends a lump of it (more for a longer run),
   running wears it down, every blow costs a little; standing still out of the fight brings it back; walking, or fighting where it stands, neither spends nor restores it.
   Tired (under FATIGUE.tired) a soldier moves and hits less hard and builds a charge half as fast; spent (under FATIGUE.spent) it
   is slow, weak, and cannot build a charge at all. ---------- */
// max; run: per second running (twice that charging); charge: the lump at the impact of a full charge; blow: each blow; rest: per
// second standing; tired, spent: the thresholds
// runMin: under this a soldier cannot run at all, only walk
const FATIGUE={max:100,run:2.5,charge:18,blow:1.2,rest:1.2,tired:40,spent:15,runMin:1};
// your hero's: their SP, as a share of FATIGUE.max. It comes back as a soldier's does (standing, out of the fight), faster with the
// talents that quicken it (spRegen). A champion's (a lord, a chieftain, a companion: charmind.js champ) is their soldier's stamina
const heroSta=u=>u.hero&&B&&u===B.hero&&!MANUAL_HERO;
const staOf=u=>heroSta(u)?heroState().sp/Math.max(1,maxSP())*FATIGUE.max:u.sta==null?FATIGUE.max:u.sta;
// spend n (on FATIGUE's scale) of a soldier's stamina, or of your hero's SP
function staSpend(u,n){if(heroSta(u)){const X=heroState();X.sp=Math.max(0,X.sp-n*maxSP()/FATIGUE.max);X.spT=0}else if(u.sta!=null)u.sta=Math.max(0,u.sta-n/(u.vig||1))}
// what tiredness does: speed, damage, and how fast a charge builds
function tiredMul(u){const s=staOf(u);return s<FATIGUE.spent?{spd:.7,dmg:.75,run:0}:s<FATIGUE.tired?{spd:.85,dmg:.9,run:.5}:{spd:1,dmg:1,run:1}}
/* your band's stamina carried into a battle and back (doc/SUPPLY_DESIGN.md §2; world/supply.js): your troops, companions and
   hero start at it (on FATIGUE's scale, never under SUPPLY.battleMin; at full, as ever), never in a tournament or the lab. When the
   field is done (setup.js fieldDone, once the battle is over) the band's stamina is the average your side that is still standing
   ended with (a tournament: your hero's, as she comes out of it: battle/resolution.js). FIELD_BAND: the battle it went into */
let FIELD_BAND=null;
const bandSoldier=u=>u.team===0&&!u.lord&&!u.leader;
const bandFieldShare=()=>B&&B.opts&&!B.opts.tournament&&!B.opts.sandbox?Math.max(SUPPLY.battleMin,P.bsta)/100:null;
// (vigor, unitcard.js: a hardier unit tires slower and gets its wind back faster)
function fatigueInit(units){const k=bandFieldShare();FIELD_BAND=B?{b:B}:null;
  for(const u of units)if(!u.hero){u.sta=k!=null&&bandSoldier(u)?FATIGUE.max*k:FATIGUE.max;u.vig=vigorOf(u.s)/100}
  if(k!=null&&P.bsta<SUPPLY.battleMin)heroState().sp=maxSP()*k}
function fieldStaminaBack(){
  const F=FIELD_BAND;FIELD_BAND=null;if(!F||!F.b.over)return;const b=F.b;
  if(b.opts.tournament||b.opts.sandbox)return;
  const st=u=>u.hero?(b.hx?b.hx.sp/Math.max(1,maxSP())*FATIGUE.max:P.bsta):u.sta,m=b.units.filter(u=>bandSoldier(u)&&(u.hp>0||u.left)&&st(u)!=null);
  if(m.length)P.bsta=clamp(m.reduce((a,u)=>a+st(u),0)/m.length/FATIGUE.max*100,0,100);
  if(b.units.some(u=>bandSoldier(u)&&u.hp<=0&&!u.left))BAND.hurt=[{why:'battle wounds',day:G.day},...BAND.hurt.filter(h=>h.why!=='battle wounds')].slice(0,SUPPLY.hurt)}
// each moment: running spends, charging spends twice that; walking, or fighting in place, neither spends nor restores; standing restores
function fatigueStep(u,dt,moved,walking,charging,fighting){
  if(heroSta(u)){if(moved&&!walking)staSpend(u,FATIGUE.run*(charging?2:1)*dt*groundSta(u));else if(!moved&&!fighting){const X=heroState();X.sp=Math.min(maxSP(),X.sp+FATIGUE.rest*maxSP()/FATIGUE.max*(1+tm('spRegen'))*dt)}return}
  if(u.hero||u.sta==null)return;
  const vg=u.vig||1;if(moved){if(!walking)u.sta-=FATIGUE.run*(charging?2:1)*dt/vg*groundSta(u);else{const w=groundWade(u);if(w)u.sta-=FATIGUE.run*w*dt/vg}}/* (marsh and uphill tire him faster; wading deep water tires him walking too: terrain.js) */else if(!fighting)u.sta+=FATIGUE.rest*dt*vg;
  u.sta=clamp(u.sta,0,FATIGUE.max);
}
// a charge's impact: a lump by how far it ran (m, 0-1); a blow: a little
function fatigueCharge(u,m){staSpend(u,FATIGUE.charge*m)}
function fatigueBlow(u){if(!u.hero)staSpend(u,FATIGUE.blow)}
// a hero's or a champion's blow in their combo: a soldier's blow, the finisher heavier (as STAM.swing weighs them)
const blowSta=(step,CB)=>FATIGUE.blow*STAM.swing[step]/STAM.swing[0]*(CB.sp||1);
// a group's stamina (the unit cards, the details, the Tired badge): its soldiers' average (your hero's SP), 0-1
function grpStamina(m){const l=m.filter(u=>u.sta!=null||heroSta(u));return l.length?l.reduce((a,u)=>a+staOf(u),0)/l.length/FATIGUE.max:null}
