'use strict';
window.ARENA=true;// (the battle screen's own rules, on its own field: tests/harness.js)
// Field variety (battle/terrain.js; doc/TERRAIN_DESIGN.md "Field variety as built"): battlefields reflect the world map. A forest
// tile is a real forest (woods over 50-65% of the field at every field size, a glade for each army, a road, deer path or chain of
// clearings through, fair by cover and open ground); every tile kind has its signature (plains, hills, peaks, swamp, desert,
// frost); the neighbours shape the edges; the same tile gives the same field and other tiles of a kind vary; generation time by
// field size; never Math.random. Field sizes are given to buildTerrain as {W, H, top, bot} (H: the field's height, BH by default:
// the join with the field-size work); with the field sizes on (setup.js FIELD_SIZES, turned on for its own block) the ground is built
// at the chosen size and keeps to its deployment zones (fieldZone): forests at every size, a lab battle at each, the typed fields at
// theirs. TERRAIN.on is turned on here (tests/harness.js turns it off).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,L=t.BattleLab,ev=s=>(0,eval)(s),K=t.TKIND,DT=t.TERRAIN_DENSE,TR=t.TERRAIN;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;ev('TERRAIN.on=true');
 // (the playable rows' share of a kind, a band's share, a grid's hash)
 const rows=(T0,top,bot)=>[Math.max(0,Math.floor(top/T0.cs)),Math.min(T0.R-1,Math.floor((bot-1)/T0.cs))];
 const share=(T0,top,bot,k,f)=>{const [r0,r1]=rows(T0,top,bot);let n=0,a=0;for(let r=r0;r<=r1;r++)for(let c=0;c<T0.C;c++){const x=(c+.5)*T0.cs,y=(r+.5)*T0.cs;if(f&&!f(x,y))continue;a++;if(T0.kind[r*T0.C+c]===k)n++}return a?n/a:0};
 const gridHash=T0=>{let h=2166136261;const mix=v=>{h=Math.imul(h^(v&255),16777619)>>>0};for(const a of [T0.kind,T0.lvl,T0.up])for(const v of a)mix(v);return h.toString(16)};
 // the planned field sizes: today's (the lab's short field and the full one), big, large, very large, huge
 const SIZES=[['today',1100,600,40,560],['short',960,600,140,430],['big',1600,900,40,860],['large',2000,1200,40,1160],['very large',2400,1500,40,1460],['huge',3200,1800,40,1760]];
 // ---- forest: 50-65% woods at every size, a glade for each army, a way through, fair
 {const bad=[],covs={};let n=0,ways={road:0,path:0,chain:0},drop=0;
  for(const [name,W,H,top,bot] of SIZES){const cv=[];for(let s=1;s<=10;s++){for(const v of [{},{frost:true},{elven:true},{river:{bridge:true}},{road:{ew:true,ns:s%2===0}}]){const sp={recipe:'forest',seed:(s*2654435761+name.length*97)>>>0,W,H,top,bot,...v},T0=t.buildTerrain(sp),f=t.terrainFair(T0,W,top,bot),w=share(T0,top,bot,K.wood);n++;cv.push(w);
     if(T0.recipe.dropped.length)drop++;const D=T0.recipe.dense;if(D)for(const wy of D.ways)ways[wy.kind]++;
     if(!D||w<.5||w>.65||!f.ok)bad.push(name+'#'+s+JSON.stringify(v)+' wood '+(w*100).toFixed(0)+'%'+(f.ok?'':' unfair '+JSON.stringify({zone:f.zone,score:f.score,way:f.way,river:f.river,reach:f.reach,glade:f.glade})))}}
   covs[name]=Math.round(Math.min(...cv)*100)+'-'+Math.round(Math.max(...cv)*100)+'%'}
  ok(!bad.length,'forest tiles: woods over 50-65% of the field at every planned size, fair, '+n+' fields (plain, frost, elven, a river, a road): '+Object.entries(covs).map(([k,v])=>k+' '+v).join(', ')+(bad.length?'; '+bad.slice(0,4).join('; '):''));
  ok(drop===0,'no forest field had to drop a feature to be fair ('+drop+')');
  ok(ways.road>0&&ways.path>0&&ways.chain>0,'the ways through: roads (a road tile) '+ways.road+', deer paths '+ways.path+', chains of clearings '+ways.chain)}
 // ---- the glades, the fairness numbers, reach (route.js reachable)
 {const W=1100,top=40,bot=560,z=TR.zone*W,mid=(top+bot)/2;let worst={c:0,o:0,s:0},bad=[];
  for(let s=0;s<40;s++){const T0=t.buildTerrain({recipe:'forest',seed:(s*40503+5)>>>0,W,top,bot}),f=t.terrainFair(T0,W,top,bot),D=T0.recipe.dense,g=T0.route.foot;
   const gl=D.glades.every(q=>{const y=Math.round(q.y);return T0.kind[t.tIx(T0,q.x,y)]===0}),zd=Math.abs(f.cover[0]-f.cover[1]),od=Math.abs(f.open[0]-f.open[1]),sd=Math.abs(f.scores[0]-f.scores[1])/Math.max(f.scores[0],f.scores[1]);
   worst={c:Math.max(worst.c,zd),o:Math.max(worst.o,od),s:Math.max(worst.s,sd)};
   const reach=t.reachable(g,z/2,mid,W-z/2,mid)&&t.reachable(g,W-z/2,mid,z/2,mid);
   if(!gl||!f.glade||!f.way||!reach||zd>DT.fair||od>DT.fair||sd>TR.score||f.cover.some(c=>!(c>.1)))bad.push(s+(gl?'':' glade')+(f.way?'':' way')+(reach?'':' reach')+' cover '+f.cover.map(v=>v.toFixed(2))+' open '+f.open.map(v=>v.toFixed(2)))}
  ok(!bad.length,'40 forests: each army’s glade open (the middle and '+DT.keep*100+'% of its heart), woods in both zones (some cover each side), the zones’ cover within '+DT.fair*100+' points (worst '+(worst.c*100).toFixed(1)+') and open ground within '+DT.fair*100+' (worst '+(worst.o*100).toFixed(1)+'), the halves within '+TR.score*100+'% (worst '+(worst.s*100).toFixed(1)+'%), an open way glade to glade, each zone reaching the other'+(bad.length?': '+bad.slice(0,4).join('; '):''))}
 // ---- every tile kind's signature
 {const W=1100,top=40,bot=560,N=24,run=(sp)=>Array.from({length:N},(_,s)=>t.buildTerrain({W,top,bot,seed:(s*2246822519+13)>>>0,...sp}));
  const pl=run({recipe:'open'}),hi=run({recipe:'hills'}),pk=run({recipe:'peaks'}),sw=run({recipe:'swamp'}),de=run({recipe:'desert'}),fr=run({recipe:'open',frost:true,river:{frozen:true}}),mw=run({recipe:'swamp',forest:true});
  const open=T0=>1-share(T0,top,bot,K.wood)-share(T0,top,bot,K.marsh)-share(T0,top,bot,K.rock),avg=(L,f)=>L.reduce((a,T0)=>a+f(T0),0)/L.length;
  ok(pl.every(T0=>open(T0)>=.85&&T0.lvl.every(v=>v<=1)),'plains: wide open ground (at least 85% open on every field; mean '+(avg(pl,open)*100).toFixed(0)+'%), copses and low rises only (no level 2)');
  const hl=hi.filter(T0=>T0.has.hills).length,h2=hi.filter(T0=>T0.lvl.includes(2)).length,hc=hi.filter(T0=>T0.has.cliff).length;
  ok(hl===N&&h2>=N*.8&&hc>=N*.35,'hills: terraces on every field ('+hl+'/'+N+'), level 2 on '+h2+', cliffs and ramps on '+hc+' (sheer or one-way: '+Math.round((t.TERRAIN_RECIPE.hills.cliff[0]+t.TERRAIN_RECIPE.hills.cliff[1])*100)+'% chance)');
  const pr=pk.filter(T0=>T0.has.rock).length,pass=pk.filter(T0=>T0.recipe.layout==='pass'),pe=pass.filter(T0=>{const R=T0.recipe.rocks;return R.some(p=>p.y<(top+bot)/2-100)&&R.some(p=>p.y>(top+bot)/2+100)}).length;
  ok(pr>=N*.8&&pass.length>0&&pe>=pass.length*.8,'peaks (a hill among the peaks): rock on '+pr+'/'+N+' fields; a pass, mountains along both edges with the valley between, on '+pe+'/'+pass.length+' pass fields');
  const sm=sw.filter(T0=>T0.has.marsh).length,fen=sw.filter(T0=>T0.recipe.layout==='fen'),fm=fen.length?Math.min(...fen.map(T0=>share(T0,top,bot,K.marsh))):0,isl=fen.filter(T0=>T0.recipe.hills.some(h=>h.low)).length;
  ok(sm>=N-1&&fen.length>0&&fm>=.25&&isl===fen.length,'swamp: marsh on '+sm+'/'+N+'; a fen ('+fen.length+') is a quarter marsh at least (least '+(fm*100).toFixed(0)+'%) with dry islands');
  const mws=avg(mw,T0=>share(T0,top,bot,K.wood)),mms=avg(mw,T0=>share(T0,top,bot,K.marsh));
  ok(mw.every(T0=>T0.recipe.layout==='mirewood'&&T0.recipe.dense)&&mws>=.35&&mms>=.1,'a forest in the swamp is the mire wood: woods '+(mws*100).toFixed(0)+'% and marsh '+(mms*100).toFixed(0)+'% mixed');
  const dw=de.filter(T0=>T0.has.wood||T0.has.marsh||T0.has.water).length,dsig=de.filter(T0=>T0.has.hills||T0.has.rock).length;
  ok(dw===0&&dsig>=N*.6,'desert: no woods, marsh or water of its own (an oasis only by water); dunes or rock spires on '+dsig+'/'+N);
  ok(fr.every(T0=>T0.has.water&&!T0.kind.includes(K.deep)&&T0.recipe.river.frozen)&&/frozen river/.test(fr[0].recipe.text),'frost: a frozen river is ice, crossed anywhere (no deep water): '+fr[0].recipe.text.split('.')[0]);
  const fl=new Set(run({recipe:'open',frost:true}).map(T0=>T0.recipe.layout));ok(fl.has('snowwood'),'frost plains have their own layouts, snowy copses among them: '+[...fl].join(', '));
  // the world: frost tiles with no water near get a frozen river at TERRAIN_RIVER.frostP; a hill among peaks is a pass
  let fz=0,fn=0,pkT=0;for(let i=0;i<t.MW*t.MH;i+=7){const tx=i%t.MW,ty=Math.floor(i/t.MW),k=t.tiles[i];if(k===t.T_WATER||k===t.T_MOUNT)continue;const env={c:t.CLIMS[t.climate[i]],t:k===t.T_ROAD?t.T_OPEN:k};const g=t.terrainAt((tx+.5)*t.TILE,(ty+.5)*t.TILE,env);
   if(env.c==='frost'&&g.recipe!=='desert'){let w=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(t.tAt(tx+dx,ty+dy)===t.T_WATER)w=true;if(!w){fn++;if(g.river&&g.river.frozen)fz++}}if(g.recipe==='peaks')pkT++}
  ok(fn>0&&Math.abs(fz/fn-t.TERRAIN_RIVER.frostP)<.12,'the world: '+fz+'/'+fn+' frost tiles away from water have a frozen river (frostP '+t.TERRAIN_RIVER.frostP+')');info('hill tiles among the peaks (the pass recipe) on the map, every 7th tile: '+pkT)}
 // ---- roads: a road tile's road crosses the field, a little faster; a deer path in a forest is open ground only
 {const W=1100,top=40,bot=560,F=t.buildTerrain({recipe:'forest',seed:77,W,top,bot,road:{ew:true}}),O=t.buildTerrain({recipe:'open',seed:77,W,top,bot,road:{ew:true,ns:true}}),N0=t.buildTerrain({recipe:'open',seed:77,W,top,bot});
  const across=T0=>{for(const c of [1,Math.floor(T0.C/2),T0.C-2]){let any=false;for(let r=0;r<T0.R;r++)if(T0.road[r*T0.C+c]===1)any=true;if(!any)return false}return true};
  ok(F.road&&across(F)&&O.road&&across(O)&&!N0.road&&F.recipe.road&&/road runs through/.test(F.recipe.text)&&/road across the field/.test(O.recipe.text),'a road tile: a road edge to edge, through the woods too ('+F.recipe.text.split('.')[0]+'); none elsewhere');
  ok([...F.road.keys()].every(i=>!F.road[i]||F.kind[i]===0||F.kind[i]===K.bridge),'a road is open ground (no wood, marsh or water on it)');
  // (laid like a real road since: it may go round what lies in the middle, within the field's middle half)
  let nsOk=false,miss=-1;for(let r=0;r<O.R;r++){let a=false;for(let c=Math.floor(O.C*.25);c<O.C*.75;c++)if(O.road[r*O.C+c]===1)a=true;nsOk=a;if(!a){miss=r;break}}ok(nsOk,'a road that goes on north or south crosses the field that way too (a road cell in every row, in the middle half'+(nsOk?')':'; none in row '+miss+')'));
  const save=t.B;ev('B={terrain:null}');t.B.terrain=F;const i=F.road.indexOf(1),u={x:(i%F.C+.5)*F.cs,y:(Math.floor(i/F.C)+.5)*F.cs,s:{},unit:null};const m=t.groundMul(u,1,0);ev('B=null');if(save)ev('B=T.__saveB');
  ok(Math.abs(m-t.TERRAIN_ROAD.spd)<1e-9,'on the road men go ×'+t.TERRAIN_ROAD.spd+' ('+m+')')}
 // ---- the neighbours shape the edges
 {const W=1100,top=40,bot=560,fh=bot-top,N=12,band=(T0,k,y0,y1)=>share(T0,top,bot,k,(x,y)=>y>=y0&&y<y1),lv=(T0,y0,y1)=>{const [r0,r1]=rows(T0,top,bot);let a=0,n=0;for(let r=r0;r<=r1;r++){const y=(r+.5)*T0.cs;if(y<y0||y>=y1)continue;for(let c=0;c<T0.C;c++){n++;if(T0.lvl[r*T0.C+c])a++}}return a/n};
  const runE=(rc,e)=>Array.from({length:N},(_,s)=>t.buildTerrain({recipe:rc,seed:(s*97+3)>>>0,W,top,bot,edges:e,layout:rc==='open'?'plain':undefined}));
  const nf=runE('open',{n:'forest'}),sh=runE('open',{s:'hills'}),np=runE('open',{n:'peaks'}),fo=runE('forest',{s:'open'}),we=runE('open',{w:'forest'});
  const top4=top+fh*.25,bot4=bot-fh*.25,avg=(L,f)=>L.reduce((a,T0)=>a+f(T0),0)/L.length;
  const a=avg(nf,T0=>band(T0,K.wood,top,top4)),b=avg(nf,T0=>band(T0,K.wood,bot4,bot));ok(a>=.25&&a>b*3,'a forest to the north: woods along the north edge ('+(a*100).toFixed(0)+'% of its quarter, the south '+(b*100).toFixed(0)+'%): '+nf[0].recipe.text.split('.')[0]);
  const c=avg(sh,T0=>lv(T0,bot4,bot)),d=avg(sh,T0=>lv(T0,top,top4));ok(c>=.3&&c>d*3,'hills to the south: a ridge along the south edge ('+(c*100).toFixed(0)+'% high ground in its quarter, the north '+(d*100).toFixed(0)+'%)');
  const pn=np.filter(T0=>T0.recipe.rocks.some(p=>p.edge==='n')).length;ok(pn>=N*.75&&np.every(T0=>t.terrainFair(T0,W,top,bot).ok),'peaks to the north: crags along the north edge on '+pn+'/'+N+' fields, every one fair (none in a zone or the lane)');
  const e=avg(fo,T0=>band(T0,K.wood,bot4,bot)),f=avg(fo,T0=>band(T0,K.wood,top,top4));ok(e<f-.08&&fo.every(T0=>share(T0,top,bot,K.wood)>=.5),'a forest with open land to the south thins toward it ('+(e*100).toFixed(0)+'% woods in the south quarter, '+(f*100).toFixed(0)+'% in the north) and stays a forest');
  const L0=avg(we,T0=>share(T0,top,bot,K.wood,(x,y)=>x<W*.3)),R0=avg(we,T0=>share(T0,top,bot,K.wood,(x,y)=>x>W*.7));ok(L0>.03&&Math.abs(L0-R0)<.03&&we.every(T0=>t.terrainFair(T0,W,top,bot).ok),'a forest to the west: woods at both ends alike (west '+(L0*100).toFixed(1)+'%, east '+(R0*100).toFixed(1)+'%: neither army favoured), every field fair');
  // from the world: a tile with a forest to its north
  // (an open tile whose only forest neighbour is due north: an open field (3 forest tiles round make a forest's)
  let hit=null;for(let i=0;i<t.MW*t.MH&&!hit;i++){const tx=i%t.MW,ty=Math.floor(i/t.MW);if(t.tiles[i]!==t.T_OPEN||t.CLIMS[t.climate[i]]!=='grass')continue;let nf=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&t.tAt(tx+dx,ty+dy)===t.T_FOREST)nf++;if(nf===1&&t.tAt(tx,ty-1)===t.T_FOREST)hit={tx,ty}}
  if(hit){const g=t.terrainAt((hit.tx+.5)*t.TILE,(hit.ty+.5)*t.TILE,{c:'grass',t:t.T_OPEN});ok(g.recipe==='open'&&g.edges.n==='forest'&&!g.edges.s,'the world: an open tile ('+hit.tx+','+hit.ty+') with a forest due north gets edges '+JSON.stringify(g.edges))}else info('no open tile with a forest due north on this map')}
 // ---- same tile, same field; other tiles of a kind vary; never Math.random
 {let calls=0;const r0=Math.random;Math.random=()=>{calls++;return r0()};let tiles=[],a,b,c;
  try{for(let i=0;i<t.MW*t.MH&&tiles.length<40;i+=13)if(t.tiles[i]===t.T_FOREST&&t.CLIMS[t.climate[i]]==='grass')tiles.push({x:(i%t.MW+.5)*t.TILE,y:(Math.floor(i/t.MW)+.5)*t.TILE});
   const env={c:'grass',t:t.T_FOREST},sp=p=>({...t.terrainAt(p.x,p.y,env),W:1100,top:40,bot:560});a=t.buildTerrain(sp(tiles[0]));b=t.buildTerrain(sp({x:tiles[0].x+4,y:tiles[0].y-4}));c=t.buildTerrain(sp(tiles[1]));
   const lays=new Set(tiles.map(p=>t.buildTerrain(sp(p)).recipe.layout));
   ok(gridHash(a)===gridHash(b)&&gridHash(a)!==gridHash(c)&&a.recipe.dense,'the same forest tile gives the same field ('+gridHash(a)+'), another tile another ('+gridHash(c)+')');
   ok(lays.size>=3,'forest tiles vary: '+tiles.length+' tiles, layouts '+[...lays].join(', '));
   // (every layout but the empty plain one: 3 seeds, 3 fields)
   const all=Object.keys(t.TERRAIN_RECIPE).flatMap(rc=>t.terrainLayouts(rc).filter(l=>l!=='plain').map(l=>[rc,l])),same=[];for(const [rc,l] of all){const seen=new Set();for(let s=0;s<3;s++){const T0=t.buildTerrain({recipe:rc,seed:s+1,W:1100,top:40,bot:560,layout:l,forest:l==='mirewood',elven:l==='elvenwood'});seen.add(gridHash(T0))}if(seen.size<3)same.push(rc+':'+l)}
   ok(!same.length,'every layout of every recipe ('+all.length+', the empty plain aside) varies with the seed: 3 seeds, 3 fields'+(same.length?'; same: '+same.join(', '):''))}finally{Math.random=r0}
  ok(calls===0,'generation never draws Math.random: '+calls+' calls')}
 // ---- generation time per field size (dense forest, hills, the fen; each the median of 5)
 {const out=[],lim={today:10,short:10,big:20,large:30,'very large':45,huge:60};let over=[];
  for(const [name,W,H,top,bot] of SIZES){const ms=rc=>{const v=[];for(let s=0;s<5;s++){const t0=performance.now();t.buildTerrain({recipe:rc,seed:s*31+1,W,H,top,bot,layout:rc==='swamp'?'fen':undefined});v.push(performance.now()-t0)}v.sort((a,b)=>a-b);return v[2]};
   const f=ms('forest'),h=ms('hills'),s=ms('swamp');out.push(name+' '+W+'×'+H+': forest '+f.toFixed(1)+', hills '+h.toFixed(1)+', fen '+s.toFixed(1)+' ms');if(Math.max(f,h,s)>lim[name])over.push(name)}
  ok(!over.length,'generation time by field size (ms, under '+JSON.stringify(lim)+'): '+out.join('; ')+(over.length?'; over: '+over.join(', '):''))}
 // ---- the AI's reading of a dense field
 {const F=t.buildTerrain({recipe:'forest',seed:9,W:1100,top:40,bot:560}),A=F.ai;
  ok(A.dense&&A.glades.length>=2&&A.glades.filter(g=>g.half===0).length>=1&&A.glades.filter(g=>g.half===1).length>=1&&A.ways.length>=1&&A.woods.every(w=>w.box[2]-w.box[0]<=DT.block+1e-9),'ai: a dense field’s glades (both halves), ways and stands (each no wider than '+DT.block+' px; the great wood itself no patch to go round): '+A.glades.length+' glades, '+A.woods.length+' stands')}
 // ---- the lab key; terrain off is the flat field
 {const v=L.validate({ground:{recipe:'forest',layout:'elvenwood',edges:{n:'hills',w:'water'},road:'ns',elven:true,seed:3}}).ground;
  ok(v.layout==='elvenwood'&&v.edges.n==='hills'&&v.edges.w==='water'&&v.road==='ns'&&v.elven===true,'the lab ground key takes layout, edges, road and elven');
  let th=0;for(const g of [{recipe:'forest',layout:'pass'},{recipe:'open',edges:{x:'forest'}},{recipe:'open',edges:{n:'lava'}},{recipe:'open',road:'yes'}])try{L.validate({ground:g})}catch(e){th++}ok(th===4,'and refuses a layout not the recipe’s, a side or kind it does not know, a bad road ('+th+'/4)');
  G.mode='world';G.modal=false;L.start({leftGroups:[{type:'hum_foot',count:6}],rightGroups:[{type:'hum_foot',count:6}],terrain:'forest',climate:'grass',deploy:false,ai:false,paused:true,seed:4,ground:'auto'});
  const B1=t.B;ok(B1.terrain&&B1.terrain.recipe.dense&&B1.terrain.recipe.kind==='forest'&&share(B1.terrain,B1.ftop,B1.fbot,K.wood)>=.5,'a lab battle on forest ground (auto) is a dense forest: '+B1.terrain.recipe.text.split('.')[0]);L.exit();
  ev('TERRAIN.on=false');G.mode='world';G.modal=false;L.start({leftGroups:[{type:'hum_foot',count:6}],rightGroups:[{type:'hum_foot',count:6}],terrain:'forest',climate:'grass',deploy:false,ai:false,paused:true,seed:4,ground:'none'});
  ok(!t.B.terrain&&t.B.obs.length>0,'terrain off: the flat field and its scattered trees as ever');L.exit()}
 // ---- a world battle in a forest
 {ev('TERRAIN.on=true');let p=null;for(let i=0;i<t.MW*t.MH&&!p;i++)if(t.tiles[i]===t.T_FOREST&&t.CLIMS[t.climate[i]]==='grass'){const tx=i%t.MW,ty=Math.floor(i/t.MW);let w=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(t.tAt(tx+dx,ty+dy)===t.T_WATER)w++;if(!w)p={x:(tx+.5)*t.TILE,y:(ty+.5)*t.TILE}}
  const P=t.P;P.x=p.x;P.y=p.y;P.troops={hum_spear:6,hum_bow:4};G.mode='world';G.modal=false;G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['orc_grunt','orc_grunt','archer','hedge']};t.startBattle({enemies:G.enc.list,tournament:false});t.beginFight();
  const B2=t.B,T2=B2.terrain;ok(T2&&T2.recipe.kind==='forest'&&T2.recipe.dense&&share(T2,B2.ftop,B2.fbot,K.wood)>=.5&&t.terrainFair(T2,t.BW,B2.ftop,B2.fbot).ok,'a battle on a forest tile of the world: '+Math.round(share(T2,B2.ftop,B2.fbot,K.wood)*100)+'% woods, fair; '+B2.env.text);
  for(let i=0;i<60;i++)t.updateBattle(1/30);ok(B2.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)),'and it runs');G.mode='world';t.B.over=true}
 // ---- field sizes and field variety together (setup.js FIELD_SIZES on): the ground built at the chosen size, its deployment zones the sized field's (fieldZone)
 {ev('FIELD_SIZES.on=true;EXITS.on=true');const F=t.FIELD_SIZES,bw0=t.BW,world=()=>{if(L.active)L.exit();if(t.B){const B=t.B;B.win=true;B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont')}t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.event=null};
  // (the join: with a size set, buildTerrain reads BW, BH and the zones from BFIELD; today's (no size) as ever)
  t.fieldSet('huge');const Th=t.buildTerrain({recipe:'forest',seed:5,top:40,bot:t.BH-40}),Zh=t.fieldZone(0);t.fieldDone();ev('BW='+bw0);
  ok(Th.C===3200/16&&Th.R===1792/16&&Th.zone&&Th.zone[0]===Zh.x0&&Th.zone[1]===Zh.x1&&!t.buildTerrain({recipe:'forest',seed:5,W:1100,top:40,bot:560}).zone,'a sized field’s ground is built at its size (huge: '+Th.C+'×'+Th.R+' cells) with its deployment zones ('+Th.zone+' px off each edge); today’s field keeps today’s');
  const bad=[],cov={};let n=0,wc=0;
  for(const k of F.order){const z=F[k],W=z.w,H=z.h,top=40,bot=H-40,zone=[z.back,z.back+z.depth],cv=[];
   for(let s=1;s<=6;s++)for(const v of [{},{frost:true},{road:{ew:true}},{river:{bridge:true}}]){const T0=t.buildTerrain({recipe:'forest',seed:(s*2654435761+k.length*131)>>>0,W,H,top,bot,zone,...v}),f=t.terrainFair(T0,W,top,bot),w=share(T0,top,bot,K.wood),D=T0.recipe.dense;n++;cv.push(w);
    const inZ=g=>g.half?g.x>W-zone[1]&&g.x<W-zone[0]:g.x>zone[0]&&g.x<zone[1],zw=[0,1].map(h=>share(T0,top,bot,K.wood,x=>h?x>W-zone[1]&&x<=W-zone[0]:x>=zone[0]&&x<zone[1]));wc=Math.max(wc,Math.abs(zw[0]-zw[1]));
    if(!D||w<.5||w>.65||!f.ok||T0.recipe.dropped.length||!D.glades.every(inZ))bad.push(k+'#'+s+JSON.stringify(v)+' '+Math.round(w*100)+'%'+(f.ok?'':' unfair')+(D&&D.glades.every(inZ)?'':' glade off its zone'))}
   cov[k]=Math.round(Math.min(...cv)*100)+'-'+Math.round(Math.max(...cv)*100)+'%'}
  ok(!bad.length,'forests at every field size, sizes on: woods over 50-65%, each army’s glade in its own deployment zone, fair by those zones ('+n+' fields: '+Object.entries(cov).map(([k,v])=>k+' '+v).join(', ')+'; the zones’ woods within '+(wc*100).toFixed(1)+' points)'+(bad.length?': '+bad.slice(0,4).join('; '):''));
  // (a lab battle in a forest at each size: its ground, its zones, its glades where the armies deploy)
  const arm=[{type:'hum_foot',count:12},{type:'hum_bow',count:6}],lb=[];
  for(const k of F.order){world();L.start({leftGroups:arm,rightGroups:arm,deploy:true,paused:true,ai:true,morale:true,seed:11,terrain:'forest',ground:'auto',size:k});const B=t.B,T0=B.terrain,top=B.ftop,bot=B.fbot,w=share(T0,top,bot,K.wood),f=t.terrainFair(T0,t.BW,top,bot);
   const Z=[t.fieldZone(0),t.fieldZone(1)],gl=T0.recipe.dense&&T0.recipe.dense.glades.every(g=>g.x>Z[g.half].x0&&g.x<Z[g.half].x1),lines=Object.values(B.groups).every(g=>{const C=g.centre(),q=T0.recipe.dense.glades[g.team];return Math.abs(C.x-q.x)<q.rx*1.2});
   if(!(T0.C===t.BW/16&&T0.R===Math.ceil(t.BH/16)&&w>=.5&&w<=.65&&f.ok&&gl&&lines))lb.push(k+' '+Math.round(w*100)+'% '+JSON.stringify({ok:f.ok,gl,lines}));for(let i=0;i<30;i++)t.updateBattle(1/30)}
  L.exit();ok(!lb.length,'a lab battle on a forest tile at each size: the ground the field’s size, 50-65% woods, fair, each army’s glade in its zone and its lines in its glade'+(lb.length?': '+lb.join('; '):''));
  // (the typed fields at their sizes: a held bridge big and large, an ambush small and big)
  const tb=[];for(const [k,ty] of [['big',{kind:'bridge',side:'left',ford:false}],['large',{kind:'bridge',side:'right',ford:true}],['small','ambush'],['big','ambush']]){world();
   L.start({leftGroups:[...arm,{type:'hum_knight',count:4}],rightGroups:[...arm,{type:'hum_knight',count:4}],deploy:false,paused:true,ai:true,morale:true,seed:3,distance:500,ground:'auto',type:ty,size:k});const B=t.B,T0=B.terrain,mid=(B.ftop+B.fbot)/2;let wet=0,steps=0;
   const br=ty.kind==='bridge'&&T0.ai.crossings.find(c=>c.kind==='bridge');const set=ty.kind==='bridge'?!!br&&Math.abs(br.x-t.BW/2)<=t.TERRAIN_RIVER.mid&&B.btype:B.btype&&B.btype.kind==='ambush'&&B.units.filter(u=>u.team===1&&u.hp>0).every(u=>T0.kind[t.tIx(T0,u.x,u.y)]===K.wood)&&B.units.filter(u=>u.team===0).every(u=>Math.abs(u.y-mid)<40);
   while(!L.session.result&&B.t<200&&steps++<800){L.step(15);for(const u of B.units)if(u.hp>0&&t.groundAt(u.x,u.y)===K.deep)wet++}
   if(!(t.BFIELD.key===k&&T0.C===t.BW/16&&set&&!wet))tb.push(k+' '+(ty.kind||ty)+JSON.stringify({set:!!set,wet}));L.exit()}
  ok(!tb.length,'the typed fields at their sizes: a held bridge big and large (its bridge near the middle, nobody in deep water), an ambush small and big (those in wait in woods, the column on the road)'+(tb.length?': '+tb.join('; '):''));
  // (a pass on a very large field: its crags along both edges, more than today's, and fair)
  {const z=F.vlarge,W=z.w,H=z.h,top=40,bot=H-40,zone=[z.back,z.back+z.depth],bad=[];let n0=0,n1=0;
   for(let s=1;s<=8;s++){const T0=t.buildTerrain({recipe:'peaks',layout:'pass',seed:s*977,W,H,top,bot,zone}),R0=T0.recipe.rocks,f=t.terrainFair(T0,W,top,bot),T1=t.buildTerrain({recipe:'peaks',layout:'pass',seed:s*977,W,H,top,bot});n0+=R0.length;n1+=T1.recipe.rocks.length;
    if(!f.ok||T0.recipe.dropped.includes('rocks')||!R0.some(p=>p.y<top+H*.2)||!R0.some(p=>p.y>bot-H*.2))bad.push(s+(f.ok?'':' unfair')+' rocks '+R0.length)}
   ok(!bad.length&&n0>n1,'a mountain pass on a very large field: crags along both edges ('+(n0/8).toFixed(1)+' a field, against '+(n1/8).toFixed(1)+' laid as on today’s), fair'+(bad.length?': '+bad.join('; '):''))}
  // (the art: a big wood zoomed out draws its canopy layer, not its trees one by one (render.js LOD); zoomed in, the sprites)
  {world();L.start({leftGroups:arm,rightGroups:arm,deploy:false,paused:true,ai:true,morale:true,seed:7,terrain:'forest',ground:'auto',size:'huge'});const B=t.B,G0=()=>t.B.ground;t.camReset();t.drawBattle();
   const out=G0().lod===1&&G0().canopy&&G0().canopy.width===t.BW&&G0().trees>t.LOD.trees&&!t.battleEnts().some(p=>p.dk===1)&&t.battleEnts().some(u=>u.hp>0);
   B.cam.z=1;B.cam.fit=false;t.camClamp();G0().lod=null;t.drawBattle();const inn=G0().lod===0&&t.battleEnts().some(p=>p.dk===1);
   t.LOD.on=false;t.camReset();G0().lod=null;t.drawBattle();const off=G0().lod===0;t.LOD.on=true;
   ok(out&&inn&&off,'a huge forest ('+G0().trees+' trees): zoomed out (×'+B.cam.z.toFixed(2)+') its trees are one canopy layer under the men, none sorted in; at ×1 the sprites; LOD off, the sprites')}
  // (roads painted: the ground along a road's line is the track, not the grass it was; with no way nothing changes)
  {const W=1792,H=1008,top=40,bot=H-40,T0=t.buildTerrain({recipe:'open',seed:21,W,H,top,bot,road:{ew:true}}),sp={...T0,climate:'grass'},A=t.PX.battleGround(sp),N=t.PX.battleGround({...sp,ways:[],recipe:{...T0.recipe,ways:[]}});
   const a=A.getContext('2d', { willReadFrequently: true }).getImageData(0,0,W,H).data,b=N.getContext('2d', { willReadFrequently: true }).getImageData(0,0,W,H).data,w=T0.ways.find(q=>q.kind==='road');let on=0,n=0;
   for(const [x,y] of w.p){if(x<8||y<8||x>=W-8||y>=H-8)continue;for(let dy=-3;dy<=3;dy++){const i=((y+dy)*W+x)*4;n++;if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])on++}}
   ok(w&&on/n>.85,'a road is painted along its way: '+Math.round(on/n*100)+'% of the ground on its line changed')}
  ev('FIELD_SIZES.on=false;EXITS.on=false')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{try{(0,eval)('TERRAIN.on=false;FIELD_SIZES.on=false;EXITS.on=false')}catch(e){}}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
