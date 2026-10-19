'use strict';
/* ---------- the world map's pointer UI, drawn over the fog and the night as the banners and labels are (render.js drawWorld:
   wuiUnder just before the banners, wuiOver after the labels; input.js worldGo: wuiClick). Drawing only: it reads your goal
   (P.tx, P.ty), what you chase (G.chase), the pointer (G.mouse) and the fog, and writes none of them; its own state (WUI) is
   never saved and draws no random number.
   - A click or tap that sends you somewhere: a ring ripples out from the point; a gold arrow drops onto the goal, lands with a
     squash and bobs there while you go; you arrive: a small ring puffs and it is gone (another goal, or none: gone at once).
   - The way there: dots marching toward the goal along the way you will walk (world.js walk, followed ahead once a goal:
     wuiWay), cut as you walk it, faint by your band, none on land you have never seen.
   - The pointer (a mouse only): corner brackets round the tile under it, or round a party's figure, a holding's lots, a site,
     easing from one to the next and breathing, a faint glow inside, in the colour of what it is (wuiKind: an enemy red, a friend
     or ally green, a neutral or a caravan white, your companions' and the holdings gold, open ground a soft white). The
     tooltip is input.js's own (#tip).
   - Chasing a party or making for a holding: a ring pulsing round it and an arrow bobbing over it (while it is in sight), till
     you meet it or go elsewhere.
   - An encounter on the road you know of and have not met (world/encounters.js): a glow round it, a pulsing "!" over it, its
     call-out the first time it is on the screen, and an arrow at the screen's edge while it is off it (wuiRoadUnder, wuiRoadOver).
   In whole game pixels on the camera's grid (what moves or eases, to 1/VS px as a mover is: render.js snapV), outlined dark as
   the arrows and chevrons of the battle are (ui/orderpaths.js). Real time. Under reducedMotion all holds still: no ripple or
   puff, the arrow and brackets standing, the dots not marching ---------- */
const WUI_K={ripple:.42,drop:.3,land:.13,bob:1.3,poof:.42,ping:1.2,breathe:1.4,gap:6,march:10,draw:.35,ease:20,repick:120,steps:8000,off:8,rebuild:250,
  col:{foe:'#ff5a48',friend:'#76d86a',neutral:'#ece6d4',comp:'#e8b94a',hold:'#e8b94a',ground:'#f2ecd8',gold:'#e8b94a'},dark:'#140e08'};
// (its state: the effects playing (ripples, puffs), the goal you walk to and when it was set, what you chase, the way there,
// the brackets (b: where they stand now, world px; to: where they go) and what the pointer was last picked on)
const WUI={fx:[],dest:null,tgt:null,way:null,s:0,dots:[],hov:null,hp:{t:-1e9,x:NaN,y:NaN,o:null},now:0};
// what a thing on the map is to you, by its colour (WUI_K.col)
function wuiKind(o){const k=objKind(o);if(!k)return 'ground';
  if(k==='band'||k==='monster'||k==='fight')return 'foe';if(k==='cparty')return 'comp';if(k==='town'||k==='estate')return 'hold';
  if(k==='lord'||k==='patrol'){const f=o.faction;return hostileTo(f)?'foe':f==='player'||f===P.fac?'friend':'neutral'}
  if(k==='site')return o instanceof Lair&&!o.cleared?'foe':'neutral';
  if(k==='road')return o.D.foe?'foe':'neutral';
  return 'neutral'}
