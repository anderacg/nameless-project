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
const GEAR={layer:{main:2,shooter:2,guard:1,shield:1,quiver:-2,slung:-3,load:-2,goad:-1},behind:[-170,-105],back:{bow:'quiver',longbow:'quiver',xbow:'bolts'},
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
const FIG_ANCHORS=['hand','free','back','hand2'];// (hand2: a two-handed hold's far hand, on the shaft: render.js drawGrip)
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
  // (a paper doll's pole at rest goes across his back, behind him, as the owner's reference carries it)
  behindNow(o,p){return DOLL_FIGS.on&&dollable(o)&&POLE(this.k)&&this.k!=='lance'&&!(p.atk>=0&&p.style)}
  draw(set,o,p){const k=this.k,blow=p.atk>=0&&!!p.style,t=blow&&(POLE(k)&&k!=='lance'&&p.style==='swing'?POLE_SWING:SWING[p.style]||SWING.swing)[p.atk];
    const kind=k==='lance'?'lance':POLE(k)?'pole':k==='great'||k==='bigaxe'||k==='hammer'?'heavy':'blade',doll=dollable(o),rest0=doll&&!WPN_REST[k]?holdTab(kind,o).rest:WPN_REST[k]??-90,rest=doll&&p.drop!=null?downClamp(rest0,WPN[k][0],Math.min(DOLL_DROP,p.drop)):rest0;
    const tip=drawBlade(set,t?t[0]:0,t?t[1]:0,t?t[2]:rest,k,pal(o.team),pal(o.skin)[1],undefined,doll);if(blow&&p.atk===1)set(tip[0],tip[1],'#ffffff')}
}
/* a bow's string drawn back, by the body's frame (px behind the bow hand): the draw (nocked, full, held at full) to his draw hand at
   his chin (dollfigs.js DOLL_SHOOT), the loose's wind-up; the arrow from the string to its head past the bow */
const BOW_PULL={thrust:[3,4,4],swing:[2,0,0]};
const bowPull=(style,atk)=>atk>=0&&BOW_PULL[style]?BOW_PULL[style][atk]||0:0;
// (a straight line of pixels from one to another, each touching the last by an edge: a string drawn back, an arrow)
function bowLine(set,x0,y0,x1,y1,col){set(x0,y0,col);while(x0!==x1||y0!==y1){const dx=x1-x0,dy=y1-y0;if(Math.abs(dx)>=Math.abs(dy))x0+=Math.sign(dx);else y0+=Math.sign(dy);set(x0,y0,col)}}
// a shooter's weapon in the hand, by the body's frame: swing, the loose (drawn, the flash, at rest); thrust, the draw (half, full,
// held at full, the tip catching the light); overhead, the reload (a bow's hand back to the quiver and an arrow nocked; a crossbow
// tipped down and spanned; a sling's pouch filled; a staff at rest)
class ShooterGear extends FigureGear{
  constructor(k){super('shooter','hand');this.k=k}
  draw(set,o,p){const k=this.k,atk=p.atk,draw=p.style==='thrust'&&atk>=0,reload=p.style==='overhead'&&atk>=0,skin=pal(o.skin)[1],W=PPAL.wood,M=PPAL.steel;
    if((k==='bow'||k==='longbow')&&o.bowApart){set(0,-1,skin);return}// (drawn apart, to aim up and down: bowPic)
    if(k==='bow'||k==='longbow'){const L=k==='longbow'?5:4,pull=bowPull(p.style,atk);for(let y=-L;y<=L;y++)set(1-(Math.abs(y)>=L-1?1:0),y-1,W[1]);
      bowLine(set,0,-L,-pull,-1,PPAL.white[1]);bowLine(set,-pull,-1,0,L-2,PPAL.white[1]);if(pull){bowLine(set,-pull,-1,1,-1,W[2]);set(2,-1,M[0])}if(draw&&atk===2)set(3,-1,'#ffffff');
      if(reload){const hd=[[-2,-3],[-3,-5],[-1,-1]][atk];set(hd[0],hd[1],skin);if(atk===2)for(let i=0;i<3;i++)set(i-1,-1,W[2])}
      if(atk===1&&!draw&&!reload)set(3,-1,PPAL.white[0]);set(0,-1,skin);return}
    if(k==='xbow'){if(reload){for(let i=0;i<5;i++)set(1,i-2,W[1]);for(let i=-2;i<=2;i++)set(1+i,3,M[1]);set(1,[1,0,-1][atk],skin);set(0,2,skin);return}
      const up=draw&&atk>=1?-1:0;for(let i=0;i<5;i++)set(i-1,up,W[1]);set(3,up-1,M[1]);set(3,up+1,M[1]);set(3,up-2,M[2]);set(3,up+2,M[2]);if(atk===1&&!draw)set(5,0,PPAL.white[0]);set(0,up,skin);return}
    if(k==='sling'){const sw=draw?[[-2,-5],[2,-4],[-1,-6]][atk]:reload?[[0,3],[1,3],[0,2]][atk]:atk>=0?[[-2,-5],[2,-4],[2,1]][atk]:[1,2];set(sw[0],sw[1],PPAL.leather[1]);set(sw[0]/2,sw[1]/2,PPAL.cloth[2]);set(0,0,skin);return}
    if(k==='staff'){const lift=reload?0:draw?-1:atk===1?-2:atk===0?-1:0,gem=o.race==='dwarf'?PPAL.gold:o.race==='orc'?PPAL.forest:o.race==='elf'?PPAL.teal:PPAL.violet;
      for(let y=lift-8;y<=4;y++)set(0,y,W[1]);set(0,lift-9,gem[1]);set(0,lift-10,gem[0]);set(1,lift-9,gem[2]);if(atk===1){set(-1,lift-10,gem[0]);set(1,lift-11,'#ffffff')}set(0,0,skin)}}
}
/* a bow as its own picture (the owner, 2026-11-07: "make bows aim up and down too"): the same bow, string, arrow and hand as the
   figure's (ShooterGear), its pixels turned about his hand to the shot's angle (BOW_AIM.steps degrees up, nearest), so he raises
   it for a long shot or one up to higher ground and keeps it level for a near one or one down from above; drawn in battle over
   his body (render.js drawUnit; the body drawn bowApart). style, atk: the frame's, as ShooterGear's; R: the hand at its middle */
