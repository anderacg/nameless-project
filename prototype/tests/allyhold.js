'use strict';
// Your allies fight on (battle/sides.js BattleSides#check): in a battle of several armies your army down is not the end while an
// army beside you still fights; it wins (byAllies: Victory, the watch's holding and realm think better of you) or loses with you
// (Defeat: the escape roll and captivity, world/captivity.js). In the ordinary two-sided battle your allies are on your side.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,rnd=Math.random;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;
 const town=t.TOWNS.find(h=>h.owner&&h.owner!=='player'),fac=town.owner;
 const fight=()=>{Kit.world();P.hostile={};P.fac=null;Kit.goTo(town.x,town.y);t.Captivity.held=null;t.Captivity.scattered=[];
  const guard=t.asParty({pt:true,home:town.name,fac,x:P.x+16,y:P.y,troops:Array(12).fill('hum_foot'),cool:0}),band=t.asParty({kind:'bandits',x:P.x+20,y:P.y,troops:['militia','militia']});
  const e={kind:'party',ref:band,list:band.troops.slice(),allies:[],foes:[],mine:true};G.enc=e;W.lords=[];W.patrols=[guard];W.monsters=[];t.bandits.length=0;t.bandits.push(band);P.troops={hum_foot:1};
  t.startBattle({enemies:e.list,tournament:false});const b=t.B;for(let i=0;i<40&&!b.units.some(u=>u.sourceArmy?.src===guard||u.sourceArmy===guard);i++)b.world.reinforce(.5);
  const watch=b.units.filter(u=>u.sourceArmy?.src===guard||u.sourceArmy===guard);return {b,e,watch}};
 const down=b=>{for(const u of b.units)if(u.team===0)u.hp=0};
 try{
  // (two-sided: the watch is on your side)
  {const {b,watch}=fight();ok(watch.length&&watch.every(u=>u.team===0),'the watch joins on your side');for(const u of b.units)if(u.team===0&&!watch.includes(u))u.hp=0;t.checkBattleOver();ok(!b.over,'two-sided: your army down, the watch fights on')}
  // (several armies: your army down, they fight on; they win: Victory)
  {const {b,watch}=fight();b.sides.activate();ok(b.sides.active&&watch.every(u=>u.team!==0&&b.sides.relation(0,u.team)>0),'several armies: the watch is its own army, beside you');
   for(const u of b.units)if(u.team===0)u.hp=0;t.checkBattleOver();ok(!b.over,'your army down: the battle goes on while the watch fights');
   for(const u of b.units)if(t.battleEnemy(0,u))u.hp=0;t.checkBattleOver();ok(b.over&&b.win&&b.byAllies,'the watch beats the bandits: won, by your allies');
   const rep=t.repOf?t.repOf(town.name):null;t.finishBattle();ok(/Victory/.test(document.getElementById('panel').innerHTML)&&/allies held the field/.test(document.getElementById('panel').innerHTML)&&!t.Captivity.held,'Victory: your allies held the field; no captivity')}
  // (an army not at war with you, fighting your foes, fights on too (the owner, 2026-10-30); Skip to the end runs the rest at once)
  {const {b,watch}=fight();b.sides.activate();const wt=watch[0].team,rel=b.sides.relation.bind(b.sides);b.sides.relation=(a,c)=>a===0&&c===wt||a===wt&&c===0?0:rel(a,c);
   down(b);t.checkBattleOver();ok(!b.over&&b.allyOn&&b.sides.relation(0,wt)===0,'a neutral army fighting your foes: your army down, the battle goes on');
   t.bhudSkip();const bar=document.getElementById('bSkip');ok(bar&&!bar.hidden&&bar.querySelector('[data-bskip]')&&/Skip to the end/.test(bar.textContent),'a bar says so, with Skip to the end');
   const t0=performance.now();t.skipBattle();ok(b.over&&b.win&&b.byAllies,'skipped: the rest fought out at once ('+Math.round(performance.now()-t0)+' ms), the twelve beat the two');
   t.finishBattle();ok(/Victory/.test(document.getElementById('panel').innerHTML)&&/the others held the field/.test(document.getElementById('panel').innerHTML)&&!t.Captivity.held,'Victory: the others held the field; no captivity')}
  // (they fall too: Defeat, through the escape roll)
  {const {b,watch}=fight();b.sides.activate();for(const u of b.units)if(u.team===0||watch.includes(u))u.hp=0;t.checkBattleOver();ok(b.over&&!b.win&&!b.byAllies,'the watch falls too: lost');
   window.Math.random=()=>.99;try{t.finishBattle()}finally{window.Math.random=rnd}ok(/Defeat/.test(document.getElementById('panel').innerHTML)&&t.Captivity.held,'Defeat: taken captive, as any lost battle');t.Captivity.held=null}
  // (two foes on you, at war with each other (the owner, 2026-10-30: a watch and bandits; before, "Withdrawn"): your army down, they
  // fight on; whoever holds the field takes you, even with a man of yours who ran off the field)
  {const {b,watch}=fight();b.sides.activate();const wt=watch[0].team,rel=b.sides.relation.bind(b.sides);b.sides.relation=(a,c)=>a===0&&c===wt||a===wt&&c===0?-1:rel(a,c);
   const mine=b.units.filter(u=>u.team===0);down(b);mine[0].left=true;t.checkBattleOver();ok(!b.over&&b.allyOn&&b.rivals&&!b.retreat,'two foes at war with each other: your army down (one man fled off the field), the battle goes on');
   const el=document.getElementById('bSkip');if(el)el.innerHTML='';t.bhudSkip();ok(/against each other/.test(document.getElementById('bSkip')?.textContent||''),'the bar says your foes fight each other, with Skip to the end');
   for(const u of b.units)if(u.team!==wt&&t.battleEnemy(0,u))u.hp=0;t.checkBattleOver();ok(b.over&&!b.win&&!b.retreat&&b.captor&&b.captor.team===wt,'the watch beats the bandits: you lost, not withdrawn, and the watch holds the field');
   window.Math.random=()=>.99;try{t.finishBattle()}finally{window.Math.random=rnd}const H=t.Captivity.held,pn=document.getElementById('panel').innerHTML;
   ok(/Defeat/.test(pn)&&/held the field/.test(pn)&&H&&H.k==='realm'&&H.fac===fac,'Defeat: taken by the watch\'s realm ('+(H&&H.name)+'), not by the bandits you met');t.Captivity.held=null}
  {const {b,watch}=fight();b.sides.activate();const wt=watch[0].team,rel=b.sides.relation.bind(b.sides);b.sides.relation=(a,c)=>a===0&&c===wt||a===wt&&c===0?-1:rel(a,c);
   down(b);t.checkBattleOver();t.skipBattle();ok(b.over&&!b.win&&b.captor?.team===wt,'skipped: fought out at once, the twelve of the watch hold the field');t.finishBattle();t.Captivity.held=null}
  // (one foe: a man of yours fleeing off the field is no withdrawal; it is a defeat)
  {const {b,watch}=fight();b.sides.activate();for(const u of b.units)if(u.team===0||watch.includes(u))u.hp=0;b.units.find(u=>u.team===0).left=true;t.checkBattleOver();ok(b.over&&!b.win&&!b.retreat,'beaten with a man run off the field: lost, not withdrawn');
   window.Math.random=()=>.99;try{t.finishBattle()}finally{window.Math.random=rnd}ok(/Defeat/.test(document.getElementById('panel').innerHTML)&&!/Withdrawn/.test(document.getElementById('panel').innerHTML),'Defeat, never Withdrawn');t.Captivity.held=null}
 }finally{window.Math.random=rnd;t.Captivity.held=null}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
