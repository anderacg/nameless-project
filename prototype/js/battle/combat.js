'use strict';
/* ---------- hero combat: combo chain, dodge roll, skills ---------- */
// three-step chains. Each step has a shape, which sets both its hitbox and how it looks:
//   arc    a sweep of half-angle arc out to the reach (dir: which way the blade travels)
//   thrust a straight line reach long and wid wide that pierces everyone along it (each one behind takes a little less)
//   twin   two thrusts in a V
//   slam   a circle of radius area on the ground ahead
//   spin   all the way round
// sp scales the stamina each step costs; keep attacking inside the window to advance; the last step is the finisher
const CW=(n,shape,mult,reach,cd,kb,x)=>({n,shape,mult,reach,cd,kb,arc:1.1,wid:5,area:12,dir:1,col:'255,255,255',w:3,...x});
const CFIN={col:'255,190,90',w:5,stop:.07,shake:3};
// the sword: two sweeping cuts around one quick riposte
const COMBO=[CW('Slash','arc',1,0,.34,6,{arc:1.15}),CW('Riposte','thrust',1.1,6,.3,9,{wid:5,col:'255,236,170',w:2}),CW('Cleave','arc',1.9,8,.62,26,{arc:1.9,dir:-1,stun:.6,...CFIN})];
const COMBOS={
  one:COMBO,
  dagger:Object.assign([CW('Stab','thrust',.8,-2,.22,3,{wid:4,w:2}),CW('Slice','arc',.85,-2,.22,4,{arc:.8,dir:-1}),CW('Gut','thrust',1.6,0,.4,12,{wid:4,stun:.4,...CFIN,shake:2})],{sp:.7}),
  dual:Object.assign([CW('Left','arc',.8,0,.26,4,{arc:1.2}),CW('Right','arc',.8,0,.26,4,{arc:1.2,dir:-1}),CW('Twin Strike','twin',1.7,4,.5,18,{wid:5,stun:.4,...CFIN})],{sp:.9}),
  axe:Object.assign([CW('Chop','slam',1.1,4,.36,8,{area:9}),CW('Hack','arc',1.05,0,.32,8,{arc:1.1,dir:-1}),CW('Rend','arc',1.9,6,.6,24,{arc:1.6,stun:.5,...CFIN})],{sp:1.05}),
  heavy:Object.assign([CW('Cleave','arc',1.35,2,.5,12,{arc:1.6}),CW('Reverse Cleave','arc',1.45,2,.5,14,{arc:1.6,dir:-1}),CW('Whirl','spin',2.2,6,.85,30,{stun:.6,...CFIN,shake:4})],{sp:1.4}),
  hammer:Object.assign([CW('Overhead','slam',1.45,6,.55,14,{area:12,stun:.35}),CW('Swing','arc',1.3,2,.5,16,{arc:1.3}),CW('Crush','slam',2.5,8,.85,34,{area:22,stun:.8,...CFIN,stop:.09,shake:5})],{sp:1.4}),
  thrust:Object.assign([CW('Thrust','thrust',1.05,12,.32,6,{wid:5}),CW('Sweep','arc',.95,10,.36,10,{arc:.7}),CW('Lunge','thrust',1.9,22,.6,24,{wid:6,stun:.5,...CFIN})],{sp:1}),
  phalanx:Object.assign([CW('Jab','thrust',.95,9,.3,5,{wid:4}),CW('Jab','thrust',.95,9,.3,5,{wid:4}),CW('Drive','thrust',1.6,14,.55,20,{wid:5,stun:.4,...CFIN})],{sp:.9})
};
const COMBO_WINDOW=.75,DODGE_CD=1.1;
const isHammer=m=>m.base==='warhammer'||m.icon==='club';
/* the combo grows with practice in the discipline of the weapon you fight with (One-Handed or Two-Handed): two blows to begin
   with; a third, the finisher, at COMBO_UP.third; and at COMBO_UP.fin you choose its style (P.fin): stunning (a long stun, a
   small push) or crushing (a hard push, no stun). Until then the finisher is a weaker one (FIN_BASE). */
