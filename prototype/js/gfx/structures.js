'use strict';
/* ---------- structures on the world map: placed buildings, the ground of estates, camps and sites ---------- */
// Every building is a model of the PX engine (../engine/buildmodels.js, the owner's scale: 32 px the smallest building, 64 the big
// ones, the clusters and the centres, 128 a city's citadel; 16 px objects) and stands on its own tiles of the grid (lots.js): its
// picture is exactly its cell, drawn among the parties by its front edge. Its yard, the model's ragged ground layer, is painted
// into the land under it (gfx/worldart.js townGround: no patch of its own); its shadow joins every other in one pass; fields,
// pastures, pits and piers lie flat on the tiles their estate keeps. Flags are their own sprite, waving.

/* placed buildings */
// a lot's model as it stands (lots.js lotSpec: its culture, people, seed, facing, land, level, the centre's walls) with its snow
function lotModel(t,l,detail){const s=lotSpec(t,l);s.snow=lotSnow(l);if(detail>1)s.detail=detail;return s.tier?PX.centreModel(s):s.kind?PX.clusterModel(s):PX.buildingModel(s)}
// the snow on a lot: the frost's whole, and toward it the frost's cover there (worldart.js snowCover; the model keeps it to thirds).
// (The seasons' hook: a season's snow would scale it, and the overlays change without the models being built again)
function lotSnow(l){const x=(l.x+l.n/2)*TILE,y=(l.y+l.n/2)*TILE;return climAt(x,y)==='frost'?1:WorldArt.ensure().snow[Math.floor(y/TILE)*MW+Math.floor(x/TILE)]}
// a building's picture: its model's standing picture with its snow over it; a ruined one is its building burnt (charred, with ash);
// cached on the lot until it changes (its state, level, facing, the centre's walls). The centre stands with its holding's walls
// (wallOf: read from the holding each time, never kept on the lot, so a loaded game draws them as the game it was saved from did).
// Its ground shadow is the model's (sh, and the lot's _sh), laid in the shadow pass under every building (drawShadows), never
// baked under its walls. A yard painted from another model than this one is painted again (relot)
function lotSprite(t,l){
  const F=l.k==='centre'?wallOf(t):null;
  if(l._s&&l._st===l.st&&l._lv===l.lv&&l._fort===F&&l._yw===l.yaw)return l._s;
  const m=lotModel(t,l),N=m.cell;let cv=mkc(N,N,g=>{g.drawImage(m.img,0,0);if(m.snow)g.drawImage(m.snow.img,0,0)});
  if(l.st==='ruined')cv=charred(cv,l.seed);
  if(l._gimg&&l._gimg!==m.img)relot(l);
  cv.flag=m.flag;cv.rot=l.st==='ruined'?null:m.rotors;cv.sh=l._sh=m.shadow;l._st=l.st;l._lv=l.lv;l._fort=F;l._yw=l.yaw;return l._s=cv;
}
// (its picture at the scene's finer resolution (render.js sceneRes, r px a game px): a holding's centre, at its own size, the same
// model made r times finer, kept on its game-px picture, made ahead (LOT_AHEAD: a model takes tens of ms); every other building at
// WORLD_VIEW.house (lotDrawBox): at its own size the same, else its own picture, a model's px a fine px)
function lotFine(t,l,r){const s=lotSprite(t,l);if(r<=1||lotK(l)<1)return s;if(s._f&&s._fr===r)return s._f;
  const m=lotModel(t,l,r),N=m.cell;let cv=mkc(N,N,g=>{g.drawImage(m.img,0,0);if(m.snow)g.drawImage(m.snow.img,0,0)});if(l.st==='ruined')cv=charred(cv,l.seed);s._f=cv;s._fr=r;return cv}
// (a lot's scale, and where its picture stands: [x, y (its corner), n (its size), k], X the lot's left, Y its front edge, N its picture's
// size: on the lot's front middle)
const lotK=l=>l.k==='centre'?1:WORLD_VIEW.house;
function lotDrawBox(l,X,Y,N){const k=lotK(l),n=N*k;return [X+(N-n)/2,Y-n,n,k]}
function drawLot(t,l,s,X,Y,n){const r=sceneRes(),N=s.width;n=n||N;if(n===N&&r>1&&s._f&&s._fr===r)ctx.drawImage(s._f,X,Y,N,N);else ctx.drawImage(s,X,Y,n,n)}
// (a picture taken down to k of its size, for what reads game px (the depth overdraw, the shadows): kept on it)
const scaledPic=(s,k)=>k===1||!s?s:(s._k&&s._kk===k?s._k:(s._kk=k,s._k=mkc(Math.max(1,Math.round(s.width*k)),Math.max(1,Math.round(s.height*k)),g=>{g.imageSmoothingEnabled=false;g.drawImage(s,0,0,s.width*k,s.height*k)})));
/* a building's rotors over its picture at (X, Y), its corner (the owner, 2026-11-08: "draw mills separately from the building to
   animate it"): a windmill's sails and a watermill's wheel turning (engine PX.ROTORS.spin turns a second, from the clock and its
   seed); still (at its seed's angle) where it stands outside your sight, as you last saw it */
function drawRotors(s,X,Y,seed,still,k=1){if(!s.rot)return;const t=still?0:performance.now()/1000;
  for(const r of s.rot){const f=PX.rotorFrame(r,(seed||0)+t*PX.ROTORS.spin[r.kind]*Math.PI*2);ctx.drawImage(f.img,X+f.ox*k,Y+f.oy*k,f.img.width*k,f.img.height*k);if(k>=1)depthPic(f.img,X+f.ox,Y+f.oy)}}
// a lot's yard for the painted world (worldart.js townGround): its model's ground layer with its snow's over it, {d: RGBA, N, key:
// its material (groundKey)}, kept with the model; the lot remembers which model it was painted from (_gimg)
function lotYard(t,l){const m=lotModel(t,l),N=m.cell,h=m.snow||m.ground;l._gimg=m.img;
  if(!h._gd)h._gd={N,key:m.groundKey,d:mkc(N,N,g=>{g.drawImage(m.ground,0,0);if(m.snow)g.drawImage(m.snow.ground,0,0)}).getContext('2d', { willReadFrequently: true }).getImageData(0,0,N,N).data};
  return h._gd}
// the models of the lots near you made ahead, a few ms a frame (LOT_AHEAD: how far past the view, how long), the nearest holdings
// first, so a town comes into view already built (its chunks are painted ahead with its yards: worldart.js); then the settled camps'
const LOT_AHEAD={r:600,ms:3};
function lotsAhead(V){const t0=performance.now();for(const t of TOWNS.filter(q=>q.lots&&Math.hypot(q.x-P.x,q.y-P.y)<V+LOT_AHEAD.r).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y)))
  for(const l of t.lots){if(l._s&&l._gimg&&(sceneRes()<=1||l._s._fr===sceneRes()))continue;lotSprite(t,l);lotYard(t,l);lotFine(t,l,sceneRes());if(performance.now()-t0>LOT_AHEAD.ms)return}
  for(const cv of FINE_Q){FINE_Q.delete(cv);if(sceneRes()>1)buildFine(cv,cv._want||sceneRes());if(performance.now()-t0>LOT_AHEAD.ms)return}
  // (the settled camps near you too: their tents and pieces (encampments.js warm), so none is made the frame it comes into view)
  const r=sceneRes();for(const s of W.sites){if(!s.warm||s._warmR===r||Math.hypot(s.x-P.x,s.y-P.y)>V+LOT_AHEAD.r)continue;if(s.warm(t0,LOT_AHEAD.ms))s._warmR=r;if(performance.now()-t0>LOT_AHEAD.ms)return}}
