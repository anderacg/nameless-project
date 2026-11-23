'use strict';
/* Opt-in flat-grassland prototype: baked texture tiles, existing curved ways, small cached sections. No runtime texel painting. */
const TILE_GROUND={tile:16,cell:32,fine:2,variants:8,section:64,cap:48,slice:2,bank:1.6,wet:.6,roadEdge:.65};
class TileGround{
  static enabled=typeof location!=='undefined'&&new URLSearchParams(location.search).has('tileground');
  static atlas=null;
  static loading=null;
  static failed=false;
  static scene=null;
  static frameStamp=null;
  static remaining=0;
  static stats={builds:0,hits:0,ms:0};
  static load(){if(this.loading)return this.loading;this.loading=new Promise(resolve=>{const im=new Image(),script=[...document.scripts].find(s=>/gfx\/tileground\.js/.test(s.src));
    im.onload=()=>{this.atlas=im;resolve(true)};im.onerror=()=>{this.failed=true;resolve(false)};im.src=new URL('../../art/terrain/grassland-tiles.png',script?.src||new URL('js/gfx/tileground.js',location.href)).href});return this.loading}
  static hash(x,y,seed=1){let n=Math.imul(x^seed,374761393)^Math.imul(y+seed,668265263);n=Math.imul(n^(n>>>13),1274126177);return(n^(n>>>16))>>>0}
  static simplify(A){const out=[];for(const run of this.runs(A)){const keep=new Set([0,run.length-1]),stack=[[0,run.length-1]];
      while(stack.length){const [a,b]=stack.pop(),p=run[a],q=run[b],dx=q[0]-p[0],dy=q[1]-p[1],d=dx*dx+dy*dy;let chosen=-1,best=1;
        for(let i=a+1;i<b;i++){const v=run[i],u=d?Math.max(0,Math.min(1,((v[0]-p[0])*dx+(v[1]-p[1])*dy)/d)):0,error=Math.max(Math.hypot(v[0]-p[0]-dx*u,v[1]-p[1]-dy*u)/.25,Math.abs(v[2]-p[2]-(q[2]-p[2])*u)/.15);if(error>best){best=error;chosen=i}}
        if(chosen>=0){keep.add(chosen);stack.push([a,chosen],[chosen,b])}}
      const points=[...keep].sort((a,b)=>a-b).map(i=>run[i]);for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];out.push(a[0],a[1],b[0],b[1],a[2],b[2])}}
    return Float32Array.from(out);
  }
  static runs(A,indices=null){const out=[];let run=null;const ids=indices||Array.from({length:A.length/6},(_,i)=>i*6);
    for(const i of ids){const last=run?.[run.length-1];if(!last||last[0]!==A[i]||last[1]!==A[i+1]||Math.abs(last[2]-A[i+4])>.001){run=[[A[i],A[i+1],A[i+4]]];out.push(run)}run.push([A[i+2],A[i+3],A[i+5]])}return out;
  }
  static makeScene({seed=1,roads=[],rivers=[],kindAt=()=>0,supported=()=>true}){
    roads=this.simplify(roads);rivers=this.simplify(rivers);
    const scene={seed,roads,rivers,kindAt,supported,cache:new Map(),bins:{roads:new Map(),rivers:new Map()},materials:new Map()};
    const size=TILE_GROUND.section;
    for(const [key,A] of [['roads',roads],['rivers',rivers]])for(let i=0;i<A.length;i+=6){const r=Math.max(A[i+4],A[i+5])+TILE_GROUND.bank+10,x0=Math.floor((Math.min(A[i],A[i+2])-r)/size),x1=Math.floor((Math.max(A[i],A[i+2])+r)/size),y0=Math.floor((Math.min(A[i+1],A[i+3])-r)/size),y1=Math.floor((Math.max(A[i+1],A[i+3])+r)/size);
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=x+','+y,bin=scene.bins[key].get(k)||[];bin.push(i);scene.bins[key].set(k,bin)}}
    return scene;
  }
  static material(scene,g,row){let pattern=scene.materials.get(row);if(pattern)return pattern;const T=TILE_GROUND,cv=document.createElement('canvas');cv.width=cv.height=T.cell*2;const q=cv.getContext('2d');
    for(let y=0;y<2;y++)for(let x=0;x<2;x++){const v=this.hash(x,y,scene.seed+row)%T.variants;q.drawImage(this.atlas,v*T.cell,row*T.cell,T.cell,T.cell,x*T.cell,y*T.cell,T.cell,T.cell)}
    pattern=g.createPattern(cv,'repeat');pattern.setTransform(new DOMMatrix().scale(1/T.fine));scene.materials.set(row,pattern);return pattern;
  }
  static path(A,indices,extra=0,ratio=1){const p=new Path2D();for(const run of this.runs(A,indices)){const sides=[[],[]];
      for(let i=0;i<run.length;i++){const at=run[i],a=run[Math.max(0,i-1)],b=run[Math.min(run.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,w=Math.max(.1,at[2]*ratio+extra);sides[0].push([at[0]-dy/d*w,at[1]+dx/d*w]);sides[1].push([at[0]+dy/d*w,at[1]-dx/d*w])}
      const pts=[...sides[0],...sides[1].reverse()];p.moveTo(...pts[0]);for(const at of pts.slice(1))p.lineTo(...at);p.closePath();
      for(const at of [run[0],run[run.length-1]]){const w=Math.max(.1,at[2]*ratio+extra);p.moveTo(at[0]+w,at[1]);p.arc(at[0],at[1],w,0,-Math.PI*2,true);p.closePath()}}
    return p;
  }
  static tufts(scene,g,A,indices,out){const T=TILE_GROUND;for(const i of indices){const dx=A[i+2]-A[i],dy=A[i+3]-A[i+1],d=Math.hypot(dx,dy);if(d<6)continue;const n=Math.ceil(d/12);
      for(let j=0;j<n;j++)for(const side of [-1,1]){const f=(j+.5)/n,w=A[i+4]+(A[i+5]-A[i+4])*f+out,x=A[i]+dx*f-dy/d*w*side,y=A[i+1]+dy*f+dx/d*w*side,v=this.hash(Math.round(x),Math.round(y),scene.seed)%T.variants;
        g.drawImage(this.atlas,v*T.cell,6*T.cell,T.cell,T.cell,x-8,y-12,16,16)}}}
  static section(scene,cx,cy){const T=TILE_GROUND,key=cx+','+cy,cached=scene.cache.get(key);if(cached){scene.cache.delete(key);scene.cache.set(key,cached);this.stats.hits++;return cached}
    if(!this.atlas)return null;const start=performance.now(),X=cx*T.section,Y=cy*T.section,cv=document.createElement('canvas');cv.width=cv.height=T.section*T.fine;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
    for(let y=0;y<T.section;y+=T.tile)for(let x=0;x<T.section;x+=T.tile){const tx=Math.floor((X+x)/T.tile),ty=Math.floor((Y+y)/T.tile),row=scene.kindAt(tx,ty),v=this.hash(tx,ty,scene.seed)%T.variants;
      g.drawImage(this.atlas,v*T.cell,row*T.cell,T.cell,T.cell,x*T.fine,y*T.fine,T.cell,T.cell)}
    g.save();g.setTransform(T.fine,0,0,T.fine,-X*T.fine,-Y*T.fine);
    const road=scene.bins.roads.get(key)||[],river=scene.bins.rivers.get(key)||[],fill=(A,idx,row,extra=0,ratio=1)=>{if(!idx.length)return;g.fillStyle=this.material(scene,g,row);g.fill(this.path(A,idx,extra,ratio))};
    fill(scene.roads,road,2,T.roadEdge);fill(scene.roads,road,1);
    // Rivers cut through roads; the game's separate bridge objects remain above this ground.
    fill(scene.rivers,river,2,T.bank);fill(scene.rivers,river,3,T.wet);fill(scene.rivers,river,4);fill(scene.rivers,river,5,-.45,.72);
    this.tufts(scene,g,scene.roads,road,.8);this.tufts(scene,g,scene.rivers,river,T.bank+.8);
    g.restore();scene.cache.set(key,cv);while(scene.cache.size>T.cap)scene.cache.delete(scene.cache.keys().next().value);
    this.stats.builds++;this.stats.ms+=performance.now()-start;return cv;
  }
  static draw(g,scene,x,y,w,h,dx=0,dy=0,ms=Infinity){if(!this.atlas||!scene.supported(x,y,w,h))return false;const T=TILE_GROUND,start=performance.now();let painted=false;
    g.save();g.imageSmoothingEnabled=false;
    for(let cy=Math.floor(y/T.section);cy<=Math.floor((y+h-1)/T.section);cy++)for(let cx=Math.floor(x/T.section);cx<=Math.floor((x+w-1)/T.section);cx++){
      const key=cx+','+cy;if(!scene.cache.has(key)&&performance.now()-start>=ms)continue;
      const X=cx*T.section,Y=cy*T.section,sx=Math.max(X,x),sy=Math.max(Y,y),sw=Math.min(X+T.section,x+w)-sx,sh=Math.min(Y+T.section,y+h)-sy,cv=this.section(scene,cx,cy);
      g.drawImage(cv,(sx-X)*T.fine,(sy-Y)*T.fine,sw*T.fine,sh*T.fine,dx+sx-x,dy+sy-y,sw,sh);painted=true}g.restore();return painted;
  }
  static gameScene(){const P=WorldArt.ensure();if(this.scene?.plan===P)return this.scene;const ways=waysOf(P),scene=this.makeScene({seed:WM.seedNum||1,roads:ways.RA,rivers:ways.SA,
      supported:(x,y,w,h)=>{let level=null;for(let ty=Math.floor(y/TILE);ty<=Math.floor((y+h-1)/TILE);ty++)for(let tx=Math.floor(x/TILE);tx<=Math.floor((x+w-1)/TILE);tx++){
        const i=ty*MW+tx,k=tAt(tx,ty);if(climAt(tx*TILE,ty*TILE)!=='grass'||![T_OPEN,T_ROAD,T_FORD,T_WATER].includes(k)||k===T_WATER&&!(WM.river[i]&3)||occAt(tx,ty)>0||WM.edge[i])return false;
        const z=WM.lv?.[i]||0;if(level==null)level=z;else if(Math.abs(z-level)>.1)return false}return true}});scene.plan=P;this.scene=scene;return scene;
  }
  static fallback(g,x,y,w,h,cam){if(!this.enabled||this.failed)return false;if(!this.atlas){this.load();return false}const scene=this.gameScene();if(!scene.supported(x,y,w,h))return false;
    const frame=typeof FrameBudget==='undefined'?null:FrameBudget,stamp=frame?.deadline??Infinity;if(this.frameStamp!==stamp||!Number.isFinite(stamp)){this.frameStamp=stamp;this.remaining=TILE_GROUND.slice}
    const lift=typeof WorldGround==='undefined'?0:WorldGround.height(x+w/2,y+h/2),start=performance.now(),result=this.draw(g,scene,x,y+lift,w,h,x-cam.x,y-cam.y,Math.max(0,Math.min(this.remaining,frame?frame.left():Infinity)));this.remaining-=performance.now()-start;return result}
  static reset(){this.scene=null;this.frameStamp=null;this.remaining=0;this.stats={builds:0,hits:0,ms:0}}
}
if(typeof onWorld==='function')onWorld(()=>TileGround.reset());
