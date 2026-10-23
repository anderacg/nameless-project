'use strict';
/* ---------- estates: each holding's estates on the map (Estate: one per holding and kind), the land and fields they work, their
   guards, and the spoils when one is raided. What a holding has built (the estates' levels, walls, projects) is world/buildings.js
   Buildings; an estate's window, and the Estates section of the Fief, are ui/estate.js ---------- */
// Outdoor estates sit on a spot in the holding's land that suits them, where their workers go each day. What they make
// goes into the holding's stock (see economy.js); building needs gold and materials from that stock. Raids and sacks burn them.

/* ---------- on the map: an estate is a world object (worldobject.js WorldObject), as its holding is (holding.js
   HoldingObject). It answers a click on its building and its fields, in the holding's order of lots (HoldingObject pick), and is
   drawn with the holding's lots (structures.js holdingEnts, drawLotGround). ---------- */
// an estate: one per holding and kind, kept aside (never saved): town (its holding's name), k, and on the map its building's spot
// (x, y) and owner (fac) as they are when it is asked for (estatePick). What it does works on its holding's plain fields: its level
// (t.bld), its fields (its lot's plots), its sabotage (t.sab), its fallen guards (t.gd)
const ESTATE_OBJ=new WeakMap();
class Estate extends WorldObject{
  #t;
  constructor(t,k){super();this.#t=t;this.town=t.name;this.k=k}
  get mapKind(){return 'estate'}
  get est(){return true}
  chaseable(){return super.chaseable()&&!!bldLv(townBy(this.town)||{},this.k)}// (pulled down or burnt while you walk there: no more)
  get meetsAnyTime(){return true}
  meet(){estateMeet(this)}
  pick(at){}// (with its holding's lots, in their order: pickOn)
  pickOn(at,t,l){at.box(this,l.x*TILE,l.y*TILE,(l.x+l.n)*TILE,(l.y+l.n)*TILE,0);this.plotsAt(bldLv(t,this.k)).forEach(([x,y])=>at.box(this,x*TILE,y*TILE,(x+1)*TILE,(y+1)*TILE))}
  tip(){return '<b>'+ESTATES[this.k].n+'</b><small>Estate of '+this.town+'</small><span class="act">Click: look</span>'}
  // its holding
  get holding(){return this.#t}

  /* its fields (farms, pastures, quarries: PLOTS): the tiles it keeps, and those worked at a level */
  plots(){
    const l=lotAt(this.#t,this.k);
    return l&&l.plots||[]}
  plotsAt(lv){return this.plots().slice(0,PLOTS_AT[this.k]?PLOTS_AT[this.k](lv):0)}
  // the share of its fields it actually has at its level (no fields: it makes nothing); 1 for an estate that works none
  fieldShare(){
    const t=this.#t,k=this.k,lv=bldLv(t,k);
    if(!PLOTS[k]||!lv||!t.lots)return 1;
    return Math.min(1,this.plotsAt(lv).length/PLOTS_AT[k](lv))}
  // its worked fields: the tiles, and their middle (the plot nearest their centre, in pixels): where its workers work and its
  // animals graze. null: it has none (no fields, or none worked at its level)
  fields(){
    const t=this.#t,k=this.k,lv=bldLv(t,k),pl=lv&&PLOTS[k]?this.plotsAt(lv):[];if(!pl.length)return null;
    const cx=pl.reduce((a,p)=>a+p[0],0)/pl.length,cy=pl.reduce((a,p)=>a+p[1],0)/pl.length,m=pl.reduce((a,p)=>Math.hypot(p[0]-cx,p[1]-cy)<Math.hypot(a[0]-cx,a[1]-cy)?p:a);
    return{x:m[0]*TILE+TILE/2,y:m[1]*TILE+TILE-4,tiles:pl}}

  /* sabotage: idle until t.sab[k] */
  sabotaged(){
    const t=this.#t;
    return !!(t.sab&&t.sab[this.k]>G.day)}
  sabotage(){
    const t=this.#t;
    t.sab=t.sab||{};t.sab[this.k]=G.day+3+2*bldLv(t,this.k)}
  // the chance of slipping in unseen
  sabotageChance(){return clamp(.35+.03*skill('scout')+.02*P.attr.agi+(darkness()>.5?.2:0)-.06*bldLv(this.#t,this.k)-(partySize()>20?.1:0),.1,.9)}

  /* its guards (GUARDS): its own posts, less those fallen whose places are not filled yet, and some of the garrison when it stands
     near the walls */
  guardsDown(){
    const t=this.#t;
    return ((t.gd&&t.gd[this.k])||[]).filter(d=>d>G.day).length}
  nearWalls(){
    const t=this.#t,s=bldSpots(t)[this.k];
    return Math.hypot(s.x-t.x,s.y-t.y)<WORLD_SCALE.land.estateGuard*TILE}
  // its guards' kinds, as a fight would face them
  guards(){
    const t=this.#t,lv=bldLv(t,this.k),near=this.nearWalls(),n=Math.max(0,GUARDS.base+GUARDS.per*lv-this.guardsDown())+(near?Math.min(GUARDS.gar,t.gar||0):0),a=[];
    for(let i=0;i<n;i++){const c=RACES[t.races[i%t.races.length]];a.push(i%3===2?c.ranged:c.melee)}
    return a}
  // beaten (or fled the field): the guards there are gone, their own posts filled again one a day after GUARDS.refill days, the
  // garrison's men lost from the garrison
  guardsBeaten(){
    const t=this.#t,k=this.k,lv=bldLv(t,k),down=this.guardsDown(),own=Math.max(0,GUARDS.base+GUARDS.per*lv-down),near=this.nearWalls();
    t.gd=t.gd||{};const L=(t.gd[k]||[]).filter(d=>d>G.day),last=L.length?Math.max(...L):G.day+GUARDS.refill-1;for(let i=1;i<=own;i++)L.push(last+i);t.gd[k]=L;
    t.pop=Math.max(10,(t.pop||0)-own);// (the dead are the holding's people)
    if(near)t.gar=Math.max(0,(t.gar||0)-Math.min(GUARDS.gar,t.gar||0))}
  // a new day: each post whose time has come is filled from the holding's people (one person each); too few people left
  // (GUARDS.minPop) and it waits another day
  refillGuards(){
    const t=this.#t,L=t.gd[this.k];
    for(let i=0;i<L.length;i++)if(L[i]<=G.day){if((t.pop||0)>GUARDS.minPop){t.pop--;L.splice(i--,1)}else L[i]=G.day+1}
    if(!L.length)delete t.gd[this.k]}

  // what it makes a level a day: a mine's or a port's what its land holds (resources.js resOut), a pasture's what its herd gives
  // (critters.js herdMake), else its kind's (MAKE)
  makes(){
    const t=this.#t,k=this.k;
    return k==='mine'||k==='port'?resOut(t,k):k==='pasture'?herdMake(t):MAKE[k].out}

  /* its day's work (economy.js Economy produce): ws, how much of the work its holding's people staff; clim, the climate; add(g, n)
     into the holding's stock. Workshops first take their inputs: as many batches as the stock allows; farms, pastures and
     quarries make what their fields allow; a sabotaged one or one short of hands makes nothing or less */
  produce(ws,clim,add){
    const t=this.#t,k=this.k,st=t.stock,lv=bldLv(t,k),M=MAKE[k];
    if(!lv||!M.out||this.sabotaged())return;
    let f=lv*ws*this.fieldShare()*handsLeft(t,k);if(M.in)for(const g in M.in)f=Math.min(f,(st[g]||0)/M.in[g]);if(f<=0)return;
    if(M.in)for(const g in M.in)st[g]-=Math.round(M.in[g]*f);
    const O=this.makes();
    for(const g in O)add(g,O[g]*f*(k==='farm'?FARM_CLIM[clim]:1));
    if(k==='workshop'&&clim==='frost')add('furs',f)}
}
// a holding's estate of a kind (made once and kept aside), and the same placed on the map where its building stands
function estateOf(t,k){
  let m=ESTATE_OBJ.get(t);if(!m)ESTATE_OBJ.set(t,m={});
  return m[k]||(m[k]=new Estate(t,k))}
function estatePick(t,k){const o=estateOf(t,k),p=bldSpots(t)[k];o.x=p.x;o.y=p.y;o.fac=t.owner;return o}

/* where each estate stands: its placed building (lots.js). GROUND says what land each kind of estate works. */
const GROUND={
  open:(x,y)=>tAt(x,y)===T_OPEN,
  forest:(x,y)=>tAt(x,y)===T_FOREST,
  rock:(x,y)=>passable(tAt(x,y))&&(tAt(x,y)===T_HILL||[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>tAt(x+a,y+b)===T_MOUNT)),
  shore:(x,y)=>passable(tAt(x,y))&&tAt(x,y)!==T_ROAD&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>tAt(x+a,y+b)===T_WATER)
};
// the field tiles an estate keeps (farms, pastures, quarries), and those in use at a level (Estate plots, plotsAt)
const PLOTS={farm:6,pasture:4,quarry:3};
const PLOTS_AT={farm:lv=>2*lv,pasture:lv=>lv+1,quarry:lv=>lv};
// on an estate's worked fields (Estate fields: a little inside each tile's edge), and a spot somewhere on them
const onFields=(F,x,y)=>F.tiles.some(([tx,ty])=>x>=tx*TILE+2&&x<tx*TILE+TILE-2&&y>=ty*TILE+4&&y<ty*TILE+TILE-1);
const fieldSpot=F=>{const [tx,ty]=F.tiles[rint(0,F.tiles.length-1)];return{x:tx*TILE+rint(3,TILE-4),y:ty*TILE+rint(6,TILE-2)}};

// an estate's guards: GUARDS.base + GUARDS.per a level of its own, less those fallen whose places are not filled yet (t.gd[k]: the day each comes
// back, GUARDS.refill days after, one a day), and up to GUARDS.gar of the garrison when it stands near the walls
const GUARDS={base:1,per:1,refill:5,gar:2,minPop:20};// (own guards: base + per a level; gar: the garrison's most that stand with them)

// won the fight at an estate (from concludeEncounter): the spoils and the damage
function estateWon(e){
  const r=e.ref,t=townBy(r.town);if(!t)return '';ensureEcon(t);guardsBeaten(t,r.k);const lv=bldLv(t,r.k),M=MAKE[r.k]||{},got=[];
  if(r.sab){sabotage(t,r.k);const cost=wrong(t,{rep:CONDUCT.plunderEstate.rep,honor:CONDUCT.plunderEstate.honor});return ' You beat its guards and wreck the '+ESTATES[r.k].n.toLowerCase()+' of '+t.name+' anyway: idle for '+(t.sab[r.k]-G.day)+' days ('+cost+').'}
  for(const g in M.out||{}){const n=Math.min(t.stock[g]||0,Math.ceil(M.out[g]*Math.max(1,lv)*3));if(n<=0)continue;const k=invAdd('good',g,n);t.stock[g]-=n;if(k)got.push(k+' '+GOODS[g].n.toLowerCase())}
  const gold=rint(10,25)*Math.max(1,lv),c=r.burn?CONDUCT.burnEstate:CONDUCT.plunderEstate;P.gold+=gold;
  const cost=wrong(t,{rep:c.rep,honor:c.honor,fear:c.fear,pros:c.pros});
  if(r.burn){t.bld[r.k]=Math.max(0,lv-1);Timed.of(t).extend('raided',4);mood('cruel');syncLots(t);worldEmit('estate:burnt',{town:t,estate:r.k});
    worldEvent({involved:true,was:false,heard:['raid',bldSpots(t)[r.k]||t]})}// (your own burning: news to the world, never told back to you as a rumour: worldlog.js)
  return ' You '+(r.burn?'burn the '+ESTATES[r.k].n.toLowerCase()+' of '+t.name+' (now level '+bldLv(t,r.k)+')':'plunder the '+ESTATES[r.k].n.toLowerCase()+' of '+t.name)+': '+(got.length?got.join(', ')+' and ':'')+gold+' gold. Its workers flee and '+t.name+' grows poorer ('+cost+').';
}

/* drawn with every other placed building (structures.js: drawLotGround, lotEnts) */
const drawEstates=(cam,V)=>drawLotGround(cam,V);
const estateEnts=(ents,cam,V)=>lotEnts(ents,cam,V);
// (the estates' fallen guards replaced from the holding's people, first thing each day; then the estates' own day)
Systems.add({name:'estate guards',order:{day:10},day:()=>{for(const t of TOWNS)t.refillGuards()}});
Systems.add({name:'estates',order:{day:120},day:estateDay});

// (the older names: the estates' methods, and the holding's layout's spots)
const bldSpots=t=>Layout.of(t).spots();
const estatePlots=(t,k)=>estateOf(t,k).plots();
const plotsAt=(t,k,lv)=>estateOf(t,k).plotsAt(lv);
const fieldShare=(t,k)=>estateOf(t,k).fieldShare();
const fieldsOf=(t,k)=>t?estateOf(t,k).fields():null;
const sabotaged=(t,k)=>estateOf(t,k).sabotaged();
const guardsDown=(t,k)=>estateOf(t,k).guardsDown();
const estateGuards=(t,k)=>estateOf(t,k).guards();
const sabotageChance=(t,k)=>estateOf(t,k).sabotageChance();
const sabotage=(t,k)=>estateOf(t,k).sabotage();
const guardsBeaten=(t,k)=>estateOf(t,k).guardsBeaten();
const guardsDay=t=>t.refillGuards();