/* ---- pictures, made once each ---- */
const WUIP=new Map(),wuiMix=(h,t)=>'#'+[1,3,5].map(i=>{const v=parseInt(h.slice(i,i+2),16);return Math.round(t>0?v+(255-v)*t:v*(1+t)).toString(16).padStart(2,'0')}).join('');
// a ring on the ground: an ellipse rx by ry, a pixel wide, its shadow a pixel under it; (cx, cy) its middle in the picture
function wuiRing(rx,ry,col){const k='r'+rx+','+ry+col;let c=WUIP.get(k);if(c)return c;const pts=new Set(),n=Math.max(24,10*rx);
  for(let i=0;i<n;i++){const a=i/n*6.2832;pts.add((Math.round(rx+1+Math.cos(a)*rx))+','+(Math.round(ry+1+Math.sin(a)*ry)))}
  c=mkc(2*rx+3,2*ry+4,g=>{const P2=[...pts].map(p=>p.split(',').map(Number));g.globalAlpha=.7;for(const [x,y] of P2)rect(g,WUI_K.dark,x,y+1);g.globalAlpha=1;for(const [x,y] of P2)rect(g,col,x,y)});
  c.cx=rx+1;c.cy=ry+1;WUIP.set(k,c);return c}
// the arrow, pointing down, outlined dark, lit on its upper left: standing, falling (drawn out), landing (squashed). tip: the
// row of its point in the picture, cx its middle
const WUI_ARROW={stand:['..###..','..###..','..###..','#######','.#####.','..###..','...#...'],fall:['.###.','.###.','.###.','.###.','.###.','#####','.###.','..#..'],squash:['..#####..','..#####..','#########','.#######.','...###...']};
function wuiArrow(k,col){const key='a'+k+col;let c=WUIP.get(key);if(c)return c;const M=WUI_ARROW[k],h=M.length,w=M[0].length,at=(x,y)=>y>=0&&y<h&&x>=0&&x<w&&M[y][x]==='#',lt=wuiMix(col,.45),dk=wuiMix(col,-.32);
  c=mkc(w+2,h+2,g=>{for(let y=-1;y<=h;y++)for(let x=-1;x<=w;x++)if(!at(x,y)&&(at(x-1,y)||at(x+1,y)||at(x,y-1)||at(x,y+1)||at(x-1,y-1)||at(x+1,y-1)))rect(g,WUI_K.dark,x+1,y+1);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(at(x,y))rect(g,!at(x,y-1)||!at(x-1,y)?lt:!at(x+1,y)||x>=w>>1&&!at(x,y+1)?dk:col,x+1,y+1)});
  c.cx=(w+2)>>1;c.tip=h;WUIP.set(key,c);return c}
// (a picture with its point (px, py) at the screen's (x, y))
const wuiPut=(c,x,y,px,py)=>ctx.drawImage(c,x-px,y-py);
/* ---- a click: the ripple, the arrow's drop (input.js worldGo, after the click has done what it does) ---- */
function wuiClick(wx,wy){if(G.mode!=='world')return;const now=performance.now(),o=G.chase&&objKind(G.chase)?G.chase:null;if(!o&&P.tx==null)return;
  if(o&&WUI.tgt&&WUI.tgt.o===o)WUI.tgt.t=now;else if(!o&&WUI.dest)WUI.dest.t=now;WUI.way=null;
  if(!reducedMotion()){WUI.fx.push({k:'ripple',x:Math.round(wx),y:Math.round(wy),t:now,col:WUI_K.col[o?wuiKind(o):'gold']});if(WUI.fx.length>12)WUI.fx.shift()}}
/* ---- the way you will walk: world.js walk's steps followed ahead from (x0, y0) toward (x1, y1) a pixel at a time (the same
   tries round what blocks it, the same keeping to a bridge's deck), a point every 3 px; it stops where the walk would stall.
   {X, Y, S (the way's length to each point), n, i (the point you are at), gx, gy, ok (it gets there), t} ---- */
