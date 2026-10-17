'use strict';
/* ---------- Group resolve, individual facing/charges/escape. BattleResolve owns one morale/confidence/break decision
   per formation. Soldier morale fields are output mirrors for rendering/settlement, never inputs to group decisions.
   Heroes, companions, leaders and currently unbreakable creatures retain their existing immunity. ---------- */
// side: blow multipliers from the flank (60-120° off its front) and the rear (beyond 120°); arrows get half that
const FLANK={flank:1.25,rear:1.5,arrow:.5};
// mor: start (yours from the band's morale, theirs by level); hurt: per share of health lost; death: an ally falling close (near);
// side: anyone on its side falling; flank/rear: extra shock; crowd: neighbouring rout-shock radius;
// lead: a leader falling; cascade: a neighbour breaking; back: recovery per
// second with no enemy within quiet; rally: it rallies at; waver: wavering under
const MORALE={hurt:25,death:6,near:60,side:1,flank:3,rear:6,crowd:50,lead:20,cascade:8,quiet:60,back:2,
  rallyBack:6,rally:40,waver:30,cry:15,charge:15,inspire:90,edge:10};
// Local superiority offers bounded confidence, never immunity. Fresh panic/leader loss temporarily overrides it.
const CONFIDENCE={radius:220,ratio:1.25,full:3,max:12,recover:1.5,resist:.3,cascadeCooldown:1,panic:2,leaderPause:4};
const AWARENESS={near:100,close:45,outmatched:.65,overwhelmed:2.25,every:.2};
const COHESION={radius:36,slot:8,allies:4,resist:.3,cascade:.4};
const LOSS_MEMORY={life:4};
// Morale perception only: 360-degree local awareness, attenuated by distance and existing obstacle circles.
function moraleVisible(u,o){
  const dx=o.x-u.x,dy=o.y-u.y,dd=dx*dx+dy*dy;if(dd<.01)return true;
  for(const b of B.obs||[]){if(b.kind!=='tree'&&b.kind!=='rock')continue;const at=((b.x-u.x)*dx+(b.y-u.y)*dy)/dd;if(at<=0||at>=1)continue;
    if(Math.hypot(b.x-u.x-dx*at,b.y-u.y-dy*at)<b.r)return false}
  return true;
}
function cohesionReady(u){const g=u.grp&&B.groups[u.grp];return fighting(u)&&!withdrawing(u)&&!(u.stun>0)&&g&&!g.backing&&!((u.spdNow||0)>1&&(g.run||(u.run||0)>0))}
function moraleView(u,live,strength){
  const own=Math.max(.01,strength.get(u)||moraleStrength(u)),face=facing(u),sectors=[0,0,0,0];let allied=0,enemy=0,visibleAllied=0,visibleEnemy=0,localAllied=0,localEnemy=0,closest=Infinity,support=0,left=false,right=false;
  for(const o of live){const dx=o.x-u.x,dy=o.y-u.y,d=Math.hypot(dx,dy);if(d>CONFIDENCE.radius||!moraleVisible(u,o))continue;
    const s=strength.get(o)||0,w=1/(1+(d/AWARENESS.near)**2);
    if(o.team===u.team){allied+=s*w;visibleAllied+=s;if(d<AWARENESS.close)localAllied+=s;
      if(o!==u&&d<COHESION.radius&&cohesionReady(u)&&cohesionReady(o)&&angGap(facing(o),face)<1.05){
        const formed=u.grp!==o.grp||Math.hypot(dx-((o.sx||0)-(u.sx||0)),dy-((o.sy||0)-(u.sy||0)))<=COHESION.slot;
        if(formed){support+=s;const side=-dx*Math.sin(face)+dy*Math.cos(face);if(side>8)left=true;if(side<-8)right=true}}
    }else{enemy+=s*w;visibleEnemy+=s;closest=Math.min(closest,d);if(d<AWARENESS.close){localEnemy+=s;const angle=Math.atan2(dy,dx)-face;const sector=(Math.round(angle/(Math.PI/2))%4+4)%4;sectors[sector]+=s}}
  }
  // Distance alone must not make both equal armies believe they have numerical/quality superiority.
  const ratio=enemy>0?allied/enemy:Infinity,advantage=Math.min(ratio,visibleAllied/Math.max(.01,visibleEnemy)),confidence=enemy>0?clamp((advantage-CONFIDENCE.ratio)/(CONFIDENCE.full-CONFIDENCE.ratio),0,1):0;
  const outmatched=enemy>0?clamp((enemy/Math.max(.01,allied)-CONFIDENCE.ratio)/(CONFIDENCE.full-CONFIDENCE.ratio),0,1):0;
  const cohesion=clamp(support/(own*COHESION.allies),0,1)*(.65+.175*(+left+ +right));
  const opposed=(sectors[0]>own*.5&&sectors[2]>own*.5)||(sectors[1]>own*.5&&sectors[3]>own*.5);
  const surround=opposed?clamp(localEnemy/Math.max(own,localAllied),0,1):0;
  const overwhelmed=Math.max(clamp((localEnemy/Math.max(.01,localAllied)-1.5)/2.5,0,1),surround);
  return{confidence,outmatched,overwhelmed,cohesion,closest};
}
const RESOLVE={window:1,breakDelay:.6,severeAt:-10,severeDelay:.25,leaderDelay:.2,flankEvery:.5,killGain:.5,killCap:1};
function moraleBreaking(u,dt){
  if(u.mor>0){delete u.breakT;delete u.breakLimit;return false}
  u.confidence=0;u.breakT=(u.breakT||0)+dt;
  const delay=B.t<(u.breakUrgentUntil||0)?RESOLVE.leaderDelay:u.mor<=RESOLVE.severeAt?RESOLVE.severeDelay:RESOLVE.breakDelay;
  // Worsening panic shortens this episode; only positive morale resets its timer/severity.
  u.breakLimit=Math.min(u.breakLimit??delay,delay);return u.breakT+1e-9>=u.breakLimit;
}
// Ratios use the formation's STARTING roster/health, not the shrinking number left alive.
const GROUP_RESOLVE={hurt:35,death:45,attrition:35,wounds:12,recent:65,strainCap:30,window:5,history:20,bucket:.25,
  missileMin:.01,missileFull:.25,missileRate:8,answer:.35,quietAfter:3,rallyQuiet:3,routeRadius:140,fade:1};
