'use strict';
/* ---------- the full map (doc/WORLD_DESIGN.md §3.4, §12.4, D45): a window in the frame rule, opened by M and by a click or a tap on
   the minimap (input.js); M again or Esc closes it, and the world waits while it is open, as it does under Help.
   Its header: the world's name, its size, how much of it you have explored, and the zoom (− +). Its content: the map, and its
   legend beside it. Its bottom bar: Close.
   The map: the land from the tile data (fullMapPic: the minimap's colours, rivers by width, each realm's tint and a stronger line
   where two realms meet, the dark over land you have never seen), and over it, as marks, the holdings and crossings on land you
   have seen, your quests' goals (the one you track the strongest: world/quests.js questMapMarks), the rumours' "?" (world/news.js
   rumourMarks: the Chronicle's Show on map centres on one) and you.
   Its scale: CSS px a tile, between FULLMAP.zooms' first and last. It opens filling the view (fullMapFit), never under 1 px a
   tile (under FULLMAP.wide tiles across) or 1 px per 2 tiles (wider: Huge), so Large scrolls. − and + (the buttons, the keys)
   step it through FULLMAP.zooms; a click or a tap on the map zooms in a step there. Under 1 px a tile the picture is made at 1 px
   per 2 tiles, a block's widest river kept.
   Opened from another window (Show on map, your Quests: ui/questwindow.js) it is centred where it is told, its bar's Back on the
   left going back there.
   (2026-11-08, the owner: "make it look more like maps with a paper textures and color tones. Make the map allow pinch for zoom in
   and out or drag; use holding sprite or places sprite instead of dots or circle") An old map: the land an ink wash on paper
   (fmWash: muted, toward FULLMAP.paper), its coasts inked, the realms' borders darker, what you never saw the bare paper; its grain,
   stains and a darkened, torn edge laid over it (fullMapPaper). Each holding its own centre building (structures.js lotSprite) and
   each place you have seen its sprite (siteSprite), sized by the zoom (fmIconScale), the realm's colour under it, the names in ink.
   Any zoom between the first and last of FULLMAP.zooms: a pinch, the wheel or a trackpad's, about the point under it (fullMapScale);
   − and + step through FULLMAP.zooms; a drag (a finger or the mouse) pans ---------- */
const FULLMAP={zooms:[.5,1,2,3,4,6],wide:640,open:4,ppt:1,pics:{},drag:null,pinch:null,ms:0,icons:new Map(),
  // (the rivers by width (1 a brook, 2 a river, 3 a great river), the realms' tint and border strength, the unexplored land: the bare
  // paper)
  river:['','#7ea4b4','#55809c','#3a6283'],riverN:['','Brook','River','Great river'],tint:.3,edge:.75,unknown:'#d2bf95',road:'#9a7a4a',
  // (the paper and the wash on it: how much of a ground's own colour it keeps (sat), how much of it over the paper (wash); the
  // coast's ink (× the land by the water); a border's ink (its realm's colour × ink); the paper's grain and edge: fullMapPaper)
  paper:'#e2cfa3',sat:.55,wash:.62,coast:.68,ink:.55,
  // (the icons' sizes, px at 1 px a tile, by kind (a place's: site); × fmIconScale)
  icon:{city:30,town:26,castle:28,fort:22,village:22,hamlet:18,site:16},
  // (the holdings' marks by kind; another kind is marked as a village; names shown at FULLMAP.names px a tile, or from tier 3)
  kinds:{city:'City',town:'Town',castle:'Castle',fort:'Fort',village:'Village',hamlet:'Hamlet'},names:2};
