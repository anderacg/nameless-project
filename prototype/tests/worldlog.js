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
 ok(d(A,B)>t.vis()*2,'you at '+A.name+'; '+B.name+' far off ('+Math.round(d(A,B))+' px, your sight '+Math.round(t.vis())+' px)');

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

 // ---- your own conquest (siege.js captureAct): proclaimed and spreading, your band named as the taker; yours: no rider, no news
 // to you, the Chronicle logs it once, as you did it
 const heard=it=>!!it&&W.news.heard[it.id]!=null,post=()=>W.news.post||[];
 {const C=live.filter(h=>h!==A&&h!==B&&t.fiefsOf(h.owner).length>1)[0],prev=C.owner,g0=C.gar,b0=P.band,r0=P.renown,gold0=P.gold,E=t.FIDS.find(f=>f!==prev&&f!=='player'&&!W.dead[f]);
  const back=()=>{C.owner=prev;C.gar=g0;P.fac=null;P.hostile={};G.capture=null;G.capWith=null};
  const take=(a,fac)=>{back();fresh();P.fac=fac||null;G.capture=C;G.mode='capture';t.captureAct(a);Kit.world();return items().find(x=>x.k==='fell'&&x.detail.town===C.name)};
  const far=live.filter(h=>h!==C).sort((p,q)=>d(q,C)-d(p,C))[0],src=t.rumourSource('tavern',C.name,C);
  P.band='The Grey Company';let it=take('cap-peace');
  ok(it&&t.newsProc(it)&&it.detail.by==='The Grey Company'&&it.detail.fac==='player'&&it.h===Math.floor(t.Clock.hours())&&t.proclaimText(it)===C.name+' has fallen to The Grey Company, earlier today.',
   'you take '+C.name+' for yourself: proclaimed, your band the taker ("'+(it&&t.proclaimText(it))+'" / "'+(it&&t.NEWS_KINDS.fell.say[1](it.detail,{when:'yesterday'}))+'")');
  {const dd=t.proclaimDays(it,far),n0=t.proclaimReached(it,far),d0=G.day;G.day+=Math.ceil(dd)+1;const n1=t.proclaimReached(it,far),cr=t.proclaimAt(far),tv=t.rumourFrom(src);G.day=d0;
   ok(!n0&&n1&&!cr.includes(it)&&!tv.fresh.includes(it)&&!tv.proc.includes(it),'it spreads: '+far.name+' reached after '+dd.toFixed(1)+' days, but neither its crier nor a tavern tells it you (heard already)')}
  ok(heard(it)&&!post().length&&said(/is your fief now/).length===1&&!said(/has fallen to|^Proclamation|^A rider/).length,'no rider, no news to you; the Chronicle logs it once, as you did it ("'+(said(/your fief now/)[0]||{}).m+'")');
  it=take('cap-peace',E);
  ok(it&&it.detail.fac===E&&t.proclaimText(it)===C.name+' has fallen to The Grey Company in the name of the '+t.FACS[E].n+', earlier today.'&&heard(it)&&!post().length&&said(new RegExp('The '+t.FACS[E].n+' takes '+C.name)).length===1,
   'handed over to your employer: "'+(it&&t.proclaimText(it))+'"; your realm\'s, yet no rider for your own deed');
  delete P.band;it=take('cap-sack');
  ok(it&&it.detail.by===t.NAMING.band&&it.detail.sacked===1&&/, and was sacked, /.test(t.proclaimText(it))&&heard(it),'no band name given: by its name all the same ("'+(it&&t.proclaimText(it))+'")');
  back();fresh();G.capture=C;G.mode='capture';t.captureAct('cap-leave');Kit.world();const rd=items().find(x=>x.k==='raid'&&x.detail.town===C.name);
  ok(C.owner===prev&&rd&&heard(rd)&&!items().some(x=>x.k==='fell'),'sacked and left: no holding taken, talk of a raid, heard already');
  fresh();t.ensureEcon(C);t.finishRaid(C,.5);const r2=items().find(x=>x.k==='raid');ok(r2&&heard(r2),'your raid: its news heard already (never told you as a rumour)');
  fresh();t.ensureEcon(C);{const ek=Object.keys(C.bld||{}).find(k=>t.bldLv(C,k)>0&&t.ESTATES[k]&&t.bldSpots(C)[k]);if(ek){t.estateWon({ref:{town:C.name,k:ek,burn:true}});const r3=items().find(x=>x.k==='raid'&&x.detail.estate===ek);ok(r3&&heard(r3),'an estate you burnt ('+ek+' of '+C.name+'): the world hears of it, you are never told it back as a rumour')}else info('no estate at '+C.name+' to burn')}
  back();if(b0)P.band=b0;else delete P.band;P.renown=r0;P.gold=gold0;Kit.world()}

 // ---- the last direct lines, through the gateway: seen, logged at once; far, news (or nothing); your realm's, by rider (or not)
 {const we0=t.worldEvent,got=[];window.worldEvent=ev=>{const r=we0(ev);got.push([r,ev]);return r};
  const keep=W.lords.map(l=>[l,{...l}]),px=P.x,py=P.y,lr=l=>Object.assign(l,{dead:false,inside:null,fight:null,defend:null,cool:5});
  try{W.lords.forEach(l=>{l.x=-9999;l.y=-9999});
   const way=(re,mode)=>{const g=got.filter(([,ev])=>re.test(ev.text||'')).pop();return g?g[0]:'none'};
   // each: name, its holding, the text, its news kind (none: no news), the realm whose it is (P.fac), whether its rider rides, fire()
   const check=(name,h,re,k,fac,rides,fire)=>{for(const mode of ['seen','far','realm']){fresh();got.length=0;P.fac=mode==='realm'?fac:null;if(mode==='seen'){P.x=h.x;P.y=h.y+20}else{P.x=-900;P.y=-900}
     fire();const r=way(re),it=k&&items().filter(x=>x.k===k).pop(),p=post().filter(x=>re.test(x.p+'.'));
     if(mode==='seen')ok(r==='seen'&&said(re).length===1&&(!k||heard(it)),name+', in sight: logged at once ("'+(said(re)[0]||{}).m+'")'+(k?', its news heard':''));
     else if(mode==='far')ok(r==='news'&&!said(re).length&&!post().length&&(k?it&&!heard(it):!items().length),name+', far off: not logged'+(k?', news ("'+(it&&t.rumourText(it))+'")':', no news either'));
     else ok(rides?r==='rider'&&!said(re).length&&p.length===1:r==='news'&&!said(re).length&&!post().length,name+', your realm\'s ('+t.FACS[fac].n+'): '+(rides?'by rider ("'+(p[0]&&p[0].p)+'")':'no rider (route '+r+')'))}
    P.fac=null;P.x=px;P.y=py};
   // a lord's march ends at a holding at war with him: he lays siege (brains.js)
   {let l=W.lords.find(o=>t.TOWNS.some(h=>!h.gone&&t.atWar(o.fac,h.owner)&&h.owner!=='player')),r0=null,hb=null;
    if(!l){l=W.lords[0];hb=live.find(h=>h.owner!==l.fac);r0=t.relOf(l.fac,hb.owner).s;t.setRel(l.fac,hb.owner,'war')}
    const h=hb||live.filter(z=>t.atWar(l.fac,z.owner)).sort((p,q)=>d(p,A)-d(q,A))[0];
    check('a siege laid at '+h.name,h,/lays siege to |laid siege to /,'siege',l.fac,true,()=>{lr(l);Object.assign(l,{state:'march',tgt:h.name,x:h.x,y:h.y+12});t.BRAINS.lord.think(l,.05);l.state='rest';l.x=l.y=-9999});
    if(r0)t.setRel(l.fac,hb.owner,r0)}
   // a realm raises walls (buildings.js), and talk of them
   {const h=live.find(z=>t.wallOf(z)<z.T.wallMax&&!t.besieged(z)&&!t.ruined(z));
    check('walls raised at '+h.name,h,/starts raising |started raising /,'walls',h.owner,true,()=>{t.ensureEcon(h);h.work=null;const s0={...h.stock},p0=h.pop,tr=W.treas[h.owner];
     for(const [g,n] of Object.entries(t.WALL_MAT[t.wallOf(h)+1]))h.stock[g]=Math.max(h.stock[g]||0,n);h.pop=0;W.treas[h.owner]=1e5;
     Kit.stub(.01,()=>t.Buildings.of(h).day());h.work=null;for(const g in h.stock)h.stock[g]=s0[g]||0;h.pop=p0;W.treas[h.owner]=tr})}
   // a lord rides out against a band by his holding (defence.js): seen or nothing (the fight it starts brings its own word)
   {const h=live.find(z=>W.lords.some(o=>o.fac===z.owner)),l=W.lords.find(o=>o.fac===h.owner),o=t.asParty({x:h.x+40,y:h.y+30,n:5,kind:'bandits',cool:0});
    check(l.name+' riding out from '+h.name,h,/rides out against /,null,h.owner,false,()=>{lr(l);Object.assign(l,{state:'rest',x:h.x+10,y:h.y+14});t.lordRides(l,o,h);l.defend=null;l.x=l.y=-9999})}
   // a lord grows in skill (leaders.js): seen or nothing, never news, never a rider
   {const h=live.find(z=>W.lords.some(o=>o.fac===z.owner)),l=W.lords.find(o=>o.fac===h.owner);
    check(l.name+' growing in skill',h,/grows in skill/,null,l.fac,false,()=>{lr(l);Object.assign(l,{x:h.x+10,y:h.y+14});t.lordStats(l);l.xp=t.LV_XP(l.lv)-1;t.lordXp(l,5);l.x=l.y=-9999})}
   // people leave a holding (refugees.js): talk of it; your employer's, news; your own fief's, by rider
   {const h=live.filter(z=>z!==A&&z.pop>60)[0]||live[1],to=live.find(z=>z!==h),flee=()=>{const p0=h.pop,r=t.sendRefugees(h,to,'siege');if(r){W.refugees=W.refugees.filter(x=>x!==r)}h.pop=p0};
    const p0=h.pop;h.pop=Math.max(h.pop,80);
    check('people leaving '+h.name,h,/people leave |people left /,'exodus',h.owner,false,flee);
    const o0=h.owner;h.owner='player';fresh();got.length=0;P.x=-900;P.y=-900;flee();const p=post()[0];
    ok(way(/people leave /)==='rider'&&!said(/people leave /).length&&p&&/^\d+ people left .* for .*$/.test(p.p)&&p.a===' The siege.','your own fief\'s: by rider ("'+(p&&p.p+'…'+p.a)+'")');
    h.owner=o0;h.pop=p0;P.x=px;P.y=py;
    const e=t.NEWS_KINDS.exodus.say.map(f=>f({town:h.name,to:to.name,n:12,why:'sacked'},{when:'yesterday',v:0})),w=t.NEWS_KINDS.walls.say.map(f=>f({town:h.name,fac:h.owner,wall:'stone walls'},{when:'yesterday'}));
    ok(e.concat(w).every(x=>x.includes(h.name)&&/[.]$/.test(x)),'the new kinds\' sentences: "'+e.concat(w).join('" / "')+'"')}}
  finally{window.worldEvent=we0;keep.forEach(([l,o])=>{for(const k of Object.keys(l))if(!(k in o))delete l[k];Object.assign(l,o)});P.fac=null;P.x=px;P.y=py;W.refugees=[]}
  Kit.world()}

 // ---- the gateway off: every line logged where it was before, nothing more recorded
 {fresh();L.on=false;try{const l=lordOf(B.owner,6);failSiege(B,l);ok(said(/^The siege of .* fails\. /).length===1,'off: the siege failing far away is logged as before');
   const [a,b]=t.FIDS.filter(f=>!W.dead[f]),r0=t.relOf(a,b).s;G.msgs=[];t.setRel(a,b,r0==='war'?'peace':'war');
   ok(G.msgs.length>=1&&!items().some(x=>['war','peace','ally'].includes(x.k)),'off: war and peace logged, no news of them');t.setRel(a,b,r0);
   const f0=lordOf(B.owner,7);Object.assign(f0,{inside:null,state:'patrol',x:B.x+30,y:B.y+20,dead:false,fight:null});G.msgs=[];t.routParty(f0,[]);ok(!G.msgs.length,'off: a lord routed far off and not yours, not logged (as before)')}
  finally{L.on=true}}
 W.lords.forEach(o=>{o.fight=null});Kit.world();
});
