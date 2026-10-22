'use strict';
// Territory: every holding rules land around it; borders follow travel cost; captured holdings bring their land; reach grows in
// peace and with friendly neighbors, shrinks with conquest and war; cleared camps push it out; fief income, HUD, borders and saves.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TW=t.TOWNS,TILE=t.TILE;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');W.critters=[];W.sites=[];W.monsters=[];W.lords=[];t.bandits.length=0;G.quietEvents=true;
 const at=x=>t.landHold(x.x,x.y),tiles=x=>t.landOf(x);
 ok(TW.every(x=>at(x)===x),'every holding rules its own ground');
 ok(TW.every(x=>tiles(x)>40),'every holding rules land (smallest '+Math.min(...TW.map(tiles))+' tiles)');
 const v=TW.find(x=>x.kind==='village'),c=TW.find(x=>x.kind==='castle');
 ok(t.landReach(c)>t.landReach(v),'castles reach further than villages');
 let wild=0,water=0;for(let k=0;k<t.LAND.length;k++){if(t.LAND[k]<0&&t.tiles[k]!==t.T_WATER)wild++;if(t.LAND[k]>=0&&t.tiles[k]===t.T_WATER)water++}
 ok(wild>200&&!water,'land between realms stays wild ('+wild+' tiles, '+(t.LAND.filter(x=>x>=0).length)+' ruled), and nobody rules the water');
 ok(t.landName(-999,-999)==='Wild lands'&&t.landName(v.x,v.y)===v.name+' lands','land names: '+v.name+' lands, or the wilds');
 // capture: the land goes with the holding
 const f0=v.owner,other=t.FIDS.find(f=>f!==f0),L0=t.landsOf(other),n=tiles(v);
 v.owner=other;ok(at(v).owner===other&&t.landsOf(other)===L0+n,'a captured holding brings its '+n+' tiles to the new owner');
 // growth in peace; conquest and war cut it back
 v.lastOwner=other;v.grow=0;const g0=tiles(v);for(let i=0;i<30;i++)t.landDay();
 ok(v.grow>=4&&tiles(v)>g0,'in peace a holding reaches further ('+g0+' → '+tiles(v)+' tiles)');
 ok(v.grow<=t.growCap(v),'growth stops at its cap ('+t.growCap(v)+')');
 const gc=v.grow;v.owner=f0;t.landDay();ok(v.grow<=gc-2+.2,'conquest burns the borderland (reach −2)');
 v.raided=G.day+5;const gr=v.grow;t.landDay();ok(v.grow<gr,'a raided holding loses reach');v.raided=0;
 // friendly neighbors
 const lone=TW.find(x=>x.kind==='town'),cap0=t.growCap(lone),own=lone.owner;TW.forEach(x=>{if(x!==lone&&Math.hypot(x.tx-lone.tx,x.ty-lone.ty)<35)x.owner=own});
 ok(t.growCap(lone)>=cap0,'friendly holdings nearby raise the cap ('+cap0+' → '+t.growCap(lone)+')');
 // clearing a camp settles land
 // (the first camp on a holding's land or within WORLD_SCALE.land.pacify of one: where a world's roads lead them, the first may lie
 // farther out)
 const camp=t.CAMP_SPOTS.find(c=>t.landHold(c.x,c.y)||t.TOWNS.some(o=>Math.hypot(o.x-c.x,o.y-c.y)<t.WORLD_SCALE.land.pacify*t.TILE))||t.CAMP_SPOTS[0],h=t.pacify(camp.x,camp.y);ok(h&&h.grow>0,'clearing a camp pushes out the nearest holding ('+(h&&h.name)+')');
 // fiefs pay for land
 v.owner='player';v.lastOwner='player';v.sacked=v.raided=v.turmoil=0;ok(t.fiefIncome(v)===t.taxOf(v)&&t.fiefIncome(v)>0,'a fief pays its taxes: '+t.fiefIncome(v)+' gold a day');
 G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.enterTown(v);t.act('tab','fief');ok(/rules \d+ tiles of land/.test(document.getElementById('panel').innerHTML),'the Fief tab shows its land');t.act('leave');
 // crossing a border
 G.landFac=undefined;G.landLogAt=0;P.x=-50;P.y=-50;t.landWatch();P.x=v.x;P.y=v.y;G.landLogAt=-1e9;t.landWatch();
 ok(G.landFac==='player'&&/your own lands/.test(document.getElementById('log').textContent),'crossing into your land says so');
 t.updateHUD(true);ok(new RegExp(v.name+' lands').test(document.getElementById('stats').innerHTML),'the HUD names whose land you stand on');
 // drawing
 t.frame();ok(true,'borders and the minimap tint draw');
 // ---- the model and its art apart: the border bits are the borders the old per-frame loop worked out, drawn to the same pixels
 {const MW=t.MW,MH=t.MH,ev=s=>(0,eval)(s),c=t.ctx;t.landFresh();const L=t.LAND,E=t.LAND_EDGE;let bad=0;
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const k=y*MW+x,i=L[k];let e=0;
   if(i>=0)[[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy],d)=>{const n=x+dx<0||y+dy<0||x+dx>=MW||y+dy>=MH?-1:L[(y+dy)*MW+x+dx];if(n===i||n<0&&t.tAt(x+dx,y+dy)===t.T_WATER)return;e|=(n<0||TW[n].owner!==TW[i].owner?2:1)<<2*d});
   if(E[k]!==e)bad++}
  ok(!bad,'the border bits (LAND_EDGE) are the borders as the old loop found them, on every tile ('+bad+' differ)');
  const oldDraw=ev(`(function(cam){
  landFresh();const x0=Math.max(0,Math.floor(cam.x/TILE)),y0=Math.max(0,Math.floor(cam.y/TILE)),x1=Math.min(MW-1,x0+Math.ceil(VW/TILE)+1),y1=Math.min(MH-1,y0+Math.ceil(VH/TILE)+1);
  const at=(x,y)=>x<0||y<0||x>=MW||y>=MH?-1:LAND[y*MW+x];
  ctx.save();
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const i=LAND[y*MW+x];if(i<0)continue;const o=TOWNS[i].owner,col=landCol(o),sx=x*TILE-cam.x,sy=y*TILE-cam.y;
    ctx.fillStyle=col;ctx.globalAlpha=.08;ctx.fillRect(sx,sy,TILE,TILE);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=at(x+dx,y+dy);if(n===i||n<0&&tAt(x+dx,y+dy)===T_WATER)continue;const realm=n<0||TOWNS[n].owner!==o,w=realm?2:1;
      ctx.globalAlpha=realm?.7:.22;ctx.fillRect(dx>0?sx+TILE-w:sx,dy>0?sy+TILE-w:sy,dx?w:TILE,dy?w:TILE)}
  }
  ctx.restore();
})`);
  const paint=fn=>{c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,c.canvas.width,c.canvas.height);c.restore();fn();const d=c.getImageData(0,0,c.canvas.width,c.canvas.height).data;let h=0;for(let i=0;i<d.length;i++)h=(h*31+d[i])|0;return h};
  const c0=TW.find(x=>x.kind==='castle'),cams=[v,c0,TW[5],TW[20]].map(x=>({x:Math.round(x.x-t.VW/2),y:Math.round(x.y-t.VH/2)})).concat([{x:0,y:0},{x:MW*TILE-t.VW,y:MH*TILE-t.VH}]);
  const diff=cams.filter(q=>paint(()=>oldDraw(q))!==paint(()=>t.drawLand(q)));
  const f0=c0.owner;c0.owner=t.FIDS.find(f=>f!==f0);const m0=t.landMiniCv(),sw=paint(()=>oldDraw(cams[1]))===paint(()=>t.drawLand(cams[1]));c0.owner=f0;
  ok(!diff.length&&sw&&t.landMiniCv()!==m0&&t.landMiniCv()===t.landMiniCv(),'drawn from them, the borders are the same pixels at '+cams.length+' views (map corners too), and after a holding changes hands; the minimap tint is made again only on a change')}
 // ---- a holding that is gone rules no land
 {const g=TW.find(x=>x.kind==='village'&&x!==v),gi=TW.indexOf(g),n0=t.landOf(g);g.gone=true;const n1=t.landOf(g),any=t.LAND.includes(gi);delete g.gone;
  ok(n0>0&&!n1&&!any&&t.landOf(g)===n0,'a holding that is gone rules no land ('+n0+' tiles freed), and back, rules them again')}
 // ---- incremental: a change runs again only the holdings its reach box touches (and theirs, down the list), the same land as a
 // full reckoning, borders and tile counts too, through 200 random changes (reach, owner, both, several at once, gone and back)
 {const R=t.seeded(1234),pick=a=>a[Math.floor(R()*a.length)],keep=TW.map(x=>({owner:x.owner,grow:x.grow,lastOwner:x.lastOwner})),k={reach:0,owner:0,both:0,many:0,gone:0};
  const snap=()=>Array.from(t.LAND).join()+'|'+Array.from(t.LAND_EDGE).join()+'|'+t.landTiles.join();
  let same=0,n=0,ti=0,tf=0,firstBad=-1;
  for(let s=0;s<200;s++){const r=R(),h=pick(TW);
   if(r<.35){h.grow=Math.max(0,(h.grow||0)+pick([-3,-2,-1,1,2,3]));k.reach++}
   else if(r<.6){h.owner=pick(t.FIDS);k.owner++}
   else if(r<.75){h.owner=pick([...t.FIDS,'player']);h.grow=R()*10;k.both++}
   else if(r<.9){for(let j=0;j<3;j++)pick(TW).grow=R()*10;k.many++}
   else{if(h.gone)delete h.gone;else h.gone=true;k.gone++}
   let a=performance.now();t.landFresh();ti+=performance.now()-a;
   if(s%4===3||s===199){const inc=snap();a=performance.now();t.computeLand();tf+=performance.now()-a;n++;if(inc===snap())same++;else if(firstBad<0)firstBad=s}}
  TW.forEach((x,i)=>{Object.assign(x,keep[i]);delete x.gone});t.landFresh();
  ok(same===n&&n===50,'incremental equals a full reckoning after each of 50 checks over 200 random changes ('+Object.entries(k).map(([a,b])=>a+' '+b).join(', ')+(firstBad>=0?'; first differs at change '+firstBad:'')+')');
  o.push('INFO a change reckoned: '+(ti/200).toFixed(2)+' ms on average; a full reckoning '+(tf/n).toFixed(2)+' ms')}
 // saves keep reach
 v.grow=6.5;t.saveGame(true);v.grow=0;t.act('load');ok(Math.abs(t.townBy(v.name).grow-6.5)<.01,'each holding’s reach survives a reload');
 // (its size the map's in use, and its settings' on a generated world; its holdings the classic 37)
 ok(t.MW===t.WM.w&&t.MH===t.WM.h&&(!t.WM.settings||t.WM.settings.w===t.MW&&t.WM.settings.h===t.MH)&&t.TOWNS.length===t.CLASSIC_PLACES.length,'Ashmark is '+t.MW+' x '+t.MH+' tiles ('+t.WM.gen+') with '+t.TOWNS.length+' holdings');
 t.updateHUD(true);t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
