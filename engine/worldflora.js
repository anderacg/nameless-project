'use strict';
/* ---------- the land's own small things and trees, drawn px by px and cached (doc/OPEN_WORLD_DESIGN.md: made in the world lab,
   engine/worldlab.js, and shared with the game's world map, gfx/worldterrain.js): boulders, stones, logs, stumps, bushes, 13 kinds of
   tree in three sizes, ferns, mushrooms, flowers, cattails, agaves, bones, lily pads, a bank of mist, and the grass's clumps (an atlas
   of every kind, variant and lean). All lit from the upper left, shaded rims, a soft shadow under each; 1 px a figure px.
   PX.flora: the pictures (each {img, ax, ay}: its foot at (ax, ay); grassAtlas a sheet with each clump's px list, sheet.px) and
     look: {rock ('grey' | 'sand' | 'cold'), bush ('oak' for the temperate mix, else one palette), snow, moss}: how the things look in
       the climate (its caller sets it, then clear() when it changes); lean: a clump's most lean (px); cap: snow lying on what is drawn
       while it is set; clear(): forget the cached pictures. ---------- */
(function(PX){
  const hsh=(x,y,s)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1274126177);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};
  const vn=(x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),a=hsh(xi,yi,s),b=hsh(xi+1,yi,s),c=hsh(xi,yi+1,s),d=hsh(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
  const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
  const mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
  const F={look:{rock:'grey',bush:'oak',snow:false,moss:1},lean:3,cap:false};
  // small things of the land's own, drawn px by px and cached (the owner, 2026-11-15: "improve boulders, tree stumps, logs and other
  // map details"): all lit from the upper left, with shaded rims (no black outline, as on the world map), a soft shadow under each
  // (keyed by the look and the snow too, so every climate's pictures are kept side by side)
  const NAT={},nat=(k,f)=>{k=F.look.rock+F.look.bush+F.look.moss+(F.cap?'c':'')+k;return NAT[k]||(NAT[k]=f())};
  // (a picture made px by px: set(x, y, colour, alpha) lays a colour over what is there; has(x, y): whether a px is painted solid)
  function pixPic(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),im=g.createImageData(w,h),D=im.data;
    const set=(x,y,col,a)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=w||y>=h)return;const o=(y*w+x)*4;if(a===undefined||a>=1){D[o]=col[0];D[o+1]=col[1];D[o+2]=col[2];D[o+3]=255;return}
        const b=D[o+3]/255,na=a+b*(1-a);for(let k=0;k<3;k++)D[o+k]=(col[k]*a+D[o+k]*b*(1-a))/na;D[o+3]=na*255},
      has=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&D[(y*w+x)*4+3]===255;
    draw(set,has);
    // (snow lying on it: the top px or two of each column white, its shade blue-grey)
    if(F.cap)for(let x=0;x<w;x++)for(let y=0;y<h;y++){if(D[(y*w+x)*4+3]!==255)continue;const n=1+(hsh(x,y,w*7+h)<.5?1:0);
      for(let k=0;k<n&&y+k<h;k++){const q=((y+k)*w+x)*4;if(D[q+3]!==255)break;const cc=k?[204,214,228]:[242,246,252];D[q]=cc[0];D[q+1]=cc[1];D[q+2]=cc[2]}break}
    g.putImageData(im,0,0);return c}

  // (a tone of a ramp (darkest first) by light l, -1 to 1; a soft shadow, an ellipse)
  const ramp=(R,l)=>R[Math.max(0,Math.min(R.length-1,Math.floor((l+1)*.5*R.length)))];
  const shade=(set,cx,cy,rx,ry,a)=>{for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++){const d=((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2;if(d<=1)set(x,y,[18,24,14],a*(1-d*.6))}};
  const ROCK=[[56,58,60],[80,82,82],[106,106,102],[132,130,122],[158,154,142],[186,182,166]],MOSS=[[54,80,36],[74,104,44],[98,128,56],[124,150,70]],
    BARK=[[48,34,24],[68,48,32],[90,64,42],[114,84,56],[140,106,72]],WOOD=[[146,108,66],[180,144,96],[212,182,130]],
    LEAF={dry:[[78,72,40],[104,96,52],[132,120,66],[160,146,84],[188,172,108]],oak:[[30,54,26],[44,76,34],[62,100,42],[86,126,54],[118,154,72]],birch:[[48,70,28],[70,96,38],[96,124,50],[126,152,66],[164,184,90]],dark:[[20,42,26],[30,58,34],[42,76,42],[58,96,52],[84,122,66]]},
    FERN=[[36,66,30],[54,94,38],[80,124,50],[112,156,68]];
  // a rock: lumps ([x, y, rx, ry], y its middle) of one height field, sunk in the ground at row base; dark seams where two lumps meet,
  // a lit rim up and left and a shaded one down and right, moss on the tops (moss: how much), lichen, a tuft at its foot now and then
  const ROCKS={grey:ROCK,sand:[[110,62,40],[140,84,54],[170,110,72],[196,138,94],[218,166,118],[236,196,150]],cold:[[60,64,72],[84,90,98],[110,116,124],[138,144,150],[166,172,178],[196,200,206]]};
  function rockPic(w,h,base,lumps,v,moss){const ROCK=ROCKS[F.look.rock]||ROCKS.grey;return pixPic(w,h,(set,has)=>{
    let x0=w,x1=0;for(const [cx,,rx] of lumps){x0=Math.min(x0,cx-rx);x1=Math.max(x1,cx+rx)}shade(set,(x0+x1)/2+1,base+.6,(x1-x0)/2+1,1.8,.4);
    const Z=new Float32Array(w*h),S=new Uint8Array(w*h);
    for(let y=0;y<=base;y++)for(let x=0;x<w;x++){let a=0,b=0;for(const [cx,cy,rx,ry] of lumps){const d=1-((x+.5-cx)/rx)**2-((y+.5-cy)/ry)**2;if(d>0){const z=Math.sqrt(d)*Math.min(rx,ry);if(z>a){b=a;a=z}else if(z>b)b=z}}
      Z[y*w+x]=a;S[y*w+x]=b>.3&&a-b<.5?1:0}
    const z=(x,y)=>x<0||y<0||x>=w||y>base?0:Z[y*w+x],in_=(x,y)=>z(x,y)>0;
    // (moss and the top's light keep to the top of each column: within top px of its first)
    const top=new Int16Array(w).fill(99);for(let x=0;x<w;x++)for(let y=0;y<=base;y++)if(in_(x,y)){top[x]=y;break}
    for(let y=0;y<=base;y++)for(let x=0;x<w;x++){if(!in_(x,y))continue;const gx=z(x+1,y)-z(x-1,y),gy=z(x,y+1)-z(x,y-1),up=y-top[x];
      let l=(gx*.6+gy*.75)*.55+(up<2?.4:0)-(up/(base-top[x]+1))*.85+.3+(hsh(x>>1,y>>1,v+5)-.5)*.35+(hsh(x,y,v+6)-.5)*.15;
      if(y>=base-1)l-=.35;if(S[y*w+x])l-=.7;if(!in_(x+1,y)||!in_(x,y+1))l-=.45;else if(!in_(x-1,y)||!in_(x,y-1))l+=.3;
      let col=ramp(ROCK,Math.max(-1,Math.min(.99,l)));
      if(moss&&up<2+moss*2&&vn(x/3.5,y/3.5,v+7)>.6-moss*.2)col=ramp(MOSS,l*.8);else if(hsh(x,y,v+8)<.025&&l>-.2)col=[178,172,120];
      set(x,y,col)}
    if(v&1)for(let k=0;k<2;k++){const tx=Math.round(x0+1+hsh(v,k,9)*(x1-x0-2));for(let j=0;j<2+(k^v&1);j++)set(tx+(j>1?k*2-1:0),base-j,FERN[j?2:1])}})}
  // a boulder (s px across, by v: round, heaped, tall or a flat slab)
  function boulderPic(v,s,moss){return nat('b'+v+'_'+s+'_'+moss,()=>{const w=s+4,hb=Math.round(s*.78),h=hb+4,base=h-3,L=[],f=v%5;
    const mx=f===3?s*.34:f===4?s*.48:s*.42,my=f===3?hb*.56:f===4?hb*.32:hb*.5;L.push([w/2,base-my*.82,mx,my]);
    const n=f===4?1:1+v%3;for(let j=1;j<=n;j++){const rx=s*(.17+hsh(v,j,91)*.13),ry=rx*(.7+hsh(v,j,92)*.45),side=(j+v)%2?-1:1;
      const cx=w/2+side*Math.max(0,Math.min(s*.32,s/2-rx)*(.5+hsh(v,j,93)*.5)),cy=Math.max(ry+1,base-ry*.75-hsh(v,j,94)*Math.max(0,hb-ry*1.9));L.push([cx,cy,rx,ry])}
    return {img:rockPic(w,h,base,L,v,moss),ax:w>>1,ay:base}})}
  // a stone (n px across): one, or (now and then) two or three together
  function stonePic(n,v){return nat('s'+n+'_'+v,()=>{const mo=F.look.moss;const w=n+5,hb=Math.max(2,Math.ceil(n*.7)),h=hb+3,base=h-2,L=[];
    if(v%4===0&&n>3){const r=n*.3;L.push([2+r,base-r*.5,r,r*.75],[w-2-r*.8,base-r*.4,r*.8,r*.6]);if(v&4)L.push([w/2,base-r*.3,r*.55,r*.45])}
    else{L.push([w/2,base-hb*.42,n/2,hb*.5]);if(v&2)L.push([w/2+n*.35,base-hb*.2,n*.25,hb*.25])}
    return {img:rockPic(w,h,base,L,v,v%3===0?.5*mo:0),ax:w>>1,ay:base}})}
  // a fallen log (n px long; by v: lying straight or aslant, 4 or 5 px thick): bark round its length (lit on top, dark under, streaks
  // along it, cracks across), its east end a sawn face with rings; its west end sawn, broken or a plate of roots; a branch stub, moss
  // on its top, fungi on its side now and then
  function logPic(n,v){return nat('l'+n+'_'+v,()=>{const d=4+(v&1),sl=[0,.2,-.2,.36,-.36,0,.1,-.1][v%8],rise=Math.ceil(Math.abs(sl)*n),w=n+7,h=d+rise+6,y0=3+(sl<0?rise:0),ox=3,end=(v>>1)%4;
    let ay=0;const img=pixPic(w,h,(set,has)=>{
      for(let t=-1;t<=n;t++){const yc=Math.round(y0+t*sl);set(ox+t+1,yc+d,[18,24,14],.38);set(ox+t+1,yc+d+1,[18,24,14],.16)}
      // (the root plate, behind its west end)
      if(end===1){const yc=Math.round(y0);for(let y=yc-3;y<=yc+d+1;y++)for(let x=ox-3;x<=ox;x++){const e=((x-ox+1.2)/2.4)**2+((y-yc-d/2+.5)/(d/2+2.2))**2;if(e>1)continue;
        set(x,y,hsh(x,y,v+11)<.3?[96,72,48]:ramp(BARK,(x-ox)*.25-(y-yc)*.08+(hsh(x,y,v+12)-.5)*.5))}}
      for(let t=0;t<n;t++){const x=ox+t,yc=Math.round(y0+t*sl);let lo=0,hi=d-1;
        if(end===2&&t<3){if(hsh(t,1,v+13)<.6)lo+=1;if(hsh(t,2,v+13)<.5)hi-=1;if(t===0){lo++;hi--}}
        for(let j=lo;j<=hi;j++){const f=j/(d-1);let l=.75-1.6*f+(hsh(t,j,v+14)-.5)*.25;
          if(hsh(Math.floor((t+j*2)/3),j,v+15)<.28)l-=.45;if(j>0&&j<d-1&&hsh(t,0,v+16)<.05)l-=.6;if(j===lo&&t>0)l+=.2;
          let col=ramp(BARK,Math.max(-1,Math.min(.99,l)));if(f<.45&&v%3!==1&&vn(t/4,j,v+17)>.6)col=ramp(MOSS,l*.7);
          if(end===2&&t<3&&(j===lo||j===hi))col=WOOD[1+(t&1)];set(x,yc+j,col)}}
      // (its sawn east end: a face of rings, bark round it)
      {const x=ox+n,yc=Math.round(y0+(n-1)*sl),m=(d-1)/2;for(let j=0;j<d;j++){const r=Math.abs(j-m)/(m+.5);set(x,yc+j,r>.8?BARK[3]:r<.25?WOOD[0]:WOOD[2-((Math.floor(r*3))&1)]);if(j>0&&j<d-1)set(x+1,yc+j,BARK[1])}}
      if(end===0){const yc=Math.round(y0);for(let j=1;j<d-1;j++)set(ox-1,yc+j,WOOD[1])}
      // (a branch stub up from its top; bracket fungi on its side)
      if(hsh(n,v,18)<.65){const t=2+Math.floor(hsh(n,v,19)*(n-5)),yc=Math.round(y0+t*sl);set(ox+t,yc-1,BARK[3]);set(ox+t+1,yc-2,BARK[3]);if(v&2)set(ox+t+2,yc-3,BARK[2])}
      if(v%3===0)for(let k=0;k<2;k++){const t=1+Math.floor(hsh(k,v,20)*(n-3)),yc=Math.round(y0+t*sl)+d-2;set(ox+t,yc,[226,206,156]);set(ox+t+1,yc,[196,164,112]);set(ox+t,yc+1,[150,120,80])}
      ay=Math.round(y0+(n>>1)*sl)+d-1});
    return {img,ax:ox+(n>>1),ay}})}
  // a stump: a short trunk (lit west, dark east, grooved bark), flaring into roots at its foot; its top sawn (rings, a crack, its
  // heart) or broken off in splinters; moss on it, or mushrooms at its foot, now and then
  function stumpPic(v){return nat('t'+v,()=>{const w=15,h=15,base=h-3,cx=7.5,rx=3+(v&1)*.6,th=3+v%3,broken=v%3===2,ry=1.6,cyT=base-th-1;
    const img=pixPic(w,h,(set,has)=>{shade(set,cx+1.5,base+.6,rx+3.5,1.8,.4);
      // (roots: west and east along the ground, one toward you)
      for(const [dx,len] of [[-1,2+(v&2?1:0)],[1,3],[.35,1]]){const sx=cx+dx*rx;for(let k=0;k<=len;k++){const x=Math.round(sx+(dx>.5?k:dx<-.5?-k:k*.5)),y=base-1+Math.min(1,k>>1);set(x,y,k===len?BARK[1]:BARK[2]);if(k<len-1)set(x,y-1,BARK[3])}}
      for(let y=Math.floor(cyT);y<=base;y++){const fl=y>=base-1?1:0;for(let x=Math.floor(cx-rx-fl);x<=cx+rx+fl;x++){const dx=(x+.5-cx)/(rx+fl);if(Math.abs(dx)>1)continue;
        let top=cyT;if(broken)top=cyT-1+Math.round(hsh(x,v,21)*3)-(Math.abs(dx)<.5?1:0);if(y<top)continue;
        let l=-dx*.85+.15+(hsh(x,y,v+22)-.5)*.2;if(hsh(x,0,v+23)<.35)l-=.4;if(y===base)l-=.3;
        let col=ramp(BARK,Math.max(-1,Math.min(.99,l)));if(broken&&y===top)col=WOOD[hsh(x,y,v)<.5?2:1];else if(v&1&&dx<.2&&y>base-3&&vn(x/2,y/2,v+24)>.5)col=ramp(MOSS,l);set(x,y,col)}}
      if(!broken)for(let y=Math.floor(cyT-ry);y<=cyT+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cyT)/ry,r=Math.hypot(dx,dy);if(r>1)continue;
        set(x,y,r>.78?(dx<0&&dy<0?BARK[4]:BARK[3]):r<.22?[134,98,62]:Math.abs(dy)<.35&&dx>.3?WOOD[0]:WOOD[2-(Math.floor(r*3.4)&1)])}
      if(v%4===1){const red=v&2;for(const [mx,mh] of [[cx+rx+1.5,1],[cx+rx+3,0]]){const x=Math.round(mx);set(x,base,[226,218,200]);if(mh)set(x,base-1,[226,218,200]);const cy=base-1-mh;
        set(x-1,cy,red?[168,36,32]:[132,90,54]);set(x,cy,red?[196,52,40]:[160,114,70]);set(x+1,cy,red?[150,30,28]:[118,80,48]);set(x,cy-1,red?[220,80,64]:[184,136,88]);if(red)set(x-1,cy,[240,236,226])}}});
    return {img,ax:Math.floor(cx),ay:base}})}
  // a mass of leaves: lumps ([x, y, rx, ry]), the first the whole's own shape; lit up and left (and each lump on its own), darker
  // toward the bottom and the east, its edge ragged with leaves (rag), now and then a hole (gaps) showing the branches behind or the
  // dark inside; o.cut: the row below which nothing is drawn (the ground); o.streak: up-and-down grain (a poplar's); o.dots: [chance,
  // [two colours]] of berries, blossom or fruit
  function leafMass(set,has,B,P,v,o){o=o||{};const m=B[0],inB=(x,y)=>{if(o.cut!==undefined&&y>o.cut)return null;let best=null;for(const b of B){const d=((x+.5-b[0])/b[2])**2+((y+.5-b[1])/b[3])**2;if(d<=1&&(!best||b[1]<best[1]))best=b}return best};
    let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const b of B){x0=Math.min(x0,b[0]-b[2]);x1=Math.max(x1,b[0]+b[2]);y0=Math.min(y0,b[1]-b[3]);y1=Math.max(y1,b[1]+b[3])}
    for(let y=Math.floor(y0);y<=Math.ceil(y1);y++)for(let x=Math.floor(x0);x<=Math.ceil(x1);x++){const b=inB(x,y);if(!b)continue;
      const edge=!inB(x+1,y)||!inB(x-1,y)||!inB(x,y-1)||!inB(x,y+1);if(edge&&hsh(x,y,v+32)<(o.rag===undefined?.3:o.rag))continue;
      const dx=(x+.5-m[0])/m[2],dy=(y+.5-m[1])/m[3],bx=(x+.5-b[0])/b[2],by=(y+.5-b[1])/b[3];
      let l=-(dx*.5+dy*.7)*.7-(bx*.3+by*.45)*.55+(hsh(x,y,v+33)-.5)*.55;if(o.cut!==undefined&&y>=o.cut-1)l-=.4;if(!inB(x+1,y)||!inB(x,y+1))l-=.3;
      if(o.streak)l+=(hsh(x,Math.floor(y/3),v+37)-.5)*o.streak;
      // (a gap: a pocket of shade in the leaves, ragged, a tone or two under the leaves round it, only where they are in shade (the
      //  owner, 2026-11-16: "What's the black dot on trees?": no hard square of the darkest tone, no bark showing as a grey dot))
      if(o.gaps&&!edge&&by>0&&l<.15&&hsh(x>>1,y>>1,v+36)<o.gaps&&hsh(x,y,v+38)<.75){set(x,y,ramp(P,Math.max(-1,l-.5)));continue}
      let col=ramp(P,Math.max(-1,Math.min(.99,l)));if(l>.35&&hsh(x,y,v+34)<.12)col=P[4];
      if(o.dots&&!edge&&l>-.3){const r=hsh(x,y,v+35);if(r<o.dots[0])col=o.dots[1][r<o.dots[0]*.4?0:1]}
      set(x,y,col)}}
  // a bush (pal: its leaves' tones): a dome of leafy lumps, its foot in the ground; berries or blossom on some
  function bushPic(v,pal){return nat('u'+v+pal,()=>{const s=9+(v%3)*2,w=s+4,hb=Math.round(s*.74),h=hb+4,base=h-3,P=LEAF[pal],B=[[w/2,base-hb*.45,s*.48,hb*.52]];
    const n=3+v%3;for(let j=0;j<n;j++){const a=Math.PI*(1.1+.8*j/Math.max(1,n-1))+(hsh(v,j,30)-.5)*.3,r=2.2+hsh(v,j,31)*1.4;B.push([w/2+Math.cos(a)*s*.3,base-hb*.45+Math.sin(a)*hb*.4,r,r*.9])}
    const img=pixPic(w,h,(set,has)=>{shade(set,w/2+1,base+.6,s*.5+1,1.7,.4);
      leafMass(set,has,B,P,v,{cut:base,dots:v%4===1?[.07,[[214,84,70],[170,34,40]]]:v%4===2?[.07,pal==='birch'?[[236,232,214],[236,232,214]]:[[226,164,184],[226,164,184]]]:null})});
    return {img,ax:w>>1,ay:base}})}

  // trees, the lab's own (the owner, 2026-11-15: "improve variety of trees"): each kind its own shape, bark and leaves, in three sizes
  // (young, grown, an old giant) and six variants, the variant shifting its tones a little
  const BARKS={brown:[[44,32,24],[62,46,32],[84,62,42],[106,80,54],[128,100,70]],grey:[[70,70,66],[94,94,88],[120,118,110],[146,144,134],[172,170,158]],
      red:[[74,40,28],[104,58,36],[136,80,48],[164,104,62],[190,130,80]],dead:[[66,62,56],[90,86,78],[116,110,100],[142,136,124],[168,162,148]]},
    LEAVES={oak:LEAF.oak,beech:[[34,62,28],[50,88,34],[72,114,44],[100,142,58],[136,172,80]],ash:[[44,70,32],[62,94,40],[86,120,52],[116,148,68],[150,176,92]],
      birch:LEAF.birch,alder:LEAF.dark,willow:[[56,78,34],[80,106,44],[108,134,58],[140,162,76],[176,190,104]],poplar:[[28,56,30],[42,78,38],[60,102,48],[84,128,60],[116,156,78]],
      apple:[[40,72,30],[58,98,40],[80,124,50],[108,150,64],[140,176,84]],maple:[[110,40,24],[150,62,30],[190,96,40],[222,140,56],[242,186,92]],
      gold:[[104,84,28],[146,120,38],[188,158,52],[220,194,76],[244,226,122]],fir:[[18,40,30],[26,58,40],[38,78,50],[54,100,62],[80,126,80]],
      spruce:[[18,36,38],[26,52,52],[36,70,66],[50,90,82],[74,114,102]],pine:[[22,46,32],[32,64,42],[46,86,54],[64,108,68],[92,134,88]],
      palm:[[36,70,34],[54,96,42],[76,122,52],[104,148,66],[140,174,88]],acacia:[[54,70,30],[76,94,40],[100,118,52],[130,144,70],[164,172,96]],
      bog:[[26,44,28],[38,62,36],[52,80,44],[70,100,56],[96,124,72]]},
    // (the broadleaves: crown rx, its ry by rx, trunk px below it, trunk thickness, bark, lumps, holes)
    BROAD={oak:[12,.8,7,3.4,'brown',8,.05],beech:[10,.95,8,2.6,'grey',5,.04],ash:[10,.85,9,2.4,'brown',7,.14],maple:[9,.9,7,2.4,'brown',6,.07],
      alder:[7,1.15,7,2.2,'brown',5,.06],apple:[7,.8,4,2.6,'brown',6,.05]};
  // (a trunk from its foot (x, base) up to row top, w px thick, leaning lean px a px up: lit west, grooved, flaring at its foot; a
  //  birch's white with black marks)
  function trunk(set,x,base,top,w,BK,v,lean,birch){for(let y=base;y>=top;y--){const up=base-y,cx=x+lean*up,tw=Math.max(1,Math.round(w+(up<2?2-up:0)-(up>(base-top)*.7&&w>2?1:0)));
      for(let k=0;k<tw;k++){const px=Math.round(cx-tw/2+k),f=tw>1?k/(tw-1):.4;let col;
        if(birch)col=hsh(Math.floor(y/2),k,v+81)<.2?[40,36,32]:f>.7?[168,164,150]:[228,224,210];
        else{let l=.6-f*1.4+(hsh(px,y,v+80)-.5)*.3;if(hsh(px-Math.round(cx),0,v+82)<.3)l-=.35;col=ramp(BK,Math.max(-1,Math.min(.99,l)))}
        set(px,y,col)}}}
  // (a limb, a line one or two px thick)
  function limb(set,x0,y0,x1,y1,col,t){const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)));for(let k=0;k<=n;k++){const x=x0+(x1-x0)*k/n,y=y0+(y1-y0)*k/n;set(x,y,col);if(t>1)set(x+1,y,col)}}
  function treePic(sp,v,sz,snow){return nat('T'+sp+v+'_'+sz+(snow?'s':''),()=>{const S=[.72,1,1.3][sz],tn=c=>mul(c,.93+(v%3)*.06),R=Math.round;
    // (a broadleaf: a trunk, two limbs up into it, a crown of lumps round its middle)
    if(BROAD[sp]){const [R0,asp,T0,th,bk,nb,gaps]=BROAD[sp],rx=R(R0*S),ry=R(rx*asp),tH=R(T0*S),w=2*rx+8,h=tH+2*ry+5,cx=w>>1,base=h-3,cy=base-tH-ry*.85;
      const P=LEAVES[sp==='maple'&&v&1?'gold':sp].map(tn),B=[[cx,cy,rx,ry]];
      for(let j=0;j<nb;j++){const a=j/nb*Math.PI*2+hsh(v,j,84)*.7,d=.5+hsh(v,j,85)*.18,r=rx*(.32+hsh(v,j,86)*.22);B.push([cx+Math.cos(a)*rx*d,cy+Math.sin(a)*ry*d*.85-ry*.08,r,r*asp*.95])}
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+3,base+.5,rx*.55+2,2.2,.38);const BK=BARKS[bk];
        trunk(set,cx,base,R(cy+ry*.1),Math.max(1.6,th*Math.min(1.25,S)),BK,v,0);for(const d of [-1,1])limb(set,cx,cy+ry*.45,cx+d*rx*.5,cy-ry*.15,BK[1],th>2.5?2:1);
        leafMass(set,has,B,P,v,{gaps,dots:sp==='apple'?[.06,v%3===0?[[244,240,232],[236,184,198]]:[[204,40,36],[230,84,62]]]:null})});
      return {img,ax:cx,ay:base}}
    // (a birch: a slender white trunk, leaning a little, a light crown of small lumps up and down it, gold in autumn now and then)
    if(sp==='birch'){const tH=R((14+v%3*2)*S),rx=R(6*S+1),ry=R(rx*1.5),lean=((v%3)-1)*.08,w=2*rx+10,h=tH+ry+6,base=h-3,cx=w>>1,top=base-tH,mx=cx+lean*tH*.8;
      const P=LEAVES[v===4?'gold':'birch'].map(tn),B=[[mx,top+ry*.2,rx,ry]];for(let j=0;j<6;j++){const r=rx*(.4+hsh(v,j,87)*.2);B.push([mx+(hsh(v,j,88)-.5)*rx*1.1,top+ry*.2+(j/5-.5)*ry*1.3,r,r*1.15])}
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+2,base+.5,rx*.6+1,1.8,.35);trunk(set,cx,base,R(top+ry*.9),2,null,v,lean,true);limb(set,cx+lean*(base-top-ry*.9),top+ry*.9,mx,top-ry*.3,BARKS.dead[1],1);
        leafMass(set,has,B,P,v,{gaps:.16,rag:.42})});
      return {img,ax:cx,ay:base}}
    // (a poplar: tall and narrow, its leaves in up-and-down streaks)
    if(sp==='poplar'){const rx=R(4.5*S+.5),ry=R(15*S),tH=R(4*S),w=2*rx+6,h=tH+2*ry+5,cx=w>>1,base=h-3,cy=base-tH-ry*.92,P=LEAVES.poplar.map(tn),B=[[cx,cy,rx,ry]];
      for(let j=0;j<6;j++){B.push([cx+(hsh(v,j,89)-.5)*rx*.6,cy+(j/5-.5)*ry*1.4,rx*.72,ry*.3])}
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+2,base+.5,rx+1,1.8,.35);trunk(set,cx,base,R(cy),2,BARKS.grey,v,0);leafMass(set,has,B,P,v,{streak:.55,gaps:.04,rag:.25})});
      return {img,ax:cx,ay:base}}
    // (a willow: a thick short trunk, a round crown, strands hanging from it nearly to the ground, lighter at their tips)
    if(sp==='willow'){const rx=R(11*S),ry=R(rx*.68),tH=R(8*S),w=2*rx+8,h=tH+2*ry+5,cx=w>>1,base=h-3,cy=base-tH-ry*.7,P=LEAVES.willow.map(tn),B=[[cx,cy,rx,ry]];
      for(let j=0;j<6;j++){const a=Math.PI*(1+j/5),r=rx*(.38+hsh(v,j,90)*.15);B.push([cx+Math.cos(a)*rx*.55,cy+Math.sin(a)*ry*.45,r,r*.75])}
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+3,base+.5,rx*.8,2.2,.38);trunk(set,cx,base,R(cy),3.2*Math.min(1.2,S),BARKS.grey,v,0);limb(set,cx,cy+ry*.4,cx-rx*.5,cy-ry*.2,BARKS.grey[1],2);
        leafMass(set,has,B,P,v,{gaps:.05,rag:.2});
        for(let x=Math.round(cx-rx+1);x<cx+rx;x++){if(hsh(x,0,v+91)<.35)continue;let y=Math.round(cy);while(y<base&&has(x,y+1))y++;if(y<=cy)continue;const L=Math.round((base-3-y)*(.45+hsh(x,1,v+92)*.5));
          for(let k=1;k<=L;k++){const f=k/L;set(x+(f>.6&&hsh(x,2,v+93)<.4?1:0),y+k,ramp(P,.3-f*.5+(x<cx?.25:-.25)+(hsh(x,k,v+94)-.5)*.3))}}});
      return {img,ax:cx,ay:base}}
    // (a fir or a spruce: tiers of drooping boughs from a wide skirt to a tip, lit west, dark under each; snow on their tops up high)
    if(sp==='fir'||sp==='spruce'){const Ht=R((28+v%3*4)*S),W2=R(Ht*(sp==='spruce'?.3:.36)),tH=R(3*S+1),w=2*W2+6,h=Ht+tH+5,cx=w>>1,base=h-3,top=base-tH-Ht,n=R(5+S*1.5),P=LEAVES[sp].map(tn);
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+3,base+.5,W2*.8,2,.38);trunk(set,cx,base,base-tH-3,2,BARKS.brown,v,0);
        for(let j=n-1;j>=0;j--){const ty=top+Ht*j/n*.92,by=top+Ht*(j+1)/n+2,wb=W2*(.25+.75*(j+1)/n)+(hsh(v,j,95)-.5)*1.5;
          for(let y=Math.floor(ty);y<=by;y++){const fr=(y-ty)/Math.max(1,by-ty),half=wb*(.2+.8*fr);
            for(let x=Math.floor(cx-half);x<=cx+half;x++){const dx=(x+.5-cx)/Math.max(1,half);if(y>=by-1&&hsh(x,j,v+96)<.45)continue;
              let l=-dx*.75+(1-fr)*.35-.05-j/n*.3+(hsh(x,y,v+97)-.5)*.35;if(y>=by-1)l-=.5;if(Math.abs(dx)>.85)l-=.2;
              let col=ramp(P,Math.max(-1,Math.min(.99,l)));if(snow&&fr<.4&&dx<.5&&hsh(x,y,v+98)<.75-fr)col=dx<-.2?[238,242,248]:[204,214,228];set(x,y,col)}}}
        set(cx,top-1,P[3])});
      return {img,ax:cx,ay:base}}
    // (a pine: a tall bare trunk, red up high, limbs out to flat clouds of needles at its top)
    if(sp==='pine'){const tH=R((17+v%3*3)*S),rx=R(8*S),w=2*rx+8,h=tH+R(6*S)+6,cx=w>>1,base=h-3,top=base-tH,lean=((v%3)-1)*.07,tx=cx+lean*tH,P=LEAVES.pine.map(tn),B=[[tx,top+2,rx*.85,R(3.5*S)]];
      for(let j=0;j<3+v%2;j++){const r=rx*(.4+hsh(v,j,99)*.25);B.push([tx+(hsh(v,j,100)-.5)*rx*1.3,top+2+(hsh(v,j,101)-.6)*5*S,r,r*.45])}
      const sideY=top+R(tH*.35),side=v&1?1:-1;B.push([tx+side*rx*.55+lean*(top-sideY),sideY,rx*.45,R(2.6*S)]);
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+3,base+.5,rx*.6,2,.35);trunk(set,cx,base,top+2,2+(S>1?1:0),BARKS.red,v,lean);
        limb(set,cx+lean*(base-sideY),sideY+2,tx+side*rx*.5+lean*(top-sideY),sideY,BARKS.red[1],1);for(const d of [-1,1])limb(set,tx,top+4,tx+d*rx*.6,top+2,BARKS.red[1],1);
        leafMass(set,has,B,P,v,{gaps:.08,rag:.35})});
      return {img,ax:cx,ay:base}}
    // (a date palm: a curving trunk ringed every two px, fronds fanning from its top and drooping, leaflets under them; dates now and then)
    if(sp==='palm'){const Ht=R((18+v%3*4)*S),Lf=R((8+v%2*2)*S),bend=((v%3)-1||1)*(.18+hsh(v,1,110)*.12)*Ht,w=2*Lf+R(Math.abs(bend))+10,h=Ht+Lf+6,base=h-3,cx=R(Lf+5+(bend<0?-bend:0)),tx=cx+bend,ty=base-Ht,P=LEAVES.palm.map(tn);
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+3,base+.5,Lf*.7,2,.35);
        for(let k=0;k<=Ht;k++){const f=k/Ht,x=cx+bend*f*f,y=base-k,tw=f<.1?3:2;for(let j=0;j<tw;j++){let c=j===0?[176,146,100]:[128,100,66];if(k%2===0)c=mul(c,.78);set(R(x)-1+j,y,c)}}
        const n=7+v%3;for(let j=0;j<n;j++){const a=-Math.PI+j/(n-1)*Math.PI+(hsh(v,j,111)-.5)*.3,ln=Lf*(.75+hsh(v,j,112)*.35),dr=.6+hsh(v,j,113)*.4,lit=Math.cos(a)<0?.3:-.2;let lx=-99,ly=-99;
          for(let t=0;t<=1;t+=.04){const x=R(tx+Math.cos(a)*t*ln*1.15),y=R(ty+Math.sin(a)*t*ln*.6+t*t*ln*dr);if(x===lx&&y===ly)continue;lx=x;ly=y;
            set(x,y,ramp(P,lit-t*.3));if(t>.15){set(x,y+1,ramp(P,lit-.5));if(t<.85&&(R(t*20)&1))set(x,y+2,ramp(P,lit-.7))}}}
        if(v%2)for(const [dx,dy] of [[-1,2],[0,3],[1,2],[1,3]])set(R(tx)+dx,ty+dy,[150,86,40]);set(R(tx),ty-1,P[3])});
      return {img,ax:cx,ay:base}}
    // (an acacia: a thin trunk forking into limbs up to a wide flat crown)
    if(sp==='acacia'){const tH=R((9+v%3*2)*S),rx=R(11*S),ry=Math.max(2,R(3*S)),w=2*rx+8,h=tH+2*ry+6,cx=w>>1,base=h-3,cy=base-tH-ry*.3,P=LEAVES.acacia.map(tn),B=[[cx,cy,rx,ry]];
      for(let j=0;j<5;j++){const r=rx*(.3+hsh(v,j,114)*.2);B.push([cx+(j/4-.5)*rx*1.5,cy-ry*.3+(hsh(v,j,115)-.5)*2,r,r*.4])}
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+3,base+.5,rx*.7,2,.38);const fy=base-R(tH*.55);trunk(set,cx,base,fy,2,BARKS.brown,v,0);
        for(const d of [-1,1,0])limb(set,cx,fy,cx+d*rx*.55,cy+1,BARKS.brown[2],1);leafMass(set,has,B,P,v,{gaps:.12,rag:.4})});
      return {img,ax:cx,ay:base}}
    // (a birch in winter: its white trunk, bare twigs reaching up)
    if(sp==='winterbirch'){const tH=R((16+v%3*3)*S),w=R(22*S)+4,h=tH+R(8*S)+5,cx=w>>1,base=h-3,top=base-tH,lean=((v%3)-1)*.06,TW=[[58,50,46],[84,74,66],[110,98,88]];
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+2,base+.5,4,1.6,.3);trunk(set,cx,base,top,2,null,v,lean,true);
        const br=(x,y,a,len,d,k)=>{const x2=x+Math.cos(a)*len,y2=y+Math.sin(a)*len;limb(set,x,y,x2,y2,TW[d>1?0:1+(k&1)],1);if(d>0){br(x2,y2,a-.35-hsh(v,k,116)*.25,len*.7,d-1,k*2+1);br(x2,y2,a+.3+hsh(v,k,117)*.25,len*.66,d-1,k*2+2)}};
        for(let j=0;j<4;j++){const y=top+R(tH*(.1+j*.16)),x=cx+lean*(base-y);br(x,y,-Math.PI/2+(j&1?.7:-.7)+(hsh(v,j,118)-.5)*.3,(6-j)*S,2,j+3)}});
      return {img,ax:cx,ay:base}}
    // (a swamp cypress: a flared foot with knees round it in the mud, a few flat dark clouds of needles, grey moss hanging from them)
    if(sp==='bogtree'){const tH=R((12+v%3*3)*S),rx=R(9*S),w=2*rx+12,h=tH+R(7*S)+6,cx=w>>1,base=h-3,top=base-tH,P=LEAVES.bog.map(tn),BK=BARKS.grey,B=[[cx,top+1,rx*.75,R(3.2*S)]];
      for(let j=0;j<4;j++){const r=rx*(.32+hsh(v,j,119)*.2);B.push([cx+(hsh(v,j,120)-.5)*rx*1.4,top+1+(j/3)*tH*.45,r,r*.42])}
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+3,base+.5,rx*.8,2.2,.38);
        for(let k=0;k<4;k++){const wd=6-k;for(let j=0;j<wd;j++)set(R(cx-wd/2+j),base-k,ramp(BK,.4-(j/(wd-1))*1.2))}
        trunk(set,cx,base-3,top,2.4,BK,v,0);
        for(const [dx,dy] of [[-6,0],[5,0],[-3,1],[7,-1]])if(hsh(v,dx,121)<.7){set(cx+dx,base+dy,BK[2]);set(cx+dx,base+dy-1,BK[3])}
        for(let j=1;j<B.length;j++)limb(set,cx,B[j][1]+2,B[j][0],B[j][1],BK[1],1);
        leafMass(set,has,B,P,v,{gaps:.1,rag:.4});
        for(let x=R(cx-rx);x<cx+rx;x++){if(hsh(x,0,v+122)<.55)continue;let y=top-3;while(y<base-4&&!has(x,y))y++;while(y<base&&has(x,y+1))y++;if(y>=base-4)continue;
          const n=2+Math.floor(hsh(x,1,v+123)*5);for(let k=1;k<=n;k++)set(x,y+k,k===n?[168,176,146]:[130,140,112])}});
      return {img,ax:cx,ay:base}}
    // (a dead tree: grey, bare limbs forking twice, its top broken off)
    {const tH=R((13+v%3*3)*S),w=R(28*S),h=tH+R(13*S)+5,cx=w>>1,base=h-3,top=base-tH,BK=BARKS.dead;
      const img=pixPic(w,h,(set,has)=>{shade(set,cx+2,base+.5,4,1.6,.35);trunk(set,cx,base,top,2.4*Math.min(1.2,S),BK,v,0);
        const br=(x,y,a,len,t,d,k)=>{const x2=x+Math.cos(a)*len,y2=y+Math.sin(a)*len;limb(set,x,y,x2,y2,BK[t>1?2:1+(k&1)],t);if(d>0){br(x2,y2,a-.42-hsh(v,k,102)*.35,len*.68,t-1,d-1,k*2+1);if(hsh(v,k,103)<.85)br(x2,y2,a+.38+hsh(v,k,104)*.35,len*.64,t-1,d-1,k*2+2)}};
        br(cx,top+2,-Math.PI/2-.5,6*S,2,2,1);br(cx,top+4,-Math.PI/2+.55,5.5*S,2,2,2);set(cx,top-1,BK[3])});
      return {img,ax:cx,ay:base}}})}
  // a bank of mist: a soft white ellipse, made once
  let MIST=null;function mistPic(){if(MIST)return MIST;const c=document.createElement('canvas');c.width=128;c.height=40;const g=c.getContext('2d');g.save();g.scale(1,40/128);
    const gr=g.createRadialGradient(64,64,4,64,64,64);gr.addColorStop(0,'rgba(226,234,226,.9)');gr.addColorStop(.6,'rgba(220,228,222,.4)');gr.addColorStop(1,'rgba(220,228,222,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);g.restore();return MIST=c}
  // an agave on dry ground: stiff blue-green blades from one root, now and then a tall stalk in flower
  function agavePic(v){return nat('a'+v,()=>{const st=v%4===0,w=13,h=st?20:10,base=h-2,cx=6,P=[[70,100,84],[96,128,108],[128,158,136],[164,190,168]];
    const img=pixPic(w,h,(set,has)=>{shade(set,cx+1,base+.5,4.5,1.2,.3);
      if(st){for(let k=1;k<h-4;k++)set(cx,base-k,[120,110,60]);for(const [dx,dy] of [[0,0],[-1,1],[1,1],[0,-1]])set(cx+dx,4+dy,[230,196,70])}
      const n=7+(v&1)*2;for(let j=0;j<n;j++){const a=-Math.PI*(.08+.84*j/(n-1)),Ln=3+hsh(v,j,124)*3*(1-Math.abs(j/(n-1)-.5));
        for(let t=0;t<=Ln;t+=.5)set(Math.round(cx+Math.cos(a)*t*1.2),Math.round(base+Math.sin(a)*t),ramp(P,(Math.cos(a)<0?.2:-.3)+t/Ln*.6))}});
    return {img,ax:cx,ay:base}})}
  // bones bleaching on the sand: a ribcage, a skull now and then
  function bonesPic(v){return nat('o'+v,()=>{const w=11,h=7,base=4,B=[[226,218,196],[200,190,166],[160,150,128]];
    const img=pixPic(w,h,(set,has)=>{for(let x=2;x<10;x++)set(x,base+1,B[2]);for(let j=0;j<4;j++){const x=3+j*2;set(x,base,B[1]);set(x,base-1,B[0]);set(x+1,base-2,B[0])}
      if(v&1){set(0,base,B[0]);set(1,base,B[0]);set(0,base-1,B[0]);set(1,base-1,B[1]);set(0,base+1,[90,80,70])}});
    return {img,ax:5,ay:base}})}
  // lily pads on a pool: one to three round leaves, each with its notch; a flower on some
  function lilyPic(v){return nat('y'+v,()=>{const w=12,h=6,P=[[58,98,44],[84,128,56],[118,160,74]];
    const img=pixPic(w,h,(set,has)=>{for(let j=0;j<1+v%3;j++){const cx=3+j*3+(hsh(v,j,125)-.5)*2,cy=2.5+(j&1),r=1.8+hsh(v,j,126)*1.2,nw=hsh(v,j,127)*6.28;
        for(let y=Math.floor(cy-r*.6);y<=cy+r*.6;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++){const dx=(x+.5-cx)/r,dy=(y+.5-cy)/(r*.6),d=dx*dx+dy*dy;if(d>1)continue;
          if(Math.abs(((Math.atan2(dy,dx)-nw+9.42)%6.28)-3.14)<.35)continue;set(x,y,d>.6?P[0]:dy<0?P[2]:P[1])}
        if(j===0&&v%3===1){set(Math.round(cx),Math.round(cy)-1,[236,190,206]);set(Math.round(cx)+1,Math.round(cy)-1,[246,226,236])}}});
    return {img,ax:6,ay:3}})}
  // a fern: fronds fanning up from one root, drooping at their tips, leaflets on both sides
  function fernPic(v){return nat('f'+v,()=>{const w=17,h=13,base=11,cx=8,n=5+(v&1);
    const img=pixPic(w,h,(set,has)=>{shade(set,cx+1,base+.5,5,1.4,.3);
      for(let j=0;j<n;j++){const u=j/(n-1),a=-Math.PI*(.18+.64*u)+(hsh(v,j,40)-.5)*.15,L=6+hsh(v,j,41)*2.5-Math.abs(u-.5)*2,dr=.25+Math.abs(u-.5)*1.1;let lx=-9,ly=-9;
        for(let t=0;t<=1;t+=.06){const x=Math.round(cx+Math.cos(a)*t*L*1.2),y=Math.round(base+Math.sin(a)*t*L*1.15+t*t*L*dr);if(x===lx&&y===ly)continue;lx=x;ly=y;
          set(x,y,t>.75?FERN[3]:FERN[1]);if(t>.2&&t<.85&&Math.round(t*12)%2===0){set(x,y-1,FERN[2]);set(x+(Math.cos(a)>0?1:-1),y+1,FERN[0])}}}});
    return {img,ax:cx,ay:base}})}
  // mushrooms at the woods' floor: one to three, red and spotted, brown, or pale
  function mushroomPic(v){return nat('m'+v,()=>{const w=9,h=7,base=5,k=v%3,C=[[[150,30,28],[186,44,36],[214,72,58]],[[110,74,44],[140,98,60],[172,128,82]],[[176,164,138],[204,194,168],[228,220,198]]][k];
    const img=pixPic(w,h,(set,has)=>{shade(set,4.5,base+.5,4,1.2,.3);
      for(let j=0;j<1+v%3;j++){const x=2+j*2+(j&1),sh=j?0:1,cy=base-1-sh;set(x,base,[226,218,200]);if(sh)set(x,base-1,[226,218,200]);
        set(x-1,cy,C[1]);set(x,cy,C[1]);set(x+1,cy,C[0]);if(!j){set(x,cy-1,C[2]);if(!k)set(x-1,cy,[240,236,226])}}});
    return {img,ax:4,ay:base}})}
  // a patch of flowers: stems and a few leaves, the heads one colour
  function flowersPic(v){return nat('w'+v,()=>{const w=10,h=7,base=5,C=[[236,206,80],[238,236,226],[130,146,224],[226,146,176],[170,118,196]][v%5];
    const img=pixPic(w,h,(set,has)=>{for(let j=0;j<4+v%4;j++){const x=1+Math.floor(hsh(v,j,50)*8),t=1+Math.floor(hsh(v,j,51)*2),y=base-Math.floor(hsh(v,j,52)*2);
      for(let k=0;k<t;k++)set(x,y-k,[70,112,46]);set(x,y-t,C);if(hsh(v,j,53)<.4)set(x+1,y-t,mul(C,.8));if(hsh(v,j,54)<.5)set(x-1,y,[56,94,38])}});
    return {img,ax:5,ay:base}})}
  // reeds and cattails on a bank: stems leaning a little, brown heads on some, a blade or two bent over
  function cattailPic(v){return nat('c'+v,()=>{const w=10,h=13,base=11;
    const img=pixPic(w,h,(set,has)=>{shade(set,5,base+.5,4,1.2,.3);
      for(let j=0;j<3+v%3;j++){const x0=2+Math.floor(hsh(v,j,60)*6),ht=6+Math.floor(hsh(v,j,61)*4),lean=(hsh(v,j,62)-.5)*.3,head=hsh(v,j,63)<.55;
        for(let k=0;k<ht;k++){const x=Math.round(x0+lean*k);set(x,base-k,k<2?[70,96,46]:[96,124,58])}const tx=Math.round(x0+lean*ht);
        if(head){set(tx,base-ht+1,[110,70,38]);set(tx,base-ht,[132,88,48]);set(tx,base-ht-1,[150,150,96])}else set(tx,base-ht,[160,170,96])}
      for(let j=0;j<2;j++){const x0=3+j*3,d=j?1:-1;for(let k=0;k<5;k++)set(x0+(k>2?d*(k-2):0),base-k+(k>3?1:0),[112,140,66])}});
    return {img,ax:5,ay:base}})}

  // a grass clump: a few blades from its foot, each bending lean px at its tip (the more toward the tip), dark at the foot, light at
  // the tip; a meadow's now and then flowering. Cached by kind, variant and lean
  const GRASS_PAL={grass:[[48,84,36],[78,122,50],[126,168,76]],meadow:[[54,94,40],[92,138,56],[148,184,88]],dune:[[118,126,68],[152,158,90],[194,188,118]],
    wood:[[36,64,30],[50,84,38],[70,106,48]],dry:[[146,122,66],[180,154,88],[214,190,122]],frost:[[110,114,92],[150,152,122],[214,220,214]],
    marsh:[[40,58,28],[62,84,38],[98,116,54]]},GRASS_KINDS=['grass','meadow','dune','wood','dry','frost','marsh'],GW=11,GH=10;
  // (all of them on one sheet, a row for each kind and variant, a column for each lean; and each also as its list of pixels (where, what
  //  colour), which a frame writes straight into one buffer: thousands of clumps cost one picture drawn, not thousands)
  let GATLAS=null;
  function grassAtlas(){if(GATLAS)return GATLAS;const n=F.lean,c=document.createElement('canvas');c.width=GW*(2*n+1);c.height=GH*GRASS_KINDS.length*4;const g=c.getContext('2d');
    GRASS_KINDS.forEach((t,ti)=>{for(let v=0;v<4;v++)for(let l=-n;l<=n;l++)g.drawImage(grassSprite(t,v,l),(l+n)*GW,(ti*4+v)*GH)});
    const U=new Uint32Array(g.getImageData(0,0,c.width,c.height).data.buffer),px=[];
    for(let r=0;r<GRASS_KINDS.length*4;r++)for(let l=0;l<=2*n;l++){const D=[],C=[];for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const u=U[(r*GH+y)*c.width+l*GW+x];if(u>>>24)D.push(x,y),C.push(u)}
      px.push({D:Int8Array.from(D),C:Uint32Array.from(C)})}
    c.px=px;return GATLAS=c}
  function grassSprite(t,v,lean){const w=GW,h=GH,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),P=GRASS_PAL[t],n=3+(v&1)+(t==='meadow'?1:0);
    for(let b=0;b<n;b++){const bx=2.5+b*(5.5/n)+(hsh(v,b,150)-.5),hb=(t==='frost'?3:4)+Math.floor(hsh(v,b,151)*(t==='dune'||t==='marsh'?5:t==='frost'?3:4)),sk=(hsh(v,b,152)-.5)*1.2;
      for(let j=0;j<hb;j++){const f=j/Math.max(1,hb-1),x=Math.round(bx+(lean+sk)*Math.pow(f,1.6)),y=h-1-j;if(x<0||x>=w)continue;const col=f<.34?P[0]:f<.7?P[1]:P[2];g.fillStyle='rgb('+col.join(',')+')';g.fillRect(x,y,1,1)}
      if(t==='meadow'&&v===3&&b===1){const x=Math.round(bx+(lean+sk)),y=h-hb;g.fillStyle=['#e6d678','#dc8ca0','#ececec'][b%3];g.fillRect(x,y,1,1)}}
    return c}

  F.clear=()=>{for(const k in NAT)delete NAT[k];GATLAS=null};
  Object.assign(F,{pixPic,ramp,shade,rockPic,boulderPic,stonePic,logPic,stumpPic,leafMass,bushPic,treePic,mistPic,agavePic,bonesPic,lilyPic,fernPic,mushroomPic,flowersPic,cattailPic,
    grassAtlas,grassSprite,GRASS_PAL,GRASS_KINDS,GW,GH,LEAF,LEAVES,BARKS,ROCKS});
  PX.flora=F;
})(window.PX);
