'use strict';
/* ---------- the main menu's art (ui/mainmenu.js), drawn in code in the game's pixel style: nothing loaded (the owner's concept
   picture, doc/assets/ashmark-main-menu-pixel-art-reference.png, is only its design) ----------
   MenuScene(W, H, x0): the land at dusk seen from a height, W x H game pixels, its left x0 under the banner: a sunset sky with
     clouds and stars, a dragon far off, snowy ranges in the west, the sea in the east with ships and a smoking volcano on its far
     shore, a castle on its hill with its houses, fields and a windmill, a river down to the front with a bridge between two towers,
     pine woods, a road with a column marching under its banners, and your camp on the rocks in front, its fire, its tent and the
     white tree on its banner, your hero looking out over it all. The engine's own art where it has it (PX.worldTree, PX.buildingModel, PX.centreModel; the people
     figures, people.js followerSprite), graded to dusk (dusk: darker and cooler, rimmed warm on the sun's side, hazed with the
     distance, the windows lit). Laid out from MENU_ART.seed (PX.rng, PX.hash: never Math.random), the same every time.
     Baked once into bg (the size changing makes a new one); draw(g, t) puts bg down and only the moving bits over it: the fire,
     its light, sparks and smoke, the column, the banners, the water's glints, the ships, the dragon.
   menuBanner(w, h, flag): the banner down the left, its iron posts and rod, the dark cloth ragged at its foot, and the lighter
     flag the emblem hangs on (flag: [x, y, w, h], in its pixels).
   menuEmblem(): the emblem, a pale tree whose roots run down into mountains. menuTitle(): ASHMARK in pale serif pixel capitals */
const MENU_ART={seed:7,horizon:.34,fps:12,
  // the sky from its top down to the sunset (dithered bands), the sun (u: across the scene right of the banner, 0-1)
  sky:['#11112a','#1b1a37','#272244','#3c2b4e','#5c3352','#86404f','#b34f45','#da6c40','#f09848','#fbc463','#ffe39a'],sun:{u:.8,r:8},
  // the ranges: far (high, snowy, lit warm on the sun's side), near (lower, darker, wooded at the foot)
  far:{lit:'#8e6076',shade:'#463f62',ridge:'#b0788a',snowLit:'#f8dcc8',snowShade:'#a6a5cf',haze:'#7a4a66'},
  near:{lit:'#5e4660',shade:'#2f2d4a',ridge:'#7e5a72',snowLit:'#e2c0bc',snowShade:'#8482aa',haze:'#3c3450'},
  // dusk on the models, trees and figures: multiplied; rimmed on the sun's side; hazed with distance toward haze
  dusk:[.62,.52,.68],rim:'#f4a86a',haze:'#4c3650',window:'#ffd27a',
  ground:{far:'#3a3248',dark:'#1c2422',hill:'#2e3936',hill2:'#36423a',lit:'#5c5640',vale:'#2a3431',meadow:'#33402f',rock:'#18161e',rock2:'#221e28',rockLit:'#6a4434',
    fields:[['#b08c3e','#94742e'],['#7c8a3c','#66742e'],['#8a6a40','#74563a']],hedge:'#1c2420',road:'#4e3f35',roadLit:'#7a5e44'},
  water:{deep:'#2e2a50',bank:'#14121c',glint:['#fff0b0','#ffc070']},
  smoke:'#5e5668',fire:['#fff6c0','#ffd04a','#f2822a','#b8361e'],army:'#a83232',camp:'#44503e',dragon:'#211019'};
