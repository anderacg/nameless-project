'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+240,home.y+200);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);
 for(let y=ty-20;y<=ty+20;y++)for(let x=tx-20;x<=tx+25;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;t.WM.kind[i]=t.T_OPEN;t.WM.edge[i]=0;t.WM.elev[i]=64}
 const monster=n=>t.asMonster({id:'wolf',n,lv:1,x:P.x+25,y:P.y,hx:P.x+25,hy:P.y,cool:0});
 const lone=monster(1),single=t.MarchArmy.of(lone);ok(single.units.length===1&&single.units[0].pivot&&single.units[0].x===lone.x&&single.units[0].y===lone.y,'a lone creature is its own leader and circle centre');
 const one=single.units[0];let exact=true,bounded=true;
 for(let i=0;i<240;i++){const p={x:one.x,y:one.y};if(i<60)lone.x+=.2;else if(i<120)lone.y+=.2;else if(i<180)lone.x-=.2;else lone.y-=.2;single.step(1/30);exact&&=one.x===lone.x&&one.y===lone.y;bounded&&=Math.hypot(one.x-p.x,one.y-p.y)<.201}
 ok(exact&&bounded&&single.units[0]===one&&single.queries===0,'turning a lone band has no offset chasing, extra pathfinding or speed burst');
 const still={x:one.x,y:one.y};for(let i=0;i<120;i++)single.step(1/30);ok(one.x===still.x&&one.y===still.y,'a stopped lone creature does not orbit or jitter around its radius');
 const pack=monster(6),army=t.MarchArmy.of(pack),pivot=army.units.find(u=>u.pivot);ok(army.units.length===6&&army.units.filter(u=>u.pivot).length===1,'a multi-unit pack selects one existing fighter without adding a unit');
 for(let i=0;i<180;i++){if(i<90)pack.x+=.15;else pack.y+=.15;army.step(1/30)}for(let i=0;i<480;i++)army.step(1/30);
 ok(pivot.x===pack.x&&pivot.y===pack.y&&army.units.includes(pivot),'pack pivot stays centred on the actual travelling leader');
 ok(army.units.filter(u=>!u.pivot).every(u=>u.goal&&Math.hypot(u.x-u.goal.x,u.y-u.goal.y)<.6),'other fighters form around their leader and settle');
 t.partyRoster(pack).add('wolf',1);army.sync();ok(army.units.length===7&&army.units.find(u=>u.pivot)===pivot,'recruitment retains the existing pack leader');t.partyRoster(pack).remove('wolf',1);army.sync();ok(army.units.length===6&&army.units.find(u=>u.pivot)===pivot,'ordinary roster losses retain a surviving pivot');
 P.troops={hum_foot:3};const own=t.MarchArmy.of(P),lord=t.W.lords[0];lord.troops=['hum_foot','hum_foot'];lord.x=P.x+40;lord.y=P.y;
 ok(!own.units.some(u=>u.pivot)&&t.marchRows(P).find(r=>r.id==='hero').x===0&&t.marchSeparateLeader(P),'player army remains anchored on its separate hero');
 ok(!t.MarchArmy.of(lord).units.some(u=>u.pivot)&&t.marchSeparateLeader(lord),'lord armies remain anchored on their existing lord');
 const chief=t.asParty({kind:'bandits',ld:t.newChief('bandits',1),troops:['militia','chief'],x:P.x+30,y:P.y});ok(t.MarchArmy.of(chief).units.find(u=>u.pivot).type==='chief','a chieftain already counted as a troop remains the pivot');
 const cam={x:P.x-100,y:P.y-100},arc=t.ctx.arc,arcs=[],draw=t.ctx.drawImage,images=[];
 window.eval('BANNERQ=[]');const ents=[];pack.draw(ents,cam,t.vis());try{t.ctx.arc=function(x,y,r,...rest){arcs.push({x,y,r});return arc.call(this,x,y,r,...rest)};ents.forEach(e=>e.f())}finally{t.ctx.arc=arc}
 ok(arcs.length===2&&arcs.every(p=>p.x===pack.x-cam.x&&p.y===pack.y-cam.y),'both travel rings are centred on the visible pack leader');
 ok(t.BANNERQ.filter(q=>q.o===pack&&q.marker).length===1,'monster pack queues one small leader marker');
 try{t.ctx.drawImage=function(s,...rest){images.push(s);return draw.call(this,s,...rest)};t.drawBanners(cam)}finally{t.ctx.drawImage=draw}
 ok(images.includes(t.bandMarkerSprite(pack.look().col)),'monster marker renders above the leader through the banner layer');
 const kind=Object.keys(t.CRITTERS).find(k=>!t.CRITTERS[k].live),herd=t.asHerd({crit:true,id:kind,n:3,x:P.x+15,y:P.y,dir:1});window.eval('BANNERQ=[]');const wildlife=[];herd.draw(wildlife,cam,t.vis());wildlife.forEach(e=>e.f());ok(t.BANNERQ.some(q=>q.o===herd&&q.marker),'wildlife groups get the same small band marker at their existing first animal');
 const before=new Map(army.units.map(u=>[u,{x:u.x,y:u.y}]));G.enc={kind:'monster',ref:pack,list:pack.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B,a=b.world,radius={x:a.x,y:a.y,r:a.r},actors=b.units.filter(u=>u.team===1);
 ok(actors.length===pack.n&&actors.every(u=>{const q=a.world(u),p=before.get(u.marchUnit);return p&&Math.hypot(q.x-p.x,q.y-p.y)<1e-6}),'existing pivot and followers enter combat one-for-one at their actual positions');
 const leader=actors.find(u=>u.marchUnit===pivot);leader.x+=12;const end=a.world(leader);a.finish(b);ok(Math.hypot(pack.x-end.x,pack.y-end.y)<1e-6,'after combat the band anchor follows its surviving leader instead of snapping it back');
 ok(a.x===radius.x&&a.y===radius.y&&a.r===radius.r,'the yellow combat boundary remains fixed when the travel pivot changes position');
});