// (a rumour's "?": its look, inline)
const fmRumour=()=>'color:'+RUMOUR_COL+';font:700 12px/1 Arial,sans-serif;text-shadow:0 0 2px #000,0 1px 1px #000',FM_RGB={},fmRgb=c=>FM_RGB[c]||(FM_RGB[c]=[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]);
// (a ground's colour as an ink wash on the paper: muted (FULLMAP.sat), laid over the paper (wash), toned by it)
const fmWash=c=>{const F=FULLMAP,P=fmRgb(F.paper),l=c[0]*.3+c[1]*.59+c[2]*.11;return c.map((v,i)=>Math.round(((l+(v-l)*F.sat)*F.wash+P[i]*(1-F.wash))*(.8+.2*P[i]/255)))};
// (the icons' scale at ppt px a tile: smaller than the land grows, never under .65 or over 2)
const fmIconScale=ppt=>clamp(Math.sqrt(ppt)*.8,.65,2);
/* the picture: map m at 1 px per k tiles, from its tile data, what you have seen (seen: a byte a tile) and the land (land: an index
   into towns a tile, -1 wild); a canvas. Its time in FULLMAP.ms. box: only that part of it, in tiles ({x, y, w, h}, inside the map;
   none: all of it), as the minimap draws it (render.js MINIMAP) */
function fullMapPic(m,k,seen,land,towns,box){
  const t0=performance.now(),F=FULLMAP,W0=m.w,H0=m.h,bx=box?box.x:0,by=box?box.y:0,w=Math.ceil((box?box.w:W0)/k),h=Math.ceil((box?box.h:H0)/k),N=w*h,img=new ImageData(w,h),d=img.data,own=new Int16Array(N),sn=new Uint8Array(N);
  const lut=[],riv=F.river.map(c=>c&&fmRgb(c)),un=fmRgb(F.unknown),facs=[],fi=new Map();
  CLIMS.forEach((c,ci)=>PAL[c].mini.forEach((col,kd)=>lut[ci*8+kd]=fmWash(fmRgb(col))));const wat=new Uint8Array(N),rv=new Uint8Array(N);
  const tf=towns.map(t=>{const o=t.owner||'';if(!fi.has(o)){fi.set(o,facs.length);facs.push(fmRgb(landCol(t.owner)))}return fi.get(o)});
  // the ground (a block's middle tile), its widest river, its realm (none on water), seen if any of it is
  for(let y=0,o=0;y<h;y++)for(let x=0;x<w;x++,o++){let rw=0,s=0,i=(by+y)*W0+bx+x;
    if(k===1){s=seen[i];rw=m.river[i]&3}// (1:1: the tile itself)
    else{const X=bx+x*k,Y=by+y*k;for(let dy=0;dy<k&&Y+dy<H0;dy++)for(let dx=0;dx<k&&X+dx<W0;dx++){const j=(Y+dy)*W0+X+dx;if(seen[j])s=1;const r=m.river[j]&3;if(r>rw)rw=r}
      i=Math.min(H0-1,Y+(k>>1))*W0+Math.min(W0-1,X+(k>>1))}
    const c=rw?riv[rw]:lut[m.clim[i]*8+m.kind[i]],p=o*4;
    d[p]=c[0];d[p+1]=c[1];d[p+2]=c[2];d[p+3]=255;own[o]=rw||m.kind[i]===T_WATER||land[i]<0?-1:tf[land[i]];sn[o]=s;wat[o]=!rw&&m.kind[i]===T_WATER;rv[o]=rw}
  // the realms' tint, its border inked (its colour × FULLMAP.ink) where another realm's land touches; the coast inked; the bare paper
  // over what you never saw
  for(let y=0,o=0;y<h;y++)for(let x=0;x<w;x++,o++){const p=o*4;if(!sn[o]){d[p]=un[0];d[p+1]=un[1];d[p+2]=un[2];continue}
    if(!wat[o]&&!rv[o]&&(x>0&&wat[o-1]||x<w-1&&wat[o+1]||y>0&&wat[o-w]||y<h-1&&wat[o+w])){d[p]*=F.coast;d[p+1]*=F.coast;d[p+2]*=F.coast;continue}const f=own[o];if(f<0)continue;
    const l=x>0?own[o-1]:-1,r=x<w-1?own[o+1]:-1,u=y>0?own[o-w]:-1,b=y<h-1?own[o+w]:-1,e=l>=0&&l!==f||r>=0&&r!==f||u>=0&&u!==f||b>=0&&b!==f,a=e?F.edge:F.tint,c=facs[f],k=e?F.ink:1;
    d[p]+=(c[0]*k-d[p])*a;d[p+1]+=(c[1]*k-d[p+1])*a;d[p+2]+=(c[2]*k-d[p+2])*a}
  // (the holdings' walls and fences where you have seen them, a pixel each piece, its colour by its kind: world/townwalls.js)
  for(const t of towns){const r=TownWall.of(t);if(!r)continue;const c=fmRgb(TownWall.mapCol(t));for(const q of r.parts){const qx=Math.floor((q.x-bx)/k),qy=Math.floor((q.y-by)/k);if(!seen[q.i]||qx<0||qy<0||qx>=w||qy>=h)continue;const p=(qy*w+qx)*4;d[p]=c[0];d[p+1]=c[1];d[p+2]=c[2]}}
  const cv=mkc(w,h,g=>g.putImageData(img,0,0));F.ms=performance.now()-t0;return cv}
