'use strict';
// Unknown names are display-only placeholders. Canonical identity, rumours, quests and saves keep the real names.
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P,W=t.W,K=t.KNOWLEDGE;
 window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world({town:null});
 const a=W.lords.find(l=>l.name==='Lord Aldric'),b=W.lords.find(l=>l!==a&&l.fac===a.fac),home=t.townBy('Ashford'),name=a.name;
 K.reset();Object.assign(a,{inside:null,dead:false,gone:false,x:P.x+3,y:P.y});
 ok(t.lordName(a)==='???'&&a.name===name&&a.label()===name,'an unknown display name is ??? while the canonical name and party label stay real');
 ok(a.tip().includes('???')&&!a.tip().includes(name)&&!K.knowsLord(a),'hovering an unknown lord masks the name without discovering them');
 ok(t.followName(a)==='???','the Follow action labels an unknown lord ???');t.followStart(a);
 {const said=document.querySelector('#log').lastElementChild?.textContent||'';ok(!K.knowsLord(a)&&said.includes('???')&&!said.includes(name),'following says ??? (a toast) and does not accidentally learn the canonical name')}t.followStop();
 const card=t.charCard(t.charOf(a));ok(card.includes('???')&&!card.includes(name),'a read-only character card masks an unknown lord');
 a.inside=home.name;b.inside=home.name;G.town={ref:home,tab:'hall'};G.mode='town';t.renderTown();
 ok(Kit.text().includes('???')&&!Kit.text().includes(name)&&!Kit.text().includes(b.name)&&!K.knowsLord(a),'hall cards mask their names without granting knowledge');
 const overview=t.townOverview(home);ok(overview.includes('???')&&!overview.includes(name)&&!overview.includes(b.name),'the holding overview masks lords inside');
 // Actual map drawing must mask court labels as well as HTML surfaces.
 a.inside=home.name;a.x=home.x;a.y=home.y;P.x=home.x;P.y=home.y;const oldTxt=window.txt,labels=[];
 window.txt=(s,...args)=>{labels.push(String(s));return oldTxt(s,...args)};
 try{t.drawWorld()}finally{window.txt=oldTxt}
 ok(labels.some(s=>s.includes('???'))&&labels.every(s=>!s.includes(name)&&!s.includes(b.name))&&!K.knowsLord(a),'world-map court labels display ??? and drawing does not discover names');
 // Town streets use the same placeholder for NPC labels and Talk prompts.
 t.enterScene(home);const street=G.scene;Kit.key('KeyP','p');ok(G.mode==='scene'&&G.scene===street&&!document.getElementById('people'),'P has no People menu in the streets');
 const npc=G.scene.npcs.find(n=>n.lord===a.id);labels.length=0;
 if(npc){G.scene.p.x=npc.x+10;G.scene.p.y=npc.y+10;window.txt=(s,...args)=>{labels.push(String(s));return oldTxt(s,...args)};
  try{t.drawScene()}finally{window.txt=oldTxt}}
 ok(npc&&labels.some(s=>s.includes('???'))&&labels.every(s=>!s.includes(name)&&!s.includes(b.name))&&!K.knowsLord(a),'street NPC labels and Talk prompts use ??? before a meeting');
 G.scene=null;G.town=null;Kit.world();P.x=P.y=-9999;
 W.lords.forEach(l=>{l.x=l.y=-20000;l.inside=null;l.state='rest'});a.inside=home.name;W.news=undefined;
 const offers=t.intelGather({at:[home],r:1}),offer=offers.find(o=>o.k==='lord'&&o.o===a);
 ok(offer&&offer.name.includes('???')&&offers.every(o=>W.lords.every(l=>!o.name.includes(l.name)&&!o.sub.includes(l.name))),'intelligence offers hide names before the information is purchased');
 t.intelLearn(offer,'an innkeeper');
 ok(t.lordName(a)===name&&a.tip().includes(name)&&K.lords[a.id].text.includes(name)&&!K.knowsLord(b),'purchased intelligence reveals its subject and preserves the real name in the dated report');
 ok(t.followName(a)===name,'Follow labels update after learning the name');
 const rum=t.newsRecord('lord',home,{lord:b.name,fac:b.fac});t.rumourHear(rum,{quiet:true,from:'a traveller'});
 ok(t.lordName(b)===b.name&&K.lords[b.id].text.includes(b.name),'a heard rumour also reveals a name instead of storing ???');
 K.reset();G.town=null;Kit.world();a.inside=null;t.lordMeet(a);
 ok(t.lordName(a)===name&&Kit.text().includes(name)&&!K.knowsLord(b),'meeting identifies only its speaker and immediately shows their name');
 t.act('lr-lords',a.id);ok(t.lordName(b)===b.name,'chosen social information reveals the named friend');
 // Quest previews use placeholders without damaging the target identity. Accepting the named job is learning about its target.
 K.reset();K.lord(a);const enemy=W.lords.find(l=>l.fac!==a.fac);t.setRel(a.fac,enemy.fac,'war');P.level=20;P.renown=100;P.troops={hum_knight:20};P.lrel={[a.id]:60};
 const job=t.makeQuest('lordkill',home,a),target=W.lords.find(l=>l.name===job.target),title=job.title;
 ok(target&&t.offerRow(job,'q-lord','').includes('Defeat ???')&&!t.offerRow(job,'q-lord','').includes(target.name)&&job.title===title&&job.target===target.name,'war-work previews hide an unknown target while retaining canonical quest data');
 ok(t.acceptQuest(job)&&t.lordName(target)===target.name,'accepting the named job discovers its target');
 // Watching a fight reveals no identities; joining a confrontation is a meeting.
 K.reset();G.town=null;Kit.world();const fight=t.startFight([a],[b]);K.reset();t.fightMeet(fight);
 ok(Kit.text().includes('???')&&!Kit.text().includes(name)&&!Kit.text().includes(b.name)&&!K.knowsLord(a),'a read-only fight overview masks unidentified participants');
 Kit.world();t.startEncounter({kind:'lord',ref:a,list:a.troops.slice(),allies:[],foes:[]});
 ok(K.knowsLord(a)&&!K.knowsLord(b)&&Kit.text().includes(name),'a direct confrontation identifies its actual opponent only');
 K.reset();Kit.world();t.parley(a,'lord');ok(K.knowsLord(a)&&Kit.text().includes(name),'a direct parley also counts as meeting that lord');
 Kit.world();G.town=null;t.saveGame(true,'quick');K.reset();t.loadGame('quick');
 const loaded=W.lords.find(l=>l.id===a.id);ok(loaded.name===name&&t.lordName(loaded)===name,'saving and loading preserve the canonical name and its discovered display');
 Kit.world();
});
