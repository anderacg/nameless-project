'use strict';
// Quests: holdings offer jobs that refresh weekly; bounties, beast hunts and clearances spawn or mark their targets and finish when
// the deed is done; supplies, hunts and reinforcements are handed in; couriers pay on arrival; lords give war work. No cap on the
// jobs you hold; none fails for time (a timed one pays less late); the world may close one (a consolation); the tracked one saved.
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
 // no cap: as many jobs as you like (the boards still limit the work: JOB_OFFERS a week), a plain count
 world();P.quests=[];for(let k=0;k<6;k++){const q=t.makeQuest('supply',ash);t.acceptQuest(q)}
 ok(P.quests.length===6&&t.Quest.jobs()===6&&(()=>{try{t.QUEST_MAX;return false}catch(e){return true}})(),'no cap: six jobs held at once (QUEST_MAX is gone)');
 P.jobs={};near(ash);t.updateWorld(.01);t.act('tab','jobs');
 ok(/you hold 6 jobs/.test(Kit.text())&&!/\d+ \/ 4/.test(Kit.text())&&Kit.qa('[data-act="q-accept"]').length===2&&Kit.qa('[data-act="q-accept"]').every(b=>!b.disabled),'the board: a plain count, two offers, none greyed');
 ok(Kit.qa('.row .qfacts').length===2&&/Given by/.test(Kit.text())&&/Turn in/.test(Kit.text())&&/(No time limit|Best by day \d+ \(\d+ days? left\); later pays less)/.test(Kit.text()),'each offer shows who gives it, its timing and where it is turned in, before you accept');
 t.act('leave');done();
 // no fail by time: a bounty, a hunt and reinforcements have no timing; forty days on they are still yours
 world();P.quests=[];const d0=G.day,untimed=['bounty','hunt','troops'].map(k=>{const q=t.makeQuest(k,ash);t.acceptQuest(q);return q});
 ok(untimed.every(q=>q.days==null&&q.due==null&&q.taken===d0&&!q.timed&&q.timing()==='No time limit'),'untimed kinds: no days, no due day, only the day taken');
 for(let k=0;k<40;k++){G.day++;t.questDay()}ok(untimed.every(q=>P.quests.includes(q)),'forty days on, still yours: no job fails for time');G.day=d0;
 // best by: a courier paid in full on time, 10% less a day past it, never under half
 P.quests=[];let qr2=null;for(let k=0;k<10&&!qr2;k++)qr2=t.makeQuest('courier',ash);
 ok(t.questFacts(qr2).some(([k,v])=>k==='Timing'&&v==='Best by day '+(G.day+qr2.days)+' ('+qr2.days+' days left); later pays less'),'the offer says its best-by day: later pays less');
 t.acceptQuest(qr2);const R=qr2.reward.gold,at=d=>{G.day=d;return qr2.earned()};
 ok(qr2.timed&&qr2.due===d0+qr2.days&&qr2.taken===d0,'a courier taken: best by day '+qr2.due);
 ok(at(qr2.due)===R&&at(qr2.due+1)===Math.round(R*.9)&&at(qr2.due+3)===Math.round(R*.7)&&at(qr2.due+5)===Math.round(R*.5)&&at(qr2.due+12)===Math.round(R*.5),'its pay: '+R+' on time, -10% a day past it, never under half ('+[0,1,3,5,12].map(d=>at(qr2.due+d)).join(', ')+')');
 G.day=qr2.due+2;t.questDay();ok(P.quests.includes(qr2)&&/2 days past: it pays 80% now/.test(qr2.timing()),'two days past its best-by day: still yours, '+qr2.timing());
 {const g=P.gold;t.questArrive(t.townBy(qr2.to));ok(!P.quests.includes(qr2)&&P.gold-g===Math.round(R*.8),'delivered two days late: paid '+(P.gold-g)+' of '+R)}
 G.day=d0;
 // the world closes one: the bounty band broken by others, a consolation once, not a failure
 world();P.quests=[];const qc2=t.makeQuest('bounty',ash);t.acceptQuest(qc2);const b2=t.bandits.find(b=>b.qid===qc2.id),g3=P.gold,r3=t.repAt('Ashford'),ends=[],fn=e=>ends.push(e.how);t.worldOn('quest:ended',fn);
 try{t.questDay();ok(P.quests.includes(qc2),'its band about: still open');
  t.routParty(b2,[]);t.questDay();t.questDay();
  ok(!P.quests.includes(qc2)&&P.gold===g3+Math.round(qc2.reward.gold*t.QUEST_CLOSED.gold)&&t.repAt('Ashford')===r3&&ends.join()==='closed'&&G.msgs.some(m=>/^Quest over: .*Someone else broke the /.test(m.m)),'broken by another: closed with '+(P.gold-g3)+' gold once, its line, no reputation lost')}
 finally{t.worldOff('quest:ended',fn)}
 // the Quests tab, abandoning
 world();P.quests=[];t.acceptQuest(t.makeQuest('supply',ash));t.openChar();t.act('char-tab','quests');ok(/Abandon/.test(panel())&&/days left/.test(panel())&&/Given by/.test(panel()),'the Quests tab lists them with time left and who gave them');
 const qid=P.quests[0].id;t.act('q-abandon',String(qid));ok(!P.quests.length,'abandoning removes it');t.act('char-close');
 // save and the map: tracked and not (none tracked: no field)
 world();const qq=t.makeQuest('bounty',ash);t.acceptQuest(qq);t.QuestTrack.set('q'+qq.id);t.saveGame();P.quests=[];delete P.track;t.act('load');
 ok(P.quests.length===1&&P.quests[0].id===qq.id&&t.bandits.some(b=>b.qid===qq.id)&&P.track==='q'+qq.id,'quests, their targets and the one tracked survive a reload');
 t.QuestTrack.set(null);world();t.saveGame();{const raw=JSON.parse(localStorage.getItem(t.SAVE));ok(raw&&raw.P&&!('track' in raw.P),'none tracked: the save has no track field')}
 t.act('load');ok(!('track' in P)&&P.quests.length===1,'and loads without one');
 t.QuestTrack.set('q'+P.quests[0].id);near(ash);P.y+=40;world();t.frame();ok(true,'the map draws quest markers, the tracked one too');
});
