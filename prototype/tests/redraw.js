'use strict';
// Redrawn without replacing what stays the same (the owner, 2026-10-28: taps lost to redraws): a window drawn again for the same
// place changes in place (window.js morph), its buttons kept; the parts redrawn on a clock are written only when they change
// (ui.js setHtml): the party card and the day.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,q=s=>document.querySelector('#panel '+s);window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();P.gold=2000;
 const town=t.TOWNS.find(x=>x.T.tabs.includes('trade')&&!t.hostileTo(x.owner));t.enterTown(town);t.act('tab','trade');
 const buy=[...document.querySelectorAll('#panel [data-act="buy"]')].find(b=>!b.disabled),g=buy.dataset.arg.split(':')[0],n0=t.goodN(g),row=buy.closest('.row');
 buy.click();ok(buy.isConnected&&t.goodN(g)>n0,'the market’s Buy: done, and the very same button still there');
 ok(row.textContent.includes('×'+t.goodN(g)),'its row says what you have now (×'+t.goodN(g)+')');
 const body=q('.rwbody');t.act('tab','recruit');ok(q('.rwbody')&&q('.rec-rows'),'another place: drawn afresh');
 G.mode='world';t.hidePanel();t.updateHUD(true);const card=document.querySelector('#stats .pc-band'),day=document.querySelector('#wday span');t.updateHUD();t.updateHUD();
 ok(card&&card.isConnected&&day.isConnected,'the party card and the day, drawn again unchanged: not written again (their buttons kept)');
 P.gold+=7;t.updateHUD();ok(!card.isConnected&&document.querySelector('#stats').textContent.includes(String(P.gold)),'changed (your gold): written again');
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
