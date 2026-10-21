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
  gameSession.reset(savedPlayer);B=null;fieldDone();bandits=[];bbar.hidden=true;BATTLE_MOOD=null;
  const messages=$('#log');if(messages)messages.textContent='';
  setSpeed(G.speed);pauseUI();
}

/* the world a new game or a load wants, made as steps into a world of its own (doc/WORLD_DESIGN.md §5.2, §15.2.1), done(r) given
   the result; forgeInstall puts it in. gen 'ashmark-1': the generator (worldgen.js genWorldSteps: its stages, each its own step);
   'classic-0': today's map (classicWorld, at once); any other: another world version, refused */
function forgeSteps(gen,settings,done){
  if(gen==='classic-0')return [{id:'land',label:'Raising the land',w:80,run:()=>{done(classicWorld())}}];
  if(gen!=='ashmark-1')return [{id:'land',label:'Raising the land',w:80,run:()=>{throw new Error(OTHER_WORLD)}}];
  return genWorldSteps(settings).map((st,i,a)=>i<a.length-1?st:{...st,run:function*(){const r=yield* st.run();done(r);return r}});
}
// today's map as a world of its own, as installClassic makes it but not put in: its holdings, its camps (copies: genClassic
// moves them onto clear ground), the map
function classicWorld(){const camps=CLASSIC_CAMPS.map(c=>({tx:c.tx,ty:c.ty})),m=new WorldMap(224,160,0);m.classic=true;
  genClassic(m,CLASSIC_PLACES,camps);m.sum=m.checksum();return {map:m,holdings:CLASSIC_PLACES,camps,lords:null}}
// a made world put in (worldmap.js installWorld) and laid out as a fresh page lays out its own (main.js), from a fresh session
// (what the last game left never reaches it), then kept as it first stands: every new game in it starts there
function forgeInstall(r){resetSession();installWorld(r);worldFirst()}
// (the world in laid out as it first stands, from where you would start: initWorld, then kept: worldKeep)
function worldFirst(){P.x=(startHolding().tx+.5)*TILE;P.y=(startHolding().ty+2.5)*TILE;initWorld();worldKeep()}
// (a world's key: equal for the same world, made by the same gen from the same settings (worldsettings.js settingsKey))
const worldKey=m=>m?m.gen+' '+settingsKey(m.settings):'';
// (its name: Ashmark for the classic one, else its seed)
const worldName=m=>!m.settings||m.settings.preset==='classic'||!m.settings.seed?'Ashmark':m.settings.seed[0].toUpperCase()+m.settings.seed.slice(1);
// (the World settings' monsters and bandits: how many there are at the start; normal or no settings, as many as ever)
const SPAWN_MUL={calm:.6,few:.6,normal:1,deadly:1.5,many:1.5},spawnMul=k=>WM.settings&&SPAWN_MUL[WM.settings[k]]||1;

/* a new game, as steps behind "Forging the world…" (loading.js runSteps). settings: its world's (worldsettings.js); left out, with
   WORLD.gen the New game screen's choice (ui.js newWorldSettings), else the world in (today's map, or the one a load made again).
   A world other than the one in is made first
   (forgeSteps: the generator's stages), then put in ("Drawing borders": forgeInstall); the one in is used again as it first stood
   (WM.first: useWorld). Then the game put in, in one step (the session, your hero from your race and past, the world as it first
   stood, its sites, beasts and bands), then the land round you painted. A failure before the putting in leaves the last game as
   it was */
function begin(k,settings){
  const b=BGS[k];if(!b)return false;if(settings===undefined&&WORLD.gen)settings=newWorldSettings();
  const want=settings&&{gen:'ashmark-1',settings:normSettings(settings)},made=want&&worldKey(want)!==worldKey(WM)?{}:null;
  runSteps('Forging the world…',[...(made?[...forgeSteps(want.gen,want.settings,r=>made.r=r),{id:'install',label:'Drawing borders',w:150,run:()=>forgeInstall(made.r)}]:[]),
    {id:'world',label:'Peopling the land',w:made?150:4,run:()=>startGame(k,b)},{id:'paint',label:'Painting the first lands',w:made?150:3,run:paintView}],
    {back:['Back to the title',()=>showTitle()]}).catch(()=>{});// (a failure shows itself: its error view)
}
function startGame(k,b){
  resetSession();P.bg=k;P.gold=b.gold;P.troops={...b.troops};P.bonus=b.bonus;
  const rc=RACES[P.race=G.race||'human'];
  for(const a in b.attr)P.attr[a]+=b.attr[a];for(const a in rc.attr)P.attr[a]=Math.max(1,P.attr[a]+rc.attr[a]);
  // every discipline starts at 0; your race and past give a knack: 25% faster learning per point (P.apt)
  for(const src of [b.sk,rc.sk])for(const s in src||{})P.apt[s]=(P.apt[s]||0)+.25*src[s];
  P.origin=originOf(k);P.tree=[P.origin];applyNode(P.origin,1);G.skSel=P.origin;
  P.gear.weapon=gearId(b.weapon||'sword',0);for(const g in b.cargo)invAdd('good',g,b.cargo[g]);if(b.ammo)invAdd('good',b.ammo[0],b.ammo[1]);
  // (a new game on the map: every system's world reset first, onWorld; the game's number for its random streams, core/rng.js,
  // drawn before the wild game and the beasts are placed from them)
  useWorld(WM);initWorld();W.sites=genSites();fogReset();Rng.newGame();initCritters();
  const home=capitalOf(P.race);if(b.rep)P.rep[home.name]=b.rep;
  P.x=(home.tx+.5)*TILE;P.y=(home.ty+2.5)*TILE;G.mode='world';G.lastTown=home;
  for(let i=0,n=Math.round(BANDITS*spawnMul('bandits'));i<n;i++)spawnBandit(true);
  for(let i=0,n=Math.round(MONSTER_START*spawnMul('monsters'));i<n;i++)spawnMonster(true);
  hidePanel();G.msgs=[];log('You ride out of '+home.name+' alone, as '+(rc.n==='Elf'||rc.n==='Orc'?'an ':'a ')+rc.n.toLowerCase()+' '+b.n.toLowerCase()+'. Win fame around here and the locals will follow you.');updateHint();updateHUD(true);
}
// the land you are about to see, painted now, inside the loading steps, not in the first frame: the chunks under the view the
// camera will take round you (render.js drawWorld; worldart.js WorldArt keeps them)
function paintView(){const x0=Math.round(clamp(P.x-VW/2,0,MW*TILE-VW)),y0=Math.round(clamp(P.y-VH/2,0,MH*TILE-VH));
  for(let cy=Math.floor(y0/CHUNK);cy<=Math.floor((y0+VH-1)/CHUNK);cy++)for(let cx=Math.floor(x0/CHUNK);cx<=Math.floor((x0+VW-1)/CHUNK);cx++)WorldArt.chunk(cx,cy)}