// (a site's picture at the scene's finer resolution: its model made r times finer by its maker (siteCanvas mk), with its own touches
// (deco) drawn r times larger; asked for when it is drawn (fineOf), made ahead with the lots (FINE_Q), drawn where it is made (drawFine),
// else the picture itself)
const FINE_Q=new Set();
function fineOf(cv,r){if(r<=1||!cv.mk)return null;if(cv._f&&cv._fr===r)return cv._f;cv._want=r;FINE_Q.add(cv);return null}
function buildFine(cv,r){const m=cv.mk(r),N=m.cell;cv._f=mkc(N,N,g=>{g.drawImage(m.img,0,0);if(m.snow)g.drawImage(m.snow.img,0,0);if(cv.deco){g.scale(r,r);cv.deco(g,cv.width)}});cv._fr=r}
// (k times its size: under 1 its own picture taken down; else made k times finer again (a whole k), drawn k times its size)
function drawFine(cv,X,Y,k=1){if(k<1){ctx.drawImage(cv,X,Y,cv.width*k,cv.height*k);return}const f=fineOf(cv,sceneRes()*Math.round(k));if(f)ctx.drawImage(f,X,Y,cv.width*k,cv.height*k);else ctx.drawImage(cv,X,Y,cv.width*k,cv.height*k)}
// burnt: every pixel darkened toward soot, a scatter of ash and the last embers (still whole pixels, never half-see-through)
function charred(src,seed){return mkc(src.width,src.height,g=>{g.drawImage(src,0,0);const d=g.getImageData(0,0,src.width,src.height),a=d.data;
  for(let i=0;i<a.length;i+=4){if(a[i+3]<255)continue;const k=(i>>2),h=hash(k%src.width,k/src.width|0,seed);const f=h<.08?.25:.45;a[i]=a[i]*f+30*(1-f)|0;a[i+1]=a[i+1]*f+24*(1-f)|0;a[i+2]=a[i+2]*f+20*(1-f)|0;if(h>.995){a[i]=232;a[i+1]=106;a[i+2]=42}}
  g.putImageData(d,0,0)})}
/* a flag on its pole (the owner, 2026-11-07: "align flags in all places"): over a holding, a camp, a site and on the loading
   screen, the same banner its men fly in battle (marchgear.js BATTLE_BANNER, sprites.js bannerCloth: its shape, folds, fly and
   device) flying to the right from a pole FLAG_POLE px tall, a gilt knob atop; outlined inside as every figure is; b a banner
   ({k, col, dev}), f its wave (0, 1); ax, ay: the pole's foot. drawFlag: it waving, its foot at (x, y) */
const FLAG_POLE=15;
function flagSprite(b,f){const k='fl'+b.k+b.col+b.dev+f;if(spr[k])return spr[k];const Q=BATTLE_BANNER,[cw]=Q.cloth[b.k]||Q.cloth.banner,h=FLAG_POLE,g=pgrid(cw+4,h+3),W=PPAL.wood;
  for(let y=2;y<=h+1;y++)pset(g,1,y,W[y>h-2?2:1]);pset(g,1,1,PPAL.gold[1]);pset(g,1,0,PPAL.gold[0]);bannerCloth((x,y,c)=>pset(g,x,y,c),2,3,b,f,Q.cloth,1,Q);
  g.edge=true;poutline(g);const c=pcanvas(g);c.ax=1;c.ay=h+1;return spr[k]=c}
/* (the flag on the map at the lab's scale (WORLD_VIEW.build: a picture's px a fine px), as the battle's men carry theirs: its pole
   z fine px a game px, two across, lit on its left, a round gilt knob; the same cloth (bannerCloth) z times as large, its fly waving z
   times as deep, its device z px a pixel (the cloth's own pixels where its device lies, from the cloth painted with it and without);
   at the old flag's size: ax, ay in game px, drawn back to it (drawFlag). The UI's flags stay flagSprite's) */
function flagFine(b,f){const k='flf'+b.k+b.col+b.dev+f;if(spr[k])return spr[k];const z=Math.round(1/WORLD_VIEW.build),Q=BATTLE_BANNER,[cw]=Q.cloth[b.k]||Q.cloth.banner,h=FLAG_POLE,W=PPAL.wood,G=PPAL.gold;
  const S2={},o={...Q,fly:Q.fly*z,notch:(Q.notch||3)*z},g=pgrid((cw+4)*z,(h+3)*z),x0=2*z,top=3*z;for(const q in Q.cloth)S2[q]=Q.cloth[q].map(v=>v*z);
  for(let y=2*z;y<(h+2)*z;y++){const foot=y>=(h-1)*z;pset(g,z,y,W[foot?1:0]);pset(g,z+1,y,W[foot?3:y%5?1:2])}
  for(const [x,y,c] of [[z,0,G[0]],[z+1,0,G[1]],[z-1,1,G[0]],[z,1,G[0]],[z+1,1,G[1]],[z+2,1,G[2]],[z-1,2,G[1]],[z,2,G[1]],[z+1,2,G[2]],[z+2,2,G[3]],[z,3,G[2]],[z+1,3,G[3]]])pset(g,x,y,c);
  // (its fly's wave: z times the cloth's own, the column's sine as bannerCloth works it)
  const ph=(i,n)=>(i/n*Q.fold+f*.5)*Math.PI,wv=(i,n,fly,a)=>i<fly?0:Math.round(a*Math.sin(ph(i,n)));
  bannerCloth((x,y,c)=>{const i=x-x0;pset(g,x,y+wv(i,cw*z,o.fly,z)-wv(i,cw*z,o.fly,1),c)},x0,top,{...b,dev:null},f,S2,1,o);
  if(b.dev){const A=new Map(),B=new Map();bannerCloth((x,y,c)=>A.set(x+','+y,c),0,0,b,f,Q.cloth,1,Q);bannerCloth((x,y,c)=>B.set(x+','+y,c),0,0,{...b,dev:null},f,Q.cloth,1,Q);
    for(const [p,c] of A){if(B.get(p)===c)continue;const [i,y]=p.split(',').map(Number),r=y-wv(i,cw,Q.fly,1);
      for(let dx=0;dx<z;dx++)for(let dy=0;dy<z;dy++){const j=i*z+dx;pset(g,x0+j,top+r*z+dy+wv(j,cw*z,o.fly,z),c)}}}
  g.edge=true;poutline(g);const c=pcanvas(g);c.ax=1;c.ay=h+1;c.z=z;return spr[k]=c}
