'use strict';
// Battle field sizes (battle/setup.js FIELD_SIZES, BFIELD) and the ways off the field by any open edge (battle/morale.js EXITS,
// B.exits): the size chosen by the soldiers, the world tile and the battle's type, the lab's size key; deployment zones with ground
// behind them; the camera, small map, route, fog and spatial grids sized to the field; painting a huge field (time and memory);
// exits along every open edge, none on deep water or rock; a rout and a withdrawal taking a safe edge, never through the enemy;
// the escaped counted; a full AI battle at each size; timings at 400 and 800 soldiers (INFO). tests/harness.js turns sizes and exits
// off for the older suites; this one turns them on.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
// (what is said on the screen: a battle's first line is a toast, not the journal)
const said=[],toast0=window.toast;window.toast=(m,c)=>{said.push(m);toast0(m,c)};
try{
 const t=T,G=t.G,P=t.P,W=t.W,L=t.BattleLab,ev=s=>(0,eval)(s),F=t.FIELD_SIZES,SIZES=F.order,keep={validate:L.validate};
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;ev('FIELD_SIZES.on=true;EXITS.on=true');
 const lab=(cfg)=>{if(L.active)L.exit();G.mode='world';G.modal=false;L.start({deploy:false,ai:false,paused:true,morale:true,seed:5,ground:'none',...cfg});return t.B};
 const mid=()=>(t.fieldTop()+t.fieldBot())/2,cen=l=>({x:l.reduce((a,u)=>a+u.x,0)/l.length,y:l.reduce((a,u)=>a+u.y,0)/l.length});
 const place=(id,x,y)=>{const g=t.B.groups[id];g.ax=x;g.ay=y;g.px=x;g.py=y;for(const u of t.grpUnits(id)){u.x=x+(u.sx||0);u.y=y+(u.sy||0)}};
 const nearSide=(u,s)=>s==='W'?u.x<40:s==='E'?u.x>t.BW-40:s==='N'?u.y<t.fieldTop()+40:u.y>t.fieldBot()-40;
 // (Math.random counted round a call: none may be drawn by the size or the exits)
 let draws=0;const rnd0=Math.random,counted=f=>{const r=Math.random;Math.random=()=>{draws++;return r()};try{return f()}finally{Math.random=r}};

 // ---- the size: by soldiers, the world tile, the battle's type
 {const S=(n,r,k)=>t.fieldSizeFor(n,r,k),hill={t:t.T_HILL,c:'grass'},plain={t:t.T_OPEN,c:'grass'},wood={t:t.T_FOREST,c:'grass'},pass={t:t.T_MOUNT,c:'frost'},bog={t:t.T_OPEN,c:'swamp'};
  ok(S(30,hill)==='small'&&S(59,hill)==='small'&&S(60,hill)==='big'&&S(149,hill)==='big'&&S(150,hill)==='large'&&S(299,hill)==='large'&&S(300,hill)==='vlarge'&&S(599,hill)==='vlarge'&&S(600,hill)==='huge'&&S(2000,hill)==='huge',
   'by soldiers: under 60 small, 150 big, 300 large, 600 very large, else huge');
  ok(S(100,plain)==='large'&&S(100,wood)==='small'&&S(100,pass)==='small'&&S(100,bog)==='small'&&S(100,{t:t.T_ROAD,c:'desert'})==='large'&&S(100,null)==='big','the world tile: open plains a step up; forest, a mountain pass, a swamp a step down');
  ok(S(1000,plain)==='huge'&&S(10,wood)==='small','the steps stop at the smallest and the largest');
  ok(S(20,wood,'bridge')==='big'&&S(2000,plain,'bridge')==='large'&&S(2000,plain,'ambush')==='big'&&S(10,wood,'ambush')==='small','a held bridge keeps big to large, an ambush small to big');
  for(const k of SIZES){const z=F[k];ok(z.w%32===0&&z.h%16===0&&z.back>0&&z.back+z.depth<z.w/2,k+': '+z.w+'×'+z.h+' (cells of 16 and 32 fit), its zone '+z.back+'-'+(z.back+z.depth)+' px off its edge')}
  // (a campaign battle: its soldiers counted before anyone spawns; a tournament small)
  P.troops={hum_spear:30,hum_bow:20};const bs=new t.BattleSetup({enemies:Array(60).fill('militia'),tournament:false,lv:1}),heads=1+60+t.compsInBand().length+P.list.length;
  const r=t.regionAt(P.x,P.y),got=counted(()=>bs.fieldSize());ok(got===S(heads,{t:r.t,c:r.c})&&heads>100,'a campaign battle: '+heads+' soldiers on its tile ('+r.t+', '+r.c+'): '+got);
  ok(new t.BattleSetup({enemies:['chief'],tournament:true}).fieldSize()==='small','a tournament: small');
  ev('FIELD_SIZES.on=false');ok(bs.fieldSize()===null,'sizes off: none (today’s field)');ev('FIELD_SIZES.on=true')}

 // ---- the lab's size key; the field set and given back; the start names it
 {let B=lab({leftGroups:[{type:'hum_foot',count:10}],rightGroups:[{type:'militia',count:10}],size:'huge'});
  ok(t.BW===3200&&t.BH===1792&&t.BFIELD.key==='huge'&&B.fsize==='huge','size huge: the field 3200×1792');
  ok(said.some(m=>/Huge field\./.test(m)),'the battle’s first line names its size');
  L.exit();ok(t.BH===t.FIELD_H&&!t.BFIELD,'leaving the lab gives back today’s field');
  B=lab({leftGroups:[{type:'hum_foot',count:10}],rightGroups:[{type:'militia',count:10}],size:'very large'});ok(t.BFIELD.key==='vlarge'&&t.BW===2400,'"very large" is vlarge');
  B=lab({leftGroups:[{type:'hum_foot',count:10}],rightGroups:[{type:'militia',count:10}]});ok(t.BFIELD.key===t.fieldSizeFor(20,{t:t.T_OPEN,c:'grass'},null),'no size key: by its soldiers and terrain ('+t.BFIELD.key+')');
  let bad='';try{L.validate({leftGroups:[{type:'hum_foot',count:1}],rightGroups:[{type:'militia',count:1}],size:'vast'})}catch(e){bad=e.message}ok(/Size/.test(bad),'an unknown size is refused');
  ok(L.validate({leftGroups:[{type:'hum_foot',count:1}],rightGroups:[{type:'militia',count:1}],size:'huge',distance:2000}).size==='huge','a sized lab may set its armies further apart');
  ev('FIELD_SIZES.on=false');B=lab({leftGroups:[{type:'hum_foot',count:10}],rightGroups:[{type:'militia',count:10}],size:'large'});ok(t.BW===1792&&t.BFIELD.key==='large','the key forces a size with sizes off too');
  B=lab({leftGroups:[{type:'hum_foot',count:10}],rightGroups:[{type:'militia',count:10}]});ok(!t.BFIELD&&t.BH===600&&t.BW===t.clamp(t.BVW,t.FIELD_W.min,t.FIELD_W.max),'sizes off, no key: today’s field');ev('FIELD_SIZES.on=true')}

 // ---- each size: zones with ground behind them, the camera, the small map, the grids
 for(const k of SIZES){const B=lab({leftGroups:[{type:'hum_foot',count:20},{type:'hum_bow',count:10}],rightGroups:[{type:'dw_clan',count:20},{type:'dw_sling',count:10}],deploy:true,size:k,ground:{recipe:'hills',seed:9},fog:true}),z=F[k];
  const Z=t.deployZone(),Z1=t.fieldZone(1),mine=Object.values(B.groups).filter(g=>g.team===0),theirs=Object.values(B.groups).filter(g=>g.team===1);
  const inZ=(g,Q)=>t.grpUnits(g.id).every(u=>u.x>=Q.x0-1e-6&&u.x<=Q.x1+1e-6);
  ok(B.deploy&&Z.x0===z.back&&Z.x1===z.back+z.depth&&Z1.x1===t.BW-z.back&&mine.every(g=>inZ(g,Z))&&theirs.every(g=>inZ(g,Z1)),k+': both sides deploy in zones '+z.back+' px off their edges');
  // (the camera: the whole field in view at its fit, steps in as ever, pans to the far corner; the small map the field's shape)
  const c=B.cam,f=t.camFit();ok(c.z===f&&t.BW*f<=t.BVW+1e-6&&t.BH*f<=t.BVH+1e-6&&(Math.abs(t.BW*f-t.BVW)<1e-6||Math.abs(t.BH*f-t.BVH)<1e-6)&&t.camZooms()[0]===f&&t.camZooms().at(-1)===3,k+': the camera sees the whole field (zoom '+f.toFixed(3)+')');
  for(let i=0;i<12;i++)t.camZoom(1);const zin=c.z;t.camPan(1e5,1e5);const far=Math.abs(c.x+t.BVW/c.z-t.BW)<1e-6&&Math.abs(c.y+t.BVH/c.z-t.BH)<1e-6;t.camReset();
  const R=t.miniRect(),sx=t.BVW/t.VW,sy=t.BVH/t.VH,h1=t.miniHit({x:(R.x+R.w/2)*sx,y:(R.y+R.h/2)*sy}),h2=t.miniHit({x:(R.x+R.w)*sx,y:(R.y+R.h)*sy});
  ok(zin===3&&far&&c.z===f&&c.fit&&Math.abs(R.h-Math.round(R.w*t.BH/t.BW))<1e-9&&Math.abs(h1.x-t.BW/2)<1e-6&&Math.abs(h1.y-t.BH/2)<1e-6&&Math.abs(h2.x-t.BW)<1e-6&&Math.abs(h2.y-t.BH)<1e-6,k+': zoomed in it pans to the far corner; the small map maps to the whole field');
  // (the grids: route (terrain cells), fog, spatial)
  t.sightStep(true);const T=B.terrain,FG=B.sight&&B.sight.fog,S=new t.SpatialGrid(B.units,t.SPATIAL.cell);
  ok(T.C===t.BW/16&&T.R===Math.ceil(t.BH/16)&&T.route.foot.C===T.C&&T.route.foot.R===T.R&&FG&&FG.C===T.C&&FG.R===T.R&&S.C===t.BW/32&&S.R===Math.ceil(t.BH/32),k+': route '+T.C+'×'+T.R+', fog '+(FG&&FG.C+'×'+FG.R)+', spatial '+S.C+'×'+S.R+' cells over the field');
  // (a box dragged over the whole view at its fit takes in every group of yours; deploying, a group placed past the zone stands at its edge)
  {const p=t.toField({x:0,y:0}),q=t.toField({x:t.BVW,y:t.BVH});t.rtsSelect(p.x,p.y,q.x,q.y,false);const sel=t.selGroups();ok(mine.every(g=>sel.includes(g.id))&&p.x<=1e-6&&p.y<=1e-6&&q.x>=t.BW-1e-6&&q.y>=t.BH-1e-6,k+': a box over the whole view takes in all '+mine.length+' of your groups')}
  const g0=mine[0],a=t.inZone(t.BW/2,mid());t.B.groups[g0.id].placeAt(a.x,a.y);t.deploySnap([g0.id]);ok(t.grpUnits(g0.id).every(u=>u.x>=Z.x0&&u.x<=Z.x1)&&a.x===Z.x1,k+': a group placed past the zone stands at its edge');
 }
 L.exit();

 // ---- painting a huge field: time and memory
 {const B=lab({leftGroups:[{type:'hum_foot',count:20}],rightGroups:[{type:'militia',count:20}],size:'huge',ground:{recipe:'forest',seed:4},climate:'grass',terrain:'forest'});
  let a=performance.now();const arena=t.paintArena('grass');const pa=performance.now()-a;a=performance.now();const gr=t.PX.battleGround({...B.terrain,climate:B.env.c,base:B.arena});const pg=performance.now()-a;B.ground=gr;
  a=performance.now();t.frame();const f1=performance.now()-a;const px=gr.getContext('2d', { willReadFrequently: true }).getImageData(t.BW-3,t.BH-3,1,1).data;
  const mb=n=>(n*4/1048576).toFixed(0),cells=t.BW*t.BH;
  ok(gr.width===t.BW&&gr.height===t.BH&&px[3]===255&&arena.width===t.BW,'a huge field’s ground is painted to its far corner');
  info('huge paint: arena '+pa.toFixed(0)+' ms, terrain ground '+pg.toFixed(0)+' ms, first frame '+f1.toFixed(0)+' ms; canvases '+mb(cells)+' MB each (arena, ground, blood layer, shooters’ reach: up to '+mb(cells*4)+' MB)');}

 // ---- the exits: every open edge; none on deep water or rock
 {let B=lab({leftGroups:[{type:'hum_foot',count:10}],rightGroups:[{type:'militia',count:10}],size:'big'});const top=t.fieldTop(),bot=t.fieldBot();
  const sides=B.exits.map(X=>X.side).sort().join('');ok(sides==='ENSW'&&B.exits.every(X=>X.side==='W'||X.side==='E'?X.a===top&&X.b===bot:X.a===8&&X.b===t.BW-8),'open ground: all four edges, whole');
  B=lab({leftGroups:[{type:'hum_foot',count:10}],rightGroups:[{type:'militia',count:10}],size:'big',ground:{rivers:[{x:.5,crossings:[]}],rocks:[{x:0,y:.5,r:80,h:6}],seed:3}});
  const T=B.terrain,g=T.route.foot,open=(side,s)=>{const p=t.exitPoint(side,s);return g.cost[t.routeIx(g,p.x,p.y)]>0};
  const allOpen=B.exits.every(X=>{for(let s=X.a;s<=X.b;s+=4)if(!open(X.side,s))return false;return true}),rv=T.ai.river;
  const ns=B.exits.filter(X=>X.side==='N'||X.side==='S'),w=B.exits.filter(X=>X.side==='W');
  ok(allOpen,'every stretch of every edge is ground a man may stand on');
  ok(ns.length===4&&ns.every(X=>X.b<rv.x||X.a>rv.x),'a river: the north and south edges open either side of it, never on its water ('+ns.map(X=>X.side+Math.round(X.a)+'-'+Math.round(X.b)).join(' ')+')');
  ok(w.length>=1&&w.every(X=>X.b<t.BH*.5||X.a>t.BH*.5),'a mountain on the west edge: no way off through its rock ('+w.map(X=>Math.round(X.a)+'-'+Math.round(X.b)).join(' ')+')');
  // (cut off from the far bank: its edge not reached; enemy on its own edge: a way off its bank instead)
  const r=Object.values(B.groups).find(q=>q.team===1),l=Object.values(B.groups).find(q=>q.team===0);B.cmdT=1e9;place(r.id,t.BW*.3,mid());place(l.id,t.BW*.12,mid());
  const X=counted(()=>t.exitChoose(t.grpUnits(r.id),1,null));ok(X&&X.side!=='E'&&X.x<rv.x0,'routing with the river behind and the enemy before them: they make for '+X.side+' on their own bank, not the far one');
 }

 // ---- a rout picks a safe, nearer edge, never through the enemy; it gets there
 {const B=lab({leftGroups:[{type:'hum_foot',count:20},{type:'hum_foot',count:20}],rightGroups:[{type:'dw_clan',count:16},{type:'militia',count:1}],size:'big',morale:false}),top=t.fieldTop();B.cmdT=1e9;
  // (a lone man of theirs far off in a corner keeps the battle going till the rest are off the field)
  const [a,b]=Object.values(B.groups).filter(g=>g.team===0),[r,lone]=Object.values(B.groups).filter(g=>g.team===1);place(lone.id,t.BW-30,t.fieldBot()-10);lone.firm=true;lone.hold();
  place(r.id,t.BW*.55,top+110);place(a.id,t.BW*.8,top+110);place(b.id,t.BW*.3,top+110);a.firm=b.firm=true;a.hold();b.hold();
  const m=t.grpUnits(r.id);t.rout(m[0]);ok(m.every(u=>u.rout),'the group routs');B.paused=false;t.updateBattle(1/60);const X=r.exitTo;
  ok(X&&X.side==='N','between two of the enemy’s lines, with their own edge behind one of them: they run for the nearer north edge ('+(X&&X.side)+')');
  const A=cen(t.grpUnits(a.id)),Bc=cen(t.grpUnits(b.id));let close=1e9,fr=0;
  while(m.some(u=>u.hp>0&&!u.left)&&fr++<60*40){t.updateBattle(1/60);for(const u of m)if(u.hp>0&&!u.left)close=Math.min(close,Math.hypot(u.x-A.x,u.y-A.y),Math.hypot(u.x-Bc.x,u.y-Bc.y))}
  ok(m.every(u=>u.left)&&B.fledFoes===m.length&&m.every(u=>u.fled),'all of them leave the field alive by it ('+B.fledFoes+' fled, '+(fr/60).toFixed(1)+' s)');ok(close>70,'none of them comes within 70 px of the enemy’s lines (closest '+close.toFixed(0)+')');
  ok(counted(()=>{for(const u of m)t.exitFor(u);t.exitSpans();t.exitChoose(t.grpUnits(a.id),0,null);return true})&&draws===0,'the size and the exits draw nothing from Math.random');}

 // ---- own side, flanks if cut off (the owner, 2026-10-18)
 {const rig=(ground,place0)=>{const B=lab({leftGroups:[{type:'hum_foot',count:20},{type:'hum_knight',count:10}],rightGroups:[{type:'dw_clan',count:16}],size:'large',morale:false,ground});B.cmdT=1e9;
    const [f,c]=Object.values(B.groups).filter(g=>g.team===0),r=Object.values(B.groups).find(g=>g.team===1);place0(f,c,r);f.firm=c.firm=true;f.hold();c.hold();return{B,f,c,r,X:t.exitChoose(t.grpUnits(r.id),1,null)}};
  // (beaten by the line before them, near the top of the field: home, east, though north is far nearer)
  let q=rig('none',(f,c,r)=>{const y=t.fieldTop()+90;place(r.id,t.BW*.5,y);place(f.id,t.BW*.5-40,y);place(c.id,t.BW*.5-60,y+120)});
  ok(q.X&&q.X.side==='E'&&q.X.rank===0,'broken by the line before them, the north edge far nearer than home: they run home, east ('+(q.X&&q.X.side)+')');
  // (enemy riders between them and home: a flank)
  q=rig('none',(f,c,r)=>{place(r.id,t.BW*.5,mid());place(f.id,t.BW*.5-40,mid());place(c.id,t.BW*.72,mid())});
  ok(q.X&&q.X.side!=='E'&&q.X.side!=='W','enemy riders between them and home: off by a flank ('+(q.X&&q.X.side)+'), not home and not through the line behind them');
  // (riders off to one side, not across the way: still home)
  q=rig('none',(f,c,r)=>{place(r.id,t.BW*.5,mid());place(f.id,t.BW*.5-40,mid());place(c.id,t.BW*.5,t.fieldTop()+40)});
  ok(q.X&&q.X.side==='E','riders off to one side, not across the way nor nearer home: still home ('+(q.X&&q.X.side)+')');
  // (home behind a river with no crossing: a flank)
  q=rig({rivers:[{x:.85,crossings:[]}],seed:3},(f,c,r)=>{place(r.id,t.BW*.55,mid());place(f.id,t.BW*.55-40,mid());place(c.id,t.BW*.2,mid())});
  ok(q.X&&q.X.side!=='E'&&q.X.x<q.B.terrain.ai.river.x0,'home behind a river with no crossing: off by '+(q.X&&q.X.side)+' on their own bank');
  // (home walled off by mountains: a flank)
  q=rig({rocks:[.06,.2,.34,.48,.62,.76,.9].map(y=>({x:1,y,r:110,h:8})),seed:3},(f,c,r)=>{place(r.id,t.BW*.55,mid());place(f.id,t.BW*.55-40,mid());place(c.id,t.BW*.2,mid())});
  ok(!q.B.exits.some(X=>X.side==='E')&&q.X&&q.X.side!=='E','home walled off by mountains (no way off east): off by '+(q.X&&q.X.side));
  // (withdrawing: the same rule; riders across the way home turn your withdrawal to a flank)
  q=rig('none',(f,c,r)=>{place(r.id,t.BW*.5,mid());place(f.id,t.BW*.5-40,mid());place(c.id,t.BW*.7,mid())});
  const B=q.B;B.groups[q.r.id].withdraw();ok(q.r.exitTo&&q.r.exitTo.side!=='E','a withdrawal with riders across the way home goes by a flank too ('+q.r.exitTo.side+')');}

 // ---- your withdraw order: the safest way; the order line to it; those who get away counted
 {let B=lab({leftGroups:[{type:'hum_foot',count:15}],rightGroups:[{type:'militia',count:30}],size:'large'});B.cmdT=1e9;
  const l=Object.values(B.groups).find(g=>g.team===0),r=Object.values(B.groups).find(g=>g.team===1);place(l.id,t.BW*.25,mid());place(r.id,t.BW*.42,mid());r.firm=true;r.hold();
  l.withdraw();ok(l.exitTo&&l.exitTo.side==='W'&&l.ax===l.exitTo.x,'withdrawing with the enemy before them and their own edge nearer than theirs: straight back west ('+(l.exitTo&&l.exitTo.side)+')');
  B=lab({leftGroups:[{type:'hum_foot',count:15}],rightGroups:[{type:'militia',count:30}],size:'large'});B.cmdT=1e9;
  const l2=Object.values(B.groups).find(g=>g.team===0),r2=Object.values(B.groups).find(g=>g.team===1);place(l2.id,t.BW*.32,mid());place(r2.id,t.BW*.12,mid());r2.firm=true;r2.hold();
  l2.withdraw();const X=l2.exitTo,line=t.exitFor({x:t.BW*.32,y:mid(),team:0,grp:l2.id});ok(X&&X.side!=='W'&&(X.side==='N'||X.side==='S'?Math.abs(line.y-X.y)<1e-9:Math.abs(line.x-X.x)<1e-9),'with the enemy between them and their edge: off by '+(X&&X.side)+', and the order line goes there');
  const m=t.grpUnits(l2.id),n=m.length;B.paused=false;let fr=0;while(!L.session.result&&fr++<60*90)t.updateBattle(1/60);
  const rep=L.report(),ex=rep.final.units.filter(u=>u.side==='left'&&u.exitCause==='withdrawn').length;
  ok(B.retreat&&B.withdrawn===n&&ex===n&&m.every(u=>u.left&&u.hpLeft>0&&nearSide(u,X.side)),'all '+n+' get away by it, counted withdrawn (lab report: '+ex+'), and the battle ends in your retreat');}
 // (a campaign battle: those who withdraw are not lost)
 {L.exit();G.mode='world';G.modal=false;W.lords=[];W.monsters=[];t.bandits.length=0;P.troops={hum_spear:12};P.comps={};
  const band=t.asParty({kind:'bandits',troops:Array(14).fill('militia'),x:P.x+8,y:P.y,cool:0,ld:t.newChief('bandits',2)});t.bandits.push(band);
  G.enc={kind:'party',ref:band,list:band.troops.slice(),allies:[],foes:[],mine:true};G.loot=null;G.encAgain=null;t.startBattle({enemies:G.enc.list,tournament:false,lv:1,deploy:false});const B=t.B;
  ok(t.BFIELD&&B.fsize===t.BFIELD.key&&said.some(m=>m.includes(t.BFIELD.n+' field.')),'a campaign battle is fought on a '+t.BFIELD.n.toLowerCase()+' field, named as it starts');
  const mine=Object.values(B.groups).filter(g=>g.team===0),theirs=Object.values(B.groups).filter(g=>g.team===1),Z=t.fieldZone(0);
  ok(mine.every(g=>g.ax>=Z.x0&&g.ax<=Z.x1)&&theirs.every(g=>g.ax>=t.fieldZone(1).x0&&g.ax<=t.fieldZone(1).x1)&&Z.x0===t.BFIELD.back,'its lines form up in their zones, '+Z.x0+' px of ground behind them');
  for(const g of mine)g.withdraw();B.paused=false;let fr=0;while(t.B&&!B.over&&fr++<60*120)t.updateBattle(1/60);
  const away=B.units.filter(u=>u.team===0&&u.left).length,dead=B.units.filter(u=>u.team===0&&u.hp<=0&&!u.left&&!u.hero).length,lost=Object.values(B.lost).reduce((a,n)=>a+n,0);
  ok(B.retreat&&away===B.withdrawn&&away>0&&lost===dead,'your retreat: '+away+' got away ('+B.withdrawn+' withdrawn), '+lost+' lost, as many as fell');
  if(t.B){B.endT=0;t.updateBattle(1/60)}const after=P.troops.hum_spear||0;ok(!t.B&&t.BH===t.FIELD_H&&after<=12&&after>=12-lost,'after it the field is given back and those who got away are still in your band ('+P.troops.hum_spear+' spearmen)');
  G.mode='world';G.modal=false;G.loot=null;G.enc=null;}

 // ---- a full AI battle at each size, to the end; most who break run home (own side, flanks if cut off)
 const homeRun=[0,0];for(const [i,k] of SIZES.entries()){const B=lab({leftGroups:[{type:'hum_foot',count:30},{type:'hum_bow',count:15},{type:'hum_knight',count:6}],rightGroups:[{type:'orc_grunt',count:30},{type:'orc_hunter',count:15},{type:'hum_knight',count:6}],
   deploy:true,ai:true,size:k,seed:11+i,ground:'auto',terrain:['open','hill','forest','open','hill'][i],climate:['grass','desert','grass','frost','grass'][i]});
  t.beginFight();B.paused=false;const a=performance.now();let n=0;while(!L.session.result&&B.t<300){t.updateBattle(1/60);n++}
  const by={};for(const u of B.units)if(u.left||u.hp>0&&u.rout){const X=(B.groups[u.grp]||u).exitTo,s=(u.team?'R':'L')+(X?X.side:'?');by[s]=(by[s]||0)+1;if(u.rout){homeRun[1]++;if(X&&X.side===(u.team?'E':'W'))homeRun[0]++}}
  const rep=L.report(),exited=rep.final.units.filter(u=>u.exited).length;
  ok(!!L.session.result&&B.t<300&&exited===B.units.filter(u=>u.left).length,k+': an AI battle ends ('+L.session.result+') at '+B.t.toFixed(0)+' s, '+exited+' off the field '+JSON.stringify(by)+' ('+(performance.now()-a).toFixed(0)+' ms for '+n+' frames)')}
 ok(homeRun[1]>0&&homeRun[0]>=homeRun[1]*.7,'of all who broke in those battles, '+homeRun[0]+' of '+homeRun[1]+' ran for their own edge');
 L.exit();

 // ---- timings: 400 and 800 soldiers at each size (INFO; the lab's 200-a-side cap lifted here as visual/battleperf.js does)
 L.validate=function(raw){const c=keep.validate.call(this,{...raw,leftGroups:raw.leftGroups.map(g=>({...g,count:Math.min(g.count,20)})),rightGroups:raw.rightGroups.map(g=>({...g,count:Math.min(g.count,20)}))});
  c.leftGroups.forEach((g,i)=>g.count=raw.leftGroups[i].count);c.rightGroups.forEach((g,i)=>g.count=raw.rightGroups[i].count);return c};
 const split=(type,n)=>{const r=[];while(n>0){r.push({type,count:Math.min(100,n)});n-=100}return r},army=(n,[a,b,c])=>[...split(a,Math.round(n*.5)),...split(b,Math.round(n*.3)),...split(c,n-Math.round(n*.5)-Math.round(n*.3))];
 for(const N of [400,800])for(const k of SIZES){const B=lab({leftGroups:army(N/2,['hum_foot','hum_bow','hum_knight']),rightGroups:army(N/2,['dw_clan','dw_sling','hum_knight']),ai:true,size:k,seed:42,distance:400,ground:{recipe:'hills',seed:42}});
  let a=performance.now();t.frame();const paint=performance.now()-a;B.paused=false;for(let f=0;f<30;f++)t.updateBattle(1/60);
  a=performance.now();for(let f=0;f<60;f++)t.updateBattle(1/60);const sim=(performance.now()-a)/60;a=performance.now();for(let f=0;f<10;f++)t.frame();const draw=(performance.now()-a)/10;
  for(let i=0;i<8;i++)t.camZoom(1);a=performance.now();for(let f=0;f<10;f++)t.frame();const drawIn=(performance.now()-a)/10;
  info(N+' soldiers, '+k+' ('+t.BW+'×'+t.BH+'): simulation '+sim.toFixed(1)+' ms/frame, drawing '+draw.toFixed(1)+' ms whole field, '+drawIn.toFixed(1)+' ms zoomed in; paint '+paint.toFixed(0)+' ms')}
 L.validate=keep.validate;
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{window.toast=toast0;const L=T.BattleLab;if(L.active)L.exit();(0,eval)('FIELD_SIZES.on=false;EXITS.on=false')}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
