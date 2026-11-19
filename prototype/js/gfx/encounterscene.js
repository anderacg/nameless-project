'use strict';
/* ---------- drawing the road's encounters (split from world/road.js, which keeps their rules: what each is, its pieces (roadPieces),
   how it moves and ends). The pictures of their people, riders, horses, the fallen, tents and props, and EncounterScene,
   which lays them out and draws them (ENC_SCENE: the map, the page's banner) ---------- */
/* its figures: an EncounterScene lays out each kind's pieces from its data (scene(e): [piece, which, dx, dy, opts], dx
   mirrored as it faces left: walk / stand (a person of ENC_LOOK, stepping as it moves), kneel (one kneeling), down (the fallen pose), soldier (a
   follower: a realm's colour, or a band's; down with blood: lying in a pool of it), refugee, worker, beast (a herd's animal), cart (the caravan's), bld (a tent, a
   shrine, a mine's head), prop, fire, cloth (a dicers' cloth, dice on it), wreck; rider (a person of ENC_LOOK on a horse: o.coat, in o.col),
   horse (saddled, no rider), carcass (a herd's beast lying dead), mud, oldcart (the caravan's cart left behind), embers (a fire
   burnt low, no flame), bedroll, basket (an herbalist's), barrier (a barked log on crossed stakes across a road, the realm's cloth tied round it); wisp, dust,
   smoke and notes (music) drawn live), each its feet at its point (o.at: at that point of the map, not with the encounter: one
   left behind as it runs), for the map (draw: each piece by its feet in the depth order, at the encounter's own place to the
   screen's pixel: subT) and for its page's banner (pics). The new kinds' pieces are stand-ins until the props of phase 3 */
function roadPerson(key,race,v,f){const k='rp'+key+race+v+f+(DRESS.clim||'');return spr[k]||(spr[k]=mapPerson(ENC_LOOK[key](race,v),f))}
function roadRider(key,race,v,f,col,coat){const k='rr'+key+race+v+f+col+coat;return spr[k]||(spr[k]=mapFigure({...ENC_LOOK[key](race,v),team:col||'leather'},f,coat||'horse'))}
// (a saddled horse with no rider: the map's horse, a saddle and its blanket on its back, a stirrup hanging)
function roadHorse(coat,f){const k='rh'+coat+f;if(spr[k])return spr[k];const g=pgrid(15,8),hs=drawMapHorse(g,coat,f,2,1),L=pal('leather'),R=pal('red');
  hs(3,1,L[2]);hs(4,1,L[1]);hs(5,1,L[1]);hs(6,1,L[2]);hs(4,2,R[1]);hs(5,2,R[2]);hs(4,3,'#27272c');g.edge=true;poutline(g);return spr[k]=cellOf(pcanvas(g))}
/* the scene's own things at the lab's scale (engine/worldflora.js's look: lit from the upper left, a few tones each, no black
   outline): each painted ENC_FINE px a game px (a px a fine px) and drawn figK() of its size as the figures are (dense: drawFig),
   so it stands as large as it did. n: its variant (encVar: the encounter's seed and the piece's place in it) */
const ENC_FINE=2;
const ENC_INK={earth:['#2a2018','#3a2c20','#4c3a2a','#5e4834','#74604a'],wet:['#5a5446','#7a7262'],stone:['#4a4842','#6c685e','#8e8a7c','#b0aa98','#cec8b4'],
  bark:['#30221a','#46321f','#5e442c','#78583a','#94704c'],end:['#a8804e','#d0aa78'],coal:'#241c18',ash:['#2e2824','#443c36','#5e564e','#7c7268'],ember:['#a83a1c','#d8602a','#f09a40','#ffd070'],
  wool:[['#4e4230','#6a5a3e','#8a7450','#a89068'],['#34442c','#4a5e3a','#62784a','#7e9462'],['#5a2a24','#7a3a30','#9a5040','#b86a54'],['#2e3a50','#40506a','#566a86','#7488a2'],['#4a4644','#66605a','#868078','#a69e92']],
  strap:['#4a3020','#c8a860'],wicker:['#5e4426','#7e5e36','#a07a48','#c09a60','#d8b878'],leaf:['#2e5424','#447a32','#5e9a40','#86ba58'],bloom:['#b07ac8','#f0d860','#e8e4d8'],cap:['#a87a4e','#d8b07c','#f0e6d4'],
  cloth:[['#5a2420','#7a3428','#9a4836','#b8624a'],['#24402e','#34583e','#487452','#62906a'],['#28324e','#384668','#4c5e86','#6a7ea2']],
  die:['#9a9488','#d8d2c2','#f6f2e6'],pip:'#2a2420',coin:['#8a6a20','#d8aa40','#f8de80'],white:['#a8a294','#dcd6c6','#f6f2e6'],
  blood:['#5a1414','#6e1a18','#8a2a22','#a8443a'],steel:['#6a727c','#a8b0b8','#e8eef0'],hilt:['#5a3a22','#8a6a20','#d8aa40'],smoke:[70,64,60],dust:[200,184,150]};
