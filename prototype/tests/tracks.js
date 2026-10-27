'use strict';
// Tracks (world/tracks.js, gfx/tracks.js, data/tracks.js TRACKS; doc/WORLD_DESIGN.md §12.7): every band that moves leaves a trail
// of prints, a point every TRACKS.sample px; on roads too (fainter, shorter-lived), none on water, fords or a bridge's deck; a print
// laid never moves or turns; they fade with age, faster in the desert's wind and the frost's snow; the oldest dropped first past the cap; your own always seen while they last, others' by Scouting (older and
// farther with each level), only in your sight; a trail's card says more as Scouting rises; hovering one or Look on the action
// ring reads it (training Scouting once); saved and loaded, a save without them loads; with TRACKS.on off nothing is kept or saved.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,TR=t.TRACKS,K=t.Tracks;
 Kit.begin('soldier',5151);Kit.clear();Kit.world({encCool:1e9});
 const quiet=()=>{Kit.clear();G.encCool=1e9;W.road&&(W.road.on=[])};
 // (a run of n open tiles of climate c going east, far from the holdings, none of them on a road: its first tile's middle)
 const run=(c,n)=>{for(let ty=6;ty<t.MH-6;ty++)for(let tx=6;tx<t.MW-n-6;tx++){let good=true;
   for(let k=0;k<n&&good;k++){const x=(tx+k+.5)*16,y=(ty+.5)*16;good=t.tAt(tx+k,ty)===t.T_OPEN&&t.climAt(x,y)===c&&t.trackGround(x,y)>0&&t.trackGround(x,y-8)>0&&t.trackGround(x,y+8)>0}
   if(good&&!t.TOWNS.some(h=>Math.hypot(h.x-(tx+.5)*16,h.y-(ty+.5)*16)<160))return {x:(tx+.5)*16,y:(ty+.5)*16}}return null};
 const lvTo=n=>{P.sk.scout.lv=0;P.sk.scout.lv=Math.max(0,n-t.skill('scout'))};
 const mine=()=>W.tracks.filter(x=>x.own);
 // ---- you leave prints as you walk; a band does too, its kind and size kept
 const grass=run('grass',16);ok(!!grass,'a run of open grass to walk on ('+(grass&&grass.x+','+grass.y)+')');
 quiet();K.reset();Kit.goTo(grass.x,grass.y);t.updateWorld(.05);Kit.travel(grass.x+14*16,grass.y,3000);
 {const m=mine(),pts=m.reduce((a,x)=>a+x.size,0);
  ok(m.length>=1&&pts>=8&&Math.abs(m[0].p[0]-grass.x)<=TR.sample+2,'walking 14 tiles over grass leaves your trail: '+m.length+' trail, '+pts+' points, one every '+TR.sample+' px or so');
  const p=m[0].p,gaps=[];for(let i=3;i<p.length;i+=3)gaps.push(Math.round(Math.hypot(p[i]-p[i-3],p[i+1]-p[i-2])));ok(gaps.every(g=>g>=TR.sample&&g<TR.sample*2),'its points '+gaps.join(' ')+' px apart')}
 {quiet();K.reset();const b=t.asParty({x:grass.x,y:grass.y-8,n:8,kind:'bandits',list:t.makeEnemies(8,false,'bandits'),t:0,a:0,idle:false,cool:0,ld:t.newChief('bandits',1)});t.bandits.push(b);
  P.x=grass.x-400;P.y=grass.y-400;K.frame();for(let k=1;k<=12;k++){b.x=grass.x+k*16;K.frame()}
  const tr=W.tracks.find(x=>x.k==='band:bandits');
  ok(!!tr&&tr.n===8&&!tr.m&&tr.style==='foot'&&tr.size>=7&&tr.nm===b.ld.name+'’s band','a bandit band moving 12 tiles leaves its trail: '+(tr?tr.k+', '+tr.n+' on foot, '+tr.size+' points, "'+tr.nm+'"':'none'));
  t.bandits.length=0}
 // ---- on roads: dust prints on a dirt road, faint on a great road's paving, short-lived (the owner, 2026-10-23); none on water,
 // fords or a bridge's deck
 {const F=t.WM.feat,KD=t.WM.kind,away=(x,y)=>t.climAt(x,y)==='grass'&&!t.TOWNS.some(h=>Math.hypot(h.x-x,h.y-y)<160);let dirt=null,great=null,deck=null,water=null,ford=null;
  for(let ty=6;ty<t.MH-6;ty++)for(let tx=6;tx<t.MW-6;tx++){const i=ty*t.MW+tx,x=(tx+.5)*16,y=(ty+.5)*16,k=KD[i];
   if(k===t.T_ROAD){if(F[i]&32)deck=deck||{x,y};else if(!great&&F[i]&64&&away(x,y))great={x,y};else if(!dirt&&F[i]&128&&away(x,y))dirt={x,y}}
   else if(k===t.T_WATER)water=water||{x,y};else if(k===t.T_FORD)ford=ford||{x,y}}
  const g=o=>o?t.trackGround(o.x,o.y):null,gg=t.trackGround(grass.x,grass.y);
  ok(dirt&&great&&t.trackRoad(dirt.x,dirt.y,t.T_ROAD)==='dirt'&&t.trackRoad(great.x,great.y,t.T_ROAD)==='great'&&g(dirt)===TR.road.ground.dirt&&g(great)===TR.road.ground.great&&g(great)<g(dirt)&&g(dirt)<gg,
   'prints on a road: a dirt road ('+(dirt&&t.regionAt(dirt.x,dirt.y).name)+') keeps them at '+g(dirt)+', a great road ('+(great&&t.regionAt(great.x,great.y).name)+') fainter at '+g(great)+' (open grass '+gg+')');
  const lr=o=>t.trackLife(o.x,o.y),wf=o=>TR.weather[t.ambWeather(o.x,o.y)],lg=t.trackLife(grass.x,grass.y);
  ok(lr(dirt)===TR.road.life.dirt/wf(dirt)&&lr(great)===TR.road.life.great/wf(great)&&lr(great)<lr(dirt)&&lr(dirt)<lg,'and short-lived: '+lr(dirt).toFixed(1)+' h on the dirt road, '+lr(great).toFixed(1)+' h on the great road (the traffic treads them out; '+lg+' h on grass)');
  {let est=null;for(let ty=6;ty<t.MH-6&&!est;ty++)for(let tx=6;tx<t.MW-6;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;if(t.RoadBand.on(x,y)===2){est={x,y};break}}
   ok(!est||t.trackRoad(est.x,est.y,t.terrAt(est.x,est.y))==='dirt'&&g(est)===TR.road.ground.dirt,est?'an estate\'s track reads as a dirt road ('+g(est)+')':'no estate\'s track on this world')}
  ok(water&&g(water)===0&&(!ford||g(ford)===0)&&(!deck||g(deck)===0),'none on water, a ford'+(ford?'':' (none here)')+' or a bridge\'s deck'+(deck?'':' (none here)'));
  {const cl=(o,h)=>K.clear(o.x,o.y,h),ld=lr(dirt),c1=cl(dirt,1),road1=t.TRACK_SPOT.road;
   ok(c1>0&&road1==='dirt'&&c1<cl(grass,1)&&cl(dirt,ld-.2)>0&&cl(dirt,ld+.2)===0&&cl(grass,ld+.2)>0,'an hour-old print on the dirt road shows at '+c1.toFixed(2)+' (on grass '+cl(grass,1).toFixed(2)+'), gone past '+ld+' h (on grass still '+cl(grass,ld+.2).toFixed(2)+')')}
  // (a boar crossing the dirt road: its trail goes on over it, a point on the road)
  quiet();K.reset();const road=dirt,o={x:road.x-3*TR.sample,y:road.y,n:4,id:'boar',dead:false};t.W.monsters=[o];P.x=-999;P.y=-999;K.frame();
  const at=[];for(let k=1;k<=6;k++){o.x=road.x+(k-3)*TR.sample;K.frame();at.push(t.trackRoad(o.x,o.y,t.terrAt(o.x,o.y))||(t.trackGround(o.x,o.y)>0?'kept':'none'))}
  const pts=W.tracks.flatMap(tr=>{const r=[];for(let i=0;i<tr.p.length;i+=3)r.push([tr.p[i],tr.p[i+1]]);return r});
  ok(pts.every(([x,y])=>t.trackGround(x,y)>0)&&pts.some(([x,y])=>Math.abs(x-road.x)<2&&Math.abs(y-road.y)<2),'a boar crossing the dirt road: a point on it ('+W.tracks.length+' trail(s), '+pts.length+' points; the ground under each step: '+at.join(' ')+')');
  W.monsters=[];
  // (a band walking along a track between places: its prints drawn there, in the road's dust)
  const tc=i=>({x:(i%t.MW+.5)*16,y:((i/t.MW|0)+.5)*16}),r=t.WM.roads.find(q=>q.kind==='track'&&!q.est&&q.path.length>=12&&q.path.slice(3,10).every(i=>KD[i]===t.T_ROAD&&!(F[i]&32)&&away(tc(i).x,tc(i).y)));
  if(r){K.reset();quiet();const b={x:0,y:0,n:12,tc:{}},now=t.trackNow();
   for(let j=3;j<=9;j++){const q=tc(r.path[j]);b.x=q.x;b.y=q.y;K.step(b,'band:bandits',false,now-(9-j)*2)}
   const tr=W.tracks[0],mid=tc(r.path[6]);Kit.goTo(mid.x,mid.y-20);G.mode='world';G.modal=false;lvTo(10);G.clock=t.DAY*.3;
   const pn=performance.now,grab=()=>{performance.now=()=>1e7;try{t.drawWorld();return t.ctx.getImageData(0,0,t.VW,t.VH).data}finally{performance.now=pn}};
   const on=grab();TR.on=false;const off=grab();TR.on=true;let diff=0;for(let i=0;i<on.length;i+=4)if(on[i]!==off[i]||on[i+1]!==off[i+1]||on[i+2]!==off[i+2])diff++;
   const onRoad=!!tr&&tr.p.every((v,i)=>i%3||!!t.trackRoad(v,tr.p[i+1],t.terrAt(v,tr.p[i+1])));
   ok(tr&&onRoad&&diff>10,'a band of 12 walking a track between places: '+(tr?tr.size:0)+' points, all on the road, its prints drawn ('+diff+' pixels differ from the frame without tracks)')}
  else info('no straight enough track between places for the drawn check')}
 // ---- a print laid stays where it lies, turned as it was: the walker turning, or walking on, never moves or turns an older one
 // (the owner's bug, 2026-10-23: the prints already laid turned as the band changed its way)
 {K.reset();quiet();G.mode='world';G.modal=false;lvTo(10);G.clock=t.DAY*.3;const o={x:grass.x,y:grass.y,n:8,tc:{}},now=t.trackNow(),S=TR.sample;
  const up=[-1,1].find(d=>[10,S+6].every(h=>t.trackGround(grass.x+5*S,grass.y+d*h)>0))||-1;
  Kit.goTo(grass.x+3*S,grass.y+up*20);K.step(o,'band:bandits',false,now);for(let k=1;k<=5;k++){o.x=grass.x+k*S;K.step(o,'band:bandits',false,now)}
  const pn=performance.now,grab=()=>{performance.now=()=>1e7;try{t.drawWorld();return t.ctx.getImageData(0,0,t.VW,t.VH).data}finally{performance.now=pn}};
  const same=(A,B,keep)=>{let n=0;const cx=Math.floor(G.cam.x),cy=Math.floor(G.cam.y);for(let i=0;i<A.length;i+=4)if(A[i]!==B[i]||A[i+1]!==B[i+1]||A[i+2]!==B[i+2]){const j=i/4;if(!keep||keep(j%t.VW+cx,(j/t.VW|0)+cy))n++}return n};
  const tr=W.tracks[0],a0=grab();TR.on=false;const bare=grab();TR.on=true;const laid=same(a0,bare);
  o.y=grass.y+up*10;K.step(o,'band:bandits',false,now);const a1=grab();
  ok(tr&&tr.size===6&&laid>20&&same(a0,a1)===0,'the walker turns '+(up<0?'north':'south')+' 10 px (no new point yet): every print as it was ('+laid+' pixels of prints, '+same(a0,a1)+' changed)');
  o.y=grass.y+up*(S+6);K.step(o,'band:bandits',false,now);const a2=grab(),bx=grass.x+5*S,M=9+TR.lane*2,away=(x,y)=>!(x>bx-M&&x<bx+M&&(y-grass.y)*up>-M&&(y-grass.y)*up<S+6+M);// (the new stretch's box: as wide as its prints' lanes)
  ok(tr.size===7&&same(a1,a2)>0&&same(a1,a2,away)===0,'it walks on that way past a sample: a point kept and its prints laid ('+same(a1,a2)+' pixels), the older prints untouched ('+same(a1,a2,away)+' changed away from the new stretch)')}
 // ---- fading: by age, and faster in the desert's wind and the frost's snow
 {const now=t.trackNow(),lifeOf=c=>{const s=run(c,2);return s?t.trackLife(s.x,s.y):null},lg=lifeOf('grass'),ld=lifeOf('desert'),lf=lifeOf('frost');
  ok(lg===TR.life.grass&&ld===TR.life.desert&&lf===TR.life.frost/TR.weather.snow&&lf<lg&&ld<lg,'a print lasts '+lg+' h on grass, '+ld+' h in the desert (the wind), '+(lf&&lf.toFixed(1))+' h in the frost (snow fills it, x'+TR.weather.snow+')');
  K.reset();lvTo(10);Kit.goTo(grass.x,grass.y);const V=K.view(),age=h=>{const tr=new t.Track('band:bandits',6,0,'X',0);tr.add(grass.x+8,grass.y,now-h*10);tr.add(grass.x+32,grass.y,now-h*10+3);return K.seen(tr,0,V)};
  const a=[0,6,12,24,lg+1].map(age);ok(a[0]>a[1]&&a[1]>a[2]&&a[2]>a[3]&&a[3]>0&&a[4]===0,'on grass, at Scouting 10, a print fades with its age: '+a.map(v=>v.toFixed(2)).join(' ')+' at 0, 6, 12, 24 and '+(lg+1)+' hours');
  const s=run('swamp',2)||run('desert',2),cl=t.climAt(s.x,s.y);ok(t.trackGround(s.x,s.y)>t.trackGround(grass.x,grass.y),'clearer in the '+cl+' ('+t.trackGround(s.x,s.y)+') than on grass ('+t.trackGround(grass.x,grass.y)+')')}
 // ---- the cap: the oldest dropped first
 {const c0=TR.cap,s0=TR.slack;TR.cap=60;TR.slack=10;try{K.reset();const now=t.trackNow();
   for(let j=0;j<10;j++){const tr=new t.Track('lord',12,1,'Lord '+j,0);W.tracks.push(tr);for(let i=0;i<10;i++){tr.add(grass.x+i*24,grass.y+j,now-(100-j*10-i));K.n++}}
   const before=K.n;K.frame();const all=W.tracks.flatMap(tr=>tr.p.filter((v,i)=>i%3===2)),old=Math.min(...all);
   ok(before===100&&K.n===60&&all.length===60&&old===now-60&&W.tracks.length===6,'past the cap ('+TR.cap+' + '+TR.slack+'): '+before+' points cut to '+K.n+', the oldest 40 gone ('+W.tracks.length+' trails left, the oldest point '+(now-old)/10+' h old)')}
  finally{TR.cap=c0;TR.slack=s0}}
 // ---- who sees what: your own always; others' by Scouting, older and farther with each level; only in your sight
 {K.reset();Kit.goTo(grass.x,grass.y);const now=t.trackNow(),Vs=t.vis(),mk=(own,h,d)=>{const tr=new t.Track(own?'you':'band:bandits',6,0,'X',0);tr.add(grass.x+d,grass.y,now-h*10);tr.add(grass.x+d+24,grass.y,now-h*10+3);return tr};
  const rows=[];for(const lv of [0,3,6,10]){lvTo(lv);const V=K.view(),R=Math.sqrt(V.r2),seeAge=TR.see.age[0]+TR.see.age[1]*lv,sees=(h,d)=>K.seen(mk(false,h,d),0,V)>0;
   ok(sees(seeAge-.5,R*.5)&&!sees(seeAge+.5,R*.5)&&sees(1,R-2)&&!sees(1,R+2),'Scouting '+lv+': others\' tracks up to '+seeAge+' h old, within '+Math.round(R)+' px ('+Math.round(R/V.v2**.5*100)+'% of your sight)');
   rows.push(lv+': '+seeAge+' h, '+Math.round(R)+' px');
   ok(K.seen(mk(true,20,Math.sqrt(V.v2)-30),0,V)>0&&K.seen(mk(true,20,Math.sqrt(V.v2)+5),0,V)===0,'Scouting '+lv+': your own, 20 h old near the edge of your sight, seen; past it, not')}
  info('others\' tracks by Scouting: '+rows.join('; '));
  lvTo(10);const V=K.view();ok(Math.sqrt(V.r2)<=Math.sqrt(V.v2)+1e-6,'even at Scouting 10, never past your sight')}
 // ---- the card: more with Scouting; your own; and a first reading trains Scouting
 {K.reset();Kit.goTo(grass.x,grass.y);const now=t.trackNow(),tr=new t.Track('band:bandits',8,0,'The Red Vipers',0);W.tracks.push(tr);tr.add(grass.x+10,grass.y+6,now-50);tr.add(grass.x+23,grass.y-7,now-47);K.n=2;
  const txt=lv=>{lvTo(lv);return tr.card(0,t.skill('scout')).replace(/<[^>]+>/g,'|')};const c=[0,3,6,10].map(txt);
  ok(/^\|Tracks\|/.test(c[0])&&!/8/.test(c[0]),'Scouting 0: "'+c[0]+'"');
  ok(/Tracks of about 8\|.*On foot, heading NE/.test(c[1]),'Scouting 3: "'+c[1]+'"');
  lvTo(6);ok(t.trackTip(grass.x+17,grass.y).replace(/<[^>]+>/g,'|')===c[2],'the trail under a point reads the same (trackTip)');
  ok(/Bandits, about 8\|.*On foot, a few hours old, heading NE/.test(c[2]),'Scouting 6: "'+c[2]+'"');
  ok(/The Red Vipers, 8 men\|.*On foot, 5 hours ago, heading NE/.test(c[3]),'Scouting 10: "'+c[3]+'"');
  const own=new t.Track('you',5,0,'Your band',0);W.tracks.push(own);own.add(grass.x+100,grass.y,now-10);own.add(grass.x+124,grass.y,now-7);lvTo(0);
  ok(/Your band’s tracks/.test(t.trackTip(grass.x+112,grass.y)),'your own: "'+t.trackTip(grass.x+112,grass.y).replace(/<[^>]+>/g,'|')+'"');
  ok(t.trackTip(grass.x+50,grass.y+40)==='','nothing under a point beside them');
  const tr2=new t.Track('lord',20,1,'Sir Hal’s army',0);W.tracks.push(tr2);tr2.add(grass.x+40,grass.y,now-20);tr2.add(grass.x+64,grass.y,now-17);lvTo(3);
  const x0=P.sk.scout.xp;t.trackTip(grass.x+52,grass.y);const x1=P.sk.scout.xp;t.trackTip(grass.x+52,grass.y);
  ok(x1>x0&&P.sk.scout.xp===x1&&/Mounted/.test(t.trackTip(grass.x+52,grass.y)),'reading a trail trains Scouting once ('+x0.toFixed(1)+' to '+x1.toFixed(1)+' xp, not again); a mostly mounted army reads "mounted"')}
 // ---- Look on the action ring, and the pointer's tip, find a trail
 {K.reset();quiet();Kit.goTo(grass.x,grass.y);G.mode='world';G.modal=false;t.drawWorld();const now=t.trackNow(),tr=new t.Track('band:bandits',8,0,'The Red Vipers',0);W.tracks.push(tr);tr.add(grass.x+10,grass.y+6,now-50);tr.add(grass.x+23,grass.y-7,now-47);K.n=2;lvTo(6);
  const items=t.mapRingItems(grass.x+17,grass.y,null,100,100),look=items.find(i=>i.label==='Look');
  if(look)look.run();const tip=document.getElementById('tip');
  ok(!!look&&/Bandits, about 8/.test(tip.textContent)&&!tip.hidden,'Look on the ring over the trail shows its card ('+(look?tip.textContent:'no Look: '+items.map(i=>i.label).join(', '))+')');
  t.hideTip();const far=t.mapRingItems(grass.x+18,grass.y+60,null,100,100);ok(!far.some(i=>i.label==='Look'),'beside it, no Look ('+far.map(i=>i.label).join(', ')+')');
  const cv=t.cv,r=cv.getBoundingClientRect(),wx=grass.x+17,wy=grass.y;cv.dispatchEvent(new PointerEvent('pointermove',{clientX:r.left+(wx-G.cam.x)*r.width/t.VW,clientY:r.top+(wy-G.cam.y)*r.height/t.VH,pointerType:'mouse',bubbles:true}));
  ok(!tip.hidden&&/Bandits, about 8/.test(tip.textContent),'the pointer over it shows the same card ('+tip.textContent+')');t.hideTip()}
 // ---- a bounty's band: once you read one of its trails, its tracks show faintly gold
 {K.reset();Kit.goTo(grass.x,grass.y);const now=t.trackNow(),tr=new t.Track('band:bandits',8,0,'The Red Vipers',77);W.tracks.push(tr);tr.add(grass.x+10,grass.y+6,now-50);tr.add(grass.x+23,grass.y-7,now-47);K.n=2;lvTo(6);
  ok(!K.known.has(77),'a bounty\'s trail not yet read: not marked');t.trackTip(grass.x+17,grass.y);ok(K.known.has(77),'read once: its band\'s tracks are known (drawn gold)')}
 // ---- drawn: in view, over the land; none with TRACKS.on off
 {K.reset();quiet();Kit.goTo(grass.x,grass.y);G.mode='world';G.modal=false;lvTo(10);G.clock=t.DAY*.3;const now=t.trackNow(),tr=new t.Track('band:bandits',30,0,'X',0);W.tracks.push(tr);
  for(let i=0;i<5;i++)tr.add(grass.x+20+i*24,grass.y+4,now-10+i);K.n=5;
  const pn=performance.now;performance.now=()=>1e7;const grab=()=>{try{t.drawWorld();return t.ctx.getImageData(0,0,t.VW,t.VH).data}finally{performance.now=pn}},hash=a=>{let h=0;for(let i=0;i<a.length;i+=4)h=(h*31+a[i]+a[i+1]*3+a[i+2]*7)|0;return h};
  const on=grab();TR.on=false;performance.now=()=>1e7;const off=grab();performance.now=()=>1e7;const off2=grab();TR.on=true;let diff=0;for(let i=0;i<on.length;i+=4)if(on[i]!==off[i]||on[i+1]!==off[i+1]||on[i+2]!==off[i+2])diff++;
  ok(hash(off)===hash(off2)&&diff>40&&hash(on)!==hash(off),'a band of 30\'s trail is drawn in view ('+diff+' pixels differ from the frame without tracks)')}
 // ---- saved and loaded: the same prints; a save without them loads
 {K.reset();quiet();Kit.goTo(grass.x,grass.y);G.mode='world';Kit.travel(grass.x+10*16,grass.y,3000);const now=t.trackNow(),tr=new t.Track('band:raiders',7,0,'The Red Vipers',12);W.tracks.push(tr);tr.add(grass.x,grass.y+40,now-30);tr.add(grass.x+24,grass.y+41,now-27);tr.add(grass.x+47,grass.y+52,now-24);K.n+=3;K.known.add(12);
  const J=JSON.stringify(W.tracks),n=K.n;t.saveGame(true,'quick');const raw=JSON.parse(localStorage.getItem(t.SAVE+'.quick'));
  ok(raw.world.tracks&&raw.world.tracks.l.length===W.tracks.length&&raw.world.tracks.kq[0]===12,'saved: '+raw.world.tracks.l.length+' trails ('+JSON.stringify(raw.world.tracks).length+' chars)');
  K.reset();t.loadGame('quick');Kit.world({encCool:1e9});
  ok(JSON.stringify(W.tracks)===J&&K.n===n&&K.known.has(12)&&W.tracks.every(x=>x instanceof t.Track),'loaded: the same trails and points ('+K.n+'), the bounty known');
  ok(W.tracks.find(x=>x.k==='band:raiders').p.join()===[grass.x,grass.y+40,now-30,grass.x+24,grass.y+41,now-27,grass.x+47,grass.y+52,now-24].map(Math.round).join(),'the points exactly as they were');
  delete raw.world.tracks;localStorage.setItem(t.SAVE+'.quick',JSON.stringify(raw));t.loadGame('quick');Kit.world({encCool:1e9});
  ok(G.mode==='world'&&Array.isArray(W.tracks)&&!W.tracks.length&&K.n===0,'a save without tracks loads, with none');
  t.saveGame(true,'quick');ok(!('tracks' in JSON.parse(localStorage.getItem(t.SAVE+'.quick')).world),'and saves none while there are none')}
 // ---- off: nothing kept, nothing saved
 {K.reset();quiet();TR.on=false;try{Kit.goTo(grass.x,grass.y);Kit.travel(grass.x+10*16,grass.y,3000);ok(!W.tracks.length&&K.n===0&&t.trackTip(grass.x+40,grass.y)==='','with TRACKS.on off you leave none, and there are none to read')}finally{TR.on=true}}
 // ---- the save's size at the cap (a full world's worth, as kept)
 {K.reset();const now=t.trackNow();let j=0;while(K.n<TR.cap){const tr=new t.Track(j%3?'band:bandits':'mon:wolf',8,0,'Gorm’s band',0);W.tracks.push(tr);let x=200+(j*37)%3000,y=200+(j*53)%2000,tt=now-400+j;
   for(let i=0;i<20&&K.n<TR.cap;i++){x+=Math.round(16+8*Math.cos(i+j));y+=Math.round(8*Math.sin(i*1.7+j));tt+=3;tr.add(x,y,tt);K.n++}j++}
  const s=JSON.stringify(t.Saves.saveOf('tracks'));info('the save\'s tracks at the cap: '+TR.cap+' points in '+W.tracks.length+' trails, '+s.length+' chars ('+(s.length/1024).toFixed(1)+' KB, '+(s.length/TR.cap).toFixed(1)+' a point)');K.reset()}
});
