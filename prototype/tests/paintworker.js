'use strict';
// The map's painter workers (the owner, 2026-11-18: "optimize the game performance on mobile"; gfx/paintworker.js, worldart.js
// ArtWorkers): a copy of the game's scripts in a worker loads the world from the page's save record and paints chunks there; a chunk
// painted there is the very chunk painted here, its pictures at game px and fine px, its props, grass, water and standing index (8
// chunks: water, roads, holdings, bridges); in play the chunks queued are painted there, none outside the view here (one in view waiting
// longer than ART_WORKERS.help helped here too, the first done kept); a job of an older world is thrown away.
window.RUN=async()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
 const done=()=>{const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),until=async(f,ms)=>{const t0=performance.now();while(!f()&&performance.now()-t0<ms)await wait(50);return f()};
 try{const t=T,G=t.G,WA=t.WorldArt,AW=t.ArtWorkers,MW=t.MW,MH=t.MH,TILE=t.TILE,CH=t.CHUNK;
  Kit.begin('soldier',1);Kit.world();G.mode='world';G.modal=false;t.drawWorld();
  // ---- the pool booted, the world sent and loaded there
  const t0=performance.now();ok(AW.start(true),'the painter workers start ('+AW.list.length+' of them, '+(navigator.hardwareConcurrency||'?')+' cores)');
  const up=await until(()=>AW.ready(),240000);ok(up,'the world loaded in them ('+((performance.now()-t0)/1000).toFixed(1)+' s, booted and made again from the save record)');
  if(!up){info('pool: fail '+AW.fail+' '+(AW.why||'')+','+AW.list.length+' workers, n '+AW.n+', theirs '+AW.list.map(w=>w.wn+(w.last?' '+w.last:'')).join(' / '));done();return}
  // ---- 8 chunks: the most water, roads, holdings' lots and bridges
  const cols=WA.cols,rows=WA.rows,score=[];for(let cy=0;cy<rows;cy++)for(let cx=0;cx<cols;cx++){let w=0,r=0;const tx0=cx*CH/TILE,ty0=cy*CH/TILE;
   for(let y=ty0;y<Math.min(MH,ty0+CH/TILE);y++)for(let x=tx0;x<Math.min(MW,tx0+CH/TILE);x++){const k=t.tiles[y*MW+x];if(k===t.T_WATER)w++;else if(k===t.T_ROAD)r++}
   const lots=t.TOWNS.reduce((n,h)=>n+(h.lots||[]).filter(l=>l.x>=tx0&&l.x<tx0+CH/TILE&&l.y>=ty0&&l.y<ty0+CH/TILE).length,0);
   const br=(t.WM.crossings||[]).filter(c=>c.kind==='bridge'&&[c.i,c.j].some(i=>{const x=i%MW,y=(i-x)/MW;return x>=tx0&&x<tx0+CH/TILE&&y>=ty0&&y<ty0+CH/TILE})).length;score.push({cx,cy,w,r,lots,br})}
  const pick=[],add=(k,n)=>{for(const s of score.slice().sort((a,b)=>b[k]-a[k]))if(n>0&&s[k]>0&&!pick.includes(s)){pick.push(s);n--}};add('w',2);add('r',2);add('lots',2);add('br',2);
  info('chunks: '+pick.map(s=>s.cx+','+s.cy+' (water '+s.w+', road '+s.r+', lots '+s.lots+', bridges '+s.br+')').join('; '));
  // ---- each painted there and here, at game px and fine px, compared
  const px=im=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height).data};
  const same=(a,b)=>{if(!a||!b)return a===b;if(a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true};
  const there=(cx,cy,fine)=>new Promise(res=>{const w=AW.list.find(q=>!q.busy&&q.wn===AW.n)||AW.list[0];AW.post(w,cx,cy,fine,res)});
  const bad=[];let n=0,props=0,clumps=0,stand=0,ms=[0,0];
  for(const s of pick)for(const fine of [1,2]){const a=performance.now(),W=await there(s.cx,s.cy,fine),b=performance.now(),j=WA.paintJob(s.cx,s.cy,fine);t.runGen(j.gen);const H=j.rec;ms[0]+=b-a;ms[1]+=performance.now()-b;n++;
   const tag=s.cx+','+s.cy+' x'+fine,no=m=>bad.push(tag+': '+m);
   if(!same(px(W.cv),px(H.cv)))no('game-px picture differs');if(!!W.fcv!==!!H.fcv||W.fcv&&!same(px(W.fcv),px(H.fcv)))no('fine picture differs');
   for(const k of ['shore','flow','wet','shd','lift','dep'])if(!same(W[k],H[k]))no(k+' differs');
   const ks=r=>Object.keys(r).filter(k=>!['wms','ms','cv','fcv'].includes(k)).sort().join(',');if(ks(W)!==ks(H))no('fields '+ks(W)+' / '+ks(H));
   if(H.grass){for(const k in H.grass)if(ArrayBuffer.isView(H.grass[k])&&!same(W.grass&&W.grass[k],H.grass[k]))no('grass '+k+' differs');clumps+=H.grass.n||0}
   if((W.props||[]).length!==(H.props||[]).length)no('props '+(W.props||[]).length+' / '+(H.props||[]).length);else H.props.forEach((p,i)=>{const q=W.props[i];props++;
    for(const k of ['x','y','ax','ay','kind','low'])if(p[k]!==q[k])no('prop '+i+' '+k);if(JSON.stringify(p.bake||null)!==JSON.stringify(q.bake||null))no('prop '+i+' bake');if(i<60&&!same(px(p.s),px(q.s)))no('prop '+i+' picture')});
   const SH=H.n&&H.n.stand,SW=W.n&&W.n.stand;for(const k of ['trees','fen','hills','peaks','decor','flat','rock'])if(H.n[k]!==W.n[k])no('count '+k);
   if(SH){for(const k of ['X','Y','w','h','n','C','R'])if(SH[k]!==SW[k])no('stand '+k);if(!same(SH.at,SW.at)||!same(SH.L,SW.L))no('stand grid');stand+=SH.n;
    for(let e=0;e<SH.n;e++){const o=e*4;if(SH.E[o]!==SW.E[o]||SH.E[o+1]!==SW.E[o+1]||SH.E[o+3]!==SW.E[o+3])no('stand entry '+e);const r=SH.E[o+2],q=SW.E[o+2];
     if((r<0||q<0)?r!==q:(()=>{const A=t.PX.WN_SPR[r],B=t.PX.WN_SPR[q];return !B||A.width!==B.width||!same(A.a,B.a)||String(A.box)!==String(B.box)})())no('stand sprite '+e)}}}
  ok(!bad.length,'a chunk painted in a worker is the very one painted here: '+n+' paintings (8 chunks at game px and fine px), '+props+' props, '+clumps+' grass clumps, '+stand+' standing entries'+(bad.length?'; '+bad.slice(0,8).join('; '):''));
  info('a painting there '+(ms[0]/n).toFixed(0)+' ms on average (sent and back), here '+(ms[1]/n).toFixed(0)+' ms');
  // ---- in play: the chunks queued painted there, none here; a job of an older world thrown away
  {const st=WA.start,calls={n:0,v:0};WA.start=function(cx,cy){if(!WA.view.has(cy*WA.cols+cx)){calls.n++;if(!calls.st)calls.st=cx+','+cy+' '+new Error().stack.split('\n').slice(1,6).join(' | ')}else calls.v++;return st.call(this,cx,cy)};const lo=WA.liveOk;WA.liveOk=true;let keepLive=0;
   try{const far=pick[0],cam={x:far.cx*CH+8,y:far.cy*CH+8};for(const k of [...WA.chunks.keys()])WA.forget(...(()=>{const x=k%cols,y=(k/cols)|0;return[x*CH,y*CH,x*CH+1,y*CH+1]})());
    keepLive=setInterval(()=>{WA.idleAt=performance.now()},20);    WA.idleAt=performance.now();t.ctx.save();WA.draw(t.ctx,cam);t.ctx.restore();const want=[...WA.view];
    const got=await until(()=>{WA.idleAt=performance.now();t.ctx.save();WA.draw(t.ctx,cam);t.ctx.restore();return want.every(k=>WA.chunks.has(k))},120000);
    ok(got&&calls.n===0,'in play the chunks queued are painted by the workers, none outside the view here; those in view filled ('+want.filter(k=>WA.chunks.has(k)).length+' of '+want.length+'; in view helped here after '+t.ART_WORKERS.help+' ms: '+calls.v+' steps begun; outside it '+calls.n+(calls.st?', first '+calls.st:'')+')');
    const k0=[...AW.jobs.keys()][0];WA.invalidate();await wait(1500);ok(!AW.jobs.size||![...AW.jobs.values()].some(j=>j.n===AW.n),'a world changed: the jobs of the one before thrown away when they come back'+(k0==null?' (none in flight)':''))}
   finally{WA.start=st;WA.liveOk=lo;clearInterval(keepLive)}}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 try{for(const w of T.ArtWorkers.list)w.terminate();T.ArtWorkers.list=[]}catch(e){}
 done()};
