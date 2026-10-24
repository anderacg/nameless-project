'use strict';
// A battle's ground painted in steps (doc/WORLD_DESIGN.md R15) and kept by tiles (R16): engine/ground.js PX.battleGround (the whole,
// in one go), PX.battleGroundSteps (a generator: the same painting, kept as a PX.BattleGround) and PX.battleGroundPaint (one rect
// from the plan, alone); a battle's start in steps (setup.js BattleSetup.start, loading.js runSteps) against at once.
// 24 fields (every recipe, climate and field size; rivers, a ford, a frozen bridge, roads, cliffs, mountains, an oasis, an elven
// wood, a lab's own ground): the whole's pixels, standing props (each sprite's pixels and place), river's motion and small map's
// under-colours equal EXPECT (the ground as painted before R15, recorded at 5e9453d: nothing about the picture changed); its tiles
// kept in steps, and every tile painted again alone from the plan (and odd rects), are the whole's pixels there, pixel for pixel;
// with no terrain each climate's arena assembled from its own tiles is the arena as painted before R16 (ARENA).
// Then, on a huge forest: tiles drawn at zoom 1 are the whole drawn at zoom 1, no gap between tiles at any zoom; the LRU holds
// at most its cap (never letting go a tile in view), paints the ring round the view ahead, and a tile let go comes back the same;
// zoomed out to ×0.5 or less the half-resolution overview is drawn, and the canopy layer is half resolution (both changed by
// intent: how much is recorded). Blood is kept by tiles made only where it falls, as one picture the same as the old full layer,
// and kept while the ground's tiles come and go; the shooters' reach is a layer the view's size, at zoom 1 the old layer's pixels
// (on a field seen whole, the field's own layer; panned over a huge one, but where its curve runs out of the layer: recorded).
// Then a battle on a very large forest field started at once (LOADING.sync, as every other suite) and in steps: the same battle
// (its fingerprint), the same randoms drawn before its first frame and none between its slices, the bar never going back, the
// overlay shown (past 300 ms); its ground is painted in the start (its tiles the picture the first frame used to paint), and the
// first frame paints no tile; a huge battle holds 25-35 MB of pictures. A small battle in steps never shows the overlay; a start
// that fails shows its error, and its way back leaves no battle.
window.RUN=async()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,G=t.G,P=t.P,PX=t.PX,LD=t.LOADING,ev=s=>(0,eval)(s);
const r0=Math.random,step0=window.loadingStep,keep=ev('[TERRAIN.on,FIELD_SIZES.on,BW,BH]'),TL=PX.GROUND_TILE,sync0=TL.sync;
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
const fnv=(h,d)=>{for(let i=0;i<d.length;i++){h^=d[i]&255;h=Math.imul(h,16777619)>>>0}return h},px=c=>c.getContext('2d', { willReadFrequently: true }).getImageData(0,0,c.width,c.height).data;
const fnvS=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return h.toString(16).padStart(8,'0')};
// (a ground kept by tiles, as one canvas: each tile drawn at its place (painted now where the LRU let it go))
const whole=g=>{if(!(g instanceof PX.BattleGround))return g;const cv=PX.canvas(g.width,g.height),q=cv.getContext('2d', { willReadFrequently: true });for(let k=0;k<g.cols*g.rows;k++){const [x,y]=g.rect(k);q.drawImage(g.tile(k),x,y)}return cv};
// (the same, every tile painted again alone from the plan)
const alone=(cv,S=TL.size)=>{const W=cv.width,H=cv.height,out=PX.canvas(W,H),q=out.getContext('2d', { willReadFrequently: true });for(let y=0;y<H;y+=S)for(let x=0;x<W;x+=S)q.drawImage(PX.battleGroundPaint(cv.plan,[x,y,Math.min(S,W-x),Math.min(S,H-y)]),x,y);return out};
const same=(a,b)=>{const p=px(a),q=px(b);if(p.length!==q.length)return false;for(let i=0;i<p.length;i++)if(p[i]!==q[i])return false;return true};
// (a painted ground's hash: its pixels; its props (kind, place, box and sprite pixels); the river's motion; the small map's under-colours)
const gh=g=>{let h=fnv(2166136261,px(whole(g))),p=2166136261;for(const q of g.props){p=fnv(p,[q.dk,q.x,q.y,q.dx,q.dy,...q.box].map(v=>v|0));p=fnv(p,px(q.s))}
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
 const got={},bad=[],kept=[],mono=[],tiles=[],odd=[];let ny=0,nmax=0,nt=0,huge=null;
 for(const [name,c,W,H,sp,b] of F){ev('BW='+W+';BH='+H);const T0=t.buildTerrain({...sp,W,H,top:40,bot:H-40}),spec={...T0,climate:c,...(b?{base:t.paintArena(c)}:{})};
  const cv=PX.battleGround(spec),one=gh(cv);got[name]=one;if(EXPECT[name]&&EXPECT[name]!==one)bad.push(name+': '+one+' (before R15 '+EXPECT[name]+')');
  // (in steps, kept by tiles)
  const it=PX.battleGroundSteps(spec);let n,k=0,last=0,up=true;while(!(n=it.next()).done){k++;if(typeof n.value==='number'){if(n.value<last||n.value>1)up=false;last=n.value}}
  ny+=k;nmax=Math.max(nmax,k);const Gd=n.value;if(!(Gd instanceof PX.BattleGround)||gh(Gd)!==one)kept.push(name);if(!up||k<3)mono.push(name+' ('+k+' yields)');
  // (every tile again alone, from the plan; and two odd rects)
  if(!same(alone(cv),cv))tiles.push(name);nt+=Math.ceil(W/TL.size)*Math.ceil(H/TL.size);
  for(const [x,y,w,h] of [[333,201,277,149],[W-301,H-219,301,219]]){const r=PX.battleGroundPaint(cv.plan,[x,y,w,h]),crop=PX.canvas(w,h,q=>q.drawImage(cv,-x,-y));if(!same(r,crop))odd.push(name+' '+[x,y,w,h].join())}
  if(name==='forest deepwood (huge)')huge={cv,G:Gd,spec}}
 ev('BW='+keep[2]+';BH='+keep[3]);
 if(!Object.keys(EXPECT).length)o.push('SNAP '+JSON.stringify(got));
 ok(Object.keys(EXPECT).length===F.length&&!bad.length,'24 fields painted as before R15 (pixels, props, the river’s motion, the small map’s under-colours: EXPECT)'+(bad.length?': '+bad.join('; '):''));
 ok(!kept.length,'each painted in steps is kept by tiles ('+TL.size+' px), and its tiles are the same picture as in one go, pixel for pixel'+(kept.length?': differ '+kept.join(', '):''));
 ok(!mono.length,'painting in steps yields between its stages and bands of rows, how far through never going back ('+(ny/F.length).toFixed(0)+' yields a field, up to '+nmax+')'+(mono.length?': '+mono.join(', '):''));
 ok(!tiles.length,'every tile of the 24 fields ('+nt+') painted again alone from the plan is the whole’s pixels there: the fields assembled from tiles hash as EXPECT'+(tiles.length?': differ '+tiles.join(', '):''));
 ok(!odd.length,'odd rects (not on a tile’s edge, across tiles’ edges) painted alone are the whole’s pixels there'+(odd.length?': differ '+odd.join('; '):''));
 // ---- a field with no terrain: the arena assembled from its own tiles, as painted before R16 (its whole canvas, recorded at 7fa4680)
 {const ARENA={'1100x600 grass':'f32343af','1100x600 frost':'39d0c051','1100x600 desert':'21fa07dc','1100x600 swamp':'a99b7de0','3200x1792 grass':'eb3d861e','3200x1792 frost':'be396c6c',
   '3200x1792 desert':'20224de1','3200x1792 swamp':'72796b20','2400x1344 grass':'be37328c','2400x1344 frost':'bd654606','2400x1344 desert':'719046dd','2400x1344 swamp':'3231ee90'},abad=[];
  for(const k of Object.keys(ARENA)){const [wh,c]=k.split(' '),[W,H]=wh.split('x').map(Number);ev('BW='+W+';BH='+H);const h=fnv(2166136261,px(whole(t.paintArena(c).ground))).toString(16);if(h!==ARENA[k])abad.push(k+' '+h)}
  ev('BW='+keep[2]+';BH='+keep[3]);
  ok(!abad.length,'with no terrain, each climate’s arena assembled from its own tiles is the arena painted before R16 ('+Object.keys(ARENA).length+' fields: 4 climates, 3 sizes)'+(abad.length?': differ '+abad.join(', '):''))}

 // ---- a huge forest by tiles: drawn at zoom 1 as the whole; no gaps at any zoom; the LRU; the overview; the canopy
 if(huge){const {cv,G:Gd}=huge,W=cv.width,H=cv.height,VW=1280,VH=720,view=PX.canvas(VW,VH),q=view.getContext('2d', { willReadFrequently: true });TL.sync=true;
  const shot=(z,cx,cy,f)=>{q.setTransform(1,0,0,1,0,0);q.fillStyle='#ff00ff';q.fillRect(0,0,VW,VH);q.imageSmoothingEnabled=false;q.save();q.scale(z,z);q.translate(-Math.round(cx*z)/z,-Math.round(cy*z)/z);f(z,cx,cy);q.restore();return q.getImageData(0,0,VW,VH).data};
  const byTiles=(z,cx,cy)=>Gd.drawView(q,cx,cy,cx+VW/z,cy+VH/z,z),byWhole=(z,cx,cy)=>{const x0=Math.max(0,Math.floor(cx)-2),y0=Math.max(0,Math.floor(cy)-2),x1=Math.min(W,Math.ceil(cx+VW/z)+2),y1=Math.min(H,Math.ceil(cy+VH/z)+2);q.drawImage(cv,x0,y0,x1-x0,y1-y0,x0,y0,x1-x0,y1-y0)};
  let diff=0,views=0;for(const [cx,cy] of [[0,0],[300,200],[1000,700],[1800.4,1000.6],[W-VW,H-VH],[511,511]]){const a=shot(1,cx,cy,byTiles),b=shot(1,cx,cy,byWhole);views++;for(let i=0;i<a.length;i++)if(a[i]!==b[i]){diff++;break}}
  ok(!diff,'a huge forest’s tiles drawn at zoom 1 are the whole drawn at zoom 1, pixel for pixel ('+views+' views, across tiles’ edges)');
  // (no gap: nothing of the background shows between tiles at any zoom over the field)
  let gaps=[];for(const [z,cx,cy] of [[.75,13.3,7.7],[.6,401.5,333.25],[1.25,700.3,500.6],[2,1023.5,767.5],[.97,0,0]]){const a=shot(z,cx,cy,byTiles);let m=0;const vw=Math.min(VW,Math.floor((W-cx)*z)),vh=Math.min(VH,Math.floor((H-cy)*z));
    for(let y=0;y<vh;y++)for(let x=0;x<vw;x++){const i=(y*VW+x)*4;if(a[i]===255&&a[i+1]===0&&a[i+2]===255)m++}if(m)gaps.push('×'+z+': '+m)}
  ok(!gaps.length,'no seam: at zooms ×0.6-×2 no pixel of the view over the field is left unpainted between tiles'+(gaps.length?': '+gaps.join(', '):''));
  // (the LRU: never past its cap, no tile in view let go; the ring round the view painted ahead; a tile let go comes back the same)
  TL.sync=false;Gd.view=new Set();let over=0,lost=0,ahead=0;const p0=Gd.painted;
  for(let s=0;s<14;s++){const cx=Math.min(W-VW,s*170),cy=Math.min(H-VH,s*60);shot(1,cx,cy,(z,x,y)=>{TL.sync=true;byTiles(z,x,y);TL.sync=false});if(Gd.tiles.size>Math.max(Gd.cap,Gd.view.size))over++;for(const k of Gd.view)if(!Gd.tiles.has(k))lost++;
    Gd.step(1e4);ahead=Math.max(ahead,[...Gd.tiles.keys()].filter(k=>!Gd.view.has(k)).length)}
  const pn=Gd.painted-p0;
  ok(!over&&!lost&&ahead>0&&Gd.tiles.size<=Gd.cap,'the tiles in an LRU of '+Gd.cap+' ('+Gd.cols*Gd.rows+' on the field): never past it, none in view let go, the ring round the view painted ahead ('+ahead+' tiles ahead; '+pn+' painted while panning)');
  const ks=[...Array(Gd.cols*Gd.rows).keys()].filter(k=>!Gd.tiles.has(k)),k0=ks[0],[x0,y0,w0,h0]=Gd.rect(k0),back=Gd.tile(k0);
  ok(ks.length>0&&same(back,PX.canvas(w0,h0,g=>g.drawImage(cv,-x0,-y0))),'a tile let go and wanted again is painted from the plan, the same pixels ('+(ks.length)+' let go)');
  // (zoomed out: the overview at ×0.5 or less; the canopy at half resolution: both changed by intent, recorded)
  const pv=Gd.painted;const cmp=(a,b)=>{let m=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])m++;return m/(a.length/4)};
  const z4=Math.min(VW/W,VH/H),a=shot(z4,0,0,byTiles),b=shot(z4,0,0,byWhole),a5=shot(.5,400,300,byTiles),b5=shot(.5,400,300,byWhole);
  ok(Gd.over&&Gd.over.width===W/2&&Gd.painted===pv,'zoomed out (×'+z4.toFixed(2)+', ×0.5) the half-resolution overview is drawn ('+Gd.over.width+'×'+Gd.over.height+'), no tile painted');
  const cn=PX.battleCanopy(Gd),full=PX.battleCanopy(cv),ca=shot(.75,600,400,(z,x,y)=>cn.drawView(q,x,y,x+VW/z,y+VH/z)),cb=shot(.75,600,400,()=>{q.drawImage(full,0,0)});
  ok(cn.width===W&&cn.half.width===W/2,'its canopy layer is held at half resolution ('+cn.half.width+'×'+cn.half.height+', for a field '+cn.width+'×'+cn.height+')');
  info('by intent (R16): zoomed out the overview’s pixels differ from the whole’s nearest pixels in '+(cmp(a,b)*100).toFixed(0)+'% of the view at ×'+z4.toFixed(2)+' and '+(cmp(a5,b5)*100).toFixed(0)+'% at ×0.5 (each 2×2 averaged, not one of four picked); the half-resolution canopy at ×0.75 in '+(cmp(ca,cb)*100).toFixed(0)+'% (its trees softer)');
  // (a field with no terrain (a siege's, a raid's): the arena by its own tiles, the same pixels as the arena painted whole; zoomed
  //  out its overview painted at once at half resolution, no tile)
  {ev('BW='+W+';BH='+H);const A=t.paintArena('swamp'),Ga=A.ground,aw=PX.canvas(W,H,g=>A.paintRect(g,0,0,W,H));ev('BW='+keep[2]+';BH='+keep[3]);
   const z4=Math.min(VW/W,VH/H);shot(z4,0,0,(z,x,y)=>Ga.drawView(q,x,y,x+VW/z,y+VH/z,z));const n0=Ga.tiles.size,o4=!!Ga.over;TL.sync=true;
   let ad=0;for(const [cx,cy] of [[0,0],[1500.5,700.25],[W-VW,H-VH]]){const a=shot(1,cx,cy,(z,x,y)=>Ga.drawView(q,x,y,x+VW/z,y+VH/z,z)),b=shot(1,cx,cy,(z,x,y)=>q.drawImage(aw,0,0));for(let i=0;i<a.length;i++)if(a[i]!==b[i]){ad++;break}}TL.sync=sync0;
   ok(o4&&!n0&&!ad&&Ga.over.width===W/2,'with no terrain the arena is drawn by its own tiles: at zoom 1 the arena painted whole, pixel for pixel; zoomed out (×'+z4.toFixed(2)+') its half-resolution overview, painted at once, no tile')}
  TL.sync=sync0;huge=null}

 // ---- blood by tiles and the shooters' reach the view's size
 {const L=t.BattleLab,arm=[{type:'hum_foot',count:30},{type:'hum_bow',count:20}];G.mode='world';G.modal=false;ev('FIELD_SIZES.on=true');
  L.start({leftGroups:arm,rightGroups:arm,deploy:false,paused:true,ai:true,morale:true,seed:7,terrain:'forest',ground:{recipe:'forest',seed:7,layout:'deepwood'},size:'huge',fog:false});const B=t.B,W=t.BW,H=t.BH;
  // (the same blood twice: by tiles, and into one canvas the field's size (the layer as it was); the same randoms)
  const dead=B.units.filter(u=>u.team===1).slice(0,12),spots=dead.map((u,i)=>[300+i*231%(W-600),200+i*137%(H-400)]),fullG=PX.canvas(W,H),fq=fullG.getContext('2d', { willReadFrequently: true });
  const blood=()=>{Math.random=t.seeded(99);B.corpses=[];B.gore=null;B.t=0;for(const [i,u] of dead.entries()){const cp={x:spots[i][0],y:spots[i][1],team:1,face:1,wait:true};B.corpses.push(cp);t.vfxDeath(u,cp)}
   for(let k=0;k<400;k++)t.splat(spots[k%12][0]+(k*7%40)-20,spots[k%12][1]+(k*3%20)-10);B.t=t.GORE.fall+t.GORE.pool+.1;t.drawCorpses()};
  blood();const gl=B.gore,nb=gl.tiles.size,mine=gl.getContext('2d', { willReadFrequently: true }).getImageData(0,0,W,H).data;
  ev('window.__gl0=goreLayer;goreLayer=()=>B.gore||(B.gore={each:(a,b,c,d,f)=>{__fq.setTransform(1,0,0,1,0,0);f(__fq)},drawView(){},clear(){__fq.clearRect(0,0,BW,BH)}})');window.__fq=fq;
  try{blood()}finally{ev('goreLayer=window.__gl0;delete window.__gl0;delete window.__fq')}
  const old=fq.getImageData(0,0,W,H).data;let bd=0;for(let i=0;i<old.length;i++)if(old[i]!==mine[i]){bd++;break}
  B.gore=gl;const nT=Math.ceil(W/gl.n)*Math.ceil(H/gl.n);
  ok(!bd&&nb>0&&nb<nT,'blood is kept by tiles made only where it falls ('+nb+' of '+nT+', '+(gl.bytes()/1048576).toFixed(1)+' MB): as one picture, the pixels of the old full layer');
  // (the ground's tiles come and go; the blood stays)
  const Gd=B.ground;for(let k=0;k<Gd.cols*Gd.rows;k++)Gd.tile(k);const after=gl.getContext('2d', { willReadFrequently: true }).getImageData(0,0,W,H).data;let bk=0;for(let i=0;i<after.length;i++)if(after[i]!==mine[i]){bk++;break}
  ok(!bk&&gl.tiles.size===nb&&Gd.tiles.size<=Gd.cap,'every ground tile painted in turn, the LRU letting most go: the blood kept as it was (its own tiles, never let go)');
  // (the reach: a layer the view's size and RANGE_M round it, never past the field; at zoom 1 its pixels the old field-sized layer's
  //  (drawn as it was: the view made the field's size, no camera), but where its curve runs out of the layer: there the canvas
  //  clips the curve at the layer's edge, not the field's, and its antialiasing may differ a little on that stretch (recorded))
  const g0=t.playerGroups().find(g=>t.shooters(g).length),gr=B.groups[g0],at=(x,y)=>{gr.placeAt(x,y);t.layForm(g0);t.grpUnits(g0).forEach(u=>{u.x=gr.ax+u.sx;u.y=gr.ay+u.sy})};
  const cam0=B.cam,vw=ev('[BVW,BVH]'),M=t.RANGE_M,rd=[];let rn=0,lw=0,lh=0;
  for(const [ax,ay,cx,cy] of [[700,600,400,300],[1800,900,1300,500],[2900,1500,W-t.BVW,H-t.BVH],[400,300,0,0]]){at(ax,ay);
   ev('BVW='+W+';BVH='+H);B.cam=null;t.drawFormationReach(g0,t.FIRE.blue);let rc=B.rangeCv;const A0=rc.getContext('2d', { willReadFrequently: true }).getImageData(0,0,rc.width,rc.height).data,w0=rc.width;ev('BVW='+vw[0]+';BVH='+vw[1]);
   B.cam={...cam0,z:1,x:cx,y:cy,fit:false};t.drawFormationReach(g0,t.FIRE.blue);rc=B.rangeCv;const v=rc.rv,A1=rc.getContext('2d', { willReadFrequently: true }).getImageData(0,0,rc.width,rc.height).data;lw=Math.max(lw,rc.width);lh=Math.max(lh,rc.height);let d=0;
   for(let y=v.cy-v.oy;y<v.cy-v.oy+t.BVH&&y<rc.height;y++)for(let x=v.cx-v.ox;x<v.cx-v.ox+t.BVW&&x<rc.width;x++){const i=((y+v.oy)*w0+x+v.ox)*4,j=(y*rc.width+x)*4;if(A0[i+3])rn++;if(A0[i]!==A1[j]||A0[i+3]!==A1[j+3])d++}
   rd.push(d)}
  B.cam=cam0;const nd=rd.reduce((a,b)=>a+b,0);
  ok(lw<=t.BVW+2*M&&lh<=t.BVH+2*M&&rn>5000&&nd<rn*.005,'the shooters’ reach is a layer the view’s size and '+M+' px round it (up to '+lw+'×'+lh+', '+(lw*lh*4/1048576).toFixed(1)+' MB, not the field’s '+(W*H*4/1048576).toFixed(1)+'): at zoom 1, panned over a huge field, the view’s pixels are the old field layer’s ('+rn+' px of reach in 4 views), but for '+nd+' ('+rd.join(', ')+') where its curve runs out of the layer');
  info('by the canvas (R16): a curve of the reach that runs out of its layer is clipped at the layer’s edge, not the field’s: '+nd+' of '+rn+' pixels ('+(nd/rn*100).toFixed(2)+'%) a few levels of antialiasing apart, on a huge field panned; on a field seen whole, none (the field’s own layer)');
  L.exit();ev('FIELD_SIZES.on=false')}
 // (a field the view shows whole at ×1: the reach's layer is the field's own, as before R16)
 {const L=t.BattleLab;G.mode='world';G.modal=false;L.start({leftGroups:[{type:'hum_bow',count:12}],rightGroups:[{type:'hum_foot',count:6}],deploy:false,paused:true,ai:false,morale:false,seed:42});const B=t.B;
  const g0=t.playerGroups()[0];B.sel=[g0];t.drawBattle();const rc=B.rangeCv;
  ok(B.cam.z===1&&rc&&rc.width===t.BW&&rc.height===t.BH,'on today’s field seen whole at ×1 ('+t.BW+'×'+t.BH+') the reach’s layer is the field’s own, as before R16 ('+(rc&&rc.width)+'×'+(rc&&rc.height)+')');L.exit()}

 // ---- a battle's start at once and in steps
 // (the field's edges fixed (as tests/battlesetup.js): the HUD a battle leaves behind moves the next one's measure (setup.js measureField))
 ev('FIELD_SIZES.on=true;window.__gmeasure=measureField;measureField=()=>({top:40,bot:BH-40})');
 // (a forest tile, and a battle of 650 there: a very large forest field)
 let spot=null;for(let ty=4;ty<t.MH-4&&!spot;ty++)for(let tx=4;tx<t.MW-4;tx++){const x=(tx+.5)*t.TILE,y=(ty+.5)*t.TILE;if(t.regionAt(x,y).t===t.T_FOREST&&t.regionAt(x,y).c==='grass'){spot=[x,y];break}}
 const H0={x:P.x,y:P.y},fr=[];window.loadingStep=(id,f)=>{step0(id,f);fr.push(LD.frac)};
 let calls=0,stray=0;const count=()=>{const r=t.seeded(777);Math.random=()=>{calls++;if(G.mode==='loading')stray++;return r()}};
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
 // (what a battle holds in pictures, MB: the ground's (its tiles, overview, canopy, small map), the blood's tiles, the reach's layer)
 const held=()=>{const B=t.B,g=B.ground&&B.ground.bytes?B.ground.bytes():null,s=g?g.tiles+g.pool+g.over+g.canopy+g.mini:0,gb=B.gore?B.gore.bytes():0,rb=B.rangeCv?B.rangeCv.width*B.rangeCv.height*4:0;return(s+gb+rb)/1048576};
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
  const p0=g&&g.painted;t.drawBattle();
  ok(t.B.ground===g&&g.painted===p0&&(trees>t.LOD.trees?!!g.canopy:true),'the first frame paints nothing: no tile (×'+B.cam.z.toFixed(2)+': '+(g.over?'its overview':'its tiles cut at the start')+'), the ground as the start left it'+(trees>t.LOD.trees?', its canopy layer made too':''));
  ok(g instanceof PX.BattleGround&&g.width===t.BW&&gh(g)===gh(PX.battleGround({...B.terrain,climate:B.env.c,base:B.arena})),'its ground is painted in the start, kept by tiles: the picture its first frame painted till R15 (B.terrain, B.env.c, B.arena)');
  close();
  // (a huge forest battle: what it holds in pictures, its blood and reach drawn; 25-35 MB, about 88 MB before R16)
  {const L=t.BattleLab,arm=[{type:'hum_foot',count:60},{type:'hum_bow',count:40}];fresh();
   L.start({leftGroups:arm,rightGroups:arm,deploy:false,paused:true,ai:true,morale:true,seed:7,terrain:'forest',ground:{recipe:'forest',seed:7,layout:'deepwood'},size:'huge',fog:false});const Bh=t.B,Wh=t.BW,Hh=t.BH;
   for(let i=0;i<20;i++)t.splat(Wh/2+i*9,Hh/2+i*5);const sg=t.playerGroups().find(q=>t.shooters(q).length);Bh.sel=[sg];
   t.camReset();t.drawBattle();Bh.cam.z=1;Bh.cam.fit=false;t.camCentre(Wh/2,Hh/2);for(let i=0;i<6;i++)t.drawBattle();for(let i=0;i<8;i++){t.camPan(160,40);t.drawBattle();Bh.ground.step(1e4)}
   const mb=held(),old=(Wh*Hh*4*5)/1048576,b=Bh.ground.bytes();
   ok(mb>=25&&mb<=35,'a huge forest battle ('+Wh+'×'+Hh+') holds '+mb.toFixed(1)+' MB of pictures (its '+b.n+' tiles '+(b.tiles/1048576).toFixed(1)+', overview '+(b.over/1048576).toFixed(1)+', canopy '+(b.canopy/1048576).toFixed(1)+', blood '+((Bh.gore?Bh.gore.bytes():0)/1048576).toFixed(1)+', reach '+((Bh.rangeCv?Bh.rangeCv.width*Bh.rangeCv.height*4:0)/1048576).toFixed(1)+'): 25-35 MB, where full-field canvases held up to '+old.toFixed(0)+' MB');
   L.exit()}
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
finally{Math.random=r0;TL.sync=sync0;if(window.__gmeasure){ev('measureField=window.__gmeasure');delete window.__gmeasure}window.loadingStep=step0;LD.sync=true;try{t.loadingHide()}catch(e){}ev('TERRAIN.on='+keep[0]+';FIELD_SIZES.on='+keep[1]+';BW='+keep[2]+';BH='+keep[3])}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
