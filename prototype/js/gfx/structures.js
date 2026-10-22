'use strict';
/* ---------- structures on the world map: placed buildings, the ground of estates, camps and sites ---------- */
// Every building comes from the PX engine (../engine) and stands on its own tiles of the grid (lots.js): its picture is
// exactly its cell (16, 32 or 64 pixels a side), drawn among the parties by its front edge. A yard of worn ground lies under
// each; fields, pastures, pits and piers lie flat on the tiles their estate keeps. Flags are their own sprite, waving.

/* placed buildings */
// a building's picture: from the engine by its type, its people, its seed and the climate it stands in; a ruined one is its building
// burnt (charred, with ash); cached on the lot until it changes. The centre stands with its holding's walls (wallOf: read from the
// holding each time, never kept on the lot, so a loaded game draws them as the game it was saved from did). Its ground shadow is a
// picture of its own (sh, and the lot's _sh), laid in the shadow pass under every building (drawShadows), never baked under its walls
function lotSprite(t,l){
  const F=l.k==='centre'?wallOf(t):null;
  if(l._s&&l._st===l.st&&l._lv===l.lv&&l._fort===F)return l._s;const c=climAt((l.x+l.n/2)*TILE,(l.y+l.n/2)*TILE);
  const b=PX.building({type:l.type,style:lotPeople(t,l),seed:l.seed,env:c,snow:c==='frost',lv:l.k==='house'||l.k==='centre'?1:l.lv,...(l.k==='centre'?{view:'top',fort:F}:{})});
  let cv=mkc(b.w,b.h,g=>g.drawImage(b.img,0,0));
  if(l.st==='ruined')cv=charred(cv,l.seed);
  cv.flag=b.flag;cv.sh=l._sh=solidShadow(b.shadow);l._st=l.st;l._lv=l.lv;l._fort=F;return l._s=cv;
}
// burnt: every pixel darkened toward soot, a scatter of ash and the last embers (still whole pixels, never half-see-through)
function charred(src,seed){return mkc(src.width,src.height,g=>{g.drawImage(src,0,0);const d=g.getImageData(0,0,src.width,src.height),a=d.data;
  for(let i=0;i<a.length;i+=4){if(a[i+3]<255)continue;const k=(i>>2),h=hash(k%src.width,k/src.width|0,seed);const f=h<.08?.25:.45;a[i]=a[i]*f+30*(1-f)|0;a[i+1]=a[i+1]*f+24*(1-f)|0;a[i+2]=a[i+2]*f+20*(1-f)|0;if(h>.995){a[i]=232;a[i+1]=106;a[i+2]=42}}
  g.putImageData(d,0,0)})}
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
// the buildings themselves among the parties, each by its front edge: every holding's (HoldingObject draw, estates.js)
function lotEnts(ents,cam,V){for(const t of TOWNS)t.draw(ents,cam,V)}
// one holding's buildings; the centre flies the owner's flag and carries the name
function holdingEnts(t,ents,cam,V){
  if(!t.lots||Math.hypot(t.x-P.x,t.y-P.y)>V+340)return;const now=facCol(t),live0=inSight(t.x,t.y);if(live0)t._memCol=now;const col=live0?now:t._memCol||now;
    for(const l of t.lots){const N=l.n*TILE,X=Math.round(l.x*TILE-cam.x),Y=Math.round((l.y+l.n)*TILE-cam.y);if(X>VW||X+N<0||Y-N>VH+20||Y<-12)continue;
      // (its shadow, in the shadow pass: where its building is drawn, as you last saw it outside your sight; none while it is going up)
      const live=inSight((l.x+l.n/2)*TILE,(l.y+l.n/2)*TILE),sm=live?l.st!=='building'&&lotSprite(t,l):(seenTile(l.x,l.y)||seenTile(l.x+l.n-1,l.y+l.n-1))&&(l._mem||lotSprite(t,l));
      ents.push({y:(l.y+l.n)*TILE-1,sh:sm&&sm.sh?[sm.sh,X,Y-N]:null,f:()=>{
        // outside your sight: the building as you last saw it (fog.js), or nothing if you never saw its ground
        if(!live){if(!seenTile(l.x,l.y)&&!seenTile(l.x+l.n-1,l.y+l.n-1))return;const m=l._mem||lotSprite(t,l);ctx.drawImage(m,X,Y-N);depthPic(m,X,Y-N);if(l.k==='centre'&&(l._memSt||l.st)!=='ruined'){if(m.flag)drawFlag(col,X+m.flag[0],Y-N+m.flag[1],t.seed);txt(t.name,Math.round(t.x-cam.x),Math.round(t.y+16-cam.y),'#a8a496','center')}return}
        const s=lotSprite(t,l),w=t.work&&(t.work.lot?t.work.lot===l.id:t.work.k===l.k||t.work.k==='wall'&&l.k==='centre'),p=w?workProg(t):0;l._mem=s;l._memSt=l.st;
        if(l.st==='building')drawSite(s,X,Y,N,p,false,l.seed);else{ctx.drawImage(s,X,Y-N);depthPic(s,X,Y-N);if(w&&l.st==='built')drawSite(s,X,Y,N,p,true,l.seed)}
        if(ESTATES[l.k]&&sabotaged(t,l.k)){const now=performance.now()/1000;for(let i=0;i<6;i++){const ph=(now*.35+i/6)%1;ctx.globalAlpha=(1-ph)*.6;rect(ctx,ph<.3?'#4a4440':'#7a7470',Math.round(X+N/2-1+Math.sin(ph*6+i)*3+ph*5),Math.round(Y-N*.6-ph*20),2,2)}ctx.globalAlpha=1}
        if(l.k==='centre'&&l.st!=='ruined'){if(s.flag)drawFlag(col,X+s.flag[0],Y-N+s.flag[1],t.seed);holdingLabel(t,cam,X,Y,N)}
        if(ESTATES[l.k]){const m=lotMid(l);if(Math.hypot(m.x-P.x,m.y-P.y)<60)txt(ESTATES[l.k].n,Math.round(m.x-cam.x),Y+8,'#c8c2ae','center')}}});
      if(l.k==='port'&&l.st==='built')for(const o of estateBoats(t,bldLv(t,'port')))ents.push({y:o.y,f:()=>drawMoored(o,cam)});
      if(l.k==='pasture'&&l.st==='built'&&live)penEnts(t,ents,cam)}// (its herd, inside its fence: critters.js)
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
  const ly=full?Y-Math.round(top/2):Math.max(Y-top+2,Y-h-1),span=x1-x0-4,wx=x0+2+Math.round((Math.sin(now/900+seed)*.5+.5)*span),f=Math.floor(now*PEOPLE_STEPS/720)%PEOPLE_STEPS,ws=workerSprite('builder',f,'human',seed%4);
  ctx.drawImage(ws,wx-8,ly-14);if(Math.floor(now/180+seed)%7===0)rect(ctx,'#ffe090',wx+4,ly-8,1,1);
}
// placing a building by hand: its ghost under the pointer, its tiles green where it may stand and red where not
function drawPlace(cam){
  const pl=G.place,t=townBy(pl.town);if(!t||!G.mouse.in)return;const n=pl.n,N=n*TILE,{x,y}=placeAt(G.cam.x+G.mouse.x,G.cam.y+G.mouse.y,n),ok=placeOk(t,pl.k,x,y,n),X=x*TILE-cam.x,Y=y*TILE-cam.y;
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
// the worked ground by its land (estateGround): what lies in a field's furrows (FURROW: the frost's snow, the swamp's standing water,
// each with a chance) and a pasture's marks over the ground itself (PEN: a, the grass grazed short, or showing through the frost's
// trampled snow, the desert's dry tufts, the swamp's rushes; b, the ground trodden bare: dirt, trampled snow, sand, mud and puddles),
// so a pen is the land it stands on, fenced. Between the grass and the frost by the snow's cover there (gfx/worldart.js snowCover).
// Both fade out toward an edge with no plot beyond (soft: px)
const FURROW={frost:[[228,234,242],.85],swamp:[[70,92,96],.3]},EDGE_SOFT=4;
const PEN={grass:{a:[[132,152,72],[150,164,84]],b:[[118,100,62],[100,86,54]]},frost:{a:[[112,124,92],[94,108,78]],b:[[190,198,212],[166,176,194]]},
  desert:{a:[[170,160,84],[142,134,66]],b:[[188,154,96],[168,136,84]]},swamp:{a:[[86,112,56],[70,94,46]],b:[[70,60,40],[84,106,108]]}};
// the flat part of an estate at its level, as one picture placed at (cv.x, cv.y) on the map; kept on its lot (l._eg) until its level
// changes: an estate pulled down and placed again elsewhere, or another world's holding of the same name, draws its own
function estateGround(t,k,lv){
  const l=lotAt(t,k),p=bldSpots(t)[k];if(!l||!p)return null;if(l._eg!==undefined&&l._egLv===lv)return l._eg;l._egLv=lv;
  const c=climAt(p.x,p.y),plots=plotsAt(t,k,lv),pier=k==='port'?pierOf(t):null,plen=pier?10+lv*6:0,tiles=[[p.tx,p.ty],...plots];
  let x0=Math.min(...tiles.map(q=>q[0]))*TILE-2,y0=Math.min(...tiles.map(q=>q[1]))*TILE-2,x1=(Math.max(...tiles.map(q=>q[0]))+1)*TILE+2,y1=(Math.max(...tiles.map(q=>q[1]))+1)*TILE+2;
  if(pier){x0=Math.min(x0,pier.x-plen-6);x1=Math.max(x1,pier.x+plen+6);y0=Math.min(y0,pier.y-plen-6);y1=Math.max(y1,pier.y+plen+6)}
  const has=(x,y)=>plots.some(q=>q[0]===x&&q[1]===y),h=(x,y,s)=>hash(x,y,t.seed*7+s),SC=WorldArt.ensure().snow;
  // (a plot's land: how far into the frost by the snow's cover (0 the grass, 1 the frost), and its pen's colours there)
  const frOf=(tx,ty)=>c==='grass'||c==='frost'?Math.max(0,Math.min(1,(SC[ty*MW+tx]-.3)/.4)):0,penOf=fr=>{const A=PEN[c==='frost'?'grass':c],B=PEN.frost;return{a:A.a.map((q,i)=>mixc(q,B.a[i],fr)),b:A.b.map((q,i)=>mixc(q,B.b[i],fr))}};
  const cv=mkc(x1-x0,y1-y0,g=>{const r=(col,x,y,w,hh)=>rect(g,col,Math.round(x-x0),Math.round(y-y0),w||1,hh||1);
    for(const [tx,ty] of plots){const X=tx*TILE,Y=ty*TILE,edge=(a,b)=>!has(tx+a,ty+b)&&!(tx+a===p.tx&&ty+b===p.ty);
      // (how far a pixel of the plot lies from an edge with no plot beyond, px)
      const eN=edge(0,-1),eS=edge(0,1),eW=edge(-1,0),eE=edge(1,0),ed=(x,y)=>Math.min(eW?x:9,eE?15-x:9,eN?y:9,eS?15-y:9),fr=frOf(tx,ty),px=(col,x,y)=>r(hex(col),X+x,Y+y);
      if(k==='farm'){// a field: furrows of one crop, running one way or the other, the furrows' troughs bare (snow in them in the
        // frost, water now and then in the swamp), frost on the crop in the snow; its edge ragged into the ground round it
        const C=CROPS[c],[c0,c1]=C[Math.floor(h(tx,ty,1)*C.length)],across=h(tx,ty,2)<.5,Q=[rgbOf(c0),rgbOf(c1),rgbOf(SOIL[c])],fu=FURROW[c==='grass'?'frost':c];
        for(let y=0;y<16;y++)for(let x=0;x<16;x++){const e=ed(x,y),n=h(tx*16+x,ty*16+y,3);if(e<2&&n<(e?.25:.55))continue;const m=(across?y:x)%3;let col=Q[m===0?0:m===1?1:2];
          if(m===2&&fu&&h(tx*16+x,ty*16+y,8)<fu[1]*(c==='grass'||c==='frost'?fr:1))col=fu[0];else if(m<2&&fr&&h(tx*16+x,ty*16+y,4)<fr*.22)col=FURROW.frost[0];else if(m<2&&h(tx*16+x,ty*16+y,5)<.02)col=Q[1];px(col,x,y)}}
      else if(k==='pasture'){// grazing ground behind a rail fence (its herd walks on it: critters): the land's own ground, grazed,
        // trodden and fouled in patches (PEN), fewer toward an open edge
        const pn=penOf(fr);for(let y=0;y<16;y++)for(let x=0;x<16;x++){const X1=X+x,Y1=Y+y,n=wnoise2(X1/5,Y1/5,(t.seed%997)+61),q=h(X1,Y1,6),soft=Math.min(1,(ed(x,y)+1)/EDGE_SOFT);
          if(n>.58&&q<.8*soft)px(pn.a[q<.4*soft?0:1],x,y);else if(n<.34&&q<.6*soft)px(pn.b[h(X1>>1,Y1,7)<.3?1:0],x,y);else if(q<.07*soft)px(pn.a[1],x,y)}
        const fence=(fx,fy,w,hh)=>{r('#8a6a42',fx,fy,w,hh);for(let i=0;i<Math.max(w,hh);i+=4)r('#5a3e24',fx+(w>1?i:0),fy+(hh>1?i:0)-1,1,2)};
        if(eN)fence(X,Y+1,16,1);if(eS)fence(X,Y+15,16,1);if(eW)fence(X,Y+1,1,15);if(eE)fence(X+15,Y+1,1,15);
}
      else if(k==='quarry'){// an open pit cut into the ground: its corners rounded and its rim ragged so the ground shows round it,
        // pale spoil thrown up about the rim, the back wall cut in strata, terraces stepping down to a dark floor, the left wall
        // lit and the right in shadow, cut blocks waiting. Plots side by side make one pit (edges only where it ends)
        // (in the frost, snow on its spoil and its rim, more the deeper in it)
        const st=PX.MAT[ROCK_MAT[c]],x0=eW?2:0,x1=eE?13:15,y0=eN?2:0,y1=eS?13:15,hh=(x,y,s)=>h(tx*16+x,ty*16+y,s);
        const rim=(x,y)=>x===x0&&eW||x===x1&&eE||y===y0&&eN||y===y1&&eS;
        const inside=(x,y)=>x>=x0&&x<=x1&&y>=y0&&y<=y1&&!((x===x0&&eW||x===x1&&eE)&&(y===y0&&eN||y===y1&&eS))&&!((x===x0+1&&eW||x===x1-1&&eE)&&(y===y0&&eN||y===y1&&eS)&&hh(x,y,2)<.5)&&!(rim(x,y)&&hh(x,y,3)<.18);
        for(let y=0;y<16;y++)for(let x=0;x<16;x++){
          if(!inside(x,y)){// spoil: gravel about the rim
            if((eN&&y<y0||eW&&x<x0||eE&&x>x1||eS&&y>y1)&&hh(x,y,4)<.22){const sn=fr&&hh(x,y,12)<fr*.7;if(sn)px(FURROW.frost[0],x,y);else r(hh(x,y,5)<.5?st[0]:st[1],X+x,Y+y)}continue}
          const d=eN?y-y0:9+y;let col;// d: how far below the back rim
          if(d===0)col=st[0];else if(d<4)col=(d+(hh(x,0,6)<.3?1:0))%2?st[1]:st[2];else if(d===4)col=st[0];else if(d<7)col=st[2];else if(d===7)col=st[1];
          // the floor: worked rock, mottled, with rubble and a further terrace every few rows down a long pit
          else if(d>8&&(d-8)%6===0)col=st[1];else if(d>8&&(d-8)%6===1)col=st[0];else{const n=hh(x,y,9);col=n<.12?st[1]:n<.55?st[2]:st[3]}
          if(x===x0&&eW&&d>0)col=st[1];if(x===x1&&eE&&d>0)col=st[3];if(y===y1&&eS)col=st[2];
          if(d===0&&fr&&hh(x,y,13)<fr*.75||d===4&&fr&&hh(x,y,14)<fr*.35)col=hex(FURROW.frost[0]);
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
  cv.x=x0;cv.y=y0;return l._eg=cv;
}
// boats moored at a port's pier, drawn as the ships that sail (ships.js shipSprite, moored): a rowing boat (16 x 16) for each
// level up to two, and at a port of the third level a cog (32 x 32) with its sail furled in place of the second. Along a pier
// that runs east or west a boat lies alongside: a rowing boat in front of the deck, a cog (or a second rowing boat) behind
// it, a little water between its waterline and the deck's far edge; along one that runs north or south a boat lies bow on to
// the pier, a little off its side. Each is kept only where its whole hull floats on water, clear of the other boat (else the
// next place along the pier or on its other side; a cog that fits nowhere gives way to a rowing boat). Each: {b:{img,ax,ay},
// x, y (the middle of its waterline), seed, big, box (its hull on the map: [left, top, right, bottom]), ropes (its mooring
// lines, from its posts to the pier: [x0, y0, x1, y1], the boat's end first)}; kept on the port's lot (l._bt) by its level and flag
function estateBoats(t,lv){
  const pr=pierOf(t),l=lotAt(t,'port');if(!pr||!lv||!l)return[];const col=t.owner&&FACS[t.owner]?FACS[t.owner].col:null,key=lv+(col||'');if(l._bt&&l._btK===key)return l._bt;l._btK=key;
  const len=10+lv*6,v=pr.dir==='n'||pr.dir==='s',sg=pr.dir==='s'||pr.dir==='e'?1:-1,out=[];
  const wet=(x,y)=>x>=0&&y>=0&&x<MW*TILE&&y<MH*TILE&&tAt(Math.floor(x/TILE),Math.floor(y/TILE))===T_WATER;// (on the map: not the sea past its edge)
  const span=v?null:[Math.min(pr.x,pr.x+sg*len),Math.max(pr.x,pr.x+sg*len)];
  // the cog first (it needs the most room), then the rowing boats; each its own seed (the holding's, by its place in line)
  const kinds=lv>=3?[['cog',1],['row',0]]:lv>=2?[['row',0],['row',1]]:[['row',0]];
  for(const [kind,i] of kinds){const seed=t.seed+i*7;let done=false;
    for(const k of kind==='cog'?['cog','row']:['row']){if(done)break;const big=k==='cog',sp=shipSprite({seed,big,col:big?col:null,moored:true}),n=sp.width,hh=sp.hull,bx=opaqueBox(sp);
      // the places to try: [side (north-south pier: 1 east of it, -1 west; else 1 in front, -1 behind), how far out along it]
      const along=[i?.45:.85,.65,i?.85:.45,1,.3].map(f=>len*f),places=[],top=sp.top;
      for(const side of v?(i?[-1,1]:[1,-1]):big?[-1]:i?[-1,1]:[1,-1])for(const d of v?along:along.concat([len+8,len+16]))places.push([side,d]);
      for(const [side,d] of places){
        // which way it faces: bow on to a north-south pier; else out to sea (a rowing boat either way, by its seed)
        const face=v?-side:big||PX.hash(seed,5,9)<.6?sg:-sg,hx0=face>0?bx[0]:n-1-bx[2],hx1=face>0?bx[2]:n-1-bx[0];
        let L,y;if(v){y=Math.round(pr.y+sg*d+3);L=side>0?pr.x+8-hx0:pr.x-8-hx1}else{y=side>0?pr.y+14:pr.y-10;L=Math.round(pr.x+sg*d-(n>>1))}
        // its hull on water, alongside the pier (a stretch of it at least 8 long beside the deck), clear of the other boat's
        // hull and what stands on it (gunwale, posts, castles: top)
        const box=[L+hx0,y-hh,L+hx1,y],up=[box[0],y-top,box[2],y];let ok=v||Math.min(box[2],span[1])-Math.max(box[0],span[0])>=8;
        for(let x=box[0];x<=box[2]+7&&ok;x+=8){const xx=Math.min(x,box[2]);if(!wet(xx,y)||!wet(xx,y-hh))ok=false}
        if(!ok||out.some(o=>up[0]<=o.up[2]+2&&up[2]>=o.up[0]-2&&up[1]<=o.up[3]+2&&up[3]>=o.up[1]-2))continue;
        const fk='shf'+(big?1:0)+(big&&col||'')+seed%3,img=face>0?sp:(spr[fk]||(spr[fk]=mkc(n,n,g=>{g.translate(n,0);g.scale(-1,1);g.drawImage(sp,0,0)})));
        // the mooring lines: the bow's to the side of a north-south pier; along an east-west pier, each end's to the deck's edge
        const posts=sp.posts.map(([px,py])=>[L+(face>0?px:n-1-px),y-(n-1)+py]),ropes=[];
        if(v){const p=posts[1];ropes.push([p[0],p[1],pr.x+side*4,p[1]+2])}
        else for(const p of posts){const ex=Math.max(span[0]+1,Math.min(span[1]-1,p[0]-face*2));if(Math.abs(ex-p[0])<8)ropes.push([p[0],p[1],ex,side>0?pr.y+2:pr.y-3])}
        out.push({b:{img,ax:n>>1,ay:n-1},x:L+(n>>1),y,seed,big,box,up,ropes});done=true;break}}}
  return l._bt=out;
}
// a moored boat rocks gently at its lines (a pixel, slower than one under way)
function drawMoored(o,cam){
  const bob=Math.floor(performance.now()/700+o.seed)%2,X=Math.round(o.x-o.b.ax-cam.x),Y=Math.round(o.y-o.b.ay-cam.y)+bob;
  ctx.drawImage(o.b.img,X,Y);depthPic(o.b.img,X,Y);ctx.fillStyle='#4c3c34';
  for(const [x0,y0,x1,y1] of o.ropes){const a=[x0,y0+bob],k=Math.max(Math.abs(x1-a[0]),Math.abs(y1-a[1]),1);
    for(let j=1;j<k;j++)ctx.fillRect(Math.round(a[0]+(x1-a[0])*j/k-cam.x),Math.round(a[1]+(y1-a[1])*j/k-cam.y),1,1)}
}

/* shadows: each standing structure's ground shadow is a picture of its own (sh: solid, the shadow's colour where it falls), and the
   shadow pass (drawShadows, render.js drawWorld: over the flat ground, under everything standing) lays them all as one mask at
   SHADOW.a, once: two shadows never darken each other, and none is drawn over a neighbour in the depth order. A camp's tents
   come from the engine with their shadows baked in: split from them (splitShadow: the half-clear pixels are shadow) */
const SHADOW={a:.28,col:[20,24,12]};let SHM=null;
function solidShadow(src){return mkc(src.width,src.height,g=>{g.drawImage(src,0,0);const d=g.getImageData(0,0,src.width,src.height),a=d.data;
  for(let i=0;i<a.length;i+=4)if(a[i+3]){a[i]=SHADOW.col[0];a[i+1]=SHADOW.col[1];a[i+2]=SHADOW.col[2];a[i+3]=255}g.putImageData(d,0,0)})}
function splitShadow(src){const w=src.width,h=src.height,d=src.getContext('2d').getImageData(0,0,w,h).data,B=new ImageData(w,h),S=new ImageData(w,h);
  for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;if(d[i+3]===255)B.data.set(d.subarray(i,i+4),i);else S.data.set([SHADOW.col[0],SHADOW.col[1],SHADOW.col[2],255],i)}
  const cv=mkc(w,h,g=>g.putImageData(B,0,0));cv.sh=mkc(w,h,g=>g.putImageData(S,0,0));return cv}
// the shadow pass: the entries' sh ([picture, x, y] on the screen) as one mask, laid once
function drawShadows(list){let any=false;for(const e of list)if(e.sh){any=true;break}if(!any)return;const W=ctx.canvas.width,H=ctx.canvas.height;
  if(!SHM||SHM.width!==W||SHM.height!==H)SHM=mkc(W,H,()=>{});const g=SHM.getContext('2d');g.clearRect(0,0,W,H);for(const e of list)if(e.sh)g.drawImage(e.sh[0],e.sh[1],e.sh[2]);
  ctx.globalAlpha=SHADOW.a;ctx.drawImage(SHM,0,0);ctx.globalAlpha=1}

/* camps (PX.camp): a bandit camp is one or two tents and a fire on 2 x 2 tiles; its fire's flame (drawFire) and any flag are
   drawn over it */
function campSprite(i,kind,banner){
  const k='camp'+i+(kind||'');if(spr[k])return spr[k];
  const c=PX.camp({kind:kind||'bandit',seed:i*131+7,banner}),cv=splitShadow(c.img);cv.ax=c.ax;cv.ay=c.ay;cv.flag=c.flag;cv.fire=c.fire;return spr[k]=cv;
}

/* sites (sites.js), each drawn by PX.site: a cave in its climate's rock, ruins, a shrine (each on its own tile), a hideout or a
   travellers' camp */
function siteSprite(s){s=siteOf(s);// (plain data too)
  if(s instanceof BanditCamp)return campSprite(s.seed,'bandit');// a bandit camp: the big camp, as the siege camp is drawn
  const c=climAt(s.x,s.y),k='site'+s.type+s.seed+c+(s.kind!=null?s.kind:'');if(spr[k])return spr[k];let cv;
  const b=PX.site({type:s.type,style:'human',seed:s.seed,env:c,mat:ROCK_MAT[c],snow:c==='frost',glow:c==='desert'?'#e8c040':'#7fd8e8',banner:s.banner()});
  if(b.camp){cv=splitShadow(b.img);cv.ax=b.ax;cv.ay=b.ay;cv.flag=b.flag;cv.fire=b.fire}
  // the rest stand on their own tile, drawn 8 below the site's point (the tile's middle); a cave's point is its mouth, in front
  // of its tile (CAVE_MOUTH below the tile's bottom edge)
  else{cv=mkc(b.w,b.h,g=>g.drawImage(b.img,0,0));cv.sh=solidShadow(b.shadow);cv.ax=b.w/2;cv.ay=b.h+(s.mouth?8+CAVE_MOUTH:0)}
  return spr[k]=cv;
}
