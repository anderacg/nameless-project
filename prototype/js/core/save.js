'use strict';
/* ---------- save / load ---------- */
/* Current-schema save slots: autosave (each day and on leaving town), quick save
   (F6 and the Save button) and five slots you save to from the menu. Continue loads the latest of them; Load game lists them all */
const SAVE_SLOTS=['auto','quick','1','2','3','4','5'],SLOT_N={auto:'Autosave',quick:'Quick save'};
const slotName=s=>SLOT_N[s]||'Slot '+s;
const slotKey=s=>!s||s==='auto'?SAVE:SAVE+'.'+s;
/* save v3 (doc/WORLD_DESIGN.md §9.3, D7, D8): world.map, the world's gen, settings and checksum (the world is made again from
   them, never stored), then what play changed. A slot holds the save as plain JSON, or gzipped: a small plain header (v, at, the
   save line's fields, world.map: saveHead) beside its body z (gzip, base64), so the save list reads at once. Gzipped where the
   browser can (CompressionStream); plain under LOADING.sync (the tests: W7 hashes it) and where it cannot. Older saves are
   refused, never migrated (D7) */
const SAVE_V=3,SAVE_ZIP=typeof CompressionStream==='function'&&typeof DecompressionStream==='function';
const OTHER_WORLD='This save was made in another world version; start a new game.';
const slotRaw=s=>{try{return JSON.parse(localStorage.getItem(slotKey(s)))}catch(e){return null}};
// a slot's save (or its header, when gzipped), if this version made it
function readSlot(s){const d=slotRaw(s);return d&&d.v===SAVE_V&&d.P&&d.world&&d.world.v===SAVE_V&&d.world.map&&(d.z||d.P.army)?d:null}
// (a slot an older version saved: refused; the save list says so)
function oldSlot(s){const d=slotRaw(s);return !!d&&typeof d==='object'&&!readSlot(s)}
// the latest save of all (or one slot's)
function latestSlot(){let best=null,bt=-1;for(const s of SAVE_SLOTS){const d=readSlot(s);if(d&&(d.at||0)>bt){bt=d.at||0;best=s}}return best}
function readSave(s){return readSlot(s||latestSlot())}
// the header a gzipped body keeps beside it: what the save list shows (ui.js saveLine) and the world it was made in
const saveHead=d=>({v:d.v,at:d.at,day:d.day,P:{race:d.P.race,bg:d.P.bg,level:d.P.level,gold:d.P.gold},world:{v:d.world.v,map:d.world.map}});
async function gzip64(text){const b=new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  let s='';for(let i=0;i<b.length;i+=4096)s+=String.fromCharCode.apply(null,b.subarray(i,i+4096));return btoa(s)}
function gunzip64(z){const s=atob(z),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);
  return new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text()}
// (gzipped writes under way, one after another: a load waits for them)
let SAVING=null;
// the game saved to a slot (the autosave, if none is named): written at once when plain; gzipped, the save as it stands now is
// written once zipped (a Promise; plain if zipping fails)
function saveGame(quiet,slot){
  if(typeof BattleLab!=='undefined'&&BattleLab.active){if(!quiet)log('Exit the battle test before saving.','bad');return}
  if(!ESC_SAVE.includes(G.mode)){if(!quiet)log('You can only save while traveling or in town.','bad');return}
  // (every band's groups made from its counts before it is written: they are saved with it, and the world fingerprint W7 counts on it)
  partyRoster(P).groups;for(const o of allParties())partyRoster(o).groups;
  slot=slot||'auto';const d={v:SAVE_V,at:Date.now(),mw:MW,P:{...P,tx:null,ty:null,stuck:0},day:G.day,clock:G.clock,speed:G.speed,last:G.lastTown&&G.lastTown.name,bandits,perkOffer:G.perkOffer||null,world:worldSave()},json=JSON.stringify(d);
  // (true once it is stored; false when the browser would not keep it: the menu says which, never "saved" for a save that failed)
  const put=s=>{try{localStorage.setItem(slotKey(slot),s);if(!quiet)log('Game saved'+(slot==='auto'?'':' ('+slotName(slot)+')')+'.','good');return true}
    catch(e){if(!quiet)log('Could not save. Browser storage is unavailable.','bad');return false}};
  if(LOADING.sync||!SAVE_ZIP)return put(json);
  const p=SAVING=(SAVING||Promise.resolve()).then(()=>gzip64(json)).then(z=>JSON.stringify({...saveHead(d),z}),()=>json).then(put).then(ok=>{if(SAVING===p)SAVING=null;return ok});return p;
}
// the world part of a save: the world it is (map: made again from it on a load), the tiles play changed (edits: none yet), every
// holding's own record (holdings.js saveRec), then the world's lists
function worldSave(){return {v:SAVE_V,map:{gen:WM.gen,settings:WM.settings,sum:WM.sum},edits:[],seen:seenSave(),own:TOWNS.map(t=>t.saveRec()),rel:W.rel,dead:W.dead,lords:W.lords,exiles:W.exiles||[],mythic:W.mythic,monsters:W.monsters,sites:W.sites,
  caravans:W.caravans,refugees:W.refugees,patrols:W.patrols,fights:W.fights,lrel:W.lrel||{},uidN:W.uidN||0,fightN:W.fightN||0,treas:W.treas,critters:W.critters,shops:W.shops||{},...roadSave()}}
