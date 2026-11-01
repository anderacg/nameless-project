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
// (in sight: within your sight (any of your men's: fog.js Sight), or nearer one of them where it hides in woods or hills)
const spotted=(o,V)=>!Waylay.hidden(o)&&yourSight(V).sees(o.x,o.y,hiddenAt(o.x,o.y)?.45:1);
// Travel perception uses the brains' distance/cover thresholds and each observer's suspicion.
function travelDetection(o){
  if(!o||o===P||B||P.stay||o.dead||o.gone||o.inside||o.fight||!Number.isFinite(o.x)||!Number.isFinite(o.y))return null;
  const k=o.mapKind,cover=hiddenAt(P.x,P.y);let range=0,danger=false;
  if(k==='lord'){const relief=hostileTo(o.fac)&&!lordSpares(o)&&o.state==='relieve'&&P.siege?.town===o.tgt;range=o.brain.sight(WORLD_SCALE.sight.lord)*(relief?2:1);danger=hostileTo(o.fac)&&!lordSpares(o)}
  else if(k==='band'){range=o.brain.sight(WORLD_SCALE.sight.band);danger=true}
  else if(k==='patrol'){range=o.brain.sight(PATROL.see);danger=hostileTo(o.fac)||!!crimeAt(townBy(o.home))}
  else if(k==='monster'){const m=MONSTERS[o.id];range=(m.mythic?.see||WORLD_SCALE.sight.monster)*(cover?.55:1);danger=!!(m.aggro||m.mythic)}
  else if(k==='caravan'){if(o.mine)return null;range=o.brain.sight(WORLD_SCALE.sight.caravan);danger=hostileTo(o.fac)}
  else if(k==='refugee')range=WORLD_SCALE.sight.refugee*(cover?.55:1);
  else if(k==='critter'){if(!o.wild)return null;range=CRITTERS[o.id].shy*(cover?.6:1)}
  else if(k==='worker'){if(!folkSeen(o))return null;const t=townBy(o.home);if(!t||!Timed.of(t).has('fear'))return null;range=WORLD_SCALE.ai.folkFear;danger=true}
  if(!(range>0))return null;const factor=k==='critter'?.6:k==='worker'?1:.55,base=range/(cover?factor:1),rows=TravelAwareness.scan(o,base,factor),visible=rows.filter(r=>r.within&&r.q>=1),nearest=(visible.length?visible:rows).slice().sort((a,b)=>a.distance-b.distance)[0],within=rows.some(r=>r.within),exposure=TravelAwareness.level(o),sees=visible.length>0;
  return{o,range:nearest.range+Math.min(12,nearest.group.extent),distance:nearest.distance,within,sees,exposure,danger,rows,target:visible.length?nearest.group:null};
}
function travelDetectionText(o){const d=travelDetection(o),wait=o.waylay?.seen?'Lying in wait in the trees · ':'';return wait+(d?d.sees?'Has detected your army':TravelSearch.of(o)?'Searching where it last saw your army':d.exposure>0?(d.within?'Suspicious of your army':'Losing suspicion')+' ('+Math.round(d.exposure*100)+'%)':'Has not detected your army':'')}
const TRAVEL_AWARE={open:2,forest:4,fade:3,close:3,contact:8};
// (who may notice you: TravelAwareness.observers)
const travelObservers=()=>TravelAwareness.observers();
class TravelAwareness{
  static states=new WeakMap();
  static records=new WeakMap();
  static live=new Set();// (those holding a suspicion or a memory of you: asked wherever they are, until it is gone)
  static near=new Set();static box=[];// (observers' scratch)
  // the farthest anyone notices a group of yours: the longest sight of any kind (a lord's doubled to relieve a siege), as cover
  // gives it (/.55), with a group's size and extent (travelDetection, scan)
  static reach(){return this.far??(this.far=this.farthest())}
  static farthest(){const S=WORLD_SCALE.sight;let m=Math.max(S.lord*2,S.band,S.caravan,S.refugee,S.monster,PATROL.see,WORLD_SCALE.ai.folkFear);
    for(const k in MONSTERS)m=Math.max(m,MONSTERS[k].mythic?.see||0);for(const k in CRITTERS)m=Math.max(m,CRITTERS[k].shy||0);return m/.55*(1+TRAVEL_GROUPS.maxSize)+12}
  /* the observers worth asking (each frame; the set is kept and filled again by the next call): those filed in the chunks within
     reach of one of your groups (WORLD_LOD.grid, with its lag), those still holding a suspicion (live), and the few that come and
     go round you (workers, refugees); in the old way everyone on the map, though none further could see you or had aught to fade.
     One come into the world since the grid was filed is asked from the next filing (at most WORLD_LOD.every s) */
  static observers(){const out=this.near,L=WORLD_LOD,R=this.reach()+L.lag,b=this.box;out.clear();
    if(!L.on){const ls=lodLists();ls.pop();for(const os of ls)for(const o of os)out.add(o);return out}
    const grid=lodGrid();for(const g of this.snapshot||TravelGroups.groups()){const x=g.id==='hero'?P.x:g.x,y=g.id==='hero'?P.y:g.y;b.length=0;grid.box(x-R,y-R,x+R,y+R,b);for(const o of b)if(grid.tag.get(o)!==LOD_TAG.ship)out.add(o)}
    // (one still suspicious but gone from its list since (a beast slain in an ambush, a band beaten): forgotten, its eye with it)
    for(const o of this.live)if(grid.has(o))out.add(o);else this.live.delete(o);for(const o of W.folk)out.add(asWorker(o));for(const o of W.refugees)out.add(asRefugees(o));return out}
  static snapshot=null;
  static time=0;
  static gen=0;// (each reset: what is drawn from it is worked out afresh, render.js travelDetectionState)
  static level(o){return this.states.get(o)||0}
  static rows(o){let r=this.records.get(o);if(!r){r=new Map();this.records.set(o,r)}return r}
  static scan(o,base,factor){return (this.snapshot||TravelGroups.groups()).map(row=>{const group=row.id==='hero'?{...row,x:P.x,y:P.y,cover:!!hiddenAt(P.x,P.y),moving:P.tx!=null}:row,range=base*(group.cover?factor:1)*(1+Math.min(TRAVEL_GROUPS.maxSize,Math.sqrt(Math.max(0,group.count-1))*TRAVEL_GROUPS.size)),distance=Math.max(0,Math.hypot(o.x-group.x,o.y-group.y)-Math.min(12,group.extent)),r=this.records.get(o)?.get(group.id);return{group,range,distance,within:distance<range,q:r?.q||0}})}
  static notice(o,id='hero'){const group=(this.snapshot||TravelGroups.groups()).find(g=>g.id===id);if(group)this.rows(o).set(id,{q:1,last:this.time,power:group.power});this.states.set(o,1);this.live.add(o)}
  static sees(o){return !!travelDetection(o)?.sees}
  static target(o){return travelDetection(o)?.target||null}
  static power(o){if(!WORLD_BATTLE.on)return partyPower();return [...(this.records.get(o)?.values()||[])].reduce((n,r)=>n+(r.last!=null&&this.time-r.last<=TRAVEL_GROUPS.memory?r.power:0),0)}
  static reset(){this.gen++;this.states=new WeakMap();this.records=new WeakMap();this.live.clear();this.snapshot=null;this.time=0;TravelSearch.reset()}
  static step(rt){
    if(G.paused||G.modal||G.mode!=='world'||B)return;if(P.stay){this.reset();return}const dt=rt*G.speed;this.time+=dt;this.snapshot=TravelGroups.groups();Waylay.sight(dt);
    for(const o of this.observers()){const d=travelDetection(o);if(!d){this.states.delete(o);this.records.delete(o);this.live.delete(o);continue}const records=this.rows(o),ids=new Set(d.rows.map(r=>r.group.id));let exposure=0;
      for(const v of d.rows){const g=v.group,r=records.get(g.id)||{q:0,last:null,power:0};
        if(v.within){const speed=(v.distance<v.range*.35?TRAVEL_AWARE.close:1)*(g.moving?TRAVEL_GROUPS.moving:1);r.q=v.distance<Math.min(TRAVEL_AWARE.contact,v.range*.15)?1:Math.min(1,r.q+dt*speed/(g.cover?TRAVEL_AWARE.forest:TRAVEL_AWARE.open));if(r.q>=1){r.last=this.time;r.power=g.power}}
        else r.q=Math.max(0,r.q-dt/TRAVEL_AWARE.fade);records.set(g.id,r);exposure=Math.max(exposure,r.q);
      }
      for(const [id,r] of records)if(!ids.has(id)||r.q===0&&(r.last==null||this.time-r.last>TRAVEL_GROUPS.memory))records.delete(id);
      if(exposure>0)this.states.set(o,exposure);else this.states.delete(o);
      if(exposure>0||records.size)this.live.add(o);else this.live.delete(o);
    }
  }
}
/* a hunter that loses sight of you (engage.js stanceMove) goes to where it last saw you (pace: of its hunting step), looks about
   there for look s, and turns back to its own business if it finds nothing: max s at most, or at once if it cannot get there.
   Seen again on the way, it hunts you as before. Its mark shows on the map (render.js drawTravelDetection) */
