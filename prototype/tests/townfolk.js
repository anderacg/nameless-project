'use strict';
// Townsfolk (world/townfolk.js, data/townfolk.js TOWNFOLK; the owner, 2026-11-15: "Add people to the town and make their daily
// life routines"): the people of the holdings near you, as many as each holds (a hamlet's few, a city's crowd), none far off; their
// day by the clock (indoors by night, out at their door at dawn, walking to work in the morning, some at the square, the market
// or the well at midday, the tavern or their door in the evening), in at once when a band comes near; never standing in a
// building, a field or a wall; drawn only within your sight; TOWNFOLK.on false: none; and never drawing on the world's Math.random.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,W=t.W,F=t.TOWNFOLK,TF=t.TownFolk,TILE=t.TILE;
 Kit.begin('soldier',1);Kit.clear();Kit.world();
 // (the world's Math.random counted while fn runs)
 const r0=Math.random;let draws=0;const counted=fn=>{Math.random=()=>{draws++;return r0()};try{return fn()}finally{Math.random=r0}};
 // (by holding h at share fr of the day, its people made afresh; n moments of d on, the clock on with them as the world's runs it)
 const near=(h,fr)=>{Kit.goTo(h.x,h.y+40);G.clock=t.DAY*fr;TF.of.clear();counted(()=>TF.step(.05));return TF.of.get(h)};
 let inside=0,seen=0;const lots=h=>(h.lots||[]).filter(l=>l.st==='built'||l.st==='building');
 const check=C=>{for(const p of C.ppl){if(p.hid)continue;seen++;const tx=Math.floor(p.x/TILE),ty=Math.floor(p.y/TILE);if(t.occAt(tx,ty)>0||!t.passable(t.tAt(tx,ty)))inside++}};
 const run=(C,n,d=.1)=>counted(()=>{for(let i=0;i<n;i++){G.clock=(G.clock+t.DAY*d/(t.WORLD_PACE*t.DAY_SECONDS))%t.DAY;TF.step(d);check(C)}});
 const city=t.TOWNS.filter(h=>h.lots&&h.kind==='city').sort((a,b)=>b.pop-a.pop)[0],ham=t.TOWNS.find(h=>h.lots&&h.kind==='hamlet');
 // ---- how many: one for every TOWNFOLK.per of its people, least to most
 {const C=near(city,.25),H=near(ham,.25);
  ok(C&&H&&C.ppl.length===t.clamp(Math.round(city.pop/F.per),F.least,F.most)&&H.ppl.length===t.clamp(Math.round(ham.pop/F.per),F.least,F.most)&&C.ppl.length>H.ppl.length,
   'a holding’s people as many as it holds: '+city.name+' (a city of '+city.pop+') '+C.ppl.length+', '+ham.name+' (a hamlet of '+ham.pop+') '+H.ppl.length);
  ok(C.ppl.every(p=>p.home&&p.home.area.length&&(p.child||p.mode)),'each has a home and a role: '+[...new Set(C.ppl.map(p=>p.role))].join(', '));
  ok([...TF.of.keys()].every(h=>Math.hypot(h.x-t.P.x,h.y-t.P.y)<=F.near)&&!TF.of.has(city),'only the holdings near you have theirs ('+[...TF.of.keys()].map(h=>h.name).join(', ')+'), none far off');
  info('city: '+C.ppl.map(p=>p.name+' '+p.role).join(', '))}
 // ---- by night: everyone indoors; at dawn: out at their doors
 {const C=near(city,.75);run(C,30);
  ok(C.ppl.length&&C.ppl.every(p=>p.hid),'by night none are out ('+C.ppl.filter(p=>!p.hid).length+' of '+C.ppl.length+')');
  const D=near(city,.045),door=D.ppl.filter(p=>!p.hid&&p.mode==='door');
  ok(door.length&&door.every(p=>Math.hypot(p.x-p.stand.x,p.y-p.stand.y)<1&&p.home.area.includes(D.walk.at(Math.floor(p.x/TILE),Math.floor(p.y/TILE)))),'at dawn those awake stand at their doors ('+door.length+' of '+D.ppl.length+')')}
 // ---- the morning: from their doors they walk to work, and get there
 {const C=near(city,.045),wk=C.ppl.filter(p=>p.job&&!p.child),from=new Map(wk.map(p=>[p,{x:p.x,y:p.y}]));let moving=0;
  counted(()=>{for(let i=0;i<88;i++){G.clock+=t.DAY*.1/(t.WORLD_PACE*t.DAY_SECONDS);TF.step(.1);check(C);moving=Math.max(moving,wk.filter(p=>p.moving).length)}});
  const there=wk.filter(p=>p.mode==='work'&&!p.wp.length&&!p.pend&&p.job.area.includes(C.walk.at(Math.floor(p.x/TILE),Math.floor(p.y/TILE))));
  ok(wk.length&&moving>0&&there.length>=wk.length*.8&&there.some(p=>Math.hypot(p.x-from.get(p).x,p.y-from.get(p).y)>TILE),
   'in the morning they walk to work: '+there.length+' of '+wk.length+' at it by '+t.Clock.frac.toFixed(2)+' of the day ('+moving+' walking at once)')}
 // ---- midday: some at the square before the centre, the market or the well
 {const C=near(city,.25),noon=C.ppl.filter(p=>p.mode==='noon'),at=noon.filter(p=>C.noon.some(s=>s.area.includes(C.walk.at(Math.floor(p.x/TILE),Math.floor(p.y/TILE)))));
  ok(noon.length>=2&&at.length===noon.length&&noon.some(p=>p.spot===C.square),'at midday some are at the square, the market or the well ('+at.length+' of '+C.ppl.length+', '+noon.filter(p=>p.spot===C.square).length+' at the square)');
  run(C,200);
  // ---- the evening: the tavern where there is one (a brewery's door), else at their doors
  const pub=t.TOWNS.filter(h=>h.lots&&h.lots.some(l=>l.k==='brewery'&&l.st==='built')).sort((a,b)=>Math.hypot(a.x-city.x,a.y-city.y)-Math.hypot(b.x-city.x,b.y-city.y))[0];
  if(pub){const E=near(pub,.42);run(E,40);const tav=E.ppl.filter(p=>p.mode==='tavern');
   ok(E.tavern&&tav.length&&tav.every(p=>p.spot===E.tavern),'in the evening some go to '+pub.name+'’s tavern ('+tav.length+' of '+E.ppl.length+'), the rest chat at their doors')}
  else info('no holding with a brewery: no tavern to look at')
  const E=near(ham,.42);run(E,40);ok(E.ppl.every(p=>p.mode==='door'||p.mode==='chat'||p.mode==='home'||p.mode==='work'&&p.job===E.tavern),'no tavern in '+ham.name+': its evening at their doors')}
 // ---- a whole day: never in a building, a field or a wall, nor on water
 {const C=near(city,.02);run(C,700,.1);check(C);ok(seen>500&&!inside,'never standing in a building, a field or a wall: '+inside+' of '+seen+' looks at them over a day, clock at '+t.Clock.frac.toFixed(2))}
 // ---- a band near: everyone indoors
 {const C=near(city,.15);const b=t.asParty({x:city.x+30,y:city.y+30,n:8,kind:'bandits',list:t.makeEnemies(8,false,'bandits'),t:0,a:0,idle:false,cool:0,ld:null});t.bandits.push(b);
  try{counted(()=>{for(let i=0;i<300;i++){TF.step(.1);check(C)}});ok(C.danger&&C.ppl.every(p=>p.hid),'a band near: everyone hurries in, by day too ('+C.ppl.filter(p=>p.hid).length+' of '+C.ppl.length+')')}finally{t.bandits.splice(t.bandits.indexOf(b),1)}}
 // ---- drawn within your sight only; their tip
 {const C=near(city,.25),cam={x:Math.floor(city.x-t.VW/2),y:Math.floor(city.y-t.VH/2)},V=t.vis(),S=t.yourSight(V),e=[];TF.draw(e,cam,V);
  const n=C.ppl.filter(p=>!p.hid&&S.sees(p.x,p.y,1.3)&&Math.abs(p.x-cam.x-t.VW/2)<t.VW/2&&Math.abs(p.y-cam.y-t.VH/2)<t.VH/2).length;ok(n>0&&e.length>=n,'drawn about the town within your sight ('+e.length+')');
  const sv=S.sees;try{S.sees=()=>false;const e2=[];TF.draw(e2,cam,V);ok(!e2.length,'out of your sight, none')}finally{S.sees=sv}
  const p=C.ppl.find(q=>!q.hid);ok(p&&t.TownFolk.all().includes(p)&&p.tip().includes(p.name)&&p.tip().includes(city.name)&&t.worldObjects().includes(p),'one hovered: '+p.tip().replace(/<[^>]+>/g,' ').trim())
  // (clicked: he greets you, nothing more (the owner, 2026-11-15: "clicking at town folks should not open the city dialogue"))
  {const m0=G.mode,n0=(G.msgs||[]).length,tt=window.toast,said=[];try{window.toast=x=>said.push(String(x));p.meet()}finally{window.toast=tt}
   const hit=t.pickAt(p.x,p.y-3);ok(hit===p,'clicked on, it is him that is picked, not '+(hit&&hit!==p?(hit.name||hit.mapKind):'his holding'));
   ok(G.mode===m0&&!G.town&&said.length===1&&said[0].includes(p.name)&&/“.+”/.test(said[0]),'clicked, he greets you, no holding window: '+said[0])}}
 // ---- where they live (the owner, 2026-11-15: "Are townfolks also live in houses?", then link them): a house's page lists who lives
 // there, each where he is now; one's tip names his house
 {const T=t.TownFolk,C=T.of.get(city)||T.make(city),p=C.ppl.find(q=>q.home?.lot?.k==='house'),l=p&&p.home.lot,R=l?T.residents(city,l):[];
  ok(p&&R.includes(p)&&R.every(q=>q.home.lot===l)&&/lives in a /.test(p.tip()),'each lives somewhere: '+(p?p.name+' '+p.lives()+', with '+(R.length-1)+' more there':'none'));
  t.houseMeet(t.housePick(city,l));const txt=Kit.text();ok(/Living here/.test(txt)&&R.every(q=>txt.includes(q.name))&&txt.includes(p.where()),'the house\'s page lists them, each where he is now ('+R.map(q=>q.name+', '+q.where()).join('; ')+')');t.act('house-close')}
 // ---- TOWNFOLK.on false: none at all
 {F.on=false;try{Kit.goTo(city.x,city.y+40);G.clock=t.DAY*.25;TF.step(.05);const e=[];TF.draw(e,{x:0,y:0},t.vis());ok(!TF.of.size&&!TF.all().length&&!e.length,'TOWNFOLK.on false: no townsfolk')}finally{F.on=true}}
 ok(!draws,'their life draws nothing from the world’s Math.random ('+draws+')');
});
