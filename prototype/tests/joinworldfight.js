'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',51);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;
 let tile=0;for(let i=0;i<t.WM.kind.length;i++)if(t.WM.kind[i]===t.T_OPEN&&i%t.MW>20&&i%t.MW<t.MW-20&&Math.floor(i/t.MW)>20){tile=i;break}
 Kit.goTo((tile%t.MW+.5)*t.TILE,(Math.floor(tile/t.MW)+.5)*t.TILE);P.troops={hum_foot:2};P.fac=null;P.hostile={};
 const lord=W.lords[0];W.lords=[lord];Object.assign(lord,{inside:null,dead:false,fight:null,x:P.x+180,y:P.y,state:'rest',cool:0,troops:['hum_foot','hum_bow','hum_foot']});
 const band=t.asParty({kind:'bandits',troops:Array(20).fill('militia'),x:P.x+260,y:P.y,cool:0,t:999,idle:true});t.bandits.push(band);
 const army=t.MarchArmy.of(lord),enemy=t.MarchArmy.of(band),old={x:lord.x,y:lord.y,units:army.units.map(u=>({u,x:u.x,y:u.y}))};
 const f=t.startFight([lord],[band]),dx=lord.x-old.x,dy=lord.y-old.y;
 ok(old.units.every(p=>Math.abs(p.u.x-p.x-dx)<1e-8&&Math.abs(p.u.y-p.y-dy)<1e-8),'forming an NPC fight moves its cached marching figures with their leader');
 ok(army.ground===null&&army.units.every(u=>!u.plan),'repositioning discards stale travel routes');
 const count=P.fighters+lord.fighters+band.fighters;t.fightMeet(f);t.fightAct('fg-join','0');ok(G.enc.kind==='field'&&G.enc.ref===f,'the player joins the selected ongoing fight');
 t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B,a=b.world;
 ok(a.fight===f&&a.joinedFight&&a.fighters===count,'joined battle sizing counts the player and both original armies including leaders');
 ok([P,lord,band,f].every(o=>a.hides(o)),'the tactical battle owns all original armies and the campaign fight marker');
 ok([P,lord,band].every(o=>Math.hypot(o.x-a.x,o.y-a.y)+Math.max(t.marchOuter(o),t.MarchArmy.spread(o))<=a.r+.001),'the fixed battlefield encloses every original army formation');
 ok(a.r>=a.sightRadius*t.WORLD_BATTLE.sightBase+Math.sqrt(count)*t.WORLD_BATTLE.perFighter,'battle radius includes the full participating headcount scaling');
 ok(!a.pending.some(p=>p.o===lord||p.o===band)&&!b.units.some(u=>u.waiting),'armies already fighting enter as active combatants rather than frozen pending reinforcements');
 const combatOwners=new Set(b.units.map(u=>u.sourceArmy?.src||u.sourceArmy));ok(combatOwners.has(lord)&&combatOwners.has(band),'joined actors retain their campaign army identity');
 const actor=b.units.find(u=>u.marchUnit&&u.sourceArmy===lord),group=b.groups[actor.grp],members=b.units.filter(u=>u.grp===actor.grp),cell=t.tIx(b.terrain,actor.x,actor.y),solid=b.terrain.solid[cell];
 try{b.terrain.solid[cell]=1;a.place(group,members,lord,{x:0,y:0},lord);ok(members.every(u=>!b.terrain.solid[t.tIx(b.terrain,u.x,u.y)]),'cached figures repositioned onto buildings enter on nearby open ground')}finally{b.terrain.solid[cell]=solid}
 const ents=[];lord.draw(ents,G.cam,1e9);band.draw(ents,G.cam,1e9);f.draw(ents,G.cam,1e9);ok(!ents.length,'no duplicate travel sprites, army rings or fight tally remain under combat actors');
 const unit=b.units.find(u=>u.team===1&&u.hp>0);unit.x=a.cx+a.radius+100;unit.y=a.cy;a.clamp();ok(a.inside(unit),'the battle boundary constrains joined combatants');
 const radius=a.r,center=[a.x,a.y];a.syncCamera();t.frame();ok(a.r===radius&&a.x===center[0]&&a.y===center[1]&&!ERR.length,'rendering keeps the battle boundary fixed without runtime errors');
 a.finish(b);window.eval('B=null');Kit.world();const visible=[];f.draw(visible,G.cam,1e9);ok(visible.length===1,'the campaign fight marker can render again once combat releases it');
 // Joining against monsters must use the same existing-fight handoff.
 W.fights=[];lord.fight=null;band.fight=null;t.bandits.length=0;const monster=t.asMonster({id:'wolf',x:lord.x+30,y:lord.y,hx:lord.x+30,hy:lord.y,n:2,lv:1,cool:0});
 if(t.MONSTERS.wolf){W.monsters=[monster];const beastFight=t.startFight([lord],[monster]);t.fightMeet(beastFight);t.fightAct('fg-join','0');ok(G.enc.kind==='monster'&&G.enc.fight===beastFight,'joining against wildlife monsters preserves the original fight identity');const area=new t.WorldBattleArea(G.enc);ok(area.hides(lord)&&area.hides(monster)&&area.hides(beastFight),'monster fight joins suppress the same duplicate campaign visuals')}
});
