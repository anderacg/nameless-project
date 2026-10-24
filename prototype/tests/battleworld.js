'use strict';
// Battle follows the world (doc/TERRAIN_DESIGN.md §8, "Battle follows the world as built"; world/worldmap.js WorldMap#siteNear,
// battle/terrain.js TERRAIN_WORLD, TERRAIN_MIX, TERRAIN_POND, TERRAIN_BUILT, TERRAIN_LANE): a generated world's fight reads the
// world round its tile. A fight at a climates' edge mixes its field's ground (B.terrain.clim), the other climate's share the
// world's, both armies' halves alike (mirrored across the middle line: TERRAIN_MIX.mirror; off, more of it toward the side it
// lies on, as first built); the ground's own rules (snow, mud, the grass's gallop) follow each soldier's cell, the weather the tile's;
// a fight of one climate is as it was. A fight beside a holding has its buildings (solid, hiding
// what lies behind them, standing twice the world's model size), crop rows and fences on the side they lie, both deployment zones
// and a building's width in front of them clear and the field fair; by a brook a
// stream crossed anywhere; by a pond its pool and marsh, no river from its water; on a lane (a road through a wood) trees close
// along its track. TERRAIN.on and the field sizes are turned on here (tests/harness.js turns them off).
window.RUN=()=>{const t=T,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),ev=s=>(0,eval)(s),J=JSON.stringify;
const keep=ev('[TERRAIN.on,FIELD_SIZES.on,BW,BH]'),on0=t.TERRAIN_WORLD.on,mr0=t.TERRAIN_MIX.mirror;
try{
 ev('TERRAIN.on=true;FIELD_SIZES.on=true');t.fieldSet('big');
 const WM=t.WM,MW=WM.w,MH=WM.h,K=t.TKIND,CL=t.CLIMS,{T_OPEN,T_FOREST,T_HILL,T_WATER,T_MOUNT}=t;
 const BW=t.BW,BH=t.BH,top=24,bot=BH-8;
 // (a tile's site, its env, its spec and its field (the big size), with the world's say on or off)
 const at=(x,y,world=true,mirror=mr0)=>{t.TERRAIN_WORLD.on=world;t.TERRAIN_MIX.mirror=mirror;const S=WM.battleSite(x,y),env=t.battleEnv(false,S),g=t.terrainOf(S,env),T0=t.buildTerrain({...g,W:BW,H:BH,top,bot});t.TERRAIN_WORLD.on=on0;t.TERRAIN_MIX.mirror=mr0;return{S,env,g,T:T0}};
 const land=(x,y)=>{const k=WM.kind[y*MW+x];return k!==T_WATER&&k!==T_MOUNT};
 // (every n-th land tile's site that passes f, up to max)
 const scan=(f,n=1,max=40)=>{const out=[];let c=0;for(let y=2;y<MH-2&&out.length<max;y++)for(let x=2;x<MW-2&&out.length<max;x++){if(!land(x,y))continue;const S=WM.battleSite(x,y);if(f(S,x,y)&&!(c++%n))out.push([x,y,S])}return out};
 const zones=[t.fieldZone(0),t.fieldZone(1)],inZone=x=>zones.some(z=>x>=z.x0&&x<z.x1);
 const cellsOf=(T0,f)=>{const out=[];for(let i=0;i<T0.C*T0.R;i++)if(f(i))out.push({i,x:(i%T0.C+.5)*T0.cs,y:(Math.floor(i/T0.C)+.5)*T0.cs});return out};

 // ======== a field of one climate: as it was
 {const pure=scan(S=>!S.mix&&!S.pond&&!S.brook&&!S.lane&&!S.lots,37,60);let same=0,fs=0,nf=0;
  for(const [x,y] of pure){const a=at(x,y,true),b=at(x,y,false);if(J(a.g)===J(b.g))same++;if(nf<12){nf++;const A=a.T,B=b.T;if(J(Array.from(A.kind))===J(Array.from(B.kind))&&J(Array.from(A.lvl))===J(Array.from(B.lvl))&&!A.clim&&!A.built&&J(A.recipe)===J(B.recipe))fs++}}
  ok(pure.length>=20&&same===pure.length&&fs===nf,'a fight of one climate with nothing by it: its ground spec ('+same+' of '+pure.length+' tiles) and its field ('+fs+' of '+nf+': cells, levels, recipe and words) the same as before (TERRAIN_WORLD off)');
  if(pure.length){const [x,y]=pure[0],a=at(x,y,true),b=at(x,y,false),pa=t.PX.battleGround({...a.T,climate:a.env.c}),pb=t.PX.battleGround({...b.T,climate:b.env.c}),d1=pa.getContext('2d', { willReadFrequently: true }).getImageData(0,0,BW,BH).data,d2=pb.getContext('2d', { willReadFrequently: true }).getImageData(0,0,BW,BH).data;
   let diff=0;for(let i=0;i<d1.length;i++)if(d1[i]!==d2[i])diff++;ok(!diff&&pa.props.length===pb.props.length,'and painted pixel for pixel the same ('+x+','+y+': '+diff+' bytes differ, '+pa.props.length+' props)')}}
 {

 // ======== a climates' edge: the ground mixed, more of the other's toward its side
 {const mixed=scan(S=>S.mix&&S.mix.share>.22&&S.mix.share<.6&&Math.max(Math.abs(S.mix.dir[0]),Math.abs(S.mix.dir[1]))>.85,11,24);let right=0,cl=0,words=0;const by={};
  // (toward: more of the other's in the half toward where it lies; share: its share of the field's cells)
  const toward=(T0,S)=>{const b=CL.indexOf(S.mix.c),[dx,dy]=S.mix.dir,hz=Math.abs(dx)>Math.abs(dy);let near=0,far=0,nn=0,nf=0;for(const c of cellsOf(T0,()=>true)){const s=hz?Math.sign(dx)*(c.x-BW/2):Math.sign(dy)*(c.y-BH/2);if(!s)continue;const v=T0.clim&&T0.clim[c.i]===b?1:0;if(s>0){near+=v;nn++}else{far+=v;nf++}}return near/nn>far/nf};
  const share=(T0,S)=>{const b=CL.indexOf(S.mix.c);let n=0;if(T0.clim)for(let i=0;i<T0.clim.length;i++)if(T0.clim[i]===b)n++;return n/(T0.C*T0.R)};
  let mir=0,hzN=0,vt=0,vtN=0,both=0;const dsh=[];
  for(const [x,y,S] of mixed){const {T:T0}=at(x,y),b=CL.indexOf(S.mix.c),[dx,dy]=S.mix.dir,hz=Math.abs(dx)>Math.abs(dy);if(!T0.clim)continue;cl++;
   // (mirrored: each cell the same ground as its twin across the middle line, so each half the same count)
   const {C,R}=T0;let same=true,wn=0,en=0;for(let r=0;r<R;r++)for(let c=0;c<C;c++){const v=T0.clim[r*C+c];if(v!==T0.clim[r*C+C-1-c])same=false;if(v===b){if(c<C/2)wn++;else en++}}
   if(same&&wn===en&&T0.recipe.mix.mirror)mir++;if(hz)hzN++;else{vtN++;if(toward(T0,S))vt++}
   const off=at(x,y,true,false).T;if(toward(off,S))right++;dsh.push(Math.abs(share(T0,S)-share(off,S)));
   by[S.c+'/'+S.mix.c]=(by[S.c+'/'+S.mix.c]||0)+1;if(/ on both halves/.test(T0.recipe.text)&&!/toward the/.test(T0.recipe.text))both++;if(/toward the (north|south|east|west)|patches of/.test(off.recipe.text)&&!/both halves/.test(off.recipe.text))words++}
  const md=dsh.reduce((a,b)=>a+b,0)/Math.max(1,dsh.length);
  ok(mixed.length>=12&&cl>=mixed.length*.9&&mir===cl,'a fight at a climates\' edge mixes its field\'s ground, both armies\' halves alike (TERRAIN_MIX.mirror): '+cl+' of '+mixed.length+' fields with the other climate\'s cells, '+mir+' mirrored cell for cell across the middle line, the same count in each half ('+Object.entries(by).map(([k,v])=>k+' '+v).join(', ')+')');
  ok(!vtN||vt>=vtN*.9,'the world\'s north or south still shows: '+vt+' of '+vtN+' fields whose other climate lies north or south with more of it on that side ('+hzN+' east or west: alike across)');
  ok(md<.08,'the world\'s share kept: the other\'s share of the field mirrored or not within '+(md*100).toFixed(1)+' points on average ('+dsh.length+' fields)');
  ok(both===cl,'its words say both halves, no side ('+both+' of '+cl+': "'+(mixed.length?at(mixed[0][0],mixed[0][1]).T.recipe.text.split('. ')[0]:'')+'")');
  // (the switch off: the world's own layout back, cell for cell as the world's weights and the noise lay it unmirrored, more of it
  // toward its side, its words a side)
  {let same=0,n=0;for(const [x,y,S] of mixed.slice(0,8)){const T0=at(x,y,true,false).T,m=T0.mix,X=t.TERRAIN_MIX,ns=T0.seed%997+X.seed,b=CL.indexOf(S.mix.c),H=T0.R*T0.cs;if(!m||m.mirror)continue;n++;let eq=true;
    for(let r=0;r<T0.R&&eq;r++)for(let c=0;c<T0.C;c++){const px=(c+.5)*T0.cs,py=(r+.5)*T0.cs,nz=t.noise(px/X.sc[0],py/X.sc[0],ns)*.65+t.noise(px/X.sc[1],py/X.sc[1],ns+1)*.35,o=t.mixShare(S.mix.w,px/BW,py/H)+X.amp*(nz-.5)>.5;if(o!==(!!T0.clim&&T0.clim[r*T0.C+c]===b)){eq=false;break}}if(eq)same++}
   ok(n>=6&&same===n&&right>=cl*.9&&words===cl,'TERRAIN_MIX.mirror off gives the world\'s layout back: '+same+' of '+n+' fields cell for cell as the world\'s weights lay them, '+right+' of '+cl+' with more of it toward where it lies, '+words+' worded by its side')}
  // (the share follows the world's: a tile deep in a climate has none, one on the border about half)
  const sh=mixed.map(([x,y])=>{const T0=at(x,y).T,b=CL.indexOf(WM.battleSite(x,y).mix.c);let n=0;for(let i=0;i<T0.clim.length;i++)if(T0.clim[i]===b)n++;return[WM.battleSite(x,y).mix.share,n/T0.clim.length]});
  const lo=sh.filter(s=>s[0]<.35),hi=sh.filter(s=>s[0]>=.42),m=a=>a.reduce((q,s)=>q+s[1],0)/Math.max(1,a.length);
  ok(!lo.length||!hi.length||m(hi)>m(lo),'more of the field the other\'s where the world has more of it: '+(m(lo)*100).toFixed(0)+'% of cells at a share under .35 ('+lo.length+'), '+(m(hi)*100).toFixed(0)+'% at .42 or more ('+hi.length+')');
  // (the art: the other's cells painted in its colours; the trees by the ecotone)
  const fx=mixed.find(([x,y,S])=>S.mix.c==='frost'||S.mix.c==='desert')||mixed[0];if(fx){const [x,y,S]=fx,{T:T0,env}=at(x,y),cv=t.PX.battleGround({...T0,climate:env.c}),d=cv.getContext('2d', { willReadFrequently: true }).getImageData(0,0,BW,BH).data,b=CL.indexOf(S.mix.c);
   const P1=t.PX.GROUND_PAL[env.c].base[1],P2=t.PX.GROUND_PAL[S.mix.c].base[1],hx=c=>[1,3,5].map(k=>parseInt(c.slice(k,k+2),16)),A=hx(P1),B2=hx(P2),dist=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);let near2=0,n2=0;
   for(const c of cellsOf(T0,i=>T0.kind[i]===0&&!T0.lvl[i])){const o=(Math.floor(c.y)*BW+Math.floor(c.x))*4,px=[d[o],d[o+1],d[o+2]],oth=T0.clim[c.i]===b;n2++;if(oth===dist(px,B2)<dist(px,A))near2++}
   ok(near2>=n2*.85,'painted: each open cell\'s middle nearer its own climate\'s ground colour ('+near2+' of '+n2+', '+env.c+'/'+S.mix.c+' at '+x+','+y+')')}}
 {const fw=scan((S,x,y)=>S.mix&&S.mix.share>.3&&S.mix.share<.7&&WM.kind[y*MW+x]===T_FOREST&&S.mix.c!=='desert'&&S.c!=='desert',5,6);let both=0;const got=[];
  for(const [x,y,S] of fw){const {T:T0,env}=at(x,y),cv=t.PX.battleGround({...T0,climate:env.c}),tr=cv.props.filter(p=>p.dk===1),O=new Set();
   for(const [sp] of t.PX.GROUND_PAL[S.mix.c].species)for(let v=0;v<3;v++)O.add(t.PX.battleTree(S.mix.c,sp,v));const n=tr.filter(p=>O.has(p.s)).length;got.push(n+'/'+tr.length);if(n>0&&n<tr.length)both++}
  ok(fw.length>=3&&both===fw.length,'woods at a climates\' edge mix their species as the map\'s ecotone (PX.WN_ECO): the other climate\'s trees among the field\'s own ('+got.join(', ')+' in '+fw.length+' forest fields)')}
 // ======== the ground's rules where each soldier stands; the weather the tile's
 {const R=t.RACES,frostHome=Object.keys(R).find(r=>R[r].home.includes('frost')),swampHome=Object.keys(R).find(r=>R[r].home.includes('swamp'));
  const mk=(c0,c,tk=T_OPEN)=>{const T0=t.buildTerrain({recipe:'open',layout:'plain',seed:91,W:BW,H:BH,top,bot,mix:{c0,c,t:tk,w:[.9,.9,.9,.5,.5,.5,.1,.1,.1]}});return T0};
  const u=(T0,ci,race,mounted)=>{const c=cellsOf(T0,i=>T0.clim[i]===ci&&T0.kind[i]===0&&!T0.lvl[i])[0];return{x:c.x,y:c.y,s:{spd:50,mounted:!!mounted},unit:{race},dir:0,hp:1}};
  const ratio=(T0,a,b,race,m)=>T0.speedFor(u(T0,b,race,m),1,0)/T0.speedFor(u(T0,a,race,m),1,0);
  const Tf=mk('grass','frost'),Ts=mk('grass','swamp'),Tg=mk('frost','grass'),G0=CL.indexOf('grass'),F0=CL.indexOf('frost'),S0=CL.indexOf('swamp');
  const r1=ratio(Tf,G0,F0,'human'),r2=ratio(Tf,G0,F0,'human',true),r3=ratio(Tf,G0,F0,frostHome),r4=ratio(Ts,G0,S0,'human'),r5=ratio(Ts,G0,S0,'human',true),r6=ratio(Ts,G0,S0,swampHome),r7=ratio(Tg,F0,G0,'human',true);
  const near=(a,b)=>Math.abs(a-b)<1e-9;
  ok(near(r1,.85)&&near(r2,.85/1.15)&&near(r3,1)&&near(r4,.8)&&near(r5,.65/1.15)&&near(r6,1)&&near(r7,1.15/.85),'speed by the ground under each soldier (CLIM_GROUND): on a grass field\'s snow ×'+r1.toFixed(3)+' on foot, ×'+r2.toFixed(3)+' riding (no gallop), ×'+r3+' for '+frostHome+'s; in its mud ×'+r4.toFixed(3)+', riders ×'+r5.toFixed(3)+', '+swampHome+'s ×'+r6+'; on a snow field\'s grass a rider ×'+r7.toFixed(3));
  const Tw=mk('grass','frost',T_FOREST);ok(near(ratio(Tw,G0,F0,'human'),1),'none on a forest\'s or a hill\'s tile (their ground is the terrain\'s), as envStats');
  {const fu=u(Tf,F0,'human'),lab=Tf.label([fu,{...fu}]);ok(/In the snow/.test(lab),'the HUD says where they stand: "'+lab+'"')}
  // (the weather and the heat are the tile's: battleEnv and envStats read its climate alone)
  const S=scan(S=>S.mix&&S.mix.c==='desert'&&S.c==='grass',1,1)[0];if(S){const env=t.battleEnv(false,S[2]),st=t.envStats({spd:50,cd:1,mounted:false},'human',env);ok(env.c==='grass'&&st.cd===1,'the weather is the tile\'s: a grass fight by the desert is grass (battleEnv '+env.c+'), no desert heat (cd ×'+st.cd+')')}}

 // ======== beside a holding: its buildings and fields, on their side, the zones clear
 {const vs=scan(S=>S.lots&&S.lots.some(l=>(l.k==='farm'||l.k==='pasture')&&l.plots.length),17,24);let placed=0,side=0,sideN=0,zone=0,fair=0,solid=0,sight=0,withH=0,fields=0,crops=0,crop=0,fence=0,foot=0,front=0,hN=0;
  for(const [x,y,S] of vs){const {T:T0}=at(x,y),B=T0.recipe.built;if(!B||!T0.built)continue;placed++;
   for(const h of B.houses){const l=S.lots.find(q=>q.seed===h.seed&&q.k===h.k),cx=l.dx+l.n/2-.5,cy=l.dy+l.n/2-.5,hx=h.x+h.w/2-BW/2,hy=h.y+h.h/2-(top+bot)/2;
    if(Math.abs(cx)>=1.5){sideN++;if(Math.sign(cx)===Math.sign(hx))side++}if(Math.abs(cy)>=1.5){sideN++;if(Math.sign(cy)===Math.sign(hy))side++}}
   if(!cellsOf(T0,i=>T0.built[i]).some(c=>inZone(c.x)))zone++;if(T0.fair(BW,top,bot).ok)fair++;
   // (2x the world's model: a footprint of cell x scale cells a side, its cells the building's; a building's width before each zone clear)
   const BT=t.TERRAIN_BUILT,sz=BT.cell.map(n=>n*BT.scale*T0.cs);hN+=B.houses.length;if(B.houses.every(h=>h.s===BT.scale&&h.w===h.h&&sz.includes(h.w))&&cellsOf(T0,i=>T0.built[i]===1).length===B.houses.reduce((a,h)=>a+h.w*h.h,0)/(T0.cs*T0.cs))foot++;
   if(!cellsOf(T0,i=>T0.built[i]===1).some(c=>c.x>=zones[0].x1&&c.x<zones[0].x1+BT.front||c.x<zones[1].x0&&c.x>=zones[1].x0-BT.front))front++;
   const hc=cellsOf(T0,i=>T0.built[i]===1);if(hc.length)withH++;if(hc.length&&hc.every(c=>T0.route.foot.cost[c.i]===0&&T0.solid[c.i]===1))solid++;if(hc.length&&hc.every(c=>T0.sh[c.i]===t.SIGHT.wall))sight++;
   if(B.fields.length)fields++;if(B.fields.some(p=>!p.pen))crops++;
   const cc=cellsOf(T0,i=>T0.built[i]===2)[0],fc=cellsOf(T0,i=>T0.built[i]===3)[0],u=c=>({x:c.x,y:c.y,s:{spd:50},unit:{race:'human'},dir:0});
   if(cc&&Math.abs(T0.speedFor(u(cc),1,0)-.9)<1e-9)crop++;if(fc&&Math.abs(T0.speedFor(u(fc),1,0)-.55)<1e-9&&T0.flag(u(fc),'thin'))fence++}
  ok(vs.length>=12&&placed>=vs.length*.85,'a fight beside a holding\'s fields shows what stands there: '+placed+' of '+vs.length+' fields with its buildings, '+fields+' with its fields');
  ok(sideN>0&&side>=sideN*.9,'each where it lies off the fight\'s tile: '+side+' of '+sideN+' buildings a tile and a half or more off it on that side of the field');
  ok(zone===placed&&fair===placed,'both deployment zones clear of them ('+zone+' of '+placed+') and every field fair: an open lane, both sides reach each other ('+fair+' of '+placed+')');
  ok(foot===placed&&hN>0,'buildings stand twice the world\'s model size: a footprint of '+t.TERRAIN_BUILT.cell.map(n=>n*t.TERRAIN_BUILT.scale*16).join(' or ')+' px a side ('+hN+' buildings), its cells closed whole ('+foot+' of '+placed+' fields)');
  ok(front===placed,'neither army deploys with a building at its front: none within '+t.TERRAIN_BUILT.front+' px of either deployment zone ('+front+' of '+placed+')');
  ok(withH&&solid===withH&&sight===withH,'a building bars the way (closed on the route grids, solid: '+solid+') and hides what lies behind it ('+sight+')');
  ok(crops&&crop===crops&&fence>0,'crop rows slow a little (×.9 on foot: '+crop+' of '+crops+' fields), a fence more and breaks ranks (×.55, thin: '+fence+')');
  const pv=vs.find(([x,y])=>at(x,y).T.recipe.built);if(pv){const {T:T0,env}=at(pv[0],pv[1]),cv=t.PX.battleGround({...T0,climate:env.c}),hs=cv.props.filter(p=>p.dk===5);
   // (crisp at 2x: every 2x2 block of its picture one pixel of the model's)
   const crisp=s=>{const d=s.getContext('2d', { willReadFrequently: true }).getImageData(0,0,s.width,s.height).data,w=s.width;if(w%2||s.height%2)return false;for(let y=0;y<s.height;y+=2)for(let x=0;x<w;x+=2){const o=(y*w+x)*4;for(const q of [o+4,o+w*4,o+w*4+4])for(let k=0;k<4;k++)if(d[q+k]!==d[o+k])return false}return true};
   ok(hs.length===T0.recipe.built.houses.length&&hs.every(p=>p.s&&p.s.width>=32&&crisp(p.s)),'painted: each building a standing prop (dk 5, '+hs.length+'), the world\'s own model'+(t.PX.buildingModel?'':' (none here: a plain block)')+' drawn at 2x, each pixel a crisp 2x2 block ('+hs.map(p=>p.s.width+'x'+p.s.height).join(', ')+')')}
  // (it sits in the field's ground: round each building (the field painted with its props) the pixels just outside its silhouette
  // near the field's ground there (painted without what stands by the fight: the mean colour of that ring, either way), and no
  // straight run of an odd colour along a cell edge round it (no flat square: across each cell line through its footprint and a
  // cell round it, 6 px (3 of the model's) or more off its silhouette (its walls' feet and contact shade are its own), no 8 px running one way more than 14 in light where the field without it does not))
  {const ring=[],runs=[];let nH=0;for(const [x,y] of vs.slice(0,8)){const {T:T0,env}=at(x,y);if(!T0.recipe.built||!T0.recipe.built.houses.length)continue;
    const cv=t.PX.battleGround({...T0,climate:env.c}),rf=t.PX.battleGround({...T0,built:null,recipe:{...T0.recipe,built:null},climate:env.c}),pg=document.createElement('canvas');pg.width=BW;pg.height=BH;
    const g=pg.getContext('2d', { willReadFrequently: true });t.PX.battleProps(g,cv);const pa=g.getImageData(0,0,BW,BH).data;g.globalCompositeOperation='destination-over';g.drawImage(cv,0,0);g.globalCompositeOperation='source-over';const d=g.getImageData(0,0,BW,BH).data,r=rf.getContext('2d', { willReadFrequently: true }).getImageData(0,0,BW,BH).data,L=(a,o)=>a[o]*.3+a[o+1]*.59+a[o+2]*.11;
    for(const p of cv.props.filter(p=>p.dk===5)){nH++;const sw=p.s.width,sh=p.s.height,sa=p.s.getContext('2d', { willReadFrequently: true }).getImageData(0,0,sw,sh).data,sil=(X,Y)=>{const u=X-p.dx,v=Y-p.dy;return u>=0&&v>=0&&u<sw&&v<sh&&sa[(v*sw+u)*4+3]>0},near=(X,Y,k=3)=>{for(let b=-k;b<=k;b++)for(let a=-k;a<=k;a++)if(sil(X+a,Y+b))return true;return false};
     const A=[0,0,0],B=[0,0,0];let n=0;for(let Y=p.dy-3;Y<p.dy+sh+3;Y++)for(let X=p.dx-3;X<p.dx+sw+3;X++){if(X<0||Y<0||X>=BW||Y>=BH||sil(X,Y))continue;if(!near(X,Y))continue;const o=(Y*BW+X)*4;for(let k=0;k<3;k++){A[k]+=d[o+k];B[k]+=r[o+k]}n++}
     ring.push(n?Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2])/n:0);
     const cs=T0.cs,x0=Math.floor(p.dx/cs)*cs-cs,y0=Math.floor(p.dy/cs)*cs-cs,x1=Math.ceil((p.dx+sw)/cs)*cs+cs,y1=Math.ceil((p.dy+sh)/cs)*cs+cs;let worst=0;
     const scan=(len,at)=>{let run=0,sg=0;for(let s=0;s<len;s++){const q=at(s);if(!q){run=0;continue}const dl=L(d,q[0])-L(d,q[1]),dr=L(r,q[0])-L(r,q[1]),z=Math.abs(dl)>14&&Math.abs(dl-dr)>14?Math.sign(dl):0;if(z&&z===sg)run++;else run=z?1:0;sg=z;if(run>worst)worst=run}};
     const pr=(X,Y)=>pa[(Y*BW+X)*4+3]>0,fd=(X,Y)=>{const c=Math.floor(X/cs),q=Math.floor(Y/cs);return c>=0&&q>=0&&c<T0.C&&q<T0.R&&T0.built[q*T0.C+c]>1},ok2=(X,Y)=>X>=1&&Y>=1&&X<BW-1&&Y<BH-1&&!fd(X,Y)&&!fd(X-1,Y)&&!fd(X,Y-1)&&!pr(X,Y)&&!pr(X-1,Y)&&!pr(X,Y-1);
     for(let X=x0;X<=x1;X+=cs)scan(y1-y0,s=>{const Y=y0+s;return ok2(X,Y)&&!near(X,Y,6)&&!near(X-1,Y,6)?[(Y*BW+X)*4,(Y*BW+X-1)*4]:null});
     for(let Y=y0;Y<=y1;Y+=cs)scan(x1-x0,s=>{const X=x0+s;return ok2(X,Y)&&!near(X,Y,6)&&!near(X,Y-1,6)?[(Y*BW+X)*4,((Y-1)*BW+X)*4]:null});runs.push(worst)}}
   ok(nH>=4&&ring.every(v=>v<24)&&runs.every(v=>v<8),'each building sits in the field\'s ground ('+nH+' buildings): the ring just outside its silhouette within '+Math.round(Math.max(...ring))+' of the field\'s colour there (its mean: '+ring.map(v=>v.toFixed(0)).join(' ')+'), no straight run along a cell edge round it (a field\'s rows and fences and whatever else stands aside: longest '+Math.max(...runs)+' px)')}}

 // ======== a brook, a pond, an oasis
 {const bk=scan((S,x,y)=>S.brook&&!S.river&&!S.pond&&S.c!=='desert'&&!S.kinds.some((k,i)=>i!==4&&k===T_WATER),23,20);let st=0,fd=0,fr=0;
  for(const [x,y] of bk){const {g,T:T0}=at(x,y);if(g.river&&g.river.stream)st++;if(T0.has.water&&!T0.kind.includes(K.deep)&&T0.recipe.river&&T0.recipe.river.stream)fd++;if(T0.fair(BW,top,bot).ok)fr++}
  ok(bk.length>=10&&st===bk.length&&fd===bk.length&&fr===bk.length,'a fight by a brook: a stream down the field ('+st+' of '+bk.length+'), all ford, crossed anywhere (no deep water: '+fd+'), the field fair ('+fr+')');
  const off=bk.slice(0,6).filter(([x,y])=>!at(x,y,false).g.river||!at(x,y,false).g.river.stream||WM.battleSite(x,y).c==='swamp').length;info('the same tiles with TERRAIN_WORLD off: '+off+' of '+Math.min(6,bk.length)+' with no stream (a swamp\'s by its chance)')}
 {const pd=scan((S,x,y)=>S.pond&&S.pond.kind!=='oasis'&&S.c!=='desert'&&S.kinds.every((k,i)=>k!==T_WATER||S.pond.at.includes(i))&&!S.river&&!S.brook,3,24);let ok1=0,mid=0,mar=0,wd=0;const kinds={};
  for(const [x,y,S] of pd){const {g,T:T0}=at(x,y),P=T0.recipe.ponds;kinds[S.pond.kind]=(kinds[S.pond.kind]||0)+1;if(!(g.river&&'bridge' in g.river)&&g.pond&&P&&P.length)ok1++;if(P&&P.every(p=>Math.abs(p.x-BW/2)<BW*.15))mid++;if(T0.kind.includes(K.marsh))mar++;if(new RegExp(t.TERRAIN_WORDS.pond[S.pond.kind]).test(T0.recipe.text))wd++}
  ok(pd.length>=8&&ok1===pd.length&&mid===pd.length&&mar===pd.length&&wd===pd.length,'a fight by a pond: its pool in a marsh on the field ('+ok1+' of '+pd.length+': '+Object.entries(kinds).map(([k,v])=>k+' '+v).join(', ')+'), in the middle of its width ('+mid+'), its water no river (a frost field\'s frozen river by its chance as ever); the words name it ('+wd+')');
  if(pd.length){const [x,y]=pd[0],{T:T0,env}=at(x,y),cv=t.PX.battleGround({...T0,climate:env.c}),d=cv.getContext('2d', { willReadFrequently: true }).getImageData(0,0,BW,BH).data,p=T0.recipe.ponds[0],o=(Math.round(p.y)*BW+Math.round(p.x))*4,W2=t.PX.GROUND_PAL[env.c].water.map(c=>[1,3,5].map(k=>parseInt(c.slice(k,k+2),16)));
   ok(W2.some(c=>Math.hypot(d[o]-c[0],d[o+1]-c[1],d[o+2]-c[2])<40),'painted: open water in its middle ('+[d[o],d[o+1],d[o+2]].join(',')+')')}
  const oa=scan((S,x,y)=>S.pond&&S.pond.kind==='oasis'&&S.c==='desert'&&WM.kind[y*MW+x]!==T_HILL,1,4);if(oa.length){const ds=oa.map(([x,y])=>at(x,y).g);ok(ds.every(g=>g.recipe==='desert'&&g.oasis&&!g.pond&&!g.river),'a desert fight by an oasis keeps the desert\'s rule: its oasis, no pond of its own, no river ('+oa.length+' tiles)')}}

 // ======== a lane: trees close along its track
 {const ln=scan((S,x,y)=>S.lane&&!S.lane.track&&S.road&&WM.kind[y*MW+x]!==T_HILL,3,10),tr=scan((S,x,y)=>S.lane&&S.lane.track&&S.lane.wood>=4,3,10);
  const woodBy=T0=>{const ways=(T0.ways||[]).filter(w=>w.kind==='road');let n=0,w=0;for(const wy of ways)for(const [px,py] of wy.p){if(px<0||px>=BW||py<top||py>=bot||inZone(px))continue;for(const d of [-36,36]){const k=T0.kindAt(px,py+d);n++;if(k===K.wood)w++}}return n?w/n:0};
  let more=0,road=0,all=0;const sh=[],miss=[];for(const [x,y] of [...ln,...tr]){const a=at(x,y),b=at(x,y,false);if(a.g.recipe!=='forest')continue;all++;if((a.T.ways||[]).some(w=>w.kind==='road'))road++;else miss.push(x+','+y+' '+J(a.g.road)+' river '+!!a.T.recipe.river+' ways '+J((a.T.ways||[]).map(w=>w.kind)));const wa=woodBy(a.T),wb=woodBy(b.T);sh.push(wa.toFixed(2)+'/'+wb.toFixed(2));if(wa>wb)more++}
  if(miss.length)info('no road: '+miss.join(' | '));
  ok(all>=6&&road===all&&more>=all*.8,'a fight on a road through a wood (a lane) or a track in one: its way through the trees ('+road+' of '+all+'), the woods closer along it than a road\'s verge left them ('+more+' of '+all+' more wood 36 px off its line: '+sh.slice(0,6).join(' ')+')')}
}}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{t.TERRAIN_WORLD.on=on0;t.TERRAIN_MIX.mirror=mr0;ev('TERRAIN.on='+keep[0]+';FIELD_SIZES.on='+keep[1]);t.fieldSet(null);ev('BW='+keep[2]+';BH='+keep[3])}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
