'use strict';
// The world's log works like rumours (world/worldlog.js worldEvent, the owner 2026-10-23): a world event far away is not logged
// but becomes news; one in your sight is logged at once ("You see…"); one you took part in is logged at once; your realm's comes
// by rider after a delay by distance, saying who sent him and when it happened; the new news kinds' sentences (war, peace, an
// alliance, a realm fallen, a lord's new army, a garrison starving), the realms' affairs reaching far holdings days later; Buy
// information at a tavern (not rumours: tests/proclaim.js); the Chronicle's "happened day N"; the full map's "?" marks; saved and
// loaded with a rider on the way; and with the gateway off, every line logged where it was before.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,L=t.WORLD_LOG,q=Kit.q;
 window.requestAnimationFrame=()=>0;
 Kit.begin('soldier',57);Kit.clear();Kit.world();P.fac=null;P.hostile={};P.siege=null;G.clock=t.DAY*.3;
 const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),fresh=()=>{t.newsLoad(null);G.msgs=[]},items=()=>W.news.items,said=re=>G.msgs.filter(r=>re.test(r.m));
 let live=t.TOWNS.filter(h=>!h.gone&&h.owner&&h.owner!=='player'),A=live[0],B=live.slice().sort((p,q)=>d(q,A)-d(p,A))[0];
 // (after a load: the holdings as the game holds them now)
 const relink=()=>{A=t.townBy(A.name);B=t.townBy(B.name);live=t.TOWNS.filter(h=>!h.gone&&h.owner&&h.owner!=='player')};
 const lordOf=(not,i)=>W.lords.filter(l=>!l.dead&&l.fac!==not)[i||0];
 // a lord's siege of h that fails (Math.random high: the garrison holds)
 const failSiege=(h,l)=>{Object.assign(l,{inside:null,state:'siege',tgt:h.name,troops:['hum_levy'],sd:0,dead:false,x:h.x+20,y:h.y+14});Kit.stub(.99,()=>t.resolveSiege(l,h))};
 Kit.goTo(A.x,A.y+20);G.clock=t.DAY*.3;
 ok(d(A,B)>t.vis()*L.sight*2,'you at '+A.name+'; '+B.name+' far off ('+Math.round(d(A,B))+' px, your sight '+Math.round(t.vis())+' px)');

 // ---- far away: not logged, only news
 {fresh();const l=lordOf(B.owner);failSiege(B,l);const it=items().find(x=>x.k==='relieved'&&x.detail.town===B.name);
  ok(!said(/siege of/).length&&it&&W.news.heard[it.id]==null,'a siege that fails far away: nothing in your log, only news (not heard yet: '+(it&&t.rumourText(it))+')');
  const [a,b]=t.FIDS.filter(f=>f!==B.owner&&!t.W.dead[f]),r0=t.relOf(a,b).s;t.setRel(a,b,r0==='war'?'peace':'war');
  const w=items().find(x=>(x.k==='war'||x.k==='peace')&&x.detail.a===[a,b].sort()[0]&&x.detail.b===[a,b].sort()[1]);
  ok(!said(/war|truce/).length&&w,'two other realms '+(r0==='war'?'make peace':'go to war')+': not logged, news ('+(w&&t.rumourText(w))+')');t.setRel(a,b,r0)}

 // ---- in sight: logged at once, as seen
 {fresh();const l=lordOf(A.owner,1);failSiege(A,l);const it=items().find(x=>x.k==='relieved'&&x.detail.town===A.name),m=said(/siege of/)[0];
  ok(m&&/^You see the siege of /.test(m.m)&&m.kind==='war'&&it&&W.news.heard[it.id]===G.day,'a siege failing in sight: logged at once, as seen ("'+(m&&m.m)+'"), its news heard already');
  const o=lordOf(A.owner,2);Object.assign(o,{inside:null,state:'patrol',x:A.x+30,y:A.y+20,dead:false,fight:null});G.msgs=[];t.routParty(o,[]);
  ok(said(/^You see .* routed near /).length===1,'a lord routed in sight (fights.js\'s rule): "'+(G.msgs[0]||{}).m+'"')}

 // ---- you took part: logged at once, however far
 {fresh();t.ensureEcon(B);const s0={...B.stock},g0=B.gar;for(const g of t.FOODS)B.stock[g]=0;B.gar=5;P.siege={town:B.name,days:0};t.Timed.of(P,'hostile').extend(B.owner,60);
  Kit.stub(.99,()=>t.siegeDay());const m=said(/garrison of .* starves/)[0],it=items().find(x=>x.k==='starving');
  ok(m&&m.kind==='war'&&it&&W.news.heard[it.id]===G.day,'your siege starves the garrison of '+B.name+': at once ("'+(m&&m.m)+'"), and news for the rest, heard by you');
  G.msgs=[];const l=lordOf(B.owner,3);failSiege(B,l);ok(said(/^The siege of /).length===1,'a siege of the holding you besiege, broken: logged at once, as it was ("'+(G.msgs[0]||{}).m+'")');
  P.siege=null;P.hostile={};B.stock=s0;B.gar=g0;
  G.msgs=[];ok(t.worldPart(()=>t.worldEvent({text:'Far beaten.',x:B.x,y:B.y}))==='part'&&said(/^Far beaten\.$/).length===1,'the aftermath of your battle (worldPart): yours, at once')}

 // ---- your realm's: by rider, after its delay, saying who sent him and when it happened
 const tiles0=L.tiles,hoursAt=H=>{G.day=Math.floor(H/24);G.clock=(H-G.day*24)/24*t.DAY},d0=G.day,c0=G.clock;
 {fresh();P.fac=B.owner;L.tiles=d(B,P)/t.TILE/2;const l=lordOf(B.owner,4);failSiege(B,l);const r=(W.news.post||[])[0];
  ok(!said(/siege/).length&&r&&r.day===d0&&r.from===B.name&&r.due===Math.ceil(t.Clock.hours()+48),'your realm\'s holding: not logged yet; a rider sets out from '+(r&&r.from)+', due in '+(r?Math.round(r.due-t.Clock.hours()):'-')+' hours (a day per '+Math.round(L.tiles)+' tiles)');
  ok(t.Systems.names('hour').includes('riders'),'the riders come in by the hour (Systems: '+t.Systems.names('hour').join(', ')+')');
  hoursAt(r.due-1);t.wlArrive();ok(!G.msgs.length&&W.news.post.length===1,'an hour before he is due: nothing');
  const sv=(()=>{Kit.world();t.saveGame(true,'quick');return JSON.parse(localStorage.getItem(t.slotKey('quick'))).world.news})();
  ok(sv&&sv.post&&sv.post.length===1&&sv.post[0].due===r.due,'saved with the rider on his way');
  t.newsLoad(null);t.loadGame('quick');Kit.world();relink();hoursAt(r.due-1);ok(W.news.post&&W.news.post.length===1&&JSON.stringify(W.news.post[0])===JSON.stringify(r),'loaded: still on his way, as he was');
  G.msgs=[];hoursAt(r.due);t.wlArrive();const m=G.msgs[0];
  ok(m&&m.m==='A rider from '+B.name+': The siege of '+B.name+' failed and '+l.name+' fell back two days ago.'&&m.kind==='war'&&m.at===d0&&m.day===d0+2&&!W.news.post,'he comes in: "'+(m&&m.m)+'" (it happened day '+(m&&m.at)+')');
  const html=t.chronicleWindow();ok(html.includes('happened day '+d0+' (2 days before you heard)'),'the Chronicle: "happened day '+d0+' (2 days before you heard)"');
  Kit.world();t.saveGame(true,'quick');G.msgs=[];t.loadGame('quick');Kit.world();relink();ok(G.msgs.some(x=>x.at===d0&&/^A rider from/.test(x.m)),'its day kept in the save');
  ok(JSON.stringify(Object.keys(t.G.msgs.find(x=>/^A rider/.test(x.m))))==='["m","day","cls","kind","at"]'||JSON.stringify(Object.keys(t.G.msgs.find(x=>/^A rider/.test(x.m))))==='["m","day","kind","at"]','its record small: '+JSON.stringify(G.msgs.find(x=>/^A rider/.test(x.m))));
  fresh();hoursAt(d0*24+7);const w=t.FIDS.find(f=>f!==B.owner&&!W.dead[f]),r0=t.relOf(B.owner,w).s;t.setRel(B.owner,w,r0==='war'?'peace':'war');const r2=(W.news.post||[])[0];
  ok(!G.msgs.length&&r2&&/^the .* (went to war|agreed to a truce|formed an alliance)|^the alliance/.test(r2.p),'your realm\'s war or peace: by rider too ("'+(r2&&r2.p)+'")');t.setRel(B.owner,w,r0);
  fresh();const fl=lordOf(B.owner,5);Object.assign(fl,{inside:null,state:'patrol',x:B.x+30,y:B.y+20,dead:false,fight:null});const own=W.lords.find(o=>!o.dead&&o.fac===P.fac&&o!==fl);
  if(own){Object.assign(own,{inside:null,state:'patrol',x:B.x+40,y:B.y+20,fight:null});const f=t.startFight([fl],[own]);ok(!G.msgs.length&&!(W.news.post||[]).length,'a battle of your realm\'s lord begun far off: no rider for it');
   t.endFight(f,0);ok(!G.msgs.length&&(W.news.post||[]).some(x=>/won the battle near/.test(x.p))&&(W.news.post||[]).some(x=>/was routed near/.test(x.p)),'its end: riders with who won and your lord routed ('+W.news.post.map(x=>x.p).join(' | ')+')');W.fights=[]}
  else ok(true,'(no second lord of your realm)');
  P.fac=null;L.tiles=tiles0;G.day=d0;G.clock=c0;W.lords.forEach(o=>{o.fight=null})}

 // ---- the new kinds' sentences, with when; the realms' affairs told far off
 {fresh();const [a,b]=t.FIDS.slice(0,2).sort(),F=f=>t.FACS[f].n,s={when:'yesterday',where:'near '+A.name,road:'on the road near '+A.name};
  const det={war:{a,b},peace:{a,b},ally:{a,b},realm:{fac:a,town:A.name},army:{lord:'Lord X',fac:a,town:A.name,n:12},starving:{town:A.name,fac:a}};
  for(const k of Object.keys(det)){const K=t.NEWS_KINDS[k],says=K.say.map(f=>f(det[k],s));
   ok(says.length===2&&says.every(x=>/yesterday/.test(x)&&(x.includes(F(a))||x.includes(A.name))&&/[.!]$/.test(x)),k+': "'+says.join('" / "')+'"')}
  {const e=t.NEWS_KINDS.peace.say.map(f=>f({a,b,ended:1},s));ok(e.every(x=>/alliance/.test(x)),'peace, an alliance ended: "'+e.join('" / "')+'"')}
  const at=t.realmsMeet(a,b),it=t.newsRecord('war',at,{a,b}),far=live.slice().sort((p,q)=>d(q,at)-d(p,at))[0];
  ok(it&&d(far,at)>t.NEWS.radius,'a war recorded where the realms meet (by '+it.near+')');
  const tv=t.rumourFrom(t.rumourSource('tavern',far.name,far)),es=t.rumourCands(t.rumourSource('estate',far.name+':farm',far));
  ok(!tv.fresh.includes(it)&&!tv.proc.includes(it)&&!es.includes(it)&&W.news.heard[it.id]==null,'the tavern of '+far.name+', far from it: no rumour of the war (a proclamation, free), and it has not reached there yet');
  {const d0=G.day,n=Math.ceil(t.proclaimDays(it,far))+1;G.day+=n;const tv2=t.rumourFrom(t.rumourSource('tavern',far.name,far));G.day=d0;
   ok(tv2.proc.includes(it)&&W.news.heard[it.id]!=null,n+' days on it has reached '+far.name+' ('+t.proclaimDays(it,far).toFixed(1)+' days): told there free')}
  const it2=t.newsRecord('war',at,{a,b:t.FIDS[2]});ok(it2!==it&&items().filter(x=>x.k==='war').length===2,'two wars by the same holding the same day: two items (apart)')}

 // ---- a tavern sells information, not rumours (tests/proclaim.js): its 2 free rumours, then Buy information
 {fresh();Kit.goTo(A.x,A.y+20);['siege','beast','caravan','trace'].forEach((k,i)=>t.newsRecord(k,{x:A.x+10+i*30,y:A.y+12},{town:A.name,fac:A.owner,lord:'Lord X',id:'wolf',n:4,from:A.name,t:'wreck'}));
  Kit.world();t.enterTown(A);t.act('tab','tavern');
  ok(Object.keys(W.news.heard).length===2&&q('#panel [data-act="intel-pick"]')&&!q('#panel [data-act="buy-news"]')&&/Buy information/.test(Kit.panel()),'the tavern of '+A.name+': 2 free rumours, and Buy information (no Buy news)');
  t.act('leave');Kit.world()}

 // ---- the full map's "?" marks
 {fresh();const it=t.newsRecord('beast',{x:A.x+40,y:A.y+30},{id:'wolf',n:5});t.rumourHear(it,t.rumourSource('tavern',A.name,A));const m=t.rumourMarks()[0];
  const h=t.fullMapMarks(1),n=(h.match(/class="fm-r"/g)||[]).length;ok(n===1&&h.includes('>?</b>'),'the full map draws each rumour\'s "?" ('+n+')');
  Kit.world();t.fullMapOpen({x:m.x/t.TILE,y:m.y/t.TILE});const b=q('.fm-r');
  ok(G.mode==='fullmap'&&b&&b.textContent==='?'&&b.title.includes(m.t)&&/Rumour/.test(q('.fm-leg').textContent),'open: the "?" on it, the rumour its title, Rumour in the legend');t.act('map-close');Kit.world()}

 // ---- the gateway off: every line logged where it was before, nothing more recorded
 {fresh();L.on=false;try{const l=lordOf(B.owner,6);failSiege(B,l);ok(said(/^The siege of .* fails\. /).length===1,'off: the siege failing far away is logged as before');
   const [a,b]=t.FIDS.filter(f=>!W.dead[f]),r0=t.relOf(a,b).s;G.msgs=[];t.setRel(a,b,r0==='war'?'peace':'war');
   ok(G.msgs.length>=1&&!items().some(x=>['war','peace','ally'].includes(x.k)),'off: war and peace logged, no news of them');t.setRel(a,b,r0);
   const f0=lordOf(B.owner,7);Object.assign(f0,{inside:null,state:'patrol',x:B.x+30,y:B.y+20,dead:false,fight:null});G.msgs=[];t.routParty(f0,[]);ok(!G.msgs.length,'off: a lord routed far off and not yours, not logged (as before)')}
  finally{L.on=true}}
 W.lords.forEach(o=>{o.fight=null});Kit.world();
});
