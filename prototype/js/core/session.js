'use strict';
/* A session owns the three live records. Reset them in place so Party prototypes, Character wrappers and services keep valid references. */
class GameSession{
  constructor(runtime,player,world){this.runtime=runtime;this.player=player;this.world=world}
  // Define saved fields as own data: assigning after deletion would invoke Party's inherited troops-list setter on P's counts.
  static replace(record,data){for(const k of Object.keys(record))delete record[k];Object.defineProperties(record,Object.getOwnPropertyDescriptors(data))}
  reset(savedPlayer){
    const race=this.runtime.race,quiet=this.runtime.quietEvents,replace=GameSession.replace;
    replace(this.runtime,makeRuntimeState());if(race)this.runtime.race=race;if(quiet!==undefined)this.runtime.quietEvents=quiet;
    // (a skill the save does not have yet, one added since: from 0)
    this.resetPlayer(savedPlayer);
    // (an older save: its trees' nodes of old gone, its attributes and the level's old choice dropped (no migration: its level's points
    // are spent again on the tree))
    if(savedPlayer){const p=this.player;p.tree=(p.tree||[]).filter(id=>typeof TREE==='undefined'||TREE[id]);for(const k of ['tp','attr','lvUp','lvPick','pts'])delete p[k]}
    replace(this.world,makeWorldState());
  }
  // your hero alone made afresh (a new game; a new person in the same world: world/legacy.js), the runtime and the world kept
  resetPlayer(savedPlayer){
    GameSession.replace(this.player,{...makePlayerState(),...(savedPlayer||{}),...(savedPlayer&&savedPlayer.sk?{sk:{...mkSkills(),...savedPlayer.sk}}:{})});
    if(typeof MARCH_FACING!=='undefined')MARCH_FACING.delete(this.player);if(typeof MARCH_ARMIES!=='undefined')MARCH_ARMIES.delete(this.player);
  }
}
const gameSession=new GameSession(G,P,W);
function resetSession(savedPlayer){
  gameSession.reset(savedPlayer);B=null;fieldDone();bandits=[];bbar.hidden=true;BATTLE_MOOD=null;
  const messages=$('#log');if(messages)messages.textContent='';
  setSpeed(G.speed);pauseUI();
}

/* the world a new game or a load wants, made as steps into a world of its own (doc/WORLD_DESIGN.md §5.2, §15.2.1), done(r) given
   the result; forgeInstall puts it in. gen 'ashmark-1': the generator (worldgen.js genWorldSteps: its stages, each its own step);
   any other (the old hand-made map's 'classic-0' among them): another world version, refused */
function forgeSteps(gen,settings,done){
  if(gen!=='ashmark-1')return [{id:'land',label:'Raising the land',w:80,run:()=>{throw new Error(OTHER_WORLD)}}];
  return genWorldSteps(settings).map((st,i,a)=>i<a.length-1?st:{...st,run:function*(){const r=yield* st.run();done(r);return r}});
}
// a made world put in (worldmap.js installWorld) and laid out as a fresh page lays out its own (main.js), from a fresh session
// (what the last game left never reaches it), then kept as it first stands: every new game in it starts there
function forgeInstall(r){runGen(forgeInstallSteps(r))}
// (the same as steps: loading.js runSteps)
function* forgeInstallSteps(r){resetSession();installWorld(r);yield 0;heroAtGate(startHolding());yield* initWorldSteps();worldKeep()}
// (the world in laid out as it first stands, from where you would start: initWorld, then kept: worldKeep)
function worldFirst(){heroAtGate(startHolding());initWorld();worldKeep()}
// the world let go (the main menu from the Esc menu or the game over: ui.js toTitle): a fresh session, no holdings, camps or map
// in and the map's art dropped, as the game's page opens; the next new game or load makes its world again
function dropWorld(){resetSession();setHoldings([]);setCamps([]);WM=null;tiles=null;climate=null;if(typeof WorldArt!=='undefined')WorldArt.invalidate()}
// (a world's key: equal for the same world, made by the same gen from the same settings (worldsettings.js settingsKey))
const worldKey=m=>m?m.gen+' '+settingsKey(m.settings):'';
// (its name: Ashmark for the classic one, else its seed)
const worldName=m=>!m.settings||m.settings.preset==='classic'||!m.settings.seed?'Ashmark':m.settings.seed[0].toUpperCase()+m.settings.seed.slice(1);
// (the World settings' monsters and bandits: how many there are at the start; normal or no settings, as many as ever)
const SPAWN_MUL={calm:.6,few:.6,normal:1,deadly:1.5,many:1.5},spawnMul=k=>WM.settings&&SPAWN_MUL[WM.settings[k]]||1;