// (fade: per combat second, morale above its ceiling (a Rally, a war cry, an enemy leader's fall) drifts back down to it)
class BattleResolve{
  constructor(groupId,team,m,unitId=null){
    this.groupId=groupId;this.unitId=unitId;this.team=team;this.initialCount=m.length;this.initialHP=Math.max(1,m.reduce((n,u)=>n+u.max,0));
    this.base=m.reduce((n,u)=>n+(u.mor0??unitMoraleOf(u.s)),0)/Math.max(1,m.length);this.mor=this.base;
    // its troops' Morale stat: a steadier unit is shaken less by its wounds and losses (shake() already applies it per soldier)
    this.steady=m.reduce((n,u)=>n+steadiness(u),0)/Math.max(1,m.length);
    this.confidence=0;this.cohesion=0;this.outmatched=0;this.overwhelmed=0;this.lossStrain=0;this.missilePressure=0;
    this.damageTaken=0;this.damageDealt=0;this.casualties=[];this.events=[];this.killCheers=[];
    this.routed=false;this.rallied=false;this.shattered=false;this.breakT=0;this.state='steady';this.confidenceBlockedUntil=0;
  }
  get control(){return this.groupId===null?null:B.groups[this.groupId]}
  members(){return B.units.filter(u=>!steady(u)&&(this.groupId===null?u.id===this.unitId:u.grp===this.groupId))}
  live(){return this.members().filter(u=>u.hp>0&&!u.left)}
  bucket(){const at=Math.floor(B.t/GROUP_RESOLVE.bucket)*GROUP_RESOLVE.bucket;this.events=this.events.filter(e=>B.t-e.at<=GROUP_RESOLVE.history);let e=this.events.at(-1);if(!e||e.at!==at){e={at,in:0,out:0,missiles:0,deaths:0};this.events.push(e)}return e}
  recent(){return this.events.filter(e=>B.t-e.at<GROUP_RESOLVE.window).reduce((n,e)=>({in:n.in+e.in,out:n.out+e.out,missiles:n.missiles+e.missiles}),{in:0,out:0,missiles:0})}
  ceiling(){return Math.min(100,this.base-GROUP_RESOLVE.attrition*this.casualties.length/this.initialCount-GROUP_RESOLVE.wounds*Math.min(1,this.damageTaken/this.initialHP)+CONFIDENCE.max*this.confidence)}
  shock(n,ordinary=true){this.mor-=n*(ordinary?(1-CONFIDENCE.resist*this.confidence)*(1-COHESION.resist*this.cohesion):1);this.refreshState();this.sync()}
  hurt(amount,missile){this.damageTaken+=amount;const e=this.bucket();e.in+=amount;if(missile)e.missiles+=amount;this.lastHurtAt=B.t;this.shock(GROUP_RESOLVE.hurt*amount/this.initialHP*this.steady)}
  dealt(amount){this.damageDealt+=amount;this.bucket().out+=amount;this.lastDealtAt=B.t}
  death(u){if(this.casualties.includes(u.id))return false;this.casualties.push(u.id);this.bucket().deaths++;this.shock(GROUP_RESOLVE.death/this.initialCount*this.steady);return true}
  reassure(){this.killCheers=this.killCheers.filter(e=>B.t-e.at<RESOLVE.window);const used=this.killCheers.reduce((n,e)=>n+e.gain,0),gain=Math.max(0,Math.min(RESOLVE.killGain,RESOLVE.killCap-used,this.ceiling()-this.mor));if(gain){this.mor+=gain;this.killCheers.push({at:B.t,gain})}this.refreshState();this.sync()}
  point(){const m=this.live();return m.length?{x:m.reduce((n,u)=>n+u.x,0)/m.length,y:m.reduce((n,u)=>n+u.y,0)/m.length}:{x:this.control?.ax||0,y:this.control?.ay||0}}
  view(live,strength){
    const m=this.live(),g=this.control,face=g?.face??0,sorted=m.slice().sort((a,b)=>(-a.x*Math.sin(face)+a.y*Math.cos(face))-(-b.x*Math.sin(face)+b.y*Math.cos(face))||a.id-b.id);
    const probes=[...new Set([.25,.5,.75].map(f=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*f))]).filter(Boolean))],views=probes.map(u=>moraleView(u,live,strength));
    const avg=k=>views.reduce((n,v)=>n+v[k],0)/Math.max(1,views.length);
    return {confidence:avg('confidence'),outmatched:avg('outmatched'),overwhelmed:avg('overwhelmed'),cohesion:avg('cohesion'),closest:views.length?Math.min(...views.map(v=>v.closest)):Infinity};
  }
  refreshState(){this.state=!this.live().length?'destroyed':this.shattered?'shattered':this.routed?(this.rallyT>0?'rallying':'routing'):this.mor<=0?'breaking':this.mor<MORALE.waver?'wavering':this.mor<60?'shaken':'steady'}
  sync(){for(const u of this.live()){
    u.mor0=this.base;u.mor=this.mor;u.confidence=this.confidence;u.cohesion=this.cohesion;u.outmatched=this.outmatched;u.overwhelmed=this.overwhelmed;u.lossStrain=this.lossStrain;
    u.breakT=this.breakT;u.confidenceBlockedUntil=this.confidenceBlockedUntil;
    for(const [k,v] of [['rout',this.routed],['rallied',this.rallied],['shattered',this.shattered]])if(v||u[k]!==undefined)u[k]=v;
    for(const k of ['flankAt','shockAt','outAt'])if(this[k]!==undefined)u[k]=this[k];
  }}
  step(dt,view){
    if(!this.live().length){this.refreshState();return false}
    Object.assign(this,{cohesion:view.cohesion,outmatched:view.outmatched,overwhelmed:view.overwhelmed});
    this.events=this.events.filter(e=>B.t-e.at<=GROUP_RESOLVE.history);const recent=this.recent();
    const unanswered=recent.missiles/this.initialHP>=GROUP_RESOLVE.missileMin&&recent.out<recent.in*GROUP_RESOLVE.answer;
    this.missilePressure=unanswered?clamp(recent.missiles/this.initialHP/GROUP_RESOLVE.missileFull,0,1):0;
    const strain=Math.min(GROUP_RESOLVE.strainCap,this.events.reduce((n,e)=>n+e.deaths/this.initialCount*GROUP_RESOLVE.recent*Math.exp(-Math.max(0,B.t-e.at)/LOSS_MEMORY.life),0));
    this.mor+=strain>this.lossStrain?this.lossStrain-strain:Math.min(this.lossStrain-strain,Math.max(0,this.ceiling()-this.mor));this.lossStrain=strain;
    const withdrawingGroup=this.control?.order==='withdraw',quiet=view.closest>MORALE.quiet+10&&B.t-(this.lastHurtAt??-Infinity)>=GROUP_RESOLVE.quietAfter&&!this.missilePressure;
    if(this.routed){this.confidence=0;if(quiet&&!this.rallied&&!this.shattered){this.rallyT=(this.rallyT||0)+dt;this.mor=Math.min(MORALE.rally,this.mor+MORALE.rallyBack*dt);if(this.mor>=MORALE.rally&&this.rallyT>=GROUP_RESOLVE.rallyQuiet)this.rally()}else this.rallyT=0;this.refreshState();this.sync();return false}
    this.confidence=!withdrawingGroup&&!this.missilePressure&&this.mor>0&&B.t>=this.confidenceBlockedUntil?view.confidence:0;
    if(!withdrawingGroup){const pressure=(view.outmatched*AWARENESS.outmatched+view.overwhelmed*AWARENESS.overwhelmed)*(1-COHESION.resist*this.cohesion)+GROUP_RESOLVE.missileRate*this.missilePressure;this.mor-=pressure*dt;if(view.overwhelmed>.1)this.outAt=B.t}
    if(this.mor<=0){if(quiet)this.mor=Math.min(this.ceiling(),this.mor+MORALE.back*dt);const broken=moraleBreaking(this,dt);this.refreshState();this.sync();return broken}
    moraleBreaking(this,0);const cap=this.ceiling()-this.lossStrain;
    if(quiet)this.mor+=Math.min(Math.max(0,cap-this.mor),(MORALE.back+(this.live().some(inspired)?1:0))*dt);
    if(this.confidence>0)this.mor+=Math.min(Math.max(0,cap-this.mor),CONFIDENCE.recover*this.confidence*dt);
    const top=this.ceiling();if(this.mor>top)this.mor=Math.max(top,this.mor-GROUP_RESOLVE.fade*dt);// (a boost is for a while)
    this.refreshState();this.sync();return false;
  }
  route(){
    if(this.routed||!this.live().length)return;
    const g=this.control;if(g){g.tgt=null;g.queue=[];g.run=false;g.order='rout'}
    this.routed=true;this.shattered=this.rallied;this.confidence=0;this.mor=Math.max(0,this.mor);this.breakT=0;delete this.breakLimit;this.rallyT=0;
    this.routeAt=B.t;this.refreshState();this.sync();const m=this.live(),p=this.point();
    if(B.opts.sandbox&&BattleLab.active){BattleLab.event('group_routed',null,{groupId:this.groupId,shattered:this.shattered});for(const u of m)BattleLab.event('routed',u)}
    for(const u of m){u.tgt=null;u.shot=null}moraleSay(m[0],this.shattered?'Shattered':'Routs!',this.team?'#ffe08a':'#ff9a90');calloutRout(this);// (its banner: battlehud.js)
    (B.routShocks||(B.routShocks=[])).push({team:this.team,groupId:this.groupId,unitId:this.unitId,x:p.x,y:p.y});B.moraleNext=0;
  }
  rally(){this.routed=false;this.rallied=true;this.rallyT=0;this.breakT=0;this.mor=Math.max(MORALE.rally,this.mor);const g=this.control;if(g)g.hold();this.refreshState();this.sync();for(const u of this.live()){u.tgt=null;u.shot=null}if(this.live()[0])moraleSay(this.live()[0],'Rallies','#9fe09a');calloutRally(this);if(B.opts.sandbox&&BattleLab.active)BattleLab.event('group_rallied',null,{groupId:this.groupId})}
}
function groupMoraleInit(units){
  for(const [id,g] of Object.entries(B.groups)){const m=units.filter(u=>u.grp===id&&!steady(u));if(m.length)g.resolve=new BattleResolve(id,g.team,m);else delete g.resolve}
}
function resolveOf(u){
  if(!u||u.id==null||steady(u))return null;const g=u.grp&&B.groups[u.grp];
  if(g){if(!g.resolve){const m=B.units.filter(o=>o.grp===g.id&&!steady(o));if(m.length)g.resolve=new BattleResolve(g.id,g.team,m)}return g.resolve||null}
  if(!u.resolve)u.resolve=new BattleResolve(null,u.team,[u],u.id);return u.resolve;
}
function battleResolves(){const all=new Set();for(const u of B.units){const r=resolveOf(u);if(r)all.add(r)}return [...all].sort((a,b)=>String(a.groupId??a.unitId).localeCompare(String(b.groupId??b.unitId)))}
// charge momentum: full after a run of this far; how it hits (cavalry, others); the shock it deals to the one it hits
const CHARGE={run:60,cav:.9,foot:.3,min:.2,foot_min:.35,shock:15,footShock:6,knock:2};
/* the push of a charge, by who hits whom: riders hard (heavy riders harder), big beasts hardest, shock troops some, other
   foot a little; heavy troops and a shield wall give less ground (a big creature barely moves: knock); those at the one hit's
   side are pushed too, splash of it, within splashR */
