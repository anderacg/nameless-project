'use strict';
/* ---------- the systems registry (doc/CORE_DESIGN.md §2, K1) ----------
   Every system of the world registers its work once, in its own file, with one line:
     Systems.add({name, order:{frame, hour, day}, frame(d, dt), hour(h), day(), ends})
   - frame(d, dt): each moment on the map (world.js updateWorld): d the world's time, dt the real one;
   - day(): once a day (world.js dayTick), after the day is counted;
   - hour(h): once an hour (no system has one yet; the Clock, core/clock.js Clock.advance, calls Systems.hour as each hour begins);
   - order: one number for each phase the system works in, its place there (lowest first). Two systems never share a place:
     the world shares one Math.random, so the order is everything (the world fingerprints, tests/worldprint.js, hold it);
   - ends: its frame may end the world's frame (something opened: a page, a fight, a holding): when it returns true, the
     systems after it wait for the next frame (the old `if(a()||b())return`).
   A new system is one more Systems.add, never an edit to the loop. Systems.names('day') lists a phase's order.
   - sliced(list, each, after): a day's work over a list (the holdings), each(item, i) then after(): all at once while sliceDay
     is off (0, as always); on (n), 1/n of the list a frame over the day's first frames (doc/WORLD_DESIGN.md §2.2, R12: a Huge
     world's day never hitches), what is left finished first at the next day or a save (drain). */
const Systems={
  list:[],
  byPhase:{},
  sliceDay:0,
  slices:[],
  // a system joins: its name its own, an order for each phase it works in, none of them taken
  add(sys){
    if(!sys.name)throw new Error('A system needs a name');
    if(this.list.some(s=>s.name===sys.name))throw new Error('Two systems called '+sys.name);
    for(const phase of ['frame','hour','day']){
      if(!sys[phase])continue;
      const at=sys.order&&sys.order[phase];
      if(typeof at!=='number')throw new Error('The system '+sys.name+' has no place in the '+phase);
      const taken=this.list.find(s=>s[phase]&&s.order[phase]===at);
      if(taken)throw new Error('The systems '+taken.name+' and '+sys.name+' both want place '+at+' in the '+phase);
    }
    this.list.push(sys);
    this.byPhase={};
    return sys;
  },
  // the systems working in a phase, in their order there
  of(phase){
    if(!this.byPhase[phase])this.byPhase[phase]=this.list.filter(s=>s[phase]).sort((a,b)=>a.order[phase]-b.order[phase]);
    return this.byPhase[phase];
  },
  names(phase){
    return this.of(phase).map(s=>s.name);
  },
  // a day's work over a list, sliced when sliceDay is on (above)
  sliced(list,each,after){
    if(!(this.sliceDay>1)){
      let i=0;
      for(const x of list)each(x,i++);
      if(after)after();
      return;
    }
    this.slices.push({list:list.slice(),i:0,per:Math.ceil(list.length/this.sliceDay),each,after});
  },
  // the sliced work's next share (each frame), or all of it (all: a new day, a save)
  drain(all){
    for(const j of this.slices){
      const end=all?j.list.length:Math.min(j.list.length,j.i+j.per);
      for(;j.i<end;j.i++)j.each(j.list[j.i],j.i);
      if(j.i>=j.list.length&&j.after)j.after();
    }
    this.slices=this.slices.filter(j=>j.i<j.list.length);
  },
  // each moment on the map: every system's step in its order; true when one of them ended the frame
  frame(d,dt){
    if(this.slices.length)this.drain(false);
    for(const s of this.of('frame')){
      if(s.frame(d,dt)&&s.ends)return true;
    }
    return false;
  },
  hour(h){
    for(const s of this.of('hour'))s.hour(h);
  },
  day(){
    if(this.slices.length)this.drain(true);
    for(const s of this.of('day'))s.day();
  }
};
