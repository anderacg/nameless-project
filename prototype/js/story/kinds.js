'use strict';
/* ---------- the kinds: one registry (doc/STORY_DESIGN.md §3.1, §3.3; the story wave, S1) ----------
   defineKind(shape, id, spec) registers a kind of a shape ('encounter' today; the incidents, quests, gatherings and threads
   later) once. The spec is the kind itself, plain data with hooks (its numbers, names, weights, its scene, its choices), as
   most of the road's are; kindOf(shape, id) gives it back, with its id and shape written on it.
   - spec.cls: the kind's own subclass of its shape's class, only where it has real behaviour of its own (world/encounters.js: the
     shepherd and his strays). None: the shape's class.
   - spec.trigger: when a kind may begin ('travelHour': the road's pity timer). Each trigger has its bucket, filled as the kinds
     are defined at load, in their order, so a trigger looks only at the kinds it can start: Kinds.on(shape, trigger) (a list),
     Kinds.view(shape, trigger) (the same, as {id: kind}: ROAD_ENC is the road's). No trigger: it is only ever started by
     another (a trace, a stray).
   - defineKinds(shape, common, specs): a table of them at once, each given common's fields (its trigger).
   Nothing here draws a random number or changes the world. */
const Kinds={
  shapes:{},
  buckets:{},
  define(shape,id,spec){
    const all=this.shapes[shape]||(this.shapes[shape]={});
    if(Object.prototype.hasOwnProperty.call(all,id))throw new Error('The '+shape+' kind '+id+' is defined twice');
    spec.id=id;
    spec.shape=shape;
    all[id]=spec;
    if(spec.trigger){
      const b=this.bucket(shape,spec.trigger);
      b.list.push(spec);
      b.by[id]=spec;
    }
    return spec;
  },
  defineAll(shape,common,specs){
    for(const [id,spec] of Object.entries(specs))this.define(shape,id,Object.assign(spec,common));
    return specs;
  },
  of(shape,id){
    const all=this.shapes[shape];
    return all&&Object.prototype.hasOwnProperty.call(all,id)?all[id]:null;
  },
  // every kind of a shape, in the order defined
  all(shape){
    return Object.values(this.shapes[shape]||{});
  },
  // (a trigger's bucket: its kinds as a list and by id)
  bucket(shape,trigger){
    const b=this.buckets[shape]||(this.buckets[shape]={});
    return b[trigger]||(b[trigger]={list:[],by:{}});
  },
  on(shape,trigger){
    return this.bucket(shape,trigger).list;
  },
  view(shape,trigger){
    return this.bucket(shape,trigger).by;
  },
};
const defineKind=(shape,id,spec)=>Kinds.define(shape,id,spec);
const defineKinds=(shape,common,specs)=>Kinds.defineAll(shape,common,specs);
const kindOf=(shape,id)=>Kinds.of(shape,id);
