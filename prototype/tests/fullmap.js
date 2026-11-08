'use strict';
// The full map (ui/map.js; doc/WORLD_DESIGN.md §3.4, §12.4, D45): M opens it and M closes it, and so does a click or a tap on
// the minimap, and the dock's Map beside Camp (a phone's way in); Shift+M mutes, M alone no longer does. A window in the frame rule (header, the map and its legend, a nav() bar,
// Esc). Realms, rivers by width, crossings, holdings, you and the fog; the scale (1 px a tile at Normal, 1 px per 2 tiles over
// FULLMAP.wide) and its zoom; it fits a phone on its side (844 x 390); the picture built in 25 ms or less at Huge (a made-up Huge
// map, so no Huge world is forged). Then the loading screens' step labels: the generator's real stages in "Forging the world…"
// and "Returning to…".
Kit.suite(({ok,info})=>{
  const t=T,G=t.G,P=t.P,W=t.W,q=Kit.q,qa=Kit.qa,cv=document.querySelector('canvas'),scr=q('#screen');
  window.requestAnimationFrame=()=>0;
  const press=(o)=>window.dispatchEvent(new KeyboardEvent('keydown',Object.assign({code:'KeyM',key:'m',bubbles:true},o)));
  const world=()=>{Kit.world();t.frame()};
  Kit.begin('soldier',4100);Kit.clear();world();const WM=t.WM,MW=WM.w,MH=WM.h;
  // ---- the minimap a zoomed-in piece of the full map (render.js MINIMAP, drawMiniMap): round the screen's middle, at least its
  // tiles across (or over x the screen's), never past the map; its picture the full map's parchment for a box round it, made again
  // once the view leaves the box
  {const M=t.MINIMAP,v=t.worldMiniView(),cx=(G.cam.x+t.VW/2)/t.TILE,cy=(G.cam.y+t.VH/2)/t.TILE,tw=Math.min(MW,Math.max(M.tiles,t.VW/t.TILE*M.over));
   ok(M.on&&Math.abs(v.tw-tw)<1e-9&&v.tw<MW&&v.ox>=0&&v.oy>=0&&v.ox+v.tw<=MW+1e-9&&v.oy+v.th<=MH+1e-9&&Math.abs(v.w/v.tw-v.s)<1e-9,'the minimap shows '+Math.round(v.tw)+' of the map\'s '+MW+' tiles across, zoomed in, inside the map');
   ok(v.ox<=0||v.ox+v.tw>=MW-.01||Math.abs(v.ox+v.tw/2-cx)<1/v.s+1e-9,'round the screen\'s middle ('+(v.ox+v.tw/2).toFixed(1)+' for '+cx.toFixed(1)+')');
   const p0=t.MINI_PIC;ok(p0&&p0.cv.width===p0.w&&p0.w<=Math.ceil(v.tw*M.box)&&v.ox>=p0.x&&v.ox+v.tw<=p0.x+p0.w,'its picture a box of '+(p0&&p0.w+' x '+p0.h)+' tiles round the view (the full map\'s parchment: fullMapPic box)');
   t.frame();ok(t.MINI_PIC===p0,'kept while the view stays in it');
   const c0={x:G.cam.x,y:G.cam.y};G.cam.x=Math.min(MW*t.TILE-t.VW,Math.max(0,G.cam.x+p0.w*t.TILE));const v2=t.worldMiniView();t.miniPic(v2);ok(t.MINI_PIC!==p0&&v2.ox>=t.MINI_PIC.x&&v2.ox+v2.tw<=t.MINI_PIC.x+t.MINI_PIC.w+1e-9,'made again once the view leaves it');G.cam.x=c0.x;G.cam.y=c0.y;
   const S=t.seenArr(),b={x:10,y:12,w:30,h:20},img=t.fullMapPic(WM,1,S,t.LAND,t.TOWNS,b),all=t.fullMapPic(WM,1,S,t.LAND,t.TOWNS),pa=img.getContext('2d').getImageData(5,6,1,1).data.join(),pb=all.getContext('2d').getImageData(15,18,1,1).data.join();
   ok(img.width===30&&img.height===20&&pa===pb,'a box of the picture is that part of the whole one ('+pa+')')}
  info('the world: '+WM.gen+', '+MW+' x '+MH+' tiles');
  // ---- M opens it, M again closes it; Shift+M mutes, M never does ----
  const mute0=t.prefGet('mute');press();
  ok(G.mode==='fullmap'&&!q('#ov').hidden&&q('#panel.fmap')&&t.prefGet('mute')===mute0,'M opens the full map (mode '+G.mode+'), and the sound stays as it was');
  const nav=q('#panel > .nav'),close=nav&&nav.querySelector('[data-nav="close"]');
  ok(q('#panel > .top h2')&&/^Map of /.test(q('#panel h2').textContent)&&/tiles · [\d.]+% explored/.test(q('#panel .fm-head .muted').textContent)&&close&&close.textContent==='Close'&&(nav.querySelector('[data-nav="back"]')||{}).dataset.act==='fb-menu',
    'the frame rule: its header ('+q('#panel h2').textContent+' · '+q('#panel .fm-head .muted').textContent+'), the map and legend, a bottom bar with Close on the right');
  ok(q('.fm-view .fm-cv')&&q('.fm-leg'),'the map and its legend side by side');
  press();ok(G.mode==='world'&&q('#ov').hidden&&!G.modal,'M again closes it');
  press({shiftKey:true,key:'M'});const m1=t.prefGet('mute');press({shiftKey:true,key:'M'});
  ok(m1===!mute0&&t.prefGet('mute')===mute0&&G.mode==='world','Shift+M mutes, and again brings the sound back, without opening the map');
  press();Kit.key('Escape','Escape');ok(G.mode==='esc'&&G.esc.html==null,'Esc follows its bar: Back, the Game Menu (the map closed)');Kit.key('Escape','Escape');ok(G.mode==='world'&&q('#ov').hidden,'one more Esc resumes');
  t.openHelp();press();ok(G.mode==='help','M does nothing over another window');t.closeOver();
  ok(t.KEYS.some(([,ks])=>ks.some(([k,d])=>k==='Shift + M'&&/sound/.test(d)))&&t.KEYS[0][1].some(([k,d])=>k==='M'&&/full map/.test(d)),'Help lists M for the full map and Shift + M for the sound');
  // ---- the minimap: a click or a tap opens it ----
  world();const R=t.fullMapMiniRect(),r=cv.getBoundingClientRect(),k=cv.width/t.CVS/r.width,cl=(x,y)=>({clientX:r.left+x/k,clientY:r.top+y/k});
  {const g=cv.getContext('2d', { willReadFrequently: true }),s=cv.width/t.VW,pixel=x=>Array.from(g.getImageData(Math.floor(x*s),Math.floor((R.y+R.h/2)*s),1,1).data).slice(0,3).join();
    ok(pixel(R.x-.5)===t.fmRgb(t.MAP_FRAME.bg).join()&&pixel(R.x-1.5)===t.fmRgb(t.MAP_FRAME.edge).join(),
      'the minimap is where map.js looks for it: its gold and dark frame outside '+JSON.stringify(R)+' (render.js drawWorld)')}
  const down=(type,x,y)=>cv.dispatchEvent(new PointerEvent('pointerdown',Object.assign({bubbles:true,button:0,pointerType:type,pointerId:type==='touch'?7:1,isPrimary:true},cl(x,y))));
  const up=(type,x,y)=>window.dispatchEvent(new PointerEvent('pointerup',Object.assign({bubbles:true,button:0,pointerType:type,pointerId:type==='touch'?7:1,isPrimary:true},cl(x,y))));
  down('mouse',R.x+R.w/2,R.y+R.h/2);up('mouse',R.x+R.w/2,R.y+R.h/2);ok(G.mode==='fullmap','a click on the minimap opens it');t.act('map-close');
  world();down('touch',R.x+3,R.y+R.h-3);up('touch',R.x+3,R.y+R.h-3);ok(G.mode==='fullmap','a tap on the minimap opens it');t.act('map-close');
  world();down('mouse',R.x-30,R.y+R.h+30);up('mouse',R.x-30,R.y+R.h+30);ok(G.mode!=='fullmap','a click beside it does not open it (it travels, as ever)');Kit.world();P.tx=null;
  // (the click a tap's letting go still sends lands on what the map put under the finger, its zoom's −: eaten; the owner, 2026-10-31:
  // "the minimap isn't clickable"); a mouse over it: a hand, and a tooltip that says so, not what lies on the map under it
  {world();const at=cl(R.x+R.w/2,R.y+R.h/2);down('touch',R.x+R.w/2,R.y+R.h/2);up('touch',R.x+R.w/2,R.y+R.h/2);const z=t.FULLMAP.ppt,el=document.elementFromPoint(at.clientX,at.clientY);let heard=0;const count=()=>heard++;
   document.addEventListener('click',count);try{el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,...at}))}finally{document.removeEventListener('click',count)}
   ok(G.mode==='fullmap'&&t.FULLMAP.ppt===z&&!heard,'a tap on the minimap opens the map, and the click it sends after presses nothing on it ('+(el&&(el.dataset.act||el.className||el.tagName))+')');t.act('map-close')}
  {world();const mv=(x,y)=>cv.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'mouse',pointerId:1,...cl(x,y)}));mv(R.x+R.w/2,R.y+R.h/2);const tip=q('#tip'),on=cv.style.cursor,text=tip.textContent,said=!tip.hidden&&/full map/.test(text);mv(R.x-40,R.y+R.h+40);
   ok(on==='pointer'&&said&&cv.style.cursor!=='pointer','a mouse over the minimap shows a hand and says a click opens the full map ('+text+'); off it, the hand goes')}
  // ---- the dock's Map, beside Camp (input.js): a click or a tap opens it, the world waits, its bar's Close and Esc close it ----
  {world();const b=q('#mapBtn'),camp=q('#campBtn'),seen=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0},run=()=>t.loop((0,eval)('last')+16);
    ok(b&&camp&&b.previousElementSibling===camp&&b.parentElement===camp.parentElement&&b.querySelector('svg')&&b.querySelector('.dl').textContent==='Map'&&b.querySelector('kbd').textContent==='M'&&seen(b),
      'the dock’s Map sits beside Camp: an icon tile, its key M ('+(b&&b.title)+')');
    const p0=G.paused;G.paused=false;const c0=G.clock;run();const goes=G.clock>c0;
    b.click();ok(G.mode==='fullmap'&&!q('#ov').hidden&&q('#panel.fmap'),'a click on it opens the full map');
    const c1=G.clock;run();ok(goes&&G.clock===c1,'the world waits while it is open (the clock ran on the map, stands still under it)');G.paused=p0;
    const close=q('#panel > .nav [data-nav="close"]');close.click();ok(G.mode==='world'&&q('#ov').hidden&&!G.modal,'its bottom bar’s '+close.textContent+' closes it');
    const tap=ty=>b.dispatchEvent(new PointerEvent(ty,{bubbles:true,button:0,pointerType:'touch',pointerId:9,isPrimary:true}));
    tap('pointerdown');tap('pointerup');b.click();ok(G.mode==='fullmap','a tap on it opens it');
    Kit.key('Escape','Escape');ok(G.mode==='esc','Esc follows its bar: Back, the Game Menu');Kit.key('Escape','Escape');ok(G.mode==='world'&&q('#ov').hidden,'one more Esc resumes');
    b.click();b.click();ok(G.mode==='world','Map again closes it, as M does');
    scr.dataset.mode='town';ok(!seen(b)&&seen(camp),'off the map it is hidden (Camp stays)');scr.dataset.mode='world';t.frame()}
  // ---- the dock's Map on a phone on its side: 844 x 390, on the screen, clear of the minimap; a tap opens the map on it ----
  {const css0=scr.style.cssText;scr.style.cssText+=';width:844px;height:390px';
    try{world();const b=q('#mapBtn'),s=scr.getBoundingClientRect(),br=b.getBoundingClientRect(),R=t.fullMapMiniRect(),r=cv.getBoundingClientRect(),k=r.width/t.VW,
        m={left:r.left+R.x*k,top:r.top+R.y*k,right:r.left+(R.x+R.w)*k,bottom:r.top+(R.y+R.h)*k},apart=(a,c)=>a.right<=c.left||c.right<=a.left||a.bottom<=c.top||c.bottom<=a.top,
        dock=[...b.parentElement.parentElement.querySelectorAll('.dbtn')].filter(x=>x!==b&&x.getBoundingClientRect().width>0);
      ok(br.width>0&&br.left>=s.left-.5&&br.right<=s.right+.5&&br.top>=s.top-.5&&br.bottom<=s.bottom+.5&&apart(br,m)&&dock.every(x=>apart(br,x.getBoundingClientRect())),
        'at 844 x 390 the Map tile is on the screen ('+Math.round(br.left-s.left)+','+Math.round(br.top-s.top)+', '+Math.round(br.width)+' x '+Math.round(br.height)+'), clear of the minimap and the other tiles');
      b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerType:'touch',pointerId:9,isPrimary:true}));b.click();q('#panel').style.animation='none';
      const p=q('#panel').getBoundingClientRect(),n=q('#panel > .nav').getBoundingClientRect();
      ok(G.mode==='fullmap'&&p.left>=s.left-.5&&p.right<=s.right+.5&&p.top>=s.top-.5&&p.bottom<=s.bottom+.5&&n.bottom<=p.bottom+.5,
        'a tap opens the full map, fitting the screen ('+Math.round(p.width)+' x '+Math.round(p.height)+'), its bottom bar on it');
      Kit.key('Escape','Escape');ok(G.mode==='esc','and Esc follows its Back to the Game Menu');Kit.key('Escape','Escape');ok(G.mode==='world','then resumes');q('#panel').style.animation=''}
    finally{scr.style.cssText=css0;world()}}
  // ---- the scale ----
  world();press();const v=q('.fm-view'),F=t.FULLMAP,fit=Math.min(v.clientWidth/MW,v.clientHeight/MH),want=Math.max(MW>F.wide?.5:1,Math.min(fit,F.open));
  const css=()=>{const b=q('.fm-pic').getBoundingClientRect();return [Math.round(b.width),Math.round(b.height)]};
  // (2026-11-08, the owner: "make the map allow pinch for zoom in and out": any scale between the zooms' first and last; it opens filling the view)
  ok(F.ppt===want&&css()[0]===Math.round(MW*F.ppt)&&css()[1]===Math.round(MH*F.ppt),'it opens at '+F.ppt.toFixed(2)+' px a tile ('+css().join(' x ')+' in a view of '+v.clientWidth+' x '+v.clientHeight+'): the whole map filling the view, never under 1 at this size');
  ok(fit<1||Math.abs(css()[0]-v.clientWidth)<=1||Math.abs(css()[1]-v.clientHeight)<=1||F.ppt===F.open,'it fills the view, across or down');
  {const z0=F.ppt,up=F.zooms.find(z=>z>z0+1e-6),dn=[...F.zooms].reverse().find(z=>z<up-1e-6);q('[data-act="map-zoom"][data-arg="in"]').click();const z1=F.ppt;q('[data-act="map-zoom"][data-arg="out"]').click();
    ok(z1===up&&F.ppt===dn&&css()[0]===Math.round(MW*dn),'+ steps in to the next zoom ('+z0.toFixed(2)+' → '+z1+' px a tile) and − a step back out ('+F.ppt+')');
    t.fullMapShow(.5);const c=q('.fm-cv');ok(c.width===Math.ceil(MW/2)&&css()[0]===Math.ceil(MW/2),'under 1 px a tile the picture is made at 1 px per 2 tiles ('+c.width+' x '+c.height+'), as Huge opens');
    // a click on the map zooms in there
    const b=q('.fm-pic').getBoundingClientRect(),hx=Math.round(MW*.3),hy=Math.round(MH*.6),ev=(ty,x,y)=>v.dispatchEvent(new PointerEvent(ty,{bubbles:true,button:0,pointerType:'mouse',clientX:x,clientY:y}));
    ev('pointerdown',b.left+hx*.5,b.top+hy*.5);ev('pointerup',b.left+hx*.5,b.top+hy*.5);
    const sx=t.clamp(hx-v.clientWidth/2,0,v.scrollWidth-v.clientWidth),sy=t.clamp(hy-v.clientHeight/2,0,v.scrollHeight-v.clientHeight);
    ok(F.ppt===1&&Math.abs(v.scrollLeft-sx)<2&&Math.abs(v.scrollTop-sy)<2,'a click on the map zooms in to 1:1 there (scrolled to '+v.scrollLeft+','+v.scrollTop+' for tile '+hx+','+hy+')')}
  // ---- a pinch zooms about the fingers' middle, a drag pans, the wheel zooms about the pointer (2026-11-08, the owner: "allow pinch
  // for zoom in and out or drag")
  {t.fullMapShow(1);const r=v.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,pe=(ty,id,x,y)=>v.dispatchEvent(new PointerEvent(ty,{bubbles:true,pointerId:id,pointerType:'touch',button:0,buttons:1,clientX:x,clientY:y}));
   const tile=(x,y)=>{const b=q('.fm-pic').getBoundingClientRect();return [(x-b.left)/F.ppt,(y-b.top)/F.ppt]},t0=tile(cx,cy);
   pe('pointerdown',11,cx-20,cy);pe('pointerdown',12,cx+20,cy);for(let i=1;i<=6;i++){pe('pointermove',11,cx-20-i*6,cy);pe('pointermove',12,cx+20+i*6,cy)}pe('pointerup',11,cx-56,cy);pe('pointerup',12,cx+56,cy);
   const t1=tile(cx,cy),z1=F.ppt;ok(z1>2.5&&z1<3.5&&Math.hypot(t1[0]-t0[0],t1[1]-t0[1])<3&&G.mode==='fullmap','two fingers spread 2.8 times: '+z1.toFixed(2)+' px a tile, the land between them kept there (tile '+t0.map(Math.round)+' → '+t1.map(Math.round)+')');
   const sl=v.scrollLeft;pe('pointerdown',13,cx,cy);for(let i=1;i<=4;i++)pe('pointermove',13,cx-i*10,cy);pe('pointerup',13,cx-40,cy);ok(F.ppt===z1&&Math.abs(v.scrollLeft-sl-40)<=1,'a finger dragged 40 px pans it 40 ('+(v.scrollLeft-sl)+'), no zoom');
   v.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:-200,clientX:cx,clientY:cy}));ok(F.ppt>z1,'the wheel zooms in ('+F.ppt.toFixed(2)+')')}
  t.act('map-close');
  // ---- what it shows: holdings and crossings only where you have seen, the fog, realms and rivers in the legend ----
  const S=t.seenArr(),keep=S.slice();
  S.fill(0);world();press();ok(qa('.fm-pic .fm-h').length===0&&qa('.fm-pic .fm-x').length===0&&q('.fm-you')&&/ 0% explored/.test(q('.fm-head .muted').textContent),'nothing seen: no holdings or crossings marked, you are, 0% explored');
  {const c=q('.fm-cv'),d=c.getContext('2d', { willReadFrequently: true }).getImageData(0,0,c.width,c.height).data,u=t.fmRgb(F.unknown);let dark=0;for(let i=0;i<d.length;i+=4)if(d[i]===u[0]&&d[i+1]===u[1]&&d[i+2]===u[2])dark++;
    ok(dark===c.width*c.height,'and the land all dark ('+dark+' of '+c.width*c.height+')')}
  t.act('map-close');S.fill(1);world();press();
  const xs=(WM.crossings||[]).length;
  ok(qa('.fm-pic .fm-h').length===t.TOWNS.length&&qa('.fm-pic .fm-x').length===xs&&/100% explored/.test(q('.fm-head .muted').textContent),'everything seen: every holding marked ('+qa('.fm-pic .fm-h').length+') and every crossing ('+xs+')');
  // (2026-11-08, the owner: "use holding sprite or places sprite instead of dots or circle")
  {const imgs=qa('.fm-pic .fm-h img.fm-s');ok(imgs.length===t.TOWNS.length&&imgs.every(i=>/^data:image\/png/.test(i.src))&&!qa('.fm-pic .fm-h .fm-k').length,'each holding drawn as its own centre building ('+imgs.length+' pictures), no dot');
   const pl=t.Discovery.places().filter(s=>s instanceof t.Site),was=pl.map(s=>s.seen),cnt=()=>qa('.fm-pic .fm-st img.fm-s').length,n0=cnt();
   try{pl.forEach(s=>s.seen=true);t.fullMapShow(t.FULLMAP.ppt);ok(n0===pl.filter((s,i)=>!s.scoutable||was[i]).length&&cnt()===pl.length&&cnt()>0,'each place found drawn as its sprite ('+cnt()+': caves, ruins, shrines, hideouts, goblin camps), none before you find it ('+n0+')')}
   finally{pl.forEach((s,i)=>s.seen=was[i]);t.fullMapShow(t.FULLMAP.ppt)}}
  {const named=qa('.fm-h b').map(b=>b.textContent),cities=t.TOWNS.filter(h=>h.T.tier>=3).map(h=>h.name);ok(cities.every(n=>named.includes(n)),'the towns, cities and castles named on it ('+named.length+' names)')}
  {const leg=q('.fm-leg').textContent,owners=[...new Set(t.TOWNS.map(h=>h.owner).filter(Boolean))];
    ok(owners.every(f=>leg.includes(t.FACS[f].n))&&/You/.test(leg)&&/Unexplored/.test(leg)&&/Road/.test(leg),'the legend: every realm holding land ('+owners.length+'), you, roads, the unexplored');
    ok(/Great river/.test(leg)&&/Brook/.test(leg),'rivers by width in the legend');
    ok(!xs||['bridge','ford','ferry'].every(k=>!WM.crossings.some(x=>x.kind===k)||leg.includes(t.cap1(k))),'its crossings\' kinds in the legend'+(xs?'':' (none on this map)'))}
  // a realm's tint and a river's width in the picture
  {const c=q('.fm-cv'),g=c.getContext('2d', { willReadFrequently: true }),at=i=>{const x=i%MW,y=Math.floor(i/MW),k=MW/c.width;return [...g.getImageData(Math.floor(x/k),Math.floor(y/k),1,1).data.slice(0,3)]};
    const ti=t.LAND.findIndex((v,i)=>v>=0&&WM.kind[i]!==t.T_WATER&&!(WM.river[i]&3)),base=t.fmRgb(t.PAL[t.CLIMS[WM.clim[ti]]].mini[WM.kind[ti]]),p=at(ti);
    ok(ti>=0&&p.join()!==base.join(),'a realm\'s land is tinted ('+base.join(',')+' → '+p.join(',')+')');
    {const wi=[1,2,3].map(w=>WM.river.findIndex(v=>(v&3)===w)),cs=wi.map(i=>i<0?null:at(i).join());ok(wi.every((i,j)=>i<0||cs[j]===t.fmRgb(F.river[j+1]).join()),'rivers coloured by width (brook, river, great river: '+cs.join(' / ')+')')}}
  t.act('map-close');S.set(keep);
  // ---- a phone on its side: 844 x 390 ----
  {const css0=scr.style.cssText;scr.style.cssText+=';width:844px;height:390px';world();press();q('#panel').style.animation='none';
    const s=scr.getBoundingClientRect(),p=q('#panel').getBoundingClientRect(),n=q('#panel > .nav').getBoundingClientRect(),vw=q('.fm-view').getBoundingClientRect(),lg=q('.fm-leg').getBoundingClientRect(),pn=q('#panel');
    ok(p.left>=s.left-.5&&p.right<=s.right+.5&&p.top>=s.top-.5&&p.bottom<=s.bottom+.5&&n.bottom<=p.bottom+.5&&pn.scrollWidth<=pn.clientWidth+1&&pn.scrollHeight<=pn.clientHeight+1,
      'at 844 x 390 it fits: the window '+Math.round(p.width)+' x '+Math.round(p.height)+', the bottom bar on screen, nothing sideways');
    ok(vw.width>=400&&vw.height>=150&&lg.width<=140&&lg.left>=vw.right-.5,'the map takes the room ('+Math.round(vw.width)+' x '+Math.round(vw.height)+'), the legend a slim column beside it ('+Math.round(lg.width)+' px)');
    ok(t.FULLMAP.ppt>=(MW>t.FULLMAP.wide?.5:1)&&(q('.fm-view').scrollWidth>q('.fm-view').clientWidth||q('.fm-view').scrollHeight>q('.fm-view').clientHeight||MW*t.FULLMAP.ppt<=vw.width),'what does not fit scrolls ('+t.FULLMAP.ppt+' px a tile)');
    t.act('map-close');pn.style.animation='';scr.style.cssText=css0}
  // ---- the build at Huge (1024 x 768), on a made-up map: the opening picture (1 px per 2 tiles), and 1:1 ----
  {const m=new t.WorldMap(1024,768,0),n=m.w*m.h,seen=new Uint8Array(n),land=new Int16Array(n).fill(-1),r=t.seeded(77),nt=t.TOWNS.length;
    for(let i=0;i<n;i++){m.kind[i]=r()<.3?t.T_FOREST:r()<.1?t.T_WATER:t.T_OPEN;m.clim[i]=(i/m.w|0)*4/m.h|0;seen[i]=r()<.6?1:0;land[i]=r()<.7?(i%m.w)*nt/m.w|0:-1;if(r()<.02)m.river[i]=1+(r()*3|0)}
    const time=k=>{const ms=[];for(let j=0;j<3;j++){t.fullMapPic(m,k,seen,land,t.TOWNS);ms.push(F.ms)}return ms.sort((a,b)=>a-b)[1]},m2=time(2),m1=time(1);
    ok(m2<=25,'at Huge the opening picture (512 x 384) builds in '+m2.toFixed(1)+' ms (25 at most)');info('at Huge, 1:1 (1024 x 768) builds in '+m1.toFixed(1)+' ms')}
  // ---- the loading screens' steps: the generator's real stages ----
  {const run0=window.runSteps,seen=[],stages=t.GEN_STAGES.map(s=>s.label);window.runSteps=(title,steps)=>{seen.push([title,steps.map(s=>s.label)]);return Promise.resolve()};
    try{
      t.begin('soldier',t.normSettings({preset:'normal',seed:'fmone'}));
      t.begin('soldier',WM.settings||undefined);
      const sv={v:t.SAVE_V,at:1,day:3,P:{race:'human',bg:'soldier',level:1,gold:5,army:{}},world:{v:t.SAVE_V,map:{gen:'ashmark-1',settings:t.normSettings({preset:'normal',seed:'fmone'}),sum:1}}};
      localStorage.setItem(t.slotKey('5'),JSON.stringify(sv));t.loadGame('5');localStorage.removeItem(t.slotKey('5'));
    }finally{window.runSteps=run0}
    const [a,b,c]=seen,eq=(x,y)=>x&&x.join(' · ')===y.join(' · ');
    ok(a&&a[0]==='Forging the world…'&&eq(a[1],[...stages,'Drawing borders','Peopling the land','Painting the first lands','Raising the walls']),'a new world: "'+(a&&a[0])+'" '+(a&&a[1].join(' · ')));
    ok(b&&b[0]==='Forging the world…'&&eq(b[1],['Peopling the land','Painting the first lands','Raising the walls']),'the world in, again: '+(b&&b[1].join(' · ')));
    ok(c&&c[0]==='Returning to Fmone…'&&eq(c[1],['Reading the save',...stages,'Restoring holdings and parties','Painting the land','Raising the walls'])/* (the walls' step since the holdings' walls went solid: loading.js holdShutWarm) */,'a save from another world: "'+(c&&c[0])+'" '+(c&&c[1].join(' · ')))}
});
