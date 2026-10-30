'use strict';
// AI armies' ranks (world/armyranks.js; data/ranks.js RANKS.aiStart, aiFight, aiDrill; doc/RANKS_DESIGN.md phase 5; the owner,
// 2026-10-30: "they should have ranks too and should grow realistically"): each group of an army on the map its own rank, its first
// by the army's kind; it grows by the battles it lives through and, a lord's, by drill at rest; a lord upgrades his rank-5 groups
// where his holding trains; in battle its rank is its own (its ladder, its proficiency).
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,R=t.RANKS,A=R.aiStart;Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:0});
 // ======== first ranks, by kind
 {const b=t.asParty({kind:'bandits',troops:['hum_spear','hum_spear','militia','militia'],x:P.x+30,y:P.y,cool:0}),gs=t.aiGroups(b);
  ok(gs.length&&gs.every(g=>t.rankOf(g)>=A.band[0]&&t.rankOf(g)<=A.band[1]+1),'a band\'s groups: rank '+A.band.join(' to ')+' ('+gs.map(t.rankOf).join(', ')+')');
  const r0=gs.map(t.rankOf).join();t.aiGroups(b);ok(gs.map(t.rankOf).join()===r0,'set once')}
 {const l=t.W.lords.find(x=>!x.dead&&t.partyRoster(x).groups.length),gs=t.aiGroups(l),hi=t.clamp(1+Math.floor((l.lv||1)/A.lordPer),1,A.lord[1]);
  ok(gs.every(g=>t.rankPeasant(g.type)||t.rankOf(g)>=1&&t.rankOf(g)<=hi),'a lord\'s (level '+l.lv+'): rank 1 to '+hi+' ('+gs.map(t.rankOf).join(', ')+')');
  ok(/Ranks \d/.test(t.tipFor(l)),'his Look card says how seasoned his men are ('+(t.tipFor(l).match(/Ranks [^<]*/)||[''])[0]+')')}
 // ======== in battle: its own
 {const b=t.asParty({kind:'bandits',troops:['hum_spear','hum_spear','hum_spear'],x:P.x+30,y:P.y,cool:0});t.bandits.length=0;t.bandits.push(b);const g=t.partyRoster(b).groups[0];g.rank=1;
  P.troops={hum_foot:5};G.enc={kind:'party',ref:b,list:b.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});Kit.engage();const B=t.B;t.updateBattle(.01);
  const bg=Object.values(B.groups).find(x=>!x.player&&x.units.some(u=>u.sourceGroupId===g.id));
  ok(bg&&t.battleRec(bg)===g&&!t.groupHasAbility(bg,'brace'),'in battle a band\'s rank-1 spearmen are its own record: no Brace yet');
  const x0=t.rankXp(g);B.retreat=true;B.over=true;B.win=false;B.endT=0;t.updateBattle(.01);if(t.B)t.finishBattle();t.act('cont');t.hidePanel();
  ok(t.rankXp(g)+100*(t.rankOf(g)-1)>x0,'you withdraw: they held the field, and gained by it ('+t.rankOf(g)+', '+t.rankXp(g).toFixed(1)+')')}
 // ======== a fight on the map
 {const b=t.asParty({kind:'bandits',troops:['militia','militia'],x:0,y:0}),g=t.aiGroups(b)[0];t.rankReset(g);g.rank=1;t.aiFightRanks(b,true);const w=t.rankXp(g);t.rankReset(g);g.rank=1;t.aiFightRanks(b,false);
  ok(w===R.aiFight.win&&t.rankXp(g)===R.aiFight.lose,'a fight on the map: '+R.aiFight.win+' won, '+R.aiFight.lose+' lost')}
 // ======== a lord at rest: drill, and upgrades where it trains
 {const l=t.W.lords.find(x=>!x.dead&&t.partyRoster(x).groups.some(g=>t.UP[g.type]&&!t.rankPeasant(g.type))),h=t.TOWNS.find(x=>x.T.train),r=t.partyRoster(l);l.inside=h.name;
  const gs=t.aiGroups(l).filter(g=>!t.rankPeasant(g.type)),up=gs.find(g=>t.UP[g.type]),low=gs.find(g=>g!==up)||null,from=up.type,n=up.count;
  t.rankGain(up,1e6);if(low){t.rankReset(low);low.rank=1}t.aiRanksDay();
  ok(up.type===t.UP[from][0]&&up.count===n&&t.rankOf(up)>=1,'at rest in '+h.name+' (it trains): his rank-5 '+t.ST[from].n+' become '+t.ST[up.type].n);
  ok(!low||t.rankXp(low)===R.aiDrill.xp,'and his others drill: +'+R.aiDrill.xp+' a day');l.inside=null}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
