'use strict';
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,S=t.survivalGuide;
 Kit.begin('soldier',67);Kit.clear();Kit.world();
 const reach=t.Router.reach,cs=t.Carcass.list,herds=t.W.critters;
 const clearGoods=()=>{for(const g of [...t.FOODS,'water','ale','liquor','skin_empty'])t.goodTake(g,1e6)};
 try{
  ok(S.enabled&&!S.save(),'survival prompts default on without adding untouched save data');
  // Search uses individual positions, excluding livestock, dead members and unreachable animals.
  const herd=(id,n,x)=>Object.assign(new t.Herd(),{id,n,x,y:P.y,hx:x,hy:P.y,coat:1});
  const a=herd('deer',2,P.x+80),b=herd('rabbit',1,P.x+40),cow=herd('cow',1,P.x+1);
  t.HERD_FLOCK.set(a,{m:[{x:P.x+80,y:P.y},{x:P.x+10,y:P.y}]});t.W.critters=[a,b,cow];t.Router.reach=()=>true;
  let goal=S.huntGoal();ok(goal?.x===P.x+10,'nearest individual is chosen even when its herd centre is farther away');
  t.HERD_FLOCK.get(a).m[1].dead=true;goal=S.huntGoal();ok(goal?.name==='rabbit','dead members and closer livestock are ignored');
  t.Router.reach=(from,to)=>to.x!==b.x;goal=S.huntGoal();ok(goal?.x===a.x,'an unreachable nearer animal is skipped');a.n=b.n=0;
  ok(!S.huntGoal(),'no false wildlife marker when no huntable animal remains');t.Router.reach=reach;t.W.critters=herds;
  // Real water selection and routing. All water targets must be on reachable dry ground or a well.
  clearGoods();t.playerInventory.add('good','skin_empty',3);let start=performance.now();goal=S.waterGoal();
  info('water search '+(performance.now()-start).toFixed(1)+' ms');
  ok(!!goal&&t.passable(t.terrAt(goal.x,goal.y))&&t.Router.reach(P,goal),'water guidance chooses reachable land, never a point in a lake');
  ok(t.wellNear(goal.x,goal.y)||t.waterEdge(goal.x,goal.y,t.fillReach()),'water marker is within the actual filling reach of a source');
  clearGoods();goal=S.waterGoal();ok(!!goal&&goal.name.endsWith('well'),'without empty skins, guidance points to an accessible settlement well and market');
  S.huntGoal=()=>({x:P.x+80,y:P.y,name:'deer',r:3});S.waterGoal=()=>({x:P.x,y:P.y,name:'Nearby well'});
  clearGoods();t.playerInventory.add('good','water',200);t.playerInventory.add('good','grain',200);G.quietEvents=false;
  S.frame(4);ok(!S.offer&&!P.quests.some(q=>q instanceof t.SurvivalQuest),'well supplied companies receive no survival tasks');
  for(const g of t.FOODS)t.goodTake(g,1e6);const x=P.x,y=P.y;S.frame(4);t.questTrackHUD();
  ok(S.offer?.need==='food'&&G.mode==='world'&&P.x===x&&P.y===y&&!P.quests.some(q=>q.type==='survivalfood'),'low food shows an optional offer without moving the player or accepting a quest');
  ok(document.querySelector('#qtrack [data-act="surv-accept"]')&&document.querySelector('#qtrack [data-act="surv-dismiss"]'),'popup exposes Track and Not now controls in the HUD');
  t.act('surv-dismiss');S.frame(4);ok(!S.offer&&!S.active('food'),'dismissing neither starts the quest nor repeats the prompt');
  S.cool.food=0;S.frame(4);ok(!S.offer,'the same low-supply episode does not nag again even after its cooldown');
  const saved=S.save();S.reset();t.Saves.loadOf('survivalGuide',saved);S.frame(4);ok(!S.offer,'dismissal cooldown survives save/load');
  S.reset();S.frame(4);t.act('surv-accept','food');let q=S.active('food');
  ok(q instanceof t.SurvivalQuest&&q.cat==='side'&&P.track==='q'+q.id,'accepting creates and tracks a saved side quest');
  ok(q.goal().x===P.x+80&&t.QuestTrack.goal(P.track).name==='deer','accepted hunt uses the existing map-marker and direction system');
  ok(q.goal().r===3,'hidden wildlife retains its search-area marker through the quest model');
  S.huntGoal=()=>({x:P.x+120,y:P.y,name:'rabbit'});S.frame(4);ok(q.goal().x===P.x+120,'moving or missing wildlife retargets the quest');
  const clone=JSON.parse(JSON.stringify(q));P.quests=P.quests.map(row=>row===q?clone:row);q=t.Quest.as(clone);ok(q instanceof t.SurvivalQuest&&q.abandonable,'accepted quest retains its behavior after serialization');
  // Actual carcass collection emits hunted meat, not merely a kill or opening the loot screen.
  const body=Object.assign(new t.Carcass(),{wild:'deer',x:P.x,y:P.y,day:G.day+t.Clock.frac,items:[{k:'good',id:'meat',n:3}]});t.Carcass.list=[body];
  S.frame(4);ok(q.goal()?.collect&&q.todo().includes('carcass'),'after a kill the marker guides collection of nearby fresh meat');
  body.meet();ok(!q.hunted,'opening a carcass does not claim hunted meat');t.act('lt-all');t.Carcass.done();
  ok(q.hunted===3&&t.goodN('meat')===3,'only meat actually taken from a wildlife carcass counts');const gold=P.gold,xp=P.xp;
  S.frame(4);ok(!S.active('food')&&!t.QuestTrack.list().includes('q'+q.id)&&P.gold===gold&&P.xp===xp,'collecting hunted meat completes without turn-in, XP farming or a summary window');
  ok(t.QuestArchive.list().some(e=>e.k==='q'+q.id&&e.state==='done'),'completed survival tasks use the quest archive');
  let repeated=0;const notice=d=>{repeated+=d.n};t.worldOn('meat:hunted',notice);
  try{body.items=[{k:'good',id:'meat',n:3}];body.meet();t.act('lt-all');t.Carcass.done();ok(!repeated,'putting meat back on an already harvested carcass cannot count as another hunt')}finally{t.worldOff('meat:hunted',notice)}
  clearGoods();t.playerInventory.add('good','grain',200);S.reset();S.frame(4);ok(S.offer?.need==='water','low drink offers a separate water task');
  S.accept('water');q=S.active('water');S.frame(4);ok(!!q&&q.todo().includes('empty waterskins'),'reaching a marker without water or containers does not complete the task');
  t.playerInventory.add('good','skin_empty',3);t.fillNow(true);S.frame(4);ok(!S.active('water')&&t.goodN('water')>0,'actually refilling waterskins completes the water task');
  clearGoods();t.playerInventory.add('good','water',200);S.reset();S.frame(4);S.accept('food');q=S.active('food');
  const before=[P.gold,P.renown,P.morale];q.abandon();ok(!S.active('food')&&before.join()===[P.gold,P.renown,P.morale].join(),'optional tasks can be abandoned without a penalty');
  ok(t.QuestArchive.list().find(e=>e.k==='q'+q.id)?.state==='abandoned','giving up an optional task is archived as abandoned');
  S.reset({enabled:false});S.frame(4);ok(!S.offer,'survival tips can be disabled');
 }finally{delete S.huntGoal;delete S.waterGoal;t.Router.reach=reach;t.Carcass.list=cs;t.W.critters=herds;S.reset();Kit.done()}
});
