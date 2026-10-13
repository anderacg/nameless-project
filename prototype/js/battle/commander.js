'use strict';
/* ---------- champions, and the other side's command ---------- */

/* champions: a lord, a chieftain or your companion fights as your hero does. The combo of their weapon (a blow inside the
   window carries the chain on, a breath after the finisher), stamina that pays for it and comes back, mana for skills, and
   skills that come with their level: Whirlwind from the start, War Cry at 3, Earthquake and Leap Slam at 5, Healing at 7.
   An enemy champion who sees your hero near goes for them. */
const CHAMP={sp:[60,5],mp:[30,6],regen:18,delay:.6,mana:2.5,breath:[.9,1.4],pause:.12,wait:.35,think:.35,duel:140};
const CHAMP_SK={whirl:{lv:1,cd:7,mp:12,sp:15,mult:1.3,kb:16},cry:{lv:3,cd:18,mp:20,sp:0,r:90,foe:80,buff:6,stun:.8},
  quake:{lv:5,cd:12,mp:18,sp:15,r:50,mult:.9,stun:.6},leap:{lv:5,cd:10,mp:16,sp:20,r:34,mult:1.5,stun:1,dur:.32},heal:{lv:7,cd:20,mp:25,sp:0,self:.3,troops:.2,r:90}};
const isFighter=u=>!!(u.leader||u.comp);
const champLv=u=>u.leader?u.leader.lv:u.comp&&compInit(u.type)?compInit(u.type).lv:1;
function champ(u){if(u.ch)return u.ch;const lv=champLv(u),sp=CHAMP.sp[0]+CHAMP.sp[1]*lv,mp=CHAMP.mp[0]+CHAMP.mp[1]*lv;
  return u.ch={lv,sp,mp,spMax:sp,mpMax:mp,spT:9,step:-1,win:0,cds:{},think:Math.random()*CHAMP.think,leap:null}}
