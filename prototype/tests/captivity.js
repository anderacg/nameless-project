'use strict';
// Captivity (world/captivity.js, doc/CAPTIVITY_DESIGN.md phase 1): beaten, you may get away or be taken; taken, you pay, persuade,
// serve, wait for your realm or refuse; freed near a holding, it costs by the way out; your scattered soldiers find you again.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,C=t.Captivity,X=t.CAPTIVITY;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 const rnd=Math.random,roll=v=>{window.Math.random=()=>v},panel=()=>document.getElementById('panel').innerHTML;
 const band=()=>{const b=t.asParty({kind:'bandits',troops:Array(6).fill('militia'),x:P.x+30,y:P.y,cool:0});t.bandits.push(b);return b};
 const setup=()=>{Kit.world();C.held=null;C.scattered=[];P.troops={hum_foot:8};P.gold=400;P.hp=t.vitals()[0];P.fac=null;P.gear.mount=null;const gid=Object.keys(t.ITEMS).find(k=>t.ITEMS[k].slot==='weapon');t.invAdd('gear',gid,1);t.invAdd('gear',gid,1);t.invAdd('gear',gid,1)};
 const lose=e=>{t.startEncounter(e);t.concludeEncounter(false,{},0,true,[],null,{})};
 const gearN=()=>P.inv.filter(s=>s&&s.k==='gear').reduce((n,s)=>n+(s.n||1),0);
 try{
  // ---- who takes you
  ok(t.Captivity.captor({kind:'monster',ref:{}})===null&&C.captor({kind:'party',ref:{kind:'bandits'}}).k==='band'&&C.captor({kind:'lord',ref:W.lords[0]}).k==='lord','beasts take no captives; a band and a lord do');
  // ---- left for dead by beasts: no gold taken, where you fell
  setup();{const m=t.asMonster({id:'wolf',n:2,lv:1,x:P.x+30,y:P.y,cool:0});W.monsters=[m];const x=P.x,g=P.gold;roll(.5);lose({kind:'monster',ref:m,lv:1,list:m.troops.slice(),allies:[],foes:[]});window.Math.random=rnd;
   ok(P.gold===g&&Math.hypot(P.x-x,P.y-0-P.y)<1&&P.hp<=Math.round(t.vitals()[0]*X.beast.hp)&&!C.held&&/Left for dead/.test(panel()),'beaten by beasts: left for dead where you fell, badly hurt, your gold untouched');t.act('cont')}
  // ---- the escape: better mounted and by night, worse with riders after you
  setup();{const e={list:Array(6).fill('militia')},base=C.escapeChance(e);P.gear.mount=Object.keys(t.ITEMS).find(k=>t.ITEMS[k].slot==='mount');G.clock=t.DAY*.9;const better=C.escapeChance(e);P.gear.mount=null;G.clock=t.DAY*.2;const worse=C.escapeChance({list:Array(6).fill('hum_knight')});
   ok(base>.15&&base<.4&&better>base&&worse<base,'getting away: about 1 in 4 on foot by day ('+Math.round(base*100)+'%), better mounted at night ('+Math.round(better*100)+'%), worse with riders after you ('+Math.round(worse*100)+'%)')}
  // ---- got away: a quarter of your gold, your soldiers scattered; some find you within days
  setup();{const b=band();roll(0);lose({kind:'party',ref:b,n:6,list:b.troops.slice(),band:'bandits'});window.Math.random=rnd;
   ok(!C.held&&P.gold===300&&!t.troopCount()&&C.scattered.length&&/slip away/.test(panel()),'got away in the rout: a quarter of your gold lost, your soldiers scattered ('+C.scattered.map(s=>s.n).join()+' may come back)');t.act('cont');
   const back=C.scattered.reduce((n,s)=>n+s.n,0);G.clock+=t.DAY*4;C.hour();ok(!C.scattered.length&&t.troopCount()===back&&back>0&&back<8,'within days '+back+' of the 8 find you again; the rest are lost')}
  // ---- taken: the page, after the battle's
  setup();let b=band();roll(.99);lose({kind:'party',ref:b,n:6,list:b.troops.slice(),band:'bandits'});window.Math.random=rnd;
  ok(C.held&&C.held.k==='band'&&P.gold===400&&/taken by the bandits/.test(panel()),'taken by the bandits: your gold is still on you, for now');
  t.act('cont');ok(G.mode==='dialog'&&/Taken captive/.test(panel())&&document.querySelector('[data-act="held-pay"]')&&document.querySelector('[data-act="held-persuade"]')&&document.querySelector('[data-act="held-serve"]')&&!document.querySelector('[data-act="held-realm"]')&&document.querySelector('.nav [data-act="held-refuse"]'),'their page: pay, persuade, ride with the band; no realm to pay for you; Refuse its way out');
  {const r=C.held.ransom;roll(.99);t.act('held-persuade');window.Math.random=rnd;ok(C.held&&C.held.ransom>r&&!document.querySelector('[data-act="held-persuade"]'),'your words fail: the ransom harsher ('+r+' → '+C.held.ransom+'g), and no second try')}
  {const r=C.held.ransom,g0=gearN();t.act('held-pay');ok(!C.held&&P.gold===400-r&&gearN()<g0&&!t.troopCount()&&t.Spatial.nearestHolding(P.x,P.y)&&/near/.test(panel()),'pay the ransom: free near a holding, '+r+'g and '+(g0-gearN())+' piece(s) from your bag gone, your soldiers scattered');t.act('dlg-ok')}
  // ---- persuaded: a fine
  setup();b=band();roll(.99);lose({kind:'party',ref:b,n:6,list:b.troops.slice(),band:'bandits'});t.act('cont');roll(0);t.act('held-persuade');window.Math.random=rnd;ok(!C.held&&P.gold===400-Math.floor(400*X.persuade.fine),'persuaded: let go for a fine');t.act('dlg-ok');
  // ---- serving the band: days pass, their raids are yours
  setup();b=band();roll(.99);lose({kind:'party',ref:b,n:6,list:b.troops.slice(),band:'bandits'});t.act('cont');window.Math.random=rnd;{t.addHonor(t.FIDS[0],30,true);const d0=G.day,h0=t.honorWith(t.FIDS[0]),g0=gearN();t.act('held-serve');
   ok(!C.held&&G.day-d0>=X.serve.band[0]&&t.honorWith(t.FIDS[0])<h0&&P.gold===400&&gearN()===g0,'riding with the band: days pass, honour lost with every realm, your gold and gear kept (and no wages while you are held)');t.act('dlg-ok')}
  // ---- your realm pays
  setup();{const f=t.FIDS[0],lord=W.lords.find(l=>l.fac!==f&&t.atWar?.(l.fac,f))||W.lords.find(l=>l.fac!==f);P.fac=f;t.addHonor(f,40-t.honorWith(f),true);lord.dead=false;lord.inside=null;lord.fight=null;roll(.99);lose({kind:'lord',ref:lord,list:lord.troops.slice()});window.Math.random=rnd;
   {t.act('cont');ok(document.querySelector('[data-act="held-realm"]')&&!document.querySelector('[data-act="held-serve"]'),'held by a lord: your realm may pay for you; you serve no other while you serve it');const d0=G.day;t.act('held-realm');ok(!C.held&&G.day-d0>=X.realm.days[0]&&P.gold>=400,'after some days your realm pays: free, none of your gold taken');t.act('dlg-ok')}
   P.fac=null}
  // ---- refusing: their cage, a day at a time (phase 2)
  const caged=(seq)=>{setup();const b=band();let k=0;window.Math.random=()=>seq?seq[k++]??.99:.99;lose({kind:'party',ref:b,n:6,list:b.troops.slice(),band:'bandits'});t.act('cont');t.act('held-refuse');return C.held&&C.held.prison};
  {const q=caged();ok(q&&q.day===1&&q.hidden===Math.floor(400*X.prison.hidden)&&/In their cage/.test(panel())&&document.querySelector('.nav [data-act="held-wait"]')&&document.querySelector('[data-act="held-break"]')&&document.querySelector('[data-act="held-bribe"]')&&document.querySelector('[data-act="held-talk"]'),'refused: their cage, day 1, '+q.hidden+'g hidden on you; break out, bribe, talk, pay, or wait a day');
   const o0=q.offer,d0=G.day;t.act('held-wait');ok(q.day===2&&G.day>d0&&q.offer<o0,'a day passes, and what they ask comes down ('+o0+' → '+q.offer+'g)');
   t.act('held-talk');const told=/A prisoner tells you of/.test(panel());t.act('held-talk');ok(told&&q.talked&&q.day===2&&document.querySelector('[data-act="held-talk"]').disabled,'talking with the other prisoners: news of a lord (he is known now), once a day, and the day goes on');
   const hp=P.hp;t.act('held-break');ok(q.guard===1&&P.hp<hp&&q.day===3,'caught breaking out: beaten, and watched closer');
   for(let i=0;i<40&&C.held;i++)t.act('held-wait');window.Math.random=rnd;ok(!C.held&&P.gold===q.hidden&&gearN()===0&&!t.troopCount()&&!C.scattered.length&&/turn you out/.test(panel()),'after '+X.prison.days+' days they turn you out: only the gold you hid, no gear in your bag, no soldiers');t.act('dlg-ok')}
  {const q=caged();window.Math.random=()=>0;t.act('held-break');window.Math.random=rnd;ok(!C.held&&P.gold===q.hidden&&/over the wall/.test(panel()),'breaking out: free, with only the gold you hid');t.act('dlg-ok')}
  {const q=caged(),cost=C.bribe(q).cost,hid=q.hidden;window.Math.random=()=>0;t.act('held-bribe');window.Math.random=rnd;ok(!C.held&&P.gold===hid-cost&&/unbarred/.test(panel()),'a bribed guard ('+cost+'g of what you hid) leaves the door unbarred');t.act('dlg-ok')}
  {const q=caged(),o=q.offer;t.act('held-pay');window.Math.random=rnd;ok(!C.held&&P.gold===400-o,'or pay what they ask, and they let you out');t.act('dlg-ok')}
  // (your companions: each tries to get away as you are taken; those who do may break you out)
  {P.comps={brann:{ap:5,role:''}};t.compInit('brann');const q=caged([.99,0]);ok(C.held.away.includes('brann'),'Brann got away as you were taken');
   window.Math.random=()=>0;t.act('held-wait');window.Math.random=rnd;ok(!C.held&&/come for you in the night/.test(panel())&&/who got away, finds you/.test(panel()),'and comes for you in the night: broken out');t.act('dlg-ok');P.comps={}}
  // (your realm may pay while you wait)
  {const f=t.FIDS[0];P.fac=f;t.addHonor(f,40-t.honorWith(f),true);const q=caged();P.fac=f;window.Math.random=()=>0;t.act('held-wait');window.Math.random=rnd;ok(!C.held&&/pay for you/.test(panel()),'your realm pays for you while you wait');t.act('dlg-ok');P.fac=null}
  // (a save made in the cage keeps the cage)
  {caged();window.Math.random=rnd;const s=JSON.stringify(C.save());C.held=null;C.load(JSON.parse(s));ok(C.held?.prison?.day===1,'a save in the cage keeps the cage');t.hidePanel();G.mode='world';G.modal=false;C.hour();ok(/In their cage/.test(panel()),'loaded: back in their cage');C.held=null;t.hidePanel()}
  // ---- a captivity and the scattered are kept in the save
  setup();b=band();roll(.99);lose({kind:'party',ref:b,n:6,list:b.troops.slice(),band:'bandits'});window.Math.random=rnd;t.act('cont');C.scattered.push({type:'hum_foot',n:2,at:t.Clock.hours()+30});
  {const s=JSON.stringify(C.save());C.held=null;C.scattered=[];C.load(JSON.parse(s));ok(C.held&&C.held.k==='band'&&C.scattered.length===1,'held and scattered come back with a save');t.hidePanel();G.mode='world';G.modal=false;C.hour();ok(G.mode==='dialog'&&/Taken captive/.test(panel()),'loaded while held: the captor’s page opens again');t.act('held-refuse');t.act('dlg-ok')}
 }finally{window.Math.random=rnd;C.held=null;C.scattered=[]}
 ok(!ERR.length,'no runtime errors');
});
