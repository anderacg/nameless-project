'use strict';
// (split from world/parties.js: what every thing on the map shares (WorldObject), making plain data one of a class in place
// (asClass), how often each thinks by its distance (level of detail) and its walk cycle; parties.js builds on it)
/* ---------- world objects: whatever is on the map to be seen, clicked and met says for itself what it is (mapKind), whether you
   see it (inView), where a click answers on it (pick: world.js pickAt hands it the ways to answer, at), how you meet it (meet),
   what the pointer shows over it (tip), how it is drawn (draw: onto the frame's list, render.js drawWorld) and dotted on the
   minimap (mapDot: [colour, size] or none). here(): still on the map, in its kind's list; chaseable(): still worth walking to
   (a chase after one gone ends); meetsAnyTime: met as soon as you reach it, even just after a fight (G.encCool). Behaviour
   only: saves keep plain data, made one of its kind again on loading or when the map next asks (asClass; world.js
   asWorldObject, worldObjects). The parties and caravans (here), holdings (holding.js) and estates (estates.js), sites, beasts (monsters.js),
   herds (critters.js), refugees, workers (folk.js) and ships are world objects. ---------- */
// (in sight: within your sight, or nearer where it hides in woods or hills)
const spotted=(o,V)=>Math.hypot(o.x-P.x,o.y-P.y)<V*(hiddenAt(o.x,o.y)?.45:1);
class WorldObject{
  get mapKind(){return null}
  here(){return true}
  fromYou(){return Math.hypot(this.x-P.x,this.y-P.y)}
  inView(V){return spotted(this,V)}
  pick(at){}
  meet(){}
  chaseable(){return !this.dead}
  get meetsAnyTime(){return false}
  tip(){return ''}
  draw(ents,cam,V){}
  mapDot(V){return null}
  // how often it thinks (lodTick), and how far it has walked (walk, world.js): both kept aside, never saved
  get tier(){return tierOf(this)}
  get wd(){return WALKED.get(this)||0}
}
// plain data made one of a class in place (new, from a save or a test): the same object, its fields as they were
const asClass=C=>o=>o&&!(o instanceof C)?Object.setPrototypeOf(o,C.prototype):o;
/* level of detail (doc/WORLD_DESIGN.md §3.5): how often each thing on the map thinks, by its tier, how far it is from you (set
   every .every s of real time by lodTick, plain data too). Near: every frame. Mid: every 4th frame, with 4x d. Far: its kind's
   farStep if it has one (later: on along its route by time), else as near. near, mid: the tiers' reach (px); unbounded for now,
   so everything is near and thinks every frame, as it always did. (n: frames so far; t: till the next sorting) */
const WORLD_LOD={near:Infinity,mid:Infinity,every:.5,t:0,n:0},TIERS=new WeakMap();
const tierOf=o=>TIERS.get(o)||'near';
function lodTick(dt){const L=WORLD_LOD;L.n++;if((L.t-=dt)>0)return;L.t=L.every;
  for(const os of [W.parties,W.caravans,W.monsters,W.critters,W.ships,W.refugees,W.folk])for(const o of os||[]){const r=Math.hypot(o.x-P.x,o.y-P.y);TIERS.set(o,r<=L.near?'near':r<=L.mid?'mid':'far')}}
// one thing's moment by its tier, from its kind's thinker (a Brain, brains.js; BEAST_MIND, HERD_MIND, SHIP_MIND): think(o, d, x)
// near; mid, on every 4th frame (k, its place in its list, spreads them over the four) with 4x d; far, farStep(o, d, x) if the
// kind has one. True when it opened an encounter
function lodThink(by,o,k,d,x){const t=tierOf(o);return t==='near'?by.think(o,d,x):t==='mid'?(WORLD_LOD.n+k)%4===0&&by.think(o,4*d,x):(by.farStep||by.think).call(by,o,d,x)}
// each of a list in turn, by its tier; true as soon as one opens an encounter (the rest wait). by: their thinker, else each one's brain
function lodEach(list,by,d,x){let k=0;for(const o of list)if(lodThink(by||o.brain,o,k++,d,x))return true;return false}
/* walk cycles by distance (doc §2.2 R13): walk (world.js) adds up how far each thing goes; a figure's frame is frameOf(o, stride,
   n): a frame every stride px, n frames a cycle (frame 0 standing: the caller's). The figures still step by the clock: they
   take this with the new figures */
const WALKED=new WeakMap();
const frameOf=(o,stride,n=2)=>Math.floor((WALKED.get(o)||0)/stride)%n;