const TRAVEL_SEARCH={look:4,max:30,reach:8,pace:.9};
class TravelSearch{
  static marks=new WeakMap();
  static seen(o){this.marks.set(o,{x:P.x,y:P.y,at:TravelAwareness.time,arrived:null})}
  static of(o){return this.marks.get(o)||null}
  static reset(){this.marks=new WeakMap()}
  static step(o,sp){const m=this.of(o);if(!m)return false;const X=TRAVEL_SEARCH,T=TravelAwareness.time,dx=m.x-o.x,dy=m.y-o.y,d=Math.hypot(dx,dy);
    if(T-m.at>X.max||m.arrived!=null&&T-m.arrived>X.look){this.marks.delete(o);return false}
    if(d>X.reach){if(walk(o,dx,dy,Math.min(d,sp*X.pace)))return true;this.marks.delete(o);return false}
    if(m.arrived==null)m.arrived=T;walk(o,Math.cos(T*1.7),Math.sin(T*1.7),sp*.3);return true}
}
onWorld(()=>TravelAwareness.reset());
Systems.add({name:'travel awareness',order:{frame:6},frame:(d,dt)=>TravelAwareness.step(dt)});
class WorldObject{
  get mapKind(){return null}
  here(){return true}
  fromYou(){return Math.hypot(this.x-P.x,this.y-P.y)}
  inView(V){return spotted(this,V)}
  pick(at){}
  meet(){}
  chaseable(){return !this.dead}
  get meetsAnyTime(){return false}
  // how far it reaches from its point toward your army, its footprint's (march.js ringReach, boxReach): a thing of no footprint, REACH
  reachRadius(){return REACH}
  tip(){return ''}
  draw(ents,cam,V){}
  mapDot(V){return null}
  // how often it thinks (lodTick), and how far it has walked (walk, world.js): both kept aside, never saved
  get tier(){return tierOf(this)}
  get wd(){return WALKED.get(this)||0}
}
// plain data made one of a class in place (new, from a save or a test): the same object, its fields as they were
const asClass=C=>o=>o&&!(o instanceof C)?Object.setPrototypeOf(o,C.prototype):o;
/* a record packed for a save (the world's beasts and herds, many on a big world: doc/WORLD_DESIGN.md §3.8): the values
   of keys in order (a number to its tenth, none null), then the record's other keys as one object, if it has any, but those
   in skip (kept for itself, made again); unpackRec gives the record back (packs: with a world in) */
