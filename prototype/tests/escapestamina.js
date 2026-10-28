'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,E=t.EscapeStamina;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();G.paused=false;G.speed=1;
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+400,home.y+300);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-25;y<=ty+25;y++)for(let x=tx-25;x<=tx+25;x++)if(x>0&&y>0&&x<t.MW&&y<t.MH)t.tiles[y*t.MW+x]=t.T_OPEN;
 const c=t.asHerd({crit:true,id:'deer',n:3,x:P.x+20,y:P.y,hx:P.x+20,hy:P.y,dir:1,t:1,a:0,tire:0,cool:0});t.W.critters=[c];
 ok(E.capacity(t.asHerd({...c,id:'rabbit'}))<E.capacity(c),'rabbits have shorter escape endurance than deer');
 const before=P.bsta;let early=0,late=0;
 for(let i=0;i<240;i++){E.tick(.1);const x=c.x,y=c.y;t.Router.flee(c,P,1);const moved=Math.hypot(c.x-x,c.y-y);if(i===0)early=moved;if(i===239)late=moved}
 ok(c.escapeSta===0&&late<early&&late>0&&Math.abs(late/early-t.ESCAPE_STAMINA.floor)<.001,'continuous flight gradually reaches a nonzero exhausted pace');
 ok(E.state(c)==='exhausted'&&P.bsta===before&&P.escapeSta===undefined,'NPC fatigue never alters the player stamina pool');
 const pool=c.escapeSta;E.tick(.1);t.Router.flee(c,{x:c.x-10,y:c.y},1);ok(c.escapeSta===pool,'changing pursuers does not refill escape stamina');
 c.escapeSta=5;E.active.get(c).threat={x:c.x-5,y:c.y};E.active.get(c).at=E.time-10;E.tick(1);ok(c.escapeSta===5,'a nearby threat prevents stamina recovery');E.active.get(c).threat={x:c.x-300,y:c.y};E.tick(1);ok(c.escapeSta>5,'breaking contact allows gradual recovery after the rest delay');
 c.escapeSta=4;const loaded=t.herdRec(JSON.parse(JSON.stringify(c)));ok(loaded.escapeSta===4&&E.ratio(loaded)===E.ratio(c),'wildlife fatigue survives packed save records');
 const a=t.asParty({kind:'bandits',troops:Array(6).fill('militia'),x:P.x,y:P.y}),b=t.asParty({kind:'bandits',troops:Array(30).fill('militia'),x:P.x,y:P.y}),mounted=t.asParty({kind:'bandits',troops:Array(6).fill('hum_knight'),x:P.x,y:P.y});
 const speed=t.partySpeed(a,a.troops);ok(t.partySpeed(b,b.troops)<speed&&t.partySpeed(mounted,mounted.troops)>speed,'existing army size and foot/mounted pace relationships remain intact');a.escapeSta=0;ok(Math.abs(t.partySpeed(a,a.troops)/speed-t.ESCAPE_STAMINA.floor)<.001,'fatigue multiplies the original army speed instead of replacing composition rules');
 G.chase={rd:true,chase:true};ok(t.roadSprint()===1,'chasing road entities no longer grants the player a speed bonus');G.chase=null;
 const time=E.time,remaining=c.escapeSta;G.paused=true;E.tick(10);ok(E.time===time&&c.escapeSta===remaining,'pause freezes escape stamina');G.paused=false;G.modal=true;E.tick(10);ok(E.time===time,'menus freeze escape stamina');G.modal=false;
 const worker=t.asWorker({folk:true,id:'fatigue-test',x:P.x,y:P.y,st:'field',gin:true,escapeSta:1,wp:[{x:P.x+100,y:P.y,i:-1}],plan:{day:G.day,pier:true}}),fear=home.fear;home.fear=G.day+1;E.tick(.1);t.fieldWork(home,worker,.1,.2);home.fear=fear;ok(worker.x>P.x&&worker.escapeSta<1,'field workers spend escape stamina while retreating through estate waypoints');
 ok(!ERR.length,'escape stamina produces no runtime errors');
});
