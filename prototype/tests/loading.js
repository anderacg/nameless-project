'use strict';
// Loading (doc/WORLD_DESIGN.md R14, §5.4) and holdings that save themselves (R9).
// The saves: each holding's own record (saveRec), a founded holding's plain data with it (made again on a load), a holding's kind
// once it has changed; a new game drops the holdings founded in the last; a load starts from the world as it first stood.
// The overlay and its driver (loading.js runSteps), run for real (LOADING.sync off; the harness turns it on for every other suite):
// it shows only past 300 ms and then stays 400; its bar never goes back; an error shows itself and its way back, and a save that
// does not fit leaves the game untouched; a stall offers Keep waiting; it fits a phone on its side (844 x 390); and a new game and
// a load give the same world fingerprints (W1-W8 of tests/worldprint.js, by its own recipe) and the same randoms either way.
// (Between slices main.js runs no simulation and render.js frame() draws nothing but the overlay's frame (loadingFrame); where it
// does not yet, this suite stands in for it.)
window.RUN=async()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,G=t.G,P=t.P,W=t.W,LD=t.LOADING;
const r0=Math.random,pn=performance.now,frame0=window.frame,step0=window.loadingStep,stall0=LD.stall;
const J=x=>JSON.stringify(x,(k,v)=>k[0]==='_'?undefined:v),sleep=ms=>new Promise(r=>setTimeout(r,ms)),busy=ms=>{const e=pn.call(performance)+ms;while(pn.call(performance)<e);};
const key=k=>dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}));
const shown=()=>{const el=LD.el;return !!el&&!el.hidden&&!el.classList.contains('wait')};
// a run watched: when the overlay first and last showed (ms from the start), when it ended, and how it ended
const watch=async(title,steps,opt)=>{const a=pn.call(performance),r={first:null,last:null};
  const iv=setInterval(()=>{if(shown()){const n=pn.call(performance)-a;if(r.first==null)r.first=n;r.last=n}},5);
  try{r.value=await t.runSteps(title,steps,opt)}catch(e){r.err=e}r.end=pn.call(performance)-a;r.shownAt=LD.shownAt?LD.shownAt-(LD.at):0;clearInterval(iv);return r};
