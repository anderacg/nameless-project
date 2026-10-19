'use strict';
// Clicking every kind of site on the map with real pointer events, beside it and from a little way off, at the test view and
// at the screen's scale (3): no exception, and the site's window (or its encounter) shows. (Travellers, chased from afar, once
// froze the game: the chase arrow read a site's banner(), its camp flag's colour, as a party's banner: render.js bannerAt.)
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),out=()=>{const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
 const t=T,G=t.G,P=t.P,ev=x=>(0,eval)(x);
 try{t.act('begin','soldier');G.quietEvents=true;
  for(const VSn of [1,3]){ev('VS='+VSn);
  const kinds={};let n=0;for(const s of t.W.sites){const k=(s.type||s.constructor.name)+'#'+(n++%2);if(!kinds[k])kinds[k]=s}
  for(const k in kinds){const s=kinds[k];
   for(const dist of [6,40]){
   t.hidePanel&&t.hidePanel();G.mode='world';G.modal=false;G.site=null;G.chase=null;G.enc=null;
   P.x=s.x-dist;P.y=s.y+2;P.tx=null;let err=null,steps=0;
   try{t.frame();const r=t.cv.getBoundingClientRect(),cx=s.x,cy=s.y-6,x=r.left+(cx-G.cam.x)*r.width/t.VW,y=r.top+(cy-G.cam.y)*r.height/t.VH;
    t.cv.dispatchEvent(new PointerEvent('pointermove',{clientX:x,clientY:y,pointerType:'mouse',bubbles:true}));t.frame();
    const t0=performance.now();t.cv.dispatchEvent(new PointerEvent('pointerdown',{clientX:x,clientY:y,pointerType:'mouse',button:0,bubbles:true}));t.cv.dispatchEvent(new PointerEvent('pointerup',{clientX:x,clientY:y,pointerType:'mouse',button:0,bubbles:true}));
    t.frame();const ms=performance.now()-t0;
    for(;steps<300&&G.mode==='world';steps++){t.updateWorld(.05);t.frame()}
    t.frame();t.frame();if(ms>40)o.push('INFO SLOW click '+k+' d'+dist+' VS'+VSn+': '+ms.toFixed(0)+' ms');
   }catch(e){err=e.message+' | '+(e.stack||'').split(String.fromCharCode(10)).slice(1,8).join(' | ')}
   const ov=document.getElementById('ov'),shown=!ov||!ov.hidden;
   o.push('INFO VS'+VSn+' '+k+' d'+dist+': steps '+steps+', mode '+G.mode+', site '+(G.site&&G.site.name)+', modal '+G.modal+', panel shown '+shown+(err?', EXC '+err:''));
   ok(!err&&(G.mode==='world'||shown),k+' d'+dist+' VS'+VSn+': no exception, and any window is shown');
   if(G.mode==='site'){try{t.act('site-leave')}catch(e){o.push('EXC leave '+e.message)}}
   if(G.mode!=='world'){try{if(G.enc)t.act('flee')}catch(e){}try{t.hidePanel();G.mode='world';G.modal=false;G.enc=null}catch(e){}}
  }}}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{try{ev('VS=1')}catch(e){}}out()};
