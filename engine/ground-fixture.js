'use strict';
/* ---------- PX engine: a stand-in battlefield terrain, for previews only (the gallery, art screenshots) ---------- */
// PX.groundFixture({recipe,C,R,seed}) gives data in the B.terrain shape of doc/TERRAIN_DESIGN.md §4 ({cs,C,R,kind,lvl,up,has,seed,
// recipe}), so the ground painter can be seen before (and apart from) the game's own generator. recipe: 'hills' (a central hill
// of three terraces, a low hill each side, a copse), 'forest' (wood patches, a low rise), 'marsh' (marsh patches, a stand of dead
// trees), 'oasis' (a low ridge and a pool: for the desert), 'hillwoods' (woods on the hills' tops), 'mixed'; rivers (phase 2: a
// band of deep water 3 cells wide down the middle, meandering ±2 cells, as §2.3 lays it): 'river' (one ford, copses), 'bridge' (a
// bridge and a ford, low hills), 'fords' (two fords), 'bridgehills' (a hill each side, a stone bridge), 'stream' (all ford, marsh
// beside: a swamp's) and 'frozen' (all ford: the frost's). Phase 4 (mountains: kind 6 with rockH, a cell's height in levels; cliffs:
// wall, edge bits E 1, S 2, W 4, N 8, a step refused over that edge): 'spires' (a massif, lone spires of 1-2 cells, a crag),
// 'plateau' (plateaus ringed by one-way cliffs, each with one ramp: south, west, north; the big one's summit a slope),
// 'cliffs' (a hill of two-way cliffs, and one of slopes alone), 'mountriver' (a massif and spires beside a river with a ford).
// Not loaded by the game.
(function(PX){
  const vn=(x,y,s)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,a=PX.hash(ix,iy,s),b=PX.hash(ix+1,iy,s),c=PX.hash(ix,iy+1,s),d=PX.hash(ix+1,iy+1,s);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy};
  PX.groundFixture=({recipe='hills',C=82,R=38,seed=1}={})=>{
    const N=C*R,kind=new Uint8Array(N),lvl=new Uint8Array(N),up=new Int8Array(N).fill(-1),D=PX.dice(PX.rng(seed*7+3)),J=v=>v+D.int(-2,2);
    const shape=(cx,cy,rx,ry,f)=>{for(let j=1;j<R-1;j++)for(let i=0;i<C;i++){const d=Math.hypot((i+.5-cx)/rx,(j+.5-cy)/ry)+(vn(i/4,j/4,seed+cx|0)-.5)*.4;if(d<1)f(j*C+i,d)}};
    const hill=(cx,cy,rx,ry,top)=>shape(J(cx),J(cy),rx,ry,(o,d)=>{lvl[o]=Math.max(lvl[o],top===2&&d<.52?2:1)});
    const patch=(cx,cy,rx,ry,k)=>shape(J(cx),J(cy),rx,ry,o=>{kind[o]=k});
    const rockH=new Uint8Array(N);let wall=null;
    const rock=(cx,cy,rx,ry,h)=>shape(cx,cy,rx,ry,(o,d)=>{if(kind[o]>=3&&kind[o]<=5)return;kind[o]=6;lvl[o]=0;rockH[o]=Math.max(rockH[o],d<.45?h:d<.75?Math.max(1,h-1):Math.max(1,h-2))});
    const spire=(i,j,h,w=1,d=1)=>{i=Math.floor(i);j=Math.floor(j);for(let b=0;b<d;b++)for(let a=0;a<w;a++){const o=(j+b)*C+i+a;kind[o]=6;lvl[o]=0;rockH[o]=h}};
    if(recipe==='hills'){hill(C*.5,R*.5,12,8.5,2);hill(C*.2,R*.26,6,4,1);hill(C*.8,R*.74,6,4,1);patch(C*.3,R*.7,5,2.5,1)}
    else if(recipe==='forest'){patch(C*.38,R*.3,8,4.5,1);patch(C*.62,R*.7,8,4.5,1);patch(C*.52,R*.5,3.5,2.5,1);patch(C*.24,R*.74,5,2.5,1);hill(C*.5,R*.2,7,3.5,1)}
    else if(recipe==='marsh'){patch(C*.44,R*.36,9,5,2);patch(C*.58,R*.68,9,5,2);patch(C*.28,R*.72,5,3,2);patch(C*.74,R*.24,5,3,2);patch(C*.48,R*.2,6,2,1)}
    else if(recipe==='oasis'){hill(C*.5,R*.28,11,4,1);patch(C*.5,R*.62,4.5,3,2)}
    else if(recipe==='hillwoods'){hill(C*.5,R*.5,13,9,2);patch(C*.47,R*.42,8,4,1);hill(C*.22,R*.3,7,4.5,1);patch(C*.22,R*.28,5,3,1);patch(C*.72,R*.72,5,3,1)}
    else if(recipe==='river'){patch(C*.26,R*.3,4,2.5,1);patch(C*.75,R*.74,4,2.5,1)}
    else if(recipe==='bridge'){hill(C*.2,R*.7,6,4,1);hill(C*.8,R*.28,6,4,1);patch(C*.3,R*.22,3.5,2,1)}
    else if(recipe==='fords'){patch(C*.28,R*.5,3.5,2.5,1);patch(C*.72,R*.5,3.5,2.5,1)}
    else if(recipe==='bridgehills'){hill(C*.24,R*.5,8,7,2);hill(C*.76,R*.5,8,7,2)}
    else if(recipe==='stream'){patch(C*.3,R*.3,5,3,2);patch(C*.7,R*.7,5,3,2);patch(C*.28,R*.75,4,2,1)}
    else if(recipe==='frozen'){patch(C*.25,R*.7,4,2.5,1);hill(C*.76,R*.3,5,3.5,1)}
    else if(recipe==='spires'){patch(C*.84,R*.3,4.5,3,1);hill(C*.84,R*.8,5,3,1);rock(C*.3,R*.46,6,4,4);spire(C*.64,R*.26,4);spire(C*.7,R*.6,3,2);spire(C*.56,R*.8,2);spire(C*.12,R*.78,3,2,2)}
    else if(recipe==='plateau'){hill(C*.34,R*.54,10,7,2);hill(C*.8,R*.3,5.5,4.5,1);hill(C*.8,R*.78,5.5,4.5,1)}
    else if(recipe==='cliffs'){hill(C*.27,R*.52,10,7.5,2);hill(C*.73,R*.52,10,7.5,2)}
    else if(recipe==='mountriver'){patch(C*.8,R*.75,4,2.5,1)}
    else{hill(C*.36,R*.32,8,6,2);hill(C*.64,R*.68,8,6,2);patch(C*.5,R*.5,5,3,1);patch(C*.36,R*.8,6,3,2);patch(C*.66,R*.2,6,3,2)}
    // a river (3 ford, 4 deep, 5 bridge): its middle column a row, held straight through a crossing (at its middle's); fords 4
    // rows, a bridge 2
    const RIV={river:[[.3],null],bridge:[[.24],.64],fords:[[.24,.72],null],bridgehills:[[.2],.56],stream:[[],null,1],frozen:[[],null,1],mountriver:[[.66],null]}[recipe];
    if(RIV){const [fords,br,all]=RIV,ph=D.R()*6.28,cx=[];for(let j=0;j<R;j++)cx[j]=Math.round(C*.5+2*Math.sin(j*.17+ph));const cross=[];
      const hold=(r0,n,k)=>{const c=cx[r0+(n>>1)];for(let j=r0;j<r0+n;j++)cx[j]=c;cross.push([r0,n,k])};fords.forEach(f=>hold(Math.floor(R*f)-2,4,3));if(br!=null)hold(Math.floor(R*br)-1,2,5);
      for(let j=0;j<R;j++)for(let c=cx[j]-1;c<=cx[j]+1;c++){kind[j*C+c]=all?3:4;lvl[j*C+c]=0}
      for(const [r0,n,k] of cross)for(let j=r0;j<r0+n;j++)for(let c=cx[j]-1;c<=cx[j]+1;c++)kind[j*C+c]=k}
    // a summit never touches the plain: a level-2 cell's bare neighbours rise to 1
    for(let j=0;j<R;j++)for(let i=0;i<C;i++){if(lvl[j*C+i]!==2)continue;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const x=i+a,y=j+b;if(x>=0&&y>=0&&x<C&&y<R&&!lvl[y*C+x])lvl[y*C+x]=1}}
    if(recipe==='mountriver'){rock(C*.4,R*.42,5.5,4.5,4);spire(C*.66,R*.26,3);spire(C*.6,R*.86,2,2)}
    // (cliffs: f(i,j,b,x,y) for each edge from a higher cell (i,j) toward b (1 E 2 S 4 W 8 N) down to (x,y): 'two' a bit both sides,
    // 'one' on the low cell alone, pointing up (up refused, down allowed), else none: a slope)
    const walls=f=>{wall=new Uint8Array(N);for(let j=0;j<R;j++)for(let i=0;i<C;i++)for(const [a,b,bt,ob] of [[1,0,1,4],[0,1,2,8],[-1,0,4,1],[0,-1,8,2]]){const x=i+a,y=j+b;
      if(x<0||y<0||x>=C||y>=R||lvl[j*C+i]<=lvl[y*C+x])continue;const md=f(i,j,bt,x,y);if(md==='two'){wall[j*C+i]|=bt;wall[y*C+x]|=ob}else if(md==='one')wall[y*C+x]|=ob}};
    // (a ramp: an edge toward b within w cells of the point (px,py) along that side)
    const near=(i,j,b,px,py,w)=>b===2||b===8?Math.abs(i+.5-px)<w&&Math.abs(j+.5-py)<6:Math.abs(j+.5-py)<w&&Math.abs(i+.5-px)<6;
    if(recipe==='plateau')walls((i,j,b,x,y)=>{if(lvl[y*C+x])return null;// (the summit's edges: slopes)
      if(b===2&&near(i,j,b,C*.34,R*.54+7,1.1)||b===4&&near(i,j,b,C*.8-5.5,R*.3,1.1)||b===8&&near(i,j,b,C*.8,R*.78-4.5,1.1))return null;return'one'});
    if(recipe==='cliffs')walls(i=>i<C/2?'two':null);
    // slope cells: a higher neighbour; up = the way to it (0 east, then clockwise: 1 south-east … 7 north-east)
    const DIR=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
    for(let j=0;j<R;j++)for(let i=0;i<C;i++){let best=-1,bl=lvl[j*C+i];DIR.forEach(([a,b],k)=>{const x=i+a,y=j+b;if(x>=0&&y>=0&&x<C&&y<R&&lvl[y*C+x]>bl){bl=lvl[y*C+x];best=k}});up[j*C+i]=best}
    const has={hills:lvl.some(v=>v),wood:kind.includes(1),marsh:kind.includes(2),water:kind.some(k=>k>=3&&k<=5),rock:kind.includes(6)};
    return{cs:16,C,R,kind,lvl,up,has,seed,recipe,rockH,wall};
  };
})(window.PX=window.PX||{});
