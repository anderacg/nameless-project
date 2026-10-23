'use strict';
/* ---------- holdings: what a holding is and does (Holding and its kinds: Village, Town, City, Castle), what it is on the map
   (HoldingObject) and the factory that makes a world's holdings from plain data. What each kind has is data (data/holdings.js
   HOLDING_TYPES); its parts are kept aside in their own files (Economy, Buildings, Layout, Watches, Estate). ---------- */
/* on the map: a holding is a world object (worldobject.js WorldObject). It answers a click on its gate and on any of its buildings
   and walls, and its estates on their buildings and fields, in its order of lots (pick). Drawn with its lots (structures.js
   holdingEnts, drawLotGround) */
class HoldingObject extends WorldObject{
  get mapKind(){return 'town'}
  here(){return TOWNS.includes(this)}
  get meetsAnyTime(){return true}
  meet(){approachHolding(this)}
  // its built estates, in the order of its lots (worldObjects lists them after it)
  estates(){return Object.keys(bldSpots(this)).filter(k=>bldLv(this,k)).map(k=>estatePick(this,k))}
  // (structures answer anywhere on what is drawn of them: pickAt box)
  pick(at){if(Math.hypot(this.x-P.x,this.y-P.y)>at.V+340)return;at.box(this,this.x-8,this.y-18,this.x+8,this.y+8,4);// its gate
    for(const l of this.lots||[]){if(ESTATES[l.k]&&bldLv(this,l.k))estatePick(this,l.k).pickOn(at,this,l);else at.box(this,l.x*TILE,l.y*TILE,(l.x+l.n)*TILE,(l.y+l.n)*TILE,ESTATES[l.k]?0:4)}}
  draw(ents,cam,V){holdingEnts(this,ents,cam,V)}
  mapDot(V){return seenTile(this.tx,this.ty)?[this._memCol||facCol(this),3]:null}// (its colour as you last saw it)
  tip(){return '<b>'+this.name+'</b><small>'+cap1(this.label)+(this.owner?' of the '+tipFac(this.owner):'')+' · '+WALL_N[wallOf(this)]+'</small>'+(closedNow(this)?'<small class="bad">Under siege</small>':'')+'<span class="act">'+(hostileTo(this.owner)?'Click: attack it':'Click: enter')+'</span>'}
}

/* a holding: the plain data of places.js (and what the world adds to it), with what it is and what it does from its kind.
   Saves keep the plain data; the class is put back from t.kind (holdingOf). */
class Holding extends HoldingObject{
  get T(){return HOLDING_TYPES[this.kind]}
  get label(){return this.T.n}
  // does its window offer this tab
  has(tab){return this.T.tabs.includes(tab)}
  // the troops it raises from one of its peoples
  hires(race){const c=RACES[race];return this.T.hires.map(k=>c[k])}
  // does its stable sell this mount (MOUNTS entry), in its climate
  sellsMount(M,clim){const m=this.T.mounts;if(m.includes(M.where))return true;if(M.where!=='any'&&M.where!=='town'&&M.where!=='castle'&&m.includes('local'))return M.race?this.races.includes(M.race):M.clim===clim;return false}
  // does it take a band in to stay (free: they know you, stay.js)
  takesGuests(free){return true}

  /* its parts, each kept aside (never saved: they work on the holding's own plain fields, which its save record keeps): its
     economy (world/economy.js Economy: stock, people, prices, its day), what it has built (world/buildings.js Buildings: estates,
     walls, projects), where its lots stand (world/lots.js Layout), its watch (world/patrols.js Watches: the day and night
     watches, t.watches) and each of its estates (world/estates.js Estate) */
  get econ(){return Economy.of(this)}
  get buildings(){return Buildings.of(this)}
  get layout(){return Layout.of(this)}
  get watch(){return Watches.of(this)}
  estate(k){return estateOf(this,k)}

