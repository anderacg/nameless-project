'use strict';
/* ---------- march styles (the owner, 2026-10-31: AI armies "bunch too close" round their leader; room between groups, and
   styles like a real battle setup, so you read an army's intent from its order on the march). Every army not yours, with no
   layout saved, stands in one of MARCH_STYLES (march.js marchLayout, each time its rows change): chosen by its kind (a band, a
   beast pack, a caravan), else its troops' race as a battle captain reads it (commander.js temperFor: orcs come on, dwarves hold
   the line, elves keep their distance), else a lord's errand (to war, a siege or a relief, in a marshal's host, riding out to
   defend his land: offensive; home, patrol or rest: defensive), else defensive.
   Each group goes by its kind (data/matchups.js unitClass, a beast, its leader) to a place [band, form, ranks]. Bands front to
   back, van, main and rear: groups abreast gap px apart, at most wrap abreast a rank (the first in the middle, the rest out to
   either side); wings beside the band it flanks (flank: the main unless said), right then left. ring: round the middle (a pack
   round its leader or its biggest group, a caravan's guards round its wagon, facing out). Its form when its men suit it (FORMS
   who, a wedge WEDGE.min riders at least, a pack two), else loose, else a line; ranks: its depth (its files from its men). gap
   and margin (px its farthest man stands inside its ring, every army's: march.js marchOuter) are the world map's px ---------- */
const MARCH_STYLES={gap:8,margin:4,wrap:3,
  styles:{
    // (riders forward in wedges, the infantry behind the centre round its leader, the shooters at the rear)
    offensive:{cav:['van','wedge'],leader:['main'],spear:['main','line',3],foot:['main','line',3],beast:['main','pack'],ranged:['rear','line',2],magic:['rear','line',2]},
    // (a spear or shield line in front, the shooters behind it round its leader, the riders in columns on the flanks)
    defensive:{spear:['van','line',3],foot:['van','line',3],leader:['main'],ranged:['main','line',2],magic:['main','line',2],cav:['wings','column'],beast:['rear','pack']},
    // (a loose screen of foot, the archers out on its sides, the chief and any riders behind it)
    screen:{flank:'van',foot:['van','loose',4],spear:['van','loose',4],leader:['main'],cav:['main','line',2],ranged:['wings','loose',5],magic:['wings','loose',5],beast:['rear','pack']},
    // (a loose pack round its leader, else its biggest group)
    pack:{ring:'pack',all:['ring','pack']},
    // (the guards round the wagon, each facing out)
    convoy:{ring:'out',all:['ring','line',2]},
    // (yours, the owner, 2026-11-01: battle lanes, as a battle opens from it: the infantry in front, the mages a step behind it beside
    // your hero, the archers and crossbows behind them, the riders on the flanks a little back. own: each group keeps its own
    // formation (the march window's); wrap, span: so many of a kind abreast, a rank no wider than span of its widest groups; mid:
    // your hero (its leader) at the middle, on the lanes' line; flank: a list, each wing beside whichever it stands least far out)
    lanes:{own:true,mid:true,wrap:4,span:2,flank:['main','rear'],spear:['van'],foot:['van'],leader:['main'],magic:['main'],ranged:['rear'],cav:['wings'],beast:['rear']}},
  // (yours, and any army with a layout saved: its groups not placed stand where this one puts them)
  yours:'lanes',
  kind:{band:'screen',monster:'pack',caravan:'convoy'},
  race:{orc:'offensive',dwarf:'defensive',elf:'screen'},
  errand:{march:'offensive',siege:'offensive',relieve:'offensive',host:'offensive',defend:'offensive'},
  base:'defensive'};
// (an army's race as a battle captain reads it, commander.js temperFor: the race of 60% of its raced troops, else mixed; null when
// under half its troops have one. groups: its roster's)
function marchRace(groups){const n={};let all=0,raced=0;for(const g of groups){all+=g.count;const k=ST[g.type]?.race;if(k){n[k]=(n[k]||0)+g.count;raced+=g.count}}
  if(!raced||raced*2<all)return null;const top=Object.keys(n).sort((a,b)=>n[b]-n[a])[0];return n[top]>=raced*.6?top:'mixed'}
