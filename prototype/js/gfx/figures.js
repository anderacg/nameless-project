'use strict';
/* ---------- figures and their gear (the owner, 2026-10-31: "a body sprite plus separately drawn gear" for every figure, the map's
   small ones too). A figure is its body (people.js drawFigureBody, drawMapBody: the template, its clothes, helm, cape and limbs) and its
   gear apart (FigureGear): the weapon in its hand, a bow, a crossbow, a sling or a staff, its shield, what it wears on its back, a load.
   Each piece hangs from the body's anchor for it in the pose (hand, off: the shield arm, guard: a shield raised, back), behind the
   body or in front of it by GEAR.layer. A finished figure is body and gear laid in one grid and outlined once round them all, so it
   reads as one silhouette (FigureRig), its frame grown only where the gear reaches past it: a pike stands as tall as it is. The
   finished figures of the map, its marchers' and its small people's, the march preview's and the cards' are kept in FIGURES (an
   LRU, as the map's chunks are: worldart.js), so a map frame still draws each once. In battle the weapon in hand turns on its own
   and is drawn live over the body or behind it (weapons.js heldNow); the rest moves with the body's frames and is kept with its
   pose (sprites.js unitSprite: bare). Every figure faces right (one facing left is the same picture mirrored), so the near side,
   front and behind, is always its picture's own ---------- */
/* GEAR, the one table. layer: each slot's place, below 0 behind the body (drawn only where the body is not: the nearest, the
   nearest 0, first), above 0 in front (the nearest, the highest, last): main (a weapon in the hand), shooter (a bow, a crossbow, a
   sling, a staff), guard (a shield raised before him), shield (slung on the far arm), quiver (on the back), slung (a bow put away,
   across the back), load (a worker's or a peddler's, on the map). behind: the battle's weapon in hand goes behind the body while
   it points up and back over the shoulder, between these angles (degrees: 0 forward, -90 up; a sword on the march, a wind-up). back:
   what is worn on the back by the weapon carried. room: the px a figure's frame may grow each way for its gear (mapRoom: a small
   figure's, over the head); rise: how far a pole stands over a small figure's head. peek: the share of a weapon behind the body that must
   show past it, else it is drawn before him (weapons.js peeks). cap: the finished figures FIGURES keeps (more
   while a frame needs them: hard, × cap at most); goad: a drover's (GoadGear: its length, its angle, as a weapon's) */
const GEAR={layer:{main:2,shooter:2,guard:1,shield:-1,quiver:-2,slung:-3,load:-2,goad:-1},behind:[-170,-105],back:{bow:'quiver',longbow:'quiver',xbow:'bolts'},
  room:16,mapRoom:5,rise:{spear:2,pike:4,lance:4,javelin:1,staff:1},cap:1500,hard:4,goad:[15,-118],peek:.4};
/* the finished figures kept, by key: an LRU, the least lately drawn let go past cap, but never one drawn this frame or the last
   (tick: render.js counts the frames), so a crowd bigger than cap is never drawn afresh each frame; past cap × hard, the oldest go
   whatever. A hit moves its figure up once a frame */
