'use strict';
/* ---------- save / load ---------- */
/* save slots: the autosave (the game saves itself each day, on leaving a town and so on: the old save's own key), the quick save
   (F6 and the Save button) and five slots you save to from the menu. Continue loads the latest of them; Load game lists them all */
const SAVE_SLOTS=['auto','quick','1','2','3','4','5'],SLOT_N={auto:'Autosave',quick:'Quick save'};
const slotName=s=>SLOT_N[s]||'Slot '+s;
const slotKey=s=>!s||s==='auto'?SAVE:SAVE+'.'+s;
function readSlot(s){try{const d=JSON.parse(localStorage.getItem(slotKey(s)));return d&&d.v===1&&d.P?d:null}catch(e){return null}}
// the latest save of all (or one slot's)
function latestSlot(){let best=null,bt=-1;for(const s of SAVE_SLOTS){const d=readSlot(s);if(d&&(d.at||0)>bt){bt=d.at||0;best=s}}return best}
function readSave(s){return readSlot(s||latestSlot())}
function saveGame(quiet,slot){
  if(!ESC_SAVE.includes(G.mode)){if(!quiet)log('You can only save while traveling or in town.','bad');return}
  slot=slot||'auto';const d={v:1,at:Date.now(),mw:MW,P:{...P,tx:null,ty:null,stuck:0},day:G.day,clock:G.clock,speed:G.speed,last:G.lastTown&&G.lastTown.name,bandits,perkOffer:G.perkOffer||null,
    world:{v:2,seen:seenSave(),own:TOWNS.map(t=>[t.owner,t.gar,t.name,{s:t.sacked||0,r:t.raided||0,u:t.turmoil||0,g:t.grow,b:t.bld,w:t.wall,k:t.work,f:t.fear||0,cr:t.crime||null,wo:t.watchOff||0,l:(t.lots||[]).map(l=>({id:l.id,k:l.k,type:l.type,x:l.x,y:l.y,n:l.n,lv:l.lv,seed:l.seed,st:l.st,plots:l.plots})),e:t.stock?{st:t.stock,pop:t.pop,pros:t.pros,tax:t.tax,vol:t.vol,pf:t.popF}:null}]),rel:W.rel,dead:W.dead,lords:W.lords,exiles:W.exiles||[],mythic:W.mythic,monsters:W.monsters,sites:W.sites,caravans:W.caravans,refugees:W.refugees,patrols:W.patrols,fights:W.fights,lrel:W.lrel||{},uidN:W.uidN||0,fightN:W.fightN||0,treas:W.treas,critters:W.critters,shops:W.shops||{}}};
  try{localStorage.setItem(slotKey(slot),JSON.stringify(d));if(!quiet)log('Game saved'+(slot==='auto'?'':' ('+slotName(slot)+')')+'.','good')}
  catch(e){if(!quiet)log('Could not save. Browser storage is unavailable.','bad')}
}
function loadGame(slot){
  const d=readSave(slot);if(!d)return showTitle();
  resetSession(d.P);registerRecruits();const sk=mkSkills();for(const k in sk)if(!P.sk[k])P.sk[k]=sk[k];
  G.day=d.day;G.clock=d.clock;G.rankSeen=P.renown>=250?1:0;setSpeed(d.speed||1);G.paused=false;pauseUI();
  G.lastTown=TOWNS.find(t=>t.name===d.last)||null;G.capture=null;G.bes=null;if(P.siege===undefined)P.siege=null;if(P.raid===undefined)P.raid=null;G.perkOffer=d.perkOffer;G.town=null;G.enc=null;
  // a save from a smaller map: stretch the hero, lords and dragon onto this one; sites, beasts and bandits are placed afresh
  const k=MW/(d.mw||112);if(k!==1){P.x*=k;P.y*=k;const w=d.world;if(w){(w.lords||[]).forEach(l=>{l.x*=k;l.y*=k});if(w.dragon){['x','y','tx','ty'].forEach(f=>{if(w.dragon[f]!=null)w.dragon[f]*=k})}w.sites=null;w.critters=null;w.monsters=null;w.caravans=null;w.refugees=null;w.patrols=null;w.fights=null}d.bandits=[];
    (P.quests||[]).forEach(q=>{['x','y'].forEach(f=>{if(typeof q[f]==='number')q[f]*=k})});log('The world has grown since this save. Ashmark is larger now, with new holdings to find.','gold')}
  bandits=(d.bandits||[]).map(asParty);
  // older saves had weapon, armor and charm slots: move each item to the slot its kind now uses
  {const old=P.gear||{},g=emptyGear(),rest=[];Object.entries(old).forEach(([k,id])=>{if(!id||!ITEMS[id])return;if(EQUIP.includes(k)&&!g[k]&&(slotOfKey(k)===ITEMS[id].slot||k==='offhand'))g[k]=id;else rest.push(id)});
   rest.forEach(id=>{const sl=ITEMS[id].slot,k=sl==='ring'?EQUIP.find(x=>x.startsWith('ring')&&!g[x]):sl;if(k&&!g[k])g[k]=id;else invAdd('gear',id,1)});P.gear=g}
  // saves from before the inventory kept gear in P.bag and trophies in P.loot
  if(!Array.isArray(d.P.inv)){P.inv=Array(INV_SIZE).fill(null);(P.bag||[]).forEach(id=>invAdd('gear',id,1));Object.keys(P.loot||{}).forEach(id=>P.loot[id]&&invAdd('mat',id,P.loot[id]))}
  while(P.inv.length<invCap())P.inv.push(null);delete P.bag;delete P.loot;
  // saves from before goods took bag slots kept them in P.cargo
  let spilled='';if(P.cargo){const lost=[];for(const g of Object.keys(P.cargo))if(GOODS[g]&&P.cargo[g]>0){const k=invAdd('good',g,P.cargo[g]);if(k<P.cargo[g])lost.push((P.cargo[g]-k)+' '+GOODS[g].n.toLowerCase())}
    if(lost.length)spilled=' Your bag could not hold everything: '+lost.join(', ')+' left behind.';delete P.cargo}
  if(!P.rep)P.rep={};if(!P.honor)P.honor={};if(!d.P.tree){P.tree=[];P.tp=Math.max(0,P.level-1)}if(!P.origin)P.origin=originOf(P.bg);if(!P.tree.includes(P.origin)){P.tree.unshift(P.origin);applyNode(P.origin,1)}if(P.pts>0){P.tp=(P.tp||0)+P.pts;log('Your '+P.pts+' unspent attribute point'+(P.pts>1?'s are':' is')+' now skill points.','gold');P.pts=0}P.tree=P.tree.filter(id=>TREE[id]);if(!d.P.slots){P.slots=Array(10).fill(null);Object.keys(HSKILLS).filter(knows).slice(0,10).forEach((id,i)=>P.slots[i]=id)}P.slots=P.slots.map(id=>id&&HSKILLS[id]?id:null);if(!P.quests)P.quests=[];if(!P.jobs)P.jobs={};G.lordJob=null;
  if(!P.hostile)P.hostile={};if(!P.txp)P.txp={};if(!P.fac)P.fac=null;if(!P.race)P.race='human';G.chase=null;
  const mig=o=>{for(const k of Object.keys(o))if(MIG[k]){o[MIG[k]]=(o[MIG[k]]||0)+o[k];delete o[k]}};mig(P.troops);mig(P.prisoners);txpClamp();
  // world v2: five factions, owners stored by holding name. Older worlds restart their realms; the hero keeps everything.
  if(d.world&&d.world.v===2){TOWNS.forEach(t=>{const o=d.world.own.find(x=>x[2]===t.name);t.owner=o?o[0]:HOME[t.name];t.gar=o?o[1]:t.T.gar;const x=o&&o[3]||{};t.sacked=x.s||0;t.raided=x.r||0;t.turmoil=x.u||0;t.grow=x.g!=null?x.g:GROW0;t.lastOwner=t.owner;t.fear=x.f||0;t.crime=x.cr||null;t.watchOff=x.wo||0;if(x.b){t.bld=x.b;t.wall=x.w;t.work=x.k||null}else initEstates(t);t.lots=x.l||null;
    if(x.e){t.stock=x.e.st;t.pop=x.e.pop;t.pros=x.e.pros;t.tax=x.e.tax;t.vol=x.e.vol;t.popF=x.e.pf||0}else initEconomy(t)});W.treas=d.world.treas||{};W.rel=d.world.rel||{};W.dead=d.world.dead||{};W.lords=d.world.lords||[];W.exiles=d.world.exiles||[];W.lords.forEach(l=>{asParty(l);l.troops=l.troops.map(k=>MIG[k]||k)});W.mythic=d.world.mythic||{};{const od=d.world.dragon;if(od&&!d.world.mythic)W.mythic.dragon={back:od.alive?G.day:od.back||G.day+8}}}
  else{initWorld();if(d.world)log('The realms have changed since this save. The world starts fresh around your hero.','gold')}
  occRebuild();TOWNS.forEach(t=>{if(!t.lots)initLots(t)});
  W.lords=W.lords.filter(l=>FACS[l.fac]&&FACS[l.fac].lords.includes(l.name));addMissingLords();
  W.shops=d.world&&d.world.shops||{};W.caravans=d.world&&d.world.caravans||[];W.ships=[];W.refugees=d.world&&d.world.refugees||[];W.patrols=(d.world&&d.world.patrols||[]).map(asParty);W.fights=d.world&&d.world.fights||[];W.lrel=d.world&&d.world.lrel||{};W.uidN=d.world&&d.world.uidN||0;W.fightN=d.world&&d.world.fightN||0;W.folk=[];G.cv=null;
  seenLoad(d.world&&d.world.seen);W.sites=(d.world&&d.world.sites||genSites()).map(siteOf);W.sites.forEach(s=>s.placed());G.lastSite=null;G.site=null;
  W.critters=d.world&&d.world.critters||[];W.critters.forEach(herdToFields);W.critters=W.critters.filter(c=>!c.home||!CRITTERS[c.id]||grazeOk(c.id,c.hx,c.hy,c.pen));if(!W.critters.length)initCritters();G.herd=null;
  W.monsters=d.world&&d.world.monsters||[];if(!W.monsters.length)for(let i=0;i<MONSTER_START;i++)spawnMonster(true);
  bandits.forEach(b=>{if(b.kind==='wolves'||b.kind==='scorpions')b.kind='bandits'});
  unstick(P);W.lords.forEach(unstick);bandits.forEach(unstick);W.monsters.forEach(unstick);
  G.mode='world';hidePanel();G.msgs=[];log('Welcome back. It is day '+G.day+'.'+spilled,spilled?'bad':'');updateHint();updateHUD(true);
}
// delete a slot's save (the latest, if none is named)
function wipeSave(slot){const s=slot||latestSlot();try{if(s)localStorage.removeItem(slotKey(s))}catch(e){}G.wipeArmed=false;G.resume=null;showTitle('load')}