const WUI_TRY=[0,.6,-.6,1.2,-1.2,1.9,-1.9];
function wuiWay(x0,y0,x1,y1,now){const X=[x0],Y=[y0];let x=x0,y=y0,best=1e9,bn=0,ok=false;
  for(let n=0;n<WUI_K.steps;n++){const dx=x1-x,dy=y1-y,d=Math.hypot(dx,dy);if(d<2){ok=true;break}if(d<best-.25){best=d;bn=n}else if(n-bn>60)break;
    const st=Math.min(d,1),a0=Math.atan2(dy,dx);let moved=false;
    for(const off of WUI_TRY){const a=a0+off;let nx=x+Math.cos(a)*st,ny=y+Math.sin(a)*st;if(!passable(terrAt(nx,ny)))continue;
      const tx=Math.floor(nx/TILE),ty=Math.floor(ny/TILE),b=bridgeAt(tx,ty);if(b===1)nx+=clamp((tx+.5)*TILE-nx,-1,1);else if(b===2)ny+=clamp((ty+.5)*TILE-ny,-1,1);x=nx;y=ny;moved=true;break}
    if(!moved)break;const l=X.length-1;if(Math.hypot(x-X[l],y-Y[l])>=3){X.push(x);Y.push(y)}}
  if(ok){X.push(x1);Y.push(y1)}else if(X[X.length-1]!==x){X.push(x);Y.push(y)}
  const S=[0];for(let i=1;i<X.length;i++)S.push(S[i-1]+Math.hypot(X[i]-X[i-1],Y[i]-Y[i-1]));
  return{X,Y,S,n:X.length,i:0,gx:x1,gy:y1,ok,t:now}}
// (where you are along it: the nearest of its next points (a rebuild if you are off it), then onto the leg after it; s: px)
function wuiAlong(w){let j=w.i,bd=1e9;for(let k=w.i,e=Math.min(w.n-1,w.i+80);k<=e;k++){const d=(w.X[k]-P.x)**2+(w.Y[k]-P.y)**2;if(d<bd){bd=d;j=k}}
  if(bd>WUI_K.off*WUI_K.off)return -1;w.i=j;let s=w.S[j];
  if(j<w.n-1){const dx=w.X[j+1]-w.X[j],dy=w.Y[j+1]-w.Y[j],L=dx*dx+dy*dy;if(L>0)s+=Math.max(0,Math.min(1,((P.x-w.X[j])*dx+(P.y-w.Y[j])*dy)/L))*Math.sqrt(L)}
  return s}
/* ---- once a frame, before anything is drawn: the goal and the chase as they are now; arrived, the puff ---- */
function wuiSync(now){WUI.now=now;WUI.fx=WUI.fx.filter(f=>(now-f.t)/1000<(f.k==='ripple'?WUI_K.ripple:WUI_K.poof));const ch=G.chase&&objKind(G.chase)?G.chase:null;
  if(ch){if(!WUI.tgt||WUI.tgt.o!==ch){WUI.tgt={o:ch,t:now};WUI.way=null}WUI.dest=null}
  else{WUI.tgt=null;if(P.tx!=null&&!P.stay){const d=WUI.dest;if(!d||Math.abs(d.x-P.tx)>.5||Math.abs(d.y-P.ty)>.5){WUI.dest={x:P.tx,y:P.ty,t:now};WUI.way=null}}
    else{const d=WUI.dest;if(d&&Math.hypot(P.x-d.x,P.y-d.y)<6&&!reducedMotion())WUI.fx.push({k:'poof',x:Math.round(d.x),y:Math.round(d.y),t:now,col:WUI_K.col.gold});WUI.dest=null}}
  if(!WUI.dest&&!WUI.tgt)WUI.way=null;
  // (the way: laid again for a new goal, a chased party gone on (at most every WUI_K.rebuild ms), or you off it)
  const g=WUI.tgt?WUI.tgt.o:WUI.dest;if(!g)return;let w=WUI.way;
  if(w&&(Math.hypot(w.gx-g.x,w.gy-g.y)>(WUI.tgt?4:.5)&&now-w.t>(WUI.tgt?WUI_K.rebuild:0)))w=null;
  if(!w||wuiAlong(w)<0){const t0=WUI.way?WUI.way.t0:now;w=WUI.way=wuiWay(P.x,P.y,g.x,g.y,now);w.t0=t0}
  WUI.s=Math.max(0,wuiAlong(w))}