// the combo their weapon fights: a rider's sword, a spear's thrusts, a heavy hitter's cleaves
const champCombo=u=>u.s.charge?COMBO:unitClass(u.s)==='spear'?COMBOS.thrust:u.s.dmg>=12||u.type==='chief'?COMBOS.heavy:COMBO;
// a champion's moment: breath and mana come back, a leap lands, a skill if one fits; true while it owns the moment
function champThink(u,dt){
  const C=champ(u);C.spT+=dt;if(C.spT>CHAMP.delay)C.sp=Math.min(C.spMax,C.sp+CHAMP.regen*dt);C.mp=Math.min(C.mpMax,C.mp+CHAMP.mana*dt);C.win=Math.max(0,C.win-dt);
  for(const k in C.cds)C.cds[k]=Math.max(0,C.cds[k]-dt);
  if(C.leap){const L=C.leap,S=CHAMP_SK.leap;L.t+=dt;const p=Math.min(1,L.t/S.dur);u.x=L.sx+(L.tx-L.sx)*p;u.y=L.sy+(L.ty-L.sy)*p;u.z=Math.sin(Math.PI*p)*16;
    if(p>=1){C.leap=null;u.z=0;B.rings.push({x:u.x,y:u.y-4,r:S.r,life:.4,max:.4,col:'255,190,90'});fx(u.x,u.y,'#c8b48a',10);
      for(const e of champFoes(u))if(Math.hypot(e.x-u.x,e.y-u.y)-(e.s.big?12:0)<=S.r){hit(u,e,u.s.dmg*S.mult);knock(e,u.x,u.y,14);stun(e,S.stun)}shakeIt(3)}
    return true}
  if(u.stun>0)return false;
  // a duel: an enemy champion goes for your hero when near
  const h=B.hero;if(u.team===1&&h&&h.hp>0&&Math.hypot(h.x-u.x,h.y-u.y)<CHAMP.duel){u.tgt=h;u.rt=.5}
  if((C.think-=dt)<=0){C.think=CHAMP.think;if(champSkill(u,C))return true}
  return false;
}
const champFoes=u=>B.units.filter(e=>e.team!==u.team&&e.hp>0);
// a blow at t: the next step of their combo, if they have the breath for it (troops' attack for a champion with a bow)
function champStrike(u,t){
  if(u.s.range)return attack(u,t);
  const C=champ(u),CB=champCombo(u),step=C.win>0?(C.step+1)%CB.length:0,cost=Math.round(STAM.swing[step]*(CB.sp||1));
  if(C.sp<cost){u.cd=CHAMP.wait;return}
  C.sp-=cost;C.spT=0;C.step=step;const c=CB[step],a=Math.atan2(t.y-u.y,t.x-u.x);
  u.cd=c.cd*((u.s.cd||.8)/.45)*.9+CHAMP.pause;C.win=u.cd+COMBO_WINDOW;u.atkAt=B.t;u.atkStyle=STYLE[c.shape];u.face=Math.cos(a)>=0?1:-1;
  const R=(u.s.reach||12)+c.reach,life=c.shape==='slam'||c.shape==='spin'?.32:.2;
  B.slashes.push({kind:c.shape,x:u.x,y:u.y-6,a,life,max:life,arc:c.arc,r:R,col:u.team?'255,170,150':c.col,w:c.w,dir:c.dir,area:c.area,wid:c.wid});
  let n=0;for(const e of champFoes(u)){if(!inShape(u.x,u.y,a,R,c,e))continue;hit(u,e,u.s.dmg*c.mult*(.85+Math.random()*.3)*(c.shape==='thrust'?Math.max(.5,1-.2*n):1));knock(e,u.x,u.y,c.kb||0);if(c.stun)stun(e,c.stun);n++}
  if(step===CB.length-1){u.cd+=CHAMP.breath[0]+Math.random()*(CHAMP.breath[1]-CHAMP.breath[0]);if(n)B.floats.push({x:u.x,y:u.y-26,t:c.n,life:.5,c:u.team?'#ff9a90':'#9fc0ff'})}
}
// the skill that fits the moment, of those their level has given them; true if cast
function champSkill(u,C){
  const foes=champFoes(u),mine=B.units.filter(o=>o.team===u.team&&o.hp>0&&o!==u);if(!foes.length)return false;
  const near=(x,y,r,list)=>list.filter(e=>Math.hypot(e.x-x,e.y-y)-(e.s.big?12:0)<=r),col=u.team?'#ff9a90':'#9fc0ff';
  const ready=id=>{const S=CHAMP_SK[id];return C.lv>=S.lv&&!(C.cds[id]>0)&&C.mp>=S.mp&&C.sp>=S.sp};
  const pay=id=>{const S=CHAMP_SK[id];C.cds[id]=S.cd;C.mp-=S.mp;C.sp-=S.sp;if(S.sp)C.spT=0;return S};
  const say=(t,c2)=>B.floats.push({x:u.x,y:u.y-28,t,life:.8,c:c2||col});
  if(ready('heal')&&u.hp<u.max*.45){const S=pay('heal');u.hp=Math.min(u.max,u.hp+u.max*S.self);near(u.x,u.y,S.r,mine).forEach(o=>o.hp=Math.min(o.max,o.hp+o.max*S.troops));
    B.rings.push({x:u.x,y:u.y-6,r:S.r,life:.5,max:.5,col:'140,230,140'});say('HEAL','#8ae08a');return true}
  const R=(u.s.reach||12)+14,ring=near(u.x,u.y,R,foes);
  if(ready('whirl')&&!u.s.range&&ring.length>=2){const S=pay('whirl');B.rings.push({x:u.x,y:u.y-6,r:R,life:.35,max:.35,col:u.team?'255,150,130':'255,236,170'});
    for(const e of ring){hit(u,e,u.s.dmg*S.mult);knock(e,u.x,u.y,S.kb)}say('Whirlwind');return true}
  if(ready('quake')&&near(u.x,u.y,CHAMP_SK.quake.r,foes).length>=3){const S=pay('quake');B.rings.push({x:u.x,y:u.y-4,r:S.r,life:.45,max:.45,col:'200,160,110'});
    for(const e of near(u.x,u.y,S.r,foes)){hit(u,e,u.s.dmg*S.mult);stun(e,S.stun)}shakeIt(3);say('Earthquake');return true}
  if(ready('leap')&&!u.s.range){let best=null,bn=0;for(const e of foes){const n=near(e.x,e.y,CHAMP_SK.leap.r,foes).length,d=Math.hypot(e.x-u.x,e.y-u.y);if(d>40&&d<110&&n>bn){bn=n;best=e}}
    if(best&&bn>=2){pay('leap');C.leap={sx:u.x,sy:u.y,tx:clamp(best.x,8,BW-8),ty:clamp(best.y,18,BH-6),t:0};say('Leap Slam');return true}}
  const C2=CHAMP_SK.cry;
  if(ready('cry')&&near(u.x,u.y,C2.r,mine).length>=3&&foes.some(e=>Math.hypot(e.x-u.x,e.y-u.y)<C2.foe)){pay('cry');near(u.x,u.y,C2.r,mine).forEach(o=>o.buffT=Math.max(o.buffT||0,C2.buff));moraleCry(near(u.x,u.y,C2.r,mine));
    foes.forEach(e=>{if(!e.hero&&Math.hypot(e.x-u.x,e.y-u.y)<C2.foe*.9)stun(e,C2.stun)});B.rings.push({x:u.x,y:u.y-6,r:C2.r,life:.5,max:.5,col:'232,185,74'});say('WAR CRY',u.team?'#ff9a90':'#e8b94a');return true}
  return false;
}