// (a row's place in a style: its leader (a band's chief among its troops too), a beast, else its battle class)
const marchRole=(row,o)=>{if(row.character||o.ld&&row.type==='chief')return 'leader';const S=ST[row.type];return !S?'foot':S.beast||S.big?'beast':unitClass(S)};
// (whether form f suits a row's men: FORMS who; a wedge WEDGE.min riders at least, a pack two; a leader in a line)
const marchFormOk=(row,f)=>{const F=FORMS[f];return !!F&&(!F.who||!!ST[row.type]&&FORM_WHO[F.who]({s:ST[row.type]}))&&(!F.wedge||row.count>=WEDGE.min)&&(!F.pack||row.count>1)&&(!row.character||f==='line')};
// (a group's half depth and half width as it stands facing the army's way, its bodies included: world px)
function marchHalf(row){let hx=0,hy=0;for(const [x,y] of formSlots(mapForm(row.form),row.count,0,row.files,WORLD_BATTLE.sprite*marchRoomK(row))){hx=Math.max(hx,Math.abs(x));hy=Math.max(hy,Math.abs(y))}
  const b=marchPad(row);return{hx:hx/WORLD_BATTLE.scale+b,hy:hy/WORLD_BATTLE.scale+b}}
class MarchStyle{
  constructor(key){this.key=key;this.def=MARCH_STYLES.styles[key]}
  static of(key){return (MarchStyle.made||(MarchStyle.made={}))[key]||(MarchStyle.made[key]=new MarchStyle(key))}
  // the style an army takes (groups: its roster's, its leader aside)
  static pick(o,groups){const T=MARCH_STYLES;return T.kind[o.mapKind]||T.race[marchRace(groups)]||(o.mapKind==='lord'?T.errand[o.defend?'defend':o.follow||o.with?'host':o.state]:null)||T.base}
  // rows (march.js marchLayout: id, type, count, character) laid out: each its form, files, facing and spot (x forward, y right)
  lay(rows,o){
    const D=this.def,laid=rows.map(r=>{const role=marchRole(r,o),[band,want='line',ranks=1]=D[role]||D.all||['main','line',3],form=D.own?r.form:[want,'loose','line'].find(f=>marchFormOk(r,f));
      const files=D.own?r.files:form==='line'||form==='loose'?Math.ceil(r.count/ranks):form==='column'?1:null,row={...r,face:D.own?r.face:0,form,files,role,band};return Object.assign(row,marchHalf(row))});
    if(this.def.ring)this.round(laid);else this.bands(laid);
    return laid.map(({role,band,hx,hy,...r})=>r);
  }
  // van, main and rear front to back, a rank of at most wrap abreast at a time (its leader first: your hero before your companions),
  // and no wider than span of its widest groups abreast (mid: its leader on the army's line, the rest of his rank beside him); then
  // the wings beside the band they flank (flanks: a list); centred (mid: on its leader)
  bands(laid){
    const D=this.def,G=MARCH_STYLES.gap,W=D.wrap||MARCH_STYLES.wrap,wide=D.span?D.span*(2*Math.max(...laid.filter(r=>r.band!=='wings').map(r=>r.hy))+G)-G:Infinity,first=r=>r.role!=='leader'?0:r.id==='hero'||r.id==='leader'?2:1,by=k=>laid.filter(r=>r.band===k).sort((a,b)=>first(b)-first(a)),span={};let x=0;
    for(const k of ['van','main','rear'])for(let i=0,n,list=by(k);i<list.length;i+=n){
      for(n=1;i+n<list.length&&n<W&&list.slice(i,i+n+1).reduce((w,r)=>w+2*r.hy+G,-G)<=wide+1e-9;n++);
      const rank=list.slice(i,i+n).reduce((a,r,j)=>(j%2?a.unshift(r):a.push(r),a),[]),d=Math.max(...rank.map(r=>r.hx));let y=-(rank.reduce((n,r)=>n+2*r.hy,0)+G*(rank.length-1))/2;
      for(const r of rank){r.x=x-d;r.y=y+r.hy;y+=2*r.hy+G}const c=D.mid&&rank.find(r=>first(r)===2);if(c){const dy=c.y;for(const r of rank)r.y-=dy}span[k]={x0:x-2*d,x1:span[k]?.x1??x};x-=2*d+G}
    // (each wing beside whatever stands at its depth, right then left, by the band it flanks (flank: the main band unless said),
    // else the main band, the van, the rear)
    if(Array.isArray(D.flank))this.flanks(laid,span);
    else{const at=span[D.flank||'main']||span.main||span.van||span.rear,mid=at?(at.x0+at.x1)/2:0,side=[0,0];by('wings').forEach((r,i)=>{const s=i%2?-1:1,clear=Math.max(side[i%2],...laid.filter(q=>q.band!=='wings'&&q.x!=null&&Math.abs(q.x-mid)<q.hx+r.hx+G).map(q=>s*q.y+q.hy));
      r.x=mid;r.y=s*(clear+G+r.hy);side[i%2]=clear+G+2*r.hy})}
    let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;for(const r of laid){x0=Math.min(x0,r.x-r.hx);x1=Math.max(x1,r.x+r.hx);y0=Math.min(y0,r.y-r.hy);y1=Math.max(y1,r.y+r.hy)}
    const c=D.mid&&laid.find(r=>first(r)===2),cx=c?c.x:(x0+x1)/2,cy=c?c.y:(y0+y1)/2;for(const r of laid){r.x-=cx;r.y-=cy}
  }
  // (each wing beside one of the bands its style lists (flank), either side, where it stands least far out from the army's line, the
  // first so in a tie; clear of all that stands at that depth, the wings before it too)
  flanks(laid,span){
    const G=MARCH_STYLES.gap,ks=this.def.flank.filter(k=>span[k]);
    for(const r of laid.filter(r=>r.band==='wings')){let best=null;
      for(const k of ks.length?ks:[null])for(const s of [1,-1]){const mid=k?(span[k].x0+span[k].x1)/2:0,out=Math.max(0,...laid.filter(q=>q!==r&&q.x!=null&&Math.abs(q.x-mid)<q.hx+r.hx+G).map(q=>s*q.y+q.hy))+G+2*r.hy;
        if(!best||out<best.out)best={x:mid,y:s*(out-r.hy),out}}
      r.x=best.x;r.y=best.y}
  }
  // round the middle (a pack: its leader, else its biggest group there; a caravan: its wagon), the first in front, each as near as
  // keeps a gap from what stands in the middle (by its shape that way) and from its neighbours; facing out round a wagon
  round(laid){
    const G=MARCH_STYLES.gap,out=this.def.ring==='out',c=out?null:laid.find(r=>r.role==='leader')||laid.reduce((a,r)=>r.count>a.count?r:a,laid[0]),ring=laid.filter(r=>r!==c),n=ring.length,big=Math.max(0,...ring.map(marchExtent));
    const reach=(r,a)=>Math.abs(Math.cos(a))*r.hx+Math.abs(Math.sin(a))*r.hy,wagon=marchBodyOf('militia')*WORLD_BATTLE.sprite/WORLD_BATTLE.scale/2,at=i=>i/n*2*Math.PI;
    const R=Math.max(n>1?(2*big+G)/(2*Math.sin(Math.PI/n)):0,...ring.map((r,i)=>(c?reach(c,at(i)):wagon)+(out?r.hx:reach(r,at(i)))+G));
    if(c){c.x=0;c.y=0}ring.forEach((r,i)=>{r.x=Math.cos(at(i))*R;r.y=Math.sin(at(i))*R;if(out)r.face=at(i)});
  }
}
/* ---------- travel styles (the owner, 2026-11-01: "when travel by road it will force the marching to columns in order to snap
   them near the road, this should apply for all armies, otherwise no road bonus ... a travelling style based on army types";
   doc/LIVE_WORLD_DESIGN.md §6). Each army marches in its battle style (MARCH_STYLES) or in a column (MarchColumn), by its kind
   (kinds: TravelStyle's rule for it; none: never): a caravan always; a lord on a trip of more than long px while no realm at war
   with his holds land within near px; a patrol on its beat, hunting nothing; yours with By road on (world.js P.byRoad) and a road
   near; a companion's party on a trip of its own of more than long px; bands and beasts never; an army in a host (following you,
   or a marshal: hosts.js) keeps its place in the host's own column of armies, in its battle style. A column that detects a foe
   (threat: one that any of its men sees, each alert px times his kind's share (data/world.js SIGHT_KIND: a rider farther, a man on
   foot less, a scout far farther; fog.js armySight), to its ring; yours, in your sight too; or your army, hostile to it, that it
   sees or fears) takes its battle style at once; its head sees furthest down the road. menSight (the owner, 2026-11-01: "the army
   should depend on all units' capabilities"): by its men, for an army marched man by man (near you: march.js marchMen); else, or
   off, alert px round its ring, as before. One ambushed (the foe unseen: lying in wait, waylay.js) stays a column till contact, so its world battle opens
   strung out (worldbattle.js: from where its men stand). Decided again every every frames (WORLD_LOD.n) or when its trip changes,
   never each frame; none while a battle is on. on false: no columns, and an army's ground read at its point (world.js
   armyGround), as before.
   sample: the men whose ground is the army's (armyGround); share: of a road's bonus an army not marched man by man gets at its
   point when it is no column (it would stand across the road);
   column: width px between the two of a rank (their bodies' if more); rank: from one rank to the next, × its biggest body (a man
   marching keeps that much room before him: march.js MarchArmy step, his probe); crumb px between the trail's points; leap px past
   which the trail starts afresh; cart px of it a caravan's wagon, ox and drover take; look, lag: a man trailing his place on the
   march steers look px on along its way from where he is, if no more than lag px behind it (the lag of a man at pace, and a
   little: MarchColumn steer); glide: the army's point, its middle along its way, goes there at most glide × its step a moment
   (into a column: no jump); about: its head turning back on its way (the cos of the turn under this), it turns about: the file
   where it stands, its tail the head (march.js MARCH_MOVE.about; off: out of its column and into a new one); forming (MarchArmy
   step): over once form of its men stand within place px of their places, or after most s; meanwhile its guide goes slow of the way it is moved, [into a column, out of one: one that has seen a foe all but halts
   to deploy]; lordKeep: a lord on a trip of more than long px keeps to the roads a little, off them a tile costing that many times
   as much (router.js wayKeep, as your By road's ROAD_GO.keep), so his column gets the road's pace (brains.js LordBrain way); 1: as
   before ---------- */
