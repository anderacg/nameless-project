'use strict';
/* ---------- a holding's walls on the map (the owner, 2026-11-06: "make a wall for holding or estates": drawn and blocking, the
   estates inside the town wall): every holding with walls (wallOf: a palisade or better) is ringed by them, a tile out round its
   centre, houses and estates and their fields (those within TOWN_WALL.reach tiles of its own tile); a gate wherever a road or a
   ford crosses the ring (TOWN_WALL.gate tiles either side of it open too), else one below its centre. The ring's walls are shut
   on the router's layer (router.js holdShut: SHUT bit 4), so every way, every walker (world.js walk) and every march (wayLand)
   keeps to the gates; water and peaks on the ring need no wall, nor a tile another holding's building stands on. Drawn standing,
   sorted with the buildings by their feet (structures.js holdingEnts), in the holding's culture (TOURNEY_ARENA.walls): a
   palisade's stakes, stone, or great walls; towers at its corners and either side of each gate; drawn where you have seen
   their ground. Made from the lots (TownWall.of, again when they or the walls change): never saved. TOWN_WALL.on false: no
   walls, as before ---------- */
/* TOWN_WALL, the one table. on; reach: a lot farther from the holding's tile than this (tiles) stays outside; pad: the ring's tiles
   out from the outermost lot or field; gate: the tiles opened either side of a road's; merge: gates this near
   (tiles) one; alarm: an army at war with it marching on it this near (tiles), or you its foe outside its walls, shuts its gates;
   camp: its besiegers' camp this far out of a gate (tiles); towers: a tower every so many tiles of a stone wall's stretch; h: the wall's height by the walls (px:
   none, palisade, stone, great); top: its walk's depth (px); tower: a tower's rise over the wall (px); clear: the tiles either side of its line kept clear of the woods; fh: a fence's height (px) */
const TOWN_WALL={on:true,fh:6,clear:1,cut:2,reach:14,pad:1,gate:1,merge:5,towers:7,alarm:16,camp:3,h:[0,10,13,16],top:6,tower:7};
/* (the owner, 2026-11-06: "the wall may be based on the holdings as well, if very poor they may start from none; think it like an
   upgrade") a fence: a wattle fence round a holding with no walls (fenceOf: t.fence once set), the first step before a palisade,
   drawn and blocking as a wall is but no wall in a fight (no siege, no defender's level). At the start (fenceStart), by what it
   has: its estates' levels and up to 2 by a hash of its place (start: the score for one, by its kind; salt); poor ones none. Later an upgrade: a
   realm's or the free folk's grows one by itself once it prospers (pros, by daily chance a day, gold and mats from its stock);
   yours you build in its Fortification (gold, mats, days) */