const COMBO_UP={third:3,fin:6},FIN_BASE={mult:.85,stun:.5,kb:.6},FIN_STYLE={stun:{mult:.9,stun:1.6,kb:.4},push:{mult:.9,stun:0,kb:1.9}};
const comboBlows=()=>skill(meleeSk())>=COMBO_UP.third?3:2;
const finReady=()=>skill(meleeSk())>=COMBO_UP.fin;
function heroCombo(){const C=weaponCombo(),n=comboBlows(),F=FIN_STYLE[P.fin]||FIN_BASE;
  const out=C.slice(0,n).map((c,i)=>i<2?c:{...c,mult:+(c.mult*F.mult).toFixed(2),stun:+((c.stun||.4)*F.stun).toFixed(2),kb:Math.round(c.kb*F.kb)});return Object.assign(out,{sp:C.sp})}
function weaponCombo(){const m=mainI(),g=grip();if(g==='dual')return COMBOS.dual;if(!m)return COMBO;if(m.base==='dagger'||m.icon==='dagger')return COMBOS.dagger;
  if(m.base==='spear'||m.tag==='spear')return g==='two'?COMBOS.thrust:COMBOS.phalanx;if(isHammer(m))return COMBOS.hammer;if(m.hand==='two')return COMBOS.heavy;if(m.base==='axe')return COMBOS.axe;return COMBO}