const TRAVEL_STYLES={on:true,every:6,long:400,near:160,alert:150,menSight:true,lordKeep:1.1,sample:8,share:.35,
  column:{width:6,rank:1.6,crumb:3,leap:40,cart:34,form:.8,place:4,most:3,slow:[.6,.15],look:4,lag:18,glide:2,about:-.7},
  kinds:{caravan:'always',lord:'far',patrol:'beat',you:'byRoad',cparty:'far',band:null,monster:null}};
// (each army's decision: {n: the frame it was made, col, k and k2: its trip then})
const TRAVEL_SEEN=new WeakMap();
class TravelStyle{
  // whether o marches in a column now
  static column(o){const T=TRAVEL_STYLES;if(!T.on||!o||B)return false;let c=TRAVEL_SEEN.get(o);if(!c)TRAVEL_SEEN.set(o,c={n:-Infinity,col:false,k:null,k2:null});
    const n=WORLD_LOD.n;if(this.trip(o,c)||n-c.n>=T.every||n<c.n){c.n=n;c.col=this.decide(o)}return c.col}
  // (decided afresh when next asked)
  static forget(o){TRAVEL_SEEN.delete(o)}
  static decide(o){const r=TRAVEL_STYLES.kinds[o===P?'you':o.mapKind];return !!r&&!o.dead&&!o.gone&&!o.inside&&!inFight(o)&&this[r](o)&&!this.threat(o)}
  // (what its trip is: true when that changed since it was decided)
  static trip(o,c){const m=o.mapKind,k=o===P?!!P.byRoad:m==='lord'?o.tgt:m==='cparty'?o.order:m==='caravan'?o.to:o.hunt,k2=o===P?G.byRoad:o.state;
    if(k===c.k&&k2===c.k2)return false;c.k=k;c.k2=k2;return true}
  static always(){return true}
  // (a lord or a companion's party far from where it is bound: a lord about his realm's business, through land of no realm at war
  // with his. One in a host (following you, or a marshal: hosts.js) keeps its place in the host's own column of armies, its rings
  // one behind another, in its battle style)
  static far(o){const L=TRAVEL_STYLES.long;
    if(o.follow||o.with||o.mapKind==='cparty'&&o.order==='follow')return false;
    if(o.mapKind==='cparty'){const t=o.order==='return'?P:o.order==='stay'?townBy(o.base):null;return !!t&&Math.hypot(t.x-o.x,t.y-o.y)>L}
    if(o.waylay||o.defend||!(o.state==='march'||o.state==='home'||o.state==='patrol'||o.state==='relieve'))return false;
    const t=townBy(o.tgt);return !!t&&Math.hypot(t.x-o.x,t.y-o.y)>L&&!this.enemyLand(o)}
  // (a patrol walking its beat, hunting nothing)
  static beat(p){return !p.hunt&&!p.waylay}
  // (yours: By road on and a road near the way you go, or where you stand; not in a lord's host, hosts.js)
  static byRoad(){return !!P.byRoad&&!P.stay&&!P.camp&&!Host.under&&(P.tx!=null?byRoadTo(P.tx,P.ty):roadNear(P.x,P.y,ROAD_GO.near))}
  // (land of a realm at war with o's within near px: where it stands and eight ways round, half and all the way out)
  static enemyLand(o){const R=TRAVEL_STYLES.near,f=o.fac;if(!f)return false;
    for(let k=0;k<17;k++){const r=k?k>8?R:R/2:0,a=k*Math.PI/4,h=landHold(o.x+Math.cos(a)*r,o.y+Math.sin(a)*r);if(h&&h.owner&&h.owner!==f&&atWar(f,h.owner))return true}return false}
  // (a foe it has detected: your army, hostile to it, that it sees or fears (engage.js fearSeen); any other its men see (menSight:
  // marched man by man, its march), else within alert px)
  static threat(o){if(o!==P&&!P.stay&&armyRelation(o,P)<0&&(TravelAwareness.sees(o)||fearSeen(o)))return true;
    const a=TRAVEL_STYLES.menSight?marchMen(o):null;
    return this.foeIn(o,W.lords,a)||this.foeIn(o,bandits,a)||this.foeIn(o,W.patrols,a)||this.foeIn(o,W.caravans,a)||this.foeIn(o,W.monsters,a)||this.foeIn(o,cparties(),a)}
  // (one of list hostile to o that it can see: to yours, in your sight (worldobject.js spotted); to any other, none lying in wait
  // (waylay.js); a beast only one that falls on armies. Its ring (march.js marchOuter: where they would meet) within an eye of its
  // men (a: its march; fog.js armySight, each alert px times his kind's share, made only once one is near enough to ask), else within
  // alert px of its ring)
  static foeIn(o,list,a=null){const T=TRAVEL_STYLES,R=T.alert+marchOuter(o),F=a?marchOuter(o)+T.alert*sightMost()+T.alert:R+T.alert;
    for(let p of list){if(p===o||p.dead||p.gone||p.inside||p.fight||Math.abs(p.x-o.x)>F||Math.abs(p.y-o.y)>F)continue;
      if(list===W.monsters){p=asMonster(p);const M=MONSTERS[p.id];if(!M||!(M.aggro||M.mythic))continue}
      if((a||Math.hypot(p.x-o.x,p.y-o.y)<=R+marchOuter(p))&&armyRelation(o,p)<0&&(o===P?spotted(p):!p.waylay)&&(!a||armySight(a,T.alert).sees(p.x,p.y,1,marchOuter(p))))return true}
    return false}
}
/* a guide's trail (as a host leader's crumbs, hosts.js, kept in numbers: nothing made as it grows): a point each crumb px it goes,
   the newest last, as many as it has room for; a leap past leap px starts it afresh */
