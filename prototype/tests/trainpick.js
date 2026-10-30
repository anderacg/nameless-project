'use strict';
// How many to train (ui/town.js Barracks#trainTab, trainWant; the owner, 2026-10-30: "training should be able to select how many we
// want to train"): a stepper on each training (−, the count, +, Max), from 1 to those ready you can pay for, at most at first; the
// Train button trains that many and costs that much; a typed count is kept within the range.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);const ash=t.townBy('Ashford'),kind='hum_sword',to='hum_sergeant';// (a training with a price: a tier 3, at a holding)
 P.troops={[kind]:6};P.gold=5000;P.rep[ash.name]=90;P.txp[kind]=t.txpNeed(kind)*6;const key=kind+'>'+to,c=t.trainCost(to);
 t.enterTown(ash);t.act('tab','recruit');t.act('rec-tab','train');
 const btn=()=>document.querySelector('[data-act="train"][data-arg^="'+kind+':'+to+':"]'),num=()=>document.querySelector('[data-qty="rec-tset"][data-arg="'+key+'"]');
 ok(num()&&+num().value===6&&btn().dataset.arg.endsWith(':6')&&btn().textContent.includes(6*c+'g'),'all six ready: the count starts at the most, Train 6 · '+6*c+'g');
 t.act('rec-tnum',key+':-1');t.act('rec-tnum',key+':-1');ok(+num().value===4&&btn().dataset.arg.endsWith(':4')&&btn().textContent.includes(4*c+'g'),'− twice: Train 4, its cost with it');
 t.act('rec-tset',key+':99');ok(+num().value===6,'a count typed past the most is kept to it');t.act('rec-tset',key+':0');ok(+num().value===1,'and never under one');
 t.act('rec-tset',key+':3');const g0=P.gold;btn().click();ok(P.troops[to]===3&&P.troops[kind]===3&&P.gold===g0-3*c,'Train 3: three trained, for three\'s price');
 t.act('rec-tnum',key+':max');ok(+num().value===3,'Max: the three left ready');
 P.gold=c*2;t.act('rec-tab','train');ok(+num().value<=2&&btn().dataset.arg.endsWith(':'+num().value),'gold for two: at most two');
 t.act('leave');Kit.world();ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
