'use strict';
// Places you must earn (doc/START_AND_GATES_DESIGN.md §2; the owner, 2026-11-05: soft locks, "all depends on situations"; lords too):
// a town, city or castle refuses you until your renown or your honour with its realm is enough (GATES), unless it is yours, your
// service's, your home, or a quest takes you there; refused, its gate page (the way in, the market outside its walls alone, Leave
// and Esc); a hamlet's and a village's open; a holding sealed by a quest shut to all (saved); a great lord (LORD_AUDIENCE) heard only
// with renown, honour, his regard, his service or his work, else his steward's word; the map marks a refused holding with a lock.
// Off (the harness's default), all as before.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,X=t.GATES,LA=t.LORD_AUDIENCE,on=[X.on,LA.on];
 const text=()=>(document.getElementById('panel')||{}).textContent||'';
 try{
  Kit.begin('soldier',1);Kit.world();X.on=true;LA.on=true;P.fac=null;P.renown=0;P.quests=[];P.home=null;
  const of=k=>t.TOWNS.find(h=>h.kind===k&&h.owner&&h.owner!=='player'&&!t.hostileTo(h.owner)),city=of('city'),town=of('town'),castle=of('castle'),village=of('village');
  const near=h=>{Kit.world();Kit.goTo(h.x,h.y+40);G.lastTown=null};
  for(const f of t.FIDS)t.addHonor(f,-t.honorWith(f),true);
  // ---- a city: refused at first; its gate, the way in, the market outside alone
  {near(city);t.approachHolding(city);const g=t.Gates.admits(city);
   ok(G.mode==='gate'&&G.gate===city&&/The gate of/.test(text())&&/renown 30/.test(text())&&/honour 25/.test(text())&&!g.ok,'a city refuses you at first: its gate page, the way in told ('+g.need.join('; ')+')');
   t.act('gt-market');const rail=t.townPlaces(city);ok(G.mode==='town'&&G.town.outside&&rail.length===1&&rail[0]==='trade'&&t.townPlace(city,'tavern')==null&&/Outside the walls/.test(t.townOverview(city)),'the market outside its walls: its window with the market alone ('+rail.join(',')+')');
   t.act('leave');Kit.world();near(city);t.approachHolding(city);Kit.key('Escape','Escape');ok(G.mode==='world'&&!G.gate,'Esc follows the bottom bar: Leave')}
  // ---- the ways in: renown, honour, your service, home, a quest
  {P.renown=30;ok(t.Gates.admits(city).ok,'renown 30: the city opens');P.renown=9;ok(!t.Gates.admits(town).ok,'renown 9: a town refuses you');P.renown=10;ok(t.Gates.admits(town).ok,'renown 10: it opens');P.renown=0;
   t.addHonor(city.owner,25,true);ok(t.Gates.admits(city).ok,'or honour 25 with its realm');t.addHonor(city.owner,-t.honorWith(city.owner),true);
   if(castle){P.renown=99;ok(!t.Gates.admits(castle).ok,'a castle: renown is not leave');t.addHonor(castle.owner,20,true);ok(t.Gates.admits(castle).ok,'honour 20 with its realm: the lord’s leave');t.addHonor(castle.owner,-t.honorWith(castle.owner),true);P.renown=0}
   P.fac=city.owner;ok(t.Gates.admits(city).ok,'in its realm’s service: open');P.fac=null;
   P.home=city.name;ok(t.Gates.admits(city).ok,'your home: open');P.home=null;
   P.quests=[{home:city.name,kind:'test'}];ok(t.Gates.admits(city).ok,'a quest that takes you there: open');P.quests=[];
   ok(t.Gates.admits(village).ok&&t.TOWNS.filter(h=>h.kind==='hamlet').every(h=>t.Gates.admits(h).ok),'a village and every hamlet: open')}
  // ---- in, it is the holding as before
  {P.renown=30;near(city);t.approachHolding(city);ok(G.mode==='town'&&G.town.ref===city&&!G.town.outside&&t.townPlaces(city).length>1,'admitted: the holding’s window, every place ('+t.townPlaces(city).length+')');t.act('leave');P.renown=0}
  // ---- sealed by a quest: shut to all, no market; saved
  {t.Gates.seal(village,'Fever: the reeve lets no one in or out.','test');P.renown=99;near(village);t.approachHolding(village);
   ok(G.mode==='gate'&&/Fever/.test(text())&&!document.querySelector('[data-act="gt-market"]'),'sealed by a quest: shut whatever you are, no market ('+text().slice(0,80)+')');t.act('gt-leave');
   t.saveGame(true);W.sealed={};t.loadGame();ok(W.sealed[village.name]&&!t.Gates.admits(village).ok,'saved and loaded: still sealed');
   t.Gates.seal(village,null);ok(t.Gates.admits(village).ok,'the quest opens it again');P.renown=0}
  // ---- a great lord's audience
  {const l=W.lords.find(o=>!o.dead&&!t.hostileTo(o.fac)),r0=l.renown;l.renown=40;P.renown=0;P.fac=null;Kit.world();t.lordMeet(l);
   ok(G.enc&&G.enc.kind==='steward'&&/steward/.test(text())&&/renown 20/.test(text()),'a great lord (renown 40) will not see you yet: his steward’s word, and what you need');t.act('gt-steward');ok(G.mode==='world'&&!G.enc,'Leave');
   P.renown=20;Kit.world();t.lordMeet(l);ok(G.enc&&G.enc.kind==='lord','renown 20 (half his): he hears you');Kit.world();P.renown=0;
   l.renown=10;t.lordMeet(l);ok(G.enc&&G.enc.kind==='lord','a lesser lord: always');Kit.world();l.renown=r0}
  // ---- the map's lock
  {Kit.goTo(city.x,city.y+60);let err=null;try{t.drawWorld()}catch(e){err=e}ok(!err&&!t.Gates.admits(city).ok,'the map draws a refused holding’s lock')}
  // ---- off: as before
  {X.on=false;LA.on=false;near(city);t.approachHolding(city);ok(G.mode==='town','off: every gate as before');t.act('leave')}
 }finally{X.on=on[0];LA.on=on[1]}
});
