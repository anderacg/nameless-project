'use strict';
/* ---------- territory: every holding rules the land around it ---------- */
// A holding claims the land it can reach within its reach (travel cost from its gates: roads are cheap, forests, hills and
// mountains dear, water stops it). Where claims meet, the tile goes to the holding with more of its reach left there,
// so strong holdings push their borders into weak ones. Reach grows (t.grow) while a holding is held in peace, faster with
// friendly holdings nearby, and when camps and dens on or near its land are cleared; siege, sack, raid and conquest cut it back.
// A captured holding brings all its land to the new owner. Three parts: the model (who rules each tile), its state over the
// days (reach), and its art (borders, the minimap tint).
const GROW0=4,GROW_DAY=1/5;
const NB8=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.41],[1,-1,1.41],[-1,1,1.41],[-1,-1,1.41]],NB4=[[1,0],[-1,0],[0,1],[0,-1]];

/* the model. LAND: an index into TOWNS a tile, or -1 for wild land. LAND_EDGE: its borders, 2 bits a side in NB4's order (0 none,
   1 between holdings of one realm, 2 between realms or to the wilds). Each holding's run (what it took: tiles and the share of its
   reach spent there) is kept, so a change to one holding runs again only those whose reach box touches a changed one (and so on
   down TOWNS' order, as the full reckoning goes) and lays the rest as they were: the same land as reckoning it all */
// what crossing a tile costs a holding's reach (0: it cannot), and the least any tile costs (how far a reach can run, in tiles)
const LAND_COST=[1,1.7,1.5,0,.8,4,1.5],LAND_STEP=Math.min(...LAND_COST.filter(Boolean));
const landCost=k=>LAND_COST[tiles[k]];
let LAND=null,LAND_EDGE=null,landSig=0,landTiles=[],landRuns=null,landWas=null,landVer=0,landBest=null,landDist=null,landKey=0,landClaims=null;
// a world goes in: its land as the world first stood (worldmap.js worldKeep), or none claimed yet (reckoned at the next look)
onWorld(m=>{const F=m.first,n=MW*MH;LAND=F?Int16Array.from(F.land):new Int16Array(n).fill(-1);LAND_EDGE=new Uint8Array(n);landBest=new Float64Array(n);landDist=new Float64Array(n).fill(1e9);
  landSig=F?F.landSig:0;landTiles=F?F.landTiles.slice():[];landRuns=landWas=landClaims=null;landKey=0;landVer++});
