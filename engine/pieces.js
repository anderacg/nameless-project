'use strict';
/* ---------- PX engine: piers, boats and a fire's flame ---------- */
// Needs pixel.js and buildkit.js (PX.kit's tones). Yard props and camps are models now (buildmodels.js: PX.objectModel,
// PX.clusterModel camp, hideout, travelers, their fire at marks.fire).
(function(PX){
  const Q={tone:PX.kit.tone};
  /* a pier: a plank deck on posts, run from a shore point out over the water */
  PX.pier=function(spec){
    const dir=spec.dir||'s',len=Math.max(8,spec.len|0),ver=dir==='n'||dir==='s',seed=spec.seed|0;let img,ox,oy;
    if(!ver){img=PX.canvas(len+1,11,g=>{const P=PX.paint(g);for(let x=0;x<len;x++){P.rect(Q.tone('plank',x%2?1:0),x,2,1,4);if(PX.hash(x,1,seed)<.12)P.px(Q.tone('plank',2),x,3)}
        P.rect(Q.tone('plank',2),0,6,len,2);for(let x=dir==='e'?3:1;x<len;x+=5)P.rect(Q.tone('log',2),x,8,1,3);P.rect(Q.tone('timber',1),dir==='e'?len-1:0,0,1,6)});
      ox=dir==='e'?0:len;oy=5}
    else{img=PX.canvas(9,len+3,g=>{const P=PX.paint(g);for(let y=0;y<len;y++){P.rect(Q.tone('plank',y%2?1:0),1,y,6,1);if(PX.hash(1,y,seed)<.12)P.px(Q.tone('plank',2),3,y)}
        P.rect(Q.tone('plank',2),7,0,1,len);for(let y=2;y<len;y+=5){P.px(Q.tone('log',2),0,y);P.px(Q.tone('log',2),8,y)}
        if(dir==='s'){P.rect(Q.tone('plank',2),1,len,6,2);P.rect(Q.tone('log',2),2,len+2,1,1);P.rect(Q.tone('log',2),5,len+2,1,1)}else P.rect(Q.tone('timber',1),1,0,6,1)});
      ox=4;oy=dir==='s'?0:len}
    return{img:PX.outline(img),ox:ox+1,oy:oy+1};
  };
  /* a boat at its moorings: a cog under sail or furled, or a rowing boat */
  PX.boat=function(spec){
    const d=PX.dice(PX.rng((spec.seed|0)*313+9)),big=spec.big!=null?spec.big:d.chance(.5),L=big?16:10,mast=big?13:0,c=spec.col||d.pick(['#a8483a','#4a6a9a','#c8a040','#5a7a3a']),furled=d.chance(.5),H=mast+10;
    const img=PX.canvas(L+6,H,g=>{const P=PX.paint(g),w=H-4;
      // the hull: rail, strakes, a narrower keel, the bow raised at the right
      P.rect(Q.tone('plank',0),1,w-3,L,1);P.rect(Q.tone('plank',1),1,w-2,L,1);P.rect(Q.tone('plank',2),2,w-1,L-2,1);P.rect(Q.tone('timber',2),3,w,L-4,1);P.rect(Q.tone('plank',1),L,w-5,2,3);P.px(Q.tone('plank',0),L+1,w-6);P.rect(Q.tone('plank',1),0,w-4,2,2);
      if(big){const mx=1+(L>>1);P.rect(Q.tone('timber',1),mx,w-3-mast,1,mast);
        if(furled){P.rect(Q.tone('canvas',1),mx-4,w-mast+1,9,1);P.rect(Q.tone('canvas',0),mx-4,w-mast,9,1)}
        else{for(let j=0;j<7;j++)for(let i=-4;i<=4;i++)P.px(PX.shade(i<0?Q.tone('canvas',0):Q.tone('canvas',1),j===3?.9:1),mx+i+(j>2&&j<6?1:0),w-mast+j);P.rect(c,mx-4,w-mast+3,9,1)}
        P.rect(c,mx+1,w-mast-2,3,2)}
      else{P.line(Q.tone('timber',2),2,w-4,-1,w-1);P.line(Q.tone('timber',2),L-2,w-4,L+1,w-1)}});
    return{img:PX.outline(img),ax:1+((L+2)>>1),ay:H-4};
  };

  // a fire's flame, frame 0..3 (the game cycles them): orange tongues round a yellow heart. Returns {img, ax, ay}: (ax, ay) is
  // the middle of its foot
  const FLAME=[[3,6,5,3],[4,5,6,3],[3,7,5,4],[4,6,6,2]];
  PX.flame=function(f){f=((f|0)%4+4)%4;const c=PX.canvas(6,7,g=>{const P=PX.paint(g);
    FLAME[f].forEach((h,i)=>{P.rect('#e86a2a',1+i,7-h,1,h);if(i===1||i===2)P.rect('#ffc060',1+i,9-h,1,h-2)});P.px('#fff0b0',2+(f&1),6)});
    return{img:PX.outline(c),ax:4,ay:8}};

})(window.PX=window.PX||{});