const drawFlag=(b,x,y,seed)=>{const s=flagFine(b,Math.floor(performance.now()/400+(seed||0))%2);ctx.drawImage(s,Math.round(x)-s.ax,Math.round(y)-s.ay,s.width/s.z,s.height/s.z)};
// (a holding's flag: its realm's banner and device, yours with the crown, none held a grey one)
const holdingFlag=(t,col)=>({k:'banner',col,dev:t.owner==='player'?'crown':t.owner||null});
// a camp's fire, its foot at (x, y): as it burns (fire.js fireCamp); FLAMES off, its flame through the engine's four frames
const drawFire=(x,y,seed)=>{if(FLAMES.on){fireCamp(x,y,seed);return}const f=Math.floor(performance.now()/110+(seed||0))%4,s=spr['flm'+f]||(spr['flm'+f]=PX.flame(f));ctx.drawImage(s.img,Math.round(x)-s.ax,Math.round(y)-s.ay)};
// the lots of every holding near the view: their fields flat on the ground, under everyone (their yards are painted in: townGround)
function drawLotGround(cam,V){
  lotsAhead(V);
  for(const t of TOWNS){if(!t.lots||Math.hypot(t.x-P.x,t.y-P.y)>V+340)continue;
    // (each at its land's lift, as the land, its buildings and its herd are drawn: worldterrain.js liftAt; flat, the pen's animals stood
    //  above their fence on raised ground (the owner, 2026-11-16: "Why pasture animals are outside of fence"))
    for(const k in bldSpots(t)){const lv=bldLv(t,k);if(!lv)continue;const s=estateGround(t,k,lv);if(!s)continue;const p=bldSpots(t)[k],sx=Math.round(s.x-cam.x),sy=Math.round(s.y-cam.y-(typeof liftAt==='function'?liftAt(p.x,p.y):0));
      const w=s.width/s.z,h=s.height/s.z;if(sx>VW||sy>VH||sx+w<0||sy+h<0)continue;ctx.drawImage(s,sx,sy,w,h)}}
}
// the buildings themselves among the parties, each by its front edge: every holding's (HoldingObject draw, estates.js)
function lotEnts(ents,cam,V){for(const t of TOWNS)t.draw(ents,cam,V)}
// one holding's buildings; the centre flies the owner's flag and carries the name
function holdingEnts(t,ents,cam,V){
  if(!t.lots||Math.hypot(t.x-P.x,t.y-P.y)>V+340)return;const now=facCol(t),live0=inSight(t.x,t.y);if(live0)t._memCol=now;const col=live0?now:t._memCol||now;
    for(const l of t.lots){const N=l.n*TILE,X=Math.round(l.x*TILE-cam.x),Y=Math.round((l.y+l.n)*TILE-cam.y);if(X>VW||X+N<0||Y-N>VH+20||Y<-12)continue;const [bx,by,bn,k]=lotDrawBox(l,X,Y,N);
      // (its shadow, in the shadow pass: where its building is drawn, as you last saw it outside your sight; none while it is going up)
      const live=inSight((l.x+l.n/2)*TILE,(l.y+l.n/2)*TILE),sm=live?l.st!=='building'&&lotSprite(t,l):(seenTile(l.x,l.y)||seenTile(l.x+l.n-1,l.y+l.n-1))&&(l._mem||lotSprite(t,l));
      ents.push({x:(l.x+l.n/2)*TILE,y:(l.y+l.n)*TILE-1,sh:sm&&sm.sh?[scaledPic(sm.sh,k),bx,by]:null,f:()=>{
        // outside your sight: the building as you last saw it (fog.js), or nothing if you never saw its ground
        if(!live){if(!seenTile(l.x,l.y)&&!seenTile(l.x+l.n-1,l.y+l.n-1))return;const m=l._mem||lotSprite(t,l);drawLot(t,l,m,bx,by,bn);depthPic(scaledPic(m,k),bx,by);drawRotors(m,bx,by,l.seed,true,k);if(l.k==='centre'&&(l._memSt||l.st)!=='ruined'){if(m.flag)drawFlag(holdingFlag(t,col),bx+m.flag[0]*k,by+m.flag[1]*k,t.seed);holdingPlaque(t,cam,by+Math.min(0,m.flag?m.flag[1]*k:0),false)}return}
        const s=lotSprite(t,l),w=t.work&&(t.work.lot?t.work.lot===l.id:t.work.k===l.k||t.work.k==='wall'&&l.k==='centre'),p=w?workProg(t):0;l._mem=s;l._memSt=l.st;
        if(l.st==='building')drawSite(s,bx,Y,bn,p,false,l.seed,t.races?.[0]);else{drawLot(t,l,s,bx,by,bn);depthPic(scaledPic(s,k),bx,by);drawRotors(s,bx,by,l.seed,false,k);if(w&&l.st==='built')drawSite(s,bx,Y,bn,p,true,l.seed,t.races?.[0])}
        if(ESTATES[l.k]&&sabotaged(t,l.k))smokePuffs(X+N/2,Y-N*.6);
        if(l.k==='centre'&&l.st!=='ruined'){if(s.flag)drawFlag(holdingFlag(t,col),bx+s.flag[0]*k,by+s.flag[1]*k,t.seed);holdingLabel(t,cam,bx,Y,bn,s.flag?s.flag[1]*k:0)}}});// (no estate's name under it near you: no words on the map's places, the owner, 2026-11-08; its tip names it)
      if(l.k==='port'&&l.st==='built')for(const o of estateBoats(t,bldLv(t,'port')))ents.push({x:o.x,y:o.y,f:()=>drawMoored(o,cam)});
      if(l.k==='pasture'&&l.st==='built'&&live)penEnts(t,PEN_ENTS,cam)}// (its herd, inside its fence: critters.js; with those who move, PEN_ENTS)
  TownWall.ents(t,ents,cam);// (its ring of walls: world/townwalls.js)
}
/* a building site: what is built so far (from the ground up, as the work goes on) behind scaffolding; for an upgrade (full) the
   building stands whole with scaffolding against its side. Its crew, of the holding's people (race), by the site's size
   (SITE.crew): builders on the planks, each walking to a spot (SITE.spots along it, by a hash), hammering there SITE.swings
   overhead blows (the soldiers' frames, people.js), a spark at each strike, then on to the next; one more on the ground
   carrying planks in and going back for more (the owner, 2026-11-04: "add all three"). Off the battle's figures (figsOn), the
   one small builder as before. Drawn only, from the clock and the site's seed */
const SITE={walk:1.2,swing:.42,swings:3,spots:5,crew:[[16,1,0],[32,1,1],[999,2,1]],carry:5};
function drawSite(s,X,Y,N,p,full,seed,race){
  const now=performance.now(),top=Math.round(N*.82),h=full?N:Math.max(2,Math.round(top*p));race=race||'human';
  if(!full&&h>0){const c=s._f&&s._fr===sceneRes()?s._f:s,q=c.width/N;ctx.drawImage(c,0,c.width-h*q,c.width,h*q,X,Y-h,N,h)}// (a centre's at its finer picture: lotFine)
  const x0=full?X+(N>>1):X+1,x1=X+N-2,poles=full?[x0,x1]:N>16?[x0,X+(N>>1),x1]:[x0,x1];scaffold(poles,x0,x1,Y,top,seed);
  const ly=full?Y-Math.round(top/2):Math.max(Y-top+2,Y-h-1),span=Math.max(1,x1-x0-4);
  if(!figsOn()){const wx=x0+2+Math.round((Math.sin(now/900+seed)*.5+.5)*span),f=Math.floor(now*PEOPLE_STEPS/720)%PEOPLE_STEPS;
    ctx.drawImage(workerSprite('builder',f,race,seed%4),wx-8,ly-14);if(Math.floor(now/180+seed)%7===0)rect(ctx,'#ffe090',wx+4,ly-8,1,1);return}
  const S=SITE,[,nb,carry]=S.crew.find(c=>N<=c[0]),T=S.walk+S.swings*S.swing,spot=(i,n)=>x0+2+Math.round(hash(n,seed+i*977,31)*span);
  for(let i=0;i<nb;i++){/* a builder: walking to his spot, then hammering there */
    const t=now/1000+(seed%97)*.37+i*1.9,n=Math.floor(t/T),c=t-n*T,a=spot(i,n-1),b=spot(i,n),y=i?Math.min(Y-2,ly+6):ly;let x,pose,face=b>=a?1:-1;
    if(c<S.walk){x=Math.round(a+(b-a)*c/S.walk);pose=b===a?0:figPose(Math.floor(c*6),true)}
    else{x=b;const q=(c-S.walk)/S.swing,f=Math.floor((q%1)*3);pose=12+f;if(f===1&&(q%1)<.45)spark(x+face*5,y-9)}
    drawFig(figWorker('builder',race,(seed+i)%4,pose),x,y,face)}
  if(carry){/* the plank carrier: in from the side, loaded, and back out for more */
    const t=now/1000+(seed%53)*.41,L=S.carry,n=Math.floor(t/L),c=(t-n*L)/L,inw=n%2===0,sx=X-6,ex=X+(N>>1),x=Math.round(inw?sx+(ex-sx)*c:ex+(sx-ex)*c);
    drawFig(figWorker('builder',race,(seed+3)%4,figPose(Math.floor(t*6),true),inw),x,Y+1,inw?1:-1)}
}
// (a hammer's spark at (x, y): a fine px's bright heart, its arms orange)
const spark=(x,y)=>{const u=1/sceneRes();rect(ctx,'#ffb040',x-u,y,3*u,u);rect(ctx,'#ffb040',x,y-u,u,3*u);rect(ctx,'#fff4c0',x,y,u,u)};
/* (its scaffolding at the lab's scale (a fine px u: render.js sceneRes): poles two fine px across, lit on their left, lashed where
   the planks cross them; a plank every 6 px up, lit on its top, its shade under it; a brace across every other bay. SCAFFOLD: its
   colours, pole lit and shaded, plank top, face and shade, lashing, brace) */
