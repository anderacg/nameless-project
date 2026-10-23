'use strict';
/* ---------- the world map's pointer UI, drawn over the fog and the night as the banners and labels are (render.js drawWorld:
   wuiUnder just before the banners, wuiOver after the labels; input.js worldGo: wuiClick). Drawing only: it reads your goal
   (P.tx, P.ty), what you chase (G.chase), the pointer (G.mouse) and the fog, and writes none of them; its own state (WUI) is
   never saved and draws no random number.
   - A click or tap that sends you somewhere: a ring ripples out from the point; a gold arrow drops onto the goal, lands with a
     squash and bobs there while you go; you arrive: a small ring puffs and it is gone (another goal, or none: gone at once).
   - The way there: footprints marching toward the goal along the way you will walk (world.js heroWay, the router's way round
     water when the line is blocked, straightened, followed ahead once a goal: wuiWay; laid again when the ways change or you
     leave it), a left and a right print in turn, turned along it (wuiFoot), cut as you walk it, faint by your band, none on
     land you have never seen.
   - The pointer (a mouse only): corner brackets round the tile under it, or round a party's figure, a holding's lots, a site,
     easing from one to the next and breathing, a faint glow inside, in the colour of what it is (wuiKind: an enemy red, a friend
     or ally green, a neutral or a caravan white, your companions' and the holdings gold, open ground a soft white). The
     tooltip is input.js's own (#tip).
   - Chasing a party or making for a holding: a ring pulsing round it and an arrow bobbing over it (while it is in sight), till
     you meet it or go elsewhere; going to attack it (a foe: wuiKind), crossed swords in the arrow's place (the owner, 2026-10-23;
     wuiSwords: the action ring's Attack icon, icons.js ICONS.attack), never smaller on the screen than WUI_K.swords CSS px.
     Following a party (world.js G.follow): its ring, no arrow, the footprints to it.
   - An encounter on the road you know of and have not met (world/road.js): sound waves rippling out from it, a pulsing "!" over it, its
     call-out the first time it is on the screen, and its waves rolling in at the screen's edge while it is off it (wuiRoadUnder, wuiRoadOver).
   In whole game pixels on the camera's grid (what moves or eases, to 1/VS px as a mover is: render.js snapV), outlined dark as
   the arrows and chevrons of the battle are (ui/orderpaths.js). Real time. Under reducedMotion all holds still: no ripple or
   puff, the arrow and brackets standing, the dots not marching ---------- */
const WUI_K={swords:11,ripple:.42,drop:.3,land:.13,bob:1.3,poof:.42,ping:1.2,breathe:1.4,march:10,draw:.35,ease:20,repick:120,steps:8000,stride:2,off:8,rebuild:250,
  col:{foe:'#ff5a48',friend:'#76d86a',neutral:'#ece6d4',comp:'#e8b94a',hold:'#e8b94a',ground:'#f2ecd8',gold:'#e8b94a',enc:'#4aa0f0'},dark:'#140e08'};
// (its state: the effects playing (ripples, puffs), the goal you walk to and when it was set, what you chase or follow (f), the
// way there, its prints this frame (dots: screen x, y, alpha each; feet: the way each points (wuiFoot's d), 1 a left print), the
// brackets (b: where they stand now, world px; to: where they go) and what the pointer was last picked on)
const WUI={fx:[],dest:null,tgt:null,way:null,s:0,dots:[],feet:[],hov:null,hp:{t:-1e9,x:NaN,y:NaN,o:null},now:0};
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
// the crossed swords (icons.js ICONS.attack, the ring's Attack), outlined in the figures' navy (people.js PEOPLE_OUT): the marker
// over a party you go to attack. tip: the row of its pommels in the picture, cx its middle
function wuiSwords(){let c=WUIP.get('x');if(c)return c;const I=ICONS.attack,M=I.px,h=M.length,w=M[0].length,at=(x,y)=>y>=0&&y<h&&x>=0&&x<w&&M[y][x]!=='.';
  c=mkc(w+2,h+2,g=>{for(let y=-1;y<=h;y++)for(let x=-1;x<=w;x++)if(!at(x,y)&&(at(x-1,y)||at(x+1,y)||at(x,y-1)||at(x,y+1)))rect(g,PEOPLE_OUT,x+1,y+1);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(at(x,y))rect(g,I.p[M[y][x]],x+1,y+1)});
  c.cx=(w+2)>>1;c.tip=h;WUIP.set('x',c);return c}
