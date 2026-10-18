'use strict';
// Fog of war: you start knowing only what you can see; travel reveals the land. Land you have seen but are not looking at is
// remembered (its ground and buildings, as you last saw them) and nothing that moves shows on it; land you have never seen
// is dark. The save keeps what you have explored. Drawn as the battle's fog is (fog.js drawWorldFog): your sight clear, its
// edge a soft ring, the land you remember under the battle's soft dim, the land you never saw a deep dark misting in at its edge;
// mist drifting in both (gfx/mist.js).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TILE=t.TILE,MW=t.MW,MH=t.MH;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');const P0={x:P.x,y:P.y};G.quietEvents=true;G.clock=t.DAY*.3;W.monsters=[];W.critters=[];t.bandits.length=0;W.caravans=[];W.folk=[];W.ships=[];W.patrols=[];W.refugees=[];
 const world=()=>{G.mode='world';G.modal=false;t.hidePanel()};world();t.drawWorld();
 const count=()=>t.seenArr().reduce((a,v)=>a+v,0),V=t.vis();
 ok(t.seenAt(P.x,P.y)&&!t.seenAt(P.x+V*3,P.y)&&count()<MW*MH*.05,'you start knowing only the land around you ('+count()+' tiles)');
 const c0=count();P.x+=V*1.5;t.drawWorld();ok(count()>c0&&t.seenAt(P.x,P.y),'travel reveals more of the map ('+c0+' → '+count()+' tiles)');P.x-=V*1.5;t.drawWorld();
 // what is dark, what is remembered, what you see
 const px=(x,y)=>{const d=t.ctx.getImageData(Math.round(x-G.cam.x),Math.round(y-G.cam.y),1,1).data;return[d[0],d[1],d[2]]};
 {let ux=null;const deep=(x,y)=>{for(let j=-3;j<=3;j++)for(let i=-3;i<=3;i++)if(t.seenAt(x+i*TILE,y+j*TILE))return false;return true};for(let y=G.cam.y+8;y<G.cam.y+t.VH-8&&ux==null;y+=8)for(let x=G.cam.x+8;x<G.cam.x+t.VW-8&&ux==null;x+=8)if(deep(x,y))ux=[x,y];
  // (drawn with the mist's drift held at its clock's 0, as reducedMotion holds it (mist.js mistTime): on the real clock a wisp
  //  drifting by could cross the pixel in some runs and not others)
  if(ux!=null){window.__rmD=t.reducedMotion;(0,eval)('reducedMotion=()=>true');try{t.drawWorld()}finally{(0,eval)('reducedMotion=__rmD')}const c=px(ux[0],ux[1]);ok(c[0]<20&&c[1]<20&&c[2]<30,'land you have never seen is dark on the screen ('+c.join(',')+')')}else ok(true,'(no unseen land on screen)')}
 // a lord on land you know but cannot see now is not drawn; in your sight he is
 const spot={x:P.x+V+40,y:P.y};for(let k=-2;k<=2;k++)for(let j=-2;j<=2;j++)t.seenArr()[(Math.floor(spot.y/TILE)+j)*MW+Math.floor(spot.x/TILE)+k]=1;
 const L=W.lords.find(l=>!l.dead);const keep=[L.x,L.y,L.inside];L.inside=null;
 const shot=()=>{t.drawWorld();return t.ctx.getImageData(Math.round(spot.x-G.cam.x-10),Math.round(spot.y-G.cam.y-22),20,26).data};
 L.x=-9999;L.y=-9999;const a0=shot();L.x=spot.x;L.y=spot.y;const a1=shot();let diff=0;for(let i=0;i<a0.length;i++)if(Math.abs(a0[i]-a1[i])>6)diff++;
 ok(diff<12,'a lord on land you know but cannot see now is not shown ('+diff+' pixels differ)');
 L.x=P.x+30;L.y=P.y;spot.x=L.x;spot.y=L.y;const b1=shot();L.x=-9999;const b0=shot();let d2=0;for(let i=0;i<b0.length;i++)if(Math.abs(b0[i]-b1[i])>6)d2++;
 ok(d2>40,'in your sight he is ('+d2+' pixels)');[L.x,L.y,L.inside]=keep;
 // buildings outside your sight stay as you last saw them
 {const z=t.TOWNS.find(q=>q.lots&&q.lots.some(l=>l.k==='house'));const l=z.lots.find(q=>q.k==='house');P.x=(l.x+.5)*TILE;P.y=(l.y+1.5)*TILE;t.drawWorld();const seenAs=l._mem;
  const st0=l.st;l.st='ruined';l._s=null;P.x+=V+60;t.drawWorld();ok(l._mem===seenAs&&l._memSt===st0,'a house that burns while you are away still stands in your memory of '+z.name);l.st=st0;l._s=null}
 // the save keeps it
 world();const n0=count();t.saveGame(true);t.fogReset();t.loadGame();ok(count()===n0,'a save keeps what you have explored ('+count()+' tiles)');
 // ---- the fog's look (fog.js drawWorldFog, the battle fog's soft look): read off a white screen, 0 clear .. 1 black
 {world();P.x=P0.x;P.y=P0.y;t.fogReset();t.drawWorld();const S=t.seenArr(),tx=Math.floor(P.x/TILE),ty=Math.floor(P.y/TILE);
  // known land: what you see here, and a band 7 tiles tall running east of you, out past your sight
  for(let y=ty-3;y<=ty+3;y++)for(let x=tx;x<=tx+17;x++)if(x<MW&&y>=0&&y<MH)S[y*MW+x]=1;
  const pn=performance.now;let now=pn.call(performance);performance.now=()=>now;const c=t.ctx,cw=c.canvas.width,ch=c.canvas.height;
  const fogShot=(dt)=>{now+=dt||0;c.save();c.setTransform(1,0,0,1,0,0);c.fillStyle='#fff';c.fillRect(0,0,cw,ch);c.restore();t.drawWorldFog(G.cam,t.vis());const d=c.getImageData(0,0,cw,ch).data;
   return (x,y)=>{const X=Math.round(x-G.cam.x),Y=Math.round(y-G.cam.y);return X<0||Y<0||X>=cw||Y>=ch?null:(255-d[(Y*cw+X)*4+1])/248}};
  try{
   for(let i=0;i<8;i++)fogShot(50);let A=fogShot(50);const V=t.vis(),ex=P.x+V+50,dark=t.FOG.dark;
   const aS=A(P.x-V*.3,P.y),aR=A(ex,P.y),aU=A(ex,P.y+110);
   ok(aS<.03&&Math.abs(aR-dark)<.06&&aU>.96,'three looks: your sight clear ('+aS.toFixed(3)+'), the land you remember the battle fog\'s dim ('+aR.toFixed(3)+'), the land you never saw deep dark ('+aU.toFixed(3)+')');
   // your sight's edge: clear in the middle, the battle's dim beyond, no hard step between; and billowing (mist.js mistFog):
   // round a circle through it the fog comes and goes in puffs, not a ring of one width
   {const pr=[];for(let x=P.x;x<=P.x+V+30;x++)pr.push(A(x,P.y));let step=0;for(let i=1;i<pr.length;i++)step=Math.max(step,Math.abs(pr[i]-pr[i-1]));
    const rr=V*(1+t.WFOG.ring)/2,ro=[];for(let k=0;k<96;k++){const q=k/96*2*Math.PI,a=A(P.x+Math.cos(q)*rr,P.y+Math.sin(q)*rr);if(a!=null)ro.push(a)}const lo=Math.min(...ro),hi=Math.max(...ro);
    ok(pr[Math.round(V*.3)]<.02&&Math.abs(pr[pr.length-1]-dark)<.08&&step<.08&&hi-lo>.15,'your sight\'s edge is soft (largest step a pixel '+step.toFixed(3)+') and billows: round it the fog runs '+lo.toFixed(2)+' to '+hi.toFixed(2))}
   // the frontier between the land you remember and the land you never saw: no hard step, a gradient over many pixels, and
   // billowing along its length
   {const pr=[];for(let y=P.y+20;y<=P.y+110;y++)pr.push(A(ex,y));let step=0,mid=0;for(let i=1;i<pr.length;i++)step=Math.max(step,Math.abs(pr[i]-pr[i-1]));for(const a of pr)if(a>dark+.05&&a<.95)mid++;
    const fy=Math.floor(P.y/TILE+4)*TILE,al=[];const E=t.WFOGV.edge,cA=(x,y)=>E.img.data[(Math.floor((y-E.gy)/8)*E.cols+Math.floor((x-E.gx)/8))*4+3]/255;for(let x=P.x+V+30;x<=P.x+V+160;x+=8)al.push(cA(x,fy));const lo=Math.min(...al),hi=Math.max(...al);
    ok(step<.08&&mid>=6&&hi-lo>.15,'the frontier is mist: no hard step (largest a pixel '+step.toFixed(3)+'), '+mid+' pixels of gradient across it, and along it the fog strength comes and goes in puffs ('+lo.toFixed(2)+' to '+hi.toFixed(2)+')')}
   // no checkerboard: across the frontier every pixel lies near the mean of its neighbours (a checker of blocks would not)
   {let worst=0;const fy=P.y+56;for(let y=fy-12;y<=fy+12;y++)for(let x=ex-12;x<=ex+12;x++){const a=A(x,y);worst=Math.max(worst,Math.abs(a-(A(x-1,y)+A(x+1,y))/2),Math.abs(a-(A(x,y-1)+A(x,y+1))/2))}
    const gone=['fogEdge','drawDark','FOG_COL'].every(n=>(0,eval)('typeof '+n)==='undefined');
    ok(worst<.05&&gone,'no checkerboard at the edge of the dark (worst pixel off its neighbours by '+worst.toFixed(3)+'; the checker code gone: '+gone+')')}
   // the minimap: soft-edged too, dark over the unknown, dim over the known
   {(0,eval)('fogDirty=true;fogMiniT=-1e9');const m=t.fogMiniCv(),d=m.getContext('2d').getImageData(0,0,MW,MH).data,al=(x,y)=>d[(y*MW+x)*4+3];
    let far=null;for(let y=0;y<MH&&far==null;y+=8)for(let x=0;x<MW&&far==null;x+=8){let none=true;for(let j=-4;j<=4&&none;j++)for(let i=-4;i<=4&&none;i++)if(t.seenTile(x+i,y+j))none=false;if(none)far=[x,y]}
    const col=[];for(let y=ty;y<=ty+9;y++)col.push(al(tx+10,y));const soft=col.filter(a=>a>60&&a<250).length;
    ok(al(tx+8,ty)<70&&al(tx+8,ty)>20&&far&&al(far[0],far[1])===255&&soft>=2,'the minimap: the land you know dimmed ('+al(tx+8,ty)+'/255), the unknown dark, their edge soft ('+col.join(' ')+')')}
   // land coming to light clears over about 0.3 s, eased
   {const bx=Math.floor(ex/TILE),by=Math.floor((P.y+110)/TILE);for(let y=by-3;y<=by+3;y++)for(let x=bx-3;x<=bx+3;x++)S[y*MW+x]=1;
    const sq=[fogShot(0)(ex,P.y+110)];for(let k=0;k<8;k++)sq.push(fogShot(50)(ex,P.y+110));const mid=sq.filter(a=>a>dark+.05&&a<.93).length,last=sq[sq.length-1];
    ok(sq[0]>.94&&sq[1]>dark+.05&&mid>=1&&Math.abs(last-dark)<.06,'newly seen land fades in over about 0.3 s, as mist thinning ('+sq.map(a=>a.toFixed(2)).join(' ')+', 0.05 s apart)')}
   // asked for less motion: at once, the ring too
   {const rm0=t.reducedMotion;window.__rm0=rm0;(0,eval)('reducedMotion=()=>true');try{
     const bx=Math.floor(ex/TILE),by=Math.floor((P.y-100)/TILE);for(let y=by-3;y<=by+3;y++)for(let x=bx-3;x<=bx+3;x++)S[y*MW+x]=1;
     const a=fogShot(50)(ex,P.y-100);t.WFOGV.v=V*.5;fogShot(50);const v1=t.WFOGV.v;(0,eval)('reducedMotion=__rm0');t.WFOGV.v=V*.5;fogShot(50);const v2=t.WFOGV.v;
     ok(Math.abs(a-dark)<.06&&v1===V&&v2>V*.5&&v2<V,'with reducedMotion() the fog changes at once ('+a.toFixed(2)+'; the ring '+Math.round(v1)+' at once, else '+Math.round(v2)+' on its way to '+Math.round(V)+')')}
    finally{(0,eval)('reducedMotion=__rm0')}}
   // the cost: a frame of fog while you travel (the camera moving a pixel a frame), and the whole map's dark built afresh
   {const cam={x:G.cam.x,y:G.cam.y},N=240;let t0=pn.call(performance);for(let i=0;i<N;i++){now+=16;cam.x=G.cam.x+(i%60);t.drawWorldFog(cam,V);c.getImageData(0,0,1,1)}const per=(pn.call(performance)-t0)/N;
    t0=pn.call(performance);t.wfogBuild();const build=pn.call(performance)-t0;
    ok(per<3&&build<60,'the fog costs '+per.toFixed(3)+' ms a frame as you travel; the whole map\'s dark built afresh '+build.toFixed(1)+' ms (a new game, a load)')}
   // mist drifting in the fog (gfx/mist.js): in the dim and the dark, none in your sight; moving with the clock, still with
   // reducedMotion; drawn only (no Math.random, nothing explored changes); its cost
   {const M=()=>t.MISTV,mist=()=>{const m=M(),k=t.mkc(m.w,m.h,g=>g.drawImage(m.cv,0,0)),d=k.getContext('2d').getImageData(0,0,m.w,m.h).data;return {d,at:(x,y)=>{const X=Math.floor((x-m.x)/t.MIST.res),Y=Math.floor((y-m.y)/t.MIST.res);return X<0||Y<0||X>=m.w||Y>=m.h?null:d[(Y*m.w+X)*4+3]}}};
    const r0=Math.random;let nr=0;Math.random=()=>{nr++;return r0()};const s0=t.seenSave();let m0,m1,sc0,sc1,still;
    const edge=()=>Array.from(t.WFOGV.edge.img.data).join();let e0,e1,eStill;
    try{sc0=fogShot(50);m0=mist();e0=edge();sc1=fogShot(1000);m1=mist();e1=edge();
     const rm0=t.reducedMotion;window.__rm0=rm0;(0,eval)('reducedMotion=()=>true');try{fogShot(50);const a=mist().d.join(),b=edge();fogShot(1000);still=mist().d.join()===a;eStill=edge()===b}finally{(0,eval)('reducedMotion=__rm0')}}finally{Math.random=r0}
    let most=0,inR=0,inU=0;for(let i=3;i<m0.d.length;i+=4)most=Math.max(most,m0.d[i]);for(let y=-20;y<=20;y+=4)for(let x=-20;x<=20;x+=4){inR=Math.max(inR,m0.at(ex+x,P.y+y)||0);inU=Math.max(inU,m0.at(ex+x,P.y+110+y)||0)}
    let sightMist=0;for(let y=-V*.4;y<=V*.4;y+=4)for(let x=-V*.4;x<=V*.4;x+=4)if(x*x+y*y<V*V*.16)sightMist=Math.max(sightMist,m0.at(P.x+x,P.y+y)||0);
    let moved=0;for(let i=3;i<m0.d.length;i+=4)if(m0.d[i]!==m1.d[i])moved++;const inSight=[[0,0],[-V*.3,0],[V*.3,V*.2]].every(([x,y])=>sc0(P.x+x,P.y+y)===sc1(P.x+x,P.y+y));
    ok(most>0&&inR>0&&inU>0&&sightMist===0,'mist lies in the fog: over the land you remember (alpha up to '+inR+'), over the land you never saw ('+inU+'), none in your sight');
    ok(moved>50&&e0!==e1&&inSight&&still&&eStill,'the mist drifts with the clock ('+moved+' of its pixels changed in a second; the edge\'s puffs reshaping too), your sight untouched, and all of it holds still with reducedMotion()');
    ok(nr===0&&t.seenSave()===s0&&!/Math\.random/.test(String(t.mistLay)+String(t.mistOnto)+String(t.mistTex)),'the mist is drawn only: no Math.random ('+nr+' calls), what you have explored unchanged')}
   // the mist's cost: a frame of fog with it and without it, as you travel
   {const cam={x:G.cam.x,y:G.cam.y},N=240,run=()=>{const a=pn.call(performance);for(let i=0;i<N;i++){now+=16;cam.x=G.cam.x+(i%60);t.drawWorldFog(cam,V);c.getImageData(0,0,1,1)}return (pn.call(performance)-a)/N};
    run();const w=run();window.__dm0=t.mistLay;window.__dm1=t.mistOnto;(0,eval)('mistLay=()=>{};mistOnto=()=>{}');let wo;try{run();wo=run()}finally{(0,eval)('mistLay=__dm0;mistOnto=__dm1')}
    ok(w-wo<1,'the mist costs '+(w-wo).toFixed(3)+' ms a frame on the map ('+t.VW+'×'+t.VH+'; the fog with it '+w.toFixed(3)+' ms, each frame drawn through)')}
  }finally{performance.now=pn}
  // drawing never changes what you have explored, so the save is as it was
  {const s0=t.seenSave();for(let i=0;i<3;i++)t.drawWorld();ok(t.seenSave()===s0,'drawing the fog never changes what you have explored (the save the same)')}
  // nothing that moves shows on the land you remember, even just past your sight's edge
  {const L=W.lords.find(l=>!l.dead),keep=[L.x,L.y,L.inside];L.inside=null;const V=t.vis(),sx=P.x+V+12,sy=P.y;
   const box=()=>{t.drawWorld();return t.ctx.getImageData(Math.round(sx-G.cam.x-10),Math.round(sy-G.cam.y-22),20,26).data};
   L.x=-9999;L.y=-9999;const b0=box();L.x=sx;L.y=sy;const b1=box();let diff=0;for(let i=0;i<b0.length;i++)if(Math.abs(b0[i]-b1[i])>6)diff++;[L.x,L.y,L.inside]=keep;
   ok(diff<12,'a lord just past your sight\'s edge, on land you know, is not drawn ('+diff+' pixels differ)')}}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
