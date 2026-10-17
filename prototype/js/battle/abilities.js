'use strict';
/* ---------- abilities in battle: one way for every caster (the list: data/abilities.js; who has which: Unit.actives,
   characters.js). Each caster pays from its own breath and mana: your hero from hers (heroState: her skill tree tunes each
   ability, abil), a champion (a companion, a lord, a chieftain) from its own (champ, commander.js). One cast for each ability,
   one chooser for the moment (chooseAbility), for your hero and every champion alike. ---------- */
const NO_TUNE={r:1,dmg:1,stun:0,dur:0};
// a caster's kit for an ability: its state (breath, mana, cooldowns, a leap or dash under way), the ability as it casts it (its
// tuning), how it strikes (your hero's blows can crit and train her), whether it can pay (keep: leave a little breath), and paying
function kitOf(u,id){
  if(u.hero){const X=heroState(),A=abil(id);return{u,st:X,A,sm:ABILITIES[id].magic?spellMul():1,hero:true,
    strike:(e,m,o)=>heroHit(e,m,o||{}),
    can:keep=>X.sp>=A.sp+(keep&&A.sp?CHAR_AI.keepSp:0)&&X.mp>=A.mp,
    pay:()=>{if(!spend(A.sp,A.mp))return false;if(A.mp)train('spell',1.5);return true}}}
  const C=champ(u),ch=u.unit&&u.unit.isChar?u.unit:null,sp=ch?ch.skill('spell'):0,A=ch?abilOf(ch.o,id,sp):{...ABILITIES[id],...NO_TUNE};
  return{u,st:C,A,sm:ABILITIES[id].magic?1+.04*sp:1,hero:false,
    strike:(e,m,o)=>{o=o||{};hit(u,e,u.s.dmg*m,o.dt);if(o.kb)knock(e,u.x,u.y,o.kb);if(o.stun)stun(e,o.stun)},
    can:keep=>C.sp>=A.sp+(keep&&A.sp?CHAR_AI.keepSp:0)&&C.mp>=A.mp,
    pay:()=>{if(C.sp<A.sp||C.mp<A.mp)return false;C.sp-=A.sp;C.mp-=A.mp;if(A.sp)C.spT=0;return true}}}