/* ---- what the pointer is on: its box, world px [x0, y0, x1, y1) (a party's leader and host where they are drawn, to 1/VS px;
   of a holding its smallest lot under the point (px, py), else its gate; a site's picture; anything else a square round its
   ring), from where a click answers on it (WorldObject pick) */
function wuiBox(o,px,py){let b=null,f=null,inb=null,gate=null;const u=(x0,y0,x1,y1)=>{b=b?[Math.min(b[0],x0),Math.min(b[1],y0),Math.max(b[2],x1),Math.max(b[3],y1)]:[x0,y0,x1,y1]};
  const at={x:o.x,y:o.y,V:1e9,add:(q,r,dy)=>{if(q!==o)return;const h=Math.round(r*.7),y=q.y-(dy||0);u(q.x-h,y-h,q.x+h,y+h)},
    box:(q,x0,y0,x1,y1)=>{if(q!==o)return;u(x0,y0,x1,y1);if(!gate){gate=[x0,y0,x1,y1];return}if(px>=x0&&px<x1&&py>=y0&&py<y1&&(!inb||(x1-x0)*(y1-y0)<(inb[2]-inb[0])*(inb[3]-inb[1])))inb=[x0,y0,x1,y1]},
    camp:(q,sp)=>{if(q!==o)return;const x0=q.x-sp.ax,y0=q.y+8-sp.ay;u(x0,y0,x0+sp.width,y0+sp.height)},
    fig:(q,s,x0,y0,flip)=>{if(q!==o)return;const k=opaqueBox(s),L=flip?x0+s.width-1-k[2]:x0+k[0];f=[L,y0+k[1],L+k[2]-k[0]+1,y0+k[3]+1]}};
  o.pick(at);if(!b&&!f&&o.town){const t=townBy(o.town);if(t)t.pick(at)}
  // (a party's host behind its leader, as render.js drawHost lays it: three abreast, a rank each 4 px back)
  if(f&&o.look){const L=o.look(),k=hostSize(o.size);if(k){const fd=L.dir<0?-1:1,X=o.x-(L.rider&&!L.bandit?fd*4:0),Y=o.y+2,a=X-fd*6,z=X-fd*(8+(Math.ceil(k/3)-1)*4);
    f=[Math.min(f[0],Math.min(a,z)-4),Math.min(f[1],Y-17),Math.max(f[2],Math.max(a,z)+4),Math.max(f[3],Y+3)]}}
  b=f||inb||gate||b;if(!b)return null;
  // (a mover's box where he is drawn: whole pixels from his place to 1/VS px, render.js subOf)
  if(f||!['town','estate','site'].includes(o.mapKind)){const dx=snapV(o.x)-o.x,dy=snapV(o.y)-o.y;b=[b[0]+dx,b[1]+dy,b[2]+dx,b[3]+dy]}
  return b}
// (the brackets this frame: eased toward what the pointer is on; null when it is on nothing to show (off the map, a touch, a
// window up, land you have never seen))
function wuiHover(now,dt){const H=WUI.hp,M=G.mouse;
  if(!(G.mode==='world'&&!G.modal&&M.in&&M.type==='mouse'&&!G.place&&!P.stay)){WUI.hov=null;return}
  const wx=G.cam.x+M.x,wy=G.cam.y+M.y;
  if(H.x!==wx||H.y!==wy||now-H.t>WUI_K.repick){H.x=wx;H.y=wy;H.t=now;H.o=pickAt(wx,wy)}
  const o=H.o&&objKind(H.o)?H.o:null,box=o&&wuiBox(o,wx,wy);let to,kind;
  if(box){to=box;kind=wuiKind(o)}else{if(!seenAt(wx,wy)||wx<0||wy<0||wx>=MW*TILE||wy>=MH*TILE){WUI.hov=null;return}const tx=Math.floor(wx/TILE)*TILE,ty=Math.floor(wy/TILE)*TILE;to=[tx,ty,tx+TILE,ty+TILE];kind='ground'}
  let h=WUI.hov;const rm=reducedMotion();
  if(!h)h=WUI.hov={b:rm?to.slice():[to[0]-3,to[1]-3,to[2]+3,to[3]+3]};// (in from a little outside)
  h.kind=kind;
  const k=rm?1:1-Math.exp(-dt*WUI_K.ease);for(let i=0;i<4;i++){h.b[i]+=(to[i]-h.b[i])*k;if(Math.abs(to[i]-h.b[i])<.02)h.b[i]=to[i]}}
