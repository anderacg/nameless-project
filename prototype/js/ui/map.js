'use strict';
/* ---------- the full map (doc/WORLD_DESIGN.md §3.4, §12.4, D45): a window in the frame rule, opened by M and by a click or a tap on
   the minimap (input.js); M again or Esc closes it, and the world waits while it is open, as it does under Help.
   Its header: the world's name, its size, how much of it you have explored, and the zoom (− +). Its content: the map, and its
   legend beside it. Its bottom bar: Close.
   The map: the land from the tile data (fullMapPic: the minimap's colours, rivers by width, each realm's tint and a stronger line
   where two realms meet, the dark over land you have never seen), and over it, as marks, the holdings and crossings on land you
   have seen, your quests' goals (the one you track the strongest: world/quests.js questMapMarks), the rumours' "?" (world/news.js
   rumourMarks: the Chronicle's Show on map centres on one) and you.
   Its scale: FULLMAP.zooms, CSS px a tile. It opens at the largest that fits, never under 1 px a tile (under FULLMAP.wide tiles
   across) or 1 px per 2 tiles (wider: Huge): Normal 1 px a tile, Large 1 px a tile and scrolls, Huge 1 px
   per 2 tiles. − and + (the buttons, the keys) step it; a click or a tap on the map zooms in there (at Huge: 1:1 by region); a
   drag pans (a finger scrolls). Under 1 px a tile the picture is made at 1 px per 2 tiles, a block's widest river kept.
   Opened from another window (Show on map, your Quests: ui/questwindow.js) it is centred where it is told, its bar's Back on the
   left going back there ---------- */
const FULLMAP={zooms:[.5,1,2,3,4,6],wide:640,open:4,ppt:1,pics:{},drag:null,ms:0,
  // (the rivers by width (1 a brook, 2 a river, 3 a great river), the realms' tint and border strength, the unexplored land)
  river:['','#8cc0ec','#4f8fd6','#2a5fae'],riverN:['','Brook','River','Great river'],tint:.38,edge:.8,unknown:'#0e1119',road:'#b89b62',
  // (the holdings' marks by kind; another kind is marked as a village; names shown at FULLMAP.names px a tile, or from tier 3)
  kinds:{city:'City',town:'Town',castle:'Castle',village:'Village'},names:2};
// (a rumour's "?": its look, inline)
const fmRumour=()=>'color:'+RUMOUR_COL+';font:700 12px/1 Arial,sans-serif;text-shadow:0 0 2px #000,0 1px 1px #000',FM_RGB={},fmRgb=c=>FM_RGB[c]||(FM_RGB[c]=[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]);
/* the picture: map m at 1 px per k tiles, from its tile data, what you have seen (seen: a byte a tile) and the land (land: an index
   into towns a tile, -1 wild); a canvas. Its time in FULLMAP.ms */
function fullMapPic(m,k,seen,land,towns){
  const t0=performance.now(),F=FULLMAP,W0=m.w,H0=m.h,w=Math.ceil(W0/k),h=Math.ceil(H0/k),N=w*h,img=new ImageData(w,h),d=img.data,own=new Int16Array(N),sn=new Uint8Array(N);
  const lut=[],riv=F.river.map(c=>c&&fmRgb(c)),un=fmRgb(F.unknown),facs=[],fi=new Map();
  CLIMS.forEach((c,ci)=>PAL[c].mini.forEach((col,kd)=>lut[ci*8+kd]=fmRgb(col)));
  const tf=towns.map(t=>{const o=t.owner||'';if(!fi.has(o)){fi.set(o,facs.length);facs.push(fmRgb(landCol(t.owner)))}return fi.get(o)});
  // the ground (a block's middle tile), its widest river, its realm (none on water), seen if any of it is
  for(let y=0,o=0;y<h;y++)for(let x=0;x<w;x++,o++){let rw=0,s=0,i=o;
    if(k===1){s=seen[o];rw=m.river[o]&3}// (1:1: the tile itself)
    else{for(let dy=0;dy<k&&y*k+dy<H0;dy++)for(let dx=0;dx<k&&x*k+dx<W0;dx++){const j=(y*k+dy)*W0+x*k+dx;if(seen[j])s=1;const r=m.river[j]&3;if(r>rw)rw=r}
      i=Math.min(H0-1,y*k+(k>>1))*W0+Math.min(W0-1,x*k+(k>>1))}
    const c=rw?riv[rw]:lut[m.clim[i]*8+m.kind[i]],p=o*4;
    d[p]=c[0];d[p+1]=c[1];d[p+2]=c[2];d[p+3]=255;own[o]=rw||m.kind[i]===T_WATER||land[i]<0?-1:tf[land[i]];sn[o]=s}
  // the realms' tint, stronger where another realm's land touches; the dark over what you never saw
  for(let y=0,o=0;y<h;y++)for(let x=0;x<w;x++,o++){const p=o*4;if(!sn[o]){d[p]=un[0];d[p+1]=un[1];d[p+2]=un[2];continue}const f=own[o];if(f<0)continue;
    const l=x>0?own[o-1]:-1,r=x<w-1?own[o+1]:-1,u=y>0?own[o-w]:-1,b=y<h-1?own[o+w]:-1,a=l>=0&&l!==f||r>=0&&r!==f||u>=0&&u!==f||b>=0&&b!==f?F.edge:F.tint,c=facs[f];
    d[p]+=(c[0]-d[p])*a;d[p+1]+=(c[1]-d[p+1])*a;d[p+2]+=(c[2]-d[p+2])*a}
  const cv=mkc(w,h,g=>g.putImageData(img,0,0));F.ms=performance.now()-t0;return cv}
