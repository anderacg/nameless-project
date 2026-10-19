'use strict';
// Snapshot baseline reviewed for schema v2: persistent IDs, homogeneous formations, new deployment lanes and source-army links.
// Behavioral assertions below are retained; old category-bucket fingerprints no longer describe this architecture.
// Outcome fingerprints captured before extraction. No battle frames are simulated: each fixture supplies an explicit field result.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,G=t.G,P=t.P,W=t.W,originalRandom=Math.random;
  // (re-recorded 2026-10-19: a new skill, Woodcraft (6b911d6), in every character's skill table, which these snapshots hold; with it taken out every one matches as before: the battle's behaviour unchanged)
  const expected={"field_win":"095840fd","field_loss":"dfbba318","retreat_away":"c2c81503","retreat_caught":"9102b338","carried_retreat":"fbddc708","tournament_win":"92b90207","tournament_loss":"5ec88907","siege_win":"5496f267","siege_loss":"8677d140","lord_win":"1883f361","lord_loss":"0c5560f7","monster_win":"c95d35c7","auto_win":"ce5dbf85","auto_loss":"c67be098","auto_resolve":"e4ba3c51"};
  const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
  const hash=x=>{let h=2166136261;for(const c of JSON.stringify(stable(x)))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h.toString(16).padStart(8,'0')};
  const cases=['field_win','field_loss','retreat_away','retreat_caught','carried_retreat','tournament_win','tournament_loss','siege_win','siege_loss','lord_win','lord_loss','monster_win','auto_win','auto_loss','auto_resolve'];
  try{
    for(const [index,name] of cases.entries()){
      Math.random=t.seeded(1100+index);t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;t.BDEPLOY.on=false;t.BAUTO.on=false;
      // World generation depends on boot-time road/layout state. Supply explicit campaign inputs instead of snapshotting random bystanders.
      W.lords=[];W.sites=[];W.monsters=[];W.exiles=[];W.rel={};W.lrel={};W.treas={};t.bandits.length=0;t.TOWNS.forEach(h=>h.crime=null);Math.random=t.seeded(2100+index);
      P.troops={hum_spear:6,hum_bow:3,hum_knight:2};P.comps={};P.gold=200;P.renown=30;P.morale=60;P.hp=25;P.sp=30;P.mp=8;P.sk.med={lv:3,xp:0};
      P.prisoners={militia:2};P.captives=[{k:'chief',ld:t.newChief('bandits',2)}];P.gear.weapon=t.gearId('bow',1);t.invAdd('good','arrows',30);
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
      const chief=band.ld,stream=Math.random;let calls=0;Math.random=()=>{calls++;return stream()};let field=null;
      if(auto){if(name==='auto_resolve')t.autoResolve();else t.concludeEncounter(win,{hum_spear:2},4,true,e.list.slice(0,4))}
      else{
        if(tournament)G.town={ref:t.townBy('Ashford'),tab:'arena'};
        t.startBattle({enemies:tournament?['chief']:e.list,tournament,lv:2});field=t.B;
        field.win=win;field.over=true;field.retreat=retreat;field.caught=retreat?1:0;field.withdrawn=retreat?8:0;
        field.kills=tournament?1:4;field.slain=tournament?['chief']:e.list.slice(0,4);field.lost={hum_spear:1};field.txp={hum_bow:7};field.fired=20;field.bestCombo=4;
        field.hero.hp=name==='carried_retreat'||name.endsWith('_loss')?0:17;field.hx.sp=12;field.hx.mp=3;
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
      const fingerprint=hash(snapshot);if(expected[name])ok(fingerprint===expected[name],name+' matches independent-group outcome ('+fingerprint+')');else o.push('SNAP '+name+' '+fingerprint);
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
      if(field&&!tournament)ok(P.sp===12&&P.mp===3&&P.hp>=1,name+': hero condition carried back to campaign');
    }
  }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{Math.random=originalRandom}
  const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