/* ---- drawing ---- */
// (a world x or y on the screen: whole pixels, or to 1/VS px for what glides; cam: the camera's whole pixels)
const wuiX=(x,cam)=>snapV(x)-cam.x,wuiY=(y,cam)=>snapV(y)-cam.y;
// the arrow at screen (x, y): its point there; k its shape
function wuiDrawArrow(x,y,k,col){const c=wuiArrow(k,col);wuiPut(c,x,y,c.cx,c.tip)}
// an arrow dropping onto (x, y) from t0: falls (drawn out), lands (squashed), then bobs; its shadow on the ground under it
function wuiDrop(x,y,t0,col,now,rm,ground){const e=(now-t0)/1000,D=WUI_K.drop,Ld=WUI_K.land;let h=0,k='stand';
  if(!rm){if(e<D){const q=e/D;h=Math.round(22*(1-q*q));k='fall'}else if(e<D+Ld)k='squash';else h=Math.round((1-Math.cos((e-D-Ld)/WUI_K.bob*6.2832))*1.5)}
  if(ground){const sw=h>12?1:h>4?2:3;ctx.globalAlpha=.4;ctx.fillStyle=WUI_K.dark;ctx.fillRect(x-sw,y,2*sw+1,1);if(sw>1)ctx.fillRect(x-sw+1,y+1,2*sw-1,1);ctx.globalAlpha=1}
  wuiDrawArrow(x,y-2-h,k,col)}
// the corner brackets round a box on the screen (x1, y1 past its last pixel), p px out from it, outlined dark, alpha a; a glow
// inside of strength g
function wuiBrackets(x0,y0,x1,y1,col,a,p,g){const w=x1-x0,h=y1-y0;
  if(g>0&&w>2&&h>2){ctx.fillStyle=col;ctx.globalAlpha=a*g*.1;ctx.fillRect(x0,y0,w,h);ctx.globalAlpha=a*g*.16;ctx.fillRect(x0,y0,w,1);ctx.fillRect(x0,y1-1,w,1);ctx.fillRect(x0,y0+1,1,h-2);ctx.fillRect(x1-1,y0+1,1,h-2)}
  const X0=x0-1-p,Y0=y0-1-p,X1=x1+p,Y1=y1+p,L=Math.max(3,Math.min(6,Math.floor(Math.min(X1-X0,Y1-Y0)/3)));
  const arms=[[X0,Y0,L,1],[X0,Y0,1,L],[X1-L+1,Y0,L,1],[X1,Y0,1,L],[X0,Y1,L,1],[X0,Y1-L+1,1,L],[X1-L+1,Y1,L,1],[X1,Y1-L+1,1,L]];
  ctx.globalAlpha=a*.8;ctx.fillStyle=WUI_K.dark;for(const [x,y,aw,ah] of arms)ctx.fillRect(x-1,y-1,aw+2,ah+2);
  ctx.globalAlpha=a;ctx.fillStyle=col;for(const [x,y,aw,ah] of arms)ctx.fillRect(x,y,aw,ah);
  ctx.fillStyle=wuiMix(col,.5);ctx.fillRect(X0,Y0,1,1);ctx.fillRect(X1,Y0,1,1);ctx.fillRect(X0,Y1,1,1);ctx.fillRect(X1,Y1,1,1);ctx.globalAlpha=1}