const encPic=(w,h,f)=>Object.assign(mkc(w,h,f),{dense:true});
const encVar=(e,dx,dy)=>((e.seed|0)*31+dx*7+dy*13+97)>>>0;
// (an ellipse's px about (cx, cy), radii rx, ry: fn(x, y, d), d its distance out, 0 the middle to 1 its rim, roughened by j)
function encOval(cx,cy,rx,ry,j,s,fn){for(let y=Math.floor(cy-ry-1);y<=cy+ry+1;y++)for(let x=Math.floor(cx-rx-1);x<=cx+rx+1;x++){const d=((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2+(hash(x,y,s)-.5)*j;if(d<1)fn(x,y,d)}}
// (one stone of a ring, three px by two, lit at its top left)
function encStone(g,x,y){const S=ENC_INK.stone;x=Math.round(x);y=Math.round(y);rect(g,S[2],x,y,3,2);rect(g,S[3],x,y,2,1);rect(g,S[4],x,y);rect(g,S[1],x+1,y+1,2,1);rect(g,S[0],x+2,y+1)}
// (a fire's ring of ten stones on 18 × 8 px, the back half, then what lies in it (mid), then the front half)
function encRing(g,mid){const ps=[...Array(10)].map((_,i)=>{const a=(i+.5)/10*Math.PI*2;return[9+Math.cos(a)*7.2-1.5,4.3+Math.sin(a)*2.4-1,Math.sin(a)]});
  for(const [x,y,s] of ps)if(s<0)encStone(g,x,y);mid();for(const [x,y,s] of ps)if(s>=0)encStone(g,x,y)}
// (a log lying across from x0 to x1 on rows y and y + 1, its bark lit on top, its cut ends pale)
function encLog(g,x0,x1,y){const B=ENC_INK.bark,E=ENC_INK.end;rect(g,B[3],x0,y,x1-x0+1,1);rect(g,B[1],x0,y+1,x1-x0+1,1);rect(g,B[4],x0+1,y);rect(g,E[1],x0,y);rect(g,E[0],x0,y+1);rect(g,E[0],x1,y,1,2)}
// a beast lying dead: its map figure on its back, legs up, in a pool of blood (the figure ENC_FINE times its px unless it is fine already)
function roadCarcass(id){const k='rpc'+id;if(spr[k])return spr[k];const s=critterSprite(id,0),f=s.dense?1:ENC_FINE,h=s.ch||s.height,w=s.width*f,H=h*f,B=ENC_INK.blood;
  return spr[k]=encPic(w,H+2,g=>{encOval(w/2,H-.5,Math.min(9,w/2-1),2,.3,7,(x,y,d)=>rect(g,d<.3?B[2]:d<.7?B[1]:B[0],x,y));rect(g,B[3],(w>>1)-3,H-2,2,1);
    g.save();g.translate(0,H);g.scale(f,-f);g.drawImage(s,0,s.height-h,s.width,h,0,0,s.width,h);g.restore()})}
// (kneeling: the standing figure with its thighs folded away, ENC_KNEEL rows from its hips, on the ground)
const ENC_KNEEL=3;
function roadKneel(key,race,v){const k='rpk'+key+race+v;if(spr[k])return spr[k];const s=roadPerson(key,race,v,0),w=s.width,h=s.height,c=h-6;
  return spr[k]=mkc(w,h-ENC_KNEEL,g=>{g.drawImage(s,0,0,w,c,0,0,w,c);g.drawImage(s,0,c+ENC_KNEEL,w,h-c-ENC_KNEEL,0,c,w,h-c-ENC_KNEEL)})}
// (a patch of mud: wet and dark in its middle, drier at its rim, two ruts through it, puddles catching the light; three shapes)
function roadMud(n){n%=3;const k='rpMud'+n;if(spr[k])return spr[k];const E=ENC_INK.earth,Wt=ENC_INK.wet;
  return spr[k]=encPic(32,8,g=>encOval(16,4.3,15-n,3.3+n*.2,.4,n+3,(x,y,d)=>{const lit=x<14&&y<4?1:x>20&&y>4?-1:0;
    rect(g,E[Math.max(0,Math.min(4,(d>.72?3:d>.4?2:1)+lit))],x,y);
    if((y===3||y===5)&&d<.8&&hash(x,y,n+9)<.7)rect(g,E[0],x,y);else if(d<.45&&hash(x,y,n+5)>.82)rect(g,Wt[y<4?1:0],x,y)}))}
// (lying: the figure turned a quarter, head to the right, as the battle's fallen are (sprites.js corpseOf), on the ground)
function roadDown(key,race,v,blood){const k='rpd'+key+race+v+(blood?'b':'');if(spr[k])return spr[k];if(blood){const b=roadDown(key,race,v);return spr[k]=mkc(16,16,g=>{rect(g,'#5a1414',3,13,10,1);rect(g,'#6e1a18',1,14,14,1);rect(g,'#8a2a22',5,14,5,1);rect(g,'#5a1414',3,15,10,1);g.drawImage(b,0,-1)})}
  const L=pturn(mapGrid(ENC_LOOK[key](race,v),0));let h=L.h;
  while(h>1&&!L.p.slice((h-1)*L.w,h*L.w).some(Boolean))h--;L.h=h+1;L.p.length=L.w*L.h;L.p.fill(null,h*L.w);L.edge=true;poutline(L);return spr[k]=cellOf(pcanvas(L))}
// (a building or an object: its model (engine/buildmodels.js) in the climate there, made ENC_FINE times finer (its detail), its
// shadow under it, the frost's snow on it; sd: its seed, which of its looks)
function roadBld(type,e,sd=e.seed%4){const c=climAt(e.x,e.y),k='rb'+type+sd+c;if(spr[k])return spr[k];
  const b=PX.buildingModel({type,seed:sd,env:c,snow:c==='frost'?1:0,glow:'#7fd8e8',detail:ENC_FINE});
  return spr[k]=encPic(b.img.width,b.img.height,g=>{g.globalAlpha=SHADOW.a;g.drawImage(b.shadow,0,0);g.globalAlpha=1;g.drawImage(b.img,0,0);if(b.snow)g.drawImage(b.snow.img,0,0)})}
const roadProp=(t,e,n)=>roadBld(t,e,n%3+1);
// (a fire's ring of stones, two logs crossed in its coals: its flame drawn live over it (drawFire))
function roadFire(n){n%=2;const k='rpFire'+n;return spr[k]||(spr[k]=encPic(18,8,g=>encRing(g,()=>{rect(g,ENC_INK.coal,5,3,8,3);encLog(g,4+n,12,3);encLog(g,6,13-n,2)})))}
// (a fire burnt down to its embers: the ring of stones round grey ash, a charred log and coals still glowing; no flame)
function roadEmbers(n){n%=3;const k='rpEmbers'+n;if(spr[k])return spr[k];const A=ENC_INK.ash,R=ENC_INK.ember;
  return spr[k]=encPic(18,8,g=>encRing(g,()=>{rect(g,A[1],5,3,8,3);rect(g,A[2],6,3,6,1);rect(g,A[3],7,3,2,1);rect(g,ENC_INK.coal,6+n,4,5,1);rect(g,A[0],5,5,8,1);
    for(let i=0;i<5;i++){const x=5+Math.floor(hash(i,n,11)*8),y=3+Math.floor(hash(i,n,12)*3);rect(g,R[i%R.length],x,y)}}))}
// (a bedroll left in the grass: a blanket rolled up and strapped, its end showing the roll; a wool of five)
function roadBedroll(n){n%=ENC_INK.wool.length;const k='rpBed'+n;if(spr[k])return spr[k];const R=ENC_INK.wool[n],S=ENC_INK.strap;
  return spr[k]=encPic(18,6,g=>{rect(g,R[3],2,1,12,1);rect(g,R[2],1,2,13,2);rect(g,R[1],1,4,13,1);rect(g,R[0],2,5,12,1);rect(g,R[3],2,2,4,1);
    rect(g,R[1],14,1,3,5);rect(g,R[3],15,2,1,3);rect(g,R[0],15,3);rect(g,R[2],16,2,1,3);rect(g,R[0],14,5,2,1);
    for(const x of [5,11]){rect(g,S[0],x,1,1,5);rect(g,S[1],x,3)}})}
// (an herbalist's basket: woven wicker under a looped handle, full of what she gathered: greens, flowers, or mushrooms)
function roadBasket(n){n%=3;const k='rpBasket'+n;if(spr[k])return spr[k];const W=ENC_INK.wicker,L=ENC_INK.leaf,F=ENC_INK.bloom,C=ENC_INK.cap;
  return spr[k]=encPic(12,10,g=>{for(const [x,y] of [[2,4],[2,3],[3,2],[4,1],[5,1],[6,1],[7,1],[8,2],[9,3],[9,4]])rect(g,y<2?W[3]:x<6?W[2]:W[1],x,y);
    for(let y=3;y<6;y++)for(let x=2;x<10;x++)if(hash(x,y,n)<.75)rect(g,L[Math.min(3,Math.floor(hash(x,y,n+4)*3)+(x<6?1:0))],x,y);
    if(n===1)for(const [x,y,c] of [[3,3,0],[6,3,1],[8,4,0],[5,4,2]])rect(g,F[c],x,y);
    if(n===2)for(const x of [3,7]){rect(g,C[1],x,3,2,1);rect(g,C[2],x,3);rect(g,C[0],x,4,2,1)}
    for(let y=5;y<10;y++)for(let x=1;x<11;x++){const e=y===5?4:y===9?0:((x>>1)+y)%2?2:3;rect(g,W[Math.max(0,e-(x>=8&&y>5?1:0)+(x<2&&y>5?1:0))],x,y)}
    rect(g,W[1],1,9);rect(g,W[1],10,9)})}
// (a toll's barrier, as a medieval road was barred (the owner, 2026-11-16: "Make sure all sprites are medieval theme not modern"): a
// barked log laid across on two pairs of crossed stakes, its end sawn, a strip of the toll's realm's cloth tied round its middle)
function roadBarrier(col){const k='rpBar'+col;if(spr[k])return spr[k];const C=PX.ramp(col),B=ENC_INK.bark,E=ENC_INK.end;
  return spr[k]=encPic(32,14,g=>{
    // (the stakes, crossed under the pole, lashed where they cross)
    for(const c of [6,25])for(let y=3;y<14;y++){const o=Math.round((y-6)*.55);rect(g,B[3],c-o,y);rect(g,B[1],c+o,y);if(y===6)rect(g,B[0],c-1,y,3,1)}
    // (the log: lit on top, dark under, bark streaks and a knot or two, its left end tapering, its right sawn and ringed)
    for(let x=1;x<31;x++){const kn=hash(x,1,col.length)<.08;rect(g,kn?B[1]:B[4],x,2);rect(g,hash(x,2,7)<.3?B[2]:B[3],x,3);rect(g,kn?B[0]:B[2],x,4);rect(g,B[1],x,5)}
    rect(g,B[3],0,3,1,2);rect(g,E[0],31,2,1,4);rect(g,E[1],31,3,1,2);
    // (the realm's cloth knotted round it, its ends hanging, one a little longer)
    rect(g,C[0],15,2,3,4);rect(g,C[1],16,2,1,4);for(let y=6;y<11;y++){rect(g,C[y%2?1:2],15,y);if(y<10)rect(g,C[y%2?2:1],17,y)}rect(g,C[0],15,11);rect(g,C[3]||C[2],16,3)})}
// (a gaming cloth spread on the ground, as the dicers' was: woven, a stripe worked along its border, fringed at its ends, two small
// bone dice on it and a few coins; a cloth of three)
function roadCloth(n){n%=6;const k='rpCloth'+n;if(spr[k])return spr[k];const C=ENC_INK.cloth[n%3],D=ENC_INK.die,M=ENC_INK.coin,die=(g,x,y)=>{rect(g,D[1],x,y,2,2);rect(g,D[2],x,y);rect(g,ENC_INK.pip,x+1,y+1)};
  return spr[k]=encPic(14,8,g=>{
    for(let y=1;y<8;y++)for(let x=1;x<13;x++)rect(g,(x+y*2)%5===0?C[2]:(x*3+y)%7===0?C[0]:C[1],x,y);
    for(let x=2;x<12;x++){rect(g,C[3],x,2);rect(g,C[3],x,6)}rect(g,C[0],1,7,12,1);
    for(let y=1;y<8;y++){if(y%2)continue;rect(g,C[2],0,y);rect(g,C[2],13,y)}
    const s=n>2?1:0;die(g,4+s,3);die(g,8-s,4-s);rect(g,M[1],10-s*6,5);rect(g,M[2],2+s*8,4)})}
// (the shadow under one standing on the ground, soft at its edge; crossed blades over a fight, as on the map's battles (fights.js),
// lit steel with gilt guards and a soft shadow of their own)
const encShadow=()=>spr.rpShade||(spr.rpShade=encPic(14,4,g=>encOval(7,2,7,2,0,0,(x,y,d)=>rect(g,'rgba(0,0,0,'+(.26*(1-d*.55)).toFixed(2)+')',x,y))));
function encBlades(){if(spr.rpBlades)return spr.rpBlades;const S=ENC_INK.steel,H=ENC_INK.hilt;
  const sword=(g,m,sh)=>{const P=(x,y,c)=>rect(g,sh||c,m?13-x:x,y);for(let i=1;i<9;i++){P(i,i,S[2]);P(i+1,i,S[1])}P(1,1,S[1]);for(const [x,y] of [[7,11],[8,10],[10,8],[11,7]])P(x,y,x<9?H[2]:H[1]);P(9,9,H[2]);P(10,10,H[0]);P(11,11,H[0]);P(12,12,H[1])};
  return spr.rpBlades=encPic(15,15,g=>{g.save();g.translate(1,1);sword(g,0,'rgba(20,16,12,.4)');sword(g,1,'rgba(20,16,12,.4)');g.restore();sword(g,0);sword(g,1)})}
// (in fine px about a point: dust kicked up round it (n puffs r ± dr out, y0 up, a0 how thick), a spark of steel on steel)
function encDust(t,n,r,dr,y0,a0){const D=ENC_INK.dust;for(let i=0;i<n;i++){const a=t*3+i*6.283/n,R=r+dr*Math.sin(t*5+i),x=Math.round(Math.cos(a)*R),y=Math.round(y0+Math.sin(a)*R*.5),s=2+i%3,al=Math.max(0,a0+.15*Math.sin(t*6.7+i));
  for(let j=-s;j<s;j++){const h=Math.round(Math.sqrt(s*s-(j+.5)**2));ctx.fillStyle='rgba('+(j<0?D.map(c=>c+20):D)+','+(al*(j<0?.8:1)).toFixed(2)+')';ctx.fillRect(x-h,y+j,2*h,1)}}}
function encSpark(x,y){rect(ctx,'rgba(255,214,130,.65)',x-1,y+1);rect(ctx,'#fff8d0',x,y)}
// (music: a note (one) or a pair beamed (two), pale with a soft shadow, its foot at (x, y))
function encNote(x,y,two){const L='#fff2c8',D='#c8a868',sh='rgba(30,20,10,.5)',pt=(c,o)=>{const q=(a,b,w=1,h=1)=>rect(ctx,c,x+a+o,y+b+o,w,h);
    if(two){q(1,-7,1,6);q(5,-7,1,6);q(1,-8,5,2);q(-1,-2,3,2);q(3,-2,3,2)}else{q(2,-8,1,7);q(3,-7);q(4,-6);q(0,-2,3,2)}};
  pt(sh,1);pt(L,0);rect(ctx,D,x+(two?5:2),y-1);if(two)rect(ctx,D,x+1,y-1)}
// (the caravan's cart without its ox and drover (caravans.js caravanSprite): left behind, its shafts on the ground, or, burnt, the
// burnt wagon: charred, its cover gone to its hoops; with the caravan's own, drawn at its guards' size (ROAD_ART: drawCaravanArt)
const roadCart=burnt=>caravanSprite('#8a7a5a',0,0,burnt?'burnt':'left');
const ROAD_FLIP=new WeakMap(),roadFlip=s=>{let c=ROAD_FLIP.get(s);if(!c){c=mkc(s.width,s.height,g=>{g.scale(-1,1);g.drawImage(s,-s.width,0)});ROAD_FLIP.set(s,c)}return c};
const ROAD_LIVE=['wisp','dust','smoke','notes','rustle'],ROAD_ART=['cart','oldcart','wreck'];
// (a piece's picture at the map's own size: the cart's and the battle-density figures' made so (caravanMapPic, people.js figPic))
const roadMapPic=p=>!p.s?null:ROAD_ART.includes(p.k)?caravanMapPic(p.s):p.s.dense?figPic(p.s):p.s;
// (a rustle in the trees where an ambush lies (the lure's, seen by Scouting): leaves that shake now and then, [dx, dy, colour]
// from its point in fine px, each two px across; v: a glint of steel among them too. Drawn over the trees: depth.js worldOverdraw's top)
const ROAD_RUSTLE=[[-7,-14,'#a6c85a'],[-5,-16,'#c4dc78'],[-2,-18,'#8ab84a'],[-1,-20,'#c4dc78'],[2,-12,'#c4dc78'],[3,-14,'#a6c85a'],[6,-16,'#8ab84a'],[7,-18,'#6e9a42'],
  [0,-22,'#a6c85a'],[1,-23,'#c4dc78'],[-4,-10,'#6e9a42'],[-3,-12,'#8ab84a'],[5,-9,'#6e9a42'],[-8,-17,'#6e9a42']];
class EncounterScene{
  // its pieces now: {k, s (the picture, null for one drawn live), x, y (its feet on the map), face, a, o}; still: standing (the banner)
  lay(e,still){const m=e.dir<0?-1:1,go=!still&&mapStepping(e),f=go?frameOf(e,WALK.foot,WALK.n):0,out=[];
    for(const [k,w,dx,dy,o={}] of roadPieces(e)){const fr=go&&!o.at?(f+(o.v||0)*3)%WALK.n:0;
      out.push({k,s:ROAD_LIVE.includes(k)?null:dressedIn(dressClimAt(e.x,e.y),()=>this.pic(k,w,e,o,fr,go&&!o.at,encVar(e,dx,dy))),x:o.at?o.at[0]:e.x+dx*m,y:o.at?o.at[1]:e.y+dy,face:(o.face||1)*(o.at?1:m),a:o.a??1,o})}
    return out}
  pic(k,w,e,o,f,go,n=0){const r=e.race||'human',v=o.v||0;
    if(figsOn()){const s=this.fig(k,w,r,v,o,figPose(f,go));if(s)return s}
    return k==='walk'?roadPerson(w,r,v,f):k==='stand'?roadPerson(w,r,v,0):k==='kneel'?roadKneel(w,r,v):k==='down'?roadDown(w,r,v,o.blood):k==='soldier'?followerSprite(o.col||ENC_RAIDER,f,v,r,o.band):k==='refugee'?refugeeSprite(f,v):
      k==='worker'?workerSprite(w,f,r,v):k==='beast'?critterSprite(w,f):k==='cart'?caravanSprite(o.col||'#8a7a5a',f?1+f%CARAVAN_ART.steps:0,f%CARAVAN_ART.turns):k==='bld'?roadBld(w,e):k==='prop'?roadProp(w,e,n):k==='fire'?roadFire(n):k==='cloth'?roadCloth(n):k==='wreck'?roadCart(1):
      k==='rider'?roadRider(w,r,v,f,o.col,o.coat):k==='horse'?roadHorse(o.coat||'horse',f):k==='carcass'?roadCarcass(w):k==='mud'?roadMud(n):k==='oldcart'?roadCart(0):k==='embers'?roadEmbers(n):k==='bedroll'?roadBedroll(n):k==='basket'?roadBasket(n):k==='barrier'?roadBarrier(o.col||roadCol(e)):null}
  // (its people as the battle's figures, at the marchers' size (people.js MAP_FIGS; p: its pose, figPose); null: none of them)
  fig(k,w,r,v,o,p){return k==='walk'?figRoad(w,r,v,p):k==='stand'?figRoad(w,r,v,0):k==='kneel'?figKneel(w,r,v):k==='down'?figDown(w,r,v,o.blood):k==='soldier'?figFollower(o.col||ENC_RAIDER,v,r,o.band,p):
    k==='refugee'?figRefugee(v,'human',p):k==='worker'?figWorker(w,r,v,p):k==='rider'?figRider(w,r,v,o.col,o.coat,p):k==='horse'?figHorse(o.coat||'horse',p):null}
  // the box it covers on the map [x0, y0, x1, y1] (a click anywhere on it, the highlights round it; not what it left behind)
  box(e){let b=null;for(const p of this.lay(e,true)){if(p.o.at)continue;const s=roadMapPic(p),w=s?s.width:12,h=s?(s.ch||s.height):12,x0=Math.round(p.x)-(w>>1),y0=Math.round(p.y)+1-h;
    b=b?[Math.min(b[0],x0),Math.min(b[1],y0),Math.max(b[2],x0+w),Math.max(b[3],p.y+1)]:[x0,y0,x0+w,p.y+1]}
    return b||[e.x-6,e.y-12,e.x+6,e.y+2]}
  // onto the frame's list, each piece by its feet (a trace fading over its last six hours)
  draw(e,ents,cam){const fade=e.trace?clamp((e.end-roadNow())/6,0,1):1,t=performance.now()/1000,rm=reducedMotion();
    for(const p of this.lay(e,false))ents.push({x:p.x,y:p.y,top:p.k==='rustle',f:()=>{if(!p.o.at)subT(e);const X=Math.round(p.x-cam.x),Y=Math.round(p.y-cam.y);ctx.globalAlpha=p.a*fade;
      if(ROAD_LIVE.includes(p.k)){ctx.save();ctx.translate(X,Y);ctx.scale(1/ENC_FINE,1/ENC_FINE);this.live(p,e,t,rm);ctx.restore()}
      else{const s=p.s;if(['walk','stand','kneel','soldier','refugee','worker','beast'].includes(p.k))drawFig(encShadow(),X,Y,1);
        if(ROAD_ART.includes(p.k))drawCaravanArt(s,X,Y,p.face);else if(s.dense)drawFig(s,X,Y,p.face);else{ctx.save();ctx.translate(X,Y);if(p.face<0)ctx.scale(-1,1);ctx.drawImage(s,-(s.width>>1),1-s.height);ctx.restore()}
        if(p.k==='fire'){drawFire(X,Y-1,e.seed);if(!FLAMES.on)LIGHTQ.push({x:X,y:Y-3,r:22})}}// (as it burns, the fire queues its own light: fire.js fireCamp)
      ctx.globalAlpha=1}})}
  // (a piece drawn live, in fine px about its feet: a bog's lights, a fight's dust and blades, music, a rustle, smoke)
  live(p,e,t,rm){const v=p.o.v||0;
    if(p.k==='wisp'){const ph=e.seed%7+v*2.1,x=rm?0:Math.round(Math.sin(t*.9+ph)*6),y=-12+(rm?0:Math.round(Math.sin(t*1.7+ph)*4)),g=ctx.createRadialGradient(x,y,0,x,y,14);
      g.addColorStop(0,'rgba(170,255,235,.55)');g.addColorStop(1,'rgba(120,230,220,0)');ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(x-14,y-14,28,28);ctx.restore();
      rect(ctx,'rgba(200,255,240,.6)',x-2,y-1,5,3);rect(ctx,'rgba(200,255,240,.6)',x-1,y-2,3,5);rect(ctx,'#c8fff0',x-1,y-1,3,3);rect(ctx,'#ffffff',x,y-1);
      if(!rm){const q=(t*.8+ph)%1;ctx.globalAlpha*=1-q;rect(ctx,'#c8fff0',x-Math.round(Math.sin(t*.9+ph)*3),y+3+Math.round(q*5))}}
    else if(p.k==='dust'){encDust(t,7,10,4,-8,.42);ctx.drawImage(encBlades(),-7,-39);// (crossed blades over it, as a fight on the map has)
      if(Math.floor(t*8)%3===0)encSpark(Math.round(Math.sin(t*13)*10),-12-Math.round((1+Math.sin(t*7))*6))}
    else if(p.k==='notes'){const a=ctx.globalAlpha;for(let i=0;i<2;i++){const q=((rm?0:t*.6)+i/2)%1;ctx.globalAlpha=a*(1-q);encNote(-7+i*10+Math.round(Math.sin(q*6.3+i)*4),-30-Math.round(q*18),i===1)}}
    else if(p.k==='rustle'){const ph=e.seed%7*.13,sh=!rm&&(t*.6+ph)%1<.45;
      for(const [dx,dy,c] of ROAD_RUSTLE)rect(ctx,c,dx+(sh?Math.round(Math.sin(t*19+dx*1.7)*2):0),dy+(sh?Math.round(Math.sin(t*23+dy)*1.2):0),2,1);
      if(v&&(rm||(t*.45+ph)%1<.14)){rect(ctx,'rgba(255,246,216,.45)',2,-20,5,1);rect(ctx,'rgba(255,246,216,.45)',4,-22,1,5);rect(ctx,'#fff6d8',4,-20)}}// (the glint: they are there, and armed)
    else if(p.k==='smoke'){const C=ENC_INK.smoke;for(let i=0;i<4;i++){const q=((rm?0:t*.35)+i/4)%1,z=2+Math.round(q*4),x=Math.round(Math.sin(q*5+i)*4)-(z>>1),y=-Math.round(q*24)-z;
      ctx.fillStyle='rgba('+C+','+(.45*(1-q)).toFixed(2)+')';ctx.fillRect(x,y+1,z,z-2);ctx.fillRect(x+1,y,z-2,z);ctx.fillStyle='rgba('+C.map(c=>c+40)+','+(.3*(1-q)).toFixed(2)+')';ctx.fillRect(x+1,y+1,1,1)}}}
  // its pictures for the page's banner: [picture, x, y (top left, map px), alpha], a fire's flame and the lights as they stand
  pics(e){const out=[];for(const p of this.lay(e,true)){
    if(p.s){const s=roadMapPic(p);out.push([p.face<0?roadFlip(s):s,Math.round(p.x)-(s.width>>1),Math.round(p.y)+1-s.height,p.a])}
    if(p.k==='fire'){const fl=campFlame();out.push([fl.img,Math.round(p.x)-fl.ax,Math.round(p.y)-1-fl.ay])}
    if(p.k==='wisp')out.push([spr.rpWisp||(spr.rpWisp=mkc(5,5,g=>{rect(g,'rgba(150,240,225,.45)',0,1,5,3);rect(g,'rgba(150,240,225,.45)',1,0,3,5);rect(g,'#c8fff0',1,1,3,3);rect(g,'#ffffff',2,1)})),Math.round(p.x)-2,Math.round(p.y)-8])}
    return out}
}
const ENC_SCENE=new EncounterScene();
