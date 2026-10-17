'use strict';
// Structure: the rules that keep the code organized. No two scripts declare the same top-level name (a second `function`
// would silently replace the first); the wiki loads the game's scripts in the game's order; every dialog's actions are owned
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
 ok(srcs.every(s=>/^js\/(core|data|world|battle|scene|gfx|ui)\/[\w]+\.js$|^js\/main\.js$/.test(s)),'every script lives in its folder: core, data, world, battle, scene, gfx or ui');
 const order=srcs.map(s=>s.replace(/^js\//,'')),dataFirst=order.findIndex(s=>!s.startsWith('core/core')&&!s.startsWith('data/'));
 ok(order[0]==='core/core.js'&&order.slice(1,dataFirst).every(s=>s.startsWith('data/'))&&order.slice(dataFirst).every(s=>!s.startsWith('data/')),'core loads first, then all the data, then the systems');
 const wiki=[...get('wiki.html').matchAll(/<script src="(js\/[^"]+)"/g)].map(m=>m[1]);
 ok(wiki.join()===srcs.filter(s=>!/ui\/input\.js|main\.js/.test(s)).join(),'the wiki loads the same scripts in the same order (all but input and main)');
 // ---- extracted battle responsibilities keep a single owner; these are plain scripts, not isolated modules
 const battleOwners={
  'battle':['updateBattle'],
  'battlecontrol':['moveOrder'],
  'commands':['rtsOrder','setOrder'],
  'setup':['startBattle'],
  'resolution':['finishBattle','concludeEncounter'],
  'actors':['aiUnit','shotStep','relocating','updateNonHeroActors'],
  'attacks':['applyDmg','attack','bladeBlow'],
  'projectiles':['fireBolt','arcStep','updateProjectiles']
 };
 for(const [file,names] of Object.entries(battleOwners))ok(names.every(n=>seen[n]==='js/battle/'+file+'.js'),'battle ownership: '+names.join(', ')+' belong to '+file+'.js');
 const battleOrder=['battle','battlecontrol','commands','setup','resolution','attacks','projectiles','actors','combat','commander','abilities','formations','morale','fatigue','camera','deploy'].map(n=>'battle/'+n+'.js');
 ok(battleOrder.every((f,i)=>order.includes(f)&&(!i||order.indexOf(battleOrder[i-1])<order.indexOf(f))),'battle scripts retain the supported loading order in both entry points');
 ok(typeof t.BattleControl.prototype.suggest==='undefined','the unused advisory-target setter is removed; attack orders remain the focus-fire API');
 // ---- actions
 const want=['lr-','fg-','pt-','scene-','cv-','sg-','cap-','inv-','sk-','tree-','slot-','esc-','ev-','site-','herd-','wk-','rf-','es-','pl-','dlg-'];
 ok(want.every(p=>typeof t.ACTS[p]==='function'),'each dialog system owns its action prefix: '+Object.keys(t.ACTS).join(' '));
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
 // ---- the old collision: two handlers answered 'fief-take'
 const tw=t.townBy('Ashford');tw.owner='player';tw.gar=6;t.ensureEcon(tw);tw.stock.grain=50;G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.enterTown(tw);t.act('tab','fief');
 const gar=tw.gar,grain=t.goodN('grain');t.act('fief-take','grain:10');
 ok(t.goodN('grain')===grain+10&&tw.gar===gar,'Take 10 from the fief stores takes grain, not a soldier');
 const tc=t.troopCount();t.act('fief-callup','1');ok(tw.gar===gar-1&&t.troopCount()===tc+1,'calling up a garrison soldier is its own action');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