const landReach=t=>t.T.reach+Math.floor(t.grow||0);
// up to 3 more reach for friendly holdings near (WORLD_SCALE.land.friendly tiles)
const growCap=t=>t.T.growMax+Math.min(3,TOWNS.filter(o=>o!==t&&o.owner===t.owner&&Math.hypot(o.tx-t.tx,o.ty-t.ty)<WORLD_SCALE.land.friendly).length);
// a small binary heap of [cost, tile]
function heapPush(h,e){h.push(e);let i=h.length-1;while(i){const p=(i-1)>>1;if(h[p][0]<=h[i][0])break;[h[p],h[i]]=[h[i],h[p]];i=p}}
function heapPop(h){const top=h[0],last=h.pop();if(h.length){h[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<h.length&&h[l][0]<h[m][0])m=l;if(r<h.length&&h[r][0]<h[m][0])m=r;if(m===i)break;[h[m],h[i]]=[h[i],h[m]];i=m}}return top}
// what a holding's claim hangs on: its reach (none once it is gone) and its tile; [x0, y0, x1, y1] the tiles a reach can touch
const landLim=t=>t.gone?0:landReach(t);
const landBox=(t,lim)=>{const r=Math.ceil(lim/LAND_STEP)+1;return[Math.max(0,t.tx-r),Math.max(0,t.ty-r),Math.min(MW-1,t.tx+r),Math.min(MH-1,t.ty+r)]};// (t: a holding, or any {tx, ty})
const boxMeets=(a,b)=>a[0]<=b[2]&&b[0]<=a[2]&&a[1]<=b[3]&&b[1]<=a[3];
// one holding's run: its reach spreads from its tile (or at: an outpost's claim for it, Outposts.claims) by the cost of the land,
// taking each tile where more of it is left than of any holding's before it
function landRun(i,lim,at=TOWNS[i]){
  const t=at,s0=t.ty*MW+t.tx,h=[[0,s0]],used=[s0],tk=[],tv=[];landDist[s0]=0;
  while(h.length){const [c,k]=heapPop(h);if(c>landDist[k])continue;if(c/lim<landBest[k]){landBest[k]=c/lim;LAND[k]=i;tk.push(k);tv.push(c/lim)}
    const x=k%MW,y=(k-x)/MW;
    for(const [dx,dy,m] of NB8){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const n=ny*MW+nx,lc=landCost(n);if(!lc)continue;
      const nc=c+lc*m;if(nc<=lim&&nc<landDist[n]&&nc/lim<landBest[n]){if(landDist[n]===1e9)used.push(n);landDist[n]=nc;heapPush(h,[nc,n])}}}
  for(const k of used)landDist[k]=1e9;
  return{lim,at:s0,box:landBox(t,lim),k:Int32Array.from(tk),v:Float64Array.from(tv)};
}
// reckon the land: every holding's run (S null), or those in S (indices) and those their changes reach; returns the boxes changed
function landCompute(S){
  landBest.fill(2);LAND.fill(-1);const runs=landRuns||[],D=[];
  TOWNS.forEach((t,i)=>{const was=runs[i],lim=landLim(t),box=lim>0?landBox(t,lim):null;
    if(S&&!S.has(i)&&!(box&&D.some(b=>boxMeets(b,box)))){if(was)for(let j=0;j<was.k.length;j++){landBest[was.k[j]]=was.v[j];LAND[was.k[j]]=i}return}
    if(was)D.push(was.box);if(box)D.push(box);runs[i]=lim>0?landRun(i,lim):null});
  runs.length=TOWNS.length;landRuns=runs;
  // (then the outposts' claims, after every holding's, each for its realm's nearest holding: world/outposts.js Outposts.claims)
  for(const r of landClaims||[])D.push(r.box);landClaims=(typeof Outposts!=='undefined'?Outposts.claims():[]).map(c=>{const r=landRun(c.i,c.lim,c.s);D.push(r.box);return r});
  landTiles=TOWNS.map(()=>0);for(let k=0;k<LAND.length;k++)if(LAND[k]>=0)landTiles[LAND[k]]++;
  return D;
}
function computeLand(){landCompute(null);landEdges([0,0,MW-1,MH-1])}
// the borders in a box of tiles: to a neighbour of another holding, or to wild land (not to water, nor off the map)
function landEdges(b){
  const at=(x,y)=>x<0||y<0||x>=MW||y>=MH?-1:LAND[y*MW+x];
  for(let y=b[1];y<=b[3];y++)for(let x=b[0];x<=b[2];x++){const k=y*MW+x,i=LAND[k];let e=0;
    if(i>=0){const o=TOWNS[i].owner;for(let d=0;d<4;d++){const [dx,dy]=NB4[d],n=at(x+dx,y+dy);if(n===i||n<0&&tAt(x+dx,y+dy)===T_WATER)continue;e|=(n<0||TOWNS[n].owner!==o?2:1)<<2*d}}
    LAND_EDGE[k]=e}
}
// look again when an owner, a reach (a whole step of growth) or a holding's tile changes: the claims changed run again, the
// borders are drawn afresh round them and round a holding that changed hands
// (or an outpost's holder or level: Outposts.landKey)
// (what the land hangs on, as a number: each holding's owner, reach and tile mixed in turn, no string made (it is looked at on every
// look at the land, landIdx); an owner by its number in landOwn; no holdings 0, as the unset sig (the old key's '': what the
// world's reckoning while it is made waits on))
const landOwn=new Map(),landOwnId=o=>{if(!o)return 0;let v=landOwn.get(o);if(v==null)landOwn.set(o,v=landOwn.size+1);return v};
function landSigOf(){let h=TOWNS.length|0;for(const t of TOWNS){h=Math.imul(h^landOwnId(t.owner),0x9e3779b1)^landLim(t);h=Math.imul(h,0x85ebca6b)^(t.tx<<12|t.ty)}return h>>>0}
// (held: looked at already for a pass that asks it of many and changes none of it (landHeldFor); a holding added or lost meanwhile
// unsets its sig (onHolding below), and is seen at once all the same)
let landHeld=false;
function landHeldFor(f){if(!WORLD_FAST.land||landHeld)return f();landFresh();landHeld=true;try{return f()}finally{landHeld=false}}
function landFresh(){
  if(landHeld&&landSig)return;
  const s=landSigOf(),k=typeof Outposts!=='undefined'?Outposts.landKey():0;if(s===landSig&&k===landKey&&landWas)return;
  const now=TOWNS.map(t=>({own:t.owner,lim:landLim(t),at:t.ty*MW+t.tx}));landVer++;
  // (a world put back as it first stood: its land as kept, reckoned afresh at the next change)
  if(s===landSig&&k===landKey){landWas=now;landEdges([0,0,MW-1,MH-1]);return}
  const kc=k!==landKey;landSig=s;landKey=k;const was=landWas;landWas=now;
  if(!was||!landRuns||was.length>now.length){computeLand();return}
  const S=new Set(),O=[];now.forEach((n,i)=>{const w=was[i];if(!w||w.lim!==n.lim||w.at!==n.at)S.add(i);else if(w.own!==n.own&&n.lim>0)O.push(landRuns[i].box)});
  const D=S.size||kc?landCompute(S):[];
  for(const b of [...D,...O])landEdges([Math.max(0,b[0]-1),Math.max(0,b[1]-1),Math.min(MW-1,b[2]+1),Math.min(MH-1,b[3]+1)]);
}
// a holding added or lost: looked at again at the next look
onHolding(()=>{landSig=0});
const landIdx=(x,y)=>{landFresh();const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return tx<0||ty<0||tx>=MW||ty>=MH?-1:LAND[ty*MW+tx]};
const landHold=(x,y)=>{const i=landIdx(x,y);return i>=0?TOWNS[i]:null};
// within r tiles of where the land at (x, y) ends: a tile that near is another holding's, or wild (water is no one's edge)
const landRim=(x,y,r)=>{const i=landIdx(x,y),tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
  for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const nx=tx+dx,ny=ty+dy;if(nx>=0&&ny>=0&&nx<MW&&ny<MH&&LAND[ny*MW+nx]!==i&&tAt(nx,ny)!==T_WATER)return true}
  return false};
