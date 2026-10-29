'use strict';
// The barracks on a phone (town.js Barracks, the owner 2026-10-28: casual recruiting): choosing how many never moves the list;
// a unit's card opens over the list and Back returns to it where you were; the hire bar stays in view as the list scrolls.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,screen=document.getElementById('screen'),orig=screen.style.cssText,q=s=>document.querySelector('#panel '+s);window.requestAnimationFrame=()=>0;
 Kit.begin('soldier',1);Kit.clear();Kit.world();P.gold=2000;P.sk.lead.lv=6;const W=window.matchMedia;
 try{screen.style.cssText=orig+';width:844px;height:390px';window.matchMedia=()=>({matches:true});
  const town=t.TOWNS.find(x=>x.T.tabs.includes('recruit')&&!t.hostileTo(x.owner)&&t.townBy(x.name));t.enterTown(town);t.act('tab','recruit');
  const body=q('.rwbody');body.scrollTop=body.scrollHeight;const at=body.scrollTop,k=q('.rec-row').dataset.arg;
  const plus=[...document.querySelectorAll('#panel [data-act="rec-add"]')].find(b=>!b.disabled&&b.dataset.arg.endsWith(':1'));plus.click();
  ok(q('.rwbody').scrollTop===at&&Object.values(G.town.cart).some(n=>n>0),'pressing + keeps the list where it was ('+at+')');
  plus.click();ok(plus.isConnected&&Object.values(G.town.cart).some(n=>n===2)&&plus.closest('.rec-row').querySelector('.rec-n').textContent==='2'&&plus.closest('.rec-row').querySelector('[data-arg$=":-1"]').disabled===false,'the same button again, at once: its count 2, − free now (the row changed in place, its buttons kept)');
  const bar=q('.rec-bar').getBoundingClientRect(),view=q('.rwbody').getBoundingClientRect();ok(bar.bottom<=view.bottom+1&&bar.top>=view.top,'the hire bar is in view');
  const row=q('.rec-row:not(.sel)');row.click();ok(!G.town.info&&q('.rec-rows')&&G.town.pick===row.dataset.arg,'pressing a row only picks it: no card');
  q('.rec-row:not(.sel) [data-act="rec-info"]').click();ok(G.town.info&&q('.rec-info .ucard-x')&&!q('.rec-rows'),'its i badge opens its card over the list');
  t.act('rec-info-back');ok(!G.town.info&&q('.rec-rows')&&q('.rwbody').scrollTop===at,'Back: the list, where you were');
 }finally{screen.style.cssText=orig;window.matchMedia=W}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
