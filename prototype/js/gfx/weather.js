'use strict';
/* ---------- the weather drawn (its kinds' art: data/weather.js WEATHER.kinds[k].art; the weather itself: world/weather.js) ----------
   Over the view (vw x vh px, in its own pixels): the sky's shade (dim), a haze over all with its drifting bands (veil: fog, a
   blizzard, a sandstorm), the falling rain, snow or blown sand (fall: streaks, or flakes that sway) and a storm's lightning (flash).
   The particles are a fixed set, none kept: each one's place from its number (hash, map.js) and the clock, so nothing is made a
   frame. Eased from one weather to the next over WEATHER.ease s, the old fading out as the new fades in (layers: each kind drawn
   with its share), and the new as strong as its front has built (s: world/weather.js strength). With reducedMotion: a share of the
   particles (calm), slower (slow), no lightning. On the map over the land and the clouds, under the fog of war (render.js
   drawWorld); in a battle over the field, under its fog (drawBattle: the field's weather, B.env.w, as the battle began). */
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
  // the weather w over a view vw x vh px, s: how far its front has built (0..1)
  draw(w,vw,vh,s=1){
    if(!WEATHER.on||!w)return;
    const now=this.step(w),rm=reducedMotion(),t=rm?now*WEATHER.slow:now;
    ctx.save();
    try{
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
    const n=Math.round(F.n*a),m=(v,q)=>((v%q)+q)%q,sp=Math.hypot(F.vx,F.vy)||1;
    if(!n)return;
    ctx.globalAlpha=Math.min(1,.35+.5*a);
    ctx.fillStyle=F.col;
    ctx.strokeStyle=F.col;
    ctx.lineWidth=1;
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
    ctx.globalAlpha=.4*f*a;
    ctx.fillStyle='#eef2ff';
    ctx.fillRect(0,0,vw,vh);
  },
};