const SCAFFOLD={pole:['#a8845a','#6a4a30'],plank:['#c8a272','#8e6a44','rgba(20,16,12,.35)'],lash:'#3e2e22',brace:'#7a5a38'};
function scaffold(poles,x0,x1,Y,top,seed){const u=1/sceneRes(),S=SCAFFOLD;
  for(let i=0;i+1<poles.length;i++){if((i+(seed|0))%2)continue;const a=poles[i]+2*u,b=poles[i+1],h=Math.min(top-2,12),n=Math.round((b-a)/u);for(let j=0;j<=n;j++)rect(ctx,S.brace,a+j*u,Y-2-Math.round(j*h/n/u)*u,u,u)}
  for(const px of poles){rect(ctx,S.pole[0],px,Y-top,u,top);rect(ctx,S.pole[1],px+u,Y-top,u,top);rect(ctx,S.pole[0],px,Y-top-u,2*u,u)}
  for(let y=Y-4;y>Y-top;y-=6){rect(ctx,S.plank[0],x0-u,y,x1-x0+4*u,u);rect(ctx,S.plank[1],x0-u,y+u,x1-x0+4*u,u);rect(ctx,S.plank[2],x0,y+2*u,x1-x0+2*u,u);for(const px of poles)rect(ctx,S.lash,px,y+2*u,2*u,u)}}
// (smoke over a sabotaged estate from (x, y): puffs rising, drifting and fading, each a lump of fine px lit along its top)
function smokePuffs(x,y){const now=performance.now()/1000,u=1/sceneRes();
  for(let i=0;i<8;i++){const ph=(now*.35+i/8)%1,q=v=>Math.round(v/u)*u,px=q(x-1+Math.sin(ph*6+i)*3+ph*5),py=q(y-ph*20),s=(ph<.3?2:3)*u,dk=ph<.3;ctx.globalAlpha=(1-ph)*.6;
    rect(ctx,dk?'#4a4440':'#7a7470',px,py+u,s+2*u,s);rect(ctx,dk?'#5e5854':'#948e88',px+u,py,s,u)}ctx.globalAlpha=1}
// placing a building by hand: its ghost under the pointer, its tiles green where it may stand and red where not
function drawPlace(cam){
  const pl=G.place,t=townBy(pl.town);if(!t||!G.mouse.in)return;const n=pl.n,N=n*TILE,{x,y}=placeAt(G.cam.x+G.mouse.x,liftGround(G.cam.x+G.mouse.x,G.cam.y+G.mouse.y).y,n),ok=placeOk(t,pl.k,x,y,n),X=x*TILE-cam.x,Y=y*TILE-cam.y;
  if(!pl._s){const s={culture:holdingCulture(t),people:t.races[0],seed:pl.seed,env:climAt(t.x,t.y)},b=PX.MODEL_SIZES.types[pl.type]?PX.buildingModel({...s,type:pl.type}):PX.clusterModel({...s,kind:pl.type});pl._s=b.img}
  ctx.fillStyle=ok?'rgba(120,220,110,.28)':'rgba(230,90,80,.32)';ctx.fillRect(X,Y,N,N);ctx.globalAlpha=.75;const [bx,by,bn]=lotDrawBox({k:pl.k},X,Y+N,N);ctx.drawImage(pl._s,bx,by,bn,bn);ctx.globalAlpha=1;// (as it will stand: drawLot's box)
  ctx.strokeStyle=ok?'#78dc6e':'#e65a50';ctx.lineWidth=1;ctx.strokeRect(X+.5,Y+.5,N-1,N-1);
  txt('Place the '+(pl.k==='house'?'house':ESTATES[pl.k].n.toLowerCase())+' of '+t.name+', click to build, Esc to stop',VW/2,VH-8,'#e8b94a','center');
}
// over a holding's centre, its bar (holdingPlaque): in sight, with the lords inside. The holding flies one flag, its owner's, from its centre.
function holdingLabel(t,cam,X,Y,N,fy=0){holdingPlaque(t,cam,Y-N+Math.min(0,fy),true)}// (over its flag, if it flies one higher than its roof)
/* a holding's bar over it (the owner, 2026-11-10: "a panel bar above holding to show name (once discovered), lord crown visit icon and
   lock icon in one place"): a dark plank, edged, its words and marks in a row: a padlock while its gate will not have you (GATE_LOCK),
   its name once you have discovered it (else its kind, greyed: Discovery.nameOf), a small crown for each lord inside (lordCrown; in
   your sight only: no one is seen inside from afar), a red "!" while it is besieged. Queued as the holding is drawn (in sight or as
   you last saw it), drawn over everything with the map's words (drawPlaques, render.js): never hidden by those who walk by it; a
   remembered one where you know the land, a little dimmer. Its owner's small shield before its name (plaqueShield; free folk's in
   plain brown). Then (the owner, 2026-11-11: its cloth ribbon "seems a bit off and not like ui": it was the map's own pixels, so it
   grew with the zoom, huge and blocky on a phone, its tails off the screen): a plate of the HUD's own (the main menu's buttons': a
   dark face in a thin gold frame, a black hairline and a dark band inside it, a diamond at each end), drawn on the screen's pixels at
   one size whatever the zoom (smaller only as the map is zoomed far out), its name in the titles' face (style.css --display).
   HOLD_PLAQUE, screen px at full size: its height, its sides' padding, the gap between its marks, how far over the holding it
   stands, at most so many crowns; art: screen px a pixel of its marks' pictures; text: its name's size; full: the zoom (screen px a
   map px) from which it is full size, least: its least share of that zoomed further out; stud: a diamond's side; its colours */
const HOLD_PLAQUE={on:false,h:30,pad:11,gap:5,over:10,most:4,art:2,text:15,full:2,least:.7,stud:7,
  face:['#2c241b','#14100c'],band:'#2b2218',edge:'#000000',trim:'#9a7a3e',trimHi:'#e2bd68',studFace:'#15110c',shadow:'rgba(0,0,0,.45)',
  name:'#f3e4bd',kind:'#a39a86',siege:'#ff6a60',free:'#8a7a5a',dim:.78};
// (the titles' face, read once off the page: style.css --display; a serif where there is none)
let PLAQUE_FONT=null;
const plaqueFont=()=>PLAQUE_FONT||(PLAQUE_FONT=(typeof getComputedStyle==='function'&&getComputedStyle(document.documentElement).getPropertyValue('--display').trim())||'Georgia, serif');
let PLAQUEQ=[];
function holdingPlaque(t,cam,top,live){PLAQUEQ.push({t,top:top+cam.y-LIFT_NOW,live})}
function lockPic(){const L=GATE_LOCK;if(!L.pic)L.pic=mkc(L.art[0].length,L.art.length,g=>L.art.forEach((r,y)=>[...r].forEach((c,x)=>{if(L.col[c]){g.fillStyle=L.col[c];g.fillRect(x,y,1,1)}})));return L.pic}
// (its owner's shield: a heater, flat-topped, in its colours with a pale down it, gold-rimmed, lit on its left; made once a colour)
const PLAQUE_SHIELD=['ooooooooo','orrrrrrro','oxxxpxxdo','oxxxpxxdo','oxxxpxxdo','oxxxpxxdo','.oxxpxdo.','.oxxpxdo.','..oxpdo..','...oxo...','....o....'],SHIELD_PICS=new Map();
function plaqueShield(col){let c=SHIELD_PICS.get(col);if(c)return c;const A=PLAQUE_SHIELD,C={o:'#120b05',r:'#c9a25a',x:col,p:PX.mix(col,'#ffffff',.45),d:PX.shade(col,.7)};
  c=mkc(A[0].length,A.length,g=>A.forEach((r,y)=>[...r].forEach((q,x)=>{if(!C[q])return;g.fillStyle=q==='x'&&x<3&&y<6?PX.mix(col,'#ffffff',.18):C[q];g.fillRect(x,y,1,1)})));SHIELD_PICS.set(col,c);return c}
