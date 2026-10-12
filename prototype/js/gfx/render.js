'use strict';
/* ---------- rendering ---------- */
// x, y: the leader's feet on screen; dir: which way the host faces; seed keeps each follower's place steady
function drawHost(n,col,x,y,dir,moving,seed){
  const k=hostSize(n);if(!k)return;const pts=[];
  for(let i=0;i<k;i++){const row=Math.floor(i/3),c=i%3,j=hash(i,seed|0,7);pts.push([x-dir*(7+row*5+(c===1?2:0))+Math.round(j*2-1),y-3+(c-1)*4+(row%2),i])}
  pts.sort((a,b)=>a[1]-b[1]);const t=performance.now();
  for(const [px,py,i] of pts){const f=moving?Math.floor(t/170+i*.7)%2:0,s=followerSprite(col,f);ctx.save();ctx.translate(Math.round(px),Math.round(py));if(dir<0)ctx.scale(-1,1);ctx.drawImage(s,-3,-9);ctx.restore()}
  if(n>=30){const bx=Math.round(x-dir*(11+Math.floor((k-1)/3)*5)),by=y-4;rect(ctx,'#5a3a20',bx,by-14,1,12);rect(ctx,col,bx+(dir>0?-5:1),by-14,5,4);rect(ctx,shade(col,.7),bx+(dir>0?-5:1),by-11,5,1)}
}
// how dark it is (0 day … 1 night): dusk over the first tenth of the night, full dark, then dawn over its last tenth
function darkness(){const t=G.clock/DAY;if(t<NIGHT_AT)return 0;const n=(t-NIGHT_AT)/(1-NIGHT_AT);return n<.2?n/.2:n>.8?(1-n)/.2:1}
const timeOfDay=()=>{const t=G.clock/DAY;return t<.08?'Dawn':t<.3?'Morning':t<.45?'Midday':t<NIGHT_AT?'Afternoon':t<NIGHT_AT+.08?'Dusk':t<.92?'Night':'Before dawn'};
function drawWorld(){
  const V=vis(),cam=G.cam;cam.x=Math.round(clamp(P.x-VW/2,0,MW*TILE-VW));cam.y=Math.round(clamp(P.y-VH/2,0,MH*TILE-VH));
  ctx.drawImage(worldCv(),cam.x,cam.y,VW,VH,0,0,VW,VH);
  drawEnv(cam,V,0);drawLand(cam);drawEstates(cam,V);
  const ents=[];
  CAMPS.forEach(c=>{if(!c.cleared)ents.push({y:c.y,f:()=>{ctx.drawImage(campSprite(CAMPS.indexOf(c)),Math.round(c.x-10-cam.x),Math.round(c.y-10-cam.y))}}); else ents.push({y:c.y,f:()=>{ctx.globalAlpha=.5;ctx.drawImage(campSprite(CAMPS.indexOf(c)),Math.round(c.x-10-cam.x),Math.round(c.y-10-cam.y));ctx.globalAlpha=1}})});
  W.sites.forEach(s=>{if(s.seen)ents.push({y:s.y,f:()=>{const sx=Math.round(s.x-cam.x),sy=Math.round(s.y-cam.y);ctx.drawImage(groundPatch(climAt(s.x,s.y)),sx-15,sy-4);if(s.cleared)ctx.globalAlpha=.5;const sp=siteSprite(s);ctx.drawImage(sp,sx-(sp.width>>1),sy+4-sp.height);ctx.globalAlpha=1;
    if(Math.hypot(s.x-P.x,s.y-P.y)<70)txt(s.name,sx,sy+12,s.cleared?'#9a958a':'#e4e0cf','center')}})});
  TOWNS.forEach(t=>ents.push({y:t.y,f:()=>{const s=holdingSprite(t),sx=Math.round(t.x-s.width/2-cam.x),sy=Math.round(t.y+8-s.height-cam.y);drawWall(t,sx,sy,s.width,s.height,false);ctx.drawImage(s,sx,sy);drawWall(t,sx,sy,s.width,s.height,true);txt(t.name,Math.round(t.x-cam.x),Math.round(t.y+18-cam.y),hostileTo(t.owner)?'#ff9a90':'#e4e0cf','center');
    if(besieged(t)&&Math.floor(performance.now()/400)%2)txt('!',Math.round(t.x-cam.x),sy-1,'#ff6a60','center')}}));
  W.lords.forEach(l=>{if(!l.dead&&Math.hypot(l.x-P.x,l.y-P.y)<V)ents.push({y:l.y,f:()=>{const sx=Math.round(l.x-cam.x),sy=Math.round(l.y-10-cam.y),c=FACS[l.fac].col;
    drawHost(l.troops.length,c,sx,sy+12,l.x>P.x?-1:1,!(l.state==='rest'||l.state==='siege'),l.id.length*31+l.name.length);ctx.save();ctx.translate(sx,sy);if(l.x>P.x)ctx.scale(-1,1);ctx.drawImage(partySprite(c,C.horse,l.state==='rest'||l.state==='siege'?0:Math.floor(performance.now()/170)%2),-7,-1);ctx.restore();txt(String(l.troops.length),sx,sy-2,hostileTo(l.fac)?STANCE_COL[stance(rating(l.troops))]:c,'center')}})});
  bandits.forEach(b=>{if(Math.hypot(b.x-P.x,b.y-P.y)<V*(hiddenAt(b.x,b.y)?.45:1))ents.push({y:b.y,f:()=>{const sx=Math.round(b.x-6-cam.x),sy=Math.round(b.y-10-cam.y),k=b.kind;drawHost(b.n,'#8a4a3a',sx+6,sy+12,b.x>P.x?-1:1,!b.idle,Math.round(b.x)%97);ctx.drawImage(banditSprite(b.idle?0:Math.floor(performance.now()/160)%2),sx-1,sy-1);txt(String(b.n),Math.round(b.x-cam.x),sy-2,STANCE_COL[stance(bandPower(b))],'center')}})});
  W.monsters.forEach(m=>{const M=MONSTERS[m.id],Y=M.mythic;if(Math.hypot(m.x-P.x,m.y-P.y)<V*(Y?1.6:hiddenAt(m.x,m.y)?.45:1))ents.push({y:m.y+(Y&&Y.fly?30:0),f:()=>{
    const s=unitSprite(M.unit,1,false),k=Math.min(1,(Y&&Y.mapH||16)/s.height),w=Math.round(s.width*k),h=Math.round(s.height*k),sx=Math.round(m.x-cam.x),sy=Math.round(m.y-cam.y),lift=Y&&Y.fly?6-Math.round(Math.sin(performance.now()/260)*2):0;
    ctx.fillStyle='rgba(0,0,0,.3)';if(Y)ctx.fillRect(sx-8,sy-1,16,3);else ctx.fillRect(sx-5,sy-1,10,2);
    ctx.save();ctx.translate(sx,sy-lift);if(Y?m.dir<0:m.x>P.x)ctx.scale(-1,1);ctx.drawImage(s,-Math.round(w/2),-h+2,w,h);ctx.restore();
    if(!Y)txt((m.n>1?m.n+' ':'')+'Lv'+m.lv,sx,sy-h,STANCE_COL[M.aggro||stance(monPower(m))==='afraid'?stance(monPower(m)):'wary'],'center')}})});
  W.critters.forEach(c=>{if(Math.hypot(c.x-P.x,c.y-P.y)<V*(hiddenAt(c.x,c.y)?.45:1))ents.push({y:c.y,f:()=>{const s=critterSprite(c.id),sx=Math.round(c.x-cam.x),sy=Math.round(c.y-cam.y);
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(sx-4,sy-1,8,2);
    ctx.save();ctx.translate(sx,sy);if(c.dir<0)ctx.scale(-1,1);ctx.drawImage(s,-7,-s.height+1-(c.idle?0:Math.floor(performance.now()/130+c.x)%2));ctx.restore();
    if(c.n>1&&Math.hypot(c.x-P.x,c.y-P.y)<90)txt(String(c.n),sx,sy-s.height-1,CRITTERS[c.id].live?'#e8d8a0':'#c8e0a0','center')}})});
  if(P.raid)ents.push({y:P.y-1,f:()=>txt('Raiding '+Math.round(P.raid.t/RAID_TIME*100)+'%',Math.round(P.x-cam.x),Math.round(P.y-20-cam.y),'#ff9a90','center')});
  if(P.siege)ents.push({y:P.y-1,f:()=>{ctx.drawImage(campSprite(77),Math.round(P.x-24-cam.x),Math.round(P.y-14-cam.y));txt('Siege day '+P.siege.days,Math.round(P.x-cam.x),Math.round(P.y-18-cam.y),'#e8b94a','center')}});
  ents.push({y:P.y,f:()=>{const sx=Math.round(P.x-cam.x),sy=Math.round(P.y-cam.y);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(sx-5,sy-1,10,2);drawHost(partySize(),'#3d74d6',sx,sy+2,P.dir,P.tx!=null,5);ctx.save();ctx.translate(sx,sy-10);ctx.scale(P.dir,1);ctx.drawImage(partySprite('#e8b94a',mountDef()?mountDef().col:'',P.tx!=null?Math.floor(performance.now()/150)%2:0),-7,P.tx!=null?-1-Math.floor(performance.now()/150)%2:-1);ctx.restore()}});
  drawFolk(ents,cam,V);drawCaravans(ents,cam,V);drawRefugees(ents,cam,V);
  ents.sort((a,b)=>a.y-b.y).forEach(e=>e.f());
  drawEnv(cam,V,1);
  drawQuestMarks(cam);
  if(P.tx!=null){const sx=Math.round(P.tx-cam.x),sy=Math.round(P.ty-cam.y);ctx.strokeStyle='#e8b94a';ctx.lineWidth=1;ctx.strokeRect(sx-3.5,sy-3.5,7,7)}
  // fog and night
  const px=P.x-cam.x,py=P.y-cam.y,gr=ctx.createRadialGradient(px,py,V*.75,px,py,V*1.9);gr.addColorStop(0,'rgba(5,8,20,0)');gr.addColorStop(1,'rgba(5,8,20,.55)');ctx.fillStyle=gr;ctx.fillRect(0,0,VW,VH);
  const a=darkness();
  if(a>0){ctx.fillStyle='rgba(10,14,50,'+(a*.34).toFixed(3)+')';ctx.fillRect(0,0,VW,VH)}
  // minimap
  const MS=112/MW,mw=Math.round(MW*MS),mh=Math.round(MH*MS),mx=VW-mw-6,my=6,dot=(x,y,col,s)=>rect(ctx,col,mx+Math.floor(x/TILE*MS)-(s>>1),my+Math.floor(y/TILE*MS)-(s>>1),s,s);
  ctx.fillStyle='#000';ctx.fillRect(mx-1,my-1,mw+2,mh+2);ctx.drawImage(miniCv,mx,my,mw,mh);ctx.globalAlpha=.4;ctx.drawImage(landMiniCv(),mx,my,mw,mh);ctx.globalAlpha=1;
  TOWNS.forEach(tw=>dot(tw.x,tw.y,facCol(tw),3));
  W.lords.forEach(l=>{if(!l.dead&&Math.hypot(l.x-P.x,l.y-P.y)<V*1.4)dot(l.x,l.y,FACS[l.fac].col,1)});
  CAMPS.forEach(c=>dot(c.x,c.y,c.cleared?'#555':'#e0605a',2));
  (W.caravans||[]).forEach(c=>{if(Math.hypot(c.x-P.x,c.y-P.y)<V*1.4)dot(c.x,c.y,'#e8d8a0',1)});
  W.sites.forEach(s=>{if(s.seen)dot(s.x,s.y,s.cleared?'#555':SITE_TYPES[s.type].col,2)});
  W.monsters.forEach(m=>{const Y=MONSTERS[m.id].mythic;if(Math.hypot(m.x-P.x,m.y-P.y)<V*(Y?2.2:1.4))dot(m.x,m.y,Y?'#ff7a30':'#c58af0',Y?2:1)});
  bandits.forEach(b=>{if(Math.hypot(b.x-P.x,b.y-P.y)<V*1.4)dot(b.x,b.y,'#ff6a60',1)});
  P.quests.forEach(q=>{const g=questGoal(q);if(g)dot(g.x,g.y,'#ffe040',2)});
  dot(P.x,P.y,'#fff',3);
  txt('Day '+G.day+' · '+timeOfDay(),6,14,'#e8b94a');
  if(G.paused)txt('PAUSED',VW/2,20,'#fff','center');
}
// how long a unit holds its attack pose after it strikes
const ATK_ANIM=.36;
function drawUnit(u){
  const big=u.s.big?2:1,s=unitSprite(u.type,u.team,u.hero,u.v),w=s.width,h=s.height,x=Math.round(u.x),y=Math.round(u.y);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x-5*big,y-1,10*big,2);
  const z=Math.round(u.z||0),ghost=u.hero&&B.hx&&B.hx.inv>0;
  if(u.buffT>0){ctx.fillStyle='rgba(232,185,74,.35)';ctx.fillRect(x-6,y-2,12,3)}
  const hit=u.hitAt!=null&&B.t-u.hitAt<.09;
  {const moved=u.plx!=null&&Math.hypot(u.x-u.plx,u.y-u.ply)>.02;u.plx=u.x;u.ply=u.y;const beast=!!(ST[u.type]&&ST[u.type].beast),pose=beast?0:procPose(u,moved),sp=pose?unitSprite(u.type,u.team,u.hero,u.v,pose):s;
    let bx=0,bo=0;if(beast){if(moved)bo=-(Math.floor(B.t*8+(u.v||0))%2);if(u.atkAt!=null&&B.t-u.atkAt<ATK_ANIM)bx=Math.round(3*Math.sin((B.t-u.atkAt)/ATK_ANIM*Math.PI))}
    if(moved&&Math.random()<.05&&B.parts.length<300)B.parts.push({x:x-u.face*3,y:y-1,vx:-u.face*8,vy:-12,life:.28,c:'#a89a78'});
    ctx.save();ctx.translate(x,y-z+bo);if(u.face<0)ctx.scale(-1,1);if(ghost)ctx.globalAlpha=.55;ctx.drawImage(hit?whiteOf(sp):sp,-Math.floor(sp.width/2)+bx,-sp.height+2);ctx.restore()}
  if(u.stun>0)txt('*',x+(Math.floor(performance.now()/120)%2?3:-3),y-h-z-2,'#ffe08a','center');
  if(u.hp<u.max||u.hero||u.comp){const bw=u.s.big?28:10,f=u.hp/u.max;ctx.fillStyle='#000';ctx.fillRect(x-bw/2-1,y-h-1-z,bw+2,3);ctx.fillStyle=u.hero||u.comp?'#e8b94a':u.team?'#e0605a':'#78c474';ctx.fillRect(x-bw/2,y-h-z,Math.max(0,Math.round(bw*f)),1)}
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
  ctx.drawImage(B.arena,0,0);
  for(const c of B.corpses){ctx.save();ctx.translate(Math.round(c.x),Math.round(c.y));ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-6,-1,12,3);ctx.fillStyle=C.team[c.team];ctx.fillRect(-5,-3,8,3);ctx.fillStyle=C.skin;ctx.fillRect(3,-3,3,3);ctx.fillStyle='#a8322e';ctx.fillRect(-2,0,4,1);ctx.restore()}
  for(const g of GRPS){const gr=B.groups[g];if((gr.order!=='hold'&&gr.order!=='advance')||!grpUnits(g).length)continue;
    const fx_=Math.round(gr.ax),fy=Math.round(gr.ay);rect(ctx,C.wood,fx_,fy-14,1,14);rect(ctx,C.team[0],fx_+1,fy-14,6,4);rect(ctx,'#e4e0cf',fx_+3,fy-13,2,2)}
  if(B.sel!=='all')for(const u of grpUnits(B.sel))rect(ctx,'#e8b94a',Math.round(u.x)-4,Math.round(u.y)+1,8,1);
  [...B.obs,...B.units.filter(u=>u.hp>0)].sort((a,b)=>a.y-b.y).forEach(o=>o.kind?(sp=>ctx.drawImage(sp,Math.round(o.x-sp.width/2),Math.round(o.y-14)))(obstacleSprite(o.kind,B.env.c)):drawUnit(o));
  txt(B.env.name,VW/2,10,'#e4e0cf','center');
  for(const a of B.arrows){if(a.arc){const z=Math.max(0,a.z),ang=Math.atan2(a.vy-a.vz,a.vx),sc=Math.min(1,z/50);
      ctx.fillStyle='rgba(0,0,0,'+(.35-sc*.2).toFixed(2)+')';ctx.fillRect(Math.round(a.x-2),Math.round(a.y),4,1);
      ctx.save();ctx.translate(Math.round(a.x),Math.round(a.y-4-z));ctx.rotate(ang);ctx.fillStyle='#e8e4d0';ctx.fillRect(-4,0,7,1);ctx.fillStyle='#c9ced8';ctx.fillRect(3,0,2,1);ctx.fillStyle='#d8d0c0';ctx.fillRect(-5,-1,2,1);ctx.fillRect(-5,1,2,1);ctx.restore();continue}
    if(a.magic){const fl=Math.floor(performance.now()/80)%2;ctx.fillStyle=a.col;ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(a.x,a.y,5+fl,0,7);ctx.fill();ctx.globalAlpha=1;ctx.beginPath();ctx.arc(a.x,a.y,2.5,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(Math.round(a.x)-1,Math.round(a.y)-1,2,2);continue}ctx.save();ctx.translate(Math.round(a.x),Math.round(a.y));ctx.rotate(a.a);ctx.fillStyle='#e8e4d0';ctx.fillRect(-4,0,7,1);ctx.fillStyle='#c9ced8';ctx.fillRect(3,0,2,1);ctx.restore()}
  const h=B.hero;
  if(h&&h.hp>0){
    if(B.blocking){ctx.strokeStyle='#9fc0ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(h.x,h.y-6,13,B.aim-.9,B.aim+.9);ctx.stroke()}
    ctx.strokeStyle='rgba(232,185,74,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(h.x,h.y-6,h.s.reach+5,B.aim-.25,B.aim+.25);ctx.stroke();
  }
  for(const s of B.slashes){if(s.kind){drawSlash(s);continue}ctx.strokeStyle='rgba('+(s.col||'255,255,255')+','+Math.min(1,s.life*7).toFixed(2)+')';ctx.lineWidth=s.w||3;ctx.beginPath();ctx.arc(s.x,s.y,s.r||B.hero.s.reach,s.a-(s.arc||1.1),s.a+(s.arc||1.1));ctx.stroke()}
  for(const r of B.rings){const p=1-r.life/r.max;ctx.strokeStyle='rgba('+r.col+','+(r.life/r.max).toFixed(2)+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(r.x,r.y,r.r*(.5+.5*p),0,6.283);ctx.stroke()}
  for(const p of B.parts){if(p.stuck){const x=Math.round(p.x),y=Math.round(p.y);ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle='#c9b48a';ctx.fillRect(x-p.stuck,y-3,1,2);ctx.fillRect(x-2*p.stuck,y-5,1,2);ctx.fillStyle='#e8e4d0';ctx.fillRect(x-3*p.stuck,y-6,1,1);ctx.globalAlpha=1;continue}
    ctx.fillStyle=p.c;ctx.fillRect(Math.round(p.x),Math.round(p.y),2,2)}
  for(const f of B.floats)txt(f.t,Math.round(f.x),Math.round(f.y),f.c,'center');
  const ap=B.units.filter(u=>u.team===0&&u.hp>0).length,ae=B.units.filter(u=>u.team===1&&u.hp>0).length;
  txt('Your band '+ap,6,10,'#9fc0ff');txt((B.opts.tournament?'Champion ':'Raiders ')+ae,VW-6,10,'#ff9a90','right');
  if(h){ctx.fillStyle='#000';ctx.fillRect(5,14,62,5);ctx.fillStyle='#e8b94a';ctx.fillRect(6,15,Math.round(60*Math.max(0,h.hp)/h.max),3)}
  const segs=GRPS.filter(g=>grpUnits(g).length).map(g=>({s:GN[g].slice(0,3)+' '+B.groups[g].order+(B.groups[g].spread?'*':''),c:B.sel===g||B.sel==='all'?'#e8b94a':'#98a0ba'}));
  if(segs.length){ctx.font='8px Silkscreen, "Courier New", monospace';const gap=10,w=segs.reduce((a,x)=>a+ctx.measureText(x.s).width,0)+gap*(segs.length-1);let x=VW/2-w/2;
    for(const sg of segs){txt(sg.s,Math.round(x),VH-5,sg.c);x+=ctx.measureText(sg.s).width+gap}}
  drawHeroHud();
  if(B.over){txt(B.win?'VICTORY':'DEFEAT',VW/2,VH/2,B.win?'#e8b94a':'#e0605a','center')}
}
function frame(){
  ctx.save();
  if(G.shake>0)ctx.translate(Math.round((Math.random()-.5)*G.shake),Math.round((Math.random()-.5)*G.shake));
  if(B&&(G.mode==='battle'||G.mode==='esc'&&G.esc&&G.esc.mode==='battle'))drawBattle();
  else if(G.mode==='title'){ctx.fillStyle='#0b0d14';ctx.fillRect(0,0,VW,VH);drawWorld()}
  else drawWorld();
  ctx.restore();
}
function updateHUD(force){
  const cnt=partySize(),cap=partyCap(),eat=eatPerDay();
  $('#stats').innerHTML=
    '<div class="stat"><b>Day</b><span>'+G.day+'</span></div>'+
    '<div class="stat"><b>Gold</b><span class="gold">'+P.gold+'</span></div>'+
    '<div class="stat" title="'+FOODS.filter(g=>goodN(g)).map(g=>GOODS[g].n+' '+goodN(g)).join(', ')+'"><b>Food</b><span class="'+(foodN()<eat*2?'low':'')+'">'+foodN()+'</span></div>'+
    '<div class="stat"><b>Troops</b><span>'+cnt+'/'+cap+'</span></div>'+
    (()=>{const m=vitals(),bar=(v,mx,c)=>'<i style="display:block;height:3px;margin-top:2px;background:var(--shade)"><i style="display:block;height:3px;width:'+Math.round(v/mx*100)+'%;background:'+c+'"></i></i>';
      return '<div class="stat wide"><b>Health · Stamina · Mana</b><span class="'+(P.hp<m[0]*.3?'low':'')+'">'+Math.round(P.hp)+'/'+m[0]+' · '+Math.round(P.sp)+' · '+Math.round(P.mp)+'</span>'+bar(P.hp,m[0],'#e8b94a')+bar(P.sp,m[1],'#78c474')+bar(P.mp,m[2],'#5a8fe8')+'</div>'})()+
    '<div class="stat"><b>Power</b><span class="gold">'+partyPower()+'</span></div>'+
    '<div class="stat"><b>Morale</b><span class="'+(P.morale<30?'low':'')+'">'+Math.round(P.morale)+'</span></div>'+
    '<div class="stat"><b>Furs</b><span class="'+(climAt(P.x,P.y)==='frost'&&goodN('furs')<Math.ceil((partySize()+1)/5)&&!RACES[P.race].home.includes('frost')?'low':'')+'">'+goodN('furs')+'</span></div>'+
    '<div class="stat"><b>Prisoners</b><span>'+prisonerCount()+'</span></div>'+
    '<div class="stat wide"><b>Renown</b><span>'+P.renown+' · '+rankName()+'</span></div>'+
    '<div class="stat wide"><b>Serving</b><span'+(P.fac?' style="color:'+FACS[P.fac].col+'"':'')+'>'+(P.fac?FACS[P.fac].n:'Independent')+'</span></div>'+
    '<div class="stat"><b>Region</b><span>'+regionAt(P.x,P.y).name+'</span></div>'+
    '<div class="stat wide"><b>Land</b><span style="color:'+(landHold(P.x,P.y)?landCol(landHold(P.x,P.y).owner):'#9a958a')+'">'+landName(P.x,P.y)+'</span></div>'+
    '<div class="stat"><b>Level</b><span>'+P.level+(P.tp?' <span class="gold">+</span>':'')+'</span></div>';
}
function updateHint(){
  $('#hint').textContent=G.mode==='battle'?'WASD move · Space/click: attack · F: dodge · right-click: shove · 1-0: skill slots · Shift: sprint · B: block · G: pick group · Z Hold · X Follow · C Charge · V Advance · T Spread':'Click the map to move · Space: pause · C: character · I: inventory · F6: save · Enter towns to recruit and trade';
}
function setOrderUI(){
  if(!B)return;const gs=selGroups().filter(g=>grpUnits(g).length),src=gs.length?gs:selGroups();
  document.querySelectorAll('[data-order]').forEach(b=>b.classList.toggle('on',src.every(g=>B.groups[g].order===b.dataset.order)));
  const sp=src.every(g=>B.groups[g].spread);$('#spread').classList.toggle('on',sp);$('#spread').setAttribute('aria-pressed',String(sp));
  document.querySelectorAll('[data-grp]').forEach(b=>{const g=b.dataset.grp,n=g==='all'?GRPS.reduce((a,x)=>a+grpUnits(x).length,0):grpUnits(g).length;
    b.textContent=(g==='all'?'All':GN[g])+' '+n;b.disabled=g!=='all'&&!n;b.classList.toggle('on',B.sel===g);b.setAttribute('aria-pressed',String(B.sel===g))});
}
function setOrder(o){
  if(!B)return;
  for(const g of selGroups()){if(o==='hold'||o==='advance')regroup(g);B.groups[g].order=o}
  setOrderUI();log(GN[B.sel]+': '+o+'.');
}
function setSpread(){
  if(!B)return;const gs=selGroups(),on=!gs.every(g=>B.groups[g].spread);
  gs.forEach(g=>B.groups[g].spread=on);setOrderUI();log(GN[B.sel]+(on?' spread out.':' close ranks.'));
}
function selectGroup(g){if(!B)return;if(g!=='all'&&!grpUnits(g).length)return;B.sel=g;setOrderUI()}
function cycleGroup(){if(!B)return;const opts=['all',...GRPS.filter(g=>grpUnits(g).length)];B.sel=opts[(opts.indexOf(B.sel)+1)%opts.length];setOrderUI()}
function setSpeed(n){G.speed=n;document.querySelectorAll('[data-speed]').forEach(b=>b.classList.toggle('on',+b.dataset.speed===n))}
function togglePause(){G.paused=!G.paused;$('#pause').textContent=G.paused?'Play':'Pause'}