// the marks over it at ppt px a tile: the crossings and holdings on land you have seen (each its name and kind on hover), your
// quests' goals (the tracked one the strongest), the rumours' "?" (the rumour on hover), and you
function fullMapMarks(ppt){const F=FULLMAP,at=(x,y)=>'left:'+(x*ppt).toFixed(1)+'px;top:'+(y*ppt).toFixed(1)+'px';let h='';
  for(const x of WM.crossings||[]){const tx=x.i%MW,ty=Math.floor(x.i/MW);if(seenTile(tx,ty))h+='<i class="fm-x '+x.kind+'" style="'+at(tx+.5,ty+.5)+'" title="'+cap1(x.kind)+'"></i>'}
  for(const t of TOWNS){if(!seenTile(t.tx,t.ty))continue;const k=F.kinds[t.kind]?t.kind:'village',T=HOLDING_TYPES[t.kind];
    h+='<span class="fm-h" style="'+at(t.tx+.5,t.ty+.5)+'" title="'+htmlText(t.name+', '+t.label+(t.owner?' of the '+FACS[t.owner].n:''))+'"><i class="fm-k '+k+'" style="--c:'+(t._memCol||facCol(t))+'"></i>'+
      (ppt>=F.names||T&&T.tier>=3?'<b>'+htmlText(t.name)+'</b>':'')+'</span>'}
  for(const m of questMapMarks())h+='<i class="fm-q'+(m.on?' on':'')+'" style="'+at(m.x/TILE,m.y/TILE)+'" title="'+htmlText(m.title)+(m.on?' (tracked)':'')+'"></i>';
  for(const m of rumourMarks())if(rumourFade(m)>0)h+='<b class="fm-r" style="'+at(m.x/TILE,m.y/TILE)+';'+fmRumour()+'" title="'+htmlText('A rumour (day '+m.day+'): '+m.t)+'">?</b>';
  return h+'<span class="fm-you" style="'+at(P.x/TILE,P.y/TILE)+'" title="You"></span>'}
// the legend: the realms that hold land, the kinds of holding, rivers and crossings this world has, then you, roads, the unknown
function fullMapLegend(){const F=FULLMAP,cr=WM.crossings||[],it=(i,n)=>'<li>'+i+'<span>'+n+'</span></li>',sec=(n,l)=>l.length?'<div class="lab">'+n+'</div><ul>'+l.join('')+'</ul>':'',sw=c=>'<i class="fm-sw" style="background:'+c+'"></i>';
  const fs=Object.keys(FACS).filter(f=>TOWNS.some(t=>t.owner===f)).map(f=>it(sw(landCol(f)),FACS[f].n)).concat(TOWNS.some(t=>!t.owner)?[it(sw(landCol(null)),'No realm')]:[]);
  return '<aside class="fm-leg" aria-label="Legend">'+sec('Realms',fs)+sec('Holdings',Object.keys(F.kinds).filter(k=>TOWNS.some(t=>(F.kinds[t.kind]?t.kind:'village')===k)).map(k=>it('<i class="fm-k '+k+'" style="--c:#d8d0b8"></i>',F.kinds[k])))+
    sec('Rivers',WM.rivers&&WM.rivers.length?[1,2,3].map(w=>it(sw(F.river[w]),F.riverN[w])):[])+sec('Crossings',['bridge','ford','ferry'].filter(k=>cr.some(x=>x.kind===k)).map(k=>it('<i class="fm-x '+k+'"></i>',cap1(k))))+
    sec('Map',[it('<i class="fm-you"></i>','You'),...(P.quests.length?[it('<i class="fm-q"></i>','Quest')]:[]),...(P.track?[it('<i class="fm-q on"></i>','Tracked quest')]:[]),...(rumourMarks().some(m=>rumourFade(m)>0)?[it('<b class="fm-r" style="'+fmRumour()+'">?</b>','Rumour')]:[]),it(sw(F.road),'Road'),it(sw(F.unknown),'Unexplored')])+'</aside>'}
