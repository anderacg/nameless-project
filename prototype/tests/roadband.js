'use strict';
// The road's band (world/roadband.js; the owner, 2026-10-23: "sometimes my character even stands on the road but the game still
// reads it as swamp"): a road's speed follows the road as drawn (gfx/worldart.js artRoadSegs), not its tiles. On a diagonal stretch,
// on the drawn line where the tile is the land's, road speed; over the shoulder, between the land's and the road's; far off,
// the land's (the band's widths 0: the tile rule); water never passable; an estate's track a little slower (ROAD_BAND.trackSpeed);
// regionAt names the road there. By road (world.js setByRoad: a mode, P.byRoad; the action ring's By road, key B): while it is
// on, a plain click's way, drawn and walked, keeps to the roads between two holdings across a swamp, more of it on the road than
// the plain way; it stays on for the next trip, and across a save and a load; the day bar shows it; with no road near, a trip
// goes the plain way, quietly.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,TL=t.TILE,RB=t.ROAD_BAND,RN=t.REGION_NAMES;
 Kit.begin('soldier',4242);Kit.clear();Kit.world({encCool:99});t.setSpeed(1);P.troops={hum_levy:4};P.bsta=100;
 const A={tramples:[]};t.artGenPlan(A,()=>{});const S=A.segs,E=A.segEst,NS=S.length/5;
 ok(NS>100&&E.length===NS&&E.some(v=>v)&&E.some(v=>!v),'the roads as drawn: '+NS+' segments, '+E.filter(v=>v).length+' of them estates\' tracks');
 // (the land's own speed: the band's widths 0 for a moment, so the tile rule)
 const bare=fn=>{const g=RB.great,k=RB.track;RB.great=[0,0];RB.track=[0,0];t.RoadBand.build();try{return fn()}finally{RB.great=g;RB.track=k;t.RoadBand.build()}};
 // (the nearest drawn line of each sort to (x, y): px to a road's (and whether a great road's) and to an estate's track's)
 const near=(x,y)=>{const o={road:1e9,great:false,est:1e9};for(let k=0,j=0;k<S.length;k+=5,j++){const a=S[k],b=S[k+1],vx=S[k+2]-a,vy=S[k+3]-b,L=vx*vx+vy*vy,u=L?Math.max(0,Math.min(1,((x-a)*vx+(y-b)*vy)/L)):0,d=Math.hypot(x-a-vx*u,y-b-vy*u);
   if(E[j]){if(d<o.est)o.est=d}else if(d<o.road){o.road=d;o.great=!!(S[k+4]&1)}}return o};
 const land=(x,y)=>{const k=t.terrAt(x,y);return t.passable(k)&&k!==t.T_ROAD&&k!==t.T_FORD};
 // (points on the drawn line of diagonal stretches, est: of estates' tracks, where the tile is the land's)
 const diag=est=>{const out=[];for(let k=0,j=0;k<S.length;k+=5,j++){if(S[k+4]>1||!!E[j]!==est)continue;const a=S[k],b=S[k+1],vx=S[k+2]-a,vy=S[k+3]-b,L=Math.hypot(vx,vy);if(L<6||Math.abs(vx)<.4*L||Math.abs(vy)<.4*L)continue;
   for(let s=0;s<=L;s+=3){const x=a+vx*s/L,y=b+vy*s/L;if(land(x,y))out.push([x,y,-vy/L,vx/L])}}return out};
 const R=diag(false).filter(([x,y])=>near(x,y).est>24),T2=diag(true).filter(([x,y])=>near(x,y).road>24);
 // ---- on the drawn road
 {const was=bare(()=>R.map(([x,y])=>t.speedAt(x,y))),now=R.map(([x,y])=>t.speedAt(x,y)),hum=R.map(([x,y])=>t.speedAt(x,y,'human'));
  const slow=was.filter(v=>v<1.3).length;
  ok(R.length>=50&&now.every(v=>v===RB.speed)&&hum.every(v=>Math.abs(v-RB.speed*RB.human)<1e-9),'on the drawn line of a road\'s diagonal stretches, where the tile is the land\'s ('+R.length+' points): road speed '+RB.speed+' (humans '+(RB.speed*RB.human).toFixed(2)+'), every one; by the tiles alone '+slow+' of them were slower (mean '+(was.reduce((s,v)=>s+v,0)/was.length).toFixed(2)+')');
  const rg=R.filter(([x,y])=>{const r=t.regionAt(x,y);return r.road===1&&r.name===RN[r.c][t.T_ROAD]&&r.t===t.terrAt(x,y)}).length;
  ok(rg===R.length,'regionAt there names the road (Road, Causeway, Desert road, Frozen road by its climate), its kind the tile\'s ('+rg+' of '+R.length+')')}
 // ---- the shoulder: across the line, road speed within its full width, blended to the land's over the shoulder, the land's
 // beyond; as the field reads it, a ROAD_BAND.cell px square at a time (from its middle: the most of every road's weight there)
 {let n=0,mid=0,full=0,off=0;const bad=[],pts=[],cs=RB.cell;for(const [x,y,px,py] of R)for(const sg of [-1,1])for(let o=0;o<=26;o+=1.5){const X=x+px*o*sg,Y=y+py*o*sg;if(land(X,Y))pts.push([X,Y])}
  const was=bare(()=>pts.map(([X,Y])=>t.speedAt(X,Y)));
  const weight=(x,y)=>{let w=0;for(let k=0,j=0;k<S.length;k+=5,j++){if(E[j])continue;const [f,sh]=S[k+4]&1?RB.great:RB.track,a=S[k],b=S[k+1],vx=S[k+2]-a,vy=S[k+3]-b,L=vx*vx+vy*vy,u=L?Math.max(0,Math.min(1,((x-a)*vx+(y-b)*vy)/L)):0,d=Math.hypot(x-a-vx*u,y-b-vy*u);
   if(d<f+sh)w=Math.max(w,d<=f?63:Math.round(63*(f+sh-d)/sh))}return w};
  pts.forEach(([X,Y],i)=>{const cx=(Math.floor(X/cs)+.5)*cs,cy=(Math.floor(Y/cs)+.5)*cs;if(near(cx,cy).est<RB.track[0]+RB.track[1]+2)return;const w=weight(cx,cy),v=t.speedAt(X,Y),l=was[i];n++;
   const want=w===63?RB.speed:w?Math.max(l,l+(RB.speed-l)*w/63):l;if(w===63)full++;else if(!w)off++;else if(want>l&&want<RB.speed)mid++;
   if(Math.abs(v-want)>1e-9)bad.push(near(X,Y).road.toFixed(1)+' px: '+v.toFixed(3)+' for '+want.toFixed(3)+' (land '+l.toFixed(3)+')')});
  ok(n>500&&mid>100&&full>100&&off>100&&!bad.length,'across the line ('+n+' points): road speed within '+RB.great[0]+' px of a great road\'s line ('+RB.track[0]+' of a track\'s: '+full+' points), the land\'s past the shoulder '+RB.great[1]+' px more ('+off+'), between them over it ('+mid+'), in '+cs+' px squares'+(bad.length?': '+bad.slice(0,4).join('; '):''))}
 // ---- far off, the land's; water never passable
 {let n=0;const bad=[];const pts=[];for(let i=0;i<3000;i++){const x=(i*7919%(t.MW*TL)),y=(i*104729%(t.MH*TL));pts.push([x,y])}
  const was=bare(()=>pts.map(([x,y])=>[t.speedAt(x,y),t.speedAt(x,y,'human'),t.speedAt(x,y,'orc'),t.regionAt(x,y).name]));
  pts.forEach(([x,y],i)=>{const q=near(x,y);if(Math.min(q.road,q.est)<RB.great[0]+RB.great[1]+3||t.terrAt(x,y)===t.T_ROAD)return;n++;const w=was[i];if(t.speedAt(x,y)!==w[0]||t.speedAt(x,y,'human')!==w[1]||t.speedAt(x,y,'orc')!==w[2]||t.regionAt(x,y).name!==w[3])bad.push(Math.round(x)+','+Math.round(y))});
  ok(n>1000&&!bad.length,'far from every road ('+n+' points): the land\'s speed for anyone (orcs, humans, none) and its own name, as by the tiles'+(bad.length?': not at '+bad.slice(0,5).join(' '):''));
  let wet=0,dry=[];for(let ty=0;ty<t.MH;ty++)for(let tx=0;tx<t.MW;tx++){if(t.tAt(tx,ty)!==t.T_WATER)continue;for(const [a,b] of [[2,2],[8,8],[14,14],[2,14],[14,2]]){const x=tx*TL+a,y=ty*TL+b;if(!t.RoadBand.at(x,y))continue;wet++;if(t.speedAt(x,y)!==0||t.speedAt(x,y,'human')!==0||t.regionAt(x,y).road)dry.push(tx+','+ty)}}
  ok(wet>50&&!dry.length,'water within a road\'s band ('+wet+' points by bridges and shores): never passable, never the road'+(dry.length?': '+dry.slice(0,5).join(' '):''))}
 // ---- in the swamp (the owner's shot: "Swamp" read on the road): on the drawn line where the tile is swamp, its way's speed
 {const sw=R.concat(T2).filter(([x,y])=>t.climAt(x,y)==='swamp'),was=bare(()=>sw.map(([x,y])=>t.speedAt(x,y))),now=sw.map(([x,y])=>t.speedAt(x,y)),want=sw.map(([x,y])=>near(x,y).est<1?RB.trackSpeed:RB.speed);
  ok(sw.length>=4&&now.every((v,i)=>v===want[i])&&was.every(v=>v<=.5),'on the drawn line through the swamp, where the tile is swamp ('+sw.length+' points): its way\'s speed ('+[...new Set(now)].join(', ')+'), by the tiles alone '+[...new Set(was)].join(', ')+'; regionAt '+[...new Set(sw.map(([x,y])=>t.regionAt(x,y).name))].join(', '))}
 // ---- an estate's track: a little slower than a road, its own name
 {const now=T2.map(([x,y])=>t.speedAt(x,y)),hum=T2.map(([x,y])=>t.speedAt(x,y,'human')),nm=T2.filter(([x,y])=>{const r=t.regionAt(x,y);return r.road===2&&r.name===t.TRACK_NAMES[r.c]}).length;
  ok(T2.length>=20&&now.every(v=>v===RB.trackSpeed)&&hum.every(v=>Math.abs(v-RB.trackSpeed*RB.human)<1e-9)&&RB.trackSpeed<RB.speed,'on the drawn line of an estate\'s track ('+T2.length+' points): '+RB.trackSpeed+' (humans '+(RB.trackSpeed*RB.human).toFixed(3)+'), a little slower than a road\'s '+RB.speed);
  ok(nm===T2.length,'and regionAt calls it a track (Track, Swamp track…: '+nm+' of '+T2.length+')')}
 // ---- by road: two holdings with a road between, the straight line over swamp
 const pairs=[];for(const r of t.WM.roads){if(!r.a||!r.b||r.est)continue;const h1=t.townBy(r.a),h2=t.townBy(r.b);if(!h1||!h2)continue;const d=Math.hypot(h1.x-h2.x,h1.y-h2.y);if(d<15*TL||d>45*TL)continue;
  let s=0;for(let i=0;i<=40;i++)if(t.climAt(h1.x+(h2.x-h1.x)*i/40,h1.y+(h2.y-h1.y)*i/40)==='swamp')s++;if(s>=12)pairs.push([h1,h2,s/41])}
 pairs.sort((a,b)=>b[2]-a[2]);
 const onShare=w=>w.X.filter((x,i)=>t.regionAt(x,w.Y[i]).road).length/w.n;
 const march=n=>Kit.frames(n,.05,dt=>t.marchStep(dt*t.WORLD_PACE),()=>P.tx==null||G.mode!=='world');
 if(!pairs.length)info('no two holdings with a road between them across a swamp');
 const pill=()=>!!document.querySelector('#underway [data-k="road"]');
 // what was said on the screen since (system lines are toasts, not the journal: state.js toast)
 const told=()=>new Set(document.querySelectorAll('#log>div')),toldSince=s=>[...document.querySelectorAll('#log>div')].filter(d=>!s.has(d)).map(d=>d.textContent);
 for(const [h1,h2,sw] of pairs.slice(0,1)){const s1=t.gateSpot(h1),s2=t.gateSpot(h2),from=on=>{Kit.clear();Kit.world({encCool:99});Kit.goTo(s1.x,s1.y);G.lastTown=h1;P.bsta=100;P.stuck=0;G.chase=null;t.setByRoad(on)};
  from(false);t.worldGo(s2.x,s2.y);t.wuiSync(performance.now());const w0=t.WUI.way,p0=onShare(w0);
  const said=told();from(true);t.worldGo(s2.x,s2.y);t.wuiSync(performance.now());const w1=t.WUI.way,p1=onShare(w1);
  ok(P.byRoad===true&&G.byRoad&&G.byRoad.on&&w1!==w0&&w1.ok&&p1>p0&&p1>.9&&toldSince(said).some(m=>/keeps to the roads/.test(m)),h1.name+' to '+h2.name+' ('+Math.round(sw*100)+'% swamp on the straight line): by-road mode on, a plain click\'s way drawn keeps to the roads, '+Math.round(p1*100)+'% of it on them (the plain way '+Math.round(p0*100)+'%), and the log says it is on');
  t.updateHUD(true);ok(pill(),'Under way shows By road while it is on ('+(document.querySelector('#underway [data-k="road"]')||{}).textContent+')');
  let on=0;const f1=Kit.frames(20000,.05,dt=>{t.marchStep(dt*t.WORLD_PACE);if(t.regionAt(P.x,P.y).road)on++},()=>P.tx==null||G.mode!=='world'),end=Math.hypot(P.x-s2.x,P.y-s2.y);
  // (still on for the next trip: back the way you came, a plain click again)
  const back=P.byRoad===true;G.lastTown=h2;t.worldGo(s1.x,s1.y);t.wuiSync(performance.now());const p2=onShare(t.WUI.way);
  from(false);t.worldGo(s2.x,s2.y);let on0=0;const f0=Kit.frames(20000,.05,dt=>{t.marchStep(dt*t.WORLD_PACE);if(t.regionAt(P.x,P.y).road)on0++},()=>P.tx==null||G.mode!=='world');
  ok(end<3&&on/f1>on0/f0,'your band walks it there: '+Math.round(on/f1*100)+'% of its steps on the road (the plain way '+Math.round(on0/f0*100)+'%), '+t.Clock.hoursIn(f1*.05*t.WORLD_PACE).toFixed(1)+' h (the plain way '+t.Clock.hoursIn(f0*.05*t.WORLD_PACE).toFixed(1)+' h)');
  ok(back&&p2>.9,'arrived, it stays on: the next plain click (back again) keeps to the roads too ('+Math.round(p2*100)+'% on them)');
  t.updateHUD(true);ok(!P.byRoad&&!('byRoad' in P)&&!pill(),'turned off: the plain way again, no By road on the day bar, nothing of it on you (a save as before)')}
 // ---- key B: by-road mode on, then off, whatever you are doing
 if(pairs.length){const [h1,h2]=pairs[0],s1=t.gateSpot(h1),s2=t.gateSpot(h2);Kit.clear();Kit.world({encCool:99});Kit.goTo(s1.x,s1.y);t.setByRoad(false);
  Kit.key('KeyB','b');const on=P.byRoad===true;t.worldGo(s2.x,s2.y);const trip=t.byRoadTo(P.tx,P.ty);Kit.key('KeyB','b');const off=!P.byRoad&&!t.byRoadTo(P.tx,P.ty);P.tx=null;Kit.key('KeyB','b');const idle=P.byRoad===true;Kit.key('KeyB','b');
  ok(on&&trip&&off&&idle&&!P.byRoad,'key B turns by-road mode on (the trip after it keeps to the roads), and off again (that trip the plain way); standing still too');P.tx=null}
 // ---- by road near the road (the owner, 2026-10-23: from the road to a farm a few tiles off it, the way went on along the road
 // and then across; "find the shortest path and prefer the road"): your band's own mild preference (ROAD_GO.keep), not a
 // caravan's (WAY.keep): the way cuts across, about as short as the plain way, where the caravans' keeping would detour
 {const len=w=>{let s=0;for(let i=1;i<w.n;i++)s+=Math.hypot(w.X[i]-w.X[i-1],w.Y[i]-w.Y[i-1]);return s};let tried=0,good=0,detour=0,worst=0;
  const way=(on,keep,x,y)=>{t.setByRoad(on);t.ROAD_GO.keep=keep;t.worldGo(x,y);t.wuiSync(performance.now());const w=t.WUI.way;P.tx=null;return w&&w.ok?len(w):null},k0=t.ROAD_GO.keep;
  for(let ty=20;ty<t.MH-20&&tried<12;ty+=7)for(let tx=20;tx<t.MW-20&&tried<12;tx+=7){if(t.tAt(tx,ty)!==t.T_ROAD)continue;
   for(const [dx,dy] of [[-5,-5],[5,-5],[-5,5],[5,5]]){const gx=tx+dx,gy=ty+dy;if(t.tAt(gx,gy)!==t.T_OPEN||t.occAt(gx,gy)||t.roadNear((gx+.5)*TL,(gy+.5)*TL,2))continue;
    Kit.clear();Kit.world({encCool:99});Kit.goTo((tx+.5)*TL,(ty+.5)*TL);G.chase=null;const X=(gx+.5)*TL,Y=(gy+.5)*TL;
    const plain=way(false,k0,X,Y),mild=way(true,k0,X,Y),strict=way(true,t.WAY.keep,X,Y);t.ROAD_GO.keep=k0;if(!plain||!mild||!strict)continue;
    tried++;if(mild<=plain*1.25)good++;if(strict>plain*1.25)detour++;worst=Math.max(worst,mild/plain);break}}
  t.setByRoad(false);
  ok(tried>=6&&good===tried,'by road from the road to a spot 5 tiles off it, diagonally: the way cuts across, at most a quarter longer than the plain way (where the road is as quick) ('+good+' of '+tried+'; the longest '+Math.round((worst-1)*100)+'% more; the caravans’ strict keeping would have detoured in '+detour+')')}
 // ---- no road near: the plain way, quietly
 {let a=null,b=null;for(let ty=12;ty<t.MH-12&&!b;ty+=3)for(let tx=12;tx<t.MW-12&&!b;tx+=3){if(t.tAt(tx,ty)!==t.T_OPEN||t.roadNear((tx+.5)*TL,(ty+.5)*TL,t.ROAD_GO.near+2))continue;
   if(!a)a=[(tx+.5)*TL,(ty+.5)*TL];else if(Math.hypot((tx+.5)*TL-a[0],(ty+.5)*TL-a[1])<10*TL&&t.Router.reach({x:a[0],y:a[1]},{x:(tx+.5)*TL,y:(ty+.5)*TL}))b=[(tx+.5)*TL,(ty+.5)*TL]}
  if(!b)info('no two spots far from every road');
  else{Kit.clear();Kit.world({encCool:99});Kit.goTo(a[0],a[1]);t.setByRoad(true);const said=told(),said0=G.msgs.length;t.worldGo(b[0],b[1]);const plain=!t.byRoadTo(P.tx,P.ty),f=march(3000),said2=[...G.msgs.slice(said0).map(m=>m.m),...toldSince(said)].filter(m=>/road/i.test(m));
   ok(plain&&P.byRoad===true&&G.byRoad==null&&Math.hypot(P.x-b[0],P.y-b[1])<3&&!said2.length,'by-road mode on with no road within '+t.ROAD_GO.near+' tiles: the plain way there ('+f+' frames), still on, and nothing in the log'+(said2.length?': '+said2.join(' | '):''));t.setByRoad(false)}}
 // ---- the band follows the ways: an estate's track taken up and laid again (lots.js tracksUp, occRebuild) makes it again
 {const x=T2[0],b0=t.RoadBand.bytes(),v0=t.WAYV;t.tracksUp(t.WM);const up=t.speedAt(x[0],x[1]),b1=t.RoadBand.bytes();for(const h of t.TOWNS)if(h.lots)t.Layout.of(h).tracks(true);t.tracksDone();
  ok(t.WAYV!==v0&&up<RB.trackSpeed&&b1<b0&&t.speedAt(x[0],x[1])===RB.trackSpeed&&t.RoadBand.bytes()===b0,'the estates\' tracks taken up (lots.js tracksUp): the band made again without them ('+up.toFixed(2)+' where one ran, '+b1+' bytes); laid again, with them ('+t.RoadBand.bytes()+' bytes)')}
 // ---- by-road mode is yours: saved with you and back on a load; off, nothing of it in the save (a new hero's is off)
 {Kit.clear();Kit.world({encCool:99});G.mode='world';t.setByRoad(true);t.saveGame(true,'quick');const sv=JSON.parse(localStorage.getItem(t.slotKey('quick')));t.setByRoad(false);t.loadGame('quick');const back=P.byRoad===true;t.updateHUD(true);const shown=pill();
  t.setByRoad(false);G.mode='world';t.saveGame(true,'quick');const sv0=JSON.parse(localStorage.getItem(t.slotKey('quick')));t.setByRoad(true);t.loadGame('quick');
  ok(sv.P.byRoad===true&&back&&shown&&!('byRoad' in sv0.P)&&!P.byRoad,'saved on, it is on after a load (the day bar shows it); saved off, the save has no byRoad and a load turns it off');t.setByRoad(false)}
});
