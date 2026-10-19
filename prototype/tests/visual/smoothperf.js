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
  // (and the map zoomed out on the phone, core.js MAPZOOM: its farthest step, 2 (1266 x 585 game px); at 1 (2532 x 1170) a frame cost 4x the 3x one, so
  // MAPZOOM.OUT leaves it out)
  const views=[['desktop 3x 576x360',576,360,3],['phone 844x390 @3',844,390,3],['phone zoomed out @2',1266,585,2]];
  const set=(w,h,s)=>{(0,eval)('VW='+w+';VH='+h+(hasVS?';VS='+s:''));t.frame()};
  const tw=t.townBy('Ashford');
  let forest=null;for(let ty=10;ty<t.MH-10&&!forest;ty++)for(let tx=10;tx<t.MW-10&&!forest;tx++){let n=0;for(let j=-3;j<=3;j++)for(let i=-3;i<=3;i++)if(t.tAt(tx+i,ty+j)===t.T_FOREST)n++;
   if(n>=44&&t.TOWNS.every(z=>Math.hypot(z.x-(tx+.5)*16,z.y-(ty+.5)*16)>160))forest=[(tx+.5)*16,(ty+.5)*16]}
  for(let i=0;i<6;i++)t.spawnBandit(true);
  const crowd=()=>{const L=[...W.lords.filter(l=>!l.dead).slice(0,8),...t.bandits.slice(0,6)];L.forEach((l,i)=>{l.inside=null;l.fight=null;l.x=P.x-70+(i%5)*35;l.y=P.y-50+Math.floor(i/5)*40});return L};
  for(const [vn,w,h,s] of views){set(w,h,s);o.push('== '+vn+' (canvas '+t.cv.width+'x'+t.cv.height+')');
   for(const [sn,x,y,busy] of [['Ashford',tw.x+40,tw.y+30,false],['busy forest',forest[0],forest[1],true]]){P.x=x;P.y=y;P.tx=null;t.reveal();const L=busy?crowd():[];
    run(sn+', still',80,()=>t.frame());
    run(sn+', walking',120,i=>{const d=i%240<120?1:-1;t.walk(P,d,0,.15);for(const l of L)t.walk(l,-d,0,.15);t.frame()});P.x=x;P.y=y;
    // (walking to a goal you clicked, the pointer over the map: the world's UI, gfx/worldui.js, if any: its marker, trail, brackets)
    G.mouse.x=t.VW/2+40;G.mouse.y=t.VH/2-24;G.mouse.in=true;G.mouse.type='mouse';
    const ui=(0,eval)('typeof wuiUnder')==='function',acc={ms:0,n:0};if(ui){window.__wpa=acc;window.__wp=[t.wuiUnder,t.wuiOver];(0,eval)('wuiUnder=c=>{const a=performance.now();window.__wp[0](c);window.__wpa.ms+=performance.now()-a;window.__wpa.n++};wuiOver=c=>{const a=performance.now();window.__wp[1](c);window.__wpa.ms+=performance.now()-a}')}
    try{run(sn+', to a goal, hovering',120,i=>{if(i%60===0){P.x=x;P.y=y;P.tx=x+200;P.ty=y+70}t.walk(P,P.tx-P.x,P.ty-P.y,.15);for(const l of L)t.walk(l,i%120<60?1:-1,0,.15);t.frame()})}
    finally{if(ui){(0,eval)('wuiUnder=window.__wp[0];wuiOver=window.__wp[1]');o.push('  (of which the world UI, gfx/worldui.js: '+(acc.ms/Math.max(1,acc.n)).toFixed(3)+' ms a frame)')}}P.x=x;P.y=y;P.tx=null;G.mouse.in=false}}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.join('\n');document.body.appendChild(d)};
