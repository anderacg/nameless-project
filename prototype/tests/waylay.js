'use strict';
// Waylay (world/waylay.js): bands and lords lie in wait in the trees by a road; unspotted, they spring on you (caught off guard)
// or on a party passing; only who has them in sight may notice them (the owner, 2026-10-29: a chance a second while in sight,
// by Scouting; each party by its kind's sight and rate): noticed, they are shown and spring on no one you lead.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,X=t.WAYLAY,Y=t.Waylay;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;P.troops={hum_foot:4};
 W.lords=[];W.patrols=[];W.monsters=[];W.caravans=[];t.bandits.length=0;G.clock=t.DAY*.2;
 // (a forest tile beside a road, in the open world)
 let at=null;for(let i=0;i<t.WM.kind.length&&!at;i++){if(t.WM.kind[i]!==t.T_FOREST)continue;const x=(i%t.MW+.5)*t.TILE,y=(Math.floor(i/t.MW)+.5)*t.TILE;if(t.roadNear(x,y,X.road)&&!t.roadNear(x,y,0))at={x,y}}
 if(!at){ok(false,'a forest tile by a road exists');return}
 const rnd=Math.random,sk=P.skill,scout=n=>{P.skill=k=>k==='scout'?n:sk.call(P,k)},band=()=>{const b=t.asParty({kind:'bandits',troops:Array(8).fill('militia'),x:at.x+20,y:at.y,cool:0,t:999,idle:true});t.bandits.length=0;t.bandits.push(b);return b};
 const wait=b=>{window.Math.random=()=>0;try{return Y.consider(b,1)}finally{window.Math.random=rnd}},settle=b=>{for(let i=0;i<200&&Math.hypot(b.x-b.waylay.x,b.y-b.waylay.y)>2;i++)Y.step(b,1)};
 try{
  Kit.goTo(at.x+400,at.y);let b=band();ok(wait(b)&&b.waylay&&t.terrAt(b.waylay.x,b.waylay.y)===t.T_FOREST&&t.roadNear(b.waylay.x,b.waylay.y,X.road),'a band takes to a forest tile beside a road');
  settle(b);ok(Math.hypot(b.x-b.waylay.x,b.y-b.waylay.y)<=2&&!t.spotted(b,1e4),'it walks there and, unspotted, is not shown on the map');
  // (unspotted, you walk into it: it springs, and you are caught off guard)
  scout(0);G.encCool=0;G.modal=false;const reach=Math.min(X.spring,t.worldBattleReach(b)),S0=Y.sources()[0];
  P.x=b.x+S0.r+4;P.y=b.y;window.Math.random=()=>0;try{Y.sight(100)}finally{window.Math.random=rnd}ok(!b.waylay.seen,'out of your sight into the trees ('+Math.round(S0.r)+' px: your sight '+Math.round(t.vis())+' × '+X.spot.trees+'), never noticed, however long');
  P.x=b.x+reach-2;window.Math.random=()=>.99;try{Y.sight(.5)}finally{window.Math.random=rnd}ok(!b.waylay.seen,'in sight, it may still go unnoticed (a chance of '+Math.round((1-Math.exp(-S0.k))*100)+'% a second without Scouting)');
  {scout(5);const S5=Y.sources()[0];scout(0);ok(S5.r>S0.r&&S5.k>S0.k&&S0.r>reach,'Scouting sees farther into the trees ('+Math.round(S5.r)+' px) and notices sooner ('+Math.round((1-Math.exp(-S5.k))*100)+'% a second)');
   info('walking at it from your sight\'s edge till it springs ('+Math.round(reach)+' px), at '+Math.round((t.MAP_BASE*t.travelMul()))+' px/s: noticed '+[[0,S0],[5,S5]].map(([n,S])=>Math.round((1-Math.exp(-S.k*Math.max(0,S.r-reach)/(t.MAP_BASE*t.travelMul())))*100)+'% with Scouting '+n).join(', '))}
  ok(Y.step(b,1)==='met'&&G.enc?.ref===b&&G.enc.btype?.kind==='ambush'&&G.enc.btype.hid===1&&!b.waylay,'alongside it ('+Math.round(reach)+' px) it bursts from the trees: an ambush you are caught in');
  {t.act('fight');const B=t.B,foes=B?.units.filter(u=>u.team!==0&&u.hp>0)||[];t.updateBattle(.05);const inWood=foes.filter(u=>t.terrAt(B.world.world(u).x,B.world.world(u).y)===t.T_FOREST).length,hid=foes.filter(u=>!t.seenBy(0,u)).length;
   info('ambushers: '+foes.length+', in the trees '+inWood+', unseen '+hid);ok(B?.world&&B.surprise&&!B.surprise.hard&&inWood>=foes.length/2,'the battle opens with them in the trees beside you, your army caught off guard');B.over=true;B.win=true;B.endT=0;t.updateBattle(.01);t.act('cont')}
  t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.encCool=0;
  // (spotted first: shown, and it springs on no one you lead)
  b=band();wait(b);settle(b);scout(5);P.x=b.x+Y.sources()[0].r-4;P.y=b.y;window.Math.random=()=>0;try{Y.sight(1/30)}finally{window.Math.random=rnd};ok(b.waylay.seen&&t.spotted(b,1e4)&&/Lying in wait/.test(t.travelDetectionText(b)),'noticed in sight: it is shown, lying in wait');
  P.x=b.x+10;ok(Y.step(b,1)!=='met'&&!G.enc,'spotted, it does not spring on you');
  G.chase=b;ok(Y.step(b,1)===false&&!b.waylay,'riding at it ends the wait (and you meet it as ever)');G.chase=null;
  // (a party passing: in its own sight it may notice them, else it is waylaid: a fight with the ambusher the stronger)
  P.x=at.x+600;b=band();wait(b);settle(b);const cv=Object.assign(new t.CaravanParty(),{from:t.TOWNS[0].name,to:t.TOWNS[0].name,fac:'vale',x:b.x+X.see.caravan*X.spot.trees+3,y:b.y,goods:{grain:1},gold:0,guards:2,tc:{militia:2},cool:0});W.caravans=[cv];
  const step=(r,d=1)=>{window.Math.random=()=>r;try{return Y.step(b,1,d)}finally{window.Math.random=rnd}};
  step(0,100);ok(b.waylay&&!b.waylay.met.length&&!cv.fight,'a caravan beyond its own sight into the trees ('+Math.round(X.see.caravan*X.spot.trees)+' px) never notices them');
  cv.x=b.x+X.meet+3;step(.99);ok(b.waylay&&!b.waylay.met.length&&!cv.fight,'in its sight, not yet noticed, short of meet: nothing yet');
  step(.01);ok(b.waylay&&!cv.fight&&b.waylay.met.includes(t.uidOf(cv)),'it notices them and passes by');
  ok(X.sees.patrol>X.sees.caravan&&X.see.patrol>X.see.caravan,'a patrol sees farther and sooner than a caravan (each kind its own)');
  b.waylay.met=[];cv.x=b.x+10;step(.99);const f=t.fightOf(cv);ok(f&&f.amb&&f.amb.side===0&&!b.waylay&&t.sideParties(f,0).includes(b),'one that does not is waylaid: a fight, the band the ambusher');
  W.fights=[];cv.fight=null;b.fight=null;
  // (the wait ends by night or when its hours are up)
  b=band();wait(b);G.clock=t.DAY*.6;ok(Y.step(b,1)===false&&!b.waylay,'night ends the wait');ok(!wait(b),'nor does a band take to the trees by night');G.clock=t.DAY*.2;
  b=band();wait(b);b.waylay.until=t.Clock.hours()-1;ok(Y.step(b,1)===false&&!b.waylay,'its hours up, it goes on its way');
  // (lords rarely, bands often; never more than share of the bands at once)
  ok(X.lord<X.band,'lords take to the trees less often than bands');
  t.bandits.length=0;const many=Array.from({length:8},()=>t.asParty({kind:'bandits',troops:['militia'],x:at.x+20,y:at.y,cool:0}));t.bandits.push(...many);many.forEach(wait);ok(many.filter(o=>o.waylay).length===Math.max(1,8*X.share),'at most '+X.share*100+'% of the bands lie in wait at once');
 }finally{window.Math.random=rnd;P.skill=sk;G.chase=null;t.bandits.length=0;W.caravans=[];W.fights=[]}
 ok(!ERR.length,'no runtime errors');
});
