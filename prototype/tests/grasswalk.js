'use strict';
// Grass under feet, and nothing drawn beyond your sight (the owner, 2026-11-17: "Make grass more realistic when player walk by", "Don't
// draw anything beyond visibility"; gfx/worldterrain.js grassFeet, GRASS_FEET; world/fog.js VIEW_SEEN): every man drawn bends the
// grass he walks by, away from him, the more the nearer, and presses it down under his feet; left, it sways back past upright on its
// spring and settles, and rises again slowly; a man standing bends it less, a rider wider. The view's cells: in your sight, land you
// remember, land you never saw; a chunk of the land none of which you know not drawn; out of your sight the grass still, on land you
// never saw no grass and no nature at all.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,GR=t.WORLD_FLORA.grass,WA=t.WorldArt;
 Kit.begin('soldier',1);Kit.clear(['critters']);Kit.world();
 const f=Kit.field(t.townBy('Ashford')||t.TOWNS[0]);Kit.goTo(f[0],f[1]);G.mode='world';G.modal=false;
 const r=t.sceneRes(),cam=()=>({x:Math.floor(G.cam.x),y:Math.floor(G.cam.y)}),fine=()=>{const c=WA.chunks.get(Math.floor(P.y/t.CHUNK)*WA.cols+Math.floor(P.x/t.CHUNK));return c&&c.grass&&c.fr===r?c:null};
 for(let i=0;i<300&&!fine();i++){t.drawWorld();WA.step(60)}
 const C=fine();
 if(r<=1||!C){info('no fine chunk under you (scene '+r+'): grass not checked');}else{
  // ---- a clump by you, in your sight, away from your own men (their feet bend the grass too)
  t.drawWorld();const A=t.MARCH_ARMIES.get(P),men=A?A.units.map(u=>[u.x,u.y]):[[P.x,P.y]],Gr=C.grass,far=GR.push*GR.feet[1]/r+6;
  let k=-1;for(let i=0;i<Gr.n&&k<0;i++){const x=Gr.X[i]/r,y=Gr.Y[i]/r,d=Math.hypot(x-P.x,y-P.y);if(d>40&&d<90&&t.viewState(x,y)===2&&men.every(([a,b])=>Math.hypot(a-x,b-y)>far))k=i}
  if(k<0)info('no clump in your sight away from your men');else{
   const gx=Gr.X[k]/r,gy=Gr.Y[k]/r,foot=(dx,go=true,big=false)=>{const x=gx+dx;t.grassFoot(x,gy+t.liftAt(x,gy),go,big)};
   Gr.P[k]=0;Gr.W[k]=0;Gr.F[k]=0;t.GRASS_FEET.now.length=0;
   // (a foot just west of it: it leans east, away, and is pressed down under the foot)
   foot(-1.5);t.drawWorld();const p1=Gr.P[k],f1=Gr.F[k],c1=Gr.C[k];
   ok(p1>0&&f1>0&&c1>0,'a foot by a clump bends it away from him ('+p1.toFixed(2)+' px east of a foot west of it) and presses it down ('+(f1*100).toFixed(0)+'% of its height, '+c1+' px of its tips not drawn)');
   Gr.P[k]=0;Gr.W[k]=0;Gr.F[k]=0;foot(1.5);t.drawWorld();ok(Gr.P[k]<0,'a foot east of it: it leans west ('+Gr.P[k].toFixed(2)+')');
   Gr.P[k]=0;Gr.W[k]=0;Gr.F[k]=0;foot(-1.5,false);t.drawWorld();const ps=Gr.P[k];ok(ps>0&&ps<p1,'a man standing by it bends it less than one walking ('+ps.toFixed(2)+' against '+p1.toFixed(2)+')');
   Gr.P[k]=0;Gr.W[k]=0;Gr.F[k]=0;const wide=GR.push/r*1.2;foot(-wide);t.drawWorld();const pn=Gr.P[k];Gr.P[k]=0;Gr.W[k]=0;Gr.F[k]=0;foot(-wide,true,true);t.drawWorld();
   ok(Math.abs(pn)<.01&&Gr.P[k]>0,'a rider or a beast bends it wider: '+wide.toFixed(1)+' px off, a man none ('+pn.toFixed(2)+'), a rider '+Gr.P[k].toFixed(2));
   // (left: its spring swings it back past upright, then it settles; it rises again slowly)
   Gr.P[k]=0;Gr.W[k]=0;Gr.F[k]=0;foot(-1.5);t.drawWorld();const F0=Gr.F[k];let lo=0,end=0;const t0=performance.now();
   while(performance.now()-t0<2400){t.drawWorld();lo=Math.min(lo,Gr.P[k]);end=Gr.P[k]}
   ok(lo<-.05&&Math.abs(end)<.05,'left, it sways back past upright ('+lo.toFixed(2)+' px the other way at most) and settles ('+end.toFixed(2)+' after 2.4 s; WORLD_FLORA.grass sway '+GR.sway+')');
   ok(Gr.F[k]<F0*.75&&Gr.F[k]>0,'pressed, it rises again slowly ('+(F0*100).toFixed(0)+'% down, '+(Gr.F[k]*100).toFixed(0)+'% after 2.4 s; flat '+GR.flat+')')}
  // ---- your own men's feet bend it as they walk (marchDraw: a foot each)
  {t.drawWorld();const n=t.GRASS_FEET.now.length/4;ok(!A||n>=A.units.length,'each of your men drawn says where he stands to the grass ('+n+' feet, '+(A?A.units.length:1)+' men)')}}
 // ---- the view's cells (fog.js viewSeen): in your sight 2, land you remember 1, land you never saw 0
 {t.drawWorld();const Q=t.VIEW_SEEN,S=W.seen,c=cam();let n2=0,n1=0,n0=0;for(let i=0;i<Q.C*Q.R;i++){const v=Q.a[i];if(v===2)n2++;else if(v===1)n1++;else n0++}
  const sx=Math.floor(P.x/t.TILE),sy=Math.floor(P.y/t.TILE);ok(t.viewState(P.x,P.y)===2&&n2>0,'where you stand is in your sight ('+n2+' cells of '+Q.C*Q.R+')');
  // (a tile out of your sight in view: remembered, then forgotten)
  let q=null;for(let j=0;j<Q.R&&!q;j++)for(let i=0;i<Q.C&&!q;i++){const x=Q.x+i*Q.cell+Q.cell/2,y=Q.y+j*Q.cell+Q.cell/2;if(!t.inSight(x,y)&&x>c.x&&y>c.y&&x<c.x+t.VW&&y<c.y+t.VH)q=[x,y]}
  if(!q)info('the whole view in your sight');else{const i=Math.floor(q[1]/t.TILE)*t.MW+Math.floor(q[0]/t.TILE),was=S[i];
   S[i]=1;Q.key='';t.viewSeen(c);const a=t.viewState(q[0],q[1]);S[i]=0;Q.key='';t.viewSeen(c);const b=t.viewState(q[0],q[1]);S[i]=was;Q.key='';t.viewSeen(c);
   ok(a===1&&b===0,'out of your sight: land you remember '+a+', land you never saw '+b)}}
 // ---- a chunk none of whose land you know is not drawn (worldart.js draw: seenAny); known, it is
 {const c=cam(),S=W.seen,keep=S.slice(),img=t.ctx.drawImage;let n=0;const count=()=>{n=0;t.ctx.drawImage=function(...a){n++;return img.apply(this,a)};try{WA.draw(t.ctx,c)}finally{t.ctx.drawImage=img}return n};
  const known=count();S.fill(0);const none=count();S.set(keep);
  ok(known>0&&none===0,'the painted land drawn where you know it ('+known+' chunks), none of it where you know none ('+none+')')}
 // ---- out of your sight: the grass still, no prints, no water moving; on land you never saw no grass and no nature
 {const C2=fine();if(!C2)info('no fine chunk: still grass not checked');else{const Gr=C2.grass,vs0=window.viewState,c=cam(),y0=c.y*r,y1=(c.y+t.VH)*r;
   const inView=k=>Gr.Y[k]>=y0&&Gr.Y[k]<=y1&&Gr.X[k]>=c.x*r&&Gr.X[k]<=(c.x+t.VW)*r;let drawn=0,leaning=0,cut=0,props1=0,props0=0,still=0;
   try{window.viewState=()=>1;Gr.L.fill(-99);let e=[];t.terrainEnts(e,c);props1=e.filter(q=>q.fl).length;
     for(let k=0;k<Gr.n;k++)if(inView(k)&&Gr.L[k]!==-99){drawn++;if(Gr.L[k])leaning++;if(Gr.C[k])cut++}
     window.viewState=()=>0;Gr.L.fill(-99);e=[];t.terrainEnts(e,c);props0=e.filter(q=>q.fl).length;for(let k=0;k<Gr.n;k++)if(inView(k)&&Gr.L[k]!==-99)still++}
   finally{window.viewState=vs0;Gr.L.fill(0)}
   ok(drawn>0&&!leaning&&!cut,'land you remember: its grass drawn still, upright, none pressed ('+drawn+' clumps, '+leaning+' leaning, '+cut+' cut)');
   ok(!still&&!props0&&props1>0,'land you never saw: no grass ('+still+' clumps) and no trees or stones ('+props0+'; remembered '+props1+')')}}
});