/* a new game, as steps behind "Forging the world…" (loading.js runSteps). settings: its world's (worldsettings.js); left out, the
   New world screen's choice (worldsetup.js newWorldSettings); null, the world in (or the classic seed made now when none is in: the
   game's page opens on the main menu with no world, ui/mainmenu.js).
   k: your past; 'world:<past>' (a past's card on the New game page) opens the New world screen first
   (worldsetup.js worldSetup, D30), whose Forge the world comes back here with its settings.
   A world other than the one in is made first (forgeSteps: the generator's stages; none when the New world screen's full preview
   made it: worldPreviewTake), then put in ("Drawing borders": forgeInstall); the one in is used again as it first stood
   (WM.first: useWorld). Then the game put in, in one step (the session, your hero from your race and past, the world as it first
   stood, its sites, beasts and bands), then the land round you painted. A failure before the putting in leaves the last game as
   it was */
function begin(k,settings){
  if(typeof k==='string'&&k.startsWith('world:'))return worldSetup(k.slice(6));
  const b=BGS[k];if(!b)return false;if(settings===undefined)settings=newWorldSettings();
  const want=settings||!WM?{gen:'ashmark-1',settings:normSettings(settings||classicSettings())}:null,
    made=want&&worldKey(want)!==worldKey(WM)?{r:want.settings&&worldPreviewTake(want.settings)}:null,t0=performance.now();
  runSteps('Forging the world…',[...(made?[...(made.r?[]:forgeSteps(want.gen,want.settings,r=>{made.r=r;if(want.settings)forgeTimed(want.settings,performance.now()-t0)})),{id:'install',label:'Drawing borders',w:150,run:()=>forgeInstallSteps(made.r)}]:[]),
    {id:'holds',label:'Raising the holdings',w:made?150:3,run:holdModelsWarm},// (before your start is chosen: its ways go round them, world/start.js; once, a piece at a time, not at once in it)
    {id:'world',label:'Peopling the land',w:made?150:4,run:()=>startGameSteps(k,b)},{id:'paint',label:'Painting the first lands',w:made?150:3,run:()=>paintViewSteps()},{id:'near',label:'Building the villages',w:made?60:2,run:buildNear},{id:'walls',label:'Raising the walls',w:made?150:3,run:holdShutWarm}],
    {back:['Back to the title',()=>showTitle()]}).catch(()=>{});// (a failure shows itself: its error view)
}
/* (a generated world but the classic one starts as its seed says (doc/WORLD_DESIGN.md §4.4, D30): its first sites, herds, bands and
   beasts drawn with the game's number 0 (core/rng.js: the streams from the world's seed alone) and Math.random the 'start'
   stream's, so one world code starts one world; then the game's number drawn, and what happens in play stays random. The classic
   world as ever: from the game's number) */
