'use strict';
// Every army's middle is no one's (the owner, 2026-10-31: "an invisible point at the center now hero can be placed any where in the
// army circle"; "make sure that all other lords, bandits and other world entity apply the same concept"): a lone beast, a pack, your
// army, a lord's, a band led by a chief not among its troops, a chief counted among them; each leader marches to his place (the
// middle unless placed); the rings and a beast's marker on the middle; after a fight the middle where the survivors stand
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+240,home.y+200);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);
 for(let y=ty-20;y<=ty+20;y++)for(let x=tx-20;x<=tx+25;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;t.WM.kind[i]=t.T_OPEN;t.WM.edge[i]=0;t.WM.elev[i]=64}
 const monster=n=>t.asMonster({id:'wolf',n,lv:1,x:P.x+25,y:P.y,hx:P.x+25,hy:P.y,cool:0});
 const lone=monster(1),single=t.MarchArmy.of(lone);ok(single.units.length===1&&!single.units[0].pivot&&single.rows[0].x===0&&single.rows[0].y===0,'a lone creature marches to its army\'s middle, none of it pinned there');
 const one=single.units[0];let near=true;
 for(let i=0;i<240;i++){if(i<60)lone.x+=.2;else if(i<120)lone.y+=.2;else if(i<180)lone.x-=.2;else lone.y-=.2;single.step(1/30);near&&=Math.hypot(one.x-lone.x,one.y-lone.y)<4}
 ok(near&&single.units[0]===one,'turning, the lone creature keeps to its middle, never far off it');
 for(let i=0;i<120;i++)single.step(1/30);const still={x:one.x,y:one.y};for(let i=0;i<120;i++)single.step(1/30);ok(Math.hypot(one.x-still.x,one.y-still.y)<1e-6&&Math.hypot(one.x-lone.x,one.y-lone.y)<.5,'stopped, it settles on the middle: no orbit or jitter');
 const pack=monster(6),army=t.MarchArmy.of(pack);ok(army.units.length===6&&!army.units.some(u=>u.pivot),'a pack of six marches six, none of them its middle');
 for(let i=0;i<180;i++){if(i<90)pack.x+=.15;else pack.y+=.15;army.step(1/30)}for(let i=0;i<480;i++)army.step(1/30);
 ok(army.units.every(u=>u.goal&&Math.hypot(u.x-u.goal.x,u.y-u.goal.y)<.6),'its fighters form round the middle and settle');
 {const first=army.units[0];t.partyRoster(pack).add('wolf',1);army.sync();ok(army.units.length===7&&army.units.includes(first),'recruitment keeps the marchers it had');t.partyRoster(pack).remove('wolf',1);army.sync();ok(army.units.length===6&&army.units.includes(first),'ordinary losses keep the survivors')}
 P.troops={hum_foot:3};const own=t.MarchArmy.of(P),lord=t.W.lords[0];lord.troops=['hum_foot','hum_foot'];lord.x=P.x+40;lord.y=P.y;
 ok(own.units.some(u=>u.row==='hero'&&u.type==='hero')&&t.marchRows(P).find(r=>r.id==='hero').x===0,'your hero one of your marchers, at the middle until you move him');
 // (the owner, 2026-10-31: "the army radius move too fast, it should follow the speed of all units")
 {const x={x:P.x,y:P.y};for(let i=0;i<200;i++)own.step(.05);const x0=P.x;for(const u of own.units)u.x-=60;for(let i=0;i<10;i++){P.x+=2;own.step(.05)}const held=P.x-x0;
  // (the owner, 2026-11-01: "calculate the center based on unit's position", MARCH_MOVE.menCentre: the army is where its men are,
  // its guide, what is moved, at most MARCH_MOVE.lead ahead of them: held back with them; marching, its guide goes as it is told,
  // the army a lead behind it)
  const lead=(t.MARCH_MOVE.lead[0]+t.MARCH_MOVE.lead[1]*t.moveStep(t.marchPace(P),1)*t.MARCH_MOVE.road),g1=own.gx;for(let i=0;i<300;i++)own.step(.05);const x1=P.x,g2=own.gx;for(let i=0;i<40;i++){P.x+=1;own.step(.05)}const free=P.x-x1,went=own.gx-g2;Object.assign(P,x);t.MARCH_ARMIES.delete(P);
  ok(held<10&&g1-x0-held<=lead+1e-6&&Math.abs(went-40)<1e-6&&free>40-lead,'its middle waits with men held back (sent 20 px ahead of men 60 px behind, it went '+held.toFixed(1)+', its guide '+(g1-x0).toFixed(1)+'), and goes as it is told while they keep up (its guide '+went.toFixed(1)+' of 40, the army '+free.toFixed(1)+', a lead of '+lead.toFixed(1)+' at most)')}
 // (the owner, 2026-10-31: "the army ring speed is based on the overall unit speed so it can keep centered")
 {const x={x:P.x,y:P.y},A=t.MarchArmy.of(P);for(let i=0;i<200;i++)A.step(.05);const v=t.moveStep(t.MAP_BASE*t.travelMul(),.05),cam={x:0,y:0},arc=t.ctx.arc;let off=0,pace=0,last=null;
  for(let i=0;i<160;i++){const was=A.units.map(u=>[u.x,u.y]);P.x+=v;A.step(.05);if(i<60)continue;const arcs=[],ents=[];t.marchCircle(ents,P,cam);
   try{t.ctx.arc=function(x,y,...r){arcs.push([x,y]);return arc.call(this,x,y,...r)};ents.forEach(e=>e.f())}finally{t.ctx.arc=arc}
   const T=A.targets(),M=A.units.map(u=>{const p=T.find(q=>q.row===u.row&&q.index===u.index);return[u.x-p.x+P.x,u.y-p.y+P.y]}),med=k=>M.map(q=>q[k]).sort((a,b)=>a-b)[M.length>>1];
   const steps=A.units.map((u,j)=>Math.hypot(u.x-was[j][0],u.y-was[j][1])).sort((a,b)=>a-b),man=steps[steps.length>>1];
   off=Math.max(off,Math.hypot(arcs[0][0]-med(0),arcs[0][1]-med(1)));if(last)pace=Math.max(pace,Math.abs(Math.hypot(arcs[0][0]-last[0],arcs[0][1]-last[1])-man));last=arcs[0]}
  Object.assign(P,x);t.MARCH_ARMIES.delete(P);
  ok(off<.01&&pace<.1,'marching, its ring drawn on the middle its men make ('+off.toFixed(3)+' px off), going as the median man goes ('+pace.toFixed(3)+' px a moment apart at most)')}
 {const A=t.MarchArmy.of(lord),r=A.rows.find(r=>r.id==='leader'),f=A.rows.find(r=>r.id!=='leader');ok(r&&Math.abs(r.y)<1e-6&&f&&r.x<f.x&&r.type===t.charOf(lord).key&&A.units.filter(u=>u.row==='leader').length===1,'a lord marches in his army as your hero does: the row leader, in the middle of it behind his foot (his style: world/marchstyles.js)')}
 {const band=t.asParty({kind:'bandits',ld:t.newChief('bandits',1),troops:['militia','militia'],x:P.x+30,y:P.y-30});ok(t.MarchArmy.of(band).units.some(u=>u.row==='leader'),'a band led by a chief not among its troops: he marches too, its leader')}
 {const chief=t.asParty({kind:'bandits',ld:t.newChief('bandits',1),troops:['militia','chief'],x:P.x+30,y:P.y}),rows=t.marchRows(chief),c=rows.find(r=>r.type==='chief');ok(c&&!rows.some(r=>r.id==='leader')&&Math.abs(c.y)<1e-6&&c.x<rows.find(r=>r.type==='militia').x,'a chief counted among his troops: his group in the middle behind the screen, no second leader')}
 const cam={x:P.x-100,y:P.y-100},arc=t.ctx.arc,arcs=[],draw=t.ctx.drawImage,images=[];
 // (with the outline off (march.js MARCH_RING): the circles; marchring.js the outline)
 window.eval('BANNERQ=[]');const ents=[];t.MARCH_RING.on=false;try{pack.draw(ents,cam,t.vis());t.ctx.arc=function(x,y,r,...rest){arcs.push({x,y,r});return arc.call(this,x,y,r,...rest)};ents.forEach(e=>e.f())}finally{t.ctx.arc=arc;t.MARCH_RING.on=true}
 {const a=t.MARCH_ARMIES.get(pack),e=[],n=arcs.length,nb=t.BANNERQ.length;pack.draw(e,cam,t.vis());try{t.ctx.arc=function(x,y,r,...rest){arcs.push({x,y,r});return arc.call(this,x,y,r,...rest)};e.forEach(q=>q.f())}finally{t.ctx.arc=arc}window.eval('BANNERQ=BANNERQ.slice(0,'+nb+')');
  ok(arcs.length===n&&a.ring?.out[0].n>=1&&a.units.every(u=>a.ring.inside(u.x-pack.x,u.y-pack.y)),'with the outline on, its ring is the outline of the ground its beasts stand on, every beast inside it, no circle');arcs.length=n}
 {const m=t.MARCH_ARMIES.get(pack).mid||pack;ok(arcs.length===2&&arcs.every(p=>p.x===m.x-cam.x&&p.y===m.y-cam.y)&&Math.hypot(m.x-pack.x,m.y-pack.y)<1,'both travel rings are centred on the middle its beasts make, settled on the pack\'s own ('+Math.hypot(m.x-pack.x,m.y-pack.y).toFixed(2)+' px)')}
 ok(t.BANNERQ.filter(q=>q.o===pack&&q.marker).length===1,'a beast pack queues one small marker, over its middle');
 try{t.ctx.drawImage=function(s,...rest){images.push(s);return draw.call(this,s,...rest)};t.drawBanners(cam)}finally{t.ctx.drawImage=draw}
 ok(images.includes(t.bandMarkerSprite(pack.look().col)),'the beasts\' marker renders through the banner layer');
 const kind=Object.keys(t.CRITTERS).find(k=>!t.CRITTERS[k].live),herd=t.asHerd({crit:true,id:kind,n:3,x:P.x+15,y:P.y,dir:1});window.eval('BANNERQ=[]');const wildlife=[];herd.draw(wildlife,cam,t.vis());wildlife.forEach(e=>e.f());ok(t.BANNERQ.some(q=>q.o===herd&&q.marker),'wildlife groups get the same small band marker at their existing first animal');
 const before=new Map(army.units.map(u=>[u,{x:u.x,y:u.y}]));G.enc={kind:'monster',ref:pack,list:pack.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B,a=b.world,radius={x:a.x,y:a.y,r:a.r},actors=b.units.filter(u=>u.team===1);
 ok(actors.length===pack.n&&actors.every(u=>{const q=a.world(u),p=before.get(u.marchUnit);return p&&Math.hypot(q.x-p.x,q.y-p.y)<1e-6}),'the pack\'s fighters enter combat one-for-one at their actual positions');
 for(const u of actors)u.x+=12;const ends=actors.map(u=>a.world(u)),mid={x:ends.reduce((n,p)=>n+p.x,0)/ends.length,y:ends.reduce((n,p)=>n+p.y,0)/ends.length};a.finish(b);
 ok(Math.hypot(pack.x-mid.x,pack.y-mid.y)<1e-6,'after combat the pack\'s middle where its survivors stand, not snapped back');
 ok(a.x===radius.x&&a.y===radius.y&&a.r===radius.r,'the yellow combat boundary remains fixed when the army\'s middle moves');
 // (the owner, 2026-11-01: his hero placed at the front of a saved layout, marching alone: the ring off him, swinging round him as
 // the march turned) a saved layout is centred on the groups it has now
 {P.troops={};P.comps={};const was=P.army.march;P.army.march={hero:{x:60,y:0,face:0},gone_grp:{x:-40,y:0,face:0}};
  try{const rows=t.marchRows(P),h=rows.find(r=>r.id==='hero');ok(rows.length===1&&Math.abs(h.x)<.5&&Math.abs(h.y)<.5,'your hero alone, placed at the front of a saved layout: he is its middle now ('+h.x.toFixed(1)+', '+h.y.toFixed(1)+')');
   const A=t.MarchArmy.of(P);A.sync();let far=0;
   for(let i=0;i<360;i++){const k=i/90|0;P.x+=[.3,0,-.3,0][k%4];P.y+=[0,.3,0,-.3][k%4];A.step(1/30);const u=A.units.find(q=>q.row==='hero'),r=t.marchOuter(P),m=A.mid,c=m&&Math.hypot(m.x-P.x,m.y-P.y)<r?m:P;if(u)far=Math.max(far,Math.hypot(u.x-c.x,u.y-c.y))}
   ok(far<t.marchOuter(P),'marching and turning, he stays inside his ring, never swung round it (at most '+far.toFixed(1)+' px from where it is drawn, its radius '+t.marchOuter(P).toFixed(1)+')')}
  finally{if(was)P.army.march=was;else delete P.army.march}}
});
