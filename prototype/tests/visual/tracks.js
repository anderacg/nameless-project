'use strict';
// Not a test: tracks (world/tracks.js, gfx/tracks.js). Run by name (run-tests.ps1 -Suites visual/tracks) it is a report that never
// fails: two days of the whole world's tracks (points by kind, the cap), what they cost a frame (sampling in updateWorld, drawing in
// drawWorld, with the cap's worth in view) and the save's size. With ?scene=… it sets up a screenshot (chrome --headless
// --window-size=1400,880 --screenshot=… "…/Ashmark.html?test=visual/tracks&scene=…"):
//   sand, snow: your band's prints across the desert's sand or the frost's snow, the middle of the view at 4x;
//   band&lv=n: a band of raiders' trail over the sand, from 8 hours old to fresh, seen at Scouting n (4x);
//   card&lv=n: the same, with its card held up as Look shows it;
//   road&kind=track|road: a band of raiders' trail along a dirt road (a track between places) or a great road, 4½ hours old to
//   fresh, at Scouting 10 (4x), the dust prints fainter there than on the land;
//   turn&at=0|1: a band walking east (at=0), then turned south (north if the land there is not grass) and walked on (at=1): its earlier prints as they were (4x).
window.RUN=()=>{const o=[],info=m=>o.push('INFO '+m),t=T,G=t.G,P=t.P,W=t.W,TR=t.TRACKS,K=t.Tracks,q=new URLSearchParams(location.search),scene=q.get('scene');
try{
 Kit.begin('soldier',7);if(scene)Kit.clear();Kit.world({encCool:1e9});G.clock=t.DAY*.3;
 const run=(c,n)=>{for(let ty=6;ty<t.MH-6;ty++)for(let tx=6;tx<t.MW-n-6;tx++){let good=true;
   for(let k=0;k<n&&good;k++){const x=(tx+k+.5)*16,y=(ty+.5)*16;for(const d of [-24,-8,8,24])good=good&&t.tAt(tx+k,ty+Math.round(d/16))===t.T_OPEN&&t.climAt(x,y+d)===c&&t.trackGround(x,y+d)>0}
   if(good&&!t.TOWNS.some(h=>Math.hypot(h.x-(tx+.5)*16,h.y-(ty+.5)*16)<200)&&!W.sites.some(z=>Math.abs(z.y-(ty+.5)*16)<48&&z.x>(tx-3)*16&&z.x<(tx+n+3)*16))return {x:(tx+.5)*16,y:(ty+.5)*16}}return null};
 const lvTo=n=>{P.sk.scout.lv=0;P.sk.scout.lv=Math.max(0,n-t.skill('scout'))};
 // (the view's middle around world point (wx, wy) at 4x, over the page)
 const zoom=(wx,wy)=>{const src=t.cv,k=src.width/t.VW,sx=(wx-G.cam.x)*k,sy=(wy-G.cam.y)*k,c=document.createElement('canvas');c.width=1400;c.height=880;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
   g.drawImage(src,sx-175*k,sy-110*k,350*k,220*k,0,0,1400,880);c.style.cssText='position:fixed;left:0;top:0;z-index:99';document.body.appendChild(c)};
 if(scene==='sand'||scene==='snow'){const s=run(scene==='sand'?'desert':'frost',14);Kit.goTo(s.x,s.y);t.updateWorld(.05);Kit.travel(s.x+12*16,s.y,4000);G.clock=t.DAY*.3;
  window.requestAnimationFrame=()=>0;t.drawWorld();zoom(s.x+8*16,s.y);info(scene+': '+W.tracks.map(x=>x.k+' '+x.size).join(', ')+'; '+K.n+' points')}
 else if(scene==='road'){const kind=q.get('kind')||'track',F=t.WM.feat,tc=i=>({x:(i%t.MW+.5)*16,y:((i/t.MW|0)+.5)*16}),away=i=>{const c=tc(i);return t.climAt(c.x,c.y)==='grass'&&!t.TOWNS.some(h=>Math.hypot(h.x-c.x,h.y-c.y)<120)};
  // (the first 16 tiles of a road of that kind on grass, clear of the holdings and the bridges)
  let path=null;for(const z of t.WM.roads){if(z.kind!==kind||z.est)continue;for(let j=0;j+16<=z.path.length&&!path;j++){const w=z.path.slice(j,j+16);if(w.every(i=>t.WM.kind[i]===t.T_ROAD&&!(F[i]&32)&&away(i)))path=w}if(path)break}
  const now=t.trackNow();lvTo(10);
  const b=t.asParty({x:0,y:0,n:12,kind:'raiders',name:'Red Vipers',list:t.makeEnemies(12,false,'raiders'),t:0,a:0,idle:true,cool:0,ld:t.newChief('raiders',2)});t.bandits.push(b);
  for(let j=0;j<16;j++){const c=tc(path[j]);b.x=c.x;b.y=c.y;K.step(b,'band:raiders',false,now-(15-j)*3)}
  const m=tc(path[7]);Kit.goTo(m.x+4,m.y-30);window.requestAnimationFrame=()=>0;t.drawWorld();zoom(m.x,m.y);info('road ('+kind+'): '+W.tracks.map(x=>x.k+' '+x.size).join(', ')+'; on the road: '+W.tracks[0].p.filter((v,i)=>i%3===0&&t.trackRoad(v,W.tracks[0].p[i+1],t.terrAt(v,W.tracks[0].p[i+1]))).length)}
 else if(scene==='turn'){const s=run('grass',14),now=t.trackNow(),S=TR.sample;lvTo(10);
  const b=t.asParty({x:s.x,y:s.y,n:8,kind:'bandits',list:t.makeEnemies(8,false,'bandits'),t:0,a:0,idle:true,cool:0,ld:t.newChief('bandits',1)});t.bandits.push(b);
  K.step(b,'band:bandits',false,now);for(let k=1;k<=6;k++){b.x=s.x+k*S;K.step(b,'band:bandits',false,now)}b.x+=10;K.step(b,'band:bandits',false,now);
  if(q.get('at')==='1'){const up=[1,-1].find(d=>[S,2*S+10].every(h=>t.climAt(b.x,s.y+d*h)==='grass'&&t.trackGround(b.x,s.y+d*h)>0))||1;for(let k=1;k<=2;k++){b.y=s.y+up*k*S;K.step(b,'band:bandits',false,now)}b.y+=up*10;K.step(b,'band:bandits',false,now)}
  Kit.goTo(s.x+3*S,s.y+40);window.requestAnimationFrame=()=>0;t.drawWorld();zoom(s.x+4*S,s.y);info('turn at='+(q.get('at')||0)+': '+W.tracks[0].size+' points, the band at '+Math.round(b.x)+','+Math.round(b.y))}
 else if(scene==='band'||scene==='card'){const s=run('desert',16),now=t.trackNow();lvTo(+(q.get('lv')||0));
  const b=t.asParty({x:s.x,y:s.y+20,n:8,kind:'raiders',name:'Red Vipers',list:t.makeEnemies(8,false,'raiders'),t:0,a:0,idle:true,cool:0,ld:t.newChief('raiders',2)});t.bandits.push(b);
  for(let k=0;k<=15;k++){b.x=s.x+k*16;b.y=s.y+20-Math.round(6*Math.sin(k/3));K.step(b,'band:raiders',false,now-(15-k)*5)}
  Kit.goTo(s.x+9*16,s.y-14);window.requestAnimationFrame=()=>0;t.drawWorld();
  if(scene==='card'){const tr=W.tracks[0],mid=j=>Math.hypot((tr.p[3*j]+tr.p[3*j+3])/2-P.x,(tr.p[3*j+1]+tr.p[3*j+4])/2-P.y),i=[...Array(tr.size-1).keys()].sort((a,b)=>mid(a)-mid(b))[0],wx=(tr.p[3*i]+tr.p[3*i+3])/2,wy=(tr.p[3*i+1]+tr.p[3*i+4])/2,r=t.cv.getBoundingClientRect(),k=r.width/t.VW;
   const items=t.mapRingItems(wx,wy,null,r.left+(wx-G.cam.x)*k,r.top+(wy-G.cam.y)*k),look=items.find(x=>x.label==='Look');if(look){look.run();const tip=document.getElementById('tip'),c=tip.cloneNode(true);c.id='';c.hidden=false;tip.parentElement.appendChild(c)}info('card at Scouting '+t.skill('scout')+': '+document.getElementById('tip').textContent)}
  else zoom(s.x+8*16,s.y+4);info('band at Scouting '+t.skill('scout')+': '+K.n+' points')}
 else{
  // ---- two days of the world: what it leaves (you parked off the map, as worldprint's W7: nothing meets you)
  const d0=G.day,ms=f=>{const a=performance.now();f();return performance.now()-a};P.x=-999;P.y=-999;t.setSpeed(3);let f=0;const t0=performance.now();
  for(;f<6000&&G.day<d0+2;f++)t.updateWorld(.05);
  const by={};for(const tr of W.tracks){const k=tr.k.split(':')[0];by[k]=(by[k]||0)+tr.size}
  info('two days ('+f+' frames, '+((performance.now()-t0)/1000).toFixed(1)+' s): '+K.n+' points in '+W.tracks.length+' trails (cap '+TR.cap+'): '+Object.entries(by).map(([k,n])=>k+' '+n).join(', '));
  const sv=JSON.stringify(t.Saves.saveOf('tracks'));info('their save: '+sv.length+' chars ('+(sv.length/1024).toFixed(1)+' KB, '+(sv.length/Math.max(1,K.n)).toFixed(1)+' a point)');
  {let h=0;const per={};for(const tr of W.tracks){const k=tr.k.split(':')[0];per[k]=(per[k]||0)+1;for(let i=5;i<tr.p.length;i+=3)h=Math.max(h,(tr.p[i]-tr.p[i-3])/10)}info('trails by kind: '+Object.entries(per).map(([k,n])=>k+' '+n).join(', ')+'; the longest wait between two points '+h.toFixed(1)+' h')}
  // ---- the frame's cost: the world's moment with tracks and without (sampling), then drawing where most of them are, and with the cap in view
  t.setSpeed(1);const tw=t.townBy('Ashford');Kit.goTo(tw.x+60,tw.y+40);G.encCool=1e9;
  const step=n=>{for(let i=0;i<n;i++){G.encCool=1e9;t.updateWorld(.016)}};step(60);
  let on=0,off=0;for(let k=0;k<5;k++){on+=ms(()=>step(60));TR.on=false;off+=ms(()=>step(60));TR.on=true}
  info('updateWorld: '+(on/300).toFixed(3)+' ms a frame with tracks, '+(off/300).toFixed(3)+' without');
  {const a=performance.now();for(let i=0;i<1000;i++)K.frame();info('Tracks.frame alone (every band checked, nothing new): '+((performance.now()-a)/1000).toFixed(4)+' ms')}
  const best=W.tracks.slice().sort((a,b)=>b.size-a.size)[0];if(best)Kit.goTo(best.p[0],best.p[1]);lvTo(10);
  // (drawWorld's best of 5 batches of 20 with tracks and without (noisy on a busy PC), and drawTracks on its own, the cost itself: its
  // best of 5 batches of 50, and how many prints it drew)
  const best5=f=>{let m=1e9;for(let k=0;k<5;k++)m=Math.min(m,ms(f));return m},draw=()=>{const w0=performance.now();while(performance.now()-w0<600)t.drawWorld();// (the fog's easing over first: WFOG.fade)
   const cam={x:Math.floor(G.cam.x),y:Math.floor(G.cam.y)};
   const a=best5(()=>{for(let i=0;i<20;i++)t.drawWorld()})/20;TR.on=false;const b=best5(()=>{for(let i=0;i<20;i++)t.drawWorld()})/20;TR.on=true;
   const n=t.drawTracks(cam),c=best5(()=>{for(let i=0;i<50;i++)t.drawTracks(cam)})/50;return [a,b,c,n]};
  {const [a,b,c,n]=draw();info('by the longest trail at Scouting 10: drawWorld '+a.toFixed(2)+' ms with tracks, '+b.toFixed(2)+' without; drawTracks alone '+c.toFixed(3)+' ms for '+n+' prints')}
  // (the cap's worth of trails round you: as many prints in view as there can be, the draw's own cap TRACKS.max)
  K.reset();const now=t.trackNow();let j=0;while(K.n<TR.cap){const tr=new t.Track(j%2?'band:bandits':'lord',j%5?30:8,j%3?0:1,'X',0);W.tracks.push(tr);let x=P.x-180+(j*37)%360,y=P.y-110+(j*53)%220;
   for(let i=0;i<20&&K.n<TR.cap;i++){x+=Math.round(20*Math.cos(j*.7));y+=Math.round(20*Math.sin(j*.7));tr.add(x,y,now-30+i);K.n++}j++}
  {const [a,b,c,n]=draw();info('the cap ('+TR.cap+' points) round you, at most '+TR.max+' prints: drawWorld '+a.toFixed(2)+' ms with tracks, '+b.toFixed(2)+' without; drawTracks alone '+c.toFixed(3)+' ms for '+n+' prints')}
  TR.max=1e9;{const [a,b,c,n]=draw();info('the same with no limit on prints: drawWorld '+a.toFixed(2)+' ms with, '+b.toFixed(2)+' without; drawTracks alone '+c.toFixed(3)+' ms for '+n+' prints')}TR.max=700}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