try{
 try{localStorage.clear()}catch(e){}
 // (frames between slices draw nothing: render.js's loading mode)
 window.frame=()=>{if(G.mode!=='loading')frame0()};
 // ---- the driver, run at once (the tests' way)
 {const seen=[];let threw=null;const v=t.runSteps('x',[{id:'a',run:()=>seen.push('a')},{id:'b',run:function*(){seen.push('b0');yield .5;seen.push('b1');return 'B'}},{id:'c',run:()=>{seen.push('c');return 7}}]);
  try{t.runSteps('x',[{id:'a',run:()=>{throw new Error('boom')}}])}catch(e){threw=e}
  ok(LD.sync&&seen.join()==='a,b0,b1,c'&&v instanceof Promise&&!shown()&&threw&&threw.message==='boom','LOADING.sync: every step at once, in order, generators to the end, no overlay; an error is thrown')
  let w=null;try{t.runSteps('x',[{id:'zip',run:()=>Promise.resolve(1)}])}catch(e){w=e}
  ok(w&&/cannot run at once/.test(w.message),'LOADING.sync: a step that returns a Promise cannot be waited for, and says so ('+(w&&w.message)+')')}
 // ---- a new game and a load in steps make what they make at once: first, on a page as fresh as worldprint's, a new game in
 // steps gives worldprint's own W1-W8 (its baseline, made at once: read from the suite, by its recipe), and no random is drawn
 // between its slices; then a save loaded at once, in steps and at once again puts in the same game each time
 const fr=[];window.loadingStep=(id,f)=>{step0(id,f);fr.push(LD.frac)};
 const mono=a=>a.length>1&&a.every((v,i)=>!i||v>=a[i-1])&&a[a.length-1]===1;
 {const fnv=()=>{let h=2166136261;const H={
    b(a){for(let i=0;i<a.length;i++)h=Math.imul(h^a[i],16777619)>>>0;return H},s(x){x=String(x);for(let i=0;i<x.length;i++)h=Math.imul(h^x.charCodeAt(i),16777619)>>>0;return H},
    n(v){h=Math.imul(h^(Math.round(v*1e6)|0),16777619)>>>0;h=Math.imul(h^(Math.round(v)|0),16777619)>>>0;return H},get x(){return h.toString(16).padStart(8,'0')}};return H};
  const bytes=a=>new Uint8Array(a.buffer,a.byteOffset,a.byteLength),words=a=>new Uint32Array(a.buffer,a.byteOffset,a.byteLength>>2);
  let draws=0,stray=0;const seed=n=>{const r=t.seeded(n);Math.random=()=>{draws++;if(G.mode==='loading')stray++;return r()}};
  const saveStr=()=>{t.saveGame(true,'quick');const sv=JSON.parse(localStorage.getItem(t.SAVE+'.quick'));delete sv.at;return JSON.stringify(sv)};
  const go=async(steps,f)=>{LD.sync=!steps;fr.length=0;f();if(steps)await LD.task;LD.sync=true};
  const h={};
  t.worldCv();seed(9001);await go(true,()=>t.act('begin','soldier'));const pB=fr.slice();G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();const d0=G.day;
  h.W1=fnv().b(t.tiles).b(t.climate).x;
  {const x=fnv();for(const d of t.DEPOSITS)x.s(JSON.stringify(d));x.b(bytes(t.DEP_AT));h.W2=x.x}
  h.W3=fnv().s(J(t.TOWNS)).x;
  {t.landFresh();h.W4=fnv().b(bytes(Int8Array.from(t.LAND))).x}
  {const c=t.worldCv();h.W5=fnv().b(words(c.getContext('2d').getImageData(0,0,c.width,c.height).data)).x}
  {const spots=[[P.x,P.y],[1792,1280],[2688,768]],keep={x:P.x,y:P.y,clock:G.clock},x=fnv();let k=0,now=1e7;performance.now=()=>now;
   for(const [sx,sy] of spots)for(const day of [.3,.8]){P.x=sx;P.y=sy;P.tx=P.ty=null;G.chase=null;G.clock=day*t.DAY;seed(9061+k);now=1e7+k*1e4;t.drawWorld();x.s(fnv().b(words(t.ctx.getImageData(0,0,t.VW,t.VH).data)).x);k++}
   performance.now=pn;P.x=keep.x;P.y=keep.y;G.clock=keep.clock;h.W6=x.x}
  {seed(9008);t.setSpeed(1);P.tx=P.x+96;P.ty=P.y+48;for(let f=0;f<600;f++)t.updateWorld(.05);
   const x=fnv().n(P.x).n(P.y),lists={lords:W.lords,bands:t.bandits,patrols:W.patrols,comps:t.cparties(),caravans:W.caravans,monsters:W.monsters,critters:W.critters,refugees:W.refugees,folk:W.folk,ships:W.ships,fights:W.fights};
   for(const k in lists){const L=lists[k]||[];x.s(k).n(L.length);for(const q of L)x.n(q.x).n(q.y)}h.W8=x.x}
  {seed(9007);P.x=-999;P.y=-999;P.tx=P.ty=null;G.chase=null;t.setSpeed(3);for(let f=0;f<4000&&G.day<d0+3;f++)t.updateWorld(.05);G.mode='world';h.W7=fnv().s(saveStr()).x}
  const ids=['W1','W2','W3','W4','W5','W6','W7','W8'];
  try{const x=new XMLHttpRequest();x.open('GET','tests/worldprint.js',false);x.send();const m=/const EXPECT=(\{[^}]*\})/.exec(x.responseText),E=m&&Function('return '+m[1])(),diff=E?ids.filter(id=>E[id]!==h[id]):ids;
   // (the generated world, -Gen: its own hashes until G1-G8 are recorded, doc/WORLD_DESIGN.md §15.2 wave 3)
   if(t.WORLD.gen)info('the generated world, a new game in steps: '+ids.map(id=>id+' '+h[id]).join(', '));else
   ok(E&&!diff.length,'a new game in steps makes the world of worldprint\'s baseline, made at once (W1-W8'+(diff.length?'; differ: '+diff.map(id=>id+' '+h[id]+(E?' baseline '+E[id]:'')).join(', '):'')+')')}
  catch(e){ok(false,'worldprint\'s baseline read ('+e.message+')')}
  ok(!stray,'no random is drawn between its slices ('+stray+' of the '+draws+' since it began)');
  // the load: the save just made, at once, in steps, at once again
  const L=[],R=[];let pL=null;const sv=localStorage.getItem(t.SAVE+'.quick');
  for(const steps of [false,true,false]){localStorage.setItem(t.SAVE+'.quick',sv);seed(9010);draws=stray=0;await go(steps,()=>t.loadGame('quick'));if(steps)pL=fr.slice();R.push(draws+(stray?'+'+stray+' stray':''));G.quietEvents=true;L.push(fnv().s(saveStr()).x)}
  ok(L[0]===L[1]&&L[1]===L[2]&&R[0]===R[1]&&R[1]===R[2],'a load in steps puts in the game a load at once does, with the same randoms, and loading again over it the same again ('+L.join(' ')+'; randoms '+R.join(' ')+')');
  ok(mono(pB)&&mono(pL),'the bars of a new game and a load never go back and end full ('+pB.map(v=>v.toFixed(2)).join(' ')+'; '+pL.map(v=>v.toFixed(2)).join(' ')+')');
  // a generated world (doc/WORLD_DESIGN.md §15.2.2 C): a new game that makes it (the generator's stages, each a step), at once and
  // in steps, from the default world; then its save loaded where the default world is in (made again first), at once and in steps.
  // (home: the default world back, by loading a save made in it: a new game without settings keeps the world in)
  {const S={preset:'normal',seed:'redwater'},out=[],R2=[],bars=[];G.mode='world';t.saveGame(true,'5');const home=()=>go(false,()=>t.loadGame('5'));
   for(const steps of [false,true]){await home();seed(9020);draws=stray=0;await go(steps,()=>t.begin('soldier',S));if(steps)bars.push(fr.slice());
    R2.push(draws+(stray?'+'+stray+' stray':''));G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();out.push(t.WM.gen+' '+t.WM.sum+' '+fnv().s(saveStr()).x)}
   const sv2=localStorage.getItem(t.SAVE+'.quick');
   for(const steps of [false,true]){await home();localStorage.setItem(t.SAVE+'.quick',sv2);seed(9021);draws=stray=0;await go(steps,()=>t.loadGame('quick'));if(steps)bars.push(fr.slice());
    R2.push(draws+(stray?'+'+stray+' stray':''));G.quietEvents=true;out.push(t.WM.gen+' '+t.WM.sum+' '+fnv().s(saveStr()).x)}
   ok(out[0]===out[1]&&out[2]===out[3]&&out[0].split(' ')[1]===out[2].split(' ')[1]&&R2[0]===R2[1]&&R2[2]===R2[3]&&!/stray/.test(R2.join()),'a generated world: a new game in steps makes the world and game one at once does, and a load in steps (the world made again first) the same, with the same randoms, none between slices ('+out.join('; ')+'; randoms '+R2.join(' ')+')');
   ok(bars.length===2&&bars.every(mono)&&bars[0].length>12,'their bars never go back and end full ('+bars.map(b=>b.length+' steps').join(', ')+')');
   await home()}
  Math.random=r0;info('a battle\'s setup in steps is R15\'s (the battle agent)')}
 // ---- R9: holdings save themselves (each new game from the same seed, as worldprint's)
 const fresh=()=>{Math.random=t.seeded(9001);t.act('begin','soldier');Math.random=r0;G.quietEvents=true};
 fresh();G.mode='world';G.modal=false;t.hidePanel();
 const TOWNS=t.TOWNS,n0=TOWNS.length,MW=t.MW,MH=t.MH,w3=J(TOWNS),save=s=>{G.mode='world';const k=LD.sync;LD.sync=true;t.saveGame(true,s);LD.sync=k;return t.readSlot(s)};
 {const s=save('1');
  ok(s.world.own.length===n0&&s.world.own.every((r,i)=>r[2]===TOWNS[i].name&&Object.keys(r[3]).join()==='s,r,u,g,b,w,k,f,cr,wa,l,e'),'each holding saves its own record, today\'s tuple: owner, garrison, name, its state (nothing more while it is as the world made it)')}
 // a load starts from the world as it first stood: nothing play left on a holding stays
 TOWNS[0].junk=1;TOWNS[3].grow=9;t.loadGame('1');G.quietEvents=true;
 ok(!('junk' in TOWNS[0])&&TOWNS[3].grow===t.readSlot('1').world.own[3][3].g&&J(TOWNS.map(z=>z.saveRec()))===J(t.readSlot('1').world.own),'a load puts each holding back as the world made it, then its record: nothing left from play that the save does not hold');
 // a founded holding
 let spot=null;for(let y=8;y<MH-8&&!spot;y++)for(let x=8;x<MW-8&&!spot;x++){let clear=true;for(let j=-4;j<=4&&clear;j++)for(let i=-4;i<=4;i++)if(t.tAt(x+i,y+j)!==t.T_OPEN){clear=false;break}
  if(clear&&[...TOWNS,...t.CAMP_SPOTS].every(z=>Math.hypot(z.tx-x,z.ty-y)>=24))spot=[x,y]}
 if(!spot)ok(false,'open land to found a holding on');
 else{const h=t.addHolding({name:'Newhaven',races:['human'],kind:'village',clim:'grass',tx:spot[0],ty:spot[1],note:'A test holding.'});
  h.gar=7;h.grow=5.5;h.stock.grain=123;const vil=TOWNS.find(z=>z.kind==='village'&&z!==h),vi=TOWNS.indexOf(vil);t.holdingOf(vil,'town');
  const rec=J(h.saveRec()),s=save('2'),fr=s.world.own[n0][3],vr=s.world.own[vi][3];
  ok(TOWNS.length===n0+1&&fr.base&&fr.base.name==='Newhaven'&&fr.base.realm==='player'&&fr.base.kind==='village'&&fr.base.tx===spot[0]&&!('x' in fr.base)&&!('owner' in fr.base),'a founded holding saves its plain data too: its realm, name, kind, tile, seed, prices…');
  ok(vr.kind==='town'&&s.world.own.filter(r=>r[3].kind).length===1,'a holding saves its kind once it has changed (a village grown to a town), only then');
  // (the grown holding's lots aside: its village centre does not fit a town, so a load lays it out again: lots.js occRebuild)
  const recs=()=>J(TOWNS.map((z,i)=>{const r=z.saveRec();if(i===vi)delete r[3].l;return r})),before=recs(),land=t.landOf(h);
  // a new game: the founded holding gone, the grown one back as it was
  fresh();
  ok(TOWNS.length===n0&&!t.townBy('Newhaven')&&!('Newhaven' in t.HOME)&&TOWNS[vi].kind==='village'&&TOWNS[vi] instanceof t.Village&&J(TOWNS)===w3,'a new game drops the holdings founded in the last, and puts every other back as the world made it');
  // the load: made again
  t.loadGame('2');G.quietEvents=true;const h2=t.townBy('Newhaven');
  ok(TOWNS.length===n0+1&&TOWNS[n0]===h2&&h2 instanceof t.Village&&t.HOME.Newhaven==='player'&&h2.owner==='player'&&h2.gar===7&&h2.grow===5.5&&h2.stock.grain===123,'a load makes the founded holding again, at the end of TOWNS, a village of yours as it was');
  ok(J(h2.saveRec())===rec&&recs()===before,'it saves the same record again, and every holding stands as it did when saved');
  ok(TOWNS[vi].kind==='town'&&TOWNS[vi] instanceof t.Town&&TOWNS[vi].T===t.HOLDING_TYPES.town,'the grown holding is a town again, of the town\'s class');
  ok(t.landOf(h2)===land&&land>0&&!!t.lotCentre(h2)&&t.lotOf(h2.tx,h2.ty)===t.lotCentre(h2),'it rules its land ('+land+' tiles) and its centre stands on its tile');
  fresh();
  ok(TOWNS.length===n0&&J(TOWNS)===w3,'and the next new game drops it again')}
 G.paused=true;// (the game stands still while the overlay is tried)
 // ---- the overlay, for real
 LD.sync=false;
 {const r=await watch('Quick',[1,2,3,4].map(i=>({id:'q'+i,label:'Step '+i,run:()=>busy(25)})));
  ok(!r.err&&r.first==null&&!LD.shownAt&&LD.el.hidden,'a task of 100 ms never shows the overlay (took '+r.end.toFixed(0)+' ms)')}
 {const r=await watch('Long',Array.from({length:7},(_,i)=>({id:'l'+i,label:'Step '+i,run:()=>busy(50)})));
  ok(!r.err&&r.first!=null&&r.first>=LD.delay-5&&r.shownAt>=LD.delay&&LD.el.hidden,'a task of 350 ms shows it only after 300 ms (shown at '+(r.first==null?'never':r.first.toFixed(0)+' ms')+'), and it is gone after');
  ok(r.end-r.shownAt>=LD.hold-2,'once shown it stays at least 400 ms ('+(r.end-r.shownAt).toFixed(0)+' ms; the work took about 350)')}
 // progress: never back, ends at 1
 {fr.length=0;let mid=null,modeIn=[],modeOut=[];const k0=G.mode;
  requestAnimationFrame(function f(){modeOut.push(G.mode+'/'+G.modal);if(LD.run)requestAnimationFrame(f)});
  const r=await watch('Forging the world…',[{id:'a',label:'Raising the land',w:1,run:function*(){for(const f of [.2,.8,.3,.5,1]){busy(40);modeIn.push(G.mode);yield f}}},
   {id:'b',label:'Carving rivers',w:3,run:function*(){busy(200);mid=[LD.el.querySelector('h2').textContent,LD.el.querySelector('.lstep').textContent,LD.el.querySelector('.ltip').textContent,LD.el.querySelector('.lbar i').style.width];
    // (on a phone on its side)
    const sc=document.getElementById('screen'),css=sc.style.cssText;sc.style.cssText+=';width:844px;height:390px';const a=sc.getBoundingClientRect(),b=LD.el.querySelector('.lwin').getBoundingClientRect();
    mid.push(b.left>=a.left&&b.right<=a.right&&b.top>=a.top&&b.bottom<=a.bottom&&b.width<=.9*844+1,b.width.toFixed(0)+'x'+b.height.toFixed(0));sc.style.cssText=css;
    const fl=LD.el.querySelector('.lflag');mid.push(fl.getContext('2d').getImageData(0,0,fl.width,fl.height).data.some(v=>v>0));yield .5;busy(150);yield 1}}]);
  ok(!r.err&&mono(fr),'the bar never goes back, even when a step says less than before, and ends full ('+fr.map(v=>v.toFixed(2)).join(' ')+')');
  ok(modeIn.every(m=>m===k0)&&modeOut.some(m=>m==='loading/true')&&G.mode===k0,'each slice of work sees the game as the last left it ('+k0+'); between slices it is loading, and modal ('+[...new Set(modeOut)].join(', ')+')');
  ok(mid&&mid[0]==='Forging the world…'&&mid[1]==='Carving rivers'&&mid[2].length>10&&parseFloat(mid[3])>0,'it shows its title, the step under way, a tip and the bar ('+(mid&&mid.slice(0,4).join(' · '))+')');
  ok(mid&&mid[4],'its window fits a phone on its side, 844 x 390 ('+(mid&&mid[5])+')');
  ok(mid&&mid[6],'your flag flutters by the title')}
 // a step that returns a Promise (a gunzip: save.js) is waited for, the game waiting too; one that rejects shows the error
 {const m0=G.mode,seen=[];const r=await watch('Waiting',[{id:'a',label:'Reading the save',run:()=>new Promise(res=>setTimeout(()=>{seen.push(G.mode);res(5)},120))},{id:'b',run:()=>{seen.push(G.mode);return 'B'}}]);
  ok(!r.err&&r.value==='B'&&seen.join()==='loading,'+m0&&G.mode===m0,'a step that returns a Promise is waited for, the game waiting (loading) meanwhile, then the next step as the game was ('+seen.join()+')');
  const x=await watch('Waiting',[{id:'a',label:'Reading the save',run:()=>new Promise((res,rej)=>setTimeout(()=>rej(new Error('Not a gzipped save')),60))}],{back:['Back to your saves',()=>{}]});
  const view=LD.view,txt=LD.el.querySelector('.lstep').textContent;key('Escape');
  ok(x.err&&x.err.message==='Not a gzipped save'&&view==='error'&&txt==='Not a gzipped save'&&LD.el.hidden&&!G.modal&&G.mode===m0,'and one whose Promise fails shows the error view, its way back closing it')}
 // keys wait while it runs
 {const m0=G.mode;let mode=null;const r=watch('Keys',[{id:'a',run:()=>busy(20)},{id:'b',run:()=>{key('i');key('Escape');mode=G.mode}}]);
  key('i');key('Escape');const m1=G.mode;await r;
  ok(m1==='loading'&&mode===m0&&G.mode===m0&&!G.esc,'no key reaches the game while it is open (no inventory, no pause menu)')}
 // ---- an error
 {let back=0;const m0=G.mode;
  const r=watch('Failing',[{id:'a',label:'Fine',run:()=>busy(20)},{id:'b',label:'Broken',run:()=>{throw new Error('The river ran uphill')}}],{back:['Back to the map',()=>back++]});
  const e=await r.then(x=>x.err),inView=LD.view,txt=LD.el.querySelector('.lstep').textContent,vis=shown(),modal=G.modal,mode=G.mode,nav=[...LD.el.querySelectorAll('.nav button')].map(b=>b.textContent+':'+b.dataset.nav).join();
  ok(e&&e.message==='The river ran uphill'&&inView==='error'&&vis&&txt==='The river ran uphill'&&!!LD.el.querySelector('[data-ld="copy"]')&&nav==='Back to the map:close','a step that throws: the error view at once, its message, Copy error, and the way back ('+nav+'); the promise rejects');
  ok(mode==='loading'&&modal,'the game waits under it');
  key('Escape');
  ok(back===1&&LD.el.hidden&&!LD.on&&!G.modal&&G.mode===m0,'Esc takes the way back: it closes, G.modal is cleared, the game as it was ('+G.mode+')')}
 // a save that does not fit: refused in the reading, the game untouched
 {G.mode='world';const s=save('3');s.world.own.splice(5,1);localStorage.setItem(t.slotKey('4'),JSON.stringify(s));
  const snap=J([TOWNS,P,W.lords,G.day]);let back=0;
  t.loadGame('4');const e=await LD.task.then(()=>null,x=>x);const view=LD.view;
  ok(e&&/does not fit/.test(e.message)&&view==='error'&&J([TOWNS,P,W.lords,G.day])===snap,'a save that does not fit this world is refused in the reading, and the game is untouched ('+(e&&e.message)+')');
  const b=LD.el.querySelector('[data-ld="back"]');ok(b&&b.textContent==='Back to your saves','its way back is to the saves');
  b.click();ok(LD.el.hidden&&G.mode==='title'&&G.menu==='load'&&!LD.on,'and takes you there')}
 // ---- a stall
 {LD.stall=250;let back=0,views=[];
  const iv=setInterval(()=>views.push(LD.view),20);
  const r=watch('Stuck',[{id:'a',label:'Thinking',run:function*(){const e=pn.call(performance)+700;while(pn.call(performance)<e)yield}}],{back:['Back to the title',()=>back++]});
  await sleep(450);const v1=LD.view,txt=LD.el.querySelector('.lstep').textContent,nav=[...LD.el.querySelectorAll('.nav button')].map(b=>b.textContent+':'+b.dataset.nav).join();key('Escape');const v2=LD.view;
  const x=await r;clearInterval(iv);
  ok(v1==='stall'&&txt==='This is taking longer than expected.'&&nav==='Keep waiting:back,Back to the title:close','no word from a step for a while: the stall view, Keep waiting or the way back ('+nav+')');
  ok(v2==='bar'&&!x.err&&back===0&&LD.el.hidden,'Esc keeps waiting: the bar again, and the work finishes');
  const r2=watch('Stuck',[{id:'a',label:'Thinking',run:function*(){for(;;)yield}}],{back:['Back to the title',()=>back++]});
  await sleep(450);const v3=LD.view;LD.el.querySelector('[data-ld="back"]').click();const y=await r2;
  ok(v3==='stall'&&back===1&&y.err&&y.err.message==='Called off'&&LD.el.hidden&&!LD.run&&!G.modal,'the way back calls the work off ('+(y.err&&y.err.message)+') and closes it');
  LD.stall=stall0}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{Math.random=r0;performance.now=pn;window.frame=frame0;window.loadingStep=step0;LD.stall=stall0;LD.sync=true;try{t.loadingHide()}catch(e){}}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
