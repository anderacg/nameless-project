'use strict';
// Resident patches, species, routines and memories on a small controlled map. Camera visits and animation draws must not
// change who lives there; wildlife stays decorative, and bounded caches/expiry keep a long campaign cheap.
Kit.suite(({ok,info})=>{
 const t=T,A=t.AMBIENT,S=t.AMBV,G=t.G,P=t.P,W=t.W;Kit.begin('soldier',41);Kit.clear();Kit.world();
 const old=t.WM,pn=performance.now,m=new t.WorldMap(192,128,'ambient-test');m.seedNum=119;
 const tile=(x,y,k,c=0,feat=0)=>{const i=y*m.w+x;m.kind[i]=k;m.clim[i]=c;m.feat[i]=feat};
 for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
  if(x<64)tile(x,y,x%16<7?t.T_FOREST:t.T_OPEN);
  else if(x<96)tile(x,y,x%8<3?t.T_WATER:t.T_OPEN,3);
  else if(x<128)tile(x,y,x%8<2?t.T_HILL:t.T_OPEN,2);
  else if(x<160)tile(x,y,x%16<7?t.T_FOREST:t.T_OPEN,1);
  else tile(x,y,x>=176?t.T_WATER:t.T_OPEN);
 }
 for(let y=50;y<59;y++)for(let x=40;x<48;x++)tile(x,y,t.T_WATER,0,2);
 for(let y=112;y<120;y++)for(let x=80;x<88;x++)tile(x,y,t.T_MOUNT,3);
 let now=1e7;const mid=(x,y)=>[(x+.5)*t.TILE,(y+.5)*t.TILE],at=(x,y,f=.3)=>{[P.x,P.y]=mid(x,y);G.clock=t.DAY*f;S.list.length=0;S.t=0},all=()=>{const h=[];for(let y=0;y<16;y++)for(let x=0;x<24;x++)h.push(...t.ambHomes(x,y));return h};
 try{
  t.useWorld(m);A.on=true;S.q=123;performance.now=()=>now;t.ambMemory();
  const residents=all(),kinds=new Set(residents.map(h=>h.k)),species=new Set(residents.map(h=>h.species));
  ok(t.AMB_KINDS.filter(k=>k!=='crow').every(k=>kinds.has(k)),'every resident kind finds a fitting habitat in the grass, marsh, desert, frost and coast fixture');
  ok(residents.every(h=>t.ambHabitat(h.k,h.x,h.y)),'every resident belongs to its own habitat, away from buildings and invalid ground');
  ok(['sparrow','pigeon','raven'].every(k=>species.has(k)),'meadows have songbirds, woods pigeons and frost ravens');
  const home=residents.find(h=>h.k==='peck'),cx=Math.floor(home.x/t.TILE/A.homes.tiles),cy=Math.floor(home.y/t.TILE/A.homes.tiles),before=JSON.stringify(t.ambHomes(cx,cy)),q=S.q;
  ok(S.q===q&&t.ambHomes(cx,cy)===t.ambHomes(cx,cy),'looking up an existing patch does not draw the animation PRNG');
  for(let i=0;i<50;i++)t.ambR();P.x=1700;P.y=400;S.homes.clear();
  ok(JSON.stringify(t.ambHomes(cx,cy))===before,'after travel and different animation draws, the same patch has the same residents');
  const empty=JSON.stringify(t.ambHomes(10,14));S.homes.clear();
  ok(empty==='[]'&&JSON.stringify(t.ambHomes(10,14))===empty,'empty mountain country remains empty after a return visit');
  m.seedNum++;S.homes.clear();const other=JSON.stringify(all());m.seedNum--;S.homes.clear();
  ok(other!==JSON.stringify(all()),'a different world seed changes the resident distribution');
  t.LAND.fill(0);const tame=A.tame;A.tame=0;S.homes.clear();const busy=all();A.tame=tame;t.LAND.fill(-1);S.homes.clear();
  ok(busy.length===0&&residents.length>0,'busy inhabited land suppresses residents using the shared tame factor');
  const forest=residents.find(h=>h.k==='bat'),desert=residents.find(h=>h.k==='lizard'),wet=residents.find(h=>h.k==='duck'),coast=residents.find(h=>h.k==='gull');
  at(forest.x/t.TILE-.5,forest.y/t.TILE-.5,.03);const dawn=t.ambMul('flock');G.clock=t.DAY*.3;const noon=t.ambMul('flock');
  ok(dawn>noon&&!t.ambientCan('bat',forest.x,forest.y)&&!t.ambientCan('owl',forest.x,forest.y),'dawn is livelier than midday; bats and owls stay out of daylight');
  G.clock=t.DAY*.53;ok(t.ambientCan('bat',forest.x,forest.y),'bats leave their woodland roosts at dusk');
  G.clock=t.DAY*.75;ok(t.ambientCan('owl',forest.x,forest.y),'owls hunt over their woods at night');
  at(desert.x/t.TILE-.5,desert.y/t.TILE-.5);ok(t.ambientCan('lizard',desert.x,desert.y)&&!t.ambHabitat('hare',desert.x,desert.y)&&!t.ambHabitat('squirrel',desert.x,desert.y),'the desert has lizards, not meadow hares or squirrels');
  at(41,53);ok(!t.ambHabitat('gull',P.x,P.y)&&t.ambHabitat('fish',P.x,P.y),'an inland lake supports fish but is not a gull colony');
  at(coast.x/t.TILE-.5,coast.y/t.TILE-.5);ok(t.ambientCan('gull',coast.x,coast.y),'gulls belong to coastal water beside land');
  const snow=residents.find(h=>h.k==='hare'&&t.climAt(h.x,h.y)==='frost');ok(snow&&t.ambSpawn('hare',snow.x,snow.y).white===1,'frost warrens have snow hares');
  ok(residents.filter(h=>h.k==='flock'&&t.climAt(h.x,h.y)==='frost').every(h=>h.species==='raven'),'frost flocks keep their raven plumage when they land');
  // The same roost/feeding pair reverses direction at dusk and settles instead of flying through its destination forever.
  const route=residents.find(h=>h.k==='flock'&&h.feed&&h.roost);G.clock=t.DAY*.03;const out=t.ambPlace(t.ambSpawn('flock',route.x,route.y),route);
  G.clock=t.DAY*.53;const back=t.ambPlace(t.ambSpawn('flock',route.x,route.y),route);
  ok(out.x===route.roost.x&&out.route===route.feed&&back.x===route.feed.x&&back.route===route.roost,'flocks fly from roost to feeding ground at dawn and reverse that route at dusk');
  let live=true;for(let i=0;i<250&&live&&back.k==='flock';i++){back.t+=.05;live=t.ambStep(back,.05,[],()=>true)}
  ok(back.k==='peck'&&back.st==='perch'&&back.alt===route.roost.alt,'returning birds bank, descend and perch at their roost');
  const roofId=999,roofTile=64*m.w+171;t.LOT[roofId]={id:roofId,x:171,y:64,n:1};t.OCC[roofTile]=roofId;
  const roof=t.ambRoost(170.5*t.TILE,64.5*t.TILE),roofBird=t.ambSpawn('peck',170.5*t.TILE,64.5*t.TILE);roofBird.home={roost:roof};G.clock=t.DAY*.75;
  for(let i=0;i<150&&roofBird.st!=='perch';i++){roofBird.t+=.05;t.ambStep(roofBird,.05,[],()=>true)}
  ok(roof&&roof.alt===12&&roofBird.st==='perch'&&roofBird.x===roof.x,'a bird can return to a nearby roof and perch there');delete t.LOT[roofId];t.OCC[roofTile]=0;
  // A bird driven off stays away on a return visit, until campaign time (not camera or real time) has passed.
  const e=t.ambPlace(t.ambSpawn('peck',home.x,home.y),home);G.clock=t.DAY*.3;
  t.ambStep(e,.05,[{x:e.x+2,y:e.y}],()=>true);const until=S.quiet.get(home.key);S.list.length=0;S.homes.clear();
  ok(e.st==='fly'&&until>t.Clock.hours()&&t.ambHomes(cx,cy).some(h=>h.key===home.key),'disturbance belongs to the fixed home, surviving a camera return and habitat-cache eviction');
  P.x=home.x+70;P.y=home.y;const cam={x:P.x-t.VW/2,y:P.y-t.VH/2},every=A.peck.every;A.peck.every=.0001;
  for(const h of t.ambHomeView(cam,t.vis()))if(h.k==='peck'&&h.key!==home.key)S.quiet.set(h.key,t.Clock.hours()+8);
  for(let i=0;i<5;i++){now+=100;t.ambientWorld([],cam,t.vis())}
  ok(!S.list.some(b=>b.hk===home.key),'a disturbed resident is not spawned again when the camera comes back');
  G.clock+=(A.homes.quiet+.1)/24*t.DAY;t.ambMemory();ok(!S.quiet.has(home.key),'a disturbed patch recovers after its quiet hours');
  S.list.length=0;for(let i=0;i<5;i++){now+=100;t.ambientWorld([],cam,t.vis())}A.peck.every=every;
  ok(S.list.some(b=>b.hk===home.key),'the same resident home becomes available again after the quiet period');S.quiet.clear();
  // Terrain checks apply to the whole step, including diagonal corners.
  at(47,30);const hare=t.ambSpawn('hare',P.x,P.y);tile(48,30,t.T_WATER);const hx=hare.x,hy=hare.y;
  ok(!t.ambMove(hare,t.TILE,0)&&hare.x===hx&&hare.y===hy,'a running hare cannot step into water');
  tile(48,30,t.T_WATER);tile(48,31,t.T_OPEN);ok(!t.ambMove(hare,t.TILE,t.TILE),'a ground animal cannot cut a diagonal corner through water');
  const duck=t.ambSpawn('duck',wet.x,wet.y);ok(!t.ambMove(duck,104.5*t.TILE-duck.x,0),'a swimming duck cannot move onto dry ground');
  const sq=t.ambSpawn('squirrel',20.5*t.TILE,30.5*t.TILE);sq.dir=1;t.ambStep(sq,.05,[{x:sq.x+5,y:sq.y}],()=>true);
  ok(sq.st==='dart'&&sq.dir===-1,'a startled squirrel darts away from the approaching figure');
  // Ended battles leave a one-day scavenger anchor, including while the camera is elsewhere. Live armies move their anchor.
  const day=G.day;G.clock=t.DAY*.3;const point={x:800,y:500};t.worldEmit('fight:ended',{fight:point,won:[],lost:[]});const key='m50:31';
  ok(S.meals.has(key)&&t.ambAnchors().some(a=>a[0]===key),'a battle leaves a scavenger feeding site after the fight disappears');
  G.day++;t.ambMemory();ok(!S.meals.has(key),'battle remains stop attracting birds after one campaign day');G.day=day;
  const army={uid:'ambient-army',x:900,y:600,tc:{hum_levy:20},state:'march'};W.patrols.push(army);
  const a0=t.ambAnchors().find(a=>a[0]==='aambient-army');army.x+=30;const a1=t.ambAnchors().find(a=>a[0]==='aambient-army');W.patrols.splice(W.patrols.indexOf(army),1);
  ok(a0&&a1&&a1[1]===a0[1]+30,'scavenger anchors follow a large army as it marches');
  for(let i=0;i<140;i++){t.ambQuiet({hk:'q'+i});t.ambRemains({x:(i+.5)*t.TILE,y:700})}
  ok(S.homes.size<=A.homes.cache&&S.quiet.size<=A.homes.memories&&S.meals.size<=A.homes.memories,'habitat, disturbance and remains caches are bounded on long journeys');
  G.clock=t.DAY*.05;const east=t.ambShadow(40);G.clock=t.DAY*.45;const west=t.ambShadow(40);ok(east[0]>0&&west[0]<0,'bird shadows move to the opposite side through the daylight hours');
  // All new pictures are valid in the existing render passes, including frost/desert scavengers.
  at(30,30);S.list.length=0;for(const k of ['bat','owl','heron','duck','lizard','vulture']){const b=t.ambSpawn(k,P.x+20,P.y);b.t=1;S.list.push(b);if(t.AMB_GROUND[k])t.ambGround(b,{x:P.x-60,y:P.y-60})}
  for(const species of ['crow','raven','vulture'])S.list.push(Object.assign(t.ambSpawn('crow',P.x,P.y),{species,t:1}));t.ambientFlat({x:0,y:0});t.ambientAir({x:0,y:0});
  ok(!ERR.length,'all climate sprites and both scavenger variants draw through the shared layers');
  info(residents.length+' residents across 384 patches; '+kinds.size+' resident kinds; at most '+A.homes.cache+' patches retained');
 }finally{performance.now=pn;t.useWorld(old);A.on=false}
});
