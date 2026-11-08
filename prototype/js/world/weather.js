'use strict';
/* ---------- the weather (its numbers: data/weather.js WEATHER; drawn by gfx/weather.js) ----------
   Weather keeps the map's regions (WEATHER.cell tiles a side), each its climate and its front (a kind, and the whole hour it ends:
   Clock.hourCount). Made on first need (a new world's or game's regions: onWorld drops them); each hour (Systems 'weather') every
   front that has ended gives way to the next, from the stream 'weather' (core/rng.js), so the world's Math.random never moves.
   Readers: at(x, y) the kind there (ambient.js ambWeather is it: the birds, the tracks, the story's context.weather); speed and sight
   on the map (map.js speedAt, visMulAt); battle(k) the field's numbers (setup.js envStats, battleEnv; projectiles.js); set(x, y, k,
   h) a front put there (the tests). With WEATHER.on off: the old way (the frost's snow, clear elsewhere), nothing kept or saved.
   As the weather where you are changes, its line (a toast) and 'weather:changed' on the bus.
   The seasons (season: by the day of the year) weigh each climate's kinds (weights); a front builds to its full strength over
   WEATHER.build hours (strength: drawn only; s, each region's front's start, kept in memory, not saved: a loaded front is whole). */
const Weather={
  grid:null,
  was:null,
  reset(){
    this.grid=null;
    this.was=null;
  },
  // (the regions: their climate, the most of their tiles'; fronts not drawn yet)
  make(){
    const C=WEATHER.cell,w=Math.ceil(MW/C),h=Math.ceil(MH/C),g={w,h,k:new Uint8Array(w*h),u:new Int32Array(w*h),c:new Uint8Array(w*h),s:new Float64Array(w*h).fill(-1e9)},n=new Int32Array(CLIMS.length);
    for(let cy=0;cy<h;cy++)for(let cx=0;cx<w;cx++){
      n.fill(0);
      for(let ty=cy*C;ty<Math.min(MH,cy*C+C);ty++)for(let tx=cx*C;tx<Math.min(MW,cx*C+C);tx++)n[climate[ty*MW+tx]]++;
      let best=0;
      for(let i=1;i<n.length;i++)if(n[i]>n[best])best=i;
      g.c[cy*w+cx]=best;
    }
    return g;
  },
  // the regions, made with their first fronts on first need (each ends somewhere in its kind's hours, so they never turn together;
  // made before a new game had its number, Rng.newGame, made again once it has: each game its own weather)
  cells(){
    if(this.grid&&!(this.grid.game===0&&Rng.game))return this.grid;
    const g=this.grid=this.make(),R=rngOf('weather'),now=Clock.hourCount();
    g.game=Rng.game;
    for(let i=0;i<g.k.length;i++){
      const k=R.weighted(this.weights(g.c[i]))||'clear',H=WEATHER.kinds[k].hours;
      g.k[i]=WEATHER_KINDS.indexOf(k);
      g.u[i]=now+R.int(1,H[1]);
    }
    return g;
  },
  // (climate c's kinds' chances this season (or day d's): its own, each x the season's mul, and the season's add for it)
  weights(c,d){
    const cl=WEATHER.climates[CLIMS[c]]?CLIMS[c]:'grass',W=WEATHER.climates[cl],S=this.season(d),A=S.add&&S.add[cl]||{},o={};
    for(const k of new Set([...Object.keys(W),...Object.keys(A)]))o[k]=(W[k]||0)*(S.mul[k]??1)+(A[k]||0);
    return o;
  },
  // the season today (or on day d): the year's CLOCK.year days shared between WEATHER.seasons in turn
  season(d){
    const L=WEATHER.seasons;return L[Math.min(L.length-1,Math.floor((Clock.dayOfYear(d)-1)/(CLOCK.year/L.length)))];
  },
  // how far the front at (x, y) has built, 0..1 (WEATHER.build hours from its start; drawn only)
  strength(x,y){
    if(!WEATHER.on)return 1;
    const g=this.cells();return clamp((Clock.hours()-g.s[this.cellAt(x,y)])/WEATHER.build,0,1);
  },
  // (the region at (x, y))
  cellAt(x,y){
    const g=this.cells(),C=WEATHER.cell*TILE;
    return clamp(Math.floor(y/C),0,g.h-1)*g.w+clamp(Math.floor(x/C),0,g.w-1);
  },
  // the kind of weather at (x, y)
  at(x,y){
    if(!WEATHER.on)return climAt(x,y)==='frost'?'snow':'clear';
    return WEATHER_KINDS[this.cells().k[this.cellAt(x,y)]];
  },
  // its name there now (a clear sky by day: day's)
  name(k){
    const K=WEATHER.kinds[k];
    return K.day&&Clock.isDay?K.day:K.n;
  },
  // travel on the map x at (x, y) (c: its climate; home: the traveller's home climates, where only WEATHER.home of the loss is felt)
  speed(x,y,c,home){
    if(!WEATHER.on)return 1;
    const m=WEATHER.kinds[this.at(x,y)].speed;
    return home&&home.includes(c)?1-(1-m)*WEATHER.home:m;
  },
  sight(x,y){
    return WEATHER.on?WEATHER.kinds[this.at(x,y)].sight:1;
  },
  // a field's numbers in weather k (null: none, as in clear weather)
  battle(k){
    return k&&WEATHER.kinds[k]&&WEATHER.kinds[k].battle||null;
  },
  // the next front in region i: a neighbour's now and then (if it can come here), else one by the climate's weights
  next(i){
    const g=this.grid,R=rngOf('weather'),W=this.weights(g.c[i]),x=i%g.w,y=Math.floor(i/g.w);
    let k=null;
    if(R.chance(WEATHER.spread)){
      const nb=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b])=>a>=0&&b>=0&&a<g.w&&b<g.h),[a,b]=R.pick(nb)||[x,y],o=WEATHER_KINDS[g.k[b*g.w+a]];
      if(W[o]>0)k=o;
    }
    k=k||R.weighted(W)||'clear';
    const H=WEATHER.kinds[k].hours;
    if(g.k[i]!==WEATHER_KINDS.indexOf(k))g.s[i]=Clock.hours();// (a new kind builds; the same again goes on as it was)
    g.k[i]=WEATHER_KINDS.indexOf(k);
    g.u[i]=Clock.hourCount()+R.int(H[0],H[1]);
  },
  // each hour: the fronts that have ended give way; the weather where you are told as it changes
  hour(){
    if(!WEATHER.on)return;
    const g=this.cells(),now=Clock.hourCount();
    for(let i=0;i<g.k.length;i++)if(g.u[i]<=now)this.next(i);
    this.tell();
  },
  tell(){
    const k=this.at(P.x,P.y),was=this.was;
    this.was=k;
    if(was===null||was===k)return;
    if(G.mode==='world')toast(WEATHER.kinds[k].say);
    worldEmit('weather:changed',{k,was,x:P.x,y:P.y});
  },
  // a front of kind k put at (x, y)'s region for h hours (the tests; a story that brings a storm)
  set(x,y,k,h=6){
    const g=this.cells(),i=this.cellAt(x,y);
    g.k[i]=WEATHER_KINDS.indexOf(k);
    g.u[i]=Clock.hourCount()+h;
    g.s[i]=-1e9;
  },
  // a new game's first sky where you stand (x, y): WEATHER.start, for its kind's hours (session.js startGame)
  fair(x,y){
    const k=WEATHER.start;
    if(!WEATHER.on||!k||!WEATHER.kinds[k])return;
    const H=WEATHER.kinds[k].hours;
    this.set(x,y,k,rngOf('weather').int(H[0],H[1]));
  },
  // (in a save: the regions' kinds and ends; none while it is off or nothing was made yet)
  save(){
    const g=this.grid;
    if(!WEATHER.on||!g)return;
    return {w:g.w,h:g.h,k:Array.from(g.k),u:Array.from(g.u)};
  },
  load(v){
    this.reset();
    if(!v||!v.k)return;
    const g=this.make();
    if(g.w!==v.w||g.h!==v.h||v.k.length!==g.k.length)return;// (another size of world: made afresh on first need)
    g.k.set(v.k.map(i=>i<WEATHER_KINDS.length?i:0));
    g.u.set(v.u);
    g.game=-1;
    this.grid=g;
  },
};
// (a new world's or game's weather made afresh, on first need)
onWorld(()=>Weather.reset());
// (its work in the world's hour: core/systems.js; first, so the hour's other systems read the new weather)
Systems.add({name:'weather',order:{hour:5},hour:()=>Weather.hour()});
Saves.add({key:'weather',order:370,defaults:null,save:()=>Weather.save(),load:v=>Weather.load(v)});