const foesOf=u=>B.units.filter(e=>e.team!==u.team&&e.hp>0);
const alliesOf=u=>B.units.filter(o=>o.team===u.team&&o.hp>0&&o!==u);
const withinOf=(x,y,r,list)=>list.filter(e=>Math.hypot(e.x-x,e.y-y)-(e.s.big?12:0)<=r);
// where it aims: your hero, where she aims (the cursor with the manual control, B.aiAim under command); a champion, at its target
const aimOf=(K,at,d)=>K.hero?aimPoint(d):at||{x:K.u.x+(K.u.face||1)*d,y:K.u.y};
const angleOf=(K,at)=>K.hero?B.aim:Math.atan2(at.y-K.u.y,at.x-K.u.x);
const castSay=(u,t,c)=>B.floats.push({x:u.x,y:u.y-28,t,life:.8,c:c||(u.team?'#ff9a90':'#9fc0ff')});
// each ability's cast: u, its kit K, where it aims (at)
const CAST={
  whirl(u,K){const A=K.A,re=u.s.reach||12;vfx({k:'swirl',x:u.x,y:u.y-6,r:(re+12)*A.r,a:0,life:.38,col:u.team?'#ffb0a0':'#ffe9a8'});vfxRing(u.x,u.y,(re+10)*A.r,dustCol(),.35);B.rings.push({x:u.x,y:u.y-6,r:(re+12)*A.r,life:.35,max:.35,col:u.team?'255,150,130':'255,236,170'});let n=0;
    for(const e of withinOf(u.x,u.y,(re+14)*A.r,foesOf(u))){K.strike(e,1.3*A.dmg,{kb:18});n++}
    if(n){if(K.hero)K.st.stop=.05;shakeIt(2)}},
  leap(u,K,at){const p=aimOf(K,at,80),dd=Math.hypot(p.x-u.x,p.y-u.y),m=Math.min(1,100/Math.max(1,dd));
    K.st.leap={sx:u.x,sy:u.y,tx:clamp(u.x+(p.x-u.x)*m,8,BW-8),ty:clamp(u.y+(p.y-u.y)*m,fieldTop(),fieldBot()),t:0,dur:.32};K.st.inv=.36},
  cry(u,K){const A=K.A,heartened=[];B.rings.push({x:u.x,y:u.y-6,r:90*A.r,life:.5,max:.5,col:'232,185,74'});
    for(const o of B.units){if(o.hp<=0)continue;const d=Math.hypot(o.x-u.x,o.y-u.y);if(o.team===u.team&&d<90*A.r){o.buffT=6+A.dur;heartened.push(o)}if(o.team!==u.team&&!o.hero&&d<70*A.r)stun(o,.8+A.stun)}moraleCry(heartened);
    vfxRing(u.x,u.y,70*A.r,'232,185,74',.5);vfxRing(u.x,u.y,100*A.r,'255,220,120',.7);for(const o of B.units)if(o.team===u.team&&o.hp>0&&Math.hypot(o.x-u.x,o.y-u.y)<90*A.r)vfxBurst(o.x,o.y-8,2,'#ffd25a',5,15,'ember',25);
    castSay(u,'WAR CRY',u.team?'#ff9a90':'#e8b94a');shakeIt(2)},
  quake(u,K){const A=K.A,R=50*A.r;vfxCracks(u.x,u.y,8,R*.7);vfxRing(u.x,u.y,R*1.2,'170,130,90',.55);vfxBurst(u.x,u.y,10,'#a88a60',30,90,'spark',40);for(let i=0;i<8;i++){const b=rnd(0,6.283);vfx({k:'dust',x:u.x+Math.cos(b)*R*.5,y:u.y+Math.sin(b)*R*.25,vx:Math.cos(b)*30,vy:Math.sin(b)*12,r:rnd(3,5),grow:12,life:rnd(.6,.9),col:dustCol()})}B.rings.push({x:u.x,y:u.y-4,r:R,life:.45,max:.45,col:'200,160,110'});fx(u.x,u.y,'#c8b48a',12);
    for(const e of withinOf(u.x,u.y,R,foesOf(u)))K.strike(e,.9*A.dmg,{kb:8,stun:.6+A.stun,dt:'blunt'});shakeIt(5)},
  dash(u,K,at){const a=angleOf(K,at||{x:u.x+1,y:u.y});K.st.dash={sx:u.x,sy:u.y,tx:clamp(u.x+Math.cos(a)*80,8,BW-8),ty:clamp(u.y+Math.sin(a)*80,fieldTop(),fieldBot()),t:0,dur:.2,hit:[],mult:1.1*K.A.dmg};
    K.st.inv=.25;u.face=Math.cos(a)>=0?1:-1},
  volley(u,K,at){const A=K.A;if(K.hero)goodTake('arrows',4);const c=aimOf(K,at,130);
    for(let k=0;k<8;k++){const an=Math.random()*6.283,rr=Math.random()*28*A.r,px=c.x+Math.cos(an)*rr,py=c.y+Math.sin(an)*rr;
      fireBolt(u,Math.atan2(py-u.y,px-u.x),u.s.dmg*.7*A.dmg,{...u.s,magic:false,flat:false,bolt:'#ffe08a',heroShot:K.hero,dt:'pierce'},Math.hypot(px-u.x,py-u.y),{exact:true,speed:ARC_SPEED*(1.1+Math.random()*.3)})}},
  fireball(u,K,at){const A=K.A;fireBolt(u,angleOf(K,at),u.s.dmg*2*A.dmg*K.sm,{...u.s,range:140,magic:true,bolt:'#ff7a30',splash:32*A.r,splashMul:.7,dt:'fire'},K.hero?cursorDist(u):Math.hypot(at.x-u.x,at.y-u.y))},
  nova(u,K){const A=K.A,R=60*A.r;vfxRing(u.x,u.y,R,'190,230,255',.5);vfx({k:'glow',x:u.x,y:u.y-6,r:R*.6,life:.3,col:'#bfe6ff'});vfxBurst(u.x,u.y-4,18,'#e4f6ff',80,170,'spark');for(let i=0;i<24;i++){const b=rnd(0,6.283),d=rnd(6,R);vfx({k:'frost',x:u.x+Math.cos(b)*d,y:u.y+Math.sin(b)*d*.5,life:rnd(2,3.5)})}B.rings.push({x:u.x,y:u.y-6,r:R,life:.5,max:.5,col:'150,210,255'});
    for(const e of withinOf(u.x,u.y,R,foesOf(u))){K.strike(e,.7*A.dmg*K.sm,{kb:4,dt:'frost'});e.slow=Math.max(e.slow||0,3+A.dur)}},
  heal(u,K){const A=K.A;u.hp=Math.min(u.max,u.hp+u.max*.3*A.dmg*K.sm);B.rings.push({x:u.x,y:u.y-6,r:90*A.r,life:.5,max:.5,col:'140,230,140'});
    for(const o of alliesOf(u))if(Math.hypot(o.x-u.x,o.y-u.y)<90*A.r){o.hp=Math.min(o.max,o.hp+o.max*.2*A.dmg*K.sm);vfxBurst(o.x,o.y-6,3,'#9af09a',3,10,'ember',30)}
    vfxBurst(u.x,u.y-8,10,'#b8ffb0',5,20,'ember',35);vfx({k:'glow',x:u.x,y:u.y-8,r:18,life:.35,col:'#8ae08a'});castSay(u,'HEAL','#8ae08a')},
  banner(u,K){const A=K.A,R=100*A.r,T=8+A.dur;B.banner={x:u.x,y:u.y,r:R,t:T,team:u.team};
    for(const o of B.units)if(o.team===u.team&&o.hp>0&&Math.hypot(o.x-u.x,o.y-u.y)<R)o.wardT=T;vfxRing(u.x,u.y,R*.8,'232,185,74',.6);vfxBurst(u.x,u.y-14,12,'#ffe08a',10,40,'ember',30);castSay(u,'BANNER','#e8b94a')}
};
// cast it: paid and cooled down, or false (your hero's own checks first: combat.js castSkill)
function castAbility(u,id,at){
  const K=kitOf(u,id);if(K.st.cds[id]>0||!K.pay())return false;K.st.cds[id]=K.A.cd;CAST[id](u,K,at);
  if(!K.hero&&!['cry','heal','banner'].includes(id))castSay(u,ABILITIES[id].n);return true}
