'use strict';
/* ---------- PX engine: the building kit ---------- */
// What every building generator shares, free of any one's layout: the materials (PX.MAT and the kit's own: natural rock, autumn and
// evergreen leaves), a material's tone and its texture on a face, the light by surface role (LIGHT), the textured quad, the cell's
// fit (bounds, crop) and ground shadow, and the small pieces a wall carries (door, window, arrow slit, chimney) and stands beside
// it (barrel, crate, woodpile), their colours as data (PIECE). buildings.js (the angled and top-down buildings) and model.js (the
// buildings made as 3D models) draw with it. Needs pixel.js. Everything lives on PX.kit.
(function(PX){
  const M=PX.MAT;
  // natural rock (no masonry): grey, desert sandstone, dark swamp rock, frost rock
  if(!M.rock)Object.assign(M,{rock:['#a8a49a','#8a867c','#6c6962','#4c4a44'],sandrock:['#d8b07a','#bf9262','#9a7048','#6a4a2e'],darkrock:['#7e7e6c','#626254','#4a4a40','#34342c'],frostrock:['#b8c0cc','#98a0ac','#78808c','#575d68']});
  if(!M.autumn)M.autumn=['#e8b84a','#d08e34','#aa6a28','#7a4a20'];if(!M.evergreen)M.evergreen=['#4f8a52','#3a7044','#2c5836','#1f4228'];
  const tone=(mat,i)=>M[mat][Math.max(0,Math.min(M[mat].length-1,i))];
  // how lit each kind of surface is (0 lit .. 2 shade). A building facing left is drawn as if facing right and flipped,
  // so its shading is chosen for where each surface ends up: the side wall then faces the sun, the front a little less.
  const LIGHT={right:{front:0,side:1,slopeF:0,slopeL:0,slopeR:2,flip:false},left:{front:1,side:0,slopeF:0,slopeL:2,slopeR:0,flip:true}};

  /* texture: what colour a material shows at (a, b) on a face, a along it, b up it; lit 0 (lit) .. 2 (shade) */
  function tex(mat,a,b,lit,seed,o){
    const h=PX.hash(a,b,seed),L=lit|0;
    switch(mat){
      case 'thatch':{const row=Math.floor(b/2);const streak=PX.hash(a,row,seed)<.35?1:0;return tone(mat,L+streak+(b%2===0&&PX.hash(a>>1,row,seed+1)<.3?1:0))}
      case 'terracotta':{const row=Math.floor(b/2),off=row%2,edge=(a+off)%3===0;return tone(mat,L+(b%2===0?1:0)+(edge?1:0))}
      case 'shingle':case 'slate':{const row=Math.floor(b/2),off=(row%2)*2,edge=(a+off)%4===0;return tone(mat,L+(b%2===0?1:0)+(edge?1:0)+(h<.08?1:0))}
      case 'turf':case 'leaf':return tone(mat,L+(h<.3?1:0)+(h>.92?-1:0));
      case 'hide':{const seam=(a%7===0)||(b%5===0);return tone(mat,L+(seam?1:0)+(h<.15?1:0))}
      case 'stone':case 'darkstone':case 'sandstone':{const row=Math.floor(b/3),off=(row%2)*2,mortar=b%3===2||(a+off)%5===4;return mortar?tone(mat,L+2):tone(mat,L+(PX.hash((a+off)/5|0,row,seed)<.3?1:0))}
      case 'log':return tone(mat,L+(b%2===1?1:0)+(h<.1?1:0));
      case 'rock':case 'sandrock':case 'darkrock':case 'frostrock':{const c=PX.hash(a>>1,b>>1,seed),k=PX.hash(a>>2,(b+1)>>2,seed+1);return tone(mat,L+(c<.18?1:0)+(k>.86?1:0)-(c>.94&&L>0?1:0))}
      case 'plank':return tone(mat,L+((a%3)===2?1:0)+(h<.1?1:0));
      case 'daub':case 'whitewash':return tone(mat,L+(h<.07?1:0));
      default:return tone(mat,L);
    }
  }
  // fill the quad O, O+E, O+E+U, O+U with a material; (a, b) measured in pixels along E and U
  function face(P,O,E,U,mat,lit,seed,o){
    const el=Math.hypot(E[0],E[1])||1,ul=Math.hypot(U[0],U[1])||1,det=E[0]*U[1]-E[1]*U[0];
    P.poly([O,[O[0]+E[0],O[1]+E[1]],[O[0]+E[0]+U[0],O[1]+E[1]+U[1]],[O[0]+U[0],O[1]+U[1]]],(x,y)=>{
      const dx=x+.5-O[0],dy=y+.5-O[1],a=(dx*U[1]-dy*U[0])/det,b=(E[0]*dy-E[1]*dx)/det;
      return (o&&o.col)?o.col(a*el,b*ul):tex(mat,Math.floor(a*el),Math.floor(b*ul),lit,seed,o)});
  }
  function tri(P,A,B,C,mat,lit,seed){P.poly([A,B,C],(x,y)=>tex(mat,x,y,lit,seed))}

  /* the cell: what a picture's drawn pixels fill, the crop to its cell (outlined), and its ground shadow */
  // the box around everything drawn on a canvas
  function bounds(c){const w=c.width,h=c.height,a=c.getContext('2d', { willReadFrequently: true }).getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;
    for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(a[(j*w+i)*4+3]){if(i<x0)x0=i;if(i>x1)x1=i;if(j<y0)y0=j;if(j>y1)y1=j}return x1<0?{x0:0,x1:0,y0:0,y1:0}:{x0,x1,y0,y1}}
  // the fit x fit pixels of img from (cx, cy), outlined: the cell's picture (fit + 2 a side)
  const crop=(img,cx,cy,fit)=>PX.outline(PX.canvas(fit,fit,g=>g.drawImage(img,-cx,-cy)));
  // the ground shadow: down and to the right of the building's foot (its widest in the cell's bottom rows), kept inside the cell
  function cellShadow(out,N,depth){const od=out.getContext('2d', { willReadFrequently: true }).getImageData(0,0,N,N).data;let s0=N,s1=-1;for(let yy=N-5;yy<N-1;yy++)for(let i=0;i<N;i++)if(od[(yy*N+i)*4+3]){s0=Math.min(s0,i);s1=Math.max(s1,i)}
    const sd=Math.max(2,Math.round(depth));return PX.canvas(N,N,g=>{if(s1>=s0)PX.paint(g).poly([[s0+2,N+1],[s1+2,N+1],[s1+4,N-1],[s1+4,N-1-sd],[s1+1,N-2-sd],[s0+4,N-1]],'rgba(20,24,12,.28)')})}

  /* the pieces: their colours (data), then each drawn at a point of a wall (x, y its foot or top left, as each says) */
  const PIECE={
    frame:['timber',3],// the dark frame round a door or window
    knob:'#d8b048',// a door's latch
    glass:{lit:['#e8b860','#ffe0a0'],dark:['#2a3040','#4a5468']},// a window's pane and its glint, lit at night or dark
    shutter:['plank',1],
    hole:'#1e1a18',// an arrow slit, a dark opening
    chimney:'stone'
  };
  const door=(P,x,y,w,h,mat,arch)=>{mat=mat||'plank';const F=tone(...PIECE.frame);P.rect(F,x-1,y-h-1,w+2,h+1);P.rect(tone(mat,1),x,y-h,w,h);P.rect(tone(mat,0),x,y-h,1,h);if(w>2)P.rect(tone(mat,2),x+(w>>1),y-h+1,1,h-1);if(arch){P.px(F,x,y-h);P.px(F,x+w-1,y-h)}P.px(PIECE.knob,x+w-1,y-(h>>1)-1)};
  const win=(P,x,y,lit,shut)=>{const G=lit?PIECE.glass.lit:PIECE.glass.dark;P.rect(tone(...PIECE.frame),x-1,y-1,4,4);P.rect(G[0],x,y,2,2);P.px(G[1],x,y);if(shut){P.rect(tone(...PIECE.shutter),x-2,y,1,2);P.rect(tone(...PIECE.shutter),x+2,y,1,2)}};
  const slit=(P,x,y)=>{P.rect(PIECE.hole,x,y,1,3)};
  const chimney=(P,x,y,h)=>{const m=PIECE.chimney;P.rect(tone(m,1),x,y-h,3,h);P.rect(tone(m,0),x,y-h,1,h);P.rect(tone(m,3),x,y-h,3,1)};
  const barrel=(P,x,y)=>{P.rect(tone('plank',1),x,y-4,3,4);P.rect(tone('plank',0),x,y-4,1,4);P.rect(tone('iron',2),x,y-3,3,1);P.rect(tone('iron',2),x,y-1,3,1)};
  const crate=(P,x,y)=>{P.rect(tone('plank',1),x,y-3,4,3);P.rect(tone('plank',0),x,y-3,4,1);P.line(tone('plank',2),x,y-1,x+3,y-3)};
  const woodpile=(P,x,y)=>{for(let i=0;i<3;i++){P.rect(tone('log',1),x,y-2-i*2,5-i,2);P.px(tone('log',0),x+4-i,y-2-i*2)}};

  PX.kit={tone,LIGHT,tex,face,tri,bounds,crop,cellShadow,PIECE,door,win,slit,chimney,barrel,crate,woodpile};
})(window.PX=window.PX||{});
