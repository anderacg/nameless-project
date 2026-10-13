'use strict';
/* ---------- the world, painted in detail ---------- */
// paintWorld: ground per pixel (each climate's colors in soft light and dark patches, fine speckle, ragged borders between
// climates, water shading from shallows to deep), then beaches and ice rims, roads that join their neighbors, forests of
// mixed trees with shadows, shaded hills, mountain ranges, and small things on open ground. drawEnv adds what moves.
const GROUND_RGB={grass:[[70,110,50],[84,126,58],[104,146,70]],frost:[[192,203,218],[214,222,232],[238,243,249]],desert:[[196,162,88],[214,182,104],[232,204,132]],swamp:[[58,72,42],[72,88,52],[90,106,62]]};
const WATER_RGB={grass:[[96,150,204],[58,104,166],[36,70,126]],frost:[[184,212,232],[150,184,212],[124,160,196]],desert:[[96,156,196],[58,112,164],[38,80,134]],swamp:[[84,112,88],[64,90,72],[48,70,56]]};
const ROCK_RGB={grass:[[70,76,90],[98,104,120],[134,141,158]],frost:[[84,92,108],[116,124,142],[156,164,182]],desert:[[100,58,36],[136,86,56],[172,120,80]],swamp:[[66,66,58],[90,90,82],[118,118,108]]};
const SHORE={grass:['#d6c48c','#b8a46e'],frost:['#f4f8fc','#c8d8e8'],desert:['#ecd49a','#c8ac70'],swamp:['#6a6040','#504830']};
const hs=(x,y,s)=>{let h=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,1274126177);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};
const mixc=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
// CLEAR: one byte per map pixel, set where nothing may stand: roads and their margins, holdings and their yards,
// camps and estate plots. Trees, hills, peaks and small things are only painted where they touch none of it.
let CLEAR=null;
const isClear=(x,y)=>{x|=0;y|=0;return x>=0&&y>=0&&x<MW*TILE&&y<MH*TILE&&CLEAR[y*MW*TILE+x]===1};
function markClear(x,y,w,h){const Wp=MW*TILE,Hp=MH*TILE;x|=0;y|=0;for(let yy=Math.max(0,y);yy<Math.min(Hp,y+h);yy++)CLEAR.fill(1,yy*Wp+Math.max(0,x),yy*Wp+Math.min(Wp,x+w))}
function markEllipse(cx,cy,rx,ry){for(let yy=-ry;yy<=ry;yy++){const hw=Math.round(rx*Math.sqrt(Math.max(0,1-(yy/ry)*(yy/ry))));markClear(cx-hw,cy+yy,hw*2+1,1)}}
const anyClear=pts=>pts.some(([x,y])=>isClear(x,y));
const hex=c=>'#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');

