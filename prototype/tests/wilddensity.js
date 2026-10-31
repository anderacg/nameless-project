'use strict';
// Wild things grow with the world (data/world.js DENSITY.grow, density(); doc/WORLD_DESIGN.md §10.6). On a generated Large world
// a new game starts with the world's own counts, today's per tile of land: its bands, beasts, game and sites; spread over the
// whole of it (every quarter of the map holds its share), each beast's lair and each herd in its own ground; the tries a day to
// bring beasts back grow with it; and a beast meets bands from a grid of where they stand exactly as from the scan of them all.
// The level of detail (worldobject.js WORLD_LOD): unbounded at Normal; on Large, near within a quarter of its
// longer side, the rest mid. A save there packs the beasts' and herds' records, the bands' without their strength, and loads
// back to the same save. INFO: each count per 1,000 tiles of land beside the old map's, and the world's frame with them.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const J=JSON.stringify,t=T,G=t.G,P=t.P,W=t.W,D=t.DENSITY,g=D.grow,C=D.classic,pn=()=>performance.now();try{localStorage.clear()}catch(e){}
 window.requestAnimationFrame=()=>0;const LOD=t.WORLD_LOD;
 ok(LOD.near===Infinity&&LOD.mid===Infinity,'the world in ('+'the classic seed, at Normal'+'): its tiers unbounded, everything thinks every frame');
 t.forgeInstall(t.genWorld({preset:'large',seed:'1'}));t.startGame('soldier',t.BGS.soldier);G.quietEvents=true;
 const m=t.WM,L=t.worldLand(m),f=L/g.land,N=t.density(t.WM),wild=W.critters.filter(c=>!c.home),bands=t.bandits;
 // ---- the counts: today's x the land's growth, and a new game starts with them
 ok(!m.classic&&N!==C&&N.bandits===Math.round(C.bandits*Math.pow(f,g.by.bandits[1]))&&N.monsterStart===Math.round(C.monsterStart*f)&&N.monsterCap===Math.round(C.monsterCap*f)&&N.critterStart===Math.round(C.critterStart*f)&&N.critterCap===Math.round(C.critterCap*f)&&N.sites.cave===Math.round(C.sites.cave*Math.pow(f,g.by.sites.cave[1]))&&N.sites.travelers===Math.round(C.sites.travelers*t.worldRoads(m)/g.roads)&&N.sites.hideout===Math.round(C.sites.hideout*t.wildLand().n/g.wild)&&N.daily.monsters===Math.round(C.daily.monsters*f),
  'a Large world: '+L+' tiles of land, '+f.toFixed(2)+' times the old map\'s: '+N.bandits+' bands, '+N.monsterStart+' / '+N.monsterCap+' beasts, '+N.critterStart+' / '+N.critterCap+' herds of game, '+N.sites.cave+' caves (^'+g.by.sites.cave[1]+'); '+t.worldRoads(m)+' tiles of road (a track\'s a half), '+N.sites.travelers+' travellers\' camps; '+t.wildLand().n+' tiles of wild land, '+N.sites.hideout+' hideouts');
 ok(N.caravans===Math.round(C.caravans*m.settings.holdings/g.holdings)&&N.ships===Math.round(C.ships*t.worldPorts(t.WM)/g.ports),'caravans and refugees by its '+m.settings.holdings+' holdings ('+N.caravans+', '+N.refugees+'), trade ships by its ports ('+N.ships+')');
 ok(W.monsters.length===N.monsterStart&&wild.length>=N.critterStart*.97&&bands.length===N.bandits,'a new game there starts with them: '+W.monsters.length+' beasts, '+wild.length+' herds of game, '+bands.length+' bands');
 {const st={};for(const s of W.sites)st[s.type]=(st[s.type]||0)+1;const short=Object.keys(N.sites).filter(k=>(st[k]||0)<N.sites[k]*(k==='travelers'?.85:.9));
  ok(!short.length,'and its sites, each kind at least 9 in 10 of its count (by its ground; the travellers, by the roads SITE_GAP apart, at least 85 in 100): '+Object.keys(N.sites).map(k=>(st[k]||0)+' of '+N.sites[k]+' '+k).join(', '))}
 {const per=n=>(n*1000/L).toFixed(2),was=n=>(n*1000/g.land).toFixed(2);
  info('per 1,000 tiles of land (the old map in brackets): bands '+per(bands.length)+' ('+was(C.bandits)+'), beasts '+per(W.monsters.length)+' ('+was(C.monsterStart)+'), game '+per(wild.length)+' ('+was(C.critterStart)+'), sites '+per(W.sites.length)+' ('+was(Object.values(C.sites).reduce((a,b)=>a+b,C.camps))+')')}
 // ---- spread over the whole world, each in its own ground
 {const q=list=>{const n=[0,0,0,0];for(const x of list)n[(x.x>=m.w*8?1:0)+(x.y>=m.h*8?2:0)]++;return n},qm=q(W.monsters),qc=q(wild),qb=q(bands),fair=(n,all)=>n.every(k=>k>=all*.12);
  ok(fair(qm,W.monsters.length)&&fair(qc,wild.length)&&fair(qb,bands.length),'spread over the whole map, every quarter its share: beasts '+qm.join('/')+', game '+qc.join('/')+', bands '+qb.join('/'));
  // (far: half the map's width from where you start; as many beasts there, for their share, as there is land, at least 3 in 4 of it)
  const R=m.w*8,far=W.monsters.filter(x=>Math.hypot(x.x-P.x,x.y-P.y)>R).length;let land=0,lf=0;for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){const k=m.kind[y*m.w+x];if(k===t.T_WATER||k===t.T_FORD)continue;land++;if(Math.hypot((x+.5)*16-P.x,(y+.5)*16-P.y)>R)lf++}
  ok(far/W.monsters.length>=lf/land*.75,far+' beasts more than half the map\'s width from where you start: '+(far/W.monsters.length*100).toFixed(1)+'% of them, beside '+(lf/land*100).toFixed(1)+'% of the land')}
 ok(W.monsters.filter(x=>!t.MONSTERS[x.id].mythic).every(x=>t.MONSTERS[x.id].where.some(w=>t.habitatAt(x.hx,x.hy).includes(w)))&&wild.every(c=>t.CRITTERS[c.id].where.some(w=>t.habitatAt(c.hx,c.hy).includes(w))),'every beast\'s lair and every herd of game in its own ground');
 // ---- the tries a day to bring beasts back: the world's (spawnMonster called by its global name)
 {const keep=window.spawnMonster,ms=W.monsters;let n=0;window.spawnMonster=()=>{n++};
  try{W.monsters=[];for(let k=0;k<40;k++)t.monsterDay()}finally{window.spawnMonster=keep;W.monsters=ms}
  const want=N.daily.monsters*40*.6;ok(Math.abs(n-want)<want*.2,'below the cap, beasts come back '+(n/40).toFixed(1)+' a day (of '+N.daily.monsters+' tries at 60%; the old map '+C.daily.monsters+')')}
 // ---- a beast meets bands from a grid exactly as from the scan of them all: 600 beasts set down by bands, each with its own cool
 {const R=t.seeded(11),probe=[];for(let k=0;k<600;k++){const b=bands[Math.floor(R()*bands.length)];probe.push({id:'wolf',x:b.x+(R()-.5)*30,y:b.y+(R()-.5)*30,cool:R()<.1?1:0})}
  bands.forEach((b,i)=>{if(i%7===0)b.fight=b.fight||'probe'});
  try{const scan=probe.map(x=>t.beastMeets(x));(0,eval)('BAND_GRID=Spatial.index(beastPrey(),64)');const grid=probe.map(x=>t.beastMeets(x));(0,eval)('BAND_GRID=null');
   const met=scan.filter(Boolean).length;ok(met>100&&scan.every((b,i)=>b===grid[i]),'from the grid each of 600 beasts meets the very band the scan finds ('+met+' meet one; bands in a fight passed over)')}
  finally{bands.forEach(b=>{if(b.fight==='probe')b.fight=null})}}
 // ---- the level of detail: near within a quarter of the longer side, the rest mid
 {LOD.t=0;t.lodTick(.01);const near=x=>Math.hypot(x.x-P.x,x.y-P.y)<=LOD.near,all=[...W.monsters,...wild,...bands],n=all.filter(near).length;
  ok(LOD.near===m.w*16/4&&LOD.mid===Infinity&&all.every(x=>t.tierOf(x)===(near(x)?'near':'mid'))&&n>0&&n<all.length,'a Large world bounds its tiers: within '+LOD.near+' px of you near ('+n+' of '+all.length+' beasts, herds and bands), the rest mid, every 4th frame')}
 // ---- its save: the beasts and herds packed, the bands without their strength; loaded back to the same save
 {const LD=t.LOADING,s0=LD.sync,raw=()=>localStorage.getItem(t.slotKey('quick')),strip=s=>{const v=JSON.parse(s);delete v.at;return JSON.stringify(v)};LD.sync=true;
  try{G.mode='world';G.modal=false;t.hidePanel();t.saveGame(true,'quick');const a=raw(),d=JSON.parse(a),m0=W.monsters.find(x=>!x.qid),i0=W.monsters.indexOf(m0),n=W.monsters.length,h=W.critters.length;
   ok(Array.isArray(d.world.monsters[i0])&&d.world.critters.every(Array.isArray)&&d.bandits.every(b=>!('pw' in b))&&d.world.monsters[i0][1]===Math.round(m0.x*10)/10,'packed: a beast '+J(d.world.monsters[i0])+', a herd '+J(d.world.critters[W.critters.findIndex(c=>!c.home)])+' ('+(a.length/1024).toFixed(0)+' KB plain)');
   // (the saves compared after a load, as worldsave's: a load drops what play kept for itself, as a party's power)
   t.loadGame('quick');const b=W.monsters[i0];G.mode='world';t.saveGame(true,'quick');const s1=raw();t.loadGame('quick');G.mode='world';t.saveGame(true,'quick');
   ok(W.monsters.length===n&&W.critters.length===h&&b.mapKind==='monster'&&b.id===m0.id&&Math.abs(b.x-m0.x)<=.05&&b.t===0&&W.critters.every(c=>c.crit&&(c.home||c.mapKind==='critter')),'loaded back: '+n+' beasts and '+h+' herds as they were (to a tenth of a pixel, their wandering drawn again)');
   ok(strip(raw())===strip(s1)&&J(JSON.parse(s1).world.monsters)===J(d.world.monsters)&&J(JSON.parse(s1).world.critters)===J(d.world.critters),'and a load and a save again give the same save, its beasts and herds as first saved')}
  finally{LD.sync=s0}}
 // ---- the world's frame with them (INFO: 200 frames at .05 s, the median)
 {G.mode='world';G.modal=false;t.hidePanel();const fr=[];for(let k=0;k<220;k++){G.encCool=1e9;const a=pn();t.updateWorld(.05);if(k>=20)fr.push(pn()-a);if(G.mode!=='world'){t.hidePanel();G.mode='world';G.modal=false;G.enc=null}}
  fr.sort((a,b)=>a-b);info('updateWorld '+fr[fr.length>>1].toFixed(2)+' ms a frame (median), '+fr[Math.floor(fr.length*.95)].toFixed(2)+' at the 95th percentile, with '+W.parties.length+' parties, '+W.monsters.length+' beasts, '+W.critters.length+' herds')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
