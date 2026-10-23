'use strict';
// The small encounters (world/encounters.js campfire, herbalist, toll; their numbers data/encounters.js ENC_TUNE, their checks
// ENC_STAT; doc/ENCOUNTERS_DESIGN.md "The small encounters"): their ground and climate rules, each choice's outcomes and odds
// (stats only add), every ending once through Encounter#finish (encounter:ended), saved and loaded mid-encounter, the toll's real
// and false men, the false toll-man reported (an escort to the reeve, the news), the developer's enc spawning each, and their
// pages (the frame: header, choices, Leave on the right, Esc following it). Written on the test kit (tests/kit.js).
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,DAY=t.DAY,TU=t.ENC_TUNE,S=t.ENC_STAT;Kit.begin('soldier',61);Kit.clear();Kit.world();
 const U='hum_levy',ended=[],fought=[],e1=t.worldOn('encounter:ended',ev=>ended.push(ev)),e2=t.worldOn('encounter:fought',ev=>fought.push(ev));
 const of=e=>ended.filter(x=>x.e===e).map(x=>x.how);
 const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)],panel=()=>Kit.panel(),acts=()=>qa('.rwbody .rkact').map(b=>b.querySelector('b').textContent);
 const fresh=()=>{Kit.world();Kit.clear();G.road=null;G.chase=null;G.enc=null;G.encAgain=null;G.encCool=0;W.road=null;P.quests=[];P.gold=500;P.morale=50;P.renown=5;P.troops={[U]:8};P.wounded={};P.woundedGroups=[];
  t.BAND.sick={};P.sp=t.vitals()[1];P.inv=Array(t.INV_SIZE).fill(null);t.invAdd('good','grain',20);G.clock=DAY*.4};
 // (stats set while fn runs: attributes and skill levels)
 const stats=(o,fn)=>{const a0={...P.attr},s0={};for(const k in o)if(k in P.attr)P.attr[k]=o[k];else{s0[k]=P.sk[k].lv;P.sk[k].lv=o[k]}try{return fn()}finally{Object.assign(P.attr,a0);for(const k in s0)P.sk[k].lv=s0[k]}};
 const Z={str:0,agi:0,int:0,cha:0,med:0,surv:0,hunt:0,scout:0,lead:0,pers:0,trade:0};
 // (one of a kind on its own ground near a holding (ok: that holding will do), else beside you there)
 const spawn=(k,ok)=>{const D=t.ROAD_ENC[k];for(const z of t.TOWNS){if(ok&&!ok(z))continue;fresh();Kit.goHome(z);const p=t.roadSpot(D.on,0,D.near),e=p&&t.roadSpawn(k,p[0],p[1]);if(e)return e}
  for(const z of t.TOWNS){if(ok&&!ok(z))continue;fresh();Kit.goHome(z);for(let i=0;i<8;i++){const e=t.roadSpawn(k,P.x+12+i*20,P.y+(i%3)*16);if(e)return e}}return null};
 const meet=(k,set,ok)=>{const e=spawn(k,ok);if(set)set(e);t.roadMeet(e);return e};
 const pick=(i,v)=>v==null?t.act('enc-do',String(i)):Kit.stubStream('road',v,()=>t.act('enc-do',String(i)));
 const sure=i=>t.act('enc-do',i+'!');
 const realm=z=>!!t.roadFac(z)&&!t.hostileTo(z.owner);
 try{
  // ---- registered, in the developer's list, spawned by it
  {const ks=Object.keys(t.ROAD_ENC),D=t.DevConsole,x=c=>{try{return D.execute(c)}catch(e){return 'ERR '+e.message}},list=x('enc');
   ok(['campfire','herbalist','toll'].every(k=>ks.includes(k)&&t.Kinds.on('encounter','travelHour').some(K=>K.id===k)),'the three are road kinds (the pity timer\'s bucket)');
   ok(/campfire \(Warm campfire\)/.test(list)&&/herbalist \(Herbalist\)/.test(list)&&/toll \(Toll on the road\)/.test(list),'and in the developer\'s enc list');
   const got={};for(const k of ['campfire','herbalist','toll'])for(const z of t.TOWNS){fresh();Kit.goHome(z);G.clock=DAY*.4;const s=x('enc '+k);if(/spawned/.test(s)){got[k]=s;break}}
   ok(Object.keys(got).length===3&&['campfire','herbalist','toll'].every(k=>t.roadList().length>=0&&new RegExp('\\('+k+'\\) spawned').test(got[k])),'enc campfire, enc herbalist, enc toll: each spawned near you ('+Object.values(got).join(' | ')+')')}
  // ---- their ground and climate
  {const C=t.ROAD_ENC,day={isDay:true,climate:'grass'};
   ok(C.campfire.on==='byroad'&&C.herbalist.on==='wood'&&C.toll.on==='road','their ground: the campfire beside a road, the herbalist at a wood\'s edge, the toll on the road');
   ok(C.herbalist.ok(day)&&C.herbalist.ok({isDay:true,climate:'swamp'})&&!C.herbalist.ok({isDay:true,climate:'frost'})&&!C.herbalist.ok({isDay:true,climate:'desert'})&&!C.herbalist.ok({isDay:false,climate:'grass'}),'the herbalist: by day, in the grass and the swamp; never in the frost, the desert or by night');
   const z=t.TOWNS.find(realm),f=z.owner;
   ok(C.toll.ok({isDay:true,owned:z})&&!C.toll.ok({isDay:false,owned:z})&&!C.toll.ok({isDay:true,owned:null})&&!C.toll.ok({isDay:true,owned:{owner:'player'}}),'the toll: by day on a realm\'s land (the '+t.FACS[f].n+'\'s); never by night, in the wild or on your own land');
   t.Timed.of(P,'hostile').set(f,5);const hostile=!C.toll.ok({isDay:true,owned:z});fresh();Kit.goHome(z);const p=t.roadSpot('road',0),e=p&&t.roadSpawn('toll',p[0],p[1]);delete P.hostile[f];
   ok(hostile&&!e,'nor on the land of a realm hostile to you (its own men would fall on you): none comes there');
   ok(C.campfire.ok(day)&&C.campfire.ok({isDay:false,climate:'desert'}),'the campfire: anywhere, by day or night');
   const w0=t.roadW('campfire'),dark=t.darkness;window.darkness=()=>.8;let w1;try{w1=t.roadW('campfire')}finally{window.darkness=dark}
   fresh();const h0=t.roadW('herbalist');P.wounded={[U]:2};const h1=t.roadW('herbalist');P.wounded={};
   ok(w0===TU.campfire.w&&Math.abs(w1-TU.campfire.w*TU.campfire.night)<1e-9&&h0===TU.herbalist.w&&Math.abs(h1-TU.herbalist.w*TU.herbalist.hurt)<1e-9,'weights: the campfire '+w0+' (×'+TU.campfire.night+' by night: '+w1.toFixed(2)+'), the herbalist '+h0+' (×'+TU.herbalist.hurt+' with wounded: '+h1.toFixed(2)+'), the toll '+t.roadW('toll'));
   const bad=[];for(const k of ['campfire','herbalist','toll'])for(let i=0;i<3;i++){const e=spawn(k,k==='toll'?realm:null);if(!e){bad.push(k+' none');continue}
    const tx=Math.floor(e.x/t.TILE),ty=Math.floor(e.y/t.TILE);if(!t.ENC_ON[t.ROAD_ENC[k].on](tx,ty))bad.push(k+' off its ground');if(k==='toll'&&!(t.roadOwned(e.x,e.y)&&t.roadOwned(e.x,e.y).owner===e.fac&&t.FACS[e.fac]))bad.push('toll: not its realm\'s land')}
   ok(!bad.length,'each comes on its own ground; the toll\'s men wear the colours of the realm whose land it is'+(bad.length?': '+bad.join(', '):''))}
  // ---- the campfire
  {const setWho=(e,who)=>{e.who=who;if(who==='bandits'&&!e.foes){e.band='bandits';e.foes=t.makeEnemies(e.n,false,'bandits')}if(who==='patrol'&&!e.fac)e.fac=Object.keys(t.FACS).find(f=>f!=='player')};
   const e=meet('campfire',x=>setWho(x,'bandits'));
   ok(q('#panel.paged')&&q('.rwin h2').textContent==='Warm campfire'&&acts().join('|')==='Read the tracks|Rest a while|Search the ashes'&&q('.nav [data-nav="close"]').textContent==='Leave','its page: Read the tracks, Rest a while, Search the ashes, and Leave ('+acts().join(', ')+')');
   ok(stats(Z,()=>t.statOdds('tracks'))===S.tracks.base&&stats({...Z,scout:3},()=>t.statOdds('tracks'))>S.tracks.base&&stats({...Z,scout:20},()=>t.statOdds('tracks'))===S.tracks.cap,'Read the tracks: '+S.tracks.base*100+'% at Scouting 0, more with Scouting and Survival, at most '+S.tracks.cap*100+'%');
   const sk0=P.sk.scout.xp,m0=(W.news?W.news.marks.length:0);pick(0,.01);
   ok(e.read===1&&/bandits/.test(panel())&&/will be back/.test(panel())&&acts().join('|')==='Lie in wait|Rest a while|Search the ashes'&&!of(e).length,'read: who they are, how many, where they went; Lie in wait offered; still open ('+acts().join(', ')+')');
   ok(W.news&&W.news.marks.length===m0+1&&W.news.items.some(it=>it.k==='tracks'&&it.x===e.wx&&it.y===e.wy),'where they went is marked on your map (a rumour\'s "?", news.js tracks)');
   ok(P.sk.scout.xp!==sk0||P.sk.scout.lv>0,'and Scouting is trained');
   const n=e.foes.length,f0=fought.length;pick(1);
   ok(G.enc&&G.enc.road===e&&G.enc.list.length===Math.max(2,Math.round(n*TU.campfire.surprise))&&fought.length===f0+1&&!of(e).length,'Lie in wait: '+G.enc.list.length+' of their '+n+' come back first, and you fall on them (encounter:fought; not ended yet)');
   Kit.seeded(3,()=>t.act('auto'));ok(of(e).length===1&&['won','lost'].includes(of(e)[0]),'ended once, with its battle: '+of(e).join());Kit.done({cont:true,world:true});
   const f=meet('campfire');pick(0,.99);ok(f.read===-1&&/too trampled/.test(panel())&&!acts().includes('Read the tracks'),'missed: the ground is too trampled, and no second try');
   // rest: nobody comes; bandits, beasts, a patrol come back
   // (the band's needs off while the hours pass: only what the rest itself does is measured; stamina from 30, not yet Tired)
   const rest=(who,v,o)=>stats(o||Z,()=>{const r=meet('campfire',x=>setWho(x,who)),max=t.vitals()[1];P.sp=30;const h=t.roadNow(),fd=t.foodN(),m=P.morale;(0,eval)('CHEAT.noNeeds=true');try{pick(2,v)}finally{(0,eval)('CHEAT.noNeeds=false')}
    return{r,h:t.roadNow()-h,full:P.sp===max,fd:fd-t.foodN(),m:P.morale-m,enc:G.enc}});
   {const a=rest('travellers',.99);ok(Math.abs(a.h-TU.campfire.rest.hours)<1e-6&&a.full&&of(a.r).join()==='done','Rest a while, nobody comes: '+a.h+' hours, stamina back; done')}
   {const a=rest('bandits',.01);ok(a.enc&&a.enc.road===a.r&&a.enc.btype&&a.enc.btype.hid===1,'bandits come back while you rest: their trap (an ambush you cannot flee)');t.act('flee');Kit.world();t.updateRoad(.05);ok(of(a.r).length===1,'ended once ('+of(a.r)+')')}
   {const a=rest('beasts',.01);ok(a.fd===TU.campfire.rest.food&&a.m===-TU.campfire.rest.morale&&of(a.r).join()==='done','beasts come back: −'+a.fd+' food, morale '+a.m)}
   {const a=rest('patrol',.01);ok(a.m===TU.campfire.rest.kind&&a.full&&/shares the fire/.test(panel()),'a patrol comes back: it shares the fire (morale +'+a.m+')')}
   {const r=meet('campfire',x=>setWho(x,'bandits')),p0=stats(Z,()=>t.campBack(r)),p1=stats({...Z,scout:5,lead:3},()=>t.campBack(r));
    ok(p0===TU.campfire.rest.back.bandits&&p1<p0&&p1>=p0*(1-S.watch.cap),'the risk they come back: '+Math.round(p0*100)+'% at Scouting 0, '+Math.round(p1*100)+'% with Scouting 5 and Leadership 3 keeping watch');
    r.read=1;t.showRoad();ok(stats({...Z,scout:5},()=>{t.showRoad();return /\d+% they come back/.test(panel())}),'read, Scouting 5 tells the risk in numbers');Kit.world()}
   // search the ashes: a find, a trap
   {const r=meet('campfire',x=>setWho(x,'bandits')),g0=P.gold;pick(3,[.01,.99,.99]);
    ok(P.gold>g0&&r.searched&&/dropped purse/.test(panel())&&!of(r).length,'Search the ashes: a purse ('+(P.gold-g0)+' gold); still open');ok(/searched/.test(t.ROAD_ENC.campfire.acts[3].why(r)),'and only once');Kit.world();
    const s=meet('campfire',x=>setWho(x,'bandits'));pick(3,[.99,.01]);ok((P.wounded[U]||0)===1&&/caltrop/.test(panel()),'a trap: a caltrop lames one of your men');
    ok(stats(Z,()=>t.campTrap(s))===TU.campfire.ash.trap.bandits&&stats({...Z,agi:10,scout:4},()=>t.campTrap(s))<TU.campfire.ash.trap.bandits,'Agility and Scouting spot the trap: '+Math.round(stats({...Z,agi:10,scout:4},()=>t.campTrap(s))*100)+'% (of '+TU.campfire.ash.trap.bandits*100+'%)');Kit.world()}}
  // ---- the herbalist
  {const wound=(n,fev)=>{P.troops={[U]:8};t.Outcome.apply({wounded:{[U]:n}},{});t.BAND.sick=fev?{[U]:{fever:fev}}:{}};
   const h=meet('herbalist',x=>{fresh();wound(3,2)});
   ok(acts().join('|')==='Buy remedies|Buy a tonic|Help her gather|Learn from her|Rob her'&&/3 of your men are wounded, 2 of them with fever/.test(panel())&&/8 gold a man/.test(panel()),'her page: her choices, your wounded and the fevered, her price ('+acts().join(', ')+')');
   const g0=P.gold,tr0=P.troops[U];pick(0);ok(P.gold===g0-3*TU.herbalist.price&&P.troops[U]===tr0+3&&!P.wounded[U]&&!t.BAND.sick[U]&&of(h).join()==='done','Buy remedies: '+(g0-P.gold)+' gold, 3 men fit again, the fever gone; done');
   {fresh();P.troops={[U]:6,hum_bow:4};t.Outcome.apply({wounded:{[U]:3,hum_bow:2}},{});t.BAND.sick={hum_bow:{fever:2}};const n=t.herbMend(2);
    ok(n===2&&!P.wounded.hum_bow&&P.wounded[U]===3&&!t.BAND.sick.hum_bow,'the fevered first: 2 mended, both of them the fevered archers')}
   ok(stats(Z,()=>t.herbPrice())===TU.herbalist.price&&stats({...Z,trade:8},()=>t.herbPrice())===Math.round(TU.herbalist.price*(1-.4)),'Trade lowers her price: '+TU.herbalist.price+' gold a man, '+stats({...Z,trade:8},()=>t.herbPrice())+' at Trade 8');
   {fresh();const e=meet('herbalist');ok(/None of your men/.test(t.ROAD_ENC.herbalist.acts[0].why(e)),'with none wounded, her remedies are greyed: why');Kit.world()}
   {const e=meet('herbalist',x=>{fresh();wound(3)}),r0=t.repAt(e.home),h0=t.roadNow(),tr0=P.troops[U];stats(Z,()=>pick(2));
    ok(Math.abs(t.roadNow()-h0-TU.herbalist.gather.hours)<1e-6&&t.repAt(e.home)===r0+TU.herbalist.gather.rep&&P.troops[U]===tr0+TU.herbalist.gather.free,'Help her gather: '+TU.herbalist.gather.hours+' hours, reputation in '+e.home+' +'+TU.herbalist.gather.rep+', '+TU.herbalist.gather.free+' of your wounded mended free');
    ok(stats({...Z,surv:5},()=>t.herbGatherH())<TU.herbalist.gather.hours&&stats({...Z,surv:20,hunt:20},()=>t.herbGatherH())===TU.herbalist.gather.hours*(1-S.forage.cap),'Survival and Hunting make it quicker ('+stats({...Z,surv:5},()=>t.herbGatherH())+' hours at Survival 5)');Kit.world()}
   {const e=meet('herbalist'),m0=P.sk.med.xp,l0=P.sk.med.lv,x0=P.xp;stats({...Z,med:2},()=>pick(3,.01));const won=P.sk.med.xp!==m0||P.sk.med.lv!==l0;
    ok(won&&e.learned&&/fever poultice/.test(panel())&&!of(e).length,'Learn from her (she takes to you): Medicine trained and XP; still open');
    ok(/taught you what she will/.test(t.ROAD_ENC.herbalist.acts[3].why(e)),'and only once');
    ok(stats(Z,()=>t.statOdds('herblore'))===S.herblore.base&&stats({...Z,med:4,int:5},()=>t.statOdds('herblore'))>S.herblore.base,'her craft: '+S.herblore.base*100+'% she takes to you, more with Medicine and Intellect');Kit.world()}
   {const fac=Object.keys(t.FACS).find(f=>f!=='player'),e=meet('herbalist',x=>{x.fac=fac}),g0=P.gold,h0=t.honorWith(fac),r0=t.repAt(e.home);pick(4);
    ok(q('#panel.confirm')&&P.gold===g0,'Rob her: asks first');sure(4);
    ok(P.gold===g0+e.coins&&t.honorWith(fac)===h0-TU.herbalist.rob.honor&&t.repAt(e.home)===r0-TU.herbalist.rob.rep&&of(e).join()==='done','robbed: her '+e.coins+' gold, honour with the '+t.FACS[fac].n+' −'+TU.herbalist.rob.honor+', reputation in '+e.home+' −'+TU.herbalist.rob.rep);Kit.world()}}
  // ---- the toll: real and false
  {const asToll=(e,real)=>{e.real=real?1:0;if(real){const R=t.RACES[e.race];e.foes=Array.from({length:e.n},(_,i)=>i%3===2?R.ranged:R.melee)}};
   const toll=(real,o)=>stats({...Z,...o},()=>meet('toll',x=>asToll(x,real),realm));
   {const e=spawn('toll',realm);
    ok(e&&[0,1].includes(e.real)&&e.fee===Math.min(TU.toll.fee.max,TU.toll.fee.base+TU.toll.fee.per*t.partySize())&&e.foes.length===e.n,'its men: the lord\'s own ('+TU.toll.real*100+'%) or impostors; the toll by your band\'s size ('+e.fee+' gold), '+e.n+' of them')}
   const e=toll(false);
   ok(acts().join('|')==='Pay the toll|Ask for their writ|Talk your way through|Refuse|Fight them'&&q('.nav [data-nav="close"]').textContent==='Turn back'&&!/forged/.test(panel()),'below Scouting '+TU.toll.see+': who they are is hidden; Pay, Ask for their writ, Talk, Refuse, Fight, and Turn back');
   stats(Z,()=>pick(1,.01));ok(e.known&&/forged writ/.test(panel())&&acts().includes('Report them')&&!acts().includes('Ask for their writ'),'Ask for their writ (it works): false, a forged writ; Report them offered');Kit.world();
   {const r=toll(true,{scout:TU.toll.see}),f=toll(false,{scout:TU.toll.see});stats({...Z,scout:TU.toll.see},()=>{t.roadMeet(r);const a=/the lord’s own men/.test(panel());t.roadMeet(f);const b=/forged writ/.test(panel())&&acts().includes('Report them');
     ok(a&&b&&!acts().includes('Ask for their writ'),'Scouting '+TU.toll.see+' sees through them at a glance: the real ones\' seal, the false ones\' forged writ')});Kit.world()}
   {const r=toll(false);stats(Z,()=>pick(1,.99));ok(r.asked&&/too fast to read/.test(panel())&&!acts().includes('Ask for their writ')&&!r.known,'the writ missed: no second look');Kit.world()}
   ok(stats(Z,()=>t.statOdds('writ'))===S.writ.base&&stats({...Z,scout:2,int:5},()=>t.statOdds('writ'))>S.writ.base&&stats(Z,()=>t.statOdds('talk'))===S.talk.base&&stats({...Z,pers:3,cha:5},()=>t.statOdds('talk'))>S.talk.base,'the writ: '+S.writ.base*100+'% (Scouting, Intellect); talking: '+S.talk.base*100+'% (Persuasion, Charisma)');
   {const r=toll(true),g0=P.gold,p=t.tollPrice(r);pick(0);ok(P.gold===g0-p&&of(r).join()==='done','Pay the toll: −'+p+' gold; done');
    ok(stats(Z,()=>t.tollPrice(r))===r.fee&&stats({...Z,trade:6},()=>t.tollPrice(r))<r.fee,'Trade gets the toll down ('+stats({...Z,trade:6},()=>t.tollPrice(r))+' of '+r.fee+')');Kit.world()}
   {const r=toll(true),g0=P.gold;stats(Z,()=>pick(2,.01));ok(P.gold===g0&&of(r).join()==='done','Talk your way through (it works): through for nothing; done');Kit.world();
    const s=toll(false),f0=s.fee;stats(Z,()=>pick(2,.99));ok(s.fee===Math.round(f0*TU.toll.talk)&&!acts().includes('Talk your way through')&&!of(s).length,'it fails: the toll goes up ×'+TU.toll.talk+' ('+f0+' → '+s.fee+'), no second try');Kit.world()}
   // refuse: the real let you by and remember it; the false back off from a strong band, else fight
   {const r=toll(true),h0=t.honorWith(r.fac),r0=t.repAt(r.home);pick(3);
    ok(t.honorWith(r.fac)===h0-TU.toll.refuse.honor&&t.repAt(r.home)===r0-TU.toll.refuse.rep&&!G.enc&&of(r).join()==='done','Refuse the lord\'s own: you pass; honour with the '+t.FACS[r.fac].n+' −'+TU.toll.refuse.honor+', reputation in '+r.home+' −'+TU.toll.refuse.rep);Kit.world();
    const s=toll(false);P.troops={[U]:40};const h1=t.honorWith(s.fac);pick(3);ok(!G.enc&&/drag the barrier aside/.test(panel())&&t.honorWith(s.fac)===h1&&of(s).join()==='done','refuse false ones with a strong band: they back off; no honour lost');Kit.world();
    const w=toll(false);P.troops={[U]:1};w.foes=t.makeEnemies(7,false,'bandits');pick(3);ok(G.enc&&G.enc.road===w&&/False toll-men/.test(panel()),'with a weak band: they fight (“False toll-men”)');t.act('flee');Kit.world();t.updateRoad(.05);ok(of(w).length===1,'ended once ('+of(w)+')')}
   // fight: the real cost you; the false are bandits
   {const r=toll(true),h0=t.honorWith(r.fac),r0=t.repAt(r.home);pick(4);ok(q('#panel.confirm')&&!G.enc,'Fight them: asks first while they may be the lord\'s own');sure(4);
    ok(G.enc&&G.enc.road===r&&t.honorWith(r.fac)===h0-TU.toll.fight.honor&&t.repAt(r.home)===r0-TU.toll.fight.rep&&new RegExp(t.FACS[r.fac].n+'’s toll-men').test(panel()),'the lord\'s own attacked: honour −'+TU.toll.fight.honor+', reputation −'+TU.toll.fight.rep+'; the fight is with “the '+t.FACS[r.fac].n+'’s toll-men”');
    Kit.seeded(5,()=>t.act('auto'));ok(of(r).length===1&&['won','lost'].includes(of(r)[0]),'ended once with its battle ('+of(r)+')');Kit.done({cont:true,world:true});
    const s=toll(false,{scout:TU.toll.see}),h1=t.honorWith(s.fac);stats({...Z,scout:TU.toll.see},()=>{t.roadMeet(s);pick(4)});ok(G.enc&&G.enc.road===s&&t.honorWith(s.fac)===h1,'known false: no question, no honour lost: they are bandits');t.act('flee');Kit.world();t.updateRoad(.05)}
   // report them: their ringleader rides with you to the reeve; there, the bounty and the news
   {const r=toll(false,{scout:TU.toll.see});P.troops={[U]:1};r.foes=t.makeEnemies(8,false,'bandits');stats({...Z,scout:TU.toll.see},()=>t.roadMeet(r));
    ok(/too many to seize/.test(panel()),'Report them: greyed while they are too many to seize');Kit.world();
    const s=toll(false,{scout:TU.toll.see});P.troops={[U]:40};const g0=P.gold;stats({...Z,scout:TU.toll.see},()=>{t.roadMeet(s);pick(5)});const qe=t.Escort.list()[0];
    ok(qe&&qe.who==='impostor'&&qe.to.town===s.home&&s.gone&&of(s).join()==='done'&&P.gold===g0,'Report them: the ringleader bound, riding with you to the reeve of '+s.home+' (an escort); the rest scatter; done');
    const n0=W.news?W.news.items.length:0,h0=t.honorWith(s.fac),r0=t.repAt(s.home);qe.pay();Kit.world();
    ok(P.gold===g0+TU.toll.report.gold&&t.honorWith(s.fac)===h0+TU.toll.report.honor&&t.repAt(s.home)===r0+TU.toll.report.rep&&W.news.items.some(it=>it.k==='toll'&&it.detail.town===s.home)&&!t.Escort.list().length,'handed in: +'+TU.toll.report.gold+' gold, reputation +'+TU.toll.report.rep+', honour +'+TU.toll.report.honor+', and the news of it goes round');
    const u=toll(true,{scout:TU.toll.see});stats({...Z,scout:TU.toll.see},()=>t.roadMeet(u));ok(!acts().includes('Report them'),'never the lord\'s own men');Kit.world()}}
  // ---- left be, and their time up: every ending once
  {const a=spawn('campfire');a.met=1;a.over();const b=spawn('toll',realm);G.clock+=(b.end-t.roadNow()+.1)*DAY/24;b.over();const c=spawn('herbalist');c.goOff();const cc=of(c).length;G.clock+=(c.end-t.roadNow()+.1)*DAY/24;c.over();
   ok(of(a).join()==='left'&&of(b).join()==='timeout'&&!cc&&of(c).join()==='timeout','met and left: left; unmet, its time up: timeout; the herbalist walks off and ends once ('+[of(a),of(b),of(c)].join(' | ')+')')}
  // ---- saved and loaded mid-encounter
  {fresh();const z=t.TOWNS.find(realm);Kit.goHome(z);const R=t.roadSt(),mk=(k,x)=>{for(let i=0;i<10;i++){const e=t.roadSpawn(k,P.x+30+i*24,P.y+x);if(e)return e}return null};
   const c=mk('campfire',0),h=mk('herbalist',20),o=mk('toll',-20);
   if(c){c.read=1;c.searched=1;c.seen=1}if(h){h.learned=1}if(o){o.known=1;o.talked=1;o.fee=33}
   G.mode='world';G.modal=false;const snap=JSON.stringify(W.road);t.saveGame(true);W.road=null;t.loadGame();
   const back=k=>t.roadList().find(x=>x.k===k);
   ok(c&&o&&JSON.stringify(W.road)===snap&&t.roadList().every(x=>x instanceof t.Encounter),'saved and loaded as they were, mid-way (the tracks read and the ashes searched; '+(h?'she has taught you; ':'')+'the toll seen through, talked up to 33 gold)');
   t.roadMeet(back('campfire'));const ca=acts().join('|');Kit.world();t.roadMeet(back('toll'));const ta=acts().join('|'),tp=/33 gold/.test(panel());Kit.world();
   ok(!/Read the tracks/.test(ca)&&!/Talk your way/.test(ta)&&/Report them/.test(ta)&&tp,'and their pages go on where they were ('+ca+' / '+ta+')')}
  // ---- the frame: Esc follows the bottom bar; a phone in landscape
  {const e=meet('toll',null,realm);t.onEscape();ok(G.mode==='world'&&!G.road,'Esc on its page: Turn back, the way out on the right');e.over();ok(of(e).join()==='left','turned back from, it ends once: left');
   const f=meet('campfire');pick(3,[.99,.99]);ok(qa('.nav button').length>=1&&q('.nav [data-nav="close"]'),'after a choice its bottom bar is still there');t.onEscape();ok(G.mode==='world','and Esc leaves it')}
 }finally{t.worldOff('encounter:ended',e1);t.worldOff('encounter:fought',e2);fresh()}
});
