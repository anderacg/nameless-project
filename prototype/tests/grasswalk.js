'use strict';
// Grass in the wind only, and nothing drawn beyond your sight (the owner, 2026-11-28: "the grass shaking when unit touching is a bit
// weird please make it more realistic or remove it completely and only keep grass waving to the wind"; 2026-11-17: "Don't draw
// anything beyond visibility"; gfx/worldterrain.js terrainEnts, grassOver; world/fog.js VIEW_SEEN): each clump leans as the wind has it
// and no other way, a man walking through it or standing on it changing nothing (the bending, pressing and easing back under feet
// of 2026-11-17 and 11-20 taken out); the grass by a man's feet still drawn over him, none in his ghost behind a wall. The view's
// cells: in your sight, land you remember, land you never saw; a chunk of the land none of which you know not drawn; out of your
// sight the grass still, on land you never saw no grass and no nature at all.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,GR=t.WORLD_FLORA.grass,WA=t.WorldArt;
 Kit.begin('soldier',1);Kit.clear(['critters']);Kit.world();
 const f=Kit.field(t.townBy('Ashford')||t.TOWNS[0]);Kit.goTo(f[0],f[1]);G.mode='world';G.modal=false;
 const r=t.sceneRes(),cam=()=>({x:Math.floor(G.cam.x),y:Math.floor(G.cam.y)}),fine=()=>{const c=WA.chunks.get(Math.floor(P.y/t.CHUNK)*WA.cols+Math.floor(P.x/t.CHUNK));return c&&c.grass&&c.fr===r?c:null};
 for(let i=0;i<300&&!fine();i++){t.drawWorld();WA.step(60)}
 const C=fine();
 if(r<=1||!C){info('no fine chunk under you (scene '+r+'): grass not checked');}else{
  // ---- the wind alone: every clump in your sight drawn at the lean the wind gives it there and then (the two waves of terrainEnts),
  //  your band walking through it or not; the clock held so both looks are of the same moment
  {const GRS=t.WORLD_FLORA.grass,n=t.PX.flora.lean,pn=performance.now,T0=pn.call(performance)+5000,Gr=C.grass,c=cam();
   const wind=(X,Y,ts)=>{const w1=ts*1.9,w2=ts*GRS.gust[1]*6.28/3,g2=6.28/GRS.gust[0];return Math.max(-n,Math.min(n,Math.round(GRS.wind*(Math.sin(w1+X*.05+Y*.03)+.8*Math.sin(w2+X*g2-Y*.01)))))};
   const seen=k=>Gr.X[k]>=c.x*r&&Gr.X[k]<=(c.x+t.VW)*r&&Gr.Y[k]>=c.y*r&&Gr.Y[k]<=(c.y+t.VH)*r&&t.viewState(Gr.X[k]/r,Gr.Y[k]/r)===2;
   const A=t.MARCH_ARMIES.get(P),men=(A?A.units.filter(u=>!u.dead):[P]).map(u=>[u.x,u.y]),near=k=>men.some(([x,y])=>Math.abs(Gr.X[k]/r-x)<=4&&Math.abs(Gr.Y[k]/r-(y-t.liftAt(x,y)))<=3);
   try{performance.now=()=>T0;t.TGRASS.skip=1e9;Gr.L.fill(-99);t.terrainEnts([],c);
    let all=0,off=0,under=0,lean=0;for(let k=0;k<Gr.n;k++){if(!seen(k)||Gr.L[k]===-99)continue;all++;if(Gr.L[k])lean++;if(near(k))under++;if(Gr.L[k]!==wind(Gr.X[k],Gr.Y[k],T0/1000))off++}
    ok(all>0&&lean>0&&off===0,'every clump in your sight leans as the wind has it, no other way ('+all+' clumps, '+lean+' leaning, '+off+' off the wind\'s lean)');
    ok(under>0,'those at your men\'s feet among them ('+under+' within a step of '+men.length+' men): no foot bends or presses the grass');
    // (a moment on, the wind has moved it)
    const was=Gr.L.slice();performance.now=()=>T0+900;t.TGRASS.skip=1e9;t.terrainEnts([],c);let moved=0;for(let k=0;k<Gr.n;k++)if(seen(k)&&Gr.L[k]!==was[k])moved++;
    ok(moved>0,'0.9 s on the wind has moved it ('+moved+' clumps lean another way)')}
   finally{performance.now=pn;t.TGRASS.skip=1e9}
   ok(typeof window.grassFoot==='undefined'&&!('touch' in GRS)&&!Gr.P&&!Gr.F,'nothing of the bending under feet is left: no feet told to the grass, no footprint in its numbers, no lean or press kept on a clump')}
  // ---- a man's ghost behind a wall or a tree (depth.js ghostOver) draws no grass
  {t.drawWorld();const Gr=C.grass;let k=-1;for(let i=0;i<Gr.n&&k<0;i++){const x=Gr.X[i]/r,y=Gr.Y[i]/r;if(Math.hypot(x-P.x,y-P.y)<90&&t.viewState(x,y)===2)k=i}
   if(k<0)info('no clump in your sight by you');else{const gx=Gr.X[k]/r,gy=Gr.Y[k]/r,di=t.ctx.drawImage;let n=0,m=0;t.ctx.drawImage=function(...a){n++;return di.apply(this,a)};try{t.grassOver(gx,gy-2,6);m=n;n=0;t.WDEPTH.ghosting=true;t.grassOver(gx,gy-2,6)}finally{t.WDEPTH.ghosting=false;t.ctx.drawImage=di}
    ok(m>0&&n===0,'the grass by his feet drawn over a man ('+m+'), none in his ghost ('+n+')')}}}
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
   const inView=k=>Gr.Y[k]>=y0&&Gr.Y[k]<=y1&&Gr.X[k]>=c.x*r&&Gr.X[k]<=(c.x+t.VW)*r;let drawn=0,leaning=0,props1=0,props0=0,still=0;
   try{window.viewState=()=>1;Gr.L.fill(-99);let e=[];t.terrainEnts(e,c);props1=e.filter(q=>q.fl).length;
     for(let k=0;k<Gr.n;k++)if(inView(k)&&Gr.L[k]!==-99){drawn++;if(Gr.L[k])leaning++}
     window.viewState=()=>0;Gr.L.fill(-99);e=[];t.terrainEnts(e,c);props0=e.filter(q=>q.fl).length;for(let k=0;k<Gr.n;k++)if(inView(k)&&Gr.L[k]!==-99)still++}
   finally{window.viewState=vs0;Gr.L.fill(0)}
   ok(drawn>0&&!leaning,'land you remember: its grass drawn still, upright ('+drawn+' clumps, '+leaning+' leaning)');
   ok(!still&&!props0&&props1>0,'land you never saw: no grass ('+still+' clumps) and no trees or stones ('+props0+'; remembered '+props1+')')}}
});
