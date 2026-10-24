'use strict';
// The former instant find is a silent, visible cart: search once, leave and return, save, and expire outside sight.
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world({town:null});t.GUIDE.on=false;
 const home=Kit.goHome('Ashford'),spots=[];
 for(let y=2;y<t.MH-2;y++)for(let x=2;x<t.MW-2;x++)if(t.roadBeside(x,y)&&t.tAt(x,y)===t.T_OPEN&&!t.occAt(x,y)&&!t.TOWNS.some(h=>Math.hypot(h.tx-x,h.ty-y)<t.ENC_SPAWN.hold))spots.push({x:(x+.5)*t.TILE,y:(y+.5)*t.TILE});
 spots.sort((a,b)=>Math.hypot(a.x-home.x,a.y-home.y)-Math.hypot(b.x-home.x,b.y-home.y));const at=spots[0];
 const world=()=>Kit.world({town:null,road:null,chase:null,encCool:0});
 const spawn=()=>{world();W.road=null;P.x=at.x-10;P.y=at.y;P.tx=null;P.stay=null;P.gold=100;G.clock=t.DAY*.3;P.x=at.x-t.vis()-60;const e=t.roadSpawn('wagon',at.x,at.y);P.x=at.x-10;return e};
 ok(!!at&&!!t.ROAD_ENC.wagon&&t.Kinds.on('encounter','travelHour').includes(t.ROAD_ENC.wagon),'the wagon is registered in the road encounter roll');
 ok(!t.Kinds.of('incident','wagon')&&!t.INCIDENTS.some(k=>k.id==='wagon'),'no instant wagon incident or automatic daily gold');
 let e=spawn();const D=e.D,pos=[e.x,e.y];
 ok(D.on==='byroad'&&t.ENC_ON[D.on](Math.floor(e.x/t.TILE),Math.floor(e.y/t.TILE)),'the cart fits clear ground beside a road, outside holdings');
 ok(Math.abs(e.end-e.t0-24)<1e-9&&e.beh==='stay'&&e.ends==='unseen','it stays for one game day and expires outside sight');
 ok(D.silent&&!D.hear&&!D.call&&D.scene(e).map(p=>p[0]).join()==='oldcart','only an abandoned cart: no owner or calls');
 const drawn=[];e.draw(drawn,G.cam,t.vis());ok(drawn.length>0&&t.ENC_SCENE.pics(e).length===1,'the map and page banner reuse the cart artwork');
 const g0=P.gold,n0=G.msgs.length,V=t.vis();P.x=e.x-V-60;e.step(0,V,t.roadNow());
 ok(!e.seen&&G.msgs.length===n0&&P.gold===g0,'beyond sight it grants neither knowledge, messages nor gold');
 P.x=e.x-10;const sound=window.sfx;let sounds=0;window.sfx=()=>sounds++;
 try{e.step(0,t.vis(),t.roadNow())}finally{window.sfx=sound}
 ok(e.seen&&e.marked()&&e.inView(t.vis())&&e.marker(),'within sight the ordinary encounter mark reveals the wagon');
 ok(!sounds&&P.gold===g0&&/abandoned wagon/.test(G.msgs[G.msgs.length-1].m),'discovery is silent and never pays the reward');
 const waves=window.wuiWaves,arc=window.wuiArc,put=t.ctx.drawImage;let rings=0,arcs=0,marks=0;
 window.wuiWaves=()=>rings++;window.wuiArc=(...a)=>{arcs++;return arc(...a)};t.ctx.drawImage=()=>marks++;
 try{
  t.wuiRoadUnder({x:e.x-100,y:e.y-100},1e7,false);t.wuiRoadOver({x:e.x-100,y:e.y-100},1e7,false);
  ok(!rings&&!arcs&&marks===1,'a visible silent cart has its mark but no sound waves');
  marks=0;t.wuiRoadOver({x:e.x+t.VW,y:e.y-100},1e7,false);ok(!arcs&&marks===1,'an already seen cart offscreen uses a mark without sound arcs');
  marks=0;P.x=e.x-t.vis()*2;t.wuiRoadOver({x:e.x-100,y:e.y-100},1e7,false);ok(!marks,'a silent cart outside current sight has no marker over the fog');P.x=e.x-10;
  const merchant=t.roadSpawn('merchant',e.x+15,e.y);merchant.seen=1;t.wuiRoadUnder({x:e.x-100,y:e.y-100},1e7,false);
  ok(rings===1,'other encounters keep their existing sound waves');merchant.gone=1;
 }finally{window.wuiWaves=waves;window.wuiArc=arc;t.ctx.drawImage=put}
 t.roadMeet(e);ok(G.mode==='road'&&Kit.text().includes('Search the wagon')&&Kit.text().includes('Leave'),'meeting opens the normal encounter page with Search and Leave');
 const state=JSON.stringify(t.Rng.states()),preview=D.acts[0].preview(e);ok(preview.gold===15&&P.gold===g0&&JSON.stringify(t.Rng.states())===state,'the reward preview is 15 gold with no payout or random draw');
 t.act('enc-leave');ok(G.mode==='world'&&!e.done&&!e.gone&&e.chaseable()&&P.gold===g0,'Leave pays nothing and permits returning');
 e.step(.1,t.vis(),t.roadNow());ok(e.x===pos[0]&&e.y===pos[1]&&e.beh==='stay','leaving never makes the abandoned cart walk away');
 t.saveGame(true,'quick');t.loadGame('quick');e=t.roadList().find(x=>x.k==='wagon');
 ok(e instanceof t.Encounter&&!e.done&&Math.abs(e.end-e.t0-24)<1e-9,'an untouched wagon and its original lifetime survive save/load');
 t.roadMeet(e);const coins=P.gold,ended=[],fn=d=>{if(d.e===e)ended.push(d.how)};t.worldOn('encounter:ended',fn);
 try{t.act('enc-do','0');t.act('enc-do','0');ok(P.gold===coins+15&&e.done&&e.fin==='done'&&ended.join()==='done','search pays exactly once and announces completion once');}finally{t.worldOff('encounter:ended',fn)}
 ok(/find 15 gold/.test(G.roadMsg)&&!/sell/.test(G.roadMsg)&&Kit.text().includes('Nothing of value remains.'),'the result describes finding coins and the searched cart is empty');
 ok(!Kit.q('[data-act="enc-do"]')&&!e.marked()&&!e.chaseable(),'the searched wagon offers no repeat action or encounter mark');
 const empty=[];e.draw(empty,G.cam,t.vis());ok(!e.gone&&empty.length>0&&e.x===pos[0]&&e.y===pos[1],'its empty map sprite stays in place while visible');
 t.act('enc-leave');t.saveGame(true,'quick');t.loadGame('quick');e=t.roadList().find(x=>x.k==='wagon');
 ok(e&&e.done&&e.fin==='done'&&P.gold===coins+15,'saving a searched wagon preserves its completion and exact reward');
 t.roadMeet(e);t.act('enc-do','0');ok(P.gold===coins+15&&!Kit.q('[data-act="enc-do"]'),'even reopening a saved completed record cannot pay twice');t.act('enc-leave');
 P.x=e.x-t.vis()*1.2;e.step(0,t.vis(),t.roadNow());ok(e.gone&&!t.roadSave().road.on.some(r=>r.i===e.i),'a searched cart disappears outside sight and is omitted from saves');
 e=spawn();e.seen=1;G.day++;G.clock+=t.DAY*.01/24;e.step(0,t.vis(),t.roadNow());ok(!e.gone&&e.beh==='stay'&&e.x===pos[0]&&e.y===pos[1],'an expired cart never vanishes or walks away before your eyes');
 P.x=e.x-t.vis()*1.2;e.step(0,t.vis(),e.end+.01);ok(e.gone&&e.fin==='timeout'&&P.gold===100,'an ignored expired cart ends outside sight without a reward');
 const trace=t.asRoadEnc({rd:1,i:999,k:'cart',trace:1,x:at.x,y:at.y,from:t.roadNow(),end:t.roadNow()+24});
 ok(trace.D===t.ROAD_TRACE.cart&&!trace.chaseable(),'the existing cart-in-the-mud trace remains separate and noninteractive');
});