// (a picture with its point (px, py) at the screen's (x, y))
const wuiPut=(c,x,y,px,py)=>ctx.drawImage(c,x-px,y-py);
/* a footprint of the way (the owner, 2026-10-23: small footprints for its dots, in their gold, at their spacing), drawn by hand
   as pixels: a right foot pointing north (N) and north-east (NE), its ball (the big toe on its inner side) and its heel apart; the
   other ways turned from them by quarter turns, a left one mirrored along its length. d: one of WUI_FOOT.dirs (8) ways, 0 east,
   on clockwise; a pixel edge round it in the dark at WUI_FOOT.edge, its toe's tip lit. gap: px from one print to the next along
   the way (a left, then a right); side: px each sits off the way's middle; look: px before and after it the way's heading is read
   over. Its middle at (cx, cy) in the picture */
const WUI_FOOT={gap:8,side:2,look:4,dirs:8,edge:.55,N:['##.','###','###','...','.##','.##'],NE:['...##','..###','..##.','.....','##...']};
function wuiFoot(d,left,col){const key='f'+d+(left?'l':'r')+col;let c=WUIP.get(key);if(c)return c;const F=WUI_FOOT,o=d%2,B=o?F.NE:F.N,bw=B[0].length,bh=B.length;let p=[];
  B.forEach((r,y)=>{for(let x=0;x<bw;x++)if(r[x]==='#')p.push([x-(bw-1)/2,y-(bh-1)/2])});
  if(left)p=p.map(([x,y])=>o?[-y,-x]:[-x,y]);for(let k=((d-6-o)/2%4+4)%4;k>0;k--)p=p.map(([x,y])=>[-y,x]);
  const x0=Math.min(...p.map(q=>q[0])),y0=Math.min(...p.map(q=>q[1])),W=Math.round(Math.max(...p.map(q=>q[0]))-x0)+1,H=Math.round(Math.max(...p.map(q=>q[1]))-y0)+1,M=new Uint8Array(W*H),at=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&M[y*W+x];
  for(const [x,y] of p)M[Math.round(y-y0)*W+Math.round(x-x0)]=1;
  const ux=Math.cos(d/F.dirs*6.2832),uy=Math.sin(d/F.dirs*6.2832);let tip=-1,tu=-1e9;for(let i=0;i<W*H;i++)if(M[i]){const u=(i%W)*ux+((i/W)|0)*uy;if(u>tu+1e-6){tu=u;tip=i}}
  c=mkc(W+2,H+2,g=>{g.globalAlpha=F.edge;for(let y=-1;y<=H;y++)for(let x=-1;x<=W;x++)if(!at(x,y)&&(at(x-1,y)||at(x+1,y)||at(x,y-1)||at(x,y+1)))rect(g,WUI_K.dark,x+1,y+1);
    g.globalAlpha=1;for(let i=0;i<W*H;i++)if(M[i])rect(g,i===tip?wuiMix(col,.6):col,i%W+1,((i/W)|0)+1)});
  c.cx=Math.round(-x0)+1;c.cy=Math.round(-y0)+1;WUIP.set(key,c);return c}
/* ---- a click: the ripple, the arrow's drop (input.js worldGo, after the click has done what it does) ---- */
function wuiClick(wx,wy){if(G.mode!=='world')return;const now=performance.now(),o=G.chase&&objKind(G.chase)?G.chase:null;if(!o&&P.tx==null)return;
  if(o&&WUI.tgt&&WUI.tgt.o===o)WUI.tgt.t=now;else if(!o&&WUI.dest)WUI.dest.t=now;WUI.way=null;
  if(!reducedMotion()){WUI.fx.push({k:'ripple',x:Math.round(wx),y:Math.round(wy),t:now,col:WUI_K.col[o?wuiKind(o):'gold']});if(WUI.fx.length>12)WUI.fx.shift()}}
