'use strict';
/* ---------- random streams: a seeded stream per name (doc/CORE_DESIGN.md, K2; doc/STORY_DESIGN.md §3.7) ----------
   rngOf('story') (and 'road', 'quests', …): a small PRNG of its own (mulberry32, as gfx/mist.js), seeded from the world's
   seed (WM.seedNum; the seed's text hashed for the classic map) and its name, so adding a draw to one stream never moves
   another, nor the shared Math.random the simulation and the fingerprints run on.
   Each stream's whole state is one 32-bit number (.state): Rng.states() gives every stream's, Rng.restore(states) puts them
   back. Infrastructure only for now: no one draws from it yet (the story wave's S4 moves the story systems onto it) and it is
   not saved yet (the save registry takes Rng.states() then); a new world starts every stream afresh. */
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
  // the world's seed: a generated world's number, or the classic map's seed text hashed (worldsettings.js seedNum)
  worldSeed(){
    if(typeof WM==='undefined'||!WM)return 0;
    return WM.seedNum||seedNum(String(WM.seed||''));
  },
  // the stream's first state: the world's seed and its name, mixed
  seedOf(name){
    return Math.imul(this.worldSeed()^seedNum(name),0x9e3779b1)>>>0;
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
  // a new world: every stream starts afresh from its seed
  reset(){
    this.streams.clear();
  },
};
const rngOf=name=>Rng.of(name);
onWorld(()=>Rng.reset());
