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
 ok(qa('.talk-line').length===1&&qa('.talk-line')[0].textContent.includes('What brings you'),'his first words, as you have never met');
 ok(qa('.talk-replies [data-key]').map(b=>b.dataset.key+':'+b.dataset.act).join()==='1:lr-rumours,2:lr-lords','his replies numbered: 1 rumours, 2 other lords');
 ok(q('.nav [data-act="lord-leave"]')&&q('[data-act="lr-gift"]'),'his own blocks under them (a gift), and Leave in the bottom bar');
 ok(t.Conversation.key('1')&&G.enc.talk.rumours&&qa('.talk-line').length===2,'key 1: asks for rumours, and his answer is said');
 t.Conversation.key('1');ok(qa('.talk-line').length===2,'asked again this visit: said once');
 t.Conversation.key('2');ok(qa('.talk-told').length===1,'key 2: what he tells of other lords');
 ok(M.knows('lord:'+l.id)&&M.all['lord:'+l.id].met===G.day,'he remembers meeting you');
 t.act('lord-leave');t.lordMeet(l);ok(qa('.talk-line').length===1&&qa('.talk-line')[0].textContent.includes('Speak, then'),'met again: he greets you as one he knows');t.act('lord-leave');
 {const s=JSON.stringify(t.Conversation.save());M.all={};M.load(JSON.parse(s));ok(M.knows('lord:'+l.id),'what they remember is kept in the save')}
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
