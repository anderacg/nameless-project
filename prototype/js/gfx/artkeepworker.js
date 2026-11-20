'use strict';
/* the painted ground's keeper (gfx/artkeep.js ArtKeep; the owner, 2026-11-20): a worker of its own, none of the game's scripts
   (a few KB, not a second game). It holds the browser's store (IndexedDB) of painted chunks and does all the heavy work of it off
   the game's thread: a chunk's pixels made PNGs, its layers packed and gzipped, written; a chunk read back, its PNGs made pictures
   (ImageBitmaps), its layers unpacked, handed over (transferred: no copy on the game's side).
     {t:'open', db, most, touch}: opens the store; answers {t:'ready', ok} (ok false: this browser cannot keep them).
     {t:'put', key, meta, pics: {name: {w, h, buf}}, atlas: {w, h, buf} | null, rects, props, arrays: [{path, type, buf}]}: kept
       under key, the oldest let go past most.
     {t:'get', id, key}: {t:'hit', id, meta, pics: {name: ImageBitmap}, skeys, spr: [ImageBitmap | null] (the atlas cut by rects:
       each sprite by the key of its pixels, skeys; one this worker has sent the page before is null there: the page has it, so the
       many chunks that hold the same bush hold one picture of it), props, arrays} or {t:'miss', id}, one at a time; one read touch
       ms after it was written is written again as new (so what is used is not the oldest).
     {t:'unsent'}: the page let its sprites go: all are sent again.
     {t:'wipe', id}: the store emptied; answers {t:'wiped', id}. */
let DB=null,CFG={most:64,touch:0},ZIP=false,GETS=Promise.resolve();const SENT=new Set();
const done=q=>new Promise((res,rej)=>{q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});
const over=(t)=>new Promise((res,rej)=>{t.oncomplete=()=>res();t.onerror=t.onabort=()=>rej(t.error)});
const flate=async(buf,C)=>new Uint8Array(await new Response(new Blob([buf]).stream().pipeThrough(new C('gzip'))).arrayBuffer());
const png=p=>{const c=new OffscreenCanvas(p.w,p.h);c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(p.buf),p.w,p.h),0,0);return c.convertToBlob({type:'image/png'})};
const pic=b=>createImageBitmap(b,{colorSpaceConversion:'none'});
async function open(m){CFG={most:m.most,touch:m.touch};
  if(typeof OffscreenCanvas==='undefined'||typeof createImageBitmap==='undefined'||typeof indexedDB==='undefined'||!OffscreenCanvas.prototype.convertToBlob)return false;
  ZIP=typeof CompressionStream==='function'&&typeof DecompressionStream==='function';
  const q=indexedDB.open(m.db,1);q.onupgradeneeded=()=>q.result.createObjectStore('ground',{keyPath:'key'}).createIndex('at','at');DB=await done(q);return true}
// (a sprite's key: its size and its pixels on the sheet, hashed)
function spriteKeys(A,rects){const d=new Uint8Array(A.buf),W=A.w;return rects.map(([x,y,w,h])=>{let k=2166136261;for(let j=0;j<h;j++)for(let o=((y+j)*W+x)*4,e=o+w*4;o<e;o++)k=Math.imul(k^d[o],16777619);return (k>>>0).toString(36)+'_'+w+'x'+h})}
async function put(m){const pics={},skeys=m.atlas?spriteKeys(m.atlas,m.rects):[];for(const k in m.pics)pics[k]=await png(m.pics[k]);const atlas=m.atlas?await png(m.atlas):null;
  let n=0;for(const a of m.arrays)n+=a.buf.byteLength;const all=new Uint8Array(n),dir=[];let o=0;for(const a of m.arrays){all.set(new Uint8Array(a.buf),o);dir.push([a.path,a.type,o,a.buf.byteLength]);o+=a.buf.byteLength}
  await write({key:m.key,at:Date.now(),meta:m.meta,pics,atlas,rects:m.rects,skeys,props:m.props,dir,zip:ZIP,z:ZIP?await flate(all,CompressionStream):all})}
// (written, the oldest let go past most; a store that is full gives up half of what it holds and tries once more)
async function write(e,again){
  try{const t=DB.transaction('ground','readwrite'),s=t.objectStore('ground');s.put(e);const ks=await done(s.index('at').getAllKeys());for(let i=0;i<ks.length-CFG.most;i++)s.delete(ks[i]);await over(t)}
  catch(x){if(again)throw x;const t=DB.transaction('ground','readwrite'),s=t.objectStore('ground'),ks=await done(s.index('at').getAllKeys());for(let i=0;i<ks.length/2;i++)s.delete(ks[i]);await over(t);await write(e,true)}}
async function get(m){const e=await done(DB.transaction('ground').objectStore('ground').get(m.key));if(!e){postMessage({t:'miss',id:m.id});return}
  const tr=[],pics={};for(const k in e.pics){pics[k]=await pic(e.pics[k]);tr.push(pics[k])}
  let spr=[];if(e.atlas){const A=await pic(e.atlas);spr=await Promise.all(e.rects.map((r,i)=>{const k=e.skeys[i];if(SENT.has(k))return null;SENT.add(k);return createImageBitmap(A,r[0],r[1],r[2],r[3])}));A.close();for(const b of spr)if(b)tr.push(b)}
  const all=e.zip?await flate(e.z,DecompressionStream):e.z,arrays=e.dir.map(([path,type,o,n])=>{const buf=all.buffer.slice(all.byteOffset+o,all.byteOffset+o+n);tr.push(buf);return{path,type,buf}});
  postMessage({t:'hit',id:m.id,meta:e.meta,pics,skeys:e.skeys,spr,props:e.props,arrays},tr);
  if(CFG.touch>0&&Date.now()-e.at>CFG.touch){e.at=Date.now();write(e).catch(()=>{})}}
self.onmessage=async ev=>{const m=ev.data;
  try{
    if(m.t==='open'){let ok=false;try{ok=await open(m)}catch(x){}postMessage({t:'ready',ok});return}
    if(!DB){if(m.t==='get')postMessage({t:'miss',id:m.id});return}
    if(m.t==='put'){await put(m);postMessage({t:'kept',key:m.key});return}
    if(m.t==='get'){GETS=GETS.then(()=>get(m)).catch(()=>postMessage({t:'miss',id:m.id}));return}
    if(m.t==='unsent'){SENT.clear();return}
    if(m.t==='wipe'){await done(DB.transaction('ground','readwrite').objectStore('ground').clear());postMessage({t:'wiped',id:m.id})}
  }catch(x){if(m.t==='get')postMessage({t:'miss',id:m.id});else postMessage({t:'failed',what:m.t,msg:String(x&&x.message||x)})}};
