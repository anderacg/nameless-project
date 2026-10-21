'use strict';
// Structure: the rules that keep the code organized. No two scripts declare the same top-level name (a second `function`
// would silently replace the first); the wiki loads the game's scripts in the game's order; the world's systems run their day
// and frame in their order, and the world part of a save keeps its keys in theirs (core/systems.js, core/saves.js); the world generator draws no
// Math.random and calls nothing that differs between browsers; every dialog's actions are owned
// by exactly one system; every kind of encounter knows what winning it means; monsters are data (the dragon is one); and the
// fief stores' "Take" no longer calls up a garrison soldier.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 const get=u=>{const x=new XMLHttpRequest();x.open('GET',u,false);x.send();return x.responseText};
 // ---- one name, one place
 const srcs=[...document.querySelectorAll('script[src^="js/"]')].map(s=>s.getAttribute('src'));
 const seen={},dups=[];
 for(const f of srcs){const txt=get(f);for(const m of txt.matchAll(/^(?:function\s+([\w$]+)\s*\(|(?:const|let)\s+([\w$]+)\s*=)/gm)){const n=m[1]||m[2];if(seen[n]&&seen[n]!==f)dups.push(n+' ('+seen[n]+', '+f+')');else seen[n]=f}}
 ok(srcs.length>=40&&!dups.length,Object.keys(seen).length+' top-level names in '+srcs.length+' scripts, none declared twice'+(dups.length?': '+dups.join('; '):''));
 ok(srcs.every(s=>/^js\/(core|data|story|world|battle|scene|gfx|ui)\/[\w]+\.js$|^js\/main\.js$/.test(s)),'every script lives in its folder: core, data, story, world, battle, scene, gfx or ui');
 const order=srcs.map(s=>s.replace(/^js\//,'')),dataFirst=order.findIndex(s=>!s.startsWith('core/core')&&!s.startsWith('data/'));
 ok(order[0]==='core/core.js'&&order.slice(1,dataFirst).every(s=>s.startsWith('data/'))&&order.slice(dataFirst).every(s=>!s.startsWith('data/')),'core loads first, then all the data, then the systems');
 // ---- the systems and save registries (core/systems.js, core/saves.js; doc/CORE_DESIGN.md K1): loaded before any system that
 // registers in them, and the world's day and frame run in the order the loop called them by hand (the shared Math.random: the
 // world fingerprints, tests/worldprint.js, hold it)
 {const w0=order.findIndex(s=>s.startsWith('world/')),day='estate guards,band,realms,patrols,relations,monsters,sites,herds,sieges,lands,economy,estates,caravans,ships,companions,wounded,chieftains,refugees,caravan upkeep,fiefs,quests,autosave,road events,gatherings',
   frame='stay,capture,raids,lands,march,sites,road,fights,ships,parties,patrols,land defence,patrol moves,monsters,herds,refugees,folk,arrival';
  ok(order.indexOf('core/systems.js')>=dataFirst&&order.indexOf('core/saves.js')>=dataFirst&&order.indexOf('core/systems.js')<w0&&order.indexOf('core/saves.js')<order.indexOf('core/save.js'),'the registries load after the data, before the systems');
  ok(t.Systems.names('day').join()===day,'the day, in its order: '+t.Systems.names('day').join(', '));
  ok(t.Systems.names('frame').join()===frame,'the frame, in its order: '+t.Systems.names('frame').join(', '))}
 const wiki=[...get('wiki.html').matchAll(/<script src="(js\/[^"]+)"/g)].map(m=>m[1]);
 ok(wiki.join()===srcs.filter(s=>!/ui\/input\.js|main\.js/.test(s)).join(),'the wiki loads the same scripts in the same order (all but input and main)');
 // ---- the generator (doc/WORLD_DESIGN.md §8.1, §15.2): its scripts in Phase 2's load order (worldmap.js last, its load line
 // makes the world), and its files seeded and the same in every browser: no Math.random (nor rnd, rint or pick, which draw it),
 // no Math.hypot, sin, cos, exp, pow, log or atan2 (their text read, comments aside)
 {const want=['world/map.js','world/router.js','world/fog.js','world/resources.js','world/worldsettings.js','world/worldgen.js','world/worldplace.js','world/worldmap.js'],at=want.map(f=>order.indexOf(f));
  ok(at.every((v,i)=>v>=0&&(!i||v===at[i-1]+1))&&order.indexOf('ui/map.js')===order.indexOf('ui/ui.js')+1,'the world scripts load in Phase 2\'s order ('+want.map(f=>f.split('/')[1]).join(', ')+'), the full map (ui/map.js) right after ui.js');
  const gen=['js/world/worldsettings.js','js/world/worldgen.js','js/world/worldplace.js'],bad=[];
  for(const f of gen){const s=get(f).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm,'');if(!s.trim())bad.push(f+' is empty');
   for(const m of s.matchAll(/Math\.(?:random|hypot|sin|cos|exp|pow|log\w*|atan2)\b|(?<![\w$.])(?:rnd|rint|pick)\s*\(/g))bad.push(f.split('/').pop()+': '+m[0])}
  ok(!bad.length,'the generator ('+gen.map(f=>f.split('/').pop()).join(', ')+') never calls Math.random, rnd, rint or pick, nor Math.hypot, sin, cos, exp, pow, log or atan2'+(bad.length?': '+bad.join('; '):''))}
 // the engine (engine/README.md "Loading"): the same scripts in the same order in both, its kit before the buildings, the models last
 {const eng=[...document.querySelectorAll('script[src^="../engine/"]')].map(s=>s.getAttribute('src').replace('../engine/','')),ew=[...get('wiki.html').matchAll(/<script src="\.\.\/engine\/([^"]+)"/g)].map(m=>m[1]);
  ok(eng.join()===ew.join()&&eng.indexOf('pixel.js')===0&&eng.indexOf('buildkit.js')===1&&eng.indexOf('buildings.js')===2&&eng[eng.length-1]==='model.js','the engine loads in its order, the same in the wiki: '+eng.join(', '))}
 // ---- extracted battle responsibilities keep a single owner; these are plain scripts, not isolated modules
 const battleOwners={
  'battle':['updateBattle'],
  'battlecontrol':['moveOrder'],
  'commands':['rtsOrder','setOrder'],
  'setup':['startBattle'],
  'resolution':['finishBattle','concludeEncounter'],
  'actors':['aiUnit','shotStep','relocating','updateNonHeroActors'],
  'attacks':['applyDmg','attack','bladeBlow'],
  'projectiles':['fireBolt','arcStep','updateProjectiles'],
  'terrain':['buildTerrain','groundMul','terrainStep','terrainBlocksView']
 };
 for(const [file,names] of Object.entries(battleOwners))ok(names.every(n=>seen[n]==='js/battle/'+file+'.js'),'battle ownership: '+names.join(', ')+' belong to '+file+'.js');
 const battleOrder=['battle','battlecontrol','commands','setup','resolution','attacks','projectiles','actors','combat','commander','abilities','formations','morale','fatigue','physics','camera','deploy'].map(n=>'battle/'+n+'.js');
 ok(battleOrder.every((f,i)=>order.includes(f)&&(!i||order.indexOf(battleOrder[i-1])<order.indexOf(f))),'battle scripts retain the supported loading order in both entry points');
 ok(order.indexOf('battle/terrain.js')===order.indexOf('battle/spatial.js')+1&&order.indexOf('battle/terrain.js')<order.indexOf('battle/battle.js'),'terrain.js loads right after spatial.js, before battle.js (the wiki too: its order is checked above)');
 // ---- every note an AI keeps on a group is in AI_NOTES (battlecontrol.js aiReset clears them when Auto hands a group over), or
 // is the group's own field (its constructor's) or phase/t: each `<v>.<name>=` (also +=, ++…) in the captains (commander.js) and
 // the character mind (charmind.js, once it has its own file) on a group variable (g, q, or a name bound to B.groups[…]) is read
 {const files=['js/battle/commander.js','js/battle/charmind.js','js/battle/beastmind.js'].map(f=>{let s='';try{s=get(f)}catch(e){}return [f,s]}).filter(([f,s])=>s||srcs.includes(f));
  const own=new Set([...Object.getOwnPropertyNames(new t.BattleControl('structure_probe',0)),...t.AI_NOTES,'phase','t']),bad=[],wrote=new Set(),W1=/\s*(?:=(?![=>])|[-+*\/%|&]=|\+\+|--)/.source;
  for(const [f,s] of files){const vars=new Set(['g','q',...[...s.matchAll(/(?<![\w$.])([\w$]+)\s*=\s*(?:[\w$.]+&&)?B\.groups\[/g)].map(m=>m[1])]),hit=(v,k)=>{wrote.add(k);if(!own.has(k))bad.push(f.split('/').pop()+': '+v+'.'+k)};
   for(const m of s.matchAll(new RegExp('(?<![\\w$.])([\\w$]+)\\.([\\w$]+)'+W1,'g')))if(vars.has(m[1]))hit(m[1],m[2]);
   for(const m of s.matchAll(new RegExp('B\\.groups\\[[^\\]]+\\]\\.([\\w$]+)'+W1,'g')))hit('B.groups[…]',m[1])}
  ok(files.length>0&&files.every(([f,s])=>s)&&wrote.size>=5&&!bad.length,'the AI’s notes on a group are all in AI_NOTES ('+[...wrote].sort().join(' ')+' in '+files.map(([f])=>f.split('/').pop()).join(', ')+')'+(bad.length?': not in it: '+bad.join('; '):''))}
 // ---- the fight never calls the HUD or the lab: it tells them (battle.js battleEvent; battlehud.js, lab.js and the commander
 // bar listen). No callout*, bhud* or BattleLab.event call in js/battle/* (lab.js is the lab's own; ALLOW: HUD code kept beside
 // its system: the commander bar, which your press of a power refreshes), and the HUD reads no B.fallBack (it hears it)
 {const ALLOW={'commandpowers.js':['bhudPowers']},bad=[],files=srcs.filter(f=>/^js\/battle\/\w+\.js$/.test(f)&&f!=='js/battle/lab.js');
  for(const f of files){const s=get(f),n=f.split('/').pop(),ok2=ALLOW[n]||[];
   for(const m of s.matchAll(/(?<![\w$.])(callout\w*|bhud\w*)\s*\(|BattleLab\.event\s*\(/g)){const name=m[1]||'BattleLab.event',before=s.slice(Math.max(0,m.index-9),m.index);
    if(/function\s$/.test(before)||ok2.includes(name))continue;bad.push(n+': '+name)}}
  const hud=get('js/ui/battlehud.js'),told=files.map(f=>get(f)).join('\n').match(/battleEvent\('\w+'/g)||[];
  ok(files.length>=20&&!bad.length&&!/B\.fallBack/.test(hud)&&told.length>=10,'the fight tells the HUD and the lab by battleEvent ('+[...new Set(told.map(x=>x.slice(13,-1)))].join(' ')+'), never calls them'+(bad.length?': '+bad.join('; '):'')+(/B\.fallBack/.test(hud)?'; battlehud.js polls B.fallBack':''))}
 ok(typeof t.BattleControl.prototype.suggest==='undefined','the unused advisory-target setter is removed; attack orders remain the focus-fire API');
 // ---- actions
 const want=['lr-','fg-','pt-','scene-','cv-','sg-','cap-','inv-','sk-','tree-','slot-','esc-','enc-','site-','wk-','rf-','es-','pl-','dlg-'];
 ok(want.every(p=>typeof t.ACTS[p]==='function')&&!t.ACTS['herd-'],'each dialog system owns its action prefix: '+Object.keys(t.ACTS).join(' ')+' (no herders’ window: nothing is bought from a herd)');
 let threw=false;try{t.onAct('cv-',()=>0)}catch(e){threw=/Two systems/.test(e.message)}ok(threw,'a second claim on a prefix is refused');
 // ---- encounters
 ok(['party','camp','monster','cave','lord','caravan','estate','siege','raid','patrol','field'].every(k=>t.ON_WIN[k]&&typeof t.ON_WIN[k].won==='function'),'every kind of encounter has its own outcome on victory');
 // ---- monsters are data; the dragon is a mythic one
 t.act('begin','soldier');G.quietEvents=true;
 ok((0,eval)('typeof W.dragon')==='undefined'&&(0,eval)('typeof updateDragon')==='undefined'&&t.MONSTERS.dragon.mythic,'no dragon special case: it is MONSTERS.dragon, with mythic rules');
 W.monsters=[];W.mythic={dragon:{back:G.day}};t.mythicDay();const D=t.mythicOf('dragon')||(t.mythicDay(),t.mythicOf('dragon'));
 ok(D&&D.id==='dragon','it appears on its day ('+(D?'near '+t.nearestOf(D,t.TOWNS).name:'not yet')+')');
 const g0=P.gold,r0=P.renown;G.mode='world';G.modal=false;t.startMonster(D);t.concludeEncounter(true,{},1,true,['dragon']);
 ok(!W.monsters.includes(D)&&P.gold>=g0+t.MONSTERS.dragon.mythic.hoard.gold&&P.renown>=r0+t.MONSTERS.dragon.mythic.hoard.renown,'slaying it pays its hoard ('+(P.gold-g0)+' gold)');
 ok(W.mythic.dragon.back===G.day+t.MONSTERS.dragon.mythic.back,'and the next one comes '+t.MONSTERS.dragon.mythic.back+' days later');t.act('cont');
 t.saveGame(true);W.mythic={};t.loadGame();ok(W.mythic.dragon&&W.mythic.dragon.back===G.day+30,'the wait is saved');
 {const keys=Object.keys(t.worldSave()).join(),want='v,map,edits,seen,own,rel,dead,lords,exiles,mythic,monsters,sites,caravans,refugees,patrols,fights,lrel,uidN,fightN,treas,critters,shops';
  ok(keys===want||keys.startsWith(want+',')&&/^(,road)?(,news)?(,threads)?(,gatherings)?(,rng)?$/.test(keys.slice(want.length)),'the world part of a save keeps its keys in their order: '+keys)}
 // ---- the old collision: two handlers answered 'fief-take'
 const tw=t.townBy('Ashford');tw.owner='player';tw.gar=6;t.ensureEcon(tw);tw.stock.grain=50;G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.enterTown(tw);t.act('tab','fief');
 const gar=tw.gar,grain=t.goodN('grain');t.act('fief-take','grain:10');
 ok(t.goodN('grain')===grain+10&&tw.gar===gar,'Take 10 from the fief stores takes grain, not a soldier');
 const tc=t.troopCount();t.act('fief-callup','1');ok(tw.gar===gar-1&&t.troopCount()===tc+1,'calling up a garrison soldier is its own action');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
