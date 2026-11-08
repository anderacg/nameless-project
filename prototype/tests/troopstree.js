'use strict';
// The humans' troop tree (doc/TROOPS_DESIGN.md step 1; the owner, 2026-10-31): the Peasant Levy at its root (every trade recruited one
// kind), above it Spearman, Bowman, Footmen, Crossbowman; Pikeman and Lancer from the Spearman, Longbowman and Mounted Archer from the
// Bowman, Shield Men and Squire from the Footmen, Shield Guard, Knight, Arbalester at their ends; no mage from the archers, a rare
// hire at a large, prosperous holding. Every upgrade at a barracks for its price, a horse a man into a mounted kind (a knight's a war
// horse), yours first; and an upgraded unit keeps the skills it learned, a foot drill off while it rides.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,ST=t.ST,UP=t.UP;Kit.begin('soldier',1);Kit.clear();Kit.world();P.sk.lead.lv=10*PROF.per;P.gold=1e5;const r=t.partyRoster(P),ash=t.townBy('Ashford');P.troops={};P.rep[ash.name]=90;
 const pl=t.peasantLevy('human');
 ok(ST[pl].n==='Peasant Levy'&&ST[pl].tier===0&&t.unitSize(pl)===20&&['farmer','miner','fisher'].every(j=>t.UP[t.peasantKind('human',j)].join()===UP[pl].join()),'one Peasant Levy at the root (a unit of 20), whatever the trade');
 ok(UP[pl].join()==='hum_levy,hum_bow,hum_foot,hum_crossbow'&&ST.hum_levy.n==='Spearman'&&ST.hum_spear.n==='Shield Men','it trains into Spearman, Bowman, Footmen or Crossbowman; the Levy a Spearman, the Man-at-Arms the Shield Men');
 ok(UP.hum_levy.join()==='hum_pike,hum_lancer'&&UP.hum_bow.join()==='hum_long,hum_hbow'&&UP.hum_foot.join()==='hum_spear,hum_squire'&&UP.hum_spear.join()==='hum_guard'&&UP.hum_squire.join()==='hum_knight'&&UP.hum_crossbow.join()==='hum_xbow','the paths: Pikeman and Lancer, Longbowman and Mounted Archer, Shield Men (Shield Guard) and Squire (Knight), Arbalester');
 ok(ST.hum_pike.tier===2&&ST.hum_hbow.tier===2&&ST.hum_lancer.mounted&&ST.hum_lancer.tier===2&&ST.hum_crossbow.tier===1&&!Object.values(UP).some(l=>l.some(k=>['hum_sword','hum_sergeant','hum_champ'].includes(k)))&&!UP.hum_bow.includes('hum_mage'),'Pikeman and Mounted Archer tier 2; the Lancer rides; no Swordsman line; no mage from the archers');
 {const h=ash.hires('human');ok(h.includes('hum_crossbow')&&h.includes('hum_bow')&&!h.includes('hum_squire'),'Ashford hires Spearman, Footmen, Bowman and Crossbowman, no Squire ('+h.map(k=>ST[k].n).join(', ')+')')}
 {let on=0;const c=t.TOWNS.find(x=>x.kind==='city')||ash;c.pros=100;for(let i=0;i<200;i++){c.mageWk=null;G.day=i*7;if(c.hires('human').includes('hum_mage'))on++}const v=t.TOWNS.find(x=>x.kind==='village');v.pros=100;v.mageWk=null;
  ok(on>3&&on<60&&!v.hires('human').includes('hum_mage'),'a Battle Mage: now and then at a prosperous city ('+on+' weeks of 200), never at a village');G.day=1}
 // ======== upgrades: at a barracks; horses for riders
 const grp=(k,n)=>{r.add(k,n,'new');const g=r.groups.filter(x=>x.type===k).pop();t.rankGain(g,t.RANKS.xp[Math.min(3,ST[k].tier)].reduce((a,b)=>a+b,0));return g};
 {const g=grp('hum_foot',5);ok(t.recruitment.quoteGroupTraining(null,g.id,'hum_spear').code==='barracks','in the field: no upgrade, only at a barracks');
  ok(t.recruitment.quoteGroupTraining(ash,g.id,'hum_spear').ok,'at Ashford\'s barracks: Footmen to Shield Men')}
 {const g=grp('hum_levy',6),hs=()=>t.invCount('gear','m_horse');P.inv=P.inv.map(()=>null);const sold=t.stableStock(ash).includes('m_horse'),q=t.recruitment.quoteGroupTraining(ash,g.id,'hum_lancer');
  ok(q.horses&&q.horses.id==='m_horse'&&q.horses.n===6&&(sold?q.ok&&q.cost===6*t.trainCost('hum_lancer')+6*t.gearPrice('m_horse'):q.code==='horses'),'Spearman to Lancer: 6 riding horses, '+(sold?'bought at its stable ('+q.cost+'g in all)':'none for sale: not here'));
  t.invAdd('gear','m_horse',2);const q2=t.recruitment.quoteGroupTraining(ash,g.id,'hum_lancer');ok(q2.horses.own===2&&q2.horses.buy===4,'your own spare horses first (2 yours, 4 to buy)');
  const v=t.TOWNS.find(x=>x.kind==='village'&&!t.stableStock(x).includes('m_horse'));if(v){const q3=t.recruitment.quoteGroupTraining(v,g.id,'hum_lancer');ok(q3.code==='horses'&&/Riding Horses: 6 needed, 2 yours/.test(t.recruitmentWhy(q3)),'where no horses are sold: why ('+t.recruitmentWhy(q3)+')')}
  if(sold){const n0=hs();ok(t.recruitment.trainGroup(ash,g.id,'hum_lancer').ok&&g.type==='hum_lancer'&&hs()===n0-2,'upgraded: your two horses ridden, four bought')}}
 {const g=grp('hum_squire',3),q=t.recruitment.quoteGroupTraining(ash,g.id,'hum_knight');ok(q.horses&&q.horses.id==='m_destrier','Squire to Knight: war horses, a riding horse is not enough');
  const g2=grp('hum_bow',4),q2=t.recruitment.quoteGroupTraining(ash,g2.id,'hum_long');ok(!q2.horses,'a foot upgrade needs no horse')}
 // ======== skills kept through an upgrade: step 1's ladders (unit kits step 2's switches off: doc/UNIT_KITS_DESIGN.md §10.2)
 Kit.kits(false,()=>{const g=grp('hum_levy',4);ok(t.rankOf(g)===5&&t.rankLadders(g).join()==='spear,5','a Spearman unit at rank 5: its spear ladder, all five rungs');
  r.upgrade(g.id,'hum_lancer');ok(g.type==='hum_lancer'&&t.rankOf(g)===1&&g.learned&&g.learned.spear===5,'made Lancers: rank 1 again, its spear ladder kept');
  const rungs=t.rankRungs(g,{s:ST.hum_lancer}).map(k=>k.id||k.ab);ok(rungs.includes('reach')&&rungs.includes('rally')&&!rungs.includes('brace')&&!rungs.includes('hedge'),'on horseback: Long reach and Rally still his; Brace and the hedge of spears foot drills, off ('+rungs.join(', ')+')');
  ok(t.rankRungs(g,{s:{...ST.hum_lancer,mounted:false}}).some(k=>k.ab==='brace'),'on foot again (the dismount, to come): Brace back');
  const p=grp('hum_levy',4);r.upgrade(p.id,'hum_pike');ok(t.rankLadders(p).join()==='spear,5'&&t.rankRungs(p,{s:ST.hum_pike}).some(k=>k.id==='hedge'),'made Pikemen: the same ladder, every rung kept');
  t.saveGame(true,'quick');t.loadGame('quick');const L=t.partyRoster(P).groups.find(x=>x.id===g.id);ok(L&&L.learned?.spear===5,'saved and loaded: what it learned kept')});
 // (step 2, §7: its mastery's picks kept through an upgrade, those its new kind's menu has working, the rest idle)
 {const g=grp('hum_levy',4);g.mxp=700;g.picks=['longReach','braceUp'];r.upgrade(g.id,'hum_pike');const K=t.UnitKit.of(g);
  ok(g.type==='hum_pike'&&!g.picks&&K.kept.join()==='longReach,braceUp'&&K.perk('longReach')&&K.up('brace','push')>0,'made Pikemen: its picks kept, Long reach and Brace+ still at work');
  const h=grp('hum_levy',4);h.mxp=300;h.picks=['longReach'];r.upgrade(h.id,'hum_lancer');const H=t.UnitKit.of(h);ok(H.idle.join()==='longReach'&&!H.perk('longReach'),'made Lancers: Long reach kept but idle (not on the cavalry\u2019s menu)');r.remove('hum_pike',4,g.id);r.remove('hum_lancer',4,h.id)}
 // ======== a worker taken on: only ever a Peasant Levy, refilling yours first (the owner, 2026-10-31: "he is just a worker, only peasant")
 {r.add(pl,12,'new');const g=r.groups.find(x=>x.type===pl);r.add('hum_levy',3,'new');const sp=r.groups.filter(x=>x.type==='hum_levy').pop();
  ok(t.workerJoins(pl)==='into your Peasant Levy (12/20)','the estate says where he goes: '+t.workerJoins(pl));const n0=g.count,s0=sp.count;P.add(pl);
  ok(g.count===n0+1&&sp.count===s0,'taken on: into your Peasant Levy unit, never your Spearmen (who are short too)');
  r.remove(pl,g.count,g.id);ok(/a new Peasant Levy unit/.test(t.workerJoins(pl))||r.slots>=r.groupLimit,'with none of them: '+t.workerJoins(pl))}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
