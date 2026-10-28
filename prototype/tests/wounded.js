'use strict';
// The Wounded Traveller, the first story chain, and Ander The Fallen (story/wounded.js; the step kinds: story/steps.js;
// doc/STORY_DESIGN.md §9, doc/IMPLEMENTATION_PLAN.md §10.7–10.8): healed, he stands bandaged and offers on his page (Join you, Take
// him home, Refuse); taken home he rides as a passenger (late, captured and abandoned each end it, its line); his family names
// the gang, the trail where you found him binds the chain to the nearest hideout of their band (marked), cleared (or retargeted,
// or gone), and back at the family the heirloom (once a game) or, for Ander, a companion. Each step in your Quests (its note) and
// on the map, saved and loaded at every step. Ander is rare, never twice a game; the developer commands force him. The step
// kinds visit, deliver and lair reused by a test thread. A side story's stage is never yours to abandon (q-abandon refuses it:
// tests/quests.js), so its 'left' ends are walked by giving the stage up directly (abandon). Written on the test kit (tests/kit.js).
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,Th=t.Thread,WD=t.WOUNDED,U='hum_levy';Kit.begin('soldier',23);Kit.clear();Kit.world();
 const ash=t.townBy('Ashford'),p0=WD.ander.p;WD.ander.p=0;
 const fresh=()=>{Kit.world();Kit.clear();G.road=null;G.chase=null;G.enc=null;G.encAgain=null;G.encCool=0;G.thread=null;W.road=null;P.quests=[];P.gold=300;P.renown=5;P.morale=50;
  P.troops={[U]:6};P.wounded={};P.inv=Array(t.INV_SIZE).fill(null);t.invAdd('good','grain',30);delete P.comps.ander;G.clock=t.DAY*.4;const L=t.Thread.store();L.on=[];Kit.goHome(ash)};
 const spawn=()=>{const D=t.kindOf('encounter','traveller');for(const z of [ash,...t.TOWNS]){fresh();Kit.goHome(z);const p=t.roadSpot(D.on,0,D.near),e=p&&t.roadSpawn('traveller',p[0],p[1]);if(e)return e}
  for(let i=0;i<8;i++){fresh();const e=t.roadSpawn('traveller',P.x+12+i*20,P.y+(i%3)*16);if(e)return e}return null};
 const save=()=>{G.thread=null;Kit.world();const a=JSON.stringify(P.quests),b=JSON.stringify(W.story.threads.on);t.saveGame(true);P.quests=[];W.story.threads.on=[];t.loadGame();Kit.world();
  return JSON.stringify(P.quests)===a&&JSON.stringify(W.story.threads.on)===b&&W.story.threads.on.every(x=>x instanceof Th)};
 const live=()=>W.story.threads.on.find(x=>x.k==='wounded');
 const step=()=>{const th=live();return th&&th.wait&&th.wait.shape==='quest'?t.Quest.as(P.quests.find(q=>q.id===th.wait.id)):null};
 const frame=()=>t.updateRoad(.05);
 const there=q=>{P.x=q.to.x;P.y=q.to.y+(q.to.k==='spot'?0:10);P.tx=null;frame()};
 const ended=[],ear=t.worldOn('thread:ended',ev=>ended.push(ev)),encEnd=[],ear2=t.worldOn('encounter:ended',ev=>encEnd.push(ev));
 const ends=th=>ended.filter(x=>x.e===th).map(x=>x.how);
 // (a healed traveller: met, Tend his wounds)
 const heal=e=>{t.roadMeet(e);t.act('enc-do','0');return e};
 const pick=label=>String(t.ROAD_ENC.traveller.acts.findIndex(c=>c.label===label));
 const pageHas=(...ws)=>{const h=Kit.text();return ws.every(w=>h.includes(w))};
 // (the Prison of the holding that holds him: on its rail, or from outside its walls when it is hostile: world/prisons.js)
 const atPrison=q=>{const h=t.townBy(q.held.town);if(t.hostileTo(h.owner)){t.openSiege(h);t.act('sg-prison')}else{t.enterTown(h);t.act('tab','prison')}};
 // (a chain under way, taken home from a fresh traveller)
 const home=()=>{const e=heal(spawn());t.act('enc-do',pick('Take him home'));t.act('enc-leave');return {e,th:live(),q:step()}};
 try{
  // ---- what it is made of: the chain's steps, the step kinds, Ander's entries, the heirloom
  {const K=t.kindOf('thread','wounded');ok(!!K&&K.steps.map(s=>s.id).join()==='escort,family,tracks,trail,clear,back,reward,held,call'&&['visit','deliver','lair','held'].every(k=>t.kindOf('step',k))&&!t.kindOf('quest','visit'),
    'the chain: escort, family, tracks, trail, clear, back, reward, and its rescue (held, call); the step kinds visit, deliver, lair, held (no board offers them)');
   const I=t.ITEMS.hearthring;ok(I&&I.heirloom&&I.slot==='ring'&&t.ITEM_KINDS.gear.catId({id:'hearthring'})==='armour'&&I.m.sk.med===1&&I.m.regen>0,'the heirloom: the '+I.n+', a ring (Armour): '+I.d);
   ok(t.COMPS.ander.story&&!Object.keys(t.COMPS).includes('ander')&&t.ST.ander.tier===3&&t.compTown('ander')==null&&!t.TOWNS.some(z=>t.compsHere(z).includes('ander'))&&t.unitSprite('ander',0,false).width>0&&t.portrait('ander').length>0&&t.PEOPLE_LOOK.ander.scar&&t.PEOPLE_LOOK.ander.cape==='dark',
    'Ander The Fallen: a companion of the story, unlisted (no tavern offers him, the wiki keeps his secret), his kind, his sprite and portrait (a scar, a dark cloak)')}
  // ---- 1. heal him: he stands, bandaged, and his page goes on to his offer
  {const e=spawn();ok(!!e&&!e.ander,'a wounded traveller by the road');const end0=e.end,m0=G.msgs.length;heal(e);
   ok(e.healed&&!e.done&&!e.gone&&G.mode==='road'&&G.road===e&&e.end>=t.roadNow()+WD.wait-1e-6&&e.end>end0,'Tend his wounds: healed, not done with; his page stays open, his time lengthened');
   ok(pageHas('Join you','Take him home','Refuse')&&!pageHas('Tend his wounds','Take his purse')&&!Kit.q('[data-nav="close"]'),'his offer: Join you, Take him home or Refuse; no way out till you answer');
   ok(pageHas(t.Wounded.nameOf(e),t.Wounded.homeOf(e).town)&&G.msgs.slice(m0).some(m=>/Bandaged and fed, he gets to his feet/.test(m.m)),'what you see: his name and his family’s place; the result’s line');
   const sc=t.ROAD_ENC.traveller.scene(e);ok(sc[0][0]==='stand'&&sc[0][1]==='healed'&&/:1$/.test(e.view().key),'he stands, bandaged (the healed look), on his page’s banner too');
   // (saved and loaded with his offer open: from the map, as a save is only made there)
   Kit.world();const snap=JSON.stringify(e);t.saveGame(true);W.road=null;t.loadGame();Kit.world();const z=t.roadList().find(o=>o.i===e.i);
   ok(z&&JSON.stringify(z)===snap&&z.home&&z.healed,'saved and loaded with his offer open: as he was, his home kept');t.roadMeet(z);ok(pageHas('Take him home'),'met again: his offer')}
  // ---- 2a. Join you: a first-tier soldier of his people, gone from the road; no chain
  {const e=heal(spawn()),k=t.Wounded.troop(e),n0=P.troops[k]||0;t.act('enc-do',pick('Join you'));
   ok(t.ST[k].tier===1&&P.troops[k]===n0+1&&e.gone&&e.done&&encEnd.filter(x=>x.e===e).map(x=>x.how).join()==='done'&&!live(),'Join you: +1 '+t.ST[k].n+' (his people’s first tier), off the road, done once; no chain begins');t.act('enc-leave')}
  // ---- 2b. Refuse: he limps off, a little reputation lost at his home; no body left by the road
  {const e=heal(spawn()),h=t.Wounded.homeOf(e).town,r0=t.repAt(h);t.act('enc-do',pick('Refuse'));
   ok(t.repAt(h)===r0-WD.refuse&&e.beh==='leave'&&e.done&&!live()&&t.ROAD_ENC.traveller.scene(e)[0][0]==='walk','Refuse: he limps off down the road; reputation in '+h+' −'+WD.refuse+'; no chain');
   t.act('enc-leave');e.over();ok(!t.roadList().some(o=>o.trace&&o.k==='body'&&o.x===e.x&&o.y===e.y),'and he never dies by the road: no body left')}
  // ---- 2c. Take him home: the chain begins, the escort its first step
  let C=home();
  {const {e,th,q}=C,m=th.memory;
   ok(th&&th.at==='escort'&&m.name===t.Wounded.nameOf(e)&&m.home.town&&m.town===m.home.town&&m.at.x===Math.round(e.x)&&['bandits','raiders','bog'].includes(m.band)&&!!m.gang&&!m.ander&&e.gone,
    'Take him home: the chain begins with what it knows ('+m.name+', home '+JSON.stringify(m.home)+', the '+m.gang+')');
   const d=Math.hypot(t.townBy(m.town).x-e.x,t.townBy(m.town).y-e.y)/t.TILE;ok(d<=WD.home.max+1||t.TOWNS.every(z=>Math.hypot(z.x-e.x,z.y-e.y)/t.TILE<WD.home.min||Math.hypot(z.x-e.x,z.y-e.y)/t.TILE>WD.home.max),'his home within a sensible way ('+Math.round(d)+' tiles)');
   ok(q&&q.type==='escort'&&q.quiet&&q.pn===m.name&&['house','estate','holding'].includes(q.to.k)&&q.homeMark()===q.to&&t.Escort.list().includes(q),'the escort: '+q.title+', a passenger, its place a home (a house on the map)');
   t.openQuests();ok(pageHas('The Wounded Traveller: '+m.name,'Side quest','Bring '+m.name+' home')&&!Kit.qa('.qw-row').some(r=>r.textContent.includes('Escort '+m.name)),'your Quests: the story, once (its escort is its objective, not a row of its own), with what to do now');Kit.world();
   {let err='';try{t.wuiEscorts({x:q.to.x-200,y:q.to.y-100},performance.now(),false);t.drawQuestMarks({x:0,y:0})}catch(x){err=x.message}ok(!err,'its place marked on the map'+(err?' EXC '+err:''))}
   ok(save(),'saved and loaded on the escort step');C={...C,th:live(),q:step()}}
  // ---- 3/4. arrival: no page of the escort's own; his family's page
  {const {th,q}=C,r0=t.repAt(th.memory.town),m0=G.msgs.length;there(q);
   ok(q.fate==='arrived'&&th.at==='family'&&G.mode==='story'&&G.thread===th&&!G.escort&&t.repAt(th.memory.town)===r0+WD.escort.rep,'at his door: arrived (reputation +'+WD.escort.rep+'), and his family’s page at once (no escort page of its own)');
   ok(G.msgs.slice(m0).some(m=>/is home: the door of/.test(m.m))&&pageHas(th.memory.name+'’s family',th.memory.gang,'Promise to find them','Ride on')&&!Kit.q('[data-nav="close"]'),'his line; his family names the gang: '+th.memory.gang);
   ok(save()&&live().at==='family'&&G.mode==='world','saved and loaded with the family’s page waiting');frame();ok(G.mode==='story'&&G.thread===live(),'back on the map: the page waiting is shown');
   C.th=live();t.act('thr-do','0');ok(C.th.at==='tracks'&&G.mode==='world','promised: the next step, back to where you found him')}
  // ---- 5. the investigation: to where you found him; the trail binds the chain to a hideout and marks it
  {const {th}=C,q=step();ok(q&&q.type==='visit'&&q.to.k==='spot'&&q.to.x===th.memory.at.x&&!q.homeMark()&&t.questGoal(q).x===q.to.x,'a visit: to where you found him (the quests’ "!" there, the minimap’s dot)');
   t.openQuests();ok(pageHas('Find the trail where you found','Go to where you found')&&!/0 days left/.test(Kit.text()),'in your Quests: where to go, no due day');Kit.world();
   ok(save(),'saved and loaded on the way');C.th=live();const q2=step();there(q2);const m=C.th.memory,s=m.site!=null&&W.sites.find(x=>x.i===m.site);
   ok(q2.fate==='arrived'&&C.th.at==='trail'&&s&&s instanceof t.Hideout&&!s.cleared&&s.seen&&m.lair===s.name&&G.thread===C.th&&pageHas('Ride for their hideout',s.name),'there: the trail leads to the '+s.name+' ('+s.band+'; his attackers were '+m.band+'), marked on your map; its page');
   const near=t.LairQuest.near(m.at,m.band);ok(near===s,'the nearest hideout of their band');
   ok(save(),'saved and loaded with the trail’s page');frame();C.th=live();t.act('thr-do','0');ok(C.th.at==='clear','Ride for their hideout: the next step')}
  // ---- 6. clear their hideout: by the very fight (its own, not another's)
  {const th=C.th,q=step(),s=q.lair();ok(q.type==='lair'&&s&&s.i===th.memory.site&&t.questGoal(q).x===s.x&&!q.homeMark(),'a clear step: bound to the '+s.name+' (its "!" on the map)');
   ok(save(),'saved and loaded before the fight');const q2=step(),s2=q2.lair(),other=W.sites.find(x=>x instanceof t.Hideout&&x!==s2);
   if(other){t.worldEmit('site:cleared',{site:other});ok(P.quests.includes(q2)&&live().at==='clear','another hideout cleared: not this one')}
   const m0=G.msgs.length;Kit.meet({kind:'camp',ref:s2,n:4,band:s2.band});Kit.seeded(4,()=>t.concludeEncounter(true,{},0,true,[]));Kit.done({cont:true,world:true});
   ok(q2.fate==='cleared'&&!P.quests.includes(q2)&&s2.cleared&&live().at==='back'&&G.msgs.slice(m0).some(m=>/are broken/.test(m.m)),'its hideout stormed and won: cleared (its line), back to the family');C.th=live()}
  // ---- 7. the reward: the heirloom, reputation, renown
  {ok(save(),'saved and loaded on the way back');const th=live(),q=step();ok(q.type==='visit'&&q.homeMark()&&q.to.town===th.memory.town,'back: a visit to his family’s door (a house on the map)');
   const r0=t.repAt(th.memory.town),n0=P.renown;there(q);ok(th.at==='reward'&&pageHas('Hearthward Ring','Accept their thanks')&&!pageHas('Ride with me'),'his family’s thanks: the heirloom offered');
   ok(save(),'saved and loaded at the reward');frame();const z=live();t.act('thr-do','0');
   ok(P.inv.some(x=>x&&x.k==='gear'&&x.id==='hearthring')&&t.repAt(z.memory.town)===r0+WD.reward.rep&&P.renown===n0+WD.reward.renown&&ends(z).join()==='thanks'&&!live()&&Th.once('heirloom')===G.day,
    'accepted: the Hearthward Ring in your bag, reputation +'+WD.reward.rep+', renown +'+WD.reward.renown+'; the chain ends (thanks), the heirloom given once');
   ok(W.story.threads.ended.some(x=>x.i===z.i&&x.how==='thanks'&&x.memory.name===z.memory.name),'its end kept, with what it knew');
   const g=t.Wounded.gift({memory:{town:'Ashford'},i:9});ok(!g.gear&&g.gold===WD.reward.gold,'a second family’s thanks: gold, not a second heirloom');
   ok(save(),'saved and loaded after')}
  // ---- the escort's failures: late, captured, left; each its line, consequences and end
  {C=home();const {th,q}=C,h=th.memory.town,r0=t.repAt(h),m0=G.msgs.length;G.day=q.due+1;t.questDay();
   ok(q.fate==='late'&&ends(th).join()==='late'&&t.repAt(h)===r0-WD.escort.late&&G.msgs.slice(m0).some(m=>/limps the rest of the way to/.test(m.m)),'late: he limps home alone; reputation in '+h+' −'+WD.escort.late+'; the chain ends (late)')}
  {C=home();const {th,q}=C,mo=P.morale,r0=t.repAt(th.memory.town),m0=G.msgs.length;q.by={k:'holding',town:th.memory.town,fac:t.townBy(th.memory.town).owner};q.fail(null,'captured');
   ok(!ends(th).length&&th.at==='held'&&step().held.k==='holding'&&P.morale===mo-WD.escort.morale&&t.repAt(th.memory.town)===r0&&G.msgs.slice(m0).some(m=>/drag .* off in chains/.test(m.m)),'captured: morale −'+WD.escort.morale+', not his home’s reputation; its line; the chain goes on to his rescue');
   ok(th.memory.held&&th.memory.held.k==='holding'&&th.memory.held.town===th.memory.town,'who holds him kept in its memory');t.Quest.as(step()).abandon();ok(ends(th).join()==='left','his rescue given up: an ordinary traveller’s chain is over (left)')}
  {C=home();const b=t.asParty({x:P.x+10,y:P.y,n:4,kind:'bandits',cool:0,t:0,a:0});t.bandits.push(b);Kit.meet({kind:'party',ref:b,n:4,list:b.troops.slice(),band:'bandits'});
   Kit.seeded(4,()=>t.concludeEncounter(false,{},0,true,[]));Kit.done({cont:true,world:true});ok(C.q.fate==='captured'&&!ends(C.th).length&&C.th.at==='held'&&step().held.k==='band','a battle lost with him aboard: captured, held by the band');
   t.Quest.as(step()).abandon();ok(!t.carries(b,C.q.id)&&ends(C.th).join()==='left','given up: the band lets go of him, the chain is over');Kit.clear()}
  {C=home();t.Quest.as(C.q).abandon();ok(C.q.fate==='left'&&ends(C.th).join()==='left','abandoned: set down by the road, the chain ends (left)')}
  // ---- the other branches: the family's Ride on, the trail let lie, the trail gone cold
  const toFamily=()=>{const c=home();there(c.q);return c};
  {const c=toFamily();t.act('thr-do','1');ok(ends(c.th).join()==='part'&&G.mode==='world','his family’s page, Ride on: the chain ends quietly (part)')}
  const toTrail=()=>{const c=toFamily();t.act('thr-do','0');there(step());return c};
  {const c=toTrail();t.act('thr-do','2');ok(ends(c.th).join()==='drop','the trail, Let it lie: the chain ends (drop)')}
  {const hs=W.sites.filter(s=>s instanceof t.Hideout&&!s.cleared);hs.forEach(s=>s.cleared=true);try{const c=toTrail();
    ok(c.th.memory.site===null&&pageHas('The trail is cold','Back to his family')&&!pageHas('Ride for their hideout'),'no hideout left anywhere: the trail is cold');t.act('thr-do','1');ok(c.th.at==='back','back to his family with the news')}finally{hs.forEach(s=>s.cleared=false)}}
  // ---- the hideout cleared by another, or gone: the nearest of its band instead, else the step is over
  {const c=toTrail();t.act('thr-do','0');const q=step(),s=q.lair(),m0=G.msgs.length;s.cleared=true;
   const alt=t.LairQuest.near(q.to,q.band,t.STEP.retarget);t.questDay();
   if(alt){ok(P.quests.includes(q)&&q.lair()===alt&&alt.seen&&c.th.at==='clear'&&G.msgs.slice(m0).some(m=>/survivors have fled to/.test(m.m)),'cleared by another: retargeted to the '+alt.name+' (their survivors fled there), marked')}
   else info('  (no other hideout within '+t.STEP.retarget+' tiles: retargeting not seen here)');
   const hs=W.sites.filter(x=>x instanceof t.Hideout&&!x.cleared);hs.forEach(x=>x.cleared=true);try{t.questDay();ok(q.fate==='gone'&&c.th.at==='back'&&!P.quests.includes(q),'none left within reach: the step is over (gone), back to the family')}finally{hs.forEach(x=>x.cleared=false);s.cleared=false}}
  // ---- Ander The Fallen: rare, forced by the developer command; escort AND clear, then he joins as a companion; never twice
  {fresh();const D=t.DevConsole,x=c=>{try{return D.execute(c)}catch(e){return 'ERR '+e.message}};delete t.Thread.store().once;
   const s0=x('ander'),e=t.roadList().find(o=>o.k==='traveller'&&o.ander);ok(/Ander The Fallen lies wounded/.test(s0)&&e&&e.race==='human'&&t.ROAD_ENC.traveller.scene(e)[0][1]==='ander','the command ander: Ander The Fallen lies wounded near you ('+s0+')');
   ok(/^ERR .*never twice/.test(x('enc wounded ander')),'one at a time: another refused while he lies there');
   t.roadMeet(e);ok(pageHas('A tall man in a dark cloak'),'his own page');t.act('enc-do','0');
   ok(e.healed&&Th.once('ander')===G.day&&!pageHas('Join you')&&pageHas('Take him home','Refuse','Ander','then he joins you'),'healed: met once this game; no Join: take him home, then he joins');
   t.act('enc-do',pick('Take him home'));t.act('enc-leave');const th=live();ok(th.memory.ander&&th.memory.name==='Ander'&&step().pn==='Ander','his chain: his escort');
   ok(save(),'saved and loaded with Ander aboard');there(step());ok(pageHas('Ander’s sister','my sword is yours'),'at his sister’s door: his page');t.act('thr-do','0');there(step());t.act('thr-do','0');
   ok(step().type==='lair','he joins only once the hideout is cleared: '+step().title);ok(save(),'saved and loaded before the fight');const s=step().lair();
   Kit.meet({kind:'camp',ref:s,n:4,band:s.band});Kit.seeded(5,()=>t.concludeEncounter(true,{},0,true,[]));Kit.done({cont:true,world:true});there(step());
   ok(pageHas('Ander The Fallen','Ride with me')&&!pageHas('Accept their thanks'),'back at his sister’s: Ride with me');ok(save(),'saved and loaded at the end');frame();
   const z=live();t.act('thr-do','1');const c=P.comps.ander;
   ok(c&&c.lv===WD.ander.lv&&c.attr.str===WD.ander.attr.str&&c.attr.agi===WD.ander.attr.agi&&t.compInBand('ander')&&t.compSkill('ander','lead')===3&&ends(z).join()==='joins'&&!P.troops.ander,'he joins as a companion (not a troop): level '+c.lv+', Strength '+c.attr.str+', Agility '+c.attr.agi+', Leadership 3');
   ok(t.rating(['ander'])>t.rating([U])*2,'a veteran: his power '+t.rating(['ander']));
   // (never twice: the chance at its fullest, and no second Ander comes; the command refuses; kept through a save)
   ok(/^ERR .*never twice/.test(x('ander'))&&!t.Wounded.anderFree(),'never twice: the command refuses');
   WD.ander.p=1;try{const e2=spawn();ok(e2&&!e2.ander,'with every traveller his chance, no second Ander comes');t.saveGame(true);t.loadGame();Kit.world();ok(Th.once('ander')>=1&&!t.Wounded.anderFree(),'his once kept through a save');
    delete t.Thread.store().once;const e3=spawn();ok(e3&&e3.ander,'(a game where he was never met: the chance makes one Ander)')}finally{WD.ander.p=0}
   delete P.comps.ander}
  // ---- the rescue (the owner, 2026-10-23): carried off and held, no deadline; freed by you, the escort again
  const lose=e=>{Kit.meet(e);Kit.seeded(4,()=>t.concludeEncounter(false,{},0,true,[]));Kit.done({cont:true,world:true})};
  const win=e=>{Kit.meet(e);Kit.seeded(4,()=>t.concludeEncounter(true,{},0,true,[]));Kit.done({cont:true,world:true})};
  const band=()=>{const b=t.asParty({x:P.x+10,y:P.y,n:4,kind:'bandits',cool:0,t:0,a:0});t.bandits.push(b);return b};
  const vsBand=b=>({kind:'party',ref:b,n:b.troops.length,list:b.troops.slice(),band:b.kind});
  const lordNear=()=>{const l=W.lords.find(x=>!x.dead&&!x.inside&&t.fiefsOf(x.fac).length);l.x=P.x+10;l.y=P.y;return l};
  const vsLord=l=>({kind:'lord',ref:l,list:l.troops.slice()});
  const drop=()=>{const q=step();if(q)t.Quest.as(q).abandon()};
  // (saved and loaded: the quests, the threads and what is kept aside, Ander wandering, as they were)
  const saved=()=>{const a=JSON.stringify(Th.store().aside||null);return save()&&JSON.stringify(Th.store().aside||null)===a};
  {C=home();const b=band();lose(vsBand(b));const th=C.th,q=step();
   ok(C.q.fate==='captured'&&th.at==='held'&&q&&q.type==='held'&&q.held.k==='band'&&t.carries(b,q.held.cap)&&th.memory.held.k==='band'&&!q.days&&t.bandits.includes(b),'captured by bandits: held by the band that beat you (it carries him); his rescue in your Quests, no due day');
   const g=t.questGoal(q);ok(g&&g.x===b.x&&g.y===b.y&&/hold .* captive/.test(b.tip())&&!q.homeMark(),'the band marked on your map where it is, its tip says whom it holds');
   t.openQuests();ok(pageHas('Free '+th.memory.name,'before they take him to their hideout'),'your Stories: what to do now');Kit.world();
   ok(saved(),'saved and loaded while the band holds him');const b2=t.bandCarrying(step().held.cap);ok(!!b2&&b2.carry[0].n===th.memory.name,'the band still carries him after the load');
   win(vsBand(b2));const z=live(),e2=step();
   ok(W.story.threads.ended.some(x=>x.i===th.i&&x.how==='freed')&&z.i!==th.i&&z.at==='escort'&&e2&&e2.type==='escort'&&z.memory.freed&&!z.memory.held&&z.memory.name===th.memory.name&&e2.days>0&&e2.due>G.day&&!t.bandCarrying(q.held.cap),
    'the band beaten: freed; the chain picks itself up at the escort, from where you are (a fresh due day: '+(e2&&e2.days)+' days)');drop()}
  {C=home();const b=band();lose(vsBand(b));const q=step(),cap=q.held.cap;G.day=q.goes-1;t.questDay();ok(live().at==='held'&&step()===q&&q.held.k==='band','the band carries him '+WD.rescue.home+' days');
   const m0=G.msgs.length;G.day=q.goes;t.questDay();const s=q.lair();
   ok(P.quests.includes(q)&&q.held.k==='lair'&&s&&s.seen&&t.questGoal(q).x===s.x&&!t.bandCarrying(cap)&&G.msgs.slice(m0).some(m=>/has taken .* to the/.test(m.m)),'then it takes him home to the '+(s&&s.name)+' (marked on your map), and lets go of him');
   t.openQuests();ok(pageHas('from the '+s.name),'your Stories: free him from the '+s.name);Kit.world();
   G.day+=120;t.questDay();ok(live().at==='held'&&P.quests.includes(q),'no deadline: 120 days on, he is still there to be freed');
   ok(saved(),'saved and loaded with him in the hideout');const d2=step(),s2=d2.lair();
   try{win({kind:'camp',ref:s2,n:4,band:s2.band});ok(d2.fate==='freed'&&live().at==='escort'&&live().memory.freed,'its hideout cleared: freed, the escort again')}finally{s2.cleared=false}drop()}
  {C=home();const l=lordNear();lose(vsLord(l));const th=live(),q=step(),h=q&&t.townBy(q.held.town);
   ok(th.at==='held'&&q.held.k==='holding'&&h&&h.owner===l.fac&&th.memory.held.k==='holding'&&q.price===WD.rescue.ransom.traveller&&!q.days&&!q.homeMark(),'captured by '+l.name+'’s army: held in '+(h&&h.name)+', a holding of his realm, his ransom '+(q&&q.price)+' gold');
   G.day+=120;t.questDay();ok(live().at==='held'&&P.quests.includes(q),'no deadline: 120 days on, still there to ransom');
   ok(saved(),'saved and loaded with him in the gaol');const q2=step();P.gold=q2.price-1;atPrison(q2);
   ok(pageHas(q2.price+'g asked','Pay '+q2.price+'g')&&document.querySelector('[data-act="pz-quest"]').disabled,'at its Prison ('+(t.hostileTo(h.owner)?'from outside its walls':'on its rail')+'): his ransom, '+q2.price+' gold');
   t.act('pz-quest',q2.id);ok(P.quests.includes(q2)&&P.gold===q2.price-1,'not enough gold: nothing paid');
   P.gold=q2.price+50;atPrison(q2);t.act('pz-quest',q2.id);ok(P.gold===50&&q2.fate==='freed'&&live().at==='escort','paid '+q2.price+' gold: freed, the escort again');t.toWorld();drop()}
  {C=home();lose(vsLord(lordNear()));const q=step(),h=t.townBy(q.held.town);t.worldEmit('battle:ended',{enc:{kind:'siege',ref:h},how:'won'});
   ok(q.fate==='freed'&&live().at==='escort','you storm '+h.name+': he is freed from its gaol');drop()}
  {C=home();lose(vsLord(lordNear()));const q=step(),h=t.townBy(q.held.town),o=h.owner;try{h.owner='player';t.questDay();ok(q.fate==='freed'&&live().at==='escort','it is yours now: freed')}finally{h.owner=o}drop()}
  {C=home();const s=W.sites.find(x=>x instanceof t.Hideout&&!x.cleared);lose({kind:'camp',ref:s,n:4,band:s.band});const q=step();
   ok(live().at==='held'&&q.held.k==='lair'&&q.lair()===s&&live().memory.held.k==='lair','beaten storming the '+s.name+': he is held there');drop()}
  // ---- his holder destroyed by another, or no one took him: he makes his own way home, and the chain resumes at his family
  {C=home();const b=band();lose(vsBand(b));const q=step(),m0=G.msgs.length;t.bandits.splice(t.bandits.indexOf(b),1);t.questDay();const th=live(),v=step();
   ok(q.fate==='gone'&&th.at==='call'&&v.type==='visit'&&v.to.town===th.memory.town&&G.msgs.slice(m0).some(m=>/are scattered/.test(m.m)),'the band beaten by another: he got away and made his own way home');
   ok(saved(),'saved and loaded on the way to his family');there(step());ok(live().at==='family'&&pageHas('made his own way back','Promise to find them'),'at his family’s: the chain resumes at their page');t.act('thr-do','1')}
  {C=home();lose(vsLord(lordNear()));const q=step(),h=t.townBy(q.held.town),o=h.owner,f=t.FIDS.find(x=>x!==o);try{h.owner=f;t.questDay();ok(q.fate==='gone'&&live().at==='call','the holding changes hands to another: let out in the turmoil, home on his own')}finally{h.owner=o}drop()}
  {C=home();const b=band();lose(vsBand(b));const q=step();G.day=q.goes;t.questDay();const s=q.lair(),hs=W.sites.filter(x=>x instanceof t.Hideout&&!x.cleared);
   try{s.cleared=true;t.questDay();if(q.lair()!==s&&P.quests.includes(q))ok(q.held.k==='lair'&&q.lair().seen,'his hideout cleared by another: its survivors took him to the '+q.lair().name);
    hs.forEach(x=>x.cleared=true);t.questDay();ok(q.fate==='gone'&&live().at==='call','none of his band left: home on his own')}finally{hs.forEach(x=>x.cleared=false)}drop()}
  {C=home();const m0=G.msgs.length;t.Escort.lost({kind:'monster',ref:{x:P.x,y:P.y}});
   ok(C.q.fate==='captured'&&live().at==='call'&&live().memory.held.k==='none'&&G.msgs.slice(m0).some(m=>/slips away into the dark/.test(m.m)),'lost to beasts: they take no captives; he slips away and makes his own way home');drop()}
  // ---- Ander is never lost: every end but the reward (and dying unhealed) sends him wandering the taverns
  const anderHealed=before=>{fresh();delete Th.store().once;delete Th.store().aside;W.news=null;if(before)before();t.DevConsole.execute('ander');const e=t.roadList().find(o=>o.k==='traveller'&&o.ander);t.roadMeet(e);t.act('enc-do','0');return e};
  const anderHome=()=>{anderHealed();t.act('enc-do',pick('Take him home'));t.act('enc-leave');return {th:live(),q:step()}};
  const wanders=()=>!!t.Wanderer.state&&!!t.Wanderer.at();
  {const a=anderHome();ok(a.q.days===0&&/no hurry/.test(t.Escort.tag()[2]),'Ander’s escort has no due day');G.day+=60;t.questDay();ok(P.quests.includes(a.q)&&live()===a.th,'never late: 60 days on he still rides with you');
   t.Quest.as(a.q).abandon();ok(ends(a.th).join()==='left'&&wanders(),'abandoned: he goes wandering')}
  {anderHealed();t.act('enc-do',pick('Refuse'));t.act('enc-leave');ok(wanders()&&!live(),'refused: wandering')}
  {anderHealed(()=>{for(let i=0;i<t.ESCORT.max;i++)t.Escort.start({who:'child',to:{town:'Ashford'}})});
   ok(!!t.Escort.why()&&pageHas('Meet him later')&&!pageHas('Take him home'),'no room for a passenger: no forced refusal, he offers to meet you later');
   t.act('enc-do',pick('Meet him later'));t.act('enc-leave');ok(wanders()&&!live(),'met later: wandering');P.quests=[]}
  {const a=anderHome();there(a.q);t.act('thr-do','1');ok(ends(a.th).join()==='part'&&wanders(),'Ride on at his sister’s: wandering')}
  {const a=anderHome();there(a.q);t.act('thr-do','0');there(step());t.act('thr-do','2');t.act('thr-do','2!');ok(ends(a.th).join()==='drop'&&wanders()&&!t.Wanderer.state.done,'Let it lie: wandering')}
  {const a=anderHome();const b=band();lose(vsBand(b));ok(live().at==='held'&&step().held.k==='band','Ander carried off by a band');t.Quest.as(step()).abandon();ok(ends(a.th).join()==='left'&&wanders(),'his rescue given up: wandering')}
  {const a=anderHome();const b=band();lose(vsBand(b));t.bandits.splice(t.bandits.indexOf(b),1);t.questDay();ok(ends(a.th).join()==='loose'&&wanders(),'his band beaten by another: he slips away, wandering')}
  {const a=anderHome();t.Escort.lost({kind:'monster',ref:{x:P.x,y:P.y}});ok(ends(a.th).join()==='loose'&&wanders(),'lost to beasts: wandering')}
  {const a=anderHome();lose(vsLord(lordNear()));const q=step();ok(q.type==='held'&&q.held.k==='holding'&&q.price===WD.rescue.ransom.ander,'held by a lord: a sellsword of his name fetches '+q.price+' gold');
   P.gold=q.price;atPrison(q);t.act('pz-quest',q.id);t.toWorld();ok(ends(a.th).join()==='freed'&&live().memory.ander&&step().type==='escort'&&!step().days&&!t.Wanderer.state,'ransomed: his escort again, no due day');drop();ok(wanders(),'then abandoned: wandering')}
  // ---- wandering: tavern to tavern, the rumour, winning him back
  {const a=anderHome();there(a.q);t.act('thr-do','1');const s=t.Wanderer.state,w=t.Wanderer.at(),D=WD.wander.days,len=x=>x.to-x.from;
   ok(s&&w&&t.Wanderer.taverns().some(z=>z.name===w.town)&&w.leg===0&&w.from===G.day&&len(w)>=D[0]&&len(w)<=D[1],'wandering: he drinks in the tavern of '+w.town+' for '+len(w)+' days');
   const w2=t.Wanderer.at(w.to);ok(w2.leg===1&&w2.town!==w.town&&len(w2)>=D[0]&&len(w2)<=D[1]&&JSON.stringify(t.Wanderer.at(w.to))===JSON.stringify(w2),'then he moves on, to '+w2.town+' (the same however often asked: no draw)');
   const seen=new Set();for(let d=G.day;d<G.day+60;d++)seen.add(t.Wanderer.at(d).town);ok(seen.size>=3,'over 60 days, '+seen.size+' taverns');
   ok(saved()&&JSON.stringify(t.Wanderer.at())===JSON.stringify(w),'saved and loaded while he wanders: the same place');
   const z=t.townBy(w.town),o=t.Wanderer.taverns().find(x=>x!==z&&!t.hostileTo(x.owner)&&!t.Place.closed(x));W.news=null;Kit.world();t.enterTown(o);t.act('tab','tavern');
   ok(pageHas('Ander',w.town)&&!pageHas('Finish the job')&&W.news.items.some(it=>it.k==='ander'&&it.detail.town===w.town),'the tavern of '+o.name+': a rumour of where he was seen ('+w.town+'), not him');
   t.act('leave');Kit.world();G.day=w.to;t.enterTown(o);t.act('tab','tavern');ok(W.news.items.filter(it=>it.k==='ander').map(it=>it.detail.town).join()===w2.town,'moved on: the rumour tells his new tavern');t.act('leave');Kit.world();G.day=w.from;
   t.enterTown(z);ok(pageHas('a scarred sellsword in a dark cloak'),'his holding’s overview: a sellsword drinks in its tavern');t.act('tab','tavern');
   ok(pageHas('Ander The Fallen','Finish the job','Pay '+WD.wander.price+'g')&&!t.compsHere(z).includes('ander')&&!Object.keys(t.COMPS).includes('ander'),'in his tavern: his own card, never the hiring list (still unlisted: the wiki keeps his secret)');
   P.troops={[U]:P.cap()};P.gold=1000;t.act('ander-pay');ok(!P.comps.ander&&P.gold===1000&&!!t.Wanderer.state,'your band full: he will not join (come back with room)');
   P.troops={[U]:2};t.act('ander-pay');ok(P.comps.ander&&P.gold===1000-WD.wander.price&&!t.Wanderer.state&&t.compInBand('ander')&&P.comps.ander.lv===WD.ander.lv,'his price paid, '+WD.wander.price+' gold: he joins you');
   ok(!pageHas('Finish the job'),'and is gone from the tavern');t.act('leave');Kit.world();delete P.comps.ander}
  {const a=anderHome();there(a.q);t.act('thr-do','1');const w=t.Wanderer.at();t.enterTown(t.townBy(w.town));t.act('tab','tavern');t.act('ander-job');t.act('leave');Kit.world();
   const th=live();ok(th&&th!==a.th&&th.memory.ander&&th.at==='tracks'&&!t.Wanderer.state,'finish the job: his chain picked up at the trail (where you found him)');
   there(step());t.act('thr-do','0');const s=step().lair();try{win({kind:'camp',ref:s,n:4,band:s.band})}finally{s.cleared=false}const back=step();t.Quest.as(back).abandon();
   ok(ends(th).join()==='left'&&t.Wanderer.state&&t.Wanderer.state.done===1,'their hideout cleared, then left: wandering again, the job done');ok(saved(),'saved and loaded (the job done)');
   const w2=t.Wanderer.at();t.enterTown(t.townBy(w2.town));t.act('tab','tavern');ok(pageHas('Ride with me','are done'),'his card: ride with me');t.act('ander-job');
   ok(P.comps.ander&&!t.Wanderer.state&&!live(),'the job done already: he joins at once');t.act('leave');Kit.world();delete P.comps.ander}
  {fresh();delete Th.store().aside;const z=t.Wanderer.taverns()[0];W.news=null;t.enterTown(z);t.act('tab','tavern');ok(!pageHas('Ander')&&!t.Wanderer.at(),'none wandering (a game where he was never met, or he rides with you): no sign of him in any tavern');t.act('leave');Kit.world()}
  // ---- the developer commands: chains, chain n go
  {C=home();const D=t.DevConsole,x=c=>{try{return D.execute(c)}catch(e){return 'ERR '+e.message}};
   ok(new RegExp(C.th.i+' · The Wounded Traveller \\(wounded\\) · step escort').test(x('chains')),'chains lists it');
   const j=x('chain '+C.th.i+' go');ok(/Teleported/.test(j)&&Math.hypot(P.x-C.q.to.x,P.y-C.q.to.y)<=t.ESCORT.reach.lot+t.TILE,'chain '+C.th.i+' go: to where its step points ('+j+')');
   frame();ok(C.th.at==='family'&&/its page waits/.test(x('chain '+C.th.i+' go')),'there; a page step points nowhere: it says so');t.act('thr-do','1')}
  // ---- the step kinds, reused by another thread: a visit to a spot, a delivery
  {fresh();if(!t.kindOf('thread','test_steps'))t.defineKind('thread','test_steps',{n:'Steps test',steps:[
    {id:'go',start:{step:'visit',spec:th=>({to:{x:th.memory.x,y:th.memory.y,name:'the old well'}})},how:d=>d.e.fate||d.how,then:{arrived:'bring'}},
    {id:'bring',start:{step:'deliver',spec:{to:{town:'Ashford'},give:{grain:5},prize:{gold:7}}},how:d=>d.e.fate||d.how,then:{arrived:null}}]});
   P.inv=Array(t.INV_SIZE).fill(null);Kit.goHome(ash);const th=Th.start('test_steps',{town:'Ashford',x:ash.x+300,y:ash.y}),q=step0=>t.Quest.as(P.quests[0]);
   ok(q().type==='visit'&&q().to.name==='the old well'&&q().title==='Go to the old well','a visit: to a spot, by its own name');there(q());ok(th.at==='bring','there: arrived');
   const d=q(),g0=P.gold;ok(d.type==='deliver'&&!d.ready()&&d.progress()==='0 / 5 grain'&&/Bring 5 grain to Ashford/.test(d.title),'a delivery: '+d.title+' ('+d.progress()+')');
   there(d);t.enterTown(ash);G.town=null;Kit.world();ok(P.quests.includes(d)&&th.at==='bring','there without the goods: not yet');
   t.invAdd('good','grain',6);ok(d.ready(),'carrying them: ready');P.x=ash.x;P.y=ash.y;frame();ok(!P.quests.length&&t.goodN('grain')===1&&P.gold===g0+7&&ends(th).join()==='arrived','there with them: handed over, its prize, the thread on')}
 }finally{t.worldOff('thread:ended',ear);t.worldOff('encounter:ended',ear2);WD.ander.p=p0;P.quests=[];Kit.world()}
});
