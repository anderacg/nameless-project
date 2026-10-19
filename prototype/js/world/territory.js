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
let LAND=null,LAND_EDGE=null,landSig='',landTiles=[],landRuns=null,landWas=null,landVer=0,landBest=null,landDist=null;
// a world goes in: its land as the world first stood (worldmap.js worldKeep), or none claimed yet (reckoned at the next look)
onWorld(m=>{const F=m.first,n=MW*MH;LAND=F?Int16Array.from(F.land):new Int16Array(n).fill(-1);LAND_EDGE=new Uint8Array(n);landBest=new Float64Array(n);landDist=new Float64Array(n).fill(1e9);
  landSig=F?F.landSig:'';landTiles=F?F.landTiles.slice():[];landRuns=landWas=null;landVer++});
const landReach=t=>t.T.reach+Math.floor(t.grow||0);
// up to 3 more reach for friendly holdings near (WORLD_SCALE.land.friendly tiles)
const growCap=t=>t.T.growMax+Math.min(3,TOWNS.filter(o=>o!==t&&o.owner===t.owner&&Math.hypot(o.tx-t.tx,o.ty-t.ty)<WORLD_SCALE.land.friendly).length);
// a small binary heap of [cost, tile]
function heapPush(h,e){h.push(e);let i=h.length-1;while(i){const p=(i-1)>>1;if(h[p][0]<=h[i][0])break;[h[p],h[i]]=[h[i],h[p]];i=p}}
function heapPop(h){const top=h[0],last=h.pop();if(h.length){h[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<h.length&&h[l][0]<h[m][0])m=l;if(r<h.length&&h[r][0]<h[m][0])m=r;if(m===i)break;[h[m],h[i]]=[h[i],h[m]];i=m}}return top}
// what a holding's claim hangs on: its reach (none once it is gone) and its tile; [x0, y0, x1, y1] the tiles a reach can touch
const landLim=t=>t.gone?0:landReach(t);
const landBox=(t,lim)=>{const r=Math.ceil(lim/LAND_STEP)+1;return[Math.max(0,t.tx-r),Math.max(0,t.ty-r),Math.min(MW-1,t.tx+r),Math.min(MH-1,t.ty+r)]};
const boxMeets=(a,b)=>a[0]<=b[2]&&b[0]<=a[2]&&a[1]<=b[3]&&b[1]<=a[3];
// one holding's run: its reach spreads from its tile by the cost of the land, taking each tile where more of it is left than of
// any holding's before it
function landRun(i,lim){
  const t=TOWNS[i],s0=t.ty*MW+t.tx,h=[[0,s0]],used=[s0],tk=[],tv=[];landDist[s0]=0;
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
function landFresh(){
  const s=TOWNS.map(t=>(t.owner||'')+':'+landLim(t)+':'+t.tx+','+t.ty).join();if(s===landSig&&landWas)return;
  const now=TOWNS.map(t=>({own:t.owner,lim:landLim(t),at:t.ty*MW+t.tx}));landVer++;
  // (a world put back as it first stood: its land as kept, reckoned afresh at the next change)
  if(s===landSig){landWas=now;landEdges([0,0,MW-1,MH-1]);return}
  landSig=s;const was=landWas;landWas=now;
  if(!was||!landRuns||was.length>now.length){computeLand();return}
  const S=new Set(),O=[];now.forEach((n,i)=>{const w=was[i];if(!w||w.lim!==n.lim||w.at!==n.at)S.add(i);else if(w.own!==n.own&&n.lim>0)O.push(landRuns[i].box)});
  const D=S.size?landCompute(S):[];
  for(const b of [...D,...O])landEdges([Math.max(0,b[0]-1),Math.max(0,b[1]-1),Math.min(MW-1,b[2]+1),Math.min(MH-1,b[3]+1)]);
}
// a holding added or lost: looked at again at the next look
onHolding(()=>{landSig=''});
const landIdx=(x,y)=>{landFresh();const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return tx<0||ty<0||tx>=MW||ty>=MH?-1:LAND[ty*MW+tx]};
const landHold=(x,y)=>{const i=landIdx(x,y);return i>=0?TOWNS[i]:null};
// within r tiles of where the land at (x, y) ends: a tile that near is another holding's, or wild (water is no one's edge)
const landRim=(x,y,r)=>{const i=landIdx(x,y),tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
  for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const nx=tx+dx,ny=ty+dy;if(nx>=0&&ny>=0&&nx<MW&&ny<MH&&LAND[ny*MW+nx]!==i&&tAt(nx,ny)!==T_WATER)return true}
  return false};
