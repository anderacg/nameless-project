'use strict';
// The made worlds kept on the device (core/worldkeep.js WorldKeep, data/world.js WORLD_KEEP; the owner, 2026-11-20: "Can we also
// reduce loading time when we load from the save"): a kept world is the generator's own (its layers, lists, holdings and camps byte
// for byte, its land's heights, its way graph made again the same), its own copy each time; none is given for another checksum, other settings, another
// record shape or a spoiled layer; and a load whose world is kept runs no stage of the generator and gives the very game a load
// that makes its world again gives. (The browser's store is not read here: a test's steps run at once; the last world in the page is.)
Kit.suite(({ok,info})=>{
  const t=T,G=t.G,K=t.WorldKeep,KP=t.WORLD_KEEP,on0=KP.on,disk0=KP.disk;KP.on=true;KP.disk=false;
  // (the same through and through: typed arrays, Maps, Sets, lists and plain records)
  const same=(a,b,p,bad)=>{if(a===b)return true;if(typeof a!==typeof b||a===null||b===null||typeof a!=='object'){bad.push(p);return false}
    if(ArrayBuffer.isView(a)){if(!ArrayBuffer.isView(b)||a.length!==b.length||a.constructor!==b.constructor){bad.push(p);return false}for(let i=0;i<a.length;i++)if(a[i]!==b[i]){bad.push(p+'['+i+']');return false}return true}
    if(a instanceof Map||a instanceof Set){if(a.size!==b.size||a.constructor!==b.constructor){bad.push(p);return false}return same([...a],[...b],p,bad)}
    const ka=Object.keys(a),kb=Object.keys(b);if(ka.length!==kb.length||Array.isArray(a)!==Array.isArray(b)){bad.push(p+' keys');return false}
    for(const k of ka)if(!same(a[k],b[k],p+'.'+k,bad))return false;return true};
  const plain=(v,p,out,seen)=>{if(!v||typeof v!=='object'||seen.has(v))return;seen.add(v);if(ArrayBuffer.isView(v))return;const pr=Object.getPrototypeOf(v);
    if(pr!==Object.prototype&&pr!==Array.prototype&&pr!==Map.prototype&&pr!==Set.prototype)out.push(p+': '+(pr&&pr.constructor&&pr.constructor.name));
    for(const [k,x] of v instanceof Map?[...v]:v instanceof Set?[...v].map((x,i)=>[i,x]):Object.entries(v))if(typeof x==='function')out.push(p+'.'+k+': a function');else plain(x,p+'.'+k,out,seen)};
  try{
    const SA=t.normSettings({preset:'normal',seed:'keep-a'}),SB=t.normSettings({preset:'normal',seed:'keep-b'});
    let t0=performance.now();const r=t.genWorld(SA),msGen=performance.now()-t0,m=r.map,M={gen:m.gen,settings:m.settings,sum:m.sum};
    // ---- what is kept is plain data: nothing a copy would lose ----
    {const odd=[];plain({...r,map:null,graph:null},'r',odd,new Set());for(const k of Object.keys(m))if(k!=='graph')plain(m[k],'map.'+k,odd,new Set());
      ok(!odd.length,'the generator\'s result but its way graph is plain data, typed arrays and lists'+(odd.length?': '+odd.slice(0,6).join('; '):''))}
    // ---- kept, and taken back ----
    t0=performance.now();K.put(r);const msPut=performance.now()-t0,e=K.last;
    ok(e&&e.key===t.worldKey(m)&&e.sum===m.sum&&e.v===KP.v&&e.r.map!==m&&e.r.map.kind!==m.kind&&!e.r.map.graph&&m.graph&&r.graph===m.graph,'put keeps its own copy, the way graph left out, the generator\'s result as it was');
    {const k0=m.kind[5];m.kind[5]=k0===t.T_OPEN?t.T_FOREST:t.T_OPEN;const kept=e.r.map.kind[5];m.kind[5]=k0;ok(kept===k0,'what changes in the world after never reaches the kept copy')}
    t0=performance.now();const k=K.take(M),msTake=performance.now()-t0,bad=[];
    ok(k&&k.map instanceof t.WorldMap&&k.map!==m&&k.map.checksum(k.holdings)===m.sum&&k.map.sum===m.sum,'taken back: a WorldMap of its own, its checksum the world\'s ('+(k&&k.map.sum)+')');
    ok(k&&t.MAP_LAYERS.every(L=>same(k.map[L],m[L],L,bad))&&same(k.map.lv,m.lv,'lv',bad),'its every layer and its relief byte for byte'+(bad.length?' ('+bad[0]+')':''));
    {const b2=[],A={},B={};for(const x of Object.keys(m))if(x!=='graph'&&!t.MAP_LAYERS.includes(x)){A[x]=m[x];B[x]=k&&k.map[x]}
      ok(k&&same(A,B,'map',b2)&&same({...r,map:null,graph:null},{...k,map:null,graph:null},'r',b2),'its rivers, crossings, roads, regions, holdings, camps and lords the same'+(b2.length?' ('+b2[0]+')':''))}
    {const b3=[];ok(k&&k.graph===k.map.graph&&same(k.map.graph,m.graph,'graph',b3),'its way graph, made again, the generator\'s own'+(b3.length?' ('+b3[0]+')':''))}
    {const fa=t.landHeight(m),fb=t.landHeight(k.map),W=m.w,N=W*m.h;let d=0;for(let i=0;i<N;i++){const x=i%W,y=(i-x)/W;if(fa(x*32+16,y*32+16)!==fb(x*32+16,y*32+16))d++}
      const fc=t.landBase(m),bb=[];ok(d===0&&!same(fc,fa.base,'land',bb),'its land the very heights the generator made it with ('+d+' tiles differ), which the finished layers no longer give ('+(bb[0]||'the same')+')')}
    ok(k&&k.regions===k.map.regions&&k.crossings===k.map.crossings&&k.rivers===k.map.rivers,'the result\'s lists are the map\'s own, as the generator gives them');
    {const k2=K.take(M);ok(k2&&k2.map!==k.map&&k2.map.kind!==k.map.kind,'each taking its own copy')}
    info('made in '+msGen.toFixed(0)+' ms; kept in '+msPut.toFixed(0)+' ms; taken back in '+msTake.toFixed(0)+' ms');
    // ---- none for a world that is not the save's ----
    ok(K.take({...M,sum:M.sum+1})===null,'none for another checksum (another version of the generator made the save\'s)');
    ok(K.take({gen:m.gen,settings:SB,sum:M.sum})===null&&K.take({...M,gen:'other-0'})===null,'none for other settings or another gen');
    {KP.v++;const a=K.take(M);KP.v--;ok(a===null,'none for a record of another shape (WORLD_KEEP.v)')}
    {const L=e.r.map.elev,v0=L[9];L[9]=v0^1;const a=K.take(M);L[9]=v0;ok(a===null&&!!K.take(M),'none when a kept layer is spoiled: its checksum is counted again')}
    {KP.on=false;const a=K.take(M);K.put(r);KP.on=true;ok(a===null&&K.last===e,'off: nothing taken, nothing kept')}
    // ---- a load whose world is kept: no stage of the generator, the same game ----
    {const S=t.GEN_STAGES,runs0=S.map(s=>s.run);let ran=0;S.forEach((s,i)=>{s.run=function(g){ran++;return runs0[i].call(this,g)}});
      const hash=a=>{let h=2166136261;for(let i=0;i<a.length;i++)h=Math.imul(h^(a[i]*4096|0),16777619)>>>0;return h},
        land=()=>{const m=t.WM,f=t.landHeight(m),N=m.w*m.h,v=new Float32Array(N);for(let i=0;i<N;i++){const x=i%m.w;v[i]=f(x*32+16,((i-x)/m.w)*32+16)}return hash(v)},
        pic=()=>{const A=t.WorldArt,C=t.CHUNK,cx=Math.floor(t.P.x/C),cy=Math.floor(t.P.y/C);A.chunks.delete(cy*A.cols+cx);A.chunk(cx,cy);const c=A.chunks.get(cy*A.cols+cx),v=c.fcv&&c.fr>1?c.fcv:c.cv;return hash(v.getContext('2d').getImageData(0,0,v.width,v.height).data)},
        lots=()=>t.TOWNS.map(h=>h.name+':'+h.tx+','+h.ty+':'+(h.lots||[]).map(l=>l.k+l.x+','+l.y).join(' ')).join('|'),
        snap=()=>({sum:t.WM.sum,sig:t.saveSig(t.saveRecord()),lots:lots(),camps:t.CAMP_SPOTS.map(c=>c.tx+','+c.ty).join(' '),sites:t.W.sites.map(s=>s.type+s.tx+','+s.ty).join(' '),px:t.P.x,py:t.P.y,day:G.day,
          land:land(),ledges:hash(t.ledgeBits(t.WM)),depths:hash(t.waterDepths(t.WM)),graph:t.WM.graph,pic:pic()});
      try{
        K.last=null;t.begin('soldier',SA);const packA=K.last,n1=ran;
        ok(n1>=S.length&&packA&&packA.sum===t.WM.sum&&t.WM.sum===m.sum,'a new game makes its world ('+n1+' stage runs) and keeps it');
        G.mode='world';G.modal=false;t.P.gold+=7;t.saveGame(true,'keep');
        // (made again: the way a load went before)
        t.begin('soldier',SB);KP.on=false;ran=0;t0=performance.now();t.loadGame('keep');const msOld=performance.now()-t0,nOld=ran,A=snap();KP.on=true;
        // (kept: the store's part played by the page's last world)
        t.begin('soldier',SB);K.last=packA;ran=0;t0=performance.now();t.loadGame('keep');const msNew=performance.now()-t0,nNew=ran,B=snap();
        ok(nOld>=S.length&&nNew===0,'a load makes its world again without it ('+nOld+' stage runs), and runs none with it kept ('+nNew+')');
        const d=[];ok(same(A,B,'game',d)&&B.sum===m.sum,'the game loaded is the very same: the world\'s checksum, the save\'s record, every lot, camp and site, the land\'s heights, ledges and water depths, the way graph, and the ground painted under you ('+B.pic+')'+(d.length?' ('+d[0]+')':''));
        info('the load, its world made again: '+msOld.toFixed(0)+' ms; kept: '+msNew.toFixed(0)+' ms');
        // (a save of another version's world: the kept one is not its own, the world is made again and the save refused as before)
        {const raw=JSON.parse(localStorage.getItem(t.slotKey('keep')));raw.world.map.sum=(raw.world.map.sum+1)>>>0;localStorage.setItem(t.slotKey('keep'),JSON.stringify(raw));
          t.begin('soldier',SB);K.last=packA;ran=0;let err='';try{t.loadGame('keep')}catch(x){err=x.message}
          ok(ran>=S.length&&err===t.OTHER_WORLD,'a save of another world version: its world made again ('+ran+' stage runs) and the save refused ('+err+')')}
      }finally{S.forEach((s,i)=>{s.run=runs0[i]});try{localStorage.removeItem(t.slotKey('keep'))}catch(x){}}}
  }finally{KP.on=on0;KP.disk=disk0;K.last=null}
});