const BOW_AIM={on:true,steps:[0,15,30,45],k:2},BOW_PICS=new Map();
// (level: the figure's own pixels exactly; tilted: its limb, string and arrow as lines turned about his hand and drawn whole, each
// step edge to edge, so nothing breaks into dots)
function bowPic(k,style,atk,deg,skin){const key=[k,style,atk,deg,skin].join('|');let c=BOW_PICS.get(key);if(c)return c;
  const R=9,G=pgrid(2*R+1,2*R+1),W=PPAL.wood;
  if(!deg){const g=new ShooterGear(k),S=pal('skin')[1];g.draw((x,y,col)=>pset(G,R+x,R+y,col===S?skin:col),{skin:'skin'},{style,atk})}
  else{const a=deg*Math.PI/180,rot=([x,y])=>[R+Math.round(x*Math.cos(a)+y*Math.sin(a)),R+Math.round(-x*Math.sin(a)+y*Math.cos(a))];
    const line=(p,q,col)=>bowLine((x,y,c)=>pset(G,x,y,c),...rot(p),...rot(q),col);
    const L=k==='longbow'?5:4,draw=style==='thrust'&&atk>=0,pull=bowPull(style,atk);
    line([0,-L-1],[1,-L+1],W[1]);line([1,-L+1],[1,L-3],W[1]);line([1,L-3],[0,L-1],W[1]);
    line([0,-L],[-pull,-1],PPAL.white[1]);line([-pull,-1],[0,L-2],PPAL.white[1]);
    if(pull){line([-pull,-1],[1,-1],W[2]);line([2,-1],[2,-1],PPAL.steel[0])}
    if(draw&&atk===2)line([3,-1],[3,-1],'#ffffff');if(style==='swing'&&atk===1)line([3,-1],[3,-1],PPAL.white[0]);
    pset(G,R,R-1,skin)}
  c=pcanvas(G);c.R=R;BOW_PICS.set(key,c);return c}
/* a shield (the owner, 2026-11-07: "bigger shields with the army's device"): carried on his off arm before him, or raised to meet a
   blow (guard: before his chest; 'low': his legs); a heater of metal (steel, iron, silver, gold) or a round one of wood, its rim in its
   material lit from the top left, its field the side's colour, the device of his people on it (sprites.js BANNER_DEV: the Vale's, the
   Karn's, the Sylvan's, the Horde's, three by three), light on a dark field, dark on a light one. SHIELD_ART: the shapes (r rim,
   f field), from the anchor at their top left, and each people's device */
const SHIELD_ART={heater:['rrrrr','rfffr','rfffr','rfffr','rfffr','.rfr.','..r..'],round:['.rrr.','rfffr','rfffr','rfffr','rfffr','.rrr.'],
  dev:{human:'vale',dwarf:'karn',elf:'sylvan',orc:'horde'}};
