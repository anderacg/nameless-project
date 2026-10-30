'use strict';
// A group's rank (core/ranks.js, data/ranks.js RANKS; doc/RANKS_DESIGN.md phase 1; the owner, 2026-10-30): each troop group earns
// experience and climbs ranks 1 to 5 (a badge, its metal its tier); its rank stays whoever joins it (Total War); only at rank 5 it
// upgrades, as a whole, and starts again at rank 1; peasants have no rank, a long grind to their first upgrade.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();const r=t.partyRoster(P),R=t.RANKS;P.sk.lead.lv=10;// (room for groups)
 P.troops={hum_foot:6};const g=r.groups.find(x=>x.type==='hum_foot');
 ok(t.rankOf(g)===1&&t.rankXp(g)===0&&t.rankNeed(g)===R.xp[1][0],'a new group: rank 1, its next rank '+R.xp[1][0]+' experience away');
 // ======== the ladder
 {const up=t.rankGain(g,R.xp[1][0]+R.xp[1][1]+5);ok(up===2&&t.rankOf(g)===3&&t.rankXp(g)===5,'experience past two ranks: rank 3, the rest kept ('+t.rankXp(g)+')')}
 t.rankGain(g,99999);ok(t.rankOf(g)===R.max&&t.rankXp(g)===0&&t.rankReady(g)&&t.rankGain(g,50)===0,'and on to rank '+R.max+': it stops there, ready to upgrade');
 // ======== kept whoever joins it
 r.add('hum_foot',3,g.id);ok(g.count===9&&t.rankOf(g)===R.max,'refilled with recruits: still rank '+R.max);
 {const h=r.split(g.id,4);ok(h&&t.rankOf(h)===R.max&&t.rankOf(g)===R.max,'split: both halves keep it');r.add('hum_foot',1,'new');const fresh=r.groups.find(x=>x.type==='hum_foot'&&x!==g&&x!==h);
  ok(t.rankOf(fresh)===1,'a new group of the same kind: rank 1');r.merge(fresh.id,h.id);ok(t.rankOf(h)===R.max,'merged: the higher rank kept');r.merge(h.id,g.id)}
 // ======== its men all wounded: their record keeps it, and gives it back
 {P.wounded={hum_foot:g.count};P.woundedGroups=[{id:g.id,type:'hum_foot',count:g.count}];const id=g.id,n=g.count;r.remove('hum_foot',n,id);
  const w=P.woundedGroups[0];ok(!r.groups.some(x=>x.id===id)&&t.rankOf(w)===R.max,'every man wounded: the group out of the ranks, its wounded keep rank '+R.max);
  t.woundedBack('hum_foot',n);const back=r.groups.find(x=>x.id===id);ok(back&&t.rankOf(back)===R.max,'healed: back in their group, at its rank')}
 // ======== a battle: its men's average
 {const gg=r.groups.find(x=>x.type==='hum_foot');t.rankReset(gg);P.troops={hum_foot:gg.count};const bow=r.add('hum_bow',3,'new')&&r.groups.find(x=>x.type==='hum_bow');
  const foe=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+20,y:P.y,cool:0});t.bandits.length=0;t.bandits.push(foe);
  G.enc={kind:'party',ref:foe,list:foe.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});Kit.engage();const b=t.B;
  const men=b.units.filter(u=>u.team===0&&b.groups[u.grp]?.sourceGroupId===bow.id);men.forEach((u,i)=>{u.xp=i===0?30:0});
  for(const u of b.units)if(u.team===1)u.hp=0;t.checkBattleOver();b.endT=0;t.updateBattle(.01);if(t.B)t.finishBattle();
  const want=(30/men.length+t.TROOP_XP.fight+t.TROOP_XP.win)*(1+.05*t.skill('lead'));
  ok(Math.abs(t.rankXp(bow)-want)<.01,'a won battle: the bowmen gain their men\'s average and the fight\'s and win\'s ('+t.rankXp(bow).toFixed(1)+')');t.act('cont');t.hidePanel();
  t.rankGain(bow,R.xp[1][0]-t.rankXp(bow));ok(t.rankOf(bow)===2,'enough of it: rank 2')}
 // ======== auto-resolved: each group a share, a little
 {Kit.world();const gg=r.groups.find(x=>x.type==='hum_foot');t.rankReset(gg);G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia'],mine:true};const rnd=Math.random;window.Math.random=()=>.99;try{t.autoResolve()}finally{window.Math.random=rnd}
  ok(t.rankXp(gg)>0&&t.rankOf(gg)===1,'an auto-resolved win teaches them too ('+t.rankXp(gg).toFixed(1)+')');t.act('cont');t.hidePanel()}
 // ======== upgrade: only at rank 5, the whole group, rank 1 again
 {Kit.world();const gg=r.groups.find(x=>x.type==='hum_foot'),to=t.UP.hum_foot[0],id=gg.id,n=gg.count;
  ok(t.recruitment.quoteGroupTraining(null,id,to).code==='experience','rank 1: no upgrade');t.rankGain(gg,99999);
  const q=t.recruitment.trainGroup(null,id,to);const up=r.groups.find(x=>x.id===id);
  ok(q.ok&&up.type===to&&up.count===n&&t.rankOf(up)===1&&!t.rankXp(up),'rank '+R.max+': the whole group upgrades ('+t.ST[to].n+' ×'+n+'), at rank 1 again')}
 // ======== peasants: no rank, a long grind
 {const pk=t.peasantKind('human','farmer');r.add(pk,4,'new');const pg=r.groups.find(x=>x.type===pk);
  ok(t.rankOf(pg)===0&&t.rankNeed(pg)===R.peasant&&R.peasant>R.xp[1][1],'peasants: no rank, '+R.peasant+' experience to their first upgrade (more than a soldier\'s rank 3)');
  t.rankGain(pg,R.peasant-1);ok(!t.rankReady(pg)&&t.rankOf(pg)===0,'one short: not yet');t.rankGain(pg,5);ok(t.rankReady(pg)&&t.rankXp(pg)===R.peasant,'full: ready to upgrade')}
 // ======== the badge
 {const a=t.rankBadge('hum_foot',3,14),b=t.rankBadge('hum_sword',3,14),c=t.rankBadge('hum_foot',4,14);
  ok(/<img class="rbadge"/.test(a)&&/Bronze/.test(a)&&/Silver/.test(b)&&/Gold/.test(t.rankBadge('hum_sergeant',1,14)),'a badge: bronze for tier 1, silver for tier 2, gold for tier 3');
  const src=s=>s.match(/src="([^"]+)"/)[1];ok(src(a)!==src(c)&&src(a)===src(t.rankBadge('hum_foot',3,20)),'a picture for each metal and rank, drawn once');
  G.mode='world';t.openChar();const gg=r.groups[0];t.act('party-select',gg.id);const pn=document.getElementById('panel');
  ok(pn.querySelector('[data-army-group="'+gg.id+'"] .rbadge')&&/Rank \d/.test(pn.querySelector('[data-army-group="'+gg.id+'"] .fb-unit-xptxt').textContent),'the Army window: each group its badge and its rank');t.act('char-close')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