const MenuArt=(()=>{
  const A=MENU_ART,hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)],mix=(a,b,t)=>PX.mix(a,b,Math.max(0,Math.min(1,t)));
  // (4x4 ordered dither: the bands of the sky, the haze, the light)
  const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>(v+.5)/16),dith=(x,y)=>BAYER[(y&3)*4+(x&3)];
  // (smooth value noise 0-1 at (x, y), cells of s px: the woods' and the meadows' patches)
  const vnoise=(x,y,s,k)=>{const fx=x/s,fy=y/s,ix=Math.floor(fx),iy=Math.floor(fy),a=fx-ix,b=fy-iy,u=a*a*(3-2*a),v=b*b*(3-2*b),h=(i,j)=>PX.hash(ix+i,iy+j,k);
    return h(0,0)*(1-u)*(1-v)+h(1,0)*u*(1-v)+h(0,1)*(1-u)*v+h(1,1)*u*v};
  /* a sprite graded to dusk (haze 0-1, quantized; rim 0-1; win: its lit windows [[x, y]...]); kept, by its canvas */
  const DUSK=new WeakMap();
  function dusk(img,haze,rim=1,win){haze=Math.round(haze*20)/20;let m=DUSK.get(img);if(!m)DUSK.set(img,m=new Map());const k=haze+'|'+rim;if(m.has(k))return m.get(k);
    const w=img.width,h=img.height,c=PX.canvas(w,h),g=c.getContext('2d');g.drawImage(img,0,0);const d=g.getImageData(0,0,w,h),p=d.data,[hr,hg,hb]=hx(A.haze),[rr,rg,rb]=hx(A.rim);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(p[i+3]<8)continue;let R=p[i]*A.dusk[0],Gn=p[i+1]*A.dusk[1],Bl=p[i+2]*A.dusk[2];
      if(rim&&(x===w-1||p[i+7]<8)){R+=(rr-R)*.5*rim;Gn+=(rg-Gn)*.5*rim;Bl+=(rb-Bl)*.5*rim}
      p[i]=R+(hr-R)*haze;p[i+1]=Gn+(hg-Gn)*haze;p[i+2]=Bl+(hb-Bl)*haze}
    g.putImageData(d,0,0);if(win){g.fillStyle=A.window;for(const [x,y] of win)g.fillRect(x-1,y-1,2,2)}m.set(k,c);return c}
  /* (a painter over a canvas's pixels, as PX.paint's rect, px and poly, written into its ImageData (p, W) and put back by flush:
     the bake's hundreds of thousands of pixels, cheap) */
  function pixels(g,W,H){const d=g.getImageData(0,0,W,H),p=d.data,C=new Map(),col=c=>{let v=C.get(c);if(!v)C.set(c,v=hx(c));return v};
    const px=(c,x,y)=>{x=Math.round(x);y=Math.round(y);if(!c||x<0||y<0||x>=W||y>=H)return;const v=col(c),k=(y*W+x)*4;p[k]=v[0];p[k+1]=v[1];p[k+2]=v[2];p[k+3]=255};
    return{p,W,px,rect(c,x,y,w,h){x=Math.round(x);y=Math.round(y);for(let j=0;j<Math.round(h);j++)for(let i=0;i<Math.round(w);i++)px(c,x+i,y+j)},
      poly(pts,f){const ys=pts.map(q=>q[1]),y0=Math.floor(Math.min(...ys)),y1=Math.ceil(Math.max(...ys));
        for(let y=y0;y<=y1;y++){const cy=y+.5,xs=[];for(let i=0;i<pts.length;i++){const [ax,ay]=pts[i],[bx,by]=pts[(i+1)%pts.length];if(ay<=cy&&by>cy||by<=cy&&ay>cy)xs.push(ax+(cy-ay)/(by-ay)*(bx-ax))}
          xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2)for(let x=Math.round(xs[k]);x<Math.round(xs[k+1]);x++)px(typeof f==='function'?f(x,y):f,x,y)}},
      flush(){g.putImageData(d,0,0)}}}
  // (a bitmap from rows of letters, each a colour of pal)
  const rows=(R,pal)=>PX.canvas(R[0].length,R.length,g=>{R.forEach((r,y)=>[...r].forEach((ch,x)=>{if(pal[ch]){g.fillStyle=pal[ch];g.fillRect(x,y,1,1)}}))});
  const DRAGON=[['................##...............','...............###...............','.............#####...............','.###........######..........###...','..####.....#######.........####...','...#####...#######.......#####....','....######.#######.....######.....','......############....######......','.......##########################.','........######################....','..........################........','............##.....##............'],
    ['.................................','.................................','.................................','.................................','...........###..........#####.....','..##########################......','.....#######################......','.....######################.......','....######..############..........','...####.....####.....##...........','..###.......#......#..............','..#..............................']];
  const BANNER_TREE=['..#..#..#..','#..#.#.#..#','.#..###..#.','..##.#.##..','....###....','.....#.....','.....#.....','.....#.....','....###....','...#.#.#...','..#..#..#..','.#..#.#..#.','#..#...#..#','###########'];
  /* (your hero in front, seen from behind, looking out over the land: hooded, a fur collar, the long cloak with the white tree on
     it, lit on the side toward the fire (west); his sword at his side. 30 x 54) */
  function heroBack(){const W=30,H=54,c=PX.canvas(W,H),g=c.getContext('2d'),P=PX.paint(g),T=BANNER_TREE,O='#0c0a0d',cx=14;
    // (the cloak, widening to a ragged hem; the folds; its western edge in the firelight)
    for(let y=12;y<=45;y++){const t=(y-12)/33,hw=Math.round(7+t*6),fold=x=>((x-cx)*3+y*0)%5===0;for(let x=cx-hw;x<=cx+hw;x++){if(y>=44&&PX.hash(x,y,5)>.5)continue;
      const e=x===cx-hw||x===cx+hw,lit=x<cx-hw+3+Math.round(t*2);P.px(e?O:lit?(x===cx-hw+1?'#7a5a46':'#4c3a3c'):fold(x)&&y>18?'#141218':'#1e1b23',x,y)}}
    T.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch==='#')P.px(j>12?'#b8ae98':'#e6ddc6',cx-5+i,22+j)}));
    // (the hood and the fur collar)
    for(let y=0;y<13;y++){const hw=[2,3,4,5,5,5,5,5,6,7,8,8,8][y];for(let x=cx-hw;x<=cx+hw;x++){const e=x===cx-hw||x===cx+hw||y===0,fur=y>=9;
      P.px(e?O:fur?(x<cx-3?'#a8967e':PX.hash(x,y,9)>.5?'#6e6458':'#5a5248'):x<cx-2?'#6a4c38':'#3a2a22',x,y)}}
    // (the sword's scabbard and hilt at his right; his legs and boots under the hem)
    P.rect('#2a1e16',cx+12,30,2,15);P.rect('#b8b8c4',cx+12,46,1,2);P.rect('#8a6a3a',cx+11,27,4,1);P.rect('#c9a24e',cx+12,26,1,1);
    for(const x of [cx-5,cx+2]){P.rect('#262020',x,45,4,6);P.rect('#3a3030',x,45,1,6);P.rect('#141010',x-1,51,6,3)}return c}
  const SHIP=['....#....','...##....','..###.#..','.####.##.','....#.##.','#########','.#######.'];
  class MenuScene{
    constructor(W,H,x0){this.W=W;this.H=H;this.x0=Math.max(0,Math.min(W-160,x0|0));this.hz=Math.round(H*A.horizon);this.L=H-this.hz;this.R=PX.rng(A.seed);this.flags=[];this.glints=[];this.bake()}
    // (across the scene right of the banner, 0-1; down the land, 0 the horizon, 1 the foot)
    u(f){return Math.round(this.x0+f*(this.W-this.x0))}
    Y(v){return Math.round(this.hz+v*this.L)}
    // the sky's band at (x, y): its height, brighter toward the sun
    skyF(x,y){const t=Math.max(0,Math.min(1,y/this.hz)),d=Math.hypot((x-this.sx)*.5,(y-this.hz)*1.5);return Math.min(A.sky.length-1.001,Math.pow(t,1.6)*(A.sky.length-2.2)+Math.max(0,1.8-d/80))}
    skyAt(x,y){const f=this.skyF(x,y),i=Math.floor(f);return A.sky[f-i>dith(x,y)?i+1:i]}
    bake(){const g=(this.bg=PX.canvas(this.W,this.H)).getContext('2d'),B=pixels(g,this.W,this.H);this.sx=this.u(A.sun.u);this.items=[];
      this.sky(B);this.clouds(B);this.volcano(B);this.ranges(B);this.sea(B);this.land(B);this.fields(B);this.river(B);this.bridge(B);this.roads(B);this.dress();B.flush();
      this.items.sort((a,b)=>a.y-b.y);for(const o of this.items)g.drawImage(o.img,Math.round(o.x-o.img.width/2),Math.round(o.y-o.img.height));
      const B2=pixels(g,this.W,this.H);this.ledge(B2);B2.flush();this.camp(g,PX.paint(g))}
    sky(B){const W=this.W,hz=this.hz,p=B.p,C=A.sky.map(hx),R=this.R;
      for(let y=0;y<hz;y++)for(let x=0;x<W;x++){const f=this.skyF(x,y),i=Math.floor(f),c=C[f-i>dith(x,y)?i+1:i],k=(y*W+x)*4;p[k]=c[0];p[k+1]=c[1];p[k+2]=c[2];p[k+3]=255}
      // (stars in the dark above, the east's night)
      for(let n=0;n<90;n++){const x=Math.floor(R()*W),y=Math.floor(R()*R()*hz*.5),k=(y*W+x)*4,v=140+Math.floor(R()*100);if(this.skyF(x,y)<2.4){p[k]=v;p[k+1]=v;p[k+2]=Math.min(255,v+25)}}
      const s=A.sun.r;// (the sun, half set)
      for(let y=-s;y<=0;y++)for(let x=-s;x<=s;x++){const q=x*x+y*y;if(q<=s*s+1)B.px(q>(s-2)*(s-2)?'#ffd27a':'#fff4cc',this.sx+x,hz-1+y)}}
    // clouds: streaks across the sunset (smooth noise stretched sideways, in a few bands), dark bodies, their undersides lit (hotter
    // toward the sun), their tops a shade lighter; the low bands thinner
    clouds(PB){const W=this.W,hz=this.hz,R=this.R,B=[];for(let n=0;n<6;n++)B.push({y:hz*(.08+n*.15+R()*.06),h:4+R()*(n<4?9:4),k:50+n,thr:.5+R()*.08});
      const p=PB.p,C=Object.fromEntries(Object.entries({b:'#231d3a',b2:'#2e2546',top:'#3e3256',lit:'#c45a48',hot:'#ffae66',deep:'#8a3e4a'}).map(([k,v])=>[k,hx(v)]));
      const at=(x,y)=>{for(const b of B){const e=(y-b.y)/b.h;if(e*e>=1)continue;if(vnoise(x,y*3.2,46,b.k)*.75+vnoise(x,y*3.2,13,b.k+9)*.25>b.thr+e*e*.32)return b}return null};
      for(let y=0;y<hz;y++)for(let x=0;x<W;x++){const b=at(x,y);if(!b)continue;const k=(y*W+x)*4,sun=Math.max(0,1-Math.abs(x-this.sx)/(W*.55))*(.4+.6*y/hz),under=!at(x,y+2),over=!at(x,y-1);
        const col=under?(dith(x,y)<sun*1.3?C.hot:C.lit):!at(x,y+4)?(dith(x,y)<sun?C.lit:C.deep):over?C.top:dith(x,y)<.5?C.b:C.b2;p[k]=col[0];p[k+1]=col[1];p[k+2]=col[2]}}
    // the volcano on the sea's far shore: its glow, its lava, its plume leaning west into the clouds
    volcano(P){const hz=this.hz,x=this.u(.95),h=Math.round(this.hz*.22);
      P.poly([[x-34,hz+1],[x-4,hz-h],[x+5,hz-h],[x+34,hz+1]],(px,py)=>px>x+3&&dith(px,py)<.4?'#3c2430':dith(px,py)<.5?'#2a1c28':'#30202c');
      for(const [dx,l] of [[-1,10],[1,7],[2,13],[-2,5],[4,8]])for(let i=0;i<l;i++)P.px(i<2?'#ffc050':i<l-3?'#e04a2a':'#8a2a24',x+dx+Math.round(i*dx*.4),hz-h+i);
      for(let i=0;i<52;i++){const t=i/52,cx=x-t*t*70+Math.sin(i*.7)*3,cy=hz-h-2-t*hz*.75,r=2+t*10;
        for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++)if(xx*xx+yy*yy<=r*r&&PX.hash(cx+xx|0,cy+yy|0,3)>.25+t*.3)P.px(yy>r*.2&&t<.3?(t<.12?'#b0402e':'#6a2a30'):dith(xx|0,yy|0)<.5?'#2c2030':'#382a3c',cx+xx,cy+yy)}}
    /* a range of peaks: each column's highest peak owns it, lit on the sun's side; spurs run down from each peak, snow above a ragged
       line and down the gullies, the foot lost in the valley's haze */
    range(B,o,L,base){const W=this.W,p=B.p,C={};for(const k in o)C[k]=hx(o[k]);
      for(let x=0;x<W;x++){let best=-1,bh=0;for(let k=0;k<L.length;k++){const q=L[k],h=q.h-(x<q.x?q.x-x:x-q.x)*(x<q.x?q.sl:q.sr)+(PX.hash(x>>1,k,9)-.5)*2;if(h>bh){bh=h;best=k}}if(best<0||bh<1)continue;
        const q=L[best],lit=x>=q.x,top=Math.round(base-bh);
        for(let y=Math.max(0,top);y<=base;y++){const k=(y*W+x)*4,dy=y-(base-q.h),sp=q.spurs.some(s=>Math.abs(x-q.x-s*dy)<.7&&dy>3&&dy<q.h*.16),
            crag=vnoise(x+best*40,y*1.8,5,30+best),gul=(x+Math.round(dy*(lit?.55:-.55))+best*5)%8===0&&crag>.45,
            snow=dy<q.h*(q.snow+vnoise(x,best*9,3,5)*.07)||gul&&dy<q.h*(q.snow+.14),haze=(y-(base-q.h*.6))/(q.h*.6);
          let c=snow?(lit?C.snowLit:C.snowShade):(lit?(crag<.3?C.shade:C.lit):(crag>.72?C.ridge:C.shade));if(sp)c=lit?C.shade:C.ridge;else if(gul&&!snow)c=C.shade;
          if(y===top)c=snow?(lit?C.snowLit:C.snowShade):lit?C.ridge:c;if(haze>0&&dith(x,y)<haze*.95)c=C.haze;p[k]=c[0];p[k+1]=c[1];p[k+2]=c[2];p[k+3]=255}}}
    ranges(B){const R=this.R,hz=this.hz,peak=(f,h,snow)=>({x:this.u(f),h,sl:.7+R()*.5,sr:.6+R()*.5,snow,spurs:[-.5-R()*.4,.3+R()*.4,(R()-.5)*.3]});
      // (the far range high in the west, falling to the sea; the near range lower before it)
      const far=[],near=[];for(let n=0;n<13;n++){const f=-.45+n*.075+R()*.04,env=Math.max(.12,1-Math.max(0,f-.0)*1.6);far.push(peak(f,(hz*.55+R()*hz*.4)*env+this.L*.12,.2+R()*.08))}
      for(let n=0;n<10;n++){const f=-.4+n*.07+R()*.04,env=Math.max(0,1-Math.max(0,f-.05)*2.4);if(env>.05)near.push(peak(f,(hz*.25+R()*hz*.25)*env+this.L*.12,.08))}
      this.range(B,A.far,far,this.Y(.12));this.range(B,A.near,near,this.Y(.2))}
    // the sea in the east: the sky in it, the sun's road of light; its ships
    seaB(x){const a=this.u(.42),b=this.u(.64);return x<a?this.hz-1:x<b?Math.round(this.hz+(x-a)/(b-a)*this.L*.2+PX.hash(x>>2,1,6)*2):this.Y(.2)+Math.round(Math.sin(x*.05)*2)}
    sea(P){const hz=this.hz,W=this.W;
      for(let x=this.u(.42);x<W;x++)for(let y=hz;y<=this.seaB(x);y++){let c=this.skyAt(x,Math.max(0,hz-(y-hz)*2.5-2));if(dith(x,y)<(y-hz)/(this.L*.3))c=mix(c,A.water.deep,.45);P.px(c,x,y)}
      for(let y=hz+1;y<this.Y(.2);y++){const w=2+(y-hz)*.7;for(let x=-w;x<=w;x++)if((y&1)&&PX.hash(x+this.sx|0,y,4)>.5+Math.abs(x)/w*.45){P.px(A.water.glint[1],this.sx+x,y);if(PX.hash(x|0,y,5)>.5)this.glints.push([this.sx+x,y])}}
      this.ships=[[this.u(.66),this.Y(.04)],[this.u(.86),this.Y(.08)],[this.u(.77),this.Y(.15)]]}
    // the land: hills under the ranges, the castle's hill lit on its east, meadows and the vale down to the front
    land(P){const W=this.W,H=this.H,Gd=A.ground,h=this.hill={x:this.u(.34),y:this.Y(.17),w:(W-this.x0)*.3};
      // (foothills before the ranges, rolling, hazed)
      for(let x=0;x<this.u(.5);x++){const fade=Math.min(1,(this.u(.5)-x)/60),top=Math.round(this.hz-(3+vnoise(x,0,26,77)*16)*fade);for(let y=top;y<this.hz;y++)P.px(y===top?'#4e3c56':dith(x,y)<.5?Gd.far:'#33304a',x,y)}
      for(let y=this.hz;y<H;y++)for(let x=0;x<W;x++){if(y<=this.seaB(x))continue;const v=(y-this.hz)/this.L,n=vnoise(x,y*2,18,14),warm=Math.max(0,1-v*1.6)*Math.max(0,(x-this.x0)/(W-this.x0))*.55;
        let c=v<.1?(dith(x,y)<v*10?Gd.hill:Gd.far):n>.64?(dith(x,y)<.5?Gd.meadow:Gd.hill):dith(x,y)<.5-v*.3?Gd.hill:Gd.vale;if(warm>0&&dith(x,y)<warm)c=Gd.lit;if(v>.72&&dith(x,y)<(v-.72)*2)c=Gd.dark;P.px(c,x,y)}
      for(let x=Math.round(h.x-h.w);x<=h.x+h.w;x++){const top=h.y+Math.pow(Math.abs(x-h.x)/h.w,1.5)*this.L*.25;for(let y=Math.round(top);y<h.y+this.L*.3;y++){if(y<=this.seaB(x))continue;
        P.px(x>h.x+10&&y<top+2?Gd.lit:y<top+1?Gd.hill2:dith(x,y)<.3?Gd.hill:Gd.hill2,x,y)}}}
    // fields on the hill's foot: furrowed strips in gold, green and brown between dark hedges
    fields(P){const R=this.R,F=A.ground.fields;this.plots=[];
      for(let k=0;k<9;k++){const x=this.u(.06+(k%5)*.085+R()*.03),y=this.Y(.3+Math.floor(k/5)*.09+R()*.02),w=22+Math.floor(R()*14),h=8+Math.floor(R()*5),c=F[Math.floor(R()*3)],sk=.5+R()*.4;
        this.plots.push([x-4,y-2,w+h*sk+8,h+4]);for(let j=0;j<h;j++)for(let i=0;i<w;i++){const px=x+i+Math.round(j*sk);P.px(j===0||i===0||j===h-1?A.ground.hedge:c[(i+(j>>1))%3===0?1:0],px,y+j)}}}
    // the river: from the bay down to the front, wider as it comes; the sunset in it, banks, glints
    riverX(y){const t=(y-this.Y(.2))/(this.H-this.Y(.2));return this.u(.7-t*.24+Math.sin(t*5.5)*.06)}
    riverW(y){return 6+(y-this.Y(.2))*.22}
    wet(x,y){return y>=this.Y(.2)&&Math.abs(x-this.riverX(y))<=this.riverW(y)/2+1||y<=this.seaB(x)&&y>=this.hz}
    river(P){const hz=this.hz;
      for(let y=this.Y(.2);y<this.H;y++){const c=this.riverX(y),w=this.riverW(y)/2;for(let x=Math.round(c-w)-1;x<=Math.round(c+w)+1;x++){const e=x<c-w||x>c+w;
        P.px(e?A.water.bank:mix(this.skyAt(x,Math.max(0,hz-3-(y-hz)*.3)),A.water.deep,.25+(y-hz)/this.L*.25+(dith(x,y)<.3?.1:0)),x,y);if(!e&&PX.hash(x,y,12)>.94)this.glints.push([x,y])}}}
    // a stone bridge across the river between two towers, each flying the realm's banner
    bridge(P){const y=this.Y(.47),c=this.riverX(y),w=this.riverW(y)/2+6,x0=Math.round(c-w),x1=Math.round(c+w);this.br={x0,x1,y};
      for(const ax of [c-w*.45,c+w*.45])for(let a=-5;a<=5;a++){const h=Math.round(Math.sqrt(25-a*a)*1.1);P.rect('#1b1624',ax+a,y-h+2,1,h+1)}
      for(let x=x0;x<=x1;x++){P.rect(x%5===0?'#4a3c46':'#6a5658',x,y-6,1,4);P.px('#a8857a',x,y-7);P.px('#2a2230',x,y-2)}
      for(const [x,s] of [[x0-3,1],[x1+3,7]]){const m=PX.buildingModel({type:'tower',people:'human',seed:s,yaw:0,env:'grass'});this.items.push({img:dusk(m.img,.05,1,m.windows),x,y:y+1});this.flags.push([x,y+1-m.img.height+2,4])}}
    // the roads: up from the bridge to the castle, and from the bridge east to the edge (the column's)
    roads(P){const b=this.br,h=this.hill,W=this.W;this.road=[[b.x1+2,b.y-3],[this.u(.82),b.y+this.L*.1],[this.u(.95),b.y+this.L*.2],[W+30,b.y+this.L*.26]];
      this.road2=[[b.x0-2,b.y-3],[this.u(.52),b.y-this.L*.06],[h.x+30,h.y+this.L*.16],[h.x+8,h.y+6]];
      for(const L of [this.road,this.road2])for(let i=0;i+1<L.length;i++){const [ax,ay]=L[i],[bx,by]=L[i+1],n=Math.ceil(Math.hypot(bx-ax,by-ay));
        for(let k=0;k<=n;k++){const x=ax+(bx-ax)*k/n,y=ay+(by-ay)*k/n;if(this.wet(x|0,y|0))continue;P.rect(A.ground.road,x-2,y-1,5,3);P.px(A.ground.roadLit,x+2,y-1)}}}
    // what stands on the land, sorted by its foot: the castle and its houses, the windmill, the woods
    near(x,y,L,d){for(let i=0;i+1<L.length;i++){const [ax,ay]=L[i],[bx,by]=L[i+1],vx=bx-ax,vy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*vx+(y-ay)*vy)/(vx*vx+vy*vy)));if(Math.hypot(ax+vx*t-x,ay+vy*t-y)<d)return true}return false}
    dress(){const hz=this.hz,H=this.H,R=this.R,h=this.hill,I=this.items,put=(img,x,y)=>I.push({img,x,y}),fy=y=>Math.max(0,Math.min(.55,(1-(y-hz)/this.L)*.6-.05));
      const c=PX.centreModel({tier:'castle',people:'human',seed:2,yaw:0,env:'grass'}),cy=h.y+4;put(dusk(c.img,fy(cy),1,c.windows),h.x,cy);if(c.flag)this.flags.push([h.x-c.img.width/2+c.flag[0],cy-c.img.height+c.flag[1],6]);
      for(const [type,dx,dy,s] of [['townhouse',-36,8,1],['cottage',-56,16,2],['townhouse',34,10,3],['cottage',54,18,4],['chapel',-20,20,1],['cottage',16,24,5],['townhouse',-2,30,6]]){
        const m=PX.buildingModel({type,people:'human',seed:s,yaw:0,env:'grass'});put(dusk(m.img,fy(h.y+dy),1,m.windows),h.x+dx,h.y+dy)}
      const mill=[this.u(.24),this.Y(.42)],wm=PX.buildingModel({type:'windmill',people:'human',seed:1,yaw:2,env:'grass'});put(dusk(wm.img,fy(mill[1]),1,wm.windows),mill[0],mill[1]);
      // (pines in woods, where the land's own noise says, never on the water, the roads, the fields, the castle's ground, the camp's rocks)
      const wood=(x,y)=>vnoise(x,y*1.7,40,41)*.7+vnoise(x,y*1.7,14,42)*.3,ledge=this.u(.44);
      const free=(x,y)=>!(y<hz+4||this.wet(x,y)||this.wet(x-6,y)||this.wet(x+6,y)||this.near(x,y,this.road,10)||this.near(x,y,this.road2,9)||Math.abs(x-h.x)<h.w*.55&&y<h.y+34&&y>h.y-12||
        Math.hypot(x-mill[0],y-mill[1])<18||this.plots.some(([a,b,w,q])=>x>a&&x<a+w&&y>b&&y<b+q+12)||y>this.Y(.8)&&x<ledge||this.br&&Math.abs(y-this.br.y)<12&&x>this.br.x0-16&&x<this.br.x1+16);
      for(let gy=hz+4;gy<H;gy+=5)for(let gx=-30;gx<this.W+10;gx+=8){const x=gx+Math.floor(R()*7)-3,y=gy+Math.floor(R()*4),v=(y-hz)/this.L;if(wood(x,y)<.58-v*.06||!free(x,y))continue;
        const far=v<.24,sp=far&&R()<.4?['frost','spine']:R()<.15?['grass','fir']:['grass','pine'],t=PX.worldTree(sp[0]==='grass'&&sp[1]==='fir'?'frost':sp[0],sp[1],Math.floor(R()*4),far?1:0);put(dusk(t,fy(y),far?.3:.8),x,y)}}
    // the rocks in front: a shelf of boulders across the foot of the scene, their faces toward the fire lit warm; the camp's
    // trodden ground on top
    ledge(P){const H=this.H,R=PX.rng(A.seed+11),f=this.fire={x:this.u(.15),y:H-Math.round(this.L*.1)},x1=this.u(.4),rocks=[];
      for(let n=0;n<40;n++){const x=-24+R()*(x1+40),y=H-this.L*.16+R()*this.L*.2+Math.max(0,x-x1+50)*.45,r=12+R()*20,pts=[];
        for(let k=0;k<9;k++){const a=k/9*Math.PI*2,q=r*(.72+R()*.36);pts.push([x+Math.cos(a)*q*1.35,y+Math.sin(a)*q*.7])}rocks.push({x,y,r,pts})}
      rocks.sort((a,b)=>a.y-b.y);
      for(const o of rocks)P.poly(o.pts,(x,y)=>{const nx=(x-o.x)/(o.r*1.35),ny=(y-o.y)/(o.r*.7),lit=Math.max(0,1-Math.hypot(x-f.x,(y-f.y)*1.3)/110),face=-nx*.45-ny*.85,n=vnoise(x,y,4,o.r|0);
        return face>.5?(lit>.3?(n>.55?'#8a5838':A.ground.rockLit):lit>.1?'#4a3434':'#34303c'):face>.1?(lit>.35&&n>.6?'#5a3a32':n>.62?'#2e2934':A.ground.rock2):n>.75?A.ground.rock2:A.ground.rock});
      for(let y=f.y-7;y<f.y+10;y++)for(let x=f.x-70;x<f.x+90;x++){const e=((x-f.x-10)/80)**2+((y-f.y-1)/9)**2;if(e<1)P.px(e<.4&&dith(x,y)<.8-e?'#4a3428':dith(x,y)<.5?'#2e2428':'#262026',x,y)}}
    // the camp: the tent, barrels, crates and the cart, the fire's logs and stones, the banner's tall pole (its cloth moves: draw),
    // two of your band by the fire, and your hero in front looking out over the land
    camp(g,P){const f=this.fire,put=(img,x,y)=>g.drawImage(img,Math.round(x-img.width/2),Math.round(y-img.height)),m=type=>PX.buildingModel({type,people:'human',seed:1,yaw:0,env:'grass'}).img;
      {const tx=f.x-46,ty=f.y+4,h=34,w=30;P.poly([[tx-w,ty],[tx,ty-h],[tx+w,ty]],(x,y)=>{const r=x>tx,lit=r?Math.max(0,1-(f.x-x)/60):0;return y>=ty-1?'#1e1612':r?(dith(x,y)<lit?'#e8b874':'#b88a52'):(dith(x,y)<.25?'#6a4c32':'#54392a')});
        P.poly([[tx+4,ty],[tx+11,ty-17],[tx+18,ty]],'#140e0c');P.poly([[tx+11,ty-17],[tx+18,ty],[tx+22,ty]],'#f4cc8a');P.rect('#2a1c12',tx,ty-h-4,1,5);for(let i=0;i<=h;i+=2)P.px('#f0d09a',tx+Math.round(i*w/h),ty-h+i);
        for(const sd of [-1,1])for(let i=0;i<10;i++)P.px('#3a2a1c',tx+sd*(w+2+i),ty-h*.45+i*1.7)}
      put(dusk(m('barrels'),0,1),f.x+26,f.y+3);put(dusk(m('crates'),0,1),f.x+40,f.y+6);put(dusk(m('cart'),0,1),f.x+66,f.y+1);put(dusk(m('barrels'),0,1),f.x-76,f.y+6);
      P.rect('#2a1c14',f.x-7,f.y,14,2);P.rect('#4a3424',f.x-6,f.y-1,12,1);P.rect('#1a120c',f.x-4,f.y+2,8,1);for(let a=0;a<10;a++)P.px(a%2?'#6a6270':'#4a4250',f.x+Math.round(Math.cos(a*.63)*9),f.y+1+Math.round(Math.sin(a*.63)*2.5));
      const p=this.pole={x:f.x-14,y:f.y+1,h:Math.round(this.L*.42)};P.rect('#3a2a1c',p.x,p.y-p.h,2,p.h);P.rect('#5a4430',p.x,p.y-p.h,1,p.h);P.rect('#3a2a1c',p.x-1,p.y-p.h+1,30,2);P.rect('#c9a24e',p.x,p.y-p.h-2,2,2);
      if(typeof followerSprite==='function'){put(dusk(followerSprite(A.camp,0,3,'human'),0,1),f.x-16,f.y+3);g.save();g.translate(f.x+15,f.y+2);g.scale(-1,1);put(dusk(followerSprite(A.camp,0,1,'human'),0,1),0,0);g.restore()}
      put(heroBack(),this.u(.3),this.H-2)}
    /* a frame at t seconds (still with reduced motion: a fixed t) */
    draw(g,t){g.drawImage(this.bg,0,0);const P=PX.paint(g),F=Math.floor(t*A.fps),hz=this.hz;
      for(let i=0;i<this.glints.length;i++)if(PX.hash(i,F>>1,77)>.78)P.px(A.water.glint[PX.hash(i,F,78)>.5?0:1],this.glints[i][0],this.glints[i][1]);
      const sh=this._ship||(this._ship=rows(SHIP,{'#':'#1a1420'}));this.ships.forEach(([x,y],i)=>{const b=Math.sin(t*1.2+i*2)>0?0:1;g.drawImage(sh,x,y-7+b);P.rect('#eab07a',x+3,y-6+b,1,3);P.rect('#f0c08a',x+6,y-4+b,1,2)});
      {const img=this._dr||(this._dr=DRAGON.map(r=>rows(r,{'#':A.dragon}))),x=this.u(.62)+Math.sin(t*.06)*30,y=hz*.28+Math.sin(t*.2)*4;g.drawImage(img[Math.floor(t*1.3)%2],Math.round(x),Math.round(y))}
      for(const [x,y,n] of this.flags){P.rect('#2a2018',x,y-1,1,n+3);for(let i=0;i<n;i++)P.rect(i>n-2?'#8a2626':'#b83a32',x+1+i,y+Math.round(Math.sin(t*4+i*.9)*.7),1,Math.max(2,4-(i>n-2?1:0)))}
      this.banner(P,t);this.column(g,t);this.flame(g,P,t,F)}
    // the camp's banner: dark cloth, the white tree on it, its tail ragged, waving
    banner(P,t){const p=this.pole,x0=p.x+2,y0=p.y-p.h+3,w=28,h=Math.min(46,Math.round(p.h*.4)),T=BANNER_TREE,tx=Math.round((w-T[0].length)/2),ty=Math.round(h*.18);
      for(let i=0;i<w;i++){const off=Math.round(Math.sin(t*2.4-i*.4)*1.4*(i/w)),len=h-(i%4===1?4:0)-((i*7)%5===0?2:0)-(i>w-4?(i-w+4)*2:0);
        for(let j=0;j<len;j++){const r=T[j-ty],tr=r&&r[i-tx]==='#';P.px(tr?'#ece3cd':i===0?'#2c2832':j>len-2?'#0e0c10':j%9===4&&!tr?'#1a1720':'#211d27',x0+i,y0+j+off)}}}
    // the column on the eastern road, two banners among them, marching on east
    column(g,t){const L=this.road;if(typeof followerSprite!=='function')return;let tot=0;const seg=L.slice(1).map((q,i)=>{const l=Math.hypot(q[0]-L[i][0],q[1]-L[i][1]);tot+=l;return l});
      const at=s=>{for(let i=0;i<seg.length;i++){if(s<=seg[i]){const k=s/seg[i];return[L[i][0]+(L[i+1][0]-L[i][0])*k,L[i][1]+(L[i+1][1]-L[i][1])*k]}s-=seg[i]}return L[L.length-1]};
      const n=18,gap=10,span=n*gap+tot,list=[],C=this._fw||(this._fw={});
      for(let i=0;i<n;i++){const s=(t*4+i*gap)%span;if(s<10||s>tot)continue;const [x,y]=at(s);list.push([x,y,i])}
      list.sort((a,b)=>a[1]-b[1]);const P=PX.paint(g);
      for(const [x,y,i] of list){const f=Math.floor(t*6+i*3)%8,k=f+'_'+i%6;C[k]=C[k]||dusk(followerSprite(A.army,f,i%6,'human'),.05);g.drawImage(C[k],Math.round(x-8),Math.round(y-15));
        if(i%6===3){const bx=Math.round(x-1),by=Math.round(y-26);P.rect('#2a2018',bx,by,1,13);for(let j=0;j<5;j++)P.rect(j>3?'#7a2020':'#a83030',bx+1+j,by+Math.round(Math.sin(t*5+j)*.6),1,6-(j>3?2:0))}}}
    // the fire: its light on the rocks, flames, sparks, the smoke rising and drifting east
    flame(g,P,t,F){const {x,y}=this.fire;g.save();g.globalAlpha=.08+.04*Math.sin(t*9)+.02*Math.sin(t*23);g.fillStyle='#ff9a40';
      for(const r of [34,22,12]){g.beginPath();g.arc(x,y-3,r,0,Math.PI*2);g.fill()}g.restore();
      for(let i=0;i<11;i++){const h=3+Math.round(PX.hash(i,F,31)*6)-Math.abs(i-5),cx=x-5+i;for(let j=0;j<h;j++)P.px(A.fire[Math.min(3,Math.floor(j/h*3+(PX.hash(i,j+F,32)>.7?1:0)))],cx,y-1-j)}
      for(let i=0;i<6;i++){const ph=(t*.5+i/6)%1;P.px(A.fire[ph<.5?1:2],x+Math.round(Math.sin(i*2.3+t*1.5)*3+ph*5),y-8-Math.round(ph*20))}
      for(let i=0;i<9;i++){const ph=(t*.1+i/9)%1,sx=x+ph*26+Math.sin(t*.7+i)*2,sy=y-10-ph*this.L*.3,r=1+ph*3;g.save();g.globalAlpha=.5*(1-ph);g.fillStyle=A.smoke;g.fillRect(Math.round(sx-r),Math.round(sy-r),Math.round(r*2),Math.round(r*2));g.restore()}}
  }
  /* the banner down the left: iron posts with rivets, the rod across the top, the dark cloth with its weave and folds, ragged at
     its foot; flag: the lighter cloth the emblem hangs on, [x, y, w, h], its own foot ragged */
  function menuBanner(w,h,flag){return PX.canvas(w,h,g=>{const P=PX.paint(g),foot=x=>h-5-Math.round(PX.hash(x>>1,2,11)*7)-(x%7===0?4:0);
    for(let x=4;x<w-4;x++){const b=foot(x),fold=Math.sin(x/w*Math.PI*5.3);for(let y=5;y<b;y++){const n=PX.hash(x,y>>1,21);P.px(n<.06?'#0e0c10':fold<-.55?'#131116':fold>.6?'#1d1a21':'#18161c',x,y)}
      if(PX.hash(x,7,13)>.55)P.rect('#18161c',x,b,1,1+Math.round(PX.hash(x,8,13)*4))}
    if(flag){const [fx,fy,fw,fh]=flag;for(let x=fx;x<fx+fw;x++){const b=fy+fh-Math.round(PX.hash(x>>1,3,17)*5)-(x%5===2?4:0);for(let y=fy;y<b;y++){const e=x===fx||x===fx+fw-1;P.px(e?'#34303a':PX.hash(x,y>>1,23)<.05?'#1e1b22':'#252128',x,y)}}}
    for(const x of [0,w-4]){P.rect('#1c1c22',x,0,4,h);P.rect('#3e3e48',x+1,0,2,h);P.rect('#5a5a66',x+1,0,1,h);for(let y=14;y<h-6;y+=Math.max(26,Math.round(h/8))){P.rect('#2a2a32',x,y,4,6);P.rect('#4a4a56',x,y,4,1);P.px('#9a9aa8',x+1,y+2);P.px('#9a9aa8',x+2,y+3)}}
    P.rect('#1c1c22',0,0,w,5);P.rect('#4a4a56',0,1,w,1);P.rect('#2e2e38',0,2,w,2);for(const x of [2,w-3]){P.rect('#121216',x-2,0,5,6);P.rect('#6a6a78',x-1,1,2,2)}})}
  /* the emblem: a pale tree, its boughs branching to fine twigs, its roots running down the ridges of three snowy peaks (41 x 54).
     Values: 1 a shaded face's hatching, 2 a lit face, 3 bone (the tree, the snow, the outlines), 4 the cloth (a gap) */
  function menuEmblem(){const W=41,H=54,R=PX.rng(A.seed+3),M=new Uint8Array(W*H),set=(x,y,v)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<W&&y<H)M[y*W+x]=v};
    const line=(L,v,th)=>{for(let i=0;i+1<L.length;i++){const [x0,y0]=L[i],[x1,y1]=L[i+1],n=Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0)))||1;
      for(let k=0;k<=n;k++){const x=x0+(x1-x0)*k/n,y=y0+(y1-y0)*k/n;set(x,y,v);if(th>1)set(x+1,y,v);if(th>2)set(x-1,y,v)}}};
    // (the peaks: the side ones behind, the middle one before them, a gap of cloth round it; lit east faces with dark strata,
    // west faces hatched, snow on top)
    const peak=(cx,top,hw)=>{for(let y=top;y<H;y++){const w=Math.round((y-top)/(H-1-top)*hw);for(let x=cx-w-1;x<=cx+w+1;x++){const e=Math.abs(x-cx)>=w;
      set(x,y,Math.abs(x-cx)>w?4:e||y<top+3+(Math.abs(x-cx)&1)?3:x>cx?((y+((x-cx)>>1))%6===0?4:2):((x-y+99)%4===0?4:1))}}};
    peak(6,37,9);peak(34,36,9);peak(20,32,12);
    // (the roots from the trunk's foot, out and down onto the ridges)
    line([[20,30],[13,34],[8,38]],3,1);line([[20,30],[27,34],[32,37]],3,1);line([[20,29],[20,32],[20,44]],3,1);line([[19,31],[15,37],[12,45]],3,1);line([[21,31],[25,37],[28,45]],3,1);
    // (the trunk, flaring at its foot; the boughs; twigs off them, a few twigs off those)
    line([[20,30],[20,15]],3,2);set(18,30,3);set(22,30,3);set(19,29,3);set(21,29,3);
    const B=[[[20,19],[14,13],[9,9],[4,7]],[[21,19],[27,13],[32,9],[37,7]],[[20,17],[16,10],[14,3]],[[21,17],[25,10],[27,3]],[[20,16],[20,1]],[[20,22],[13,19],[7,17],[2,17]],[[21,22],[28,19],[34,17],[39,17]]];
    for(const L of B){line(L,3,1);for(let i=0;i+1<L.length;i++){const [x0,y0]=L[i],[x1,y1]=L[i+1],n=Math.hypot(x1-x0,y1-y0),a=Math.atan2(y1-y0,x1-x0);
      for(let d=2;d<n;d+=2+Math.floor(R()*2)){const x=x0+(x1-x0)*d/n,y=y0+(y1-y0)*d/n,s=R()<.5?-1:1,b=a+s*(.7+R()*.4),l=2+R()*2.5,tx=x+Math.cos(b)*l,ty=y+Math.sin(b)*l-.8;
        if(ty>y+.5)continue;line([[x,y],[tx,ty]],3,1);if(R()<.5)line([[tx,ty],[tx+Math.cos(b-s*.6)*1.6,ty+Math.sin(b-s*.6)*1.6-.5]],3,1)}}}
    return PX.canvas(W,H,g=>{for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=M[y*W+x];if(!v||v===4)continue;g.fillStyle=['','#8e8572','#cfc5ad','#ece3cd'][v];g.fillRect(x,y,1,1)}})}
  /* the title: ASHMARK in serif pixel capitals, pale bone lit from above, a dark outline and a drop below */
  const GLYPH={A:['....##.....','....###....','...####....','...#.###...','..##..###..','..#....##..','.########..','.#......##.','##......##.','#.......###','#........##','###....####'],
    S:['..####.#','.##..###','##....##','###....#','#####...','.######.','...#####','......##','#.....##','##....##','###..##.','#.####..'],
    H:['####...####','.##.....##.','.##.....##.','.##.....##.','.##.....##.','.#########.','.##.....##.','.##.....##.','.##.....##.','.##.....##.','.##.....##.','####...####'],
    M:['###.......###','.###.....###.','.###.....###.','.#.##...#.##.','.#.##...#.##.','.#..##.#..##.','.#..##.#..##.','.#...##...##.','.#...##...##.','.#....#...##.','.#........##.','###......####'],
    R:['#######...','.##...##..','.##....##.','.##....##.','.##...##..','.######...','.##..##...','.##...##..','.##...##..','.##....##.','.##....##.','####...###'],
    K:['####..####','.##....#..','.##...#...','.##..#....','.##.#.....','.####.....','.##.##....','.##..##...','.##...##..','.##....##.','.##....##.','####..####']};
  function menuTitle(word){const gl=[...(word||'ASHMARK')].map(c=>GLYPH[c]),W=gl.reduce((a,r)=>a+r[0].length+1,-1)+3,H=16;
    return PX.canvas(W,H,g=>{const M=new Uint8Array(W*H);let x0=1;for(const G of gl){G.forEach((r,y)=>[...r].forEach((c,x)=>{if(c==='#')M[(y+1)*W+x0+x]=1}));x0+=G[0].length+1}
      const at=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&M[y*W+x];
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(at(x,y)){g.fillStyle=y<=2?'#fff4dc':y>=11?'#b0a284':y>=9?'#cdc1a4':'#e8dec6';g.fillRect(x,y,1,1)}
        else if(at(x,y-1)||at(x,y-2)){g.fillStyle='#050406';g.fillRect(x,y,1,1)}else if(at(x-1,y)||at(x+1,y)||at(x,y+1)){g.fillStyle='#0c0a0e';g.fillRect(x,y,1,1)}}})}
  return {MenuScene,menuBanner,menuEmblem,menuTitle};
})();
