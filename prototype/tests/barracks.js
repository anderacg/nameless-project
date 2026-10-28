'use strict';
// The barracks on a phone (town.js Barracks, the owner 2026-10-28: casual recruiting): choosing how many never moves the list;
// a unit's card opens over the list and Back returns to it where you were; the hire bar stays in view as the list scrolls.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,screen=document.getElementById('screen'),orig=screen.style.cssText,q=s=>document.querySelector('#panel '+s);window.requestAnimationFrame=()=>0;
 Kit.begin('soldier',1);Kit.clear();Kit.world();P.gold=2000;P.sk.lead.lv=6;const W=window.matchMedia;
 try{screen.style.cssText=orig+';width:844px;height:390px';window.matchMedia=()=>({matches:true});
  const town=t.TOWNS.find(x=>x.T.tabs.includes('recruit')&&!t.hostileTo(x.owner)&&t.townBy(x.name));t.enterTown(town);t.act('tab','recruit');
  const body=q('.rwbody');body.scrollTop=body.scrollHeight;const at=body.scrollTop,k=q('.rec-row').dataset.arg;
  [...document.querySelectorAll('#panel [data-act="rec-add"]')].find(b=>!b.disabled&&b.dataset.arg.endsWith(':1')).click();
  ok(q('.rwbody').scrollTop===at&&Object.values(G.town.cart).some(n=>n>0),'pressing + keeps the list where it was ('+at+')');
  const bar=q('.rec-bar').getBoundingClientRect(),view=q('.rwbody').getBoundingClientRect();ok(bar.bottom<=view.bottom+1&&bar.top>=view.top,'the hire bar is in view');
  q('.rec-row:not(.sel)').click();ok(G.town.info&&q('.rec-info .ucard-x')&&!q('.rec-rows'),'its card opens over the list');
  t.act('rec-info-back');ok(!G.town.info&&q('.rec-rows')&&q('.rwbody').scrollTop===at,'Back: the list, where you were');
 }finally{screen.style.cssText=orig;window.matchMedia=W}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
