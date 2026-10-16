'use strict';
// Starting and loading a campaign must clear the previous session, while preserving live record identities.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
  const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
  t.begin('soldier');G.quietEvents=true;const hero=t.charOf(P);
  G.paused=true;G.speed=3;G.rankSeen=1;G.chase={};G.loot={capture:true,pile:[]};G.keys={arrowup:true};W.shops={old:{}};
  t.begin('soldier');
  ok(!G.paused&&G.speed===1&&G.rankSeen===0,'a new campaign resets pause, speed, and rank notifications');
  ok(!G.loot&&!G.chase&&!Object.keys(G.keys).length,'a new campaign clears loot, pointer targets, and held keys');
  ok(!W.shops||!W.shops.old,'a new campaign clears the old campaign shop stock');
  ok(t.P===P&&t.G===G&&t.W===W&&t.charOf(P)===hero&&P instanceof t.PlayerParty,'reset preserves records referenced by characters and party methods');
  ok(P.inv.some(x=>x&&x.id==='grain')&&!G.loot,'starting supplies enter the new inventory');
  G.mode='world';G.modal=false;t.startBattle({enemies:['militia'],tournament:false});
  t.showEsc();t.escAct('esc-main');t.begin('soldier');
  ok(!t.B&&document.getElementById('bbar').hidden,'starting from a battle discards the old battle and its HUD');
  t.saveGame(true,'1');const save=t.readSlot('1');
  delete save.P.stay;delete save.P.wounded;delete save.P.recruits;delete save.P.captives;
  localStorage.setItem(t.slotKey('1'),JSON.stringify(save));
  P.stay={town:'Ashford'};P.wounded={hum_levy:5};P.recruits={ghost:{}};P.captives=[{name:'Old captive'}];P.cargo={grain:100};
  G.loot={capture:true,pile:[]};G.place={};G.chase={};W.shops={old:{}};
  t.loadGame('1');
  ok(!P.stay&&!Object.keys(P.wounded).length&&!Object.keys(P.recruits).length&&!P.captives.length,'fields absent from an older save use defaults instead of the previous campaign');
  ok(!P.cargo&&t.goodN('grain')===t.BGS.soldier.cargo.grain,'loading never migrates cargo left over from the previous campaign');
  ok(!G.loot&&!G.place&&!G.chase&&!G.paused,'loading clears previous session interactions');
  ok(t.P===P&&P instanceof t.PlayerParty&&t.charOf(P)===hero,'loading retains the live player record and its behavior');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
