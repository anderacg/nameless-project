'use strict';
// The world map never shakes: a blow's shake (G.shake, battle/attacks.js shakeIt) left over when a battle ends, or carried into a
// new game, once wobbled the whole map forever (it only fades in a battle's update): vfx.js shakeView applies it in battle only
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),out=()=>{const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
 const t=T,G=t.G;
 try{t.act('begin','soldier');G.quietEvents=true;
  G.shake=12;const v=t.shakeView(false);ok(v===null,'on the map, a blow’s shake left over gives no shake ('+JSON.stringify(v)+')');
  ok(G.shake===0,'and the leftover shake is cleared on the map');
  G.shake=12;const tr=[],T0=t.ctx.translate;t.ctx.translate=function(x,y){tr.push([x,y]);return T0.call(this,x,y)};t.frame();t.ctx.translate=T0;
  ok(G.shake===0&&!tr.some(([x,y])=>Number.isInteger(x)&&Number.isInteger(y)&&(Math.abs(x)>=1||Math.abs(y)>=1)&&Math.abs(x)<=6&&Math.abs(y)<=6),'a whole map frame drawn with a leftover shake moves nothing by a shake’s offset');
  // the ground's scene (memCv) keeps no shift between frames: the pasture animals once left their fraction of a pixel in it
  // (critters.js penEnts), and it piled up frame on frame, the ground sliding under the labels and figures
  {const ev=x=>(0,eval)(x);ev('VS=3');const A=t.townBy('Ashford');t.P.x=A.x;t.P.y=A.y+30;t.P.tx=null;const pn=performance.now;let now=1e7;performance.now=()=>now;
   // (the water's tiles left out: its glints slide by design, worldart.js drawEnv; on a generated world some lie there)
   const pic=()=>{const m=t.MEM,w=m.width,d=m.getContext('2d', { willReadFrequently: true }).getImageData(0,0,w,Math.floor(m.height/3)).data,cx=Math.floor(G.cam.x),cy=Math.floor(G.cam.y);let h=0;
    // (and the buildings' tiles and those above them: a centre's flag waves there by design; since stage 3 the citadel is bigger)
    for(let i=0;i<d.length;i+=16){const q=i/4,X=Math.floor((cx+q%w)/t.TILE),Y=Math.floor((cy+Math.floor(q/w))/t.TILE);if(t.tAt(X,Y)!==t.T_WATER&&!(t.occAt(X,Y)>0)&&!(t.occAt(X,Y+1)>0))h=(h*31+d[i])|0}return h};
   t.frame();const h0=pic();let moved=0,tf=0;for(let i=0;i<90;i++){now+=16.7;t.frame();const T2=t.MEM.getContext('2d', { willReadFrequently: true }).getTransform();if(T2.e||T2.f)tf++;if(i%10===9&&pic()!==h0)moved++}
   performance.now=pn;ev('VS=1');
   ok(tf===0,'the ground’s scene starts every frame unshifted ('+tf+' frames carried a shift)');
   ok(moved===0,'standing by Ashford’s pasture at scale 3, the upper ground stays put for 90 frames ('+moved+' of 9 samples moved)')}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}out()};
