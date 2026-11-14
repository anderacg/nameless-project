'use strict';
/* ---------- camp art: tents and a camp's pieces drawn pixel by pixel (the owner, 2026-11-14: "make each object such as barrel etc
   more detailed", "if they are a cluster then just stack them", "make more tent variety") ----------
   CampArt.tent(style, look, seed, clim): a tent of a style (ridge, bell, tepee, yurt, pavilion, leanto, wedge), its cloth and trim
   (look {cloth, trim, patch}); CampArt.prop(type, n, seed, clim): a piece (barrels, crates, sacks, woodpile: n of them stacked in
   one heap; wagon, cart, stall, shrine, rack, mound). Lit from the top left, each edge a shade of its own colour (no black line:
   the world map's rule), snow on the tops in the frost. Each a canvas {ax, ay (its feet: drawn at x - ax, y - ay + 1, as
   CampSite.tent draws), sh (its shadow)}, kept in spr ---------- */
const CAMP_ART={rim:.24,lit:.1,snow:'#eef2f6',shadow:'#000',wood:'#8a5a32',dark:'#2a2018',rope:'#c8bca0',iron:'#4a4a50',stone:'#8a8a86',
  canvas:['#d8ccb0','#cbbd9c','#e0d6c0'],army:['ridge','bell','wedge','ridge','bell']};
