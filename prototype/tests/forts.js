'use strict';
// Forts (data/holdings.js fort, worldplace.js placeForts; the owner, 2026-11-06: "only castle, fort, city should have wall", "a new
// fort kind"): a small walled fort between village and castle, each realm's village nearest a rival's made one; a palisade at the
// start, its tower and barracks at its heart, few people, a strong garrison, stores and no market, the lord's leave to enter.
// Walls: only cities, castles and forts at the start, one citadel a realm, the cities far apart.
Kit.suite(({ok,info})=>{
 const t=T;
 Kit.begin('soldier',4);Kit.world();
 const H=t.TOWNS.filter(z=>!z.gone),forts=H.filter(z=>z.kind==='fort'),realms=[...new Set(H.filter(z=>z.owner&&t.FACS[z.owner]).map(z=>z.owner))];
 const d=(a,b)=>Math.hypot(a.tx-b.tx,a.ty-b.ty),rival=z=>Math.min(...H.filter(o=>o.owner&&o.owner!==z.owner&&t.FACS[o.owner]).map(o=>d(z,o)));
 // ---- where: the classic world's, a fort a realm (its own data, places.js)
 ok(forts.length>=realms.length&&realms.every(f=>forts.some(z=>z.owner===f)),forts.length+' forts, one or more in each of '+realms.length+' realms ('+forts.map(z=>z.name+' '+z.owner).join(', ')+')');
 // ---- a generated world's: each realm's villages nearest a rival made forts (placeForts)
 {const S=t.genWorldSteps({preset:'normal',seed:'redwater'});let r;for(const st of S){const it=st.run();let v;while(!(v=it.next()).done);r=v.value}
  const Hd=r.holdings.filter(h=>h.realm),Fd=Hd.filter(h=>h.kind==='fort'),rv=h=>Math.min(...Hd.filter(o=>o.realm!==h.realm).map(o=>Math.hypot(o.tx-h.tx,o.ty-h.ty)));
  ok(t.PLACE_REALMS.every(f=>Fd.some(h=>h.realm===f))&&Fd.every(h=>Hd.filter(o=>o.realm===h.realm&&o.kind==='village'&&o.style!=='stilt').every(v=>rv(v)>=rv(h)-1e-9)&&/frontier fort/.test(h.note)),
   'Normal redwater: '+Fd.length+' forts, each realm’s, its villages’ nearest a rival ('+Fd.map(h=>h.name+' '+Math.round(rv(h))).join(', ')+')')}
 // ---- what: a fort's own
 const f=forts[0],T0=t.HOLDING_TYPES;
 ok(f instanceof t.Castle&&f.T===T0.fort&&T0.fort.tier>T0.village.tier&&T0.fort.tier<T0.castle.tier,'between village and castle (tier '+T0.fort.tier+'), a castle’s kind of garrison');
 ok(T0.fort.fort&&f.T.tabs.includes('stores')&&!f.T.tabs.includes('trade')&&T0.fort.gar>T0.village.gar&&T0.fort.pop0<T0.village.pop0,'stores and no market; a stronger garrison than a village’s ('+T0.fort.gar+'), fewer people ('+T0.fort.pop0+')');
 ok(t.wallOf(f)===T0.fort.wall0&&T0.fort.wall0>=1&&/ fort /.test(f.note),'a palisade at the start; its note: “'+f.note+'”');
 {const l=(f.lots||[]).find(q=>q.k==='centre');let m=null,err='';try{m=t.PX.centreModel({tier:'fort',people:f.races[0],seed:1,yaw:0,env:'grass'})}catch(e){err=e.message}
  ok(l&&l.type==='fort'&&m&&m.img&&m.img.width>0&&!err,'its tower and barracks at its heart ('+(l&&l.type)+(err?'; '+err:'')+')')}
 {const g0=t.GATES.on;t.GATES.on=true;try{const a=t.Gates.admits(f);ok(!a.ok&&/lord’s leave/.test(a.why),'none enter without the lord’s leave: “'+a.why+'”')}finally{t.GATES.on=g0}}
 // ---- walls: only cities, castles and forts; one citadel a realm; the cities apart
 const walled=H.filter(z=>t.wallOf(z)>0);
 ok(walled.length&&walled.every(z=>['city','castle','fort'].includes(z.kind)),'walled at the start: only cities, castles and forts ('+walled.length+')');
 ok(realms.every(f=>H.filter(z=>z.owner===f&&z.lots&&z.lots.some(l=>l.k==='centre'&&l.type==='citadel')).length<=1),'one citadel a realm');
 const C=H.filter(z=>z.kind==='city'),near=Math.min(...C.flatMap(a=>C.filter(b=>b!==a).map(b=>d(a,b))));
 ok(C.length>1&&near>=t.PLACE_GAP.city.town*2,'its cities far apart: the nearest two '+Math.round(near)+' tiles');
 info({forts:forts.map(z=>({n:z.name,o:z.owner,wall:t.wallOf(z),rival:Math.round(rival(z))})),cities:Math.round(near)});
});