function paintWorld(){
  const Wp=MW*TILE,Hp=MH*TILE,cv=document.createElement('canvas');cv.width=Wp;cv.height=Hp;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  // smooth light field (one value per tile corner) and water depth (tiles from the nearest land, up to 4)
  const LW=MW+1,LG=new Float32Array(LW*(MH+1));for(let y=0;y<=MH;y++)for(let x=0;x<=MW;x++)LG[y*LW+x]=(fbm(x/4.5,y/4.5,77)-.5)*2;
  const ta0=(x,y)=>x<0||y<0||x>=MW||y>=MH?-1:tiles[y*MW+x];
  const dep=new Uint8Array(MW*MH);for(let i=0;i<MW*MH;i++)dep[i]=tiles[i]===T_WATER?9:0;
  for(let pass=1;pass<=4;pass++)for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const i=y*MW+x;if(dep[i]!==9)continue;
    for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+a,ny=y+b;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const n=dep[ny*MW+nx];if(n===pass-1&&(pass>1||tiles[ny*MW+nx]!==T_WATER)){dep[i]=pass;break}}}
  // how mountainous each tile corner is (share of the 4 tiles around it), for ragged, receding range edges
  const MG=new Float32Array(LW*(MH+1));for(let y=0;y<=MH;y++)for(let x=0;x<=MW;x++){let n=0;for(const [a,b] of [[0,0],[-1,0],[0,-1],[-1,-1]])if(ta0(x+a,y+b)===T_MOUNT)n++;MG[y*LW+x]=n/4}
  const DG=new Float32Array(LW*(MH+1));for(let y=0;y<=MH;y++)for(let x=0;x<=MW;x++){let s=0,n=0;for(const [a,b] of [[0,0],[-1,0],[0,-1],[-1,-1]]){const tx=x+a,ty=y+b;if(tx<0||ty<0||tx>=MW||ty>=MH)continue;s+=Math.min(4,dep[ty*MW+tx]===9?4:dep[ty*MW+tx]);n++}DG[y*LW+x]=n?s/n:4}
  CLEAR=new Uint8Array(Wp*Hp);
  // road tiles with water on both sides are bridges: water under the deck
  const BR=new Uint8Array(MW*MH);for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){const i=y*MW+x;if(tiles[i]===T_ROAD&&(tiles[i-1]===T_WATER&&tiles[i+1]===T_WATER||tiles[i-MW]===T_WATER&&tiles[i+MW]===T_WATER))BR[i]=1}
  const img=g.createImageData(Wp,Hp),D=img.data,CL=CLIMS.map(c=>GROUND_RGB[c]),WL=CLIMS.map(c=>WATER_RGB[c]);
  for(let y=0;y<Hp;y++){const ty=y>>4,fy=(y&15)/16;
    for(let x=0;x<Wp;x++){const tx=x>>4,fx=(x&15)/16,o=(y*Wp+x)*4;
      // ragged climate borders: read the climate a few pixels off, jittered in 3-pixel blocks
      const jx=Math.min(Wp-1,Math.max(0,x+Math.floor((hs(x/3|0,y/3|0,5)-.5)*14))),jy=Math.min(Hp-1,Math.max(0,y+Math.floor((hs(x/3|0,y/3|0,6)-.5)*14)));
      const ci=climate[(jy>>4)*MW+(jx>>4)],i=ty*MW+tx,k=y>>4;let c;
      const bl=(A)=>{const a=A[k*LW+tx],b=A[k*LW+tx+1],cc=A[(k+1)*LW+tx],d=A[(k+1)*LW+tx+1];return a+(b-a)*fx+(cc-a)*fy+(a-b-cc+d)*fx*fy};
      if(tiles[i]===T_WATER||BR[i]){const d=bl(DG),P3=WL[ci],w=hs(x>>1,y,8);c=d<1.5?mixc(P3[0],P3[1],Math.max(0,d-.5)):mixc(P3[1],P3[2],Math.min(1,(d-1.5)/2.5));
        if(w<.02)c=mixc(c,[255,255,255],.25)}
      else if(tiles[i]===T_MOUNT&&bl(MG)-.34*hs(x>>1,y>>1,31)>.4){const m=bl(MG),RK=ROCK_RGB[CLIMS[ci]],L=bl(LG),b3=hs(x/3|0,y/3|0,33);
        let v=.45+.3*L+.25*(b3-.5)+(m-.7)*.4;v=Math.max(0,Math.min(1,v));c=v<.5?mixc(RK[0],RK[1],v*2):mixc(RK[1],RK[2],(v-.5)*2);
        const ph=hs(x,y,34);if(ph<.025)c=mixc(c,RK[2],.6);else if(ph>.975)c=mixc(c,RK[0],.7);
        // snow lies in soft drifts on the colder, higher ground
        if(CLIMS[ci]==='frost'&&L*.5+m*.5+.18*hs(x>>1,y>>1,35)>.62)c=mixc(c,[234,240,247],.85)}
      else{const L=bl(LG),P3=CL[ci],b4=hs(x>>2,y>>2,3);let v=.5+.38*L+.22*(b4-.5);v=Math.max(0,Math.min(1,v));c=v<.5?mixc(P3[0],P3[1],v*2):mixc(P3[1],P3[2],(v-.5)*2);
        const ph=hs(x,y,9);if(ph<.035)c=mixc(c,P3[2],.6);else if(ph>.965)c=mixc(c,P3[0],.7)}
      D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2];D[o+3]=255}}
  const DIRT={grass:[150,128,84],frost:[176,170,158],desert:[200,170,112],swamp:[104,92,64]};
  const trample=(cx,cy,rx,ry,amt)=>{for(let yy=-ry;yy<=ry;yy++)for(let xx=-rx;xx<=rx;xx++){const x=cx+xx,y=cy+yy;if(x<0||y<0||x>=Wp||y>=Hp)continue;
    const d=(xx*xx)/(rx*rx)+(yy*yy)/(ry*ry),edge=1-hs(x,y,17)*.35;if(d>edge||tiles[(y>>4)*MW+(x>>4)]===T_WATER)continue;const o=(y*Wp+x)*4,dc=DIRT[CLIMS[climate[(y>>4)*MW+(x>>4)]]],k=amt*(d>edge-.25?.5:1)*(.75+hs(x,y,18)*.25);
    D[o]+=(dc[0]-D[o])*k;D[o+1]+=(dc[1]-D[o+1])*k;D[o+2]+=(dc[2]-D[o+2])*k}};
  // a holding's yard: worn ground over its whole footprint, softer at the edges, and nothing else grows there
  const yard=(X,Y,w,h,amt)=>{for(let y=Math.max(0,Y);y<Math.min(Hp,Y+h);y++)for(let x=Math.max(0,X);x<Math.min(Wp,X+w);x++){if(tiles[(y>>4)*MW+(x>>4)]===T_WATER)continue;
    const e=Math.min(x-X,X+w-1-x,y-Y,Y+h-1-y),o=(y*Wp+x)*4,dc=DIRT[CLIMS[climate[(y>>4)*MW+(x>>4)]]],k=amt*(e<4?(e+1)/5*(.4+hs(x,y,19)*.6):1)*(.75+hs(x,y,18)*.25);
    D[o]+=(dc[0]-D[o])*k;D[o+1]+=(dc[1]-D[o+1])*k;D[o+2]+=(dc[2]-D[o+2])*k}};
  // nothing grows under a holding's buildings and fields (lots.js)
  const FOOT=new Uint8Array(MW*MH);
  for(const t of TOWNS){markClear(t.tx*TILE,t.ty*TILE,TILE,TILE);markClear(t.x-12,t.y-14,24,24);// its gate, where you arrive
    for(const l of t.lots||[]){markClear(l.x*TILE-2,l.y*TILE-2,l.n*TILE+4,l.n*TILE+4);for(const [x,y] of l.plots||[])markClear(x*TILE,y*TILE,TILE,TILE)}}
  for(const c of CAMP_SPOTS){trample(c.x+8,c.y+4,14,7,.5);markClear(c.x-24,c.y-40,64,64)}
  // estates: their own tile, every tile their fields may grow over, and the water under a pier
  for(const t of TOWNS){const sp=bldSpots(t);for(const k in sp){const p=sp[k];if(k==='lumber'||k==='mine')trample(p.x,p.y+3,9,5,.4)}}
  g.putImageData(img,0,0);
  const r=(col,x,y,w,h)=>{g.fillStyle=col;g.fillRect(x,y,w||1,h||1)},ta=(x,y)=>tAt(x,y),cl=(x,y)=>CLIMS[climate[Math.max(0,Math.min(MH-1,y))*MW+Math.max(0,Math.min(MW-1,x))]];
  // shores: a beach (or ice, or mud) on the land side, a line of foam on the water side
  const onWater=(x,y)=>ta(x,y)===T_ROAD&&(ta(x-1,y)===T_WATER&&ta(x+1,y)===T_WATER||ta(x,y-1)===T_WATER&&ta(x,y+1)===T_WATER);
  for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){if(ta(tx,ty)===T_WATER||onWater(tx,ty))continue;const X=tx*TILE,Y=ty*TILE,c=cl(tx,ty),[s0,s1]=SHORE[c];
    for(const [a,b] of [[0,-1],[0,1],[-1,0],[1,0]]){if(ta(tx+a,ty+b)!==T_WATER||tx+a<0||ty+b<0||tx+a>=MW||ty+b>=MH)continue;
      for(let k=0;k<TILE;k++){const w=1+(hs(X+k,Y,b+2*a+11)>.45?1:0)+(hs(X+k,Y,b+2*a+12)>.85?1:0);
        const [px,py,ww,hh]=b===-1?[X+k,Y,1,w]:b===1?[X+k,Y+TILE-w,1,w]:a===-1?[X,Y+k,w,1]:[X+TILE-w,Y+k,w,1];r(s0,px,py,ww,hh);
        const [fx,fy]=b===-1?[X+k,Y-1]:b===1?[X+k,Y+TILE]:a===-1?[X-1,Y+k]:[X+TILE,Y+k];if(hs(fx,fy,4)>.3)r(c==='frost'?'#e8f2fa':c==='swamp'?'#7a9a7a':'#c8e0f4',fx,fy,1,1);
        if(w>1&&hs(px,py,13)<.15)r(s1,px,py,1,1)}}}
  // roads: a dirt band from the tile's middle to each neighboring road, darker at the edges, with ruts and stones;
  // first pass only marks the band and a margin as clear
  const ROADC={grass:['#8a7448','#b89b62','#cdb47e'],frost:['#8e8a80','#b8b2a6','#d4cfc4'],desert:['#a8884c','#c9a868','#dcc084'],swamp:['#5a4a34','#7a6a48','#8e7e5a']};
  const isRoad=(x,y)=>TOWNS.some(t=>t.tx===x&&t.ty===y)||ta(x,y)===T_ROAD&&!FOOT[y*MW+x];
  const bridge=(x,y)=>ta(x,y)===T_ROAD&&(ta(x-1,y)===T_WATER&&ta(x+1,y)===T_WATER||ta(x,y-1)===T_WATER&&ta(x,y+1)===T_WATER);
  // where a road tile's path runs through: its middle, but at a holding's gate (and its own tile) half a tile to the left, so the
  // road comes up to the middle of the centre building's door (its gate lies on the line between two tiles); each arm runs to
  // halfway between two path points, so a shifted one still meets its neighbours
  const SHIFT=new Set();for(const t of TOWNS){SHIFT.add(t.ty*MW+t.tx);SHIFT.add((t.ty+1)*MW+t.tx)}
  const pX=(x,y)=>x*TILE+8-(SHIFT.has(y*MW+x)?8:0);
  for(const pass of [0,1,2])for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){if(ta(tx,ty)!==T_ROAD||FOOT[ty*MW+tx])continue;const X=pX(tx,ty),Y=ty*TILE+8,[e,m]=ROADC[cl(tx,ty)],w=[9,7,5][pass],br=bridge(tx,ty),col=br?[null,'#3e2818','#8a6038'][pass]:[null,e,m][pass],h=w>>1;
    const arms=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].filter(([a,b])=>isRoad(tx+a,ty+b)&&!(a&&b&&(isRoad(tx+a,ty)||isRoad(tx,ty+b))));
    const st=(x,y)=>{if(pass)r(col,x,y,w,w);else markClear(x-1,y-1,w+2,w+2)};
    st(X-h,Y-h);for(const [a,b] of arms){const mx=(X+pX(tx+a,ty+b))/2,my=Y+b*8,n=Math.max(Math.abs(mx-X),Math.abs(my-Y));
      for(let s=0;s<=n;s++){const jx=Math.round((hs(tx*8+s,ty,a+3*b)-.5)*1.2);st(Math.round(X+(mx-X)*s/n)-h+(b?jx:0),Math.round(Y+(my-Y)*s/n)-h+(a?jx:0))}}}
  // bridge planks across the deck, rails along it and posts in the water
  for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){if(!bridge(tx,ty))continue;const X=tx*TILE,Y=ty*TILE,vert=ta(tx-1,ty)===T_WATER;
    // (a deck 10 wide, as wide as anyone crossing it: walk, world.js, keeps them to its middle)
    if(vert){r('#8a6038',X+3,Y,10,16);for(let y=0;y<16;y+=2)r('#6a4628',X+3,Y+y,10,1);r('#3e2818',X+2,Y,1,16);r('#3e2818',X+13,Y,1,16);r('#2a1a10',X+1,Y+4,1,3);r('#2a1a10',X+14,Y+11,1,3)}
    else{r('#8a6038',X,Y+3,16,10);for(let x=0;x<16;x+=2)r('#6a4628',X+x,Y+3,1,10);r('#3e2818',X,Y+2,16,1);r('#3e2818',X,Y+13,16,1);r('#2a1a10',X+4,Y+14,1,2);r('#2a1a10',X+11,Y+14,1,2)}}
  for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){if(ta(tx,ty)!==T_ROAD||bridge(tx,ty)||FOOT[ty*MW+tx])continue;const X=tx*TILE,Y=ty*TILE,c=ROADC[cl(tx,ty)];for(let k=0;k<6;k++){const px=X+4+Math.floor(hs(tx,ty,k)*8),py=Y+4+Math.floor(hs(tx,ty,k+9)*8);r(k<2?c[0]:c[2],px,py,1,1)}}
  // forests, hills, mountains and small things, top row first so lower ones overlap the ones behind
  for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){const t=ta(tx,ty),X=tx*TILE,Y=ty*TILE,c=cl(tx,ty),h=k=>hs(tx,ty,k+40);
    if(t===T_FOREST){const spots=[[3,2],[10,4],[5,9],[12,11],[1,13]].slice(0,3+(h(1)>.5?1:0)+(h(2)>.7?1:0)).map(([a,b],i)=>[X+a+Math.round((h(i+3)-.5)*3),Y+b+Math.round((h(i+8)-.5)*3),h(i+13)]).sort((p,q)=>p[1]-q[1]);
      for(const [x,y,s] of spots)if(!anyClear([[x+3,y+11],[x+3,y+1],[x,y+6],[x+7,y+6],[x+1,y+10],[x+6,y+10]])&&tAt((x+3)>>4,(y+5)>>4)!==T_WATER)paintTree(g,x,y,c,s)}
    else if(t===T_HILL)paintHill(g,X,Y,c,h);
    else if(t===T_MOUNT){paintMountain(g,X,Y,c,h,tx,ty);if(bigPeakAt(tx,ty))paintBigPeak(g,X,Y,c,k=>hs(tx,ty,k+90))}
    // an ore vein: a few bright flecks of its metal low on the hill or mountain
    if((t===T_HILL||t===T_MOUNT)&&DEP_AT[ty*MW+tx]>=0){const col=GOODS[DEPOSITS[DEP_AT[ty*MW+tx]].g].col;for(let k=0;k<4;k++){const x=X+4+Math.floor(h(20+k)*8),y=Y+9+Math.floor(h(24+k)*5);r('#2a2620',x,y+1,2,1);r(col,x,y,2,1);if(k<2)r('#ffffff',x,y,1,1)}}
    else if(t===T_OPEN&&!anyClear([[X+2,Y+2],[X+13,Y+2],[X+2,Y+13],[X+13,Y+13],[X+8,Y+8]]))paintDecor(g,X,Y,c,h);
    else if(t===T_WATER&&c==='swamp'&&h(5)<.35){r('#4a7a3a',X+3+Math.floor(h(6)*8),Y+4+Math.floor(h(7)*8),3,2);r('#6a9a4a',X+4+Math.floor(h(6)*8),Y+4+Math.floor(h(7)*8),1,1)}
    else if(t===T_WATER&&c==='frost'&&h(5)<.25){const x=X+2+Math.floor(h(6)*8),y=Y+3+Math.floor(h(7)*9);r('#e8f2fa',x,y,5,2);r('#ffffff',x+1,y,2,1)}}
  return cv;
}
// the great peaks: inside a range (5+ of 8 neighbors are mountains), a tile whose hash is the highest of its 3x3 block
function bigPeakAt(tx,ty){
  const inner=(x,y)=>{if(tAt(x,y)!==T_MOUNT)return false;let n=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if((a||b)&&tAt(x+a,y+b)===T_MOUNT)n++;return n>=5};
  if(!inner(tx,ty))return false;const v=hs(tx,ty,61);if(v<.35)return false;
  for(const [a,b] of [[-1,0],[1,0],[-1,-1],[0,-1],[1,-1],[0,-2]])if(tAt(tx+a,ty+b)!==T_MOUNT)return false;
  for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if((a||b)&&inner(tx+a,ty+b)&&hs(tx+a,ty+b,61)>v)return false;return true;
}
// a great peak on its tile: as tall as the range behind it allows (up to 64 pixels)
function paintBigPeak(g,X,Y,c,h){
  const tx=X>>4,ty=Y>>4;let rows=2;while(rows<5&&tAt(tx,ty-rows)===T_MOUNT&&tAt(tx-1,ty-rows+1)===T_MOUNT&&tAt(tx+1,ty-rows+1)===T_MOUNT)rows++;
  drawPeak(g,X+8+Math.round((h(2)-.5)*6),Y+15,Math.min(34+Math.round(h(1)*30),16*rows+10),c,h,true);
}
// does a peak fit here? its whole outline (every 2 pixels) must miss roads, yards and plots, and its base must stand on rock
function peakFits(cx,by,H,sl,sr){
  for(let yy=0;yy<=H;yy+=2){const y=by-H+yy;if(isClear(cx-yy*sl-2,y)||isClear(cx+yy*sr+2,y)||isClear(cx,y))return false}
  for(let x=Math.floor(cx-H*sl)-2;x<=cx+H*sr+2;x+=2)if(isClear(x,by)||isClear(x,by+2))return false;
  const on=(x,y)=>tAt(Math.floor(x/TILE),Math.floor(y/TILE))===T_MOUNT;
  return on(cx-H*sl*.75,by-1)&&on(cx+H*sr*.75,by-1)&&on(cx,by-1);
}
// a peak with its base centered at (cx, by): jagged flanks lit from the left, ridges, and a snowcap with a ragged lower edge
function drawPeak(g,cx,by,H,c,h,big){
  const RK=ROCK_RGB[c],rock=[hex(RK[0]),hex(RK[1]),hex(RK[2]),hex(mixc(RK[2],[255,255,255],.25))],snowy=c!=='desert'&&H>=9,cap=c==='desert'?'#d8a878':'#f4f8fc',capd=c==='desert'?'#b88a5e':'#cdd6e2';
  const sl=.6+h(3)*.25,sr=.5+h(4)*.3,top=by-H,r=(col,x,y,w,hh)=>{g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),w||1,hh||1)};
  if(!peakFits(cx,by,H,sl,sr))return false;
  g.fillStyle='rgba(0,0,0,.14)';g.fillRect(Math.round(cx),by,Math.round(H*sr)+3,1);
  // the flanks, one row at a time, with notches so the outline is never a clean line
  let jl=0,jr=0;
  for(let yy=0;yy<H;yy++){const y=top+yy;if(hs(cx,y,3)>.7)jl=Math.min(2,jl+1);else if(jl&&hs(cx,y,5)>.5)jl--;if(hs(cx,y,4)>.72)jr=Math.min(2,jr+1);else if(jr&&hs(cx,y,6)>.5)jr--;
    const L=Math.round(yy*sl)+1+jl,Rr=Math.round(yy*sr)+1-Math.min(jr,Math.round(yy*sr));r(rock[2],cx-L,y,L,1);r(rock[1],cx,y,Rr,1);r(rock[3],cx-L,y,1,1);r(rock[0],cx+Rr-1,y,1,1)}
  // ridges down both faces, and ledges low on the mountain
  const nr=big?3:H>14?2:1;for(let k=0;k<nr;k++){const side=k%2?1:-1,x0=cx+side*Math.round(H*.1*(k+1)/2),y0=top+Math.round(H*(.22+.16*k));
    for(let i=0;i<Math.round(H*(big?.45:.35));i++)r(side<0?rock[1]:rock[0],x0+side*Math.round(i*(side<0?sl:sr)*.55),y0+i,1,1)}
  if(big||H>14)for(let k=0;k<(big?4:2);k++){const y=top+Math.round(H*(.5+h(5+k)*.45)),x=cx+Math.round((h(9+k)-.5)*H*.7);r(rock[3],x,y,3,1);r(rock[0],x,y+1,3,1)}
  // the cap: snow (or pale stone in the desert), down a third of the peak, its edge broken
  if(snowy||big){const ch=Math.round(H*(.26+h(13)*.14));
    for(let yy=0;yy<ch;yy++){const y=top+yy,L=Math.round(yy*sl)+1,Rr=Math.round(yy*sr)+1,cut=yy>ch-4?Math.floor(hs(cx,y,8)*4):0;r(cap,cx-L+cut,y,Math.max(0,L-cut),1);r(capd,cx,y,Math.max(0,Rr-cut),1)}
    for(let k=0;k<(big?5:2);k++){const yy=ch+Math.floor(h(14+k)*4),x=cx+Math.round((h(19+k)-.5)*yy*1.1);r(capd,x,top+yy,2,1)}r('#ffffff',cx-1,top,1,2)}
  else r(rock[3],cx-1,top,1,Math.min(3,H));
  return true;
}
// a tree whose base is at (x+3, y+11), by climate; s (0-1) picks the kind
function paintTree(g,x,y,c,s){
  const r=(col,a,b,w,h)=>{g.fillStyle=col;g.fillRect(x+a,y+b,w||1,h||1)};g.fillStyle='rgba(0,0,0,.22)';g.fillRect(x+1,y+10,8,2);
  if(c==='frost'){r('#4a3020',3,9,2,3);[[0,6,8,3],[1,3,6,3],[2,1,4,2],[3,0,2,1]].forEach(([a,b,w,h])=>{r('#264636',a,b,w,h);r('#e8eef6',a,b,w,1)});r('#386050',5,4,1,4);return}
  if(c==='desert'){if(s<.5){r('#8a6a3a',3,3,1,9);r('#8a6a3a',4,2,1,2);r('#4a8a3a',0,1,4,1);r('#4a8a3a',4,0,4,1);r('#5aa048',1,0,2,1);r('#5aa048',5,1,3,1);r('#3a7030',0,2,1,1);r('#3a7030',7,2,1,1)}
    else{r('#6a8a3a',1,7,7,4);r('#8aa848',2,6,5,2);r('#4a6a2a',1,10,7,1)}return}
  if(c==='swamp'){if(s<.5){r('#4a3e2a',3,2,2,10);r('#4a3e2a',1,4,2,1);r('#4a3e2a',5,6,3,1);r('#4a3e2a',0,3,1,1)}
    else{r('#3a3226',3,5,2,7);r('#3e5a30',0,1,8,5);r('#4e6e3a',1,1,5,2);for(let i=0;i<4;i++)r('#3e5a30',i*2,6,1,3+i%2)}return}
  if(s<.45){r('#5a3a20',3,8,2,4);r('#2a5a2a',0,2,8,7);r('#346e32',1,1,6,3);r('#4a8a40',1,2,3,2);r('#1e4a22',5,6,3,2)}
  else if(s<.8){r('#4a3020',3,9,2,3);[[0,6,8,3],[1,3,6,3],[2,1,4,2],[3,0,2,1]].forEach(([a,b,w,h])=>r('#244a2c',a,b,w,h));r('#30603a',2,4,2,4);r('#30603a',1,7,2,2)}
  else{r('#e8e4d8',3,6,1,6);r('#2a2a2a',3,8,1,1);r('#5a8a3a',1,1,6,6);r('#7aaa50',2,1,3,2);r('#4a7a30',4,4,3,2)}
}
function paintHill(g,X,Y,c,h){
  const [d0,d1,d2,d3]=PAL[c].hill,r=(col,x,y,w,hh)=>{g.fillStyle=col;g.fillRect(x,y,w||1,hh||1)};
  const mound=(cx,by,w,ht)=>{if(anyClear([[cx-w/2,by],[cx+w/2,by],[cx,by-ht],[cx,by],[cx-w/4,by-ht/2],[cx+w/4,by-ht/2]]))return;for(let yy=0;yy<ht;yy++){const f=(yy+1)/ht,hw=Math.max(1,Math.round(w/2*Math.sqrt(1-(1-f)*(1-f))));r(d1,cx-hw,by-ht+yy,hw,1);r(d0,cx,by-ht+yy,hw,1)}
    r(d2,cx-Math.round(w/4),by-ht+1,Math.round(w/4),Math.max(1,Math.round(ht/3)));r(d3,cx-2,by-ht,2,1)};
  if(!anyClear([[X+3,Y+14],[X+14,Y+14]])){g.fillStyle='rgba(0,0,0,.15)';g.fillRect(X+3,Y+13,12,2)}
  const mx=X+4+Math.round(h(1)*7),my=Y+12+Math.round(h(6)*4);mound(mx,my,9+Math.round(h(7)*5),5+Math.round(h(2)*4));if(h(3)>.45)mound(X+(mx-X>8?3:12)+Math.round(h(8)*2),Y+14+Math.round(h(9)*2),6+Math.round(h(10)*3),3+Math.round(h(11)*2));
  if(c==='grass'&&h(4)>.5){r('#5a8a40',X+3,Y+12,1,1);r('#5a8a40',X+12,Y+11,1,1)}if(c==='frost')r('#ffffff',X+5,Y+8,2,1);
}
// the peaks of a mountain tile (the rock itself is painted per pixel): foothills at the range's edge, tall peaks deep inside,
// scattered rather than one per tile, nearest first so the ones in front overlap
function paintMountain(g,X,Y,c,h,tx,ty){
  let d=0;for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++)if(tAt(tx+a,ty+b)===T_MOUNT)d++;
  const n=(d>=18?2:1)+(h(9)>.65?1:0),ps=[];
  for(let k=0;k<n;k++){const H=d<11?4+Math.round(h(11+k)*4):d<18?6+Math.round(h(11+k)*7):9+Math.round(h(11+k)*h(11+k)*15);ps.push([X+3+Math.round(h(2+k)*10),Y+7+Math.round(h(5+k)*8),H,k])}
  ps.sort((p,q)=>p[1]-q[1]).forEach(([cx,by,H,k])=>drawPeak(g,cx,by,H,c,i=>hs(tx*7+k,ty*3+k,i+50),false));
}
function paintDecor(g,X,Y,c,h){
  const r=(col,x,y,w,hh)=>{g.fillStyle=col;g.fillRect(X+x,Y+y,w||1,hh||1)},p=k=>Math.floor(h(k)*12)+2;
  if(c==='grass'){
    if(h(10)<.14){const fc=['#e8d04a','#e86a5a','#f0ece0','#b88ae8'][Math.floor(h(11)*4)];for(let i=0;i<4;i++){const x=p(12+i),y=p(16+i);r('#3e6a2e',x,y+1,1,1);r(fc,x,y,1,1)}}
    if(h(20)<.4)for(let i=0;i<3;i++){const x=p(21+i),y=p(24+i);r('#3e6a2e',x,y,1,2);r('#3e6a2e',x+2,y,1,2);r('#5a8a3e',x+1,y-1,1,3)}
    if(h(27)<.06){const x=p(28),y=p(29);r('rgba(0,0,0,.2)',x,y+3,6,1);r('#2e5a2a',x,y,6,3);r('#4a7e3a',x+1,y,3,1);r('#e86a5a',x+4,y+1,1,1)}
    if(h(30)<.04){const x=p(31),y=p(32);r('#7a7a74',x,y,3,2);r('#a8a8a0',x,y,2,1)}}
  else if(c==='frost'){
    if(h(10)<.25){const x=p(11),y=p(12);r('#ffffff',x,y,6,1);r('#c8d4e2',x+1,y+1,5,1)}
    if(h(13)<.08){const x=p(14),y=p(15);r('#6a7280',x,y,4,3);r('#ffffff',x,y,4,1)}
    if(h(16)<.06){const x=p(17),y=p(18);r('#6a5040',x+1,y,1,4);r('#6a5040',x,y+1,1,1);r('#6a5040',x+2,y+2,1,1)}}
  else if(c==='desert'){
    if(h(10)<.35){const y=p(11);for(let x=1;x<14;x++)if(hs(X+x,y,3)>.25)r(x%5<3?'#e6cc8e':'#b89656',x,y+Math.round(Math.sin(x/2.2)),1,1)}
    if(h(12)<.06){const x=p(13),y=p(14);r('#4a7a30',x+1,y,2,7);r('#4a7a30',x,y+2,1,2);r('#4a7a30',x+3,y+1,1,3);r('#6a9a44',x+1,y,1,6);r('rgba(0,0,0,.2)',x+3,y+6,3,1)}
    if(h(15)<.02){const x=p(16),y=p(17);r('#ece4d0',x,y,4,1);r('#ece4d0',x+1,y-1,1,3)}
    if(h(18)<.05){const x=p(19),y=p(20);r('#9a6a42',x,y,4,3);r('#c08a5a',x,y,3,1)}}
  else{
    if(h(10)<.3){const x=p(11),y=p(12);r('#34482e',x,y,6,3);r('#46604a',x+1,y,3,1)}
    if(h(13)<.35)for(let i=0;i<3;i++){const x=p(14+i),y=p(17+i);r('#6b7a3a',x,y,1,4);r('#8a7a4a',x,y-1,1,1)}
    if(h(20)<.05){const x=p(21),y=p(22);r('#e8e0c8',x,y+1,1,2);r('#c84a3a',x-1,y,3,1)}}
}

