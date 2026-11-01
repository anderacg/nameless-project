'use strict';
/* ---------- the world's spatial helper: nearest and within (doc/CORE_DESIGN.md, K2) ----------
   Spatial.nearest(list, x, y, filter?): the one of list nearest to (x,y), by Math.hypot, the first in the list's order on a
   tie (a strict < from 1e9: realms.js nearestOf, now its alias, always picked so); filter: which may count, the same as
   filtering the list first. Spatial.nearestHolding(x, y, filter?) is it over TOWNS. Spatial.within(list, x, y, r): those
   within r (r included), in the list's order.
   For a big list asked many times (the critters, the folk), Spatial.index(list, cell) files it once into a grid of buckets
   (the battle's SpatialGrid idea, battle/spatial.js): a query gathers the buckets its box touches, sorts what it finds back
   into the list's order and puts each through the very test above, so it answers exactly as the scan of the whole list
   does, ties and all. The index is a snapshot: rebuild() it after things move. */
class SpatialIndex{
  // cell: the bucket's width in px, a power of two (so its edges are exact in floats)
  constructor(list,cell){
    this.cs=cell||64;
    this.inv=1/this.cs;
    this.rebuild(list);
  }
  rebuild(list){
    this.list=list;
    this.buckets=new Map();
    this.c0=this.r0=Infinity;
    this.c1=this.r1=-Infinity;
    list.forEach((o,i)=>{
      const c=this.col(o.x),r=this.col(o.y),k=this.key(c,r);
      let b=this.buckets.get(k);
      if(!b)this.buckets.set(k,b=[]);
      b.push(i);
      if(c<this.c0)this.c0=c;
      if(c>this.c1)this.c1=c;
      if(r<this.r0)this.r0=r;
      if(r>this.r1)this.r1=r;
    });
    return this;
  }
  col(v){
    return Math.floor(v*this.inv);
  }
  key(c,r){
    return (c+32768)*65536+(r+32768);
  }
  // the list's indices in the cells c0..c1 x r0..r1 (the ring's edge only, when ring is true), into out
  gather(c0,c1,r0,r1,out,ring){
    for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){
      if(ring&&r!==r0&&r!==r1&&c!==c0&&c!==c1)continue;
      const b=this.buckets.get(this.key(c,r));
      if(b)for(const i of b)out.push(i);
    }
    return out;
  }
  // those within r of (x,y), in the list's order
  within(x,y,r){
    const ix=this.gather(this.col(x-r),this.col(x+r),this.col(y-r),this.col(y+r),[]).sort((a,b)=>a-b);
    const out=[];
    for(const i of ix){
      const o=this.list[i];
      if(Math.hypot(o.x-x,o.y-y)<=r)out.push(o);
    }
    return out;
  }
  /* the nearest (filter: which may count), as Spatial.nearest over the whole list. Rings of cells outward from (x,y)'s: one in
     ring k stands at least (k-1) cells' width off, so once the best is nearer than that (a pixel to spare for rounding) no
     ring from k on can beat or tie it */
  nearest(x,y,filter){
    if(!this.list.length)return null;
    const c=this.col(x),r=this.col(y),L=this.list;
    const K=Math.max(c-this.c0,this.c1-c,r-this.r0,this.r1-r);
    let best=null,bd=1e9,bi=-1;
    for(let k=0;k<=K;k++){
      if(best&&k>1&&bd<(k-1)*this.cs-1)break;
      for(const i of this.gather(c-k,c+k,r-k,r+k,[],true)){
        const o=L[i];
        if(filter&&!filter(o))continue;
        const d=Math.hypot(o.x-x,o.y-y);
        if(d<bd||d===bd&&i<bi){
          bd=d;
          best=o;
          bi=i;
        }
      }
    }
    return best;
  }
}
/* the world's movers filed by the chunk they stand in (doc/WORLD_DESIGN.md §3.5: cost follows what is near you, not the map):
   a chunk px wide (the painted map's, 512). file(lists) files them all afresh, in the lists' order (each one once, its place
   in that order its ord, the list it came from its tag); box(x0, y0, x1, y1, out) gathers into out those filed in the chunks
   the rect (px) touches, back in that order. A snapshot, as the index above: what moved since stands where it was filed, so
   ask with a margin */
class ChunkGrid{
  constructor(px){
    this.px=px;
    this.cells=new Map();
    this.ord=new WeakMap();
    this.tag=new WeakMap();
    this.gen=0;
    this.n=0;
  }
  key(cx,cy){
    return (cx+32768)*65536+(cy+32768);
  }
  // (the chunk a point stands in, along one axis)
  at(v){
    return Math.floor(v/this.px);
  }
  // (o filed by the last filing: one gone from every list since is not)
  has(o){return (this.ord.get(o)||0)>this.gen*1e7-1}
  file(lists){
    for(const c of this.cells.values())c.length=0;
    const base=++this.gen*1e7;let i=0;
    lists.forEach((L,t)=>{for(const o of L){
      if(!o||(this.ord.get(o)||0)>=base)continue;
      this.ord.set(o,base+i++);
      this.tag.set(o,t);
      const k=this.key(this.at(o.x),this.at(o.y));let c=this.cells.get(k);
      if(!c)this.cells.set(k,c=[]);
      c.push(o);
    }});
    this.n=i;
    return this;
  }
  box(x0,y0,x1,y1,out){
    const n0=out.length,c0=this.at(x0),c1=this.at(x1),r0=this.at(y0),r1=this.at(y1);
    for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){
      const b=this.cells.get(this.key(c,r));
      if(b)for(const o of b)out.push(o);
    }
    if(out.length-n0>1){const O=this.ord,s=out.splice(n0).sort((a,b)=>O.get(a)-O.get(b));for(const o of s)out.push(o)}
    return out;
  }
}
const Spatial={
  nearest(list,x,y,filter){
    let best=null,bd=1e9;
    for(const o of list){
      if(filter&&!filter(o))continue;
      const d=Math.hypot(o.x-x,o.y-y);
      if(d<bd){
        bd=d;
        best=o;
      }
    }
    return best;
  },
  nearestHolding(x,y,filter){
    return this.nearest(TOWNS,x,y,filter);
  },
  // the holding near enough to you for the law and the people to count (WORLD_SCALE.law.eventNear tiles), or null
  nearHold(){
    const t=this.nearestHolding(P.x,P.y);
    return t&&Math.hypot(t.x-P.x,t.y-P.y)<WORLD_SCALE.law.eventNear*TILE?t:null;
  },
  within(list,x,y,r){
    return list.filter(o=>Math.hypot(o.x-x,o.y-y)<=r);
  },
  // a grid over a big list (cell: px, a power of two; 64 by default)
  index(list,cell){
    return new SpatialIndex(list,cell);
  },
};
const nearHold=()=>Spatial.nearHold();// (its old name, used by the encounter kinds and the story context)
