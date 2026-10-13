'use strict';
/* ---------- structures on the world map: placed buildings, the ground of estates, camps and sites ---------- */
// Every building comes from the PX engine (../engine) and stands on its own tiles of the grid (lots.js): its picture is
// exactly its cell (16, 32 or 64 pixels a side), drawn among the parties by its front edge. A yard of worn ground lies under
// each; fields, pastures, pits and piers lie flat on the tiles their estate keeps. Flags are their own sprite, waving.

/* placed buildings */
// a building's picture: from the engine by its type, its people, its seed and the climate it stands in; a ruined one is its building
// burnt (charred, with ash); cached on the lot until it changes
function lotSprite(t,l){
  if(l._s&&l._st===l.st&&l._lv===l.lv&&l._fort===l.fort)return l._s;const c=climAt((l.x+l.n/2)*TILE,(l.y+l.n/2)*TILE);
  const b=PX.building({type:l.type,style:lotPeople(t,l),seed:l.seed,env:c,snow:c==='frost',lv:l.k==='house'||l.k==='centre'?1:l.lv,...(l.k==='centre'?{view:'top',fort:l.fort||0}:{})});
  let cv=mkc(b.w,b.h,g=>{g.drawImage(b.shadow,0,0);g.drawImage(b.img,0,0)});
  if(l.st==='ruined')cv=charred(cv,l.seed);
  cv.flag=b.flag;l._st=l.st;l._lv=l.lv;l._fort=l.fort;return l._s=cv;
}
// burnt: every pixel darkened toward soot, a scatter of ash and the last embers (still whole pixels, never half-see-through)
function charred(src,seed){return mkc(src.width,src.height,g=>{g.drawImage(src,0,0);const d=g.getImageData(0,0,src.width,src.height),a=d.data;
  for(let i=0;i<a.length;i+=4){if(a[i+3]<255)continue;const k=(i>>2),h=hash(k%src.width,k/src.width|0,seed);const f=h<.08?.25:.45;a[i]=a[i]*f+30*(1-f)|0;a[i+1]=a[i+1]*f+24*(1-f)|0;a[i+2]=a[i+2]*f+20*(1-f)|0;if(h>.995){a[i]=232;a[i+1]=106;a[i+2]=42}}
  g.putImageData(d,0,0)})}
// worn ground under a building: the climate's dirt, its edge broken (whole pixels only)
function lotYard(n,c){const k='yd'+n+c;if(spr[k])return spr[k];const N=n*TILE,dc={grass:[124,108,70],frost:[176,170,158],desert:[196,166,110],swamp:[84,76,52]}[c],P3=GROUND_RGB[c][1];
  return spr[k]=mkc(N,N,g=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++){const e=Math.min(x,y,N-1-x,N-1-y),h=hash(x,y,n*7+3);if(e<2&&h<(2-e)*.4)continue;g.fillStyle=hex(mixc(P3,dc,.45+hash(x>>1,y>>1,n)*.25));g.fillRect(x,y,1,1)}})}
// a flag waving on its pole (its own sprite: three frames), in its colour; drawn with the pole's foot at the point given
function flagSprite(col,f){const k='fl'+col+f;if(spr[k])return spr[k];return spr[k]=outlined(mkc(7,11,g=>{rect(g,'#4a3020',0,1,1,10);rect(g,'#c8a040',0,0,1,1);
  const wave=[[0,0,0,0,0],[0,0,1,1,0],[0,1,1,0,0]][f];for(let i=0;i<5;i++){rect(g,col,1+i,1+wave[i],1,3);rect(g,shade(col,1.25),1+i,1+wave[i],1,1);rect(g,shade(col,.7),1+i,3+wave[i],1,1)}}),'#1a1512')}