/* battle grounds: the same ground, with tufts, flowers, stones and patches by climate */
function paintArena(c){
  const cv=document.createElement('canvas');cv.width=BW;cv.height=BH;const g=cv.getContext('2d'),img=g.createImageData(BW,BH),D=img.data,P3=GROUND_RGB[c],seed=CLIMS.indexOf(c)*7+1;
  for(let y=0;y<BH;y++)for(let x=0;x<BW;x++){const L=(fbm(x/70,y/70,seed)-.5)*2,b4=hs(x>>2,y>>2,seed);let v=.5+.4*L+.2*(b4-.5);v=Math.max(0,Math.min(1,v));
    let col=v<.5?mixc(P3[0],P3[1],v*2):mixc(P3[1],P3[2],(v-.5)*2);const ph=hs(x,y,seed+9);if(ph<.03)col=mixc(col,P3[2],.6);else if(ph>.97)col=mixc(col,P3[0],.7);
    const o=(y*BW+x)*4;D[o]=col[0];D[o+1]=col[1];D[o+2]=col[2];D[o+3]=255}
  g.putImageData(img,0,0);
  for(let ty=1;ty<BH/16;ty++)for(let tx=0;tx<BW/16;tx++)paintDecor(g,tx*16,ty*16,c,k=>hs(tx,ty,k+seed*3));
  if(c==='swamp')for(let k=0;k<10;k++){const x=Math.floor(hs(k,6,97)*(BW-30)),y=Math.floor(hs(k,7,97)*(BH-40))+20;g.fillStyle='#3d5a4a';g.fillRect(x,y,18+k%3*6,6);g.fillStyle='#56735e';g.fillRect(x+3,y+2,6,1)}
  const top=c==='frost'?['#b8c4d2','#9aa6b4']:c==='desert'?['#b8944c','#9a7a3a']:c==='swamp'?['#3a4a2a','#2a3a20']:['#3a5c2c','#2a4a22'];
  g.fillStyle=top[0];g.fillRect(0,0,BW,14);g.fillStyle=top[1];for(let x=0;x<BW;x+=3)g.fillRect(x,13+(hs(x,0,4)>.5?1:0),2,1);
  return cv;
}

