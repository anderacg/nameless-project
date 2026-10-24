'use strict';
// Lord identities are earned through a meeting or chosen information; opening and refreshing an audience never spreads gossip.
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P,W=t.W,K=t.KNOWLEDGE,q=Kit.q;
 window.requestAnimationFrame=()=>0;
 const start=()=>{Kit.begin('soldier',23);Kit.clear();Kit.world({town:null});P.hostile={};W.news=undefined};
 start();const l=W.lords.find(x=>x.name==='Lord Aldric'),mate=W.lords.find(x=>x!==l&&x.fac===l.fac),holding=t.fiefsOf(l.fac)[0];
 Object.assign(l,{inside:null,x:P.x+3,y:P.y});Object.assign(mate,{inside:holding.name,x:holding.x,y:holding.y});
 const news=t.newsRecord('lord',holding,{lord:mate.name,fac:mate.fac}),n0=G.msgs.length;
 K.watch();t.openJournal('lords');ok(!K.knowsLord(l)&&!K.knowsLord(mate)&&/0 known lords/.test(Kit.text()),'a starting army and a nearby court do not reveal lord identities');
 Kit.world();t.lordMeet(l);const blank=JSON.stringify(K.save()),N=W.news,key='lord:'+l.id;
 ok(K.knowsLord(l)&&W.lords.filter(o=>K.knowsLord(o)).length===1,'meeting Aldric discovers only Aldric');
 ok(N.heard[news.id]==null&&!N.told[key]&&G.msgs.length===n0,'opening an audience neither hears news, spends its daily rumour allowance, nor logs gossip');
 ok(q('[data-act="lr-rumours"]')&&q('[data-act="lr-lords"]'),'rumours and other lords have deliberate dialogue choices');
 ok(W.lords.filter(o=>o!==l).every(o=>!Kit.text().includes(o.name)),'opening words and relationship text contain no unknown lord names');
 t.lordMeet(l);ok(JSON.stringify(K.save())===blank&&N.heard[news.id]==null&&!N.told[key],'refreshing the audience does not reveal other lords or hear rumours');
 P.gold=500;q('[data-act="lr-gift"]').click();
 ok(W.lords.filter(o=>K.knowsLord(o)).length===1&&N.heard[news.id]==null&&!N.told[key],'giving a gift and redrawing the audience does not fetch gossip');
 const named=[...t.lordFriends(l).filter(o=>!o.dead).slice(0,3),...t.lordRivals(l).filter(o=>!o.dead).slice(0,3)];
 q('[data-act="lr-lords"]').click();
 ok(named.length>0&&named.every(o=>K.knowsLord(o))&&W.lords.filter(o=>o!==l&&!named.includes(o)).every(o=>!K.knowsLord(o)),'asking about other lords reveals exactly the names in that answer');
 ok(named.every(o=>K.lords[o.id]===null),'names from a social answer do not grant remote whereabouts or troop counts');
 ok(N.heard[news.id]==null&&!N.told[key],'asking about other lords does not consume the separate rumour choice');
 ok((Kit.text().match(/Friends with /g)||[]).length===1,'the social answer is displayed once');
 const social=JSON.stringify(K.save());q('[data-act="lr-lords"]').click();ok(JSON.stringify(K.save())===social,'repeating the social choice does not grant more names');
 t.act('lord-leave');const before=JSON.stringify(K.save());t.act('lr-rumours',l.id);
 ok(JSON.stringify(K.save())===before&&N.heard[news.id]==null,'a dialogue choice cannot run after leaving its audience');
 // Choose rumours in an independent fresh audience; preserve the source service's cap and cache the visible answer.
 start();const a=W.lords.find(o=>o.name==='Lord Aldric'),b=W.lords.find(o=>o!==a&&o.fac===a.fac),c=W.lords.find(o=>o.fac!==a.fac),at=t.fiefsOf(a.fac)[0];
 Object.assign(a,{inside:null,x:P.x+3,y:P.y});const rum=t.newsRecord('lord',at,{lord:b.name,fac:b.fac});
 t.lordMeet(a);q('[data-act="lr-rumours"]').click();
 ok(W.news.heard[rum.id]===G.day&&K.knowsLord(b)&&K.lords[b.id]&&Kit.text().includes(K.lords[b.id].text),'choosing rumours learns and displays the named lord’s dated report');
 ok(!K.knowsLord(c)&&t.lordFriends(a).filter(o=>o!==b).every(o=>!K.knowsLord(o)),'a rumour leaves unmentioned friends and other realms’ lords unknown');
 const messages=G.msgs.length,answer=G.enc.talk.rumours;t.lordMeet(a);q('[data-act="lr-rumours"]').click();
 ok(G.msgs.length===messages&&G.enc.talk.rumours===answer&&W.news.told['lord:'+a.id].ids.length===1,'redraws and repeated clicks keep the answer, without logging or hearing it twice');
 t.act('lord-leave');t.lordMeet(a);q('[data-act="lr-rumours"]').click();
 ok(G.msgs.length===messages&&G.enc.talk.rumours===answer,'a later audience respects the source’s existing daily rumour cap');
 t.act('lord-leave');t.lordMeet(a);t.act('lr-lords',c.id);ok(!K.knowsLord(c),'a topic cannot target a different lord from the one being addressed');
 // The same explicit topic works in the streets, and Leave keeps the town return route.
 t.act('lord-leave');K.reset();a.inside=at.name;G.town={ref:at};G.scene={};G.mode='scene';t.lordMeet(a);
 ok(G.mode==='scene'&&K.knowsLord(a)&&!K.knowsLord(b),'an audience in the streets initially discovers only its speaker');
 q('[data-act="lr-lords"]').click();ok(G.mode==='scene'&&K.knowsLord(b),'the explicit social topic also works for a lord holding court');
 G.scene=null;G.town=null;G.enc=null;Kit.world();
});