class MarchTrail{
  constructor(cap=64){this.x=new Float64Array(cap);this.y=new Float64Array(cap);this.i=0;this.n=0}
  clear(){this.n=0}
  // (the k-th point back, 0 the newest: its index)
  at(k){const c=this.x.length;return (this.i-1-k+2*c)%c}
  add(x,y){const C=TRAVEL_STYLES.column;if(this.n){const j=this.at(0),d=Math.hypot(x-this.x[j],y-this.y[j]);if(d<C.crumb)return;if(d>C.leap)this.n=0}
    this.x[this.i]=x;this.y[this.i]=y;this.i=(this.i+1)%this.x.length;if(this.n<this.x.length)this.n++}
  // (room for len px of it: made bigger, its points kept, only when a longer column needs it)
  room(len){const c=Math.ceil(len/TRAVEL_STYLES.column.crumb)+8;if(c<=this.x.length)return;const x=new Float64Array(c),y=new Float64Array(c);
    for(let k=this.n-1,i=0;k>=0;k--,i++){const j=this.at(k);x[i]=this.x[j];y[i]=this.y[j]}this.x=x;this.y=y;this.i=this.n%c}
}
/* a column (TRAVEL_STYLES.column), made with its army's rows (march.js marchLayout): its men 2 abreast in its battle style's order,
   front to back (its rows by how far forward they stand: the van, the main body with its leader, the rear; a caravan's guards half
   before its wagon and half after), each rank rank px behind the one before it, more for bigger bodies. lay: each man's place back
   along its guide's trail (MarchTrail), the trail's way at his rank, his side of it; past the trail's end, straight on the way it
   went (no trail yet: behind its guide as it faces). Its point (cx, cy): the trail's at its middle (a caravan's: its wagon's), the
   army's own (march.js MarchArmy step: ox, oy past its head); reach: px from there to its farthest place's man's edge (on the
   march its men trail their places a little, TRAVEL_STYLES.column.lag) */
