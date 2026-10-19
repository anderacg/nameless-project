'use strict';
// A loaded game looks as the saved one did (save.js, lots.js, gfx/structures.js lotSprite). A holding's centre stands with its
// holding's walls (wallOf), read from the holding each time it is drawn: the lot keeps no copy of them, which a save would leave
// out (before, a loaded town's citadel, a castle's keep or a walled village's hall stood with no walls until its walls next
// changed). A game is drawn at a few holdings (Ashford and the first of each kind and each people) at one held clock
// (performance.now), saved, loaded in the game (at once, LOADING.sync), drawn again; then loaded from the title screen, as
// Continue does (its steps over the page's frames, the world held still meanwhile), and drawn again. Every pixel of each view
// (the map, its buildings, fog, labels and minimap) is the same each time, and so is the picture of every building of every
// holding and the painted world (worldCv). The townsfolk and ships, never saved (they come out again as the world runs), are
// cleared before each look, and the depth's fades (gfx/depth.js) settled the same way.
window.RUN=async()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,G=t.G,P=t.P,W=t.W,LD=t.LOADING,D=t.WDEPTH;
const r0=Math.random,pn=performance.now,t0=pn.call(performance),uw=t.updateWorld;let now=1e7;
const fnv=a=>{let h=2166136261;for(let i=0;i<a.length;i++)h=Math.imul(h^a[i],16777619)>>>0;return h.toString(16).padStart(8,'0')};
const pix=c=>fnv(new Uint32Array(c.getContext('2d').getImageData(0,0,c.width,c.height).data.buffer));
try{
 try{localStorage.clear()}catch(e){}
 Math.random=t.seeded(9001);t.act('begin','soldier');Math.random=r0;G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();
 performance.now=()=>now;
 const TW=t.TOWNS,pick=[t.townBy('Ashford')];
 for(const f of [...['village','town','castle','city'].map(k=>z=>z.kind===k),...['dwarf','elf','orc'].map(r=>z=>z.races[0]===r)]){const z=TW.find(z=>f(z)&&!pick.includes(z));if(z)pick.push(z)}
 const at=z=>{P.x=z.x;P.y=z.y+40;P.tx=P.ty=null;G.chase=null};
 // (every spot seen first, so each look finds the fog as the save keeps it)
 for(const z of pick){at(z);t.reveal()}
 // each spot by day, its fades settled from nothing (frames 50 ms apart), the view's pixels at the last
 const look=()=>{W.folk=[];W.ships=[];G.mode='world';G.modal=false;return pick.map((z,k)=>{at(z);G.clock=.3*t.DAY;D.al.clear();D.cov.clear();D.t=0;now=1e7+k*1e4;
   for(let i=0;i<12;i++){now+=50;Math.random=t.seeded(9100+k);t.drawWorld()}Math.random=r0;return t.ctx.getImageData(0,0,t.VW,t.VH).data})};
 // every building's picture of every holding (each lot's: its kind, people, level, state and, the centre, its walls)
 const pics=()=>TW.map(z=>z.name+':'+(z.lots||[]).map(l=>pix(t.lotSprite(z,l))).join(','));
 // the pixels that differ between two looks, and where
 const cmp=(a,b)=>{let n=0,x0=1e9,y0=1e9,x1=-1,y1=-1;const VW=t.VW;
   for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]||a[i+3]!==b[i+3]){n++;const p=i>>2,x=p%VW,y=p/VW|0;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
   return n?n+' px in ('+x0+','+y0+')-('+x1+','+y1+')':''};
 const same=(A,B,what)=>{const d=pick.map((z,k)=>[z,cmp(A[k],B[k])]).filter(x=>x[1]);
   ok(!d.length,what+': every view drawn as before, pixel for pixel ('+pick.map(z=>z.name+' '+z.kind+' '+z.races[0]).join(', ')+')'+(d.length?'; differ: '+d.map(([z,s])=>z.name+' '+s).join('; '):''))};
 const samePics=(A,B,what)=>{const d=A.filter((s,i)=>s!==B[i]).map(s=>s.split(':')[0]);
   ok(!d.length,what+': every building of every holding drawn as before ('+TW.length+' holdings, '+TW.reduce((a,z)=>a+(z.lots||[]).length,0)+' buildings)'+(d.length?'; differ at '+d.join(', '):''))};
 const walls=()=>TW.map(z=>{const c=t.lotCentre(z);t.lotSprite(z,c);return c._fort===t.wallOf(z)}).every(Boolean);
 const v0=look(),p0=pics(),w0=pix(t.worldCv());
 ok(walls()&&TW.some(z=>t.wallOf(z)>1),'every centre stands with its holding\'s walls (stone walls or more at '+TW.filter(z=>t.wallOf(z)>1).length+' holdings)');
 // ---- loaded in the game, at once
 G.mode='world';t.saveGame(true,'quick');t.loadGame('quick');
 ok(walls(),'after a load every centre still stands with its holding\'s walls');
 const v1=look();same(v0,v1,'loaded in the game');samePics(p0,pics(),'loaded in the game');
 ok(pix(t.worldCv())===w0,'loaded in the game: the painted world is as before');
 // ---- loaded from the title screen, as Continue does: the overlay's steps over the page's frames (the world held still)
 {t.showTitle();t.frame();ok(G.mode==='title','the title screen, the world drawn behind it');
  const hold=(0,eval)('f=>{updateWorld=f}');hold(()=>{});LD.sync=false;performance.now=pn;
  try{t.loadGame('quick');await LD.task}finally{LD.sync=true;hold(uw);performance.now=()=>now}
  ok(G.mode==='world','Continue loads the game');
  const v2=look();same(v0,v2,'loaded from the title');samePics(p0,pics(),'loaded from the title');
  ok(pix(t.worldCv())===w0,'loaded from the title: the painted world is as before')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{Math.random=r0;performance.now=pn;LD.sync=true}
info('took '+((pn.call(performance)-t0)/1000).toFixed(1)+' s');
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