const PUSH={cav:2.6,heavyCav:3.4,big:3.6,shock:1.4,foot:.9,heavy:.6,wall:.35,splash:.5,splashR:16};
function chargePush(u,t,m){
  const s=u.s,at=tagsOf(s),base=s.big?PUSH.big:s.charge?(at.includes('heavy')?PUSH.heavyCav:PUSH.cav):at.includes('shock')?PUSH.shock:PUSH.foot,g=t.grp&&B.groups[t.grp];
  const f=base*m*(tagsOf(t.s).includes('heavy')?PUSH.heavy:1)*(shieldWallActive(t)?PUSH.wall:1);knock(t,u.x,u.y,f);
  for(const o of B.units)if(o!==t&&o.team===t.team&&o.hp>0&&!o.s.big&&Math.hypot(o.x-t.x,o.y-t.y)<PUSH.splashR)knock(o,u.x,u.y,f*PUSH.splash)}

// who never breaks
// (a shock to a soldier's morale, by his steadiness: a unit of higher Morale is shaken less)
const steadiness=u=>clamp(UNIT_MOR.ref/unitMoraleOf(u.s),UNIT_MOR.min,UNIT_MOR.max);
function shake(u,n){if(B.noMorale)return;const r=resolveOf(u);if(r)r.shock(n*steadiness(u)/r.initialCount)}
// Health, damage, attack rate and tier make support quality-aware; withdrawing or routing troops offer no reassurance.
function moraleStrength(u){return fighting(u)&&!withdrawing(u)?Math.sqrt(Math.max(1,u.max)*Math.max(.5,u.s.dmg||0)/Math.max(.2,u.s.cd||1))*clamp(u.hp/Math.max(1,u.max),0,1)*(1+.15*((u.s.tier||1)-1))*(u.s.big?1.5:1):0}
const steady=u=>!!(u.hero||u.comp||u.leader||u.s.beast||u.s.big||ST[u.type]&&ST[u.type].beast);
// is it still in the fight (not dead, not running)
const fighting=u=>u.hp>0&&!u.rout;
function moraleInit(units,opts){
  exitInit(units);// (the withdrawal edge)
  if(opts.tournament){B.noMorale=true;return}
  // (each soldier from his own Morale (matchups.js unitMoraleOf): yours scaled by your band's morale, theirs by their level;
  // a lord's men +10)
  const lv=opts.lv||1,mine=.6+.4*clamp(P.morale,0,100)/100,theirs=clamp(.9+.05*(lv-1),.8,1.2);
  for(const u of units){u.mor0=Math.round(clamp(unitMoraleOf(u.s)*(u.team?theirs:mine)+(u.team&&u.lord?10:0),20,100));u.mor=u.mor0}
  groupMoraleInit(units);
}
// where a soldier faces: its formation's front while it stands in its slot, else where it last moved or struck
function facing(u){const g=u.grp&&B.groups[u.grp];if(g&&g.form&&u.inSlot)return g.face||0;return u.dir!=null?u.dir:u.face<0?Math.PI:0}
// which side of t a blow from src comes at
function sideOf(t,src){
  const a=Math.atan2(src.y-t.y,src.x-t.x),f=facing(t),df=angGap(a,f);
  return df<1.05?'front':df<2.1?'flank':'rear';
}
// a word over a soldier, unless the same word is already up close by (a whole line breaking says it once)
function moraleSay(u,t,c,life){if(B.floats.some(f=>f.t===t&&Math.abs(f.x-u.x)<40&&Math.abs(f.y-u.y+22)<30))return;B.floats.push({x:u.x,y:u.y-22,t,life:life||.8,c})}
// a blow's weight by the side it lands on (and a shake to its morale)
function flankMul(t,src){
  if(!src||B.opts&&B.opts.tournament||t.hero&&MANUAL_HERO)return 1;const s=sideOf(t,src);if(s==='front')return 1;// (a tournament: no flank bonus; morale off still has it, only the shake and banner go)
  if(!B.noMorale){if(!steady(t)&&B.t-(t.sideShockAt??-Infinity)>=RESOLVE.flankEvery){shake(t,MORALE[s]);t.sideShockAt=B.t}t.flankAt=B.t;const r=resolveOf(t);if(r)r.flankAt=B.t;calloutFlank(t,src)}// (its banner, now and then: battlehud.js)
  if(!src.arrow)moraleSay(t,s==='rear'?'Rear!':'Flank!','#ffb04a',.5);
  return 1+(FLANK[s]-1)*(src.arrow?FLANK.arrow:1);
}
// a blow on morale: by the share of health it took
function moraleHurt(t,amt,source,missile){
  if(B.noMorale||!(amt>0))return;const own=resolveOf(t),attacker=resolveOf(source);
  if(own){own.hurt(amt,missile??!!(source?.s.range&&!source.inMelee));if(t.flankAt!==undefined)own.flankAt=t.flankAt}
  if(attacker&&source.team!==t.team)attacker.dealt(amt);
}
// a death: its side shaken (most of all close by, and by a leader's fall); the other side heartened a little
function moraleDeath(t,source){
  B.moraleNext=0;// Casualties change perceived strength immediately on the next morale update.
  if(withdrawing(t))B.caught=(B.caught||0)+1;// (cut down withdrawing: the rearguard)
  if(t.team===0&&!t.lord)B.lastOut='died';
  if(B.noMorale)return;const lead=t.hero||t.leader,own=resolveOf(t);if(own&&!own.death(t))return;
  for(const r of battleResolves()){if(!r.live().length)continue;const d=Math.hypot(r.point().x-t.x,r.point().y-t.y);
    if(r.team===t.team){if(lead){r.confidence=0;r.confidenceBlockedUntil=Math.max(r.confidenceBlockedUntil,B.t+CONFIDENCE.leaderPause);r.breakUrgentUntil=B.t+CONFIDENCE.leaderPause;r.shock(MORALE.lead,false)}else if(r!==own&&d<MORALE.near)r.shock(MORALE.death/Math.max(1,own?.initialCount||r.initialCount))}
    else if(lead){r.mor=Math.min(100,r.mor+MORALE.lead/2);r.sync()}else if(d<MORALE.near||r===resolveOf(source))r.reassure()}
  if(lead){(B.leadFell=B.leadFell||[])[t.team]=B.t}
  if(lead){B.floats.push({x:t.x,y:t.y-30,t:t.team?'Their leader falls!':'Your leader falls!',life:1.4,c:t.team?'#ffe08a':'#ff9a90'});calloutLeader(t)}
}
// a leader close by steadies them: your hero, a lord or chieftain of theirs
const inspired=u=>B.units.some(o=>o.team===u.team&&o.hp>0&&(o.hero||o.leader)&&Math.hypot(o.x-u.x,o.y-u.y)<MORALE.inspire);
// a war cry heartens those it reaches
function moraleCry(list){if(B.noMorale)return;for(const r of new Set(list.map(resolveOf).filter(Boolean))){r.mor=Math.min(100,r.mor+MORALE.cry);r.refreshState();r.sync()}}

