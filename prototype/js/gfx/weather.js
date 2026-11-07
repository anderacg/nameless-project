'use strict';
/* ---------- the weather drawn (its kinds' art: data/weather.js WEATHER.kinds[k].art; the weather itself: world/weather.js) ----------
   Over the view (vw x vh px, in its own pixels): the sky's shade (dim), a haze over all with its drifting bands (veil: fog, a
   blizzard, a sandstorm), the falling rain, snow or blown sand (fall: streaks, or flakes that sway) and a storm's lightning (flash).
   The particles are a fixed set, none kept: each one's place from its number (hash, map.js) and the clock, so nothing is made a
   frame. Eased from one weather to the next over WEATHER.ease s (fading the old out, then the new in). With reducedMotion: a share
   of the particles (calm), slower (slow), no lightning. On the map over the land, the fog and the clouds (render.js drawWorld); in
   a battle over the field, under its HUD (drawBattle: the field's weather, B.env.w, as the battle began). */
const WeatherArt={
  k:'clear',
  a:0,
  last:0,
  // (the weather drawn now eased toward w; the clock in s)
  step(w){
    const now=performance.now()/1000,dt=Math.min(.1,Math.max(0,now-(this.last||now)));
    this.last=now;
    if(w!==this.k){
      this.a-=dt/WEATHER.ease;
      if(this.a<=0){this.k=w;this.a=0}
    }else this.a=Math.min(1,this.a+dt/WEATHER.ease);
    return now;
  },
  // the weather w over a view vw x vh px
  draw(w,vw,vh){
    if(!WEATHER.on||!w)return;
    const now=this.step(w),K=WEATHER.kinds[this.k],A=K&&K.art,a=this.a;
    if(!A||a<=0)return;
    const rm=reducedMotion(),t=rm?now*WEATHER.slow:now;
    ctx.save();
    try{
      if(A.dim)this.fill(A.dim,a,vw,vh);
      if(A.veil)this.veil(A,a,t,vw,vh);
      if(A.fall)this.fall(A.fall,a*(rm?WEATHER.calm:1),t,vw,vh);
      if(A.flash&&!rm)this.flash(A.flash,a,now,vw,vh);
    }finally{ctx.restore()}
  },
  fill(c,a,vw,vh){
    ctx.globalAlpha=1;
    ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+(c[3]*a).toFixed(3)+')';
    ctx.fillRect(0,0,vw,vh);
  },
  // (a haze, and its bands drifting across, lighter and darker)
  veil(A,a,t,vw,vh){
    const c=A.veil;
    this.fill(c,a,vw,vh);
    ctx.fillStyle='rgb('+c[0]+','+c[1]+','+c[2]+')';
    for(let i=0;i<(A.bands||0);i++){
      const bh=vh*(.12+.12*hash(i,1,77)),y=(hash(i,2,77)*vh+Math.sin(t*.2+i)*8)|0,x=((hash(i,3,77)*vw*2+t*(10+14*hash(i,4,77)))%(vw*2))-vw;
      ctx.globalAlpha=c[3]*a*.6;
      ctx.fillRect(Math.round(x),y,vw,Math.round(bh));
    }
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