  // its first day: its realm, garrison and peace, its estates and economy (its lots: layout.init); a generated world's economy
  // setting (doc/WORLD_DESIGN.md §4.1) on its first stocks (realms.js ECON_STOCK: poor or rich)
  setUp(){
    this.owner=this.lastOwner=HOME[this.name];this.gar=this.T.gar;this.sacked=this.raided=this.turmoil=0;this.grow=GROW0;
    this.buildings.init();
    this.econ.init();
    const e=WM.settings&&ECON_STOCK[WM.settings.economy];if(e)for(const g in this.stock)this.stock[g]=Math.round(this.stock[g]*e)}

  /* at war (siege.js): its walls, a siege, its garrison, ruin */
  walled(){return wallOf(this)>0}
  // the lords besieging it; while any are, or while you siege or raid it, it is besieged and closed: no trade, recruits, jobs or rest
  besiegers(){return W.lords.filter(l=>!l.dead&&l.state==='siege'&&l.tgt===this.name)}
  besieged(){
    const n=this.name;
    return W.lords.some(l=>!l.dead&&l.state==='siege'&&l.tgt===n)||!!(P.siege&&P.siege.town===n)||!!(P.raid&&P.raid.town===n)}
  closed(){return this.besiegers().length>0||!!mySiege(this)||!!myRaid(this)}
  // who holds the walls: the garrison, plus any lord of the owner resting inside
  defenders(){
    const lords=lordsInside(this);
    return{list:garList(this).concat(...lords.map(l=>l.troops)),lords}}
  // how hard the walls make the defenders: 1 + the wall level (no walls 1 … great walls 4), one less once your ram is built
  siegeLv(){return Math.max(1,1+wallOf(this)-((mySiege(this)||{days:0}).days>=RAM_DAYS?1:0))}
  // the most its garrison may hold (your fief's)
  garCap(){return this.T.gar+6+3*wallOf(this)}
  // sacked or raided, for now
  ruined(){return Timed.of(this).has('sacked')||Timed.of(this).has('raided')}
  // a fief pays its taxes (people x tax rate x prosperity) and market dues; Stewardship adds to what your fiefs pay
  fiefIncome(){return Math.round(this.econ.tax()*(1+.03*skill('stew')))}

