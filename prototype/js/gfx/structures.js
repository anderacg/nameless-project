'use strict';
/* ---------- structures on the world map: placed buildings, the ground of estates, camps and sites ---------- */
// Every building is a model of the PX engine (../engine/buildmodels.js, the owner's scale: 32 px the smallest building, 64 the big
// ones, the clusters and the centres, 128 a city's citadel; 16 px objects) and stands on its own tiles of the grid (lots.js): its
// picture is exactly its cell, drawn among the parties by its front edge. Its yard, the model's ragged ground layer, is painted
// into the land under it (gfx/worldart.js townGround: no patch of its own); its shadow joins every other in one pass; fields,
// pastures, pits and piers lie flat on the tiles their estate keeps. Flags are their own sprite, waving.

/* placed buildings */
// a lot's model as it stands (lots.js lotSpec: its culture, people, seed, facing, land, level, the centre's walls) with its snow
function lotModel(t,l){const s=lotSpec(t,l);s.snow=lotSnow(l);return s.tier?PX.centreModel(s):s.kind?PX.clusterModel(s):PX.buildingModel(s)}
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
/* a building's rotors over its picture at (X, Y), its corner (the owner, 2026-11-08: "draw mills separately from the building to
   animate it"): a windmill's sails and a watermill's wheel turning (engine PX.ROTORS.spin turns a second, from the clock and its
   seed); still (at its seed's angle) where it stands outside your sight, as you last saw it */
function drawRotors(s,X,Y,seed,still){if(!s.rot)return;const t=still?0:performance.now()/1000;
  for(const r of s.rot){const f=PX.rotorFrame(r,(seed||0)+t*PX.ROTORS.spin[r.kind]*Math.PI*2);ctx.drawImage(f.img,X+f.ox,Y+f.oy);depthPic(f.img,X+f.ox,Y+f.oy)}}
// a lot's yard for the painted world (worldart.js townGround): its model's ground layer with its snow's over it, {d: RGBA, N, key:
// its material (groundKey)}, kept with the model; the lot remembers which model it was painted from (_gimg)
function lotYard(t,l){const m=lotModel(t,l),N=m.cell,h=m.snow||m.ground;l._gimg=m.img;
  if(!h._gd)h._gd={N,key:m.groundKey,d:mkc(N,N,g=>{g.drawImage(m.ground,0,0);if(m.snow)g.drawImage(m.snow.ground,0,0)}).getContext('2d', { willReadFrequently: true }).getImageData(0,0,N,N).data};
  return h._gd}
