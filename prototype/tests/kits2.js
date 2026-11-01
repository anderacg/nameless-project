'use strict';
window.PHONE=true;// (run in a phone's window, 844 x 390 with touch: tests/run-tests.ps1; the phone's order bar below)
// Unit kits, step 2 (doc/UNIT_KITS_DESIGN.md §10.2: the new rules, the owner's, 2026-11-01): ranks give stats only, named Recruit to
// Elite (§6); mastery, five levels, a pick each from the kind's menu (unlock, improve, perk, drill: §7, data/kits.js MASTERY, KITS);
// Brace a stance with no timer (front and flanks braced while standing, a move ends it; an unbraced spear line takes a charge's
// bonus: §3, battlecontrol.js plant, morale.js spearBraced); Lunge (§5); the traits Anti-cavalry and Anti-large (§4); Fire arrows
// bought from the tech tree (data/buffs.js skill) in the next slot; the cap of five skills; every key of §7b, each selected kind its
// own slot; the AI's picks, stances and fire arrows (§9); old saves' picks read as the new menu's (core/ranks.js kitsMigrate); the
// order bar on a phone; no runtime errors. Each part has its switch (RANKS.statsOnly, mastery5; KITS.brace, traits2, cap, keys2):
// tests/unitkit.js and the step-1 suites run with them off.
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,L=t.BattleLab,R=t.RANKS,K=t.KITS,Gp=(type,count)=>({type,count}),ids=a=>a.map(x=>x.id).join(),q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
 const press=(code,k,o)=>window.dispatchEvent(new KeyboardEvent('keydown',{code,key:k||code.slice(3).toLowerCase(),bubbles:true,...o}));
 const lab=(left,right=[Gp('hum_foot',6)],o={})=>{if(L.active)L.exit();G.mode='world';G.modal=false;L.start({leftGroups:left,rightGroups:right,morale:true,deploy:false,paused:true,ai:false,seed:42,...o});const B=t.B;B.obs=[];G.mode='battle';
   t.playerGroups().map(id=>B.groups[id]).forEach((g,i)=>{g.placeAt(200,90+i*90);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy;u.cd=999})});
   Object.values(B.groups).filter(g=>g.foe).forEach(g=>{g.placeAt(1000,200);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0);u.cd=999})});return B};
 const kit=(type,rank,more)=>t.UnitKit.of({type,rank,...more}),sk=Kt=>Kt.skills.map(x=>x.id).join(),near=(a,b)=>Math.abs(a-b)<1e-6;
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;const ai0=R.ai,dm0=t.DISMOUNT.on,ph0=t.PHYSICS.on,cp0=t.COMMANDS.on;t.DISMOUNT.on=true;
 try{
  ok(R.statsOnly&&R.mastery5&&K.brace&&K.traits2&&K.cap&&K.keys2,'step 2\'s switches all on in the game');
  // ======== ranks give stats only (§6)
  {const S1=kit('hum_spear',1),S5=kit('hum_spear',5),P5=R.per;
   ok(near(S5.stats.dmg,4*P5.dmg)&&near(S5.stats.hp,4*P5.hp)&&near(S5.stats.aim,4*P5.aim)&&S5.stats.mor===4*P5.mor&&near(S5.stats.vig,4*P5.vig)&&!S1.stats.dmg&&!S1.stats.mor,'rank 5: +'+Math.round(S5.stats.dmg*100)+'% damage, health and aim, +'+S5.stats.mor+' morale, +'+Math.round(S5.stats.vig*100)+'% vigor; rank 1 none');
   ok(sk(S1)===sk(S5)&&sk(S5)==='lunge,rally'&&sk(kit('hum_bow',1))==='rapid'&&sk(kit('hum_bow',5))==='rapid','no skill from a rank: spearmen Lunge and Rally, bowmen Rapid shot, at rank 1 and 5 alike');
   ok([1,2,3,4,5].map(t.rankWord).join()==='Recruit,Trained,Seasoned,Veteran,Elite','the ranks named: Recruit, Trained, Seasoned, Veteran, Elite');
   ok(near(kit('hum_spear',5,{mxp:300,picks:['drill']}).stats.dmg,4*P5.dmg+R.drill.dmg),'a Drill: +1% more');
   const one=()=>{const B=lab([Gp('hum_spear',6)]);B.paused=false;t.updateBattle(.01);return B.units.find(u=>u.team===0)};
   R.ai=1;const u1=one(),d1=u1.s.dmg,h1=u1.max,v1=u1.vig,m1=t.rankMor(u1),s1=u1.mor0;R.ai=5;const u5=one();
   // (his morale's points on his start, morale.js moraleInit; a lab's too (lab.js initialize: the owner, 2026-11-01))
   ok(near(u5.s.dmg/d1,1+4*P5.dmg)&&Math.abs(u5.max/h1-(1+4*P5.hp))<.03&&t.rankMor(u5)===4*P5.mor&&!m1&&near(u5.vig/v1,1+4*P5.vig),'in battle a rank-5 spearman: damage ×'+(u5.s.dmg/d1).toFixed(2)+', health ×'+(u5.max/h1).toFixed(2)+', morale +'+t.rankMor(u5)+', vigor ×'+(u5.vig/v1).toFixed(2));
   ok(u5.mor0-s1===4*P5.mor&&u5.mor0===Math.round(t.unitMoraleOf(u5.s)+t.rankMor(u5)),'a lab\'s soldiers start with their rank\'s morale, as a real battle\'s (rank 5: '+s1+' → '+u5.mor0+')');
   ok(near(t.rankAim(u5),1-4*P5.aim),'and his aim 12% truer ('+t.rankAim(u5).toFixed(3)+')')}
  // ======== mastery: five levels, one pick each (§7)
  {ok(t.masteryEnds().join()==='300,700,1200,1800,2500'&&[1,2,3,4,5].map(t.masteryWord).join()==='Adept,Expert,Master,Grandmaster,Legend','five levels: Adept 300, Expert 700, Master 1,200, Grandmaster 1,800, Legend 2,500');
   const g={type:'hum_spear',rank:5};const lv=[0,299,300,700,1200,1800,2500].map(x=>{g.mxp=x;return t.masteryOf(g)});ok(lv.join()==='0,0,1,2,3,4,5','its level by its experience past rank 5 ('+lv.join()+')');
   t.rankGain(g,5000);ok(g.mxp===2500&&t.masteryNeed(g)===0&&t.masteryPending(g)===5,'capped at Legend: five picks to make');
   const M=kit('hum_spear',5).menu;ok(M.join()===K.kinds.spear.menu.join()&&M.length>=6,'the spear\'s menu: '+M.map(id=>t.MASTERY[id].n).join(', '));
   t.masteryPick(g,'pikePush');t.masteryPick(g,'lungeUp');t.masteryPick(g,'longReach');t.masteryPick(g,'drill');t.masteryPick(g,'lungeUp');
   const Kt=t.UnitKit.of(g);ok(sk(Kt)==='lunge,rally,pikePush','unlock a skill: Pike push in the next slot ('+sk(Kt)+')');
   ok(Kt.up('lunge','dur')===2&&near(Kt.up('lunge','dmg'),.1),'improve a skill, again as its own step: Lunge+ twice, +2 s and +10% damage');
   ok(Kt.perks.map(p=>p.id).join()==='longReach'&&Kt.perk('longReach').reach===1.1,'a perk, earned: Long reach (+10% reach), under its traits');
   ok(near(Kt.stats.dmg,4*R.per.dmg+R.drill.dmg),'a Drill: +1% damage, health and aim');
   ok(!t.masteryPick(g,'braceUp')&&t.masteryPending(g)===0,'five levels, five picks: no sixth');
   const O=kit('hum_spear',5,{mxp:2500,picks:['longReach','pikePush']}).opts();ok(!O.includes('longReach')&&!O.includes('pikePush')&&O.includes('lungeUp')&&O.includes('drill'),'a perk or a skill once; an improvement or Drill again ('+O.join()+')');
   // (in battle: the perk on his numbers, the improvement on the skill)
   R.ai=5;const B=lab([Gp('hum_spear',6)]),sg=B.groups[t.playerGroups()[0]],rec=t.battleRec(sg);Object.assign(rec,{mxp:2500,picks:['longReach','lungeUp']});B.paused=false;t.updateBattle(.01);
   ok(Math.abs(sg.units[0].s.reach/t.ST.hum_spear.reach-1.1)<.01&&t.rankDur(sg,'lunge')===t.UNIT_SKILLS.lunge.dur+1,'in battle: Long reach on his reach, Lunge+ on Lunge\'s time ('+t.rankDur(sg,'lunge')+' s)')}
  // ======== the pick window (the Army window): the menu, each option's effect in words
  {G.mode='world';G.modal=false;t.hidePanel();P.sk.lead.lv=10;const r=t.partyRoster(P);r.add('hum_spear',5,'new');const g=r.groups.filter(x=>x.type==='hum_spear').pop();Object.assign(g,{rank:5,mxp:700});
   G.char='roster';t.openChar();t.act('party-select',g.id);t.act('party-path',g.id);const pk=qa('.fb-mastery .fb-mpick'),tx=q('.fb-mastery')?.textContent||'';
   ok(pk.length===K.kinds.spear.menu.length&&/Expert|Adept/.test(tx)&&/Brace\+.*pushes move them 20% less/.test(tx),'Adept: the spear\'s menu, each option its effect ("Brace+: pushes move them 20% less") ('+pk.length+')');
   pk.find(b=>b.dataset.arg===g.id+':braceUp').click();t.act('party-select',g.id);t.act('party-path',g.id);
   ok(g.picks.join()==='braceUp'&&qa('.fb-mastery .fb-mpick').length===K.kinds.spear.menu.length,'picked Brace+; the next level\'s choice shown');
   q('.fb-mastery [data-arg="'+g.id+':hedge"]').click();t.act('party-select',g.id);t.act('party-path',g.id);
   const d=q('.fb-inspector').textContent;ok(g.picks.join()==='braceUp,hedge'&&!q('.fb-mastery')&&/Perks \(earned\)/.test(d)&&/Hedge of spears/.test(d)&&/Stances/.test(d)&&/Brace/.test(d)&&/Lunge/.test(d),'both picked: no more to choose; its stances, skills and earned perks listed');
   t.act('party-back');const card=q('.fb-inspector .ucard-x');ok(card&&/Lunge/.test(card.textContent)&&/★ Hedge of spears/.test(card.textContent)&&/Q · Brace/.test(card.textContent)&&/Expert|Elite/.test(q('.fb-inspector').textContent),'its card: traits, stances, skills in their slots, the earned perk, its rank\'s and mastery\'s names');
   t.act('char-close');r.remove('hum_spear',5,g.id)}
  // ======== Brace, a stance (§3)
  {t.PHYSICS.on=false;R.ai=2;const B=lab([Gp('hum_spear',8)],[Gp('hum_knight',4)]),g=B.groups[t.playerGroups()[0]],sp=g.units[0],kn=B.units.find(u=>u.team===1);B.paused=false;
   const at=(u,side)=>{const f=g.face||0,a=side==='front'?f:side==='flank'?f+Math.PI/2:f+Math.PI;u.x=sp.x+Math.cos(a)*14;u.y=sp.y+Math.sin(a)*14;sp.inSlot=true;sp.hd=null},hit=side=>{at(kn,side);kn.run=t.CHARGE.run;return t.chargeMul(kn,sp)};
   ok(t.groupStances(g)[0]==='brace'&&!t.groupHasAbility(g,'brace')&&t.STANCES.brace.who(sp),'spearmen: Brace on their first stance slot, no Brace flanks skill');
   const free=hit('front');ok(free>1&&!t.spearBraced(sp,kn),'unbraced, a charge on their front gets its bonus (×'+free.toFixed(2)+')');
   ok(g.plant('brace',true)&&g.posted('brace')&&!g.planted('brace'),'Brace ordered: planting the spears ('+K.braceAt.set+' s)');
   B.t+=K.braceAt.set+.01;ok(g.planted('brace')&&g.braced&&t.abilityStands(sp),'then braced: they stand fast');
   ok(hit('front')===1&&hit('flank')===1&&hit('rear')>1,'braced: front and flanks take no charge bonus, the rear still does');
   B.t+=600;ok(g.planted('brace'),'no timer: still braced ten minutes on');
   g.moveTo(g.ax+80,g.ay);ok(!g.posted('brace')&&!t.abilityStands(sp)&&hit('front')>1,'a move order ends it');
   t.battleRec(g).picks=['quickBrace'];Object.assign(t.battleRec(g),{rank:5,mxp:300});g.plant('brace',true);ok(g.planted('brace'),'Quick brace: braced at once');
   kn.x=sp.x+3;kn.y=sp.y;sp.kx=sp.ky=0;t.knock(sp,kn.x,kn.y,3);const k0=Math.hypot(sp.kx,sp.ky);t.abilityStep(g,.5);ok(k0>0&&Math.hypot(sp.kx,sp.ky)<k0*.5,'pushes barely move them');
   g.plant('brace',false);t.PHYSICS.on=ph0}
  // ======== Lunge (§5)
  {R.ai=1;const B=lab([Gp('hum_spear',8)],[Gp('hum_foot',8)]),g=B.groups[t.playerGroups()[0]],m=g.units,s0=m[0].s,f=Object.values(B.groups).find(x=>x.foe);B.paused=false;
   f.units.forEach((e,i)=>{e.x=m[i%m.length].x+14;e.y=m[i%m.length].y;e.kx=e.ky=0});g.face=0;
   ok(g.useAbility('lunge')&&near(m[0].s.reach/s0.reach,t.UNIT_SKILLS.lunge.reach)&&near(m[0].s.dmg/s0.dmg,t.UNIT_SKILLS.lunge.dmg),'Lunge: +25% reach, +20% damage');
   ok(f.units.some(e=>e.kx>0),'the enemy\'s front pushed back a step');
   ok(t.abilityWhyNot(g,'lunge')==='Ready in 40 s','40 s cooldown');B.t+=3.01;t.abilityStep(g,.01);ok(m[0].s===s0,'after 3 s, their own numbers again')}
  // ======== the traits (§4)
  {const S=t.ST;ok(t.traitsOf(S.hum_levy).includes('antiCav')&&!t.traitsOf(S.hum_levy).includes('antiLarge')&&t.traitsOf(S.hum_pike).includes('antiLarge')&&!t.traitsOf(S.hum_foot).includes('antiCav'),'Anti-cavalry: every spear; Anti-large: pikes and spear-armed veterans, not levies');
   const tm=(a,d)=>t.typeMul(a,d);ok(near(t.matchup(S.hum_levy,S.hum_knight)/tm(S.hum_levy,S.hum_knight),1.6)&&near(t.matchup(S.hum_pike,S.troll)/tm(S.hum_pike,S.troll),1.4)&&near(t.matchup(S.hum_levy,S.troll)/tm(S.hum_levy,S.troll),1),'×1.6 against riders, ×1.4 against the big (a levy: none)');
   Kit.kits({traits2:false},()=>ok(near(t.matchup(S.hum_levy,S.troll)/tm(S.hum_levy,S.troll),1.6),'its switch off: the one old rule, ×1.6'))}
  // ======== Fire arrows from the tech tree (§5)
  {G.mode='world';G.modal=false;t.hidePanel();P.gold=1e5;const r=t.partyRoster(P),ash=t.townBy('Ashford');r.add('hum_bow',6,'new');const g=r.groups.filter(x=>x.type==='hum_bow').pop();
   ok(t.BUFFS.fireArrows.skill==='fire'&&t.BUFFS.fireArrows.placeholder,'a BUFFS entry teaches Fire arrows (its building a placeholder)');
   ok(t.Buffs.buy(ash,t.BUFFS.fireArrows.at,g.id,'fireArrows'),'bought for a group of bowmen');const Kt=t.UnitKit.of(g);
   ok(sk(Kt)==='rapid,fire'&&Kt.skills[1].from==='tech','Fire arrows in the next free slot ('+sk(Kt)+')');
   R.ai=1;const B=lab([Gp('hum_bow',6)]),bg=B.groups[t.playerGroups()[0]];t.RANK_OF.set(bg,g);t.updateBattle(.01);const u=bg.units[0],cd=u.s.cd;
   ok(t.groupSlots(bg).map(x=>x.id).join()==='rapid,fire'&&bg.useAbility('fire'),'in battle its X slot, used');
   ok(near(u.s.cd/cd,K.fire.cd)&&near(t.rankAim(u),K.fire.aim),'lit: slower shots (×'+K.fire.cd+') and less true (×'+K.fire.aim+')');
   const e=B.units.find(x=>x.team===1),r0=t.resolveOf(e),m0=r0.mor;t.kitStruck(e,4,u,true);ok(r0.mor<m0,'and fear: those it hits shaken');
   r.remove('hum_bow',6,g.id)}
  // ======== the cap of five (§5)
  {const g={type:'hum_hbow',rank:5,mxp:2500,picks:['parthian','rapidSkill'],buffs:[{id:'fireArrows'}]};t.BUFFS._kt={n:'x',skill:'rally',cost:0};g.buffs.push({id:'_kt'});
   try{const Kt=t.UnitKit.of(g);ok(Kt.skills.length===K.max&&sk(Kt)==='spur,scout,parthian,rapid,fire','horse archers: five skills, the sixth bought left out ('+sk(Kt)+')');
    ok(!Kt.opts().some(id=>t.MASTERY[id].sk),'full: no more skills on its menu, only the rest')}finally{delete t.BUFFS._kt}}
  // ======== the keys (§7b): every one, each selected kind its own slot
  {t.COMMANDS.on=true;R.ai=1;const B=lab([Gp('hum_spear',8),Gp('hum_bow',8),Gp('hum_knight',6)]),[sp,bw,kn]=t.playerGroups().map(id=>B.groups[id]);B.paused=false;B.t=1;
   t.selectGroup('all');t.setOrderUI();
   press('KeyQ','q');B.t+=5;ok(sp.posted('brace')&&bw.cease&&(kn.units.some(u=>u.afoot)||kn.abil?.dismount),'Q: stance slot 1, each its own: spearmen brace, bowmen hold fire, knights dismount');
   press('KeyZ','z');ok(sp.abil?.lunge&&bw.abil?.rapid,'Z: skill slot 1, each its own (Lunge, Rapid shot)');
   press('KeyX','x');ok(sp.abil?.rally,'X: slot 2 (Rally)');
   t.selectGroup(sp.id);sp.setWalk(true);press('KeyR','r');ok(!sp.walk,'R: the pace (walk or run)');
   const f0=sp.firm;press('KeyF','f');ok(sp.firm===!f0,'F: hold ground or fight freely');
   press('KeyT','t');ok(sp.form==='loose','T: the formation cycle, line to loose');press('KeyT','t');ok(sp.form==='circle','then a circle');press('KeyT','t');ok(sp.form==='column','then column');press('KeyT','t');ok(sp.form==='line','then line again');
   press('KeyD','d');ok(B.amArm,'D: the attack-move armed');press('Escape','Escape',{key:'Escape'});
   t.selectGroup(sp.id);press('KeyG','g');ok(sp.order==='charge'&&sp.run,'G: Charge, a true order, at a run');
   press('KeyH','h');ok(sp.order==='hold','H: hold');
   const fl=[bw.cease,bw.skirmish,bw.melee].join();t.selectGroup(bw.id);press('KeyM','m');press('KeyS','s');ok([bw.cease,bw.skirmish,bw.melee].join()===fl&&G.mode==='battle','M and S: free (nothing)');
   ok(t.powerKey('y')==='rally'&&t.powerKey('u')==='stand'&&!t.powerKey('r')&&!t.powerKey('s'),'Y U: your hero\'s Rally the Line and Stand Fast!');
   B.t+=100;const at=bw.abil.rapid.at;press('KeyN','n');press('KeyI','i');ok(bw.abil.rapid.at===at&&!bw.abil.fire,'the old letters\' quiet aliases gone (N, I: nothing)');
   press('KeyA','a');ok(t.aiHas(bw),'A: the AI');press('KeyA','a');
   t.selectGroup(sp.id);press('Backspace','Backspace',{key:'Backspace'});ok(sp.order==='withdraw','Backspace: withdraw');
   // (the order bar: each slot its key and what it holds)
   t.selectGroup(bw.id);t.setOrderUI();const ss=qa('#bbar .sslot,.mobile-battle-hud .sslot').filter(b=>!b.hidden),sl=qa('.skills [data-slot]');
   ok(ss.length===1&&ss[0].dataset.stance==='shooting'&&ss[0].querySelector('.k').textContent==='Q'&&sl.length===5&&sl.map(b=>b.querySelector('.k').textContent).join('')==='ZXCVB','the bar: bowmen\'s stance slot Q (Shooting), five skill slots Z X C V B');
   ok(q('#bCharge')&&q('#bCharge .k').textContent==='G'&&q('[data-order="withdraw"] .k').textContent==='⌫','Charge (G) on the bar, Withdraw on ⌫')}
  // ======== the AI (§9): picks by its kind's order, stances by rule, fire arrows by its lord's level
  {R.ai=5;const B=lab([Gp('hum_knight',4)],[Gp('hum_spear',8),Gp('hum_bow',6)]),[fs,fb]=Object.values(B.groups).filter(g=>g.foe),rs=t.battleRec(fs);rs.mxp=1200;
   ok(t.UnitKit.of(rs).picks.join()===K.kinds.spear.ai.slice(0,3).join(),'an AI\'s Master spearmen picked by their kind\'s order ('+t.UnitKit.of(rs).picks.join()+')');
   ok(!t.UnitKit.of(t.battleRec(fb)).has('fire'),'no lord (a band, a lab): no fire arrows');
   const rl={type:'hum_bow',rank:2};t.AI_OF.set(rl,{lv:K.aiFire});ok(t.UnitKit.of(rl).has('fire'),'a lord of level '+K.aiFire+': his archers have them');
   // (its timing (the owner, 2026-11-01: AI_TACTICS braceAt, braceMom, braceT, braceIn, braceKeep): only for a charge truly coming at
   // its front at speed, soon enough to plant the spears; taken up once it has struck or turned away, never kept against riders
   // standing in the melee, again only for a new run-up)
   t.PHYSICS.on=false;const kn=B.units.filter(u=>u.team===0),C=fs.centre(),ride=(x,v,dir)=>kn.forEach((u,i)=>{u.x=C.x-x;u.y=C.y-20+i*12;u.run=t.CHARGE.run;u.cd=999;u.spdNow=v*u.s.spd;u.dir=dir}),think=()=>{t.command(1);return t.braceOn(fs)};fs.face=Math.PI;
   ride(220,1,0);const far=think();ride(70,.3,0);const slow=think();ride(70,1,Math.PI);const away=think();
   ok(!far&&!slow&&!away,'no brace for riders out of reach ('+far+'), at a walk ('+slow+') or riding off ('+away+')');
   ride(70,1,0);ok(think()&&fs.posted('brace'),'riders charging at its front: the AI\'s spear group braces (the stance)');
   ride(40,1,0);ok(think(),'kept while they still come');ride(15,0,0);ok(!think(),'struck, the riders standing in the melee: the brace taken up');
   ride(15,1,0);ok(!think(),'riders wheeling in the melee: no new brace');ride(70,1,0);ok(think(),'a new run-up: braced again');
   fs.plant('brace',false);t.PHYSICS.on=true;ride(70,0,Math.PI);kn.forEach(u=>{u.vel=u.s.spd;u.hd=0});ok(think(),'physics on: by the speed and heading of their bodies');t.PHYSICS.on=ph0}
  {R.ai=1;t.PHYSICS.on=false;const B=lab([Gp('hum_bow',10)],[Gp('hum_crossbow',8)]),xb=Object.values(B.groups).find(g=>g.foe);xb.units.forEach(u=>{u.shotAt=B.t});t.command(1);xb.units.forEach(u=>{u.x=xb.ax+(u.sx||0);u.y=xb.ay+(u.sy||0);u.shotAt=B.t});B.t+=.6;t.command(1);
   ok(xb.posted('pavise'),'shot at, the AI\'s crossbows plant their pavises');t.PHYSICS.on=ph0}
  // ======== old saves (§9)
  {const o={type:'hum_spear',rank:5,mxp:1300,picks:['brace','reach','drill']};ok(t.UnitKit.of(o).picks.join()==='braceUp,longReach,drill','an old save\'s picks read as the new menu: brace Brace+, reach Long reach, drill Drill');
   const a={type:'hum_spear',rank:5,mxp:1300,picks:['brace']};t.kitsMigrate(a);ok(a.picks.join()==='braceUp,longReach,hedge','and what its rank gave it kept as picks, up to its levels (Master: three)');
   const b={type:'hum_bow',rank:3,picks:[]};t.kitsMigrate(b);ok(!b.picks.length,'none past its levels (rank 3, no mastery)');
   const c={type:'hum_bow',rank:5,mxp:5000,picks:['fire']};t.kitsMigrate(c);ok(c.picks.join()==='hotCoals,fireSkill,steadyAim,marksmen','bowmen: fire Hot coals; their rank\'s Fire arrows, Steady aim, Marksmen as picks');
   const r=t.partyRoster(P);r.add('hum_spear',4,'new');const g=r.groups.filter(x=>x.type==='hum_spear').pop();Object.assign(g,{rank:5,mxp:700,picks:['reach']});
   t.Saves.part('kits').settle(0);ok(g.picks.join()==='longReach,hedge','loaded from a save with no kits piece: its groups read again');
   ok(t.Saves.part('kits').save()===2,'a new save carries it');r.remove('hum_spear',4,g.id)}
  // ======== the phone's order bar (mobilebattlehud): spearmen, bowmen and knights selected
  if(window.mobileBattleHud?.enabled||window.mobileWorldHud?.media.matches){R.ai=1;lab([Gp('hum_spear',8),Gp('hum_bow',8),Gp('hum_knight',6)]);t.selectGroup('all');t.frame();t.setOrderUI();
   const tg=document.getElementById('battleOrdersToggle');if(tg)tg.click();const D=document.getElementById('battleOrderChoices'),shown=e=>!!e.getClientRects().length&&getComputedStyle(e).display!=='none',r=e=>e.getBoundingClientRect();
   const bs=D?[...D.querySelectorAll('.borders .obtn')].filter(shown):[],over=bs.some((a,i)=>bs.some((b,j)=>j>i&&!(r(a).right<=r(b).left+.5||r(b).right<=r(a).left+.5||r(a).bottom<=r(b).top+.5||r(b).bottom<=r(a).top+.5)));
   ok(D&&bs.length>=12&&bs.every(b=>r(b).width>=44&&r(b).height>=44&&r(b).left>=r(D).left-.5&&r(b).right<=r(D).right+.5)&&!over&&bs.some(b=>b.classList.contains('sslot')),'on a phone the bar\'s '+bs.length+' buttons fit: stance slots and skill slots, each at least 44 px, none over another');
   window.mobileBattleHud?.close()}
  else info('(not a phone window: the phone bar unchecked)');
 }finally{if(L.active)L.exit();R.ai=ai0;t.DISMOUNT.on=dm0;t.PHYSICS.on=ph0;t.COMMANDS.on=cp0}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