const drawFlag=(col,x,y,seed)=>{const f=Math.floor(performance.now()/220+(seed||0))%3,s=flagSprite(col,f);ctx.drawImage(s,Math.round(x)-1,Math.round(y)-12)};
// a camp's fire: its flame flickers through the engine's four frames, its foot at (x, y)
const drawFire=(x,y,seed)=>{const f=Math.floor(performance.now()/110+(seed||0))%4,s=spr['flm'+f]||(spr['flm'+f]=PX.flame(f));ctx.drawImage(s.img,Math.round(x)-s.ax,Math.round(y)-s.ay)};
// the lots of every holding near the view: their yards and fields flat on the ground, under everyone
function drawLotGround(cam,V){
  for(const t of TOWNS){if(!t.lots||Math.hypot(t.x-P.x,t.y-P.y)>V+340)continue;
    for(const k in bldSpots(t)){const lv=bldLv(t,k);if(!lv)continue;const s=estateGround(t,k,lv);if(!s)continue;const sx=Math.round(s.x-cam.x),sy=Math.round(s.y-cam.y);
      if(sx>VW||sy>VH||sx+s.width<0||sy+s.height<0)continue;ctx.drawImage(s,sx,sy)}}
}
// the buildings themselves among the parties, each by its front edge; the centre flies the owner's flag and carries the name
function lotEnts(ents,cam,V){
  for(const t of TOWNS){if(!t.lots||Math.hypot(t.x-P.x,t.y-P.y)>V+340)continue;const now=facCol(t),live0=inSight(t.x,t.y);if(live0)t._memCol=now;const col=live0?now:t._memCol||now;
    for(const l of t.lots){const N=l.n*TILE,X=Math.round(l.x*TILE-cam.x),Y=Math.round((l.y+l.n)*TILE-cam.y);if(X>VW||X+N<0||Y-N>VH+20||Y<-12)continue;
      ents.push({y:(l.y+l.n)*TILE-1,f:()=>{
        // outside your sight: the building as you last saw it (fog.js), or nothing if you never saw its ground
        const live=inSight((l.x+l.n/2)*TILE,(l.y+l.n/2)*TILE);
        if(!live){if(!seenTile(l.x,l.y)&&!seenTile(l.x+l.n-1,l.y+l.n-1))return;const m=l._mem||lotSprite(t,l);ctx.drawImage(m,X,Y-N);if(l.k==='centre'&&(l._memSt||l.st)!=='ruined'){if(m.flag)drawFlag(col,X+m.flag[0],Y-N+m.flag[1],t.seed);txt(t.name,Math.round(t.x-cam.x),Math.round(t.y+16-cam.y),'#a8a496','center')}return}
        const s=lotSprite(t,l),w=t.work&&(t.work.lot?t.work.lot===l.id:t.work.k===l.k||t.work.k==='wall'&&l.k==='centre'),p=w?workProg(t):0;l._mem=s;l._memSt=l.st;
        if(l.st==='building')drawSite(s,X,Y,N,p,false,l.seed);else{ctx.drawImage(s,X,Y-N);if(w&&l.st==='built')drawSite(s,X,Y,N,p,true,l.seed)}
        if(ESTATES[l.k]&&sabotaged(t,l.k)){const now=performance.now()/1000;for(let i=0;i<6;i++){const ph=(now*.35+i/6)%1;ctx.globalAlpha=(1-ph)*.6;rect(ctx,ph<.3?'#4a4440':'#7a7470',Math.round(X+N/2-1+Math.sin(ph*6+i)*3+ph*5),Math.round(Y-N*.6-ph*20),2,2)}ctx.globalAlpha=1}
        if(l.k==='centre'&&l.st!=='ruined'){if(s.flag)drawFlag(col,X+s.flag[0],Y-N+s.flag[1],t.seed);holdingLabel(t,cam,X,Y,N)}
        if(ESTATES[l.k]){const m=lotMid(l);if(Math.hypot(m.x-P.x,m.y-P.y)<60)txt(ESTATES[l.k].n,Math.round(m.x-cam.x),Y+8,'#c8c2ae','center')}}});
      if(l.k==='port'&&l.st==='built')for(const o of estateBoats(t,bldLv(t,'port')))ents.push({y:o.y,f:()=>ctx.drawImage(o.b.img,Math.round(o.x-o.b.ax-cam.x),Math.round(o.y-o.b.ay-cam.y))})}}
}
// a building site: what is built so far (from the ground up, as the work goes on) behind scaffolding, a worker on the planks
// hammering; for an upgrade (full) the building stands whole with scaffolding against its side
function drawSite(s,X,Y,N,p,full,seed){
  const now=performance.now(),top=Math.round(N*.82),h=full?N:Math.max(2,Math.round(top*p));
  if(!full&&h>0)ctx.drawImage(s,0,N-h,N,h,X,Y-h,N,h);
  const x0=full?X+(N>>1):X+1,x1=X+N-2,poles=full?[x0,x1]:N>16?[x0,X+(N>>1),x1]:[x0,x1];
  for(const px of poles){rect(ctx,'#1a1512',px-1,Y-top-1,3,top+1);rect(ctx,'#8a6a42',px,Y-top,1,top)}
  for(let y=Y-4;y>Y-top;y-=6){rect(ctx,'#1a1512',x0-1,y-1,x1-x0+3,3);rect(ctx,'#a07e54',x0,y,x1-x0+1,1)}
  // the worker: walks the plank at the height reached, swings his hammer, a spark now and then
  const ly=full?Y-Math.round(top/2):Math.max(Y-top+2,Y-h-1),span=x1-x0-4,wx=x0+2+Math.round((Math.sin(now/900+seed)*.5+.5)*span),f=Math.floor(now/180)%2,ws=followerSprite('#8a6a42',f);
  ctx.drawImage(ws,wx-4,ly-8);if(Math.floor(now/180+seed)%7===0)rect(ctx,'#ffe090',wx+3,ly-6,1,1);
}
// placing a building by hand: its ghost under the pointer, its tiles green where it may stand and red where not
function drawPlace(cam){
  const pl=G.place,t=townBy(pl.town);if(!t||!G.mouse.in)return;const n=pl.n,N=n*TILE,{x,y}=placeAt(cam.x+G.mouse.x,cam.y+G.mouse.y,n),ok=placeOk(t,pl.k,x,y,n),X=x*TILE-cam.x,Y=y*TILE-cam.y;
  if(!pl._s){const b=PX.building({type:pl.type,style:t.races[0],seed:pl.seed,env:climAt(t.x,t.y)});pl._s=b.img}
  ctx.fillStyle=ok?'rgba(120,220,110,.28)':'rgba(230,90,80,.32)';ctx.fillRect(X,Y,N,N);ctx.globalAlpha=.75;ctx.drawImage(pl._s,X,Y);ctx.globalAlpha=1;
  ctx.strokeStyle=ok?'#78dc6e':'#e65a50';ctx.lineWidth=1;ctx.strokeRect(X+.5,Y+.5,N-1,N-1);
  txt('Place the '+(pl.k==='house'?'house':ESTATES[pl.k].n.toLowerCase())+' of '+t.name+' · click to build · Esc to stop',VW/2,VH-8,'#e8b94a','center');
}
// over a holding's centre: its name, a warning while besieged, and the lords inside: a pip of each one's colours under the name
// (their names when you are near). The holding flies one flag, its owner's, from its centre.
function holdingLabel(t,cam,X,Y,N){
  txt(t.name,Math.round(t.x-cam.x),Math.round(t.y+16-cam.y),hostileTo(t.owner)?'#ff9a90':'#e4e0cf','center');
  if(besieged(t)&&Math.floor(performance.now()/400)%2)txt('!',X+(N>>1),Y-N-2,'#ff6a60','center');
  const li=lordsInside(t),near=Math.hypot(t.x-P.x,t.y-P.y)<140;
  if(!near)li.slice(0,4).forEach((l,i,a)=>{const px=Math.round(t.x-cam.x)-a.length*3+i*6+1,py=Math.round(t.y+19-cam.y);rect(ctx,'#1a1512',px-1,py-1,5,5);rect(ctx,FACS[l.fac].col,px,py,3,3)});
  if(li.length&&near)txt(li.map(l=>l.name+' '+l.troops.length).join(' · '),Math.round(t.x-cam.x),Math.round(t.y+25-cam.y),FACS[li[0].fac].col,'center');
}

