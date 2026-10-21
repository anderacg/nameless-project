'use strict';
// Not a test: the world art the owner's play-test of the generated world asked to fix (2026-10-22), for his approval: roads into a
// holding's gate (Millbrook's, and one coming from behind its centre), roads onto a stone and a wooden bridge's deck, a ford, a
// frost edge (grass to snow), the swamp's trees and a fork; the frost edge and the swamp again as the whole view. Each drawn by the game's own drawWorld at the spot (by day, the fog lifted, you
// and the folk out of the way), a third of the view round it shown at x3, labelled. Run by name with the flag on or off:
// Ashmark.html?test=visual/worldart&gen=1, then screenshot it (a window 1200 x 2340). The "before" pictures are this scene run on
// the commit before the fix.
window.RUN=()=>{const t=T,o=[],G=t.G,P=t.P,W=t.W,TILE=t.TILE,Z=3;
 try{
  window.requestAnimationFrame=()=>0;Math.random=t.seeded(4242);t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();
  (0,eval)('drawWorldFog=function(){}');
  const m=t.WM,MW=t.MW,MH=t.MH,kind=(x,y)=>t.tAt(x,y),cl=(x,y)=>t.CLIMS[t.climate[Math.max(0,Math.min(MH-1,y))*MW+Math.max(0,Math.min(MW-1,x))]];
  const count=(x0,y0,r,f)=>{let c=0;for(let y=y0-r;y<=y0+r;y++)for(let x=x0-r;x<=x0+r;x++)if(x>=0&&y>=0&&x<MW&&y<MH&&f(x,y))c++;return c};
  const best=score=>{let b=null,bs=-1e9;for(let y=12;y<MH-12;y++)for(let x=20;x<MW-20;x++){const s=score(x,y);if(s>bs){bs=s;b=[x,y]}}return b};
  const mid=c=>{const i=c.tiles[c.tiles.length>>1];return[i%MW,(i-i%MW)/MW]};
  const xing=f=>{const c=(m.crossings||[]).find(f);return c?mid(c):null};
  // (a holding a road comes into from behind its centre (its line's last leg from above the gate), else any town)
  const behind=()=>{for(const h of t.TOWNS)for(const r of m.roads||[])for(const l of r.line||[])for(const [e,n] of [[0,2],[l.length-2,l.length-4]]){if(n<0||n>=l.length)continue;
    if(Math.abs(l[e]-h.tx)<.01&&Math.abs(l[e+1]-(h.ty+1))<.01&&l[n+1]<h.ty)return h}return t.TOWNS.find(h=>h.kind==='town')};
  const mb=t.townBy('Millbrook'),bh=behind();
  const PIECES=[
   ['a road into Millbrook\'s gate',()=>[mb.tx,mb.ty]],
   ['a road into '+bh.name+'\'s gate',()=>[bh.tx,bh.ty]],
   ['a road onto a stone bridge',()=>xing(c=>c.kind==='bridge'&&c.stone)],
   ['a road onto a wooden bridge',()=>xing(c=>c.kind==='bridge'&&!c.stone)],
   ['a ford',()=>xing(c=>c.kind==='ford')],
   ['a frost edge',()=>best((x,y)=>cl(x,y)!=='frost'||cl(x,y+3)!=='grass'?-1e9:count(x,y,5,(a,b)=>kind(a,b)===t.T_OPEN||kind(a,b)===t.T_HILL)+(count(x,y,4,(a,b)=>kind(a,b)===t.T_ROAD)?8:0))],
   ['the swamp',()=>best((x,y)=>cl(x,y)!=='swamp'?-1e9:count(x,y,5,(a,b)=>cl(a,b)==='swamp'&&kind(a,b)===t.T_OPEN)+.5*count(x,y,5,(a,b)=>kind(a,b)===t.T_WATER))],
   ['a fork',()=>{const Gr=m.graph;if(Gr)for(let v=0;v<Gr.n;v++)if(Gr.nk[v]===1){const i=Gr.tile[v],x=i%MW,y=(i-x)/MW;if(x>20&&y>12&&x<MW-20&&y<MH-12)return[x,y]}return null}]];
  // (the frost edge and the swamp again, the whole view at x1)
  PIECES.push(['the frost edge, the whole view',PIECES[5][1],1],['the swamp, the whole view',PIECES[6][1],1]);
  const cw=Math.round(t.VW/3),ch=Math.round(t.VH/3),lab=18,per=2,rows=Math.ceil(PIECES.length/per),pg=document.createElement('canvas');pg.width=per*(cw*Z+8)+8;pg.height=rows*(ch*Z+lab+8)+8;
  pg.style.cssText='position:absolute;left:0;top:0;z-index:9999;background:#1a1c26';document.body.appendChild(pg);const g=pg.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#1a1c26';g.fillRect(0,0,pg.width,pg.height);
  // (the ground and what is built only: no folk, caravans, beasts, parties, banners or labels over it)
  W.folk=[];W.caravans=[];W.critters=[];W.monsters=[];const stay=P.stay,keep=[window.txt,window.drawParties,window.drawBanners];window.txt=window.drawParties=window.drawBanners=()=>{};
  try{
  PIECES.forEach(([pn,f,wide],k)=>{const at=f(),c=k%per,r=(k/per)|0,X=8+c*(cw*Z+8),Y=8+r*(ch*Z+lab+8);g.fillStyle='#e8e0c8';g.font='13px Arial';
   if(!at){g.fillText(pn+' · none found',X,Y+13);o.push('INFO '+pn+': none found');return}
   const fx=(at[0]+.5)*TILE,fy=(at[1]+.5)*TILE;P.x=fx;P.y=fy;P.stay=1;G.clock=t.DAY*.3;t.drawWorld();t.drawWorld();
   const sx=Math.max(0,Math.min(t.cv.width-cw,Math.round(fx-G.cam.x-cw/2))),sy=Math.max(0,Math.min(t.cv.height-ch,Math.round(fy-G.cam.y-ch/2)));
   g.fillText(pn+' · '+m.gen+' ('+at[0]+', '+at[1]+')',X,Y+13);if(wide)g.drawImage(t.cv,0,0,t.VW,t.VH,X,Y+lab,cw*Z,ch*Z);else g.drawImage(t.cv,sx,sy,cw,ch,X,Y+lab,cw*Z,ch*Z);o.push('INFO '+pn+': '+at.join(', '))})}
  finally{P.stay=stay;[window.txt,window.drawParties,window.drawBanners]=keep}o.push('PASS drawn ('+m.gen+')');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.style.display='none';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
