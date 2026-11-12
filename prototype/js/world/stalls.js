'use strict';
/* ---------- stalls: a party that has somewhere to go and has not moved for WORLD_STALL.hours game hours is sent on another way
   (the owner, 2026-11-12: "when the world is simulated far away it seems like we will end up having a lot of entities stuck at
   certain places"). Watched each hour: a lord marching, going home, relieving or on patrol (not one in a campaign's column, nor one
   laying siege), a realm's caravan, a holding's patrol; none inside a holding, in a fight or held. One that moved WORLD_STALL.px or
   more since it was last seen counts afresh. Stalled: a lord thinks again, the holding he could not get to put aside (realms.js
   lordThink avoid); a caravan turns for another holding of its realm it can reach, else goes home off the map; a patrol goes back
   inside its holding. Each kept in Stalls.seen (the last WORLD_STALL.keep: who, where, what it was doing, what it does now), and
   counted (Stalls.n), so a crowd that should not be can be traced. Nothing saved: a load watches afresh ---------- */
const Stalls={rec:new WeakMap(),seen:[],n:0,
  // (is it on its way somewhere: watched)
  going(o){if(!o||o.gone||o.dead||o.inside||o.fight||o.held)return false;const k=o.mapKind;
    if(k==='lord')return !o.with&&!o.follow&&['march','home','relieve','patrol'].includes(o.state);
    if(k==='caravan')return !o.idle&&!o.mine;
    return k==='patrol'},
  hour(){const X=WORLD_STALL;if(!X.on)return;const h=Clock.hours();
    for(const o of [...W.lords,...W.caravans,...W.patrols]){if(!this.going(o)){this.rec.delete(o);continue}
      const r=this.rec.get(o);if(!r||Math.hypot(o.x-r.x,o.y-r.y)>=X.px){this.rec.set(o,{x:o.x,y:o.y,h});continue}
      if(h-r.h>=X.hours){this.rec.delete(o);this.free(o)}}},
  // (sent on another way; what it was doing and what it does now, kept)
  free(o){const k=o.mapKind,was=k==='lord'?o.state+' '+(o.tgt||''):k==='caravan'?'to '+o.to:'patrol of '+o.home;let now;
    if(k==='lord'){lordThink(o,o.tgt);now=o.state+' '+(o.tgt||'')}
    else if(k==='caravan'){const alt=nearestReach(o,TOWNS.filter(t=>!t.gone&&t.owner===o.fac&&!besieged(t)),o.to);if(alt){o.to=alt.name;now='to '+alt.name}else{o.gone=true;now='home'}}
    else{const t=townBy(o.home);if(t&&t.owner===o.fac&&t.watch)t.watch.back(o);else o.gone=true;now='inside'}
    this.n++;this.seen.push({day:G.day,k,name:o.name||k,x:Math.round(o.x),y:Math.round(o.y),near:(Spatial.nearestHolding(o.x,o.y)||{}).name,was,now});
    if(this.seen.length>WORLD_STALL.keep)this.seen.shift()}};
onWorld(()=>{Stalls.rec=new WeakMap();Stalls.seen=[];Stalls.n=0});
Systems.add({name:'stalls',order:{hour:50},hour:()=>Stalls.hour()});
