'use strict';
/* ---------- PX engine: medieval buildings ---------- */
// PX.building({type, style, seed, banner}) draws one building for a 16 px tile map and returns
//   {img, shadow, w, h, ax, ay, tiles:[across, deep]}
// img is outlined; shadow is drawn first, under it, without outline; (ax, ay) is the pixel of img (and shadow) that sits on
// the front-left corner of the building's tile footprint, so place it at tileX*16 - ax, (tileY+1)*16 - ay.
// One camera for everything: a box seen from the front, one side receding back at half depth. A building may face either
// way (its side wall on the right or on the left) and long ones may stand end-on (gable to the camera, 1x2 tiles); the light
// always comes from the upper left, so every surface is shaded by its role (LIGHT) whichever way the building turns.
// spec.facing ('right' | 'left') and spec.deep (true | false) pin the orientation; otherwise the seed picks.
// Variety comes from structure, not just colour: footprint, roof form (side gable, front gable, hip, shed, cone, battlements),
// storeys, wall and roof materials, and add-ons (chimney, dormer, sign, porch, barrels, woodpile, bell, sails, wheel...).
(function(PX){
  const T=16,M=PX.MAT;
  const tone=(mat,i)=>M[mat][Math.max(0,Math.min(M[mat].length-1,i))];
  // how lit each kind of surface is (0 lit .. 2 shade). A building facing left is drawn as if facing right and flipped,
  // so its shading is chosen for where each surface ends up: the side wall then faces the sun, the front a little less.
  const LIGHT={right:{front:0,side:1,slopeF:0,slopeL:0,slopeR:2,flip:false},left:{front:1,side:0,slopeF:0,slopeL:2,slopeR:0,flip:true}};
  let LT=LIGHT.right;
  // natural rock (no masonry): grey, desert sandstone, dark swamp rock, frost rock
  if(!M.rock)Object.assign(M,{rock:['#a8a49a','#8a867c','#6c6962','#4c4a44'],sandrock:['#d8b07a','#bf9262','#9a7048','#6a4a2e'],darkrock:['#7e7e6c','#626254','#4a4a40','#34342c'],frostrock:['#b8c0cc','#98a0ac','#78808c','#575d68']});
  if(!M.autumn)M.autumn=['#e8b84a','#d08e34','#aa6a28','#7a4a20'];if(!M.evergreen)M.evergreen=['#4f8a52','#3a7044','#2c5836','#1f4228'];

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

  /* the box: front wall, right side wall, optional timber frame */
  function box(P,b){
    const {x,y,W,D,H,wall,seed}=b,dx=D/2;
    face(P,[x,y],[W,0],[0,-H],wall,LT.front,seed);// the front
    face(P,[x+W,y],[dx,-dx],[0,-H],wall,LT.side,seed+3);// the side
    // a stone footing under timber, daub and plank walls; a plain base line under stone
    if(['daub','whitewash','plank','log','hide'].includes(wall)&&H>4){P.rect(tone('stone',LT.front+1),x,y-2,W,2);P.rect(tone('stone',LT.front),x,y-2,W,1);P.poly([[x+W,y],[x+W+dx,y-dx],[x+W+dx,y-dx-2],[x+W,y-2]],tone('stone',LT.side+1))}
    else{P.rect(tone(wall,2),x,y-1,W,1);P.line(tone(wall,3),x+W,y-1,x+W+dx,y-1-dx)}
    if(b.frame){const t=b.frame;P.rect(tone(t,0),x,y-H,1,H);P.rect(tone(t,1),x+W-1,y-H,1,H);if(W>8)P.rect(tone(t,1),x+(W>>1),y-H,1,H);
      if(H>7)P.rect(tone(t,1),x,y-(H>>1)-1,W,1);
      if(b.braces&&W>8){const h2=H>7?(H>>1):H;P.line(tone(t,1),x+1,y-1,x+Math.min(4,(W>>1)-1),y-h2)}
      P.line(tone(t,2),x+W+1,y-H,x+W+dx,y-H-dx+1);}
  }
  /* roofs over a box; return the screen point of the ridge's top for chimneys and banners */
  function roof(P,b){
    const {x,y,W,D,H,R,mat,seed}=b,dx=D/2,top=y-H,oh=1;// oh: eave overhang
    const kind=b.roof;
    if(kind==='side'){// ridge along the front; we see the front slope and the gable end
      const rl=[x+dx/2-oh,top-R-dx/2],rr=[x+W+dx/2+oh,top-R-dx/2],O=[x-oh,top+oh],E=[W+2*oh,0],U=[rl[0]-(x-oh),rl[1]-(top+oh)];
      tri(P,[x+W,top],[x+W+dx,top-dx],[x+W+dx/2,top-R-dx/2],b.gable||b.wall,LT.side,seed+5);// gable end
      P.line(tone('timber',2),x+W,top,rr[0],rr[1]);P.line(tone('timber',2),rr[0],rr[1],x+W+dx,top-dx);// its barge boards
      P.rect(tone(b.wall,3),x,top+1,W,1);// the eave's shadow on the wall
      face(P,O,E,U,mat,LT.slopeF,seed);// front slope
      details(P,b,O,E,U,mat);
      ridgeCap(P,mat,rl[0]+1,rl[1],rr[0]-1);
      eaveLip(P,mat,x-oh,top+oh,W+2*oh);
      return[x+W/2+dx/2,top-R-dx/2]}
    if(kind==='front'){// ridge runs back; the gable faces us
      const ap=[x+W/2,top-R],bp=[ap[0]+dx,ap[1]-dx];
      face(P,[x-oh,top],[ap[0]-(x-oh),ap[1]-top],[dx,-dx],mat,LT.slopeL,seed);// left slope
      face(P,[ap[0],ap[1]],[x+W+oh-ap[0],top-ap[1]],[dx,-dx],mat,LT.slopeR,seed+1);// right slope
      details(P,b,[ap[0],ap[1]],[x+W+oh-ap[0],top-ap[1]],[dx,-dx],mat,true);
      tri(P,[x,top],[x+W,top],ap,b.gable||b.wall,LT.front,seed+5);// the gable
      // a king post and a vent in a timbered gable
      if(b.frame&&R>4){P.rect(tone(b.frame,1),Math.round(ap[0]),Math.round(ap[1])+2,1,R-2);P.rect('#2a2420',Math.round(ap[0])-1,Math.round(ap[1])+R-3,1,1)}
      P.line(tone(mat,0),ap[0],ap[1],bp[0],bp[1]);P.line(tone(mat,1),ap[0],ap[1]-1,bp[0],bp[1]-1);// the ridge and its cap
      P.line(tone('timber',2),x-oh,top,ap[0],ap[1]);P.line(tone('timber',2),ap[0],ap[1],x+W+oh,top);// barge boards
      P.rect(tone('timber',1),Math.round(ap[0]),Math.round(ap[1])-2,1,2);// a finial
      return bp}
    if(kind==='hip'){// four slopes to a short ridge
      const c=[x+W/2+dx/2,top-R-dx/2];
      face(P,[x-oh,top+oh],[W+2*oh,0],[c[0]-(x-oh)-W/4,c[1]-(top+oh)],mat,LT.slopeF,seed);
      P.poly([[x+W+oh,top+oh],[x+W+dx+oh,top-dx],[c[0]+W/4,c[1]],[c[0]-W/4+W/2,c[1]]],(px,py)=>tex(mat,px,py,LT.slopeR,seed+1));
      P.line(tone(mat,0),c[0]-W/4,c[1],c[0]+W/4,c[1]);P.rect(tone(b.wall,3),x,top+1,W,1);eaveLip(P,mat,x-oh,top+oh,W+2*oh);return c}
    if(kind==='shed'){// one slope, high at the back
      P.poly([[x+W,top],[x+W+dx,top-dx],[x+W+dx,top-dx-R]],(px,py)=>tex(b.wall,px,py,LT.side,seed+5));// the high side wall
      face(P,[x-oh,top+oh],[W+2*oh,0],[dx,-dx-R],mat,LT.slopeF,seed);P.rect(tone(b.wall,3),x,top+1,W,1);
      eaveLip(P,mat,x-oh,top+oh,W+2*oh);return[x+W/2+dx/2,top-dx-R]}
    if(kind==='flat'){// battlements: a walkway top and merlons along the front and right edges
      const st=b.wall;face(P,[x,top],[W,0],[dx,-dx],st,0,seed+9,{col:(a,bb)=>tone(st,(bb|0)%3===0?1:0)});
      for(let i=0;i<W;i+=3)P.rect(tone(st,0),x+i,top-2,2,2);for(let i=1;i<dx;i+=2)P.rect(tone(st,1),x+W+i,top-i-2,1,2);
      return[x+W/2+dx/2,top-dx/2]}
    return[x+W/2,top];
  }
  // the eave: a thick lip (thatch thickest), a lit top edge, rounded thatch corners
  function eaveLip(P,mat,x,y,w){
    if(mat==='thatch'||mat==='turf'||mat==='leaf'){P.rect(tone(mat,2),x,y,w,1);P.rect(tone(mat,3),x,y+1,w,1);P.clear(x,y+1);P.clear(x+w-1,y+1);for(let i=x+1;i<x+w-1;i+=2)P.px(tone(mat,1),i,y)}
    else{P.rect(tone(mat,3),x,y,w,1);P.rect(tone('timber',2),x,y+1,w,1)}
  }
  // the ridge: tiles or a bound ridge of straw along its top
  function ridgeCap(P,mat,x0,y,x1){
    if(mat==='thatch'){P.line(tone(mat,2),x0,y,x1,y);for(let x=Math.round(x0);x<=x1;x+=3)P.px(tone(mat,0),x,y-1)}
    else if(mat==='turf'||mat==='leaf'){P.line(tone(mat,0),x0,y,x1,y);for(let x=Math.round(x0)+1;x<=x1;x+=4)P.px(tone(mat,1),x,y-1)}
    else{P.line(tone(mat,0),x0,y,x1,y);for(let x=Math.round(x0);x<=x1;x+=3)P.px(tone(mat,1),x,y-1)}
  }
  // weather and dormers on a roof slope: moss and worn patches, and little gabled windows on long roofs
  function details(P,b,O,E,U,mat,side){
    const el=Math.hypot(E[0],E[1]),ul=Math.hypot(U[0],U[1]),at=(a,bb)=>[Math.round(O[0]+E[0]*a/el+U[0]*bb/ul),Math.round(O[1]+E[1]*a/el+U[1]*bb/ul)],r=PX.rng(b.seed*13+7);
    const clumps=mat==='slate'||mat==='terracotta'||mat==='leaf'?1:2,mo=PX.mix(tone(mat,1),'#5a7a32',.5),md=PX.mix(tone(mat,2),'#4a6a2a',.5);
    for(let i=0;i<clumps;i++){if(r()<.35)continue;const [px,py]=at(2+r()*(el-5),.5+r()*ul*.35);P.px(mo,px,py);P.px(mo,px+1,py);if(r()<.6)P.px(md,px+1,py+1);if(r()<.4)P.px(mo,px-1,py+1)}
    if(mat!=='turf'&&mat!=='leaf'&&r()<.5){const [px,py]=at(2+r()*(el-4),1+r()*(ul-3));P.px(tone(mat,3),px,py)}
    if(b.dormers&&!side)for(let k=0;k<b.dormers;k++){const [px,py]=at(el*(k+1)/(b.dormers+1)-2,ul*.35);
      P.rect(tone(b.wall,LT.front),px,py-3,4,3);P.rect(tone('timber',3),px+1,py-2,2,2);
      P.poly([[px-1,py-3],[px+5,py-3],[px+2,py-6]],(qx,qy)=>tex(mat,qx,qy,LT.slopeF,b.seed+3));P.line(tone('timber',2),px-1,py-3,px+2,py-6);P.line(tone('timber',2),px+2,py-6,px+5,py-3)}
  }
  // a round tower or turret: a shaded cylinder, then a cone roof or battlements
  function round(P,x,y,W,H,wall,rm,R,seed){
    for(let i=0;i<W;i++){const k=LT.flip?W-1-i:i,t=k<W*.25?0:k<W*.7?1:k<W*.88?2:3;for(let j=0;j<H;j++)P.px(tex(wall,i,j,Math.min(2,t),seed),x+i,y-H+j)}
    P.rect(tone(wall,3),x,y-1,W,1);
    if(rm){const ap=[x+W/2,y-H-R];for(let j=0;j<R+1;j++){const w=Math.max(1,Math.round((W+2)*(j+1)/(R+1))),x0=Math.round(ap[0]-w/2);for(let i=0;i<w;i++){const k=LT.flip?w-1-i:i;P.px(tex(rm,i,j,k<w*.4?0:k<w*.75?1:2,seed+2),x0+i,ap[1]+j)}}eaveLip(P,rm,Math.round(ap[0]-(W+2)/2),y-H,W+2);return ap}
    for(let i=0;i<W;i+=3)P.rect(tone(wall,0),x+i,y-H-2,2,2);P.rect(tone(wall,1),x,y-H,W,1);return[x+W/2,y-H-2];
  }

  // a rocky hump on the ground: shaded across (lit on the left), darker at its foot, a snowy crown in the frost
  function mound(P,x,y,W,H,mat,seed,snow){
    const cx=x+W/2;for(let j=0;j<H;j++){const f=(j+1)/H,hw=Math.max(1,W/2*Math.sqrt(1-(1-f)*(1-f))+PX.hash(j,0,seed)*1.2-.6),x0=Math.round(cx-hw),x1=Math.round(cx+hw);
      for(let i=x0;i<x1;i++){const u=(i-x0)/Math.max(1,x1-x0),k=LT.flip?1-u:u,lit=k<.38?0:k<.78?1:2;let c=tex(mat,i,j,Math.min(2,lit+(j>=H-2?1:0)),seed);
        if(snow&&j<H*.4-PX.hash(i,1,seed)*2.5)c=lit>1?'#c8d4e2':lit?'#e4ecf4':'#f8fbfd';P.px(c,i,y-H+j)}}
  }
  /* openings and add-ons */
  const door=(P,x,y,w,h,mat,arch)=>{mat=mat||'plank';P.rect(tone('timber',3),x-1,y-h-1,w+2,h+1);P.rect(tone(mat,1),x,y-h,w,h);P.rect(tone(mat,0),x,y-h,1,h);if(w>2)P.rect(tone(mat,2),x+(w>>1),y-h+1,1,h-1);if(arch){P.px(tone('timber',3),x,y-h);P.px(tone('timber',3),x+w-1,y-h)}P.px('#d8b048',x+w-1,y-(h>>1)-1)};
  const win=(P,x,y,lit,shut)=>{P.rect(tone('timber',3),x-1,y-1,4,4);P.rect(lit?'#e8b860':'#2a3040',x,y,2,2);P.px(lit?'#ffe0a0':'#4a5468',x,y);if(shut){P.rect(tone('plank',1),x-2,y,1,2);P.rect(tone('plank',1),x+2,y,1,2)}};
  const slit=(P,x,y)=>{P.rect('#1e1a18',x,y,1,3)};
  const chimney=(P,x,y,h,smoke)=>{P.rect(tone('stone',1),x,y-h,3,h);P.rect(tone('stone',0),x,y-h,1,h);P.rect(tone('stone',3),x,y-h,3,1);if(smoke){P.rect('rgba(220,220,220,.0)',0,0,0,0)}};
  const barrel=(P,x,y)=>{P.rect(tone('plank',1),x,y-4,3,4);P.rect(tone('plank',0),x,y-4,1,4);P.rect(tone('iron',2),x,y-3,3,1);P.rect(tone('iron',2),x,y-1,3,1)};
  const crate=(P,x,y)=>{P.rect(tone('plank',1),x,y-3,4,3);P.rect(tone('plank',0),x,y-3,4,1);P.line(tone('plank',2),x,y-1,x+3,y-3)};
  const woodpile=(P,x,y)=>{for(let i=0;i<3;i++){P.rect(tone('log',1),x,y-2-i*2,5-i,2);P.px(tone('log',0),x+4-i,y-2-i*2)}};
  // flags are not drawn into buildings: the game shows its own (animated) flag sprite. A building only notes where its flag
  // pole stands (the pole's foot), and PX.building returns it as `flag` in the cell's own pixels
  let FLAG=null;const banner=(P,x,y,c)=>{FLAG=[Math.round(x),Math.round(y)]};

  /* styles: which materials each people builds with, by kind of building */
  const STYLES={
    human:{wall:['daub','daub','daub','stone','log','whitewash'],frame:'timber',roof:['thatch','thatch','shingle','terracotta','slate'],rich:['terracotta','slate','shingle'],stone:'stone'},
    dwarf:{wall:['darkstone','stone','darkstone'],frame:null,roof:['slate','slate','turf'],rich:['slate'],stone:'darkstone'},
    elf:{wall:['plank','whitewash','plank'],frame:'log',roof:['leaf','leaf','thatch'],rich:['leaf','slate'],stone:'whitewash'},
    orc:{wall:['log','hide','log'],frame:null,roof:['hide','hide','thatch'],rich:['hide'],stone:'stone'}
  };

  /* the building types: each picks its footprint, form and add-ons from the seed */
  // Every type fills a square cell: 1x1 tile (16 px), 2x2 tiles (32 px) or 4x4 tiles (64 px). Its picture, roof, chimney and
  // banner included, fits inside the cell, and its footprint on the map is the same square. Sizes below are first guesses the
  // fit step (PX.building) trims until the building fits.
  const ORC=s=>s===STYLES.orc;
  const TYPES={
    // houses and small buildings: 1x1
    cottage(d,s){const front=d.chance(.45);return{porch:d.chance(.3),tiles:[1,1],W:d.int(8,9),D:d.int(4,6),H:d.int(4,5),R:front?d.int(3,5):d.int(3,4),roof:front?'front':'side',wall:d.pick(s.wall),roofMat:d.pick(s.roof),chimney:d.chance(.55),add:d.pick(['','barrel','woodpile','','crate'])}},
    townhouse(d,s){return{tiles:[1,1],W:d.int(8,9),D:d.int(4,5),H:d.int(7,8),R:d.int(3,4),roof:'front',wall:s===STYLES.human?'daub':d.pick(s.wall),roofMat:d.pick(s.rich),chimney:d.chance(.5),storeys:2,jetty:s===STYLES.human}},
    fisherhut(d,s){return{tiles:[1,1],W:d.int(8,9),D:d.int(4,5),H:4,R:3,roof:'side',wall:'plank',roofMat:d.pick(['thatch','shingle']),add:'nets'}},
    chapel(d,s){return{tiles:[1,1],W:d.int(8,9),D:d.int(4,5),H:d.int(4,5),R:d.int(3,4),roof:'front',wall:s.stone,roofMat:d.pick(['slate','shingle','thatch']),bellcote:true,arch:true}},
    stall(d,s){return{tiles:[1,1],stall:true,W:d.int(8,10),D:d.int(4,5),H:3,R:3,ch:8,canopy:d.pick(['slope','slope','peak']),goods:d.pick(['produce','cloth','pots','meat','fish']),side:d.pick(['basket','crates','sacks','']),cloth:d.pick([['#d8cca8','#a8483a'],['#d8cca8','#4a6a9a'],['#d8cca8','#5a7a3a'],['#e4d8b8','#8a5a3a'],['#d8cca8','#a07a2a']])}},
    tower(d,s){return{tiles:[1,1],round:true,W:d.int(7,8),H:d.int(6,7),R:d.int(4,5),wall:ORC(s)?'log':s.stone,roofMat:d.chance(.6)?d.pick(s.rich):null,slits:true,banner:d.chance(.4)}},
    yurt(d,s){return{tiles:[1,1],yurt:true,W:d.int(10,12),H:d.int(4,5),R:d.int(5,6),wall:'hide',roofMat:'hide',tusks:d.chance(.5)}},
    // halls, trades and great houses: 2x2
    longhouse(d,s){return{deepable:true,annex:d.chance(.35),dormers:d.chance(.3)?1:0,tiles:[1,1],W:d.int(11,12),D:d.int(5,6),H:4,R:d.int(4,5),roof:'side',wall:d.pick(s.wall==STYLES.human.wall?['log','daub','stone']:s.wall),roofMat:d.pick(['thatch','turf',...s.roof]),chimney:d.chance(.7),windows:2,add:d.pick(['woodpile','barrel',''])}},
    tavern(d,s){return{wing:d.chance(.5),dormers:d.chance(.5)?1:0,tiles:[1,1],W:d.int(11,12),D:d.int(5,6),H:d.int(6,7),R:d.int(3,4),roof:'side',wall:s===STYLES.human?'daub':d.pick(s.wall),roofMat:d.pick(s.rich),chimney:true,storeys:2,windows:3,sign:'mug',add:'barrels'}},
    smithy(d,s){return{tiles:[1,1],W:d.int(10,11),D:6,H:5,R:3,roof:'shed',wall:ORC(s)?'log':s.stone,roofMat:d.pick(['shingle','slate',...s.roof]),chimney:true,forge:true,add:'anvil'}},
    church(d,s){return{tiles:[1,1],W:d.int(9,10),D:6,H:d.int(5,6),R:4,roof:'front',wall:s.stone,roofMat:d.pick(['slate','shingle']),tower:true,towerH:3,arch:true,rose:true}},
    barn(d,s){return{deepable:true,annex:d.chance(.4),tiles:[1,1],W:d.int(10,11),D:d.int(6,7),H:5,R:d.int(4,5),roof:'front',wall:'plank',roofMat:d.pick(['thatch','shingle']),barnDoor:true,add:'hay'}},
    granary(d,s){return{tiles:[1,1],round:true,W:d.int(8,9),H:6,R:d.int(4,5),wall:ORC(s)?'log':s.stone,roofMat:d.pick(['thatch','thatch','shingle'])}},
    windmill(d,s){return{tiles:[1,1],round:true,sail:6,W:d.int(6,7),H:d.int(8,9),R:4,wall:d.pick(['stone','plank','whitewash']),roofMat:d.pick(['thatch','shingle']),sails:true}},
    watermill(d,s){return{tiles:[1,1],W:d.int(9,10),D:6,H:5,R:4,roof:'side',wall:'stone',roofMat:d.pick(['thatch','shingle']),wheel:true,wr:3}},
    warehouse(d,s){return{deepable:true,annex:d.chance(.3),dormers:d.chance(.4)?1:0,tiles:[1,1],W:d.int(11,12),D:d.int(6,7),H:5,R:4,roof:'side',wall:'plank',roofMat:d.pick(['shingle','slate']),bigDoor:true,add:'crates'}},
    gatehouse(d,s){return{tiles:[2,2],front:'gate',coneFront:!(s===STYLES.dwarf)&&d.chance(.7),lift:d.int(0,2),castle:true,W:d.int(16,18),D:d.int(8,10),H:d.int(14,16),R:4,wall:ORC(s)?'log':s.stone,roofMat:d.pick(s.rich),turrets:2,coneTurrets:d.chance(.4),gate:true,gw:6,gh:9}},
    hidehall(d,s){return{deepable:true,tiles:[1,1],W:d.int(11,12),D:d.int(6,7),H:4,R:d.int(5,6),roof:'side',wall:'log',roofMat:'hide',tusks:true,add:'totem'}},
    watchtower(d,s){return{tiles:[2,2],W:d.int(10,11),D:8,H:d.int(15,17),R:d.int(6,7),roof:'front',wall:'log',roofMat:'hide',stilts:true}},
    treehouse(d,s){return{tiles:[2,2],tree:true,W:d.int(8,10),D:5,H:5,R:d.int(4,5),trunk:d.int(12,15),tw:d.int(4,6),spread:16,leafR:7,leaf:d.pick(['leaf','leaf','leaf','autumn','evergreen']),side:d.pick([-1,0,1]),roof:d.pick(['front','side']),wall:d.pick(['plank','whitewash']),roofMat:d.pick(['leaf','leaf','thatch']),ladder:d.pick(['rope','steps','none']),second:d.chance(.35),lanterns:d.chance(.6),blobs:d.int(4,6)}},
    elfhall(d,s){return{deepable:true,wing:d.chance(.35),tiles:[1,1],W:d.int(11,12),D:d.int(6,7),H:5,R:d.int(4,5),roof:'side',wall:d.pick(['plank','whitewash']),frame:'log',roofMat:'leaf',lanterns:true}},
    spire(d,s){return{tiles:[2,2],round:true,W:d.int(8,10),H:d.int(18,20),R:d.int(8,9),wall:'whitewash',roofMat:'leaf'}},
    stonehall(d,s){return{deepable:true,annex:d.chance(.3),tiles:[1,1],W:d.int(11,12),D:d.int(6,7),H:5,R:4,roof:'side',wall:'darkstone',roofMat:d.pick(['slate','turf']),runeDoor:true,chimney:true}},
    forge(d,s){return{tiles:[1,1],W:d.int(10,11),D:d.int(6,7),H:5,R:3,roof:'hip',wall:'darkstone',roofMat:'slate',forge:true,chimney:true,bigChimney:true}},
    // the centre of a castle and of a town: 4x4
    keep(d,s){return{tiles:[4,4],front:'keep',backTowers:d.chance(.75),donjonRound:d.chance(.6),hallHip:d.chance(.6),coneFront:!(s===STYLES.dwarf)&&d.chance(.7),lift:d.int(0,2),castle:true,W:d.int(36,40),D:d.int(24,28),H:d.int(24,28),R:d.int(8,10),wall:ORC(s)?'log':s.stone,roofMat:d.pick(s.rich),turrets:d.chance(.3)?2:3,coneTurrets:ORC(s)||d.chance(.6),gate:true,banner:true,pitch:d.chance(.4),tw:11,tR:9,tH:9,par:4,gw:10,gh:12}},
    citadel(d,s){return{tiles:[4,4],front:'citadel',backTowers:d.chance(.8),hallHip:d.chance(.5),coneFront:!(s===STYLES.dwarf)&&d.chance(.6),lift:d.int(0,2),castle:true,W:d.int(38,42),D:d.int(22,26),H:d.int(15,17),R:d.int(8,10),wall:ORC(s)?'log':s.stone,roofMat:d.pick(s.rich),turrets:3,coneTurrets:ORC(s)||d.chance(.7),gate:true,banner:true,donjon:d.int(15,18),tw:9,tR:8,tH:7,par:3,gw:9,gh:10}},
    // yards, work places, camps and wild places
    well(d,s){return{tiles:[1,1],well:true,W:7,H:3,wall:s.stone,roofMat:d.pick(s.roof),pad:2}},
    tent(d,s){return{tiles:[1,1],tent:true,W:d.int(9,11),D:d.int(6,8),H:d.int(6,7),cloth:d.pick(['#d8ccaa','#b8a07a','#a8483a','#7a6a4a','#8a8a5a','#5a6a8a'])}},
    wagon(d,s){return{tiles:[1,1],wagon:true,W:d.int(10,12),D:4,H:4,R:5,cloth:d.pick(['#e4dcc4','#d8c8a0','#c8b890']),load:d.pick(['','crates','barrels'])}},
    ruins(d,s){return{tiles:[1,1],ruin:true,W:d.int(10,12),D:d.int(5,6),H:d.int(7,10),wall:s.stone,arch:d.chance(.6),ivy:d.chance(.6),pad:4}},
    shrine(d,s){return{tiles:[1,1],shrine:d.pick(['stones','obelisk','stones']),W:11,H:d.int(9,11),wall:'stone',pad:2}},
    minehead(d,s){return{tiles:[1,1],topOnly:true,mound:'mine',W:2*d.int(6,7),D:d.int(6,7),H:d.int(5,6),cart:d.chance(.8),spoil:d.chance(.7),hood:d.chance(.5),ore:d.pick(['#9aa3ad','#c8a060','#7a7a84'])}},
    cave(d,s){return{tiles:[1,1],topOnly:true,mound:'cave',W:2*d.int(6,7),D:d.int(6,8),H:d.int(6,7),rocks:d.int(3,6),bones:d.chance(.4),twin:d.chance(.3)}},
    lumbershed(d,s){return{tiles:[1,1],topOnly:true,shed:true,W:2*d.int(6,7),D:d.int(3,4),H:5,R:2,wall:'plank',roofMat:d.pick(['shingle','thatch','plank']),logs:d.int(3,4),stump:true,pile:d.chance(.7)}},
    crane(d,s){return{tiles:[1,1],topOnly:true,crane:true,W:10,D:1,H:d.int(12,13),jib:d.pick([-1,1]),jibLen:6,wr:3,blocks:d.int(2,4)}}
  };
  // a better version of the same building at a higher level (spec.lv 2 or 3): a richer roof, a chimney, more windows and a porch,
  // then a second storey, dormers and lanterns; work places gain their gear. The fit step keeps it inside its cell.
  function upgrade(b,lv,s){
    if(b.mound==='mine'){b.hood=true;b.cart=true;if(lv>=3)b.spoil=true;return}
    if(b.shed){b.logs=(b.logs||2)+lv-1;if(lv>=3)b.pile=true;return}
    if(b.crane){b.blocks=(b.blocks||2)+lv-1;return}
    if(b.stall){if(lv>=3)b.canopy='peak';return}
    if(b.tent||b.wagon||b.well||b.shrine||b.ruin||b.mound||b.tree||b.front)return;
    if(b.roofMat&&s.rich&&!['leaf','hide'].includes(b.roofMat))b.roofMat=s.rich[(b.W||0)%s.rich.length];
    if(b.round){if(lv>=3){b.H+=2;b.banner=true}return}
    if(b.yurt){b.H+=1;b.tusks=true;return}
    b.chimney=true;b.windows=(b.windows||1)+1;if(b.tiles[0]===1)b.porch=true;
    if(lv>=3){if(!b.storeys){b.storeys=2;b.H+=2}b.dormers=1;b.lanterns=true}
  }
  // the parts, for generators that build from them (settlements.js); they draw lit from the upper left
  PX.part={tex:(...a)=>tex(...a),face:(...a)=>face(...a),box:(...a)=>box(...a),roof:(...a)=>roof(...a),round:(...a)=>round(...a),tone:(...a)=>tone(...a),banner:(...a)=>banner(...a),barrel:(...a)=>barrel(...a),crate:(...a)=>crate(...a)};
  // sites: the places on the map that nobody builds. A cave, ruins and a shrine are drawn like buildings (one tile); a bandit
  // hideout and a travellers' camp are camps (PX.camp, in pieces.js), returned with camp: true. PX.site draws every site;
  // PX.building draws none of them. PX.SITE_TYPES are the game's site types, the same names.
  const SITES=['cave','ruins','shrine'],CAMPS=['hideout','travelers'],ALL=Object.keys(TYPES);
  PX.SITE_TYPES=SITES.concat(CAMPS);PX.BUILDING_TYPES=ALL.filter(k=>!SITES.includes(k)).concat('village');
  PX.building=spec=>{if(PX.SITE_TYPES.includes(spec.type))throw new Error(spec.type+' is a site: draw it with PX.site');return spec.type==='village'?village(spec):make(spec)};
  PX.site=spec=>{if(CAMPS.includes(spec.type))return Object.assign(PX.camp({kind:spec.type,seed:spec.seed,banner:spec.banner}),{camp:true});
    if(!SITES.includes(spec.type))throw new Error(spec.type+' is not a site');return make(spec)};

  function make(spec){
    const style=STYLES[spec.style]||STYLES.human,d=PX.dice(PX.rng((spec.seed|0)*7919+ALL.indexOf(spec.type)*131+3)),b=TYPES[spec.type](d,style),seed=spec.seed|0;
    if(spec.mat&&(b.mound||b.ruin||b.shrine||b.well))b.wall=spec.mat;b.snow=!!spec.snow;
    // a village's hall (spec.big): the same hall, broader, at the back of a 2 x 2 cell (2: near its whole width; 1: room for a palisade)
    if(spec.big){b.tiles=[2,2];b.W=Math.round(b.W*(spec.big===2?1.7:1.45));b.R=(b.R||4)+1;b.deepable=false;b.annex=false;b.wing=false}
    if(spec.lv>1)upgrade(b,spec.lv|0,style);
    // a holding's hall (spec.fort is given): it flies the flag; fortified, a palisade stands round it, its gate on the middle
    if(spec.fort!=null&&!b.front&&b.roof){b.banner=true;if(spec.fort){b.fence=spec.fort;if(b.D)b.D=Math.min(b.D,10)}}
    if(spec.stilts&&b.roof&&!b.castle&&!b.stall&&!b.tree&&!b.shed&&!b.wagon)b.stilts=true;
    if(b.frame===undefined)b.frame=(b.wall==='daub'||b.wall==='whitewash')&&style.frame?style.frame:null;
    // end-on: the long building turned so its gable faces the camera and its long side runs back over two tiles
    if(b.deepable&&(spec.deep!=null?spec.deep:d.chance(.4))){b.deepEnd=true;b.D=b.W;b.W=b.tiles[0]>1?d.int(12,15):d.int(7,8);b.roof='front';b.sideWin=true;b.annex=false;b.dormers=0;b.wing=false;b.windows=0}
    b.seed=seed;
    FLAG=null;
    if(b.front){// the straight view: symmetric, never mirrored, drawn straight into its cell (the outline then fills the cell's edge)
      const N=b.tiles[0]*T;LT=LIGHT.right;
      const c=PX.canvas(N-2,N-2,g=>{g.translate(-1,-1);frontCastle(PX.paint(g),b,N,seed,spec)}),m=bounds(c),out=PX.outline(c);
      const clipped=false;// laid out to fit its cell
      return{img:out,shadow:PX.canvas(N,N),w:N,h:N,ax:0,ay:N,cell:N,tiles:b.tiles,type:spec.type,facing:'front',deep:false,clipped,gateX:N/2,flag:FLAG};
    }
    // the view: angled (the side wall showing on the right or, mirrored, the left) or top-down (straight on, seen from above, its
    // door on the cell's middle column). spec.view ('top' | 'angled') or spec.facing ('front' | 'left' | 'right') picks it; else the seed
    const canTop=!!(b.roof||b.round||b.yurt||b.tent||b.well||b.stall||b.wagon||b.shrine||b.ruin||b.topOnly);
    const top=b.topOnly||canTop&&(spec.view?spec.view==='top':spec.facing?spec.facing==='front':d.chance(.4));
    if(top){b.annex=false;b.wing=false;b.add='';b.side='';b.load='';b.stump=false;
      // from above the whole depth shows: keep it under half the cell, and make an end-on hall broad, so it reads as a gabled hall
      const Nc=b.tiles[0]*T;if(b.D)b.D=Math.min(b.D,Math.round(Nc*.42));if(b.deepEnd)b.W=Math.max(b.W,Math.round(Nc*.6));if(b.W&1)b.W--}
    const flip=!top&&(spec.facing?spec.facing==='left':d.chance(.5));
    // fit: draw on a roomy canvas and measure it; while it is wider or taller than its cell, leave things off or make it smaller;
    // then crop to exactly its square cell (n tiles of 16 px a side), its foot on the cell's bottom row
    const N=b.tiles[0]*T,fit=N-2,depth=()=>b.round||b.yurt?0:b.tree?4:(b.D||0)/2;let img,GW,GH,y,m,tries=0;
    for(;;){const dx=depth(),up=(b.H||0)+(b.R||0)+dx+(b.tower?(b.towerH||12)+8:0)+(b.chimney?6:0)+(b.sails?(b.sail||8):0)+(b.tree?(b.trunk||14)+20:0)+(b.dormers?4:0)+(b.stilts?6:0)+(b.well?11:0)+(b.wagon?4:0)+(b.donjon||0)+(b.tH||7)+(top?(b.D||8)+(b.round?b.W:0):0)+16;
      GW=N+96;GH=Math.ceil(up)+48;y=GH-10;const x=Math.round(GW/2-((b.W||8)+dx)/2);LT=flip?LIGHT.left:LIGHT.right;
      // (GH is whole, so the ground line and every anchor land on the pixel grid)
      FLAG=null;img=PX.canvas(GW,GH,g=>(top?drawTop:draw)(PX.paint(g),b,top?Math.round(GW/2-b.W/2):x,y,seed,spec,PX.dice(PX.rng(seed*31+7))));
      if(flip){const src=img;img=PX.canvas(GW,GH,g=>{g.scale(-1,1);g.drawImage(src,-GW,0)})}
      // a top-down building keeps its middle line on the cell's middle: it must fit either side of it
      m=bounds(img);const cxT=GW/2+1-N/2,wide=top?(m.x0<cxT||m.x1>cxT+fit-1):m.x1-m.x0+1>fit,tall=m.y1-m.y0+1>fit;if((!wide&&!tall)||++tries>60)break;
      if(!(tall?(top?shrinkTop(b):shrinkH(b))||shrink(b):shrink(b)||shrinkH(b)))break;if(top&&b.W&1)b.W--}
    LT=LIGHT.right;
    const cw=m.x1-m.x0+1,ch=m.y1-m.y0+1,cx=top?GW/2+1-N/2:m.x0-Math.floor((fit-cw)/2),cy=m.y1-fit+1;
    const clipped=(top?(m.x0<cx||m.x1>cx+fit-1):cw>fit)||ch>fit||m.x0<=0||m.x1>=GW-1||m.y0<=0||m.y1>=GH-1;
    const out=PX.outline(PX.canvas(fit,fit,g=>g.drawImage(img,-cx,-cy)));
    // the ground shadow: down and to the right of the building's foot, kept inside the cell
    const od=out.getContext('2d').getImageData(0,0,N,N).data;let s0=N,s1=-1;for(let yy=N-5;yy<N-1;yy++)for(let i=0;i<N;i++)if(od[(yy*N+i)*4+3]){s0=Math.min(s0,i);s1=Math.max(s1,i)}
    const sd=Math.max(2,Math.round(depth())),shadow=PX.canvas(N,N,g=>{if(s1>=s0)PX.paint(g).poly([[s0+2,N+1],[s1+2,N+1],[s1+4,N-1],[s1+4,N-1-sd],[s1+1,N-2-sd],[s0+4,N-1]],'rgba(20,24,12,.28)')});
    return{img:out,shadow,w:N,h:N,ax:0,ay:N,cell:N,tiles:b.tiles,type:spec.type,facing:top?'front':flip?'left':'right',view:top?'top':'angled',deep:!!b.deepEnd,clipped,gateX:top?N/2:null,
      flag:FLAG&&b.banner?[(flip?GW-1-FLAG[0]:FLAG[0])-cx+1,FLAG[1]-cy+1]:null};
  }


  // a village's centre (2 x 2 tiles), seen from above: its people's hall at the back, the green in front of it with the well and
  // what the village keeps by the door (hay, barrels, sacks, a woodpile). Fortified (spec.fort 1+), a palisade of stakes rings the
  // green, its gate on the middle at the front. The hall flies the flag.
  const HALL={human:'longhouse',dwarf:'stonehall',elf:'elfhall',orc:'hidehall'},GOODS={human:['hay','barrels'],dwarf:['barrels','crates'],elf:['sacks','crates'],orc:['woodpile','hay']};
  PX.VILLAGE_HALL=HALL;
  function village(spec){
    const N=2*T,st=HALL[spec.style]?spec.style:'human',fort=(spec.fort|0)>0,seed=spec.seed|0;
    const hall=make({...spec,type:HALL[st],view:'top',fort:0,big:fort?1:2}),hb=bounds(hall.img),lift=Math.max(0,hb.y0-(fort?2:1));// pushed back to the top of the cell (over the palisade's back row)
    // the well: a ring of stones round dark water, seen from above
    const sm=STYLES[st].stone||'stone',well=PX.outline(PX.canvas(7,6,g=>{const P=PX.paint(g);P.rect(tone(sm,1),1,0,5,6);P.rect(tone(sm,1),0,1,7,4);P.rect(tone(sm,0),1,0,5,1);P.rect(tone(sm,2),1,5,5,1);P.rect('#24323e',2,1,3,3);P.px('#5a7a90',2,1)}));
    const pr=PX.prop({type:GOODS[st][seed%2]}),hy=hb.y1-lift,dirt={grass:'#7c6c46',frost:'#b0aa9e',desert:'#c4a66e',swamp:'#544c34'}[spec.env]||'#7c6c46';
    // the palisade: stakes along the back (behind the hall), down both sides and along the front either side of the gate
    const fence=front=>PX.outline(PX.canvas(N-2,N-2,g=>{const P=PX.paint(g),M=N-2,stake=(x,yb)=>{P.rect(tone('log',x%2?2:0),x,yb-3,1,4);if(x%2===0)P.px(tone('log',0),x,yb-4)};
      if(!front){for(let x=1;x<M-1;x++)stake(x,5);return}
      for(let y=6;y<M-1;y++){P.rect(tone('log',y%2?1:0),0,y-1,2,1);P.rect(tone('log',y%2?1:0),M-2,y-1,2,1)}
      for(let x=1;x<M-1;x++)if(Math.abs(x+.5-M/2)>4)stake(x,M-1);P.rect(tone('log',0),M/2-5,M-6,1,6);P.rect(tone('log',0),M/2+4,M-6,1,6)}));
    const img=PX.canvas(N,N,g=>{const P=PX.paint(g);
      // the trodden path from the hall's door down the green (out through the gate)
      P.rect(dirt,N/2-2,hy-1,4,N-hy+1);
      if(fort)g.drawImage(fence(false),1,1);
      g.drawImage(hall.img,0,-lift);
      // the well on the green left of the path, the goods right of it
      const gy=N-(fort?6:3),wy=Math.max(hy+2,gy-6);g.drawImage(well,fort?6:4,wy);g.drawImage(pr.img,N-(fort?12:10),Math.max(hy+2,gy-pr.h+1));
      if(fort)g.drawImage(fence(true),1,1)});
    const shadow=PX.canvas(N,N,g=>g.drawImage(hall.shadow,0,-lift));
    return{img,shadow,w:N,h:N,ax:0,ay:N,cell:N,tiles:[2,2],type:'village',facing:'front',view:'top',deep:false,clipped:hall.clipped||hb.y0<lift,gateX:N/2,
      flag:hall.flag?[hall.flag[0],hall.flag[1]-lift]:null};
  }

  // the box around everything drawn on a canvas
  function bounds(c){const w=c.width,h=c.height,a=c.getContext('2d').getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;
    for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(a[(j*w+i)*4+3]){if(i<x0)x0=i;if(i>x1)x1=i;if(j<y0)y0=j;if(j>y1)y1=j}return x1<0?{x0:0,x1:0,y0:0,y1:0}:{x0,x1,y0,y1}}
  // one step smaller: leave off what stands beside it first, then pull in canopies, jibs and sails, then the depth, then the width
  const DROP=['add','side','load','annex','cart','stump','sign','second','porch','bones','wing','blocks','spoil','pile'];
  function shrink(b){
    for(const k of DROP)if(b[k]){b[k]=typeof b[k]==='string'?'':typeof b[k]==='number'?0:false;return true}
    if(b.spread>0){b.spread=Math.max(0,b.spread-2);return true}
    if(b.leafR>3){b.leafR--;return true}
    if(b.jibLen>4){b.jibLen--;return true}
    if(b.sail>4){b.sail--;return true}
    if(b.D>4&&(!b.W||b.D>=b.W-4)){b.D--;return true}
    if(b.W>5){b.W--;return true}
    if(b.D>4){b.D--;return true}
    return false;
  }
  const DROP_H=['dormers','bellcote','chimney','second','turret','lanterns'];
  function shrinkH(b){
    for(const k of DROP_H)if(b[k]){b[k]=typeof b[k]==='number'?0:false;return true}
    if(b.towerH>2){b.towerH--;return true}
    if(b.donjon>8){b.donjon--;return true}
    if(b.trunk>8){b.trunk--;return true}
    if(b.sail>5){b.sail--;return true}
    if(b.R>2&&b.R>=(b.H||0)*.7){b.R--;return true}
    if(b.H>3){b.H--;return true}
    if(b.R>2){b.R--;return true}
    if(b.D>4){b.D--;return true}
    return false;
  }
  /* the top-down castle: straight on and symmetric about the middle column, but seen from above, as in a top-down game.
     Ground points (x, g) at height z show at (x, g - z): the ground plan reads as a plan (the courtyard, the walls' walkways,
     the towers' round tops, the roofs) and only the faces turned toward the viewer show, short, below their tops.
     Things are drawn back to front. The gate stands on the middle column, so a road meets it. Light from the upper left. */
  function frontCastle(P,b,N,seed,spec){
    const st=b.wall;let rm=b.roofMat;const cone=b.coneFront,v=b.lift|0,M=N-1;// M: mirror (x -> M - x)
    const lit=(u)=>u<.3?0:u<.72?1:2;
    // the top of something at height z over the ground rows g0..g1, columns x0..x1
    const top=(x0,x1,g0,g1,z,mat,l)=>{for(let g=g0;g<=g1;g++)for(let x=x0;x<=x1;x++){const h=PX.hash(x,g,seed+1);P.px(mat==='log'?tone('log',(x%3===0)?2:(g+x)%2):h<.12?tone(mat,l+1):tone(mat,l),x,g-z)}};
    // the face turned toward the viewer: on ground row g, columns x0..x1, from the ground up to z
    const face=(x0,x1,g,z,mat,l)=>{for(let y=g-z;y<=g;y++)for(let x=x0;x<=x1;x++)P.px(mat==='log'?tone('log',x%2?2:1):tex(mat,x,y,l,seed+3),x,y);P.rect(tone(mat,3),x0,g,x1-x0+1,1)};
    // a box: its top (lit, seen from above) and its front face (in the half light)
    const box3=(x0,x1,g0,g1,z,mat)=>{top(x0,x1,g0,g1,z,mat,0);face(x0,x1,g1,z,mat,1);P.rect(tone(mat,0),x0,g1-z,x1-x0+1,1)};
    // merlons along an edge of a walkway at height z: small blocks, their tops lit, their faces in shade
    const merlonsX=(x0,x1,g,z,mat)=>{mat=mat||st;for(let x=x0;x<=x1;x++){if(mat==='log'){if(x%2===0)P.px(tone('log',0),x,g-z-1);continue}if(((x<N/2?x:M-x)+16)%3<2){P.px(tone(mat,0),x,g-z-2);P.px(tone(mat,3),x,g-z-1)}}};
    const merlonsY=(x,g0,g1,z,mat)=>{mat=mat||st;for(let g=g0;g<=g1;g++)if(g%3<2){P.px(tone(mat,0),x,g-z-1);P.px(tone(mat,3),x,g-z)}};
    // a round tower standing on the ground circle (cx, cg) of radius r, z high: its body's front, then its top (a cone or battlements)
    const tower=(cx,cg,r,z,rh,mat)=>{const st0=st,st1=mat||st;
      for(let x=Math.ceil(cx-r);x<=Math.floor(cx+r);x++){const dx=x-cx,hw=Math.sqrt(Math.max(0,r*r-dx*dx)),u=(dx+r)/(2*r),l=lit(u);
        for(let y=Math.round(cg-z);y<=Math.round(cg+hw);y++)P.px(x===Math.floor(cx+r)?tone(st1,3):st1==='log'?tone('log',l+(x%2)):tex(st1,x,y,l,seed+5),x,y)}
      for(let j=Math.round(cg-z)+3;j<cg-2;j+=5)P.rect('#1e1a18',Math.round(cx),j,1,2);
      const tg=cg-z;// the tower's top, a disc
      if(rh>0){// a cone: its base the disc, its point rh above the middle
        for(let y=Math.round(tg-rh);y<=Math.round(tg+r);y++)for(let x=Math.ceil(cx-r-1);x<=Math.floor(cx+r+1);x++){const dx=x-cx,dy=y-tg,inDisc=dy>=0&&dx*dx+dy*dy<=(r+.6)*(r+.6),inCone=y<=tg&&Math.abs(dx)<=(r+.6)*(1-(tg-y)/rh);
          if(!inDisc&&!inCone)continue;P.px(tex(rm,x,y,dx<-r*.2?0:dx<r*.45?1:2,seed+2),x,y)}
        for(let x=Math.ceil(cx-r);x<=Math.floor(cx+r);x++){const dx=x-cx;P.px(tone(rm,3),x,Math.round(tg+Math.sqrt(Math.max(0,r*r-dx*dx)))+1)}
        return[Math.round(cx),Math.round(tg-rh)]}
      for(let y=Math.round(tg-r);y<=Math.round(tg+r);y++)for(let x=Math.ceil(cx-r);x<=Math.floor(cx+r);x++){const dx=x-cx,dy=y-tg,d2=dx*dx+dy*dy;if(d2>r*r)continue;P.px(d2>(r-1.5)*(r-1.5)?((Math.round(Math.atan2(dy,dx)*4)%2)?tone(st1,0):tone(st1,2)):tone(st1,1),x,y)}
      return[Math.round(cx),Math.round(tg-r)]};
    // a hipped roof over the footprint x0..x1, g0..g1 at height z, its ridge rh higher: the back slope, the hips, the front slope
    const hip=(x0,x1,g0,g1,z,rh)=>{const dg=g1-g0,ins=Math.round(dg/2),rg=(g0+g1)/2,ry=Math.round(rg-z-rh),fy=g1-z+1,by=g0-z-1,xa=x0-1,xb=x1+1;
      P.poly([[xa,by],[xb+1,by],[xb+1-ins,ry],[xa+ins,ry]],(x,y)=>tex(rm,x,y,1,seed+4));
      P.poly([[xa,by],[xa+ins,ry],[xa,fy]],(x,y)=>tex(rm,x,y,0,seed+4));P.poly([[xb+1,by],[xb+1,fy],[xb+1-ins,ry]],(x,y)=>tex(rm,x,y,2,seed+4));
      P.poly([[xa,fy+1],[xa+ins,ry],[xb+1-ins,ry],[xb+1,fy+1]],(x,y)=>tex(rm,x,y,0,seed+4));
      P.line(tone(rm,0),xa+ins,ry,xb-ins,ry);P.rect(tone(rm,3),xa,fy,xb-xa+1,1)};
    // the gate: an arch on the middle column in a face whose foot is on ground row g: wooden doors, iron bands, a stone arch
    const gate=(g,w,h,mat)=>{const st=mat||st0g;const x0=Math.round(N/2-w/2);P.rect(tone(st,3),x0-1,g-h-1,w+2,h+1);P.rect(tone('plank',1),x0,g-h,w,h);P.rect(tone('plank',2),N/2,g-h,1,h);
      P.rect(tone('iron',2),x0,g-h+2,w,1);P.rect(tone('iron',2),x0,g-3,w,1);P.px(tone(st,3),x0,g-h);P.px(tone(st,3),x0+w-1,g-h);P.rect(tone(st,0),x0-1,g-h-2,w+2,1)};
    const windows=(x0,x1,y,step)=>{for(let x=x0;x<=x1-1;x+=step){P.rect('#1e1a18',x,y,2,2);P.px('#e8b860',x,y)}};
    const ban=(at)=>banner(P,at[0],at[1]);const st0g=st;
    const yard=(x0,x1,g0,g1)=>{for(let g=g0;g<=g1;g++)for(let x=x0;x<=x1;x++){const h=PX.hash(x,g,seed+9);P.px(h<.08?tone(st,2):h<.6?PX.mix(tone(st,1),'#8a7a5a',.55):PX.mix(tone(st,2),'#7a6a48',.5),x,g)}};
    if(b.front==='gate'){// a gatehouse: two round towers and the gate block between them
      const WH=11;box3(10,M-10,12,21,WH,st);merlonsX(10,M-10,12,WH);face(10,M-10,21,WH,st,1);
      tower(7.5,20,5,13,cone?9:0);tower(M-7.5,20,5,13,cone?9:0);gate(21,6,7);return}
    // the curtain: outer edge X0..M-X0 across, G0..G1 deep; walls WT thick, WH high
    // the walls are the fortification (spec.fort): 0 none, 1 a palisade with wooden towers, 2 stone walls, 3 great walls
    const F=spec.fort!=null?spec.fort:b.front==='keep'?3:2,ws=F===1?'log':st,wr=F===1?'hide':rm;
    const X0=7,G0=22,G1=55,WT=F===1?3:4,WH=F===3?8:6+(v>1?1:0),c=b.front==='citadel';
    if(F)yard(X0+WT,M-X0-WT,G0+WT,G1-WT);// unwalled, the keep stands on the holding's own ground
    // the back wall (its top, its inner face toward us, merlons on its outer edge)
    if(F){box3(X0,M-X0,G0,G0+WT-1,WH,ws);merlonsX(X0,M-X0,G0,WH,ws);
    // the back towers
    const tr=5;tower(X0+2.5,G0+2,tr,WH+6,cone||F===1?10:0,ws);tower(M-X0-2.5,G0+2,tr,WH+6,cone||F===1?10:0,ws)}
    // inside: the keep, or the citadel's tall donjon with a hall to each side
    if(!c){
      if(b.donjonRound){const t=tower(N/2-.5,G0+5,4,14,10);ban(t)}
      const k0=19,kg0=G0+6,kg1=G0+15,kz=10+v;top(k0,M-k0,kg0,kg1,kz,st,0);face(k0,M-k0,kg1,kz,st,1);hip(k0,M-k0,kg0,kg1,kz,b.hallHip?5:3);
      windows(k0+3,M-k0-3,kg1-kz+3,5);P.rect(tone(st,3),N/2-2,kg1-5,4,5);P.rect(tone('plank',1),N/2-1,kg1-4,2,4);if(!b.donjonRound)ban([N/2,Math.round((kg0+kg1)/2-kz-(b.hallHip?5:3))])}// the flag on the keep's ridge
    else{
      for(const [x0,x1] of [[12,21],[M-21,M-12]]){const hg0=G0+9,hg1=G0+16;top(x0,x1,hg0,hg1,7,st,0);face(x0,x1,hg1,7,st,1);hip(x0,x1,hg0,hg1,7,3);windows(x0+2,x1-2,hg1-5,4)}
      const d0=25,dg0=G0+5,dg1=G0+14,dz=15+v;box3(d0,M-d0,dg0,dg1,dz,st);if(b.hallHip)hip(d0,M-d0,dg0,dg1,dz,6);else{merlonsX(d0,M-d0,dg0,dz);merlonsX(d0,M-d0,dg1,dz)}
      windows(d0+3,M-d0-3,dg1-dz+3,5);windows(d0+3,M-d0-3,dg1-dz+9,5);ban([N/2,Math.round((dg0+dg1)/2-dz-(b.hallHip?6:0))])}// on the donjon's ridge, or the middle of its battlements
    // the side walls: walkways seen from above, merlons on their outer edges, a shadow along their inner feet
    if(!F){// no walls: the keep stands on its open yard, a little gate-arch on the middle where its path begins
      P.rect(tone('timber',1),N/2-5,G1-6,1,6);P.rect(tone('timber',1),N/2+4,G1-6,1,6);P.rect(tone('log',1),N/2-6,G1-7,12,1);return}
    top(X0,X0+WT-1,G0+WT,G1-WT,WH,ws,0);top(M-X0-WT+1,M-X0,G0+WT,G1-WT,WH,ws,0);if(ws!=='log'){merlonsY(X0,G0+WT,G1-WT,WH,ws);merlonsY(M-X0,G0+WT,G1-WT,WH,ws)}
    P.rect(tone(ws,3),X0+WT,G0+WT,1,G1-G0-2*WT);P.rect(tone(ws,3),M-X0-WT,G0+WT-WH,1,G1-G0-2*WT+WH);
    // great walls: a tower halfway along each side
    if(F===3){tower(X0+2.5,(G0+G1)/2+2,4,WH+4,cone?7:0,ws);tower(M-X0-2.5,(G0+G1)/2+2,4,WH+4,cone?7:0,ws)}
    // the front wall: its top and its outer face, merlons along its front edge
    box3(X0,M-X0,G1-WT+1,G1,WH,ws);merlonsX(X0,M-X0,G1,WH,ws);
    // the front towers, square with battlements on a citadel, round otherwise
    const fr=5;tower(X0+2.5,G1-1,fr,WH+5,(cone||F===1)&&!c?9:0,ws);tower(M-X0-2.5,G1-1,fr,WH+5,(cone||F===1)&&!c?9:0,ws);
    // the gatehouse, standing forward of the wall on the middle column
    const gx0=N/2-7,gx1=N/2+6,gg0=G1-3,gg1=G1+4,gz=WH+4;box3(gx0,gx1,gg0,gg1,gz,ws);
    if(cone||F===1){const r0=rm;rm=wr;hip(gx0,gx1,gg0,gg1,gz,3);rm=r0}else{merlonsX(gx0,gx1,gg0,gz,ws);merlonsX(gx0,gx1,gg1,gz,ws)}
    P.rect(tone(ws,0),gx0,gg1-gz,1,gz);P.rect(tone(ws,2),gx1,gg1-gz,1,gz);gate(gg1,6,7,ws);
  }
  /* the top-down view of an ordinary building: straight on, seen from above. A ground point (x, g) at height z shows at
     (x, g - z), so the roof shows mostly from above and the front wall short beneath it. The footprint is W wide and D deep,
     its front on ground row y-1; its middle line (between two pixels) is the cell's middle, where the door stands. */
  function drawTop(P,b,x,y,seed,spec,d){
    const W=b.W,D=Math.max(3,b.D||Math.round(W*.6)),H=b.H||4,R=b.R||0,wl=b.wall||'plank',rm=b.roofMat||'thatch',C=x+W/2;
    let g1=y-1;if(b.stilts){for(const px of [x,x+W-1,x+2,x+W-3])P.rect(tone('log',2),px,g1-4,1,5);g1-=5}
    const x0=x,x1=x+W-1,g0=g1-D+1,fe=g1-H;// fe: the row of the front eave (the wall's top)
    const lit=u=>u<.3?0:u<.72?1:2;
    // the front face: wall, a stone footing under timber and daub, the timber frame
    const face=()=>{for(let r=fe+1;r<=g1;r++)for(let px=x0;px<=x1;px++)P.px(tex(wl,px,r,1,seed+3),px,r);
      if(['daub','whitewash','plank','log','hide'].includes(wl)&&H>4){P.rect(tone('stone',2),x0,g1-1,W,2);P.rect(tone('stone',1),x0,g1-1,W,1)}else P.rect(tone(wl,3),x0,g1,W,1);
      if(b.frame){const t=b.frame;P.rect(tone(t,1),x0,fe+1,1,H);P.rect(tone(t,1),x1,fe+1,1,H);if(W>=12){P.rect(tone(t,1),Math.floor(C)-4,fe+1,1,H);P.rect(tone(t,1),Math.ceil(C)+3,fe+1,1,H)}if(H>7)P.rect(tone(t,1),x0,fe+1+(H>>1),W,1)}
      if(b.storeys===2&&b.jetty)P.rect(tone('timber',2),x0-1,fe+1+(H>>1),W+2,1)};
    // the roofs, seen from above
    // a side-gabled roof as top-down games draw it: the back slope (in shade) over the upper part, the ridge, then the front slope
    const sideGable=()=>{const be=g0-1-H-Math.round(R/2),ry=be+Math.max(2,Math.round((fe+1-be)*.38));
      for(let r=be;r<ry;r++)for(let px=x0-1;px<=x1+1;px++)P.px(tex(rm,px,r-be,2,seed+1),px,r);
      for(let r=ry;r<=fe+1;r++)for(let px=x0-1;px<=x1+1;px++)P.px(tex(rm,px,r-ry,0,seed),px,r);
      ridgeCap(P,rm,x0-1,ry,x1+1);P.line(tone('timber',2),x0-1,be,x0-1,fe+1);P.line(tone('timber',3),x1+1,be,x1+1,fe+1);eaveLip(P,rm,x0-1,fe+1,W+2);return[C,ry]};
    const frontGable=()=>{const be=g0-1-H,ap=fe+1-R,cl=Math.floor(C),cr=Math.ceil(C);
      P.poly([[x0-1,be],[cl,be-R],[cl,ap],[x0-1,fe+2]],(px,py)=>tex(rm,px,py,0,seed));P.poly([[cr,be-R],[x1+2,be],[x1+2,fe+2],[cr,ap]],(px,py)=>tex(rm,px,py,2,seed+1));
      P.line(tone(rm,0),cl,be-R,cl,ap);P.line(tone(rm,1),cr-1,be-R,cr-1,ap);
      // the gable wall above the face, its barge boards, a finial; a king post in a timbered gable
      P.poly([[x0,fe+1],[x1+1,fe+1],[C,ap]],(px,py)=>tex(wl,px,py,1,seed+5));P.line(tone('timber',2),x0-1,fe+1,cl,ap-1);P.line(tone('timber',2),cr-1,ap-1,x1+1,fe+1);
      if(b.frame&&R>4)P.rect(tone(b.frame,1),cl,ap+2,1,R-2);P.rect(tone('timber',1),cl,ap-2,1,2);return[C,ap-2]};
    const hipRoof=()=>{const ins=Math.round(D/2),ry=Math.round((g0+g1)/2-H-R),be=g0-1-H,ff=fe+2,xa=x0-1,xb=x1+2;
      P.poly([[xa,be],[xb,be],[xb-ins,ry],[xa+ins,ry]],(px,py)=>tex(rm,px,py,1,seed+4));P.poly([[xa,be],[xa+ins,ry],[xa,ff]],(px,py)=>tex(rm,px,py,0,seed+4));P.poly([[xb,be],[xb,ff],[xb-ins,ry]],(px,py)=>tex(rm,px,py,2,seed+4));
      P.poly([[xa,ff],[xa+ins,ry],[xb-ins,ry],[xb,ff]],(px,py)=>tex(rm,px,py,0,seed+4));P.line(tone(rm,0),xa+ins,ry,xb-ins-1,ry);eaveLip(P,rm,x0-1,fe+1,W+2);return[C,ry]};
    const shedRoof=()=>{const be=g0-1-H-R;for(let r=be;r<=fe+1;r++)for(let px=x0-1;px<=x1+1;px++)P.px(tex(rm,px,r-be,0,seed),px,r);eaveLip(P,rm,x0-1,fe+1,W+2);return[C,be]};
    // a round building: a shaded drum, a cone or battlements on its round top
    const drum=(cx,r,z,rh,mat,roof)=>{const cg=g1-r;
      for(let px=Math.ceil(cx-r);px<=Math.floor(cx+r);px++){const dx=px-cx,hw=Math.sqrt(Math.max(0,r*r-dx*dx)),l=lit((dx+r)/(2*r));for(let py=Math.round(cg-z);py<=Math.round(cg+hw);py++)P.px(px===Math.floor(cx+r)?tone(mat,3):tex(mat,px,py,l,seed+5),px,py)}
      const tg=cg-z;
      if(roof&&rh>0){for(let py=Math.round(tg-rh);py<=Math.round(tg+r);py++)for(let px=Math.ceil(cx-r-1);px<=Math.floor(cx+r+1);px++){const dx=px-cx,dy=py-tg,inD=dy>=0&&dx*dx+dy*dy<=(r+.6)*(r+.6),inC=py<=tg&&Math.abs(dx)<=(r+.6)*(1-(tg-py)/rh);if(inD||inC)P.px(tex(roof,px,py,dx<-r*.2?0:dx<r*.45?1:2,seed+2),px,py)}
        for(let px=Math.ceil(cx-r);px<=Math.floor(cx+r);px++){const dx=px-cx;P.px(tone(roof,3),px,Math.round(tg+Math.sqrt(Math.max(0,r*r-dx*dx)))+1)}return[Math.round(cx),Math.round(tg-rh)-1]}
      for(let py=Math.round(tg-r);py<=Math.round(tg+r);py++)for(let px=Math.ceil(cx-r);px<=Math.floor(cx+r);px++){const dx=px-cx,dy=py-tg,d2=dx*dx+dy*dy;if(d2>r*r)continue;P.px(d2>(r-1.5)*(r-1.5)?((Math.round(Math.atan2(dy,dx)*4)%2)?tone(mat,0):tone(mat,2)):tone(mat,1),px,py)}
      return[Math.round(cx),Math.round(tg-r)]};
    const doorC=(w,h,mat,arch)=>door(P,Math.round(C-w/2),g1+1,w,h,mat,arch);
    // round buildings: granary, windmill, tower, spire; the yurt
    if(b.round||b.yurt){const r=W/2-.5,rf=b.yurt?'hide':b.roofMat,ap=drum(C-.5,r,H,R,b.wall||'hide',rf);
      if(b.slits){P.rect('#1e1a18',Math.floor(C),g1-r-H+3,1,2)}
      if(spec.type==='granary'||b.yurt)P.rect('#2a1e14',Math.floor(C)-1,g1-4,2,4);
      if(b.sails){const c=[Math.floor(C),g1-r-H+2],L=b.sail||7;P.line(tone('plank',2),c[0]-L,c[1]-L,c[0]+L,c[1]+L);P.line(tone('plank',2),c[0]+L,c[1]-L,c[0]-L,c[1]+L);
        for(const [sx,sy] of [[-1,-1],[1,1],[1,-1],[-1,1]])for(let k=2;k<L;k++)P.px(tone('canvas',0),c[0]+sx*k+(sy>0?0:sx),c[1]+sy*k);P.rect(tone('timber',2),c[0]-1,c[1]-1,2,2);P.rect('#2a1e14',Math.floor(C)-1,g1-4,2,4)}
      if(b.tusks){P.px('#ece4d0',Math.floor(C-r),g1-r-H);P.px('#ece4d0',Math.ceil(C+r)-1,g1-r-H)}
      if(b.banner)banner(P,ap[0],ap[1],spec.banner);return}
    // a tree-house from above: the canopy a mirrored crown of leaf clumps, the trunk beneath it, the house on its platform in front
    if(b.tree){const lf=b.leaf,cl=Math.floor(C),r=PX.rng(seed*29+5),cg=g1-b.H-6,tw=2*Math.max(1,b.tw>>1);
      P.rect(tone('log',1),cl-(tw>>1),cg,tw,g1-cg+1);P.rect(tone('log',0),cl-(tw>>1),cg,1,g1-cg+1);P.rect(tone('log',2),cl-(tw>>1)-1,g1-1,tw+2,2);
      const blob=(bx,by,rx,ry)=>{for(let j=-ry;j<=ry;j++)for(let i=-rx;i<=rx;i++){const q=(i*i)/(rx*rx)+(j*j)/(ry*ry);if(q>1)continue;const l=(i+j)<-rx*.3?0:(i+j)<rx*.5?1:2;P.px(tex(lf,bx+i,by+j,l+(q>.75?1:0),seed),bx+i,by+j)}};
      const crown=Math.max(6,Math.min(13,b.leafR*2)),cy=cg-crown+1;blob(cl,cy,crown,Math.round(crown*.8));
      for(let k=0;k<3;k++){const ox=2+Math.round(r()*(crown-4)),oy=Math.round((r()-.6)*crown),rr=3+Math.round(r()*2);blob(cl-ox,cy+oy,rr,rr-1);blob(cl+ox-1,cy+oy,rr,rr-1)}
      // the platform and the little house on it, at the trunk's front
      const hw=Math.min(W,10),hx=cl-(hw>>1),pg=g1-b.H+1;P.rect(tone('plank',1),hx-2,pg,hw+4,2);P.rect(tone('plank',0),hx-2,pg,hw+4,1);
      const hz=4;for(let r2=pg-hz;r2<pg;r2++)P.rect(tex(b.wall,0,r2,1,seed),hx,r2,hw,1);P.poly([[hx-1,pg-hz],[hx+hw+1,pg-hz],[cl+1,pg-hz-4],[cl-1,pg-hz-4]],(px,py)=>tex(b.roofMat,px,py,px<cl?0:2,seed+1));
      P.rect(tone('timber',3),cl-1,pg-3,2,3);if(b.lanterns){P.px('#ffe090',hx-2,pg-1);P.px('#ffe090',hx+hw+1,pg-1)}
      if(b.ladder==='rope')for(let j=pg+2;j<g1;j+=2){P.px(tone('timber',1),cl-2,j);P.px(tone('timber',1),cl+1,j)}return}
    // a rocky outcrop from above, shaped by its climate: a cluster of boulders, each with a crown (lit toward the upper left,
    // grassy, snowy or mossy by climate) and a cracked face to the front; the biggest, in the middle, holds a cave's ragged mouth
    // or a mine's timbered adit on the middle line; rubble and stones at their feet
    if(b.mound){const env=spec.env||(spec.snow?'frost':'grass'),rk={grass:'rock',frost:'frostrock',desert:'sandrock',swamp:'darkrock'}[env]||'rock',rr=PX.rng(seed*13+5),cl=Math.floor(C),half=W/2;
      // one boulder: centre column bx, front ground row bg, half-width hw, depth dd, height z; a ragged outline from the seed
      const boulder=(bx,bg,hw,dd,z,sd)=>{const cols=[];for(let px=Math.round(bx-hw);px<=Math.round(bx+hw);px++){const u=(px+.5-bx)/hw;if(Math.abs(u)>1)continue;const k=Math.sqrt(1-u*u),n=PX.hash(px,sd,seed)-.5;
          cols.push([px,bg-Math.round((1-k)*2.5+Math.abs(n)),bg-Math.round(dd*k)+Math.round(n*2),Math.max(2,Math.round(z*(.55+.45*k)+n*2.4))])}
        for(const [px,fr,bk,zz] of cols)for(let gr=bk;gr<=fr;gr++){const l=(px-bx)<-hw*.25&&gr<(bk+fr)/2+1?0:1;let c=tex(rk,px,gr,l,seed+sd);
          if(gr===bk)c=tone(rk,0);
          if(env==='frost'&&PX.hash(px,gr,seed+3)<.85)c=PX.hash(px,gr,seed+4)<.25?'#d8e2ee':'#f2f6fa';
          if(env==='grass'&&PX.hash(px,gr,seed+5)<.2&&gr<bk+3)c=PX.hash(px,gr,seed+6)<.5?'#5a8a3a':'#78a848';
          if(env==='swamp'&&PX.hash(px,gr,seed+5)<.35)c=PX.hash(px,gr,seed+6)<.5?'#4a6a32':'#5e7e3a';
          P.px(c,px,gr-zz)}
        for(const [px,fr,bk,zz] of cols)for(let r=fr-zz+1;r<=fr;r++){const kk=r-(fr-zz);let c=tex(rk,px,r,px<bx-hw*.35?1:2,seed+sd+9);
          if(env==='desert'&&((kk+PX.hash(px>>2,sd,seed))%4===0))c=tone(rk,kk%8<4?0:3);
          if(PX.hash(px,sd,seed+11)<.14&&kk>1)c=tone(rk,3);if(env==='swamp'&&PX.hash(px,sd+1,seed+12)<.2&&kk<zz*.7)c='#3e5a2a';if(r===fr)c=tone(rk,3);P.px(c,px,r)}
        return cols};
      // the side boulders behind and beside it, then the great one in front
      const n=b.mound==='cave'?3+(b.twin?1:0):2;for(let k=0;k<n;k++){const side=k%2?1:-1,hw=3+Math.round(rr()*half*.25),bx=C+side*(half*.55+rr()*half*.25);if(bx-hw<x0||bx+hw>x1)continue;boulder(bx,g1-2-Math.round(rr()*3),hw,Math.round(hw*1.1),Math.round(H*(.45+rr()*.35)),k+1)}
      const big=boulder(C,g1,Math.round(half*.8),D,Math.round(H*.85),0),at=px=>big.find(c=>c[0]===px)||big[big.length>>1],fy=at(cl)[1],fz=at(cl)[3];
      if(b.mound==='cave'){// a ragged mouth, darkest deep inside; icicles over it in the frost; a puddle in the swamp; bones before it
        const mw=Math.max(6,Math.round(W*.3)),mh=Math.max(4,Math.min(fz+1,Math.round(H*.75)));
        for(let j=0;j<mh;j++){const t=j/mh,hw=Math.round(mw/2*Math.sqrt(1-Math.pow(1-t,2)))+(PX.hash(j,3,seed)<.4?1:0),ry=fy-mh+1+j;for(let px=cl-hw+1;px<=cl+hw;px++)P.px(Math.abs(px+.5-C)<hw*.5&&j>2?'#0a0806':'#1a140e',px,ry)}
        if(env==='frost')for(let px=cl-(mw>>1)+1;px<=cl+(mw>>1);px+=2)P.rect('#cfe6f4',px,fy-mh+1,1,1+(px%3===0?1:0));
        if(env==='swamp'){P.rect('#2e4a44',cl-4,fy+1,8,1);P.rect('#3e5e58',cl-3,fy+1,3,1)}
        if(b.bones){P.rect('#e8e4d0',cl+3,fy,2,1);P.px('#e8e4d0',cl-5,fy)}}
      else{// a mine: a timbered adit, a hood of planks over it, rails running out, a cart, a spoil heap
        const a=Math.max(3,Math.round(W/8)),ay=fy;P.rect('#140e0a',cl-a+1,ay-2*a+1,2*a,2*a);P.rect(tone('timber',1),cl-a,ay-2*a,1,2*a+1);P.rect(tone('timber',2),cl+a+1,ay-2*a,1,2*a+1);P.rect(tone('log',1),cl-a-1,ay-2*a-1,2*a+4,2);P.rect(tone('log',0),cl-a-1,ay-2*a-1,2*a+4,1);
        if(b.hood){P.rect(tone('plank',1),cl-a-2,ay-2*a-3,2*a+6,2);P.rect(tone('plank',0),cl-a-2,ay-2*a-3,2*a+6,1)}P.px('#ffd060',cl+a+2,ay-2*a+1);
        for(let r=ay+1;r<=g1+1;r++){P.px(tone('iron',1),cl-2,r);P.px(tone('iron',1),cl+1,r);if(r%2===0)P.rect(tone('plank',2),cl-2,r,4,1)}
        if(b.cart){const cy=g1;P.rect(tone('plank',2),cl-3,cy-2,6,3);P.rect(tone('plank',1),cl-3,cy-2,6,1);P.rect(b.ore,cl-2,cy-3,4,1);P.px(PX.shade(b.ore,1.3),cl-1,cy-3)}
        if(b.spoil){const sx=x1-6,sg=g1+1;for(let k=0;k<16;k++)P.px(k%3?tone(rk,2):tone(rk,1),sx+Math.round(rr()*5),sg-Math.round(rr()*3));P.rect(PX.shade(b.ore,.7),sx+1,sg-1,3,1)}}
      // rubble at the feet, to either side of the way in
      for(let k=0;k<(b.rocks||3);k++){const side=k%2?1:-1,bx=Math.round(C+side*(3+rr()*half*.8)),by=g1+1-Math.round(rr()*2);if(bx<x0||bx>x1-1||Math.abs(bx+.5-C)<4)continue;P.rect(tone(rk,1),bx,by-1,2,1);P.px(tone(rk,0),bx,by-1);P.rect(tone(rk,3),bx,by,2,1);if(env==='frost')P.px('#f2f6fa',bx,by-1)}
      return}
    // a lumber shed from above: a wide open shed roof on posts, logs stacked under it showing their ends, a chopping stump, a log pile
    if(b.shed){const sw=W-6,sx0=Math.round(C-sw/2),sx1=sx0+sw-1,top=g1-H;
      for(let k=0;k<b.logs;k++)for(let px=sx0+1;px<sx1-1;px+=3){const ly=g1-1-k*2;if(ly<top+2)break;P.rect(tone('log',1),px+(k%2),ly-1,3,2);P.px(tone('plank',0),px+1+(k%2),ly-1);P.px(tone('log',3),px+2+(k%2),ly)}
      const be=g1-D-H,ry=be+Math.max(2,Math.round((top+1-be)*.38));for(let r=be;r<ry;r++)for(let px=sx0-1;px<=sx1+1;px++)P.px(tex(rm,px,r-be,2,seed+1),px,r);
      for(let r=ry;r<=top;r++)for(let px=sx0-1;px<=sx1+1;px++)P.px(tex(rm,px,r-ry,0,seed),px,r);ridgeCap(P,rm,sx0-1,ry,sx1+1);eaveLip(P,rm,sx0-1,top,sw+2);
      for(const px of [sx0,sx1])P.rect(tone('timber',1),px,top+1,1,H);
      // the stump with its axe on one side, the pile of uncut logs on the other, chips on the ground
      const st=x0;P.rect(tone('log',2),st,g1-2,3,3);P.rect(tone('plank',0),st,g1-2,3,1);P.rect(tone('timber',2),st+1,g1-5,1,3);P.rect(tone('iron',1),st,g1-5,2,1);
      if(b.pile){const px=x1-2;for(let i=0;i<3;i++){P.rect(tone('log',1),px-i,g1-1-i*2,3,2);P.px(tone('plank',0),px-i,g1-1-i*2)}}
      for(let k=0;k<8;k++)P.px('#d8c08a',Math.round(sx0+PX.hash(k,1,seed)*sw),g1+1);return}
    // a treadwheel crane from above: a plank platform, the wheel standing at its front (you see through it), the A-frame, the jib
    // with its rope and block, cut stone stacked to either side
    if(b.crane&&b.tiles[0]===1){// a small crane: two posts under a beam, a jib reaching out with its rope and a stone, a little wheel at its foot
      const l0=x0+1,l1=x0+5,top=g1-H,ex=b.jib>0?x1:x0-1;P.rect(tone('timber',1),l0,top,1,H);P.rect(tone('timber',2),l1,top,1,H);P.rect(tone('timber',1),l0-1,top,l1-l0+3,1);
      P.line(tone('timber',1),b.jib>0?l1:l0,top,ex,top+2);P.line('#a89a78',ex,top+3,ex,g1-4);P.rect(tone('stone',1),ex-1,g1-4,3,3);P.rect(tone('stone',0),ex-1,g1-4,3,1);
      const wx=l0+2,wy=g1-3;for(let k=0;k<24;k++){const an=k*Math.PI/12;P.px(tone('plank',Math.cos(an)<0?0:2),Math.round(wx+Math.cos(an)*2.5),Math.round(wy+Math.sin(an)*2.5))}P.px(tone('iron',1),wx,wy);
      P.rect(tone('plank',2),x0,g1,W,1);return}
    if(b.crane){const cl=Math.floor(C),r=b.wr||6,top=g1-H,j=b.jib;
      for(let gr=g1-D;gr<=g1;gr++)for(let px=x0;px<=x1;px++)P.px(tone('plank',(px%3===0)?2:gr===g1?2:1),px,gr);
      P.line(tone('timber',1),cl-5,g1-D,cl,top);P.line(tone('timber',2),cl+6,g1-D,cl+1,top);
      const ex=cl+j*b.jibLen,ey=top+3;P.line(tone('timber',1),cl,top,ex,ey-3);P.line(tone('timber',2),cl,top+1,ex,ey-2);P.line('#a89a78',ex,ey-2,ex,ey+7);P.rect(tone('stone',1),ex-1,ey+7,3,3);P.px(tone('stone',0),ex-1,ey+7);
      const wy=g1-r-1;for(const an of [0,Math.PI/2])P.line(tone('plank',2),Math.round(cl+.5-Math.cos(an+.5)*r),Math.round(wy-Math.sin(an+.5)*r),Math.round(cl+.5+Math.cos(an+.5)*r),Math.round(wy+Math.sin(an+.5)*r));
      for(let k=0;k<96;k++){const an=k*Math.PI/48,c=Math.cos(an),t=tone('plank',c<-.3?0:c<.4?1:2);P.px(t,Math.round(cl+.5+c*r),Math.round(wy+Math.sin(an)*r));P.px(PX.shade(t,.8),Math.round(cl+.5+c*(r-1)),Math.round(wy+Math.sin(an)*(r-1)))}P.rect(tone('iron',1),cl,wy,2,1);
      for(let k=0;k<Math.min(2,b.blocks|0);k++)for(const side of [-1,1]){const bx=side<0?x0-8+k:x1+3-k,by=g1-k*3;P.rect(tone('stone',0),bx,by-3,6,1);P.rect(tone('stone',1),bx,by-2,6,2);P.rect(tone('stone',3),bx,by,6,1);P.px(tone('stone',3),bx+3,by-2)}
      return}
    // a tent: two cloth slopes from above, the ridge straight back, the door on the middle
    if(b.tent){const c=b.cloth,ap=g1-H,be=g0-H,cl=Math.floor(C),cr=Math.ceil(C);
      P.poly([[x0,g1+1],[cl,ap],[cl,be],[x0,g0+2]],()=>PX.shade(c,1.06));P.poly([[cr,ap],[x1+1,g1+1],[x1+1,g0+2],[cr,be]],()=>PX.shade(c,.76));
      P.poly([[x0+1,g1+1],[x1,g1+1],[C,ap+1]],()=>PX.shade(c,.92));P.poly([[cl-1,g1+1],[cr+1,g1+1],[C,g1-H+4]],'#2a1e14');P.line(PX.shade(c,.6),cl,be,cl,ap);P.rect(tone('timber',1),cl,be-2,1,2);return}
    // a well: the stone ring and dark water from above, two posts, a little roof over the windlass
    if(b.well){const st=b.wall,r=W/2,cg=g1-r;for(let py=Math.round(cg-r-2);py<=g1;py++)for(let px=x0;px<=x1;px++){const dx=px+.5-C,dy=py-cg,d2=dx*dx+dy*dy;if(d2>r*r&&py<cg)continue;if(Math.abs(dx)>r)continue;
        P.px(py>cg?tex(st,px,py,1,seed):d2<(r-1.6)*(r-1.6)?'#1e2a3a':tone(st,0),px,py-2)}
      P.rect(tone('timber',1),x0,cg-9,1,8);P.rect(tone('timber',2),x1,cg-9,1,8);P.rect(tone('log',1),x0,cg-6,W,1);
      P.poly([[x0-2,cg-8],[x1+3,cg-8],[x1+1,cg-12],[x0,cg-12]],(px,py)=>tex(b.roofMat,px,py,0,seed));P.rect(tone(b.roofMat,3),x0-2,cg-8,W+4,1);return}
    // a market stall: its striped canopy from above, the counter and its goods beneath the front edge
    if(b.stall){const [c0,c1]=b.cloth,ch=b.ch||8,top=g1-ch;
      P.rect(tone('plank',1),x0,g1-b.H+1,W,b.H);P.rect(tone('plank',0),x0,g1-b.H+1,W,1);for(let px=x0+1;px<x1;px+=2)P.px(['#c8a040','#a84a3a','#6a8a3a','#9aa8b4'][(px+seed)%4],px,g1-b.H);
      P.rect(tone('timber',1),x0,top,1,ch);P.rect(tone('timber',1),x1,top,1,ch);
      for(let py=top-D;py<=top;py++)for(let px=x0-1;px<=x1+1;px++)P.px(PX.shade(((px-x0+16)>>1)%2?c0:c1,py<top-D+2?.85:1),px,py);
      for(let px=x0-1;px<=x1+1;px++)P.px(px%2?PX.shade(c1,.75):PX.shade(c0,.8),px,top+1);return}
    // a covered wagon from above: the hooped cover, the wheels at its sides, the shaft forward
    if(b.wagon){const cx0=x0+1,cx1=x1-1,top=g1-H-D;for(let py=top;py<=g1-H;py++)for(let px=cx0;px<=cx1;px++)P.px(PX.shade(b.cloth,(py-top)%3===0?.82:px<C?1:.9),px,py);
      P.rect(tone('plank',1),x0,g1-H+1,W,H-1);for(const wx of [x0-1,x1])P.rect(tone('timber',3),wx,g1-3,2,4);P.rect(tone('timber',2),Math.floor(C),g1,1,2);return}
    // standing stones in a ring round a glow, or an obelisk on its round step, from above
    if(b.shrine){const g=spec.glow||'#7fd8e8',st=b.wall,cg=g1-5;
      for(let k=0;k<7;k++){const a=k/7*Math.PI*2-Math.PI/2,sx=Math.round(C-.5+Math.cos(a)*5),sg=Math.round(cg+Math.sin(a)*4);if(sg>cg)continue;P.rect(tone(st,1),sx,sg-6,2,6);P.px(tone(st,0),sx,sg-6)}
      P.rect(g,Math.floor(C)-1,cg-2,2,2);P.px('#ffffff',Math.floor(C)-1,cg-2);
      if(b.shrine==='obelisk'){P.rect(tone(st,1),Math.floor(C)-1,cg-9,2,7);P.px(tone(st,0),Math.floor(C)-1,cg-10);P.px(g,Math.floor(C),cg-6)}
      for(let k=0;k<7;k++){const a=k/7*Math.PI*2-Math.PI/2,sx=Math.round(C-.5+Math.cos(a)*5),sg=Math.round(cg+Math.sin(a)*4);if(sg<=cg)continue;P.rect(tone(st,1),sx,sg-6,2,6);P.rect(tone(st,0),sx,sg-6,1,6)}return}
    // a ruin from above: the stubs of four walls, knocked down unevenly, rubble inside
    if(b.ruin){const st=b.wall,rr=PX.rng(seed*11+3),wall=(ax,ag,bx,bg)=>{const n=Math.max(Math.abs(bx-ax),Math.abs(bg-ag));for(let i=0;i<=n;i++){const px=Math.round(ax+(bx-ax)*i/n),pg=Math.round(ag+(bg-ag)*i/n),z=rr()<.25?0:1+Math.round(rr()*(H-1));if(!z)continue;P.rect(tex(st,px,pg,1,seed),px,pg-z,1,z);P.px(tone(st,0),px,pg-z)}};
      wall(x0,g0,x1,g0);wall(x0,g0,x0,g1);wall(x1,g0,x1,g1);for(let k=0;k<5;k++)P.px(tone(st,2),x0+2+Math.round(rr()*(W-4)),g0+2+Math.round(rr()*(D-4)));wall(x0,g1,Math.floor(C)-2,g1);wall(Math.ceil(C)+1,g1,x1,g1);return}
    // a palisade round a fortified hall: its back and sides first, behind the hall (its front comes last, before it)
    const fx0=x0-3,fx1=x1+3,fb=g0-3,ff=g1+3,stake=(px,g)=>{P.rect(tone('log',px%2?2:0),px,g-4,1,4);if(px%2===0)P.px(tone('log',0),px,g-5)};
    if(b.fence){for(let px=fx0;px<=fx1;px++)stake(px,fb);for(let g=fb+1;g<=ff;g++){P.rect(tone('log',g%2?1:0),fx0,g-5,2,1);P.rect(tone('log',g%2?2:1),fx1-1,g-5,2,1)}}
    // houses, halls and workshops: the face, then the roof by its form, then what stands on it
    face();
    const rt=b.roof==='front'?frontGable():b.roof==='hip'?hipRoof():b.roof==='shed'?shedRoof():sideGable();
    // the door on the middle line: a gate, a barn door, a forge's mouth, a rune door, an arched church door, or a plain door
    const dh=Math.min(H-1,b.storeys===2?5:Math.max(3,Math.round(H*.5))),dw=W>=18?4:2;
    if(b.gate){P.rect('#1e1a18',Math.round(C)-3,g1-6,6,7);for(let i=Math.round(C)-3;i<Math.round(C)+3;i+=2)P.rect(tone('iron',2),i,g1-6,1,7)}
    else if(b.barnDoor||b.bigDoor){P.rect(tone('timber',3),Math.round(C)-4,g1-Math.min(H-1,6)+1,8,Math.min(H-1,6));P.rect(tone('plank',1),Math.round(C)-3,g1-Math.min(H-1,6)+2,6,Math.min(H-1,6)-1);P.rect(tone('plank',2),Math.round(C),g1-Math.min(H-1,6)+2,1,Math.min(H-1,6)-1)}
    else if(b.forge){P.rect('#1e1410',Math.round(C)-3,g1-4,6,5);P.rect('#e86a2a',Math.round(C)-2,g1-2,4,2);P.px('#ffc060',Math.round(C)-1,g1-2)}
    else if(b.runeDoor){doorC(4,Math.min(H-1,5),'darkstone',true);P.px('#e8c040',Math.round(C)-1,g1-3);P.px('#e8c040',Math.round(C),g1-2)}
    else if(!b.tower)doorC(b.arch?4:dw,b.arch?Math.min(H-1,5):dh,'plank',b.arch);
    // windows in pairs, either side of the door; a second row on two storeys
    if(!b.slits){const step=W>=20?6:5,rows=b.storeys===2?[fe+2,fe+2+(H>>1)]:[fe+2];for(const wy of rows){if(wy>g1-3)continue;for(let k=1;k*step<W/2-1;k++){const lx=Math.round(C-k*step)-1,rx=Math.round(C+k*step)-1;if(lx<x0+1)break;
      const lt=PX.hash(k,wy,seed)<.3;win(P,lx,wy,lt,spec.style==='human'&&b.frame);win(P,rx,wy,lt,spec.style==='human'&&b.frame)}}}
    if(b.porch){P.rect(tone('timber',1),Math.round(C)-dw/2-1,g1-3,1,4);P.rect(tone('timber',1),Math.round(C)+dw/2,g1-3,1,4);P.rect(tone(rm,1),Math.round(C)-dw/2-2,g1-dh-2,dw+4,2);P.rect(tone(rm,0),Math.round(C)-dw/2-2,g1-dh-2,dw+4,1)}
    if(b.sign){const sx=Math.round(C)+dw/2+2,sy=fe+2;P.rect(tone('timber',1),sx,sy,4,1);P.rect(tone('plank',0),sx+1,sy+1,3,3);P.rect('#c8a040',sx+2,sy+2,1,1)}
    if(b.lanterns){P.px('#ffe090',x0+1,fe+2);P.px('#ffe090',x1-1,fe+2)}
    if(b.tusks){P.px('#ece4d0',x0-1,rt[1]);P.px('#ece4d0',x1+1,rt[1])}
    // on the roof: a dormer over the door, a chimney toward one end, a bellcote at the front, a turret
    if(b.dormers&&b.roof==='side'){const dc=Math.round(C),dy=Math.round((rt[1]+fe)/2)+1;P.rect(tone(wl,0),dc-2,dy-2,4,3);P.rect('#2a3040',dc-1,dy-1,2,2);P.line(tone(rm,2),dc-3,dy-2,dc-1,dy-4);P.line(tone(rm,2),dc,dy-4,dc+2,dy-2)}
    if(b.chimney){const cx=x1-3,cy=b.roof==='front'?Math.round((g0+g1)/2-H-R/2):rt[1]+1;P.rect(tone('stone',1),cx,cy-3,3,4);P.rect(tone('stone',0),cx,cy-3,3,1);P.rect(tone('stone',3),cx,cy-3,1,1);if(b.bigChimney){P.rect(tone('stone',1),cx,cy-6,3,3);P.px('#e86a2a',cx+1,cy-6)}}
    if(b.bellcote){const bx=Math.floor(C),by=rt[1]+1;P.rect(tone(wl,0),bx-1,by-3,3,3);P.px('#2a2420',bx,by-2);P.px('#c8a040',bx,by-1);P.rect(tone(rm,1),bx-2,by-4,5,1);P.rect(tone(rm,0),bx-1,by-5,3,1)}
    if(b.tower){// the church tower at the front, over the door: its face, a spire from above
      const tw=W>=16?8:4,tx0=Math.round(C-tw/2),tx1=tx0+tw-1,th=H+(b.towerH||8),tg0=g1-5;
      for(let r=g1-th+1;r<=g1;r++)for(let px=tx0;px<=tx1;px++)P.px(tex(wl,px,r,px<tx0+2?0:1,seed+11),px,r);P.rect(tone(wl,3),tx1,g1-th+1,1,th);
      P.rect('#2a2420',Math.round(C)-1,g1-th+4,2,2);doorC(4,Math.min(th-2,6),'plank',true);
      const big=b.tiles[0]>1,ty=g1-th,sp=big?6:3;P.poly([[tx0-1,ty+1],[tx1+2,ty+1],[Math.round(C),ty-sp]],(px,py)=>tex(rm,px,py,px<C?0:2,seed+12));P.poly([[tx0,ty+1],[tx1+1,ty+1],[Math.round(C),ty-2]],(px,py)=>tex(rm,px,py,1,seed+13));
      const cs=big?4:2;P.rect('#c8a040',Math.round(C)-1,ty-sp-cs,1,cs);P.rect('#c8a040',Math.round(C)-2,ty-sp-cs+1,3,1)}
    if(b.wheel){const r=b.wr||4,cx=x1+1,cy=g1-r;for(let k=0;k<8;k++){const an=k*Math.PI/4;P.line(tone('plank',1),cx,cy,Math.round(cx+Math.cos(an)*r),Math.round(cy+Math.sin(an)*r))}for(let k=0;k<48;k++){const an=k*Math.PI/24;P.px(tone('plank',2),Math.round(cx+Math.cos(an)*r),Math.round(cy+Math.sin(an)*r))}}
    if(b.banner)banner(P,Math.round(rt[0]),Math.round(rt[1])-1);
    if(b.fence){const cl=Math.floor(C);for(let px=fx0;px<=fx1;px++)if(Math.abs(px+.5-C)>3)stake(px,ff);P.rect(tone('log',0),cl-4,ff-7,1,7);P.rect(tone('log',0),cl+3,ff-7,1,7);P.rect(tone('log',1),cl-4,ff-8,8,1)}
  }
  // one step lower, seen from above: the depth goes first, then the roof, the front wall last (so the face with its door stays)
  function shrinkTop(b){
    for(const k of DROP_H)if(b[k]&&k!=='chimney'){b[k]=typeof b[k]==='number'?0:false;return true}
    if(b.D>6){b.D--;return true}
    if(b.R>3){b.R--;return true}
    if(b.H>4){b.H--;return true}
    return shrinkH(b);
  }
  function draw(P,b,x,y,seed,spec,d){
    const W=b.W,D=b.D||0,H=b.H,R=b.R||0,dx=D/2;
    if(b.well){// a stone ring with dark water, two posts, a windlass and a little roof
      const st=b.wall,top=y-H;face(P,[x,y],[W,0],[0,-H],st,LT.front,seed);P.rect(tone(st,0),x,top-2,W,2);P.rect('#1e2a3a',x+1,top-1,W-2,1);P.px(tone(st,1),x+W-1,top-1);
      P.rect(tone('timber',1),x,top-7,1,5);P.rect(tone('timber',2),x+W-1,top-7,1,5);P.rect(tone('log',1),x,top-5,W,1);P.rect(tone('plank',2),x+(W>>1),top-5,1,3);P.rect(tone('plank',1),x+(W>>1)-1,top-3,3,2);
      P.poly([[x-2,top-7],[x+W+2,top-7],[x+W/2,top-10]],(px,py)=>tex(b.roofMat,px,py,LT.slopeF,seed));P.line(tone('timber',2),x-2,top-7,x+W/2,top-10);P.line(tone('timber',2),x+W/2,top-10,x+W+2,top-7);return}
    if(b.mound){// a rocky hump, lit on its upper left (snow on its crown in the frost), and the way in: a timbered adit or a cave mouth
      mound(P,x,y,W,H,b.wall,seed,b.snow);const cx=Math.round(x+W/2);
      if(b.mound==='mine'){const a=Math.max(3,Math.round(W/5));P.rect('#140e0a',cx-a,y-2*a,2*a,2*a);P.rect(tone('timber',1),cx-a-1,y-2*a-1,1,2*a+1);P.rect(tone('timber',2),cx+a,y-2*a-1,1,2*a+1);P.rect(tone('log',0),cx-a-2,y-2*a-2,2*a+3,1);P.rect(tone('log',1),cx-a-2,y-2*a-1,2*a+3,1);P.px('#ffd060',cx+a+1,y-2*a);
        P.line(tone('iron',2),cx-2,y,cx-2,y-1);P.line(tone('iron',2),cx+1,y,cx+1,y-1);
        if(b.cart){const kx=x+W-1;P.line(tone('iron',2),cx+2,y,kx+6,y);P.rect(tone('plank',2),kx,y-4,6,3);P.rect(tone('plank',1),kx,y-4,6,1);P.rect(b.ore,kx+1,y-5,4,1);P.px(PX.shade(b.ore,1.3),kx+2,y-5);P.px('#2a1e14',kx+1,y-1);P.px('#2a1e14',kx+4,y-1)}
        else{P.rect(PX.shade(b.ore,.7),x+W,y-2,4,2);P.rect(b.ore,x+W+1,y-3,2,1)}}
      else{// a cave: a ragged dark mouth, darker deep inside, with rocks and maybe bones before it
        const k=W/16,base=[3,5,6,7,7,7],mh=Math.round(6*k);for(let j=0;j<mh;j++){const w=Math.round(base[Math.min(5,Math.floor(j/k))]*k);P.rect(j<2?'#2a2018':'#140e0a',cx-(w>>1),y-mh+j,w,1)}P.rect('#0a0806',cx-Math.round(2*k),y-Math.round(3*k),Math.round(4*k),Math.round(3*k));
        const rr=PX.rng(seed*5+1);for(let k=0;k<b.rocks;k++){const rx=x+Math.round(rr()*(W-3)),ry=y+1-Math.round(rr()*2);if(Math.abs(rx-cx)<5)continue;P.rect(tone(b.wall,1),rx,ry-2,3,2);P.px(tone(b.wall,0),rx,ry-2)}
        if(b.bones){P.rect('#e8e4d0',cx+4,y-1,2,1);P.px('#e8e4d0',cx-6,y-1)}}
      return}
    if(b.shed){// an open shed: posts, a single slope of roof, logs stacked under it, a stump with an axe beside it
      const top=y-H,dx2=D/2;P.rect(tone('timber',2),Math.round(x+dx2),top-dx2,1,H);P.rect(tone('timber',2),Math.round(x+W+dx2-1),top-dx2,1,H);
      for(let k=0;k<b.logs;k++)for(let i=0;i<Math.floor((W-2)/3);i++){const lx=x+1+i*3+(k%2),ly=y-1-k*2;P.rect(tone('log',1),lx,ly-2,3,2);P.px(tone('plank',0),lx+1,ly-1);P.px(tone('log',3),lx+2,ly-1)}
      P.rect(tone('timber',1),x,top,1,H);P.rect(tone('timber',1),x+W-1,top,1,H);
      roof(P,{x,y,W,D,H,R,mat:b.roofMat,roof:'shed',wall:'plank',seed});
      if(b.stump){const sx=x+W+2;P.rect(tone('log',2),sx,y-3,4,3);P.rect(tone('plank',0),sx,y-3,4,1);P.rect(tone('timber',2),sx+2,y-6,1,3);P.rect(tone('iron',1),sx+1,y-6,2,1)}
      return}
    if(b.crane){// a treadwheel crane: an A-frame, a jib swung out, the wheel men walk in, and a block on the rope
      const ax=x+(W>>1),top=y-H,j=b.jib,ex=ax+j*b.jibLen,r=b.wr||4.5,wx=ax-j*Math.round(r*.6),wy=y-Math.round(r)-1;
      P.line(tone('timber',1),x,y-1,ax,top);P.line(tone('timber',2),x+W-1,y-1,ax,top);P.line(tone('timber',2),x+3,y-Math.round(H*.4),x+W-4,y-Math.round(H*.4));
      P.line(tone('timber',1),ax,top,ex,top+2);P.line(tone('timber',1),ax,top+1,ex,top+3);P.line('#a89a78',ex,top+3,ex,y-6);P.rect(tone('stone',1),ex-2,y-6,4,4);P.rect(tone('stone',0),ex-2,y-6,4,1);
      for(let k=0;k<3;k++){const an=k*Math.PI/3+.4;P.line(tone('plank',2),Math.round(wx-Math.cos(an)*r),Math.round(wy-Math.sin(an)*r),Math.round(wx+Math.cos(an)*r),Math.round(wy+Math.sin(an)*r))}
      for(let k=0;k<72;k++){const an=k*Math.PI/36,c=Math.cos(an);P.px(tone('plank',c<-.3?0:c<.4?1:2),Math.round(wx+c*r),Math.round(wy+Math.sin(an)*r))}P.px(tone('iron',1),wx,wy);
      P.rect(tone('stone',2),x-1,y-1,W+2,1);return}
    if(b.tent){// a ridge tent, its gable to the camera: two cloth slopes running back, the dark door, a pole and pegs
      const c=b.cloth,cl=(lit)=>(a,bb)=>PX.shade(c,[1.08,.92,.74][lit]-((a|0)%4===0?.05:0)),ap=[x+W/2,y-H];
      face(P,[x,y],[ap[0]-x,ap[1]-y],[dx,-dx],'canvas',0,seed,{col:cl(LT.slopeL)});face(P,[ap[0],ap[1]],[x+W-ap[0],y-ap[1]],[dx,-dx],'canvas',0,seed,{col:cl(LT.slopeR)});
      P.poly([[x,y],[x+W,y],ap],(px,py)=>PX.shade(c,LT.front?.86:1));P.poly([[ap[0]-2,y],[ap[0]+2,y],[ap[0],y-H+3]],'#2a1e14');
      P.line(PX.shade(c,.6),x,y,ap[0],ap[1]);P.line(PX.shade(c,.6),ap[0],ap[1],x+W,y);P.rect(tone('timber',1),Math.round(ap[0]),Math.round(ap[1])-2,1,2);P.px(tone('timber',2),x-1,y);P.px(tone('timber',2),x+W,y);return}
    if(b.wagon){// a covered wagon: a plank bed on two wheels, hooped canvas, a shaft out front
      const bed=y-3;box(P,{x,y:bed,W,D,H:3,wall:'plank',seed});
      for(let j=0;j<R;j++){const q=(R-j)/R,ins=Math.round((1-Math.sqrt(Math.max(0,1-q*q)))*3);for(let i=x+ins;i<x+W-ins;i++)P.px(PX.shade(b.cloth,(i-x)%4===0?.82:j<R*.4?1:.92),i,bed-3-R+j+1)}
      P.rect(PX.shade(b.cloth,.7),x+W-2,bed-R+1,1,R-2);
      for(const wx of [x+2,x+W-3]){P.rect(tone('timber',3),wx-1,y-3,3,3);P.px(tone('plank',0),wx,y-2)}P.line(tone('timber',2),x-1,y-2,x-4,y-1);
      if(b.load==='crates')crate(P,x+W+dx+1,y);if(b.load==='barrels')barrel(P,x+W+dx+1,y);return}
    if(b.ruin){// broken walls: a box whose top is knocked down unevenly, an empty arch, rubble and ivy
      const st=b.wall,rr=PX.rng(seed*11+3);box(P,{x,y,W,D,H,wall:st,seed});
      let h=H;const tops=[];for(let i=0;i<W+dx;i++){h=Math.max(3,Math.min(H,h+Math.round((rr()-.5)*4)));if(i===0)h=H-1;tops.push(h)}
      for(let i=0;i<W+dx;i++){const side=i>=W,base=side?y-(i-W)/2:y,cut=base-tops[i];P.clear(x+i,0,1,Math.max(0,Math.round(cut)));P.px(tone(st,0),x+i,Math.round(cut))}
      if(b.arch){const ax2=x+Math.round(W/2)-2;P.rect('#2a2420',ax2,y-7,4,6);P.rect('#2a2420',ax2+1,y-8,2,1)}
      for(let k=0;k<4;k++){const rx=x-2+Math.round(rr()*(W+4)),ry=y+1;P.rect(tone(st,1),rx,ry-2,2+(k%2),2);P.px(tone(st,0),rx,ry-2)}
      if(b.ivy)for(let k=0;k<7;k++){const ix=x+Math.round(rr()*W*.5),iy=y-2-Math.round(rr()*H*.6);P.px(k%2?'#4f8a3e':'#3c7032',ix,iy)}
      return}
    if(b.shrine){// standing stones round a glowing heart, or a single carved obelisk on a step
      const g=spec.glow||'#7fd8e8',st=b.wall;
      if(b.shrine==='obelisk'){const cx=x+5;P.rect(tone(st,1),cx-4,y-2,9,2);P.rect(tone(st,0),cx-4,y-2,9,1);for(let j=0;j<H;j++){const w=j<2?1:j<4?3:4;for(let i=0;i<w;i++)P.px(tone(st,i===0?0:i===w-1?2:1),cx-(w>>1)+i,y-2-H+j)}
        for(let j=4;j<H-1;j+=3)P.px(g,cx,y-2-H+j);P.px('#ffffff',cx,y-2-H+4)}
      else{const S=[[x,7],[x+4,10],[x+8,8]],bk=[[x+2,6],[x+7,6]];for(const [sx,h] of bk){P.rect(tone(st,2),sx,y-3-h,2,h);P.px(tone(st,1),sx,y-3-h)}
        P.rect(g,x+4,y-4,3,2);P.px('#ffffff',x+5,y-4);
        for(const [sx,h] of S){P.rect(tone(st,1),sx,y-h,3,h);P.rect(tone(st,0),sx,y-h,1,h);P.rect(tone(st,2),sx+2,y-h,1,h);P.rect(tone(st,0),sx,y-h,3,1)}
        P.rect(tone(st,0),x-1,y-11,13,2);P.rect(tone(st,1),x-1,y-10,13,1);P.px(g,x+2,y-6);P.px(g,x+9,y-5)}
      return}
    if(b.tree){// an elf tree-house: a trunk of its own height and girth, a canopy of seeded clumps, a house on a platform among them
      const tw=b.tw,cx=x+8,th=b.trunk,tx=cx-(tw>>1),r=PX.rng(seed*29+5),lf=b.leaf;
      // roots, then the trunk, lit on the left
      P.rect(tone('log',2),tx-1,y-2,tw+2,2);for(let i=0;i<tw;i++)P.rect(tone('log',i===0?0:i===tw-1?2:1),tx+i,y-th,1,th);P.rect(tone('log',3),tx+(tw>>1),y-th+3,1,3);
      const blob=(bx,by,rx,ry)=>{for(let j=-ry;j<=ry;j++)for(let i=-rx;i<=rx;i++){const q=(i*i)/(rx*rx)+(j*j)/(ry*ry);if(q>1)continue;const lit=(i+j)<-rx*.3?0:(i+j)<rx*.5?1:2;P.px(tex(lf,bx+i,by+j,lit+(q>.75?1:0),seed),bx+i,by+j)}};
      // the canopy behind the house: higher clumps
      const ph=y-th+3,clumps=[];for(let k=0;k<b.blobs;k++)clumps.push([cx+Math.round((r()-.5)*b.spread),ph-4-Math.round(r()*8),Math.min(b.leafR,4+Math.round(r()*2)),Math.min(b.leafR-1,3+Math.round(r()*2))]);
      clumps.sort((a,c)=>a[1]-c[1]).forEach(c=>blob(...c));
      // the platform, the house on it, and a lantern
      const hx=Math.round(cx-b.W/2+b.side*3),pw=b.W+4;P.rect(tone('plank',1),hx-2,ph,pw,2);P.rect(tone('plank',0),hx-2,ph,pw,1);P.rect(tone('log',2),hx-1,ph+2,1,2);P.rect(tone('log',2),hx+pw-4,ph+2,1,2);
      box(P,{x:hx,y:ph,W:b.W,D:b.D,H:b.H,wall:b.wall,seed});roof(P,{x:hx,y:ph,W:b.W,D:b.D,H:b.H,R:b.R,mat:b.roofMat,roof:b.roof,wall:b.wall,seed});
      P.rect(tone('timber',3),hx+(b.W>>1)-1,ph-3,2,3);if(b.lanterns){P.px('#ffe090',hx-2,ph-1);P.px('#ffe090',hx+pw-3,ph-1)}
      // a lower platform on some trees
      if(b.second){const sy=y-Math.round(th*.45),sx=b.side>0?tx-6:tx+tw+1;P.rect(tone('plank',1),sx,sy,6,1);P.rect(tone('plank',0),sx,sy-1,6,1);P.rect(tone('timber',1),sx+(b.side>0?0:5),sy-4,1,4)}
      // the way up: a rope ladder or steps around the trunk
      if(b.ladder==='rope')for(let j=ph+2;j<y-1;j+=2){P.px(tone('timber',1),hx+pw-3,j);P.px(tone('timber',1),hx+pw-1,j);P.px(tone('plank',0),hx+pw-2,j)}
      if(b.ladder==='steps')for(let j=0;j<Math.floor((y-ph)/3);j++){const k=j%2;P.rect(tone('plank',0),k?tx+tw:tx-2,y-3-j*3,2,1)}
      // a few low leaves in front of it all
      blob(cx+(b.side>0?-5:5),ph+1,3,2);
      return}
    if(b.yurt){// a round hide tent on poles, smoke hole at the top
      const cx=x+W/2;for(let j=0;j<H;j++)for(let i=0;i<W;i++)P.px(tex('hide',i,j,i<W*.3?0:i<W*.75?1:2,seed),x+i,y-H+j);
      for(let j=0;j<=R;j++){const w=Math.max(2,Math.round((W+2)*(j+1)/(R+1))),x0=Math.round(cx-w/2);for(let i=0;i<w;i++)P.px(tex('hide',i,j,i<w*.4?0:1,seed+1),x0+i,y-H-R+j)}
      P.rect(tone('timber',2),Math.round(cx)-1,y-H-R-2,1,3);P.rect(tone('timber',2),Math.round(cx)+1,y-H-R-2,1,3);P.rect('#2a1e14',Math.round(cx)-1,y-4,3,4);
      if(b.tusks){P.px('#ece4d0',x,y-H);P.px('#ece4d0',x+W-1,y-H)}return}
    if(b.stall){// a market stall: a counter of goods with depth, four posts, a striped cloth canopy and a scalloped edge
      const [c0,c1]=b.cloth,stripe=(a,lit)=>PX.shade(((a|0)>>1)%2?c0:c1,lit===0?1:lit===1?.88:.74),ch=b.ch||11;
      P.rect(tone('timber',2),Math.round(x+dx),y-dx-ch,1,ch-2);P.rect(tone('timber',2),Math.round(x+W+dx-1),y-dx-ch,1,ch-2);// back posts
      box(P,{x,y,W,D,H:b.H,wall:'plank',seed});face(P,[x,y-b.H],[W,0],[dx,-dx],'plank',0,seed+2);// the counter and its top
      const G={produce:['#c8a040','#a84a3a','#6a8a3a','#d8b060'],cloth:['#a8483a','#4a6a9a','#c8a040','#6a5a8a'],pots:['#a8583e','#8e4632','#c0704e','#7a5a3a'],meat:['#b85a4a','#e0c8b0','#9a4a3a','#c86a5a'],fish:['#9aa8b4','#c8d0d8','#7a8894','#b0bcc8']}[b.goods];
      for(let i=1;i<W-1;i+=2)for(let k=0;k<2;k++)P.px(G[(i+k*3+seed)%G.length],Math.round(x+i+k*dx/2),Math.round(y-b.H-1-k*dx/2));
      if(b.goods==='meat'||b.goods==='fish')for(let i=2;i<W-1;i+=3)P.rect(G[i%G.length],x+i,y-ch+3,1,2);
      P.rect(tone('timber',1),x,y-ch,1,ch);P.rect(tone('timber',1),x+W-1,y-ch,1,ch);// front posts
      const top=y-ch;
      if(b.canopy==='slope'){face(P,[x-1,top],[W+2,0],[dx+1,-dx-2],'plank',0,seed,{col:a=>stripe(a,LT.slopeF)})}
      else{const ap=[x+W/2,top-4];face(P,[x-1,top],[ap[0]-x+1,-4],[dx,-dx],'plank',0,seed,{col:a=>stripe(a,LT.slopeL)});face(P,[ap[0],ap[1]],[x+W+1-ap[0],4],[dx,-dx],'plank',0,seed,{col:a=>stripe(a,LT.slopeR)});
        P.poly([[x-1,top],[x+W+1,top],ap],(px)=>stripe(px-x,LT.front))}
      for(let i=-1;i<W+1;i++)P.px(i%2?PX.shade(c1,.8):PX.shade(c0,.85),x+i,top+1);for(let i=0;i<W+1;i+=2)P.px(PX.shade(c1,.7),x+i,top+2);// the scalloped edge
      // what stands beside it
      if(b.side==='basket'){P.rect(tone('plank',2),x+W+1,y-3,4,3);P.rect(tone('plank',1),x+W+1,y-3,4,1);P.rect(G[0],x+W+2,y-4,2,1)}
      if(b.side==='crates'){crate(P,x+W+1,y);crate(P,x+W+1,y-3)}
      if(b.side==='sacks'){P.rect('#c8b48a',x+W+1,y-4,3,4);P.rect('#a8946a',x+W+3,y-3,3,3);P.px('#8a7a5a',x+W+2,y-4)}
      return}
    if(b.round){// towers, granaries, windmills, spires
      const ap=round(P,x,y,W,H,b.wall,b.roofMat,R,seed);
      if(b.slits){slit(P,x+(W>>1),y-H+3);if(H>10)slit(P,x+(W>>1)-2,y-H+8)}
      if(spec.type==='granary'){P.rect('#2a1e14',x+(W>>1)-1,y-4,3,4);P.rect(tone('timber',1),x,y-3,W,1)}
      if(b.sails){const c=[x+W/2,y-H+2],L=b.sail;P.line(tone('plank',2),c[0]-L,c[1]-L,c[0]+L,c[1]+L);P.line(tone('plank',2),c[0]+L,c[1]-L,c[0]-L,c[1]+L);
        for(const [sx,sy] of [[-1,-1],[1,1],[1,-1],[-1,1]])for(let k=2;k<L;k++)P.px(tone('canvas',0),Math.round(c[0]+sx*k+(sy>0?0:1)*sx),Math.round(c[1]+sy*k));P.rect(tone('timber',2),c[0]-1,c[1]-1,2,2);P.rect('#2a1e14',x+(W>>1)-1,y-4,2,4)}
      if(b.banner)banner(P,Math.round(ap[0]),Math.round(ap[1]),spec.banner);return}
    if(b.castle){
      const top=y-H,par=b.par||3,st=b.wall,tw=b.tw||7,tR=b.tR||6;box(P,{x,y,W,D,H,wall:st,seed});
      face(P,[x,top],[W,0],[dx,-dx],st,2,seed+9,{col:(a,bb)=>tone(st,((bb|0)%3===0)?3:2)});// the walkway
      face(P,[x+dx,top-dx],[W,0],[0,-par],st,1,seed+5);face(P,[x,top],[dx,-dx],[0,-par],st,1,seed+6);// back and left parapets
      if(b.pitch){roof(P,{x:x+3,y:top-1,W:W-6,D:Math.max(4,D-6),H:0,R:b.R,mat:b.roofMat,roof:'side',wall:st,seed:seed+13})}
      if(b.donjon){const dW=Math.round(W*.42),dD=Math.max(4,Math.round(D*.45)),dX=x+Math.round((W-dW)/2)+1,dY=Math.round(top-dx*.45);box(P,{x:dX,y:dY,W:dW,D:dD,H:b.donjon,wall:st,seed:seed+17});slit(P,dX+2,dY-b.donjon+3);slit(P,dX+dW-3,dY-b.donjon+3);
        b._top=roof(P,{x:dX,y:dY,W:dW,D:dD,H:b.donjon,R:b.R,mat:b.roofMat,roof:'side',wall:st,seed:seed+18})}
      if(b.turrets>=3){const tx=Math.round(x+W+dx-(tw>>1)-1),ty=Math.round(y-dx);round(P,tx,ty,tw,H+(b.tH||7),st,b.coneTurrets?b.roofMat:null,tR,seed+14)}
      face(P,[x,top],[W,0],[0,-par],st,LT.front,seed+7);face(P,[x+W,top],[dx,-dx],[0,-par],st,LT.side,seed+8);// front and side parapets
      for(let i=2;i<W-2;i+=3)P.rect(tone(st,3),x+i,top-par,1,1);for(let i=2;i<dx;i+=3)P.px(tone(st,3),Math.round(x+W+i),Math.round(top-par-i));
      // the gate: an arch, a portcullis, a lintel
      const gw=b.gw||(W>=16?6:4),gh=b.gh||7,gx=x+Math.round((W-gw)/2);P.rect('#1e1a18',gx,y-gh,gw,gh);P.rect('#1e1a18',gx+1,y-gh-1,gw-2,1);for(let i=gx;i<gx+gw;i+=2)P.rect(tone('iron',2),i,y-gh,1,gh);P.rect(tone('iron',2),gx,y-Math.round(gh*.55),gw,1);P.rect(tone(st,0),gx-1,y-gh-2,gw+2,1);
      slit(P,x+3,y-H+4);slit(P,x+W-4,y-H+4);if(H>12){slit(P,x+3,y-8);slit(P,x+W-4,y-8)}
      // corner turrets at the front
      const th=H+(b.tH||7);round(P,x-(tw>>1)-1,y+1,tw,th+1,st,b.coneTurrets?b.roofMat:null,tR,seed+15);round(P,x+W-(tw>>1),y+1,tw,th+1,st,b.coneTurrets?b.roofMat:null,tR,seed+16);
      if(b.banner){const bt=b._top||[x+W/2+dx/2,top-dx/2-par-(b.pitch?b.R:0)];banner(P,Math.round(bt[0]),Math.round(bt[1]),spec.banner)}
      return}
    if(b.stilts){for(const sx of [x,x+W-1,x+dx,x+W-1+dx])P.rect(tone('log',2),sx,y-6,1,6);y-=6;}
    // a cross-wing: the hall stands back and a gabled wing comes forward at one end
    if(b.wing){const wx=x,wW=Math.min(9,W>>1)|1,sb=3;
      box(P,{x:x+sb/2,y:y-sb/2,W,D:D-sb,H,wall:b.wall,seed,frame:b.frame});roof(P,{x:x+sb/2,y:y-sb/2,W,D:D-sb,H,R,mat:b.roofMat,roof:'side',wall:b.wall,frame:b.frame,dormers:b.dormers,seed});
      box(P,{x:wx,y,W:wW,D:sb+2,H,wall:b.wall,seed:seed+21,frame:b.frame});roof(P,{x:wx,y,W:wW,D:sb+2,H,R:R+1,mat:b.roofMat,roof:'front',wall:b.wall,frame:b.frame,seed:seed+22});
      door(P,wx+(wW>>1)-1,y,2,4,'plank');win(P,x+wW+3,y-H+2,d.chance(.4),false);win(P,x+wW+9,y-H+2,d.chance(.4),false);
      if(b.chimney)chimney(P,x+W-3,y-H-R+1,4);if(b.sign){const sx=x+W-1,sy=y-H+2;P.rect(tone('timber',1),sx,sy,4,1);P.rect(tone('plank',0),sx+1,sy+1,4,3);P.rect('#c8a040',sx+2,sy+2,2,1)}
      if(b.add==='barrels'){barrel(P,x+W+3,y-1);barrel(P,x+W+6,y-1)}return}
    box(P,{x,y,W,D,H,wall:b.wall,seed,frame:b.frame,braces:d.chance(.5)});
    // windows along the long side of an end-on building
    if(b.sideWin)for(let z=3;z<D-2;z+=6){const sx=Math.round(x+W+z/2),sy=Math.round(y-z/2-H+2);P.rect('#2a3040',sx,sy,1,2);P.px(d.chance(.3)?'#e8b860':'#4a5468',sx,sy)}
    // the storeys of a town house: a jetty line where the upper floor juts out
    if(b.storeys===2&&b.jetty)P.rect(tone('timber',2),x-1,y-(H>>1)-1,W+1,1);
    // doors and windows on the front wall
    const dw=W>=18?3:2,dh=Math.min(H-1,b.storeys===2?5:Math.max(3,Math.round(H*.45))),left=d.chance(.5),dxp=b.barnDoor||b.bigDoor||b.gate||b.arch?x+(W>>1)-2:left?x+2:x+W-dw-2;
    if(b.gate){P.rect('#1e1a18',x+3,y-7,6,7);P.rect('#1e1a18',x+4,y-8,4,1);for(let i=x+3;i<x+9;i+=2)P.rect(tone('iron',2),i,y-7,1,7);P.rect(tone('iron',2),x+3,y-5,6,1)}
    else if(b.barnDoor||b.bigDoor){P.rect(tone('timber',3),x+(W>>1)-4,y-6,8,6);P.rect(tone('plank',1),x+(W>>1)-3,y-5,6,5);P.line(tone('plank',2),x+(W>>1)-3,y-5,x+(W>>1)+2,y-1);P.line(tone('plank',2),x+(W>>1)+2,y-5,x+(W>>1)-3,y-1)}
    else if(b.forge){P.rect('#1e1410',x+2,y-5,5,5);P.rect('#e86a2a',x+3,y-3,3,2);P.px('#ffc060',x+4,y-3)}
    else if(b.runeDoor){door(P,x+(W>>1)-1,y,3,5,'darkstone',true);P.px('#e8c040',x+(W>>1),y-4);P.px('#e8c040',x+(W>>1)+2,y-3)}
    else door(P,dxp,y,b.arch?3:dw,b.arch?5:dh,'plank',b.arch);
    if(!b.slits&&!b.gate){const rows=b.storeys===2?[y-H+2,y-(H>>1)+1]:[y-H+2];const n=b.windows||(W>=22?3:W>=15?2:W>=9?1:0);
      for(const wy of rows){if(wy>y-4&&rows.length>1)continue;for(let k=0;k<n;k++){const wx=n===1?(left?x+W-5:x+3):x+3+Math.round(k*(W-8)/Math.max(1,n-1));if(Math.abs(wx-dxp)<3&&wy>y-dh-2)continue;win(P,wx,wy,d.chance(.3),spec.style==='human'&&d.chance(.4))}}}
    if(b.slits){for(let i=x+3;i<x+W-2;i+=5){slit(P,i,y-H+3);if(H>12)slit(P,i,y-H+9)}}
    if(b.rose){P.rect(tone('timber',3),x+(W>>1)-1,y-H+1,3,3);P.px('#c8a060',x+(W>>1),y-H+2)}
    if(b.lanterns){P.px('#ffe090',x+1,y-H);P.px('#ffe090',x+W-2,y-H)}
    // the roof, and what stands on it
    const rt=roof(P,{x,y,W,D,H,R,mat:b.roofMat,roof:b.roof,wall:b.wall,frame:b.frame,dormers:b.dormers,seed});
    // a lean-to against the side: a low wall and a single slope
    if(b.annex){const ax=Math.round(x+W+1),ay=Math.round(y-1),aD=Math.max(4,D-3);box(P,{x:ax,y:ay+1,W:5,D:aD,H:Math.max(3,H-2),wall:b.wall==='daub'?'plank':b.wall,seed:seed+31});
      roof(P,{x:ax,y:ay+1,W:5,D:aD,H:Math.max(3,H-2),R:2,mat:b.roofMat,roof:'shed',wall:b.wall,seed:seed+32});P.rect('#2a2420',ax+2,ay-2,2,3)}
    // a porch: two posts and a little roof over the door
    if(b.porch){const px=dxp-1;P.rect(tone('timber',1),px,y-4,1,4);P.rect(tone('timber',1),px+dw+1,y-4,1,4);P.rect(tone(b.roofMat,1),px-1,y-6,dw+4,2);P.rect(tone(b.roofMat,0),px-1,y-6,dw+4,1)}
    if(b.chimney){const cx=b.roof==='front'?x+W-3:x+Math.round(W*.7),cy=b.roof==='side'?y-H-Math.round(R*.6)-1:y-H-2;chimney(P,cx,cy,b.bigChimney?6:4);if(b.bigChimney)P.px('#e86a2a',cx+1,cy-6)}
    if(b.bellcote){const bx=Math.round(x+W/2+dx/3),by=Math.round(y-H-R-dx/3)+1;P.rect(tone(b.wall,0),bx-1,by-3,3,3);P.rect(tone(b.wall,1),bx+1,by-3,1,3);P.px('#2a2420',bx,by-2);P.px('#c8a040',bx,by-1);P.rect(tone(b.roofMat,1),bx-2,by-4,5,1);P.rect(tone(b.roofMat,0),bx-1,by-5,3,1)}
    if(b.tower){// the church tower, at its right
      const tw=b.tiles[0]>1?6:4,td=b.tiles[0]>1?5:3,tx=x+W+Math.round(dx)-(tw>>1)-1,th=H+(b.towerH||12);box(P,{x:tx,y,W:tw,D:td,H:th,wall:b.wall,seed:seed+11});slit(P,tx+(tw>>1)-1,y-th+3);if(th>9)P.rect('#2a2420',tx+(tw>>1)-1,y-th+7,2,2);
      const ap=roof(P,{x:tx,y,W:tw,D:td,H:th,R:tw,mat:b.roofMat,roof:'front',wall:b.wall,seed:seed+12}),cs=b.tiles[0]>1?4:2;P.rect('#c8a040',Math.round(ap[0]),Math.round(ap[1])-cs,1,cs);P.rect('#c8a040',Math.round(ap[0])-1,Math.round(ap[1])-cs+1,3,1)}
    if(b.turret){const tx=x+W-4,ty=y-H-Math.round(dx*.6);round(P,tx,ty,5,6,b.wall,null,0,seed+4)}
    if(b.banner)banner(P,Math.round(rt[0]),Math.round(rt[1])-1,spec.banner);
    if(b.tusks){P.px('#ece4d0',x-1,y-H-1);P.px('#ece4d0',x+W,y-H-1);P.px('#ece4d0',x+W+Math.round(dx/2),y-H-R-Math.round(dx/2)-1)}
    // things at the door
    const a=b.add;
    if(a==='barrel'||a==='barrels'){barrel(P,x+W+1,y);if(a==='barrels')barrel(P,x+W+4,y)}
    if(a==='crate'||a==='crates'){crate(P,x+W+1,y);if(a==='crates')crate(P,x-5,y)}
    if(a==='woodpile')woodpile(P,x+W+1,y);
    if(a==='anvil'){P.rect(tone('iron',1),x+W+1,y-3,4,1);P.rect(tone('iron',2),x+W+2,y-2,2,2)}
    if(a==='hay'){P.rect(tone('thatch',1),x+W+1,y-4,5,4);P.rect(tone('thatch',0),x+W+2,y-5,3,1)}
    if(a==='nets'){P.rect(tone('timber',1),x+W+1,y-7,1,7);P.rect(tone('timber',1),x+W+5,y-7,1,7);for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)%2)P.px('#8a8a7a',x+W+2+i,y-6+j)}
    if(a==='totem'){P.rect(tone('log',1),x-3,y-12,2,12);P.rect('#ece4d0',x-4,y-14,4,3);P.px('#1a1410',x-3,y-13)}
    if(b.sign){const sx=x+W-2,sy=y-H+1;P.rect(tone('timber',1),sx,sy,4,1);P.rect(tone('plank',0),sx+1,sy+1,4,3);P.rect('#c8a040',sx+2,sy+2,2,1)}
    if(b.wheel){const r=b.wr||4,cx=x+W+Math.round(dx)+1-Math.round(r/2),cy=y-r;for(let k=0;k<8;k++){const an=k*Math.PI/4;P.line(tone('plank',1),cx,cy,Math.round(cx+Math.cos(an)*r),Math.round(cy+Math.sin(an)*r))}for(let k=0;k<48;k++){const an=k*Math.PI/24;P.px(tone('plank',2),Math.round(cx+Math.cos(an)*r),Math.round(cy+Math.sin(an)*r))}P.px(tone('timber',2),cx,cy)}
  }
})(window.PX=window.PX||{});
