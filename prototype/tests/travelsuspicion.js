'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();P.troops={};G.paused=false;G.speed=1;G.modal=false;G.hurry=false;P.stay=null;
 const home=t.TOWNS[0];Kit.goTo(home.x+160,home.y+120);W.lords=[];W.patrols=[];W.monsters=[];W.caravans=[];W.refugees=[];W.critters=[];W.folk=[];t.bandits.length=0;
 const b=t.asParty({kind:'bandits',troops:['militia'],x:P.x+60,y:P.y,cool:0,t:999,idle:true});t.bandits.push(b);
 const i=Math.floor(P.y/t.TILE)*t.MW+Math.floor(P.x/t.TILE),tile=t.tiles[i],A=t.TravelAwareness,step=n=>A.step(n),level=()=>A.level(b),detect=()=>t.travelDetection(b);
 try{
  t.tiles[i]=t.T_OPEN;A.reset();step(.5);ok(level()===.25&&!detect().sees,'open ground builds suspicion over two seconds rather than detecting instantly');
  ok(t.travelDetectionText(b).includes('25%'),'tooltip reports actual suspicion progress');
  step(1.5);ok(detect().sees&&level()===1,'full suspicion confirms detection');
  b.x=P.x+150;step(1);ok(!detect().sees&&Math.abs(level()-2/3)<1e-8,'leaving sight ends detection while suspicion fades');
  step(2);ok(level()<1e-8,'three seconds out of sight clears suspicion');
  b.x=P.x+40;t.tiles[i]=t.T_FOREST;A.reset();step(2);ok(level()===.5&&!detect().sees,'forest takes four seconds at ordinary distance');
  step(2);ok(detect().sees,'forest observers can eventually detect you');
  t.tiles[i]=t.T_OPEN;b.x=P.x+60;A.reset();G.hurry=true;step(1);ok(level()===.75,'hurrying builds suspicion faster');G.hurry=false;
  A.reset();b.x=P.x+20;step(.5);ok(level()===.75,'close observers notice the army faster');
  A.reset();b.x=P.x+4;step(.01);ok(detect().sees,'physical contact cannot be exploited to stay undetected');
  b.x=P.x+60;A.reset();G.paused=true;step(10);ok(level()===0,'paused travel does not build suspicion');G.paused=false;
  G.modal=true;step(10);ok(level()===0,'menus freeze suspicion');G.modal=false;
  G.speed=2;step(.5);ok(level()===.5,'suspicion follows world speed');G.speed=1;
  const old=window.stanceMove,seen=[];G.encCool=999;
  try{window.stanceMove=(...args)=>{seen.push(args[5]);return true};A.reset();t.BRAINS.band.think(b,.01,false);step(2);t.BRAINS.band.think(b,.01,false);ok(seen[0]===0&&seen[1]===95,'band AI only reacts to the hero after suspicion fills')}finally{window.stanceMove=old}
  A.reset();G.chase=null;G.encCool=0;ok(!t.BRAINS.band.canMeet(b,1),'unaware AI cannot force an encounter through a large interaction ring');
  G.chase=b;ok(t.BRAINS.band.canMeet(b,1),'deliberately approaching still allows the player to interact');G.chase=null;
  step(1);const q=level();for(let k=0;k<5;k++)t.travelDetectionState();ok(level()===q,'drawing and reading the gauge never advance suspicion');
  ok(!JSON.stringify(b).includes('suspicion'),'suspicion is runtime state outside entity save records');
  P.stay={town:home.name};step(.1);P.stay=null;ok(level()===0,'taking shelter clears travel suspicion');
  const herd=t.asHerd({crit:true,id:'deer',n:2,x:P.x+40,y:P.y,hx:P.x+40,hy:P.y,t:99,a:0,idle:true,tire:0,cool:0});W.critters=[herd];A.reset();const walk=window.walk,steps=[];
  try{window.walk=(...args)=>{steps.push(args);return true};t.HERD_MIND.think(herd,.01,1);ok(!steps.length,'wildlife does not bolt before it notices the player');step(2);t.HERD_MIND.think(herd,.1,1);ok(steps.some(([o,dx])=>o===herd&&dx>0),'wildlife flees once suspicion completes')}finally{window.walk=walk}
  A.reset();A.notice(herd);ok(A.sees(herd),'a hunting shot can immediately alert the herd');
 }finally{t.tiles[i]=tile;G.speed=1;G.hurry=false;G.paused=false;G.modal=false;P.stay=null;G.chase=null;A.reset()}
});
