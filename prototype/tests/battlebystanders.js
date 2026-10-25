'use strict';
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;
 const h=Kit.goHome('Ashford');Kit.goTo(h.x+160,h.y+120);P.troops={hum_foot:2};const foe=t.asParty({kind:'bandits',troops:['militia'],x:P.x+70,y:P.y,cool:0});G.enc={kind:'party',ref:foe,list:foe.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B,a=b.world,avoid=new t.BattleBystanders(a);
 const nav=avoid.nav(P),start=nav.snap({x:a.x+a.r-12,y:a.y},nav.island(P),null,q=>Math.hypot(q.x-a.x,q.y-a.y)<a.r-4&&Math.hypot(q.x-a.x,q.y-a.y)>a.r-30);if(!start)throw Error('no reachable boundary fixture');
 const lord=W.lords[0];Object.assign(lord,start,{inside:null,dead:false,fight:null});lord.troops=['hum_foot','hum_foot','hum_foot'];
 const worker=t.asWorker({...start,id:'avoid-worker',home:h.name,st:'field',job:'farmer',k:'farm',ph:0,moving:false,tx:h.x,ty:h.y,wp:[{x:h.x,y:h.y}]});W.folk.push(worker);
 const herd=t.asHerd({...start,id:'deer',n:3,hx:start.x,hy:start.y,dir:1,t:0,a:0});W.critters.push(herd);
 const refugee=t.asRefugees({...start,n:4,from:h.name,to:h.name,goods:{},purse:5});W.refugees.push(refugee);
 const caravan=t.asParty({...start,cv:true,fac:'vale',troops:['militia'],guards:1,from:h.name,to:h.name,goods:{},dir:1});W.caravans.push(caravan);
 const monster=t.asMonster({...start,id:'bear',n:1,hx:start.x,hy:start.y});W.monsters.push(monster);
 const entities=[lord,worker,herd,refugee,caravan,monster],orders=JSON.stringify([worker.wp,worker.tx,worker.ty,refugee.to,caravan.to,herd.hx,herd.hy]),clock=G.clock;
 avoid.scan();ok(entities.every(o=>avoid.entries.has(o)),'nonparticipant armies, workers, wildlife, refugees, caravans and monsters react to a nearby battle');
 ok(!avoid.eligible(P)&&!avoid.eligible(foe),'actual combatants are excluded from avoidance');
 const pending=W.lords[1];Object.assign(pending,start,{dead:false,inside:null,fight:null});a.participants.add(pending);ok(!avoid.eligible(pending),'armies committed to reinforcement keep approaching instead of fleeing');
 ok(!avoid.eligible(t.asWorker({...worker,st:'in'}))&&!avoid.eligible({mapKind:'holding',...start}), 'workers indoors and stationary map structures are not displaced');
 let legal=true;for(let i=0;i<500;i++){const before=entities.map(o=>({x:o.x,y:o.y}));avoid.step(.2);entities.forEach((o,j)=>{const p=avoid.entries.get(o);if(p)legal&&=p.nav.clear(before[j],o)})}
 ok(legal,'avoidance walks reachable routes without crossing buildings, cliffs or water');
 ok(entities.every(o=>Math.hypot(o.x-a.x,o.y-a.y)>=a.r+avoid.margin(o)-1),'mobile nonparticipants move outside the battle area with room for their group');
 ok(JSON.stringify([worker.wp,worker.tx,worker.ty,refugee.to,caravan.to,herd.hx,herd.hy])===orders&&G.clock===clock,'retreat preserves work/travel goals and does not advance campaign time');
 const positions=entities.map(o=>({x:o.x,y:o.y}));for(let i=0;i<10;i++)avoid.step(.2);ok(entities.every((o,i)=>Math.hypot(o.x-positions[i].x,o.y-positions[i].y)<.01),'safe bystanders settle instead of continually running');
 const water=avoid.nav({mapKind:'ship'});ok(water.grid.cost.every((v,i)=>!v||t.isWater(Math.floor((water.x+(i%water.grid.C+.5)*water.grid.cs)/t.TILE),Math.floor((water.y+(Math.floor(i/water.grid.C)+.5)*water.grid.cs)/t.TILE))),'ship avoidance routes stay on navigable water');
 const flyer=Object.keys(t.MONSTERS).find(id=>t.MONSTERS[id].mythic?.fly);ok(flyer&&avoid.mode(t.asMonster({...start,id:flyer,n:1}))==='air','flying monsters use flight rather than land routes');
 a.step(.1);ok(a.bystanders instanceof t.BattleBystanders,'active world battle invokes local avoidance without running the full campaign');
 avoid.finish();ok(!avoid.entries.size&&!avoid.navs.size&&worker.moving===false,'battle completion releases avoidance and restores worker animation state');
});
