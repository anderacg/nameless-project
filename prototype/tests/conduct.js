'use strict';
// Conduct (doc/CONDUCT_RUINS_DESIGN.md): Insight from Scouting (window.js insight: vague, rough or exact by skill('scout')); robbing
// villagers (folk.js: loot by what they are doing, whether they fight back, the fight with them as peasants, what killing them
// costs, fleeing or losing, their memory of you by days, saved); ruins (sites.js Ruins: treasure once, occupants after the
// cooldown by climate and land, seeded, each occupant's page and actions); guardians (woken: a fight at once, no leaving; the
// Awareness, Stealth and Lore checks; remembered after you withdraw). Rolls are steered by a stubbed Math.random (rolls).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)],panel=()=>document.getElementById('panel').innerHTML,text=()=>document.getElementById('panel').textContent;
 const world=()=>{G.mode='world';G.modal=false;t.hidePanel();G.encCool=0;G.enc=null;G.encAgain=null;G.site=null;G.siteSpy=null;G.siteTab=null;G.siteMsg='';G.wk=null;G.wkFrom=null;G.est=null;G.lastSite=null;P.tx=null;G.chase=null};
 // (Math.random gives vals in turn, then a seeded stream)
 const rolls=(vals,f)=>{const r0=Math.random,s=t.seeded(4242);let i=0;Math.random=()=>i<vals.length?vals[i++]:s();try{return f()}finally{Math.random=r0}};
 const done=()=>{if(G.mode!=='world'&&q('[data-act="cont"]'))t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);world()};
 const acts=()=>qa('.rwbody .rkact').map(b=>b.dataset.act+(b.dataset.arg&&b.dataset.arg!=='undefined'?'='+b.dataset.arg:'')+':'+b.dataset.rk).join();
 const scout=n=>{P.sk.scout.lv=n};
 t.act('begin','soldier');G.quietEvents=true;P.fac=null;P.hostile={};P.gold=5000;

 // ---- Insight: the same rule everywhere, by Scouting (0–1 vague, 2–4 rough, 5+ exact), a tooltip on what more would tell
 for(const [n,l] of [[0,0],[3,1],[6,2]]){scout(n);const h=t.insight(['VAGUE','ROUGH','EXACT'],'know more'),w=['VAGUE','ROUGH','EXACT'][l];
   ok(t.skill('scout')===n&&t.insightLv()===l&&h.includes(w)&&['VAGUE','ROUGH','EXACT'].filter(x=>x!==w).every(x=>!h.includes(x))&&(l<2?h.includes('title="Scouting '+(l?t.INSIGHT.exact:t.INSIGHT.rough)+': know more"'):!/title=/.test(h)),
     'Insight at Scouting '+n+': the '+w.toLowerCase()+' read'+(l<2?', its tooltip "Scouting '+(l?t.INSIGHT.exact:t.INSIGHT.rough)+': know more"':', no tooltip')+' (thresholds '+t.INSIGHT.rough+', '+t.INSIGHT.exact+')')}

 // ---- robbing villagers: a holding not yours with workers at an estate
 const wt=t.TOWNS.find(x=>x.owner&&x.owner!=='player'&&!x.sacked&&!x.raided&&Object.keys(t.bldSpots(x)).some(k=>t.bldLv(x,k)&&t.ESTATES[k].work));
 const spawn=()=>{world();W.folk=[];t.FOLK_SEEN.clear();wt.fear=0;wt.lost={};delete wt.mem;wt.crime=null;P.hostile={};P.x=wt.x+30;P.y=wt.y+30;G.clock=t.DAY*.25;for(let i=0;i<300;i++)t.updateFolk(.05);
   const f=W.folk.find(x=>x.home===wt.name&&x.st==='in');P.x=f.x;P.y=f.y;return f};
 let f=spawn();ok(f&&wt,'workers at the estates of '+wt.name+' ('+W.folk.filter(x=>x.home===wt.name).length+')');
 // what a worker carries by what he is doing
 {const [g]=t.jobGood(wt,f.job);t.ensureEcon(wt);const bad=[];
   for(const st of ['in','out','town','back']){f.st=st;const L=t.ROB.loot[st==='back'?'town':st],gs=[],cs=[];
     for(let i=0;i<40;i++){wt.stock[g]=500;P.inv=P.inv.map(()=>null);const g0=P.gold;t.robTake(wt,f);gs.push(t.goodN(g));cs.push(P.gold-g0)}
     const r=[Math.min(...gs),Math.max(...gs),Math.min(...cs),Math.max(...cs)];if(r[0]<L.goods[0]||r[1]>L.goods[1]||r[2]<L.coins[0]||r[3]>L.coins[1]||(L.goods[1]?r[1]<1:r[1]>0))bad.push(st+' '+r.join('/'));info('a '+f.job+' '+st+': '+r[0]+'–'+r[1]+' '+g+', '+r[2]+'–'+r[3]+' coins')}
   const L=t.ROB.loot;ok(!bad.length&&L.in.goods+''==='1,2'&&L.in.coins+''==='1,3'&&L.out.goods+''==='3,6'&&L.out.coins+''==='2,5'&&L.town.goods+''==='0,0'&&L.town.coins+''==='6,15',
     'loot by state: at work 1–2 of his product and 1–3 coins, on the way 3–6 and 2–5, in town or going home only 6–15 coins'+(bad.length?': '+bad.join('; '):''));
   f.st='in';P.inv=P.inv.map(()=>null);ok(new RegExp('1–2 '+t.GOODS[g].n.toLowerCase()+', 1–3 coins').test(t.robCarries(wt,f))&&(f.st='town',/^6–15 coins$/.test(t.robCarries(wt,f))),'what he carries is shown as it goes by his state');f.st='in'}
 // whether they fight back: clamped, by numbers, nerve, fear and love
 {P.troops={hum_knight:80,hum_long:60};const lo=t.robOdds(wt,f);P.troops={};const R=t.ROB,k0=R.k;R.k=50;const hi=t.robOdds(wt,f);R.k=k0;
   ok(lo.ch===R.resist[0]&&hi.ch===R.resist[1]&&R.resist[0]===.05&&R.resist[1]===.9,'the chance they fight back stays between 5% and 90% (a huge band: '+Math.round(lo.ch*100)+'%; a lone hero against eager folk: '+Math.round(hi.ch*100)+'%)');
   ok(lo.ws.includes(f)&&lo.gs.length===t.estateGuards(wt,f.k).length&&lo.list.length===lo.ws.length+lo.gs.length&&lo.ws.every((x,i)=>t.ST[lo.list[i]].peasant===t.tradeOf(x)),
     'they fight as the workers within reach ('+lo.ws.length+', as their trade\'s peasants) and the estate\'s guards when he is near it ('+lo.gs.length+')');
   const r0=R.resist;R.resist=[0,1e9];P.troops={hum_knight:4};const raw=()=>t.robOdds(wt,f).ch,base=raw();
   wt.fear=G.day+3;const scared=raw();wt.fear=0;const p0=wt.pros;wt.pros=90;const loved=raw();wt.pros=Math.min(p0,60);const plain=raw();wt.pros=p0;const race=wt.races[0],n0=R.nerve[race];R.nerve[race]=n0*2;const bold=raw();R.nerve[race]=n0;R.resist=r0;
   ok(Math.abs(scared/plain-R.fear)<1e-9&&Math.abs(loved/plain-R.love)<1e-9&&Math.abs(bold/(p0>=R.loveAt?loved:plain)-2)<1e-9&&R.nerve.orc===1.4&&R.nerve.dwarf===1.2&&R.nerve.human===1&&R.nerve.elf===.9,
     'their nerve: by people (orcs ×1.4, dwarves ×1.2, humans ×1, elves ×.9), lower while they fear you (×'+R.fear+'), higher where they prosper (×'+R.love+')')}
 // Insight on the Rob action: vague, rough, exact
 {P.troops={hum_knight:6};const reads=[];for(const n of [0,3,6]){scout(n);world();t.workerMeet(f);const b=q('.rkact[data-act="wk-ask"][data-arg="rob"]');reads.push(b&&b.querySelector('small').innerHTML)}
   ok(/with (his|their) tools/.test(reads[0])&&!/%|look|cower|fight back/.test(reads[0].replace(/title="[^"]*"/,''))&&/Scouting 2/.test(reads[0])&&/(look ready to fight|may fight back|cower)/.test(reads[1])&&/Scouting 5/.test(reads[1])&&!/%/.test(reads[1])&&/\d+% they fight back/.test(reads[2])&&/power \d+ vs your \d+/.test(reads[2])&&!/title=/.test(reads[2]),
     'Rob shows the read under it: at Scouting 0 what anyone sees, at 3 how they look, at 6 their numbers and the chance ('+reads.map(r=>r.replace(/<[^>]+>/g,'')).join(' | ')+')');scout(0)}
 // Rob asks first; then they fight back: a battle with them (and the guards), as other fights start
 {world();P.troops={hum_knight:40,hum_long:30};t.workerMeet(f);t.act('wk-ask','rob');
   ok(q('#panel.confirm')&&q('.nav [data-nav="close"]').dataset.act==='wk-rob'&&q('.nav [data-nav="back"]').dataset.act==='wk-talk'&&/They carry/.test(text())&&!G.enc,'Rob asks first: what they carry and the read of them; Back to his talk');
   t.act('wk-talk');ok(G.wk===f&&q('.rkact[data-act="wk-ask"]'),'Back: his talk again');
   const od=t.robOdds(wt,f);rolls([0],()=>t.act('wk-rob'));const e=G.enc;
   ok(e&&e.kind==='villagers'&&e.mine&&e.ref.f===f&&e.list.join()===od.list.join()&&e.list.some(k=>t.ST[k].peasant)&&/fight back/.test(panel())&&/villagers/.test(text())&&q('[data-act="fight"]')&&q('[data-act="auto"]'),
     'they fight back: the encounter with '+e.list.length+' of them ('+Object.entries(t.countsOf(e.list)).map(([k,n])=>n+' '+t.ST[k].n).join(', ')+'), Fight or Auto-resolve');
   // won: the kill costs
   const rep0=t.repAt(wt.name),h0=t.honorWith(wt.owner),C=t.CONDUCT.killWorkers,ws=e.ref.ws.slice(),pop0=wt.pop;ok(!t.hostileTo(wt.owner),'(not yet hostile)');t.act('auto');
   const host=P.hostile[wt.owner]-G.day;
   ok(/Victory/.test(panel())&&t.repAt(wt.name)===rep0-C.rep&&t.honorWith(wt.owner)===h0-C.honor&&host>=C.hostile[0]&&host<=C.hostile[1]&&wt.fear===G.day+C.fear&&C.rep===20&&C.honor===8&&C.fear===5,
     'beaten, killing them costs: reputation −'+C.rep+', honor −'+C.honor+', fear '+C.fear+' days, the '+t.FACS[wt.owner].n+' hostile '+host+' days ('+C.hostile.join('–')+')');
   ok(ws.every(x=>!W.folk.includes(x))&&wt.pop<pop0&&wt.mem[f.k]===G.day+t.ROB.estate&&/from the dead/.test(panel()),'the dead are gone, and their estate remembers you for '+t.ROB.estate+' days');done()}
 // they win, or you call it off: reputation −8 and their guards want you; nothing taken
 {f=spawn();P.troops={hum_knight:6};rolls([0],()=>{t.workerMeet(f);t.act('wk-rob')});const rep0=t.repAt(wt.name),g0=P.gold;t.act('flee');
   ok(!G.enc&&t.repAt(wt.name)===rep0-t.CONDUCT.robFailed.rep&&t.crimeAt(wt)&&t.crimeAt(wt).until>=G.day+t.ROB.hostile&&P.gold===g0&&t.remembers(wt,f)&&wt.mem[f.id]===G.day+t.ROB.memory,
     'you flee them: reputation −'+t.CONDUCT.robFailed.rep+', the guards of '+wt.name+' want you '+t.ROB.hostile+' days, nothing taken, and he remembers you');
   f=spawn();rolls([0],()=>{t.workerMeet(f);t.act('wk-rob')});const rep1=t.repAt(wt.name);t.concludeEncounter(false,{},0,true,[]);
   ok(/Defeat/.test(panel())&&t.repAt(wt.name)===rep1-t.CONDUCT.robFailed.rep&&t.crimeAt(wt),'they beat you: the same');done()}
 // given in: the old costs, and the memory: 5 days, then it clears
 {f=spawn();P.troops={hum_knight:6};const rep0=t.repAt(wt.name);t.workerMeet(f);rolls([.999],()=>t.act('wk-rob'));const d0=G.day;
   ok(/Robbed/.test(panel())&&t.repAt(wt.name)===rep0-t.CONDUCT.robWorker.rep&&wt.mem[f.id]===d0+5&&t.ROB.memory===5,'they give in: you take it (reputation −'+t.CONDUCT.robWorker.rep+'), and he remembers you 5 days');
   const other=W.folk.find(x=>x.home===wt.name&&x.k===f.k&&x!==f);
   world();t.workerMeet(f);const rob=q('.rkact[data-act="wk-ask"][data-arg="rob"]'),hire=q('.rkact[data-act="wk-hire"]');
   ok(t.WARY_SAY.some(s=>text().includes(s))&&rob.disabled&&/nothing left to give you/.test(rob.textContent)&&hire.disabled&&/will not follow you/.test(hire.textContent)&&/remember what you did/.test(text()),
     'while he remembers: a bitter word ("'+t.WARY_SAY.find(s=>text().includes(s))+'"), Rob greyed ("They have nothing left to give you"), Hire refused');
   {const g0=P.gold,n0=t.troopCount();t.act('wk-rob');t.act('wk-hire');ok(P.gold===g0&&t.troopCount()===n0&&!G.enc&&t.workerRecruitWhy(wt,f)==='They will not follow you','and neither robbing nor hiring him works (nor recruiting him at his estate)')}
   if(other){world();t.workerMeet(other);ok(!q('.rkact[data-act="wk-ask"][data-arg="rob"]').disabled,'a fellow he works with is not robbed: he does not remember you')}
   G.day=d0+4;ok(t.remembers(wt,f),'4 days on, he still remembers');G.day=d0+5;world();t.workerMeet(f);ok(!t.remembers(wt,f)&&!q('.rkact[data-act="wk-ask"][data-arg="rob"]').disabled&&!t.WARY_SAY.some(s=>text().includes(s)),'5 days on, he has forgotten: talk and Rob as before');world()}
 // press-gang: asks first, and the whole estate remembers you 10 days
 {f=spawn();P.troops={hum_knight:4};t.workerMeet(f);t.act('wk-ask','press');ok(q('#panel.confirm')&&q('.nav [data-nav="close"]').dataset.act==='wk-press','Press-gang asks first');
   t.act('wk-press');const mates=W.folk.filter(x=>x.home===wt.name&&x.k===f.k);ok(wt.mem[f.k]===G.day+10&&mates.every(x=>t.remembers(wt,x)),'press-ganged: his estate remembers you 10 days ('+mates.length+' left there remember)');
   // saved (holdings.js saveRec: m, only while someone remembers), and back on a load
   world();t.saveGame(true,'3');const rec=t.readSlot('3').world.own,mine=rec.find(x=>x[2]===wt.name)[3],other=rec.find(x=>x[2]!==wt.name)[3];
   ok(mine.m&&mine.m[f.k]===wt.mem[f.k]&&!('m' in other),'saved with the holding (none kept where nobody remembers you)');
   const want=JSON.stringify(wt.mem);delete wt.mem;t.loadGame('3');ok(JSON.stringify(t.townBy(wt.name).mem)===want,'and back after a load');world()}

 // ---- ruins: the treasure once; then occupants after the cooldown
 const ruins=()=>W.sites.filter(s=>s.type==='ruins'),R0=ruins()[0];
 const fresh=r=>{r.cleared=false;r.looted=false;delete r.occ;delete r.guard;delete r.stirs;r.cyc=0;r.back=0;r.seen=true};
 const enter=r=>{world();G.lastSite=null;return t.enterSite(r)};
 const strong=()=>{P.troops={hum_knight:40,hum_long:30};P.hp=null;t.vitals();P.prisoners={}};
 {const r=R0;fresh(r);scout(0);enter(r);ok(G.site===r&&acts()==='site-search:q,site-lore:w','unsearched ruins: Search (Q) and Read the walls (W)');
   const g0=P.gold;rolls([.5],()=>t.act('site-search'));ok(r.looted&&r.cleared&&r.back===G.day+40&&P.gold>g0&&/sealed chest/.test(panel()),'searched: the treasure, and it lies empty 40 days');
   const seen=[];let search=0;for(let i=0;i<24;i++){world();G.day=Math.max(G.day,r.back);t.siteDay();if(r.cleared)continue;seen.push(r.occ.k);enter(r);if(q('.rkact[data-act="site-search"]'))search++;
     if(i%3===0&&!r.occSite)r.occGone()}
   ok(!search&&seen.length>=8&&r.looted,'it never refills: '+seen.length+' later visits, no Search (who came: '+[...new Set(seen)].join(', ')+')');
   {const g1=P.gold;enter(r);t.act('site-search');ok(P.gold===g1&&!G.enc,'and searching again finds nothing')}}
 // occupants: seeded by ruin and cycle, by climate and land
 {const r=R0,fake=(x,y,seed,cyc)=>({i:r.i,tx:Math.floor(x/t.TILE),ty:Math.floor(y/t.TILE),x,y,seed,cyc,name:r.name,back:G.day+40});
   const a=rolls([.1,.2,.3],()=>t.ruinOccupant(fake(r.x,r.y,r.seed,3)).k),b=rolls([.9,.8,.7],()=>t.ruinOccupant(fake(r.x,r.y,r.seed,3)).k),c=[1,2,3,4,5,6,7,8].map(n=>t.ruinOccupant(fake(r.x,r.y,r.seed,n)).k);
   ok(a===b&&new Set(c).size>1,'who comes is seeded by the ruin and its cycle, never Math.random (cycle 3: '+a+' both times; cycles 1–8: '+c.join(', ')+')');
   const spot=(c,held)=>{for(let ty=2;ty<t.MH-2;ty+=3)for(let tx=2;tx<t.MW-2;tx+=3){const x=(tx+.5)*t.TILE,y=(ty+.5)*t.TILE;if(t.climAt(x,y)===c&&!!t.landHold(x,y)===held)return[x,y]}return null};
   const share=(c,held,k)=>{const p=spot(c,held);if(!p)return null;let n=0;for(let i=1;i<=300;i++)if(t.ruinOccupant(fake(p[0],p[1],1000+i*7,i)).k===k)n++;return n/300};
   const rows=[['cultists','swamp','grass',false],['creatures','frost','grass',false],['hunters','desert','grass',false],['refugees','frost','desert',false]].map(([k,hi,lo,h])=>[k,hi,lo,share(hi,h,k),share(lo,h,k)]);
   const land=[share('grass',true,'refugees'),share('grass',false,'refugees')];
   const okRows=rows.filter(x=>x[3]!=null&&x[4]!=null);
   ok(okRows.length>=2&&okRows.every(x=>x[3]>x[4])&&(land[0]==null||land[1]==null||land[0]>land[1]),'by climate and land: '+okRows.map(x=>x[0]+' '+Math.round(x[3]*100)+'% in '+x[1]+' vs '+Math.round(x[4]*100)+'% in '+x[2]).join('; ')+'; refugees '+land.map(x=>x==null?'-':Math.round(x*100)+'%').join(' on held land vs ')+' in the wild')}
 // each occupant's page and actions
 const occupy=k=>{const r=R0;fresh(r);r.looted=true;r.cyc=1;r.back=G.day+40;const oc={k},O=t.RUIN_OCC[k];if(O.make)O.make(r,oc,t.seeded(99));r.occ=oc;enter(r);return r};
 const page=(r,k)=>q('.rwin h2')&&q('.rwin h2').textContent===r.name&&text().includes(t.RUIN_OCC[k].line)&&q('.nav [data-nav="close"]').dataset.act==='site-leave';
 {const r=occupy('refugees'),fac=t.ruinRealm(r),C=t.CONDUCT.helpRefugees;ok(page(r,'refugees')&&acts()==='site-help=gold:q,site-help=food:w,site-chase:e'&&q('.rwbody .rcard'),'refugees: their card; Give, Feed, Chase off');
   const g0=P.gold,h0=fac?t.honorWith(fac):0;t.act('site-help','gold');ok(P.gold===g0-C.gold&&(!fac||t.honorWith(fac)===h0+C.honor)&&r.cleared&&/Only wind/.test(text()),'Give: '+C.gold+' gold, honor +'+C.honor+(fac?' with the '+t.FACS[fac].n:'')+', and they go: the ruins empty');
   occupy('refugees');t.invAdd('good','grain',10);const f0=t.foodN();t.act('site-help','food');ok(t.foodN()===f0-C.food&&r.cleared,'Feed: '+C.food+' food');
   occupy('refugees');const h1=fac?t.honorWith(fac):0;t.act('site-chase');ok(q('#panel.confirm')&&q('.nav [data-nav="close"]').dataset.act==='site-chased'&&!r.cleared,'Chase off asks first');
   t.act('site-chased');ok((!fac||t.honorWith(fac)===h1-t.CONDUCT.chaseRefugees.honor)&&r.cleared,'chased off: honor −'+t.CONDUCT.chaseRefugees.honor)}
 {const r=occupy('travellers');ok(G.mode==='site'&&q('#panel.railed')&&qa('.rail-i .ri-n').map(b=>b.textContent).join()==='Wagons,Campfire'&&text().includes(t.RUIN_OCC.travellers.line)&&r.occ.s instanceof t.TravellersCamp&&r.occ.s.until===r.back,'travellers: the travellers\' rail, Wagons and Campfire');
   t.act('site-tab','trade');const g=Object.keys(r.occ.s.stock)[0],n0=t.goodN(g);P.inv=P.inv.map(()=>null);t.act('site-buy',g);ok(t.goodN(g)>0&&G.siteTab==='trade','and their wagons trade')}
 {const r=occupy('hermit');ok(page(r,'hermit')&&acts()==='site-hermit=rumour:q,site-hermit=lore:w','a hermit: Ask (rumours) or Listen (lore)');
   const g0=P.gold,x0=P.xp;t.act('site-hermit','lore');ok(P.gold===g0-t.RUIN.hermit.lore&&qa('.rwbody .rkact').every(b=>b.disabled)&&/old kings/.test(text()),'lore for '+t.RUIN.hermit.lore+' gold, then he has said his piece: once a visit');
   enter(r);ok(qa('.rwbody .rkact').every(b=>!b.disabled),'(another visit, another word)');const un=W.sites.filter(s=>!s.seen&&s.scoutable).length;t.act('site-hermit','rumour');ok(W.sites.filter(s=>!s.seen&&s.scoutable).length===un-1||!un,'rumours put a place on your map')}
 {const r=occupy('hunters'),other=ruins().find(x=>x!==r);other.seen=false;ok(page(r,'hunters')&&acts()==='site-hunt=talk:q,site-hunt=find:w,site-hunt=map:e','treasure hunters: Talk, Trade (their find), Buy (their map)');
   const g0=P.gold,un=ruins().filter(x=>!x.seen).length;t.act('site-hunt','map');ok(P.gold===g0-t.RUIN.map&&ruins().filter(x=>!x.seen).length===un-1&&q('.rkact[data-act="site-hunt"][data-arg="map"]').disabled,'their map shows ruins you had not found ('+t.RUIN.map+' gold, once)');
   P.inv=P.inv.map(()=>null);const id=r.occ.find;t.act('site-hunt','find');ok(t.invCount('gear',id)===1&&r.occ.sold,'their find, bought ('+t.ITEMS[id].n+')');t.act('site-hunt','talk');ok(q('.rkact[data-act="site-hunt"][data-arg="talk"]').disabled,'talk once a visit')}
 {const r=occupy('bandits');ok(page(r,'bandits')&&acts()==='site-scout:q,site-ask:w,site-tab=parley:e'&&r.occ.s instanceof t.Hideout,'bandits: the bandit camp\'s page, Scout, Attack, Parley');
   t.act('site-tab','parley');ok(q('.rwin h2').textContent==='Parley'&&q('.rkact[data-act="site-pay"]'),'and its parley');t.act('site-tab','home');
   strong();t.act('site-attack');ok(G.enc&&G.enc.kind==='camp'&&G.enc.ref===r.occ.s,'Attack: their fight');t.act('auto');ok(/Victory/.test(panel())&&!/chest holds/.test(panel()),'beaten: their loot, not the ruin\'s treasure');done();
   t.siteDay();ok(r.cleared&&r.back===G.day+40,'and the ruins lie empty a cooldown')}
 {const r=occupy('creatures');ok(page(r,'creatures')&&acts()==='site-scout:q,site-ask:w'&&r.occ.s instanceof t.Cave&&/cellars of the/.test(text())&&!/a chest/.test(text()),'creatures: the cave\'s page (Scout, Enter), in the cellars, no chest of their own');
   strong();t.act('site-fight');ok(G.enc&&G.enc.kind==='cave'&&G.enc.ref===r.occ.s,'Enter: their fight');t.act('auto');ok(/Victory/.test(panel())&&!/chest holds/.test(panel()),'beaten: their trophies only');done();enter(r);ok(r.cleared&&G.mode==='world','then it lies empty')}
 for(const k of ['cultists','robbers']){const r=occupy(k);ok(page(r,k)&&acts()==='site-ask:q','the '+t.RUIN_OCC[k].say[1]+': Attack');t.act('site-ask');ok(q('#panel.confirm')&&q('.nav [data-nav="close"]').dataset.act==='site-attack','it asks first');
   strong();t.act('site-attack');ok(G.enc&&G.enc.kind==='ruin'&&G.enc.ref===r&&G.enc.list.length===r.occ.list.length,'a fight with '+G.enc.list.length);const g0=P.gold;t.act('auto');ok(/purse of \d+ gold/.test(panel())&&P.gold>g0&&r.cleared&&!/chest holds/.test(panel()),'beaten: their purse (and maybe a find), never the treasure');done()}
 {const r=occupy('empty');ok(page(r,'empty')&&!qa('.rwbody .rkact').length&&/Only wind in the stones/.test(text()),'empty: only wind in the stones, nothing to do')}
 // saved: the occupants, as their own site
 {const r=occupy('bandits');world();t.saveGame(true,'3');t.loadGame('3');const r2=W.sites.find(x=>x.type==='ruins'&&x.i===r.i);ok(r2.occ.k==='bandits'&&r2.occ.s instanceof t.Hideout&&r2.looted,'occupants survive a save and load')}

 // ---- guardians (back to the early days: their level grows with them)
 G.day=5;const R1=ruins()[1]||ruins()[0];
 {const r=R1;fresh(r);strong();enter(r);rolls([0,.99,.99],()=>t.act('site-search'));const e=G.enc;
   ok(e&&e.kind==='cave'&&e.ref===r&&e.sealed&&!G.site&&q('[data-act="flee"]').disabled&&/bar the way out/.test(q('[data-act="flee"]').title),'woken (heard too late, not quiet enough): the fight at once, no leaving');
   t.act('flee');ok(G.enc===e,'(Leave does nothing)');t.act('auto');ok(/Victory/.test(panel())&&/chest holds/.test(panel())&&r.looted&&!r.guard,'beaten: their treasure, guaranteed');done()}
 // awareness: warned, you may leave; Search anyway; stealth takes it unheard
 {const r=R1;fresh(r);enter(r);rolls([0,0],()=>t.act('site-search'));ok(!G.enc&&r.stirs&&G.site===r&&/Something stirs below/.test(text())&&q('.rkact[data-act="site-search"] b').textContent==='Search anyway'&&!r.looted,'Awareness: "Something stirs below…", no fight; Search anyway or Leave');
   t.act('site-leave');enter(r);ok(r.stirs&&q('.rkact[data-act="site-search"] b').textContent==='Search anyway','(it stays stirring: leaving and coming back rolls nothing new)');
   rolls([.5,0],()=>t.act('site-search'));ok(!G.enc&&r.looted&&/slip past/.test(text()),'Search anyway, quiet enough: the treasure, unheard')}
 {const r=R1;fresh(r);enter(r);rolls([0,.99,0],()=>t.act('site-search'));ok(!G.enc&&r.looted&&/slip past/.test(text()),'Stealth: unwarned but unheard, you take it without waking them')}
 // lore: what guards it, and the fight is that one
 {const r=R1;fresh(r);enter(r);rolls([0],()=>t.act('site-lore'));const y=G.siteSpy,U=y&&t.ST[t.MONSTERS[y.id].unit];
   ok(y&&y.ok&&y.id&&y.n&&y.lv&&/What the carvings say/.test(text())&&q('.rwbody .rcard')&&text().includes(U.n)&&q('.rkact[data-act="site-lore"]').disabled,'Lore: the carvings tell what guards it ('+y.n+' × '+U.n+', level '+y.lv+'); once a visit');
   strong();rolls([0,.99,.99],()=>t.act('site-search'));ok(G.enc&&G.enc.lv===y.lv&&G.enc.list.length===y.n&&G.enc.list[0]===t.MONSTERS[y.id].unit,'and woken, they are what the carvings said');t.act('auto');done()}
 {const r=R1;fresh(r);enter(r);rolls([.99],()=>t.act('site-lore'));ok(!t.G.siteSpy.ok&&/too worn/.test(text())&&q('.rkact[data-act="site-lore"]').disabled,'Lore failed: too worn to read')}
 // the checks, as Insight shows them
 {const r=R1;fresh(r);const reads=[];for(const n of [0,6]){scout(n);enter(r);reads.push([q('.rkact[data-act="site-search"] small').innerHTML,q('.rkact[data-act="site-lore"] small').innerHTML])}scout(0);
   ok(!/%/.test(reads[0].join())&&/Scouting 2/.test(reads[0][0])&&/\d+% to hear them stir/.test(reads[1][0])&&/\d+% unheard/.test(reads[1][0])&&/\d+% to read them/.test(reads[1][1]),'the checks by Insight: no odds at Scouting 0, the chances at 6 ('+reads[1].map(x=>x.replace(/<[^>]+>/g,'')).join(' | ')+')')}
 // withdrawn from: the ruin remembers them; Attack or Leave, no new roll
 {const r=R1;fresh(r);strong();enter(r);rolls([0,.99,.99],()=>t.act('site-search'));const e=G.enc,n=e.list.length,lv=e.lv,id=r.id;
   t.concludeEncounter(false,{},0,false,[],{caught:0,got:1,standing:n,fallen:0});ok(r.guard&&r.guard.id===id&&r.guard.n===n&&r.guard.lv===lv&&!r.looted,'withdrawn: the ruin remembers them ('+n+' × '+t.ST[t.MONSTERS[id].unit].n+', level '+lv+')');done();
   enter(r);const U=t.ST[t.MONSTERS[id].unit].n;ok(acts()==='site-ask:q'&&text().includes('Guardians: '+n+' × '+U+', level '+lv)&&q('.nav [data-nav="close"]').dataset.act==='site-leave'&&!q('.rkact[data-act="site-search"]'),'the page shows them: "Guardians: '+n+' × '+U+', level '+lv+'", Attack and Leave only');
   t.act('site-leave');enter(r);ok(r.guard.n===n&&r.guard.lv===lv&&text().includes('level '+lv),'no new roll on another visit');
   t.act('site-ask');ok(q('#panel.confirm')&&q('.nav [data-nav="close"]').dataset.act==='site-fight','Attack asks first');t.act('site-fight');
   ok(G.enc&&G.enc.lv===lv&&G.enc.list.length===n&&!G.enc.sealed,'the fight with them as they were');t.concludeEncounter(false,{},0,true,[]);ok(r.guard&&r.guard.n===n,'beaten by them: still remembered');done();
   strong();enter(r);t.act('site-fight');t.act('auto');ok(/Victory/.test(panel())&&/chest holds/.test(panel())&&!r.guard&&r.looted,'beaten at last: the treasure');done()}
 // a camp's and a cave's page before your scouts look, and a parley's odds, by Insight
 {const c=t.camps()[0],cv=W.sites.find(s=>s.type==='cave');c.cleared=false;c.bands=[];cv.cleared=false;cv.seen=true;const M=t.MONSTERS[cv.id],out=[];
   for(const n of [0,3,6]){scout(n);enter(c);const a=q('.pg-facts').textContent;enter(cv);out.push([a,q('.rwbody').textContent])}scout(0);
   const g=c.guess();ok(!new RegExp(t.roughly(g.n),'i').test(out[0][0])&&!/look/.test(out[0][0])&&new RegExp(t.roughly(g.n),'i').test(out[1][0])&&/look/.test(out[1][0])&&new RegExp(g.n+' ').test(out[2][0])&&/power \d+ vs your \d+/.test(out[2][0]),'a camp: tents at 0, a rough count and how they look at 3, their numbers and power at 6');
   ok(!out[0][1].includes(t.ST[M.unit].n.toLowerCase())&&!/\b(a few|several|many|one or two)\b/.test(out[0][1])&&/(a few|several|many|one or two)/.test(out[1][1])&&out[2][1].toLowerCase().includes(t.ST[M.unit].n.toLowerCase()),'a cave: tracks at 0, how big and how many at 3, what lairs there at 6');
   P.troops={hum_knight:60,hum_long:40};const ys=[];for(const n of [0,6]){scout(n);enter(c);t.act('site-tab','parley');ys.push(q('.rkact[data-act="site-yield"] small').textContent)}scout(0);
   ok(!/%/.test(ys[0])&&/\d+% they yield/.test(ys[1]),'Parley: the odds of surrender only at 6 ('+ys.join(' | ')+')');world()}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