// where people live: a holding and its built estates (world objects with a place: estates.js); is (x, y) at least r px from all of them
const homesOf=t=>[t,...t.estates()];
const farFromHomes=(x,y,r)=>!TOWNS.some(t=>!t.gone&&homesOf(t).some(o=>Math.hypot(o.x-x,o.y-y)<r));
const landName=(x,y)=>{const t=landHold(x,y);return t?(Discovery.named(t)?t.name+' lands':'Unknown lands'):'Wild lands'};// (a holding you have not come near: its lands unnamed, world/discovery.js)
const landOf=t=>{landFresh();return landTiles[TOWNS.indexOf(t)]||0};
const landsOf=f=>{landFresh();return TOWNS.reduce((a,t,i)=>a+(t.owner===f?landTiles[i]:0),0)};

/* its state over the days: conquest burns the borderland, war and ruin shrink it, peace grows it */
function landDay(){
  Systems.sliced(TOWNS,t=>t.landDay());// (each holding's: holding.js Holding landDay; sliced on a big world, core/systems.js)
}
// clearing a camp or den settles the land around it: the holding whose land it is (or the nearest, within WORLD_SCALE.land.pacify
// tiles) reaches further
function pacify(x,y){
  const R=WORLD_SCALE.land.pacify*TILE,t=landHold(x,y)||TOWNS.filter(o=>Math.hypot(o.x-x,o.y-y)<R).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
  if(!t)return null;const cap=growCap(t)+2;if((t.grow||0)>=cap)return t;
  t.grow=Math.min(cap,(t.grow||0)+1);if(t.owner==='player'||t.owner===P.fac)log('With the camp gone, settlers push out from '+t.name+'. Its lands grow.','good');return t;
}
// crossing a border: the realm underfoot kept (G.landFac); no line in the log (the owner, 2026-11-08: "remove the log when you travel
// cross to the region or territory": whose land it is shows on the HUD, updateHUD)
function landWatch(){
  const t=landHold(P.x,P.y),o=t?t.owner:null;if(o!==G.landFac)G.landFac=o;
}