const FENCE={start:{town:8,village:6,hamlet:3.5},salt:4411,pros:65,daily:.05,gold:30,mats:{timber:12},days:2};
const fenceOf=t=>t.fence!=null?t.fence:TownWall.fenceStart(t);
const RINGS=new WeakMap();
class TownWall{
  // (what changes it: the walls, the lots there are and those in ruins)
  static key(t){return wallOf(t)+(fenceOf(t)?'f':'')+'|'+(t.lots?t.lots.length+'|'+t.lots.reduce((n,l)=>n+(l.st==='ruined'?1:0),0)+'|'+t.lots.reduce((n,l)=>n+l.x*3+l.y*7,0):'-')}
  // its ring, or null (no walls, no lots, off): {x0, y0, x1, y1 (its rectangle, tiles), parts: [{i, x, y, k}] (k: 'h' a stretch
  // across, 'v' one down, 'c' a corner tower, 't' a gate's tower), shut: [tile index], gates: [tile index]}
  static of(t){if(!TOWN_WALL.on||!t||!t.lots||t.gone||wallOf(t)<=0&&!fenceOf(t))return null;const k=TownWall.key(t),c=RINGS.get(t);if(c&&c.key===k)return c.ring;
    const ring=TownWall.make(t);RINGS.set(t,{key:k,ring});return ring}
  static make(t){const X=TOWN_WALL,R=X.reach;let x0=t.tx,y0=t.ty+1,x1=t.tx,y1=t.ty+2;
    const add=(x,y)=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)};
    for(const l of t.lots){if(l.st==='ruined')continue;const mx=l.x+l.n/2,my=l.y+l.n/2;if(Math.abs(mx-t.tx)>R||Math.abs(my-t.ty)>R)continue;
      add(l.x,l.y);add(l.x+l.n-1,l.y+l.n-1);for(const [px,py] of l.plots||[])if(Math.abs(px-t.tx)<=R+3&&Math.abs(py-t.ty)<=R+3)add(px,py)}
    // (all it must hold, its lots and fields, before the pad: the corners cut no deeper than they allow)
    const hold=[];for(const l of t.lots){if(l.st==='ruined')continue;const mx=l.x+l.n/2,my=l.y+l.n/2;if(Math.abs(mx-t.tx)>R||Math.abs(my-t.ty)>R)continue;for(let j=0;j<l.n;j++)for(let i=0;i<l.n;i++)hold.push([l.x+i,l.y+j]);
      for(const [px,py] of l.plots||[])if(Math.abs(px-t.tx)<=R+3&&Math.abs(py-t.ty)<=R+3)hold.push([px,py])}hold.push([t.tx,t.ty+1],[t.tx,t.ty+2]);
    x0-=X.pad;y0-=X.pad;x1+=X.pad;y1+=X.pad;
    // (the owner, 2026-11-06: "make diagonal walls") its corners cut by diagonal stretches, c tiles deep: an octagon, as deep as what
    // it holds allows (each held tile c + 1 tiles or more in from each corner), at most a third of its shorter side; under X.cut, square
    let c=Math.floor(Math.min(x1-x0,y1-y0)/3);for(const [x,y] of hold)c=Math.min(c,(x-x0)+(y-y0)-1,(x1-x)+(y-y0)-1,(x1-x)+(y1-y)-1,(x-x0)+(y1-y)-1);if(c<X.cut)c=0;
    // (the ring's tiles in order round it, clockwise from its top left, each its stretch (seg: n e s w, or a diagonal ne se sw nw: a
    // staircase, two tiles a step, every tile beside the last); square (c 0) as before)
    const loop=[],seg=[],put=(x,y,g)=>{loop.push([x,y]);seg.push(g)};
    if(!c){for(let x=x0;x<x1;x++)put(x,y0,'n');for(let y=y0;y<y1;y++)put(x1,y,'e');for(let x=x1;x>x0;x--)put(x,y1,'s');for(let y=y1;y>y0;y--)put(x0,y,'w')}
    else{for(let x=x0+c+1;x<=x1-c;x++)put(x,y0,'n');for(let k=1;k<=c;k++){put(x1-c+k,y0+k-1,'ne');put(x1-c+k,y0+k,'ne')}
      for(let y=y0+c+1;y<=y1-c;y++)put(x1,y,'e');for(let k=1;k<=c;k++){put(x1-k+1,y1-c+k,'se');put(x1-k,y1-c+k,'se')}
      for(let x=x1-c-1;x>=x0+c;x--)put(x,y1,'s');for(let k=1;k<=c;k++){put(x0+c-k+1,y1-k,'sw');put(x0+c-k,y1-k,'sw')}
      for(let y=y1-c-1;y>=y0+c;y--)put(x0,y,'w');for(let k=1;k<=c;k++){put(x0+k-1,y0+c-k,'nw');put(x0+k,y0+c-k,'nw')}}
    // (its diagonals as drawn: a line through the middles of their end tiles, a segment a step: {x, y (its left end, tiles), up: rising
    // to the right, a, b: its two end tiles})
    const diags=[];if(c)for(let k=0;k<c;k++){diags.push({x:x1-c+k,y:y0+k,up:false,a:[x1-c+k,y0+k],b:[x1-c+k+1,y0+k+1]},{x:x1-c+k,y:y1-k,up:true,a:[x1-c+k,y1-k],b:[x1-c+k+1,y1-k-1]},
      {x:x0+k,y:y1-c+k,up:false,a:[x0+k,y1-c+k],b:[x0+k+1,y1-c+k+1]},{x:x0+k,y:y0+c-k,up:true,a:[x0+k,y0+c-k],b:[x0+k+1,y0+c-k-1]})}
    const n=loop.length,own=new Set(t.lots.map(l=>l.id)),kind=new Array(n).fill('w');
    loop.forEach(([x,y],j)=>{if(x<0||y<0||x>=MW||y>=MH){kind[j]='-';return}const k=tiles[y*MW+x],o=occAt(x,y);
      if(!passable(k))kind[j]='-';else if(k===T_FORD&&TownWall.crosses(x,y,x0,y0,x1,y1))kind[j]='g';else if(o>0&&!own.has(o))kind[j]='-'});
    // (the gates where its roads pass through it (the owner, 2026-11-06: "a gate and wall realistically matched with the roads"): along
    // each road's own path, a stretch of it on the ring come in from outside and going on inside (or the other way): its gate the
    // tile it steps through by, so the road runs straight through the gate; a road only running along the wall makes none)
    const idx=new Map(loop.map(([x,y],j)=>[y*MW+x,j])),ring0={x0,y0,x1,y1,c},side=i=>{const x=i%MW,y=(i-x)/MW;return idx.has(i)?0:TownWall.inside(ring0,x,y)?-1:1};
    for(const rd of WM.roads||[]){const P2=rd.path;for(let k=0;k<P2.length;){if(side(P2[k])!==0){k++;continue}let e=k;while(e+1<P2.length&&side(P2[e+1])===0)e++;
      const a=k>0?side(P2[k-1]):0,b=e+1<P2.length?side(P2[e+1]):0;if(a&&b&&a!==b){const j=idx.get(b<0?P2[e]:P2[k]);if(kind[j]!=='-')kind[j]='g'}k=e+1}}
    if(!kind.includes('g'))loop.forEach(([x,y],j)=>{if(kind[j]==='w'&&tAt(x,y)===T_ROAD&&TownWall.crosses(x,y,x0,y0,x1,y1))kind[j]='g'});// (no road's path through it: as a road's tiles cross it)
    // (gates near each other one: the wall between them open)
    for(let j=0;j<n;j++)if(kind[j]==='g')for(let d=2;d<=X.merge;d++){const q=(j+d)%n;if(kind[q]==='g'){for(let e=1;e<d;e++)if(kind[(j+e)%n]==='w')kind[(j+e)%n]='o';break}}
    // (each gate a tile wider either side; none on the ring: one below the centre, on its bottom stretch)
    if(!kind.includes('g')){const j=loop.findIndex(([x,y])=>y===y1&&x===t.tx);if(j>=0&&kind[j]==='w')kind[j]='g'}
    const g0=kind.map(k=>k==='g');for(let j=0;j<n;j++)if(g0[j])for(let d=1;d<=X.gate;d++)for(const q of [(j+d)%n,(j-d+n)%n])if(kind[q]==='w')kind[q]='o';
    const corner=j=>seg[j]!==seg[(j-1+n)%n]&&seg[j].length===1||seg[j].length===1&&seg[(j+1)%n]!==seg[j],parts=[],shut=[],gates=[],arches=[],L=wallOf(t),open=q=>kind[q]==='g'||kind[q]==='o';
    // (its towers: at its corners and either side of each gate; on a stone wall's long stretches one every X.towers tiles, never within
    // 3 of another)
    const tw=new Array(n).fill(false);loop.forEach(([x,y],j)=>{if(kind[j]==='w'&&(corner(j)||open((j+1)%n)||open((j-1+n)%n)))tw[j]=true});
    if(L>1)for(let j=0;j<n;j++){if(kind[j]!=='w'||tw[j]||j%X.towers)continue;let near=false;for(let d=-3;d<=3&&!near;d++)if(d&&(tw[(j+d+n)%n]||open((j+d+n)%n)))near=true;if(!near)tw[j]=true}
    loop.forEach(([x,y],j)=>{const i=y*MW+x;if(open(j)){gates.push(i);return}if(kind[j]!=='w')return;const g=seg[j],diag=g.length===2;
      const k=corner(j)&&!diag?'c':tw[j]&&!diag?'t':diag?'x':g==='n'||g==='s'?'h':'v';parts.push({i,x,y,k});shut.push(i)});
    // (a diagonal's segment drawn where its two ends are walls (a gate or no wall at either: none))
    const segs=diags.filter(d=>[d.a,d.b].every(([x,y])=>{const q=idx.get(y*MW+x);return q!=null&&kind[q]==='w'}));
    // (each gate's arch: its run of open tiles along a stretch across (over the road a gateway in the wall's face) or down (the walk
    // bridged over it), each tile its place in the run (p of w))
    for(let j=0;j<n;j++){if(!open(j)||open((j-1+n)%n))continue;const run=[];let q=j;while(open(q)&&run.length<n){run.push(q);q=(q+1)%n}
      run.forEach((r,p)=>{const [x,y]=loop[r];arches.push({i:y*MW+x,x,y,k:seg[r]==='n'||seg[r]==='s'?'ah':'av',p,w:run.length})})}
    return{x0,y0,x1,y1,c,parts,shut,gates,arches,diags:segs}}
  // (is tile (x, y) inside ring r: within its rectangle, past its cut corners, not on it)
  static inside(r,x,y){const c=r.c||0;return x>r.x0&&x<r.x1&&y>r.y0&&y<r.y1&&(x-r.x0)+(y-r.y0)>c&&(r.x1-x)+(y-r.y0)>c&&(r.x1-x)+(r.y1-y)>c&&(x-r.x0)+(r.y1-y)>c}
  // (its corners round it, for an outline: px, field (x, y) by its tiles' middles)
  static outline(r){const c=r.c||0,a=[[r.x0+c,r.y0],[r.x1-c,r.y0],[r.x1,r.y0+c],[r.x1,r.y1-c],[r.x1-c,r.y1],[r.x0+c,r.y1],[r.x0,r.y1-c],[r.x0,r.y0+c]];return a}
  // (a fence at the start: a hamlet or village with no walls, its estates' levels and up to 2 more by a hash of its place at FENCE.start's by its kind)
  static fenceStart(t){const S=FENCE.start[t.kind];if(wallOf(t)>0||S==null)return 0;const B=t.bld?Object.values(t.bld).reduce((a,v)=>a+(v||0),0):0;return B+2*hash(t.tx,t.ty,FENCE.salt)>=S?1:0}
  // (its day (world/buildings.js Buildings day): its fence as it started kept; one with none grows one as it prospers, but yours)
  static fenceDay(t){if(!TOWN_WALL.on)return;if(t.fence==null)t.fence=TownWall.fenceStart(t);if(t.fence||wallOf(t)>0||t.owner==='player'||t.work||t.gone)return;
    if((t.pros||0)<FENCE.pros||rngOf('fences').next()>=FENCE.daily||!t.econ||t.econ.lacking(FENCE.mats).length)return;t.econ.take(FENCE.mats);t.fence=1;
    if(Math.hypot(t.x-P.x,t.y-P.y)<vis()*1.5)log('The folk of '+t.name+' raise a fence round it.','muted')}
  // (does a road cross the ring at its tile (x, y): a road or a ford on the tile in or out of it, not one running along it)
  static crosses(x,y,x0,y0,x1,y1){const r=(a,b)=>{const k=tAt(a,b);return k===T_ROAD||k===T_FORD};return y===y0||y===y1?r(x,y-1)||r(x,y+1):r(x-1,y)||r(x+1,y)}
  // (whoever stands on a wall just raised steps off it: to the nearest open tile (the parties, the beasts, the critters, you))
  static evict(shut){const S=new Set(shut),W2=typeof W!=='undefined'?W:{},who=[P,...(W2.lords||[]),...(W2.caravans||[]),...bandits,...(W2.refugees||[]),...(W2.monsters||[]),...(W2.critters||[]),...(W2.patrols||[]),...(W2.folk||[])];
    for(const o of who){if(!o||o.x==null)continue;const tx=Math.floor(o.x/TILE),ty=Math.floor(o.y/TILE);if(!S.has(ty*MW+tx))continue;
      for(let r=1;r<6;r++){let done=false;for(let j=-r;j<=r&&!done;j++)for(let i=-r;i<=r;i++){const x=tx+i,y=ty+j;if(Math.max(Math.abs(i),Math.abs(j))!==r||!passable(tAt(x,y))||S.has(y*MW+x)||TownWall.at(x,y))continue;o.x=(x+.5)*TILE;o.y=(y+.5)*TILE;done=true;break}if(done)break}}}
  /* (the owner, 2026-11-06: gates shut to its foes) its gates shut: while it is besieged (a lord's siege, yours), an army at war with
     it marches on it within TOWN_WALL.alarm tiles, or you, its foe, stand outside its walls that near; then no one passes (holdShut
     shuts its gates too), and its besiegers camp outside a gate (camp) */
  static shutTo(t){const r=TownWall.of(t);if(!r)return false;if(t.besiegers().length||mySiege(t))return true;const A=TOWN_WALL.alarm*TILE,near=o=>Math.hypot(o.x-t.x,o.y-t.y)<A;
    if(t.owner&&W.lords.some(l=>!l.dead&&!l.inside&&l.tgt===t.name&&l.state==='march'&&atWar(l.fac,t.owner)&&near(l)))return true;
    const tx=Math.floor(P.x/TILE),ty=Math.floor(P.y/TILE),inside=TownWall.inside(r,tx,ty);return foeAt(t)&&near(P)&&!inside}
  // (where its besiegers camp: TOWN_WALL.camp tiles out of the gate nearest from (an army, you); null with no walls or no gate)
  static camp(t,from){const r=TownWall.of(t);if(!r||!r.gates.length)return null;let best=null,bd=Infinity;
    for(const i of r.gates){const x=i%MW,y=(i-x)/MW,d=Math.hypot((x+.5)*TILE-from.x,(y+.5)*TILE-from.y);if(d<bd){bd=d;best=[x,y]}}
    // (out from its middle, through that gate, TOWN_WALL.camp tiles)
    const [x,y]=best,c=TOWN_WALL.camp,mx=(r.x0+r.x1)/2,my=(r.y0+r.y1)/2,ox=x+.5-mx,oy=y+.5-my,ax=Math.abs(ox)/(r.x1-r.x0+1),ay=Math.abs(oy)/(r.y1-r.y0+1),dx=ax>=ay*.6?Math.sign(ox)*c:0,dy=ay>=ax*.6?Math.sign(oy)*c:0;return{x:(x+.5+dx)*TILE,y:(y+.5+dy)*TILE}}
  // (its colour on the full map and the minimap: stone, a palisade's timber, a fence's wattle)
  static mapCol(t){const L=wallOf(t);return L>=2?'#e4ddd0':L===1?'#b06a3c':'#c8a06a'}
  // (the ground its walls keep clear of trees and growth: their line and TOWN_WALL.clear tiles either side, its gates too; mark(x, y, w, h) in px)
  static clearOf(t,mark){const r=TownWall.of(t);if(!r)return;const c=TOWN_WALL.clear;for(const i of r.shut.concat(r.gates)){const x=i%MW,y=(i-x)/MW;mark((x-c)*TILE,(y-c)*TILE,(2*c+1)*TILE,(2*c+1)*TILE)}}
  // (a ring raised or changed (router.js holdShut): its band kept clear on the painter's plan, and its chunks painted again)
  static repaint(r){if(!r||typeof WorldArt==='undefined')return;const A=WorldArt,c=TOWN_WALL.clear;if(A.plan)for(const i of r.shut.concat(r.gates)){const x=i%MW,y=(i-x)/MW;A.plan.clear.fill((x-c)*TILE,(y-c)*TILE,(2*c+1)*TILE,(2*c+1)*TILE)}
    const a=PX.WN_APRON+TILE*(c+1);A.forget(r.x0*TILE-a,r.y0*TILE-a,(r.x1+1)*TILE+a,(r.y1+1)*TILE+a)}
  // (is tile (tx, ty) one of a ring's walls: SHUT's bit 4, router.js)
  static at(tx,ty){return !!SHUT&&tx>=0&&ty>=0&&tx<MW&&ty<MH&&(SHUT[ty*MW+tx]&4)>0}
  // its walls among the buildings: each piece by its feet, as you have seen its ground
  static ents(t,ents,cam){const r=TownWall.of(t);if(!r)return;const L=wallOf(t),S=TownWall.look(t),H=TOWN_WALL.h[L]||TOWN_WALL.fh;
    // (its gates shut: their doors across them)
    if(HOLD_SHUT.ring.get(t)?.closed)for(const i of r.gates){const x=i%MW,y=(i-x)/MW;if(!seenTile(x,y))continue;const X=x*TILE-cam.x,foot=(y+1)*TILE,Y=foot-cam.y;if(X<-24||X>VW+24||Y<-4||Y-H-40>VH)continue;
      const s=TownWall.sprite(S,L,(y===r.y0||y===r.y1)&&x>r.x0+r.c-1&&x<r.x1-r.c+1?'dh':'dv');ents.push({y:foot-2,f:()=>ctx.drawImage(s,Math.round(X-s.ax),Math.round(Y-s.height))})}
    // (its diagonal stretches: a segment a step, by its lower end's feet)
    for(const d of r.diags||[]){const yb=Math.max(d.a[1],d.b[1]);if(!seenTile(d.a[0],d.a[1])&&!seenTile(d.b[0],d.b[1]))continue;const X=(d.x+.5)*TILE-cam.x,foot=(yb+.5)*TILE+8,Y=foot-cam.y;if(X<-24||X>VW+24||Y<-4||Y-H-60>VH)continue;
      const s=TownWall.sprite(S,L,d.up?'d/':'d\\');ents.push({y:foot-1,f:()=>ctx.drawImage(s,Math.round(X),Math.round(Y-s.height))})}
    // (its gateways over the roads: walls' arches, never a fence's)
    if(L>0)for(const a of r.arches||[]){if(!seenTile(a.x,a.y))continue;const X=a.x*TILE-cam.x,foot=(a.y+1)*TILE,Y=foot-cam.y;if(X<-24||X>VW+24||Y<-4||Y-H-40>VH)continue;
      const s=TownWall.archPic(S,L,a.k,a.p,a.w);ents.push({y:foot-1,f:()=>ctx.drawImage(s,Math.round(X-s.ax),Math.round(Y-s.height))})}
    for(const p of r.parts){const X=p.x*TILE-cam.x,foot=(p.y+1)*TILE,Y=foot-cam.y;if(X<-24||X>VW+24||Y<-4||Y-H-40>VH)continue;if(!seenTile(p.x,p.y))continue;
      const s=TownWall.sprite(S,L,p.k);ents.push({y:foot-1,f:()=>ctx.drawImage(s,Math.round(X-s.ax),Math.round(Y-s.height))})}}
  // (its culture's colours: stone for stone and great walls (its arena's, a stone culture's, else the Vale's), timber for a palisade)
  static look(t){const A=TOURNEY_ARENA.walls,cul=holdingCulture(t),st=A[cul]&&A[cul].kind==='stone'?A[cul]:A.vale,wd=A[cul]&&A[cul].kind!=='stone'?A[cul]:A.timber;
    return{cul,stone:st.c,wood:wd.c,trim:st.trim}}
  /* a piece's picture (kept by its look, height and kind), ax: its left from its tile's: 'h' a stretch across, its walk and
     merlons over its face; 'v' one down, its walk between two parapets raised over its tile, its face at its foot; 'c' and 't' a
     tower, wider and taller, crenellated, an arrow slit in its face. A palisade's of stakes, its towers of timber */
  static sprite(S,L,k){const key='twall'+S.cul+L+k;if(spr[key])return spr[key];const X=TOWN_WALL;if(!L)return spr[key]=TownWall.fence(k);const H=X.h[L],T=X.top,stake=L<=1,C=stake?S.wood:S.stone,cv=TownWall.piece(C,H,T,k,stake);return spr[key]=cv}
  // (a fence's pieces: woven hurdles between stakes, low; posts at its corners and by its gates; a gate of rails across a gap)
  static fence(k){const H=TOWN_WALL.fh,C=['#c8a06a','#9a7444','#6e4e2c','#4a3420'];let cv,g;
    if(k==='h'||k==='dh'){cv=mkcv(16,H+2);g=cv.getContext('2d');cv.ax=0;if(k==='dh'){rect(g,C[3],0,2,1,H);rect(g,C[3],15,2,1,H);for(const y of [3,H-1])rect(g,C[1],0,y,16,2);return cv}
      for(let y=2;y<H+2;y++)for(let x=0;x<16;x++){const w=((x>>1)+(y>>1))%2;g.fillStyle=y===2?C[0]:w?C[1]:C[2];g.fillRect(x,y,1,1)}rect(g,C[3],0,H+1,16,1);for(const x of [0,8]){rect(g,C[3],x,0,2,H+2);rect(g,C[0],x,0,1,1)}return cv}
    if(k==='v'||k==='dv'){cv=mkcv(4,16+H);g=cv.getContext('2d');cv.ax=-6;if(k==='dv'){rect(g,C[1],1,0,2,16);return cv}for(let y=0;y<16+H;y++)rect(g,y%3?C[1]:C[2],0,y,4,1);rect(g,C[0],0,0,1,16);rect(g,C[3],3,0,1,16+H);return cv}
    cv=mkcv(6,H+6);g=cv.getContext('2d');cv.ax=-5;rect(g,C[3],1,0,4,H+6);rect(g,C[1],2,0,2,H+5);rect(g,C[0],2,0,1,2);return cv}
  static piece(C,H,T,k,stake){if(k==='dh'||k==='dv')return TownWall.doors(C,H,T,k,stake);if(k==='x')return mkcv(1,1);if(k==='d\\'||k==='d/')return TownWall.diag(C,H,T,k==='d\\',stake);let W,Hh,ax;if(k==='h'){W=16;Hh=H+T;ax=0}else if(k==='v'){W=8;Hh=16+H;ax=-4}else{W=20;Hh=16+H+TOWN_WALL.tower;ax=2}
    const cv=mkcv(W,Hh),g=cv.getContext('2d');cv.ax=ax;
    if(k==='h'){// (its face below, the walk over it, merlons along its top)
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){const row=y>>2,c=stake?(x%3===0?C[3]:x%3===1?C[0]:C[1]):(y%4===0||(x+(row&1)*4)%8===0)?C[2]:C[1];g.fillStyle=c;g.fillRect(x,T+y,1,1)}
      rect(g,C[3],0,T+H-1,W,1);rect(g,C[2],0,T,W,1);
      if(stake){for(let x=0;x<W;x+=3){rect(g,C[0],x,T-3,2,3);rect(g,C[1],x,T-1,2,1)}rect(g,C[2],0,T-1,W,1)}
      else{rect(g,C[1],0,2,W,T-2);rect(g,C[2],0,T-1,W,1);for(let x=0;x<W;x+=4){rect(g,C[0],x,0,3,3);rect(g,C[2],x,3,3,1)}}}
    else if(k==='v'){// (its walk between parapets, raised; its face at its foot)
      for(let y=0;y<16;y++){if(stake){rect(g,y%3?C[1]:C[2],1,y,6,1);rect(g,C[0],0,y,1,1);rect(g,C[3],7,y,1,1)}else{rect(g,(y%4)?C[1]:C[2],2,y,4,1);rect(g,y%4<2?C[0]:C[2],0,y,2,1);rect(g,y%4<2?C[2]:C[3],6,y,2,1)}}
      for(let y=16;y<16+H;y++)for(let x=0;x<W;x++){const c=stake?(x%3===0?C[3]:C[1]):((y-16)%4===0||x===4)?C[2]:x<2?C[1]:C[2];g.fillStyle=c;g.fillRect(x,y,1,1)}rect(g,C[3],0,15+H,W,1)}
    else{// (a tower: its top crenellated, its face with a slit; a palisade's of timber, a little roof)
      const fy=Hh-H-TOWN_WALL.tower;
      for(let y=fy;y<Hh;y++)for(let x=0;x<W;x++){const row=y>>2,c=stake?(x%4===0?C[3]:x%4===1?C[0]:C[1]):(y%4===0||(x+(row&1)*4)%8===0)?C[2]:x<2?C[0]:x>W-3?C[3]:C[1];g.fillStyle=c;g.fillRect(x,y,1,1)}
      rect(g,'#14100c',W/2-1,fy+4,2,Math.min(6,Hh-fy-6));rect(g,C[3],0,Hh-1,W,1);
      rect(g,C[3],0,0,W,fy);rect(g,stake?C[2]:C[1],1,1,W-2,fy-2);rect(g,C[2],4,4,W-8,fy-8);
      if(stake){for(let x=0;x<W;x+=2)rect(g,x%4?C[1]:C[0],x,0,2,3)}else{for(let x=0;x<W;x+=5){rect(g,C[0],x,0,3,3);rect(g,C[2],x,3,3,1)}for(let y=0;y<fy;y+=5){rect(g,C[0],0,y,2,3);rect(g,C[0],W-2,y,2,3)}}}
    return cv}
  /* (a gateway's piece, the p-th of w tiles: across, the wall's walk and merlons over its face and an arch cut through it the run's
     width (its jambs and voussoirs lit, the passage's shade under it); down, the walk carried over the road on its lintel) */
  static archPic(S,L,k,p,w){const key='tarch'+S.cul+L+k+p+'/'+w;if(spr[key])return spr[key];const X=TOWN_WALL,H=X.h[L],T=X.top,stake=L<=1,C=stake?S.wood:S.stone;
    if(k==='av'){const cv=mkcv(8,16+4),g=cv.getContext('2d');cv.ax=-4;for(let y=0;y<16;y++){rect(g,y%4?C[1]:C[2],2,y,4,1);rect(g,C[0],0,y,2,1);rect(g,C[2],6,y,2,1)}rect(g,C[3],0,16,8,2);rect(g,'rgba(10,12,18,.35)',0,18,8,2);return spr[key]=cv}
    const cv=mkcv(16,H+T),g=cv.getContext('2d');cv.ax=0;const W2=w*16,x0=p*16,rx=W2/2-3,cx=W2/2,top=Math.max(3,H-Math.round(rx*.9));
    for(let y=0;y<H;y++)for(let x=0;x<16;x++){const gx=x0+x,dx=(gx+.5-cx)/rx,dy=(y+.5-top)/(H-top),hole=Math.abs(gx+.5-cx)<rx&&(y>=top+rx*.5||dx*dx+((y+.5-(top+rx*.5))/(rx*.5))**2<1);
      if(hole)continue;const edge=Math.abs(gx+.5-cx)<rx+2;const row=y>>2,c=stake?(gx%3===0?C[3]:gx%3===1?C[0]:C[1]):edge?(y%3===0?C[2]:C[0]):(y%4===0||(gx+(row&1)*4)%8===0)?C[2]:C[1];g.fillStyle=c;g.fillRect(x,T+y,1,1)}
    rect(g,C[3],0,T+H-1,16,1);if(stake){for(let x=0;x<16;x+=3){rect(g,C[0],x,T-3,2,3);rect(g,C[1],x,T-1,2,1)}rect(g,C[2],0,T-1,16,1)}
    else{rect(g,C[1],0,2,16,T-2);rect(g,C[2],0,T-1,16,1);for(let x=0;x<16;x+=4){rect(g,C[0],x,0,3,3);rect(g,C[2],x,3,3,1)}}
    return spr[key]=cv}
  /* (a diagonal's segment: a tile across and a tile down (up: rising to the right); its walk a band along the line over its feet
     (TOWN_WALL.top deep, merlons along its outer edge), its face hanging under it to its feet, H deep; a fence's hurdles low; its foot the
     segment's lower end) */
  static diag(C,H,T,down,stake){const W=17,Hh=16+H+T+2,cv=mkcv(W,Hh),g=cv.getContext('2d');cv.ax=0;
    for(let x=0;x<W;x++){const ly=down?x:16-x,top=ly+2;// (the line's foot at this x, from the canvas's top: its walk T, its face H)
      for(let y=0;y<H;y++){const row=(top+T+y)>>2,c=stake?(x%3===0?C[3]:x%3===1?C[0]:C[1]):((top+T+y+x)%4===0||(x+(row&1)*4)%8===0)?C[2]:down?C[1]:C[2];g.fillStyle=c;g.fillRect(x,top+T+y,1,1)}
      rect(g,C[3],x,top+T+H,1,1);rect(g,stake?C[2]:C[1],x,top+1,1,T-1);rect(g,C[2],x,top+T-1,1,1);
      if(stake){if(x%3<2)rect(g,C[0],x,top-2,1,3)}else if(x%4<3)rect(g,C[0],x,top,1,2)}
    return cv}
  // (a shut gate: its doors of studded planks across a stretch (dh), or their edge down one (dv), a dark arch over them)
  static doors(C,H,T,k,stake){const across=k==='dh',W=across?16:8,Hh=across?H+T:16+H,cv=mkcv(W,Hh),g=cv.getContext('2d');cv.ax=across?0:-4;
    const P2=['#3a2410','#6a4428','#8a5a34'],y0=across?T:16;rect(g,'#14100c',0,across?0:0,W,across?T:16);for(let x=0;x<W;x+=4){rect(g,P2[1],x,y0,3,H);rect(g,P2[2],x,y0,1,H)}rect(g,'#3a3a40',0,y0+2,W,1);rect(g,'#3a3a40',0,y0+H-4,W,1);
    for(let x=1;x<W;x+=4)rect(g,'#c8c8d0',x,y0+H/2,1,1);rect(g,P2[0],0,y0+H-1,W,1);return cv}
}