// the models of the lots near you made ahead, a few ms a frame (LOT_AHEAD: how far past the view, how long), the nearest holdings
// first, so a town comes into view already built (its chunks are painted ahead with its yards: worldart.js)
const LOT_AHEAD={r:600,ms:3};
function lotsAhead(V){const t0=performance.now();for(const t of TOWNS.filter(q=>q.lots&&Math.hypot(q.x-P.x,q.y-P.y)<V+LOT_AHEAD.r).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y)))
  for(const l of t.lots){if(l._s&&l._gimg)continue;lotSprite(t,l);lotYard(t,l);if(performance.now()-t0>LOT_AHEAD.ms)return}}
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
const drawFlag=(b,x,y,seed)=>{const s=flagSprite(b,Math.floor(performance.now()/400+(seed||0))%2);ctx.drawImage(s,Math.round(x)-s.ax,Math.round(y)-s.ay)};
// (a holding's flag: its realm's banner and device, yours with the crown, none held a grey one)
const holdingFlag=(t,col)=>({k:'banner',col,dev:t.owner==='player'?'crown':t.owner||null});
// a camp's fire, its foot at (x, y): as it burns (fire.js fireCamp); FLAMES off, its flame through the engine's four frames
const drawFire=(x,y,seed)=>{if(FLAMES.on){fireCamp(x,y,seed);return}const f=Math.floor(performance.now()/110+(seed||0))%4,s=spr['flm'+f]||(spr['flm'+f]=PX.flame(f));ctx.drawImage(s.img,Math.round(x)-s.ax,Math.round(y)-s.ay)};
// the lots of every holding near the view: their fields flat on the ground, under everyone (their yards are painted in: townGround)
function drawLotGround(cam,V){
  lotsAhead(V);
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
        if(!live){if(!seenTile(l.x,l.y)&&!seenTile(l.x+l.n-1,l.y+l.n-1))return;const m=l._mem||lotSprite(t,l);ctx.drawImage(m,X,Y-N);depthPic(m,X,Y-N);drawRotors(m,X,Y-N,l.seed,true);if(l.k==='centre'&&(l._memSt||l.st)!=='ruined'){if(m.flag)drawFlag(holdingFlag(t,col),X+m.flag[0],Y-N+m.flag[1],t.seed);holdingPlaque(t,cam,Y-N+Math.min(0,m.flag?m.flag[1]:0),false)}return}
        const s=lotSprite(t,l),w=t.work&&(t.work.lot?t.work.lot===l.id:t.work.k===l.k||t.work.k==='wall'&&l.k==='centre'),p=w?workProg(t):0;l._mem=s;l._memSt=l.st;
        if(l.st==='building')drawSite(s,X,Y,N,p,false,l.seed,t.races?.[0]);else{ctx.drawImage(s,X,Y-N);depthPic(s,X,Y-N);drawRotors(s,X,Y-N,l.seed);if(w&&l.st==='built')drawSite(s,X,Y,N,p,true,l.seed,t.races?.[0])}
        if(ESTATES[l.k]&&sabotaged(t,l.k)){const now=performance.now()/1000;for(let i=0;i<6;i++){const ph=(now*.35+i/6)%1;ctx.globalAlpha=(1-ph)*.6;rect(ctx,ph<.3?'#4a4440':'#7a7470',Math.round(X+N/2-1+Math.sin(ph*6+i)*3+ph*5),Math.round(Y-N*.6-ph*20),2,2)}ctx.globalAlpha=1}
        if(l.k==='centre'&&l.st!=='ruined'){if(s.flag)drawFlag(holdingFlag(t,col),X+s.flag[0],Y-N+s.flag[1],t.seed);holdingLabel(t,cam,X,Y,N,s.flag?s.flag[1]:0)}}});// (no estate's name under it near you: no words on the map's places, the owner, 2026-11-08; its tip names it)
      if(l.k==='port'&&l.st==='built')for(const o of estateBoats(t,bldLv(t,'port')))ents.push({y:o.y,f:()=>drawMoored(o,cam)});
      if(l.k==='pasture'&&l.st==='built'&&live)penEnts(t,ents,cam)}// (its herd, inside its fence: critters.js)
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
  if(!full&&h>0)ctx.drawImage(s,0,N-h,N,h,X,Y-h,N,h);
  const x0=full?X+(N>>1):X+1,x1=X+N-2,poles=full?[x0,x1]:N>16?[x0,X+(N>>1),x1]:[x0,x1];
  for(const px of poles){rect(ctx,'#1a1512',px-1,Y-top-1,3,top+1);rect(ctx,'#8a6a42',px,Y-top,1,top)}
  for(let y=Y-4;y>Y-top;y-=6){rect(ctx,'#1a1512',x0-1,y-1,x1-x0+3,3);rect(ctx,'#a07e54',x0,y,x1-x0+1,1)}
  const ly=full?Y-Math.round(top/2):Math.max(Y-top+2,Y-h-1),span=Math.max(1,x1-x0-4);
  if(!figsOn()){const wx=x0+2+Math.round((Math.sin(now/900+seed)*.5+.5)*span),f=Math.floor(now*PEOPLE_STEPS/720)%PEOPLE_STEPS;
    ctx.drawImage(workerSprite('builder',f,race,seed%4),wx-8,ly-14);if(Math.floor(now/180+seed)%7===0)rect(ctx,'#ffe090',wx+4,ly-8,1,1);return}
  const S=SITE,[,nb,carry]=S.crew.find(c=>N<=c[0]),T=S.walk+S.swings*S.swing,spot=(i,n)=>x0+2+Math.round(hash(n,seed+i*977,31)*span);
  for(let i=0;i<nb;i++){/* a builder: walking to his spot, then hammering there */
    const t=now/1000+(seed%97)*.37+i*1.9,n=Math.floor(t/T),c=t-n*T,a=spot(i,n-1),b=spot(i,n),y=i?Math.min(Y-2,ly+6):ly;let x,pose,face=b>=a?1:-1;
    if(c<S.walk){x=Math.round(a+(b-a)*c/S.walk);pose=b===a?0:figPose(Math.floor(c*6),true)}
    else{x=b;const q=(c-S.walk)/S.swing,f=Math.floor((q%1)*3);pose=12+f;if(f===1&&(q%1)<.45)rect(ctx,'#ffe090',x+face*5,y-9,1,1)}
    drawFig(figWorker('builder',race,(seed+i)%4,pose),x,y,face)}
  if(carry){/* the plank carrier: in from the side, loaded, and back out for more */
    const t=now/1000+(seed%53)*.41,L=S.carry,n=Math.floor(t/L),c=(t-n*L)/L,inw=n%2===0,sx=X-6,ex=X+(N>>1),x=Math.round(inw?sx+(ex-sx)*c:ex+(sx-ex)*c);
    drawFig(figWorker('builder',race,(seed+3)%4,figPose(Math.floor(t*6),true),inw),x,Y+1,inw?1:-1)}
}
// placing a building by hand: its ghost under the pointer, its tiles green where it may stand and red where not
function drawPlace(cam){
  const pl=G.place,t=townBy(pl.town);if(!t||!G.mouse.in)return;const n=pl.n,N=n*TILE,{x,y}=placeAt(G.cam.x+G.mouse.x,G.cam.y+G.mouse.y,n),ok=placeOk(t,pl.k,x,y,n),X=x*TILE-cam.x,Y=y*TILE-cam.y;
  if(!pl._s){const s={culture:holdingCulture(t),people:t.races[0],seed:pl.seed,env:climAt(t.x,t.y)},b=PX.MODEL_SIZES.types[pl.type]?PX.buildingModel({...s,type:pl.type}):PX.clusterModel({...s,kind:pl.type});pl._s=b.img}
  ctx.fillStyle=ok?'rgba(120,220,110,.28)':'rgba(230,90,80,.32)';ctx.fillRect(X,Y,N,N);ctx.globalAlpha=.75;ctx.drawImage(pl._s,X,Y);ctx.globalAlpha=1;
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
function holdingPlaque(t,cam,top,live){PLAQUEQ.push({t,top:top+cam.y,live})}
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
// the flat part of an estate at its level, as one picture placed at (cv.x, cv.y) on the map; kept on its lot (l._eg) until its level
// changes: an estate pulled down and placed again elsewhere, or another world's holding of the same name, draws its own
function estateGround(t,k,lv){
  const l=lotAt(t,k),p=bldSpots(t)[k];if(!l||!p)return null;if(l._eg!==undefined&&l._egLv===lv)return l._eg;l._egLv=lv;
  const c=climAt(p.x,p.y),plots=plotsAt(t,k,lv),pier=k==='port'?pierOf(t):null,plen=pier?10+lv*6:0,tiles=[[l.x,l.y],[l.x+l.n-1,l.y+l.n-1],...plots];
  let x0=Math.min(...tiles.map(q=>q[0]))*TILE-2,y0=Math.min(...tiles.map(q=>q[1]))*TILE-2,x1=(Math.max(...tiles.map(q=>q[0]))+1)*TILE+2,y1=(Math.max(...tiles.map(q=>q[1]))+1)*TILE+2;
  if(pier){x0=Math.min(x0,pier.x-plen-6);x1=Math.max(x1,pier.x+plen+6);y0=Math.min(y0,pier.y-plen-6);y1=Math.max(y1,pier.y+plen+6)}
  const has=(x,y)=>plots.some(q=>q[0]===x&&q[1]===y),h=(x,y,s)=>hash(x,y,t.seed*7+s),SC=WorldArt.ensure().snow;
  // (a plot's land: how far into the frost by the snow's cover (0 the grass, 1 the frost), and its pen's colours there)
  const frOf=(tx,ty)=>c==='grass'||c==='frost'?Math.max(0,Math.min(1,(SC[ty*MW+tx]-.3)/.4)):0,penOf=fr=>{const A=PEN[c==='frost'?'grass':c],B=PEN.frost;return{a:A.a.map((q,i)=>mixc(q,B.a[i],fr)),b:A.b.map((q,i)=>mixc(q,B.b[i],fr))}};
  const cv=mkc(x1-x0,y1-y0,g=>{const r=(col,x,y,w,hh)=>rect(g,col,Math.round(x-x0),Math.round(y-y0),w||1,hh||1);
    for(const [tx,ty] of plots){const X=tx*TILE,Y=ty*TILE,edge=(a,b)=>!has(tx+a,ty+b);// (against its building too: ragged into its yard)
      // (how far a pixel of the plot lies from an edge with no plot beyond, px)
      const eN=edge(0,-1),eS=edge(0,1),eW=edge(-1,0),eE=edge(1,0),ed=(x,y)=>Math.min(eW?x:9,eE?15-x:9,eN?y:9,eS?15-y:9),fr=frOf(tx,ty),px=(col,x,y)=>r(hex(col),X+x,Y+y);
      if(k==='farm')farmPlot(t,tx,ty,c,fr,ed,px);// a field: its crop in rows of plants, what stands on it (gfx/worldart.js farmPlot)
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
    // (what lies about its building is the model's: its yard, its dressing)
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
   SHADOW.a (the models' own shade, PX.MODEL_SHADE), once: two shadows never darken each other, and none is drawn over a neighbour
   in the depth order. The models' shadows come solid, in the shadow's colour */
const SHADOW={a:PX.MODEL_SHADE,col:[20,24,12]};let SHM=null;
// the shadow pass: the entries' sh ([picture, x, y] on the screen) as one mask, laid once
function drawShadows(list){let any=false;for(const e of list)if(e.sh){any=true;break}if(!any)return;const W=ctx.canvas.width,H=ctx.canvas.height;
  if(!SHM||SHM.width!==W||SHM.height!==H)SHM=mkc(W,H,()=>{});const g=SHM.getContext('2d', { willReadFrequently: true });g.clearRect(0,0,W,H);for(const e of list)if(e.sh)g.drawImage(e.sh[0],e.sh[1],e.sh[2]);
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
function siteCanvas(m,ax,ay){const N=m.cell,cv=mkc(N,N,g=>{g.drawImage(m.img,0,0);if(m.snow)g.drawImage(m.snow.img,0,0)});cv.ax=ax;cv.ay=ay;cv.sh=m.shadow;
  cv.gr=mkc(N,N,g=>{g.drawImage(m.ground,0,0);if(m.snow)g.drawImage(m.snow.ground,0,0);g.globalCompositeOperation='source-atop';g.globalAlpha=SHADOW.a;g.drawImage(m.shadow,0,0)});
  cv.fire=m.marks&&m.marks.fire||null;cv.flag=m.flag||(cv.fire&&[cv.fire[0]+7,cv.fire[1]+1]);return cv}
// a camp of kind (bandit, hideout, travelers) and seed i, in climate c (the grass unless said)
function campSprite(i,kind,c){c=c||'grass';const k='camp'+i+(kind||'')+c;if(spr[k])return spr[k];
  const m=PX.clusterModel({kind:SITE_KIND[kind||'bandit'],culture:SITE_CULTURE[kind],seed:i*131+7,env:c,snow:c==='frost'?1:0}),n=m.cell/TILE;return spr[k]=siteCanvas(m,TILE/2+TILE*((n>>1)-1),m.cell)}
// (a bandit lair: a cave's outcrop round its mouth, or a timbered tunnel's head (sites.js Hideout lairLook), bones before it and the band's banner on a pole, on its tile as a hideout stands;
// the banner the band's (lairCol: [cloth, its shade]; a goblin warren's green), else the bandits' red)
const LAIR_COL=['#8a2a22','#5a1a16'];
function lairSprite(s,c){const look=s.lairLook,L=s.lairCol||LAIR_COL,k='lair'+look+s.seed+c+L[0];if(spr[k])return spr[k];const m=PX.buildingModel({type:look==='cave'?'cave':'minehead',seed:s.seed,env:c,snow:c==='frost'?1:0});
  const cv=siteCanvas(m,m.cell/2,m.cell),g=cv.getContext('2d'),N=m.cell,x=Math.round(N*.78),y=N-4;
  g.fillStyle='#3a2a1a';g.fillRect(x,y-18,2,18);g.fillStyle=L[0];g.fillRect(x+2,y-18,8,6);g.fillStyle=L[1];g.fillRect(x+2,y-12,8,1);
  g.fillStyle='#d8d0bc';g.fillRect(Math.round(N*.3),y-2,4,1);g.fillRect(Math.round(N*.36),y-1,2,2);cv.flag=null;return spr[k]=cv}
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
  const m=PX.buildingModel({type:s.type,seed:s.seed,env:c,snow:c==='frost'?1:0,glow:c==='desert'?'#e8c040':'#7fd8e8'});
  return spr[k]=siteCanvas(m,side>0?TILE/2:side<0?m.cell-TILE/2:m.cell/2,m.cell+(s.mouth?8+CAVE_MOUTH:0))}
