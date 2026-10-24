'use strict';
/* A session owns the three live records. Reset them in place so Party prototypes, Character wrappers and services keep valid references. */
class GameSession{
  constructor(runtime,player,world){this.runtime=runtime;this.player=player;this.world=world}
  reset(savedPlayer){
    const race=this.runtime.race,quiet=this.runtime.quietEvents;
    // Define saved fields as own data: assigning after deletion would invoke Party's inherited troops-list setter on P's counts.
    const replace=(record,data)=>{for(const k of Object.keys(record))delete record[k];Object.defineProperties(record,Object.getOwnPropertyDescriptors(data))};
    replace(this.runtime,makeRuntimeState());if(race)this.runtime.race=race;if(quiet!==undefined)this.runtime.quietEvents=quiet;
    // (a skill the save does not have yet, one added since: from 0)
    replace(this.player,{...makePlayerState(),...(savedPlayer||{}),...(savedPlayer&&savedPlayer.sk?{sk:{...mkSkills(),...savedPlayer.sk}}:{})});
    replace(this.world,makeWorldState());
  }
}
const gameSession=new GameSession(G,P,W);
function resetSession(savedPlayer){
  gameSession.reset(savedPlayer);if(typeof MARCH_FACING!=='undefined')MARCH_FACING.delete(P);if(typeof MARCH_ARMIES!=='undefined')MARCH_ARMIES.delete(P);B=null;fieldDone();bandits=[];bbar.hidden=true;BATTLE_MOOD=null;
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
function forgeInstall(r){resetSession();installWorld(r);worldFirst()}
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
  runSteps('Forging the world…',[...(made?[...(made.r?[]:forgeSteps(want.gen,want.settings,r=>{made.r=r;if(want.settings)forgeTimed(want.settings,performance.now()-t0)})),{id:'install',label:'Drawing borders',w:150,run:()=>forgeInstall(made.r)}]:[]),
    {id:'world',label:'Peopling the land',w:made?150:4,run:()=>startGame(k,b)},{id:'paint',label:'Painting the first lands',w:made?150:3,run:paintView}],
    {back:['Back to the title',()=>showTitle()]}).catch(()=>{});// (a failure shows itself: its error view)
}
/* (a generated world but the classic one starts as its seed says (doc/WORLD_DESIGN.md §4.4, D30): its first sites, herds, bands and
   beasts drawn with the game's number 0 (core/rng.js: the streams from the world's seed alone) and Math.random the 'start'
   stream's, so one world code starts one world; then the game's number drawn, and what happens in play stays random. The classic
   world as ever: from the game's number) */
const seededStart=()=>!WM.classic,startDraws=(own,fn)=>own?Rng.use('start',fn):fn();
function startGame(k,b){
  resetSession();nameStart();P.bg=k;P.gold=b.gold;P.troops={...b.troops};P.bonus=b.bonus;// (the names typed on the New game page, if any: ui/names.js)
  const rc=RACES[P.race=G.race||'human'];
  for(const a in b.attr)P.attr[a]+=b.attr[a];for(const a in rc.attr)P.attr[a]=Math.max(1,P.attr[a]+rc.attr[a]);
  // every discipline starts at 0; your race and past give a knack: 25% faster learning per point (P.apt)
  for(const src of [b.sk,rc.sk])for(const s in src||{})P.apt[s]=(P.apt[s]||0)+.25*src[s];
  P.origin=originOf(k);P.tree=[P.origin];applyNode(P.origin,1);G.skSel=P.origin;
  P.gear.weapon=gearId(b.weapon||'sword',0);Object.assign(P.gear,b.gear);for(const g in b.cargo)invAdd('good',g,b.cargo[g]);
  // (a new game on the map: every system's world reset first, onWorld; the game's number for its random streams, core/rng.js,
  // drawn before the wild game and the beasts are placed from them)
  // (a generated world but the classic one: its first sites, herds, bands and beasts from its seed, seededStart)
  const own=seededStart();useWorld(WM);initWorld();if(own)Rng.reset();
  startDraws(own,()=>{W.sites=genSites()});fogReset();if(!own)Rng.newGame();startDraws(own,initCritters);
  const home=capitalOf(P.race);if(b.rep)P.rep[home.name]=b.rep;
  heroAtGate(home);G.mode='world';G.lastTown=home;// (in front of its gate, on land: world.js gateSpot)
  startDraws(own,()=>{for(let i=0,n=Math.round(density(WM).bandits*spawnMul('bandits'));i<n;i++)spawnBandit(true);
    for(let i=0,n=Math.round(density(WM).monsterStart*spawnMul('monsters'));i<n;i++)spawnMonster(true)});
  if(own)Rng.newGame();
  // (named: the hero and the band in the first line; the band's name only once you gave it one)
  hidePanel();G.msgs=[];log('You ride out of '+home.name+' alone, as '+(P.name?htmlText(P.name)+', ':'')+(rc.n==='Elf'||rc.n==='Orc'?'an ':'a ')+rc.n.toLowerCase()+' '+b.n.toLowerCase()+'. '+
    (P.band?htmlText(P.band)+' is you alone for now: win fame around here and the locals will follow you.':'Win fame around here and the locals will follow you.'));updateHint();updateHUD(true);
}
// the land you are about to see, painted now, inside the loading steps, not in the first frame: the chunks under the view the
// camera will take round you (render.js drawWorld; worldart.js WorldArt keeps them)
function paintView(){const x0=Math.round(clamp(P.x-VW/2,0,MW*TILE-VW)),y0=Math.round(clamp(P.y-VH/2,0,MH*TILE-VH));
  for(let cy=Math.floor(y0/CHUNK);cy<=Math.floor((y0+VH-1)/CHUNK);cy++)for(let cx=Math.floor(x0/CHUNK);cx<=Math.floor((x0+VW-1)/CHUNK);cx++)WorldArt.chunk(cx,cy)}
