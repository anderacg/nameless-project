'use strict';
// Discoveries, dated reports, unspoken news, and save/load: the Journal must never query a remote lord's live whereabouts.
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P,W=t.W,K=t.KNOWLEDGE,q=Kit.q;
 window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world({town:null});
 const home=t.townBy('Ashford'),far=t.TOWNS.find(h=>h.owner!==home.owner),l=W.lords.find(x=>x.fac===home.owner),other=W.lords.find(x=>x.fac===far.owner),friend=t.lordFriends(l)[0];
 const away=()=>{P.x=P.y=-9999;G.town=null;G.lastTown=null;Kit.world({town:null});W.lords.forEach(x=>{x.x=x.y=-20000})};
 const page=sec=>{Kit.world({town:null});t.openJournal(sec);return Kit.text()},reset=()=>{away();t.fogReset();K.reset()};
 reset();let text=page('lords');
 ok(/0 known lords/.test(text)&&/No lords known yet/.test(text)&&W.lords.every(x=>!text.includes(x.name)),'no discoveries: no lord names or hidden total in the Journal');
 text=page('realms');ok(/0 known realms/.test(text)&&/No realms known yet/.test(text)&&t.FIDS.every(f=>!text.includes(t.FACS[f].n))&&!text.includes(far.name),'no realms: no unknown realms, holdings or relationship pairs');
 W.seen[home.ty*t.MW+home.tx]=1;text=page('realms');
 ok(K.knowsRealm(home.owner)&&/1 known realm\b/.test(text)&&text.includes(home.name)&&!text.includes(far.name)&&!text.includes(other.name),'exploring one holding reveals its realm and holding, without its other holdings or lords');
 l.inside=null;l.dead=l.gone=false;l.x=P.x=home.x+20;l.y=P.y=home.y+20;G.day=2;t.peopleWatch();
 const sight=JSON.stringify(K.lords[l.id]),count=l.troops.length;
 text=page('lords');ok(text.includes(l.name)&&/Last known/.test(text)&&text.includes(count+' soldiers')&&!text.includes(other.name)&&(!friend||!text.includes(friend.name))&&/1 known lord\b/.test(text),'a sighting reveals one lord, a dated army report, and no unknown friends');
 away();l.inside=far.name;l.troops=['hum_levy'];G.day=6;text=page('lords');
 ok(JSON.stringify(K.lords[l.id])===sight&&!text.includes(far.name)&&text.includes(count+' soldiers')&&/day 2/.test(text),'offscreen movement and army changes leave the last known report unchanged');
 text=page('realms');ok(!text.includes(far.name)&&!text.includes(other.name)&&text.includes(l.name)&&!text.includes('power '),'realm summaries contain only known holdings and lords, without live remote army details');
 // Recording world news or sending a rider never reveals its unspoken facts. Hearing only a realm leaves its lord unknown.
 reset();G.day=7;const it=t.newsRecord('army',far,{lord:other.name,fac:other.fac,town:far.name,n:70});
 ok(!K.knowsLord(other)&&!K.knowsRealm(other.fac),'a news item recorded in the world is not knowledge');
 K.news(it,'The '+t.FACS[other.fac].n+' has raised an army.');
 ok(K.knowsRealm(other.fac)&&!K.knowsLord(other),'unspoken names in a news payload stay hidden');
 // A quiet source still tells its rumour on its own page; knowledge is acquired at the hearing gateway.
 reset();W.news=undefined;const rum=t.newsRecord('lord',far,{lord:other.name,fac:other.fac});t.rumourHear(rum,{quiet:true,from:'a traveller'});
 const heard=K.lords[other.id];text=page('lords');
 ok(K.knowsLord(other)&&heard&&text.includes(heard.text)&&text.includes('Last known')&&text.includes('day 7'),'a heard rumour, including a quiet source, discovers the named lord and its dated wording');
 // Only purchased information reveals the offered army; buying produces a precise report.
 reset();W.news=undefined;other.inside=far.name;const offer=t.intelGather({at:[far],r:1}).find(o=>o.k==='lord'&&o.o===other);
 ok(offer&&!K.knowsLord(other),'browsing intelligence offers does not discover their lords');
 t.intelLearn(offer,'an innkeeper');text=page('lords');
 ok(K.knowsLord(other)&&text.includes(far.name)&&text.includes(t.intelMen(other.troops.length)),'buying information adds its precise place and army as a last known report');
 K.sight(other);const direct=JSON.stringify(K.lords[other.id]);K.hear(other.name+' was elsewhere.',true,G.day);
 ok(JSON.stringify(K.lords[other.id])===direct,'a same-day rumour cannot displace a direct sighting');
 t.intelLearn(offer,'an innkeeper');ok(!K.lords[other.id].text.startsWith('In '),'fresh precise intelligence can update a sighting from earlier the same day');
 // A rider carries both the event date and its facts, learned only when he arrives.
 reset();W.news=undefined;G.day=10;P.fac=other.fac;const ev={text:other.name+' of the '+t.FACS[other.fac].n+' takes '+far.name+'.',past:other.name+' of the '+t.FACS[other.fac].n+' took '+far.name,fac:other.fac,x:far.x,y:far.y,news:['fell',far,{town:far.name,fac:other.fac}]};
 ok(t.worldEvent(ev)==='rider'&&!K.knowsLord(other)&&!K.holdings[far.name],'a dispatched rider does not reveal a remote event before arriving');
 const rider=W.news.post[0];rider.due=0;G.day=12;t.wlArrive();
 ok(K.knowsLord(other)&&K.lords[other.id].at===10&&K.lords[other.id].day===12&&K.holdings[far.name].fac===other.fac,'arrival reveals the lord and holding, retaining the event day and the hearing day');
 const before=JSON.stringify(K.lords[other.id]);K.hear(other.name+' was seen elsewhere.',true,9);
 ok(JSON.stringify(K.lords[other.id])===before,'older news does not replace a newer report');
 // Proclamations can reveal realms and captures, without uncovering their map tiles.
 reset();W.news=undefined;P.fac=null;G.day=15;const fell=t.newsRecord('fell',far,{town:far.name,fac:other.fac});t.proclaimHear([far],'a crier');
 ok(K.knowsRealm(other.fac)&&K.holdings[far.name].fac===other.fac&&!t.seenTile(far.tx,far.ty),'a reached proclamation reveals its named realm and last known holding, without exploring its location');
 const owner=K.holdings[far.name].fac;far.owner=home.owner;t.openJournal('realms');
 ok(K.holdings[far.name].fac===owner&&!K.knowsRealm(home.owner),'an unseen ownership change does not update known holdings or reveal the new realm');
 t.newsRecord('fell',far,{town:far.name,fac:home.owner});t.proclaimHear([far],'a crier');
 ok(K.holdings[far.name].fac===home.owner&&K.knowsRealm(home.owner),'hearing the capture updates the holding’s last known owner');
 // Direct audiences and records survive saves, while a fresh game and a missing save piece start empty.
 reset();P.fac=null;G.day=20;other.fac=far.owner;other.inside=far.name;G.town={ref:far};G.mode='town';t.renderTown();
 ok(K.knowsLord(other)&&K.lords[other.id].text.includes(far.name),'visiting a holding discovers its court and records the lords there');
 away();P.hostile={};other.inside=null;t.lordMeet(other);
 const mentioned=t.lordFriends(other).filter(x=>!x.dead).slice(0,3);
 ok(K.knowsLord(other)&&mentioned.every(x=>K.knowsLord(x)),'an audience discovers the lord and the people named in the conversation');
 away();G.day=21;const saved=JSON.stringify(K.save());t.saveGame(true,'quick');K.reset();t.loadGame('quick');
 ok(JSON.stringify(K.save())===saved,'discoveries and exact last known reports survive a real save/load');
 t.Saves.loadOf('known',undefined);ok(K.realms.length===0&&Object.keys(K.lords).length===0&&Object.keys(K.holdings).length===0,'a save without discoveries defaults to empty knowledge');
 K.lord(l);t.act('begin','soldier');ok(!K.knowsLord(l),'a new campaign forgets the preceding campaign’s discoveries');
 // Hearing a name alone gives no imaginary location, and a partial name is no discovery.
 reset();K.hear(l.name+'son');ok(!K.knowsLord(l),'a partial name cannot discover a lord');K.hear(l.name);text=page('lords');
 ok(text.includes('Last known: whereabouts unknown'),'a named lord without a location says whereabouts unknown');
 Kit.world();
});
