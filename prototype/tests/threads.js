'use strict';
// Threads and gatherings (doc/STORY_DESIGN.md §2, §6: the story wave's S5, the frameworks only). The game registers no kind of
// either, keeps no store of them and saves neither key, its day check last of the day; the test kinds (tests/kit.js
// Kit.storyKinds) prove them: a thread started by an outcome takes a job, then (paid) meets an encounter, or (failed) shows a page,
// its memory shared, saved and loaded midway, ended once on the bus; a gathering at three holdings is announced, opened and
// closed on its days, its calendar kept in order, saved and loaded, entered on its page. Written on the test kit (tests/kit.js).
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,Th=t.Thread,Ga=t.Gathering;Kit.begin('soldier',73);Kit.clear();Kit.world();
 // ---- the game: none of either, nothing kept, nothing saved, the day's order as it was with the gatherings' check last
 {for(let i=0;i<2;i++)t.dayTick();Kit.world();const keys=Object.keys(t.worldSave());
  ok(t.Kinds.all('thread').filter(k=>!k.book).map(k=>k.id).join()==='wounded'&&!t.Kinds.all('gathering').length,'the game registers one thread kind (its first chain, The Wounded Traveller: story/wounded.js) and no gathering kind');
  ok(!W.story&&!keys.includes('threads')&&!keys.includes('gatherings'),'two days on, no story store is made and a save holds neither key');
  const day=t.Systems.names('day');ok(day[day.length-1]==='gatherings'&&day[day.length-2]==='incidents','the gatherings\' day check comes after every other day system')}
 Kit.storyKinds();
 const ash=t.townBy('Ashford'),ended=[],fn=ev=>ended.push(ev);t.worldOn('thread:ended',fn);
 try{
  // ---- the thread: started by an outcome, its first step a job at the town its memory names
  Kit.clear();Kit.goHome(ash);P.quests=[];P.gold=300;
  const o={start:{thread:'test_thread',memory:{town:'Ashford',x:P.x+60,y:P.y}}};
  ok(t.describeOutcome(o)==='then: a test thread','an outcome starts a thread (start: {thread, memory}), and says so');
  let th=Kit.seeded(21,()=>t.Outcome.apply(o,{}).started);
  ok(th instanceof Th&&th.at==='job'&&th.memory.town==='Ashford'&&W.story.threads.on.includes(th)&&th.past.length===0,'begun: its first step under way, its memory as given');
  let q=P.quests[0];
  ok(q&&q.type==='supply'&&q.home==='Ashford'&&th.wait.shape==='quest'&&th.wait.id===q.id,'its first step took a job at Ashford (a supply run), waited for by its number');
  t.worldEmit('quest:ended',{e:{shape:'quest',id:q.id+99},how:'paid'});t.worldEmit('encounter:ended',{e:{shape:'encounter',id:q.id},how:'done'});
  ok(th.at==='job'&&!ended.length,'another job\'s end, or an encounter\'s of the same number, is not its own');
  // ---- saved and loaded while the job is under way
  {const snap=JSON.stringify(th),qs=JSON.stringify(P.quests);t.saveGame(true);t.loadGame();const z=W.story.threads.on[0];
   ok(z&&z!==th&&z instanceof Th&&JSON.stringify(z)===snap&&JSON.stringify(P.quests)===qs,'saved and loaded at its first step: the same record, a Thread again, its job with it');th=z;q=t.Quest.as(P.quests[0])}
  // ---- paid: it remembers who gave it, and meets an encounter where its memory says
  t.invAdd('good',q.good,q.n);Kit.seeded(23,()=>q.turnIn(ash));
  const e=t.roadList().find(x=>x.i===(th.wait&&th.wait.id));
  ok(th.at==='meet'&&th.memory.giver==='Ashford'&&th.past.map(p=>p.join(':')).join()==='job:paid'&&e&&e.k==='merchant'&&th.wait.shape==='encounter'&&Math.round(e.x)===Math.round(th.memory.x),'the job paid: it remembers who gave it, and its next step meets a wandering merchant where its memory says');
  {const snap=JSON.stringify(th);Kit.world();t.saveGame(true);t.loadGame();const z=W.story.threads.on[0],e2=t.roadList().find(x=>x.i===e.i);
   ok(z instanceof Th&&JSON.stringify(z)===snap&&e2&&e2!==e,'saved and loaded midway (its encounter on the road): the same record');th=z;
   e2.done=1;e2.over()}
  ok(ended.length===1&&ended[0].e===th&&ended[0].how==='done'&&!th.at&&!W.story.threads.on.length&&th.past.map(p=>p.join(':')).join()==='job:paid,meet:done','the encounter dealt with and gone: the thread ends, once (thread:ended, its last key)');
  // ---- the other branch: the job failed, its page
  Kit.world();P.quests=[];W.road=null;
  const th2=Kit.seeded(24,()=>Th.start('test_thread',{town:'Ashford'})),q2=t.Quest.as(P.quests.find(x=>x.id===th2.wait.id));
  ok(th2.i===th.i+1,'each thread its own number ('+th.i+', '+th2.i+')');
  q2.fail('Given up.');
  ok(th2.at==='regret'&&th2.past.map(p=>p.join(':')).join()==='job:failed'&&G.mode==='story'&&G.thread===th2&&/Word from the giver/.test(Kit.panel())&&/Ashford is disappointed in you/.test(Kit.panel()),'the job failed: the branch to its page, shown at once (its text from the memory)');
  ok(t.Thread.paged().includes(th2)&&!Kit.q('[data-nav="close"]'),'a page waiting is listed (Thread.paged), with no way out till chosen');
  const g0=P.gold;t.act('thr-do','0');
  ok(P.gold===g0-5&&G.mode==='world'&&!G.thread&&ended.length===2&&ended[1].e===th2&&ended[1].how==='amends','its choice done (−5 gold), the page closed, and the thread ended by that choice (amends)');
  ok(!t.worldSave().threads.on.length&&t.worldSave().threads.n===2,'once begun, the save keeps the threads\' count, none live')}
 finally{t.worldOff('thread:ended',fn)}
 // ---- the gathering: three holdings, every 12 days, told of 3 days ahead, open for 2
 {Kit.world();delete t.storyW().gatherings;const K=t.kindOf('gathering','test_fair'),places=K.places(),d0=G.day,log=[];
  const ears=['announced','opened','closed'].map(w=>[w,t.worldOn('gathering:'+w,d=>log.push([G.day,w,d.at,d.day].join(' ')))]);
  try{t.Gathering.day();const C=W.story.gatherings;
   ok(C.on.length===3&&places.every(at=>C.on.some(g=>g.at===at&&g.st==='planned'))&&C.on.every(g=>g instanceof Ga&&g.close===g.open+2&&g.due===g.open-3&&g.open>=d0+4),'planned at each of its three places, opening from '+(d0+4)+' on: '+C.on.map(g=>g.at+' day '+g.open).join(', '));
   const offs=places.map(at=>t.Rng.seedOf('gathering:test_fair:'+at)%12);
   ok(C.on.every(g=>g.open%12===offs[places.indexOf(g.at)])&&Kit.seeded(5,()=>Ga.opens(K,places[0],d0))===Ga.opens(K,places[0],d0),'each place on its own day of the cadence, offset by the world\'s seed (no draw): '+offs.join(', '));
   ok(Ga.opens({id:'y',schedule:{day:90}},'Anywhere',1)===90&&Ga.opens({id:'y',schedule:{day:90}},'Anywhere',91)===210&&Ga.opens({id:'y',schedule:{day:90}},'Anywhere',210)===210&&t.Clock.dayOfYear(210)===90,'a yearly one opens on its day of the year ('+t.CLOCK.year+' days)');
   // (the expected changes, from the schedule alone)
   const want=[];for(const g of C.on)for(let o=g.open;o-3<=d0+40;o+=12){if(o-3>d0)want.push([o-3,'announced',g.at,o].join(' '));if(o<=d0+40)want.push([o,'opened',g.at,o].join(' '));if(o+2<=d0+40)want.push([o+2,'closed',g.at,o+2].join(' '))}
   let order=true,snap='',same=true;
   for(let d=1;d<=40;d++){G.day++;t.Gathering.day();const L=W.story.gatherings;if(!L.on.every((g,i)=>!i||L.on[i-1].due<g.due||L.on[i-1].due===g.due&&L.on[i-1].i<g.i))order=false;
    if(d===20){snap=JSON.stringify(L);Kit.world();t.saveGame(true);t.loadGame();same=JSON.stringify(W.story.gatherings)===snap&&W.story.gatherings!==L&&W.story.gatherings.on.every(g=>g instanceof Ga)}}
   const byDay=a=>a.slice().sort((x,y)=>parseInt(x)-parseInt(y)||(x<y?-1:x>y?1:0));
   ok(log.length===want.length&&byDay(log).join()===byDay(want).join(),'40 days: every one told of 3 days ahead, opened on its day, closed 2 days on, and the next planned 12 later ('+log.length+' changes: gathering:announced, opened, closed, with the place and day)'+(byDay(log).join()===byDay(want).join()?'':': got '+byDay(log).slice(0,6).join('; ')+' wanted '+byDay(want).slice(0,6).join('; ')));
   ok(log.every((x,i)=>!i||parseInt(log[i-1])<=parseInt(x)),'the changes come in the order of their days');
   ok(order,'the calendar kept sorted by the day each is next due, every day');
   ok(same,'saved and loaded midway: the same calendar, each one a Gathering again');
   // (its page: entering, once, the fee paid; not before it is told of)
   const L=W.story.gatherings,told=()=>L.on.find(g=>g.st==='announced'||g.st==='open');for(let k=0;k<12&&!told();k++){G.day++;Ga.day()}const pl=Ga.as({k:'test_fair',i:0,at:places[0],st:'planned',entrants:[]}),g=told();P.gold=100;
   ok(!!pl&&pl.enter('Sir Test')===false&&!pl.entrants.length,'nobody enters one not yet told of');
   ok(!!g,'one is told of or open now ('+(g&&g.at+', '+g.st)+')');
   if(g){Kit.world();g.show();const p0=Kit.panel();t.act('gth-do','0');
    ok(/Test fair/.test(p0)&&/0 entered/.test(p0)&&/−10 gold/.test(p0)&&G.mode==='story','its page: its name, who entered, Enter and its fee');
    ok(P.gold===90&&g.entrants.join()==='you'&&/1 entered/.test(Kit.panel())&&/you among them/.test(Kit.panel())&&/You enter the test fair/.test(Kit.panel()),'entered: the fee paid, you on its list');
    t.act('gth-do','0');ok(P.gold===90&&g.entrants.length===1,'and only once');
    ok(g.enter('Sir Test')&&g.entrants.join()==='you,Sir Test','others enter by name');
    t.act('gth-close');ok(G.mode==='world'&&!G.gather,'Leave: back where you were')}
   // (its own day check: only the head of the calendar is read while nothing is due)
   {const n=20000,C2=W.story.gatherings,h0=JSON.stringify(C2),t0=performance.now();for(let i=0;i<n;i++)Ga.day();
    ok(C2.on[0].due>G.day&&JSON.stringify(W.story.gatherings)===h0,'checked again with nothing due today: nothing changes');
    info('  the day check with nothing due: '+((performance.now()-t0)/n*1000).toFixed(2)+' µs ('+n+' checks)')}}
  finally{for(const [w,f] of ears)t.worldOff('gathering:'+w,f)}}
 ok(Th.load({k:'nope',i:1})===null&&Ga.load({k:'nope',i:1})===null,'a record whose kind is gone loads as nothing (dropped quietly)');
 delete t.storyW().gatherings;delete t.storyW().threads;Kit.world();
});