// (a colour lighter (f > 0, toward white) or darker (f < 0, toward black))
const shadeOf=(h,f)=>{const n=parseInt(h.slice(1),16),c=[n>>16&255,n>>8&255,n&255].map(v=>Math.round(f>0?v+(255-v)*f:v*(1+f)));return '#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')};
// a picture as a grid of colours: rectangles, filled polygons and lines on whole pixels (none half covered), then its rim (a colour
// 0: the pixel cleared)
class PixGrid{
  constructor(w,h){this.w=w;this.h=h;this.c=new Array(w*h).fill(null)}
  set(x,y,c){x=Math.round(x);y=Math.round(y);if((c||c===0)&&x>=0&&y>=0&&x<this.w&&y<this.h)this.c[y*this.w+x]=c===0?null:typeof c==='function'?c(x,y):c}
  get(x,y){return x>=0&&y>=0&&x<this.w&&y<this.h?this.c[y*this.w+x]:null}
  rect(x,y,w,h,c){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.set(x+i,y+j,c)}
  // (every pixel whose middle lies inside the polygon pts)
  poly(pts,c){const ys=pts.map(p=>p[1]);for(let y=Math.floor(Math.min(...ys));y<=Math.ceil(Math.max(...ys));y++){const yc=y+.5,xs=[];
    for(let i=0;i<pts.length;i++){const [x0,y0]=pts[i],[x1,y1]=pts[(i+1)%pts.length];if(y0===y1||yc<Math.min(y0,y1)||yc>=Math.max(y0,y1))continue;xs.push(x0+(yc-y0)/(y1-y0)*(x1-x0))}
    xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2)for(let x=Math.ceil(xs[k]-.5);x<=Math.floor(xs[k+1]-.5);x++)this.set(x,y,c)}}
  line(x0,y0,x1,y1,c){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);for(let i=0;i<=n;i++)this.set(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n,c)}
  oval(cx,cy,rx,ry,c){for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){const u=(x+.5-cx)/rx,v=(y+.5-cy)/ry;if(u*u+v*v<=1)this.set(x,y,c)}}
  // (its edges: darker where it meets the air to the right or below, a little lighter at the left and top; snow on each column's top, but on a bare pole or rope)
  finish(clim){const A=CAMP_ART,o=this.c.slice(),W=this.w,H=this.h,at=(x,y)=>x>=0&&y>=0&&x<W&&y<H?o[y*W+x]:null;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=o[y*W+x];if(!c)continue;if(!at(x+1,y)||!at(x,y+1))this.c[y*W+x]=shadeOf(c,-A.rim);else if(!at(x-1,y)||!at(x,y-1))this.c[y*W+x]=shadeOf(c,A.lit)}
    const bare=new Set([A.wood,shadeOf(A.wood,-.2),shadeOf(A.wood,.1),A.rope,A.dark]);
    if(clim==='frost')for(let x=0;x<W;x++)for(let y=0;y<H;y++)if(o[y*W+x]){if(bare.has(o[y*W+x]))break;this.c[y*W+x]=A.snow;if(o[(y+1)*W+x]&&(x*7+y)%3)this.c[(y+1)*W+x]=shadeOf(A.snow,-.06);break}
    return this}
  canvas(ax,ay){const g0=this,cv=mkc(this.w,this.h,g=>{const d=g.createImageData(g0.w,g0.h);g0.c.forEach((c,i)=>{if(!c)return;const n=parseInt(c.slice(1),16);d.data.set([n>>16&255,n>>8&255,n&255,255],i*4)});g.putImageData(d,0,0)});
    cv.ax=ax;cv.ay=ay;cv.sh=mkc(this.w,this.h,g=>{g.fillStyle=CAMP_ART.shadow;g.beginPath();g.ellipse(this.w/2+1,this.h-1.5,this.w*.44,2,0,0,Math.PI*2);g.fill()});return cv}
}
// (a colour shaded across its width: lit at x0, in shadow at x1)
const across=(c,x0,x1,f=.18)=>x=>shadeOf(c,f-2*f*clamp((x-x0)/Math.max(1,x1-x0),0,1));
const CAMP_TENTS={
  // a ridge tent seen from its front corner: its front a triangle with the door, tied back; its roof running back; a peg and its rope
  ridge(G,L,R){const c=L.cloth,d=shadeOf(c,-.22),A=CAMP_ART;G.poly([[6,3],[13,1],[17,13],[12,15]],(x,y)=>(x+2*y)%7===0?shadeOf(d,-.08):d);
    G.poly([[6,3],[0,15],[12,15]],across(c,1,11,.12));G.line(6,3,12,15,shadeOf(c,-.1));G.poly([[6,7],[4,15],[8.5,15]],A.dark);G.poly([[6,7],[3,15],[4.5,15]],shadeOf(c,.18));
    G.line(1,15,11,15,L.trim);G.set(6,2,A.wood);G.set(13,0,A.wood);G.line(13,1,17,4,A.rope);G.set(17,5,A.wood);G.set(0,15,A.wood)},
  // a bell tent: its wall round, its cone over it, a scalloped valance in its trim, its door, a pennant on its pole
  bell(G,L,R){const c=L.cloth,A=CAMP_ART;G.rect(3,10,12,6,across(shadeOf(c,-.06),3,14));G.poly([[9,2],[1,11.5],[17,11.5]],across(c,2,16,.16));
    for(let x=1;x<17;x++){G.set(x,11,L.trim);if(x%2)G.set(x,12,L.trim)}G.rect(8,12,2,4,A.dark);G.line(10,12,10,15,shadeOf(c,.2));
    G.line(9,0,9,2,A.wood);G.rect(10,0,2,1,L.trim);G.set(10,1,L.trim);G.line(16,12,18,15,A.rope)},
  // a hide tepee: its poles crossed over its smoke hole, its hides patched, a painted band round it, its door flap
  tepee(G,L,R){const c=L.cloth,A=CAMP_ART;G.poly([[8,4],[1,16],[15,16]],across(c,2,14,.14));for(let k=0;k<4;k++){const x=3+Math.floor(R()*9),y=8+Math.floor(R()*6);G.rect(x,y,2,2,shadeOf(c,R()<.5?.12:-.14))}
    for(let x=3;x<14;x++)G.set(x,11+((x>>1)%2),L.trim);G.poly([[8,4],[6.5,7],[9.5,7]],shadeOf(c,-.3));
    for(const [x,y] of [[5,0],[10,0],[12,1],[7,0]])G.line(8,4,x,y,shadeOf(A.wood,-.2));G.poly([[8,12],[6.5,16],[9.5,16]],A.dark);G.set(1,16,A.wood);G.set(15,16,A.wood)},
  // a yurt: its felt wall over a lattice, its dome roped from the crown ring, its painted wooden door
  yurt(G,L,R){const c=L.cloth,A=CAMP_ART;G.rect(2,8,14,6,across(c,2,15,.12));for(let y=9;y<11;y++)for(let x=2;x<16;x++)if((x+y)%3===0)G.set(x,y,shadeOf(c,-.18));
    G.poly([[2,8.5],[4,5.5],[7,4],[11,4],[14,5.5],[16,8.5]],across(shadeOf(c,-.08),3,15,.16));for(const x of [4,7,11,14])G.line(9,4.5,x,8,shadeOf(c,-.25));G.line(2,8,15,8,L.trim);
    G.rect(7,3,4,1,shadeOf(A.wood,-.2));G.rect(7,10,3,4,'#b0703a');G.line(7,10,9,10,'#e0b050');G.set(8,12,'#e0b050')},
  // a pavilion: its striped walls, three peaks, a scalloped valance, a pennant over its middle
  pavilion(G,L,R){const c=L.cloth,t=L.trim,A=CAMP_ART;for(let x=2;x<18;x++)G.rect(x,9,1,7,shadeOf((x>>1)%2?c:t,.12-.24*(x-2)/15));
    G.poly([[4,5],[1,9.5],[7.5,9.5]],across(c,1,7,.14));G.poly([[16,5],[12.5,9.5],[19,9.5]],across(c,13,19,.14));G.poly([[10,1],[4,9.5],[16,9.5]],across(c,5,15,.16));
    for(let x=1;x<19;x+=2)G.set(x,10,t);G.rect(9,11,3,5,A.dark);G.set(8,11,shadeOf(c,.2));G.set(12,11,shadeOf(c,.2));G.line(10,0,10,1,A.wood);G.rect(11,0,2,1,t);G.set(11,1,t)},
  // a lean-to: a patched sheet from a bar on two poles down to the ground, a bedroll under it
  leanto(G,L,R){const c=L.cloth,A=CAMP_ART;G.poly([[1,4],[1,12],[8,12]],A.dark);G.rect(2,10,4,2,shadeOf(L.trim,.1));G.poly([[1,4],[11,2],[17,12],[8,12]],across(c,2,16,.14));
    for(let k=0;k<3;k++){const x=5+Math.floor(R()*8),y=5+Math.floor(R()*4),pc=shadeOf(L.trim,R()*.3);G.rect(x,y,3,2,pc);G.set(x,y+2,shadeOf(c,-.3))}
    G.line(1,4,1,12,A.wood);G.line(11,2,11,4,A.wood);G.line(1,4,11,2,shadeOf(A.wood,.1));G.line(17,12,17,9,A.rope)},
  // a small pup tent: a ridge tent low to the ground
  wedge(G,L,R){const c=L.cloth,A=CAMP_ART;G.poly([[5,6],[11,4],[15,12],[10,14]],shadeOf(c,-.2));G.poly([[5,6],[0,14],[10,14]],across(c,1,9,.12));
    G.poly([[5,9],[3.5,14],[6.5,14]],A.dark);G.line(0,14,9,14,L.trim);G.set(5,5,A.wood);G.set(11,3,A.wood);G.set(15,13,A.wood)}
};
const CAMP_TENT_SIZE={ridge:[18,16],bell:[19,16],tepee:[16,17],yurt:[18,14],pavilion:[20,16],leanto:[18,13],wedge:[16,15]};
/* a camp's pieces, each at its feet (x: its middle, y: its bottom row) on G: one of a heap, or the whole piece */
const CAMP_BITS={
  barrel(G,x,y){const w=CAMP_ART.wood,I=CAMP_ART.iron;for(let j=0;j<8;j++){const h=j===0||j===7?2:3;for(let i=-h;i<=h;i++)G.set(x+i,y-7+j,shadeOf(w,.16-.36*(i+h)/(2*h)))}
    for(const j of [1,6])for(let i=-3;i<=3;i++)G.set(x+i,y-7+j,i<-1?shadeOf(I,.35):I);G.rect(x-1,y-7,3,1,shadeOf(w,.3));G.set(x,y-7,shadeOf(w,-.25))},
  crate(G,x,y,R){const w='#a07040',f='#6a4428';G.rect(x-3,y-4,7,5,(i,j)=>(j-y)%2===0?shadeOf(w,-.12):w);G.poly([[x-3,y-4],[x-2,y-6],[x+5,y-6],[x+4,y-4]],shadeOf(w,.2));G.rect(x+4,y-5,1,6,shadeOf(w,-.3));
    G.line(x-3,y-4,x+3,y,f);for(const [i,j] of [[-3,-4],[3,-4],[-3,0],[3,0]])G.set(x+i,y+j,f);G.set(x-2,y-3,'#d8c8a0');G.set(x+2,y-1,'#d8c8a0')},
  sack(G,x,y){const s='#c8b080';G.oval(x,y-2.5,3.4,3,(i)=>shadeOf(s,.14-.3*(i-x+3)/6));G.rect(x-1,y-6,2,1,shadeOf(s,-.3));G.set(x,y-7,shadeOf(s,-.1));G.set(x+1,y-7,shadeOf(s,-.1));G.line(x-2,y-1,x+2,y-1,shadeOf(s,-.15))},
  log(G,x,y){G.rect(x-1,y-2,3,3,'#7a5230');G.set(x,y-1,'#c8a070');G.set(x-1,y-2,'#a07848')},
  wheel(G,x,y){const d='#4a3420';G.oval(x,y,3.2,3.2,d);G.oval(x,y,2,2,0);for(let k=0;k<4;k++){const a=k*Math.PI/4;G.line(x-Math.cos(a)*2,y-Math.sin(a)*2,x+Math.cos(a)*2,y+Math.sin(a)*2,shadeOf(d,.25))}G.set(x,y,'#8a7050')}
};
// (n of a piece heaped: as many on the ground as hold the rest, the rest on top, sitting in their gaps)
function campHeap(G,bit,n,w,h,R,cy){const lo=n<=2?n:n<=4?n-1:Math.ceil(n/2)+1,hi=n-lo,W0=(lo-1)*(w-1);
  for(let i=0;i<lo;i++)bit(G,Math.round(G.w/2-W0/2+i*(w-1)),cy,R);for(let i=0;i<hi;i++)bit(G,Math.round(G.w/2-(hi-1)*(w-1)/2+i*(w-1)),cy-h+2,R)}
