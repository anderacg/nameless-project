'use strict';
// News and rumours (world/news.js): the world's real events recorded as news from their hooks (each kind once, merged, trimmed by
// NEWS.keep and NEWS.days, never a Math.random draw), and heard through one service (rumourFrom) from many sources, each with its
// own daily cap by its key: a tavern 2 a day (then "Nothing new today"), the others 1; only nearby, recent news, never one you
// heard already (a holding taken is a proclamation now, never a rumour: tests/proclaim.js); a "?" on the map near each that fades;
// and the news, what you heard and today's counts kept in the save.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,N=t.NEWS;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;
 W.monsters=[];W.critters=[];t.bandits.length=0;W.patrols=[];W.caravans=[];W.refugees=[];W.fights=[];P.fac=null;P.hostile={};G.clock=t.DAY*.3;
 const panel=()=>document.getElementById('panel').innerHTML,world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.town=null};
 const fresh=()=>t.newsLoad(null),items=()=>t.W.news.items,d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const live=t.TOWNS.filter(q=>!q.gone&&q.owner&&q.owner!=='player');
 const A=live[0],B=live.slice().sort((p,q)=>d(q,A)-d(p,A))[0];
 // a point by a holding (its nearest), dx px east of it
 const by=(h,dx,dy)=>({x:h.x+(dx||20),y:h.y+(dy||16)});
 ok(t.newsNear(by(A)).name===A.name&&t.newsNear(by(B)).name===B.name&&d(A,B)>2*N.radius,'two holdings far apart: '+A.name+' and '+B.name+' ('+Math.round(d(A,B))+' px)');

 // ---- every kind recorded once, the same kind by the same holding the same day merged, trimmed by keep and by days
 fresh();
 const det={fell:{town:A.name,fac:A.owner,lord:'Lord X',sacked:1},siege:{town:A.name,fac:A.owner,lord:'Lord X'},relieved:{town:A.name,lord:'Lord X',fac:A.owner},raid:{town:A.name,estate:'farm'},
  lord:{lord:'Lord X',fac:A.owner},caravan:{from:A.name,band:1},beast:{id:'wolf',n:5},band:{label:'Bandits',n:20,chief:'Grak One-Eye'},fight:{win:'Bandits',lose:'The day watch of '+A.name},trace:{t:'wreck'},
  war:{a:A.owner,b:B.owner},peace:{a:A.owner,b:B.owner,ended:1},ally:{a:A.owner,b:B.owner},realm:{fac:A.owner,town:A.name},army:{lord:'Lord X',fac:A.owner,town:A.name,n:12},starving:{town:A.name,fac:A.owner}};
 const kinds=Object.keys(t.NEWS_KINDS);
 for(const k of kinds){t.newsRecord(k,by(A),det[k]);t.newsRecord(k,by(A,30,20),det[k])}
 ok(items().length===kinds.length&&kinds.every(k=>items().filter(it=>it.k===k).length===1),'each kind recorded once, the second the same day merged ('+items().length+' items for '+kinds.length+' kinds: '+kinds.join(', ')+')');
 ok(items().every(it=>it.near===A.name&&it.day===G.day&&it.detail&&t.rumourText(it).length>10),'each knows its holding, its day, its facts, and reads as a sentence ("'+t.rumourText(items()[0])+'")');
 {const it=items().find(x=>x.k==='beast'),id=it.id;G.day+=N.merge+1;t.newsRecord('beast',by(A),{id:'boar',n:2});
  ok(items().filter(x=>x.k==='beast').length===2&&items().find(x=>x.k==='beast'&&x.id!==id).detail.id==='boar','past NEWS.merge days the same kind is news again');G.day-=N.merge+1}
 {fresh();const C=live.filter(h=>h!==A).sort((p,q)=>d(p,A)-d(q,A))[0],mid=(f)=>({x:A.x+(C.x-A.x)*f,y:A.y+(C.y-A.y)*f});
  if(d(A,C)<N.radius*1.8){const a=t.newsRecord('beast',mid(.35),{id:'wolf',n:5}),b=t.newsRecord('beast',mid(.65),{id:'wolf',n:4});
   ok(a===b&&items().length===1&&a.near===C.name,'a beast that roams on, from by '+A.name+' to by '+C.name+', is one item, moved ('+a.near+')')}
  else ok(true,'(no holding near enough to '+A.name+' to roam between)')}
 {fresh();const m=N.merge;N.merge=-1;for(let i=0;i<N.keep+10;i++)t.newsRecord('fight',by(A),{win:'a',lose:'b'});N.merge=m;
  ok(items().length===N.keep&&items()[0].id===11,'kept to NEWS.keep ('+N.keep+'): the oldest go first')}
 {fresh();t.newsRecord('raid',by(A),{town:A.name});const d0=G.day;G.day+=N.days-1;t.newsTrim();const kept=items().length;G.day=d0+N.days;t.newsTrim();
  ok(kept===1&&items().length===0,'kept NEWS.days ('+N.days+') days, then gone');G.day=d0}

 // ---- the real hooks record
 {fresh();const L=W.lords.find(l=>!l.dead&&l.fac!==A.owner);Object.assign(L,{inside:null,state:'siege',tgt:A.name,x:A.x+16,y:A.y+12});t.routParty(L,[]);
  ok(items().some(it=>it.k==='lord'&&it.detail.lord===L.name)&&items().some(it=>it.k==='relieved'&&it.detail.town===A.name),'a lord routed on the map: news of him, and of the siege he was laying broken (fights.js routParty)');
  const band=t.asParty({x:A.x+40,y:A.y+30,n:5,kind:'bandits',cool:0}),cv=t.asParty({cv:true,fac:A.owner,from:A.name,to:B.name,x:A.x+40,y:A.y+30,goods:{grain:4},guards:3,cool:0,dir:1});
  t.bandits.push(band);W.caravans.push(cv);t.routParty(cv,[band]);ok(items().some(it=>it.k==='caravan'&&it.detail.from===A.name&&it.detail.band),'a caravan beaten by a band: news of it (routParty)');
  const L2=W.lords.find(l=>!l.dead&&l!==L),b2=t.asParty({x:A.x+60,y:A.y+20,n:4,kind:'bandits',cool:0});Object.assign(L2,{inside:null,state:'patrol',tgt:A.name,x:A.x+60,y:A.y+20,fight:null});t.bandits.push(b2);
  const f=t.startFight([b2],[L2]);t.endFight(f,0);ok(items().some(it=>it.k==='fight'&&/band/.test(it.detail.win)&&it.detail.lose===L2.name)&&items().some(it=>it.k==='band'&&it.detail.grew),'a battle on the map ended: who won where, and the band that won grows bolder (endFight)');
  W.lords.forEach(l=>{l.fight=null});t.bandits.length=0;W.caravans=[];W.fights=[]}
 {fresh();const m={id:'wolf',x:A.x+30,y:A.y+30,n:5,lv:1,cool:5,hx:0};W.monsters=[t.asMonster(m)];const big=t.asParty({x:A.x-30,y:A.y+30,n:30,kind:'bandits',cool:5});t.bandits.push(big);
  const pw=big.pw,mp=m.pw;W.lords.forEach(l=>{l.defend=null});t.landDefence(99);
  ok(items().some(it=>it.k==='beast'&&it.detail.id==='wolf')&&items().some(it=>it.k==='band'&&it.detail.n===30),'a beast and a big band on a holding’s land are talked of (defence.js landDefence)');
  ok(t.rating(big.troops,t.chiefLv(big))>=N.band,'the band is big enough ('+t.rating(big.troops,t.chiefLv(big))+' ≥ '+N.band+')');
  W.monsters=[];t.bandits.length=0;W.patrols=[];W.lords.forEach(l=>{l.defend=null})}
 {fresh();const e=t.roadSpawn('traveller',A.x+50,A.y+30);if(e){e.drop(t.roadNow());ok(items().some(it=>it.k==='trace'&&it.detail.t==='body'),'a trace left on the road: news of it (road.js drop)')}else ok(false,'a road encounter to leave a trace')}
 {fresh();const L=W.lords.find(l=>!l.dead&&l.fac!==A.owner),r=Math.random;Math.random=()=>.99;Object.assign(L,{inside:null,state:'siege',tgt:A.name,troops:['hum_levy'],sd:0});t.resolveSiege(L,A);Math.random=r;
  ok(items().some(it=>it.k==='relieved'&&it.detail.town===A.name),'a siege that fails: news (realms.js resolveSiege)');W.lords.forEach(l=>{l.fight=null})}

 // ---- recording draws no Math.random
 {fresh();const mon=t.asMonster({id:'wolf',x:B.x+10,y:B.y+10,n:4,lv:1}),bd=t.asParty({x:B.x-10,y:B.y+10,n:30,kind:'bandits',cool:5}),r=Math.random;let n=0;Math.random=()=>{n++;return r()};
  for(const k of kinds)t.newsRecord(k,by(B),det[k]);
  const w={label:()=>'Bandits',mapKind:'band',x:B.x,y:B.y,troops:['bandit'],ld:{name:'Grak'}},l={label:()=>'Lord Y',mapKind:'lord',x:B.x,y:B.y};t.newsFight({x:B.x,y:B.y},[w],[l]);
  const p0=bd.pw;t.newsThreat(mon);t.newsThreat(bd);t.newsTrim();Math.random=r;
  ok(n===0&&items().length>=kinds.length,'recording draws no Math.random ('+n+' draws over '+items().length+' items), so the world runs as it did');
  ok(bd.pw===p0&&!mon.pw,'nor touches what it reads (a band’s strength cache, a beast’s, left as they were)')}

 // ---- a tavern: at most 2 new a day, then "Nothing new today"; new again the next day
 fresh();const k4=['siege','beast','caravan','trace'];k4.forEach((k,i)=>t.newsRecord(k,by(A,10+i*40,10),det[k]));
 const log0=G.msgs.filter(m=>/^Rumour \(/.test(m.m)).length;world();t.enterTown(A);t.act('tab','tavern');
 const newN=()=>(panel().match(/class="rum-new"/g)||[]).length;
 ok(newN()===2&&Object.keys(W.news.heard).length===2&&G.msgs.filter(m=>/^Rumour \(/.test(m.m)).length===log0+2,'the tavern of '+A.name+' tells 2 new rumours (and they go in the log): '+[...panel().matchAll(/class="rum-new">.*?<\/span> (.*?)<\/p>/g)].map(m=>m[1]).join(' | '));
 t.act('tab','home');t.act('tab','tavern');t.act('leave');world();t.enterTown(A);t.act('tab','tavern');
 ok(newN()===0&&/Nothing new today; come back tomorrow\./.test(panel())&&/Heard before/.test(panel())&&Object.keys(W.news.heard).length===2,'later that day: nothing new; what you heard is listed under "Heard before"');
 G.day++;t.act('tab','home');t.act('tab','tavern');ok(newN()===2&&Object.keys(W.news.heard).length===4,'the next day, 2 new again');
 t.act('tab','home');t.act('tab','tavern');ok(newN()===0,'and then none (no news left)');t.act('leave');world();
 // another tavern: its own cap; only nearby news
 {fresh();['siege','beast','caravan'].forEach((k,i)=>{t.newsRecord(k,by(A,10+i*40,10),det[k]);t.newsRecord(k,by(B,10+i*40,10),det[k])});
  const ra=t.rumourFrom(t.rumourSource('tavern',A.name,A)),ra2=t.rumourFrom(t.rumourSource('tavern',A.name,A)),rb=t.rumourFrom(t.rumourSource('tavern',B.name,B));
  ok(ra.fresh.length===2&&ra2.fresh.length===0&&ra2.capped&&rb.fresh.length===2,'another tavern ('+B.name+') has its own cap: 2 there too, the same day');
  ok([...ra.fresh,...rb.fresh].every(it=>it.near===(ra.fresh.includes(it)?A.name:B.name)),'each tells only its own nearby news')}
 {fresh();t.newsRecord('siege',{x:A.x+N.radius+60,y:A.y},det.siege);t.newsRecord('beast',by(A),det.beast);const old=t.newsRecord('trace',by(A,60,10),det.trace);old.day=G.day-N.days;
  const r=t.rumourFrom(t.rumourSource('tavern',A.name,A));ok(r.fresh.length===1&&r.fresh[0].k==='beast','only news within NEWS.radius ('+N.radius+' px) and the last NEWS.days days is told')}
 {fresh();t.newsRecord('trace',by(A),det.trace);t.newsRecord('siege',by(A,40,0),det.siege);const r=t.rumourFrom(t.rumourSource('tavern',A.name,A));
  ok(r.fresh.map(it=>it.k).join()==='siege,trace','the weightiest first (a siege before a trace on the road)')}

 // ---- the other sources: each its cap a day, independent between sources and between two of a kind; heard once is heard everywhere
 {fresh();const kinds2=['band','beast','trace','raid','caravan','siege','relieved','fight'];
  const d0=G.day;for(const dd of [2,0]){G.day=d0-dd;for(const h of [A,B])kinds2.forEach((k,i)=>t.newsRecord(k,by(h,8+i*12,8+dd*4),{...det[k],town:h.name,fac:h.owner}))}G.day=d0;
  const src={tavern:[A.name,A],estate:[A.name+':farm',by(A)],watch:[A.name,A],caravan:[A.name+'>'+B.name,[A,B]],lord:['l1',A,{fac:A.owner}],road:[7,by(A)],refugees:[8,by(A)],camp:['1,1',by(A)],hermit:['2,2',by(A)]};
  const caps=Object.keys(t.RUMOUR_SOURCES).map(k=>{const [key,at,x]=src[k],S=()=>t.rumourSource(k,key,at,x),a=t.rumourFrom(S()),b=t.rumourFrom(S());return [k,a.fresh.length,b.fresh.length,t.RUMOUR_SOURCES[k].cap]});
  ok(caps.every(([k,a,b,c])=>a===c&&b===0),'each source gives its cap a day and no more: '+caps.map(([k,a,b,c])=>k+' '+a+'+'+b+' (cap '+c+')').join(', '));
  const heard=Object.keys(W.news.heard).map(Number);ok(new Set(heard).size===heard.length&&heard.length===caps.reduce((s,c)=>s+c[1],0),'no rumour told twice as new, by any source ('+heard.length+' heard)')}
 {fresh();for(const h of [A,B])['band','beast','trace'].forEach((k,i)=>t.newsRecord(k,by(h,8+i*20,8),det[k]));
  const e1=t.rumourFrom(t.rumourSource('estate',A.name+':farm',by(A))),e2=t.rumourFrom(t.rumourSource('estate',A.name+':pasture',by(A,30,8)));
  const [l1,l2]=W.lords.filter(l=>!l.dead&&l.fac===A.owner);t.newsRecord('siege',by(A,0,30),{town:A.name,fac:B.owner,lord:'Lord Z'});t.newsRecord('relieved',by(A,30,30),{town:A.name,fac:A.owner,lord:'Lord Q'});
  const r1=t.rumourFrom(t.rumourSource('lord',l1.id,l1,{fac:l1.fac})),r2=l2?t.rumourFrom(t.rumourSource('lord',l2.id,l2,{fac:l2.fac})):{fresh:[1]};
  ok(e1.fresh.length===1&&e2.fresh.length===1&&e1.fresh[0]!==e2.fresh[0],'two estates of '+A.name+' each tell their own one a day');
  ok(r1.fresh.length===1&&r2.fresh.length===1&&['siege','relieved'].includes(r1.fresh[0].k),'two lords of the '+t.FACS[A.owner].n+' each tell their own one a day, of their realm’s wars ('+r1.fresh[0].k+')');
  const tv=t.rumourFrom(t.rumourSource('tavern',A.name,A));ok(tv.fresh.every(it=>![...e1.fresh,...e2.fresh,...r1.fresh,...(r2.fresh||[])].includes(it))&&tv.before.length>=3,'a rumour heard from one source is not told again as new by another (the tavern lists them as heard before)')}
 // the pages: a worker, the watch, a lord, the road's talkers say theirs
 {fresh();t.newsRecord('beast',by(A),det.beast);t.newsRecord('band',by(A,40,10),det.band);t.newsRecord('trace',by(A,60,0),det.trace);
  const e=t.roadSpawn('merchant',A.x+40,A.y+20);if(e){world();t.roadMeet(e);const i=e.D.acts.findIndex(c=>c.label==='Ask for news');t.act('enc-do',i);
   ok(/“.+”/.test(panel())&&Object.keys(W.news.heard).length===1&&e.asked,'the peddler on the road tells a rumour when asked ("'+((document.querySelector('.pg-msg')||{}).textContent||'')+'")');t.act('enc-leave');world()}
  else ok(false,'a peddler on the road')
  const L=W.lords.find(l=>!l.dead&&l.fac===A.owner);Object.assign(L,{inside:null,x:A.x+30,y:A.y+30});t.newsRecord('siege',by(A,0,40),{town:A.name,fac:B.owner,lord:'Lord Z'});
  t.lordMeet(L);ok(panel().includes(L.name+': “'),'a lord tells of his realm’s war when you meet him');world()}

 // ---- the "?" on the map: near the event, off its spot by its id, with its tooltip; it fades
 {fresh();const it=t.newsRecord('caravan',by(A),det.caravan);t.rumourFrom(t.rumourSource('tavern',A.name,A));const m=t.rumourMarks()[0];
  ok(m&&m.id===it.id&&d(m,it)<=N.off*1.5&&(m.x!==it.x||m.y!==it.y),'a heard rumour puts a "?" near the event, a little off it ('+(m?Math.round(d(m,it)):'-')+' px)');
  fresh();t.newsRecord('caravan',by(A),det.caravan);t.rumourFrom(t.rumourSource('tavern',A.name,A));const m2=t.rumourMarks()[0];
  ok(m2&&m2.x===m.x&&m2.y===m.y,'the same spot every time (seeded by its id, not Math.random)');
  ok(t.rumourTip(m.x,m.y-8).includes(m.t)&&!t.rumourTip(m.x+40,m.y),'its tooltip is the rumour');
  P.x=m.x;P.y=m.y+20;world();const cam={x:Math.round(P.x-t.VW/2),y:Math.round(P.y-t.VH/2)},c=t.ctx,cv=c.canvas,lit=()=>{const px=c.getImageData(0,0,cv.width,cv.height).data;let n=0;for(let i=0;i<px.length;i+=4)if(px[i+2]>180&&px[i]>140&&px[i+1]<200)n++;return n};
  c.save();c.setTransform(1,0,0,1,0,0);c.fillStyle='#000';c.fillRect(0,0,cv.width,cv.height);c.restore();const n0=lit();t.drawRumourMarks(cam);const n1=lit();
  ok(n0===0&&n1>=6,'drawn on the map: a violet "?" ('+n1+' px)');
  const d0=G.day;G.day=d0+N.markDays-1;G.clock=t.DAY*.5;const f=t.rumourFade(m);G.day=d0+N.markDays;G.clock=t.DAY*.3;t.newsTrim();
  ok(f>.4&&f<.6&&t.rumourMarks().length===0,'it fades over its last day ('+f.toFixed(2)+') and is gone after NEWS.markDays ('+N.markDays+')');G.day=d0}

 // ---- the save keeps the news, what you heard and today's counts
 {fresh();['siege','beast','caravan'].forEach((k,i)=>t.newsRecord(k,by(A,10+i*40,10),det[k]));const r=t.rumourFrom(t.rumourSource('tavern',A.name,A));
  world();t.saveGame(true,'quick');const sv=JSON.parse(localStorage.getItem(t.slotKey('quick'))),n=sv.world.news;
  ok(n&&n.items.length===3&&Object.keys(n.heard).length===2&&n.told['tavern:'+A.name].ids.length===2&&n.marks.length===2,'the save keeps the news, the heard ones, today’s count and the marks');
  const was=JSON.stringify(W.news);t.newsLoad(null);t.loadGame('quick');
  ok(JSON.stringify(W.news)===was,'loaded back as they were');
  const again=t.rumourFrom(t.rumourSource('tavern',A.name,A));ok(again.fresh.length===0&&again.capped,'after the load the tavern still has nothing new today');
  t.newsLoad(null);world();t.saveGame(true,'quick');ok(!('news' in JSON.parse(localStorage.getItem(t.slotKey('quick'))).world),'with no news yet, the save has none (as before it)');
  t.loadGame('quick');ok(W.news&&W.news.items.length===0&&typeof W.news.heard==='object','a save without it loads with none')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
