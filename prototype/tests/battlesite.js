'use strict';
// The BattleSite hand-off (doc/WORLD_DESIGN.md R17): on every tile of the classic world the battle's inputs read through
// WorldMap.battleSite (its env, ground spec: recipe, seed, river, edges, road, elven; its type's bridge, its field size, its cover)
// equal today's direct reads of the world (kept below as they were); the battle's world-reading code reads only the site; the
// lab makes its own; the empty slots are there, and the world's salt goes into the field's seed.
// World Phase 2 (doc/WORLD_DESIGN.md §13, §15.2.3, agent E): the new fields into the battle, from sites made here (so with the
// flag off too): river width to 24 / 40 / 64 px of half-water, the world's bridge (stone or wood), fords only, the ferry's one
// ford, a delta's and a floodplain's marsh, the high ground's kinds to layouts (rise, steep, cliffed), the lab's site. With the
// generated world (-Gen, WM.gen not classic-0): today's reads still give everything but the river, its bridge and the high
// ground, which come from the world's layers and crossings; Hold the bridge's share of fights on the roads (at most 25%).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,P=t.P,G=t.G,TILE=t.TILE,MW=t.MW,MH=t.MH,tAt=t.tAt,climAt=t.climAt,{T_OPEN,T_FOREST,T_HILL,T_WATER,T_ROAD,T_MOUNT}=t,GEN=t.WM.gen!=='classic-0';
 // (the generated world: a world bridge within N tiles, from its crossings; a spec less what the world now gives)
 const BT=new Set();if(GEN)for(const c of t.WM.crossings)if(c.kind==='bridge')for(const j of [c.i,c.j,...c.tiles])BT.add(j);
 const genBridge=(tx,ty,N)=>{for(let dy=-N;dy<=N;dy++)for(let dx=-N;dx<=N;dx++){const x=tx+dx,y=ty+dy;if(x>=0&&y>=0&&x<MW&&y<MH&&BT.has(y*MW+x))return true}return false};
 const strip=(s,S)=>{if(!GEN||s[0]!=='{')return s;const g=JSON.parse(s);delete g.wr;delete g.high;if(S&&S.river)delete g.river;else if(g.river&&'bridge' in g.river)g.river.bridge=0;return JSON.stringify(g)};
 // ---- today's direct reads (as setup.js, terrain.js and engage.js read the world before R17)
 const oldEnv=()=>{const r=t.regionAt(P.x,P.y),tt=r.t===T_MOUNT||r.t===T_WATER?T_HILL:r.t,c=r.c;
  const text=tt===T_FOREST?'Trees block movement and stop some arrows. Elves shoot through them.':tt===T_HILL?'High ground: archers reach 15% farther.'
   :c==='frost'?'Snow slows everyone but dwarves and wolves.':c==='desert'?'The heat slows melee attacks, except for orcs and scorpions.':c==='swamp'?'Mud slows everyone and stalls cavalry charges. Orcs wade through.':'Open ground: cavalry rides 15% faster.';
  return{c,t:tt,name:r.name,text}};
 const oldEdges=(tx,ty,recipe,c)=>{
  const out={},S={n:[[-1,-1],[0,-1],[1,-1]],s:[[-1,1],[0,1],[1,1]],w:[[-1,-1],[-1,0],[-1,1]],e:[[1,-1],[1,0],[1,1]]},cl=(a,b)=>climAt((a+.5)*TILE,(b+.5)*TILE);
  for(const s in S){const v={};S[s].forEach(([dx,dy],j)=>{const a=tx+dx,b=ty+dy,k0=tAt(a,b),k=k0===T_FOREST?'forest':k0===T_HILL?'hills':k0===T_MOUNT?'peaks':k0===T_WATER?'water':cl(a,b)==='swamp'&&c!=='swamp'?'marsh':'open';v[k]=(v[k]||0)+(j===1?2:1)});
   const own=recipe==='forest'?'forest':recipe==='hills'?'hills':recipe==='peaks'?'peaks':recipe==='swamp'?'marsh':null;
   for(const k of ['peaks','water','forest','hills','marsh','open'])if(v[k]>=2&&k!==own&&(k!=='open'||recipe==='forest')){out[s]=k;break}}
  return out};
 const oldAt=(x,y,env)=>{const TR=t.TERRAIN_RIVER,hash=t.hash;
  const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);let n=0,w=0,m=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const k=tAt(tx+dx,ty+dy);if(k===T_FOREST)n++;else if(k===T_WATER)w++;else if(k===T_MOUNT)m++}
  const recipe=t.terrainRecipeOf(env.t,env.c,n,m,tAt(tx,ty)===T_MOUNT),code=1+Object.keys(t.TERRAIN_RECIPE).indexOf(recipe)*4+Math.max(0,t.CLIMS.indexOf(env.c));
  let river=null;if(recipe!=='desert'){if(w>0){const N=TR.near,rb=(a,b)=>tAt(a,b)===T_ROAD&&(tAt(a-1,b)===T_WATER&&tAt(a+1,b)===T_WATER||tAt(a,b-1)===T_WATER&&tAt(a,b+1)===T_WATER);let br=false;
    for(let dy=-N;dy<=N&&!br;dy++)for(let dx=-N;dx<=N;dx++)if(rb(tx+dx,ty+dy)){br=true;break}river={bridge:br,frozen:env.c==='frost'}}
   else if(recipe==='swamp'&&hash(tx,ty,code+101)<TR.streamP)river={stream:true};
   else if(env.c==='frost'&&hash(tx,ty,code+103)<TR.frostP)river={frozen:true}}
  const R=tAt(tx,ty)===T_ROAD,rN=tAt(tx,ty-1)===T_ROAD||tAt(tx,ty+1)===T_ROAD;
  const elven=recipe==='forest'&&t.TOWNS.some(q=>q.races&&q.races.length===1&&q.races[0]==='elf'&&Math.hypot(q.tx-tx,q.ty-ty)<=10);
  return{recipe,seed:Math.floor(hash(tx,ty,code)*4294967296)>>>0,tx,ty,oasis:recipe==='desert'&&(w>0||tAt(tx,ty)===T_WATER),river,frost:env.c==='frost',
   edges:oldEdges(tx,ty,recipe,env.c),road:R?{ew:true,ns:rN}:null,elven,forest:env.t===T_FOREST||n>=3}};
 const oldBridge=(tx,ty)=>{const rb=(a,b)=>tAt(a,b)===T_ROAD&&(tAt(a-1,b)===T_WATER&&tAt(a+1,b)===T_WATER||tAt(a,b-1)===T_WATER&&tAt(a,b+1)===T_WATER);
  const N=t.BTYPE_WORLD.near;for(let dy=-N;dy<=N;dy++)for(let dx=-N;dx<=N;dx++)if(rb(tx+dx,ty+dy))return true;return false};
 const oldType=e=>{const env=oldEnv(),g=oldAt(P.x,P.y,env);if(g.river&&!g.river.frozen&&!g.river.stream&&oldBridge(g.tx,g.ty))return{kind:'bridge',def:e.mine?1:0,ford:t.hash(g.tx,g.ty,4447)<t.BTYPE.ford};return null};
 // (cover: today's ran the field for the ground it read; its hills test read the tile and your env)
 const oldCoverPre=(x,y)=>{const env=oldEnv(),k=t.terrAt(x,y),g=oldAt(x,y,env);return g.recipe==='forest'?'forest':k===T_HILL||k===T_MOUNT||env.t===T_HILL?'hills':JSON.stringify(g)};
 const oldCover=(x,y)=>{const pre=oldCoverPre(x,y);if(pre==='forest'||pre==='hills')return pre;const T0=t.buildTerrain({...JSON.parse(pre),W:t.clamp(t.BVW,t.FIELD_W.min,t.FIELD_W.max)});return T0.has.wood||T0.has.rock?'field':null};
 const newCoverPre=(x,y)=>{const S=t.battleSiteAt(x,y),env=t.battleEnv(false,S),g=t.terrainOf(S,env);return g.recipe==='forest'?'forest':S.t===T_HILL||S.t===T_MOUNT||env.t===T_HILL?'hills':JSON.stringify(g)};
 const J=JSON.stringify,ENVS=[{c:'grass',t:T_OPEN},{c:'frost',t:T_FOREST},{c:'desert',t:T_HILL},{c:'swamp',t:T_OPEN},{c:'grass',t:T_FOREST},{c:'frost',t:T_HILL},{c:'desert',t:T_OPEN},{c:'swamp',t:T_FOREST}];
 const px=P.x,py=P.y,enc=G.enc,on=t.TERRAIN.on;t.TERRAIN.on=true;G.enc=null;
 // ---- every tile of the classic world
 const bad={env:[],spec:[],other:[],region:[],bridge:[],type:[],cover:[],field:[]},N=MW*MH,gs={river:0,road:0,held:0};let fp1=0,fp2=0,rec={},br=0,elv=0,rd=0,cv=0;
 // (the generated world: the spec as today's but for the river (by the world's crossing) and the world's own (wr: its width, its
 // bridge's make, wet ground; high: as the site's); a river where the world has one by the tile, never in the desert)
 const sameGen=(a,b,S)=>{const A=JSON.parse(a),Bq=JSON.parse(b);if(strip(a,S)!==strip(b,S))return false;const X=S.crossing;
  if(S.river&&Bq.recipe!=='desert')return !!Bq.river&&Bq.river.bridge===(!!X&&X.kind==='bridge')&&!!Bq.river.ferry===(!!X&&X.kind==='ferry')&&!!Bq.wr&&Bq.wr.w===S.river.w&&J(Bq.high||null)===J(S.high);
  if(Bq.wr)return false;if(A.river&&'bridge' in A.river&&Bq.river.bridge!==(S.bridge!==null&&S.bridge<=t.TERRAIN_RIVER.near))return false;return J(Bq.high||null)===J(S.high)};
 const genType=(e,S)=>{const env=t.battleEnv(false,S),g=t.terrainOf(S,env);if(g.river&&!g.river.frozen&&!g.river.stream&&genBridge(g.tx,g.ty,t.BTYPE_WORLD.near))return{kind:'bridge',def:e.mine?1:0,ford:t.hash(g.tx,g.ty,4447)<t.BTYPE.ford};return null};
 const mix=(h,s)=>{for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return h};
 for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){const x=(tx+.5)*TILE,y=(ty+.5)*TILE,at=tx+','+ty;P.x=x;P.y=y;
  const S=t.WM.battleSite(tx,ty),e0=oldEnv(),e1=t.battleEnv(false),e2=t.battleEnv(false,S);
  if(J(e0)!==J(e1)||J(e0)!==J(e2))bad.env.push(at);
  const g0=J(oldAt(x,y,e0)),g1=J(t.terrainAt(x,y,e1)),g2=J(t.groundSpecFor({},e2,S));fp1=mix(fp1,strip(g0,S));fp2=mix(fp2,strip(g2,S));
  if(GEN?!sameGen(g0,g2,S)||g1!==g2:g0!==g1||g0!==g2)bad.spec.push(at);
  const E=ENVS[(tx+ty)%ENVS.length];if(GEN?!sameGen(J(oldAt(x,y,E)),J(t.terrainOf(S,E)),S):J(oldAt(x,y,E))!==J(t.terrainOf(S,E)))bad.other.push(at);// (a test's own ground on this tile)
  const r=t.regionAt(x,y);if(r.t!==S.t||r.c!==S.c||r.name!==S.name)bad.region.push(at);
  if(t.fieldSizeFor(200,r,null)!==t.fieldSizeFor(200,S,null)||t.fieldSizeFor(40,r,'ambush')!==t.fieldSizeFor(40,S,'ambush'))bad.field.push(at);
  const ob=GEN?genBridge(tx,ty,t.BTYPE_WORLD.near):oldBridge(tx,ty);if(ob!==t.bridgeNear(tx,ty)||ob!==t.bridgeNear(tx,ty,S))bad.bridge.push(at);
  {const e={kind:'party',band:'bandits',mine:true};if(J(GEN?genType(e,S):oldType(e))!==J(t.battleTypeFor(e)))bad.type.push(at)}
  if(strip(oldCoverPre(x,y),S)!==strip(newCoverPre(x,y),S))bad.cover.push(at);
  if(GEN&&S.river)gs.river++;if(GEN&&S.t===T_ROAD){gs.road++;const e=t.battleTypeFor({kind:'party',band:'bandits'});if(e&&e.kind==='bridge')gs.held++}
  const g=JSON.parse(g2);rec[g.recipe]=(rec[g.recipe]||0)+1;if(g.river&&g.river.bridge)br++;if(g.elven)elv++;if(g.road)rd++}
 const say=k=>bad[k].length?' (differ at '+bad[k].length+': '+bad[k].slice(0,5).join(' ')+')':'';
 ok(!bad.env.length,'battleEnv through the site equals today\'s on all '+N+' tiles (t, c, name, text)'+say('env'));
 ok(!bad.spec.length&&fp1===fp2,'the ground spec through the site (recipe, seed, river, edges, road, oasis, elven, forest) equals today\'s on all '+N+' tiles: fingerprint '+fp1.toString(16)+' = '+fp2.toString(16)+say('spec'));
 info('recipes over the map: '+Object.entries(rec).map(([k,v])=>k+' '+v).join(', ')+'; rivers with a bridge '+br+', elven woods '+elv+', road tiles '+rd);
 ok(!bad.other.length,'with a test\'s own ground (8 climates and kinds by turns) the site gives today\'s spec on every tile'+say('other'));
 ok(!bad.region.length&&!bad.field.length,'the field size reads the site\'s kind and climate, as regionAt\'s, on every tile (the same size at 200 heads, and an ambush\'s at 40)'+say('region')+say('field'));
 ok(!bad.bridge.length,'bridgeNear (Hold the bridge) through the site equals today\'s road-bridge scan on every tile'+say('bridge'));
 ok(!bad.type.length,'the battle type you ride into (a held bridge or none) through the site equals today\'s on every tile'+say('type'));
 ok(!bad.cover.length,'cover for an ambush: forest, hills, or the ground run for woods and rock, the same input as today\'s on every tile'+say('cover'));
 // (the field run for its cover: a spread of tiles, today's and the site's; the generated world's tiles with a river or high ground
 // of their own are not today's fields)
 {const n=Math.ceil(N/24);let diff=0;for(let i=7;i<N;i+=n){const tx=i%MW,ty=Math.floor(i/MW),x=(tx+.5)*TILE,y=(ty+.5)*TILE;P.x=x;P.y=y;const S=t.WM.battleSite(tx,ty);if(GEN&&(S.river||S.high))continue;const a=oldCover(x,y),b=t.coverAt(x,y);if(a!==b)diff++;if(b)cv++}
  ok(!diff,'coverAt on 24 tiles spread over the map, the field run: today\'s answer each time ('+cv+' with cover)')}
 if(GEN){info('the generated world: '+gs.river+' tiles with a river field; of '+gs.road+' road tiles, '+gs.held+' a Hold the bridge fight');
  ok(gs.held<=.25*gs.road,'Hold the bridge on the generated world\'s roads: '+(100*gs.held/Math.max(1,gs.road)).toFixed(1)+'% of their tiles, at most 25%')}
 P.x=px;P.y=py;G.enc=enc;t.TERRAIN.on=on;
 // ---- the site's shape: today's values, the slots empty, the classic world's salt 0 and in the seed
 {const S=t.WM.battleSite(10,10),keys='tx ty t c name kinds clims road bridge elven salt river crossing season region deep elev terrace rough high cliff'.split(' ');
  ok(keys.every(k=>k in S)&&Object.keys(S).length===keys.length&&S.kinds.length===9&&S.clims.length===9,'a BattleSite: '+Object.keys(S).join(', '));
  if(!GEN)ok(['river','crossing','season','region','deep','elev','terrace','rough','high','cliff'].every(k=>S[k]===null)&&t.WM.salt===0&&S.salt===0,'its later slots (river, crossing, season, region, deep forest, elevation, terrace, roughness, high ground, cliff) are empty, and the classic world\'s salt is 0');
  else{const m=t.WM,bad2=[];let nr=0,nx=0,nh=0;for(let i=0;i<N;i+=7){const tx=i%MW,ty=Math.floor(i/MW),q=m.battleSite(tx,ty),h=m.high[i]&3;let w=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if(m.has(tx+a,ty+b))w=Math.max(w,m.river[(ty+b)*MW+tx+a]&3);
    if(q.river)nr++;if(q.crossing)nx++;if(q.high)nh++;
    const hb=h?!q.high||q.high.kind!==['','rise','steep','cliffed'][h]||q.high.scree!==!!(m.high[i]&32)||q.high.mixed!==!!(m.high[i]&64)||q.high.mixed!==(q.high.shoulder!=null):q.high!==null;
    if(['season','region','deep','cliff'].some(k=>q[k]!==null)||q.elev!==m.elev[i]||q.terrace!==Math.max(0,Math.min(3,(m.elev[i]-64)>>5))||q.rough!==m.rough[i]||(w?!q.river||q.river.w!==w:q.river!==null)||hb||q.crossing&&!(q.crossing.d<=t.WORLD_SCALE.battle.bridge))bad2.push(tx+','+ty)}
   ok(!bad2.length,'the generated world fills its sites (every 7th tile): river (the widest within 1 tile: '+nr+'), crossing (within '+t.WORLD_SCALE.battle.bridge+' tiles: '+nx+'), high ground ('+nh+', a mixed one\'s shoulder), elevation, terrace and roughness; season, region, deep and cliff empty'+(bad2.length?' (differ at '+bad2.length+': '+bad2.slice(0,5).join(' ')+')':''))}
  let fs=null;for(let i=0;i<N&&!fs;i+=13){const q=t.WM.battleSite(i%MW,Math.floor(i/MW));if(q.t===T_OPEN)fs=q}
  const env={c:fs.c,t:T_OPEN},a=t.terrainOf(fs,env),b=t.terrainOf({...fs,salt:1},env);
  ok(a.recipe===b.recipe&&J(a.edges)===J(b.edges)&&J(a.river)===J(b.river)&&a.seed!==b.seed,'another world\'s salt changes the field\'s seed, never its recipe, river or edges (D15)')}
 // ---- the reaches: from WORLD_SCALE.battle, wide enough for the battle's own
 {const R=t.WORLD_SCALE.battle;ok(R.elfR===10&&!('elfR' in t.TERRAIN_DENSE)&&R.bridge>=t.TERRAIN_RIVER.near&&R.bridge>=t.BTYPE_WORLD.near,'elven woods reach '+R.elfR+' tiles (WORLD_SCALE.battle, no longer TERRAIN_DENSE); the site sees road bridges '+R.bridge+' tiles off, as far as the river ('+t.TERRAIN_RIVER.near+') and Hold the bridge ('+t.BTYPE_WORLD.near+') look')}
 // ---- the old reads are gone: the battle's world-reading code reads the site only
 {const world=/\b(tAt|terrAt|climAt|regionAt|tiles|climate|TOWNS|MW|MH)\b/,fns={battleEnv:t.battleEnv,terrainOf:t.terrainOf,terrainEdges:t.terrainEdges,groundSpecFor:t.groundSpecFor,
   bridgeNear:t.bridgeNear,coverAt:t.coverAt,battleTypeFor:t.battleTypeFor,fieldSizeFor:t.fieldSizeFor,'BattleSetup.fieldSize':t.BattleSetup.prototype.fieldSize,
   'BattleSetup.survey':t.BattleSetup.prototype.survey,'LabBattleSetup.createUnits':t.LabBattleSetup.prototype.createUnits,'LabBattleSetup.fieldSize':t.LabBattleSetup.prototype.fieldSize};
  const left=Object.keys(fns).filter(k=>world.test(String(fns[k])));ok(!left.length,'none of '+Object.keys(fns).length+' battle functions reads the world but through the site'+(left.length?': '+left.join(', '):''))}
 // ---- the lab's own site: its terrain and climate as a tile's, amid its own kind; its field size as today's
 {const c={terrain:'forest',climate:'frost',leftGroups:[{type:'hum_foot',count:40}],rightGroups:[{type:'militia',count:40}]},S=t.labSite(c),L=new t.LabBattleSetup(c);
  ok(S.t===T_FOREST&&S.c==='frost'&&S.name==='Battle laboratory'&&S.kinds.every(k=>k===T_FOREST)&&S.clims.every(k=>k==='frost')&&S.bridge===null&&S.road===null&&L.battleSite().t===T_FOREST,'the lab builds its own site (labSite): a frost forest amid frost forest, no road or bridge');
  const on2=t.FIELD_SIZES.on;t.FIELD_SIZES.on=true;const k=L.fieldSize(),k0=t.fieldSizeFor(80,{t:T_FOREST,c:'frost'},null);t.FIELD_SIZES.on=on2;ok(k===k0,'its field size from its site: '+k+', as today\'s')}
 // ---- World Phase 2: BattleSite's new fields into the battle (sites made here, as a generated world's tiles would have them)
 {const K=t.TKIND,R0={w:1,dir:2,nav:false,delta:false,flood:false,name:'Test',seasonal:null},env={c:'grass',t:T_OPEN},W=1100;
  const site=o=>t.battleSiteOf({tx:41,ty:57,t:T_OPEN,c:'grass',...o}),spec=S=>t.terrainOf(S,env),build=(S,k=0)=>t.buildTerrain({...spec(S),seed:spec(S).seed+k,W});
  const rows=T0=>{const v=T0.recipe.river,out=[];for(let r=0;r<T0.R;r++){if(v.crossings.some(c=>(r+.5)*T0.cs>=c.y0-16&&(r+.5)*T0.cs<c.y1+16))continue;let n=0;for(let c=0;c<T0.C;c++)if(T0.kind[r*T0.C+c]===K.deep)n++;if(n)out.push(n)}return out};
  // (width: 1, 2, 3 to 24, 40, 64 px of half-water, 3, 5, 8 cells of deep water a row; a river with no world width keeps 24)
  {const got=[1,2,3].map(w=>{const T0=build(site({river:{...R0,w},crossing:{kind:'ford',d:1,stone:false,toll:null}}));return[T0.recipe.river.half,[...new Set(rows(T0))].join('/'),T0.recipe.river.w]});
   const g0=spec(site({}));ok(J(got.map(g=>g[0]))==='[24,40,64]'&&J(got.map(g=>g[1]))==='["3","5","8"]'&&got.every((g,i)=>g[2]===i+1)&&!('wr' in g0)&&!('high' in g0),'a world river\'s width 1, 2, 3: '+got.map(g=>g[0]+' px half-water, '+g[1]+' cells deep a row').join('; ')+'; a site with no world river adds nothing to the spec')}
  // (the crossing: the world's bridge (stone or wood) with a ford; a ford's river fords only; a ferry's one ford; none near: fords)
  {const by=x=>{const S=site({river:{...R0,w:2},...(x?{crossing:{d:1,toll:null,stone:false,...x}}:{})});return[spec(S),build(S)]};
   const [sb,Tb]=by({kind:'bridge',stone:true}),[sw,Tw]=by({kind:'bridge',stone:false}),[sf,Tf]=by({kind:'ford'}),[sx,Tx]=by({kind:'ferry'}),[sn,Tn]=by(null),ks=T0=>T0.recipe.river.crossings.map(c=>c.kind).join(',');
   ok(sb.river.bridge&&sb.wr.stone===true&&ks(Tb)==='bridge,ford'||ks(Tb)==='ford,bridge','the world\'s bridge: a bridge and a ford on the field ('+ks(Tb)+'), its make stone ('+Tb.recipe.river.stone+'), a wooden one wood ('+Tw.recipe.river.stone+')');
   ok(Tb.recipe.river.stone===true&&Tw.recipe.river.stone===false&&/stone bridge/.test(Tb.recipe.text)&&/wooden bridge/.test(Tw.recipe.text)&&/broad river/.test(Tb.recipe.text),'the words: "'+Tb.recipe.text.split('.')[0]+'"; "'+Tw.recipe.text.split('.')[0]+'"');
   ok(!sf.river.bridge&&/^ford(,ford)?$/.test(ks(Tf))&&!sn.river.bridge&&/^ford(,ford)?$/.test(ks(Tn)),'a ford\'s river has fords only ('+ks(Tf)+'), as one with no crossing near ('+ks(Tn)+')');
   ok(sx.river.ferry&&ks(Tx)==='ford'&&/ferry/.test(Tx.recipe.text),'a ferry\'s river: one ford, at its landing ('+ks(Tx)+')');
   let fair=0;for(const x of [{kind:'bridge',stone:true},{kind:'ford'},{kind:'ferry'}])for(const w of [1,2,3])for(let k=0;k<4;k++){const T0=build(site({river:{...R0,w},crossing:{d:0,toll:null,stone:false,...x}}),k*7919);if(T0.has.water&&T0.fair(W,t.FIELD_EDGE.top,t.BH-t.FIELD_EDGE.bot).ok&&!T0.recipe.dropped.includes('rivers'))fair++}
   ok(fair===36,'every crossing at every width keeps its river and a fair field ('+fair+' of 36: deployment zones dry, crossings wide and near the middle, both sides reach each other)')}
  // (a delta's and a floodplain's wet ground: marsh beside the water, never in a zone or the open lane)
  {const cnt=T0=>{let n=0;for(let i=0;i<T0.kind.length;i++)if(T0.kind[i]===K.marsh)n++;return n};let dry=0,fl=0,de=0,inZ=0,ok2=0;
   for(let k=0;k<6;k++){const S0=site({tx:41+k,river:{...R0,w:2},crossing:{kind:'ford',d:1,stone:false,toll:null}}),Td=build({...S0,river:{...S0.river,delta:true}}),Tf=build({...S0,river:{...S0.river,flood:true}}),Tp=build(S0);
    dry+=cnt(Tp);fl+=cnt(Tf);de+=cnt(Td);for(const T0 of [Td,Tf]){if(T0.fair(W,t.FIELD_EDGE.top,t.BH-t.FIELD_EDGE.bot).ok)ok2++;for(let i=0;i<T0.kind.length;i++)if(T0.kind[i]===K.marsh){const x=(i%T0.C+.5)*T0.cs;if(x<t.TERRAIN.zone*W||x>(1-t.TERRAIN.zone)*W)inZ++}}}
   ok(fl>dry+40&&de>fl&&!inZ&&ok2===12,'a floodplain lays marsh beside the river ('+fl+' cells over 6 fields, '+dry+' without), a delta more with its channels ('+de+'); none in a deployment zone; every field fair ('+ok2+' of 12)')}
  // (high ground: rise, no cliffs; cliffed, cliffs always; steep, steep hills (B.terrain.steep); none, the recipe's chances)
  {const envH={c:'grass',t:T_HILL},hs=(kind,k,x={})=>t.buildTerrain({...t.terrainOf(site({tx:60+k,ty:30+k,t:T_HILL,high:{kind,up:0,scree:false,mixed:false,shoulder:null,...x}}),envH),W}),N0=24;let rise=0,clf=0,stp=0,none=0,scr=0,shd=0;
   for(let k=0;k<N0;k++){if(hs('rise',k).wall)rise++;const Tc=hs('cliffed',k);if(Tc.wall||Tc.recipe.dropped.includes('cliffs')||!Tc.recipe.hills.some(h=>!h.low))clf++;
    const Ts=hs('steep',k,{scree:k%2===0,mixed:k%3===0,shoulder:k%3===0?2:null});if(Ts.steep&&!Ts.wall&&Ts.recipe.hills.some(h=>h.steep)&&Ts.ai.tops.some(h=>h.steep)||!Ts.recipe.hills.some(h=>!h.low)||Ts.recipe.dropped.includes('hills'))stp++;
    if(Ts.steep&&k%2===0&&Ts.steep.some(v=>v&4))scr++;if(Ts.steep&&k%3===0&&Ts.recipe.hills.some(h=>h.steep&&h.shoulder!=null))shd++;
    if(t.buildTerrain({...t.terrainOf(site({tx:60+k,ty:30+k,t:T_HILL}),envH),W}).wall)none++}
   ok(rise===0&&clf===N0&&stp===N0&&scr===12&&shd===8,'the world\'s high ground as layouts over '+N0+' hill fields: rises never cliffed ('+rise+'), cliffed always ('+clf+'), steep hills steep and never cliffed ('+stp+'), scree laid ('+scr+' of 12), a mixed one\'s shoulder ('+shd+' of 8); with none the recipe\'s chance ('+none+' cliffed)')}
  // (the lab's site: river width, crossing and high ground as a generated world's tile)
  {const c={terrain:'hill',climate:'grass',site:{river:{w:3},crossing:{kind:'bridge',stone:true},high:{kind:'steep',scree:true}},leftGroups:[{type:'hum_foot',count:4}],rightGroups:[{type:'militia',count:4}],ground:'auto',seed:5},S=t.labSite(c),L=new t.LabBattleSetup(c);
   L.site=S;L.env={c:S.c,t:S.t};const g=L.groundSpec(),g0=new t.LabBattleSetup({...c,site:undefined});g0.site=t.labSite({...c,site:undefined});g0.env={c:'grass',t:T_HILL};const h0=g0.groundSpec();
   ok(S.river.w===3&&S.crossing.kind==='bridge'&&S.high.kind==='steep'&&g.river&&g.river.bridge&&g.wr.w===3&&g.wr.stone===true&&g.high.kind==='steep'&&g.high.scree&&!('wr' in h0)&&!('high' in h0)&&!h0.river,'the lab takes a site (labSite: river width, crossing, high ground) into its ground as the world\'s; without one, its ground as before')}}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