const seededStart=()=>!WM.classic,startDraws=(own,fn)=>own?Rng.use('start',fn):fn();
function startGame(k,b){runGen(startGameSteps(k,b))}
// (the same as steps, each part its own: loading.js runSteps; the same draws in the same order)
function* startGameSteps(k,b){
  resetSession();heroFrom(k,b);yield 0;
  // (a new game on the map: every system's world reset first, onWorld; the game's number for its random streams, core/rng.js,
  // drawn before the wild game and the beasts are placed from them)
  // (a generated world but the classic one: its first sites, herds, bands and beasts from its seed, seededStart)
  // (then the realms' outposts: a pure reckoning of the map, no draw, world/outposts.js)
  const own=seededStart();useWorld(WM);for(const v of initWorldSteps())yield v*.5;if(own)Rng.reset();
  startDraws(own,()=>{W.sites=genSites()});W.sites.push(...Outposts.place());Outposts.reserve();fogReset();yield .6;if(!own)Rng.newGame();startDraws(own,initCritters);yield .7;
  const {S,home}=heroHome(k,b),rc=RACES[P.race];yield .85;
  startDraws(own,()=>{for(let i=0,n=Math.round(density(WM).bandits*spawnMul('bandits'));i<n;i++)spawnBandit(true);goblinsStart();
    for(let i=0,n=Math.round(density(WM).monsterStart*spawnMul('monsters'));i<n;i++)spawnMonster(true)});
  if(own)Rng.newGame();Weather.fair(P.x,P.y);// (a clear sky over your start: data/weather.js WEATHER.start)
  // (named: the hero and the band in the first line; the band's name only once you gave it one)
  hidePanel();G.msgs=[];if(S)log(S.line+' '+(P.band?htmlText(P.band)+' is you alone for now: ':'')+'Win fame around here and the locals will follow you.');else log('You ride out of '+home.name+' alone, as '+(P.name?htmlText(P.name)+', ':'')+(rc.n==='Elf'||rc.n==='Orc'?'an ':'a ')+rc.n.toLowerCase()+' '+b.n.toLowerCase()+'. '+
    (P.band?htmlText(P.band)+' is you alone for now: win fame around here and the locals will follow you.':'Win fame around here and the locals will follow you.'));updateHint();updateHUD(true);
}
// your hero from your race and past (a new game, a new person: world/legacy.js): names, face, knacks, proficiencies, origin, gear
function heroFrom(k,b){
  nameStart();P.bg=k;P.gold=b.gold;P.troops={...b.troops};P.bonus=b.bonus;// (the names typed on the New game page, if any: ui/names.js)
  const rc=RACES[P.race=G.race||'human'];if(typeof Faces!=='undefined')Faces.start();// (your face: the New game page's, or one drawn for you: ui/faces.js)
  // every proficiency starts at 0 but your past's, free (PROF.pastPer a point, rounded: 15 at most; sk0); your race and past give a knack: 25% faster learning per point (P.apt)
  for(const src of [b.sk,rc.sk])for(const s in src||{})P.apt[s]=(P.apt[s]||0)+.25*src[s];
  for(const s in b.sk||{})if(P.sk[s])P.sk[s].lv=P.sk0[s]=Math.min(SK_MADE,Math.round(PROF.pastPer*b.sk[s]));
  P.origin=originOf(k);P.tree=[P.origin];// (your past's and your race's bonuses: their nodes, data/tree.js ORIGINS, RACE_NODES)
  // (your past's weapon: none for a nobody, bare hands, combat.js FISTS)
  P.gear.weapon=b.weapon?gearId(b.weapon,0):null;Object.assign(P.gear,b.gear);for(const g in b.cargo)invAdd('good',g,b.cargo[g]);
}
// where your past begins (a hamlet or a small village by its reason, world/start.js StartPlace; none fits, your people's capital):
// your standing there, and you at its gate. Gives {S: the start place, home}
function heroHome(k,b){
  const S=StartPlace.pick(k),home=S?S.t:capitalOf(P.race);P.home=home.name;if(b.rep)P.rep[home.name]=b.rep;
  if(S)P.rep[home.name]=Math.max(P.rep[home.name]||0,HUMBLE_START.rep);// (nothing past what you see revealed: the owner, 2026-11-05)
  heroAtGate(home);G.mode='world';G.lastTown=home;// (in front of its gate, on land: world.js gateSpot)
  return {S,home}
}
// the land you are about to see, painted now, inside the loading steps, not in the first frame: the chunks under the view the
// camera will take round you (render.js drawWorld; worldart.js WorldArt keeps them)
function paintView(){runGen(paintViewSteps(false))}
// (the same as steps for the loading screen (loading.js runSteps: a chunk's painting given back to it a piece at a time, so the bar
// keeps moving; the owner, 2026-11-14, "the game lags when start"), and with ring the chunks round the view too (WorldArt.draw's ring,
// as many as its cap leaves room for), which play would otherwise paint while you first walk (START_WARM)
function* paintViewSteps(ring=START_WARM.ring>0){const x0=Math.round(clamp(P.x-VW/2,0,MW*TILE-VW)),y0=Math.round(clamp(P.y-VH/2,0,MH*TILE-VH)),A=WorldArt,
    c0=Math.floor(x0/CHUNK),r0=Math.floor(y0/CHUNK),c1=Math.floor((x0+VW-1)/CHUNK),r1=Math.floor((y0+VH-1)/CHUNK),list=[];
  for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++)list.push([cx,cy]);
  if(ring){const n=Math.min(START_WARM.ring,Math.max(0,A.cap-list.length)),mx=(c0+c1)/2,my=(r0+r1)/2,R=[];for(let cy=r0-1;cy<=r1+1;cy++)for(let cx=c0-1;cx<=c1+1;cx++)if(cx>=0&&cy>=0&&cx<A.cols&&cy<A.rows&&!(cx>=c0&&cx<=c1&&cy>=r0&&cy<=r1))R.push([Math.hypot(cx-mx,cy-my),cx,cy]);
    R.sort((a,b)=>a[0]-b[0]);for(const [,cx,cy] of R.slice(0,n))list.push([cx,cy])}
  for(let i=0;i<list.length;i++){const [cx,cy]=list[i],k=cy*A.cols+cx;if(A.chunks.has(k))continue;const j=A.start(cx,cy);while(!j.gen.next().done)yield (i+.5)/list.length;A.done(j);yield (i+1)/list.length}}
// (the buildings round where you start, their models made in the loading steps, not as they first come into view; px round you)
const START_WARM={ring:0,near:1200};
function* buildNear(){const T=TOWNS.filter(t=>Math.hypot(t.x-P.x,t.y-P.y)<START_WARM.near),L=[];for(const t of T)for(const l of t.lots||[])if(l.type)L.push([t,l]);
  for(let i=0;i<L.length;i++){lotSprite(L[i][0],L[i][1]);yield (i+1)/L.length}}
