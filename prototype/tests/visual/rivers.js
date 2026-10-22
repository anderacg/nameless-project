'use strict';
// Not a test: every river piece of the generated world's art, for the owner's approval (doc/WORLD_DESIGN.md §12.1, §15.2.2 D):
// streams, rivers and great rivers shaded by width, with their banks; a delta; brooks along the flow; fords with stepping stones;
// stone and wooden bridges; a ferry's landings; rapids; a seasonal river's gravel edge; roads at any angle (a great road, a track,
// a fork, a holding's gate); a coast's sand rim and shallows. Each found on the classic seed or the first Normal seed that has it,
// cut out of the painted map (gfx/worldart.js paintSteps, as a chunk is painted) and shown at x2 (?z=1..4), labelled.
// Run by name: Ashmark.html?test=visual/rivers (any flag), then screenshot it (tests/visual/shot's way, a tall window: 1400 x 2200).
window.RUN=()=>{const t=T,o=[],q=new URLSearchParams(location.search),Z=+(q.get('z')||2),CW=15,CH=9,TILE=t.TILE;
 try{
  window.requestAnimationFrame=()=>0;
  // the pieces: [name, finder (map) -> tile index or -1]
  const W=m=>m.w,rv=(m,i)=>m.river[i],land=(m,i)=>m.kind[i]!==t.T_WATER;
  const each=(m,f)=>{for(let y=CH;y<m.h-CH;y++)for(let x=CW;x<m.w-CW;x++){const i=y*m.w+x;if(f(i,x,y))return i}return -1};
  const xing=(m,f)=>{const c=m.crossings.find(f);return c?c.tiles[c.tiles.length>>1]:-1};
  const PIECES=[
   ['stream (1 tile)',m=>each(m,i=>(rv(m,i)&3)===1&&!(rv(m,i)&(128|8))&&(rv(m,i-1)&3)===1)],
   ['river (2, navigable)',m=>each(m,i=>(rv(m,i)&3)===2&&rv(m,i)&4&&!(rv(m,i)&128))],
   ['great river (3)',m=>each(m,i=>(rv(m,i)&3)===3)],
   ['delta',m=>each(m,i=>rv(m,i)&128&&(rv(m,i)&3)===1)],
   ['brooks',m=>each(m,i=>land(m,i)&&!(rv(m,i)&3)&&(m.flow[i]&31)>=7&&m.kind[i]===t.T_OPEN)],
   ['ford',m=>xing(m,c=>c.kind==='ford')],
   ['stone bridge',m=>xing(m,c=>c.kind==='bridge'&&c.stone)],
   ['wooden bridge',m=>xing(m,c=>c.kind==='bridge'&&!c.stone)],
   ['ferry',m=>xing(m,c=>c.kind==='ferry')],
   ['rapids',m=>{const r=m.rivers.find(r=>r.rapids.length);return r?r.path[(r.rapids[0][0]+r.rapids[0][1])>>1]:-1}],
   ['seasonal stream',m=>each(m,i=>(rv(m,i)&3)===1&&rv(m,i)&8&&(rv(m,i-1)&3)===1)],
   ['great road',m=>{const r=m.roads.find(r=>r.kind==='road'&&r.path.length>40);return r?r.path[r.path.length>>1]:-1}],
   ['track',m=>{const r=m.roads.find(r=>r.kind==='track'&&r.path.length>30);return r?r.path[r.path.length>>1]:-1}],
   ['a fork',m=>{const G=m.graph;if(!G)return -1;for(let v=0;v<G.n;v++)if(G.nk[v]===1){const i=G.tile[v],x=i%m.w,y=(i-x)/m.w;if(x>CW&&y>CH&&x<m.w-CW&&y<m.h-CH)return i}return -1}],
   ['a holding\'s gate',m=>{const h=t.TOWNS.find(h=>h.kind==='town');return h?(h.ty+2)*m.w+h.tx:-1}],
   ['coast',m=>each(m,i=>land(m,i)&&m.feat[i]&4&&m.kind[i+m.w]===t.T_WATER&&!(rv(m,i+m.w)&3)&&m.kind[i+2*m.w]===t.T_WATER)]];
  const worlds=[['classic',()=>t.classicSettings()],...['1','2','3','4','5','6'].map(s=>['normal '+s,()=>({preset:'normal',seed:s})])];
  const found=new Map();
  for(const [wn,ws] of worlds){if(found.size===PIECES.length)break;
   if(!(wn==='classic'&&t.WM.classic))t.installWorld(t.genWorld(ws()));
   const m=t.WM,need=PIECES.filter(p=>!found.has(p[0]));if(!need.length)break;
   for(const [pn,f] of need){const i=f(m);if(i<0)continue;const x=i%m.w,y=(i-x)/m.w,X=Math.max(0,Math.min(m.w-CW,x-(CW>>1)))*TILE,Y=Math.max(0,Math.min(m.h-CH,y-(CH>>1)))*TILE;
    const cv=t.mkcv(CW*TILE,CH*TILE);t.runGen(t.paintSteps(t.WorldArt.ensure(),X,Y,CW*TILE,CH*TILE,cv.getContext('2d'),0,0,{}));found.set(pn,{cv,at:wn+' ('+x+', '+y+')'})}
   t.WorldArt.invalidate()}
  // laid out in rows of 3 at Z, each labelled
  const per=3,cw=CW*TILE*Z,ch=CH*TILE*Z,lab=18,cols=per,rows=Math.ceil(PIECES.length/per),pg=document.createElement('canvas');pg.width=cols*(cw+8)+8;pg.height=rows*(ch+lab+8)+8;
  pg.style.cssText='position:absolute;left:0;top:0;z-index:9999;background:#1a1c26';document.body.appendChild(pg);const g=pg.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#1a1c26';g.fillRect(0,0,pg.width,pg.height);
  PIECES.forEach(([pn],k)=>{const c=k%per,r=(k/per)|0,x=8+c*(cw+8),y=8+r*(ch+lab+8),f=found.get(pn);g.fillStyle='#e8e0c8';g.font='13px Arial';g.fillText(pn+(f?' · '+f.at:' · none found'),x,y+13);
   if(f)g.drawImage(f.cv,0,0,f.cv.width,f.cv.height,x,y+lab,cw,ch);o.push('INFO '+pn+': '+(f?f.at:'none found'))});
  o.push('PASS the river pieces drawn ('+found.size+' of '+PIECES.length+')');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.style.display='none';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
