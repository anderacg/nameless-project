'use strict';
// Snapshot baseline reviewed for schema v2: persistent IDs, homogeneous formations, new deployment lanes and source-army links.
// Behavioral assertions below are retained; old category-bucket fingerprints no longer describe this architecture.
// Outcome fingerprints captured before extraction. No battle frames are simulated: each fixture supplies an explicit field result.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,G=t.G,P=t.P,W=t.W,originalRandom=Math.random;
  // (monster_win re-recorded 2026-10-21 S4: story and content systems on named streams, seeded per world and per game (owner accepted once); the estates' sort keys drawn before sorting: a beast's loot is rolled on the 'monsters' stream (world/monsters.js
  // monsterLoot), not Math.random; with the streams switched back to Math.random it is c95d35c7 as before, and every other case is
  // unchanged)
  // (re-recorded 2026-10-19: a new skill, Woodcraft (6b911d6), in every character's skill table, which these snapshots hold; with it taken out every one matches as before: the battle's behaviour unchanged)
  // (the ten field cases re-recorded 2026-10-21 for supplies (doc/SUPPLY_DESIGN.md §2, world/supply.js): your hero's stamina is your
  // band's (P.sp, which the snapshot holds), so this fixture's hero at 30 of hers is a band at 30/72: its troops start the battle at
  // that share (battle/fatigue.js fatigueInit), and after it the band's stamina is the average its side still standing ended with
  // (fieldStaminaBack), not your hero's 12. With those two put back as they were, every case is as recorded: was field_win 095840fd, field_loss
  // dfbba318, retreat_away c2c81503, retreat_caught 9102b338, carried_retreat fbddc708, siege_win 5496f267, siege_loss 8677d140,
  // lord_win 1883f361, lord_loss 0c5560f7, monster_win 1744f530; the tournaments and the auto-resolved fights unchanged)
  // (the four defeat cases re-recorded 2026-10-22, on purpose: beaten, you wake at the nearest friendly holding's gate spot (world.js gateSpot:
  // never water or a lot) instead of 24 px below its point. With that line put back they are as before: was field_loss f3feadff, siege_loss a05dc589, lord_loss e8d3f300, auto_loss c67be098.
  // On the generated world (REC) every case re-recorded the same day: a new game starts at the gate spot too (the play-test's
  // spawn fix), so every world battle here begins from another point; was field_win 71fef104, field_loss 33c63e52, retreat_away 249b5402, retreat_caught 2ccb4f6b, carried_retreat 1843af89, tournament_win 7d9254c0, tournament_loss 008c9530, siege_win 2ecb0423, siege_loss 35e26cb8, lord_win fdd09868, lord_loss b686fa28, monster_win f103fcac, auto_win 32ebc6c8, auto_loss 15c791d8, auto_resolve 6ca68a22.)
  // (re-recorded 2026-10-22, on purpose, for item categories (doc/ITEMS_DESIGN.md): every snapshot holds P whole (as your army's source),
  // and your gear now has its quiver slot (P.gear.quiver: data/monsters.js EQUIP); the fixtures' 30 arrows are a hunter's quiver now (30
  // shots); the loot window by category (its heads, the bag's used / size, a good's line its category); a beaten lord's and chieftain's
  // purse of valuables (world/captives.js spoilsWon). Checked: with the quiver slot left out of EQUIP, arrows and bolts items again, the
  // hero's ammunition as before (combat.js ammoOf, haveAmmo, the arrows taken from the bag, gathered after a win; no quiver's shots in the
  // stats) and the starting arrows put back, the loot window and the goods' loot line as before and no valuables, every case is as it was,
  // the generated world's too (REC: was field_win f2cfb06a, field_loss 0a370c86, retreat_away 7db51a1b, retreat_caught 3fc9c439,
  // carried_retreat ec2e41fc, tournament_win 3e71de67, tournament_loss b33918e3, siege_win e1464782, siege_loss 56b03238, lord_win
  // 5b5044be, lord_loss 477adf53, monster_win 29a47cc3, auto_win 181f4419, auto_loss 743570d1, auto_resolve 07999931). Was field_win
  // 523fac16, field_loss e4336b5e, retreat_away a840d970, retreat_caught 09ec5ce9, carried_retreat 08e292c1, tournament_win 92b90207,
  // tournament_loss 5ec88907, siege_win 80306dc2, siege_loss f4d44ad0, lord_win 17a8e3f0, lord_loss dac2841d, monster_win 45e897e7,
  // auto_win ce5dbf85, auto_loss 7cb76bed, auto_resolve e4ba3c51)
  // (the outcomes hold the world round you: the holdings near you, the way a retreat or a defeat takes you. The generated classic
  // world's own, recorded with G1-G8 (doc/WORLD_DESIGN.md §15.2: wave 3's last merge, 2026-10-22), now W1-W8; the old hand-made
  // map's own set went with the map, D49)
  // (REC re-recorded 2026-10-22: each case's battle is fought where the test's band stands on the generated world, and the
  //  ground there moved with K's roads and lots (1f40a5a: the first to fail; cbc36ad and 82a3aa7 pass), M's crossings and O's
  //  climates; the old map's set held through all of them, so the battle code is unchanged)
  // (REC's field_win, lord_win, auto_win and auto_resolve re-recorded 2026-10-22 (agent U): the generated classic seed now
  //  starts with its land's bands and beasts (data/world.js DENSITY.grow), so begin draws more before these battles; with it held
  //  at today's counts all four are as before; the old map's set held. Were field_win 0fefb0ff, lord_win 2e03cb6d, auto_win
  //  24e7d393, auto_resolve 95b686b5)
  // (field_win, lord_win, monster_win, auto_win and auto_resolve re-recorded 2026-10-22: agent S's clearings, estate tracks and
  //  farther estates move the generated world round the test's band (worldprint's G1-G8); with those rules off all fifteen as
  //  before, and the old map's set held. Were field_win 0fefb0ff, lord_win 2e03cb6d, monster_win 9d5eedba, auto_win 24e7d393,
  //  auto_resolve 95b686b5)
  // (field_win, lord_win, auto_win and auto_resolve re-recorded 2026-10-22, the owner's fifth play-test (agent R: the desert's
  //  water, springs, ponds and oases, worldgen.js): the generated world moves, and with it begin's draws and the ground of those
  //  battles; with those rules off all four as before (were 0fefb0ff, 2e03cb6d, 24e7d393, 95b686b5); the old map's set held)
  // (REC measured together 2026-10-22 at the merge of agents S and R (each proved its own rules off above): field_win,
  //  lord_win, monster_win and auto_resolve moved; the old map's set held)
  // (field_win, lord_win, auto_resolve measured together 2026-10-22 at the merge of agents R (the generator's water: no desert rain, terminal lakes, springs, ponds and oases), S (estate tracks, forest clearings, estates farther out, oases drawing holdings, stage 7 regrown, roads round ponds) and U (the camps grown with the land, port piers preferring the sea) on main 880b6e7; each agent proved its own rules off give the values before)
  const REC={field_win:'cc925db3',field_loss:'56b1108c',retreat_away:'f8f6004f',retreat_caught:'630f1c46',carried_retreat:'accd790c',tournament_win:'8932be2e',tournament_loss:'cde78eef',siege_win:'edd807d9',siege_loss:'36304164',lord_win:'4e076fb6',lord_loss:'58646d0e',monster_win:'9d5eedba',auto_win:'c7c4f547',auto_loss:'b0ae7cc2',auto_resolve:'3c3fb1e1'};
  const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
  const hash=x=>{let h=2166136261;for(const c of JSON.stringify(stable(x)))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h.toString(16).padStart(8,'0')};
  const cases=['field_win','field_loss','retreat_away','retreat_caught','carried_retreat','tournament_win','tournament_loss','siege_win','siege_loss','lord_win','lord_loss','monster_win','auto_win','auto_loss','auto_resolve'];
  try{
    for(const [index,name] of cases.entries()){
      Math.random=t.seeded(1100+index);t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;t.BDEPLOY.on=false;t.BAUTO.on=false;
      // World generation depends on boot-time road/layout state. Supply explicit campaign inputs instead of snapshotting random bystanders.
      W.lords=[];W.sites=[];W.monsters=[];W.exiles=[];W.rel={};W.lrel={};W.treas={};t.bandits.length=0;t.TOWNS.forEach(h=>h.crime=null);Math.random=t.seeded(2100+index);
      P.troops={hum_spear:6,hum_bow:3,hum_knight:2};P.comps={};P.gold=200;P.renown=30;P.morale=60;P.hp=25;P.sp=30;P.mp=8;P.sk.med={lv:3,xp:0};
      P.prisoners={militia:2};P.captives=[{k:'chief',ld:t.newChief('bandits',2)}];P.gear.weapon=t.gearId('bow',1);P.gear.quiver='q_hunter';
      const band=t.asParty({kind:'bandits',troops:Array(name==='retreat_caught'?40:4).fill('militia'),x:P.x+8,y:P.y,cool:0,ld:t.newChief('bandits',2)});t.bandits.push(band);
      let e={kind:'party',ref:band,list:band.troops.slice(),allies:[],foes:[],mine:false},town=null,lord=null;
      const tournament=name.startsWith('tournament'),auto=name.startsWith('auto'),retreat=name.includes('retreat'),win=name.endsWith('_win')||name==='auto_resolve';
      if(name.startsWith('siege')){
        town=t.TOWNS.find(h=>h.owner==='karn'&&h.kind==='town');town.gar=8;P.siege={town:town.name,t:1};G.capWith='vale';e={kind:'siege',ref:town,list:t.garList(town),allies:[],foes:[],lords:[],mine:true};
      }else if(name.startsWith('lord')){
        lord=t.asParty({id:'karn0',name:t.FACS.karn.lords[0],fac:'karn',x:P.x+8,y:P.y,inside:null,dead:false,troops:Array(4).fill('dw_clan'),cool:0,state:'march',lv:3,xp:0,renown:24,sk:Object.fromEntries(t.LORD_SK.map(k=>[k,{lv:1,xp:0}]))});W.lords.push(lord);
        e={kind:'lord',ref:lord,list:lord.troops.slice(),allies:[],foes:[],mine:false};
      }else if(name==='monster_win'){
        const m={id:'wolf',x:P.x+8,y:P.y,n:4,lv:1,cool:0};W.monsters.push(m);e={kind:'monster',ref:m,list:Array(4).fill('wolf'),allies:[],foes:[],mine:false};
      }
      if(name==='retreat_away'||name==='carried_retreat')e.mine=true;
      if(name==='retreat_caught')e.noFlee=true;// enough surviving foes that they do not simply let you leave
      G.enc=e;G.loot=null;G.encAgain=null;G.msgs=[];
      const chief=band.ld,stream=Math.random;let calls=0;Math.random=()=>{calls++;return stream()};let field=null,spMax=0;
      if(auto){if(name==='auto_resolve')t.autoResolve();else t.concludeEncounter(win,{hum_spear:2},4,true,e.list.slice(0,4))}
      else{
        if(tournament)G.town={ref:t.townBy('Ashford'),tab:'arena'};
        t.startBattle({enemies:tournament?['chief']:e.list,tournament,lv:2});field=t.B;
        field.win=win;field.over=true;field.retreat=retreat;field.caught=retreat?1:0;field.withdrawn=retreat?8:0;
        field.kills=tournament?1:4;field.slain=tournament?['chief']:e.list.slice(0,4);field.lost={hum_spear:1};field.txp={hum_bow:7};field.fired=20;field.bestCombo=4;
        field.hero.hp=name==='carried_retreat'||name.endsWith('_loss')?0:17;field.hx.sp=12;field.hx.mp=3;spMax=t.maxSP();
        const own=field.units.filter(u=>u.team===0&&!u.hero&&!u.comp);
        if(own.length){own[0].hp=0;own[1].hp=0;own[1].left=true;own[1].xp=9;own.slice(2).forEach(u=>{u.mor=u.mor0*.6;u.xp=2})}
        field.units.filter(u=>u.team===1).forEach((u,i)=>{if(win||i<2)u.hp=0});if(win)field.routed=1;
        t.finishBattle();
      }
      // Keep the existing settlement/random-stream baseline independent of the new presentation-only report.
      // tests/battlereport.js verifies report ownership, outcomes, persistence and rendering separately.
      const callsBefore=G.msgs.length,reportHtml=document.querySelector('.battle-report')?.outerHTML,
        html=document.getElementById('panel').innerHTML.replace(reportHtml||'<!-- no group report -->',''),view={...G.lootView};delete view.report;
      const snapshot={P,mode:G.mode,enc:G.enc,again:G.encAgain,encCool:G.encCool,lastTown:G.lastTown&&G.lastTown.name,capture:G.capture&&G.capture.name,capWith:G.capWith,
        loot:G.loot,view,messages:G.msgs,html,B:t.B,mood:t.BATTLE_MOOD,
        towns:t.TOWNS.map(h=>({name:h.name,owner:h.owner,gar:h.gar,rep:P.rep[h.name],crime:h.crime})),
        world:{lords:W.lords,exiles:W.exiles,monsters:W.monsters,treas:W.treas,rel:W.rel,lrel:W.lrel},bands:t.bandits,
        randomCalls:calls,random:[Math.random(),Math.random(),Math.random()]};
      const fingerprint=hash(snapshot);if(REC[name])ok(fingerprint===REC[name],name+' matches independent-group outcome ('+fingerprint+')');else o.push('SNAP '+name+' '+fingerprint);
      ok(!t.B&&G.mode==='dialog'&&G.loot&&G.loot.capture===false,name+': field released and loot summary ready');
      ok(t.BATTLE_MOOD===null&&G.msgs.length===callsBefore,name+': morale carry-over consumed without snapshot side effects');
      if(tournament)ok(P.gold===(win?245:200)&&P.renown===(win?36:30)&&G.lootView.next==='back-town'&&P.troops.hum_spear===6,name+': tournament rewards and roster isolation preserved');
      else ok(G.enc===null&&G.encCool===(retreat?4:3)&&G.lootView.next==='cont',name+': encounter cleanup and continuation preserved');
      if(name==='field_win')ok(chief&&band.ld===null&&P.captives.some(c=>c.k==='chief'&&c.ld===chief),'victory captures the same band chief');
      if(!tournament&&name.endsWith('_loss'))ok(!P.captives.length&&!Object.keys(P.prisoners).length&&P.gold===150,'defeat loses a quarter of gold and releases captives/prisoners');
      if(name==='retreat_caught')ok(G.encAgain===e&&e.noFlee&&P.renown===28&&G.lootView.head.includes('Run down'),'caught retreat keeps the same encounter for another fight');
      if(name==='carried_retreat')ok(P.hp>=1&&G.lootView.head.includes('carry you'),'fallen hero survives a carried retreat');
      if(name==='siege_win')ok(G.capture===town&&town.gar===0,'siege victory opens the holding for a capture decision');
      if(name==='siege_loss')ok(P.siege===null&&G.capWith===null&&town.gar===6,'siege defeat clears the siege and reduces the garrison');
      if(name==='lord_win')ok(lord.held&&lord.dead&&P.captives.some(c=>c.id===lord.id),'victory over a lord records his capture');
      // (your hero's stamina is the band's: after a field battle the average its side still standing ended with, your hero's 12 of her
      // stamina among them, on her scale as it was in the battle (a win may raise her a level after it); world/supply.js, battle/fatigue.js
      // fieldStaminaBack)
      if(field&&!tournament){const side=field.units.filter(u=>u.team===0&&!u.lord&&!u.leader&&(u.hp>0||u.left)),sta=u=>u.hero?12/spMax*100:u.sta,want=side.reduce((a,u)=>a+sta(u),0)/side.length;
        ok(Math.abs(P.sp-want*spMax/100)<1e-9&&P.mp===3&&P.hp>=1,name+': hero condition carried back to campaign, the band’s stamina its side’s ('+(P.sp/spMax*100).toFixed(2)+' of '+side.length+' standing)')}
      if(tournament)ok(P.sp===12&&P.mp===3,name+': your hero comes out of the lists as she fought them');
    }
  }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{Math.random=originalRandom}
  const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
