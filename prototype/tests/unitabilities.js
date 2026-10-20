'use strict';
// Unit abilities (battle/unitabilities.js): who has which, cooldowns and durations on the combat clock, each effect measured
// against the same fixture without it, the order bar's ability buttons and keys, and the refusals (routing, morale off, over).
// Scout ahead (the owner, 2026-10-20): only the scout kinds (data/units.js SCOUT_KINDS), farther sight in the fog and more speed
// while on, then its cooldown; with the fog off only the speed (its tooltip says so); the AI's captains using it to find the foe.
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);try{
 const UA=t.UNIT_ABILITIES,ids=g=>t.groupAbilities(g).map(a=>a.id).join(','),G0=()=>t.G;
 // (a paused lab battle; the groups by their place in the left/right lists; the foe parked far away unless a case brings it)
 const start=(left,right=[{type:'hum_foot',count:6}],extra={})=>{if(L.active)L.exit();L.start({leftGroups:left,rightGroups:right,morale:true,deploy:false,paused:true,ai:false,seed:42,...extra});
  const b=t.B;b.obs=[];const mine=t.playerGroups().map(id=>b.groups[id]),foes=Object.values(b.groups).filter(g=>g.foe);
  mine.forEach((g,i)=>{g.placeAt(200,90+i*90);g.face=0;g.currentFacing=0;t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy;u.cd=999})});
  foes.forEach((g,i)=>{g.placeAt(1000,120+i*120);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy;u.cd=999})});return{b,mine,foes}};
 const seeded=(n,f)=>{const r=Math.random;Math.random=t.seeded(n);try{return f()}finally{Math.random=r}};
 const disp=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),snap=m=>m.map(u=>({x:u.x,y:u.y}));
 // ---- who has which
 let f=start([{type:'hum_spear',count:10},{type:'hum_bow',count:8},{type:'hum_knight',count:6},{type:'hum_mage',count:4},{type:'hum_xbow',count:6},{type:'hum_hbow',count:4},{type:'hum_foot',count:8}]);
 let [spear,bow,knight,mage,xbow,hbow,foot]=f.mine;
 ok(ids(spear)==='brace,rally'&&ids(bow)==='fire,rally'&&ids(xbow)==='fire,rally','spear infantry can brace, bow and crossbow archers loose fire arrows, and foot units rally');
 ok(ids(knight)==='spur'&&ids(mage)==='rally'&&ids(foot)==='rally'&&ids(hbow)==='fire,scout','cavalry spur; casters get no fire arrows; mounted archers loose fire arrows and scout ahead but neither rally (not infantry) nor spur (no lance charge) ('+[knight,mage,foot,hbow].map(ids).join(' / ')+')');
 const half=spear.units.slice(0,6);half.forEach(u=>u.s={...u.s,tags:[]});ok(!t.groupHasAbility(spear,'brace')&&t.abilityWhyNot(spear,'brace')==='Not for this unit','a group has an ability only while most of its living, steady members qualify');
 half.forEach(u=>u.hp=0);ok(t.groupHasAbility(spear,'brace'),'the dead no longer count against it');
 ok(t.groupAbilities(spear.id).length===2&&t.groupAbilities(spear.id)[0].n==='Brace'&&spear.abilities().length===2,'groupAbilities accepts a control or an ID; BattleControl.abilities() is the same list');
 ok(!Object.keys(spear).includes('abil')&&!JSON.stringify(spear).includes('abil'),'no ability state is created by looking');
 // ---- cooldown, duration, refusals, pause
 f=start([{type:'hum_spear',count:10}]);spear=f.mine[0];const b=f.b;
 ok(spear.useAbility('brace')&&t.abilityActive(spear,'brace'),'Brace is used and on');
 ok(!spear.useAbility('brace')&&/^Ready in 40 s$/.test(t.abilityWhyNot(spear,'brace')),'the cooldown blocks a second use ('+t.abilityWhyNot(spear,'brace')+')');
 ok(!Object.keys(spear).includes('abil')&&!JSON.stringify(spear).includes('"abil"'),'ability state is not enumerable: group snapshots and saves never see it');
 b.paused=true;const t0=b.t,cd0=t.abilityStatus(spear,'brace').cooldown;t.updateBattle(1);t.updateBattle(1);
 ok(b.t===t0&&t.abilityStatus(spear,'brace').cooldown===cd0&&t.abilityStatus(spear,'brace').left===UA.brace.dur,'pausing advances neither the cooldown nor the time an ability has left');
 L.step(60);const st=t.abilityStatus(spear,'brace');ok(b.t>t0&&st.cooldown<cd0&&st.left<UA.brace.dur&&st.active,'combat time runs both down ('+st.left.toFixed(2)+' s on, '+st.cooldown.toFixed(2)+' s to go)');
 b.t=t0+UA.brace.dur+.01;ok(!t.abilityActive(spear,'brace')&&!t.abilityStatus(spear,'brace').active,'the duration ends the effect');
 ok(!spear.useAbility('brace'),'but it is still cooling down');b.t=t0+UA.brace.cd+.01;ok(t.abilityWhyNot(spear,'brace')===''&&spear.useAbility('brace'),'once the cooldown has run out it can be used again');
 b.over=true;ok(!spear.useAbility('rally')&&t.abilityWhyNot(spear,'rally')==='The battle is over','nothing is used once the battle is over');b.over=false;
 b.deploy=true;ok(t.abilityWhyNot(spear,'rally')==='Not while deploying','nor while deploying');b.deploy=false;
 spear.withdraw();ok(!spear.useAbility('rally')&&t.abilityWhyNot(spear,'rally')==='Withdrawing','nor by a withdrawing group');
 // ---- Brace: stands its ground
 f=start([{type:'hum_spear',count:10},{type:'hum_spear',count:10}]);[spear]=f.mine;const other=f.mine[1];
 spear.moveTo(420,90,{run:true});L.step(20);const mv=spear.mvId;ok(spear.units.some(u=>u.spdNow>0),'(the spearmen are on the move)');
 ok(spear.useAbility('brace')&&spear.order==='hold'&&!spear.queue.length&&spear.mvId===mv,'bracing stops the group where it is: Hold, no waypoints');
 let p0=snap(spear.units);L.step(40);ok(Math.max(...spear.units.map((u,i)=>disp(u,p0[i])))<.5,'braced soldiers stand fast: none takes a step ('+Math.max(...spear.units.map((u,i)=>disp(u,p0[i]))).toFixed(2)+' px)');
 // knockback: the same shove on a braced and an unbraced spearman
 const kb=spear.units[4],ku=other.units[4],kb0={x:kb.x,y:kb.y},ku0={x:ku.x,y:ku.y};kb.kx=ku.kx=240;kb.ky=ku.ky=0;let db=0,du=0;
 for(let i=0;i<40;i++){L.step(1);db=Math.max(db,disp(kb,kb0));du=Math.max(du,disp(ku,ku0))}ok(db<du*.4,'a push barely moves a braced spearman ('+db.toFixed(1)+' px against '+du.toFixed(1)+' px unbraced)');
 spear.moveTo(300,90);ok(!t.abilityActive(spear,'brace'),'a move order ends the brace at once');L.step(1);ok(!(t.B.t<spear.abil.brace.until),'and its timer is closed');
 // charge damage: a full-momentum knight and a running footman into the braced and the unbraced line from one side, same random
 // stream; run 0 is the same blow walked in. Spearmen always brace against a charge on their front; Brace adds the flanks, never the rear
 const chargeHit=(braced,side,run=t.CHARGE.run)=>{const f2=start([{type:'hum_spear',count:10}],[{type:'hum_knight',count:3},{type:'orc_grunt',count:3}]),g=f2.mine[0];
  if(braced)g.useAbility('brace');const blow=(a,tg,n)=>{tg.hp=tg.max=999;a.x=tg.x+(side==='rear'?-12:side==='flank'?0:12);a.y=tg.y+(side==='flank'?12:0);a.run=run;a.sta=100;
   const at=t.sideOf(tg,a),was=tg.hp;seeded(n,()=>t.attack(a,tg));return{d:was-tg.hp,at,run:a.run}};
  return{kn:blow(f2.foes[0].units[0],g.units[0],77),ft:blow(f2.foes[1].units[0],g.units[5],78)}};
 const H={};for(const side of ['front','flank','rear'])H[side]={u:chargeHit(false,side),b:chargeHit(true,side),w:chargeHit(false,side,0)};
 ok(['front','flank','rear'].every(k=>H[k].u.kn.at===k&&H[k].b.ft.at===k),'(each charge lands on the side meant)');
 ok(H.front.u.kn.d===H.front.w.kn.d&&H.front.b.kn.d===H.front.w.kn.d&&H.front.u.ft.d===H.front.w.ft.d,'spearmen facing a charge brace against it, braced or not: no more than a blow walked in ('+H.front.u.kn.d+', '+H.front.b.kn.d+' against '+H.front.w.kn.d+')');
 ok(H.flank.b.kn.d===H.flank.w.kn.d&&H.flank.u.kn.d>H.flank.w.kn.d*1.5,'Brace covers the flanks: a rider there does what a walked-in blow does ('+H.flank.b.kn.d+' against '+H.flank.w.kn.d+'; unbraced '+H.flank.u.kn.d+')');
 ok(H.flank.b.ft.d===H.flank.w.ft.d&&H.flank.u.ft.d>H.flank.w.ft.d,'so does a charging footman: Brace holds against any charger ('+H.flank.b.ft.d+' against '+H.flank.w.ft.d+'; unbraced '+H.flank.u.ft.d+')');
 ok(H.rear.b.kn.d===H.rear.u.kn.d&&H.rear.b.kn.d>H.rear.w.kn.d*1.5,'a charge from behind is not braced against ('+H.rear.b.kn.d+' braced, '+H.rear.u.kn.d+' unbraced, '+H.rear.w.kn.d+' walked in)');
 ok(H.flank.b.kn.run===0&&H.front.u.kn.run===0,'the charge is spent on that blow as before');
 // ---- Fire arrows
 const shot=(fire,type='hum_bow')=>{const f4=start([{type,count:6}],[{type:'hum_guard',count:4}]),g=f4.mine[0],a=g.units[0],e=f4.foes[0].units[0];e.x=a.x+150;e.y=a.y;if(fire)g.useAbility('fire');const n=t.B.arrows.length;seeded(91,()=>t.attack(a,e));return{g,a,e,arrow:t.B.arrows[n],f4}};
 const plain=shot(false),fire=shot(true);
 ok(plain.arrow&&t.dtOf(plain.arrow.src)==='pierce'&&fire.arrow&&t.dtOf(fire.arrow.src)==='fire'&&fire.arrow.src.fireArrow,'fire arrows carry fire damage, plain ones pierce');
 ok(Math.abs(fire.arrow.dmg/plain.arrow.dmg-UA.fire.mul)<1e-9,'with a modest bonus (x'+UA.fire.mul+')');
 ok(t.matchup(fire.arrow.src,fire.e.s)>t.matchup(plain.arrow.src,plain.e.s),'fire is magical: the plate of the guards does not stop it ('+t.matchup(fire.arrow.src,fire.e.s).toFixed(2)+' against '+t.matchup(plain.arrow.src,plain.e.s).toFixed(2)+')');
 ok(fire.a.s.dt==='pierce'&&t.arrowSrc(fire.a,fire.a.s)===fire.arrow.src,'the archers keep their own stats; one fire copy per kind');
 {const v0=(t.B.vfx||[]).length;fire.g.step(1/60);ok((t.B.vfx||[]).slice(v0).some(p=>p.k==='ember'&&p.col===UA.fire.col),'a fire arrow in flight trails embers')}
 {const e=fire.e,hp=e.hp;e.x=fire.arrow.x+fire.arrow.vx*.3;fire.f4.b.units.filter(u=>u.team===1&&u!==e).forEach(u=>u.x=2000);let landed=false;for(let i=0;i<200&&!landed;i++){L.step(1);landed=!t.B.arrows.includes(fire.arrow)}ok(landed,'(the arrow lands)')}
 fire.f4.b.t+=UA.fire.dur+.1;{const n=t.B.arrows.length;seeded(91,()=>t.attack(fire.a,fire.e));ok(t.dtOf(t.B.arrows[n].src)==='pierce','after its duration they shoot ordinary arrows again')}
 {const x=shot(true,'hum_xbow');ok(x.arrow&&t.dtOf(x.arrow.src)==='fire'&&!x.arrow.arc,'crossbow bolts burn too')}
 // ---- Spur
 f=start([{type:'hum_knight',count:6},{type:'hum_knight',count:6}]);const [k1,k2]=f.mine;k1.setWalk(true);
 const sta0=k1.units[0].sta;ok(k1.useAbility('spur')&&k1.units.every(u=>u.run===t.CHARGE.run&&t.momentum(u)===1),'Spur gives every rider full charge momentum at once');
 ok(k1.units[0].sta<sta0&&k1.run&&!t.walking(k1),'it costs stamina and sets them at a run ('+sta0+' -> '+k1.units[0].sta.toFixed(1)+')');
 ok(t.abilitySpeed(k1.units[0])===UA.spur.spd&&t.abilitySpeed(k2.units[0])===1,'spurred riders are faster');
 k1.moveTo(900,90,{run:true});k2.moveTo(900,180,{run:true});p0=snap(k1.units);let q0=snap(k2.units);L.step(30);
 const d1=k1.units.reduce((n,u,i)=>n+disp(u,p0[i]),0)/k1.units.length,d2=k2.units.reduce((n,u,i)=>n+disp(u,q0[i]),0)/k2.units.length;ok(d1>d2*1.2,'and cover more ground ('+d1.toFixed(1)+' px against '+d2.toFixed(1)+' px)');
 f.b.t=k1.abil.spur.at+UA.spur.dur+.01;ok(t.abilitySpeed(k1.units[0])===1&&!t.abilityActive(k1,'spur'),'the burst ends after its '+UA.spur.dur+' s');
 f.b.t=k1.abil.spur.readyAt+.01;k1.units.forEach(u=>u.sta=5);ok(!k1.useAbility('spur')&&t.abilityWhyNot(k1,'spur')==='Too tired','spent riders cannot be spurred');
 // ---- Rally
 f=start([{type:'hum_foot',count:10}]);foot=f.mine[0];let r=foot.resolve;r.mor=-4;f.b.t+=.01;t.moraleTick(.01);
 ok(r.state==='breaking'&&!r.routed,'(the line is Breaking)');ok(foot.useAbility('rally')&&r.mor===UA.rally.gain&&r.state!=='breaking'&&!r.breakT&&foot.units.every(u=>u.mor===r.mor),'Rally lifts the shared morale (from 0 when breaking) and ends the Breaking');
 t.moraleTick(.7);ok(!r.routed,'so the line does not rout');
 f.b.t=foot.abil.rally.readyAt;r.mor=50;ok(foot.useAbility('rally')&&r.mor===50+UA.rally.gain,'+'+UA.rally.gain+' on a steady line');
 f.b.t=foot.abil.rally.readyAt;r.mor=95;ok(foot.useAbility('rally')&&r.mor===100,'capped at 100');
 f.b.t=foot.abil.rally.readyAt;r.route();ok(r.routed&&!foot.useAbility('rally')&&t.abilityWhyNot(foot,'rally')==='Routing','no rally while routing');
 f=start([{type:'hum_foot',count:10}],undefined,{morale:false});ok(f.b.noMorale&&ids(f.mine[0])==='rally'&&!f.mine[0].useAbility('rally')&&t.abilityWhyNot(f.mine[0],'rally')==='Morale is off','with morale off Rally is listed but refused');
 // ---- Scout ahead: only the scout kinds; characters never
 {const K=[...t.SCOUT_KINDS];ok(K.length>=8&&K.every(k=>t.ST[k]&&!t.ST[k].beast&&!t.ST[k].big&&!t.COMPS[k])&&['ranger','orc_hunter','elf_marks','hum_hbow','orc_wolf','elf_hart'].every(t.isScout)&&!['hum_knight','hum_bow','hum_spear','elf_archer','dw_iron','orc_grunt','brann','tavi'].some(t.isScout),'the scout kinds are light, fast troops ('+K.join(', ')+'), none heavy, none a character');
  const f5=start([{type:'ranger',count:6},{type:'orc_wolf',count:6},{type:'elf_marks',count:6},{type:'hum_bow',count:6},{type:'hum_knight',count:6},{type:'orc_hunter',count:6}]),[rg,wolf,mk,hb,kn,hu]=f5.mine;
  ok(ids(rg)==='fire,rally,scout'&&ids(wolf)==='spur,scout'&&ids(mk)==='fire,rally,scout'&&ids(hu)==='fire,rally,scout','rangers, hunters, marksmen and wolf riders have Scout ahead ('+[rg,wolf,mk,hu].map(ids).join(' / ')+')');
  ok(!t.groupHasAbility(hb,'scout')&&!t.groupHasAbility(kn,'scout')&&t.abilityWhyNot(kn,'scout')==='Not for this unit'&&!kn.useAbility('scout'),'bowmen and knights do not, and are refused it');
  ok(!UA.scout.who({type:'ranger',s:t.ST.ranger,hero:true})&&!UA.scout.who({type:'ranger',s:t.ST.ranger,comp:true})&&UA.scout.who({type:'ranger',s:t.ST.ranger}),'a character never counts as a scout, whatever his kind')}
 // ---- Scout ahead: the fog pushed back and the speed while on, then the cooldown
 {const f6=start([{type:'hum_hbow',count:6},{type:'hum_hbow',count:6}],[{type:'hum_foot',count:6}],{fog:true}),[s1,s2]=f6.mine,b6=f6.b,foe=f6.foes[0];
  foe.units.forEach(u=>{u.x=s1.units[0].x+400;u.y=s1.units[0].y});s2.placeAt(s1.ax,s1.ay+300);t.layForm(s2.id);s2.units.forEach(u=>{u.x=s2.ax+u.sx;u.y=s2.ay+u.sy});t.sightStep(true);const u0=s1.units[0],R0=t.fogRange(u0);
  ok(b6.fog&&R0===t.FOG.mounted&&foe.units.every(u=>!t.seenBy(0,u)),'(fog: the riders see '+R0+' px; the foot 400 px off are unseen)');
  ok(s1.useAbility('scout')&&t.abilityActive(s1,'scout')&&!t.abilityActive(s2,'scout'),'Scout ahead is used, on for that group alone');
  ok(t.fogRange(u0)===Math.round(R0*UA.scout.sight)&&t.fogRange(s2.units[0])===R0&&foe.units.every(u=>t.seenBy(0,u)),'its sight reaches '+t.fogRange(u0)+' px (x'+UA.scout.sight+') in the fog: the foot 400 px off are seen at once');
  ok(t.abilitySpeed(u0)===UA.scout.speed&&t.abilitySpeed(s2.units[0])===1,'and the scouts are faster (x'+UA.scout.speed+')');
  foe.units.forEach(u=>u.x+=2000);s1.moveTo(900,s1.ay);s2.moveTo(900,s2.ay);const a0=snap(s1.units),c0=snap(s2.units);L.step(30);
  const m1=s1.units.reduce((n,u,i)=>n+u.x-a0[i].x,0)/6,m2=s2.units.reduce((n,u,i)=>n+u.x-c0[i].x,0)/6;ok(m1>m2*1.12,'covering more ground ('+m1.toFixed(1)+' px against '+m2.toFixed(1)+' px)');
  ok(t.abilityWhyNot(s1,'scout')==='Ready in '+Math.ceil(s1.abil.scout.readyAt-b6.t-1e-9)+' s'&&!s1.useAbility('scout'),'a second use waits for its cooldown');
  b6.t=s1.abil.scout.at+UA.scout.dur+.01;t.sightStep(true);ok(!t.abilityActive(s1,'scout')&&t.fogRange(u0)===R0&&t.abilitySpeed(u0)===1,'after its '+UA.scout.dur+' s their sight and speed are as before');
  ok(!s1.useAbility('scout')&&/^Ready in \d+ s$/.test(t.abilityWhyNot(s1,'scout')),'then it rests ('+t.abilityWhyNot(s1,'scout')+')');
  b6.t=s1.abil.scout.readyAt+.01;ok(t.abilityWhyNot(s1,'scout')===''&&UA.scout.cd>UA.scout.dur,'ready again after its '+UA.scout.cd+' s cooldown');
  t.selectGroup(s1.id);const sb=document.querySelector('#bbar .abils [data-abil="scout"]');ok(sb&&sb.querySelector('.k').textContent==='O'&&/Scout ahead \(O\)/.test(sb.title)&&!/Fog of war is off/.test(sb.title),'its button on the order bar: key O, a tooltip with no fog warning while the fog is on');
  G0().mode='battle';window.dispatchEvent(new KeyboardEvent('keydown',{key:'o',code:'KeyO',bubbles:true}));ok(s1.abil.scout.at===b6.t,'O scouts ahead with the selection')}
 {const f7=start([{type:'hum_hbow',count:6}],undefined,{fog:false}),s=f7.mine[0],u=s.units[0],R=t.fogRange(u);t.selectGroup(s.id);const sb=document.querySelector('#bbar .abils [data-abil="scout"]');
  ok(!f7.b.fog&&sb&&/Fog of war is off: only the speed applies/.test(sb.title),'with the fog off its tooltip says only the speed applies');
  ok(s.useAbility('scout')&&t.abilitySpeed(u)===UA.scout.speed&&t.fogRange(u)===Math.round(R*UA.scout.sight),'and it still speeds them (the fog range is read only by the fog)')}
 // ---- Scout ahead: the AI's captains use it to find the foe, never with every foe in sight
 {const f8=start([{type:'hum_foot',count:6}],[{type:'orc_wolf',count:6},{type:'orc_grunt',count:6}],{fog:true,ai:true,distance:800});const [wf,gr]=f8.foes;L.step(40);
  ok(wf.abil&&wf.abil.scout&&wf.abil.scout.at<1&&!(gr.abil&&gr.abil.scout),'in the fog, seeing none of yours, their wolf riders scout ahead at once ('+(wf.abil&&wf.abil.scout?wf.abil.scout.at.toFixed(2)+' s':'not used')+'); the grunts cannot');
  f8.b.t=Math.max(wf.abil.scout.readyAt,UA.scout.aiEarly)+1;f8.foes.forEach(g=>g.units.forEach(u=>{u.x=f8.mine[0].units[0].x+60;u.y=f8.mine[0].units[0].y}));t.sightStep(true);const at=wf.abil.scout.at;L.step(40);
  ok(wf.abil.scout.at===at,'with yours in plain sight after its first '+UA.scout.aiEarly+' s it is not used again');
  const f9=start([{type:'hum_foot',count:6}],[{type:'orc_wolf',count:6}],{fog:false,ai:true,distance:800});L.step(60);ok(!(f9.foes[0].abil&&f9.foes[0].abil.scout),'with no fog (and no ground hiding them) every foe is seen: never used')}
 // ---- the enemy (an AI captain) uses the same API
 f=start([{type:'hum_foot',count:6}],[{type:'hum_bow',count:6}]);ok(f.foes[0].useAbility('fire')&&t.abilityActive(f.foes[0],'fire'),'an enemy group uses its abilities through the same API');
 // ---- the order bar
 f=start([{type:'hum_spear',count:10},{type:'hum_spear',count:10},{type:'hum_bow',count:8}]);[spear]=f.mine;const sp2=f.mine[1],bw=f.mine[2];
 const fixed=()=>[...document.querySelectorAll('[data-order],[data-flag],[data-form]')].map(x=>x.dataset.order||x.dataset.flag||x.dataset.form).join(),before=fixed();
 const bar=()=>document.querySelector('#bbar .abils'),btn=id=>bar().querySelector('[data-abil="'+id+'"]');
 t.selectGroup(spear.id);ok(bar()&&!bar().hidden&&[...bar().children].map(x=>x.dataset.abil).join()==='brace,rally','the selected spearmen show Brace and Rally on the order bar');
 ok(fixed()===before&&!document.querySelector('[data-abil][data-order],[data-abil][data-flag],[data-abil][data-form]'),'the order, flag and formation buttons are unchanged');
 ok(btn('brace').querySelector('svg')&&btn('brace').querySelector('.k').textContent==='G'&&/Brace \(G\)/.test(btn('brace').title)&&/Ready/.test(btn('brace').title)&&!btn('brace').disabled,'each button has its icon, key and a tooltip');
 btn('brace').click();ok(t.abilityActive(spear,'brace')&&!t.abilityActive(sp2,'brace'),'a press uses it for the selected group only');
 ok(btn('brace').classList.contains('on')&&btn('brace').getAttribute('aria-pressed')==='true'&&btn('brace').querySelector('.at').textContent===String(UA.brace.dur)&&parseFloat(btn('brace').querySelector('.acd').style.height)===0,'the button is lit while it is on, with its seconds left (no cooldown shade yet)');
 f.b.t+=UA.brace.dur+2;t.setOrderUI();const h=parseFloat(btn('brace').querySelector('.acd').style.height);
 ok(btn('brace').disabled&&!btn('brace').classList.contains('on')&&h>50&&h<100&&btn('brace').querySelector('.at').textContent===String(UA.brace.cd-UA.brace.dur-2),'then dimmed, a cooldown shade over it ('+h.toFixed(0)+'%) and the seconds to go');
 ok(/Unavailable: ready in \d+ s/.test(btn('brace').title),'its tooltip gives the reason ('+btn('brace').title.split('Unavailable: ')[1]+')');
 f.b.t+=20;t.setOrderUI();ok(parseFloat(btn('brace').querySelector('.acd').style.height)<h,'the shade shrinks as the cooldown runs');
 t.selectGroup(sp2.id,true);ok(!btn('brace').disabled&&/Ready for 1 of 2/.test(btn('brace').title),'with several selected, it is ready while any of them can use it');
 btn('brace').click();ok(t.abilityActive(sp2,'brace'),'and a press uses it for those that can');
 t.selectGroup(bw.id);ok([...bar().children].map(x=>x.dataset.abil).join()==='fire,rally','the buttons follow the selection');
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'ร',code:'KeyI',bubbles:true}));ok(t.abilityActive(bw,'fire'),'I looses fire arrows (keys by position, any layout)');
 t.selectGroup('all');ok([...bar().children].map(x=>x.dataset.abil).join()==='brace,fire,rally','All selected: every ability any group has');
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'y',code:'KeyY',bubbles:true}));ok([spear,sp2,bw].every(g=>g.abil.rally),'Y rallies every selected group');
 const hero=t.playerGroups().find(id=>id==='hero');if(hero){t.selectGroup(hero);ok(bar().hidden,'a selection without abilities hides the group')}
 else{f.b.sel=[];t.setOrderUI();ok(bar().hidden,'a selection without abilities hides the group')}
 L.exit();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
