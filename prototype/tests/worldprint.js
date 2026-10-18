'use strict';
// World fingerprints (doc/WORLD_DESIGN.md §2.0, Step 0.0): eight hashes of the classic world that every Phase 0 refactor keeps as
// they are, recorded at the baseline commit 0a42712. Each is printed as an INFO line (to diff a refactor against) and PASSed
// against its constant in EXPECT.
//   W1 tiles and climate (the roads already led round the centres to the gates: lots.js roadsToGates, once a page)
//   W2 DEPOSITS (every field, in order) and DEP_AT
//   W3 TOWNS as JSON after begin's initWorld: owners, garrisons, economy, estates and lots (keys starting with _ left out: caches)
//   W4 LAND (the territory: an index into TOWNS or -1, a tile)
//   W5 the painted world as the game holds it after begin, every byte of worldCv()'s pixels (today: painted once a page, by the
//      title screen's first frame, from the world main.js makes at load; the suite asks for it before begin, so it is the same
//      picture whether or not that frame came before the suite)
//   W6 drawWorld() at three fixed spots (where begin puts you; map pixel (1792, 1280), the middle; (2688, 768)), each by day (clock
//      .3 of a day) and by night (.8): the whole 576 x 360 view (its fog, lights, labels and minimap); the six parts are printed too
//   W7 the save string (the quick slot, its time stamp 'at' left out) once 3 days have passed since begin
//   W8 the place of every party and mover after 600 frames of updateWorld(.05): you (walking toward +96, +48 px), the lords (dead
//      ones too), bands, patrols, companions' parties, caravans, beasts, herds, refugees, workers, ships and fights
// Mode: ONE begin('soldier') a page, then every hash in turn on that game: W1-W5, W6, then W8's 600 frames, then on until 3 days
// have passed, then W7. (One begin, because today a second begin in the same page makes other lots and estates than the first:
// initEstates reads the last game's lots. A fresh page is the one state every refactor can reproduce.) Each stage seeds
// Math.random itself (as battlesetup does), so the page's seed changes nothing and an unseeded run gives the hashes of -Seed 1:
// begin 9001; each of W6's draws 9061+k, with performance.now held at 1e7 + k x 1e4 (clocks, flicker and throttles read alike);
// W8 9008 (speed 1); the days to W7 9007 (you parked off the map at -999, -999, as visual/worldsim: nothing meets you; speed 3).
// The harness's switches hold (TERRAIN, FOG, AUDIO, FIELD_SIZES... off: all battle-side; the world's fog of war is on),
// G.quietEvents is on, and the view is the tests' fixed 576 x 360. Hash: FNV-1a 32-bit over bytes, char codes or 32-bit words;
// W8's places at 1e-6 px.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,G=t.G,P=t.P,W=t.W;
const EXPECT={W1:'65e24662',W2:'2b49a168',W3:'7a0dcbac',W4:'46450e62',W5:'aceeae00',W6:'7a99f543',W7:'c50cf16f',W8:'847c821c'};// (at 0a42712)
const r0=Math.random,pn=performance.now,t0=pn.call(performance);
try{
 try{localStorage.clear()}catch(e){}
 const fnv=()=>{let h=2166136261;const H={
   b(a){for(let i=0;i<a.length;i++)h=Math.imul(h^a[i],16777619)>>>0;return H},// bytes, or 32-bit words (a Uint32Array)
   s(x){x=String(x);for(let i=0;i<x.length;i++)h=Math.imul(h^x.charCodeAt(i),16777619)>>>0;return H},
   n(v){h=Math.imul(h^(Math.round(v*1e6)|0),16777619)>>>0;h=Math.imul(h^(Math.round(v)|0),16777619)>>>0;return H},
   get x(){return h.toString(16).padStart(8,'0')}};return H};
 const bytes=a=>new Uint8Array(a.buffer,a.byteOffset,a.byteLength),words=a=>new Uint32Array(a.buffer,a.byteOffset,a.byteLength>>2);
 const got={},lines={},check=(id,h,what)=>{got[id]=h;lines[id]=id+' '+h+' '+what},seed=n=>{Math.random=t.seeded(n)};
 // ---- the game: one begin (the world's picture made first, as the title screen makes it)
 t.worldCv();seed(9001);t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();const d0=G.day;
 check('W1',fnv().b(t.tiles).b(t.climate).x,'tiles and climate ('+t.MW+'x'+t.MH+')');
 {const h=fnv();for(const d of t.DEPOSITS)h.s(JSON.stringify(d));h.b(bytes(t.DEP_AT));check('W2',h.x,'DEPOSITS ('+t.DEPOSITS.length+') and DEP_AT')}
 {const s=JSON.stringify(t.TOWNS,(k,v)=>k[0]==='_'?undefined:v);check('W3',fnv().s(s).x,'TOWNS as JSON ('+t.TOWNS.length+' holdings, '+t.TOWNS.reduce((a,z)=>a+(z.lots||[]).length,0)+' lots, '+s.length+' chars)')}
 {t.landFresh();const L=t.LAND;check('W4',fnv().b(bytes(L)).x,'LAND ('+L.filter(v=>v>=0).length+' tiles claimed)')}
 {const c=t.worldCv(),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;check('W5',fnv().b(words(d)).x,'the painted world ('+c.width+'x'+c.height+')')}
 // ---- W6: three spots, by day and by night
 {const spots=[[P.x,P.y],[1792,1280],[2688,768]],keep={x:P.x,y:P.y,clock:G.clock},parts=[],h=fnv();let k=0,now=1e7;
  performance.now=()=>now;
  for(const [x,y] of spots)for(const day of [.3,.8]){P.x=x;P.y=y;P.tx=P.ty=null;G.chase=null;G.clock=day*t.DAY;seed(9061+k);now=1e7+k*1e4;
   t.drawWorld();const p=fnv().b(words(t.ctx.getImageData(0,0,t.VW,t.VH).data)).x;parts.push(p);h.s(p);k++}
  performance.now=pn;P.x=keep.x;P.y=keep.y;G.clock=keep.clock;
  check('W6',h.x,'drawWorld at 3 spots by day and night ('+t.VW+'x'+t.VH+': '+parts.join(' ')+')')}
 // ---- W8: 600 frames, you on the move
 {seed(9008);t.setSpeed(1);P.tx=P.x+96;P.ty=P.y+48;for(let f=0;f<600;f++)t.updateWorld(.05);
  const h=fnv().n(P.x).n(P.y),n=[],lists={lords:W.lords,bands:t.bandits,patrols:W.patrols,comps:t.cparties(),caravans:W.caravans,monsters:W.monsters,
   critters:W.critters,refugees:W.refugees,folk:W.folk,ships:W.ships,fights:W.fights};
  for(const k in lists){const L=lists[k]||[];h.s(k).n(L.length);for(const q of L)h.n(q.x).n(q.y);n.push(k+' '+L.length)}
  check('W8',h.x,'every party\'s place after 600 frames (you at '+P.x.toFixed(1)+','+P.y.toFixed(1)+', mode '+G.mode+'; '+n.join(', ')+')')}
 // ---- W7: on until 3 days have passed, then the save
 {seed(9007);P.x=-999;P.y=-999;P.tx=P.ty=null;G.chase=null;t.setSpeed(3);let f=0;
  for(;f<4000&&G.day<d0+3;f++)t.updateWorld(.05);
  const mode=G.mode;G.mode='world';t.saveGame(true,'quick');const raw=localStorage.getItem(t.SAVE+'.quick'),sv=raw&&JSON.parse(raw);
  if(sv)delete sv.at;const s=sv?JSON.stringify(sv):'';try{localStorage.removeItem(t.SAVE+'.quick')}catch(e){}
  check('W7',fnv().s(s).x,'the save once 3 days have passed (day '+G.day+', '+f+' more frames, mode '+mode+', '+s.length+' chars)')}
 for(const id in EXPECT)if(lines[id])info(lines[id]);
 for(const id in EXPECT)if(EXPECT[id])ok(got[id]===EXPECT[id],id+' equals the baseline ('+got[id]+(got[id]===EXPECT[id]?'':'; baseline '+EXPECT[id])+')');
  else o.push('FAIL '+id+' has no baseline ('+got[id]+')');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{Math.random=r0;performance.now=pn}
info('took '+((pn.call(performance)-t0)/1000).toFixed(1)+' s');
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
