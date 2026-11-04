'use strict';
// The new kinds (doc/QUESTS_DESIGN.md §5.5, §5.10, Q6): a courier's letter is a real one in your bag (what its realm writes,
// world/letters.js), paid on arrival, less if you read it, failed if it is gone from your bag; a lord's: relieve a holding of
// his under siege (its besieger beaten; closed once the siege is over), and find an enemy lord's army (a lead; done once seen).
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TILE=t.TILE;Kit.begin('soldier',11);Kit.world();Kit.clear();
 const ash=t.townBy('Ashford');P.quests=[];
 // ======== the courier's letter
 {let q=null;for(let k=0;k<10&&!q;k++)q=t.makeQuest('courier',ash);q.accept();const L=q.carried();
  ok(L&&L.to===q.to&&L.from==='Ashford'&&L.seal===1&&L.job===q.id&&t.LETTER.text(L).length>10,'taken: a real sealed letter in your bag, to '+q.to+': “'+(L&&t.LETTER.text(L))+'”');
  ok(!t.LETTER_VERBS.find(c=>c.label==='Deliver it').when(L),'it is delivered on arrival, not by hand');
  const d=t.townBy(q.to),g0=P.gold,full=q.reward.gold;L.seal=0;t.questArrive(d);
  ok(!P.quests.includes(q)&&P.gold-g0===Math.round(full*t.COURIER.opened)&&t.LETTER.slotOf(L.id)<0&&G.msgs.some(m=>/frowns at the broken seal/.test(m.m)),'read on the way: paid half ('+(P.gold-g0)+' of '+full+'), the lord frowns, the letter handed over')}
 {let q=null;for(let k=0;k<10&&!q;k++)q=t.makeQuest('courier',ash);q.accept();P.inv[t.LETTER.slotOf(q.letter)]=null;t.questDay();
  ok(!P.quests.includes(q)&&G.msgs.some(m=>/You no longer carry the letter/.test(m.m)),'sold or burnt: the job fails')}
 // ======== a lord's: relieve a siege
 const facs=Object.keys(t.FACS).filter(f=>f!=='player');for(const a of facs)for(const b of facs)if(a<b)W.rel[t.rk(a,b)]={s:'war',since:G.day};W.lords.forEach(l=>{l.dead=false});
 const lord=W.lords.find(l=>l.fac===ash.owner),foe=W.lords.find(l=>t.atWar(l.fac,ash.owner));
 {foe.state='siege';foe.tgt=ash.name;foe.x=ash.x+20;foe.y=ash.y;const q=t.makeQuest('relieve',ash,lord);
  ok(q&&q.town==='Ashford'&&q.besieger===foe.name&&q.cause.includes('siege'),lord.name+' asks you to relieve Ashford, besieged by '+foe.name);q.accept();
  t.worldEmit('lord:beaten',{lord:W.lords.find(l=>l!==foe&&l.fac!==ash.owner)||{tgt:'nowhere',fac:foe.fac}});ok(!q.done,'another lord beaten: not done');
  t.worldEmit('lord:beaten',{lord:foe});ok(q.done,'its besieger beaten: done');P.quests=[];
  const q2=t.makeQuest('relieve',ash,lord);q2.accept();foe.state='rest';t.questDay();ok(!P.quests.includes(q2),'the siege over without you: closed');P.quests=[]}
 // ======== a lord's: find an army
 {foe.state='march';foe.inside=null;foe.x=ash.x+900;foe.y=ash.y+300;P.x=ash.x-1500;P.y=ash.y-1500;const q=t.makeQuest('scout',ash,lord);
  ok(q&&q.foeName&&q.cause.includes(q.foeName),lord.name+' wants '+(q&&q.foeName)+'’s army found');q.accept();
  const g=t.questGoal(q);ok(g&&g.r>0&&!q.done,'a lead: where it was last heard of');
  const f=q.foe();P.x=f.x+20;P.y=f.y;t.questGoal(q);ok(q.found&&q.done,'seen: found, done; report back');P.quests=[]}
 Kit.clear();
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