const packs=()=>!!WM;
// (a record's numbers to a tenth, the rest as they are: a band's, which keeps its keys)
const tenths=o=>{const r={};for(const k in o){const v=o[k];r[k]=typeof v==='number'?Math.round(v*10)/10:v}return r};
function packRec(o,keys,skip){const a=keys.map(k=>{const v=o[k];return typeof v==='number'?Math.round(v*10)/10:v===undefined?null:v}),rest={};let n=0;
  for(const k in o)if(!keys.includes(k)&&!skip.includes(k)){rest[k]=o[k];n++}if(n)a.push(rest);return a}
function unpackRec(a,keys,o={}){keys.forEach((k,i)=>{if(a[i]!==null)o[k]=a[i]});return a.length>keys.length?Object.assign(o,a[keys.length]):o}
/* level of detail (doc/WORLD_DESIGN.md §3.5): how often each thing on the map thinks, by its tier, the ring of chunks it stands
   in round yours (core/spatial.js ChunkGrid, chunk px a side: the painted map's), sorted every .every s of real time by lodTick
   (plain data too), which files every mover in grid as it goes. Near (near rings: you see them): every frame. Mid (to mid rings):
   every midEvery-th frame, with that many times d. Far: its kind's farStep (beasts and herds hold where they are: they wander
   only near you), else as mid (a party's route by time waits on a travel that spends a whole step: router.js). on false: every
   one near, every frame, as before the tiers (the tests). lag: px the grid may be behind (what moved since it was filed): asked
   with that margin. (n: frames so far in this world or since this load, so the same game thinks on the same frames; t: till the
   next sorting, 0 with a new world; cx, cy: your chunk then) */
