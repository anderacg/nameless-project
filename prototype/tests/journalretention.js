'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();G.msgs=[];P.bsta=100;
 t.setHurry(true);t.setHurry(false);ok(G.msgs.length===0,'Hurry and walking feedback do not enter Journal history');
 ok(document.getElementById('log').textContent.includes('slows to its marching pace'),'transient movement feedback remains visible on screen');
 t.setByRoad(true);t.setByRoad(false);ok(G.msgs.length===0,'route toggles remain screen-only');
 const hear=t.KNOWLEDGE.hear;let heard=0;try{t.KNOWLEDGE.hear=()=>heard++;t.log('An operational confirmation.','','system');t.log('Another order.','','action');t.toast('A direct control confirmation.');ok(!heard&&!G.msgs.length,'system and action feedback cannot create Journal entries or knowledge')}finally{t.KNOWLEDGE.hear=hear}
 t.log('Quest completed at Ashford.','good','story','q1');t.log('A rider brings news of a battle.','bad','war',null,G.day-1);t.log('Rumour of wolves.','','rumour','n17');t.log('Brann recovers and is fit to fight again.','good','band');t.log('You enter Ashford.');
 ok(G.msgs.length===5&&G.msgs[0].ref==='q1'&&G.msgs[2].ref==='n17','quests, news, rumors, people recovery and location events retain their references');
 t.log('Your band hurries: a line spoken in this quest.','','story','q2');ok(G.msgs.length===6,'an explicitly linked story is preserved even when its wording resembles control feedback');
 const legacy=[{day:G.day,m:'Your band hurries: 2× the pace, its stamina draining 2.5× as fast.',kind:'band'},{day:G.day,m:'Your band slows to its marching pace.'},{day:G.day,m:'Game saved (Quick save).',cls:'good'},{day:G.day,m:'Hero: at a walk.'}];
 G.msgs.push(...legacy);const html=t.chronicleWindow();ok(G.msgs.length===6&&!html.includes('Game saved')&&!html.includes('Hero: at a walk.'),'opening Journal removes recognizable old control spam');
 G.msgs.push(...legacy);const saved=t.chronicleSave();ok(saved.length===6&&G.msgs.length===6,'save output excludes old transient messages instead of storing hidden spam');
 t.Saves.part('chronicle').load([...saved,...legacy.map(t.chronTuple)]);ok(G.msgs.length===6&&G.msgs.some(r=>r.kind==='war')&&G.msgs.some(r=>r.ref==='n17'),'loading history keeps meaningful events and excludes old control spam');
});
