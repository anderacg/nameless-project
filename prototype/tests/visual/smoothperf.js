'use strict';
// Not a test: the world map's frame time as the screen shows it (Ashmark.html?test=visual/smoothperf): frame(), as the game
// draws, while you walk (the camera moving), at a desktop's 3x (576 x 360 game px: 1728 x 1080 device px) and a phone's 844 x 390
// CSS px at dpr 3 (844 x 390 game px at 3x: 2532 x 1170); at Ashford, and in a busy forest with a dozen parties walking round you.
// Each line: the mean and the 90th percentile of the frames, ms (headless Chrome draws its canvases in software: a real GPU blits
// far faster; the ratios are what to read)
window.RUN=()=>{const o=[],t=T,G=t.G,P=t.P,W=t.W;
 const run=(name,n,f)=>{const fl=()=>t.ctx.getImageData(0,0,1,1);for(let i=0;i<20;i++){f(i);fl()}const ms=[];for(let i=0;i<n;i++){const a=performance.now();f(i);fl();ms.push(performance.now()-a)}
  ms.sort((a,b)=>a-b);const m=ms.reduce((a,b)=>a+b,0)/n;o.push(name.padEnd(40)+m.toFixed(2)+' ms  p90 '+ms[Math.floor(n*.9)].toFixed(2)+' ms');return m};
 try{
  window.requestAnimationFrame=()=>0;t.act('begin','soldier');G.mode='world';G.modal=false;t.hidePanel();G.encCool=1e9;G.quietEvents=true;G.clock=t.DAY*.25;
  const hasVS=(0,eval)('typeof VS')!=='undefined';o.push('canvas: '+(hasVS?'the world at the screen\'s scale (VS)':'game pixels, scaled by CSS'));
  const views=[['desktop 3x 576x360',576,360,3],['phone 844x390 @3',844,390,3]];
  const set=(w,h,s)=>{(0,eval)('VW='+w+';VH='+h+(hasVS?';VS='+s:''));t.frame()};
  const tw=t.townBy('Ashford');
  let forest=null;for(let ty=10;ty<t.MH-10&&!forest;ty++)for(let tx=10;tx<t.MW-10&&!forest;tx++){let n=0;for(let j=-3;j<=3;j++)for(let i=-3;i<=3;i++)if(t.tAt(tx+i,ty+j)===t.T_FOREST)n++;
   if(n>=44&&t.TOWNS.every(z=>Math.hypot(z.x-(tx+.5)*16,z.y-(ty+.5)*16)>160))forest=[(tx+.5)*16,(ty+.5)*16]}
  for(let i=0;i<6;i++)t.spawnBandit(true);
  const crowd=()=>{const L=[...W.lords.filter(l=>!l.dead).slice(0,8),...t.bandits.slice(0,6)];L.forEach((l,i)=>{l.inside=null;l.fight=null;l.x=P.x-70+(i%5)*35;l.y=P.y-50+Math.floor(i/5)*40});return L};
  for(const [vn,w,h,s] of views){set(w,h,s);o.push('== '+vn+' (canvas '+t.cv.width+'x'+t.cv.height+')');
   for(const [sn,x,y,busy] of [['Ashford',tw.x+40,tw.y+30,false],['busy forest',forest[0],forest[1],true]]){P.x=x;P.y=y;P.tx=null;t.reveal();const L=busy?crowd():[];
    run(sn+', still',80,()=>t.frame());
    run(sn+', walking',120,i=>{const d=i%240<120?1:-1;t.walk(P,d,0,.15);for(const l of L)t.walk(l,-d,0,.15);t.frame()});P.x=x;P.y=y}}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.join('\n');document.body.appendChild(d)};
