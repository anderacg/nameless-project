'use strict';
// Not a test: rough timings of the hot paths (Ashmark.html?test=visual/perf)
window.RUN=()=>{const o=[],t=T,G=t.G,P=t.P,W=t.W;
 const time=(name,n,f)=>{const fl=()=>t.ctx.getImageData(0,0,1,1);f();fl();const a=performance.now();for(let i=0;i<n;i++){f();fl()}const ms=(performance.now()-a)/n;o.push(name.padEnd(34)+ms.toFixed(3)+' ms');return ms};
 try{
  window.requestAnimationFrame=()=>0;const c0=performance.now();t.act('begin','soldier');o.push('new game (incl. world paint)'.padEnd(34)+(performance.now()-c0).toFixed(1)+' ms');
  const a=performance.now();t.worldCv();o.push('worldCv (cached after first)'.padEnd(34)+(performance.now()-a).toFixed(1)+' ms');
  const cv=t.worldCv();o.push('world canvas'.padEnd(34)+cv.width+'x'+cv.height+' = '+(cv.width*cv.height*4/1048576).toFixed(0)+' MB');
  G.mode='world';G.modal=false;t.hidePanel();G.encCool=1e9;G.quietEvents=true;
  const tw=t.townBy('Ashford');P.x=tw.x+40;P.y=tw.y+30;G.clock=t.DAY*.25;
  for(let i=0;i<200;i++)t.updateWorld(.016);
  time('updateWorld (day)',300,()=>{G.encCool=1e9;t.updateWorld(.016)});
  time('drawWorld (day)',300,()=>t.drawWorld());
  G.clock=t.DAY*.8;time('drawWorld (night)',300,()=>t.drawWorld());G.clock=t.DAY*.25;time('drawWorld (day, again)',300,()=>t.drawWorld());
  time('  flush only',300,()=>{});
  {const keep=W.folk;W.folk=[];time('drawWorld (day, no workers)',300,()=>t.drawWorld());W.folk=keep;o.push('workers near you'.padEnd(34)+keep.length)}
  {const ox=P.x,oy=P.y;P.x=t.MW*8;P.y=t.MH*8;time('drawWorld (mid-map)',300,()=>t.drawWorld());P.x=ox;P.y=oy}
  // break the world frame down
  const cam=G.cam,V=t.vis(),ctx=t.ctx;
  time('  map blit',300,()=>ctx.drawImage(t.worldCv(),cam.x,cam.y,t.VW,t.VH,0,0,t.VW,t.VH));
  {const src=t.worldCv(),S=512,tiles={};for(let y=0;y<src.height;y+=S)for(let x=0;x<src.width;x+=S){const c=document.createElement('canvas');c.width=Math.min(S,src.width-x);c.height=Math.min(S,src.height-y);c.getContext('2d', { willReadFrequently: true }).drawImage(src,-x,-y);tiles[x+','+y]=c}
   const blit=()=>{for(let y=Math.floor(cam.y/S)*S;y<cam.y+t.VH;y+=S)for(let x=Math.floor(cam.x/S)*S;x<cam.x+t.VW;x+=S){const c=tiles[x+','+y];if(c)ctx.drawImage(c,x-cam.x,y-cam.y)}};
   time('  map blit from 512px tiles',300,blit);
   const view=document.createElement('canvas');view.width=t.VW;view.height=t.VH;const vg=view.getContext('2d', { willReadFrequently: true });vg.drawImage(src,cam.x,cam.y,t.VW,t.VH,0,0,t.VW,t.VH);
   time('  blit of a view-sized cache',300,()=>ctx.drawImage(view,0,0));}
  time('  drawEnv layer 0',300,()=>t.drawEnv(cam,V,0));
  time('  drawEnv layer 1',300,()=>t.drawEnv(cam,V,1));
  time('  drawLand',300,()=>t.drawLand(cam));
  time('  drawEstates',300,()=>t.drawEstates(cam,V));
  time('  updateLords',300,()=>t.updateLords(.016));
  time('  updateCaravans',300,()=>t.updateCaravans(.016));
  time('  updateFolk',300,()=>t.updateFolk(.016));
  time('  updateCritters',300,()=>t.updateCritters(.016));
  time('  pickAt',300,()=>t.pickAt(P.x+30,P.y));
  // the day
  const keep={g:P.gold};time('dayTick',20,()=>{t.dayTick();G.mode='world';G.modal=false;t.hidePanel()});
  time('  econDay',20,()=>t.econDay());time('  landDay',20,()=>t.landDay());time('  worldDay',20,()=>t.worldDay());time('  saveGame',20,()=>t.saveGame(true));
  let sz=0;try{sz=(localStorage.getItem('ashmark.save.v1')||Object.values(localStorage).sort((x,y)=>y.length-x.length)[0]||'').length}catch(e){}o.push('save size'.padEnd(34)+(sz/1024).toFixed(0)+' KB');
  // battle
  P.troops={hum_spear:20,hum_bow:15,hum_knight:10};G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:Array(40).fill('orc_grunt').concat(Array(10).fill('archer'))};
  t.startBattle({enemies:G.enc.list,tournament:false});for(let i=0;i<30;i++)t.updateBattle(.016);
  o.push('battle units'.padEnd(34)+t.B.units.length);
  time('updateBattle (~95 units)',200,()=>{if(!t.B.over)t.updateBattle(.016)});
  time('drawBattle',200,()=>t.drawBattle());
  o.push('sprite cache entries'.padEnd(34)+Object.keys(t.spr).length);
  o.push('scripts'.padEnd(34)+document.scripts.length);
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.join('\n');document.body.appendChild(d)};
