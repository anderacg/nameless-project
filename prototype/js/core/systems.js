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
   A new system is one more Systems.add, never an edit to the loop. Systems.names('day') lists a phase's order. */
const Systems={
  list:[],
  byPhase:{},
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
  // each moment on the map: every system's step in its order; true when one of them ended the frame
  frame(d,dt){
    for(const s of this.of('frame')){
      if(s.frame(d,dt)&&s.ends)return true;
    }
    return false;
  },
  hour(h){
    for(const s of this.of('hour'))s.hour(h);
  },
  day(){
    for(const s of this.of('day'))s.day();
  }
};
