'use strict';
/* ---------- PX engine: the Ashgor Horde's buildings (the orcs; buildmodels.js PX.registerBuildStyle) ---------- */
// The owner's doc (doc/references/assets/REALM_STRUCTURE_ART_DESIGN.md, Ashgor Horde, and its picture
// ashgor-orc-yurt-structures-reference.png): mobile, repairable, defensible; felt, hide, heavy timber, earth, horn and bone; round
// yurt crowns, low palisades, wagon roofs; oxblood red and black; wagon wheels, smoke crowns, clan bands, earth berms. A clan carries
// much of its settlement with it, so its camps and its towns are of one kit.
// Built (2026-10-22): every type, work place, cluster and tier's centre in that kit. Its homes family yurts (round felt walls under a
// low hide cone, the smoke crown, a red-and-black clan band with a horned skull over a timber door hung with felt, a cooking yard);
// its halls the chief's yurt (a raised crown, standards, trophy poles, fire pits, meeting mats); its work under hide awnings and
// wagon roofs (vaults) on rough logs; its walls sharpened palisades on earth berms, log watch platforms, timber gates. Climates
// (look.yurt by climate): the desert's sun-bleached hide roofs over earth-and-dung walls, wide shade awnings, water skins and
// gourds; the frost's thick felt skirt and fur door flaps (the snow settles on the crowns); the swamp's raised plank floors and reed
// mats. Its banners are its own oxblood today (stage 3: the owner's colour).
(function(PX){
  const {house,piece,made,prop:P,fire}=PX.planKit;
  /* the Horde's own colours, decal letters and decals (model.js, through PX.MODEL_EXTRA) */
  // oxblood red and black (the clan band, doors, banners, mats), fur (the frost's door flaps)
  const MATS={ashgorOx:['#cc5a4c','#9e3834','#70262a','#481b20'],ashgorBlack:['#5e5658','#403a3e','#2b262a','#1b181c'],ashgorFur:['#cfc0a4','#a08e72','#736250','#4c4036']};
  const LET={'+':['ashgorOx',1],'*':['ashgorOx',2],'=':['ashgorBlack',1],'^':['bone',0],'`':['bone',2],'~':['ashgorFur',1],':':['ashgorFur',2]};
  // (the rows are written in these ASCII letters and mapped, as registered, to the Horde's own characters, so no other culture's
  // letter can clash: the Vale's = + * ~ were the same)
  const OWN={'+':'①','*':'②','=':'③','^':'④','`':'⑤','~':'⑥',':':'⑦'};
  const ownRow=r=>[...r].map(ch=>OWN[ch]||ch).join(''),ownLetters=L=>Object.fromEntries(Object.entries(L).map(([k,v])=>[OWN[k]||k,v]));
  // a timber door hung with an oxblood felt curtain, a black band across it; the frost's with a fur flap over it (and their feet, on a
  // yurt's skirt); a felt flap window; a horned skull; the clan band's black zigzag on its red ring (BandAsh, a quarter of the ring a
  // side), and on a flat wall all of it (BandAshW); a timber gate of two braced leaves; an open hearth's glowing mouth
  const DOOR=['.ttt.','t+*+t','t+*+t','t+*+t','t===t','t+*+t','t+*+t','t+*+t','ppppp'],FUR=['.ttt.','t~~~t','t~:~t','t:~:t','t~~~t','t+*+t','t+*+t','t+*+t','ppppp'];
  const rowsOf=(w,fs)=>fs.map(f=>Array.from({length:w},(_,i)=>f(i)).join(''));
  const zig=w=>rowsOf(w,[i=>i%4===0?'=':'.',i=>i%4===2?'=':'.',()=>'=']),zigW=w=>rowsOf(w,[i=>i%4===0?'=':'+',i=>i%4===2?'=':'+',()=>'=']);
  const gate=(w,h)=>rowsOf(w,Array.from({length:h},(_,r)=>c=>{const m=w>>1,y=h-2-r;if(r===h-1)return'p';if(r===0||c===0||c===w-1||c===m-1||c===m||r===2)return't';
    const lc=c<m?c-1:w-2-c;return lc===Math.round(y*(m-3)/(h-4))?'t':c%2?'d':'e'}));
  const DECALS={DoorAsh:DOOR,DoorAshFur:FUR,DoorAshLo:DOOR.slice(-5),DoorAshFurLo:FUR.slice(-5),WinAsh:['tttt','tGgt','tttt'],SkullAsh:['^...^','^^^^^','.=^=.','..`..'],
    BandAsh:zig(48),BandAshS:zig(24),BandAshW:zigW(64),GateAsh:gate(12,13),GlowAsh:['.lllll.','l#ooo#l','lOOOOOl','ppppppp']};

  /* the pieces of the kit */
  const yd=o=>o.look.yurt;
  // a yurt: round walls of felt (look.yurt.felt; the desert's earth and dung) under a low cone of hide, its smoke crown (a timber ring
  // round the smoke hole) and the ropes down its roof, the clan band (an oxblood ring under the eaves, its black zigzag, a horned skull
  // over the door), its timber door, felt flap windows; the frost's thick felt skirt and the swamp's reed mats round its foot; the
  // swamp's (or on stilts) a raised plank floor. s: {n, c, r, z, rise, felt, roof, dw, door (at), wins, band (false: none), crown,
  // rib}; returns its walls' height, rise and top
  function yurt(Q,o,s){const Y=yd(o),n=s.n||'y',c=s.c||[0,0],r=s.r||9,z=s.z||13,rise=s.rise||Math.round(r*.55),felt=s.felt||Y.felt||o.wall,roof=s.roof||o.roofMat,dw=s.dw,L=Q.lift;
    if((Y.deck||o.stilts)&&!s.ground){Q.round(n+'dk',c,r+1.6,[0,2],'plank',{form:'lid',mat:'plank'});for(const a of [-1,1])Q.box(n+'dp'+a,[c[0]+a*r*.7-1,c[0]+a*r*.7+1],[c[1]+r+.6,c[1]+r+2.6],[0,1],'log',{top:true});Q.lift=L+2}
    Q.round(n,c,r,[0,z],felt,{form:'cone',rise,mat:roof,o:1},{dw});
    const dk=Y.fur?'DoorAshFur':'DoorAsh',at=s.door==null?.5:s.door;if(s.door!==false)Q.dec(n+'.S',dk,at);
    if(Y.skirt){Q.round(n+'k',c,r+.45,[0,Y.skirtZ],Y.skirt,null,{dw});if(s.door!==false)Q.dec(n+'k.S',dk+'Lo',at)}
    if(s.wins!==false)for(const k of ['E','W','N'])Q.dec(n+'.'+k,'WinAsh',.5,Math.min(5,z-8));
    if(s.band!==false&&Y.band){const b0=z-5;Q.round(n+'b',c,r+.3,[b0,z-1],Y.band,null,{dw});if(s.door!==false)Q.dec(n+'b.S','SkullAsh',at,0);for(const k of ['S','E','W','N'])Q.dec(n+'b.'+k,r>=7?'BandAsh':'BandAshS',.5,0)}
    // (the smoke crown: a ring of timber round the cone's top, the smoke hole dark in it; ropes down the roof from it to the eave)
    if(s.crown!==false){const rc=Math.max(1.6,r*.24),zc=z+rise*(1-rc/(r+1));Q.round(n+'c',c,rc,[zc-1,z+rise+1],'timber',{form:'lid',mat:'dark'},{dw});
      for(let k=0;k<8;k++){const a=(k+.5)*Math.PI/4,ca=Math.cos(a),sa=Math.sin(a);Q.beam(n+'r'+k,[c[0]+ca*(rc+.6),c[1]+sa*(rc+.6),zc],[c[0]+ca*(r+.6),c[1]+sa*(r+.6),z],s.rib||'timber',1)}}
    Q.lift=L;return{z,rise,top:z+rise+1+L,r}}
  // the chief's raised crown on a great yurt: a drum of felt over the smoke ring, its own little cone and crown, bone horns
  function raised(Q,o,n,c,y,R){const Y=yd(o),z0=y.top-2,rc=R||3.5;Q.round(n+'d',c,rc,[z0,z0+3],Y.felt||o.wall,{form:'cone',rise:3,mat:o.roofMat,o:1});Q.round(n+'dc',c,1.6,[z0+4,z0+6],'timber',{form:'lid',mat:'dark'});
    for(const s of [-1,1])Q.cut(n+'h'+s,c[0]+s*(rc+.5)-1,c[1]-1,z0+1,s<0?['b.','bb','.b']:['.b','bb','b.'],{b:'bone'},{dv:2})}
  // a pole 2 px square with the clan's banner (oxblood, black stripes, its tail cut) hanging from its crossbar, to side s
  const standard=(Q,n,u,v,h,s)=>{Q.box(n,[u-1,u+1],[v-1,v+1],[0,h],'timber',{top:true,fine:true});
    Q.cut(n+'f',s>0?u+1:u-5,v-.5,h-8,['ttttt','+++++','++=++','+++++','++=++','+++++','+.+.+'].map(r=>s>0?r:r.split('').reverse().join('')),{t:'timber','+':'ashgorOx','=':'ashgorBlack'},{dv:1})};
  // a trophy pole: a post 2 px square, a horned skull of bone on it
  const trophy=(Q,n,u,v,h)=>{Q.box(n,[u-1,u+1],[v-1,v+1],[0,h],'timber',{top:true,fine:true});Q.cut(n+'s',u-2,v-1,h-1,['b..b','bbbb','.bb.'],{b:'bone'},{dv:2})};
  // a meeting mat on the ground (oxblood, a black border), flat
  const rug=(Q,n,u,v)=>Q.box(n,u,v,[0,1],'ashgorBlack',{top:true,topMat:'ashgorOx',thin:true,flat:true});
  // an awning of hide on two posts before a wall (u, v its plan, z its front edge's height)
  const awning=(Q,n,u,v,z,mat)=>{const [u0,u1]=u,[v0,v1]=v;for(const a of [u0,u1-1.5])Q.box(n+'p'+a,[a,a+1.5],[v1-1.5,v1],[0,z],'timber',{top:true});
    Q.box(n,[u0,u1],[v0,v1],[z,z+1],mat,{thin:true,keep:1});Q.roof(n,'shed','u',2,mat,{o:1,ov:0})};
  // water skins and a gourd hung on a post, a water jar (the desert's)
  const skins=(Q,n,u,v)=>{Q.box(n,[u-1,u+1],[v-1,v+1],[0,7],'timber',{top:true});Q.round(n+'a',[u+1.6,v],1.4,[3,6],'hide',{form:'lid',mat:'hide'});Q.round(n+'b',[u-1.6,v],1.2,[2,5],'gold',{form:'lid',mat:'gold'});
    Q.round(n+'j',[u+2,v+3],1.6,[0,3],'adobe',{form:'water'})};
  // the climate's extras by a building's door (at c, r its half width): the desert's wide shade awning and its skins
  function yardOf(Q,o,c,r,side){const Y=yd(o);if(Y.awning)awning(Q,'aw',[c[0]-r*.75,c[0]+r*.75],[c[1]+r-1,c[1]+r+4],7,Y.awning);if(Y.skins)skins(Q,'sk',c[0]+(side||1)*(r+2),c[1]+r*.4)}
  // a cooking fire: the pit, its pot, a log to sit on
  const hearth=(Q,n,u,v)=>{Q.prop('firepit',[u,v],0,1.6);Q.box(n+'pt',[u-1,u+1],[v-1,v+1],[2,4],'iron',{top:true,topMat:'dark'});Q.prop('logs',[u,v+4],0,.8)};
  // a covered wagon along u: its bed, a cover vaulted on its hoops, two wheels, the shaft (motif: the wagon wheel)
  const wagon=(Q,n,u,v,cov)=>{Q.box(n,[u-4.5,u+4.5],[v-2.5,v+2.5],[2,5],'plank',{top:true});Q.box(n+'c',[u-4,u+3],[v-2.5,v+2.5],[5,6],cov,{keep:1,thin:true});Q.roof(n+'c','vault','u',4,cov,{o:0,ov:0,lip:1});
    Q.wheel(n+'w0',u-2.5,v+2.5,2.5,2.5);Q.wheel(n+'w1',u+2.5,v+2.5,2.5,2.5);Q.box(n+'s',[u+4.5,u+8],[v-.5,v+.5],[2,3],'timber',{top:true})};
  // a weapon rack: two posts, a bar, spears up it (their iron heads a row)
  const rack=(Q,n,u,v)=>Q.cut(n,u-4,v,0,['i.i.i.i.','tttttttt','t.t.t.tt','t.t.t.tt','tt.....t','tt.....t'],{t:'timber',i:'iron'},{dv:2});
  // a drum of hide on its frame
  const drum=(Q,n,u,v)=>Q.round(n,[u,v],2,[0,4],'ashgorOx',{form:'lid',mat:'hide'});
  // a run of palisade from (u0, v0) to (u1, v1), straight along u or v, t thick, h high: sharpened stakes, their points a row of teeth;
  // on an earth berm (a bank before and behind it, grassed but in the desert) when berm
  function stakes(Q,o,n,u,v,h,berm){const al=u[1]-u[0]>=v[1]-v[0],len=al?u[1]-u[0]:v[1]-v[0],t=al?v[1]-v[0]:u[1]-u[0];
    if(berm){const e=3;Q.box(n+'e',al?u:[u[0]-e,u[1]+e],al?[v[0]-e,v[1]+e]:v,[0,1],'soil',{keep:1});Q.roof(n+'e','gable',al?'u':'v',3,'soil',{keep:1,o:0,ov:0,lip:0,moss:o.env==='desert'?0:.55})}
    Q.box(n,u,v,[0,h],'stakes',{top:true,topMat:'log'});Q.cut(n+'t',al?u[0]:v[0],al?v[0]:u[0],h,[Array.from({length:Math.floor(len)},(_,i)=>i%2?'.':'l').join('')],{l:'log'},{dv:t,alongV:!al})}
  // a log watch platform at c, its deck H up: four tall posts braced, a railing of stakes, a felt hut on it under a hide roof with its
  // band, its hatch, a ladder up the front
  function platform(Q,o,n,c,H,dw){const Y=yd(o),[cu,cv]=c,U=a=>cu+a,V=b=>cv+b;
    for(const [a,b] of [[-5,-5],[5,-5],[-5,5],[5,5]])Q.box(n+'p'+a+b,[U(a-1),U(a+1)],[V(b-1),V(b+1)],[0,H],'log',{top:true,dw});
    Q.beam(n+'xs',[U(-4),V(5),1],[U(4),V(5),H-2],'timber');Q.beam(n+'xn',[U(4),V(-5),1],[U(-4),V(-5),H-2],'timber');Q.beam(n+'xe',[U(5),V(4),1],[U(5),V(-4),H-2],'timber');Q.beam(n+'xw',[U(-5),V(-4),1],[U(-5),V(4),H-2],'timber');
    Q.box(n+'dk',[U(-7),U(7)],[V(-7),V(7)],[H,H+1],'plank',{top:true,thin:true,dw});for(const [k,u,v] of [['rw',[-7,-6],[-7,7]],['re',[6,7],[-7,7]],['rn',[-7,7],[-7,-6]]])Q.box(n+k,u.map(U),v.map(V),[H+1,H+3],'stakes',{top:true,topMat:'log'});
    Q.box(n+'h',[U(-4),U(4)],[V(-4),V(3)],[H+1,H+7],Y.felt||'plank',{dw});Q.roof(n+'h','gable','v',4,o.roofMat,{lip:2,finial:1,fmat:'bone'});if(Y.band)Q.dec(n+'h.S','BandAshW',.5,3);
    Q.dec(n+'h.S','Hatch',.5,1);for(const k of ['E','W','N'])Q.dec(n+'h.'+k,'Slit',.5,2);Q.cut(n+'ld',U(-1.5),V(7),0,Array.from({length:H},(_,i)=>i%2?'t.t':'ttt'),{t:'timber'},{dv:2})}
  // an earth mound (r round, h high): rough, its top grassed but in the desert
  const mound=(Q,o,n,c,r,h)=>Q.round(n,c,r,[0,h],'soil',{form:'lid',mat:o.env==='desert'?'soil':'moss'},{rough:.3,rs:o.seed});
  // a square block of w at c (a tower's body: Plan.square always roofs)
  const sq=(Q,n,c,w,z,mat,x)=>Q.box(n,[c[0]-w/2,c[0]+w/2],[c[1]-w/2,c[1]+w/2],z,mat,x);
  // a log tower of a wall: a square of logs, a jutting plank gallery, a hide pyramid over it, a slit
  function logTower(Q,o,n,c,w,h){sq(Q,n,c,w,[0,h],'log');Q.square(n+'g',c,w+2,[h,h+4],'plank',{form:'pyramid',rise:4,mat:o.roofMat,o:1});Q.dec(n+'g.S','Slit',.5,0);Q.dec(n+'.S','Slit',.5,Math.round(h*.6))}
  // the Horde's walls round u0..u1, v0..v1 by fortification: 1 a palisade of sharpened stakes, log towers at its corners; 2 on an earth
  // berm, taller; 3 taller again, a tower halfway along each side; the gate on the middle of the front between two log towers, a
  // walk over it, its braced timber leaves; k the scale (2 a capital's)
  function walls(Q,o,u0,u1,v0,v1,fort,k){const h=Math.round((fort>=3?12:fort>=2?10:8)*(k>1?1.3:1)),t=2,gw=10,berm=fort>=2,th=h+4;
    stakes(Q,o,'wN',[u0,u1],[v0,v0+t],h,berm);stakes(Q,o,'wW',[u0,u0+t],[v0,v1],h,berm);stakes(Q,o,'wE',[u1-t,u1],[v0,v1],h,berm);
    stakes(Q,o,'wS0',[u0,-gw/2-3],[v1-t,v1],h,berm);stakes(Q,o,'wS1',[gw/2+3,u1],[v1-t,v1],h,berm);
    const tw=5+k;for(const [n,c] of [['tNW',[u0+2,v0+2]],['tNE',[u1-2,v0+2]],['tSW',[u0+2,v1-2]],['tSE',[u1-2,v1-2]]])logTower(Q,o,n,c,tw,th);
    if(fort>=3)for(const [n,c] of [['tW',[u0+2,(v0+v1)/2]],['tE',[u1-2,(v0+v1)/2]],['tN',[(u0+u1)/2,v0+2]]])logTower(Q,o,n,c,tw,th);
    for(const s of [-1,1])logTower(Q,o,'gt'+s,[s*(gw/2+3),v1-3],6,th+2);
    Q.box('gw',[-gw/2,gw/2],[v1-4,v1-2],[h,h+2],'log',{top:true,topMat:'plank'});Q.box('gl',[-gw/2,gw/2],[v1-2,v1-1],[0,h],'plank',{thin:true});Q.dec('gl.S','GateAsh',.5);Q.marks.gate=[0,v1,0]}

  // a hide shelter open to the front (a stable's, a pen's): a back wall of logs with its door, log posts, a hide roof sloping to the
  // front, hay inside, a trough before it
  function shelter(Q,o,n,c,w,d,z,kind,role){const dw=Q.home(kind,role),[cu,cv]=c,h=w/2,v0=cv-d/2,v1=cv+d/2;Q.box(n,[cu-h,cu+h],[v0,v0+2],[0,z],'log',{dw});Q.dec(n+'.N','DoorAsh',.5);
    Q.box(n+'t',[cu+h-7,cu+h],[v0+2,v1],[0,z-1],'log',{dw});Q.dec(n+'t.S','DoorAsh',.5);
    for(const a of [-h,(-h+h-7)/2-.75])Q.box(n+'p'+a,[cu+a,cu+a+1.5],[v1-1.5,v1],[0,z-1],'log',{top:true,dw});Q.box(n+'r',[cu-h,cu+h],[v0,v1],[z-1,z],'log',{thin:true});Q.roof(n+'r','shed','u',3,o.roofMat,{o:1,ov:1,hi:'b0'});
    Q.prop('hay',[cu-h*.5,v0+5],0,1.4);Q.prop('hay',[cu,v0+5],0,1.2);Q.prop('trough',[cu-h*.3,v1+3],0,1.5)}
  // a tether line: two posts, a rope between them
  const tether=(Q,n,u0,u1,v)=>{for(const a of [u0,u1-2])Q.box(n+a,[a,a+2],[v-1,v+1],[0,6],'log',{top:true});Q.box(n+'r',[u0+1,u1-1],[v-.5,v+.5],[4,5],'rope',{thin:true})};
  // a tanning frame: a square of poles, a hide stretched in it
  const tanning=(Q,n,u,v)=>Q.cut(n,u-4,v,0,['tttttttt','thhhhhht','thhhhhht','thhhhhht','thhhhhht','t......t','t......t'],{t:'timber',h:'hide'},{dv:1});
  // a vat: a great tub of staves hooped, its lid
  const vat=(Q,n,u,v,r)=>{Q.round(n,[u,v],r,[0,6],'plank',{form:'lid',mat:'plank'});Q.dec(n+'.S','Hoop',.5,1);Q.dec(n+'.S','Hoop',.5,4)};
  // in a cluster: a plan made in the cluster's own frame; a log fence; a family yurt (two households)
  const here=(C,f)=>made(C,[0,0],0,f),logFence=(C,n,pts,gates)=>C.Q.parts.push({k:'fence',name:n,pts,gates,h:5,mat:'log'});
  const famYurt=(C,at,face,r,x)=>made(C,at,face,Q=>yurt(Q,Q.o,Object.assign({r,z:12,dw:Q.home('yurt','home',1,2)},x||{})));

  PX.registerBuildStyle('ashgor',{
    // the style table (buildmodels.js LOOK0 its shape)
    look:{people:'orc',
      roof:'hide',rural:null,walls:['canvas'],frame:null,stone:'stone',fort:'log',fieldstone:'stone',wood:'log',silo:'hide',felt:'canvas',
      trim:'ashgorBlack',accent:'ashgorOx',ground:null,
      forms:['gable','gable','front','hip'],cones:true,hall:'chiefyurt',door:'DoorAsh',win:'WinAsh',finial:'bone',
      village:{form:'vault',wall:'log',chim:false,goods:['woodpile','hay']},
      hidehall:{wall:'canvas'},
      // the yurt's say: its felt, its band, a skirt round its foot (and how high), a raised floor, a shade awning and water skins by its
      // door, fur flaps; the climates': the desert's sun-bleached hide roofs over earth and dung, wide awnings, skins; the frost's thick
      // felt skirt and fur flaps; the swamp's raised floors and reed mats
      yurt:{felt:'canvas',band:'ashgorOx',skirt:null,skirtZ:0,deck:false,awning:null,skins:false,fur:false},
      desert:{roof:'canvas',wall:'mud',yurt:{felt:'mud',awning:'canvas',skins:true}},
      swamp:{yurt:{skirt:'net',skirtZ:5,deck:true}},
      frost:{yurt:{skirt:'hide',skirtZ:5,fur:true}}},
    materials:MATS,letters:ownLetters(LET),decals:Object.fromEntries(Object.entries(DECALS).map(([k,rows])=>[k,rows.map(ownRow)])),
    // its own types (any culture can build them; their plan the generic)
    own:{types:{
      // a family yurt (the Horde's home): the yurt, its cooking yard to one side (a fire pit and its pot, a log to sit on, a woodpile, a
      // barrel); better levels a hide awning over the yard, then the clan's standard
      yurt:{cell:32,dwellings:2,look:{felt:null,band:null,skirt:null,skirtZ:0,deck:false,awning:null,skins:false,fur:false},plan(Q,o){const d=o.d,dw=Q.home('yurt'),s=d.chance(.5)?1:-1,c=[-s*3,-2];
        yurt(Q,o,{c,r:8.5,dw});hearth(Q,'ck',s*10,6);Q.prop(d.pick(['woodpile','logs']),[s*11,-6],1,1.5);Q.prop('barrel',[-s*11,7],0,1.5);
        if(o.lv>=2)awning(Q,'ya',[s*10-4,s*10+4],[2,9],7,'hide');if(o.lv>=3)standard(Q,'st',-s*12,-8,16,s);yardOf(Q,o,c,8.5,-s)}},
      // a hide hall (the Horde's long hall, three households): a vaulted hall of felt between two round ends under cones of hide, each
      // end's smoke crown, the clan band along it, its door and skull in the middle, bone horns at the vault's ends, a totem by it
      hidehall:{cell:32,dwellings:3,long:'a hall long and low between its round ends',look:{wall:null},plan(Q,o){const dw=Q.home('hidehall','home'),wall=o.look.hidehall.wall||o.wall,Y=yd(o);
        house(Q,{w:16,d:13,z:11,form:'vault',rise:7,wall,dw,door:.5,doorKind:Y.fur?'DoorAshFur':o.look.door,wins:0,chim:false,o:1,foot:false});if(Y.band)Q.dec('h.S','BandAshW',.5,6);
        for(const s of [-1,1]){yurt(Q,o,{n:'e'+s,c:[s*8,0],r:6.5,z:11,rise:5,dw,door:false,band:false,ground:true});Q.cut('hn'+s,s*7-1.5,-1,18,['b.b','b.b','.b.'],{b:'bone'},{dv:2})}
        Q.prop('totem',[12,10]);yardOf(Q,o,[0,0],6.5)}},
      // a log watch platform: four tall posts braced, a deck, a felt hut on it under its hide roof, a ladder up the front to its hatch,
      // the clan's standard
      watchtower:{cell:32,dwellings:0,plan(Q,o){const dw=Q.home('watchtower','defence');Q.flag=true;platform(Q,o,'w',[0,0],11,dw)}},
      // a chief's yurt (the Horde's council hall, 64): a great yurt under a raised crown with bone horns, the clan's standards either
      // side, trophy poles, two fire pits before it, meeting mats on the ground and steps to its door
      chiefyurt:{cell:64,dwellings:0,plan(Q,o){const dw=Q.home('chiefyurt','hall');Q.flag=true;chief(Q,o,[0,-6],15,dw)}},
      // a war camp (the Horde's watch and barracks, 64): the warriors' great yurt, a log watch platform, weapon racks, drums, a signal
      // fire, a run of sharpened palisade on its earth berm behind
      warcamp:{cell:64,dwellings:0,plan(Q,o){const dw=Q.home('warcamp','defence');Q.flag=true;yurt(Q,o,{c:[8,-6],r:11,z:14,dw});platform(Q,o,'w',[-17,-8],11,dw);
        stakes(Q,o,'pl',[-28,28],[-27,-25],9,true);rack(Q,'r1',-20,12);rack(Q,'r2',-8,16);drum(Q,'d1',20,12);drum(Q,'d2',24,15);standard(Q,'st',-2,12,22,1);
        Q.prop('firepit',[8,18],0,2);Q.prop('barrel',[-25,20],0,2);Q.prop('crate',[25,21],0,2)}},
      // horse lines (the Horde's stable, 64): a long hide shelter open to the yard, two tether lines, troughs, a haystack, the herders'
      // yurt, a fence of rough logs
      horselines:{cell:64,dwellings:0,rural:true,plan(Q,o){shelter(Q,o,'s',[-6,-12],36,12,10,'horselines','stable');
        tether(Q,'t1',-24,4,10);tether(Q,'t2',-24,4,18);yurt(Q,o,{c:[18,8],r:8,z:12,dw:Q.home('yurt','home',1,2)});Q.round('hs',[20,-20],5,[0,4],'thatch',{form:'cone',rise:6,mat:'thatch',o:0});Q.prop('trough',[-6,24],0,2);
        Q.fence([[-28,26],[6,26]],null,5,'log')}},
    }},
    // its plans for the shared types, clusters and centres: (Q, o, base), (C, base), {tier: {type} or {kind}}
    types:{
      // --- the 16 px objects ---
      // a tent: a round little yurt of felt under its hide cone, a flap for a door
      tent(Q,o){const dw=Q.home('tent','home'),Y=yd(o);Q.round('t',[0,0],5,[0,5],Y.felt||'canvas',{form:'cone',rise:4,mat:o.roofMat,o:1},{dw});Q.round('tb',[0,0],5.3,[3,4],'ashgorOx',null);Q.dec('t.S','Flap',.5,0);Q.prop('crate',[5,4.5],0,1)},
      // a market stall: goods on a log counter under a hide awning striped red, a skull on its post, a basket of hides beside
      stall(Q,o){const d=o.d,dw=Q.home('stall','trade');Q.box('ct',[-5,5],[0,3],[0,3],'log',{dw,top:true,topMat:d.pick(['crop','linen','gold']),keep:1});
        for(const [a,b] of [[-6,-3],[5,-3],[-6,3],[5,3]])Q.box('po'+a+b,[a,a+1],[b,b+1],[0,6],'timber',{top:true});
        Q.box('aw',[-6,6],[-3.5,4],[6,7],d.pick(['hide','canvasR']),{thin:true,keep:1});Q.roof('aw','shed','u',2,d.pick(['hide','canvasR','canvas']),{o:1,ov:0,hi:'b0'});Q.dec('ct.S','Goods',.5,0);Q.prop(d.pick(['sacks','barrel','crate']),[-3,-1],0,1)},
      // --- 32 px: homes ---
      // a family yurt (the yurt's own plan)
      cottage(Q,o){PX.planKit.plans.yurt(Q,o)},
      // a town's yurt for three households: a great yurt and a lesser one joined at its side, a woodpile, a barrel
      townhouse(Q,o){const d=o.d,dw=Q.home('yurt','home',1),s=d.chance(.5)?1:-1;yurt(Q,o,{n:'y',c:[-s*3.5,1],r:9,dw});yurt(Q,o,{n:'y2',c:[s*8,-6],r:6,z:11,rise:4,dw,wins:false});
        Q.prop('woodpile',[s*11,4],1,1.5);Q.prop('barrel',[-s*12,9],0,1.5);yardOf(Q,o,[-s*3.5,1],9,s)},
      // a fisher's hut: a little yurt on a plank stage on posts, its fish drying on a rack, a round boat of hide upturned, nets
      fisherhut(Q,o){const dw=Q.home('fisherhut'),L=Q.lift;Q.box('st',[-10,4],[-10,6],[2,3],'plank',{top:true,thin:true});for(const [a,b] of [[-10,4],[2,4]])Q.box('sp'+a+b,[a,a+2],[b,b+2],[0,2],'log',{top:true});
        Q.lift=L+3;yurt(Q,o,{c:[-3,-2],r:6.5,z:11,rise:4,dw,ground:true});Q.lift=L;Q.box('sts',[-6,0],[6,9],[0,1],'plank',{top:true});
        for(const a of [6,10])Q.box('rk'+a,[a,a+1.5],[-6,-4.5],[0,8],'timber',{top:true});Q.box('rb',[6,11.5],[-6,-4.5],[7,8],'log',{top:true});Q.cut('fs',6.5,-5.5,3,['nnnn','n.n.','nnnn','n.n.'],{n:'net'},{dv:1});
        Q.round('cr',[8,7],3,[0,2],'hide',{form:'lid',mat:'hide'});Q.prop('nets',[-9,10],0,1.5);Q.prop('barrel',[9,1],0,1.5)},
      // --- 32 px: worship and watch ---
      // a spirit yurt (the Horde's chapel): a yurt of black felt under hide, its crown horned with bone, trophy poles either side of
      // its door, a fire bowl before it, standing bones round it
      chapel(Q,o){const dw=Q.home('chapel','worship'),y=yurt(Q,o,{c:[0,-3],r:8.5,felt:'ashgorBlack',dw,rib:'bone'});raised(Q,o,'cr',[0,-3],y,2.6);
        for(const s of [-1,1]){trophy(Q,'tp'+s,s*10,7,15);Q.prop('tusk',[s*12,-8],0,2)}Q.prop('firepit',[0,10],0,1.5);Q.prop('boulder',[-6,11],0,1)},
      // a log tower: a square of logs on its earth mound, a jutting gallery of planks under a hide pyramid, slits, its door, a standard
      tower(Q,o){const dw=Q.home('tower','defence');Q.flag=true;mound(Q,o,'m',[0,0],10,2);
        sq(Q,'tw',[0,0],10,[0,17],'log',{dw});Q.square('g',[0,0],13,[17,22],'plank',{form:'pyramid',rise:6,mat:o.roofMat,o:1},{dw});
        Q.dec('tw.S','DoorAsh',.5);Q.dec('tw.S','Slit',.5,12);for(const k of ['E','W','N'])Q.dec('tw.'+k,'Slit',.5,9);for(const k of ['S','E','W','N'])Q.dec('g.'+k,'Slit',.5,1);
        if(yd(o).band)Q.dec('g.S','BandAshW',.5,0);standard(Q,'st',8,6,15,1)},
      // --- 32 px: work places ---
      // a forge yurt (the Horde's smithy): a yurt, its smoke vent of iron through the crown, its forge to one side under a hide awning
      // with a hide windbreak: the hearth glowing, leather bellows, the anvil on its stump, charcoal crates, a quench barrel
      smithy(Q,o){const d=o.d,dw=Q.home('smithy','work'),s=d.chance(.5)?1:-1,c=[-s*5,-4],y=yurt(Q,o,{c,r:7.5,z:12,dw});Q.chim(c,y.top-2,y.top+4,2,{mat:'iron'});
        const fu=s*7;Q.box('hb',[fu-3.5,fu+3.5],[1,5],[0,5],'stone',{top:true,topMat:'ember'});Q.dec('hb.S','GlowAsh',.5,0);Q.box('bl',[fu+s*3.5-1.5,fu+s*3.5+1.5],[3,5],[0,2],'hide',{top:true,topMat:'timber'});
        awning(Q,'aw',[fu-6,fu+6],[-2,8],9,'hide');Q.box('wb',s>0?[fu+6,fu+7]:[fu-7,fu-6],[-2,7],[0,7],'hide',{top:true,topMat:'timber'});
        Q.prop('stump',[fu-s*2,11],0,1.2);Q.prop('anvil',[fu-s*2,11],0,1.2,2.4);Q.prop('coal',[-s*12,8],0,1.5);Q.prop('barrel',[fu+s*4,11],0,1.4);yardOf(Q,o,c,7.5,-s)},
      // a farm's barn: rough logs under a wagon roof of hide (a vault, its arched end to the front), its great braced doors there, a
      // wagon wheel leaning by them, hay
      barn(Q,o){const dw=Q.home('barn','store');Q.box('b',[-8,8],[-9,9],[0,10],'log',{dw});Q.roof('b','vault','v',6,o.roofMat,{o:1,ov:1,lip:2});Q.dec('b.S','Barn',.5);Q.dec('b.N','DoorAsh',.5);
        for(const k of ['E','W'])Q.dec('b.'+k,'Hatch',.5,4);Q.wheel('wh',-11,8,3.5,3.5,'timber',1.5);Q.prop('hay',[7,-12],0,1.4);if(yd(o).band)Q.dec('b.S','SkullAsh',.5,11,true)},
      // a raised cache (the Horde's granary): a hide-wrapped store on a plank stage on four log posts, roped round, under a hide cone, a
      // ladder up to its hatch; sacks and barrels below
      granary(Q,o){const dw=Q.home('granary','store'),H=5;for(const [a,b] of [[-6,-5],[6,-5],[-6,5],[6,5]])Q.box('p'+a+b,[a-1,a+1],[b-1,b+1],[0,H],'log',{top:true,dw});
        Q.box('dk',[-8,8],[-7,7],[H,H+1],'plank',{top:true,thin:true,dw});Q.round('g',[0,-1],6.5,[H+1,H+13],o.look.silo,{form:'cone',rise:5,mat:o.roofMat,o:1},{dw});
        for(const z of [H+4,H+9])Q.round('rb'+z,[0,-1],6.8,[z,z+1],'rope',null,{dw});Q.dec('g.S','Hatch',.5,1);Q.cut('ld',-6.5,7,0,Array.from({length:H+1},(_,i)=>i%2?'t.t':'ttt'),{t:'timber'},{dv:2});
        Q.prop('sacks',[-10,9],0,1.4);Q.prop('barrel',[10,9],0,1.4);Q.prop('sacks',[2,1],0,1.2)},
      // a windmill of the Horde: a square of logs under a hide pyramid, four sails of hide on a lattice, its door
      windmill(Q,o){const dw=Q.home('windmill','work');Q.square('m',[0,0],10,[0,14],'log',{form:'pyramid',rise:5,mat:o.roofMat,o:1},{dw});Q.dec('m.S','DoorAsh',.5);for(const k of ['E','W','N'])Q.dec('m.'+k,'WinAsh',.5,8);
        Q.box('hub',[-1,1],[5,8],[11,13],'timber',{top:true});sails(Q,0,6.5,12,12);Q.prop('sacks',[-8,3],0,1.5)},
      // a watermill: a hut of logs under a wagon roof of hide, its wheel turning in the race before it
      watermill(Q,o){const dw=Q.home('watermill','work');Q.box('m',[-12,4],[-10,4],[0,11],'log',{dw});Q.roof('m','vault','u',5,o.roofMat,{o:1,ov:1,lip:2});Q.dec('m.S','DoorAsh',.3);Q.dec('m.E','DoorAsh',.5);Q.dec('m.W','WinAsh',.5,5);
        if(yd(o).band)Q.dec('m.S','BandAshW',.5,6);Q.bed([-15,15],[8,13],'water');Q.wheel('wh',8,7,5,5,'plank',2);Q.prop('sacks',[-8,8],0,1.4)},
      // a guarded supply tent (the Horde's warehouse): a great tent of hide on low felt walls, the clan band along it, its flap door,
      // crates and barrels stacked by it, a weapon rack (its guard's)
      warehouse(Q,o){const dw=Q.home('warehouse','store'),Y=yd(o);Q.box('w',[-9,7],[-9,5],[0,11],Y.felt||'canvas',{dw});Q.roof('w','gable','u',6,o.roofMat,{lip:2,finial:1,fmat:'bone'});
        Q.dec('w.S','DoorAsh',.35);Q.dec('w.N','DoorAsh',.5);for(const k of ['E','W'])Q.dec('w.'+k,'WinAsh',.5,4);if(Y.band)Q.dec('w.S','BandAshW',.5,5);
        Q.prop('crate',[10,-5],0,1.5);Q.prop('crate',[10,-2],0,1.5);Q.prop('barrel',[11,3],0,1.4);rack(Q,'rk',3,9);Q.prop('sacks',[-8,9],0,1.4)},
      // a lumber yard's shed: rough log posts under a hide roof, logs stacked in it, its back wall of logs and door, a sawhorse, a stump
      // and its axe, logs waiting
      lumbershed(Q,o){const dw=Q.home('lumbershed','work');Q.box('bk',[-10,10],[-8,-6],[0,11],'log',{dw});Q.dec('bk.S','DoorAsh',.85);Q.dec('bk.N','DoorAsh',.5);
        for(const a of [-10,-1,8.5])Q.box('po'+a,[a,a+1.5],[6,7.5],[0,10],'log',{top:true});Q.box('rf',[-10,10],[-8,7.5],[10,11],'log',{thin:true});Q.roof('rf','shed','u',4,o.roofMat,{o:1,hi:'b0'});
        Q.prop('logs',[-5,-3],0,1.5);Q.prop('logs',[1,-3],0,1.5);Q.prop('logs',[-2,-3],0,1.5,4.5);Q.cut('sh',-9,10,0,['tttttt','t.tt.t','t.tt.t'],{t:'timber'},{dv:2});Q.prop('stump',[3,11]);Q.box('ax',[4,6],[10,12],[4,5],'iron',{top:true});Q.prop('logs',[9,11],0,1)},
      // a mine: a timbered adit into a rough hill, a hide awning over its mouth on poles, bone tusks either side, rails out of it with a
      // cart of ore, a windlass, spoil
      minehead(Q,o){const rk={desert:'sandrock',swamp:'darkrock'}[o.env]||'rock',moss=o.env==='desert'?0:.35,dw=Q.home('minehead','work'),{crag}=PX.planKit;
        crag(Q,'h',[0,-6],10,4,9,rk,moss,o.seed);crag(Q,'h2',[-9,-2],6,3,6,rk,moss,o.seed+1);Q.box('a',[-5,5],[-2,4],[0,12],rk,{dw,top:true});crag(Q,'h3',[0,-4],5,11,4,rk,moss,o.seed+2);Q.dec('a.S','Adit',.5,0);
        for(const s of [-1,1]){Q.box('po'+s,[s*4.5-1,s*4.5+1],[4,6],[0,10],'log',{top:true,dw});Q.cut('tk'+s,s*6.5-1,5,0,['b.','bb','.b','.b','.b'],{b:'bone'},{dv:2})}Q.box('lt',[-6.5,6.5],[3.5,6.5],[10,12],'log',{top:true,dw});
        Q.box('pr',[-7,7],[2,8],[12,13],'hide',{thin:true});Q.roof('pr','shed','u',2,o.roofMat,{o:1,ov:0,lip:1});
        Q.rails('r',6,13,0,false);Q.prop('minecart',[0,12],0,1.5);Q.cut('wl',8,8,0,['tttt','t..t','t..t'],{t:'timber'},{dv:3});Q.prop('spoil',[-10,8],0,2);Q.prop('boulder',[11,11],0,1.2)},
      // a quarry's shear legs: two logs leaning together over the face, a stay behind, a rope to a hanging stone; the quarrymen's little
      // yurt, cut blocks, a sledge
      crane(Q,o){const dw=Q.home('crane','work');yurt(Q,o,{c:[-7,-4],r:5.5,z:11,rise:4,dw,wins:false});
        Q.beam('l0',[1,-2,0],[5,1,17],'log');Q.beam('l1',[9,-2,0],[5,1,17],'log');Q.beam('st',[5,-8,0],[5,1,16],'timber');Q.box('rp',[5,6],[2,3],[8,17],'rope',{thin:true});
        Q.box('hk',[4.5,6.5],[1.5,3.5],[6,8],'iron',{top:true});Q.box('ld',[3,8],[0,5],[2,6],'stone',{top:true});Q.prop('block',[-4,9],0,1.5);Q.prop('block',[11,8],1,1.5);Q.box('sl',[-12,-4],[7,11],[0,1],'plank',{top:true,thin:true});Q.prop('block',[-8,9],0,1.2,1)},
      // --- 64 px: the big buildings and the centres ---
      // a great spirit lodge (the Horde's church): a great yurt of black felt under hide, a raised crown horned with bone, a ring of
      // trophy poles, standing bones and stones, fire pits and mats before its door
      church(Q,o){const dw=Q.home('church','worship'),c=[0,-6],y=yurt(Q,o,{c,r:14,z:15,felt:'ashgorBlack',dw,rib:'bone'});raised(Q,o,'cr',c,y,4);
        for(const [a,b] of [[-20,-14],[20,-14],[-24,2],[24,2],[-18,16],[18,16]])trophy(Q,'tp'+a+b,a,b,17);for(const [a,b] of [[-26,-4],[26,-4],[-11,20],[11,20]])Q.prop('block',[a,b],1,2);
        for(const s of [-1,1]){Q.prop('firepit',[s*7,15],0,1.8);standard(Q,'st'+s,s*14,10,22,s)}rug(Q,'rg',[-3,3],[9,22])},
      // a feast yurt (the Horde's tavern): a great yurt and its kitchen yurt, a hide awning on posts over the benches beside, kegs, a
      // roasting spit over the fire, its sign a drinking horn on a pole, a tether rail
      tavern(Q,o){const dw=Q.home('tavern','inn',1),c=[-10,-6];yurt(Q,o,{c,r:13,z:14,dw});yurt(Q,o,{n:'k',c:[16,-16],r:7,z:11,rise:4,dw});
        awning(Q,'aw',[6,26],[0,14],10,o.roofMat);for(const [a,b] of [[10,5],[20,5],[10,11],[20,11]])Q.prop('bench',[a,b],0,2);
        for(const [a,b] of [[-26,8],[-24,12],[-27,13]])Q.prop('barrel',[a,b],0,2);Q.prop('firepit',[-6,16],0,2);for(const s of [-1,1])Q.box('sp'+s,[-6+s*4-1,-6+s*4+1],[15,17],[0,7],'timber',{top:true});Q.box('sb',[-11,-1],[15.5,16.5],[5,6],'iron',{top:true});
        Q.box('sn',[3,5],[18,20],[0,16],'timber',{top:true});Q.cut('sh',5,18.5,10,['tttt.','.++++','.+^^+','.++++'],{t:'timber','+':'ashgorOx','^':'bone'},{dv:1});
        Q.box('tr',[16,28],[20,21],[3,4],'log',{top:true});for(const a of [16,27])Q.box('tq'+a,[a,a+1],[20,21],[0,4],'log',{top:true});yardOf(Q,o,c,13)},
      // a clan's long yurt (the Horde's longhouse, four households): the hide hall at the cell's size, three smoke crowns, the band along
      // it; its cooking yard: a fire, a wagon, a woodpile, hay, a lean-to of hide
      longhouse(Q,o){const dw=Q.home('longhouse','home'),Y=yd(o),wall=Y.felt||o.wall;house(Q,{w:30,d:16,c:[0,-2],z:12,form:'vault',rise:8,wall,dw,door:.5,doorKind:Y.fur?'DoorAshFur':o.look.door,wins:0,chim:false,o:1,foot:false});
        if(Y.band)Q.dec('h.S','BandAshW',.5,7);for(const at of [.2,.8])Q.dec('h.S','WinAsh',at,4);
        for(const s of [-1,1])yurt(Q,o,{n:'e'+s,c:[s*15,-2],r:8,z:12,rise:6,dw,door:false,band:false,ground:true});Q.round('mc',[0,-2],1.8,[19,21],'timber',{form:'lid',mat:'dark'});
        hearth(Q,'ck',-14,16);wagon(Q,'wg',12,16,Y.felt||'canvas');Q.prop('woodpile',[-24,-16],0);Q.prop('hay',[24,-14]);awning(Q,'la',[-26,-18],[4,12],7,o.roofMat);yardOf(Q,o,[0,-2],8)},
      // a log keep (the Horde's castle): a great tower of logs on an earth mound, its gallery and hide roof, the chief's yurt beside
      // it, a weapon rack and a stockpile in the yard, drums; walls by its fortification
      keep(Q,o){const d=o.d,f=o.fort|0,dw=Q.home('keep','hall',3),L=d.chance(.5)?-1:1;Q.flag=true;
        mound(Q,o,'mo',[L*9,-12],13,2);
        sq(Q,'dj',[L*9,-12],16,[0,24],'log',{dw});Q.square('dg',[L*9,-12],19,[24,29],'plank',{form:'pyramid',rise:8,mat:o.roofMat,o:1},{dw});Q.dec('dj.S','DoorAsh',.5);Q.dec('dj.S','Slit',.3,13);Q.dec('dj.S','Slit',.7,13);
        for(const k of ['S','E','W','N'])Q.dec('dg.'+k,'Slit',.5,1);if(yd(o).band)Q.dec('dg.S','BandAshW',.5,0);for(const k of ['E','W','N'])Q.dec('dj.'+k,'Slit',.5,13);
        yurt(Q,o,{n:'cy',c:[-L*10,-9],r:9,z:12,dw});rack(Q,'rk',-L*4,8);drum(Q,'dr',L*12,8);Q.prop('barrel',[L*17,10],0,2);Q.prop('crate',[-L*16,10],0,2);
        if(f)walls(Q,o,-28,28,-30,26,f,1);else{wagon(Q,'wg',-L*14,16,'canvas');standard(Q,'st',L*4,14,20,L)}},
      // a log gate (the Horde's gatehouse, straight on): two log watch towers either side of the braced timber gate, a walk over it,
      // sharpened palisades on earth berms either side, the clan's standards, a signal fire on a tower
      gatehouse(Q,o){const dw=Q.home('gatehouse','defence'),h=11;Q.flag=true;
        for(const s of [-1,1]){sq(Q,'t'+s,[s*10,0],9,[0,18],'log',{dw});Q.square('tg'+s,[s*10,0],12,[18,22],'plank',{form:'pyramid',rise:5,mat:o.roofMat,o:1},{dw});Q.dec('t'+s+'.S','Slit',.5,10);Q.dec('tg'+s+'.S','Slit',.5,1);
          stakes(Q,o,'p'+s,s<0?[-30,-15]:[15,30],[-1,1],h,true);standard(Q,'st'+s,s*19,4,22,s)}
        Q.box('g',[-6,6],[-2,2],[0,h+5],'plank',{dw});Q.dec('g.S','GateAsh',.5);Q.box('gw',[-6,6],[-3,3],[h+5,h+7],'log',{top:true,topMat:'plank'});drum(Q,'dr',-14,8);Q.prop('firepit',[14,8],0,1.6);Q.marks.gate=[0,2,0]},
      // a clan's gathering ground (the village's centre, straight on): the chief's yurt at the back, the council fire on its mats
      // before it, trophy poles, a stockpile; fortified, a palisade round it all, its gate at the front
      village(Q,o){const f=(o.fort|0)>0,dw=Q.home('village','hall',1);Q.flag=true;chief(Q,o,[0,-12],12,dw,true);
        Q.prop('firepit',[0,10],0,2);for(const [u0,v0] of [[-9,8],[5,8]])rug(Q,'m'+u0,[u0,u0+4],[v0,v0+5]);Q.prop('sacks',[-19,8],0,2);Q.prop('barrel',[19,9],0,2);Q.prop('crate',[21,13],0,1.6);
        if(f)walls(Q,o,-29,29,-30,27,1,1);else Q.marks.gate=[0,28,0]},
      // a wagon-fort (the town's centre, straight on; a city's at 128, spec.capital): the chief's great yurt among the clan's specialist
      // yurts round the council fire, a ring of covered wagons inside, stockpiles; walls by its fortification (a capital's three, its
      // great yurt on an earth mound)
      citadel(Q,o){const d=o.d,k=o.capital?2:1,f=o.fort|0,dw=Q.home('citadel','hall',3),Y=yd(o);Q.flag=true;
        if(o.capital){mound(Q,o,'mo',[0,-22],24,3);Q.lift=3;chief(Q,o,[0,-24],17,dw,true);Q.lift=0;
          for(const [a,b,r] of [[-38,-30,9],[38,-30,9],[-44,-6,8],[44,-6,8],[-40,18,8],[40,18,8],[-20,30,7],[20,30,7]])yurt(Q,o,{n:'y'+a+b,c:[a,b],r,z:12,dw});
          for(const [a,b] of [[-14,8],[14,8],[0,-50],[-26,-46],[26,-46]])wagon(Q,'wg'+a+b,a,b,Y.felt||'canvas');Q.prop('firepit',[0,16],0,2.5);for(const s of [-1,1])rug(Q,'rg'+s,[s*7-3,s*7+3],[12,20])}
        else{chief(Q,o,[0,-10],11,dw,true);for(const s of [-1,1])yurt(Q,o,{n:'y'+s,c:[s*19,-6],r:6,z:11,rise:4,dw});
          for(const [a,b] of [[-15,13],[15,13]])wagon(Q,'wg'+a,a,b,Y.felt||'canvas');Q.prop('firepit',[0,14],0,1.8);Q.prop('barrel',[-22,8],0,1.6);Q.prop('sacks',[22,8],0,1.6)}
        if(f||o.capital)walls(Q,o,-29*k,29*k,o.capital?-60:-30,27*k,f||3,k);else Q.marks.gate=[0,27*k,0]},
    },
    clusters:{
      // a town's row: family yurts along the street, a fence of logs behind them, a wagon, a cooking fire, a woodpile
      row(C){C.Q.ground=null;const d=C.d;for(const [u,k] of [[-20,0],[0,1],[20,2]])famYurt(C,[u,k===1?12:15],0,8.5);
        here(C,Q=>{wagon(Q,'wg',d.pick([-14,10]),-17,'canvas');hearth(Q,'ck',d.pick([-2,20]),-20)});logFence(C,'yf',[[-30,-6],[30,-6]]);P(C,'woodpile',[24,-26]);P(C,'barrel',[-26,-24])},
      // a hamlet's yard: two family yurts, their cooking yard, a wagon, a haystack, a fence of logs round it all
      yard(C){piece(C,'yurt',[-12,-12],0);famYurt(C,[14,10],3,7.5);piece(C,'haystack',[-20,16],0);here(C,Q=>wagon(Q,'wg',10,-20,'canvas'));logFence(C,'yf',[[-30,28],[30,28],[30,-29],[-30,-29],[-30,28]],[[-4,4,0]])},
      // a farmstead: the family yurt, its barn of logs under a wagon roof, a haystack, a cart, a field's rows, a fence of logs
      farmstead(C){piece(C,'yurt',[-13,-15],0);piece(C,'barn',[15,-6],1);piece(C,'haystack',[-22,12],0);piece(C,'cart',[2,16],0);P(C,'trough',[-2,0]);
        C.Q.parts.push({k:'bed',name:'f1',u:[-30,-12],v:[20,29]},{k:'bed',name:'f2',u:[8,29],v:[18,29]});logFence(C,'yf',[[-30,4],[-30,18]])},
      // a smithy yard: the forge yurt to the street, the smith's family yurt behind, charcoal, a woodpile, a weapon rack
      smithy(C){piece(C,'smithy',[-6,14],0);famYurt(C,[14,-16],0,7.5);piece(C,'woodpile',[22,12],0);P(C,'coal',[-22,-18]);here(C,Q=>rack(Q,'rk',-14,-6))},
      // an inn: the feast yurt on the street, its sign; the hide stable shelter across the yard, a tether line, the water
      inn(C){made(C,[-8,12],0,Q=>{yurt(Q,Q.o,{r:12,z:14,dw:Q.home('inn','inn')});Q.box('sn',[13,15],[10,12],[0,15],'timber',{top:true});Q.cut('sh',15,10.5,9,['tttt.','.++++','.+^^+','.++++'],{t:'timber','+':'ashgorOx','^':'bone'},{dv:1});Q.prop('barrel',[-14,9],0,2)});
        made(C,[10,-18],0,Q=>shelter(Q,Q.o,'s',[0,0],24,10,9,'stable','stable'));here(C,Q=>tether(Q,'tt',12,28,6));piece(C,'barrels',[-24,-16],0)},
      // a spirit yurt's ground: the spirit yurt, a ring of trophy poles and cairns, the shaman's family yurt
      chapel(C){piece(C,'chapel',[-10,-8],0);famYurt(C,[17,-16],0,6.5);here(C,Q=>{for(const [a,b] of [[6,8],[18,8],[6,22],[18,22]])trophy(Q,'tp'+a+b,a,b,14)});for(const [a,b] of [[12,6],[24,15],[12,26]])P(C,'boulder',[a,b],0,2)},
      // a market: stalls under hide awnings round the fire, covered wagons selling from their tails, barrels and crates
      market(C){C.Q.ground=null;piece(C,'stall',[-18,-20],0);piece(C,'stall',[2,-22],0);piece(C,'stall',[-22,4],3);piece(C,'stall',[22,0],1);piece(C,'wagon',[18,-20],0);piece(C,'wagon',[-14,22],0);
        fire(C,[0,2]);piece(C,'crates',[14,22],0);piece(C,'barrels',[2,24],0);here(C,Q=>standard(Q,'st',-8,-6,20,1))},
      // a mill: the watermill on its race, the raised cache, sacks and a cart
      mill(C){piece(C,'watermill',[-8,12],0);piece(C,'granary',[16,-16],0);P(C,'sacks',[14,4]);piece(C,'cart',[-20,-18],0)},
      // a lumber yard: the log shed, the woodcutters' yurt, stumps, a woodpile, a cart
      lumber(C){piece(C,'lumbershed',[-6,14],0);famYurt(C,[14,-17],0,7);P(C,'stump',[-22,-14]);P(C,'stump',[-14,-24]);piece(C,'woodpile',[22,10],0);piece(C,'cart',[-20,-4],0)},
      // a mine: the adit, the miners' yurt, spoil, barrels
      mine(C){piece(C,'minehead',[-6,8],0);famYurt(C,[16,-17],0,7);P(C,'spoil',[22,14]);piece(C,'barrels',[-24,-20],0)},
      // a quarry: the shear legs over cut blocks before a face of rock, a sledge of stone, a cart
      quarry(C){C.Q.parts.push({k:'tower',name:'rk',round:true,c:[-12,-20],r:12,z:[0,10],wall:'rock',roof:{form:'cone',rise:8,mat:'rock',o:0,lip:0,moss:C.o.env==='desert'?0:.3},rough:.6,rs:C.spec.seed|0});
        piece(C,'crane',[-2,8],0);famYurt(C,[18,-16],0,7);P(C,'block',[-22,18]);P(C,'block',[-16,24],1);piece(C,'cart',[18,18],0)},
      // a fishing camp (the Horde's port): two fishers' huts on their stages, nets, barrels
      fishery(C){piece(C,'fisherhut',[-14,-14],0);piece(C,'fisherhut',[12,12],0);P(C,'nets',[-14,12]);P(C,'nets',[18,-18],1);piece(C,'barrels',[-22,24],0)},
      // a herd pen (the Horde's pasture): a pen of rough logs with its gate, a hide shelter in it, a tether line, a trough, a haystack,
      // the clan's standards at its gate
      pasture(C){made(C,[-12,-14],0,Q=>shelter(Q,Q.o,'s',[0,0],20,10,8,'shelter','stable'));logFence(C,'pd',[[-28,28],[28,28],[28,-26],[-28,-26],[-28,28]],[[-4,4,0]]);
        here(C,Q=>{tether(Q,'tt',8,24,-14);for(const s of [-1,1])standard(Q,'st'+s,s*7,26,16,s)});P(C,'trough',[12,6]);piece(C,'haystack',[18,16],0)},
      // a brew yurt (the Horde's brewery): the brewers' yurt, great vats, kegs, a cauldron on its fire, a rack of drying herbs
      brewery(C){made(C,[-10,-10],0,Q=>yurt(Q,Q.o,{r:10,z:13,dw:Q.home('brewery','work')}));here(C,Q=>{vat(Q,'v1',12,-14,4);vat(Q,'v2',22,-8,3.5);hearth(Q,'ck',10,10);
        Q.cut('hr',16,20,0,['tttttttt','.c.c.c.c','tttttttt','.c.c.c.c','t......t'],{t:'timber',c:'crop'},{dv:1})});piece(C,'barrels',[-20,18],0);piece(C,'barrels',[24,14],0)},
      // the clan's stores (the Horde's granary): covered wagons drawn up, the raised cache, a guarded tent, barrels and sacks
      granary(C){piece(C,'granary',[-14,-14],0);piece(C,'wagon',[12,-20],0);piece(C,'wagon',[14,-6],0);piece(C,'wagon',[-18,14],0);piece(C,'tent',[12,14],0);P(C,'sacks',[0,4]);P(C,'barrel',[-2,22]);
        here(C,Q=>standard(Q,'st',24,22,18,-1))},
      // a workshop yard: the supply tent, the leatherworkers' yurt, tanning frames, crates
      workshop(C){piece(C,'warehouse',[-6,14],0);made(C,[14,-16],0,Q=>yurt(Q,Q.o,{r:8,z:12,dw:Q.home('workshop','work')}));here(C,Q=>{tanning(Q,'tf1',-20,-16);tanning(Q,'tf2',-8,-20)});piece(C,'crates',[24,8],0)},
      // a town quarter (128): family yurts in rows along two lanes, fences of logs behind, wagons, cooking fires, a well
      quarter(C){C.Q.ground=null;const d=C.d;for(const v of [-42,2,46])for(const u of [-48,-24,24,48])famYurt(C,[u+d.pick([-2,0,2]),v+d.pick([-2,0,2])],0,8.5);
        here(C,Q=>{for(const v of [-22,22]){wagon(Q,'wg'+v,-8,v,'canvas');hearth(Q,'ck'+v,8,v+4)}});for(const v of [-58,-14,30]){logFence(C,'f'+v,[[-60,v],[-12,v]]);logFence(C,'g'+v,[[12,v],[60,v]])}piece(C,'well',[0,0],0)}
    },centres:{}});
  // the chief's yurt at c (R its radius): its raised crown, standards, trophy poles, fire pits, meeting mats and steps before its door;
  // small: less round it (a village's)
  function chief(Q,o,c,R,dw,small){const y=yurt(Q,o,{c,r:R,z:R>=14?16:14,dw});raised(Q,o,'cr',c,y,R*.26);const [cu,cv]=c,f=cv+R;
    Q.box('stp',[cu-3,cu+3],[f+.5,f+2.5],[0,1],'plank',{top:true});for(const s of [-1,1]){standard(Q,'st'+s,cu+s*(R+3),cv+R*.4,R+10,s);if(!small)trophy(Q,'tp'+s,cu+s*(R*.55),f+6,15)}
    if(!small){for(const s of [-1,1])Q.prop('firepit',[cu+s*8,f+10],0,1.8);rug(Q,'rg',[cu-4,cu+4],[f+3,f+11])}}
  // a windmill's four sails of hide: an X of spars round the hub (u, z), the hide to one side of each on a lattice, 3 px deep in v
  function sails(Q,u,v,z,L){const rows=[];for(let j=L;j>=-L;j--){let s='';for(let i=-L;i<=L;i++){let ch='.';
      for(let k=0;k<4;k++){const a=Math.PI/4+k*Math.PI/2,al=i*Math.cos(a)+j*Math.sin(a),ac=-i*Math.sin(a)+j*Math.cos(a);if(al<1.5||al>L+.5)continue;
        if(Math.abs(ac)<.7){ch='w';break}if(ac>0&&ac<4.6&&al>3.5)ch=ac>3.7||Math.round(al)%3===0?'b':'c'}s+=ch}rows.push(s)}
    Q.cut('sl',u-L-.5,v,z-L,rows,{w:'timber',b:'timber',c:'canvas'},{dv:3,top:false})}
})(window.PX=window.PX||{});