class FigureCache{
  constructor(cap){this.cap=cap;this.map=new Map();this.tick=0}
  get(k){const c=this.map.get(k);if(c&&c.used!==this.tick){this.map.delete(k);this.map.set(k,c);c.used=this.tick}return c}
  set(k,c){c.used=this.tick;this.map.set(k,c);if(this.map.size>this.cap)for(const [q,f] of this.map){if(this.map.size<=this.cap||f.used>=this.tick-1&&this.map.size<=this.cap*GEAR.hard)break;this.map.delete(q)}return c}
  frame(){this.tick++}
}
const FIGURES=new FigureCache(GEAR.cap);
// (the anchors a finished figure keeps, where its body put them (people.js drawFigureBody): the weapon hand (weapons.js holds a
// weapon there), the free hand and the back (a marcher's torch and flag: marchgear.js); sprites.js cellOf keeps them in its cell)
const FIG_ANCHORS=['hand','free','back'];
// a piece of gear: its slot (GEAR.layer) and the anchor it hangs from; draw(set, o, p) puts its pixels from the anchor, facing
// right, for the look o and the pose p (style, atk: a blow's or a shot's frame; sh: a dwarf's row less; the map's ly, the legs' row,
// and cut)
class FigureGear{
  constructor(slot,at){this.slot=slot;this.at=at;this.layer=GEAR.layer[slot]}
  draw(set,o,p){}
}
// a weapon in the hand (people.js WPN): upright at rest (WPN_REST's slant), in a blow at its frame's angle (SWING), drawn as the
// battle's is (weapons.js drawBlade), the tip flashing as it strikes
class HandWeapon extends FigureGear{
  constructor(k){super('main','hand');this.k=k}
  draw(set,o,p){const k=this.k,blow=p.atk>=0&&!!p.style,t=blow&&(POLE(k)&&k!=='lance'&&p.style==='swing'?POLE_SWING:SWING[p.style]||SWING.swing)[p.atk];
    const tip=drawBlade(set,t?t[0]:0,t?t[1]:0,t?t[2]:WPN_REST[k]??-90,k,pal(o.team),pal(o.skin)[1]);if(blow&&p.atk===1)set(tip[0],tip[1],'#ffffff')}
}
// a shooter's weapon in the hand, by the body's frame: swing, the loose (drawn, the flash, at rest); thrust, the draw (half, full,
// held at full, the tip catching the light); overhead, the reload (a bow's hand back to the quiver and an arrow nocked; a crossbow
// tipped down and spanned; a sling's pouch filled; a staff at rest)
class ShooterGear extends FigureGear{
  constructor(k){super('shooter','hand');this.k=k}
  draw(set,o,p){const k=this.k,atk=p.atk,draw=p.style==='thrust'&&atk>=0,reload=p.style==='overhead'&&atk>=0,skin=pal(o.skin)[1],W=PPAL.wood,M=PPAL.steel;
    if(k==='bow'||k==='longbow'){const L=k==='longbow'?5:4,pull=draw?[1,2,2][atk]:reload?0:atk===0?2:0;for(let y=-L;y<=L;y++)set(1-(Math.abs(y)>=L-1?1:0),y-1,W[1]);
      for(let y=-L+1;y<=L-1;y++)set(-(Math.abs(y)<2?pull:0),y-1,PPAL.white[1]);if(pull)for(let i=0;i<5;i++)set(-pull+i,-1,i===4?M[0]:W[2]);if(draw&&atk===2)set(5-pull,-1,'#ffffff');
      if(reload){const hd=[[-2,-3],[-3,-5],[-1,-1]][atk];set(hd[0],hd[1],skin);if(atk===2)for(let i=0;i<3;i++)set(i-1,-1,W[2])}
      if(atk===1&&!draw&&!reload)set(3,-1,PPAL.white[0]);set(0,-1,skin);return}
    if(k==='xbow'){if(reload){for(let i=0;i<5;i++)set(1,i-2,W[1]);for(let i=-2;i<=2;i++)set(1+i,3,M[1]);set(1,[1,0,-1][atk],skin);set(0,2,skin);return}
      const up=draw&&atk>=1?-1:0;for(let i=0;i<5;i++)set(i-1,up,W[1]);set(3,up-1,M[1]);set(3,up+1,M[1]);set(3,up-2,M[2]);set(3,up+2,M[2]);if(atk===1&&!draw)set(5,0,PPAL.white[0]);set(0,up,skin);return}
    if(k==='sling'){const sw=draw?[[-2,-5],[2,-4],[-1,-6]][atk]:reload?[[0,3],[1,3],[0,2]][atk]:atk>=0?[[-2,-5],[2,-4],[2,1]][atk]:[1,2];set(sw[0],sw[1],PPAL.leather[1]);set(sw[0]/2,sw[1]/2,PPAL.cloth[2]);set(0,0,skin);return}
    if(k==='staff'){const lift=reload?0:draw?-1:atk===1?-2:atk===0?-1:0,gem=o.race==='dwarf'?PPAL.gold:o.race==='orc'?PPAL.forest:o.race==='elf'?PPAL.teal:PPAL.violet;
      for(let y=lift-8;y<=4;y++)set(0,y,W[1]);set(0,lift-9,gem[1]);set(0,lift-10,gem[0]);set(1,lift-9,gem[2]);if(atk===1){set(-1,lift-10,gem[0]);set(1,lift-11,'#ffffff')}set(0,0,skin)}}
}
// a shield: slung on the far arm, behind him, its rim and face showing past his back (and his cape), its far edge in shade; raised
// before him to meet a blow (guard: his chest and face; 'low': his legs), in front. In its own material, the side's colour its boss
class ShieldGear extends FigureGear{
  constructor(guard){super(guard?'guard':'shield',guard?'guard':'off');this.guard=guard}
  draw(set,o,p){const C=pal(shieldLook(o)),Tm=pal(o.team),sh=p.sh;
    if(this.guard){const y1=this.guard==='low'?5-sh:6-sh;for(let y=0;y<=y1;y++){set(0,y,y?C[2]:C[0]);set(1,y,y?C[1]:C[0]);set(2,y,y===y1?C[3]:C[2])}set(1,2,Tm[1]);set(1,3,Tm[1]);set(0,3,Tm[2]);set(2,3,Tm[2]);return}
    const y1=4-sh;for(let y=0;y<=y1;y++){set(0,y,y?C[1]:C[0]);set(1,y,y?C[2]:C[0]);set(2,y,C[3])}set(1,1,Tm[1]);set(1,2-sh,Tm[2]);set(0,y1,C[2]);set(1,y1,C[3])}
}
// a quiver on his back, its arrows' fletching over his shoulder; a crossbowman's bolt case at his hip
class QuiverGear extends FigureGear{
  constructor(k){super('quiver','back');this.k=k}
  draw(set,o,p){const L=PPAL.leather;if(this.k==='bolts'){for(let y=2;y<=4;y++){set(-1,y,L[1]);set(-2,y,L[2])}set(-1,1,PPAL.steel[1]);set(-2,1,PPAL.steel[2]);return}
    for(let y=-1;y<=3;y++)set(-1,y,y<0?L[0]:L[1]);for(let y=0;y<=3;y++)set(-2,y,L[2]);set(0,-1,L[0]);set(0,0,L[2]);
    const F=PPAL.linen;set(0,-2,F[0]);set(1,-2,F[1]);set(1,-3,F[0]);set(-1,-2,F[1])}
}
// a bow put away across his back while he fights with his sidearm (sprites.js unitSprite: arm), a crossbow likewise
class SlungBow extends FigureGear{
  constructor(k){super('slung','back');this.k=k}
  draw(set,o,p){const W=PPAL.wood;if(this.k==='xbow'){for(let y=-1;y<=4;y++)set(-2,y,W[1]);for(let x=-4;x<=0;x++)set(x,-1,PPAL.steel[1]);return}
    const n=this.k==='longbow'?5:4;for(let y=2-n;y<=2+n;y++)set(Math.abs(y-2)>=n-1?-2:-3,y,W[Math.abs(y-2)>=n-1?2:1]);for(let y=3-n;y<=1+n;y++)set(-2,y,PPAL.white[1])}
}
// a drover's goad (o.goad: caravans.js): a long thin stick from his hand up over his shoulder, back toward his ox, behind him, its
// iron prick at its end; a staircase with its corners filled, as a weapon's shaft (weapons.js drawBlade)
class GoadGear extends FigureGear{
  constructor(){super('goad','hand')}
  draw(set,o,p){const [n,deg]=GEAR.goad,a=deg*Math.PI/180,ex=Math.cos(a)*(n-1),ey=Math.sin(a)*(n-1),st=Math.round(Math.max(Math.abs(ex),Math.abs(ey))),W=PPAL.wood;let q=null;
    for(let i=0;i<=st;i++){const x=Math.round(ex*i/st),y=Math.round(ey*i/st);if(q&&q[0]!==x&&q[1]!==y)set(q[0],y,W[2]);set(x,y,i===st?PPAL.iron[1]:W[i>st-3?2:1]);q=[x,y]}
    set(0,0,pal(o.skin)[1])}
}
// the map's small figures' gear (people.js drawMapBody): what is in the hand, a column before him from the hand (MAP_HELD: its rows
// on his body; a pole GEAR.rise rows over his head), the hand over it; a shield slung behind him; a load on his back (drawMapLoad)
class MapHeld extends FigureGear{
  constructor(k){super('main','hand');this.k=k}
  draw(set,o,p){if(p.cut!=null&&p.cut<4)return;const [r0,y1,mat,hd]=MAP_HELD[this.k],y0=r0-(GEAR.rise[this.k]||0),Wd=PPAL.wood,S=PPAL.steel,c=mat==='steel'?S[1]:mat==='leather'?PPAL.leather[1]:Wd[1],h=(x,y,col)=>set(x,y-5,col);
    for(let y=y0;y<=Math.min(y1,p.ly-1,p.cut==null?99:p.cut);y++)h(1,y,c);
    if(hd==='guard'){h(1,y0,S[0]);h(1,y1+1,PPAL.gold[1])}
    if(hd==='tip')h(1,y0,S[0]);
    if(hd==='gem'){const gm=o.race==='dwarf'?PPAL.gold:o.race==='orc'?PPAL.forest:o.race==='elf'?PPAL.teal:PPAL.violet;h(1,y0,gm[0])}
    if(hd==='axe'||hd==='hammer'){h(2,y0,S[1]);h(2,y0+1,S[2]);if(hd==='hammer')h(0,y0,S[1])}
    if(hd==='hoe')h(2,y0,S[1]);
    if(hd==='pick'){h(2,y0+1,S[2]);h(0,y0,S[1])}
    if(hd==='crook'){h(2,y0,Wd[1]);h(2,y0+1,Wd[2])}
    if(hd==='rod'){h(2,y0-1,Wd[1]);h(3,y0,'#d8dce4');h(3,y0+1,'#d8dce4')}
    if(hd==='bow'){h(1,y0,Wd[2]);h(1,y1,Wd[2]);for(let y=y0+1;y<y1;y++){h(2,y,Wd[1]);h(1,y,PPAL.linen[1])}}
    if(hd==='xbow'){h(2,y0,Wd[1]);h(2,y0-1,S[1]);h(2,y0+1,S[1])}
    if(hd==='lute'){h(1,y0,Wd[2]);h(1,y0+1,Wd[1]);h(2,y1-1,Wd[0]);h(2,y1,Wd[1]);h(1,y1,Wd[2])}// (a bard's: its neck up, its round body under the hand)
    set(0,0,pal(o.skin)[1])}// (the hand)
}
class MapShield extends FigureGear{
  constructor(){super('shield','off')}
  draw(set,o,p){if(p.cut!=null&&p.cut<5)return;const C=pal(shieldLook(o)),Tm=pal(o.team);set(0,0,C[1]);set(0,1,Tm[1]);set(0,2,C[2])}
}
class MapLoad extends FigureGear{
  constructor(job){super('load','back');this.job=job}
  draw(set,o,p){if(p.cut==null)drawMapLoad(set,this.job)}
}
/* the map's people at the battle's density (people.js MAP_FIGS): a load on the back (o.load: a job's, LOADS), behind him from
   between his shoulders, its top lift rows over them; LOAD_ART its pixels, x from -4 (the body's back edge 0): h light, H its
   colour, d shade, k deep (its ramp), e end grain, r a cord, f a fish. A lute (a bard's) across his front, its neck up and ahead */