// the marks over it at ppt px a tile: the crossings and holdings on land you have seen (each its name and kind on hover), your
// quests' goals (the tracked one the strongest), the rumours' "?" (the rumour on hover), and you
// (an icon: the picture cut to what is drawn on it, as an image's address, kept a holding or a place while its look holds: a
// holding's centre building (structures.js lotSprite, burnt when ruined), a place's sprite (siteSprite); null: none)
function fmIcon(o){const F=FULLMAP,town=!(o instanceof Site),l=town?(o.lots||[]).find(q=>q.k==='centre'):null;if(town&&!l)return null;
  const c=town?lotSprite(o,l):siteSprite(o),key=c,had=F.icons.get(o);if(had&&had.key===key)return had;
  const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=-1,y1=-1;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
  if(x1<0)return null;const w=x1-x0+1,h=y1-y0+1,cut=mkc(w,h,g=>g.drawImage(c,-x0,-y0)),r={key,url:cut.toDataURL(),cv:cut,w,h};F.icons.set(o,r);return r}
// (an icon's tag: its width the kind's (FULLMAP.icon) × the zoom's scale (--zs, on the picture), its height by its shape)
const fmImg=(ic,b)=>'<img class="fm-s" src="'+ic.url+'" alt="" style="--b:'+b+';--a:'+(ic.h/ic.w).toFixed(3)+'">';
function fullMapMarks(ppt){const F=FULLMAP,at=(x,y)=>'left:calc(var(--z) * '+x.toFixed(2)+'px);top:calc(var(--z) * '+y.toFixed(2)+'px)';let h='';
  for(const x of WM.crossings||[]){const tx=x.i%MW,ty=Math.floor(x.i/MW);if(seenTile(tx,ty))h+='<i class="fm-x '+x.kind+'" style="'+at(tx+.5,ty+.5)+'" title="'+cap1(x.kind)+'"></i>'}
  for(const t of TOWNS){if(!seenTile(t.tx,t.ty))continue;const k=F.kinds[t.kind]?t.kind:'village',T=HOLDING_TYPES[t.kind];
    const ic=fmIcon(t);h+='<span class="fm-h '+k+(T&&T.tier>=3?' big':'')+'" style="'+at(t.tx+.5,t.ty+.5)+';--c:'+(t._memCol||facCol(t))+'" title="'+htmlText(Discovery.nameOf(t)+(Discovery.named(t)?', '+t.label:'')+(t.owner?' of the '+FACS[t.owner].n:''))+'">'+
      (ic?fmImg(ic,F.icon[k]):'<i class="fm-k '+k+'"></i>')+'<b'+(Discovery.named(t)?'':' class="fm-unk"')+'>'+htmlText(Discovery.nameOf(t))+'</b></span>'}
  // (the places you have seen (a cave, ruins, a shrine, a hideout, a goblin camp: world/discovery.js), each its sprite, its name or kind
  // on hover; a hideout only once found)
  for(const s of Discovery.places()){if(!(s instanceof Site)||!seenTile(Math.floor(s.x/TILE),Math.floor(s.y/TILE))||s.scoutable&&!s.seen)continue;const ic=fmIcon(s);if(ic)h+='<span class="fm-st" style="'+at(s.x/TILE,s.y/TILE)+'" title="'+htmlText(Discovery.nameOf(s))+'">'+fmImg(ic,F.icon.site)+'</span>'}
  // (the provinces: at each seat (its name the holding's own, under it) its danger and a lock where it refuses you; the province's
  // name and what makes it so in its tooltip: world/provinces.js)
  if(PROVINCE.on)for(const p of Provinces.all()){const s=p.seat;if(!seenTile(s.tx,s.ty))continue;const d=Provinces.danger(p),lock=GATES.on&&!Gates.admits(s).ok;
    h+='<span class="fm-prov lv'+d.lv+'" style="'+at(s.tx+.5,s.ty+.5)+'" title="'+htmlText(p.name+' ('+p.holdings.length+' holdings): '+d.word+(d.what.length?' ('+d.what.join(', ')+')':'')+(lock?'. Its gate refuses you: '+Gates.admits(s).need.join(', or '):''))+'">'+d.word+(lock?' <i class="fm-lock"></i>':'')+'</span>'}
  for(const m of questMapMarks())h+='<i class="fm-q'+(m.on?' on':'')+'" style="'+at(m.x/TILE,m.y/TILE)+'" title="'+htmlText(m.title)+(m.on?' (tracked)':'')+'"></i>';
  for(const m of rumourMarks())if(rumourFade(m)>0)h+='<b class="fm-r" style="'+at(m.x/TILE,m.y/TILE)+';'+fmRumour()+'" title="'+htmlText('A rumour (day '+m.day+'): '+m.t)+'">?</b>';
  return h+'<span class="fm-you" style="'+at(P.x/TILE,P.y/TILE)+'" title="You"></span>'}
