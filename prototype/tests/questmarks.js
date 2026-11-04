'use strict';
// Turns on the way and the marks a job leaves (doc/QUESTS_DESIGN.md §7, §9, Q5): a band gone to ground is followed to its
// hideout; a shortage filled by others, or a garrison filled, closes its job (a share paid); a holding that changes hands keeps
// your job, its new lords honouring it; a bounty paid quiets its holding's roads a while (no band out of a hideout for a job
// there) and the talk says so; a pack slain the same for its fields; a hunt's meat goes into its stores.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TILE=t.TILE;Kit.begin('soldier',7);Kit.world();Kit.clear();
 const ash=t.townBy('Ashford');P.quests=[];P.x=ash.x-1200;P.y=ash.y-1200;
 const bandAt=(x,y,n)=>{const b=t.asParty({x,y,n,kind:'bandits',list:t.makeEnemies(n,false,'bandits'),t:0,a:0,idle:true,cool:99,ld:t.newChief('bandits',2)});t.bandits.push(b);return b};
 // ======== gone to ground: followed to the hideout
 {const b=bandAt(ash.x+240,ash.y+60,5),q=t.makeQuest('bounty',ash);q.accept();const L=W.sites.find(s=>s instanceof t.Lair&&!s.cleared);
  t.bandits.splice(t.bandits.indexOf(b),1);(L.bands=L.bands||[]).push(b);b.gone=true;b.x=L.x;b.y=L.y;t.questDay();
  const g=t.questGoal(q);ok(q.lair===L.i&&g&&g.x===L.x&&!g.r&&P.quests.includes(q)&&G.msgs.some(m=>m.m==='The '+q.band+' have gone to ground at the '+L.name+'.'),'the band gone to ground: the quest points at the '+L.name+', said once, not closed');
  L.bands=L.bands.filter(x=>x!==b);P.quests=[]}
 // ======== a shortage filled by others; a garrison filled
 {const q=t.makeQuest('supply',ash);q.accept();const g0=P.gold;ash.stock[q.good]=t.targetStock(ash,q.good)*1.2;t.questDay();
  ok(!P.quests.includes(q)&&P.gold>g0&&G.msgs.some(m=>m.m.includes(ash.name+' has its '+t.GOODS[q.good].n.toLowerCase()+' again')),'a shortage filled by others: closed, a share paid')}
 {ash.gar=ash.T.gar-5;const q=t.makeQuest('troops',ash);q.accept();ash.gar=ash.T.gar;t.questDay();ok(!P.quests.includes(q)&&G.msgs.some(m=>/garrison of Ashford is full again/.test(m.m)),'a garrison filled: closed')}
 // ======== changed hands
 {const b=bandAt(ash.x+240,ash.y+60,4),q=t.makeQuest('bounty',ash);q.accept();const was=ash.owner,to=Object.keys(t.FACS).find(f=>f!=='player'&&f!==was);
  ash.owner=to;t.questDay();ok(P.quests.includes(q)&&q.fac===to&&G.msgs.some(m=>m.m.includes('Ashford has changed hands')),'its holding changed hands: still yours, the '+t.FACS[to].n+' honour it');ash.owner=was;q.fac=was;
  // ======== paid: quiet, and the talk
  q.done=true;t.payQuest(q,ash.name);ok(t.Quiet.is(ash,'band')&&W.news.items.some(it=>it.k==='quiet'&&it.near===ash.name),'a bounty paid: Ashford\'s roads are quiet a while, and the talk says so');
  Kit.clear();ok(t.makeQuest('bounty',ash)===null,'while quiet: no band comes out of a hideout for a job there');
  G.day+=t.QUEST_MARKS.band+1;ok(t.makeQuest('bounty',ash)!==null||!t.Troubles.lairs(ash).length,'then it may again')}
 // ======== a pack slain: its fields quiet
 {Kit.clear();P.quests=[];const id=Object.keys(t.MONSTERS).find(k=>!t.MONSTERS[k].mythic);const m=t.asMonster({id,x:ash.x+150,y:ash.y,hx:ash.x+150,hy:ash.y,lv:2,n:3,t:0,a:0,cool:0});W.monsters.push(m);
  const q=t.makeQuest('beast',ash);q.accept();q.done=true;t.payQuest(q,ash.name);W.monsters=[];ok(t.Quiet.is(ash,'beast')&&t.makeQuest('beast',ash)===null,'a pack slain: no pack moves in by its fields a while')}
 // ======== a hunt's meat
 {Kit.clear();P.quests=[];const d=Object.keys(t.CRITTERS).find(k=>!t.CRITTERS[k].live&&t.CRITTERS[k].meat>0);W.critters.push({id:d,x:ash.x+150,y:ash.y+60,hx:ash.x+150,hy:ash.y+60,n:3,dir:1,cool:0});
  let q=null;for(let k=0;k<20&&!(q&&!q.mat);k++)q=t.makeQuest('hunt',ash,null,t.Givers.of(ash).find(g=>g.role==='innkeeper'));
  if(q&&!q.mat){q.accept();P.inv=P.inv.map(()=>null);t.invAdd('good','meat',q.n);t.ensureEcon(ash);const m0=ash.stock.meat||0;q.turnIn(ash);ok((ash.stock.meat||0)===m0+q.n,'a hunt\'s meat goes into Ashford\'s stores (+'+q.n+')')}
  else ok(true,'(no innkeeper at Ashford)')}
 P.quests=[];Kit.clear();
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
