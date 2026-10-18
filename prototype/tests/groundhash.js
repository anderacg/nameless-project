'use strict';
// A battle's ground painted in steps (doc/WORLD_DESIGN.md R15): engine/ground.js PX.battleGroundSteps, a generator, against
// PX.battleGround, in one go; and a battle's start in steps (setup.js BattleSetup.start, loading.js runSteps) against at once.
// 24 fields (every recipe, climate and field size; rivers, a ford, a frozen bridge, roads, cliffs, mountains, an oasis, an elven
// wood, a lab's own ground): the pixels, the standing props (each sprite's pixels and place), the river's motion and the small
// map's under-colours of the ground in one go equal those painted in steps, and both equal EXPECT (the ground as painted before
// R15, recorded at 5e9453d: nothing about the picture changed). Then a battle on a very large forest field started at once
// (LOADING.sync, as every other suite) and in steps: the same battle (its fingerprint), the same randoms drawn before its first
// frame and none between its slices, the bar never going back, the overlay shown (past 300 ms); its ground is painted in the
// start and is the picture its first frame used to paint (B.terrain, B.env.c, B.arena), and the first frame paints nothing.
// A small battle in steps never shows the overlay; a start that fails shows its error, and its way back leaves no battle.
window.RUN=async()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,G=t.G,P=t.P,PX=t.PX,LD=t.LOADING,ev=s=>(0,eval)(s);
const r0=Math.random,step0=window.loadingStep,keep=ev('[TERRAIN.on,FIELD_SIZES.on,BW,BH]');
const EXPECT={
 'open plain':'ba0d247e.79e5ce00.-.-.11.0','open copses':'691aab0c.882483d1.-.-.18.0',
 'open hill':'c139c23b.f0b9b6ec.-.-.0.82','open, a river and a ford':'f70e83b4.1aba5045.8dc3a898.-.9.0',
 'open, a frozen river and its bridge':'0bdf584b.e3e836d3.cc8f5e91.-.7.0','open, a road':'a16fbed0.f85a9345.-.-.110.0',
 'forest deepwood (huge)':'644e4a46.d0d37916.-.-.9048.0','forest elvenwood':'2a211230.0f7a5a7b.-.-.1388.0',
 'forest glade':'7a3e98dc.09be74b1.-.-.1001.0','forest stands':'8303fd2d.8183195b.-.-.2374.0',
 'hills ridge':'45399951.83a65f82.-.ced2c360.9.0','crags':'13a5cad2.916f4f4f.-.039d4d3b.12.0',
 'hills wooded':'da8babc4.285774b4.-.85ab4d77.0.71','hills rolling, roads both ways':'853b9241.dc8af7c8.-.ad1ca9dc.16.0',
 'peaks pass':'353d2e9f.bf95dac2.-.c17d153e.11.0','peaks gorge':'7b82b714.5240371d.-.e90d8774.6.0',
 'peaks saddle':'95597e5b.02248bf0.-.bed1f737.0.65','desert dunes':'047f3f27.a4eded11.-.1dc1c691.0.108',
 'desert erg':'6cf0bdbb.f42d9d0d.-.-.0.214','desert spires, an oasis':'40111028.6689b907.-.64d934d2.9.115',
 'swamp fen':'7cf04f35.c074b3b2.-.-.123.0','swamp mere, a river':'010cd368.e665b78d.4ffc8936.-.72.0',
 'swamp mirewood (very large)':'cdff24d9.8d4a276a.-.-.3640.0','a lab ground: cliffs, ramps, a mountain, a river (no base)':'950e9679.4bce7494.b230cee6.4d2c4edc.52.0'};
const fnv=(h,d)=>{for(let i=0;i<d.length;i++){h^=d[i]&255;h=Math.imul(h,16777619)>>>0}return h},px=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
const fnvS=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return h.toString(16).padStart(8,'0')};
// (a painted ground's hash: its pixels; its props (kind, place, box and sprite pixels); the river's motion; the small map's under-colours)
const gh=g=>{let h=fnv(2166136261,px(g)),p=2166136261;for(const q of g.props){p=fnv(p,[q.dk,q.x,q.y,q.dx,q.dy,...q.box].map(v=>v|0));p=fnv(p,px(q.s))}
  const w=g.water?fnvS(Array.from(g.water.a).join()+g.water.n.join()+g.water.flowV):'-',u=g.under?fnvS(Array.from(g.under).join()):'-';
  return h.toString(16).padStart(8,'0')+'.'+p.toString(16).padStart(8,'0')+'.'+w+'.'+u+'.'+g.trees+'.'+g.decor};
