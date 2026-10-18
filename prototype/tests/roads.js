'use strict';
// Roads and paths on the battlefield laid like real ones (battle/terrain.js wayPlan, TERRAIN_WAY; doc/TERRAIN_DESIGN.md "Roads laid
// like real ones"): the least-cost line over the cells (route.js), smoothed and swayed by seeded noise inside its corridor. Over many
// fields of every recipe: no way crosses a cliff (only slopes and ramps), none runs on rock or deep water but at a crossing; roads go
// round hills where they can; their bends are not periodic (no sine); the same tile gives the same road and tiles differ; the ends
// are where the world's road crosses the edges, and both armies reach the road alike; planning time by field size. The art: no road
// under a cliff face, no face on a ramp, a gap in the canopy over a forest road. TERRAIN.on is turned on here.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,ev=s=>(0,eval)(s),K=t.TKIND;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');t.G.quietEvents=true;t.GUIDE.on=false;ev('TERRAIN.on=true');
 // (planning time: wayPlan wrapped)
 ev('window.__wp=wayPlan;window.__wpT=0;window.__wpN=0;wayPlan=function(){const a=performance.now(),r=__wp.apply(this,arguments);__wpT+=performance.now()-a;__wpN++;return r}');
 // (a check grid: rock and deep water closed, every cliff closed both ways)
 const grid=T0=>{const {C,R,cs}=T0,g=t.routeGrid(C,R,cs);for(let i=0;i<C*R;i++){const k=T0.kind[i];if(k===K.rock||k===K.deep)g.cost[i]=0}
   if(T0.wall)for(let i=0;i<C*R;i++){const b=T0.wall[i];if(!b)continue;const c=i%C;g.wall[i]|=b;if(b&1&&c<C-1)g.wall[i+1]|=4;if(b&4&&c>0)g.wall[i-1]|=1;if(b&2&&i+C<C*R)g.wall[i+C]|=8;if(b&8&&i>=C)g.wall[i-C]|=2}t.routePrep(g);return g};
 const tIx=(T0,x,y)=>{const c=Math.floor(x/T0.cs),r=Math.floor(y/T0.cs);return t.clamp(r,0,T0.R-1)*T0.C+t.clamp(c,0,T0.C-1)};
 const SPEC=[];const L={open:['hill','rise','copses','plain','woodedHill'],hills:['pair','rolling','ridge','ridges','woodedRidge','pairFlank'],peaks:['pass','saddle','gorge'],swamp:['marsh','fen','mere'],desert:['dune','dunes','erg','spires'],forest:['deepwood','stands','hillwood','glade']};
 for(const rc in L)for(const ly of L[rc])for(let s=1;s<=6;s++)SPEC.push({recipe:rc,layout:ly,seed:(s*2654435761+ly.length*977+rc.length*131)>>>0,road:{ew:true,ns:s%3===0},...(s===2?{river:{bridge:true}}:s===4?{frost:true}:s===5?{crags:true}:{}),...(rc==='forest'?{forest:true}:{})});
 const W=1100,top=40,bot=560,H=600,fields=SPEC.map(sp=>({sp,T:t.buildTerrain({...sp,W,H,top,bot})}));
 // ---- no cliff crossed, nothing on rock or deep water but at a crossing
 {let n=0,legs=0,bad=[],wet=0,fall=0;for(const {sp,T:T0} of fields){const g=grid(T0);for(const w of T0.ways||[]){if(w.kind==='chain')continue;n++;if(w.fall)fall++;const p=w.p;
     for(let j=0;j<p.length;j++){const k=T0.kind[tIx(T0,p[j][0],p[j][1])];if(k===K.rock||k===K.deep){wet++;bad.push(sp.recipe+'/'+sp.layout+' '+w.kind+' on '+(k===K.rock?'rock':'deep water'))}
       if(j){legs++;if(!t.routeWalk(g,p[j-1][0],p[j-1][1],p[j][0],p[j][1],255))bad.push(sp.recipe+'/'+sp.layout+' seed '+sp.seed+' '+w.kind+' crosses a cliff at '+p[j].join(','))}}}
     if(T0.road)for(let i=0;i<T0.road.length;i++)if(T0.road[i]&&(T0.kind[i]===K.rock||T0.kind[i]===K.deep||T0.kind[i]===K.ford))bad.push(sp.recipe+' a road cell on '+T0.kind[i])}
  ok(n>=150&&!bad.length,n+' ways over '+fields.length+' fields (every recipe, rivers with bridges, frost, crags): no leg of any crosses a cliff ('+legs+' legs walked, cliffs closed both ways: only slopes and ramps), none on rock or deep water but at a crossing, no road cell there'+(bad.length?': '+bad.slice(0,5).join('; '):''));
  ok(fall===0,'every way found a way through without crossing a cliff ('+fall+' fell back)')}
 // ---- round the hills where a flat way exists: the share of a road on a terrace against its straight line's
 {let rH=0,rN=0,sH=0,sN=0,nf=0;for(const {T:T0} of fields){for(const w of T0.ways||[]){if(w.kind!=='road')continue;const p=w.p.filter(q=>q[0]>=0&&q[0]<W&&q[1]>=top&&q[1]<bot);if(p.length<4)continue;
     const a=p[0],b=p[p.length-1],L0=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(L0/8);let s=0;for(let k=0;k<=n;k++)if(T0.lvl[tIx(T0,a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n)])s++;if(!s)continue;nf++;
     sH+=s;sN+=n+1;let r=0,m=0;for(let j=1;j<p.length;j++){const q=Math.ceil(Math.hypot(p[j][0]-p[j-1][0],p[j][1]-p[j-1][1])/8);for(let k=0;k<q;k++){m++;if(T0.lvl[tIx(T0,p[j-1][0]+(p[j][0]-p[j-1][0])*k/q,p[j-1][1]+(p[j][1]-p[j-1][1])*k/q)])r++}}rH+=r;rN+=m}}
  const rs=rH/Math.max(1,rN),ss=sH/Math.max(1,sN);ok(nf>20&&rs<=ss*.5,'roads go round hills where they can: '+nf+' roads whose straight way meets a hill; on a terrace '+(rs*100).toFixed(1)+'% of the road against '+(ss*100).toFixed(1)+'% of the straight line')}
 // ---- not periodic: the autocorrelation of a road's turning (every 16 px) has no strong peak past its first zero (a sine's has)
 {const peak=p=>{const th=[];for(let j=1;j<p.length;j++)th.push(Math.atan2(p[j][1]-p[j-1][1],p[j][0]-p[j-1][0]));const k=[];for(let j=1;j<th.length;j++){let d=th[j]-th[j-1];d=Math.atan2(Math.sin(d),Math.cos(d));k.push(d)}
     const n=k.length,m=k.reduce((a,b)=>a+b,0)/n,v=k.reduce((a,b)=>a+(b-m)*(b-m),0);if(n<30||!(v>1e-9))return null;const r=L=>{let s=0;for(let j=0;j+L<n;j++)s+=(k[j]-m)*(k[j+L]-m);return s/v*n/(n-L)};
     let L=1;while(L<n/2&&r(L)>0)L++;let pk=-1;for(;L<n/2;L++)pk=Math.max(pk,r(L));return pk};
  const P=[];let curv=[];for(const {T:T0} of fields)for(const w of T0.ways||[]){if(w.kind!=='road')continue;const p=w.p.filter(q=>q[0]>=0&&q[0]<W&&q[1]>=0&&q[1]<H),v=peak(p);if(v!=null)P.push(v)}
  // (a sine meander as the old roads had, same spacing: the measure finds its period)
  const sine=[];for(let x=0;x<=1100;x+=16)sine.push([x,300+9.6*Math.sin(x/140*6.283)]);const ps=peak(sine),strong=P.filter(v=>v>.6).length;
  ok(P.length>50&&strong<=P.length*.1&&ps>.6,'road bends are not periodic: the turning\'s autocorrelation past its first zero peaks over .6 on '+strong+' of '+P.length+' roads (mean peak '+(P.reduce((a,b)=>a+b,0)/P.length).toFixed(2)+'); an even sine meander peaks at '+ps.toFixed(2))}
 // ---- the same tile, the same road; tiles differ
 {const sp=SPEC.find(s=>s.recipe==='hills'),A=t.buildTerrain({...sp,W,H,top,bot}),B=t.buildTerrain({...sp,W,H,top,bot}),C2=t.buildTerrain({...sp,seed:sp.seed+1,W,H,top,bot});
  const h=T0=>JSON.stringify(T0.ways)+'|'+Array.from(T0.road||[]).join('');ok(h(A)===h(B)&&h(A)!==h(C2),'the same tile gives the same road (its points and cells); the next tile another')}
 // ---- the ends: in from the edges the world's road crosses; both armies reach it alike
 {let n=0,badE=[],diffs=[];for(const {sp,T:T0} of fields)for(const w of T0.ways||[]){if(w.kind!=='road')continue;const p=w.p,a=p[0],b=p[p.length-1];
     const ns=Math.abs(b[1]-a[1])>Math.abs(b[0]-a[0]);n++;
     if(ns){if(!(a[1]<=top+T0.cs*2&&b[1]>=bot-T0.cs*2))badE.push(sp.recipe+'/'+sp.layout+' n-s ends '+a+' '+b)}
     else{if(!(a[0]<=0&&b[0]>=W-1))badE.push(sp.recipe+'/'+sp.layout+' w-e ends '+a+' '+b);
       const z=t.zMid(T0.zone,W),mid=(top+bot)/2,d=(x,y)=>Math.min(...p.map(q=>Math.hypot(q[0]-x,q[1]-y)));diffs.push(Math.abs(d(z,mid)-d(W-z,mid)))}}
  diffs.sort((a,b)=>a-b);const mean=diffs.reduce((a,b)=>a+b,0)/diffs.length,p90=diffs[Math.floor(diffs.length*.9)];
  ok(!badE.length,n+' roads: a west-east road comes in off the west edge and goes out off the east, a north-south one from the top of the field to its bottom'+(badE.length?': '+badE.slice(0,4).join('; '):''));
  ok(mean<=48&&p90<=128,'both armies reach the road alike: the road\'s distance from each deployment zone\'s middle differs by '+mean.toFixed(0)+' px on average, '+p90.toFixed(0)+' px at the 90th percentile ('+diffs.length+' roads)')}
 // ---- the AI on the ways: a rider's way through a dense forest still rides for a road point (wayRide)
 {let got=0,on=0,tried=0;for(const {T:T0} of fields){if(!T0.ai||!T0.ai.dense)continue;ev('B={terrain:null}');t.B.terrain=T0;const G=T0.ai.glades.filter(g=>g.half===0)[0],G1=T0.ai.glades.filter(g=>g.half===1)[0];
     for(let k=0;k<8;k++){tried++;const a={x:G.x,y:G.y},b={x:G1.x+(k-4)*20,y:t.clamp(G1.y+(k%3-1)*160,top+20,bot-20)},q=t.wayRide(a,b);if(q){got++;if(T0.ai.ways.some(w=>w.some(p=>p[0]===q.x&&p[1]===q.y)))on++}}ev('B=null')}
  ok(got>0&&on===got,'riders on a dense field still keep to the ways (wayRide): '+got+' of '+tried+' rides through woods go by a way\'s point, all of them on a way')}
 // ---- planning time by field size
 {const SZ=[['today',1100,600],['big',1600,900],['large',2000,1200],['huge',3200,1800]],out=[];let worst=0;
  for(const [n,w,h] of SZ){const r=[];for(const rc of ['open','hills','forest']){ev('__wpT=0;__wpN=0');for(let s=1;s<=4;s++)t.buildTerrain({recipe:rc,seed:s*7919,W:w,H:h,top:40,bot:h-40,road:{ew:true,ns:true},...(rc==='forest'?{forest:true}:{})});r.push(rc+' '+(t.__wpT/4).toFixed(1));worst=Math.max(worst,t.__wpT/4/(w*h/660000))}out.push(n+' '+w+'x'+h+': '+r.join(', '))}
  ok(worst<25,'road planning time a field (ms, the field\'s ways together): '+out.join('; '))}
 // ---- the art: no road line under a cliff face (a face prop's pixel), no face on a ramp, a gap in the canopy over a forest road
 {let pts=0,hid=0;for(const {sp,T:T0} of fields.filter(f=>f.T.wall&&f.T.recipe.road).slice(0,12)){const gr=t.PX.battleGround({...T0,climate:sp.frost?'frost':'grass'});
     const faces=gr.props.filter(p=>p.dk===2).map(p=>({p,d:p.s.getContext('2d').getImageData(0,0,p.s.width,p.s.height).data}));
     for(const w of T0.ways)for(let j=1;j<w.p.length;j++)for(let k=0;k<4;k++){const x=Math.round(w.p[j-1][0]+(w.p[j][0]-w.p[j-1][0])*k/4),y=Math.round(w.p[j-1][1]+(w.p[j][1]-w.p[j-1][1])*k/4);if(x<0||y<0||x>=W||y>=H)continue;pts++;
       for(const f of faces){const b=f.p.box;if(x<b[0]||x>b[2]||y<b[1]||y>b[3])continue;if(f.d[((y-f.p.dy)*f.p.s.width+(x-f.p.dx))*4+3]>0)hid++}}}
  ok(pts>500&&hid<=pts*.002,'a road is never drawn under a cliff face: '+hid+' of '+pts+' points of road lines on fields with cliffs lie on a face prop\'s pixel')}
 {// (a sheer plateau with one ramp south: no face prop pixel in the ramp's middle, the cliff either side a face)
  const T0=t.buildTerrain({explicit:{hills:[{x:.5,y:.5,r:150,cliff:true,ramps:[90]}],seed:3},W:1280,H:720,top:40,bot:680}),gr=t.PX.battleGround({...T0,climate:'grass'}),{C,cs}=T0;
  const ramp=[],cliff=[];for(let i=0;i<T0.lvl.length;i++){if(!T0.lvl[i]||i+C>=T0.lvl.length||T0.lvl[i+C]>=T0.lvl[i])continue;((T0.wall[i]&2)||(T0.wall[i+C]&8)?cliff:ramp).push(i)}
  const faces=gr.props.filter(p=>p.dk===2).map(p=>({p,d:p.s.getContext('2d').getImageData(0,0,p.s.width,p.s.height).data})),onFace=(x,y)=>faces.some(f=>{const b=f.p.box;return x>=b[0]&&x<=b[2]&&y>=b[1]&&y<=b[3]&&f.d[((y-f.p.dy)*f.p.s.width+(x-f.p.dx))*4+3]>0});
  const mids=ramp.filter(i=>ramp.includes(i-1)&&ramp.includes(i+1));let rf=0,rn=0,cf=0,cn=0;
  for(const i of mids){const c=i%C,r=(i-c)/C;for(let y=(r+1)*cs-10;y<(r+1)*cs-2;y+=2){rn++;if(onFace(c*cs+8,y))rf++}}for(const i of cliff){const c=i%C,r=(i-c)/C;cn++;if(onFace(c*cs+8,(r+1)*cs-6)||onFace(c*cs+8,(r+1)*cs-3)||onFace(c*cs+8,(r+1)*cs-9))cf++}
  ok(mids.length>0&&rf===0&&cf>=cn*.6,'a ramp breaks the cliff: no face prop over its middle ('+rf+' of '+rn+' points), the cliff either side is face ('+cf+'/'+cn+' of its edge cells)')}
 {const T0=t.buildTerrain({recipe:'forest',layout:'deepwood',seed:12,W:1600,H:900,top:40,bot:860,road:{ew:true},forest:true}),gr=t.PX.battleGround({...T0,climate:'grass'}),cv=t.PX.battleCanopy(gr),d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data,w=T0.ways.find(q=>q.kind==='road');let n=0,open=0;
  for(const [x,y] of w.p){if(x<0||y<20||x>=cv.width||y>=cv.height)continue;n++;if(d[(y*cv.width+x)*4+3]===0)open++}
  ok(n>50&&open>=n*.95,'a forest road shows through the canopy layer (a big wood zoomed out): '+open+' of '+n+' points of its line open')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{try{(0,eval)('if(window.__wp)wayPlan=__wp;TERRAIN.on=false;B=null')}catch(e){}}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
