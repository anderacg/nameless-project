'use strict';
/* ---------- rendering ---------- */
// x, y: the leader's feet on screen; dir: which way the host faces; seed keeps each follower's place steady
// (race: the host's people; band: a bandit band, hooded and ragged. Every follower stands as tall as the leader: people.js)
function drawHost(n,col,x,y,dir,moving,seed,race,band){
  const k=hostSize(n);if(!k)return;const pts=[];
  for(let i=0;i<k;i++){const row=Math.floor(i/3),c=i%3,j=hash(i,seed|0,7);pts.push([x-dir*(8+row*6+(c===1?3:0))+Math.round(j*2-1),y-3+(c-1)*4+(row%2),i])}
  pts.sort((a,b)=>a[1]-b[1]);const t=performance.now();
  for(const [px,py,i] of pts){const f=moving?Math.floor(t/170+i*.7)%2:0,s=followerSprite(col,f,(i+(seed|0))%6,race,band);ctx.save();ctx.translate(Math.round(px),Math.round(py));if(dir<0)ctx.scale(-1,1);ctx.drawImage(s,-8,-14);ctx.restore()}
  if(n>=30){const bx=Math.round(x-dir*(11+Math.floor((k-1)/3)*5)),by=y-4;rect(ctx,'#5a3a20',bx,by-14,1,12);rect(ctx,col,bx+(dir>0?-5:1),by-14,5,4);rect(ctx,shade(col,.7),bx+(dir>0?-5:1),by-11,5,1)}
}
// (an animal's step on the map, ms a frame)
const D_STEP=150;
// the tile grid over the view: a line along every tile edge from (x0, y0) for w by h world pixels, drawn offset by (ox, oy),
// px thick (one screen pixel whatever the zoom)
function drawGrid(x0,y0,w,h,ox,oy,px){
  ctx.fillStyle='rgba(12,10,8,.3)';
  for(let x=Math.ceil(x0/TILE)*TILE;x<x0+w;x+=TILE)ctx.fillRect(x-ox,y0-oy,px,h);
  for(let y=Math.ceil(y0/TILE)*TILE;y<y0+h;y+=TILE)ctx.fillRect(x0-ox,y-oy,w,px);
}
// how dark it is (0 day … 1 night): dusk over the first tenth of the night, full dark, then dawn over its last tenth
// a picture redrawn once at the size it is shown, so the screen never scales it (true pixels); kept until the source changes
function atSize(c,w,h){if(c._at&&c._at.width===w&&c._at.height===h)return c._at;return c._at=mkc(w,h,g=>g.drawImage(c,0,0,w,h))}
function darkness(){const t=G.clock/DAY;if(t<NIGHT_AT)return 0;const n=(t-NIGHT_AT)/(1-NIGHT_AT);return n<.2?n/.2:n>.8?(1-n)/.2:1}
const timeOfDay=()=>{const t=G.clock/DAY;return t<.08?'Dawn':t<.3?'Morning':t<.45?'Midday':t<NIGHT_AT?'Afternoon':t<NIGHT_AT+.08?'Dusk':t<.92?'Night':'Before dawn'};
// which way a lord, band or beast faces: the way it is going; standing still, the way it last went (at first, toward you); in a
// fight, toward its foe (fights.js sets dir). Kept per mover between frames, not saved
const FACE=new WeakMap();
// lights in the dark (torches): {x, y, r} in screen pixels, queued while drawing and lit over the night
let LIGHTQ=[];
// the scene of buildings, camps and sites, before anyone is drawn over it: what you remember of the land outside your sight
let MEM=null;const memCv=()=>MEM&&MEM.width===VW&&MEM.height===VH?MEM:(MEM=mkc(VW,VH,()=>{}));
const faceDir=o=>{let f=FACE.get(o);if(!f)FACE.set(o,f={x:o.x,d:o.x>P.x?-1:1});if(Math.abs(o.x-f.x)>.05){f.d=o.x>f.x?1:-1;f.x=o.x}return o.fight&&o.dir?o.dir:f.d};
function drawWorld(){
  reveal();const V=vis(),cam=G.cam;cam.x=Math.round(clamp(P.x-VW/2,0,MW*TILE-VW));cam.y=Math.round(clamp(P.y-VH/2,0,MH*TILE-VH));
  ctx.drawImage(worldCv(),cam.x,cam.y,VW,VH,0,0,VW,VH);
  drawEnv(cam,V,0);drawLand(cam);drawEstates(cam,V);
  const ents=[];
  W.sites.forEach(s=>{if(siteKnown(s))ents.push({st:true,y:s.y,f:()=>{const sx=Math.round(s.x-cam.x),sy=Math.round(s.y-cam.y);if(s.patch)ctx.drawImage(groundPatch(climAt(s.x,s.y)),sx-15,sy-4);if(s.cleared)ctx.globalAlpha=.5;const sp=siteSprite(s);ctx.drawImage(sp,sx-sp.ax,sy+8-sp.ay);if(sp.fire&&!s.cleared)drawFire(sx-sp.ax+sp.fire[0],sy+8-sp.ay+sp.fire[1],s.seed);if(sp.flag&&!s.cleared)drawFlag(s.flagCol(),sx-sp.ax+sp.flag[0],sy+8-sp.ay+sp.flag[1],s.seed);ctx.globalAlpha=1;
    if(Math.hypot(s.x-P.x,s.y-P.y)<70)txt(s.name,sx,sy+12,s.cleared?'#9a958a':'#e4e0cf','center')}})});
  // the holdings are drawn as their placed buildings (lotEnts, called with the estates below)
  drawParties(ents,cam,V);// lords, bands, patrols and your companions' parties (each party says how it looks: parties.js)
  W.monsters.forEach(m=>{const M=MONSTERS[m.id],Y=M.mythic;if(Math.hypot(m.x-P.x,m.y-P.y)<V*(Y?1.6:hiddenAt(m.x,m.y)?.45:1))ents.push({y:m.y+(Y&&Y.fly?30:0),f:()=>{
    const s=unitSprite(M.unit,1,false),w=s.width,h=s.ch,sx=Math.round(m.x-cam.x),sy=Math.round(m.y-cam.y),lift=Y&&Y.fly?6-Math.round(Math.sin(performance.now()/260)*2):0;
    ctx.fillStyle='rgba(0,0,0,.3)';if(Y)ctx.fillRect(sx-8,sy-1,16,3);else ctx.fillRect(sx-5,sy-1,10,2);
    ctx.save();ctx.translate(sx,sy-lift);if(Y?m.dir<0:faceDir(m)<0)ctx.scale(-1,1);ctx.drawImage(s,-(w>>1),-s.height+2);ctx.restore();
    if(!Y)txt((m.n>1?m.n+' ':'')+'Lv'+m.lv,sx,sy-h,STANCE_COL[M.aggro||stance(monPower(m))==='afraid'?stance(monPower(m)):'wary'],'center')}})});
  // (a herd: up to three of its animals, behind and beside the first, each stepping as they go (critters.js critterSprite))
  // (a pasture's herd, only to be seen: one animal on each worked field tile, grazing to and fro on it)
  W.critters.forEach(c=>{if(!c.decor||Math.hypot(c.x-P.x,c.y-P.y)>V)return;const F=fieldsOf(townBy(c.home),'pasture');if(!F)return;
    F.tiles.slice(0,c.n).forEach(([tx,ty],i)=>{const y=ty*TILE+TILE-3;ents.push({y,f:()=>{const now=performance.now(),ph=now/2600+i*1.9+tx,mv=Math.cos(ph),fr=Math.abs(mv)>.6?Math.floor(now/D_STEP+i)%2:0,
      a=critterSprite(c.id,fr,true),x=Math.round(tx*TILE+TILE/2+Math.sin(ph)*3-cam.x),sy=Math.round(y-cam.y),w=Math.max(4,a.cw-2);
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x-(w>>1),sy-1,w,2);ctx.save();ctx.translate(x,sy);if(mv<0)ctx.scale(-1,1);ctx.drawImage(a,-(a.width>>1),-a.height+1);ctx.restore()}})})});
  W.critters.forEach(c=>{if(c.decor&&fieldsOf(townBy(c.home),'pasture'))return;if(Math.hypot(c.x-P.x,c.y-P.y)<V*(hiddenAt(c.x,c.y)?.45:1))ents.push({y:c.y,f:()=>{const s=critterSprite(c.id),sx=Math.round(c.x-cam.x),sy=Math.round(c.y-cam.y),now=performance.now(),k=Math.min(3,c.n||1),sp=Math.max(4,Math.round(s.cw*.55));
    for(let i=k-1;i>=0;i--){const ox=i===0?0:i===1?-sp:Math.round(sp*.4),oy=i===0?0:i===1?-2:-4,fr=c.idle?0:Math.floor(now/(D_STEP)+c.x+i)%2,a=critterSprite(c.id,fr),w=Math.max(4,a.cw-2);
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(sx+(c.dir<0?-ox:ox)-(w>>1),sy+oy-1,w,2);
      ctx.save();ctx.translate(sx+(c.dir<0?-ox:ox),sy+oy);if(c.dir<0)ctx.scale(-1,1);ctx.drawImage(a,-(a.width>>1),-a.height+1);ctx.restore()}
    if(c.n>1&&!c.decor&&Math.hypot(c.x-P.x,c.y-P.y)<90)txt(String(c.n),sx,sy-s.ch-1,CRITTERS[c.id].live?'#e8d8a0':'#c8e0a0','center')}})});
  if(P.raid)ents.push({y:P.y-1,f:()=>txt('Raiding '+Math.round(P.raid.t/RAID_TIME*100)+'%',Math.round(P.x-cam.x),Math.round(P.y-20-cam.y),'#ff9a90','center')});
  if(P.siege)ents.push({y:P.y-1,f:()=>{const s=campSprite(77,'bandit'),X=Math.round(P.x-24-s.ax-cam.x),Y=Math.round(P.y+2-s.ay-cam.y);ctx.drawImage(s,X,Y);drawFire(X+s.fire[0],Y+s.fire[1],0);drawFlag(FACS.player.col,X+s.flag[0],Y+s.flag[1],0);txt('Siege day '+P.siege.days,Math.round(P.x-cam.x),Math.round(P.y-18-cam.y),'#e8b94a','center')}});
  if(!P.stay)ents.push({y:P.y,f:()=>{const sx=Math.round(P.x-cam.x),sy=Math.round(P.y-cam.y);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(sx-5,sy-1,10,2);drawHost(partySize(),'#3d74d6',sx,sy+2,P.dir,P.tx!=null,5,P.race);ctx.save();ctx.translate(sx,sy-10);ctx.scale(P.dir,1);ctx.drawImage(partySprite('#e8b94a',mountDef()?mountDef().col:'',P.tx!=null?Math.floor(performance.now()/150)%2:0),-8,P.tx!=null?-3-Math.floor(performance.now()/150)%2:-3);ctx.restore()}});
  drawFolk(ents,cam,V);drawCaravans(ents,cam,V);drawShips(ents,cam,V);drawRefugees(ents,cam,V);drawFights(ents,cam,V);
  // buildings, camps and sites first (in their own order), then every character over them, then all their labels on top
  TXTQ=[];TXTQ.ctx=ctx;LIGHTQ=[];const bents=[];estateEnts(bents,cam,V);for(const e of ents.filter(e=>e.st))bents.push(e);
  bents.sort((a,b)=>a.y-b.y).forEach(e=>e.f());
  // fog of war: keep the scene of structures, draw everyone, then put the remembered scene back over all but your sight, so
  // nothing that moves shows outside it; labels likewise (a place's, where you know the land; anyone's, only in your sight)
  {const mg=memCv().getContext('2d');mg.clearRect(0,0,VW,VH);mg.drawImage(cv,0,0)}const nPlace=TXTQ.length,px0=P.x-cam.x,py0=P.y-cam.y;
  ents.filter(e=>!e.st).sort((a,b)=>a.y-b.y).forEach(e=>e.f());
  ctx.save();ctx.beginPath();ctx.rect(0,0,VW,VH);ctx.arc(px0,py0,V,0,Math.PI*2,true);ctx.clip('evenodd');ctx.drawImage(memCv(),0,0);ctx.restore();
  const q=TXTQ;TXTQ=null;q.forEach((a,i)=>{const wx=a[1]+cam.x,wy=a[2]+cam.y;if(i<nPlace?seenAt(wx,wy+6):inSight(wx,wy+8))txt(...a)});
  drawEnv(cam,V,1);
  drawQuestMarks(cam);
  if(P.tx!=null){const sx=Math.round(P.tx-cam.x),sy=Math.round(P.ty-cam.y);ctx.strokeStyle='#e8b94a';ctx.lineWidth=1;ctx.strokeRect(sx-3.5,sy-3.5,7,7)}
  // fog and night
  // the land you remember, outside your sight, lies dim; land you have never seen is dark
  const px=P.x-cam.x,py=P.y-cam.y,gr=ctx.createRadialGradient(px,py,V*.82,px,py,V);gr.addColorStop(0,'rgba(5,8,20,0)');gr.addColorStop(1,'rgba(5,8,20,.5)');ctx.fillStyle=gr;ctx.fillRect(0,0,VW,VH);
  drawDark(cam);
  // the tile grid and a building being placed lie over the fog
  if(GRID.on||G.place)drawGrid(cam.x,cam.y,VW,VH,cam.x,cam.y,1);
  if(G.place)drawPlace(cam);
  const a=darkness();
  if(a>0){ctx.fillStyle='rgba(10,14,50,'+(a*.34).toFixed(3)+')';ctx.fillRect(0,0,VW,VH)}
  // torchlight: a warm glow over the dark, and the flame itself, flickering
  {const now=performance.now();for(const L of LIGHTQ){if(!inSight(L.x+cam.x,L.y+cam.y))continue;const r=L.r*(1+.06*Math.sin(now/90+L.x)),g=ctx.createRadialGradient(L.x,L.y,1,L.x,L.y,r);g.addColorStop(0,'rgba(255,190,90,'+(.12+.28*a).toFixed(3)+')');g.addColorStop(1,'rgba(255,150,60,0)');
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(L.x-r,L.y-r,2*r,2*r);ctx.restore();const f=Math.floor(now/120+L.x)%2;rect(ctx,'#e8803a',L.x-1+f,L.y-2,2,2);rect(ctx,'#ffe090',L.x,L.y-1-f,1,1)}}
  // minimap
  const MS=112/MW,mw=Math.round(MW*MS),mh=Math.round(MH*MS),mx=VW-mw-6,my=6,dot=(x,y,col,s)=>rect(ctx,col,mx+Math.floor(x/TILE*MS)-(s>>1),my+Math.floor(y/TILE*MS)-(s>>1),s,s);
  ctx.fillStyle='#000';ctx.fillRect(mx-1,my-1,mw+2,mh+2);ctx.drawImage(atSize(miniCv,mw,mh),mx,my);ctx.globalAlpha=.4;ctx.drawImage(atSize(landMiniCv(),mw,mh),mx,my);ctx.globalAlpha=1;ctx.drawImage(atSize(fogMiniCv(),mw,mh),mx,my);
  TOWNS.forEach(tw=>{if(seenTile(tw.tx,tw.ty))dot(tw.x,tw.y,tw._memCol||facCol(tw),3)});
  W.lords.forEach(l=>{if(!l.dead&&!l.inside&&Math.hypot(l.x-P.x,l.y-P.y)<V)dot(l.x,l.y,FACS[l.fac].col,1)});
  (W.caravans||[]).forEach(c=>{if(Math.hypot(c.x-P.x,c.y-P.y)<V)dot(c.x,c.y,'#e8d8a0',1)});
  W.sites.forEach(s=>{if(siteKnown(s))dot(s.x,s.y,s.cleared?'#555':s.T.col,2)});
  W.monsters.forEach(m=>{const Y=MONSTERS[m.id].mythic;if(Math.hypot(m.x-P.x,m.y-P.y)<V)dot(m.x,m.y,Y?'#ff7a30':'#c58af0',Y?2:1)});
  bandits.forEach(b=>{if(Math.hypot(b.x-P.x,b.y-P.y)<V)dot(b.x,b.y,'#ff6a60',1)});
  (W.patrols||[]).forEach(p=>{if(Math.hypot(p.x-P.x,p.y-P.y)<V)dot(p.x,p.y,p.fac==='player'?FACS.player.col:FACS[p.fac].col,1)});
  P.quests.forEach(q=>{const g=questGoal(q);if(g)dot(g.x,g.y,'#ffe040',2)});
  dot(P.x,P.y,'#fff',3);
}
// how long a unit holds its attack pose after it strikes
const ATK_ANIM=.36;
// every party in sight, one way: its host of soldiers, its leader's figure (a rider, a bandit), a torch on a night watch, its label
function drawParties(ents,cam,V){
  for(const o of W.parties){if(!o.inView(V))continue;
    ents.push({y:o.y,f:()=>{const L=o.look(),sx=Math.round(o.x-cam.x),sy=Math.round(o.y-10-cam.y),fd=L.dir<0?-1:1,fr=L.moving?Math.floor(performance.now()/(L.bandit?160:170))%2:0;
      drawHost(o.size,L.col,sx,sy+12,fd,L.moving,L.seed,L.race,L.bandit);ctx.save();ctx.translate(sx,sy);if(fd<0)ctx.scale(-1,1);ctx.drawImage(L.bandit?banditSprite(fr):partySprite(L.col,L.rider==='horse'?C.horse:'',fr),-8,-3);ctx.restore();
      if(L.torch){const tx=sx+fd*6,ty=sy-4;rect(ctx,'#5a3e24',tx,ty,1,5);LIGHTQ.push({x:tx,y:ty-1,r:20})}
      if(!o.fight&&L.label)txt(L.label,sx,sy-2,L.labelCol,'center')}})}
}
function drawUnit(u){
  // (placed on the camera's pixels, not the field's: zoomed in, they glide instead of stepping)
  const q=B.cam?B.cam.z:1,big=u.s.big?2:1,s=unitSprite(u.type,u.team,u.hero,u.v),w=s.width,h=s.ch,x=Math.round(u.x*q)/q,y=Math.round(u.y*q)/q;
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(x,y,5.5*big,1.8*big,0,0,6.283);ctx.fill();// (a soft shadow)
  const z=Math.round(u.z||0),ghost=u.hero&&B.hx&&B.hx.inv>0;
  if(u.buffT>0){ctx.fillStyle='rgba(232,185,74,.35)';ctx.fillRect(x-6,y-2,12,3)}
  const hit=u.hitAt!=null&&B.t-u.hitAt<.09;
  // (moving: a step in the last few frames, so a man who stops and starts as he settles does not flicker between standing and walking)
  {const step=u.plx!=null&&Math.hypot(u.x-u.plx,u.y-u.ply)>.02;u.plx=u.x;u.ply=u.y;u.movF=step?6:Math.max(0,(u.movF||0)-(B.paused?0:1));const moved=u.movF>0;const beast=!!(ST[u.type]&&ST[u.type].beast),pose=beast?0:procPose(u,moved),sp=beast?(pose?unitSprite(u.type,u.team,u.hero,u.v,pose):s):unitSprite(u.type,u.team,u.hero,u.v,pose,true,!!u.inMelee);
    let bx=0,bo=0;if(beast){if(moved)bo=-(Math.floor(B.t*8+(u.v||0))%2);if(u.atkAt!=null&&B.t-u.atkAt<ATK_ANIM)bx=Math.round(3*Math.sin((B.t-u.atkAt)/ATK_ANIM*Math.PI))}
    ctx.save();ctx.translate(x,y-z+bo);if(u.face<0)ctx.scale(-1,1);if(ghost)ctx.globalAlpha=.55;ctx.drawImage(hit?whiteOf(sp):sp,-Math.floor(sp.width/2)+bx,-sp.height+2);if(!beast)drawHeld(u,u.inMelee?sidearmLook(u):unitLook(u),sp,-Math.floor(sp.width/2)+bx,-sp.height+2,hit);ctx.restore()}// (his weapon in his hand: weapons.js)
  drawStuck(u,x,y-Math.round(u.z||0));// (arrows in him: vfx.js)
  if(u.buffT>0&&Math.random()<.06)vfx({k:'ember',x:u.x+rnd(-4,4),y:u.y-rnd(2,12),vx:rnd(-4,4),vy:-rnd(10,25),life:rnd(.4,.7),col:'#ffd25a'});// (inspired: golden sparks)
  if(u.stun>0)txt('*',x+(Math.floor(performance.now()/120)%2?3:-3),y-h-z-2,'#ffe08a','center');
  drawMorale(u,x,y-h-z-3);// (running or wavering: morale.js)
  // its health: over every fighter with health bars on (Settings, or HP bars in battle), else over you and your companions
  if(u.leader)txt(u.leader.name+' Lv'+u.leader.lv,x,y-h-8-z,u.team?'#ff9a90':'#9fc0ff','center');// a leader: his name over him
  if(HPBARS.on||u.hero||u.comp||u.leader){const bw=u.s.big?28:12,f=Math.max(0,u.hp/u.max),bx=Math.round(x-bw/2),by=y-h-2-z;ctx.fillStyle='#0a0c12';ctx.fillRect(bx-1,by-1,bw+2,4);ctx.fillStyle='#3a2420';ctx.fillRect(bx,by,bw,2);
    ctx.fillStyle=u.hero||u.comp?'#e8b94a':u.team?'#e0605a':'#78c474';ctx.fillRect(bx,by,Math.round(bw*f),2)}
}
// an attack's trail by its shape: a sweeping crescent, a darting streak, a chop and its shockwave, a full circle, claw marks
function drawSlash(s){
  const p=1-s.life/(s.max||.2),fade=Math.min(1,s.life/(s.max||.2)*1.6),col=s.col||'255,255,255',st=a=>'rgba('+col+','+Math.max(0,a).toFixed(2)+')';
  ctx.save();ctx.lineCap='round';
  if(s.kind==='arc'||s.kind==='spin'){const span=s.kind==='spin'?Math.PI*2:2*s.arc,q=Math.min(1,p*2.4),a0=s.kind==='spin'?s.a:s.a-s.dir*s.arc,a1=a0+s.dir*span*q,tail=Math.max(0,q-.55)*span;
    const lo=Math.min(a0+s.dir*tail,a1),hi=Math.max(a0+s.dir*tail,a1);
    for(let k=0;k<3;k++){ctx.strokeStyle=st(fade*(1-k*.3));ctx.lineWidth=Math.max(1,(s.w||3)-k);ctx.beginPath();ctx.arc(s.x,s.y,s.r-k*2,lo,hi);ctx.stroke()}
    if(s.kind==='spin'){ctx.strokeStyle=st(fade*.4);ctx.lineWidth=1;ctx.beginPath();ctx.arc(s.x,s.y,s.r*.6,0,7);ctx.stroke()}}
  else if(s.kind==='thrust'||s.kind==='twin'){for(const o of s.kind==='twin'?[-.28,.28]:[0]){const a=s.a+o,ext=s.r*Math.min(1,p*3.2),c=Math.cos(a),sn=Math.sin(a),x0=s.x+c*4,y0=s.y+sn*4,x1=s.x+c*ext,y1=s.y+sn*ext;
      ctx.strokeStyle=st(fade);ctx.lineWidth=s.w||2;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
      ctx.fillStyle=st(fade);ctx.beginPath();ctx.moveTo(x1+c*4,y1+sn*4);ctx.lineTo(x1-sn*2.5,y1+c*2.5);ctx.lineTo(x1+sn*2.5,y1-c*2.5);ctx.fill();
      ctx.strokeStyle=st(fade*.45);ctx.lineWidth=1;for(const k of [-3,3]){ctx.beginPath();ctx.moveTo(x0-sn*k+c*ext*.3,y0+c*k+sn*ext*.3);ctx.lineTo(x1-sn*k-c*4,y1+c*k-sn*4);ctx.stroke()}}}
  else if(s.kind==='slam'){const cx=s.x+Math.cos(s.a)*s.r*.6,cy=s.y+6+Math.sin(s.a)*s.r*.6;
    if(p<.3){ctx.strokeStyle=st(1);ctx.lineWidth=s.w||3;ctx.beginPath();ctx.moveTo(cx,cy-20+p/.3*14);ctx.lineTo(cx,cy-4);ctx.stroke()}
    else{const q=(p-.3)/.7;ctx.strokeStyle=st((1-q)*.9);ctx.lineWidth=Math.max(1,(s.w||3)-1);ctx.beginPath();ctx.ellipse(cx,cy,s.area*q+2,(s.area*q+2)*.5,0,0,7);ctx.stroke();
      ctx.strokeStyle='rgba(60,44,30,'+((1-q)*.8).toFixed(2)+')';ctx.lineWidth=1;for(let k=0;k<5;k++){const a=k*1.26+s.a,l=s.area*.6;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*l,cy+Math.sin(a)*l*.5);ctx.stroke()}}}
  else if(s.kind==='claw'){ctx.strokeStyle=st(fade);ctx.lineWidth=1;const c=Math.cos(s.a+.8),sn=Math.sin(s.a+.8);for(const k of [-3,0,3]){ctx.beginPath();ctx.moveTo(s.x-c*5-sn*k,s.y-sn*5+c*k);ctx.lineTo(s.x+c*5-sn*k,s.y+sn*5+c*k);ctx.stroke()}}
  ctx.restore();
}
function drawBattle(){
  warmStep();// (sprites made ahead before they are needed: sprites.js)
  // the camera (camera.js): the field drawn at its zoom and pan, the HUD over it at the screen's scale
  if(B.cam)camTick();const Cz=B.cam?B.cam.z:1;ctx.fillStyle='#07090e';ctx.fillRect(0,0,BVW,BVH);ctx.save();if(B.cam){ctx.scale(Cz,Cz);ctx.translate(-Math.round(B.cam.x*Cz)/Cz,-Math.round(B.cam.y*Cz)/Cz)}
  ctx.drawImage(B.arena,0,0);{const t=fieldTop()-FIELD_EDGE.body+6,b=fieldBot()+4;ctx.fillStyle='rgba(8,10,16,.35)';if(t>0)ctx.fillRect(0,0,BW,t);if(b<BH)ctx.fillRect(0,b,BW,BH-b);ctx.fillStyle='rgba(232,224,200,.18)';if(t>0)ctx.fillRect(0,t,BW,1);if(b<BH)ctx.fillRect(0,b,BW,1)}// (the field's edges in sight: battle.js fieldTop)
  if(!B.deploy)drawExit();drawDeploy();// (the withdrawal edge: morale.js; the deployment zone: deploy.js)
  drawCorpses();vfxGround();// (the fallen and their blood; dust, shockwaves: vfx.js)
  for(const g of GRPS){const gr=B.groups[g];if((gr.order!=='hold'&&gr.order!=='advance')||!grpUnits(g).length)continue;
    const fx_=Math.round(gr.ax),fy=Math.round(gr.ay);rect(ctx,C.wood,fx_,fy-14,1,14);rect(ctx,C.team[0],fx_+1,fy-14,6,4);rect(ctx,'#e4e0cf',fx_+3,fy-13,2,2)}
  // your selection underlined; the box you drag; where you last sent them (a ring), or whom you set them on (red)
  drawFireRange();drawSelection();drawOrderLines();// (shooters' reach and line of fire: battlehud.js)
  drawFormGhost();// (a line being dragged: formations.js)
  if(B.box){const b=B.box;ctx.strokeStyle='#e8b94a';ctx.lineWidth=1;ctx.strokeRect(Math.min(b.x0,b.x1)+.5,Math.min(b.y0,b.y1)+.5,Math.abs(b.x1-b.x0),Math.abs(b.y1-b.y0))}
  if(B.mark&&B.mark.t>0){const m=B.mark;ctx.strokeStyle=m.foe?'#ff6a5a':'#e8b94a';ctx.globalAlpha=Math.min(1,m.t*2);ctx.beginPath();ctx.ellipse(m.x,m.y,8*(1.4-m.t*.5),4*(1.4-m.t*.5),0,0,7);ctx.stroke();ctx.globalAlpha=1;m.t-=1/60}
  [...B.obs,...B.units.filter(u=>u.hp>0)].sort((a,b)=>a.y-b.y).forEach(o=>o.kind?(sp=>ctx.drawImage(sp,Math.round(o.x)-(sp.width>>1),Math.round(o.y)+4-sp.height))(obstacleSprite(o.kind,B.env.c)):drawUnit(o));
  for(const a of B.arrows){if(a.arc){const z=Math.max(0,a.z),ang=Math.atan2(a.vy-a.vz,a.vx),sc=Math.min(1,z/50);
      ctx.fillStyle='rgba(0,0,0,'+(.35-sc*.2).toFixed(2)+')';ctx.fillRect(Math.round(a.x-2),Math.round(a.y),4,1);
      ctx.save();ctx.translate(Math.round(a.x),Math.round(a.y-4-z));ctx.rotate(ang);ctx.fillStyle='#e8e4d0';ctx.fillRect(-4,0,7,1);ctx.fillStyle='#c9ced8';ctx.fillRect(3,0,2,1);ctx.fillStyle='#d8d0c0';ctx.fillRect(-5,-1,2,1);ctx.fillRect(-5,1,2,1);ctx.restore();continue}
    if(a.magic){if(Math.random()<.6)vfx({k:'ember',x:a.x+rnd(-2,2),y:a.y+rnd(-2,2),vx:rnd(-12,12),vy:rnd(-12,6),life:rnd(.2,.4),col:a.col});const fl=Math.floor(performance.now()/80)%2;ctx.fillStyle=a.col;ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(a.x,a.y,5+fl,0,7);ctx.fill();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(a.x,a.y,2.5,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(Math.round(a.x)-1,Math.round(a.y)-1,2,2);continue}ctx.save();ctx.translate(Math.round(a.x),Math.round(a.y));ctx.rotate(a.a);ctx.fillStyle='#e8e4d0';ctx.fillRect(-4,0,7,1);ctx.fillStyle='#c9ced8';ctx.fillRect(3,0,2,1);ctx.restore()}
  const h=B.hero;
  if(h&&h.hp>0){
    if(B.blocking){ctx.strokeStyle='#9fc0ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(h.x,h.y-6,13,B.aim-.9,B.aim+.9);ctx.stroke()}
    ctx.strokeStyle='rgba(232,185,74,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(h.x,h.y-6,h.s.reach+5,B.aim-.25,B.aim+.25);ctx.stroke();
  }
  for(const s of B.slashes){if(s.kind){drawSlash(s);continue}ctx.strokeStyle='rgba('+(s.col||'255,255,255')+','+Math.min(1,s.life*7).toFixed(2)+')';ctx.lineWidth=s.w||3;ctx.beginPath();ctx.arc(s.x,s.y,s.r||B.hero.s.reach,s.a-(s.arc||1.1),s.a+(s.arc||1.1));ctx.stroke()}
  for(const r of B.rings){const p=1-r.life/r.max;ctx.strokeStyle='rgba('+r.col+','+(r.life/r.max).toFixed(2)+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(r.x,r.y,r.r*(.5+.5*p),0,6.283);ctx.stroke()}
  for(const p of B.parts){if(p.stuck){const x=Math.round(p.x),y=Math.round(p.y);ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle='#c9b48a';ctx.fillRect(x-p.stuck,y-3,1,2);ctx.fillRect(x-2*p.stuck,y-5,1,2);ctx.fillStyle='#e8e4d0';ctx.fillRect(x-3*p.stuck,y-6,1,1);ctx.globalAlpha=1;continue}
    ctx.fillStyle=p.c;ctx.fillRect(Math.round(p.x),Math.round(p.y),2,2)}
  vfxAir();// (sparks, glows, embers, flying blood: vfx.js)
  // (a number pops up big and settles)
  for(const f of B.floats){const a=f.age||0,k=a<.12?1+(1-a/.12)*.6:1;if(k===1){txt(f.t,Math.round(f.x),Math.round(f.y),f.c,'center');continue}ctx.save();ctx.translate(Math.round(f.x),Math.round(f.y));ctx.scale(k,k);txt(f.t,0,0,f.c,'center');ctx.restore()}
  ctx.restore();
  drawUnitIcons();// (each group's type, health, morale and weaknesses, over it, the same size at any zoom: morale.js)
  // the HUD at the screen's scale over the zoomed-out field
  ctx.save();ctx.scale(BVW/VW,BVH/VH);
  drawHeroHud();drawMiniField();// (the small map of the field, top right: camera.js)
  if(B.over){txt(B.retreat?'WITHDRAWN':B.win?'VICTORY':'DEFEAT',VW/2,VH/2,B.win?'#e8b94a':B.retreat?'#6fa8e0':'#e0605a','center')}
  ctx.restore();
}
function frame(){
  {const sc=document.getElementById('screen');if(sc&&sc.dataset.mode!==G.mode){sc.dataset.mode=G.mode;updateHint();hideTip()}}
  const bat=B&&(G.mode==='battle'||G.mode==='esc'&&G.esc&&G.esc.mode==='battle');setRes(bat?BVW:VW,bat?BVH:VH);// (a battle: the field's height, the screen's shape: core.js)
  ctx.save();
  if(G.shake>0)ctx.translate(Math.round((Math.random()-.5)*G.shake),Math.round((Math.random()-.5)*G.shake));
  if(bat)drawBattle();
  else if(G.scene&&(G.mode==='scene'||G.mode==='town'&&G.town&&G.town.inScene||G.mode==='esc'&&G.esc&&(G.esc.mode==='scene'||G.esc.mode==='town'&&G.town&&G.town.inScene)))drawScene();
  else if(G.mode==='title'){ctx.fillStyle='#0b0d14';ctx.fillRect(0,0,VW,VH);drawWorld()}
  else drawWorld();
  ctx.restore();
}
// your party, top left: the day, your level, health, stamina and mana as bars, then what you have; what runs short is red
// the party card (top left): your hero (portrait, name, level), health, stamina and mana, your band's gold, food, troops, power,
// morale and pace as icon chips, then where you are and whom you serve; the top bar: the day and the time
function updateHUD(force){
  stayBanner();const el=$('#stats');if(!el)return;const cnt=partySize(),cap=partyCap(),eat=eatPerDay(),m=vitals(),fd=foodN(),days=Math.floor(fd/Math.max(1,eat));
  const bar=(v,mx,c,lab)=>'<div class="bar" title="'+lab+'"><i style="width:'+Math.max(0,Math.min(100,Math.round(v/mx*100)))+'%;background:'+c+'"></i><em'+(v<mx*.3?' class="low"':'')+'>'+lab+' '+Math.round(v)+'/'+mx+'</em></div>';
  const chip=(ic,val,title,warn,cls)=>'<span class="chip'+(warn?' warn':'')+'" title="'+title+'">'+icon(ic,14)+'<span'+(cls?' class="'+cls+'"':'')+'>'+val+'</span></span>';
  const frost=climAt(P.x,P.y)==='frost'&&!RACES[P.race].home.includes('frost'),furNeed=Math.ceil((cnt+1)/5),lh=landHold(P.x,P.y),sp=bandPace();
  el.innerHTML='<div class="pc-head"><img class="pc-pic" src="'+portrait('hero',true)+'" alt=""><div class="pc-who"><b>'+RACES[P.race].n+' '+(BGS[P.bg]?BGS[P.bg].n:'')+'</b><small>Level '+P.level+' · '+rankName()+'</small></div>'+
      (P.tp?'<span class="pc-pts" title="Talent points to spend (K)">+'+P.tp+'</span>':'')+'</div>'+
    '<div class="bars" title="Health · Stamina · Mana">'+bar(P.hp,m[0],'#c8503a','Health')+bar(P.sp,m[1],'#78c474','Stamina')+bar(P.mp,m[2],'#5a8fe8','Mana')+'</div>'+
    '<div class="pc-res">'+chip('gold',P.gold,'Gold',false,'gold')+chip('food',fd+'<small> '+days+'d</small>','Food: '+(FOODS.filter(g=>goodN(g)).map(g=>GOODS[g].n+' '+goodN(g)).join(', ')||'none')+' · about '+days+' days',days<2)+
      chip('troops',cnt+'<small>/'+cap+'</small>','Troops: '+cnt+' of '+cap)+chip('power',partyPower(),'Party power','', 'gold')+chip('morale',Math.round(P.morale),'Morale'+(bandNerve()!=null?' (your troops\u2019 nerve: '+Math.round(bandNerve())+', it drifts toward it)':''),P.morale<30)+
      chip('speed',sp.toFixed(1)+'×','Your band\u2019s pace before the ground: the slowest of you, its size, the wounded, mounts, Athletics or Riding, a Guide, Forced March',sp<.8)+
      (frost||goodN('furs')?chip('furs',goodN('furs')+(frost?'<small>/'+furNeed+'</small>':''),'Furs'+(frost?': '+furNeed+' needed in the frost':''),frost&&goodN('furs')<furNeed):'')+
      (prisonerCount()?chip('prisoners',prisonerCount(),'Prisoners'):'')+(woundedN()?chip('wounded',woundedN(),'Wounded, riding with you while they heal',true):'')+'</div>'+
    '<div class="pc-line" title="Where you are">'+icon('region',12)+'<span>'+regionAt(P.x,P.y).name+' · <span style="color:'+(lh?landCol(lh.owner):'#9a958a')+'">'+landName(P.x,P.y)+'</span></span></div>'+
    '<div class="pc-line" title="Renown and whom you serve">'+icon('renown',12)+'<span>'+P.renown+'</span>'+icon('banner',12)+'<span'+(P.fac?' style="color:'+FACS[P.fac].col+'"':'')+'>'+(P.fac?FACS[P.fac].n:'Independent')+'</span></div>';
  const d=$('#wday');if(d)d.innerHTML=icon(darkness()>.3?'moon':'sun',16)+'<span>Day '+G.day+' · '+timeOfDay()+'</span><b'+(G.paused?'':' class="off"')+'>Paused</b>';
}
// a short hint at the top of the screen for where you are (H shows every control)
function updateHint(){
  const h=$('#hint');if(!h)return;h.hidden=!GUIDE.on;// (guide texts off: no hint: ui.js)
  h.textContent=G.mode==='scene'?'WASD or click to walk · E talk · out of the gate to leave · H help':G.mode==='battle'?'':'Click to travel · hover for details · Space pause · H help';
}
// (a group holding: standing in its places, sent nowhere and set on no one. 'hold' is also the order a move gives, its men going
// to their new places, so the order alone would light Hold on nearly always)
function holding(g){const gr=B.groups[g],m=grpUnits(g);return !!gr&&gr.order==='hold'&&!gr.tgt&&!(gr.queue&&gr.queue.length)&&m.length>0&&m.filter(u=>u.slotted&&!u.spdNow).length>=m.length*.6}
function setOrderUI(){
  if(!B)return;const gs=selGroups().filter(g=>grpUnits(g).length),src=gs.length?gs:selGroups();
  document.querySelectorAll('[data-order]').forEach(b=>{const o=b.dataset.order;b.classList.toggle('on',o==='charge'?src.every(g=>!walking(B.groups[g])):o==='advance'?src.every(g=>walking(B.groups[g])):o==='hold'?src.every(holding):src.every(g=>B.groups[g].order===o))});
  // the formation buttons: lit when every selected group it suits stands in it; dimmed when it suits none of them
  document.querySelectorAll('[data-form]').forEach(b=>{const f=b.dataset.form,fit=src.filter(g=>formFits(g,f)),on=fit.length>0&&fit.every(g=>B.groups[g].form===f);b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));b.disabled=!fit.length});
  // (a shooters' flag dimmed when none of the selection shoots; lit when every one of them that does has it)
  document.querySelectorAll('[data-flag]').forEach(b=>{const f=b.dataset.flag,sh=SHOOT_FLAGS.includes(f),l=sh?src.filter(g=>grpUnits(g).some(u=>u.s.range)):src,on=l.length>0&&l.every(g=>B.groups[g][f]);b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));b.disabled=sh&&!l.length});
  // unit cards, the selected unit's details and the top bar (battlehud.js)
  document.querySelectorAll('[data-grp]').forEach(b=>bhudCard(b,b.dataset.grp));bhudInfo();bhudTop();
}
function setSpeed(n){G.speed=n;document.querySelectorAll('[data-speed]').forEach(b=>b.classList.toggle('on',+b.dataset.speed===n))}
function pauseUI(){const b=$('#pause');if(!b)return;b.innerHTML=icon(G.paused?'play':'pause',14);b.setAttribute('aria-label',G.paused?'Play':'Pause');b.classList.toggle('on',!!G.paused)}
function togglePause(){G.paused=!G.paused;pauseUI();updateHUD(true)}