try{
 try{localStorage.clear()}catch(e){}
 Math.random=t.seeded(4242);t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;G.mode='world';G.modal=false;t.hidePanel();ev('TERRAIN.on=true');
 // ---- the 24 fields: [name, climate, W, H, buildTerrain's spec, a base (the arena) or none]
 const XP={hills:[{x:.45,y:.5,r:110,top:2,cliff:true,ramps:[0,180]}],rocks:[{x:.22,y:.25,r:44,h:6}],woods:[{x:.2,y:.72,r:70}],marsh:[{x:.62,y:.84,r:50}],
  rivers:[{x:.78,crossings:[{kind:'ford',y:.3,w:64},{kind:'bridge',y:.66,w:32}]}]};
 const F=[['open plain','grass',1100,600,{recipe:'open',layout:'plain',seed:11},1],['open copses','frost',1280,720,{recipe:'open',layout:'copses',seed:12,frost:true},1],
  ['open hill','desert',1100,600,{recipe:'open',layout:'hill',seed:13},1],['open, a river and a ford','grass',1280,720,{recipe:'open',seed:14,river:{}},1],
  ['open, a frozen river and its bridge','frost',1280,720,{recipe:'open',seed:15,river:{bridge:true,frozen:true},frost:true},1],['open, a road','grass',1792,1008,{recipe:'open',layout:'wooded',seed:16,road:{ew:true}},1],
  ['forest deepwood (huge)','grass',3200,1792,{recipe:'forest',layout:'deepwood',seed:17,forest:true},1],['forest elvenwood','grass',1280,720,{recipe:'forest',layout:'elvenwood',seed:18,forest:true,elven:true},1],
  ['forest glade','swamp',1100,600,{recipe:'forest',layout:'glade',seed:19,forest:true},1],['forest stands','frost',1792,1008,{recipe:'forest',layout:'stands',seed:20,forest:true,frost:true},1],
  ['hills ridge','grass',1280,720,{recipe:'hills',layout:'ridge',seed:21},1],['crags','frost',1280,720,{recipe:'hills',seed:22,crags:true,frost:true},1],
  ['hills wooded','desert',1100,600,{recipe:'hills',layout:'wooded',seed:23},1],['hills rolling, roads both ways','grass',2400,1344,{recipe:'hills',layout:'rolling',seed:24,road:{ew:true,ns:true}},1],
  ['peaks pass','grass',1792,1008,{recipe:'peaks',layout:'pass',seed:25},1],['peaks gorge','frost',1280,720,{recipe:'peaks',layout:'gorge',seed:26,frost:true},1],
  ['peaks saddle','desert',1100,600,{recipe:'peaks',layout:'saddle',seed:27},1],['desert dunes','desert',1280,720,{recipe:'desert',layout:'dunes',seed:28},1],
  ['desert erg','desert',1792,1008,{recipe:'desert',layout:'erg',seed:29},1],['desert spires, an oasis','desert',1100,600,{recipe:'desert',layout:'spires',seed:30,oasis:true},1],
  ['swamp fen','swamp',1280,720,{recipe:'swamp',layout:'fen',seed:31},1],['swamp mere, a river','swamp',1100,600,{recipe:'swamp',layout:'mere',seed:32,river:{}},1],
  ['swamp mirewood (very large)','swamp',2400,1344,{recipe:'swamp',layout:'mirewood',seed:33},1],['a lab ground: cliffs, ramps, a mountain, a river (no base)','grass',1280,720,{explicit:XP,seed:34},0]];
 const steps=!!PX.battleGroundSteps,got={},bad=[],same=[],mono=[];let ny=0,nmax=0;
 for(const [name,c,W,H,sp,b] of F){ev('BW='+W+';BH='+H);const T0=t.buildTerrain({...sp,W,H,top:40,bot:H-40}),spec={...T0,climate:c,...(b?{base:t.paintArena(c)}:{})};
  const one=gh(PX.battleGround(spec));got[name]=one;if(EXPECT[name]&&EXPECT[name]!==one)bad.push(name+': '+one+' (before R15 '+EXPECT[name]+')');
  if(!steps)continue;const it=PX.battleGroundSteps(spec);let n,k=0,last=0,up=true;while(!(n=it.next()).done){k++;if(typeof n.value==='number'){if(n.value<last||n.value>1)up=false;last=n.value}}
  ny+=k;nmax=Math.max(nmax,k);if(gh(n.value)!==one)same.push(name);if(!up||k<3)mono.push(name+' ('+k+' yields)')}
 ev('BW='+keep[2]+';BH='+keep[3]);
 if(!Object.keys(EXPECT).length)o.push('SNAP '+JSON.stringify(got));
 ok(Object.keys(EXPECT).length===F.length&&!bad.length,'24 fields painted as before R15 (pixels, props, the river’s motion, the small map’s under-colours: EXPECT)'+(bad.length?': '+bad.join('; '):''));
 ok(steps&&!same.length,'each painted in steps is the same picture as in one go, pixel for pixel'+(same.length?': differ '+same.join(', '):''));
 ok(steps&&!mono.length,'painting in steps yields between its stages and bands of rows, how far through never going back ('+(ny/F.length).toFixed(0)+' yields a field, up to '+nmax+')'+(mono.length?': '+mono.join(', '):''));

 // ---- a battle's start at once and in steps
 // (the field's edges fixed (as tests/battlesetup.js): the HUD a battle leaves behind moves the next one's measure (setup.js measureField))
 ev('FIELD_SIZES.on=true;window.__gmeasure=measureField;measureField=()=>({top:40,bot:BH-40})');
 // (a forest tile, and a battle of 650 there: a very large forest field)
 let spot=null;for(let ty=4;ty<t.MH-4&&!spot;ty++)for(let tx=4;tx<t.MW-4;tx++){const x=(tx+.5)*t.TILE,y=(ty+.5)*t.TILE;if(t.regionAt(x,y).t===t.T_FOREST&&t.regionAt(x,y).c==='grass'){spot=[x,y];break}}
 const H0={x:P.x,y:P.y},fr=[];window.loadingStep=(id,f)=>{step0(id,f);fr.push(LD.frac)};
 let calls=0,stray=0,base=null;const count=()=>{const r=t.seeded(777);Math.random=()=>{calls++;if(G.mode==='loading')stray++;return r()}};
 const fresh=()=>{Math.random=t.seeded(4243);t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;G.mode='world';G.modal=false;t.hidePanel()};
 const close=()=>{ev('B=null');t.fieldDone();G.mode='world';G.modal=false;t.hidePanel();t.bbar.hidden=true};
 const print=()=>{const B=t.B,T=B.terrain;return fnvS(JSON.stringify({BW:t.BW,BH:t.BH,f:t.BFIELD&&t.BFIELD.key,env:B.env,ft:[B.ftop,B.fbot],obs:B.obs,
   u:B.units.map(u=>[u.id,u.type,u.team,u.x,u.y,u.hp,u.max,u.cd,u.v,u.grp,u.sx,u.sy,u.mor,u.mor0,u.sta,u.dir,u.face,u.s]),
   g:Object.values(B.groups).map(g=>[g.id,g.ax,g.ay,g.form,g.files,g.face,g.order,g.name]),cam:B.cam,dep:!!B.deploy,dz:B.dzone,fog:!!B.fog,
   T:T?[fnvS(Array.from(T.kind).join()),fnvS(Array.from(T.lvl).join()),T.recipe,T.ai]:null,mode:G.mode}))};
 const fight=(enemies,steps,f)=>{fresh();P.x=spot[0];P.y=spot[1];P.tx=P.ty=null;f();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:enemies,allies:[],foes:[]};
   count();calls=stray=0;fr.length=0;LD.sync=!steps;let r=null;const a=performance.now();
   const run=new t.BattleSetup({enemies,tournament:false,lv:1}).start(()=>{r={print:print(),calls,next:[Math.random(),Math.random()].join(),ms:performance.now()-a};t.B.paused=true});
   LD.sync=true;return run.then(()=>r)};
 if(!spot)ok(false,'a grassland forest tile for the battle');
 else{const army=n=>Array.from({length:n},(_,i)=>['militia','spearman','archer'][i%3]),big=army(300),mine=()=>{P.troops={hum_spear:150,hum_bow:120,hum_foot:80}};
  const A=await fight(big,false,mine),gA=t.B.ground,keyA=t.BFIELD&&t.BFIELD.key,trees=gA&&gA.trees;close();
  // (frames during the run in steps: the longest gap between two is about the longest slice of work)
  let fl=[],on=true;requestAnimationFrame(function f(ts){fl.push(ts);if(on)requestAnimationFrame(f)});
  const Bs=await fight(big,true,mine),shown=LD.shownAt>0;on=false;const gaps=fl.slice(2).map((v,i)=>v-fl[i+1]),gap=gaps.length?Math.max(...gaps):0,nf=fl.length;
  const B=t.B,g=B.ground;
  ok(A&&Bs&&A.print===Bs.print&&A.next===Bs.next,'a battle on a '+keyA+' forest field ('+B.units.length+' soldiers, '+trees+' trees) started in steps is the battle started at once ('+(A&&A.print)+' / '+(Bs&&Bs.print)+')');
  ok(A&&Bs&&A.calls===Bs.calls&&!stray,'the same randoms drawn before its first frame ('+(A&&A.calls)+' / '+(Bs&&Bs.calls)+'), none between its slices ('+stray+')');
  ok(fr.length>3&&fr.every((v,i)=>!i||v>=fr[i-1])&&fr[fr.length-1]===1,'its bar never goes back and ends full ('+fr.length+' reports)');
  ok(shown,'past 300 ms the overlay shows (took '+(Bs?Bs.ms.toFixed(0):'?')+' ms in steps, '+(A?A.ms.toFixed(0):'?')+' ms at once)');
  info('in steps: '+nf+' frames while it ran, the longest gap between two '+gap.toFixed(0)+' ms');
  ok(g&&g===B.ground&&g.width===t.BW&&gh(g)===gh(PX.battleGround({...B.terrain,climate:B.env.c,base:B.arena})),'its ground is painted in the start: the picture its first frame painted till R15 (B.terrain, B.env.c, B.arena)');
  t.drawBattle();ok(t.B.ground===g&&(trees>t.LOD.trees?!!g.canopy:true),'the first frame paints nothing: the ground as the start left it'+(trees>t.LOD.trees?', its canopy layer made too':''));
  close();
  // (a small battle in steps: no overlay)
  const S=await fight(['militia','militia'],true,()=>{P.troops={hum_spear:4}});
  ok(S&&!LD.shownAt&&G.mode==='battle'&&t.B&&t.B.ground,'a small battle in steps never shows the overlay (took '+(S?S.ms.toFixed(0):'?')+' ms, '+t.BW+'×'+t.BH+')');
  close();
  // (a start that fails: its error view, and the way back leaves no battle, the map and the field's height as they were)
  {fresh();P.x=spot[0];P.y=spot[1];P.troops={hum_spear:4};G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia'],allies:[],foes:[]};const bt=window.buildTerrain;
   window.buildTerrain=()=>{throw new Error('The hills would not rise')};LD.sync=false;let e=null;
   try{const run=new t.BattleSetup({enemies:['militia'],tournament:false,lv:1}).start();LD.sync=true;e=await run.then(()=>null,x=>x)}finally{LD.sync=true;window.buildTerrain=bt}
   const view=LD.view,b=LD.el.querySelector('[data-ld="back"]'),lab=b&&b.textContent;if(b)b.click();
   ok(e&&e.message==='The hills would not rise'&&view==='error'&&lab==='Back to the map'&&!t.B&&G.mode==='world'&&!G.modal&&t.bbar.hidden&&t.BH===t.FIELD_H,'a start that fails shows its error ('+(e&&e.message)+'); Back to the map leaves no battle, the map as it was ('+G.mode+')')}
  P.x=H0.x;P.y=H0.y}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{Math.random=r0;if(window.__gmeasure){ev('measureField=window.__gmeasure');delete window.__gmeasure}window.loadingStep=step0;LD.sync=true;try{t.loadingHide()}catch(e){}ev('TERRAIN.on='+keep[0]+';FIELD_SIZES.on='+keep[1]+';BW='+keep[2]+';BH='+keep[3])}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
