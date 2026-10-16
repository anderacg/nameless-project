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
  gameSession.reset(savedPlayer);B=null;bandits=[];bbar.hidden=true;BATTLE_MOOD=null;
  const messages=$('#log');if(messages)messages.textContent='';
  setSpeed(G.speed);pauseUI();
}

function begin(k){
  const b=BGS[k];if(!b)return false;resetSession();P.bg=k;P.gold=b.gold;P.troops={...b.troops};P.bonus=b.bonus;
  const rc=RACES[P.race=G.race||'human'];
  for(const a in b.attr)P.attr[a]+=b.attr[a];for(const a in rc.attr)P.attr[a]=Math.max(1,P.attr[a]+rc.attr[a]);
  // every discipline starts at 0; your race and past give a knack: 25% faster learning per point (P.apt)
  for(const src of [b.sk,rc.sk])for(const s in src||{})P.apt[s]=(P.apt[s]||0)+.25*src[s];
  P.origin=originOf(k);P.tree=[P.origin];applyNode(P.origin,1);G.skSel=P.origin;
  P.gear.weapon=gearId(b.weapon||'sword',0);for(const g in b.cargo)invAdd('good',g,b.cargo[g]);if(b.ammo)invAdd('good',b.ammo[0],b.ammo[1]);
  initWorld();W.sites=genSites();fogReset();initCritters();
  const home=townBy(START_TOWN[P.race])||TOWNS[0];if(b.rep)P.rep[home.name]=b.rep;
  P.x=(home.tx+.5)*TILE;P.y=(home.ty+2.5)*TILE;G.mode='world';G.lastTown=home;
  for(let i=0;i<BANDITS;i++)spawnBandit(true);
  for(let i=0;i<MONSTER_START;i++)spawnMonster(true);
  hidePanel();G.msgs=[];log('You ride out of '+home.name+' alone, as '+(rc.n==='Elf'||rc.n==='Orc'?'an ':'a ')+rc.n.toLowerCase()+' '+b.n.toLowerCase()+'. Win fame around here and the locals will follow you.');updateHint();updateHUD(true);
}
