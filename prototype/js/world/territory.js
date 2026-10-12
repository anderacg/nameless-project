'use strict';
/* ---------- territory: every holding rules the land around it ---------- */
// A holding claims the land it can reach within its reach (travel cost from its gates: roads are cheap, forests, hills and
// mountains dear, water stops it). Where claims meet, the tile goes to the holding with more of its reach left there,
// so strong holdings push their borders into weak ones. Reach grows (t.grow) while a holding is held in peace, faster with
// friendly holdings nearby, and when camps and dens on or near its land are cleared; siege, sack, raid and conquest cut it back.
// A captured holding brings all its land to the new owner.
const LAND_REACH={village:10,town:15,castle:18},GROW_MAX={village:7,town:10,castle:10},GROW0=4,GROW_DAY=1/5;
const LAND_COST=[1,1.7,1.5,0,.8,4];
const NB8=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.41],[1,-1,1.41],[-1,1,1.41],[-1,-1,1.41]];
const LAND=new Int8Array(MW*MH).fill(-1);  // index into TOWNS, or -1 for wild land
let landSig='',landTiles=[],landMini=null;
const landReach=t=>LAND_REACH[t.kind]+Math.floor(t.grow||0);
// up to 3 more reach for friendly holdings within 50 tiles
const growCap=t=>GROW_MAX[t.kind]+Math.min(3,TOWNS.filter(o=>o!==t&&o.owner===t.owner&&Math.hypot(o.tx-t.tx,o.ty-t.ty)<50).length);
// a small binary heap of [cost, tile]
function heapPush(h,e){h.push(e);let i=h.length-1;while(i){const p=(i-1)>>1;if(h[p][0]<=h[i][0])break;[h[p],h[i]]=[h[i],h[p]];i=p}}
function heapPop(h){const top=h[0],last=h.pop();if(h.length){h[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<h.length&&h[l][0]<h[m][0])m=l;if(r<h.length&&h[r][0]<h[m][0])m=r;if(m===i)break;[h[m],h[i]]=[h[i],h[m]];i=m}}return top}
function computeLand(){
  const best=new Float64Array(MW*MH).fill(2),cost=new Float64Array(MW*MH);LAND.fill(-1);
  TOWNS.forEach((t,i)=>{
    const lim=landReach(t),s0=t.ty*MW+t.tx,h=[[0,s0]];cost.fill(1e9);cost[s0]=0;
    while(h.length){const [c,k]=heapPop(h);if(c>cost[k])continue;if(c/lim<best[k]){best[k]=c/lim;LAND[k]=i}
      const x=k%MW,y=(k-x)/MW;
      for(const [dx,dy,m] of NB8){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const n=ny*MW+nx,lc=LAND_COST[tiles[n]];if(!lc)continue;
        const nc=c+lc*m;if(nc<=lim&&nc<cost[n]&&nc/lim<best[n]){cost[n]=nc;heapPush(h,[nc,n])}}}
  });
  landTiles=TOWNS.map(()=>0);for(let k=0;k<LAND.length;k++)if(LAND[k]>=0)landTiles[LAND[k]]++;
}
// recompute only when an owner or a whole step of reach changes
function landFresh(){const s=TOWNS.map(t=>(t.owner||'')+':'+Math.floor(t.grow||0)).join();if(s!==landSig){landSig=s;computeLand();landMini=null}}
const landIdx=(x,y)=>{landFresh();const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return tx<0||ty<0||tx>=MW||ty>=MH?-1:LAND[ty*MW+tx]};
const landHold=(x,y)=>{const i=landIdx(x,y);return i>=0?TOWNS[i]:null};
const landName=(x,y)=>{const t=landHold(x,y);return t?t.name+' lands':'Wild lands'};
const landOf=t=>{landFresh();return landTiles[TOWNS.indexOf(t)]||0};
const landsOf=f=>{landFresh();return TOWNS.reduce((a,t,i)=>a+(t.owner===f?landTiles[i]:0),0)};
const landCol=o=>o?FACS[o].col:'#98a0ba';

// once a day: conquest burns the borderland, war and ruin shrink it, peace grows it
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
// clearing a camp or den settles the land around it: the holding whose land it is (or the nearest, within 35 tiles) reaches further
function pacify(x,y){
  const t=landHold(x,y)||TOWNS.filter(o=>Math.hypot(o.x-x,o.y-y)<35*TILE).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
  if(!t)return null;const cap=growCap(t)+2;if((t.grow||0)>=cap)return t;
  t.grow=Math.min(cap,(t.grow||0)+1);if(t.owner==='player'||t.owner===P.fac)log('With the camp gone, settlers push out from '+t.name+'. Its lands grow.','good');return t;
}
// crossing a border: a line in the log when the realm underfoot changes
function landWatch(){
  const t=landHold(P.x,P.y),o=t?t.owner:null;if(o===G.landFac)return;const first=G.landFac===undefined,now=performance.now();G.landFac=o;if(first||now-(G.landLogAt||-1e9)<4000)return;G.landLogAt=now;
  if(!o)log('You leave settled land for the wilds.');
  else log(o==='player'?'You enter your own lands ('+t.name+').':'You cross into the lands of the '+FACS[o].n+' ('+t.name+')'+(hostileTo(o)?': hostile ground.':'.'),hostileTo(o)?'bad':'');
}

/* drawing: a faint tint over each realm, a strong line where realms meet, a faint one between holdings of one realm */
function drawLand(cam){
  landFresh();const x0=Math.max(0,Math.floor(cam.x/TILE)),y0=Math.max(0,Math.floor(cam.y/TILE)),x1=Math.min(MW-1,x0+Math.ceil(VW/TILE)+1),y1=Math.min(MH-1,y0+Math.ceil(VH/TILE)+1);
  const at=(x,y)=>x<0||y<0||x>=MW||y>=MH?-1:LAND[y*MW+x];
  ctx.save();
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const i=LAND[y*MW+x];if(i<0)continue;const o=TOWNS[i].owner,col=landCol(o),sx=x*TILE-cam.x,sy=y*TILE-cam.y;
    ctx.fillStyle=col;ctx.globalAlpha=.08;ctx.fillRect(sx,sy,TILE,TILE);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=at(x+dx,y+dy);if(n===i||n<0&&tAt(x+dx,y+dy)===T_WATER)continue;const realm=n<0||TOWNS[n].owner!==o,w=realm?2:1;
      ctx.globalAlpha=realm?.7:.22;ctx.fillRect(dx>0?sx+TILE-w:sx,dy>0?sy+TILE-w:sy,dx?w:TILE,dy?w:TILE)}
  }
  ctx.restore();
}
// the minimap tint, one pixel per tile
function landMiniCv(){
  landFresh();if(landMini)return landMini;
  landMini=mkc(MW,MH,g=>{for(let k=0;k<LAND.length;k++){const i=LAND[k];if(i<0)continue;rect(g,landCol(TOWNS[i].owner),k%MW,Math.floor(k/MW),1,1)}});return landMini;
}