/* (the bar's plate, in its own px (drawPlaques' transform): its shadow, its gold frame lit along its top, the black hairline and the
   dark band inside it, its face, a diamond at each end. x0, y0: its corner, w its width) */
function drawPlaquePlate(x0,y0,w){const H=HOLD_PLAQUE,h=H.h,s=H.stud,r=(x,y,ww,hh,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,ww,hh)};
  r(x0+1,y0+3,w,h,H.shadow);r(x0-1,y0-1,w+2,h+2,H.edge);r(x0,y0,w,h,H.trim);r(x0,y0,w,1,H.trimHi);r(x0+1,y0+1,w-2,h-2,H.edge);r(x0+2,y0+2,w-4,h-4,H.band);
  const g=ctx.createLinearGradient(0,y0+4,0,y0+h-4);g.addColorStop(0,H.face[0]);g.addColorStop(1,H.face[1]);r(x0+4,y0+4,w-8,h-8,g);
  for(const sx of [x0,x0+w]){ctx.save();ctx.translate(sx,y0+h/2);ctx.rotate(Math.PI/4);r(-s/2-1,-s/2-1,s+2,s+2,H.edge);r(-s/2,-s/2,s,s,H.trim);r(-s/2+1,-s/2+1,s-2,s-2,H.studFace);ctx.restore()}}
/* (the bars queued this frame, onto the screen with the map's words: render.js; the ctx's transform the world's). Each on the screen's
   own pixels, k of its full size by the zoom (HOLD_PLAQUE full, least), standing over its holding: its plate, then in a row its
   owner's shield, the padlock, its name (mapTxt, by that name: tests listen to it), the crowns, the siege's mark */
function drawPlaques(cam){const Q=PLAQUEQ;PLAQUEQ=[];if(!HOLD_PLAQUE.on||!Q.length)return;const H=HOLD_PLAQUE,m=ctx.getTransform(),sc=Math.hypot(m.a,m.b)||1,dpr=dprOf(),k=clamp(sc/dpr/H.full,H.least,1),U=dpr*k,A=H.art,st={font:plaqueFont(),px:H.text*k,weight:700};
  for(const p of Q){const t=p.t,lock=GATES.on&&!Gates.admits(t).ok,cr=p.live?lordsInside(t).slice(0,H.most).map(l=>FACS[l.fac].col):[],sg=p.live&&besieged(t);
    const known=Discovery.named(t),name=Discovery.nameOf(t),col=known?H.name:H.kind,pic=mapTxtPic(name,col,'left',sc,dpr,st),tw=(pic.width-2*pic.ox)/U,asc=(pic.oy-pic.ox)/U;
    const own=t.owner&&(t.owner==='player'||FACS[t.owner])?(p.live?facCol(t):t._memCol||facCol(t)):H.free,sh=plaqueShield(own),lp=lock?lockPic():null,cw=LORD_CROWN[0].length*A;
    const w=Math.round(H.pad*2+sh.width*A+H.gap+(lp?lp.width*A+H.gap:0)+tw+(cr.length?H.gap+cr.length*(cw+2)-2:0)+(sg?H.gap+3:0)),x0=-Math.round(w/2),y0=-(H.over+H.h),mid=y0+H.h/2;
    const wx=t.x-cam.x,wy=p.top-cam.y,ax=Math.round(m.a*wx+m.c*wy+m.e),ay=Math.round(m.b*wx+m.d*wy+m.f);
    ctx.save();ctx.setTransform(U,0,0,U,ax,ay);ctx.imageSmoothingEnabled=false;if(!p.live)ctx.globalAlpha=H.dim;drawPlaquePlate(x0,y0,w);
    // (its marks and its name, in a row)
    let x=x0+H.pad;const art=c=>{ctx.drawImage(c,x,Math.round(mid-c.height*A/2),c.width*A,c.height*A);x+=c.width*A};
    art(sh);x+=H.gap;if(lp){art(lp);x+=H.gap}
    mapTxt(name,x,mid+asc/2,col,'left',st);x+=Math.round(tw);
    if(cr.length){x+=H.gap;for(const c of cr){art(lordCrown(c));x+=2}x-=2}
    if(sg&&Math.floor(performance.now()/400)%2){x+=H.gap;ctx.fillStyle=H.siege;ctx.fillRect(x,y0+7,3,H.h-19);ctx.fillRect(x,y0+H.h-10,3,3)}
    ctx.restore()}}
/* (a lord inside: a small gold crown set with his realm's colour, dark-edged (the owner, 2026-11-10: "a weird blue square dot", a
   3-pixel square before; then "make a bar more interesting"); its pixels (o outline, h light, g gold, d shade, c his colour), made once a colour) */
const LORD_CROWN=['.o..o..o.','ohoohooho','ohoohooho','ohgghggho','ohhhhhhho','ogcgcgcdo','odddddddo','ooooooooo'],CROWN_PICS=new Map();
function lordCrown(col){let c=CROWN_PICS.get(col);if(c)return c;const A=LORD_CROWN,C={o:'#1a1512',h:'#fff0b0',g:'#e8b94a',d:'#a8761e',c:col};
  c=mkc(A[0].length,A.length,g=>A.forEach((r,y)=>[...r].forEach((q,x)=>{if(C[q]){g.fillStyle=C[q];g.fillRect(x,y,1,1)}})));CROWN_PICS.set(col,c);return c}
/* a gate that will not have you yet (world/gates.js): a gold padlock in the holding's bar (holdingPlaque); its pixels (o outline,
   h light, g gold, d shade, k keyhole), made once (lockPic) */
const GATE_LOCK={art:['..ooooo..','.oghhhgo.','.og...go.','.og...go.','.og...go.','ooooooooo','ohhhhhhgo','ohgggggdo','ohggkggdo','ohggkggdo','ogddddddo','ooooooooo'],
  col:{o:'#2a1a0a',h:'#fff0b0',g:'#e8b94a',d:'#a8761e',k:'#2a1a0a'},pic:null};

/* estates: fields, pastures, pits and piers lie flat on the tiles they keep; their buildings are lots like any other */
const ROCK_MAT={grass:'stone',frost:'stone',desert:'sandstone',swamp:'stone'};
// which way the water lies from a port's shore tile (its building's tile beside the water: lots.js pierSpot, its front middle
// first), and where its pier starts (the shore's edge)
function pierOf(t){
  const l=lotAt(t,'port');if(!l)return null;const s=pierSpot(l.x,l.y,l.n);if(!s)return null;const [a,b]={s:[0,1],e:[1,0],w:[-1,0],n:[0,-1]}[s.dir];
  return{dir:s.dir,x:s.tx*TILE+8+a*8,y:s.ty*TILE+8+b*8};
}
// the worked ground by its land (estateGround): what lies in a field's furrows (FURROW: the frost's snow, the swamp's standing water,
// each with a chance) and a pasture's marks over the ground itself (PEN: a, the grass grazed short, or showing through the frost's
// trampled snow, the desert's dry tufts, the swamp's rushes; b, the ground trodden bare: dirt, trampled snow, sand, mud and puddles),
// so a pen is the land it stands on, fenced. Between the grass and the frost by the snow's cover there (gfx/worldart.js snowCover).
// Both fade out toward an edge with no plot beyond (soft: px)
const FURROW={frost:[[228,234,242],.85],swamp:[[70,92,96],.3]},EDGE_SOFT=4;
const PEN={grass:{a:[[132,152,72],[150,164,84]],b:[[118,100,62],[100,86,54]]},frost:{a:[[112,124,92],[94,108,78]],b:[[190,198,212],[166,176,194]]},
  desert:{a:[[170,160,84],[142,134,66]],b:[[156,124,80],[138,108,68]]},swamp:{a:[[86,112,56],[70,94,46]],b:[[70,60,40],[84,106,108]]}};
