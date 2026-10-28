'use strict';
// Conversations (story/conversation.js, doc/DIALOGUE_DESIGN.md phase 1): a lord, a townsperson, a guard and a worker speak in one
// window: their face and name, what they said this visit (quoted), the replies numbered 1-9 (a key answers), their own blocks,
// and the frame's bottom bar; they greet you by what they remember (TalkMemory, kept in the save).
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P,W=t.W,M=t.TalkMemory,q=Kit.q,qa=s=>[...document.querySelectorAll('#panel '+s)];window.requestAnimationFrame=()=>0;
 Kit.begin('soldier',23);Kit.clear();Kit.world({town:null});P.hostile={};
 const l=W.lords.find(x=>!x.dead&&!t.hostileTo(x.fac));Object.assign(l,{inside:null,x:P.x+3,y:P.y});M.all={};
 // ---- a lord
 t.lordMeet(l);
 ok(q('.talk-head img.talk-pic')&&q('.talk-head h2').textContent===l.name&&/Lord of the/.test(q('.talk-head').textContent),'a lord: his face, his name and his standing at the head');
 const sp=new t.LordSpeaker(l),g=t.DIALOGUE.greet.lord[l.temper];ok(t.TEMPERS.includes(l.temper)&&qa('.talk-line').length===1&&qa('.talk-line')[0].innerHTML.includes(sp.fill(g.first).split(' ')[0]),'his first words, by his temper ('+l.temper+'), as you have never met');
 ok(qa('.talk-replies [data-key]').map(b=>b.dataset.key+':'+b.dataset.act).slice(0,2).join()==='1:lr-rumours,2:lr-lords'&&q('[data-act="talk-flatter"]'),'his replies numbered: 1 rumours, 2 other lords, then the checks');
 ok(q('.nav [data-act="lord-leave"]')&&q('[data-act="lr-gift"]'),'his own blocks under them (a gift), and Leave in the bottom bar');
 ok(t.Conversation.key('1')&&G.enc.talk.rumours&&qa('.talk-line').length===2,'key 1: asks for rumours, and his answer is said');
 t.Conversation.key('1');ok(qa('.talk-line').length===2,'asked again this visit: said once');
 t.Conversation.key('2');const named=[...t.lordFriends(l).filter(o=>!o.dead).slice(0,3),...t.lordRivals(l).filter(o=>!o.dead).slice(0,3)];ok(qa('.talk-told').length===(named.length?2:1),'key 2: what he tells of other lords, and of their manner');
 ok(named.every(o=>M.all['lord:'+o.id]?.temper&&new t.LordSpeaker(o).knowsTemper()&&!M.knows('lord:'+o.id)),'their tempers are known to you now (but you have not met them)');
 ok(M.knows('lord:'+l.id)&&M.all['lord:'+l.id].met===G.day,'he remembers meeting you');
 t.act('lord-leave');t.lordMeet(l);ok(qa('.talk-line').length===1&&qa('.talk-line')[0].innerHTML.includes(sp.fill(g.again).slice(-12)),'met again: he greets you as one he knows');t.act('lord-leave');
 {const s=JSON.stringify(t.Conversation.save());M.all={};M.load(JSON.parse(s));ok(M.knows('lord:'+l.id),'what they remember is kept in the save')}
 // ---- phase 2: a lord's checks (his temper's, the odds read by Insight; won or lost, an outcome; once a day)
 {const L=W.lords.find(x=>x!==l&&!x.dead&&!t.hostileTo(x.fac));Object.assign(L,{inside:null,x:P.x+3,y:P.y,temper:'proud'});const o=t.LordSpeaker.prototype.odds,S=new t.LordSpeaker(L);
  const proud=S.odds('flatter');L.temper='kind';const kind=S.odds('flatter');L.temper='proud';ok(proud<kind,'praise works worse on a proud lord ('+Math.round(proud*100)+'%) than a kind one ('+Math.round(kind*100)+'%)');
  try{t.LordSpeaker.prototype.odds=()=>1;t.lordMeet(L);const r0=t.relWith(L);q('[data-act="talk-flatter"]').click();
   ok(t.relWith(L)===r0+t.DIALOGUE.checks.flatter.win.rel&&qa('.talk-line.you').length===1&&qa('.talk-line').some(e=>e.innerHTML.includes(t.DIALOGUE.checks.flatter.yes.plain)),'praised: your words, his answer, relation +'+t.DIALOGUE.checks.flatter.win.rel);
   ok(q('[data-act="talk-flatter"]').disabled&&/Not again today/.test(q('[data-act="talk-flatter"]').textContent),'and not again today');
   const tc=t.troopCount();L.troops=Array(20).fill('hum_foot');t.lordMeet(L);q('[data-act="talk-favour"]').click();ok(t.troopCount()===tc+t.RELATION.troops&&L.lend>G.day,'a favour granted: he lends you '+t.RELATION.troops+' soldiers, liking you or not');
   t.LordSpeaker.prototype.odds=()=>0;L.troops=['militia'];P.troops={hum_knight:10};const h0=t.honorWith(L.fac),r1=t.relWith(L);t.lordMeet(L);q('[data-act="talk-threaten"]').click();
   ok(t.relWith(L)===r1+t.DIALOGUE.checks.threaten.lose.rel&&t.honorWith(L.fac)<h0&&qa('.talk-line').some(e=>e.innerHTML.includes(t.DIALOGUE.checks.threaten.no.proud)),'a threat that fails: his proud answer, relation and honour lost');
   t.act('lord-leave');t.lordMeet(L);ok(qa('.talk-line')[0].innerHTML.includes('not forgotten your threats'),'and he remembers it when you meet again');t.act('lord-leave');
   const g0=P.gold;t.TalkMemory.all['lord:'+L.id].tried={};t.LordSpeaker.prototype.odds=()=>1;t.lordMeet(L);q('[data-act="talk-threaten"]').click();ok(P.gold>g0,'a threat that works: he pays ('+(P.gold-g0)+'g)');t.act('lord-leave');
  }finally{t.LordSpeaker.prototype.odds=o}}
 // ---- a townsperson and a guard, in the streets
 const town=t.TOWNS.find(x=>x.owner&&!t.hostileTo(x.owner));G.scene={ref:town.name,p:{x:0,y:0},npcs:[],folk:[]};G.mode='scene';
 t.sceneTalk({folk:true,name:'Old Ada'});ok(q('.talk-head h2').textContent==='Old Ada'&&qa('.talk-line').length===1&&q('.nav [data-act="scene-back"]'),'a townsperson: her face, her gossip quoted, Back to the streets');
 t.sceneTalk({guard:true});ok(q('.talk-head h2').textContent==='Guard'&&/Stranger\./.test(qa('.talk-line')[0].textContent)&&qa('.talk-line').length===2,'a guard: a word for a stranger, then his own');
 t.sceneTalk({guard:true});ok(/You again/.test(qa('.talk-line')[0].textContent),'and he knows you the second time');
 G.scene=null;G.mode='world';t.hidePanel();
 // ---- a worker
 const f=W.folk.find(x=>t.townBy(x.home));if(f){t.workerMeet(f);ok(q('.talk-head h2')&&qa('.talk-line').length>=1&&q('.nav [data-act="dlg-close"]')&&q('[data-act="wk-hire"]'),'a worker: his words, then hiring and the rest, Leave');t.act('dlg-close')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
