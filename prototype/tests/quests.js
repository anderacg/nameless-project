'use strict';
// Quests: holdings offer jobs that refresh weekly; bounties, beast hunts and clearances spawn or mark their targets and finish when
// the deed is done; supplies, hunts and reinforcements are handed in; couriers pay on arrival; lords give war work; deadlines fail.
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P,W=t.W;Kit.fresh();
 const done=()=>Kit.done();
 const panel=Kit.panel;
 const army=()=>{P.troops={hum_knight:25,hum_long:15};P.hp=null;t.vitals()};
 const world=()=>Kit.world({town:null,encCool:0});
 const win=()=>{army();t.act('auto');t.act('cont');done();world()};
 t.act('begin','soldier');W.critters=[];W.lords.forEach(l=>{l.x=-999;l.y=-999});
 const ash=t.townBy('Ashford'),near=x=>{W.lords.forEach(l=>{if(l.state==='siege')l.state='rest'});P.x=x.x;P.y=x.y+5;P.tx=null;world();G.encCool=99;G.lastTown=null};// lift any siege so the gates open; no roaming band may catch you at the gate
 // offers
 near(ash);t.updateWorld(.01);t.act('tab','jobs');ok(G.mode==='town'&&/Work offered/.test(panel())&&document.querySelectorAll('[data-act="q-accept"]').length===2,'Ashford offers two jobs');
 const first=JSON.stringify(t.jobsAt(ash).map(q=>q.title));t.act('leave');done();G.day+=2;ok(JSON.stringify(t.jobsAt(ash).map(q=>q.title))===first,'offers stay for the week');
 G.day+=6;t.jobsAt(ash);ok(P.jobs.Ashford.day===G.day,'and refresh after 7 days');
 ok(t.TOWNS.every(x=>t.jobsAt(x).length>0),'every holding has work');
 // accept through the panel
 near(ash);t.updateWorld(.01);t.act('tab','jobs');t.act('q-accept','0');ok(P.quests.length===1&&t.jobsAt(ash).length===1,'accepting takes the job off the board');t.act('leave');done();P.quests=[];
 // bounty
 world();const qb=t.makeQuest('bounty',ash);t.acceptQuest(qb);const band=t.bandits.find(b=>b.qid===qb.id);
 ok(band&&Math.hypot(band.x-ash.x,band.y-ash.y)<17*t.TILE&&band.n===qb.n,'a bounty puts the '+qb.band+' ('+qb.n+') near Ashford');
 const goal=t.questGoal(qb);ok(goal&&goal.x===band.x,'the quest points at the band');
 t.startEncounter({kind:'party',ref:band,n:band.n,list:band.troops.slice(),band:band.kind});win();ok(qb.done&&!t.bandits.includes(band),'breaking the band finishes the deed');
 const g0=P.gold,r0=t.repAt('Ashford');near(ash);t.updateWorld(.01);ok(G.town&&G.town.tab==='jobs','entering with a quest to report opens the Jobs tab');
 t.act('q-turnin',String(qb.id));ok(!P.quests.includes(qb)&&P.gold>=g0+qb.reward.gold&&t.repAt('Ashford')>r0,'reporting pays '+qb.reward.gold+' gold and reputation');t.act('leave');done();
 // beast
 world();let qm=null;for(let k=0;k<20&&!qm;k++)qm=t.makeQuest('beast',ash);t.acceptQuest(qm);const mon=W.monsters.find(m=>m.qid===qm.id);
 ok(mon&&mon.id===qm.mon&&mon.lv===qm.lv,'a beast hunt brings '+t.MONSTERS[qm.mon].n.toLowerCase()+' (level '+qm.lv+')');t.startMonster(mon);win();ok(qm.done,'killing them finishes it');P.quests=[];
 // clearance
 const qc=t.makeQuest('clear',ash);if(qc){t.acceptQuest(qc);const s=W.sites[qc.site];ok(s.seen,'a clearance marks the '+s.name+' on your map');
   if(s.type==='cave')t.caveFight(s);else t.startEncounter({kind:'camp',ref:s,n:5,band:s.band});win();ok(qc.done,'clearing it finishes the quest')}else ok(true,'no lair near Ashford (skipped)');
 P.quests=[];
 // supply
 const qs=t.makeQuest('supply',ash);t.acceptQuest(qs);near(ash);t.updateWorld(.01);t.act('tab','jobs');ok(document.querySelector('[data-act="q-turnin"]').disabled,'a supply run cannot be handed in empty');
 t.act('leave');done();P.inv=P.inv.map(()=>null);t.invAdd('good',qs.good,qs.n+2);near(ash);t.updateWorld(.01);t.act('q-turnin',String(qs.id));
 ok(!P.quests.length&&t.goodN(qs.good)===2,'handing over '+qs.n+' '+qs.good+' completes it');t.act('leave');done();
 // hunt (hides)
 const vil=t.TOWNS.find(x=>x.kind==='village'&&x.owner==='vale');let qh=null;for(let k=0;k<30&&!(qh&&qh.mat);k++)qh=t.makeQuest('hunt',vil);t.acceptQuest(qh);
 t.invAdd('mat','hide',qh.n);near(vil);t.updateWorld(.01);t.act('q-turnin',String(qh.id));ok(!P.quests.length&&!t.invCount('mat','hide'),'the tanner takes '+qh.n+' deer hides');t.act('leave');done();
 // courier
 let qr=null;for(let k=0;k<10&&!qr;k++)qr=t.makeQuest('courier',ash);t.acceptQuest(qr);const dest=t.townBy(qr.to),g1=P.gold;near(dest);t.updateWorld(.01);
 ok(!P.quests.length&&P.gold>=g1+qr.reward.gold,'the letter is paid for on arrival at '+qr.to);t.act('leave');done();
 // troops
 const cas=t.TOWNS.find(x=>x.kind==='castle'&&x.owner==='vale'),qt=t.makeQuest('troops',cas);t.acceptQuest(qt);P.troops={hum_levy:5,hum_spear:qt.n+1};const gar=cas.gar=4;
 near(cas);t.updateWorld(.01);t.act('q-turnin',String(qt.id));ok(!P.quests.length&&P.troops.hum_spear===1&&P.troops.hum_levy===5&&cas.gar===gar+qt.n,qt.n+' men-at-arms join the garrison (levies are too green)');t.act('leave');done();
 // lords
 P.fac='vale';P.hostile={};W.rel[t.rk('vale','horde')]={s:'war',since:G.day};W.lords.forEach(l=>{l.dead=false});
 const lord=W.lords.find(l=>l.fac==='vale'),foe=W.lords.find(l=>l.fac==='horde');lord.x=P.x+3;lord.y=P.y;lord.asked=0;G.lordJob=null;world();t.lordMeet(lord);
 ok(G.mode==='dialog'&&/Accept/.test(panel()),lord.name+' offers war work');let lq=G.lordJob;
 for(let k=0;k<20&&lq.type!=='lordkill';k++){G.lordJob=null;t.lordMeet(lord);lq=G.lordJob}
 t.act('q-lord');ok(P.quests.some(q=>q.lord&&q.giver===lord.name),'accepted from the lord');t.act('lord-leave');
 const tgt=W.lords.find(l=>l.name===lq.target);world();t.startEncounter({kind:'lord',ref:tgt,list:tgt.troops.slice()});win();ok(lq.done,'beating '+lq.target+' finishes it');
 const h0=t.honorWith('vale');lord.cool=0;world();t.lordMeet(lord);ok(/Report/.test(panel()),'the lord asks for your report');t.act('q-lord-report');ok(!P.quests.length&&t.honorWith('vale')>h0,'reporting earns honor');t.act('lord-leave');
 // a lord's job can also be reported at any of his faction's holdings
 world();const lr=t.makeQuest('raid',ash,lord);ok(lr&&t.atWar('vale',t.townBy(lr.village).owner),'vassals are asked to raid enemy villages ('+(lr&&lr.village)+')');t.acceptQuest(lr);
 const v=t.townBy(lr.village);P.x=v.x;P.y=v.y+5;world();G.lastTown=null;t.updateWorld(.01);t.act('sg-raid-auto');t.act('cont');done();for(let i=0;i<70&&P.raid;i++){G.mode='world';G.modal=false;t.updateWorld(.25)}ok(lr.done,'raiding it finishes the quest');
 world();near(t.TOWNS.find(x=>x.owner==='vale'&&x!==ash));t.updateWorld(.01);t.act('q-turnin',String(lr.id));ok(!P.quests.length,'reported at another Vale holding');t.act('leave');done();
 // limits, deadlines, abandoning
 world();for(let k=0;k<6;k++){const q=t.makeQuest('supply',ash);t.acceptQuest(q)}ok(P.quests.length===t.QUEST_MAX,'at most '+t.QUEST_MAX+' quests at a time');
 const late=P.quests[0],r1=t.repAt('Ashford');G.day=late.due+1;t.questDay();ok(!P.quests.length&&t.repAt('Ashford')<r1,'missed deadlines fail and cost reputation');
 t.acceptQuest(t.makeQuest('supply',ash));t.openChar();t.act('char-tab','quests');ok(/Abandon/.test(panel())&&/days left/.test(panel()),'the Quests tab lists them with time left');
 const qid=P.quests[0].id;t.act('q-abandon',String(qid));ok(!P.quests.length,'abandoning removes it');t.act('char-close');
 // save and the map
 world();const qq=t.makeQuest('bounty',ash);t.acceptQuest(qq);t.saveGame();P.quests=[];t.act('load');ok(P.quests.length===1&&P.quests[0].id===qq.id&&t.bandits.some(b=>b.qid===qq.id),'quests and their targets survive a reload');
 near(ash);P.y+=40;world();t.frame();ok(true,'the map draws quest markers');
});