// each moment: morale drifts with the fight, soldiers break, rally, and leave the field
function moraleTick(dt){
  if(B.noMorale)return;
  const owners=battleResolves(),live=B.units.filter(fighting),n=[0,0],strength=new Map(live.map(u=>[u,moraleStrength(u)])),broken=[];for(const u of live)n[u.team]++;B.losing=[n[0]<n[1]*.5,n[1]<n[0]*.5];
  if(!B.moraleViews||B.t+1e-9>=(B.moraleNext||0)||dt===0){B.moraleViews=new Map(owners.map(r=>[r,r.view(live,strength)]));B.moraleNext=B.t+AWARENESS.every}
  // Decide every formation against the same pre-route context. Apply neighbour panic only after all decisions.
  for(const r of owners)if(r.step(dt,B.moraleViews.get(r)||r.view(live,strength)))broken.push(r);
  for(const r of broken)r.route();
  const shocks=B.routShocks||[];delete B.routShocks;
  for(const s of shocks)for(const r of owners){if(r.team!==s.team||r.routed||!r.live().length||r.groupId===s.groupId&&(r.groupId!==null||r.unitId===s.unitId)||B.t-(r.routShockAt??-Infinity)<CONFIDENCE.cascadeCooldown)continue;
    const p=r.point();if(Math.hypot(p.x-s.x,p.y-s.y)>=GROUP_RESOLVE.routeRadius)continue;
    r.routShockAt=B.t;r.confidence=0;r.confidenceBlockedUntil=Math.max(r.confidenceBlockedUntil,B.t+CONFIDENCE.panic);r.shock(MORALE.cascade*(1-COHESION.cascade*r.cohesion),false);
  }
  if((B.cardT=(B.cardT||0)-dt)<=0){B.cardT=.5;setOrderUI()}// (the unit cards' morale)
}
// Commit a rout after sustained breaking (or an explicit forced rout); neighbour shocks remain deferred.
function rout(u){
  if(!u||u.hp<=0)return;resolveOf(u)?.route();
}
// a routing soldier's moment: away from the enemy, toward its own edge; there it leaves the field
function routStep(u,dt){
  const ex=u.team?BW-MORALE.edge:MORALE.edge,e=nearest(u);let mx=Math.sign(ex-u.x)||1,my=0;
  if(e){const dx=u.x-e.x,dy=u.y-e.y,d=Math.hypot(dx,dy)||1;if(d<80){mx+=dx/d*.6;my+=dy/d*.6}}
  const m=Math.hypot(mx,my)||1,sp=u.s.spd*1.1*dt*(u.slow>0?.5:1);u.x+=mx/m*sp;u.y+=my/m*sp;u.spdNow=u.s.spd;u.dir=Math.atan2(my,mx);u.face=mx>=0?1:-1;u.run=0;fatigueStep(u,dt,true,false,false);
  if(u.team?u.x>=BW-MORALE.edge-2:u.x<=MORALE.edge+2){u.fled=true;if(u.team===1)B.fledFoes=(B.fledFoes||0)+1;else B.fledMine=(B.fledMine||0)+1;leaveField(u)}
}
// a soldier off the field (at its edge): out of the fight, alive (not a loss); its health kept for after (your hero's)
function leaveField(u){if(B.opts.sandbox&&BattleLab.active)BattleLab.event('field_exit',u,{cause:u.rout?'routed':'withdrawn'});u.hpLeft=u.hp;u.hp=0;u.left=true;if(u.team===0&&!u.lord)B.lastOut='left';if(u.grp){if(B.sel===u.grp&&!grpUnits(u.grp).length)B.sel='all';setOrderUI()}}

