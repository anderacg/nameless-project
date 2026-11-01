'use strict';
// Not a test: the map's frame (drawWorld) and its fog alone (reveal, the remembered scene, the fog), you alone and with a hundred
// men marching, each frame a step on (fog.js Sight: your sight every man's). Ashmark.html?test=visual/sightperf
window.RUN=()=>{const o=[],t=T,G=t.G,P=t.P;
 try{
  window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;G.clock=t.DAY*.3;G.encCool=1e9;P.comps={};
  const home=Kit.goHome('Ashford'),plain=(x,y)=>{for(let j=-9;j<=9;j++)for(let i=-9;i<=9;i++){const px=x+i*16,py=y+j*16;if(t.visMulAt(px,py)!==1||!t.passable(t.terrAt(px,py)))return false}return true};
  let spot=null;for(let r=0;r<160&&!spot;r++)for(let i=-r;i<=r&&!spot;i++)for(const [dx,dy] of [[i,-r],[i,r],[-r,i],[r,i]]){const x=home.x+240+dx*16,y=home.y+200+dy*16;if(plain(x,y)){spot=[x,y];break}}
  Kit.goTo(spot[0],spot[1]);
  const pn=performance.now,flush=()=>t.ctx.getImageData(0,0,1,1);let k=0;
  const step=()=>{P.x+=k++%40<20?.6:-.6;t.MarchArmy.of(P).step(.016)};
  const time=(name,n,f)=>{for(let i=0;i<20;i++)f();flush();const a=pn.call(performance);for(let i=0;i<n;i++){f();flush()}const ms=(pn.call(performance)-a)/n;o.push(name.padEnd(44)+ms.toFixed(3)+' ms');return ms};
  const mem=t.mkc(t.VW+1,t.VH+1,()=>{}),eyes=()=>{try{return t.yourSight().eyes.length}catch(e){return 1}};
  const memNow=()=>{const V=t.vis(),cam=G.cam;if(t.fogMem.length>=4){const e=t.worldEye();t.fogMem(mem,e.x-cam.x,e.y-cam.y,V)}else t.fogMem(mem,cam,V)};// (the old fogMem took the one eye's place)
  for(const [name,tc] of [['a hundred men',{hum_spear:45,hum_bow:30,hum_knight:24}],['alone',{}],['a hundred men, again',{hum_spear:45,hum_bow:30,hum_knight:24}]]){
   P.troops=tc;for(let i=0;i<60;i++)t.MarchArmy.of(P).step(.05);
   o.push('INFO '+name+': '+(t.MARCH_ARMIES.get(P)?.units.length||0)+' marchers, '+eyes()+' eyes');
   time('  drawWorld (each a step on), '+name,200,()=>{step();t.drawWorld()});
   time('  the march step alone, '+name,200,step);
   time('  reveal (each a step on), '+name,200,()=>{step();t.reveal()});
   time('  the remembered scene, '+name,200,memNow);
   time('  the fog, '+name,200,()=>t.drawWorldFog(G.cam,t.vis()))}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.join('\n');document.body.appendChild(d)};
