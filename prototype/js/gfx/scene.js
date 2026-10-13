'use strict';
/* ---------- drawing scenes: the place painted once, then people, labels and light each frame, zoomed in ---------- */
// sceneCv(S) paints the ground, streets, walls, water, buildings and decorations into one canvas (kept on S); drawScene
// draws its view around you at SCENE_ZOOM, the people sorted by depth, a mark over everyone who keeps a shop, the name of
// whoever is near and how to talk to them, and the night with lit windows.
function sceneCv(S){
  if(S.cv)return S.cv;const W=S.W,H=S.H,G0=SCENE_GROUND[S.clim]||SCENE_GROUND.grass,ST0=SCENE_STYLE[S.style]||SCENE_STYLE.human;S.lights=[];
  return S.cv=mkc(W*TILE,H*TILE,g=>{
    const r=(c,x,y,w,h)=>rect(g,c,x,y,w||1,h||1),n=(x,y,k)=>hs(x,y,S.seed*31+k);
    // ground and speckles
    r(G0[0],0,0,W*TILE,H*TILE);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=sceneAt(S,x,y),px=x*TILE,py=y*TILE;
      if(v===S_GROUND||v===S_SOLID){for(let k=0;k<5;k++)r(n(x,y,k)<.5?G0[1]:G0[2],px+Math.floor(n(x,y,k+9)*15),py+Math.floor(n(x,y,k+19)*15),1+(k&1),1)}
      if(v===S_PATH){r('#8f8474',px,py,TILE,TILE);for(let j=0;j<4;j++)for(let i=0;i<4;i++){const s=n(x*4+i,y*4+j,3);r(s<.33?'#a39886':s<.66?'#9a8f7e':'#8a7f6e',px+i*4,py+j*4,3,3)}}
      if(v===S_WATER){r('#3a6a9a',px,py,TILE,TILE);if(n(x,y,7)<.5)r('#5a8aba',px+Math.floor(n(x,y,8)*10),py+Math.floor(n(x,y,9)*14),5,1)}
      if(v===S_PIER){r('#3a6a9a',px,py,TILE,TILE);r('#8a6a3a',px,py+1,TILE,TILE-2);for(let i=0;i<TILE;i+=4)r('#6a4a2a',px+i,py+1,1,TILE-2)}}
    // walls: stone, a palisade, or a fence, with the gate
    const wl=S.wall,wc=wl>=2?'#8a8e98':'#7a5a32',wd=wl>=2?'#5a5e68':'#4a3420',ring=(x,y)=>x===1||y===1||x===W-2||y===H-2;
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){if(!ring(x,y)||sceneAt(S,x,y)!==S_SOLID)continue;const px=x*TILE,py=y*TILE;
      if(!wl){r('#7a5a32',px,py+10,TILE,2);r('#5a3a20',px+2,py+6,2,8);r('#5a3a20',px+10,py+6,2,8)}
      else if(wl===1){for(let i=0;i<TILE;i+=4){r(wc,px+i,py+2,3,13);r(wd,px+i+2,py+2,1,13);r('#9a7a4a',px+i,py+1,3,2)}}
      else{r(wc,px,py+2,TILE,13);r(wd,px,py+14,TILE,1);for(let i=0;i<TILE;i+=8)r('#a8acb6',px+i,py,5,3);r(wd,px+4,py+7,6,1)}}
    {const gx=S.gate.x*TILE,gy=S.gate.y*TILE;r(wl>=2?'#5a5e68':'#4a3420',gx-4,gy-6,4,22);r(wl>=2?'#5a5e68':'#4a3420',gx+32,gy-6,4,22);if(wl>=2){r('#a8acb6',gx-5,gy-8,6,3);r('#a8acb6',gx+31,gy-8,6,3)}}
    // decorations under the buildings' line
    for(const d of S.deco){const px=d.x*TILE,py=d.y*TILE;
      if(d.k==='well'){r('#6a6e78',px+1,py+6,14,9);r('#8a8e98',px+1,py+6,14,2);r('#2a4a6a',px+3,py+8,10,3);r('#5a3a20',px+2,py-2,1,8);r('#5a3a20',px+13,py-2,1,8);r('#8a3d2d',px,py-4,16,3)}
      if(d.k==='lamp'){r('#3a3a40',px+7,py+3,2,12);r('#e8c060',px+6,py+1,4,3);S.lights.push({x:px+8,y:py+2,r:10})}
      if(d.k==='stall'){const aw=['#c84a3a','#3a74c8','#c8a03a','#4a9a4a'][d.v%4];r('#6a4a2a',px+2,py+6,28,9);r('#8a6a3a',px+2,py+6,28,2);r(aw,px,py-1,32,6);for(let i=0;i<32;i+=6)r('#f0ece0',px+i,py-1,3,6);r('#6a4a2a',px+1,py+4,1,11);r('#6a4a2a',px+30,py+4,1,11);
        for(let i=0;i<4;i++)r(['#c8a03a','#e05a3a','#78c474','#e8e4d0'][(d.v+i)%4],px+5+i*6,py+7,4,3)}
      if(d.k==='tree'){const c=S.clim;if(c==='desert'){r('#7a5a32',px+7,py+2,2,13);r('#5a8a3a',px+1,py,14,3);r('#4a7a32',px+3,py-2,10,2)}
        else if(c==='frost'){r('#4a3a2a',px+7,py+11,2,4);r('#2f5a40',px+2,py+3,12,8);r('#3a6a4a',px+4,py-2,8,6);r('#eef2f6',px+3,py+3,10,2);r('#eef2f6',px+5,py-2,6,2)}
        else{r('#5a3a20',px+7,py+9,2,6);r(c==='swamp'?'#4a5a30':'#2f6a30',px+1,py-1,14,11);r(c==='swamp'?'#5a6a3a':'#3f8a3e',px+3,py-2,9,6);r('#1f4a20',px+2,py+8,12,2)}}}
    // the pier's boat
    if(S.pier){const px=(S.pier.x+3)*TILE,py=(S.pier.y+2)*TILE+2;r('#6a4a2a',px,py,24,6);r('#8a6a3a',px+2,py,20,2);r('#e8e4d0',px+10,py-14,1,14);r('#e8e4d0',px+11,py-12,8,9)}
    // buildings, back to front
    for(const b of [...S.blds].sort((a,c)=>a.y-c.y))paintBld(g,S,b,ST0);
  });
}
// one building, front-facing: the roof on top, the front wall below with its door, windows and the sign of whoever works here
function paintBld(g,S,b,ST0){
  const r=(c,x,y,w,h)=>rect(g,c,x,y,w||1,h||1),X=b.x*TILE,Y=b.y*TILE,W=b.w*TILE,H=b.h*TILE,roof=ST0.roof[b.v%ST0.roof.length],wall=ST0.wall,beam=ST0.beam;
  const fh=Math.max(16,Math.round(H*.45)),fy=Y+H-fh,big=b.k==='hall'||b.k==='temple';
  // roof: eaves, shingle rows, a ridge; leafy for elves, spiked for orcs
  r(shade(roof,.7),X-2,fy-2,W+4,3);
  for(let y=Y+2;y<fy-2;y+=3){r(roof,X,y,W,3);r(shade(roof,.85),X,y+2,W,1)}
  r(shade(roof,1.2),X+2,Y+2,W-4,1);
  if(ST0.leaf)for(let i=0;i<W*1.5;i++)r(i%2?'#5a9a4a':'#2a5a2a',X+Math.floor(hs(i,b.x,b.y)*(W-2)),Y+2+Math.floor(hs(b.y,i,b.x)*(fy-Y-4)),2,2);
  if(ST0.spikes)for(let x=X;x<X+W;x+=5)r('#e8e4d0',x+2,Y-1,1,3);
  if(b.k==='temple'){r(shade(roof,.8),X+W/2-5,Y-10,10,12);r('#e8c060',X+W/2-1,Y-14,2,5)}
  if(b.k==='hall'){for(const fx of [X+3,X+W-6]){r('#5a3a20',fx,Y-12,1,14);r(S.col,fx+1,Y-12,5,4);r(shade(S.col,.7),fx+1,Y-9,5,1)}}
  if(b.k==='tavern'||b.k==='smithy'){r('#6a6e78',X+W-10,Y-6,5,9);r('#4a4e58',X+W-10,Y-6,5,1)}
  // the front wall
  if(b.k==='stable'){r('#8a6a3a',X,fy,W,fh);r('#3a2a1a',X+4,fy+3,W-8,fh-3);r('#d8c060',X+6,fy+fh-5,W-12,5);r(beam,X,fy,W,1)}
  else{r(wall,X,fy,W,fh);r(beam,X,fy,W,1);r(beam,X,fy,1,fh);r(beam,X+W-1,fy,1,fh);
    if(ST0.stone)for(let y=fy+3;y<fy+fh;y+=4)r(shade(wall,.85),X+1,y,W-2,1);
    else for(let x=X+8;x<X+W-4;x+=12)r(beam,x,fy,1,fh);
    const dw=big?10:6,dx=X+W/2-dw/2;r('#3a2418',dx,fy+fh-11,dw,11);r('#5a3a24',dx+1,fy+fh-10,dw-2,1);
    for(const wx of [X+4,X+W-9]){if(Math.abs(wx-dx)<8)continue;r('#2a3040',wx,fy+4,5,5);r(beam,wx,fy+6,5,1);S.lights.push({x:wx+2,y:fy+6,r:7})}}
  if(b.k==='smithy'){r('#3a3a40',X+W-14,fy+fh-7,8,5);r('#e8803a',X+W-13,fy+fh-6,3,2);S.lights.push({x:X+W-12,y:fy+fh-5,r:12,col:'255,140,60'})}
  if(b.k==='barracks'){r('#6a4a2a',X+2,fy+fh-9,1,9);r('#c9ced8',X+1,fy+fh-10,3,1);r('#6a4a2a',X+6,fy+fh-9,1,9);r('#c9ced8',X+5,fy+fh-10,3,1)}
  // the sign of the trade
  if(b.role){const sx=X+W/2+(big?8:6),sy=fy+2;r('#5a3a20',sx,sy,7,6);r('#c8a060',sx+1,sy+1,5,4);signIcon(g,SCENE_ROLES[b.role].icon,sx+2,sy+2)}
}
// tiny 3x3 marks for signs and the markers over people
function signIcon(g,icon,x,y,col){const r=(xx,yy,w,h)=>rect(g,col||'#3a2418',x+xx,y+yy,w||1,h||1);
  ({mug:()=>{r(0,0,2,3);r(2,1)},anvil:()=>{r(0,0,3,1);r(1,1,1,2)},coin:()=>{r(1,0);r(0,1,3,1);r(1,2)},sword:()=>{r(1,0,1,2);r(0,2,3,1)},
    shoe:()=>{r(0,0,1,3);r(2,0,1,3);r(1,2)},scroll:()=>{r(0,0,3,1);r(0,2,3,1);r(1,1)},crown:()=>{r(0,0);r(2,0);r(0,1,3,2)},candle:()=>{r(1,0);r(1,1,1,2)}}[icon]||(()=>r(1,1)))();
}
// townsfolk and the people who work in town, in their own clothes (no weapons): a seeded look per person, with the trade's
// clothes and tools for a role. pose: 0-1 standing, 2-5 walking, like unitSprite
function personSprite(look,race,v,pose){
  const k='ps'+look+race+v+'p'+pose;if(spr[k])return spr[k];
  const R=seeded(v*131+7),pick=a=>a[Math.floor(R()*a.length)],skin=(RACES[race]||{}).skin||C.skin,hair=pick(['#2a1a10','#5a3a20','#8a6a3a','#c8a060','#3a3a40','#9a3a20']);
  const cloth=pick(['#3a5a8a','#7a3a3a','#4a6a3a','#8a7a4a','#5a4a6a','#6a5a3a','#3a6a6a']),legs=pick(['#3a2a1a','#4a4a5a','#5a4a3a']),dress=look==='priest'||look==='folk'&&v%3===0;
  const walk=pose>=2&&pose<=5?pose-2:-1,b=walk===1||walk===3?-1:0,br=pose===1?1:0;
  const body={smith:'#8a6a5a',merchant:'#7a3a8a',priest:'#e8e4d0',steward:'#2f4f6a',groom:'#8a6a3a',innkeeper:'#6a5a8a'}[look]||cloth;
  return spr[k]=cellOf(outlined(mkc(12,19,g=>{const r=(c,x,y,w,h)=>rect(g,c,x,y,w||1,h||1);
    // legs, or a long skirt or robe
    if(dress||look==='steward'){r(body,3,11+b,6,6-b);r(shade(body,.75),3,16,6,1);r(C.dark,4,17,1,2);r(C.dark,7,17,1,2)}
    else{const L=walk<0?[4,6]:[[3,7],[4,6],[5,5],[4,6]][walk];r(legs,L[0],13+b,2,4-b);r(legs,L[1],13+b,2,4-b);r(C.dark,L[0],17,2,2);r(C.dark,L[1],17,2,2)}
    // body and arms (swinging when walking)
    r(body,3,7+b+br,6,6-br);r(shade(body,.8),3,12+b,6,1);const sw=walk<0?0:walk===0?1:walk===2?-1:0;r(skin,2,9+b+sw,1,3);r(skin,9,9+b-sw,1,3);r(body,2,7+b+br,1,2);r(body,9,7+b+br,1,2);
    // head and hair
    r(skin,4,2+b+br,4,5);r(C.dark,6,4+b+br,1,1);r(hair,4,1+b+br,4,2);r(hair,4,3+b+br,1,2);
    // the trade's clothes and tools
    if(look==='smith'){r('#5a3a20',4,9+b,4,5);r('#9aa3ad',10,8+b-sw,2,2);r('#6a4a2a',10,10+b-sw,1,3)}
    if(look==='innkeeper'){r('#e8e4d0',4,9+b,4,5);r('#c8a060',10,9+b-sw,2,3);r('#f0ece0',10,9+b-sw,2,1)}
    if(look==='merchant'){r('#3a2a4a',3,0+b+br,6,2);r('#3a2a4a',2,2+b+br,8,1);r('#e8b94a',3,10+b,6,1)}
    if(look==='priest'){r('#e8e4d0',3,1+b+br,6,2);r('#e8e4d0',3,3+b+br,1,3);r('#e8e4d0',8,3+b+br,1,3);r('#e8b94a',5,8+b,2,8)}
    if(look==='steward'){r('#e8e4d0',10,9+b-sw,2,3);r('#c8a060',10,9+b-sw,2,1);r('#e8b94a',5,7+b+br,2,1)}
    if(look==='groom'){r('#d8c060',2,1+b+br,8,1);r('#d8c060',3,0+b+br,6,1)}
  })))
}
function drawScene(){
  const S=G.scene;if(!S)return;const Z=SCENE_ZOOM,c=sceneCv(S),cam=sceneCam(S),p=S.p,now=performance.now();
  ctx.fillStyle='#0b0d14';ctx.fillRect(0,0,VW,VH);
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.scale(Z,Z);ctx.translate(-cam.x,-cam.y);ctx.drawImage(c,0,0);
  const race=townBy(S.ref).races[0],ents=[...S.npcs,...S.folk,p].sort((a,b)=>a.y-b.y);
  for(const o of ents){const hero=o===p,look=o.role?SCENE_ROLES[o.role].look:o.guard||o.lord?'guard':'folk',pose=o.moving?2+Math.floor((hero?p.t:o.t)*8)%4:Math.floor(now/600+(o.ph||0))%2;
    const s=hero?unitSprite('hero',0,true,0,pose):look==='guard'?unitSprite(RACES[o.race||race].melee,0,false,o.role?1:o.lord?0:3,pose):personSprite(look,o.race||race,o.v||(o.role||'').length,pose);
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(Math.round(o.x-5),Math.round(o.y-1),10,2);
    ctx.save();ctx.translate(Math.round(o.x),Math.round(o.y));if((o.dir||1)<0)ctx.scale(-1,1);ctx.drawImage(s,-Math.floor(s.width/2),-s.height+2);ctx.restore();
    if(o.lord){const bx=Math.round(o.x)-4,by=Math.round(o.y)-26+(Math.floor(now/500+o.ph)%2);rect(ctx,'#1a1410',bx-1,by-1,9,9);rect(ctx,'#e8b94a',bx,by,7,7);signIcon(ctx,'crown',bx+2,by+2)}
    if(o.role&&!o.guard){const R=SCENE_ROLES[o.role],bx=Math.round(o.x)-4,by=Math.round(o.y)-26+(Math.floor(now/500+o.ph)%2);rect(ctx,'#1a1410',bx-1,by-1,9,9);rect(ctx,'#e8d8a0',bx,by,7,7);signIcon(ctx,R.icon,bx+2,by+2)}}
  if(GRID.on)drawGrid(cam.x,cam.y,VW/Z,VH/Z,0,0,1/Z);
  // night: the dark, and warm light from windows and lamps
  const dk=darkness();if(dk>0){ctx.fillStyle='rgba(10,14,50,'+(dk*.55).toFixed(3)+')';ctx.fillRect(cam.x,cam.y,VW/Z,VH/Z);
    ctx.globalCompositeOperation='lighter';
    for(const l of S.lights){const c=l.col||'255,190,90',gr=ctx.createRadialGradient(l.x,l.y,0,l.x,l.y,l.r);gr.addColorStop(0,'rgba('+c+','+(dk*.5).toFixed(3)+')');gr.addColorStop(1,'rgba('+c+',0)');ctx.fillStyle=gr;ctx.fillRect(l.x-l.r,l.y-l.r,l.r*2,l.r*2)}
    ctx.globalCompositeOperation='source-over'}
  ctx.restore();
  // who is near, and how to talk to them
  const n=!G.modal&&sceneNear(S);
  const nameOf=o=>o.role?SCENE_ROLES[o.role].n:o.lord?(W.lords.find(x=>x.id===o.lord)||{name:'A lord'}).name:'';
  for(const o of S.npcs)if((o.role||o.lord)&&Math.hypot(o.x-p.x,o.y-p.y)<70)txt(nameOf(o),Math.round((o.x-cam.x)*Z),Math.round((o.y-cam.y)*Z)-58,o===n?'#ffe08a':'#e4e0cf','center');
  txt(S.ref,6,14,'#e8b94a');
  if(n){const lab=n.folk?'Talk':n.guard?'Talk to the guard':n.lord?'Talk to '+nameOf(n):'Talk to the '+SCENE_ROLES[n.role].n.toLowerCase()+(SCENE_ROLES[n.role].tab?' ('+(townTabs(townBy(S.ref)).find(x=>x[0]===SCENE_ROLES[n.role].tab)||['',''])[1]+')':'');
    ctx.fillStyle='rgba(11,13,20,.8)';ctx.fillRect(VW/2-130,VH-26,260,18);txt('E · '+lab,VW/2,VH-13,'#ffe08a','center')}
  else if(p.y>(S.H-4)*TILE)txt('Walk out of the gate to leave',VW/2,VH-13,'#c8c2ae','center');
}