/* withdrawing (W) is fleeing the battle: the group drops its fight, briefly disengages if in melee, then runs for your edge of the field (the side you formed up on,
   marked there while any of yours withdraw), straight back, striking no one; there they leave the field, alive. The enemy may run
   them down on the way: that is the rearguard's cost. Once all of yours have withdrawn (or fallen), the battle is over: your
   retreat, and the summary shows what it cost. Running costs stamina; fatigue slows it and exhaustion forces a walk. */
const WITHDRAW={band:14,disengage:.8,backstep:.35,contact:6};// combat seconds to break melee contact; backstep is a share of current speed
const withdrawing=u=>{const g=u.grp&&B.groups[u.grp];return !!g&&g.order==='withdraw'};
// the withdrawal edge: your side of the field (x), its strip (w); y is the middle of where your band formed up (for the lines)
function exitInit(units){const m=units.filter(u=>u.team===0&&!u.lord);B.exit={x:MORALE.edge,w:WITHDRAW.band,y:m.length?m.reduce((a,u)=>a+u.y,0)/m.length:BH/2}}
// where a soldier withdraws to: the nearest point of your edge, straight back
const exitFor=u=>({x:u.team?BW-MORALE.edge:B.exit.x,y:clamp(u.y,fieldTop(),fieldBot())});
function withdrawThreat(u){return B.units.some(e=>e.hp>0&&e.team!==u.team&&!e.rout&&(!e.s.range||e.inMelee)&&Math.hypot(e.x-u.x,e.y-u.y)<=(e.inMelee?BLADE.reach:e.s.reach||11)+3+(u.s.big?12:0)+WITHDRAW.contact)}
function withdrawStep(u,dt){
  u.run=0;u.inSlot=false;u.spdNow=0;
  const threat=withdrawThreat(u);
  const atExit=u.team?u.x>=BW-MORALE.edge-WITHDRAW.band:u.x<=B.exit.x+B.exit.w;
  const leave=()=>{if(u.team===0)B.withdrawn=(B.withdrawn||0)+1;leaveField(u)};
  // One bounded disengagement per withdrawal order, triggered on first melee contact (including at the exit).
  // Keep an uncontested exit immediate; no synthetic losses or escape roll is added here.
  if(atExit&&!threat&&!(u.withdrawal&&u.withdrawal.remaining>0)){leave();return}
  const state=u.withdrawal||(u.withdrawal={remaining:null});if(threat&&state.remaining===null)state.remaining=WITHDRAW.disengage;
  if(atExit&&state.remaining===0){leave();return}
  const back=Math.min(dt,state.remaining||0);if(state.remaining>0)state.remaining=Math.max(0,state.remaining-back);
  const free=dt-back,walking=staOf(u)<FATIGUE.runMin,spd=u.s.spd*tiredMul(u).spd*(u.slow>0?.5:1),X=exitFor(u),dx=X.x-u.x,dy=X.y-u.y,d=Math.hypot(dx,dy);
  const sp=Math.min(d,spd*(back*WITHDRAW.backstep+free*(walking?MARCH.walk:1)));
  if(d>.001){u.x+=dx/d*sp;u.y+=dy/d*sp;u.dir=Math.atan2(dy,dx);u.face=dx>=0?1:-1;u.walkA=u.dir;u.spdNow=free>0?spd*(walking?MARCH.walk:1):spd*WITHDRAW.backstep}
  if(back>0)fatigueStep(u,back,sp>0,true,false,threat);
  if(free>0)fatigueStep(u,free,sp>0,walking,false,threat);
}
// is the battle over by your retreat: some of yours withdrew, and none of your own is left on the field (bar any running in a rout).
// Your hero knocked down: a retreat if the last of your band got away withdrawing (they carry you off), a defeat if they fell
function retreating(){
  if(!B.withdrawn||B.hero&&B.hero.hp<=0&&!B.hero.left&&B.lastOut!=='left')return false;
  return !B.units.some(u=>u.team===0&&!u.lord&&u.hp>0&&!u.rout);
}
function retreatNow(){B.over=true;B.endT=END_WAIT;B.win=false;B.retreat=true;log('Your band withdraws from the battle'+(B.caught?': '+B.caught+' cut down on the way.':'.'),'bad')}
// the withdrawal edge on the field: a faint strip along your edge, bright with a word while any of yours withdraw
function drawExit(){
  const X=B.exit;if(!X||B.opts.tournament)return;const on=B.units.some(u=>u.hp>0&&withdrawing(u));
  ctx.fillStyle=on?'rgba(111,168,224,.22)':'rgba(228,224,207,.06)';ctx.fillRect(0,18,X.x+X.w,BH-24);
  ctx.save();ctx.setLineDash([3,3]);ctx.strokeStyle=on?'rgba(111,168,224,.9)':'rgba(228,224,207,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X.x+X.w+.5,18);ctx.lineTo(X.x+X.w+.5,BH-6);ctx.stroke();ctx.restore();
  if(on){ctx.save();ctx.translate(X.x+X.w/2+3,BH/2);ctx.rotate(-Math.PI/2);txt('Withdraw',0,0,'#9fc0ff','center');ctx.restore()}
}
// charge momentum: how far it has run at its target, 0 to 1
const momentum=u=>clamp((u.run||0)/CHARGE.run,0,1);
/* a charge's weight on its first blow; its shock to the one it hits. The run is spent, and its stamina only once it counts as a
   charge (riders CHARGE.min, foot CHARGE.foot_min). Spearmen still in the fight brace against a charge on their front (Brace:
   their flanks too, unitabilities.js): no bonus, no shock. A deep block blunts the bonus, never from behind (formations.js formCharge) */
