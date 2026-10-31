'use strict';
// The barracks (town.js Barracks, ui/hiredesk.js; the owner 2026-10-28: casual recruiting; 2026-10-31: "newly purchase will always
// provide 1 full units ... then you have another section ... to replenish your troop", from the holding's pool): no counters, no
// Fill band, no group picker; Recruit unit takes one whole unit of its kind's size into a free slot; a short unit has its Refill;
// too few willing for a unit, they can only refill; on a phone a unit's card opens over the list and Back returns to it.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,screen=document.getElementById('screen'),orig=screen.style.cssText,q=s=>document.querySelector('#panel '+s);window.requestAnimationFrame=()=>0;
 Kit.begin('soldier',1);Kit.clear();Kit.world();P.gold=5000;P.sk.lead.lv=6;const W=window.matchMedia,r=t.partyRoster(P);
 try{screen.style.cssText=orig+';width:844px;height:390px';window.matchMedia=()=>({matches:true});
  const town=t.TOWNS.find(x=>x.T.tabs.includes('recruit')&&!t.hostileTo(x.owner)&&t.townBy(x.name));P.rep[town.name]=100;town.vol=80;t.enterTown(town);t.act('tab','recruit');
  ok(!q('[data-act="rec-add"]')&&!q('.rec-n')&&!q('[data-act="rec-fill"]')&&!q('[data-act="rec-groups"]')&&q('[data-act="rec-unit"]'),'whole units only: no counters, no Fill band, no group picker');
  const b=[...document.querySelectorAll('#panel [data-act="rec-unit"]')].find(x=>!x.disabled),k=b.dataset.arg,n=t.unitSize(k),s0=r.slots,m0=P.troops[k]||0,v0=town.vol;b.click();
  const g=r.groups.find(x=>x.type===k);ok(r.slots===s0+1&&P.troops[k]===m0+n&&g&&g.count===n&&town.vol===v0-n,'Recruit unit: one whole unit of '+n+' '+t.ST[k].n+' into a new slot, '+n+' from the willing');
  r.remove(k,3,g.id);t.act('tab','recruit');const f=q('[data-act="rec-refill"][data-arg="'+g.id+'"]');ok(f&&!f.disabled&&/\+3/.test(f.textContent),'a unit short of 3: its Refill row, +3');
  f.click();ok(g.count===n,'Refill: back to '+n);
  town.vol=n-1;t.act('tab','recruit');const b2=q('[data-act="rec-unit"][data-arg="'+k+'"]');ok(b2.disabled&&/willing/.test(b2.title),'too few willing for a whole unit: Recruit unit greyed ('+b2.title+')');
  r.remove(k,2,g.id);t.act('tab','recruit');const f2=q('[data-act="rec-refill"][data-arg="'+g.id+'"]');ok(f2&&!f2.disabled,'but they can still refill');
  const at=q('.rwbody').scrollTop,row=q('.rec-row[data-act="rec-pick"]:not(.sel)');row.click();ok(!G.town.info&&q('.rec-rows')&&G.town.pick===row.dataset.arg,'pressing a row only picks it: no card');
  q('.rec-row:not(.sel) [data-act="rec-info"]').click();ok(G.town.info&&q('.rec-info .ucard-x')&&!q('.rec-rows'),'its i badge opens its card over the list');
  t.act('rec-info-back');ok(!G.town.info&&q('.rec-rows')&&q('.rwbody').scrollTop===at,'Back: the list, where you were');
 }finally{screen.style.cssText=orig;window.matchMedia=W}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