/* estates: fields, pastures, pits and piers lie flat on the tiles they keep; their buildings are lots like any other */
const withShadow=b=>mkc(Math.max(b.w,b.shadow.width),Math.max(b.h,b.shadow.height),g=>{g.drawImage(b.shadow,0,0);g.drawImage(b.img,0,0)});
const ROCK_MAT={grass:'stone',frost:'stone',desert:'sandstone',swamp:'stone'};
// which way the water lies from a port's shore tile, and where its pier starts (the shore's edge)
function pierOf(t){
  const p=bldSpots(t).port;if(!p)return null;for(const [a,b,dir] of [[0,1,'s'],[1,0,'e'],[-1,0,'w'],[0,-1,'n']])if(tAt(p.tx+a,p.ty+b)===T_WATER)
    return{dir,x:p.tx*TILE+8+a*8,y:p.ty*TILE+8+b*8};
  return null;
}
const CROPS={grass:[['#c8a848','#a88a38'],['#86a440','#68862e'],['#c8a848','#a88a38'],['#9a7a4a','#7a5c36']],frost:[['#b8b090','#9a9274'],['#8a9a6a','#6e7e54']],
  desert:[['#c8a050','#a8843e'],['#8aa048','#6a8436']],swamp:[['#8a9a48','#6e7e3a'],['#6a9a5a','#4e7a46']]};
