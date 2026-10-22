'use strict';
/* ---------- what each holding has built: its estates' levels, its walls and the project underway (Buildings, the holding's
   t.buildings); split from estates.js, which keeps the estates themselves (Estate: their fields, workers and guards) ---------- */
// t.bld = {farm:lv, …}: 0 is none, up to its kind's estMax. t.wall = 0..its wallMax (holdings.js). t.work = {k, lv, done}: the project underway.
// Walls make defenders stronger, sieges longer and the garrison bigger; a breach on capture costs a level.
const bldCost=(k,lv)=>ESTATES[k].cost*lv*lv;
// what an estate needs built first (ESTATE_NEEDS), in words
const needsText=k=>Object.entries(ESTATE_NEEDS[k]||{}).map(([e,lv])=>ESTATES[e].n+' '+lv).join(' and ');
const buildDays=lv=>1+2*lv;
// (small readers of a holding's record, used on any: its walls' level, an estate's level)
const wallOf=t=>t.wall==null?t.T.wall0:t.wall;
const bldLv=(t,k)=>t.bld&&t.bld[k]||0;

/* what a holding has built (t.buildings): its estates' levels (t.bld: {farm: lv, …}, 0 none, up to its kind's estMax), its walls
   (t.wall) and the project underway (t.work). A part of the holding, kept aside (never saved), over its own plain fields */
const BUILDINGS=new WeakMap();
class Buildings{
  constructor(t){this.t=t}
  // a holding's buildings (made once and kept aside)
  static of(t){
    let b=BUILDINGS.get(t);
    if(!b)BUILDINGS.set(t,b=new Buildings(t));
    return b}
  // what an estate needs built first (ESTATE_NEEDS): is it all standing
  needsMet(k){return Object.entries(ESTATE_NEEDS[k]||{}).every(([e,lv])=>bldLv(this.t,e)>=lv)}
  // its estates' levels, added up
  total(){return Object.keys(ESTATES).reduce((a,k)=>a+bldLv(this.t,k),0)}
  // can it have this estate: it has one, or there is room and ground for one (kept: t._can)
  canHave(k){
    const t=this.t;
    if(lotAt(t,k))return true;t._can=t._can||{};if(t._can[k]!=null)return t._can[k];
    const type=ESTATE_LOT[k],n=lotSize(type),inner=INNER.includes(k),wb=t.layout.wallBox(),R=()=>.5;
    return t._can[k]=!!(inner?lotSpot(t,n,'open',1,9,R,{estate:true}):lotSpot(t,n,groundOf(k),3,k==='port'&&t.style==='port'?20:12,R,{estate:true,outside:wb&&{x0:wb.x0-1,y0:wb.y0-1,x1:wb.x1+1,y1:wb.y1+1},fields:PLOTS[k]?k:null,sea:k==='port'&&t.style==='port'}))}
  // the highest level it may raise an estate to (0: no room for one)
  cap(k){return this.canHave(k)?this.t.T.estMax:0}
  // what it starts with: what its land and trade suggest
  init(){
    const t=this.t,R=seeded(t.seed*131+7),m=t.mod||{},b={},v=!!t.T.rural,c=!!t.T.fort;
    const set=(k,lv)=>{b[k]=Math.min(this.cap(k),Math.max(0,lv))};
    set('farm',v?2:1+(m.grain<=.8?1:0));set('pasture',v?1:R()<.4?1:0);
    set('lumber',m.timber<=.75?2:R()<.5?1:0);set('mine',m.iron<=.8?2:resHas(t,'ore').some(g=>GOODS[g].base>=60)?1:R()<.4?1:0);
    set('port',t.style==='port'?2:R()<.3?1:0);set('workshop',c?0:m.cloth<=.85||m.furs<=.8?1+(v?0:1):0);set('market',c?0:v?0:1);
    set('quarry',m.iron<=1||c?1:R()<.3?1:0);set('smithy',v?0:1);set('brewery',v?(R()<.3?1:0):R()<.6?1:0);set('granary',c?1:R()<.3?1:0);
    t.bld=b;t.wall=t.T.wall0;t.work=null}
  // its estates and their levels, in words
  line(){
    const t=this.t,ks=Object.keys(ESTATES).filter(k=>bldLv(t,k));
    return (ks.length?ks.map(k=>ESTATES[k].n+' '+bldLv(t,k)).join(', '):'none')}

