'use strict';
/* ---------- PX engine: the battlefield's ground (terrain phase 1: hills as three terraces, woods, marsh) ---------- */
// PX.battleGround(spec) paints a battle's terrain over its base ground, once a battle, as one canvas the size of the field. spec is
// the game's B.terrain (doc/TERRAIN_DESIGN.md §4: {C,R,cs,kind,lvl,seed}) plus climate ('grass' 'frost' 'desert' 'swamp': B.env.c)
// and base (the climate's arena canvas: copied in, never changed; without it a plain climate ground is painted, w×h or C·cs×R·cs).
// kind: 0 open, 1 wood, 2 marsh (3 ford, 4 deep, 5 bridge: phase 2, painted open, except in the desert); lvl: 0-2, the terrace.
// Only lvl and kind are read. Same spec, same picture: seeded, never Math.random.
// PX.battleGroundMini(spec,ground): the small map's picture, one pixel a cell (C×R), the painted ground averaged with its contours.
// Light from the upper left. A terrace is a raised plateau seen from the south: its top lighter and warmer, a light lip on its rim,
// a cliff of earth or rock in strata along its south edge (9 px a level of the step, inside the higher cells, so a soldier there
// is on the climb), deep at the foot and a cool shadow below; its east wall in shade, its west wall lit, its north edge outlined.
// Woods mix their climate's species with clearings and thickets, on the flat or on a plateau (its cliff still seen); a few lone
// trees and copses stand in the open; small painted details by climate (flowers, tufts, pebbles, branches, mushrooms; drifts and
// iced rocks; sparse stones and cracked earth; moss and puddles). Desert: bare, no woods (a wood cell gets dry tufts), its marsh or
// water an oasis (a pool, a sand bank, green and palms round it). Readable on a phone (a cell ~10 CSS px). Nothing here collides.
(function(PX){
  /* palettes by climate: base (the arena's 3 tones, for the plain ground), hi/lift (warm light the terraces rise toward, a share a
     level), face (a terrace's cliff, light to deep), lo (cool shade: a cliff's foot), line (a plateau's north edge); woods: under
     (undergrowth), leaf (canopy, light to deep), trunk, species (the mix: [name, share]); marsh: mud, bank, water (light to deep;
     ice in the frost), reed (tip to root), head (cattail), glint; tuft (grass tufts, tip to root); detail (per open cell and per
     wood cell: [kind, chance]); plain (desert: the ground repainted bare); oasis (desert: its marsh or water an oasis, green) */
  PX.GROUND_PAL={
    grass:{base:['#466e32','#547e3a','#689246'],hi:'#e6d88a',lift:.15,face:['#a48a62','#7c664a','#56463a','#362e32'],lo:'#1c2c4a',line:'#26402c',under:'#2a4226',leaf:['#7aa04a','#55803a','#386234','#22422c'],trunk:['#6a4a30','#44301e'],
      species:[['oak',.6],['birch',.2],['fir',.2]],mud:'#4c4a2e',bank:'#2e301e',water:['#7a9890','#56767a','#3e5a62'],reed:['#c4b878','#7e8c46','#4a5e30'],head:'#5a3a22',glint:'#d4e4dc',tuft:['#94b456','#62903c','#3e6a2e'],
      detail:[[['tuft',.3],['flower',.1],['pebbles',.05],['bush',.015],['branch',.015]],[['mushroom',.14],['branch',.12],['tuft',.08]]]},
    frost:{base:['#c0cbda','#d6dee8','#eef3f9'],hi:'#fff6e4',lift:.3,face:['#c4ccda','#8c98b0','#66728e','#4a5272'],lo:'#4a5a80',line:'#6e7e9a',under:'#a8b2c2',leaf:['#5a7a68','#3e5e4e','#2c4a3e','#1e3430'],trunk:['#5e4028','#3a2818'],snow:['#f4f8fc','#d4e0ec'],
      species:[['pine',.75],['bbirch',.25]],mud:'#aebac8',bank:'#7e8ea6',water:['#eaf2f8','#cadcea','#a8c2d8'],reed:['#d8c890','#ac9c6c','#857650'],head:'#6a4a30',glint:'#ffffff',ice:true,tuft:['#d8c890','#ac9c6c','#857650'],
      detail:[[['drift',.1],['tuft',.12],['icerock',.025]],[['branch',.1],['drift',.06]]]},
    desert:{base:['#c4a258','#d6b668','#e8cc84'],hi:'#fff2c8',lift:.2,face:['#e0b680','#c08e5c','#986a4a','#6a4842'],plain:true,oasis:true,lo:'#583a52',line:'#86603e',under:'#9a8a4c',leaf:['#a4a45c','#7c8442','#5a6430','#3e4826'],trunk:['#7a5434','#4e3420'],
      species:[],mud:'#8e7a4a',bank:'#8a6a3e',water:['#8ac0bc','#5e98a0','#467884'],reed:['#c8c870','#8a9e4a','#5e7034'],head:'#6a4428',glint:'#e6f4f0',green:['#8aa84a','#6a8c3a'],tuft:['#c8b46a','#9a9450','#72703e'],
      detail:[[['tuft',.035],['stones',.025],['crack',.006]],[['tuft',.22]]]},
    swamp:{base:['#3a482a','#485834','#5a6a3e'],hi:'#c4c07a',lift:.14,face:['#7a744e','#5c583c','#42402e','#2a2a24'],lo:'#121a2c',line:'#182214',under:'#253020',leaf:['#66703e','#4a5630','#343f26','#20291a'],trunk:['#6a5e4a','#443a2c'],
      species:[['dead',.45],['willow',.35],['oak',.2]],mud:'#353624',bank:'#202216',water:['#56705e','#3e5648','#2c4038'],reed:['#9a9656','#646e38','#3e4a26'],head:'#4a3220',glint:'#9ab8a0',tuft:['#8a8e4c','#5e6a36','#3e4a26'],
      detail:[[['reeds',.1],['moss',.16],['puddle',.04],['tuft',.08]],[['mushroom',.1],['branch',.1],['moss',.1]]]}
  };
  const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
  // a smooth value noise in [0,1) over a W×H field: lattice step px, seed s (the lattice hashed once, then read)
  const noise=(W,H,step,s)=>{const gw=Math.ceil(W/step)+2,gh=Math.ceil(H/step)+2,A=new Float32Array(gw*gh);for(let j=0;j<gh;j++)for(let i=0;i<gw;i++)A[j*gw+i]=PX.hash(i,j,s);
    return(x,y)=>{const gx=x/step,gy=y/step,ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy),o=iy*gw+ix,a=A[o],b=A[o+1],c=A[o+gw],d=A[o+gw+1];
      return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy}};

  /* trees: 16×16 sprites standing on (8,15), lit from the upper left, rimmed in the canopy's deepest tone (softer than a soldier's
     navy outline, so men among the trees still stand out); 3 variants a species. Bushes: 8×8, for gaps and the open. Species: oak
     (the climate's leaf: green, dry or mossy), birch (white bark, light leaf), fir (dark cone), pine (snowy), bbirch (bare, snowy
     boughs), dead (bare boughs, moss), willow (low and mossy), palm (oasis) */
  const SPECIES={birch:{leaf:['#b0bc5e','#8aa448','#64843a','#40602e'],trunk:['#e8e2d4','#a8a092']},fir:{leaf:['#5a8656','#3e6a44','#2c5038','#1c382a']},
    palm:{leaf:['#9ab450','#70943e','#4e7430','#30502a'],trunk:['#b08a58','#7e5e3a']}};
  const TREES={};
  function treeSprite(clim,sp,v,bush){const k=clim+sp+v+(bush?'b':'');if(TREES[k])return TREES[k];const P=PX.GROUND_PAL[clim],S=SPECIES[sp]||{},N=bush?8:16,R=PX.dice(PX.rng(v*97+sp.length*13+clim.length*7+(bush?5:0)));
    // (a variant a little darker or warmer, so a wood is not one tree copied)
    const L=(S.leaf||P.leaf).map(c=>v===1?PX.shade(c,.88):v===2?PX.mix(c,P.hi,.1):c),TR=S.trunk||P.trunk;
    return TREES[k]=PX.canvas(N,N,g=>{const Pt=PX.paint(g),M=new Uint8Array(N*N),set=(x,y,t)=>{if(x>=0&&y>=0&&x<N&&y<N)M[y*N+x]=t},at=(x,y)=>x>=0&&y>=0&&x<N&&y<N?M[y*N+x]:0;
      // (M: 0 empty, 1-4 leaf tones light to deep, 5-6 trunk light and dark, 7-8 snow light and shaded, 9 bark mark)
      const blob=(B,cx,cy,r)=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(!B.some(([bx,by,br])=>(x+.5-bx)**2+(y+.5-by)**2<=br*br))continue;
        const lit=((cx-x-.5)+(cy-y-.5))/r+(PX.hash(x,y,v+3)-.5)*.5;set(x,y,lit>.55?1:lit>-.2?2:3)}};
      const trunk=(x0,y0,y1)=>{for(let y=y0;y<=y1;y++){set(x0,y,5);set(x0+1,y,6)}};
      const line=(x0,y0,x1,y1,t)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++)set(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),typeof t==='function'?t(i,n):t)};
      const cone=(top,bot,wmax,snow)=>{const o=R.int(0,1);for(let y=top;y<=bot;y++){const w=Math.min(wmax,.6+(y-top)*.5+o*.3)-((y-top)%3===2?.8:0);
        for(let x=0;x<N;x++){const d=x+.5-8;if(Math.abs(d)>w)continue;set(x,y,d<-1?2:d<1.5?(Math.abs(d)>w-1.2?3:2):3);if(snow&&(d<-w+1.6||(y-top)%3===0&&d<0)&&PX.hash(x,y,v)>.3)set(x,y,7)}}};
      if(bush)blob([[4,4.5,3],[2.8,5,2],[5.4,5,2]],3.6,3.6,3);
      else if(sp==='oak'){trunk(7,9,15);set(6,15,6);set(9,15,6);const o=R.int(-1,1),q=R.int(0,1);blob([[8,7.5,4.8],[4.8+o*.5,8,3.2],[11.2+o*.5,7.5,3.2],[8+o,4.2,3.4+q*.4]],7,4.5,6)}
      else if(sp==='birch'){trunk(7,6,15);for(let y=7;y<15;y+=2+(y&1))set(7+(y&1),y,9);const o=R.int(-1,1);blob([[8,6,3.6],[6+o*.4,8.5,2.8],[10,8,2.8],[8,3.2,2.8]],7,3.5,4.5)}
      else if(sp==='fir'){trunk(7,12,15);cone(1,12,5.5,false)}
      else if(sp==='pine'){trunk(7,12,15);const o=R.int(0,1);for(let y=0;y<13;y++){const tier=y<4?0:y<8?1:2,top=[0,4,8][tier],w=Math.min(6,.6+(y-top)*1.15+tier*1.1+o*.3);
          for(let x=0;x<N;x++){const d=x+.5-8;if(Math.abs(d)>w)continue;const edge=Math.abs(d)>w-1.2;set(x,y,y===top||d<-w+1.6&&PX.hash(x,y,v)>.35?7:d<-1?2:d<1.5?(edge?3:2):3);if(y===top+1&&d<0&&PX.hash(x,y,v+1)>.5)set(x,y,8)}}}
      else if(sp==='bbirch'){trunk(7,3,15);for(let y=5;y<15;y+=3)set(7+(y&1),y,9);for(const [x0,y0,x1,y1] of [[7,9,3,5],[8,7,12,3],[8,11,12,8],[7,5,5,1]]){line(x0,y0,x1,y1,6);set(x1,y1-1,7);if(PX.hash(x1,y1,v)>.4)set(x1-1,y1,7)}}
      else if(sp==='palm'){for(let y=5;y<16;y++){const x=7+Math.round((15-y)*.16*(v===1?-1:1));set(x,y,y%2?5:6);set(x+1,y,6)}const cx=v===1?6:9,cy=4;
        for(const [ex,ey] of [[1,6],[3,1],[cx,0],[14,1],[15,6],[12,9],[3,9]])line(cx,cy,ex+cx-8,ey,(i,n)=>i<n*.4?2:i<n*.75?2+((i+ex)&1):3);set(cx,cy,1);set(cx-1,cy,1);set(cx,cy+1,4)}
      else{// (dead: a bare, leaning trunk and crooked boughs, mossy tufts; willow: a low mossy crown, hanging strands)
        if(sp==='willow'){trunk(7,10,15);blob([[8,8,4.6],[5,9,3],[11,9,3]],6.5,6,5);for(const x of [4,7,10,12])for(let y=10;y<13;y++)if(PX.hash(x,y,9)>.3&&at(x,y-1))set(x,y,y===12?4:3)}
        else{const lean=v===1?1:-1;for(let y=3;y<16;y++){const x=7+Math.round((15-y)*lean*.12);set(x,y,5);set(x+1,y,6)}
          for(const [x0,y0,x1,y1] of [[7,8,3,4],[8,6,12,2],[8,10,12,7],[7,5,5,1]])line(x0,y0,x1,y1,(i,n)=>i>n*.6?6:5);
          for(const [x,y] of [[3,4],[12,2],[12,7]]){set(x,y,2);set(x+1,y,3);set(x,y+1,3);if(PX.hash(x,y,v)>.4)set(x,y+2,4)}}}
      // the rim: every empty pixel beside leaf or snow, in the deepest leaf tone; the trunk keeps its own colour
      const rim=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!at(x,y)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const t=at(x+a,y+b);return t&&t!==5&&t!==6&&t!==9}))rim.push([x,y]);
      for(const [x,y] of rim)set(x,y,4);
      const col=[null,L[0],L[1],L[2],L[3],TR[0],TR[1],P.snow?P.snow[0]:'#f4f8fc',P.snow?P.snow[1]:'#d4e0ec','#3a3430'];
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){const t=M[y*N+x];if(t)Pt.px(col[t],x,y)}})}
  // a soft ground shadow (to the lower right: the light is upper left), half-transparent pixels on whole positions
  const SHADOW={};
  const shadowSprite=w=>SHADOW[w]||(SHADOW[w]=PX.canvas(w,Math.max(3,w>>1),g=>{const h=Math.max(3,w>>1);g.fillStyle='rgba(8,14,24,.3)';for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(((x+.5-w/2)/(w/2))**2+((y+.5-h/2)/(h/2))**2<=1)g.fillRect(x,y,1,1)}));

  // the plain climate ground (when the game gives no base: the gallery), and the desert's own bare ground under a base (from row
  // y0: the arena's top band kept)
  function plainGround(D,W,H,P,seed,y0){const B=P.base.map(hx),N=noise(W,H,64,seed+40),N2=noise(W,H,24,seed+42);
    const RV=new Float32Array(W);let nv=0,bh=0;for(let y=y0||0;y<H;y++)for(let x=0;x<W;x++){if(!(x&1)){if(!(y&1)||y===y0)RV[x]=.6*(N(x,y)-.5)+.25*(N2(x,y)-.5);nv=RV[x]}if(!(x&3))bh=.2*(PX.hash(x>>2,y>>2,seed+41)-.5);
      let v=.5+nv+bh;v=v<0?0:v>1?1:v;const lo=v<.5,a=lo?B[0]:B[1],b=lo?B[1]:B[2],t=lo?v*2:(v-.5)*2,o=(y*W+x)*4;
      D[o]=a[0]+(b[0]-a[0])*t;D[o+1]=a[1]+(b[1]-a[1])*t;D[o+2]=a[2]+(b[2]-a[2])*t;D[o+3]=255;
      const ph=PX.hash(x,y,seed+43);if(ph<.03){const c=B[2];D[o]+=(c[0]-D[o])*.6;D[o+1]+=(c[1]-D[o+1])*.6;D[o+2]+=(c[2]-D[o+2])*.6}else if(ph>.97){const c=B[0];D[o]+=(c[0]-D[o])*.7;D[o+1]+=(c[1]-D[o+1])*.7;D[o+2]+=(c[2]-D[o+2])*.7}}}

  /* small painted details (Pg: a painter; x, y: the foot; v: a seeded number; P: the palette) */
  const DETAIL={
    tuft(Pg,x,y,v,P){const n=3+v%2;for(let s=0;s<n;s++){const h=2+((v+s*3)%3),dx=s-(n>>1);for(let k=0;k<h;k++)Pg.px(k===h-1?P.tuft[0]:k?P.tuft[1]:P.tuft[2],x+dx+(k===h-1&&dx?Math.sign(dx):0),y-k)}},
    flower(Pg,x,y,v){const c=['#e8d04a','#e86a5a','#f0ece0','#b88ae8','#f0a040'][v%5];for(let s=0;s<3+v%2;s++){const fx=x+((v>>s)&3)-1+s,fy=y-((v>>(s+2))&1);Pg.px('#3e6a2e',fx,fy+1);Pg.px(c,fx,fy)}},
    pebbles(Pg,x,y,v){for(let s=0;s<2+v%2;s++){const px=x+s*3-2+((v>>s)&1),py=y-((v>>(s+1))&1);Pg.rect('#868880',px,py,2,1);Pg.px('#b4b6ac',px,py);Pg.px('#56584e',px+1,py+1)}},
    stones(Pg,x,y,v){for(let s=0;s<1+v%2;s++){const px=x+s*4-2,py=y-((v>>s)&1);Pg.rect('#a8845a',px,py,2,1);Pg.px('#d0b07c',px,py);Pg.px('#6e5238',px+1,py+1)}},
    bush(Pg,x,y,v,P,g,clim){g.drawImage(shadowSprite(8),x-2,y-2);g.drawImage(treeSprite(clim,'oak',v%3,true),x-4,y-7)},
    branch(Pg,x,y,v,P){const L=4+v%3,d=v&1?1:-1;for(let i=0;i<L;i++){const yy=y-Math.floor(i/3)*(d>0?1:0);Pg.px(P.trunk[1],x+i,yy);Pg.px(P.trunk[0],x+i,yy-1)}Pg.px(P.trunk[0],x+2,y-2);Pg.px(P.trunk[1],x+3,y-3)},
    mushroom(Pg,x,y,v){const cap=v%3===0?'#c84a3a':v%3===1?'#c8a060':'#e0d8c0';for(let s=0;s<1+v%3;s++){const mx=x+s*3,my=y-(s&1);Pg.px('#e8e0c8',mx,my);Pg.rect(cap,mx-1,my-1,3,1);if(cap==='#c84a3a')Pg.px('#f0ece0',mx,my-1)}},
    drift(Pg,x,y,v){const w=7+v%5;Pg.rect('#b8c6d8',x-(w>>1),y,w,1);Pg.rect('#f6f9fc',x-(w>>1)+1,y-1,w-2,1);Pg.rect('#ffffff',x-(w>>1)+2,y-2,w-5,1)},
    icerock(Pg,x,y,v){Pg.rect('#5e6676',x-2,y-2,5,3);Pg.rect('#7e8696',x-2,y-2,3,1);Pg.rect('#f4f8fc',x-1,y-3,3,1);Pg.px('#c8dcea',x+2,y-2);Pg.rect('#404858',x-1,y+1,4,1)},
    crack(Pg,x,y,v){const w=10+v%6,h=5+v%3;for(let j=-h;j<=h;j++)for(let i=-w;i<=w;i++){if((i/w)**2+(j/h)**2>1-PX.hash(x+i,y+j,v)*.25)continue;Pg.px('#e2c890',x+i,y+j)}
      for(let s=0;s<4;s++){let cx=x-w+2+((v*7+s*11)%(2*w-4)),cy=y-h+1+((v+s*5)%(2*h-2));for(let k=0;k<4;k++){Pg.px('#a8844e',cx,cy);cx+=((v>>k)&1)?1:0;cy+=((v>>(k+s))&1)?1:-1}}},
    reeds(Pg,x,y,v,P){reeds(Pg,x,y,v,P)},
    moss(Pg,x,y,v){const w=4+v%3;Pg.rect('#34431f',x-(w>>1),y-1,w,2);Pg.rect('#4e5e30',x-(w>>1)+1,y-2,w-2,1);Pg.px('#6a7a3c',x-1,y-2)},
    puddle(Pg,x,y,v,P){const w=5+v%3;Pg.rect(P.bank,x-(w>>1),y-1,w,1);Pg.rect(P.water[2],x-(w>>1),y,w,2);Pg.rect(P.water[1],x-(w>>1)+1,y+1,w-2,1);Pg.px(P.glint,x,y+1)}
  };
  // a tuft of reeds: 3-5 stalks, dark at the root, light at the tip, now and then a cattail (dry and snow-tipped in the frost)
  function reeds(Pg,x,y,v,P){const n=3+v%3;for(let s=0;s<n;s++){const sx=x+s*2-n+(v>>s&1),hgt=3+((v*7+s*5)%4),lean=((v+s)%3)-1;
    for(let k=0;k<hgt;k++){const c=k===hgt-1?P.reed[0]:k<2?P.reed[2]:P.reed[1];Pg.px(c,sx+(k>hgt-3?lean:0),y-k)}
    if(s===1&&v%3===0){Pg.rect(P.head,sx,y-hgt-1,1,2);Pg.px(P.reed[1],sx,y-hgt-2)}
    if(P.ice&&s===0)Pg.px(P.snow?P.snow[0]:'#fff',sx+lean,y-hgt+1)}}

  PX.battleGround=spec=>{
    const C=spec.C,R=spec.R,cs=spec.cs||16,clim=PX.GROUND_PAL[spec.climate]?spec.climate:'grass',P=PX.GROUND_PAL[clim],seed=(spec.seed|0)||1,base=spec.base,
      W=base?base.width:spec.w||C*cs,H=base?base.height:spec.h||R*cs,kind0=spec.kind||new Uint8Array(C*R),lvl=spec.lvl||new Uint8Array(C*R);
    // (the desert: its marsh and water are an oasis, kind 2 here; woods none; elsewhere the phase-2 water is left open)
    const kind=kind0.map(k=>P.oasis?(k>=2&&k<=4?2:k):k>2?0:k),oasis=!!P.oasis,bare=!P.species.length;
    const cv=PX.canvas(W,H),g=cv.getContext('2d');if(base)g.drawImage(base,0,0);
    const own=!base||P.plain,img=own?g.createImageData(W,H):g.getImageData(0,0,W,H),D=img.data;if(own){plainGround(D,W,H,P,seed,base?15:0);if(base)D.set(g.getImageData(0,0,W,15).data)}
    const cell=(a,i,j)=>a[(j<0?0:j>=R?R-1:j)*C+(i<0?0:i>=C?C-1:i)];
    // the cells worth painting: any with a level or a kind, and their neighbours (the slope and the ragged edge reach into them)
    const act=new Uint8Array(C*R);for(let j=0;j<R;j++)for(let i=0;i<C;i++)if(lvl[j*C+i]||kind[j*C+i])for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const x=i+a,y=j+b;if(x>=0&&y>=0&&x<C&&y<R)act[y*C+x]=1};
    const T=new Uint8Array(W*H),K=new Uint8Array(W*H),WT=new Uint8Array(W*H),F=new Uint8Array(W*H),Q=oasis?new Float32Array(W*H):null;
    const each=f=>{for(let j=0;j<R;j++)for(let i=0;i<C;i++){if(!act[j*C+i])continue;const y1=Math.min(H,(j+1)*cs),x1=Math.min(W,(i+1)*cs);for(let y=j*cs;y<y1;y++)for(let x=i*cs;x<x1;x++)f(x,y,y*W+x)}};
    // (1) height: the cells' levels, bilinear between cell centres, sampled through a gentle wobble (±3.5 px), so a terrace edge
    //     sits on its cells' edge but runs as a natural line; the terrace is the height rounded. Woods and marsh: the same, through
    //     a pixel-fine wobble too (their ragged edge); an oasis keeps its share (Q: pool, bank and green by how far in)
    const NX=noise(W,H,8,seed),NY=noise(W,H,8,seed+1),NP=noise(W,H,10,seed+5),NQ=noise(W,H,5,seed+6);
    each((x,y,o)=>{const jx=(NX(x,y)-.5)*7,jy=(NY(x,y)-.5)*7,sx=x+.5+jx,sy=y+.5+jy,u=sx/cs-.5,v=sy/cs-.5,iu=Math.floor(u),iv=Math.floor(v),fu=u-iu,fv=v-iv;
      const a=cell(lvl,iu,iv),b=cell(lvl,iu+1,iv),c=cell(lvl,iu,iv+1),d=cell(lvl,iu+1,iv+1),h=a+(b-a)*fu+(c-a)*fv+(a-b-c+d)*fu*fv;T[o]=h>=1.5?2:h>=.5?1:0;
      const qu=(sx+(PX.hash(x,y,seed+2)-.5)*3)/cs-.5,qv=(sy+(PX.hash(x,y,seed+3)-.5)*3)/cs-.5,ku=Math.floor(qu),kv=Math.floor(qv),wu=qu-ku,wv=qv-kv;
      const k0=cell(kind,ku,kv),k1=cell(kind,ku+1,kv),k2=cell(kind,ku,kv+1),k3=cell(kind,ku+1,kv+1),w0=(1-wu)*(1-wv),w1=wu*(1-wv),w2=(1-wu)*wv,w3=wu*wv;
      const s1=(k0===1?w0:0)+(k1===1?w1:0)+(k2===1?w2:0)+(k3===1?w3:0);if(s1>.5){K[o]=1;return}const s2=(k0===2?w0:0)+(k1===2?w1:0)+(k2===2?w2:0)+(k3===2?w3:0);if(Q)Q[o]=s2+(NP(x,y)-.5)*.14;if(s2>.5)K[o]=2});
    // (2) marsh pools: a blotchy noise over the marsh, kept a few pixels inside it; an oasis: one pool in its heart
    const Kat=(x,y)=>x<0||y<0||x>=W||y>=H?0:K[y*W+x];
    each((x,y,o)=>{if(oasis){const q=Q[o];if(q>.88)WT[o]=q>.95?2:1;return}if(K[o]!==2)return;const n=NP(x,y)*.8+NQ(x,y)*.2;if(n>.6&&Kat(x,y-4)===2&&Kat(x,y+4)===2&&Kat(x-5,y)===2&&Kat(x+5,y)===2)WT[o]=n>.68?2:1});
    const Wat=(x,y)=>x<0||y<0||x>=W||y>=H?0:WT[y*W+x],Tat=(x,y)=>x<0||y<0||x>=W||y>=H?0:T[y*W+x],Fat=(x,y)=>x<0||y<0||x>=W||y>=H?1:F[y*W+x];
    const FH=9,FC=P.face.map(hx),HI=hx(P.hi),LO=hx(P.lo),LN=hx(P.line),UN=hx(P.under),LF=hx(P.leaf[2]),MU=hx(P.mud),BK=hx(P.bank),WA=P.water.map(hx),GR=(P.green||P.leaf).map(hx);
    const FOOT=[.62,.5,.4,.3,.2,.1],mix=(o,c,t)=>{D[o]+=(c[0]-D[o])*t;D[o+1]+=(c[1]-D[o+1])*t;D[o+2]+=(c[2]-D[o+2])*t},put=(o,c)=>{D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2]};
    // (3) colour, pixel by pixel
    each((x,y,i)=>{const o=i*4,t=T[i];
      if(t)mix(o,HI,P.lift*t);// (a terrace: lighter and warmer a level)
      if(K[i]===1){if(!bare){mix(o,UN,.55);const p=PX.hash(x,y,seed+8);if(p<.05)mix(o,LF,.5);else if(p>.97)mix(o,HI,.12)}}// (undergrowth, dappled; none in the desert)
      if(oasis){const q=Q[i],w=WT[i];// (an oasis: the pool, its wet sand bank, the green round it fading into the sand)
        if(w){put(o,WA[w]);if(!Wat(x,y-1))mix(o,BK,.5);else if(w===1&&PX.hash(x,y,seed+9)>.9)put(o,WA[0])}
        else if(Wat(x,y+1)||Wat(x,y+2))put(o,BK);
        else if(q>.83){mix(o,BK,.45)}
        else if(q>.42){mix(o,GR[q>.6?1:0],.78);const p=PX.hash(x,y,seed+10);if(p>.9)mix(o,HI,.2);else if(p<.06)mix(o,GR[1],.6)}
        else if(q>.25&&PX.hash(x,y,seed+10)<(q-.25)*5)mix(o,GR[0],.55)}
      else if(K[i]===2){const w=WT[i];
        if(w){put(o,WA[w]);if(!Wat(x,y-1))mix(o,BK,.45);else if(w===1&&PX.hash(x,y,seed+9)>.93)put(o,WA[0])}// (the water; the bank's shadow on it)
        else if(Wat(x,y+1))put(o,BK);// (the far bank, its face toward us)
        else{mix(o,MU,.42);if(PX.hash(x,y,seed+10)>.94)mix(o,BK,.5)}}
      // a raised plateau seen from the south: along its south edge, inside it, the cliff, FH px a level of the step (2 over 0: twice
      // as tall), earth or rock in strata, a light lip at the top and deep at the foot; on the lower ground a cool shadow at its foot
      if(t){let d1=0,st=0;for(let d=1;d<=2*FH+2;d++){const u=Tat(x,y+d);if(u<t){d1=d;st=t-u;break}}
        const fh=FH*st;
        if(d1&&d1<=fh){F[i]=1;const f=(fh-d1)/(fh-1),band=(d1+((x>>3)&1)+(PX.hash(x>>2,y+d1,seed+11)>.8?1:0))%3===0;let k=f<.22?0:f<.5?1:f<.8?2:3;if(band&&k<3)k++;
          put(o,FC[k]);const p=PX.hash(x,y,seed+12);if(p>.95)put(o,FC[Math.max(0,k-1)]);else if(p<.03)put(o,FC[3]);
          if(d1===fh){put(o,FC[0]);mix(o,HI,.3)}else if(d1===fh-1&&p>.5)put(o,FC[0]);return}
        if(d1&&d1<=fh+2){mix(o,HI,d1===fh+1?.55:.25);return}// (the rim catches the light)
        // the side walls: the east one in shade (3 px a level), the west one lit (1 px a level)
        for(let d=1;d<=6;d++){const u=Tat(x+d,y);if(u<t){if(d<=3*(t-u)){F[i]=1;put(o,FC[d===1?3:2]);if(PX.hash(x,y,seed+13)>.9)put(o,FC[1]);return}break}}
        for(let d=1;d<=2;d++){const u=Tat(x-d,y);if(u<t){if(d<=t-u){F[i]=1;put(o,FC[1]);return}break}}
        if(Tat(x,y-1)<t){mix(o,HI,.45);return}if(Tat(x-1,y)<t){mix(o,HI,.25);return}}
      for(let d=1;d<=6;d++)if(Tat(x,y-d)>t){mix(o,LO,FOOT[d-1]);return}// (the shadow at the cliff's foot)
      for(let d=1;d<=2;d++)if(Tat(x-d,y)>t){mix(o,LO,.35);return}// (and east of its shaded wall)
      if(Tat(x,y+1)>t){put(o,LN);return}if(Tat(x,y+2)>t)mix(o,LN,.55)});// (the north edge, outlined)
    g.putImageData(img,0,0);
    // (4) what stands on the ground. A tree's crown never hides a cliff (its foot, middle and crown kept off the faces)
    const R2=PX.dice(PX.rng(seed*31+7)),Pg=PX.paint(g),things=[],edgeCell=(i,j)=>{for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if(cell(kind,i+a,j+b)!==1)return true;return false};
    const clear=(x,y)=>!Fat(x,y)&&!Fat(x,y-6)&&!Fat(x,y-12)&&!Fat(x-5,y-7)&&!Fat(x+5,y-7)&&!Wat(x,y),SPN=noise(W,H,56,seed+20),DN=noise(W,H,40,seed+21);
    const species=(x,y)=>{let r=SPN(x,y)*.7+PX.hash(x,y,seed+22)*.3,a=0;for(const [n,s] of P.species){a+=s;if(r<a)return n}return P.species[P.species.length-1][0]};
    // woods: thick on their edges (the patch reads), clearings and thickets inside, bushes in the gaps
    if(!bare)for(let y=6,row=0;y<H;y+=8,row++)for(let x=(row&1)*5;x<W;x+=10){const tx=x+R2.int(-2,2),ty=y+R2.int(-2,2);
      if(Kat(tx,ty)!==1||Kat(tx-5,ty)!==1||Kat(tx+5,ty)!==1||Kat(tx,ty-9)!==1||!clear(tx,ty))continue;const e=edgeCell(Math.floor(tx/cs),Math.floor(ty/cs));
      if(R2.chance(e?.9:.1+.5*DN(tx,ty)))things.push({y:ty,k:'tree',x:tx,sp:species(tx,ty),v:R2.int(0,2)});else if(R2.chance(.4))things.push({y:ty,k:'bush',x:tx,v:R2.int(0,2)})}
    // lone trees and copses in the open (painted: nothing collides)
    if(!bare){const spot=()=>{for(let k=0;k<30;k++){const x=R2.int(40,W-40),y=R2.int(48,H-30);if(!Kat(x,y)&&!Kat(x,y-10)&&clear(x,y))return[x,y]}return null};
      for(let n=R2.int(3,6);n>0;n--){const s=spot();if(s)things.push({y:s[1],k:'tree',x:s[0],sp:species(s[0],s[1]),v:R2.int(0,2)})}
      for(let n=R2.int(1,2);n>0;n--){const s=spot();if(!s)continue;const sp=species(s[0],s[1]);for(let m=R2.int(3,5);m>0;m--){const x=s[0]+R2.int(-14,14),y=s[1]+R2.int(-8,8);if(!Kat(x,y)&&clear(x,y))things.push({y,k:'tree',x,sp,v:R2.int(0,2)})}}}
    // an oasis: palms round the pool, reeds at its edge
    if(oasis)for(let y=8,row=0;y<H;y+=9,row++)for(let x=(row&1)*6;x<W;x+=12){const tx=x+R2.int(-2,2),ty=y+R2.int(-2,2);if(tx<0||ty<0||tx>=W||ty>=H)continue;const q=Q[ty*W+tx];
      if(q>.4&&q<.8&&!Wat(tx,ty)&&clear(tx,ty)&&R2.chance(.7))things.push({y:ty,k:'tree',x:tx,sp:'palm',v:R2.int(0,2)});else if(q>.8&&q<.88&&R2.chance(.5))things.push({y:ty,k:'reed',x:tx,v:R2.int(0,99)})}
    if(!oasis)for(let j=0;j<R;j++)for(let i=0;i<C;i++){if(kind[j*C+i]!==2)continue;for(let n=0;n<3;n++){const tx=i*cs+R2.int(1,14),ty=j*cs+R2.int(2,15);
      if(Kat(tx,ty)!==2||Wat(tx,ty)||Wat(tx,ty+1)||Fat(tx,ty))continue;const shore=Wat(tx,ty+2)||Wat(tx+3,ty)||Wat(tx-3,ty)||Wat(tx,ty-3);if(shore||R2.chance(.5))things.push({y:ty,k:'reed',x:tx,v:R2.int(0,99)})}}
    // the small details, first (flat on the ground): by climate, in the open and in woods; never on a cliff, a pool or an oasis
    for(let j=1;j<R;j++)for(let i=0;i<C;i++){const k=kind[j*C+i];if(k===2)continue;for(const [d,ch] of P.detail[k===1?1:0]){if(!R2.chance(ch))continue;const x=i*cs+R2.int(2,13),y=j*cs+R2.int(3,15);
      if(y<16||Fat(x,y)||Fat(x+3,y)||Fat(x-3,y)||Kat(x,y)!==k||oasis&&Q[y*W+x]>.25)continue;DETAIL[d](Pg,x,y,R2.int(0,999),P,g,clim)}}
    for(const t of things)if(t.k==='tree'){const s=shadowSprite(12);g.drawImage(s,t.x-3,t.y-3)}
    things.sort((a,b)=>a.y-b.y||a.x-b.x);
    for(const t of things){
      if(t.k==='tree')g.drawImage(treeSprite(clim,t.sp,t.v),t.x-8,t.y-15);
      else if(t.k==='bush'){g.drawImage(shadowSprite(8),t.x-2,t.y-2);g.drawImage(treeSprite(clim,'oak',t.v,true),t.x-4,t.y-7)}
      else reeds(Pg,t.x,t.y,t.v,P)}
    // glints on the open pools (still: the ground is painted once); lily pads on warm water
    for(let j=0;j<R;j++)for(let i=0;i<C;i++){if(kind[j*C+i]!==2)continue;for(let n=0;n<2;n++){const tx=i*cs+R2.int(0,13),ty=j*cs+R2.int(0,15);
      if(Wat(tx,ty)!==2||Wat(tx+2,ty)!==2||Wat(tx,ty-1)!==2)continue;if(!P.ice&&R2.chance(.35)){Pg.rect('#5e7a3e',tx,ty,2,1);Pg.px('#7a9650',tx,ty)}else Pg.rect(P.glint,tx,ty,P.ice?3:2,1)}}
    return cv};

  // the small map: a pixel a cell, the painted ground's average there, its terrace edges dark (a contour a cell wide)
  PX.battleGroundMini=(spec,ground)=>{const C=spec.C,R=spec.R,cs=spec.cs||16,P=PX.GROUND_PAL[spec.climate]||PX.GROUND_PAL.grass,lvl=spec.lvl||new Uint8Array(C*R),kind=spec.kind||new Uint8Array(C*R);
    return PX.canvas(C,R,g=>{const img=g.createImageData(C,R),M=img.data,G=ground?ground.getContext('2d').getImageData(0,0,ground.width,ground.height):null,B1=hx(P.base[1]),HI=hx(P.hi),LN=hx(P.line),LF=hx(P.leaf[3]),WA=hx(P.water[1]);
      for(let j=0;j<R;j++)for(let i=0;i<C;i++){const o=(j*C+i)*4,k=kind[j*C+i],l=lvl[j*C+i];let c=[0,0,0],n=0;
        if(G){for(let y=j*cs+1;y<Math.min(G.height,(j+1)*cs);y+=2)for(let x=i*cs+1;x<Math.min(G.width,(i+1)*cs);x+=2){const q=(y*G.width+x)*4;c[0]+=G.data[q];c[1]+=G.data[q+1];c[2]+=G.data[q+2];n++}}
        c=n?c.map(v=>v/n):B1.slice();const m=(d,t)=>{c=c.map((v,z)=>v+(d[z]-v)*t)};
        if(l)m(HI,.12*l);if(k===1&&P.species.length)m(LF,.4);else if(k>=2&&k<=4&&(k===2||P.oasis))m(WA,.45);
        if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const x=i+a,y=j+b;return x>=0&&y>=0&&x<C&&y<R&&lvl[y*C+x]>l}))m(LN,.7);
        M[o]=c[0];M[o+1]=c[1];M[o+2]=c[2];M[o+3]=255}
      g.putImageData(img,0,0)})};
})(window.PX=window.PX||{});