// the legend: the realms that hold land, the kinds of holding, rivers and crossings this world has, then you, roads, the unknown
function fullMapLegend(){const F=FULLMAP,cr=WM.crossings||[],it=(i,n)=>'<li>'+i+'<span>'+n+'</span></li>',sec=(n,l)=>l.length?'<div class="lab">'+n+'</div><ul>'+l.join('')+'</ul>':'',sw=c=>'<i class="fm-sw" style="background:'+c+'"></i>';
  const fs=Object.keys(FACS).filter(f=>TOWNS.some(t=>t.owner===f)).map(f=>it(sw(landCol(f)),FACS[f].n)).concat(TOWNS.some(t=>!t.owner)?[it(sw(landCol(null)),'No realm')]:[]);
  return '<aside class="fm-leg" aria-label="Legend">'+sec('Realms',fs)+sec('Holdings',Object.keys(F.kinds).filter(k=>TOWNS.some(t=>(F.kinds[t.kind]?t.kind:'village')===k)).map(k=>{const t=TOWNS.find(t=>(F.kinds[t.kind]?t.kind:'village')===k),ic=t&&fmIcon(t);return it(ic?'<img class="fm-ls" src="'+ic.url+'" alt="">':'<i class="fm-k '+k+'" style="--c:#d8d0b8"></i>',F.kinds[k])}))+
    sec('Rivers',WM.rivers&&WM.rivers.length?[1,2,3].map(w=>it(sw(F.river[w]),F.riverN[w])):[])+sec('Crossings',['bridge','ford','ferry'].filter(k=>cr.some(x=>x.kind===k)).map(k=>it('<i class="fm-x '+k+'"></i>',cap1(k))))+
    sec('Provinces',!PROVINCE.on?[]:PROVINCE.words.map((w,i)=>it('<span class="fm-prov lv'+i+'" style="position:static;transform:none;translate:none">'+w+'</span>',['nothing on its land your army need fear','something to watch','strong enough to beat you','far stronger than you'][i]))).concat(GATES.on?[it('<i class="fm-lock"></i>','Its seat refuses you')]:[])+
    sec('Map',[it('<i class="fm-you"></i>','You'),...(P.quests.length?[it('<i class="fm-q"></i>','Quest')]:[]),...(P.track?[it('<i class="fm-q on"></i>','Tracked quest')]:[]),...(rumourMarks().some(m=>rumourFade(m)>0)?[it('<b class="fm-r" style="'+fmRumour()+'">?</b>','Rumour')]:[]),it(sw(F.road),'Road'),it(sw(F.unknown),'Unexplored')])+'</aside>'}
