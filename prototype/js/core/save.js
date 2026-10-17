'use strict';
/* ---------- save / load ---------- */
/* Current-schema save slots: autosave (each day and on leaving town), quick save
   (F6 and the Save button) and five slots you save to from the menu. Continue loads the latest of them; Load game lists them all */
const SAVE_SLOTS=['auto','quick','1','2','3','4','5'],SLOT_N={auto:'Autosave',quick:'Quick save'};
const slotName=s=>SLOT_N[s]||'Slot '+s;
const slotKey=s=>!s||s==='auto'?SAVE:SAVE+'.'+s;
function readSlot(s){try{const d=JSON.parse(localStorage.getItem(slotKey(s)));return d&&d.v===2&&d.P&&d.P.army&&d.world&&d.world.v===2?d:null}catch(e){return null}}
// the latest save of all (or one slot's)
function latestSlot(){let best=null,bt=-1;for(const s of SAVE_SLOTS){const d=readSlot(s);if(d&&(d.at||0)>bt){bt=d.at||0;best=s}}return best}
function readSave(s){return readSlot(s||latestSlot())}
function saveGame(quiet,slot){
  if(typeof BattleLab!=='undefined'&&BattleLab.active){if(!quiet)log('Exit the battle test before saving.','bad');return}
  if(!ESC_SAVE.includes(G.mode)){if(!quiet)log('You can only save while traveling or in town.','bad');return}
  partyRoster(P).groups;for(const o of allParties())partyRoster(o).groups;
  slot=slot||'auto';const d={v:2,at:Date.now(),mw:MW,P:{...P,tx:null,ty:null,stuck:0},day:G.day,clock:G.clock,speed:G.speed,last:G.lastTown&&G.lastTown.name,bandits,perkOffer:G.perkOffer||null,
    world:{v:2,seen:seenSave(),own:TOWNS.map(t=>[t.owner,t.gar,t.name,{s:t.sacked||0,r:t.raided||0,u:t.turmoil||0,g:t.grow,b:t.bld,w:t.wall,k:t.work,f:t.fear||0,cr:t.crime||null,wo:t.watchOff||0,l:(t.lots||[]).map(l=>({id:l.id,k:l.k,type:l.type,x:l.x,y:l.y,n:l.n,lv:l.lv,seed:l.seed,st:l.st,plots:l.plots})),e:t.stock?{st:t.stock,pop:t.pop,pros:t.pros,tax:t.tax,vol:t.vol,pf:t.popF}:null}]),rel:W.rel,dead:W.dead,lords:W.lords,exiles:W.exiles||[],mythic:W.mythic,monsters:W.monsters,sites:W.sites,caravans:W.caravans,refugees:W.refugees,patrols:W.patrols,fights:W.fights,lrel:W.lrel||{},uidN:W.uidN||0,fightN:W.fightN||0,treas:W.treas,critters:W.critters,shops:W.shops||{}}};
  try{localStorage.setItem(slotKey(slot),JSON.stringify(d));if(!quiet)log('Game saved'+(slot==='auto'?'':' ('+slotName(slot)+')')+'.','good')}
  catch(e){if(!quiet)log('Could not save. Browser storage is unavailable.','bad')}
}
function loadGame(slot){
  if(typeof BattleLab!=='undefined'&&BattleLab.active){log('Exit the battle test before loading.','bad');return}
  const d=readSave(slot);if(!d)return showTitle();
  // Schema v2 only. No conversion, old gear/roster aliases or legacy-world migration.
  resetSession(d.P);registerRecruits();const w=d.world;
  G.day=d.day;G.clock=d.clock;G.rankSeen=P.renown>=250?1:0;setSpeed(d.speed);G.paused=false;pauseUI();
  G.lastTown=TOWNS.find(t=>t.name===d.last)||null;G.perkOffer=d.perkOffer;
  bandits=d.bandits.map(asParty);
  TOWNS.forEach(t=>{
    const o=w.own.find(x=>x[2]===t.name),x=o[3];t.owner=o[0];t.gar=o[1];t.lastOwner=t.owner;
    t.sacked=x.s;t.raided=x.r;t.turmoil=x.u;t.grow=x.g;t.fear=x.f;t.crime=x.cr;t.watchOff=x.wo;
    t.bld=x.b;t.wall=x.w;t.work=x.k;t.lots=x.l;
    const e=x.e;if(e){t.stock=e.st;t.pop=e.pop;t.pros=e.pros;t.tax=e.tax;t.vol=e.vol;t.popF=e.pf}
  });
  Object.assign(W,{treas:w.treas,rel:w.rel,dead:w.dead,lords:w.lords.map(asParty),exiles:w.exiles,mythic:w.mythic,
    shops:w.shops,caravans:w.caravans.map(asParty),ships:[],refugees:w.refugees,patrols:w.patrols.map(asParty),fights:w.fights,
    lrel:w.lrel,uidN:w.uidN,fightN:w.fightN,folk:[],critters:w.critters,monsters:w.monsters});
  occRebuild();seenLoad(w.seen);W.sites=w.sites.map(siteOf);W.sites.forEach(s=>s.placed());W.critters.forEach(herdToFields);
  unstick(P);W.lords.forEach(unstick);bandits.forEach(unstick);W.monsters.forEach(unstick);txpClamp();
  G.mode='world';hidePanel();G.msgs=[];log('Welcome back. It is day '+G.day+'.');updateHint();updateHUD(true);
}
// delete a slot's save (the latest, if none is named)
function wipeSave(slot){const s=slot||latestSlot();try{if(s)localStorage.removeItem(slotKey(s))}catch(e){}G.wipeArmed=false;G.resume=null;showTitle('load')}