// (a column's rows front first: by how far forward each stands (its style's van, the main body round its leader, the rear); yours
// in the order you set (the Army window's March formation, By road: P.army.column, ids front first), a row not in it at its default
// place, after the one before it there. saved: an order to use instead (the editor's draft; null: the default))
function columnOrder(o,rows,saved=o===P?o.army?.column:null){
  const by=rows.slice().sort((a,b)=>b.x-a.x);if(!Array.isArray(saved)||!saved.length)return by;
  const out=[...new Set(saved)].map(id=>by.find(r=>r.id===id)).filter(Boolean);
  by.forEach((r,i)=>{if(out.includes(r))return;let j=i-1;while(j>=0&&!out.includes(by[j]))j--;out.splice(j<0?0:out.indexOf(by[j])+1,0,r)});return out}
class MarchColumn{
  constructor(rows,o){
    const C=TRAVEL_STYLES.column,k=WORLD_BATTLE.sprite/WORLD_BATTLE.scale,men=[],S=[],T=this.T=[];let s=0,d0=0;this.mid=null;
    for(const r of columnOrder(o,rows))for(let i=0;i<r.count;i++)men.push([r,i]);
    const cart=marchCentrePiece(o),cut=cart?2*Math.ceil(men.length/4):-1,rank=d=>{s+=S.length?(d0+d)/2:0;S.push(s);d0=d};
    for(let i=0;i<men.length;){
      if(i===cut&&this.mid==null){rank(C.cart);this.mid=s;continue}
      const pair=men.slice(i,i+2),body=Math.max(...pair.map(([r])=>marchBodyOf(r.type)*k)),w=Math.max(C.width,body)/2;rank(C.rank*body);
      pair.forEach(([r,j],q)=>T.push({row:r.id,index:j,type:r.type,character:r.character,rank:S.length-1,side:pair.length>1?(q?-w:w):0,x:0,y:0,hx:1,hy:0}));i+=2}
    if(cart&&this.mid==null){rank(C.cart);this.mid=s}
    const n=S.length;this.s=Float32Array.from(S);this.rx=new Float32Array(n);this.ry=new Float32Array(n);this.ru=new Float32Array(n);this.rv=new Float32Array(n);this.ri=new Int32Array(n);
    if(this.mid==null)this.mid=s/2;this.len=s;this.reach=Math.max(this.mid,s-this.mid)+Math.max(C.width,...T.map(t=>marchBodyOf(t.type)*k))+MARCH_RING.pad;this.cx=this.cy=this.ox=this.oy=0;
    this.nv=0;this.vx=this.vy=this.va=new Float64Array(0);this.back=false;this.lat=0;
  }
  // (its ranks the other way round, its tail the head: each man's place where it was, his side of the way too; back: so turned)
  flip(){const S=this.s,n=S.length,L=this.len;S.reverse();for(let r=0;r<n;r++)S[r]=L-S[r];for(const t of this.T){t.rank=n-1-t.rank;t.side=-t.side}this.mid=L-this.mid;this.back=!this.back}
  /* (about face, march.js MARCH_MOVE.about: the file turns where it stands, its tail the head. Its way as last laid, from its head to
     its tail, made its guide's trail tr (the tail's end the newest), its ranks flipped; its new head's point into out) */
  turn(tr,out){const C=TRAVEL_STYLES.column,L=this.len;tr.clear();tr.room(L+C.leap);for(let s=0;;s=Math.min(L,s+C.crumb)){this.at(s,0,out);tr.add(out.x,out.y);if(s>=L)break}this.flip();return out}
  // (the point s px back along its way (as last laid) from its head, lat px to a side (as a man's side): into out)
  at(s,lat,out){const X=this.vx,Y=this.vy,A=this.va;let i=0;while(i<this.nv-2&&A[i+1]<s)i++;const L=A[i+1]-A[i]||1,ux=(X[i+1]-X[i])/L,uy=(Y[i+1]-Y[i])/L,f=(s-A[i])/L;
    out.x=X[i]+(X[i+1]-X[i])*f+uy*lat;out.y=Y[i]+(Y[i+1]-Y[i])*f-ux*lat;return out}
  // (px back along its way from its head to the point of it nearest x, y; lat: px x, y stands to its side there (as a man's side))
  along(x,y){const X=this.vx,Y=this.vy,A=this.va;let best=Infinity,bs=0;this.lat=0;
    for(let i=0;i<this.nv-1;i++){const L=A[i+1]-A[i];if(!L)continue;const dx=X[i+1]-X[i],dy=Y[i+1]-Y[i],f=clamp(((x-X[i])*dx+(y-Y[i])*dy)/(L*L),0,1),px=X[i]+dx*f,py=Y[i]+dy*f,d=Math.hypot(px-x,py-y);
      if(d<best){best=d;bs=A[i]+L*f;this.lat=((x-px)*dy-(y-py)*dx)/L}}return bs}
  /* (its order coming back after an about face, march.js MARCH_MOVE.about: a man of it at x, y more than pass px along its way from
     his place t (behind it, marching: more than lag px, as a man at pace trails his, and pass more) goes beside the file, never
     through it, till level with it, a px or so (was: so going already; behind: within lag px). Till a body clear of the file he
     steps straight out of it, his own side, to side px past it (× his body); one hastening up it twice as far out. Ahead of his
     place: marching, he stands there (his place comes back to him, the file going by); halted, he walks back down it. Behind it,
     he hastens up it, look px on at a time. Into out; false: his place) */
  pass(x,y,t,marching,was,out){const A=MARCH_MOVE.about,C=TRAVEL_STYLES.column,s=this.along(x,y),sp=this.s[t.rank],ahead=s<sp-(was?1:A.pass);if(!ahead&&s<=sp+(marching?C.lag+(was?0:A.pass):A.pass))return false;
    const b=marchBodyOf(t.type)*WORLD_BATTLE.sprite/WORLD_BATTLE.scale,w=Math.max(C.width,b)/2,k=t.side<0?-1:1,lat=k*(w+b*A.side*(ahead?1:2));
    this.at(Math.abs(this.lat)<w+b?s:ahead?marching?s:Math.min(sp,s+A.look):Math.max(sp,s-A.look),lat,out);return true}
  // (room for m points of its way)
  room(m){if(m<=this.vx.length)return;this.vx=new Float64Array(2*m);this.vy=new Float64Array(2*m);this.va=new Float64Array(2*m)}
  // (its places, its head at hx, hy facing face, along trail tr: its targets (as MarchArmy targets; the same, written afresh each
  // time). Its way (vx, vy; va: px along it): back from its head through the trail's points (none under bit px past the last), on
  // straight the way it went past its end, to look px past its last rank)
  lay(tr,hx,hy,face){
    const S=this.s,n=S.length,bit=.5,end=this.len+TRAVEL_STYLES.column.look+1;this.room(tr.n+2);const X=this.vx,Y=this.vy,A=this.va;let m=1,ux=-Math.cos(face),uy=-Math.sin(face);X[0]=hx;Y[0]=hy;A[0]=0;
    for(let j=0;j<tr.n&&A[m-1]<end;j++){const q=tr.at(j),x=tr.x[q],y=tr.y[q],L=Math.hypot(x-X[m-1],y-Y[m-1]);if(L<bit)continue;ux=(x-X[m-1])/L;uy=(y-Y[m-1])/L;X[m]=x;Y[m]=y;A[m]=A[m-1]+L;m++}
    if(A[m-1]<end){const L=end-A[m-1];X[m]=X[m-1]+ux*L;Y[m]=Y[m-1]+uy*L;A[m]=end;m++}this.nv=m;
    // (each rank on it: its point, the way back there (ru, rv), the piece it lies on (ri))
    for(let r=0,i=0;r<n;r++){const s=S[r];while(i<m-2&&A[i+1]<s)i++;const L=A[i+1]-A[i],f=L?(s-A[i])/L:0;
      this.rx[r]=X[i]+(X[i+1]-X[i])*f;this.ry[r]=Y[i]+(Y[i+1]-Y[i])*f;this.ru[r]=L?(X[i+1]-X[i])/L:ux;this.rv[r]=L?(Y[i+1]-Y[i])/L:uy;this.ri[r]=i}
    for(const t of this.T){const r=t.rank,ux=this.ru[r],uy=this.rv[r];t.x=this.rx[r]+uy*t.side;t.y=this.ry[r]-ux*t.side;t.hx=-ux;t.hy=-uy}
    // (its point: between the two ranks round its middle)
    if(!n){this.cx=hx;this.cy=hy}else{let r=0;while(r<n-2&&S[r+1]<this.mid)r++;const r1=Math.min(n-1,r+1),f=r1>r?clamp((this.mid-S[r])/((S[r1]-S[r])||1),0,1):0;
      this.cx=this.rx[r]+(this.rx[r1]-this.rx[r])*f;this.cy=this.ry[r]+(this.ry[r1]-this.ry[r])*f}
    this.ox=this.cx-hx;this.oy=this.cy-hy;return this.T}
  /* (where a man of it at x, y steers on the march (t: his target): look px on along its way from his nearest point on it (on the
     pieces from his place back), his side of it, so a man trailing his place at pace follows the road round a bend, never across
     the field; false when that is past his place, or he is more than lag px behind it (a straggler makes straight for his place,
     past his file rather than queue behind it): his place itself. Into out) */
  steer(x,y,t,out){const C=TRAVEL_STYLES.column,X=this.vx,Y=this.vy,A=this.va,sp=this.s[t.rank],n=this.nv;let best=Infinity,bs=sp,bi=this.ri[t.rank];
    for(let i=bi;i<n-1&&A[i]<=sp+2*C.lag;i++){const L=A[i+1]-A[i];if(!L)continue;const dx=X[i+1]-X[i],dy=Y[i+1]-Y[i],f=clamp(((x-X[i])*dx+(y-Y[i])*dy)/(L*L),0,1),d=Math.hypot(X[i]+dx*f-x,Y[i]+dy*f-y);if(d<best){best=d;bs=A[i]+L*f;bi=i}}
    const a=bs-C.look;if(a<=sp||bs-sp>C.lag)return false;let i=bi;while(i>0&&A[i]>a)i--;const L=A[i+1]-A[i]||1,ux=(X[i+1]-X[i])/L,uy=(Y[i+1]-Y[i])/L,f=(a-A[i])/L;
    out.x=X[i]+(X[i+1]-X[i])*f+uy*t.side;out.y=Y[i]+(Y[i+1]-Y[i])*f-ux*t.side;return true}
}
/* a countermarch (the owner, 2026-11-01: "why don't just move in long oval arc or circle for this? make them one line each and move
   around in circle to rotate between head and tail"; march.js MARCH_MOVE.about.loop): a halted column (as last laid, its order the
   other way round) laid as a racetrack oval round its way: two lanes h px either side of it, as long as it, joined at its head and
   its tail by half ovals reaching e px past them. Its men walk it in single file, all the same way round (up one lane, down the
   other), each one's place u px on round it from where it stood (on his own file's lane; one alone in his rank, the first). Half a
   lap is the column's flip (MarchColumn flip): each man at his place in it the other way round, the chosen order, its head where it
   stood. Its points every crumb px of u or less (px, py); P: px round it; half: half a lap; u: px its places have gone round, in t
   s; b: px a man trails his place at its pace, per s of his kind's brake (march.js marchKind t); bend: px, its tightest; t0, t1:
   rad/s its slowest turning men turn standing, and at their pace (marchKind) */
