'use strict';
/* ---------- PX engine: a stand-in battlefield terrain, for previews only (the gallery, art screenshots) ---------- */
// PX.groundFixture({recipe,C,R,seed}) gives data in the B.terrain shape of doc/TERRAIN_DESIGN.md §4 ({cs,C,R,kind,lvl,up,has,seed,
// recipe}), so the ground painter can be seen before (and apart from) the game's own generator. recipe: 'hills' (a central hill
// of three terraces, a low hill each side, a copse), 'forest' (wood patches, a low rise), 'marsh' (marsh patches, a stand of dead
// trees), 'oasis' (a low ridge and a pool: for the desert), 'hillwoods' (woods on the hills' tops), 'mixed'; rivers (phase 2: a
// band of deep water 3 cells wide down the middle, meandering ±2 cells, as §2.3 lays it): 'river' (one ford, copses), 'bridge' (a
// bridge and a ford, low hills), 'fords' (two fords), 'bridgehills' (a hill each side, a stone bridge), 'stream' (all ford, marsh
// beside: a swamp's) and 'frozen' (all ford: the frost's). Not loaded by the game.
(function(PX){
  const vn=(x,y,s)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,a=PX.hash(ix,iy,s),b=PX.hash(ix+1,iy,s),c=PX.hash(ix,iy+1,s),d=PX.hash(ix+1,iy+1,s);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy};
  PX.groundFixture=({recipe='hills',C=82,R=38,seed=1}={})=>{
    const N=C*R,kind=new Uint8Array(N),lvl=new Uint8Array(N),up=new Int8Array(N).fill(-1),D=PX.dice(PX.rng(seed*7+3)),J=v=>v+D.int(-2,2);
    const shape=(cx,cy,rx,ry,f)=>{for(let j=1;j<R-1;j++)for(let i=0;i<C;i++){const d=Math.hypot((i+.5-cx)/rx,(j+.5-cy)/ry)+(vn(i/4,j/4,seed+cx|0)-.5)*.4;if(d<1)f(j*C+i,d)}};
    const hill=(cx,cy,rx,ry,top)=>shape(J(cx),J(cy),rx,ry,(o,d)=>{lvl[o]=Math.max(lvl[o],top===2&&d<.52?2:1)});
    const patch=(cx,cy,rx,ry,k)=>shape(J(cx),J(cy),rx,ry,o=>{kind[o]=k});
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
    else{hill(C*.36,R*.32,8,6,2);hill(C*.64,R*.68,8,6,2);patch(C*.5,R*.5,5,3,1);patch(C*.36,R*.8,6,3,2);patch(C*.66,R*.2,6,3,2)}
    // a river (3 ford, 4 deep, 5 bridge): its middle column a row, held straight through a crossing (at its middle's); fords 4
    // rows, a bridge 2
    const RIV={river:[[.3],null],bridge:[[.24],.64],fords:[[.24,.72],null],bridgehills:[[.2],.56],stream:[[],null,1],frozen:[[],null,1]}[recipe];
    if(RIV){const [fords,br,all]=RIV,ph=D.R()*6.28,cx=[];for(let j=0;j<R;j++)cx[j]=Math.round(C*.5+2*Math.sin(j*.17+ph));const cross=[];
      const hold=(r0,n,k)=>{const c=cx[r0+(n>>1)];for(let j=r0;j<r0+n;j++)cx[j]=c;cross.push([r0,n,k])};fords.forEach(f=>hold(Math.floor(R*f)-2,4,3));if(br!=null)hold(Math.floor(R*br)-1,2,5);
      for(let j=0;j<R;j++)for(let c=cx[j]-1;c<=cx[j]+1;c++){kind[j*C+c]=all?3:4;lvl[j*C+c]=0}
      for(const [r0,n,k] of cross)for(let j=r0;j<r0+n;j++)for(let c=cx[j]-1;c<=cx[j]+1;c++)kind[j*C+c]=k}
    // a summit never touches the plain: a level-2 cell's bare neighbours rise to 1
    for(let j=0;j<R;j++)for(let i=0;i<C;i++){if(lvl[j*C+i]!==2)continue;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const x=i+a,y=j+b;if(x>=0&&y>=0&&x<C&&y<R&&!lvl[y*C+x])lvl[y*C+x]=1}}
    // slope cells: a higher neighbour; up = the way to it (0 east, then clockwise: 1 south-east … 7 north-east)
    const DIR=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
    for(let j=0;j<R;j++)for(let i=0;i<C;i++){let best=-1,bl=lvl[j*C+i];DIR.forEach(([a,b],k)=>{const x=i+a,y=j+b;if(x>=0&&y>=0&&x<C&&y<R&&lvl[y*C+x]>bl){bl=lvl[y*C+x];best=k}});up[j*C+i]=best}
    const has={hills:lvl.some(v=>v),wood:kind.includes(1),marsh:kind.includes(2),water:kind.some(k=>k>=3)};
    return{cs:16,C,R,kind,lvl,up,has,seed,recipe};
  };
})(window.PX=window.PX||{});
