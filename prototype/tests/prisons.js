'use strict';
// Prisons (world/prisons.js, doc/PRISONS_DESIGN.md phases 2–4): every holding's Prison on its rail (who is held, pay, bribe, visit,
// break out; from outside a hostile one's walls); realms keep the lords they take (their ransom, exchanges, peace, a prison broken
// open); your companions left there when you break out alone; your own prisoners (locked up, ransomed, let go, traded, put to
// death; soldiers recruited); all kept in the save.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,X=t.PRISON,S=t.Prisons;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 const panel=()=>document.getElementById('panel').innerHTML,has=a=>!!document.querySelector('[data-act="'+a+'"]'),btn=(a,i)=>document.querySelector('[data-act="'+a+'"][data-arg="'+i+'"]');
 const f=t.FIDS[0],g=t.FIDS.find(x=>x!==f),war=(a,b,s)=>{W.rel[t.rk(a,b)]={s,since:G.day}};
 const reset=()=>{Kit.world();S.jails={};P.fac=null;P.captives=[];P.prisoners={};P.gold=2000;P.hp=t.vitals()[0];t.Timed.of(P,'hostile').clear(f);t.Timed.of(P,'hostile').clear(g);for(const x of t.TOWNS)x.crime=null;war(f,g,'war')};
 const used=new Set(),lordOf=fac=>{const l=W.lords.find(l=>l.fac===fac&&!l.gone&&!l.held&&!used.has(l))||W.lords.find(l=>l.fac===fac&&!l.gone&&!l.held);used.add(l);Object.assign(l,{dead:false,back:0,jail:null,inside:null,fight:null});return l};
 const enter=x=>{Kit.world();t.enterTown(x);t.act('tab','prison')};
 const rnd=Math.random,payRealm=window.payRealm;
 try{
  // ---- phase 2: a Prison on every holding's rail, by its kind's name
  reset();{const x=t.TOWNS.find(x=>x.owner===g);enter(x);ok(t.townPlaces(x).includes('prison')&&G.town.tab==='prison'&&/<h2>Prison<\/h2>/.test(panel())&&panel().includes('The '+t.PRISONS[x.kind].name+' of '+x.name)&&/No one is held here/.test(panel()),'a Prison on the rail of '+x.name+': its '+t.PRISONS[x.kind].name+', empty');t.toWorld()}
  // ---- phase 3: a lord routed by a realm at war with his, taken to its prison (half the time)
  reset();{const l=lordOf(f),by=lordOf(g);Kit.stub(.99,()=>t.routParty(l,[by]));ok(!l.held&&!S.all(r=>r.id===l.id).length,'routed, he got away ('+Math.round((1-X.take)*100)+'%)');l.dead=false;l.back=0;
   Kit.stub(0,()=>t.routParty(l,[by]));const h=S.all(r=>r.id===l.id)[0],town=h&&t.townBy(h.key);
   ok(h&&l.held&&l.dead&&l.jail===h.key&&town.owner===g&&h.r.keep===g&&h.r.due>G.day,'routed by '+by.name+': taken to '+S.title(h.key)+', held by the '+t.FACS[g].n+', ransomed by day '+h.r.due);
   // (visit, pay)
   enter(town);ok(panel().includes(t.lordName(l))&&has('pz-visit')&&has('pz-pay')&&has('pz-bribe')&&has('pz-break'),'its Prison shows him: visit, pay, bribe, break out');
   const r0=t.relWith(l);t.act('pz-visit','0');ok(t.relWith(l)===r0+X.visit.rel&&btn('pz-visit','0').disabled,'a visit: his relation +'+X.visit.rel+', not again so soon');
   const pay=t.lordRansom(h.r),tr=t.treas(g),g0=P.gold;t.act('pz-pay','0');ok(!l.held&&l.back>G.day&&P.gold===g0-pay&&t.treas(g)===tr+pay&&t.relWith(l)===r0+X.visit.rel+X.pay.rel&&!S.of(h.key).length,'his ransom paid ('+pay+'g, to their treasury): free, riding home to raise an army, and he thinks better of you');t.toWorld()}
  // (bribe, break out: crimes when they fail or succeed)
  reset();{const l=lordOf(f),town=Kit.stub(0,()=>S.take(l,g,l.x,l.y));enter(town);const b=S.bribe(S.of(town.name)[0],town.name),g0=P.gold;
   Kit.stub(.99,()=>t.act('pz-bribe','0'));ok(l.held&&P.gold===g0-b.cost&&t.crimeAt(town)?.fine===X.bribe.fine,'a bribe found out: '+b.cost+'g gone, the watch fines you '+X.bribe.fine+'g');
   Kit.stub(0,()=>t.act('pz-bribe','0'));ok(!l.held,'a bribe taken: he walks free');
   l.held=false;l.dead=false;Kit.stub(0,()=>S.take(l,g,l.x,l.y,town));const hp=P.hp;Kit.stub(.99,()=>t.act('pz-break','0'));ok(l.held&&P.hp<hp&&t.crimeAt(town).fine>X.bribe.fine,'caught breaking him out: beaten, a bigger fine');
   Kit.stub(0,()=>t.act('pz-break','0'));ok(!l.held&&t.hostileTo(g),'broken out: free, and the '+t.FACS[g].n+' hostile to you');t.toWorld()}
  // (from outside a hostile holding's walls)
  reset();{const l=lordOf(f),town=Kit.stub(0,()=>S.take(l,g,l.x,l.y));t.Timed.of(P,'hostile').set(g,20);Kit.world();t.openSiege(town);ok(has('sg-prison')&&/The prison \(1 held\)/.test(panel()),'a hostile holding: its prison from outside its walls');
   t.act('sg-prison');ok(G.mode==='besiege'&&panel().includes(t.lordName(l))&&document.querySelector('.nav [data-act="sg-back"]'),'its page, Back to the walls');t.act('pz-pay','0');ok(!l.held&&G.mode==='besiege'&&!has('pz-pay'),'paid from outside: free');t.act('sg-back');ok(has('sg-prison'),'Back: the walls again');t.act('sg-leave')}
  // ---- a realm's ransom, an exchange, peace, a prison broken open
  reset();{const l=lordOf(f),town=Kit.stub(0,()=>S.take(l,g,l.x,l.y)),r=S.of(town.name)[0];window.payRealm=()=>true;r.due=G.day;try{Kit.stub(.99,()=>S.day())}finally{window.payRealm=payRealm}ok(!l.held,'his day come: the '+t.FACS[f].n+' ransom him')}
  reset();{const a=lordOf(f),b=lordOf(g);Kit.stub(0,()=>{S.take(a,g,a.x,a.y);S.take(b,f,b.x,b.y)});ok(a.held&&b.held,'each realm holds a lord of the other');Kit.stub(.99,()=>S.day());ok(a.held&&b.held,'no trade today');
   Kit.stub(0,()=>S.day());ok(!a.held&&!b.held,'an exchange: both free')}
  reset();{const a=lordOf(f),town=Kit.stub(0,()=>S.take(a,g,a.x,a.y));t.realmOf(f).setRel(g,'peace');ok(!a.held&&!S.of(town.name).length,'peace: their prisoners go free');war(f,g,'war')}
  reset();{const a=lordOf(f),town=Kit.stub(0,()=>S.take(a,g,a.x,a.y)),o=town.owner;try{town.owner=f;Kit.stub(.99,()=>S.day());ok(!a.held,'the holding taken: its prison broken open')}finally{town.owner=o}}
  // ---- your companions left behind when you break out alone; got back
  reset();{const C=t.Captivity,sells=C.sells;C.sells=()=>false;P.comps={brann:{ap:0,role:''}};t.compInit('brann');P.troops={hum_foot:4};
   try{const b=t.asParty({kind:'bandits',troops:Array(6).fill('militia'),x:P.x+30,y:P.y,cool:0});t.bandits.push(b);Kit.stub(.99,()=>{t.startEncounter({kind:'party',ref:b,n:6,list:b.troops.slice(),band:'bandits'});t.concludeEncounter(false,{},0,true,[],null,{})});
    t.act('cont');const at=C.held?.at;ok(C.held&&C.held.with.includes('brann'),'taken with Brann (who did not get away)');t.act('held-refuse');Kit.stub(0,()=>t.act('held-break'));
    const key=at&&S.keyOf(at);ok(!C.held&&P.comps.brann.jail===key&&!t.compsInBand().includes('brann')&&/still in/.test(panel()),'broken out alone: Brann is still in '+(key&&S.title(key)));t.act('dlg-ok');
    if(at?.k==='site'){const s=W.sites.find(x=>x.i===at.i&&x.seed===at.seed);ok(t.Prisons.siteNote(s).includes('Brann'),'its page says he is held there');t.worldEmit('site:cleared',{site:s});ok(!P.comps.brann.jail&&t.compsInBand().includes('brann'),'cleared: he is free, with you again')}
    S.leave(['brann'],{k:'holding',town:t.TOWNS.find(x=>x.owner===g).name},g);Kit.stub(0,()=>S.day());ok(!P.comps.brann.jail,'held by a realm: he may slip away in time ('+Math.round(X.comp.escape*100)+'% a day)');
    const town=t.TOWNS.find(x=>x.owner===g);S.leave(['brann'],{k:'holding',town:town.name},g);enter(town);const pay=S.ransomOf(S.of(town.name)[0]);t.act('pz-pay','0');ok(!P.comps.brann.jail&&/finds you again/.test(G.msgs.slice(-3).map(m=>m.m).join()),'his ransom paid at its Prison ('+pay+'g): with you again');t.toWorld();
    // (taken with you, freed any other way: with you)
    S.leave(['brann'],{k:'holding',town:town.name},g);war(f,g,'peace');P.fac=f;t.realmOf(f).setRel(g,'war');t.realmOf(f).setRel(g,'peace');ok(!P.comps.brann.jail,'peace between his keepers and your realm: he is free')
   }finally{C.sells=sells;P.comps={};C.held=null}}
  // ---- at war, your realm trades a lord it holds for you (world/captivity.js)
  reset();{const C=t.Captivity,a=lordOf(g),cap=lordOf(g);P.fac=f;t.addHonor(f,-t.honorWith(f),true);Kit.stub(0,()=>S.take(a,f,a.x,a.y));
   Kit.stub(.99,()=>{t.startEncounter({kind:'lord',ref:cap,list:cap.troops.slice()});t.concludeEncounter(false,{},0,true,[],null,{})});t.act('cont');
   ok(C.held?.war,'taken at war');Kit.stub(0,()=>t.act('held-wait'));ok(!C.held&&!a.held&&/trade .* for you/.test(panel()),'your realm trades '+a.name+' for you');t.act('dlg-ok');P.fac=null}
  // ---- phase 4: your own prison (a holding of yours or your realm's)
  reset();{const x=t.TOWNS.find(x=>x.owner===f&&!t.Timed.of(x).has('sacked')),o=x.owner;P.fac=f;const l=lordOf(g);t.captureLord(l);P.prisoners={militia:5};
   try{enter(x);ok(has('pz-lock')&&has('pz-lockmen')&&/Lock them up/.test(panel()),'a holding of your realm: lock up the captives and prisoners you carry');
    t.act('pz-lock','0');t.act('pz-lockmen');const list=S.of(x.name),r=list.find(r=>r.k==='lord');ok(r&&r.keep==='player'&&!P.captives.length&&!t.prisonerCount()&&list.find(r=>r.k==='men').n===5&&/Your prisoners/.test(panel()),'locked up: '+l.name+' and 5 soldiers, yours');
    t.captivesEscape();ok(l.held&&S.of(x.name).includes(r),'a lost battle frees them no more');
    ok(btn('pz-ransom',list.indexOf(r)).disabled,'no offer yet');r.offerDay=G.day;Kit.stub(.99,()=>S.day());ok(r.offer===t.lordRansom(r),'days on, his realm offers '+r.offer+'g');enter(x);
    const o0=r.offer;Kit.stub(0,()=>t.act('pz-ask',String(list.indexOf(r))));ok(r.offer>o0&&r.asked,'asked for more: '+r.offer+'g');
    const g0=P.gold;t.act('pz-ransom',String(list.indexOf(r)));ok(P.gold===g0+r.offer&&!l.held&&l.back>G.day,'ransomed: the gold, and he rides home');
    const m=S.of(x.name).find(r=>r.k==='men'),n=t.troopCount();t.act('pz-recruit',String(S.of(x.name).indexOf(m)));ok(m.n===4&&t.troopCount()===n+1,'a soldier recruited from it');
    const cap=t.prisonCap();t.act('pz-out',String(S.of(x.name).indexOf(m)));ok(t.prisonerCount()===Math.min(4,cap)&&m.n===4-t.prisonerCount(),'the rest taken out, as many as you have room for ('+t.prisonerCount()+'), with you again');
    if(S.of(x.name).includes(m)){const r0=P.renown;t.act('pz-free',String(S.of(x.name).indexOf(m)));ok(!S.of(x.name).length&&P.renown>r0,'and the others let go')}
    // (mercy, an exchange, death)
    const l2=lordOf(g);t.captureLord(l2);t.act('pz-lock','0');const r2=S.of(x.name)[0];const h0=t.honorWith(g);t.act('pz-free','0');ok(!l2.held&&t.honorWith(g)>h0,'let go: his realm thinks better of you');
    const l3=lordOf(g),mine=lordOf(f);t.captureLord(l3);t.act('pz-lock','0');Kit.stub(0,()=>S.take(mine,g,mine.x,mine.y));enter(x);const i3=S.of(x.name).findIndex(r=>r.id===l3.id);
    ok(btn('pz-swap',i3)&&!btn('pz-swap',i3).disabled,'his realm holds '+mine.name+' of yours: an exchange');t.act('pz-swap',String(i3));ok(!l3.held&&!mine.held,'exchanged: both free');
    const l4=lordOf(g);t.captureLord(l4);t.act('pz-lock','0');const h1=t.honorWith(g);t.act('pz-exec','0');ok(l4.gone&&!S.of(x.name).length&&t.honorWith(g)<=h1+X.exec.honor,'put to death: gone for good, his realm’s honour of you falls');
    // (no longer your realm's: they go free)
    const l5=lordOf(g);t.captureLord(l5);t.act('pz-lock','0');t.toWorld();x.owner=g;Kit.stub(.99,()=>S.day());ok(!l5.held&&!S.of(x.name).length,'the holding lost: your prisoners go free')
   }finally{x.owner=o;P.fac=null;t.toWorld()}}
  // ---- kept in the save
  reset();{const l=lordOf(f),town=Kit.stub(0,()=>S.take(l,g,l.x,l.y)),s=JSON.stringify(S.save());S.jails={};S.load(JSON.parse(s));ok(S.of(town.name)[0]?.id===l.id,'a save keeps who is held where')}
 }finally{Math.random=rnd;window.payRealm=payRealm;S.jails={};war(f,g,'peace');Kit.world()}
 ok(!ERR.length,'no runtime errors');
});