// the scale it opens at in a view of the room the window gives it (fullMapFit: the whole map filling it, never under 1 px a tile
// (.5 over FULLMAP.wide tiles) or over FULLMAP.open), and the zoom a step of FULLMAP.zooms in or out (dir), about tile point at
// (else the view's middle)
function fullMapFit(v){const F=FULLMAP,fit=Math.min(v.clientWidth/MW,v.clientHeight/MH);return Math.max(MW>F.wide?.5:1,Math.min(fit,F.open))}
function fullMapZoom(dir,at){const F=FULLMAP,Z=F.zooms,z=dir>0?Z.find(q=>q>F.ppt+1e-6):[...Z].reverse().find(q=>q<F.ppt-1e-6);if(z!=null&&G.mode==='fullmap')fullMapShow(z,at)}
/* the paper laid over the picture (w x h, the picture's own px): its grain (a tile of warm specks and fibres, repeated) and its edge
   (a mask: the paper torn along its sides, a little in from them), each an image's address, kept by its size */
// (the grain: a canvas, kept; the minimap lays it on too)
let FM_GRAIN=null;
const fmGrain=()=>FM_GRAIN||(FM_GRAIN=mkc(96,96,g=>{const im=g.createImageData(96,96),d=im.data,hs=(x,y,s)=>PX.hash(x,y,s);for(let y=0;y<96;y++)for(let x=0;x<96;x++){const p=(y*96+x)*4,n=hs(x,y,7),f=hs(x>>2,y,9)<.06?.5:0;
    d[p]=120;d[p+1]=86;d[p+2]=48;d[p+3]=Math.round(255*(n<.12?.22:n<.4?.08:0)+255*f*.18)}g.putImageData(im,0,0)}));
function fullMapPaper(w,h){const F=FULLMAP,key=w+'x'+h;if(F.paperOf===key)return F.paperArt;F.paperOf=key;const hs=(x,y,s)=>PX.hash(x,y,s),grain=fmGrain();
  const mw=Math.max(64,Math.round(w)),mh=Math.max(48,Math.round(h)),edge=mkc(mw,mh,g=>{const im=g.createImageData(mw,mh),d=im.data,dp=(a,s)=>2+3*hs(a>>1,s,11)+2*hs(a>>3,s,13);
    for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){const inn=x>=dp(y,1)&&mw-1-x>=dp(y,2)&&y>=dp(x,3)&&mh-1-y>=dp(x,4);d[(y*mw+x)*4+3]=inn?255:0}g.putImageData(im,0,0)});
  return F.paperArt={grain:grain.toDataURL(),edge:edge.toDataURL()}}