// how each shape looks on the hero's body: a swing, a thrust or an overhead blow
const STYLE={arc:'swing',spin:'swing',thrust:'thrust',twin:'thrust',slam:'overhead'};
// is e inside step c's hitbox, from (x,y) aiming at a with reach R?
function inShape(x,y,a,R,c,e){
  const dx=e.x-x,dy=e.y-y,big=e.s.big?12:0,along=(o)=>dx*Math.cos(a+o)+dy*Math.sin(a+o),perp=(o)=>Math.abs(-dx*Math.sin(a+o)+dy*Math.cos(a+o));
  if(c.shape==='spin')return Math.hypot(dx,dy)-big<=R+5;
  if(c.shape==='slam')return Math.hypot(e.x-(x+Math.cos(a)*R*.6),e.y-(y+Math.sin(a)*R*.6))-big<=c.area;
  if(c.shape==='thrust')return along(0)>-4&&along(0)<=R+5+big&&perp(0)<=c.wid+big*.6;
  if(c.shape==='twin')return [-.28,.28].some(o=>along(o)>-4&&along(o)<=R+5+big&&perp(o)<=c.wid+big*.6);
  const d=Math.hypot(dx,dy)-big;if(d>R+5)return false;const ea=Math.atan2(dy,dx);return angGap(ea,a)<c.arc;
}
// stamina pays for physical effort, mana for skills; some skills need both
// (regen, delay: the manual control's breath, set aside. Under RTS command your stamina comes back as a soldier's does: fatigue.js)
// mana comes back in battle only with the talents for it (mpRegen: MANA_REGEN a second at +100%); health only by a skill, a talent or gear
const STAM={swing:[8,8,14],dodge:22,sprint:20,regen:18,delay:.6,guard:1.2},MANA_REGEN=2.5,SPRINT_MUL=1.6;
const maxSP=()=>60+P.attr.agi*5+P.level*2+tm('sp')+4*skill('athl'),maxMP=()=>Math.round((30+P.attr.int*6+P.level*2+gm('mp'))*(1+tm('mpPct')));
// health, stamina and mana persist between battles; null means full (a new hero or an old save)
function vitals(){
  const m=[heroStats().hp,maxSP(),maxMP()];
  if(P.hp==null)P.hp=m[0];if(P.sp==null)P.sp=m[1];if(P.mp==null)P.mp=m[2];
  P.hp=clamp(P.hp,0,m[0]);P.sp=clamp(P.sp,0,m[1]);P.mp=clamp(P.mp,0,m[2]);return m;
}
// recovery on the map, per day of travel: health 20% (+3% per Medicine level), stamina 50%, mana 35%; doubled near a holding
const REGEN_DAY={hp:.2,sp:.5,mp:.35};
function regenVitals(days){
  const m=vitals(),sh=TOWNS.some(t=>Math.hypot(t.x-P.x,t.y-P.y)<48)?2:1;
  P.hp=Math.min(m[0],P.hp+m[0]*(REGEN_DAY.hp+.03*skill('med'))*sh*days);P.sp=Math.min(m[1],P.sp+m[1]*REGEN_DAY.sp*sh*days);P.mp=Math.min(m[2],P.mp+m[2]*REGEN_DAY.mp*sh*days);
}
const restoreVitals=()=>{const m=vitals();P.hp=m[0];P.sp=m[1];P.mp=m[2]};
// Active skills: each is learned on the skill tree (learn: the node) and cast from a skill slot (keys 1 to 0).
// magic: its power grows with Spellcraft; needs: a weapon requirement.
// your hero's active skills: the actives of the one ability list (data/abilities.js), each learned on its node of the tree
const HSKILLS=Object.fromEntries(Object.entries(ABILITIES).filter(([k,a])=>a.kind==='active'));
const SLOT_KEYS=['1','2','3','4','5','6','7','8','9','0'];
const spellMul=()=>1+.04*skill('spell');
// the point you aim at: the cursor, or ahead of you without a mouse
// (under RTS command your hero aims where they choose: B.aiAim, commander.js aimAt)
const aimPoint=d=>B.aiAim?{x:B.aiAim.x,y:B.aiAim.y}:G.mouse.in&&G.mouse.type==='mouse'?{x:G.mouse.x,y:G.mouse.y+6}:{x:B.hero.x+Math.cos(B.aim)*d,y:B.hero.y+Math.sin(B.aim)*d};
function castSlot(i){const id=(P.slots||[])[i];if(id)castSkill(id)}
// per-battle hero action state
function heroState(){return B.hx||(vitals(),B.hx={sp:P.sp,mp:P.mp,spT:9,step:-1,win:0,buf:false,roll:0,rollCd:0,inv:0,rx:0,ry:0,leap:null,dash:null,cds:Object.fromEntries(Object.keys(HSKILLS).map(k=>[k,0])),combo:0,comboT:0,stop:0})}
const heroBusy=X=>X.roll>0||!!X.leap||!!X.dash;
const costText=S=>[S.mp?S.mp+' MP':'',S.sp?S.sp+' SP':''].filter(Boolean).join(' · ');
// pay stamina and mana together, or neither; says why when short
function spend(sp,mp){
  const X=heroState(),h=B.hero;
  // (the warning is for the manual control: under RTS command your hero never tries what they cannot pay: commander.js)
  if(X.sp<sp){if(MANUAL_HERO)B.floats.push({x:h.x,y:h.y-26,t:'Too tired',life:.6,c:'#9aa3ad'});return false}
  if(X.mp<mp){if(MANUAL_HERO)B.floats.push({x:h.x,y:h.y-26,t:'Not enough mana',life:.6,c:'#6a9cf0'});return false}
  X.sp-=sp;X.mp-=mp;if(sp)X.spT=0;return true;
}
// a blocked hit drains stamina; with none left the guard breaks and the hit lands in full
function guard(dm){
  const X=heroState(),h=B.hero;if(X.sp<=0){B.floats.push({x:h.x,y:h.y-18,t:'Guard broken',life:.6,c:'#e8675f'});return false}
  X.sp=Math.max(0,X.sp-dm*STAM.guard*(1-.03*skill('block')));X.spT=0;train('block',1);return true;
}
// what share of a blocked hit still lands: shieldwall, gear and Blocking lower it
const blockMul=()=>Math.max(.05,(has('shieldwall')?.1:.2)-gm('block')-.01*skill('block'));
function knock(u,ox,oy,f){if(!f||u.hp<=0)return;const a=Math.atan2(u.y-oy,u.x-ox),k=PHYSICS.on?1/physMass(u):u.s.big?.2:1;// (physics: by his mass)
  u.kx=(u.kx||0)+Math.cos(a)*f*6*k;u.ky=(u.ky||0)+Math.sin(a)*f*6*k}
