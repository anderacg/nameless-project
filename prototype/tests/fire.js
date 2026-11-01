'use strict';
// Fire (gfx/fire.js; the owner, 2026-11-01: "can you change a fire effect to be more realistic?"): one look for a camp's and a
// site's fire, a marching man's torch, the light in the dark and a fire arrow. Its flames' frames drawn once and kept; the frame a
// fire shows is noise of the clock and its id (the same time and id, the same frame; never Math.random); a light is light only, no
// flame of its own over a torch's; a fire arrow draws its flame and its trail of smoke, and throws sparks where it strikes; off
// the screen nothing. FLAMES.on false: today's pictures (PX.flame's four frames, the torch's two, the light's own small flame).
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,F=t.FLAMES,on0=F.on,now0=performance.now,clock=G.clock,life0=window.idleLife,img0=t.ctx.drawImage,rect0=t.ctx.fillRect,rnd0=Math.random;
 const setCtx=(0,eval)('c=>{const k=ctx;ctx=c;return k}'),lights=(0,eval)('()=>LIGHTQ'),clearLights=()=>(0,eval)('LIGHTQ=[]');
 const px=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=2166136261;for(let i=0;i<d.length;i++)h=Math.imul(h^d[i],16777619);return c.width+'x'+c.height+':'+(h>>>0).toString(16)};
 // (what ctx draws while f runs: its pictures and its fills' colours; Math.random's calls counted)
 const watch=f=>{const out={img:[],fill:[],rnd:0},c=t.ctx;c.drawImage=function(s,...a){out.img.push(s);return img0.call(this,s,...a)};c.fillRect=function(...a){out.fill.push(this.fillStyle);return rect0.apply(this,a)};
  Math.random=()=>{out.rnd++;return rnd0()};try{f()}finally{c.drawImage=img0;c.fillRect=rect0;Math.random=rnd0}return out};
 const at=ms=>{performance.now=()=>ms};
 try{
  at(1e7);Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;window.idleLife=()=>({pose:null,dx:0});F.on=true;
  // ---- the frames: drawn once, kept, reused
  {const a=t.fireFlame('camp',3,0),n=t.FIRE_PICS.size;
   ok(a===t.fireFlame('camp',3,0)&&t.FIRE_PICS.size===n&&a!==t.fireFlame('camp',4,0)&&a!==t.fireFlame('camp',3,-2)&&a.img.width>0&&a.ax!=null&&a.ay!=null,'a flame\'s frame by kind, frame and lean, drawn once and kept');
   const all=[];for(const k of ['camp','torch','arrow','blaze'])for(let f=0;f<F.frames;f++)all.push(px(t.fireFlame(k,f,0).img));
   ok(new Set(all.slice(0,F.frames)).size>=F.frames-1,'a camp fire\'s '+F.frames+' frames all differ ('+new Set(all.slice(0,F.frames)).size+' kinds)');
   const c=t.fireFlame('camp',0,0).img,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,cols=new Set();for(let i=0;i<d.length;i+=4)if(d[i+3])cols.add('#'+[d[i],d[i+1],d[i+2]].map(v=>v.toString(16).padStart(2,'0')).join(''));
   ok([...cols].every(x=>F.ramp.includes(x))&&cols.has(F.ramp[0])&&cols.size>=4,'its colours the fire\'s ramp, its white-yellow heart among them, no outline ('+[...cols].join(' ')+')');
   const lean=t.fireFlame('torch',2,-2).img;ok(lean.width===t.fireFlame('torch',2,0).img.width+2,'a leaning flame is wider by its lean');
   const g1=t.fireGlow(14,false);ok(g1===t.fireGlow(14,false)&&t.fireGlow(14,true)!==g1&&t.fireGlow(14,true).height<g1.height,'a light\'s glow and its flattened pool, by reach, each kept')}
  // ---- the flicker: by the clock and the id alone, irregular
  {const s=[];for(let i=0;i<400;i++)s.push(t.fireFrameAt(100+i/60,7));
   ok(s.every((f,i)=>f===t.fireFrameAt(100+i/60,7)),'the same time and id give the same frame');
   const runs=[];let r=1;for(let i=1;i<s.length;i++){if(s[i]===s[i-1])r++;else{runs.push(r);r=1}}const kinds=new Set(s).size,rl=new Set(runs).size;
   ok(kinds===F.frames&&rl>=3,'it goes through all '+F.frames+' frames, at an uneven pace (frames held for '+[...new Set(runs)].sort((a,b)=>a-b).join(', ')+' ticks), not a two-frame blink');
   let same=0;for(let i=0;i<100;i++)if(t.fireFrameAt(50+i/10,1)===t.fireFrameAt(50+i/10,2))same++;ok(same<50,'two fires do not keep step ('+same+' of 100 the same)');
   const nz=[];for(let i=0;i<50;i++)nz.push(t.fireNoise(i*.37,3));ok(nz.every(v=>v>=0&&v<=1)&&Math.max(...nz)-Math.min(...nz)>.2,'its noise between 0 and 1, and moving')}
  // ---- a camp fire: flame, smoke, embers, its light; nothing off the screen; never Math.random
  {clearLights();const w=watch(()=>t.drawFire(100,100,5));
   ok(w.img.length===1&&[...t.FIRE_PICS.values()].some(s=>s.img===w.img[0])&&w.rnd===0,'a camp fire draws its flame (one kept picture), no Math.random');
   ok(lights().length===1&&lights()[0].g>0&&lights()[0].id===5,'and queues its light, with its pool on the ground');
   clearLights();const off=watch(()=>t.drawFire(-500,100,5));ok(!off.img.length&&!off.fill.length&&!lights().length,'off the screen: nothing drawn, no light');
   ok(t.campFlame()===t.fireFlame('camp',0,0),'a page\'s banner shows its first frame (campFlame)');
   const tw=watch(()=>t.fireTorchAt(50,50,9));ok(tw.img.length===1&&tw.img[0]===t.fireFlame('torch',t.fireFrameAt(t.fireTime(),9),0).img&&!tw.rnd,'a torch\'s flame alone (fireTorchAt), by the clock and its id')}
  // ---- torches: the new flame, trailing as he walks; lights only light
  const kind=c=>Object.keys(t.ST).find(k=>t.ST[k].race==='human'&&!t.ST[k].beast&&!t.ST[k].big&&t.unitClass(t.ST[k])===c&&t.unitSize(k)>=6);
  const lord=W.lords.find(l=>t.FACS[l.fac].races[0]==='human')||W.lords[0];Object.assign(lord,{inside:null,fight:null,x:P.x+40,y:P.y,state:'march'});
  lord.army={nextId:1,groups:[]};lord.tc={[kind('ranged')]:20,[kind('cav')]:10};lord.changed();t.MARCH_ARMIES.delete(lord);
  const A=t.MarchArmy.of(lord);A.sync();const R=t.marchRoles(A),bearers=A.units.filter(u=>R.get(u)?.torch);
  const VW=t.VW,VH=t.VH,cam={x:Math.round(lord.x-VW/2),y:Math.round(lord.y-VH/2)};G.clock=t.DAY*.75;
  {const u=bearers[0];u.walking=false;clearLights();const w=watch(()=>window.drawMarcher(u,lord,cam)),L=lights()[0],fr=t.fireFrameAt(t.fireTime(),u.id);
   ok(bearers.length>0&&w.img[w.img.length-1]===t.torchSprite(R.get(u).kit.skin,fr,0),'at night his torch: its flame\'s frame by the clock and his id ('+fr+')');
   ok(w.rnd===0&&L&&L.id===u.id&&L.g>0,'its light keyed to him, its pool at his feet ('+L?.g+' px down), no Math.random');
   u.walking=true;u.stepT=.3;const w2=watch(()=>window.drawMarcher(u,lord,cam));u.walking=false;const lk=w2.img[w2.img.length-1];
   ok([...Array(F.frames).keys()].some(f=>lk===t.torchSprite(R.get(u).kit.skin,f,-F.lean)),'walking, its flame trails back ('+(-F.lean)+' px)')}
  // (the night drawn whole, with this army's torches before you: render.js drawWorld)
  {Object.assign(lord,{x:P.x+30,y:P.y+10});t.reveal();const night=()=>watch(()=>t.drawWorld());
   const on=night(),n=lights().length,ownFlame=on.fill.filter(c=>c==='#e8803a'||c==='#ffe090').length,glows=new Set(t.FIRE_GLOWS.values());
   ok(n>0&&ownFlame===0&&on.img.some(c=>glows.has(c)),'the night\'s lights are light only: '+n+' glows and their pools, no small flame of their own over the torches\' ('+ownFlame+')');
   info('drawWorld at night: '+on.rnd+' draws of Math.random (the world\'s own, not the fires\')');
   F.on=false;const off=night(),old=off.fill.filter(c=>c==='#e8803a').length;F.on=true;
   ok(old>0&&old<=lights().length,'FLAMES off: each light paints its own small flame as before ('+old+')')}
  // ---- FLAMES off: today's pictures
  {F.on=false;const sk='#f3bfad';
   // (the torch as it was drawn before fire.js: its haft, its pitch head, the two frames of MARCH_FLAME, outlined)
   const oldTorch=f=>{const [deg,n]=t.MARCH_GEAR.brand,R=n+4,g=t.pgrid(2*R+1,2*R+1),a=deg*Math.PI/180,Wd=t.PPAL.wood;let q=null;
    for(let i=0;i<n;i++){const x=Math.round(R+Math.cos(a)*i),y=Math.round(R+Math.sin(a)*i);if(q&&q[0]!==x&&q[1]!==y)t.pset(g,q[0],y,Wd[2]);t.pset(g,x,y,i===n-1?'#3a2a1a':Wd[i<2?2:1]);q=[x,y]}
    for(const [dx,dy,col] of t.MARCH_FLAME[f])t.pset(g,q[0]+dx,q[1]+dy,col);t.pset(g,R,R,sk);t.poutline(g);return t.pcanvas(g)};
   ok([0,1].every(f=>px(t.torchSprite(sk,f))===px(oldTorch(f))),'the torch: its old two frames, pixel for pixel');
   const fl=[0,1,2,3].map(f=>{t.spr['flm'+f]=null;at(110*(4e5+f)+5);const w=watch(()=>t.drawFire(100,100,0));return w.img[0]});at(1e7);
   ok(fl.every((c,i)=>c===t.spr['flm'+i].img)&&px(fl[0])===px(t.PX.flame(0).img)&&t.campFlame()===t.spr.flm0,'a camp fire: the engine\'s four frames (PX.flame), and the banner\'s flm0');
   clearLights();watch(()=>t.drawFire(100,100,0));ok(!lights().length,'and, as before, no light of its own');
   F.on=true}
  // ---- a fire arrow: its flame and trail; sparks where it strikes
  // (a lab's paused battle, unit kits' step 2 off as tests/unitabilities.js runs it)
  Kit.kits(false,()=>{const L=t.BattleLab;if(L.active)L.exit();G.mode='world';G.modal=false;
   L.start({leftGroups:[{type:'hum_bow',count:6}],rightGroups:[{type:'hum_guard',count:4}],deploy:false,ai:false,paused:true,morale:true,seed:42});
   try{const B=t.B,g=t.playerGroups().map(id=>B.groups[id])[0],a=g.units[0],e=B.units.find(u=>u.team===1);e.x=a.x+150;e.y=a.y;
    ok(g.useAbility('fire'),'bowmen loose fire arrows');const n=B.arrows.length;const was=Math.random;Math.random=t.seeded(91);try{t.attack(a,e)}finally{Math.random=was}
    const ar=B.arrows[n];ok(ar&&ar.src.fireArrow,'a fire arrow flies');
    for(let i=0;i<6&&ar.life>0;i++)t.Missile.of(ar).step(.02);
    const w=watch(()=>t.fireArrows()),pics=new Set([...t.FIRE_PICS.entries()].filter(([k])=>k.startsWith('arrow')).map(([,s])=>s.img)),fl=w.img.filter(c=>pics.has(c));
    ok(fl.length===1&&w.fill.filter(c=>c==='#4e4a48').length===F.trail&&w.rnd===0,'in flight: its flame at its head and '+F.trail+' puffs of smoke behind, no Math.random');
    const lean=+[...t.FIRE_PICS.entries()].find(([,s])=>s.img===fl[0])[0].split(',')[1];ok(lean<0,'its flame streams back from the way it flies ('+lean+')');
    F.on=false;const off=watch(()=>t.fireArrows());F.on=true;ok(!off.img.length&&!off.fill.length,'FLAMES off: as before, no flame on it');
    const X=t.FXP,clear=()=>{B.vfx=[];X.length=0;X.b=B};clear();const r0=watch(()=>t.fireSparks(e.x,e.y-7));const sp=X.filter(p=>p.k==='spark');
    ok(sp.length===F.sparks&&sp.every(p=>F.ramp.includes(p.col))&&r0.rnd===0&&!B.vfx.length,'where it strikes, '+F.sparks+' sparks, never Math.random, drawn only: none among the battle\'s own effects (B.vfx '+B.vfx.length+')');
    clear();e.hp=999;ar.x=e.x;ar.y=e.y;ar.z=1;ar.vz=-50;t.Missile.of(ar).strike(e);ok(X.filter(p=>p.k==='spark'&&F.ramp.includes(p.col)).length===F.sparks,'a fire arrow striking home throws them');
    clear();t.vfxExplode(e.x,e.y,30);const ex=B.vfx.filter(p=>p.k==='ember');ok(ex.length===16&&ex.every(p=>t.FIRE_EMBERS.has(p)&&!('fire' in p))&&X.some(p=>p.k==='blaze')&&!B.vfx.some(p=>p.k==='blaze'),'a spell\'s explosion: its embers marked to cool as fire (each vfx as it was), a blaze left a moment, drawn only');
    {const w=watch(()=>t.fireBlazes());ok(w.img.length===1&&[...t.FIRE_PICS.entries()].some(([k,s])=>k.startsWith('blaze')&&s.img===w.img[0]),'the blaze drawn as it burns')}
    {const ar2=B.arrows.find(a=>a.src&&a.src.fireArrow&&a.life>0);clear();t.abilityStep(g,.02);const em=B.vfx.filter(p=>p.k==='ember');ok(!ar2||em.length===0||em.every(p=>t.FIRE_EMBERS.has(p)&&!('fire' in p)),'a fire arrow\'s trailing embers marked the same way ('+em.length+')')}
    ok(t.fireAge(1)===F.ramp[1]&&t.fireAge(0)===F.ramp[F.ramp.length-1],'an ember yellow when new, deep red as it dies');
    const cnt=f=>{let k=0;const r=Math.random;Math.random=()=>{k++;return rnd0()};try{f()}finally{Math.random=r}return k};
    const kOn=cnt(()=>t.vfxExplode(0,0,30));F.on=false;const kOff=cnt(()=>t.vfxExplode(0,0,30));F.on=true;ok(kOn===kOff,'and the same draws of Math.random either way ('+kOn+')')}
   finally{L.exit()}})
 }finally{t.ctx.drawImage=img0;t.ctx.fillRect=rect0;Math.random=rnd0;performance.now=now0;F.on=on0;G.clock=clock;window.idleLife=life0}
});
