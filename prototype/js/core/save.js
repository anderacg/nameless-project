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
  if(typeof BattleLab!=='undefined'&&BattleLab.active){if(!quiet)toast('Exit the battle test before saving.','bad');return}
  if(!ESC_SAVE.includes(G.mode)){if(!quiet)toast('You can only save while traveling or in town.','bad');return}
  Systems.drain(true);// (a sliced day's work finished first: core/systems.js)
  slot=slot||'auto';const d=saveRecord(),json=JSON.stringify(d),sig=saveSig(d);
  // (true once it is stored; false when the browser would not keep it: the menu says which, never "saved" for a save that failed)
  const put=s=>{try{localStorage.setItem(slotKey(slot),s);G.saved={day:d.day,sig};if(!quiet)toast('Game saved'+(slot==='auto'?'':' ('+slotName(slot)+')')+'.','good');return true}
    catch(e){if(!quiet)toast('Could not save. Browser storage is unavailable.','bad');return false}};
  if(LOADING.sync||!SAVE_ZIP)return put(json);
  const p=SAVING=(SAVING||Promise.resolve()).then(()=>gzip64(json)).then(z=>JSON.stringify({...saveHead(d),z}),()=>json).then(put).then(ok=>{if(SAVING===p)SAVING=null;return ok});return p;
}
// what a save keeps, the game as it stands
function saveRecord(){
  // (every band's groups made from its counts before it is written: they are saved with it, and the world fingerprint W7 counts on it)
  partyRoster(P).groups;for(const o of allParties())partyRoster(o).groups;
  return {v:SAVE_V,at:Date.now(),mw:MW,P:{...P,tx:null,ty:null,stuck:0},day:G.day,clock:G.clock,speed:G.speed,last:G.lastTown&&G.lastTown.name,bandits,perkOffer:G.perkOffer||null,world:worldSave()}}
/* has play moved on since the last save (any slot, made or loaded in this game: G.saved, its day and its signature)? The same
   record, but for when it was made and the messages (a "Game saved." alone is no progress), is nothing changed: false; else the
   last save's day, 0 if this game was never saved (the Game Menu asks before leaving: ui/hub.js) */
const saveSig=d=>JSON.stringify({...d,at:0,world:{...d.world,chronicle:0}});
function unsavedSince(){const s=G.saved;return s&&s.sig===saveSig(saveRecord())?false:s?s.day:0}
// the world part of a save (the save registry, core/saves.js: every piece in its order): the world it is (map: made again from it
// on a load), the tiles play changed (edits: none yet), what you have seen (fog.js), every holding's own record (holdings.js
// saveRec), then the world's lists, the road's encounters (road.js) and the news (news.js), each once there is any
function worldSave(){return Saves.save()}
Saves.add({key:'v',        order:10,  save:()=>SAVE_V});
Saves.add({key:'map',      order:20,  save:()=>({gen:WM.gen,settings:WM.settings,sum:WM.sum})});
Saves.add({key:'edits',    order:30,  save:()=>[]});
// (each holding the world made takes its record back, by name; those founded in that game are made again from theirs, after
// them and in their order; once all are in, the lots' ground is laid again: lots.js occRebuild)
Saves.add({key:'own',      order:50,  save:()=>TOWNS.map(t=>t.saveRec()),
  load:own=>{for(const o of own)if(o[3].base)TOWNS.push(Holding.fromRec(o));else townBy(o[2]).loadRec(o)},settle:()=>occRebuild()});
