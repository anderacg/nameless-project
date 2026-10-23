'use strict';
// News in three classes (world/news.js, world/worldlog.js; the owner 2026-10-23: news spreads the way it did in medieval times).
// Proclamations (war, peace, alliances, a realm fallen, a holding taken) spread free as a wave from where they happened (a day per
// PROCLAIM.tiles tiles to a holding, slower over the land, a village later): heard at a holding it has reached (the crier: on
// entering, or each hour at its gates) or from anyone met whose place it has reached, never against a cap, then heard; your
// realm's rider still brings its own. Common talk: the capped rumours, vaguer with distance and age. Intelligence: bought at a
// tavern (Buy information), precise and current, priced by value and tier, once a day, none when nothing is known. Saved mid-wave.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,PR=t.PROCLAIM,I=t.INTEL,q=Kit.q;
 window.requestAnimationFrame=()=>0;
 Kit.begin('soldier',61);Kit.clear();Kit.world();P.fac=null;P.hostile={};P.siege=null;G.clock=t.DAY*.3;
 const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),fresh=()=>{t.newsLoad(null);G.msgs=[]},said=re=>G.msgs.filter(r=>re.test(r.m)),heard=it=>W.news.heard[it.id]!=null;
 const base=Math.floor(t.Clock.hours()),day0=G.day,clock0=G.clock,at=h=>{const H=base+h;G.day=Math.floor(H/24);G.clock=(H-G.day*24)/24*t.DAY},back=()=>{G.day=day0;G.clock=clock0};
 const live=()=>t.TOWNS.filter(h=>!h.gone&&h.owner&&h.owner!=='player');
 const A=live()[0],byA=live().filter(h=>h!==A).sort((p,q)=>d(p,A)-d(q,A));
 // nowhere near a holding (no crier), your sight far from all of it
 const away=()=>Kit.goTo(-900,-900);away();
 const fell=()=>t.newsRecord('fell',A,{town:A.name,fac:A.owner,lord:'Lord X',sacked:0});

 // ---- each class's route
 {fresh();const [a,b]=t.FIDS.filter(f=>!W.dead[f]),r0=t.relOf(a,b).s;t.setRel(a,b,r0==='war'?'peace':'war');
  const w=W.news.items.find(x=>['war','peace'].includes(x.k));
  ok(w&&t.newsProc(w)&&w.h===Math.floor(t.Clock.hours())&&!heard(w)&&!said(/war|truce/).length,'a war or peace far off: a proclamation ('+(w&&w.k)+'), its hour kept (h '+(w&&w.h)+'), not heard, not logged');
  t.setRel(a,b,r0);fresh();
  ok(PR.kinds.join()==='war,peace,ally,realm,fell'&&Object.keys(t.NEWS_KINDS).filter(k=>!PR.kinds.includes(k)).every(k=>!t.newsProc({k})),'proclamations: '+PR.kinds.join(', ')+'; every other kind common talk ('+Object.keys(t.NEWS_KINDS).filter(k=>!PR.kinds.includes(k)).join(', ')+')');
  const p=fell(),c=t.newsRecord('beast',{x:A.x+20,y:A.y+16},{id:'wolf',n:4}),cs=t.rumourCands(t.rumourSource('tavern',A.name,A));
  ok(cs.includes(c)&&!cs.includes(p),'a tavern\'s rumours (capped) offer the beast, never the proclamation');
  ok(Object.keys(t.INTEL_KINDS).join()==='siege,hideout,march,lord,caravan'&&Object.values(t.INTEL_KINDS).every(K=>K.of&&K.say)&&!Object.keys(t.INTEL_KINDS).some(k=>PR.kinds.includes(k)),'intelligence is its own: '+Object.keys(t.INTEL_KINDS).join(', ')+' (worked out from the world, never a news item)')}

 // ---- the wave: holdings reached over the days by distance, near ones first
 {fresh();back();const it=fell(),all=live(),days=h=>t.proclaimDays(it,h),C=byA.find(h=>h.kind!=='village')||byA[0];
  const want=Math.min(d(it,C)/t.TILE/PR.wild,d(it,C)/t.TILE/PR.tiles+(PR.lag[C.kind]||0));
  ok(Math.abs(days(C)-want)<1e-9&&days(A)<.01,'its days by formula: '+C.name+' ('+C.kind+', '+Math.round(d(it,C)/t.TILE)+' tiles) '+days(C).toFixed(2)+' days; '+A.name+', where it happened, 0');
  const V=byA.find(h=>h.kind==='village'),Vd=V&&d(it,V)/t.TILE;
  ok(!V||Math.abs(days(V)-Math.min(Vd/PR.wild,Vd/PR.tiles+PR.lag.village))<1e-9,V?'a village waits '+PR.lag.village+' days more by the roads: '+V.name+' '+days(V).toFixed(2)+' days':'(no village)');
  const n=h=>{at(h);return all.filter(x=>t.proclaimReached(it,x)).length},cnt=[1,24,48,96,192].map(n);
  ok(cnt.every((c,i)=>!i||c>=cnt[i-1])&&cnt[0]>=1&&cnt[4]>cnt[1],'holdings reached after an hour, 1, 2, 4 and 8 days: '+cnt.join(', ')+' of '+all.length);
  at(24);const same=all.filter(h=>h.kind===C.kind),inn=same.filter(h=>t.proclaimReached(it,h)),out=same.filter(h=>!t.proclaimReached(it,h));
  ok(!inn.length||!out.length||Math.max(...inn.map(h=>d(h,it)))<Math.min(...out.map(h=>d(h,it))),'after a day, every '+C.kind+' reached is nearer than every one not ('+inn.length+' in, '+out.length+' out)');
  const far=all.slice().sort((p,q)=>days(q)-days(p))[0];info('the last holding it reaches: '+far.name+' ('+far.kind+'), '+days(far).toFixed(1)+' days');
  const past=R=>{const k=20*t.TILE/d(R,it);return {x:R.x+(R.x-it.x)*k,y:R.y+(R.y-it.y)*k}},R=byA.find(h=>t.newsNear(past(h))===h),wp=R&&past(R);
  if(R)ok(t.proclaimDays(it,wp)>days(R)+1,'the wilds 20 tiles past '+R.name+' (its nearest) hear later: '+t.proclaimDays(it,wp).toFixed(2)+' days, '+R.name+' '+days(R).toFixed(2));
  else info('(no holding has the point past it as its own)');back()}

 // ---- heard: free at a reached holding (the crier), and from a traveller who came from one; not at an unreached village
 {fresh();back();const it=fell(),V=byA.filter(h=>h.kind==='village').pop()||byA[byA.length-1],Vh=t.proclaimDays(it,V)*24,R=byA[0],Rh=t.proclaimDays(it,R)*24;
  ok(Vh>Rh+2,'the far '+V.kind+' '+V.name+' hears it after '+(Vh/24).toFixed(1)+' days, '+R.name+' after '+(Rh/24).toFixed(1));
  at(Math.ceil(Rh));G.msgs=[];Kit.world();t.enterTown(V);t.act('leave');Kit.world();away();
  ok(!said(/^Proclamation/).length&&!heard(it),'entering '+V.name+' before it has reached it: nothing heard');
  t.enterTown(R);const m=said(/^Proclamation \(the crier of /)[0];t.act('leave');Kit.world();away();
  ok(m&&m.m==='Proclamation (the crier of '+R.name+'): '+t.proclaimText(it)&&m.kind==='war'&&heard(it),'entering '+R.name+', reached: "'+(m&&m.m)+'", heard');
  G.msgs=[];t.enterTown(R);t.act('leave');Kit.world();away();ok(!said(/^Proclamation/).length,'heard once: not told again');
  // (a caravan master out of a reached holding, met far away; a peddler where it has not reached)
  fresh();back();const it2=fell();at(Math.ceil(Rh));const spot={x:V.x+20,y:V.y+16},road=t.rumourFrom(t.rumourSource('road',91,spot));
  ok(!road.proc.length&&!heard(it2),'a peddler by '+V.name+', not reached: he does not know it');
  const cv=t.rumourFrom(t.rumourSource('caravan',R.name+'>'+V.name,[spot,R,V],{from:'a caravan master'}));
  ok(cv.proc.length===1&&heard(it2)&&said(/^Proclamation \(a caravan master\): /).length===1,'a caravan master come from '+R.name+' tells it, there by '+V.name+': "'+(said(/^Proclamation \(a/)[0]||{}).m+'"');
  fresh();back();const it3=fell();at(Math.ceil(Rh));const L=W.lords.find(l=>!l.dead);Object.assign(L,{x:R.x,y:R.y});
  ok(t.rumourSay(t.rumourSource('lord',L.id,L,{fac:L.fac,from:L.name}))===t.proclaimText(it3)&&heard(it3),'a lord met by '+R.name+' says it first: "'+t.proclaimText(it3)+'"');L.x=L.y=-9999;
  fresh();back();const it4=fell();at(Math.ceil(Rh));Kit.goTo(R.x,R.y+20);P.x=R.x;P.y=R.y+10;t.wlHour();ok(said(/^Proclamation \(the crier of /).length===1&&heard(it4),'each hour at '+R.name+'\'s gates: the crier ("riders" by the hour)');away();back()}

 // ---- not against the caps
 {fresh();back();const it=fell(),R=byA[0];['siege','beast','caravan'].forEach((k,i)=>t.newsRecord(k,{x:R.x+10+i*30,y:R.y+12},{town:R.name,fac:R.owner,lord:'Lord Q',id:'wolf',n:4,from:R.name}));
  at(Math.ceil(t.proclaimDays(it,R)*24));const r=t.rumourFrom(t.rumourSource('tavern',R.name,R,{from:'the tavern of '+R.name})),told=W.news.told['tavern:'+R.name];
  ok(r.proc.length===1&&r.fresh.length===2&&told.ids.length===2&&!told.ids.includes(it.id)&&heard(it),'the tavern of '+R.name+': the proclamation free, and still its 2 rumours ('+r.fresh.map(x=>x.k).join(', ')+')');
  ok(!r.before.includes(it)&&!t.rumourHtml(r).includes(t.proclaimText(it)),'nor listed among the rumours heard before');back()}

 // ---- the rider still brings your realm's, and it is heard
 {fresh();back();P.fac=A.owner;const w=t.FIDS.find(f=>f!==A.owner&&!W.dead[f]),r0=t.relOf(A.owner,w).s;t.setRel(A.owner,w,r0==='war'?'peace':'war');
  const it=W.news.items.find(x=>['war','peace'].includes(x.k)),r=(W.news.post||[])[0];
  ok(it&&r&&heard(it)&&!G.msgs.length,'your realm\'s '+(it&&it.k)+': a rider sets out, and it is heard already');
  at(456);const R=byA[0],got=t.proclaimAt(R);ok(t.proclaimReached(it,R)&&!got.includes(it),'the crier of '+R.name+', reached, does not tell it again');
  G.msgs=[];G.day=Math.floor(r.due/24);G.clock=(r.due-G.day*24)/24*t.DAY;t.wlArrive();ok(said(/^A rider from /).length>=1,'the rider comes in: "'+(said(/^A rider from /)[0]||{}).m+'"');
  t.setRel(A.owner,w,r0);P.fac=null;back()}

 // ---- common talk: vaguer with distance and age
 {fresh();const C=byA[0],it=t.newsRecord('band',{x:C.x+30,y:C.y+16},{label:'Bandits',n:12,chief:''}),V=t.NEWS_VAGUE;
  Kit.goTo(C.x,C.y+20);const v0=t.newsVague(it);
  const far=live().slice().sort((p,q)=>d(q,C)-d(p,C))[0];Kit.goTo(far.x,far.y+20);const vf=t.newsVague(it),fd=d(it,P),want=Math.min(V.max,Math.floor(fd/(V.tiles*t.TILE)));
  Kit.goTo(C.x,C.y+20);G.day+=4;const va=t.newsVague(it);G.day-=4;
  ok(v0===0&&vf===want&&vf>=1&&va===2,'its vagueness: 0 by '+C.name+', '+vf+' from '+far.name+' ('+Math.round(fd/t.TILE)+' tiles), 2 four days on');
  ok(t.newsMany(12,0)==='a dozen'&&t.newsMany(12,1)==='a score'&&t.newsMany(12,3)==='scores'&&t.newsMany(40,3)==='hundreds','numbers swell: 12 is "a dozen", "a score" (1), "scores" (3); 40 at 3 "hundreds"');
  const w0=t.newsWhere(it,false,0),w1=t.newsWhere(it,false,1),w2=t.newsWhere(it,false,2),w3=t.newsWhere(it,false,3);
  ok(w0!==w3&&/^somewhere about /.test(w2)&&/lands of the |wilds/.test(w3)&&!/’s /.test(w1),'places rougher: "'+[w0,w1,w2,w3].join('" / "')+'"');
  const s=v=>({where:t.newsWhere(it,false,v),road:t.newsWhere(it,true,v),when:t.newsWhen(it,v),v}),say=v=>t.NEWS_KINDS.band.say[0](it.detail,s(v));
  ok(/a dozen strong/.test(say(0))&&/scores strong/.test(say(3)),'the band, near and fresh: "'+say(0)+'"; far and old: "'+say(3)+'"');
  Kit.goTo(far.x,far.y+20);G.day+=2;t.rumourHear(it,t.rumourSource('tavern',far.name,far));const m=said(/^Rumour/)[0],lv=W.news.v&&W.news.v[it.id];
  ok(lv===t.newsVague(it)&&lv>=2&&m&&m.m.endsWith(t.rumourText(it))&&t.rumourText(it)===t.rumourText(it,lv),'heard far off two days on: kept at level '+lv+', told so in the log and after ("'+(m&&m.m)+'")');
  G.day-=2;away()}

 // ---- intelligence: Buy information at a tavern
 {fresh();const T0=live().filter(h=>h.T.tabs.includes('tavern')).sort((p,q)=>q.T.tier-p.T.tier)[0],near=x=>d(x,T0)<=I.r;
  W.lords.forEach(l=>{l.x=-9999;l.y=-9999;l.inside=null;l.state='rest';l.fight=null});W.caravans=[];
  const hide=W.sites.filter(s=>s.type==='hideout'&&!s.cleared&&!s.seen),hs=hide.map(s=>[s,s.x,s.y]);hide.forEach(s=>{s.seen=true});
  P.gold=1000;Kit.world();t.enterTown(T0);t.act('tab','tavern');const btn=()=>q('#panel [data-act="intel-pick"]');
  ok(btn()&&btn().disabled&&btn().title==='They know nothing worth the gold'&&!t.intelGather(t.intelSrc(T0)).length,'nothing to know near '+T0.name+': Buy information greyed ("'+(btn()&&btn().title)+'")');
  t.act('leave');Kit.world();
  const S=live().filter(h=>h!==T0&&near(h)).sort((p,q)=>d(p,T0)-d(q,T0))[0]||T0,F=live().filter(h=>h!==T0&&h!==S).sort((p,q)=>d(q,T0)-d(p,T0))[0];t.ensureEcon(S);
  const [L1,L2,L3]=W.lords.filter(l=>!l.dead);
  Object.assign(L1,{state:'patrol',x:T0.x+60,y:T0.y+40,tgt:T0.name});Object.assign(L2,{state:'march',x:T0.x-80,y:T0.y+30,tgt:F.name});Object.assign(L3,{state:'siege',x:S.x+16,y:S.y+12,tgt:S.name,sd:1});
  const H=hide[0];if(H){H.seen=false;H.x=T0.x+200;H.y=T0.y-150}
  const cv=t.asParty({cv:true,fac:T0.owner,from:T0.name,to:F.name,x:T0.x+100,y:T0.y+20,goods:{grain:4},guards:5,cool:0,dir:1});W.caravans.push(cv);
  const offers=t.intelGather(t.intelSrc(T0)),ks=new Set(offers.map(o=>o.k)),price=o=>Math.round(I.v[o.k]*(1+I.tier*(T0.T.tier-2)));
  ok(['siege','march','lord','caravan'].every(k=>ks.has(k))&&(!H||ks.has('hideout'))&&offers.every(o=>t.INTEL_KINDS[o.k]&&t.intelPrice(o,T0)===price(o)),'offered near '+T0.name+' (tier '+T0.T.tier+'): '+offers.map(o=>o.name+' '+t.intelPrice(o,T0)+'g').join(', '));
  ok(offers.every((o,i)=>!i||offers[i-1].v>=o.v),'the dearest first ('+offers.map(o=>o.k).join(', ')+')');
  t.enterTown(T0);t.act('tab','tavern');const h0=Object.keys(W.news.heard).length;btn().click();
  ok(/Buy information/.test(Kit.panel())&&document.querySelectorAll('#panel .pk-row').length===offers.length&&offers.every(o=>Kit.panel().includes(t.intelPrice(o,T0)+'g')),'its picker: each offer with its price');
  const key=k=>offers.find(o=>o.k===k&&(k!=='lord'||o.o===L1)).key,arg=ks2=>ks2.map(k=>k+':1').join(',');
  t.act('intel-buy',arg(offers.slice(0,4).map(o=>o.key)));ok(P.gold===1000&&/At most 3 at a time/.test(Kit.panel()),'four chosen: refused, at most '+I.n+' ("At most 3 at a time.")');
  P.gold=1;t.act('intel-buy',arg([key('lord')]));ok(P.gold===1&&/Not enough gold/.test(Kit.panel()),'without the gold: refused');P.gold=1000;
  const pick=[key('siege'),key('march'),key('lord')],cost=pick.map(k=>t.intelPrice(offers.find(o=>o.key===k),T0)).reduce((a,b)=>a+b,0);G.msgs=[];
  t.act('intel-buy',arg(pick));const info3=()=>said(/^Information \(the innkeeper of /).map(r=>r.m),lines=info3(),txt=k=>info3().find(m=>m.includes(k))||'';
  ok(P.gold===1000-cost&&lines.length===3&&Object.keys(W.news.heard).length===h0,'bought 3 for '+cost+'g: three lines of information, no news heard by it');
  ok(txt(L1.name+' of').includes(L1.troops.length+' men (power '+L1.power()+')'),'a lord\'s army, exact: "'+txt(L1.name+' of')+'"');
  ok(txt('The siege of').includes('a garrison of '+S.gar)&&txt('The siege of').includes('The assault comes in '+Math.max(1,2+t.wallOf(S)-1)+' day')&&/food for \d+ days?|no food left/.test(txt('The siege of')),'a siege\'s true state: "'+txt('The siege of')+'"');
  ok(txt('marches on').includes('marches on '+F.name+' with '+L2.troops.length+' men'),'an army on the march: "'+txt('marches on')+'"');
  const mk=t.rumourMarks().find(m=>m.id==='i'+key('lord'));ok(mk&&mk.i&&mk.x===Math.round(L1.x)&&mk.y===Math.round(L1.y)&&t.chronMark('ni'+key('lord'))===mk,'its gold "?" on the lord\'s very spot, found by the Chronicle\'s Show on map');
  ok(/Information bought/.test(Kit.panel())&&!btn(),'the tavern shows what you bought; no more offer today');
  t.act('intel-buy',arg([key('caravan')]));ok(P.gold===1000-cost,'once a day: again, nothing more and no gold taken');
  t.act('leave');Kit.world();G.day++;const tr0=L1.troops;L1.troops=tr0.concat(['hum_levy','hum_levy','hum_levy','hum_levy']);
  t.enterTown(T0);t.act('tab','tavern');ok(btn()&&!btn().disabled,'the next day: offered again');G.msgs=[];
  t.act('intel-buy',arg([key('lord')].concat(H?[key('hideout')]:[])));
  ok(txt(L1.name+' of').includes(L1.troops.length+' men'),'current: his army as it is now ('+L1.troops.length+' men)');
  ok(!H||H.seen&&/It is on your map now/.test(txt('lies')),H?'a hideout: on your map now ("'+txt('lies')+'")':'(no hideout)');
  t.act('leave');Kit.world();G.day--;
  hs.forEach(([s,x,y])=>{s.seen=false;s.x=x;s.y=y});W.caravans=[];W.lords.forEach(l=>{l.x=-9999;l.y=-9999;l.state='rest';l.fight=null});L1.troops=tr0;away()}

 // ---- the save: mid-wave
 {fresh();back();const it=fell(),far=live().slice().sort((p,q)=>t.proclaimDays(it,q)-t.proclaimDays(it,p))[0],fd=t.proclaimDays(it,far)*24;
  const c=t.newsRecord('beast',{x:A.x+20,y:A.y+16},{id:'wolf',n:4});at(Math.floor(fd/2));Kit.goTo(far.x,far.y+20);t.rumourHear(c,{quiet:true});away();
  Kit.world();t.saveGame(true,'quick');const sv=JSON.parse(localStorage.getItem(t.slotKey('quick'))).world.news,si=sv&&sv.items.find(x=>x.id===it.id);
  ok(si&&si.h===it.h&&sv.heard[it.id]==null&&sv.v&&sv.v[c.id]===W.news.v[c.id],'saved half way: the proclamation with its hour ('+(si&&si.h)+'), unheard; the rumour\'s vagueness ('+(sv&&sv.v&&sv.v[c.id])+')');
  const was=JSON.stringify(W.news);t.newsLoad(null);t.loadGame('quick');Kit.world();away();
  ok(JSON.stringify(W.news)===was,'loaded as it was');
  const it2=W.news.items.find(x=>x.id===it.id),f2=t.townBy(far.name);at(Math.floor(fd/2));ok(!t.proclaimReached(it2,f2),'still on its way to '+far.name);
  at(Math.ceil(fd));G.msgs=[];ok(t.proclaimAt(f2).length===1&&said(/^Proclamation \(the crier of /).length===1,'and reaches it on time ('+(fd/24).toFixed(1)+' days)');back()}

 // ---- with proclamations off: every kind a rumour as before
 {fresh();back();PR.on=false;try{const it=fell();const r=t.rumourFrom(t.rumourSource('tavern',A.name,A));ok(it.h==null&&r.fresh.includes(it)&&!r.proc.length,'PROCLAIM.on false: a holding taken is a rumour again, no hour kept')}finally{PR.on=true}}
 W.lords.forEach(o=>{o.fight=null});back();Kit.world();
});
