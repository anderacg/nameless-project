'use strict';
// Placed buildings (lots.js): every holding is laid out from its centre, its own way; its walls are the centre's fortification;
// you place what you build, it takes time (less with more people), upgrades need what they need; houses hold the people, and
// a full holding grows no more and sends people away; the realms build houses as they fill; saves keep every building.
window.RUN=()=>{window.__ls=window.__ls||T.lotSpot;const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TILE=t.TILE;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;const TW=t.TOWNS;
 // ---- layouts
 const sig=TW.filter(z=>z.kind==='town').map(z=>z.lots.filter(l=>l.k==='house').map(l=>(l.x-z.tx)+','+(l.y-z.ty)+l.type).join(';'));
 ok(new Set(sig).size===sig.length,'every town is laid out its own way ('+sig.length+' towns, '+new Set(sig).size+' layouts)');
 ok(TW.every(z=>t.housing(z)>=z.pop),'every holding starts with room for its people (houses and centre)');
 // ---- nothing built on a road (the owner's play-test 2): no building (but the centre, whose gate the road leads into) and no
 // field on a road tile, nor where the road is painted: the middle of the road as the art draws it (the generated world: along its
 // smoothed lines, worldart.js artGenPlan's segments; today's map: roadStamps' middle) 2 px or more inside one of its tiles
 {const MW=t.MW,gen=t.WM.gen!=='classic-0',pts=[],own=new Map();
  if(gen){const P={tramples:[]};t.artGenPlan(P,()=>{});const S=P.segs;for(let k=0;k<S.length;k+=5){const a=S[k],b=S[k+1],c=S[k+2],d=S[k+3],n=Math.max(1,Math.ceil(Math.hypot(c-a,d-b)));for(let s=0;s<=n;s++)pts.push([a+(c-a)*s/n,b+(d-b)*s/n])}}
  else{const P={towns:new Set(TW.map(z=>z.ty*MW+z.tx)),shift:new Set(TW.flatMap(z=>[z.ty*MW+z.tx,(z.ty+1)*MW+z.tx]))};for(let ty=0;ty<t.MH;ty++)for(let tx=0;tx<MW;tx++)t.roadStamps(P,tx,ty,2,(x,y,w)=>pts.push([x+w/2,y+w/2]))}
  for(const z of TW)for(const l of z.lots||[])if(l.k!=='centre'){t.lotTiles(l,(x,y)=>own.set(y*MW+x,z.name+' '+l.k));for(const [x,y] of l.plots||[])own.set(y*MW+x,z.name+' '+l.k+' field')}
  const bad=new Set();for(const [i,w] of own)if(t.tiles[i]===t.T_ROAD)bad.add(w+' (a road tile)');
  for(const [x,y] of pts){const i=Math.floor(y/TILE)*MW+Math.floor(x/TILE),fx=x%TILE,fy=y%TILE;if(own.has(i)&&Math.min(fx,fy,TILE-fx,TILE-fy)>=2)bad.add(own.get(i)+' at '+Math.floor(x/TILE)+','+Math.floor(y/TILE))}
  ok(!bad.size,'no building nor field stands on a road, its tiles or where it is painted ('+(gen?'along its lines':'by its tiles')+'; '+own.size+' tiles built on)'+(bad.size?': '+[...bad].slice(0,6).join('; '):''))}
 // ---- walls are the centre's fortification: no wall pieces on the map, nothing blocks travel
 ok(TW.every(z=>{const c=t.lotCentre(z);t.lotSprite(z,c);return !z.lots.some(l=>l.k==='wall')&&c._fort===t.wallOf(z)}),'every holding’s walls are its centre’s fortification (no wall pieces stand on the map)');
 {const z=TW.find(q=>t.wallOf(q)>=2),c=t.lotCentre(z),s0=t.lotSprite(z,c);t.breach(z);const s1=t.lotSprite(z,c);ok(c._fort===t.wallOf(z)&&s1!==s0,'a breach lowers it, and the centre is drawn with its lower walls ('+t.WALL_N[t.wallOf(z)]+')')}
 {const nf=TW.filter(z=>!t.lotSprite(z,t.lotCentre(z)).flag),more=TW.filter(z=>z.lots.some(l=>l.k!=='centre'&&t.lotSprite(z,l).flag));
  ok(!nf.length&&!more.length,'every holding flies one flag, from its centre'+(nf.length?' (none at '+nf.map(z=>z.name).join(', ')+')':'')+(more.length?' (more at '+more.map(z=>z.name).join(', ')+')':''))}
 // ---- placing by hand
 const ash=t.townBy('Ashford');ash.owner='player';t.ensureEcon(ash);ash.work=null;ash.stock.timber=200;ash.stock.tools=40;ash.stock.stone=200;P.gold=5000;
 const k=['brewery','workshop','granary','smithy','market','farm','pasture'].find(e=>!t.bldLv(ash,e)&&t.needsMet(ash,e)&&t.bldCap(ash,e));
 if(k){G.mode='world';G.modal=false;t.hidePanel();t.startPlace(ash,k);const pl=G.place;ok(!!pl&&pl.k===k,'Build '+k+' hands you its building to place');
   let spot=null;for(let r=1;r<14&&!spot;r++)for(let y=ash.ty-r;y<=ash.ty+r&&!spot;y++)for(let x=ash.tx-r;x<=ash.tx+r&&!spot;x++)if(t.placeOk(ash,k,x,y,pl.n))spot=[x,y];
   const bad=[ash.tx,ash.ty];ok(!t.placeOk(ash,k,bad[0],bad[1],pl.n),'it may not stand on the holding’s square (red)');
   if(spot){const g0=P.gold;t.placeClick((spot[0]+pl.n/2)*TILE,(spot[1]+pl.n/2)*TILE);const l=t.lotAt(ash,k);
     ok(!G.place&&ash.work&&ash.work.k===k&&l&&l.x===spot[0]&&l.y===spot[1]&&l.st==='building'&&P.gold<g0,'a click on a green spot pays for it and starts it there, a building site ('+k+')');
     const days=ash.work.done-G.day;for(let i=0;i<days+1;i++){G.day++;t.estateDay()}ok(t.bldLv(ash,k)===1&&l.st==='built','after '+days+' days it stands, built')}}
 // ---- more people build faster; some estates need others first
 {const v=t.townBy('Thornwick'),p0=v.pop;v.pop=v.T.pop0*.6;const slow=t.workDays(v,2);v.pop=v.T.pop0*2;const fast=t.workDays(v,2);v.pop=p0;ok(fast<slow,'more people build faster ('+slow+' days with few, '+fast+' with many)')}
 {const z=TW.find(q=>!t.bldLv(q,'brewery')&&t.bldLv(q,'farm')<2);if(z)ok(!t.needsMet(z,'brewery'),'a brewery needs level-2 farmland first ('+z.name+')')}
 // ---- pulling down
 {const l=ash.lots.find(q=>t.ESTATES[q.k]&&t.bldLv(ash,q.k)&&!(ash.work&&ash.work.k===q.k));if(l){const g0=P.gold,kk=l.k;t.demolish(ash,l);ok(!t.bldLv(ash,kk)&&!t.lotAt(ash,kk)&&P.gold>g0&&!t.occAt(l.x,l.y),'pulling down the '+kk+' frees its tiles and gives some gold back')}}
 // ---- houses and people
 // (Brookhollow, or the first holding with room for a house of any size: on a generated world a village deep in the woods has none)
 {const room=q=>[1,2].every(n=>t.lotSpot(q,n,'open',1,9,t.seeded(1),{gap:'row',jit:.8})),z=[t.townBy('Brookhollow'),...TW].find(q=>q&&q.name!=='Ashford'&&room(q));t.ensureEcon(z);z.pop=t.housing(z);z.pros=80;const c={fs:1,sat:1,kinds:3};for(let i=0;i<5;i++)t.people(z,c);ok(z.pop<=t.housing(z),'a full holding grows no more ('+z.name+': '+z.pop+' people, room for '+t.housing(z)+')');
  ok(t.fleeReason(z)==='crowded'||t.fleeReason(z)!=='','and its people have reason to leave ('+t.fleeReason(z)+')');
  z.owner=z.owner==='player'?t.HOME[z.name]:z.owner;z.work=null;t.ensureEcon(z);z.stock.timber=100;z.stock.tools=20;W.treas[z.owner]=5000;const h0=z.lots.filter(l=>l.k==='house').length;
  // a realm takes up a project on a holding on about 1 day in 20 (estateDay), so 60 days missed it on some worlds (about 1 in 20,
  // more on some seeds): give it 200 days (a miss is then ~1 in 30,000) on a seeded draw, so every run sees the same days
  const r0=Math.random;Math.random=t.seeded(7);try{for(let i=0;i<200&&!(z.work&&z.work.k==='house');i++){G.day++;z.work=null;t.estateDay()}}finally{Math.random=r0}ok(z.work&&z.work.k==='house'||z.lots.filter(l=>l.k==='house').length>h0,'its realm builds it another house')}
 // ---- saves keep every building
 {t.syncLots(ash);G.mode='world';G.modal=false;t.hidePanel();const n0=ash.lots.length,ids=ash.lots.map(l=>l.id+l.type).join();t.saveGame(true);t.loadGame();const a2=t.townBy('Ashford');
  ok(a2.lots.length===n0&&a2.lots.map(l=>l.id+l.type).join()===ids&&a2.lots.every(l=>t.occAt(l.x,l.y)===l.id),'a save keeps every building where it stands ('+n0+' at Ashford)')}
 // no free plot for a house: nothing is spent (the realm's gold and the holding's materials stay; your gold stays)
 {const q=t.TOWNS.find(x=>x.owner!=='player'&&x.lots&&x.lots.length&&!x.work),mats=t.HOUSE_COST.mats,ls=t.lotSpot,r0=Math.random;
  q.pop=t.housing(q)+5;for(const g in mats)q.stock[g]=(q.stock[g]||0)+50;W.treas[q.owner]=1e5;const st0=JSON.stringify(mats&&Object.keys(mats).map(g=>q.stock[g])),tr0=W.treas[q.owner];
  /* (the other holdings kept busy, so only this one can spend from its realm's treasury today) */const busy=t.TOWNS.filter(x=>x!==q&&!x.work);busy.forEach(x=>x.work={k:'test',lv:1,done:G.day+99,start:G.day});
  try{(0,eval)('lotSpot=()=>null');Math.random=()=>0;t.estateDay()}finally{Math.random=r0;(0,eval)('lotSpot=window.__ls||lotSpot');busy.forEach(x=>x.work=null)}
  ok(!(q.work&&q.work.k==='house')&&JSON.stringify(Object.keys(mats).map(g=>q.stock[g]))===st0&&W.treas[q.owner]===tr0,'a realm with no free plot for a house spends neither gold nor materials');
  q.work=null;P.gold=1e4;const pg=P.gold,st1=JSON.stringify(Object.keys(mats).map(g=>q.stock[g]));
  try{(0,eval)('lotSpot=()=>null');ok(!t.buildHouse(q)&&P.gold===pg&&JSON.stringify(Object.keys(mats).map(g=>q.stock[g]))===st1,'your house order with no free plot costs you nothing')}finally{(0,eval)('lotSpot=window.__ls')}}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
