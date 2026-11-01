'use strict';
// Not a test (run by name: -Suites visual/fire): the sheet of fire (gfx/fire.js; the owner, 2026-11-01: "can you change a fire
// effect to be more realistic?"). Top: every frame of a camp fire's flame, a torch's (upright, then trailing as he walks) and a
// fire arrow's by its lean, 4x, with the old ones (FLAMES off) beside them. Below: a small scene, a camp with its fire, marching
// men with torches (one walking), a fire arrow in flight and a spell's blaze, by day and by night, drawn at the map's own scale
// and shown 1x, 2x and 4x (as the screen scales it, true pixels), the new look and then the old; last, the night scene three
// moments apart (its flicker). Its picture is the IMG line, a PNG as a data URL.
window.RUN=()=>{const o=[],t=T,P=t.P,G=t.G,W=t.W,F=t.FLAMES,on0=F.on,clock=G.clock,life0=window.idleLife,B0=t.B,now0=performance.now;
 const setCtx=(0,eval)('c=>{const k=ctx;ctx=c;return k}'),setB=(0,eval)('b=>{B=b}'),lights=(0,eval)('()=>LIGHTQ');
 try{
  Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;window.idleLife=()=>({pose:null,dx:0});
  const kind=c=>Object.keys(t.ST).find(k=>t.ST[k].race==='human'&&!t.ST[k].beast&&!t.ST[k].big&&t.unitClass(t.ST[k])===c&&t.unitSize(k)>=6);
  const lord=W.lords.find(l=>t.FACS[l.fac].races[0]==='human')||W.lords[0];Object.assign(lord,{inside:null,x:P.x+60,y:P.y,state:'march'});
  lord.army={nextId:1,groups:[]};lord.tc={[kind('ranged')]:10,[kind('cav')]:5};lord.changed();t.MARCH_ARMIES.delete(lord);
  const A=t.MarchArmy.of(lord);A.sync();const R=t.marchRoles(A),torch=A.units.filter(u=>R.get(u)?.torch).slice(0,3),plain=A.units.filter(u=>!R.get(u)?.torch&&!R.get(u)?.flag&&!u.character).slice(0,2);
  const Wd=940,H=1010,cv=document.createElement('canvas');cv.width=Wd;cv.height=H;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#14121a';g.fillRect(0,0,Wd,H);
  const label=(s,x,y)=>{g.fillStyle='#e4e0cf';g.font='11px Arial';g.fillText(s,x,y)};
  const up=(c,x,y,z)=>{g.drawImage(c,x,y,c.width*z,c.height*z)};
  // ---- the frames, 4x
  {let x=8;label('camp fire: its 8 frames (new), then the old 4',8,14);g.fillStyle='#22202a';g.fillRect(4,20,Wd-8,62);
   F.on=true;for(let f=0;f<F.frames;f++){const s=t.fireFlame('camp',f,0);up(s.img,x,26,4);x+=s.img.width*4+6}x+=16;
   for(let f=0;f<4;f++){const s=t.PX.flame(f);up(s.img,x,26,4);x+=s.img.width*4+6}
   x=8;label('torch (upright, then trailing as he walks) and fire arrow (its lean -3..3), 4x; the old torch\'s two frames last',8,98);g.fillStyle='#22202a';g.fillRect(4,104,Wd-8,62);
   for(const ln of [0,-F.lean])for(let f=0;f<F.frames;f+=2){const s=t.fireFlame('torch',f,ln);up(s.img,x,110,4);x+=s.img.width*4+4}x+=12;
   for(let ln=-3;ln<=3;ln++){const s=t.fireFlame('arrow',ln&7,ln);up(s.img,x,114,4);x+=s.img.width*4+4}x+=12;
   for(const on of [true,false]){F.on=on;for(const f of on?[0,3]:[0,1]){const c=on?t.torchSprite('#f3bfad',f,0):t.torchSprite('#f3bfad',f);up(c,x,108,3);x+=c.width*3+4}}F.on=true}
  // ---- the scene, in game pixels: SW x SH
  const SW=128,SH=60,cam={x:Math.round(P.x-SW/2),y:Math.round(P.y-SH/2)};
  const put=(u,x,y,dir,walk)=>{const was={x:u.x,y:u.y,dir:u.dir,walking:u.walking,stepT:u.stepT};Object.assign(u,{x:cam.x+x,y:cam.y+y,dir,walking:walk,stepT:walk?.3:0});try{window.drawMarcher(u,lord,cam)}finally{Object.assign(u,was)}};
  const arrows=[{src:{fireArrow:true},arc:true,x:92,y:38,z:10,vx:120,vy:0,vz:-20,life:1,a:0},{src:{fireArrow:true},arc:true,x:110,y:52,z:4,vx:-90,vy:20,vz:-40,life:1,a:0}];
  // (the old light: render.js drawWorld's, as it was)
  const oldLights=(c,a)=>{const now=performance.now();for(const L of lights()){const r=L.r*(1+.06*Math.sin(now/90+L.x)),q=c.createRadialGradient(L.x,L.y,1,L.x,L.y,r);q.addColorStop(0,'rgba(255,190,90,'+(.12+.28*a).toFixed(3)+')');q.addColorStop(1,'rgba(255,150,60,0)');
    c.save();c.globalCompositeOperation='lighter';c.fillStyle=q;c.fillRect(L.x-r,L.y-r,2*r,2*r);c.restore();const f=Math.floor(now/120+L.x)%2;t.rect(c,'#e8803a',L.x-1+f,L.y-2,2,2);t.rect(c,'#ffe090',L.x,L.y-1-f,1,1)}};
  const scene=(night,on,ms)=>{performance.now=()=>ms;F.on=on;G.clock=night?t.DAY*.75:t.DAY*.3;const c=t.mkc(SW,SH,()=>{}),x=c.getContext('2d');x.imageSmoothingEnabled=false;
    x.fillStyle=night?'#2a3226':'#7d9a5a';x.fillRect(0,0,SW,SH);const k=setCtx(x);(0,eval)('LIGHTQ=[]');
    try{const s=t.campSprite(77,'bandit');x.drawImage(s.sh,4,4);x.drawImage(s,4,4);t.drawFire(4+s.fire[0],4+s.fire[1],3);
     torch.forEach((u,i)=>put(u,52+i*12,30+(i%2)*14,i===1?Math.PI:0,i===2));plain.forEach((u,i)=>put(u,64+i*12,50,0,false));
     setB({arrows,world:null,vfx:[{k:'blaze',x:112,y:24,life:.5,max:.7,age:.2}]});for(const a of arrows){x.save();x.translate(Math.round(a.x),Math.round(a.y-4-a.z));x.rotate(Math.atan2(a.vy-a.vz,a.vx));x.fillStyle='#e8e4d0';x.fillRect(-4,0,7,1);x.fillStyle='#c9ced8';x.fillRect(3,0,2,1);x.restore()}
     if(on){t.fireArrows();t.fireBlaze(t.B.vfx[0],.7)}setB(B0);
     const a=night?t.Clock.darkness():0;if(a>0){x.fillStyle='rgba(10,14,50,'+(a*.34).toFixed(3)+')';x.fillRect(0,0,SW,SH)}
     if(on)t.fireLights(cam,a);else oldLights(x,a)}finally{setCtx(k);setB(B0)}return c};
  let y=184;
  for(const on of [true,false]){label((on?'new':'old (FLAMES off)')+': by day and by night, 1x, 2x and 4x',8,y);y+=6;
   const d=scene(false,on,1e7),n=scene(true,on,1e7);up(d,8,y,1);up(n,8,y+SH+4,1);up(d,8+SW+8,y,2);up(n,8+SW+8,y+2*SH+4,2);up(n,8+3*SW+16,y,4);y+=4*SH+14}
  label('the night scene 0.15 s apart (its flicker), 2x',8,y);y+=6;[0,150,300].forEach((ms,i)=>up(scene(true,true,1e7+ms),8+i*(2*SW+8),y,2));y+=2*SH+8;
  o.push('INFO sheet '+Wd+'x'+y+'; torches '+torch.length+', camp fire, two fire arrows, a blaze; pictures kept: '+t.FIRE_PICS.size+' flames, '+t.FIRE_GLOWS.size+' glows');
  const out=t.mkc(Wd,y,c=>c.drawImage(cv,0,0));o.push('IMG '+out.toDataURL('image/png'));
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 finally{F.on=on0;G.clock=clock;window.idleLife=life0;performance.now=now0;setB(B0)}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
