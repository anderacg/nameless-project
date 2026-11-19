'use strict';
// Waterfalls and rapids (the owner, 2026-11-19: "I see waterfall in big river looks weird": a wide river stepping two levels at once
// above a lake drew a straight white band right across its water): a river's stepped surface falls (a wet face, its lip and pool)
// only where it drops falls' steps.min levels or more at once in a narrow reach, within its banks; a wide one's reach, one near still
// water at its end or near a bridge slopes down as rapids instead (gfx/worldways.js riverRamp, riverLevel; WORLD_TERRAIN.falls.rapid),
// so no fall over a lake or at a mouth, none under a bridge, none as a band across a big river. The painted chunks record each fall's
// columns (worldterrain.js rec.falls: x, y, drop, 0 a river's / 1 beside still water / 2 over still water, four a column).
Kit.suite(({ok,info})=>{
 const t=T,WA=t.WorldArt,FR=t.WORLD_TERRAIN.falls.rapid;Kit.begin('soldier',1);Kit.world();
 const WY=WA.ensure().ways,RR=WY.RR||(WY.RR=t.riverRamp(WY)),X=WY.X,Y=WY.Y,LV=WY.LV,n=LV.length;
 // ---- the rule, over every river point: a fall's segment narrow, off still water and bridges, and a real drop
 {const segs=[];for(const a of WY.SP){if(a+1>=n)continue;const d=t.riverSurf(LV[a],LV[a+1],0)-t.riverSurf(LV[a],LV[a+1],1);if(d>=.5&&RR[a]!==RR[a]&&RR[a+1]!==RR[a+1])segs.push(a)}
  const wide=segs.filter(a=>WY.HW[a]>=FR.hw||WY.HW[a+1]>=FR.hw),bridged=segs.filter(a=>(WY.bridges||[]).some(b=>Math.hypot(X[a]-b.mx,Y[a]-b.my)<b.L/2+FR.bridge)),shallow=segs.filter(a=>LV[a]-LV[a+1]<t.WORLD_TERRAIN.steps.min&&t.riverSurf(LV[a],LV[a+1],0)-t.riverSurf(LV[a],LV[a+1],1)<.5);
  let ramped=0,wideAll=0;for(let k=0;k<n;k++)if(WY.HW[k]>=FR.hw){wideAll++;if(RR[k]===RR[k])ramped++}
  ok(segs.length>0&&!wide.length&&!bridged.length&&!shallow.length,'falls only in narrow reaches off bridges, each a real drop: '+segs.length+' falls; '+wide.length+' in a wide river, '+bridged.length+' by a bridge, '+shallow.length+' under the drop');
  ok(wideAll>0&&ramped===wideAll,'every wide reach slopes as rapids: '+ramped+' of '+wideAll+' wide river points on a ramp (half-width '+FR.hw+' game px or more)')}
 // ---- a ramp: its surface never rises downstream, and it meets still water at the river's end at its own level
 {let up=0,pts=0;for(const a of WY.SP){if(a+1>=n)continue;const r0=RR[a],r1=RR[a+1];if(r0!==r0||r1!==r1)continue;pts++;if(r1>r0+1e-4&&LV[a+1]<=LV[a]+1e-4)up++}
  ok(pts>0&&up===0,'a ramp never climbs where its river falls ('+pts+' ramped segments, '+up+' rising)')}
 // ---- the owner's kind of spot: a wide river two levels above a lake (seed 1, 4476, 3185): painted, no fall over it, rapids instead
 const paintAt=(x,y)=>{const cx=Math.floor(x/t.CHUNK),cy=Math.floor(y/t.CHUNK),k=cy*WA.cols+cx;WA.chunks.delete(k);WA.chunk(cx,cy);return WA.chunks.get(k)};
 const near=(c,x,y,d)=>{const F=c.falls||[],o=[];for(let i=0;i<F.length;i+=4)if(Math.abs(F[i]-x)<d&&Math.abs(F[i+1]-y)<d)o.push([F[i],F[i+1],F[i+2],F[i+3]]);return o};
 {const sx=4476,sy=3185,keep=window.riverRamp;let off=0;
  try{window.riverRamp=W=>new Float32Array(W.X.length).fill(NaN);WY.RR=null;WY.FD=null;off=near(paintAt(sx,sy),sx,sy,40).length}finally{window.riverRamp=keep;WY.RR=null;WY.FD=null}
  const c=paintAt(sx,sy),on=near(c,sx,sy,40).length;
  ok(off>20&&on===0,'the wide river above the lake: '+off+' columns of a flat white band across it with no rapids, '+on+' now (rapids down its slope)')}
 // ---- over a few chunks with falls: none over still water or beside it, each fall one unbroken run across its river
 {const pick=[];for(const a of WY.SP){if(a+1>=n||RR[a]===RR[a]||RR[a+1]===RR[a+1]||t.riverSurf(LV[a],LV[a+1],0)-t.riverSurf(LV[a],LV[a+1],1)<.5)continue;const x=(X[a]+X[a+1])/2,y=(Y[a]+Y[a+1])/2;if(!pick.some(p=>Math.hypot(p[0]-x,p[1]-y)<200))pick.push([x,y]);if(pick.length>=10)break}
  let cols=0,seaCols=0,broken=0,falls=0;for(const [x,y] of pick){const c=paintAt(x,y),F=near(c,x,y,30);cols+=F.length;seaCols+=F.filter(f=>f[3]>0).length;
   const rows=new Map();for(const f of F){const r=Math.round(f[1]/3);if(!rows.has(r))rows.set(r,[]);rows.get(r).push(f[0])}
   for(const xs of rows.values()){falls++;xs.sort((a,b)=>a-b);for(let i=1;i<xs.length;i++)if(xs[i]-xs[i-1]>2){broken++;break}}}
  info(pick.length+' narrow falls painted, '+cols+' columns in '+falls+' rows');
  ok(pick.length>0&&cols>0&&seaCols===0,'no fall over still water or beside it ('+seaCols+' of '+cols+' columns)');
  ok(falls>0&&broken===0,'each fall one unbroken shape across its river ('+broken+' of '+falls+' rows broken)')}
});