class MarchLoop{
  constructor(col,h,e,t0,t1){const L=col.len,E=Math.PI*Math.sqrt((e*e+h*h)/2),P=2*(L+E),n=Math.max(8,Math.ceil(P/TRAVEL_STYLES.column.crumb)),q={x:0,y:0};
    this.col=col;this.L=L;this.E=E;this.P=P;this.half=L+E;this.h=h;this.e=e;this.bend=Math.min(e*e/h,h*h/e);this.t0=t0;this.t1=t1;this.u=this.t=this.b=0;this.du=P/n;this.px=new Float64Array(n+1);this.py=new Float64Array(n+1);
    for(let i=0;i<=n;i++){this.pt(i*this.du,h,e,q);this.px[i]=q.x;this.py[i]=q.y}
    this.u0=Float64Array.from(col.T,t=>t.side<0?L+E+col.s[t.rank]:L-col.s[t.rank])}
  // (its point u px round from the first lane's tail, its lanes h px out, its ends e px past (its column as laid): into out)
  pt(u,h,e,out){const L=this.L,E=this.E,C=this.col;u=(u%this.P+this.P)%this.P;if(u<L)return C.at(L-u,h,out);
    if(u<L+E){const a=Math.PI*(u-L)/E;return C.at(-e*Math.sin(a),h*Math.cos(a),out)}if(u<2*L+E)return C.at(u-L-E,-h,out);
    const a=Math.PI*(u-2*L-E)/E;return C.at(L+e*Math.sin(a),-h*Math.cos(a),out)}
  // (its point u px round, from its points: into out)
  at(u,out){const k=(u%this.P+this.P)%this.P/this.du,i=Math.min(this.px.length-2,Math.floor(k)),f=k-i;
    out.x=this.px[i]+(this.px[i+1]-this.px[i])*f;out.y=this.py[i]+(this.py[i+1]-this.py[i])*f;return out}
  // (px/s its places go round: v, or slower, so a man of pace V px/s keeps to its tightest bend at his turn there)
  speed(v,V){const r=this.bend;return Math.min(v,r*this.t0/(1+r*(this.t0-this.t1)/V))}
  // (its men's places now (each on by as far as he trails it), written over its column's (MarchColumn lay: T))
  place(T){for(let k=0;k<T.length;k++){const t=T[k];this.at(t.lu=this.u0[k]+this.u+this.b*marchKind(t.type).t,t)}}
  // (where a man of it at x, y steers (t: his place, lu px round it): look px on round it from his nearest point on it behind his
  // place, so one trailing it keeps to the oval round its ends, never across; false when he is within look px of his place, or more
  // than lag px behind it and as far as he trails it braking (as a column's: MarchColumn steer). Into out)
  steer(x,y,t,out){const C=TRAVEL_STYLES.column,n=this.px.length-1,du=this.du,lag=C.lag+this.b*marchKind(t.type).t;let best=Infinity,bs=t.lu;
    for(let k=Math.floor((t.lu-lag)/du);k<=Math.ceil(t.lu/du);k++){const i=(k%n+n)%n,x0=this.px[i],y0=this.py[i],dx=this.px[i+1]-x0,dy=this.py[i+1]-y0,f=clamp(((x-x0)*dx+(y-y0)*dy)/(dx*dx+dy*dy||1),0,1),d=Math.hypot(x0+dx*f-x,y0+dy*f-y);if(d<best){best=d;bs=(k+f)*du}}
    if(bs+C.look>=t.lu||t.lu-bs>lag)return false;this.at(bs+C.look,out);return true}
  // (room for it on ground nav (march.js MarchGround): its points on ground a man stands on, no wall between them, and so m px out
  // past it (its lanes and ends m px further out))
  fits(nav,m){const q={x:0,y:0},a={x:0,y:0},b={x:0,y:0};
    for(let i=0;i<this.px.length;i++){b.x=this.px[i];b.y=this.py[i];if(!nav.stand(b)||i&&!nav.clear(a,b)||!nav.stand(this.pt(i*this.du,this.h+m,this.e+m,q)))return false;a.x=b.x;a.y=b.y}
    return true}
}