const WORLD_LOD={on:true,chunk:512,near:1,mid:4,midEvery:4,every:.5,lag:512,t:0,n:0,cx:0,cy:0,grid:null},TIERS=new WeakMap();
WORLD_LOD.grid=new ChunkGrid(WORLD_LOD.chunk);
// (a world goes in, or a game is loaded: its movers are other objects, filed afresh when next asked, the frames counted afresh; never saved)
const lodForget=()=>{WORLD_LOD.t=0;WORLD_LOD.n=0;WORLD_LOD.grid.file([]);TravelAwareness.far=null};
onWorld(lodForget);Saves.add({key:'lod',order:995,settle:lodForget});
const tierOf=o=>TIERS.get(o)||'near';
// (what lodTick files and sorts, in the order the parties, the threats and the prey are asked in (parties.js allParties, critters.js
// WildlifeThreats, monsters.js beastPrey), each made one of its class; LOD_TAG: each list's tag in the grid)
const LOD_TAG={lord:0,band:1,patrol:2,cparty:3,caravan:4,refugee:5,monster:6,critter:7,worker:8,ship:9};
const lodLists=()=>{for(const m of W.monsters)asMonster(m);for(const c of W.critters)asHerd(c);for(const r of W.refugees)asRefugees(r);for(const f of W.folk)asWorker(f);
  return [W.lords,bandits,W.patrols,cparties(),W.caravans,W.refugees,W.monsters,W.critters,W.folk,W.ships||[]]};
function lodTick(dt){const L=WORLD_LOD;L.n++;if((L.t-=dt)>0)return;L.t=L.every;lodFile()}
// (every mover filed in the grid afresh and its tier set; also as soon as one asks of a grid not yet filed for this world)
function lodFile(){const L=WORLD_LOD,lists=lodLists(),G=L.grid.file(lists);L.cx=G.at(P.x);L.cy=G.at(P.y);
  for(const os of lists)for(const o of os){const r=Math.max(Math.abs(G.at(o.x)-L.cx),Math.abs(G.at(o.y)-L.cy));TIERS.set(o,!L.on||r<=L.near?'near':r<=L.mid?'mid':'far')}}
// the grid, filed afresh first if it never was for this world, or if one has left a list since it was last asked (a band beaten,
// a beast slain: they leave without a mark, and must not be met or fled from as if there)
const LOD_SEEN=[];
function lodGrid(){const L=WORLD_LOD,ls=[bandits,W.lords,W.patrols,W.caravans,W.refugees,W.monsters,W.critters,W.folk,W.ships||[]];let fewer=!L.grid.n;
  for(let i=0;i<ls.length;i++){if(ls[i].length<(LOD_SEEN[i]??0))fewer=true;LOD_SEEN[i]=ls[i].length}
  if(fewer)lodFile();return L.grid}
// the rect (px) where things think (the mid rings round your chunk), pad px wider and the grid's lag: null while the tiers are off
// (everywhere); lodIn: (x, y) within it
function lodBox(pad){const L=WORLD_LOD;if(!L.on||!(L.mid<1e6))return null;const c=L.chunk,m=pad+L.lag;return[(L.cx-L.mid)*c-m,(L.cy-L.mid)*c-m,(L.cx+L.mid+1)*c+m,(L.cy+L.mid+1)*c+m]}
const lodIn=(b,x,y)=>!b||x>=b[0]&&y>=b[1]&&x<=b[2]&&y<=b[3];
// one thing's moment by its tier, from its kind's thinker (a Brain, brains.js; BEAST_MIND, HERD_MIND, SHIP_MIND): think(o, d, x)
// near; mid, on every midEvery-th frame (k, its place in its list, spreads them out) with that many times d; far, farStep(o, d, x,
// k) if the kind has one, else as mid. True when it opened an encounter
const lodMid=(by,o,k,d,x)=>{const n=WORLD_LOD.midEvery;return (WORLD_LOD.n+k)%n===0&&by.think(o,n*d,x)};
function lodThink(by,o,k,d,x){const t=tierOf(o);return t==='near'?by.think(o,d,x):t==='far'&&by.farStep?by.farStep(o,d,x,k):lodMid(by,o,k,d,x)}
// each of a list in turn, by its tier; true as soon as one opens an encounter (the rest wait). by: their thinker, else each one's brain
function lodEach(list,by,d,x){let k=0;for(const o of list)if(lodThink(by||o.brain,o,k++,d,x))return true;return false}
/* walk cycles by distance (doc §2.2 R13): walk (world.js) adds up how far each thing goes; a figure's frame is frameOf(o, stride,
   n): a frame every stride px, n frames a cycle (frame 0 standing: the caller's). The figures still step by the clock: they
   take this with the new figures */
const WALKED=new WeakMap();
const frameOf=(o,stride,n=2)=>Math.floor((WALKED.get(o)||0)/stride)%n;
