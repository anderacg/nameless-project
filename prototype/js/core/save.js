'use strict';
/* ---------- save / load ---------- */
function readSave(){try{const d=JSON.parse(localStorage.getItem(SAVE));return d&&d.v===1&&d.P?d:null}catch(e){return null}}
function saveGame(quiet){
  if(!['world','town','char','inv','skills','site','herd','besiege'].includes(G.mode)){if(!quiet)log('You can only save while traveling or in town.','bad');return}
  const d={v:1,mw:MW,P:{...P,tx:null,ty:null,stuck:0},day:G.day,clock:G.clock,speed:G.speed,last:G.lastTown&&G.lastTown.name,bandits,camps:CAMPS.map(c=>[c.cleared,c.back]),perkOffer:G.perkOffer||null,
    world:{v:2,own:TOWNS.map(t=>[t.owner,t.gar,t.name,{s:t.sacked||0,r:t.raided||0,u:t.turmoil||0,g:t.grow,b:t.bld,w:t.wall,k:t.work,f:t.fear||0,e:t.stock?{st:t.stock,pop:t.pop,pros:t.pros,tax:t.tax,vol:t.vol,pf:t.popF}:null}]),rel:W.rel,dead:W.dead,lords:W.lords,mythic:W.mythic,monsters:W.monsters,sites:W.sites,caravans:W.caravans,refugees:W.refugees,treas:W.treas,critters:W.critters,shops:W.shops||{}}};
  try{localStorage.setItem(SAVE,JSON.stringify(d));if(!quiet)log('Game saved.','good')}
  catch(e){if(!quiet)log('Could not save. Browser storage is unavailable.','bad')}
}
function loadGame(){
  const d=readSave();if(!d)return showTitle();
  Object.assign(P,d.P);const sk=mkSkills();for(const k in sk)if(!P.sk[k])P.sk[k]=sk[k];
  G.day=d.day;G.clock=d.clock;setSpeed(d.speed||1);G.paused=false;$('#pause').textContent='Pause';
  G.lastTown=TOWNS.find(t=>t.name===d.last)||null;G.capture=null;G.bes=null;if(P.siege===undefined)P.siege=null;if(P.raid===undefined)P.raid=null;G.perkOffer=d.perkOffer;G.town=null;G.enc=null;
  // a save from a smaller map: stretch the hero, lords and dragon onto this one; sites, beasts and bandits are placed afresh
  const k=MW/(d.mw||112);if(k!==1){P.x*=k;P.y*=k;const w=d.world;if(w){(w.lords||[]).forEach(l=>{l.x*=k;l.y*=k});if(w.dragon){['x','y','tx','ty'].forEach(f=>{if(w.dragon[f]!=null)w.dragon[f]*=k})}w.sites=null;w.critters=null;w.monsters=null;w.caravans=null;w.refugees=null}d.bandits=[];
    (P.quests||[]).forEach(q=>{['x','y'].forEach(f=>{if(typeof q[f]==='number')q[f]*=k})});log('The world has grown since this save. Ashmark is larger now, with new holdings to find.','gold')}
  bandits=d.bandits||[];CAMPS.forEach((c,i)=>{const s=d.camps[i]||[false,0];c.cleared=s[0];c.back=s[1]});
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
  if(!P.hostile)P.hostile={};if(!P.fac)P.fac=null;if(!P.race)P.race='human';G.chase=null;
  const mig=o=>{for(const k of Object.keys(o))if(MIG[k]){o[MIG[k]]=(o[MIG[k]]||0)+o[k];delete o[k]}};mig(P.troops);mig(P.prisoners);
  // world v2: five factions, owners stored by holding name. Older worlds restart their realms; the hero keeps everything.
  if(d.world&&d.world.v===2){TOWNS.forEach(t=>{const o=d.world.own.find(x=>x[2]===t.name);t.owner=o?o[0]:HOME[t.name];t.gar=o?o[1]:GARCAP[t.kind];const x=o&&o[3]||{};t.sacked=x.s||0;t.raided=x.r||0;t.turmoil=x.u||0;t.grow=x.g!=null?x.g:GROW0;t.lastOwner=t.owner;t.fear=x.f||0;if(x.b){t.bld=x.b;t.wall=x.w;t.work=x.k||null}else initEstates(t);
    if(x.e){t.stock=x.e.st;t.pop=x.e.pop;t.pros=x.e.pros;t.tax=x.e.tax;t.vol=x.e.vol;t.popF=x.e.pf||0}else initEconomy(t)});W.treas=d.world.treas||{};W.rel=d.world.rel||{};W.dead=d.world.dead||{};W.lords=d.world.lords||[];W.lords.forEach(l=>l.troops=l.troops.map(k=>MIG[k]||k));W.mythic=d.world.mythic||{};{const od=d.world.dragon;if(od&&!d.world.mythic)W.mythic.dragon={back:od.alive?G.day:od.back||G.day+8}}}
  else{initWorld();if(d.world)log('The realms have changed since this save. The world starts fresh around your hero.','gold')}
  W.lords=W.lords.filter(l=>FACS[l.fac]&&FACS[l.fac].lords.includes(l.name));addMissingLords();
  W.shops=d.world&&d.world.shops||{};W.caravans=d.world&&d.world.caravans||[];W.refugees=d.world&&d.world.refugees||[];W.folk=[];G.cv=null;
  W.sites=d.world&&d.world.sites||genSites();G.lastSite=null;G.site=null;
  W.critters=d.world&&d.world.critters||[];W.critters=W.critters.filter(c=>!c.home||!CRITTERS[c.id]||grazeOk(c.id,c.hx,c.hy,c.pen));if(!W.critters.length)initCritters();G.herd=null;
  W.monsters=d.world&&d.world.monsters||[];if(!W.monsters.length)for(let i=0;i<MONSTER_START;i++)spawnMonster(true);
  bandits.forEach(b=>{if(b.kind==='wolves'||b.kind==='scorpions')b.kind='bandits'});
  unstick(P);W.lords.forEach(unstick);bandits.forEach(unstick);W.monsters.forEach(unstick);
  G.mode='world';hidePanel();G.msgs=[];log('Welcome back. It is day '+G.day+'.'+spilled,spilled?'bad':'');updateHint();updateHUD(true);
}
function wipeSave(){try{localStorage.removeItem(SAVE)}catch(e){}G.wipeArmed=false;G.resume=null;showTitle()}