  /* its people (realms.js): guards drafted from its volunteers, who leave its people; a holding needs at least GUARD_FLOOR left.
     Returns how many it could draft (up to n) */
  draft(n){
    this.econ.ensure();
    const k=Math.max(0,Math.min(n,Math.floor(this.vol||0),Math.floor((this.pop||0)-GUARD_FLOOR)));
    if(k){this.vol-=k;this.pop-=k}
    return k}
  canDraft(){return (this.vol||0)>=1&&(this.pop||0)-GUARD_FLOOR>=1}
  // its estates' fallen guards replaced from its people, first thing each day (estates.js Estate refillGuards)
  refillGuards(){
    if(!this.gd)return;
    for(const k in this.gd)this.estate(k).refillGuards()}
  // why its people would leave it (refugees.js), or '' if they stay
  fleeReason(){
    this.econ.ensure();const tm=Timed.of(this);
    return tm.has('sacked')?'sacked':tm.has('raided')?'raided':this.econ.foodDays()<1?'hunger':this.besieged()?'siege':this.pros<25?'hardship':tm.has('turmoil')&&this.pros<45?'conquest':this.layout.full()?'crowded':''}
  // where they go: the nearest holding not at war with it that is fed, unbesieged and clearly better off (crowded: one with room)
  refuge(){
    let best=null,bd=1e9;const crowded=this.layout.full()&&this.fleeReason()==='crowded';
    for(const o of TOWNS){if(o===this||!o.owner||o.besieged()||o.ruined()||atWar(o.owner,this.owner))continue;o.econ.ensure();if(crowded?(o.layout.housing()-(o.pop||0)<15||o.econ.foodDays()<3):(o.pros<this.pros+15||o.econ.foodDays()<3))continue;
      const d=Math.hypot(o.tx-this.tx,o.ty-this.ty);if(d<bd&&d<WORLD_SCALE.econ.refuge){bd=d;best=o}}
    return best}
  // its land over the day (territory.js): conquest burns the borderland, war and ruin shrink it, peace grows it
  landDay(){
    const t=this,was=Math.floor(t.grow||0);t.grow=t.grow==null?GROW0:t.grow;
    if(t.lastOwner!=null&&t.lastOwner!==t.owner)t.grow=Math.max(0,t.grow-2);
    t.lastOwner=t.owner;
    if(t.besieged()||Timed.of(t).has('sacked')||Timed.of(t).has('raided'))t.grow=Math.max(0,t.grow-.25);
    else if(t.grow<growCap(t))t.grow=Math.min(growCap(t),t.grow+GROW_DAY*(Timed.of(t).has('turmoil')?.5:1));
    const now=Math.floor(t.grow);if(t.owner==='player'&&now!==was)log(now>was?'The lands of '+t.name+' reach further.':'The lands of '+t.name+' shrink.',now>was?'good':'bad')}
  /* its record in a save (save.js worldSave): [owner, garrison, name, its state]. One founded while the world ran also keeps its
     plain data (base: its realm and HOLDING_DATA), so a load makes it again (fromRec); one the world made keeps its kind once
     that is no longer the kind it was made (kind), so a load puts the change back (holdingOf). (A save of the world as made is
     today's, byte for byte; v3 (doc/WORLD_DESIGN.md §9.3) will keep every holding's kind) */
  saveRec(){const t=this,d=MADE_HOLDINGS[TOWNS.indexOf(t)],x={s:t.sacked||0,r:t.raided||0,u:t.turmoil||0,g:t.grow,b:t.bld,w:t.wall,k:t.work,f:t.fear||0,cr:t.crime||null,wa:t.watches||null,
      l:(t.lots||[]).map(l=>({id:l.id,k:l.k,type:l.type,x:l.x,y:l.y,n:l.n,lv:l.lv,seed:l.seed,st:l.st,plots:l.plots,yaw:l.yaw})),e:t.stock?{st:t.stock,pop:t.pop,pros:t.pros,tax:t.tax,vol:t.vol,pf:t.popF}:null};
    {const m=Object.entries(t.mem||{}).filter(([k,d])=>d>G.day);if(m.length)x.m=Object.fromEntries(m)}
    {const g=Object.entries(t.gd||{}).map(([k,L])=>[k,L.filter(d=>d>G.day)]).filter(([k,L])=>L.length);if(g.length)x.gd=Object.fromEntries(g)}// (its estates' fallen guards, estates.js guardsBeaten: only while a post is empty)// (its people's memory of you, folk.js remembers: only while someone remembers)
    if(!d){x.base={realm:HOME[t.name]};for(const k of HOLDING_DATA)if(t[k]!==undefined)x.base[k]=t[k]}else if(t.kind!==d.kind)x.kind=t.kind;
    return [t.owner,t.gar,t.name,x]}
  // its state from its record (on the holding as the world first stood: useWorld)
  loadRec(o){const t=this,x=o[3];if(x.kind)holdingOf(t,x.kind);t.owner=o[0];t.gar=o[1];t.lastOwner=t.owner;
    t.sacked=x.s;t.raided=x.r;t.turmoil=x.u;t.grow=x.g;t.fear=x.f;t.crime=x.cr;if(x.wa)t.watches=x.wa;else delete t.watches;
    t.bld=x.b;t.wall=x.w;t.work=x.k;t.lots=x.l;if(x.m)t.mem=x.m;else delete t.mem;if(x.gd)t.gd=x.gd;else delete t.gd;
    const e=x.e;if(e){t.stock=e.st;t.pop=e.pop;t.pros=e.pros;t.tax=e.tax;t.vol=e.vol;t.popF=e.pf}return t}
  // a founded holding made again from its record
  static fromRec(o){return makeHolding(o[3].base).loadRec(o)}
}
class Village extends Holding{}
class Town extends Holding{}
class City extends Town{}
// a castle lodges only those it knows: it is a garrison, not an inn
class Castle extends Holding{takesGuests(free){return !!free}}
const HOLDING_CLASS={village:Village,town:Town,city:City,castle:Castle};
// make a plain holding one of its kind (and again when its kind changes)
function holdingOf(t,kind){if(kind)t.kind=kind;if(!HOLDING_TYPES[t.kind])throw new Error('No kind of holding called '+t.kind);Object.setPrototypeOf(t,HOLDING_CLASS[t.kind].prototype);return t}