// (a pen's rail fence at the lab's scale: its rail lit along its top, its shade beside it, a post every PEN_FENCE.post fine px, lit
// at its left, its cap pale; rail, post, cap, shade)
const PEN_FENCE={post:8,rail:['#b08a5a','#7a5a38'],posts:['#9a7444','#5a3e24'],cap:'#c8a070',shade:'rgba(30,24,12,.3)'};
// the flat part of an estate at its level, as one picture placed at (cv.x, cv.y) on the map, at the lab's scale (cv.z fine px a game
// px: WORLD_VIEW.build; drawn back to its size, drawLotGround); kept on its lot (l._eg) until its level changes: an estate pulled
// down and placed again elsewhere, or another world's holding of the same name, draws its own
function estateGround(t,k,lv){
  const l=lotAt(t,k),p=bldSpots(t)[k];if(!l||!p)return null;if(l._eg!==undefined&&l._egLv===lv)return l._eg;l._egLv=lv;
  const c=climAt(p.x,p.y),plots=plotsAt(t,k,lv),pier=k==='port'?pierOf(t):null,plen=pier?10+lv*6:0,tiles=[[l.x,l.y],[l.x+l.n-1,l.y+l.n-1],...plots];
  let x0=Math.min(...tiles.map(q=>q[0]))*TILE-2,y0=Math.min(...tiles.map(q=>q[1]))*TILE-2,x1=(Math.max(...tiles.map(q=>q[0]))+1)*TILE+2,y1=(Math.max(...tiles.map(q=>q[1]))+1)*TILE+2;
  if(pier){x0=Math.min(x0,pier.x-plen-6);x1=Math.max(x1,pier.x+plen+6);y0=Math.min(y0,pier.y-plen-6);y1=Math.max(y1,pier.y+plen+6)}
  const has=(x,y)=>plots.some(q=>q[0]===x&&q[1]===y),h=(x,y,s)=>hash(x,y,t.seed*7+s),SC=WorldArt.ensure().snow,z=Math.round(1/WORLD_VIEW.build),n2=TILE*z;
  // (a plot's land: how far into the frost by the snow's cover (0 the grass, 1 the frost), and its pen's colours there)
  const frOf=(tx,ty)=>c==='grass'||c==='frost'?Math.max(0,Math.min(1,(SC[ty*MW+tx]-.3)/.4)):0,penOf=fr=>{const A=PEN[c==='frost'?'grass':c],B=PEN.frost;return{a:A.a.map((q,i)=>mixc(q,B.a[i],fr)),b:A.b.map((q,i)=>mixc(q,B.b[i],fr))}};
  const cv=mkc((x1-x0)*z,(y1-y0)*z,g=>{
    for(const [tx,ty] of plots){const FX=tx*n2,FY=ty*n2,edge=(a,b)=>!has(tx+a,ty+b),f=(col,x,y,w,hh)=>rect(g,col,FX+x-x0*z,FY+y-y0*z,w||1,hh||1);// (against its building too: ragged into its yard; f: a fine px of the plot)
      // (how far a game px of the plot lies from an edge with no plot beyond, px)
      const eN=edge(0,-1),eS=edge(0,1),eW=edge(-1,0),eE=edge(1,0),ed=(x,y)=>Math.min(eW?x:9,eE?15-x:9,eN?y:9,eS?15-y:9),fr=frOf(tx,ty),hh=(x,y,s)=>h(FX+x,FY+y,s);
      if(k==='farm')farmPlot(t,tx,ty,c,fr,ed,(col,x,y)=>f(hex(col),x*z,y*z,z,z),z,(col,x,y)=>f(hex(col),x,y,1,1));// a field: its crop in rows of plants, what stands on it (gfx/worldart.js farmPlot, shaded by the fine px)
      else if(k==='pasture'){// grazing ground behind a rail fence (its herd walks on it: critters): the land's own ground, grazed,
        // trodden and fouled in patches (PEN) by the fine px, fewer toward an open edge
        const pn=penOf(fr),A=pn.a.map(hex),B=pn.b.map(hex);for(let y=0;y<n2;y++)for(let x=0;x<n2;x++){const n=wnoise2((FX+x)/z/5,(FY+y)/z/5,(t.seed%997)+61),q=hh(x,y,6),soft=Math.min(1,(ed(x/z|0,y/z|0)+1)/EDGE_SOFT);
          if(n>.58&&q<.8*soft)f(A[q<.4*soft?0:1],x,y);else if(n<.34&&q<.6*soft)f(B[hh(x>>1,y,7)<.3?1:0],x,y);else if(q<.07*soft)f(A[1],x,y)}
        const F=PEN_FENCE,S=F.post;
        for(const [on,y] of [[eN,2],[eS,n2-3]])if(on){f(F.rail[0],0,y,n2,1);f(F.rail[1],0,y+1,n2,1);f(F.shade,0,y+2,n2,1);for(let x=1;x<n2;x+=S){f(F.posts[0],x,y-2,1,4);f(F.posts[1],x+1,y-2,1,4);f(F.cap,x,y-2,2,1)}}
        for(const [on,x] of [[eW,1],[eE,n2-3]])if(on){f(F.rail[0],x,2,1,n2-2);f(F.rail[1],x+1,2,1,n2-2);f(F.shade,x+2,3,1,n2-3);for(let y=2+S;y<n2;y+=S){f(F.posts[0],x,y-1,1,3);f(F.posts[1],x+1,y-1,1,3);f(F.cap,x,y-2,2,1)}}}
      else if(k==='quarry'){/* an open pit cut into the ground: its corners rounded and its rim ragged so the ground shows round it,
        pale spoil thrown up about the rim, the back wall cut in strata, terraces stepping down to a dark floor, the left wall lit
        and the right in shadow, cut blocks waiting, rubble, now and then a ladder down its back wall. Plots side by side make one pit
        (edges only where it ends). In the frost, snow on its spoil and its rim, more the deeper in it. By the fine px */
        const st=PX.MAT[ROCK_MAT[c]],a0=eW?2*z:0,a1=eE?n2-1-2*z:n2-1,b0=eN?2*z:0,b1=eS?n2-1-2*z:n2-1,R=3,snow=hex(FURROW.frost[0]);
        const cut=(x,y)=>{const cx=eW&&x<a0+R?a0+R:eE&&x>a1-R?a1-R:null,cy=eN&&y<b0+R?b0+R:eS&&y>b1-R?b1-R:null;return cx!=null&&cy!=null&&Math.hypot(x-cx,y-cy)>R+.3},
          rim=(x,y)=>x===a0&&eW||x===a1&&eE||y===b0&&eN||y===b1&&eS,inside=(x,y)=>x>=a0&&x<=a1&&y>=b0&&y<=b1&&!cut(x,y)&&!(rim(x,y)&&hh(x,y,3)<.25);
        for(let y=0;y<n2;y++)for(let x=0;x<n2;x++){
          if(!inside(x,y)){// spoil: gravel about the rim
            if((eN&&y<b0||eW&&x<a0||eE&&x>a1||eS&&y>b1)&&hh(x,y,4)<.22)f(fr&&hh(x,y,12)<fr*.7?snow:hh(x,y,5)<.5?st[0]:st[1],x,y);continue}
          const d=eN?y-b0:18+y,s=Math.floor((d+(hh(x>>3,0,6)<.35?1:0))/2);let col;// d: how far below the back rim; s its stratum
          if(d<2)col=st[0];else if(d<8)col=s%2?st[1]:st[2];else if(d<10)col=d===8?st[0]:st[1];else if(d<14)col=st[2];else if(d<16)col=st[1];
          // the floor: worked rock, mottled, a pebble lit over its shade, and a further terrace every few rows down a long pit
          else if((d-16)%12<2)col=st[1];else if((d-16)%12<4)col=st[0];else{const n=hh(x,y,9);col=n<.04?st[0]:n<.14?st[1]:n<.55?st[2]:st[3]}
          if(eW&&x<a0+2&&d>1)col=x===a0?st[0]:st[1];if(eE&&x>a1-2&&d>1)col=st[3];if(eS&&y>b1-2)col=st[2];
          if(d<2&&fr&&hh(x,y,13)<fr*.75||d>=8&&d<10&&fr&&hh(x,y,14)<fr*.35)col=snow;
          f(col,x,y)}
        // a cut block or two on the floor, lit on top, shaded at its right and under it
        for(let i=0;i<1+(hh(0,0,7)<.5?1:0);i++){const bx=a0+4+Math.floor(hh(i,1,8)*Math.max(1,a1-a0-14)),by=Math.max(b0+18,Math.min(b1-6,b0+18+Math.floor(hh(i,2,8)*6)));
          f(st[0],bx,by,6,1);f(st[1],bx,by+1,5,2);f(st[2],bx+5,by+1,1,2);f(st[3],bx,by+3,6,1);f(st[3],bx+6,by+1,1,3)}
        if(eN&&hh(1,1,21)<.35){const lx=a0+6+Math.floor(hh(2,1,21)*Math.max(1,a1-a0-16));f('#8a6a42',lx,b0+1,1,15);f('#5a3e24',lx+3,b0+1,1,15);for(let y=b0+2;y<b0+16;y+=3)f('#b08a5a',lx+1,y,2,1)}}}
    // (what lies about its building is the model's: its yard, its dressing)
    if(pier){const pi=pierPic(pier.dir,plen,t.seed,z);g.drawImage(pi.img,Math.round((pier.x-pi.ox-x0)*z),Math.round((pier.y-pi.oy-y0)*z))}
  });
  cv.x=x0;cv.y=y0;cv.z=z;return l._eg=cv;
}
/* a port's pier at the lab's scale (z fine px a game px; the engine's PX.pier's ground and offsets): a deck of planks across it, lit
   along its near edge, each its own tone (an old one weathered dark), nailed; its side's beam, piles under it every PIER.pile fine px,
   lit at their left, the water foaming at their feet; a bollard at its end, more along a long one. {img, ox, oy: game px} */
