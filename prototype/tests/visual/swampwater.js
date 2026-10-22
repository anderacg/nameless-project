'use strict';
// Not a test: swamp water in a few palettes, side by side, for the owner to pick (2026-10-22). The classic seed's great river,
// delta and a river through fen, painted with each palette (gfx/worldart.js WATER_RGB.swamp, SHORE.swamp), at x2.
// Run by name (the generated world, the default): Ashmark.html?test=visual/swampwater, then screenshot it.
window.RUN=()=>{const t=T,o=[],Z=2,CW=15,CH=9,TILE=t.TILE;
 try{
  window.requestAnimationFrame=()=>0;
  const W=t.WATER_RGB,S=t.SHORE,w0=JSON.parse(JSON.stringify(W.swamp)),s0=S.swamp.slice();
  const VARIANTS=[
   ['A · today',w0,s0],
   ['B · murky blue',[[86,118,120],[62,94,104],[44,70,86]],s0],
   ['C · peat blue, lighter',[[104,138,146],[74,110,126],[50,82,104]],s0],
   ['D · murky blue, pale banks',[[92,126,128],[64,98,110],[44,72,90]],['#8e8a62','#6e6a4a']]];
  const CROPS=[['great river',23,93],['delta',22,97],['river',397,73]];
  const cw=CW*TILE*Z,ch=CH*TILE*Z,lab=18,pg=document.createElement('canvas');pg.width=CROPS.length*(cw+8)+8;pg.height=VARIANTS.length*(ch+lab+8)+8;
  pg.style.cssText='position:absolute;left:0;top:0;z-index:9999;background:#1a1c26';document.body.appendChild(pg);const g=pg.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#1a1c26';g.fillRect(0,0,pg.width,pg.height);
  VARIANTS.forEach(([vn,wv,sv],r)=>{
   for(let k=0;k<3;k++)W.swamp[k]=wv[k];S.swamp[0]=sv[0];S.swamp[1]=sv[1];t.WorldArt.invalidate();
   CROPS.forEach(([cn,x,y],c)=>{const m=t.WM,X=Math.max(0,Math.min(m.w-CW,x-(CW>>1)))*TILE,Y=Math.max(0,Math.min(m.h-CH,y-(CH>>1)))*TILE,cv=t.mkcv(CW*TILE,CH*TILE);
    t.runGen(t.paintSteps(t.WorldArt.ensure(),X,Y,CW*TILE,CH*TILE,cv.getContext('2d'),0,0,{}));
    const px=8+c*(cw+8),py=8+r*(ch+lab+8);g.fillStyle='#e8e0c8';g.font='13px Arial';g.fillText(vn+' · '+cn,px,py+13);g.drawImage(cv,0,0,cv.width,cv.height,px,py+lab,cw,ch)})});
  for(let k=0;k<3;k++)W.swamp[k]=w0[k];S.swamp[0]=s0[0];S.swamp[1]=s0[1];t.WorldArt.invalidate();
  o.push('PASS drawn ('+t.WM.gen+')');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.style.display='none';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