  /* its day: its project finishes (a siege holds it up), and a realm's holding now and then starts one; the frontier fortifies first */
  day(){
    const t=this.t;
    if(!t.bld)this.init();
    if(t.work){if(t.besieged())t.work.done++;else if(G.day>=t.work.done)this.finish()}
    if(t.owner==='player'||t.work||t.besieged()||t.ruined()||Math.random()>.05)return;
    // what to build: walls on the frontier, then whatever the holding is shortest of
    const front=TOWNS.some(o=>o!==t&&atWar(t.owner,o.owner)&&Math.hypot(o.tx-t.tx,o.ty-t.ty)<WORLD_SCALE.war.front);
    // a full holding builds a house first (its people have nowhere else to go)
    if(t.lots&&t.pop>=t.layout.housing()*.9&&!t.econ.lacking(HOUSE_COST.mats).length&&payRealm(t.owner,HOUSE_COST.gold)){if(this.start('house',HOUSE_DAYS))t.econ.take(HOUSE_COST.mats);else refundRealm(t.owner,HOUSE_COST.gold);return}// (no free plot: nothing spent)
    let k=null;if(wallOf(t)<t.T.wallMax&&(front||Math.random()<.2))k='wall';
    else{const ks=Object.keys(ESTATES).filter(e=>bldLv(t,e)<this.cap(e)&&(bldLv(t,e)||this.needsMet(e)));t.econ.ensure();
      // (each one's want worked out once, its random share drawn then, one a kind in the list's order, before the sort: the draws
      // never hang on the order the engine's sort compares in)
      const want=new Map(ks.map(e=>{const gs=ESTATES[e].goods;let w=gs.reduce((a,g)=>a+Math.max(0,1-(t.stock[g]||0)/t.econ.target(g)),0);if(e==='granary')w+=t.econ.foodDays()<5?.6:0;if(e==='market')w+=.3;return [e,w+Math.random()*.3]}));
      k=ks.sort((p,q)=>want.get(q)-want.get(p))[0]||null}
    if(!k)return;
    const lv=k==='wall'?wallOf(t)+1:bldLv(t,k)+1,mats=k==='wall'?WALL_MAT[lv]:ESTATE_MAT(k,lv),gold=k==='wall'?WALL_COST[lv]:bldCost(k,lv);
    if(t.econ.lacking(mats).length||!payRealm(t.owner,gold))return;
    t.econ.take(mats);this.start(k,lv);
    if(k==='wall'&&(t.owner===P.fac||Math.hypot(t.x-P.x,t.y-P.y)<vis()*1.5))log('The '+FACS[t.owner].n+' starts raising '+WALL_N[lv].toLowerCase()+' around '+t.name+'.')}
  // its project is done: a house stands, the walls or an estate go up a level
  finish(){
    const t=this.t,w=t.work;t.work=null;
    if(w.k==='house'){this.houseDone(w);if(t.owner==='player')log('A new house stands in '+t.name+'.','good');return}
    if(w.k==='wall')t.wall=Math.min(t.T.wallMax,wallOf(t)+1);else t.bld[w.k]=Math.min(this.cap(w.k),bldLv(t,w.k)+1);
    t.layout.sync();
    if(t.owner==='player')log((w.k==='wall'?'The centre of '+t.name+' is fortified: '+WALL_N[t.wall].toLowerCase():'The '+ESTATES[w.k].n.toLowerCase()+' of '+t.name+' reaches level '+t.bld[w.k])+'.','good')}
  // war's damage: burn n estates (fields and herds first); returns their names
  burn(n){
    const t=this.t,out=[];
    for(let i=0;i<n;i++){const ks=['farm','pasture','lumber','workshop','brewery','granary','market','smithy','quarry','mine','port'].filter(k=>bldLv(t,k));if(!ks.length)break;const k=ks[Math.random()<.6?0:rint(0,ks.length-1)];t.bld[k]--;out.push(ESTATES[k].n.toLowerCase())}
    if(t.work&&t.work.k!=='wall')t.work=null;t.layout.sync();return out}
  // its walls breached on capture: a level lost
  breach(){
    const t=this.t;
    t.wall=Math.max(0,wallOf(t)-1);if(t.work&&t.work.k==='wall')t.work=null;t.layout.sync()}

