'use strict';
// Escorts (world/escort.js; doc/IMPLEMENTATION_PLAN.md §10.7): a passenger rides inside your band, begun by an outcome
// ({passenger}), a thread's step or a job offered at a holding. It is on the party card and in the Party window, eats with you,
// takes no troop slot and is no target of its own; it ends on arrival (paid, its page), on its due day (late), with a battle
// lost (captured) or given up (left: never by your Abandon, a side quest is not abandonable), each its line, quest:ended once;
// saved and loaded at every stage. Its place is marked on
// the map. The developer commands for the story (ui/developer.js). Written on the test kit (tests/kit.js).
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,E=t.Escort;Kit.begin('soldier',52);Kit.clear();Kit.world();
 const ash=t.townBy('Ashford'),U='hum_levy',ended=[],ear=t.worldOn('quest:ended',ev=>ended.push(ev));
 const fresh=()=>{Kit.world();Kit.clear();G.road=null;G.enc=null;G.encAgain=null;G.town=null;W.road=null;P.quests=[];P.gold=300;P.renown=5;P.morale=50;P.troops={[U]:6};P.wounded={};Kit.goHome(ash);t.invAdd('good','grain',30)};
 const far=t.TOWNS.filter(z=>z!==ash&&!t.hostileTo(z.owner)).sort((a,b)=>Math.hypot(a.x-ash.x,a.y-ash.y)-Math.hypot(b.x-ash.x,b.y-ash.y)).find(z=>Math.hypot(z.x-ash.x,z.y-ash.y)>10*TILE);
 const spec=o=>({who:'refugees',to:{town:far.name},prize:{gold:30,renown:1},...o});
 const save=()=>{const snap=JSON.stringify(P.quests);t.saveGame(true);P.quests=[];t.loadGame();return JSON.stringify(P.quests)===snap&&P.quests.every(q=>t.Quest.as(q) instanceof t.EscortQuest)};
 const ends=q=>ended.filter(x=>x.e===q||x.e.id===q.id).map(x=>x.how);
 try{
  // ---- begun by an outcome: the passenger in your band
  fresh();const size=t.partySize(),room=P.room(),list=t.playerList().length,objs=t.worldObjects().length,eat0=P.foodHour(true);
  let r=t.Outcome.apply({passenger:spec()},{}),q=r.escort;
  ok(q instanceof t.EscortQuest&&P.quests[0]===q&&q.to.town===far.name&&q.to.k==='holding'&&q.due===G.day+q.days&&q.days===Math.ceil(Math.hypot(far.x-P.x,far.y-P.y)/TILE/t.ESCORT.pace)+t.ESCORT.slack,'an outcome\'s passenger: an escort quest to '+far.name+', '+q.days+' days by the way\'s length');
  t.updateHUD(true);const card=document.getElementById('stats').innerHTML;
  ok(/>Escort</.test(card)&&/The refugee family rides with you to /.test(card),'on the party card: its tag, who rides with you and where');
  t.openChar();t.act('char-tab','passengers');ok(/Escorted \(1 \/ 3\)/.test(Kit.panel())&&/The refugee family/.test(Kit.panel())&&/does not fight/.test(Kit.panel()),'in the Army window’s Passengers: who, where, the days, what they eat');Kit.world();
  ok(t.partySize()===size&&P.room()===room&&t.playerList().length===list&&t.worldObjects().length===objs,'no troop slot, no headcount, no fighter in battle, no figure on the map of its own');
  ok(Math.abs(t.bandFoodHour(true)-eat0-q.eat/24*t.SUPPLY.eat.march)<1e-9&&Math.abs(t.bandFoodHour(false)-P.foodHour(false)-q.eat/24*t.SUPPLY.eat.rest)<1e-9,'it eats: '+q.eat+' food a day with your band, on the march and at rest');
  {const eatFor=h=>{t.BAND.eat=0;t.BAND.dry=0;t.invAdd('good','water',20);const f0=t.foodN();for(let i=0;i<h;i++)t.supplyHour();return f0-t.foodN()},keep=P.quests;t.CHEAT.noNeeds=false;const a=eatFor(96);P.quests=[];const b=eatFor(96);P.quests=keep;
   ok(a-b>=Math.floor(4*q.eat*t.SUPPLY.eat.rest)-1&&a-b<=Math.ceil(4*q.eat*t.SUPPLY.eat.march)+1,'four days of the band\'s hours: '+a+' food eaten with them, '+b+' without')}
  ok(t.questGoal(q).x===q.to.x&&t.questGoal(q).y===q.to.y,'its goal (the minimap\'s dot) is its place');
  {let err='';try{t.wuiEscorts({x:q.to.x-200,y:q.to.y-100},performance.now(),false);t.drawQuestMarks({x:0,y:0})}catch(x){err=x.message}ok(!err,'its place marked on the map (a house, gfx/worldui.js), the quests\' marks pass it by'+(err?' EXC '+err:''))}
  ok(save()&&P.quests.length===1,'saved and loaded aboard: the same record, an EscortQuest again');q=t.Quest.as(P.quests[0]);
  G.day++;t.questDay();ok(P.quests.length===1&&save(),'a day on: still aboard, saved and loaded again');q=t.Quest.as(P.quests[0]);
  // ---- arrival: within reach of its place
  {const g0=P.gold,n0=P.renown;P.x=q.to.x+t.ESCORT.reach.holding+8;P.y=q.to.y;t.updateRoad(.05);ok(P.quests.length===1,'not yet within reach of '+q.to.name+': still aboard');
   P.x=q.to.x+t.ESCORT.reach.holding-4;t.updateRoad(.05);
   ok(!P.quests.length&&q.fate==='arrived'&&P.gold===g0+30&&P.renown===n0+1&&ends(q).join()==='paid'&&G.mode==='story'&&/Escort: The refugee family/.test(Kit.panel())&&/safe in /.test(Kit.panel()),'there: its prize (+30 gold, renown +1), its page, paid once (quest:ended)');
   ok(G.msgs.some(m=>/refugee family is safe in/.test(m.m)),'and its line in the log');t.act('pas-close');ok(G.mode==='world'&&t.ov.hidden,'Ride on: back on the map');
   ok(save()&&!P.quests.length,'saved and loaded after: none aboard')}
  // ---- entering its holding counts too; a house's door
  {fresh();const q2=E.start(spec());t.enterTown(far);ok(!P.quests.length&&q2.fate==='arrived'&&G.mode==='town','entering '+far.name+': arrived (no page inside the holding)');G.town=null;
   fresh();const q3=E.start({who:'child',to:{town:'Ashford',lot:'house',i:3},prize:{morale:5}});ok(q3.to.k==='house'&&/a house in Ashford/.test(q3.to.name)&&Math.hypot(q3.to.x-ash.x,q3.to.y-ash.y)<20*TILE,'to a house: its door in Ashford ('+q3.to.x+', '+q3.to.y+')');
   P.x=q3.to.x;P.y=q3.to.y+10;t.updateRoad(.05);ok(q3.fate==='arrived'&&P.morale===55,'at its door: arrived');Kit.world()}
  // ---- the deadline: late, its forfeit, its line
  {fresh();const r0=t.repAt('Ashford'),q4=E.start({who:'child',to:{town:'Ashford',lot:'house',i:0},prize:{morale:5},forfeit:{rep:['Ashford',-3]}});
   G.day=q4.due;t.questDay();ok(P.quests.length===1,'on its due day: still aboard');ok(save(),'saved and loaded on its last day');
   G.day=q4.due+1;t.questDay();ok(!P.quests.length&&ends(q4).join()==='failed'&&t.repAt('Ashford')===r0-3&&G.msgs.some(m=>/^Quest failed: Escort the lost child.*slips away/.test(m.m)),'a day past it: failed (late), reputation −3 at Ashford, her line');
   const z=ended.find(x=>x.e.id===q4.id);ok(z&&z.e.fate==='late','quest:ended says how: fate late (a thread\'s step branches by it)')}
  // ---- a battle lost with them aboard: carried off; withdrawn or won: still aboard
  {fresh();const band=()=>{const b=t.asParty({x:P.x+10,y:P.y,n:4,kind:'bandits',cool:0,t:0,a:0});t.bandits.push(b);return Kit.meet({kind:'party',ref:b,n:4,list:b.troops.slice(),band:'bandits'})};
   const q5=E.start(spec());band();Kit.seeded(4,()=>t.concludeEncounter(true,{},0,true,[]));Kit.done({cont:true,world:true});ok(P.quests.includes(q5),'a battle won: still aboard');
   band();Kit.seeded(4,()=>t.concludeEncounter(false,{},0,true,[],{caught:0,got:3,standing:4,fallen:0}));G.encAgain=null;Kit.done({cont:true,world:true});ok(P.quests.includes(q5),'withdrawn: still aboard');
   band();Kit.seeded(4,()=>t.concludeEncounter(false,{},0,true,[]));Kit.done({cont:true,world:true});
   ok(!P.quests.length&&q5.fate==='captured'&&ends(q5).join()==='failed'&&G.msgs.some(m=>/your foes carry off the refugee family/.test(m.m)),'a battle lost: failed, carried off by the victors (fate captured), its line');Kit.clear()}
  // ---- abandoned: set down
  {fresh();const q6=E.start(spec());t.Quest.as(q6).abandon();ok(!P.quests.length&&q6.fate==='left'&&G.msgs.some(m=>/You set the refugee family down/.test(m.m)),'abandoned: set down by the road (fate left)')}
  // ---- the limits: three at once, beside four jobs
  {fresh();const qs=[0,1,2].map(()=>E.start(spec()));ok(qs.every(Boolean)&&!!E.why()&&!E.start(spec())&&E.list().length===3,'three passengers at once; a fourth refused ('+E.why()+')');
   P.quests=[];for(const k of ['supply','hunt','troops','courier'])Kit.seeded(9,()=>t.acceptQuest(t.makeQuest(k,ash)));const jobs=P.quests.length;
   ok(jobs===4&&!!E.start(spec())&&t.Quest.jobs()===4,'with four jobs taken (the limit), an escort is taken all the same: it is no job')}
  // ---- a job offered at a holding (no spec): a traveller to another holding
  {fresh();const o=Kit.seeded(3,()=>t.makeQuest('escort',ash));ok(o&&o.who==='traveller'&&o.to.k==='holding'&&o.to.town!=='Ashford'&&o.reward.gold>0&&o.prize.rep[0]==='Ashford'&&Object.keys(o.reward).join()==='gold,rep,honor,xp','offered at Ashford: a traveller to '+(o&&o.to.name)+', '+(o&&o.reward.gold)+' gold there')}
  // ---- a thread's step: escort to X, branching by how it ended
  {fresh();if(!t.kindOf('thread','test_escort'))t.defineKind('thread','test_escort',{n:'An escort test',steps:[{id:'ride',start:{quest:'escort',town:'Ashford',spec:th=>({who:'traveller',to:{town:th.memory.to},prize:{gold:5}})},how:d=>d.e.fate,then:{arrived:null,late:null}}]});
   const th=t.Thread.start('test_escort',{to:far.name}),qq=P.quests[0],te=[],fn=t.worldOn('thread:ended',ev=>te.push(ev));
   try{ok(th.wait&&th.wait.shape==='quest'&&qq&&qq.type==='escort'&&th.wait.id===qq.id&&qq.to.town===far.name,'a thread\'s step: {quest: \'escort\', spec}, the traveller aboard, waited for');
    const snap=JSON.stringify(W.story.threads);ok(save()&&JSON.stringify(W.story.threads)===snap,'saved and loaded midway: the thread and its passenger');
    P.x=far.x;P.y=far.y;t.updateRoad(.05);ok(te.length===1&&te[0].how==='arrived','arrived: the thread ends by its fate (arrived)');t.act('pas-close')}finally{t.worldOff('thread:ended',fn)}}
  // ---- the developer commands (ui/developer.js), story's
  {fresh();const D=t.DevConsole,x=c=>{try{return D.execute(c)}catch(e){return 'ERR '+e.message}};
   ok(/child \(Lost child\)/.test(x('enc'))&&/escort/.test(x('quest')),'enc and quest list the kinds');
   const n0=t.roadList().length,s=x("enc('lostChild')");ok(/Lost child \(child\) spawned/.test(s)&&t.roadList().length===n0+1&&t.roadList().some(e=>e.k==='child'),'enc(\'lostChild\'): one spawned near you ('+s+')');
   ok(/^ERR No encounter kind/.test(x('enc dragon')),'an unknown kind: why');
   const s2=x('quest bounty');ok(/taken: Bounty/.test(s2)&&P.quests.some(q=>q.type==='bounty'),'quest bounty: offered at the nearest holding and taken ('+s2+')');
   ok(/No thread under way/.test(x('chains')),'chains: none under way, and the kinds');
   Kit.storyKinds();const th=Kit.seeded(21,()=>t.Thread.start('test_thread',{town:'Ashford'})),c=x('chains'),one=x('chain '+th.i);
   ok(new RegExp(th.i+' · A test thread \\(test_thread\\) · step job · waits for quest').test(c)&&one.step==='job'&&one.starts==='quest'&&one.until==='quest:ended'&&one.memory.town==='Ashford','chains lists it; chain '+th.i+': its step, what it began, what it waits for, its memory');
   P.quests=P.quests.filter(q=>q.type!=='supply');W.story.threads.on=[];
   const q7=E.start(spec()),p=x('passengers');ok(new RegExp(q7.id+' · the refugee family \\(refugees\\) to '+far.name).test(p),'passengers: who, where, when due');
   const j=x('escort');ok(/Teleported/.test(j)&&Math.hypot(P.x-q7.to.x,P.y-q7.to.y)<=t.ESCORT.reach.holding,'escort: to its place ('+j+')');t.updateRoad(.05);ok(q7.fate==='arrived','and there once the world runs');t.act('pas-close')}
 }finally{t.worldOff('quest:ended',ear);P.quests=[];Kit.world()}
});
