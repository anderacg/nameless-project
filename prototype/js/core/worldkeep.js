'use strict';
/* the made worlds kept on this device (data/world.js WORLD_KEEP; the owner, 2026-11-20: "Can we also reduce loading time when we
   load from the save"): a load made its world again from its seed, the generator's every stage, each time. A world made (a new
   game's, a load's) is kept as the generator gave it, before it is put in: the last one in the page, and WORLD_KEEP.most of them
   in the browser's store (IndexedDB; the oldest let go). A load takes its world from there when the kept one is the save's own:
   the same gen and settings, and its checksum, counted again from its layers and holdings, the save's (so never a world another
   version of the generator would make: that one is made again, and refused as before). With it its land's fields, as they lay
   when the generator made its heights (worldgen.js landBase: a stage before the roads and the brooks cut, so they are not to be
   had from the finished layers). What the code derives from a world is made again by today's code, not kept: its way graph
   (router.js buildWayGraph, as genGraph makes it).
     WorldKeep.put(r): keeps the generator's result r, copied at once (what the putting in changes never reaches the copy).
     WorldKeep.take(M): the kept world of a save's map record M ({gen, settings, sum}) from the page, its own copy, or null.
     WorldKeep.get(M): a Promise of the same, from the page or the store; null when none fits or the store cannot be read. */
const WorldKeep={
  last:null,dbp:null,
  key:M=>M.gen+' '+settingsKey(M.settings),
  pack(r){const m=r.map,map={};for(const k of Object.keys(m))if(k!=='graph')map[k]=m[k];
    return structuredClone({key:this.key(m),v:WORLD_KEEP.v,sum:m.sum,at:Date.now(),land:landHeight(m).base,r:{...r,map,graph:null}})},
  // (own: e is no one else's (read from the store), so it is not copied again)
  unpack(e,M,own){if(!e||e.v!==WORLD_KEEP.v||e.key!==this.key(M)||e.sum!==M.sum)return null;
    const r=own?e.r:structuredClone(e.r),m=Object.setPrototypeOf(r.map,WorldMap.prototype);if(m.checksum(r.holdings)!==M.sum)return null;
    landFrom(m,own?e.land:structuredClone(e.land));m.graph=r.graph=buildWayGraph({map:m,holdings:r.holdings,camps:r.camps});return r},
  open(){return this.dbp||(this.dbp=new Promise(res=>{
    try{const q=indexedDB.open(WORLD_KEEP.db,1);q.onupgradeneeded=()=>q.result.createObjectStore('worlds',{keyPath:'key'}).createIndex('at','at');
      q.onsuccess=()=>res(q.result);q.onerror=q.onblocked=()=>res(null)}catch(e){res(null)}}))},
  put(r){if(!WORLD_KEEP.on)return;let e;try{e=this.pack(r)}catch(x){return}this.last=e;if(!WORLD_KEEP.disk)return;
    this.open().then(db=>{if(!db)return;
      try{const s=db.transaction('worlds','readwrite').objectStore('worlds');s.put(e);
        const q=s.index('at').getAllKeys();q.onsuccess=()=>{for(let i=0;i<q.result.length-WORLD_KEEP.most;i++)s.delete(q.result[i])}}catch(x){}})},
  take(M){if(!WORLD_KEEP.on)return null;try{return this.unpack(this.last,M,false)}catch(e){return null}},
  get(M){const r=this.take(M);if(r||!WORLD_KEEP.on||!WORLD_KEEP.disk)return Promise.resolve(r);
    return this.open().then(db=>db?new Promise(res=>{
      try{const q=db.transaction('worlds').objectStore('worlds').get(this.key(M));
        q.onsuccess=()=>{let v=null;try{v=this.unpack(q.result,M,true)}catch(e){}res(v)};q.onerror=()=>res(null)}catch(e){res(null)}}):null)}
};
