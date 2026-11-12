'use strict';
/* ---------- discovery (the owner, 2026-11-08: "make a discovery feel more rewarding like when you visit somewhere you may not know
   the name right the way but once you near it then you'll have a text animation like You discovered xxxxxx") ----------
   A holding or a named site (a cave, ruins, a shrine, a hideout, a goblin camp: not a bandit or travellers' camp) is known by its
   kind only ("Village", "Cave": in its tip, its lands, the full map; the map itself has no names) until your band comes within DISCOVER.r tiles of it, of its edge for a holding (reach: its heart, houses and market, not its fields), or to its gate (meet) (DISCOVER.site tiles for a site): then you learn its
   name, its title rises over the map (DiscoveryTitle), a line in the log and Scouting practice (DISCOVER.scout). What a game
   begins near (within DISCOVER.start tiles) is known from the start, without a title. Read: Discovery.named(o), Discovery.nameOf(o)
   (its name, or its kind while you do not know it). Saved (the keys found: 'h:' a holding's name, 's:' a site's number). With
   DISCOVER.on off (the test suites': tests/harness.js) every name is known and nothing is kept; tests/discovery.js turns it on. */
const Discovery={
  found:new Set(),
  started:false,
  reset(){this.found=new Set();this.started=false},
  key(o){return o instanceof Site?'s:'+o.i:o.grave?'g:'+o.who+':'+o.day+':'+Math.round(o.x):'h:'+o.name},
  // (the places one can discover: the holdings, and the named sites)
  places(){return [...TOWNS,...W.sites.filter(s=>!(s instanceof BanditCamp)&&!(s instanceof TravellersCamp))]},// (the resting places among the sites: world/lineage.js RestSite)
  named(o){return !DISCOVER.on||!o||this.found.has(this.key(o))},
  // (its name, or while you do not know it its kind: "Village", "Cave")
  nameOf(o){return this.named(o)?o.name:o instanceof Site?o.T.n:cap1(o.label)},
  // each frame on the map (sites.js updateSites): what your band has come near; the first time, all near you known at once, quietly
  check(){
    if(!DISCOVER.on||G.mode!=='world')return;
    const quiet=!this.started;this.started=true;
    for(const o of this.places()){
      if(this.found.has(this.key(o)))continue;
      const r=(quiet?DISCOVER.start:o instanceof Site?DISCOVER.site:DISCOVER.r)*TILE+this.reach(o);
      if(Math.hypot(o.x-P.x,o.y-P.y)<=r)this.discover(o,quiet);
    }
  },
  /* (how far a holding spreads from its centre, px: its farthest lot of DISCOVER.core's kinds (its heart, houses and market, not the
     estates out in its fields: the owner, 2026-11-12, "need to be very close to the holding"), so its DISCOVER.r tiles count from its edge
     (the owner, 2026-11-10: "check whether we can discover them": a city's or a castle's gate is farther out than 6 tiles from its
     heart, so turned away there you never came near enough); a site, none. Kept while its lots are as they were) */
  reach(o){const L=!(o instanceof Site)&&o.lots;if(!L||!L.length)return 0;if(o._reach&&o._reach[0]===L.length)return o._reach[1];
    let r=0;for(const l of L)if(DISCOVER.core.includes(l.k))r=Math.max(r,Math.hypot((l.x+l.n/2)*TILE-o.x,(l.y+l.n/2)*TILE-o.y)+l.n*TILE/2);o._reach=[L.length,r];return r},
  // (come to it: at its gate (world/siege.js approachHolding), known at once, whether or not it will have you)
  meet(o){if(DISCOVER.on&&o&&!this.named(o)&&this.places().includes(o))this.discover(o,false)},
  discover(o,quiet){
    this.found.add(this.key(o));
    if(o instanceof Site&&o.scoutable)o.seen=true;
    if(quiet)return;
    train('scout',DISCOVER.scout);
    log('You discovered '+o.name+', '+(o instanceof Site?o.T.n.toLowerCase():'a '+o.label.toLowerCase())+'.','gold');
    DiscoveryTitle.show(o.name,o instanceof Site?o.T.n:cap1(o.label));
    worldEmit('place:discovered',{o});
  },
  save(){if(DISCOVER.on&&this.found.size)return [...this.found]},
  load(v){this.reset();if(Array.isArray(v)){this.found=new Set(v);this.started=true}},
};
/* the title as you discover a place: over the map, under the windows; "You discovered", its name large, its kind; it rises, its
   letters drawing together, holds, and fades (style.css .discover). One at a time, the next as the last fades (queue) */
const DiscoveryTitle={
  queue:[],
  busy:false,
  show(name,kind){this.queue.push([name,kind]);if(!this.busy)this.next()},
  next(){
    const q=this.queue.shift();if(!q){this.busy=false;return}this.busy=true;
    let el=document.getElementById('discover');
    if(!el){el=document.createElement('div');el.id='discover';el.className='discover';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el)}
    el.innerHTML='<small>You discovered</small><strong>'+htmlText(q[0])+'</strong><span>'+htmlText(q[1])+'</span>';
    el.style.setProperty('--discover-ms',DISCOVER.show*1000+'ms');
    el.classList.remove('on');void el.offsetWidth;el.classList.add('on');
    clearTimeout(this.t);this.t=setTimeout(()=>{el.classList.remove('on');this.next()},DISCOVER.show*1000);
  },
};
onWorld(()=>Discovery.reset());
Saves.add({key:'found',order:375,defaults:null,save:()=>Discovery.save(),load:v=>Discovery.load(v)});