// the scale set to ppt px a tile (clamped to FULLMAP.zooms' first and last), the tile under client point c kept under it (none: the
// view's middle; tp: that tile given, a pinch's, so no rounding gathers): the picture's size, the marks' place and size (--z, --zs),
// the names from FULLMAP.names, the zoom buttons
function fullMapScale(ppt,c,tp){const F=FULLMAP,Z=F.zooms,v=panel.querySelector('.fm-view'),b=v&&v.querySelector('.fm-pic');if(!b)return;ppt=clamp(ppt,Z[0],Z[Z.length-1]);
  const vr=v.getBoundingClientRect();c=c||{x:vr.left+v.clientWidth/2,y:vr.top+v.clientHeight/2};const r0=b.getBoundingClientRect(),tx=tp?tp.x:(c.x-r0.left)/F.ppt,ty=tp?tp.y:(c.y-r0.top)/F.ppt;
  const k=ppt<1?Math.round(1/ppt):1,pic=F.pics[k]||(F.pics[k]=fullMapPic(WM,k,seenArr(),LAND,TOWNS)),cv=b.querySelector('canvas');if(cv!==pic){pic.className='fm-cv';if(cv)cv.replaceWith(pic);else b.prepend(pic)}
  F.ppt=ppt;v.dataset.ppt=ppt;b.style.width=pic.width*k*ppt+'px';b.style.height=pic.height*k*ppt+'px';b.style.setProperty('--z',ppt);b.style.setProperty('--zs',fmIconScale(ppt).toFixed(3));v.classList.toggle('names',ppt>=F.names);
  const r1=b.getBoundingClientRect();v.scrollLeft+=r1.left+tx*ppt-c.x;v.scrollTop+=r1.top+ty*ppt-c.y;
  for(const [a,ok] of [['out',ppt>Z[0]+1e-6],['in',ppt<Z[Z.length-1]-1e-6]]){const z=panel.querySelector('[data-act="map-zoom"][data-arg="'+a+'"]');if(z)z.disabled=!ok}}
// the map drawn at ppt px a tile, tile point at in the middle of the view (else the point there now)
function fullMapShow(ppt,at){const F=FULLMAP,v=panel.querySelector('.fm-view');if(!v)return;
  if(!at)at={x:(v.scrollLeft+v.clientWidth/2)/F.ppt,y:(v.scrollTop+v.clientHeight/2)/F.ppt};
  const k=ppt<1?Math.round(1/ppt):1,pic=F.pics[k]||(F.pics[k]=fullMapPic(WM,k,seenArr(),LAND,TOWNS)),b=v.querySelector('.fm-pic'),pp=fullMapPaper(pic.width*k,pic.height*k);
  b.innerHTML=fullMapMarks(ppt);b.style.setProperty('--grain','url('+pp.grain+')');b.style.setProperty('--edge','url('+pp.edge+')');F.ppt=ppt;fullMapScale(ppt);
  v.scrollLeft=at.x*ppt-v.clientWidth/2;v.scrollTop=at.y*ppt-v.clientHeight/2}
/* a drag (the mouse or a finger) pans the map; two fingers pinch it in or out about their middle, and pan with it; the wheel (a
   trackpad's pinch too) zooms about the pointer; a click or a tap (no drag) zooms in a step where it was */