/* its art: a faint tint over each realm, a strong line where realms meet, a faint one between holdings of one realm (LAND_EDGE).
   part: 'tint' (with the ground, under all that stands), 'line' (the borders, over the ground, the water's glints, the buildings
   and estates, under everyone who moves, you, the fog and the night: the owner, 2026-10-22), or both (none given) */
const landCol=o=>o?FACS[o].col:'#98a0ba';
function drawLand(cam,part){
  if(LAND_SMOOTH.on)return LandArt.draw(cam,part);
  landFresh();const x0=Math.max(0,Math.floor(cam.x/TILE)),y0=Math.max(0,Math.floor(cam.y/TILE)),x1=Math.min(MW-1,x0+Math.ceil(VW/TILE)+1),y1=Math.min(MH-1,y0+Math.ceil(VH/TILE)+1);
  ctx.save();
  // (the tint a run of a row's tiles of one colour at a time: one rect, the same pixels as a rect a tile; then the lines)
  if(part!=='line'){ctx.globalAlpha=.08;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=LAND[y*MW+x];if(i<0)continue;const c=landCol(TOWNS[i].owner);let n=1;
    while(x+n<=x1){const j=LAND[y*MW+x+n];if(j<0||landCol(TOWNS[j].owner)!==c)break;n++}
    ctx.fillStyle=c;ctx.fillRect(x*TILE-cam.x,y*TILE-cam.y,n*TILE,TILE);x+=n-1}}
  if(part!=='tint')for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const k=y*MW+x,i=LAND[k],e=LAND_EDGE[k];if(i<0||!e)continue;const sx=x*TILE-cam.x,sy=y*TILE-cam.y;
    ctx.fillStyle=landCol(TOWNS[i].owner);
    for(let d=0;d<4;d++){const b=e>>2*d&3;if(!b)continue;const [dx,dy]=NB4[d];// (b: the line's width too)
      ctx.globalAlpha=b===2?.7:.22;ctx.fillRect(dx>0?sx+TILE-b:sx,dy>0?sy+TILE-b:sy,dx?b:TILE,dy?b:TILE)}
  }
  ctx.restore();
}
/* the borders and tint, smooth (LAND_SMOOTH): on the tiles' corners (a vertex: its four tiles, top left, top right, bottom left, bottom
   right), each of its four arms (half a tile edge, from the vertex to the edge's middle: up between the top two, right between the right
   two, down, left) a border where its two tiles differ. Two arms across: a straight line; two arms at a corner: one tile stands out
   there, the line cut across it from one arm's end to the other's (45°), its corner going to the others; three or four: each arm to
   the vertex. Each side of a line in its own colour, inside its own tile (as the tiles' borders were), drawn where that side had one
   (to another holding, a realm or the wilds; not to the water). One path a colour and width, stroked once: no doubled alpha */