const LOAD_ART={sack:[1,['..rr.','.hHH.','hHHHd','hHHHd','hHHdd','.ddk.']],churn:[2,['.hhH.','.kkk.','.hHd.','.hHd.','.kkk.','.hHd.','.ddk.']],
  logs:[3,['.eee.','.HdH.','.HdH.','.rrr.','.HdH.','.HdH.','.ddd.']],basket:[1,['.ff..','hHdHd','HdHdH','hHdHd','.kkk.']],
  pack:[3,['.hhH.','.dddd','hHHHd','hHrHd','hHHHd','hHHHd','.kkkk']],bundle:[1,['.hHHHd','.dHHdk','..hHd.','..hHd.','..ddk.']],
  planks:[4,['..eH','.eHd','eHd.','Hd..','eHHd','.eHd','..eH']]};
class BackLoad extends FigureGear{
  constructor(job){super('load','back');this.job=job}
  draw(set,o,p){const [k,col]=LOADS[this.job]||LOADS.farmer,[lift,rows]=LOAD_ART[k],R=rampOf(col),C={h:R[0],H:R[1],d:R[2],k:R[3],e:'#e8c890',r:'#6a4a2a',f:'#9ab8c8'};
    rows.forEach((row,y)=>[...row].forEach((c,x)=>{if(C[c])set(x-4,y-lift,C[c])}))}
}
class LuteGear extends FigureGear{
  constructor(){super('main','hand')}
  draw(set,o,p){const W=PPAL.wood;for(const [x,y,c] of [[-3,-1,1],[-3,0,2],[-2,-2,0],[-2,-1,1],[-2,0,2],[-1,-2,1],[-1,-1,2],[-1,0,3]])set(x,y,W[c]);set(-2,-1,'#2e2018');
    for(let i=0;i<4;i++)set(i,-2-i,W[2]);set(4,-6,W[3]);set(0,0,pal(o.skin)[1])}
}
/* a figure laid out: its gear by its look (gearOf: what people.js lookOf gives it, or a map figure's own), put on its body from the
   body's anchors (dress), and the finished picture (frame) */
