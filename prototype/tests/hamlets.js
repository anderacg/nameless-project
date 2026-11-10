'use strict';
// The free folk's hamlets (doc/WORLD_DESIGN.md §6.3, §8.9; the owner, 2026-11-04: "implement the hamlet and small villages,
// natural hamlet or village"): the generator settles them once the realms' holdings stand (worldplace.js genHamlets), in the land
// past every holding's reach, apart, by the Hamlets setting; a share small free villages. No realm holds them: no lord's hall,
// walls or prison; a field and one estate; trade, a tavern, a few recruits, jobs. Attacking them costs honour with every realm and
// they remember it; raided, their reputation falls further.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 const H=t.TOWNS.filter(x=>!x.owner&&!x.gone),own=t.TOWNS.filter(x=>x.owner),X=t.PLACE_HAMLET,want=Math.round(t.areaTable(X.base,t.WM.w*t.WM.h));
 ok(H.length>=want*.7&&H.length<=want&&H.every(h=>h.kind==='hamlet'||h.kind==='village'),'the world settles '+H.length+' free holdings (Normal, about '+want+'): '+H.filter(h=>h.kind==='hamlet').length+' hamlets, '+H.filter(h=>h.kind==='village').length+' small free villages');
 ok(t.TOWNS.indexOf(H[0])>=own.length-own.filter(x=>t.TOWNS.indexOf(x)>t.TOWNS.indexOf(H[0])).length&&own.every(x=>t.TOWNS.indexOf(x)<t.TOWNS.indexOf(H[0])),'after the realms\' holdings: their places in the list kept');
 {const bad=H.filter(h=>own.some(o=>{const r=t.HOLDING_TYPES[o.kind].reach+X.margin;return(o.tx-h.tx)**2+(o.ty-h.ty)**2<=r*r}));ok(!bad.length,'each past every realm holding\'s reach'+(bad.length?': '+bad.map(h=>h.name).join(', '):''))}
 {let near=0;for(const a of H)for(const b of t.TOWNS)if(a!==b&&(a.tx-b.tx)**2+(a.ty-b.ty)**2<t.placeGap(a.kind,b.kind)**2)near++;ok(!near,'each apart from the others by its spacing ('+near+' too near)')}
 {const n=new Set(t.TOWNS.map(x=>x.name)).size;ok(n===t.TOWNS.length,'every one named its own ('+H.slice(0,5).map(h=>h.name).join(', ')+'…)')}
 const h=H.find(x=>x.kind==='hamlet');
 ok(h.T.tier===1&&h.T.wallMax===0&&h.gar===h.T.gar&&/^A free .+ hamlet /.test(h.note),'a hamlet: tier 1, no walls, a militia of '+h.gar+'; "'+h.note+'"');
 {const ks=(h.lots||[]).map(l=>l.k).filter(k=>k!=='house'&&k!=='centre'&&k!=='nook');ok(ks.includes('farm')&&ks.length<=2,'a field and one estate: '+ks.join(', ')+' (its houses, its hall and the street\'s nooks aside: lots.js, 2c86d20)')}
 ok(t.landHold(h.x,h.y+4)===h,'its land its own ('+h.name+' lands)');
 // ---- its window: no lord's hall, walls or prison
 {Kit.goHome(h);t.enterTown(h);const tabs=[...document.querySelectorAll('#panel [data-act="tab"]')].map(b=>b.dataset.arg);
  ok(['trade','tavern','recruit','jobs'].every(k=>tabs.includes(k))&&!['hall','garrison','prison'].some(k=>tabs.includes(k)),'its window: '+tabs.join(', '));
  t.act('tab','tavern');ok(/free folk keep their own counsel/.test(document.getElementById('panel').textContent),'its tavern: no realm rules here');
  t.act('tab','home');ok(/free folk/i.test(document.getElementById('panel').textContent),'held by the free folk');t.toWorld()}
 // ---- attacked: honour with every realm, and they remember
 {const fs=t.FIDS.filter(f=>!W.dead[f]),h0=fs.map(f=>t.honorWith(f));P.troops={hum_foot:20};G.bes=h;t.openSiege(h);
  ok(/no one’s subjects/.test(document.getElementById('panel').textContent)&&!t.foeAt(h),'at its gate: the free folk are no one\'s subjects');
  t.act('sg-declare');ok(t.foeAt(h)&&h.angry>G.day&&fs.every((f,i)=>t.honorWith(f)<h0[i]),'attacked: honour lost with every realm, and they remember it ('+(h.angry-G.day)+' days)');
  const r0=t.repAt?t.repAt(h.name):null,line=t.startRaid(h);ok(/Reputation there −40/.test(line)&&P.raid&&P.raid.town===h.name,'raided: "'+line.trim()+'"');P.raid=null;h.angry=0;G.mode='world';t.hidePanel()}
 // ---- the setting: none, many
 {const base=t.normSettings({preset:'normal',seed:'HAMLETS'}),n=s=>t.genWorld(t.normSettings({...base,preset:'custom',hamlets:s})).holdings.filter(h=>!h.realm).length,a=n('none'),b=n('normal'),c=n('many');
  ok(a===0&&b>0&&c>b,'the Hamlets setting: None '+a+', Normal '+b+', Many '+c)}
 Kit.clear();
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
