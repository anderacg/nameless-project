'use strict';
// The BattleSite hand-off (doc/WORLD_DESIGN.md R17): on every tile of the classic world the battle's inputs read through
// WorldMap.battleSite (its env, ground spec: recipe, seed, river, edges, road, elven; its type's bridge, its field size, its cover)
// equal today's direct reads of the world (kept below as they were); the battle's world-reading code reads only the site; the
// lab makes its own; the empty slots are there, and the world's salt goes into the field's seed.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,P=t.P,G=t.G,TILE=t.TILE,MW=t.MW,MH=t.MH,tAt=t.tAt,climAt=t.climAt,{T_OPEN,T_FOREST,T_HILL,T_WATER,T_ROAD,T_MOUNT}=t;
 // ---- today's direct reads (as setup.js, terrain.js and encounters.js read the world before R17)
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
 const bad={env:[],spec:[],other:[],region:[],bridge:[],type:[],cover:[],field:[]},N=MW*MH;let fp1=0,fp2=0,rec={},br=0,elv=0,rd=0,cv=0;
 const mix=(h,s)=>{for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return h};
 for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){const x=(tx+.5)*TILE,y=(ty+.5)*TILE,at=tx+','+ty;P.x=x;P.y=y;
  const S=t.WM.battleSite(tx,ty),e0=oldEnv(),e1=t.battleEnv(false),e2=t.battleEnv(false,S);
  if(J(e0)!==J(e1)||J(e0)!==J(e2))bad.env.push(at);
  const g0=J(oldAt(x,y,e0)),g1=J(t.terrainAt(x,y,e1)),g2=J(t.groundSpecFor({},e2,S));fp1=mix(fp1,g0);fp2=mix(fp2,g2);
  if(g0!==g1||g0!==g2)bad.spec.push(at);
  const E=ENVS[(tx+ty)%ENVS.length];if(J(oldAt(x,y,E))!==J(t.terrainOf(S,E)))bad.other.push(at);// (a test's own ground on this tile)
  const r=t.regionAt(x,y);if(r.t!==S.t||r.c!==S.c||r.name!==S.name)bad.region.push(at);
  if(t.fieldSizeFor(200,r,null)!==t.fieldSizeFor(200,S,null)||t.fieldSizeFor(40,r,'ambush')!==t.fieldSizeFor(40,S,'ambush'))bad.field.push(at);
  if(oldBridge(tx,ty)!==t.bridgeNear(tx,ty)||oldBridge(tx,ty)!==t.bridgeNear(tx,ty,S))bad.bridge.push(at);
  {const e={kind:'party',band:'bandits',mine:true};if(J(oldType(e))!==J(t.battleTypeFor(e)))bad.type.push(at)}
  if(oldCoverPre(x,y)!==newCoverPre(x,y))bad.cover.push(at);
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
 // (the field run for its cover: a spread of tiles, today's and the site's)
 {const n=Math.ceil(N/24);let diff=0;for(let i=7;i<N;i+=n){const tx=i%MW,ty=Math.floor(i/MW),x=(tx+.5)*TILE,y=(ty+.5)*TILE;P.x=x;P.y=y;const a=oldCover(x,y),b=t.coverAt(x,y);if(a!==b)diff++;if(b)cv++}
  ok(!diff,'coverAt on 24 tiles spread over the map, the field run: today\'s answer each time ('+cv+' with cover)')}
 P.x=px;P.y=py;G.enc=enc;t.TERRAIN.on=on;
 // ---- the site's shape: today's values, the slots empty, the classic world's salt 0 and in the seed
 {const S=t.WM.battleSite(10,10),keys='tx ty t c name kinds clims road bridge elven salt river season region deep elev terrace cliff'.split(' ');
  ok(keys.every(k=>k in S)&&Object.keys(S).length===keys.length&&S.kinds.length===9&&S.clims.length===9,'a BattleSite: '+Object.keys(S).join(', '));
  ok(['river','season','region','deep','elev','terrace','cliff'].every(k=>S[k]===null)&&t.WM.salt===0&&S.salt===0,'its later slots (river, season, region, deep forest, elevation, terrace, cliff) are empty, and the classic world\'s salt is 0');
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
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
