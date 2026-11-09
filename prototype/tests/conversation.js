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
 ok(q('.talk-head img.talk-pic')&&q('.talk-head h2').textContent===l.name&&/(Lord|Lady) of the/.test(q('.talk-head').textContent),'a lord: his face, his name and his standing at the head');
 const sp=new t.LordSpeaker(l),g=t.DIALOGUE.greet.lord[l.temper];ok(t.TEMPERS.includes(l.temper)&&qa('.talk-line').length>=1&&qa('.talk-line').length<=1+t.DIALOGUE.remember.most&&qa('.talk-line')[0].innerHTML.includes(sp.fill(g.first).split(' ')[0]),'his first words, by his temper ('+l.temper+'), as you have never met (then what he remembers: '+(qa('.talk-line').length-1)+')');
 ok(qa('.talk-replies [data-key]').map(b=>b.dataset.key+':'+b.dataset.act+'='+b.dataset.arg).slice(0,3).join()==='1:talk-topic=talk,2:talk-topic=ask,3:talk-topic=sway'&&!q('[data-act="lr-rumours"]')&&q('.nav [data-act="lord-leave"]'),'his topics first, numbered: 1 talk, 2 ask, 3 sway; Leave in the bottom bar');
 t.act('talk-topic','sway');const thr=new t.LordSpeaker(l).checkWhy('threaten'),nt=()=>q('.talk-not')?.textContent||'';ok((q('[data-act="lr-gift"]')||/gift/.test(nt()))&&/in part/.test(q('[data-act="talk-flatter"]').textContent)&&!q('.talk-replies button[disabled]')&&(!thr||/tribute/.test(nt()))&&q('.nav [data-act="talk-topic"]'),
   'Sway: a gift, his regard (won, in part, or lost); what cannot be done now folded into one line'+(thr?' (tribute: '+thr+')':'')+'; its bar\'s Back to the topics');
 t.act('talk-flatter',l.id);const ways=qa('[data-act^="talk-way_"]');ok(ways.length>=2&&ways.every(b=>b.querySelector('.talk-odds'))&&q('.nav [data-act="talk-topic"][data-arg="sway"]')&&/Win/.test(q('.talk-topic').textContent),'his regard: the ways to put it ('+ways.map(b=>b.dataset.act.slice(9)).join(', ')+'), each its odds; Back to Sway');
 t.onEscape();ok(q('[data-act="talk-flatter"]')&&!q('[data-act^="talk-way_"]'),'Esc: back to Sway');
 t.onEscape();ok(G.mode==='dialog'&&q('[data-act="talk-topic"][data-arg="talk"]'),'Esc: back to his topics');
 t.Conversation.key('1');ok(qa('.talk-replies [data-key]').map(b=>b.dataset.key+':'+b.dataset.act).slice(0,2).join()==='1:lr-rumours,2:lr-lords'&&q('.talk-topic'),'key 1: Talk, its replies: 1 rumours, 2 other lords');
 const n0=qa('.talk-line').length;ok(t.Conversation.key('1')&&G.enc.talk.rumours&&qa('.talk-line').length===n0+1,'key 1: asks for rumours, and his answer is said');
 t.Conversation.key('1');ok(qa('.talk-line').length===n0+1,'asked again this visit: said once');
 t.Conversation.key('2');const named=[...t.lordFriends(l).filter(o=>!o.dead).slice(0,3),...t.lordRivals(l).filter(o=>!o.dead).slice(0,3)];ok(qa('.talk-told').length===(named.length?2:1),'key 2: what he tells of other lords, and of their manner');
 ok(named.every(o=>M.all['lord:'+o.id]?.temper&&new t.LordSpeaker(o).knowsTemper()&&!M.knows('lord:'+o.id)),'their tempers are known to you now (but you have not met them)');
 ok(M.knows('lord:'+l.id)&&M.all['lord:'+l.id].met===G.day,'he remembers meeting you');
 t.act('lord-leave');t.lordMeet(l);ok(qa('.talk-line')[0].innerHTML.includes(sp.fill(g.again).slice(-12)),'met again: he greets you as one he knows');t.act('lord-leave');
 {const s=JSON.stringify(t.Conversation.save());M.all={};M.load(JSON.parse(s));ok(M.knows('lord:'+l.id),'what they remember is kept in the save')}
 // ---- phase 2: a lord's checks (his temper's, the odds read by Insight; won or lost, an outcome; once a day)
 {const L=W.lords.find(x=>x!==l&&!x.dead&&!t.hostileTo(x.fac));Object.assign(L,{inside:null,x:P.x+3,y:P.y,temper:'proud'});const o=t.LordSpeaker.prototype.odds,S=new t.LordSpeaker(L);
  const proud=S.odds('flatter');L.temper='kind';const kind=S.odds('flatter');L.temper='proud';ok(proud<kind,'praise works worse on a proud lord ('+Math.round(proud*100)+'%) than a kind one ('+Math.round(kind*100)+'%)');
  try{t.LordSpeaker.prototype.odds=()=>1;t.lordMeet(L);const r0=t.relWith(L);t.act('talk-topic','sway');t.act('talk-flatter',L.id);t.act('talk-way_praise',L.id);
   ok(t.relWith(L)===r0+t.DIALOGUE.checks.flatter.win.rel&&qa('.talk-line.you').length===1&&qa('.talk-line').some(e=>e.innerHTML.includes(t.DIALOGUE.checks.flatter.yes.plain)),'praised: your words, his answer, relation +'+t.DIALOGUE.checks.flatter.win.rel);
   t.act('talk-topic','sway');ok(!q('[data-act="talk-flatter"]')&&/Not again today/.test(q('.talk-not').textContent),'and not again today');
   const tc=t.troopCount();L.troops=Array(20).fill('hum_foot');t.lordMeet(L);t.act('talk-favour',L.id);t.act('talk-way_honour',L.id);ok(t.troopCount()===tc+t.RELATION.troops&&L.lend>G.day,'a favour granted: he lends you '+t.RELATION.troops+' soldiers, liking you or not');
   t.LordSpeaker.prototype.odds=()=>-1;L.troops=['militia'];P.troops={hum_knight:10};const h0=t.honorWith(L.fac),r1=t.relWith(L);t.lordMeet(L);t.act('talk-threaten',L.id);
   ok(t.relWith(L)===r1+t.DIALOGUE.checks.threaten.lose.rel&&t.honorWith(L.fac)<h0&&qa('.talk-line').some(e=>e.innerHTML.includes(t.DIALOGUE.checks.threaten.no.proud)),'a threat that fails: his proud answer, relation and honour lost');
   t.act('lord-leave');t.lordMeet(L);ok(qa('.talk-line')[0].innerHTML.includes('not forgotten your threats'),'and he remembers it when you meet again');t.act('lord-leave');
   const g0=P.gold;t.TalkMemory.all['lord:'+L.id].tried={};t.LordSpeaker.prototype.odds=()=>1;t.lordMeet(L);t.act('talk-threaten',L.id);ok(P.gold>g0,'a threat that works: he pays ('+(P.gold-g0)+'g)');t.act('lord-leave');
   // (deeper persuasion: won in part, between won and lost; his manner takes to some ways more than others)
   const p0=t.relWith(L);t.TalkMemory.all['lord:'+L.id].tried={};const pt=t.DIALOGUE.part;t.DIALOGUE.part=2;t.LordSpeaker.prototype.odds=()=>-1;t.lordMeet(L);t.act('talk-flatter',L.id);t.act('talk-way_honour',L.id);t.DIALOGUE.part=pt;
   ok(t.relWith(L)===p0+t.DIALOGUE.checks.flatter.part.rel&&qa('.talk-line').some(e=>e.innerHTML.includes(t.DIALOGUE.checks.flatter.half.proud)),'won in part: his half answer, relation +'+t.DIALOGUE.checks.flatter.part.rel);t.act('lord-leave');
   t.LordSpeaker.prototype.odds=o;const S2=new t.LordSpeaker(L);ok(S2.odds('flatter','honour')>S2.odds('flatter','praise')&&S2.best('flatter')==='honour','a proud lord takes better to honour ('+Math.round(S2.odds('flatter','honour')*100)+'%) than to praise ('+Math.round(S2.odds('flatter','praise')*100)+'%): the way that suits him');
  }finally{t.LordSpeaker.prototype.odds=o}}
 // ---- what lords remember: your last deed toward him in his words, said once; one of your line he knew, once you are someone new
 {const L=W.lords.find(x=>!x.dead&&!t.hostileTo(x.fac)&&x!==l);Object.assign(L,{inside:null,x:P.x+3,y:P.y});M.all={};const why0=P.lrelWhy;
  try{P.lrelWhy={[L.id]:[{d:G.day,n:6,why:'you let them go'}]};t.lordMeet(L);ok(qa('.talk-line').some(e=>e.innerHTML.includes('you let me go')),'he remembers your last deed, in his words: you let me go');
   t.act('lord-leave');t.lordMeet(L);ok(!qa('.talk-line').some(e=>e.innerHTML.includes('you let me go')),'and says it once');t.act('lord-leave');
   const Lg=t.Legacy,line0=Lg.line,f0=Lg.fallen,k0=Lg.kin;Lg.line=[{n:f0+1,who:'Aldric Ashby',by:'a pack of wolves',g:'m'}];Lg.fallen=f0+1;Lg.kin={rel:'child',of:f0+1};
   try{t.lordMeet(L);const said=qa('.talk-line').map(e=>e.innerHTML).join(' ');ok(/You have the look of Aldric Ashby/.test(said)&&!said.includes(new t.LordSpeaker(L).fill(t.DIALOGUE.greet.lord[L.temper]?.again||t.DIALOGUE.greet.lord.again).slice(-10)),'met by one of your line who fell: to you, kin of theirs, a first meeting, and he remembers them');t.act('lord-leave');
   Lg.line=[{n:f0+1,who:'Aldric Ashby',by:'wolves'},{n:f0+2,who:'Mira Thorn',by:'a bear'}];Lg.fallen=f0+2;Lg.kin={rel:'child',of:f0+2};M.all['lord:'+L.id].gen=f0;M.all['lord:'+L.id].said=[];
   t.lordMeet(L);const s2=qa('.talk-line').map(e=>e.innerHTML).join(' ');ok(/Another under the banner Aldric Ashby rode under/.test(s2)&&!/the look of/.test(s2),'he knew one of your line, but you are kin of another: you are a stranger to him, under their banner');t.act('lord-leave')}
   finally{Lg.line=line0;Lg.fallen=f0;Lg.kin=k0}}
  finally{P.lrelWhy=why0}}
 // ---- edge cases of the ways: what you ask then how you put it; leaning on him costs his liking, won or not, and he remembers it in his words
 {const L=W.lords.find(x=>!x.dead&&!t.hostileTo(x.fac)&&x!==l);Object.assign(L,{inside:null,x:P.x+3,y:P.y,troops:Array(12).fill('hum_foot')});P.troops={hum_knight:6};M.all={};P.lrelWhy={};const o=t.LordSpeaker.prototype.odds;
  try{t.LordSpeaker.prototype.odds=()=>1;(P.lrel??={})[L.id]=0;L.lend=0;const r0=t.relWith(L);t.lordMeet(L);t.act('talk-topic','ask');t.act('talk-favour',L.id);const ws=qa('[data-act^="talk-way_"]').map(b=>b.dataset.act.slice(9));
   if(!ws.includes('fear'))ok(false,'fear open ('+ws+'; power '+t.partyPower()+' vs '+L.power()+'; '+(q('.talk-not')?.textContent||'')+')');else{t.act('talk-way_fear',L.id);const you=qa('.talk-line.you').map(e=>e.textContent);
    ok(you.length===2&&you[0].includes(t.DIALOGUE.checks.favour.ask)&&you[1].includes(t.DIALOGUE.ways.fear.you)&&t.relWith(L)===r0+t.DIALOGUE.ways.fear.cost,'his soldiers, leaning on him: what you ask, then how you put it; his liking '+t.DIALOGUE.ways.fear.cost+' though he gives in');
    t.act('lord-leave');t.lordMeet(L);ok(qa('.talk-line').some(e=>/You leaned on me/.test(e.textContent)),'and he remembers it, in his words: you leaned on me');t.act('lord-leave')}}
  finally{t.LordSpeaker.prototype.odds=o}}
 // ---- a story's page as talk: your words as you choose (or what you did), what came of it, kept on the page; its keys numbers
 {G.mode='world';hidePanel();const e=t.roadSpawn('toll',P.x+30,P.y);if(!e)ok(false,'a toll to meet');else{t.roadMeet(e);const ks=qa('.rkact').map(b=>b.dataset.rk).join('');ok(/^123/.test(ks),'a road choice page: its choices on number keys ('+ks+')');
   const i=e.D.acts.findIndex(c=>c.label==='Ask for their writ');t.act('enc-do',String(i));const lines=qa('.pg-talk .talk-line.you').map(b=>b.textContent);
   ok(lines.length===1&&lines[0].includes('Show me the lord’s writ')&&q('.pg-talk .talk-told'),'asked for their writ: your words and what came of it, as a talk');
   const j=e.D.acts.findIndex(c=>c.label==='Talk your way through');if(j>=0&&!e.done&&G.mode==='road'){t.act('enc-do',String(j));ok(qa('.pg-talk .talk-line.you').length===2,'the exchange kept on the page: two choices, two answers')}
   if(G.mode==='road'){G.roadMsg='A cart rolls by.';t.showRoad();ok(qa('.pg-talk .talk-told').some(e=>e.textContent==='A cart rolls by.'),'once the exchange has begun, a result that came of no choice is told in it too')}
   if(G.mode==='road')t.act('enc-leave')}}
 // ---- phase 3: a companion (from the Army's Role tab): approval in words, their story, their opinion, their wish, a warning
 {P.comps={brann:{ap:5,role:''},elske:{ap:1,role:''}};t.compInit('brann');t.compInit('elske');P.quests=[];
  G.mode='world';G.modal=false;t.openChar();t.act('party-select','comp_brann');t.act('party-unit-tab','role');
  ok(q('[data-act="talk-comp"][data-arg="brann"]')&&/Approval/.test(q('[data-unit-tab="role"]').textContent)&&/Loyal/.test(q('[data-unit-tab="role"]').textContent)&&!/\(5\)/.test(q('[data-unit-tab="role"]').textContent),'his Role tab: approval in words (Loyal, the number in its tip), and Talk with Brann');
  q('[data-act="talk-comp"]').click();const D=t.DIALOGUE.comps.brann;
  ok(q('.talk-head h2').textContent==='Brann the Wolf'&&/Loyal/.test(q('.talk-head').textContent)&&qa('.talk-line')[0].innerHTML.includes(D.greet.loyal)&&q('.nav [data-act="talk-back"]'),'talking with Brann: his greeting by his approval, Back to the army');
  t.act('talk-about','brann');ok(qa('.talk-line').some(e=>e.innerHTML.includes(D.about.slice(0,30))),'he tells his story');
  t.compInit('brann').deed=['ransom',2,G.day];t.act('talk-think','brann');ok(qa('.talk-line').some(e=>e.innerHTML.includes(t.DIALOGUE.feel.ransom.good)),'what he thinks: of the last deed he cared about (a ransom he liked)');
  t.act('talk-wish','brann');const wq=P.quests.find(x=>x.wish==='brann');ok(wq&&wq.type==='lair'&&t.compInit('brann').wish==='asked'&&qa('.talk-line').some(e=>e.innerHTML.includes(D.wish.ask.slice(0,20))),'trusted, his wish: a quest of his own ('+(wq&&wq.title)+')');
  ok(!q('[data-act="talk-wish"]')&&/You are helping already/.test(q('.talk-not').textContent),'and asked once: folded under Not now (you are helping already)');
  if(wq){const s=W.sites.find(x=>x.i===wq.site&&x.seed===wq.sseed),a0=t.compInit('brann').ap;t.worldEmit('site:cleared',{site:s});ok(!P.quests.includes(wq)&&t.compInit('brann').ap===Math.min(10,a0+3),'done: his approval rises')}
  t.act('talk-back');ok(G.mode==='char','Back: the army again');
  G.mode='char';t.act('talk-comp','elske');t.act('talk-wish','elske');ok(!P.quests.some(x=>x.wish==='elske')&&/know you better/.test(Kit.text()),'not trusted yet: Elske keeps her wish for later');t.act('talk-back');
  const lg=window.log,said=[];window.log=function(m){said.push(m);return lg.apply(this,arguments)};try{t.compInit('brann').ap=-2;t.mood('flee')}finally{window.log=lg}
  ok(P.comps.brann&&said.includes(D.warn),'turning angry, he warns you first');
  // (banter: two of them on the road, once a day at most)
  P.comps.brann.ap=2;P.comps.elske.ap=2;G.mode='world';G.town=null;P.stay=null;const n0=said.length;window.log=function(m){said.push(m);return lg.apply(this,arguments)};
  try{const R=t.rngOf('talk'),ch=R.chance,pk=R.pick;R.chance=()=>true;R.pick=l=>l[0];try{t.TalkMemory.all.banter={};t.Banter.hour();t.Banter.hour()}finally{R.chance=ch;R.pick=pk}}finally{window.log=lg}
  ok(said.length===n0+1&&said[n0].includes(t.DIALOGUE.banter[0].lines[0]),'banter on the road: a line each, once a day');
  P.comps={};t.hidePanel();G.mode='world'}
 // ---- phase 4: your captor speaks; a story's page names who speaks on it
 {const C=t.Captivity;C.held={k:'band',name:'the bandits',since:G.day,ransom:100,tried:[],away:[]};C.cv=null;C.open();
  ok(q('.talk-head h2').textContent==='Their chief'&&/Taken captive/.test(Kit.text())&&qa('.talk-line')[0].innerHTML.includes(t.DIALOGUE.captor.band)&&q('.talk-replies [data-act="held-pay"][data-key="1"]')&&q('.nav [data-act="held-refuse"]'),'your captor: their chief speaks; pay, persuade, serve as replies; Refuse in the bar');
  const R=Math.random;window.Math.random=()=>.99;try{t.act('held-persuade')}finally{window.Math.random=R}
  ok(qa('.talk-line.you').length===1&&qa('.talk-line').some(e=>e.innerHTML.includes(t.DIALOGUE.captor.no))&&!q('[data-act="held-persuade"]'),'your words fail: you, then them, and the price goes up');
  C.held=null;C.cv=null;t.hidePanel();G.mode='world'}
 {G.mode='story';t.CHOICE_PAGE.show({ico:'people',title:'A page',text:'“Hello,” she says.',who:{name:'Old Ada',pic:'',sub:'At the well'},choices:[],subject:{},act:'thr-do',done:true},'test');
  ok(q('.talk-head h2')?.textContent==='Old Ada'&&q('.talk-told')?.textContent.includes('Hello'),'a story page with someone speaking: their head over its text');
  const w=t.Wounded.speaker({memory:{name:'Hob',town:t.TOWNS[0].name},i:1});ok(w.name.startsWith('Hob')&&w.pic,'the Wounded Traveller’s family speak on its pages ('+w.name+')');t.hidePanel();G.mode='world'}
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
