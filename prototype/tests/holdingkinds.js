'use strict';
// The holdings halved and every kind on the map (the owner, 2026-11-27: "Make holding less i feel it too dense please reduce it by
// 50% and make sure all type of holding is spawned"; world/worldsettings.js WORLD_LIMITS.holdings, WORLD_PRESETS; worldplace.js
// PLACE_HAMLET, placeAllKinds, the hamlets' first): a Normal map's realms 14 holdings (were 27), its free folk's about 12 (were
// about 24); a city, town, castle, fort, village and hamlet on every map, Normal's seeds and the fewest a map may have (12).
Kit.suite(({ok,info})=>{const t=T,KINDS=['city','town','castle','fort','village','hamlet'];
 const gen=(s,label)=>{const r=t.genWorld(t.normSettings(s)),H=r.holdings,k={};for(const h of H)k[h.kind]=(k[h.kind]||0)+1;
  info(label+': '+H.length+' holdings, '+H.filter(h=>h.realm).length+' the realms\' '+JSON.stringify(k));return{H,k,miss:KINDS.filter(q=>!k[q])}};
 const runs=[1,2,3].map(n=>gen({...t.defaultSettings('normal'),seed:'kinds'+n},'Normal s'+n)),few=gen({...t.defaultSettings('normal'),preset:'custom',holdings:12,seed:'kinds1'},'Normal s1, 12 holdings');
 ok(runs.every(r=>r.H.filter(h=>h.realm).length===14&&r.H.length<=30),'Normal: the realms\' 14 holdings, about 26 with the free folk\'s (were 27 and about 51)');
 ok([...runs,few].every(r=>!r.miss.length),'every kind of holding on every map: '+KINDS.join(', ')+[...runs,few].map(r=>r.miss.length?' (missing '+r.miss+')':'').join(''));
 ok(few.H.filter(h=>h.realm).length===12,'the fewest a map may have, 12: still every kind');
 ok(!ERR.length,'no runtime errors '+ERR.slice(0,2).join(' | '))});