function spearBraced(t,u){if(unitClass(t.s)!=='spear'||t.rout||withdrawing(t))return false;const side=sideOf(t,u);return side==='front'||side==='flank'&&unitAbility(t,'brace')}
function chargeMul(u,t){
  const m=momentum(u),s=u.s;u.run=0;if(s.range&&!s.charge||m<(s.charge?CHARGE.min:CHARGE.foot_min))return 1;fatigueCharge(u,m);// (the charge spends the runner's stamina: fatigue.js)
  if(spearBraced(t,u)){B.floats.push({x:t.x,y:t.y-22,t:'Braced',life:.6,c:'#cfe0ff'});return 1}
  if(s.charge){vfxCharge(u,t,m);chargeJolt(u,m);fx(t.x,t.y-6,'#fff',4);if(!B.noMorale&&!steady(t)&&t.mor!=null){shake(t,CHARGE.shock*m);t.shockAt=B.t;const r=resolveOf(t);if(r)r.shockAt=B.t}chargePush(u,t,m);if(m>.6)moraleSay(t,'Charge!','#fff',.6);
    return 1+CHARGE.cav*m*formCharge(u,t,sideOf(t,u))}
  if(B.opts&&B.opts.tournament)return 1;// (a tournament: no foot charges; morale off still has them, only the shake goes)
  if(!B.noMorale&&!steady(t)&&t.mor!=null){shake(t,CHARGE.footShock*m);t.shockAt=B.t;const r=resolveOf(t);if(r)r.shockAt=B.t}chargeJolt(u,m);chargePush(u,t,m);return 1+CHARGE.foot*m*formCharge(u,t,sideOf(t,u));
}
// a group's morale (unit cards and the icons over groups): the average, how many waver or run, its state, and what weakens it now
// state: steady (60+), shaken (30+), wavering, routing (most of them running), shattered (all running, broken for good)
// weak: flanked (hit from the side or behind), outnumbered (2 to 1 close by), charged (hit by a charge), leader (its leader fell),
// losing (its side under half the other's); each shows a while (seconds) after it last happened
const MORALE_WEAK={flanked:2,outnumbered:1.5,charged:2,leader:6};
function grpMorale(m){
  const l=m.filter(u=>u.hp>0&&!u.left&&!steady(u)),owners=[...new Set(l.map(resolveOf).filter(Boolean))];if(!owners.length)return null;
  owners.forEach(r=>r.refreshState());const weight=r=>l.filter(u=>resolveOf(u)===r).length,avg=k=>owners.reduce((n,r)=>n+r[k]*weight(r),0)/l.length;
  const v=Math.max(0,avg('mor'))/100,rout=owners.reduce((n,r)=>n+(r.routed?weight(r):0),0),waver=owners.reduce((n,r)=>n+(!r.routed&&r.mor<MORALE.waver?weight(r):0),0),breaking=owners.reduce((n,r)=>n+(!r.routed&&r.mor<=0&&r.breakT>0?weight(r):0),0);
  const state=owners.length===1?owners[0].state:rout*2>l.length?'routing':v<.3?'wavering':v<.6?'shaken':'steady';
  const ago=(k,w)=>owners.some(r=>r[k]!=null&&B.t-r[k]<w),team=l[0].team,weak=[];
  if(ago('flankAt',MORALE_WEAK.flanked))weak.push('flanked');if(ago('outAt',MORALE_WEAK.outnumbered))weak.push('outnumbered');if(ago('shockAt',MORALE_WEAK.charged))weak.push('charged');
  if(B.leadFell&&B.leadFell[team]!=null&&B.t-B.leadFell[team]<MORALE_WEAK.leader)weak.push('leader');if(B.losing&&B.losing[team])weak.push('losing');
  const st=grpStamina(m);if(st!=null&&st*FATIGUE.max<FATIGUE.tired)weak.push('tired');
  const confident=owners.every(r=>!r.routed&&r.mor>0&&r.control?.order!=='withdraw'&&r.confidence>.1);
  if(owners.some(r=>!r.routed&&r.outmatched>.1))weak.push('outmatched');if(owners.some(r=>r.lossStrain>1))weak.push('recentloss');if(owners.some(r=>r.missilePressure>0))weak.push('missile');
  return {v,rout,waver,state,weak,team,confident,breaking,cohesion:avg('cohesion'),lossStrain:avg('lossStrain'),missilePressure:avg('missilePressure')};
}
/* the look, as in Total War: over each group a small icon in its side's colour showing what it is (sword, spear, axe, hammer,
   bow, crossbow, javelin, staff, horse, a beast's paw, your hero's crown) and a thin health bar under it; beside it a round badge
   for each status: a green confidence arrow, or wavering, routing, shattered (its morale), flanked,
   outnumbered, charged, its leader fallen, its side losing, tired (what weakens it). Drawn on the field and as SVG on the unit
   cards and in the details. */
