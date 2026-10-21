'use strict';
/* ---------- the story context (doc/STORY_DESIGN.md §3.2; the story wave, S0) ----------
   What a happening's conditions read, in one place: where you are, when it is, who you are, and the weather.
   - storyCtx() (Story.ctx) is that snapshot for you. Inside a frame of the road (Story.frame: the encounters' frame,
     world/road.js updateRoad) it is made once and shared by every reader; outside one (a page, a test, the wiki) each
     call makes a fresh one, so nothing ever reads a stale one.
   - Where (the tile, its terrain and climate, whose land, the holdings near, a road or the wild, cover) is worked out once,
     when first read (StoryPlace, story/storyplace.js, which StoryContext extends). When (the Clock) and who (your band, renown, honour, skills: the accessors) are read live: they are
     cheap, and a choice or a wait may change them.
   - Story.at(tx, ty): the same where-part for any tile (at its middle), for the spot rules (road.js ENC_ON).
   Nothing here draws Math.random or changes anything: it only reads. A new fact (the season) is one getter here. */
class StoryContext extends StoryPlace{
  constructor(){
    super(P.x,P.y);
  }
  // ---- where (you)
  // the holding near enough for the law to count (events.js nearHold), or null; the nearest of all, and how far it is
  get nearHold(){
    return this.once('nearHold',()=>nearHold());
  }
  get nearest(){
    return this.once('nearest',()=>Spatial.nearestHolding(this.x,this.y));
  }
  get nearestDist(){
    const t=this.nearest;
    return t?Math.hypot(t.x-this.x,t.y-this.y):Infinity;
  }
  // ---- when (the Clock)
  get day(){
    return Clock.day;
  }
  get hour(){
    return Clock.hour;
  }
  get isDay(){
    return Clock.isDay;
  }
  get isNight(){
    return Clock.isNight;
  }
  // how dark it is, 0 by day (render.js darkness)
  get dark(){
    return darkness();
  }
  // ---- who
  get troops(){
    return troopCount();
  }
  get size(){
    return partySize();
  }
  get cap(){
    return partyCap();
  }
  get power(){
    return partyPower();
  }
  get renown(){
    return P.renown;
  }
  get gold(){
    return P.gold;
  }
  get morale(){
    return P.morale;
  }
  get food(){
    return foodN();
  }
  get mounted(){
    return !!P.gear.mount;
  }
  skill(k){
    return skill(k);
  }
  attr(k){
    return P.attr[k];
  }
  honor(f){
    return honorWith(f);
  }
  rep(name){
    return repAt(name);
  }
  // ---- the weather (gfx/ambient.js ambWeather: frost means snow)
  get weather(){
    return this.once('weather',()=>ambWeather());
  }
}
const Story={
  inFrame:false,
  live:null,
  // a frame: one context for every reader till it ends (frames inside it share it)
  frame(fn){
    if(this.inFrame)return fn();
    this.inFrame=true;
    this.live=null;
    try{
      return fn();
    }finally{
      this.inFrame=false;
      this.live=null;
    }
  },
  // your context now: the frame's, or a fresh one
  ctx(){
    if(!this.inFrame)return new StoryContext();
    return this.live||(this.live=new StoryContext());
  },
  // a tile's where-part (at its middle)
  at(tx,ty){
    return new StoryPlace((tx+.5)*TILE,(ty+.5)*TILE);
  },
};
const storyCtx=()=>Story.ctx();
