'use strict';
// The world generator's contracts (doc/WORLD_DESIGN.md §15.2.1, Phase 2 wave 0), with the flag off (today's map in) and with -Gen
// (WORLD.gen: the generated classic world in): the settings (worldsettings.js: every key's clamp, normSettings idempotent,
// Classic's locks, the presets, settingsKey, seedNum); genWorld (worldgen.js) and its steps (the result's shape, every layer at
// w x h, the stages in order, bars that never go back, the same sum twice in a page, other seeds other worlds, no Math.random);
// the classic anchors and hints; T_FORD in every table indexed by kind; the world in use (gen, sum, its BattleSite's new fields
// null with the flag off) and the three Router calls answering on it; installWorld, then a new game on the generated world.
// Phase 2 wave 1 (the terrain, stages 1-6): Normal within 4 s, Large twice one world, 8 seeds' land, climates and D41 shares, the
// map settings' effects (tests/rivers.js: the rivers).
// INFO lines: time per stage, the shares (land, climates, D41's high ground), rivers, crossings and camps.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,G=t.G,P=t.P,W=t.W,r0=Math.random;
try{
 try{localStorage.clear()}catch(e){}
 const N=t.normSettings,J=JSON.stringify,K=t.SETTING_KEYS,pn=()=>performance.now();
 // ---- the settings
 {const d=N({});ok(J(Object.keys(d))===J(K)&&d.v===1&&d.preset==='custom'&&d.w===448&&d.h===320&&d.holdings===37&&d.seed===''&&d.seasonal===true,'nothing given: Normal\'s settings, as custom, every key in order ('+K.join(' ')+')');
  ok(N({v:7}).v===1&&N({preset:'bogus'}).preset==='custom'&&t.SETTING_CHOICES.preset.every(p=>N({preset:p}).preset===p)&&!('foo' in N({foo:1})),'v is always 1; an unknown preset is custom, the others kept; unknown keys dropped');
  const sz=(w,h)=>{const s=N({w,h});return s.w+'x'+s.h};
  ok(sz(100,100)==='320x224'&&sz(5000,5000)==='1024x768'&&sz(500,300)==='512x320'&&sz(640,200)==='640x416'&&sz(1024,224)==='1024x640'&&sz('640','448')==='640x448'&&sz('x',null)==='448x320',
   'size: each side into its range in steps of 32, the height into 1.2-1.6 of the width (100x100 '+sz(100,100)+', 5000x5000 '+sz(5000,5000)+', 500x300 '+sz(500,300)+', 640x200 '+sz(640,200)+', 1024x224 '+sz(1024,224)+')');
  const R=t.seeded(77),bad=[];for(let k=0;k<300;k++){const s=N({w:200+R()*1000,h:150+R()*800}),a=s.w/s.h;if(s.w%32||s.h%32||a<1.2||a>1.6||s.w*s.h>786432||s.w<320||s.w>1024||s.h<224||s.h>768)bad.push(s.w+'x'+s.h)}
  ok(!bad.length,'300 random sizes all clamp to a step of 32, an aspect of 1.2-1.6 and at most 786,432 tiles'+(bad.length?': '+bad.slice(0,5).join(' '):''));
  ok(N({seed:'  red water  '}).seed==='red water'&&N({seed:'x'.repeat(40)}).seed.length===24&&N({seed:42}).seed==='42'&&N({preset:'classic',seed:'x'}).seed==='CLASSIC','seed: trimmed, cut to 24 characters, text; Classic\'s is CLASSIC');
  const hd=o2=>N({holdings:999,...o2}).holdings;
  ok(N({holdings:5}).holdings===25&&hd({})===60&&hd({wild:'vast'})===45&&hd({land:'sea'})===51&&hd({wild:'vast',land:'sea'})===38&&hd({preset:'large'})===110&&hd({preset:'huge'})===200&&hd({w:544,h:384})===82&&N({holdings:'x'}).holdings===37&&N({preset:'large'}).holdings===55&&N({holdings:40.9}).holdings===40,
   'holdings: at least 25; at most 60 at Normal (Vast wild 45, More sea 51, both 38), 110 at Large, 200 at Huge, linear between (544x384: '+hd({w:544,h:384})+'); floored; else the preset\'s');
  const ch=Object.keys(t.SETTING_CHOICES).filter(k=>k!=='preset'),wrong=ch.filter(k=>N({[k]:'bogus'})[k]!==N({})[k]||!t.SETTING_CHOICES[k].every(v=>N({[k]:v})[k]===v));
  ok(!wrong.length&&N({seasonal:'yes'}).seasonal===true&&N({seasonal:false}).seasonal===false,'every choice ('+ch.join(', ')+') keeps its values and takes its default for anything else; seasonal: true but for false'+(wrong.length?': '+wrong.join(', '):''));
  const pick=a=>a[Math.floor(R()*a.length)],idem=[];
  for(let k=0;k<200;k++){const s={};for(const c of Object.keys(t.SETTING_CHOICES))if(R()<.8)s[c]=R()<.15?'bogus':pick(t.SETTING_CHOICES[c]);if(R()<.7)s.w=R()*1200;if(R()<.7)s.h=R()*900;if(R()<.7)s.holdings=R()*250;if(R()<.5)s.seed=' s'+k+' ';
   const a=N(s);if(J(N(a))!==J(a))idem.push(J(s))}
  ok(!idem.length,'normSettings(normSettings(s)) equals normSettings(s) on 200 random settings'+(idem.length?': '+idem[0]:''));
  const C=N({preset:'classic',w:1024,h:768,seed:'mine',holdings:90,hamlets:'many',sacred:'common',wild:'vast',land:'sea',rivers:'wet',mountains:'rugged',climate:'warm',seasonal:false,economy:'rich',sites:'many',monsters:'deadly',bandits:'many',start:'settler'});
  ok(C.w===448&&C.h===320&&C.seed==='CLASSIC'&&C.holdings===37&&['hamlets','sacred','wild','land','rivers','mountains','climate','seasonal','economy','sites'].every(k=>C[k]===N({})[k])&&C.monsters==='deadly'&&C.bandits==='many'&&C.start==='settler'&&J(t.classicSettings({monsters:'deadly',bandits:'many',start:'settler'}))===J(C),
   'Classic locks size, seed, holdings and every map setting to the defaults; monsters, bandits and start stay free (classicSettings takes them)');
  const pr=Object.keys(t.WORLD_PRESETS).map(p=>{const s=N(t.defaultSettings(p));return p+' '+s.w+'x'+s.h+' '+s.holdings});
  ok(pr.join()==='classic 448x320 37,normal 448x320 37,large 640x448 55,huge 1024x768 90,frontier 640x448 38,crowded 448x320 55'&&Object.keys(t.WORLD_PRESETS).every(p=>{const d=t.defaultSettings(p),n=N(d);return K.every(k=>n[k]===d[k])}),'the presets clamp to themselves: '+pr.join(', '));
  ok(t.settingsKey(N({seed:'a'}))===t.settingsKey({seed:'a',foo:2})&&t.settingsKey(N({seed:'a'}))!==t.settingsKey(N({seed:'b'}))&&t.settingsKey(null)==='','settingsKey: equal for equal clamped settings, different for different ones; empty for none');
  ok(t.seedNum('')===2166136261&&t.seedNum('a')===0xe40c292c&&t.seedNum('CLASSIC')>>>0===t.seedNum('CLASSIC')&&t.seedNum('ab')!==t.seedNum('ba'),'seedNum: FNV-1a 32 of the text (CLASSIC: '+t.seedNum('CLASSIC')+')')}
 // ---- T_FORD in every table indexed by kind
 ok(t.T_FORD===6&&t.SPEEDMUL[6]===.5&&t.LAND_COST[6]===1.5&&t.passable(t.T_FORD)&&t.CLIMS.every(c=>typeof t.REGION_NAMES[c][6]==='string'&&/^#[0-9a-f]{6}$/.test(t.PAL[c].mini[6]))&&t.PX.WN_KIND.ford===6&&t.terrainRecipeOf(t.T_FORD,'grass',0)==='open',
  'T_FORD (6): passable at x'+t.SPEEDMUL[6]+', land cost '+t.LAND_COST[6]+', named ('+t.CLIMS.map(c=>t.REGION_NAMES[c][6]).join(', ')+'), on the minimap, painted as open ground (PX.WN_KIND.ford), an open field in battle');
 // ---- the classic anchors and hints (§8.15)
 {const A=t.classicAnchors(),at=n=>A.find(a=>a.name===n),names=new Set(t.CLASSIC_PLACES.map(p=>p.name));
  ok(A.length===37&&A.every((a,k)=>a.name===t.CLASSIC_PLACES[k].name&&a.tx>=8&&a.ty>=8&&a.tx<440&&a.ty<312)&&at('Ashford').tx===83&&at('Ashford').ty===85&&at('Karn Hold').tx===338&&at('Karn Hold').ty===78,
   '37 anchors in TOWNS order, inside the Normal map: Ashford ('+at('Ashford').tx+', '+at('Ashford').ty+'), Karn Hold ('+at('Karn Hold').tx+', '+at('Karn Hold').ty+')');
  const H=t.CLASSIC_HINTS,named=H.flatMap(h=>[].concat(h.at,h.ports||[]).filter(x=>typeof x==='string'));
  ok(H.length>=7&&new Set(H.map(h=>h.id)).size===H.length&&named.every(n=>names.has(n))&&['southSea','frostNorth','desertSouthEast','karnPeaks','willowIsle','stonebridge','fens'].every(id=>H.some(h=>h.id===id)),'CLASSIC_HINTS: '+H.map(h=>h.id).join(', ')+'; every place named is a classic holding')}
 // ---- genWorld and its steps
 const shape='map holdings camps lords hamlets sacred lair regions rivers crossings graph tries relaxed'.split(' ');
 const layersOk=m=>t.MAP_LAYERS.every(k=>m[k]&&m[k].length===m.w*m.h&&(k==='basin'?m[k] instanceof Uint16Array:m[k] instanceof Uint8Array));
 let calls=0;Math.random=()=>{calls++;return r0()};
 const steps=t.genWorldSteps(t.classicSettings()),times=[],fr=[];let res,back=0;
 for(const st of steps){const a=pn(),it=st.run();let r,last=0;while(!(r=it.next()).done){if(typeof r.value!=='number'||r.value<last||r.value>1)back++;last=r.value;fr.push(r.value)}res=r.value;times.push(st.id+' '+(pn()-a).toFixed(0))}
 const once=pn(),R1=t.genWorld(t.classicSettings()),ms=pn()-once;Math.random=r0;
 info('the classic world in '+ms.toFixed(0)+' ms; by stage (ms): '+times.join(', '));
 ok(ms<=4000,'the classic world (Normal) generates within 4 s here ('+ms.toFixed(0)+' ms)');
 ok(J(steps.map(s=>s.id))===J(t.GEN_STAGES.map(s=>s.id))&&steps.every((s,k)=>s.label===t.GEN_STAGES[k].label&&s.w>0)&&J(steps.map(s=>s.id))===J(['land','elev','climate','rivers','forest','regions','holdings','roads','sites','graph']),
  'genWorldSteps: the ten stages in order, each with its label and weight ('+steps.map(s=>s.label).join(' · ')+')');
 ok(!back&&fr.length>=10,'each stage yields its share done, 0-1, never going back ('+fr.length+' yields)');
 ok(!calls,'generating draws no Math.random ('+calls+' calls)');
 {const m=R1.map,s=t.classicSettings();
  ok(shape.every(k=>k in R1)&&Object.keys(R1).length===shape.length&&Array.isArray(R1.hamlets)&&!R1.hamlets.length&&Array.isArray(R1.sacred)&&R1.lair===null&&R1.graph===null&&R1.lords===null,'genWorld returns {'+Object.keys(R1).join(', ')+'} (no hamlets, sacred places or lair yet; no way graph: router.js buildWayGraph is a stub)');
  ok(m instanceof t.WorldMap&&m.gen==='ashmark-1'&&m.classic===true&&m.salt===0&&m.w===448&&m.h===320&&m.seed==='CLASSIC'&&m.seedNum===t.seedNum('CLASSIC')&&J(m.settings)===J(s)&&layersOk(m),
   'its map: ashmark-1, classic, salt 0, 448 x 320, seed CLASSIC ('+m.seedNum+'), its settings clamped, every layer ('+t.MAP_LAYERS.join(' ')+') at w x h');
  ok(['rivers','basins','crossings','roads','regions','cliffs'].every(k=>Array.isArray(m[k]))&&m.rivers===R1.rivers&&m.crossings===R1.crossings&&m.regions===R1.regions&&m.rivers.every(r=>r.path.length>=8&&r.path.every(i=>m.kind[i]===t.T_WATER||m.kind[i]===t.T_ROAD||m.kind[i]===t.T_FORD)&&(m.kind[r.mouth]===t.T_WATER||(m.river[r.mouth]&3)>0)&&(m.river[r.path[0]]&3)>0)
   &&m.crossings.every(c=>['bridge','ford','ferry'].includes(c.kind)&&c.tiles.every(i=>m.kind[i]===(c.kind==='ford'?t.T_FORD:c.kind==='ferry'?t.T_WATER:t.T_ROAD))),'its lists: '+m.rivers.length+' rivers ('+m.rivers.map(r=>r.name+' '+r.path.length+' tiles, width '+r.width).join('; ')+'), each water to its mouth (a tributary’s mouth on its river, maybe under a ford or bridge); '+m.crossings.length+' crossings ('+['bridge','ford'].map(k=>m.crossings.filter(c=>c.kind===k).length+' '+k+'s').join(', ')+'), '+m.roads.length+' roads, '+m.basins.length+' basins, '+m.cliffs.length+' escarpment candidates');
  ok(R1.holdings.length===37&&R1.holdings.every((h,k)=>h.name===t.CLASSIC_PLACES[k].name&&h.realm===t.CLASSIC_PLACES[k].realm&&m.has(h.tx,h.ty)&&t.passable(m.kind[h.ty*m.w+h.tx]))&&R1.camps.length>=8&&R1.camps.every(c=>m.has(c.tx,c.ty)&&t.passable(m.kind[c.ty*m.w+c.tx])),
   'the 37 classic holdings, in order with their data, and '+R1.camps.length+' camps, each on walkable ground');
  ok(t.GEN_STAGES.every(st=>R1.tries[st.id]>=1)&&Array.isArray(R1.relaxed),'tries: '+t.GEN_STAGES.map(st=>st.id+' '+R1.tries[st.id]).join(', ')+'; relaxed: '+(R1.relaxed.join('; ')||'nothing'));
  ok(m.sum===m.checksum(R1.holdings)&&m.sum>0&&res.map.sum===m.sum,'WM.sum is its checksum ('+m.sum.toString(16)+'), and the steps run apart make the same world (the same sum twice in a page)');
  // the shares (INFO: wave 1's checks)
  const n=m.w*m.h,land=[...m.kind].filter(k=>k!==t.T_WATER).length,cl=[0,0,0,0],kinds=[0,0,0,0,0,0,0],hi=[0,0,0,0];
  for(let i=0;i<n;i++){kinds[m.kind[i]]++;if(m.kind[i]!==t.T_WATER)cl[m.clim[i]]++;if(m.kind[i]===t.T_HILL)hi[m.high[i]&3]++}const H=kinds[t.T_HILL]||1;
  info('land '+(land*100/n).toFixed(1)+'%; climates of the land: '+t.CLIMS.map((c,k)=>c+' '+(cl[k]*100/land).toFixed(1)+'%').join(', ')+'; kinds: '+['open','forest','hill','water','road','mount','ford'].map((k,j)=>k+' '+(kinds[j]*100/n).toFixed(1)+'%').join(', '));
  info('high ground (D41) of '+kinds[t.T_HILL]+' hill tiles: rise '+(hi[1]*100/H).toFixed(0)+'%, steep '+(hi[2]*100/H).toFixed(0)+'%, cliffed '+(hi[3]*100/H).toFixed(0)+'%, none '+(hi[0]*100/H).toFixed(0)+'%; feat: '+[[1,'floodplain'],[2,'lake'],[4,'coast'],[8,'deep wood'],[16,'sparse edge'],[32,'bridge']].map(([b,k])=>k+' '+[...m.feat].filter(f=>f&b).length).join(', '));
  ok(land/n>=.6&&land/n<=.8,'land is '+(land*100/n).toFixed(1)+'% of the classic map (60-80%)')}
 // other seeds, other sizes: the same settings twice the same world, other seeds others
 {const a=pn(),A=t.genWorld({preset:'normal',seed:'redwater'}),B=t.genWorld({preset:'normal',seed:'redwater'}),Cw=t.genWorld({preset:'normal',seed:'bluewater'}),b=pn(),L=t.genWorld({preset:'large',seed:'redwater'}),c=pn(),L2=t.genWorld({preset:'large',seed:'redwater'});
  ok(A.map.sum===B.map.sum&&A.map.sum!==Cw.map.sum&&A.map.salt===t.seedNum('redwater')&&!A.map.classic,'Normal seed redwater twice: one world ('+A.map.sum.toString(16)+'); bluewater another ('+Cw.map.sum.toString(16)+'); a generated world\'s salt is its seed');
  ok(L.map.w===640&&L.map.h===448&&layersOk(L.map)&&L.holdings.length===L.map.settings.holdings&&L.map.sum!==A.map.sum&&L2.map.sum===L.map.sum,'Large: 640 x 448, every layer at that size, its holdings placed; twice one world ('+L.map.sum.toString(16)+')');
  info('Normal in '+((b-a)/3).toFixed(0)+' ms (of 3), Large in '+(c-b).toFixed(0)+' ms')}
 // ---- the terrain (stages 1-6) on 8 seeds at Normal: land 60-80%, each climate 6% of the land at least, D41's high ground within
 // its targets (of the hill tiles: rises 50-70%, steep 25-40%, cliffed 5-12%), escarpment candidates; and each map setting moving
 // what it should (§4.1)
 {const sh=m=>{const n=m.w*m.h,cl=[0,0,0,0],hi=[0,0,0,0],k=[0,0,0,0,0,0,0];let land=0,riv=0;for(let i=0;i<n;i++){k[m.kind[i]]++;if(m.river[i]&3)riv++;if(m.kind[i]!==t.T_WATER){land++;cl[m.clim[i]]++}if(m.kind[i]===t.T_HILL)hi[m.high[i]&3]++}
   const H=k[t.T_HILL]||1;return{land:land/n,cl:cl.map(c=>c/land),rise:hi[1]/H,steep:hi[2]/H,cliff:hi[3]/H,none:hi[0],mount:k[t.T_MOUNT]/land,forest:k[t.T_FOREST]/land,riv:riv/land,cliffs:m.cliffs.length}};
  const pc=v=>(v*100).toFixed(0),S=[1,2,3,4,5,6,7,8].map(n=>[n,sh(t.genWorld({preset:'normal',seed:'s'+n}).map)]),bad=[];
  for(const [n,v] of S){if(v.land<.6||v.land>.8)bad.push(n+' land '+pc(v.land));if(v.cl.some(c=>c<.06))bad.push(n+' a climate '+pc(Math.min(...v.cl)));
   if(v.rise<.5||v.rise>.7||v.steep<.25||v.steep>.4||v.cliff<.05||v.cliff>.12||v.none||!v.cliffs)bad.push(n+' D41 '+pc(v.rise)+'/'+pc(v.steep)+'/'+pc(v.cliff))}
  ok(!bad.length,'8 seeds at Normal: land 60-80%, each climate 6% of the land or more, the high ground (D41) within its targets, escarpment candidates on each ('+S.map(([n,v])=>'s'+n+': land '+pc(v.land)+', '+t.CLIMS.map((c,k)=>c[0]+pc(v.cl[k])).join(' ')+', hills '+pc(v.rise)+'/'+pc(v.steep)+'/'+pc(v.cliff)).join('; ')+')'+(bad.length?': '+bad.join('; '):''));
  const set=o=>sh(t.genWorld({preset:'custom',seed:'s1',...o}).map),cold=set({climate:'cold'}),warm=set({climate:'warm'}),dry=set({rivers:'dry'}),wet=set({rivers:'wet'}),flat=set({mountains:'flat'}),rug=set({mountains:'rugged'}),sea=set({land:'sea'}),con=set({land:'continent'});
  ok(cold.cl[1]>warm.cl[1]&&cold.cl[2]<warm.cl[2]&&dry.riv<wet.riv&&dry.forest<wet.forest&&flat.mount<rug.mount&&sea.land<con.land&&[cold,warm,dry,wet,flat,rug,sea,con].every(v=>v.cl.every(c=>c>=.06)),
   'the map settings: cold has more frost and less desert than warm (frost '+pc(cold.cl[1])+'/'+pc(warm.cl[1])+'%, desert '+pc(cold.cl[2])+'/'+pc(warm.cl[2])+'%), wet more rivers and forest than dry (rivers '+(dry.riv*100).toFixed(1)+'/'+(wet.riv*100).toFixed(1)+'%, forest '+pc(dry.forest)+'/'+pc(wet.forest)+'%), rugged more peaks than flat ('+(flat.mount*100).toFixed(1)+'/'+(rug.mount*100).toFixed(1)+'%), More sea less land than Continent ('+pc(sea.land)+'/'+pc(con.land)+'%); each climate 6% or more on all')}
 // ---- the world in use, flag off or on
 {const m=t.WM,S=m.battleSite(Math.floor(m.w/2),Math.floor(m.h/2)),fresh=['river','crossing','season','region','deep','elev','terrace','rough','high','cliff'];
  if(!t.WORLD.gen)ok(m.gen==='classic-0'&&m.w===224&&m.h===160&&m.settings===null&&m.seedNum===0&&m.graph===null&&layersOk(m)&&m.sum>0&&t.MAP_LAYERS.slice(2).every(k=>m[k].every(v=>!v)),'flag off: today\'s map (classic-0, 224 x 160, no settings), its new layers there and all 0, its sum over gen, kind and clim ('+m.sum.toString(16)+')');
  else ok(m.gen==='ashmark-1'&&m.classic&&m.w===448&&m.h===320&&m.sum===R1.map.sum&&t.TOWNS.length>=37&&t.CLASSIC_PLACES.every((p,k)=>t.TOWNS[k].name===p.name),'flag on: the generated classic world is in (ashmark-1, 448 x 320, the sum genWorld makes: '+m.sum.toString(16)+'), its holdings the classic ones in TOWNS order');
  ok(fresh.every(k=>k in S&&S[k]===null),'its BattleSite has the new fields, all empty for now ('+fresh.join(', ')+')')}
 // ---- installWorld, then a new game on it; the three Router calls answer
 {Math.random=t.seeded(9001);const R=t.genWorld(t.classicSettings()),m=t.installWorld(R);
  ok(t.WM===m&&t.MW===448&&t.MH===320&&t.tiles===m.kind&&t.TOWNS.length===37&&t.CAMP_SPOTS.length===R.camps.length&&t.DEPOSITS.length>0,'installWorld puts it in: the map in use, its 37 holdings, '+R.camps.length+' camps and '+t.DEPOSITS.length+' deposits');
  t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();
  const home=t.capitalOf(P.race);
  ok(t.WM===m&&P.x>0&&P.y>0&&P.x<m.w*t.TILE&&P.y<m.h*t.TILE&&Math.abs(P.x-(home.tx+.5)*t.TILE)<1&&W.sites.length>0&&t.bandits.length>0&&W.monsters.length>0&&t.TOWNS.every(h=>h.owner),'a new game on it: you at '+home.name+', '+W.sites.length+' sites, '+t.bandits.length+' bands, '+W.monsters.length+' beasts, every holding held');
  const reach=t.TOWNS.slice(1).filter(h=>t.Router.reach(t.TOWNS[0],h)).length,d=t.Router.days(t.TOWNS[0],t.TOWNS[1]),o2={x:P.x,y:P.y};let go=true;for(let k=0;k<30&&go;k++)go=t.Router.travel(o2,t.gateGoal(t.TOWNS[1]),3);
  ok(reach===36&&isFinite(d)&&d>0&&go===true&&(o2.x!==P.x||o2.y!==P.y),'the Router answers: every holding reachable from '+t.TOWNS[0].name+' ('+reach+' of 36), '+t.TOWNS[1].name+' '+d.toFixed(1)+' days off, a walker on its way there');
  for(let f=0;f<60;f++)t.updateWorld(.05);ok(true,'the world runs a few seconds on it')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{Math.random=r0}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
