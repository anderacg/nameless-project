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
   none, palisade, stone, great); top: its walk's depth (px); tower: a tower's rise over the wall (px) */
const TOWN_WALL={on:true,fh:6,reach:14,pad:1,gate:1,merge:3,towers:7,alarm:16,camp:3,h:[0,10,13,16],top:6,tower:7};
/* (the owner, 2026-11-06: "the wall may be based on the holdings as well, if very poor they may start from none; think it like an
   upgrade") a fence: a wattle fence round a holding with no walls (fenceOf: t.fence once set), the first step before a palisade,
   drawn and blocking as a wall is but no wall in a fight (no siege, no defender's level). At the start (fenceStart), by what it
   has: its estates' levels and up to 2 by a hash of its place (start: the score for one, by its kind; salt); poor ones none. Later an upgrade: a
   realm's or the free folk's grows one by itself once it prospers (pros, by daily chance a day, gold and mats from its stock);
   yours you build in its Fortification (gold, mats, days) */
const FENCE={start:{village:6,hamlet:3.5},salt:4411,pros:65,daily:.05,gold:30,mats:{timber:12},days:2};
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
    x0-=X.pad;y0-=X.pad;x1+=X.pad;y1+=X.pad;
    // (the ring's tiles in order round it, clockwise from its top left)
    const loop=[];for(let x=x0;x<x1;x++)loop.push([x,y0]);for(let y=y0;y<y1;y++)loop.push([x1,y]);for(let x=x1;x>x0;x--)loop.push([x,y1]);for(let y=y1;y>y0;y--)loop.push([x0,y]);
    const n=loop.length,own=new Set(t.lots.map(l=>l.id)),kind=new Array(n).fill('w');
    loop.forEach(([x,y],j)=>{if(x<0||y<0||x>=MW||y>=MH){kind[j]='-';return}const k=tiles[y*MW+x],o=occAt(x,y);
      if(!passable(k))kind[j]='-';else if((k===T_ROAD||k===T_FORD)&&TownWall.crosses(x,y,x0,y0,x1,y1))kind[j]='g';else if(o>0&&!own.has(o))kind[j]='-'});
    // (gates near each other one: the wall between them open)
    for(let j=0;j<n;j++)if(kind[j]==='g')for(let d=2;d<=X.merge;d++){const q=(j+d)%n;if(kind[q]==='g'){for(let e=1;e<d;e++)if(kind[(j+e)%n]==='w')kind[(j+e)%n]='o';break}}
    // (each gate a tile wider either side; none on the ring: one below the centre, on its bottom stretch)
    if(!kind.includes('g')){const j=loop.findIndex(([x,y])=>y===y1&&x===t.tx);if(j>=0&&kind[j]==='w')kind[j]='g'}
    const g0=kind.map(k=>k==='g');for(let j=0;j<n;j++)if(g0[j])for(let d=1;d<=X.gate;d++)for(const q of [(j+d)%n,(j-d+n)%n])if(kind[q]==='w')kind[q]='o';
    const corner=(x,y)=>(x===x0||x===x1)&&(y===y0||y===y1),parts=[],shut=[],gates=[],L=wallOf(t);
    loop.forEach(([x,y],j)=>{const i=y*MW+x;if(kind[j]==='g'||kind[j]==='o'){gates.push(i);return}if(kind[j]!=='w')return;
      const gate=[(j+1)%n,(j-1+n)%n].some(q=>kind[q]==='g'||kind[q]==='o'),k=corner(x,y)?'c':gate||L>1&&j%X.towers===0?'t':y===y0||y===y1?'h':'v';parts.push({i,x,y,k});shut.push(i)});
    return{x0,y0,x1,y1,parts,shut,gates}}
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
    const tx=Math.floor(P.x/TILE),ty=Math.floor(P.y/TILE),inside=tx>r.x0&&tx<r.x1&&ty>r.y0&&ty<r.y1;return foeAt(t)&&near(P)&&!inside}
  // (where its besiegers camp: TOWN_WALL.camp tiles out of the gate nearest from (an army, you); null with no walls or no gate)
  static camp(t,from){const r=TownWall.of(t);if(!r||!r.gates.length)return null;let best=null,bd=Infinity;
    for(const i of r.gates){const x=i%MW,y=(i-x)/MW,d=Math.hypot((x+.5)*TILE-from.x,(y+.5)*TILE-from.y);if(d<bd){bd=d;best=[x,y]}}
    const [x,y]=best,c=TOWN_WALL.camp,dx=x===r.x0?-c:x===r.x1?c:0,dy=y===r.y0?-c:y===r.y1?c:0;return{x:(x+.5+dx)*TILE,y:(y+.5+dy)*TILE}}
  // (its colour on the full map and the minimap: stone, a palisade's timber, a fence's wattle)
  static mapCol(t){const L=wallOf(t);return L>=2?'#e4ddd0':L===1?'#b06a3c':'#c8a06a'}
  // (is tile (tx, ty) one of a ring's walls: SHUT's bit 4, router.js)
  static at(tx,ty){return !!SHUT&&tx>=0&&ty>=0&&tx<MW&&ty<MH&&(SHUT[ty*MW+tx]&4)>0}
  // its walls among the buildings: each piece by its feet, as you have seen its ground
  static ents(t,ents,cam){const r=TownWall.of(t);if(!r)return;const L=wallOf(t),S=TownWall.look(t),H=TOWN_WALL.h[L]||TOWN_WALL.fh;
    // (its gates shut: their doors across them)
    if(HOLD_SHUT.ring.get(t)?.closed)for(const i of r.gates){const x=i%MW,y=(i-x)/MW;if(!seenTile(x,y))continue;const X=x*TILE-cam.x,foot=(y+1)*TILE,Y=foot-cam.y;if(X<-24||X>VW+24||Y<-4||Y-H-40>VH)continue;
      const s=TownWall.sprite(S,L,y===r.y0||y===r.y1?'dh':'dv');ents.push({y:foot-1,f:()=>ctx.drawImage(s,Math.round(X-s.ax),Math.round(Y-s.height))})}
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
  static piece(C,H,T,k,stake){if(k==='dh'||k==='dv')return TownWall.doors(C,H,T,k,stake);let W,Hh,ax;if(k==='h'){W=16;Hh=H+T;ax=0}else if(k==='v'){W=8;Hh=16+H;ax=-4}else{W=20;Hh=16+H+TOWN_WALL.tower;ax=2}
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
  // (a shut gate: its doors of studded planks across a stretch (dh), or their edge down one (dv), a dark arch over them)
  static doors(C,H,T,k,stake){const across=k==='dh',W=across?16:8,Hh=across?H+T:16+H,cv=mkcv(W,Hh),g=cv.getContext('2d');cv.ax=across?0:-4;
    const P2=['#3a2410','#6a4428','#8a5a34'],y0=across?T:16;rect(g,'#14100c',0,across?0:0,W,across?T:16);for(let x=0;x<W;x+=4){rect(g,P2[1],x,y0,3,H);rect(g,P2[2],x,y0,1,H)}rect(g,'#3a3a40',0,y0+2,W,1);rect(g,'#3a3a40',0,y0+H-4,W,1);
    for(let x=1;x<W;x+=4)rect(g,'#c8c8d0',x,y0+H/2,1,1);rect(g,P2[0],0,y0+H-1,W,1);return cv}
}
