'use strict';
// The painted ground kept on the device (gfx/artkeep.js ArtKeep, its keeper gfx/artkeepworker.js, data/world.js ART_KEEP; the owner,
// 2026-11-20: "will it create a stutter or lag ... if we load or draw lands when playing?"), run for real: a worker and the browser's
// store (a store of the test's own, emptied first; the stamp given: a test's page cannot read its scripts back). A chunk painted is
// handed over a piece at a time and kept; asked for again it comes back the very chunk (its pictures' pixels, its layers, its props
// and their sprites); its key moves with all the painter reads (a tile, a lot, the season, how fine, the code's stamp), so nothing
// else is ever given; what cannot be kept is not; a keeper that does not answer is not waited for; the store holds most at most.
window.RUN=async()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,G=t.G,K=t.ArtKeep,KP=t.ART_KEEP,A=t.WorldArt,keep0={...KP},frame0=window.frame;
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),until=async(f,ms=8000)=>{const e=performance.now()+ms;while(!f()&&performance.now()<e)await sleep(15);return !!f()};
const px=v=>{const c=document.createElement('canvas');c.width=v.width;c.height=v.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(v,0,0);return g.getImageData(0,0,c.width,c.height).data};
const diff=(a,b)=>{if(!a||!b||a.length!==b.length)return -1;let n=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i]&&!(a[i]!==a[i]&&b[i]!==b[i]))n++;return n};// (NaN the same as NaN)
try{
  Kit.begin('soldier',1);Kit.world();G.mode='world';G.modal=false;
  window.frame=()=>{};// (the page's own frames stopped: a test's page paints a chunk in view at once, and the grass bends under your feet)
  ok(!K.ok&&!K.can()&&K.recall([[0,0]])===undefined&&t.recallView()===undefined,'off in a test\'s page (the harness): nothing asked, nothing kept, the loading step passes at once');
  Object.assign(KP,{on:true,stamp:'test',db:'ashmark-ground-test',most:[3,3],patience:1500});
  ok(K.can()&&K.boot()&&K.boot(),'on: it boots, once');await K.ready;ok(K.ok&&K.stamp==='test'&&!!K.w,'the keeper is up, the stamp the one given'+(K.why?' ('+K.why+')':''));
  if(!K.ok)throw new Error('no keeper: '+K.why);
  const raw=m=>new Promise(res=>{const id='t'+Math.random();const h=e=>{if(e.data.id===id){K.w.removeEventListener('message',h);res(e.data)}};K.w.addEventListener('message',h);K.w.postMessage({...m,id})});
  await raw({t:'wipe'});
  const C=t.CHUNK,cx=Math.floor(t.P.x/C),cy=Math.floor(t.P.y/C),k=cy*A.cols+cx,fine=t.paintRes(),sea=t.farmSeason();
  // ---- painted, handed over a piece at a time, kept ----
  A.chunks.delete(k);K.reset();A.chunk(cx,cy);const P0=A.chunks.get(k);
  ok(K.out.length===1&&K.out[0][0]===k&&K.out[0][1]===P0&&!P0.kept,'a chunk painted is queued to be kept');
  let pieces=0,worst=0;{const it=K.flushSteps();for(;;){const a=performance.now(),r=it.next();worst=Math.max(worst,performance.now()-a);if(r.done)break;pieces++}}
  ok(pieces>=8&&!K.out.length&&!K.job,'handed to the keeper in '+pieces+' pieces (the longest '+worst.toFixed(1)+' ms: a strip of '+KP.strip+' rows, never a chunk at once)');
  ok(await until(()=>K.puts===1),'the keeper kept it'+(K.why?' ('+K.why+')':''));
  const O={cv:px(P0.cv),fcv:px(P0.fcv),n:JSON.stringify(P0.n),keys:Object.keys(P0).sort().join(),props:P0.props.map(p=>({...p})),spr:new Map()};for(const p of P0.props)if(p.s&&!O.spr.has(p.s))O.spr.set(p.s,px(p.s));
  // ---- asked for again: the very chunk ----
  A.chunks.delete(k);K.forgot(k);const j0=A.jobs.size;
  ok(K.ask(cx,cy)===true&&K.st.get(k).v==='wait','asked of the keeper before it is painted: the painter waits');
  ok(await until(()=>A.chunks.has(k)),'it comes back');const R=A.chunks.get(k);
  ok(R&&R.kept&&K.hits===1&&K.st.get(k)&&K.st.get(k).v==='hit'&&A.jobs.size===j0&&R.cx===cx&&R.cy===cy&&R.fine===P0.fine,'put in as a painted chunk is, marked kept (not kept twice)');
  if(R){const d={cv:diff(px(R.cv),O.cv),fcv:diff(px(R.fcv),O.fcv)};for(const f of ['shore','flow','wet','shd','lift','dep'])d[f]=diff(R[f],P0[f]);for(const f of ['X','Y','T','V','P'])d['grass.'+f]=diff(R.grass[f],P0.grass[f]);
    const bad=Object.keys(d).filter(f=>d[f]!==0);ok(!bad.length,'its pictures\' every pixel and its layers\' every value the painted ones'+(bad.length?': '+bad.map(f=>f+' '+d[f]).join(', '):' ('+O.fcv.length/4+' px fine)'));
    let pm=0,ps=0,nS=0;const seen=new Map();for(let i=0;i<O.props.length;i++){const a=R.props[i],b=O.props[i];if(!a){pm++;continue}for(const f of Object.keys(b))if(f!=='s'&&JSON.stringify(a[f])!==JSON.stringify(b[f]))pm++;
        if(b.s){if(!seen.has(b.s)){seen.set(b.s,a.s);nS++;if(diff(px(a.s),O.spr.get(b.s)))ps++}else if(seen.get(b.s)!==a.s)pm++}else if(a.s)pm++}
    ok(R.props.length===O.props.length&&!pm&&!ps,'its '+O.props.length+' props the same, each sprite\'s pixels too ('+nS+' sprites on one sheet, shared as they were)'+(pm||ps?': '+pm+' fields, '+ps+' sprites differ':''));
    ok(Object.keys(R).filter(x=>x!=='kept').sort().join()===O.keys&&JSON.stringify(R.n)===O.n&&R.grass.n===P0.grass.n&&R.shoreCut===P0.shoreCut&&R.flowCut===P0.flowCut,'and all else it holds ('+O.keys+')')}
  ok(K.ask(cx,cy)===false,'a chunk that is there is not asked for');
  A.chunks.delete(k);ok(K.ask(cx,cy)===true&&await until(()=>A.chunks.has(k))&&K.hits===2,'let go by the painter\'s own store and wanted again: asked again, back again');
  // ---- the key moves with what the painter reads ----
  {const s0=K.sig(cx,cy),key0=K.key(cx,cy,fine,sea),i=(Math.floor(t.P.y/16))*t.MW+Math.floor(t.P.x/16),kd=t.WM.kind[i],fe=t.WM.feat[i];
    ok(s0===K.sig(cx,cy),'a chunk\'s signature holds while nothing round it changes ('+s0+')');
    t.WM.kind[i]=kd===t.T_FOREST?t.T_OPEN:t.T_FOREST;const s1=K.sig(cx,cy);t.WM.kind[i]=kd;t.WM.feat[i]=fe^64;const s2=K.sig(cx,cy);t.WM.feat[i]=fe;
    ok(s1!==s0&&s2!==s0&&K.sig(cx,cy)===s0,'a tile\'s kind or feature changed: another signature');
    // (a lot within its reach, and one far off)
    let near=null,far=null;for(const h of t.TOWNS)for(const l of h.lots||[]){const lx=Math.floor(l.x*16/C),ly=Math.floor(l.y*16/C);if(!near&&l.type&&lx===cx&&ly===cy)near=l;if(!far&&l.type&&(Math.abs(lx-cx)>2||Math.abs(ly-cy)>2))far=l}
    if(near&&far){const st=near.st;near.st=st==='ruined'?'built':'ruined';const s3=K.sig(cx,cy);near.st=st;const st2=far.st;far.st=st2==='ruined'?'built':'ruined';const s4=K.sig(cx,cy);far.st=st2;
      ok(s3!==s0&&s4===s0,'a lot in it changed: another signature; a lot far off: the same');
      K.st.set(k,{v:'miss'});K.relot(near);const gone=!K.st.has(k);K.st.set(k,{v:'miss'});K.relot(far);ok(gone&&K.st.has(k),'relot: the chunks a lot reaches are asked again, no other')}
    else ok(false,'a lot in the chunk and one far off to try ('+!!near+', '+!!far+')');
    const camp={tx:Math.floor(t.P.x/16)+2,ty:Math.floor(t.P.y/16)};t.CAMP_SPOTS.push(camp);const s5=K.sig(cx,cy);t.CAMP_SPOTS.pop();ok(s5!==s0,'a camp there: another signature');
    ok(K.key(cx,cy,fine,sea==='winter'?'summer':'winter')!==key0&&K.key(cx,cy,fine+1,sea)!==key0&&K.key(cx+1,cy,fine,sea)!==key0,'another season, another fineness, another chunk: another key');
    K.stamp='other';const key1=K.key(cx,cy,fine,sea);A.chunks.delete(k);K.forgot(k);const m0=K.misses,asked=K.ask(cx,cy);await until(()=>K.st.get(k)&&K.st.get(k).v!=='wait');
    ok(key1!==key0&&asked&&K.st.get(k).v==='miss'&&K.misses===m0+1&&!A.chunks.has(k)&&K.ask(cx,cy)===false,'another build (the code\'s stamp): none kept for it, the chunk painted');K.stamp='test';
    t.FARM.season=sea==='winter'?'summer':'winter';K.forgot(k);const a2=K.ask(cx,cy);await until(()=>K.st.get(k)&&K.st.get(k).v!=='wait');const v2=K.st.get(k).v;t.FARM.season=null;
    ok(a2&&v2==='miss','the fields\' season turned: none kept for it');K.forgot(k)}
  // ---- what cannot be kept is not ----
  {const p0=K.puts;K.reset();K.made(k,{...P0,kept:true});const a=K.out.length;if(fine>1)K.made(k,{...P0,fine:1});const b=K.out.length;
    K.made(k,{...P0,odd:new Map()});let it=K.flushSteps();while(!it.next().done);const w1=K.why;
    K.made(k,{...P0,n:{...P0.n,stand:{...P0.n.stand,E:[0,0,3,0]}}});it=K.flushSteps();while(!it.next().done);const w2=K.why;await sleep(300);
    ok(!a&&!b&&/odd/.test(w1)&&/stand/.test(w2)&&K.puts===p0,'not kept: one that came from the keeper, one painted coarser than the scene, one holding what cannot be kept ('+w1+'; '+w2+')')}
  // ---- a keeper that does not answer ----
  {const w=K.w,pt=KP.patience;K.w={postMessage(){}};KP.patience=40;A.chunks.delete(k);K.reset();const a=K.ask(cx,cy);await sleep(80);const b=K.ask(cx,cy);K.w=w;KP.patience=pt;
    ok(a===true&&b===false&&K.st.get(k).v==='miss','a keeper that does not answer within patience ms is not waited for: the chunk painted')}
  // ---- the loading step: every chunk asked, done when all are answered ----
  {K.reset();A.chunks.delete(k);const far=[cx+3<A.cols?cx+3:cx-3,cy],h0=K.hits,p=K.recall([[cx,cy],far]);ok(p&&typeof p.then==='function','recall gives a Promise');await p;
    ok(A.chunks.has(k)&&K.hits===h0+1&&K.st.get(far[1]*A.cols+far[0]).v==='miss'&&!K.calls.length,'done when the keeper has answered for each: the kept one in, the other left to paint')}
  // ---- the store holds most at most, the oldest let go ----
  {const keys=[];for(let i=0;i<5;i++){const key='trim-'+i;keys.push(key);const it=K.pack(P0,key);while(!it.next().done);await until(()=>K.puts>=2+i);await sleep(5)}
    const got=[];let resent=0;for(const key of keys){const m=await raw({t:'get',key});got.push(m.t);if(m.t==='hit'){resent+=m.spr.filter(Boolean).length;K.shut(m)}}
    ok(resent===0&&K.sprs.size>0,'a sprite the keeper has sent is not sent again: the same chunk read 3 times more sends none of its '+K.sprs.size+' sprites');
    ok(got.join()==='miss,miss,hit,hit,hit','of 5 kept after it, a store of '+KP.most[0]+' holds the last 3 ('+got.join(', ')+')')}
  // ---- forgotten, reset ----
  K.st.set(k,{v:'miss'});K.out.push([k,P0,'x']);K.forgot(k);const f1=!K.st.has(k)&&!K.out.length;K.st.set(k,{v:'miss'});K.out.push([k,P0,'x']);K.reset();
  ok(f1&&!K.st.size&&!K.out.length&&!K.job,'a chunk forgotten is asked again and not kept as it was; a new world or plan forgets all');
  info('kept '+K.puts+', read back '+K.hits+', none kept '+K.misses);
  await raw({t:'wipe'});
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{window.frame=frame0;Object.assign(KP,keep0);try{K.broke('test over');K.ready=null}catch(e){}}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
