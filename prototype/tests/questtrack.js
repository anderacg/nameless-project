'use strict';
// The quest tracker (ui/questtrack.js; world/quests.js QuestTrack.list/set; the owner, 2026-10-30: "a quest tracking tab at the
// left-hand side for quick access like RPG games; the popup below that tracking tab, disappearing automatically in 5 secs with an
// animation"): a quest taken shows its note under the tracker with Track and ×, its bar running QTRACK.show s, gone after; Track
// adds it to the tracker (under the band card, its title, what to do, the way) and marks it on the map; several can be tracked,
// the newest first; a click opens it in your Quests; it leaves the tracker when it ends; a save keeps the list.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,ash=t.townBy('Ashford');Kit.begin('soldier',1);Kit.clear();Kit.world();Kit.goTo(ash.x+60,ash.y+40);
 const tr=()=>document.getElementById('qtrack'),pop=()=>tr()?.querySelector('.qt-pop'),rows=()=>[...(tr()?.querySelectorAll('.qt-row')||[])];
 const take=s=>{const q=Kit.seeded(s,()=>t.makeQuest('bounty',ash));Kit.seeded(s+1,()=>q.accept());t.updateHUD(true);return q};
 t.updateHUD(true);ok(!tr()||tr().hidden,'nothing tracked, nothing taken: no tracker');
 const q1=take(5);ok(pop()&&pop().textContent.includes(q1.title)&&pop().querySelector('[data-act="qt-track"]')&&pop().querySelector('[data-act="qt-hide"]'),'a quest taken: its note under the tracker, with Track and ×');
 {const bar=pop().querySelector('.qt-bar i'),cs=getComputedStyle(bar);ok(cs.animationName==='qt-run'&&parseFloat(cs.animationDuration)===t.QTRACK.show,'its bar runs down over '+t.QTRACK.show+' s')}
 {const s=document.getElementById('stats').getBoundingClientRect(),r=tr().getBoundingClientRect();ok(r.top>=s.bottom&&Math.abs(r.left-s.left)<2,'under your band card, at its left edge')}
 {const pn=performance.now;let now=pn.call(performance)+(t.QTRACK.show+.5)*1000;performance.now=()=>now;try{t.updateHUD(true)}finally{performance.now=pn}ok(!pop()&&(!tr()||tr().hidden),'after '+t.QTRACK.show+' s it is gone by itself; nothing tracked: no tracker')}
 const q2=take(9);pop().querySelector('[data-act="qt-track"]').click();
 ok(!pop()&&rows().length===1&&rows()[0].textContent.includes(q2.title)&&P.track==='q'+q2.id&&rows()[0].classList.contains('on'),'Track: in the tracker, marked on the map');
 ok(rows()[0].querySelector('small').textContent.length>3&&/tiles|here/.test(rows()[0].textContent),'its line: what to do, and which way ('+rows()[0].querySelector('em')?.textContent+')');
 const q3=take(13);pop().querySelector('[data-act="qt-hide"]').click();ok(!pop()&&rows().length===1,'×: let go, not tracked');
 t.QuestTrack.set('q'+q3.id);t.updateHUD(true);ok(rows().length===2&&rows()[0].textContent.includes(q3.title)&&P.track==='q'+q3.id,'tracked from your Quests too: two in the tracker, the newest first and marked');
 rows()[1].click();ok(G.mode==='quests'&&document.getElementById('panel').textContent.includes(q2.title),'a click opens it in your Quests');t.act('quests-close');Kit.world();
 t.saveGame(true,'1');t.loadGame('1');t.updateHUD(true);ok(rows().length===2&&P.track==='q'+q3.id,'a save keeps them');
 t.QuestTrack.set(null);t.updateHUD(true);ok(rows().length===1&&!P.track,'untracked in your Quests: gone from the tracker, none marked');
 t.QuestTrack.set('q'+q3.id);t.QuestTrack.drop('q'+q3.id);t.updateHUD(true);ok(rows().length===1&&P.track==='q'+q2.id,'a marked quest over: the next tracked one is marked')
 // ======== several taken at once: their notes stacked
 {const pops=()=>[...(tr()?.querySelectorAll('.qt-pop')||[])],qs=[21,25,29].map(take);
  ok(pops().length===3&&qs.every((q,i)=>pops()[i].textContent.includes(q.title)),'three quests taken at once: three notes, stacked, the first on top');
  const keep=pops()[2];pops()[1].querySelector('[data-act="qt-hide"]').click();ok(pops().length===2&&pops()[1]===keep&&pops()[0].textContent.includes(qs[0].title),'× on one: only it goes, the others\' notes (their bars) as they were');
  pops()[0].querySelector('[data-act="qt-track"]').click();ok(pops().length===1&&rows().some(r=>r.textContent.includes(qs[0].title)),'Track on one: it joins the tracker, the other note stays');
  [33,37,41].map(take);ok(pops().length===t.QTRACK.stack,'at most '+t.QTRACK.stack+' at once, the newest');
  const pn=performance.now;let now=pn.call(performance)+(t.QTRACK.show+.5)*1000;performance.now=()=>now;try{t.updateHUD(true)}finally{performance.now=pn}ok(!pops().length,'their time up, all gone')}
 G.mode='battle';t.updateHUD(true);ok(tr().hidden,'not in battle');Kit.world();t.updateHUD(true);
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
