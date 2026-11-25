'use strict';
// Dealing with the outlaws at their hideout (the owner, 2026-11-25: a hideout "just like a mini holding for bandit factions"; world/lairdeal.js
// LAIR_DEAL, LairDeal, LairSpots): paid their toll at its parley, you are let in for a while, none of them comes for you, and over its
// places badges for its services: a fence at its stash (less than a market, no questions), its raiders for hire at its pen (a few a
// visit, brigands' shame once), its cage (your prisoners sold, yours held there bought free). A lair, a camp, the goblins deal with no one.
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,SL=t.SiteLife,D=t.LairDeal,X=t.LAIR_DEAL;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);G.paused=true;
 const H=t.W.sites.filter(s=>s instanceof t.Hideout&&!(s instanceof t.GoblinCamp)&&!s.within),h=H.find(s=>!s.tunnel&&D.keys(s).length===3),lair=H.find(s=>s.tunnel),camp=t.W.sites.find(s=>s instanceof t.BanditCamp),gob=t.W.sites.find(s=>s instanceof t.GoblinCamp);
 ok(!!h,'a hideout in the open with its stash, pen and cage ('+(h&&D.keys(h).join(', '))+')');
 ok((!lair||!D.can(lair))&&!D.can(camp)&&(!gob||!D.can(gob)),'a lair, a bandit camp and the goblins deal with no one');
 const gold0=P.gold,inv0=P.inv.slice(),pr0={...P.prisoners},hon0={};t.FIDS.forEach(f=>hon0[f]=t.honorWith(f));
 try{P.gold=2000;h.seen=true;SL.ensure(h);
  // (its parley offers it, for its toll; paid, you are in, and none of them comes for you)
  const par=h.page(null,'parley'),deal=par.acts.find(a=>a&&a.act==='site-deal');
  ok(deal&&deal.facts[0]===D.toll(h)+'g'&&!deal.why,'its parley: Come to deal, for '+D.toll(h)+' gold ('+X.toll.base+' and '+X.toll.per+' a head)');
  ok(SL.hostile(h)&&!D.open(h),'before: hostile, not in');
  const g0=P.gold,m=D.pay(h);ok(m&&P.gold===g0-D.toll(h)&&D.open(h)&&!SL.hostile(h),'paid: in for '+X.hours+' hours, none of them hostile ('+m+')');
  const home=h.page(null,null);ok(['fence','hire','ransom'].every(k=>home.acts.some(a=>a.arg===k))&&home.acts.some(a=>a.act==='site-ask'),'its page: its fence, its men, its cage, and Attack');
  // (its badges over its places, near it)
  P.x=h.x;P.y=h.y+30;const L=t.LairSpots.list(h);ok(t.LairSpots.shown(h)&&L.length===3&&L.every(o=>o.here()&&t.worldObjects().includes(o)),'its three badges, near it, on the map to click');
  ok(L.every(o=>{const q=D.at(h,o.k);return q&&q.k===X.places[o.k]}),'each over its place: '+L.map(o=>o.k+' at its '+X.places[o.k]).join(', '));
  // (the fence: less than a market, no questions)
  P.inv.fill(null);t.invAdd('gear',t.randomGear(0,2),1);const w=D.wares(h)[0],mk=w&&w.K.fetches(w.x,t.Spatial.nearestHolding(h.x,h.y));
  const g1=P.gold;const fm=D.fence(h,w.i);ok(w&&P.gold===g1+w.g&&w.g<mk&&!P.inv[w.i]&&/no questions/.test(fm),'its fence: '+w.g+' gold for what a market pays '+mk+' for');
  // (its men for hire: a few a visit, its keep stays; brigands' shame once a visit)
  const men=D.men(h),n0=SL.fighters(h).length,f=t.FIDS[0],ho=t.honorWith(f),mo=P.morale;P.troops={};
  ok(men.length>0&&men.length<=X.hire.most&&n0-men.length>=X.hire.keep&&men.every(p=>p.type!=='chief'),'its men for hire: '+men.length+' of its '+n0+' (at most '+X.hire.most+', '+X.hire.keep+' stay)');
  const p1=men[0],g2=P.gold,c1=D.hire(h,p1.id);ok(c1&&P.gold===g2-D.price(p1.type)&&(P.troops[p1.type]|0)>=1&&p1.hp<=0&&SL.fighters(h).length===n0-1,'hired: '+t.ST[p1.type].n+' for '+D.price(p1.type)+' gold, gone from its men');
  ok(t.honorWith(f)<ho&&P.morale<=mo,'brigands in your band: every realm thinks less of you, your soldiers grumble');
  const ho2=t.honorWith(f);if(D.men(h).length){D.hire(h,D.men(h)[0].id);ok(t.honorWith(f)===ho2,'once a visit, not for each man')}
  for(let k=0;k<9&&D.men(h).length;k++){const q=D.men(h)[0];if(!D.hire(h,q.id)){info('cannot hire: '+D.hireWhy(h,q));break}}const hd=h.dealHired;h.dealHired=X.hire.most;ok(hd<=X.hire.most&&!D.men(h).length,'no more than '+X.hire.most+' a visit ('+hd+' hired here)');
  // (its cage: your prisoners sold; yours held there bought free)
  const ty=p1.type;P.prisoners={[ty]:3};const g3=P.gold,ho3=t.honorWith(f),sm=D.sell(h,ty);ok(sm&&P.gold===g3+3*D.ransomOf(ty)&&!P.prisoners[ty]&&t.honorWith(f)<ho3,'your prisoners sold into their cage: '+3*D.ransomOf(ty)+' gold, honor lower');
  const cid=Object.keys(t.COMPS)[0],key=D.key(h);t.Prisons.put(key,{k:'comp',id:cid,keep:'band',since:G.day});
  ok(D.held(h).length===1&&/held here/.test(h.page(null,null).body),'one of yours held in their cage, told on its page');
  const g4=P.gold;D.free(h,0);ok(!D.held(h).length&&P.gold===g4-X.ransom.comp,'bought free for '+X.ransom.comp+' gold');
  // (the services by their acts, as the page's buttons send them)
  t.invAdd('gear',t.randomGear(0,2),1);const w2=D.wares(h)[0];let said='';ok(h.act('site-fence',String(w2.i),m=>said=m)&&said,'its page\'s Sell: '+said);
  // (its time out, or attacking them: no more dealing)
  const se=window.startEncounter;try{window.startEncounter=()=>{};h.fight(true);ok(!D.open(h)&&SL.hostile(h)&&!t.LairSpots.shown(h),'attacking them ends it: hostile again, the badges gone')}finally{window.startEncounter=se;G.enc=null;G.mode='world'}
  D.pay(h);G.clock+=t.DAY*X.hours/24+1;if(G.clock>=t.DAY){G.day++;G.clock-=t.DAY}ok(!D.open(h)&&SL.hostile(h),'its hours out: hostile again')}
 finally{P.gold=gold0;P.inv.splice(0,P.inv.length,...inv0);P.prisoners=pr0;if(h){h.deal=null}}
 ok(!ERR.length,'no runtime errors')});
