'use strict';
// battle juice: the callouts for the big moments (battlehud.js), the drawn-only screen shake (vfx.js) and the unit of the battle
// in the battle report (resolution.js, loot.js)
window.RUN=()=>{const t=T,L=t.BattleLab,G=t.G,P=t.P,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),random=Math.random,media=window.matchMedia,shakeOn=t.SHAKE.on;try{
 const start=(extra={})=>{if(L.active)L.exit();L.start({leftGroups:[{type:'hum_foot',count:20}],rightGroups:[{type:'hum_foot',count:20}],morale:true,deploy:false,paused:true,ai:false,seed:42,...extra});const b=t.B,g=b.groups[t.playerGroups()[0]],foe=Object.values(b.groups).find(x=>x.foe);b.obs=[];for(const [gr,x] of [[g,300],[foe,340]]){gr.placeAt(x,300);t.layForm(gr.id);gr.units.forEach(u=>{u.x=gr.ax+u.sx;u.y=gr.ay+u.sy;u.cd=999})}return {b,g,foe,r:g.resolve,a:g.units,e:foe.units}};
 const C=()=>t.B.callouts||{q:[],on:[]},all=()=>[...C().q,...C().on],said=re=>all().filter(c=>re.test(c.text)).length,logged=(n0,re)=>G.msgs.slice(n0).filter(m=>re.test(m.m)).length;
 const banners=()=>[...document.querySelectorAll('#bCallouts .callout')];
 // ----- a rout: one banner, one log line, however often it is asked for
 let f=start(),n0=G.msgs.length;t.rout(f.a[0]);t.rout(f.a[0]);f.r.route();
 ok(said(/routs!$/)===1&&all()[0].text===f.g.name+' routs!'&&all()[0].major&&all()[0].team===0,'a rout of yours makes one major callout by the group’s name ('+all()[0].text+')');
 ok(logged(n0,/routs!/)===1&&G.msgs.at(-1).cls==='bad','and goes to the battle log once, as bad news');
 ok(f.b.floats.some(x=>x.t==='Routs!'),'the small word over the soldiers is kept');
 t.calloutTick(0);let el=banners();ok(el.length===1&&el[0].classList.contains('mine')&&el[0].classList.contains('major')&&el[0].textContent===f.g.name+' routs!','the banner shows in your side’s colour');
 const box=document.getElementById('bCallouts');ok(box&&box.parentElement===document.getElementById('bbar')&&getComputedStyle(box).pointerEvents==='none','banners sit in the battle HUD and never take a click');
 n0=G.msgs.length;f.foe.resolve.route();t.calloutTick(1.3);el=banners();
 ok(el.length===2&&el[0].classList.contains('foe')&&el[0].textContent==='Enemy '+f.foe.name+' routs!'&&logged(n0,/routs!/)===0,'their rout: an enemy-coloured banner on top (the log tells their army breaking once, at the end)');
 f.foe.units.forEach(u=>u.x=900);f.a.forEach(u=>u.x=100);f.r.rallied=true;f.r.routed=false;f.r.route();ok(f.r.shattered&&said(/is shattered!$/)===1&&logged(n0,/is shattered!/)===1,'a second break is called out as shattered, and logged');
 // ----- the queue: deduped, throttled, short
 f=start();t.callout('One',0,'k1');t.callout('One',0,'k1');t.callout('One',0,'k2');ok(C().q.length===1,'the same callout twice (by key or by words) is said once');
 f.b.t+=t.CALLOUT.same-.1;ok(!t.callout('Again',0,'k1'),'a key is quiet for '+t.CALLOUT.same+' combat seconds');f.b.t+=.2;ok(t.callout('Again',0,'k1'),'and may be said again after');
 t.callout('Two',1,'k3');t.callout('Three',1,'k4');t.calloutTick(0);ok(C().on.length===1,'one banner comes up at a time');
 t.calloutTick(t.CALLOUT.gap-.1);ok(C().on.length===1,'the next waits '+t.CALLOUT.gap+' s');t.calloutTick(.2);ok(C().on.length===2&&C().on[0].text==='Again','then comes up on top of the last');
 t.calloutTick(t.CALLOUT.gap);ok(C().on.length<=t.CALLOUT.show&&!C().on.some(c=>c.text==='One'),'each stays about '+t.CALLOUT.life+' s; never more than '+t.CALLOUT.show+' at once');
 for(let i=0;i<10;i++)t.callout('Minor '+i,0,'m'+i);ok(C().q.length<=t.CALLOUT.queue,'a burst is cut to a short queue');
 t.callout('Big news',1,'big',{major:true});for(let i=0;i<10;i++)t.callout('Small '+i,0,'s'+i);ok(C().q.some(c=>c.text==='Big news'),'the small ones are dropped before a major one');
 t.calloutTick(t.CALLOUT.stale*2+1);ok(!C().q.length||C().q.every(c=>c.age<t.CALLOUT.stale*2),'stale callouts are dropped, not told late');
 const opts=f.b.opts;f.b.opts={...opts,tournament:true};ok(!t.callout('Tourney',0,'tt'),'tournaments have no callouts');f.b.opts=opts;
 // ----- flanked: the first blow from the side or behind, then once a group every flankEvery combat seconds
 f=start();const u=f.a[0],a=t.facing(u),rear={x:u.x-Math.cos(a)*20,y:u.y-Math.sin(a)*20};n0=G.msgs.length;
 t.flankMul(u,rear);ok(said(/is flanked!$/)===1&&all().find(c=>/flanked/.test(c.text)).text===f.g.name+' is flanked!'&&logged(n0,/flanked/)===0,'the first blow in the rear calls the group flanked (not logged)');
 t.flankMul(f.a[1],rear);t.flankMul(u,rear);ok(said(/is flanked!$/)===1,'more flank blows soon after say nothing more');
 t.calloutTick(5);f.b.t+=t.CALLOUT.flankEvery-1;t.flankMul(u,rear);ok(said(/is flanked!$/)===0,'still quiet inside '+t.CALLOUT.flankEvery+' combat s');
 f.b.t+=1.1;t.flankMul(u,rear);ok(said(/is flanked!$/)===1,'and said again after');
 t.calloutTick(5);f.b.t+=99;t.flankMul(u,{...rear,arrow:true});ok(said(/is flanked!$/)===0,'arrows in the flank call nothing, as their small word');
 const fu=f.e[0],fa=t.facing(fu);t.flankMul(fu,{x:fu.x-Math.cos(fa)*20,y:fu.y-Math.sin(fa)*20});ok(all().some(c=>c.text==='Enemy '+f.foe.name+' is flanked!'&&c.team===1),'flanking them is called out too, in their colour');
 // ----- the enemy falls back (commander.js sets B.fallBack; it logs it itself)
 f=start();n0=G.msgs.length;t.calloutTick(0);ok(!all().length,'no fall-back banner before it happens');
 f.b.fallBack=true;t.calloutTick(0);t.calloutTick(2);t.calloutTick(2);ok(C().fell&&banners().length+C().q.length<=1&&all().filter(c=>c.text==='The enemy falls back').length<=1&&G.msgs.length===n0,'the fall-back is called out once and not logged twice');
 f=start();f.b.fallBack=true;t.calloutTick(0);el=banners();ok(el.length===1&&el[0].textContent==='The enemy falls back'&&el[0].classList.contains('foe'),'the fall-back banner is theirs');
 // ----- a leader falls
 f=start({leftGroups:[{type:'hum_foot',count:20},{type:'hero',count:1}]});n0=G.msgs.length;const chief=f.e[0];chief.leader={name:'Chief'};t.applyDmg(chief,chief.hp+1,1,'slash',f.a[0]);
 ok(said(/^Their leader falls!$/)===1&&logged(n0,/Their leader falls!/)===1&&f.b.floats.some(x=>x.t==='Their leader falls!'),'their leader falls: banner, log line, and the float kept');
 ok(f.b.grpKills&&f.b.grpKills[f.g.id]===1,'the kill is counted for the group that made it');
 n0=G.msgs.length;t.applyDmg(f.b.hero,f.b.hero.hp+1,1,'slash',f.e[1]);ok(said(/^Your leader falls!$/)===1&&logged(n0,/Your leader falls!/)===0&&logged(n0,/knocked down/)===1,'your hero falls: a banner, and only the existing log line');
 // ----- screen shake: a strong charge jolts the view, drawn only
 f=start({leftGroups:[{type:'hum_knight',count:4},{type:'hum_foot',count:4},{type:'troll',count:1}]});const B=f.b,cam=()=>JSON.stringify({x:B.cam.x,y:B.cam.y,z:B.cam.z,fit:B.cam.fit}),cam0=cam();
 const knight=B.units.find(x=>!x.team&&x.type==='hum_knight'),foot=B.units.find(x=>!x.team&&x.type==='hum_foot'),troll=B.units.find(x=>!x.team&&x.type==='troll'),foe=f.e[0];
 knight.run=t.CHARGE.run;t.chargeMul(knight,foe);const amp=t.joltAmp();ok(amp>=t.SHAKE.amp*.99&&amp<=t.SHAKE.max,'a full cavalry charge jolts the view ('+amp.toFixed(1)+' px, capped at '+t.SHAKE.max+')');
 const s=t.shakeView(true);ok(s&&Math.abs(s.x)<=t.SHAKE.max&&Math.abs(s.y)<=t.SHAKE.max,'the jolt is a small draw offset');
 G.mode='battle';t.frame();ok(cam()===cam0,'drawing a jolted frame leaves the camera where it was');
 let last=amp,falling=true;for(let i=0;i<20;i++){t.joltStep(.05);falling=falling&&t.joltAmp()<=last;last=t.joltAmp()}ok(falling&&t.joltAmp()===0&&B.jolt.a===0&&!t.shakeView(true),'it fades to nothing within '+t.SHAKE.life+' s');
 ok(cam()===cam0,'the camera’s place and zoom never change');
 let calls=0;Math.random=()=>{calls++;return random()};t.jolt(3);t.joltStep(.1);t.shakeView(true);t.chargeJolt(knight,1);t.joltStep(1);Math.random=random;ok(calls===0,'the shake draws no random numbers');
 B.jolt=null;knight.run=t.CHARGE.run*.4;t.chargeMul(knight,foe);ok(!t.joltAmp(),'a weak charge does not jolt');
 foot.run=t.CHARGE.run;t.chargeMul(foot,foe);ok(!t.joltAmp(),'nor does a foot soldier’s run');
 troll.run=t.CHARGE.run;t.chargeMul(troll,foe);ok(t.joltAmp()>0,'a big beast’s charge does');
 B.jolt=null;t.SHAKE.on=false;knight.run=t.CHARGE.run;t.chargeMul(knight,foe);ok(!t.joltAmp(),'the switch (SHAKE.on) turns it off');t.SHAKE.on=shakeOn;
 window.matchMedia=q=>({matches:/prefers-reduced-motion: reduce/.test(q)});knight.run=t.CHARGE.run;t.chargeMul(knight,foe);G.shake=4;B.paused=false;ok(!t.joltAmp()&&!t.shakeView(true),'reduced motion: no jolt and no blow shake');window.matchMedia=media;G.shake=0;B.paused=true;
 B.jolt=null;B.groups[t.playerGroups().find(id=>B.groups[id].type==='hum_foot')].resolve.route();ok(t.joltAmp()>0&&t.joltAmp()<=t.SHAKE.rout,'a rout of yours: a lighter jolt');
 const fr=Object.values(B.groups).find(x=>x.foe).resolve;B.jolt=null;fr.route();ok(!t.joltAmp(),'their rout: none');ok(cam()===cam0,'and the camera is still untouched');
 if(L.active)L.exit();
 // ----- the unit of the battle, in the battle report
 const fixture=()=>{
  Math.random=t.seeded(1831);t.begin('soldier');G.quietEvents=true;t.BDEPLOY.on=false;
  const r=t.partyRoster(P);r.add('hum_foot',12);const ga=r.groups[0],gb=r.split(ga.id,6);r.rename(ga.id,'Royal <Guard>');r.rename(gb.id,'Forest Watch');
  const band=t.asParty({kind:'bandits',troops:Array(12).fill('militia'),x:P.x+8,y:P.y,cool:0});G.enc={kind:'party',ref:band,list:band.troops.slice(),allies:[],foes:[],mine:true};
  t.startBattle({enemies:G.enc.list,deploy:false});const b=t.B,A=b.groups['p_'+ga.id],Bg=b.groups['p_'+gb.id],foes=b.units.filter(x=>x.team===1);let k=0;
  const kill=(g,n)=>{for(let i=0;i<n;i++){const e=foes[k++];t.applyDmg(e,e.hp+1,1,'slash',g.units[0])}};
  return{b,A,Bg,kill,ga,gb}};
 const finish=x=>{x.b.win=true;Math.random=()=>.99;new t.BattleResolution(x.b).finish();Math.random=random;return G.lootView.report};
 let x=fixture();x.kill(x.A,3);x.kill(x.Bg,1);let rep=finish(x);
 ok(rep.best&&rep.best.id===x.ga.id&&rep.best.kills===3,'the group with the most kills is the unit of the battle');
 ok(panel.querySelector('.battle-best')?.textContent==='Unit of the battle: Royal <Guard> — 3 kills','it is named in the report, its name as plain text');
 t.lootEnd();x=fixture();x.kill(x.A,1);x.kill(x.Bg,1);x.A.resolve.damageDealt=10;x.Bg.resolve.damageDealt=50;rep=finish(x);
 ok(rep.best&&rep.best.id===x.gb.id&&rep.best.kills===1,'equal kills: the one that dealt more damage');
 t.lootEnd();x=fixture();x.Bg.resolve.damageDealt=40;rep=finish(x);ok(rep.best&&rep.best.id===x.gb.id&&panel.querySelector('.battle-best')?.textContent.endsWith('40 damage dealt'),'no kills at all: the one that dealt damage, by its damage');
 t.lootEnd();x=fixture();rep=finish(x);ok(rep&&!rep.best&&!panel.querySelector('.battle-best'),'no group of yours fought: no unit of the battle');
 t.lootEnd();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{Math.random=random;window.matchMedia=media;t.SHAKE.on=shakeOn;if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