/* the other side's command: as you command yours, the enemy's captain orders their army's groups (beasts just fight). Infantry advances in line and charges once the lines are close; archers hold behind their infantry
   and shoot, at your hero once the lines meet; cavalry swings round a flank and falls on your archers (or your hero). */
const FOE_GRPS=['e_inf','e_arc','e_cav'],FOE_CMD={think:.5,clash:70,behind:50,flankY:110,flankAt:40,flankMax:8,advance:22};
function foeGroupsInit(units,groups,opts){
  if(opts.tournament)return;
  // (a leader with the group of his kind: a chieftain marches with his infantry, a mounted lord leads the cavalry's flank)
  for(const u of units)if(u.team===1&&!(ST[u.type]&&ST[u.type].beast))u.grp='e_'+grpOf(u.s);
  for(const g of FOE_GRPS){const m=units.filter(u=>u.grp===g);if(!m.length)continue;
    const gr=groups[g]={order:g==='e_inf'?'advance':'hold',spread:false,ax:m.reduce((a,u)=>a+u.x,0)/m.length,ay:m.reduce((a,u)=>a+u.y,0)/m.length,foe:true,t:0,form:'line',face:Math.PI};
    m.forEach(u=>{u.sx=u.x-gr.ax;u.sy=u.y-gr.ay})}
}
// a captain's groups: the enemy's (team 1), and yours (team 0) when you hand your army to the AI (B.auto)
const CAPTAIN={1:{inf:'e_inf',arc:'e_arc',cav:'e_cav'},0:{inf:'inf',arc:'arc',cav:'cav',hero:'hero'}};
const captainOf=g=>g.startsWith('e_')?1:0;
// each moment: an advancing line's anchor moves toward the other army (the enemy's; yours under the AI)
function updateFoeGroups(dt){
  for(const g of [...FOE_GRPS,...(B.auto?['inf','arc','cav','hero']:[])]){const gr=B.groups[g];if(!gr||gr.order!=='advance'||!grpUnits(g).length)continue;
    const team=captainOf(g),other=B.units.filter(u=>u.team!==team&&u.hp>0&&!u.rout);if(!other.length)continue;
    const t=other.reduce((a,u)=>Math.hypot(u.x-gr.ax,u.y-gr.ay)<Math.hypot(a.x-gr.ax,a.y-gr.ay)?u:a),dx=t.x-gr.ax,dy=t.y-gr.ay,d=Math.hypot(dx,dy)||1;
    if(d>FOE_CMD.clash*.6){gr.ax=clamp(gr.ax+dx/d*FOE_CMD.advance*dt,8,BW-8);gr.ay=clamp(gr.ay+dy/d*FOE_CMD.advance*.5*dt,18,BH-6)}}
}
// twice a second, the captains' orders: the enemy's always; yours only with the AI in command (B.auto)
function command(dt){
  if(!B||(B.cmdT=(B.cmdT||0)-dt)>0)return;B.cmdT=FOE_CMD.think;
  captain(1);if(B.auto)captain(0);
}
// one side's captain: infantry advances in line, then charges once the lines are close; archers hold behind their infantry and
// shoot, at the other side's leader (your hero, or their lord) once the lines meet; cavalry swings round a flank and falls on the
// other side's archers (or its leader); your hero (under the AI) keeps behind the infantry until the lines meet, then fights
function captain(team){
  const N=CAPTAIN[team],foes=B.units.filter(u=>u.team!==team&&u.hp>0&&!u.rout);if(!foes.length)return;
  const mid=l=>({x:l.reduce((a,u)=>a+u.x,0)/l.length,y:l.reduce((a,u)=>a+u.y,0)/l.length}),M=mid(foes);
  const lead=team?(B.hero&&B.hero.hp>0?B.hero:null):foes.find(u=>u.leader)||null;
  const gap=l=>Math.min(...l.map(u=>Math.min(...foes.map(o=>Math.hypot(o.x-u.x,o.y-u.y)))));
  const inf=grpUnits(N.inf),arc=grpUnits(N.arc),cav=grpUnits(N.cav),G1=k=>B.groups[N[k]];
  const clash=inf.length?gap(inf)<FOE_CMD.clash:true;
  // infantry: in line until the lines are close, then at them
  if(inf.length){const g=G1('inf');if(clash){if(g.order!=='charge'){g.order='charge';g.tgt=null}}else if(g.order!=='advance'){g.order='advance';g.tgt=null}}
  // archers: behind their own line (or holding where they are), shooting; at the other side's leader once the lines meet
  if(arc.length){const g=G1('arc');
    if(inf.length){const I=mid(inf),dir=Math.sign(I.x-M.x)||1;g.order='hold';g.ax=clamp(I.x+dir*FOE_CMD.behind,8,BW-8);g.ay=clamp(I.y,18,BH-6)}
    g.tgt=clash&&lead&&arc.some(a=>Math.hypot(lead.x-a.x,lead.y-a.y)<=(a.s.range||0))?lead:null}
  // cavalry: round a flank, then onto the other side's archers, or its leader
  if(cav.length){const g=G1('cav');g.t=(g.t||0)+FOE_CMD.think;
    if(!g.flanked){const Cm=mid(cav),side=M.y<BH/2?1:-1;g.order='hold';g.ax=clamp(M.x,8,BW-8);g.ay=clamp(M.y+side*FOE_CMD.flankY,18,BH-6);
      if(Math.hypot(Cm.x-g.ax,Cm.y-g.ay)<FOE_CMD.flankAt||g.t>FOE_CMD.flankMax||gap(cav)<30)g.flanked=true}
    if(g.flanked){const arch=foes.filter(u=>u.s.range&&!u.hero);g.order='charge';g.tgt=arch.length?arch.reduce((a,u)=>Math.hypot(u.x-M.x,u.y-M.y)>Math.hypot(a.x-M.x,a.y-M.y)?u:a):lead}}
  // your hero, under the AI: just behind the infantry until the lines meet, then into the fight
  if(N.hero&&B.hero&&B.hero.hp>0){const g=G1('hero');
    if(clash||!inf.length){if(g.order!=='charge'){g.order='charge';g.tgt=null}}else{const I=mid(inf),dir=Math.sign(I.x-M.x)||1;g.order='hold';g.tgt=null;g.ax=clamp(I.x+dir*FOE_CMD.behind*.5,8,BW-8);g.ay=clamp(I.y,18,BH-6)}}
}
