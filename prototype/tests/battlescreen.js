'use strict';
// The battle screen (setup.js BattleSetup, its own field: the arena) with world battles on, as they are in the game (the owner,
// 2026-10-30: "certain battles still occur in the battle screen, so we still need to ensure that the battle screen works"): a
// cave's lair, a tournament and the battle lab each open on their own field, never the map's circle; they draw and run, and the
// cave's ends with its report.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 ok(t.WORLD_BATTLE.on,'world battles are on (the game\'s own default, and the tests\')');
 const screen=(name,start,end)=>{Kit.world();P.troops={hum_foot:6};P.hp=P.sp=P.mp=null;let e0=ERR.length;start();const b=t.B;
  ok(b&&!b.world&&G.mode==='battle'&&b.units.some(u=>u.team===0)&&b.units.some(u=>u.team===1),name+': on the battle screen, its own field ('+t.BW+' wide), not the map\'s circle');
  b.paused=false;b.deploy=false;for(let i=0;i<30&&t.B===b;i++){t.updateBattle(.03);t.drawBattle()}t.frame();ok(ERR.length===e0,name+': it runs and draws'+(ERR.length>e0?': '+ERR[e0]:''));
  if(end){for(const u of b.units)if(u.team===1)u.hp=0;t.checkBattleOver();ok(b.over&&b.win,name+': its foes beaten, won');b.endT=0;t.updateBattle(.01);if(t.B)t.finishBattle();
   const pn=document.getElementById('panel')?.innerHTML||'';ok(!t.B&&/Victory|Victorious|Won|cleared/i.test(pn)&&ERR.length===e0,name+': the battle ends with its report');t.act('cont');t.hidePanel()}
  else{b.over=true;b.endT=0;t.updateBattle(.01);t.B=null;G.mode='world'}};
 {const s=W.sites.find(x=>typeof x.lairWon==='function'&&t.MONSTERS[x.id]);if(s)screen('a cave\'s lair',()=>{const M=t.MONSTERS[s.id];G.enc={kind:'cave',ref:s,lv:s.lv||1,list:[M.unit,M.unit]};t.startBattle({enemies:G.enc.list,tournament:false})},true);else ok(false,'a cave for the fixture')}
 screen('a tournament',()=>{G.enc=null;t.startBattle({enemies:['militia'],tournament:true})});
 screen('the battle lab',()=>t.BattleLab.start({leftGroups:[{type:'hum_foot',count:6}],rightGroups:[{type:'militia',count:6}],deploy:false,paused:false,ai:true,seed:3}));
 if(t.BattleLab.active)t.BattleLab.exit();
 // (and on the map, an encounter still opens in the map's circle)
 {Kit.world();const band=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+20,y:P.y,cool:0});t.bandits.push(band);G.enc={kind:'party',ref:band,list:band.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});
  ok(t.B&&t.B.world instanceof t.WorldBattleArea,'a band met on the map: fought in the map\'s own circle');t.B.over=true;t.B.endT=0;t.updateBattle(.01);if(t.B)t.finishBattle();t.act('cont');t.hidePanel()}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
