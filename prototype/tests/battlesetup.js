'use strict';
window.ARENA=true;// (the battle screen's own rules, on its own field: tests/harness.js)
// Snapshot baseline reviewed for schema v2: persistent IDs, homogeneous formations, new deployment lanes and source-army links.
// Behavioral assertions below are retained; old category-bucket fingerprints no longer describe this architecture.
// Setup snapshots were captured before extraction. Geometry is fixed only for parity; real HUD measurement is checked too.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,G=t.G,P=t.P,W=t.W;
  // (chief_reuse re-recorded 2026-10-21 S4: story and content systems on named streams, seeded per world and per game (owner accepted once); the estates' sort keys drawn before sorting: begin draws the game's number and places the wild game and the beasts from
  // their own streams, so the shared Math.random this case's world runs on after it goes differently; with the streams switched back
  // to Math.random it is 2aa140f4 as before; the battle's own rules unchanged)
  // (chief_reuse re-recorded 2026-10-19: wild game placed by its woods (be9cb52, 56f7e97) and the wilds' spawns (e5bca02) draw the shared randomness differently, so the reused chief's world differs; the battle's own rules unchanged)
  // (field, reinforced, chief_reuse, siege, beasts, deployment_off, narrow and wide re-recorded 2026-10-21 for supplies (doc/SUPPLY_DESIGN.md
  // §2, world/supply.js): your hero's stamina is your band's, so this fixture's hero at 31 of her stamina is a band at 31/72, and
  // its troops and companion start the battle at that share of their stamina (battle/fatigue.js fatigueInit), not fresh. With the
  // old fatigueInit put back, every case is as recorded: was field 65c78ccc, reinforced 1137fce4, chief_reuse a69d5122, siege 5bbc07b7,
  // beasts 981e3c34, deployment_off 04e59939, narrow 09cd58d9, wide e206f675; the tournament (your hero alone) unchanged)
  // (all 9 re-recorded 2026-11-01, on purpose, at the sweep fix after the night of 2026-10-31. The baseline had stood through every
  //  move since, found commit by commit on the first-parent history (a worktree at each commit): 696de87 the owner's notes of
  //  2026-10-25, f8cfe32 battles open ready for Start Battle (8), 628b397 livelier bodies and fa23bde battles longer (all 9 at
  //  each); then the night's troop tree (data/units.js, races.js, matchups.js, world/holding.js: the kinds, their names and stats)
  //  and the AI march styles (setup.js arrangeMarch, from world/marchstyles.js). Checked: with those four files as at 803bd3a and
  //  march.js marchLayout's style null, every one is 803bd3a's again. Were field 15b927a4, reinforced 32935430, chief_reuse
  //  7ee88816, siege 2638f197, beasts a25047fc, tournament 11b1a925, deployment_off 2b8838b9, narrow 4c20d689, wide 148ae225)
  // (field, reinforced, chief_reuse, siege, beasts, deployment_off, narrow and wide re-recorded 2026-11-01, on purpose, for battle
  //  lanes (the owner: "keep battle lanes"; world/marchstyles.js lanes, march.js marchLayout): your army opens in its march's lanes
  //  (setup.js arrangeMarch, from marchRows(P)), not round the old ring, so your groups start elsewhere; the setup unchanged. Checked:
  //  with march.js and marchstyles.js as before, every one is as before; the tournament (no march) held. Were field 603b995a, reinforced 92c139da, chief_reuse a5a181b4, siege 4638df18, beasts d01f9214, deployment_off 69190168, narrow 3cbb2b2f, wide 6d5328c4)
  // (chief_reuse, deployment_off, field, narrow, siege, wide re-recorded 2026-11-01: unit kits step 2 (the owner, 2026-11-01), the part that moved them RANKS.statsOnly: a rank's stats (+3% damage, health and aim a rank, +2 morale, +2% vigor; the lab's groups rank 2, RANKS.ai) and no skill from a rank (no Brace flanks, no Fire arrows at rank 2). Checked: with RANKS.statsOnly off
  //  (and every other part of step 2 on its own), every one as before. Were field 842a2849, chief_reuse 199f9451, siege 93e5cbc1, deployment_off 1add94b7, narrow 6656bf08, wide eb236445)
  // (chief_reuse, siege, deployment_off, narrow, wide re-recorded 2026-11-05, on purpose: the hamlets (doc/WORLD_DESIGN.md §6.3): the classic world these battles are fought on (world battles, on the map where you
  // stand by Ashford) has its free hamlets, their roads and the lots' mended rules (lots.js: the centres and the ground before each gate
  // kept clear, a new world's estate tracks laid once every holding stands), so the field and the draws before the fight differ;
  // no battle rule changed (the battles of the lab, aishare's, as before). Were chief_reuse 04afd2a9, siege f1fe5f0d, deployment_off ffdac60b, narrow 01a78aa0, wide 7506e649)
  // (all 10 re-recorded 2026-11-07, on purpose, none for a battle rule but the siege's last. Found commit by commit on the first-parent
  //  history (each snapshot's JSON dumped at each commit and compared): 72b3d9a (a fort kind) and 2c86d20 (streets) change what begin draws from the shared Math.random before it draws the game's number
  //  (Rng.game: 2132428552 at 4a3a12b, 2219510241 at 72b3d9a, 2646795988 at 2c86d20), so every named stream starts elsewhere and 'army
  //  ranks' (world/armyranks.js aiRankInit) gives the foe's groups other first ranks (and with them a rank's +2 morale)
  //  (field, siege, deployment_off, narrow at 72b3d9a, and chief_reuse, wide with them at 2c86d20: the foe's mor and mor0); be3a145 (holds near a
  //  foe: more poses) puts more figures in the queue drawn ahead (warm: WARM.q.length 619 to 658, all 10); the siege again at d84458e: a
  //  holding's defenders are built as its garrison (setup.js: a GarrisonParty, the holding's realm and flag, not a BandParty), so they
  //  form up and stand otherwise (their groups' form, files and places, their men's places and morale). Checked: ccaf147 gives every
  //  recorded value and its snapshots differ from d84458e's only in those fields; d84458e^ gives the siege 07a587a3, d84458e 1119b412.
  //  Were field 585d0d85, reinforced 318dd977, chief_reuse b5fd8b39, siege b9e76df9, beasts c7105449, tournament 190c8a8a, deployment_off 6222f11f, narrow 6656bf08, wide f3c1ca9d, tournament_off 6b3997ae)
  // (re-recorded 2026-11-08, on purpose, for Proficiency (doc/PROFICIENCY_DESIGN.md): the owner's new rules change the hero and
  // companions these hold: your hero starts at level 0, a past's head start is a free proficiency (a Veteran's One-Handed 20,
  // power 2), companions start at level 0 with every proficiency 0, and the combo's third blow is a Tree node. And what the
  // records hold: proficiency levels are stored ×9.9 (Leadership 2 is 19.8, the same power), P.xp is the level's progress
  // (practice fills it) and P.burst counts repeats. Checked: with those four rules put back (no free start, level 1, companions
  // at level 1 with their old starts, the third blow at One-Handed 3) battlesetup and aishare are as before, and every other case
  // differs only in those three record fields (a dump of guard, companion_down and lord_losses against f357e21's). f357e21 gives
  // every old value. Were field 7163cefe, reinforced dfcb3006, chief_reuse 5f9f1e72, siege 1119b412, beasts 1f2c3863, tournament
  // 3820a60c, deployment_off c47643c5, narrow 0433a349, wide ad3ea833, tournament_off 99350490.
  // (8 re-recorded 2026-11-08, on purpose (the owner, 2026-11-08: "make each skill tree separated by proficiency", and a level's choice of health, stamina or mana instead of a tree point: your record's tp gone, lvUp and lvPick in its place (these snapshots hold P whole); a companion's, a lord's or a chieftain's trees opened by its proficiencies now, not bought with points (their health, damage and mana by them); a level's health, stamina and mana by your choices; its log line. Checked: with the others choosing no node (and the old Crossroads giving nothing), the old tp, its level's numbers and its line, every one is as before (the old code, the same way, gives the same). Were field 455a202e, reinforced 7120c610, chief_reuse 7c1837f0, siege 7abe9124, beasts 6f847ea1, deployment_off 810c9717, narrow 4ff37a71, wide 1ac8be95)
  // (10 re-recorded 2026-11-08, on purpose (the owner, 2026-11-08: Skyrim's loop, doc/PROFICIENCY_DESIGN.md §11: your level from experience, a skill point a level spent on any tree, no milestone; a node's strength by its proficiency's level; proficiencies' power smaller (profPow) and no top; attributes gone into their bonuses (HERO_BASE your hero's start); pasts at 15 at most; lords and chieftains a point a level): these hash every unit and P whole (its attr, lvUp and lvPick gone), the heroes', companions', lords' and chieftains' numbers and trees; no battle rule changed. No one switch puts the old rules back. Were field 5d9481e9, reinforced 1b5a766c, chief_reuse 5909b490, siege 844a09cf, beasts 84b515d0, tournament e50af6c8, deployment_off 5e4c5d94, narrow 893866e4, wide 494ac770, tournament_off db35d8ec)
  // (8 re-recorded 2026-11-08, on purpose (the owner: "one big circle node tree spans across each proficiency", the round tree, doc/PROFICIENCY_DESIGN.md §11: a bonus node between each two tiers, a node opened by one linked to it learned; lords and chieftains walk the paths to their class's nodes, an active skill first): these hash every unit and P whole, the lords', chieftains' and companions' trees and numbers; no battle rule changed. Were field e109309e, reinforced 0d1dcc0f, chief_reuse 14814963, siege 75dffb38, beasts 0b86da79, deployment_off 9b504b47, narrow 685dfbb7, wide 8a427229)
  // (8 re-recorded 2026-11-09, on purpose (the owner: "add more attribute nodes to each proficiency": two bonus nodes between each two tiers and two past the last, doc/PROFICIENCY_DESIGN.md §11; riders aim at Blade Dash first): the lords' and chieftains' trees and numbers move; no battle rule changed. Were field 036a5f84, reinforced 52b5d69e, chief_reuse ee32e08e, siege 83f8098a, beasts ac6e2f23, deployment_off cbce68f1, narrow d4c606a1, wide d00529eb)
  // (narrow and wide re-recorded 2026-11-13, on purpose, for no battle rule: the owner, "make the area bigger" (a pasture's): the pens
  //  4, 6, 8 tiles a level, grown after the tracks (world/lots.js pensGrow), so more of each herd grazes by Ashford before the fight and
  //  the foe's groups draw other first ranks (world/armyranks.js aiRankInit): the snapshots differ only in four groups' mor and mor0, by
  //  a rank's 2. Checked: with PLOTS_GROW.pasture 4 and PLOTS_AT.pasture lv+1 they are 16b2340a and 8aec0d70 again; the field, the
  //  ground and every other snapshot as before. Were narrow 16b2340a, wide 8aec0d70)
  // (10 re-recorded 2026-11-13, on purpose: the owner, "starting hero power seems too strong", "reduce stats or attributes bonus", "make skill harder to unlock": your hero's numbers lower (data/progression.js HERO_BASE, LEVEL.dmg, a past's bonus), the pasts' origins halved (data/tree.js ORIGINS), a node 60% at its proficiency's 100 (TREE_SCALE.most), and nodes cost by kind and open at a proficiency's level (TREE_COST, TREE_GATE), so the lords' and chieftains' own picks move too. Checked: with those numbers put back (the new tiers and icons kept) every one is as recorded. Was field d648fd7d, reinforced 8d3f7dab, chief_reuse 98eb8343, siege 2590c417, beasts 40504cc8, tournament ed2fa6a3, deployment_off b57f3bb8, narrow 1179a68a, wide 64a89ea0, tournament_off 3c427351)
  // (field, deployment_off, narrow, wide re-recorded 2026-11-14, on purpose, none for a battle rule: the camps where people live (doc/ENCAMPMENTS_DESIGN.md, world/encampments.js) are placed kind by kind from the world's start stream (core/session.js startDraws: Rng 'start'), each its people and its kind's days, so the draws after them (the other sites, the herds, the bands and the beasts) start elsewhere and the world round these fights differs. Checked: with the old travellers' placement put back over everything else of this change (their class, DENSITY's 21 by the road, SITE_GAP 30) every one gives its old value, and W6-W8 and B2 too. Were field ecedd367, deployment_off 85cac74c, narrow 84889402, wide 0152ce04)
  const expected={field:'8e111d03',reinforced:'462a895a'/* (re-recorded 2026-11-01, on purpose: the women lords' titles (data/factions.js LORD_RETITLE: the owner, "change whatever you see fits for now"), your ally's name in the snapshot. Checked: LORD_RETITLE {} gives c403a05b again; the step-2 switches move nothing here. Was c403a05b) */,chief_reuse:'ebc09fbd'/* (re-recorded 2026-11-08, on purpose: the owner, "player can freely spend based on their preferences": a chieftain spends his trees' points as he likes (world/characters.js autoTree, 32412aa), so the reused chief's tree and numbers differ. Proof: with autoTree off, abaceed and today both give f5524bb4. Was f5524bb4) */,siege:'b8b757d7',beasts:'47f98170'/* (re-recorded: spider stats changed in the balance pass) */,tournament:'c37fa4ec'/* (re-recorded 2026-11-01, on purpose: every bout in the lists is fought in the arena (gfx/tourney.js TourneyArena; the owner: "can you have some small arena battle screen instead of open green field?"), so its field is FIELD_SIZES.tourney (448x256, not today's 960x600), its rows the ring's (92-216, not the measured 40-560), its two fighters 140 px apart in the middle of the ring, the camera closer and B.arena the arena. Proof: tournament_off below (TOURNEY_ARENA.on false, the same seeds) gives 6b3997ae again. Was 6b3997ae) */,tournament_off:'fca613b8',deployment_off:'0c9a8b4c',narrow:'a4d7cf8e',wide:'34a99264'};
  const original={random:Math.random,measure:t.measureField,width:t.BVW,height:t.BVH,deploy:t.BDEPLOY.on,auto:t.BAUTO.on,speed:t.BSPEED.v,guide:t.GUIDE.on,arena:t.TOURNEY_ARENA.on};
  const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
  const fingerprint=x=>{let h=2166136261;for(const c of JSON.stringify(stable(x)))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h.toString(16).padStart(8,'0')};
  const snapshot=(B,calls,next)=>({width:t.BW,env:B.env,top:B.ftop,bot:B.fbot,obs:B.obs,
    // Legacy setup parity omits the new facing-state field (covered by formationfacing) and group morale (covered by groupmorale).
    groups:Object.fromEntries(Object.entries(B.groups).map(([id,g])=>{const {currentFacing,targetGroupId,targetUnitId,resolve,...prior}=g;return[id,prior]})),
    units:B.units.map(u=>({id:u.id,v:u.v,type:u.type,team:u.team,x:u.x,y:u.y,hp:u.hp,max:u.max,cd:u.cd,hero:u.hero,comp:!!u.comp,face:u.face,grp:u.grp,sx:u.sx,sy:u.sy,s:u.s,
      mor:u.mor,mor0:u.mor0,sta:u.sta,vig:u.vig,role:u.unit.role||'troop',key:u.unit.key,lord:u.lord&&u.lord.id,leader:u.leader&&{type:u.leader.type,team:u.leader.team,name:u.leader.name}})),
    hero:B.hero.id,opts:B.opts,deploy:B.deploy,auto:B.auto,speed:B.speed,paused:B.paused,noMorale:!!B.noMorale,exit:B.exit,cam:B.cam,hx:B.hx,warm:t.WARM.q.length,
    fresh:[B.rings,B.arrows,B.parts,B.floats,B.slashes,B.corpses,B.lost],clock:B.t,kills:B.kills,slain:B.slain,sel:B.sel,mode:G.mode,calls,next});
  try{
    window.__setupMeasure=original.measure;(0,eval)('measureField=()=>({top:40,bot:560})');
    // (tournament_off: the tournament with the arena off, on the tournament's own seeds: today's open field, as recorded before it)
    const cases=['field','reinforced','chief_reuse','siege','beasts','tournament','deployment_off','narrow','wide','tournament_off'];
    for(const [at,name] of cases.entries()){const index=name==='tournament_off'?cases.indexOf('tournament'):at;t.TOURNEY_ARENA.on=name!=='tournament_off';
      Math.random=t.seeded(100+index);t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;
      // (the snapshots hold your army's point on the map and the ground under it, fixed here: where a new game left you on the old hand-made map,
      // on the ground there, the road by Ashford's gate)
      P.x=584;P.y=680;t.WM.battleSite=()=>t.battleSiteOf({tx:36,ty:42,t:t.T_ROAD,c:'grass',name:'Road',kinds:[4,4,4,0,4,4,0,0,4],road:{ns:true}});
      P.troops={hum_spear:3,hum_bow:2,hum_mage:1,hum_knight:1};P.comps={brann:{ap:5,role:''},elske:{ap:0,role:''},tavi:{ap:0,role:''}};
      t.compInit('brann').lv=3;t.compInit('elske').hurt=G.day+2;t.compInit('tavi').party=t.asParty({cid:'tavi',troops:['hum_bow'],x:P.x+200,y:P.y,order:'stay'});
      P.hp=23;P.sp=31;P.mp=7;P.morale=64;t.BDEPLOY.on=true;t.BAUTO.on=false;t.BSPEED.v=2;
      (0,eval)('BVW='+ (name==='narrow'?500:name==='wide'?1700:1000)+';BVH=BH');
      let enemies=['militia','militia','archer','orc_shaman','horse'],opts={enemies,tournament:false,deploy:true};
      G.enc={kind:'party',ref:{x:P.x,y:P.y,cool:0},list:enemies,allies:[],foes:[]};
      if(name==='reinforced'){
        const ally=W.lords.find(l=>l.fac==='vale'),enemy=W.lords.find(l=>l.fac==='karn'),helper=W.lords.find(l=>l.fac==='sylvan');
        for(const l of [ally,enemy,helper]){l.inside=null;l.dead=false;l.lv=3;l.xp=0;l.renown=24;l.sk=Object.fromEntries(t.LORD_SK.map(k=>[k,{lv:1,xp:0}]))}
        ally.troops=['hum_spear','hum_bow'];enemy.troops=['dw_clan','dw_xbow'];helper.troops=['elf_glade'];
        enemies=enemy.troops.slice();opts={enemies,tournament:false,lv:2,deploy:true};G.enc={kind:'lord',ref:enemy,list:enemies,allies:[ally],foes:[helper]};
      }else if(name==='chief_reuse'){
        enemies=['militia','chief','archer'];opts={enemies,tournament:false,lv:2};// (his name the one he drew on the old hand-made map, kept so the snapshot holds)
        G.enc={kind:'camp',ref:{ld:{...t.newChief('bandits',4),name:'Rook One-Eye'}},list:enemies,allies:[],foes:[]};
      }else if(name==='siege'){
        const town=t.TOWNS.find(h=>h.owner==='karn'&&h.kind==='town');town.wall=3;enemies=t.garList(town);opts={enemies,tournament:false,lv:4,deploy:true};G.enc={kind:'siege',ref:town,list:enemies,allies:[],foes:[]};
      }else if(name==='beasts'){
        enemies=['troll','dragon','wolf','spider'];opts={enemies,tournament:false,lv:3};G.enc={kind:'monster',ref:{id:'dragon'},list:enemies,allies:[],foes:[]};
      }else if(name.startsWith('tournament')){
        enemies=['chief'];opts={enemies,tournament:true,deploy:true};t.BAUTO.on=true;
      }else if(name==='deployment_off'){t.BDEPLOY.on=false;t.BAUTO.on=true}
      let calls=0;const random=t.seeded(900+index);Math.random=()=>{calls++;return random()};const returned=t.startBattle(opts),B=t.B,used=calls,next=[Math.random(),Math.random(),Math.random()];
      const hash=fingerprint(snapshot(B,used,next));if(expected[name])ok(hash===expected[name],name+' matches independent-group setup snapshot ('+hash+')');else o.push('SNAP '+name+' '+hash);
      ok(returned===undefined&&B.opts===opts&&B.hero===B.units[0]&&B.hero.hp===23*t.FIELD_HP,name+': entry point, options identity and hero health are preserved (at the field\'s scale, FIELD_HP)');
      ok(new Set(B.units.map(u=>u.id)).size===B.units.length&&B.units.every((u,i)=>u.id===i),name+': unit IDs are consecutive and restart per battle');
      ok(B.units.every(u=>u.unit instanceof t.Unit&&u.unit.key===u.type)&&Object.values(B.groups).every(g=>g instanceof t.BattleControl),name+': units and group controls keep their existing models');
      ok(B.units.every(u=>u.y>=B.ftop&&u.y<=B.fbot)&&B.rings.length===0&&B.arrows.length===0&&B.t===0&&!B.over,name+': units start in bounds with fresh transient state');
      if(name.startsWith('tournament'))ok(B.units.length===2&&B.noMorale&&!B.deploy&&!B.auto&&!B.obs.length,'tournaments still exclude the warband, reinforcements, deployment and obstacles');
      else ok(B.units.filter(u=>u.comp).length===1&&B.units.some(u=>u.type==='brann')&&!B.units.some(u=>u.type==='elske'||u.type==='tavi'),name+': only healthy companions in the band spawn');
      if(name==='reinforced')ok(B.units.filter(u=>u.leader).length===3&&B.units.some(u=>u.grp&&B.groups[u.grp].ally),'reinforcements retain their leaders, source links and allied groups');
      if(name==='chief_reuse')ok(B.units.filter(u=>u.type==='chief').length===1&&B.units.find(u=>u.type==='chief').leader,'the camp chief already in the ranks becomes its leader, not a duplicate');
      if(name==='siege')ok(!B.units.find(u=>u.type==='hum_knight').s.charge&&B.units.find(u=>u.team===1).s.hp>t.ST[B.units.find(u=>u.team===1).type].hp,'sieges retain cavalry penalties and enemy-level scaling');
      if(name==='beasts')ok(B.units.filter(u=>u.team===1).every(u=>u.grp&&B.groups[u.grp]),'beasts have homogeneous command groups too');
      if(name==='deployment_off')ok(!B.deploy&&B.auto,'deployment-off and auto-command settings are honored');
      if(name==='narrow'||name==='wide')ok(t.BW===(name==='narrow'?t.FIELD_W.min:t.FIELD_W.max),'field width still clamps at the '+name+' limit');
    }
    (0,eval)('measureField=window.__setupMeasure;BVW='+original.width+';BVH='+original.height);delete window.__setupMeasure;
    G.mode='world';G.modal=false;G.enc={kind:'party',ref:{cool:0},allies:[],foes:[],list:['militia']};t.startBattle({enemies:['militia'],tournament:false});
    ok(t.fieldTop()>=t.FIELD_EDGE.top&&t.fieldBot()<=t.BH-t.FIELD_EDGE.bot&&t.fieldBot()>t.fieldTop(),'real HUD measurement still leaves a valid fighting area');
  }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{delete t.WM.battleSite;
    Math.random=original.random;if(window.__setupMeasure){(0,eval)('measureField=window.__setupMeasure');delete window.__setupMeasure}
    (0,eval)('BVW='+original.width+';BVH='+original.height);t.BDEPLOY.on=original.deploy;t.BAUTO.on=original.auto;t.BSPEED.v=original.speed;t.GUIDE.on=original.guide;t.TOURNEY_ARENA.on=original.arena;
  }
  const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