class FigureRig{
  static gearOf(o,map){const G=[],k=o.weapon,s=shieldLook(o);
    if(map){if(MAP_HELD[k])G.push(new MapHeld(k));if(s)G.push(new MapShield());if(o.load)G.push(new MapLoad(o.load))}
    else{if(k)G.push(WPN[k]?new HandWeapon(k):k==='lute'?new LuteGear():new ShooterGear(k));if(s&&!o.mount)G.push(new ShieldGear(o.guardUp||null));
      const q=GEAR.back[k]||GEAR.back[o.slung];if(q)G.push(new QuiverGear(q));if(o.slung)G.push(new SlungBow(o.slung));if(o.goad)G.push(new GoadGear());if(o.load)G.push(new BackLoad(o.load))}
    return G.sort((a,b)=>a.layer-b.layer)}
  // its gear into grid g from the body's anchors A (people.js drawFigureBody, drawMapBody): behind it first, the nearest first, each
  // only where the body and what is already behind it are not; then in front, the nearest last
  static dress(g,o,A,style,atk){const G=FigureRig.gearOf(o,A.map),p={style,atk,sh:A.sh||0,ly:A.ly,cut:A.cut};
    const put=(x,X,Y,under)=>x.draw(under?(i,j,c)=>{if(!pget(g,Math.round(X+i),Math.round(Y+j)))pset(g,X+i,Y+j,c)}:(i,j,c)=>pset(g,X+i,Y+j,c),o,p);
    for(let i=G.length-1;i>=0;i--)if(G[i].layer<0)put(G[i],A[G[i].at][0],A[G[i].at][1],true);
    for(const x of G)if(x.layer>0)put(x,A[x.at][0],A[x.at][1],false)}
  /* the finished picture: g outlined round all it holds, cut to its frame (w wide, about g's middle less R each side; down to g's
     bottom from R in), grown each way only as far as its pixels reach past it, evenly about the frame's middle so its feet stay the
     cell's bottom middle (sprites.js cellOf); A: the body's anchors in g (people.js drawFigureBody), of which the picture keeps
     hand (the weapon hand), free (the off hand) and back (FIG_ANCHORS); fh: the figure's height (its bars and labels); rig */
  static frame(g,R,w,A,fh,rig){poutline(g);let x0=g.w,x1=-1;const top=Math.min(R,ptop(g));
    for(let i=0;i<g.p.length;i++)if(g.p[i]){const x=i%g.w;if(x<x0)x0=x;if(x>x1)x1=x}
    const cx=R+(w>>1),half=Math.max(w>>1,cx-x0,x1+1-cx),c=pcanvas(pcrop(g,cx-half,top,2*half,g.h-top));c.fh=fh;for(const k of FIG_ANCHORS)c[k]=[A[k][0]-(cx-half),A[k][1]-top];c.rig=rig;return c}
}
