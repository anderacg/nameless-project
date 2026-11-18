'use strict';
// Graphics quality (data/quality.js QUALITY, gfx/quality.js Quality; the owner, 2026-11-18: "Can we optimize the game performance on
// mobile?", "go ahead with 1-3"): each level's numbers in force at once; Auto High here (a test's page) and on a desktop, Medium on a
// phone, Low on a phone whose first frames run slow (and remembered); the choice stored and read back; Settings → Graphics in the
// window as every setting; a holding's buildings made ahead in the frame's spare time, one lot a call at most (structures.js lotWarm).
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,Q=t.Quality,QL=t.QUALITY.levels;Kit.begin('soldier',1);Kit.world();G.mode='world';G.modal=false;
 const was=t.prefGet('gfx'),ph0=Q.phone,wk=Q.weak();
 try{
  // ---- each level: its numbers in force (a number it leaves out the game's own)
  const B=Q.base,num=lv=>{const L=QL[lv],o=(k,d)=>L[k]===undefined?d:L[k];return{fine:o('fine',B.fine),fps:Math.min(t.prefGet('fps'),o('fps',60)),vfx:o('vfx',B.vfx),amb:o('ambient',B.ambient),mist:o('mist',B.mist),mini:o('mini',B.mini),fxCap:o('fxCap',B.fxCap),fx:o('fx','full')}};
  for(const lv of ['low','medium','high']){t.prefSet('gfx',lv);const n=num(lv);
   const got=Q.level===lv&&t.RENDER.fine===n.fine&&t.RENDER.fps===n.fps&&t.VFX.max===n.vfx&&t.AMBIENT.density===n.amb&&t.MIST.res===n.mist[0]&&t.WFOG.mistEvery===n.mist[1]&&t.MINIMAP.world===n.mini[0]&&t.MINIMAP.refresh===n.mini[1]&&Q.now.fxCap===n.fxCap&&t.fxLite()===(n.fx==='light'||t.prefGet('bfx')==='light');
   ok(got,lv+': its numbers in force (scene fine '+t.RENDER.fine+', '+t.RENDER.fps+' fps, blow particles '+t.VFX.max+', ambient '+t.AMBIENT.density+', mist '+t.MIST.res+' px / '+t.WFOG.mistEvery+' ms, minimap '+t.MINIMAP.world+' / '+t.MINIMAP.refresh+' ms, state particles '+Q.now.fxCap+', effects '+(t.fxLite()?'light':'full')+')')}
  t.prefSet('gfx','high');const rH=t.sceneRes();t.prefSet('gfx','low');const rL=t.sceneRes();t.prefSet('gfx','high');
  ok(rH===Math.min(2,t.WORLD_VIEW.fine)&&rL===1,'the scene drawn at the level\'s fine px: High '+rH+', Low '+rL+' (the map at its own pixels)');
  // (High is the game as it always was: what Auto gives here, every fingerprint's page)
  t.prefSet('gfx','auto');ok(Q.level==='high'&&Q.pick('auto')==='high'&&t.RENDER.fine===B.fine&&t.VFX.max===B.vfx,'Auto on a test\'s page and a desktop: High, the game as it was (scene fine cap '+t.RENDER.fine+')');
  // ---- Auto on a phone: Medium; a phone whose first frames run slow: Low, remembered
  Q.testAuto=true;Q.phone=()=>true;Q.setWeak(false);Q.apply();ok(Q.level==='medium','Auto on a phone (a coarse pointer, a small screen): '+Q.level);
  {const A=t.QUALITY.auto;Q.W={t0:performance.now()-A.after-1000,f:[]};for(let i=0;i<A.frames-1;i++)Q.watch(performance.now()-(A.slow+10));const mid=Q.level;Q.watch(performance.now()-(A.slow+10));
   ok(mid==='medium'&&Q.level==='low'&&Q.weak()&&Q.W===null,'its first '+A.frames+' frames on the map over '+A.slow+' ms of work: stepped down to '+Q.level+' and the phone remembered as weak');
   Q.apply();ok(Q.level==='low','the weak phone\'s next game: Auto starts at '+Q.level);
   Q.setWeak(false);Q.apply();Q.W={t0:performance.now()-A.after-1000,f:[]};for(let i=0;i<A.frames;i++)Q.watch(performance.now()-5);ok(Q.level==='medium'&&!Q.weak()&&Q.W.done,'quick first frames: it stays at '+Q.level+' (median '+Q.W.median.toFixed(1)+' ms)')}
  Q.testAuto=false;Q.phone=ph0;Q.setWeak(wk);
  // ---- stored and read back, as a reload reads it
  t.prefSet('gfx','low');ok(localStorage.getItem('ashmark.gfx')==='low'&&t.prefLoad('gfx')==='low','the choice stored (ashmark.gfx '+localStorage.getItem('ashmark.gfx')+') and read back as a reload reads it');
  localStorage.setItem('ashmark.gfx','ultra');ok(t.prefLoad('gfx')==='auto','anything else stored reads as Auto');t.prefSet('gfx','auto');
  // ---- Settings → Graphics: a row of its own in the Settings window, as every setting (the window's Back and Resume its bar)
  {const key=()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));key();t.act('esc-settings');const pn=document.getElementById('panel'),row=pn.querySelector('[role="group"][aria-label="Graphics"]'),bs=row?[...row.querySelectorAll('button[data-act="gfx"]')]:[],labs=[...pn.querySelectorAll('.lab')].map(x=>x.textContent);
   ok(row&&bs.map(b=>b.dataset.arg).join()==='auto,low,medium,high'&&bs.filter(b=>b.classList.contains('on')).map(b=>b.dataset.arg).join()==='auto'&&labs.indexOf('Graphics')>=0&&labs.indexOf('Graphics')<labs.indexOf('Resolution')&&!!pn.querySelector('.nav [data-nav="back"]')&&!!pn.querySelector('.nav [data-nav="close"]'),
    'Settings → Graphics: '+bs.map(b=>b.textContent).join(', ')+' before Resolution, Auto on, the window\'s bar Back and Resume');
   t.act('gfx','medium');const on=[...document.querySelectorAll('#panel [data-act="gfx"]')].filter(b=>b.classList.contains('on')).map(b=>b.dataset.arg).join();
   ok(t.prefGet('gfx')==='medium'&&Q.level==='medium'&&on==='medium'&&t.RENDER.fps===Math.min(t.prefGet('fps'),30),'chosen there: in force at once, no reload ('+Q.level+', '+t.RENDER.fps+' fps), the page redrawn with it on');
   t.prefSet('gfx','auto');for(let i=0;i<3&&G.mode!=='world';i++)key();G.mode='world';G.modal=false}
  // ---- grass: Medium draws a share of the clumps, the same ones each frame; High all
  {t.prefSet('gfx','medium');const f=Kit.field(t.townBy('Ashford')||t.TOWNS[0]);Kit.goTo(f[0],f[1]);G.mode='world';G.modal=false;const r=t.sceneRes(),WA=t.WorldArt,CH=t.CHUNK;
   const fine=()=>{const c=WA.chunks.get(Math.floor(P.y/CH)*WA.cols+Math.floor(P.x/CH));return c&&c.grass&&c.fr===r?c:null};for(let i=0;i<300&&!fine();i++){t.drawWorld();WA.step(60)}t.drawWorld();
   const cam={x:Math.floor(G.cam.x),y:Math.floor(G.cam.y)},C=[...WA.chunks.values()].filter(c=>c.grass&&c.grass.L&&c.fr===r),vs0=window.viewState;
   const drawn=()=>{for(const c of C)c.grass.L.fill(-99);window.viewState=()=>1;try{t.terrainEnts([],cam)}finally{window.viewState=vs0}let n=0;for(const c of C)for(let k=0;k<c.grass.n;k++)if(c.grass.L[k]!==-99)n++;return n};
   if(r<=1||!fine())info('no fine grass under you: grass share not checked');else{const m1=drawn(),m2=drawn();t.prefSet('gfx','high');const h=drawn();
    ok(h>0&&m1===m2&&Math.abs(m1/h-QL.medium.grass)<.12,'Medium draws '+(m1/h*100).toFixed(0)+'% of the grass clumps High draws ('+m1+' of '+h+'), the same each frame');for(const c of C)c.grass.L.fill(0)}}
  // ---- a holding's buildings made ahead in spare time: one lot a call at most, the way you go first, none with too little time left
  {t.prefSet('gfx','high');const rs=t.sceneRes(),W=t.LOT_WARM,hs=t.TOWNS.filter(h=>h.lots&&Math.hypot(h.x-P.x,h.y-P.y)<t.vis()+W.r);
   for(const h of hs)for(const l of h.lots)if(l._s){l._s._f=null;l._s._fr=0}
   const lf=window.lotFine;let calls=0;window.lotFine=function(...a){calls++;return lf.apply(this,a)};let most=0,made=0,under;
   try{under=t.lotWarm(W.min-1);for(let i=0;i<400;i++){calls=0;const did=t.lotWarm(50);most=Math.max(most,calls);if(!did)break;made++}}finally{window.lotFine=lf}
   const left=hs.reduce((n,h)=>n+h.lots.filter(l=>!t.lotReady(l,rs)).length,0);
   ok(under===false&&most===1&&made>0&&left===0,'the buildings of the '+hs.length+' holdings ahead made in spare time: '+made+' lots, never two in one call (most '+most+'), none with under '+W.min+' ms left; none left unmade');
   if(hs.length>=2){const [a,b]=hs.slice().sort((p,q)=>Math.hypot(p.x-P.x,p.y-P.y)-Math.hypot(q.x-P.x,q.y-P.y));for(const h of [a,b])for(const l of h.lots)if(l._s){l._s._f=null;l._s._fr=0}
    const d=Math.hypot(b.x-P.x,b.y-P.y);W.way={x:P.x,y:P.y,dx:(b.x-P.x)/d,dy:(b.y-P.y)/d};const first=[];const ls=window.lotSprite;window.lotSprite=function(h,...q){first.push(h);return ls.call(this,h,...q)};
    try{t.lotWarm(50)}finally{window.lotSprite=ls;W.way=null}
    const sa=Math.hypot(a.x-P.x,a.y-P.y)-W.ahead*((a.x-P.x)*(b.x-P.x)/d+(a.y-P.y)*(b.y-P.y)/d),sb=d-W.ahead*d;
    ok(first[0]===(sb<sa?b:a),'the way you go first: walking toward '+b.name+' ('+d.toFixed(0)+' px), it is warmed '+(first[0]===b?'first':'after '+a.name+' (nearer still, '+Math.hypot(a.x-P.x,a.y-P.y).toFixed(0)+' px)'))}}
 }finally{Q.testAuto=false;Q.phone=ph0;Q.setWeak(wk);t.prefSet('gfx',was)}
});
