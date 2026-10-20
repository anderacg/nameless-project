'use strict';
/* ---------- the save registry (doc/CORE_DESIGN.md §2, K1) ----------
   The world part of a save (save.js worldSave, worldLoad) is made of pieces, each registered once by whoever keeps it:
     Saves.add({key, order, save(), load(value), settle(value), defaults})
   - save(): the piece as plain data, or undefined to leave its key out (a piece saved only once it has anything);
   - load(value): the piece put back, given what was saved merged over its defaults (a copy of them when nothing was saved;
     an object's saved fields over a copy of its default ones);
   - settle(value): optional, once every piece is loaded, for what is made again from several (the lots' ground, the sites'
     spots, the herds' pens), in the same order;
   - order: the key's place in the saved JSON (lowest first). The saved shape is the save's format: W7 and B2 (tests/worldprint.js)
     hash it, so the keys keep their places. */
const Saves={
  parts:[],
  sorted:null,
  add(part){
    if(this.parts.some(p=>p.key===part.key))throw new Error('Two save pieces called '+part.key);
    if(typeof part.order!=='number')throw new Error('The save piece '+part.key+' has no order');
    const taken=this.parts.find(p=>p.order===part.order);
    if(taken)throw new Error('The save pieces '+taken.key+' and '+part.key+' both want place '+part.order);
    this.parts.push(part);
    this.sorted=null;
    return part;
  },
  all(){
    if(!this.sorted)this.sorted=this.parts.slice().sort((a,b)=>a.order-b.order);
    return this.sorted;
  },
  part(key){
    const p=this.parts.find(p=>p.key===key);
    if(!p)throw new Error('No save piece called '+key);
    return p;
  },
  // what was saved, merged over the piece's defaults (plain data: copied, so a game never shares them)
  value(p,saved){
    const def=p.defaults;
    if(def===undefined)return saved;
    const copy=()=>JSON.parse(JSON.stringify(def));
    if(saved===undefined||saved===null)return def&&typeof def==='object'?copy():def;
    if(def&&typeof def==='object'&&!Array.isArray(def)&&typeof saved==='object'&&!Array.isArray(saved))return {...copy(),...saved};
    return saved;
  },
  // every piece, in its order: the world part of a save
  save(){
    const out={};
    for(const p of this.all()){
      if(!p.save)continue;
      const v=p.save();
      if(v!==undefined)out[p.key]=v;
    }
    return out;
  },
  // one piece, as the world part would hold it: {key: value}, or {} while it is left out
  saveOf(key){
    const p=this.part(key),v=p.save();
    return v===undefined?{}:{[key]:v};
  },
  // the world part put back: every piece loaded in its order, then settled in its order
  load(data){
    const parts=this.all().filter(p=>p.load||p.settle),values=parts.map(p=>this.value(p,data[p.key]));
    parts.forEach((p,i)=>{if(p.load)p.load(values[i])});
    parts.forEach((p,i)=>{if(p.settle)p.settle(values[i])});
  },
  // one piece put back on its own (what was saved, or nothing: its defaults)
  loadOf(key,saved){
    const p=this.part(key),v=this.value(p,saved);
    if(p.load)p.load(v);
    if(p.settle)p.settle(v);
  }
};