/* the factory: a world's holdings, made from plain data (the classic places of places.js, or a generated world's) and while
   the world runs (addHolding, realms.js). TOWNS and CAMP_SPOTS are filled in place, so every reader keeps its reference, and a
   holding is never taken out (one that is lost is marked gone), so indices into TOWNS (LAND) stay as they were */
const TOWNS=[],HOME={};// HOME: the realm each holding starts under, by name
// where the bandit camps stand (sites.js makes a camp site on each; map.js moves each off roads and water first)
const CAMP_SPOTS=[];
// one holding from plain data, which stays as it was: its kind, its prices and its point. realm: who holds it at the start
function makeHolding(data){
  const {realm,...t}=JSON.parse(JSON.stringify(data));holdingOf(t);if(realm)HOME[t.name]=realm;
  if(t.mod){const r=t.races,c=t.clim,m=t.mod;
    // ammunition prices: elves make the best arrows, dwarves the best bolts
    if(m.arrows==null)m.arrows=r.includes('elf')?.7:1.1;if(m.bolts==null)m.bolts=r.includes('dwarf')?.7:1.15;
    // food prices by who lives there: orcs and the frost eat meat, ports and bogs fish, grassland villages sell milk, dwarves and farms cheese, elves and oases fruit
    const cheap={meat:r.includes('orc')||c==='frost',fish:t.style==='port'||t.style==='stilt'||c==='swamp',milk:!!t.T.rural&&c==='grass',cheese:r.includes('dwarf')||r.includes('human')&&c==='grass'&&!!t.T.rural,fruit:r.includes('elf')||c==='desert'};
    Object.keys(cheap).forEach((g,i)=>{if(m[g]==null){const v=((t.seed*37+i*13)%10)/50;m[g]=+(cheap[g]?.6+v:1.05+v*2).toFixed(2)}})}
  // a holding's point, where you reach it and where its name hangs: at its gate, centred under its centre building (which stands
  // on the holding's tile, its middle on that tile's left edge, its foot on that tile's bottom: lots.js)
  t.x=t.tx*TILE;t.y=(t.ty+1)*TILE+2;return t}
// a holding's plain data (as places.js gives it, its realm aside: HOME), what a founded one's save record keeps (saveRec)
const HOLDING_DATA=['name','style','races','kind','clim','tx','ty','col','seed','mod','note'];
// the plain data of the holdings a world was made with (setHoldings): TOWNS starts with them, in order; any after them were
// founded while it ran (addHolding)
let MADE_HOLDINGS=[];
// the holdings and bandit camps a world starts with, in place of the last world's
function setHoldings(list){MADE_HOLDINGS=list;TOWNS.length=0;for(const k in HOME)delete HOME[k];for(const d of list)TOWNS.push(makeHolding(d))}
// a world goes in again (a new game, a load: useWorld): the holdings founded in the last game are gone with it, before each
// holding the world made is put back as it first stood (worldmap.js)
onWorld(()=>{for(const t of TOWNS.splice(MADE_HOLDINGS.length))delete HOME[t.name]});
function setCamps(list){CAMP_SPOTS.length=0;for(const c of list)CAMP_SPOTS.push({tx:c.tx,ty:c.ty,x:(c.tx+.5)*TILE,y:(c.ty+.5)*TILE})}
// where a new game starts unless your people have a capital, and where reach is measured from
const startHolding=()=>TOWNS[0];
// a realm's capital: the city it starts with (one per realm). A people's: their own realm's (theirs alone, else one they share)
const realmCapital=f=>TOWNS.find(t=>HOME[t.name]===f&&t.kind==='city');
function capitalOf(race){const fs=Object.keys(FACS).filter(f=>FACS[f].races.includes(race)),f=fs.find(f=>FACS[f].races.length===1)||fs[0];return f&&realmCapital(f)||startHolding()}
