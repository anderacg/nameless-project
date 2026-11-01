'use strict';
// Your units' upgrades, the place for the tech tree (data/buffs.js BUFFS, world/buffs.js Buffs; the owner, 2026-10-31: "tied to holdings,
// you have to visit the workshop/smith or relevant buildings for upgrades", "tied to unit group not individual unit (except group of
// 1)"): a holding's smith offers what it may; bought for a whole group (its price a man), or your hero's own; in battle a soldier has
// his group's, no other; new men refilling a group pay for its upgrades; merged, only what both had; upgraded into another kind, kept,
// idle where it no longer fits; saved; listed under its traits.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,B=t.Buffs,X=t.BUFFS;Kit.begin('soldier',1);Kit.clear();Kit.world();P.sk.lead.lv=10;P.gold=1e5;
 const ash=t.townBy('Ashford'),vil=t.TOWNS.find(x=>x.kind==='village'),r=t.partyRoster(P);P.troops={};P.rep[ash.name]=90;
 try{
  X._blades={n:'Tempered blades',d:'Better steel.',at:'smith',need:{tier:3},cost:6,who:{unit:'foot'},mods:{dmgPct:.2,armor:10}};X._shoes={n:'Iron shoes',at:'stable',cost:4,who:{unit:'mounted'},mods:{spdPct:.1}};
  ok(B.offer(ash,'smith').includes('_blades')&&!B.offer(ash,'stable').includes('_blades')&&(!vil||!B.offer(vil,'smith').includes('_blades')),'Ashford\'s smith offers Tempered blades (a town or more); its stable and a village\'s smith do not');
  r.add('hum_levy',10,'new');r.add('hum_levy',5,'new');r.add('hum_bow',6,'new');const [a,b2]=r.groups.filter(g=>g.type==='hum_levy'),bow=r.groups.find(g=>g.type==='hum_bow');
  ok(B.price(a.id,'_blades')===60&&B.why(ash,'smith',bow.id,'_blades')==='Not for their kind','its price for the whole group (10 men × 6g = 60g); not for Bowmen');
  const g0=P.gold;ok(B.buy(ash,'smith',a.id,'_blades')&&P.gold===g0-60&&B.has(a.id,'_blades')&&!B.has(b2.id,'_blades')&&a.buffs[0].from==='Ashford','bought for one group of Spearmen, not the other');
  ok(B.why(ash,'smith',a.id,'_blades')==='They have it','not twice');
  ok(B.buy(ash,'smith','hero','_blades')&&B.has('hero','_blades')&&B.price('hero','_blades')===6,'your hero, a group of one, his own (6g)');
  // (in battle: his group's, no other)
  G.enc={kind:'party',ref:{cool:0},list:['militia','militia']};t.startBattle({enemies:['militia','militia'],deploy:false});const Bt=t.B;if(Bt.ready||Bt.deploy)t.beginFight();Bt.paused=false;for(let i=0;i<3;i++)t.updateBattle(.02);
  for(const u of Bt.units)t.buffUnit(u);/* (as battle.js battleStep does each soldier once, after his rank) */const ua=Bt.units.find(u=>u.team===0&&u.sourceGroupId===a.id),ub=Bt.units.find(u=>u.team===0&&u.sourceGroupId===b2.id),e=Bt.units.find(u=>u.team===1);
  ok(ua&&ub&&Math.abs(ua.s.dmg/ub.s.dmg-1.2)<.01&&ua.s.av===t.armorValue(ub.s)+10&&e.s.av==null,'in battle the upgraded group\'s men hit 20% harder, wear 10 more armour; the other group and the foe as they were');
  ok(Bt.hero.s.av>0,'your hero his own');Bt.over=true;Bt.endT=0;t.updateBattle(.01);if(t.B)t.finishBattle();t.hidePanel();G.mode='world';G.modal=false;
  // (refills pay for it; merged: only what both had; upgraded into a mounted kind: kept, idle)
  ok(B.perMan(a.id)===6&&!B.perMan(b2.id),'a new man in it pays 6g for its upgrades, none in the other');
  r.merge(b2.id,a.id);ok(!B.has(a.id,'_blades'),'two merged: only the upgrades both had');B.buy(ash,'smith',a.id,'_blades');
  {r.remove('hum_levy',3,a.id);const n=r.groupRoom('hum_levy',a.id);ash.vol=50;t.enterTown(ash);t.act('tab','recruit');const f=document.querySelector('[data-act="rec-refill"][data-arg="'+a.id+'"]'),gg=P.gold;f.click();ok(n>0&&P.gold===gg-n*(t.hireCost('hum_levy')+6),'refilled: '+n+' men at their price and its upgrades\' ('+(gg-P.gold)+'g)');t.act('leave');G.mode='world';G.modal=false}
  r.upgrade(a.id,'hum_lancer');ok(B.has(a.id,'_blades')&&!B.fits(X._blades,'hum_lancer'),'made Lancers: Tempered blades kept, idle on horseback');
  G.mode='world';t.saveGame(true,'quick');t.loadGame('quick');ok(B.has(a.id,'_blades')&&B.has('hero','_blades'),'saved and loaded: the group\'s and your hero\'s');
  // (the Army window: under its traits)
  r.upgrade(a.id,'hum_levy');G.mode='world';G.modal=false;G.char='roster';t.openChar();t.act('party-select',a.id);t.act('party-path',a.id);const d=document.querySelector('.fb-inspector').textContent;
  ok(/Upgrades/.test(d)&&d.includes('Tempered blades')&&d.includes('from Ashford'),'the Army window: its upgrades under its traits, where each was bought');
  t.act('party-select',bow.id);t.act('party-path',bow.id);ok(/Upgrades\s*None yet/.test(document.querySelector('.fb-inspector').textContent),'Bowmen, none: None yet');
  {G.mode='world';G.modal=false;t.hidePanel();t.enterTown(ash);t.act('tab','smith');const tx=document.getElementById('panel').textContent;ok(/Upgrades for your units/.test(tx)&&tx.includes('Tempered blades'),'the smith\'s window: its upgrades, a button for each of your groups they fit');t.act('leave')}
 // (the owner, 2026-11-01: "dynamic enough so that I can just switch building type") an upgrade moved to another building is sold there:
 // its at, nothing else (town.js Place#page, #act)
 {X._test={n:'Test oil',at:'trade',cost:1,mods:{armor:1}};P.gold=1e4;G.mode='world';G.modal=false;t.hidePanel();t.enterTown(ash);t.act('tab','trade');const tx=document.getElementById('panel').textContent,btn=[...document.querySelectorAll('[data-act="buff-buy"]')].find(b=>b.dataset.arg.endsWith('|_test')&&!b.disabled),g0=P.gold;
  if(btn){btn.click();const id=btn.dataset.arg.split('|')[0];ok(/Test oil/.test(tx)&&P.gold<g0&&B.has(id,'_test'),'an upgrade at the market (trade): sold there and bought, its at all it took')}else ok(false,'an upgrade at the market: no button for it ('+(/Test oil/.test(tx)?'listed':'not listed')+')');
  t.act('tab','smith');ok(!/Test oil/.test(document.getElementById('panel').textContent),'and the smith does not sell it');delete X._test;t.act('leave')}
 }finally{delete X._blades;delete X._shoes}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
