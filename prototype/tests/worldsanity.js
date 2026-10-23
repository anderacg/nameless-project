'use strict';
/* World sanity (doc/WORLD_DESIGN.md §8.14, §15.2 wave 3 E): §8.14's Phase 2 rows on generated worlds, 8 seeds at Normal and 2 at
   Large (tests/visual/worldsanity.js: 30 and 10, by name), each made and put in as a new game makes it (begin with its settings).
   Reachable: every holding and bandit camp by land (and ferry) from every realm's capital. Seasonal: the same with every seasonal
   crossing shut (the fords on rivers that flood). Suitable land: each capital liked at PLACE.suit or more by its people, with
   PLACE.land suitable tiles within PLACE.landR (x1.5 at Large; worldplace.js placeSuit and placeLand, on the fields and the ground
   its stage 7 read; a capital's liking as stage 7 chose it, before the ground under it was opened: g.work.like). Balanced: each capital's nearest rival within 25% of their mean distance, each realm's land within 30% of
   theirs. A fair start: each race's start city with 3 holdings within a day's travel (Router.days) and no wild land within 25
   tiles. Ports: each on harbour water (worldplace.js portWater: the sea, an inland sea or a big lake, a navigable or great river;
   the owner's play-test of 2026-10-22), a port at least, and every port estate's pier on a lake or a river 2 wide or more (never a
   pond, an oasis or a stream), a port town's on harbour water; INFO: a port on water joined to neither the sea nor another port. Rivers: never uphill, each ending in water, no great river
   freezing, crossings at most 60 tiles apart wherever one can be made (else a bare stretch, INFO). Rivers by holdings: the land
   beside each river near a holding walked to from its gate. Estates on foot: every house, estate and field too. Climates: each 6% of the land or
   more. As INFO, the rows of later phases: no emptiness (the 95th percentile of the walk to the nearest place, 25 tiles at most:
   measured now over holdings, sites, camps and crossings; Phase 4 adds hamlets and sacred places), wild regions and the lair
   (Phase 4), the shape metrics (Phase 3: tests/worldshape.js). Each world's lines start with
   its preset and seed; INFO: its time, tries and relaxations, and every rule's tally over the worlds */
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,W=t.W,N=window.WSAN||{normal:8,large:2},worlds=[],tally={},pass=(rule,c,m)=>{(tally[rule]=tally[rule]||[0,0])[c?0:1]++;ok(c,m)};
 for(let k=1;k<=N.normal;k++)worlds.push({preset:'normal',seed:'s'+k});
 for(let k=1;k<=N.large;k++)worlds.push({preset:'large',seed:'s'+k});
 // (what stage 7 read: its fields, from the last stage's context, and the ground before the roads were laid on it)
 const gs=t.GEN_STAGES.find(s=>s.id==='graph'),rs=t.GEN_STAGES.find(s=>s.id==='roads'),g0=gs.run,r0=rs.run;let cap=null,kind7=null;
 rs.run=g=>{kind7=g.map.kind.slice();return r0(g)};
 gs.run=g=>{cap={F:g.work.place,like:g.work.like||{},tries:{...g.tries},relaxed:g.relaxed.slice()};return g0(g)};
 try{for(const S of worlds){
  cap=null;const a=performance.now();t.begin('soldier',S);G.quietEvents=true;const ms=performance.now()-a,m=t.WM;
  const name=S.preset[0].toUpperCase()+S.preset.slice(1)+' '+S.seed;
  if(!cap||!m.settings||m.settings.seed!==S.seed){ok(false,name+': made and put in');continue}
  const Wd=m.w,H=m.h,NN=Wd*H,K=m.kind,TW=t.TOWNS,walk=t.passable,at=o=>o.ty*Wd+o.tx,d2=(a,b)=>(a.tx-b.tx)*(a.tx-b.tx)+(a.ty-b.ty)*(a.ty-b.ty);
  const caps=t.FIDS.map(f=>({f,h:t.realmCapital(f)})).filter(c=>c.h),camps=t.CAMP_SPOTS.map(c=>({tx:c.tx,ty:c.ty}));
  info(name+': '+Wd+' x '+H+', made and put in in '+ms.toFixed(0)+' ms; '+TW.length+' holdings, '+camps.length+' camps, '+W.sites.length+' sites, '+m.rivers.length+' rivers, '+m.crossings.length+' crossings; tries '+Object.entries(cap.tries).filter(([,n])=>n>1).map(([k,n])=>k+' '+n).join(', ')+'; relaxed: '+(cap.relaxed.join('; ')||'nothing'));
  // ---- reachable, and in every season: 4 ways over walkable ground, and over ferries; seasonal: the fords on flooding rivers shut
  {const ferry=new Map(),shut=new Uint8Array(NN);let nShut=0;
   for(const c of m.crossings){if(c.kind==='ferry'){ferry.set(c.i,c.j);ferry.set(c.j,c.i)}if(c.when||c.kind==='ford'&&c.tiles.some(i=>m.river[i]&32)){nShut++;for(const i of c.tiles)shut[i]=1}}
   for(let i=0;i<NN;i++)if(K[i]===t.T_FORD&&(m.river[i]&32))shut[i]=1;
   const reach=(s,closed)=>{const R=new Uint8Array(NN),q=new Int32Array(NN);let a=0,b=0;const go=j=>{if(!R[j]&&walk(K[j])&&!(closed&&shut[j])){R[j]=1;q[b++]=j}};go(s);
     while(a<b){const i=q[a++],x=i%Wd;if(x>0)go(i-1);if(x<Wd-1)go(i+1);if(i>=Wd)go(i-Wd);if(i+Wd<NN)go(i+Wd);if(ferry.has(i))go(ferry.get(i))}return R};
   for(const closed of [false,true]){const miss=[];for(const c of caps){const R=reach(at(c.h),closed);for(const p of [...TW,...camps])if(!R[at(p)])miss.push(c.h.name+'>'+(p.name||'camp '+p.tx+','+p.ty))}
    if(!closed)pass('Reachable',!miss.length,name+': reachable: every holding ('+TW.length+') and camp ('+camps.length+') by land and ferry from every capital'+(miss.length?': not '+miss.slice(0,4).join(', '):''));
    else pass('Seasonal',!miss.length,name+': seasonal: the same with the '+nShut+' seasonal crossings shut (fords on flooding rivers): every holding and camp still reachable'+(miss.length?': not '+miss.slice(0,4).join(', '):''))}}
  // ---- suitable land: the generator's liking and land count, on stage 7's fields and ground
  {const F=cap.F,m7=Object.assign(Object.create(m),{kind:kind7}),need=t.placeNeed(m),bad=[];
   const L=caps.map(c=>{const p=t.PLACE_PEOPLE[c.f],v=c.h.name in cap.like?cap.like[c.h.name]:t.placeSuit(m7,F,p,at(c.h)),n=t.placeLand(m7,F,p,c.h.tx,c.h.ty);if(v<t.PLACE.suit||n<need)bad.push(c.h.name);return c.h.name+' '+v.toFixed(2)+'/'+n});
   pass('Suitable land',!bad.length,name+': suitable land: each capital liked '+t.PLACE.suit+' or more, with '+need+' suitable tiles within '+t.PLACE.landR+': '+L.join(', ')+(bad.length?' (not: '+bad.join(', ')+')':''))}
  // ---- balanced: each capital's nearest rival, and each realm's land, against their means
  {const near=caps.map(a=>Math.sqrt(Math.min(...caps.filter(b=>b!==a).map(b=>d2(a.h,b.h))))),mn=near.reduce((a,b)=>a+b,0)/near.length,sk=Math.max(...near.map(d=>Math.abs(d-mn)/mn));
   const land=caps.map(c=>t.landsOf(c.f)),ml=land.reduce((a,b)=>a+b,0)/land.length,lk=Math.max(...land.map(n=>Math.abs(n-ml)/ml));
   pass('Balanced',sk<=.25&&lk<=.3,name+': balanced: the capitals\' nearest rivals '+near.map(d=>d.toFixed(0)).join('/')+' tiles, at most '+(sk*100).toFixed(0)+'% off their mean (25% allowed); the realms\' land '+land.join('/')+' tiles, at most '+(lk*100).toFixed(0)+'% off (30%)')}
  // ---- a fair start for each race: 3 holdings within a day's travel of its start city, no wild land within 25 tiles
  {const bad=[],L=Object.keys(t.RACES).map(r=>{const c=t.capitalOf(r),n=TW.filter(h=>h!==c&&t.Router.days(c,h)<=1).length;let wild=0;
     for(let y=c.ty-25;y<=c.ty+25;y++)for(let x=c.tx-25;x<=c.tx+25;x++)if(m.has(x,y)&&(x-c.tx)*(x-c.tx)+(y-c.ty)*(y-c.ty)<=625&&m.region[y*Wd+x])wild++;
     if(n<3||wild)bad.push(r);return r+' '+c.name+' '+n+(wild?' (wild '+wild+')':'')});
   pass('A fair start',!bad.length,name+': a fair start: holdings within a day\'s travel of each race\'s start city: '+L.join(', ')+(bad.length?' (short: '+bad.join(', ')+')':''))}
  // ---- ports: harbour water within 2 tiles (worldplace.js portWater), a port at least; each port estate's pier on a fishing pier's
  // water, a port town's on harbour water (lots.js pierWater, as structures.js pierOf lays it); INFO: a port whose water (4 ways,
  // rivers under their fords and bridges too) reaches neither the map's rim nor another port's
  {const L=new Int32Array(NN).fill(-1),rim=[],wet=i=>K[i]===t.T_WATER||(m.river[i]&3)>0;let n=0;
   for(let s=0;s<NN;s++){if(L[s]>=0||!wet(s))continue;const st=[s];L[s]=n;let open=false;
    while(st.length){const i=st.pop(),x=i%Wd,y=(i-x)/Wd;if(!x||!y||x===Wd-1||y===H-1)open=true;for(const j of [x>0?i-1:-1,x<Wd-1?i+1:-1,y>0?i-Wd:-1,y<H-1?i+Wd:-1])if(j>=0&&L[j]<0&&wet(j)){L[j]=n;st.push(j)}}rim.push(open);n++}
   const P=TW.filter(h=>h.style==='port'||h.style==='riverport'),body=h=>{const B=new Set();for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++)if(m.has(h.tx+a,h.ty+b)&&L[(h.ty+b)*Wd+h.tx+a]>=0)B.add(L[(h.ty+b)*Wd+h.tx+a]);return B};
   const lone=P.filter(h=>![...body(h)].some(k=>rim[k]||P.some(o=>o!==h&&body(o).has(k)))),PW=t.portWater(m),hb=h=>{for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++)if(m.has(h.tx+a,h.ty+b)&&PW[(h.ty+b)*Wd+h.tx+a]===2)return true;return false};
   const bad=P.filter(h=>!hb(h)),piers=TW.filter(h=>t.bldLv(h,'port')&&t.pierOf(h)),pb=piers.filter(h=>{const l=t.lotAt(h,'port'),w=t.pierWater(l.x,l.y,l.n);return w<0||PW[w]<(h.style==='port'?2:1)});
   pass('Ports',P.length&&!bad.length&&!pb.length,name+': ports: '+P.length+', each on harbour water'+(bad.length?': not '+bad.map(h=>h.name).join(', '):'')+'; '+piers.length+' port estates, each pier on a lake or a river 2 wide or more (a port town’s on harbour water)'+(pb.length?': not '+pb.map(h=>h.name).join(', '):''));
   if(lone.length)info(name+': a port on water joined to neither the sea nor another port (an inland sea, a big lake or a river’s): '+lone.map(h=>h.name).join(', '))}
  // ---- rivers: never uphill, each ending in water (a tile of water, or water under a ford or bridge since), no great river
  // freezing; crossings at most 60 tiles apart along each (its source counts as one, its mouth as an end: places along it as the
  // generator reads them, worldplace.js placeAlong) wherever one can be made: a straight run of water, across or down, of 3 tiles
  // at most (12 on a great river by a town or port, a ferry), from land a road can take (walkable, no ford, the land stage 7 found
  // joined, no notch with water on both sides, none in a holding's centre nor the ring beside and behind it, nor by another crossing's end) to such land, none of it a crossing yet; else, or where a bridge was taken up for no
  // road reaching it (PLACE_STATS droppedAt), a bare stretch (INFO)
  {const up=[],dry=[],ice=[];for(const r of m.rivers){const p=r.path;let u=false;for(let k=1;k<p.length;k++)if(m.elev[p[k]]>m.elev[p[k-1]])u=true;if(p.length&&m.elev[r.mouth]>m.elev[p[p.length-1]])u=true;if(u)up.push(r.name);
    if(!p.length||K[r.mouth]!==t.T_WATER&&K[r.mouth]!==t.T_FORD&&!(m.river[r.mouth]&3)&&!(m.feat[r.mouth]&32))dry.push(r.name+' ('+K[r.mouth]+')');if(r.width>=3&&(r.seasonal&&r.seasonal.freeze||p.some(i=>(m.river[i]&3)===3&&(m.river[i]&16))))ice.push(r.name)}
   const F=cap.F,Xt=new Set(m.crossings.flatMap(c=>c.tiles)),town=new Uint8Array(NN);
   for(const h of TW)if(h.kind==='town'||h.kind==='city'||h.style==='port')for(let b=-8;b<=8;b++)for(let a=-8;a<=8;a++)if(a*a+b*b<=64&&m.has(h.tx+a,h.ty+b))town[(h.ty+b)*Wd+h.tx+a]=1;
   const bx=new Set();for(const h of TW){const b=t.placeBox(h);for(let y=b.y-1;y<=h.ty;y++)for(let x=b.x-1;x<=b.x+b.n;x++)if(m.has(x,y)&&!(x===h.tx&&y===h.ty+1))bx.add(y*Wd+x)}
   const end=(i,s)=>walk(K[i])&&K[i]!==t.T_FORD&&F.conn[i]===F.main&&!bx.has(i)&&t.placeApart(m,i)&&!t.placeNotch(m,i,s);
   const can=i=>{if(K[i]!==t.T_WATER||Xt.has(i))return false;const x=i%Wd,y=(i-x)/Wd;for(const [dx,dy] of [[1,0],[0,1]]){const s=dx+dy*Wd;let a=0,b=0;
     while(a<=12&&m.has(x-dx*(a+1),y-dy*(a+1))&&K[i-s*(a+1)]===t.T_WATER)a++;while(b<=12&&m.has(x+dx*(b+1),y+dy*(b+1))&&K[i+s*(b+1)]===t.T_WATER)b++;
     if(!m.has(x-dx*(a+1),y-dy*(a+1))||!m.has(x+dx*(b+1),y+dy*(b+1)))continue;const p=i-s*(a+1),q=i+s*(b+1),k=a+b+1,T2=[];for(let n=1;n<=k;n++)T2.push(p+s*n);
     if(!end(p,s)||!end(q,s)||T2.some(j=>Xt.has(j)))continue;const w=Math.max(...T2.map(j=>m.river[j]&3));if(k<=3||w===3&&k<=12&&(town[p]||town[q]))return true}return false};
   const gaps=[],bare=[];
   for(const rv of m.rivers){const on=new Map(rv.path.map((i,k)=>[i,k])),pos=[0,rv.path.length-1];for(const c of m.crossings)if(c.river===rv.id){const p=t.placeAlong(m,on,c.tiles);if(p>=0)pos.push(p)}
    pos.sort((a,b)=>a-b);for(let k=1;k<pos.length;k++){if(pos[k]-pos[k-1]<=60)continue;let c=-1;for(let q=pos[k-1]+1;q<=Math.min(pos[k-1]+60,pos[k]-1)&&c<0;q++)if(can(rv.path[q]))c=q;
     const up=t.PLACE_STATS.droppedAt.some(d=>d.river===rv.id&&d.at>pos[k-1]&&d.at<pos[k]);(c<0||up?bare:gaps).push(rv.name+' '+pos[k-1]+'-'+pos[k]+(up?' (a bridge taken up there: no road reaches it)':c<0?'':' (could at '+c+')'))}}
   pass('Rivers',!up.length&&!dry.length&&!ice.length&&!gaps.length,name+': rivers: '+m.rivers.length+' never uphill, each ending in water, no great river freezing ('+m.rivers.filter(r=>r.width>=3).length+' great), crossings ('+m.crossings.length+') at most 60 tiles apart wherever one can be made'+
    (up.length?'; uphill: '+up.slice(0,3).join(', '):'')+(dry.length?'; ending on land: '+dry.slice(0,3).join(', '):'')+(ice.length?'; freezing: '+ice.join(', '):'')+(gaps.length?'; gaps: '+gaps.slice(0,3).join(', '):''));
   if(bare.length)info(name+': bare stretches over 60 tiles where no crossing can be made: '+bare.join(', '))}
  // ---- the owner's play-test 3 (estates across a river from their holding, no way over). Rivers by holdings: a river's water within
  // PLACE_HOLD.river tiles of a holding, the land beside it within PLACE_HOLD.bank walked to from its gate (4 ways over walkable
  // ground, fords, bridges and ferries, within PLACE_HOLD.box: worldplace.js placeWalk), not far round (PLACE_HOLD.round), else a
  // crossing of it within PLACE_HOLD.end, but where none can be made (PLACE_STATS holdBare, INFO). Estates on foot: every house,
  // estate and field of every holding on ground walked to from its gate (within LOT_WALK) and on its piece of land (Router.reach)
  {const HP=t.PLACE_HOLD,near1=(w,h,x,y)=>{const d=t.placeWalkSteps(w,x,y);return d>=0&&d<=HP.round[0]*(Math.abs(x-h.tx)+Math.abs(y-h.ty-1))+HP.round[1]},bare=t.PLACE_STATS.holdBare,rv=new Int16Array(NN).fill(-1),miss=[],far=[];
   // (each river tile's river, as the generator reads it: from its path out over the river's tiles, 8 ways)
   {const q=[];for(const r of m.rivers)for(const i of r.path)if(rv[i]<0){rv[i]=r.id;q.push(i)}
    for(let a=0;a<q.length;a++){const i=q[a],x=i%Wd,y=(i-x)/Wd;for(const [dx,dy] of t.DIR8){const j=i+dx+dy*Wd;if(m.has(x+dx,y+dy)&&rv[j]<0&&(m.river[j]&3)){rv[j]=rv[i];q.push(j)}}}}
   const xed=(h,rr)=>m.crossings.some(c=>(c.river===rr||c.tiles.some(i=>rv[i]===rr))&&[c.i,c.j].some(i=>Math.max(Math.abs(i%Wd-h.tx),Math.abs(Math.floor(i/Wd)-h.ty))<=HP.end));
   // (land not walked to in a piece of fewer than PLACE_HOLD.pocket tiles, 4 ways: a lone tile in the river, no bank to cross to)
   const pocket=(w,h,i)=>{const q=[i],sn=new Set(q);for(let a=0;a<q.length&&q.length<HP.pocket;a++){const c=q[a],x=c%Wd;for(const j of [x>0?c-1:-1,x<Wd-1?c+1:-1,c-Wd,c+Wd])if(j>=0&&j<NN&&!sn.has(j)&&walk(K[j])&&!near1(w,h,j%Wd,(j-j%Wd)/Wd)){sn.add(j);q.push(j)}}return q.length<HP.pocket};
   for(const h of TW){const w=t.placeWalk(m,at(h)+Wd,HP.box),near=new Set(),seen=new Set();
    for(let y=h.ty-HP.river;y<=h.ty+HP.river;y++)for(let x=h.tx-HP.river;x<=h.tx+HP.river;x++)if(m.has(x,y)&&K[y*Wd+x]===t.T_WATER&&rv[y*Wd+x]>=0)near.add(rv[y*Wd+x]);
    for(let y=h.ty-HP.bank;y<=h.ty+HP.bank;y++)for(let x=h.tx-HP.bank;x<=h.tx+HP.bank;x++){const i=y*Wd+x;if(!m.has(x,y)||!walk(K[i])||near1(w,h,x,y)||pocket(w,h,i))continue;
     for(const j of [i-1,i+1,i-Wd,i+Wd]){if(j<0||j>=NN||K[j]!==t.T_WATER||!near.has(rv[j]))continue;const k=h.name+' '+m.rivers[rv[j]].name;if(!seen.has(k)){seen.add(k);if(!xed(h,rv[j]))(bare.includes(k)?far:miss).push(k+' at '+x+','+y)}}}}
   pass('Rivers by holdings',!miss.length,name+': rivers by holdings: the land beside every river within '+HP.river+' tiles of a holding walked to from its gate, not far round, else a crossing of it within '+HP.end+' tiles'+(miss.length?': not '+miss.slice(0,4).join(', '):'')+' ('+t.PLACE_STATS.holdXing+' crossings laid for it)');
   if(far.length)info(name+': rivers by a holding no crossing can be made over: '+far.join(', '));
   const bad=[];let n=0;for(const h of TW){const g0=at(h)+Wd,lw=t.placeWalk(m,walk(K[g0])?g0:at(h),t.LOT_WALK);
    for(const l of h.lots||[]){if(l.k==='centre')continue;n++;const tl=[];t.lotTiles(l,(a,b)=>tl.push([a,b]));for(const p of l.plots||[])tl.push(p);
     if(tl.some(([a,b])=>!t.placeWalkAt(lw,a,b)||!t.Router.reach(h,{x:(a+.5)*t.TILE,y:(b+.5)*t.TILE})))bad.push(h.name+' '+l.k+' at '+l.x+','+l.y)}}
   pass('Estates on foot',n&&!bad.length,name+': estates on foot: every house, estate and field ('+n+' lots) on ground walked to from its holding’s gate'+(bad.length?': not '+bad.slice(0,4).join(', '):''))}
  // ---- climates: each 6% of the land (every tile not water) or more
  {const n=[0,0,0,0];let L=0;for(let i=0;i<NN;i++)if(K[i]!==t.T_WATER){n[m.clim[i]]++;L++}
   pass('Climates',n.every(c=>c>=L*.06),name+': climates: '+t.CLIMS.map((c,k)=>c+' '+(n[k]*100/L).toFixed(1)+'%').join(', ')+' of the land')}
  // ---- no emptiness, measured (its rule waits for Phase 4's hamlets and sacred places): the walk (8 ways over walkable ground) from every walkable tile outside wild cores to the nearest holding,
  // site (camps among them) or crossing's end; land no place can be walked to counts as too far
  {const D=new Int32Array(NN).fill(-1),q=new Int32Array(NN);let a=0,b=0;const seed=i=>{if(i>=0&&i<NN&&D[i]<0&&walk(K[i])){D[i]=0;q[b++]=i}};
   for(const h of TW)seed(at(h));for(const s of W.sites)seed(at(s));for(const c of m.crossings){seed(c.i);seed(c.j)}
   while(a<b){const i=q[a++],x=i%Wd,y=(i-x)/Wd;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy||!m.has(x+dx,y+dy))continue;const j=i+dx+dy*Wd;if(D[j]<0&&walk(K[j])){D[j]=D[i]+1;q[b++]=j}}}
   const ds=[];let lost=0;for(let i=0;i<NN;i++)if(walk(K[i])&&!m.region[i]){if(D[i]<0)lost++;ds.push(D[i]<0?1e9:D[i])}
   ds.sort((x,y)=>x-y);const p95=ds[Math.floor(ds.length*.95)],p50=ds[Math.floor(ds.length*.5)];
   info(name+': no emptiness (Phase 4, with its hamlets and sacred places; 25 tiles the target): the walk to the nearest place, over '+ds.length+' walkable tiles: median '+p50+', 95th percentile '+(p95>=1e9?'none':p95)+' tiles'+(lost?'; '+lost+' tiles no place can be walked to':''))}
  info(name+': wild regions '+m.regions.length+' and the lair (Phase 4); the shape metrics (Phase 3, tests/worldshape.js): not yet')}
 }finally{gs.run=g0;rs.run=r0}
 info('rules over '+worlds.length+' worlds (passed/failed): '+Object.entries(tally).map(([k,v])=>k+' '+v[0]+'/'+v[1]).join(', '));
});