// the dots along the way, from just past you to just short of the goal, marching on toward it (a dot each WUI_K.gap px, its
// phase by the clock); drawn out from you over WUI_K.draw s when it is new; faint the first px from you; none on land never seen
function wuiTrail(cam,now,rm){const w=WUI.way;WUI.dots.length=0;if(!w||w.n<2)return;const s0=WUI.s,end=w.S[w.n-1]-(WUI.tgt?10:6),gp=WUI_K.gap,ph=rm?0:(now/1000*WUI_K.march)%gp,col=WUI.tgt?WUI_K.col[wuiKind(WUI.tgt.o)]:WUI_K.col.gold;
  const reach=rm?1e9:s0+(now-w.t0)/1000/WUI_K.draw*(end-s0+20);let j=w.i,n=0;const D=WUI.dots;
  for(let s=Math.ceil((s0+3-ph)/gp)*gp+ph;s<end&&s<reach&&n<400;s+=gp){while(j<w.n-2&&w.S[j+1]<s)j++;const L=w.S[j+1]-w.S[j],q=L>0?(s-w.S[j])/L:0,x=w.X[j]+(w.X[j+1]-w.X[j])*q,y=w.Y[j]+(w.Y[j+1]-w.Y[j])*q;
    if(!seenAt(x,y))continue;const sx=Math.round(x)-cam.x,sy=Math.round(y)-cam.y;if(sx<-2||sy<-2||sx>VW+2||sy>VH+2)continue;
    D.push(sx,sy,Math.min(1,(s-s0-3)/14,(end+6-s)/8));n++}
  ctx.fillStyle=WUI_K.dark;for(let i=0;i<D.length;i+=3){ctx.globalAlpha=D[i+2]*.5;ctx.fillRect(D[i]-1,D[i+1]-1,4,4)}
  ctx.fillStyle=col;for(let i=0;i<D.length;i+=3){ctx.globalAlpha=D[i+2];ctx.fillRect(D[i],D[i+1],2,2)}
  ctx.fillStyle=wuiMix(col,.6);for(let i=0;i<D.length;i+=3){ctx.globalAlpha=D[i+2];ctx.fillRect(D[i],D[i+1],1,1)}ctx.globalAlpha=1}
// (a chased thing's feet, the top of what is drawn of it (its banner and label too) and its ring's width, on the screen)
function wuiTargetAt(o,cam){const b=wuiBox(o)||[o.x-6,o.y-12,o.x+6,o.y+2],B=o.banner&&bannerAt(o,0),top=B?Math.min(b[1],B.y+snapV(o.y)-Math.round(o.y)+opaqueBox(B.s)[1]-8):b[1];// (over its banner and the label on it)
  return{x:wuiX(o.x,cam),y:wuiY(o.y,cam)+1,top:Math.floor(top-cam.y),rx:Math.round(clamp((b[2]-b[0])/2+3,7,22))}}
