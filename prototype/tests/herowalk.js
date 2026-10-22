'use strict';
// Your hero on the map (the owner's play-test of the generated world, 2026-10-22). Where you come out: a new game puts you on open
// land in front of your home holding's gate (world.js gateSpot): never water, a ford or the peaks, never on a building's lot, on
// the holding's own land; on today's map, on the generated classic world (its every holding) and on seeds s1-s8 (2 tiles under a
// holding was often water or a house there). How you walk (world.js heroStep): straight on while the way is open, else by the
// router (world/router.js) over a ford, a bridge and a ferry and round a river to a holding beyond it; a click on water you cannot
// reach stops you at the shore, never sliding back and forth along it. The way drawn ahead of you (gfx/worldui.js) is that way. The generated worlds are made here, so the suite runs with
// the flag off and with -Gen.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,P=t.P,TILE=t.TILE;
 const tileOf=(x,y)=>[Math.floor(x/TILE),Math.floor(y/TILE)];
 // (a spot you may stand on by holding h, and why not)
 const bad=(h,x,y)=>{const [tx,ty]=tileOf(x,y),k=t.tAt(tx,ty);return k===t.T_WATER?'water':k===t.T_FORD?'a ford':k===t.T_MOUNT?'peaks':t.lotOf(tx,ty)?'a lot':!t.Router.reach(h,{x,y})?'cut off':Math.hypot(tx-h.tx,ty-h.ty-2)>t.GATE.r?'far':''};
 // (the march alone, frame by frame (no road encounter, no meeting but the one walked to): you reach (x, y), stop, or n frames pass)
 const march=(n,until)=>Kit.frames(n,.05,dt=>{t.marchStep(dt*t.WORLD_PACE);t.arriveStep()},until);
 const go=(x,y,n)=>{P.tx=x;P.ty=y;P.stuck=0;G.chase=null;return march(n||1500,()=>P.tx==null||G.mode!=='world')};
 const start=()=>{Kit.clear();Kit.world({encCool:99});G.quietEvents=true;t.setSpeed(1);P.troops={hum_levy:4};P.bsta=100};
 // ---- where a new game puts you: the world under test (today's map, or the generated classic world with -Gen)
 Kit.begin('soldier',4242);{const h=G.lastTown,why=bad(h,P.x,P.y);ok(!why&&P.y>h.y,(t.WORLD.gen?'the generated classic world':'today\'s map')+': a new game puts you on open land in front of '+h.name+'\'s gate'+(why?' (not: '+why+')':''))}
 // ---- every holding of the generated classic world, and seeds s1-s8
 Math.random=t.seeded(5);t.begin('soldier',t.classicSettings());{const no=t.TOWNS.map(h=>{const s=t.gateSpot(h),w=bad(h,s.x,s.y);return w?h.name+': '+w:''}).filter(Boolean);
  ok(!no.length,'the generated classic world: in front of every one of its '+t.TOWNS.length+' holdings\' gates, open land'+(no.length?' (not: '+no.join(', ')+')':''))}
 const classic=t.WM;
 {const rows=[],no=[];let old=0;for(const seed of ['s1','s2','s3','s4','s5','s6','s7','s8']){Math.random=t.seeded(5);t.begin('soldier',t.normSettings({preset:'normal',seed}));const h=G.lastTown,why=bad(h,P.x,P.y);
   if(bad(h,(h.tx+.5)*TILE,(h.ty+2.5)*TILE))old++;rows.push(seed+' '+h.name);if(why||P.y<=h.y)no.push(seed+' '+(why||'behind'))}
  ok(!no.length,'seeds s1-s8: a new game puts you on open land in front of your home\'s gate, each ('+rows.join(', ')+'; 2 tiles under it would not do in '+old+' of them)'+(no.length?' (not: '+no.join(', ')+')':''))}
 // ---- over the crossings: a ford and a bridge on the generated classic world, a ferry on s2 (the classic seed has none)
 const across=(c,off,far)=>{const MW=t.MW,ix=c.i%MW,iy=(c.i-ix)/MW,jx=c.j%MW,jy=(c.j-jx)/MW,dx=Math.sign(jx-ix),dy=Math.sign(jy-iy),ox=dy?off:0,oy=dx?off:0;
  return[[(ix-dx*far+ox+.5)*TILE,(iy-dy*far+oy+.5)*TILE],[(jx+dx*far-ox+.5)*TILE,(jy+dy*far-oy+.5)*TILE]]};
 const trips=(kind,max)=>{let n=0,got=0;const miss=[];for(const c of t.WM.crossings){if(c.kind!==kind||n>=max)continue;
   for(const off of [-5,5]){const [a,b]=across(c,off,5);if(!t.passable(t.terrAt(a[0],a[1]))||!t.passable(t.terrAt(b[0],b[1]))||!t.Router.reach({x:a[0],y:a[1]},{x:b[0],y:b[1]})||t.clearLine(a[0],a[1],b[0],b[1]))continue;
    n++;start();Kit.goTo(a[0],a[1]);go(b[0],b[1]);const d=Math.hypot(P.x-b[0],P.y-b[1]);if(d<3)got++;else miss.push(tileOf(...a)+' to '+tileOf(...b)+': '+Math.round(d)+' px short at '+tileOf(P.x,P.y));if(n>=max)break}}
  return{n,got,miss}};
 t.useWorld(classic);start();
 for(const kind of ['ford','bridge']){const r=trips(kind,6);ok(r.n>=2&&r.got===r.n,'the generated classic world: your band walks over a '+kind+' from up or down the bank to the far side ('+r.got+' of '+r.n+' trips)'+(r.miss.length?': '+r.miss.join('; '):''))}
 // ---- the way drawn (gfx/worldui.js wuiWay; the owner's second play-test: the dots went straight over a lake): with the line
 // blocked, the router's way your band will walk, over the crossing, never over water; your band keeps to it all the way; when
 // the ways change (a crossing shut: WAYV) it is laid again, round the other way
 {let done=false;for(const [xi,c] of t.WM.crossings.entries()){if(done||c.kind!=='bridge'&&c.kind!=='ford')continue;
   for(const off of [-5,5]){if(done)break;const [a,b]=across(c,off,5);if(!t.passable(t.terrAt(a[0],a[1]))||!t.passable(t.terrAt(b[0],b[1]))||!t.Router.reach({x:a[0],y:a[1]},{x:b[0],y:b[1]})||t.clearLine(a[0],a[1],b[0],b[1]))continue;
    start();Kit.goTo(a[0],a[1]);const w=t.wuiWay(P.x,P.y,b[0],b[1],0),wet=w.X.filter((x,i)=>!t.passable(t.terrAt(x,w.Y[i]))).length,on=w.X.some((x,i)=>c.tiles.includes(Math.floor(w.Y[i]/TILE)*t.MW+Math.floor(x/TILE)));
    if(!on)continue;done=true;
    ok(w.ok&&!wet&&w.S[w.n-1]>Math.hypot(b[0]-a[0],b[1]-a[1])+TILE,'the way drawn to the far bank goes over the '+c.kind+' ('+Math.round(w.S[w.n-1])+' px, the straight line '+Math.round(Math.hypot(b[0]-a[0],b[1]-a[1]))+'), no point of '+w.n+' on water');
    let dev=0,f=0;P.tx=b[0];P.ty=b[1];P.stuck=0;for(;f<3000&&P.tx!=null;f++){t.marchStep(.05*t.WORLD_PACE);let m=1e9;for(let i=0;i<w.n;i++)m=Math.min(m,Math.hypot(w.X[i]-P.x,w.Y[i]-P.y));dev=Math.max(dev,m)}
    ok(P.tx==null&&Math.hypot(P.x-b[0],P.y-b[1])<3&&dev<t.WUI_K.off,'your band walks the way drawn, never more than '+dev.toFixed(1)+' px off it ('+f+' frames)');
    Kit.goTo(a[0],a[1]);P.tx=b[0];P.ty=b[1];G.chase=null;t.WUI.way=null;t.wuiSync(performance.now());const w0=t.WUI.way,v0=t.WAYV;t.Router.close(xi,true);
    try{t.wuiSync(performance.now());const w1=t.WUI.way,over=w1.X.some((x,i)=>c.tiles.includes(Math.floor(w1.Y[i]/TILE)*t.MW+Math.floor(x/TILE)));
     ok(w0&&w1!==w0&&w1.v===t.WAYV&&t.WAYV!==v0&&!over,'the '+c.kind+' shut: the way is laid again at once, not over it ('+Math.round(w1.S[w1.n-1])+' px'+(w1.ok?'':', no way there')+')')}
    finally{t.Router.close(xi,false);P.tx=null;t.WUI.way=null}}}
  if(!done)info('no crossing with its way blocked to draw')}
 // ---- to a holding across a river (a click on it: the chase), the way round by a crossing
 {let tried=0,met=0;const miss=[];for(const h of t.TOWNS){if(tried>=3)break;let a=null;
   for(let r=10;r<=24&&!a;r+=2)for(let k=0;k<16&&!a;k++){const x=h.x+Math.cos(k*Math.PI/8)*r*TILE,y=h.y+Math.sin(k*Math.PI/8)*r*TILE,[tx,ty]=tileOf(x,y);
    if(t.tAt(tx,ty)!==t.T_OPEN||!t.Router.reach(h,{x,y})||t.clearLine(x,y,h.x,h.y))continue;let wet=false;for(let s=1;s<20;s++){if(t.terrAt(x+(h.x-x)*s/20,y+(h.y-y)*s/20)===t.T_WATER)wet=true}if(wet)a=[x,y]}
   if(!a)continue;tried++;start();Kit.goTo(a[0],a[1]);G.lastTown=null;G.chase=h;P.tx=h.x;P.ty=h.y;P.stuck=0;march(3000,()=>G.mode!=='world'||!G.chase);
   if(G.mode!=='world'&&G.lastTown===h)met++;else miss.push(h.name+' from '+tileOf(...a)+': stopped '+Math.round(Math.hypot(P.x-h.x,P.y-h.y))+' px off');t.hidePanel();G.town=null;G.bes=null;G.mode='world'}
  ok(tried>=2&&met===tried,'a click on a holding across a river: your band goes round by a crossing and reaches it ('+met+' of '+tried+')'+(miss.length?': '+miss.join('; '):''))}
 // ---- a click on water you cannot reach: you stop at the shore, not sliding along it for ever
 {start();let lake=null;for(let i=0;i<t.MW*t.MH&&!lake;i+=7){const x=i%t.MW,y=(i-x)/t.MW;if(x>4&&y>4&&x<t.MW-4&&y<t.MH-16&&[[0,0],[-3,0],[3,0],[0,-3],[0,3]].every(([a,b])=>t.tAt(x+a,y+b)===t.T_WATER)){
    for(let d=4;d<12&&!lake;d++)if(t.tAt(x,y+d)===t.T_OPEN&&t.tAt(x,y+d+1)===t.T_OPEN)lake=[(x+.5)*TILE,(y+.5)*TILE,(x+.5)*TILE,(y+d+1.5)*TILE]}}
  if(lake){Kit.goTo(lake[2],lake[3]);const f=go(lake[0],lake[1],2000);ok(P.tx==null&&f<600,'a click out on the water: you walk to the shore and stop there ('+f+' frames), never sliding back and forth along it')}else info('no lake to click on')}
 // ---- a ferry (seed s2)
 Math.random=t.seeded(5);t.begin('soldier',t.normSettings({preset:'normal',seed:'s2'}));{const f=t.WM.crossings.find(c=>c.kind==='ferry');if(!f)info('s2 has no ferry');
  else{const MW=t.MW,[a,b]=[f.i,f.j].map(i=>[(i%MW+.5)*TILE,(Math.floor(i/MW)+.5)*TILE]);start();Kit.goTo(a[0],a[1]);go(b[0],b[1],3000);
   ok(Math.hypot(P.x-b[0],P.y-b[1])<3,'seed s2: your band takes the ferry from one landing to the other ('+Math.round(Math.hypot(a[0]-b[0],a[1]-b[1])/TILE)+' tiles over the water)')}}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