const SOIL={grass:'#6e5434',frost:'#8a8070',desert:'#a07a48',swamp:'#4e4430'};
// the flat part of an estate at its level, as one picture placed at (cv.x, cv.y) on the map
function estateGround(t,k,lv){
  const key='eg'+t.name+k+lv;if(spr[key]!==undefined)return spr[key];const p=bldSpots(t)[k];if(!p)return spr[key]=null;
  const c=climAt(p.x,p.y),plots=plotsAt(t,k,lv),pier=k==='port'?pierOf(t):null,plen=pier?10+lv*6:0,tiles=[[p.tx,p.ty],...plots];
  let x0=Math.min(...tiles.map(q=>q[0]))*TILE-2,y0=Math.min(...tiles.map(q=>q[1]))*TILE-2,x1=(Math.max(...tiles.map(q=>q[0]))+1)*TILE+2,y1=(Math.max(...tiles.map(q=>q[1]))+1)*TILE+2;
  if(pier){x0=Math.min(x0,pier.x-plen-6);x1=Math.max(x1,pier.x+plen+6);y0=Math.min(y0,pier.y-plen-6);y1=Math.max(y1,pier.y+plen+6)}
  const has=(x,y)=>plots.some(q=>q[0]===x&&q[1]===y),h=(x,y,s)=>hash(x,y,t.seed*7+s);
  const cv=mkc(x1-x0,y1-y0,g=>{const r=(col,x,y,w,hh)=>rect(g,col,Math.round(x-x0),Math.round(y-y0),w||1,hh||1);
    for(const [tx,ty] of plots){const X=tx*TILE,Y=ty*TILE,edge=(a,b)=>!has(tx+a,ty+b)&&!(tx+a===p.tx&&ty+b===p.ty);
      if(k==='farm'){// a field: furrows of one crop, running one way or the other, a worn edge where the field ends
        const C=CROPS[c],[c0,c1]=C[Math.floor(h(tx,ty,1)*C.length)],across=h(tx,ty,2)<.5;r(SOIL[c],X,Y,16,16);
        for(let i=0;i<16;i+=3){if(across){r(c0,X,Y+i,16,2);r(c1,X,Y+i+1,16,1)}else{r(c0,X+i,Y,2,16);r(c1,X+i+1,Y,1,16)}}
        for(let i=0;i<5;i++)r(c1,X+Math.floor(h(tx*5+i,ty,3)*15),Y+Math.floor(h(tx,ty*5+i,4)*15),1,1);
        if(edge(0,-1))r('#5a7a34',X,Y,16,1);if(edge(0,1))r('#4a6a2c',X,Y+15,16,1);if(edge(-1,0))r('#5a7a34',X,Y,1,16);if(edge(1,0))r('#4a6a2c',X+15,Y,1,16)}
      else if(k==='pasture'){// grazing ground behind a rail fence (its herd walks on it: critters)
        r('#5e9440',X,Y,16,16);for(let i=0;i<10;i++)r(i%2?'#72a84c':'#4e8436',X+Math.floor(h(tx*9+i,ty,5)*15),Y+Math.floor(h(tx,ty*9+i,6)*15),1,1);
        const fence=(fx,fy,w,hh)=>{r('#8a6a42',fx,fy,w,hh);for(let i=0;i<Math.max(w,hh);i+=4)r('#5a3e24',fx+(w>1?i:0),fy+(hh>1?i:0)-1,1,2)};
        if(edge(0,-1))fence(X,Y+1,16,1);if(edge(0,1))fence(X,Y+15,16,1);if(edge(-1,0))fence(X,Y+1,1,15);if(edge(1,0))fence(X+15,Y+1,1,15);
}
      else if(k==='quarry'){// an open pit cut into the ground: its corners rounded and its rim ragged so the ground shows round it,
        // pale spoil thrown up about the rim, the back wall cut in strata, terraces stepping down to a dark floor, the left wall
        // lit and the right in shadow, cut blocks waiting. Plots side by side make one pit (edges only where it ends)
        const st=PX.MAT[ROCK_MAT[c]],eN=edge(0,-1),eS=edge(0,1),eW=edge(-1,0),eE=edge(1,0),x0=eW?2:0,x1=eE?13:15,y0=eN?2:0,y1=eS?13:15,hh=(x,y,s)=>h(tx*16+x,ty*16+y,s);
        const rim=(x,y)=>x===x0&&eW||x===x1&&eE||y===y0&&eN||y===y1&&eS;
        const inside=(x,y)=>x>=x0&&x<=x1&&y>=y0&&y<=y1&&!((x===x0&&eW||x===x1&&eE)&&(y===y0&&eN||y===y1&&eS))&&!((x===x0+1&&eW||x===x1-1&&eE)&&(y===y0&&eN||y===y1&&eS)&&hh(x,y,2)<.5)&&!(rim(x,y)&&hh(x,y,3)<.18);
        for(let y=0;y<16;y++)for(let x=0;x<16;x++){
          if(!inside(x,y)){// spoil: gravel about the rim
            if((eN&&y<y0||eW&&x<x0||eE&&x>x1||eS&&y>y1)&&hh(x,y,4)<.22)r(hh(x,y,5)<.5?st[0]:st[1],X+x,Y+y);continue}
          const d=eN?y-y0:9+y;let col;// d: how far below the back rim
          if(d===0)col=st[0];else if(d<4)col=(d+(hh(x,0,6)<.3?1:0))%2?st[1]:st[2];else if(d===4)col=st[0];else if(d<7)col=st[2];else if(d===7)col=st[1];
          // the floor: worked rock, mottled, with rubble and a further terrace every few rows down a long pit
          else if(d>8&&(d-8)%6===0)col=st[1];else if(d>8&&(d-8)%6===1)col=st[0];else{const n=hh(x,y,9);col=n<.12?st[1]:n<.55?st[2]:st[3]}
          if(x===x0&&eW&&d>0)col=st[1];if(x===x1&&eE&&d>0)col=st[3];if(y===y1&&eS)col=st[2];
          r(col,X+x,Y+y)}
        // a cut block or two on the floor
        for(let i=0;i<1+(hh(0,0,7)<.5?1:0);i++){const bx=X+x0+2+Math.floor(hh(i,1,8)*Math.max(1,x1-x0-6)),by=Y+Math.max(y0+9,Math.min(y1-3,y0+9+Math.floor(hh(i,2,8)*3)));r(st[0],bx,by,3,1);r(st[1],bx,by+1,3,1);r(st[3],bx,by+2,3,1)}}}
    // what lies about the estate's own tile
    const X=p.tx*TILE,Y=p.ty*TILE;
    if(k==='farm'){r(SOIL[c],X+2,Y+11,13,4);r('#d8b04a',X+12,Y+9,3,3);r('#b8903a',X+12,Y+11,3,1)}
    if(k==='lumber')for(let i=0;i<5;i++){const sx=X+Math.floor(h(i,1,11)*14)-2,sy=Y+Math.floor(h(i,2,11)*12)+2;r('#5a3a20',sx,sy+1,3,1);r('#c8a060',sx,sy,3,1)}
    if(k==='mine'){for(let i=0;i<14;i++)r(i%3?'#5a5650':'#7a766e',X+10+Math.floor(h(i,1,12)*7),Y+11+Math.floor(h(i,2,12)*4),1,1);r('#6a6a6a',X+4,Y+15,8,1)}
    if(pier){const pi=PX.pier({dir:pier.dir,len:plen,seed:t.seed});g.drawImage(pi.img,Math.round(pier.x-pi.ox-x0),Math.round(pier.y-pi.oy-y0))}
  });
  cv.x=x0;cv.y=y0;return spr[key]=cv;
}
// boats moored along a port's pier, by level: clear of the deck, and only where their whole hull floats on water
function estateBoats(t,lv){
  const pr=pierOf(t);if(!pr)return[];const len=10+lv*6,out=[],v=pr.dir==='n'||pr.dir==='s',sg=pr.dir==='s'||pr.dir==='e'?1:-1;
  const wet=(x,y)=>tAt(Math.floor(x/TILE),Math.floor(y/TILE))===T_WATER;
  for(let i=0;i<Math.min(2,lv);i++){const b=spr['bt'+t.name+i]||(spr['bt'+t.name+i]=PX.boat({seed:t.seed*3+i,big:i===0}));
    const d=len*(i?.45:.85),x=v?pr.x+(i?-16:16):pr.x+sg*d,y=v?pr.y+sg*d+3:pr.y+(i?-8:13),l=x-b.ax,r=l+b.img.width;
    if(wet(l,y)&&wet(r,y)&&wet(x,y-4)&&wet(l,y-4)&&wet(r,y-4))out.push({b,x,y})}
  return out;
}