/* ---- the way you will walk: your hero's own steps (world.js heroWay: straight on while the line is open ground, else by the
   router, round water and the peaks, over a ford, a bridge or a ferry; with no way it knows, straight on while that gets nearer)
   followed ahead from (x0, y0) toward (x1, y1) by a ghost, WUI_K.stride px a step, a point every 3 px; it stops where the walk
   would stall. {X, Y, S (the way's length to each point), n, i (the point you are at), gx, gy, ok (it gets there), v (the router's
   ways it was laid on: WAYV, world/router.js), t} ---- */
function wuiWay(x0,y0,x1,y1,now){const X=[x0],Y=[y0],o={x:x0,y:y0,dir:1},st=WUI_K.stride;let ok=false;
  for(let n=0;n<WUI_K.steps;n++){const d=Math.hypot(x1-o.x,y1-o.y);if(d<2){ok=true;break}
    const r=heroWay(o,x1,y1,Math.min(d,st));if(!r)break;
    if(r<0&&(!walk(o,x1-o.x,y1-o.y,Math.min(d,st))||Math.hypot(x1-o.x,y1-o.y)>=d-st*.25))break;
    const l=X.length-1;if(Math.hypot(o.x-X[l],o.y-Y[l])>=3){X.push(o.x);Y.push(o.y)}}
  if(ok){X.push(x1);Y.push(y1)}else if(X[X.length-1]!==o.x){X.push(o.x);Y.push(o.y)}
  const S=[0];for(let i=1;i<X.length;i++)S.push(S[i-1]+Math.hypot(X[i]-X[i-1],Y[i]-Y[i-1]));
  return{X,Y,S,n:X.length,i:0,gx:x1,gy:y1,ok,v:WAYV,t:now}}
// (the point s px along it, world px)
function wuiPt(w,s){s=Math.max(0,Math.min(w.S[w.n-1],s));let lo=0,hi=w.n-1;while(hi-lo>1){const m=(lo+hi)>>1;if(w.S[m]<=s)lo=m;else hi=m}
  const L=w.S[hi]-w.S[lo],q=L>0?(s-w.S[lo])/L:0;return[w.X[lo]+(w.X[hi]-w.X[lo])*q,w.Y[lo]+(w.Y[hi]-w.Y[lo])*q]}
// (where you are along it: the nearest of its next points (a rebuild if you are off it), then onto the leg after it; s: px)
function wuiAlong(w){let j=w.i,bd=1e9;for(let k=w.i,e=Math.min(w.n-1,w.i+80);k<=e;k++){const d=(w.X[k]-P.x)**2+(w.Y[k]-P.y)**2;if(d<bd){bd=d;j=k}}
  if(bd>WUI_K.off*WUI_K.off)return -1;w.i=j;let s=w.S[j];
  if(j<w.n-1){const dx=w.X[j+1]-w.X[j],dy=w.Y[j+1]-w.Y[j],L=dx*dx+dy*dy;if(L>0)s+=Math.max(0,Math.min(1,((P.x-w.X[j])*dx+(P.y-w.Y[j])*dy)/L))*Math.sqrt(L)}
  return s}