// under the banners and labels: the way, the goal's ring, the ripples and puffs, the ring round what you chase
function wuiUnder(cam){const now=performance.now(),dt=Math.min(.1,Math.max(0,(now-(WUI.last||now))/1000)),rm=reducedMotion();WUI.last=now;
  if(G.mode==='title'){WUI.hov=null;return}wuiSync(now);wuiHover(now,dt);
  wuiTrail(cam,now,rm);
  if(WUI.dest){const d=WUI.dest,x=Math.round(d.x)-cam.x,y=Math.round(d.y)-cam.y,e=(now-d.t)/1000;if(rm||e>WUI_K.drop){const r=rm?4:4+Math.round((1+Math.sin((e-WUI_K.drop)/WUI_K.bob*6.2832))*.5),c=wuiRing(r,Math.ceil(r/2),WUI_K.col.gold);ctx.globalAlpha=.85;wuiPut(c,x,y,c.cx,c.cy);ctx.globalAlpha=1}}
  if(WUI.tgt&&WUI.tgt.o.inView(vis())){const o=WUI.tgt.o,T=wuiTargetAt(o,cam),col=WUI_K.col[wuiKind(o)],e=(now-WUI.tgt.t)/1000;
    const c=wuiRing(T.rx,Math.ceil(T.rx*.45),col);ctx.globalAlpha=rm?.9:.8+.2*Math.sin(e*5.5);wuiPut(c,T.x,T.y,c.cx,c.cy);
    if(!rm){const q=(e%WUI_K.ping)/WUI_K.ping,r=T.rx+Math.round(q*6),p=wuiRing(r,Math.ceil(r*.45),col);ctx.globalAlpha=.8*(1-q);wuiPut(p,T.x,T.y,p.cx,p.cy)}ctx.globalAlpha=1}
  wuiRoadUnder(cam,now,rm);
  for(const f of WUI.fx){const q=(now-f.t)/1000/(f.k==='ripple'?WUI_K.ripple:WUI_K.poof),x=f.x-cam.x,y=f.y-cam.y;if(q<0||q>=1)continue;const e=1-(1-q)*(1-q);
    if(f.k==='ripple'){for(const [d,m] of [[0,1],[.14,.6]]){const qq=Math.max(0,(q-d)/(1-d)),ee=1-(1-qq)*(1-qq),r=2+Math.round(ee*11),c=wuiRing(r,Math.max(1,Math.round(r*.5)),f.col);ctx.globalAlpha=m*(1-qq);wuiPut(c,x,y,c.cx,c.cy)}
      if(q<.3){ctx.globalAlpha=1-q/.3;ctx.fillStyle='#fff8e0';ctx.fillRect(x-1,y,3,1);ctx.fillRect(x,y-1,1,3)}}
    else{const r=3+Math.round(e*7),c=wuiRing(r,Math.ceil(r/2),f.col);ctx.globalAlpha=1-q;wuiPut(c,x,y,c.cx,c.cy);
      for(let k=0;k<6;k++){const a=k*1.0472+.5,d=3+e*10,sx=Math.round(x+Math.cos(a)*d),sy=Math.round(y-3+Math.sin(a)*d*.6-e*4);ctx.fillStyle=WUI_K.dark;ctx.globalAlpha=(1-q)*.5;ctx.fillRect(sx-1,sy-1,3,3);
        ctx.globalAlpha=1-q;ctx.fillStyle=f.col;if(q<.5){ctx.fillRect(sx-1,sy,3,1);ctx.fillRect(sx,sy-1,1,3)}ctx.fillStyle='#fff8e0';ctx.fillRect(sx,sy,1,1)}}}
  ctx.globalAlpha=1}
// over the labels: the goal's arrow, the arrow over what you chase, the brackets
function wuiOver(cam){if(G.mode==='title')return;const now=WUI.now||performance.now(),rm=reducedMotion();
  if(WUI.dest){const d=WUI.dest;wuiDrop(Math.round(d.x)-cam.x,Math.round(d.y)-cam.y,d.t,WUI_K.col.gold,now,rm,true)}
  if(WUI.tgt&&WUI.tgt.o.inView(vis())){const o=WUI.tgt.o,T=wuiTargetAt(o,cam);wuiDrop(T.x,T.top,WUI.tgt.t,WUI_K.col[wuiKind(o)],now,rm,false)}
  wuiRoadOver(cam,now,rm);
  const h=WUI.hov;if(h){const b=h.b,col=WUI_K.col[h.kind],x0=wuiX(b[0],cam),y0=wuiY(b[1],cam),x1=wuiX(b[2],cam),y1=wuiY(b[3],cam),br=rm?0:(1+Math.sin(now/1000/WUI_K.breathe*6.2832))/2;
    wuiBrackets(x0,y0,x1,y1,col,h.kind==='ground'?.75:1,rm?0:Math.round(br),h.kind==='ground'?.5+.5*br:1+br)}}
/* ---- the encounters on the road (world/encounters.js), each you know of and have not met (marked). Under the banners: a soft
   glow round its figures, breathing, while you see it. Over the labels: a pulsing "!" over it while it is on the screen (heard and
   not yet seen, over the fog too), its call-out over that for ENC_LIFE.say s the first time you see it there; off the screen,
   an arrow at the screen's edge pointing to it, the "!" beside it. All in real time, still under reducedMotion ---- */
