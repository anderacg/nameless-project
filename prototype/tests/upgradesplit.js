'use strict';
// Upgrades move only what fits (the owner, 2026-11-01): a unit trained into a kind with another unit size moves at most one full unit
// of it (core/army.js ArmyRoster#upgrade): 15 Spearmen into Lancers, 6 go into a new unit beside it, 9 stay with their rank, mastery
// and picks, to refill with Replenish; fewer, the whole unit converts; a split needs a free unit slot ("No free unit slot"); the price
// and horses for those who go only (core/recruitment.js quoteGroupTraining); the Barracks' button ("Train 6 of 15 into Lancers");
// the same for lords (world/realms.js lordRecruit), skipped without room; saved and loaded.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,ST=t.ST;Kit.begin('soldier',1);let P=t.P;Kit.clear();Kit.world();P.sk.lead.lv=10*PROF.per;P.gold=1e5;P.troops={};
 let r=t.partyRoster(P),ash=t.townBy('Ashford');const S=t.recruitment,price=S.trainCost('hum_lancer');P.rep[ash.name]=90;ash.vol=100;
 const horses=n=>{P.inv=P.inv.map(()=>null);t.invAdd('gear','m_horse',n)},state=()=>JSON.stringify({gold:P.gold,troops:P.troops,army:P.army,inv:P.inv});
 // (a unit of n of a kind at its last rank, its mastery 700 and two picks)
 const grp=(k,n)=>{r.add(k,n,'new');const g=r.groups.filter(x=>x.type===k).pop();t.rankGain(g,t.RANKS.xp[Math.min(3,ST[k].tier)].reduce((a,b)=>a+b,0));g.mxp=700;g.picks=['longReach','braceUp'];return g};
 const barracks=()=>{G.mode='world';G.modal=false;t.hidePanel();t.enterTown(ash);t.act('tab','recruit');t.act('rec-tab','train');return [...document.querySelectorAll('#panel button')]};
 ok(t.unitSize('hum_levy')===15&&t.unitSize('hum_lancer')===6&&ST.hum_levy.n==='Spearman','a Spearman unit of 15, a Lancer unit of 6');
 // ======== 15 Spearmen into Lancers: 6 go, 9 stay
 {const g=grp('hum_levy',15);g.name='Old Guard';horses(6);const id=g.id,ix=r.groups.indexOf(g),s0=r.slots,before=state(),q=S.quoteGroupTraining(ash,id,'hum_lancer');
  ok(q.ok&&q.split&&q.count===6&&q.stay===9&&state()===before,'the quote: 6 of 15 go, 9 stay, nothing changed');
  ok(q.cost===6*price&&q.horses?.n===6,'the price for 6 only: '+q.cost+'g ('+price+'g a man), 6 horses');
  const b=barracks().find(x=>x.dataset.arg===id+':hum_lancer');ok(b&&!b.disabled&&/^Train 6 of 15 into Lancers/.test(b.textContent),'the Barracks’ button: "'+(b&&b.textContent)+'"');
  const g0=P.gold,res=S.trainGroup(ash,id,'hum_lancer'),u=r.groups.find(x=>x.id===res.unit);
  ok(res.ok&&u&&u!==g&&u.type==='hum_lancer'&&u.count===6&&r.groups.indexOf(u)===ix+1&&r.slots===s0+1,'6 Lancers in a new unit, beside the old one (a slot more)');
  ok(g.id===id&&g.type==='hum_levy'&&g.count===9&&g.name==='Old Guard'&&t.rankOf(g)===t.RANKS.max&&g.mxp===700&&g.picks.join()==='longReach,braceUp','9 Spearmen kept in the old unit, its name, rank, mastery and picks theirs');
  // (its rank: a fresh unit's with the carried share of 700 mastery, as a whole unit's upgrade gives)
  {const e={type:'hum_lancer'};t.rankGain(e,700*t.RANKS.mastery.carry);ok(t.rankOf(u)===t.rankOf(e)&&(u.xp||0)===(e.xp||0)&&(u.mxp||0)===(e.mxp||0)&&t.rankOf(u)<t.RANKS.max,'the new unit: its own rank ('+t.rankOf(u)+'), part of the mastery carried (RANKS.mastery.carry '+t.RANKS.mastery.carry+')')}
  ok(!u.picks&&(u.keptPicks||[]).join()==='longReach,braceUp'&&!u.name&&t.UnitKit.of(u).idle.includes('longReach'),'its picks kept, those its new kind can use at work (Long reach idle on horseback)');
  ok(P.troops.hum_levy===9&&P.troops.hum_lancer===6&&P.gold===g0-6*price&&t.invCount('gear','m_horse')===0,'the roster counts 9 and 6; paid for 6, their 6 horses ridden');
  ok(r.groupRoom('hum_levy',id)===6,'the 9 can refill: room for 6 more');ash.vol=100;const fill=S.reinforce(ash,id);ok(fill?.ok&&g.count===15,'Replenish at the barracks: 15 again');
  // saved and loaded
  t.saveGame(true,'quick');const saved=JSON.stringify(P.army);t.begin('hedge');t.loadGame('quick');P=t.P;ash=t.townBy('Ashford');ok(JSON.stringify(P.army)===saved,'saved and loaded: both units as they were');
  G.quietEvents=true}
 const R=t.partyRoster(P),clear=()=>{for(const g of R.groups.slice())R.remove(g.type,g.count,g.id)};
 // ======== no free slot: refused, the button says so
 {clear();P.sk.lead.lv=10*PROF.per;P.gold=1e5;const g=grp('hum_levy',15);horses(6);while(R.slots<R.groupLimit)R.add('hum_bow',1,'new');
  const before=state(),res=S.trainGroup(ash,g.id,'hum_lancer');ok(!res.ok&&res.code==='slot'&&state()===before,'no free unit slot: refused, nothing changed');
  ok(t.recruitmentWhy(res).startsWith('No free unit slot'),'its reason: '+t.recruitmentWhy(res));
  const b=barracks().find(x=>/No free unit slot/.test(x.textContent));ok(b&&b.disabled&&!b.dataset.act,'the Barracks’ button: "No free unit slot", greyed');
  ok(S.quoteGroupTraining(ash,g.id,'hum_pike').ok,'the same unit into Pikemen (a unit of 15): no slot needed')}
 // ======== fewer than a unit of the new kind: all convert
 {clear();P.gold=1e5;const g=grp('hum_levy',5);horses(5);const id=g.id,n=R.groups.length,g0=P.gold,q=S.quoteGroupTraining(ash,id,'hum_lancer'),res=S.trainGroup(ash,id,'hum_lancer');
  ok(q.ok&&!q.split&&q.count===5&&q.stay===0&&res.ok&&res.unit===id&&g.type==='hum_lancer'&&g.count===5&&R.groups.length===n,'5 Spearmen into Lancers: all 5 convert, in the same unit (under-strength)');
  ok(P.gold===g0-5*price,'paid for 5');const b=barracks();ok(!b.some(x=>/^Train \d+ of/.test(x.textContent)),'no split button for it')}
 // ======== same size: unchanged
 {clear();P.gold=1e5;const g=grp('hum_levy',15),id=g.id,n=R.groups.length,g0=P.gold,res=S.trainGroup(ash,id,'hum_pike');
  ok(res.ok&&!res.split&&res.count===15&&res.unit===id&&g.type==='hum_pike'&&g.count===15&&R.groups.length===n&&P.gold===g0-15*S.trainCost('hum_pike'),'15 Spearmen into Pikemen (the same size): the whole unit, as ever')}
 // ======== lords: the same rule; split with room, skipped without
 {const W=t.W,a=W.lords.find(x=>!x.dead),h=t.TOWNS.find(z=>z.owner===a.fac),up=t.UP.hum_levy,rnd=Math.random;t.ensureEcon(h);
  const run=free=>{h.vol=0;Object.assign(a,{inside:null,state:'rest',tgt:h.name,troops:Array(15).fill('hum_levy')});delete a.unitSlots;const n=t.partyRoster(a).slots+free;a.unitSlots=()=>n;
   try{t.UP.hum_levy=['hum_lancer'];Math.random=()=>.01;t.lordRecruit(a,h)}finally{Math.random=rnd;t.UP.hum_levy=up;delete a.unitSlots}return t.countsOf(a.troops)};
  let c=run(1);const L=t.partyRoster(a).groups;ok(c.hum_lancer===6&&c.hum_levy===9&&L.some(g=>g.type==='hum_lancer'&&g.count===6)&&L.some(g=>g.type==='hum_levy'&&g.count===9),'a lord with room: 6 Lancers in a new unit, 9 Spearmen kept ('+JSON.stringify(c)+')');
  c=run(0);ok(c.hum_levy===15&&!c.hum_lancer,'a lord without a free slot: no Lancers, his 15 Spearmen as they were ('+JSON.stringify(c)+')')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