// the scale it opens at in a view of the room the window gives it (fullMapFit), and the zoom one step in or out (dir), about
// tile point at (else the view's middle)
function fullMapFit(v){const F=FULLMAP,fit=Math.min(v.clientWidth/MW,v.clientHeight/MH);return Math.max(MW>F.wide?.5:1,...F.zooms.filter(z=>z<=fit&&z<=F.open))}
function fullMapZoom(dir,at){const F=FULLMAP,Z=F.zooms,z=Z[clamp(Z.indexOf(F.ppt)+dir,0,Z.length-1)];if(z!==F.ppt&&G.mode==='fullmap')fullMapShow(z,at)}
// the map drawn at ppt px a tile, tile point at in the middle of the view (else the point there now)
function fullMapShow(ppt,at){const F=FULLMAP,v=panel.querySelector('.fm-view');if(!v)return;
  if(!at)at={x:(v.scrollLeft+v.clientWidth/2)/F.ppt,y:(v.scrollTop+v.clientHeight/2)/F.ppt};
  const k=ppt<1?Math.round(1/ppt):1,pic=F.pics[k]||(F.pics[k]=fullMapPic(WM,k,seenArr(),LAND,TOWNS)),b=v.querySelector('.fm-pic');F.ppt=ppt;v.dataset.ppt=ppt;
  b.style.width=pic.width*k*ppt+'px';b.style.height=pic.height*k*ppt+'px';b.innerHTML=fullMapMarks(ppt);pic.className='fm-cv';b.prepend(pic);
  v.scrollLeft=at.x*ppt-v.clientWidth/2;v.scrollTop=at.y*ppt-v.clientHeight/2;
  for(const [a,ok] of [['out',ppt>F.zooms[0]],['in',ppt<F.zooms[F.zooms.length-1]]]){const z=panel.querySelector('[data-act="map-zoom"][data-arg="'+a+'"]');if(z)z.disabled=!ok}}
// a mouse drags the map; a click or a tap (not a drag) zooms in where it was
function fullMapPan(v){const F=FULLMAP;
  v.addEventListener('pointerdown',e=>{if(e.button===0)F.drag={x:e.clientX,y:e.clientY,sl:v.scrollLeft,st:v.scrollTop,moved:false,mouse:e.pointerType==='mouse'}});
  v.addEventListener('pointermove',e=>{const d=F.drag;if(!d)return;if(d.mouse&&!(e.buttons&1)){F.drag=null;return}const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.hypot(dx,dy)>5)d.moved=true;if(d.mouse&&d.moved){v.scrollLeft=d.sl-dx;v.scrollTop=d.st-dy}});
  v.addEventListener('pointerup',e=>{const d=F.drag;F.drag=null;if(!d||d.moved)return;const r=v.querySelector('.fm-pic').getBoundingClientRect();fullMapZoom(1,{x:(e.clientX-r.left)/F.ppt,y:(e.clientY-r.top)/F.ppt})});
  v.addEventListener('pointercancel',()=>{F.drag=null})}
// the window, from the map only (false when it cannot open: somewhere else, or another window open); at: the tile point in its
// middle, a step closer than it opens (none: you), back: its bar's Back ([act, arg, label]: opened from another window)
function fullMapOpen(at,back){if(G.mode!=='world'||G.modal)return false;const S=seenArr();let n=0;for(let i=0;i<S.length;i++)n+=S[i];const pc=n*100/S.length;FULLMAP.pics={};
  if(!openOver('fullmap','<div class="top"><div class="fm-head"><h2>Map of '+htmlText(worldName(WM))+'</h2><span class="muted">'+MW+' × '+MH+' tiles · '+(!n?0:pc<10?pc.toFixed(1):Math.floor(pc))+'% explored</span></div>'+
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