function stun(u,t){u.stun=Math.max(u.stun||0,u.s.big?t*.4:t)}
// one hero blow on one enemy: matchup, crit, knockback, stagger, combo count
function heroHit(e,mult,o){
  const h=B.hero,X=heroState(),dt=o.dt||shapeDt(o.shape,h.s.dt),mu=matchup(h.s,e.s,dt);let dm=h.s.dmg*(.85+Math.random()*.3)*mu*mult*(h.buffT>0?1.3:1)*(MANUAL_HERO?1:tiredMul(h).dmg);
  if(!o.noCrit&&Math.random()<(has('bloodlust')?.2:.1)+gm('crit')){dm*=1.8;B.floats.push({x:e.x,y:e.y-22,t:'Crit',life:.6,c:'#ffd24a'})}
  applyDmg(e,dm*formTaken(e,h),mu,dt,h,false);vfxHit(h,e,dm,{crit:dm>h.s.dmg*1.7});train(meleeSk(),2);
  knock(e,h.x,h.y,o.kb||0);if(o.stun)stun(e,o.stun);
  X.combo++;X.comboT=2.2;B.bestCombo=Math.max(B.bestCombo||0,X.combo);// (the longest chain: told in the log when the battle ends)
}
// with a bow or a staff the attack shoots instead: arrows cost stamina, bolts cost mana and splash
const SHOT={ranged:{sp:7,mp:0,cd:.62,mult:.95},magic:{sp:0,mp:7,cd:.78,mult:1.15}};
// The bow: hold to draw, let go to shoot. Power builds over DRAW_TIME and makes the arrow faster, farther and harder;
// once fully drawn, holding on drains stamina (BOW_HOLD a second), and when it runs out your arm gives out and the arrow goes weak.
// The mouse wheel sets the range you shoot at (the cursor only sets the direction); a weak draw falls short of it.
// The Hawkeye talent (Finesse) shows the arrow's path and landing spot.
const DRAW_TIME=.9,BOW_HOLD=14,BOW_RANGE=[30,560];
const isBow=()=>heroKind()==='ranged'&&!heroShot().flat;
const bowRange=()=>G.bowRange||240;
const aimReach=p=>60+440*p*p;// (a weak draw falls well short)
function bowRangeStep(step){G.bowRange=clamp(bowRange()+step,BOW_RANGE[0],BOW_RANGE[1])}
function drawStart(){if(!B||B.over||B.draw)return;const h=B.hero,X=heroState();if(!h||h.hp<=0||B.blocking||heroBusy(X)||h.cd>0||!haveAmmo())return;B.draw={t:0}}
function drawRelease(force){if(!B||!B.draw)return;const p=force!=null?force:clamp(B.draw.t/DRAW_TIME,.15,1);B.draw=null;shoot('ranged',p)}
// holding a full draw: stamina drains; at zero the arm gives out
function drawHold(dt){
  const X=heroState(),h=B.hero;B.draw.t+=dt;if(B.draw.t<DRAW_TIME)return;
  X.sp=Math.max(0,X.sp-BOW_HOLD*dt);X.spT=0;
  if(X.sp<=0){B.floats.push({x:h.x,y:h.y-28,t:'Arm gives out',life:.8,c:'#9aa3ad'});X.sp=heroShot().sp;drawRelease(.35)}
}
// the cursor's distance from the hero, or a middling shot without a mouse
const cursorDist=h=>B.aiAim?Math.hypot(B.aiAim.x-h.x,B.aiAim.y-h.y):G.mouse.in&&G.mouse.type==='mouse'?Math.hypot(G.mouse.x-h.x,G.mouse.y+6-h.y):150;
// where the shot you are drawing will land, and how high it climbs on the way
function bowLanding(p){const h=B.hero;if(!h)return null;const d=Math.min(bowRange(),aimReach(p));return{x:h.x+Math.cos(B.aim)*d,y:h.y+Math.sin(B.aim)*d,d,H:Math.min(44,d*d/700)}}
// a bow shoots arrows, a crossbow bolts; magic needs none
const ammoOf=()=>{const w=P.gear.weapon&&ITEMS[P.gear.weapon];return w&&w.base==='crossbow'?'bolts':w&&w.base==='bow'?'arrows':null};
function haveAmmo(){const a=ammoOf();if(!a||goodN(a)>0)return true;if(B&&B.hero)B.floats.push({x:B.hero.x,y:B.hero.y-26,t:'Out of '+GOODS[a].n.toLowerCase(),life:.8,c:'#ff9a90'});return false}
const heroShot=()=>{const w=P.gear.weapon&&ITEMS[P.gear.weapon];return w&&w.shot||SHOT[heroKind()]||SHOT.ranged};
function shoot(kind,power){
  const h=B.hero,X=heroState(),S=heroShot();if(h.cd>0){X.buf=true;return}X.buf=false;if(!haveAmmo()||!spend(S.sp,S.mp))return;
  const am=ammoOf();if(am){goodTake(am,1);B.fired=(B.fired||0)+1}
  h.cd=S.cd*(h.s.cd/.45);h.atkAt=B.t;h.face=Math.cos(B.aim)>=0?1:-1;
  const dmg=h.s.dmg*S.mult*(.9+Math.random()*.2)*(h.buffT>0?1.3:1)*(kind==='magic'?spellMul():1+.04*skill('archery')),src={...h.s,bolt:'#ffe08a',flat:!!S.flat,heroShot:true};if(kind==='magic')train('spell',.5);
  // (as true as any shooter's: attacks.js aimErr, by their skill, their bow and their draw)
  if(kind==='ranged'&&!S.flat){const p=power==null?.75:power,dm=dmg*(.55+.6*p),E=aimErr(h,p);
    const dd=Math.min(bowRange(),aimReach(p));fireBolt(h,B.aim+spreadOf(E),dm,src,dd,{speed:ARC_SPEED*(.8+dd/250)*(.6+.4*p),sc:E.d});return}
  fireBolt(h,B.aim+spreadOf(aimErr(h)),dmg,src,cursorDist(h));
}
function swing(){
  if(!B||B.over)return;const h=B.hero,X=heroState();if(!h||h.hp<=0||B.blocking||heroBusy(X))return;
  const kind=heroKind();if(kind!=='melee')return shoot(kind);
  if(h.cd>0){X.buf=true;return}
  const CB=heroCombo();X.buf=false;const step=X.win>0?(X.step+1)%CB.length:0;if(!spend(MANUAL_HERO?Math.round(STAM.swing[step]*(CB.sp||1)):0,0)){X.win=0;return}
  if(!MANUAL_HERO)staSpend(h,blowSta(step,CB));// (under RTS command a blow costs what a soldier's does; tired, it lands softer: heroHit)
  X.step=step;const c=CB[step];
  h.cd=c.cd*(h.s.cd/.45);X.win=h.cd+COMBO_WINDOW;h.swing=.18;h.atkAt=B.t;h.atkStyle=STYLE[c.shape];h.face=Math.cos(B.aim)>=0?1:-1;
  // thrusts step in, sweeps lean in, slams and spins plant the feet
  const lean=c.shape==='thrust'||c.shape==='twin'?(c.reach>15?8:5):c.shape==='arc'?3:0;
  h.x=clamp(h.x+Math.cos(B.aim)*lean,8,BW-8);h.y=clamp(h.y+Math.sin(B.aim)*lean,fieldTop(),fieldBot());
  const R=h.s.reach+c.reach,life=c.shape==='slam'||c.shape==='spin'?.32:.2;
  B.slashes.push({kind:c.shape,x:h.x,y:h.y-6,a:B.aim,life,max:life,arc:c.arc,r:R,col:c.col,w:c.w,dir:c.dir,area:c.area,wid:c.wid});
  if(c.shape==='slam'){const cx=h.x+Math.cos(B.aim)*R*.6,cy=h.y+Math.sin(B.aim)*R*.6;fx(cx,cy,'#a89a78',8)}
  // a thrust pierces: everyone along the line, each one behind for a little less
  const hits=B.units.filter(e=>e.team===1&&e.hp>0&&inShape(h.x,h.y,B.aim,R,c,e)).sort((p,q)=>Math.hypot(p.x-h.x,p.y-h.y)-Math.hypot(q.x-h.x,q.y-h.y));
  const pierce=c.shape==='thrust'||c.shape==='twin';let n=0;
  for(const e of hits){heroHit(e,c.mult*(pierce?Math.max(.5,1-.2*n):1),c);n++}
  if(n&&c.stop){X.stop=c.stop;shakeIt(c.shake)}
  if(n&&X.step===2)B.floats.push({x:h.x,y:h.y-28,t:c.n,life:.6,c:'#ffb04a'});
  return n;
}
// right-click: a quick shove that knocks enemies in front back and staggers them, for very little damage
const SHOVE={sp:8,cd:.7,mult:.25,kb:30,stun:.35},BASH={sp:10,cd:.8,mult:.5,kb:40,stun:.7};
// (Shove needs a bow in hand, Shield Bash a shield; other grips have neither)
const shoveKind=()=>grip()==='shield'?'bash':isBow()?'shove':null;
function shove(){
  if(!B||B.over||!shoveKind())return;const h=B.hero,X=heroState();if(!h||h.hp<=0||heroBusy(X)||(X.shoveCd||0)>0)return;if(!spend((grip()==='shield'?BASH:SHOVE).sp,0))return;
  const S=grip()==='shield'?BASH:SHOVE;X.shoveCd=S.cd;B.draw=null;h.face=Math.cos(B.aim)>=0?1:-1;h.atkAt=B.t;if(S===BASH)B.floats.push({x:h.x,y:h.y-26,t:'Shield Bash',life:.6,c:'#cfe0ff'});
  B.slashes.push({x:h.x,y:h.y-6,a:B.aim,life:.15,r:h.s.reach+2,arc:.9,col:'200,220,255',w:2});
  for(const e of B.units){if(e.team!==1||e.hp<=0)continue;const d=Math.hypot(e.x-h.x,e.y-h.y)-(e.s.big?12:0),ea=Math.atan2(e.y-h.y,e.x-h.x),df=angGap(ea,B.aim);
    if(d<=h.s.reach+6&&df<1.1)heroHit(e,S.mult,{kb:S.kb,stun:S.stun,noCrit:true,dt:'blunt'})}
}
function dodge(dirX,dirY){
  if(!B||B.over)return;const h=B.hero,X=heroState();if(!h||h.hp<=0||X.rollCd>0||X.leap)return;
  const k=G.keys;let dx=dirX!=null?dirX:(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0),dy=dirY!=null?dirY:(k.s||k.arrowdown?1:0)-(k.w||k.arrowup?1:0);
  if(!spend(dodgeCost(),0))return;
  if(!dx&&!dy){dx=Math.cos(B.aim);dy=Math.sin(B.aim)}const l=Math.hypot(dx,dy);
  X.rx=dx/l;X.ry=dy/l;X.roll=.24;X.inv=.3;X.rollCd=dodgeCd();train('athl',1.5);X.buf=false;fx(h.x,h.y,'#c8b48a',6);
}
function castSkill(id){
  if(!B||B.over)return;const h=B.hero,X=heroState(),S=HSKILLS[id];if(!h||h.hp<=0||heroBusy(X))return;
  if(!knows(id)){B.floats.push({x:h.x,y:h.y-26,t:'Learn '+S.n+' on the skill tree',life:.9,c:'#98a0ba'});return}
  if(S.needs==='bow'&&(!isBow()||goodN('arrows')<4)){B.floats.push({x:h.x,y:h.y-26,t:S.n+' needs a bow and 4 arrows',life:.9,c:'#98a0ba'});return}
  castAbility(h,id);// (one cast for every caster: battle/abilities.js)
}
// called from updateHero with the hero's own time step; returns true while a roll or leap owns the hero's movement
function heroActions(dt){
  const h=B.hero,X=heroState();
  for(const k in X.cds)X.cds[k]=Math.max(0,X.cds[k]-dt);
  if(B.draw){if(!isBow())B.draw=null;else drawHold(dt)}
  X.shoveCd=Math.max(0,(X.shoveCd||0)-dt);
  X.spT+=dt;if(MANUAL_HERO&&X.spT>STAM.delay)X.sp=Math.min(maxSP(),X.sp+STAM.regen*(1+tm('spRegen'))*dt);X.mp=Math.min(maxMP(),X.mp+MANA_REGEN*tm('mpRegen')*dt);
  X.rollCd=Math.max(0,X.rollCd-dt);X.inv=Math.max(0,X.inv-dt);X.win=Math.max(0,X.win-dt);
  if(X.comboT>0&&(X.comboT-=dt)<=0)X.combo=0;
  if(B.banner&&(B.banner.t-=dt)<=0)B.banner=null;
  if(X.dash)return dashStep(h,X,dt);if(X.leap)return leapStep(h,X,dt);// (a dash or a leap under way: battle/abilities.js)
  if(X.roll>0){X.roll-=dt;h.x=clamp(h.x+X.rx*170*dt,8,BW-8);h.y=clamp(h.y+X.ry*170*dt,fieldTop(),fieldBot());h.face=X.rx>=0?1:-1;return true}
  if(X.buf&&h.cd<=0)swing();
  return false;
}
/* drawing: the bow's draw and the skill bar on the battle screen; skill buttons in the battle bar */
function drawHeroHud(){
  const X=B.hx;if(!X)return;
  if(isBow()&&B.hero&&B.hero.hp>0){const h=B.hero,p=B.draw?clamp(B.draw.t/DRAW_TIME,.15,1):null,L=bowLanding(p==null?.75:p);
    if(B.draw){ctx.fillStyle='#000';ctx.fillRect(Math.round(h.x)-11,Math.round(h.y)-27,22,4);ctx.fillStyle=p>=1?'#ffe08a':'#e8b94a';ctx.fillRect(Math.round(h.x)-10,Math.round(h.y)-26,Math.round(20*p),2)}
    if(L&&has('guide')){const a=B.draw?.9:.35;ctx.fillStyle='rgba(255,224,138,'+a+')';
      for(let k=1;k<12;k++){const f=k/12;ctx.fillRect(Math.round(h.x+(L.x-h.x)*f)-1,Math.round(h.y+(L.y-h.y)*f-4-4*L.H*f*(1-f))-1,2,2)}
      ctx.strokeStyle='rgba(255,224,138,'+a+')';ctx.lineWidth=1;const lx=Math.round(L.x)+.5,ly=Math.round(L.y)+.5;ctx.beginPath();ctx.moveTo(lx-3,ly-3);ctx.lineTo(lx+3,ly+3);ctx.moveTo(lx+3,ly-3);ctx.lineTo(lx-3,ly+3);ctx.stroke()}
    txt('BOW · '+goodN('arrows')+' arrows · range '+bowRange()+' (wheel)'+(B.draw&&B.draw.t>=DRAW_TIME?' · holding drains stamina':'')+(has('guide')?'':' · learn Hawkeye for a guide'),6,VH-36,B.draw&&B.draw.t>=DRAW_TIME?'#ffb04a':'#e8d8a0');}
  // stamina and mana under the health bar (with the manual control; under RTS command, in the hero's details: battlehud.js)
  if(MANUAL_HERO){ctx.fillStyle='#000';ctx.fillRect(5,20,62,4);ctx.fillRect(5,25,62,4);
    ctx.fillStyle=X.spT<STAM.delay?'#c8a24a':'#78c474';ctx.fillRect(6,21,Math.round(60*X.sp/maxSP()),2);
    ctx.fillStyle='#5a8fe8';ctx.fillRect(6,26,Math.round(60*X.mp/maxMP()),2)}
  const short=(sp,mp)=>X.sp<sp||X.mp<mp,slots=[...(P.slots||[]).map((id,i)=>id?[SLOT_KEYS[i],(()=>{const A=abil(id);return[X.cds[id]/A.cd,!knows(id)||short(A.sp,A.mp)]})()]:null).filter(Boolean).map(([k,[f,lock]])=>[k,f,lock]),['F',X.rollCd/dodgeCd(),short(dodgeCost(),0)]];
  // (the skill and dodge cooldowns: only with the manual control, set aside for now)
  if(MANUAL_HERO)slots.forEach(([k,f,lock],i)=>{const x=6+i*24,y=VH-30;rect(ctx,'#000',x-1,y-1,22,22);rect(ctx,lock?'#2a2e3e':'#3a4263',x,y,20,20);
    if(f>0)rect(ctx,'rgba(8,10,16,.75)',x,y,20,Math.round(20*f));txt(k,x+10,y+14,lock?'#646d88':f>0?'#98a0ba':'#e8b94a','center')});
  if(B.banner){const b=B.banner;ctx.fillStyle='rgba(232,185,74,.12)';ctx.beginPath();ctx.arc(b.x,b.y-4,b.r,0,7);ctx.fill();rect(ctx,'#5a3a20',Math.round(b.x),Math.round(b.y)-22,1,22);rect(ctx,'#e8b94a',Math.round(b.x)+1,Math.round(b.y)-22,7,5)}
}
// the battle bar shows one button per filled skill slot
function buildSlotBar(){const el=document.getElementById('slotbar');if(!el)return;el.innerHTML=(P.slots||[]).map((id,i)=>id?'<button class="btn sm" type="button" data-slot="'+i+'"></button>':'').join('')}
function updateSkillBar(){
  if(!B||!B.hx)return;const X=B.hx;$('#swing').textContent={melee:'Attack',ranged:'Shoot',magic:'Cast'}[heroKind()]+(ammoOf()?' ('+goodN(ammoOf())+')':'');
  document.querySelectorAll('[data-slot]').forEach(b=>{const id=P.slots[+b.dataset.slot];if(!id)return;const A=abil(id),lock=!knows(id);b.disabled=lock||X.cds[id]>0;
    b.textContent=SLOT_KEYS[+b.dataset.slot]+' '+A.n+(lock?' (not learned)':X.cds[id]>0?' '+Math.ceil(X.cds[id]):'');b.title=A.d+' Costs '+costText(A)+'.'});
  const db=document.querySelector('[data-skill="dodge"]');if(db){db.disabled=X.rollCd>0||X.sp<dodgeCost();db.textContent='F Dodge'+(X.rollCd>0?' '+X.rollCd.toFixed(1):'')}
}
