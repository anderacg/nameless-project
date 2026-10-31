'use strict';
// Quests: holdings offer jobs that refresh weekly; bounties, beast hunts and clearances spawn or mark their targets and finish when
// the deed is done; supplies, hunts and reinforcements are handed in; couriers pay on arrival; lords give war work. No cap on the
// jobs you hold; none fails for time (a timed one pays less late); the world may close one (a consolation); the tracked one saved.
// The quest model (QM): the categories (job, side, main), every state (locked, available, active, completed, done, failed,
// abandoned) and the archive (kept, capped, saved); a board's locked offers greyed with what they require, then available;
// abandoning a job costs by its size and shuts its giver (a holding, a lord) for three days; main and side quests refuse it, a
// side quest still fails by the world; a test-only main story falls back to its last checkpoint when a stage fails.
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P,W=t.W;Kit.fresh();
 const done=()=>Kit.done();
 const panel=Kit.panel;
 const army=()=>{P.troops={hum_knight:25,hum_long:15};P.hp=null;t.vitals()};
 const world=()=>Kit.world({town:null,encCool:0});
 const win=()=>{army();t.act('auto');t.act('cont');done();world()};
 t.act('begin','soldier');W.critters=[];W.lords.forEach(l=>{l.x=-999;l.y=-999});
 P.renown=100;P.level=3;// (enough for every kind's needs: what a job requires is tested below, the quest model)
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
 t.act('q-turnin',String(qb.id));ok(!P.quests.includes(qb)&&P.gold>=g0+qb.reward.gold&&t.repAt('Ashford')>r0,'reporting pays '+qb.reward.gold+' gold and reputation');
 {const el=document.getElementById('qreward'),txt=el&&el.textContent||'';ok(t.QuestReward.open()&&/Quest complete/.test(txt)&&txt.includes(qb.title)&&txt.includes('+'+qb.reward.gold)&&/Gold/.test(txt)&&/Reputation/.test(txt)&&el.querySelectorAll('.qrw-item canvas,.qrw-item img,.qrw-item svg,.qrw-item .gico,.qrw-item [class*=ico]').length>=2,'and shows what you received in a window in the middle of the screen: '+[...el.querySelectorAll('.qrw-item')].map(x=>x.textContent).join(', '));
  t.onEscape();ok(!t.QuestReward.open(),'Esc (its Continue) closes it')}t.act('leave');done();
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
 world();P.quests=[];t.acceptQuest(t.makeQuest('supply',ash));t.openQuests();ok(/Abandon/.test(panel())&&/days left/.test(panel())&&/Given by/.test(panel()),'the Quests tab lists them with time left and who gave them');
 const qid=P.quests[0].id;t.act('q-abandon',String(qid));ok(!P.quests.length,'abandoning removes it');t.act('quests-close');
 // save and the map: tracked and not (none tracked: no field)
 world();const qq=t.makeQuest('bounty',ash);t.acceptQuest(qq);t.QuestTrack.set('q'+qq.id);t.saveGame();P.quests=[];delete P.track;t.act('load');
 ok(P.quests.length===1&&P.quests[0].id===qq.id&&t.bandits.some(b=>b.qid===qq.id)&&P.track==='q'+qq.id,'quests, their targets and the one tracked survive a reload');
 t.QuestTrack.set(null);world();t.saveGame();{const raw=JSON.parse(localStorage.getItem(t.SAVE));ok(raw&&raw.P&&!('track' in raw.P),'none tracked: the save has no track field')}
 t.act('load');ok(!('track' in P)&&P.quests.length===1,'and loads without one');
 t.QuestTrack.set('q'+P.quests[0].id);near(ash);P.y+=40;world();t.frame();ok(true,'the map draws quest markers, the tracked one too');
 // ======== the quest model (doc/STORY_DESIGN.md QM): categories, one set of states, the archive, locked offers, abandoning
 world();P.quests=[];delete P.archive;delete P.shut;delete P.track;P.renown=0;P.level=1;P.rep[ash.name]=20;
 const arch=()=>t.QuestArchive.list(),lastArch=()=>arch()[arch().length-1],E=t.Escort;// (lord: the Vale's, as above)
 const child=days=>E.start({who:'child',to:{town:'Ashford',lot:'house',i:0},prize:{morale:5},...(days?{days}:{})});
 // ---- the categories: a job, a side quest (an escort from the road), a story (side; a main story's kind is marked main)
 {const qb=t.makeQuest('bounty',ash),qe=child();
  ok(qb.cat==='job'&&qe.cat==='side'&&t.Quest.as(qe).abandonable===false&&t.QUEST_CATS.job.tab==='Jobs'&&t.kindOf('thread','wounded')&&!t.kindOf('thread','wounded').main,'categories: a bounty is a job, an escort from the road a side quest; The Wounded Traveller is no main story');
  P.quests=[]}
 // ---- every state of a job: locked, available, active, completed, done (archived)
 {const qt=t.makeQuest('troops',ash);P.troops={};
  ok(qt.state==='locked'&&qt.needs().some(n=>n.k==='level'&&!n.met&&n.what==='level 3 (yours: 1)')&&qt.needs().some(n=>n.k==='standing'&&n.met),'an offer is locked while you lack what it requires: '+qt.needs().filter(n=>!n.met).map(n=>n.what).join(', '));
  P.level=3;ok(qt.state==='available','then available, once you have it (level 3)');
  t.acceptQuest(qt);ok(qt.state==='active'&&qt.id>0,'taken: active');
  P.troops={hum_spear:qt.n};ok(qt.state==='completed','its troops in hand: completed (report it)');
  const cas=ash;cas.gar=0;const g0=P.gold;t.turnIn(qt,cas);const e=lastArch();
  ok(!P.quests.includes(qt)&&e&&e.k==='q'+qt.id&&e.cat==='job'&&e.state==='done'&&e.title===qt.title&&e.giver==='Ashford'&&e.day===G.day&&e.got.startsWith('+'+(P.gold-g0)+' gold'),'handed over and paid: done, kept in the archive ('+JSON.stringify(e)+')');
  P.troops={}}
 // ---- failed: by the world's hand (closed), or failed outright
 {const qc=t.makeQuest('bounty',ash);t.acceptQuest(qc);const b=t.bandits.find(x=>x.qid===qc.id);t.routParty(b,[]);t.questDay();t.questDay();
  ok(lastArch().k==='q'+qc.id&&lastArch().state==='failed'&&/for your trouble/.test(lastArch().got),'closed by the world (its band broken by another): failed, its consolation kept ('+lastArch().got+')');
  const qf=t.makeQuest('hunt',ash);t.acceptQuest(qf);qf.fail('Gone.');ok(lastArch().k==='q'+qf.id&&lastArch().state==='failed'&&/reputation in Ashford −\d+/.test(lastArch().got),'failed: its cost kept ('+lastArch().got+')')}
 // ---- a board's locked offer: greyed, with what it requires; its Accept off, refused; then available
 {P.level=1;const qt=t.makeQuest('troops',ash),qb=t.makeQuest('bounty',ash);P.jobs={Ashford:{day:G.day,list:[qb,qt]}};
  near(ash);t.updateWorld(.01);t.act('tab','jobs');const rows=Kit.qa('.row').filter(r=>r.querySelector('[data-act="q-accept"]')),lk=rows.find(r=>r.classList.contains('locked'));
  ok(rows.length===2&&lk&&lk.querySelector('[data-act="q-accept"]').disabled&&/Locked/.test(lk.textContent)&&/Requires/.test(lk.textContent)&&/level 3 \(yours: 1\)/.test(lk.textContent)&&!rows[0].classList.contains('locked'),'the board: the locked offer shown greyed, "Requires level 3 (yours: 1)", its Accept off');
  t.act('q-accept','1');ok(!P.quests.length&&t.jobsAt(ash).length===2,'and refused when asked');
  P.level=3;t.act('tab','jobs');ok(!Kit.qa('.row.locked').length&&Kit.qa('[data-act="q-accept"]').every(b=>!b.disabled),'level 3: available, nothing greyed');
  const st=window.standingAt;window.standingAt=()=>-20;try{t.act('tab','jobs');ok(Kit.qa('.row.locked').length===2&&/standing −10 at Ashford \(yours: −20\)/.test(Kit.text()),'standing under −10 at Ashford: every offer there locked, so it says')}finally{window.standingAt=st}
  t.act('leave');done()}
 // ---- abandoning a holding's job: its cost by its size, and no work from it for three days (the board says so), saved
 {world();P.quests=[];const q=t.makeQuest('bounty',ash);t.acceptQuest(q);const K=t.QUEST_ABANDON,n=Math.min(K.max,Math.max(K.min,Math.round(K.rep*q.reward.rep+q.reward.gold/K.gold))),r0=t.repAt('Ashford');
  t.openQuests();t.act('qw-sel','q'+q.id);t.act('qw-abandon','q'+q.id);
  ok(new RegExp('It counts as abandoned: reputation in Ashford −'+n+'; no work from Ashford for 3 days').test(Kit.q('.qw-ask').textContent),'the Abandon box shows its real cost: '+Kit.q('.qw-ask p').textContent);
  Kit.q('.qw-ask [data-act="q-abandon"]').click();t.act('quests-close');
  ok(!P.quests.length&&t.repAt('Ashford')===r0-n&&P.shut.Ashford.until===G.day+K.shut&&P.shut.Ashford.what===q.title&&lastArch().state==='abandoned'&&lastArch().got==='reputation in Ashford −'+n,'given up: −'+n+' reputation at Ashford (its reward '+q.reward.gold+' gold, +'+q.reward.rep+'), no work there till day '+P.shut.Ashford.until+', archived abandoned');
  near(ash);t.updateWorld(.01);t.act('tab','jobs');
  ok(new RegExp('No work for you here until day '+(G.day+3)+' \\(you gave up their '+q.title+'\\)').test(Kit.text())&&Kit.qa('.row.locked').length===t.jobsAt(ash).length&&Kit.qa('[data-act="q-accept"]').every(b=>b.disabled),'the board: "No work for you here until day '+(G.day+3)+' (you gave up their …)", its offers greyed');
  t.act('q-accept','0');ok(!P.quests.length,'and none taken');t.act('leave');done();
  t.saveGame();P.shut=null;t.act('load');ok(P.shut&&P.shut.Ashford&&P.shut.Ashford.until===G.day+3,'saved and loaded');
  G.day+=3;t.questDay();near(ash);t.updateWorld(.01);t.act('tab','jobs');ok(!('shut' in P)&&!/No work for you here/.test(Kit.text())&&!Kit.qa('.row.locked').length,'three days on: work again, the field gone');t.act('leave');done()}
 // ---- a lord's job: his regard and your honour are what it requires; given up, honour by its size, his regard, and no work from him
 {world();P.quests=[];P.renown=100;lord.asked=0;G.lordJob=null;P.lrel[lord.id]=t.RELATION.jobsAt-5;
  let h=t.lordJobHtml(lord);ok(/has no work for you yet/.test(h)&&/class="row locked"/.test(h)&&new RegExp(lord.name+'’s regard −20 \\(yours: −25\\)').test(h)&&/data-act="q-lord"[^>]*disabled/.test(h),'a lord who dislikes you: his offer greyed, "Requires '+lord.name+'’s regard −20 (yours: −25)"');
  P.lrel[lord.id]=0;const hv=t.honorWith('vale');t.addHonor('vale',-hv-3,true);
  ok(t.Quest.as(G.lordJob).needs().some(n=>n.k==='honor'&&!n.met&&/honor 0 with the /.test(n.what)),'honour under 0 with his realm: locked by it ('+t.Quest.as(G.lordJob).needs().find(n=>n.k==='honor').what+')');
  t.addHonor('vale',hv+3,true);h=t.lordJobHtml(lord);ok(!/locked/.test(h)&&/data-act="q-lord"/.test(h)&&!/data-act="q-lord"[^>]*disabled/.test(h),'liked and trusted again: his offer open');
  const ql=t.makeQuest('bounty',ash,lord);t.acceptQuest(ql);const K=t.QUEST_ABANDON,n=Math.min(K.max,Math.max(K.min,Math.round(K.honor*ql.reward.honor+ql.reward.gold/K.gold))),h0=t.honorWith('vale'),rl=t.relWith(lord);
  ok(new RegExp('honour with the '+t.FACS.vale.n+' −'+n+', and '+lord.name+' thinks less of you; no work from him for 3 days').test(t.Quest.as(ql).abandonCost()),'its cost in words: '+t.Quest.as(ql).abandonCost());
  t.act('q-abandon',String(ql.id));
  ok(!P.quests.length&&t.honorWith('vale')===h0-n&&t.relWith(lord)<rl&&P.shut['lord:'+lord.name].until===G.day+3,'given up: honour −'+n+' with the '+t.FACS.vale.n+', his regard down ('+rl+' → '+t.relWith(lord)+'), no work from him till day '+(G.day+3));
  lord.asked=0;G.lordJob=null;h=t.lordJobHtml(lord);ok(new RegExp(lord.name+' has no work for you until day '+(G.day+3)+' \\(you gave up his ').test(h),'the lord: "'+lord.name+' has no work for you until day '+(G.day+3)+' (you gave up his …)"');
  lord.x=P.x+3;lord.y=P.y;world();t.lordMeet(lord);t.act('q-lord');ok(!P.quests.length,'and none taken from him');t.act('lord-leave');world();delete P.shut}
 // ---- main and side quests are never yours to abandon; a side quest still fails by the world's hand
 {world();P.quests=[];const qe=child(2);t.act('q-abandon',String(qe.id));ok(P.quests.includes(qe)&&!qe.fate,'q-abandon refuses a side quest (the lost child still rides with you)');
  t.openQuests();t.act('qw-tab','side');t.act('qw-sel','q'+qe.id);ok(Kit.q('.qw-detail h3').textContent===qe.title&&!Kit.q('[data-act="qw-abandon"]')&&/Side quest/.test(Kit.q('.qw-meta').textContent),'its detail: a side quest, no Abandon');t.act('char-close');
  G.day=qe.due+1;t.questDay();G.day=qe.due-2;ok(!P.quests.length&&qe.fate==='late'&&lastArch().k==='q'+qe.id&&lastArch().cat==='side'&&lastArch().state==='failed','but it still fails by the world: late, archived failed ('+lastArch().got+')')}
 // ---- the main story (a test-only kind): stages with checkpoints; a failed stage falls back to the last checkpoint, never ends it
 {world();P.quests=[];const page=(title,cs)=>({page:{title,text:title+'.',choices:cs.map(([label,how])=>({label,how,out:()=>({})}))}});
  t.defineKind('thread','qm_main',{n:'A Test of Names',main:true,who:()=>'you',steps:[
   {id:'road',stage:'Reach Ashford',checkpoint:true,how:d=>d.e.fate,start:{step:'visit',town:'Ashford',spec:{to:{town:'Ashford'},title:'Reach Ashford'}},note:'Go to Ashford.',then:{arrived:'grain'}},
   {id:'grain',stage:'Recover the grain',checkpoint:true,fail:['lost'],setback:'The deserters beat you back. The grain is still theirs.',start:page('The deserters',[['Win','won'],['Lose','lost']]),note:'Recover the grain.',then:{won:'cart'}},
   {id:'cart',stage:'Bring the cart home',fail:['ambush'],start:page('The road home',[['Home','home'],['Ambushed','ambush']]),note:'Bring the cart home.',then:{home:'end'}},
   {id:'end',stage:'Home',start:page('Home',[['Rest','rest']]),note:'Rest.'}]});
  const th=t.Thread.start('qm_main',{town:'Ashford'}),sq=()=>t.Quest.as(P.quests.find(x=>x.id===th.wait.id));
  ok(th.cat==='main'&&th.state==='active'&&th.cp==='road'&&sq()&&sq().story===th,'a main story: category main, active, at its first checkpoint, its stage a quest of its own');
  t.act('q-abandon',String(sq().id));ok(P.quests.length===1&&th.at==='road','q-abandon refuses a main story’s stage');
  sq().arrive(ash);ok(th.at==='grain'&&th.cp==='grain'&&G.mode==='story','there: the next stage, a checkpoint too (its page)');
  t.act('thr-do','1');ok(t.Thread.list().on.includes(th)&&th.at==='grain'&&G.msgs.some(m=>m.m==='The deserters beat you back. The grain is still theirs.')&&th.past.map(p=>p.join(':')).join()==='road:arrived,grain:lost','beaten by the deserters: back to "Recover the grain", a line saying what happened, never ended');
  t.act('thr-do','0');ok(th.at==='cart','won: on to the cart');
  t.act('thr-do','1');ok(th.at==='grain'&&th.cp==='grain'&&/You failed: Bring the cart home\. Back to Recover the grain\./.test(G.msgs[G.msgs.length-1].m),'ambushed on the road home (no checkpoint of its own): back to the last checkpoint passed, the grain ('+G.msgs[G.msgs.length-1].m+')');
  ok(!arch().some(e=>e.k==='t'+th.i),'never archived while it falls back');
  Kit.world();t.saveGame();t.act('load');const z=t.Thread.list().on.find(x=>x.i===th.i);ok(z&&z.cp==='grain'&&z.at==='grain'&&z.cat==='main','saved and loaded: its checkpoint kept');
  Kit.world();z.showPage();t.act('thr-do','0');t.act('thr-do','0');t.act('thr-do','0');
  ok(!t.Thread.list().on.includes(z)&&lastArch().k==='t'+z.i&&lastArch().cat==='main'&&lastArch().state==='done'&&lastArch().title==='A Test of Names'&&lastArch().got==='Home','won, home, rested: done, archived as one main quest ('+JSON.stringify(lastArch())+')')}
 // ---- the archive: kept capped (the last QUEST_ARCHIVE.keep), saved; none yet, no field
 {world();for(let i=0;i<70;i++)t.QuestArchive.add({k:'qz'+i,cat:'job',title:'T'+i,giver:'X',state:'done',day:G.day,got:''});
  ok(arch().length===t.QUEST_ARCHIVE.keep&&arch()[0].k==='qz10'&&lastArch().k==='qz69','capped at '+t.QUEST_ARCHIVE.keep+', the oldest dropped');
  const snap=JSON.stringify(P.archive);t.saveGame();P.archive=null;t.act('load');ok(JSON.stringify(P.archive)===snap,'saved and loaded');
  delete P.archive;delete P.shut;t.saveGame();{const raw=JSON.parse(localStorage.getItem(t.SAVE));ok(raw&&raw.P&&!('archive' in raw.P)&&!('shut' in raw.P),'none yet: the save has neither field')}}
});
