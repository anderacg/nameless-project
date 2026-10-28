'use strict';
// Captivity (world/captivity.js, doc/CAPTIVITY_DESIGN.md phase 1): beaten, you may get away or be taken; taken, you pay, persuade,
// serve, wait for your realm or refuse; freed near a holding, it costs by the way out; your scattered soldiers find you again;
// what they took is in their stash (phase 3), won back by clearing or raiding it or from a fence, sold off after a month.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,C=t.Captivity,X=t.CAPTIVITY;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 const rnd=Math.random,roll=v=>{window.Math.random=()=>v},panel=()=>document.getElementById('panel').innerHTML;
 const band=()=>{const b=t.asParty({kind:'bandits',troops:Array(6).fill('militia'),x:P.x+30,y:P.y,cool:0});t.bandits.push(b);return b};
 const setup=()=>{Kit.world();C.held=null;C.scattered=[];P.quests=[];P.troops={hum_foot:8};P.gold=400;P.hp=t.vitals()[0];P.fac=null;P.gear.mount=null;const gid=Object.keys(t.ITEMS).find(k=>t.ITEMS[k].slot==='weapon');t.invAdd('gear',gid,1);t.invAdd('gear',gid,1);t.invAdd('gear',gid,1)};
 const lose=e=>{t.startEncounter(e);t.concludeEncounter(false,{},0,true,[],null,{})};
 const gearN=()=>P.inv.filter(s=>s&&s.k==='gear').reduce((n,s)=>n+(s.n||1),0);
 const sells=C.sells;C.sells=()=>false;// (no sale but where it is tested: below)
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
   P.hp=t.vitals()[0];const hp=P.hp;t.act('held-break');ok(q.guard===1&&P.hp<hp&&q.day===3,'caught breaking out: beaten, and watched closer');
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
  // ---- the traits (phase 4): Slippery, Silver Tongue, Old Soldier
  setup();{const e={list:Array(6).fill('militia')},c={k:'band',name:'the bandits'},TR=X.traits,ch=C.escapeChance(e),pc=C.persuadeChance(c),rs=C.ransomOf(c),q={help:0,guard:0},bc=C.breakChance(q);
   P.perks=['slippery'];ok(Math.abs(C.escapeChance(e)-ch-TR.slippery.escape)<1e-9&&C.breakChance(q)>bc,'Slippery: +'+Math.round(TR.slippery.escape*100)+'% to get away, an easier break-out');
   P.perks=['silver'];ok(Math.abs(C.persuadeChance(c)-pc-TR.silver)<1e-9,'Silver Tongue: easier to talk round');
   P.perks=['oldsoldier'];ok(C.ransomOf(c)<rs,'Old Soldier: a smaller ransom ('+rs+' → '+C.ransomOf(c)+'g)');
   const b=band();roll(.99);lose({kind:'party',ref:b,n:6,list:b.troops.slice(),band:'bandits'});window.Math.random=rnd;t.act('cont');const g0=gearN(),d0=G.day;roll(.99);t.act('held-serve');window.Math.random=rnd;
   ok(G.day-d0<=Math.ceil(X.serve.band[1]*TR.oldsoldier.serve),'and half the service ('+(G.day-d0)+' days)');t.act('dlg-ok');
   setup();P.perks=['oldsoldier'];const b2=band();roll(.99);lose({kind:'party',ref:b2,n:6,list:b2.troops.slice(),band:'bandits'});t.act('cont');const g1=gearN();t.act('held-pay');window.Math.random=rnd;
   ok(g1-gearN()===X.light[1]-1,'and a piece fewer from your bag ('+(g1-gearN())+')');t.act('dlg-ok');P.perks=[]}
  {P.perks=[];const N=['slippery','silver','oldsoldier'].map(k=>Object.values(t.TREE).find(n=>n.m&&n.m.perk===k));ok(N.every(n=>n&&n.links.length),'each trait is a node in the hero’s tree: '+N.map(n=>n&&n.n).join(', '))}
  // ---- where they keep you, and where you come out
  {caged();ok(C.held.at===null||C.held.at.k==='site','a band takes you to a camp or hideout of theirs near, if there is one')}
  {setup();const l=W.sites.find(s=>s instanceof t.Lair&&!s.cleared&&!s.within);P.x=l.x+3*t.TILE;P.y=l.y;const b=band();roll(.99);lose({kind:'party',ref:b,n:6,list:b.troops.slice(),band:'bandits'});window.Math.random=rnd;
   const d=Math.hypot(P.x-l.x,P.y-l.y)/t.TILE;ok(C.held.at?.i===l.i&&d<4&&/to the /.test(panel()),'taken: carried to the '+l.name+' ('+d.toFixed(1)+' tiles off it)');t.act('cont');
   t.act('held-refuse');const q=C.held.prison;
   // (too hurt to try, a day heals; in chains after two tries)
   P.hp=Math.round(t.vitals()[0]*.2);C.cell();ok(document.querySelector('[data-act="held-break"]').disabled&&/Too hurt/.test(panel()),'too hurt to break out');const h0=P.hp;t.act('held-break');ok(q.day===1&&P.hp===h0,'and trying does nothing');
   t.act('held-wait');ok(P.hp>h0,'a day in the cage heals a little ('+h0+' → '+P.hp+', food '+t.supplyNow().foodDays+'d)');
   P.hp=t.vitals()[0];roll(.99);t.act('held-break');P.hp=t.vitals()[0];t.act('held-break');window.Math.random=rnd;ok(q.fails===2&&document.querySelector('[data-act="held-break"]').disabled&&/in chains/i.test(panel()),'two tries caught: in chains, no more break-outs');
   q.fails=0;P.hp=t.vitals()[0];roll(0);t.act('held-break');window.Math.random=rnd;const o=Math.hypot(P.x-l.x,P.y-l.y)/t.TILE;ok(!C.held&&o>=X.release.out-1.5,'broken out: a way off their camp, alone ('+o.toFixed(1)+' tiles)');t.act('dlg-ok')}
  {setup();const l=W.sites.find(s=>s instanceof t.Lair&&!s.cleared&&!s.within);P.x=l.x+3*t.TILE;P.y=l.y;const b=band();roll(.99);lose({kind:'party',ref:b,n:6,list:b.troops.slice(),band:'bandits'});window.Math.random=rnd;t.act('cont');
   t.act('held-pay');const o=Math.hypot(P.x-l.x,P.y-l.y)/t.TILE;ok(!C.held&&o<4,'ransomed: let go at their camp ('+o.toFixed(1)+' tiles)');t.act('dlg-ok')}
  {setup();const f=t.FIDS[0],home=t.TOWNS.find(x=>x.owner===f);C.held={k:'realm',fac:t.FIDS[1],name:'the men of the '+t.FACS[t.FIDS[1]].n,at:{k:'holding',town:t.TOWNS.find(x=>x.owner===t.FIDS[1]).name},away:[]};P.fac=f;C.free('light','Paid.',0,true);
   const n=t.Spatial.nearest(t.fiefsOf(f),P.x,P.y);ok(n&&n.owner===f&&Math.hypot(P.x-n.x,P.y-n.y)<6*t.TILE,'your realm pays: freed at a holding of your realm ('+n.name+')');t.act('dlg-ok');P.fac=null}
  // ---- sold on to a ransom broker: far off, all but your hidden gold kept by the band, a dearer price, his shorter cage
  {setup();P.comps={brann:{ap:5,role:''}};t.compInit('brann');const l=W.sites.find(s=>s instanceof t.Lair&&!s.cleared&&!s.within);P.x=l.x+3*t.TILE;P.y=l.y;const b=band();
   let k=0;const seq=[.99,0];window.Math.random=()=>seq[k++]??.99;lose({kind:'party',ref:b,n:6,list:b.troops.slice(),band:'bandits'});t.act('cont');t.act('held-refuse');const q=C.held.prison,base=C.ransomOf({k:'band'});ok(C.held.away.includes('brann'),'Brann got away as you were taken');
   C.sells=()=>true;window.Math.random=()=>.99;t.act('held-wait');window.Math.random=rnd;C.sells=()=>false;const h=C.held,town=h&&t.townBy(h.town),far=town&&Math.hypot(town.x-l.x,town.y-l.y)/t.TILE;
   ok(h&&h.k==='broker'&&town.T.broker&&Math.hypot(P.x-town.x,P.y-town.y)<8*t.TILE&&/Sold/.test(panel()),'sold to the ransom broker of '+(town&&town.name)+', carried there ('+(far|0)+' tiles from their camp)');
   ok(P.gold===q.hidden&&!t.troopCount()&&P.quests.some(x=>x.type==='stash'&&x.holder.k==='site'&&x.holder.i===l.i),'the band keeps all but the '+q.hidden+'g you hid, in its stash (a quest marks it)');
   ok(h.ransom===Math.round(base*X.sold.price/5)*5&&!h.away.length&&/lose[s]? track/.test(panel()),'his price is dearer ('+h.ransom+'g); Brann loses track of you');
   ok(document.querySelector('[data-act="held-serve"]')?.textContent.includes('Work off')&&Math.abs(C.persuadeChance(h)-C.persuadeChance({k:'band'})*X.sold.persuade)<.2,'his page: work off your price; harder to talk round');
   t.act('held-refuse');ok(C.held.prison.hidden===q.hidden&&C.limit(C.held)===X.sold.days&&C.breakChance(C.held.prison)<C.breakChance({help:0,guard:0})+.001,'his cage: your hidden gold still on you, '+X.sold.days+' days, better kept');
   P.quests=[];P.gold=2000;t.act('held-pay');ok(!C.held&&Math.hypot(P.x-town.x,P.y-town.y)<8*t.TILE&&!P.quests.some(x=>x.type==='stash'),'paid: let go at his town; no stash for what a merchant takes');t.act('dlg-ok');P.comps={}}
  {const c={k:'band',ransom:100},q={offer:100,hidden:0};let r=.11;window.Math.random=()=>r;const a=sells.call(C,c,q);q.offer=50;const b2=sells.call(C,c,q);window.Math.random=rnd;ok(!a&&b2,'more likely sold once their ask is at its floor')}
  // ---- let go by a realm (served, ransomed, fined): the score settled; broken out: not
  {const f=t.FIDS[0],town=t.TOWNS.find(x=>x.owner===f),h=t.Timed.of(P,'hostile'),wrong=()=>{h.set(f,20);town.crime={until:G.day+10,fine:50}};
   setup();wrong();C.held={k:'realm',fac:f,name:'the men of the '+t.FACS[f].n,since:G.day,ransom:100,tried:[],away:[]};C.cv=null;t.act('held-serve');
   ok(!C.held&&!h.has(f)&&!t.crimeAt(town)&&/hold nothing against you/.test(panel()),'served them: the '+t.FACS[f].n+' hostile no more, your crime at '+town.name+' forgiven');t.act('dlg-ok');
   setup();wrong();C.held={k:'realm',fac:f,name:'the men',since:G.day,ransom:100,tried:[],away:[],prison:{day:2,guard:0,hidden:0,offer:100,talked:false,help:0,event:''}};C.free('broke','Out.');
   ok(h.has(f)&&t.crimeAt(town),'broken out: they still want you');t.act('dlg-ok');h.clear(f);town.crime=null}
  // ---- their stash (phase 3): what they took, in a camp or hideout of theirs near; a quest marks it; cleared, most of it back
  const stashOf=()=>P.quests.find(q=>q.type==='stash'),atLair=()=>{const l=W.sites.find(s=>s instanceof t.Lair&&!s.cleared&&!s.within);P.x=l.x+3*t.TILE;P.y=l.y;return l};
  const ransomed=()=>{setup();const l=atLair(),b=band();roll(.99);lose({kind:'party',ref:b,n:6,list:b.troops.slice(),band:'bandits'});window.Math.random=rnd;t.act('cont');const r=C.held.ransom;t.act('held-pay');return {l,r,q:t.Quest.as(stashOf())}};
  {const {l,r,q}=ransomed();ok(q&&q.gold===r&&q.gear.length>=1&&q.holder.k==='site'&&q.holder.i===l.i&&q.seek().x===l.x&&/a quest marks it/.test(panel()),'ransomed: the '+r+'g and '+q.gear.length+' piece(s) they took are in the '+l.name+', marked');t.act('dlg-ok');
   const g=P.gold,n=gearN();t.worldEmit('site:cleared',{site:l});ok(!stashOf()&&P.gold===g+Math.round(r*X.stash.back)&&gearN()===n+Math.round(q.gear.length*X.stash.back),'their camp cleared: '+Math.round(X.stash.back*100)+'% of it back')}
  // (a fence in a tavern sells your gear back; the gold still waits in their stash)
  {const {q}=ransomed();t.act('dlg-ok');const town=t.TOWNS.find(x=>x.T.broker)||t.TOWNS[0];t.enterTown(town);t.act('tab','tavern');const p=C.fencePrice(q),g=P.gold,n=gearN(),k=q.gear.length;
   ok(document.querySelector('[data-act="held-fence"]')&&/A fence/.test(panel()),'a fence in the tavern has your gear');t.act('held-fence',q.id);
   ok(P.gold===g-p&&gearN()===n+k&&!q.gear.length&&stashOf()&&/A fence/.test(panel())===false,'bought back for '+p+'g: all '+k+' piece(s); the gold is still in their stash');t.toWorld();
   // (a month on, sold off)
   G.day=q.due+1;q.lapse();ok(!stashOf(),'not taken back in '+X.stash.days+' days: sold off')}
  // (a lord's: in a holding of his realm; raided, won back)
  {setup();const f=t.FIDS[0];C.held={k:'realm',fac:f,name:'the men of the '+t.FACS[f].n};C.free('prison','Out.');const q=t.Quest.as(stashOf()),town=t.townBy(q.holder.town);
   ok(q&&town&&town.owner===f&&q.gold===400&&q.gear.length===gearN()+q.gear.length&&q.deed==='holding:raided','out of their prison: your 400g and all your gear in '+town.name+', a holding of theirs');t.act('dlg-ok');
   const g=P.gold;t.worldEmit('holding:raided',{town});ok(!stashOf()&&P.gold===g+Math.round(400*X.stash.back),'raided: most of it back')}
  // ---- a captivity and the scattered are kept in the save
  setup();b=band();roll(.99);lose({kind:'party',ref:b,n:6,list:b.troops.slice(),band:'bandits'});window.Math.random=rnd;t.act('cont');C.scattered.push({type:'hum_foot',n:2,at:t.Clock.hours()+30});
  {const s=JSON.stringify(C.save());C.held=null;C.scattered=[];C.load(JSON.parse(s));ok(C.held&&C.held.k==='band'&&C.scattered.length===1,'held and scattered come back with a save');t.hidePanel();G.mode='world';G.modal=false;C.hour();ok(G.mode==='dialog'&&/Taken captive/.test(panel()),'loaded while held: the captor’s page opens again');t.act('held-refuse');t.act('dlg-ok')}
 }finally{window.Math.random=rnd;C.held=null;C.scattered=[];C.sells=sells}
 ok(!ERR.length,'no runtime errors');
});
