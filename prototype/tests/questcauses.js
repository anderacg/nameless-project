'use strict';
// Quests from what is true (doc/QUESTS_DESIGN.md Q1–Q3; the owner, 2026-11-04: "why spawn bandits/monster near the holding for
// hunting quest"): what troubles a holding (world/troubles.js), its givers (world/givers.js), and the jobs on them: a bounty on
// the band that is there (none: one out of the nearest hideout, never beside the holding; no hideout, no bounty), beasts at the
// folds that live there, game that grazes near, troops only for a thin garrison; the board by its givers, empty when nothing
// troubles it.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TILE=t.TILE;Kit.begin('soldier',3);Kit.world();
 const ash=t.townBy('Ashford'),tiles=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)/TILE,rnd=Math.random;
 const bandAt=(x,y,n)=>{const b=t.asParty({x,y,n,kind:'bandits',list:t.makeEnemies(n,false,'bandits'),t:0,a:0,idle:true,cool:9,ld:t.newChief('bandits',2)});t.bandits.push(b);return b};
 const lairsFar=()=>{for(const s of W.sites)if(s instanceof t.Lair&&tiles(s,ash)<t.TROUBLE.lair)s.cleared=true};
 // ======== troubles: read only
 {Kit.clear();let n=0;Math.random=()=>{n++;return rnd()};let tr;try{tr=t.Troubles.of(ash)}finally{Math.random=rnd}
  ok(tr&&Array.isArray(tr.bands)&&Array.isArray(tr.packs)&&Array.isArray(tr.game)&&!n,'what troubles a holding: read with no random draw')
  ok(!tr.bands.length&&!tr.packs.length&&!tr.game.length,'(a cleared map: no band, no pack, no game near)')}
 // ======== givers
 {const gs=t.Givers.of(ash),again=t.Givers.of(ash);ok(gs.length>=2&&gs.every((g,i)=>g.name===again[i].name&&g.key===ash.name+':'+g.role),'Ashford has its givers, the same each time: '+gs.map(g=>g.name+' the '+g.n).join(', '));
  const v=t.TOWNS.find(z=>z.kind==='village');ok(t.Givers.of(v).some(g=>g.role==='reeve')&&!t.Givers.of(v).some(g=>g.role==='steward'),'a village has its reeve, no steward')}
 // ======== a bounty: the band that is there
 {Kit.clear();const b=bandAt(ash.x+200,ash.y+40,5),n0=t.bandits.length,q=t.makeQuest('bounty',ash);
  ok(q&&q.chief===b.ld.name&&q.n===5&&/Seen in the lands|robbed|raided/.test(q.cause),'a band in its lands: the bounty names it and its chief ('+(q&&q.chief)+'), and why');
  ok(q&&q.person&&/captain|reeve|merchant/.test(q.person.n),'given by one of its people: '+(q&&q.person?t.Givers.label(q.person):'none'));
  q.accept();ok(b.qid===q.id&&t.bandits.length===n0,'taken: that very band is marked, and no band is made')}
 // ======== none there: one out of the nearest hideout, working the holding's roads
 {Kit.clear();P.quests=[];const L=t.Troubles.lairs(ash)[0];
  if(L){const q=t.makeQuest('bounty',ash);ok(q&&q.site===L.i&&q.cause.includes(L.name),'no band near: one out of the '+L.name+' takes to its roads');
   q.accept();const b=t.bandits.find(x=>x.qid===q.id);ok(b&&tiles(b,L)<2&&tiles(b,ash)>=tiles(L,ash)-2&&b.haunt&&tiles(b.haunt,ash)<=t.BOUNTY.haunt[1]+1,'it comes out at the hideout ('+(b?Math.round(tiles(b,ash)):'?')+' tiles out), and works the roads by Ashford')}
  else ok(true,'(no hideout near Ashford on this seed)');
  lairsFar();ok(t.makeQuest('bounty',ash)===null,'no band and no hideout near: no bounty')}
 // ======== beasts: the pack by its fields, or one where such beasts live
 {Kit.clear();P.quests=[];const id=Object.keys(t.MONSTERS).find(k=>!t.MONSTERS[k].mythic&&t.MONSTERS[k].where.includes(ash.clim))||Object.keys(t.MONSTERS).find(k=>!t.MONSTERS[k].mythic);
  const m=t.asMonster({id,x:ash.x+150,y:ash.y,hx:ash.x+150,hy:ash.y,lv:2,n:3,t:0,a:0,cool:0});W.monsters.push(m);const n0=W.monsters.length,q=t.makeQuest('beast',ash);
  ok(q&&q.mon===id&&q.n===3&&!q.stage,'a pack by its fields: the job is that pack ('+id+')');q.accept();ok(m.qid===q.id&&W.monsters.length===n0,'taken: it is marked, and none is made');
  Kit.clear();P.quests=[];const q2=t.makeQuest('beast',ash);
  if(q2){const M=t.MONSTERS[q2.mon];ok(q2.stage&&M.where.some(w=>t.habitatAt(q2.mx,q2.my).includes(w))&&tiles({x:q2.mx,y:q2.my},ash)>=7,'none: one has made its lair where such beasts live ('+t.habitatAt(q2.mx,q2.my).join('/')+'), 7 tiles out or more')}
  else ok(true,'(no habitat for the land\'s beasts near Ashford)')}
 // ======== game: only where it grazes
 {Kit.clear();ok(t.makeQuest('hunt',ash)===null,'no game near: no hunt');
  const id=Object.keys(t.CRITTERS).find(k=>t.CRITTERS[k].mat&&t.CRITTERS[k].mat[0]==='hide'&&!t.CRITTERS[k].live);
  W.critters.push({id,x:ash.x+160,y:ash.y+60,hx:ash.x+160,hy:ash.y+60,n:3,dir:1,cool:0});
  const q=t.makeQuest('hunt',ash);ok(q&&q.game===id&&q.cause.toLowerCase().includes(t.CRITTERS[id].n.toLowerCase().split(' ')[0]),'game near: the hunt names it and where ('+(q&&q.cause)+')')}
 // ======== troops: only for a thin garrison
 {ash.gar=ash.T.gar;ok(t.makeQuest('troops',ash)===null,'a full garrison asks for none');
  ash.gar=ash.T.gar-5;const q=t.makeQuest('troops',ash);ok(q&&q.n===5,'five short: five asked for');ash.gar=ash.T.gar}
 // ======== the board
 {Kit.clear();lairsFar();ash.gar=ash.T.gar;P.jobs={};const tr=t.Troubles.of(ash);t.jobsAt(ash);
  const list=P.jobs.Ashford.list;ok(list.every(q=>q.person),'every offer is a giver\'s ('+list.map(q=>q.type+': '+(q.person&&q.person.name)).join(', ')+')');
  ok(list.every(q=>q.type!=='bounty'&&q.type!=='hunt'&&q.type!=='troops'),'with no band, no hideout, no game near and a full garrison: no bounty, hunt or troops offered ('+list.map(q=>q.type).join(', ')+')');
  P.jobs={Ashford:{day:G.day,list:[],none:true}};t.enterTown?.(ash);const html=t.jobsBody(ash);ok(/class="nb bare"/.test(html)&&!/class="nb-note/.test(html),'an empty board is bare, no paper pinned to it (7a48c7e: no line saying so)')}
 // ======== a giver's regard and their goods
 {Kit.clear();P.quests=[];const b=bandAt(ash.x+200,ash.y+40,4),q=t.makeQuest('bounty',ash);q.accept();const g=q.person,r0=t.Givers.regard(g);q.done=true;t.payQuest(q,ash.name);
  ok(t.Givers.regard(g)===r0+t.GIVER_REGARD.done,'a job done: '+g.name+' thinks better of you ('+t.Givers.regard(g)+')');
  const v=t.TOWNS.find(z=>z.kind==='village'),rv=t.Givers.of(v).find(x=>x.role==='reeve');t.ensureEcon(v);v.stock.grain=50;
  const q2={type:'bounty',reward:{gold:100,rep:2,honor:0,xp:10}};t.JobQuest.purse(q2,rv,v);ok(q2.reward.gold===Math.round(100*rv.pays)&&q2.reward.goods&&q2.reward.goods[1]>0,'a village reeve pays part in goods: '+q2.reward.gold+' gold and '+(q2.reward.goods||[]).join(' '))}
 P.quests=[];Kit.clear();
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
