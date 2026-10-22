'use strict';
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,D=t.DevConsole,L=t.BattleLab,G=t.G,P=t.P;
 const key=(target,key,code=key)=>target.dispatchEvent(new KeyboardEvent('keydown',{key,code,bubbles:true,cancelable:true}));
 const rejects=(fn,m)=>{let failed=false;try{fn()}catch(e){failed=true}ok(failed,m)};
 try{
  window.requestAnimationFrame=()=>0;
  ok(!document.getElementById('dev-toggle')&&!!document.getElementById('dev-console'),'developer tools: no floating tab, an accessible dialog');
  {const m=G.mode;t.showTitle('settings');const b=document.querySelector('#panel [data-act="dev-open"]');ok(b&&/Developer tools/.test(document.getElementById('panel').textContent),'Settings has a Developer tools entry');if(b)b.click();ok(D.opened,'and it opens the developer tools');D.close();G.mode=m}
  const mode=G.mode;key(window,'F2');ok(D.opened&&G.mode===mode&&document.activeElement.matches('[data-dev-command]'),'F2 opens console without replacing the current game screen');
  const input=D.root.querySelector('[data-dev-command]');input.value='money 10';D.root.querySelector('[data-dev-form]').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  ok(P.gold===10&&input.value==='','console form executes an explicit command');key(input,'ArrowUp');ok(input.value==='money 10','Up arrow recalls command history');
  key(input,'Escape');ok(!D.opened&&G.mode===mode,'Escape closes console without invoking the game menu');
  t.act('begin','soldier');G.quietEvents=true;G.modal=false;t.hidePanel();G.mode='world';
  const gold=P.gold;D.execute('money 123');ok(P.gold===gold+123,'money adds to the current campaign');D.execute('money -23');ok(P.gold===gold+100,'negative money subtracts');
  rejects(()=>D.execute('money -99999999'),'gold cannot be made negative');rejects(()=>D.execute('money NaN'),'NaN money is rejected');
  D.execute('set player.attr.agi 8');ok(P.attr.agi===8&&D.execute('get player.attr.agi')===8,'get and set follow existing nested scalar paths');
  rejects(()=>D.execute('set player.attr {}'),'object replacement is rejected');rejects(()=>D.execute('set player.attr.agi "eight"'),'type-changing edits are rejected');
  rejects(()=>D.execute('set player.__proto__.polluted true'),'prototype traversal is rejected');rejects(()=>D.execute('set player.constructor.prototype.polluted true'),'constructor/prototype traversal is rejected');
  rejects(()=>D.execute('set game.mode "battle"'),'mode transitions cannot bypass the game through set');rejects(()=>D.execute('set player.gold 1e999'),'infinite values are rejected');
  rejects(()=>D.execute('set player.notAField 2'),'unknown fields cannot silently create state');rejects(()=>D.execute('javascript alert(1)'),'arbitrary code is not executed');
  const town=t.TOWNS[0];P.tx=P.x+40;G.chase={x:1};D.execute('goto '+town.name);ok(Math.hypot(P.x-town.x,P.y-town.y)<=t.TILE*8&&P.tx===null&&P.ty===null&&!G.chase&&G.encCool===3,'goto moves near a named holding and clears old travel/chase');
  const where=D.execute('where');D.execute('tp '+where.x+' '+where.y);ok(P.x===where.x&&P.y===where.y,'pixel coordinates are explicit and round-trip');
  D.execute('tp tile '+where.tileX+' '+where.tileY);ok(Math.floor(P.x/t.TILE)===where.tileX&&Math.floor(P.y/t.TILE)===where.tileY,'tile coordinates teleport to the tile centre');
  rejects(()=>D.execute('tp -1 999'),'out-of-bounds teleport is rejected');let water=null;for(let y=0;y<t.MH&&!water;y++)for(let x=0;x<t.MW;x++)if(!t.passable(t.tAt(x,y))){water=[(x+.5)*t.TILE,(y+.5)*t.TILE];break}
  rejects(()=>D.teleport(...water),'teleport cannot strand the player on blocked terrain');ok(D.execute('units bow').includes('hum_bow'),'unit discovery lists matching IDs');
  // the console's cheats (the owner, 2026-10-22): speed n and noNeeds true/false, named in help, off by default, runtime only
  {const C=t.CHEAT;try{ok(C.speed===1&&C.noNeeds===false&&/speed 3/.test(D.help)&&/noNeeds/.test(D.help),'speed and noNeeds: off by default, named in help');
   const p0=t.bandPace();D.execute('speed(3)');const p3=t.bandPace();D.execute('speed 1');ok(C.speed===1&&Math.abs(p3/p0-3)<1e-9&&t.bandPace()===p0,'speed(3) makes your band 3× as fast on the map ('+p0.toFixed(2)+' → '+p3.toFixed(2)+'), speed 1 resets it');
   rejects(()=>D.execute('speed 0'),'speed 0 is rejected');rejects(()=>D.execute('noNeeds maybe'),'noNeeds wants true or false');
   for(const k of ['water','ale','liquor'])t.goodTake(k,1e9);t.foodTake(t.foodN());P.stay=null;P.camp=null;P.bsta=80;const hp=P.hp,B0=t.BAND;B0.hungry=0;B0.dry=0;
   const sl=window.supplyLand,march=n=>{window.supplyLand=()=>({...sl(),well:false,water:false});try{for(let i=0;i<n;i++){t.WALKED.set(P,(t.WALKED.get(P)||0)+50);t.supplyHour()}}finally{window.supplyLand=sl}};// (away from water and wells)
   D.execute('noNeeds(true)');march(30);const st=t.supplyStage(),rg=t.heroRegen();
   ok(C.noNeeds&&t.BAND.hungry===0&&t.BAND.dry===0&&P.bsta>=80&&P.hp===hp&&!st.hungry&&!st.parched&&rg.hp&&rg.mp,'noNeeds(true): 30 hours marching with no food or drink, never hungry or thirsty, no stamina drain ('+P.bsta+'), your hero untouched');
   D.execute('noNeeds false');march(1);ok(!C.noNeeds&&t.BAND.hungry===1&&t.BAND.dry===1&&P.bsta<80,'noNeeds false: hunger, thirst and the drain are back (hungry '+t.BAND.hungry+', thirsty '+t.BAND.dry+', stamina '+P.bsta+')');
   D.execute('speed 2');D.execute('noNeeds on');ok(!/noNeeds|CHEAT/.test(JSON.stringify(t.worldSave())),'neither is in the save')}
  finally{C.speed=1;C.noNeeds=false}}
  D.show();const clock=G.clock;t.loop(t.last+16);ok(G.clock===clock,'main loop freezes world simulation while the console is open');D.close();
  const playerRef=P,gameRef=G,originalTroops=P.troops,originalAttr=P.attr,originalMsgs=G.msgs,playerJSON=JSON.stringify(P),gameJSON=JSON.stringify(G),worldJSON=JSON.stringify(t.W),rng=Math.random;
  const save0=localStorage.getItem(t.slotKey('quick'));L.start({left:'hum_bow',leftCount:3,right:'hum_foot',rightCount:2,ai:false,paused:true,seed:7,morale:false});
  ok(L.active&&G.mode==='battle'&&t.B.units.filter(u=>u.team===0).length===3&&t.B.units.filter(u=>u.team===1).length===2,'sandbox spawns precisely the two requested armies');
  ok(t.B.units.every(u=>!u.hero)&&t.B.hero.hp===0&&!t.B.units.includes(t.B.hero),'troop-only sandbox has no extra fighting hero');
  ok(D.execute('roster').includes('hum_bow')&&D.execute('roster').includes('side 1'),'roster exposes actual battle unit IDs and sides for inspection');
  ok(t.B.paused&&t.B.noMorale&&!t.B.auto,'paused, morale and player-AI configuration is honored');
  ok(!document.getElementById('dev-lab-bar').hidden,'active test has visible controls and isolation notice');
  const b=t.B,u=b.units[0],originalSpeed=t.ST[u.type].spd;D.execute('set unit.'+u.id+'.s.spd 90');ok(u.s.spd===90&&t.ST[u.type].spd===originalSpeed,'live stat editing does not mutate shared unit definitions');
  rejects(()=>D.execute('set unit.'+u.id+'.team 1'),'unit identity/group changes are blocked');rejects(()=>D.execute('get unit.999999.hp'),'unknown unit IDs are rejected');
  rejects(()=>D.execute('set unit.'+u.id+'.unit.k "dragon"'),'editing linked shared Unit definitions is blocked');
  const time=b.t;L.step(5);ok(b.t>time&&b.paused,'frame stepping advances the actual battle and returns to paused');
  D.show();const frozen=b.t;t.loop(t.last+16);ok(b.t===frozen,'console also freezes an active battle');D.close();
  t.saveGame(false,'quick');ok(localStorage.getItem(t.slotKey('quick'))===save0,'sandbox cannot overwrite a campaign save');t.loadGame('quick');ok(t.B===b&&L.active,'loading cannot silently discard an active sandbox');
  D.execute('money 999');b.win=true;b.over=true;b.endT=0;t.finishBattle();ok(L.session.result==='Left side wins'&&t.B===b&&b.paused,'test completion freezes the field instead of campaign settlement');
  L.restart();ok(L.active&&t.B!==b&&t.B.units.length===5&&t.B.t===0&&!L.session.result,'restart rebuilds the same matchup from a clean fixture');
  L.exit();ok(t.P===playerRef&&t.G===gameRef&&P.troops===originalTroops&&P.attr===originalAttr&&G.msgs===originalMsgs,'exit restores original campaign records and nested identities');
  ok(JSON.stringify(P)===playerJSON&&JSON.stringify(G)===gameJSON&&JSON.stringify(t.W)===worldJSON,'test stepping, cheats, finish and restart leave campaign state unchanged');ok(Math.random===rng,'sandbox restores the previous random generator');
  rejects(()=>L.start({left:'bad',right:'hum_foot'}),'unknown matchup units are rejected');rejects(()=>L.start({leftCount:101}),'excessive unit counts are rejected');rejects(()=>L.start({left:'hero',leftCount:2}),'duplicate heroes are rejected');
  ok(!L.active&&JSON.stringify(P)===playerJSON,'invalid test configuration is non-mutating');
  L.start({left:'hum_bow',right:'hum_bow',paused:true});const both=t.B.units;ok(both[0].s.hp===both[1].s.hp&&both[0].s.dmg===both[1].s.dmg&&both[0].mor0===both[1].mor0,'same-unit matchups start with equal base combat stats and morale on both sides');L.exit();
  // Exercise the actual battle form, then the persistent toolbar and normal rendering.
  D.show('battle');const f=D.root.querySelector('[data-dev-battle]');D.applyBattleConfig({leftGroups:[{type:'hero',count:1}],rightGroups:[{type:'hum_bow',count:1}],deploy:false,paused:true});
  f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));ok(L.active&&!D.opened&&t.B.units.filter(q=>q.hero).length===1,'battle selector form supports the current hero vs a chosen unit');
  t.frame();ok(true,'sandbox renders through the normal game renderer');
  const before=t.B.t;document.querySelector('[data-dev-tool=step]').click();ok(t.B.t>before&&t.B.paused,'toolbar Step uses real battle stepping');
  key(t.cv,'Escape');ok(D.opened&&G.mode==='battle'&&!G.esc,'Escape opens sandbox tools instead of campaign menus '+JSON.stringify({opened:D.opened,mode:G.mode,menu:!!G.esc}));D.close();document.querySelector('[data-dev-tool=exit]').click();ok(!L.active&&G.mode==='world'&&document.getElementById('dev-lab-bar').hidden,'toolbar Exit restores the map and hides test controls');
  L.start({left:'hum_bow',right:'hum_foot'});document.getElementById('menuBtn').click();ok(D.opened&&G.mode==='battle'&&!G.esc,'HUD Menu cannot escape sandbox isolation through campaign menus');D.close();L.exit();
  L.start({left:'hum_champ',right:'militia',distance:40,ai:true,paused:true,morale:false});for(let i=0;i<12&&!L.session.result;i++)L.step(600);
  ok(!!L.session.result&&t.B.paused&&t.B.over,'a real simulated unit-vs-unit battle completes without campaign settlement');L.exit();
  ok(JSON.stringify(P)===playerJSON&&JSON.stringify(t.W)===worldJSON,'naturally completed battle also restores campaign and world state');
  G.mode='title';G.modal=true;t.showTitle();const title=panel.innerHTML;L.start({left:'dragon',right:'hum_foot',paused:true});t.frame();L.exit();ok(G.mode==='title'&&panel.innerHTML===title&&!ov.hidden,'sandbox can also be launched from and returned to the title screen');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit();D.close()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