/* camps (PX.camp): a bandit camp is one or two tents and a fire on 2 x 2 tiles; its fire's flame (drawFire) and any flag are
   drawn over it */
function campSprite(i,kind,banner){
  const k='camp'+i+(kind||'');if(spr[k])return spr[k];
  const c=PX.camp({kind:kind||'bandit',seed:i*131+7,banner}),cv=c.img;cv.ax=c.ax;cv.ay=c.ay;cv.flag=c.flag;cv.fire=c.fire;return spr[k]=cv;
}

/* sites (sites.js), each drawn by PX.site: a cave in its climate's rock, ruins, a shrine (each on its own tile), a hideout or a
   travellers' camp */
function siteSprite(s){s=siteOf(s);// (plain data too)
  if(s instanceof BanditCamp)return campSprite(s.seed,'bandit');// a bandit camp: the big camp, as the siege camp is drawn
  const c=climAt(s.x,s.y),k='site'+s.type+s.seed+c+(s.kind!=null?s.kind:'');if(spr[k])return spr[k];let cv;
  const b=PX.site({type:s.type,style:'human',seed:s.seed,env:c,mat:ROCK_MAT[c],snow:c==='frost',glow:c==='desert'?'#e8c040':'#7fd8e8',banner:s.banner()});
  if(b.camp){cv=b.img;cv.ax=b.ax;cv.ay=b.ay;cv.flag=b.flag;cv.fire=b.fire}
  // the rest stand on their own tile, drawn 8 below the site's point (the tile's middle); a cave's point is its mouth, in front
  // of its tile (CAVE_MOUTH below the tile's bottom edge)
  else{cv=withShadow(b);cv.ax=b.w/2;cv.ay=b.h+(s.mouth?8+CAVE_MOUTH:0)}
  return spr[k]=cv;
}