const BADGE=['..xxxxx..','.xooooox.','xooooooox','xooooooox','xooooooox','xooooooox','xooooooox','.xooooox.','..xxxxx..'];
const GLYPH={
  breaking:['g...g','.g.g.','..g..','.....','..g..'],
  rallying:['..g..','.ggg.','g.g.g','..g..','.ggg.'],
  missile:['g.g.g','.g.g.','..g..','.g.g.','g.g.g'],
  confident:['..g..','.ggg.','g.g.g','..g..','..g..'],
  wavering:['..g..','..g..','..g..','.....','..g..'],
  routing:['gggg.','ggggg','gggg.','g....','g....'],
  shattered:['g...g','.g.g.','..g..','.g.g.','g...g'],
  flanked:['g....','.g...','..g.g','...gg','..ggg'],
  outnumbered:['g...g','.....','g.g.g','.....','g...g'],
  outmatched:['g...g','gg.gg','.....','.g.g.','..g..'],
  recentloss:['ggggg','.g.g.','..g..','.g.g.','ggggg'],
  charged:['...gg','..gg.','.ggg.','.gg..','gg...'],
  leader:['g.g.g','ggggg','ggggg','.....','.....'],
  losing:['..g..','..g..','g.g.g','.ggg.','..g..'],
  tired:['gggg.','..g..','.g...','gggg.','.....']
};
// each badge's rim: morale in its own colours, weaknesses in red (a charge in gold)
const BADGE_RIM={breaking:'#ff8040',rallying:'#9fe09a',missile:'#e8a75a',confident:'#70dfb0',outmatched:'#d8b35a',recentloss:'#e8a75a',tired:'#c8a04a',wavering:'#ffa040',routing:'#f2efe6',shattered:'#8a8f98',flanked:'#e0605a',outnumbered:'#e0605a',charged:'#ffd25a',leader:'#e0605a',losing:'#e0605a'};
const CONFIDENCE_LABEL='Confident: visible, distance-weighted fighting strength advantage. Up to +'+CONFIDENCE.max+' morale and '+Math.round(CONFIDENCE.resist*100)+'% less ordinary morale shock. Panic and leader loss can suppress it.';
const MORALE_STATE={steady:{c:'#78c474',n:'Steady'},shaken:{c:'#e8d04a',n:'Shaken'},wavering:{c:'#ffa040',n:'Wavering'},breaking:{c:'#ff8040',n:'Breaking'},rallying:{c:'#9fe09a',n:'Rallying'},routing:{c:'#f2efe6',n:'Routing'},shattered:{c:'#8a8f98',n:'Shattered'}};
const WEAK_N={missile:'Unanswered missile fire: recent ranged damage without enough successful retaliation',tired:'Tired: slower and weaker; standing still restores them',flanked:'Flanked: hit from the side or behind',outmatched:'Outmatched: stronger visible opposition in the wider area',recentloss:'Recent losses: temporary pressure that fades; some morale loss remains',outnumbered:'Locally overwhelmed: close fighting strength or substantial threats on opposite sides',charged:'Charged: hit by a charge',leader:'Leader fallen',losing:'Army depleted: fewer than half as many active troops overall (informational, not a direct morale penalty)'};
// a state's badge (only when its morale is failing: steady and shaken show none)
const stateIcon=st=>['wavering','breaking','routing','rallying','shattered'].includes(st)?st:null;
// a badge's pixels: [x, y, colour] (9×9)
function badgePx(k){const rim=BADGE_RIM[k]||'#e4e0cf',G=GLYPH[k],out=[];BADGE.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch==='.')return;const gy=y-2,gx=x-2,g=G&&G[gy]&&G[gy][gx]==='g';out.push([x,y,ch==='x'?rim:g?'#ffffff':'#141822'])}));return out}
function moraleSVG(k,col,size){if(!k)return '';size=size||14;const confident=k==='confident';return '<svg class="mico" viewBox="0 0 9 9" width="'+size+'" height="'+size+'" shape-rendering="crispEdges"'+(confident?' data-status="confident" role="img" aria-label="'+CONFIDENCE_LABEL+'"':' aria-hidden="true"')+'>'+(confident?'<title>'+CONFIDENCE_LABEL+'</title>':'')+badgePx(k).map(([x,y,c])=>'<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+c+'"/>').join('')+'</svg>'}
// a group's badges: its failing morale, then what weakens it
const statusOf=mo=>[stateIcon(mo.state),mo.confident?'confident':null,...mo.weak].filter(Boolean);
const moraleCardIcons=mo=>statusOf(mo).map(k=>moraleSVG(k)).join('');
const moraleWords=mo=>'morale '+Math.round(mo.v*100)+' ('+MORALE_STATE[mo.state].n.toLowerCase()+')'+(mo.confident?' · '+CONFIDENCE_LABEL:'')+(mo.weak.length?' · '+mo.weak.map(w=>WEAK_N[w].split(':')[0].toLowerCase()).join(', '):'');
// the unit types' glyphs on the icons (9×9)
const UNIT_GLYPH={
  sword:['.......gg','......ggg','.....ggg.','....ggg..','.g.ggg...','..ggg....','..gg.....','.g..g....','g........'],
  spear:['....g....','...ggg...','..ggggg..','...ggg...','....g....','....g....','....g....','....g....','....g....'],
  axe:['..g..g...','.gg.ggg..','gggggg...','gggggg...','gggggg...','.gg..g...','..g..g...','.....g...','.....g...'],
  hammer:['ggggggg..','ggggggg..','ggggggg..','...g.....','...g.....','...g.....','...g.....','...g.....','..ggg....'],
  bow:['.gg......','g..g.....','g...g....','g....g...','ggggggggg','g....g...','g...g....','g..g.....','.gg......'],
  xbow:['....g....','.ggggggg.','g...g...g','....g....','....g....','....g....','...ggg...','...ggg...','.........'],
  javelin:['......g.g','.....g.g.','....g.g..','...g.g...','..g.g....','.g.g.....','g.g......','.g.......','.........'],
  staff:['...ggg...','..g...g..','..g.g.g..','..g...g..','...ggg...','....g....','....g....','....g....','....g....'],
  horse:['....g.g..','...ggggg.','..gggggg.','.ggggggg.','gggg.ggg.','ggg..ggg.','.....ggg.','.....gggg','.....gggg'],
  beast:['..g...g..','g.g...g.g','g.......g','...ggg...','..ggggg..','.ggggggg.','.ggggggg.','..gg.gg..','.........'],
  hero:['.........','g...g...g','gg.ggg.gg','ggggggggg','ggggggggg','ggggggggg','.........','.........','.........']
};
// what a group is, by its most common soldier: its weapon (people.js) or what it is (a beast, a rider, a caster)
function unitIcon(g,m){
  if(g==='hero')return 'hero';const rep=repOf(m),s=ST[rep]||m[0].s;if(s.beast||s.big)return 'beast';
  const L=PEOPLE_LOOK[rep]||PEOPLE_LOOK[s.look]||{},w=L.weapon;if(L.mount)return 'horse';if(s.magic||w==='staff')return 'staff';
  if(w==='xbow')return 'xbow';if(s.range)return w==='javelin'?'javelin':'bow';
  return {sword:'sword',great:'sword',axe:'axe',bigaxe:'axe',hammer:'hammer',spear:'spear',pike:'spear',lance:'spear'}[w]||(unitClass(s)==='spear'?'spear':'sword')}
// the icon under a point of the field (screen-sized, so tested on the screen), for clicks: the icon stands for its group
function iconAt(x,y,team){if(!B.icons)return null;const p=fromField({x,y});for(let i=B.icons.length-1;i>=0;i--){const r=B.icons[i];if((team==null||r.team===team)&&p.x>=r.x&&p.x<r.x+r.w&&p.y>=r.y&&p.y<r.y+r.h)return r}return null}
// the icons over each group on the field (yours and theirs), drawn on the screen (not the zoomed field) so they keep their size
const UICON={s:13,lift:22,k:2};// (its art in pixels, drawn k times over)
function drawUnitIcons(){
  const sel=selGroups(),blink=Math.floor(B.t*3)%2,K=UICON.k,S=UICON.s;B.icons=[];// (where each was drawn, for clicks: iconAt)
  // (each icon's place over its group; then those that would overlap, as where the lines meet, are set side by side in a row
  // under the highest of them, the row centred on them; and each icon glides to its place rather than jumping)
  const items=[];
  for(const g in B.groups){const m=B.units.filter(u=>u.grp===g&&u.hp>0);if(!m.length)continue;const mo=B.noMorale?null:grpMorale(m);
    const f=m.filter(u=>!u.rout),at=f.length?f:m,cx=at.reduce((a,u)=>a+u.x,0)/at.length,top=Math.min(...at.map(u=>u.y));
    const st=mo?statusOf(mo):[],W=(S+(st.length?Math.ceil(st.length/2)*10+1:0))*K,H=(S+6)*K;
    const sp=fromField({x:cx,y:top}),z=B.cam?B.cam.z:1;if(sp.x<-W||sp.x>BVW+W||sp.y<0||sp.y>BVH+40)continue;// (off the view: none)
    items.push({g,m,mo,st,W,H,cx,cy:at.reduce((a,u)=>a+u.y,0)/at.length,x:sp.x-S*K/2,y:Math.max(4,sp.y-UICON.lift*z-H)})}
  items.sort((p,q)=>p.x-q.x);const rows=[];
  for(const it of items){const r=rows.find(r=>r.some(o=>Math.abs(o.y-it.y)<it.H+4&&it.x<o.x+o.W+4&&o.x<it.x+it.W+4));if(r)r.push(it);else rows.push([it])}
  for(const r of rows){if(r.length<2)continue;const w=r.reduce((a,o)=>a+o.W+4,-4),mid=r.reduce((a,o)=>a+o.x+o.W/2,0)/r.length,y=Math.min(...r.map(o=>o.y));let x=mid-w/2;for(const o of r){o.x=x;o.y=y;x+=o.W+4}}
  const IP=B.iconPos=B.iconPos||{};
  for(const it of items){const p=IP[it.g];if(!p||Math.hypot(p.x-it.x,p.y-it.y)>200)IP[it.g]={x:it.x,y:it.y};else{p.x+=(it.x-p.x)*.25;p.y+=(it.y-p.y)*.25}}
  // (and while they glide, none may cross another: pushed aside along the row)
  {const L=items.map(it=>({it,p:IP[it.g]})).sort((a,b)=>a.p.x-b.p.x);for(let i=1;i<L.length;i++)for(let j=0;j<i;j++){const a=L[j],b=L[i];if(Math.abs(a.p.y-b.p.y)<b.it.H&&b.p.x<a.p.x+a.it.W+2)b.p.x=a.p.x+a.it.W+2}}
  for(const it of items){const {g,m,mo,st,W,H,cx,cy}=it,x=Math.round(IP[g].x),y=Math.round(IP[g].y);
    B.icons.push({g,x,y,w:S*K,h:H,team:m[0].team,cx,cy});
    const team=(mo?mo.team:m[0].team)?['#a8443e','#c8605a','#7a2e2a']:g.startsWith('a_')?['#5aa0c8','#8ac4e0','#3a7898']:['#3466c0','#5a8ae0','#24488a'],wav=mo&&mo.state==='wavering'&&blink;
    const hov=B.iconHov===g,edge=sel.includes(g)?'#ffd25a':wav?'#ffa040':hov?'#f4efe0':'#0a0c12';
    ctx.save();ctx.translate(x,y);ctx.scale(K,K);ctx.globalAlpha=mo&&(mo.state==='routing'||mo.state==='shattered')?.6:1;
    // the plate: an edge (gold when selected), its side's colour, lighter at the top and darker at the foot, a notch pointing down
    ctx.fillStyle=edge;ctx.fillRect(1,0,S-2,S);ctx.fillRect(0,1,S,S-2);ctx.fillRect(S/2-1.5|0,S,3,1);
    ctx.fillStyle=team[0];ctx.fillRect(1,1,S-2,S-2);ctx.fillStyle=team[1];ctx.fillRect(2,1,S-4,1);ctx.fillStyle=team[2];ctx.fillRect(1,S-3,S-2,2);
    // its type, in white with a dark shadow
    const gl=UNIT_GLYPH[unitIcon(g,m)];
    for(const [col,dx] of [['rgba(0,0,0,.45)',1],['#f4efe0',0]]){ctx.fillStyle=col;gl.forEach((row,ry)=>[...row].forEach((c,rx)=>{if(c==='g')ctx.fillRect(2+rx+dx,2+ry+dx,1,1)}))}
    ctx.globalAlpha=1;
    // its health, under it
    const hp=m.reduce((a,u)=>a+u.hp,0)/Math.max(1,m.reduce((a,u)=>a+u.max,0)),hy=S+2;
    ctx.fillStyle='#0a0c12';ctx.fillRect(0,hy,S,3);ctx.fillStyle=hp>.6?'#78c474':hp>.3?'#e8d04a':'#e0605a';ctx.fillRect(1,hy+1,Math.max(1,Math.round((S-2)*hp)),1);
    // what is wrong with it, beside it (two to a column)
    st.forEach((k,i)=>{const bx=S+2+Math.floor(i/2)*10,by=(i%2)*10;for(const [px,py,c] of badgePx(k)){ctx.fillStyle=c;ctx.fillRect(bx+px,by+py,1,1)}});
    ctx.restore()}
}
// over a soldier: a white flag while it runs, a blinking mark while it wavers
function drawMorale(u,x,y){
  if(B.noMorale||u.mor==null||steady(u))return;
  if(u.rout){ctx.fillStyle='#5a4a3a';ctx.fillRect(x+3,y-8,1,8);ctx.fillStyle='#f2efe6';ctx.fillRect(x+4,y-8,4,3)}
  else if(u.mor<MORALE.waver&&Math.floor(B.t*4)%2)rect(ctx,'#ffd24a',x-1,y-3,2,2);
}