const LandArt={
  // (the id at a tile: its holding, -1 wild or off the map; key: what a corner is cut by: the holding (lines) or its realm's colour (tint))
  at:(x,y)=>x<0||y<0||x>=MW||y>=MH?-1:LAND[y*MW+x],
  col(i){return i<0?null:landCol(TOWNS[i].owner)},
  // (a side's line to the other: its width and alpha (LAND_SMOOTH.line), or null)
  side(a,b,bx,by){if(a<0||a===b||b<0&&(bx<0||by<0||bx>=MW||by>=MH||tAt(bx,by)===T_WATER))return null;return LAND_SMOOTH.line[b<0||TOWNS[b].owner!==TOWNS[a].owner?1:0]},
  // (a vertex's corner cut: the tile standing out there, by key: 0 top left, 1 top right, 2 bottom left, 3 bottom right; -1 none)
  odd(k){const [a,b,c,d]=k;if(a!==b&&b===d&&d===c)return 0;if(b!==a&&a===c&&c===d)return 1;if(c!==a&&a===b&&b===d)return 2;if(d!==b&&b===a&&a===c)return 3;return -1},
  // (built for the view and LAND_SMOOTH.margin tiles round it, again when the land or its owners change or the view leaves that box)
  built:null,
  draw(cam,part){landFresh();const T=TILE,M=LAND_SMOOTH.margin,x0=Math.max(0,Math.floor(cam.x/T)),y0=Math.max(0,Math.floor(cam.y/T)),x1=Math.min(MW-1,x0+Math.ceil(VW/T)+1),y1=Math.min(MH-1,y0+Math.ceil(VH/T)+1);
    let b=this.built;if(!b||b.ver!==landVer||x0<b.box[0]||y0<b.box[1]||x1>b.box[2]||y1>b.box[3]){
      const B=[Math.max(0,x0-M),Math.max(0,y0-M),Math.min(MW-1,x1+M),Math.min(MH-1,y1+M)];b=this.built={ver:landVer,box:B,tint:this.tint(...B,T,T/2),lines:this.lines(...B,T,T/2)}}
    ctx.save();ctx.translate(-cam.x,-cam.y);
    if(part!=='line'){ctx.globalAlpha=LAND_SMOOTH.tint;for(const [c,p] of b.tint){ctx.fillStyle=c;ctx.fill(p)}}
    if(part!=='tint'){ctx.lineCap='square';for(const e of b.lines.values()){ctx.globalAlpha=e.L[1];ctx.strokeStyle=e.c;ctx.lineWidth=e.L[0];ctx.stroke(e.p)}}
    ctx.restore()},
  // the tint: each tile, its corner cut where it stands out by its realm's colour, that corner the others'; a path a colour, filled
  // once (a run of a row's whole tiles one rect)
  tint(x0,y0,x1,y1,T,h){const P=new Map(),path=c=>P.get(c)||(P.set(c,new Path2D()),P.get(c)),C=(x,y)=>this.col(this.at(x,y));
    // (a tile's four corners: 0 top left … 3 bottom right; at each, the four colours round that vertex)
    const ring=(x,y,v)=>{const vx=x+(v&1),vy=y+(v>>1);return [C(vx-1,vy-1),C(vx,vy-1),C(vx-1,vy),C(vx,vy)]};
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const c=C(x,y);if(!c)continue;const X=x*T,Y=y*T,cut=[0,1,2,3].map(v=>{const r=ring(x,y,v);return this.odd(r)===3-v});
      const p=path(c);if(!cut.some(Boolean)){let n=1;while(x+n<=x1&&C(x+n,y)===c&&![0,1,2,3].some(v=>this.odd(ring(x+n,y,v))===3-v))n++;p.rect(X,Y,n*T,T);x+=n-1;continue}
      // (clockwise from the top left corner, each cut corner its two half-edge points)
      const pts=[];const add=(v,a,b,cx,cy)=>{if(cut[v])pts.push(a,b);else pts.push([cx,cy])};
      add(0,[X,Y+h],[X+h,Y],X,Y);add(1,[X+h,Y],[X+T,Y+h],X+T,Y);add(3,[X+T,Y+h],[X+h,Y+T],X+T,Y+T);add(2,[X+h,Y+T],[X,Y+h],X,Y+T);
      p.moveTo(pts[0][0],pts[0][1]);for(const q of pts.slice(1))p.lineTo(q[0],q[1]);p.closePath()}
    // (each cut corner given to the others round it: a triangle of their colour)
    for(let vy=y0;vy<=y1+1;vy++)for(let vx=x0;vx<=x1+1;vx++){const r=[C(vx-1,vy-1),C(vx,vy-1),C(vx-1,vy),C(vx,vy)],o=this.odd(r);if(o<0)continue;const m=r[3-o];if(!m)continue;
      const X=vx*T,Y=vy*T,sx=o&1?1:-1,sy=o>>1?1:-1,p=path(m);p.moveTo(X,Y);p.lineTo(X+sx*h,Y);p.lineTo(X,Y+sy*h);p.closePath()}
    return P},
  // the lines: at each vertex its border arms joined as the head says; each side offset into its own tile by half its width
  lines(x0,y0,x1,y1,T,h){const P=new Map(),A=(x,y)=>this.at(x,y);
    const seg=(px,py,qx,qy,ax,ay,bx,by)=>{for(const [sx,sy,ox,oy] of [[ax,ay,bx,by],[bx,by,ax,ay]]){const a=A(sx,sy),L=this.side(a,A(ox,oy),ox,oy);if(!L)continue;
        // (the normal toward the side's own tile's middle)
        let nx=-(qy-py),ny=qx-px;const l=Math.hypot(nx,ny)||1;nx/=l;ny/=l;const mx=(sx+.5)*T-(px+qx)/2,my=(sy+.5)*T-(py+qy)/2;if(nx*mx+ny*my<0){nx=-nx;ny=-ny}
        const k=this.col(a)+'|'+L[0]+'|'+L[1];let e=P.get(k);if(!e)P.set(k,e={c:this.col(a),L,p:new Path2D()});const o=L[0]/2;e.p.moveTo(px+nx*o,py+ny*o);e.p.lineTo(qx+nx*o,qy+ny*o)}};
    for(let vy=y0;vy<=y1+1;vy++)for(let vx=x0;vx<=x1+1;vx++){const r=[A(vx-1,vy-1),A(vx,vy-1),A(vx-1,vy),A(vx,vy)];if(r[0]===r[1]&&r[1]===r[2]&&r[2]===r[3])continue;
      const X=vx*T,Y=vy*T,tiles=[[vx-1,vy-1],[vx,vy-1],[vx-1,vy],[vx,vy]],
        // (the arms: its end, and its two tiles' corners: up 0|1, right 1|3, down 2|3, left 0|2)
        arms=[[X,Y-h,0,1],[X+h,Y,1,3],[X,Y+h,2,3],[X-h,Y,0,2]].filter(([,,i,j])=>r[i]!==r[j]),o=this.odd(r);
      const T2=(i,j,P0,P1)=>seg(P0[0],P0[1],P1[0],P1[1],tiles[i][0],tiles[i][1],tiles[j][0],tiles[j][1]);
      if(o>=0){const [a,b]=arms;T2(o,3-o,a,b)}
      else if(arms.length===2){const [a,b]=arms;T2(a[2],a[3],a,b)}
      else for(const a of arms)T2(a[2],a[3],a,[X,Y])}
    return P}
};
// the minimap tint, one pixel per tile, made again when the land or its owners change
let landMini=null;
function landMiniCv(){
  landFresh();if(landMini&&landMini.ver===landVer)return landMini;
  landMini=mkc(MW,MH,g=>{for(let k=0;k<LAND.length;k++){const i=LAND[k];if(i<0)continue;rect(g,landCol(TOWNS[i].owner),k%MW,Math.floor(k/MW),1,1)}});landMini.ver=landVer;return landMini;
}
// its work in the world's day and frame (core/systems.js)
Systems.add({name:'lands',order:{day:100,frame:40},day:landDay,frame:landWatch});