function fullMapPan(v){const F=FULLMAP,pts=new Map(),mid=()=>{const a=[...pts.values()];return{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}};
  v.addEventListener('pointerdown',e=>{if(e.button!==0)return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});try{v.setPointerCapture(e.pointerId)}catch(err){}
    if(pts.size===1)F.drag={x:e.clientX,y:e.clientY,sl:v.scrollLeft,st:v.scrollTop,moved:false};else if(pts.size===2){const m=mid(),r=v.querySelector('.fm-pic').getBoundingClientRect();F.pinch={d:Math.max(1,m.d),z:F.ppt,t:{x:(m.x-r.left)/F.ppt,y:(m.y-r.top)/F.ppt}};if(F.drag)F.drag.moved=true}});
  v.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(F.pinch&&pts.size>=2){const m=mid(),P0=F.pinch;fullMapScale(P0.z*m.d/P0.d,m,P0.t);return}
    const d=F.drag;if(!d)return;if(e.pointerType==='mouse'&&!(e.buttons&1)){F.drag=null;pts.delete(e.pointerId);return}const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.hypot(dx,dy)>5)d.moved=true;if(d.moved){v.scrollLeft=d.sl-dx;v.scrollTop=d.st-dy}});
  const end=e=>{pts.delete(e.pointerId);if(F.pinch){if(pts.size<2)F.pinch=null;F.drag=null;return}const d=F.drag;F.drag=null;if(e.type!=='pointerup'||!d||d.moved)return;
    const r=v.querySelector('.fm-pic').getBoundingClientRect();fullMapZoom(1,{x:(e.clientX-r.left)/F.ppt,y:(e.clientY-r.top)/F.ppt})};
  v.addEventListener('pointerup',end);v.addEventListener('pointercancel',end);
  v.addEventListener('wheel',e=>{e.preventDefault();fullMapScale(F.ppt*Math.pow(2,-e.deltaY*(e.ctrlKey?.01:.0025)),{x:e.clientX,y:e.clientY})},{passive:false})}
// the window, from the map only (false when it cannot open: somewhere else, or another window open); at: the tile point in its
// middle, a step closer than it opens (none: you), back: its bar's Back ([act, arg, label]: opened from another window)
function fullMapOpen(at,back){if(G.mode!=='world'||G.modal)return false;const S=seenArr();let n=0;for(let i=0;i<S.length;i++)n+=S[i];const pc=n*100/S.length;FULLMAP.pics={};
  if(!openOver('fullmap','<div class="top"><div class="fm-head"><h2>Map of '+htmlText(worldName(WM))+'</h2><span class="muted">'+MW+' × '+MH+' tiles, '+(!n?0:pc<10?pc.toFixed(1):Math.floor(pc))+'% explored</span></div>'+
    '<div class="fm-zoom" role="group" aria-label="Zoom"><button class="btn sm" type="button" data-act="map-zoom" data-arg="out" title="Zoom out (−)">−</button><button class="btn sm" type="button" data-act="map-zoom" data-arg="in" title="Zoom in (+, or click the map)">+</button></div></div>'+
    '<div class="fm"><div class="fm-view" tabindex="0" aria-label="The map"><div class="fm-pic"></div></div>'+fullMapLegend()+'</div>'+nav(fbMenu(back),['map-close',null,'Close'])))return false;
  panel.classList.add('fmap');const v=panel.querySelector('.fm-view');const z=fullMapFit(v),Z=FULLMAP.zooms;fullMapShow(at?Z[Math.min(Z.length-1,Z.indexOf(z)+1)]:z,at||{x:P.x/TILE,y:P.y/TILE});fullMapPan(v);v.focus({preventScroll:true});return true}
// M: the map opened, or closed if open; true if it did either
function fullMapKey(){if(G.mode==='fullmap'){closeOver();return true}return fullMapOpen()}
onAct('map-',(a,arg)=>{if(a==='map-close'&&G.mode==='fullmap')closeOver();else if(a==='map-zoom')fullMapZoom(arg==='in'?1:-1)});
// the minimap's place on the screen, in game px, as render.js drawWorld draws it (the same size at any map zoom), and whether
// point p (input.js toCanvas) is on it
function fullMapMiniRect(){return worldMiniRect()}// (the minimap's own rectangle: gfx/render.js)
function fullMapHit(p){const r=fullMapMiniRect();return p.x>=r.x-1&&p.y>=r.y-1&&p.x<r.x+r.w+1&&p.y<r.y+r.h+1}
// + and − zoom while it is open
window.addEventListener('keydown',e=>{if(G.mode!=='fullmap'||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;const k=keyOf(e);if(k==='='||k==='+'||k==='-'){e.preventDefault();fullMapZoom(k==='-'?-1:1)}});
