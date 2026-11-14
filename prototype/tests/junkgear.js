'use strict';
// Damaged gear and junk (the owner, 2026-11-13: "make drops for junk gears / damaged gear"; data/gear.js DAMAGED, data/drops.js JUNK,
// battle/drops.js DROPS.worn, ui/town.js Smithy mending): every ordinary piece has a damaged form, weaker and worth less, a smith
// mends it whole for a price; junk sells for a few coins at a market.
Kit.suite(({ok,info})=>{const t=T,P=t.P,G=t.G,I=t.ITEMS;
 t.act('begin','soldier');
 // ---- the data
 const bases=Object.keys(t.BASES),ids=bases.flatMap(b=>t.MATERIALS.map((_,k)=>t.damagedId(b,k)));
 ok(ids.every(id=>I[id]&&I[id].damaged&&I[I[id].whole]&&I[id].slot===I[I[id].whole].slot&&I[id].v<I[I[id].whole].v&&/^Damaged /.test(I[id].n)),'every ordinary piece has a damaged form ('+ids.length+'), the same slot, worth less, its whole one known');
 {const d=I.gd_sword_2,w=I.g_sword_2,a=I.gd_axe_2;ok(d.m.dmg===w.m.dmg*t.DAMAGED.m&&a.m.cd===I.g_axe_2.m.cd&&I.gd_dagger_1.m.cd>I.g_dagger_1.m.cd&&/smith can mend/.test(d.d),'its good numbers × '+t.DAMAGED.m+' ('+w.n+' '+w.m.dmg+' → '+d.m.dmg+' damage), a slow swing kept, a quick one less quick')}
 const J=Object.keys(t.JUNK);ok(J.length>=5&&J.every(k=>t.MATS[k]&&t.MATS[k].junk&&t.MATS[k].v<=5&&t.UI_ILLUSTRATIONS[t.MATS[k].icon]),J.length+' kinds of junk, each worth a few coins, each with its picture');
 ok(J.every(k=>{const p=t.matPrice(k);return p>0&&p<=10}),'junk sells at a market for little ('+J.map(k=>t.MATS[k].n+' '+t.matPrice(k)+'g').slice(0,3).join(', ')+')');
 // ---- worn: the hero's numbers less than with the whole piece
 {const keep=P.gear.weapon;P.gear.weapon='g_sword_2';const a=t.heroStats().dmg;P.gear.weapon='gd_sword_2';const b=t.heroStats().dmg;P.gear.weapon=keep;ok(b<a,'worn, a damaged sword hits softer ('+a.toFixed(1)+' → '+b.toFixed(1)+')')}
 // ---- the smith mends it, worn or in the bag
 {const town=t.TOWNS.find(x=>x.T&&!x.camp)||t.TOWNS[0],S=t.PLACES.smith;P.gold=1000;t.invAdd('gear','gd_helm_2',1);const keep=P.gear.weapon;P.gear.weapon='gd_sword_1';
  const L=S.mendable(),rows=S.mendRows(),p=S.mendPrice('gd_helm_2');ok(L.includes('gd_helm_2')&&L.includes('gd_sword_1')&&/Mending/.test(rows)&&/Mend/.test(rows)&&p>0&&p<t.gearPrice('g_helm_2'),'the smithy lists what you carry and wear to mend ('+L.map(id=>I[id].n).join(', ')+'), the helm '+p+'g (bought whole '+t.gearPrice('g_helm_2')+'g)');
  const g0=P.gold;S.mendGear('gd_helm_2',town);ok(P.gold===g0-p&&!P.inv.some(s=>s&&s.id==='gd_helm_2')&&P.inv.some(s=>s&&s.id==='g_helm_2'),'mended: paid, the whole helm in your bag in its place');
  S.mendGear('gd_sword_1',town);ok(P.gear.weapon==='g_sword_1'&&!S.mendable().length&&!S.mendRows(),'the sword you wear mended in your hand; nothing left to mend, no Mending list');
  P.gold=0;t.invAdd('gear','gd_ring_0',1);S.mendGear('gd_ring_0',town);ok(P.inv.some(s=>s&&s.id==='gd_ring_0')&&/Not enough gold/.test(S.mendRows()),'no gold, no mending');P.gear.weapon=keep}
});
