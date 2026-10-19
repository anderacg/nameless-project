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
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}out()};