const CAMP_PROPS={
  barrels(G,n,R){campHeap(G,CAMP_BITS.barrel,n,8,9,R,G.h-1)},
  crates(G,n,R){campHeap(G,CAMP_BITS.crate,n,8,7,R,G.h-1)},
  sacks(G,n,R){campHeap(G,CAMP_BITS.sack,n,6,6,R,G.h-1)},
  woodpile(G,n,R){const k=3+n,b=G.h-1;G.rect(Math.round(G.w/2-k*1.5),b-8,k*3,8,'#5a4028');for(let r=0;r<3;r++)for(let i=0;i<k-r;i++)CAMP_BITS.log(G,Math.round(G.w/2-(k-r-1)*1.5+i*3),b-r*3,R);G.rect(Math.round(G.w/2-k*1.5),b,k*3,1,'#3e2c1c')},
  // a covered wagon: its canvas hood on its ribs, the hood's open end, its bed of planks on two spoked wheels, its shaft
  wagon(G,n,R,L){const c=L&&L.cloth||'#e0d6c0',b=G.h-1;G.rect(2,b-6,15,3,(x,y)=>y===b-6?'#b08050':'#8a5a32');G.poly([[3,b-6],[3,b-11],[5,b-13],[14,b-13],[16,b-11],[16,b-6]],across(c,4,15,.14));
    for(let x=5;x<16;x+=3)G.line(x,b-12,x,b-7,shadeOf(c,-.2));G.oval(4.5,b-9,1.6,2.6,CAMP_ART.dark);CAMP_BITS.wheel(G,5,b-3);CAMP_BITS.wheel(G,13,b-3);G.line(16,b-5,19,b-4,CAMP_ART.wood)},
  // a cart: its plank bed on a spoked wheel, its shafts, a load (sacks, a barrel, hay or logs)
  cart(G,n,R){const b=G.h-1;G.rect(3,b-7,11,3,(x,y)=>y===b-7?'#b08050':'#8a5a32');G.line(3,b-6,13,b-6,'#6a4428');const ld=Math.floor(R()*4);
    if(ld===0){CAMP_BITS.sack(G,6,b-7);CAMP_BITS.sack(G,10,b-7)}else if(ld===1)CAMP_BITS.barrel(G,8,b-7);else if(ld===2)G.oval(8,b-9,4.5,2.5,(x)=>shadeOf('#d8b860',.12-.24*(x-4)/9));else for(const x of [5,8,11])CAMP_BITS.log(G,x,b-8);
    CAMP_BITS.wheel(G,8,b-3);G.line(13,b-6,17,b-5,CAMP_ART.wood);G.line(13,b-5,17,b-4,shadeOf(CAMP_ART.wood,-.2))},
  // a market stall: its posts, a striped scalloped awning, a counter of goods
  stall(G,n,R,L){const t=L&&L.trim||'#b03a2a',b=G.h-1;G.line(2,b-11,2,b,CAMP_ART.wood);G.line(15,b-11,15,b,CAMP_ART.wood);G.rect(2,b-5,14,4,(x,y)=>y===b-5?'#b08050':'#8a5a32');
    for(let x=3;x<15;x++)G.set(x,b-6,['#d84030','#e0b040','#70a040','#e08030','#d8c8a0'][Math.floor(R()*5)]);
    for(let x=1;x<17;x++){G.rect(x,b-12,1,3,shadeOf((x>>1)%2?t:'#e8e0c8',.08-.16*(x-1)/15));if(x%2)G.set(x,b-9,shadeOf(t,-.1))}},
  // a wayside shrine: a stone plinth, a post, a little gabled box with its holy image, two candles, flowers at its foot
  shrine(G,n,R){const b=G.h-1,s=CAMP_ART.stone;G.rect(3,b-3,6,4,(x,y)=>(x+y)%4===0?shadeOf(s,-.15):s);G.rect(5,b-10,2,7,CAMP_ART.wood);G.rect(3,b-13,6,4,'#7a5230');G.poly([[2.5,b-13],[6,b-16],[9.5,b-13]],'#5a3a20');
    G.rect(4,b-12,4,2,CAMP_ART.dark);G.set(5,b-12,'#e0c060');G.set(6,b-11,'#e0c060');for(const x of [2,9]){G.rect(x,b-5,1,2,'#ece4cc');G.set(x,b-6,'#ffd860')}for(const x of [1,4,8,10])G.set(x,b,['#d85050','#e0d040','#c080e0'][x%3])},
  // a drying rack: its posts and bar, hides stretched on it, a skull on a post
  rack(G,n,R){const b=G.h-1,w=CAMP_ART.wood;G.line(2,b-12,2,b,w);G.line(13,b-12,13,b,w);G.line(1,b-12,14,b-12,shadeOf(w,.1));
    [[3,'#8a5a3a',8],[7,'#b08050',7],[10,'#6e4630',6]].forEach(([x,c,h])=>{G.poly([[x,b-11],[x+3,b-11],[x+3.5,b-11+h],[x-.5,b-11+h]],across(c,x,x+3,.16));G.set(x+1,b-11+h,shadeOf(c,-.3))});
    G.rect(1,b-15,3,2,'#e8e0cc');G.set(2,b-14,CAMP_ART.dark)},
  // a charcoal mound: earth and turf over the stacked wood, its vents glowing, ash round it, a rake leaning on it
  mound(G,n,R){const b=G.h-1;G.oval(8,b-1,7.5,5.5,(x,y)=>(x*3+y*5)%7===0?'#4e6a34':shadeOf('#3a3430',.12-.24*(x-1)/14));G.rect(0,b,16,1,'#5a5650');
    for(const [x,y] of [[5,b-3],[10,b-4],[8,b-1]])G.set(x,y,'#e07030');G.line(14,b-8,12,b,CAMP_ART.wood);G.line(13,b-9,15,b-8,'#6a6a6a')}
};
const CAMP_PROP_SIZE={barrels:n=>[Math.max(10,Math.ceil(n/2+1)*7+4),18],crates:n=>[Math.max(10,Math.ceil(n/2+1)*7+4),14],sacks:n=>[Math.max(8,Math.ceil(n/2+1)*5+4),12],
  woodpile:n=>[(3+n)*3+2,12],wagon:()=>[20,15],cart:()=>[18,14],stall:()=>[18,15],shrine:()=>[12,17],rack:()=>[16,17],mound:()=>[16,12]};
