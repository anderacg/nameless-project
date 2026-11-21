'use strict';
/* ---------- the map's painter in a worker (the owner, 2026-11-18: "optimize the game performance on mobile"): a second copy of the
   game's own scripts, booted with no page (a shim for what they reach for at load: document, canvases as OffscreenCanvas, storage,
   images), that paints the map's chunks on another core. The page (worldart.js ArtWorkers) sends:
     {t:'boot', scripts}: the page's scripts, in its order (their URLs), loaded here;
     {t:'world', rec, n}: the world to paint, the page's save record (core/save.js saveRecord), loaded as a save is (the same world made
       again from its seed when it is another, its holdings from their records), answered {t:'ready', n};
     {t:'paint', id, cx, cy, fine, n, day, clock, vs}: a chunk painted at fine (WorldArt.paintJob, all its steps) on that day at that
       hour (the crops' season) and the page's scene scale, sent back as {t:'done', id, k, n, rec}: its pictures ImageBitmaps
       (transferred), the rest as data (pwRec); {t:'stale'} for a job of a world it no longer has.
   Never loaded by a page: no <script> tag (tests/structure.js knows it). ---------- */
const PW={booted:false,world:-1};
{
  // (what the game's scripts reach for at load, with no page: a document whose canvases are OffscreenCanvases and whose other elements
  //  are inert, storage kept in memory, no frames (the game's loop never runs here), images that never load)
  const inert=()=>new Proxy(function(){},{get:(f,k)=>k===Symbol.toPrimitive?()=>'':k==='style'||k==='dataset'||k==='classList'?inert():k==='children'||k==='childNodes'?[]:k==='getContext'?()=>new OffscreenCanvas(1,1).getContext('2d'):k==='getBoundingClientRect'?()=>({x:0,y:0,left:0,top:0,width:1280,height:720,right:1280,bottom:720}):k in f?f[k]:inert(),set:()=>true,apply:()=>inert(),construct:()=>inert()});
  const mem=new Map(),store={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>{mem.set(k,String(v))},removeItem:k=>{mem.delete(k)},clear:()=>mem.clear(),key:i=>[...mem.keys()][i]??null,get length(){return mem.size}};
  const el=tag=>{if(String(tag).toLowerCase()==='canvas'){const c=new OffscreenCanvas(1,1);c.style={};c.addEventListener=()=>{};return c}return inert()};
  self.window=self;self.document=new Proxy({createElement:el,createElementNS:(ns,t)=>el(t),getElementById:()=>inert(),querySelector:()=>inert(),querySelectorAll:()=>[],getElementsByTagName:()=>[],addEventListener:()=>{},removeEventListener:()=>{},body:inert(),head:inert(),documentElement:inert(),fonts:{ready:Promise.resolve(),load:()=>Promise.resolve()},hidden:true,visibilityState:'hidden'},{get:(o,k)=>k in o?o[k]:inert()});
  self.localStorage=store;self.sessionStorage=store;self.matchMedia=()=>({matches:false,addEventListener:()=>{},addListener:()=>{}});self.screen={width:1280,height:720};
  self.requestAnimationFrame=()=>0;self.cancelAnimationFrame=()=>{};self.Image=class{set src(v){}};self.alert=()=>{};self.devicePixelRatio=1;self.innerWidth=1280;self.innerHeight=720;
  const Obs=class{observe(){}unobserve(){}disconnect(){}};self.ResizeObserver=self.MutationObserver=self.IntersectionObserver=Obs;
  for(const k of ['HTMLElement','HTMLCanvasElement','HTMLImageElement','Element','Node','Event','KeyboardEvent','PointerEvent','TouchEvent'])if(!(k in self))self[k]=k==='HTMLCanvasElement'?OffscreenCanvas:class{};
  self.getComputedStyle=()=>inert();self.scrollTo=()=>{};self.history={replaceState(){},pushState(){}};
  if(typeof OffscreenCanvas!=='undefined'&&!OffscreenCanvas.prototype.toDataURL)OffscreenCanvas.prototype.toDataURL=()=>'data:,';
  // (every 2d context read often, so kept in memory as the page's are (worldart.js mkcv): a context on the GPU makes each getImageData a
  //  read back from it, the painter many times slower)
  if(typeof OffscreenCanvas!=='undefined'){const gc=OffscreenCanvas.prototype.getContext;OffscreenCanvas.prototype.getContext=function(t,o){return gc.call(this,t,t==='2d'?{...(o||{}),willReadFrequently:true}:o)}}
  self.PAINT_WORKER=true;
}
// the world to paint from the page's save record: made again from its seed when it is not the one in (session.js forgeSteps, all its
// stages at once), then the record put in as a save is (save.js applySave), the plan made again from it when next wanted
function pwWorld(d){const M=d.world.map;if(!WM||worldKey(M)!==worldKey(WM)){let made=null;for(const st of forgeSteps(M.gen,M.settings,r=>{made=r})){const v=st.run();if(v&&typeof v.next==='function')runGen(v)}if(made.map.sum!==M.sum)throw new Error(OTHER_WORLD);forgeInstall(made)}
  applySave(d);WorldArt.invalidate()}
