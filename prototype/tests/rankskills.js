'use strict';
// The ranks' skills, Spear and Bow (battle/rankskills.js, data/ranks.js RANK_SKILLS; doc/RANKS_DESIGN.md phase 2; the owner,
// 2026-10-30: "each rank has certain skills, passive or active, limited to their proficiency and play style"; "move those to the
// ladder for unlocking"): a spearmen's Brace at rank 2, Long reach (+10%) at 3, Rally at 4, the Hedge of spears at 5; a bowmen's Fire
// arrows at 2, Steady aim at 3, Rapid shot at 4, Marksmen at 5; a role not yet on a ladder keeps its abilities from rank 1; an AI
// army's groups count as RANKS.ai till they rank.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,R=t.RANKS;Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:0});P.sk.lead.lv=10;const r=t.partyRoster(P);P.troops={};
 const grp=(k,n,rank)=>{r.add(k,n,'new');const g=r.groups.filter(x=>x.type===k).pop();t.rankGain(g,1e6);if(rank<R.max){t.rankReset(g);t.rankGain(g,R.xp[t.ST[k].tier].slice(0,rank-1).reduce((a,b)=>a+b,0))}return g};
 const sp1=grp('hum_spear',4,1),sp5=grp('hum_spear',4,5),bw1=grp('hum_bow',4,1),bw4=grp('hum_bow',4,4),cav=grp('hum_squire',3,1);
 ok([sp1,sp5,bw1,bw4,cav].map(t.rankOf).join()==='1,5,1,4,1','(groups at ranks 1, 5, 1, 4, 1)');
 const foe=t.asParty({kind:'bandits',troops:['hum_spear','hum_spear','hum_spear','militia'],x:P.x+30,y:P.y,cool:0});t.bandits.length=0;t.bandits.push(foe);
 G.enc={kind:'party',ref:foe,list:foe.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});Kit.engage();const b=t.B;
 const bg=g=>Object.values(b.groups).find(x=>x.sourceGroupId===g.id),has=(g,id)=>t.groupHasAbility(bg(g),id),unit=g=>b.units.find(u=>u.grp===bg(g).id);
 t.updateBattle(.01);
 // ======== the abilities on the ladders
 ok(!has(sp1,'brace')&&!has(sp1,'rally')&&has(sp5,'brace')&&has(sp5,'rally'),'spearmen: Brace and Rally at their ranks (rank 1: neither; rank 5: both)');
 ok(!has(bw1,'fire')&&has(bw4,'fire')&&has(bw4,'rapid')&&!has(bw1,'rapid'),'bowmen: Fire arrows at 2, Rapid shot at 4 (rank 1: neither)');
 ok(!has(bw4,'rally'),'a bowmen\'s ladder has no Rally: they lose it');
 ok(has(cav,'spur'),'riders (a role not yet on a ladder): Spur at rank 1, as before');
 {const ai=Object.values(b.groups).find(g=>!g.player&&g.units.some(u=>u.type==='hum_spear'));ok(ai&&t.battleRank(ai)===R.ai&&t.groupHasAbility(ai,'brace')&&!t.groupHasAbility(ai,'rally'),'an AI army\'s spearmen: rank '+R.ai+', Brace and no Rally')}
 // ======== the passives
 {const a=unit(sp1),c=unit(sp5);ok(Math.abs(c.s.reach/a.s.reach-t.RANK_SKILLS.spear[2].reach)<1e-9,'Long reach at rank 3 and up: +'+Math.round((t.RANK_SKILLS.spear[2].reach-1)*100)+'% ('+c.s.reach.toFixed(1)+' against '+a.s.reach+')');
  ok(t.rankSkill(c,'hedge')&&!t.rankSkill(a,'hedge'),'the Hedge of spears at rank 5');
  const e=b.units.find(u=>u.team===1),sx=c.x,sy=c.y;c.face=1;e.x=c.x;e.y=c.y-20;ok(t.sideOf(c,e)!=='back'&&(t.sideOf(c,e)!=='flank'||t.spearBraced(c,e)),'hedged: braced against a charge from the flank, no Brace ordered ('+t.sideOf(c,e)+')');c.x=sx;c.y=sy}
 {const a=unit(bw1),c=unit(bw4),k=t.RANK_SKILLS.bow[2].aim;ok(Math.abs(t.aimErr(c).a/t.aimErr(a).a-k)<1e-9,'Steady aim at rank 3: their shots '+Math.round((1-k)*100)+'% truer');
  ok(c.s.range===a.s.range,'Marksmen only at rank 5: the rank-4 bowmen\'s range as a rank 1\'s');
  const t0=t.Actor.of(c).shotTime();b.deploy=false;b.paused=false;ok(t.useGroupAbility(bg(bw4),'rapid')&&Math.abs(t.Actor.of(c).shotTime()/t0-t.UNIT_ABILITIES.rapid.mul)<1e-9,'Rapid shot: they shoot '+Math.round((1/t.UNIT_ABILITIES.rapid.mul-1)*100)+'% faster while it lasts')}
 for(const u of b.units)if(u.team===1)u.hp=0;t.checkBattleOver();b.endT=0;t.updateBattle(.01);if(t.B)t.finishBattle();t.act('cont');t.hidePanel();
 // ======== a rank-5 bowmen: Marksmen
 {Kit.world({encCool:0});t.rankGain(bw4,1e6);const f2=t.asParty({kind:'bandits',troops:['militia'],x:P.x+30,y:P.y,cool:0});t.bandits.length=0;t.bandits.push(f2);
  G.enc={kind:'party',ref:f2,list:f2.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});Kit.engage();t.updateBattle(.01);
  const b2=t.B,u4=b2.units.find(u=>b2.groups[u.grp]?.sourceGroupId===bw4.id),u1=b2.units.find(u=>b2.groups[u.grp]?.sourceGroupId===bw1.id);
  ok(Math.abs(u4.s.range/u1.s.range-t.RANK_SKILLS.bow[4].range)<1e-9,'Marksmen at rank 5: +'+Math.round((t.RANK_SKILLS.bow[4].range-1)*100)+'% range');for(const u of b2.units)if(u.team===1)u.hp=0;t.checkBattleOver();b2.endT=0;t.updateBattle(.01);if(t.B)t.finishBattle();t.act('cont');t.hidePanel()}
 // ======== the Army window: the ladder
 {Kit.world();t.openChar();t.act('party-select',sp1.id);t.act('party-path',sp1.id);const d=document.querySelector('.fb-inspector');
  ok(/Rank skills/.test(d.textContent)&&d.querySelectorAll('.fb-path-step.off').length===4&&/Brace \(G\)/.test(d.textContent),'a spearmen\'s path: its five rungs, four still to reach');t.act('char-close')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
