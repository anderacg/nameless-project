'use strict';
window.ARENA=true;// (the battle screen's own rules, on its own field: tests/harness.js; missed at f8c7c00, so a world battle's muster)
// Groups handed to the AI one by one (deploy.js aiHas, setGroupsAuto, autoKey): the captain orders only the groups it has, your
// others keep your orders; an order of yours takes a group back; A with nothing selected, the whole army as ever (and the whole
// army flagged group by group plays exactly as the whole-army AI, whose fingerprint is the one recorded before the change); the
// AI badge on the card, the icon and the AI button. Allies in green (battle.js SIDE): their soldiers' cloth, health bars and
// minimap dots by pixels, yours blue, theirs red.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,G=t.G,P=t.P,W=t.W,cmd0=t.command,hp0=t.HPBARS.on;
 const hash=x=>{let h=2166136261;for(const c of JSON.stringify(x))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h.toString(16).padStart(8,'0')};
 // (a fixed battle: your spearmen, archers, knights and hero; an allied lord's spearmen and archers; the enemy's militia, archers, riders)
 const battle=seed=>{Math.random=t.seeded(seed);t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;t.BDEPLOY.on=false;t.BAUTO.on=false;
  P.troops={hum_spear:8,hum_bow:6,hum_knight:4};P.comps={};const ally=W.lords.find(l=>l.fac==='vale');
  ally.inside=null;ally.dead=false;ally.lv=3;ally.xp=0;ally.renown=24;ally.sk=Object.fromEntries(t.LORD_SK.map(k=>[k,{lv:1,xp:0}]));ally.troops=['hum_spear','hum_spear','hum_bow','hum_bow'];
  const enemies=['militia','militia','militia','militia','militia','militia','archer','archer','archer','archer','horse','horse'];G.mode='world';G.modal=false;t.hidePanel();
  G.enc={kind:'party',ref:{x:P.x,y:P.y,cool:0},list:enemies,allies:[ally],foes:[]};t.startBattle({enemies,tournament:false});t.beginFight();return t.B};// (Start Battle: a battle opens ready since f8cfe32)
 const run=(B,s)=>{while(B.t<s&&!B.over)t.updateBattle(1/30)};
 const print=B=>hash({u:B.units.map(u=>[u.id,u.x,u.y,u.hp,!!u.rout,u.tgt&&u.tgt.id]),g:Object.entries(B.groups).map(([id,g])=>[id,g.order,g.ax,g.ay,g.form,g.run,g.targetGroupId]),c:Object.entries(B.captains||{}).map(([k,c])=>[k,c.post,c.commit])});
 const key=k=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code:'Key'+k.toUpperCase(),bubbles:true}));
 const role=(B,r)=>t.playerGroups().find(id=>B.groups[id].role===r);
 try{
  // (all three re-recorded 2026-11-01, on purpose, at the sweep fix after the night of 2026-10-31; this suite now on the battle
  // screen (ARENA, missed at f8c7c00) and its battle started (Start Battle, f8cfe32): since 696de87 opened every battle paused it hung
  // to the runner's timeout. Found commit by commit on the first-parent history (a worktree at each commit, this suite as now):
  // the whole army's f8ef51d3 held till 9405d0a; from 696de87 to 177605b the battle never started (no value); f8cfe32 (battles open
  // ready, formed up) 802ca814, f78dd88 (battle start centred) 4b4be247, 322d202 (a codex merge) 71bc6583, 8a9eab7 (armour has a
  // value) c443cd3a, 9167b37 (blocks, parries, dodges) 488d5375, 7abcc4c (the glades) 6d88429b, 8ba1919 (the Spear and Bow
  // ladders) 58857a97, bbefddd (proficiency) 407533f6, 72cbebc (AI armies rank) 87ad5f30, fa23bde (battles longer) 5c1677ce;
  // the lab's, morale off 596d6d9c and on 17c1387b, held till 8a9eab7 (5e2548f3, 66510895), then 761b3ec (Skip to the end) off
  // d53ced7f, 58ed321 (no stuck armies) on 81f763e1, 8ba1919 on 74613a99, bbefddd off 39a09206 and on 756da8bc, fa23bde off
  // d3bf0fc7 and on bca3376e (803bd3a's). Then the night's troop tree and AI march styles: whole 8038c047, lab off 35c3a4b8,
  // on 8d8f4210; checked: with data/units.js, races.js, matchups.js and world/holding.js as at 803bd3a and march.js marchLayout's
  // style null, all three are 803bd3a's again. Were f8ef51d3, 596d6d9c and 17c1387b. The lab with morale off: every group flagged
  // one by one no longer plays the very battle the whole army does (9e6168ac against 35c3a4b8; at 803bd3a too): to look into)
  // ======== the whole army: the A key with nothing selected (its old path) against every group flagged one by one. Fingerprints
  // recorded on the code before groups could be handed over (commit 13af1f5). A battle's start leans on what earlier battles left
  // in the page (its caches): the world battle is this page's first, as it was recorded; the lab's are compared after one to warm up
  // (re-recorded 2026-10-21, 8146f06e to 29dca01d: the wild game placed by its woods (a1c79a2..56f7e97) draws the shared
  // randomness differently before the battle; missed then, as the five battle fingerprint suites were re-recorded in 4d8ca8c)
  // (re-recorded 2026-10-21 S4: story and content systems on named streams, seeded per world and per game (owner accepted once); the estates' sort keys drawn before sorting, 29dca01d to b739f365: begin draws the game's number and places the wild game and the
  // beasts from their own streams, so the shared Math.random the battle starts from is elsewhere; with the streams switched back to
  // Math.random it is 29dca01d as before; the AI's play unchanged)
  // (its start reads the world and begin's draws: on the generated classic world its own fingerprint, recorded with G1-G8
  // (doc/WORLD_DESIGN.md §15.2, wave 3's last merge, 2026-10-22); the old hand-made map's b739f365 went with the map, D49)
  // (the generated world's e07350a9 re-recorded 2026-10-22, was d43b9569: agent S's clearings, estate tracks and farther estates
  //  moved the ground round the test's band; with those rules off d43b9569 again, the old map's b739f365 held)
  // (the generated world's d43b9569 re-recorded 2026-10-22, was a9b664e0: the battle's ground is where the test's band stands on the
  //  generated world, which K's roads and lots (1f40a5a), M's crossings and O's climates moved; the old map's b739f365 held)
  // (and 1bda01e3 re-recorded 2026-10-22 (agent U), was d43b9569: the generated classic seed starts with its land's bands and beasts
  //  (data/world.js DENSITY.grow), more draws before the battle; with it at today's counts d43b9569 holds; the old map's held)
  // (the generated world's 71be41f4 re-recorded 2026-10-22, was d43b9569: the owner's fifth play-test (agent R: the desert's
  //  water, springs, ponds and oases, worldgen.js) moves the generated world, and with it begin's draws and the battle's ground;
  //  with those rules off d43b9569 as before; the old map's b739f365 held)
  // (the generated world's 1f049224 measured together 2026-10-22 at the merge of agents S and R (each proved its own rules off
  //  above); the old map's b739f365 held)
  // (the generated world's 05ee3f4a measured together 2026-10-22 at the merge of agents R (the generator's water: no desert rain, terminal lakes, springs, ponds and oases), S (estate tracks, forest clearings, estates farther out, oases drawing holdings, stage 7 regrown, roads round ponds) and U (the camps grown with the land, port piers preferring the sea) on main 880b6e7; each agent proved its own rules off give the values before)
  // (the generated world's 18d74563 re-recorded 2026-10-23, on purpose, the owner's play-test of 2026-10-22 (agent GP: tests/
  //  worldprint.js W1-W8): the ground of the battle moves with the world; with those rules off 05ee3f4a as before)
  // (the generated world's 1e654a07 re-recorded 2026-10-23, on purpose, the building redesign's stage 3 (agent S3: tests/
  //  worldprint.js W1-W8): the towns laid out again with the models, the sites round them, so begin's draws and the battle's
  //  ground move; was 18d74563)
  // (the generated world's 28831f27 re-recorded 2026-10-23, on purpose, the owner's hideouts deep in the wilds (agent HO: tests/
  //  worldprint.js W6-W8, B2): 30 hideouts on the wild land (was 61), so begin's draws move; with every hideout rule off, and with
  //  only their placement and count off, 1e654a07 as before)
  // (the generated world's f8ef51d3 re-recorded 2026-10-23, on purpose, workplaces where they make sense (agent EW: tests/
  //  worldprint.js W1, W3-W8, B2): estates where their land suits them, so begin's draws and the battle's ground move; with the new
  //  rules off 28831f27 as before)
  // (the whole army's re-recorded 2026-11-01, on purpose, for battle lanes (the owner: "keep battle lanes"; world/marchstyles.js
  //  lanes): your army opens in its march's lanes (setup.js arrangeMarch), not round the old ring; with march.js and marchstyles.js as
  //  before, 8038c047 again. The lab's (no march) held. Was 8038c047)
  // (the lab's re-recorded 2026-11-01, on purpose, on top of the battle lanes: an AI group's stand that ends its charge is a move, its
  //  men breaking off to go (the owner's cavalry fix, battlecontrol.js standAt): off 1511059e, on d96fe005; with that one rule off,
  //  35c3a4b8 and 8d8f4210 again (the Footman's morale 45 and riders' rides ended with no foe in sight move neither). The whole
  //  army's a1fc7122 held. Were 35c3a4b8 and 8d8f4210. With morale off the lab still differs group by group (44d81b58), as before)
  // (all three re-recorded 2026-11-01, on purpose: men fill the nearest free place (the owner, 2026-11-01); core/assign.js SLOTFILL): a group's slots go to its men by the
  //  least walking in all (formations.js layForm), its formation laid again for those left as a man falls and its free men trading
  //  places every second (battlecontrol.js refill), so the battles move: the whole army 3fed1564, the lab off 4ff105ae, on e060c954
  //  (on: every group flagged one by one plays the very same battle; off still differs group by group, e8999927, as before). With
  //  SLOTFILL.on false all three are a1fc7122, 1511059e and d96fe005 again. Were a1fc7122, 1511059e and d96fe005)
  // (all three re-recorded 2026-11-01: unit kits step 2 (the owner, 2026-11-01). The whole army moved by RANKS.statsOnly alone (a rank's
  //  stats, no skill from a rank); the lab's two by RANKS.statsOnly, KITS.brace (Brace a stance, the AI bracing it; the spears' front
  //  no longer braced always) and KITS.cap (no Fire arrows for a lab's archers: no lord), each on its own. Checked: every part of
  //  step 2 off, all three as before (the lab off still differs group by group, e8999927, as at base; now 9097d2ed). Were 3fed1564, 4ff105ae, e060c954)
  // (all three re-recorded 2026-11-07, on purpose: their battles' field pinned (measureField 40..560, BVW 1000, as battlesetup's), here
  //  for these three only. Unpinned, the field was laid out from the runner's window and its HUD: at 4c3601d, where they were
  //  recorded, this runner gives 8a61f3fc, 7c7e4f6a, 2de2307c in a 1280 x 720 window and fd58d6a7, 7291f478, 8d1d5199 in an 800 x 600
  //  one, never 8b85de03, 26a692d4, 7a5669e3. Pinned, 800 x 600, 1024 x 768 and 1280 x 720 give the same. Found commit by commit,
  //  pinned: the lab's two (834fb179, 3dd396f0) the same from 4c3601d to d84458e, the battle's rules unchanged; the whole army's,
  //  fought on the world by your start, moved only by the world's ground and begin's draws: 4c3601d e8493d7e, 58e6c1a (hamlets)
  //  74c0e623, 141476c 81a35d0e, 54c76b5 c8508662, d81af0c baab014f, 41a155d d13244d9, 79eb05b 9444f8ef, dfe8caa f1c3a98d,
  //  72b3d9a (a fort kind) 64dbd481, 2c86d20 (streets) 87cb1481. Were 8b85de03, 26a692d4 (off), 7a5669e3 (on))
  window.__aiMeasure=t.measureField;window.__aiView=[t.BVW,t.BVH];(0,eval)('measureField=()=>({top:40,bot:560});BVW=1000;BVH=BH');
  {const B=battle(4242);B.noMorale=true;B.sel=null;key('a');const a=B.auto&&t.aiAll();run(B,60);const fp=print(B),REC='34089c10';/* (re-recorded 2026-11-10, on purpose: standards phase 3 (doc/STANDARDS_DESIGN.md): no band is raised within STANDARD.safe tiles of a held standard (world.js spawnBandit), so the first bands stand elsewhere and the world this battle is drawn from moves. Proof: STANDARD.safe 0 gives 801f2ddc. Was 801f2ddc) /* (re-recorded 2026-11-09, on purpose: more bonus nodes on each path (the owner, "add more attribute nodes to each proficiency"): the ally lord's tree and numbers move; the AI's rules unchanged. Was 1b2c54c4) *//* (re-recorded 2026-11-08, on purpose: the round tree (bonus nodes on the paths; lords walk them to their class's nodes, an active skill first): the ally lord's tree and numbers move; the AI's rules unchanged. Was 748a4ea3) *//* (re-recorded 2026-11-08, on purpose: the owner, Skyrim's loop (doc/PROFICIENCY_DESIGN.md §11): your level and points, the nodes' strength by proficiency, proficiencies' power smaller, attributes gone into bonuses, lords' trees a point a level; the ally lord's numbers and yours move, the AI's rules unchanged. Was 02f8ccde) *//* (re-recorded 2026-11-08, on purpose: the trees by proficiency and the level's choice (your record's fields, your ally's lord's trees); checked as the battle suites were: with the others choosing no node and the old tp and level numbers, as before. Was fffe2908) *//* (re-recorded 2026-11-08, on purpose, for Proficiency: your hero starts at level 0 with the past's free One-Handed 20 (power 2), so he hits harder and the battle runs another way; with the new rules put back (no free start, level 1, companions as before, the third blow at One-Handed 3) it is 87cb1481 as before) *//* (re-recorded 2026-11-02, on purpose: a man who cannot reach his slot gives it up after MARCH_MOVE.formTry s and stands, in his group (actors.js slotGiveUp; the owner: "the unit can try to get into a formation but after 5 secs or xxx cooldown timer then it just stop trying and stand there", "this will apply to all formations in marching or in battle"). Proof: MARCH_MOVE.formGiveUp false gives 9831ec17 again. Was 9831ec17) *//* (re-recorded 2026-11-01, on purpose: the melee hold (actors.js MELEE_HOLD: a man-sized fighter at his foe holds till the foe is 1 px past his reach (no further than he strikes), as a shooter keeps his range; a big beast wades on; the owner, 2026-11-01: "the fighter that I fight in battle map seems to move weird, jiggering left right"). Proof: MELEE_HOLD.on false gives e11df4f3 again. Was e11df4f3) */
   ok(a&&fp===REC,'A with nothing selected, your army and an ally’s against the enemy (seed 4242, no morale): the whole-army AI plays the very battle it did before ('+fp+', recorded '+REC+', '+B.t.toFixed(1)+' s)')}
  {const L=t.BattleLab,Gp=(type,count)=>({type,count}),lab=mor=>{if(L.active)L.exit();G.mode='world';G.modal=false;L.start({leftGroups:[Gp('hum_spear',16),Gp('hum_bow',12),Gp('hum_knight',6)],rightGroups:[Gp('hum_levy',20),Gp('hum_bow',12),Gp('hum_spear',10)],deploy:false,ai:false,paused:false,morale:mor,seed:42});return t.B};
   Math.random=t.seeded(1);t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;const REC={false:'834fb179',true:'3dd396f0'};/* (re-recorded 2026-11-02, on purpose: a man who cannot reach his slot gives it up after MARCH_MOVE.formTry s and stands (actors.js slotGiveUp; the owner: "this will apply to all formations in marching or in battle"): morale on moves. Proof: MARCH_MOVE.formGiveUp false gives 78b049cc again; morale off held (26a692d4), its group-by-group run still the old b74a2857. Was 78b049cc) *//* (re-recorded 2026-11-01, on purpose: the melee hold (actors.js MELEE_HOLD: a man-sized fighter at his foe holds till the foe is 1 px past his reach (no further than he strikes), as a shooter keeps his range; a big beast wades on; the owner, 2026-11-01: "the fighter that I fight in battle map seems to move weird, jiggering left right"). Proof: MELEE_HOLD.on false gives dcc12042 and 72de7bc6 again; off still differs group by group (b74a2857), as before. Were dcc12042, 72de7bc6) *//* (re-recorded 2026-11-01: the AI's brace timing, commander.js chargeIn, moves both; labs start with the rank's morale, lab.js, moves morale on with it. Proof by reverting one at a time: base fc11fd1a/a6411007, the lab fix alone the same, the brace alone dcc12042/6013d269. Were fc11fd1a, a6411007) */run(lab(false),60);// (to warm up)
   for(const mor of [false,true]){let B=lab(mor);B.sel=null;key('a');const a=B.auto;run(B,60);const whole=print(B);
    B=lab(mor);t.setGroupsAuto(t.playerGroups(),true,true);const b=!B.auto&&t.aiAll();run(B,60);const each=print(B);
    ok(a&&b&&whole===REC[mor]&&each===whole,'lab, morale '+(mor?'on':'off')+': the whole-army AI as recorded before ('+whole+', recorded '+REC[mor]+'), and every group flagged one by one plays the very same battle ('+each+')')}
   if(L.active)L.exit()}
  if(window.__aiMeasure){(0,eval)('measureField=window.__aiMeasure;BVW=window.__aiView[0];BVH=window.__aiView[1]');delete window.__aiMeasure;delete window.__aiView}
  // ======== two groups to the AI, the rest yours
  {const B=battle(4242);B.noMorale=true;B.units.forEach(u=>{u.hp=u.max=u.max*5});// (a foe tough enough to last the minute, and your
   // army too, so a group is still there for the orders after it: on the generated world your archers fell within it)
   const inf=role(B,'inf'),arc=role(B,'arc'),cav=role(B,'cav'),hand=t.playerGroups().filter(g=>g!==inf&&g!==arc);
   // (your knights sent back to a corner and holding there; your hero holding)
   B.groups[cav].moveTo(60,t.fieldTop()+30);B.sel=[inf,arc];key('a');
   ok(t.aiHas(B.groups[inf])&&t.aiHas(B.groups[arc])&&hand.every(g=>!t.aiHas(B.groups[g]))&&!B.auto&&t.aiAny()&&!t.aiAll(),'A with two groups selected: only those two are the AI’s ('+[inf,arc].join(', ')+'), the rest yours ('+hand.join(', ')+')');
   const bt=document.getElementById('bAuto');ok(bt.getAttribute('aria-pressed')==='mixed'&&bt.classList.contains('some'),'the AI button shows some of your army the AI’s');
   t.setOrderUI();const card=g=>document.querySelector('.ucard[data-grp="'+g+'"]');
   ok(card(inf).querySelector('[data-st="ai"]')&&card(arc).querySelector('[data-st="ai"]')&&!card(cav).querySelector('[data-st="ai"]')&&/the AI in command/.test(card(inf).title),'their unit cards carry the AI badge, yours none'+' ('+[inf,arc,cav].map(g=>g+': '+(card(g)?card(g).title:'no card')).join(' | ')+')');
   // (the field icon: the badge first beside it, its violet rim drawn)
   t.frame();const it=t.iconLayout(0).find(x=>x.g===inf);t.frame();const ic=B.icons.find(r=>r.g===inf),cx=document.querySelector('canvas').getContext('2d', { willReadFrequently: true });
   let violet=0;if(ic){const K=t.unitIconScale(),S=t.UICON.s,d=cx.getImageData(ic.x+(S+2)*K,ic.y,9*K,9*K).data;for(let i=0;i<d.length;i+=4)if(d[i]===0xb4&&d[i+1]===0x8c&&d[i+2]===0xf0)violet++}
   ok(it&&it.st[0]==='ai'&&violet>=10,'and their icons on the field: the AI badge beside it ('+violet+' violet rim pixels)');
   // (who gives the AI's orders to whom: every order to a group of yours while the captains think, command())
   const M=['hold','moveTo','toHold','queueTo','placeAt','standAt','attack','charge','advance','withdraw','setWalk','setRun','setFlag','setForm','useAbility','faceTo'],P0={},got={};let inCmd=false;
   for(const m of M){P0[m]=t.BattleControl.prototype[m];t.BattleControl.prototype[m]=function(...a){if(inCmd&&this.team===0&&this.player)(got[this.id]=got[this.id]||new Set()).add(m);return P0[m].apply(this,a)}}
   window.__cmd0=cmd0;window.__inCmd=v=>{inCmd=v};(0,eval)('command=function(dt){window.__inCmd(true);try{return __cmd0(dt)}finally{window.__inCmd(false)}}');
   const keep=g=>{const q=B.groups[g];return JSON.stringify([q.order,q.ax,q.ay,q.form,q.files,q.run,q.walk,q.firm,q.cease,q.skirmish,q.melee,q.shieldWall,q.targetGroupId,q.targetUnitId,q.queue])};
   run(B,4);const before=Object.fromEntries(hand.map(g=>[g,keep(g)])),t0=B.t;
   try{run(B,64)}finally{for(const m of M)t.BattleControl.prototype[m]=P0[m];(0,eval)('command=__cmd0')}
   const ordered=Object.keys(got);
   ok(ordered.includes(inf)&&ordered.includes(arc)&&ordered.every(g=>g===inf||g===arc),'over '+Math.round(B.t-t0)+' s the AI ordered only the groups it has ('+ordered.map(g=>g+': '+[...got[g]].join('/')).join('; ')+')');
   ok(hand.every(g=>keep(g)===before[g])&&(B.t-t0>=59||B.over),'your other groups keep your orders untouched all the while, 60 s or the battle’s end ('+hand.join(', ')+'; '+(B.t-t0).toFixed(1)+' s'+(B.over?', won':'')+')'+hand.filter(g=>keep(g)!==before[g]).map(g=>' '+g+': '+before[g]+' → '+keep(g)).join(''));
   ok(Object.values(B.groups).some(g=>g.ally)&&B.captains&&B.captains.ally&&B.captains[0],'your allies keep their own captain beside yours');
   // ======== an order of yours takes that group back, the other stays the AI's
   B.sel=arc;t.rtsOrder(200,300);ok(!t.aiHas(B.groups[arc])&&t.aiHas(B.groups[inf])&&t.aiAny(),'a move to an AI group of yours takes that group back, the other stays the AI’s');
   B.sel=inf;t.setOrder('hold');ok(!t.aiAny()&&!B.auto&&!t.BAUTO.on,'Hold to the other: nobody left the AI’s, the whole-army choice off');
   B.sel=[inf,arc];key('a');B.sel=inf;t.setForm('loose');ok(!t.aiHas(B.groups[inf])&&t.aiHas(B.groups[arc]),'a formation button takes its group back too');
   B.sel=arc;key('a');ok(!t.aiAny(),'A again on a group the AI has: back to you')}
  // ======== A with nothing selected: the whole army, on and off (as ever); with some of it the AI's, All hands it all
  {const B=battle(77);B.sel=null;key('a');ok(B.auto&&t.aiAll()&&t.BAUTO.on&&document.getElementById('bAuto').getAttribute('aria-pressed')==='true','A with nothing selected: the AI has your whole army (remembered: BAUTO)');
   key('a');ok(!B.auto&&!t.aiAny()&&!t.BAUTO.on,'A again: all yours');
   const inf=role(B,'inf');B.sel=inf;key('a');B.sel='all';key('a');ok(B.auto&&t.aiAll(),'some of it the AI’s, A with All selected hands it the whole army');
   B.sel=inf;t.rtsOrder(300,300);ok(!B.auto&&!t.aiHas(B.groups[inf])&&t.playerGroups().filter(g=>g!==inf).every(g=>t.aiHas(B.groups[g]))&&!t.BAUTO.on,'then an order to one group takes back that group alone');
   t.setAuto(false,true)}
  // ======== allies in green: their soldiers' cloth, health bars and minimap dots (yours blue, theirs red)
  {const B=battle(4242);t.HPBARS.on=true;const cx=document.querySelector('canvas').getContext('2d', { willReadFrequently: true });
   const pick=s=>B.units.find(u=>u.hp>0&&!u.hero&&!u.leader&&!u.s.big&&t.sideKey(u)===s),U={own:pick('own'),ally:pick('ally'),foe:pick('foe')};
   const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),PP=t.PPAL,cloth={own:PP.blue,ally:PP.forest,foe:PP.red};
   const count=(d,cols,tol=0)=>{let n=0;for(let i=0;i<d.length;i+=4)if(cols.some(c=>Math.abs(d[i]-c[0])<=tol&&Math.abs(d[i+1]-c[1])<=tol&&Math.abs(d[i+2]-c[2])<=tol))n++;return n};
   const res={};
   const all0=B.units;for(const s of ['own','ally','foe']){const u=U[s];B.cam.z=3;B.cam.fit=false;t.camCentre(u.x,u.y-8);B.units=[u];try{t.frame()}finally{B.units=all0}const p=t.fromField({x:u.x,y:u.y}),z=B.cam.z,h=t.unitSprite(u.type,t.spriteTeam(u),false,u.v).ch;
    const body=cx.getImageData(Math.round(p.x-6*z),Math.round(p.y-(h-2)*z),12*z,(h-2)*z).data,bar=cx.getImageData(Math.round(p.x-7*z),Math.round(p.y-(h+3)*z),14*z,3*z).data;
    res[s]={cloth:Object.fromEntries(['own','ally','foe'].map(k=>[k,count(body,cloth[k].map(hex))])),bar:Object.fromEntries(['own','ally','foe'].map(k=>[k,count(bar,[hex(t.SIDE[k].ui)])]))}}
   info('pixels by side (cloth: each side palette\'s pixels on the soldier; bar: each side colour in his health bar): '+JSON.stringify(res));
   ok(res.ally.cloth.ally>=6&&res.ally.cloth.own===0&&res.own.cloth.own>=6&&res.own.cloth.ally===0&&res.foe.cloth.foe>=6,'an allied soldier wears green, yours blue, theirs red (his sprite’s pixels)');
   ok(res.ally.bar.ally>=6&&res.ally.bar.own===0&&res.own.bar.own>=6&&res.own.bar.ally===0&&res.foe.bar.foe>=6,'his health bar green, yours blue, theirs red');
   // (the small map: those three alone on it, each dot its side's colour; one of them running, the paler shade)
   const all=B.units,r=t.miniRect(),sx=t.BVW/t.VW,sy=t.BVH/t.VH,kx=r.w/t.BW,ky=r.h/t.BH;
   const dot=(u,k)=>{const X=(r.x+u.x*kx+.5)*sx,Y=(r.y+u.y*ky+.5)*sy,d=cx.getImageData(Math.round(X-2),Math.round(Y-2),5,5).data;return Object.fromEntries(['own','ally','foe'].map(s=>[s,count(d,[hex(t.SIDE[s][k])],24)]))};
   t.camReset();B.units=[U.own,U.ally,U.foe];try{t.frame()}finally{B.units=all}
   const D={own:dot(U.own,'ui'),ally:dot(U.ally,'ui'),foe:dot(U.foe,'ui')};info('minimap dots: '+JSON.stringify(D));
   ok(D.ally.ally>0&&D.ally.own===0&&D.own.own>0&&D.own.ally===0&&D.foe.foe>0,'on the small map an allied soldier is a green dot, yours blue, theirs red');
   U.ally.rout=true;B.units=[U.ally];try{t.frame()}finally{B.units=all;U.ally.rout=false}
   const R=dot(U.ally,'rout');ok(R.ally>0,'one of them running: the paler green ('+JSON.stringify(R)+')');
   const ag=Object.values(B.groups).find(g=>g.ally);ok(t.sideKey(ag)==='ally'&&t.OPATH.ally.move===t.SIDE.ally.rgb&&t.SIDE.ally.plate.every(c=>!t.SIDE.own.plate.includes(c)),'their icons and order paths take the same green (one table: battle.js SIDE)');
   B.over=true;B.endT=0}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 finally{if(window.__aiMeasure){(0,eval)('measureField=window.__aiMeasure;BVW=window.__aiView[0];BVH=window.__aiView[1]');delete window.__aiMeasure;delete window.__aiView}if(window.__cmd0)(0,eval)('command=__cmd0');t.HPBARS.on=hp0;t.BAUTO.on=false;if(t.B){t.B.over=true;t.B.endT=0}}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