// the world's lists, kept as they stand (the parties and beasts made their kinds again on a load: asParty, asMonster)
Saves.add({key:'rel',      order:60,  save:()=>W.rel,          load:v=>{W.rel=v}});
Saves.add({key:'dead',     order:70,  save:()=>W.dead,         load:v=>{W.dead=v}});
Saves.add({key:'lords',    order:80,  save:()=>W.lords,        load:v=>{W.lords=v.map(asParty)}});
Saves.add({key:'exiles',   order:90,  save:()=>W.exiles||[],   load:v=>{W.exiles=v}});
Saves.add({key:'mythic',   order:100, save:()=>W.mythic,       load:v=>{W.mythic=v}});
Saves.add({key:'monsters', order:110, save:()=>W.monsters,     load:v=>{W.monsters=v.map(asMonster)}});
Saves.add({key:'sites',    order:120, save:()=>W.sites,        settle:v=>{W.sites=v.map(siteOf);W.sites.forEach(s=>s.placed())}});
Saves.add({key:'caravans', order:130, save:()=>W.caravans,     load:v=>{W.caravans=v.map(asParty)}});
Saves.add({key:'refugees', order:140, save:()=>W.refugees,     load:v=>{W.refugees=v}});
Saves.add({key:'patrols',  order:150, save:()=>W.patrols,      load:v=>{W.patrols=v.map(asParty)}});
Saves.add({key:'fights',   order:160, save:()=>W.fights,       load:v=>{W.fights=v}});
Saves.add({key:'lrel',     order:170, save:()=>W.lrel||{},     load:v=>{W.lrel=v}});
Saves.add({key:'uidN',     order:180, save:()=>W.uidN||0,      load:v=>{W.uidN=v}});
Saves.add({key:'fightN',   order:190, save:()=>W.fightN||0,    load:v=>{W.fightN=v}});
Saves.add({key:'treas',    order:200, save:()=>W.treas,        load:v=>{W.treas=v}});
Saves.add({key:'critters', order:210, save:()=>W.critters,     load:v=>{W.critters=v.map(herdRec)},settle:()=>{W.critters.forEach(herdToFields)}});
Saves.add({key:'shops',    order:220, save:()=>W.shops||{},    load:v=>{W.shops=v}});
/* the chronicle (G.msgs: core/state.js CHRONICLE), lasting events, each saved as [day, m, cls, kind, ref, at] (an empty one 0, the
   empty ones at its end left off); none: left out, and a save without it loads with an empty chronicle. Past its budget, the
   oldest of the spare kinds go first, from the game too (said in the browser's console only); war, rumours and stories never */
const chronTuple=r=>{const t=[r.day,r.m,r.cls||0,r.kind||0,r.ref==null?0:r.ref,r.at||0];while(t.length>2&&!t[t.length-1])t.pop();return t};
const chronRec=([day,m,cls,kind,ref,at])=>{const r={m,day};if(cls)r.cls=cls;if(kind)r.kind=kind;if(ref)r.ref=ref;if(at)r.at=at;return r};
function chronicleSave(){
  const M=journalPrune();if(!M.length)return;
  let ts=M.map(chronTuple),n=JSON.stringify(ts).length;if(n<=CHRONICLE.budget)return ts;
  const spare=r=>CHRONICLE.spare.includes(r.kind||''),keep=[];let cut=0;
  M.forEach((r,i)=>{if(n>CHRONICLE.budget&&spare(r)){n-=JSON.stringify(ts[i]).length+1;cut++}else keep.push(i)});
  if(!cut)return ts;
  G.msgs=keep.map(i=>M[i]);ts=keep.map(i=>ts[i]);
  console.info('Chronicle: '+cut+' of the oldest band and plain messages trimmed to keep its save within '+CHRONICLE.budget+' characters ('+n+').');
  return ts}
Saves.add({key:'chronicle',order:300,defaults:[],save:chronicleSave,load:v=>{G.msgs=v.map(chronRec).filter(journalKeep)}});
// does the world part fit this world (made: the holdings it made, by default the world's in): a record for each holding the world
// made, the rest founded ones of a kind there is (read before anything is put back, so a save that doesn't fit leaves the game as
// it was)
function worldFits(w,made){const names=new Set((made||MADE_HOLDINGS).map(h=>h.name)),own=w.own||[],bad=m=>{throw new Error('This save does not fit this world: '+m+'.')};
  for(const n of names)if(!own.some(o=>o[2]===n))bad('no record of '+n);
  for(const o of own){const x=o[3]||bad('a holding without its state'),k=x.base?x.base.kind:x.kind;
    if(!x.base!==names.has(o[2]))bad(o[2]+(x.base?' is founded twice':' is not in it'));if((x.base||x.kind)&&!HOLDING_TYPES[k])bad('no kind of holding called '+k)}}
