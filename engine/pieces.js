'use strict';
/* ---------- PX engine: small props, piers, boats and camps ---------- */
// Grid pieces, each exactly one cell. Needs pixel.js and buildings.js (for PX.part).
//   PX.prop({type, seed}) -> {img, w:8, h:8, ax:0, ay:8}: hay, barrels, crates, woodpile, sacks; half a tile
(function(PX){
  const T=16,Q=PX.part;
  /* props: half a tile, for yards and streets */
  const PROPS={
    hay(P,t){P.rect(t('thatch',1),0,2,6,4);P.rect(t('thatch',0),1,1,4,2);P.rect(t('thatch',2),0,5,6,1);P.px(t('thatch',3),2,3)},
    barrels(P,t){for(const [x,y] of [[0,2],[3,2],[1,0]]){P.rect(t('plank',1),x,y,3,4);P.rect(t('plank',0),x,y,1,4);P.rect(t('iron',2),x,y+1,3,1)}},
    crates(P,t){P.rect(t('plank',1),0,2,4,4);P.rect(t('plank',0),0,2,4,1);P.line(t('plank',2),0,5,3,2);P.rect(t('plank',1),3,0,3,3);P.rect(t('plank',0),3,0,3,1)},
    woodpile(P,t){for(let i=0;i<3;i++){P.rect(t('log',1),i,5-i*2,6-i*2,2);P.px(t('plank',0),5-i,5-i*2)}},
    sacks(P,t){P.rect('#c8b48a',0,2,3,4);P.rect('#b09a70',3,3,3,3);P.px('#8a7a5a',1,2);P.px('#8a7a5a',4,3)}
  };
  PX.PROP_TYPES=Object.keys(PROPS);
  PX.prop=function(spec){const c=PX.canvas(6,6,g=>PROPS[spec.type](PX.paint(g),Q.tone));return{img:PX.outline(c),w:8,h:8,ax:0,ay:8}};
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

  /* a camp laid out on the grid, one thing to a tile.
     bandit: 2 x 2 tiles: one or two tents at the back, the fire in front of them, crates or barrels;
     hideout: the same behind barricades of spiked logs (4 x 4 tiles, open at the front);
     travelers: 3 x 2 tiles: two tents at the back, the fire at the front middle, their wagon at the front right.
     The fire is a ring of stones round its logs; its flame is a sprite of its own (PX.flame), for the game to animate.
     Returns {img, w, h, ax, ay, flag, fire}: (ax, ay) is where the camp stands on the map, the bottom middle of its front left
     tile (bandit, hideout) or front middle tile (travelers); flag is the foot of its flag pole (the game flies the flag, if any),
     fire the foot of its flame. */
  PX.camp=function(spec){
    const kind=spec.kind||'bandit',sd=spec.seed|0,ring=kind==='hideout',trav=kind==='travelers',ox=ring?16:0,oy=ring?16:0,cw=trav?3:2,
      W=ring?64:cw*T,H=ring?64:2*T,cv=PX.canvas(W,H),g=cv.getContext('2d');
    const put=(c,r,b)=>{g.drawImage(b.shadow,ox+c*T,oy+(r+1)*T-b.ay);g.drawImage(b.img,ox+c*T,oy+(r+1)*T-b.ay)};
    if(ring){// barricades of spiked logs round the camp, the way in at the front middle left open
      const spikes=(x,y,across)=>{const c=PX.canvas(14,8,gg=>{const P=PX.paint(gg);P.rect(Q.tone('log',1),0,5,14,2);P.rect(Q.tone('log',0),0,5,14,1);
        for(let i=1;i<14;i+=4){P.line(Q.tone('timber',1),i,7,i+3,1);P.line(Q.tone('timber',2),i+3,7,i,1);P.px('#e8dcc0',i+3,1);P.px('#e8dcc0',i,1)}}),o=PX.outline(c);
        if(across)g.drawImage(o,x,y);else{const v=PX.canvas(10,16,gg=>{gg.translate(10,0);gg.rotate(Math.PI/2);gg.drawImage(o,0,0)});g.drawImage(v,x,y)}};
      for(const [x,y,a] of [[1,4,1],[17,2,1],[33,4,1],[49,2,1],[1,50,1],[49,50,1],[2,18,0],[52,18,0],[2,34,0],[52,34,0]])spikes(x,y,a)}
    const two=trav||PX.hash(sd,1,3)<.5,items=[[0,0,'tent']];if(two)items.push([cw-1,0,'tent']);if(trav)items.push([2,1,'wagon']);
    items.forEach(([c,r,type],i)=>put(c,r,PX.building({type,style:'human',seed:sd*9+i,view:type==='wagon'?'angled':undefined,facing:type==='wagon'?'right':undefined})));
    // the fire: a ring of stones round its logs (the flame is PX.flame), in the middle of the front row
    const fx=ox+(cw*T>>1),fy=oy+2*T-2,base=PX.outline(PX.canvas(8,3,gg=>{const P=PX.paint(gg);P.rect(Q.tone('stone',1),0,1,8,2);P.rect(Q.tone('stone',0),0,1,8,1);P.rect(Q.tone('log',1),2,0,4,2);P.px(Q.tone('log',0),2,0)}));
    g.drawImage(base,fx-5,fy-base.height+1);
    if(!trav){const pr=PX.prop({type:PX.hash(sd,2,3)<.5?'crates':'barrels'});g.drawImage(pr.img,two?ox+T+7:ox+T+4,two?oy+2*T-pr.ay:oy+T-pr.ay)}
    return{img:cv,w:W,h:H,ax:trav?T+T/2:ox+T/2,ay:oy+2*T,flag:[two&&!trav?ox+T:ox+T+T/2,oy+T-3],fire:[fx,fy-2]};
  };
  // a fire's flame, frame 0..3 (the game cycles them): orange tongues round a yellow heart. Returns {img, ax, ay}: (ax, ay) is
  // the middle of its foot
  const FLAME=[[3,6,5,3],[4,5,6,3],[3,7,5,4],[4,6,6,2]];
  PX.flame=function(f){f=((f|0)%4+4)%4;const c=PX.canvas(6,7,g=>{const P=PX.paint(g);
    FLAME[f].forEach((h,i)=>{P.rect('#e86a2a',1+i,7-h,1,h);if(i===1||i===2)P.rect('#ffc060',1+i,9-h,1,h-2)});P.px('#fff0b0',2+(f&1),6)});
    return{img:PX.outline(c),ax:4,ay:8}};

})(window.PX=window.PX||{});