// does the world part fit this world (made: the holdings it made, by default the world's in): a record for each holding the world
// made, the rest founded ones of a kind there is (read before anything is put back, so a save that doesn't fit leaves the game as
// it was)
function worldFits(w,made){const names=new Set((made||MADE_HOLDINGS).map(h=>h.name)),own=w.own||[],bad=m=>{throw new Error('This save does not fit this world: '+m+'.')};
  for(const n of names)if(!own.some(o=>o[2]===n))bad('no record of '+n);
  for(const o of own){const x=o[3]||bad('a holding without its state'),k=x.base?x.base.kind:x.kind;
    if(!x.base!==names.has(o[2]))bad(o[2]+(x.base?' is founded twice':' is not in it'));if((x.base||x.kind)&&!HOLDING_TYPES[k])bad('no kind of holding called '+k)}}
// the world part put back, on the world as it first stood (useWorld): each holding the world made takes its record back (by
// name), those founded in that game are made again from theirs, after them and in their order; then the world's lists
function worldLoad(w){
  for(const o of w.own)if(o[3].base)TOWNS.push(Holding.fromRec(o));else townBy(o[2]).loadRec(o);
  Object.assign(W,{treas:w.treas,rel:w.rel,dead:w.dead,lords:w.lords.map(asParty),exiles:w.exiles,mythic:w.mythic,
    shops:w.shops,caravans:w.caravans.map(asParty),ships:[],refugees:w.refugees,patrols:w.patrols.map(asParty),fights:w.fights,
    lrel:w.lrel,uidN:w.uidN,fightN:w.fightN,folk:[],critters:w.critters,monsters:w.monsters.map(asMonster)});
  occRebuild();seenLoad(w.seen);W.sites=w.sites.map(siteOf);W.sites.forEach(s=>s.placed());W.critters.forEach(herdToFields);roadLoad(w.road);
}
/* loading a save, as steps behind "Returning to {world}…" (loading.js runSteps): the save read (gunzipped: a step that waits);
   the world it was made in made again first when it is not the one in (another gen or other settings: session.js forgeSteps,
   the generator's stages); then, in one step, the save checked against that world (another checksum: another world version,
   refused; worldFits) and put in (that world, if made again; the world as it first stood, the session, the save's records);
   then the land under you painted. A failure shows the error, with the way back to the saves; one before the putting in leaves
   the game untouched */
function loadGame(slot){
  if(typeof BattleLab!=='undefined'&&BattleLab.active){log('Exit the battle test before loading.','bad');return}
  if(SAVING&&!LOADING.sync)return SAVING.then(()=>loadGame(slot));
  const h=readSave(slot);if(!h)return showTitle();
  const M=h.world.map,made=worldKey(M)===worldKey(WM)?null:{};let d=null;
  runSteps('Returning to '+worldName(M)+'…',[
    {id:'read',label:'Reading the save',w:40,run:()=>{if(!h.z)return d=h;if(LOADING.sync)throw new Error('A gzipped save cannot be read at once.');return gunzip64(h.z).then(t=>{d=JSON.parse(t)})}},
    ...(made?forgeSteps(M.gen,M.settings,r=>made.r=r):[]),
    {id:'apply',label:'Restoring holdings and parties',w:160,run:()=>{const r=made&&made.r;
      if(d.world.map.sum!==(r?r.map.sum:WM.sum))throw new Error(OTHER_WORLD);worldFits(d.world,r&&r.holdings);if(r)forgeInstall(r);applySave(d)}},
    {id:'paint',label:'Painting the land',w:120,run:paintView}],{back:['Back to your saves',()=>showTitle('load')]}).catch(()=>{});// (a failure shows itself)
}
// Schema v3 only. No conversion, old gear/roster aliases or legacy-world migration.
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
