'use strict';
/* ---------- PX engine: pixel toolkit ---------- */
// Reusable procedural pixel-art helpers, shared by every generator in engine/ and free of any one game's state.
// Plain script (works from file://); everything lives on window.PX. Colours are '#rrggbb' strings.
(function(PX){
  // a seeded random stream: PX.rng(seed)() -> [0,1); same seed, same stream
  PX.rng=seed=>{let s=(seed|0)||1;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}};
  // a small toolkit over a stream: int in [a,b], pick from a list, chance
  PX.dice=R=>({int:(a,b)=>a+Math.floor(R()*(b-a+1)),pick:a=>a[Math.floor(R()*a.length)],chance:p=>R()<p,R});
  // a stable hash of integers to [0,1)
  PX.hash=(x,y,s)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1274126177);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};

  /* colour */
  const hex2=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
  const rgb2=(r,g,b)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
  // lighter (f>1) or darker (f<1)
  PX.shade=(c,f)=>{const [r,g,b]=hex2(c);return f>1?rgb2(r+(255-r)*(f-1),g+(255-g)*(f-1),b+(255-b)*(f-1)):rgb2(r*f,g*f,b*f)};
  PX.mix=(a,b,t)=>{const A=hex2(a),B=hex2(b);return rgb2(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t)};

  /* canvases */
  PX.canvas=(w,h,draw)=>{const c=document.createElement('canvas');c.width=Math.max(1,w);c.height=Math.max(1,h);const g=c.getContext('2d');g.imageSmoothingEnabled=false;if(draw)draw(g,c);return c};
  // a painter over one context: solid rectangles, single pixels, and polygons filled pixel by pixel through a colour function
  PX.paint=g=>{
    const P={
      rect(c,x,y,w,h){if(!c||w<=0||h<=0)return;g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))},
      px(c,x,y){P.rect(c,x,y,1,1)},
      // fill a convex or concave polygon: col(x,y) gives each pixel's colour (or null to skip)
      poly(pts,col){const ys=pts.map(p=>p[1]),y0=Math.floor(Math.min(...ys)),y1=Math.ceil(Math.max(...ys));
        for(let y=y0;y<=y1;y++){const cy=y+.5,xs=[];for(let i=0;i<pts.length;i++){const [ax,ay]=pts[i],[bx,by]=pts[(i+1)%pts.length];if((ay<=cy&&by>cy)||(by<=cy&&ay>cy))xs.push(ax+(cy-ay)/(by-ay)*(bx-ax))}
          xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2)for(let x=Math.round(xs[k]);x<Math.round(xs[k+1]);x++){const c=typeof col==='function'?col(x,y):col;if(c)P.px(c,x,y)}}},
      line(c,x0,y0,x1,y1){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++)P.px(c,Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n))},
      clear(x,y,w,h){g.clearRect(x,y,w||1,h||1)}
    };return P;
  };
  // a 1-pixel outline around everything opaque (the same dark rim the characters wear); returns a new canvas 2px bigger
  PX.outline=(src,col)=>{const c=PX.canvas(src.width+2,src.height+2),g=c.getContext('2d'),m=PX.canvas(src.width,src.height),mg=m.getContext('2d');
    mg.drawImage(src,0,0);mg.globalCompositeOperation='source-in';mg.fillStyle=col||'#1a1512';mg.fillRect(0,0,m.width,m.height);
    for(const [a,b] of [[0,1],[2,1],[1,0],[1,2]])g.drawImage(m,a,b);g.drawImage(src,1,1);return c};

  /* the medieval palette: materials by name, each a few tones from light to dark */
  PX.MAT={
    thatch:['#d8bc72','#c4a45a','#a88a46','#86703a'],terracotta:['#c0704e','#a8583e','#8e4632','#6e3626'],shingle:['#8a6a4a','#74583e','#5e4632','#463424'],
    slate:['#727a84','#5c646e','#4a5058','#383d44'],turf:['#7a9a46','#64843a','#50702e','#3c5824'],leaf:['#6aa050','#4f8a3e','#3c7032','#2c5626'],hide:['#b49068','#9a7650','#7e5e3e','#5e442c'],
    daub:['#e8dcbc','#d8c8a0','#c0ae88','#9a8a6a'],timber:['#6a4a30','#54382a','#40281c','#2c1c14'],stone:['#a8a296','#8e877a','#746e62','#5a554c'],
    log:['#9a7048','#7e5a38','#644428','#4a321e'],plank:['#a07e54','#8a6844','#705236','#563e28'],whitewash:['#f0eadc','#e0d8c4','#c8bea6','#a69c86'],
    darkstone:['#8a8e98','#70747e','#5a5e68','#44474f'],sandstone:['#d8c08a','#c4aa74','#a88e5e','#8a7248'],
    glass:['#ffe0a0','#e8b860','#4a5468','#2a3040'],iron:['#9aa0a8','#7a8088','#5a5e66','#3a3e44'],
    canvas:['#e4dcc4','#c8b890','#b04a3a','#5a6a8a']
  };
})(window.PX=window.PX||{});
