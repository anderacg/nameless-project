'use strict';
// Not a test: the world art the owner's play-tests of the generated world asked to fix, for his approval. Each piece drawn by the
// game's own drawWorld at the spot (by day, the fog lifted, you and the folk out of the way), a third of the view round it shown at
// x3, labelled; a piece this world lacks is looked for on the next Normal seeds (the world forged afresh and put in, as the New world screen does).
// part=2 (the default; the second play-test, 2026-10-22): estates' ground by climate (pastures in the snow, the desert and the
// swamp, a farm in the snow and the swamp), fords in each climate (frost, swamp, desert, grass), the water's noise by Thornbrook
// (the water across a climate's edge), the swamp's open ground and its forest, each climate's wood, a lake, a river's bend.
// part=3: each climate's trees (engine/worldnature.js PX.WORLD_TREES), each species' four on its climate's ground at x6, then deep
// in a wood (dimmer).
// part=4 (the third play-test, 2026-10-22): fords in each climate (a dirt track down each bank, the shallows sandy or gravelly with
// ripples, rocks scattered: grass, desert, swamp, frost), the grass meeting the swamp and the desert (the covers: wet and dry), a
// wood's edge on the grass; each border again as the whole view.
// part=1 (the first, 2026-10-22): roads into a holding's gate (Millbrook's, and one coming from behind its centre), roads onto a
// stone and a wooden bridge's deck, a ford, a frost edge (grass to snow), the swamp's trees and a fork; the frost edge and the swamp
// again as the whole view.
// Run by name with the flag on: Ashmark.html?test=visual/worldart&gen=1 (&part=1), then screenshot it (part 2: a window 1200 x
// 4660; part 3: 950 x 2100; part 1: 1200 x 2340; part 4: 1200 x 2000). The "before" pictures are this scene run on the commit before the fix.
window.RUN=()=>{const t=T,o=[],G=t.G,P=t.P,W=t.W,TILE=t.TILE,Z=3,part=+(new URLSearchParams(location.search).get('part')||2);
 try{
  if(part===3){const CL=['grass','frost','desert','swamp'],BG={grass:'#54803a',frost:'#d6dee8',desert:'#d6b668',swamp:'#48583a'},Z=6,rows=[];for(const c of CL)for(const sp of PX.WORLD_SPECIES[c])rows.push([c,sp]);
   const pg=document.createElement('canvas');pg.width=8*(16*Z+6)+120;pg.height=rows.length*(16*Z+6)+10;pg.style.cssText='position:absolute;left:0;top:0;z-index:9999';document.body.appendChild(pg);
   const g=pg.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#1a1c26';g.fillRect(0,0,pg.width,pg.height);
   rows.forEach(([c,sp],r)=>{g.fillStyle='#e8e0c8';g.font='13px Arial';g.fillText(c+' · '+sp,4,r*(16*Z+6)+50);
    for(let k=0;k<8;k++){const s=PX.worldTree(c,sp,k&3,k>>2),X=120+k*(16*Z+6),Y=r*(16*Z+6)+4;g.fillStyle=BG[c];g.fillRect(X,Y,16*Z,16*Z);g.drawImage(s,X,Y,16*Z,16*Z)}});
   o.push('INFO page '+pg.width+' x '+pg.height,'PASS drawn ('+rows.length+' species)');throw 0}
  window.requestAnimationFrame=()=>0;Math.random=t.seeded(4242);t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();
  (0,eval)('drawWorldFog=function(){}');
  const kind=(x,y)=>t.tAt(x,y),cl=(x,y)=>{const MW=t.MW,MH=t.MH;return t.CLIMS[t.climate[Math.max(0,Math.min(MH-1,y))*MW+Math.max(0,Math.min(MW-1,x))]]};
  const count=(x0,y0,r,f)=>{let c=0;for(let y=y0-r;y<=y0+r;y++)for(let x=x0-r;x<=x0+r;x++)if(x>=0&&y>=0&&x<t.MW&&y<t.MH&&f(x,y))c++;return c};
  const best=score=>{let b=null,bs=-1e9;for(let y=12;y<t.MH-12;y++)for(let x=20;x<t.MW-20;x++){const s=score(x,y);if(s>bs){bs=s;b=[x,y]}}return bs>-1e8?b:null};
  const mid=c=>{const i=c.tiles[c.tiles.length>>1];return[i%t.MW,(i-i%t.MW)/t.MW]};
  const xing=f=>{const c=(t.WM.crossings||[]).find(f);return c?mid(c):null};
  // (a built estate of kind k whose plots lie in climate c: its middle)
  const estate=(k,c)=>{for(const h of t.TOWNS)for(const l of h.lots||[])if(l.k===k&&l.st==='built'&&(l.plots||[]).length&&t.climAt((l.x+.5)*TILE,(l.y+.5)*TILE)===c){const q=[[l.x,l.y],...l.plots];return[Math.round(q.reduce((s,p)=>s+p[0],0)/q.length),Math.round(q.reduce((s,p)=>s+p[1],0)/q.length)]}return null};
  const wood=c=>best((x,y)=>cl(x,y)!==c||kind(x,y)!==t.T_FOREST?-1e9:count(x,y,3,(a,b)=>kind(a,b)===t.T_FOREST&&cl(a,b)===c)+.6*count(x,y,4,(a,b)=>kind(a,b)===t.T_OPEN));
  // (a lake: water of no river, 12-90 tiles of it within 6, land round it; a river's bend: a river tile with river on two sides at a
  //  right angle and land on the other two)
  const lake=()=>best((x,y)=>{if(kind(x,y)!==t.T_WATER||t.WM.river[y*t.MW+x]&3)return -1e9;const n=count(x,y,6,(a,b)=>kind(a,b)===t.T_WATER);return n<12||n>90?-1e9:-Math.abs(n-50)+.3*count(x,y,6,(a,b)=>kind(a,b)===t.T_FOREST)});
  const bend=()=>best((x,y)=>{const rv=(a,b)=>kind(a,b)===t.T_WATER&&(t.WM.river[b*t.MW+a]&3)===1;if(!rv(x,y))return -1e9;const L=rv(x-1,y),R=rv(x+1,y),U=rv(x,y-1),D=rv(x,y+1);
    if(!((L||R)&&(U||D))||L&&R||U&&D)return -1e9;return count(x,y,4,rv)-count(x,y,4,(a,b)=>kind(a,b)===t.T_WATER&&!rv(a,b))*3});
  // (the water's noise: water where the frost meets the grass, as by Thornbrook in the owner's game)
  const noise=()=>best((x,y)=>kind(x,y)!==t.T_WATER?-1e9:Math.min(count(x,y,3,(a,b)=>cl(a,b)==='frost'),count(x,y,3,(a,b)=>cl(a,b)!=='frost'))+.4*count(x,y,3,(a,b)=>kind(a,b)===t.T_WATER));
  // (a ford in climate c; in the frost, where it has the most frost round it, 6 of its 7 x 7 tiles at least: few lie in it)
  const fordIn=c=>{if(c!=='frost')return xing(x=>x.kind==='ford'&&cl(...mid(x))===c);let b=null,bn=5;for(const x of t.WM.crossings){if(x.kind!=='ford')continue;const m=mid(x),n=count(m[0],m[1],3,(a,y)=>cl(a,y)==='frost');if(n>bn){bn=n;b=m}}return b};
  // (a border between the grass and climate c on open ground: as much of each within 4 tiles, little water or wood; a wood's edge on
  //  the grass: as much wood as open ground round it)
  const open=(a,b)=>kind(a,b)===t.T_OPEN||kind(a,b)===t.T_HILL;
  const border=c=>()=>best((x,y)=>cl(x,y)!==c&&cl(x,y)!=='grass'||!open(x,y)?-1e9:Math.min(count(x,y,4,(a,b)=>cl(a,b)===c&&open(a,b)),count(x,y,4,(a,b)=>cl(a,b)==='grass'&&open(a,b)))-.5*count(x,y,4,(a,b)=>kind(a,b)===t.T_WATER));
  const edge=()=>best((x,y)=>cl(x,y)!=='grass'||kind(x,y)!==t.T_FOREST?-1e9:Math.min(count(x,y,3,(a,b)=>kind(a,b)===t.T_FOREST),count(x,y,3,(a,b)=>cl(a,b)==='grass'&&open(a,b)))-count(x,y,3,(a,b)=>kind(a,b)===t.T_ROAD||kind(a,b)===t.T_WATER)-count(x,y,5,(a,b)=>cl(a,b)!=='grass'));
  const PIECES=part===4?[
   ['a ford on the grass',()=>fordIn('grass')],['a ford in the desert',()=>fordIn('desert')],
   ['a ford in the swamp',()=>fordIn('swamp')],['a ford in the frost',()=>fordIn('frost')],
   ['the grass meeting the swamp',border('swamp')],['the grass meeting the desert',border('desert')],
   ['a wood\'s edge on the grass',edge],['the grass meeting the swamp, the whole view',border('swamp'),1],
   ['the grass meeting the desert, the whole view',border('desert'),1],['a wood\'s edge, the whole view',edge,1]]:part===1?(()=>{const mb=t.townBy('Millbrook'),
    behind=()=>{for(const h of t.TOWNS)for(const r of t.WM.roads||[])for(const l of r.line||[])for(const [e,n] of [[0,2],[l.length-2,l.length-4]]){if(n<0||n>=l.length)continue;
      if(Math.abs(l[e]-h.tx)<.01&&Math.abs(l[e+1]-(h.ty+1))<.01&&l[n+1]<h.ty)return h}return t.TOWNS.find(h=>h.kind==='town')},bh=behind();
    const L=[
     ['a road into Millbrook\'s gate',()=>mb&&[mb.tx,mb.ty]],
     ['a road into '+bh.name+'\'s gate',()=>[bh.tx,bh.ty]],
     ['a road onto a stone bridge',()=>xing(c=>c.kind==='bridge'&&c.stone)],
     ['a road onto a wooden bridge',()=>xing(c=>c.kind==='bridge'&&!c.stone)],
     ['a ford',()=>xing(c=>c.kind==='ford')],
     ['a frost edge',()=>best((x,y)=>cl(x,y)!=='frost'||cl(x,y+3)!=='grass'?-1e9:count(x,y,5,(a,b)=>kind(a,b)===t.T_OPEN||kind(a,b)===t.T_HILL)+(count(x,y,4,(a,b)=>kind(a,b)===t.T_ROAD)?8:0))],
     ['the swamp',()=>best((x,y)=>cl(x,y)!=='swamp'?-1e9:count(x,y,5,(a,b)=>cl(a,b)==='swamp'&&kind(a,b)===t.T_OPEN)+.5*count(x,y,5,(a,b)=>kind(a,b)===t.T_WATER))],
     ['a fork',()=>{const Gr=t.WM.graph;if(Gr)for(let v=0;v<Gr.n;v++)if(Gr.nk[v]===1){const i=Gr.tile[v],x=i%t.MW,y=(i-x)/t.MW;if(x>20&&y>12&&x<t.MW-20&&y<t.MH-12)return[x,y]}return null}]];
    L.push(['the frost edge, the whole view',L[5][1],1],['the swamp, the whole view',L[6][1],1]);return L})():[
   ['a pasture in the snow',()=>estate('pasture','frost')],['a pasture in the desert',()=>estate('pasture','desert')],
   ['a pasture in the swamp',()=>estate('pasture','swamp')],['a pasture on the grass',()=>estate('pasture','grass')],
   ['a farm in the snow',()=>estate('farm','frost')],['a farm in the swamp',()=>estate('farm','swamp')],
   ['a farm in the desert',()=>estate('farm','desert')],['a quarry in the snow',()=>estate('quarry','frost')],
   ['a ford in the frost',()=>fordIn('frost')],['a ford in the swamp',()=>fordIn('swamp')],
   ['a ford in the desert',()=>fordIn('desert')],['a ford on the grass',()=>fordIn('grass')],
   ['the water where the frost meets the grass (the noise by Thornbrook)',noise],['the water there, the whole view',noise,1],
   ['the swamp\'s open ground',()=>best((x,y)=>cl(x,y)!=='swamp'||kind(x,y)!==t.T_OPEN?-1e9:count(x,y,4,(a,b)=>cl(a,b)==='swamp'&&kind(a,b)===t.T_OPEN)+.4*count(x,y,4,(a,b)=>kind(a,b)===t.T_WATER))],
   ['the swamp\'s forest',()=>wood('swamp')],
   ['a wood on the grass',()=>wood('grass')],['a wood in the frost',()=>wood('frost')],
   ['a wood in the desert',()=>wood('desert')],['the swamp\'s forest, the whole view',()=>wood('swamp'),1],
   ['a lake',lake],['a river\'s bend',bend],['a lake, the whole view',lake,1],['a river\'s bend, the whole view',bend,1]];
  const cw=Math.round(t.VW/3),ch=Math.round(t.VH/3),lab=18,per=2,rows=Math.ceil(PIECES.length/per),pg=document.createElement('canvas');pg.width=per*(cw*Z+8)+8;pg.height=rows*(ch*Z+lab+8)+8;
  pg.style.cssText='position:absolute;left:0;top:0;z-index:9999;background:#1a1c26';document.body.appendChild(pg);const g=pg.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#1a1c26';g.fillRect(0,0,pg.width,pg.height);
  o.push('INFO page '+pg.width+' x '+pg.height);
  // (the ground and what is built only: no folk, caravans, beasts, parties, banners or labels over it)
  const quiet=()=>{W.folk=[];W.caravans=[];W.critters=[];W.monsters=[]};quiet();const stay=P.stay,keep=[window.txt,window.drawParties,window.drawBanners];window.txt=window.drawParties=window.drawBanners=()=>{};
  const left=new Set(PIECES.map((p,k)=>k));
  try{
   for(let s=0;s<=6&&left.size;s++){
    if(s){window.txt=keep[0];t.forgeInstall(t.genWorld({preset:'normal',seed:String(s)}));G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();quiet();window.txt=()=>{}}
    for(const k of [...left]){const [pn,f,wide]=PIECES[k],at=f();if(!at)continue;left.delete(k);const c=k%per,r=(k/per)|0,X=8+c*(cw*Z+8),Y=8+r*(ch*Z+lab+8);g.fillStyle='#e8e0c8';g.font='13px Arial';
     const fx=(at[0]+.5)*TILE,fy=(at[1]+.5)*TILE;P.x=fx;P.y=fy;P.stay=1;G.clock=t.DAY*.3;t.drawWorld();t.drawWorld();
     const sx=Math.max(0,Math.min(t.cv.width-cw,Math.round(fx-G.cam.x-cw/2))),sy=Math.max(0,Math.min(t.cv.height-ch,Math.round(fy-G.cam.y-ch/2)));
     g.fillText(pn+' · '+(s?'normal '+s:t.WM.gen)+' ('+at[0]+', '+at[1]+')',X,Y+13);if(wide)g.drawImage(t.cv,0,0,t.VW,t.VH,X,Y+lab,cw*Z,ch*Z);else g.drawImage(t.cv,sx,sy,cw,ch,X,Y+lab,cw*Z,ch*Z);o.push('INFO '+pn+': '+(s?'normal '+s:t.WM.gen)+' '+at.join(', '))}}
   for(const k of left){const c=k%per,r=(k/per)|0;g.fillStyle='#e8e0c8';g.font='13px Arial';g.fillText(PIECES[k][0]+' · none found',8+c*(cw*Z+8),8+r*(ch*Z+lab+8)+13);o.push('INFO '+PIECES[k][0]+': none found')}}
  finally{P.stay=stay;[window.txt,window.drawParties,window.drawBanners]=keep}o.push('PASS drawn ('+t.WM.gen+')');
 }catch(e){if(e!==0)o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.style.display='none';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
