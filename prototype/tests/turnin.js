'use strict';
// Handing in at a holding (the owner, 2026-11-12: "make quest submission at holdings more better"; world/quests.js jobsBody,
// readyRow, laterRow, q-turnall; ui/questreward.js total): the ones ready first, short (title, giver, reward, Report), the whole folded
// under Details; those reported here not done yet below them, with what is left; Report all with two or more, one window for them
// all with what they gave in all.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.world();Kit.clear();t.GUIDE.on=false;
 const town=t.TOWNS.filter(x=>x.owner&&!x.gone&&x.kind!=='castle').map(x=>(t.ensureEcon(x),[x,t.jobsAt(x).filter(q=>!t.Quest.as(q).handsOver&&t.Quest.as(q).state==='available').length])).sort((a,b)=>b[1]-a[1])[0][0];
 P.quests=[];let n=0;for(let k=0;k<40&&n<2;k++){const L=t.jobsAt(town),q=L.find(x=>t.Quest.as(x).state==='available'&&!t.Quest.as(x).handsOver);if(!q)break;if(t.acceptQuest(q)){L.splice(L.indexOf(q),1);n++}}
 const mine=P.quests.filter(q=>t.canReportAt(q,town));if(mine.length<2){info('only '+mine.length+' jobs at '+town.name+': not tried');ok(true,'skipped');return}
 const q=Kit.q,qa=Kit.qa,txt=()=>Kit.text();
 mine[0].done=true;t.heroAtGate(town);t.enterTown(town);
 ok(G.town.tab==='jobs','one ready: you come in at the notice board');
 ok(/Ready to report/.test(txt())&&qa('.qw-ready').length===1&&qa('.qw-ready [data-act="q-turnin"]').length===1&&!q('[data-act="q-turnall"]'),'the one ready, first, with its Report; no Report all for one');
 ok(q('.qw-ready .qw-pay')&&q('.qw-ready details.qw-more')&&!q('.qw-ready > .info > .qfacts'),'short: its reward on a line, the whole folded under Details');
 ok(/Reported here, not done yet/.test(txt())&&qa('.qw-later').length===1&&/Still to do/.test(q('.qw-later').textContent)&&!q('.qw-later [data-act="q-turnin"]'),'the one not done below it, with what is left and no button');
 mine[1].done=true;t.renderTown();const b=q('[data-act="q-turnall"]'),gold0=P.gold;ok(b&&/Report all 2/.test(b.textContent)&&qa('.qw-ready').length===2,'both ready: Report all 2');
 b.click();ok(P.quests.length===0&&P.gold>gold0,'Report all: both paid ('+(P.gold-gold0)+' gold)');
 const w=document.getElementById('qreward');ok(w&&!w.hidden&&/2 quests complete/.test(w.textContent)&&/In all/.test(w.textContent)&&w.querySelectorAll('.qrw-quest').length===3,'one window for them both: what they gave in all, then each');
 t.QuestReward.close();t.renderTown();ok(!q('[data-act="q-turnall"]')&&!qa('.qw-ready').length&&/None\./.test(txt()),'after: nothing left to report here');
 t.act('leave');
});
