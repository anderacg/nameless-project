'use strict';
/* ---------- a holding's places on the map (the owner, 2026-11-24: "Make holding have the same mechanic as camp where the shop and
   market should be interact at estate or certain buildings"; data/holdings.js HOLD_SPOTS) ----------
   As a camp's services (world/encampments.js CampSpots): a badge for each of its shops over the building that keeps it (the market in
   its market hall, the smith in its smithy, where those estates stand; else each shop in one of the houses nearest its centre: the
   tavern, the stable, the barracks too), and its centre's own badge for the rest of its places (its hall, its notices, its stores,
   its garrison...). Shown while you are near it and in your sight; a tap walks you there, its gate asks what it asks at its centre
   (siege.js approachHolding), then that place opens alone (G.town.only); its centre's badge, or arriving at its centre, opens the rest
   (G.town.except: ui/townui.js townShows). Drawn only: nothing of them is saved, the world's draws untouched ---------- */
class HoldSpot extends WorldObject{
  constructor(t,k){super();this.t=t;this.k=k;this.x=t.x;this.y=t.y;this.box=null}
  get mapKind(){return 'holdspot'}
  here(){return TOWNS.includes(this.t)}
  get meetsAnyTime(){return true}
  inView(V){return !!this.box}
  // (its badge as last drawn, in the ground's px, a finger's slack round it)
  pick(at){const b=this.box;if(b)at.box(this,b[0],b[1],b[2],b[3])}
  meet(){approachHolding(this.t,this.k)}
  get label(){return HoldSpots.name(this.t,this.k)}
  tip(){return '<b>'+this.label+'</b><small>'+this.t.name+'</small><span class="act">Click: go to it</span>'}
}
const HoldSpots={
  of:new Map(),houses:new Map(),
  // (its places on its rail as it has them, none narrowed by a window open now)
  places(t){return Object.values(PLACES).filter(p=>p.rail&&p.at(t)).map(p=>p.id)},
  // (its shops with a building of their own; the rest of its places, its centre's)
  shops(t){const L=this.places(t);return HOLD_SPOTS.shops.filter(k=>L.includes(k))},
  rest(t){const S=this.shops(t);return this.places(t).filter(k=>!S.includes(k))},
  keys(t){return[...this.shops(t),...(this.rest(t).length?['keep']:[])]},
  name(t,k){return k==='keep'?HOLD_SPOTS.keep[t.kind]||'Hall':PLACES[k].short||PLACES[k].n},
  list(t){let L=this.of.get(t);const ks=this.keys(t);if(!L||L.map(o=>o.k).join()!==ks.join()){L=ks.map(k=>(L||[]).find(o=>o.k===k)||new HoldSpot(t,k));this.of.set(t,L)}return L},
  // (its houses nearest its centre first: kept until its lots change)
  near(t){const c=lotCentre(t),m=c?lotMid(c):{x:t.x,y:t.y},n=t.lots?t.lots.length:0;let H=this.houses.get(t);
    if(!H||H.n!==n){H=(t.lots||[]).filter(l=>l.k==='house').map(l=>({l,d:Math.hypot(lotMid(l).x-m.x,lotMid(l).y-m.y)})).sort((a,b)=>a.d-b.d).map(q=>q.l);H.n=n;this.houses.set(t,H)}return H},
  // (what each stands at: the centre for its own; a shop's estate building where it stands; else the next of the houses nearest
  // the centre, in the shops' order; with too few houses, a step aside of the centre)
  anchor(t,k){const U=HOLD_SPOTS.up,c=lotCentre(t);if(k==='keep')return c?{...lotMid(c),up:U.centre}:{x:t.x,y:t.y,up:U.centre};
    const est=HOLD_SPOTS.at[k]&&lotAt(t,HOLD_SPOTS.at[k]);if(est)return{...lotMid(est),up:U.lot};
    const need=this.shops(t).filter(s=>!(HOLD_SPOTS.at[s]&&lotAt(t,HOLD_SPOTS.at[s]))),i=need.indexOf(k),q=this.near(t)[i];
    return q?{...lotMid(q),up:U.lot}:{x:t.x+(i-(need.length-1)/2)*TILE,y:t.y+TILE,up:U.lot}},
  // (shown: the look on, a holding you know, not your foe's, near you)
  shown(t){return HOLD_SPOTS.on&&TOWNS.includes(t)&&Discovery.named(t)&&!foeAt(t)&&Math.hypot(t.x-P.x,t.y-P.y)<=HOLD_SPOTS.near},
  all(){const out=[];for(const L of this.of.values())out.push(...L);return out},
  // each frame: the holdings near you, their badges laid out on the screen and drawn (render.js drawWorld, with the camps'); their
  // boxes kept for a tap (world.js pickAt)
  draw(cam){
    for(const [t,L] of this.of){if(!this.shown(t)){for(const o of L)o.box=null;if(!TOWNS.includes(t))this.of.delete(t)}}
    const items=[];for(const t of TOWNS){if(!this.shown(t))continue;for(const o of this.list(t))items.push({o,a:this.anchor(t,o.k)})}
    MapBadges.draw(items,cam,HOLD_SPOTS,o=>HOLD_SPOTS.ico[o.k])}
};
onWorld(()=>{HoldSpots.of.clear();HoldSpots.houses.clear()});