/* what moves on the map: water glints, cloud shadows drifting by day, smoke over holdings, snow in the frost, fireflies at night */
// a cloud's shadow at full size, pixel by pixel (hard edges, never scaled)
const CLOUD=(()=>{const c=document.createElement('canvas');c.width=192;c.height=96;const g=c.getContext('2d');g.fillStyle='#000';
  const E=[...Array(9)].map((_,i)=>[36+hs(i,1,3)*120,28+hs(i,2,3)*40,(20+hs(i,3,3)*20)*1.4,(20+hs(i,3,3)*20)*.8]);
  for(let y=0;y<96;y++)for(let x=0;x<192;x++)if(E.some(([cx,cy,rx,ry])=>((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<=1))g.fillRect(x,y,1,1);return c})();
// layer 0 (under everything): water glints; layer 1 (over parties, under fog and night): clouds, smoke, snow, fireflies
function drawEnv(cam,V,layer){
  const now=performance.now()/1000,dark=darkness(),x0=Math.max(0,Math.floor(cam.x/TILE)),y0=Math.max(0,Math.floor(cam.y/TILE)),x1=Math.min(MW-1,x0+Math.ceil(VW/TILE)+1),y1=Math.min(MH-1,y0+Math.ceil(VH/TILE)+1);
  ctx.save();
  // glints on water, sliding with the current
  if(layer===0){for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){if(tiles[ty*MW+tx]!==T_WATER)continue;const c=CLIMS[climate[ty*MW+tx]];if(c==='frost')continue;
    for(let k=0;k<2;k++){const ph=(now*.35+hs(tx,ty,k))%1,a=Math.sin(ph*Math.PI);if(a<.15)continue;
      ctx.globalAlpha=a*.55;ctx.fillStyle=c==='swamp'?'#8ab08a':'#d8ecfa';ctx.fillRect(tx*TILE+2+Math.floor(hs(tx,ty,k+4)*9)+Math.floor(ph*3)-cam.x,ty*TILE+2+Math.floor(hs(tx,ty,k+6)*12)-cam.y,3,1)}}ctx.restore();return}
  // fish leap now and then over the fishing grounds (each its own colour: salmon, eel, pearl oysters' silver)
  if(layer===0){for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){const d=DEP_AT[ty*MW+tx];if(d<0||tiles[ty*MW+tx]!==T_WATER)continue;const ph=(now*.4+hs(tx,ty,3)*7)%3;if(ph>1)continue;
    const fx=tx*TILE+4+Math.floor(hs(tx,ty,5)*6)+Math.floor(ph*6)-cam.x,fy=ty*TILE+10-Math.round(Math.sin(ph*Math.PI)*5)-cam.y;ctx.globalAlpha=1;ctx.fillStyle=GOODS[DEPOSITS[d].g].res==='fish'&&DEPOSITS[d].g!=='pearls'?GOODS[DEPOSITS[d].g].col:'#dfe4ea';ctx.fillRect(Math.round(fx),Math.round(fy),2,1);
    if(ph<.15||ph>.85){ctx.fillStyle='#d8ecfa';ctx.fillRect(Math.round(fx)-1,ty*TILE+11-cam.y,4,1)}}ctx.globalAlpha=1}
  // cloud shadows by day
  if(dark<.8){ctx.globalAlpha=.1*(1-dark);for(let i=0;i<14;i++){const span=MW*TILE+300,x=((hs(i,1,21)*span+now*6*(1+hs(i,2,21)))%span)-150,y=hs(i,3,21)*MH*TILE;
    if(x+192<cam.x||x>cam.x+VW||y+96<cam.y||y>cam.y+VH)continue;ctx.drawImage(CLOUD,Math.round(x-cam.x),Math.round(y-cam.y))}}
  // smoke from the hearths of a few houses of each holding in view
  for(const t of TOWNS){if(Math.hypot(t.x-P.x,t.y-P.y)>VW)continue;const hs0=(t.lots||[]).filter(l=>l.k==='house'&&l.st==='built').slice(0,t.T.smoke);
    for(let j=0;j<hs0.length;j++){const l=hs0[j],sx=(l.x+l.n*.7)*TILE-cam.x,sy=l.y*TILE+2-cam.y,ox=0,oy=0;if(sx<-20||sy<-40||sx>VW+20||sy>VH+20)continue;
      for(let k=0;k<5;k++){const ph=(now*.3+k/5+j*.37)%1;ctx.globalAlpha=(1-ph)*.45;ctx.fillStyle=ph<.3?'#8a8a8a':'#b4b4b4';const w=1+Math.round(ph*3);
        ctx.fillRect(Math.round(sx+ox+Math.sin(ph*5+k)*2+ph*6-w/2),Math.round(sy+oy-ph*18),w,w)}}}
  // snow falls in the frost, fireflies glow on warm nights
  const here=climAt(P.x,P.y);
  if(here==='frost'){ctx.fillStyle='#ffffff';for(let i=0;i<70;i++){const x=(hs(i,1,31)*VW+now*(8+hs(i,2,31)*10)+Math.sin(now+i)*6)%VW,y=(hs(i,3,31)*VH+now*(18+hs(i,4,31)*14))%VH;ctx.globalAlpha=.5+hs(i,5,31)*.5;ctx.fillRect(Math.round(x),Math.round(y),1,1)}}
  else if(dark>.5&&(here==='grass'||here==='swamp')){ctx.fillStyle='#e8f080';for(let i=0;i<22;i++){const x=(hs(i,1,41)*VW+Math.sin(now*.7+i)*20+VW)%VW,y=(hs(i,2,41)*VH+Math.cos(now*.5+i*2)*14+VH)%VH;ctx.globalAlpha=dark*(.4+.6*Math.max(0,Math.sin(now*2+i*1.7)));ctx.fillRect(Math.round(x),Math.round(y),1,1)}}
  ctx.restore();
}

