'use strict';
// Wandering trainers (world/trainers.js wanderers, trainersDay; news.js 'trainer'; ui/trainerlist.js; doc/RANKS_DESIGN.md phase 4;
// the owner, 2026-10-30: "some may stay at a fixed place, some may travel around holdings or places, so it will work with news and
// rumours as well, so the player may need this trainer to train or upgrade some specific units"): a few, masters among them, a few
// days at a holding that trains, then on to the next (known beforehand); each move in the news; met or heard of, in your Journal.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,X=t.TRAINERS;Kit.begin('soldier',1);Kit.clear();Kit.world();P.gold=2000;
 t.trainersDay();const Ws=t.W.wanderers;
 ok(Ws&&Ws.length===X.wander.levels.length&&Ws.filter(w=>w.level===3).length>=2,'the first day: '+Ws.length+' wandering trainers, masters among them ('+Ws.map(w=>w.name+', '+t.trainLevelN(w)).join('; ')+')');
 ok(Ws.every(w=>t.townBy(w.at)?.T.train&&w.next!==w.at&&t.townBy(w.next)&&w.until>G.day),'each at a holding that trains, for a few days, his next one known');
 const news=()=>t.W.news.items.filter(it=>it.k==='trainer');ok(news().length===Ws.length&&news().every(it=>it.detail.town&&it.detail.next),'each in the news: where he teaches, where next');
 {const w=Ws[0],h=t.townBy(w.at);ok(t.trainersAt(h).includes(w),'at his holding, he is one of its trainers')}
 // ======== on he goes
 {const w=Ws[0],next=w.next,ids=news().map(it=>it.id);G.day=w.until;t.trainersDay();
  ok(w.at===next&&w.next!==next&&w.until>G.day,'his days up, he goes on to '+next+', and says where next ('+w.next+')');
  ok(news().length===Ws.length&&news().map(it=>it.id).join()===ids.join()&&news().find(it=>it.detail.id===w.id).detail.town===next,'his news brought up to date (one item each, kept)')}
 // ======== heard of in a tavern
 {let heard=false;for(let d=0;d<12&&!heard;d++){for(const h of t.TOWNS.slice(0,8)){t.rumourFrom(t.rumourSource('tavern',h.name,h,{from:'the tavern of '+h.name}));if(Object.values(P.trainersMet||{}).some(m=>m.wander&&!m.met)){heard=true;break}}G.day++}
  const m=Object.values(P.trainersMet||{}).find(m=>m.wander);ok(heard&&m.at&&m.next,'heard of in a tavern: kept in your Journal, where he was said to be, and where next ('+(m?m.name+' at '+m.at:'none')+')')}
 // ======== met at his holding's Barracks
 {const w=Ws[1];G.day=Math.min(G.day,w.until-1);const h=t.townBy(w.at);P.rep[h.name]=90;G.mode='world';G.modal=false;t.hidePanel();t.enterTown(h);t.act('tab','recruit');t.act('rec-tab','train');
  const pn=document.getElementById('panel').textContent;ok(pn.includes(w.name)&&/passing through/.test(pn)&&P.trainersMet[w.id]?.met,'at his holding\'s Barracks: he teaches there, passing through; now met');t.act('leave')}
 // ======== the Journal
 {Kit.world();t.openJournal('trainers');const pn=document.getElementById('panel').textContent;ok(G.mode==='journal'&&/Trainers/.test(pn)&&Object.values(P.trainersMet).every(m=>pn.includes(m.name)),'the Journal\'s Trainers: each you know of');t.act('journal-close')}
 // ======== saved
 {Kit.world();t.saveGame(true);const was=JSON.stringify(t.W.wanderers);t.W.wanderers=null;t.loadGame();ok(JSON.stringify(t.W.wanderers)===was,'saved: where each is, and goes')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
