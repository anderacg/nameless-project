'use strict';
/* the painted ground kept on this device (data/world.js ART_KEEP; the owner, 2026-11-20: "How to optimize the world building time
   and game performance", "will it create a stutter or lag ... if we load or draw lands when playing?"): a chunk of the map costs
   seconds to paint (worldart.js paintSteps) and was painted again in every session. Now a chunk painted is handed to a keeper (a
   small worker of its own, gfx/artkeepworker.js: the PNGs, the gzip and the browser's store are its work, not the game's), and a
   chunk wanted is asked of it before it is painted: a kept one comes back as pictures ready to draw, a few ms of the game's time.
     A kept chunk is only ever the very one the painter would paint now. Its key: the code's stamp (every script's text, hashed:
   a new build never shows old ground), the world (its key and checksum), the chunk, how fine it is painted, the season the fields
   show, and a signature of what the painter reads round it as it stands (sig: the tiles' kinds and features, the plan's clear
   ground, the lots and their models, the gates, camps, caves and trampled patches within WorldArt.REACH tiles). Anything else, or a
   store that cannot be read or does not answer in ART_KEEP.patience ms, and the chunk is painted as before.
     The props' sprites come back each once: the keeper keys a sprite by its pixels and sends one it has sent before as its key
   alone (sprs holds them: six chunks' 4100 sprites are 1000 pictures).
     ArtKeep.boot(): the stamp reckoned and the keeper started, once (false where it cannot be: no Worker, a test's page, a page
       not served over http: its scripts cannot be read back).
     ArtKeep.ask(cx, cy): true while the keeper is still to answer for that chunk (the painter waits); a kept one is put into
       WorldArt.chunks when it comes (take).
     ArtKeep.made(k, rec): a chunk painted (WorldArt.done): queued to be kept; pump() hands it over a piece a frame (a strip of its
       pixels read, ART_KEEP.strip rows: never a whole chunk in a frame), flushSteps() all of it (the loading steps).
     ArtKeep.recall(list): a Promise, done when the keeper has answered for every chunk of list (the loading steps: session.js).
     ArtKeep.forgot(k), relot(l), reset(): a chunk's surroundings changed (WorldArt.forget, relot), the world or its plan did
       (invalidate). */
