'use strict';
// Grass under feet, and nothing drawn beyond your sight (the owner, 2026-11-17: "Make grass more realistic when player walk by", "Don't
// draw anything beyond visibility"; gfx/worldterrain.js grassFeet, GRASS_FEET; world/fog.js VIEW_SEEN): every man drawn bends the
// grass his body touches (its foot in his footprint), the way he walks (away from him standing or going up or down the screen), the more the nearer, and presses it
// down under his feet; left, it eases back slowly, never past upright, the slower the longer he stood on it, and some long trodden
// stay down; a man standing bends it less, a rider wider; no grass in a man's ghost behind a wall. The view's cells: in your sight, land you
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
  t.drawWorld();const A=t.MARCH_ARMIES.get(P),men=A?A.units.map(u=>[u.x,u.y]):[[P.x,P.y]],Gr=C.grass,far=GR.touch.big+6;
  let k=-1;for(let i=0;i<Gr.n&&k<0;i++){const x=Gr.X[i]/r,y=Gr.Y[i]/r,d=Math.hypot(x-P.x,y-P.y);if(d>40&&d<90&&t.viewState(x,y)===2&&men.every(([a,b])=>Math.hypot(a-x,b-y)>far))k=i}
  if(k<0)info('no clump in your sight away from your men');else{
   const gx=Gr.X[k]/r,gy=Gr.Y[k]/r,foot=(dx,go=true,big=false)=>{const x=gx+dx;t.grassFoot(x,gy+t.liftAt(x,gy),go,big)};
   const clr=()=>{Gr.P[k]=0;Gr.F[k]=0;Gr.D[k]=0;Gr.K[k]=0};clr();t.GRASS_FEET.now.length=0;
   // (a foot just west of it: it leans east, away, and is pressed down under the foot)
   foot(-1.5);t.drawWorld();const p1=Gr.P[k],f1=Gr.F[k],c1=Gr.C[k];
   ok(p1>0&&f1>0&&c1>0,'a foot by a clump bends it away from him ('+p1.toFixed(2)+' px east of a foot west of it) and presses it down ('+(f1*100).toFixed(0)+'% of its height, '+c1+' px of its tips not drawn)');
   clr();foot(1.5);t.drawWorld();ok(Gr.P[k]<0,'a foot east of it: it leans west ('+Gr.P[k].toFixed(2)+')');
   clr();foot(-1.5,false);t.drawWorld();const ps=Gr.P[k];ok(ps>0&&ps<p1,'a man standing by it bends it less than one walking ('+ps.toFixed(2)+' against '+p1.toFixed(2)+')');
   clr();const TO=GR.touch,wide=(TO.hw+TO.big)/2;foot(-wide);t.drawWorld();const pn=Gr.P[k];clr();foot(-wide,true,true);t.drawWorld();
   ok(Math.abs(pn)<.01&&Gr.P[k]>0,'a rider or a beast bends it wider: '+wide.toFixed(1)+' px off, a man none ('+pn.toFixed(2)+'), a rider '+Gr.P[k].toFixed(2));
   // (only a clump his body touches (the owner, 2026-11-20: "pushing should be based on character touch"): its foot in his footprint,
   //  TO.hw either side of his feet, TO.up behind them, TO.down in front; one just past it, either side, behind or in front, stays as
   //  the wind leans it)
   {const at=(dx,dy)=>{clr();const x=gx+dx,y=gy+dy;t.grassFoot(x,y+t.liftAt(x,y),true,false);t.drawWorld();return Gr.P[k]},e=.4;
    const under=at(0,0),side=[at(-TO.hw-e,0),at(TO.hw+e,0)],ahead=at(0,-TO.down-e),behind=at(0,TO.up+e),edge=[at(-TO.hw+e,0),at(0,-TO.down+e)];
    ok(under!==0&&edge.every(v=>v!==0),'a clump under a man bends ('+under.toFixed(2)+'), and one at the edge of his footprint ('+edge.map(v=>v.toFixed(2)).join(', ')+'; '+TO.hw+' px either side, '+TO.down+' px in front)');
    ok([...side,ahead,behind].every(v=>v===0),'one just past his footprint does not: either side '+side.map(v=>v.toFixed(2)).join(', ')+', in front '+ahead.toFixed(2)+', behind '+behind.toFixed(2));
    clr();t.GRASS_FEET.now.length=0;t.drawWorld();const fr=t.TGRASS.fr;let wind=0;for(let i=0;i<Gr.n;i++)if(Gr.L[i]&&Gr.H[i]!==fr)wind++;
    info('the wind leans '+wind+' clumps no foot touches this frame (its sway kept)')}
   // (walking across the screen it bends his way, whichever side of him it stands)
   {clr();const who={};t.grassFoot(gx-1.5,gy+t.liftAt(gx,gy),true,false,who);t.GRASS_FEET.now.length=0;t.grassFoot(gx+1.5,gy+t.liftAt(gx,gy),true,false,who);t.drawWorld();
    ok(Gr.P[k]>0,'a man walking east by it bends it east, though it stands west of him ('+Gr.P[k].toFixed(2)+')')}
   // (left, it eases back, never past upright; the longer he stood on it, the slower (stay off for this))
   const st0=GR.stay.slice();GR.stay[1]=1e9;
   const after=(press)=>{clr();const t0=performance.now();do{foot(-1.5,false);t.drawWorld()}while(performance.now()-t0<press);const p0=Gr.P[k];let lo=p0;const t1=performance.now();while(performance.now()-t1<1200){t.drawWorld();lo=Math.min(lo,Gr.P[k])}return [p0,Gr.P[k],lo,Gr.D[k]]};
   try{const [a0,a1,alo]=after(0),[b0,b1,,bD]=after(1500);
    ok(alo>=0&&a1<a0*.75&&a1>=0,'left, it eases back, never past upright ('+a0.toFixed(2)+' to '+a1.toFixed(2)+' in 1.2 s, '+alo.toFixed(2)+' at the least)');
    ok(b1/b0>a1/a0+.1,'stood on 1.5 s, it rises the slower ('+(b1/b0*100).toFixed(0)+'% still bent after 1.2 s, against '+(a1/a0*100).toFixed(0)+'%; trodden '+bD.toFixed(2)+' s; back '+GR.back+')')}
   finally{GR.stay[0]=st0[0];GR.stay[1]=st0[1]}
   // (one trodden long enough may stay down: all of them with stay [1, a moment])
   try{GR.stay[0]=1;GR.stay[1]=.01;clr();const t0=performance.now();do{foot(-1.5,false);t.drawWorld()}while(performance.now()-t0<200);const p0=Gr.P[k],f0=Gr.F[k],t1=performance.now();while(performance.now()-t1<800)t.drawWorld();
    ok(Gr.K[k]===1&&Gr.P[k]===p0&&Gr.F[k]===f0&&p0>0,'trodden long enough, it may stay down (stay '+st0+'): bent '+p0.toFixed(2)+' and pressed '+(f0*100).toFixed(0)+'% still after 0.8 s')}
   finally{GR.stay[0]=st0[0];GR.stay[1]=st0[1];clr()}
   // (a man's ghost behind a wall or a tree (depth.js ghostOver) draws no grass)
   {const di=t.ctx.drawImage;let n=0,m=0;t.ctx.drawImage=function(...a){n++;return di.apply(this,a)};try{t.grassOver(gx,gy-2,6);m=n;n=0;t.WDEPTH.ghosting=true;t.grassOver(gx,gy-2,6)}finally{t.WDEPTH.ghosting=false;t.ctx.drawImage=di}
    ok(m>0&&n===0,'the grass by his feet drawn over a man ('+m+'), none in his ghost ('+n+')')}}
  // ---- your own men's feet bend it as they walk (marchDraw: a foot each)
  {t.drawWorld();const n=t.GRASS_FEET.now.length/5;ok(!A||n>=A.units.length,'each of your men drawn says where he stands to the grass ('+n+' feet, '+(A?A.units.length:1)+' men)')}}
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