// the world part put back, on the world as it first stood (useWorld): every piece in its order (Saves.load), the ships and the
// workers out on the map left to be made again
function worldLoad(w){W.ships=[];W.folk=[];Saves.load(w)}
/* loading a save, as steps behind "Returning to {world}…" (loading.js runSteps): the save read (gunzipped: a step that waits);
   the world it was made in made again first when it is not the one in (another gen or other settings: session.js forgeSteps,
   the generator's stages); then, in one step, the save checked against that world (another checksum: another world version,
   refused; worldFits) and put in (that world, if made again; the world as it first stood, the session, the save's records);
   then the land under you painted. A failure shows the error, with the way back to the saves; one before the putting in leaves
   the game untouched */
function loadGame(slot){
  if(typeof BattleLab!=='undefined'&&BattleLab.active){toast('Exit the battle test before loading.','bad');return}
  if(SAVING&&!LOADING.sync)return SAVING.then(()=>loadGame(slot));
  const h=readSave(slot);if(!h)return showTitle();
  const M=h.world.map,made=worldKey(M)===worldKey(WM)?null:{};let d=null;
  runSteps('Returning to '+worldName(M)+'…',[
    {id:'read',label:'Reading the save',w:40,run:()=>{if(!h.z)return d=h;if(LOADING.sync)throw new Error('A gzipped save cannot be read at once.');return gunzip64(h.z).then(t=>{d=JSON.parse(t)})}},
    ...(made?forgeSteps(M.gen,M.settings,r=>made.r=r):[]),
    {id:'apply',label:'Restoring holdings and parties',w:160,run:()=>{const r=made&&made.r;
      if(d.world.map.sum!==(r?r.map.sum:WM.sum))throw new Error(OTHER_WORLD);worldFits(d.world,r&&r.holdings);if(r)forgeInstall(r);applySave(d)}},
    {id:'paint',label:'Painting the land',w:120,run:()=>{paintView();G.saved={day:d.day,sig:saveSig(saveRecord())}}}],// (as loaded: nothing to lose yet)
    {back:['Back to your saves',()=>showTitle('load')]}).catch(()=>{});// (a failure shows itself)
}
// Schema v3 only. No conversion, old gear/roster aliases or legacy-world migration.
function applySave(d){
  // (the world as it first stood, every system's world reset with it, as a new game's: nothing the last game left on a holding stays)
  resetSession(d.P);useWorld(WM);registerRecruits();const w=d.world;
  G.day=d.day;G.clock=d.clock;G.rankSeen=P.renown>=250?1:0;setSpeed(d.speed);G.paused=false;pauseUI();
  // (the parties made of their kinds again: bands here, your companions' parties, lords, caravans and patrols)
  bandits=d.bandits.map(asParty);for(const id in P.comps)if(P.comps[id].party)asParty(P.comps[id].party);
  worldLoad(w);G.lastTown=townBy(d.last)||null;G.perkOffer=d.perkOffer;
  unstick(P);{const tx=Math.floor(P.x/TILE),ty=Math.floor(P.y/TILE),q=tAt(tx,ty);if(q===T_WATER||q===T_FORD||lotOf(tx,ty))heroAtGate(Spatial.nearestHolding(P.x,P.y))}// (never on water or a lot: world.js gateSpot)
  W.lords.forEach(unstick);bandits.forEach(unstick);W.monsters.forEach(unstick);txpClamp();
  G.mode='world';hidePanel();toast('Welcome back. It is day '+G.day+'.');updateHint();updateHUD(true);
}
// delete a slot's save (the latest, if none is named)
function wipeSave(slot){const s=slot||latestSlot();try{if(s)localStorage.removeItem(slotKey(s))}catch(e){}G.wipeArmed=false;G.resume=null;showTitle('load')}
// the autosave, each day once every system has had its day (core/systems.js)
Systems.add({name:'autosave',order:{day:220},day:()=>{saveGame(true)}});
