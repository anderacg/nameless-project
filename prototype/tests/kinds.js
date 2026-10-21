'use strict';
// The kinds, walked generically (doc/STORY_DESIGN.md §5; the story wave, S1): the registry (story/kinds.js: each kind once, its
// trigger's bucket in its order, ROAD_ENC its view, a subclass only where named) and, for EVERY registered Encounter kind
// (story/happening.js), with nothing written for it here: it spawns in a fitting context (one its conditions allow, found at the
// holdings by day and night; a kind no trigger starts, by the kind that starts it: a trace dropped, a stray scattered); its
// choices are Choices; each choice that declares its outcome shows it with no draw and no change, does with stubbed draws what
// describeOutcome says (the change measured), and has its facts written from it (its own lines after); its live record saves
// and loads as it was (by itself and through the save registry), wrapped by its kind's class; and it ends cleanly: never at
// once in your sight, gone out of it once its time is up (its trace, if it leaves one), announced once on the bus. A new kind is
// covered the day it is registered. The story wave's S2 and S3 kinds too: every Incident kind (the incidents) comes somewhere,
// befalls you as its outcome says (every race, both ways of a roll), its line logged, over at once; every Quest kind (the jobs)
// is offered somewhere, taken, saved and loaded as it was, done by its own deed heard on the bus (no other's), reported and
// paid, or failed on its due day. S5: every Thread kind (its steps hold together; every way through it, answered on the bus, saved
// and loaded at each step, ended once) and every Gathering kind (a year of its calendar, on schedule and in order; its page): the
// game registers none yet, so the test kinds (Kit.storyKinds). Written on the test kit (tests/kit.js).
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,DAY=t.DAY,K=t.Kinds,O=t.Outcome,E=t.Encounter;Kit.begin('soldier',73);Kit.clear();Kit.world();
 const U='hum_levy',fac=Object.keys(t.FACS).find(f=>f!=='player'),SHAPE='encounter';
 // ---- the registry
 {const all=K.all(SHAPE),ids=all.map(k=>k.id),road=K.on(SHAPE,'travelHour');
  ok(all.length>=28&&new Set(ids).size===ids.length&&all.every(k=>t.kindOf(SHAPE,k.id)===k&&k.shape===SHAPE),'every kind registered once, found by its id ('+all.length+' encounter kinds)');
  ok(road.length===24&&road.every(k=>k.trigger==='travelHour')&&Object.keys(t.ROAD_ENC).join()===road.map(k=>k.id).join()&&road.every(k=>t.ROAD_ENC[k.id]===k),'the pity timer\'s bucket: the road\'s 24, in their order; ROAD_ENC is its view');
  ok(all.filter(k=>!k.trigger).map(k=>k.id).sort().join()==='body,cart,stray,wreck','the traces and the stray come from no trigger (only started by another)');
  const cls=all.filter(k=>k.cls).map(k=>k.id+':'+k.cls.name);ok(cls.join()==='sheep:Shepherd,stray:Stray'&&all.filter(k=>k.cls).every(k=>k.cls.prototype instanceof E),'a subclass only where a kind has behaviour of its own: '+cls.join(', '));
  let thr='';try{t.defineKind(SHAPE,'traveller',{})}catch(x){thr=x.message}ok(/twice/.test(thr),'a kind defined twice is refused');
  ok(t.kindOf(SHAPE,'nope')===null&&t.kindOf('nope','traveller')===null&&t.kindOf(SHAPE,'constructor')===null,'an unknown kind, or shape: none');
  ok(E.load({rd:1,i:999,k:'nope',x:0,y:0})===null,'a record whose kind is gone loads as nothing (dropped quietly)');
  ok(Object.keys(t.Behaviours).sort().join()==='approach,bolt,chase,flee,graze,leave,scene,stay,walk'&&all.every(k=>!k.beh||t.Behaviours[k.beh]),'the behaviours, small strategies chosen by data: '+Object.keys(t.Behaviours).join(', ')+'; every kind\'s is one')}
 // ---- a fitting context for each kind: at the holdings, by day then by night, its conditions first, then any spot it will take
 const fresh=()=>{Kit.world();Kit.clear();G.road=null;G.chase=null;G.enc=null;G.encCool=0;W.road=null;P.gold=600;P.morale=50;P.renown=5;P.troops={[U]:6};P.wounded={};P.sp=t.vitals()[1];P.inv=Array(t.INV_SIZE).fill(null);t.invAdd('good','grain',20);t.invAdd('good','meat',10)};
 const tryAt=(z,k,need)=>{fresh();Kit.goHome(z);const D=t.kindOf(SHAPE,k);if(need&&!D.ok(t.storyCtx()))return null;
  const p=t.roadSpot(D.on,0,D.near);if(p){const e=t.roadSpawn(k,p[0],p[1]);if(e)return e}
  if(need)return null;for(let i=0;i<12;i++){fresh();Kit.goHome(z);const e=t.roadSpawn(k,P.x+10+i*24,P.y+(i%3)*20);if(e)return e}return null};
 const spots={};
 const findCtx=k=>{for(const need of [true,false])for(const hour of [.3,.9])for(const z of t.TOWNS){G.clock=DAY*hour;const e=tryAt(z,k,need);if(e){spots[k]={z,hour,need};return e}}return null};
 // (where it came first; else wherever it will come now: on a generated world a procession's walk may find its way only at some spots)
 const again=k=>{const s=spots[k];G.clock=DAY*s.hour;return tryAt(s.z,k,s.need)||tryAt(s.z,k,false)||findCtx(k)};
 // (a kind no trigger starts: made by the one that starts it, found the first time by trying the road's kinds, those whose trace
 // it is first: one that leaves a record of it on the road as it comes (a stray scattered), or drops it as its trace)
 const parents={};
 const made=(k,h)=>{if(!h)return null;const own=t.roadList().find(o=>o.k===k);if(own)return own;if(h.D.trace!==k)return null;h.drop(t.roadNow());return t.roadList().find(o=>o.k===k)||null};
 const child=(k,first)=>{if(!first)return parents[k]?made(k,again(parents[k])):null;
  const ps=K.on(SHAPE,'travelHour').slice().sort((a,b)=>(b.trace===k)-(a.trace===k));
  for(const D of ps){const x=made(k,findCtx(D.id));if(x){parents[k]=D.id;return x}}return null};
 const spawnOf=(k,first)=>{const D=t.kindOf(SHAPE,k);if(!D.trigger)return child(k,first);return first?findCtx(k):again(k)};
 (0,eval)('TERRAIN.on=true');
 const kinds=K.all(SHAPE),bad={spawn:[],acts:[],pure:[],did:[],facts:[],save:[],end:[]};let nDid=0,nOut=0,skipped=[];
 for(const D of kinds){const k=D.id,e=spawnOf(k,true);
  if(!e){bad.spawn.push(k);continue}
  if(!(e instanceof (D.cls||E))||e.D!==D||e.k!==k||e.id!==e.i)bad.spawn.push(k+' (its class)');
  if(spots[k]&&!spots[k].need)info('  ('+k+': no spot its conditions allow at the holdings; spawned where it will go)');
  // ---- its choices
  const acts=D.acts||[];if(!acts.every(c=>c instanceof t.Choice))bad.acts.push(k);
  acts.forEach((c,i)=>{if(!c.out)return;nOut++;
   let x=spawnOf(k,false);if(!x)return;if(k==='thief')x.nab=1;
   // (shown with no draw and no change)
   const look=()=>JSON.stringify([P.gold,P.morale,P.rep,P.honor,P.inv,P.troops,G.clock,G.msgs.length,W.road&&W.road.on.length]);
   const b0=look(),s0=JSON.stringify(t.Rng.states());let d=0;const r0=Math.random;Math.random=()=>{d++;return r0()};let o=null;try{o=c.preview(x)}finally{Math.random=r0}if(JSON.stringify(t.Rng.states())!==s0)d++;
   if(d||look()!==b0||!O.is(o)){bad.pure.push(k+'#'+i);return}
   // (its facts: written from it, its own lines after)
   const fs=(c.factsFor(x)||[]).filter(Boolean),said=O.facts(o),own=c.also?(c.also(x)||[]).filter(Boolean):[];
   if(c.facts||fs.join(' · ')!==said.concat(own).join(' · ')||fs.some(f=>/\bhonor\b/.test(f)))bad.facts.push(k+' “'+c.label+'” ['+fs.join(' · ')+']');
   // (done, the dice stubbed: what changed is what it says)
   if(c.why(x)){skipped.push(k+' “'+c.label+'” ('+c.why(x)+')');return}
   const fx=Object.entries(o).filter(([key])=>key!=='say'),rep=n=>n?t.repAt(n):0,hon=f=>f?t.honorWith(f):0,gd=g=>t.goodN(g);
   const a={g:P.gold,f:t.foodN(),m:P.morale,r:P.renown,sp:P.sp,h:t.roadNow(),tr:{...P.troops},rep:{},hon:{},goods:{}};
   for(const [key,v] of fx){if(key==='rep'&&v[0])a.rep[v[0]]=rep(v[0]);if(key==='honor'&&v[0])a.hon[v[0]]=hon(v[0]);if(key==='goods')for(const g of Object.keys(v))a.goods[g]=gd(g);
    if(key==='wrong'&&v[0]){a.rep[v[0].name]=rep(v[0].name);if(v[0].owner&&v[0].owner!=='player')a.hon[v[0].owner]=hon(v[0].owner)}}
   let err='';try{Kit.seeded(5+i,()=>c.perform(x))}catch(z){err=z.message}
   const sg=O.signed,got=[];
   for(const [key,v] of fx){
    if(key==='gold')got.push(sg(P.gold-a.g)+' gold');else if(key==='food')got.push(sg(t.foodN()-a.f)+' food');else if(key==='morale')got.push('morale '+sg(P.morale-a.m));else if(key==='renown')got.push('renown '+sg(P.renown-a.r));
    else if(key==='sp')got.push(sg(P.sp-a.sp)+' stamina');else if(key==='rep'){if(v[0])got.push('reputation in '+v[0]+' '+sg(rep(v[0])-a.rep[v[0]]))}else if(key==='honor'){if(v[0]&&t.FACS[v[0]])got.push('honour with the '+t.FACS[v[0]].n+' '+sg(hon(v[0])-a.hon[v[0]]))}
    else if(key==='goods')for(const g of Object.keys(v))got.push(sg(gd(g)-a.goods[g])+' '+t.GOODS[g].n.toLowerCase());
    else if(key==='troops')for(const u of Object.keys(v))got.push(sg((P.troops[u]||0)-(a.tr[u]||0))+' '+t.ST[u].n);
    else if(key==='hours'){const hh=Math.round((t.roadNow()-a.h)*1e6)/1e6;got.push(...[].concat(O.handlers.hours.text(hh)))}
    else if(key==='wrong'){const [z,cc]=v;if(z){if(cc.rep)got.push('reputation in '+z.name+' '+sg(rep(z.name)-a.rep[z.name]));if(cc.morale)got.push('morale '+sg(P.morale-a.m));if(cc.honor&&z.owner&&z.owner!=='player')got.push('honour with the '+t.FACS[z.owner].n+' '+sg(hon(z.owner)-a.hon[z.owner]))}}
    else got.push(...[].concat(O.handlers[key].text(v)).filter(Boolean))}
   nDid++;if(err||got.join(' · ')!==t.describeOutcome(o))bad.did.push(k+' “'+c.label+'”: did ['+got.join(' · ')+'], says ['+t.describeOutcome(o)+']'+(err?' EXC '+err:''));
   if(G.enc)t.act('flee');Kit.world();G.road=null;G.chase=null;G.enc=null});
  // ---- its live record: saved and loaded as it was
  {const x=spawnOf(k,false);if(x){x.seen=1;const snap=JSON.stringify(x),rec=JSON.parse(JSON.stringify(x.save())),y=E.load(rec);
    if(!y||JSON.stringify(y)!==snap||!(y instanceof (D.cls||E))||y.D!==D)bad.save.push(k+' (its record)');
    else{t.saveGame(true);W.road=null;t.loadGame();const z=t.roadList().find(o=>o.i===x.i);if(!z||JSON.stringify(z)!==snap||!(z instanceof (D.cls||E)))bad.save.push(k+' (the save)')}}}
  // ---- it ends cleanly: not at once in your sight (a trace only fades); out of it, its time up, gone (its trace left), announced once
  {const x=spawnOf(k,false);if(!x){bad.end.push(k+' (none)');continue}
   const said=[],fn=ev=>said.push(ev.e);t.worldOn('encounter:ended',fn);
   try{const V=t.vis(),now=t.roadNow();
    if(!x.trace){const ang=Math.atan2(x.y-P.y,x.x-P.x);P.x=x.x-Math.cos(ang)*V*.6;P.y=x.y-Math.sin(ang)*V*.6;G.clock+=(x.end-now+.01)*DAY/24;while(G.clock>=DAY){G.clock-=DAY;G.day++}
     Kit.frames(1,.05,d=>t.updateRoad(d));const seen=x.inView(V);if(seen&&x.gone)bad.end.push(k+' (gone at once, in your sight)');Kit.world();G.road=null;G.chase=null}
    const later=Math.max(x.end,t.roadNow())+t.ENC_LIFE.dying+t.ENC_LIFE.linger+1;G.clock+=(later-t.roadNow())*DAY/24;while(G.clock>=DAY){G.clock-=DAY;G.day++}
    // (out of your sight as it is then: by day, or on open ground, you see farther than you did when its time came up)
    // (the farthest sight met on the way kept: from swamp or woods to open ground, sight lengthens)
    {let r=V;for(let i=0;i<3;i++){r=Math.max(r,t.vis());P.x=x.x-r*1.4;P.y=x.y}}
    Kit.frames(5,.05,d=>t.updateRoad(d));Kit.world();
    const tr=D.trace&&!x.done?t.roadList().find(o=>o.trace&&o.k===D.trace&&o.x===x.x&&o.y===x.y):null;
    if(!x.gone)bad.end.push(k+' (still there: '+x.beh+')');else if(D.trace&&!x.done&&!tr)bad.end.push(k+' (no '+D.trace+')');
    if(said.filter(z=>z===x).length!==(x.trace?0:1))bad.end.push(k+' (announced '+said.filter(z=>z===x).length+'×)')}
   finally{t.worldOff('encounter:ended',fn)}}}
 (0,eval)('TERRAIN.on=false');G.clock=DAY*.3;
 const L=(a,n)=>a.length?': '+a.slice(0,n||8).join('; '):'';
 ok(!bad.spawn.length,'every kind spawns in a fitting context, of its kind\'s class ('+kinds.length+' kinds)'+L(bad.spawn));
 ok(!bad.acts.length,'every kind\'s choices are Choices'+L(bad.acts));
 ok(nOut>=33&&!bad.pure.length,'every declared outcome shows with no draw and no change ('+nOut+' choices)'+L(bad.pure));
 ok(!bad.facts.length,'and its facts are written from it, its own lines after, one spelling (honour)'+L(bad.facts));
 ok(nDid>=30&&!bad.did.length,'done with the dice stubbed, each did what describeOutcome says ('+nDid+' choices)'+L(bad.did));
 if(skipped.length)info('  not done here (greyed): '+skipped.join('; '));
 ok(!bad.save.length,'every kind\'s live record saves and loads as it was, wrapped by its class (by itself and through the save)'+L(bad.save));
 ok(!bad.end.length,'every kind ends cleanly: not at once in your sight, gone out of it once its time is up (its trace left), announced once'+L(bad.end));
 // ================= the Incident kinds (story/incident.js; the incidents, world/incidents.js), every one
 {const SH='incident',I=t.Incident,all=K.all(SH),ids=all.map(k=>k.id),day=K.on(SH,'day'),bad=[];
  ok(all.length>=6&&day.length===all.length&&all.every(k=>k.trigger==='day'&&t.kindOf(SH,k.id)===k)&&t.INCIDENTS===day,'the incidents: registered once each with the trigger day, the daily roll\'s bucket (INCIDENTS) in their order ('+ids.join(', ')+')');
  // (a fitting context: the first tile of a climate and terrain its conditions allow)
  const spots=[];for(const c of ['grass','frost','desert','swamp'])for(const tr of [t.T_OPEN,t.T_FOREST,t.T_HILL]){let i=-1;for(let j=0;j<t.MW*t.MH;j++)if(t.CLIMS[t.climate[j]]===c&&t.tiles[j]===tr){i=j;break}if(i>=0)spots.push([(i%t.MW+.5)*t.TILE,(Math.floor(i/t.MW)+.5)*t.TILE])}
  let nDid=0;
  for(const D of all){const at=spots.find(([x,y])=>{P.x=x;P.y=y;return D.ok(t.storyCtx())});if(!at){bad.push(D.id+' (no spot)');continue}
   for(const race of Object.keys(t.RACES))for(const v of [.2,.8]){P.x=at[0];P.y=at[1];P.race=race;P.morale=50;P.gold=300;P.inv=P.inv.map(()=>null);t.invAdd('good','grain',10);
    const c=t.storyCtx(),o=Kit.stub(v,()=>Kit.stubStream('incidents',v,()=>D.run(c)));if(!O.is(o)||Array.isArray(o)){bad.push(D.id+' (not an outcome)');continue}
    const a={g:P.gold,f:t.foodN(),m:P.morale},n0=G.msgs.length,said=[],fn=ev=>said.push(ev.e);t.worldOn('incident:ended',fn);let e=null;
    try{e=Kit.stub(v,()=>Kit.stubStream('incidents',v,()=>I.befall(D,c)))}finally{t.worldOff('incident:ended',fn)}
    const got=[];for(const key of Object.keys(o)){if(key==='gold')got.push(O.signed(P.gold-a.g)+' gold');else if(key==='food')got.push(O.signed(t.foodN()-a.f)+' food');else if(key==='morale')got.push('morale '+O.signed(P.morale-a.m));else if(key!=='log')got.push('?'+key)}
    const last=G.msgs[G.msgs.length-1],line=[].concat(o.log);nDid++;
    if(got.join(' · ')!==t.describeOutcome(o))bad.push(D.id+' '+race+': did ['+got.join(' · ')+'], says ['+t.describeOutcome(o)+']');
    if(G.msgs.length!==Math.min(150,n0+1)||last.m!==line[0]||last.cls!==line[1])bad.push(D.id+' (its line)');
    if(!(e instanceof I)||e.kind!==D||said.length!==1||said[0]!==e)bad.push(D.id+' (its record, or its end)')}}
  ok(I.load({k:'nope'})===null&&I.load({k:ids[0]}) instanceof I,'an incident\'s record loads as one of its class; one whose kind is gone, as nothing');
  ok(nDid>=all.length*2&&!bad.length,'every incident comes somewhere, and befalls you as its outcome says, its line and tone logged, over at once ('+nDid+' runs, every race, both ways of a roll)'+(bad.length?': '+bad.slice(0,8).join('; '):''))}
 // ================= the Quest kinds (story/quest.js; the jobs, world/quests.js), every one
 {const SH='quest',Q=t.Quest,all=K.all(SH),ids=all.map(k=>k.id),bad=[];Kit.world();Kit.clear();
  ok(ids.join()==='bounty,beast,clear,supply,hunt,courier,troops,lordkill,raid'&&all.every(k=>k.cls&&k.cls.prototype instanceof Q&&t.kindOf(SH,k.id)===k),'the job kinds: registered once each, each a subclass of Quest ('+all.map(k=>k.cls.name).join(', ')+')');
  // (every realm at war with every other, so a lord has war work; a lord's kinds are made by a lord)
  const facs=Object.keys(t.FACS).filter(f=>f!=='player');for(const a of facs)for(const b of facs)if(a<b)W.rel[t.rk(a,b)]={s:'war',since:G.day};W.lords.forEach(l=>{l.dead=false});
  // (the deed's own event, for one taken: what it waits for, found on the map)
  const own={'band:beaten':q=>({band:t.bandits.find(b=>b.qid===q.id)}),'monster:slain':q=>({monster:W.monsters.find(m=>m.qid===q.id)}),'site:cleared':q=>({site:W.sites[q.site]}),'lord:beaten':q=>({lord:W.lords.find(l=>l.name===q.target)}),'holding:razed':q=>({town:t.townBy(q.village)})};
  const ended=[],fn=ev=>ended.push(ev.e);t.worldOn('quest:ended',fn);
  try{for(const D of all){const k=D.id;let q=null,home=null;
   for(const h of t.TOWNS){for(const l of [null,...W.lords.filter(l=>!l.dead)]){try{q=Kit.seeded(11,()=>t.makeQuest(k,h,l))}catch(x){q=null}if(q){home=h;break}}if(q)break}
   if(!q){bad.push(k+' (no offer anywhere)');continue}
   if(!(q instanceof D.cls)||q.kind!==D||q.type!==k||Object.keys(q.reward).join()!=='gold,rep,honor,xp'||!q.title||!q.text||!(q.days>0))bad.push(k+' (its offer)');
   // (taken: on your list, numbered, its due day, where it points, how far along)
   P.quests=[];const n0=P.qid||0;if(!Kit.seeded(12,()=>q.accept())){bad.push(k+' (not taken)');continue}
   if(P.quests[0]!==q||q.id!==n0+1||q.due!==G.day+q.days||q.done!==false||typeof q.progress()!=='string')bad.push(k+' (taken)');
   if(!q.handsOver&&!q.goal())bad.push(k+' (no goal)');
   // (saved and loaded: the same record, made its class again when used)
   {const snap=JSON.stringify(P.quests);t.saveGame(true);P.quests=[];t.loadGame();const z=P.quests[0];if(JSON.stringify(P.quests)!==snap||!(Q.as(z) instanceof D.cls))bad.push(k+' (the save)');q=z}
   // (its deed: another's does nothing, its own does it, once)
   if(q.deed){const d=own[q.deed]&&own[q.deed](q),m0=G.msgs.length;
    if(!d||!Object.values(d)[0]){bad.push(k+' (its deed: '+q.deed+', nothing of it found)');P.quests=[];continue}
    t.worldEmit(q.deed,{band:{qid:-1},monster:{qid:-1},site:{i:-1},lord:{name:'nobody'},town:{name:'nowhere'}});if(q.done)bad.push(k+' (done by another\'s deed)');
    t.worldEmit(q.deed,d);t.worldEmit(q.deed,d);if(!q.done||!q.ready()||G.msgs.length!==Math.min(150,m0+1)||!/^Quest done/.test(G.msgs[G.msgs.length-1].m))bad.push(k+' (its deed heard: '+q.deed+')');
    // (reported where it may be: paid, off your list, ended once)
    const at=t.TOWNS.find(h=>q.reportableAt(h)),g0=P.gold;if(!at||!q.turnIn(at)||P.quests.length||P.gold<g0+q.reward.gold||ended.filter(z=>z===q).length!==1)bad.push(k+' (reported)')}
   else if(q.handsOver){const at=t.TOWNS.find(h=>q.reportableAt(h));P.inv=P.inv.map(()=>null);P.troops={};if(q.ready()||q.turnIn(at)||!P.quests.includes(q))bad.push(k+' (handed in with nothing)')}
   // (another taken, and failed when its due day passes: off your list, ended once)
   {P.quests=[];const q2=Kit.seeded(13,()=>t.makeQuest(k,home,q.lord?W.lords.find(l=>l.name===q.giver):null));if(q2&&Kit.seeded(14,()=>q2.accept())){const d0=G.day,m0=G.msgs[G.msgs.length-1];G.day=q2.due+1;t.questDay();G.day=d0;if(P.quests.length||ended.filter(z=>z===q2).length!==1||!G.msgs.slice(G.msgs.indexOf(m0)+1).some(m=>/^Quest failed/.test(m.m)))bad.push(k+' (failed)')}else bad.push(k+' (a second not taken)')}
   P.quests=[];Kit.world()}}finally{t.worldOff('quest:ended',fn)}
  ok(!bad.length,'every job kind is offered in a fitting place, taken, saved and loaded as it was, done by its own deed on the bus (and no other), reported and paid, or failed on its due day'+(bad.length?': '+bad.slice(0,8).join('; '):''))}
 // ================= the Thread kinds (story/thread.js), every one (the game registers none yet: the test kind, tests/kit.js
 // Kit.storyKinds): its steps are data that hold together; every way through it (each branch) walked, each step answered by its
 // own event on the bus (another's ignored), its record saved and loaded at each step; it ends once, by its last step's key
 {Kit.storyKinds();const SH='thread',Th=t.Thread,all=K.all(SH),bad=[];let nPaths=0;Kit.world();Kit.clear();Kit.goHome();
  const nexts=s=>s.then==null?[]:typeof s.then==='string'?[s.then]:Object.values(s.then).filter(Boolean);
  const keys=s=>s.then&&typeof s.then==='object'?Object.keys(s.then):['done'];
  const ended=[],fn=ev=>ended.push(ev);t.worldOn('thread:ended',fn);
  try{for(const D of all){const ids=D.steps.map(s=>s.id),first=D.first||ids[0];
   if(!D.n||!ids.length||new Set(ids).size!==ids.length)bad.push(D.id+' (its name, or its steps)');
   for(const s of D.steps){const k=Th.starterOf(s);
    if(s.start&&!k)bad.push(D.id+'.'+s.id+' (a start of no kind)');
    if(k&&k!=='page'&&!t.kindOf(k,s.start[k]))bad.push(D.id+'.'+s.id+' (no '+k+' kind '+s.start[k]+')');
    if(k==='page'&&!(s.start.page.choices||[]).length)bad.push(D.id+'.'+s.id+' (a page with no choices)');
    if(!Th.until(s)&&k!=='incident')bad.push(D.id+'.'+s.id+' (nothing to wait for)');
    for(const n of nexts(s))if(!ids.includes(n))bad.push(D.id+'.'+s.id+' (then '+n+': no such step)')}
   {const seen=new Set([first]),q=[first];while(q.length){const s=D.steps.find(x=>x.id===q.shift());if(s)for(const n of nexts(s))if(!seen.has(n)){seen.add(n);q.push(n)}}
    if(seen.size!==ids.length)bad.push(D.id+' (steps never reached: '+ids.filter(i=>!seen.has(i)).join(', ')+')')}
   // (every way through it: the keys to answer each step by, in turn)
   const paths=[],walk=(id,path)=>{const s=D.steps.find(x=>x.id===id);for(const k of keys(s)){const p=path.concat([[id,k]]),n=Th.next(s,k);if(n&&p.length<12)walk(n,p);else paths.push(p)}};walk(first,[]);
   for(const path of paths){Kit.world();P.quests=[];W.road=null;P.gold=300;const n0=ended.length;
    const th=Kit.seeded(31+nPaths,()=>Th.start(D.id,{town:'Ashford',x:P.x+60,y:P.y}));nPaths++;let z=th;
    for(let i=0;i<path.length&&z.at;i++){const [id,k]=path[i];if(z.at!==id){bad.push(D.id+' '+path.map(p=>p.join(':')).join('>')+' (at '+z.at+', not '+id+')');break}
     if(!z.wait&&z.current.start){bad.push(D.id+'.'+id+' (begun, nothing waited for)');break}
     // (saved and loaded as it was: by itself, and through the save once, on its first step)
     const snap=JSON.stringify(z),y=Th.load(JSON.parse(JSON.stringify(z.save())));if(!y||JSON.stringify(y)!==snap||!(y instanceof (D.cls||Th)))bad.push(D.id+'.'+id+' (its record)');
     if(!i&&nPaths===1){Kit.world();t.saveGame(true);t.loadGame();const l=W.story.threads.on.find(x=>x.i===z.i);if(!l||JSON.stringify(l)!==snap||!(l instanceof (D.cls||Th)))bad.push(D.id+' (the save)');else z=l}
     const type=Th.until(z.current),w=z.wait;
     t.worldEmit(type,{e:{shape:w&&w.shape,id:-1},how:k});if(z.at!==id)bad.push(D.id+'.'+id+' (moved on by another\'s '+type+')');
     t.worldEmit(type,{e:{shape:w&&w.shape,id:w&&w.id},how:k});Kit.world()}
    const got=ended.slice(n0),last=path[path.length-1];
    if(got.length!==1||got[0].e!==z||got[0].how!==last[1]||z.at||W.story.threads.on.includes(z)||z.past.map(p=>p.join(':')).join()!==path.map(p=>p.join(':')).join())bad.push(D.id+' '+path.map(p=>p.join(':')).join('>')+' (ended '+got.length+'×, past '+z.past.map(p=>p.join(':')).join()+')')}
   Kit.world();P.quests=[];W.road=null}}finally{t.worldOff('thread:ended',fn)}
  ok(all.length>=1&&!bad.length,'every thread kind: its steps hold together, every way through it walked step by step on the bus (another\'s event ignored), saved and loaded at each step, ended once by its last step ('+all.length+' kinds, '+nPaths+' ways)'+(bad.length?': '+bad.slice(0,8).join('; '):''))}
 // ================= the Gathering kinds (story/gathering.js), every one (the test kind, as above): a year of its calendar, every
 // place told of it, open and closed on its schedule in that order, the calendar sorted all the while, saved and loaded midway;
 // its page, and entering it
 {Kit.storyKinds();const SH='gathering',Ga=t.Gathering,all=K.all(SH),bad=[],Y=t.CLOCK.year;Kit.world();Kit.clear();Kit.goHome();
  delete t.storyW().gatherings;const d0=G.day,heard=[],ears=['announced','opened','closed'].map(w=>[w,t.worldOn('gathering:'+w,d=>heard.push({w,k:d.e.k,at:d.at,day:d.day,now:G.day}))]);
  const sorted=C=>C.on.every((g,i)=>!i||C.on[i-1].due<g.due||C.on[i-1].due===g.due&&C.on[i-1].i<g.i);
  try{for(const D of all){const s=D.schedule||{},a=D.announce||0,l=D.lasts||1;
    if(!D.n||!(s.every>0&&a+l<=s.every||s.day>=1&&s.day<=Y)||!(D.places().length>0)||D.places().some(n=>!t.townBy(n)))bad.push(D.id+' (its data: name, schedule, places)')}
   Ga.day();const C=W.story.gatherings;
   for(let d=1;d<=Y;d++){G.day++;Ga.day();if(!sorted(W.story.gatherings))bad.push('the calendar out of order on day '+G.day);
    if(d===Y>>1){const snap=JSON.stringify(W.story.gatherings);Kit.world();t.saveGame(true);t.loadGame();const z=W.story.gatherings;if(z===C||JSON.stringify(z)!==snap||!z.on.every(g=>g instanceof (g.kind.cls||Ga)))bad.push('saved and loaded midway')}}
   for(const D of all){const s=D.schedule,a=D.announce||0,l=D.lasts||1;
    for(const at of D.places()){const ev=heard.filter(h=>h.k===D.id&&h.at===at);
     if(ev.length<3)bad.push(D.id+' at '+at+' (only '+ev.length+' changes in a year)');
     let prev=null;for(let j=0;j+2<ev.length;j+=3){const [x,o,c]=ev.slice(j,j+3);
      if(x.w!=='announced'||o.w!=='opened'||c.w!=='closed'){bad.push(D.id+' at '+at+' (out of order)');break}
      if(x.now!==Math.max(d0+1,x.day-a)||o.now!==o.day||x.day!==o.day||c.now!==o.day+l||c.day!==c.now)bad.push(D.id+' at '+at+' (opens '+o.day+': told '+x.now+', closed '+c.now+')');
      if(s.every&&Ga.opens(D,at,o.day)!==o.day||s.day&&t.Clock.dayOfYear(o.day)!==s.day)bad.push(D.id+' at '+at+' (opens '+o.day+', off its schedule)');
      if(prev&&o.day-prev!==(s.every||Y))bad.push(D.id+' at '+at+' (opens '+o.day+' after '+prev+')');prev=o.day}}}
   // (its page: its choices, and entering it once)
   for(const D of all){const g=W.story.gatherings.on.find(x=>x.k===D.id&&(x.st==='announced'||x.st==='open'))||W.story.gatherings.on.find(x=>x.k===D.id);
    if(!g){bad.push(D.id+' (none coming)');continue}if(g.st==='planned')g.st='announced';const p=g.page();P.gold=500;
    if(!p||!p.choices.length||!p.choices.every(c=>c instanceof t.Choice)||p.act!=='gth-do')bad.push(D.id+' (its page)');
    if(!D.choices){const g0=P.gold;Kit.world();g.show();t.act('gth-do','0');t.act('gth-do','0');
     if(g.entrants.join()!=='you'||P.gold!==g0-(D.fee||0)||!/you among them/.test(Kit.panel()))bad.push(D.id+' (entered: '+g.entrants.join()+', '+(g0-P.gold)+' gold)');
     t.act('gth-close');if(G.mode!=='world')bad.push(D.id+' (its page closed: '+G.mode+')')}}}
  finally{for(const [w,f] of ears)t.worldOff('gathering:'+w,f)}
  ok(Ga.load({k:'nope',i:1})===null,'a gathering whose kind is gone loads as nothing');
  ok(all.length>=1&&!bad.length,'every gathering kind: a year of its calendar at each place, told of '+all.map(D=>D.announce||0).join('/')+' days ahead, open and closed on its schedule, in order, the calendar sorted, saved and loaded midway; its page, entered once ('+all.length+' kinds, '+heard.length+' changes)'+(bad.length?': '+bad.slice(0,8).join('; '):''));
  delete t.storyW().gatherings;Kit.world()}
 Kit.world();W.road=null;
});