const PIER={pile:10,foam:'#d8ecf0',ripple:'#9cc4d2',nail:'#3a3028'};
function pierPic(dir,len,seed,z){len=Math.max(8,len|0);const ver=dir==='n'||dir==='s',Pk=PX.MAT.plank,Lg=PX.MAT.log,Tm=PX.MAT.timber,Q=PIER,m=z,hs=(a,b)=>PX.hash(a,b,seed);
  const post=(f,x,y,h)=>{f(Tm[0],x,y,1,h);f(Tm[1],x+1,y,1,h);f(Tm[3],x+2,y,1,h);f(Pk[0],x,y,3,1)};
  if(!ver){const L=len*z,img=mkc((len+3)*z,13*z,g=>{const f=(c,x,y,w=1,h=1)=>rect(g,c,m+x,m+y,w,h);
      for(let x=0;x<L;x++){const i=x>>2,u=x&3,tone=hs(i,1)<.1?PX.mix(Pk[1],Pk[2],.5):hs(i,2)<.5?Pk[0]:PX.mix(Pk[0],Pk[1],.5);for(let y=4;y<12;y++)f(u===3?Pk[2]:y===4?PX.mix(tone,Pk[2],.5):y===11?PX.mix(tone,'#ffffff',.1):tone,x,y);if(u===1&&hs(i,3)<.5){f(Q.nail,x,5);f(Q.nail,x,10)}}
      for(let x=0;x<L;x++){f(Pk[1],x,12);f(Pk[2],x,13,1,2);f(Pk[3],x,15)}
      for(let x=dir==='e'?6:2;x<L-1;x+=Q.pile){f(Lg[0],x,16,1,5);f(Lg[1],x+1,16,1,5);f(Lg[3],x+2,16,1,5);f(Q.ripple,x-1,21,5,1);f(Q.foam,x,21,3,1)}
      post(f,dir==='e'?L-3:0,0,12);if(len>=24)post(f,Math.round(L/2),1,4)});
    return{img,ox:(dir==='e'?0:len)+1,oy:6}}
  const L=len*z,img=mkc(11*z,(len+5)*z,g=>{const f=(c,x,y,w=1,h=1)=>rect(g,c,m+x,m+y,w,h);
    for(let y=0;y<L;y++){const i=y>>2,u=y&3,tone=hs(1,i)<.1?PX.mix(Pk[1],Pk[2],.5):hs(2,i)<.5?Pk[0]:PX.mix(Pk[0],Pk[1],.5);for(let x=2;x<14;x++)f(u===3?Pk[2]:x===2?PX.mix(tone,'#ffffff',.1):x===13?PX.mix(tone,Pk[2],.4):tone,x,y);if(u===1&&hs(3,i)<.5){f(Q.nail,3,y);f(Q.nail,12,y)}f(Pk[2],14,y);f(Pk[3],15,y)}
    // (its piles' heads along both sides, seen from over them)
    for(let y=4;y<L;y+=Q.pile)for(const x of [0,16]){f(Lg[0],x,y,2,1);f(Lg[1],x,y+1,1,2);f(Lg[2],x+1,y+1,1,2);f(Lg[3],x,y+3,2,1)}
    if(dir==='s'){f(Pk[1],2,L,14,1);f(Pk[2],2,L+1,14,2);f(Pk[3],2,L+3,14,1);for(const x of [4,11]){f(Lg[0],x,L+4,1,2);f(Lg[3],x+1,L+4,1,2);f(Q.foam,x-1,L+5,4,1)}}
    else{f(Tm[0],2,0,12,1);f(Tm[1],2,1,12,1)}});
  return{img,ox:4+1,oy:(dir==='s'?0:len)+1}}
// boats moored at a port's pier, drawn as the ships that sail (ships.js shipSprite, moored): a rowing boat (16 x 16) for each
// level up to two, and at a port of the third level a cog (32 x 32) with its sail furled in place of the second. Along a pier
// that runs east or west a boat lies alongside: a rowing boat in front of the deck, a cog (or a second rowing boat) behind
// it, a little water between its waterline and the deck's far edge; along one that runs north or south a boat lies bow on to
// the pier, a little off its side. Each is kept only where its whole hull floats on water, clear of the other boat (else the
// next place along the pier or on its other side; a cog that fits nowhere gives way to a rowing boat). Each: {b:{img,hi,ax,ay}
// (hi: its picture at the lab's scale, drawn at img's size), x, y (the middle of its waterline), seed, big, box (its hull on the
// map: [left, top, right, bottom]), ropes (its mooring lines, from its posts to the pier: [x0, y0, x1, y1], the boat's end first)};
// kept on the port's lot (l._bt) by its level and flag
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
        const fk='shf'+(big?1:0)+(big&&col||'')+seed%3,flip=(k,c)=>spr[k]||(spr[k]=mkc(c.width,c.height,g=>{g.translate(c.width,0);g.scale(-1,1);g.drawImage(c,0,0)})),img=face>0?sp:flip(fk,sp),hi=sp.hi&&(face>0?sp.hi:flip(fk+'h'+sp.hi.width,sp.hi));
        // the mooring lines: the bow's to the side of a north-south pier; along an east-west pier, each end's to the deck's edge
        const posts=sp.posts.map(([px,py])=>[L+(face>0?px:n-1-px),y-(n-1)+py]),ropes=[];
        if(v){const p=posts[1];ropes.push([p[0],p[1],pr.x+side*4,p[1]+2])}
        else for(const p of posts){const ex=Math.max(span[0]+1,Math.min(span[1]-1,p[0]-face*2));if(Math.abs(ex-p[0])<8)ropes.push([p[0],p[1],ex,side>0?pr.y+2:pr.y-3])}
        out.push({b:{img,hi,ax:n>>1,ay:n-1},x:L+(n>>1),y,seed,big,box,up,ropes});done=true;break}}}
  return l._bt=out;
}
// a moored boat rocks gently at its lines (a pixel, slower than one under way): its picture at the lab's scale (hi), its lines a fine
// px thick (u: render.js sceneRes), sagging a little between
function drawMoored(o,cam){
  const bob=Math.floor(performance.now()/700+o.seed)%2,X=Math.round(o.x-o.b.ax-cam.x),Y=Math.round(o.y-o.b.ay-cam.y)+bob,n=o.b.img.width,u=1/sceneRes(),q=v=>Math.round(v/u)*u;
  ctx.drawImage(o.b.hi||o.b.img,X,Y,n,n);depthPic(o.b.img,X,Y);ctx.fillStyle='#4c3c34';
  for(const [x0,y0,x1,y1] of o.ropes){const a=[x0,y0+bob],k=Math.max(Math.abs(x1-a[0]),Math.abs(y1-a[1]),1)/u;
    for(let j=1;j<k;j++){const s=j/k;ctx.fillRect(q(a[0]+(x1-a[0])*s-cam.x),q(a[1]+(y1-a[1])*s+Math.sin(s*Math.PI)*.8-cam.y),u,u)}}
}

