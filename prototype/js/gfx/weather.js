'use strict';
/* ---------- the weather drawn (its kinds' art: data/weather.js WEATHER.kinds[k].art; the weather itself: world/weather.js) ----------
   Over the view (vw x vh px, in its own pixels): the sky's shade (dim), a haze over all with its drifting bands (veil: fog, a
   blizzard, a sandstorm), the falling rain, snow or blown sand (fall: streaks, or flakes that sway) and a storm's lightning (flash).
   The particles are a fixed set, none kept: each one's place from its number (hash, map.js) and the clock, so nothing is made a
   frame. Eased from one weather to the next over WEATHER.ease s, the old fading out as the new fades in (layers: each kind drawn
   with its share), and the new as strong as its front has built (s: world/weather.js strength). With reducedMotion: a share of the
   particles (calm), slower (slow), no lightning. On the map, world() samples geographic fronts, under the fog and GUI. World battles use the same sky;
   separate battlefields retain the weather they opened in. Both draw particles in CSS pixels, regardless of zoom. */
const WeatherArt={
  layers:[],
  last:0,
  // (the weather drawn now eased toward w: w's layer rising, the others falling away; the clock in s)
  step(w){
    const now=performance.now()/1000,dt=Math.min(.1,Math.max(0,now-(this.last||now))),L=this.layers,e=dt/WEATHER.ease;
    this.last=now;
    if(!L.some(l=>l.k===w))L.push({k:w,a:0});
    for(const l of L)l.a=l.k===w?Math.min(1,l.a+e):l.a-e;
    this.layers=L.filter(l=>l.a>0||l.k===w);
    return now;
  },
  // Draw on the main canvas in CSS pixels, independent of map zoom and device density.
  // The camera selects the weather; the player's location never selects a full-screen effect.
  drawMap(){
    if(!WEATHER.on)return;
    const d=dprOf(),scale=VS/d,vw=ctx.canvas.width/d,vh=ctx.canvas.height/d;
    ctx.save();
    try{
      ctx.setTransform(d,0,0,d,0,0);
      this.world(G.cam,scale,vw,vh,performance.now()/1000,(x,y)=>CHEAT.noFog?1:inSight(x,y)?1:seenAt(x,y) ? .2 : 0);
    }finally{ctx.restore()}
  },
  // A small, smoothly enlarged air field keeps regional shading continuous without full-screen pixel work.
  air:null,
  world(cam,scale,vw,vh,now,visible=()=>1){
    if(!WEATHER.on||scale<=0||vw<=0||vh<=0)return;
    const V=WEATHER.visual,rm=reducedMotion(),t=now*(rm?WEATHER.slow:1),w=Math.ceil(vw/V.haze)+1,h=Math.ceil(vh/V.haze)+1,mixBuffer=new Float64Array(WEATHER_KINDS.length);
    if(!this.air)this.air=mkc(w,h,()=>{});
    const air=this.air;if(air.width!==w)air.width=w;if(air.height!==h)air.height=h;
    const g=air.getContext('2d'),im=g.createImageData(w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const wx=cam.x+x/(w-1)*vw/scale,wy=cam.y+y/(h-1)*vh/scale,mix=Weather.sample(wx,wy,mixBuffer),o=(y*w+x)*4;let alpha=0,r=0,green=0,b=0;
      for(let k=0;k<mix.length;k++){
        const A=WEATHER.kinds[WEATHER_KINDS[k]].art;if(!A||!mix[k])continue;
        const c=A.veil||A.dim;if(!c)continue;
        const a=c[3]*mix[k]*(A.veil ? .85+.15*Math.sin(wx*.012+wy*.009+t*.12):1);
        r+=c[0]*a;green+=c[1]*a;b+=c[2]*a;alpha+=a;
      }
      if(alpha){im.data[o]=r/alpha;im.data[o+1]=green/alpha;im.data[o+2]=b/alpha;im.data[o+3]=Math.round(255*alpha*visible(wx,wy))}
    }
    g.putImageData(im,0,0);
    ctx.save();
    try{
      ctx.globalAlpha=1;ctx.imageSmoothingEnabled=true;
      // Sample centres map exactly to world positions, including the edge samples.
      const dx=vw/(w-1),dy=vh/(h-1);ctx.drawImage(air,-dx/2,-dy/2,vw+dx,vh+dy);
      const spacing=Math.max(V.spacing,Math.sqrt(vw*vh/V.max)/scale),wind=1+.18*Math.sin(t*.19);
      for(let k=0;k<WEATHER_KINDS.length;k++){
        const A=WEATHER.kinds[WEATHER_KINDS[k]].art,F=A&&A.fall;if(!F)continue;
        // Each kind drifts at its own speed in world space; zoom only changes projection, never drop size.
        const ox=t*F.vx*.25,oy=t*F.vy*.25,left=Math.floor((cam.x-ox)/spacing)-1,top=Math.floor((cam.y-oy)/spacing)-1,nx=Math.ceil(vw/scale/spacing)+3,ny=Math.ceil(vh/scale/spacing)+3;
        for(let y=top;y<top+ny;y++)for(let x=left;x<left+nx;x++){
          const wx=(x+hash(x,y,301+k))*spacing+ox,wy=(y+hash(x,y,321+k))*spacing+oy,sx=(wx-cam.x)*scale,sy=(wy-cam.y)*scale;
          if(sx<0||sy<0||sx>vw||sy>vh)continue;
          const mix=Weather.sample(wx,wy,mixBuffer),density=mix[k]*F.n*spacing*spacing*scale*scale/V.area*(rm?WEATHER.calm:1);
          if(hash(x,y,341+k)>=density)continue;
          const seen=visible(wx,wy);if(!seen)continue;
          const strength=.65+.35*Math.sin(wx*.008+wy*.005+now*.08)**2;
          ctx.globalAlpha=V.alpha*strength*seen;ctx.strokeStyle=F.col;ctx.fillStyle=F.col;ctx.lineWidth=V.width;
          if(F.len){const sp=Math.hypot(F.vx*wind,F.vy)||1,dx=F.vx*wind/sp*F.len,dy=F.vy/sp*F.len;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx-dx,sy-dy);ctx.stroke()}
          else {const sway=Math.sin(t*1.3+x+y)*(F.sway||0);ctx.fillRect(sx+sway,sy,1.2,1.2)}
        }
      }
      const storm=Weather.sample(cam.x+vw/scale/2,cam.y+vh/scale/2)[WEATHER_KINDS.indexOf('storm')];
      if(storm&&!rm)this.flash(WEATHER.kinds.storm.art.flash,storm*visible(cam.x+vw/scale/2,cam.y+vh/scale/2),now,vw,vh);
    }finally{ctx.restore()}
  },
  // the weather w over a view vw x vh px, s: how far its front has built (0..1)
  draw(w,vw,vh,s=1){
    if(!WEATHER.on||!w)return;
    const now=this.step(w),rm=reducedMotion(),t=rm?now*WEATHER.slow:now,m=ctx.getTransform(),z=Math.hypot(m.a,m.b)/dprOf();
    ctx.save();
    try{
      if(z>0){ctx.scale(1/z,1/z);vw*=z;vh*=z}
      for(const l of this.layers){
        const K=WEATHER.kinds[l.k],A=K&&K.art,sm=x=>x*x*(3-2*x),a=sm(Math.max(0,Math.min(1,l.a)))*(l.k===w?s:1);
        if(!A||a<=0)continue;
        if(A.dim)this.fill(A.dim,a,vw,vh);
        if(A.veil)this.veil(A,a,t,vw,vh);
        if(A.fall)this.fall(A.fall,a*(rm?WEATHER.calm:1),t,vw,vh);
        if(A.flash&&!rm)this.flash(A.flash,a,now,vw,vh);
      }
    }finally{ctx.restore()}
  },
  fill(c,a,vw,vh){
    ctx.globalAlpha=1;
    ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+(c[3]*a).toFixed(3)+')';
    ctx.fillRect(0,0,vw,vh);
  },
  // (a haze, and its bands drifting across, lighter and darker: each a soft cloud (band), drawn up smooth, so no edge shows (the
  // owner, 2026-11-08: "soft edge"); twice its band's height, thickest along its middle)
  veil(A,a,t,vw,vh){
    const c=A.veil,sb=this.band(c);
    this.fill(c,a,vw,vh);
    ctx.imageSmoothingEnabled=true;
    for(let i=0;i<(A.bands||0);i++){
      const bh=vh*(.12+.12*hash(i,1,77)),y=hash(i,2,77)*vh+Math.sin(t*.2+i)*8,x=((hash(i,3,77)*vw*2+t*(10+14*hash(i,4,77)))%(vw*2))-vw;
      ctx.globalAlpha=c[3]*a*.6;
      ctx.drawImage(sb,x-vw*.1,y-bh*.5,vw*1.2,bh*2);
    }
  },
  // (a band's soft cloud in colour c, made once: faded toward its ends and its top and bottom)
  bands:{},
  band(c){
    const k=c.slice(0,3).join();if(this.bands[k])return this.bands[k];
    const W=WEATHER.band[0],H=WEATHER.band[1],sm=f=>f<=0?0:f>=1?1:f*f*(3-2*f);
    return this.bands[k]=mkc(W,H,g=>{const d=g.createImageData(W,H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const o=(y*W+x)*4,u=(x+.5)/W,v=(y+.5)/H;
      d.data[o]=c[0];d.data[o+1]=c[1];d.data[o+2]=c[2];d.data[o+3]=Math.round(255*sm(Math.min(u,1-u)/.3)*Math.pow(Math.sin(Math.PI*v),1.5))}g.putImageData(d,0,0)});
  },
  // (rain, snow or sand: n particles at full strength; streaks of len px along their way, or flakes that sway)
  fall(F,a,t,vw,vh){
    const n=Math.round(F.n*a*Math.max(.3,Math.min(4,vw*vh/WEATHER.visual.area))),m=(v,q)=>((v%q)+q)%q,sp=Math.hypot(F.vx,F.vy)||1;
    if(!n)return;
    ctx.globalAlpha=WEATHER.visual.alpha;
    ctx.fillStyle=F.col;
    ctx.strokeStyle=F.col;
    ctx.lineWidth=WEATHER.visual.width;
    if(F.len)ctx.beginPath();
    for(let i=0;i<n;i++){
      const r=.7+.6*hash(i,5,91),x=m(hash(i,1,91)*vw+t*F.vx*r,vw),y=m(hash(i,2,91)*vh+t*F.vy*r,vh);
      if(F.len){
        const dx=F.vx/sp*F.len,dy=F.vy/sp*F.len;
        ctx.moveTo(Math.round(x)+.5,Math.round(y)+.5);
        ctx.lineTo(Math.round(x-dx)+.5,Math.round(y-dy)+.5);
      }else ctx.fillRect(Math.round(x+(F.sway||0)*Math.sin(t*1.3+i)),Math.round(y),hash(i,3,91)<.25?2:1,1);
    }
    if(F.len)ctx.stroke();
  },
  // (lightning: a white flash now and then, a second flicker after it)
  flash(L,a,now,vw,vh){
    const ph=(now/L.every)%1*L.every;
    if(hash(Math.floor(now/L.every),9,93)<.35)return;// (some spells pass without one)
    const f=ph<L.len?1-ph/L.len:ph>L.len*1.6&&ph<L.len*2.2?.5:0;
    if(f<=0)return;
    ctx.globalAlpha=.09*f*a;
    ctx.fillStyle='#eef2ff';
    ctx.fillRect(0,0,vw,vh);
  },
};