class ShieldGear extends FigureGear{
  constructor(guard){super(guard?'guard':'shield',guard?'guard':'off');this.guard=guard}
  draw(set,o,p){const m=shieldLook(o),C=pal(m),Tm=pal(o.team),A=SHIELD_ART,rows=m==='wood'?A.round:A.heater,T=typeof BANNER_DEV!=='undefined'&&BANNER_DEV[A.dev[o.race||'human']],
      lum=Tm[1]&&Tm[1][0]==='#'?[1,3,5].reduce((a,i,k)=>a+parseInt(Tm[1].slice(i,i+2),16)*[.3,.59,.11][k],0)/255:.5,dv=lum>.6?'#3a2226':'#f4ecd8',
      ox=this.guard?-1:-2,oy=this.guard?(this.guard==='low'?1:-1)-p.sh:-2-p.sh,W=rows[0].length;
    rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c==='.')return;const edge=y===0||x===0||x===W-1||rows[y+1]?.[x]==='.'||!rows[y+1];
      set(ox+x,oy+y,c==='r'?C[y===0||x===0?0:edge&&x>=W-2?2:1]:Tm[x===1?0:x===W-2?2:1])}));
    // (the device three by three in the field's middle: the 5 x 5 one's every other row and column)
    if(T)for(let j=0;j<3;j++)for(let i=0;i<3;i++)if(T[j*2]&&T[j*2][i*2]&&T[j*2][i*2]!=='.')set(ox+1+i,oy+1+j,dv)}
}
// a quiver on his back, slung close behind his shoulder, the most of it hidden by him, its arrows' fletching over it by his head; a crossbowman's bolt case at his hip
class QuiverGear extends FigureGear{
  constructor(k){super('quiver','back');this.k=k}
  draw(set,o,p){const L=PPAL.leather;if(this.k==='bolts'){for(let y=2;y<=4;y++){set(-1,y,L[1]);set(-2,y,L[2])}set(-1,1,PPAL.steel[1]);set(-2,1,PPAL.steel[2]);return}
    for(let y=-3;y<=1;y++){set(2,y,y===-3?L[0]:L[1]);set(1,y,L[2])}for(let y=2;y<=3;y++)set(3,y,L[2]);
    const F=PPAL.linen;set(1,-4,F[0]);set(2,-4,F[1]);set(3,-4,F[0])}
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
  // (drop: for a doll, how far below his hand his feet stand, so a weapon held low stops over the ground: weapons.js downClamp)
  static dress(g,o,A,style,atk){const G=FigureRig.gearOf(o,A.map),p={style,atk,sh:A.sh||0,ly:A.ly,cut:A.cut};
    if(g.body&&A.hand){let fy=-1;for(const i of g.body)fy=Math.max(fy,(i/g.w)|0);p.drop=fy-A.hand[1]-1}
    const put=(x,X,Y,under)=>x.draw(under?(i,j,c)=>{if(!pget(g,Math.round(X+i),Math.round(Y+j)))pset(g,X+i,Y+j,c)}:(i,j,c)=>pset(g,X+i,Y+j,c),o,p);
    const lay=x=>x.behindNow&&x.behindNow(o,p)?-1:x.layer;
    for(let i=G.length-1;i>=0;i--)if(lay(G[i])<0)put(G[i],A[G[i].at][0],A[G[i].at][1],true);
    for(const x of G)if(lay(x)>0)put(x,A[x.at][0],A[x.at][1],false)}
  /* the finished picture: g outlined round all it holds, cut to its frame (w wide, about g's middle less R each side; down to g's
     bottom from R in), grown each way only as far as its pixels reach past it, evenly about the frame's middle so its feet stay the
     cell's bottom middle (sprites.js cellOf); A: the body's anchors in g (people.js drawFigureBody), of which the picture keeps
     hand (the weapon hand), free (the off hand) and back (FIG_ANCHORS); fh: the figure's height (its bars and labels); rig */
  // (a paper doll and its gear unoutlined, as the owner's reference: dollfigs.js)
  // (a doll's blended outline (people.js prim) laid after its extent is taken: it never changes the cell, nor where its anchors fall)
  static frame(g,R,w,A,fh,rig){const doll=g.body&&DOLL_FIGS.on&&DOLL_FIGS.edge;if(!g.body)poutline(g);else if(doll){pjoin(g);pfillHoles(g)}let x0=g.w,x1=-1;const top=Math.min(R,ptop(g));
    for(let i=0;i<g.p.length;i++)if(g.p[i]){const x=i%g.w;if(x<x0)x0=x;if(x>x1)x1=x}
    if(doll&&DOLL_FIGS.rim){prim(g);pfillHoles(g)}
    const cx=R+(w>>1),half=Math.max(w>>1,cx-x0,x1+1-cx),c=pcanvas(pcrop(g,cx-half,top,2*half,g.h-top));c.fh=fh;for(const k of FIG_ANCHORS)if(A[k])c[k]=[A[k][0]-(cx-half),A[k][1]-top];c.rig=rig;return c}
}
