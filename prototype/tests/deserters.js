'use strict';
// Successful recruitment consumes the map encounter, including deserters already moving away; blocked/declined hires do not.
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P,W=t.W;
 window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world({town:null});t.GUIDE.on=false;
 const home=Kit.goHome('Ashford'),world=()=>Kit.world({town:null,road:null,chase:null,encCool:0});
 const spawn=beh=>{world();W.road=null;P.x=home.x+30;P.y=home.y+30;P.tx=null;P.stay=null;P.fac=null;P.gold=100;P.troops={hum_levy:2};
  const e=t.roadSpawn('deserters',P.x+10,P.y);e.beh=beh;e.seen=1;return e};
 for(const beh of ['stay','leave','flee']){
  const e=spawn(beh),before=t.troopCount(),gold=P.gold,ents=[];e.draw(ents,G.cam,t.vis());
  ok(e.inView(t.vis())&&ents.length>0,'before hiring: '+beh+' deserters have visible map figures');
  t.roadMeet(e);t.act('enc-do','0');
  ok(t.troopCount()===before+2&&P.troops[e.unit]>=2&&P.gold===gold-15,'hiring '+beh+' deserters adds exactly two soldiers for 15 gold');
  ok(e.done&&e.gone&&e.fin==='done'&&!e.inView(t.vis())&&!e.chaseable()&&!e.marker()&&!e.mapDot(t.vis()),'hired '+beh+' deserters immediately disappear and cannot be met again');
  const drawn=[];e.draw(drawn,G.cam,t.vis());ok(!drawn.length&&!t.roadSave().road.on.some(r=>r.i===e.i),'hired '+beh+' deserters contribute no sprites or saved encounter');
  t.act('enc-do','0');ok(t.troopCount()===before+2&&P.gold===gold-15,'repeating the completed hire cannot charge or recruit twice');
  t.act('enc-leave');t.updateRoad(.05);ok(!t.roadList().includes(e),'closing the result prunes the hired '+beh+' encounter from the road');
 }
 const declined=spawn('stay'),n0=t.troopCount();t.roadMeet(declined);t.act('enc-leave');
 ok(!declined.gone&&declined.here()&&t.troopCount()===n0&&P.gold===100,'declining leaves the existing encounter and army unchanged');
 const poor=spawn('leave');P.gold=14;t.roadMeet(poor);t.act('enc-do','0');
 ok(!poor.done&&!poor.gone&&t.troopCount()===2&&P.gold===14,'an unaffordable hire neither removes the walking deserters nor adds soldiers');
 const full=spawn('stay');P.troops={hum_levy:t.partyCap()};const count=t.troopCount();t.roadMeet(full);t.act('enc-do','0');
 ok(!full.done&&!full.gone&&t.troopCount()===count&&P.gold===100,'an army with no room does not consume the encounter or charge gold');
 const hired=spawn('leave');t.roadMeet(hired);t.act('enc-do','0');t.act('enc-leave');const units=t.troopCount();
 t.saveGame(true,'quick');t.loadGame('quick');
 ok(t.troopCount()===units&&!t.roadList().some(e=>e.k==='deserters'),'saving and loading preserve the recruits without resurrecting their map figures');
});