// where people live: a holding and its built estates (world objects with a place: estates.js); is (x, y) at least r px from all of them
const homesOf=t=>[t,...t.estates()];
const farFromHomes=(x,y,r)=>!TOWNS.some(t=>!t.gone&&homesOf(t).some(o=>Math.hypot(o.x-x,o.y-y)<r));
const landName=(x,y)=>{const t=landHold(x,y);return t?t.name+' lands':'Wild lands'};
const landOf=t=>{landFresh();return landTiles[TOWNS.indexOf(t)]||0};
const landsOf=f=>{landFresh();return TOWNS.reduce((a,t,i)=>a+(t.owner===f?landTiles[i]:0),0)};

/* its state over the days: conquest burns the borderland, war and ruin shrink it, peace grows it */
function landDay(){
  for(const t of TOWNS){
    const was=Math.floor(t.grow||0);t.grow=t.grow==null?GROW0:t.grow;
    if(t.lastOwner!=null&&t.lastOwner!==t.owner)t.grow=Math.max(0,t.grow-2);
    t.lastOwner=t.owner;
    if(besieged(t)||until(t,'sacked')||until(t,'raided'))t.grow=Math.max(0,t.grow-.25);
    else if(t.grow<growCap(t))t.grow=Math.min(growCap(t),t.grow+GROW_DAY*(until(t,'turmoil')?.5:1));
    const now=Math.floor(t.grow);if(t.owner==='player'&&now!==was)log(now>was?'The lands of '+t.name+' reach further.':'The lands of '+t.name+' shrink.',now>was?'good':'bad');
  }
}
// clearing a camp or den settles the land around it: the holding whose land it is (or the nearest, within WORLD_SCALE.land.pacify
// tiles) reaches further
function pacify(x,y){
  const R=WORLD_SCALE.land.pacify*TILE,t=landHold(x,y)||TOWNS.filter(o=>Math.hypot(o.x-x,o.y-y)<R).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
  if(!t)return null;const cap=growCap(t)+2;if((t.grow||0)>=cap)return t;
  t.grow=Math.min(cap,(t.grow||0)+1);if(t.owner==='player'||t.owner===P.fac)log('With the camp gone, settlers push out from '+t.name+'. Its lands grow.','good');return t;
}
// crossing a border: a line in the log when the realm underfoot changes
function landWatch(){
  const t=landHold(P.x,P.y),o=t?t.owner:null;if(o===G.landFac)return;const first=G.landFac===undefined,now=performance.now();G.landFac=o;if(first||now-(G.landLogAt||-1e9)<4000)return;G.landLogAt=now;
  if(!o)log('You leave settled land for the wilds.');
  else log(o==='player'?'You enter your own lands ('+t.name+').':'You cross into the lands of the '+FACS[o].n+' ('+t.name+')'+(hostileTo(o)?': hostile ground.':'.'),hostileTo(o)?'bad':'');
}

/* its art: a faint tint over each realm, a strong line where realms meet, a faint one between holdings of one realm (LAND_EDGE) */
const landCol=o=>o?FACS[o].col:'#98a0ba';
function drawLand(cam){
  landFresh();const x0=Math.max(0,Math.floor(cam.x/TILE)),y0=Math.max(0,Math.floor(cam.y/TILE)),x1=Math.min(MW-1,x0+Math.ceil(VW/TILE)+1),y1=Math.min(MH-1,y0+Math.ceil(VH/TILE)+1);
  ctx.save();
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const k=y*MW+x,i=LAND[k];if(i<0)continue;const sx=x*TILE-cam.x,sy=y*TILE-cam.y,e=LAND_EDGE[k];
    ctx.fillStyle=landCol(TOWNS[i].owner);ctx.globalAlpha=.08;ctx.fillRect(sx,sy,TILE,TILE);
    for(let d=0;e&&d<4;d++){const b=e>>2*d&3;if(!b)continue;const [dx,dy]=NB4[d];// (b: the line's width too)
      ctx.globalAlpha=b===2?.7:.22;ctx.fillRect(dx>0?sx+TILE-b:sx,dy>0?sy+TILE-b:sy,dx?b:TILE,dy?b:TILE)}
  }
  ctx.restore();
}
// the minimap tint, one pixel per tile, made again when the land or its owners change
let landMini=null;
function landMiniCv(){
  landFresh();if(landMini&&landMini.ver===landVer)return landMini;
  landMini=mkc(MW,MH,g=>{for(let k=0;k<LAND.length;k++){const i=LAND[k];if(i<0)continue;rect(g,landCol(TOWNS[i].owner),k%MW,Math.floor(k/MW),1,1)}});landMini.ver=landVer;return landMini;
}