const CampArt={
  tent(style,L,seed,clim){const k='ctent:'+style+':'+L.cloth+':'+L.trim+':'+seed%5+':'+clim;if(spr[k])return spr[k];const [w,h]=CAMP_TENT_SIZE[style]||CAMP_TENT_SIZE.ridge,G=new PixGrid(w,h);
    (CAMP_TENTS[style]||CAMP_TENTS.ridge)(G,L,seeded(seed*389+17));return spr[k]=G.finish(clim).canvas(Math.floor(w/2),h)},
  prop(type,n,seed,clim,L){const k='cprop:'+type+':'+n+':'+seed%9+':'+clim+':'+(L?L.cloth+L.trim:'');if(spr[k])return spr[k];const [w,h]=(CAMP_PROP_SIZE[type]||CAMP_PROP_SIZE.cart)(n||1),G=new PixGrid(w,h);
    CAMP_PROPS[type](G,n||1,seeded(seed*211+3),L);return spr[k]=G.finish(clim).canvas(Math.floor(w/2),h)},
  // (an army's tents: plain canvas of a few styles, the first, its commander's, a pavilion in its side's colour)
  army(i,seed,clim,col){const A=CAMP_ART;return CampArt.tent(i===0?'pavilion':A.army[(seed+i)%A.army.length],{cloth:A.canvas[(seed*3+i)%A.canvas.length],trim:col||'#8a6a4a'},seed,clim)}
};