/* shadows: each standing structure's ground shadow is a picture of its own (sh: solid, the shadow's colour where it falls), and the
   shadow pass (drawShadows, render.js drawWorld: over the flat ground, under everything standing) lays them all as one mask at
   SHADOW.a (the models' own shade, PX.MODEL_SHADE), once: two shadows never darken each other, and none is drawn over a neighbour
   in the depth order. The models' shadows come solid, in the shadow's colour */
const SHADOW={a:PX.MODEL_SHADE,col:[20,24,12]};let SHM=null;
// the shadow pass: the entries' sh ([picture, x, y] on the screen) as one mask, laid once
function drawShadows(list){let any=false;for(const e of list)if(e.sh){any=true;break}if(!any)return;const W=ctx.canvas.width,H=ctx.canvas.height;
  if(!SHM||SHM.width!==W||SHM.height!==H)SHM=mkc(W,H,()=>{});const g=SHM.getContext('2d', { willReadFrequently: true });g.clearRect(0,0,W,H);for(const e of list)if(e.sh)g.drawImage(e.sh[0],e.sh[1],e.sh[2]-(e.x!=null?liftAt(e.x,e.ly??e.y):0));
  ctx.globalAlpha=SHADOW.a;ctx.drawImage(SHM,0,0);ctx.globalAlpha=1}

/* camps and sites (sites.js), each its model (engine/buildmodels.js) in its climate's make, the frost's snow on it: a bandits' camp
   (PX.clusterModel camp, 32: one or two tents round a fire), a hideout (64: three tents in a ring of stakes) and travellers (32: a
   tent, their wagon, the fire), each on its tiles, its front left tile its own; a cave (32: an outcrop round its uneven mouth), ruins
   (32) and a shrine (16: standing stones or an obelisk, glowing; gold in the desert), on their own tile. Each a canvas: {ax, ay
   (where it stands from its point: drawn at x - ax, y + 8 - ay), sh (its shadow), gr (its yard, its own shadow shaded into it, laid
   under it: sites move from game to game, so their yards are drawn, not painted in), fire (its flame's foot: marks.fire; drawFire),
   flag (its flag's foot: the model's, else a pole by its fire)} */
const SITE_KIND={bandit:'camp',camp:'camp',hideout:'hideout',travelers:'travelers',goblins:'hideout'};
// (a camp built in a culture's style, by its kind: a goblin camp the Ashgor Horde's, its yurts in a ring of stakes; the rest the generic)
const SITE_CULTURE={goblins:'ashgor'};
function siteCanvas(m,ax,ay,mk,deco){const N=m.cell,cv=mkc(N,N,g=>{g.drawImage(m.img,0,0);if(m.snow)g.drawImage(m.snow.img,0,0);if(deco)deco(g,N)});cv.ax=ax;cv.ay=ay;cv.sh=m.shadow;cv.mk=mk;cv.deco=deco;
  cv.gr=mkc(N,N,g=>{g.drawImage(m.ground,0,0);if(m.snow)g.drawImage(m.snow.ground,0,0);g.globalCompositeOperation='source-atop';g.globalAlpha=SHADOW.a;g.drawImage(m.shadow,0,0)});
  cv.fire=m.marks&&m.marks.fire||null;cv.flag=m.flag||(cv.fire&&[cv.fire[0]+7,cv.fire[1]+1]);return cv}
// a camp of kind (bandit, hideout, travelers) and seed i, in climate c (the grass unless said)
function campSprite(i,kind,c){c=c||'grass';const k='camp'+i+(kind||'')+c;if(spr[k])return spr[k];
  const mk=d=>PX.clusterModel({kind:SITE_KIND[kind||'bandit'],culture:SITE_CULTURE[kind],seed:i*131+7,env:c,snow:c==='frost'?1:0,detail:d}),m=mk(1),n=m.cell/TILE;return spr[k]=siteCanvas(m,TILE/2+TILE*((n>>1)-1),m.cell,mk)}
// (a bandit lair: a cave's outcrop round its mouth, or a timbered tunnel's head (sites.js Hideout lairLook), bones before it and the band's banner on a pole, on its tile as a hideout stands;
// the banner the band's (lairCol: [cloth, its shade]; a goblin warren's green), else the bandits' red)
const LAIR_COL=['#8a2a22','#5a1a16'];
function lairSprite(s,c){const look=s.lairLook,L=s.lairCol||LAIR_COL,k='lair'+look+s.seed+c+L[0];if(spr[k])return spr[k];
  const mk=d=>PX.buildingModel({type:look==='cave'?'cave':'minehead',seed:s.seed,env:c,snow:c==='frost'?1:0,detail:d}),m=mk(1);
  // (its banner on a pole and the bones before it, drawn over the model at its own size)
  const deco=(g,N)=>{const x=Math.round(N*.78),y=N-4;g.fillStyle='#3a2a1a';g.fillRect(x,y-18,2,18);g.fillStyle=L[0];g.fillRect(x+2,y-18,8,6);g.fillStyle=L[1];g.fillRect(x+2,y-12,8,1);
    g.fillStyle='#d8d0bc';g.fillRect(Math.round(N*.3),y-2,4,1);g.fillRect(Math.round(N*.36),y-1,2,2)};
  const cv=siteCanvas(m,m.cell/2,m.cell,mk,deco);cv.flag=null;return spr[k]=cv}
function siteSprite(s){s=siteOf(s);// (plain data too)
  if(s.type==='rest')return s.picture();// (a resting place: its finest grave's picture, world/lineage.js RestSite)
  if(s.type===OUTPOST_TYPE)return s.sprite();// (a realm's outpost and its tower: world/outposts.js outpostSprite)
  const c=climAt(s.x,s.y);if(s instanceof BanditCamp)return campSprite(s.seed,'bandit',c);// a bandit camp: the big camp, as the siege camp is drawn
  if(SITE_KIND[s.type]&&!s.tunnel)return campSprite(s.seed,s.type,c);
  if(s.tunnel)return lairSprite(s,c);// (a bandit lair: a tunnel's mouth in the hillside, their banner by it)
  // (its foot on its tile's bottom edge, 8 below the site's point (the tile's middle); a cave's point is its mouth, in front of its
  // tile (CAVE_MOUTH below the tile's bottom edge). A site of 32 px (a cave, ruins) its middle over its tile's, half a tile over each
  // side; where a road or a building is there, on whole tiles instead: its own and the one beside it with fewer (the right first),
  // the row behind them too)
  const big=s.type==='ruins'||s.type==='cave',bad=(x,y)=>tAt(x,y)===T_ROAD||occAt(x,y)>0?1:0,B=big?bad(s.tx,s.ty-1):0,
    R=big?bad(s.tx+1,s.ty)+bad(s.tx+1,s.ty-1)+B:0,L=big?bad(s.tx-1,s.ty)+bad(s.tx-1,s.ty-1)+B:0,side=!big||!(R+L-B)?0:L<R?-1:1;
  const k='site'+s.type+s.seed+c+side;if(spr[k])return spr[k];
  const mk=d=>PX.buildingModel({type:s.type,seed:s.seed,env:c,snow:c==='frost'?1:0,glow:c==='desert'?'#e8c040':'#7fd8e8',detail:d}),m=mk(1);
  return spr[k]=siteCanvas(m,side>0?TILE/2:side<0?m.cell-TILE/2:m.cell/2,m.cell+(s.mouth?8+CAVE_MOUTH:0),mk)}