// worn ground under a site: sites move from game to game, so their clearing is drawn under them rather than painted in
function groundPatch(c){const k='gp'+c;if(spr[k])return spr[k];const P3=GROUND_RGB[c],dirt={grass:[124,108,70],frost:[176,170,158],desert:[196,166,110],swamp:[84,76,52]}[c];
  return spr[k]=mkc(30,12,g=>{for(let y=0;y<12;y++)for(let x=0;x<30;x++){const d=((x-14.5)/15)**2+((y-5.5)/6)**2,e=1-hs(x,y,27)*.4;if(d>e)continue;
    const col=mixc(P3[1],dirt,d>e-.3?.35:.6+hs(x,y,28)*.2);g.fillStyle=hex(col);g.fillRect(x,y,1,1)}})}
/* sprite helpers: a dark 1-pixel outline around any sprite, and a white silhouette for the flash when struck */
function outlined(src,col){
  const c=document.createElement('canvas');c.width=src.width+2;c.height=src.height+2;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  const m=document.createElement('canvas');m.width=src.width;m.height=src.height;const mg=m.getContext('2d');mg.drawImage(src,0,0);mg.globalCompositeOperation='source-in';mg.fillStyle=col||'rgba(18,14,12,.85)';mg.fillRect(0,0,m.width,m.height);
  for(const [a,b] of [[0,1],[2,1],[1,0],[1,2]])g.drawImage(m,a,b);g.drawImage(src,1,1);return c;
}
function whiteOf(src){if(src._w)return src._w;const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const g=c.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#ffffff';g.fillRect(0,0,c.width,c.height);return src._w=c}