const ArtKeep={
  w:null,ok:false,ready:null,stamp:null,id:0,st:new Map(),wait:new Map(),calls:[],out:[],job:null,sc:null,sprs:new Map(),hits:0,misses:0,puts:0,why:'',
  can(){return ART_KEEP.on&&typeof document!=='undefined'&&typeof Worker!=='undefined'&&typeof createImageBitmap!=='undefined'&&!(typeof window!=='undefined'&&window.PAINT_WORKER)},
  url(){const s=[...document.scripts].find(e=>/gfx\/artkeep\.js(\?|$)/.test(e.src));return s?s.src.replace(/artkeep\.js.*/,'artkeepworker.js'):null},
  // (the code's stamp: every script of the page and the keeper's own, their bytes as the page loaded them (the browser's cache), hashed)
  async stampOf(){if(typeof location==='undefined'||!/^https?:$/.test(location.protocol))return null;
    const urls=[...document.scripts].map(e=>e.src).filter(x=>x&&!/\/tests\//.test(x));urls.push(this.url());
    const hs=await Promise.all(urls.map(async u=>{const r=await fetch(u,{cache:'force-cache'});if(!r.ok)throw new Error('unread: '+u);const b=new Uint8Array(await r.arrayBuffer());let h=2166136261;for(let i=0;i<b.length;i++)h=Math.imul(h^b[i],16777619);return h>>>0}));
    let h=2166136261;for(const v of hs)for(let s=0;s<32;s+=8)h=Math.imul(h^((v>>>s)&255),16777619);return ART_KEEP.v+'.'+(h>>>0).toString(36)+'.'+urls.length},
  boot(){if(this.ready)return true;if(!this.can())return false;
    this.ready=(async()=>{
      try{const stamp=ART_KEEP.stamp||await this.stampOf(),u=this.url();if(!stamp||!u){this.why='no stamp';return}const w=new Worker(u),phone=WorldArt.cap<32;
        const ok=await new Promise(res=>{w.onmessage=e=>{if(e.data.t==='ready')res(e.data.ok)};w.onerror=()=>res(false);w.postMessage({t:'open',db:ART_KEEP.db,most:ART_KEEP.most[phone?0:1],touch:ART_KEEP.touch})});
        if(!ok){w.terminate();this.why='no store';return}w.onmessage=e=>this.msg(e.data);w.onerror=()=>this.broke('worker error');this.w=w;this.stamp=stamp;this.ok=true}
      catch(e){this.why=String(e&&e.message||e)}})();return true},
  broke(why){this.ok=false;this.why=why;if(this.w)this.w.terminate();this.w=null;this.reset();for(const c of this.calls.splice(0))c.res()},
  // what the painter reads round a chunk, as it stands (see the header): a hash
  sig(cx,cy){const A=WorldArt,M=A.REACH,[X,Y,w,h]=A.rect(cx,cy),tx0=Math.max(0,Math.floor(X/TILE)-M),ty0=Math.max(0,Math.floor(Y/TILE)-M),tx1=Math.min(MW-1,Math.floor((X+w-1)/TILE)+M),ty1=Math.min(MH-1,Math.floor((Y+h-1)/TILE)+M);
    const P=A.ensure(),C=P.clear,K=WM.kind,F=WM.feat,px0=tx0*TILE,py0=ty0*TILE,px1=(tx1+1)*TILE,py1=(ty1+1)*TILE,at=(x,y)=>x>=px0&&x<px1&&y>=py0&&y<py1;
    let hh=2166136261;const mix=v=>{hh=Math.imul(hh^(v|0),16777619)},str=s=>{for(let i=0;i<s.length;i++)mix(s.charCodeAt(i));mix(-1)};
    for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){const i=ty*MW+tx,f=C.f[i];mix(K[i]);mix(F[i]);mix(f);if(f===2)for(let r=0,o=C.o[i];r<C.ts;r++)mix(C.m[o+r])}
    for(const t of TOWNS){if(t.tx>=tx0&&t.tx<=tx1&&t.ty>=ty0&&t.ty<=ty1)str(t.name+' '+t.tx+','+t.ty+' '+t.kind);
      for(const l of t.lots||[])if(l.x<=tx1&&l.x+l.n>tx0&&l.y<=ty1&&l.y+l.n>ty0)str(JSON.stringify([l.id,l.x,l.y,l.n,l.k,l.type,l.st,l.plots||0,l.type?lotSpec(t,l):0]))}
    for(const c of CAMP_SPOTS)if(c.tx>=tx0&&c.tx<=tx1&&c.ty>=ty0&&c.ty<=ty1){mix(c.tx);mix(c.ty)}
    for(const q of P.tramples)if(at(q[0],q[1]))for(const v of q)mix(v*16);
    for(const s of typeof W!=='undefined'&&W.sites||[])if((s.type==='cave'||s.lairLook==='cave')&&at(s.x,s.y)){mix(s.x);mix(s.y)}
    return (hh>>>0).toString(36)},
  key(cx,cy,fine,sea){return[this.stamp,worldKey(WM),WM.sum,CHUNK,cx,cy,fine,sea,this.sig(cx,cy)].join('|')},
  ask(cx,cy){if(!this.ok)return false;const A=WorldArt,k=cy*A.cols+cx,fine=typeof paintRes==='function'?paintRes():1,sea=farmSeason();let s=this.st.get(k);
    if(s&&(s.fine!==fine||s.sea!==sea||s.plan!==A.plan||s.v==='hit'&&!A.chunks.has(k)))s=null;
    if(!s){let key;try{key=this.key(cx,cy,fine,sea)}catch(e){return false}
      s={fine,sea,plan:A.plan,key,v:'wait',t:performance.now()};this.st.set(k,s);const id=++this.id;this.wait.set(id,[k,s]);this.w.postMessage({t:'get',id,key});return true}
    if(s.v==='wait'&&performance.now()-s.t>ART_KEEP.patience)s.v='miss';// (a keeper that does not answer: painted)
    return s.v==='wait'},
  msg(m){
    if(m.t==='kept'){this.puts++;return}if(m.t==='failed'){this.why=m.what+': '+m.msg;return}if(m.t!=='hit'&&m.t!=='miss')return;
    // (the sprites it sends are kept by their keys, whatever becomes of the chunk: the keeper sends each once)
    if(m.t==='hit')for(let i=0;i<m.spr.length;i++)if(m.spr[i])this.sprs.set(m.skeys[i],m.spr[i]);
    const q=this.wait.get(m.id);this.wait.delete(m.id);if(!q){this.shut(m);return}const [k,s]=q;
    if(this.st.get(k)!==s)this.shut(m);else if(m.t==='miss'){s.v='miss';this.misses++}else this.take(k,s,m);
    for(const c of this.calls.slice())if(c.ks.delete(k)&&!c.ks.size)this.settle(c)},
  settle(c){const i=this.calls.indexOf(c);if(i<0)return;this.calls.splice(i,1);c.res()},
  // (a kept chunk come back: put in as a painted one is, unless one as fine is there by now)
  take(k,s,m){const A=WorldArt,c=A.chunks.get(k);let rec;try{rec=this.unpack(m)}catch(e){this.shut(m);s.v='miss';return}
    if(rec.cx+rec.cy*A.cols!==k||c&&(c.fine||1)>=(rec.fine||1)){this.shut(m);s.v=c?'hit':'miss';return}
    const j=A.jobs.get(k);if(j){A.jobs.delete(k);A.recycle(j.rec.cv)}if(c)A.recycle(c.cv);rec.kept=true;A.done({k,rec});s.v='hit';this.hits++;
    // (more sprites held than ART_KEEP.sprites: let go, those the chunks still show theirs till they go; the keeper sends all again)
    if(this.sprs.size>ART_KEEP.sprites){this.sprs=new Map();this.w.postMessage({t:'unsent'})}},
  shut(m){if(m.t==='hit')for(const k in m.pics)m.pics[k].close()},
  unpack(m){const rec=m.meta;for(const k in m.pics)rec[k]=m.pics[k];
    for(const a of m.arrays){const p=a.path.split('.');let o=rec;for(let i=0;i<p.length-1;i++)o=o[p[i]];o[p[p.length-1]]=new self[a.type](a.buf)}
    if(m.props){const S=m.skeys.map(k=>this.sprs.get(k));if(S.some(b=>!b))throw new Error('a sprite not sent');rec.props=m.props.map(p=>({...p,s:p.s>=0?S[p.s]:null}))}return rec},
  // a chunk painted: queued to be kept, if it is as fine as the scene and all it holds can be kept
  made(k,rec){if(!this.ok||rec.kept||!rec.cv)return;const fine=typeof paintRes==='function'?paintRes():1,sea=farmSeason();if((rec.fine||1)<fine)return;
    let key;try{key=this.key(rec.cx,rec.cy,fine,sea)}catch(e){return}
    this.st.delete(k);this.out=this.out.filter(q=>q[0]!==k);this.out.push([k,rec,key]);if(this.out.length>ART_KEEP.queue)this.out.shift()},
  pump(){if(!this.ok)return;if(!this.job){const q=this.out.shift();if(!q)return;this.job=this.pack(q[1],q[2])}try{if(this.job.next().done)this.job=null}catch(e){this.job=null;this.why='unkept: '+(e&&e.message||e)}},
  *flushSteps(){while(this.ok&&(this.job||this.out.length)){this.pump();yield}},
  isPic:v=>!!v&&typeof v==='object'&&(typeof v.getContext==='function'||typeof ImageBitmap!=='undefined'&&v instanceof ImageBitmap),
  // (rows y..y+n of a picture, RGBA: a canvas read where it lies; a worker's picture drawn onto a strip first)
  read(v,y,n){if(v.getContext)return v.getContext('2d',{willReadFrequently:true}).getImageData(0,y,v.width,n).data;
    let c=this.sc;if(!c||c.width<v.width||c.height<n)c=this.sc=mkcv(Math.max(v.width,c?c.width:0),Math.max(n,c?c.height:0));
    const g=c.getContext('2d',{willReadFrequently:true});g.clearRect(0,0,v.width,n);g.drawImage(v,0,y,v.width,n,0,0,v.width,n);return g.getImageData(0,0,v.width,n).data},
  *pixels(v,tr){const w=v.width,h=v.height,buf=new Uint8ClampedArray(w*h*4),S=ART_KEEP.strip;for(let y=0;y<h;y+=S){buf.set(this.read(v,y,Math.min(S,h-y)),y*w*4);yield}tr.push(buf.buffer);return{w,h,buf:buf.buffer}},
  // (what is not a picture: numbers, strings and plain records and lists as they are (meta), a typed layer copied aside by its path)
  plain(v,path,arrays,tr,d){if(v==null||typeof v==='number'||typeof v==='string'||typeof v==='boolean')return v;
    if(ArrayBuffer.isView(v)){const c=v.slice();arrays.push({path,type:v.constructor.name,buf:c.buffer});tr.push(c.buffer);return null}
    if(d<4&&Array.isArray(v))return v.map((x,i)=>this.plain(x,path+'.'+i,arrays,tr,d+1));
    if(d<4&&typeof v==='object'&&Object.getPrototypeOf(v)===Object.prototype){const o={};for(const k of Object.keys(v))o[k]=this.plain(v[k],path+'.'+k,arrays,tr,d+1);return o}
    throw new Error(path)},
  // a chunk's record handed to the keeper, a piece at a time: its pictures' pixels, its props' sprites on one sheet (each once), its
  // layers copied; the standing index's sprites (PX.WN_SPR's numbers, this page's own) cannot be kept: none such is
  *pack(rec,key){const pics={},arrays=[],tr=[],meta={};let props=null,atlas=null,rects=null;
    {const S=rec.n&&rec.n.stand;if(S&&S.E)for(let o=2;o<S.E.length;o+=4)if(S.E[o]>=0)throw new Error('n.stand sprites')}
    for(const name of Object.keys(rec)){const v=rec[name];if(name==='kept')continue;
      if(this.isPic(v))pics[name]=yield* this.pixels(v,tr);
      else if(name==='props'&&Array.isArray(v)){const uniq=new Map();rects=[];props=[];let x=0,y=0,rh=0,W=ART_KEEP.sheet;for(const p of v)if(p.s&&p.s.width>W)W=p.s.width;
        for(const p of v){const q={};for(const f of Object.keys(p))if(f!=='s')q[f]=this.plain(p[f],'props.'+f,null,null,2);let i=-1;
          if(p.s){i=uniq.get(p.s);if(i===undefined){i=rects.length;uniq.set(p.s,i);const sw=p.s.width,sh=p.s.height;if(x+sw>W){x=0;y+=rh;rh=0}rects.push([x,y,sw,sh]);x+=sw;rh=Math.max(rh,sh)}}q.s=i;props.push(q)}
        yield;if(rects.length){const c=mkcv(W,y+rh),g=c.getContext('2d',{willReadFrequently:true});for(const [s,i] of uniq)g.drawImage(s,rects[i][0],rects[i][1]);yield;atlas=yield* this.pixels(c,tr)}}
      else{const n=arrays.length;meta[name]=this.plain(v,name,arrays,tr,0);if(arrays.length>n)yield}}
    if(this.w)this.w.postMessage({t:'put',key,meta,pics,atlas,rects,props,arrays},tr)},
  recall(list){if(!this.boot())return;
    return this.ready.then(()=>{if(!this.ok||!WM)return;const A=WorldArt,ks=new Set();for(const [cx,cy] of list){const k=cy*A.cols+cx;if(!A.chunks.has(k)&&this.ask(cx,cy))ks.add(k)}
      if(ks.size)return new Promise(res=>{const c={ks,res};this.calls.push(c);setTimeout(()=>this.settle(c),ART_KEEP.patience*2)})})},
  forgot(k){this.st.delete(k);if(this.out.length)this.out=this.out.filter(q=>q[0]!==k)},
  // (a lot placed, taken away or changed: every chunk whose signature reads it asked again)
  relot(l){if(!this.st.size&&!this.out.length)return;const A=WorldArt,M=A.REACH,c0=Math.max(0,Math.floor((l.x-M)*TILE/CHUNK)),c1=Math.min(A.cols-1,Math.floor((l.x+l.n+M)*TILE/CHUNK)),r0=Math.max(0,Math.floor((l.y-M)*TILE/CHUNK)),r1=Math.min(A.rows-1,Math.floor((l.y+l.n+M)*TILE/CHUNK));
    for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++)this.forgot(cy*A.cols+cx)},
  reset(){this.st.clear();this.wait.clear();this.out=[];this.job=null}
};
