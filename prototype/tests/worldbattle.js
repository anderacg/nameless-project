'use strict';
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',51);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;t.BDEPLOY.on=true;
 // A real road far from buildings, with a controlled enemy and one distant helper.
 let tile=0;for(let i=0;i<t.WM.kind.length;i++)if(t.WM.kind[i]===t.T_OPEN&&i%t.MW>20&&i%t.MW<t.MW-20&&Math.floor(i/t.MW)>20){tile=i;break}
 Kit.goTo((tile%t.MW+.5)*t.TILE,(Math.floor(tile/t.MW)+.5)*t.TILE);P.troops={hum_foot:5,hum_bow:3};
 const enemy=t.asParty({kind:'bandits',troops:['militia','militia','archer'],x:P.x+70,y:P.y,cool:0});
 const rows=t.marchRows(P),hero=rows.find(r=>r.id==='hero');ok(hero.x===0&&hero.y===0&&rows.length===3,'march formations include the fixed hero and each persistent troop group');
 const large=t.asParty({troops:Array(80).fill('hum_foot'),x:P.x+70,y:P.y}),largeGroup=t.partyRoster(large).groups[0];largeGroup.files=1;const largeRadius=t.marchOuter(large);ok(largeRadius>t.WORLD_BATTLE.outer&&t.marchRows(large).every(r=>Math.hypot(r.x,r.y)+t.marchExtent(r)<=largeRadius+.001),'large or narrow formations grow the army radius and keep their entire footprint out of the interaction band');
 const union=new t.WorldBattleArea({kind:'party',ref:large});ok(Math.hypot(P.x-union.x,P.y-union.y)+t.marchOuter(P)<=union.r+.001&&Math.hypot(large.x-union.x,large.y-union.y)+largeRadius<=union.r+.001,'unequal starting party circles are both enclosed by the fixed battlefield');
 const id=rows.find(r=>!r.character).id;P.army.march={[id]:{x:9,y:-11}};ok(t.marchRows(P).find(r=>r.id===id).y===-11,'custom march offsets use persistent group identities');
 P.army.march[id]={x:999,y:999};{const row=t.marchRows(P).find(r=>r.id===id);ok(t.marchFoot(row,row.x,row.y)<=t.marchOuter(P)+.001&&Math.hypot(row.x,row.y)>0,'formation offsets cannot enter the interaction-only band: every man inside the ring, as far out as he fits')}P.army.march[id]={x:9,y:-11};
 ok(t.worldBattleReach(enemy)===t.marchOuter(P)+t.marchOuter(enemy)+2*t.WORLD_BATTLE.interaction&&t.worldBattleReach(t.TOWNS[0])===t.REACH,'party contact uses both interaction radii; holding reach stays unchanged');
 G.mode='char';t.openMarch();ok(document.querySelector('#marchCanvas')&&Kit.text().includes('Apply formation'),'Army opens a formation editor with Apply and Back');
 const cv=document.getElementById('marchCanvas'),rect=cv.getBoundingClientRect(),view=t.marchCanvasView(),scale=view.scale,start=G.march.draft[id],capture=cv.setPointerCapture;cv.setPointerCapture=()=>{};
 const pointer=(kind,x,y)=>cv.dispatchEvent(new PointerEvent(kind,{pointerId:1,pointerType:'touch',clientX:rect.left+x*rect.width/view.w,clientY:rect.top+y*rect.height/view.h,bubbles:true}));
 try{pointer('pointerdown',view.x+start.x*scale,view.y+start.y*scale);pointer('pointermove',view.w-10,view.h-10);pointer('pointerup',430,310);const at=G.march.draft[id],row=t.marchRows(P).find(r=>r.id===id);ok(Math.hypot(at.x,at.y)+t.marchExtent(row)<=t.marchOuter(P)+.001,'touch dragging uses the actual canvas coordinates and keeps the whole group out of the interaction band')}finally{cv.setPointerCapture=capture}
 t.act('march-step','down');t.act('march-back');ok(P.army.march[id].y===-11,'Back discards formation edits');t.openMarch();G.march.sel=id;t.act('march-step','down');t.act('march-apply');ok(P.army.march[id].y===-9,'Apply saves the changed formation');Kit.world();
 t.frame();const beforeView={x:G.cam.x,y:G.cam.y,w:t.cv.width,h:t.cv.height,z:t.VS,vw:t.VW,vh:t.VH};G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};
 const opts={enemies:G.enc.list,tournament:false,deploy:true};ok(t.worldBattleEligible(opts)&&!t.worldBattleEligible({...opts,tournament:true})&&!t.worldBattleEligible({...opts,sandbox:true}),'road battles use the world; tournaments and the lab keep existing fields');
 t.startBattle(opts);const b=t.B,a=b?.world;ok(a&&G.mode==='battle'&&!b.deploy,'Fight starts an actual world battle with orders immediately available');if(!a){info(JSON.stringify(G.msgs));return}
 ok(Math.hypot(P.x-a.x,P.y-a.y)+t.marchOuter(P)<=a.r+.001&&Math.hypot(enemy.x-a.x,enemy.y-a.y)+t.marchOuter(enemy)<=a.r+.001,'fixed battlefield encloses the two starting party radii');
 ok(b.units.every(u=>a.inside(u,1))&&Object.values(b.groups).every(g=>g instanceof t.BattleControl),'all initial groups start inside the circle and retain normal battle controls');
 const initial={x:a.x,y:a.y,r:a.r},g=b.groups['p_'+id],u=t.grpUnits(g.id)[0],q=a.world({x:g.ax,y:g.ay});ok(Math.hypot(q.x-(P.x+9),q.y-(P.y-9))<12,'the saved march position carries into the battle');
 const cell=t.tIx(b.terrain,u.x,u.y),world=a.world({x:(cell%b.terrain.C+.5)*b.terrain.cs,y:(Math.floor(cell/b.terrain.C)+.5)*b.terrain.cs});ok(b.terrain.clim[cell]===t.WM.climAt(Math.floor(world.x/t.TILE),Math.floor(world.y/t.TILE)),'combat terrain samples the same world coordinates');
 g.moveTo(a.cx+a.radius+90,a.cy);g.queueTo(a.cx,a.cy+a.radius+90);ok(a.inside({x:g.ax,y:g.ay},15)&&a.inside(g.queue[0],15),'paused move and waypoint commands constrain destinations to the circle immediately');
 const before=P.x;b.hero.x=a.cx+40;b.hero.y=a.cy;a.clamp();ok(P.x===before&&a.x===initial.x&&a.r===initial.r,'hero combat movement cannot move the campaign anchor or battlefield boundary');
 u.x=a.cx+a.radius+50;u.y=a.cy;a.clamp();ok(a.inside(u,5),'ordinary soldiers cannot cross the fixed boundary');
 const hp=u.hp=17,sta=u.sta=39;u.x=a.cx+a.radius-1;u.y=a.cy;u.rout=true;if(g.resolve)g.resolve.routed=true;
 // (the owner, 2026-10-31: a router who may still rally "should stay in battle area only. Otherwise, they will be immortal beyond
 // the boundary"): he runs along its edge, never out; one broken for good leaves alive, and none comes back
 for(let i=0;i<400;i++)a.escape(u,.05);
 ok(!u.left&&!u.regroup&&u.hp===hp&&a.inside(u,-1),'a router who may still rally stays in the battle area, on its edge, with his health: still to be run down');
 u.shattered=true;for(let i=0;i<40&&!u.left;i++)a.escape(u,.05);ok(u.left&&u.hpLeft===hp&&!u.regroup,'one broken for good leaves the field alive, never to come back');
 const helper=W.lords.find(l=>l.fac==='vale');helper.dead=false;helper.inside=null;helper.fight=null;helper.troops=['hum_foot','hum_bow'];helper.x=a.x+a.r+40;helper.y=a.y;G.enc.allies.push(helper);
 const n=b.units.length;a.step(.1);ok(a.pending.some(p=>p.o===helper)&&b.units.length===n,'a reinforcement starts outside the battle and must approach before spawning');
 for(let i=0;i<300&&a.pending.some(p=>p.o===helper);i++)a.step(.1);
 const added=b.units.filter(u=>u.sourceArmy===helper);ok(added.length===3&&added.every(u=>a.inside(u))&&new Set(b.units.map(u=>u.id)).size===b.units.length,'an arriving army adds its troops and lord once, with unique actor identities');
 a.step(1);ok(b.units.filter(u=>u.sourceArmy===helper).length===3&&a.x===initial.x&&a.r===initial.r,'reinforcements never duplicate or enlarge the battle');
 {const stuck=W.lords.find(l=>l.fac==='karn'&&l!==helper),walk=window.walk;stuck.dead=false;stuck.inside=null;stuck.fight=null;stuck.troops=['dw_clan'];stuck.x=a.x+a.r+60;stuck.y=a.y;a.pending.push({o:stuck,team:1});window.walk=()=>false;
  try{for(let i=0;i<120&&a.pending.some(p=>p.o===stuck);i++)a.step(.1)}finally{window.walk=walk}ok(!a.pending.some(p=>p.o===stuck)&&a.turned.has(stuck)&&!b.units.some(u=>u.sourceArmy===stuck),'an army that cannot close in on the circle turns away after '+t.WORLD_BATTLE.stall+' s, so the fight stops waiting on it')}
 const soldier=added.find(u=>!u.leader),count=helper.troops.length;/* casualty settlement remains the normal source-group path */
 t.applyDmg(soldier,100000,1,null,b.hero,false);ok(helper.troops.length===count-1,'reinforcement casualties settle against their own campaign army');
 ok(a.ended(1,0),'no enemy left fighting is a final victory');ok(a.ended(0,1),'no ally left fighting is a final defeat');ok(!a.ended(1,1),'two fighting sides remain in battle');ok(a.ended(0,0),'a mutually cleared battlefield also resolves');
 const withdrawn=b.units.find(u=>u.team===0&&!u.hero&&u!==b.hero&&u.hp>0),wg=b.groups[withdrawn.grp];wg.order='withdraw';withdrawn.x=a.cx-a.radius-1;withdrawn.y=a.cy;const got=b.withdrawn||0;t.withdrawStep(withdrawn,.05);ok(withdrawn.left&&!withdrawn.regroup&&b.withdrawn===got+1,'an uncontested circular exit withdraws alive without an automatic rejoin');wg.order='hold';
 t.frame();t.camReset();const screen=t.fromField(a.field({x:P.x+20,y:P.y+12}));ok(Math.abs(screen.x-(P.x+20-beforeView.x))<.001&&Math.abs(screen.y-(P.y+12-beforeView.y))<.001&&b.cam.z===1/a.scale,'fight keeps the exact world camera position and scale, without fitting or zooming');ok(t.cv.width===beforeView.w&&t.cv.height===beforeView.h&&t.VS===beforeView.z&&t.VW===beforeView.vw&&t.VH===beforeView.vh,'combat uses the same native world canvas and map zoom');
 const away=W.lords.find(l=>l.fac==='karn'),emptyStart=G.enc.allies.length;away.inside=null;away.dead=false;away.x=a.x+200;away.y=a.y;away.troops=['dw_clan'];G.enc.allies.push(away);a.pending.push({o:away,team:0,existing:[]});a.finish(b);ok(!G.enc.allies.includes(away)&&G.enc.allies.length===emptyStart,'an army that never arrives is removed before spoils, relations and capture settlement');
 const serial=JSON.stringify(P.army);ok(JSON.parse(serial).march[id].y===-9,'saved army data retains march offsets as plain records');
 Kit.world();t.saveGame(true);P.army.march={};t.loadGame();ok(P.army.march[id].y===-9,'march offsets survive an actual campaign save and load');
 t.MARCH_FACING.delete(P);let now=performance.now()/1000;P.dir=1;const startAngle=t.marchFacing(P);P.y+=2;let record=t.MARCH_FACING.get(P);record.at=now-.1;const turned=t.marchFacing(P);ok(Math.abs(turned-startAngle)<=t.WORLD_BATTLE.turn*.101&&Math.abs(turned-Math.PI/2)>.1,'a sharp turn advances by bounded angular speed instead of snapping');for(let i=0;i<20;i++){t.MARCH_FACING.get(P).at-=.1;t.marchFacing(P)}ok(Math.abs(t.marchFacing(P)-Math.PI/2)<.001,'the formation smoothly finishes its turn while retaining group identity');
});
