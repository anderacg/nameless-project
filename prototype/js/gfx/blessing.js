'use strict';
/* ---------- a shrine's blessing on the map (the owner, 2026-11-13: "When praying at the shrine, make a cool animations flow into the
   units"; world/sites.js Shrine act): a pillar of light rises from the altar, then motes of it stream out in arcs, a few to each of
   your men where he stands (his march figure, followed as he walks: world/march.js MarchArmy units; else your band's own figure),
   and each lights where they reach him, a ring at his feet and sparks rising. Drawn over everyone, under the fog (render.js
   drawWorld); its own hash, never the game's dice; for one who prefers less motion: no motes, each man lit a moment ---------- */
const BLESS_FX={on:true,pillar:[.7,34,5],motes:3,most:24,lead:.35,each:.06,gap:.14,fly:.95,arc:[26,.18],glow:.7,sparks:5,
  col:{core:'#f6ffff',glow:'#7fd8e8',deep:'#3a9fd0',spark:'#d6f6ff'}};
class BlessFx{
  static list=[];
  // (a blessing from the shrine s on your band now)
  static start(s){if(!BLESS_FX.on||!s)return;this.list.push({x:s.x,y:s.y,t0:performance.now()})}
  static hash(i,k){const v=Math.sin(i*127.1+k*311.7)*43758.5453;return v-Math.floor(v)}
  // (who it flows into: your men as they march, else your band's figure)
  static men(){const a=typeof marchLive==='function'&&marchLive(P);const u=a?a.units.filter(u=>!u.dead):[];return u.length?u.slice(0,BLESS_FX.most):[{x:P.x,y:P.y}]}
  // (how long it lasts with n men)
  static span(n){const X=BLESS_FX;return X.lead+(n-1)*X.each+(X.motes-1)*X.gap+X.fly+X.glow}
  static draw(cam){const L=this.list;if(!L.length)return;const now=performance.now(),X=BLESS_FX,C=X.col,rm=reducedMotion(),men=this.men();
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.imageSmoothingEnabled=false;
    const px=(c,x,y,a,w=1,h=1)=>{if(a<=0)return;ctx.globalAlpha=Math.min(1,a);ctx.fillStyle=c;ctx.fillRect(Math.round(x-cam.x),Math.round(y-cam.y),w,h)};
    const halo=(x,y,r,c,a)=>{if(a<=0)return;const X0=x-cam.x,Y0=y-cam.y,g=ctx.createRadialGradient(X0,Y0,0,X0,Y0,r);g.addColorStop(0,c);g.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=Math.min(1,a);ctx.fillStyle=g;ctx.fillRect(X0-r,Y0-r,2*r,2*r)};
    for(const e of L){const t=(now-e.t0)/1000,sx=e.x,sy=e.y-6;
      // (the pillar: light rising from the altar, a ring spreading at its foot)
      const [pd,ph,pw]=X.pillar,pk=t/pd;if(pk<1.6){const a=pk<1?pk:Math.max(0,1-(pk-1)/.6),hh=Math.round(ph*Math.min(1,pk*1.4));
        for(let k=0;k<hh;k++){const f=1-k/ph;px(C.glow,sx-(pw>>1),sy-k,a*.45*f,pw,1);px(C.core,sx-1,sy-k,a*.8*f,2,1)}
        halo(sx,sy-hh*.5,10+hh*.4,C.glow,a*.5);const rr=4+pk*14;ctx.globalAlpha=Math.max(0,.6*(1-pk/1.6));ctx.strokeStyle=C.glow;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(sx-cam.x,e.y-cam.y,rr,rr*.4,0,0,6.283);ctx.stroke()}
      men.forEach((u,i)=>{const tx=u.x,ty=u.y-5,first=X.lead+i*X.each,arrive=first+X.fly;
        // (its motes: up out of the pillar, over in an arc, down into him, a short trail behind each)
        if(!rm)for(let k=0;k<X.motes;k++){const s0=first+k*X.gap,q=(t-s0)/X.fly;if(q<0||q>1)continue;
          const d=Math.hypot(tx-sx,ty-sy),cx=(sx+tx)/2+(this.hash(i,k)-.5)*12,cy=Math.min(sy,ty)-X.arc[0]-d*X.arc[1];
          for(let j=0;j<4;j++){const v=Math.max(0,q-j*.035),w=1-v,x=w*w*(sx)+2*w*v*cx+v*v*tx,y=w*w*(sy-ph*.8)+2*w*v*cy+v*v*ty;
            if(!j){halo(x,y,4,C.glow,.55);px(C.core,x,y,1,2,2)}else px(j<2?C.spark:C.deep,x,y,.7-j*.18)}}
        // (where they reach him: a ring at his feet, his figure lit, sparks rising off him)
        const g=(t-(rm?X.lead:arrive))/X.glow;if(g<0||g>1)return;const a=1-g;
        halo(tx,ty,9,C.glow,a*.55);ctx.globalAlpha=a*.8;ctx.strokeStyle=C.spark;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(tx-cam.x,u.y-cam.y,3+g*6,(3+g*6)*.4,0,0,6.283);ctx.stroke();
        if(!rm)for(let k=0;k<X.sparks;k++){const h=this.hash(i,k+9),y=ty-g*(8+h*8),x=tx+(h-.5)*8+Math.sin(g*6+k)*1.5;px(k%2?C.spark:C.core,x,y,a)}});
      e.done=t>this.span(men.length)+.2}
    ctx.restore();this.list=L.filter(e=>!e.done)}
}