// a leap or a dash under way (your hero's and a champion's): true while it lasts
function leapStep(u,st,dt){
  const L=st.leap;L.t+=dt;const p=Math.min(1,L.t/L.dur);if(Math.random()<.6)vfxGhost(u);u.x=L.sx+(L.tx-L.sx)*p;u.y=L.sy+(L.ty-L.sy)*p;u.z=Math.sin(Math.PI*p)*16;
  if(p>=1){st.leap=null;u.z=0;const K=kitOf(u,'leap'),A=K.A,R=34*A.r;B.rings.push({x:u.x,y:u.y-4,r:R,life:.4,max:.4,col:'255,190,90'});vfxCracks(u.x,u.y,6,R*.8);vfxRing(u.x,u.y,R*1.1,'190,160,110',.5);for(let i=0;i<10;i++){const b=rnd(0,6.283);vfx({k:'dust',x:u.x,y:u.y,vx:Math.cos(b)*rnd(40,90),vy:Math.sin(b)*rnd(15,35),r:rnd(2,4),grow:12,life:rnd(.5,.8),col:dustCol()})}
    let n=0;for(const e of withinOf(u.x,u.y,R,foesOf(u))){K.strike(e,1.5,{kb:14,stun:1+A.stun,dt:'blunt'});n++}shakeIt(4);if(n&&K.hero)st.stop=.06}
  return true}
