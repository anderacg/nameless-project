'use strict';
// Defence (battle/defence.js, DEFENCE; the owner, 2026-10-29: battles about 1.5 times as long, each man blocking, parrying or
// dodging in his stance, no words, only the look): who may meet a blow and how likely (tier, shield, side, tiredness, a big one,
// a beast, your hero, a man down), a met blow does nothing and shows only on him (his pose, his weapon, his lean: no float), the
// blows never met (a hard attack, a charge, a combo's finisher), the auto-resolve's reckoning, and the measure the owner asked
// for: how much longer melee lasts with it on than off (tests/harness.js turns it off for every other suite).
Kit.suite(({ok,info})=>{const t=T,G=t.G,L=t.BattleLab,D=t.DEFENCE,ev=s=>(0,eval)(s),Gp=(type,count)=>({type,count});
 const lab=(left,right,x={})=>{if(L.active)L.exit();G.mode='world';G.modal=false;L.start({leftGroups:left,rightGroups:right,deploy:false,ai:false,paused:false,morale:false,seed:7,...x});const B=t.B;B.obs=[];B.cmdT=1e9;return B};
 const mine=B=>B.groups[t.playerGroups()[0]],theirs=B=>Object.values(B.groups).find(q=>q.foe);
 const pair=(a,b)=>{const B=lab([Gp(a,1)],[Gp(b,1)]),u=mine(B).units[0],f=theirs(B).units[0];u.x=400;u.y=300;f.x=400+(u.s.reach||11);f.y=300;u.dir=0;f.dir=Math.PI;u.face=1;f.face=-1;return{B,u,f}};
 const R0=Math.random;t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;const cbo=t.checkBattleOver;ev('checkBattleOver=()=>{}');
 try{
  ev('DEFENCE.on=true');
  ok(D.base>0&&D.cap<1&&D.side.front>D.side.flank&&D.side.flank>D.side.rear&&D.anim>0,'the tunables in one table: base, tier, shield, the sides, the cap, how long it shows');
  // ======== who, and how likely
  {const {u,f}=pair('hum_levy','hum_levy'),lv=t.Defence.chance(u,f);
   const s=pair('hum_levy','hum_spear'),sp=t.Defence.chance(s.u,s.f);
   const g=pair('hum_levy','hum_guard'),gd=t.Defence.chance(g.u,g.f);
   ok(lv>0&&sp>lv&&gd>sp&&gd<=D.cap,'a levy meets a levy\'s blow '+Math.round(lv*100)+'%, a shielded spearman '+Math.round(sp*100)+'%, a tier-3 Shield Guard '+Math.round(gd*100)+'%');
   const k=pair('hum_sergeant','hum_guard');ok(t.Defence.chance(k.u,k.f)<gd,'a better attacker is met less often ('+Math.round(t.Defence.chance(k.u,k.f)*100)+'% against a sergeant)');
   g.u.x=400;g.u.y=300;g.f.x=400;g.f.y=300+12;g.f.dir=Math.PI;const fl=t.Defence.chance(g.u,g.f);g.u.x=400+24;g.u.y=300;g.f.x=400+12;g.f.dir=Math.PI;const rr=t.Defence.chance(g.u,g.f);
   ok(fl<gd&&rr<fl,'from the flank less ('+Math.round(fl*100)+'%), from behind least ('+Math.round(rr*100)+'%)');
   g.u.x=400;g.f.x=412;g.f.y=300;g.f.dir=Math.PI;g.f.sta=0;const tired=t.Defence.chance(g.u,g.f);ok(tired<gd,'spent, less ('+Math.round(tired*100)+'%)')}
  {const {u,f}=pair('hum_levy','troll'),tr=t.Defence.chance(u,f),w=pair('hum_levy','wolf'),wf=t.Defence.chance(w.u,w.f),h=pair('hum_levy','troll'),big=t.Defence.chance(h.f,h.u);
   const lv=pair('hum_levy','hum_levy'),a=t.Defence.chance(lv.u,lv.f);
   ok(tr===0&&wf>0&&wf<a&&big<a,'a troll never meets a blow, a wolf now and then ('+Math.round(wf*100)+'%), a troll\'s blow is met less ('+Math.round(big*100)+'%)')}
  {const {u,f}=pair('hum_levy','hum_levy');f.rout=true;const r=t.Defence.chance(u,f);f.rout=false;f.stun=1;const s=t.Defence.chance(u,f);f.stun=0;
   ok(r===0&&s===0,'routing or stunned: never');const h=t.B.units.find(q=>q.hero)||{hero:true,s:{},hp:1};ok(t.Defence.chance(u,h)===0,'your hero: never (yours to block)')}
  // ======== a met blow: nothing lands; only the look shows
  {const {B,u,f}=pair('hum_levy','hum_guard');f.hp=f.max=1e5;let met=0,hits=0;const k={};
   for(let i=0;i<300;i++){const hp=f.hp,fl=B.floats.length;f.defAt=null;u.hardAt=1e9;t.attack(u,f);if(f.defAt===B.t){met++;k[f.defK]=(k[f.defK]||0)+1;if(f.hp!==hp||B.floats.length!==fl)hits=1e9}else if(f.hp<hp)hits++;B.t+=1}
   ok(met>40&&hits>100&&met+hits===300,'300 blows at a Shield Guard: '+met+' met, '+hits+' landed; a met one takes nothing and floats no word');
   ok(k.block>0,'met from the front with a shield: blocked ('+JSON.stringify(k)+')');
   B.t+=.05;f.defAt=B.t-.05;f.defK='block';ok(t.procPose(f,false)===t.DEF_POSE,'blocking: his shield up (its pose)');
   const sp=t.unitSprite(f.type,1,false,0,t.DEF_POSE,true),st=t.unitSprite(f.type,1,false,0,0,true);ok(sp&&st&&sp!==st,'its own picture, the shield raised');
   f.defK='parry';const H=t.holdOf(f,'sword');ok(H[0]===t.HOLD.blade.parry,'parrying: his blade raised across ('+H[0]+'°)');
   B.t+=1;ok(!t.Defence.now(f),'then, after '+D.anim+' s, as ever')}
  {const {u,f}=pair('hum_levy','hum_levy');f.hp=f.max=1e5;const k={};for(let i=0;i<400;i++){f.defAt=null;u.hardAt=1e9;t.attack(u,f);if(f.defAt===t.B.t)k[f.defK]=(k[f.defK]||0)+1;t.B.t+=1}
   ok(k.parry>0&&k.dodge>0&&!k.block,'no shield, in leather: parries and dodges, no block ('+JSON.stringify(k)+')')}
  // ======== never met: a charge's blow, a champion's finisher
  {const {u,f}=pair('hum_knight','hum_guard');f.hp=f.max=1e5;let met=0;const cm=t.chargeMul;window.chargeMul=()=>1.6;
   try{for(let i=0;i<100;i++){f.defAt=null;t.attack(u,f);if(f.defAt===t.B.t)met++;t.B.t+=1}}finally{window.chargeMul=cm}ok(met===0,'a charge\'s blow is never met')}
  // ======== the auto-resolve counts it
  ok(t.power(['hum_guard'])>(ev('DEFENCE.on=false'),t.power(['hum_guard'])),'the auto-resolve counts a Shield Guard\'s stance (power '+(ev('DEFENCE.on=true'),t.power(['hum_guard'])).toFixed(1)+')');ev('DEFENCE.on=true');
  // ======== the measure: melee to the last man, with it on and off, the same dice
  const fight=(a,b,n,on,seed)=>{ev('DEFENCE.on='+on);Math.random=t.seeded(seed);const B=lab([Gp(a,n)],[Gp(b,n)],{seed});mine(B).attack(theirs(B).units[0]);theirs(B).attack(mine(B).units[0]);
   const t0=B.t;let first=null;while(B.t-t0<240){t.updateBattle(1/30);if(first==null&&B.units.some(u=>u.hp<u.max))first=B.t;const l=B.units.filter(u=>u.team===0&&u.hp>0&&!u.hero).length,r=B.units.filter(u=>u.team===1&&u.hp>0).length;if(!l||!r)break}
   return B.t-(first??t0)};
  const mix=[['hum_levy','hum_levy'],['hum_spear','orc_shield'],['hum_sword','dw_hammer'],['hum_guard','orc_black'],['hum_levy','hum_sword']],rs=[];
  for(const [a,b] of mix){let on=0,off=0;for(const s of [11,12,13,14])
   {on+=fight(a,b,8,true,s);off+=fight(a,b,8,false,s)}rs.push(on/off);info(a+' v '+b+': '+(off/4).toFixed(1)+' s off, '+(on/4).toFixed(1)+' s on (×'+(on/off).toFixed(2)+')')}
  const avg=rs.reduce((x,y)=>x+y,0)/rs.length;ok(avg>1.35&&avg<1.7,'melee lasts about 1.5 times as long: ×'+avg.toFixed(2)+' on average');
 }finally{Math.random=R0;if(L.active)L.exit();window.checkBattleOver=cbo;ev('DEFENCE.on=false')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