/* ---- once a frame, before anything is drawn: the goal and the chase as they are now; arrived, the puff ---- */
function wuiSync(now){WUI.now=now;WUI.fx=WUI.fx.filter(f=>(now-f.t)/1000<(f.k==='ripple'?WUI_K.ripple:WUI_K.poof));
  const fo=!G.chase&&G.follow&&objKind(G.follow.o)?G.follow.o:null,ch=G.chase&&objKind(G.chase)?G.chase:fo;
  if(ch){if(!WUI.tgt||WUI.tgt.o!==ch||WUI.tgt.f!==!!fo){WUI.tgt={o:ch,t:now,f:!!fo};WUI.way=null}WUI.dest=null}
  else{WUI.tgt=null;if(P.tx!=null&&!P.stay){const d=WUI.dest;if(!d||Math.abs(d.x-P.tx)>.5||Math.abs(d.y-P.ty)>.5){WUI.dest={x:P.tx,y:P.ty,t:now};WUI.way=null}}
    else{const d=WUI.dest;if(d&&Math.hypot(P.x-d.x,P.y-d.y)<6&&!reducedMotion())WUI.fx.push({k:'poof',x:Math.round(d.x),y:Math.round(d.y),t:now,col:WUI_K.col.gold});WUI.dest=null}}
  if(!WUI.dest&&!WUI.tgt)WUI.way=null;
  // (the way: laid again for a new goal, a chased party gone on (at most every WUI_K.rebuild ms), the router's ways changed, or you
  // off it)
  const g=WUI.tgt?WUI.tgt.o:WUI.dest;if(!g)return;let w=WUI.way;
  if(w&&(w.v!==WAYV||Math.hypot(w.gx-g.x,w.gy-g.y)>(WUI.tgt?4:.5)&&now-w.t>(WUI.tgt?WUI_K.rebuild:0)))w=null;
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
// the crossed swords at screen (x, y): their pommels' row there; at least WUI_K.swords CSS px high (zoomed far out, a phone's
// farthest: at a whole multiple of their pixels, still crisp)
function wuiDrawSwords(x,y){const c=wuiSwords(),s=Math.max(1,Math.ceil(WUI_K.swords/(c.height*VS/(window.devicePixelRatio||1))));
  if(s===1)wuiPut(c,x,y,c.cx,c.tip);else ctx.drawImage(c,x-c.cx*s,y-c.tip*s,c.width*s,c.height*s)}
// an arrow dropping onto (x, y) from t0: falls (drawn out), lands (squashed), then bobs; its shadow on the ground under it. put:
// another marker in its place, dropping and bobbing as it does (wuiDrawSwords)
function wuiDrop(x,y,t0,col,now,rm,ground,put){const e=(now-t0)/1000,D=WUI_K.drop,Ld=WUI_K.land;let h=0,k='stand';
  if(!rm){if(e<D){const q=e/D;h=Math.round(22*(1-q*q));k='fall'}else if(e<D+Ld)k='squash';else h=Math.round((1-Math.cos((e-D-Ld)/WUI_K.bob*6.2832))*1.5)}
  if(ground){const sw=h>12?1:h>4?2:3;ctx.globalAlpha=.4;ctx.fillStyle=WUI_K.dark;ctx.fillRect(x-sw,y,2*sw+1,1);if(sw>1)ctx.fillRect(x-sw+1,y+1,2*sw-1,1);ctx.globalAlpha=1}
  if(put)put(x,y-2-h);else wuiDrawArrow(x,y-2-h,k,col)}
// the corner brackets round a box on the screen (x1, y1 past its last pixel), p px out from it, outlined dark, alpha a; a glow
// inside of strength g
function wuiBrackets(x0,y0,x1,y1,col,a,p,g){const w=x1-x0,h=y1-y0;
  if(g>0&&w>2&&h>2){ctx.fillStyle=col;ctx.globalAlpha=a*g*.1;ctx.fillRect(x0,y0,w,h);ctx.globalAlpha=a*g*.16;ctx.fillRect(x0,y0,w,1);ctx.fillRect(x0,y1-1,w,1);ctx.fillRect(x0,y0+1,1,h-2);ctx.fillRect(x1-1,y0+1,1,h-2)}
  const X0=x0-1-p,Y0=y0-1-p,X1=x1+p,Y1=y1+p,L=Math.max(3,Math.min(6,Math.floor(Math.min(X1-X0,Y1-Y0)/3)));
  const arms=[[X0,Y0,L,1],[X0,Y0,1,L],[X1-L+1,Y0,L,1],[X1,Y0,1,L],[X0,Y1,L,1],[X0,Y1-L+1,1,L],[X1-L+1,Y1,L,1],[X1,Y1-L+1,1,L]];
  ctx.globalAlpha=a*.8;ctx.fillStyle=WUI_K.dark;for(const [x,y,aw,ah] of arms)ctx.fillRect(x-1,y-1,aw+2,ah+2);
  ctx.globalAlpha=a;ctx.fillStyle=col;for(const [x,y,aw,ah] of arms)ctx.fillRect(x,y,aw,ah);
  ctx.fillStyle=wuiMix(col,.5);ctx.fillRect(X0,Y0,1,1);ctx.fillRect(X1,Y0,1,1);ctx.fillRect(X0,Y1,1,1);ctx.fillRect(X1,Y1,1,1);ctx.globalAlpha=1}
// the footprints along the way, from just past you to just short of the goal, marching on toward it (a print each
// WUI_FOOT.gap px, a left then a right, each WUI_FOOT.side px off the way's middle on its side and turned along it; their phase by
// the clock, over a pair's stride, so a print keeps its side as they march); drawn out from you over WUI_K.draw s when it is
// new; faint the first px from you; none on land never seen
function wuiTrail(cam,now,rm){const w=WUI.way,D=WUI.dots,FT=WUI.feet;D.length=0;FT.length=0;if(!w||w.n<2)return;const F=WUI_FOOT,s0=WUI.s,end=w.S[w.n-1]-(WUI.tgt?10:6),gp=F.gap,ph=rm?0:(now/1000*WUI_K.march)%(2*gp),col=WUI.tgt?WUI_K.col[wuiKind(WUI.tgt.o)]:WUI_K.col.gold;
  const reach=rm?1e9:s0+(now-w.t0)/1000/WUI_K.draw*(end-s0+20);let n=0;
  for(let k=Math.ceil((s0+3-ph)/gp),s=k*gp+ph;s<end&&s<reach&&n<400;k++,s+=gp){const [x,y]=wuiPt(w,s),[ax,ay]=wuiPt(w,s-F.look),[bx,by]=wuiPt(w,s+F.look),l=Math.hypot(bx-ax,by-ay)||1,ux=(bx-ax)/l,uy=(by-ay)/l,left=!(k&1),sd=left?-F.side:F.side;
    // (seen where it is drawn: a point rounded over a tile's edge into the dark is not)
    const rx=Math.round(x-uy*sd),ry=Math.round(y+ux*sd);if(!seenAt(rx,ry))continue;const sx=rx-cam.x,sy=ry-cam.y;if(sx<-6||sy<-6||sx>VW+6||sy>VH+6)continue;
    D.push(sx,sy,Math.min(1,(s-s0-3)/14,(end+6-s)/8));FT.push(((Math.round(Math.atan2(uy,ux)/6.2832*F.dirs))%F.dirs+F.dirs)%F.dirs,left?1:0);n++}
  for(let i=0,f=0;i<D.length;i+=3,f+=2){const c=wuiFoot(FT[f],FT[f+1],col);ctx.globalAlpha=D[i+2];wuiPut(c,D[i],D[i+1],c.cx,c.cy)}ctx.globalAlpha=1}
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
// over the labels: the goal's arrow, the arrow over what you chase (the crossed swords over a foe), the brackets
function wuiOver(cam){if(G.mode==='title')return;const now=WUI.now||performance.now(),rm=reducedMotion();
  if(WUI.dest){const d=WUI.dest;wuiDrop(Math.round(d.x)-cam.x,Math.round(d.y)-cam.y,d.t,WUI_K.col.gold,now,rm,true)}
  if(WUI.tgt&&!WUI.tgt.f&&WUI.tgt.o.inView(vis())){const o=WUI.tgt.o,T=wuiTargetAt(o,cam),k=wuiKind(o);wuiDrop(T.x,T.top,WUI.tgt.t,WUI_K.col[k],now,rm,false,k==='foe'?wuiDrawSwords:null)}// (one you follow: no arrow)
  wuiRoadOver(cam,now,rm);wuiEscorts(cam,now,rm);
  const h=WUI.hov;if(h){const b=h.b,col=WUI_K.col[h.kind],x0=wuiX(b[0],cam),y0=wuiY(b[1],cam),x1=wuiX(b[2],cam),y1=wuiY(b[3],cam),br=rm?0:(1+Math.sin(now/1000/WUI_K.breathe*6.2832))/2;
    wuiBrackets(x0,y0,x1,y1,col,h.kind==='ground'?.75:1,rm?0:Math.round(br),h.kind==='ground'?.5+.5*br:1+br)}}
/* ---- the encounters on the road (world/road.js), each you know of and have not met (marked). Under the banners: sound
   waves rippling out from its feet while you see it. Over the labels: a pulsing "!" over it while it is on the screen (heard and
   not yet seen, over the fog too), its call-out over that for ENC_LIFE.say s the first time you see it there; off the screen,
   at the screen's edge toward it, its waves rolling in from there "((((" (arcs round a point just past the edge), the "!" just
   inside them. All in real time, still under reducedMotion ---- */
WUI_ARROW.bang=['###','###','###','###','###','.#.','...','###','###'];// (a plain "!", in the encounters' blue: WUI_K.col.enc)
WUI_ARROW.ask=['.###.','##.##','...##','..##.','.##..','.##..','.....','.##..','.##..'];// (a "?": a rumour heard, world/news.js drawRumourMarks)
/* (under them: sound waves, rings rippling out from their feet along the ground one after another, fading as they spread; the
   map's own crisp rings (wuiRing), WAVE: s a ring takes (t), rings at once (n), how far past the scene it spreads (px), the
   ground's tilt (ry: of rx), its strength at the start (a); at the screen's edge: arcs at once, how far they roll in (edge, px),
   their half width (span, radians), how far past the edge their centre lies (src, px). In the encounters' blue (WUI_K.col.enc), as their "!". Still, under reducedMotion: one ring half out) */
const WAVE={t:1.8,n:3,px:20,ry:.5,a:.85,edge:22,arcs:4,span:.75,src:10};
// (an arc of a wave rolling in from the screen's edge: radius r, its middle facing d (sixteenths of a turn, 0 east, clockwise),
// WAVE.span radians each way; crisp, shadowed as the rings are; its centre at (cx, cy) in the picture)
function wuiArc(r,d,col){const k='c'+r+','+d+col;let c=WUIP.get(k);if(c)return c;const pts=new Set(),a0=d/16*6.2832,n=Math.max(8,Math.round(4*r*WAVE.span));
  for(let i=0;i<=n;i++){const a=a0-WAVE.span+2*WAVE.span*i/n;pts.add((Math.round(r+1+Math.cos(a)*r))+','+(Math.round(r+1+Math.sin(a)*r)))}
  c=mkc(2*r+3,2*r+4,g=>{const P2=[...pts].map(p=>p.split(',').map(Number));g.globalAlpha=.7;for(const [x,y] of P2)rect(g,WUI_K.dark,x,y+1);g.globalAlpha=1;for(const [x,y] of P2)rect(g,col,x,y)});
  c.cx=r+1;c.cy=r+1;WUIP.set(k,c);return c}
// (the rings round (x, y) from r0 out: ry their height to their width; k a phase of its own, so two side by side do not beat as one)
function wuiWaves(x,y,r0,px,ry,k,now,rm){const col=WUI_K.col.enc;for(let i=0;i<(rm?1:WAVE.n);i++){const q=rm?.5:((now/1000/WAVE.t+i/WAVE.n+k*.37)%1),rx=r0+Math.round(q*px),c=wuiRing(rx,Math.max(1,Math.round(rx*ry)),col);
  ctx.globalAlpha=WAVE.a*(1-q)*Math.min(1,q*6);wuiPut(c,x,y,c.cx,c.cy)}ctx.globalAlpha=1}
function wuiRoadUnder(cam,now,rm){const V=vis();for(const e of roadList()){if(!e.marked()||!e.inView(V))continue;const b=e.box();
  wuiWaves(Math.round(wuiX((b[0]+b[2])/2,cam)),Math.round(wuiY(b[3]-1,cam)),Math.max(6,Math.round((b[2]-b[0])*.5)),WAVE.px,WAVE.ry,e.seed||0,now,rm)}}
function wuiRoadOver(cam,now,rm){const V=vis(),col=WUI_K.col.enc,bang=wuiArrow('bang',col),p=rm?1:(1+Math.sin(now/1000*5))/2,bob=rm?0:Math.round(p*2);
  for(const e of roadList()){if(!e.marked())continue;const b=e.box(),x=Math.round(wuiX((b[0]+b[2])/2,cam)),top=Math.floor(wuiY(b[1],cam)),y=wuiY(e.y,cam);
    if(x>=0&&x<=VW&&top>=4&&y<=VH){const by=top-2-bob;ctx.globalAlpha=.75+.25*p;wuiPut(bang,x,by,bang.cx,bang.tip);ctx.globalAlpha=1;
      if(e.D.call&&e.inView(V)){let t0=ROAD_SAY.get(e);if(t0==null)ROAD_SAY.set(e,t0=now);const q=(now-t0)/1000;if(q<ENC_LIFE.say){ctx.globalAlpha=Math.min(1,(ENC_LIFE.say-q)*2);txt(e.D.call,x,by-bang.tip-3,'#fff2c8','center');ctx.globalAlpha=1}}
      continue}
    const mx=12,my=24,cx=VW/2,cy=VH/2,dx=x-cx,dy=(top+y)/2-cy,k=Math.min((cx-mx)/Math.max(1e-6,Math.abs(dx)),(cy-my)/Math.max(1e-6,Math.abs(dy))),ax=Math.round(cx+dx*k),ay=Math.round(cy+dy*k),a=Math.atan2(dy,dx),ux=Math.cos(a),uy=Math.sin(a);
    const d=(Math.round((a+Math.PI)/(Math.PI/8))%16+16)%16,sx=Math.round(ax+ux*WAVE.src),sy=Math.round(ay+uy*WAVE.src),nA=rm?2:WAVE.arcs;
    for(let i=0;i<nA;i++){const q=rm?(i+1)/(nA+1):((now/1000/WAVE.t+i/nA+(e.seed||0)*.37)%1),c=wuiArc(4+Math.round(q*WAVE.edge),d,col);ctx.globalAlpha=WAVE.a*Math.min(1,q*5)*(1-q*q);wuiPut(c,sx,sy,c.cx,c.cy)}
    ctx.globalAlpha=.8+.2*p;const in_=WAVE.edge-WAVE.src+12;wuiPut(bang,Math.round(ax-ux*in_),Math.round(ay-uy*in_)+4,bang.cx,bang.tip);ctx.globalAlpha=1}}
/* ---- a home a step is bound for (story/steps.js homeMark: an escort's place, a chain's family's door): a small house, in the
   friends' green, bobbing over it (a holding's middle, a house's or an estate's door), while it is on the screen; its dot on the
   minimap is the quests' (render.js). Still, under reducedMotion ---- */
WUI_ARROW.home=['...#...','..###..','.#####.','#######','.#####.','.##.##.','.##.##.'];
function wuiEscorts(cam,now,rm){const c=wuiArrow('home',WUI_K.col.friend),bob=rm?0:Math.round((1+Math.sin(now/1000*3))/2*2);
  for(const q of P.quests){const h=Quest.as(q).homeMark();if(!h)continue;const x=Math.round(h.x-cam.x),y=Math.round(h.y-cam.y);if(x<-10||y<-10||x>VW+10||y>VH+10)continue;wuiPut(c,x,y-12-bob,c.cx,c.tip)}}
