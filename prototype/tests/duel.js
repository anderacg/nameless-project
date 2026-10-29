'use strict';
// Duels (battle/duel.js, DUEL; the owner, 2026-10-29: "units fight each other with more animations; commands still force them",
// think Total War): two men who meet pair up and meet each other's blows better, a block or parry answered at once; a third man catches
// one on his blind side; a duel ends when either falls, runs or is taken away; not for your hero, a character, a beast; each
// blow's look by weapon and foe (drawn only: the rules keep theirs), each defence's by the blow it meets; a heavy wound staggers.
// And the measure: how much longer melee lasts with duels on, against blocks and parries alone and against neither.
Kit.suite(({ok,info})=>{const t=T,G=t.G,L=t.BattleLab,D=t.DUEL,ev=s=>(0,eval)(s),Gp=(type,count)=>({type,count});
 const lab=(left,right,x={})=>{if(L.active)L.exit();G.mode='world';G.modal=false;L.start({leftGroups:left,rightGroups:right,deploy:false,ai:false,paused:false,morale:false,seed:7,...x});const B=t.B;B.obs=[];B.cmdT=1e9;return B};
 const mine=B=>B.groups[t.playerGroups()[0]],theirs=B=>Object.values(B.groups).find(q=>q.foe);
 const pair=(a,b,n=1)=>{const B=lab([Gp(a,n)],[Gp(b,1)]),us=mine(B).units,f=theirs(B).units[0];us.forEach((u,i)=>{u.x=400;u.y=300+i*2;u.dir=0;u.face=1});f.x=400+(us[0].s.reach||11);f.y=300;f.dir=Math.PI;f.face=-1;f.hp=f.max=1e5;us.forEach(u=>{u.hp=u.max=1e5;u.hardAt=1e9});return{B,u:us[0],us,f}};
 const R0=Math.random;t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;const cbo=t.checkBattleOver;ev('checkBattleOver=()=>{}');
 try{
  ev('DEFENCE.on=true;DUEL.on=true');
  ok(D.def>0&&D.cap<1&&D.busy<1&&D.riposte>0&&Object.keys(D.moves).every(w=>['man','beast','big'].every(f=>D.moves[w][f])),'the tunables in one table: the duel\'s defence, cap, the blind side, the riposte; the looks by weapon and foe (man, beast, big)');
  // ======== paired; each meets his partner better; a third man catches him on his blind side
  {const {u,us,f}=pair('hum_sword','hum_sword',2),free=t.Defence.chance(u,f);t.attack(u,f);
   ok(u.duel===f&&f.duel===u,'a blow at a free man pairs them');const duel=t.Defence.chance(u,f),blind=t.Defence.chance(us[1],f);
   ok(duel>free&&duel<=D.cap&&blind<free,'his partner\'s blows met more often ('+Math.round(free*100)+'% → '+Math.round(duel*100)+'%), another\'s less (his blind side: '+Math.round(blind*100)+'%)');
   t.attack(us[1],f);ok(f.duel===u&&!us[1].duel,'the third man does not take him from his duel');
   u.x=300;ok(!t.Duel.of(f)&&!t.Duel.of(u),'one taken away (an order, a step back): the duel ends')}
  {const {u,f}=pair('hum_sword','hum_sword');t.attack(u,f);f.rout=true;ok(!t.Duel.of(u),'one runs: it ends');f.rout=false;u.duel=f;f.duel=u;f.hp=0;ok(!t.Duel.of(u),'one falls: it ends')}
  {const {u,f}=pair('hum_sword','wolf');t.attack(u,f);ok(!u.duel&&!f.duel&&!t.Duel.can({hero:true,s:{}})&&!t.Duel.can({leader:{},s:{}}),'no duels with beasts, your hero or a character')}
  // ======== a parry in a duel is answered at once; a met blow floats no word
  {const {B,u,f}=pair('hum_sword','hum_sword');let rip=0,met=0,word=0;
   for(let i=0;i<200;i++){f.cd=5;const fl=B.floats.length;f.defAt=null;t.attack(u,f);if(f.defAt===B.t){met++;if(f.defK!=='dodge'&&f.cd<=D.riposte)rip++;if(B.floats.length!==fl)word++}B.t+=1}
   ok(met>60&&rip>0&&!word,'200 blows in a duel: '+met+' met, '+rip+' blocks and parries answered at once (his next blow within '+D.riposte+' s), no words')}
  // ======== the looks: by weapon and foe; drawn only
  {const looks=(a,b)=>{const {u,f}=pair(a,b),n={};for(let i=0;i<200;i++){t.Duel.look(u,f);n[u.atkLook]=(n[u.atkLook]||0)+1}return n};
   const sw=looks('hum_sword','hum_sword'),sp=looks('hum_spear','hum_sword'),wf=looks('hum_levy','wolf'),gs=looks('hum_champ','hum_sword');
   info('looks: sword '+JSON.stringify(sw)+'; spear '+JSON.stringify(sp)+'; levy at a wolf '+JSON.stringify(wf)+'; greatsword '+JSON.stringify(gs));
   ok(Object.keys(sw).length>=4&&sw.bash>0&&sp.thrust>Math.max(sp.high||0,sp.low||0)&&(wf.low||0)>0&&!wf.swing==!D.moves.pole.beast.swing&&gs.overhead>(gs.low||0),'a swordsman with a shield: swings, low cuts, overheads, thrusts and bashes; a spearman mostly thrusts; at a wolf, low; a greatsword mostly overhead')}
  {const {u,f}=pair('hum_sword','hum_sword');ev('DUEL.on=false');const st0=t.troopStyle(u);ev('DUEL.on=true');t.Duel.look(u,f);ok(t.troopStyle(u)===st0,'the look is drawn only: the blow\'s own rules (troopStyle) as before')}
  {const {B,u,f}=pair('hum_spear','hum_guard');let low=0,high=0;for(let i=0;i<300;i++){f.defAt=null;t.attack(u,f);if(f.defAt===B.t){if(f.defH==='low')low++;else high++}B.t+=1}
   ok(low>high,'a spearman\'s thrusts are met low ('+low+' low, '+high+' high)')}
  {const {f}=pair('hum_sword','hum_sword');f.max=100;f.hp=100;t.Actor.of(f).wound(30,1,'cut',null,false);ok(f.stagAt===t.B.t,'a heavy wound staggers him')}
  // ======== the measure: melee to the last man, the same dice: neither, blocks and parries alone, duels too
  const fight=(a,b,n,def,duel,seed)=>{ev('DEFENCE.on='+def+';DUEL.on='+duel);Math.random=t.seeded(seed);const B=lab([Gp(a,n)],[Gp(b,n)],{seed});mine(B).attack(theirs(B).units[0]);theirs(B).attack(mine(B).units[0]);
   const t0=B.t;let first=null;while(B.t-t0<400){t.updateBattle(1/30);if(first==null&&B.units.some(u=>u.hp<u.max))first=B.t;const l=B.units.filter(u=>u.team===0&&u.hp>0&&!u.hero).length,r=B.units.filter(u=>u.team===1&&u.hp>0).length;if(!l||!r)break}
   return B.t-(first??t0)};
  const mix=[['hum_levy','hum_levy'],['hum_spear','orc_shield'],['hum_sword','dw_hammer'],['hum_guard','orc_black'],['hum_levy','hum_sword']],r1=[],r2=[];
  for(const [a,b] of mix){let off=0,def=0,du=0;for(const s of [11,12,13,14]){off+=fight(a,b,8,false,false,s);def+=fight(a,b,8,true,false,s);du+=fight(a,b,8,true,true,s)}
   r1.push(def/off);r2.push(du/off);info(a+' v '+b+': '+(off/4).toFixed(1)+' s, blocks '+(def/4).toFixed(1)+' s (×'+(def/off).toFixed(2)+'), duels '+(du/4).toFixed(1)+' s (×'+(du/off).toFixed(2)+')')}
  const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
  ok(avg(r2)>avg(r1)+.3,'duels make melee last longer still: ×'+avg(r2).toFixed(2)+' on average (blocks and parries alone ×'+avg(r1).toFixed(2)+')');
 }finally{Math.random=R0;if(L.active)L.exit();window.checkBattleOver=cbo;ev('DEFENCE.on=false;DUEL.on=false')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