function dashStep(u,st,dt){
  const D=st.dash,K=kitOf(u,'dash');D.t+=dt;vfxGhost(u);const p=Math.min(1,D.t/D.dur);u.x=D.sx+(D.tx-D.sx)*p;u.y=D.sy+(D.ty-D.sy)*p;fx(u.x,u.y,'#e8e4d0',1);
  for(const e of foesOf(u))if(!D.hit.includes(e)&&Math.hypot(e.x-u.x,e.y-u.y)-(e.s.big?12:0)<14){D.hit.push(e);K.strike(e,D.mult,{kb:10})}
  if(p>=1)st.dash=null;return true}
// when each fits (in the order they are weighed): a point to aim at, true (where it stands), or nothing. c: the moment
const ABILITY_WHEN={
  heal:(u,K,c)=>u.hp<u.max*.45||c.mine.filter(o=>o.hp<o.max*.5&&Math.hypot(o.x-u.x,o.y-u.y)<90*K.A.r).length>=3,
  whirl:(u,K,c)=>c.near(u.x,u.y,((u.s.reach||12)+14)*K.A.r,c.foes)>=2,
  quake:(u,K,c)=>c.near(u.x,u.y,50*K.A.r,c.foes)>=3,
  nova:(u,K,c)=>c.near(u.x,u.y,60*K.A.r,c.foes)>=3,
  leap:(u,K,c)=>{const k=c.knot(34*K.A.r),dd=k&&Math.hypot(k.x-u.x,k.y-u.y);return k&&k.n>=2&&dd>40&&dd<110?k:null},
  dash:(u,K,c)=>c.d>30&&c.d<85?c.close:null,
  fireball:(u,K,c)=>{const k=c.knot(32*K.A.r);return k&&(k.n>=2||c.d>60)&&Math.hypot(k.x-u.x,k.y-u.y)<140?k:null},
  volley:(u,K,c)=>{const k=c.knot(28*K.A.r);return k&&k.n>=3&&Math.hypot(k.x-u.x,k.y-u.y)<200?k:null},
  cry:(u,K,c)=>c.near(u.x,u.y,90*K.A.r,c.mine)>=4&&c.d<120,
  banner:(u,K,c)=>!B.banner&&c.near(u.x,u.y,100*K.A.r,c.mine)>=5&&c.d<150
};
const ABILITY_ORDER=['heal','whirl','quake','nova','leap','dash','fireball','volley','cry','banner'];
// a bow in hand: your hero's weapon, a champion's kind
const hasBow=u=>u.hero?isBow():!!u.s.range;
// the ability that fits the moment, of those this unit has, ready and paid for; cast it. True if cast
function chooseAbility(u){
  if(u.grp&&relocating(u,B.groups[u.grp]))return false;// (on the move: actors.js)
  const ids=u.unit?u.unit.actives():[];if(!ids.length)return false;const foes=foesOf(u);if(!foes.length)return false;
  const mine=alliesOf(u),near=(x,y,r,list)=>withinOf(x,y,r,list).length;
  const close=foes.reduce((a,e)=>Math.hypot(e.x-u.x,e.y-u.y)<Math.hypot(a.x-u.x,a.y-u.y)?e:a),d=Math.hypot(close.x-u.x,close.y-u.y);
  const knot=r=>{let best=null,bn=0;for(const e of foes){const n=near(e.x,e.y,r,foes);if(n>bn){bn=n;best=e}}return best&&{x:best.x,y:best.y,n:bn}};
  const c={foes,mine,near,close,d,knot};
  for(const id of ABILITY_ORDER){if(!ids.includes(id))continue;const S=ABILITIES[id],K=kitOf(u,id);
    if(K.st.cds[id]>0||!K.can(true)||S.melee&&hasBow(u)||S.needs==='bow'&&(!hasBow(u)||K.hero&&goodN('arrows')<4))continue;
    const at=ABILITY_WHEN[id](u,K,c);if(!at)continue;const p=at===true?null:at;
    if(K.hero){if(p)aimAt(u,p);castSkill(id);return K.st.cds[id]>0}
    return castAbility(u,id,p||{x:close.x,y:close.y})}
  return false}
