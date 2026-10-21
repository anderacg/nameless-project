'use strict';
/* ---------- random streams: a seeded stream per name (doc/CORE_DESIGN.md, K2; doc/STORY_DESIGN.md §3.7) ----------
   rngOf('story') (and 'road', 'quests', …): a small PRNG of its own (mulberry32, as gfx/mist.js), seeded from the world's
   seed (WM.seedNum; the seed's text hashed for the classic map), the game's number (Rng.game: drawn once from Math.random as
   a new game begins, Rng.newGame, so every game on the same world has its own wild game, beasts and encounters; saved) and its
   name, so adding a draw to one stream never moves another, nor the shared Math.random the simulation and the fingerprints
   run on.
   Each stream's whole state is one 32-bit number (.state): Rng.states() gives every stream's, Rng.restore(states) puts them
   back. Saved with the game's number (the save registry's last piece, 'rng'); a new game starts every stream afresh.
   The streams (the story wave's S4, doc/STORY_DESIGN.md §9): the story and the content that gets tuned often draw from their
   own, so adding a kind or changing a weight never moves the world's Math.random:
     'road'       the encounters on the road (world/road.js, story/happening.js, story/choice.js: the hour's roll, the
                  pity timer, the kind, its spot, its setup, its time, its behaviours, its choices' rolls);
     'letters'    the sealed letter (world/letters.js: its contents, the witness roll);
     'incidents'  the road events (world/events.js, story/incident.js: the day's roll, the kind, the mirage);
     'quests'     the jobs (world/quests.js: the offers, their setups, spotNear, the bounty's band);
     'critters'   the wild game and the herds (world/critters.js: spawning, the herds' placing, the day's regrowth, grazing,
                  the hunt);
     'monsters'   the beasts (world/monsters.js: spawning, levels, wandering, the mythic ones' lairs, scorching and roaming, the
                  loot).
   The news, the threads and the gatherings draw nothing. The world's simulation and the battles (the AI, fights, the economy,
   lords, bands, sites) stay on Math.random.
   Rng.use(name, fn): fn run with Math.random drawing from the stream, for a shared helper a content system calls (makeEnemies,
   randomGear, newChief…), so its draws stay on that system's stream too. */
class RngStream{
  constructor(name,seed){
    this.name=name;
    this.state=seed>>>0;
  }
  // the next number in [0, 1)
  next(){
    let q=this.state=(this.state+0x6d2b79f5)>>>0;
    q=Math.imul(q^q>>>15,1|q);
    q=q+Math.imul(q^q>>>7,61|q)^q;
    return ((q^q>>>14)>>>0)/4294967296;
  }
  // a whole number from a to b, both included
  int(a,b){
    return a+Math.floor(this.next()*(b-a+1));
  }
  // true with chance p
  chance(p){
    return this.next()<p;
  }
  // one of a list (undefined for an empty one)
  pick(list){
    return list[Math.floor(this.next()*list.length)];
  }
  /* one by weight: weighted({a:2, b:1}) gives a key; weighted(list, w) an item of the list, w its weight (a function of the item,
     or the name of its weight field; 'w' by default). Nothing to pick (no weight above 0): null */
  weighted(from,w){
    const items=Array.isArray(from)?from:Object.keys(from);
    const weightOf=Array.isArray(from)?(typeof w==='function'?w:x=>x[w||'w']):k=>from[k];
    let total=0;
    for(const x of items)total+=Math.max(0,weightOf(x)||0);
    if(total<=0)return null;
    let r=this.next()*total;
    for(const x of items){
      r-=Math.max(0,weightOf(x)||0);
      if(r<0)return x;
    }
    return items[items.length-1];
  }
}
const Rng={
  streams:new Map(),
  // the game's number (0 till a game begins: the title's world)
  game:0,
  // the world's seed: a generated world's number, or the classic map's seed text hashed (worldsettings.js seedNum)
  worldSeed(){
    if(typeof WM==='undefined'||!WM)return 0;
    return WM.seedNum||seedNum(String(WM.seed||''));
  },
  // the stream's first state: the world's seed, the game's number and its name, mixed
  seedOf(name){
    return Math.imul(this.worldSeed()^Math.imul(this.game,0x85ebca6b)^seedNum(name),0x9e3779b1)>>>0;
  },
  of(name){
    let s=this.streams.get(name);
    if(!s)this.streams.set(name,s=new RngStream(name,this.seedOf(name)));
    return s;
  },
  // every stream's state, for a save: {name: state}
  states(){
    const o={};
    for(const [name,s] of this.streams)o[name]=s.state;
    return o;
  },
  // the streams as a save left them (those it does not name start afresh)
  restore(states){
    this.streams.clear();
    for(const name in states||{})this.of(name).state=states[name]>>>0;
  },
  // a new world, or a game loaded into it: every stream afresh, no game's number yet
  reset(){
    this.streams.clear();
    this.game=0;
  },
  // a new game (session.js startGame): its number, one draw of Math.random wherever the game's content stands, and every stream
  // from its seed
  newGame(){
    this.reset();
    this.game=Math.floor(Math.random()*4294967296)>>>0;
  },
  // fn's result, Math.random drawing from the named stream while it runs (a shared helper's draws kept on that stream)
  use(name,fn){
    const r0=Math.random,s=this.of(name);
    Math.random=()=>s.next();
    try{
      return fn();
    }finally{
      Math.random=r0;
    }
  },
};
const rngOf=name=>Rng.of(name);
onWorld(()=>Rng.reset());
// (saved last: the game's number and each stream's state, by name. Loaded: the streams as they were; one not in the save starts
// from its seed)
Saves.add({key:'rng',order:270,defaults:null,
  save:()=>{
    const st=Rng.states();
    return {game:Rng.game,on:Object.fromEntries(Object.keys(st).sort().map(n=>[n,st[n]]))};
  },
  load:v=>{
    Rng.restore(v&&v.on);
    Rng.game=v&&v.game>>>0||0;
  }});
