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
  // (every band's groups made from its counts before it is written: they are saved with it, and the world fingerprint W7 counts on it)
  partyRoster(P).groups;for(const o of allParties())partyRoster(o).groups;
  slot=slot||'auto';const d={v:2,at:Date.now(),mw:MW,P:{...P,tx:null,ty:null,stuck:0},day:G.day,clock:G.clock,speed:G.speed,last:G.lastTown&&G.lastTown.name,bandits,perkOffer:G.perkOffer||null,world:worldSave()};
  try{localStorage.setItem(slotKey(slot),JSON.stringify(d));if(!quiet)log('Game saved'+(slot==='auto'?'':' ('+slotName(slot)+')')+'.','good')}
  catch(e){if(!quiet)log('Could not save. Browser storage is unavailable.','bad')}
}
// the world part of a save: every holding's own record (holdings.js saveRec), then the world's lists
function worldSave(){return {v:2,seen:seenSave(),own:TOWNS.map(t=>t.saveRec()),rel:W.rel,dead:W.dead,lords:W.lords,exiles:W.exiles||[],mythic:W.mythic,monsters:W.monsters,sites:W.sites,
  caravans:W.caravans,refugees:W.refugees,patrols:W.patrols,fights:W.fights,lrel:W.lrel||{},uidN:W.uidN||0,fightN:W.fightN||0,treas:W.treas,critters:W.critters,shops:W.shops||{}}}
// does the world part fit this world: a record for each holding the world made, the rest founded ones of a kind there is (read
// before anything is put back, so a save that doesn't fit leaves the game as it was)
function worldFits(w){const made=new Set(MADE_HOLDINGS.map(h=>h.name)),own=w.own||[],bad=m=>{throw new Error('This save does not fit this world: '+m+'.')};
  for(const n of made)if(!own.some(o=>o[2]===n))bad('no record of '+n);
  for(const o of own){const x=o[3]||bad('a holding without its state'),k=x.base?x.base.kind:x.kind;
    if(!x.base!==made.has(o[2]))bad(o[2]+(x.base?' is founded twice':' is not in it'));if((x.base||x.kind)&&!HOLDING_TYPES[k])bad('no kind of holding called '+k)}}
// the world part put back, on the world as it first stood (useWorld): each holding the world made takes its record back (by
// name), those founded in that game are made again from theirs, after them and in their order; then the world's lists
function worldLoad(w){
  for(const o of w.own)if(o[3].base)TOWNS.push(Holding.fromRec(o));else townBy(o[2]).loadRec(o);
  Object.assign(W,{treas:w.treas,rel:w.rel,dead:w.dead,lords:w.lords.map(asParty),exiles:w.exiles,mythic:w.mythic,
    shops:w.shops,caravans:w.caravans.map(asParty),ships:[],refugees:w.refugees,patrols:w.patrols.map(asParty),fights:w.fights,
    lrel:w.lrel,uidN:w.uidN,fightN:w.fightN,folk:[],critters:w.critters,monsters:w.monsters});
  occRebuild();seenLoad(w.seen);W.sites=w.sites.map(siteOf);W.sites.forEach(s=>s.placed());W.critters.forEach(herdToFields);
}
/* loading a save, as steps behind "Returning to Ashmark…" (loading.js runSteps): the save read (and checked against the world),
   then put in in one step (the world as it first stood, the session, the save's records), then the land under you painted. A
   failure shows the error, with the way back to the saves; one in reading leaves the game untouched */
function loadGame(slot){
  if(typeof BattleLab!=='undefined'&&BattleLab.active){log('Exit the battle test before loading.','bad');return}
  const d=readSave(slot);if(!d)return showTitle();
  runSteps('Returning to Ashmark…',[
    {id:'read',label:'Reading the save',w:1,run:()=>worldFits(d.world)},
    {id:'apply',label:'Restoring holdings and parties',w:4,run:()=>applySave(d)},
    {id:'paint',label:'Painting the land',w:3,run:paintView}],{back:['Back to your saves',()=>showTitle('load')]}).catch(()=>{});// (a failure shows itself)
}
// Schema v2 only. No conversion, old gear/roster aliases or legacy-world migration.
function applySave(d){
  // (the world as it first stood, every system's world reset with it, as a new game's: nothing the last game left on a holding stays)
  resetSession(d.P);useWorld(WM);registerRecruits();const w=d.world;
  G.day=d.day;G.clock=d.clock;G.rankSeen=P.renown>=250?1:0;setSpeed(d.speed);G.paused=false;pauseUI();
  // (the parties made of their kinds again: bands here, your companions' parties, lords, caravans and patrols)
  bandits=d.bandits.map(asParty);for(const id in P.comps)if(P.comps[id].party)asParty(P.comps[id].party);
  worldLoad(w);G.lastTown=townBy(d.last)||null;G.perkOffer=d.perkOffer;
  unstick(P);W.lords.forEach(unstick);bandits.forEach(unstick);W.monsters.forEach(unstick);txpClamp();
  G.mode='world';hidePanel();G.msgs=[];log('Welcome back. It is day '+G.day+'.');updateHint();updateHUD(true);
}
// delete a slot's save (the latest, if none is named)
function wipeSave(slot){const s=slot||latestSlot();try{if(s)localStorage.removeItem(slotKey(s))}catch(e){}G.wipeArmed=false;G.resume=null;showTitle('load')}
