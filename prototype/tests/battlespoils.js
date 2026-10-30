'use strict';
// A battle's spoils (sides.js BattleSides#settle, #shares; resolution.js conclude; engage.js reinfCut; the owner, 2026-10-30):
// won, by your army or your allies after it fell, the spoils of the beaten (gold, renown, prisoners) shared by each army's part in
// the fight (the harm it did the foe); lost or withdrawn, nothing but the experience your army earned (your hero's and your troops').
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,rnd=Math.random;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 const town=t.TOWNS.find(h=>h.owner&&h.owner!=='player'),fac=town.owner;
 const fight=()=>{Kit.world();P.hostile={};P.fac=null;Kit.goTo(town.x,town.y);t.Captivity.held=null;t.Captivity.scattered=[];P.prisoners={};
  const guard=t.asParty({pt:true,home:town.name,fac,x:P.x+16,y:P.y,troops:Array(12).fill('hum_foot'),cool:0}),band=t.asParty({kind:'bandits',x:P.x+20,y:P.y,troops:Array(8).fill('militia')});
  const e={kind:'party',ref:band,list:band.troops.slice(),allies:[],foes:[],mine:true};G.enc=e;W.lords=[];W.patrols=[guard];W.monsters=[];t.bandits.length=0;t.bandits.push(band);P.troops={hum_foot:3};
  t.startBattle({enemies:e.list,tournament:false});const b=t.B;for(let i=0;i<40&&!b.units.some(u=>u.sourceArmy?.src===guard||u.sourceArmy===guard);i++)b.world.reinforce(.5);b.sides.activate();
  const S=b.sides,me=S.records.find(r=>r.owner===P),watch=S.byOwner.get(guard),foe=S.records.find(r=>r.owner===band);return {b,S,me,watch,foe}};
 const tally=()=>({gold:P.gold,renown:P.renown,xp:t.ArmyReport.tally().xp,pr:t.prisonerCount()});
 try{
  // ======== won together: shared by the harm each did
  {const {b,S,me,watch,foe}=fight();me.damage=30;watch.damage=70;me.kills=Array(2).fill('militia');watch.kills=Array(6).fill('militia');
   const sh=S.shares();ok(Math.abs(sh.get(me)-.3)<1e-9&&Math.abs(sh.get(watch)-.7)<1e-9&&!sh.has(foe),'the spoils\' shares by the harm each army did the foe: yours 30%, the watch\'s 70%; none for the foe');
   const a=tally();for(const u of b.units)if(t.battleEnemy(0,u))u.hp=0;t.checkBattleOver();window.Math.random=()=>.5;try{t.finishBattle()}finally{window.Math.random=rnd}const z=tally(),pn=document.getElementById('panel').innerHTML;
   const want=Math.round(8*t.rint.call?0:0);ok(z.gold>a.gold&&z.gold-a.gold<=Math.ceil(8*6*.3*(1+t.tm('loot')))+1,'won: gold for all eight beaten, your 30% of it (+'+(z.gold-a.gold)+')');
   ok(z.renown-a.renown===Math.round(8*.3)&&z.xp>a.xp&&/yours 30%/.test(pn),'renown by your share ('+(z.renown-a.renown)+'), experience for your own kills, and the report says your share');t.act('cont');t.hidePanel()}
  // ======== your army fell, your allies won: your share for your part before you fell
  {const {b,S,me,watch}=fight();me.damage=20;watch.damage=80;me.kills=['militia'];watch.kills=Array(7).fill('militia');for(const u of b.units)if(u.team===0)u.hp=0;
   for(const u of b.units)if(t.battleEnemy(0,u))u.hp=0;t.checkBattleOver();ok(b.over&&b.win&&b.byAllies,'(your army down, the watch beats the bandits)');const a=tally();t.finishBattle();const z=tally();
   ok(z.gold>a.gold&&/yours 20%/.test(document.getElementById('panel').innerHTML),'won by your allies: still your share for your part before you fell (20%, +'+(z.gold-a.gold)+' gold)');t.act('cont');t.hidePanel()}
  // ======== lost: the experience only
  {const {b,me,watch}=fight();me.damage=30;me.kills=Array(3).fill('militia');for(const u of b.units)if(u.team===0||u.team===watch.team)u.hp=0;t.checkBattleOver();ok(b.over&&!b.win,'(you and the watch beaten)');
   const a=tally();window.Math.random=()=>.99;try{t.finishBattle()}finally{window.Math.random=rnd}const z=tally(),pn=document.getElementById('panel').innerHTML;
   ok(z.gold===a.gold&&z.renown===a.renown&&z.pr===0&&z.xp>a.xp&&/only what your men learned/.test(pn),'lost: no gold, renown or prisoners; your hero\'s experience for your three kills (+'+(z.xp-a.xp)+')');t.act('cont');t.hidePanel();t.Captivity.held=null}
  // ======== withdrawn: the experience only
  {const {b,me}=fight();me.kills=Array(2).fill('militia');for(const u of b.units)if(u.team===0&&u.hp>0){b.withdrawn=(b.withdrawn||0)+1;t.leaveField(u)}t.checkBattleOver();ok(b.over&&!b.win&&b.retreat,'(withdrawn)');
   const a=tally();t.finishBattle();const z=tally();ok(z.gold===a.gold&&z.renown===a.renown&&z.pr===0&&z.xp>a.xp,'withdrawn: no gold, renown or prisoners; the experience earned (+'+(z.xp-a.xp)+')');t.act('cont');t.hidePanel()}
  // ======== a battle of two: beaten, the experience earned; a helper's cut by its part
  {Kit.world();const band=t.asParty({kind:'bandits',x:P.x+20,y:P.y,troops:Array(4).fill('militia')});t.bandits.length=0;t.bandits.push(band);G.enc={kind:'party',ref:band,list:band.troops.slice(),allies:[],foes:[],mine:true};P.troops={hum_foot:2};
   t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B;b.kills=2;b.slain=['militia','militia'];for(const u of b.units)if(u.team===0)u.hp=0;t.checkBattleOver();const a=tally();window.Math.random=()=>.99;try{t.finishBattle()}finally{window.Math.random=rnd}const z=tally();
   ok(b.over&&!b.win&&z.gold===a.gold&&z.renown===a.renown&&z.xp>a.xp,'a battle of two lost: nothing but the experience of your two kills (+'+(z.xp-a.xp)+')');t.act('cont');t.hidePanel();t.Captivity.held=null}
  {const l={name:'Sir Test',troops:Array(10).fill('hum_foot')},S={byOwner:new Map([[l,{damage:75}]]),records:[{owner:P,damage:25}]};
   const r1={gold:100},s1=t.reinfCut({allies:[l]},r1,S),r2={gold:100},s2=t.reinfCut({allies:[l],men:10},r2,null);
   ok(r1.gold===25&&/part in the fight/.test(s1)&&r2.gold===50&&/10 men/.test(s2),'a lord beside you takes his cut by his part in the fight (75 of 100), else by his men (half, for 10 against your 10)')}
 }finally{window.Math.random=rnd;t.Captivity.held=null}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
