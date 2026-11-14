'use strict';
/* ---------- a camp's tents (the owner, 2026-11-14: "the tent should not on the road when auto camp", "making the camp require some
   animations for preparations", "making the camp will require larger area and more tents based on army size") ----------
   A camp of n men pitches a tent for every CAMP_SITE.men of them (one at least, most at most) round its fire, ring after ring
   (ring px out, squash of it down the screen, the tents space px apart round it), each where the ground lets it stand (tentOk: no
   road or track, nor within road of its band as drawn (roadband.js), water (a wood's clearing will do: no tree on it),
   peak or ford under it, no lot or field, nothing the map's art keeps clear (worldart.js plan.clear: the roads' bands, the gates),
   nothing standing on it, none in a holding's heart). By a holding it looks for its ground nearest the gate (spotNear: where need
   of its tents stand, and you can walk to it). Pitched (CampSite.pitch(key)): the banner first, then a tent every gap s, its two
   poles raised over pole s, its cloth hauled up over rise s; the fire lit when the last stands, smoke before it. Its men stand by
   while it goes up (yours: render.js drawWorld, pitching). Drawn only, on the real clock: a camp whose pitching was not seen (one
   loaded, one come upon) stands pitched; one not drawn for forget s is struck ---------- */
const CAMP_SITE={men:8,most:14,ring:24,squash:.62,space:21,road:.25,gap:.4,pole:.3,rise:.55,fire:.5,forget:3,spot:{r:30,step:8,near:24,need:.7}};
class CampSite{
  static t0=new Map();static seen=new Map();static lay=new Map();static spots=new Map();
  // (its pitching begins now, unless it has begun)
  static pitch(key){if(!this.t0.has(key))this.t0.set(key,performance.now()/1000)}
  static strike(key){this.t0.delete(key);this.lay.delete(key);this.spots.delete(key);this.seen.delete(key)}
  static tents(n){return clamp(Math.ceil((n||1)/CAMP_SITE.men),1,CAMP_SITE.most)}
  // (its pitching's length, s; whether it goes up still)
  static span(k){const X=CAMP_SITE;return (k-1)*X.gap+X.pole+X.rise+X.fire}
  static pitching(key,n){const t=this.t0.get(key);return t!=null&&performance.now()/1000-t<this.span(this.tents(n))}
  // ground a tent may stand on, its feet at (x, y)
  static tentOk(x,y){const x0=x-7,x1=x+7,y0=y-12,y1=y+1,tx0=Math.floor(x0/TILE),tx1=Math.floor(x1/TILE),ty0=Math.floor(y0/TILE),ty1=Math.floor(y1/TILE);
    for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){const k=tAt(tx,ty);if(k===T_WATER||k===T_MOUNT||k===T_FORD||k===T_ROAD||occAt(tx,ty))return false}// (a wood's clearing will do: its trees are what stands, below)
    for(const t of TOWNS){if(Math.abs(t.x-x)>240||Math.abs(t.y-y)>240)continue;const b=centreBox(t);if(tx1>=b.x&&tx0<b.x+b.n&&ty1>=b.y&&ty0<b.y+b.n)return false}
    if(campKeptClear(x0,y0,x1,y1))return false;
    // (nor on a road's or a track's band as drawn, an estate's tracks too: roadband.js RoadBand, its nearness a byte)
    if(typeof RoadBand!=='undefined')for(const [dx,dy] of [[0,0],[-7,0],[7,0],[0,-8],[-5,-5],[5,-5]])if((RoadBand.at(x+dx,y+dy)&63)>=CAMP_SITE.road*63)return false;
    return !WorldArt.standing(x0,y0,x1,y1).some(e=>e.box[0]<=x1&&e.box[2]>=x0&&e.box[1]<=y1&&e.box[3]>=y0)}
  // (where its k tents stand round a fire at (x, y): ring after ring, the nearest first)
  static place(x,y,k){const X=CAMP_SITE,p=[];
    for(let r=1;p.length<k&&r<=5;r++){const m=Math.max(1,Math.round(2*Math.PI*r*X.ring/X.space));
      for(let j=0;j<m&&p.length<k;j++){const a=(j+(r%2)*.5)/m*2*Math.PI,px=Math.round(x+Math.cos(a)*r*X.ring),py=Math.round(y+Math.sin(a)*r*X.ring*X.squash);if(this.tentOk(px,py))p.push({x:px,y:py,s:Math.abs(j*7+r*13+Math.round(x))%9})}}
    return p}
  static layout(key,x,y,n){const k=this.tents(n),L=this.lay.get(key);if(L&&L.x===x&&L.y===y&&L.k===k)return L.p;const p=this.place(x,y,k);this.lay.set(key,{x,y,k,p});return p}
  // (its ground by a holding: the spot nearest its gate where need of its tents stand and you can walk to it; null: none)
  static spotNear(t,n,key){if(key&&this.spots.has(key))return this.spots.get(key);const X=CAMP_SITE.spot,k=this.tents(n),g=gateGoal(t),c=[];
    for(let j=-X.r;j<=X.r;j++)for(let i=-X.r;i<=X.r;i++){const x=Math.round(g.x+i*X.step),y=Math.round(g.y+j*X.step),d=Math.hypot(x-g.x,y-g.y);if(d>=X.near&&d<=X.r*X.step)c.push([d,x,y])}
    // (the nearest where need of its tents stand; else the nearest where any does)
    c.sort((a,b)=>a[0]-b[0]);let s=null,any=null;for(const [,x,y] of c){if(!this.tentOk(x,y+4)||!Router.reach(g,{x,y}))continue;const m=this.place(x,y,k).length;if(m>=Math.ceil(k*X.need)){s={x,y};break}if(m&&!any)any={x,y}}s=s||any;
    if(key)this.spots.set(key,s);return s}
  // (a tent's picture: the engine's, of the ground's climate)
  static pic(s,clim){const k='ctent'+s+clim;if(spr[k])return spr[k];const m=PX.buildingModel({type:'tent',seed:s+1,env:clim,snow:clim==='frost'?1:0});return spr[k]=siteCanvas(m,m.cell/2,m.cell)}
  /* a camp on the map: c {key, x, y (its fire), n (its men), banner (its banner's look, or none), seed}. Each tent by its feet among
     everyone, going up in its turn; the fire and the banner's pole at its middle */
  static draw(ents,cam,c){const X=CAMP_SITE,now=performance.now()/1000,t0=this.t0.get(c.key),T=t0==null?1e9:now-t0,L=this.layout(c.key,c.x,c.y,c.n),clim=CLIMS[climate[Math.floor(c.y/TILE)*MW+Math.floor(c.x/TILE)]]||'grass';this.seen.set(c.key,now);
    L.forEach((q,i)=>{const p=T-i*X.gap;if(p<=0)return;const pic=this.pic(q.s,clim);ents.push({y:q.y,nf:1,f:()=>this.tent(pic,q,p,cam)})});
    const lit=(L.length-1)*X.gap+X.pole+X.rise;
    ents.push({y:c.y+1,nf:1,f:()=>{const fx=Math.round(c.x-cam.x),fy=Math.round(c.y-cam.y);
      if(T>=lit+X.fire)drawFire(fx,fy,c.seed||0);else if(T>=lit){const a=(T-lit)/X.fire;ctx.save();ctx.globalAlpha=.5*a;ctx.fillStyle='#bdb6a8';for(let k=0;k<3;k++)ctx.fillRect(fx-1+k,fy-2-Math.round(a*6)-k*2,1,1);ctx.restore()}
      ctx.fillStyle='#4a3a28';ctx.fillRect(fx-3,fy,7,1);
      // (its banner on a pole beside its first tent, on its clear ground; none yet: beside the fire)
      const b=L[0]?{x:L[0].x+9,y:L[0].y}:{x:c.x+10,y:c.y};if(c.banner)BANNERQ.push({o:{x:b.x,y:b.y,faction:c.faction||'player',banner:c.banner,headY:()=>Math.round(b.y-14)+BANNER_GAP}})}})}
  // (one tent: its poles going up, then its cloth hauled up them, then standing, its shadow under it)
  static tent(pic,q,p,cam){const X=CAMP_SITE,x=Math.round(q.x-cam.x-pic.ax),y=Math.round(q.y-cam.y-pic.ay+1),W=pic.width,H=pic.height;
    if(p<X.pole){const h=Math.round(11*p/X.pole);ctx.fillStyle='#5a4028';ctx.fillRect(x+3,y+H-1-h,1,h);ctx.fillRect(x+W-4,y+H-1-h,1,h);return}
    const u=Math.min(1,(p-X.pole)/X.rise),h=Math.max(1,Math.round(H*u));
    if(u>=1&&pic.sh){ctx.globalAlpha=SHADOW.a;ctx.drawImage(pic.sh,x,y);ctx.globalAlpha=1}
    ctx.drawImage(pic,0,0,W,H,x,y+H-h,W,h);if(u<1){ctx.fillStyle='#5a4028';ctx.fillRect(x+3,y+H-12,1,11);ctx.fillRect(x+W-4,y+H-12,1,11)}}
  // (camps not drawn a while are struck: their pitching, ground and layout forgotten)
  static purge(){const now=performance.now()/1000;for(const [k,t] of this.seen)if(now-t>CAMP_SITE.forget)this.strike(k)}
}
onWorld(()=>{CampSite.t0.clear();CampSite.seen.clear();CampSite.lay.clear();CampSite.spots.clear()});