// (a sprite's key: its size and pixels, the same on the page as here)
const pwKey=sp=>{if(sp._key)return sp._key;let h=2166136261;const mix=v=>{h=Math.imul(h^v,16777619)};mix(sp.width|0);mix(sp.height|0);
  const a=sp.a||(sp.getContext?sp.getContext('2d').getImageData(0,0,sp.width,sp.height).data:null);if(a)for(let i=0;i<a.length;i++)mix(a[i]);for(const v of sp.box||[])mix(v|0);return sp._key=(h>>>0).toString(36)+'_'+sp.width+'x'+sp.height};
// (a sprite as data for the page: its picture an ImageBitmap and its own fields (a, box, ax, ay...), or its fields alone)
async function pwSprite(sp){const f={};for(const k of Object.keys(sp))if(k!=='_wn'&&k!=='_key'&&typeof sp[k]!=='function')f[k]=sp[k];return{bmp:sp.getContext?await createImageBitmap(sp):null,f}}
// (the page's own calls a save's loading makes that only draw or tell: nothing here)
const PW_QUIET=['updateHUD','updateHint','toast','hidePanel','pauseUI','renderPanel','renderChar','showDeath','showTitle','refreshMap'];
const PW_SENT=new Set();// (the sprites this worker has sent the page: never sent again)
// a chunk's record as data for the page: its pictures ImageBitmaps (transferred), its props' pictures each once, the standing index's
// sprites by key (refs: this worker's number to the key; sprites: those not sent before), its arrays' buffers transferred
async function pwRec(rec,tr){const out={},bm=new Map(),buf=new Set(),own=v=>{if(ArrayBuffer.isView(v)&&v.byteOffset===0&&v.byteLength===v.buffer.byteLength&&!buf.has(v.buffer)){buf.add(v.buffer);tr.push(v.buffer)}};
  const pic=async s=>{if(!s||!s.getContext)return s;if(!bm.has(s))bm.set(s,createImageBitmap(s));return bm.get(s)};
  for(const k in rec){const v=rec[k];
    if(v&&v instanceof OffscreenCanvas){const b=v.transferToImageBitmap();out[k]=b;tr.push(b)}
    else if(k==='props'&&Array.isArray(v)){out[k]=[];for(const p of v)out[k].push({...p,s:await pic(p.s)})}
    else{out[k]=v;own(v);if(v&&typeof v==='object'&&!ArrayBuffer.isView(v)&&!Array.isArray(v))for(const q in v)own(v[q])}}
  for(const b of new Set(await Promise.all(bm.values())))tr.push(b);
  const S=rec.n&&rec.n.stand;if(S&&S.E){const refs={},sprites=[];for(let o=2;o<S.E.length;o+=4){const q=S.E[o];if(q<0||refs[q])continue;const sp=PX.WN_SPR[q],key=pwKey(sp);refs[q]=key;
      if(!PW_SENT.has(key)){PW_SENT.add(key);const d=await pwSprite(sp);if(d.bmp)tr.push(d.bmp);sprites.push([key,d])}}
    out.refs=refs;out.sprites=sprites;for(const q of ['E','at','L'])own(S[q])}
  return out}
self.onmessage=async e=>{const m=e.data;try{
  if(m.t==='boot'){if(!PW.booted){for(const s of m.scripts)importScripts(s);PW.booted=true;for(const f of PW_QUIET)if(typeof self[f]==='function')self[f]=()=>{}}postMessage({t:'booted'});return}
  if(m.t==='world'){pwWorld(m.rec);PW.world=m.n;postMessage({t:'ready',n:m.n});return}
  if(m.t==='paint'){if(m.n!==PW.world){postMessage({t:'stale',id:m.id,k:m.cy*WorldArt.cols+m.cx});return}G.day=m.day;G.clock=m.clock;VS=m.vs;
    const t0=performance.now(),j=WorldArt.paintJob(m.cx,m.cy,m.fine);runGen(j.gen);const t1=performance.now(),tr=[],rec=await pwRec(j.rec,tr);rec.wms=[t1-t0,performance.now()-t1];
    postMessage({t:'done',id:m.id,k:j.k,n:m.n,rec},tr);return}
}catch(err){postMessage({t:'error',id:m.id,msg:String(err&&err.stack||err)})}};
