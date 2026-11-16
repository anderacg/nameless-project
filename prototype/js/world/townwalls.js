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
   none, palisade, stone, great); top: its walk's depth (px); tower: a tower's rise over the wall (px); clear: the tiles either side of its line kept clear of the woods; fh: a fence's height (px); looks: a piece's looks (by a
   hash of its tile, salt); course: a stone course's rows, stake: a stake's width (fine px: its pictures at the lab's scale) */
// (on false, the owner 2026-11-06: "remove the walls for now": no rings, fences, gates or woods cleared on the map; the walls'
// levels still count in sieges and their fields)
const TOWN_WALL={on:false,fh:6,clear:1,cut:2,reach:14,pad:1,gate:1,merge:5,towers:7,alarm:16,camp:3,h:[0,10,13,16],top:6,tower:7,looks:4,salt:7717,course:5,stake:4};
/* (the owner, 2026-11-06: "the wall may be based on the holdings as well, if very poor they may start from none; think it like an
   upgrade") a fence: a wattle fence round a holding with no walls (fenceOf: t.fence once set), the first step before a palisade,
   drawn and blocking as a wall is but no wall in a fight (no siege, no defender's level). At the start (fenceStart), by what it
   has: its estates' levels and up to 2 by a hash of its place (start: the score for one, by its kind; salt); poor ones none. Later an upgrade: a
   realm's or the free folk's grows one by itself once it prospers (pros, by daily chance a day, gold and mats from its stock);
   yours you build in its Fortification (gold, mats, days) */
const FENCE={start:{town:8,village:6,hamlet:3.5},salt:4411,pros:65,daily:.05,gold:30,mats:{timber:12},days:2};
const fenceOf=t=>!TOWN_WALL.on?0:t.fence!=null?t.fence:TownWall.fenceStart(t);
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
  // its walls among the buildings: each piece by its feet, as you have seen its ground; each its look by its tile (lookAt)
  static ents(t,ents,cam){const r=TownWall.of(t);if(!r)return;const L=wallOf(t),S=TownWall.look(t),H=TOWN_WALL.h[L]||TOWN_WALL.fh,put=TownWall.put;
    // (its gates shut: their doors across them)
    if(HOLD_SHUT.ring.get(t)?.closed)for(const i of r.gates){const x=i%MW,y=(i-x)/MW;if(!seenTile(x,y))continue;const X=x*TILE-cam.x,foot=(y+1)*TILE,Y=foot-cam.y;if(X<-24||X>VW+24||Y<-4||Y-H-40>VH)continue;
      const s=TownWall.sprite(S,L,(y===r.y0||y===r.y1)&&x>r.x0+r.c-1&&x<r.x1-r.c+1?'dh':'dv',TownWall.lookAt(x,y));ents.push({x:X+cam.x,ly:foot-1,y:foot-2,f:()=>put(s,X,Y)})}
    // (its diagonal stretches: a segment a step, by its lower end's feet)
    for(const d of r.diags||[]){const yb=Math.max(d.a[1],d.b[1]);if(!seenTile(d.a[0],d.a[1])&&!seenTile(d.b[0],d.b[1]))continue;const X=(d.x+.5)*TILE-cam.x,foot=(yb+.5)*TILE+8,Y=foot-cam.y;if(X<-24||X>VW+24||Y<-4||Y-H-60>VH)continue;
      const s=TownWall.sprite(S,L,d.up?'d/':'d\\',TownWall.lookAt(d.x,yb));ents.push({x:X+cam.x+8,ly:foot-1,y:foot-1,f:()=>put(s,X,Y)})}
    // (its gateways over the roads: walls' arches, never a fence's)
    if(L>0)for(const a of r.arches||[]){if(!seenTile(a.x,a.y))continue;const X=a.x*TILE-cam.x,foot=(a.y+1)*TILE,Y=foot-cam.y;if(X<-24||X>VW+24||Y<-4||Y-H-40>VH)continue;
      const s=TownWall.archPic(S,L,a.k,a.p,a.w);ents.push({x:X+cam.x,ly:foot-1,y:foot-1,f:()=>put(s,X,Y)})}
    for(const p of r.parts){const X=p.x*TILE-cam.x,foot=(p.y+1)*TILE,Y=foot-cam.y;if(X<-24||X>VW+24||Y<-4||Y-H-40>VH)continue;if(!seenTile(p.x,p.y))continue;
      const s=TownWall.sprite(S,L,p.k,TownWall.lookAt(p.x,p.y));ents.push({x:X+cam.x,ly:foot-1,y:foot-1,f:()=>put(s,X,Y)})}}
  // (its culture's colours: stone for stone and great walls (its arena's, a stone culture's, else the Vale's), timber for a palisade)
  static look(t){const A=TOURNEY_ARENA.walls,cul=holdingCulture(t),st=A[cul]&&A[cul].kind==='stone'?A[cul]:A.vale,wd=A[cul]&&A[cul].kind!=='stone'?A[cul]:A.timber;
    return{cul,stone:st.c,wood:wd.c,trim:st.trim}}
  /* (its pictures at the lab's scale (2026-11-16: a picture's px a fine px, twice the detail at the same size): each painted
     z fine px a game px (WORLD_VIEW.build), its size and ax in game px as before, drawn back to its size (put). Stone laid in courses
     of blocks, each lit along its top and left and shaded at its right, the mortar between, grime at its foot; stakes and wattle by
     the stick. A piece's look by a hash of its tile (lookAt, TOWN_WALL.looks of them): moss at its foot, a stain run down it, a
     mended patch of new stone, a crack; a tower roofed, its hatch, a brazier on it) */
  static lookAt(x,y){return Math.floor(hash(x,y,TOWN_WALL.salt)*TOWN_WALL.looks)}
  static put(s,X,Y){const z=s.z||1;ctx.drawImage(s,Math.round(X-s.ax),Math.round(Y)-s.height/z,s.width/z,s.height/z)}
  // (a picture w x h game px, its left ax from its tile's, painted by f(set, W, H, g) on its fine px: set(x, y, colour, w, h))
  static pic(w,h,ax,f){const z=Math.round(1/WORLD_VIEW.build),cv=mkc(w*z,h*z,g=>f((x,y,c,ww=1,hh=1)=>{if(!c)return;g.fillStyle=c;g.fillRect(x,y,ww,hh)},w*z,h*z,g));cv.ax=ax;cv.z=z;return cv}
  // (a ramp's tones: its four and the steps between them)
  static tones(C){const m=PX.mix;return{hi:PX.shade(C[0],1.07),a:C[0],ab:m(C[0],C[1],.5),b1:m(C[1],C[0],.3),b:C[1],b2:m(C[1],C[2],.3),bc:m(C[1],C[2],.5),c:C[2],cd:m(C[2],C[3],.5),d:C[3],
    moss:m(C[1],'#4e6a30',.6),moss2:m(C[2],'#3a5226',.6)}}
  /* (a stone face, w x h fine px from (x0, y0): courses of TOWN_WALL.course rows from its foot; each block lit along its top and left,
     shaded at its right and foot, mortar over it and before it; its joints the same in every tile (a block runs on into the next
     tile, so the wall is one), sx its own place along them; a block in the tile tinted by look v. v's touches: 1 moss at the foot
     and in the joints, 2 a stain down from the top, 3 a mended patch of new stone, 0 a crack) */
  static masonry(set,K,x0,y0,w,h,v,sx=0){const C=TOWN_WALL.course,LEN=[[8,7,9,8],[10,6,9,7],[7,9,8,8],[6,10,7,9]],sc=Math.floor(hash(v,3,91)*24)+4,pc=Math.floor(hash(v,5,93)*(w-10))+2;
    for(let y=0;y<h;y++){const yb=h-1-y,c=Math.floor(yb/C),r=yb%C,L=LEN[c%4],o=(c*13+5)%32;
      for(let x=0;x<w;x++){const gx=((x+sx-o)%32+32)%32;let j=0,a=0;while(a+L[j]<=gx){a+=L[j];j++}const e=a+L[j]-1,xa=((a+o-sx)%32+32)%32,inside=xa+L[j]<=32,q=hash(c,j,inside?v*7+1:0);
        let col=q<.18?K.b1:q>.84?K.b2:K.b;
        if(r===C-1||gx===a)col=K.c;else if(r===C-2||gx===a+1)col=q<.18?K.a:K.ab;else if(gx===e||r===0)col=K.bc;else if(hash(x+sx,y,11)<.06)col=K.bc;
        if(v===3&&Math.abs(x-pc-4)<6&&yb>=C*2&&yb<C*4&&col!==K.c)col=PX.mix(col,K.hi,.45);// (mended: new stone, paler)
        if(v===2&&x>=sc&&x<sc+3&&hash(x,y,13)<.8-y/h)col=PX.mix(col,K.d,.22);// (a stain run down from the top)
        if(v===0&&c===2&&j===1&&inside&&x===xa+3+((r>>1)&1))col=K.cd;// (a crack)
        if(v===1&&yb<7&&hash(x,y,17)<(col===K.c?.75:.4)*(1-yb/7))col=col===K.c?K.moss2:K.moss;
        if(yb<2)col=PX.mix(col,K.d,yb?.18:.36);set(x0+x,y0+y,col)}}}
  /* (a stretch's walk, seen from over it, W fine px across from row y0, TOWN_WALL.top deep: its far parapet crenellated (each merlon's
     top lit, its face, the crenels' sills between), its inner face, the shade at its foot, the flagstones, its near edge lit) */
  static walk(set,K,y0,W){for(let x=0;x<W;x++){const m=x%8<5,e=x%8===4,f=x%8===0;
      if(m){set(x,y0,f?K.a:K.hi);set(x,y0+1,e?K.ab:K.a);set(x,y0+2,f?K.ab:e?K.bc:K.b);set(x,y0+3,e?K.bc:K.b)}else{set(x,y0+3,K.ab)}
      for(let y=4;y<7;y++)set(x,y0+y,y===6&&x%11===3?K.bc:K.b);set(x,y0+7,K.cd);
      for(let y=8;y<11;y++)set(x,y0+y,(x+(y>9?4:0))%9===0?K.bc:y===8?K.b2:K.b1);set(x,y0+11,K.a)}}
  /* (stakes along a stretch, w fine px from x0, their feet on row y1: each TOWN_WALL.stake px across, lit at its left, shaded at its
     right, its point cut, a little taller or shorter by a hash, a binding rail across them low; top: the highest point's row) */
  static stakes(set,K,x0,w,top,y1,v){const s=TOWN_WALL.stake;for(let x=0;x<w;x++){const i=Math.floor(x/s),u=x%s,j=Math.round(hash(i,v,41)*3),t=top+j,bark=hash(i,v,43)<.25,mid=(s-1)/2,tip=Math.round(Math.abs(u-mid));
      for(let y=t+tip;y<=y1;y++){const yb=y1-y,rail=yb>=Math.round((y1-top)*.3)&&yb<Math.round((y1-top)*.3)+3;let col=u===0?K.ab:u===s-1?K.cd:u===s-2?K.bc:bark?K.b2:K.b;
        if(y===t+tip)col=u<=mid?K.hi:K.ab;else if(rail)col=yb===Math.round((y1-top)*.3)+2?K.ab:K.c;else if(hash(x,y,47)<.08)col=K.bc;if(yb<2)col=PX.mix(col,K.d,yb?.2:.4);set(x0+x,y,col)}}}
  // a piece's picture (kept by its look, height, kind and tile's look v): a stone wall's or a palisade's (piece), a fence's (fence)
  static sprite(S,L,k,v=0){const key='twall'+S.cul+L+k+v;if(spr[key])return spr[key];if(!L)return spr[key]=TownWall.fence(k,v);const X=TOWN_WALL,stake=L<=1;
    return spr[key]=TownWall.piece(TownWall.tones(stake?S.wood:S.stone),X.h[L],X.top,k,stake,v,TownWall.tones(stake?S.stone:S.wood))}
  /* (a fence's pieces: hurdles of rods woven between thin uprights, low, stout posts at their ends ('h' across, 'v' down, its line seen
     from over it); a post at its corners and by its gates; a gate of rails braced across a gap (dh, dv)) */
  static fence(k,v){const H=TOWN_WALL.fh,K=TownWall.tones(['#c8a06a','#9a7444','#6e4e2c','#4a3420']);
    const post=(set,x,y0,y1)=>{for(let y=y0;y<=y1;y++){set(x,y,y===y0?K.hi:K.ab);set(x+1,y,y===y0?K.a:K.b);set(x+2,y,K.c)}};
    if(k==='h'||k==='dh')return TownWall.pic(16,H+2,0,(set,W,Hh)=>{
      if(k==='dh'){for(const x of [0,W-3])post(set,x,4,Hh-1);for(const y of [6,Hh-5])for(let x=3;x<W-3;x++){set(x,y,K.a);set(x,y+1,K.c)}
        for(let x=3;x<W-3;x++){const y=Math.round(Hh-4-(x-3)*(Hh-11)/(W-7));set(x,y,K.ab);set(x,y+1,K.cd)}return}
      for(let y=4;y<Hh-1;y++)for(let x=0;x<W;x++){const rod=(y-4)>>1,front=((x>>2)+rod)%2===0,u=x%4===0;set(x,y,u&&!front?K.cd:front?((y-4)%2?K.b:K.a):((y-4)%2?K.d:K.c))}
      for(let x=0;x<W;x++)set(x,Hh-1,hash(x,v,51)<.6?K.d:K.cd);for(const x of [0,16])post(set,x,0,Hh-1)});
    if(k==='v'||k==='dv')return TownWall.pic(4,16+H,-6,(set,W,Hh)=>{if(k==='dv'){for(let y=0;y<32;y++){set(2,y,y%8<1?K.c:K.a);set(3,y,K.c)}return}
      for(let y=0;y<Hh;y++){const face=y>=32,s=(y>>1)%2;set(2,y,face?(y===Hh-1?K.d:s?K.b:K.a):s?K.ab:K.b);set(3,y,face?(s?K.d:K.c):K.c);set(4,y,face?K.cd:K.d)}
      for(let y=0;y<32;y+=16){set(1,y,K.hi);set(2,y,K.a,3,1);set(1,y+1,K.ab,4,2);set(4,y+1,K.c,1,2)}});
    // (a diagonal's hurdle along its line, its feet as a wall's diagonal's (diag), a post at each step)
    if(k==='d\\'||k==='d/')return TownWall.pic(17,16+H+2,0,(set,W,Hh)=>{const top=x=>(k==='d\\'?x:32-x)+4;
      for(let x=0;x<W;x++)for(let y=0;y<H*2;y++){const front=((x>>2)+(y>>1))%2===0;set(x,top(x)+y,y===H*2-1?K.d:front?(y%2?K.b:K.a):(y%2?K.d:K.c))}
      for(const x of [0,16])post(set,x,top(x+1)-4,top(x+1)+H*2-1)});
    return TownWall.pic(6,H+6,-5,(set,W,Hh)=>{post(set,4,2,Hh-1);set(5,0,K.a,1,2);set(6,1,K.c);set(4,1,K.ab);for(let y=Hh-2;y<Hh;y++)set(4,y,K.cd,3,1);if(v===2)set(4,Math.round(Hh*.4),K.d,3,1)})}
  /* (a stone wall's or a palisade's piece, its tones K (and its other material's, O): 'h' a stretch across, its walk over its face;
     'v' one down, its walk between two parapets raised over its tile, its face at its foot; 'c' and 't' a tower, wider and taller,
     crenellated, corbelled, an arrow slit in its face; 'd\' and 'd/' a diagonal's segment; 'dh' and 'dv' shut doors. A palisade's
     of stakes, its towers of timber) */
  static piece(K,H,T,k,stake,v,O){if(k==='dh'||k==='dv')return TownWall.doors(K,H,T,k,stake);if(k==='x')return TownWall.pic(1,1,0,()=>{});if(k==='d\\'||k==='d/')return TownWall.diag(K,H,T,k==='d\\',stake,v);
    if(k==='h')return TownWall.pic(16,H+T,0,(set,W,Hh)=>{const fy=T*2;
      if(stake){TownWall.stakes(set,K,0,W,fy-6,Hh-1,v);return}TownWall.walk(set,K,0,W);TownWall.masonry(set,K,0,fy,W,Hh-fy,v);for(let x=0;x<W;x++)set(x,fy,K.cd)});
    if(k==='v')return TownWall.pic(8,16+H,-4,(set,W,Hh)=>{
      if(stake){/* (stakes in a line down it, each its point and its body, the one in front over the one behind) */const s=TOWN_WALL.stake;
        for(let y=0;y<=32;y+=s){const o=(y/s)%2?1:0,x0=(W-s)/2+o,t=y+Math.round(hash(y,v,45)*2);TownWall.stakes(set,K,x0,s,t,Math.min(Hh-1,t+H*2+4),y*7+v)}return}
      for(let y=0;y<32;y++){const m=y%8<5,e=y%8===4;
        for(const [x,lit] of [[0,true],[12,false]])for(let i=0;i<4;i++){const xx=x+i,inner=lit?i===3:i===0;set(xx,y,inner?(lit?K.c:K.ab):m?(e?K.ab:i===(lit?0:1)?K.hi:K.a):(i===(lit?0:3)?K.bc:K.b))}
        for(let x=4;x<12;x++)set(x,y,(y+(x>7?4:0))%9===0||x===4?K.bc:y%9>5?K.b1:K.b)}
      TownWall.masonry(set,K,0,32,W,Hh-32,v,(v*8)%32);for(let x=0;x<W;x++){set(x,32,K.cd)}for(let y=33;y<Hh;y++){set(0,y,K.ab);set(W-1,y,K.c)}});
    // (a tower: its top crenellated round a floor (a hatch, a brazier) or roofed, corbels under its parapet, a slit in its face)
    const R=6,roof=v===2,Rf=stake?TownWall.tones(['#c8a860','#a08448','#76603a','#4e4028']):O;return TownWall.pic(20,16+H+TOWN_WALL.tower+R,2,(set,W,Hh)=>{const y0=R*2,fy=y0+32;
      if(stake){/* (a timber tower: its walls of planks between corner posts, a slit, a parapet of stakes round its platform) */
        for(let y=fy;y<Hh;y++)for(let x=0;x<W;x++){const post=x<4||x>=W-4,r=(y-fy)%4;let col=post?(x===0||x===W-4?K.ab:x===3||x===W-1?K.cd:K.b):r===0?K.ab:r===3?K.cd:(x+(y>>2)*7)%13===0?K.bc:K.b;
          if(Hh-y<=2)col=PX.mix(col,K.d,.35);set(x,y,col)}
        for(let y=y0;y<fy;y++)for(let x=0;x<W;x++){const rim=x<4||x>=W-4||y<y0+4||y>=fy-3;set(x,y,rim?(((x+y)>>1)%3===0?K.hi:(x>=W-4||y>=fy-3)?K.b:K.a):(y-y0)%3===0?K.c:(x+((y-y0)/3|0)*5)%12===0?K.cd:((y-y0)/3|0)%2?K.bc:K.b2)}
        for(let x=0;x<W;x+=4){set(x,y0-2,K.hi,2,2);set(x+2,y0-1,K.ab,1,1)}
        for(let y=fy+8;y<fy+18;y++)set(W/2-1,y,'#14100c',2,1)}
      else{TownWall.masonry(set,K,0,fy,W,Hh-fy,v,(v*11)%32);for(let y=fy;y<Hh;y++){set(0,y,K.ab);set(1,y,K.b1);set(W-2,y,K.bc);set(W-1,y,K.c)}
        // (corbels under its parapet: a block every 5 px, the shade between them)
        for(let x=0;x<W;x++){const cb=x%5<3;set(x,fy,K.cd);set(x,fy+1,cb?K.a:K.d);set(x,fy+2,cb?K.bc:K.d);set(x,fy+3,cb?K.c:K.cd)}
        // (its slit: a cross for a look, else a plain one, lit at its sill)
        const sx=W/2-1,sy=fy+10;for(let y=sy;y<sy+12;y++)set(sx,y,'#14100c',2,1);if(v===1)set(sx-3,sy+4,'#14100c',8,2);set(sx-1,sy+12,K.hi,4,1);set(sx-1,sy-1,K.cd,4,1);
        // (its top: a parapet round the floor, merlons along it, the floor's flags shaded by it)
        for(let y=y0;y<fy;y++)for(let x=0;x<W;x++){const rim=x<4||x>=W-4||y<y0+4||y>=fy-3,m=((x>>2)+(y>>2))%2===0;
          set(x,y,rim?(m?(x<4||y<y0+4?K.hi:K.a):(x>=W-4||y>=fy-3?K.bc:K.b)):(x===4||y===y0+4?K.d:(x+((y-y0)>>2)*3)%7===0||(y-y0)%4===0?K.c:K.bc))}
        for(let x=4;x<W-4;x++)set(x,y0+4,K.b);for(let y=y0+5;y<fy-3;y++)set(W-5,y,K.ab);
        if(v===1){set(16,y0+12,O.c,8,8);set(17,y0+13,O.b,6,6);set(17,y0+15,O.d,6,1)}// (a hatch down into it)
        if(v===3){set(17,y0+11,'#3a3a40',6,4);set(18,y0+10,'#e8803a',4,1);set(19,y0+9,'#ffd070',2,1);set(16,y0+15,'#2a2a30',8,1)}}// (a brazier, its embers)
      // (roofed: a hipped roof over its top, its shingles in the other material's tones, lit on its left and front)
      if(roof)for(let y=0;y<fy-2;y++){const d=Math.max(0,y-(R*2-4)),half=Math.min(W/2,4+y*.9);for(let x=Math.round(W/2-half);x<Math.round(W/2+half);x++){const right=x>=W/2,row=Math.floor(y/3),sh=(x+(row%2)*2)%4===0;
          set(x,y,y%3===0?Rf.cd:sh?Rf.c:right?(d>4?Rf.bc:Rf.b):(y>fy-8?Rf.b1:Rf.a))}}})}
  /* (a gateway's piece, the p-th of w tiles: across, the wall's walk over its face and an arch cut through it the run's width, its
     ring of voussoirs, the vault's shade inside it and its far jamb, a stone wall's portcullis drawn up; a palisade's opening square
     under a log lintel; down, the walk carried over the road on its lintel, its shade under it) */
  static archPic(S,L,k,p,w){const key='tarch'+S.cul+L+k+p+'/'+w;if(spr[key])return spr[key];const X=TOWN_WALL,H=X.h[L],T=X.top,stake=L<=1,K=TownWall.tones(stake?S.wood:S.stone);
    if(k==='av')return spr[key]=TownWall.pic(8,16+4,-4,(set,W,Hh)=>{for(let y=0;y<32;y++){set(0,y,y%8<5?K.hi:K.b,3,1);set(3,y,K.c);set(12,y,K.ab);set(13,y,y%8<5?K.a:K.bc,3,1);for(let x=4;x<12;x++)set(x,y,y%9===0?K.bc:K.b)}
      for(let x=0;x<W;x++){set(x,32,K.ab);set(x,33,K.c);set(x,34,K.cd);set(x,35,K.d)}set(0,36,'rgba(10,12,18,.4)',W,2);set(0,38,'rgba(10,12,18,.2)',W,2)});
    return spr[key]=TownWall.pic(16,H+T,0,(set,W,Hh,g)=>{const fy=T*2,h=Hh-fy,W2=w*W,x0=p*W,cx=W2/2,rx=W2/2-6,top=Math.max(6,h-Math.round(rx*.9)),cy=top+rx*.5;
      // (the opening: inside an arch (a square for stakes); its ring: within 4 px outside it)
      const hole=(gx,y)=>stake?Math.abs(gx+.5-cx)<rx&&y>=top:Math.abs(gx+.5-cx)<rx&&(y>=cy||((gx+.5-cx)/rx)**2+((y+.5-cy)/(rx*.5))**2<1),
        ring=(gx,y)=>!hole(gx,y)&&(hole(gx+4,y)||hole(gx-4,y)||hole(gx,y+4)||hole(gx+3,y+3)||hole(gx-3,y+3));
      if(stake)TownWall.stakes(set,K,0,W,fy-6,Hh-1,p+w*5);else{TownWall.walk(set,K,0,W);TownWall.masonry(set,K,0,fy,W,h,0,(p*W)%32);for(let x=0;x<W;x++)set(x,fy,K.cd)}
      for(let y=0;y<h;y++)for(let x=0;x<W;x++){const gx=x0+x,Y=fy+y;
        // (inside: the vault's shade under its crown, the portcullis's teeth under that, the far jamb's face on its left, the rest open)
        if(hole(gx,y)){const d=!hole(gx,y-5)?0:!hole(gx,y-10)?1:2;g.clearRect(x,Y,1,1);
          if(stake?y<top+3:d===0)set(x,Y,'rgba(16,14,12,.78)');else if(!hole(gx-3,y))set(x,Y,K.d);
          else if(!stake&&L>1&&d===1&&(!hole(gx,y-6)||(gx-Math.round(cx))%4===0))set(x,Y,!hole(gx,y-6)?'#4a4a52':'#3a3a40');continue}
        if(stake){if(y>=top-4&&y<top&&Math.abs(gx+.5-cx)<rx+4)set(x,Y,y===top-4?K.hi:y===top-1?K.cd:K.ab);continue}// (its lintel, a log)
        if(ring(gx,y)){const a=Math.atan2(y+.5-cy,gx+.5-cx),s=Math.floor((a+Math.PI)/(Math.PI/9)),kst=Math.abs(gx+.5-cx)<2&&y<top;set(x,Y,kst?K.hi:hash(gx,y,61)<.12?K.ab:s%2?K.a:K.b1)}}})}
  /* (a diagonal's segment: a tile across and a tile down (down: falling to the right); its walk a band along the line over its feet
     (TOWN_WALL.top deep, merlons along its outer edge), its face hanging under it to its feet, H deep, its courses along the line; a
     palisade's stakes; its foot the segment's lower end. The one facing the light (down) lit, the other shaded) */
  static diag(K,H,T,down,stake,v){return TownWall.pic(17,16+H+T+2,0,(set,W,Hh)=>{const fT=T*2,fH=H*2,C=TOWN_WALL.course;
    for(let x=0;x<W;x++){const top=(down?x:32-x)+4;
      if(stake){const s=TOWN_WALL.stake,u=x%s,j=Math.round(hash(Math.floor(x/s),v,41)*3),tip=Math.round(Math.abs(u-(s-1)/2)),t=top+fT-6+j+tip;
        for(let y=t;y<top+fT+fH;y++){let col=y===t?K.hi:u===0?K.ab:u>=s-2?K.cd:down?K.b:K.b2;const yb=top+fT+fH-1-y;if(yb>=Math.round(fH*.3)&&yb<Math.round(fH*.3)+3)col=yb===Math.round(fH*.3)+2?K.ab:K.c;set(x,y,col)}continue}
      // (the walk: merlons on its outer edge, the flags, its lit near edge)
      const m=x%8<5;set(x,top-3,m?K.hi:null);set(x,top-2,m?K.a:null);set(x,top-1,m?(down?K.b:K.bc):K.ab);
      for(let y=0;y<fT;y++)set(x,top+y,y===fT-1?K.a:y<2?K.cd:(x+y*3)%9===0?K.bc:down?K.b1:K.b);
      for(let y=0;y<fH;y++){const yb=fH-1-y,c=Math.floor(yb/C),r=yb%C,j=Math.floor((x+c*5)/8),q=hash(c,j,v*7+3);let col=r===C-1||(x+c*5)%8===0?K.c:r===C-2?(down?K.ab:K.b):q<.2?(down?K.b1:K.b):down?K.b:K.b2;
        if(!down)col=PX.mix(col,K.c,.18);if(y===0)col=K.cd;if(yb<2)col=PX.mix(col,K.d,yb?.2:.4);set(x,top+fT+y,col)}}})}
  // (a shut gate: its doors of planks bound with iron and studded across a stretch (dh), or their edge down one (dv), the dark over them)
  static doors(K,H,T,k,stake){const across=k==='dh';return TownWall.pic(across?16:8,across?H+T:16+H,across?0:-4,(set,W,Hh)=>{
    const P=['#3a2410','#6a4428','#8a5a34','#a8744a'],y0=(across?T:16)*2;set(0,0,'#14100c',W,y0);set(0,y0-2,'#0c0a08',W,2);
    for(let y=y0;y<Hh;y++)for(let x=0;x<W;x++){const u=x%6;set(x,y,u===0?P[3]:u===5?P[0]:(x*7+y)%23===0?P[1]:P[2])}
    for(const by of [y0+4,Hh-8])for(let x=0;x<W;x++){set(x,by,'#6a6a72');set(x,by+1,'#3a3a40');if(x%6===3)set(x,by,'#c8c8d0')}
    for(let x=0;x<W;x++)set(x,Hh-1,P[0])})}
}
