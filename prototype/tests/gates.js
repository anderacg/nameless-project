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
  // ---- G2: the ways past a gate
  {const odds0=t.Gates.odds,c0=t.GATE_WAYS.bribe.caught;P.passes={};P.gateBan={};P.renown=0;
   try{
    // (a letter of introduction: a reeve's work done, to the nearest town or city that would refuse you)
    const v=t.TOWNS.find(h=>h.kind==='village'&&h.owner),q={who:v.name+':reeve',get person(){return t.Givers.byKey(this.who)}};t.Gates.reward(q);
    const got=Object.keys(P.passes),to=t.townBy(got[0]);
    ok(got.length===1&&P.passes[got[0]].kind==='letter'&&['town','city'].includes(to.kind)&&t.Gates.admits(to).ok,'a reeve\u2019s work done: a letter of introduction to '+(to&&to.name)+', whose gate now opens to you');
    P.passes={};t.Gates.reward({who:v.name+':captain'});ok(!Object.keys(P.passes).length,'a captain\u2019s work: no letter');
    // (a writ)
    P.gold=500;near(city);t.approachHolding(city);ok(/Buy a writ/.test(text()),'its gate offers a writ for gold');const g0=P.gold;t.act('gt-writ');
    ok(G.mode==='town'&&G.town.ref===city&&!G.town.outside&&P.gold===g0-t.GATE_WAYS.writ.city&&t.Gates.admits(city).ok,'bought: '+t.GATE_WAYS.writ.city+' gold, and the city is open to you from now on');t.act('leave');P.passes={};
    // (a bribe: paid and let in for the day; refused; caught and marked)
    t.Gates.odds=()=>1;near(city);t.approachHolding(city);t.act('gt-bribe');ok(G.mode==='town'&&G.town.ref===city&&P.passes[city.name].until===G.day,'a bribe that works: in, for the day');t.act('leave');P.passes={};
    t.Gates.odds=()=>0;t.GATE_WAYS.bribe.caught=1;const h0=t.honorWith(city.owner);near(city);t.approachHolding(city);t.act('gt-bribe');
    ok(G.mode==='gate'&&/briber/.test(text())&&t.honorWith(city.owner)===h0-t.GATE_WAYS.bribe.honor&&t.Gates.barred(city)&&document.querySelector('[data-act="gt-bribe"]').disabled,'caught bribing: honour lost, marked, the ways barred for some days');
    t.act('gt-leave');P.gateBan={};t.GATE_WAYS.bribe.caught=c0;
    // (slipping in by night)
    G.clock=t.DAY*.3;near(city);t.approachHolding(city);ok(document.querySelector('[data-act="gt-slip"]').disabled,'by day you cannot slip in');t.act('gt-leave');
    G.clock=t.DAY*.8;t.Gates.odds=()=>1;near(city);t.approachHolding(city);t.act('gt-slip');ok(G.mode==='town'&&G.town.ref===city,'by night: you slip in');t.act('leave');P.passes={};
    t.Gates.odds=()=>0;const gd=P.gold;near(city);t.approachHolding(city);t.act('gt-slip');ok(G.mode==='gate'&&/fine/.test(text())&&P.gold<gd&&t.Gates.barred(city),'caught at the wall: a fine of half your gold, marked');t.act('gt-leave');
    // (saved)
    P.passes={[town.name]:{kind:'writ',day:G.day}};t.saveGame(true);P.passes={};t.loadGame();ok(P.passes[town.name]&&P.passes[town.name].kind==='writ'&&t.Gates.barred(city),'saved and loaded: your passes, and the gates that know your face');
   }finally{t.Gates.odds=odds0;t.GATE_WAYS.bribe.caught=c0;P.passes={};P.gateBan={};G.clock=t.DAY*.3}}
  // ---- the map's lock
  {Kit.goTo(city.x,city.y+60);let err=null;try{t.drawWorld()}catch(e){err=e}ok(!err&&!t.Gates.admits(city).ok,'the map draws a refused holding’s lock')}
  // ---- the padlock over a gate that will not have you (the owner, 2026-11-08: "make the lock city icon animated and more cool, it should
  // floating around castle"; gfx/structures.js gateLock): gold, floating over the holding's top, never still
  {const c=t.ctx,p0=performance.now,shot=at=>{performance.now=()=>at;try{c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,80,80);t.gateLock({x:40,seed:7},{x:0,y:0},50);const d=c.getImageData(0,0,80,80).data;c.restore();
     let gold=0,top=99,sx=0;for(let i=0;i<d.length;i+=4)if(d[i]>200&&d[i+1]>150&&d[i+2]<120&&d[i+3]>200){gold++;const y=(i/4/80)|0;top=Math.min(top,y);sx+=(i/4)%80}return{gold,top,x:gold?sx/gold:0}}finally{performance.now=p0}};
   const a=shot(1000),b=shot(2050);ok(a.gold>10&&a.top<50&&(Math.abs(a.x-b.x)>=1||a.top!==b.top),'a gold padlock floats over the holding\'s top ('+a.gold+' gold px, its top at '+a.top+' over 50), and drifts (x '+a.x.toFixed(1)+' → '+b.x.toFixed(1)+', top '+a.top+' → '+b.top+')')}
  // ---- off: as before
  {X.on=false;LA.on=false;near(city);t.approachHolding(city);ok(G.mode==='town','off: every gate as before');t.act('leave')}
 }finally{X.on=on[0];LA.on=on[1]}
});