  /* projects. Building takes time: more people build faster (between 0.6 and 2 times the pace of a holding of its usual size) */
  speed(){
    const t=this.t;
    return Math.max(.6,Math.min(2,(t.pop||t.T.pop0)/t.T.pop0))}
  days(lv){return Math.max(1,Math.ceil(buildDays(lv)/this.speed()))}
  // how far its project has got, 0..1
  progress(){
    const w=this.t.work;if(!w)return 0;
    const tot=Math.max(.01,w.done-(w.start!=null?w.start:w.done-buildDays(w.lv)));
    return Math.max(0,Math.min(1,1-(w.done-G.day-Clock.frac)/tot))}
  // a project begins: a new estate's building goes up on its spot (at: chosen, else the best free one) as a building site; a
  // house on the best free plot (lots.js lotSpot); false (and no project) when there is none
  start(k,lv,at){
    const t=this.t;t.work={k,lv,done:G.day+this.days(lv),start:G.day};
    if(k==='house'){const R=seeded(G.day*31+t.seed+(t.lots||[]).length),type=typeFor(t,'house',R),n=lotSize(type),p=at||lotSpot(t,n,'open',1,9,R,{gap:'row',jit:.8});
      if(!p){t.work=null;return false}t.work.lot=t.layout.add({k:'house',type,x:p[0],y:p[1],n,lv:1,seed:Math.floor(R()*1e6),st:'building'}).id;return true}
    if(k!=='wall'&&ESTATES[k]){const l=lotAt(t,k);if(!l)t.layout.estateLot(k,null,at,'building');else if(!bldLv(t,k)){l.st='building';l._s=null}}
    return true}
  // a house is finished
  houseDone(w){const l=LOT[w.lot];if(l){l.st='built';l._s=null}}
  // your order for a new house (at: its plot, placed by hand): gold first, its materials once it starts; true once it starts
  house(at){
    const t=this.t;
    if(t.work||P.gold<HOUSE_COST.gold||t.econ.lacking(HOUSE_COST.mats).length)return false;P.gold-=HOUSE_COST.gold;
    if(!this.start('house',HOUSE_DAYS,at)){P.gold+=HOUSE_COST.gold;return false}
    t.econ.take(HOUSE_COST.mats);
    log('Builders start on a new house in '+t.name+'.');
    return true;
  }
  // your order: fortify, or place or raise an estate (at: its spot, placed by hand)
  build(k,at){
    const t=this.t;
    if(t.work)return;
    if(k==='wall'){const n=wallOf(t)+1;if(n>t.T.wallMax||P.gold<WALL_COST[n]||t.econ.lacking(WALL_MAT[n]).length)return;P.gold-=WALL_COST[n];t.econ.take(WALL_MAT[n]);this.start(k,n);log('Masons start on '+WALL_N[n].toLowerCase()+' at '+t.name+'.');return}
    if(!ESTATES[k])return;at=at||null;const lv=bldLv(t,k);if(lv>=this.cap(k)||!lv&&!this.needsMet(k))return;
    const c=bldCost(k,lv+1),mats=ESTATE_MAT(k,lv+1);if(P.gold<c||t.econ.lacking(mats).length)return;
    P.gold-=c;t.econ.take(mats);this.start(k,lv+1,at);log('Work starts on the '+ESTATES[k].n.toLowerCase()+' of '+t.name+'.')}
  // pull a building down: half of what it last cost comes back; its estate is gone
  demolish(l){
    const t=this.t;
    if(!l||l.k==='centre')return;
    if(ESTATES[l.k]){const lv=bldLv(t,l.k),back=Math.floor(bldCost(l.k,Math.max(1,lv))/2);t.bld[l.k]=0;if(t.work&&t.work.k===l.k)t.work=null;P.gold+=back;t.layout.drop(l);log('The '+ESTATES[l.k].n.toLowerCase()+' of '+t.name+' is pulled down (+'+back+' gold).');return}
    if(t.work&&t.work.lot===l.id)t.work=null;P.gold+=HOUSE_COST.gold>>1;t.layout.drop(l);log('A house in '+t.name+' is pulled down (+'+(HOUSE_COST.gold>>1)+' gold).')}
}
// (the older names: the buildings' methods)
const needsMet=(t,k)=>Buildings.of(t).needsMet(k);
const bldTotal=t=>Buildings.of(t).total();
const canHave=(t,k)=>Buildings.of(t).canHave(k);
const bldCap=(t,k)=>Buildings.of(t).cap(k);
const initEstates=t=>Buildings.of(t).init();
const estateLine=t=>Buildings.of(t).line();
const finishWork=t=>Buildings.of(t).finish();
const burnEstates=(t,n)=>Buildings.of(t).burn(n);
const breach=t=>Buildings.of(t).breach();
const buildAct=(t,k,at)=>Buildings.of(t).build(k,at);
// once a day: every holding's buildings (Buildings day)
function estateDay(){
  for(const t of TOWNS)t.buildings.day()}
