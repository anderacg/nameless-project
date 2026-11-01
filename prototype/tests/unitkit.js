'use strict';
// Unit kits, step 1 (doc/UNIT_KITS_DESIGN.md §10: the refactor, the same game): the terms' tables (data/kits.js ORDERS, STANCES,
// KITS; TRAITS, UNIT_SKILLS, COMMANDS) and their old names; UnitKit (battle/unitkit.js), every kind's kit, worked out once and
// kept; its slots by rank as before (Brace flanks at 2, Rally at 4; Fire arrows at 2, Rapid shot at 4); the keys (the owner's
// layout, §7b: Z X C the skill slots, R Rally the Line, V Charge, M the Shooting stance's cycle, Q the pace, J mounted, G and the
// old letters quiet aliases); the order bar's stance rows and skill slots (the phone's drawer: tests/mobilebattlehud.js).
// Step 2 (§10.2) puts each of its parts behind a switch: this suite runs with all of them off (Kit.kits(false)), the proof that
// they give step 1 back; step 2's rules: tests/kits2.js.
Kit.suite(({ok})=>{const t=T,G=t.G,L=t.BattleLab,Gp=(type,count)=>({type,count}),ids=a=>a.map(x=>x.id).join(),q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
 const press=(code,k,o)=>window.dispatchEvent(new KeyboardEvent('keydown',{code,key:k||code.slice(3).toLowerCase(),bubbles:true,...o}));
 const lab=(left,right=[Gp('hum_foot',6)])=>{if(L.active)L.exit();G.mode='world';G.modal=false;L.start({leftGroups:left,rightGroups:right,morale:true,deploy:false,paused:true,ai:false,seed:42});const B=t.B;B.obs=[];G.mode='battle';
   t.playerGroups().map(id=>B.groups[id]).forEach((g,i)=>{g.placeAt(200,90+i*90);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy;u.cd=999})});
   Object.values(B.groups).filter(g=>g.foe).forEach(g=>{g.placeAt(1000,200);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0);u.cd=999})});return B};
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;const ai0=t.RANKS.ai,dm0=t.DISMOUNT.on;t.DISMOUNT.on=true;// (the riders' Mounted row: battle/dismount.js, off in the older suites)
 Kit.kits(false,()=>{try{
  // ======== the tables and their old names
  ok(t.RANK_SKILLS.spear===t.KITS.ladders.spear&&t.RANK_SKILLS.bow===t.KITS.ladders.bow&&t.UNIT_ABILITIES===t.UNIT_SKILLS&&t.UNIT_ABIL_ORDER===t.SKILL_ORDER&&t.COMMAND_POWERS===t.COMMANDS,'the old names are the new tables: RANK_SKILLS (KITS\' ladders), UNIT_ABILITIES (UNIT_SKILLS), COMMAND_POWERS (COMMANDS)');
  ok(Object.keys(t.TRAITS).every(id=>t.ABILITIES[id]===t.TRAITS[id]&&t.TRAITS[id].kind==='trait')&&Object.keys(t.ABILITIES).every(id=>t.ABILITIES[id].kind==='trait'?t.TRAITS[id]:t.HERO_SKILLS[id]),'ABILITIES is the characters\' skills and the traits (TRAITS), one list as before');
  ok(Object.keys(t.ST).filter(k=>t.ST[k].race||t.ST[k].beast).every(k=>t.traitsOf(t.ST[k]).join()===Object.keys(t.ABILITIES).filter(id=>t.ABILITIES[id].kind==='trait'&&t.ABILITIES[id].has(t.ST[k])).join()),'a unit\'s traits as before, every kind');
  ok(['pace','discipline','shooting','shieldWall','mounted'].join()===t.STANCE_ORDER.filter(id=>!['brace','pavise'].includes(id)).join()&&!t.STANCE_ORDER.some(id=>['brace','pavise'].includes(id)&&t.STANCES[id].who({s:t.ST.hum_pike,type:'hum_pike'}))&&t.STANCES.shooting.ch.map(c=>c.flag).join()==='cease,skirmish,melee'&&t.STANCES.pace.flag==='walk'&&[...t.STANCE_SKILLS].join()==='dismount,mount','the stances: Pace, Discipline, Shooting (one cycle of cease, skirmish, melee), Shield wall, Mounted (Dismount and Mount, till step 2)');
  ok(['move','attack','charge','hold','withdraw'].every(k=>t.ORDERS[k])&&t.kitKey('charge')==='V'&&t.kitKey('amove')==='D'&&!t.ORDERS.advance,'the orders: Move, Attack (its attack-move, D), Charge (V), Hold, Withdraw; Advance is a Move now');
  ok(Object.keys(t.FLAG_N).filter(f=>t.GRP_FLAGS[f]!==undefined).sort().join()==='cease,firm,melee,shieldWall,skirmish,walk'&&t.FLAG_N.cease[0]==='cease fire','each flag\'s words from its stance (FLAG_N)');
  // ======== every kind's kit
  const kit=(type,rank)=>t.UnitKit.of({type,rank}),sk=K=>K.skills.map(x=>x.id+(x.rank?'@'+x.rank:'')).join();
  const want={hum_spear:'brace@2,rally@4',hum_bow:'fire@2,rapid@4',hum_xbow:'fire,rally',hum_knight:'spur',hum_mage:'rally',hum_foot:'rally',hum_hbow:'fire@2,rapid@4,scout',hum_squire:'spur,scout'};
  for(const [k,w] of Object.entries(want))if(t.ST[k])ok(sk(kit(k,5))===w,t.ST[k].n+': its skills in slot order '+sk(kit(k,5))+' (as '+w+')');
  {const S=kit('hum_spear',5),W=kit('hum_bow',5);
   ok(S.perks.map(x=>x.id+'@'+x.rank).join()==='reach@3,hedge@5'&&W.perks.map(x=>x.id+'@'+x.rank).join()==='aim@3,marks@5','the perks on their rungs: Long reach 3, Braced flanks 5; Steady aim 3, Marksmen 5');
   ok(S.traits.includes('brace')&&W.traits.some(x=>x==='longshot'||x==='elvenaim')&&S.stances.join()===['pace','discipline',...(t.shieldEligible({s:t.ST.hum_spear})?['shieldWall']:[])].join()&&W.stances.join()==='pace,discipline,shooting','their traits and stances (shooters a Shooting row)');
   const K=kit('hum_knight',3);ok(K.stances.includes('mounted')&&!K.skills.some(x=>x.id==='dismount'||x.id==='mount'),'riders: the Mounted row, never Dismount or Mount in a skill slot')}
  // ======== slots by rank, as before
  for(let r=1;r<=5;r++){const S=kit('hum_spear',r),W=kit('hum_bow',r),lk=K=>K.skills.map(x=>K.locked(x)?0:1).join('');
   ok(lk(S)===(r>=2?'1':'0')+(r>=4?'1':'0')&&lk(W)===(r>=2?'1':'0')+(r>=4?'1':'0')&&S.rungs(false).length===r&&S.rungs(true).filter(x=>x.foot).length===0,'rank '+r+': Brace flanks '+(r>=2?'open':'locked')+', Rally '+(r>=4?'open':'locked')+'; Fire arrows, Rapid shot the same; '+r+' rungs reached (none of the foot drills on a horse)')}
  // ======== worked out once, kept, made again when its rank or picks change
  {const rec={type:'hum_spear',rank:5},K=t.UnitKit.of(rec);ok(t.UnitKit.of(rec)===K,'a record\'s kit is kept (no new one each look)');
   rec.picks=['reach'];const K2=t.UnitKit.of(rec);ok(K2!==K&&Math.abs(K2.up('reach','reach',false)-t.KITS.ladders.spear[2].up.reach)<1e-9,'a pick: made again, its gain counted (Long reach +'+K2.up('reach','reach',false)+')');
   rec.picks.push('drill');ok(t.UnitKit.of(rec)!==K2&&Math.abs(t.UnitKit.of(rec).prof-t.rankProf(rec))<1e-9,'a drill: made again, its proficiency as rankProf');
   rec.rank=3;ok(t.UnitKit.of(rec).rank===3&&t.UnitKit.of(rec).rungs(false).length===3,'a new rank: made again');
   rec.learned={bow:2};ok(t.UnitKit.of(rec).rungs(false).some(x=>x.ab==='fire'),'a ladder kept through an upgrade: its rungs too')}
  // ======== in battle: each group its own slots; the keys
  t.RANKS.ai=t.RANKS.max;
  {const B=lab([Gp('hum_spear',8),Gp('hum_bow',8),Gp('hum_knight',6)]),[sp,bw,kn]=t.playerGroups().map(id=>B.groups[id]);
   ok(ids(t.groupSlots(sp))==='brace,rally'&&ids(t.groupSlots(bw))==='fire,rapid'&&ids(t.groupSlots(kn))==='spur','the skill bar in battle: spearmen Brace flanks, Rally; bowmen Fire arrows, Rapid shot; knights Spur');
   t.selectGroup('all');t.setOrderUI();press('KeyZ','z');ok(sp.abil?.brace&&bw.abil?.fire&&kn.abil?.spur,'Z: slot 1 for every selected group, each its own (Brace flanks, Fire arrows, Spur)');
   press('KeyX','x');ok(sp.abil?.rally&&bw.abil?.rapid,'X: slot 2 (Rally, Rapid shot)');
   const n0=Object.keys(sp.abil).length;press('KeyC','c');ok(Object.keys(sp.abil).length===n0,'C: slot 3, empty for them: nothing');
   B.t+=100;t.selectGroup(sp.id);press('KeyG','g');ok(sp.abil.brace.at===B.t,'G: Brace flanks still (a quiet alias of the slot that holds it)');
   t.selectGroup(bw.id);press('KeyI','i');ok(bw.abil.fire.at===B.t,'I: Fire arrows still, a quiet alias (not on the bar nor in the Help)');
   t.selectGroup(sp.id);sp.setWalk(true);press('KeyV','v');ok(!sp.walk,'V: Charge (at a run)');
   const w0=sp.walk;press('KeyQ','q');ok(sp.walk===!w0,'Q: the pace, walk or run');
   const f0=sp.firm;press('KeyF','f');ok(sp.firm===!f0,'F: hold ground (Discipline)');
   t.selectGroup(bw.id);const cyc=[];for(let i=0;i<4;i++){press('KeyM','m');cyc.push(['cease','skirmish','melee'].filter(f=>bw[f]).join()||'fire')}
   ok(cyc.join(' ')==='cease skirmish melee fire','M: the Shooting stance, one cycle: hold fire, skirmish, melee, fire at will ('+cyc.join(', ')+')');
   ok(G.mode==='battle','(in battle M is no full map)');
   t.selectGroup(kn.id);B.t+=100;press('KeyJ','j');ok(kn.units.some(u=>u.afoot||u.dismount)||kn.abil?.dismount,'J: Mounted, the knights step down');
   // ======== the order bar
   t.selectGroup(bw.id);t.setOrderUI();
   ok(qa('[data-order],[data-flag],[data-form]').map(b=>b.dataset.order||b.dataset.flag||b.dataset.form).join()==='hold,charge,advance,withdraw,firm,cease,skirmish,melee,shieldWall,loose,wedge','today\'s order, flag and formation buttons, each once, in their order');
   ok(['pace','discipline','shooting','shieldWall','mounted'].every(id=>q('#bbar .borders .srow[data-stance="'+id+'"]'))&&qa('.srow[data-stance="shooting"] [data-flag]').length===3&&q('.srow[data-stance="pace"] [data-order="charge"]')&&q('.srow[data-stance="pace"] [data-order="advance"]'),'a row for each stance: Pace (Charge, Walk), Discipline, Shooting (Hold fire, Skirmish, Melee), Shield wall, Mounted');
   const slots=qa('#bbar .borders .skills [data-slot]');ok(slots.length===3&&slots.map(b=>b.querySelector('.k').textContent).join('')==='ZXC'&&slots[0].dataset.abil==='fire'&&slots[1].dataset.abil==='rapid'&&slots[2].disabled,'the skill bar: three slots, Z X C (bowmen: Fire arrows, Rapid shot, the third empty)');
   const bar=q('#bbar .borders'),btn=[...bar.querySelectorAll('.obtn')].filter(b=>b.offsetParent),wd=q('[data-order="withdraw"]').getBoundingClientRect();
   ok(btn.length>12&&btn.every(b=>{const r=b.getBoundingClientRect();return b===q('[data-order="withdraw"]')||r.top<wd.top-2||Math.abs(r.top-wd.top)<3&&r.left<wd.left}),'Withdraw last, on the right');
   const cease=q('[data-flag="cease"]'),skirm=q('[data-flag="skirmish"]');cease.click();skirm.click();ok(bw.skirmish&&!bw.cease&&!bw.melee,'a Shooting button picks that choice alone (one cycle)');skirm.click();ok(!bw.skirmish&&!bw.cease&&!bw.melee,'pressed again: fire at will');
   t.selectGroup(kn.id);t.setOrderUI();const mb=q('#bMounted');ok(mb&&!mb.hidden&&/Mounted \(J\)/.test(mb.title),'the Mounted row shows for riders ('+(mb&&mb.title.slice(0,40))+')');
   t.selectGroup(sp.id);t.setOrderUI();ok(q('#bMounted').hidden,'and not for foot')}
  // (rank-1 spearmen: their slots locked, as before)
  {t.RANKS.ai=1;const B=lab([Gp('hum_spear',8)]),g=B.groups[t.playerGroups()[0]];t.selectGroup(g.id);t.setOrderUI();const z=q('#bbar .skills [data-slot="0"]');
   press('KeyZ','z');ok(t.battleRank(g)===1&&!g.abil&&z.dataset.abil==='brace'&&z.disabled&&/Unlocks at rank 2/.test(z.title),'rank 1: Brace flanks in slot 1, locked till rank 2 (its tooltip says so); Z does nothing')}
  // ======== Help
  {const K=t.KEYS.find(k=>k[0]==='Battle')[1],k=x=>K.find(r=>r[0]===x);
   ok(k('Z X C')&&k('R S')&&/Rally the Line/.test(k('R S')[1])&&k('Q F M B J')&&/shooting/.test(k('Q F M B J')[1])&&k('H V')&&!K.some(r=>/G I U Y O|R F Q E X|H C V/.test(r[0])),'the Help keys: Z X C the skill bar, R S the commander, Q F M B J the stances, H V the orders; the old rows gone')}
 }finally{if(L.active)L.exit();t.RANKS.ai=ai0;t.DISMOUNT.on=dm0}})
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
