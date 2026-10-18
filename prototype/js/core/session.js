'use strict';
/* A session owns the three live records. Reset them in place so Party prototypes, Character wrappers and services keep valid references. */
class GameSession{
  constructor(runtime,player,world){this.runtime=runtime;this.player=player;this.world=world}
  reset(savedPlayer){
    const race=this.runtime.race,quiet=this.runtime.quietEvents;
    // Define saved fields as own data: assigning after deletion would invoke Party's inherited troops-list setter on P's counts.
    const replace=(record,data)=>{for(const k of Object.keys(record))delete record[k];Object.defineProperties(record,Object.getOwnPropertyDescriptors(data))};
    replace(this.runtime,makeRuntimeState());if(race)this.runtime.race=race;if(quiet!==undefined)this.runtime.quietEvents=quiet;
    replace(this.player,{...makePlayerState(),...(savedPlayer||{})});
    replace(this.world,makeWorldState());
  }
}
const gameSession=new GameSession(G,P,W);
function resetSession(savedPlayer){
  gameSession.reset(savedPlayer);B=null;fieldDone();bandits=[];bbar.hidden=true;BATTLE_MOOD=null;
  const messages=$('#log');if(messages)messages.textContent='';
  setSpeed(G.speed);pauseUI();
}

/* a new game, as steps behind "Forging the world…" (loading.js runSteps): the game put in, in one step (the session, your hero
   from your race and past, the world as it first stood, its sites, beasts and bands), then the land round you painted. (A
   generated world's stages will come before it, made into a world of their own: a failure leaves the last game as it was) */
function begin(k){
  const b=BGS[k];if(!b)return false;
  runSteps('Forging the world…',[{id:'world',label:'Founding holdings',w:4,run:()=>startGame(k,b)},{id:'paint',label:'Painting the first lands',w:3,run:paintView}],
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
  // (a new game on the map: every system's world reset first, onWorld)
  useWorld(WM);initWorld();W.sites=genSites();fogReset();initCritters();
  const home=capitalOf(P.race);if(b.rep)P.rep[home.name]=b.rep;
  P.x=(home.tx+.5)*TILE;P.y=(home.ty+2.5)*TILE;G.mode='world';G.lastTown=home;
  for(let i=0;i<BANDITS;i++)spawnBandit(true);
  for(let i=0;i<MONSTER_START;i++)spawnMonster(true);
  hidePanel();G.msgs=[];log('You ride out of '+home.name+' alone, as '+(rc.n==='Elf'||rc.n==='Orc'?'an ':'a ')+rc.n.toLowerCase()+' '+b.n.toLowerCase()+'. Win fame around here and the locals will follow you.');updateHint();updateHUD(true);
}
// the land you are about to see, painted now, inside the loading steps, not in the first frame: the chunks under the view the
// camera will take round you (render.js drawWorld; worldart.js WorldArt keeps them)
function paintView(){const x0=Math.round(clamp(P.x-VW/2,0,MW*TILE-VW)),y0=Math.round(clamp(P.y-VH/2,0,MH*TILE-VH));
  for(let cy=Math.floor(y0/CHUNK);cy<=Math.floor((y0+VH-1)/CHUNK);cy++)for(let cx=Math.floor(x0/CHUNK);cx<=Math.floor((x0+VW-1)/CHUNK);cx++)WorldArt.chunk(cx,cy)}