// (the "!": a gold pin, its "!" cut out of it and outlined dark, its point on what it marks)
WUI_ARROW.bang=['.#####.','###.###','###.###','###.###','#######','###.###','.#####.','..###..','...#...'];
// (the arrow at the screen's edge in eight directions, k: 0 east, then each 45° clockwise: a head and a short shaft, laid out
// from its shape once each, so it stays crisp as the map's arrows are)
function wuiEdge(k,col){const key='edge'+k;if(!WUI_ARROW[key]){const a=k*Math.PI/4,ux=Math.cos(a),uy=Math.sin(a),rows=[];
  for(let y=0;y<11;y++){let r='';for(let x=0;x<11;x++){const px=x-5,py=y-5,al=px*ux+py*uy,pr=Math.abs(py*ux-px*uy);r+=al>=-1.5&&al<=5&&pr<=(5-al)*.85||al>=-5&&al<-1.5&&pr<=1.1?'#':'.'}rows.push(r)}WUI_ARROW[key]=rows}
  return wuiArrow(key,col)}
function wuiRoadUnder(cam,now,rm){const V=vis();for(const e of roadList()){if(!e.marked()||!e.inView(V))continue;const b=e.box(),x=wuiX((b[0]+b[2])/2,cam),y=wuiY((b[1]+b[3])/2+2,cam),p=rm?.5:(1+Math.sin(now/1000*3.2))/2,r=Math.max(13,(b[2]-b[0])*.62)+3*p;
  ctx.save();ctx.translate(x,y);ctx.scale(1,.62);const g=ctx.createRadialGradient(0,0,1,0,0,r);g.addColorStop(0,'rgba(255,214,120,'+(.3+.15*p).toFixed(3)+')');g.addColorStop(1,'rgba(255,200,90,0)');
  ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(-r,-r,2*r,2*r);ctx.restore()}}
function wuiRoadOver(cam,now,rm){const V=vis(),col=WUI_K.col.gold,bang=wuiArrow('bang',col),p=rm?1:(1+Math.sin(now/1000*5))/2,bob=rm?0:Math.round(p*2);
  for(const e of roadList()){if(!e.marked())continue;const b=e.box(),x=Math.round(wuiX((b[0]+b[2])/2,cam)),top=Math.floor(wuiY(b[1],cam)),y=wuiY(e.y,cam);
    if(x>=0&&x<=VW&&top>=4&&y<=VH){const by=top-2-bob;ctx.globalAlpha=.75+.25*p;wuiPut(bang,x,by,bang.cx,bang.tip);ctx.globalAlpha=1;
      if(e.D.call&&e.inView(V)){let t0=ROAD_SAY.get(e);if(t0==null)ROAD_SAY.set(e,t0=now);const q=(now-t0)/1000;if(q<ENC_LIFE.say){ctx.globalAlpha=Math.min(1,(ENC_LIFE.say-q)*2);txt(e.D.call,x,by-bang.tip-3,'#fff2c8','center');ctx.globalAlpha=1}}
      continue}
    const mx=12,my=24,cx=VW/2,cy=VH/2,dx=x-cx,dy=(top+y)/2-cy,k=Math.min((cx-mx)/Math.max(1e-6,Math.abs(dx)),(cy-my)/Math.max(1e-6,Math.abs(dy))),ax=Math.round(cx+dx*k),ay=Math.round(cy+dy*k),a=Math.atan2(dy,dx),c=wuiEdge((Math.round(a/(Math.PI/4))+8)%8,col);
    ctx.globalAlpha=.8+.2*p;ctx.drawImage(c,ax-6+Math.round(Math.cos(a)*bob),ay-6+Math.round(Math.sin(a)*bob));ctx.globalAlpha=1;
    wuiPut(bang,Math.round(ax-Math.cos(a)*17),Math.round(ay-Math.sin(a)*17)+4,bang.cx,bang.tip)}}
