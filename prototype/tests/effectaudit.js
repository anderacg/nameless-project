'use strict';
// Effect-layer audit regressions (battle/morale.js, attacks.js, actors.js, unitabilities.js, formations.js): one focused check
// per fix. Spears brace only facing a charge and while fighting; Brace adds the flanks with no extra damage cut; Spur keeps its
// momentum and restores the pace; depth blunts only a charge's bonus (never from behind); morale off keeps flank and charge
// damage; a free soldier forgets a foe he brushed past; Melee Mode shooters use the crowd fallback; morale boosts fade; a run too
// short to be a charge costs no charge stamina.
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);try{
 const C=t.CHARGE,near=(a,b)=>Math.abs(a-b)<1e-6,f2=x=>(+x).toFixed(3);
 // (a paused lab battle, both sides parked apart facing each other, nobody striking unless a case lets them)
 const start=(left,right=[{type:'hum_foot',count:6}],extra={})=>{if(L.active)L.exit();L.start({leftGroups:left,rightGroups:right,morale:true,deploy:false,paused:true,ai:false,seed:42,...extra});
  const b=t.B;b.obs=[];const mine=t.playerGroups().map(id=>b.groups[id]),foes=Object.values(b.groups).filter(g=>g.foe);
  mine.forEach((g,i)=>{g.placeAt(200,90+i*90);g.face=0;g.currentFacing=0;t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy;u.cd=999;u.dir=0;u.face=1})});
  foes.forEach((g,i)=>{g.placeAt(1000,120+i*120);g.face=Math.PI;t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy;u.cd=999})});return{b,mine,foes}};
 // (combat seconds: the lab steps real frames of 1/60 s, combat time runs at the battle's pace)
 const stepFor=sec=>{const end=t.B.t+sec;for(let i=0;i<40&&t.B.t<end-1e-9;i++)L.step(Math.max(1,Math.min(600,Math.ceil((end-t.B.t)*60/Math.max(.1,t.BATTLE_PACE)))))};
 const seeded=(n,f)=>{const r=Math.random;Math.random=t.seeded(n);try{return f()}finally{Math.random=r}};
 // a charger set beside tg on one side (of tg facing east), at full momentum unless told
 const at=(a,tg,side,run=C.run)=>{a.x=tg.x+(side==='rear'?-12:side==='flank'?0:12);a.y=tg.y+(side==='flank'?12:0);a.run=run;a.sta=100;return a};

 // 1. spearmen brace only against a charge on their front, and only while they fight
 {let f=start([{type:'hum_spear',count:8}],[{type:'hum_knight',count:3}]);const sp=f.mine[0],kn=f.foes[0].units[0],tg=sp.units[0];
  const front=t.chargeMul(at(kn,tg,'front'),tg),rear=t.chargeMul(at(kn,tg,'rear'),tg),flank=t.chargeMul(at(kn,tg,'flank'),tg);
  ok(front===1&&rear>1.5&&flank>1.5&&t.sideOf(tg,at(kn,tg,'rear'))==='rear','a rider charging spearmen in the rear or flank hits home; only their front braces (front '+f2(front)+', flank '+f2(flank)+', rear '+f2(rear)+')');
  sp.withdraw();const wd=t.chargeMul(at(kn,tg,'front'),tg);
  f=start([{type:'hum_spear',count:8}],[{type:'hum_knight',count:3}]);const sp2=f.mine[0],kn2=f.foes[0].units[0],tg2=sp2.units[0];sp2.resolve.route();const rt=t.chargeMul(at(kn2,tg2,'front'),tg2);
  ok(wd>1.5&&rt>1.5,'withdrawing or routing spearmen brace against nothing (withdrawing '+f2(wd)+', routing '+f2(rt)+')')}

 // 2. Brace: the flanks too, no extra damage cut on top, and a shield wall does not make a charge softer than a blow walked in
 {const hit=(braced,side,run,wall)=>{const f=start([{type:'hum_spear',count:10}],[{type:'hum_knight',count:3}]),g=f.mine[0],tg=g.units[2];
   if(wall){g.setWalk(true);g.setFlag('shieldWall',true)}if(braced)g.useAbility('brace');tg.hp=tg.max=999;const kn=at(f.foes[0].units[0],tg,side,run);
   const m=t.chargeMul({...kn,s:kn.s},tg),wallOn=t.shieldWallActive(tg);at(kn,tg,side,run);seeded(31,()=>t.attack(kn,tg));return{d:999-tg.hp,m,wallOn}};
  const bf=hit(true,'flank',C.run),wf=hit(true,'flank',0),uf=hit(false,'flank',C.run),br=hit(true,'rear',C.run),wr=hit(true,'rear',0);
  ok(bf.m===1&&bf.d===wf.d&&uf.d>wf.d*1.5,'braced spearmen take a flank charge as a blow walked in, as on their front ('+bf.d+' against '+wf.d+'; unbraced '+uf.d+')');
  ok(br.d>wr.d*1.5&&br.m>1.5,'but a charge from behind still hits home ('+br.d+' against '+wr.d+' walked in)');
  const sw=hit(true,'front',C.run,true),sw0=hit(true,'front',0,true);
  ok(sw.wallOn&&sw.d>0&&sw.d>=sw0.d,'a braced shield wall: a charge does no less than a blow walked in ('+sw.d+' against '+sw0.d+')')}

 // 3. Spur: the riders keep full momentum while it lasts, however they move; when it ends their pace is what it was
 {const f=start([{type:'hum_knight',count:6}]),k=f.mine[0];k.setWalk(true);ok(t.walking(k),'(the riders walk)');
  k.useAbility('spur');L.step(30);const held=Math.min(...k.units.map(t.momentum));
  k.moveTo(320,90);k.setRun(true);L.step(30);const moved=Math.min(...k.units.map(t.momentum));
  ok(held===1&&moved===1,'spurred riders keep their momentum standing ('+f2(held)+') and moving in formation ('+f2(moved)+')');
  const g2=start([{type:'hum_knight',count:6}]).mine[0];g2.setWalk(true);g2.useAbility('spur');ok(g2.run&&!t.walking(g2),'(Spur sets them at a run)');
  stepFor(t.UNIT_ABILITIES.spur.dur+.1);ok(!t.abilityActive(g2,'spur')&&!g2.run&&t.walking(g2),'when Spur ends they walk again, as before it');
  const g3=start([{type:'hum_knight',count:6}]).mine[0];g3.setWalk(true);g3.useAbility('spur');L.step(5);g3.moveTo(320,90,{run:true});stepFor(t.UNIT_ABILITIES.spur.dur+.1);
  ok(g3.run,'an order given since keeps its own pace')}

 // 4. a deep block blunts the charge's bonus, never the blow itself, and never from behind
 {const f=start([{type:'hum_knight',count:3}],[{type:'hum_foot',count:12}]),g=f.foes[0];g.files=3;t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy;u.dir=Math.PI;u.face=-1});
  const kn=f.mine[0].units[0],tg=g.units[0],deep=t.grpShape(g.id).ranks>=t.DEPTH.ranks,put=(side,run)=>{kn.x=tg.x+(side==='rear'?12:-12);kn.y=tg.y;kn.run=run;kn.sta=100;return kn};
  const full=t.chargeMul(put('front',C.run),tg),weak=t.chargeMul(put('front',C.run*C.min),tg),rear=t.chargeMul(put('rear',C.run),tg);
  ok(deep&&near(full,1+C.cav*t.DEPTH.charge),'a deep block takes '+Math.round(t.DEPTH.charge*100)+'% of the bonus: '+f2(full)+' (not '+f2((1+C.cav)*t.DEPTH.charge)+')');
  ok(weak>=1,'a weak charge into a deep block never does less than no charge ('+f2(weak)+')');
  ok(t.sideOf(tg,put('rear',0))==='rear'&&near(rear,1+C.cav),'from behind, depth does not blunt it ('+f2(rear)+')')}

 // 5. morale off: flank, rear and charge damage remain; tournaments keep none
 {const f=start([{type:'hum_foot',count:6}],[{type:'hum_foot',count:6}],{morale:false}),u=f.mine[0].units[0],e=f.foes[0].units[0];
  ok(f.b.noMorale,'(morale is off)');const rear=t.flankMul(u,{x:u.x-12,y:u.y}),flank=t.flankMul(u,{x:u.x,y:u.y+12}),ch=t.chargeMul(at(e,u,'front'),u);
  ok(near(rear,t.FLANK.rear)&&near(flank,t.FLANK.flank),'with morale off a blow in the rear or flank still tells (rear x'+f2(rear)+', flank x'+f2(flank)+')');
  ok(near(ch,1+C.foot),'and so does a foot charge (x'+f2(ch)+')')}

 // 6. a soldier who brushed past a foe on an attack order forgets him once he is free: the press fallback works again
 {const f=start([{type:'hum_foot',count:4}],[{type:'hum_foot',count:4},{type:'hum_foot',count:4}]),g=f.mine[0],[X,Y]=f.foes,u=g.units[0];
  g.units.forEach(q=>q.s={...q.s,spd:0});const y0=Y.units[0],z=Y.units[1];Y.units.slice(2).forEach(q=>{q.x=1100});y0.x=u.x+16;y0.y=u.y;z.x=u.x+60;z.y=u.y;
  g.attack(X.units[0]);t.aiUnit(u,.01,null);const brushed=u.near===y0&&u.tgt===y0;
  g.hold();u.rt=1;u.blockT=t.CROWD.wait;t.aiUnit(u,.01,null);
  ok(brushed&&!u.near&&u.alt===z&&u.tgt===z,'freed from his order, a blocked soldier turns on a foe with room (near '+(u.near?u.near.id:'none')+', alt '+(u.alt?u.alt.id:'none')+')')}

 // 7. Melee Mode shooters held off by the press find another foe as other fighters do
 {const f=start([{type:'hum_bow',count:4}],[{type:'hum_foot',count:4}]),g=f.mine[0],u=g.units[0],[e,z]=f.foes[0].units;g.melee=true;
  g.units.forEach(q=>q.s={...q.s,spd:0});f.foes[0].units.slice(2).forEach(q=>{q.x=1100});e.x=u.x+20;e.y=u.y;z.x=u.x+60;z.y=u.y;u.blockT=t.CROWD.wait;t.aiUnit(u,.01,null);
  ok(u.inMelee&&u.alt===z&&u.tgt===z,'a Melee Mode archer blocked from his foe turns on one with room (alt '+(u.alt?u.alt.id:'none')+')')}

 // 8. morale above its ceiling (Rally, war cries, an enemy leader's fall) drifts back down to it: a boost is for a while
 {const f=start([{type:'hum_foot',count:10}]),g=f.mine[0],r=g.resolve;L.step(5);const top=r.ceiling();g.useAbility('rally');const m0=r.mor;
  const t0=t.B.t;stepFor(5);const m5=r.mor,dt5=t.B.t-t0;stepFor(40);
  ok(m0>top+5&&m5<m0-3&&m5>top,'a Rally above the ceiling fades slowly ('+f2(m0)+' -> '+f2(m5)+' in '+dt5.toFixed(1)+' combat s, ceiling '+f2(top)+')');
  ok(Math.abs(r.mor-r.ceiling())<.01,'and settles at the ceiling ('+f2(r.mor)+')')}

 // 9. a run too short to count as a charge costs no charge stamina
 {const f=start([{type:'hum_foot',count:4}],[{type:'hum_foot',count:4}]),u=f.mine[0].units[0],e=f.foes[0].units[0];at(u,e,'front',C.run*(C.min+C.foot_min)/2);
  const m=t.chargeMul(u,e);ok(m===1&&u.sta===100&&u.run===0,'a footman whose run is short of a charge ('+f2((C.min+C.foot_min)/2)+') spends the run, not his stamina ('+u.sta+')');
  at(u,e,'front',C.run);t.chargeMul(u,e);ok(u.sta<100,'a real charge still costs it ('+f2(u.sta)+')')}
 L.exit();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
